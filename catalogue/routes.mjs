/**
 * Deterministic route and URL manifest builder for the Bocon static catalogue.
 * Supports configurable origin and basePath (e.g. "/bocon", "/bocon/preview"),
 * reciprocal EN/DE identity mapping, URL segment/query encoding, and slug
 * collision rejection. Never constructs paths by stripping manufacturer suffixes.
 */

import { SUPPORTED_LOCALES } from './validate.mjs';

function makeError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

export function assertLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    throw makeError(
      'UNKNOWN_LOCALE',
      `Unsupported locale "${locale}". Expected one of: ${SUPPORTED_LOCALES.join(', ')}`,
    );
  }
}

export function normalizeBasePath(basePath = '') {
  if (typeof basePath !== 'string') {
    throw makeError('INVALID_BASE_PATH', 'basePath must be a string');
  }
  const trimmed = basePath.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === '/') return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function normalizeOrigin(origin = '') {
  if (typeof origin !== 'string') {
    throw makeError('INVALID_ORIGIN', 'origin must be a string');
  }
  return origin.trim().replace(/\/+$/, '');
}

export function encodePathSegments(relPath) {
  return String(relPath)
    .split('/')
    .filter((seg) => seg.length > 0)
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

/**
 * Returns the locale-scoped relative route path for a product based on its
 * stable identity and reviewed locale slug. Never derives paths by stripping
 * manufacturer model suffixes.
 */
export function productPath(product, locale) {
  assertLocale(locale);
  if (!product || typeof product.id !== 'string' || !product.id.trim()) {
    throw makeError('INVALID_PRODUCT', 'Product must have a stable non-empty id');
  }
  const loc = product.locales?.[locale];
  if (!loc) {
    throw makeError(
      'LOCALE_NOT_AVAILABLE',
      `Product "${product.id}" has no eligible "${locale}" locale`,
    );
  }
  if (typeof loc.slug !== 'string' || !loc.slug.trim()) {
    throw makeError(
      'MISSING_SLUG',
      `Product "${product.id}" locale "${locale}" is missing a reviewed slug`,
    );
  }
  return `/${locale}/products/${encodeURIComponent(loc.slug.trim())}.html`;
}

/**
 * Returns the locale-scoped relative route path for a category based on its
 * reviewed locale slug (falling back to stable category id when slug is omitted).
 */
export function categoryPath(category, locale) {
  assertLocale(locale);
  if (!category || typeof category.id !== 'string' || !category.id.trim()) {
    throw makeError('INVALID_CATEGORY', 'Category must have a stable non-empty id');
  }
  const loc = category.locales?.[locale];
  if (!loc) {
    throw makeError(
      'LOCALE_NOT_AVAILABLE',
      `Category "${category.id}" has no eligible "${locale}" locale`,
    );
  }
  const segment = typeof loc.slug === 'string' && loc.slug.trim() ? loc.slug.trim() : category.id.trim();
  return `/${locale}/products/categories/${encodeURIComponent(segment)}.html`;
}

/**
 * Builds the complete route manifest for a public catalogue projection.
 * Throws SLUG_COLLISION if two entities map to the same output path.
 */
export function buildRoutes(publicInput, { origin = '', basePath = '' } = {}) {
  const normOrigin = normalizeOrigin(origin);
  const normBasePath = normalizeBasePath(basePath);

  const productsById = Object.create(null);
  const categoriesById = Object.create(null);
  const all = [];
  const seenPaths = new Map();

  function registerRoute(relPath, entityKind, id, locale, slug) {
    const key = relPath.toLowerCase();
    if (seenPaths.has(key)) {
      const existing = seenPaths.get(key);
      throw makeError(
        'SLUG_COLLISION',
        `Route collision on "${relPath}" between ${existing.kind}:${existing.id} and ${entityKind}:${id}`,
      );
    }
    const href = `${normBasePath}${relPath}`;
    const url = normOrigin ? `${normOrigin}${href}` : href;
    const entry = {
      kind: entityKind,
      id,
      locale,
      slug,
      relPath,
      filePath: relPath.replace(/^\/+/, ''),
      href,
      url,
      alternates: {},
      alternateHrefs: {},
    };
    seenPaths.set(key, entry);
    all.push(entry);
    return entry;
  }

  for (const cat of publicInput.categories || []) {
    const map = {};
    for (const locale of Object.keys(cat.locales || {})) {
      assertLocale(locale);
      const relPath = categoryPath(cat, locale);
      const slug = cat.locales[locale].slug || cat.id;
      map[locale] = registerRoute(relPath, 'category', cat.id, locale, slug);
    }
    for (const locale of Object.keys(map)) {
      for (const altLocale of Object.keys(map)) {
        map[locale].alternates[altLocale] = map[altLocale].url;
        map[locale].alternateHrefs[altLocale] = map[altLocale].href;
      }
    }
    categoriesById[cat.id] = map;
  }

  for (const prod of publicInput.products || []) {
    const map = {};
    for (const locale of Object.keys(prod.locales || {})) {
      assertLocale(locale);
      const relPath = productPath(prod, locale);
      const slug = prod.locales[locale].slug;
      map[locale] = registerRoute(relPath, 'product', prod.id, locale, slug);
    }
    for (const locale of Object.keys(map)) {
      for (const altLocale of Object.keys(map)) {
        map[locale].alternates[altLocale] = map[altLocale].url;
        map[locale].alternateHrefs[altLocale] = map[altLocale].href;
      }
    }
    productsById[prod.id] = map;
  }

  function resolveAsset(publicPath) {
    if (typeof publicPath !== 'string' || !publicPath.trim()) {
      throw makeError('INVALID_PUBLIC_PATH', 'Asset publicPath must be a non-empty string');
    }
    const encoded = encodePathSegments(publicPath.replace(/^\/+/, ''));
    return `${normBasePath}/${encoded}`;
  }

  function resolvePage(relPath) {
    const clean = relPath.startsWith('/') ? relPath : `/${relPath}`;
    return `${normBasePath}${clean}`;
  }

  function enquiryUrl(locale, { intent = 'quote', product = '', variant = '', resource = '' } = {}) {
    assertLocale(locale);
    const params = new URLSearchParams();
    if (intent) params.set('intent', intent);
    if (product) params.set('product', product);
    if (variant) params.set('variant', variant);
    if (resource) params.set('resource', resource);
    params.set('locale', locale);
    return `${normBasePath}/${locale}/contact.html?${params.toString()}`;
  }

  return {
    origin: normOrigin,
    basePath: normBasePath,
    products: productsById,
    categories: categoriesById,
    all,
    resolveAsset,
    resolvePage,
    enquiryUrl,
  };
}
