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
          <div style="margin-bottom:.6rem">
            <strong>Registrerade användare</strong>
            <div id="admin-users-wrapper" style="max-height:220px;overflow:auto;margin-top:.4rem;border:1px solid #eee;padding:.4rem;border-radius:4px;background:#fafafa;">
              <ul id="admin-users-list" style="margin:0;padding:0;list-style:none;"></ul>
            </div>
          </div>
          <div id="admin-msg" style="color:#2ecc71;margin-top:.5rem;font-size:.9rem;display:none"></div>
        </div>
      </details>
    `;
    chatRoot.insertBefore(adminPanel, statusEl.nextSibling);
  }

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

  function isUidAdmin(uid, email) {
    if (!uid && !email) return false;
    if (uid && adminUids.has(uid)) return true;
    if (email && adminEmails.has(email.toLowerCase())) return true;
    return false;
  }

  function refreshAdminPanelVisibility() {
    const user = auth.currentUser || currentUser;
    const userEmail = user && user.email ? String(user.email).toLowerCase() : null;
    const userUid = user && user.uid ? String(user.uid) : null;
    const isCurrentAdmin = isUidAdmin(userUid, userEmail);
    if (adminPanel) adminPanel.style.display = isCurrentAdmin ? '' : 'none';
  }

  function updateAdminStyles() {
    Array.from(messagesEl.children).forEach(child => {
      const uid = child.dataset.uid || '';
      const nameEl = child.querySelector('.msg-name');
      const badgeEl = child.querySelector('.admin-badge');
      const msgNameText = (nameEl && nameEl.textContent) ? nameEl.textContent.trim().split(/\s+/)[0] : '';
      const messageEmailFallback = msgNameText && msgNameText.includes('@') ? msgNameText.toLowerCase() : null;
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
      const deleteBtn = child.querySelector('.msg-delete');
      if (deleteBtn) {
        const currentUid = (auth.currentUser && auth.currentUser.uid) || null;
        const currentEmail = (auth.currentUser && auth.currentUser.email) ? String(auth.currentUser.email).toLowerCase() : null;
        if (currentUid && (currentUid === uid || isUidAdmin(currentUid, currentEmail))) {
          deleteBtn.style.display = '';
        } else {
          deleteBtn.style.display = 'none';
        }
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
    console.debug('chat: adminEmails=', Array.from(adminEmails), 'adminUids=', Array.from(adminUids));
    renderAdminUsersList(); // will re-render users list visibility if needed
    updateAdminStyles();
    refreshAdminPanelVisibility();
  }, err => {
    console.warn('Failed to listen to admins collection', err);
  });

  // ----- Registered users list & admin user panel actions -----
  // This requires a Firestore collection "users" with documents keyed by uid or email and containing at least { displayName?, email?, uid? }.
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

  // listen registered users collection (if present)
  let usersUnsub = null;
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
      console.warn('Could not listen to users collection (maybe missing):', err);
      // show placeholder
      registeredUsers.length = 0;
      renderAdminUsersList();
    });
  } catch (e) {
    console.warn('Users listener setup failed', e);
  }

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
    db.collection('chats').orderBy('ts', 'asc').limitToLast(400)
      .onSnapshot(snapshot => {
        messagesEl.innerHTML = '';
        const currentUid = currentUser && currentUser.uid ? String(currentUser.uid) : null;
        const currentEmail = currentUser && currentUser.email ? String(currentUser.email).toLowerCase() : null;
        const isAdminNow = isUidAdmin(currentUid, currentEmail);
        snapshot.forEach(doc => {
          const data = doc.data() || {};
          // prefer explicit fields, fall back to legacy "to"
          const toUid = data.toUid ? String(data.toUid) : null;
          const toEmail = data.toEmail ? String(data.toEmail).toLowerCase() : (data.to && String(data.to).includes('@') ? String(data.to).toLowerCase() : null);
          const legacyTo = data.to ? String(data.to).toLowerCase() : null;

          // decide visibility:
          // - public (no to / no dm) => show
          // - admins see everything
          // - sender sees their own messages
          // - recipient sees DMs addressed to their uid or email
          const isDm = !!data.dm;
          const senderUid = data.uid || null;
          let show = false;
          if (!isDm && !toUid && !toEmail && !legacyTo) show = true;
          else if (isAdminNow) show = true;
          else if (currentUid && senderUid && currentUid === senderUid) show = true; // sender sees their own DM
          else if (currentUid && toUid && currentUid === String(toUid)) show = true;
          else if (currentEmail && toEmail && currentEmail === String(toEmail)) show = true;
          else if (currentUid && legacyTo && legacyTo === currentUid) show = true;
          else if (currentEmail && legacyTo && legacyTo === currentEmail) show = true;

          if (show) messagesEl.appendChild(renderMessage(doc.id, data));
        });
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
    const ts = (data.ts && data.ts.toDate) ? data.ts.toDate() : null;
    const when = ts ? `${ts.toLocaleDateString()} ${ts.toLocaleTimeString()}` : '';
    const uid = data.uid || '';
    const el = document.createElement('div');
    el.dataset.id = id;
    el.dataset.uid = uid;
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
    textDiv.innerHTML = escapeHtml(data.text || '') + (data.dm ? '<em style="color:#666;font-size:.85rem;margin-left:.6rem"> (DM)</em>' : '');
    left.appendChild(textDiv);

    el.appendChild(left);

    const controls = document.createElement('div');
    controls.style.marginLeft = '.6rem';
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    controls.style.gap = '.4rem';

    const currentUid = (auth.currentUser && auth.currentUser.uid) || null;
    const currentEmail = (auth.currentUser && auth.currentUser.email) ? String(auth.currentUser.email).toLowerCase() : null;
    const canDelete = currentUid && (currentUid === uid || isUidAdmin(currentUid, currentEmail));

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

  async function deleteMessage(docId, domEl) {
    if (!confirm('Är du säker på att du vill ta bort detta meddelande?')) return;
    try {
      await db.collection('chats').doc(docId).delete();
      if (domEl && domEl.parentNode) domEl.parentNode.removeChild(domEl);
      showTemp('Meddelandet togs bort.');
    } catch (err) {
      console.error('delete failed', err);
      if (err && err.code === 'permission-denied') showTemp('Du har inte behörighet att ta bort detta meddelande.');
      else showTemp('Kunde inte ta bort meddelandet.');
    }
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
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
        showTemp('Server nekar posten. Aktivera korrekt autentisering i Firebase och uppdatera regler.');
        statusEl.textContent = 'Server nekar skrivning (permission-denied).';
      } else {
        showTemp('Meddelandet kunde inte postas. Försök igen.');
        statusEl.textContent = 'Fel vid postning (se konsol).';
      }
    }
  });

  window.chatSignOut = signOut;

})();