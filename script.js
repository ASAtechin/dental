// Core UX interactions: nav toggle, reveal on scroll, counters, parallax, tilt, magnetic buttons, theme toggle

// Utility: clamp number
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

// 1) Mobile nav
const navToggle = document.querySelector('.nav-toggle');
const menu = document.getElementById('menu');
if (navToggle && menu) {
  navToggle.addEventListener('click', () => {
    const open = menu.dataset.open === 'true';
    menu.dataset.open = String(!open);
    navToggle.setAttribute('aria-expanded', String(!open));
  });
}

// 2) Intersection reveal animations
// Smooth reveal easing with stagger
const revealEls = document.querySelectorAll('[data-reveal]');
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.style.transitionDelay = `${Math.random() * 120}ms`;
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// 3) Counters
function counterTo(el) {
  const target = parseFloat(el.dataset.target || '0');
  const isFloat = !Number.isInteger(target);
  const duration = 1400; // ms
  const start = performance.now();
  const startVal = 0;
  function tick(now) {
    const p = clamp((now - start) / duration, 0, 1);
    const val = startVal + (target - startVal) * (1 - Math.pow(1 - p, 3)); // easeOutCubic
    el.textContent = isFloat ? val.toFixed(1) : Math.round(val).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

document.querySelectorAll('[data-counter]').forEach(counterTo);

// 4) Parallax blobs (rAF-throttled)
const parallaxEls = document.querySelectorAll('[data-parallax]');
(function parallaxRAF(){
  if (!parallaxEls.length) return;
  let px = 0, py = 0, tx = 0, ty = 0; let rafId = null;
  const step = () => {
    px += (tx - px) * 0.12; // ease
    py += (ty - py) * 0.12;
    parallaxEls.forEach((el) => {
      const depth = parseFloat(el.dataset.depth || '0.2');
      el.style.transform = `translate(${px * -20 * depth}px, ${py * -20 * depth}px)`;
    });
    rafId = requestAnimationFrame(step);
  };
  window.addEventListener('mousemove', (e) => {
    const { innerWidth: w, innerHeight: h } = window;
    tx = (e.clientX / w - 0.5) * 2; // -1..1
    ty = (e.clientY / h - 0.5) * 2;
    if (!rafId) rafId = requestAnimationFrame(step);
  }, { passive: true });
})();

// 5) Tilt cards
const tiltEls = document.querySelectorAll('[data-tilt]');
function handleTilt(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width; // 0..1
  const y = (e.clientY - rect.top) / rect.height;
  const rx = clamp((0.5 - y) * 10, -10, 10);
  const ry = clamp((x - 0.5) * 10, -10, 10);
  el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
}
function resetTilt(e) { e.currentTarget.style.transform = 'rotateX(0) rotateY(0)'; }

tiltEls.forEach((el) => {
  el.addEventListener('mousemove', handleTilt);
  el.addEventListener('mouseleave', resetTilt);
});

// 6) Magnetic buttons + shine
const magneticEls = document.querySelectorAll('[data-magnetic]');
magneticEls.forEach((btn) => {
  const shine = btn.querySelector('.btn-shine');
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    btn.style.transform = `translate(${(x - rect.width/2) * 0.05}px, ${(y - rect.height/2) * 0.05}px)`;
    if (shine) {
      const xp = Math.round((x / rect.width) * 100);
      const yp = Math.round((y / rect.height) * 100);
      shine.style.setProperty('--x', `${xp}%`);
      shine.style.setProperty('--y', `${yp}%`);
    }
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
});

// 7) Theme toggle with prefers-color-scheme
const themeBtn = document.querySelector('.theme-toggle');
const root = document.documentElement;
function applyTheme(mode) {
  root.setAttribute('color-theme', mode);
  try { localStorage.setItem('theme', mode); } catch {}
}
function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
(function initTheme() {
  const saved = (() => { try { return localStorage.getItem('theme'); } catch { return null; } })();
  applyTheme(saved || getSystemTheme());
})();
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const current = root.getAttribute('color-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

// 8) Footer year
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// 9) Reduce motion respect for interactive effects
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Disable interactive transforms that may cause motion sickness
  tiltEls.forEach(el => {
    el.removeEventListener('mousemove', handleTilt);
    el.removeEventListener('mouseleave', resetTilt);
  });
  magneticEls.forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
}

// Scroll progress bar
const sp = document.getElementById('scroll-progress');
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? (window.scrollY / max) : 0;
  if (sp) sp.style.width = `${p * 100}%`;
}
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();

// Cursor aura follow
const aura = document.querySelector('.cursor-aura');
if (aura) {
  let ax = 0, ay = 0; let tx = 0, ty = 0; let rafId = null;
  const follow = () => {
    ax += (tx - ax) * 0.2;
    ay += (ty - ay) * 0.2;
    aura.style.transform = `translate(${ax - 11}px, ${ay - 11}px)`; // center 22px
    rafId = requestAnimationFrame(follow);
  };
  window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; if (!rafId) follow(); }, { passive: true });
}

// Before/After slider
(function initBeforeAfter(){
  const root = document.querySelector('.before-after');
  if (!root) return;
  const track = root.querySelector('.ba-track');
  const after = root.querySelector('.after');
  const handle = root.querySelector('.ba-handle');
  let pos = 50;
  const setPos = (p) => { pos = clamp(p, 0, 100); after.style.setProperty('--pos', `${pos}%`); handle.style.left = `${pos}%`; handle.setAttribute('aria-valuenow', String(Math.round(pos))); };
  const rect = () => track.getBoundingClientRect();
  const fromClientX = (x) => ( (x - rect().left) / rect().width ) * 100;
  const onMove = (x) => setPos(fromClientX(x));

  let dragging = false;
  const start = (x) => { dragging = true; onMove(x); document.body.classList.add('is-dragging'); };
  const move = (x) => { if (!dragging) return; onMove(x); };
  const end = () => { dragging = false; document.body.classList.remove('is-dragging'); };

  handle.addEventListener('mousedown', (e) => start(e.clientX));
  window.addEventListener('mousemove', (e) => move(e.clientX));
  window.addEventListener('mouseup', end);

  // Touch
  handle.addEventListener('touchstart', (e) => start(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchend', end);

  // Click to jump
  track.addEventListener('click', (e) => onMove(e.clientX));

  // Keyboard
  handle.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') { setPos(pos - step); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setPos(pos + step); e.preventDefault(); }
    if (e.key === 'Home') { setPos(0); e.preventDefault(); }
    if (e.key === 'End') { setPos(100); e.preventDefault(); }
  });
})();

// 10) Confetti on CTA submit
(function confetti(){
  const form = document.querySelector('.cta-form');
  if (!form) return;
  const btn = form.querySelector('button');
  function burst(x, y) {
    const c = document.createElement('canvas');
    Object.assign(c.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 90 });
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    function resize(){ c.width = innerWidth * dpr; c.height = innerHeight * dpr; }
    resize();
    const colors = ['#22d3ee','#0ea5e9','#a78bfa','#34d399','#f59e0b'];
    const parts = Array.from({length: 120}, () => ({
      x: x * dpr, y: y * dpr, r: Math.random()*4+2, a: Math.random()*Math.PI*2,
      vx: (Math.random()-0.5)*6, vy: (Math.random()-1.2)*6, c: colors[(Math.random()*colors.length)|0], life: 60 + (Math.random()*40|0)
    }));
    let frame = 0;
    function draw(){
      ctx.clearRect(0,0,c.width,c.height);
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.99; p.life--; 
        ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      });
      frame++;
      if (frame < 90) requestAnimationFrame(draw); else c.remove();
    }
    requestAnimationFrame(draw);
    window.addEventListener('resize', resize, { once: true });
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
    burst(cx, cy);
  });
})();

// Smooth scroll for in-page links
(function smoothScroll(){
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.startsWith('#!')) return;
      const target = document.querySelector(id);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
})();

// Procedures data loading and UI
(async function procedures(){
  const list = document.getElementById('proc-list');
  const filtersWrap = document.getElementById('proc-filters');
  const search = document.getElementById('proc-search');
  const contactSelect = document.getElementById('contact-procedure');
  if (!list || !filtersWrap) return;
  try {
    const res = await fetch('data/procedures.json');
    const items = await res.json();

    // Build category chips
    const cats = Array.from(new Set(items.map(i => i.category)));
    const chips = ['All', ...cats].map((c, i) => {
      const el = document.createElement('button');
      el.className = 'chip';
      el.setAttribute('role', 'tab');
      el.setAttribute('aria-selected', String(i === 0));
      el.textContent = c;
      filtersWrap.appendChild(el);
      return el;
    });

    // Build contact select options
    if (contactSelect) {
      items.forEach(i => {
        const opt = document.createElement('option');
        opt.value = i.slug; opt.textContent = `${i.icon} ${i.title}`; contactSelect.appendChild(opt);
      });
    }

    function render(filterCat = 'All', q = ''){
      list.innerHTML = '';
      const needle = q.trim().toLowerCase();
      items.filter(i => (filterCat === 'All' || i.category === filterCat) && (
        !needle || i.title.toLowerCase().includes(needle) || i.summary.toLowerCase().includes(needle) || i.details.toLowerCase().includes(needle)
      )).forEach(i => {
        const card = document.createElement('article'); card.className = 'proc-card';
        card.innerHTML = `
          <div class="thumb" style="background-image:url('${i.image}')"></div>
          <div class="body">
            <div class="meta">${i.icon} <span>${i.category}</span></div>
            <h3>${i.title}</h3>
            <p class="muted">${i.summary}</p>
            <div class="actions">
              <a href="#book" class="btn">Book</a>
              <a href="#" class="btn btn-ghost js-open" data-slug="${i.slug}">Details</a>
            </div>
          </div>`;
        list.appendChild(card);
      });
      if (!list.children.length) {
        const empty = document.createElement('p'); empty.className = 'muted'; empty.textContent = 'No procedures match your search. Try a different term.'; list.appendChild(empty);
      }
    }

    // Interactions
    let currentCat = 'All';
    chips.forEach(ch => ch.addEventListener('click', () => {
      chips.forEach(c => c.setAttribute('aria-selected', 'false'));
      ch.setAttribute('aria-selected', 'true');
      currentCat = ch.textContent || 'All';
      render(currentCat, search.value);
    }));
    search.addEventListener('input', () => render(currentCat, search.value));

    // Modal logic
    const modal = document.getElementById('proc-modal');
    const mHero = document.getElementById('proc-hero');
    const mIcon = document.getElementById('proc-icon');
    const mTitle = document.getElementById('proc-title');
    const mSummary = document.getElementById('proc-summary');
    const mDuration = document.getElementById('proc-duration');
    const mPain = document.getElementById('proc-pain');
    const mRecovery = document.getElementById('proc-recovery');
    const mCost = document.getElementById('proc-cost');
    const mSteps = document.getElementById('proc-steps');

    function openModal(slug){
      const item = items.find(x => x.slug === slug);
      if (!item || !modal) return;
      mHero.style.backgroundImage = `linear-gradient(180deg, #0b1220aa, #0b1220aa), url('${item.image}')`;
      mIcon.textContent = item.icon;
      mTitle.textContent = item.title;
      mSummary.textContent = item.summary;
      mDuration.textContent = item.duration;
      mPain.textContent = item.painLevel;
      mRecovery.textContent = item.recovery;
      mCost.textContent = item.costRange;
      mSteps.innerHTML = '';
      item.steps.forEach(s => { const li = document.createElement('li'); li.textContent = s; mSteps.appendChild(li); });
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      setTimeout(() => modal.querySelector('.modal-dialog')?.focus(), 0);
    }
    function closeModal(){ if (!modal) return; modal.hidden = true; document.body.style.overflow = ''; }

    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.matches('.js-open')) { e.preventDefault(); openModal(t.dataset.slug); }
      if (t instanceof HTMLElement && t.closest('[data-close]')) { closeModal(); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // Wire "Learn more" links in Services
    document.querySelectorAll('.js-learn').forEach(a => {
      a.addEventListener('click', (e) => {
        const slug = a.getAttribute('data-procedure');
        if (!slug) return;
        // Navigate to procedures then open modal
        const section = document.getElementById('procedures');
        if (section) { e.preventDefault(); section.scrollIntoView({ behavior: 'smooth' }); setTimeout(() => openModal(slug), 350); }
      });
    });

    // Initial render
    render();
  } catch (err) {
    if (list) list.innerHTML = '<p class="muted">Unable to load procedures right now. Please try again later.</p>';
    console.error(err);
  }
})();

// Contact form validation and fake submit
(function contactForm(){
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const required = ['name','phone','email'];
    const missing = required.filter(k => !String(data[k]||'').trim());
    if (missing.length) { alert('Please fill all required fields.'); return; }
    // Simulate submit and success
    form.reset();
    alert('Thanks! We\'ll contact you shortly.');
  });
})();

// Make external links open in new tab where appropriate
(function externalLinks(){
  document.querySelectorAll('a[href^="http"]').forEach(a => {
    if (!a.hasAttribute('target')) { a.setAttribute('target','_blank'); a.setAttribute('rel','noopener'); }
  });
})();

// Load clinic profile data and populate site
(async function initClinic(){
  try {
    const res = await fetch('data/clinic.json', { cache: 'no-store' });
    if (!res.ok) return; const data = await res.json();

    // Title and brand
    if (data.name) document.title = `${data.name} — Modern Care, Beautiful Smiles`;
    document.querySelectorAll('.logo span').forEach(s => { if (data.name) s.textContent = data.name; });

    // Phone links
    if (data.phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(a => {
        a.setAttribute('href', `tel:${data.phone.replace(/\s+/g,'')}`);
        if (/^Call /i.test(a.textContent.trim())) a.textContent = `Call ${data.phone}`;
      });
    }

    // Email links
    if (data.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
        a.setAttribute('href', `mailto:${data.email}`);
      });
    }

    // Address and maps
    const mapQuery = encodeURIComponent(data.mapQuery || data.name || 'Dental Clinic');
    const addrText = data.address || '';
    document.querySelectorAll('.contact .muted, .contact-card p').forEach(p => {
      // keep only address p in contact-card (first p following h3)
      if (p.closest('.contact-card')) { p.textContent = addrText || p.textContent; }
    });
    document.querySelectorAll('a[href*="maps.google"]').forEach(a => {
      a.setAttribute('href', `https://maps.google.com/?q=${mapQuery}`);
      if (a.closest('address.contact') && addrText) a.textContent = addrText.replace(/\s*·\s*/g, ', ');
    });
    const mapIframe = document.querySelector('.map-wrap iframe');
    if (mapIframe) mapIframe.src = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

    // Hours (simple formatter)
    const hours = data.hours || {};
    const footerHours = document.querySelector('address.contact .muted');
    function fmtHours(h) { return h || 'Closed'; }
    if (footerHours && hours.mon && hours.sat) {
      const wk = [hours.mon, hours.tue, hours.wed, hours.thu, hours.fri];
      const allEqual = wk.every(h => h === wk[0]);
      const monFri = allEqual ? `Mon–Fri ${fmtHours(wk[0])}` : `Mon ${fmtHours(hours.mon)} · Tue ${fmtHours(hours.tue)} · Wed ${fmtHours(hours.wed)} · Thu ${fmtHours(hours.thu)} · Fri ${fmtHours(hours.fri)}`;
      const sat = `Sat ${fmtHours(hours.sat)}`;
      const sun = hours.sun ? ` · Sun ${fmtHours(hours.sun)}` : '';
      footerHours.textContent = `${monFri} · ${sat}${sun}`;
    }

    // Update hero rating stat from data
    const ratingNum = document.querySelector('.stats .stat:nth-child(2) .num');
    const ratingLabel = document.querySelector('.stats .stat:nth-child(2) .label');
    if (ratingNum && typeof data.rating === 'number') {
      ratingNum.dataset.target = String(data.rating);
      ratingNum.textContent = Number(data.rating).toFixed(1);
    }
    if (ratingLabel && typeof data.reviewCount === 'number') {
      ratingLabel.textContent = `Rating on ${data.reviewCount}+ reviews`;
    }

    // JSON-LD update
    const ld = document.querySelector('script[type="application/ld+json"]');
    if (ld) {
      const obj = {
        '@context': 'https://schema.org', '@type': 'Dentist',
        name: data.name || undefined,
        telephone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address ? { '@type': 'PostalAddress', streetAddress: data.address, addressLocality: data.city, addressRegion: data.state, postalCode: data.postalCode, addressCountry: data.country } : undefined,
        url: data.website || undefined
      };
      ld.textContent = JSON.stringify(obj, null, 2);
    }
  } catch (e) {
    console.warn('Clinic data not loaded', e);
  }
})();

// Gallery loader + lightbox
(async function gallery(){
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  try {
    const res = await fetch('data/photos.json', { cache: 'no-store' });
    const photos = await res.json();
    photos.forEach((p, idx) => {
      const cell = document.createElement('figure'); cell.className = 'cell'; cell.setAttribute('data-idx', String(idx));
      cell.innerHTML = `<img loading="lazy" decoding="async" sizes="(max-width:700px) 50vw, (max-width:1000px) 33vw, 25vw" src="${p.src}" alt="${p.alt||'Clinic photo'}"><figcaption class="cap">${p.alt||''}</figcaption>`;
      grid.appendChild(cell);
    });
    const modal = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    function openAt(i){ const p = photos[i]; if (!p) return; img.src = p.src; img.alt = p.alt||'Clinic photo'; cap.textContent = p.alt||''; modal.hidden = false; document.body.style.overflow = 'hidden'; modal.dataset.idx = String(i); }
    function close(){ modal.hidden = true; document.body.style.overflow = ''; }
    grid.addEventListener('click', (e) => { const f = e.target.closest('.cell'); if (f) openAt(Number(f.dataset.idx||0)); });
    document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', (e) => {
      if (modal.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const i = Number(modal.dataset.idx||0) + (e.key === 'ArrowRight' ? 1 : -1);
        openAt((i + photos.length) % photos.length);
      }
    });
  } catch (e) {
    console.warn('Gallery not loaded', e);
  }
})();

// Dynamic background glow for gallery cells
(function glowGallery(){
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  const onMove = (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const r = cell.getBoundingClientRect();
    const mx = ((e.clientX - r.left)/r.width)*100; const my = ((e.clientY - r.top)/r.height)*100;
    cell.style.setProperty('--mx', mx+'%');
    cell.style.setProperty('--my', my+'%');
  };
  grid.addEventListener('mousemove', onMove, { passive: true });
})();

// Floating quick actions (Call, WhatsApp, Directions, Top)
(async function floatingActions(){
  const root = document.getElementById('floating-cta');
  if (!root) return;
  try {
    const res = await fetch('data/clinic.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();

    const phoneRaw = String(data.phone || '').replace(/\s+/g,'');
    const telHref = phoneRaw ? `tel:${phoneRaw}` : '';
    const waNumber = String(data.whatsapp || phoneRaw).replace(/[^\d]/g,'');
    const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent('Hello! I would like to book an appointment.')}` : '';
    const mapHref = `https://maps.google.com/?q=${encodeURIComponent(data.mapQuery || data.name || 'Dental Clinic')}`;

    root.innerHTML = '';
    function add(link, label, cls, emoji){
      if (!link) return;
      const a = document.createElement('a');
      a.href = link; a.className = `fab ${cls||''}`; a.setAttribute('aria-label', label); a.title = label; a.innerText = emoji; a.rel = 'noopener'; a.target = link.startsWith('http') ? '_blank' : '';
      root.appendChild(a);
    }
    add(telHref, 'Call clinic', 'fab--primary', '📞');
    add(waHref, 'Chat on WhatsApp', '', '💬');
    add(mapHref, 'Get directions', '', '🗺️');

    // Back to top button
    const topBtn = document.createElement('button');
    topBtn.type = 'button'; topBtn.className = 'fab'; topBtn.setAttribute('aria-label','Back to top'); topBtn.title = 'Back to top'; topBtn.textContent = '↑';
    topBtn.style.display = 'none';
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    root.appendChild(topBtn);
    const toggleTop = () => { topBtn.style.display = window.scrollY > 600 ? '' : 'none'; };
    window.addEventListener('scroll', toggleTop, { passive: true }); toggleTop();
  } catch {}
})();

// Videos loader and player
(async function videos(){
  const carousel = document.getElementById('video-carousel');
  const grid = document.getElementById('video-grid');
  const expandBtn = document.getElementById('video-expand');
  if (!carousel || !grid) return;
  
  // Wait for lite-youtube to be available
  await new Promise(resolve => {
    if (window.customElements && window.customElements.get('lite-youtube')) {
      resolve();
    } else {
      window.addEventListener('DOMContentLoaded', resolve);
      setTimeout(resolve, 500); // fallback
    }
  });
  
  let isExpanded = false;
  let vids = [];

  try {
    const res = await fetch('data/videos.json', { cache: 'no-store' });
    if (!res.ok) return;
    vids = await res.json();

    function createVideoCard(v, idx) {
      const card = document.createElement('article');
      card.className = 'video-card';
      const body = `
        <div class="body">
          <h3>${v.title}</h3>
          <div class="meta">${v.duration || ''} ${v.caption ? '· ' + v.caption : ''}</div>
        </div>`;

      if (v.youtubeId) {
        card.innerHTML = `
          <div class="thumb" data-idx="${idx}">
            <lite-youtube videoid="${v.youtubeId}" playlabel="Play: ${v.title}"></lite-youtube>
          </div>
          ${body}`;
      } else {
        card.innerHTML = `
          <div class="thumb" data-idx="${idx}">
            <video preload="none" playsinline muted ${v.poster ? `poster="${v.poster}"` : ''}>
              ${v.src ? `<source src="${v.src}" type="video/mp4" />` : ''}
            </video>
            <button class="play" type="button" aria-label="Play video">▶︎ Play</button>
          </div>
          ${body}`;
      }
      return card;
    }

    // Initially show first 3 videos in carousel
    vids.slice(0, 3).forEach((v, idx) => {
      carousel.appendChild(createVideoCard(v, idx));
    });

    // Expand/collapse functionality
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        if (isExpanded) {
          // Show all videos in grid
          grid.innerHTML = '';
          vids.forEach((v, idx) => {
            grid.appendChild(createVideoCard(v, idx));
          });
          grid.classList.remove('hidden');
          carousel.style.display = 'none';
          expandBtn.textContent = 'Show less';
        } else {
          // Show carousel with first 3
          carousel.style.display = '';
          grid.classList.add('hidden');
          expandBtn.textContent = 'View all videos';
        }
        attachVideoEvents();
      });
    }

    function attachVideoEvents() {
      const activeContainer = isExpanded ? grid : carousel;
      
      function attachHoverGlow(container){
        container.addEventListener('mousemove', (e) => {
          const card = e.target.closest('.video-card');
          if (!card) return;
          const r = card.getBoundingClientRect();
          const mx = ((e.clientX - r.left)/r.width)*100; 
          const my = ((e.clientY - r.top)/r.height)*100;
          card.style.setProperty('--mx', mx+'%');
          card.style.setProperty('--my', my+'%');
        });
      }

      activeContainer.querySelectorAll('.video-card').forEach(card => {
        attachHoverGlow(card.parentElement);
      });

      // Synchronize videos: pause all others when one starts playing
      activeContainer.addEventListener('play', (e) => {
        if (e.target.tagName !== 'VIDEO') return;
        // Pause other HTML5 videos
        document.querySelectorAll('#video-carousel video, #video-grid video').forEach(v => { 
          if (v !== e.target) v.pause(); 
        });
        // Pause all YouTube videos
        document.querySelectorAll('#video-carousel lite-youtube, #video-grid lite-youtube').forEach(yt => {
          if (yt.shadowRoot && yt.shadowRoot.querySelector('iframe')) {
            try {
              yt.shadowRoot.querySelector('iframe').contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } catch {}
          }
        });
      }, true);

      // YouTube video synchronization
      activeContainer.addEventListener('click', (e) => {
        const liteYt = e.target.closest('lite-youtube');
        if (!liteYt) return;
        
        setTimeout(() => {
          document.querySelectorAll('#video-carousel video, #video-grid video').forEach(v => v.pause());
          document.querySelectorAll('#video-carousel lite-youtube, #video-grid lite-youtube').forEach(yt => {
            if (yt !== liteYt && yt.shadowRoot && yt.shadowRoot.querySelector('iframe')) {
              try {
                yt.shadowRoot.querySelector('iframe').contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
              } catch {}
            }
          });
        }, 100);
      });
    }

    // Initial event attachment
    attachVideoEvents();

    // Global YouTube message listener
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'video-progress' || (data.info && data.info.playerState === 1)) {
          document.querySelectorAll('#video-carousel video, #video-grid video').forEach(v => v.pause());
        }
      } catch {}
    });

  } catch (e) {
    console.warn('Videos not loaded', e);
  }
})();
