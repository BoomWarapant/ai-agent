"""Apply the team's reply preference without rebuilding the web application."""
import json
from pathlib import Path
import subprocess


def main():
    profiles = json.loads((Path(__file__).resolve().parents[2] /
                           "team-installer/app/team-bots.json").read_bytes())
    prefix = "ตรวจสอบข้อมูลก่อนตอบครับ"
    policy = prefix + profiles[0]["instructions"].split(prefix, 1)[1].split(" ใช้ข้อมูล", 1)[0]
    literal = "'" + policy.replace("'", "''") + "'"
    names = ", ".join("'" + b["name"].replace("'", "''") + "'" for b in profiles)
    sql = f"""
    BEGIN;
    CREATE TEMP TABLE office ON COMMIT DROP AS
      SELECT b."spaceId", b."userId" FROM bots b JOIN deployment_settings d
      ON d."ownerUserId"=b."userId" WHERE d.id='default' AND b.name='neo' AND b."archivedAt" IS NULL;
    DO $$ BEGIN
      IF (SELECT count(*) FROM office) <> 1 THEN RAISE EXCEPTION 'Expected one active office'; END IF;
    END $$;
    UPDATE bots b SET instructions=replace(
      regexp_replace(b.instructions, '(?n)^-.*(ปิดท้ายทุกคำตอบ|ทุกครั้งที่รายงานผล).*หลักฐาน:.*$', '', 'g'),
      'ระบุโครงการ งวดข้อมูล แหล่งอ้างอิง และข้อที่ยังต้องยืนยัน',
      'ระบุโครงการ งวดข้อมูล และข้อที่ยังต้องยืนยัน') || chr(10) || {literal},
      "updatedAt"=CURRENT_TIMESTAMP
      FROM office o WHERE b."spaceId"=o."spaceId" AND b."userId"=o."userId"
      AND b."archivedAt" IS NULL AND b.name IN ({names}) AND strpos(b.instructions,{literal})=0;
    SELECT 'Reply style ready: ' || string_agg(b.name, ', ' ORDER BY b.name)
      FROM bots b JOIN office o USING ("spaceId","userId")
      WHERE b."archivedAt" IS NULL AND b.name IN ({names}) AND strpos(b.instructions,{literal})>0;
    COMMIT;
    """
    container = subprocess.check_output(["docker", "ps", "-q", "--filter",
        "label=com.docker.compose.project=rakazo", "--filter",
        "label=com.docker.compose.service=postgres"], text=True).split()
    if len(container) != 1:
        raise SystemExit("Expected one running rakazo postgres service")
    subprocess.run(["docker","exec","-i",container[0],"sh","-c",
        'exec psql -XqAt -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'],
        input=sql.encode(),check=True)


if __name__ == "__main__":
    main()
