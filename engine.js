/* ZERAPHINE engine.js — pure game logic. No DOM, no storage.
 * Works in Node (module.exports) and browsers (window.ZEngine).
 * All state transitions are explicit; UI layers render `events`.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = factory(); }
  else { root.ZEngine = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  // ---------- state ----------

  function newGame(content) {
    return {
      v: 1,
      caseId: content.meta.caseId,
      contentVersion: content.meta.version,
      sceneId: content.meta.startScene,
      perm: { endingsFound: {}, startedAt: Date.now() },
      inv: {
        evidence: [], flags: {}, trust: {},
        threads: {}, repliesDone: {}, threadSeen: {},
        dbUnlocked: [], sysNotes: [], playerNotes: [], theories: {},
        visited: [], onceDone: {}, checkpoints: []
      }
    };
  }

  function sceneById(content, id) { return (content.scenes && content.scenes[id]) || null; }

  // ---------- conditions ----------

  function evalCond(content, state, cond) {
    if (!cond || !cond.c) return true;
    switch (cond.c) {
      case 'hasEvidence': return state.inv.evidence.indexOf(cond.id) !== -1;
      case 'flag': {
        var want = cond.v === undefined ? true : cond.v;
        var got = state.inv.flags[cond.k];
        if (got === undefined) got = false;
        return got === want;
      }
      case 'trust': return (state.inv.trust[cond.who] || 0) >= (cond.gte === undefined ? 1 : cond.gte);
      case 'not': return !evalCond(content, state, cond.cond);
      default: return false;
    }
  }

  function condsMet(content, state, conds) {
    if (!conds || !conds.length) return true;
    for (var i = 0; i < conds.length; i++) if (!evalCond(content, state, conds[i])) return false;
    return true;
  }

  // ---------- phone helpers ----------

  function threadDef(content, threadId) {
    return (content.phone.threads || []).find(function (t) { return t.id === threadId; }) || null;
  }

  function findMessageDef(content, threadId, msgId) {
    var th = threadDef(content, threadId);
    if (!th) return null;
    return (th.messages || []).find(function (m) { return m.id === msgId; }) || null;
  }

  // ---------- actions ----------

  // Returns {state, events, halted}. `halted` when an `once` action stopped the list.
  function applyActions(content, state, actions) {
    var events = [];
    if (!actions || !actions.length) return { state: state, events: events };
    for (var i = 0; i < actions.length; i++) {
      var a = actions[i];
      if (!a || !a.a) continue;
      if (a.a === 'once') {
        if (state.inv.onceDone[a.key]) return { state: state, events: events, halted: true };
        state.inv.onceDone[a.key] = true;
        continue;
      }
      switch (a.a) {
        case 'evidence':
          if (state.inv.evidence.indexOf(a.id) === -1) {
            state.inv.evidence.push(a.id);
            events.push({ t: 'evidence', id: a.id });
          }
          break;
        case 'flag':
          state.inv.flags[a.k] = (a.v === undefined ? true : a.v);
          break;
        case 'trust': {
          var w = a.who;
          state.inv.trust[w] = (state.inv.trust[w] || 0) + (a.d || 0);
          break;
        }
        case 'message': {
          var msg = a.message ? clone(a.message)
            : (a.id ? clone(findMessageDef(content, a.thread, a.id)) : null);
          if (!msg || !a.thread) break;
          var arr = state.inv.threads[a.thread] = state.inv.threads[a.thread] || [];
          if (!arr.some(function (m) { return m.id === msg.id; })) {
            arr.push(msg);
            events.push({ t: 'message', threadId: a.thread, message: clone(msg) });
          }
          break;
        }
        case 'notify':
          events.push({ t: 'notify', text: a.text });
          break;
        case 'db':
          if (state.inv.dbUnlocked.indexOf(a.id) === -1) {
            state.inv.dbUnlocked.push(a.id);
            events.push({ t: 'db', id: a.id });
          }
          break;
        case 'note':
          if (state.inv.sysNotes.indexOf(a.id) === -1) {
            state.inv.sysNotes.push(a.id);
            events.push({ t: 'note', id: a.id });
          }
          break;
        default:
          events.push({ t: 'error', text: 'Unknown action: ' + a.a });
      }
    }
    return { state: state, events: events };
  }

  // Conditionally-unlocked DB records (unlockIf) are granted with an event.
  function checkDbUnlocks(content, state, events) {
    (content.database || []).forEach(function (r) {
      if (!r.locked || state.inv.dbUnlocked.indexOf(r.id) !== -1) return;
      if (condsMet(content, state, r.unlockIf)) {
        state.inv.dbUnlocked.push(r.id);
        events.push({ t: 'db', id: r.id });
      }
    });
  }

  function snapshotInv(inv) {
    var c = clone(inv);
    delete c.checkpoints;
    return c;
  }

  // ---------- scene flow ----------

  function enterScene(content, state, sceneId) {
    var scene = sceneById(content, sceneId);
    if (!scene) return { state: state, events: [{ t: 'error', text: 'Scene not found: ' + sceneId }] };
    state.sceneId = sceneId;
    if (state.inv.visited.indexOf(sceneId) === -1) state.inv.visited.push(sceneId);
    var r = applyActions(content, state, scene.onEnter);
    state = r.state;
    var events = r.events;
    checkDbUnlocks(content, state, events);
    if (scene.checkpoint && !state.inv.checkpoints.some(function (c) { return c.id === scene.checkpoint.id; })) {
      var cp = {
        id: scene.checkpoint.id, name: scene.checkpoint.name,
        sceneId: sceneId, storyTime: scene.storyTime || '',
        at: Date.now(), snapshot: snapshotInv(state.inv)
      };
      state.inv.checkpoints.push(cp);
      events.push({ t: 'checkpoint', checkpoint: { id: cp.id, name: cp.name } });
    }
    var se = sceneEnding(content, scene);
    if (se && !state.perm.endingsFound[se]) state.perm.endingsFound[se] = Date.now();
    return { state: state, events: events };
  }

  function getChoices(content, state, scene) {
    return (scene.choices || []).map(function (ch) {
      var ok = condsMet(content, state, ch.if);
      if (ok) return { choice: ch, available: true };
      if (ch.showDisabled) return { choice: ch, available: false, hint: ch.ifHint || 'You cannot do that yet.' };
      return null;
    }).filter(Boolean);
  }

  function choose(content, state, sceneId, choiceId) {
    if (sceneId !== state.sceneId) {
      return { state: state, events: [{ t: 'error', text: 'Choice submitted for a scene that is no longer current.' }] };
    }
    var scene = sceneById(content, sceneId);
    if (!scene) return { state: state, events: [{ t: 'error', text: 'Scene not found' }] };
    var entry = getChoices(content, state, scene).find(function (e) { return e.choice.id === choiceId; });
    if (!entry || !entry.available) {
      return { state: state, events: [{ t: 'error', text: 'That choice is not available.' }] };
    }
    var ch = entry.choice;
    var r = applyActions(content, state, ch.do);
    state = r.state;
    var events = r.events;
    checkDbUnlocks(content, state, events);
    if (ch.ending) {
      if (content.endings[ch.ending] && !state.perm.endingsFound[ch.ending]) {
        state.perm.endingsFound[ch.ending] = Date.now();
      }
      return { state: state, events: events, ending: ch.ending };
    }
    if (ch.go) {
      var r2 = enterScene(content, state, ch.go);
      return { state: r2.state, events: events.concat(r2.events) };
    }
    return { state: state, events: events };
  }

  // Scene-level ending support: a scene with `ending` (string id or {id}) and no choices.
  function sceneEnding(content, scene) {
    if (!scene || !scene.ending) return null;
    var id = (typeof scene.ending === 'string') ? scene.ending : scene.ending.id;
    if (id && content.endings[id]) return id;
    return null;
  }

  // ---------- phone replies ----------

  function reply(content, state, threadId, msgId, replyId) {
    var arr = state.inv.threads[threadId] || [];
    var msg = arr.find(function (m) { return m.id === msgId; });
    if (!msg) return { state: state, events: [{ t: 'error', text: 'Message not found.' }] };
    if (state.inv.repliesDone[msgId]) return { state: state, events: [{ t: 'error', text: 'Already replied.' }] };
    var rep = (msg.replies || []).find(function (x) { return x.id === replyId; });
    if (!rep) return { state: state, events: [{ t: 'error', text: 'Reply not found.' }] };
    state.inv.repliesDone[msgId] = replyId;
    var r = applyActions(content, state, rep.do);
    state = r.state;
    var events = r.events;
    if (rep.response) {
      var rm = clone(rep.response);
      if (!arr.some(function (m) { return m.id === rm.id; })) {
        arr.push(rm);
        events.push({ t: 'message', threadId: threadId, message: clone(rm) });
      }
    }
    return { state: state, events: events };
  }

  function markThreadSeen(state, threadId) {
    var n = (state.inv.threads[threadId] || []).length;
    state.inv.threadSeen[threadId] = n;
    return state;
  }

  function unreadCount(state, threadId) {
    var total = (state.inv.threads[threadId] || []).length;
    return total - (state.inv.threadSeen[threadId] || 0);
  }

  // ---------- checkpoints ----------

  function restoreCheckpoint(content, state, cpId) {
    var idx = state.inv.checkpoints.findIndex(function (c) { return c.id === cpId; });
    if (idx === -1) return { state: state, events: [{ t: 'error', text: 'Checkpoint not found.' }] };
    var cp = state.inv.checkpoints[idx];
    var inv = clone(cp.snapshot);
    inv.checkpoints = state.inv.checkpoints.slice(0, idx + 1);
    state.inv = inv;
    state.sceneId = cp.sceneId;
    return { state: state, events: [{ t: 'restored', checkpoint: { id: cp.id, name: cp.name } }] };
  }

  // ---------- misc state ops ----------

  function dbRecords(content, state) {
    return (content.database || []).map(function (r) {
      var unlocked = !r.locked ||
        state.inv.dbUnlocked.indexOf(r.id) !== -1 ||
        condsMet(content, state, r.unlockIf);
      return { record: r, unlocked: unlocked };
    });
  }

  function setTheory(state, theoryId, optionIdx) {
    state.inv.theories[theoryId] = optionIdx;
    return state;
  }

  function addPlayerNote(state, text) {
    var n = { id: 'pn-' + Date.now().toString(36), text: text, at: Date.now() };
    state.inv.playerNotes.push(n);
    return { state: state, note: n };
  }

  // ---------- content validation ----------

  function validateContent(content) {
    var errs = [];
    var need = function (cond, msg) { if (!cond) errs.push(msg); };
    need(content && content.meta, 'missing meta');
    need(content.meta && content.meta.startScene, 'missing meta.startScene');
    var evIds = Object.keys(content.evidence || {});
    var sceneIds = Object.keys(content.scenes || {});
    need(sceneById(content, content.meta.startScene), 'startScene does not exist: ' + content.meta.startScene);

    var msgIds = {};
    (content.phone.threads || []).forEach(function (th) {
      need(th.id && th.contact, 'thread missing id/contact');
      (th.messages || []).forEach(function (m) {
        need(m.id, 'message missing id in thread ' + th.id);
        if (msgIds[m.id]) errs.push('duplicate message id: ' + m.id);
        msgIds[m.id] = th.id;
        (m.replies || []).forEach(function (rp) {
          need(rp.id && rp.label, 'reply missing id/label in message ' + m.id);
          if (rp.response && !rp.response.id) errs.push('reply response missing id in ' + m.id);
        });
      });
    });
    var dbIds = (content.database || []).map(function (r) { return r.id; });
    var noteIds = (content.systemNotes || []).map(function (n) { return n.id; });

    var checkActions = function (actions, where) {
      (actions || []).forEach(function (a) {
        if (!a || !a.a) return;
        if (a.a === 'evidence' && evIds.indexOf(a.id) === -1) errs.push(where + ': unknown evidence ' + a.id);
        if (a.a === 'message') {
          var th = threadDef(content, a.thread);
          if (!th) { errs.push(where + ': unknown thread ' + a.thread); return; }
          if (a.id && !findMessageDef(content, a.thread, a.id)) errs.push(where + ': unknown message ' + a.id + ' in ' + a.thread);
          if (a.message && !a.message.id) errs.push(where + ': inline message missing id');
        }
        if (a.a === 'db' && dbIds.indexOf(a.id) === -1) errs.push(where + ': unknown db record ' + a.id);
        if (a.a === 'note' && noteIds.indexOf(a.id) === -1) errs.push(where + ': unknown system note ' + a.id);
      });
    };
    var checkConds = function (conds, where) {
      (conds || []).forEach(function (c) {
        if (!c || !c.c) return;
        if (c.c === 'hasEvidence' && evIds.indexOf(c.id) === -1) errs.push(where + ': condition on unknown evidence ' + c.id);
        if (c.c === 'not') checkConds([c.cond], where);
      });
    };

    sceneIds.forEach(function (sid) {
      var s = content.scenes[sid];
      if (s.id !== sid) errs.push('scene key/id mismatch: ' + sid);
      var endId = s.ending ? (typeof s.ending === 'string' ? s.ending : s.ending.id) : null;
      var isEndingScene = !!endId;
      if (isEndingScene && !content.endings[endId]) errs.push(sid + ': unknown ending ' + endId);
      if (!isEndingScene && !(s.choices && s.choices.length)) errs.push(sid + ': dead end (no choices, not an ending scene)');
      checkActions(s.onEnter, sid + '.onEnter');
      (s.choices || []).forEach(function (ch) {
        var w = sid + '.choice ' + ch.id;
        need(ch.id && ch.label, w + ': missing id/label');
        if (ch.go && sceneIds.indexOf(ch.go) === -1) errs.push(w + ': unknown go target ' + ch.go);
        if (ch.ending && !content.endings[ch.ending]) errs.push(w + ': unknown ending ' + ch.ending);
        checkActions(ch.do, w);
        checkConds(ch.if, w);
      });
    });

    // reachability (over-approximate: follow all go links regardless of conditions;
    // ending scenes are reachable terminals when referenced by a choice.ending)
    var seen = {}, q = [content.meta.startScene];
    var endingTargets = {};
    sceneIds.forEach(function (sid) {
      (content.scenes[sid].choices || []).forEach(function (ch) {
        if (ch.ending && content.scenes[ch.ending]) endingTargets[ch.ending] = true;
      });
    });
    while (q.length) {
      var cur = q.pop();
      if (seen[cur]) continue;
      seen[cur] = true;
      var sc = sceneById(content, cur);
      if (!sc) continue;
      (sc.choices || []).forEach(function (ch) { if (ch.go) q.push(ch.go); });
    }
    sceneIds.forEach(function (sid) { if (!seen[sid] && !endingTargets[sid]) errs.push('unreachable scene: ' + sid); });

    (content.database || []).forEach(function (r) { checkConds(r.unlockIf, 'db ' + r.id); });
    return errs;
  }

  return {
    newGame: newGame,
    sceneById: sceneById,
    evalCond: evalCond,
    condsMet: condsMet,
    applyActions: applyActions,
    enterScene: enterScene,
    getChoices: getChoices,
    choose: choose,
    sceneEnding: sceneEnding,
    reply: reply,
    markThreadSeen: markThreadSeen,
    unreadCount: unreadCount,
    restoreCheckpoint: restoreCheckpoint,
    dbRecords: dbRecords,
    setTheory: setTheory,
    addPlayerNote: addPlayerNote,
    validateContent: validateContent,
    clone: clone
  };
});
