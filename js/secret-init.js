(async function(){
  const waitFor = async (check, timeout = 5000, interval = 50) => {
    const start = Date.now();
    while (!check()) {
      if (Date.now() - start > timeout) return false;
      await new Promise(r => setTimeout(r, interval));
    }
    return true;
  };

  const ok = await waitFor(() =>
    typeof window.sha256Hex === 'function' &&
    typeof window.xorDecodeFromBase64 === 'function' &&
    typeof window.SECRET_CONFIG !== 'undefined'
  , 5000);

  if (!ok) {
    console.warn('secret-init: helpers or SECRET_CONFIG not available.');
    return;
  }

  const nameInput = document.getElementById('contact-name');
  if (!nameInput) return;

  let expectedHash;
  try {
    // defensive: protect against invalid base64 / wrong obfKey
    expectedHash = window.xorDecodeFromBase64(String(window.SECRET_CONFIG.triggerHashObf || ''), Number(window.SECRET_CONFIG.obfKey));
  } catch (err) {
    console.error('secret-init: failed to decode triggerHashObf — check js/secret-config.js. Error:', err);
    console.log('secret-init: current triggerHashObf value:', window.SECRET_CONFIG && window.SECRET_CONFIG.triggerHashObf);
    return;
  }

  nameInput.addEventListener('input', async (e) => {
    const v = (e.target.value||'').trim();
    if (!v) return;
    try {
      const hv = await window.sha256Hex(v);
      if (hv === expectedHash) {
        window.dispatchEvent(new CustomEvent('secret:trigger'));
      }
    } catch (err) {
      console.error('secret-init: sha256 failed', err);
    }
  });
})();