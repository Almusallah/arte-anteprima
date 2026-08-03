# Officine Gặp — website

A redesign of [officinegap.com](https://officinegap.com) with the visual identity of
[palazzomonti.org](https://palazzomonti.org): warm near-black ink, hairline rules, a
neo-grotesque face, and a **scroll-driven horizontal section** mixed with vertical
"windows".

Built as a **plain static site** (HTML + CSS + JS) so it can be hosted anywhere and the
domain migration is painless. No framework lock-in.

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Smooth scroll | [Lenis](https://github.com/darkroomengineering/lenis) | modern successor to Locomotive (what Palazzo uses) |
| Horizontal pin + reveals | [GSAP](https://gsap.com) + ScrollTrigger | the pinned `#projects` track |
| Text reveals | [Splitting.js](https://splitting.js.org) | per-character rise |
| Type | self-hosted **Hanken Grotesk** (variable) | free stand-in for **Aeonik** → see below |

Libraries load from CDN, so the site runs even with no build step.

## Run locally

```bash
npm install      # installs Vite (dev server only)
npm run dev      # http://localhost:5173
npm run build    # → dist/  (static, deploy anywhere)
```

No Node? The site is static — `python3 -m http.server` from this folder works too.

## Structure

```
index.html          # all sections & content
css/
  fonts.css         # @font-face (latin / latin-ext / vietnamese)
  style.css         # design tokens + every section
js/main.js          # loader, Lenis, horizontal pin, reveals, clocks, cursor
fonts/              # self-hosted woff2 (3 subsets)
assets/             # drop project images here
```

## Editing content

- **Text & sections** live directly in `index.html` (clearly grouped with comments).
- **Project images:** the project panels currently use styled grey placeholders. Drop
  real images in `assets/` and replace each `.project__media` block with an `<img>`.
- **Email:** `hello@officinegap.com` is a **placeholder** — search the codebase and set
  the real address (marked with a `TODO` in `index.html`).

## Swapping in licensed Aeonik

The whole site reads one variable: `--font-sans` in `css/style.css`. To use the real
Aeonik once licensed:

1. Add `Aeonik.woff2` to `fonts/` and an `@font-face { font-family:"Brand Sans"; ... }`
   block in `css/fonts.css` (keep the family name `Brand Sans`).
2. Done — nothing else references the font directly.

## Colours (from Palazzo Monti)

- Ink `#181314` · Grey `#9D9D9D` · Hairline `rgba(24,19,20,.14)` · BG `#ffffff`

## Hosting & domain migration (next step)

Recommended, in order of ease:

1. **Cloudflare Pages / Netlify / Vercel** — connect a Git repo (or drag-drop `dist/`).
   Free TLS, global CDN. Then point `officinegap.com` DNS at it:
   - Netlify/Vercel: add the domain in the dashboard, set the nameservers or the
     `A`/`CNAME` records they give you.
   - Cloudflare Pages: move the domain's nameservers to Cloudflare, add a custom domain.
2. **Any VPS / shared host** — upload the contents of `dist/` (or this folder) to the
   web root. It's static; Apache/Nginx serve it as-is.

The current site is on **Cargo Collective**; migrating means (a) deploying this build,
(b) repointing DNS, (c) lowering DNS TTL beforehand for a fast cutover. We'll do this
together once the content is signed off.

---
*Content sourced from the current Officine Gặp site; most copy is intended to change.*
