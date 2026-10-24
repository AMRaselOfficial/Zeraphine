# ZERAPHINE — Case #001: Canonical Truth & Content Schema
https://amraselofficial.github.io/Zeraphine/

This document is the single source of truth for building Case #001, "The House at Blackwood Lane".
The content-authoring subagent MUST follow the canonical truth, evidence catalog, scene outline,
and JSON schema below exactly. The engine builder implements the schema exactly.

---

## 1. CANONICAL TRUTH (what really happened — never shown to the player directly)

**The victim:** Daniel Whitmore, 52, Blackwood philanthropist and logistics-company owner.
Publicly a charity patron; secretly the founder of **ORPHEUS**, a private intelligence-brokerage
network that buys and sells corporate secrets, blackmail material, and insider data. He ran it
through shell companies tied to his charity foundation.

**The shooter:** Eleanor Whitmore, 48, his wife of 26 years. Her self-defense claim is
SUBSTANTIALLY TRUE. That evening she found Daniel's hidden Orpheus ledger, realized the scale
of his crimes and that he planned to flee the country with the network's funds, and confronted
him in the study at ~8:40 PM. Daniel lunged at her and grabbed her throat. She seized his
desk-drawer pistol and shot him once in the chest. He died within minutes.

**The cleanup:** In panic, Eleanor called **Marcus Vale**, 55, Daniel's business partner and
Orpheus's second-in-command, at 9:02 PM. Marcus arrived ~9:12 PM via the back of the house.
He did NOT kill Daniel (Daniel was already dead). He:
- wiped the pistol clean of prints (removing his own after moving it from the floor to the desk),
- stole Daniel's laptop and the Orpheus ledger page from the hidden desk drawer,
- dragged Daniel's body ~2 feet while searching his pockets for a USB key (the key was in the
  breast pocket; Marcus found it),
- left through the study window, leaving a muddy smear, to avoid being seen at the front door.

**Witnesses:**
- **Claire Whitmore**, 24, their daughter, home that night. Heard the argument and the shot.
  At 9:15 PM she photographed a black sedan (Marcus's car) leaving from her bedroom window.
- **Dr. Adrian Cole**, 63, family physician. Daniel told him weeks earlier he feared "his
  associates" and asked about sedatives "to sleep." Cole will confirm Daniel was afraid of
  the people he worked with.

**The unknown texter:** During the investigation the detective receives texts from an unknown
number: it is Marcus, warning the detective to stop digging ("Some stones are better left
unturned").

**What the evidence proves (and what it doesn't):**
- PROVEN with full evidence: Eleanor shot Daniel (self-defense, justified); Marcus tampered
  with the scene and stole Orpheus materials to protect the network.
- NOT provable: that Marcus murdered Daniel (he didn't). Charging Marcus with murder is an
  overreach that collapses the case — this is the "wrong" ending path.
- If the player never digs into Orpheus, the case closes as simple self-defense and the
  network survives — the "incomplete" ending.

**Tone rules:** Tasteful, no gore. The body is described, never shown graphically (the study
art shows a sheet-covered form / chalk outline only). All fiction, all original characters.

---

## 2. CHARACTERS

- **The Detective (player):** unnamed; referred to as "Detective". Dry, observant.
- **Eleanor Whitmore, 48:** composed, grieving, defensive. Cooperative but hides the call to Marcus until confronted with the call log.
- **Marcus Vale, 55:** Daniel's partner, Orpheus lieutenant. Polished, menacing charm. Denies everything until confronted with the ledger, then admits the cleanup but insists "Daniel was dead when I arrived."
- **Claire Whitmore, 24:** anxious, loyal to her mother, afraid of Marcus. Gives the car photo if treated gently (trust >= 1).
- **Dr. Adrian Cole, 63:** cautious, ethical conflict. Confirms Daniel's fear if asked directly.
- **Officer Dana Reyes:** uniformed officer, first on scene; gives the initial briefing.

---

## 3. TIMELINE (story facts)

- 8:40 PM — Eleanor confronts Daniel in the study; he grabs her; she shoots him.
- 8:47 PM — Daniel dies.
- 9:02 PM — Eleanor calls Marcus Vale (call log).
- 9:12 PM — Marcus enters via the back; wipes gun; takes laptop + ledger page; searches body (moves it); leaves via study window.
- 9:15 PM — Claire photographs Marcus's sedan leaving.
- 9:31 PM — Eleanor calls 911.
- 9:47 PM — Detective (player) arrives. Rain.

---

## 4. EVIDENCE CATALOG (use these exact IDs, names, types)

| ID | Name | Type | Source scene | Description | Confidence |
|---|---|---|---|---|---|
| EVIDENCE-001 | Crime Scene Photographs | Photo | CASE001-S01 | Wide shots of the house and study, taken by Officer Reyes. | High |
| EVIDENCE-002 | Muddy Footprints | Physical | CASE001-S01A | Men's size-11 prints in the mud along the back walk, heading toward the house — then none returning by the front. | Medium |
| EVIDENCE-003 | Family Photograph | Photo | CASE001-S01B | The Whitmores three years ago, smiling on this same porch. Daniel's smile doesn't reach his eyes. | Low |
| EVIDENCE-004 | Body Examination Notes | Document | CASE001-S02A | Single gunshot wound to the chest. Lividity and blood pooling inconsistent with the body's position — it was moved ~30 minutes after death. | High |
| EVIDENCE-005 | Wiped Firearm | Physical | CASE001-S02B | Daniel's registered pistol. Forensically wiped clean — not a single print, not even Daniel's or Eleanor's. Someone cleaned it after the shooting. | High |
| EVIDENCE-006 | Daniel's Laptop | Digital | CASE001-S02C | Encrypted. File index shows large deletions made at 9:14 PM — after Daniel died. Someone used it after the murder. | High |
| EVIDENCE-007 | Daniel's Note | Document | CASE001-S02C | Handwritten, in the desk drawer: "If anything happens — ask M.V. Everything is in the second drawer. — D." | Medium |
| EVIDENCE-008 | Orpheus Ledger Page | Document | CASE001-S02C | Hidden compartment in the desk's second drawer. A page of coded payments: "ORPHEUS — Q3 disbursements." Proof of the network. | High |
| EVIDENCE-009 | Muddy Window Smear | Physical | CASE001-S02D | Mud smeared on the study window latch and sill — someone climbed out recently. Mud matches the back-walk soil. | High |
| EVIDENCE-010 | Blood Pattern Analysis | Document | CASE001-S02F | Cast-off and drag marks: the body was pulled about two feet across the rug after the bleeding slowed. Staged or searched post-mortem. | High |
| EVIDENCE-011 | Unknown Texts | Digital | CASE001-S02E | Threatening texts on Daniel's phone from an unknown number, received over the past week: "You don't get to walk away." | Medium |
| EVIDENCE-012 | 9:02 PM Call Log | Digital | CASE001-S02E | Eleanor called Marcus Vale at 9:02 PM — 29 minutes before she called 911. | High |
| EVIDENCE-013 | Claire's Photograph | Photo | CASE001-S03C | Time-stamped 9:15 PM: a black sedan leaving Blackwood Lane. Registered to Marcus Vale. (Requires Claire trust >= 1.) | High |
| EVIDENCE-014 | Dr. Cole's Statement | Document | CASE001-S03D | Cole confirms Daniel feared "his associates" and believed they would kill him if he tried to leave. | Medium |

---

## 5. SCENE OUTLINE (scene IDs must match; write full narrative + dialogue for each)

- **CASE001-S01 "Arrival"** (image: scene-arrival). Rain, 9:47 PM. Officer Reyes briefs: Daniel Whitmore dead in his study; wife Eleanor claims she shot him in self-defense during an argument. Grants EVIDENCE-001. Choices: examine the grounds (S01A), step into the living room (S01B), go to the study (S02).
- **CASE001-S01A "The Grounds"** (image: scene-exterior). EVIDENCE-002. Choice: return inside (S01).
- **CASE001-S01B "The Living Room"** (image: scene-livingroom). EVIDENCE-003. Observe Eleanor briefly (sets flag `saw_eleanor`). Choice: return (S01).
- **CASE001-S02 "The Study"** (image: scene-study). HUB. Body present (sheet-covered). `onEnter` first time creates checkpoint CASE001-CP01 ("Crime Scene Entry"). Hotspot choices: examine the body (S02A), examine the firearm (S02B), search the desk (S02C), check the window (S02D), check Daniel's phone (S02E), study the blood pattern (S02F). Choice "Begin the interviews" → S03, requires flags `examined_body` AND `examined_firearm` (Reyes stops you: "Not yet, Detective — you haven't looked at the body or the gun.").
- **CASE001-S02A "The Body"**: EVIDENCE-004, sets `examined_body`. Return to S02.
- **CASE001-S02B "The Firearm"**: EVIDENCE-005, sets `examined_firearm`. Return to S02.
- **CASE001-S02C "The Desk"**: EVIDENCE-006, EVIDENCE-007. A choice "Pry open the loose second drawer" grants EVIDENCE-008 (requires nothing else; it's the reward for thoroughness). Return to S02.
- **CASE001-S02D "The Window"**: EVIDENCE-009. Return to S02.
- **CASE001-S02E "The Phone"**: EVIDENCE-011, EVIDENCE-012. Triggers a text to the PLAYER's phone from "Unknown Number": "Detective. Some stones are better left unturned." (phone notification demo). Return to S02.
- **CASE001-S02F "Blood Pattern"**: EVIDENCE-010 + system note ("The body was moved after death — Eleanor's account doesn't explain this."). Return to S02.
- **CASE001-S03 "Interviews"** (no image / reuse livingroom). HUB. `onEnter` first time creates checkpoint CASE001-CP02 ("Interviews Begin"). Choices: interview Eleanor (S03A), interview Marcus (S03B), interview Claire (S03C), interview Dr. Cole (S03D), "Make the call" → S04.
- **CASE001-S03A "Eleanor Whitmore"** (portrait-eleanor): dialogue tree. She describes the argument and shooting. Confrontation choice "Ask about the 9:02 PM call" (requires EVIDENCE-012): she breaks down, admits calling Marcus in panic, trust +1. Gentle choices raise trust.
- **CASE001-S03B "Marcus Vale"** (portrait-marcus): polished deflection. Confrontation "Present the Orpheus ledger page" (requires EVIDENCE-008): he drops the charm, admits he "tidied up" — wiped the gun, took the laptop — "Daniel was dead when I arrived. You can't prove otherwise." sets flag `marcus_admitted_cleanup`.
- **CASE001-S03C "Claire Whitmore"** (portrait-claire): if trust >= 1 (gained via kind choices), she shares EVIDENCE-013.
- **CASE001-S03D "Dr. Adrian Cole"** (portrait-cole): grants EVIDENCE-014 if asked "Was Daniel afraid of someone?"
- **CASE001-S04 "The Call"** (image: scene-study). The finale. The player reviews and decides. Choices:
  1. "Close the case: justifiable self-defense." (always available) → ENDING-A.
  2. "Lay out the whole truth: Eleanor acted in self-defense; charge Marcus Vale with tampering and theft." Requires EVIDENCE-005 + EVIDENCE-008 + EVIDENCE-009 + EVIDENCE-012 (if missing, the choice is hidden/disabled with hint "You don't have enough to prove the full sequence yet."). → ENDING-B.
  3. "Arrest Marcus Vale for the murder of Daniel Whitmore." (always available) → ENDING-C.
- **Endings** (each a scene with an `ending` block):
  - **ENDING-A "The Official Story"**: Eleanor walks free; case closed as self-defense. Stinger: three weeks later, a wire transfer marked ORPHEUS clears through a Blackwood account. The network survives. (Incomplete truth.)
  - **ENDING-B "The Whole Truth"**: Marcus arrested for tampering, theft, obstruction; Eleanor's self-defense ruled justified; the Orpheus ledger goes to the state police — "Blackwood was just one cell." Hook for future cases.
  - **ENDING-C "The Wrong Man"**: The murder charge against Marcus collapses — forensics prove he never fired the gun. The DA, embarrassed, reopens against Eleanor; she takes a manslaughter plea. Marcus walks. The detective's rush to judgment buried the real story.

---

## 6. PHONE THREADS

- **dispatch / "Dispatch"**: "Body confirmed at 17 Blackwood Lane. Victim: Daniel Whitmore. Spouse on scene." Later: "ME's preliminary: single GSW, chest." (trigger the second on entering S02A.)
- **unknown / "Unknown Number"**: triggered in S02E. Them: "Detective. Some stones are better left unturned." Replies: "Who is this?" → Them: "Someone who liked Daniel better alive. Leave Blackwood." / "Trace this number." → Them: "Burner. Don't waste your time." (sets flag `threatened`).
- **reyes / "Officer Reyes"**: after CP02: "Interviews are set up in the living room whenever you're ready."

## 7. POLICE DATABASE RECORDS

- Daniel Whitmore (Person) — philanthropist, logistics CEO; firearm registered (links EVIDENCE-005).
- Eleanor Whitmore (Person) — no record.
- Marcus Vale (Person) — business partner; prior fraud investigation, dropped 2019.
- Claire Whitmore (Person) — student.
- Dr. Adrian Cole (Person) — physician, clean record.
- ORPHEUS (Organization) — LOCKED until EVIDENCE-008: "No official records. The ledger suggests a private intelligence network."
- 17 Blackwood Lane (Address) — property record.
- Black Sedan / plate (Vehicle) — unlocked by EVIDENCE-013: registered to Vale Holdings.

## 8. THEORY BOARD (player hypotheses; selections never auto-confirm truth)

- "Who fired the fatal shot?" → [Eleanor Whitmore, Marcus Vale, An intruder, Unknown]
- "Was the body moved after death?" → [Yes, No, Undecided]
- "What is Orpheus?" → [A company, A criminal network, Nothing — a code word, Undecided]

---

## 9. CONTENT JSON SCHEMA (exact — the engine implements this)

```jsonc
{
  "meta": { "caseId": "CASE001", "title": "The House at Blackwood Lane", "version": "1.0.0", "startScene": "CASE001-S01" },
  "scenes": {
    "CASE001-S01": {
      "id": "CASE001-S01",
      "title": "Arrival",
      "storyTime": "9:47 PM",
      "image": "assets/scene-arrival.jpg",      // optional
      "blocks": [                                // narrative content, in order
        { "t": "n", "text": "..." },             // narrative paragraph
        { "t": "d", "who": "Officer Reyes", "text": "..." },  // dialogue line
        { "t": "sys", "text": "..." }            // system line (styled dimmer)
      ],
      "onEnter": [ /* actions */ ],              // optional, run once per visit? NO — run every entry unless "once":true
      "choices": [
        {
          "id": "s01-grounds",
          "label": "Examine the grounds",
          "sub": "Walk the perimeter before going in.",   // optional hint
          "if": [ /* conditions */ ],            // optional; choice hidden unless ALL true
          "ifHint": "You haven't looked at the body or the gun yet.",  // optional; shown when hidden? NO — engine shows disabled with this hint when "showDisabled":true
          "showDisabled": true,                  // optional
          "do": [ /* actions */ ],               // optional
          "go": "CASE001-S01A",                  // optional target scene
          "ending": "ENDING-A"                   // optional: jump to ending scene id
        }
      ],
      "checkpoint": { "id": "CASE001-CP01", "name": "Crime Scene Entry" }  // optional; snapshot on first entry
    }
  },
  "evidence": {
    "EVIDENCE-005": {
      "id": "EVIDENCE-005", "name": "Wiped Firearm", "type": "Physical",
      "icon": "assets/ev-firearm.jpg",
      "description": "...", "sourceScene": "CASE001-S02B", "confidence": "High",
      "detail": "..."   // longer forensic detail shown in the viewer
    }
  },
  "endings": {
    "ENDING-A": { "id": "ENDING-A", "title": "The Official Story", "image": "assets/scene-study.jpg",
                  "summary": "...", "epilogue": "..." }
  },
  "phone": {
    "threads": [
      { "id": "dispatch", "contact": "Dispatch",
        "messages": [
          { "id": "d1", "from": "them", "text": "...", "at": "9:50 PM",
            "replies": [ { "id": "d1r1", "label": "Acknowledged.",
                           "response": { "id": "d1r1m", "from": "them", "text": "...", "at": "9:51 PM" },
                           "do": [ /* actions */ ] } ] }
        ] }
    ]
  },
  "database": [
    { "id": "db-daniel", "kind": "Person", "name": "Daniel Whitmore",
      "summary": "...", "details": "...",
      "locked": false, "unlockIf": [ /* conditions */ ], "unlockHint": "Requires evidence." }
  ],
  "theories": [
    { "id": "th-shot", "question": "Who fired the fatal shot?",
      "options": ["Eleanor Whitmore", "Marcus Vale", "An intruder"] }
  ],
  "systemNotes": [  // engine-triggered observations; granted via actions
    { "id": "sn-moved", "text": "..." }
  ]
}
```

**Actions** (`do` / `onEnter` arrays). Each action is an object with "a":
- `{"a":"evidence","id":"EVIDENCE-005"}` — grant evidence (toast + system line auto-added).
- `{"a":"flag","k":"examined_body","v":true}` — set flag (v defaults true).
- `{"a":"trust","who":"eleanor","d":1}` — adjust relationship (-2..2 scale; start 0).
- `{"a":"message","thread":"unknown","message":{...message object...}}` — deliver a phone message now (notification popup). The message object uses the same shape as phone thread messages.
- `{"a":"notify","text":"..."}` — toast notification.
- `{"a":"db","id":"db-orpheus"}` — unlock a database record.
- `{"a":"note","id":"sn-moved"}` — add a system observation to Notes.
- `{"a":"once","key":"cp01"}` — internal; engine uses this to run onEnter only once (author: put `{"a":"once","key":"<unique>"}` as FIRST action in onEnter lists that must run once).

**Conditions** (`if` / `unlockIf` arrays; ALL must be true):
- `{"c":"hasEvidence","id":"EVIDENCE-005"}`
- `{"c":"flag","k":"marcus_admitted_cleanup"}` / `{"c":"flag","k":"x","v":false}`
- `{"c":"trust","who":"claire","gte":1}`
- `{"c":"not","cond":{...}}` — negate a single condition.

**Rules for the author:**
- Every scene ID listed in section 5 must exist; every `go` target must exist; every evidence/phone/db/theory id referenced must be defined.
- No dead ends: every scene must have ≥1 choice or be an ending scene.
- Choice labels describe the player's intended action, never the outcome ("Ask about the 9:02 PM call", not "Get her to confess").
- Write in a noir, restrained, cinematic voice. Second person for narrative ("You push open the study door."). Keep each scene 150–350 words across blocks.
- Dialogue must sound like distinct people (Reyes: professional, clipped. Eleanor: controlled grief. Marcus: smooth menace. Claire: nervous. Cole: careful.)
- `storyTime` should advance plausibly across scenes (9:47 PM → ~11:30 PM by the finale).
- Endings reference their `endings` entry via scene.ending = {"id":"ENDING-A"} — engine looks up title/summary/epilogue.
- Player reply options in phone threads: 2–3 replies max each; replies may set flags.
- All text in English. No real-world persons, no gore.

## 10. ASSET FILENAMES (16 total — images generated separately; reference exactly these paths)

Scenes: `assets/hero-title.jpg` (title screen), `assets/scene-arrival.jpg`,
`assets/scene-exterior.jpg`, `assets/scene-livingroom.jpg`, `assets/scene-study.jpg`
Evidence: `assets/ev-firearm.jpg`, `assets/ev-desk.jpg`, `assets/ev-window.jpg`,
`assets/ev-blood.jpg`, `assets/ev-phone.jpg`, `assets/ev-familyphoto.jpg`
People: `assets/portrait-eleanor.jpg`, `assets/portrait-marcus.jpg`,
`assets/portrait-claire.jpg`, `assets/portrait-cole.jpg`, `assets/photo-daniel.jpg`

Usage: interview scenes use the matching portrait as their scene image
(Eleanor→portrait-eleanor, Marcus→portrait-marcus, Claire→portrait-claire,
Cole→portrait-cole). EVIDENCE-003 (Family Photograph) icon = `assets/ev-familyphoto.jpg`.
Daniel's police-database record shows `assets/photo-daniel.jpg`. Endings reuse
`assets/scene-study.jpg` unless the author picks a better fit from the list above.
