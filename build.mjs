import { cp, mkdir, writeFile } from 'node:fs/promises';
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
const heading = (lines) => lines.map((line) => `<span>${escape(line)}</span>`).join(' ');
const sectionHead = (label, title, text) => `<div class="section-head">
  <div><p class="eyebrow" lang="en">${label}</p><h2>${title}</h2></div>
  ${text ? `<p class="section-intro">${text}</p>` : ''}
</div>`;
const textLink = (href, label) => `<a class="text-link" href="${href}">${label}</a>`;
const button = (href, label, extra = '') => `<a class="button ${extra}" href="${href}">${label}</a>`;
const caseId = (index) => index === 0 ? 'project-jdi' : 'project-bonding';
const serviceId = (index) => `service-${index + 1}`;
const brand = () => `<a class="brand" href="index.html" aria-label="HEON International">
  <span class="brand-icon" aria-hidden="true"><i></i><b></b></span>
  <span class="brand-type" lang="en"><strong>HEON</strong><small>INTERNATIONAL</small></span>
</a>`;

function photoCredit(file, label, t) {
  return `<figcaption><span>${label}</span><a href="${photography[file]}">${t.photo} · NIST</a></figcaption>`;
}

function footer(t) {
  return `<footer class="site-footer"><div class="wrap footer-layout">
    <div>${brand()}<p>${t.footer}</p></div>
    <nav aria-label="${t.menu}">${pages.map((path, i) => `<a href="${path}">${t.nav[i]}</a>`).join('')}</nav>
    <div class="footer-contact"><a href="mailto:${email}">${email}</a><small>© ${new Date().getUTCFullYear()} HEON International</small></div>
  </div></footer>`;
}

function contactBand(t) {
  return `<section class="contact-band"><div class="wrap">
    <div><p class="eyebrow" lang="en">Contact</p><h2>${t.contact.closing}</h2><p>${t.contact.closingBody}</p></div>
    ${button('platform.html', t.hero.cta, 'button-light')}
  </div></section>`;
}

function home(t) {
  return `<section class="hero wrap">
    <div class="hero-content">
      <p class="eyebrow hero-category">${t.hero.category}</p>
      <h1>${heading(t.hero.title)}</h1>
      <p class="hero-text">${t.hero.body}</p>
      <div class="actions">${button('platform.html', t.hero.cta)}${textLink('#work', t.hero.study)}</div>
    </div>
    <figure class="hero-figure">
      <div class="hero-image">${image('assets/cleanroom', t.hero.image, 'width="1600" height="2016" srcset="assets/cleanroom-small.webp 700w, assets/cleanroom.webp 1600w" sizes="(max-width: 800px) 100vw, 52vw" fetchpriority="high"')}</div>
      ${photoCredit('cleanroom', t.hero.caption, t)}
    </figure>
  </section>
  <div class="proof"><dl class="wrap proof-grid">${t.stats.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></div>
  <section class="section wrap" id="work">
    ${sectionHead(t.work.label, t.work.title, t.work.body)}
    <div class="work-grid">${t.cases.map((item, i) => `<article class="work-item">
      <a href="about.html#${caseId(i)}" class="work-link">
        <div class="work-image ${i === 1 ? 'wafer-image' : ''}">${image(i === 0 ? 'assets/evaluation' : 'assets/wafer', item.image, 'loading="lazy"')}</div>
        <div class="work-caption">
          <div><p class="eyebrow">${item.discipline}</p><h3 lang="en">${item.name}</h3><p lang="en">${item.scope}</p></div>
          <strong>${item.metric}</strong>
        </div>
      </a>
    </article>`).join('')}</div>
    <div class="work-foot"><p>${t.work.note}</p>${textLink('about.html', t.work.link)}</div>
  </section>
  <section class="section service-overview"><div class="wrap">
    ${sectionHead(t.services.label, t.services.title, t.services.body)}
    <div class="service-index">${t.services.items.map((item, i) => `<a class="service-row" href="services.html#${serviceId(i)}"><h3>${item.name}</h3><p>${item.description}</p><span class="line-mark" aria-hidden="true"></span></a>`).join('')}</div>
    <div class="section-action">${textLink('services.html', t.services.link)}</div>
  </div></section>
  ${contactBand(t)}`;
}

function services(t) {
  const s = t.services;
  return `<section class="page-intro wrap">
    <p class="eyebrow" lang="en">${s.label}</p><h1>${s.title}</h1><p>${s.body}</p>
    <nav class="jump-links" aria-label="${t.nav[1]}">${s.items.map((item, i) => `<a href="#${serviceId(i)}">${item.name}</a>`).join('')}</nav>
  </section>
  <div class="wrap service-details">${s.items.map((item, i) => `<section class="service-detail" id="${serviceId(i)}">
    <div><h2>${item.name}</h2><p class="detail-lead">${item.description}</p></div>
    <div class="detail-body">
      <h3>${s.activities}</h3><ul>${item.activities.map((task) => `<li>${task}</li>`).join('')}</ul>
      <dl class="detail-facts"><div><dt>${s.output}</dt><dd>${item.output}</dd></div><div><dt>${s.preparation}</dt><dd>${item.preparation}</dd></div></dl>
      ${textLink('platform.html#consultation', s.consult)}
    </div>
  </section>`).join('')}</div>
  <section class="section services-context"><div class="wrap">
    ${sectionHead('Industry focus', s.field, s.fieldText)}
    <h3>${s.example}</h3><p>${s.exampleIntro}</p>
    <table class="example-table">
      <thead><tr>${s.tableHeaders.map((header) => `<th scope="col">${header}</th>`).join('')}</tr></thead>
      <tbody>${s.tableRows.map(([label, question, answer]) => `<tr><th scope="row">${label}</th><td>${question}</td><td>${answer}</td></tr>`).join('')}</tbody>
    </table>
  </div></section>
  <section class="section wrap">
    ${sectionHead('How we work', s.process)}
    ${steps(s.steps)}
    <h3 class="roles-title">${s.roles}</h3>
    <dl class="roles">${s.roleRows.map(([label, body]) => `<div><dt>${label}</dt><dd>${body}</dd></div>`).join('')}</dl>
    <p class="fine-print">${s.disclaimer}</p>
  </section>
  ${contactBand(t)}`;
}

function about(t) {
  const a = t.about;
  const anchors = ['representative-profile', 'project-record', 'career'];
  return `<section class="page-intro wrap">
    <p class="eyebrow" lang="en">${a.label}</p><h1>${a.title}</h1><p>${a.intro}</p>
    <nav class="jump-links" aria-label="${t.nav[2]}">${a.nav.map((item, i) => `<a href="#${anchors[i]}">${item}</a>`).join('')}</nav>
  </section>
  <section class="profile wrap" id="${anchors[0]}">
    <figure>${image('assets/representative', `${a.name} · ${a.role}`, 'width="850" height="1133" fetchpriority="high"')}</figure>
    <div>
      <p class="eyebrow" lang="en">Representative</p><h2>${a.name}</h2><p class="profile-role">${a.role}</p><p>${a.bio}</p>
      <dl class="profile-facts"><div><dt>${t.stats[0][0]}</dt><dd>${t.stats[0][1]}</dd></div><div><dt>${a.credentials}</dt><dd>${a.credentialsDetail}</dd></div></dl>
    </div>
  </section>
  <section class="section about-work" id="${anchors[1]}"><div class="wrap">
    ${sectionHead(t.work.label, t.work.title, t.work.body)}
    ${t.cases.map((item, i) => {
      const photo = i === 0 ? 'evaluation' : 'wafer';
      return `<article class="case-detail" id="${caseId(i)}">
        <figure><div class="case-image ${i === 1 ? 'wafer-image' : ''}">${image(`assets/${photo}`, item.image, 'loading="lazy"')}</div>${photoCredit(photo, item.scope, t)}</figure>
        <div><p class="eyebrow">${item.discipline}</p><h3>${item.title}</h3><p class="case-metric">${item.metric}</p>
        <p>${item.summary}</p><h4>${a.duties}</h4><ul>${item.duties.map((duty) => `<li>${duty}</li>`).join('')}</ul>
        <details><summary>${a.detail}</summary><h4>${a.challenge}</h4><p>${item.challenge}</p><h4>${a.result}</h4><p>${item.result}</p></details></div>
      </article>`;
    }).join('')}
    <p class="fine-print">${t.work.note}</p>
  </div></section>
  <section class="section wrap" id="${anchors[2]}">${sectionHead('Career', a.career)}
    <ul class="career-list">${a.positions.map(([period, company, area]) => `<li><span>${period}</span><strong>${company}</strong><span>${area}</span></li>`).join('')}</ul>
  </section>
  ${contactBand(t)}`;
}

function steps(items) {
  return `<ol class="steps">${items.map(([label, description]) => `<li><h3>${label}</h3><p>${description}</p></li>`).join('')}</ol>`;
}

function contact(t, lang) {
  const c = t.contact;
  const formUrl = `https://heoninternational.com/platform?lang=${lang}#request-form`;
  return `<div class="contact-intro"><section class="wrap contact-layout">
    <div><p class="eyebrow" lang="en">${c.label}</p><h1>${heading(c.title)}</h1><p class="hero-text">${c.body}</p>
    <a class="contact-email" href="mailto:${email}">${email}</a></div>
    <aside class="contact-paper" id="consultation"><h2>${c.form}</h2><p>${c.guidance}</p>
      ${button(formUrl, c.button)}<p class="form-note">${c.formNote}</p>
    </aside>
  </section></div>
  <section class="section wrap">
    ${sectionHead('Consultation', c.start)}
    <div class="topics">${c.topics.map(([label, description]) => `<div><h3>${label}</h3><p>${description}</p></div>`).join('')}</div>
  </section>
  <section class="section services-context"><div class="wrap">${sectionHead('Next steps', c.process)}${steps(c.stages)}</div></section>`;
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
  <meta name="theme-color" content="#f6f5ef">
  <title>${escape(t.titles[pageIndex])} | HEON International</title>
  <meta name="description" content="${escape(description)}">
  ${siteBase ? `<link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="ko" href="${siteBase}/${current}">
  <link rel="alternate" hreflang="ja" href="${siteBase}/ja/${current}">
  <meta property="og:image" content="${siteBase}/assets/cleanroom.webp">` : ''}
  <link rel="icon" href="${base}assets/favicon.png" type="image/png">
  <link rel="stylesheet" href="${base}assets/site.css">
  <link rel="preload" href="${base}assets/${lang === 'ko' ? 'pretendard' : 'pretendard-jp'}.woff2" as="font" type="font/woff2" crossorigin>
  <script src="${base}assets/site.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">${t.skip}</a>
  <header class="site-header"><div class="wrap header-layout">
    ${brand()}
    <nav id="primary-nav" class="primary-nav" aria-label="${t.menu}">${pages.map((path, i) => `<a href="${path}" ${i === pageIndex ? 'aria-current="page"' : ''}>${t.nav[i]}</a>`).join('')}</nav>
    <div class="header-tools">
      <a class="language-link" href="${alt}" lang="${altLang}" hreflang="${altLang}">${t.language}</a>
      ${button('platform.html', t.nav[3], 'header-contact')}
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="primary-nav"><span>${t.menu}</span><i aria-hidden="true"></i></button>
    </div>
  </div></header>
  <main id="main">${lang === 'ja' ? body.replaceAll('assets/', '../assets/') : body}</main>
  ${footer(t)}
</body>
</html>
`;
}

await mkdir(new URL('ja/', output), { recursive: true });
await cp(new URL('./src/assets/', import.meta.url), new URL('assets/', output), { recursive: true });
await Promise.all(Object.keys(copy).flatMap((lang) => pages.map((page, i) =>
  writeFile(new URL(`${lang === 'ja' ? 'ja/' : ''}${page}`, output), render(lang, i))
)));
