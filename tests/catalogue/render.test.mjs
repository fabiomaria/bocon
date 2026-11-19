import test from 'node:test';
import assert from 'node:assert/strict';

import { publicCatalogue } from '../../catalogue/project.mjs';
import { productPath, categoryPath, buildRoutes } from '../../catalogue/routes.mjs';
import { renderProduct, renderCategory } from '../../catalogue/render.mjs';
import { validCatalogue, simulatedNewEquipmentProduct } from './fixtures.mjs';

const ORIGIN = 'https://fabiomaria.github.io';
const BASE_PATH = '/bocon';

function fullPublicCatalogue() {
  const raw = validCatalogue();
  const equip = simulatedNewEquipmentProduct();
  raw.categories.push({
    id: 'syn-cat-equipment',
    kind: 'equipment',
    locales: {
      en: {
        slug: 'synthetic-equipment',
        title: 'Synthetic Test Equipment',
        intro: 'Synthetic bench test equipment category.',
        reviewStatus: 'reviewed',
      },
      de: {
        slug: 'synthetische-pruefgeraete',
        title: 'Synthetische Pruefgeraete',
        intro: 'Synthetische Pruefgeraetekategorie.',
        reviewStatus: 'reviewed',
      },
    },
    orderedProductIds: [equip.id],
  });
  equip.categoryId = 'syn-cat-equipment';
  raw.products.push(equip);
  return publicCatalogue(raw);
}

// ---------------------------------------------------------------------------
// 1. Route generation tests (catalogue/routes.mjs)
// ---------------------------------------------------------------------------

test('productPath generates locale-scoped paths from reviewed slug without stripping model suffixes', () => {
  const pub = fullPublicCatalogue();
  const probe = pub.products.find((p) => p.id === 'syn-probe-alpha');
  assert.equal(productPath(probe, 'en'), '/en/products/synthetic-immersion-probe.html');
  assert.equal(productPath(probe, 'de'), '/de/products/synthetischer-tauchfuehler.html');
});

test('productPath and categoryPath reject unknown locales and unavailable locales', () => {
  const pub = fullPublicCatalogue();
  const probe = pub.products[0];
  const cat = pub.categories[0];

  assert.throws(() => productPath(probe, 'fr'), (err) => err.code === 'UNKNOWN_LOCALE');
  assert.throws(() => categoryPath(cat, 'es'), (err) => err.code === 'UNKNOWN_LOCALE');

  const enOnly = structuredClone(probe);
  delete enOnly.locales.de;
  assert.throws(() => productPath(enOnly, 'de'), (err) => err.code === 'LOCALE_NOT_AVAILABLE');
});

test('buildRoutes supports /bocon basePath, preview subpaths, and reciprocal EN/DE identity mapping', () => {
  const pub = fullPublicCatalogue();
  const routes = buildRoutes(pub, { origin: ORIGIN, basePath: '/bocon/' });

  const enRoute = routes.products['syn-probe-alpha'].en;
  const deRoute = routes.products['syn-probe-alpha'].de;

  assert.equal(enRoute.href, '/bocon/en/products/synthetic-immersion-probe.html');
  assert.equal(enRoute.url, 'https://fabiomaria.github.io/bocon/en/products/synthetic-immersion-probe.html');
  assert.equal(deRoute.href, '/bocon/de/products/synthetischer-tauchfuehler.html');
  assert.equal(deRoute.url, 'https://fabiomaria.github.io/bocon/de/products/synthetischer-tauchfuehler.html');

  // Reciprocal alternates
  assert.equal(enRoute.alternates.en, enRoute.url);
  assert.equal(enRoute.alternates.de, deRoute.url);
  assert.equal(deRoute.alternates.en, enRoute.url);
  assert.equal(deRoute.alternates.de, deRoute.url);
  assert.equal(enRoute.alternateHrefs.de, deRoute.href);

  // Preview subpath
  const previewRoutes = buildRoutes(pub, { origin: ORIGIN, basePath: '/bocon/preview/' });
  assert.equal(
    previewRoutes.products['syn-probe-alpha'].en.href,
    '/bocon/preview/en/products/synthetic-immersion-probe.html',
  );
  assert.equal(
    previewRoutes.resolveAsset('v2/assets/tokens.css'),
    '/bocon/preview/v2/assets/tokens.css',
  );
});

test('buildRoutes rejects slug collisions with SLUG_COLLISION', () => {
  const pub = fullPublicCatalogue();
  pub.products[1].locales.en.slug = pub.products[0].locales.en.slug;

  assert.throws(
    () => buildRoutes(pub, { origin: ORIGIN, basePath: BASE_PATH }),
    (err) => err.code === 'SLUG_COLLISION',
  );
});

test('enquiryUrl encodes full manufacturer suffixes and locale without stripping characters', () => {
  const pub = fullPublicCatalogue();
  const routes = buildRoutes(pub, { origin: ORIGIN, basePath: BASE_PATH });
  const url = routes.enquiryUrl('de', {
    intent: 'quote',
    product: 'SYN-1101/51-5-1500+EX',
    variant: 'syn-var-1',
  });

  assert.ok(url.startsWith('/bocon/de/contact.html?'));
  const parsed = new URL(url, ORIGIN);
  assert.equal(parsed.searchParams.get('intent'), 'quote');
  assert.equal(parsed.searchParams.get('product'), 'SYN-1101/51-5-1500+EX');
  assert.equal(parsed.searchParams.get('variant'), 'syn-var-1');
  assert.equal(parsed.searchParams.get('locale'), 'de');
});

// ---------------------------------------------------------------------------
// 2. HTML escaping / XSS safety tests
// ---------------------------------------------------------------------------

test('renderProduct strictly HTML-escapes malicious synthetic titles, summaries, and specs', () => {
  const pub = fullPublicCatalogue();
  const probe = pub.products.find((p) => p.id === 'syn-probe-alpha');
  probe.locales.en.title = 'Malicious <script>alert(1)</script> Probe';
  probe.locales.en.seoTitle = 'SEO <script>alert(2)</script>';
  probe.locales.en.summary = 'Summary with " onload="alert(3)" & <b>tag</b>';
  probe.locales.en.applications = ['<img src=x onerror=alert(4)>'];
  probe.specs.push({
    key: 'xss_test',
    row: 'material',
    value: '<svg onload=alert(5)>',
    unit: null,
    conditions: { en: '<script>evil()</script>', de: 'safe' },
    configurationId: null,
  });

  const routes = buildRoutes(pub, { origin: ORIGIN, basePath: BASE_PATH });
  const html = renderProduct(probe, 'en', {
    categories: pub.categories,
    resources: pub.resources,
    routes,
  });

  assert.equal(html.includes('<script>alert(1)</script>'), false);
  assert.equal(html.includes('<script>alert(2)</script>'), false);
  assert.equal(html.includes('<img src=x onerror=alert(4)>'), false);
  assert.equal(html.includes('<svg onload=alert(5)>'), false);
  assert.equal(html.includes('<script>evil()</script>'), false);

  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(4)&gt;'));
  assert.ok(html.includes('&lt;svg onload=alert(5)&gt;'));
});

// ---------------------------------------------------------------------------
// 3. Probe layout, spec rows, variants, conditions, resources, locales
// ---------------------------------------------------------------------------

test('renderProduct renders Signal 4-block probe layout in EN and DE with locale-aware numbers', () => {
  const pub = fullPublicCatalogue();
  const probe = pub.products.find((p) => p.id === 'syn-probe-alpha');
  // Add a decimal spec and a zero numeric spec to verify formatting and zero preservation
  probe.specs.push(
    {
      key: 'tip_diameter',
      row: 'geometry',
      value: 3.7,
      unit: 'mm',
      conditions: null,
      configurationId: null,
    },
    {
      key: 'zero_offset',
      row: 'performance',
      value: 0,
      unit: '°C',
      conditions: { en: 'Reference zero point', de: 'Referenz-Nullpunkt' },
      configurationId: null,
    },
  );

  const routes = buildRoutes(pub, { origin: ORIGIN, basePath: BASE_PATH });

  const enHtml = renderProduct(probe, 'en', {
    categories: pub.categories,
    resources: pub.resources,
    routes,
  });
  const deHtml = renderProduct(probe, 'de', {
    categories: pub.categories,
    resources: pub.resources,
    routes,
  });

  // Shared Signal tokens & classes
  assert.ok(enHtml.includes('/bocon/v2/assets/tokens.css'));
  assert.ok(enHtml.includes('/bocon/v2/assets/site.css'));
  assert.ok(enHtml.includes('/bocon/assets/catalogue.css'));
  assert.ok(enHtml.includes('class="wrap hero product-hero compact-product-hero"'));
  assert.ok(enHtml.includes('class="spec-table"'));
  assert.ok(enHtml.includes('class="wiring-panel"'));
  assert.ok(enHtml.includes('class="wrap section-space compact-downloads"'));
  assert.ok(enHtml.includes('class="simple-product-contact"'));

  // Exact model codes preserved
  assert.ok(enHtml.includes('SYN-P100-A'));
  assert.ok(enHtml.includes('SYN-P100-B'));

  // Locale-aware number formatting & zero preservation
  assert.ok(enHtml.includes('3.7 mm'));
  assert.ok(deHtml.includes('3,7 mm'));
  assert.ok(enHtml.includes('-50 to 250 °C'));
  assert.ok(deHtml.includes('-50 bis 250 °C'));
  assert.ok(enHtml.includes('0 °C'));
  assert.ok(deHtml.includes('0 °C'));

  // Localized headings & conditions
  assert.ok(enHtml.includes('<html lang="en">'));
  assert.ok(enHtml.includes('Technical specifications'));
  assert.ok(enHtml.includes('Continuous operation in liquid'));
  assert.ok(deHtml.includes('<html lang="de">'));
  assert.ok(deHtml.includes('Technische Daten'));
  assert.ok(deHtml.includes('Dauerbetrieb in Fluessigkeit'));
});

test('renderProduct omits empty optional rows but explicitly renders null unknown rows with conditions', () => {
  const pub = fullPublicCatalogue();
  const probe = pub.products.find((p) => p.id === 'syn-probe-alpha');
  const routes = buildRoutes(pub, { origin: ORIGIN, basePath: BASE_PATH });

  const enHtml = renderProduct(probe, 'en', {
    categories: pub.categories,
    resources: pub.resources,
    routes,
  });

  // Optional rows with zero facts on syn-probe-alpha: connection, leads, elementAccuracy
  assert.equal(enHtml.includes('<th scope="row">Process Connection</th>'), false);
  assert.equal(enHtml.includes('<th scope="row">Lead Wire &amp; Termination</th>'), false);

  // Explicit null value (response_time_t90 in performance row) MUST render with explicit unknown label & condition
  assert.ok(enHtml.includes('<th scope="row">Performance &amp; Electrical</th>'));
  assert.ok(enHtml.includes('spec-unknown'));
  assert.ok(enHtml.includes('Unknown — pending synthetic lab test'));
});

test('renderProduct renders labelled individual variant enquiry links without JS and preserves variant distinctions', () => {
  const pub = fullPublicCatalogue();
  const probe = pub.products.find((p) => p.id === 'syn-probe-alpha');
  const routes = buildRoutes(pub, { origin: ORIGIN, basePath: BASE_PATH });

  const enHtml = renderProduct(probe, 'en', {
    categories: pub.categories,
    resources: pub.resources,
    routes,
  });

  // Inline variant distinctions in spec table
  assert.ok(enHtml.includes('<strong>SYN-P100-A:</strong>'));
  assert.ok(enHtml.includes('<strong>SYN-P100-B:</strong>'));
  assert.ok(enHtml.includes('IP65'));
  assert.ok(enHtml.includes('IP67'));

  // Individual variant enquiry links carrying exact modelCode and locale
  assert.ok(enHtml.includes('product=SYN-P100-A'));
  assert.ok(enHtml.includes('product=SYN-P100-B'));
  assert.ok(enHtml.includes('variant=syn-probe-alpha-a'));
  assert.ok(enHtml.includes('variant=syn-probe-alpha-b'));
  assert.ok(enHtml.includes('locale=en'));
});

test('renderProduct renders real resource language/revision labels and request-only badges without broken download hrefs', () => {
  const pub = fullPublicCatalogue();
  const probe = pub.products.find((p) => p.id === 'syn-probe-alpha');
  const routes = buildRoutes(pub, { origin: ORIGIN, basePath: BASE_PATH });

  const enHtml = renderProduct(probe, 'en', {
    categories: pub.categories,
    resources: pub.resources,
    routes,
  });

  // Public resource has download href, language label, revision
  assert.ok(enHtml.includes('href="/bocon/documents/syn-catalogue-datasheet-en.pdf"'));
  assert.ok(enHtml.includes('Rev 1.0'));
  assert.ok(enHtml.includes('EN'));

  // Request-only resource has request-only badge, language label, certificate scope, and enquiry link — NO download link to null or private path
  assert.ok(enHtml.includes('Request only'));
  assert.ok(enHtml.includes('2026-Q1'));
  assert.ok(enHtml.includes('EN / DE'));
  assert.ok(enHtml.includes('Synthetic Certification Body'));
  assert.equal(enHtml.includes('PRIVATE_SOURCE_DIR'), false);
  assert.equal(enHtml.includes('href="null"'), false);
  assert.ok(enHtml.includes('resource=syn-res-request-cert'));
});

test('renderProduct handles noindex flag and unavailable locale equivalents honestly', () => {
  const raw = validCatalogue();
  // Make German review stale so only EN is projected
  raw.products[0].locales.de.reviewedTechnicalRevision = 'obsolete';
  const pub = publicCatalogue(raw);
  const probe = pub.products.find((p) => p.id === 'syn-probe-alpha');
  const routes = buildRoutes(pub, { origin: ORIGIN, basePath: BASE_PATH });

  const previewHtml = renderProduct(probe, 'en', {
    categories: pub.categories,
    resources: pub.resources,
    routes,
    noindex: true,
  });

  assert.ok(previewHtml.includes('<meta name="robots" content="noindex, nofollow">'));
  assert.ok(previewHtml.includes('hreflang="en"'));
  assert.equal(previewHtml.includes('hreflang="de"'), false);
  assert.ok(previewHtml.includes('lang-unavailable'));

  const indexableHtml = renderProduct(probe, 'en', {
    categories: pub.categories,
    resources: pub.resources,
    routes,
    noindex: false,
  });
  assert.equal(indexableHtml.includes('noindex'), false);
});

// ---------------------------------------------------------------------------
// 4. All 3 product kinds (probe, element, equipment) in EN & DE
// ---------------------------------------------------------------------------

test('renderProduct renders element and equipment kinds in EN and DE without wiring panel when none verified', () => {
  const pub = fullPublicCatalogue();
  const routes = buildRoutes(pub, { origin: ORIGIN, basePath: BASE_PATH });

  const element = pub.products.find((p) => p.id === 'syn-element-beta');
  const equipment = pub.products.find((p) => p.id === 'syn-equip-gamma');

  for (const locale of ['en', 'de']) {
    const elHtml = renderProduct(element, locale, {
      categories: pub.categories,
      resources: pub.resources,
      routes,
    });
    assert.ok(elHtml.includes('data-product-kind="element"'));
    assert.ok(elHtml.includes('spec-layout-single'));
    assert.equal(elHtml.includes('class="wiring-panel"'), false);
    assert.ok(elHtml.includes('SYN-E200-100'));
    assert.ok(elHtml.includes('SYN-E200-1000'));

    const eqHtml = renderProduct(equipment, locale, {
      categories: pub.categories,
      resources: pub.resources,
      routes,
    });
    assert.ok(eqHtml.includes('data-product-kind="equipment"'));
    assert.ok(eqHtml.includes('spec-layout-single'));
    assert.equal(eqHtml.includes('class="wiring-panel"'), false);
    assert.ok(eqHtml.includes('product-stage-empty'));
    assert.ok(eqHtml.includes('230 V AC'));
  }
});

// ---------------------------------------------------------------------------
// 5. Category rendering tests
// ---------------------------------------------------------------------------

test('renderCategory renders EN and DE category views with product cards, compare table, and honest empty state', () => {
  const pub = fullPublicCatalogue();
  const routes = buildRoutes(pub, { origin: ORIGIN, basePath: BASE_PATH });
  const probeCat = pub.categories.find((c) => c.id === 'syn-cat-probes');

  const enHtml = renderCategory(probeCat, 'en', {
    products: pub.products,
    routes,
  });
  const deHtml = renderCategory(probeCat, 'de', {
    products: pub.products,
    routes,
    noindex: true,
  });

  assert.ok(enHtml.includes('<html lang="en">'));
  assert.ok(enHtml.includes('Synthetic Temperature Probes'));
  assert.ok(enHtml.includes('class="product-grid"'));
  assert.ok(enHtml.includes('class="compare-table"'));
  assert.ok(enHtml.includes('/bocon/en/products/synthetic-immersion-probe.html'));
  assert.ok(enHtml.includes('hreflang="de"'));

  assert.ok(deHtml.includes('<html lang="de">'));
  assert.ok(deHtml.includes('Synthetische Temperaturfuehler'));
  assert.ok(deHtml.includes('<meta name="robots" content="noindex, nofollow">'));
  assert.ok(deHtml.includes('/bocon/de/products/synthetischer-tauchfuehler.html'));

  // Empty category state
  const emptyCat = structuredClone(probeCat);
  emptyCat.orderedProductIds = [];
  const emptyHtml = renderCategory(emptyCat, 'en', {
    products: pub.products,
    routes,
  });
  assert.ok(emptyHtml.includes('placeholder-note'));
});
