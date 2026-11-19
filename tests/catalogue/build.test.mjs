import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { validCatalogue, simulatedNewEquipmentProduct } from './fixtures.mjs';
import { buildCatalogue } from '../../catalogue/build.mjs';

const execFileAsync = promisify(execFile);
const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '../..');

async function makeTempDir(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

/**
 * Writes a synthetic source directory with categories.json, resources.json,
 * products/*.json, and stub public asset files referenced by the catalogue.
 */
async function writeSourceFixture(sourceDir, catalogue, { createAssets = true } = {}) {
  await fs.mkdir(path.join(sourceDir, 'products'), { recursive: true });
  await fs.writeFile(
    path.join(sourceDir, 'categories.json'),
    JSON.stringify(catalogue.categories, null, 2),
    'utf8',
  );
  await fs.writeFile(
    path.join(sourceDir, 'resources.json'),
    JSON.stringify(catalogue.resources, null, 2),
    'utf8',
  );
  for (const prod of catalogue.products) {
    await fs.writeFile(
      path.join(sourceDir, 'products', `${prod.id}.json`),
      JSON.stringify(prod, null, 2),
      'utf8',
    );
  }

  if (createAssets) {
    const assetPaths = new Set();
    for (const prod of catalogue.products) {
      for (const img of prod.images || []) {
        if (img.approvalStatus === 'approved' && img.publicPath) {
          assetPaths.add(img.publicPath);
        }
      }
    }
    for (const res of catalogue.resources) {
      if (res.approved === true && res.access === 'public' && res.publicPath) {
        assetPaths.add(res.publicPath);
      }
    }
    for (const rel of assetPaths) {
      const full = path.join(sourceDir, rel);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, `SYNTHETIC_ASSET:${rel}\n`, 'utf8');
    }
  }
}

async function readAllFiles(dir, base = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const map = new Map();
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await readAllFiles(full, base);
      for (const [k, v] of sub) map.set(k, v);
    } else {
      const rel = path.relative(base, full).split(path.sep).join('/');
      map.set(rel, await fs.readFile(full));
    }
  }
  return map;
}

test('buildCatalogue rejects outDir equal to or inside sourceDir', async () => {
  const sourceDir = await makeTempDir('bocon-src-same-');
  try {
    await writeSourceFixture(sourceDir, validCatalogue());

    await assert.rejects(
      () =>
        buildCatalogue({
          sourceDir,
          outDir: sourceDir,
          origin: 'https://fabiomaria.github.io',
          basePath: '/bocon',
        }),
      (err) => err.code === 'OUT_INSIDE_SOURCE',
    );

    await assert.rejects(
      () =>
        buildCatalogue({
          sourceDir,
          outDir: path.join(sourceDir, 'nested-out'),
          origin: 'https://fabiomaria.github.io',
          basePath: '/bocon',
        }),
      (err) => err.code === 'OUT_INSIDE_SOURCE',
    );
  } finally {
    await fs.rm(sourceDir, { recursive: true, force: true });
  }
});

test('buildCatalogue produces byte-for-byte deterministic output across two runs', async () => {
  const sourceDir = await makeTempDir('bocon-src-det-');
  const outDirA = await makeTempDir('bocon-out-det-a-');
  const outDirB = await makeTempDir('bocon-out-det-b-');

  try {
    await writeSourceFixture(sourceDir, validCatalogue());

    const resA = await buildCatalogue({
      sourceDir,
      outDir: outDirA,
      origin: 'https://fabiomaria.github.io',
      basePath: '/bocon',
    });
    const resB = await buildCatalogue({
      sourceDir,
      outDir: outDirB,
      origin: 'https://fabiomaria.github.io',
      basePath: '/bocon',
    });

    assert.deepEqual(resA.files, resB.files);
    assert.deepEqual(resA.errors, []);

    const filesA = await readAllFiles(outDirA);
    const filesB = await readAllFiles(outDirB);
    assert.deepEqual([...filesA.keys()].sort(), [...filesB.keys()].sort());
    for (const [rel, bufA] of filesA) {
      assert.equal(Buffer.compare(bufA, filesB.get(rel)), 0, `File mismatch for ${rel}`);
    }
  } finally {
    await fs.rm(sourceDir, { recursive: true, force: true });
    await fs.rm(outDirA, { recursive: true, force: true });
    await fs.rm(outDirB, { recursive: true, force: true });
  }
});

test('buildCatalogue rejects duplicate routes', async () => {
  const sourceDir = await makeTempDir('bocon-src-dup-');
  const outDir = await makeTempDir('bocon-out-dup-');

  try {
    const cat = validCatalogue();
    cat.products[1].locales.en.slug = cat.products[0].locales.en.slug;
    await writeSourceFixture(sourceDir, cat);

    await assert.rejects(
      () =>
        buildCatalogue({
          sourceDir,
          outDir,
          origin: 'https://fabiomaria.github.io',
          basePath: '/bocon',
        }),
      (err) => err.code === 'CATALOGUE_VALIDATION_FAILED' || err.code === 'SLUG_COLLISION',
    );
  } finally {
    await fs.rm(sourceDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('buildCatalogue preserves unrelated existing files in outDir', async () => {
  const sourceDir = await makeTempDir('bocon-src-preserve-');
  const outDir = await makeTempDir('bocon-out-preserve-');

  try {
    await writeSourceFixture(sourceDir, validCatalogue());
    const unrelatedFile = path.join(outDir, 'existing-unrelated.txt');
    const nestedUnrelated = path.join(outDir, 'custom-dir', 'keep.html');
    await fs.writeFile(unrelatedFile, 'KEEP_ME_SAFE', 'utf8');
    await fs.mkdir(path.dirname(nestedUnrelated), { recursive: true });
    await fs.writeFile(nestedUnrelated, '<p>Keep</p>', 'utf8');

    await buildCatalogue({
      sourceDir,
      outDir,
      origin: 'https://fabiomaria.github.io',
      basePath: '/bocon',
    });

    assert.equal(await fs.readFile(unrelatedFile, 'utf8'), 'KEEP_ME_SAFE');
    assert.equal(await fs.readFile(nestedUnrelated, 'utf8'), '<p>Keep</p>');
  } finally {
    await fs.rm(sourceDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('buildCatalogue fails with MISSING_PUBLIC_ASSET when a referenced public asset is missing', async () => {
  const sourceDir = await makeTempDir('bocon-src-missing-');
  const outDir = await makeTempDir('bocon-out-missing-');

  try {
    await writeSourceFixture(sourceDir, validCatalogue(), { createAssets: false });

    await assert.rejects(
      () =>
        buildCatalogue({
          sourceDir,
          outDir,
          origin: 'https://fabiomaria.github.io',
          basePath: '/bocon',
        }),
      (err) => err.code === 'MISSING_PUBLIC_ASSET',
    );
  } finally {
    await fs.rm(sourceDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('buildCatalogue excludes draft products and stale locales from HTML and sitemap, and leaks zero private markers', async () => {
  const sourceDir = await makeTempDir('bocon-src-priv-');
  const outDir = await makeTempDir('bocon-out-priv-');

  try {
    const cat = validCatalogue();
    // Make German locale on syn-probe-alpha stale
    cat.products[0].locales.de.reviewedTechnicalRevision = 'obsolete';
    // Add a draft equipment product
    const draftEquip = simulatedNewEquipmentProduct();
    draftEquip.publicationStatus = 'draft';
    cat.products.push(draftEquip);

    await writeSourceFixture(sourceDir, cat);

    const result = await buildCatalogue({
      sourceDir,
      outDir,
      origin: 'https://fabiomaria.github.io',
      basePath: '/bocon',
    });

    assert.ok(result.excluded.some((e) => e.id === 'syn-probe-alpha' && e.locale === 'de'));
    assert.ok(result.excluded.some((e) => e.id === 'syn-equip-gamma' && e.reason === 'PRODUCT_DRAFT'));

    // Stale DE product page and draft product page must NOT exist
    await assert.rejects(() =>
      fs.access(path.join(outDir, 'de/products/synthetischer-tauchfuehler.html')),
    );
    await assert.rejects(() =>
      fs.access(path.join(outDir, 'en/products/synthetic-response-tester.html')),
    );

    // Sitemap must exist, include eligible EN/DE URLs, and exclude stale/draft URLs
    const sitemap = await fs.readFile(path.join(outDir, 'sitemap-catalogue.xml'), 'utf8');
    assert.ok(sitemap.includes('https://fabiomaria.github.io/bocon/en/products/index.html'));
    assert.ok(sitemap.includes('https://fabiomaria.github.io/bocon/de/products/index.html'));
    assert.ok(sitemap.includes('https://fabiomaria.github.io/bocon/en/products/synthetic-immersion-probe.html'));
    assert.equal(sitemap.includes('synthetischer-tauchfuehler.html'), false);
    assert.equal(sitemap.includes('synthetic-response-tester.html'), false);

    // Scan all generated text files for private markers
    const allFiles = await readAllFiles(outDir);
    const forbiddenMarkers = [
      'PRIVATE_ARCHIVE_MARKER',
      'PRIVATE_SOURCE_DIR',
      'INTERNAL_REVIEW_NOTE_DO_NOT_PUBLISH',
      'SYN-EV-101',
      'SYN-EV-201',
    ];
    for (const [rel, buf] of allFiles) {
      if (!rel.endsWith('.html') && !rel.endsWith('.xml') && !rel.endsWith('.js')) continue;
      const text = buf.toString('utf8');
      for (const marker of forbiddenMarkers) {
        assert.equal(text.includes(marker), false, `Private marker "${marker}" leaked into ${rel}`);
      }
    }
  } finally {
    await fs.rm(sourceDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('buildCatalogue with noindex injects noindex meta tag on all HTML pages and omits sitemap-catalogue.xml', async () => {
  const sourceDir = await makeTempDir('bocon-src-noindex-');
  const outDir = await makeTempDir('bocon-out-noindex-');

  try {
    await writeSourceFixture(sourceDir, validCatalogue());

    await buildCatalogue({
      sourceDir,
      outDir,
      origin: 'https://fabiomaria.github.io',
      basePath: '/bocon/preview',
      noindex: true,
    });

    await assert.rejects(() => fs.access(path.join(outDir, 'sitemap-catalogue.xml')));

    const allFiles = await readAllFiles(outDir);
    const htmlFiles = [...allFiles.entries()].filter(([rel]) => rel.endsWith('.html'));
    assert.ok(htmlFiles.length >= 6);
    for (const [rel, buf] of htmlFiles) {
      const html = buf.toString('utf8');
      assert.ok(
        html.includes('<meta name="robots" content="noindex, nofollow">'),
        `Missing noindex meta in ${rel}`,
      );
    }
  } finally {
    await fs.rm(sourceDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('buildCatalogue copies required shared static assets and generates localized EN/DE hubs', async () => {
  const sourceDir = await makeTempDir('bocon-src-assets-');
  const outDir = await makeTempDir('bocon-out-assets-');

  try {
    await writeSourceFixture(sourceDir, validCatalogue());

    await buildCatalogue({
      sourceDir,
      outDir,
      origin: 'https://fabiomaria.github.io',
      basePath: '/bocon',
    });

    const requiredAssets = [
      'v2/assets/tokens.css',
      'v2/assets/site.css',
      'v2/assets/wiring-diagrams.js',
      'v2/logo/bocon-wordmark.png',
      'assets/catalogue.css',
      'assets/enquiry-preview.js',
      'assets/products/syn-p100-overview.jpg',
      'documents/syn-catalogue-datasheet-en.pdf',
    ];
    for (const rel of requiredAssets) {
      await fs.access(path.join(outDir, rel));
    }

    const enHub = await fs.readFile(path.join(outDir, 'en/products/index.html'), 'utf8');
    const deHub = await fs.readFile(path.join(outDir, 'de/products/index.html'), 'utf8');

    assert.ok(enHub.includes('<html lang="en">'));
    assert.ok(enHub.includes('Synthetic Temperature Probes'));
    assert.ok(enHub.includes('/bocon/en/products/categories/synthetic-probes.html'));
    assert.ok(enHub.includes('hreflang="de"'));

    assert.ok(deHub.includes('<html lang="de">'));
    assert.ok(deHub.includes('Synthetische Temperaturfuehler'));
    assert.ok(deHub.includes('/bocon/de/products/categories/synthetische-fuehler.html'));
    assert.ok(deHub.includes('hreflang="en"'));
  } finally {
    await fs.rm(sourceDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('buildCatalogue generates EN and DE truthful-preview contact pages without false submission claims', async () => {
  const sourceDir = await makeTempDir('bocon-src-contact-');
  const outDir = await makeTempDir('bocon-out-contact-');

  try {
    await writeSourceFixture(sourceDir, validCatalogue());

    await buildCatalogue({
      sourceDir,
      outDir,
      origin: 'https://fabiomaria.github.io',
      basePath: '/bocon',
    });

    const enContact = await fs.readFile(path.join(outDir, 'en/contact.html'), 'utf8');
    const deContact = await fs.readFile(path.join(outDir, 'de/contact.html'), 'utf8');

    // Truthful preview notice MUST appear above form fields
    const enNoticeIdx = enContact.indexOf('Enquiry preview only. Online submission is unavailable.');
    const enFormIdx = enContact.indexOf('<form id="enquiry-form"');
    assert.ok(enNoticeIdx > 0 && enFormIdx > enNoticeIdx, 'EN truthful notice must precede form');

    const deNoticeIdx = deContact.indexOf('Nur Anfrage-Vorschau. Online-Versand ist derzeit nicht aktiv.');
    const deFormIdx = deContact.indexOf('<form id="enquiry-form"');
    assert.ok(deNoticeIdx > 0 && deFormIdx > deNoticeIdx, 'DE truthful notice must precede form');

    // Zero false "received" / "recorded" wording
    assert.equal(/Enquiry received/i.test(enContact), false);
    assert.equal(/has been recorded/i.test(enContact), false);
    assert.equal(/Anfrage erhalten/i.test(deContact), false);
    assert.equal(/wurde gespeichert/i.test(deContact), false);

    // Quantity distinguishes sensors vs matched pairs
    assert.ok(enContact.includes('name="quantityUnit"'));
    assert.ok(enContact.includes('value="sensors"'));
    assert.ok(enContact.includes('value="pairs"'));
    assert.ok(deContact.includes('name="quantityUnit"'));
    assert.ok(deContact.includes('Gepaarte Fühlerpaare') || deContact.includes('Fühlerpaare'));

    // Contains public model codes in embedded allowlist, zero private markers
    assert.ok(enContact.includes('SYN-P100-A'));
    assert.ok(enContact.includes('SYN-P100-B'));
    assert.ok(enContact.includes('/bocon/assets/enquiry-preview.js'));
    assert.equal(enContact.includes('PRIVATE_SOURCE_DIR'), false);
  } finally {
    await fs.rm(sourceDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('enquiry-preview.js safely resolves query params, ignores invalid values, preserves context on lang switch, and keeps form editable on submit', async () => {
  const { resolveEnquiryPrefill, buildLanguageSwitchHref } = await import(
    '../../assets/enquiry-preview.js'
  );

  const catalogueData = {
    locale: 'en',
    alternateContactHref: '/bocon/de/contact.html',
    allowedIntents: ['application', 'sample', 'quote', 'documents', 'general'],
    products: [
      {
        id: 'syn-probe-alpha',
        modelCodes: ['SYN-P100-A', 'SYN-P100-B'],
        variants: [
          { id: 'syn-probe-alpha-a', modelCode: 'SYN-P100-A' },
          { id: 'syn-probe-alpha-b', modelCode: 'SYN-P100-B' },
        ],
      },
    ],
    resources: [
      {
        id: 'syn-res-request-cert',
        type: 'certificate',
        revision: '2026-Q1',
        language: 'en-de',
        access: 'request-only',
      },
    ],
  };

  // Exact variant prefill
  const validPrefill = resolveEnquiryPrefill(
    '?intent=quote&product=SYN-P100-B&variant=syn-probe-alpha-b&resource=syn-res-request-cert',
    catalogueData,
  );
  assert.equal(validPrefill.intent, 'quote');
  assert.equal(validPrefill.product, 'SYN-P100-B');
  assert.equal(validPrefill.variant, 'syn-probe-alpha-b');
  assert.equal(validPrefill.resource, 'syn-res-request-cert');

  // Invalid/malicious query params are safely ignored
  const maliciousPrefill = resolveEnquiryPrefill(
    '?intent=<script>alert(1)</script>&product=<img src=x onerror=alert(1)>&variant=unknown&resource=../../etc/passwd',
    catalogueData,
  );
  assert.equal(maliciousPrefill.intent, 'application');
  assert.equal(maliciousPrefill.product, '');
  assert.equal(maliciousPrefill.variant, '');
  assert.equal(maliciousPrefill.resource, '');

  // Language switch preserves safe product/variant/intent/resource context ONLY (never personal fields)
  const switched = buildLanguageSwitchHref('/bocon/de/contact.html', {
    intent: 'quote',
    product: 'SYN-P100-B',
    variant: 'syn-probe-alpha-b',
    resource: 'syn-res-request-cert',
    name: 'Private Person',
    email: 'private@example.com',
  });
  const parsed = new URL(switched, 'https://fabiomaria.github.io');
  assert.equal(parsed.pathname, '/bocon/de/contact.html');
  assert.equal(parsed.searchParams.get('intent'), 'quote');
  assert.equal(parsed.searchParams.get('product'), 'SYN-P100-B');
  assert.equal(parsed.searchParams.get('variant'), 'syn-probe-alpha-b');
  assert.equal(parsed.searchParams.get('resource'), 'syn-res-request-cert');
  assert.equal(parsed.searchParams.get('name'), null);
  assert.equal(parsed.searchParams.get('email'), null);

  // Verify enquiry-preview.js source never disables form inputs on submit
  const scriptSrc = await fs.readFile(path.join(REPO_ROOT, 'assets/enquiry-preview.js'), 'utf8');
  assert.equal(/\.disabled\s*=\s*true/.test(scriptSrc), false);
});

test('buildCatalogue renders readiness gap on hub when a category has no published products', async () => {
  const sourceDir = await makeTempDir('bocon-src-gap-');
  const outDir = await makeTempDir('bocon-out-gap-');

  try {
    const cat = validCatalogue();
    cat.categories.push({
      id: 'syn-cat-pending',
      kind: 'equipment',
      locales: {
        en: {
          slug: 'synthetic-pending-category',
          title: 'Synthetic Pending Category',
          intro: 'Category awaiting source verification.',
          reviewStatus: 'reviewed',
        },
        de: {
          slug: 'synthetische-ausstehende-kategorie',
          title: 'Synthetische Ausstehende Kategorie',
          intro: 'Kategorie in Quellenpruefung.',
          reviewStatus: 'reviewed',
        },
      },
      orderedProductIds: [],
    });

    await writeSourceFixture(sourceDir, cat);
    await buildCatalogue({
      sourceDir,
      outDir,
      origin: 'https://fabiomaria.github.io',
      basePath: '/bocon',
    });

    const enHub = await fs.readFile(path.join(outDir, 'en/products/index.html'), 'utf8');
    const deHub = await fs.readFile(path.join(outDir, 'de/products/index.html'), 'utf8');
    assert.ok(enHub.includes('hub-card-pending'));
    assert.ok(enHub.includes('Source verification in progress'));
    assert.ok(deHub.includes('hub-card-pending'));
    assert.ok(deHub.includes('Quellenprüfung läuft'));
  } finally {
    await fs.rm(sourceDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('CLI invocation builds static output with --source --out --origin --base-path --noindex', async () => {
  const sourceDir = await makeTempDir('bocon-src-cli-');
  const outDir = await makeTempDir('bocon-out-cli-');

  try {
    await writeSourceFixture(sourceDir, validCatalogue());

    const { stdout } = await execFileAsync(process.execPath, [
      path.join(REPO_ROOT, 'catalogue/build.mjs'),
      '--source',
      sourceDir,
      '--out',
      outDir,
      '--origin',
      'https://fabiomaria.github.io',
      '--base-path',
      '/bocon/preview',
      '--noindex',
    ]);

    const summary = JSON.parse(stdout);
    assert.ok(Array.isArray(summary.files));
    assert.ok(summary.files.includes('en/products/index.html'));
    assert.ok(summary.files.includes('de/products/index.html'));
    assert.ok(summary.files.includes('en/contact.html'));
    assert.ok(summary.files.includes('de/contact.html'));

    const enContact = await fs.readFile(path.join(outDir, 'en/contact.html'), 'utf8');
    assert.ok(enContact.includes('<meta name="robots" content="noindex, nofollow">'));
  } finally {
    await fs.rm(sourceDir, { recursive: true, force: true });
    await fs.rm(outDir, { recursive: true, force: true });
  }
});
