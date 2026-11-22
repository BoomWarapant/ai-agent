"""Upgrade the local Rakazo web UI and existing neo/swift roles in place."""
from contextlib import nullcontext
from http.client import IncompleteRead
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
from urllib.error import HTTPError
from urllib.request import build_opener, ProxyHandler, Request


def run(*args, data=None, capture=False):
    return subprocess.run(args, input=data, text=True, check=True,
                          stdout=subprocess.PIPE if capture else None).stdout


def verify_office(port, expected, path="project-office.html"):
    url = f"http://127.0.0.1:{int(port)}/{path}"
    opener = build_opener(ProxyHandler({}))
    deadline = time.monotonic() + 60
    while True:
        try:
            with opener.open(url, timeout=4) as response:
                if response.status != 200 or response.read(len(expected) + 1) != expected:
                    raise RuntimeError(f"Served file differs from package: {path}")
            return
        except HTTPError as exc:
            if exc.code not in (502, 503, 504):
                raise
            reason = str(exc)
        except (OSError, IncompleteRead) as exc:
            reason = str(exc)
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise RuntimeError(f"Office did not respond at {url}: {reason}")
        time.sleep(min(2, remaining))


def verify_space_routes(port):
    opener = build_opener(ProxyHandler({}))
    for name in ("rename", "deletionContents"):
        # No session and no target ID: this request cannot modify any Space.
        req = Request(f"http://127.0.0.1:{int(port)}/rpc/spaces/{name}", data=b'{"json":{}}',
                      headers={"Content-Type": "application/json"})
        try:
            with opener.open(req, timeout=8):
                pass
        except HTTPError as exc:
            if exc.code == 401 and json.loads(exc.read()).get("json", {}).get("code") == "UNAUTHORIZED":
                continue
            raise RuntimeError(f"Space API route {name} returned HTTP {exc.code}") from exc
        raise RuntimeError(f"Unexpected anonymous response for Space API route {name}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scene-only", action="store_true", help="Update the existing office scene and preserve bot settings")
    parser.add_argument("--client-only", action="store_true", help="Update UI and slash commands, preserving bots")
    parser.add_argument("--routines", action="store_true", help="Update the bot UI and start the background routine worker")
    parser.add_argument("--workspace-tools", action="store_true", help="Update chat UI, sync local CRD skills and configure private memories")
    parser.add_argument("--skill", action="append", default=[], help="Import a named local skill instead of the default CRD set")
    args = parser.parse_args()
    if args.routines:
        args.client_only = True
    if args.skill and not args.workspace_tools:
        parser.error("--skill requires --workspace-tools")
    if args.scene_only and (args.workspace_tools or args.client_only):
        parser.error("--scene-only cannot be combined with a client update")
    scene_only = args.scene_only
    update_roles = not (scene_only or args.client_only or args.workspace_tools)
    os.umask(0o077)
    source = Path(__file__).resolve().parents[2] / "team-installer"
    cwd = Path("/home/rakazo/rakazo")
    os.chdir(cwd)
    web = run("docker", "ps", "-q", "--filter", "label=com.docker.compose.project=rakazo",
              "--filter", "label=com.docker.compose.service=web", capture=True).split()
    if len(web) != 1:
        sys.exit("Expected one running rakazo web container")
    info = json.loads(run("docker", "inspect", web[0], capture=True))[0]
    labels = info["Config"]["Labels"]
    if Path(labels["com.docker.compose.project.working_dir"]).resolve() != cwd:
        sys.exit("Unexpected Compose project directory")
    compose = ["docker", "compose", "-p", "rakazo", "--project-directory", str(cwd)]
    for filename in labels["com.docker.compose.project.config_files"].split(","):
        path = Path(filename).resolve()
        if cwd not in path.parents or not path.is_file():
            sys.exit(f"Cannot verify active configuration: {path}")
        compose.extend(["-f", str(path)])
    tag = info["Config"]["Image"]
    if not re.fullmatch(r"crd/[a-zA-Z0-9._/-]+:[a-zA-Z0-9._-]+", tag):
        sys.exit(f"Expected a local CRD web image, found {tag}")
    config = json.loads(run(*compose, "config", "--format", "json", capture=True))
    if args.routines:
        for service in ("api", "worker"):
            if service not in config["services"]:
                sys.exit(f"Missing Compose service: {service}")
            if config["services"][service].get("environment", {}).get("WAKEUP_DRIVER") == "memory":
                sys.exit(f"Expected the persistent Graphile job queue for {service}")
    if config["services"]["web"]["image"] != tag:
        sys.exit("Configured web image differs from running image")
    old = info["Image"]
    if run("docker", "image", "inspect", "-f", "{{.Id}}", tag, capture=True).strip() != old:
        sys.exit("Local web tag differs from running image")

    pg = [*compose, "exec", "-T", "postgres", "sh", "-c",
          'exec psql -XqAt -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"']
    if args.workspace_tools:
        # Existing owners can install this release directly from the two-bot office.
        found = run(*pg, data="""SELECT count(*) FROM spaces s JOIN deployment_settings d
          ON s."createdByUserId"=d."ownerUserId" WHERE d.id='default' AND (s.name='CRD Project Office' OR EXISTS
          (SELECT 1 FROM bots b WHERE b."spaceId"=s.id AND b."spawnKey" LIKE 'crd-team-v1:%'));""", capture=True)
        update_roles = found.strip() == "0"
    backup = Path(tempfile.mkdtemp(prefix="office-upgrade-", dir=cwd))
    if update_roles:
        query = """WITH affected AS (
          SELECT DISTINCT s.id,s.name FROM spaces s JOIN bots b ON b."spaceId"=s.id
          JOIN deployment_settings d ON d."ownerUserId"=b."userId" AND d.id='default'
          WHERE (b.name='neo' AND b."archivedAt" IS NULL) OR s.name IN ('Research Lab','CRD · ประวัติงานวิจัย'))
          SELECT json_build_object('spaces',(SELECT json_agg(a) FROM affected a),
          'bots',(SELECT json_agg(b) FROM (SELECT id,name,title,description,instructions,position,"sectionId","archivedAt"
          FROM bots WHERE "spaceId" IN (SELECT id FROM affected) AND "userId"=(SELECT "ownerUserId" FROM deployment_settings WHERE id='default')) b),
          'routines',(SELECT json_agg(r) FROM (SELECT id,active FROM routines WHERE "spaceId" IN (SELECT id FROM affected)
          AND "userId"=(SELECT "ownerUserId" FROM deployment_settings WHERE id='default')) r));"""
        (backup / "roles.json").write_text(run(*pg, data=query, capture=True), encoding="utf8")
    retained = "crd/office-backup:" + old.split(":")[1][:16]
    run("docker", "tag", old, retained)
    if update_roles:
        print(f"Original roles: {backup}/roles.json", flush=True)
    print(f"Original web image: {retained}", flush=True)

    with tempfile.TemporaryDirectory() as tmp:
        ctx = Path(tmp)
        for file in ("ProjectOffice.tsx", "project-office.html", "patch-commands.mjs", "crd-space-navigation.ts",
                     "patch-space-ui.mjs", "patch-space-api.mjs", "RenameSpaceDialog.tsx",
                     "bot-avatar.tsx", "crd-portraits.ts", "crd-version.json", "CrdBotBrief.tsx", "CrdAvatarPicker.tsx"):
            shutil.copy(source / "app" / file, ctx)
        shutil.copytree(source / "app/branding", ctx / "branding")
        # Patch the currently deployed source to retain its avatars and branding.
        run("docker", "cp", web[0] + ":/app/apps/web/src/pages/Shell.tsx", str(ctx / "Shell.tsx"))
        shell = (ctx / "Shell.tsx").read_text()
        slot = '          <div className="flex items-center gap-1">\n            {!inGroup ? ('
        if '<ProjectOffice bots={bots} openBot={openBot}' not in shell:
            if scene_only:
                sys.exit("Install the office toolbar before updating the scene")
            if shell.count(slot) != 1:
                sys.exit("Unsupported web toolbar. Running deployment unchanged.")
            shell = 'import { ProjectOffice } from "./ProjectOffice";\n' + shell.replace(
                slot, slot.replace("{!inGroup ? (", "<ProjectOffice bots={bots} openBot={openBot} />\n            {!inGroup ? ("))
        (ctx / "Shell.tsx").write_text(shell)
        (ctx / "Dockerfile").write_text(f"""FROM {retained}
USER root
COPY --chmod=644 bot-avatar.tsx crd-portraits.ts /app/packages/ui-web/src/
COPY --chmod=755 branding/ /app/apps/web/public/
COPY --chmod=644 Shell.tsx ProjectOffice.tsx crd-space-navigation.ts crd-version.json /app/apps/web/src/pages/
COPY --chmod=644 CrdBotBrief.tsx CrdAvatarPicker.tsx RenameSpaceDialog.tsx /app/apps/web/src/pages/
COPY --chmod=644 project-office.html /app/apps/web/public/
COPY --chmod=644 patch-commands.mjs patch-space-api.mjs patch-space-ui.mjs /tmp/
RUN sed -i 's/neo-cat-20261029/crd-1.0.0/g' /app/apps/web/index.html && node /tmp/patch-commands.mjs && node /tmp/patch-space-api.mjs && node /tmp/patch-space-ui.mjs && cd /app && pnpm --filter @rakazo/web build && test -s apps/web/dist/project-office.html
USER node
RUN test -r /app/apps/web/dist/project-office.html
RUN for role in neo swift civil arch mep scout qs; do test -r /app/apps/web/dist/crd-avatars/$role.png || exit 1; done
""")
        if scene_only:
            (ctx / "Dockerfile").write_text(f"""FROM {retained}
COPY --chmod=644 project-office.html /app/apps/web/public/project-office.html
COPY --chmod=644 project-office.html /app/apps/web/dist/project-office.html
COPY --chmod=755 branding/crd-avatars/ /app/apps/web/public/crd-avatars/
COPY --chmod=755 branding/crd-avatars/ /app/apps/web/dist/crd-avatars/
RUN test -r /app/apps/web/dist/project-office.html
""")
        stage = "crd/project-office:" + backup.name
        run("docker", "build", "-t", stage, str(ctx))

    profiles = json.loads((source / "app/team-bots.json").read_text())
    calculator = (source / "computer/project_status.py").read_text()
    deploy = [*compose, "up", "-d", "--no-deps", "--pull", "never", "--no-build", "--wait",
              "--wait-timeout", "180", "web"]
    from space_api_overlay import space_api
    backend = nullcontext() if scene_only else space_api(run, compose, config, cwd, backup, stage)
    try:
        with backend:
            run("docker", "tag", stage, tag)
            run(*deploy)
            port = run(*compose, "port", "web", "5173", capture=True).strip().rsplit(":", 1)[1]
            print(f"Waiting for office HTTP response on port {port} ...", flush=True)
            verify_office(port, (source / "app/project-office.html").read_bytes())
            if not scene_only:
                index_html = subprocess.check_output([*compose, "exec", "-T", "web", "cat", "/app/apps/web/dist/index.html"])
                verify_office(port, index_html, "app")
                verify_space_routes(port)
                print("Space management API verified.", flush=True)
            for portrait in sorted((source / "app/branding/crd-avatars").glob("*.png")):
                verify_office(port, portrait.read_bytes(), "crd-avatars/" + portrait.name)
            if args.routines:
                run(*compose, "up", "-d", "--no-deps", "--no-recreate", "--pull", "never", "--no-build",
                    "--wait", "--wait-timeout", "90", "worker")
                print("Routine worker running with persistent Graphile scheduling.", flush=True)
            if update_roles:
                payload = json.dumps({"profiles": profiles, "calculator": calculator})
                migration = Path(__file__).with_name("unify-office.mjs").read_text(encoding="utf8")
                run(*compose, "exec", "-T", "-w", "/app/apps/api", "api", "pnpm", "exec", "tsx",
                    "--input-type=module", "-", data="const officeInput = "+payload+";\n"+migration)
    except BaseException:
        subprocess.run([*compose, "logs", "--no-color", "--tail", "25", "web"], check=False)
        print("Restoring previous web image.", flush=True)
        run("docker", "tag", retained, tag)
        run(*deploy)
        raise
    if args.workspace_tools:
        from import_local_skills import install
        package = Path(__file__).resolve()
        user_dir = next((parent for parent in package.parents if (parent / ".agents/skills").is_dir() or (parent / ".codex/skills").is_dir()), None)
        if user_dir is None:
            raise RuntimeError("Cannot locate local Windows skill directories from package path")
        install(compose,user_dir,args.skill)
    if not update_roles:
        print(f"Office UI verified. Open http://127.0.0.1:{port}/app")
        return
    print(f"Office verified. CRD team and themes updated. Open http://127.0.0.1:{port}/app")


if __name__ == "__main__":
    main()
