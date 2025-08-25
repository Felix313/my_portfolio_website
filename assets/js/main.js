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

// Goldregen Effekt (Scroll-getriebene Partikel)
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
  const MAX_PARTICLES = isMobile ? 120 : 320;
  let lastScrollY = window.scrollY;
  let accSpawn = 0; // akkumuliertes Spawnbudget aus Scrollbewegung

  function spawn(n){
    for(let i=0;i<n && particles.length<MAX_PARTICLES;i++){
      const centerBias = Math.random();
      // Make bars thicker, shorter, more metallic
      const thicknessBase = Math.random()*4.2 + 5.2; // dicker
      const width = thicknessBase * (6.5 + Math.random()*3.5); // etwas kürzer
      const height = thicknessBase * (2.8 + Math.random()*1.2); // dicker
      const depth = Math.min(height*0.7, width*0.22); // mehr Tiefe
      const xPos = centerBias < 0.60
        ? (w/2) + (Math.random()-0.5) * w * 0.38
        : Math.random()*w;
      particles.push({
        shape: 'bar',
        x: xPos,
        y: -40 - Math.random()*140,
        vy: 45 + Math.random()*65,
        vx: (Math.random()-0.5)*10,
        width,
        height,
        depth,
        life: 0,
        ttl: 3400 + Math.random()*2200,
        spin: Math.random()*Math.PI*2,
        spinV: (Math.random()-0.5)*0.18,
        roll: (Math.random()-0.5)*0.28,
        rollV: (Math.random()-0.5)*0.04,
        sheenOffset: Math.random(),
      });
    }
  }

  function update(dt){
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.life += dt;
      if(p.life>p.ttl){ particles.splice(i,1); continue; }
      p.y += p.vy * dt/1000;
      p.x += p.vx * dt/1000;
      p.vx *= 0.994; // minimaler drift decay
      p.spin += p.spinV * dt/16.6; // dt normieren (~60fps)
      p.roll += p.rollV * dt/16.6;
      // leichte sinkende Roll-Verlangsamung
      p.rollV *= 0.999;
      if(p.y - p.height > h) { particles.splice(i,1); }
    }
  }

  function drawBar(p){
    const appear = Math.min(1, p.life/320);
    const lifeLeft = 1 - Math.min(1, p.life / p.ttl);
    const wBar = p.width;
    const hBar = p.height;
    const d = p.depth;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.spin * 0.5);
    ctx.transform(1, p.roll*0.14, 0, 1, 0, 0);
    // Face Gradient: dunkler, satter, metallic
    const g = ctx.createLinearGradient(-wBar/2, -hBar/2, wBar/2, hBar/2);
    g.addColorStop(0, `rgba(220,200,120,${0.98*appear})`);
    g.addColorStop(0.18, `rgba(210,180,80,${0.93*appear})`);
    g.addColorStop(0.42, `rgba(180,140,60,${0.90*appear})`);
    g.addColorStop(0.70, `rgba(140,100,40,${0.92*appear})`);
    g.addColorStop(1, `rgba(90,60,20,${0.85*appear})`);
    ctx.fillStyle = g;
    const r = Math.min(7, hBar*0.38);
    roundRect(ctx, -wBar/2, -hBar/2, wBar, hBar, r);
    ctx.shadowColor = 'rgba(60,40,10,0.18)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Top bevel (Pseudo 3D Top)
    ctx.beginPath();
    ctx.moveTo(-wBar/2, -hBar/2);
    ctx.lineTo(-wBar/2 + d, -hBar/2 - d);
    ctx.lineTo(wBar/2 - d, -hBar/2 - d);
    ctx.lineTo(wBar/2, -hBar/2);
    ctx.closePath();
    const topGrad = ctx.createLinearGradient(0, -hBar/2 - d, 0, -hBar/2 + d);
    topGrad.addColorStop(0, `rgba(255,255,220,${0.92*appear})`);
    topGrad.addColorStop(1, `rgba(180,150,60,${0.82*appear})`);
    ctx.fillStyle = topGrad;
    ctx.fill();
    // Left side bevel
    ctx.beginPath();
    ctx.moveTo(-wBar/2, -hBar/2);
    ctx.lineTo(-wBar/2 + d, -hBar/2 - d);
    ctx.lineTo(-wBar/2 + d, hBar/2 - d);
    ctx.lineTo(-wBar/2, hBar/2);
    ctx.closePath();
    const sideGrad = ctx.createLinearGradient(-wBar/2, 0, -wBar/2 + d, 0);
    sideGrad.addColorStop(0, `rgba(110,80,20,${0.88*appear})`);
    sideGrad.addColorStop(1, `rgba(180,150,60,${0.82*appear})`);
    ctx.fillStyle = sideGrad;
    ctx.fill();
    // Metallic shine (sheen)
    const sheenPos = (p.sheenOffset + p.life/2200) % 1;
    const sheenX = -wBar/2 + sheenPos * wBar;
    const sheenWidth = wBar*0.13;
    const sheenGrad = ctx.createLinearGradient(sheenX - sheenWidth, 0, sheenX + sheenWidth, 0);
    sheenGrad.addColorStop(0, 'rgba(255,255,255,0)');
    sheenGrad.addColorStop(0.48, `rgba(255,255,255,${0.32*appear*lifeLeft})`);
    sheenGrad.addColorStop(0.52, `rgba(255,255,255,${0.32*appear*lifeLeft})`);
    sheenGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = sheenGrad;
    roundRect(ctx, -wBar/2, -hBar/2, wBar, hBar, r);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // Subtle outline
    ctx.strokeStyle = `rgba(80,60,20,${0.22*appear})`;
    ctx.lineWidth = 1.2;
    roundRect(ctx, -wBar/2, -hBar/2, wBar, hBar, r);
    ctx.stroke();
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
      if(p.shape === 'bar') drawBar(p);
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

  // Scroll-basierte Spawn-Logik (deutlich erhöhte Rate & Grundrauschen)
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const delta = Math.abs(y - lastScrollY);
    lastScrollY = y;
    // Reduce spawn rate for mobile
    const spawnFactor = isMobile ? 0.18 : 0.32;
    const baseSpawn = isMobile ? 0.08 : 0.18;
    accSpawn += delta * spawnFactor + (y>150 ? baseSpawn : baseSpawn/2);
    const toCreate = Math.floor(accSpawn);
    if(toCreate>0){
      spawn(toCreate);
      accSpawn -= toCreate;
    }
  }, { passive:true });

  // Periodische Bursts für "Show"-Effekt
  function burst(mult=1){
    const base = isMobile ? 8 + Math.random()*8 : 16 + Math.random()*18;
    spawn(Math.floor(base*mult));
  }
  const burstInterval = setInterval(() => { burst(isMobile ? 1.2 : 1.5); }, isMobile ? 7000 : 5000);

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

  // Initial kräftiger Startschub
  spawn(isMobile ? 32 : 70);
})();
