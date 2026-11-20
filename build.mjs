import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { copy, email, pages, photography } from './src/content.mjs';

const output = new URL('./dist/', import.meta.url);
const siteUrl = process.env.SITE_URL ? new URL(process.env.SITE_URL) : null;
if (siteUrl && !['https:', 'http:'].includes(siteUrl.protocol)) {
  throw new Error('SITE_URL must use http or https.');
}
const siteBase = siteUrl ? siteUrl.origin + siteUrl.pathname.replace(/\/+$/, '') : '';

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const image = (file, alt, options = '') =>
  `<img src="${file}.webp" alt="${escape(alt)}" decoding="async" ${options}>`;
const lines = (items) => items.map((line) => `<span>${escape(line)}</span>`).join(' ');
const textLink = (href, label) => `<a class="text-link" href="${href}">${label}</a>`;
const button = (href, label, extra = '') => `<a class="button ${extra}" href="${href}">${label}</a>`;
const isLatin = (value) => /^[\x20-\x7E]+$/.test(value);
const plate = (value, tag = 'span', extra = '') => isLatin(value)
  ? `<${tag} class="plate ${extra}" lang="en">${value}</${tag}>`
  : `<${tag} class="${extra}">${value}</${tag}>`;
const caseId = (index) => index === 0 ? 'project-jdi' : 'project-bonding';
const serviceId = (index) => `service-${index + 1}`;
const node = (n) => `<span class="node" aria-hidden="true">${n}</span>`;
const brand = (base) => `<a class="brand" href="index.html" lang="en">
  <img class="brand-logo" src="${base}assets/heon-logo.svg" width="134" height="32" alt="HEON International">
</a>`;

function photoCredit(file, label, t) {
  return `<figcaption><span>${label}</span><a href="${photography[file]}">${t.photo}: NIST</a></figcaption>`;
}

// One die stands for one production tool. Dies light in the serpentine
// order a wafer prober steps across the wafer.
function waferMap(lit, label) {
  const n = 14, r = n / 2, cell = 12, die = 10.4;
  const dies = [];
  for (let row = 0; row < n; row += 1) {
    const cols = [...Array(n).keys()];
    if (row % 2) cols.reverse();
    for (const col of cols) {
      const corners = [[col, row], [col + 1, row], [col, row + 1], [col + 1, row + 1]];
      if (corners.every(([x, y]) => Math.hypot(x - r, y - r) <= r - 0.15)) dies.push([col, row]);
    }
  }
  const centre = (n * cell) / 2, edge = centre + 5, inset = (cell - die) / 2;
  const view = `${centre - edge - 1} ${centre - edge - 1} ${edge * 2 + 2} ${edge * 2 + 2}`;
  const rects = dies.map(([x, y], i) => `<rect class="die${i < lit ? ' lit' : ''}" x="${x * cell + inset}" y="${y * cell + inset}" width="${die}" height="${die}" rx="1" style="--i:${i}"/>`).join('');
  return `<svg class="wafer" viewBox="${view}" role="img" aria-label="${escape(label)}">
    <circle class="wafer-disc" cx="${centre}" cy="${centre}" r="${edge}"/>
    <circle class="wafer-notch" cx="${centre}" cy="${centre + edge}" r="3"/>
    ${rects}
  </svg>`;
}

function unitRows(item, unit) {
  return `<div class="units">${item.scope.split(' / ').map((tool, row) => `<div class="unit-row">
    <p class="plate" lang="en">${tool}</p>
    <ol>${[1, 2, 3, 4].map((n) => `<li style="--i:${row * 4 + n - 1}">${n}${unit}</li>`).join('')}</ol>
  </div>`).join('')}</div>`;
}

function recordItem(t, index, figure, legend, extra) {
  const item = t.cases[index];
  return `<article class="record-item ${extra}">
    <figure class="record-figure">${figure}<figcaption>${legend}</figcaption></figure>
    <div class="record-text">
      <h3 class="plate" lang="en">${item.name}</h3>
      <p class="record-metric">${item.metric}</p>
      <p class="record-scope">${item.discipline}<br><span lang="en">${item.scope}</span></p>
      ${textLink(`about.html#${caseId(index)}`, t.record.more)}
    </div>
  </article>`;
}

function steps(items) {
  return `<ol class="flow">${items.map(([label, description], i) => `<li class="flow-step">${node(i + 1)}<h3>${label}</h3><p>${description}</p></li>`).join('')}</ol>`;
}

function contactBand(t) {
  return `<section class="contact-band"><div class="wrap contact-band-layout">
    <h2>${t.contact.closing}</h2>
    <div><p>${t.contact.closingBody}</p>${button('platform.html', t.hero.cta)}</div>
  </div></section>`;
}

function footer(t, base) {
  return `<footer class="site-footer"><div class="wrap footer-layout">
    <div class="footer-brand">${brand(base)}<p>${t.footer}</p></div>
    <nav aria-label="${t.menu}">${pages.map((path, i) => `<a href="${path}">${t.nav[i]}</a>`).join('')}</nav>
    <div class="footer-contact"><a href="mailto:${email}">${email}</a><small>© ${new Date().getUTCFullYear()} HEON International</small></div>
  </div></footer>`;
}

function home(t, lang) {
  const otherLang = lang === 'ko' ? 'ja' : 'ko';
  const echo = copy[otherLang].hero.title.join(otherLang === 'ko' ? ' ' : '');
  return `<section class="hero">
    <div class="wrap hero-head">
      <h1>${lines(t.hero.title)}</h1>
      <p class="hero-echo" lang="${otherLang}" aria-hidden="true">${echo}</p>
      <div class="hero-side">
        <p class="lead">${t.hero.body}</p>
        <div class="actions">${button('platform.html', t.hero.cta)}${textLink('#work', t.hero.study)}</div>
      </div>
    </div>
    <figure class="hero-photo">
      <div class="hero-frame">${image('assets/cleanroom', t.hero.image, 'width="1600" height="2016" srcset="assets/cleanroom-small.webp 700w, assets/cleanroom.webp 1600w" sizes="100vw" fetchpriority="high"')}</div>
      <div class="wrap">${photoCredit('cleanroom', t.hero.caption, t)}</div>
    </figure>
  </section>
  <section class="facts"><dl class="wrap facts-grid">${t.stats.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></section>
  <section class="record" id="work"><div class="wrap">
    <div class="split-head"><h2>${t.work.title}</h2><p>${t.work.body}</p></div>
    <div class="record-grid">
      ${recordItem(t, 1, waferMap(100, t.record.wafer), t.record.dieLegend, 'record-wafer')}
      ${recordItem(t, 0, unitRows(t.cases[0], t.record.unit), t.record.unitLegend, 'record-units')}
    </div>
    <div class="record-foot"><p class="fine-print">${t.work.note}</p>${textLink('about.html', t.work.link)}</div>
  </div></section>
  <section class="section wrap">
    <div class="split-head"><h2>${t.services.title}</h2><p>${t.services.body}</p></div>
    <ol class="flow flow-links">${t.services.items.map((item, i) => `<li class="flow-step"><a href="services.html#${serviceId(i)}">${node(i + 1)}<h3>${item.name}</h3><p>${item.description}</p></a></li>`).join('')}</ol>
    <p class="section-action">${textLink('services.html', t.services.link)}</p>
  </section>
  ${contactBand(t)}`;
}

// Four-segment meter: which stage of the sales process this is.
function meter(index, total = 4) {
  return `<span class="meter" aria-hidden="true">${Array.from({ length: total }, (_, k) => `<i${k === index ? ' class="on"' : ''}></i>`).join('')}</span>`;
}

function services(t) {
  const s = t.services;
  return `<section class="services-hero"><div class="wrap">
    <div class="split-head"><h1>${s.title}</h1><p>${s.body}</p></div>
    <ol class="pipeline">${s.items.map((item, i) => `<li><a href="#${serviceId(i)}">
      <span class="pipeline-top"><span class="stage-no plate" lang="en">${i + 1}</span>${meter(i)}</span>
      <strong>${item.name}</strong>
      <span class="pipeline-desc">${item.description}</span>
    </a></li>`).join('')}</ol>
  </div></section>
  <div class="stages">${s.items.map((item, i) => `<section class="stage wrap" id="${serviceId(i)}">
    <div class="stage-head">
      <div class="stage-mark"><span class="stage-no plate" lang="en">${i + 1}</span>${meter(i)}</div>
      <h2>${item.name}</h2><p>${item.description}</p>${textLink('platform.html#consultation', s.consult)}
    </div>
    <div class="stage-body">
      <h3>${s.activities}</h3><ul class="checklist">${item.activities.map((task) => `<li>${task}</li>`).join('')}</ul>
      <div class="io">
        <div class="io-in"><p class="io-label">${s.preparation}</p><p>${item.preparation}</p></div>
        <div class="io-out"><p class="io-label">${s.output}</p><p>${item.output}</p></div>
      </div>
    </div>
  </section>`).join('')}</div>
  <section class="section band-silicon"><div class="wrap">
    <div class="split-head"><h2>${s.field}</h2><p>${s.fieldText}</p></div>
    <div class="field-layout">
      <figure class="field-photo"><div class="case-frame">${image('assets/wafer', t.cases[1].image, 'loading="lazy"')}</div>${photoCredit('wafer', t.cases[1].scope, t)}</figure>
      <div class="field-map">${s.fieldGroups.map(([label, fields], g) => `<div class="field-group${g === 0 ? ' is-core' : ''}">
        <h3>${label}</h3><ul>${fields.map((field) => `<li>${plate(field)}</li>`).join('')}</ul>
      </div>`).join('')}</div>
    </div>
    <h3 class="table-title">${s.example}</h3><p class="table-intro">${s.exampleIntro}</p>
    <div class="table-scroll"><table class="datasheet">
      <thead><tr>${s.tableHeaders.map((header) => `<th scope="col">${header}</th>`).join('')}</tr></thead>
      <tbody>${s.tableRows.map(([label, question, answer]) => `<tr><th scope="row">${label}</th><td data-label="${s.tableHeaders[1]}">${question}</td><td data-label="${s.tableHeaders[2]}">${answer}</td></tr>`).join('')}</tbody>
    </table></div>
  </div></section>
  <section class="section wrap">
    <h2 class="section-title">${s.process}</h2>
    ${steps(s.steps)}
    <h3 class="roles-title">${s.roles}</h3>
    <dl class="roles">${s.roleRows.map(([label, body]) => `<div>${plate(label, 'dt')}<dd>${body}</dd></div>`).join('')}</dl>
    <p class="fine-print">${s.disclaimer}</p>
  </section>
  ${contactBand(t)}`;
}

function about(t) {
  const a = t.about;
  const anchors = ['representative-profile', 'project-record', 'career'];
  return `<section class="page-intro wrap">
    <h1>${a.title}</h1><p class="lead">${a.intro}</p>
    <nav class="jump-links" aria-label="${t.nav[2]}">${a.nav.map((item, i) => `<a href="#${anchors[i]}">${item}</a>`).join('')}</nav>
  </section>
  <section class="profile wrap" id="${anchors[0]}">
    <figure class="profile-photo">${image('assets/representative', `${a.name}, ${a.role}`, 'width="850" height="1133" fetchpriority="high"')}</figure>
    <div class="profile-text">
      <h2>${a.name}</h2><p class="profile-role">${a.role}</p><p class="profile-bio">${a.bio}</p>
      <dl class="spec"><div><dt>${t.stats[0][0]}</dt><dd>${t.stats[0][1]}</dd></div><div><dt>${a.credentials}</dt><dd>${a.credentialsDetail}</dd></div></dl>
    </div>
  </section>
  <section class="section band-silicon" id="${anchors[1]}"><div class="wrap">
    <div class="split-head"><h2>${t.work.title}</h2><p>${t.work.body}</p></div>
    ${t.cases.map((item, i) => {
      const photo = i === 0 ? 'evaluation' : 'wafer';
      const facts = [plate(item.name), item.discipline, plate(item.scope), `<span class="metric">${item.metric}</span>`];
      return `<article class="case" id="${caseId(i)}">
        <figure class="case-photo"><div class="case-frame">${image(`assets/${photo}`, item.image, 'loading="lazy"')}</div>${photoCredit(photo, item.scope, t)}</figure>
        <div class="case-text">
          <h3>${item.title}</h3>
          <dl class="case-facts">${a.facts.map((label, f) => `<div><dt>${label}</dt><dd>${facts[f]}</dd></div>`).join('')}</dl>
          <p>${item.summary}</p>
          <h4>${a.duties}</h4><ul class="checklist">${item.duties.map((duty) => `<li>${duty}</li>`).join('')}</ul>
          <details><summary>${a.detail}</summary><h4>${a.challenge}</h4><p>${item.challenge}</p><h4>${a.result}</h4><p>${item.result}</p></details>
        </div>
      </article>`;
    }).join('')}
    <p class="fine-print">${t.work.note}</p>
  </div></section>
  <section class="section wrap" id="${anchors[2]}">
    <h2 class="section-title">${a.career}</h2>
    <ol class="career">${a.positions.map(([period, company, area]) => `<li><span class="career-period">${period}</span>${plate(company, 'strong')}<span>${area}</span></li>`).join('')}</ol>
  </section>
  ${contactBand(t)}`;
}

function contact(t, lang) {
  const c = t.contact;
  const formUrl = `https://heoninternational.com/platform?lang=${lang}#request-form`;
  return `<section class="contact-hero"><div class="wrap contact-layout">
    <div>
      <h1>${lines(c.title)}</h1><p class="lead">${c.body}</p>
      <p class="contact-direct"><span>${c.direct}</span><a class="text-link" href="mailto:${email}">${email}</a></p>
    </div>
    <aside class="contact-panel" id="consultation">
      <h2>${c.form}</h2><p>${c.guidance}</p>${button(formUrl, c.button)}<p class="form-note">${c.formNote}</p>
    </aside>
  </div></section>
  <section class="section band-silicon"><div class="wrap">
    <h2 class="section-title">${c.start}</h2>
    <div class="topics">${c.topics.map(([label, description]) => `<div><h3>${label}</h3><p>${description}</p></div>`).join('')}</div>
  </div></section>
  <section class="section wrap"><h2 class="section-title">${c.process}</h2>${steps(c.stages)}</section>`;
}

function render(lang, pageIndex) {
  const t = copy[lang];
  const altLang = lang === 'ko' ? 'ja' : 'ko';
  const page = pages[pageIndex];
  const alt = `${lang === 'ko' ? 'ja/' : '../'}${page}`;
  const base = lang === 'ja' ? '../' : './';
  const current = pageIndex === 0 ? '' : page;
  const canonical = `${siteBase}/${lang === 'ja' ? 'ja/' : ''}${current}`;
  const description = pageIndex === 0 ? t.description : [null, t.services.body, t.about.intro, t.contact.body][pageIndex];
  const body = [home, services, about, contact][pageIndex](t, lang);
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <title>${escape(t.titles[pageIndex])} | HEON International</title>
  <meta name="description" content="${escape(description)}">
  ${siteBase ? `<link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="ko" href="${siteBase}/${current}">
  <link rel="alternate" hreflang="ja" href="${siteBase}/ja/${current}">
  <meta property="og:image" content="${siteBase}/assets/cleanroom.webp">` : ''}
  <link rel="icon" href="${base}assets/favicon.png" type="image/png" sizes="96x96">
  <link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml" sizes="any">
  <link rel="stylesheet" href="${base}assets/site.css">
  <link rel="preload" href="${base}assets/${lang === 'ko' ? 'pretendard' : 'pretendard-jp'}.woff2" as="font" type="font/woff2" crossorigin>
  <script src="${base}assets/site.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">${t.skip}</a>
  <header class="site-header"><div class="wrap header-layout">
    ${brand(base)}
    <nav id="primary-nav" class="primary-nav" aria-label="${t.menu}">${pages.map((path, i) => `<a href="${path}" ${i === pageIndex ? 'aria-current="page"' : ''}>${t.nav[i]}</a>`).join('')}</nav>
    <div class="header-tools">
      <a class="language-link" href="${alt}" lang="${altLang}" hreflang="${altLang}">${t.language}</a>
      ${button('platform.html', t.nav[3], 'button-small header-contact')}
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="primary-nav"><span>${t.menu}</span><i aria-hidden="true"></i></button>
    </div>
  </div></header>
  <main id="main">${lang === 'ja' ? body.replaceAll('assets/', '../assets/') : body}</main>
  ${footer(t, base)}
</body>
</html>
`;
}

await rm(output, { recursive: true, force: true });
await mkdir(new URL('ja/', output), { recursive: true });
await cp(new URL('./src/assets/', import.meta.url), new URL('assets/', output), { recursive: true });
await Promise.all(Object.keys(copy).flatMap((lang) => pages.map((page, i) =>
  writeFile(new URL(`${lang === 'ja' ? 'ja/' : ''}${page}`, output), render(lang, i))
)));
