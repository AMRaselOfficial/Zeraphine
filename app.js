/* ZERAPHINE app.js — UI layer. Uses window.ZEngine (engine.js, pure logic). */
(function () {
'use strict';
var E = window.ZEngine;
var SAVE_KEY = 'zeraphine-save-v1';
var SETTINGS_KEY = 'zeraphine-settings';

var content = null, state = null;
var msgQueue = [], popupVisible = false;
var modalRender = null; // current modal re-render fn

function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function paras(text) {
  return String(text).split(/\n{2,}/).map(function (p) {
    return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>';
  }).join('');
}
function blocksHTML(blocks) {
  var bh = '';
  (blocks || []).forEach(function (b) {
    if (b.t === 'd') {
      bh += '<div class="blk dialogue"><span class="speaker">' + esc(b.who || '') + '</span>' + paras(b.text) + '</div>';
    } else if (b.t === 'sys') {
      bh += '<div class="blk sys">' + paras(b.text) + '</div>';
    } else {
      bh += '<div class="blk">' + paras(b.text) + '</div>';
    }
  });
  return bh;
}

/* ---------------- settings ---------------- */
function getSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
  catch (e) { return {}; }
}
function applySettings() {
  var s = getSettings();
  document.body.classList.toggle('reduce-motion', !!s.reduceMotion);
  document.body.classList.toggle('large-text', !!s.largeText);
}

/* ---------------- save / load ---------------- */
function save() {
  if (!state) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}
function loadSave() {
  try {
    var s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && s.caseId === content.meta.caseId && s.contentVersion === content.meta.version) return s;
  } catch (e) {}
  return null;
}
function hasSave() { return !!loadSave(); }

/* ---------------- toasts / confirm / popup ---------------- */
function toast(text, sub, isErr) {
  var d = document.createElement('div');
  d.className = 'toast' + (isErr ? ' err' : '');
  d.innerHTML = '<div>' + esc(text) + '</div>' + (sub ? '<small>' + esc(sub) + '</small>' : '');
  d.addEventListener('click', function () { d.remove(); });
  $('toasts').appendChild(d);
  setTimeout(function () { if (d.parentNode) d.remove(); }, 3800);
}

var confirmCb = null;
function confirmDialog(title, body, okLabel, cb) {
  $('confirm-title').textContent = title;
  $('confirm-body').textContent = body;
  $('confirm-ok').textContent = okLabel || 'Confirm';
  confirmCb = cb;
  $('confirm-scrim').classList.remove('hidden');
  $('confirm').classList.remove('hidden');
}
function closeConfirm() {
  $('confirm-scrim').classList.add('hidden');
  $('confirm').classList.add('hidden');
  confirmCb = null;
}

/* ---------------- screens ---------------- */
function showScreen(name) {
  ['title', 'game', 'ending'].forEach(function (n) {
    $('screen-' + n).classList.toggle('hidden', n !== name);
  });
  window.scrollTo(0, 0);
}

function renderTitle() {
  var found = state && state.perm ? Object.keys(state.perm.endingsFound || {}).length : 0;
  var total = content ? Object.keys(content.endings || {}).length : 0;
  $('btn-continue').classList.toggle('hidden', !hasSave());
  $('title-progress').textContent = total ? ('Endings discovered: ' + found + ' / ' + total) : '';
}

/* ---------------- game flow ---------------- */
function handleEvents(events) {
  (events || []).forEach(function (ev) {
    switch (ev.t) {
      case 'evidence': {
        var ed = content.evidence[ev.id];
        toast('Evidence added', ed ? ed.name + ' · ' + ed.id : ev.id);
        break;
      }
      case 'message':
        msgQueue.push({ threadId: ev.threadId, msg: ev.message });
        processMsgQueue();
        break;
      case 'checkpoint':
        toast('Checkpoint created', ev.checkpoint.name);
        break;
      case 'db': {
        var rec = (content.database || []).find(function (r) { return r.id === ev.id; });
        toast('Police database updated', rec ? rec.name : ev.id);
        break;
      }
      case 'note':
        toast('Observation noted', 'Check your notes');
        break;
      case 'notify':
        toast(ev.text);
        break;
      case 'restored':
        toast('Checkpoint restored', ev.checkpoint.name + ' — later discoveries removed');
        break;
      case 'error':
        toast(ev.text, null, true);
        break;
    }
  });
}

function doEnter(sceneId) {
  var r = E.enterScene(content, state, sceneId);
  state = r.state; save();
  handleEvents(r.events);
  renderScene();
}

function doChoose(choiceId) {
  var r = E.choose(content, state, state.sceneId, choiceId);
  state = r.state; save();
  handleEvents(r.events);
  if (r.ending) showEnding(r.ending);
  else renderScene();
}

function doReply(threadId, msgId, replyId) {
  var r = E.reply(content, state, threadId, msgId, replyId);
  state = r.state; save();
  handleEvents(r.events);
  refreshModal();
}

function renderScene() {
  var sc = E.sceneById(content, state.sceneId);
  if (!sc) { toast('Scene missing: ' + state.sceneId, null, true); return; }
  var se = E.sceneEnding(content, sc);
  if (se) { showEnding(se); return; }

  $('story-time').textContent = sc.storyTime || '';
  $('scene-title').textContent = sc.title || '';
  var wrap = $('scene-image-wrap');
  if (sc.image) {
    $('scene-image').src = sc.image;
    $('scene-image').alt = sc.title || 'Scene illustration';
    wrap.classList.remove('hidden');
  } else wrap.classList.add('hidden');

  var bh = blocksHTML(sc.blocks);
  $('blocks').innerHTML = bh;

  var ch = $('choices');
  ch.innerHTML = '';
  E.getChoices(content, state, sc).forEach(function (entry) {
    var c = entry.choice;
    var btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = esc(c.label) +
      (c.sub ? '<span class="sub">' + esc(c.sub) + '</span>' : '') +
      (!entry.available && entry.hint ? '<span class="hint">' + esc(entry.hint) + '</span>' : '');
    if (!entry.available) btn.disabled = true;
    else btn.addEventListener('click', function () { doChoose(c.id); });
    ch.appendChild(btn);
  });
  window.scrollTo(0, 0);
}

/* ---------------- phone popup ---------------- */
function processMsgQueue() {
  if (popupVisible || !msgQueue.length) return;
  popupVisible = true;
  var item = msgQueue.shift();
  var th = (content.phone.threads || []).find(function (t) { return t.id === item.threadId; });
  $('pp-contact').textContent = 'New message — ' + (th ? th.contact : 'Unknown');
  $('pp-snippet').textContent = item.msg.text.length > 110 ? item.msg.text.slice(0, 110) + '…' : item.msg.text;
  $('phone-popup').classList.remove('hidden');
  $('pp-open').onclick = function () {
    hidePopup();
    openThreadView(item.threadId);
  };
  $('pp-dismiss').onclick = hidePopup;
}
function hidePopup() {
  $('phone-popup').classList.add('hidden');
  popupVisible = false;
  processMsgQueue();
}

/* ---------------- drawer ---------------- */
var MENU = [
  { id: 'phone', label: 'Phone', icon: '✆' },
  { id: 'db', label: 'Police Database', icon: '▤' },
  { id: 'notes', label: 'Notes & Theories', icon: '✎' },
  { id: 'evidence', label: 'Evidence', icon: '◉' },
  { id: 'photos', label: 'Photos', icon: '▣' },
  { id: 'documents', label: 'Documents', icon: '▦' },
  { id: 'checkpoints', label: 'Checkpoints', icon: '↺' },
  { id: 'collection', label: 'Collection', icon: '★' },
  { id: 'case', label: 'Case Brief', icon: '◈' },
  { id: 'settings', label: 'Settings', icon: '⚙' }
];
function unreadTotal() {
  return (content.phone.threads || []).reduce(function (n, t) {
    return n + E.unreadCount(state, t.id);
  }, 0);
}
function openDrawer() {
  var box = $('drawer-items');
  box.innerHTML = '';
  MENU.forEach(function (m) {
    var b = document.createElement('button');
    b.className = 'drawer-item';
    var badge = '';
    if (m.id === 'phone') {
      var u = unreadTotal();
      if (u > 0) badge = '<span class="badge">' + u + '</span>';
    }
    if (m.id === 'evidence' && state.inv.evidence.length) {
      badge = '<span class="badge" style="background:#3a2f16">' + state.inv.evidence.length + '</span>';
    }
    b.innerHTML = '<span class="di-icon">' + m.icon + '</span><span>' + m.label + '</span>' + badge;
    b.addEventListener('click', function () { closeDrawer(); openView(m.id); });
    box.appendChild(b);
  });
  $('drawer-scrim').classList.remove('hidden');
  $('drawer').classList.remove('hidden');
}
function closeDrawer() {
  $('drawer-scrim').classList.add('hidden');
  $('drawer').classList.add('hidden');
}

/* ---------------- modal ---------------- */
function openModal(title, render) {
  $('modal-title').textContent = title;
  modalRender = render;
  render();
  $('modal-scrim').classList.remove('hidden');
  $('modal').classList.remove('hidden');
}
function closeModal() {
  $('modal-scrim').classList.add('hidden');
  $('modal').classList.add('hidden');
  modalRender = null;
}
function refreshModal() { if (modalRender) modalRender(); }

/* ---------------- views ---------------- */
function openView(id) {
  switch (id) {
    case 'phone': openModal('Phone', renderPhoneList); break;
    case 'db': openModal('Police Database', renderDbList); break;
    case 'notes': openModal('Notes & Theories', renderNotes); break;
    case 'evidence': openModal('Evidence', function () { renderEvidenceGrid(null); }); break;
    case 'photos': openModal('Photos', function () { renderEvidenceGrid('Photo'); }); break;
    case 'documents': openModal('Documents', function () { renderEvidenceGrid('Doc'); }); break;
    case 'checkpoints': openModal('Checkpoints', renderCheckpoints); break;
    case 'collection': openModal('Collection', renderCollection); break;
    case 'case': openModal('Case Brief', renderCaseBrief); break;
    case 'settings': openModal('Settings', renderSettings); break;
  }
}

/* phone */
function renderPhoneList() {
  var body = $('modal-body');
  body.className = '';
  var h = '';
  (content.phone.threads || []).forEach(function (th) {
    var msgs = state.inv.threads[th.id] || [];
    if (!msgs.length) return;
    var last = msgs[msgs.length - 1];
    var u = E.unreadCount(state, th.id);
    h += '<button class="thread-row" data-th="' + esc(th.id) + '">' +
      '<div><div class="t-contact">' + esc(th.contact) + (u ? ' <span class="badge">' + u + '</span>' : '') + '</div>' +
      '<div class="t-snippet">' + esc(last.text.slice(0, 60)) + '</div></div></button>';
  });
  body.innerHTML = h || '<div class="empty-note">No messages yet.</div>';
  body.querySelectorAll('.thread-row').forEach(function (el) {
    el.addEventListener('click', function () { openThreadView(el.getAttribute('data-th')); });
  });
}
function openThreadView(threadId) {
  openModal('Phone', function () { renderThread(threadId); });
}
function renderThread(threadId) {
  var body = $('modal-body');
  body.className = 'chat';
  var th = (content.phone.threads || []).find(function (t) { return t.id === threadId; });
  var msgs = state.inv.threads[threadId] || [];
  var h = '<button class="back-link" id="chat-back">← All messages</button>';
  msgs.forEach(function (m, i) {
    var cls = m.from === 'me' ? 'me' : 'them';
    h += '<div class="msg ' + cls + '">' + esc(m.text) +
      (m.at ? '<span class="m-at">' + esc(m.at) + '</span>' : '') + '</div>';
    var isLast = i === msgs.length - 1;
    if (isLast && m.replies && m.replies.length && !state.inv.repliesDone[m.id]) {
      h += '<div class="replies">';
      m.replies.forEach(function (rp) {
        h += '<button class="choice-btn" data-reply="' + esc(rp.id) + '" data-msg="' + esc(m.id) + '">' + esc(rp.label) + '</button>';
      });
      h += '</div>';
    }
  });
  body.innerHTML = h;
  $('chat-back').addEventListener('click', function () { E.markThreadSeen(state, threadId); save(); renderPhoneList(); });
  body.querySelectorAll('[data-reply]').forEach(function (el) {
    el.addEventListener('click', function () {
      doReply(threadId, el.getAttribute('data-msg'), el.getAttribute('data-reply'));
    });
  });
  E.markThreadSeen(state, threadId); save();
  body.scrollTop = body.scrollHeight;
}

/* police database */
function renderDbList(filter) {
  var body = $('modal-body');
  body.className = '';
  var recs = E.dbRecords(content, state);
  var q = (filter || '').toLowerCase();
  var h = '<input class="db-search" id="db-q" placeholder="Search records…" value="' + esc(filter || '') + '">';
  var shown = 0;
  recs.forEach(function (r) {
    var rec = r.record;
    var hay = (rec.name + ' ' + rec.summary + ' ' + rec.kind).toLowerCase();
    if (q && hay.indexOf(q) === -1) return;
    shown++;
    h += '<button class="db-row" data-db="' + esc(rec.id) + '">' +
      '<span class="db-kind">' + esc(rec.kind) + '</span>' +
      '<div class="db-name">' + esc(rec.name) + '</div>' +
      (r.unlocked ? '<div class="db-locked" style="font-style:normal">' + esc(rec.summary.slice(0, 90)) + '…</div>'
                  : '<div class="db-locked">🔒 Restricted — ' + esc(rec.unlockHint || 'requires further investigation') + '</div>') +
      '</button>';
  });
  if (!shown) h += '<div class="empty-note">No matching records.</div>';
  body.innerHTML = h;
  var input = $('db-q');
  input.addEventListener('input', function () { renderDbList(input.value); });
  body.querySelectorAll('[data-db]').forEach(function (el) {
    el.addEventListener('click', function () { renderDbRecord(el.getAttribute('data-db'), filter); });
  });
  // keep focus at end
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}
function renderDbRecord(id, filter) {
  var body = $('modal-body');
  var entry = E.dbRecords(content, state).find(function (r) { return r.record.id === id; });
  if (!entry) return;
  var rec = entry.record;
  var h = '<button class="back-link" id="db-back">← Search results</button><div class="record-detail">';
  h += '<span class="db-kind">' + esc(rec.kind) + '</span><h3>' + esc(rec.name) + '</h3>';
  if (rec.photo) h += '<img src="' + esc(rec.photo) + '" alt="" style="width:100%;border-radius:10px;margin-bottom:12px">';
  if (entry.unlocked) h += paras(rec.details || rec.summary);
  else h += '<p class="db-locked">🔒 Restricted record.<br>' + esc(rec.unlockHint || 'Further investigation required.') + '</p>';
  h += '</div>';
  body.innerHTML = h;
  $('db-back').addEventListener('click', function () { renderDbList(filter); });
}

/* notes */
var notesTab = 'obs';
function renderNotes() {
  var body = $('modal-body');
  body.className = '';
  var h = '<div class="tabs">' +
    '<button class="tab' + (notesTab === 'obs' ? ' active' : '') + '" data-tab="obs">Observations</button>' +
    '<button class="tab' + (notesTab === 'mine' ? ' active' : '') + '" data-tab="mine">My Notes</button>' +
    '<button class="tab' + (notesTab === 'theory' ? ' active' : '') + '" data-tab="theory">Theory Board</button></div><div id="notes-tab-body"></div>';
  body.innerHTML = h;
  body.querySelectorAll('[data-tab]').forEach(function (el) {
    el.addEventListener('click', function () { notesTab = el.getAttribute('data-tab'); renderNotes(); });
  });
  var tb = $('notes-tab-body');
  if (notesTab === 'obs') {
    if (!state.inv.sysNotes.length) tb.innerHTML = '<div class="empty-note">No observations yet. Examine scenes closely.</div>';
    else tb.innerHTML = state.inv.sysNotes.map(function (id) {
      var n = (content.systemNotes || []).find(function (x) { return x.id === id; });
      return n ? '<div class="note-item">' + esc(n.text) + '</div>' : '';
    }).join('');
  } else if (notesTab === 'mine') {
    var list = state.inv.playerNotes.map(function (n) {
      return '<div class="note-item">' + esc(n.text) +
        '<button class="mini-btn" data-delnote="' + n.id + '">Delete</button></div>';
    }).join('');
    tb.innerHTML = '<div class="note-add"><textarea id="note-text" placeholder="Write a detective note…"></textarea>' +
      '<button class="btn small primary" id="note-add-btn">Add</button></div>' +
      (list || '<div class="empty-note">No notes yet.</div>');
    $('note-add-btn').addEventListener('click', function () {
      var t = $('note-text').value.trim();
      if (!t) return;
      E.addPlayerNote(state, t); save(); renderNotes();
    });
    tb.querySelectorAll('[data-delnote]').forEach(function (el) {
      el.addEventListener('click', function () {
        state.inv.playerNotes = state.inv.playerNotes.filter(function (n) { return n.id !== el.getAttribute('data-delnote'); });
        save(); renderNotes();
      });
    });
  } else {
    tb.innerHTML = (content.theories || []).map(function (th) {
      var sel = state.inv.theories[th.id];
      var opts = th.options.map(function (o, i) {
        return '<button class="theory-opt' + (sel === i ? ' selected' : '') + '" data-th="' + esc(th.id) + '" data-i="' + i + '">' + esc(o) + '</button>';
      }).join('');
      return '<div class="theory-q">' + esc(th.question) + '</div><div class="theory-opts">' + opts + '</div>';
    }).join('') + '<div class="empty-note" style="margin-top:14px">Theories organize your thinking. They never confirm the truth by themselves.</div>';
    tb.querySelectorAll('.theory-opt').forEach(function (el) {
      el.addEventListener('click', function () {
        E.setTheory(state, el.getAttribute('data-th'), parseInt(el.getAttribute('data-i'), 10));
        save(); renderNotes();
      });
    });
  }
}

/* evidence */
function renderEvidenceGrid(type) {
  var body = $('modal-body');
  body.className = '';
  var ids = state.inv.evidence;
  var cards = ids.map(function (id) { return content.evidence[id]; }).filter(function (ev) {
    if (!ev) return false;
    if (!type) return true;
    if (type === 'Doc') return ev.type === 'Document' || ev.type === 'Digital';
    return ev.type === type;
  });
  if (!cards.length) {
    body.innerHTML = '<div class="empty-note">Nothing here yet. Keep investigating.</div>';
    return;
  }
  body.innerHTML = '<div class="ev-grid">' + cards.map(function (ev) {
    return '<button class="ev-card" data-ev="' + esc(ev.id) + '">' +
      (ev.icon ? '<img src="' + esc(ev.icon) + '" alt="" loading="lazy">' : '') +
      '<div class="ev-name">' + esc(ev.name) + '</div><div class="ev-id">' + esc(ev.id) + '</div></button>';
  }).join('') + '</div>';
  body.querySelectorAll('[data-ev]').forEach(function (el) {
    el.addEventListener('click', function () { renderEvidenceViewer(el.getAttribute('data-ev'), type); });
  });
}
function renderEvidenceViewer(id, type) {
  var body = $('modal-body');
  var ev = content.evidence[id];
  if (!ev) return;
  body.innerHTML = '<button class="back-link" id="ev-back">← Evidence list</button>' +
    '<div class="ev-viewer">' +
    (ev.icon ? '<img src="' + esc(ev.icon) + '" alt="' + esc(ev.name) + '">' : '') +
    '<h3 style="font-family:var(--serif);margin:14px 0 4px">' + esc(ev.name) + '</h3>' +
    '<div class="ev-meta"><span class="ev-tag">' + esc(ev.id) + '</span><span class="ev-tag">' + esc(ev.type) + '</span>' +
    '<span class="ev-tag">Confidence: ' + esc(ev.confidence || '—') + '</span></div>' +
    paras(ev.description || '') + (ev.detail ? paras(ev.detail) : '') +
    '<p style="color:var(--faint);font-size:.8rem">Source: ' + esc(ev.sourceScene || '—') + '</p></div>';
  $('ev-back').addEventListener('click', function () { renderEvidenceGrid(type); });
}

/* checkpoints */
function renderCheckpoints() {
  var body = $('modal-body');
  body.className = '';
  var cps = state.inv.checkpoints;
  if (!cps.length) { body.innerHTML = '<div class="empty-note">No checkpoints yet.</div>'; return; }
  body.innerHTML = '<p style="color:var(--muted);font-size:.9rem;line-height:1.6">Restoring a checkpoint rewinds the investigation to that moment. Anything discovered afterwards is removed. Endings and collection progress are never erased.</p>' +
    cps.map(function (cp) {
      return '<div class="cp-row"><div class="cp-name">' + esc(cp.name) + '</div>' +
        '<div class="cp-meta">' + esc(cp.storyTime || '') + ' · ' + new Date(cp.at).toLocaleString() + '</div>' +
        '<button class="btn small" data-cp="' + esc(cp.id) + '">Restore this checkpoint</button></div>';
    }).join('');
  body.querySelectorAll('[data-cp]').forEach(function (el) {
    el.addEventListener('click', function () {
      var cpId = el.getAttribute('data-cp');
      confirmDialog('Restore checkpoint?',
        'This rewinds your investigation to this checkpoint. Evidence, messages and flags discovered afterwards will be removed. Your found endings and collection are safe.',
        'Restore',
        function () {
          var r = E.restoreCheckpoint(content, state, cpId);
          state = r.state; save();
          closeModal(); handleEvents(r.events); renderScene();
        });
    });
  });
}

/* collection */
function renderCollection() {
  var body = $('modal-body');
  body.className = '';
  var found = state.perm.endingsFound || {};
  var ids = Object.keys(found);
  var totalEv = Object.keys(content.evidence || {}).length;
  var h = '<div class="stat-row"><span>Evidence discovered</span><span>' + state.inv.evidence.length + ' / ' + totalEv + '</span></div>' +
    '<div class="stat-row"><span>Endings discovered</span><span>' + ids.length + ' / ' + Object.keys(content.endings || {}).length + '</span></div>' +
    '<div class="stat-row"><span>Scenes visited</span><span>' + state.inv.visited.length + '</span></div>' +
    '<h3 style="margin:22px 0 12px;font-family:var(--serif)">Endings</h3>';
  if (!ids.length) h += '<div class="empty-note">No endings discovered yet.</div>';
  else h += ids.map(function (id) {
    var e = content.endings[id];
    if (!e) return '';
    return '<div class="ending-row"><div class="e-title">' + esc(e.title) + '</div>' +
      '<div class="e-meta">Discovered ' + new Date(found[id]).toLocaleString() + '</div></div>';
  }).join('');
  body.innerHTML = h;
}

/* case brief */
function renderCaseBrief() {
  var body = $('modal-body');
  body.className = '';
  body.innerHTML =
    '<div class="record-detail"><h3>The House at Blackwood Lane</h3>' +
    paras('Daniel Whitmore was found dead in his study at 17 Blackwood Lane. His wife, Eleanor Whitmore, claims she shot him in self-defense during an argument. The physical scene does not fully agree with her account.') +
    paras('You are the detective assigned to the case. Examine the scene, question the people around Daniel, and decide what the truth is worth.') +
    '<h3 style="margin-top:20px">Persons of interest</h3>' +
    paras('Eleanor Whitmore — the wife. Says she fired in self-defense.\nMarcus Vale — Daniel\'s business partner. Arrived after the shooting, by his own admission.\nClaire Whitmore — the daughter. Was home that night.\nDr. Adrian Cole — the family physician.') +
    '</div>';
}

/* settings */
function renderSettings() {
  var body = $('modal-body');
  body.className = '';
  var s = getSettings();
  body.innerHTML =
    '<div class="stat-row"><span>Reduce motion</span><button class="btn small" id="set-motion">' + (s.reduceMotion ? 'On' : 'Off') + '</button></div>' +
    '<div class="stat-row"><span>Larger text</span><button class="btn small" id="set-text">' + (s.largeText ? 'On' : 'Off') + '</button></div>' +
    '<div style="margin-top:22px;display:flex;flex-direction:column;gap:10px">' +
    '<button class="btn" id="set-restart">Restart case (keep endings)</button>' +
    '<button class="btn" id="set-erase" style="border-color:var(--red);color:var(--red)">Erase all progress</button></div>';
  $('set-motion').addEventListener('click', function () {
    var st = getSettings(); st.reduceMotion = !st.reduceMotion;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(st)); applySettings(); renderSettings();
  });
  $('set-text').addEventListener('click', function () {
    var st = getSettings(); st.largeText = !st.largeText;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(st)); applySettings(); renderSettings();
  });
  $('set-restart').addEventListener('click', function () {
    confirmDialog('Restart the case?', 'Your investigation progress will be reset, but discovered endings stay in your collection.', 'Restart', function () {
      var perm = state.perm;
      state = E.newGame(content); state.perm = perm;
      closeModal(); doEnter(content.meta.startScene);
    });
  });
  $('set-erase').addEventListener('click', function () {
    confirmDialog('Erase everything?', 'All progress, endings and notes will be permanently deleted.', 'Erase', function () {
      localStorage.removeItem(SAVE_KEY);
      state = null; closeModal(); showScreen('title'); renderTitle();
    });
  });
}

/* ---------------- ending ---------------- */
function showEnding(endingId) {
  var e = content.endings[endingId];
  if (!e) { renderScene(); return; }
  closeModal(); closeDrawer();
  $('ending-title').textContent = e.title;
  var escene = content.scenes[endingId];
  $('ending-report').innerHTML = escene ? blocksHTML(escene.blocks) : '';
  if (e.image) {
    $('ending-image').src = e.image;
    $('ending-image-wrap').classList.remove('hidden');
  } else $('ending-image-wrap').classList.add('hidden');
  $('ending-summary').textContent = e.summary || '';
  $('ending-epilogue').textContent = e.epilogue || '';
  var found = Object.keys(state.perm.endingsFound || {}).length;
  var total = Object.keys(content.endings || {}).length;
  $('ending-stats').innerHTML = '<span>Evidence <b>' + state.inv.evidence.length + '/' + Object.keys(content.evidence || {}).length + '</b></span>' +
    '<span>Endings <b>' + found + '/' + total + '</b></span>';
  showScreen('ending');
}

/* ---------------- boot ---------------- */
function boot() {
  applySettings();
  fetch('content.json').then(function (r) {
    if (!r.ok) throw new Error('content.json not found (HTTP ' + r.status + ')');
    return r.json();
  }).then(function (c) {
    content = c;
    var errs = E.validateContent(content);
    if (errs.length) {
      $('title-error').classList.remove('hidden');
      $('title-error').textContent = 'Content errors: ' + errs.slice(0, 4).join(' | ') + (errs.length > 4 ? ' (+' + (errs.length - 4) + ' more)' : '');
    }
    var sv = loadSave();
    if (sv) state = sv;
    renderTitle();
  }).catch(function (err) {
    $('title-error').classList.remove('hidden');
    $('title-error').textContent = 'Failed to load game content: ' + err.message;
  });

  $('btn-new').addEventListener('click', function () {
    var start = function () {
      var perm = (state && state.perm) ? state.perm : undefined;
      state = E.newGame(content);
      if (perm) state.perm = perm;
      showScreen('game');
      doEnter(content.meta.startScene);
      renderTitle();
    };
    if (hasSave()) confirmDialog('Start a new investigation?', 'Your current progress will be replaced. Discovered endings stay in your collection.', 'Start new', start);
    else start();
  });
  $('btn-continue').addEventListener('click', function () {
    var sv = loadSave();
    if (!sv) { toast('No saved investigation found', null, true); return; }
    state = sv;
    showScreen('game');
    renderScene();
  });
  $('btn-menu').addEventListener('click', openDrawer);
  $('drawer-close').addEventListener('click', closeDrawer);
  $('drawer-scrim').addEventListener('click', closeDrawer);
  $('modal-close').addEventListener('click', closeModal);
  $('modal-scrim').addEventListener('click', closeModal);
  $('confirm-ok').addEventListener('click', function () { var cb = confirmCb; closeConfirm(); if (cb) cb(); });
  $('confirm-cancel').addEventListener('click', closeConfirm);
  $('confirm-scrim').addEventListener('click', closeConfirm);
  $('btn-ending-replay').addEventListener('click', function () { showScreen('game'); renderScene(); openView('checkpoints'); });
  $('btn-ending-title').addEventListener('click', function () { showScreen('title'); renderTitle(); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { closeModal(); closeDrawer(); closeConfirm(); if (popupVisible) hidePopup(); }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
