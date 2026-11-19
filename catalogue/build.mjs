#!/usr/bin/env node
/**
 * Deterministic static build pipeline and CLI for the Bocon verified catalogue.
 *
 * Reads reviewed private records from `sourceDir` (categories.json, resources.json,
 * products/*.json), validates and projects strictly allowlisted public data, verifies
 * all referenced public assets exist, copies required static assets so `outDir` is
 * self-contained, and emits localized EN/DE HTML pages plus sitemap-catalogue.xml
 * (omitted when `--noindex` is active).
 *
 * Never writes into `sourceDir` and never deletes unrelated existing files in `outDir`.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { SUPPORTED_LOCALES, validateCatalogue } from './validate.mjs';
import { publicCatalogue } from './project.mjs';
import { buildRoutes } from './routes.mjs';
import {
  renderProduct,
  renderCategory,
  renderCatalogueHub,
  renderEnquiryPage,
} from './render.mjs';

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(THIS_DIR, '..');

const REQUIRED_SHARED_ASSETS = Object.freeze([
  'v2/assets/tokens.css',
  'v2/assets/site.css',
  'v2/assets/wiring-diagrams.js',
  'v2/logo/bocon-wordmark.png',
  'assets/catalogue.css',
  'assets/enquiry-preview.js',
]);

function makeError(code, message, extra = {}) {
  const err = new Error(message);
  err.code = code;
  Object.assign(err, extra);
  return err;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isPathInsideOrEqual(candidate, parent) {
  const rel = path.relative(parent, candidate);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function loadSourceCatalogue(sourceDir) {
  const categoriesPath = path.join(sourceDir, 'categories.json');
  const resourcesPath = path.join(sourceDir, 'resources.json');
  const productsDir = path.join(sourceDir, 'products');

  const [categoriesRaw, resourcesRaw] = await Promise.all([
    readJsonFile(categoriesPath),
    readJsonFile(resourcesPath),
  ]);

  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw
    : categoriesRaw?.categories;
  const resources = Array.isArray(resourcesRaw)
    ? resourcesRaw
    : resourcesRaw?.resources;

  const entries = await fs.readdir(productsDir, { withFileTypes: true });
  const productFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const products = [];
  for (const fileName of productFiles) {
    const prod = await readJsonFile(path.join(productsDir, fileName));
    products.push(prod);
  }

  return { categories, resources, products };
}

async function resolvePublicAssetSource(relPath, sourceDir, repoRoot) {
  for (const root of [sourceDir, repoRoot]) {
    const candidate = path.resolve(root, relPath);
    if (!isPathInsideOrEqual(candidate, root)) {
      throw makeError(
        'INVALID_PUBLIC_PATH',
        `Public asset path "${relPath}" escapes root directory`,
      );
    }
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) return candidate;
    } catch {
      // Try next root
    }
  }
  throw makeError(
    'MISSING_PUBLIC_ASSET',
    `Referenced public asset "${relPath}" was not found in sourceDir or repoRoot`,
    { assetPath: relPath },
  );
}

function renderSitemapXml(urlEntries) {
  const sorted = [...urlEntries].sort((a, b) => a.loc.localeCompare(b.loc));
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];

  for (const entry of sorted) {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(entry.loc)}</loc>`);
    if (entry.alternates) {
      for (const locale of SUPPORTED_LOCALES) {
        if (entry.alternates[locale]) {
          lines.push(
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(entry.alternates[locale])}"/>`,
          );
        }
      }
      if (entry.alternates.en) {
        lines.push(
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(entry.alternates.en)}"/>`,
        );
      }
    }
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  return `${lines.join('\n')}\n`;
}

async function writeTextFile(outDir, relPath, content, writtenFiles) {
  const normRel = relPath.replace(/^\/+/, '').split(path.sep).join('/');
  const dest = path.resolve(outDir, normRel);
  if (!isPathInsideOrEqual(dest, outDir)) {
    throw makeError('INVALID_OUTPUT_PATH', `Refusing to write outside outDir: ${relPath}`);
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, content, 'utf8');
  writtenFiles.push(normRel);
}

async function copyBinaryFile(srcPath, outDir, relPath, writtenFiles) {
  const normRel = relPath.replace(/^\/+/, '').split(path.sep).join('/');
  const dest = path.resolve(outDir, normRel);
  if (!isPathInsideOrEqual(dest, outDir)) {
    throw makeError('INVALID_OUTPUT_PATH', `Refusing to copy outside outDir: ${relPath}`);
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(srcPath, dest);
  writtenFiles.push(normRel);
}

/**
 * Builds the deterministic static catalogue into `outDir`.
 */
export async function buildCatalogue({
  sourceDir,
  outDir,
  origin = '',
  basePath = '',
  noindex = false,
  repoRoot = DEFAULT_REPO_ROOT,
} = {}) {
  if (!sourceDir || typeof sourceDir !== 'string') {
    throw makeError('MISSING_OPTION', 'buildCatalogue requires sourceDir');
  }
  if (!outDir || typeof outDir !== 'string') {
    throw makeError('MISSING_OPTION', 'buildCatalogue requires outDir');
  }

  const resolvedSource = path.resolve(sourceDir);
  const resolvedOut = path.resolve(outDir);
  const resolvedRepo = path.resolve(repoRoot);

  if (isPathInsideOrEqual(resolvedOut, resolvedSource)) {
    throw makeError(
      'OUT_INSIDE_SOURCE',
      `outDir (${resolvedOut}) must not be equal to or inside sourceDir (${resolvedSource})`,
    );
  }

  const rawInput = await loadSourceCatalogue(resolvedSource);

  const { errors } = validateCatalogue(rawInput);
  if (errors.length > 0) {
    throw makeError(
      'CATALOGUE_VALIDATION_FAILED',
      `Catalogue validation failed with ${errors.length} error(s): ${errors[0].code} at ${errors[0].path}`,
      { errors },
    );
  }

  const pub = publicCatalogue(rawInput);
  const routes = buildRoutes(pub, { origin, basePath });

  // Verify every required shared asset and every referenced public image/resource BEFORE writing
  const sharedAssetSources = new Map();
  for (const rel of REQUIRED_SHARED_ASSETS) {
    const src = await resolvePublicAssetSource(rel, resolvedRepo, resolvedSource);
    sharedAssetSources.set(rel, src);
  }

  const referencedAssets = new Set();
  for (const prod of pub.products) {
    for (const img of prod.images || []) {
      if (img.publicPath) referencedAssets.add(img.publicPath);
    }
  }
  for (const res of pub.resources) {
    if (res.access === 'public' && res.publicPath) {
      referencedAssets.add(res.publicPath);
    }
  }

  const publicAssetSources = new Map();
  for (const rel of [...referencedAssets].sort()) {
    const src = await resolvePublicAssetSource(rel, resolvedSource, resolvedRepo);
    publicAssetSources.set(rel, src);
  }

  await fs.mkdir(resolvedOut, { recursive: true });
  const writtenFiles = [];

  // Copy shared assets and referenced public images/resources
  for (const [rel, src] of sharedAssetSources) {
    await copyBinaryFile(src, resolvedOut, rel, writtenFiles);
  }
  for (const [rel, src] of publicAssetSources) {
    if (!sharedAssetSources.has(rel)) {
      await copyBinaryFile(src, resolvedOut, rel, writtenFiles);
    }
  }

  const sitemapEntries = [];

  // 1. Localized catalogue hubs (en/products/index.html, de/products/index.html)
  const hubAlternates = {};
  for (const locale of SUPPORTED_LOCALES) {
    const href = routes.resolvePage(`/${locale}/products/index.html`);
    hubAlternates[locale] = routes.origin ? `${routes.origin}${href}` : href;
  }
  for (const locale of SUPPORTED_LOCALES) {
    const html = renderCatalogueHub(pub, locale, { routes, noindex });
    const relFile = `${locale}/products/index.html`;
    await writeTextFile(resolvedOut, relFile, html, writtenFiles);
    sitemapEntries.push({
      loc: hubAlternates[locale],
      alternates: hubAlternates,
    });
  }

  // 2. Localized category pages
  for (const category of pub.categories) {
    for (const locale of Object.keys(category.locales).sort()) {
      const route = routes.categories[category.id][locale];
      const html = renderCategory(category, locale, {
        products: pub.products,
        routes,
        noindex,
      });
      await writeTextFile(resolvedOut, route.filePath, html, writtenFiles);
      sitemapEntries.push({
        loc: route.url,
        alternates: route.alternates,
      });
    }
  }

  // 3. Localized product pages
  for (const product of pub.products) {
    for (const locale of Object.keys(product.locales).sort()) {
      const route = routes.products[product.id][locale];
      const html = renderProduct(product, locale, {
        categories: pub.categories,
        resources: pub.resources,
        routes,
        noindex,
      });
      await writeTextFile(resolvedOut, route.filePath, html, writtenFiles);
      sitemapEntries.push({
        loc: route.url,
        alternates: route.alternates,
      });
    }
  }

  // 4. Localized truthful-preview enquiry pages (en/contact.html, de/contact.html)
  for (const locale of SUPPORTED_LOCALES) {
    const html = renderEnquiryPage(pub, locale, { routes, noindex });
    await writeTextFile(resolvedOut, `${locale}/contact.html`, html, writtenFiles);
  }

  // 5. Sitemap (only when indexable; omitted for --noindex previews)
  if (!noindex) {
    const xml = renderSitemapXml(sitemapEntries);
    await writeTextFile(resolvedOut, 'sitemap-catalogue.xml', xml, writtenFiles);
  }

  writtenFiles.sort((a, b) => a.localeCompare(b));

  return {
    files: writtenFiles,
    excluded: pub.excluded,
    errors: [],
  };
}

function parseCliArgs(argv) {
  const args = {
    sourceDir: '',
    outDir: '',
    origin: '',
    basePath: '',
    noindex: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--source') {
      args.sourceDir = argv[++i] || '';
    } else if (token === '--out') {
      args.outDir = argv[++i] || '';
    } else if (token === '--origin') {
      args.origin = argv[++i] || '';
    } else if (token === '--base-path') {
      args.basePath = argv[++i] || '';
    } else if (token === '--noindex') {
      args.noindex = true;
    } else {
      throw makeError('UNKNOWN_ARGUMENT', `Unknown CLI argument: ${token}`);
    }
  }

  if (!args.sourceDir || !args.outDir || !args.origin || !args.basePath) {
    throw makeError(
      'MISSING_CLI_OPTIONS',
      'Usage: node catalogue/build.mjs --source <dir> --out <dir> --origin <origin> --base-path <basePath> [--noindex]',
    );
  }

  return args;
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  try {
    const opts = parseCliArgs(process.argv.slice(2));
    const result = await buildCatalogue(opts);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (err) {
    process.stderr.write(`${err.code || 'BUILD_ERROR'}: ${err.message}\n`);
    process.exit(1);
  }
}
