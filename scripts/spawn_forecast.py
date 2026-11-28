"""위성별 시간대 기대 스폰을 몬테카를로로 계산해 docs/javascripts/spawn-forecast-data.js 로 저장한다.

입력은 위키 문서 자체다.
  - docs/moons/<위성>.md : 스폰 수 곡선, 최대 파워, 흔들림, 일식 최소 수, 몬스터 희귀도·파워·최대 수
  - docs/creatures/index.md : 몬스터 시간 곡선, 주간 몬스터 떠나는 시각

게임 공식 (RoundManager, IL 확인):
  실내  n = RoundToInt(Clamp(Lerp(a + 마감보정 - r, a + r, U), 최소, 20)),  a = 곡선 - 1
  외부  n = Clamp(Next((int)(a + 마감보정 - 3), (int)(a + 3)), 최소, 20),  a = (int)(곡선*100)/100
  주간  n = Clamp(Next((int)(c - r), (int)(c + r)), 0, 20)
  마감보정 = |마감까지 남은 날 - 3| / 1.6
  종류 = 가중치 (int)(희귀도 × 시간 곡선) 비례. 파워 초과·최대 수 도달이면 0.

반영하지 않은 것: 몬스터별 다양성 파워, 마릿수 감쇠(falloff), 무리 스폰, 던전 선호 보너스,
빈 벤트 수, 침공 레벨, 폐품 많이 찾음(최소 1), 몬스터 처치, 24시 배치.

사용: python scripts/spawn_forecast.py
"""
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
OUT = DOCS / "javascripts" / "spawn-forecast-data.js"
RUNS = 6000
HOURS = [6, 8, 10, 12, 14, 16, 18, 20, 22]

MOONS = [
    ("experimentation", "41-익스페리멘테이션"), ("assurance", "220-어슈어런스"), ("vow", "56-보우"),
    ("offense", "21-오펜스"), ("march", "61-마치"), ("adamance", "20-애더먼스"), ("rend", "85-렌드"),
    ("dine", "7-다인"), ("titan", "8-타이탄"), ("artifice", "68-아터피스"), ("embrion", "5-엠브리온"),
]


def section(text, title_re):
    m = re.search(title_re, text, re.M)
    if not m:
        return ""
    rest = text[m.end():]
    n = re.search(r"^## ", rest, re.M)
    return rest[:n.start()] if n else rest


def table_rows(block):
    rows = []
    for line in block.splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if set(cells[0]) <= set("-: "):
            continue
        rows.append(cells)
    return rows


def strip_link(s):
    return re.sub(r"\[(.*?)\]\(.*?\)", r"\1", s).replace("*", "").strip()


# ---------------------------------------------------------------- 몬스터 시간 곡선
cre = (DOCS / "creatures" / "index.md").read_text(encoding="utf-8")
CURVE, LEAVE = {}, {}
for row in table_rows(section(cre, r"^## 시간대")):
    if row[0] == "몬스터":
        continue
    name = strip_link(row[0])
    CURVE[name] = [float(v) for v in row[1:10]]
    if len(row) > 10 and re.match(r"\d+:\d+", row[10]):
        h, mnt = map(int, row[10].split(":"))
        LEAVE[name] = h + mnt / 60


def parse_moon(slug):
    t = (DOCS / "moons" / f"{slug}.md").read_text(encoding="utf-8")
    info = {r[0]: r[1] for r in table_rows(section(t, r"^## 기본 정보"))}
    mp = [float(x) for x in re.findall(r"[\d.]+", info["최대 파워 (실내 / 외부 / 주간)"])]
    rng = [float(x) for x in re.findall(r"\d+", info["스폰 수 흔들림 (실내 / 주간)"])]
    ecl = re.search(r"일식 \(최소 스폰 (\d+)마리\)", info["나올 수 있는 날씨"])
    div = info.get("다양성 파워 (실내 / 외부)", "")
    curves = {}
    for row in table_rows(section(t, r"^## 시간대별 스폰 수 곡선")):
        if row[0] in ("실내", "외부(야간)", "주간"):
            curves[row[0]] = [float(v) for v in row[1:10]]

    def mons(title):
        out = []
        for row in table_rows(section(t, title)):
            if row[0] == "몬스터":
                continue
            out.append(dict(name=strip_link(row[0]), rarity=int(row[1]), power=float(row[2]), max=int(row[3])))
        return out

    return dict(
        maxPower=mp, range=rng, eclipseMin=int(ecl.group(1)) if ecl else None,
        diversityLimited="100 / 100" not in div,
        curves=curves,
        inside=mons(r"^## 실내 몬스터"), outside=mons(r"^## 외부 몬스터"), daytime=mons(r"^## 주간 몬스터"),
    )


def round_half_even(x):
    return round(x)  # Python round = 은행가 반올림 = Mathf.RoundToInt


def next_int(rnd, lo, hi):
    return rnd.randrange(lo, hi) if hi > lo else lo


def pick(rnd, mons, hidx, spawned, power, max_power, fire_hour, daytime):
    weights = []
    for i, m in enumerate(mons):
        if m["power"] > max_power - power or spawned[i] >= m["max"]:
            w = 0
        elif daytime and m["name"] in LEAVE and LEAVE[m["name"]] < fire_hour:
            w = 0
        else:
            w = int(m["rarity"] * CURVE[m["name"]][hidx])
        weights.append(w)
    total = sum(weights)
    if total <= 0:
        return -1
    r = rnd.randrange(total)
    for i, w in enumerate(weights):
        if r < w:
            return i
        r -= w
    return -1


def simulate(moon, kind, minimum, deadline, rnd):
    """kind: inside/outside/daytime. 반환: 배치별(HOURS 기준) 누적 기대 마릿수, 몬스터별 누적 기대·확률."""
    mons = moon[kind]
    n_m = len(mons)
    hours = HOURS if kind == "inside" else HOURS[1:]
    curve = moon["curves"]["실내" if kind == "inside" else "외부(야간)" if kind == "outside" else "주간"]
    max_power = moon["maxPower"][{"inside": 0, "outside": 1, "daytime": 2}[kind]]
    bonus = abs(deadline - 3) / 1.6
    nb = len(hours)
    tot = [0.0] * nb
    exp_m = [[0.0] * nb for _ in range(n_m)]
    any_m = [[0] * nb for _ in range(n_m)]
    for _ in range(RUNS):
        spawned = [0] * n_m
        power = 0.0
        cum = 0
        for b, h in enumerate(hours):
            hidx = HOURS.index(h)
            c = curve[hidx]
            if kind == "inside":
                r = moon["range"][0]
                a = c - 1
                n = round_half_even(min(max(a + bonus - r + (2 * r - bonus) * rnd.random(), minimum), 20))
                skip = power >= max_power
            elif kind == "outside":
                a = int(c * 100) / 100
                n = min(max(next_int(rnd, int(a + bonus - 3), int(a + 3)), minimum), 20)
                skip = power > max_power
            else:
                r = moon["range"][1]
                n = min(max(next_int(rnd, int(c - r), int(c + r)), 0), 20)
                skip = power > max_power
            if not skip:
                for _k in range(n):
                    i = pick(rnd, mons, hidx, spawned, power, max_power, h - 1, kind == "daytime")
                    if i < 0:
                        break
                    spawned[i] += 1
                    power += mons[i]["power"]
                    cum += 1
            tot[b] += cum
            for i in range(n_m):
                exp_m[i][b] += spawned[i]
                if spawned[i]:
                    any_m[i][b] += 1
    rd = lambda x: round(x / RUNS, 3)
    return dict(
        hours=hours,
        total=[rd(x) for x in tot],
        monsters=[dict(name=m["name"], expected=[rd(x) for x in exp_m[i]],
                       chance=[round(x / RUNS, 3) for x in any_m[i]]) for i, m in enumerate(mons)],
    )


def main():
    rnd = random.Random(20261128)
    data = dict(runs=RUNS, moons=[])
    for slug, label in MOONS:
        moon = parse_moon(slug)
        emin = moon["eclipseMin"] or 0
        entry = dict(slug=slug, name=label, eclipseMin=moon["eclipseMin"], maxPower=moon["maxPower"],
                     diversityLimited=moon["diversityLimited"], conditions={})
        day = simulate(moon, "daytime", 0, 3, rnd) if moon["daytime"] else None
        for deadline in (3, 2, 1, 0):
            for weather, minimum in (("normal", 0), ("eclipse", emin)):
                entry["conditions"][f"{weather}-{deadline}"] = dict(
                    inside=simulate(moon, "inside", minimum, deadline, rnd) if moon["inside"] else None,
                    outside=simulate(moon, "outside", minimum, deadline, rnd) if moon["outside"] else None,
                    daytime=day,
                )
        data["moons"].append(entry)
        print(label, "done")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("// scripts/spawn_forecast.py 가 만든 파일입니다. 직접 고치지 마세요.\n"
                   "window.SPAWN_FORECAST = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
                   encoding="utf-8", newline="\n")
    print("saved", OUT, OUT.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
