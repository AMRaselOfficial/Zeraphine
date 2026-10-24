#!/usr/bin/env python3
"""Validate content.json: references, reachability, dead ends, word counts."""
import json, re, sys

P = "/home/hatch/workspace/zeraphine/content.json"
c = json.load(open(P, encoding="utf-8"))
errors = []

scenes = c["scenes"]
ev_ids = set(c["evidence"].keys())
thread_ids = {t["id"] for t in c["phone"]["threads"]}
db_ids = {d["id"] for d in c["database"]}
theory_ids = {t["id"] for t in c["theories"]}
note_ids = {n["id"] for n in c["systemNotes"]}
ending_ids = set(c["endings"].keys())

def walk_actions(actions, where):
    for a in actions or []:
        k = a.get("a")
        if k == "evidence" and a["id"] not in ev_ids:
            errors.append(f"{where}: unknown evidence {a['id']}")
        elif k == "flag":
            flags_set.add(a["k"])
        elif k == "message":
            if a["thread"] not in thread_ids:
                errors.append(f"{where}: unknown thread {a['thread']}")
            walk_message(a.get("message", {}), where + ">msg")
        elif k == "db" and a["id"] not in db_ids:
            errors.append(f"{where}: unknown db {a['id']}")
        elif k == "note" and a["id"] not in note_ids:
            errors.append(f"{where}: unknown note {a['id']}")

def walk_message(m, where):
    for r in m.get("replies", []) or []:
        walk_actions(r.get("do"), where + ">reply:" + r.get("id", "?"))
        resp = r.get("response") or {}
        walk_message(resp, where)

def walk_conds(conds, where):
    for cond in conds or []:
        ck = cond.get("c")
        if ck == "hasEvidence" and cond["id"] not in ev_ids:
            errors.append(f"{where}: unknown evidence {cond['id']}")
        elif ck == "flag":
            flags_checked.add(cond["k"])
        elif ck == "trust":
            pass
        elif ck == "not":
            walk_conds([cond["cond"]], where + ">not")

flags_set, flags_checked = set(), set()

for sid, s in scenes.items():
    if sid != s.get("id"):
        errors.append(f"scene key/id mismatch: {sid}")
    walk_actions(s.get("onEnter"), sid + ":onEnter")
    is_ending = "ending" in s
    if not is_ending and not s.get("choices"):
        errors.append(f"{sid}: dead end (no choices, not an ending)")
    for ch in s.get("choices", []):
        where = f"{sid}:choice:{ch.get('id')}"
        walk_conds(ch.get("if"), where)
        walk_actions(ch.get("do"), where)
        if "go" in ch and ch["go"] not in scenes:
            errors.append(f"{where}: unknown go target {ch['go']}")
        if "ending" in ch and ch["ending"] not in ending_ids:
            errors.append(f"{where}: unknown ending id {ch['ending']}")
    if is_ending:
        eid = s["ending"].get("id")
        if eid not in ending_ids:
            errors.append(f"{sid}: unknown scene ending ref {eid}")

for t in c["phone"]["threads"]:
    for m in t.get("messages", []):
        walk_message(m, f"thread:{t['id']}")

for d in c["database"]:
    walk_conds(d.get("unlockIf"), f"db:{d['id']}")

# flag consistency: every checked flag must be set somewhere
for f in sorted(flags_checked - flags_set):
    errors.append(f"flag checked but never set: {f}")

# required scenes from brief
required = ["CASE001-S01","CASE001-S01A","CASE001-S01B","CASE001-S02","CASE001-S02A",
            "CASE001-S02B","CASE001-S02C","CASE001-S02D","CASE001-S02E","CASE001-S02F",
            "CASE001-S03","CASE001-S03A","CASE001-S03B","CASE001-S03C","CASE001-S03D",
            "CASE001-S04","ENDING-A","ENDING-B","ENDING-C"]
for r in required:
    if r not in scenes:
        errors.append(f"missing required scene {r}")

# evidence: all 14 present
for i in range(1, 15):
    eid = f"EVIDENCE-{i:03d}"
    if eid not in ev_ids:
        errors.append(f"missing evidence {eid}")

# reachability from start
seen, stack = set(), [c["meta"]["startScene"]]
while stack:
    sid = stack.pop()
    if sid in seen or sid not in scenes:
        continue
    seen.add(sid)
    for ch in scenes[sid].get("choices", []):
        if "go" in ch:
            stack.append(ch["go"])
        if "ending" in ch and ch["ending"] in scenes:
            stack.append(ch["ending"])
unreach = set(scenes) - seen
if unreach:
    errors.append(f"unreachable scenes: {sorted(unreach)}")

# word counts per scene
total_words = 0
print("--- scene word counts (blocks) ---")
for sid, s in scenes.items():
    w = sum(len(b.get("text", "").split()) for b in s.get("blocks", []))
    total_words += w
    flag = "" if 150 <= w <= 350 or "ending" in s else "  <-- OUT OF RANGE"
    print(f"{sid}: {w} words{flag}")

print("--- evidence granted check ---")
granted = set()
def collect(a_list):
    for a in a_list or []:
        if a.get("a") == "evidence":
            granted.add(a["id"])
for s in scenes.values():
    collect(s.get("onEnter"))
    for ch in s.get("choices", []):
        collect(ch.get("do"))
missing_grant = ev_ids - granted
if missing_grant:
    errors.append(f"evidence never granted: {sorted(missing_grant)}")
print("granted:", len(granted), "of", len(ev_ids))

# required condition checks from brief
s02 = scenes["CASE001-S02"]
bi = next(ch for ch in s02["choices"] if ch["id"] == "s02-interviews")
assert bi.get("showDisabled") is True, "interviews choice must showDisabled"
assert any(x.get("c") == "flag" and x.get("k") == "examined_body" for x in bi["if"]), "missing examined_body"
assert any(x.get("c") == "flag" and x.get("k") == "examined_firearm" for x in bi["if"]), "missing examined_firearm"
s04 = scenes["CASE001-S04"]
b2 = next(ch for ch in s04["choices"] if ch["id"] == "s04-b")
need = {"EVIDENCE-005", "EVIDENCE-008", "EVIDENCE-009", "EVIDENCE-012"}
got = {x["id"] for x in b2["if"] if x.get("c") == "hasEvidence"}
assert need == got, f"finale choice 2 evidence mismatch: {got}"
assert b2.get("showDisabled") is True

print("total words (all scenes):", total_words)
print("scenes:", len(scenes), "| evidence:", len(ev_ids), "| threads:", len(thread_ids),
      "| db:", len(db_ids), "| theories:", len(theory_ids))
if errors:
    print("\nERRORS:")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print("\nALL CHECKS PASSED")
