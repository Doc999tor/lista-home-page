# Lista CRM — SEO pillar pages (V1) design

**Date:** 2026-04-10  
**Status:** Draft for review  
**Scope:** Static Hebrew RTL HTML pages for search engines and AI crawlers, alongside the existing marketing site.

## Goals

- Publish **seven content-rich pillar pages** that explain Lista CRM’s core product areas in depth, with clear headings and internal linking.
- Improve **discoverability** via `public/sitemap.xml` (and internal links between pillar pages; **no changes** to `public/index.html` in V1).
- Keep **deployment simple**: static files under `public/`, served by existing nginx rules for `/public/`.
- Align **visual language** with [lista-crm.com](https://lista-crm.com/) using a **hybrid** layout: Lista colors and CTA styling, simplified hero, article-first body.

## Non-goals (V1)

- Editing or restructuring `public/index.html`.
- Clean URLs without the `public/` path segment (no new nginx location blocks required for V1).
- Build-time templating, SSR, or a CMS.
- Industry/persona landing pages (that was deferred; V1 is **product pillars only**).

## Constraints and assumptions

- **Locale:** `lang="he-IL"`, `dir="rtl"` on all pillar pages.
- **URLs:** `https://lista-crm.com/public/seo/<slug>.html` (ASCII kebab-case slugs; Hebrew in titles and body).
- **Sitemap:** New URLs are added to `public/sitemap.xml` before or with launch of the pages.
- **robots:** `public/robots.txt` remains valid; no blocking of `/public/seo/`.
- **Forms:** Pillar pages link to existing destinations (`/`, `public/pricing.html`, `public/contact_us.html`); no new server endpoints.

## Information architecture — V1 files

All files live under `public/seo/`. Recommended slugs:

| # | File | Primary intent |
|---|------|----------------|
| 1 | `online-booking.html` | Self-service booking; clients see only free slots (calendar privacy). |
| 2 | `sms-reminders.html` | SMS for confirmations, changes, day-before reminders. |
| 3 | `client-crm.html` | Client card, history, debts, quotes, documentation fields, photos where relevant. |
| 4 | `series-and-memberships.html` | Series, treatments, packages, memberships, utilization. |
| 5 | `vip-club.html` | Loyalty / VIP club, segmentation, blocking no-shows or problematic self-booking (described factually). |
| 6 | `facebook-leads.html` | Link-based capture; clients complete details (no overstated API claims). |
| 7 | `calendar-management.html` | Owner calendar, daily/weekly/monthly views, mobile-first scheduling (cross-link to `online-booking.html` to avoid duplicate copy). |

**Internal linking:** Each page includes a **related topics** nav (the other six pillars) plus links to pricing, contact, and homepage as appropriate.

**Overlap policy:** Where booking and calendar pages share concepts, one short summary on one page and a **prominent link** to the other for detail (reduces thin/duplicate content).

## Page template (shared)

### Document structure

- Skip link to `#main`.
- **Header:** “Lista CRM” linking to `https://lista-crm.com/`; compact nav listing all seven pillar pages (same set on every page for crawl paths).
- **Main:** `<main id="main"><article>…</article></main>` with exactly one `<h1>`, a short lead, then `<h2>` / `<h3>` sections.
- **Footer:** Minimal consistent footer (copyright line; links to terms/privacy only if stable URLs are confirmed—may match existing site footer targets).

### Head / SEO (unique per page)

- `charset`, viewport.
- Unique `<title>` and `meta name="description"`.
- Canonical: `https://lista-crm.com/public/seo/<slug>.html`.
- Open Graph: `og:title`, `og:description`, `og:url`, `og:type`, `og:locale` (`he_IL`), `og:image` (reuse an existing approved site image if appropriate).
- Default index/follow unless a future policy requires otherwise.

### Structured data (JSON-LD)

- `WebPage` (or `Article`) with `name`, `description`, `url`, `inLanguage: "he-IL"`.
- `Organization` with `name`, `url`, `logo` (consistent across pages).
- `FAQPage` **only** where FAQs are accurate and stable; omit vague marketing FAQs.

### Assets

- **`public/seo/assets/seo.css`:** Typography, layout (max-width column), focus states, Lista-aligned palette (lavender page background; purple headlines; pink/magenta primary button echoing the live site). **No** full Elementor bundle.
- **Scripts:** None required for V1.
- **Images:** Optional; every image must have meaningful Hebrew `alt`. Prefer existing brand assets with clear rights.

## Visual direction — hybrid (locked)

Reference: live homepage at [lista-crm.com](https://lista-crm.com/) (lavender canvas, purple headline, pink CTA, RTL Hebrew).

- **Reuse:** Background tone, purple heading color, pink pill primary CTA, general sans-serif Hebrew feel, header/nav pattern (simplified).
- **Simplify vs homepage:** No heavy multi-phone hero collage on pillar pages; use **H1 + lead + single CTA row**, then **single-column article** content.
- **Goal:** Brand-consistent, crawler-friendly text hierarchy, faster than duplicating homepage chrome.

## Content and compliance guidelines

- **Concrete scenarios** over empty superlatives; avoid unverifiable claims (“best in Israel”, guaranteed revenue, medical outcomes).
- **Health/beauty:** Describe optional **record-keeping** fields; do not present Lista as a medical device or source of clinical advice.
- **SMS:** Emphasize **appointment-related** messages; avoid implying automatic compliance with all marketing/spam rules—optional brief note that businesses must follow applicable law and provider rules.
- **Facebook:** Describe **client completion via link**; no implied Meta endorsement or overstated API scope.
- **Privacy:** Describe product behavior (e.g. clients see available slots, not the full diary) without legal assertions beyond product fact.

## Sitemap

Add seven `<url>` entries to `public/sitemap.xml`:

- `loc`: `https://lista-crm.com/public/seo/<slug>.html`
- `changefreq`: `weekly` (or `monthly` if content is rarely updated)
- `priority`: `0.7`–`0.8` (similar band to pricing)
- `lastmod`: optional; if present, update when page content changes

## Verification checklist (before “done”)

- All seven URLs return 200 in the deployed environment.
- All internal links between pillars and to pricing/contact/home work.
- Unique title/description/canonical/OG URL per page; single logical `h1` per page.
- `public/sitemap.xml` lists all seven URLs.
- Quick accessibility pass: skip link, focus styles, heading order, image alts if images exist.
- Optional: Lighthouse spot-check on one page for regressions.

## Implementation notes (for a later plan; not executed in this doc)

- Create `public/seo/` and `public/seo/assets/seo.css`.
- Author seven HTML files following this template.
- Update `public/sitemap.xml`.
- No nginx changes required for V1 (paths under `/public/`).

## Defaults to resolve during implementation

- **`og:image`:** Use the same absolute image as the homepage unless marketing supplies a replacement, e.g. `https://lista-crm.com/public/assets/pic1.jpg` (verify file exists in `public/assets/` at deploy time).
- **Footer legal links:** Reuse the same targets as existing HTML pages (e.g. contact form privacy/terms URLs) for consistency.
- **Body copy:** Written during implementation; must follow the content and compliance rules in this spec.
