/*
  gallery.js
  - Attempts to load /images/gallery/index.json (array of filenames or objects { src, thumb?, alt? })
  - Fallback: try a small default pattern (adjust in code)
  - Renders responsive grid and lightbox with metadata + download
*/
(async function () {
  'use strict';

  const container = document.getElementById('gallery');
  const overlay = document.getElementById('gallery-overlay');
  const lbMedia = document.getElementById('lightbox-media');
  const metaName = document.getElementById('meta-name');
  const metaType = document.getElementById('meta-type');
  const metaRes = document.getElementById('meta-res');
  const metaSize = document.getElementById('meta-size');
  const metaDownload = document.getElementById('meta-download');
  const metaClose = document.getElementById('meta-close');

  if (!container || !overlay) return;

  // Try to load an index.json from the gallery folder.
  // index.json should be an array of either "file.jpg" or objects:
  // { "src":"file.jpg", "thumb":"file-thumb.jpg", "alt":"Beskrivning" }
  async function loadIndex() {
    try {
      const res = await fetch('/images/index.json', {cache:'no-cache'});
      if (!res.ok) throw new Error('no index');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('bad index.json');
      return data;
    } catch (e) {
      // fallback small list (edit to match your filenames) — harmless if not present
      return [
        // example entries; replace or create index.json for real listing
        'bild1.jpg',
        'bild2.jpg',
        'bild3.jpg'
      ];
    }
  }

  const list = await loadIndex();

  // normalize item -> { src, thumb, alt }
  const items = list.map(it => {
    if (typeof it === 'string') return { src: `/images/${it}`, thumb: `/images/${it}`, alt: it };
    if (it && it.src) {
      return { src: `/images/${it.src}`, thumb: it.thumb ? `/images/${it.thumb}` : `/images/${it.src}`, alt: it.alt || it.src };
    }
    return null;
  }).filter(Boolean);

  // helper to create an element for each item
  function createThumb(item, idx) {
    const el = document.createElement('div');
    el.className = 'gallery-item';
    el.tabIndex = 0;
    el.dataset.index = idx;
    const img = document.createElement('img');
    img.src = item.thumb;
    img.alt = item.alt || '';
    img.loading = 'lazy';
    el.appendChild(img);
    // keyboard/enter support
    el.addEventListener('click', () => openLightbox(idx));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(idx); } });
    return el;
  }

  // populate grid
  items.forEach((it, i) => container.appendChild(createThumb(it, i)));

  // open lightbox
  let currentIndex = 0;
  function clearLightbox() { lbMedia.innerHTML = ''; metaName.textContent = ''; metaType.textContent = ''; metaRes.textContent = ''; metaSize.textContent = ''; metaDownload.href = '#'; }
  function openLightbox(idx) {
    currentIndex = idx;
    const it = items[idx];
    if (!it) return;
    clearLightbox();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');

    const bigImg = document.createElement('img');
    bigImg.alt = it.alt || '';
    bigImg.src = it.src;
    bigImg.style.maxWidth = '100%';
    bigImg.style.maxHeight = '100%';
    lbMedia.appendChild(bigImg);

    metaName.textContent = it.alt || it.src.split('/').pop();
    metaType.textContent = 'Typ: ' + guessMime(it.src);
    metaDownload.href = it.src;
    metaDownload.setAttribute('download', metaName.textContent);

    // get resolution and file size (size via HEAD if supported)
    bigImg.addEventListener('load', async () => {
      metaRes.textContent = `Upplösning: ${bigImg.naturalWidth} × ${bigImg.naturalHeight}`;
      try {
        const head = await fetch(it.src, { method: 'HEAD' });
        const len = head.headers.get('content-length');
        if (len) metaSize.textContent = 'Storlek: ' + niceBytes(Number(len));
      } catch (e) {
        // ignore
      }
    });
  }

  function guessMime(url) {
    const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
    switch (ext) {
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'webp': return 'image/webp';
      case 'gif': return 'image/gif';
      case 'svg': return 'image/svg+xml';
      default: return ext || '—';
    }
  }
  function niceBytes(n) {
    if (!n || n === 0) return '—';
    const units = ['B','KB','MB','GB'];
    let u = 0;
    while (n >= 1024 && u < units.length-1) { n /= 1024; u++; }
    return `${n.toFixed(n < 10 && u > 0 ? 1 : 0)} ${units[u]}`;
  }

  // close handlers + keyboard navigation
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.id === 'meta-close') { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); clearLightbox(); }
  });
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); clearLightbox(); }
    if (e.key === 'ArrowRight') { navigate(1); }
    if (e.key === 'ArrowLeft') { navigate(-1); }
  });

  function navigate(delta) {
    let next = currentIndex + delta;
    if (next < 0) next = items.length - 1;
    if (next >= items.length) next = 0;
    openLightbox(next);
  }

  // expose for debugging
  window.galleryItems = items;

})();