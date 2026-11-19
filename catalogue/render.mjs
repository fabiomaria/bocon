/**
 * Shared Signal HTML renderers for Bocon product and category pages.
 * Reuses Signal design tokens and classes (v2/assets/tokens.css + v2/assets/site.css)
 * plus narrowly scoped responsive rules in assets/catalogue.css.
 *
 * Zero per-model layout code: one shared four-block layout for `probe`, with
 * bounded table bodies for `element` and `equipment`.
 * All dynamic strings are strictly HTML-escaped.
 */

import { SPEC_ROWS, SUPPORTED_LOCALES } from './validate.mjs';
import { assertLocale } from './routes.mjs';

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

const KNOWN_WIRING_PRESETS = new Set([
  'lead-2w',
  'lead-3w',
  'lead-4w',
  'lead-dual-4w',
  'lead-dual-6w',
  'head-2w',
  'head-3w',
  'head-4w',
  'head-dual-4w',
  'head-dual-6w',
  'tx-2w',
  'tx-3w',
]);

const UI = {
  en: {
    skip: 'Skip to content',
    home: 'Home',
    products: 'Products',
    contact: 'Contact',
    navLabel: 'Main navigation',
    breadcrumbLabel: 'Breadcrumb',
    langSwitchLabel: 'Language selection',
    langUnavailable: 'Not available in German',
    otherLocaleCode: 'DE',
    currentLocaleCode: 'EN',
    sendEnquiry: 'Send an enquiry',
    openDocument: 'Open document',
    variantEnquiriesHeading: 'Enquire by exact model configuration',
    enquireForVariant: (code) => `Enquire about ${code}`,
    noPhotoAvailable: 'No verified product photograph is currently published for this model.',
    techSpecsHeading: 'Technical specifications',
    captions: {
      probe: 'Unified Sensor Datasheet',
      element: 'Sensing Element Datasheet',
      equipment: 'Test Equipment Datasheet',
    },
    rowLabels: {
      probe: {
        applications: 'Applications',
        elementAccuracy: 'Sensing Element & Accuracy',
        range: 'Measuring Range',
        material: 'Wetted / Housing Material',
        geometry: 'Dimensions & Geometry',
        connection: 'Process Connection',
        leads: 'Lead Wire & Termination',
        performance: 'Performance & Electrical',
        protection: 'Protection & Ratings',
      },
      element: {
        applications: 'Applications',
        elementAccuracy: 'Sensing Element & Accuracy',
        range: 'Operating Range',
        material: 'Substrate & Lead Material',
        geometry: 'Chip Dimensions & Geometry',
        connection: 'Mounting & Integration',
        leads: 'Lead Configuration',
        performance: 'Electrical & Thermal Performance',
        protection: 'Environmental Ratings',
      },
      equipment: {
        applications: 'Applications',
        elementAccuracy: 'Measurement Accuracy',
        range: 'Operating / Test Range',
        material: 'Enclosure & Construction',
        geometry: 'Dimensions & Geometry',
        connection: 'Test Interface & Connection',
        leads: 'Power & Signal Connections',
        performance: 'Performance & Electrical',
        protection: 'Protection & Compliance',
      },
    },
    unknownValue: 'Not specified in source',
    rangeTo: 'to',
    wiringHeading: 'Wiring configuration',
    wiringIntro: 'Verified wiring configurations documented for the listed model variants:',
    downloadsHeading: 'Downloads & documentation',
    noDocuments: 'No public technical documents are currently published for this product.',
    requestOnlyBadge: 'Request only',
    requestDocumentAction: 'Request this document',
    downloadAction: 'Download',
    languageLabel: 'Language',
    revisionLabel: 'Revision',
    variantsScopeLabel: 'Applies to',
    certificateScopeLabels: {
      issuer: 'Issuer',
      holder: 'Holder',
      site: 'Site',
      scope: 'Scope',
      validity: 'Validity',
    },
    approvalHeading: 'Qualification & custom configurations',
    approvalBody:
      'Need specific probe lengths, custom terminations, or qualification documentation for your application?',
    approvalAction: 'Request technical documents',
    closingHeading: 'Request a quote or engineering review',
    closingBody: (codes) =>
      `Specify your exact model code (${codes}), operating temperature range, required quantity, and any special options.`,
    backToCategory: (title) => `View all products in ${title}`,
    requestSamples: 'Request samples',
    requestQuote: 'Request a quote',
    resourceTypes: {
      datasheet: 'Datasheet',
      brochure: 'Brochure',
      manual: 'Manual',
      certificate: 'Certificate',
      drawing: 'Drawing',
      declaration: 'Declaration',
    },
    categoryCompareHeading: 'Quick specification comparison',
    compareHeaders: {
      model: 'Model',
      range: 'Range',
      element: 'Element / Accuracy',
      protection: 'Protection',
      action: 'Action',
    },
    viewProduct: 'View specifications',
    emptyCategory: 'No reviewed products are currently published in this category for English.',
    hubEyebrow: 'Product Catalogue',
    hubTitle: 'Temperature Sensors, Elements & Test Equipment',
    hubIntro:
      'Explore verified Bocon sensor categories, thin-film platinum elements, and response-time testing equipment. Categories without reviewed product records are noted honestly below.',
    hubProductCount: (n) => (n === 1 ? '1 published product' : `${n} published products`),
    hubCategoryPending: 'Source verification in progress — no published products in English yet.',
    hubEmptyCatalogue: 'No reviewed categories or products are currently published for English.',
    hubClosingHeading: 'Looking for a specific model or custom OEM sensor?',
    hubClosingBody:
      'Send your model code, temperature range, geometry, or drawing for an engineering review or quote.',
    contactTitle: 'Preview your sensor enquiry.',
    contactSeoTitle: 'Contact Engineering — Enquiry Preview',
    contactSeoDescription:
      'Truthful enquiry preview for Bocon platinum temperature sensors, elements, and test equipment.',
    contactLead:
      'Online enquiry delivery is not connected yet. This page demonstrates the structured enquiry fields and product handoff.',
    previewNoticeTitle: 'Enquiry preview only. Online submission is unavailable.',
    previewNoticeBody:
      'Do not enter personal or confidential information. Nothing submitted in this preview form is transmitted or stored.',
    previewFormNote: 'Preview form: nothing is sent or stored yet.',
    previewSubmitBtn: 'Preview enquiry →',
    previewResultHeading: 'Enquiry preview',
    previewResultBody: 'Nothing was sent or stored. You can continue editing your draft.',
    fieldName: 'Name',
    fieldCompany: 'Company',
    fieldEmail: 'Work email',
    fieldCountry: 'Country / region',
    fieldOptional: '(optional)',
    fieldIntent: 'Enquiry type',
    intents: {
      application: 'Application question',
      sample: 'Sample request',
      quote: 'Quote request',
      documents: 'Certificates & documents',
      general: 'General enquiry',
    },
    fieldProduct: 'Model or custom configuration',
    fieldProductPlaceholder: 'Select a known model or enter a custom requirement',
    fieldQuantity: 'Quantity',
    fieldQuantityUnit: 'Quantity unit',
    quantityUnits: {
      sensors: 'Sensors / single units',
      pairs: 'Matched pairs',
    },
    fieldResource: 'Document reference',
    fieldResourcePlaceholder: 'Optional document ID',
    fieldRequirements: 'Your requirements',
    fieldRequirementsPlaceholder:
      'Temperature range, element (Pt100 / Pt500 / Pt1000), wiring, probe diameter and length, thread, cable, and quantity.',
    noscriptNotice:
      'Online submission is unavailable. Please email your requirements to',
    infoIncludeHeading: 'What to include',
    infoIncludeItems: [
      'Element and wiring: Pt100, Pt500, or Pt1000; 2, 3, or 4-wire, dual element, or matched pair',
      'Dimensions: tube diameter, insertion length, and process connection',
      'Cable material and length, sample quantity (sensors vs. matched pairs), and estimated annual volume',
    ],
    footerSummary:
      'Dalian Bocon Science & Technology Co., Ltd. designs and manufactures platinum temperature sensors, elements, and test equipment for OEMs and industry.',
    footerProducts: 'Products',
    footerContact: 'Enquiries',
    footerLegalNotice: 'Legal notice',
    footerPrivacy: 'Privacy',
    copyright: '© 2026 Dalian Bocon Science & Technology Co., Ltd.',
  },
  de: {
    skip: 'Zum Inhalt springen',
    home: 'Startseite',
    products: 'Produkte',
    contact: 'Kontakt',
    navLabel: 'Hauptnavigation',
    breadcrumbLabel: 'Brotkrumennavigation',
    langSwitchLabel: 'Sprachauswahl',
    langUnavailable: 'Auf Englisch nicht verfügbar',
    otherLocaleCode: 'EN',
    currentLocaleCode: 'DE',
    sendEnquiry: 'Anfrage senden',
    openDocument: 'Dokument öffnen',
    variantEnquiriesHeading: 'Anfrage nach exakter Modellkonfiguration',
    enquireForVariant: (code) => `Anfrage zu ${code}`,
    noPhotoAvailable: 'Für dieses Modell ist derzeit kein geprüftes Produktfoto veröffentlicht.',
    techSpecsHeading: 'Technische Daten',
    captions: {
      probe: 'Einheitliches Fühler-Datenblatt',
      element: 'Messelement-Datenblatt',
      equipment: 'Prüfgerät-Datenblatt',
    },
    rowLabels: {
      probe: {
        applications: 'Einsatzbereiche',
        elementAccuracy: 'Messelement & Genauigkeit',
        range: 'Messbereich',
        material: 'Mediumberührte Werkstoffe / Gehäuse',
        geometry: 'Abmessungen & Geometrie',
        connection: 'Prozessanschluss',
        leads: 'Anschlussleitung & Konfektionierung',
        performance: 'Leistung & Elektrik',
        protection: 'Schutzart & Zulassungen',
      },
      element: {
        applications: 'Einsatzbereiche',
        elementAccuracy: 'Messelement & Genauigkeit',
        range: 'Betriebsbereich',
        material: 'Substrat & Anschlusswerkstoff',
        geometry: 'Chip-Abmessungen & Geometrie',
        connection: 'Montage & Integration',
        leads: 'Anschlusskonfiguration',
        performance: 'Elektrische & thermische Kennwerte',
        protection: 'Umgebungsbedingungen',
      },
      equipment: {
        applications: 'Einsatzbereiche',
        elementAccuracy: 'Messgenauigkeit',
        range: 'Betriebs- / Prüfbereich',
        material: 'Gehäuse & Aufbau',
        geometry: 'Abmessungen & Geometrie',
        connection: 'Prüfschnittstelle & Anschluss',
        leads: 'Versorgung & Signalanschlüsse',
        performance: 'Leistung & Elektrik',
        protection: 'Schutzart & Konformität',
      },
    },
    unknownValue: 'Nicht in Quelle angegeben',
    rangeTo: 'bis',
    wiringHeading: 'Anschlussschema',
    wiringIntro: 'Geprüfte Anschlusskonfigurationen für die aufgeführten Modellvarianten:',
    downloadsHeading: 'Downloads & Dokumentation',
    noDocuments: 'Für dieses Produkt sind derzeit keine öffentlichen Dokumente veröffentlicht.',
    requestOnlyBadge: 'Auf Anfrage',
    requestDocumentAction: 'Dokument anfragen',
    downloadAction: 'Herunterladen',
    languageLabel: 'Sprache',
    revisionLabel: 'Revision',
    variantsScopeLabel: 'Gültig für',
    certificateScopeLabels: {
      issuer: 'Aussteller',
      holder: 'Inhaber',
      site: 'Standort',
      scope: 'Geltungsbereich',
      validity: 'Gültigkeitsdauer',
    },
    approvalHeading: 'Qualifizierung & Sonderausführungen',
    approvalBody:
      'Benötigen Sie kundenspezifische Fühlerlängen, spezielle Anschlussleitungen oder Qualifizierungsunterlagen?',
    approvalAction: 'Technische Dokumente anfragen',
    closingHeading: 'Angebot oder technische Klärung anfragen',
    closingBody: (codes) =>
      `Bitte nennen Sie die genaue Modellbezeichnung (${codes}), den Temperaturbereich, die Stückzahl sowie gewünschte Optionen.`,
    backToCategory: (title) => `Alle Produkte in ${title} ansehen`,
    requestSamples: 'Muster anfragen',
    requestQuote: 'Angebot anfragen',
    resourceTypes: {
      datasheet: 'Datenblatt',
      brochure: 'Broschüre',
      manual: 'Handbuch',
      certificate: 'Zertifikat',
      drawing: 'Zeichnung',
      declaration: 'Erklärung',
    },
    categoryCompareHeading: 'Schnellvergleich der Kennwerte',
    compareHeaders: {
      model: 'Modell',
      range: 'Bereich',
      element: 'Element / Genauigkeit',
      protection: 'Schutzart',
      action: 'Aktion',
    },
    viewProduct: 'Technische Daten',
    emptyCategory: 'In dieser Kategorie sind derzeit keine geprüften deutschen Produkte veröffentlicht.',
    hubEyebrow: 'Produktkatalog',
    hubTitle: 'Temperaturfühler, Messelemente & Prüfgeräte',
    hubIntro:
      'Übersicht der geprüften Bocon-Sensorserien, Dünnschicht-Platinmesselemente und Ansprechzeitprüfgeräte. Kategorien ohne freigegebene Produktdatensätze werden unten transparent ausgewiesen.',
    hubProductCount: (n) => (n === 1 ? '1 veröffentlichtes Produkt' : `${n} veröffentlichte Produkte`),
    hubCategoryPending: 'Quellenprüfung läuft — derzeit noch keine deutschen Produktseiten veröffentlicht.',
    hubEmptyCatalogue: 'Derzeit sind keine geprüften deutschen Kategorien oder Produkte veröffentlicht.',
    hubClosingHeading: 'Suchen Sie eine bestimmte Ausführung oder kundenspezifische OEM-Sensoren?',
    hubClosingBody:
      'Nennen Sie uns Modellbezeichnung, Temperaturbereich, Einbaumaße oder senden Sie Ihre Zeichnung für eine technische Prüfung.',
    contactTitle: 'Vorschau Ihrer Sensor-Anfrage.',
    contactSeoTitle: 'Kontakt & Technik — Anfrage-Vorschau',
    contactSeoDescription:
      'Ehrliche Anfrage-Vorschau für Bocon Platin-Temperaturfühler, Messelemente und Prüfgeräte.',
    contactLead:
      'Der Online-Anfrageversand ist noch nicht angebunden. Diese Seite zeigt die strukturierten Anfragefelder und die Produktübergabe.',
    previewNoticeTitle: 'Nur Anfrage-Vorschau. Online-Versand ist derzeit nicht aktiv.',
    previewNoticeBody:
      'Bitte geben Sie keine personenbezogenen oder vertraulichen Daten ein. Eingaben in diesem Vorschauformular werden weder übertragen noch gespeichert.',
    previewFormNote: 'Vorschauformular: Es wird noch nichts gesendet oder gespeichert.',
    previewSubmitBtn: 'Anfrage-Vorschau anzeigen →',
    previewResultHeading: 'Anfrage-Vorschau',
    previewResultBody: 'Es wurde nichts gesendet oder gespeichert. Sie können Ihren Entwurf weiter bearbeiten.',
    fieldName: 'Name',
    fieldCompany: 'Unternehmen',
    fieldEmail: 'Geschäftliche E-Mail',
    fieldCountry: 'Land / Region',
    fieldOptional: '(optional)',
    fieldIntent: 'Anfrageart',
    intents: {
      application: 'Anwendungsfrage',
      sample: 'Musteranfrage',
      quote: 'Angebotsanfrage',
      documents: 'Zertifikate & Dokumente',
      general: 'Allgemeine Anfrage',
    },
    fieldProduct: 'Modell oder kundenspezifische Ausführung',
    fieldProductPlaceholder: 'Bekanntes Modell wählen oder eigene Anforderung eingeben',
    fieldQuantity: 'Stückzahl',
    fieldQuantityUnit: 'Einheit',
    quantityUnits: {
      sensors: 'Fühler / Einzelstücke',
      pairs: 'Gepaarte Fühlerpaare',
    },
    fieldResource: 'Dokumentreferenz',
    fieldResourcePlaceholder: 'Optionale Dokument-ID',
    fieldRequirements: 'Ihre Anforderungen',
    fieldRequirementsPlaceholder:
      'Temperaturbereich, Messelement (Pt100 / Pt500 / Pt1000), Schaltungsart, Schutzrohr-Durchmesser und -Länge, Prozessanschluss, Leitung und Stückzahl.',
    noscriptNotice:
      'Der Online-Versand ist derzeit nicht aktiv. Bitte senden Sie Ihre Anforderungen per E-Mail an',
    infoIncludeHeading: 'Hilfreiche Angaben',
    infoIncludeItems: [
      'Messelement und Schaltungsart: Pt100, Pt500 oder Pt1000; 2-, 3- oder 4-Leiter, Doppelelement oder gepaartes Fühlerpaar',
      'Abmessungen: Schutzrohr-Durchmesser, Einbaulänge und Prozessanschluss',
      'Leitungsmaterial und -länge, Musterstückzahl (Einzelfühler vs. Fühlerpaare) sowie geschätzter Jahresbedarf',
    ],
    footerSummary:
      'Dalian Bocon Science & Technology Co., Ltd. entwickelt und fertigt Platin-Temperaturfühler, Messelemente und Prüfgeräte für OEMs und Industrie.',
    footerProducts: 'Produkte',
    footerContact: 'Anfragen',
    footerLegalNotice: 'Impressum',
    footerPrivacy: 'Datenschutz',
    copyright: '© 2026 Dalian Bocon Science & Technology Co., Ltd.',
  },
};

function formatNumber(num, locale) {
  const intlLocale = locale === 'de' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(intlLocale, {
    useGrouping: false,
    maximumFractionDigits: 10,
  }).format(num);
}

export function formatLanguageLabel(langCode) {
  if (!langCode) return '';
  return String(langCode)
    .split(/[-_/,]+/)
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean)
    .join(' / ');
}

export function formatSpecValue(spec, locale) {
  const ui = UI[locale];
  const unitSuffix = spec.unit ? ` ${spec.unit}` : '';
  const val = spec.value;

  if (val === null) {
    return {
      isUnknown: true,
      text: ui.unknownValue,
    };
  }
  if (typeof val === 'number') {
    return {
      isUnknown: false,
      text: `${formatNumber(val, locale)}${unitSuffix}`,
    };
  }
  if (typeof val === 'string') {
    return {
      isUnknown: false,
      text: `${val}${unitSuffix}`,
    };
  }
  if (val && typeof val === 'object') {
    if ('min' in val && 'max' in val) {
      return {
        isUnknown: false,
        text: `${formatNumber(val.min, locale)} ${ui.rangeTo} ${formatNumber(val.max, locale)}${unitSuffix}`,
      };
    }
    const localized = val[locale] ?? val.en ?? val.de ?? '';
    return {
      isUnknown: false,
      text: `${localized}${unitSuffix}`,
    };
  }
  return {
    isUnknown: true,
    text: ui.unknownValue,
  };
}

function renderHreflangLinks(route) {
  if (!route || !route.alternates) return '';
  const lines = [];
  for (const altLocale of SUPPORTED_LOCALES) {
    if (route.alternates[altLocale]) {
      lines.push(
        `  <link rel="alternate" hreflang="${escapeHtml(altLocale)}" href="${escapeHtml(route.alternates[altLocale])}">`,
      );
    }
  }
  if (route.alternates.en) {
    lines.push(
      `  <link rel="alternate" hreflang="x-default" href="${escapeHtml(route.alternates.en)}">`,
    );
  }
  return lines.join('\n');
}

function renderLanguageSwitcher(locale, route) {
  const ui = UI[locale];
  const otherLocale = locale === 'en' ? 'de' : 'en';
  const otherHref = route?.alternateHrefs?.[otherLocale];

  const items = SUPPORTED_LOCALES.map((loc) => {
    const code = loc.toUpperCase();
    if (loc === locale) {
      return `<span class="lang-current" aria-current="true">${code}</span>`;
    }
    if (otherHref) {
      return `<a class="lang-link" href="${escapeHtml(otherHref)}" hreflang="${loc}" lang="${loc}">${code}</a>`;
    }
    return `<span class="lang-unavailable" aria-disabled="true" title="${escapeHtml(ui.langUnavailable)}">${code}</span>`;
  });

  return `<nav class="lang-switch" aria-label="${escapeHtml(ui.langSwitchLabel)}">${items.join('<span aria-hidden="true"> / </span>')}</nav>`;
}

function renderShell({
  locale,
  seoTitle,
  seoDescription,
  route,
  routes,
  noindex,
  bodyClass,
  activeNav = 'products',
  mainHtml,
  extraScripts = '',
}) {
  const ui = UI[locale];
  const fullTitle = seoTitle.includes('Bocon') ? seoTitle : `${seoTitle} | Bocon`;
  const robotsMeta = noindex ? '\n  <meta name="robots" content="noindex, nofollow">' : '';
  const canonicalTag = route?.url
    ? `\n  <link rel="canonical" href="${escapeHtml(route.url)}">`
    : '';
  const hreflangTags = renderHreflangLinks(route);
  const hreflangBlock = hreflangTags ? `\n${hreflangTags}` : '';

  const homeHref = routes.resolvePage('/index.html');
  const productsHref = routes.resolvePage(`/${locale}/products/index.html`);
  const contactHref = routes.enquiryUrl(locale, { intent: 'general' });
  const fullBodyClass = bodyClass ? `catalogue-page ${bodyClass}` : 'catalogue-page';
  const productsCurrent = activeNav === 'products' ? ' aria-current="true"' : '';
  const contactCurrent = activeNav === 'contact' ? ' aria-current="true"' : '';

  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(seoDescription)}">${robotsMeta}${canonicalTag}${hreflangBlock}
  <meta name="theme-color" content="#12294A">
  <link rel="stylesheet" href="${escapeHtml(routes.resolveAsset('v2/assets/tokens.css'))}">
  <link rel="stylesheet" href="${escapeHtml(routes.resolveAsset('v2/assets/site.css'))}">
  <link rel="stylesheet" href="${escapeHtml(routes.resolveAsset('assets/catalogue.css'))}">
</head>
<body class="${escapeHtml(fullBodyClass)}">
  <a class="skip" href="#main">${escapeHtml(ui.skip)}</a>
  <header>
    <div class="wrap nav">
      <a class="brand" href="${escapeHtml(homeHref)}" aria-label="Bocon ${escapeHtml(ui.home)}"><img src="${escapeHtml(routes.resolveAsset('v2/logo/bocon-wordmark.png'))}" width="272" height="92" alt="Bocon"></a>
      <nav class="menu" id="main-menu" aria-label="${escapeHtml(ui.navLabel)}">
        <ul class="menu-list">
          <li><a href="${escapeHtml(productsHref)}"${productsCurrent}>${escapeHtml(ui.products)}</a></li>
          <li><a href="${escapeHtml(contactHref)}"${contactCurrent}>${escapeHtml(ui.contact)}</a></li>
        </ul>
      </nav>
      <div class="nav-cta">
        ${renderLanguageSwitcher(locale, route)}
        <a class="btn primary" href="${escapeHtml(contactHref)}">${escapeHtml(ui.contact)}</a>
      </div>
    </div>
  </header>
  <main id="main">
${mainHtml}
  </main>
  <footer>
    <div class="wrap">
      <div class="foot">
        <div>
          <a href="${escapeHtml(homeHref)}" class="footer-brand">BOCON</a>
          <p>${escapeHtml(ui.footerSummary)}</p>
        </div>
        <div>
          <h4>${escapeHtml(ui.footerProducts)}</h4>
          <a href="${escapeHtml(productsHref)}">${escapeHtml(ui.products)}</a>
        </div>
        <div>
          <h4>${escapeHtml(ui.footerContact)}</h4>
          <a href="${escapeHtml(contactHref)}">${escapeHtml(ui.sendEnquiry)}</a>
        </div>
      </div>
      <div class="foot-bar">
        <span>${escapeHtml(ui.copyright)}</span>
        <span class="legal-links">
          <a href="${escapeHtml(routes.resolvePage('/v2/impressum.html'))}">${escapeHtml(ui.footerLegalNotice)}</a>
          <a href="${escapeHtml(routes.resolvePage('/v2/privacy.html'))}">${escapeHtml(ui.footerPrivacy)}</a>
        </span>
      </div>
    </div>
  </footer>${extraScripts}
</body>
</html>`;
}

function renderSpecItem(spec, locale, variantById) {
  const formatted = formatSpecValue(spec, locale);
  const variant = spec.configurationId ? variantById.get(spec.configurationId) : null;
  const variantPrefix = variant ? `<strong>${escapeHtml(variant.modelCode)}:</strong> ` : '';
  const factLabel = spec.label?.[locale] ? `${escapeHtml(spec.label[locale])}: ` : '';

  const valueHtml = formatted.isUnknown
    ? `<span class="spec-unknown">${escapeHtml(formatted.text)}</span>`
    : escapeHtml(formatted.text);

  const condText = spec.conditions?.[locale];
  const condHtml = condText ? `<small class="spec-condition">${escapeHtml(condText)}</small>` : '';

  return `<div class="spec-fact">${variantPrefix}${factLabel}${valueHtml}${condHtml}</div>`;
}

function collectRowFacts(product, rowKey) {
  const facts = [];
  for (const spec of product.specs || []) {
    if (spec.row === rowKey) {
      facts.push(spec);
    }
  }
  for (const variant of product.variants || []) {
    for (const spec of variant.specs || []) {
      if (spec.row === rowKey) {
        facts.push({
          ...spec,
          configurationId: spec.configurationId || variant.id,
        });
      }
    }
  }
  return facts;
}

function renderSpecTable(product, locale, loc, variantById) {
  const ui = UI[locale];
  const labels = ui.rowLabels[product.kind] || ui.rowLabels.probe;
  const caption = ui.captions[product.kind] || ui.captions.probe;

  const rowsHtml = [];

  for (const rowKey of SPEC_ROWS) {
    const facts = collectRowFacts(product, rowKey);
    const itemsHtml = [];

    if (rowKey === 'applications' && Array.isArray(loc.applications) && loc.applications.length > 0) {
      itemsHtml.push(
        `<div class="spec-fact">${loc.applications.map((a) => escapeHtml(a)).join(' · ')}</div>`,
      );
    }

    for (const fact of facts) {
      itemsHtml.push(renderSpecItem(fact, locale, variantById));
    }

    // Omit optional rows that have zero facts
    if (itemsHtml.length === 0) continue;

    rowsHtml.push(`                <tr>
                  <th scope="row">${escapeHtml(labels[rowKey])}</th>
                  <td>${itemsHtml.join('\n                    ')}</td>
                </tr>`);
  }

  return `<div class="spec-card">
            <div class="spec-table-scroll">
              <table class="spec-table">
                <caption>${escapeHtml(caption)} · ${escapeHtml(product.modelCodes.join(' · '))}</caption>
                <tbody>
${rowsHtml.join('\n')}
                </tbody>
              </table>
            </div>
          </div>`;
}

function renderWiringPanel(product, locale) {
  const ui = UI[locale];
  const variantEntries = (product.variants || []).filter(
    (v) => Array.isArray(v.wiringPresetIds) && v.wiringPresetIds.length > 0,
  );
  if (variantEntries.length === 0) {
    return { html: '', hasKnownPresets: false };
  }

  const allPresets = [];
  const seen = new Set();
  for (const v of variantEntries) {
    for (const pid of v.wiringPresetIds) {
      if (!seen.has(pid)) {
        seen.add(pid);
        allPresets.push(pid);
      }
    }
  }

  const knownPresets = allPresets.filter((pid) => KNOWN_WIRING_PRESETS.has(pid));

  const variantListHtml = variantEntries
    .map(
      (v) =>
        `<li><strong>${escapeHtml(v.modelCode)}:</strong> ${v.wiringPresetIds
          .map((pid) => `<span class="tag">${escapeHtml(pid)}</span>`)
          .join(' ')}</li>`,
    )
    .join('\n              ');

  const gridAttr =
    knownPresets.length > 0
      ? `\n            <div class="wiring-grid" data-wiring-presets="${escapeHtml(knownPresets.join(','))}"></div>`
      : '';

  return {
    hasKnownPresets: knownPresets.length > 0,
    html: `<aside class="wiring-panel" aria-labelledby="wiring-heading">
            <h3 id="wiring-heading">${escapeHtml(ui.wiringHeading)}</h3>
            <p>${escapeHtml(ui.wiringIntro)}</p>
            <ul class="wiring-variant-list">
              ${variantListHtml}
            </ul>${gridAttr}
          </aside>`,
  };
}

function renderResourceCard(res, product, locale, variantById, routes) {
  const ui = UI[locale];
  const typeLabel = ui.resourceTypes[res.type] || res.type;
  const langLabel = formatLanguageLabel(res.language);
  const variantNames = (res.variantIds || [])
    .map((vid) => variantById.get(vid)?.modelCode)
    .filter(Boolean);

  const metaParts = [
    `${ui.languageLabel}: ${langLabel}`,
    `${ui.revisionLabel}: ${res.revision}`,
  ];
  if (variantNames.length > 0) {
    metaParts.push(`${ui.variantsScopeLabel}: ${variantNames.join(', ')}`);
  }

  if (res.access === 'public' && res.publicPath) {
    const href = routes.resolveAsset(res.publicPath);
    return `<a class="download-card" href="${escapeHtml(href)}" download>
          <span class="file-icon" aria-hidden="true">${escapeHtml(langLabel || 'DOC')}</span>
          <span>
            <b>${escapeHtml(typeLabel)} · ${escapeHtml(res.revision)}</b>
            <small>${escapeHtml(metaParts.join(' · '))}</small>
          </span>
          <span class="download-arrow" aria-hidden="true">↓</span>
        </a>`;
  }

  // Request-only resource: NEVER emit a download href to null or private paths
  const requestHref = routes.enquiryUrl(locale, {
    intent: 'documents',
    product: product.modelCodes[0] || product.id,
    resource: res.id,
  });

  let certScopeHtml = '';
  if (res.certificateScope && typeof res.certificateScope === 'object') {
    const scopeEntries = Object.entries(res.certificateScope)
      .filter(([, val]) => val !== null && val !== undefined && String(val).trim() !== '')
      .map(([key, val]) => {
        const label = ui.certificateScopeLabels[key] || key;
        return `<span><strong>${escapeHtml(label)}:</strong> ${escapeHtml(val)}</span>`;
      });
    if (scopeEntries.length > 0) {
      certScopeHtml = `<div class="certificate-scope">${scopeEntries.join(' · ')}</div>`;
    }
  }

  return `<div class="download-card download-card-request">
          <span class="file-icon" aria-hidden="true">${escapeHtml(langLabel || 'DOC')}</span>
          <div class="download-card-body">
            <div class="download-card-head">
              <b>${escapeHtml(typeLabel)} · ${escapeHtml(res.revision)}</b>
              <span class="tag tag-request">${escapeHtml(ui.requestOnlyBadge)}</span>
            </div>
            <small>${escapeHtml(metaParts.join(' · '))}</small>
            ${certScopeHtml}
            <a class="text-link" href="${escapeHtml(requestHref)}">${escapeHtml(ui.requestDocumentAction)} →</a>
          </div>
        </div>`;
}

/**
 * Renders a complete HTML document for a public product record in the given locale.
 */
export function renderProduct(
  product,
  locale,
  { categories = [], resources = [], routes, noindex = false } = {},
) {
  assertLocale(locale);
  const loc = product.locales?.[locale];
  if (!loc) {
    const err = new Error(`Product "${product.id}" has no eligible "${locale}" locale`);
    err.code = 'LOCALE_NOT_AVAILABLE';
    throw err;
  }

  const ui = UI[locale];
  const route = routes?.products?.[product.id]?.[locale];
  const category = categories.find((c) => c.id === product.categoryId) || null;
  const catLocale = category?.locales?.[locale] || null;
  const catRoute = category ? routes?.categories?.[category.id]?.[locale] : null;

  const variantById = new Map((product.variants || []).map((v) => [v.id, v]));

  // Associated resources (preserving product.resourceIds order, deduplicated)
  const resourceById = new Map((resources || []).map((r) => [r.id, r]));
  const productResources = [];
  const seenRes = new Set();
  for (const rid of product.resourceIds || []) {
    const res = resourceById.get(rid);
    if (res && !seenRes.has(res.id)) {
      seenRes.add(res.id);
      productResources.push(res);
    }
  }

  const firstPublicDoc = productResources.find((r) => r.access === 'public' && r.publicPath);
  const primaryModelCode = product.modelCodes[0] || product.id;
  const primaryEnquiryHref = routes.enquiryUrl(locale, {
    intent: 'quote',
    product: primaryModelCode,
  });

  // Breadcrumbs
  const catCrumb = catLocale
    ? catRoute
      ? `<a href="${escapeHtml(catRoute.href)}">${escapeHtml(catLocale.title)}</a>`
      : `<span>${escapeHtml(catLocale.title)}</span>`
    : `<span>${escapeHtml(ui.products)}</span>`;

  const breadcrumbsHtml = `    <nav class="wrap breadcrumbs" aria-label="${escapeHtml(ui.breadcrumbLabel)}">
      <a href="${escapeHtml(routes.resolvePage('/index.html'))}">${escapeHtml(ui.home)}</a>
      <span aria-hidden="true">/</span>
      ${catCrumb}
      <span aria-hidden="true">/</span>
      <span aria-current="page">${escapeHtml(loc.title)}</span>
    </nav>`;

  // Block 1: Hero & Gallery
  const openDocBtn = firstPublicDoc
    ? `\n          <a class="btn ghost" href="${escapeHtml(routes.resolveAsset(firstPublicDoc.publicPath))}">${escapeHtml(ui.openDocument)} (${escapeHtml(formatLanguageLabel(firstPublicDoc.language))}) ↗</a>`
    : '';

  const variantEnquiryLinksHtml =
    Array.isArray(product.variants) && product.variants.length > 0
      ? `\n        <div class="variant-enquiries">
          <p class="variant-enquiries-label">${escapeHtml(ui.variantEnquiriesHeading)}</p>
          <ul class="variant-enquiry-list">
            ${product.variants
              .map((v) => {
                const href = routes.enquiryUrl(locale, {
                  intent: 'quote',
                  product: v.modelCode,
                  variant: v.id,
                });
                return `<li><a class="variant-enquiry-link" href="${escapeHtml(href)}">${escapeHtml(ui.enquireForVariant(v.modelCode))} →</a></li>`;
              })
              .join('\n            ')}
          </ul>
        </div>`
      : '';

  const galleryHtml =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
          .map((img) => {
            const altText = img.alt?.[locale] || img.alt?.en || img.alt?.de || loc.title;
            const imgVariant = img.variantId ? variantById.get(img.variantId) : null;
            const captionPrefix = imgVariant
              ? `<strong>${escapeHtml(imgVariant.modelCode)}</strong> · `
              : '';
            return `<figure class="product-stage compact-stage">
          <div class="product-photo"><img src="${escapeHtml(routes.resolveAsset(img.publicPath))}" alt="${escapeHtml(altText)}" loading="lazy"></div>
          <figcaption>${captionPrefix}${escapeHtml(altText)}</figcaption>
        </figure>`;
          })
          .join('\n        ')
      : `<div class="product-stage compact-stage product-stage-empty">
          <p>${escapeHtml(ui.noPhotoAvailable)}</p>
        </div>`;

  const heroHtml = `    <section class="wrap hero product-hero compact-product-hero" data-product-kind="${escapeHtml(product.kind)}">
      <div>
        <span class="eyebrow">${escapeHtml(catLocale ? catLocale.title : ui.products)}</span>
        <span class="model-code">${escapeHtml(product.modelCodes.join(' · '))}</span>
        <h1>${escapeHtml(loc.title)}</h1>
        <p class="lead">${escapeHtml(loc.summary)}</p>
        <div class="hero-actions">
          <a class="btn primary" href="${escapeHtml(primaryEnquiryHref)}">${escapeHtml(ui.sendEnquiry)} →</a>${openDocBtn}
        </div>${variantEnquiryLinksHtml}
      </div>
      <div class="product-gallery">
        ${galleryHtml}
      </div>
    </section>`;

  // Block 2: Technical Specifications & Wiring
  const specTableHtml = renderSpecTable(product, locale, loc, variantById);
  const wiring = renderWiringPanel(product, locale);
  const specLayoutClass = wiring.html ? 'spec-layout' : 'spec-layout spec-layout-single';

  const technicalHtml = `    <section class="soft-section compact-technical" id="specifications">
      <div class="wrap section-space">
        <h2>${escapeHtml(ui.techSpecsHeading)}</h2>
        <div class="${specLayoutClass}">
          ${specTableHtml}
          ${wiring.html}
        </div>
      </div>
    </section>`;

  // Block 3: Downloads & Resources
  const resourcesCardsHtml =
    productResources.length > 0
      ? productResources
          .map((res) => renderResourceCard(res, product, locale, variantById, routes))
          .join('\n        ')
      : `<p class="placeholder-note">${escapeHtml(ui.noDocuments)}</p>`;

  const docEnquiryHref = routes.enquiryUrl(locale, {
    intent: 'documents',
    product: primaryModelCode,
  });

  const downloadsHtml = `    <section class="wrap section-space compact-downloads" id="documents">
      <h2>${escapeHtml(ui.downloadsHeading)}</h2>
      <div class="resource-grid">
        <div class="resource-cards">
          ${resourcesCardsHtml}
        </div>
        <div class="approval-note">
          <h3>${escapeHtml(ui.approvalHeading)}</h3>
          <p>${escapeHtml(ui.approvalBody)}</p>
          <a class="text-link" href="${escapeHtml(docEnquiryHref)}">${escapeHtml(ui.approvalAction)} →</a>
        </div>
      </div>
    </section>`;

  // Block 4: Closing Contextual Contact CTA
  const backLinkHtml =
    catLocale && catRoute
      ? `\n          <a class="text-link" href="${escapeHtml(catRoute.href)}">${escapeHtml(ui.backToCategory(catLocale.title))} →</a>`
      : '';

  const sampleHref = routes.enquiryUrl(locale, { intent: 'sample', product: primaryModelCode });
  const quoteHref = routes.enquiryUrl(locale, { intent: 'quote', product: primaryModelCode });

  const closingHtml = `    <section class="wrap compact-contact">
      <div class="simple-product-contact">
        <div>
          <h2>${escapeHtml(ui.closingHeading)}</h2>
          <p>${escapeHtml(ui.closingBody(product.modelCodes.join(', ')))}</p>${backLinkHtml}
        </div>
        <div class="contact-actions">
          <a class="btn primary" href="${escapeHtml(primaryEnquiryHref)}">${escapeHtml(ui.sendEnquiry)} →</a>
          <div class="secondary-requests">
            <a href="${escapeHtml(sampleHref)}">${escapeHtml(ui.requestSamples)}</a>
            <a href="${escapeHtml(quoteHref)}">${escapeHtml(ui.requestQuote)}</a>
          </div>
        </div>
      </div>
    </section>`;

  const extraScripts = wiring.hasKnownPresets
    ? `\n  <script src="${escapeHtml(routes.resolveAsset('v2/assets/wiring-diagrams.js'))}" defer></script>`
    : '';

  return renderShell({
    locale,
    seoTitle: loc.seoTitle || loc.title,
    seoDescription: loc.seoDescription || loc.summary,
    route,
    routes,
    noindex,
    bodyClass: `sensor-family-page product-kind-${product.kind}`,
    mainHtml: [breadcrumbsHtml, heroHtml, technicalHtml, downloadsHtml, closingHtml].join('\n\n'),
    extraScripts,
  });
}

function summarizeRowForCompare(product, rowKey, locale) {
  const facts = collectRowFacts(product, rowKey);
  if (facts.length === 0) return '—';
  const variantById = new Map((product.variants || []).map((v) => [v.id, v]));
  return facts
    .map((f) => {
      const formatted = formatSpecValue(f, locale);
      const variant = f.configurationId ? variantById.get(f.configurationId) : null;
      const prefix = variant ? `${variant.modelCode}: ` : '';
      return `${prefix}${formatted.text}`;
    })
    .join('; ');
}

/**
 * Renders a complete HTML document for a public category record in the given locale.
 */
export function renderCategory(
  category,
  locale,
  { products = [], routes, noindex = false } = {},
) {
  assertLocale(locale);
  const loc = category.locales?.[locale];
  if (!loc) {
    const err = new Error(`Category "${category.id}" has no eligible "${locale}" locale`);
    err.code = 'LOCALE_NOT_AVAILABLE';
    throw err;
  }

  const ui = UI[locale];
  const route = routes?.categories?.[category.id]?.[locale];
  const productById = new Map((products || []).map((p) => [p.id, p]));

  const orderedProducts = (category.orderedProductIds || [])
    .map((pid) => productById.get(pid))
    .filter((p) => p && p.locales?.[locale] && routes?.products?.[p.id]?.[locale]);

  const breadcrumbsHtml = `    <nav class="wrap breadcrumbs" aria-label="${escapeHtml(ui.breadcrumbLabel)}">
      <a href="${escapeHtml(routes.resolvePage('/index.html'))}">${escapeHtml(ui.home)}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${escapeHtml(loc.title)}</span>
    </nav>`;

  const heroHtml = `    <section class="wrap section-space category-hero">
      <span class="eyebrow">${escapeHtml(ui.products)}</span>
      <h1>${escapeHtml(loc.title)}</h1>
      <p class="lead">${escapeHtml(loc.intro)}</p>
    </section>`;

  let contentHtml;
  if (orderedProducts.length === 0) {
    contentHtml = `    <section class="wrap section-space">
      <p class="placeholder-note">${escapeHtml(ui.emptyCategory)}</p>
    </section>`;
  } else {
    const cardsHtml = orderedProducts
      .map((prod) => {
        const pLoc = prod.locales[locale];
        const pRoute = routes.products[prod.id][locale];
        const firstImg = prod.images?.[0];
        const imgHtml = firstImg
          ? `<img src="${escapeHtml(routes.resolveAsset(firstImg.publicPath))}" alt="${escapeHtml(firstImg.alt?.[locale] || firstImg.alt?.en || pLoc.title)}" loading="lazy">`
          : '';
        return `<a class="product-card" href="${escapeHtml(pRoute.href)}">
          ${imgHtml}
          <div>
            <span class="model-label">${escapeHtml(prod.modelCodes.join(' · '))}</span>
            <h3>${escapeHtml(pLoc.title)}</h3>
            <p>${escapeHtml(pLoc.summary)}</p>
          </div>
        </a>`;
      })
      .join('\n        ');

    const compareRowsHtml = orderedProducts
      .map((prod) => {
        const pLoc = prod.locales[locale];
        const pRoute = routes.products[prod.id][locale];
        const enquiryHref = routes.enquiryUrl(locale, {
          intent: 'quote',
          product: prod.modelCodes[0] || prod.id,
        });
        return `<tr>
              <th scope="row">
                <a href="${escapeHtml(pRoute.href)}">${escapeHtml(pLoc.title)}</a>
                <small>${escapeHtml(prod.modelCodes.join(' · '))}</small>
              </th>
              <td>${escapeHtml(summarizeRowForCompare(prod, 'range', locale))}</td>
              <td>${escapeHtml(summarizeRowForCompare(prod, 'elementAccuracy', locale))}</td>
              <td>${escapeHtml(summarizeRowForCompare(prod, 'protection', locale))}</td>
              <td><a class="text-link" href="${escapeHtml(enquiryHref)}">${escapeHtml(ui.sendEnquiry)} →</a></td>
            </tr>`;
      })
      .join('\n            ');

    contentHtml = `    <section class="wrap section-space">
      <div class="product-grid">
        ${cardsHtml}
      </div>
    </section>

    <section class="soft-section">
      <div class="wrap section-space">
        <div class="section-head">
          <h2>${escapeHtml(ui.categoryCompareHeading)}</h2>
        </div>
        <div class="table-scroll">
          <table class="compare-table">
            <thead>
              <tr>
                <th scope="col">${escapeHtml(ui.compareHeaders.model)}</th>
                <th scope="col">${escapeHtml(ui.compareHeaders.range)}</th>
                <th scope="col">${escapeHtml(ui.compareHeaders.element)}</th>
                <th scope="col">${escapeHtml(ui.compareHeaders.protection)}</th>
                <th scope="col">${escapeHtml(ui.compareHeaders.action)}</th>
              </tr>
            </thead>
            <tbody>
              ${compareRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </section>`;
  }

  return renderShell({
    locale,
    seoTitle: loc.title,
    seoDescription: loc.intro,
    route,
    routes,
    noindex,
    bodyClass: `category-page category-kind-${category.kind}`,
    mainHtml: [breadcrumbsHtml, heroHtml, contentHtml].join('\n\n'),
  });
}

function makeStaticRoute(locale, relPath, routes) {
  const otherLocale = locale === 'en' ? 'de' : 'en';
  const otherRelPath = relPath.replace(`/${locale}/`, `/${otherLocale}/`);
  const href = routes.resolvePage(relPath);
  const otherHref = routes.resolvePage(otherRelPath);
  const url = routes.origin ? `${routes.origin}${href}` : href;
  const otherUrl = routes.origin ? `${routes.origin}${otherHref}` : otherHref;
  return {
    relPath,
    href,
    url,
    alternates: {
      [locale]: url,
      [otherLocale]: otherUrl,
    },
    alternateHrefs: {
      [locale]: href,
      [otherLocale]: otherHref,
    },
  };
}

/**
 * Renders the localized 8+2 catalogue hub (`en/products/index.html` or `de/products/index.html`).
 * Lists only eligible categories/products and notes readiness gaps honestly instead of dead links.
 */
export function renderCatalogueHub(publicInput, locale, { routes, noindex = false } = {}) {
  assertLocale(locale);
  const ui = UI[locale];
  const route = makeStaticRoute(locale, `/${locale}/products/index.html`, routes);

  const products = publicInput.products || [];
  const categories = publicInput.categories || [];
  const productById = new Map(products.map((p) => [p.id, p]));

  const breadcrumbsHtml = `    <nav class="wrap breadcrumbs" aria-label="${escapeHtml(ui.breadcrumbLabel)}">
      <a href="${escapeHtml(routes.resolvePage('/index.html'))}">${escapeHtml(ui.home)}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${escapeHtml(ui.products)}</span>
    </nav>`;

  const heroHtml = `    <section class="wrap section-space category-hero">
      <span class="eyebrow">${escapeHtml(ui.hubEyebrow)}</span>
      <h1>${escapeHtml(ui.hubTitle)}</h1>
      <p class="lead">${escapeHtml(ui.hubIntro)}</p>
    </section>`;

  const eligibleCategories = categories.filter((c) => Boolean(c.locales?.[locale]));

  let gridHtml;
  if (eligibleCategories.length === 0) {
    gridHtml = `    <section class="wrap section-space">
      <p class="placeholder-note">${escapeHtml(ui.hubEmptyCatalogue)}</p>
    </section>`;
  } else {
    const cards = eligibleCategories.map((cat) => {
      const catLoc = cat.locales[locale];
      const catRoute = routes?.categories?.[cat.id]?.[locale];
      const readyProducts = (cat.orderedProductIds || [])
        .map((pid) => productById.get(pid))
        .filter((p) => p && p.locales?.[locale] && routes?.products?.[p.id]?.[locale]);

      if (readyProducts.length > 0 && catRoute) {
        const modelSummary = readyProducts
          .flatMap((p) => p.modelCodes || [])
          .slice(0, 6)
          .join(' · ');
        return `<a class="hub-card" href="${escapeHtml(catRoute.href)}">
          <h2>${escapeHtml(catLoc.title)}</h2>
          <p>${escapeHtml(catLoc.intro)}</p>
          <span class="hub-card-meta">${escapeHtml(ui.hubProductCount(readyProducts.length))}${modelSummary ? ` · ${escapeHtml(modelSummary)}` : ''} →</span>
        </a>`;
      }

      return `<div class="hub-card hub-card-pending">
          <h2>${escapeHtml(catLoc.title)}</h2>
          <p>${escapeHtml(catLoc.intro)}</p>
          <span class="hub-card-meta">${escapeHtml(ui.hubCategoryPending)}</span>
        </div>`;
    });

    gridHtml = `    <section class="wrap section-space">
      <div class="hub-grid">
        ${cards.join('\n        ')}
      </div>
    </section>`;
  }

  const enquiryHref = routes.enquiryUrl(locale, { intent: 'general' });
  const closingHtml = `    <section class="wrap compact-contact">
      <div class="simple-product-contact">
        <div>
          <h2>${escapeHtml(ui.hubClosingHeading)}</h2>
          <p>${escapeHtml(ui.hubClosingBody)}</p>
        </div>
        <div class="contact-actions">
          <a class="btn primary" href="${escapeHtml(enquiryHref)}">${escapeHtml(ui.sendEnquiry)} →</a>
        </div>
      </div>
    </section>`;

  return renderShell({
    locale,
    seoTitle: `${ui.hubEyebrow} — ${ui.hubTitle}`,
    seoDescription: ui.hubIntro,
    route,
    routes,
    noindex,
    bodyClass: 'catalogue-hub-page',
    activeNav: 'products',
    mainHtml: [breadcrumbsHtml, heroHtml, gridHtml, closingHtml].join('\n\n'),
  });
}

function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Renders the localized truthful-preview enquiry page (`en/contact.html` or `de/contact.html`).
 * Preserves BOC-001 truthful-preview wording, keeps fields editable on submit,
 * distinguishes sensors vs. matched pairs, and safely embeds public allowlist data
 * for URL query pre-fill and EN/DE context handoff.
 */
export function renderEnquiryPage(publicInput, locale, { routes, noindex = false } = {}) {
  assertLocale(locale);
  const ui = UI[locale];
  const otherLocale = locale === 'en' ? 'de' : 'en';
  const route = makeStaticRoute(locale, `/${locale}/contact.html`, routes);

  const publicProducts = (publicInput.products || []).map((p) => ({
    id: p.id,
    modelCodes: [...(p.modelCodes || [])],
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      modelCode: v.modelCode,
    })),
  }));

  const publicResources = (publicInput.resources || []).map((r) => ({
    id: r.id,
    type: r.type,
    revision: r.revision,
    language: r.language,
    access: r.access,
  }));

  const allModelCodes = [];
  const seenCodes = new Set();
  for (const prod of publicProducts) {
    for (const code of prod.modelCodes) {
      if (!seenCodes.has(code)) {
        seenCodes.add(code);
        allModelCodes.push(code);
      }
    }
    for (const v of prod.variants) {
      if (!seenCodes.has(v.modelCode)) {
        seenCodes.add(v.modelCode);
        allModelCodes.push(v.modelCode);
      }
    }
  }

  const embeddedData = {
    locale,
    alternateContactHref: routes.resolvePage(`/${otherLocale}/contact.html`),
    allowedIntents: ['application', 'sample', 'quote', 'documents', 'general'],
    products: publicProducts,
    resources: publicResources,
  };

  const breadcrumbsHtml = `    <nav class="wrap breadcrumbs" aria-label="${escapeHtml(ui.breadcrumbLabel)}">
      <a href="${escapeHtml(routes.resolvePage('/index.html'))}">${escapeHtml(ui.home)}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${escapeHtml(ui.contact)}</span>
    </nav>`;

  const heroHtml = `    <section class="wrap">
      <div class="contact-hero">
        <span class="eyebrow">${escapeHtml(ui.contact)}</span>
        <h1>${escapeHtml(ui.contactTitle)}</h1>
        <p class="lead">${escapeHtml(ui.contactLead)}</p>
      </div>
    </section>`;

  const intentOptionsHtml = Object.entries(ui.intents)
    .map(([val, label]) => `<option value="${escapeHtml(val)}">${escapeHtml(label)}</option>`)
    .join('');

  const unitOptionsHtml = Object.entries(ui.quantityUnits)
    .map(([val, label]) => `<option value="${escapeHtml(val)}">${escapeHtml(label)}</option>`)
    .join('');

  const datalistHtml = allModelCodes
    .map((code) => `<option value="${escapeHtml(code)}"></option>`)
    .join('');

  const includeItemsHtml = ui.infoIncludeItems
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('\n            ');

  const formHtml = `    <section class="wrap contact-layout" id="enquiry">
      <div>
        <div class="preview-banner" role="note">
          <strong>${escapeHtml(ui.previewNoticeTitle)}</strong>
          ${escapeHtml(ui.previewNoticeBody)}
        </div>
        <p class="enquiry-context-note" id="enquiry-context-note" hidden></p>
        <form id="enquiry-form" class="enquiry-form" hidden>
          <div class="form-grid">
            <div class="field">
              <label for="name">${escapeHtml(ui.fieldName)}</label>
              <input id="name" name="name" autocomplete="name" required maxlength="100">
            </div>
            <div class="field">
              <label for="company">${escapeHtml(ui.fieldCompany)}</label>
              <input id="company" name="company" autocomplete="organization" required maxlength="150">
            </div>
            <div class="field">
              <label for="email">${escapeHtml(ui.fieldEmail)}</label>
              <input id="email" name="email" type="email" autocomplete="email" required maxlength="150">
            </div>
            <div class="field">
              <label for="country">${escapeHtml(ui.fieldCountry)} <span>${escapeHtml(ui.fieldOptional)}</span></label>
              <input id="country" name="country" autocomplete="country-name" maxlength="100">
            </div>
            <div class="field">
              <label for="intent">${escapeHtml(ui.fieldIntent)}</label>
              <select id="intent" name="intent">${intentOptionsHtml}</select>
            </div>
            <div class="field">
              <label for="product">${escapeHtml(ui.fieldProduct)} <span>${escapeHtml(ui.fieldOptional)}</span></label>
              <input id="product" name="product" list="catalogue-models" maxlength="120" placeholder="${escapeHtml(ui.fieldProductPlaceholder)}">
              <datalist id="catalogue-models">${datalistHtml}</datalist>
            </div>
            <div class="field">
              <label for="quantity">${escapeHtml(ui.fieldQuantity)} <span>${escapeHtml(ui.fieldOptional)}</span></label>
              <input id="quantity" name="quantity" type="number" min="1" step="1" inputmode="numeric">
            </div>
            <div class="field">
              <label for="quantityUnit">${escapeHtml(ui.fieldQuantityUnit)}</label>
              <select id="quantityUnit" name="quantityUnit">${unitOptionsHtml}</select>
            </div>
            <div class="field full">
              <label for="resource">${escapeHtml(ui.fieldResource)} <span>${escapeHtml(ui.fieldOptional)}</span></label>
              <input id="resource" name="resource" maxlength="150" placeholder="${escapeHtml(ui.fieldResourcePlaceholder)}">
            </div>
            <div class="field full">
              <label for="requirements">${escapeHtml(ui.fieldRequirements)}</label>
              <textarea id="requirements" name="requirements" required maxlength="1500" placeholder="${escapeHtml(ui.fieldRequirementsPlaceholder)}"></textarea>
            </div>
          </div>
          <p class="form-note">${escapeHtml(ui.previewFormNote)}</p>
          <button class="btn primary" type="submit">${escapeHtml(ui.previewSubmitBtn)}</button>
          <p class="status-message" id="draft-status" role="status" aria-live="polite"></p>
          <div id="draft-preview" class="draft-preview" tabindex="-1" hidden>
            <h3>${escapeHtml(ui.previewResultHeading)}</h3>
            <p>${escapeHtml(ui.previewResultBody)}</p>
          </div>
        </form>
        <noscript><p>${escapeHtml(ui.noscriptNotice)} <a class="text-link" href="mailto:export@bocontech.com">export@bocontech.com</a> / <a class="text-link" href="mailto:beitoo@bocontech.com">beitoo@bocontech.com</a>.</p></noscript>
      </div>
      <aside class="stack">
        <div class="info-card">
          <h3>Dalian Bocon Science &amp; Technology Co., Ltd.</h3>
          <p>9-1, No. 23, Shidai-E Rd, Dalian Bonded Area, Dalian, China</p>
          <p>Email: <a class="text-link" href="mailto:beitoo@bocontech.com">beitoo@bocontech.com</a> · <a class="text-link" href="mailto:export@bocontech.com">export@bocontech.com</a><br>Tel: <a href="tel:+8641188122286">+86-411-88122286</a></p>
        </div>
        <div class="info-card">
          <h3>${escapeHtml(ui.infoIncludeHeading)}</h3>
          <ul>
            ${includeItemsHtml}
          </ul>
        </div>
      </aside>
    </section>`;

  const extraScripts = `\n  <script id="enquiry-catalogue-data" type="application/json">${safeJsonForScript(embeddedData)}</script>\n  <script type="module" src="${escapeHtml(routes.resolveAsset('assets/enquiry-preview.js'))}"></script>`;

  return renderShell({
    locale,
    seoTitle: ui.contactSeoTitle,
    seoDescription: ui.contactSeoDescription,
    route,
    routes,
    noindex,
    bodyClass: 'contact-page',
    activeNav: 'contact',
    mainHtml: [breadcrumbsHtml, heroHtml, formHtml].join('\n\n'),
    extraScripts,
  });
}
