"""Read cumulative WBS snapshots from an Excel UTF-8 CSV export."""
import argparse
import csv
from datetime import date
from decimal import Decimal
import json
import re
import sys


FIELDS = "project as_of wbs activity budget_thb plan_pct actual_pct cost_thb open_ncr owner source".split()


def amount(value, field):
    if not re.fullmatch(r"[0-9]{1,15}(?:\.[0-9]{1,2})?", value):
        raise ValueError(f"{field} ต้องเป็นเลขไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง")
    number = Decimal(value)
    if field.endswith("_pct") and number > 100:
        raise ValueError(f"{field} เกิน 100")
    return number


def iso_day(value):
    parsed = date.fromisoformat(value)
    if parsed.isoformat() != value:
        raise ValueError("วันที่ต้องใช้ YYYY-MM-DD")
    return parsed


def snapshots(stream, project, cutoff):
    reader = csv.DictReader(stream, strict=True)
    headers = reader.fieldnames or []
    if set(FIELDS) - set(headers) or len(set(headers)) != len(headers):
        raise ValueError("ตรวจชื่อคอลัมน์ที่จำเป็น: " + ", ".join(FIELDS))
    periods = {}
    for row in reader:
        try:
            if None in row or any(row[k] is None for k in FIELDS):
                raise ValueError("จำนวนช่องไม่ตรงกับหัวตาราง")
            finish_dates = [(row.get(k) or "").strip() for k in ("baseline_finish", "forecast_finish")]
            row = {k: row[k].strip() for k in FIELDS}
            if not row["project"]:
                raise ValueError("ขาดรหัสโครงการ")
            if row["project"] != project:
                continue
            day = iso_day(row["as_of"])
            if cutoff and day > cutoff:
                continue
            if not all(row.values()):
                raise ValueError("มีช่องว่างในข้อมูลที่จำเป็น")
            for key in ("budget_thb", "plan_pct", "actual_pct", "cost_thb"):
                row[key] = amount(row[key], key)
            if not re.fullmatch(r"[0-9]+", row["open_ncr"]):
                raise ValueError("open_ncr ต้องเป็นจำนวนเต็มไม่ติดลบ")
            row["open_ncr"] = int(row["open_ncr"])
            if any(finish_dates):
                if not all(finish_dates):
                    raise ValueError("ต้องระบุทั้ง baseline_finish และ forecast_finish")
                baseline, forecast = map(iso_day, finish_dates)
                row.update(baseline_finish=baseline.isoformat(), forecast_finish=forecast.isoformat(),
                           finish_slip_days=(forecast - baseline).days)
            period = periods.setdefault(day, {})
            if row["wbs"] in period:
                raise ValueError("WBS ซ้ำในงวดเดียวกัน")
            period[row["wbs"]] = row
        except ValueError as exc:
            raise ValueError(f"บรรทัด {reader.line_num}: {exc}") from exc
    if not periods:
        raise ValueError("ไม่พบงวดของโครงการภายในวันที่เลือก")
    return periods


def metrics(period):
    rows = period.values()
    budget = sum(r["budget_thb"] for r in rows)
    if not budget:
        raise ValueError("งบรวมเป็นศูนย์ ถ่วงน้ำหนักความก้าวหน้าไม่ได้")
    planned = sum(r["budget_thb"] * r["plan_pct"] for r in rows)
    earned = sum(r["budget_thb"] * r["actual_pct"] for r in rows)
    cost = sum(r["cost_thb"] for r in rows)
    return {"budget_thb": budget, "planned_pct": planned / budget,
            "actual_pct": earned / budget, "gap_pp": (earned - planned) / budget,
            "earned_value_thb": earned / 100, "cost_thb": cost,
            "cost_variance_thb": earned / 100 - cost,
            "open_ncr": sum(r["open_ncr"] for r in rows)}


def report(periods, project):
    days = sorted(periods)
    current = periods[days[-1]]
    summary = metrics(current)
    actions = []
    for row in current.values():
        gap = row["actual_pct"] - row["plan_pct"]
        variance = row["budget_thb"] * row["actual_pct"] / 100 - row["cost_thb"]
        if gap < 0 or variance < 0 or row["open_ncr"] or row.get("finish_slip_days", 0) > 0:
            actions.append({k: row[k] for k in ("wbs", "activity", "owner", "source", "open_ncr",
                                                "baseline_finish", "forecast_finish", "finish_slip_days") if k in row}
                           | {"gap_pp": gap, "cost_variance_thb": variance})
    result = {"project": project, "as_of": days[-1].isoformat(), **summary,
              "sources": sorted({r["source"] for r in current.values()}), "follow_up": actions}
    if len(days) > 1:
        prior = periods[days[-2]]
        result["previous_as_of"] = days[-2].isoformat()
        if {k: r["budget_thb"] for k, r in prior.items()} == {k: r["budget_thb"] for k, r in current.items()}:
            result["progress_change_pp"] = summary["actual_pct"] - metrics(prior)["actual_pct"]
        else:
            result["comparison_note"] = "รายการ WBS หรืองบฐานเปลี่ยน ตรวจขอบเขตก่อนเทียบงวด"
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_file")
    parser.add_argument("--project", required=True)
    parser.add_argument("--as-of", type=iso_day)
    args = parser.parse_args()
    try:
        with open(args.csv_file, newline="", encoding="utf-8-sig") as stream:
            data = report(snapshots(stream, args.project, args.as_of), args.project)
        print(json.dumps(data, ensure_ascii=False, indent=2, default=lambda n: format(n, ".2f")))
    except (OSError, ValueError, csv.Error) as exc:
        parser.exit(2, f"{exc}\n")


if __name__ == "__main__":
    main()
