// Main JS for portfolio

const state = {
  projectsLoaded: false
};

function $(sel, ctx=document) { return ctx.querySelector(sel); }
function $all(sel, ctx=document) { return Array.from(ctx.querySelectorAll(sel)); }

// Theme toggle removed (single theme design)
const root = document.documentElement;

// Dynamic year
$('#year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = $('#navToggle');
const navList = $('#navList');
const navContainer = navToggle?.closest('.nav');
if (navList) navList.setAttribute('aria-hidden', 'true');
function toggleNav(next) {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  if (typeof next !== 'boolean') next = !expanded;
  navToggle.setAttribute('aria-expanded', String(next));
  navList.classList.toggle('open', next);
  navList.setAttribute('aria-hidden', String(!next));
  if (next) {
    const items = Array.from(navList.children).filter(n => n.tagName === 'LI');
    items.forEach((li, i) => { li.style.transitionDelay = (120 + i * 60) + 'ms'; });
  } else {
    Array.from(navList.children).forEach(li => li.style.transitionDelay = '0ms');
  }
}

navToggle?.addEventListener('click', (e) => {
  console.debug('[nav] toggle click', e.target);
  toggleNav();
});

// Hover open (desktop pointer devices)
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && navContainer) {
  let closeTimer = null;
  const startCloseTimer = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      navContainer.classList.remove('nav--hover');
      toggleNav(false);
    }, 300); // 300ms grace period
  };
  const cancelClose = () => { clearTimeout(closeTimer); };
  navContainer.addEventListener('mouseenter', () => {
    cancelClose();
    navContainer.classList.add('nav--hover');
    toggleNav(true);
  });
  navContainer.addEventListener('mouseleave', startCloseTimer);
  // Keep open when moving within list
  navList?.addEventListener('mouseenter', cancelClose);
  navList?.addEventListener('mouseleave', startCloseTimer);
}

// Fallback binding if first didn\'t attach (older browsers)
// Removed recursive fallback onclick (was causing stack overflow)

// Close nav on link click (mobile)
$all('#navList a').forEach(a => a.addEventListener('click', () => {
  toggleNav(false);
}));

// Intersection Observer reveal animations
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

$all('.section, .project-card').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

// Back to top button
const backToTop = $('#backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 400) backToTop.classList.add('show'); else backToTop.classList.remove('show');
});
backToTop?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));

// Load projects from JSON
async function loadProjects() {
  const tplEl = document.getElementById('projectCardTemplate');
  const gridEl = document.getElementById('projectsGrid');
  if (!tplEl || !gridEl) return; // section not present
  try {
    const res = await fetch('assets/data/projects.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load projects');
    const projects = await res.json();
    if (!Array.isArray(projects) || !projects.length) return showProjectsFallback();
    renderProjects(projects);
    state.projectsLoaded = true;
  } catch (err) {
    console.warn('[projects] load failed:', err);
    showProjectsFallback();
  }
}

function showProjectsFallback() {
  const fb = $('#projectsFallback');
  if (fb) fb.hidden = false;
}

function renderProjects(projects) {
    const grid = $('#projectsGrid');
    const tpl = $('#projectCardTemplate');
    if (!grid || !tpl) return; // safety
  projects.forEach(p => {
    const clone = tpl.content.cloneNode(true);
    const card = clone.querySelector('.project-card');
    card.querySelector('.project-title').textContent = p.title;
    card.querySelector('.project-desc').textContent = p.description;
    const tagsEl = card.querySelector('.project-tags');
    (p.tags || []).forEach(tag => {
      const li = document.createElement('li');
      li.textContent = tag;
      tagsEl.appendChild(li);
    });
    const linksEl = card.querySelector('.project-links');
    (p.links || []).forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = link.label || 'Link';
      linksEl.appendChild(a);
    });
    grid.appendChild(clone);
    card.classList.add('reveal');
    observer.observe(card);
  });
}

// Only call if template exists (idempotent safety already, but cheap guard)
if (document.getElementById('projectCardTemplate')) {
  loadProjects();
}

// Logo-Video Interaktion (sequenzieller Fade ohne gleichzeitige Sichtbarkeit)
const heroLogo = document.getElementById('heroLogo');
const heroVideo = document.getElementById('heroVideo');
if (heroLogo && heroVideo) {
  heroLogo.style.cursor = 'pointer';
  heroLogo.setAttribute('title', 'Video abspielen');
  let animating = false;

  function showVideo() {
    if (animating) return;
    animating = true;
    heroLogo.classList.add('is-hidden');
    const afterLogoFade = () => {
      heroLogo.removeEventListener('transitionend', afterLogoFade);
      heroVideo.classList.add('is-visible');
      heroVideo.removeAttribute('aria-hidden');
      heroVideo.currentTime = 0;
      const playPromise = heroVideo.play();
      if (playPromise?.catch) {
        playPromise.catch(err => {
          console.warn('[video] Play fehlgeschlagen', err);
          heroVideo.setAttribute('controls', '');
        });
      }
      // Warten bis Video sichtbar
      setTimeout(() => { animating = false; }, 520);
    };
    heroLogo.addEventListener('transitionend', afterLogoFade, { once: true });
  }

  function showLogo() {
    if (animating) return;
    animating = true;
    heroVideo.classList.remove('is-visible');
    const afterVideoFade = () => {
      heroVideo.setAttribute('aria-hidden', 'true');
      heroLogo.classList.remove('is-hidden');
      setTimeout(() => { animating = false; }, 520);
    };
    heroVideo.addEventListener('transitionend', afterVideoFade, { once: true });
  }

  heroLogo.addEventListener('click', showVideo);
  heroVideo.addEventListener('ended', showLogo);
  heroVideo.addEventListener('click', showLogo); // vorzeitiges Beenden per Klick
}

// Dynamischer Header (groß oben, kompakt beim Scroll, Navigation inline nur oben)
(function dynamicHeader(){
  const header = document.querySelector('.site-header');
  if(!header) return;
  const navToggle = document.getElementById('navToggle');
  const navList = document.getElementById('navList');
  // Hysterese: zwei Schwellen verhindern Hin- und Herschalten bei Größenänderung
  const ENTER_TOP = 15;   // Punkt der klar unterschritten werden muss um wieder groß zu werden
  const LEAVE_TOP = 110;  // deutlich höherer Punkt um klein zu werden
  const TRANSITION_LOCK_MS = 150; // Sperrzeit nach Wechsel
  let isTop = true; // initial oben
  let ticking = false;
  let lastChange = performance.now();

  function setState(next){
    if(next === isTop) return;
    isTop = next;
    lastChange = performance.now();
    header.classList.toggle('is-top', isTop);
    // Menü einklappen (verhindert Zwischenzustand)
    navList?.classList.remove('open');
    navToggle?.setAttribute('aria-expanded','false');
  }

  function onScroll(){
    const y = window.scrollY;
    const since = performance.now() - lastChange;
    if(isTop){
      // Nur wechseln wenn wir klar über dem oberen Schwellwert sind & nicht mitten in Sperrzeit
      if(y > LEAVE_TOP && since > TRANSITION_LOCK_MS) setState(false);
    } else {
      // Zurück nur wenn wirklich fast oben (unter ENTER_TOP) & Sperre vorbei
      if(y < ENTER_TOP && since > TRANSITION_LOCK_MS) setState(true);
    }
  }

  function rafScroll(){
    if(!ticking){
      requestAnimationFrame(() => { onScroll(); ticking = false; });
      ticking = true;
    }
  }

  window.addEventListener('scroll', rafScroll, { passive:true });
  window.addEventListener('load', onScroll);
  onScroll();
})();

// Dollar Rain Effekt (Scroll-getriebene Partikel)
(function goldRain(){
  const canvas = document.getElementById('goldRainCanvas');
  if(!canvas) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio||1, 2);
  let w = 0, h = 0;
  function resize(){
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(1,0,0,1,0,0); // reset any prior scale
    ctx.scale(DPR, DPR);
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  // Device check for mobile/slow devices
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
  const MAX_PARTICLES = isMobile ? 40 : 90;
  let lastScrollY = window.scrollY;
  let accSpawn = 0; // akkumuliertes Spawnbudget aus Scrollbewegung

  function spawn(n){
    for(let i=0;i<n && particles.length<MAX_PARTICLES;i++){
      const centerBias = Math.random();
      // US Dollar Bill approx ratio ~2.35 : 1 (width : height)
      const baseH = (isMobile ? (12 + Math.random()*8) : (16 + Math.random()*12));
      const height = baseH; // css px (pre-DPR)
      const width  = height * (2.2 + Math.random()*0.35);
      const xPos = centerBias < 0.55 ? (w/2) + (Math.random()-0.5) * w * 0.42 : Math.random()*w;
      particles.push({
        shape: 'bill',
        x: xPos,
        y: -20 - Math.random()*120,
        vy: 28 + Math.random()*38, // langsameres Fallen
        vx: (Math.random()-0.5)*14, // leichter Wind
        width,
        height,
        life: 0,
        ttl: 4200 + Math.random()*2600,
        angle: Math.random()*Math.PI*2,
        angleV: (Math.random()-0.5)*0.35, // Rotation
        swayAmp: 10 + Math.random()*26,   // horizontale Pendel-Amplitude
        swayFreq: 0.0012 + Math.random()*0.0016, // in 1/ms
        flutterAmp: 0.12 + Math.random()*0.22, // Rotations-Pendel
        flutterFreq: 0.0015 + Math.random()*0.0018,
        seed: Math.random()*Math.PI*2,
        tint: 0.85 + Math.random()*0.3, // Helligkeitsvariation
      });
    }
  }

  function update(dt){
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.life += dt;
      if(p.life>p.ttl){ particles.splice(i,1); continue; }
      const tSec = dt/1000;
      p.y += p.vy * tSec;
      p.x += p.vx * tSec;
      // leichter Luftwiderstand
      p.vx *= 0.996;
      // Rotation + Flutter
      const t = p.life;
      p.angle += p.angleV * tSec + Math.sin(t * p.flutterFreq + p.seed) * p.flutterAmp * 0.02;
      if(p.y - p.height > h) { particles.splice(i,1); }
    }
  }
  function drawBill(p){
    const appear = Math.min(1, p.life/320);
    const lifeLeft = 1 - Math.min(1, p.life / p.ttl);
    const wB = p.width;
    const hB = p.height;
    // Sway offset
    const sway = Math.sin(p.life * p.swayFreq + p.seed) * p.swayAmp;
    // Flutter angle component
    const flutter = Math.sin(p.life * p.flutterFreq + p.seed*1.7) * 0.35;
    ctx.save();
    ctx.translate(p.x + sway, p.y);
    ctx.rotate(p.angle * 0.25 + flutter);
    // Paper gradient (money green)
    const g = ctx.createLinearGradient(-wB/2, -hB/2, wB/2, hB/2);
    const tint = p.tint;
    g.addColorStop(0, `rgba(${Math.round(180*tint)}, ${Math.round(205*tint)}, ${Math.round(170*tint)}, ${0.92*appear})`);
    g.addColorStop(1, `rgba(${Math.round(150*tint)}, ${Math.round(185*tint)}, ${Math.round(150*tint)}, ${0.95*appear})`);
    ctx.fillStyle = g;
    const r = Math.min(4, hB*0.25);
    roundRect(ctx, -wB/2, -hB/2, wB, hB, r);
    ctx.fill();
    // Border
    ctx.strokeStyle = `rgba(40,80,50,${0.55*appear})`;
    ctx.lineWidth = 1;
    roundRect(ctx, -wB/2+0.8, -hB/2+0.8, wB-1.6, hB-1.6, Math.max(1.5, r-1));
    ctx.stroke();
    // Inner ornament: circle seal + $ symbol
    const sealR = hB*0.32;
    ctx.beginPath();
    ctx.arc(0, 0, sealR, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(40,90,60,${0.45*appear})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = `rgba(220,240,225,${0.18*appear})`;
    ctx.fill();
    // $ symbol (simple)
    ctx.fillStyle = `rgba(30,70,40,${0.7*appear})`;
    ctx.font = `${Math.max(8, hB*0.6)}px system-ui, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0);
    // Serial-like lines
    ctx.strokeStyle = `rgba(30,80,50,${0.3*appear})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    const offY = hB*0.28;
    ctx.moveTo(-wB*0.36, -offY);
    ctx.lineTo(wB*0.36, -offY);
    ctx.moveTo(-wB*0.36, offY);
    ctx.lineTo(wB*0.36, offY);
    ctx.stroke();
    // Subtle shine band
    const sheenGrad = ctx.createLinearGradient(-wB/2, 0, wB/2, 0);
    sheenGrad.addColorStop(0.45, `rgba(255,255,255,0)`);
    sheenGrad.addColorStop(0.5, `rgba(255,255,255,${0.20*appear*lifeLeft})`);
    sheenGrad.addColorStop(0.55, `rgba(255,255,255,0)`);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = sheenGrad;
    roundRect(ctx, -wB/2, -hB/2, wB, hB, r);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  function roundRect(ctx,x,y,w,h,r){
    if(r<=0){ ctx.beginPath(); ctx.rect(x,y,w,h); return; }
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.lineTo(x+w-rr, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+rr);
    ctx.lineTo(x+w, y+h-rr);
    ctx.quadraticCurveTo(x+w, y+h, x+w-rr, y+h);
    ctx.lineTo(x+rr, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-rr);
    ctx.lineTo(x, y+rr);
    ctx.quadraticCurveTo(x, y, x+rr, y);
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const p of particles){
  if(p.shape === 'bill') drawBill(p);
    }
  }

  let lastT = performance.now();
  function loop(t){
    const dt = t - lastT; lastT = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Scroll-basierte Spawn-Logik
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const delta = Math.abs(y - lastScrollY);
    lastScrollY = y;
    // Angepasste, moderate Rate (Bills sind größer als Partikel)
    const spawnFactor = isMobile ? 0.12 : 0.22;
    const baseSpawn = isMobile ? 0.05 : 0.12;
    accSpawn += delta * spawnFactor + (y>150 ? baseSpawn : baseSpawn/2);
    const toCreate = Math.floor(accSpawn);
    if(toCreate>0){
      spawn(toCreate);
      accSpawn -= toCreate;
    }
  }, { passive:true });

  // Periodische Bursts für "Show"-Effekt
  function burst(mult=1){
    const base = isMobile ? 6 + Math.random()*8 : 10 + Math.random()*12;
    spawn(Math.floor(base*mult));
  }
  const burstInterval = setInterval(() => { burst(isMobile ? 1.2 : 1.4); }, isMobile ? 7000 : 5500);

  // Section-Observer: Beim erstmaligen Erscheinen einer Section extra Glitzer
  const secObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        burst(1.4);
        secObserver.unobserve(e.target);
      }
    });
  }, { threshold:0.4 });
  document.querySelectorAll('section').forEach(s => secObserver.observe(s));

  // Initiale Spawn-Menge
  spawn(isMobile ? 20 : 40);
})();
