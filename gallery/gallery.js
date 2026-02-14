// Gallery renderer: loads gallery.json, renders grid, and shows date in a lightbox
(function(){
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImage');
  const lbClose = document.querySelector('.lightbox-close');
  const stage = document.getElementById('lightbox');

  const getLang = () => localStorage.getItem('language') || (navigator.language.startsWith('zh-HK') ? 'zh-HK' : navigator.language.startsWith('zh-TW') ? 'zh-TW' : 'en');

  // Format date for display (accepts string or Date). Localized: zh -> "YYYY年M月D日", otherwise "DD Mon YYYY"
  function formatDisplayDate(raw, lang) {
    if (!raw) return '';
    if (!lang) lang = getLang();
    let d = null;
    if (raw instanceof Date && !isNaN(raw)) d = raw;
    else if (typeof raw === 'string') {
      // EXIF can be like "YYYY:MM:DD HH:MM:SS"
      const exifMatch = raw.match(/^(\d{4}):(\d{2}):(\d{2})/);
      if (exifMatch) {
        d = new Date(Number(exifMatch[1]), Number(exifMatch[2]) - 1, Number(exifMatch[3]));
      } else {
        const normalized = raw.replace(/\./g,'-').replace(/\//g,'-').replace(/\s+/,'T');
        const parsed = new Date(normalized);
        if (!isNaN(parsed)) d = parsed;
        else {
          const ymd = raw.match(/(\d{4})\D?(\d{2})\D?(\d{2})/);
          if (ymd) d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
        }
      }
    }
    if (!d || isNaN(d)) return (typeof raw === 'string') ? raw : '';
    const yyyy = d.getFullYear();
    const m = d.getMonth() + 1;
    const dd = d.getDate();
    if (lang && lang.startsWith('zh')) {
      return `${yyyy}年${m}月${dd}日`;
    } else {
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${dd} ${monthNames[d.getMonth()]} ${yyyy}`;
    }
  }

  // Fetch gallery data
  fetch('gallery/gallery.json', { cache: 'no-store' })
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
        dateElement.textContent = formatDisplayDate(item.date, getLang());
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

    // Update lightbox caption
    const captionEl = document.getElementById('lightboxCaption');
    if (captionEl) {
      captionEl.textContent = title || '';
    }

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
                // Use Date object from EXIF for consistent formatting
                try {
                  const d = new Date(exif.DateTimeOriginal);
                  if (!isNaN(d)) shotDate = d;
                } catch {}
              }
            } catch {}
          }
        }

        if (shotDate) {
          metaDate.innerHTML = `<span><i class="fas fa-calendar"></i>${formatDisplayDate(shotDate, lang)}</span>${item.camera ? `<span><i class="fas fa-camera"></i>${item.camera}</span>` : ''}`;
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
      fetch('gallery/gallery.json', { cache: 'no-store' }).then(r=>r.json()).then(renderGrid).catch(()=>{});
    }
  });

  // Hook into setLanguage for in-page language changes
  (function() {
    const original = window.setLanguage;
    window.setLanguage = function(lang) {
      if (typeof original === 'function') {
        original.call(window, lang);
      }
      // Re-render gallery with new language
      fetch('gallery/gallery.json', { cache: 'no-store' }).then(r=>r.json()).then(renderGrid).catch(()=>{});
    };
  })();

  // Expose minimal legacy API for inline handlers in `index.html`
  window.openLightbox = function(i){ showIndex(i); };
  window.closeLightbox = closeLightbox;
  window.navigateLightbox = function(direction){ showIndex(currentIndex + direction); };

})();
