/**
 * Truthful preview-mode enquiry handoff script for localized EN/DE contact pages.
 * - Pre-fills exact full variant modelCode, product, intent, and resource from URL
 *   query parameters using the embedded public allowlist only.
 * - Safely ignores invalid or malicious query parameter values.
 * - Keeps all fields editable on submit (never simulates real delivery/persistence).
 * - Preserves only non-personal product/variant/intent/resource context when
 *   switching between EN and DE contact pages.
 */

const DEFAULT_INTENTS = ['application', 'sample', 'quote', 'documents', 'general'];

const STATUS_MESSAGES = {
  en: 'Preview only. Nothing was sent or stored. You can continue editing.',
  de: 'Nur Vorschau. Es wurde nichts gesendet oder gespeichert. Sie können weiter bearbeiten.',
};

/**
 * Resolves safe prefill values from a URL query string against allowlisted public
 * catalogue identities. Invalid or unknown values are ignored safely.
 */
export function resolveEnquiryPrefill(search, catalogueData = {}) {
  const params = new URLSearchParams(search || '');
  const allowedIntents = new Set(
    Array.isArray(catalogueData.allowedIntents) && catalogueData.allowedIntents.length > 0
      ? catalogueData.allowedIntents
      : DEFAULT_INTENTS,
  );

  const validModelCodes = new Set();
  const variantById = new Map();
  const productById = new Map();

  for (const prod of catalogueData.products || []) {
    if (!prod || typeof prod !== 'object') continue;
    const primaryCode =
      Array.isArray(prod.modelCodes) && typeof prod.modelCodes[0] === 'string'
        ? prod.modelCodes[0].trim()
        : '';
    if (prod.id && primaryCode) {
      productById.set(prod.id, primaryCode);
    }
    for (const code of prod.modelCodes || []) {
      if (typeof code === 'string' && code.trim()) {
        validModelCodes.add(code.trim());
      }
    }
    for (const variant of prod.variants || []) {
      if (variant && typeof variant.id === 'string' && typeof variant.modelCode === 'string') {
        const cleanCode = variant.modelCode.trim();
        if (cleanCode) {
          variantById.set(variant.id, cleanCode);
          validModelCodes.add(cleanCode);
        }
      }
    }
  }

  const resourceById = new Map();
  for (const res of catalogueData.resources || []) {
    if (res && typeof res.id === 'string' && res.id.trim()) {
      resourceById.set(res.id, res);
    }
  }

  const rawIntent = (params.get('intent') || '').trim();
  const rawVariant = (params.get('variant') || '').trim();
  const rawProduct = (params.get('product') || '').trim();
  const rawResource = (params.get('resource') || '').trim();

  let resolvedVariant = '';
  let resolvedProduct = '';

  if (rawVariant && variantById.has(rawVariant)) {
    resolvedVariant = rawVariant;
    resolvedProduct = variantById.get(rawVariant);
  } else if (rawProduct) {
    if (validModelCodes.has(rawProduct)) {
      resolvedProduct = rawProduct;
    } else if (productById.has(rawProduct)) {
      resolvedProduct = productById.get(rawProduct);
    }
  }

  let resolvedResource = '';
  let resolvedResourceLabel = '';
  if (rawResource && resourceById.has(rawResource)) {
    const res = resourceById.get(rawResource);
    resolvedResource = res.id;
    resolvedResourceLabel = `${res.id} (${res.type} ${res.revision})`;
  }

  let resolvedIntent = 'application';
  if (rawIntent && allowedIntents.has(rawIntent)) {
    resolvedIntent = rawIntent;
  } else if (resolvedResource && allowedIntents.has('documents')) {
    resolvedIntent = 'documents';
  } else if (resolvedProduct && allowedIntents.has('quote')) {
    resolvedIntent = 'quote';
  }

  return {
    intent: resolvedIntent,
    product: resolvedProduct,
    variant: resolvedVariant,
    resource: resolvedResource,
    resourceLabel: resolvedResourceLabel,
  };
}

/**
 * Builds the alternate-locale contact URL carrying ONLY non-personal enquiry
 * context (intent, product, variant, resource). Personal form values are never
 * serialized into URLs.
 */
export function buildLanguageSwitchHref(baseHref, context = {}) {
  if (!baseHref || typeof baseHref !== 'string') return '';
  const cleanBase = baseHref.split('?')[0];
  const params = new URLSearchParams();
  if (typeof context.intent === 'string' && context.intent.trim()) {
    params.set('intent', context.intent.trim());
  }
  if (typeof context.product === 'string' && context.product.trim()) {
    params.set('product', context.product.trim());
  }
  if (typeof context.variant === 'string' && context.variant.trim()) {
    params.set('variant', context.variant.trim());
  }
  if (typeof context.resource === 'string' && context.resource.trim()) {
    params.set('resource', context.resource.trim());
  }
  const qs = params.toString();
  return qs ? `${cleanBase}?${qs}` : cleanBase;
}

function initEnquiryPreview() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const form = document.getElementById('enquiry-form');
  if (!form) return;
  form.hidden = false;

  let catalogueData = {};
  const dataEl = document.getElementById('enquiry-catalogue-data');
  if (dataEl && dataEl.textContent) {
    try {
      catalogueData = JSON.parse(dataEl.textContent);
    } catch {
      catalogueData = {};
    }
  }

  const locale = catalogueData.locale === 'de' ? 'de' : 'en';
  const prefill = resolveEnquiryPrefill(window.location.search, catalogueData);

  const intentEl = form.elements.namedItem('intent');
  const productEl = form.elements.namedItem('product');
  const resourceEl = form.elements.namedItem('resource');
  const contextNoteEl = document.getElementById('enquiry-context-note');

  if (intentEl && prefill.intent) {
    intentEl.value = prefill.intent;
  }
  if (productEl && prefill.product) {
    productEl.value = prefill.product;
  }
  if (resourceEl && prefill.resource) {
    resourceEl.value = prefill.resourceLabel || prefill.resource;
  }

  if (contextNoteEl && (prefill.product || prefill.resource)) {
    const parts = [];
    if (prefill.product) parts.push(prefill.product);
    if (prefill.resourceLabel) parts.push(prefill.resourceLabel);
    contextNoteEl.textContent =
      locale === 'de'
        ? `Vorausgefüllter Kontext: ${parts.join(' · ')}`
        : `Pre-filled context: ${parts.join(' · ')}`;
    contextNoteEl.hidden = false;
  }

  // Keep alternate locale link synchronized with non-personal product context only
  const langLink = document.querySelector('.lang-switch .lang-link');
  const validModelCodes = new Set();
  for (const prod of catalogueData.products || []) {
    for (const code of prod.modelCodes || []) validModelCodes.add(code);
    for (const v of prod.variants || []) validModelCodes.add(v.modelCode);
  }

  const syncLangLink = () => {
    if (!langLink || !catalogueData.alternateContactHref) return;
    const currentProduct = productEl ? productEl.value.trim() : '';
    const safeProduct = validModelCodes.has(currentProduct) ? currentProduct : '';
    const safeVariant = safeProduct === prefill.product ? prefill.variant : '';
    const safeIntent = intentEl ? intentEl.value.trim() : prefill.intent;
    langLink.setAttribute(
      'href',
      buildLanguageSwitchHref(catalogueData.alternateContactHref, {
        intent: safeIntent,
        product: safeProduct,
        variant: safeVariant,
        resource: prefill.resource,
      }),
    );
  };

  syncLangLink();
  if (intentEl) intentEl.addEventListener('change', syncLangLink);
  if (productEl) productEl.addEventListener('input', syncLangLink);

  const preview = document.getElementById('draft-preview');
  const status = document.getElementById('draft-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (preview) preview.hidden = false;
    if (status) status.textContent = STATUS_MESSAGES[locale];
    // Truthful preview: keep all form controls editable (never disable fields).
    if (preview) preview.focus();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnquiryPreview);
  } else {
    initEnquiryPreview();
  }
}
