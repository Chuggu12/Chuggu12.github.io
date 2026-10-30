# Instructions for GitHub Copilot

This repository is Ankit Anand's personal CV website, served by GitHub Pages from `main` at https://chuggu12.github.io. Work here is coordinated by a lead reviewer (Claude Code), who reviews every pull request and runs automated browser checks before merging.

## Stack and structure

- Plain static HTML, CSS and JavaScript. No build step, no frameworks, no package manager, no new dependencies.
- Pages: `index.html`, `projects.html`, `articles.html`, `open-source.html`, `404.html`.
- Shared styles: `assets/css/style.css` (design tokens, layout) and `assets/css/fx.css` (interactive effects). Page styles: `assets/css/<page>.css`.
- Behaviour: `assets/js/main.js` (shared) and `assets/js/fx.js` (effects). Images: `assets/img/` (WebP).

## Standards

- Keep the existing look: use the CSS custom properties in `style.css` (`--navy`, `--slate`, `--green`, `--lime`, `--olive`, `--mint`, the `--f-*` font tokens) and the `data-anim` motion presets (`fade-expand`, `float-in`, `reveal-in`, `fade-in`).
- Every animation must respect `prefers-reduced-motion`. No horizontal scrolling at any width from 360 px to 1440 px.
- Accessible markup: real `<button>`/`<a>` elements, `alt` text on images, visible focus states, headings in order.
- Never invent CV facts, numbers, dates or links. Never add personal data (ID numbers, date of birth, family names, phone numbers beyond what is already on the site).
- 2-space indentation, lowercase-hyphen class names, short comments that explain why.
- Change only what the task needs; do not reformat or touch unrelated files. Explain in the pull request what you changed and how you checked it.
