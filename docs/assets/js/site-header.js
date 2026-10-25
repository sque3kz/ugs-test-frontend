// Top bar behaviour (website and member app): phone menu toggle, and a
// stronger shadow once the page is scrolled.

(() => {
  const bar = document.querySelector('.topbar');
  if (!bar) return;
  const toggle = bar.querySelector('.menu-toggle');
  const links = bar.querySelector('.topbar-links');
  if (toggle && links) initMenu();

  // Phone menu (pages without a menu button, like the member portal, skip this;
  // there the account menu has the links instead)
  function initMenu() {
    let closeTimer = null;
    const setOpen = (open) => {
      links.classList.toggle('open', open);
      // menu-open locks scrolling and clears the bar's blur (which would trap the full-screen panel).
      // On close it stays until the circle has finished shrinking, so the panel doesn't jump into the bar.
      clearTimeout(closeTimer);
      if (open) document.documentElement.classList.add('menu-open');
      else if (document.documentElement.classList.contains('menu-open')) {
        closeTimer = setTimeout(() => document.documentElement.classList.remove('menu-open'), 750);
      }
      toggle.setAttribute('aria-expanded', String(open));
      // The homepage provides translated labels; other pages fall back to English.
      const label = open ? toggle.dataset.labelClose || 'Close menu' : toggle.dataset.labelOpen || 'Open menu';
      toggle.setAttribute('aria-label', label);
    };

    toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
    links.addEventListener('click', (event) => {
      if (event.target.closest('a, [data-menu-close]')) setOpen(false); // a link or the back button closes the menu
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
    // Close the phone menu when the screen gets wide enough for the normal navbar.
    const desktopFrom = bar.dataset.menuBreakpoint || '761';
    window.matchMedia(`(min-width: ${desktopFrom}px)`).addEventListener('change', () => setOpen(false));
  }

  const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
