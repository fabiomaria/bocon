# Compact Content Contract

Status: Active contract for Task 2 (`BOC-004.2`).
Scope: Defines the canonical record shapes, validation rules, and public projection allowlist shared by file-backed catalogue inputs and any future Sanity CMS adapter.

All examples in this document are **strictly synthetic** and must never be treated as real Bocon specifications.

---

## 1. Design Principles

1. **Compact reusable types**: Only three catalogue collections exist — `Product`, `Category`, and `Resource`. Never create document types per model, category, or language.
2. **Stable internal identity**: Every record carries an immutable `id` independent of manufacturer model strings or localized slugs. Full manufacturer model codes are always preserved verbatim.
3. **Structured technical facts**: Numeric values carry explicit units, bounds, and operating/test conditions. Translations carry editorial copy and localized labels without duplicating numeric values.
4. **Explicit unknown vs absent optional row**:
   - **`value: null`** represents an **explicit unknown** (a tracked gap in source evidence). It is distinct from numeric `0` and distinct from omitting a row.
   - **Absent optional row**: When a spec row has no applicable facts for a product, no `SpecFact` entries are added for that row; public renderers omit the empty optional row rather than inventing placeholder text.
5. **Configuration and variant scoping**:
   - Variants belonging to the same true family are embedded in `product.variants[]`, each with a stable `id` and exact `modelCode`.
   - Shared facts live in `product.specs[]` with `configurationId: null` and apply to every variant only when reviewed as valid for all variants.
   - Variant-specific or configuration-dependent facts either live in `variant.specs[]` or carry a non-null `configurationId` referencing a valid `variant.id` on that product.
   - Distinct products (for example, industrial vs heat-meter designs that happen to share a base family prefix) MUST remain separate `Product` records with distinct `id`s and locale `slug`s.
6. **Structural errors vs publication eligibility**:
   - **Structural errors** (broken references, duplicate IDs or routes, invalid ranges, missing `evidenceId`, unsafe or illegal `publicPath`) fail validation in `validateCatalogue(input)` and cause `publicCatalogue(input)` to throw.
   - **Ineligible review states** (`draft`, `withdrawn`, `blocked`, stale `reviewedTechnicalRevision`, unapproved images/resources) are structurally valid. `publicCatalogue(input)` excludes them from public output and records structured exclusion reasons.
7. **Strict public allowlist**: `publicCatalogue(input)` constructs public objects field-by-field from an explicit allowlist. Private provenance, review notes, `evidenceId`, and `privateSource` metadata are never spread into public output.

---

## 2. Canonical Spec Row Keys

Every `SpecFact.row` MUST be one of the nine canonical row identifiers:

| Row key | Purpose |
| --- | --- |
| `applications` | Verified operating contexts and media |
| `elementAccuracy` | Sensing element type, tolerance class, calibration standard |
| `range` | Measuring or operating range bounds |
| `material` | Wetted, sheath, housing, or substrate materials |
| `geometry` | Dimensions, diameters, lengths, form factors |
| `connection` | Process connections, threads, flanges, mounting |
| `leads` | Cable, termination, connector, and lead configuration |
| `performance` | Response time, electrical, thermal, or test performance |
| `protection` | Ingress protection, pressure, or environmental ratings |

---

## 3. Record Shapes

### 3.1 Top-Level Input

```json
{
  "products": [],
  "categories": [],
  "resources": []
}
```

### 3.2 Product

| Field | Type | Required | Publicly Projected | Notes |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | Yes | Stable internal ID, unique across `products`. |
| `modelCodes` | `string[]` | Yes | Yes | Non-empty array of exact full manufacturer model codes. |
| `kind` | `'probe' \| 'element' \| 'equipment'` | Yes | Yes | Selects shared template family. |
| `categoryId` | `string` | Yes | Yes | Must reference an existing `category.id`. |
| `technicalRevision` | `string` | Yes | Yes | Current reviewed technical revision token (e.g. `"2026-01"`). |
| `locales` | `{ en?: ProductLocale, de?: ProductLocale }` | Yes | Eligible only | At least one locale present. |
| `images` | `ProductImage[]` | Yes | Approved only | May be empty. |
| `specs` | `SpecFact[]` | Yes | Allowlisted fields | Shared facts (`configurationId: null`) or product-level scoped facts. |
| `variants` | `ProductVariant[]` | Yes | Yes | Embedded family variants. |
| `resourceIds` | `string[]` | Yes | Approved only | Each must reference an existing `resource.id`. |
| `publicationStatus` | `'draft' \| 'reviewed' \| 'withdrawn'` | Yes | No | Only `'reviewed'` products are eligible for public output. |
| `review` | `object` | No | **Never** | Private review workflow metadata. |
| `provenance` | `object` | No | **Never** | Private source/evidence references. |

#### ProductLocale (`locales.en` / `locales.de`)

| Field | Type | Required | Publicly Projected | Notes |
| --- | --- | --- | --- | --- |
| `slug` | `string` | Yes | Yes | Lowercase URL segment (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), unique per locale across products. |
| `title` | `string` | Yes | Yes | Reviewed localized product title. |
| `summary` | `string` | Yes | Yes | Concise localized purpose/summary. |
| `applications` | `string[]` | Yes | Yes | Localized verified application statements. |
| `seoTitle` | `string` | Yes | Yes | Localized page `<title>`. |
| `seoDescription` | `string` | Yes | Yes | Localized meta description. |
| `reviewedTechnicalRevision` | `string \| null` | Yes | No | Must equal `product.technicalRevision` for locale eligibility. |
| `reviewStatus` | `'draft' \| 'reviewed' \| 'blocked'` | Yes | No | Must be `'reviewed'` for locale eligibility. |

#### ProductImage

| Field | Type | Required | Publicly Projected | Notes |
| --- | --- | --- | --- | --- |
| `publicPath` | `string` | Yes | Yes | Safe relative public path (no leading `/`, no `..`, no scheme). |
| `alt` | `{ en?: string, de?: string }` | Yes | Yes | Localized alt text. |
| `variantId` | `string \| null` | Yes | Yes | If non-null, must match a `variant.id` on the same product. |
| `approvalStatus` | `'draft' \| 'approved' \| 'rejected'` | Yes | No | Only `'approved'` images enter public output. |

#### ProductVariant

| Field | Type | Required | Publicly Projected | Notes |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | Yes | Stable variant ID, unique within `product.variants`. |
| `modelCode` | `string` | Yes | Yes | Exact full manufacturer model code, unique within `product.variants`. |
| `specs` | `SpecFact[]` | Yes | Allowlisted fields | Variant-specific overrides or dependent option facts. |
| `wiringPresetIds` | `string[]` | Yes | Yes | Verified applicable wiring preset identifiers. |

### 3.3 SpecFact

| Field | Type | Required | Publicly Projected | Notes |
| --- | --- | --- | --- | --- |
| `key` | `string` | Yes | Yes | Machine-readable fact key (e.g. `"measuring_range"`). |
| `row` | `SpecRow` | Yes | Yes | One of the nine canonical row keys. |
| `value` | `string \| number \| { min: number, max: number } \| { en: string, de: string } \| null` | Yes | Yes | `null` = explicit unknown; `{ min, max }` requires finite numbers with `min <= max`; `{ en, de }` for text facts needing translation. |
| `unit` | `string \| null` | Yes | Yes | Physical unit (e.g. `"°C"`, `"mm"`) or `null`. |
| `conditions` | `{ en: string \| null, de: string \| null } \| null` | Yes | Yes | Operating or test conditions, preserved verbatim in public projection. |
| `configurationId` | `string \| null` | Yes | Yes | `null` for shared facts; non-null must match a `variant.id` on the owning product. |
| `label` | `{ en: string, de: string }` | No | Yes (if present) | Optional localized display label for the fact. |
| `evidenceId` | `string` | Yes | **Never** | Required non-empty reference to private claim evidence. Stripped from public output. |

### 3.4 Category

| Field | Type | Required | Publicly Projected | Notes |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | Yes | Stable category ID, unique across `categories`. |
| `kind` | `'probe' \| 'element' \| 'equipment' \| 'mixed'` | Yes | Yes | Category template/grouping kind. |
| `locales` | `{ en?: CategoryLocale, de?: CategoryLocale }` | Yes | Eligible only | Each locale has `{ title, intro, reviewStatus, slug? }`. |
| `orderedProductIds` | `string[]` | Yes | Filtered to public products | Each must reference an existing `product.id`; no duplicates. |

### 3.5 Resource

| Field | Type | Required | Publicly Projected | Notes |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | Yes | Stable resource ID, unique across `resources`. |
| `type` | `'datasheet' \| 'brochure' \| 'manual' \| 'certificate' \| 'drawing' \| 'declaration'` | Yes | Yes | Document classification. |
| `language` | `string` | Yes | Yes | Actual document language code (e.g. `"en"`, `"de"`, `"en-zh"`). Never fabricated. |
| `revision` | `string` | Yes | Yes | Document revision identifier. |
| `access` | `'public' \| 'request-only'` | Yes | Yes | Determines whether a public download path is permitted. |
| `approved` | `boolean` | Yes | No | Only `approved: true` resources enter public output. |
| `publicPath` | `string \| null` | Yes | Yes | MUST be `null` when `access === 'request-only'`. MUST be a safe relative path when `access === 'public'` and `approved === true`. |
| `productIds` | `string[]` | Yes | Filtered to public products | Each must reference an existing `product.id`. |
| `variantIds` | `string[]` | Yes | Yes | Each must reference an existing `variant.id`. |
| `certificateScope` | `{ issuer, holder, site, scope, validity } \| null` | Yes | Yes | Structured certificate metadata when `type === 'certificate'`, otherwise `null`. |
| `privateSource` | `object` | No | **Never** | Private file location or provenance metadata. Never projected. |

---

## 4. Eligibility Rules (Public Projection)

`publicCatalogue(input)` first runs `validateCatalogue(input)`. If `errors.length > 0`, it throws an `Error` with `err.errors = errors`.

Otherwise, it projects only eligible records and records exclusions in `excluded`:

1. **Product eligibility**:
   - Excluded if `publicationStatus !== 'reviewed'` (`PRODUCT_DRAFT` or `PRODUCT_WITHDRAWN`).
   - Each locale (`en`, `de`) is included only when `locale.reviewStatus === 'reviewed'` AND `locale.reviewedTechnicalRevision === product.technicalRevision`. Otherwise excluded (`LOCALE_NOT_REVIEWED` or `LOCALE_REVISION_STALE`).
   - If a product has no eligible locales left, the product itself is excluded (`NO_ELIGIBLE_LOCALES`).
   - Images are included only when `approvalStatus === 'approved'` (`IMAGE_NOT_APPROVED`).
   - `resourceIds` is filtered to resources that survived public projection.
2. **Category eligibility**:
   - Each locale is included only when `locale.reviewStatus === 'reviewed'` (`CATEGORY_LOCALE_NOT_REVIEWED`).
   - If no eligible locales remain, the category is excluded (`NO_ELIGIBLE_LOCALES`).
   - `orderedProductIds` is filtered to projected public product IDs.
3. **Resource eligibility**:
   - Included only when `approved === true` (`RESOURCE_NOT_APPROVED`).
   - `productIds` is filtered to projected public product IDs.

---

## 5. Synthetic JSON Example

```json
{
  "categories": [
    {
      "id": "syn-cat-probes",
      "kind": "probe",
      "locales": {
        "en": {
          "slug": "synthetic-probes",
          "title": "Synthetic Temperature Probes",
          "intro": "Synthetic probe family for contract verification.",
          "reviewStatus": "reviewed"
        },
        "de": {
          "slug": "synthetische-fuehler",
          "title": "Synthetische Temperaturfuehler",
          "intro": "Synthetische Fuehlerfamilie zur Vertragspruefung.",
          "reviewStatus": "reviewed"
        }
      },
      "orderedProductIds": ["syn-probe-01"]
    }
  ],
  "products": [
    {
      "id": "syn-probe-01",
      "modelCodes": ["SYN-P100-A", "SYN-P100-B"],
      "kind": "probe",
      "categoryId": "syn-cat-probes",
      "technicalRevision": "2026-01",
      "publicationStatus": "reviewed",
      "locales": {
        "en": {
          "slug": "synthetic-immersion-probe",
          "title": "Synthetic Immersion Probe SYN-P100",
          "summary": "Synthetic immersion temperature probe with two sheath variants.",
          "applications": ["Synthetic liquid bath testing"],
          "seoTitle": "Synthetic Immersion Probe SYN-P100",
          "seoDescription": "Synthetic immersion probe for contract tests.",
          "reviewedTechnicalRevision": "2026-01",
          "reviewStatus": "reviewed"
        },
        "de": {
          "slug": "synthetischer-tauchfuehler",
          "title": "Synthetischer Tauchfuehler SYN-P100",
          "summary": "Synthetischer Tauchtemperaturfuehler mit zwei Schutzrohrvarianten.",
          "applications": ["Synthetische Fluessigkeitspruefung"],
          "seoTitle": "Synthetischer Tauchfuehler SYN-P100",
          "seoDescription": "Synthetischer Tauchfuehler fuer Vertragstests.",
          "reviewedTechnicalRevision": "2026-01",
          "reviewStatus": "reviewed"
        }
      },
      "images": [
        {
          "publicPath": "assets/products/syn-p100-main.jpg",
          "alt": {
            "en": "Synthetic probe SYN-P100",
            "de": "Synthetischer Fuehler SYN-P100"
          },
          "variantId": null,
          "approvalStatus": "approved"
        }
      ],
      "specs": [
        {
          "key": "measuring_range",
          "row": "range",
          "value": { "min": -50, "max": 250 },
          "unit": "°C",
          "conditions": { "en": "Continuous operation", "de": "Dauerbetrieb" },
          "configurationId": null,
          "evidenceId": "SYN-EV-001"
        },
        {
          "key": "response_time_t90",
          "row": "performance",
          "value": null,
          "unit": "s",
          "conditions": { "en": "Pending lab verification", "de": "Laborpruefung ausstehend" },
          "configurationId": null,
          "evidenceId": "SYN-EV-002"
        }
      ],
      "variants": [
        {
          "id": "syn-probe-01-a",
          "modelCode": "SYN-P100-A",
          "specs": [
            {
              "key": "sheath_diameter",
              "row": "geometry",
              "value": 6,
              "unit": "mm",
              "conditions": null,
              "configurationId": "syn-probe-01-a",
              "evidenceId": "SYN-EV-003"
            }
          ],
          "wiringPresetIds": ["2-wire", "3-wire"]
        },
        {
          "id": "syn-probe-01-b",
          "modelCode": "SYN-P100-B",
          "specs": [
            {
              "key": "sheath_diameter",
              "row": "geometry",
              "value": 8,
              "unit": "mm",
              "conditions": null,
              "configurationId": "syn-probe-01-b",
              "evidenceId": "SYN-EV-004"
            }
          ],
          "wiringPresetIds": ["4-wire"]
        }
      ],
      "resourceIds": ["syn-res-ds-01"],
      "review": {
        "reviewer": "synthetic-reviewer",
        "notes": "Private review note"
      },
      "provenance": {
        "sourceRef": "SYNTHETIC_INTERNAL_ONLY"
      }
    }
  ],
  "resources": [
    {
      "id": "syn-res-ds-01",
      "type": "datasheet",
      "language": "en",
      "revision": "Rev 1.0",
      "access": "public",
      "approved": true,
      "publicPath": "documents/syn-p100-en-r1.pdf",
      "productIds": ["syn-probe-01"],
      "variantIds": ["syn-probe-01-a", "syn-probe-01-b"],
      "certificateScope": null,
      "privateSource": {
        "path": "SYNTHETIC_PRIVATE_DIR/syn-p100.pdf"
      }
    }
  ]
}
```
