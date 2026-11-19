# Sanity CMS Editor Mapping

Status: Interface mapping for Task 2 (`BOC-004.2`). This document describes how a future Sanity Studio maps editor collections and actions to the compact content contract defined in `catalogue/contract.md`. It does **not** deploy Sanity or instantiate live credentials.

---

## 1. Separation of Concerns

- **Catalogue content** uses exactly **three** compact document collections: `product`, `category`, and `resource`.
- **Enquiries / Leads (`BOC-002`)** remain a **separate private collection** behind a secure submission endpoint. Enquiry documents never enter the catalogue export, static build pipeline, or public repository.
- **No per-model, per-category, or per-language document types**: Adding a new ordinary sensor, sensing element, or test-equipment product is a single `product` document entry — never a schema change or new layout template.

---

## 2. Three Compact Catalogue Collections

### 2.1 `product`

A single Sanity document represents one reviewed product or true sensor family.

- **Identity group**:
  - `id` (immutable internal ID, generated once, independent of model strings)
  - `modelCodes[]` (exact full manufacturer model codes)
  - `kind` (`probe | element | equipment` — selects the shared renderer template)
  - `category` (reference to `category._id` → exported as `categoryId`)
  - `technicalRevision` (string, bumped when substantive technical facts change)
  - `publicationStatus` (`draft | reviewed | withdrawn`)
- **Bilingual Copy group** (grouped EN/DE tabs inside one document, not separate documents per language):
  - `locales.en` and `locales.de`: `{ slug, title, summary, applications[], seoTitle, seoDescription, reviewedTechnicalRevision, reviewStatus }`
  - Editors see EN and DE side-by-side; bumping `technicalRevision` automatically makes any locale whose `reviewedTechnicalRevision !== technicalRevision` ineligible for public projection until re-reviewed.
- **Technical Facts group**:
  - `specs[]` (array of `specFact` objects with `key`, `row` dropdown over the nine canonical row keys, typed `value`, `unit`, localized `conditions`, `configurationId: null`, and required private `evidenceId`).
- **Embedded Variants group**:
  - `variants[]` (embedded array of `productVariant` objects: `{ id, modelCode, specs[], wiringPresetIds[] }`).
  - Variants stay embedded in the parent `product` document so editors manage a family in one place without losing per-variant identities, model codes, or configuration-scoped specs.
  - Distinct product designs that happen to share a base prefix (such as industrial vs heat-meter designs) are entered as separate `product` documents with distinct `id`s and locale `slug`s.
- **Media & Resources group**:
  - `images[]` (Sanity image asset + `alt.{en,de}`, optional `variantId`, and `approvalStatus`).
  - `resources[]` (references to `resource._id` → exported as `resourceIds[]`).
- **Private Provenance & Review group** (Studio-only / private dataset; never exported to public JSON):
  - `review` (reviewer, timestamp, internal notes)
  - `provenance` (private source references, import hashes)

### 2.2 `category`

Maps directly to the 8+2 navigation structure without duplicating product specifications.

- `id` (stable category key)
- `kind` (`probe | element | equipment | mixed`)
- `locales.en` / `locales.de`: `{ slug, title, intro, reviewStatus }`
- `orderedProducts[]` (ordered references to `product._id` → exported as `orderedProductIds[]`)

### 2.3 `resource`

Manages datasheets, brochures, manuals, drawings, declarations, and certificates.

- `id` (stable resource key)
- `type` (`datasheet | brochure | manual | certificate | drawing | declaration`)
- `language` (actual document language code — never fabricated)
- `revision` (document revision string)
- `access` (`public | request-only`)
- `approved` (boolean publication gate)
- `publicFile` (Sanity file asset, permitted **only** when `access === 'public'`; exported as safe relative `publicPath` or `null` for `request-only`)
- `products[]` / `variantIds[]` (scoped applicability)
- `certificateScope` (optional object: `{ issuer, holder, site, scope, validity }`)
- `privateSource` (Studio-only private reference; never exported)

---

## 3. Editor Actions → Contract Pipeline

Every editor workflow maps deterministically to `validateCatalogue(input)` and `publicCatalogue(input)`:

| Editor action in Sanity Studio | Effect in exported contract JSON | Pipeline behaviour |
| --- | --- | --- |
| Add a new ordinary product | New `product` document with `publicationStatus: 'draft'` | Passes `validateCatalogue`; excluded from `publicCatalogue` (`PRODUCT_DRAFT`) until reviewed. No schema change needed. |
| Edit a shared numeric spec | Editor bumps `technicalRevision` (e.g. `2026-01` → `2026-02`) | Any locale still at `reviewedTechnicalRevision: '2026-01'` is automatically excluded (`LOCALE_REVISION_STALE`) until translation review catches up. |
| Approve English before German is ready | `locales.en.reviewStatus = 'reviewed'`, `locales.de.reviewStatus = 'draft'` | EN publishes cleanly; DE is excluded (`LOCALE_NOT_REVIEWED`) without blocking EN. |
| Add a variant override | Add entry to embedded `product.variants[]` with unique `id`, exact `modelCode`, and scoped `specs[]` | Preserved verbatim in public projection; shared facts remain single-source in `product.specs[]`. |
| Mark a certificate request-only | `access: 'request-only'`, `approved: true`, `publicPath: null` | Appears in public Downloads as request-only with scope metadata; validation rejects any accidental `publicPath`. |
| Withdraw a discontinued product | `publicationStatus: 'withdrawn'` | Excluded from `publicCatalogue` (`PRODUCT_WITHDRAWN`) and stripped from public category `orderedProductIds` and resource `productIds`. |
| Record internal review/source notes | Stored in `review`, `provenance`, `evidenceId`, `privateSource` | Stripped completely by the explicit field allowlist in `catalogue/project.mjs`. |

---

## 4. Export Adapter Contract

When a Sanity dataset is connected in a later task, the export adapter only needs to:

1. Query `product`, `category`, and `resource` documents via GROQ using a read token outside the public repo.
2. Normalize Sanity references (`_ref` → stable `id`) and approved public file assets into `{ products, categories, resources }`.
3. Pass the normalized payload into `validateCatalogue(input)` and `publicCatalogue(input)` — the exact same gate used by the file-backed static build.
