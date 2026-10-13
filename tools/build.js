/* =====================================================================
   Shmor site kit: static SEO build
   Turns the JSON files in content/ into real, crawlable HTML pages.

     node tools/build.js          build the site into this folder
     node tools/build.js --check  validate content only

   Inputs
     shmor-site.json        site identity, seo block, referral links, offers
     content/(folders/)name.json  one file per page (content/home.json = homepage)
     templates/layout.html  this site's own design (header, footer, wrapper)
     assets/                this site's CSS / JS / images

   Every page gets: <title>, meta description, canonical, Open Graph,
   Twitter card, JSON-LD (WebSite/Organization, BreadcrumbList, FAQPage),
   breadcrumbs, internal links. Also writes sitemap.xml, robots.txt,
   404.html, /search/ (noindex) and search-index.json.
   ===================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const site = JSON.parse(read('shmor-site.json'));
const seo = site.seo || {};
const NAME = seo.siteName || site.name;
const BASE = `https://${site.subdomain}.shmor.ai`;
const MASTER = 'https://shmor.ai';
const TODAY = new Date().toISOString().slice(0, 10);
const LINKS = site.links || {};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = s => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const slugify = s => strip(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const errors = [], warnings = [];

/* ---------- Load pages ---------- */
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : d.name.endsWith('.json') ? [path.join(dir, d.name)] : []);
}
const pages = walk(path.join(ROOT, 'content')).map(f => {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  try { return { ...JSON.parse(fs.readFileSync(f, 'utf8')), _file: rel }; }
  catch (e) { errors.push(`${rel}: invalid JSON (${e.message})`); return null; }
}).filter(Boolean);
const bySlug = new Map(pages.map(p => [p.slug, p]));
const home = bySlug.get('');

/* ---------- Validate ---------- */
if (!home) errors.push('content/home.json (slug "") is missing');
const seenTitle = new Map(), seenDesc = new Map();
for (const p of pages) {
  const id = p._file;
  if (typeof p.slug !== 'string' || !/^([a-z0-9-]+(\/[a-z0-9-]+)*)?$/.test(p.slug)) errors.push(`${id}: slug must be lowercase words-with-dashes (use "" for home)`);
  if (['search', 'assets', 'templates', 'tools', 'content'].includes(p.slug.split('/')[0])) errors.push(`${id}: slug "${p.slug}" is reserved`);
  for (const k of ['title', 'description', 'h1']) if (!p[k]) errors.push(`${id}: missing "${k}"`);
  if (p.title && (p.title.length < 25 || p.title.length > 65)) warnings.push(`${id}: title is ${p.title.length} chars (aim for 30–60)`);
  if (p.description && (p.description.length < 70 || p.description.length > 160)) warnings.push(`${id}: description is ${p.description.length} chars (aim for 120–158)`);
  if (seenTitle.has(p.title)) errors.push(`${id}: same title as ${seenTitle.get(p.title)}. Every page needs a unique title`);
  if (seenDesc.has(p.description)) errors.push(`${id}: same description as ${seenDesc.get(p.description)}`);
  seenTitle.set(p.title, id); seenDesc.set(p.description, id);
  for (const r of p.related || []) if (!bySlug.has(r)) errors.push(`${id}: related page "${r}" doesn't exist`);
  for (const l of p.partners || []) if (!LINKS[l]) errors.push(`${id}: partner link "${l}" isn't in shmor-site.json "links"`);
}
for (const o of site.offers || []) if (!LINKS[o.link]) errors.push(`shmor-site.json: offer "${o.title}" uses unknown link "${o.link}"`);

if (warnings.length) console.log('Warnings:\n  ! ' + warnings.join('\n  ! '));
if (errors.length) { console.error('\nBuild stopped:\n  ✗ ' + errors.join('\n  ✗ ')); process.exit(1); }
if (CHECK) { console.log(`✓ ${pages.length} pages valid.`); process.exit(0); }

/* ---------- Helpers ---------- */
const pageUrl = p => `${BASE}/${p.slug ? p.slug + '/' : ''}`;
const pagePath = p => `/${p.slug ? p.slug + '/' : ''}`;
const label = p => p.nav || p.short || p.h1;
const goHref = (slug, src) => `${MASTER}/go/?to=${encodeURIComponent(slug)}&src=${encodeURIComponent(`${site.id}-${(src || 'home').replace(/\//g, '-')}`)}`;
const AFF = 'rel="sponsored nofollow noopener" target="_blank"';

function crumbs(p) {
  if (!p.slug) return [];
  const out = [{ name: 'Home', url: `${BASE}/`, path: '/' }];
  const parts = p.slug.split('/');
  for (let i = 1; i < parts.length; i++) {
    const parent = bySlug.get(parts.slice(0, i).join('/'));
    if (parent) out.push({ name: label(parent), url: pageUrl(parent), path: pagePath(parent) });
  }
  out.push({ name: label(p), url: pageUrl(p), path: pagePath(p) });
  return out;
}

/* ---------- Head: meta, social, structured data ---------- */
function head(p, { noindex = false, canonical = true } = {}) {
  const url = pageUrl(p);
  const img = p.image || seo.image;
  const graph = [];
  if (!p.slug) {
    graph.push({ '@type': 'WebSite', '@id': `${BASE}/#website`, url: `${BASE}/`, name: NAME, description: seo.description || p.description,
      publisher: { '@id': `${BASE}/#org` }, inLanguage: seo.locale || 'en',
      potentialAction: { '@type': 'SearchAction', target: `${BASE}/search/?q={search_term_string}`, 'query-input': 'required name=search_term_string' } });
    graph.push({ '@type': 'Organization', '@id': `${BASE}/#org`, name: NAME, url: `${BASE}/`,
      ...(seo.logo ? { logo: `${BASE}${seo.logo}` } : {}),
      parentOrganization: { '@type': 'Organization', name: 'Shmor.ai', url: `${MASTER}/` } });
  }
  graph.push({ '@type': 'WebPage', '@id': `${url}#page`, url, name: p.title, description: p.description,
    isPartOf: { '@id': `${BASE}/#website` }, dateModified: p.updated || TODAY, inLanguage: seo.locale || 'en' });
  const bc = crumbs(p);
  if (bc.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: bc.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) });
  if (p.faqs?.length) graph.push({ '@type': 'FAQPage', mainEntity: p.faqs.map(f => ({ '@type': 'Question', name: strip(f.q), acceptedAnswer: { '@type': 'Answer', text: strip(f.a) } })) });

  return [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}">`,
    canonical ? `<link rel="canonical" href="${url}">` : '',
    noindex || p.noindex ? `<meta name="robots" content="noindex, follow">` : `<meta name="robots" content="index, follow, max-image-preview:large">`,
    `<meta property="og:type" content="${p.slug ? 'article' : 'website'}">`,
    `<meta property="og:site_name" content="${esc(NAME)}">`,
    `<meta property="og:title" content="${esc(p.ogTitle || p.title)}">`,
    `<meta property="og:description" content="${esc(p.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:locale" content="${esc(seo.ogLocale || 'en_GB')}">`,
    img ? `<meta property="og:image" content="${BASE}${img}">` : '',
    `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`,
    `<meta name="theme-color" content="${esc(seo.themeColor || '#0A0C0E')}">`,
    `<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">`,
    `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    `<link href="${esc(seo.fontsUrl || 'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500;600&display=swap')}" rel="stylesheet">`,
    `<link rel="stylesheet" href="/assets/site.css">`,
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`,
  ].filter(Boolean).join('\n');
}

/* ---------- Page sections ---------- */
const searchForm = (placeholder, cls = '') => `<form class="search ${cls}" action="/search/" role="search">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  <input name="q" type="search" placeholder="${esc(placeholder || seo.searchPlaceholder || 'What are you looking for?')}" aria-label="Search ${esc(NAME)}">
  <button type="submit">Search</button>
</form>`;

function hero(p) {
  return `<section class="hero${p.slug ? ' hero-page' : ' hero-home'}"><div class="wrap">
  ${p.eyebrow ? `<p class="eyebrow">${esc(p.eyebrow)}</p>` : ''}
  <h1>${p.h1Html || esc(p.h1)}</h1>
  ${p.intro ? `<p class="lede">${p.intro}</p>` : ''}
  ${p.search === false ? '' : searchForm(p.searchPlaceholder)}
  ${p.chips?.length ? `<div class="chips">${p.chips.map(c => `<a href="${c.slug !== undefined ? pagePath(bySlug.get(c.slug) || { slug: c.slug }) : `/search/?q=${encodeURIComponent(c.q)}`}">${esc(c.label)}</a>`).join('')}</div>` : ''}
</div>${p.slug ? '' : '<div class="hero-art" aria-hidden="true"></div>'}</section>`;
}

function breadcrumbHtml(p) {
  const bc = crumbs(p);
  if (!bc.length) return '';
  return `<nav class="crumbs wrap" aria-label="Breadcrumb"><ol>${bc.map((c, i) =>
    i === bc.length - 1 ? `<li aria-current="page">${esc(c.name)}</li>` : `<li><a href="${c.path}">${esc(c.name)}</a></li>`).join('')}</ol></nav>`;
}

function highlights(p) {
  if (!p.highlights?.length) return '';
  return `<section class="highlights"><div class="wrap">${p.highlightsTitle ? `<h2>${esc(p.highlightsTitle)}</h2>` : ''}<div class="grid">${p.highlights.map(h => `
    <div class="tile">${h.icon ? `<span class="tile-ico" aria-hidden="true">${h.icon}</span>` : ''}<h3>${esc(h.title)}</h3><p>${h.text}</p></div>`).join('')}</div></div></section>`;
}

function partnerBlock(p) {
  const src = p.slug || 'home';
  const offers = (site.offers || []).filter(o => !o.pages || o.pages.includes(p.slug));
  const partners = (p.partners || []).map(slug => ({ slug, ...LINKS[slug] }));
  if (!offers.length && !partners.length) return '';
  return `<section class="partners"><div class="wrap">
  <h2>${esc(p.partnersTitle || 'Compare deals from our partners')}</h2>
  <div class="grid">
    ${offers.map(o => `<a class="offer" href="${goHref(o.link, src)}" ${AFF}>
      ${o.badge ? `<span class="badge">${esc(o.badge)}</span>` : ''}
      <span class="merchant">${esc(o.merchant || LINKS[o.link].merchant)}</span>
      <h3>${esc(o.title)}</h3>
      ${o.terms ? `<small>${esc(o.terms)}</small>` : ''}
      <span class="cta">View deal →</span></a>`).join('')}
    ${partners.map(l => `<a class="offer" href="${goHref(l.slug, src)}" ${AFF}>
      <span class="merchant">${esc(l.merchant)}</span>
      <h3>${esc(l.blurb || `Compare prices at ${l.merchant}`)}</h3>
      <span class="cta">Visit ${esc(l.merchant)} →</span></a>`).join('')}
  </div>
  <p class="aff-note">We may earn a commission if you book through these links, at no extra cost to you. <a href="${MASTER}/affiliate-disclosure/">How we make money</a>.</p>
</div></section>`;
}

function sections(p) {
  if (!p.sections?.length) return '';
  const toc = p.sections.length >= 4 ? `<nav class="toc" aria-label="On this page"><p>On this page</p><ol>${p.sections.map(s => `<li><a href="#${slugify(s.h2)}">${esc(s.h2)}</a></li>`).join('')}</ol></nav>` : '';
  return `<section class="content"><div class="wrap content-grid">${toc}<article class="prose">${p.sections.map(s => `
    <h2 id="${slugify(s.h2)}">${esc(s.h2)}</h2>
    ${s.html}`).join('')}
    ${p.updated ? `<p class="updated">Last updated: ${new Date(p.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
  </article></div></section>`;
}

function faqs(p) {
  if (!p.faqs?.length) return '';
  return `<section class="faq"><div class="wrap"><h2>${esc(p.faqTitle || 'Frequently asked questions')}</h2>${p.faqs.map(f => `
    <details><summary>${esc(f.q)}</summary><div>${f.a}</div></details>`).join('')}</div></section>`;
}

function related(p) {
  const list = (p.related || []).map(s => bySlug.get(s)).filter(Boolean);
  if (!list.length) return '';
  return `<section class="related"><div class="wrap"><h2>${esc(p.relatedTitle || 'Keep exploring')}</h2><div class="grid">${list.map(r => `
    <a class="card" href="${pagePath(r)}"><h3>${esc(label(r))}</h3><p>${esc(r.cardText || r.description)}</p><span class="cta">Explore →</span></a>`).join('')}</div></div></section>`;
}

function bottomCta(p) {
  if (p.ctaSearch === false) return '';
  return `<section class="cta-band"><div class="wrap"><h2>${esc(p.ctaTitle || seo.ctaTitle || `Search ${NAME}`)}</h2>${searchForm(p.searchPlaceholder, 'search-lg')}</div></section>`;
}

/* ---------- Layout ---------- */
const layout = read('templates/layout.html');
// Top menu = pages with a navOrder (nav = their short label, also used in breadcrumbs)
const navPages = pages.filter(p => p.slug && p.navOrder !== undefined).sort((a, b) => a.navOrder - b.navOrder);
const navHtml = navPages.map(p => `<a href="${pagePath(p)}">${esc(label(p))}</a>`).join('');
const footerNav = pages.filter(p => p.slug && !p.noindex).sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99) || a.slug.localeCompare(b.slug))
  .map(p => `<li><a href="${pagePath(p)}">${esc(label(p))}</a></li>`).join('');

function render(p, main, opts) {
  const fill = {
    head: head(p, opts), nav: navHtml, main, footer_nav: footerNav,
    year: String(new Date().getFullYear()), site_name: esc(NAME),
    body_class: p.slug ? `page page-${p.slug.split('/')[0]}` : 'home',
  };
  return layout.replace(/{{([a-z_]+)}}/g, (m, k) => (k in fill ? fill[k] : m));
}
for (const k of ['head', 'main']) if (!layout.includes(`{{${k}}}`)) { console.error(`templates/layout.html must contain {{${k}}}`); process.exit(1); }

/* ---------- Write ---------- */
const MANIFEST = path.join(ROOT, '.build-manifest.json');
const previous = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : [];
const written = [];
const out = (rel, text) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); written.push(rel); };

for (const p of pages) {
  const main = [breadcrumbHtml(p), hero(p), highlights(p), partnerBlock(p), sections(p), faqs(p), related(p), bottomCta(p)].join('\n');
  out(p.slug ? `${p.slug}/index.html` : 'index.html', render(p, main));
}

// Search (noindex) + index of pages
const searchPage = { slug: 'search', title: `Search | ${NAME}`, description: `Search ${NAME}.`, h1: `Search ${NAME}` };
out('search/index.html', render(searchPage, `<section class="hero hero-page"><div class="wrap"><h1 id="search-title">Search ${esc(NAME)}</h1>${searchForm()}</div></section>
<section class="related"><div class="wrap"><div class="grid" id="search-results" aria-live="polite"></div></div></section>`, { noindex: true, canonical: false }));
out('search-index.json', JSON.stringify(pages.filter(p => !p.noindex).map(p => ({
  path: pagePath(p), title: label(p), text: p.cardText || p.description, terms: [p.title, p.h1, p.description, ...(p.keywords || [])].join(' ').toLowerCase(),
}))));

// 404
out('404.html', render({ slug: '404', title: `Page not found | ${NAME}`, description: `This page could not be found on ${NAME}.`, h1: 'Page not found', nav: 'Not found' },
  `<section class="hero hero-page"><div class="wrap"><h1>We couldn't find that page</h1><p class="lede">Try a search, or head back to the <a href="/">${esc(NAME)} homepage</a>.</p>${searchForm()}</div></section>`,
  { noindex: true, canonical: false }));

// Sitemap + robots
const indexable = pages.filter(p => !p.noindex);
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map(p =>
  `  <url><loc>${pageUrl(p)}</loc><lastmod>${p.updated || TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`);
out('robots.txt', `User-agent: *\nAllow: /\nDisallow: /search/\n\nSitemap: ${BASE}/sitemap.xml\n`);

// Remove pages that no longer exist
for (const rel of previous) {
  if (!written.includes(rel) && rel.endsWith('index.html') && fs.existsSync(path.join(ROOT, rel))) {
    fs.unlinkSync(path.join(ROOT, rel));
    try { fs.rmdirSync(path.dirname(path.join(ROOT, rel))); } catch (e) { /* folder not empty */ }
    console.log(`  removed old page /${path.dirname(rel)}/`);
  }
}
fs.writeFileSync(MANIFEST, JSON.stringify(written, null, 2));
console.log(`✓ Built ${NAME}: ${pages.length} pages, sitemap with ${indexable.length} URLs → ${BASE}/`);
