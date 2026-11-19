/**
 * Explicit allowlist public projection for the Bocon catalogue contract.
 * Never spreads private input records into public output.
 * Structural validation errors throw; ineligible review states are excluded with reasons.
 */

import { SUPPORTED_LOCALES, validateCatalogue } from './validate.mjs';

function projectLocalizedRecord(obj) {
  if (obj === null || obj === undefined) return null;
  const out = {};
  for (const locale of SUPPORTED_LOCALES) {
    if (locale in obj) {
      out[locale] = obj[locale];
    }
  }
  return out;
}

function projectSpecValue(value) {
  if (value === null || typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  if ('min' in value && 'max' in value) {
    return { min: value.min, max: value.max };
  }
  return projectLocalizedRecord(value);
}

function projectSpecFact(spec) {
  const projected = {
    key: spec.key,
    row: spec.row,
    value: projectSpecValue(spec.value),
    unit: spec.unit,
    conditions: spec.conditions === null ? null : projectLocalizedRecord(spec.conditions),
    configurationId: spec.configurationId,
  };
  if (spec.label !== undefined) {
    projected.label = projectLocalizedRecord(spec.label);
  }
  // evidenceId is intentionally omitted (private provenance)
  return projected;
}

function projectVariant(variant) {
  return {
    id: variant.id,
    modelCode: variant.modelCode,
    specs: variant.specs.map(projectSpecFact),
    wiringPresetIds: [...variant.wiringPresetIds],
  };
}

function projectImage(img) {
  return {
    publicPath: img.publicPath,
    alt: projectLocalizedRecord(img.alt),
    variantId: img.variantId,
  };
}

function projectProductLocale(loc) {
  return {
    slug: loc.slug,
    title: loc.title,
    summary: loc.summary,
    applications: [...loc.applications],
    seoTitle: loc.seoTitle,
    seoDescription: loc.seoDescription,
  };
}

function projectCategoryLocale(loc) {
  const out = {
    title: loc.title,
    intro: loc.intro,
  };
  if (loc.slug !== undefined) {
    out.slug = loc.slug;
  }
  return out;
}

function projectCertificateScope(scope) {
  if (scope === null) return null;
  const out = {};
  for (const field of ['issuer', 'holder', 'site', 'scope', 'validity']) {
    if (field in scope) {
      out[field] = scope[field];
    }
  }
  return out;
}

export function publicCatalogue(input) {
  const { errors } = validateCatalogue(input);
  if (errors.length > 0) {
    const err = new Error(
      `Catalogue validation failed with ${errors.length} error(s): ${errors[0].code} at ${errors[0].path}`,
    );
    err.code = 'CATALOGUE_VALIDATION_FAILED';
    err.errors = errors;
    throw err;
  }

  const excluded = [];

  // Step 1: Project eligible resources first so products can filter resourceIds
  const eligibleResourcesRaw = [];
  const publicResourceIds = new Set();

  for (const res of input.resources) {
    if (res.approved !== true) {
      excluded.push({
        entityType: 'resource',
        id: res.id,
        locale: null,
        reason: 'RESOURCE_NOT_APPROVED',
      });
      continue;
    }
    eligibleResourcesRaw.push(res);
    publicResourceIds.add(res.id);
  }

  // Step 2: Project eligible products
  const publicProducts = [];
  const publicProductIds = new Set();

  for (const prod of input.products) {
    if (prod.publicationStatus === 'draft') {
      excluded.push({
        entityType: 'product',
        id: prod.id,
        locale: null,
        reason: 'PRODUCT_DRAFT',
      });
      continue;
    }
    if (prod.publicationStatus === 'withdrawn') {
      excluded.push({
        entityType: 'product',
        id: prod.id,
        locale: null,
        reason: 'PRODUCT_WITHDRAWN',
      });
      continue;
    }

    const projectedLocales = {};
    for (const locale of SUPPORTED_LOCALES) {
      const loc = prod.locales[locale];
      if (!loc) continue;

      if (loc.reviewStatus !== 'reviewed') {
        excluded.push({
          entityType: 'product-locale',
          id: prod.id,
          locale,
          reason: 'LOCALE_NOT_REVIEWED',
        });
        continue;
      }

      if (loc.reviewedTechnicalRevision !== prod.technicalRevision) {
        excluded.push({
          entityType: 'product-locale',
          id: prod.id,
          locale,
          reason: 'LOCALE_REVISION_STALE',
        });
        continue;
      }

      projectedLocales[locale] = projectProductLocale(loc);
    }

    if (Object.keys(projectedLocales).length === 0) {
      excluded.push({
        entityType: 'product',
        id: prod.id,
        locale: null,
        reason: 'NO_ELIGIBLE_LOCALES',
      });
      continue;
    }

    const projectedImages = [];
    for (const img of prod.images) {
      if (img.approvalStatus !== 'approved') {
        excluded.push({
          entityType: 'image',
          id: prod.id,
          locale: null,
          reason: 'IMAGE_NOT_APPROVED',
        });
        continue;
      }
      projectedImages.push(projectImage(img));
    }

    publicProductIds.add(prod.id);
    publicProducts.push({
      id: prod.id,
      modelCodes: [...prod.modelCodes],
      kind: prod.kind,
      categoryId: prod.categoryId,
      technicalRevision: prod.technicalRevision,
      locales: projectedLocales,
      images: projectedImages,
      specs: prod.specs.map(projectSpecFact),
      variants: prod.variants.map(projectVariant),
      resourceIds: prod.resourceIds.filter((rid) => publicResourceIds.has(rid)),
    });
  }

  // Step 3: Project eligible resources with productIds filtered to public products
  const publicResources = eligibleResourcesRaw.map((res) => ({
    id: res.id,
    type: res.type,
    language: res.language,
    revision: res.revision,
    access: res.access,
    publicPath: res.access === 'request-only' ? null : res.publicPath,
    productIds: res.productIds.filter((pid) => publicProductIds.has(pid)),
    variantIds: [...res.variantIds],
    certificateScope: projectCertificateScope(res.certificateScope),
  }));

  // Step 4: Project eligible categories with orderedProductIds filtered to public products
  const publicCategories = [];
  for (const cat of input.categories) {
    const projectedLocales = {};
    for (const locale of SUPPORTED_LOCALES) {
      const loc = cat.locales[locale];
      if (!loc) continue;

      if (loc.reviewStatus !== 'reviewed') {
        excluded.push({
          entityType: 'category-locale',
          id: cat.id,
          locale,
          reason: 'CATEGORY_LOCALE_NOT_REVIEWED',
        });
        continue;
      }

      projectedLocales[locale] = projectCategoryLocale(loc);
    }

    if (Object.keys(projectedLocales).length === 0) {
      excluded.push({
        entityType: 'category',
        id: cat.id,
        locale: null,
        reason: 'NO_ELIGIBLE_LOCALES',
      });
      continue;
    }

    publicCategories.push({
      id: cat.id,
      kind: cat.kind,
      locales: projectedLocales,
      orderedProductIds: cat.orderedProductIds.filter((pid) => publicProductIds.has(pid)),
    });
  }

  return {
    products: publicProducts,
    categories: publicCategories,
    resources: publicResources,
    excluded,
  };
}
