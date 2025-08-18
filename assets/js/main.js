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
if (navList) navList.setAttribute('aria-hidden', 'true');
navToggle?.addEventListener('click', (e) => {
  console.debug('[nav] toggle click', e.target);
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  const next = !expanded;
  navToggle.setAttribute('aria-expanded', String(next));
  navList.classList.toggle('open', next);
  navList.setAttribute('aria-hidden', String(!next));
  if (next) {
    // Stagger items
    const items = Array.from(navList.children).filter(n => n.tagName === 'LI');
    items.forEach((li, i) => {
      li.style.transitionDelay = (120 + i * 60) + 'ms';
    });
  } else {
    Array.from(navList.children).forEach(li => li.style.transitionDelay = '0ms');
  }
});

// Fallback binding if first didn\'t attach (older browsers)
if (navToggle && !navToggle._boundOnce) {
  navToggle._boundOnce = true;
  navToggle.onclick ||= function(e){
    console.debug('[nav] fallback onclick');
    navToggle.dispatchEvent(new Event('click'));
  };
}

// Close nav on link click (mobile)
$all('#navList a').forEach(a => a.addEventListener('click', () => {
  navList.classList.remove('open');
  navList.setAttribute('aria-hidden', 'true');
  navToggle.setAttribute('aria-expanded', 'false');
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
  try {
    // If projects section/template is not present, skip silently
    if (!document.getElementById('projectCardTemplate') || !document.getElementById('projectsGrid')) {
      return; // section removed
    }
    const res = await fetch('assets/data/projects.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load projects');
    const projects = await res.json();
    if (!Array.isArray(projects) || !projects.length) return showProjectsFallback();
    renderProjects(projects);
    state.projectsLoaded = true;
  } catch (err) {
    console.warn(err);
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

loadProjects();
