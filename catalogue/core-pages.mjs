/**
 * Bilingual (EN & DE) core page renderers for the Bocon European website preview.
 * Reuses renderShell, makeStaticRoute, escapeHtml, and Signal CSS classes from
 * catalogue/render.mjs and v2/assets/tokens.css + v2/assets/site.css.
 *
 * Strictly adheres to BOC-003 qualified compliance wording:
 * - Zero unqualified MID / ISO / CE / Ex / ATEX / IECEx / GJB / nuclear claims.
 * - Zero unverified three-point bath or Callendar–Van Dusen calibration claims.
 * - Zero links to unmodified legacy brochures with overbroad claims.
 */

import { assertLocale } from './routes.mjs';
import { escapeHtml, makeStaticRoute, renderShell } from './render.mjs';

function findCategoryRouteByHint(publicInput, locale, routes, hints) {
  const categories = publicInput?.categories || [];
  const productById = new Map((publicInput?.products || []).map((p) => [p.id, p]));
  for (const cat of categories) {
    const loc = cat.locales?.[locale];
    if (!loc) continue;
    const haystack = `${cat.id} ${loc.slug || ''} ${loc.title || ''}`.toLowerCase();
    if (!hints.some((h) => haystack.includes(h))) continue;
    const catRoute = routes?.categories?.[cat.id]?.[locale];
    const readyProducts = (cat.orderedProductIds || [])
      .map((pid) => productById.get(pid))
      .filter((p) => p && p.locales?.[locale] && routes?.products?.[p.id]?.[locale]);
    if (catRoute && readyProducts.length > 0) {
      return { category: cat, route: catRoute, products: readyProducts };
    }
  }
  return null;
}

function renderDynamicCategoryCards(publicInput, locale, routes) {
  const categories = (publicInput?.categories || []).filter((c) => Boolean(c.locales?.[locale]));
  const productById = new Map((publicInput?.products || []).map((p) => [p.id, p]));

  const countLabel =
    locale === 'de'
      ? (n) => (n === 1 ? '1 veröffentlichtes Produkt' : `${n} veröffentlichte Produkte`)
      : (n) => (n === 1 ? '1 published product' : `${n} published products`);
  const pendingLabel =
    locale === 'de'
      ? 'Quellenprüfung läuft — derzeit noch keine Produktseiten veröffentlicht.'
      : 'Source verification in progress — no published products yet.';

  if (categories.length === 0) {
    const emptyText =
      locale === 'de'
        ? 'Derzeit sind keine geprüften Produktkategorien veröffentlicht.'
        : 'No reviewed product categories are currently published.';
    return `<p class="placeholder-note">${escapeHtml(emptyText)}</p>`;
  }

  const cards = categories.map((cat) => {
    const catLoc = cat.locales[locale];
    const catRoute = routes?.categories?.[cat.id]?.[locale];
    const readyProducts = (cat.orderedProductIds || [])
      .map((pid) => productById.get(pid))
      .filter((p) => p && p.locales?.[locale] && routes?.products?.[p.id]?.[locale]);

    if (readyProducts.length > 0 && catRoute) {
      const modelSummary = readyProducts
        .flatMap((p) => p.modelCodes || [])
        .slice(0, 4)
        .join(' · ');
      return `<a class="hub-card" href="${escapeHtml(catRoute.href)}">
          <h3>${escapeHtml(catLoc.title)}</h3>
          <p>${escapeHtml(catLoc.intro)}</p>
          <span class="hub-card-meta">${escapeHtml(countLabel(readyProducts.length))}${modelSummary ? ` · ${escapeHtml(modelSummary)}` : ''} →</span>
        </a>`;
    }

    return `<div class="hub-card hub-card-pending">
          <h3>${escapeHtml(catLoc.title)}</h3>
          <p>${escapeHtml(catLoc.intro)}</p>
          <span class="hub-card-meta">${escapeHtml(pendingLabel)}</span>
        </div>`;
  });

  return `<div class="hub-grid">
        ${cards.join('\n        ')}
      </div>`;
}

/**
 * Renders the root bilingual language selector (`index.html`).
 */
export function renderRootLanding({ routes, noindex = false } = {}) {
  const enHref = routes.resolvePage('/en/index.html');
  const deHref = routes.resolvePage('/de/index.html');
  const enUrl = routes.origin ? `${routes.origin}${enHref}` : enHref;
  const deUrl = routes.origin ? `${routes.origin}${deHref}` : deHref;
  const robotsMeta = noindex ? '\n  <meta name="robots" content="noindex, nofollow">' : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bocon Europe — Language Selection / Sprachauswahl</title>
  <meta name="description" content="Choose English or German to explore Bocon platinum temperature sensors, elements, and test equipment.">${robotsMeta}
  <link rel="alternate" hreflang="en" href="${escapeHtml(enUrl)}">
  <link rel="alternate" hreflang="de" href="${escapeHtml(deUrl)}">
  <link rel="alternate" hreflang="x-default" href="${escapeHtml(enUrl)}">
  <link rel="icon" href="${escapeHtml(routes.resolveAsset('v2/assets/favicon.svg'))}" type="image/svg+xml">
  <meta name="theme-color" content="#12294A">
  <link rel="stylesheet" href="${escapeHtml(routes.resolveAsset('v2/assets/tokens.css'))}">
  <link rel="stylesheet" href="${escapeHtml(routes.resolveAsset('v2/assets/site.css'))}">
  <link rel="stylesheet" href="${escapeHtml(routes.resolveAsset('assets/catalogue.css'))}">
</head>
<body class="catalogue-page">
  <main class="locale-landing" id="main">
    <div class="locale-landing-card">
      <img class="locale-landing-brand" src="${escapeHtml(routes.resolveAsset('v2/logo/bocon-wordmark.png'))}" width="272" height="92" alt="Bocon">
      <span class="eyebrow">Bocon Europe · Preview</span>
      <h1>Select your language / Sprache wählen</h1>
      <p>Platinum resistance temperature sensors (Pt100, Pt500, Pt1000), thin-film sensing elements, and thermal response test equipment for European industrial and OEM buyers.</p>
      <div class="locale-cards">
        <a class="locale-card" href="${escapeHtml(deHref)}" hreflang="de" lang="de">
          <strong>Deutsch (DE)</strong>
          <span>Temperaturfühler, Messelemente, Anwendungen und OEM-Fertigung für den DACH-Raum.</span>
          <span class="text-link">Zur deutschen Startseite →</span>
        </a>
        <a class="locale-card" href="${escapeHtml(enHref)}" hreflang="en" lang="en">
          <strong>English (EN)</strong>
          <span>Temperature sensors, sensing elements, applications, and custom OEM engineering for Europe.</span>
          <span class="text-link">Open English homepage →</span>
        </a>
      </div>
    </div>
  </main>
</body>
</html>`;
}

/**
 * Renders the bilingual overall capabilities homepage (`en/index.html` or `de/index.html`).
 */
export function renderHomePage(publicInput, locale, { routes, noindex = false } = {}) {
  assertLocale(locale);
  const route = makeStaticRoute(locale, `/${locale}/index.html`, routes);
  const productsHref = routes.resolvePage(`/${locale}/products/index.html`);
  const heatHref = routes.resolvePage(`/${locale}/heat-metering.html`);
  const hvacHref = routes.resolvePage(`/${locale}/hvac-refrigeration.html`);
  const oemHref = routes.resolvePage(`/${locale}/for-oems.html`);
  const contactHref = routes.enquiryUrl(locale, { intent: 'general' });
  const docsHref = routes.enquiryUrl(locale, { intent: 'documents' });
  const sampleHref = routes.enquiryUrl(locale, { intent: 'sample' });

  const copy =
    locale === 'de'
      ? {
          seoTitle: 'Bocon | Platin-Temperaturfühler, Messelemente & OEM-Fertigung',
          seoDescription:
            'Bocon entwickelt und fertigt Pt100-, Pt500- und Pt1000-Temperaturfühler, Dünnschicht-Messelemente, Wärmezähler-Fühlerpaare und kundenspezifische OEM-Baugruppen.',
          eyebrow: 'Temperaturmesstechnik · Forschung, Entwicklung & Fertigung',
          h1Lead: 'Präzise Temperaturfühler,',
          h1Em: 'entwickelt für Ihre Anwendung.',
          lead: 'Bocon ist ein spezialisierter Hersteller für Platin-Widerstandsthermometer (Pt100, Pt500, Pt1000), Dünnschicht-Messelemente und Ansprechzeit-Prüfgeräte — von der Standardserie bis zur kundenspezifischen OEM-Fertigung nach Zeichnung.',
          ctaPrimary: 'Produktkatalog entdecken →',
          ctaSecondary: 'Anfrage-Vorschau öffnen',
          trustNote:
            'Direkte technische Abstimmung für Muster, Zeichnungsanpassungen und Lieferantenqualifizierung.',
          chip1: 'RTD · Pt100 / Pt500 / Pt1000',
          chip2: 'F&E & Sonderanfertigung',
          chip3: '8+2 Produktportfolio',
          capKick: 'Kernkompetenzen',
          capTitle: 'Vertikale Fertigungstiefe vom Messelement bis zur Prüfung',
          capSub: 'Vom Platin-Messelement über kundenspezifische Schutzrohre bis zur hauseigenen Ansprechzeitprüfung.',
          caps: [
            {
              title: 'Forschung & Konstruktion',
              body: 'Anwendungsgerechte Auslegung von Tauch-, Anlege-, Luftkanal- und Einschraubfühlern nach IEC 60751 (Klasse B Standard, Klasse A optional).',
            },
            {
              title: 'Präzisionsfertigung & Prüfung',
              body: 'Kontrollierte Fertigungsprozesse für Standard- und Serienlose inklusive Isolationsprüfung und Ansprechzeitmessung auf eigenen Prüfständen.',
            },
            {
              title: 'Kundenspezifische OEM-Lösungen',
              body: 'Individuelle Schutzrohrdurchmesser, Einbaulängen, Prozessanschlüsse, Leitungsmaterialien und Konfektionierungen nach Kundenzeichnung.',
            },
          ],
          catKick: '8+2 Produktportfolio',
          catTitle: 'Temperaturfühler, Messelemente & Prüfgeräte',
          catAll: 'Gesamten Produktkatalog ansehen →',
          appKick: 'Anwendungsbereiche',
          appTitle: 'Typische Messaufgaben in Gebäude- und Industrietechnik',
          appSub: 'Wählen Sie Ihren Anwendungsbereich für technische Auswahlhilfen und passende Fühlerserien.',
          apps: [
            {
              num: '01',
              title: 'Wärme- & Kältezählung',
              body: 'Gepaarte Vor- und Rücklauf-Temperaturfühler ausgelegt für Wärmezähler nach EN 1434-2015 und GB/T 32224-2020.',
              link: 'Mehr zu Wärmezählern →',
              href: heatHref,
            },
            {
              num: '02',
              title: 'HLK & Kältetechnik',
              body: 'Luftkanal-, Rohranlege-, Tauch- und Anschlusskopffühler für Lüftungsanlagen, Wärmepumpen und Kaltwasserkreise.',
              link: 'Mehr zu HLK & Kälte →',
              href: hvacHref,
            },
            {
              num: '03',
              title: 'Kundenspezifische OEM-Fühler',
              body: 'Zeichnungsgebundene Entwicklung, Musterqualifizierung und Serienlieferung für Geräte- und Anlagenbauer.',
              link: 'Mehr für OEMs →',
              href: oemHref,
            },
          ],
          compKick: 'Qualität & Dokumentation',
          compTitle: 'Transparente Nachweise für die Lieferantenqualifizierung',
          compSub: 'Alle projektspezifischen Zertifikate, Geltungsbereiche und Prüfprotokolle bestätigen wir für Ihre konkrete Ausführung auf Anfrage.',
          compCards: [
            {
              title: 'Managementsysteme (Nanjing & Dalian)',
              body: 'Angaben zu Qualitäts-, Umwelt- und Arbeitsschutzmanagementsystemen (ISO 9001, ISO 14001, ISO 45001) – einschließlich aktuellem Zertifizierungsstatus, Gültigkeitsdauer und Fertigungsstandort (Nanjing vs. Dalian) – bestätigen wir im Rahmen der Lieferantenqualifizierung auf Anfrage.',
              link: 'Dokumentation anfragen →',
              href: docsHref,
            },
            {
              title: 'Wärmezähler & Konformität',
              body: 'Für ausgewählte TM1101/51-Ausführungen liegen auf Nanjing Bocon ausgestellte EU-Baumusterprüfbescheinigungen (Modul B) vor; den aktuellen Geltungsbereich, die zugehörigen Anhänge sowie den aktuellen Stand der Konformitätsbewertung (Modul D/F) bestätigen wir auf Anfrage.',
              link: 'Wärmezähler-Details ansehen →',
              href: heatHref,
            },
            {
              title: 'Muster & EU-Konformitätserklärungen',
              body: 'Erforderliche EU-Konformitätserklärungen (für aktive/elektronische Ausführungen) stellen wir auf Anfrage bereit. Das europäische Standardportfolio ist für nicht explosionsgefährdete Industriebereiche ausgelegt.',
              link: 'Musteranforderung besprechen →',
              href: sampleHref,
            },
          ],
          ctaHeading: 'Haben Sie eine konkrete Messaufgabe?',
          ctaBody: 'Nennen Sie uns Temperaturbereich, Messelement, Einbausituation, Stückzahl oder senden Sie eine Zeichnung über unsere Anfrage-Vorschau.',
          ctaButton: 'Zur Anfrage-Vorschau →',
        }
      : {
          seoTitle: 'Bocon | Platinum Temperature Sensors, Elements & OEM Manufacturing',
          seoDescription:
            'Bocon designs and manufactures Pt100, Pt500, and Pt1000 temperature sensors, thin-film elements, heat-meter sensor pairs, and custom OEM assemblies.',
          eyebrow: 'Temperature Sensing · R&D, Precision Manufacturing & Customisation',
          h1Lead: 'Precision temperature sensing,',
          h1Em: 'engineered to fit.',
          lead: 'Bocon is a dedicated manufacturer of platinum resistance temperature sensors (Pt100, Pt500, Pt1000), thin-film sensing elements, and thermal response test equipment — from standard industrial series to custom OEM assemblies built to your drawing.',
          ctaPrimary: 'Explore product catalogue →',
          ctaSecondary: 'Open enquiry preview',
          trustNote:
            'Direct engineering review for samples, custom drawings, and supplier qualification.',
          chip1: 'RTD · Pt100 / Pt500 / Pt1000',
          chip2: 'R&D & Custom Builds',
          chip3: '8+2 Product Portfolio',
          capKick: 'Core capabilities',
          capTitle: 'Vertical manufacturing from sensing element to verification',
          capSub: 'Combining platinum element engineering, precision probe fabrication, and in-house response-time testing.',
          caps: [
            {
              title: 'R&D & Sensor Engineering',
              body: 'Application-specific design of immersion, pipe-surface, air-duct, and terminal-head RTDs using IEC 60751 platinum elements (Class B standard, Class A optional).',
            },
            {
              title: 'Precision Manufacturing & Testing',
              body: 'Controlled production processes for prototype and series batches, backed by insulation resistance verification and in-house thermal response test apparatus.',
            },
            {
              title: 'Custom OEM Assemblies',
              body: 'Tailored sheath diameters, insertion lengths, process threads, cable jackets, and harness terminations engineered to your mechanical drawing.',
            },
          ],
          catKick: '8+2 Product Catalogue',
          catTitle: 'Temperature sensors, elements & test equipment',
          catAll: 'View full product catalogue →',
          appKick: 'Applications',
          appTitle: 'Where our sensors measure',
          appSub: 'Select your application area for selection guidance and verified sensor families.',
          apps: [
            {
              num: '01',
              title: 'Heat & cooling metering',
              body: 'Matched supply and return temperature sensor pairs designed for EN 1434-2015 and GB/T 32224-2020 thermal energy meters.',
              link: 'Explore heat metering →',
              href: heatHref,
            },
            {
              num: '02',
              title: 'HVAC & refrigeration',
              body: 'Air-duct, clamp-on pipe-surface, immersion, and terminal-head RTDs for air handling units, heat pumps, and chilled-water loops.',
              link: 'Explore HVAC & refrigeration →',
              href: hvacHref,
            },
            {
              num: '03',
              title: 'Custom OEM sensors',
              body: 'Drawing-based engineering, sample qualification, and repeat batch manufacturing for equipment and instrument OEMs.',
              link: 'Explore OEM capabilities →',
              href: oemHref,
            },
          ],
          compKick: 'Quality & documentation',
          compTitle: 'Substantiated documentation for supplier qualification',
          compSub: 'Current certificate scope, validity dates, and test protocols are confirmed on request for your exact configuration.',
          compCards: [
            {
              title: 'Management systems (Nanjing & Dalian)',
              body: 'Quality, environmental, and occupational health and safety management documentation (ISO 9001, ISO 14001, ISO 45001) — including current certification status, validity dates, and manufacturing-site scope (Nanjing vs. Dalian) — is confirmed on request prior to supplier qualification.',
              link: 'Request documentation →',
              href: docsHref,
            },
            {
              title: 'Heat-metering conformity status',
              body: 'EU-Type Examination (Module B) documentation is held by Nanjing Bocon for designated TM1101/51 configurations; current certificate scope, descriptive annexes, and applicable conformity assessment status (Module D/F) are confirmed on request for your exact configuration.',
              link: 'View heat-metering details →',
              href: heatHref,
            },
            {
              title: 'Samples & EU Declarations of Conformity',
              body: 'Applicable EU Declarations of Conformity (for active/electronic products) are provided on request. Standard European portfolio covers non-hazardous industrial locations.',
              link: 'Discuss sample requirements →',
              href: sampleHref,
            },
          ],
          ctaHeading: 'Have a temperature measurement requirement?',
          ctaBody: 'Share your temperature range, element type, installation geometry, and required quantities using our enquiry preview.',
          ctaButton: 'Open enquiry preview →',
        };

  const capCardsHtml = copy.caps
    .map(
      (c) => `<div class="support-card">
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.body)}</p>
        </div>`,
    )
    .join('\n        ');

  const appCardsHtml = copy.apps
    .map(
      (a) => `<a class="app" href="${escapeHtml(a.href)}">
            <div class="n">${escapeHtml(a.num)}</div>
            <h3>${escapeHtml(a.title)}</h3>
            <p>${escapeHtml(a.body)}</p>
            <span class="app-link">${escapeHtml(a.link)}</span>
          </a>`,
    )
    .join('\n          ');

  const compCardsHtml = copy.compCards
    .map(
      (c) => `<div class="support-card">
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.body)}</p>
          <a class="text-link" href="${escapeHtml(c.href)}">${escapeHtml(c.link)}</a>
        </div>`,
    )
    .join('\n        ');

  const mainHtml = `    <section class="wrap hero">
      <div>
        <span class="eyebrow">${escapeHtml(copy.eyebrow)}</span>
        <h1>${escapeHtml(copy.h1Lead)} <em>${escapeHtml(copy.h1Em)}</em></h1>
        <p class="lead">${escapeHtml(copy.lead)}</p>
        <div class="hero-actions">
          <a class="btn primary" href="${escapeHtml(productsHref)}">${escapeHtml(copy.ctaPrimary)}</a>
          <a class="btn ghost" href="${escapeHtml(contactHref)}">${escapeHtml(copy.ctaSecondary)}</a>
        </div>
        <div class="hero-trust"><span class="dot"></span>${escapeHtml(copy.trustNote)}</div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="grid-fade"></div><div class="ring"></div>
        <div class="sensor"><div class="cable"></div><div class="head"></div><div class="tube"></div></div>
        <div class="chip c1">${escapeHtml(copy.chip1)}</div>
        <div class="chip c2"><b>${escapeHtml(copy.chip2)}</b></div>
        <div class="chip c3"><b>${escapeHtml(copy.chip3)}</b></div>
      </div>
    </section>

    <section class="soft-section" id="capabilities">
      <div class="wrap section-space">
        <div class="section-head home-head">
          <div><div class="kick">${escapeHtml(copy.capKick)}</div><h2>${escapeHtml(copy.capTitle)}</h2></div>
          <p class="sub">${escapeHtml(copy.capSub)}</p>
        </div>
        <div class="support-grid">
          ${capCardsHtml}
        </div>
      </div>
    </section>

    <section class="wrap blk" id="catalogue">
      <div class="section-head home-head">
        <div><div class="kick">${escapeHtml(copy.catKick)}</div><h2>${escapeHtml(copy.catTitle)}</h2></div>
        <a class="text-link" href="${escapeHtml(productsHref)}">${escapeHtml(copy.catAll)}</a>
      </div>
      ${renderDynamicCategoryCards(publicInput, locale, routes)}
    </section>

    <section class="dark-section" id="applications">
      <div class="wrap section-space">
        <div class="section-head home-head">
          <div><div class="kick">${escapeHtml(copy.appKick)}</div><h2>${escapeHtml(copy.appTitle)}</h2></div>
          <p class="sub">${escapeHtml(copy.appSub)}</p>
        </div>
        <div class="app-grid">
          ${appCardsHtml}
        </div>
      </div>
    </section>

    <section class="wrap blk" id="compliance">
      <div class="section-head home-head">
        <div><div class="kick">${escapeHtml(copy.compKick)}</div><h2>${escapeHtml(copy.compTitle)}</h2></div>
        <p class="sub">${escapeHtml(copy.compSub)}</p>
      </div>
      <div class="support-grid">
        ${compCardsHtml}
      </div>
    </section>

    <section class="wrap blk">
      <div class="cta">
        <div>
          <h2>${escapeHtml(copy.ctaHeading)}</h2>
          <p>${escapeHtml(copy.ctaBody)}</p>
        </div>
        <a class="btn primary" href="${escapeHtml(contactHref)}">${escapeHtml(copy.ctaButton)}</a>
      </div>
    </section>`;

  return renderShell({
    locale,
    seoTitle: copy.seoTitle,
    seoDescription: copy.seoDescription,
    route,
    routes,
    noindex,
    bodyClass: 'home-page',
    activeNav: 'home',
    mainHtml,
  });
}

/**
 * Renders the bilingual heat-metering application page (`en/heat-metering.html` or `de/heat-metering.html`).
 * Uses BOC-003 Section 3.1 & 3.3 qualified wording strictly.
 */
export function renderHeatMeteringPage(publicInput, locale, { routes, noindex = false } = {}) {
  assertLocale(locale);
  const route = makeStaticRoute(locale, `/${locale}/heat-metering.html`, routes);
  const homeHref = routes.resolvePage(`/${locale}/index.html`);
  const productsHref = routes.resolvePage(`/${locale}/products/index.html`);
  const docsHref = routes.enquiryUrl(locale, { intent: 'documents' });
  const appEnquiryHref = routes.enquiryUrl(locale, { intent: 'application' });

  const heatCategory = findCategoryRouteByHint(publicInput, locale, routes, [
    'heat-meter',
    'waermezaehler',
    'wärmezähler',
    'heat',
  ]);
  const categoryHref = heatCategory ? heatCategory.route.href : productsHref;

  const copy =
    locale === 'de'
      ? {
          seoTitle: 'Wärmezähler-Temperaturfühler | EN 1434 Fühlerpaare | Bocon',
          seoDescription:
            'Gepaarte Pt500- und Pt1000-Temperaturfühler für Wärme- und Kältezähler. Paarungstoleranzen, Einbauoptionen und qualifizierte Konformitätsangaben.',
          breadcrumb: 'Wärmezähler',
          eyebrow: 'Anwendung · Wärme- & Kältezählung',
          h1: 'Gepaarte Temperaturfühler für Wärme- und Kältezähler',
          lead: 'Wärme- und Kältezähler berechnen die thermische Energie aus Volumenstrom und der Temperaturdifferenz (ΔT) zwischen Vor- und Rücklauf. Gepaarte Vor- und Rücklauf-Temperaturfühler minimieren systematische Abweichungen bei kleinen Temperaturdifferenzen.',
          ctaPrimary: heatCategory
            ? 'Wärmezähler-Fühler ansehen →'
            : 'Zum Produktkatalog →',
          ctaSecondary: 'Dokumente & Nachweise anfragen',
          svgTitle: 'Vor- und Rücklauf-Temperaturmessung in einem Heiz- oder Kühlkreis',
          svgDesc: 'Schematische Darstellung eines Vorlauffühlers (T1) und eines Rücklauffühlers (T2) an einem Rechenwerk für ΔT.',
          svgT1: 'Vorlauf (T1)',
          svgT2: 'Rücklauf (T2)',
          svgSource: 'Wärmequelle',
          svgLoad: 'Verbraucher',
          svgCaption: 'Vor- und Rücklauf-Temperaturfühler als gepaartes Differenzmesspaar (ΔT = T1 − T2).',
          darkHeading: 'Warum Vor- und Rücklauffühler gepaart werden',
          darkIntro:
            'Gepaarte Vor- und Rücklauf-Temperaturfühler werden hinsichtlich der Temperaturdifferenz-Genauigkeit selektiert und geprüft (±0,06 °C Kälte / ±0,1 °C Wärme laut Prospekt). Details zu Prüfprotokollen, Werkskalibrierzeugnissen und Paar-Kennzeichnung werden im Rahmen der Musterqualifizierung abgestimmt.',
          checks: [
            {
              dt: 'Direkttauchend vs. Tauchhülse',
              dd: 'Kompakte Zähler nutzen häufig direkttauchende M10 × 1-Fühler (z. B. TM1101-5-1500 oder abgesetzte TM1101/51-Ausführungen), während größere Rohrleitungen G1/2-Langrohr- oder Anschlusskopf-Fühler (TM1401-8-85-1500 oder TM1401/85) einsetzen.',
            },
            {
              dt: 'Symmetrische 2-Leiter-Leitungslängen',
              dd: 'Bei 2-Leiter-Fühlerpaaren sorgen gleiche Leitungslängen beider Fühler dafür, dass sich der Leitungswiderstand in der Differenzmessung weitgehend aufhebt.',
            },
          ],
          tolHeading: 'Paarungstoleranzen für Kälte- und Wärmebetrieb',
          tolIntro:
            'Auslegungs- und Paarungsreferenz: EN 1434-2015 · GB/T 32224-2020 (gemäß Herstellerdokumentation; die Systemkonformität gilt für den vollständigen Wärmezähler).',
          coolLabel: 'Kälte / Kühlung',
          coolVal: '±0,06 °C',
          coolSub: 'Paarungsgenauigkeit (laut Prospekt)',
          coolDetail: '2 K Mindest-Temperaturdifferenz (ΔTmin)',
          heatLabel: 'Wärme / Heizung',
          heatVal: '±0,1 °C',
          heatSub: 'Paarungsgenauigkeit (laut Prospekt)',
          heatDetail: '3 K Mindest-Temperaturdifferenz (ΔTmin)',
          midCardTitle: 'Konformitäts- & Zulassungsstatus (EN 1434 / MID)',
          midCardP1:
            'Ausgelegt für Wärmezähler-Anwendungen nach EN 1434 und MID (2014/32/EU, MI-004). Für ausgewählte TM1101/51-Ausführungen liegen auf Nanjing Bocon ausgestellte EU-Baumusterprüfbescheinigungen (Modul B) vor; den aktuellen Geltungsbereich, die zugehörigen Anhänge sowie den aktuellen Stand der Konformitätsbewertung (Modul D/F) bestätigen wir für Ihre konkrete Ausführung auf Anfrage.',
          midCardP2:
            'TM1401-8-85-1500 und TM1401/85: Gepaarte Temperaturfühler für Wärme- und Kältezähler (Angaben nach EN 1434-2015 und GB/T 32224-2020 gemäß Herstellerprospekt). Projektspezifische Zulassungs- und Konformitätsanforderungen bitten wir vorab abzustimmen.',
          midCardLink: 'Aktuelle Nachweise anfragen →',
          publishedHeading: 'Veröffentlichte Produkte in dieser Kategorie',
          ctaHeading: 'Muster oder technische Klärung für Wärmezähler anfragen',
          ctaBody:
            'Nennen Sie uns Messelement (Pt500, Pt1000, Pt100), Gewinde, Leitungslänge und benötigte Paar-Stückzahl.',
          ctaBtn: 'Zur Anfrage-Vorschau →',
        }
      : {
          seoTitle: 'Heat Metering Temperature Sensors | EN 1434 Matched Pairs | Bocon',
          seoDescription:
            'Matched Pt500 and Pt1000 temperature sensor pairs for heating and cooling energy meters. Pairing tolerances, mounting options, and qualified conformity notes.',
          breadcrumb: 'Heat Metering',
          eyebrow: 'Application · Thermal Energy Metering',
          h1: 'Matched temperature sensor pairs for heating and cooling meters',
          lead: 'Thermal energy meters calculate heat transfer from water volume and the temperature difference (ΔT) between supply and return lines. Matched supply and return sensor pairs minimise differential offset error at low ΔT.',
          ctaPrimary: heatCategory
            ? 'View heat-meter sensors →'
            : 'Browse product catalogue →',
          ctaSecondary: 'Request conformity documents',
          svgTitle: 'Supply and return temperature measurement in a hydronic circuit',
          svgDesc: 'Schematic showing a supply line sensor (T1) and a return line sensor (T2) connected to a differential temperature integrator.',
          svgT1: 'Supply sensor (T1)',
          svgT2: 'Return sensor (T2)',
          svgSource: 'Heat source',
          svgLoad: 'Load',
          svgCaption: 'Supply and return temperature sensors wired as a matched differential pair (ΔT = T1 − T2).',
          darkHeading: 'Why supply and return sensors are matched as pairs',
          darkIntro:
            'Matched supply and return sensor pairs are selected and verified for differential temperature accuracy (±0.06 °C cooling / ±0.1 °C heating, per brochure). Calibration protocol details, test certificates, and pair-marking options are confirmed during sample qualification.',
          checks: [
            {
              dt: 'Direct immersion vs. thermowell mounting',
              dd: 'Compact residential meters typically use M10 × 1 direct-immersion probes (such as TM1101-5-1500 or stepped TM1101/51 variants), while larger district-heating pipes use G1/2 long-tube or terminal-head assemblies (TM1401-8-85-1500 or TM1401/85).',
            },
            {
              dt: 'Symmetrical 2-wire lead lengths',
              dd: 'On 2-wire pairs, supplying equal cable lengths on both sensors helps cancel lead resistance in the differential temperature measurement.',
            },
          ],
          tolHeading: 'Pairing tolerances for cooling and heating duty',
          tolIntro:
            'Design & matching reference: EN 1434-2015 · GB/T 32224-2020 (as stated in manufacturer documentation; system-level compliance applies to the complete heat meter).',
          coolLabel: 'Cooling / Refrigeration',
          coolVal: '±0.06 °C',
          coolSub: 'Pair matching accuracy (per brochure)',
          coolDetail: '2 K minimum temperature difference (ΔTmin)',
          heatLabel: 'Heating',
          heatVal: '±0.1 °C',
          heatSub: 'Pair matching accuracy (per brochure)',
          heatDetail: '3 K minimum temperature difference (ΔTmin)',
          midCardTitle: 'Conformity & approval status (EN 1434 / MID)',
          midCardP1:
            'Designed for EN 1434 / MID (2014/32/EU, MI-004) thermal energy metering applications. EU-Type Examination (Module B) documentation is held by Nanjing Bocon for designated TM1101/51 configurations; current certificate scope, descriptive annexes, and applicable conformity assessment status (Module D/F) are confirmed on request for your exact configuration.',
          midCardP2:
            'TM1401-8-85-1500 and TM1401/85: Designed as matched sensor pairs for heating and cooling energy meters (EN 1434-2015 and GB/T 32224-2020 as stated in the manufacturer brochure). Confirm project-specific conformity and approval requirements prior to selection.',
          midCardLink: 'Request current certificates & scope →',
          publishedHeading: 'Published products in this category',
          ctaHeading: 'Request heat-meter sensor samples or technical review',
          ctaBody:
            'Specify your calculator element type (Pt500, Pt1000, Pt100), mounting thread, cable length, and matched pair quantity.',
          ctaBtn: 'Open enquiry preview →',
        };

  const checksHtml = copy.checks
    .map((c) => `<div><dt>${escapeHtml(c.dt)}</dt><dd>${escapeHtml(c.dd)}</dd></div>`)
    .join('\n        ');

  const publishedProductsHtml =
    heatCategory && heatCategory.products.length > 0
      ? `    <section class="soft-section">
      <div class="wrap section-space">
        <div class="section-head">
          <h2>${escapeHtml(copy.publishedHeading)}</h2>
          <a class="text-link" href="${escapeHtml(heatCategory.route.href)}">${escapeHtml(copy.ctaPrimary)}</a>
        </div>
        <div class="hub-grid">
          ${heatCategory.products
            .map((prod) => {
              const pLoc = prod.locales[locale];
              const pRoute = routes.products[prod.id][locale];
              return `<a class="hub-card" href="${escapeHtml(pRoute.href)}">
            <h3>${escapeHtml(pLoc.title)}</h3>
            <p>${escapeHtml(pLoc.summary)}</p>
            <span class="hub-card-meta">${escapeHtml((prod.modelCodes || []).join(' · '))} →</span>
          </a>`;
            })
            .join('\n          ')}
        </div>
      </div>
    </section>`
      : '';

  const mainHtml = `    <nav class="wrap breadcrumbs" aria-label="${escapeHtml(locale === 'de' ? 'Brotkrumennavigation' : 'Breadcrumb')}">
      <a href="${escapeHtml(homeHref)}">${escapeHtml(locale === 'de' ? 'Startseite' : 'Home')}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${escapeHtml(copy.breadcrumb)}</span>
    </nav>

    <section class="wrap hero application-hero">
      <div>
        <span class="eyebrow">${escapeHtml(copy.eyebrow)}</span>
        <h1>${escapeHtml(copy.h1)}</h1>
        <p class="lead">${escapeHtml(copy.lead)}</p>
        <div class="hero-actions">
          <a class="btn primary" href="${escapeHtml(categoryHref)}">${escapeHtml(copy.ctaPrimary)}</a>
          <a class="btn ghost" href="${escapeHtml(docsHref)}">${escapeHtml(copy.ctaSecondary)}</a>
        </div>
      </div>
      <figure class="application-visual">
        <svg viewBox="0 0 500 340" role="img" aria-labelledby="loop-title loop-desc">
          <title id="loop-title">${escapeHtml(copy.svgTitle)}</title>
          <desc id="loop-desc">${escapeHtml(copy.svgDesc)}</desc>
          <defs><marker id="flow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#728daa"/></marker></defs>
          <rect x="32" y="75" width="64" height="188" rx="14" fill="#fff" stroke="#b2c7df"/>
          <rect x="404" y="75" width="64" height="188" rx="14" fill="#fff" stroke="#b2c7df"/>
          <path d="M96 115H404" fill="none" stroke="#8baccb" stroke-width="12"/>
          <path d="M404 227H96" fill="none" stroke="#4677ae" stroke-width="12"/>
          <path d="M285 94h50" stroke="#728daa" stroke-width="2" marker-end="url(#flow)"/>
          <path d="M335 250h-50" stroke="#728daa" stroke-width="2" marker-end="url(#flow)"/>
          <path d="M208 115V145M208 197V227" stroke="#2563eb" stroke-width="2" stroke-dasharray="4 4"/>
          <circle cx="208" cy="115" r="10" fill="#fff" stroke="#2563eb" stroke-width="3"/>
          <circle cx="208" cy="227" r="10" fill="#fff" stroke="#2563eb" stroke-width="3"/>
          <rect x="164" y="145" width="90" height="52" rx="12" fill="#12294a"/>
          <text x="209" y="180" fill="white" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="25">ΔT</text>
          <text x="148" y="70" fill="#2e5a8f" font-family="Helvetica Neue,Arial,sans-serif" font-size="14">${escapeHtml(copy.svgT1)}</text>
          <text x="148" y="278" fill="#2e5a8f" font-family="Helvetica Neue,Arial,sans-serif" font-size="14">${escapeHtml(copy.svgT2)}</text>
          <text x="64" y="297" text-anchor="middle" fill="#5a6b7b" font-family="Helvetica Neue,Arial,sans-serif" font-size="12">${escapeHtml(copy.svgSource)}</text>
          <text x="436" y="297" text-anchor="middle" fill="#5a6b7b" font-family="Helvetica Neue,Arial,sans-serif" font-size="12">${escapeHtml(copy.svgLoad)}</text>
          <path d="M51 135v70M64 135v70M77 135v70M421 135v70M434 135v70M447 135v70" stroke="#b2c7df" stroke-width="3"/>
        </svg>
        <figcaption>${escapeHtml(copy.svgCaption)}</figcaption>
      </figure>
    </section>

    <section class="dark-section">
      <div class="wrap section-space">
        <div class="checks-layout">
          <div>
            <h2>${escapeHtml(copy.darkHeading)}</h2>
            <p class="section-intro">${escapeHtml(copy.darkIntro)}</p>
          </div>
          <dl class="checks">
            ${checksHtml}
          </dl>
        </div>
      </div>
    </section>

    <section class="wrap section-space">
      <div class="two-col">
        <div>
          <h2>${escapeHtml(copy.tolHeading)}</h2>
          <p class="section-intro">${escapeHtml(copy.tolIntro)}</p>
          <div class="comparison">
            <article class="condition-card cool">
              <div class="condition-label">${escapeHtml(copy.coolLabel)}</div>
              <h3>${escapeHtml(copy.coolVal)}</h3>
              <p>${escapeHtml(copy.coolSub)}</p>
              <p class="condition-detail">${escapeHtml(copy.coolDetail)}</p>
            </article>
            <article class="condition-card">
              <div class="condition-label">${escapeHtml(copy.heatLabel)}</div>
              <h3>${escapeHtml(copy.heatVal)}</h3>
              <p>${escapeHtml(copy.heatSub)}</p>
              <p class="condition-detail">${escapeHtml(copy.heatDetail)}</p>
            </article>
          </div>
        </div>
        <div class="stack">
          <div class="info-card">
            <h3>${escapeHtml(copy.midCardTitle)}</h3>
            <p>${escapeHtml(copy.midCardP1)}</p>
            <p>${escapeHtml(copy.midCardP2)}</p>
            <a class="text-link" href="${escapeHtml(docsHref)}">${escapeHtml(copy.midCardLink)}</a>
          </div>
        </div>
      </div>
    </section>
${publishedProductsHtml}
    <section class="wrap section-space">
      <div class="cta">
        <div>
          <h2>${escapeHtml(copy.ctaHeading)}</h2>
          <p>${escapeHtml(copy.ctaBody)}</p>
        </div>
        <a class="btn primary" href="${escapeHtml(appEnquiryHref)}">${escapeHtml(copy.ctaBtn)}</a>
      </div>
    </section>`;

  return renderShell({
    locale,
    seoTitle: copy.seoTitle,
    seoDescription: copy.seoDescription,
    route,
    routes,
    noindex,
    bodyClass: 'application-page heat-metering-page',
    activeNav: 'heat-metering',
    mainHtml,
  });
}

/**
 * Renders the bilingual HVAC & refrigeration application page (`en/hvac-refrigeration.html` or `de/hvac-refrigeration.html`).
 */
export function renderHvacPage(publicInput, locale, { routes, noindex = false } = {}) {
  assertLocale(locale);
  const route = makeStaticRoute(locale, `/${locale}/hvac-refrigeration.html`, routes);
  const homeHref = routes.resolvePage(`/${locale}/index.html`);
  const productsHref = routes.resolvePage(`/${locale}/products/index.html`);
  const oemHref = routes.resolvePage(`/${locale}/for-oems.html`);
  const sampleHref = routes.enquiryUrl(locale, { intent: 'sample' });
  const appEnquiryHref = routes.enquiryUrl(locale, { intent: 'application' });

  const copy =
    locale === 'de'
      ? {
          seoTitle: 'HLK- & Kältetechnik-Temperaturfühler | Kanal-, Anlege- & Tauchfühler | Bocon',
          seoDescription:
            'Pt100-, Pt500- und Pt1000-Temperaturfühler für Lüftungsanlagen, Kaltwassersätze, Wärmepumpen und Heizkreise: Luftkanalfühler, Rohranlegefühler und Tauchfühler.',
          breadcrumb: 'HLK & Kälte',
          eyebrow: 'Anwendung · Gebäude- & Kältetechnik',
          h1: 'RTD-Temperaturfühler für Luftkanäle, Kaltwasserkreise und Rohroberflächen',
          lead: 'Lüftungsanlagen, Wärmepumpen und Kälteaggregate erfassen Temperaturen an drei typischen Schnittstellen: bewegte Luft im Kanal, flüssige Medien in Verteilern sowie Rohroberflächen ohne Anbohren. Bocon fertigt dafür abgestimmte Pt100-, Pt500- und Pt1000-Ausführungen.',
          ctaPrimary: 'Zum Produktkatalog →',
          ctaSecondary: 'Muster anfragen',
          svgTitle: 'Vier Temperaturmesspunkte in einer HLK- und Kaltwasseranlage',
          svgDesc: 'Schema mit Luftkanalfühler im Kanal sowie Rohranlegefühler, Anschlusskopffühler und Tauchfühler an einer Wasserleitung.',
          svgDuct: 'Luftkanal',
          svgPipe: 'Kalt- / Warmwasserleitung',
          svg1: 'Kanalfühler',
          svg2: 'Anlegefühler',
          svg3: 'Kopffühler',
          svg4: 'Tauchfühler',
          svgCaption: 'Typische Messpunkte für Platin-Temperaturfühler in Lüftungs-, Kälte- und Heizungsanlagen.',
          darkHeading: 'Schutz vor Kondenswasser und Leitungsfehlern',
          darkIntro:
            'Kaltwasser- und Kälteleitungen arbeiten unterhalb des Taupunkts. Eine passende Abdichtung, gute thermische Ankopplung und geeignete Schaltungsart verhindern Messdrift im Betrieb.',
          checks: [
            {
              dt: 'Feuchteschutz an kalten Leitungen',
              dd: 'Standard-Kabelfühler bieten IP65. Für dauerhaft betaute Kaltwasserverteiler oder Verdampfertaschen sind abgedichtete Ausführungen (optional IP68) mit Silikon- oder PTFE-Leitung verfügbar.',
            },
            {
              dt: 'Thermische Ankopplung bei Anlegefühlern',
              dd: 'Bei Rohranlegefühlern verbessert Wärmeleitpaste unter dem Kontaktblock in Kombination mit geschlossenzelliger Rohrdämmung die Ansprechzeit und reduziert Umgebungseinflüsse.',
            },
            {
              dt: 'Pt1000 vs. 3-/4-Leiter-Pt100 bei langen GLT-Strecken',
              dd: 'Bei langen Leitungswegen reduziert Pt1000 den Einfluss des Leitungswiderstands gegenüber 2-Leiter-Pt100 deutlich; alternativ kompensiert 3- oder 4-Leiter-Pt100 den Leitungswiderstand am Regler.',
            },
          ],
          guideKick: 'Auswahlhilfe',
          guideTitle: 'Passende Bauform je HLK-Messstelle',
          guideLink: 'Kundenspezifische OEM-Kabelkonfektion →',
          sharedLine:
            'Platin-Messelemente (Pt100, Pt500, Pt1000) nach IEC 60751 (in Herstellerunterlagen als IEC 751 bezeichnet); Klasse B als Standard, Klasse A optional (engere Toleranzklassen auf Anfrage).',
          steps: [
            {
              title: 'Zu-, Ab- und Außenluftkanäle',
              body: 'Flanschmontierte Luftkanalfühler (z. B. TM1705) mit verstellbarem Montageflansch und geschlitztem Schutzrohr für schnelle Luftstrom-Erfassung.',
            },
            {
              title: 'Nachrüstung an Heiz- und Kühlrohren',
              body: 'Rohranlegefühler mit gebogener Kontaktfläche und Edelstahl-Spannband (z. B. TM1111-Serie) zur Montage ohne Eingriff in die druckführende Leitung.',
            },
            {
              title: 'Wärmepumpen-Module & Tauchhülsen',
              body: 'Kompakte Kabelfühler (z. B. TM1101) für eingelötete Tauchhülsen oder Klemmverschraubungen mit kundenspezifischer Leitungslänge.',
            },
            {
              title: 'Heiz- und Kältezentralen',
              body: 'Anschlusskopf-Widerstandsthermometer (z. B. TM1401) für Hauptverteiler mit Klemmsockel oder optionalem 4–20-mA-Messumformer.',
            },
          ],
          ctaHeading: 'HLK-Temperaturfühler oder Muster anfragen',
          ctaBody:
            'Nennen Sie uns Messstelle (Kanal, Rohroberfläche, Tauchhülse oder Anschlusskopf), Messelement und gewünschte Leitungslänge.',
          ctaBtn: 'Zur Anfrage-Vorschau →',
        }
      : {
          seoTitle: 'HVAC & Refrigeration Temperature Sensors | Duct, Pipe & Immersion RTDs | Bocon',
          seoDescription:
            'Pt100, Pt500, and Pt1000 temperature sensors for air handling units, chillers, heat pumps, and hydronic piping: duct probes, clamp-on pipe sensors, and immersion RTDs.',
          breadcrumb: 'HVAC & Refrigeration',
          eyebrow: 'Application · Building & Chiller Loops',
          h1: 'RTD probes for air ducts, chilled-water headers, and pipe surfaces',
          lead: 'Air handling units, heat pumps, and refrigeration skids measure temperature across three physical interfaces: moving air inside ducts, liquid media in headers, and outer pipe walls where drilling is impractical. Bocon builds dedicated Pt100, Pt500, and Pt1000 constructions for each point.',
          ctaPrimary: 'Browse product catalogue →',
          ctaSecondary: 'Request samples',
          svgTitle: 'Four temperature measurement points in an HVAC and chilled-water system',
          svgDesc: 'Schematic showing a flanged duct probe in an air duct, and a clamp-on pipe sensor, terminal-head probe, and immersion probe on a water pipe.',
          svgDuct: 'Air duct',
          svgPipe: 'Chilled / hot water pipe',
          svg1: 'Duct sensor',
          svg2: 'Pipe clamp',
          svg3: 'Terminal head',
          svg4: 'Immersion probe',
          svgCaption: 'Typical RTD mounting points across air handling units, chillers, and hydronic loops.',
          darkHeading: 'Preventing condensation ingress and lead-wire offset',
          darkIntro:
            'Chilled-water and refrigeration pipes operate below ambient dew point. Selecting appropriate moisture sealing, thermal coupling, and wiring topology during specification prevents field drift.',
          checks: [
            {
              dt: 'Moisture sealing on cold lines',
              dd: 'Standard flying-lead probes are sealed to IP65. Where chilled-water manifolds or evaporator wells experience continuous condensation, specify optional IP68 sealing with silicone or PTFE cable insulation.',
            },
            {
              dt: 'Thermal coupling on pipe-surface sensors',
              dd: 'When strapping clamp-on sensors onto existing pipework, apply thermal paste beneath the contact saddle and insulate over the sensor head to minimise ambient air bias.',
            },
            {
              dt: 'Pt1000 vs. 3-wire / 4-wire Pt100 on long BMS runs',
              dd: 'Using Pt1000 reduces lead-resistance error tenfold compared to 2-wire Pt100, while 3-wire or 4-wire Pt100 compensates lead resistance at the controller.',
            },
          ],
          guideKick: 'Selection guide',
          guideTitle: 'Choosing the right probe for each HVAC zone',
          guideLink: 'Custom OEM cable harnesses →',
          sharedLine:
            'Platinum sensing elements (Pt100, Pt500, Pt1000) according to IEC 60751 (cited as IEC 751 in manufacturer catalogues); Class B standard, Class A optional (confirm tighter tolerances on request).',
          steps: [
            {
              title: 'Supply, return, and fresh air ducts',
              body: 'Flange-mounted air-duct probes (such as TM1705) with an adjustable duct flange and slotted tip positioned in the active airstream.',
            },
            {
              title: 'Retrofit hydronic pipes & manifolds',
              body: 'Clamp-on pipe-surface RTDs (such as the TM1111 series) with curved contact saddles and stainless-steel pipe clamps requiring no pipe drilling.',
            },
            {
              title: 'Heat pump skids & evaporator pockets',
              body: 'Compact flying-lead immersion probes (such as TM1101) for dry wells or compression fittings, ordered to custom harness lengths.',
            },
            {
              title: 'Plant-room headers & cooling towers',
              body: 'Terminal-head RTDs (such as TM1401) for main chilled-water and condenser headers with ceramic terminal blocks or optional 4–20 mA transmitters.',
            },
          ],
          ctaHeading: 'Request an HVAC sensor quote or prototype sample',
          ctaBody:
            'Share your mounting point (duct, pipe clamp, immersion probe, or terminal head), Pt element, and cable length.',
          ctaBtn: 'Open enquiry preview →',
        };

  const checksHtml = copy.checks
    .map((c) => `<div><dt>${escapeHtml(c.dt)}</dt><dd>${escapeHtml(c.dd)}</dd></div>`)
    .join('\n        ');

  const stepsHtml = copy.steps
    .map((s) => `<li><b>${escapeHtml(s.title)}</b><p>${escapeHtml(s.body)}</p></li>`)
    .join('\n          ');

  const mainHtml = `    <nav class="wrap breadcrumbs" aria-label="${escapeHtml(locale === 'de' ? 'Brotkrumennavigation' : 'Breadcrumb')}">
      <a href="${escapeHtml(homeHref)}">${escapeHtml(locale === 'de' ? 'Startseite' : 'Home')}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${escapeHtml(copy.breadcrumb)}</span>
    </nav>

    <section class="wrap hero application-hero">
      <div>
        <span class="eyebrow">${escapeHtml(copy.eyebrow)}</span>
        <h1>${escapeHtml(copy.h1)}</h1>
        <p class="lead">${escapeHtml(copy.lead)}</p>
        <div class="hero-actions">
          <a class="btn primary" href="${escapeHtml(productsHref)}">${escapeHtml(copy.ctaPrimary)}</a>
          <a class="btn ghost" href="${escapeHtml(sampleHref)}">${escapeHtml(copy.ctaSecondary)}</a>
        </div>
      </div>
      <figure class="application-visual">
        <svg viewBox="0 0 500 360" role="img" aria-labelledby="hvac-title hvac-desc">
          <title id="hvac-title">${escapeHtml(copy.svgTitle)}</title>
          <desc id="hvac-desc">${escapeHtml(copy.svgDesc)}</desc>
          <defs><marker id="hv-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#728daa"/></marker></defs>
          <rect x="20" y="58" width="460" height="74" rx="6" fill="#fff" stroke="#b2c7df" stroke-width="2"/>
          <text x="36" y="80" fill="#2e5a8f" font-family="Helvetica Neue,Arial,sans-serif" font-size="13">${escapeHtml(copy.svgDuct)}</text>
          <path d="M40 104h60M40 118h60M330 104h60M330 118h60" stroke="#728daa" stroke-width="2" marker-end="url(#hv-arrow)"/>
          <rect x="196" y="20" width="56" height="30" rx="4" fill="#12294a"/><rect x="186" y="50" width="76" height="8" rx="2" fill="#4677ae"/>
          <rect x="219" y="58" width="10" height="58" fill="#4677ae"/>
          <circle cx="278" cy="28" r="10" fill="#2563eb"/><text x="278" y="32.5" fill="#fff" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="12" font-weight="700">1</text>
          <text x="294" y="32.5" fill="#12294a" font-family="Helvetica Neue,Arial,sans-serif" font-size="13" font-weight="700">${escapeHtml(copy.svg1)}</text>
          <rect x="20" y="236" width="460" height="36" rx="18" fill="#8baccb"/>
          <text x="36" y="259" fill="#fff" font-family="Helvetica Neue,Arial,sans-serif" font-size="13">${escapeHtml(copy.svgPipe)}</text>
          <path d="M440 254h20" stroke="#fff" stroke-width="2" marker-end="url(#hv-arrow)"/>
          <rect x="196" y="226" width="40" height="12" rx="3" fill="#2563eb"/><rect x="204" y="234" width="24" height="42" rx="2" fill="none" stroke="#12294a" stroke-width="2"/>
          <rect x="296" y="186" width="44" height="30" rx="8" fill="#12294a"/><rect x="310" y="216" width="16" height="12" fill="#4677ae"/><rect x="314" y="228" width="8" height="30" fill="#4677ae"/>
          <rect x="372" y="218" width="24" height="18" rx="2" fill="#c9a24a"/><rect x="380" y="236" width="8" height="24" fill="#4677ae"/>
          <circle cx="36" cy="312" r="10" fill="#2563eb"/><text x="36" y="316.5" fill="#fff" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="12" font-weight="700">2</text><text x="52" y="316.5" fill="#12294a" font-family="Helvetica Neue,Arial,sans-serif" font-size="13" font-weight="700">${escapeHtml(copy.svg2)}</text>
          <circle cx="196" cy="312" r="10" fill="#2563eb"/><text x="196" y="316.5" fill="#fff" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="12" font-weight="700">3</text><text x="212" y="316.5" fill="#12294a" font-family="Helvetica Neue,Arial,sans-serif" font-size="13" font-weight="700">${escapeHtml(copy.svg3)}</text>
          <circle cx="356" cy="312" r="10" fill="#2563eb"/><text x="356" y="316.5" fill="#fff" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="12" font-weight="700">4</text><text x="372" y="316.5" fill="#12294a" font-family="Helvetica Neue,Arial,sans-serif" font-size="13" font-weight="700">${escapeHtml(copy.svg4)}</text>
        </svg>
        <figcaption>${escapeHtml(copy.svgCaption)}</figcaption>
      </figure>
    </section>

    <section class="dark-section">
      <div class="wrap section-space">
        <div class="checks-layout">
          <div>
            <h2>${escapeHtml(copy.darkHeading)}</h2>
            <p class="section-intro">${escapeHtml(copy.darkIntro)}</p>
          </div>
          <dl class="checks">
            ${checksHtml}
          </dl>
        </div>
      </div>
    </section>

    <section class="soft-section" id="selection">
      <div class="wrap section-space">
        <div class="section-head">
          <div>
            <div class="kick">${escapeHtml(copy.guideKick)}</div>
            <h2>${escapeHtml(copy.guideTitle)}</h2>
          </div>
          <a class="text-link" href="${escapeHtml(oemHref)}">${escapeHtml(copy.guideLink)}</a>
        </div>
        <p class="shared-line">${escapeHtml(copy.sharedLine)}</p>
        <ol class="requirements">
          ${stepsHtml}
        </ol>
      </div>
    </section>

    <section class="wrap section-space">
      <div class="cta">
        <div>
          <h2>${escapeHtml(copy.ctaHeading)}</h2>
          <p>${escapeHtml(copy.ctaBody)}</p>
        </div>
        <a class="btn primary" href="${escapeHtml(appEnquiryHref)}">${escapeHtml(copy.ctaBtn)}</a>
      </div>
    </section>`;

  return renderShell({
    locale,
    seoTitle: copy.seoTitle,
    seoDescription: copy.seoDescription,
    route,
    routes,
    noindex,
    bodyClass: 'application-page hvac-page',
    activeNav: 'hvac-refrigeration',
    mainHtml,
  });
}

/**
 * Renders the bilingual OEM engineering & customisation page (`en/for-oems.html` or `de/for-oems.html`).
 * Strictly follows BOC-003 Section 3.1, 3.2, 3.3, 3.4 — NO unverified Ex / TM1802 / TM1803 / three-point bath / Callendar–Van Dusen claims.
 */
export function renderForOemsPage(publicInput, locale, { routes, noindex = false } = {}) {
  assertLocale(locale);
  const route = makeStaticRoute(locale, `/${locale}/for-oems.html`, routes);
  const homeHref = routes.resolvePage(`/${locale}/index.html`);
  const sampleHref = routes.enquiryUrl(locale, { intent: 'sample' });
  const docsHref = routes.enquiryUrl(locale, { intent: 'documents' });
  const appHref = routes.enquiryUrl(locale, { intent: 'application' });

  const copy =
    locale === 'de'
      ? {
          seoTitle: 'Für OEMs | Kundenspezifische Fühlerentwicklung & Serienfertigung | Bocon',
          seoDescription:
            'Kundenspezifische Pt100-, Pt500- und Pt1000-Temperaturfühler für Zähler-, HLK- und Maschinenbau-OEMs. Mechanische Anpassung, Musterqualifizierung und Serienlieferung.',
          breadcrumb: 'Für OEMs',
          eyebrow: 'Für Geräte- & Anlagenbauer',
          h1: 'Kundenspezifische RTD-Entwicklung, Musterqualifizierung und Serienlieferung',
          lead: 'Verteilerblöcke, Ventilgehäuse und kompakte Regler passen selten zu Standard-Einbaulängen. Bocon passt bestehende Serien an oder fertigt Pt100-, Pt500- und Pt1000-Baugruppen nach Ihrer mechanischen Zeichnung.',
          ctaPrimary: 'OEM-Muster anfragen →',
          ctaSecondary: 'Konfigurierbare Parameter ↓',
          svgTitle: 'Konfigurierbare mechanische und elektrische Zonen eines OEM-Temperaturfühlers',
          svgDesc: 'Schema mit konfigurierbarer Leitung, Prozessgewinde, Schutzrohrlänge und abgesetzter Messspitze.',
          svgZ1: '1 · Leitung & Stecker',
          svgZ2: '2 · Prozessanschluss',
          svgZ3: '3 · Schutzrohr & Spitze',
          svgDim: 'Einbaulänge L (kundenspezifisch)',
          svgCaption: 'Konfigurierbare Bereiche kundenspezifischer OEM-Fühler: Leitungsabschluss, Prozessgewinde, Schutzrohr und Messspitze.',
          s1Title: '1. Kundenspezifische Fühlerentwicklung',
          s1Link: 'Zeichnung oder Spezifikation anfragen →',
          s1Shared:
            'Das europäische Standardportfolio ist für nicht explosionsgefährdete Industriebereiche ausgelegt. Basisplattformen umfassen Kabel-, Rohranlege-, Steckverbinder-, Anschlusskopf- und HLK-Fühler.',
          thZone: 'Baugruppenbereich',
          thOpts: 'Konfigurierbare Optionen',
          thNotes: 'Technische Hinweise',
          rows: [
            {
              zone: 'Platin-Messelement & Paarung',
              opts: 'Pt100, Pt500, Pt1000 nach IEC 60751 (IEC 751) · Klasse B Standard, Klasse A optional',
              notes: 'Einzel- oder Doppelelemente; gepaarte Vor-/Rücklauffühler für Wärme- und Kältezähler (±0,06 °C Kälte / ±0,1 °C Wärme laut Prospekt).',
            },
            {
              zone: 'Schaltung & Ausgang',
              opts: '2-, 3-, 4-Leiter · Doppelelement (4-/6-Leiter) · optionaler 4–20-mA-Messumformer',
              notes: 'Direkter Widerstandsausgang oder kopfmontierter Messumformer; erforderliche EU-Konformitätserklärungen für aktive/elektronische Ausführungen auf Anfrage.',
            },
            {
              zone: 'Schutzrohr & Geometrie',
              opts: 'Edelstahl 304 / 316L, Kupfer-Anlegeblock · gerade, abgesetzte oder geschlitzte Spitzen',
              notes: 'Durchmesser und Einbaulängen gemäß Kundenzeichnung und gewünschter thermischer Ansprechzeit.',
            },
            {
              zone: 'Prozessanschluss',
              opts: 'M10 × 1, M12 × 1,5, G1/4, G1/2 · Montageflansch, Spannband, Tauchhülse',
              notes: 'Feste Einschraubnippel, Überwurfmuttern, Klemmverschraubungen oder abgestimmte Tauchhülsen.',
            },
            {
              zone: 'Leitung & Konfektionierung',
              opts: 'PVC, PU, Silikon, PTFE, Glasseide — abgelängt nach Spezifikation',
              notes: 'Abisolierte Enden, Aderendhülsen, Ringkabelschuhe oder kundenspezifische Steckverbinder.',
            },
          ],
          s2Title: '2. Muster, Prüfung und Qualifizierung',
          s2Intro:
            'Vor der Serienfreigabe prüfen OEM-Entwicklungsteams Einbaugeometrie, Ansprechzeit, Isolationswiderstand und Dokumentationsumfang. Bocon fertigt sowohl die Temperaturfühler als auch eigene Ansprechzeit-Prüfgeräte.',
          checks: [
            {
              dt: 'Paarung & Prüfprotokolle',
              dd: 'Gepaarte Vor- und Rücklauf-Temperaturfühler werden hinsichtlich der Temperaturdifferenz-Genauigkeit selektiert und geprüft (±0,06 °C Kälte / ±0,1 °C Wärme laut Prospekt). Details zu Prüfprotokollen, Werkskalibrierzeugnissen und Paar-Kennzeichnung werden im Rahmen der Musterqualifizierung abgestimmt.',
            },
            {
              dt: 'Hauseigene Ansprechzeitprüfung',
              dd: 'Ermittlung der thermischen Ansprechzeit in definierten Wasser- und Luftströmungen mit eigenen Prüfständen.',
            },
            {
              dt: 'Managementsysteme (Nanjing vs. Dalian)',
              dd: 'Angaben zu Qualitäts-, Umwelt- und Arbeitsschutzmanagementsystemen (ISO 9001, ISO 14001, ISO 45001) – einschließlich aktuellem Zertifizierungsstatus, Gültigkeitsdauer und Fertigungsstandort (Nanjing vs. Dalian) – bestätigen wir im Rahmen der Lieferantenqualifizierung auf Anfrage.',
            },
            {
              dt: 'Wärmezähler- & Konformitätsdokumentation',
              dd: 'Für ausgewählte TM1101/51-Ausführungen liegen auf Nanjing Bocon ausgestellte EU-Baumusterprüfbescheinigungen (Modul B) vor; den aktuellen Geltungsbereich, die zugehörigen Anhänge sowie den aktuellen Stand der Konformitätsbewertung (Modul D/F) bestätigen wir für Ihre konkrete Ausführung auf Anfrage.',
            },
          ],
          s3Kick: 'Serienlieferung',
          s3Title: '3. Zusammenarbeit & technische Betreuung',
          s3Steps: [
            {
              title: 'Freigegebene Zeichnung und Artikelnummer',
              body: 'Nach Musterfreigabe werden Stückliste, Leitungsspezifikation und Prüfmerkmale für wiederholbare Serienlieferungen dokumentiert.',
            },
            {
              title: 'Direkter technischer Austausch',
              body: 'Spezifikationsfragen, Toleranzklassen und Zeichnungsänderungen werden direkt mit unserem Technik-Team abgestimmt.',
            },
            {
              title: 'Abgestimmte Exportverpackung',
              body: 'Lieferung in geordneten Trays oder paarweisen Beuteln abgestimmt auf Wareneingang und Montage.',
            },
          ],
          checklistTitle: 'Hilfreiche Angaben für OEM-Muster',
          checklist: [
            'Ziel-Temperaturbereich und Medium (Wasser, Luft, Glykol, Öl)',
            'Messelement (Pt100, Pt500, Pt1000), Toleranzklasse und Schaltungsart (2-, 3-, 4-Leiter oder Fühlerpaar)',
            'Schutzrohr-Durchmesser, Einbaulänge und Prozessanschluss bzw. Zeichnung',
            'Leitungsmaterial, Leitungslänge und Konfektionierung',
            'Musterstückzahl für die Qualifizierung und geschätzter Jahresbedarf',
          ],
          docCardTitle: 'Lieferanten- & Zertifikatsdokumentation',
          docCardBody:
            'Aktuelle Datenblätter, Fertigungsstandort-Angaben (Nanjing / Dalian) und projektspezifische Konformitätsnachweise stellen wir auf Anfrage bereit.',
          docCardLink: 'Dokumentation anfragen →',
          ctaHeading: 'Kundenspezifischen Fühler oder Muster besprechen',
          ctaBody: 'Übermitteln Sie Ihre Anforderungen über unsere Anfrage-Vorschau für eine technische Einschätzung.',
          ctaBtn: 'Zur Anfrage-Vorschau →',
        }
      : {
          seoTitle: 'For OEMs | Custom Sensor Development, Qualification & Supply | Bocon',
          seoDescription:
            'Custom Pt100, Pt500, and Pt1000 temperature sensor development for meter, HVAC, and machinery OEMs. Mechanical adaptation, sample qualification, and batch production.',
          breadcrumb: 'For OEMs',
          eyebrow: 'For Equipment Manufacturers',
          h1: 'Custom RTD development, sample qualification, and batch supply',
          lead: 'OEM manifolds, valve bodies, and compact controllers rarely match off-the-shelf probe lengths or cable harnesses. Bocon adapts standard series or builds custom Pt100, Pt500, and Pt1000 assemblies to your mechanical drawing.',
          ctaPrimary: 'Request OEM samples →',
          ctaSecondary: 'Configurable parameters ↓',
          svgTitle: 'Configurable mechanical and electrical zones on a Bocon OEM RTD probe',
          svgDesc: 'Engineering schematic showing customizable lead termination, process thread, sheath length, and stepped sensing tip.',
          svgZ1: '1 · Lead & Connector',
          svgZ2: '2 · Process Thread',
          svgZ3: '3 · Sheath & Tip',
          svgDim: 'Insertion Length L (custom to drawing)',
          svgCaption: 'Configurable zones on custom OEM probe assemblies: lead termination, process thread, sheath geometry, and sensing tip.',
          s1Title: '1. Custom sensor development',
          s1Link: 'Discuss a drawing or specification →',
          s1Shared:
            'Standard European portfolio covers non-hazardous industrial locations. Base platforms include flying-lead probes, pipe-surface sensors, connector RTDs, terminal-head assemblies, and HVAC duct probes.',
          thZone: 'Assembly Zone',
          thOpts: 'Configurable Options',
          thNotes: 'Engineering Notes',
          rows: [
            {
              zone: 'Platinum Element & Pairing',
              opts: 'Pt100, Pt500, Pt1000 per IEC 60751 (IEC 751) · Class B standard, Class A optional',
              notes: 'Single or dual elements; matched flow/return pairs for heating and cooling meters (±0.06 °C cooling / ±0.1 °C heating, per brochure).',
            },
            {
              zone: 'Circuit & Output',
              opts: '2-wire, 3-wire, 4-wire · Dual 4-wire / 6-wire · Optional 4–20 mA transmitter',
              notes: 'Direct resistance output or head-mounted transmitter; applicable EU Declarations of Conformity (for active/electronic products) are provided on request.',
            },
            {
              zone: 'Sheath Material & Geometry',
              opts: 'SUS304, SUS316L, Copper saddle · Straight, stepped, or slotted tips',
              notes: 'Tube diameters and insertion lengths manufactured to your drawing and thermal response targets.',
            },
            {
              zone: 'Process Connection',
              opts: 'M10 × 1, M12 × 1.5, G1/4, G1/2 · Sliding flange, pipe clamp, thermowell',
              notes: 'Fixed hex nipple, union nut, compression fitting, or matched thermowell assembly.',
            },
            {
              zone: 'Cable Jacket & Termination',
              opts: 'PVC, PU, Silicone, PTFE, Fibreglass — cut to specified harness length',
              notes: 'Stripped leads, bootlace ferrules, ring lugs, or customer-specified plugs.',
            },
          ],
          s2Title: '2. Samples, testing, and qualification',
          s2Intro:
            'Before locking a sensor part number for series supply, OEM engineering teams verify mechanical fit, thermal response time, insulation resistance, and supplier documentation. Bocon manufactures both the sensors and in-house thermal response test equipment.',
          checks: [
            {
              dt: 'Pairing & calibration verification',
              dd: 'Matched supply and return sensor pairs are selected and verified for differential temperature accuracy (±0.06 °C cooling / ±0.1 °C heating, per brochure). Calibration protocol details, test certificates, and pair-marking options are confirmed during sample qualification.',
            },
            {
              dt: 'In-house thermal response time testing',
              dd: 'Step response verification in regulated water flow and airflow channels using Bocon thermal response testing apparatus.',
            },
            {
              dt: 'Quality, environmental & OHS management (Nanjing vs. Dalian)',
              dd: 'Quality, environmental, and occupational health and safety management documentation (ISO 9001, ISO 14001, ISO 45001) — including current certification status, validity dates, and manufacturing-site scope (Nanjing vs. Dalian) — is confirmed on request prior to supplier qualification.',
            },
            {
              dt: 'Heat-metering conformity documentation',
              dd: 'EU-Type Examination (Module B) documentation is held by Nanjing Bocon for designated TM1101/51 configurations; current certificate scope, descriptive annexes, and applicable conformity assessment status (Module D/F) are confirmed on request for your exact configuration.',
            },
          ],
          s3Kick: 'Series Production',
          s3Title: '3. Supply and technical support',
          s3Steps: [
            {
              title: 'Locked drawing and part code',
              body: 'Once prototype samples are approved, bill of materials, cable specifications, and inspection criteria are documented for repeat production batches.',
            },
            {
              title: 'Direct engineering contact',
              body: 'Specification reviews, tolerance questions, and drawing revisions are handled directly with our engineering team.',
            },
            {
              title: 'Line-ready export packaging',
              body: 'Probes can be supplied in partitioned trays or paired bags aligned with incoming inspection and assembly workflows.',
            },
          ],
          checklistTitle: 'What to include when requesting OEM samples',
          checklist: [
            'Target temperature range and medium (water, air, glycol, oil)',
            'Sensing element (Pt100, Pt500, Pt1000), tolerance class, and wiring (2W, 3W, 4W, dual, or matched pair)',
            'Sheath outer diameter, insertion length, and process thread or drawing',
            'Cable insulation material, lead length, and termination style',
            'Sample quantity for qualification and estimated annual batch volume',
          ],
          docCardTitle: 'Supplier & conformity documentation',
          docCardBody:
            'Current datasheets, manufacturing-site confirmation (Nanjing vs. Dalian), and project-specific conformity documents are provided on request.',
          docCardLink: 'Request supplier documents →',
          ctaHeading: 'Discuss a custom sensor or request prototype samples',
          ctaBody: 'Share your specification or drawing requirements using our enquiry preview.',
          ctaBtn: 'Open enquiry preview →',
        };

  const tableRowsHtml = copy.rows
    .map(
      (r) => `<tr>
              <th scope="row">${escapeHtml(r.zone)}</th>
              <td>${escapeHtml(r.opts)}</td>
              <td>${escapeHtml(r.notes)}</td>
            </tr>`,
    )
    .join('\n            ');

  const checksHtml = copy.checks
    .map((c) => `<div><dt>${escapeHtml(c.dt)}</dt><dd>${escapeHtml(c.dd)}</dd></div>`)
    .join('\n        ');

  const stepsHtml = copy.s3Steps
    .map((s) => `<li><b>${escapeHtml(s.title)}</b><p>${escapeHtml(s.body)}</p></li>`)
    .join('\n          ');

  const checklistHtml = copy.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n            ');

  const mainHtml = `    <nav class="wrap breadcrumbs" aria-label="${escapeHtml(locale === 'de' ? 'Brotkrumennavigation' : 'Breadcrumb')}">
      <a href="${escapeHtml(homeHref)}">${escapeHtml(locale === 'de' ? 'Startseite' : 'Home')}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${escapeHtml(copy.breadcrumb)}</span>
    </nav>

    <section class="wrap hero application-hero">
      <div>
        <span class="eyebrow">${escapeHtml(copy.eyebrow)}</span>
        <h1>${escapeHtml(copy.h1)}</h1>
        <p class="lead">${escapeHtml(copy.lead)}</p>
        <div class="hero-actions">
          <a class="btn primary" href="${escapeHtml(sampleHref)}">${escapeHtml(copy.ctaPrimary)}</a>
          <a class="btn ghost" href="#custom-development">${escapeHtml(copy.ctaSecondary)}</a>
        </div>
      </div>
      <figure class="application-visual">
        <svg viewBox="0 0 500 300" role="img" aria-labelledby="oem-title oem-desc">
          <title id="oem-title">${escapeHtml(copy.svgTitle)}</title>
          <desc id="oem-desc">${escapeHtml(copy.svgDesc)}</desc>
          <text x="24" y="42" fill="#2e5a8f" font-family="Helvetica Neue,Arial,sans-serif" font-size="12" font-weight="600">${escapeHtml(copy.svgZ1)}</text>
          <text x="195" y="42" fill="#2e5a8f" font-family="Helvetica Neue,Arial,sans-serif" font-size="12" font-weight="600">${escapeHtml(copy.svgZ2)}</text>
          <text x="345" y="42" fill="#2e5a8f" font-family="Helvetica Neue,Arial,sans-serif" font-size="12" font-weight="600">${escapeHtml(copy.svgZ3)}</text>
          <path d="M24 122 L60 108" stroke="#dc2626" stroke-width="2.5"/>
          <path d="M24 130 L60 130" stroke="#475569" stroke-width="2.5"/>
          <path d="M24 138 L60 152" stroke="#475569" stroke-width="2.5"/>
          <rect x="60" y="124" width="90" height="12" rx="3" fill="#4677ae"/>
          <rect x="150" y="120" width="32" height="20" rx="3" fill="#728daa" stroke="#12294a" stroke-width="1.5"/>
          <rect x="182" y="106" width="32" height="48" rx="3" fill="#fff" stroke="#12294a" stroke-width="2"/>
          <rect x="214" y="114" width="32" height="32" fill="#eaf1fb" stroke="#12294a" stroke-width="1.8"/>
          <rect x="246" y="120" width="140" height="20" fill="#fff" stroke="#12294a" stroke-width="2"/>
          <path d="M386 120 L402 124 L402 136 L386 140 Z" fill="#eaf1fb" stroke="#12294a" stroke-width="1.8"/>
          <rect x="402" y="124" width="70" height="12" rx="6" fill="#fff" stroke="#12294a" stroke-width="2"/>
          <rect x="444" y="127" width="18" height="6" rx="1" fill="#2563eb"/>
          <line x1="246" y1="176" x2="472" y2="176" stroke="#12294a" stroke-width="1.4"/>
          <line x1="246" y1="170" x2="246" y2="182" stroke="#12294a" stroke-width="1.4"/>
          <line x1="472" y1="170" x2="472" y2="182" stroke="#12294a" stroke-width="1.4"/>
          <text x="359" y="196" text-anchor="middle" fill="#12294a" font-family="Helvetica Neue,Arial,sans-serif" font-size="12" font-weight="600">${escapeHtml(copy.svgDim)}</text>
        </svg>
        <figcaption>${escapeHtml(copy.svgCaption)}</figcaption>
      </figure>
    </section>

    <section class="wrap section-space" id="custom-development" aria-labelledby="custom-title">
      <div class="section-head">
        <h2 id="custom-title">${escapeHtml(copy.s1Title)}</h2>
        <a class="text-link" href="${escapeHtml(appHref)}">${escapeHtml(copy.s1Link)}</a>
      </div>
      <p class="shared-line">${escapeHtml(copy.s1Shared)}</p>
      <div class="table-scroll" tabindex="0" role="region" aria-labelledby="custom-title">
        <table class="compare-table">
          <thead>
            <tr>
              <th scope="col">${escapeHtml(copy.thZone)}</th>
              <th scope="col">${escapeHtml(copy.thOpts)}</th>
              <th scope="col">${escapeHtml(copy.thNotes)}</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    </section>

    <section class="dark-section" id="samples-qualification">
      <div class="wrap section-space">
        <div class="checks-layout">
          <div>
            <h2>${escapeHtml(copy.s2Title)}</h2>
            <p class="section-intro">${escapeHtml(copy.s2Intro)}</p>
          </div>
          <dl class="checks">
            ${checksHtml}
          </dl>
        </div>
      </div>
    </section>

    <section class="soft-section" id="supply-support">
      <div class="wrap section-space">
        <div class="two-col">
          <div>
            <div class="kick">${escapeHtml(copy.s3Kick)}</div>
            <h2>${escapeHtml(copy.s3Title)}</h2>
            <ol class="requirements">
              ${stepsHtml}
            </ol>
          </div>
          <div class="stack">
            <div class="info-card">
              <h3>${escapeHtml(copy.checklistTitle)}</h3>
              <ul>
                ${checklistHtml}
              </ul>
            </div>
            <div class="info-card">
              <h3>${escapeHtml(copy.docCardTitle)}</h3>
              <p>${escapeHtml(copy.docCardBody)}</p>
              <a class="text-link" href="${escapeHtml(docsHref)}">${escapeHtml(copy.docCardLink)}</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="wrap section-space">
      <div class="cta">
        <div>
          <h2>${escapeHtml(copy.ctaHeading)}</h2>
          <p>${escapeHtml(copy.ctaBody)}</p>
        </div>
        <a class="btn primary" href="${escapeHtml(sampleHref)}">${escapeHtml(copy.ctaBtn)}</a>
      </div>
    </section>`;

  return renderShell({
    locale,
    seoTitle: copy.seoTitle,
    seoDescription: copy.seoDescription,
    route,
    routes,
    noindex,
    bodyClass: 'application-page oem-page',
    activeNav: 'for-oems',
    mainHtml,
  });
}

/**
 * Renders the honest preview privacy notice (`en/privacy.html` or `de/privacy.html`).
 */
export function renderPrivacyPage(locale, { routes, noindex = false } = {}) {
  assertLocale(locale);
  const route = makeStaticRoute(locale, `/${locale}/privacy.html`, routes);
  const homeHref = routes.resolvePage(`/${locale}/index.html`);

  const copy =
    locale === 'de'
      ? {
          seoTitle: 'Datenschutz (Vorschau) — Bocon',
          seoDescription:
            'Datenschutzhinweis für die nicht-produktive Vorschau-Website von Bocon Europa. Keine Online-Formularübertragung oder Speicherung aktiv.',
          breadcrumb: 'Datenschutz',
          eyebrow: 'Datenschutz · Vorschau-Hinweis',
          h1: 'Datenschutzhinweis (Vorschau)',
          bannerTitle: 'Dies ist eine statische Vorschau-Website.',
          bannerBody:
            'Derzeit findet keine Online-Übertragung und keine serverseitige Speicherung von Formulardaten statt. Bitte geben Sie im Vorschau-Anfrageformular keine personenbezogenen oder vertraulichen Daten ein.',
          sections: [
            {
              h2: '1. Status dieser Vorschau-Website',
              p: 'Diese Seiten dienen der technischen und inhaltlichen Prüfung vor der Produktivschaltung. Es werden weder Analyse- noch Werbe-Cookies oder Tracking-Skripte eingesetzt.',
            },
            {
              h2: '2. Anfrage-Vorschauformular',
              p: 'Eingaben im Anfrage-Vorschauformular verbleiben ausschließlich lokal in Ihrem Browser und werden weder an einen Server gesendet noch gespeichert.',
            },
            {
              h2: '3. Finale DSGVO-Angaben vor Produktivstart',
              p: 'Vor der öffentlichen Freigabe und vor Anbindung eines produktiven Anfrage-Backends werden der verantwortliche europäische Ansprechpartner, alle DSGVO-Pflichtangaben (Art. 13/14 DSGVO), Speicherdauern und Betroffenenrechte abschließend ergänzt.',
            },
          ],
        }
      : {
          seoTitle: 'Privacy Notice (Preview) — Bocon',
          seoDescription:
            'Honest preview privacy notice for the Bocon European website preview. No online form transmission or backend storage is active yet.',
          breadcrumb: 'Privacy',
          eyebrow: 'Data protection · Preview notice',
          h1: 'Privacy Notice (Preview)',
          bannerTitle: 'This is a static preview website.',
          bannerBody:
            'No online form transmission or server-side storage is connected yet. Please do not enter personal or confidential information into the preview enquiry form.',
          sections: [
            {
              h2: '1. Preview website operation',
              p: 'These pages are provided for pre-launch review and handoff. This static preview does not set advertising cookies, analytics trackers, or behavioural profiling scripts.',
            },
            {
              h2: '2. Preview enquiry form',
              p: 'Any entries typed into the preview enquiry form stay locally inside your browser session and are neither transmitted nor stored.',
            },
            {
              h2: '3. Production GDPR details prior to launch',
              p: 'Final GDPR controller details, European contact information, retention schedules, and data-subject rights disclosures will be confirmed and published before live enquiry submission is enabled.',
            },
          ],
        };

  const sectionsHtml = copy.sections
    .map((s) => `<h2>${escapeHtml(s.h2)}</h2>\n      <p>${escapeHtml(s.p)}</p>`)
    .join('\n      ');

  const mainHtml = `    <nav class="wrap breadcrumbs" aria-label="${escapeHtml(locale === 'de' ? 'Brotkrumennavigation' : 'Breadcrumb')}">
      <a href="${escapeHtml(homeHref)}">${escapeHtml(locale === 'de' ? 'Startseite' : 'Home')}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${escapeHtml(copy.breadcrumb)}</span>
    </nav>
    <section class="wrap">
      <div class="legal-page">
        <span class="eyebrow">${escapeHtml(copy.eyebrow)}</span>
        <h1>${escapeHtml(copy.h1)}</h1>
        <div class="preview-banner" role="note">
          <strong>${escapeHtml(copy.bannerTitle)}</strong>
          ${escapeHtml(copy.bannerBody)}
        </div>
        ${sectionsHtml}
      </div>
    </section>`;

  return renderShell({
    locale,
    seoTitle: copy.seoTitle,
    seoDescription: copy.seoDescription,
    route,
    routes,
    noindex,
    bodyClass: 'legal-doc-page',
    activeNav: '',
    mainHtml,
  });
}

/**
 * Renders the preview Impressum / legal notice shell (`en/impressum.html` or `de/impressum.html`).
 */
export function renderImpressumPage(locale, { routes, noindex = false } = {}) {
  assertLocale(locale);
  const route = makeStaticRoute(locale, `/${locale}/impressum.html`, routes);
  const homeHref = routes.resolvePage(`/${locale}/index.html`);

  const copy =
    locale === 'de'
      ? {
          seoTitle: 'Impressum (Vorschau) — Bocon',
          seoDescription:
            'Vorschau-Impressum für Dalian Bocon Science & Technology Co., Ltd. Finale europäische Kontakt- und Pflichtangaben folgen vor dem Launch.',
          breadcrumb: 'Impressum',
          eyebrow: 'Rechtliche Hinweise · Vorschau',
          h1: 'Impressum (Vorschau)',
          bannerTitle: 'Vorschau-Fassung — europäische Kontaktangaben in Abstimmung.',
          bannerBody:
            'Die endgültigen europäischen Kontakt-, Vertretungs- und Registerangaben werden vor der öffentlichen Freigabe der Website verbindlich bestätigt und ergänzt.',
          sections: [
            {
              h2: 'Hersteller',
              p: 'Dalian Bocon Science & Technology Co., Ltd., 9-1, No. 23, Shidai-E Rd, Dalian Bonded Area, Dalian, Liaoning Province, China.',
            },
            {
              h2: 'Kontakt (Hersteller)',
              p: 'Tel: +86-411-88122286 · E-Mail: export@bocontech.com / beitoo@bocontech.com',
            },
            {
              h2: 'Hinweis zu technischen Angaben',
              p: 'Abmessungen, Messbereiche und Werkstoffangaben auf dieser Vorschau-Website dienen der technischen Vororientierung. Verbindlich für Serien- oder OEM-Lieferungen sind ausschließlich freigegebene Zeichnungen, Angebote und Auftragsbestätigungen.',
            },
          ],
        }
      : {
          seoTitle: 'Legal Notice / Impressum (Preview) — Bocon',
          seoDescription:
            'Preview legal notice for Dalian Bocon Science & Technology Co., Ltd. Final European contact and legal details pending launch confirmation.',
          breadcrumb: 'Legal notice',
          eyebrow: 'Legal notice · Preview',
          h1: 'Impressum / Legal Notice (Preview)',
          bannerTitle: 'Preview shell — European contact details pending launch confirmation.',
          bannerBody:
            'Final European contact, legal entity, and statutory disclosure details will be confirmed and inserted prior to public launch.',
          sections: [
            {
              h2: 'Manufacturer',
              p: 'Dalian Bocon Science & Technology Co., Ltd., 9-1, No. 23, Shidai-E Rd, Dalian Bonded Area, Dalian, Liaoning Province, China.',
            },
            {
              h2: 'Manufacturer contact',
              p: 'Tel: +86-411-88122286 · Email: export@bocontech.com / beitoo@bocontech.com',
            },
            {
              h2: 'Technical specifications notice',
              p: 'Dimensions, ranges, and material specifications shown in this preview are for technical evaluation. Binding specifications for custom or series orders are governed by the approved engineering drawing and quotation.',
            },
          ],
        };

  const sectionsHtml = copy.sections
    .map((s) => `<h2>${escapeHtml(s.h2)}</h2>\n      <p>${escapeHtml(s.p)}</p>`)
    .join('\n      ');

  const mainHtml = `    <nav class="wrap breadcrumbs" aria-label="${escapeHtml(locale === 'de' ? 'Brotkrumennavigation' : 'Breadcrumb')}">
      <a href="${escapeHtml(homeHref)}">${escapeHtml(locale === 'de' ? 'Startseite' : 'Home')}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">${escapeHtml(copy.breadcrumb)}</span>
    </nav>
    <section class="wrap">
      <div class="legal-page">
        <span class="eyebrow">${escapeHtml(copy.eyebrow)}</span>
        <h1>${escapeHtml(copy.h1)}</h1>
        <div class="preview-banner" role="note">
          <strong>${escapeHtml(copy.bannerTitle)}</strong>
          ${escapeHtml(copy.bannerBody)}
        </div>
        ${sectionsHtml}
      </div>
    </section>`;

  return renderShell({
    locale,
    seoTitle: copy.seoTitle,
    seoDescription: copy.seoDescription,
    route,
    routes,
    noindex,
    bodyClass: 'legal-doc-page',
    activeNav: '',
    mainHtml,
  });
}
