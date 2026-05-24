document.addEventListener('DOMContentLoaded', function () {
  const STORAGE_KEY = 'kommunen_answered_v1';
  const form = document.getElementById('kommunen-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusEl = document.getElementById('status');

  if (!form || !submitBtn || !statusEl) return;

  function showThanks() {
    statusEl.style.color = '';
    statusEl.textContent = 'Tack för att du svarade på tillfrågelsen! Resultat kommer att presenteras i ett lämpligt sammanhang, vid en lämplig tidpunkt.';
  }

  function disableFormControls() {
    Array.from(form.querySelectorAll('input')).forEach(i => i.disabled = true);
    submitBtn.disabled = true;
  }

  // If user already answered, show message and disable
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      disableFormControls();
      showThanks();
    }
  } catch (e) {
    // ignore localStorage errors
  }

  submitBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (submitBtn.disabled) return;

    const selected = form.querySelector('input[name="svar"]:checked');
    if (!selected) {
      statusEl.style.color = 'red';
      statusEl.textContent = 'Vänligen välj ett alternativ innan du skickar.';
      return;
    }

    // Persist answer so user can only answer once
    try {
      const payload = { value: selected.value, time: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      // If storage fails, continue but still disable controls to avoid multiple answers in this session
    }

    disableFormControls();
    showThanks();
  });
});
