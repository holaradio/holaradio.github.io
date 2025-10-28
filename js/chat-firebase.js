// Client-side Firebase chat with anonymous auth, client-side rate limiting,
// message sanitization & replacement-moderation, UI status and defensive error handling.

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

  // Limits / moderation policy (adjust as needed)
  const MAX_MESSAGE_LENGTH = 800;         // maximum allowed characters for a message
  const MIN_POST_INTERVAL_MS = 3000;      // minimal time between posts from same browser
  const LAST_POST_KEY = 'chat-last-post-ts';
  const NAME_STORE_KEY = 'chat-name';

  // Small profanity list (client-side); server-side moderation required for production.
  const bannedWords = [
    'fuck', 'shit', 'idiot' // extend as required
  ];

  // ----- dynamic SDK loader -----
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

  // ----- init -----
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized');
  } catch (e) {
    console.error('Firebase initialize failed', e);
    return;
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  // ensure DOM loaded
  await new Promise(res => {
    if (document.readyState !== 'loading') return res();
    document.addEventListener('DOMContentLoaded', res);
  });

  // UI refs
  const statusEl = document.getElementById('chat-status');
  const messagesEl = document.getElementById('chat-messages');
  const form = document.getElementById('chat-form');
  const nameInput = document.getElementById('chat-name');
  const textInput = document.getElementById('chat-text');
  const sendBtn = document.getElementById('chat-send');

  if (!messagesEl || !form || !nameInput || !textInput || !statusEl || !sendBtn) {
    console.error('Chat UI elements missing');
    return;
  }

  // helpers
  const regexEscape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bannedRegex = new RegExp('\\b(' + bannedWords.map(regexEscape).join('|') + ')\\b', 'gi');

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

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

  function replaceProfanity(s) {
    // Replace each banned word with bullets of equal length
    return s.replace(bannedRegex, m => '•'.repeat(m.length));
  }

  function canPostNow() {
    try {
      const last = Number(localStorage.getItem(LAST_POST_KEY) || 0);
      return (Date.now() - last) >= MIN_POST_INTERVAL_MS;
    } catch (e) {
      return true;
    }
  }

  function rememberPostTs() {
    try { localStorage.setItem(LAST_POST_KEY, String(Date.now())); } catch (e) {}
  }

  function saveName(name) {
    try { localStorage.setItem(NAME_STORE_KEY, name); } catch (e) {}
  }
  function loadName() {
    try { return localStorage.getItem(NAME_STORE_KEY) || ''; } catch (e) { return ''; }
  }

  // show stored name
  const storedName = loadName();
  if (storedName && !nameInput.value) nameInput.value = storedName;

  // ----- anonymous auth (no UI) -----
  let currentUser = null;
  let anonAuthFailed = false;

  try {
    await auth.signInAnonymously();
  } catch (e) {
    console.warn('Anonymous sign-in failed', e);
    anonAuthFailed = true;
    showTemp('Anonym inlogg misslyckades — server kan neka skrivningar.');
    statusEl.textContent = 'Ej autentiserad (anonym auth misslyckades). Kontakta admin eller aktivera anonym auth i Firebase.';
    // disable send to avoid repeated failures
    sendBtn.disabled = true;
  }

  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
      anonAuthFailed = false;
      statusEl.textContent = user.isAnonymous ? 'Inloggad anonymt' : `Inloggad: ${user.displayName || user.email || user.uid}`;
      sendBtn.disabled = false;
      // prefill name if stored
      if (user.isAnonymous) {
        const m = document.cookie.match('(^|;)\\s*' + 'authname' + '\\s*=\\s*([^;]+)');
        if (m && !nameInput.value) nameInput.value = decodeURIComponent(m[2]);
      } else {
        if (user.displayName) nameInput.value = user.displayName;
      }
    } else {
      statusEl.textContent = 'Ej inloggad';
      // do not disable, let anonymous flow attempt to re-auth if possible
    }
  });

  // ----- message rendering & listener -----
  function renderMessage(id, data) {
    const when = (data.ts && data.ts.toDate) ? data.ts.toDate().toLocaleTimeString() : '';
    const el = document.createElement('div');
    el.dataset.id = id;
    el.style.padding = '.2em .4em';
    el.style.borderBottom = '1px solid #eee';
    el.innerHTML = `<strong>${escapeHtml(data.name||'Anonym')}</strong> <small style="color:#666">${when}</small><div>${escapeHtml(data.text||'')}</div>`;
    return el;
  }

  try {
    db.collection('chats').orderBy('ts', 'asc').limitToLast(200)
      .onSnapshot(snapshot => {
        messagesEl.innerHTML = '';
        snapshot.forEach(doc => {
          messagesEl.appendChild(renderMessage(doc.id, doc.data()));
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

  // ----- submit handler -----
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    if (sendBtn.disabled) {
      showTemp('Skickning inaktiverad tills autentisering fungerar.');
      return;
    }

    if (!canPostNow()) {
      const wait = Math.ceil((MIN_POST_INTERVAL_MS - (Date.now() - Number(localStorage.getItem(LAST_POST_KEY) || 0))) / 1000);
      showTemp(`Vänta ${wait} sekunder innan du postar igen.`);
      return;
    }

    let rawName = (nameInput.value || '').trim() || 'Anonym';
    let rawText = (textInput.value || '').trim();

    if (!rawText) { showTemp('Fyll i meddelande.'); return; }
    if (rawText.length > MAX_MESSAGE_LENGTH) { showTemp(`Meddelande för långt (max ${MAX_MESSAGE_LENGTH} tecken).`); return; }

    // apply simple client-side sanitization/moderation: replace banned words
    rawName = replaceProfanity(rawName);
    rawText = replaceProfanity(rawText);

    const user = currentUser || auth.currentUser;
    const uid = user ? user.uid : null;

    const payload = {
      name: rawName,
      text: rawText,
      uid: uid,
      ts: firebase.firestore.FieldValue.serverTimestamp()
    };

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

  // expose small helper for admin/testing
  window.chatSignOut = async function () {
    try {
      await auth.signOut();
      showTemp('Utloggad.');
    } catch (e) {
      console.error('signOut failed', e);
    }
  };

})();