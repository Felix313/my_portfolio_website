// Main JS for portfolio

const state = {
  projectsLoaded: false
};

function $(sel, ctx=document) { return ctx.querySelector(sel); }
function $all(sel, ctx=document) { return Array.from(ctx.querySelectorAll(sel)); }

// Theme toggle
const themeToggle = $('#themeToggle');
const root = document.documentElement;
const storedTheme = localStorage.getItem('theme');
if (storedTheme) {
  root.setAttribute('data-theme', storedTheme);
  updateThemeButton(storedTheme);
}

function updateThemeButton(theme) {
  if (!themeToggle) return;
  themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
  themeToggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`);
}

themeToggle?.addEventListener('click', () => {
  const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeButton(next);
});

// Dynamic year
$('#year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = $('#navToggle');
const navList = $('#navList');
navToggle?.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  navList.classList.toggle('open');
});

// Close nav on link click (mobile)
$all('#navList a').forEach(a => a.addEventListener('click', () => {
  if (window.innerWidth <= 720) {
    navList.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
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
  $('#projectsFallback').hidden = false;
}

function renderProjects(projects) {
  const grid = $('#projectsGrid');
  const tpl = $('#projectCardTemplate');
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

// Prefers color scheme initial alignment if no manual choice
if (!storedTheme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = prefersDark ? 'dark' : 'light';
  root.setAttribute('data-theme', initial);
  updateThemeButton(initial);
}
