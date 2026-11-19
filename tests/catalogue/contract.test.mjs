import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalogue } from '../../catalogue/validate.mjs';
import { publicCatalogue } from '../../catalogue/project.mjs';
import { validCatalogue, simulatedNewEquipmentProduct } from './fixtures.mjs';

test('valid synthetic catalogue passes validation and projects allowlisted public data', () => {
  const c = validCatalogue();
  const validation = validateCatalogue(c);
  assert.deepEqual(validation.errors, []);

  const pub = publicCatalogue(c);
  assert.equal(pub.products.length, 2);
  assert.equal(pub.categories.length, 2);
  assert.equal(pub.resources.length, 2);
  assert.deepEqual(pub.excluded, []);

  // Preserves conditions and scoped variant facts
  const alpha = pub.products.find((p) => p.id === 'syn-probe-alpha');
  assert.equal(alpha.specs[0].conditions.en, 'Continuous operation in liquid');
  assert.equal(alpha.specs[0].conditions.de, 'Dauerbetrieb in Fluessigkeit');
  assert.equal(alpha.specs[2].value, null); // explicit unknown preserved
  assert.equal(alpha.variants[0].specs[0].configurationId, 'syn-probe-alpha-a');
  assert.equal(alpha.variants[1].specs[1].value, 'IP67');
});

test('duplicate internal identity is rejected', () => {
  const c = validCatalogue();
  c.products.push(structuredClone(c.products[0]));
  assert.ok(validateCatalogue(c).errors.some((e) => e.code === 'DUPLICATE_ID'));
  assert.throws(() => publicCatalogue(c));
});

test('stale German review cannot enter the public projection', () => {
  const c = validCatalogue();
  c.products[0].locales.de.reviewedTechnicalRevision = 'obsolete';
  assert.deepEqual(validateCatalogue(c).errors, []);
  const result = publicCatalogue(c);
  assert.equal(result.products[0].locales.de, undefined);
  assert.ok(result.products[0].locales.en);
  assert.ok(
    result.excluded.some(
      (ex) =>
        ex.id === 'syn-probe-alpha' &&
        ex.locale === 'de' &&
        ex.reason === 'LOCALE_REVISION_STALE',
    ),
  );
});

test('private source markers never enter public output', () => {
  const c = validCatalogue();
  c.resources[0].privateSource = { path: 'PRIVATE_MARKER' };
  c.products[0].provenance = { raw: 'PRIVATE_PROVENANCE_MARKER' };
  c.products[0].review = { secret: 'PRIVATE_REVIEW_MARKER' };
  c.products[0].extraUnlistedField = 'UNLISTED_FIELD_MARKER';

  const serialized = JSON.stringify(publicCatalogue(c));
  assert.equal(serialized.includes('PRIVATE_MARKER'), false);
  assert.equal(serialized.includes('PRIVATE_PROVENANCE_MARKER'), false);
  assert.equal(serialized.includes('PRIVATE_REVIEW_MARKER'), false);
  assert.equal(serialized.includes('UNLISTED_FIELD_MARKER'), false);
  assert.equal(serialized.includes('SYN-EV-101'), false);
});

test('duplicate locale routes are rejected', () => {
  const c = validCatalogue();
  c.products[1].locales.en.slug = c.products[0].locales.en.slug;
  assert.ok(validateCatalogue(c).errors.some((e) => e.code === 'DUPLICATE_LOCALE_ROUTE'));
});

test('unknown category and resource references are rejected', () => {
  const c1 = validCatalogue();
  c1.products[0].categoryId = 'syn-cat-nonexistent';
  assert.ok(validateCatalogue(c1).errors.some((e) => e.code === 'UNKNOWN_CATEGORY'));

  const c2 = validCatalogue();
  c2.products[0].resourceIds.push('syn-res-nonexistent');
  assert.ok(validateCatalogue(c2).errors.some((e) => e.code === 'UNKNOWN_RESOURCE'));

  const c3 = validCatalogue();
  c3.categories[0].orderedProductIds.push('syn-product-nonexistent');
  assert.ok(validateCatalogue(c3).errors.some((e) => e.code === 'UNKNOWN_PRODUCT'));
});

test('invalid min/max numeric range is rejected', () => {
  const c = validCatalogue();
  c.products[0].specs[0].value = { min: 300, max: 100 };
  assert.ok(validateCatalogue(c).errors.some((e) => e.code === 'INVALID_RANGE'));
});

test('absent or empty evidenceId on spec fact is rejected', () => {
  const c = validCatalogue();
  delete c.products[0].specs[0].evidenceId;
  assert.ok(validateCatalogue(c).errors.some((e) => e.code === 'MISSING_EVIDENCE'));

  const c2 = validCatalogue();
  c2.products[0].variants[0].specs[0].evidenceId = '   ';
  assert.ok(validateCatalogue(c2).errors.some((e) => e.code === 'MISSING_EVIDENCE'));
});

test('draft and withdrawn products are structurally valid but excluded from public output with reasons', () => {
  const c = validCatalogue();
  c.products[0].publicationStatus = 'draft';
  c.products[1].publicationStatus = 'withdrawn';
  assert.deepEqual(validateCatalogue(c).errors, []);

  const pub = publicCatalogue(c);
  assert.equal(pub.products.length, 0);
  assert.ok(
    pub.excluded.some((ex) => ex.id === 'syn-probe-alpha' && ex.reason === 'PRODUCT_DRAFT'),
  );
  assert.ok(
    pub.excluded.some((ex) => ex.id === 'syn-element-beta' && ex.reason === 'PRODUCT_WITHDRAWN'),
  );
  // Category orderedProductIds must not dangle to excluded products
  assert.deepEqual(pub.categories[0].orderedProductIds, []);
  assert.deepEqual(pub.categories[1].orderedProductIds, []);
});

test('request-only resource with non-null publicPath is rejected', () => {
  const c = validCatalogue();
  const reqRes = c.resources.find((r) => r.access === 'request-only');
  reqRes.publicPath = 'documents/should-not-be-public.pdf';
  assert.ok(validateCatalogue(c).errors.some((e) => e.code === 'REQUEST_ONLY_PUBLIC_PATH'));
});

test('unapproved resources and images are excluded from public projection', () => {
  const c = validCatalogue();
  c.resources[0].approved = false;
  c.products[0].images[1].approvalStatus = 'draft';
  assert.deepEqual(validateCatalogue(c).errors, []);

  const pub = publicCatalogue(c);
  assert.equal(pub.resources.some((r) => r.id === 'syn-res-public-ds'), false);
  const alpha = pub.products.find((p) => p.id === 'syn-probe-alpha');
  assert.equal(alpha.resourceIds.includes('syn-res-public-ds'), false);
  assert.equal(alpha.images.length, 1);
  assert.ok(pub.excluded.some((ex) => ex.id === 'syn-res-public-ds' && ex.reason === 'RESOURCE_NOT_APPROVED'));
  assert.ok(pub.excluded.some((ex) => ex.id === 'syn-probe-alpha' && ex.reason === 'IMAGE_NOT_APPROVED'));
});

test('distinct manufacturer-code identities are preserved without merging or rejecting', () => {
  const c = validCatalogue();
  const sibling = structuredClone(c.products[0]);
  sibling.id = 'syn-probe-alpha-meter';
  sibling.modelCodes = ['SYN-P100-A-HM', 'SYN-P100-B-HM'];
  sibling.locales.en.slug = 'synthetic-heat-meter-probe';
  sibling.locales.de.slug = 'synthetischer-waermezaehlerfuehler';
  sibling.variants[0].id = 'syn-probe-alpha-meter-a';
  sibling.variants[0].modelCode = 'SYN-P100-A-HM';
  sibling.variants[0].specs.forEach((s) => {
    s.configurationId = 'syn-probe-alpha-meter-a';
  });
  sibling.variants[1].id = 'syn-probe-alpha-meter-b';
  sibling.variants[1].modelCode = 'SYN-P100-B-HM';
  sibling.variants[1].specs.forEach((s) => {
    s.configurationId = 'syn-probe-alpha-meter-b';
  });
  sibling.images[1].variantId = 'syn-probe-alpha-meter-b';
  c.products.push(sibling);
  c.categories[0].orderedProductIds.push(sibling.id);

  assert.deepEqual(validateCatalogue(c).errors, []);
  const pub = publicCatalogue(c);
  assert.equal(pub.products.length, 3);
  const industrial = pub.products.find((p) => p.id === 'syn-probe-alpha');
  const meter = pub.products.find((p) => p.id === 'syn-probe-alpha-meter');
  assert.deepEqual(industrial.modelCodes, ['SYN-P100-A', 'SYN-P100-B']);
  assert.deepEqual(meter.modelCodes, ['SYN-P100-A-HM', 'SYN-P100-B-HM']);
});

test('simulated new product entry passes validation and projection without schema extension', () => {
  const c = validCatalogue();
  const newProd = simulatedNewEquipmentProduct();
  c.products.push(newProd);
  c.categories[0].orderedProductIds.push(newProd.id);

  assert.deepEqual(validateCatalogue(c).errors, []);
  const pub = publicCatalogue(c);
  const projected = pub.products.find((p) => p.id === 'syn-equip-gamma');
  assert.ok(projected);
  assert.equal(projected.kind, 'equipment');
  assert.deepEqual(projected.modelCodes, ['SYN-T900-STD']);
  assert.equal(projected.locales.en.slug, 'synthetic-response-tester');
  assert.equal(projected.locales.de.slug, 'synthetischer-ansprechzeitpruefer');
});

test('unknown spec row key and unknown variant configurationId are rejected', () => {
  const c1 = validCatalogue();
  c1.products[0].specs[0].row = 'inventedRowKey';
  assert.ok(validateCatalogue(c1).errors.some((e) => e.code === 'INVALID_SPEC_ROW'));

  const c2 = validCatalogue();
  c2.products[0].specs[0].configurationId = 'syn-variant-does-not-exist';
  assert.ok(validateCatalogue(c2).errors.some((e) => e.code === 'UNKNOWN_VARIANT'));
});

test('unsafe absolute or parent-traversal publicPath is rejected', () => {
  const c1 = validCatalogue();
  c1.resources[0].publicPath = '/Users/private/secret.pdf';
  assert.ok(validateCatalogue(c1).errors.some((e) => e.code === 'INVALID_PUBLIC_PATH'));

  const c2 = validCatalogue();
  c2.products[0].images[0].publicPath = '../private/image.jpg';
  assert.ok(validateCatalogue(c2).errors.some((e) => e.code === 'INVALID_PUBLIC_PATH'));
});

test('product with zero eligible locales is excluded with NO_ELIGIBLE_LOCALES', () => {
  const c = validCatalogue();
  c.products[0].locales.en.reviewStatus = 'draft';
  c.products[0].locales.de.reviewedTechnicalRevision = 'obsolete';
  assert.deepEqual(validateCatalogue(c).errors, []);

  const pub = publicCatalogue(c);
  assert.equal(pub.products.some((p) => p.id === 'syn-probe-alpha'), false);
  assert.ok(
    pub.excluded.some((ex) => ex.id === 'syn-probe-alpha' && ex.reason === 'NO_ELIGIBLE_LOCALES'),
  );
});
