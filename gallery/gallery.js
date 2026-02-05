// Gallery renderer: loads gallery.json, renders grid, and shows date in a lightbox
(function(){
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImage');
  const lbClose = document.querySelector('.lightbox-close');
  const stage = document.getElementById('lightbox');

  const getLang = () => localStorage.getItem('language') || (navigator.language.startsWith('zh-HK') ? 'zh-HK' : navigator.language.startsWith('zh-TW') ? 'zh-TW' : 'en');

  // Fetch gallery data
  fetch('gallery/gallery.json')
    .then(r => r.json())
    .then(items => {
      renderGrid(items);
    })
    .catch(err => {
      console.error('Failed to load gallery.json', err);
      grid.innerHTML = '<div style="opacity:.7">Cannot load gallery.</div>';
    });

  let galleryItems = [];
  let currentIndex = -1;
  function renderGrid(items){
    galleryItems = items;
    const lang = getLang();
    grid.innerHTML = '';
    items.forEach((item, idx) => {
      const fig = document.createElement('figure');
      fig.className = 'gallery-item';
      fig.tabIndex = 0;
      fig.setAttribute('role', 'button');
      fig.setAttribute('aria-label', 'open image');

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      // JSON paths are relative to /gallery/
      const imgPath = `gallery/${item.src}`.replace(/\/*(gallery\/)*/,'gallery/');
      img.src = imgPath;
      img.alt = item.alt || '';

      const cap = document.createElement('figcaption');
      cap.className = 'gallery-caption';
      const title = item.caption?.[lang] || item.caption?.en || '';
      cap.textContent = title;

      fig.appendChild(img);
      // Add date overlay if available (append after img for proper stacking)
      if (item.date && item.date.trim()) {
        const dateElement = document.createElement('div');
        dateElement.className = 'gallery-date';
        dateElement.textContent = item.date;
        fig.appendChild(dateElement);
      }
      fig.appendChild(cap);
      grid.appendChild(fig);

      const open = () => openLightbox(idx, item, img, title, imgPath);
      fig.addEventListener('click', open);
      fig.addEventListener('keypress', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  let scale = 1, originX = 0, originY = 0, startX = 0, startY = 0, isPanning = false;
  // Track multi-touch pointers for pinch zoom
  const pointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let pinchCenter = { x: 0, y: 0 };
  let isPinching = false;
  function applyTransform(){
    lbImg.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
  }

  async function openLightbox(index, item, imgEl, title, imgPath){
    currentIndex = index;
    // Show modal
    lightbox.classList.add('open');
    lbImg.src = imgPath || imgEl.currentSrc || imgEl.src;
    lbImg.alt = title || imgEl.alt || '';
  // reset transform
  scale = 1; originX = 0; originY = 0; applyTransform();
  // reset gesture state
  pointers.clear();
  pinchStartDistance = 0; pinchStartScale = 1; pinchCenter = {x:0,y:0};

    // Update lightbox metadata if elements exist
    const metaDate = document.getElementById('lightboxMeta');
    if (metaDate) {
      const lang = getLang();
      const t = (k, fallback) => (window.translations && window.translations[lang] && window.translations[lang][k]) || fallback || k;
      const loadingText = t('exif_loading', 'Loading…');
      metaDate.innerHTML = loadingText;

      try {
        // Check if JSON has date first
        let shotDate = item.date && item.date.trim() ? item.date : null;

        // If no date in JSON, try to get from EXIF
        if (!shotDate) {
          if (window.exifr && typeof window.exifr.parse === 'function') {
            try {
              const resp = await fetch(imgPath);
              const buf = await resp.arrayBuffer();
              const exif = await window.exifr.parse(buf).catch(() => null);

              if (exif && exif.DateTimeOriginal) {
                // Format date as YYYY.MM.DD
                try {
                  const d = new Date(exif.DateTimeOriginal);
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  shotDate = `${yyyy}.${mm}.${dd}`;
                } catch {}
              }
            } catch {}
          }
        }

        if (shotDate) {
          metaDate.innerHTML = `<span><i class="fas fa-calendar"></i>${shotDate}</span>${item.camera ? `<span><i class="fas fa-camera"></i>${item.camera}</span>` : ''}`;
        } else {
          metaDate.innerHTML = t('exif_na', 'Date not available');
        }
      } catch (e) {
        console.warn('Date read failed', e);
        const lang2 = getLang();
        const t2 = (k, fallback) => (window.translations && window.translations[lang2] && window.translations[lang2][k]) || fallback || k;
        metaDate.innerHTML = t2('exif_na', 'Date not available');
      }
    }
  }

  function closeLightbox(){
    lightbox.classList.remove('open');
    // clear src to stop decoding on low devices
    lbImg.src = '';
  }

  lbClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox(); });

  // Zoom helper with optional focal point (client coords relative to stage)
  function zoom(delta, cx, cy){
    const newScale = Math.max(0.5, Math.min(5, scale + delta));
    if (newScale === scale) return;
    if (typeof cx === 'number' && typeof cy === 'number') {
      // Adjust translation so the point under the cursor stays fixed
      // origin' = c - (c - origin) * (new/old)
      originX = cx - (cx - originX) * (newScale / scale);
      originY = cy - (cy - originY) * (newScale / scale);
    } else {
      // Fallback: scale around current origin
      originX *= newScale/scale; originY *= newScale/scale;
    }
    scale = newScale; applyTransform();
  }
  // Double-click/tap to reset zoom
  stage?.addEventListener('dblclick', (e) => {
    // Toggle between fit (1) and zoomed (2x) centered at click/tap
    const rect = stage.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    if (scale > 1) { scale=1; originX=0; originY=0; applyTransform(); }
    else { zoom(1, cx, cy); }
  });

  // Pan with mouse/touch + Pinch zoom (multi-pointer)
  stage?.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      // Initialize pinch
      const pts = Array.from(pointers.values());
      pinchStartDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartScale = scale;
      const rect = stage.getBoundingClientRect();
      pinchCenter = { x: (pts[0].x + pts[1].x)/2 - rect.left, y: (pts[0].y + pts[1].y)/2 - rect.top };
      isPinching = true;
    } else if (pointers.size === 1) {
      // Start panning
      isPanning = true;
      startX = e.clientX - originX; startY = e.clientY - originY;
    }
  });
  stage?.addEventListener('pointermove', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 2) {
      // Pinch to zoom
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchStartDistance > 0) {
        let newScale = pinchStartScale * (dist / pinchStartDistance);
        newScale = Math.max(0.5, Math.min(5, newScale));
        const rect = stage.getBoundingClientRect();
        // Current center
        const cx = (pts[0].x + pts[1].x)/2 - rect.left;
        const cy = (pts[0].y + pts[1].y)/2 - rect.top;
        // Adjust translation based on change in scale around center
        originX = cx - (pinchCenter.x - originX) * (newScale / scale) - (cx - pinchCenter.x);
        originY = cy - (pinchCenter.y - originY) * (newScale / scale) - (cy - pinchCenter.y);
        scale = newScale;
        applyTransform();
      }
      isPanning = false; // disable panning during pinch
    } else if (isPanning && pointers.size === 1) {
      originX = e.clientX - startX; originY = e.clientY - startY; applyTransform();
    }
  });
  stage?.addEventListener('pointerup', (e) => {
    stage.releasePointerCapture?.(e.pointerId);
    pointers.delete(e.pointerId);
  if (pointers.size < 2) { pinchStartDistance = 0; isPinching = false; }
    if (pointers.size === 0) { isPanning = false; }
  });
  stage?.addEventListener('pointercancel', (e) => {
    stage.releasePointerCapture?.(e.pointerId);
    pointers.delete(e.pointerId);
  if (pointers.size < 2) { pinchStartDistance = 0; isPinching = false; }
    if (pointers.size === 0) { isPanning = false; }
  });
  stage?.addEventListener('wheel', (e) => {
    if (!lightbox.classList.contains('open')) return;
    e.preventDefault();
    const rect = stage.getBoundingClientRect();
    const cx = e.clientX - rect.left; const cy = e.clientY - rect.top;
    zoom(e.deltaY>0?-0.1:0.1, cx, cy);
  }, { passive:false });

  // Hidden navigation: keyboard and swipe only (no visible buttons)
  function showIndex(i){
    if (!galleryItems.length) return;
    currentIndex = (i + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];
    const imgPath = `gallery/${item.src}`.replace(/\/*(gallery\/)*/,'gallery/');
    const lang = getLang();
    const title = item.caption?.[lang] || item.caption?.en || '';
    openLightbox(currentIndex, item, {src:imgPath}, title, imgPath);
  }
  // Keyboard arrows
  window.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowLeft') showIndex(currentIndex-1);
    if (e.key === 'ArrowRight') showIndex(currentIndex+1);
  });
  // Touch swipe
  let touchStartX = 0, touchEndX = 0, touchStartY = 0, touchEndY = 0;
  stage?.addEventListener('touchstart', (e) => {
    if (scale > 1 || isPinching) return; // disable swipe detection when zoomed or pinching
    if (e.touches.length === 1) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
  });
  stage?.addEventListener('touchmove', (e) => {
    if (scale > 1 || isPinching) return;
    if (e.touches.length === 1) { touchEndX = e.touches[0].clientX; touchEndY = e.touches[0].clientY; }
  });
  stage?.addEventListener('touchend', () => {
    if (scale > 1 || isPinching) { touchStartX = touchEndX = touchStartY = touchEndY = 0; return; }
    const dx = touchEndX - touchStartX; const dy = Math.abs(touchEndY - touchStartY);
    if (Math.abs(dx) > 60 && dy < 50) {
      if (dx < 0) showIndex(currentIndex+1); else showIndex(currentIndex-1);
    }
    touchStartX = touchEndX = touchStartY = touchEndY = 0;
  });

  // Re-render captions when language changes
  window.addEventListener('storage', (e) => {
    if (e.key === 'language') {
      // Re-fetch to keep it simple and small
      fetch('gallery/gallery.json').then(r=>r.json()).then(renderGrid).catch(()=>{});
    }
  });

  // Also hook into setLanguage so in-page changes update immediately
  if (typeof window.setLanguage === 'function') {
    const original = window.setLanguage;
    window.setLanguage = function(lang) {
      original.call(window, lang);
      fetch('gallery/gallery.json').then(r=>r.json()).then(renderGrid).catch(()=>{});
    }
  } else {
    // If not yet defined, try again after DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof window.setLanguage === 'function') {
        const original2 = window.setLanguage;
        window.setLanguage = function(lang) {
          original2.call(window, lang);
          fetch('gallery/gallery.json').then(r=>r.json()).then(renderGrid).catch(()=>{});
        }
      }
    });
  }
})();
