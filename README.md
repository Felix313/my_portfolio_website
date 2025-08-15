# My Portfolio Website

Modern, fast, fully static personal portfolio you can host on GitHub Pages.

## ✨ Features (initial scaffold)

- Single-page layout (Hero, About, Skills, Projects, Contact)
- Responsive design (mobile-first, flex/grid)
- Theme toggle (light/dark stored in localStorage)
- Accessible semantic HTML + skip link
- Projects loaded from a JSON data file (easy to update)
- Subtle entrance animations via Intersection Observer (no heavy libs)
- Social / CTA buttons with keyboard focus styles

## 🚀 Quick Start

1. Clone the repo (or fork on GitHub):
	 ```bash
		git clone https://github.com/Felix313/my_portfolio_website.git
	 cd my_portfolio_website
	 ```
2. Open `index.html` in your browser (double-click or use a local server).
3. Edit the content inside the markup sections & `assets/data/projects.json`.
4. Commit & push changes.

## 🌐 Deploy to GitHub Pages

1. On GitHub, go to Settings → Pages.
2. Under "Build and deployment", choose: Source = `Deploy from a branch`.
3. Select branch `main`, folder `/ (root)`, save.
4. Wait ~1 minute; site appears at `https://Felix313.github.io/my_portfolio_website/`.
5. (Optional) Custom domain: add `CNAME` file in root with your domain + configure DNS (A / ALIAS / CNAME records per GitHub docs).

## 🛠 Customize

Edit colors / spacing in `assets/css/style.css` under the `:root` section.
Add/update projects in `assets/data/projects.json` (fields: title, description, tags, links).
Update social links & meta tags inside `index.html` head & footer sections.

## 📂 Structure

```
index.html
assets/
	css/style.css
	js/main.js
	data/projects.json
```

## ✅ Roadmap Ideas

- Add blog section (consider `/blog` folder or a static site generator later)
- Add GitHub Actions workflow to run HTML/CSS lint & deploy
- Add contact form via a serverless form service (e.g., Formspree / Netlify Forms)
- Add Open Graph preview image & analytics (e.g., Plausible)

## 🧪 Quick Local Dev Server (Optional)

Use Python or Node to serve (avoids CORS for JSON on some browsers):

```bash
python -m http.server 8000
```
or
```bash
npx serve .
```

Then browse: http://localhost:8000

## 🔒 Accessibility & Performance Tips

- Keep heading hierarchy logical (h1 → h2 → h3)
- Provide alt text for images / decorative images empty alt
- Use compressed images (WebP / AVIF) placed in `assets/img`
- Run Lighthouse in Chrome DevTools and iterate

## 🤝 Contributing (Personal Repo)

Primarily for your personal use, but feel free to open issues or PRs if you share this public.

---
Happy building! Tweak, brand, and make it yours. 🎨