# Bocon — Signal design MVP

English-first static HTML/CSS with local assets. No build step, framework, CMS, external fonts, or runtime network dependencies.

## Pages

- `index.html`: Signal homepage, portfolio overview, featured sensor and application.
- `tm1101-51.html`: compact family page for standard and fast-response TM1101 heat meter sensors, with a model selector and three technical-data tabs.
- `heat-metering.html`: heating/refrigeration application and selection guidance.
- `contact.html`: enquiry preparation; product and intent carry through from page links.

Open `index.html` directly, or run from the workspace root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory website/deploy
```

Then visit http://127.0.0.1:8765/.

## Content and assets

All product and application content is in HTML. Shared styles are in `assets/signal.css` (existing Signal design) and `assets/mvp.css` (detail-page extensions). `assets/site.js` handles mobile navigation and the dummy enquiry form. `assets/product.js` handles model selection and accessible technical-data tabs; all variant content is populated in HTML.

The original English brochure is at `documents/bocon-heat-meter-sensors-en.pdf`. Product photographs and the wiring diagram are extracted from its fourth PDF page, printed P5–P6. Full field provenance and known gaps are in `../docs/static-mvp-content.md`.

Enquiries are a dummy form for the design MVP. Submission only displays a local confirmation; nothing is stored or sent by the page.

## Review status

Local links/assets, fragment targets, IDs, image alternative text, heading presence, and JavaScript syntax checked. Browser/visual testing intentionally skipped at the user's request. Not deployed by this change.

`grid.html` remains the earlier alternative design. The original Signal homepage is preserved at `../archive/signal-homepage-before-mvp.html`. The original standalone product mockup remains unchanged.
