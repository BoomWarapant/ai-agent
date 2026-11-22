"""Persist just the two Space API source mounts on a personal Compose installation."""
from contextlib import contextmanager
from copy import deepcopy
import json
import os
from pathlib import Path
import re
import shutil
import tempfile


def atomic_write(path, data):
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as stage:
        stage.write(data)
        os.fchmod(stage.fileno(), path.stat().st_mode & 0o777)
    os.replace(stage.name, path)


@contextmanager
def space_api(run, compose, old_config, cwd, backup, image):
    targets = ("/app/packages/contracts/src/rpc.ts", "/app/apps/api/src/router.ts")
    override = cwd / "docker-compose.override.yml"
    if str(override) not in compose:
        raise RuntimeError("Active stack does not use the personal override")
    original = override.read_bytes()
    config_text = original.decode("utf8")
    service = re.search(r"(?m)^  api:[ \t]*\r?$", config_text)
    if not service:
        raise RuntimeError("API service missing from personal override")
    api = run(*compose, "ps", "-q", "api", capture=True).strip()
    if not api or "\n" in api:
        raise RuntimeError("Expected one running API service")
    files = backup / "space-api"
    files.mkdir()
    originals = {}
    for target in targets:
        path = files / Path(target).name
        run("docker", "cp", api + ":" + target, str(path))
        path.chmod(0o644)
        originals[target] = path.read_bytes()
    run("docker", "run", "--rm", "--network", "none", "--user", f"{os.getuid()}:{os.getgid()}",
        "-v", str(files) + ":/sources", "--entrypoint", "node", image, "/tmp/patch-space-api.mjs",
        "/sources/rpc.ts", "/sources/router.ts")
    marker = r"(?m)^    extends: \{file: \./office-upgrade-[\w-]+/space-api\.json, service: api\} # CRD Space API\r?\n"
    if re.search(marker, config_text) and all(originals[t] == (files / Path(t).name).read_bytes() for t in targets):
        yield
        return
    volumes = [{"type": "bind", "source": str(files / Path(t).name), "target": t, "read_only": True} for t in targets]
    (backup / "space-api.json").write_text(json.dumps({"services": {"api": {"volumes": volumes}}}))
    line = f"    extends: {{file: ./{backup.name}/space-api.json, service: api}} # CRD Space API\n"
    if re.search(marker, config_text):
        updated = re.sub(marker, line, config_text, count=1)
    else:
        updated = config_text[:service.end()] + "\n" + line.rstrip("\n") + config_text[service.end():]
    shutil.copy2(override, backup / override.name)
    if override.read_bytes() != original:
        raise RuntimeError("Compose configuration changed during update")
    atomic_write(override, updated.encode("utf8"))
    up = [*compose, "up", "-d", "--no-deps", "--pull", "never", "--no-build", "--wait", "--wait-timeout", "180", "api"]
    restarted = False
    try:
        expected = deepcopy(old_config)
        actual = json.loads(run(*compose, "config", "--format", "json", capture=True))
        selected = [v for v in actual["services"]["api"]["volumes"] if v["target"] in targets]
        for mount in volumes:
            if not any(all(v.get(k) == val for k, val in mount.items()) for v in selected):
                raise RuntimeError("Space API mount is overridden in active Compose configuration")
        for config in (actual, expected):
            mounts = config["services"]["api"]["volumes"]
            mounts[:] = sorted((v for v in mounts if v["target"] not in targets), key=lambda v: v["target"])
        if actual != expected:
            raise RuntimeError("Unexpected difference in active Compose configuration")
        restarted = True
        run(*up)
        yield
    except BaseException:
        atomic_write(override, original)
        if restarted:
            run(*up)
        raise
