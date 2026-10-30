# Security Review (GitHub Pages static site)

Findings are ranked by severity.

## 1) Medium — Missing Content Security Policy (CSP)

- **Evidence:** No `Content-Security-Policy` meta tag found in page heads (for example `index.html:3-25`, `projects.html:3-19`, `articles.html:3-19`, `open-source.html:3-19`, `404.html:3-19`).
- **Risk:** If any future HTML/JS injection bug appears, lack of CSP increases blast radius (inline script execution, broader script/style sources).
- **Recommendation:** Add a restrictive CSP meta tag suitable for GitHub Pages, e.g. allow only `'self'` for scripts/styles by default, then explicitly allow required origins (currently Google Fonts and GitHub API). Prefer nonce/hash-based handling for inline scripts or move inline scripts to external files.

## 2) Low — Third-party origin dependency without integrity pinning strategy

- **Evidence:** External font resources are loaded from Google domains (`index.html:16-18`, `projects.html:10-12`, `articles.html:10-12`, `open-source.html:10-12`, `404.html:10-12`). GitHub API is fetched at runtime (`assets/js/main.js:322`).
- **Risk:** Remote dependency availability and supply-chain trust are required for rendering and metadata refresh.
- **Recommendation:** For this GitHub Pages site, prefer self-hosted fonts under `assets/` where possible. If keeping third-party resources, enforce them via CSP allowlists (`font-src`, `style-src`, `connect-src`). Note: SRI is generally practical for fixed external JS/CSS files but not reliable for Google Fonts CSS endpoints that can vary.

## 3) Low — Public personal contact data exposure

- **Evidence:** Email and phone are directly published (`index.html:536-537`) and email is repeated in footers (`index.html:570`, `projects.html:565`, `articles.html:118`, `open-source.html:505`).
- **Risk:** Increased scraping/spam/social-engineering surface.
- **Recommendation:** Consider obfuscating contact details (e.g., JS-rendered email, image/text splitting, or contact-only form flow) and rate-limit/rotate publicly exposed addresses if abuse occurs.

## 4) Informational — Repository hygiene observations

- **Evidence:** Public repository includes `.github/copilot-instructions.md` with internal workflow/process notes (`.github/copilot-instructions.md:3-4`). `.nojekyll` exists at root (`.nojekyll:1`).
- **Assessment:** No obvious secrets, editor temp files, or private notes were found at repository root. `.nojekyll` is expected for GitHub Pages static publishing.
- **Recommendation:** Keep `.github/` content limited to information intended to be public; move sensitive operational notes to private systems if needed.

---

## Category-by-category review outcomes

### 1. DOM XSS sinks (`innerHTML`, `insertAdjacentHTML`, `outerHTML`, `document.write`, similar)

- **Sinks reviewed:** `assets/js/main.js:152`, `assets/js/main.js:274`, `assets/js/fx.js:18`, `assets/js/fx.js:273`.
- **Outcome:** No direct DOM XSS path identified from untrusted input.
  - `main.js:152`, `main.js:274`, `fx.js:18`, `fx.js:273` inject static template strings.
  - GitHub API data is inserted with `textContent` (`main.js:279-287`, `main.js:301-306`) and repo name is URL-encoded for links (`main.js:288`).
  - No `document.write`/`outerHTML` usage was found in `assets/js/*.js` or inline scripts.

### 2. Links (`target="_blank"` without `rel="noopener"`; `javascript:` URLs)

- **Outcome:** No findings.
  - Spot checks across HTML pages show `target="_blank"` links include `rel="noopener"` (for example `index.html:452-523`, `projects.html:298-559`, `open-source.html:67-499`, `articles.html:97-103`).
  - No `javascript:` URLs found.

### 3. Third-party resources (fonts/scripts/styles) and SRI/CSP suitability

- **Outcome:** Findings reported above (Medium #1, Low #2).

### 4. Contact form (`mailto:` construction)

- **Evidence:** Mailto URL generation in `assets/js/main.js:237-247`.
- **Outcome:** No direct user-input injection found.
  - User fields are encoded via `encodeURIComponent` (`main.js:245-246`).
  - `data-mailto` is read from static markup (`index.html:541`), not from user input.

### 5. Personal data exposed on pages

- **Outcome:** Finding reported above (Low #3).

### 6. Repository hygiene/public file exposure

- **Outcome:** Informational observation reported above (Info #4); no clear secret-bearing files identified.
