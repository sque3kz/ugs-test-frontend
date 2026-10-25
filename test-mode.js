// Test version only (added by build.py): a small notice that this is a preview,
// and a message instead of registration, login and the member portal, which need the server.
(() => {
  const css = `
    .test-badge { position: fixed; left: 22px; bottom: 84px; z-index: 9999; padding: 6px 12px; border-radius: 999px;
      background: #ffc400; color: #0b0b0c; font: 700 12px/1.4 Inter, system-ui, sans-serif; letter-spacing: .04em;
      text-transform: uppercase; box-shadow: 0 4px 14px rgba(0 0 0 / .4); pointer-events: none; }
    .test-toast { position: fixed; left: 50%; bottom: 24px; z-index: 10000; max-width: calc(100vw - 32px); padding: 12px 18px;
      border-radius: 12px; background: #1b1b1e; color: #fff; border: 1px solid #ffc400; font: 500 14px/1.5 Inter, system-ui, sans-serif;
      translate: -50% 12px; opacity: 0; transition: opacity .25s, translate .25s; pointer-events: none; text-align: center; }
    .test-toast.show { opacity: 1; translate: -50% 0; }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);

  const badge = document.createElement('div');
  badge.className = 'test-badge';
  badge.textContent = 'Testovacia verzia';
  const toast = document.createElement('div');
  toast.className = 'test-toast';
  toast.setAttribute('role', 'status');
  document.body.append(badge, toast);

  let timer;
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-test-off]')) return;
    event.preventDefault();
    toast.textContent = 'Toto je testovacia verzia webu: registrácia, prihlásenie a nákup tu nefungujú.';
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('show'), 3200);
  });
})();
