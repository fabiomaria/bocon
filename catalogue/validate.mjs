/**
 * Structural validation for the compact Bocon catalogue content contract.
 * Structural errors are returned in `{ errors: Array<{ code, path, message }> }`.
 * Publication/review eligibility (draft, withdrawn, stale locale, unapproved asset)
 * is NOT a structural error and is handled by `catalogue/project.mjs`.
 */

export const SUPPORTED_LOCALES = Object.freeze(['en', 'de']);

export const SPEC_ROWS = Object.freeze([
  'applications',
  'elementAccuracy',
  'range',
  'material',
  'geometry',
  'connection',
  'leads',
  'performance',
  'protection',
]);

export const PRODUCT_KINDS = Object.freeze(['probe', 'element', 'equipment']);
export const CATEGORY_KINDS = Object.freeze(['probe', 'element', 'equipment', 'mixed']);
export const PUBLICATION_STATUSES = Object.freeze(['draft', 'reviewed', 'withdrawn']);
export const LOCALE_REVIEW_STATUSES = Object.freeze(['draft', 'reviewed', 'blocked']);
export const APPROVAL_STATUSES = Object.freeze(['draft', 'approved', 'rejected']);
export const RESOURCE_ACCESS = Object.freeze(['public', 'request-only']);
export const RESOURCE_TYPES = Object.freeze([
  'datasheet',
  'brochure',
  'manual',
  'certificate',
  'drawing',
  'declaration',
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isSafeRelativePublicPath(value) {
  if (!isNonEmptyString(value)) return false;
  if (value.startsWith('/') || value.startsWith('\\')) return false;
  if (value.includes('://')) return false;
  const segments = value.split(/[\\/]/);
  if (segments.some((seg) => seg === '..' || seg === '')) return false;
  return true;
}

function validateSpecFact(spec, path, variantIds, errors) {
  if (!isPlainObject(spec)) {
    errors.push({ code: 'INVALID_FIELD', path, message: 'Spec fact must be an object' });
    return;
  }

  if (!isNonEmptyString(spec.key)) {
    errors.push({ code: 'MISSING_FIELD', path: `${path}.key`, message: 'Spec key must be a non-empty string' });
  }

  if (!SPEC_ROWS.includes(spec.row)) {
    errors.push({
      code: 'INVALID_SPEC_ROW',
      path: `${path}.row`,
      message: `Spec row "${spec.row}" must be one of: ${SPEC_ROWS.join(', ')}`,
    });
  }

  // Value validation: null (explicit unknown) | string | finite number | {min,max} | {en,de}
  const val = spec.value;
  if (val === null) {
    // Explicit unknown — valid
  } else if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      errors.push({ code: 'INVALID_SPEC_VALUE', path: `${path}.value`, message: 'Numeric spec value must be finite' });
    }
  } else if (typeof val === 'string') {
    if (val.trim().length === 0) {
      errors.push({
        code: 'INVALID_SPEC_VALUE',
        path: `${path}.value`,
        message: 'String spec value cannot be empty; use null for unknown',
      });
    }
  } else if (isPlainObject(val)) {
    const keys = Object.keys(val);
    if ('min' in val || 'max' in val) {
      if (
        typeof val.min !== 'number' ||
        typeof val.max !== 'number' ||
        !Number.isFinite(val.min) ||
        !Number.isFinite(val.max)
      ) {
        errors.push({
          code: 'INVALID_RANGE',
          path: `${path}.value`,
          message: 'Range value must have finite numeric min and max',
        });
      } else if (val.min > val.max) {
        errors.push({
          code: 'INVALID_RANGE',
          path: `${path}.value`,
          message: `Range min (${val.min}) cannot be greater than max (${val.max})`,
        });
      }
    } else if (keys.length > 0 && keys.every((k) => SUPPORTED_LOCALES.includes(k))) {
      for (const k of keys) {
        if (!isNonEmptyString(val[k])) {
          errors.push({
            code: 'INVALID_SPEC_VALUE',
            path: `${path}.value.${k}`,
            message: 'Localized spec value must be a non-empty string',
          });
        }
      }
    } else {
      errors.push({
        code: 'INVALID_SPEC_VALUE',
        path: `${path}.value`,
        message: 'Object spec value must be { min, max } or localized { en, de }',
      });
    }
  } else {
    errors.push({
      code: 'INVALID_SPEC_VALUE',
      path: `${path}.value`,
      message: 'Spec value must be null, string, finite number, { min, max }, or localized { en, de }',
    });
  }

  if (spec.unit !== null && !isNonEmptyString(spec.unit)) {
    errors.push({ code: 'INVALID_FIELD', path: `${path}.unit`, message: 'Spec unit must be null or non-empty string' });
  }

  if (spec.conditions !== null) {
    if (!isPlainObject(spec.conditions)) {
      errors.push({
        code: 'INVALID_FIELD',
        path: `${path}.conditions`,
        message: 'Spec conditions must be null or an object with en/de fields',
      });
    } else {
      for (const [k, v] of Object.entries(spec.conditions)) {
        if (!SUPPORTED_LOCALES.includes(k)) {
          errors.push({
            code: 'INVALID_FIELD',
            path: `${path}.conditions.${k}`,
            message: `Unsupported locale "${k}" in conditions`,
          });
        } else if (v !== null && typeof v !== 'string') {
          errors.push({
            code: 'INVALID_FIELD',
            path: `${path}.conditions.${k}`,
            message: 'Condition text must be string or null',
          });
        }
      }
    }
  }

  if (spec.configurationId !== null) {
    if (!isNonEmptyString(spec.configurationId)) {
      errors.push({
        code: 'INVALID_FIELD',
        path: `${path}.configurationId`,
        message: 'configurationId must be null or a non-empty variant ID',
      });
    } else if (!variantIds.has(spec.configurationId)) {
      errors.push({
        code: 'UNKNOWN_VARIANT',
        path: `${path}.configurationId`,
        message: `Unknown variant/configuration ID "${spec.configurationId}"`,
      });
    }
  }

  if (spec.label !== undefined) {
    if (!isPlainObject(spec.label)) {
      errors.push({ code: 'INVALID_FIELD', path: `${path}.label`, message: 'Spec label must be an object' });
    } else {
      for (const [k, v] of Object.entries(spec.label)) {
        if (!SUPPORTED_LOCALES.includes(k) || !isNonEmptyString(v)) {
          errors.push({
            code: 'INVALID_FIELD',
            path: `${path}.label.${k}`,
            message: 'Spec label entries must use supported locales with non-empty strings',
          });
        }
      }
    }
  }

  if (!isNonEmptyString(spec.evidenceId)) {
    errors.push({
      code: 'MISSING_EVIDENCE',
      path: `${path}.evidenceId`,
      message: 'Every spec fact requires a non-empty evidenceId',
    });
  }
}

export function validateCatalogue(input) {
  const errors = [];

  if (!isPlainObject(input)) {
    errors.push({ code: 'INVALID_INPUT', path: '$', message: 'Catalogue input must be an object' });
    return { errors };
  }

  for (const key of ['products', 'categories', 'resources']) {
    if (!Array.isArray(input[key])) {
      errors.push({ code: 'INVALID_INPUT', path: key, message: `Catalogue "${key}" must be an array` });
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  const { products, categories, resources } = input;

  // Pass 1: Collect unique IDs for referential integrity
  const categoryIds = new Set();
  categories.forEach((cat, idx) => {
    const path = `categories[${idx}]`;
    if (!isPlainObject(cat) || !isNonEmptyString(cat.id)) {
      errors.push({ code: 'MISSING_FIELD', path: `${path}.id`, message: 'Category id must be a non-empty string' });
      return;
    }
    if (categoryIds.has(cat.id)) {
      errors.push({ code: 'DUPLICATE_ID', path: `${path}.id`, message: `Duplicate category id "${cat.id}"` });
    } else {
      categoryIds.add(cat.id);
    }
  });

  const productIds = new Set();
  const allVariantIds = new Set();
  products.forEach((prod, idx) => {
    const path = `products[${idx}]`;
    if (!isPlainObject(prod) || !isNonEmptyString(prod.id)) {
      errors.push({ code: 'MISSING_FIELD', path: `${path}.id`, message: 'Product id must be a non-empty string' });
      return;
    }
    if (productIds.has(prod.id)) {
      errors.push({ code: 'DUPLICATE_ID', path: `${path}.id`, message: `Duplicate product id "${prod.id}"` });
    } else {
      productIds.add(prod.id);
    }
    if (Array.isArray(prod.variants)) {
      for (const v of prod.variants) {
        if (isPlainObject(v) && isNonEmptyString(v.id)) {
          allVariantIds.add(v.id);
        }
      }
    }
  });

  const resourceIds = new Set();
  resources.forEach((res, idx) => {
    const path = `resources[${idx}]`;
    if (!isPlainObject(res) || !isNonEmptyString(res.id)) {
      errors.push({ code: 'MISSING_FIELD', path: `${path}.id`, message: 'Resource id must be a non-empty string' });
      return;
    }
    if (resourceIds.has(res.id)) {
      errors.push({ code: 'DUPLICATE_ID', path: `${path}.id`, message: `Duplicate resource id "${res.id}"` });
    } else {
      resourceIds.add(res.id);
    }
  });

  // Pass 2: Validate categories
  const categorySlugsByLocale = { en: new Set(), de: new Set() };
  categories.forEach((cat, idx) => {
    const path = `categories[${idx}]`;
    if (!isPlainObject(cat)) return;

    if (!CATEGORY_KINDS.includes(cat.kind)) {
      errors.push({
        code: 'INVALID_FIELD',
        path: `${path}.kind`,
        message: `Category kind must be one of: ${CATEGORY_KINDS.join(', ')}`,
      });
    }

    if (!isPlainObject(cat.locales) || Object.keys(cat.locales).length === 0) {
      errors.push({ code: 'MISSING_FIELD', path: `${path}.locales`, message: 'Category must define at least one locale' });
    } else {
      for (const [locale, loc] of Object.entries(cat.locales)) {
        const locPath = `${path}.locales.${locale}`;
        if (!SUPPORTED_LOCALES.includes(locale)) {
          errors.push({ code: 'INVALID_FIELD', path: locPath, message: `Unsupported locale "${locale}"` });
          continue;
        }
        if (!isPlainObject(loc)) {
          errors.push({ code: 'INVALID_FIELD', path: locPath, message: 'Category locale must be an object' });
          continue;
        }
        if (!isNonEmptyString(loc.title)) {
          errors.push({ code: 'MISSING_FIELD', path: `${locPath}.title`, message: 'Category title is required' });
        }
        if (!isNonEmptyString(loc.intro)) {
          errors.push({ code: 'MISSING_FIELD', path: `${locPath}.intro`, message: 'Category intro is required' });
        }
        if (!LOCALE_REVIEW_STATUSES.includes(loc.reviewStatus)) {
          errors.push({
            code: 'INVALID_FIELD',
            path: `${locPath}.reviewStatus`,
            message: `Invalid reviewStatus "${loc.reviewStatus}"`,
          });
        }
        if (loc.slug !== undefined) {
          if (!isNonEmptyString(loc.slug) || !SLUG_RE.test(loc.slug)) {
            errors.push({ code: 'INVALID_FIELD', path: `${locPath}.slug`, message: 'Category slug must be lowercase kebab-case' });
          } else if (categorySlugsByLocale[locale].has(loc.slug)) {
            errors.push({
              code: 'DUPLICATE_LOCALE_ROUTE',
              path: `${locPath}.slug`,
              message: `Duplicate category slug "${loc.slug}" in locale "${locale}"`,
            });
          } else {
            categorySlugsByLocale[locale].add(loc.slug);
          }
        }
      }
    }

    if (!Array.isArray(cat.orderedProductIds)) {
      errors.push({ code: 'INVALID_FIELD', path: `${path}.orderedProductIds`, message: 'orderedProductIds must be an array' });
    } else {
      const seenOrdered = new Set();
      cat.orderedProductIds.forEach((pid, pIdx) => {
        if (!productIds.has(pid)) {
          errors.push({
            code: 'UNKNOWN_PRODUCT',
            path: `${path}.orderedProductIds[${pIdx}]`,
            message: `Unknown product id "${pid}"`,
          });
        } else if (seenOrdered.has(pid)) {
          errors.push({
            code: 'DUPLICATE_REFERENCE',
            path: `${path}.orderedProductIds[${pIdx}]`,
            message: `Duplicate product reference "${pid}" in orderedProductIds`,
          });
        } else {
          seenOrdered.add(pid);
        }
      });
    }
  });

  // Pass 3: Validate products
  const productSlugsByLocale = { en: new Set(), de: new Set() };
  products.forEach((prod, idx) => {
    const path = `products[${idx}]`;
    if (!isPlainObject(prod)) return;

    if (!Array.isArray(prod.modelCodes) || prod.modelCodes.length === 0) {
      errors.push({
        code: 'MISSING_FIELD',
        path: `${path}.modelCodes`,
        message: 'Product modelCodes must be a non-empty array',
      });
    } else {
      const seenCodes = new Set();
      prod.modelCodes.forEach((code, cIdx) => {
        if (!isNonEmptyString(code)) {
          errors.push({
            code: 'INVALID_FIELD',
            path: `${path}.modelCodes[${cIdx}]`,
            message: 'Model code must be a non-empty string',
          });
        } else if (seenCodes.has(code)) {
          errors.push({
            code: 'DUPLICATE_REFERENCE',
            path: `${path}.modelCodes[${cIdx}]`,
            message: `Duplicate model code "${code}" on product "${prod.id}"`,
          });
        } else {
          seenCodes.add(code);
        }
      });
    }

    if (!PRODUCT_KINDS.includes(prod.kind)) {
      errors.push({
        code: 'INVALID_FIELD',
        path: `${path}.kind`,
        message: `Product kind must be one of: ${PRODUCT_KINDS.join(', ')}`,
      });
    }

    if (!categoryIds.has(prod.categoryId)) {
      errors.push({
        code: 'UNKNOWN_CATEGORY',
        path: `${path}.categoryId`,
        message: `Unknown category id "${prod.categoryId}"`,
      });
    }

    if (!isNonEmptyString(prod.technicalRevision)) {
      errors.push({
        code: 'MISSING_FIELD',
        path: `${path}.technicalRevision`,
        message: 'technicalRevision must be a non-empty string',
      });
    }

    if (!PUBLICATION_STATUSES.includes(prod.publicationStatus)) {
      errors.push({
        code: 'INVALID_FIELD',
        path: `${path}.publicationStatus`,
        message: `publicationStatus must be one of: ${PUBLICATION_STATUSES.join(', ')}`,
      });
    }

    // Locales
    if (!isPlainObject(prod.locales) || Object.keys(prod.locales).length === 0) {
      errors.push({ code: 'MISSING_FIELD', path: `${path}.locales`, message: 'Product must define at least one locale' });
    } else {
      for (const [locale, loc] of Object.entries(prod.locales)) {
        const locPath = `${path}.locales.${locale}`;
        if (!SUPPORTED_LOCALES.includes(locale)) {
          errors.push({ code: 'INVALID_FIELD', path: locPath, message: `Unsupported locale "${locale}"` });
          continue;
        }
        if (!isPlainObject(loc)) {
          errors.push({ code: 'INVALID_FIELD', path: locPath, message: 'Product locale must be an object' });
          continue;
        }
        if (!isNonEmptyString(loc.slug) || !SLUG_RE.test(loc.slug)) {
          errors.push({ code: 'INVALID_FIELD', path: `${locPath}.slug`, message: 'Product slug must be lowercase kebab-case' });
        } else if (productSlugsByLocale[locale].has(loc.slug)) {
          errors.push({
            code: 'DUPLICATE_LOCALE_ROUTE',
            path: `${locPath}.slug`,
            message: `Duplicate product slug "${loc.slug}" in locale "${locale}"`,
          });
        } else {
          productSlugsByLocale[locale].add(loc.slug);
        }

        for (const textField of ['title', 'summary', 'seoTitle', 'seoDescription']) {
          if (!isNonEmptyString(loc[textField])) {
            errors.push({
              code: 'MISSING_FIELD',
              path: `${locPath}.${textField}`,
              message: `${textField} must be a non-empty string`,
            });
          }
        }

        if (!Array.isArray(loc.applications) || !loc.applications.every(isNonEmptyString)) {
          errors.push({
            code: 'INVALID_FIELD',
            path: `${locPath}.applications`,
            message: 'applications must be an array of non-empty strings',
          });
        }

        if (loc.reviewedTechnicalRevision !== null && !isNonEmptyString(loc.reviewedTechnicalRevision)) {
          errors.push({
            code: 'INVALID_FIELD',
            path: `${locPath}.reviewedTechnicalRevision`,
            message: 'reviewedTechnicalRevision must be null or a non-empty string',
          });
        }

        if (!LOCALE_REVIEW_STATUSES.includes(loc.reviewStatus)) {
          errors.push({
            code: 'INVALID_FIELD',
            path: `${locPath}.reviewStatus`,
            message: `reviewStatus must be one of: ${LOCALE_REVIEW_STATUSES.join(', ')}`,
          });
        }
      }
    }

    // Variants (collect IDs first so specs and images can reference them)
    const prodVariantIds = new Set();
    const prodVariantCodes = new Set();
    if (!Array.isArray(prod.variants)) {
      errors.push({ code: 'INVALID_FIELD', path: `${path}.variants`, message: 'variants must be an array' });
    } else {
      prod.variants.forEach((v, vIdx) => {
        const vPath = `${path}.variants[${vIdx}]`;
        if (!isPlainObject(v)) {
          errors.push({ code: 'INVALID_FIELD', path: vPath, message: 'Variant must be an object' });
          return;
        }
        if (!isNonEmptyString(v.id)) {
          errors.push({ code: 'MISSING_FIELD', path: `${vPath}.id`, message: 'Variant id must be a non-empty string' });
        } else if (prodVariantIds.has(v.id)) {
          errors.push({ code: 'DUPLICATE_VARIANT_ID', path: `${vPath}.id`, message: `Duplicate variant id "${v.id}"` });
        } else {
          prodVariantIds.add(v.id);
        }

        if (!isNonEmptyString(v.modelCode)) {
          errors.push({
            code: 'MISSING_FIELD',
            path: `${vPath}.modelCode`,
            message: 'Variant modelCode must be a non-empty string',
          });
        } else if (prodVariantCodes.has(v.modelCode)) {
          errors.push({
            code: 'DUPLICATE_VARIANT_MODEL_CODE',
            path: `${vPath}.modelCode`,
            message: `Duplicate variant modelCode "${v.modelCode}"`,
          });
        } else {
          prodVariantCodes.add(v.modelCode);
        }

        if (!Array.isArray(v.wiringPresetIds) || !v.wiringPresetIds.every(isNonEmptyString)) {
          errors.push({
            code: 'INVALID_FIELD',
            path: `${vPath}.wiringPresetIds`,
            message: 'wiringPresetIds must be an array of non-empty strings',
          });
        }
      });

      // Validate variant specs once all prodVariantIds are known
      prod.variants.forEach((v, vIdx) => {
        const vPath = `${path}.variants[${vIdx}]`;
        if (!isPlainObject(v)) return;
        if (!Array.isArray(v.specs)) {
          errors.push({ code: 'INVALID_FIELD', path: `${vPath}.specs`, message: 'Variant specs must be an array' });
        } else {
          v.specs.forEach((spec, sIdx) => {
            validateSpecFact(spec, `${vPath}.specs[${sIdx}]`, prodVariantIds, errors);
          });
        }
      });
    }

    // Shared product specs
    if (!Array.isArray(prod.specs)) {
      errors.push({ code: 'INVALID_FIELD', path: `${path}.specs`, message: 'Product specs must be an array' });
    } else {
      prod.specs.forEach((spec, sIdx) => {
        validateSpecFact(spec, `${path}.specs[${sIdx}]`, prodVariantIds, errors);
      });
    }

    // Images
    if (!Array.isArray(prod.images)) {
      errors.push({ code: 'INVALID_FIELD', path: `${path}.images`, message: 'Product images must be an array' });
    } else {
      prod.images.forEach((img, iIdx) => {
        const iPath = `${path}.images[${iIdx}]`;
        if (!isPlainObject(img)) {
          errors.push({ code: 'INVALID_FIELD', path: iPath, message: 'Image must be an object' });
          return;
        }
        if (!isSafeRelativePublicPath(img.publicPath)) {
          errors.push({
            code: 'INVALID_PUBLIC_PATH',
            path: `${iPath}.publicPath`,
            message: 'Image publicPath must be a safe relative path',
          });
        }
        if (!isPlainObject(img.alt)) {
          errors.push({ code: 'INVALID_FIELD', path: `${iPath}.alt`, message: 'Image alt must be an object' });
        } else {
          for (const [k, v] of Object.entries(img.alt)) {
            if (!SUPPORTED_LOCALES.includes(k) || !isNonEmptyString(v)) {
              errors.push({
                code: 'INVALID_FIELD',
                path: `${iPath}.alt.${k}`,
                message: 'Image alt text must use supported locales with non-empty strings',
              });
            }
          }
        }
        if (img.variantId !== null && !prodVariantIds.has(img.variantId)) {
          errors.push({
            code: 'UNKNOWN_VARIANT',
            path: `${iPath}.variantId`,
            message: `Unknown variantId "${img.variantId}" on image`,
          });
        }
        if (!APPROVAL_STATUSES.includes(img.approvalStatus)) {
          errors.push({
            code: 'INVALID_FIELD',
            path: `${iPath}.approvalStatus`,
            message: `Image approvalStatus must be one of: ${APPROVAL_STATUSES.join(', ')}`,
          });
        }
      });
    }

    // Resource references
    if (!Array.isArray(prod.resourceIds)) {
      errors.push({ code: 'INVALID_FIELD', path: `${path}.resourceIds`, message: 'resourceIds must be an array' });
    } else {
      prod.resourceIds.forEach((rid, rIdx) => {
        if (!resourceIds.has(rid)) {
          errors.push({
            code: 'UNKNOWN_RESOURCE',
            path: `${path}.resourceIds[${rIdx}]`,
            message: `Unknown resource id "${rid}"`,
          });
        }
      });
    }
  });

  // Pass 4: Validate resources
  resources.forEach((res, idx) => {
    const path = `resources[${idx}]`;
    if (!isPlainObject(res)) return;

    if (!RESOURCE_TYPES.includes(res.type)) {
      errors.push({
        code: 'INVALID_FIELD',
        path: `${path}.type`,
        message: `Resource type must be one of: ${RESOURCE_TYPES.join(', ')}`,
      });
    }

    if (!isNonEmptyString(res.language)) {
      errors.push({ code: 'MISSING_FIELD', path: `${path}.language`, message: 'Resource language is required' });
    }

    if (!isNonEmptyString(res.revision)) {
      errors.push({ code: 'MISSING_FIELD', path: `${path}.revision`, message: 'Resource revision is required' });
    }

    if (!RESOURCE_ACCESS.includes(res.access)) {
      errors.push({
        code: 'INVALID_FIELD',
        path: `${path}.access`,
        message: `Resource access must be one of: ${RESOURCE_ACCESS.join(', ')}`,
      });
    }

    if (typeof res.approved !== 'boolean') {
      errors.push({ code: 'INVALID_FIELD', path: `${path}.approved`, message: 'Resource approved must be a boolean' });
    }

    if (res.access === 'request-only') {
      if (res.publicPath !== null) {
        errors.push({
          code: 'REQUEST_ONLY_PUBLIC_PATH',
          path: `${path}.publicPath`,
          message: 'Request-only resource must have publicPath set to null',
        });
      }
    } else if (res.access === 'public') {
      if (res.approved === true && (res.publicPath === null || res.publicPath === undefined)) {
        errors.push({
          code: 'MISSING_PUBLIC_PATH',
          path: `${path}.publicPath`,
          message: 'Approved public resource must specify a safe relative publicPath',
        });
      } else if (res.publicPath !== null && !isSafeRelativePublicPath(res.publicPath)) {
        errors.push({
          code: 'INVALID_PUBLIC_PATH',
          path: `${path}.publicPath`,
          message: 'Resource publicPath must be a safe relative path',
        });
      }
    }

    if (!Array.isArray(res.productIds)) {
      errors.push({ code: 'INVALID_FIELD', path: `${path}.productIds`, message: 'Resource productIds must be an array' });
    } else {
      res.productIds.forEach((pid, pIdx) => {
        if (!productIds.has(pid)) {
          errors.push({
            code: 'UNKNOWN_PRODUCT',
            path: `${path}.productIds[${pIdx}]`,
            message: `Unknown product id "${pid}" on resource "${res.id}"`,
          });
        }
      });
    }

    if (!Array.isArray(res.variantIds)) {
      errors.push({ code: 'INVALID_FIELD', path: `${path}.variantIds`, message: 'Resource variantIds must be an array' });
    } else {
      res.variantIds.forEach((vid, vIdx) => {
        if (!allVariantIds.has(vid)) {
          errors.push({
            code: 'UNKNOWN_VARIANT',
            path: `${path}.variantIds[${vIdx}]`,
            message: `Unknown variant id "${vid}" on resource "${res.id}"`,
          });
        }
      });
    }

    if (res.certificateScope !== null && !isPlainObject(res.certificateScope)) {
      errors.push({
        code: 'INVALID_FIELD',
        path: `${path}.certificateScope`,
        message: 'certificateScope must be null or an object',
      });
    }
  });

  return { errors };
}
