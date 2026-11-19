/**
 * Strictly synthetic catalogue fixtures for contract validation and projection tests.
 * Uses clearly non-production identifiers (SYN-*) and never real Bocon product records.
 */

export function validCatalogue() {
  return {
    categories: [
      {
        id: 'syn-cat-probes',
        kind: 'probe',
        locales: {
          en: {
            slug: 'synthetic-probes',
            title: 'Synthetic Temperature Probes',
            intro: 'Synthetic probe category for contract verification.',
            reviewStatus: 'reviewed',
          },
          de: {
            slug: 'synthetische-fuehler',
            title: 'Synthetische Temperaturfuehler',
            intro: 'Synthetische Fuehlerkategorie zur Vertragspruefung.',
            reviewStatus: 'reviewed',
          },
        },
        orderedProductIds: ['syn-probe-alpha'],
      },
      {
        id: 'syn-cat-elements',
        kind: 'element',
        locales: {
          en: {
            slug: 'synthetic-elements',
            title: 'Synthetic Sensing Elements',
            intro: 'Synthetic sensing element category for contract verification.',
            reviewStatus: 'reviewed',
          },
          de: {
            slug: 'synthetische-messelemente',
            title: 'Synthetische Messelemente',
            intro: 'Synthetische Messelementkategorie zur Vertragspruefung.',
            reviewStatus: 'reviewed',
          },
        },
        orderedProductIds: ['syn-element-beta'],
      },
    ],
    products: [
      {
        id: 'syn-probe-alpha',
        modelCodes: ['SYN-P100-A', 'SYN-P100-B'],
        kind: 'probe',
        categoryId: 'syn-cat-probes',
        technicalRevision: '2026-01',
        publicationStatus: 'reviewed',
        locales: {
          en: {
            slug: 'synthetic-immersion-probe',
            title: 'Synthetic Immersion Probe SYN-P100',
            summary: 'Synthetic immersion probe with two sheath configurations.',
            applications: ['Synthetic fluid bath monitoring', 'Synthetic test rig'],
            seoTitle: 'Synthetic Immersion Probe SYN-P100',
            seoDescription: 'Synthetic bilingual probe fixture for contract tests.',
            reviewedTechnicalRevision: '2026-01',
            reviewStatus: 'reviewed',
          },
          de: {
            slug: 'synthetischer-tauchfuehler',
            title: 'Synthetischer Tauchfuehler SYN-P100',
            summary: 'Synthetischer Tauchfuehler mit zwei Schutzrohrvarianten.',
            applications: ['Synthetische Fluessigkeitsueberwachung', 'Synthetischer Pruefstand'],
            seoTitle: 'Synthetischer Tauchfuehler SYN-P100',
            seoDescription: 'Synthetische zweisprachige Fuehler-Fixture fuer Vertragstests.',
            reviewedTechnicalRevision: '2026-01',
            reviewStatus: 'reviewed',
          },
        },
        images: [
          {
            publicPath: 'assets/products/syn-p100-overview.jpg',
            alt: {
              en: 'Synthetic probe SYN-P100 overview',
              de: 'Synthetischer Fuehler SYN-P100 Uebersicht',
            },
            variantId: null,
            approvalStatus: 'approved',
          },
          {
            publicPath: 'assets/products/syn-p100-b-detail.jpg',
            alt: {
              en: 'Synthetic probe SYN-P100-B detail',
              de: 'Synthetischer Fuehler SYN-P100-B Detail',
            },
            variantId: 'syn-probe-alpha-b',
            approvalStatus: 'approved',
          },
        ],
        specs: [
          {
            key: 'measuring_range',
            row: 'range',
            value: { min: -50, max: 250 },
            unit: '°C',
            conditions: {
              en: 'Continuous operation in liquid',
              de: 'Dauerbetrieb in Fluessigkeit',
            },
            configurationId: null,
            evidenceId: 'SYN-EV-101',
          },
          {
            key: 'sheath_material',
            row: 'material',
            value: 'AISI 316L',
            unit: null,
            conditions: null,
            configurationId: null,
            evidenceId: 'SYN-EV-102',
          },
          {
            key: 'response_time_t90',
            row: 'performance',
            value: null,
            unit: 's',
            conditions: {
              en: 'Unknown — pending synthetic lab test',
              de: 'Unbekannt — synthetische Laborpruefung ausstehend',
            },
            configurationId: null,
            evidenceId: 'SYN-EV-103',
          },
        ],
        variants: [
          {
            id: 'syn-probe-alpha-a',
            modelCode: 'SYN-P100-A',
            specs: [
              {
                key: 'sheath_diameter',
                row: 'geometry',
                value: 6,
                unit: 'mm',
                conditions: null,
                configurationId: 'syn-probe-alpha-a',
                evidenceId: 'SYN-EV-104',
              },
              {
                key: 'ingress_protection',
                row: 'protection',
                value: 'IP65',
                unit: null,
                conditions: {
                  en: 'With mating connector installed',
                  de: 'Mit gestecktem Gegenstecker',
                },
                configurationId: 'syn-probe-alpha-a',
                evidenceId: 'SYN-EV-105',
              },
            ],
            wiringPresetIds: ['2-wire', '3-wire'],
          },
          {
            id: 'syn-probe-alpha-b',
            modelCode: 'SYN-P100-B',
            specs: [
              {
                key: 'sheath_diameter',
                row: 'geometry',
                value: 8,
                unit: 'mm',
                conditions: null,
                configurationId: 'syn-probe-alpha-b',
                evidenceId: 'SYN-EV-106',
              },
              {
                key: 'ingress_protection',
                row: 'protection',
                value: 'IP67',
                unit: null,
                conditions: {
                  en: 'Factory-sealed cable gland',
                  de: 'Werkseitig abgedichtete Kabelverschraubung',
                },
                configurationId: 'syn-probe-alpha-b',
                evidenceId: 'SYN-EV-107',
              },
            ],
            wiringPresetIds: ['4-wire'],
          },
        ],
        resourceIds: ['syn-res-public-ds', 'syn-res-request-cert'],
        review: {
          reviewer: 'synthetic-qa-agent',
          reviewedAt: '2026-11-19',
          internalNotes: 'INTERNAL_REVIEW_NOTE_DO_NOT_PUBLISH',
        },
        provenance: {
          sourceArchive: 'PRIVATE_ARCHIVE_MARKER/syn-p100-source.pdf',
        },
      },
      {
        id: 'syn-element-beta',
        modelCodes: ['SYN-E200-100', 'SYN-E200-1000'],
        kind: 'element',
        categoryId: 'syn-cat-elements',
        technicalRevision: '2026-02',
        publicationStatus: 'reviewed',
        locales: {
          en: {
            slug: 'synthetic-platinum-element',
            title: 'Synthetic Platinum Element SYN-E200',
            summary: 'Synthetic thin-film sensing element series for contract testing.',
            applications: ['Synthetic assembly integration'],
            seoTitle: 'Synthetic Platinum Element SYN-E200',
            seoDescription: 'Synthetic sensing element fixture.',
            reviewedTechnicalRevision: '2026-02',
            reviewStatus: 'reviewed',
          },
          de: {
            slug: 'synthetisches-platin-element',
            title: 'Synthetisches Platin-Messelement SYN-E200',
            summary: 'Synthetische Duennschicht-Messelementserie fuer Vertragstests.',
            applications: ['Synthetische Baugruppenintegration'],
            seoTitle: 'Synthetisches Platin-Messelement SYN-E200',
            seoDescription: 'Synthetische Messelement-Fixture.',
            reviewedTechnicalRevision: '2026-02',
            reviewStatus: 'reviewed',
          },
        },
        images: [
          {
            publicPath: 'assets/products/syn-e200-chip.jpg',
            alt: {
              en: 'Synthetic sensing element SYN-E200',
              de: 'Synthetisches Messelement SYN-E200',
            },
            variantId: null,
            approvalStatus: 'approved',
          },
        ],
        specs: [
          {
            key: 'element_type',
            row: 'elementAccuracy',
            value: {
              en: 'Synthetic thin-film platinum, Class A',
              de: 'Synthetisches Duennschicht-Platin, Klasse A',
            },
            unit: null,
            conditions: {
              en: 'Synthetic reference standard',
              de: 'Synthetische Referenznorm',
            },
            configurationId: null,
            evidenceId: 'SYN-EV-201',
          },
          {
            key: 'operating_range',
            row: 'range',
            value: { min: -70, max: 500 },
            unit: '°C',
            conditions: null,
            configurationId: null,
            evidenceId: 'SYN-EV-202',
          },
        ],
        variants: [
          {
            id: 'syn-element-beta-100',
            modelCode: 'SYN-E200-100',
            specs: [
              {
                key: 'nominal_resistance',
                row: 'elementAccuracy',
                value: 100,
                unit: 'Ω',
                conditions: { en: 'At 0 °C', de: 'Bei 0 °C' },
                configurationId: 'syn-element-beta-100',
                evidenceId: 'SYN-EV-203',
              },
            ],
            wiringPresetIds: [],
          },
          {
            id: 'syn-element-beta-1000',
            modelCode: 'SYN-E200-1000',
            specs: [
              {
                key: 'nominal_resistance',
                row: 'elementAccuracy',
                value: 1000,
                unit: 'Ω',
                conditions: { en: 'At 0 °C', de: 'Bei 0 °C' },
                configurationId: 'syn-element-beta-1000',
                evidenceId: 'SYN-EV-204',
              },
            ],
            wiringPresetIds: [],
          },
        ],
        resourceIds: ['syn-res-public-ds'],
      },
    ],
    resources: [
      {
        id: 'syn-res-public-ds',
        type: 'datasheet',
        language: 'en',
        revision: 'Rev 1.0',
        access: 'public',
        approved: true,
        publicPath: 'documents/syn-catalogue-datasheet-en.pdf',
        productIds: ['syn-probe-alpha', 'syn-element-beta'],
        variantIds: ['syn-probe-alpha-a', 'syn-probe-alpha-b'],
        certificateScope: null,
        privateSource: {
          path: 'PRIVATE_SOURCE_DIR/syn-datasheet-master.pdf',
        },
      },
      {
        id: 'syn-res-request-cert',
        type: 'certificate',
        language: 'en-de',
        revision: '2026-Q1',
        access: 'request-only',
        approved: true,
        publicPath: null,
        productIds: ['syn-probe-alpha'],
        variantIds: ['syn-probe-alpha-b'],
        certificateScope: {
          issuer: 'Synthetic Certification Body',
          holder: 'Synthetic Manufacturer Ltd.',
          site: 'Synthetic Test Facility',
          scope: 'SYN-P100-B synthetic calibration scope',
          validity: '2026-01-01 to 2029-01-01',
        },
        privateSource: {
          path: 'PRIVATE_SOURCE_DIR/syn-cert-restricted.pdf',
        },
      },
    ],
  };
}

/**
 * Simulated new ordinary product entry (equipment kind) proving the compact contract
 * accepts a new product without any schema extension.
 */
export function simulatedNewEquipmentProduct() {
  return {
    id: 'syn-equip-gamma',
    modelCodes: ['SYN-T900-STD'],
    kind: 'equipment',
    categoryId: 'syn-cat-probes',
    technicalRevision: '2026-03',
    publicationStatus: 'reviewed',
    locales: {
      en: {
        slug: 'synthetic-response-tester',
        title: 'Synthetic Response Tester SYN-T900-STD',
        summary: 'Synthetic bench equipment proving no new schema type is needed.',
        applications: ['Synthetic response-time verification'],
        seoTitle: 'Synthetic Response Tester SYN-T900-STD',
        seoDescription: 'Synthetic equipment record for schema-simplicity test.',
        reviewedTechnicalRevision: '2026-03',
        reviewStatus: 'reviewed',
      },
      de: {
        slug: 'synthetischer-ansprechzeitpruefer',
        title: 'Synthetischer Ansprechzeitpruefer SYN-T900-STD',
        summary: 'Synthetisches Pruefgeraet ohne zusaetzlichen Schematyp.',
        applications: ['Synthetische Ansprechzeitpruefung'],
        seoTitle: 'Synthetischer Ansprechzeitpruefer SYN-T900-STD',
        seoDescription: 'Synthetischer Geraetedatensatz fuer Schema-Einfachheitstest.',
        reviewedTechnicalRevision: '2026-03',
        reviewStatus: 'reviewed',
      },
    },
    images: [],
    specs: [
      {
        key: 'supply_voltage',
        row: 'performance',
        value: 230,
        unit: 'V AC',
        conditions: { en: '50 Hz mains', de: '50 Hz Netz' },
        configurationId: null,
        evidenceId: 'SYN-EV-301',
      },
    ],
    variants: [
      {
        id: 'syn-equip-gamma-std',
        modelCode: 'SYN-T900-STD',
        specs: [],
        wiringPresetIds: [],
      },
    ],
    resourceIds: [],
  };
}
