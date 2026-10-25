// Homepage translations (SK / EN / HU) without any library.
//
// The texts live in assets/locales/<lang>.js, which are plain scripts that fill
// window.UG_LOCALES, so everything works from a web server and when the page is
// opened straight from disk. In the HTML:
//   data-i18n="key"            → sets the element's text
//   data-i18n-html="key"       → sets HTML (only for our own strings with <em>)
//   data-i18n-attr="alt:key"   → sets attributes, several as "alt:a, title:b"
//
// This file loads in <head> (not deferred), so it can hide the page while a
// non-default language is applied and avoid a flash of Slovak text.

(() => {
  const LANGS = ['sk', 'en', 'hu'];
  const DEFAULT = 'sk';
  const STORAGE_KEY = 'ug-lang';
  const dict = window.UG_LOCALES || {};
  const root = document.documentElement;

  const readStored = () => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  };
  const store = (lang) => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode: just don't remember */ }
  };

  // ?lang=en in the URL, then the saved choice, then the browser language, then Slovak.
  const pick = () => {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(fromUrl)) return fromUrl;
    const saved = readStored();
    if (LANGS.includes(saved)) return saved;
    for (const browserLang of navigator.languages || [navigator.language || '']) {
      const code = browserLang.slice(0, 2).toLowerCase();
      if (LANGS.includes(code)) return code;
    }
    return DEFAULT;
  };

  let current = pick();
  const t = (key) => dict[current]?.[key] ?? dict[DEFAULT]?.[key] ?? key;

  function apply(lang) {
    current = LANGS.includes(lang) ? lang : DEFAULT;
    root.lang = current;

    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(',').forEach((pair) => {
        const [attr, key] = pair.split(':').map((part) => part.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    // Pages with their own <title data-i18n="…"> get it from the loop above; the homepage uses meta.title.
    if (!document.querySelector('title[data-i18n]')) document.title = t('meta.title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));

    document.querySelectorAll('[data-lang]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === current));
    });
    document.querySelectorAll('[data-lang-current]').forEach((el) => { el.textContent = current.toUpperCase(); });

    document.dispatchEvent(new CustomEvent('ug:langchange', { detail: { lang: current } }));
  }

  // Hide the page until the texts are swapped (only needed when not Slovak).
  if (current !== DEFAULT) root.classList.add('i18n-pending');

  document.addEventListener('DOMContentLoaded', () => {
    try {
      apply(current);
    } finally {
      root.classList.remove('i18n-pending');
    }

    // Language picker: opens by itself on the first visit (nothing saved yet and no
    // ?lang= in the link), and from the language button at any time.
    const modal = document.querySelector('.lang-modal');
    let lastFocus = null;

    const openPicker = () => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add('open'));
      document.body.style.overflow = 'hidden';
      (modal.querySelector('[aria-pressed="true"]') || modal.querySelector('[data-lang]')).focus();
    };
    const closePicker = () => {
      store(current); // closing without a choice keeps the shown language and stops the pop-up
      modal.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => { modal.hidden = true; }, 300);
      lastFocus?.focus?.();
    };

    document.querySelectorAll('[data-lang]').forEach((button) => {
      button.addEventListener('click', () => {
        store(button.dataset.lang);
        apply(button.dataset.lang);
        if (modal && !modal.hidden) closePicker();
      });
    });

    if (modal) {
      document.querySelectorAll('[data-open-lang]').forEach((button) => button.addEventListener('click', openPicker));
      modal.addEventListener('click', (event) => { if (event.target === modal) closePicker(); });
      document.addEventListener('keydown', (event) => {
        if (modal.hidden) return;
        if (event.key === 'Escape') closePicker();
        if (event.key === 'Tab') { // keep focus inside the picker
          const buttons = [...modal.querySelectorAll('button')];
          const i = buttons.indexOf(document.activeElement);
          event.preventDefault();
          buttons[(i + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
        }
      });
      const chosenBefore = LANGS.includes(readStored()) || new URLSearchParams(location.search).has('lang');
      if (!chosenBefore) openPicker();
    }
  });

  // Texts from the server with translations next to them, e.g. a plan's name / name_en / name_hu:
  // local(plan, 'name') is the current language's, or the Slovak one when that wasn't filled in.
  const local = (item, field) => (current !== DEFAULT && item?.[`${field}_${current}`]) || item?.[field] || '';

  // Used by home.js for texts it creates itself and for number formatting.
  window.UG_I18N = { t, local, get lang() { return current; } };
})();
