/* Client-side Firebase chat with email/password auth (create account), anonymous fallback,
   admin support (admins stored in 'admins' collection keyed by email or uid),
   delete by owner or admin, admin names highlighted in green,
   admin panel shows registered users and allows admins to send direct messages (DM).
*/
(async function () {
  'use strict';

  // ----- CONFIG: paste your firebaseConfig here -----
  const firebaseConfig = {
    apiKey: "AIzaSyBMRiWgV95sVWkrIYXPbHhEUXEaUZf4WJ4",
    authDomain: "medarbetarchatt.firebaseapp.com",
    projectId: "medarbetarchatt",
    storageBucket: "medarbetarchatt.firebasestorage.app",
    messagingSenderId: "676707351619",
    appId: "1:676707351619:web:71ec266872c43a215ce8f6",
    measurementId: "G-PP7L8DKVBK"
  };
  // ---------------------------------------------------

  const MAX_MESSAGE_LENGTH = 800;
  const MIN_POST_INTERVAL_MS = 3000;
  const LAST_POST_KEY = 'chat-last-post-ts';
  const NAME_STORE_KEY = 'chat-name';
  const bannedWords = ['fuck', 'shit', 'idiot']; // client-side only

  async function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  try {
    await loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js');
  } catch (e) {
    console.error('Failed to load Firebase SDKs', e);
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized');
  } catch (e) {
    console.error('Firebase initialize failed', e);
    return;
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  await new Promise(res => {
    if (document.readyState !== 'loading') return res();
    document.addEventListener('DOMContentLoaded', res);
  });

  const chatRoot = document.getElementById('chat');
  const statusEl = document.getElementById('chat-status');
  // typing indicator element
  let typingEl = document.getElementById('chat-typing');
  if (!typingEl) {
    typingEl = document.createElement('div');
    typingEl.id = 'chat-typing';
    statusEl.parentNode.insertBefore(typingEl, statusEl.nextSibling);
  }
  const messagesEl = document.getElementById('chat-messages');
  const form = document.getElementById('chat-form');
  const nameInput = document.getElementById('chat-name');
  const textInput = document.getElementById('chat-text');
  const sendBtn = document.getElementById('chat-send');

  if (!chatRoot || !messagesEl || !form || !nameInput || !textInput || !statusEl || !sendBtn) {
    console.error('Chat UI elements missing');
    return;
  }

  // Insert auth UI above status (if not already present)
  let authWrap = document.getElementById('chat-auth');
  if (!authWrap) {
    authWrap = document.createElement('div');
    authWrap.id = 'chat-auth';
    authWrap.style.marginBottom = '.6rem';
    authWrap.style.display = 'flex';
    authWrap.style.flexWrap = 'wrap';
    authWrap.style.gap = '.4rem';
    authWrap.innerHTML = `
      <input id="chat-email" type="email" placeholder="E-post" style="width:220px;padding:.35rem" />
      <input id="chat-pass" type="password" placeholder="Lösenord" style="width:180px;padding:.35rem" />
      <button id="chat-signin" type="button" style="padding:.35rem .6rem">Logga in</button>
      <button id="chat-create" type="button" style="padding:.35rem .6rem">Skapa konto</button>
      <button id="chat-anon" type="button" style="padding:.35rem .6rem">Fortsätt anonymt</button>
      <button id="chat-signout" type="button" style="padding:.35rem .6rem;display:none">Logga ut</button>
    `;
    chatRoot.insertBefore(authWrap, statusEl);
  }

  // Admin panel (shows registered users + DM buttons). Visible only for admins.
  let adminPanel = document.getElementById('chat-admin-panel');
  if (!adminPanel) {
    adminPanel = document.createElement('div');
    adminPanel.id = 'chat-admin-panel';
    adminPanel.style.margin = '.5rem 0';
    adminPanel.style.display = 'none';
    adminPanel.innerHTML = `
      <details id="chat-admin-details">
        <summary style="cursor:pointer;padding:.25rem .5rem;border:1px solid #2ecc71;background:#fff;color:#2ecc71;border-radius:4px">Admin-panel</summary>
        <div style="padding:.6rem; background:#fff; border-radius:4px; margin-top:.4rem; box-shadow:0 0 0.5rem rgba(0,0,0,0.05);">
          <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.6rem">
            <strong>Registrerade användare</strong>
            <button id="admin-export-btn" style="margin-left:auto;padding:.25rem .5rem;border-radius:4px;border:1px solid #ddd;background:#f7f7f7;cursor:pointer">Exportera CSV</button>
            <label style="display:flex;align-items:center;gap:.3rem;margin-left:.6rem;font-size:.9rem;color:#333">
              <input id="admin-pinned-toggle" type="checkbox" /> Visa pinnade högst upp
            </label>
          </div>
          <div id="admin-users-wrapper" style="max-height:220px;overflow:auto;margin-top:.4rem;border:1px solid #eee;padding:.4rem;border-radius:4px;background:#fafafa;">
            <ul id="admin-users-list" style="margin:0;padding:0;list-style:none;"></ul>
          </div>
          <div id="admin-msg" style="color:#2ecc71;margin-top:.5rem;font-size:.9rem;display:none"></div>
        </div>
      </details>
    `;
    chatRoot.insertBefore(adminPanel, statusEl.nextSibling);
  }

  setTimeout(() => {
    const exp = document.getElementById('admin-export-btn');
    if (exp) exp.addEventListener('click', exportVisibleMessagesCSV);
    const pinToggle = document.getElementById('admin-pinned-toggle');
    if (pinToggle) {
      // allow admin to control client-side pinned-first reorder
      pinToggle.addEventListener('change', (e) => {
        window._chat_showPinnedFirst = !!e.target.checked;
        // re-render last snapshot by forcing a small refresh: re-query latest docs quickly
        try { db.collection('chats').orderBy('ts','asc').limitToLast(400).get().then(snap => {
          // mimic snapshot handler to re-render
          messagesEl.innerHTML = '';
          const docs = [];
          snap.forEach(d => docs.push({ id: d.id, data: d.data() }));
          // reuse same renderer logic used in onSnapshot below
          const pinned = [], normal = [];
          docs.forEach(({id, data}) => ((data && data.pinned) ? pinned : normal).push({id,data}));
          const combined = (window._chat_showPinnedFirst !== false) ? pinned.concat(normal) : normal.concat(pinned);
          combined.forEach(({id,data}) => messagesEl.appendChild(renderMessage(id, data)));
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }).catch(()=>{}); } catch(e) {}
      });
      // initialize global flag
      window._chat_showPinnedFirst = !!pinToggle.checked;
    }
  }, 200);

  const emailInput = document.getElementById('chat-email');
  const passInput = document.getElementById('chat-pass');
  const signInBtn = document.getElementById('chat-signin');
  const createBtn = document.getElementById('chat-create');
  const anonBtn = document.getElementById('chat-anon');
  const signOutBtn = document.getElementById('chat-signout');

  const adminUsersList = document.getElementById('admin-users-list');
  const adminMsgEl = document.getElementById('admin-msg');

  const regexEscape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bannedRegex = new RegExp('\\b(' + bannedWords.map(regexEscape).join('|') + ')\\b', 'gi');
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function showTemp(msg, timeout = 3000) {
    let el = document.getElementById('chat-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'chat-toast';
      el.style.position = 'fixed';
      el.style.right = '1rem';
      el.style.bottom = '1rem';
      el.style.background = 'rgba(0,0,0,0.8)';
      el.style.color = '#fff';
      el.style.padding = '0.5rem 0.75rem';
      el.style.borderRadius = '4px';
      el.style.zIndex = 9999;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(el._t);
    el._t = setTimeout(() => el.style.display = 'none', timeout);
  }
  function replaceProfanity(s) { return s.replace(bannedRegex, m => '•'.repeat(m.length)); }
  function canPostNow() { try { const last = Number(localStorage.getItem(LAST_POST_KEY) || 0); return (Date.now() - last) >= MIN_POST_INTERVAL_MS; } catch (e) { return true; } }
  function rememberPostTs() { try { localStorage.setItem(LAST_POST_KEY, String(Date.now())); } catch (e) {} }
  function saveName(name) { try { localStorage.setItem(NAME_STORE_KEY, name); } catch (e) {} }
  function loadName() { try { return localStorage.getItem(NAME_STORE_KEY) || ''; } catch (e) { return ''; } }

  // Admin caches
  const adminEmails = new Set();
  const adminUids = new Set();
  let adminReady = false; 

  function isUidAdmin(uid, email) {
    if (!uid && !email) return false;
    if (uid && adminUids.has(uid)) return true;
    if (email && adminEmails.has(email.toLowerCase())) return true;
    return false;
  }

  // Debug helper: inspect current auth/admin/users state from console
  try {
    window.chatDebug = {
      logState() {
        const u = auth.currentUser || currentUser;
        console.debug('chatDebug: user=', u && { uid: u.uid, email: (u.email||'').toLowerCase(), isAnonymous: !!u.isAnonymous });
        console.debug('chatDebug: adminEmails=', Array.from(adminEmails), 'adminUids=', Array.from(adminUids));
        try { console.debug('chatDebug: registeredUsers=', registeredUsers ? registeredUsers.slice(0,50) : []); } catch(e){}
      }
    };
  } catch (e) { /* noop if window not writable */ }
  
  function refreshAdminPanelVisibility() {
    const user = auth.currentUser || currentUser;
    const userEmail = user && user.email ? String(user.email).toLowerCase() : null;
    const userUid = user && user.uid ? String(user.uid) : null;
    const isCurrentAdmin = isUidAdmin(userUid, userEmail);
    if (adminPanel) adminPanel.style.display = isCurrentAdmin ? '' : 'none';
  }

  function updateAdminStyles() {
    const currentUid = (auth.currentUser && auth.currentUser.uid) || null;
    const currentEmail = (auth.currentUser && auth.currentUser.email) ? String(auth.currentUser.email).toLowerCase() : null;
    Array.from(messagesEl.children).forEach(child => {
      const uid = child.dataset.uid || '';
      const nameEl = child.querySelector('.msg-name');
      const badgeEl = child.querySelector('.admin-badge');
      const msgNameText = (nameEl && nameEl.textContent) ? nameEl.textContent.trim().split(/\s+/)[0] : '';
      const messageEmailFallback = msgNameText && msgNameText.includes('@') ? msgNameText.toLowerCase() : null;

      // admin badge / name color
      if (nameEl) {
        if (isUidAdmin(uid, messageEmailFallback)) {
          nameEl.style.color = '#2ecc71';
          if (!badgeEl) {
            const b = document.createElement('span');
            b.className = 'admin-badge';
            b.textContent = ' admin';
            b.style.marginLeft = '.4rem';
            b.style.padding = '.05rem .3rem';
            b.style.borderRadius = '3px';
            b.style.background = '#2ecc71';
            b.style.color = '#fff';
            b.style.fontSize = '0.8rem';
            nameEl.appendChild(b);
          }
        } else {
          nameEl.style.color = '';
          if (badgeEl) badgeEl.remove();
        }
      }

      // controls visibility: delete, edit, pin
      const deleteBtn = child.querySelector('.msg-delete');
      const editBtn = child.querySelector('.msg-edit');
      const pinBtn = child.querySelector('.msg-pin');
      const pinnedFlag = child.dataset.pinned === 'true';

      const canDelete = currentUid && (currentUid === uid || isUidAdmin(currentUid, currentEmail));
      const canEdit = currentUid && (currentUid === uid || isUidAdmin(currentUid, currentEmail));
      const canPin = currentUid && isUidAdmin(currentUid, currentEmail);

      if (deleteBtn) deleteBtn.style.display = canDelete ? '' : 'none';
      if (editBtn) editBtn.style.display = canEdit ? '' : 'none';
      if (pinBtn) {
        pinBtn.style.display = canPin ? '' : 'none';
        // update text to reflect current pinned state
        pinBtn.textContent = pinnedFlag ? 'Avpinna' : 'Pinna';
        pinBtn.title = pinnedFlag ? 'Ta bort pin' : 'Pinna meddelande';
      }
    });
  }

  // Listen admins collection
  db.collection('admins').onSnapshot(snapshot => {
    adminEmails.clear();
    adminUids.clear();
    snapshot.forEach(doc => {
      const id = String(doc.id || '').trim();
      const lid = id.toLowerCase();
      if (lid.includes('@')) adminEmails.add(lid);
      else adminUids.add(id);
      const data = doc.data() || {};
      if (data.uid) adminUids.add(String(data.uid).trim());
      if (data.email) adminEmails.add(String(data.email).toLowerCase().trim());
    });
    adminReady = true;
    console.debug('chat: adminEmails=', Array.from(adminEmails), 'adminUids=', Array.from(adminUids));
    renderAdminUsersList(); // will re-render users list visibility if needed
    updateAdminStyles();
    refreshAdminPanelVisibility();
    // if current user is admin, attach users listener now
    try {
      const u = auth.currentUser || currentUser;
      if (u && isUidAdmin(u.uid, u.email)) attachUsersListener();
    } catch (e) {}
  }, err => {
    console.warn('Failed to listen to admins collection', err);
  });

  const registeredUsers = []; // array of { uid, email, name }
  function renderAdminUsersList() {
    if (!adminUsersList) return;
    adminUsersList.innerHTML = '';
    registeredUsers.forEach(u => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.padding = '.25rem 0';
      li.innerHTML = `<div style="min-width:0"><strong style="display:inline-block;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(u.name || u.email || u.uid)}</strong><div style="color:#666;font-size:.85rem">${escapeHtml(u.email || u.uid || '')}</div></div>`;
      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.gap = '.4rem';
      // DM button
      const dmBtn = document.createElement('button');
      dmBtn.textContent = 'DM';
      dmBtn.style.background = '#2ecc71';
      dmBtn.style.color = '#fff';
      dmBtn.style.border = 'none';
      dmBtn.style.padding = '.3rem .5rem';
      dmBtn.style.borderRadius = '4px';
      dmBtn.style.cursor = 'pointer';
      dmBtn.addEventListener('click', () => {
        const msg = prompt(`Skicka direktmeddelande till ${u.email || u.uid}:\n\nMeddelande:`);
        if (msg && msg.trim()) {
          sendDirectMessage(u.uid, u.email, msg.trim());
        }
      });
      right.appendChild(dmBtn);

      li.appendChild(right);
      adminUsersList.appendChild(li);
    });
  }

  // listen registered users collection (attach only when admins known and current user is admin)
  let usersUnsub = null;
  function attachUsersListener() {
    if (usersUnsub) return;
    // wait until admin snapshot has arrived
    if (!adminReady) {
      console.debug('attachUsersListener: waiting for admins snapshot...');
      setTimeout(attachUsersListener, 200);
      return;
    }
    const u = auth.currentUser || currentUser;
    if (!u) {
      console.debug('attachUsersListener: no signed-in user yet');
      return;
    }
    if (!isUidAdmin(u.uid, u.email)) {
      console.debug('attachUsersListener: current user is not admin; skipping users listener');
      return;
    }
    try {
      usersUnsub = db.collection('users').onSnapshot(snapshot => {
        registeredUsers.length = 0;
        snapshot.forEach(doc => {
          const d = doc.data() || {};
          registeredUsers.push({ uid: d.uid || doc.id, email: d.email || (d.uid && `${d.uid}@`), name: d.displayName || d.name || d.email || d.uid });
        });
        // sort by name/email
        registeredUsers.sort((a,b) => (a.name||'').localeCompare(b.name||'') || (a.email||'').localeCompare(b.email||''));
        renderAdminUsersList();
      }, err => {
        console.warn('Could not listen to users collection (maybe missing or rules block):', err);
        registeredUsers.length = 0;
        renderAdminUsersList();
      });
    } catch (e) {
      console.warn('Users listener setup failed', e);
    }
  }

  // try to attach initially if already signed in
  if (auth.currentUser) attachUsersListener();

  // ensure we try again after auth state changes (login)
  const origAuthHandler = auth.onAuthStateChanged;
  auth.onAuthStateChanged = function(fn) {
    const wrapped = (...args) => {
      fn(...args);
      // after auth state change, try to attach users listener (if not already attached)
      if (args[0] && !usersUnsub) {
        attachUsersListener();
      }
    };
    return origAuthHandler.call(this, wrapped);
  };

  function showAdminMsg(msg, timeout = 3000) {
    if (!adminMsgEl) return;
    adminMsgEl.textContent = msg;
    adminMsgEl.style.display = 'block';
    clearTimeout(adminMsgEl._t);
    adminMsgEl._t = setTimeout(() => adminMsgEl.style.display = 'none', timeout);
  }

  // send direct message: create chat doc with explicit toUid/toEmail (and legacy to for compatibility)
  async function sendDirectMessage(targetUid, targetEmail, text) {
    const user = auth.currentUser || currentUser;
    const senderUid = user && user.uid ? user.uid : null;
    const senderName = nameInput.value && nameInput.value.trim() ? nameInput.value.trim() : (user && (user.email || user.uid) ) || 'Admin';
    const payload = {
      name: senderName,
      text: replaceProfanity(text),
      uid: senderUid,
      ts: firebase.firestore.FieldValue.serverTimestamp(),
      dm: true,
      toUid: targetUid ? String(targetUid) : null,
      toEmail: targetEmail ? String(targetEmail).toLowerCase() : null,
      // keep legacy "to" for backward compatibility (string)
      to: (targetUid ? String(targetUid) : (targetEmail ? String(targetEmail).toLowerCase() : ''))
    };
    try {
      await db.collection('chats').add(payload);
      showAdminMsg('Direktmeddelande skickat.');
    } catch (err) {
      console.error('sendDirectMessage failed', err);
      showAdminMsg('Kunde inte skicka DM: ' + (err.message || err.code), 4000);
    }
  }

  // Auth flows
  async function emailSignIn() {
    const email = (emailInput.value || '').trim();
    const pass = (passInput.value || '');
    if (!email || !pass) { showTemp('Fyll i e‑post och lösenord.'); return; }
    try { await auth.signInWithEmailAndPassword(email, pass); showTemp('Inloggad.'); emailInput.value = ''; passInput.value = ''; }
    catch (err) {
      console.error('emailSignIn error', err);
      if (err.code === 'auth/user-not-found') {
        if (confirm('Konto finns ej. Skapa konto med dessa uppgifter?')) return emailCreate();
        return;
      }
      if (err.code === 'auth/wrong-password') showTemp('Fel lösenord.');
      else if (err.code === 'auth/invalid-email') showTemp('Ogiltig e‑postadress.');
      else showTemp('Inloggning misslyckades.');
    }
  }
  async function emailCreate() {
    const email = (emailInput.value || '').trim();
    const pass = (passInput.value || '');
    if (!email || !pass) { showTemp('Fyll i e‑post och lösenord.'); return; }
    if (pass.length < 6) { showTemp('Lösenord måste vara minst 6 tecken.'); return; }
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      showTemp('Konto skapat.');
      try { if (cred.user && cred.user.sendEmailVerification) await cred.user.sendEmailVerification(); } catch(e){}
      // create a users doc for this account
      try {
        if (cred.user && cred.user.uid) {
          const udoc = {
            uid: cred.user.uid,
            email: (email || '').toLowerCase(),
            displayName: cred.user.displayName || ''
          };
          await db.collection('users').doc(cred.user.uid).set(udoc, { merge: true });
        }
      } catch (uderr) {
        console.warn('users.set failed', uderr);
      }
      emailInput.value = ''; passInput.value = '';
    } catch (err) {
      console.error('create account failed', err);
      if (err.code === 'auth/email-already-in-use') showTemp('E‑post används redan.');
      else if (err.code === 'auth/invalid-email') showTemp('Ogiltig e‑postadress.');
      else if (err.code === 'auth/weak-password') showTemp('Lösenord för svagt (min 6 tecken).');
      else showTemp('Kunde ej skapa konto.');
    }
  }
  async function signOut() { try { await auth.signOut(); showTemp('Utloggad.'); } catch (e) { console.error('signOut failed', e); showTemp('Utloggning misslyckades.'); } }
  async function signInAnon() { try { await auth.signInAnonymously(); showTemp('Anonym inloggning lyckades.'); } catch (e) { console.warn('Anonymous sign-in failed', e); showTemp('Anonym inlogg misslyckades.'); } }

  signInBtn.addEventListener('click', emailSignIn);
  createBtn.addEventListener('click', emailCreate);
  anonBtn.addEventListener('click', signInAnon);
  signOutBtn.addEventListener('click', async (e) => { e.preventDefault(); await signOut(); });

  let currentUser = null;
  auth.onAuthStateChanged(user => {
    currentUser = user;
    // on sign-in: refresh token and force a fresh admins fetch so UI updates immediately
    (async function onAuthChange() {
      if (currentUser) {
        try {
          if (auth.currentUser && auth.currentUser.getIdToken) await auth.currentUser.getIdToken(true);
        } catch (e) { console.warn('token refresh on auth change failed', e); }
        // force a fresh admins fetch to ensure admin sets are up-to-date for this session
        try {
          const snap = await db.collection('admins').get();
          adminEmails.clear(); adminUids.clear();
          snap.forEach(doc => {
            const id = String(doc.id || '').trim();
            const lid = id.toLowerCase();
            if (lid.includes('@')) adminEmails.add(lid);
            else adminUids.add(id);
            const data = doc.data() || {};
            if (data.uid) adminUids.add(String(data.uid).trim());
            if (data.email) adminEmails.add(String(data.email).toLowerCase().trim());
          });
          adminReady = true;

          // ensure UI reflects admin status immediately after sign-in
          refreshAdminPanelVisibility();
          updateAdminStyles();
          renderAdminUsersList();
          // ensure users listener attaches for newly detected admin
          try { attachUsersListener(); } catch(e) { /* noop */ }
        } catch (e) {
          console.warn('Failed to refresh admins on auth change', e);
        }
        // now attach users listener (if admin)
        attachUsersListener();
      }
    })();
    const userEmail = user && user.email ? user.email.toLowerCase() : null;
    if (user) {
      statusEl.textContent = user.isAnonymous ? 'Inloggad anonymt' : `Inloggad: ${user.email || user.displayName || user.uid}`;
      signOutBtn.style.display = 'inline-block';
      signInBtn.style.display = 'none';
      createBtn.style.display = 'none';
      anonBtn.style.display = 'none';
      emailInput.style.display = 'none';
      passInput.style.display = 'none';
      if (user.isAnonymous) {
        const stored = loadName();
        if (stored && !nameInput.value) nameInput.value = stored;
        nameInput.readOnly = false;
      } else {
        if (user.displayName) nameInput.value = user.displayName;
        nameInput.readOnly = !!user.displayName;
      }
      sendBtn.disabled = false;

      // ensure a users doc exists/updated for non-anonymous accounts
      if (user && !user.isAnonymous && db) {
        const udoc = {
          uid: user.uid,
          email: (user.email || '').toLowerCase(),
          displayName: user.displayName || ''
        };
        db.collection('users').doc(user.uid).set(udoc, { merge: true }).catch(e => console.warn('users.set failed', e));
      }

    } else {
      statusEl.textContent = 'Inte inloggad';
      signOutBtn.style.display = 'none';
      signInBtn.style.display = 'inline-block';
      createBtn.style.display = 'inline-block';
      anonBtn.style.display = 'inline-block';
      emailInput.style.display = 'inline-block';
      passInput.style.display = 'inline-block';
      sendBtn.disabled = true;
    }
    refreshAdminPanelVisibility();
    updateAdminStyles();
  });

  // Message listener: show public messages, DMs for recipient/sender, or all for admins
  try {
    // build snapshot and render pinned-first optionally
    db.collection('chats').orderBy('ts', 'asc').limitToLast(400)
      .onSnapshot(snapshot => {
        messagesEl.innerHTML = '';
        const currentUid = currentUser && currentUser.uid ? String(currentUser.uid) : null;
        const currentEmail = currentUser && currentUser.email ? String(currentUser.email).toLowerCase() : null;
        const isAdminNow = isUidAdmin(currentUid, currentEmail);

        const pinned = [], normal = [];
        snapshot.forEach(doc => {
          const data = doc.data() || {};
          // decide visibility:
          const toUid = data.toUid ? String(data.toUid) : null;
          const toEmail = data.toEmail ? String(data.toEmail).toLowerCase() : (data.to && String(data.to).includes('@') ? String(data.to).toLowerCase() : null);
          const legacyTo = data.to ? String(data.to).toLowerCase() : null;
          const isDm = !!data.dm;
          const senderUid = data.uid || null;
          let show = false;
          if (!isDm && !toUid && !toEmail && !legacyTo) show = true;
          else if (isAdminNow) show = true;
          else if (currentUid && senderUid && currentUid === senderUid) show = true;
          else if (currentUid && toUid && currentUid === String(toUid)) show = true;
          else if (currentEmail && toEmail && currentEmail === String(toEmail)) show = true;
          else if (currentUid && legacyTo && legacyTo === currentUid) show = true;
          else if (currentEmail && legacyTo && legacyTo === currentEmail) show = true;

          if (!show) return;
          if (data && data.pinned) pinned.push({ id: doc.id, data });
          else normal.push({ id: doc.id, data });
        });
        const combined = (window._chat_showPinnedFirst !== false) ? pinned.concat(normal) : normal.concat(pinned);
        combined.forEach(item => messagesEl.appendChild(renderMessage(item.id, item.data)));
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }, err => {
        console.error('Firestore snapshot error', err);
        showTemp('Kunde inte läsa meddelanden.');
        statusEl.textContent = 'Fel vid läsning från server.';
      });
  } catch (e) {
    console.error('Failed to attach snapshot listener', e);
    showTemp('Konfigurationsfel för chatten.');
    statusEl.textContent = 'Konfigurationsfel (se konsol).';
  }

  function renderMessage(id, data) {
    // mark pinned state on element so exports / UI can read it later
    const pinnedFlag = !!(data && data.pinned);
     const ts = (data.ts && data.ts.toDate) ? data.ts.toDate() : null;
     const when = ts ? `${ts.toLocaleDateString()} ${ts.toLocaleTimeString()}` : '';
     const uid = data.uid || '';
     const el = document.createElement('div');
     el.dataset.id = id;
     el.dataset.uid = uid;
     el.dataset.pinned = pinnedFlag ? 'true' : 'false';
     el.style.padding = '.2em .4em';
     el.style.borderBottom = '1px solid #eee';
     el.style.display = 'flex';
     el.style.justifyContent = 'space-between';
     el.style.alignItems = 'flex-start';
 
     const left = document.createElement('div');
     left.style.flex = '1';
     const nameStrong = document.createElement('strong');
     nameStrong.className = 'msg-name';
     nameStrong.textContent = data.name || 'Anonym';
     const nameAsEmail = (data.name && data.name.includes('@')) ? data.name.toLowerCase() : null;
     if (isUidAdmin(uid, nameAsEmail)) {
       nameStrong.style.color = '#2ecc71';
       const b = document.createElement('span');
       b.className = 'admin-badge';
       b.textContent = ' admin';
       b.style.marginLeft = '.4rem';
       b.style.padding = '.05rem .3rem';
       b.style.borderRadius = '3px';
       b.style.background = '#2ecc71';
       b.style.color = '#fff';
       b.style.fontSize = '0.8rem';
       nameStrong.appendChild(b);
     }
     left.appendChild(nameStrong);
 
     const whenEl = document.createElement('small');
     whenEl.style.color = '#666';
     whenEl.style.marginLeft = '.6rem';
     whenEl.textContent = ` ${when}`;
     left.appendChild(whenEl);
 
     const textDiv = document.createElement('div');
     textDiv.className = 'msg-text';
     textDiv.innerHTML = escapeHtml(data.text || '') + (data.dm ? '<em style="color:#666;font-size:.85rem;margin-left:.6rem"> (DM)</em>' : '');
     left.appendChild(textDiv);
 
     // show edited label if present
     if (data.edited) {
       const editedAt = (data.editedAt && data.editedAt.toDate) ? data.editedAt.toDate() : null;
       const edLabel = document.createElement('div');
       edLabel.style.color = '#888';
       edLabel.style.fontSize = '.8rem';
       edLabel.style.marginTop = '.2rem';
       edLabel.textContent = 'redigerad' + (editedAt ? ` ${editedAt.toLocaleDateString()} ${editedAt.toLocaleTimeString()}` : '');
       left.appendChild(edLabel);
     }
 
     el.appendChild(left);
 
     const controls = document.createElement('div');
     controls.style.marginLeft = '.6rem';
     controls.style.display = 'flex';
     controls.style.alignItems = 'center';
     controls.style.gap = '.4rem';
 
     const currentUid = (auth.currentUser && auth.currentUser.uid) || null;
     const currentEmail = (auth.currentUser && auth.currentUser.email) ? String(auth.currentUser.email).toLowerCase() : null;
     const canDelete = currentUid && (currentUid === uid || isUidAdmin(currentUid, currentEmail));
 
    // Pin button (admins only)
    const canPin = currentUid && isUidAdmin(currentUid, currentEmail);
    const pinBtn = document.createElement('button');
    pinBtn.className = 'msg-pin';
    pinBtn.textContent = pinnedFlag ? 'Avpinna' : 'Pinna';
    pinBtn.title = pinnedFlag ? 'Ta bort pin' : 'Pinna meddelande';
    pinBtn.style.display = canPin ? '' : 'none';
    pinBtn.style.background = 'transparent';
    pinBtn.style.border = '1px solid #f0ad4e';
    pinBtn.style.color = '#a66a00';
    pinBtn.style.padding = '.2rem .4rem';
    pinBtn.style.borderRadius = '4px';
    pinBtn.style.cursor = 'pointer';
    pinBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      togglePinMessage(id, pinnedFlag);
    });
    controls.appendChild(pinBtn);

    // Edit button (admins or owner)
    const canEdit = currentUid && (currentUid === uid || isUidAdmin(currentUid, currentEmail));
    const editBtn = document.createElement('button');
    editBtn.className = 'msg-edit';
    editBtn.textContent = 'Redigera';
    editBtn.title = 'Redigera meddelande';
    editBtn.style.background = 'transparent';
    editBtn.style.border = '1px solid #2a7ae2';
    editBtn.style.color = '#2a7ae2';
    editBtn.style.padding = '.2rem .4rem';
    editBtn.style.borderRadius = '4px';
    editBtn.style.cursor = 'pointer';
    editBtn.style.display = canEdit ? '' : 'none';
    editBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      openEditInline(id, el, data);
    });
    controls.appendChild(editBtn);
     
    const del = document.createElement('button');
    del.className = 'msg-delete';
    del.textContent = 'Ta bort';
    del.title = 'Ta bort meddelande';
    del.style.background = 'transparent';
    del.style.border = '1px solid #e33';
    del.style.color = '#e33';
    del.style.padding = '.2rem .4rem';
    del.style.borderRadius = '4px';
    del.style.cursor = 'pointer';
    del.style.display = canDelete ? '' : 'none';
    del.addEventListener('click', (ev) => {
      ev.stopPropagation();
      deleteMessage(id, el);
    });
    controls.appendChild(del);

    el.appendChild(controls);

    return el;
   }

  // helper: attempt an async operation, on permission errors refresh token once and retry
  async function attemptWithRefresh(op) {
    try {
      return await op();
    } catch (err) {
      const msg = String((err && (err.code || err.message)) || '').toLowerCase();
      const isPerm = msg.includes('permission') || msg.includes('permission-denied') || msg.includes('insufficient');
      if (!isPerm) throw err;
      console.debug('Attempt failed with permission error — refreshing token and retrying...', err);
      try {
        if (auth.currentUser && auth.currentUser.getIdToken) {
          await auth.currentUser.getIdToken(true);
        }
      } catch (tErr) {
        console.warn('Token refresh failed', tErr);
      }
      // retry once
      return await op();
    }
  }

  // UI confirm modal (non-blocking) -> Promise<boolean>
  function showConfirm(title, message, opts = {}) {
    return new Promise(resolve => {
      try {
        const bd = document.createElement('div'); bd.className = 'modal-backdrop';
        const m = document.createElement('div'); m.className = 'modal';
        m.innerHTML = `<h3>${escapeHtml(title||'Bekräfta')}</h3><p>${escapeHtml(message||'')}</p>
          <div class="row">
            <button class="btn-secondary btn-cancel">Avbryt</button>
            <button class="btn-primary btn-ok">${escapeHtml(opts.okText || 'Ja')}</button>
          </div>`;
        bd.appendChild(m);
        document.body.appendChild(bd);
        const cleanup = (r) => { try { bd.remove(); } catch(e){} resolve(r); };
        m.querySelector('.btn-cancel').addEventListener('click', ()=> cleanup(false));
        m.querySelector('.btn-ok').addEventListener('click', ()=> cleanup(true));
        const onKey = (ev) => { if (ev.key === 'Escape') { cleanup(false); window.removeEventListener('keydown', onKey); } };
        window.addEventListener('keydown', onKey);
      } catch (e) { console.error('showConfirm failed', e); resolve(false); }
    });
  }

  async function deleteMessage(docId, domEl) {
    const ok = await showConfirm('Ta bort meddelande', 'Är du säker på att du vill ta bort detta meddelande? Det går inte att återställa.');
    if (!ok) return;
    try {
      await attemptWithRefresh(() => db.collection('chats').doc(docId).delete());
      if (domEl && domEl.parentNode) domEl.parentNode.removeChild(domEl);
      showTemp('Meddelandet togs bort.');
    } catch (err) {
      console.error('delete failed after retry', err);
      if (err && (err.code === 'permission-denied' || String(err).toLowerCase().includes('permission'))) showTemp('Du har inte behörighet att ta bort detta meddelande.');
      else showTemp('Kunde inte ta bort meddelandet.');
    }
  }
  
  // Inline edit: replace message text with an input + Save/Cancel
  function openEditInline(docId, domEl, data) {
    const textDiv = domEl.querySelector('.msg-text');
    if (!textDiv) return;
    const oldText = data.text || '';
    // hide existing text
    textDiv.style.display = 'none';
 
    const editWrap = document.createElement('div');
    editWrap.className = 'edit-wrap';
    editWrap.style.marginTop = '.3rem';
    const textarea = document.createElement('textarea');
    textarea.value = oldText;
    textarea.maxLength = MAX_MESSAGE_LENGTH;
    textarea.style.width = '100%';
    textarea.style.minHeight = '120px';
    textarea.setAttribute('aria-label', 'Redigera meddelande');
    editWrap.appendChild(textarea);
    const actions = document.createElement('div');
    actions.className = 'edit-actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-cancel';
    cancelBtn.textContent = 'Avbryt';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-save';
    saveBtn.textContent = 'Spara';
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    editWrap.appendChild(actions);
    textDiv.parentNode.insertBefore(editWrap, textDiv.nextSibling);
 
    cancelBtn.addEventListener('click', () => { editWrap.remove(); textDiv.style.display = ''; });
    textarea.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { ev.preventDefault(); cancelBtn.click(); }
      if ((ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey))) { ev.preventDefault(); saveBtn.click(); }
    });
    saveBtn.addEventListener('click', async () => {
      const newText = (textarea.value || '').trim();
       if (!newText) { showTemp('Meddelandet får inte vara tomt.'); return; }
       if (newText.length > MAX_MESSAGE_LENGTH) { showTemp(`Meddelande för långt (max ${MAX_MESSAGE_LENGTH} tecken).`); return; }
       try {
        // update message (no edit-history stored)
        await attemptWithRefresh(() => db.collection('chats').doc(docId).update({
          text: replaceProfanity(newText),
          edited: true,
          editedAt: firebase.firestore.FieldValue.serverTimestamp()
        }));
         editWrap.remove();
         // optimistic UI: update shown text and reveal
         textDiv.innerHTML = escapeHtml(newText) + (data.dm ? '<em style="color:#666;font-size:.85rem;margin-left:.6rem"> (DM)</em>' : '');
         textDiv.style.display = '';
         showTemp('Meddelandet uppdaterat.');
       } catch (err) {
         console.debug('edit failed after retry', err);
         console.error('edit failed', err);
         if (err && (err.code === 'permission-denied' || String(err).toLowerCase().includes('permission'))) showTemp('Du har inte behörighet att redigera detta meddelande.');
         else showTemp('Kunde inte uppdatera meddelandet.');
       }
      });
   }

  // typing indicator (local only)
  let typingTimer = null;
  textInput.addEventListener('input', () => {
    typingEl.textContent = (textInput.value && textInput.value.length > 0) ? `${(nameInput.value||'Du')} skriver...` : '';
    clearTimeout(typingTimer);
    if (textInput.value && textInput.value.length > 0) {
      typingTimer = setTimeout(()=> { typingEl.textContent = ''; }, 1400);
    }
  });

  // animate send button during send
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    sendBtn.classList.add('sending');
    setTimeout(()=> sendBtn.classList.remove('sending'), 700);
    if (sendBtn.disabled) { showTemp('Skickning inaktiverad tills autentisering fungerar.'); return; }
    if (!canPostNow()) {
      const wait = Math.ceil((MIN_POST_INTERVAL_MS - (Date.now() - Number(localStorage.getItem(LAST_POST_KEY) || 0))) / 1000);
      showTemp(`Vänta ${wait} sekunder innan du postar igen.`);
      return;
    }
    let rawName = (nameInput.value || '').trim() || 'Anonym';
    let rawText = (textInput.value || '').trim();
    if (!rawText) { showTemp('Fyll i meddelande.'); return; }
    if (rawText.length > MAX_MESSAGE_LENGTH) { showTemp(`Meddelande för långt (max ${MAX_MESSAGE_LENGTH} tecken).`); return; }
    rawName = replaceProfanity(rawName);
    rawText = replaceProfanity(rawText);
    const user = currentUser || auth.currentUser;
    if (!user) { showTemp('Du måste vara inloggad för att posta.'); return; }
    const uid = user.uid || null;
    const payload = { name: rawName, text: rawText, uid: uid, ts: firebase.firestore.FieldValue.serverTimestamp() };
    try {
      await db.collection('chats').add(payload);
      rememberPostTs();
      saveName(rawName);
      try { document.cookie = `authname=${encodeURIComponent(rawName)}; path=/; max-age=${7*24*60*60}`; } catch (e) {}
      textInput.value = '';
      textInput.focus();
    } catch (err) {
      console.error('Failed to post message', err);
      if (err && err.code === 'permission-denied') {
        showTemp('Server nekar posten. Aktivera korrekt autentisering i och uppdatera regler.');
        statusEl.textContent = 'Server nekar skrivning (permission-denied).';
      } else {
        showTemp('Meddelandet kunde inte postas. Försök igen.');
        statusEl.textContent = 'Fel vid postning (se konsol).';
      }
    }
  });

  // Toggle pinned state (admin or owner)
  async function togglePinMessage(docId, currentPinned) {
    try {
      await attemptWithRefresh(() => db.collection('chats').doc(docId).update({
        pinned: !currentPinned
      }));
      showTemp(!currentPinned ? 'Meddelandet pinnat.' : 'Pinnen borttagen.');
    } catch (err) {
      console.error('togglePinMessage failed', err);
      showTemp('Kunde inte uppdatera pin-status.');
    }
  }

  // Export currently visible messages to CSV (downloads a file)
  function exportVisibleMessagesCSV() {
    const rows = [['id','ts','name','uid','text','pinned','edited']]; // header
    Array.from(messagesEl.children).forEach(node => {
      const id = node.dataset.id || '';
      const uid = node.dataset.uid || '';
      const name = (node.querySelector('.msg-name') && node.querySelector('.msg-name').textContent.trim()) || '';
      const tsNode = node.querySelector('small');
      const ts = tsNode ? tsNode.textContent.trim() : '';
      const text = (node.querySelector('.msg-text') && node.querySelector('.msg-text').textContent.trim()) || '';
      const pinned = node.dataset.pinned === 'true' || false;
      const edited = !!node.querySelector('div') && node.querySelector('div').textContent.includes('redigerad');
      rows.push([id, ts, name, uid, text.replace(/\r?\n/g,' '), pinned, edited]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `chats-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  window.chatSignOut = signOut;

  // edit-history feature removed

})();