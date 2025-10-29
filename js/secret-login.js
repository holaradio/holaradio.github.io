
(function () {
  'use strict';

  // helper: safe decode config values
  function safeDecode(obf) {
    try {
      return window.xorDecodeFromBase64(String(obf || ''), Number(window.SECRET_CONFIG && window.SECRET_CONFIG.obfKey || 0));
    } catch (e) {
      console.error('secret-login: decode failed', e);
      return null;
    }
  }

  // on success:
  function createAuthCookie(token, days=1) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `auth=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }

  // main handler: delegated click on login button
  document.addEventListener('click', async function (ev) {
    const target = ev.target;
    if (!target || target.id !== 'secret-login') return;

    ev.preventDefault();

    const msg = document.getElementById('secret-message');
    const userField = document.getElementById('secret-username');
    const passField = document.getElementById('secret-password');
    if (!userField || !passField || !msg) return;

    msg.textContent = '';
    const user = (userField.value || '').trim();
    const pass = passField.value || '';

    if (!user || !pass) {
      msg.textContent = 'Fyll i användarnamn och lösenord.';
      return;
    }

    // If SECRET_CONFIG.users exists, try hashed check
    if (window.SECRET_CONFIG && Array.isArray(window.SECRET_CONFIG.users) && typeof window.sha256Hex === 'function') {
      try {
        const userHash = await window.sha256Hex(user.toLowerCase());
        const passHash = await window.sha256Hex(pass);

        for (const entry of window.SECRET_CONFIG.users) {
          const storedUserHash = safeDecode(entry.usernameHashObf);
          const storedPassHash = safeDecode(entry.passwordHashObf);
          if (!storedUserHash || !storedPassHash) continue;
          if (userHash === storedUserHash && passHash === storedPassHash) {
            // success
            // Example: set a random token (or hashed value)
            const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
            createAuthCookie(token, 1);
            window.location.href = entry.redirect || 'http://google.se';
            return;
          }
        }

        // no match
        msg.textContent = 'Felaktigt användarnamn eller lösenord.';
        passField.value = '';
        await new Promise(r => setTimeout(r, 700));
        return;
      } catch (err) {
        console.error('secret-login: hashing/check failed', err);
        msg.textContent = 'Inloggningsfel.';
        return;
      }
    }
  }, false);
})();