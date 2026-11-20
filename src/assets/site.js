const mobileMenu = document.querySelector('.menu-button');
const header = document.querySelector('.site-header');
const navigation = document.querySelector('#primary-nav');
const languageLink = document.querySelector('.language-link');
const url = new URL(window.location.href);
const requestedLanguage = url.searchParams.get('lang');

if (['ko', 'ja'].includes(requestedLanguage) && requestedLanguage !== document.documentElement.lang) {
  const translated = new URL(languageLink.href);
  url.searchParams.delete('lang');
  translated.search = url.search;
  translated.hash = url.hash;
  window.location.replace(translated);
}

document.documentElement.classList.add('has-js');

function setMenu(open) {
  mobileMenu.setAttribute('aria-expanded', String(open));
  header.classList.toggle('menu-open', open);
}

mobileMenu.addEventListener('click', () => setMenu(mobileMenu.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileMenu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    mobileMenu.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!header.contains(event.target)) setMenu(false);
});
window.matchMedia('(max-width: 800px)').addEventListener('change', () => setMenu(false));

languageLink.addEventListener('click', () => {
  const translated = new URL(languageLink.href);
  const current = new URL(window.location.href);
  current.searchParams.delete('lang');
  translated.search = current.search;
  translated.hash = current.hash;
  languageLink.href = translated.href;
});
