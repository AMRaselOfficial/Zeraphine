/* ZERAPHINE headless tests. Run: node tests/test.js
 * Part 1: engine unit tests on synthetic content.
 * Part 2: full validation + scripted playthroughs on content.json (if present).
 */
const E = require('../engine.js');
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; /* console.log('  ok -', name); */ }
  else { fail++; console.log('  FAIL -', name); }
}

// ---------------- Part 1: unit tests ----------------
console.log('Part 1: engine unit tests');

const T = {
  meta: { caseId: 'T', version: '1', startScene: 's1' },
  scenes: {
    s1: {
      id: 's1', title: 'Start', storyTime: '9:00 PM',
      onEnter: [{ a: 'once', key: 's1enter' }, { a: 'flag', k: 'visited_s1' }],
      choices: [
        { id: 'c1', label: 'Take key', do: [{ a: 'evidence', id: 'E1' }], go: 's2' },
        { id: 'c2', label: 'Sneak past', if: [{ c: 'hasEvidence', id: 'E1' }], go: 's3' },
        { id: 'c3', label: 'Locked door', if: [{ c: 'flag', k: 'nope' }], showDisabled: true, ifHint: 'Nope.', go: 's3' },
        { id: 'c4', label: 'Trust me', do: [{ a: 'trust', who: 'bob', d: 2 }], go: 's2' }
      ],
      checkpoint: { id: 'CP1', name: 'Start CP' }
    },
    s2: {
      id: 's2', title: 'Two', storyTime: '9:10 PM',
      onEnter: [{ a: 'message', thread: 't1', id: 'm1' }],
      choices: [
        { id: 'c5', label: 'Finish A', ending: 'END-A' },
        { id: 'c6', label: 'Back', go: 's1' }
      ]
    },
    s3: { id: 's3', title: 'Three', storyTime: '9:20 PM', choices: [{ id: 'c7', label: 'End', go: 's1' }] }
  },
  evidence: { E1: { id: 'E1', name: 'Key', type: 'Physical', description: 'd', sourceScene: 's1', confidence: 'High' } },
  endings: { 'END-A': { id: 'END-A', title: 'A', summary: 's', epilogue: 'e' } },
  phone: { threads: [{ id: 't1', contact: 'T1', messages: [{ id: 'm1', from: 'them', text: 'hi', at: '9:00', replies: [{ id: 'r1', label: 'yo', response: { id: 'm2', from: 'them', text: 'yo back', at: '9:01' }, do: [{ a: 'flag', k: 'replied' }] }] }] }] },
  database: [{ id: 'db1', kind: 'Person', name: 'X', summary: 's', details: 'd', locked: true, unlockIf: [{ c: 'hasEvidence', id: 'E1' }] }],
  theories: [], systemNotes: [{ id: 'sn1', text: 'note' }]
};

let s = E.newGame(T);
ok(s.sceneId === 's1' && s.inv.evidence.length === 0, 'newGame initial state');

let r = E.enterScene(T, s, 's1');
s = r.state;
ok(s.inv.flags.visited_s1 === true, 'onEnter flag applied');
ok(r.events.some(e => e.t === 'checkpoint'), 'checkpoint created on first entry');
const cpCount = s.inv.checkpoints.length;
r = E.enterScene(T, s, 's1'); s = r.state;
ok(s.inv.checkpoints.length === cpCount, 'checkpoint not duplicated on re-entry');
ok(s.inv.onceDone.s1enter === true, 'once key recorded');

let ch = E.getChoices(T, s, E.sceneById(T, 's1'));
ok(ch.length === 3, 'hidden choice filtered, disabled shown (3 of 4)');
ok(ch.some(e => e.choice.id === 'c3' && !e.available && e.hint === 'Nope.'), 'disabled choice carries hint');

r = E.choose(T, s, 's1', 'c1'); s = r.state;
ok(s.inv.evidence.includes('E1'), 'evidence granted via choice');
ok(r.events.some(e => e.t === 'evidence' && e.id === 'E1'), 'evidence event emitted');
ok(s.sceneId === 's2', 'choice go navigates');
ok(s.inv.threads.t1 && s.inv.threads.t1.length === 1, 'onEnter message delivered');
ok(r.events.some(e => e.t === 'message'), 'message event emitted');
ok(s.inv.dbUnlocked.includes('db1'), 'conditional db unlock fired');
ok(r.events.some(e => e.t === 'db' && e.id === 'db1'), 'db unlock event emitted');

r = E.choose(T, s, 's1', 'c1'); // not on this scene
ok(r.events.some(e => e.t === 'error'), 'choice from wrong scene rejected');

r = E.choose(T, s, 's2', 'c6'); s = r.state; // back to s1
r = E.choose(T, s, 's1', 'c2'); s = r.state; // sneak past (has E1)
ok(s.sceneId === 's3', 'conditional choice available after evidence');

r = E.reply(T, s, 't1', 'm1', 'r1'); s = r.state;
ok(s.inv.repliesDone.m1 === 'r1', 'reply recorded');
ok(s.inv.flags.replied === true, 'reply action applied');
ok(s.inv.threads.t1.length === 2, 'reply response appended');
r = E.reply(T, s, 't1', 'm1', 'r1');
ok(r.events.some(e => e.t === 'error'), 'double reply rejected');

// checkpoint restore removes post-checkpoint evidence
s = E.newGame(T);
r = E.enterScene(T, s, 's1'); s = r.state;      // CP1 snapshot: no evidence
r = E.choose(T, s, 's1', 'c1'); s = r.state;    // gain E1, go s2
ok(s.inv.evidence.includes('E1'), 'pre-restore has evidence');
r = E.restoreCheckpoint(T, s, 'CP1'); s = r.state;
ok(!s.inv.evidence.includes('E1'), 'restore removes post-checkpoint evidence');
ok(s.sceneId === 's1', 'restore returns to checkpoint scene');
ok(s.inv.checkpoints.length === 1, 'checkpoints truncated correctly');
ok(!s.inv.threads.t1, 'restore removes post-checkpoint messages');
r = E.restoreCheckpoint(T, s, 'NOPE');
ok(r.events.some(e => e.t === 'error'), 'restore of unknown checkpoint errors');

// evidence dedup
s = E.newGame(T);
r = E.applyActions(T, s, [{ a: 'evidence', id: 'E1' }, { a: 'evidence', id: 'E1' }]);
ok(r.state.inv.evidence.length === 1 && r.events.length === 1, 'duplicate evidence grant suppressed');

// theory storage lives in inv (restored by checkpoints)
s = E.newGame(T);
E.setTheory(s, 'th1', 2);
ok(s.inv.theories.th1 === 2, 'setTheory stores in inv.theories');

const verrs = E.validateContent(T);
ok(verrs.length === 0, 'validator accepts good content: ' + JSON.stringify(verrs));

// validator catches problems
const bad = E.clone(T);
bad.scenes.s3.choices[0].go = 'missing-scene';
ok(E.validateContent(bad).some(e => e.includes('unknown go target')), 'validator catches bad go target');
const bad2 = E.clone(T);
bad2.scenes.s3.choices = [];
ok(E.validateContent(bad2).some(e => e.includes('dead end')), 'validator catches dead end');

console.log(`Part 1: ${pass} passed, ${fail} failed`);

// ---------------- Part 2: real content ----------------
const cpath = path.join(__dirname, '..', 'content.json');
if (!fs.existsSync(cpath)) {
  console.log('Part 2: content.json not present yet — skipping.');
  process.exit(fail ? 1 : 0);
}
console.log('Part 2: content.json validation + scripted playthroughs');
const C = JSON.parse(fs.readFileSync(cpath, 'utf8'));
const cerrs = E.validateContent(C);
ok(cerrs.length === 0, 'content.json validates: ' + JSON.stringify(cerrs.slice(0, 10)));

function play(choiceIds, label) {
  let st = E.newGame(C);
  let res = E.enterScene(C, st, C.meta.startScene);
  st = res.state;
  let ending = null;
  for (const cid of choiceIds) {
    const sc = E.sceneById(C, st.sceneId);
    const se = E.sceneEnding(C, sc);
    if (se) { ending = se; break; }
    const res2 = E.choose(C, st, st.sceneId, cid);
    st = res2.state;
    if (res2.events.some(e => e.t === 'error')) {
      ok(false, label + ': choice failed: ' + cid + ' at scene ' + st.sceneId);
      return null;
    }
    if (res2.ending) { ending = res2.ending; break; }
  }
  if (!ending) {
    const sc = E.sceneById(C, st.sceneId);
    ending = E.sceneEnding(C, sc);
  }
  return { state: st, ending };
}

// PATH B: thorough investigation -> ENDING-B "The Whole Truth"
const PATH_B = ['s01-grounds','s01a-back','s01-living','s01b-back','s01-study',
  's02-body','s02a-back','s02-gun','s02b-back','s02-desk','s02c-drawer','s02c-back',
  's02-window','s02d-back','s02-phone','s02e-back','s02-blood','s02f-back',
  's02-interviews',
  's03-eleanor','s03a-story','s03a-water','s03a-call','s03a-leave',
  's03-marcus','s03b-partner','s03b-alibi','s03b-ledger','s03b-leave',
  's03-claire','s03c-heard','s03c-reassure','s03c-photo','s03c-leave',
  's03-cole','s03d-mind','s03d-afraid','s03d-leave',
  's03-call','s04-b'];
const pb = play(PATH_B, 'PATH_B');
ok(pb && pb.ending === 'ENDING-B', 'PATH_B reaches ENDING-B (got ' + (pb && pb.ending) + ')');
if (pb) {
  const need = ['EVIDENCE-001','EVIDENCE-002','EVIDENCE-003','EVIDENCE-004','EVIDENCE-005','EVIDENCE-006','EVIDENCE-007','EVIDENCE-008','EVIDENCE-009','EVIDENCE-010','EVIDENCE-011','EVIDENCE-012','EVIDENCE-013','EVIDENCE-014'];
  ok(need.every(id => pb.state.inv.evidence.includes(id)), 'PATH_B collects all 14 evidence items (' + pb.state.inv.evidence.length + ')');
  ok(pb.state.inv.flags.marcus_admitted_cleanup === true, 'PATH_B: marcus_admitted_cleanup flag set');
  ok(pb.state.inv.flags.eleanor_confessed === true, 'PATH_B: eleanor_confessed flag set');
  ok((pb.state.inv.trust.claire || 0) >= 1, 'PATH_B: claire trust >= 1');
  ok(pb.state.inv.checkpoints.length === 2, 'PATH_B: 2 checkpoints created');
  ok(pb.state.perm.endingsFound['ENDING-B'], 'PATH_B: ending recorded in permanent collection');
  ok((pb.state.inv.threads.unknown || []).length >= 1, 'PATH_B: unknown thread message delivered');
}

// PATH A: minimal -> ENDING-A "The Official Story"
const PATH_A = ['s01-study','s02-body','s02a-back','s02-gun','s02b-back','s02-interviews','s03-call','s04-a'];
const pa = play(PATH_A, 'PATH_A');
ok(pa && pa.ending === 'ENDING-A', 'PATH_A reaches ENDING-A (got ' + (pa && pa.ending) + ')');

// PATH C: minimal + overreach -> ENDING-C "The Wrong Man"
const PATH_C = ['s01-study','s02-body','s02a-back','s02-gun','s02b-back','s02-interviews','s03-call','s04-c'];
const pc = play(PATH_C, 'PATH_C');
ok(pc && pc.ending === 'ENDING-C', 'PATH_C reaches ENDING-C (got ' + (pc && pc.ending) + ')');

// s04-b must be UNAVAILABLE without the full evidence set (gating works)
const gate = play(PATH_A.slice(0, -1), 'GATE');
if (gate) {
  const sc = E.sceneById(C, gate.state.sceneId);
  const avail = E.getChoices(C, gate.state, sc).filter(e => e.choice.id === 's04-b');
  ok(avail.length === 1 && avail[0].available === false, 's04-b correctly gated when evidence missing');
}

// phone reply flow on real content
const ph = play(['s01-study','s02-phone','s02e-back'], 'PHONE');
if (ph) {
  const msgs = ph.state.inv.threads.unknown || [];
  ok(msgs.length >= 1, 'unknown thread has messages');
  const last = msgs[msgs.length - 1];
  const n0 = msgs.length;
  if (last.replies && last.replies.length) {
    const rr = E.reply(C, ph.state, 'unknown', last.id, last.replies[0].id);
    const expect = n0 + (last.replies[0].response ? 1 : 0);
    ok(rr.state.inv.threads.unknown.length === expect, 'reply appends response message');
    ok(rr.state.inv.repliesDone[last.id] === last.replies[0].id, 'reply recorded');
  } else {
    ok(true, 'no replies on last unknown message (acceptable)');
  }
}

// checkpoint restore on real content: restore CP01 after CP02 -> post-CP01 evidence removed
const cr = play(PATH_B.slice(0, PATH_B.indexOf('s03-call')), 'RESTORE');
if (cr) {
  ok(cr.state.inv.checkpoints.length === 2, 'two checkpoints before restore');
  const rst = E.restoreCheckpoint(C, cr.state, 'CASE001-CP01');
  ok(!rst.state.inv.evidence.includes('EVIDENCE-013'), 'restore CP01 removes post-checkpoint evidence (013)');
  ok(!rst.state.inv.evidence.includes('EVIDENCE-005'), 'restore CP01 removes study evidence found after CP01 (005)');
  ok(rst.state.inv.evidence.includes('EVIDENCE-001'), 'restore CP01 keeps pre-checkpoint evidence (001)');
  ok(rst.state.sceneId === 'CASE001-S02', 'restore CP01 returns to study scene');
  ok(rst.state.inv.checkpoints.length === 1, 'checkpoints truncated after restore');
  ok(rst.state.inv.flags.marcus_admitted_cleanup !== true, 'restore CP01 clears post-checkpoint flags');
}

// save/load round-trip
const sv = play(PATH_A.slice(0, 4), 'SAVE');
if (sv) {
  const json = JSON.stringify(sv.state);
  const back = JSON.parse(json);
  ok(back.sceneId === sv.state.sceneId && back.inv.evidence.length === sv.state.inv.evidence.length, 'save/load round-trip preserves state');
}

// These choice-id paths must be updated to match the authored content.
// For now, verify the finale scene exists and choice-2 gating works generically.
const finale = Object.values(C.scenes).find(sc =>
  (sc.choices || []).some(c => c.ending));
ok(!!finale, 'a finale scene with ending choices exists');

const endingsReachable = new Set();
Object.values(C.scenes).forEach(sc => {
  (sc.choices || []).forEach(c => { if (c.ending) endingsReachable.add(c.ending); });
  if (sc.ending) endingsReachable.add(sc.ending);
});
ok(endingsReachable.size >= 2, 'at least 2 endings reachable (' + endingsReachable.size + ')');
Object.keys(C.endings || {}).forEach(id => {
  ok(endingsReachable.has(id), 'ending defined and reachable: ' + id);
});

// checkpoint integrity on real content: enter start, find first checkpoint scene, restore
let st0 = E.newGame(C);
st0 = E.enterScene(C, st0, C.meta.startScene).state;
const cpScene = Object.values(C.scenes).find(sc => sc.checkpoint);
if (cpScene) {
  let st = E.enterScene(C, st0, cpScene.id).state;
  ok(st.inv.checkpoints.length >= 1, 'real checkpoint created at ' + cpScene.id);
  const evBefore = st.inv.evidence.length;
  // grant something artificially post-checkpoint, then restore
  st.inv.evidence.push('EVIDENCE-FAKE');
  const rst = E.restoreCheckpoint(C, st, cpScene.checkpoint.id);
  ok(!rst.state.inv.evidence.includes('EVIDENCE-FAKE'), 'real restore drops post-checkpoint evidence');
  ok(rst.state.sceneId === cpScene.id, 'real restore returns to checkpoint scene');
  void evBefore;
} else {
  ok(false, 'no checkpoint scene found in content');
}

console.log(`TOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
