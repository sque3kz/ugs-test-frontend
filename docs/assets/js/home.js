// Landing page behaviour (index.html, also the trainer pages): scroll reveal, counters, dated notices,
// gallery lightbox and card effects. The demo QR codes are drawn by demo-qr.js.
// The top bar menu and account icon are handled by site-header.js / site-account.js.

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ----- Scroll: progress bar, hide/show top bar, back-to-top, hero parallax ----- */

  const root = document.documentElement;
  const bar = document.querySelector('.topbar');
  const menu = document.querySelector('.topbar-links');
  const toTop = document.querySelector('.to-top');
  const parallax = document.querySelector('[data-parallax]');
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);

    // Tuck the bar away when scrolling down, bring it back when scrolling up.
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (goingDown && y > 500 && !menu.classList.contains('open')) bar.classList.add('tucked');
    else if (goingUp || y < 500) bar.classList.remove('tucked');
    lastY = y;

    toTop.classList.toggle('show', y > 900);

    if (parallax && !reduceMotion && y < window.innerHeight * 1.2) {
      parallax.style.transform = `translate3d(0, ${y * Number(parallax.dataset.parallax)}px, 0)`;
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ----- Highlight the nav link of the section in view ----- */

  const navLinks = [...document.querySelectorAll('.topbar-links a[href^="#"]')];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((section) => sectionObserver.observe(section));

  /* ----- Reveal on scroll ----- */

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .about-media').forEach((el) => revealObserver.observe(el));

  // Programs on phones are a sideways swipe row: lazy photos out to the side would only load
  // mid-swipe, so load them all once the section gets close.
  const programs = document.querySelector('.programs');
  if (programs) {
    new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      programs.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
      observer.disconnect();
    }, { rootMargin: '600px 0px' }).observe(programs);
  }

  /* ----- Animated counters ----- */

  // Numbers follow the page language (1,200 in English, 1 200 in Slovak).
  const format = (n) => new Intl.NumberFormat(document.documentElement.lang || 'sk').format(n);
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    el.dataset.counted = 'true';
    if (reduceMotion) { el.textContent = format(target); return; }
    const duration = 1800;
    let start;
    const step = (now) => {
      start ??= now;
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    setTimeout(() => requestAnimationFrame(step), Number(el.dataset.countDelay ?? 0));
  };

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => counterObserver.observe(el));

  // Switching language: re-format the numbers that have already counted up.
  document.addEventListener('ug:langchange', () => {
    document.querySelectorAll('[data-count][data-counted]').forEach((el) => { el.textContent = format(Number(el.dataset.count)); });
  });

  /* ----- Hide time-limited notices once their date has passed ----- */

  document.querySelectorAll('[data-until]').forEach((el) => {
    if (new Date() >= new Date(`${el.dataset.until}T00:00:00`)) el.remove();
  });

  /* ----- Trainers: endless horizontal scroller (swipe, trackpad or one button per trainer) ----- */

  const track = document.getElementById('trainers-track');
  if (track) {
    const nav = document.querySelector('.trainers-nav');
    const real = [...track.children];
    real.forEach((card, i) => { card.dataset.index = i; });

    // The loop: a copy of every trainer before and after the real ones. When scrolling stops on a
    // copy, the row jumps (instantly, to the identical spot) to the real card, so it never ends.
    // The copies are hidden from screen readers; with 3 or fewer trainers there is no loop.
    const loop = real.length > 3;
    const copy = (card) => {
      const clone = card.cloneNode(true);
      clone.removeAttribute('data-start');
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a').forEach((link) => { link.tabIndex = -1; }); // keyboard: the real cards only
      clone.dataset.copy = '';
      return clone;
    };
    if (loop) {
      track.prepend(...real.map(copy));
      track.append(...real.map(copy));
      track.classList.add('is-loop');
    }
    const cards = [...track.children];
    const hasMiddle = () => track.classList.contains('has-focus');

    // Where `card` is from where it should be: the middle (3 or 1 in view), or the left edge (2 in view)
    const offsetOf = (card) => {
      const box = track.getBoundingClientRect();
      const r = card.getBoundingClientRect();
      return hasMiddle() ? r.left + r.width / 2 - (box.left + box.width / 2) : r.left - box.left;
    };
    const show = (card, behavior = reduceMotion ? 'auto' : 'smooth') => {
      track.scrollTo({ left: track.scrollLeft + offsetOf(card), behavior });
    };
    // Trainer i: the copy nearest to where the row is now, so the loop goes the short way round
    const nearest = (i) => cards.filter((card) => Number(card.dataset.index) === i)
      .reduce((best, card) => (Math.abs(offsetOf(card)) < Math.abs(offsetOf(best)) ? card : best));

    // The buttons: one per trainer, named after them; the current one is drawn longer and yellow
    const dots = real.map((card, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'trainers-dot';
      dot.setAttribute('aria-controls', 'trainers-track');
      const name = card.querySelector('.trainer-name');
      dot.setAttribute('aria-label', (name?.querySelector('a') ?? name?.firstChild)?.textContent.trim() ?? ''); // the name, not the specialisation
      dot.addEventListener('click', () => show(nearest(i)));
      nav.append(dot);
      return dot;
    });

    // With three in view, the card nearest the middle is in focus and the others are dimmed
    // (home.css). With two in view, or one on phones, nothing is highlighted: the cards just slide.
    const updateFocus = () => {
      const focus = getComputedStyle(track).getPropertyValue('--show').trim() === '3';
      const box = track.getBoundingClientRect();
      const middle = box.left + box.width / 2;
      const distance = (card) => { const r = card.getBoundingClientRect(); return Math.abs(r.left + r.width / 2 - middle); };
      const center = focus ? cards.reduce((best, card) => (distance(card) < distance(best) ? card : best)) : null;
      track.classList.toggle('has-focus', focus);
      cards.forEach((card) => card.classList.toggle('is-center', card === center));
      // Current button: the trainer in the middle, or every trainer in view when there is no middle
      const inView = (card) => { const r = card.getBoundingClientRect(); return r.left >= box.left - 2 && r.right <= box.right + 2; };
      const current = new Set(cards.filter((card) => (center ? card === center : inView(card))).map((card) => Number(card.dataset.index)));
      dots.forEach((dot, i) => {
        if (current.has(i)) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    };

    const update = () => {
      nav.hidden = track.scrollWidth - track.clientWidth <= 1; // every card fits: nothing to choose
      updateFocus();
    };

    // Resting on a copy: jump to the same spot among the real cards. .is-jumping (home.css) switches
    // the card animations off for that moment, so the real card doesn't fade in from dimmed.
    // Never while a finger is on the row: phones (Safari above all) fight a scroll jump during a
    // swipe, and the row visibly jumps.
    let touching = false;
    const settle = () => {
      if (!loop || touching) return;
      const resting = track.querySelector('.is-center') ?? cards.find((card) => Math.abs(offsetOf(card)) < 2);
      if (!resting || !('copy' in resting.dataset)) return;
      const twin = real[Number(resting.dataset.index)];
      track.classList.add('is-jumping');
      track.scrollTo({ left: track.scrollLeft + offsetOf(twin) - offsetOf(resting), behavior: 'instant' });
      update();
      void track.offsetWidth; // apply the new classes before the animations come back
      requestAnimationFrame(() => track.classList.remove('is-jumping'));
    };

    // Settle once scrolling, the glide after a swipe and the snapping have all finished: on
    // scrollend where the browser has it, else after a quiet moment with no finger on the row.
    const hasScrollEnd = 'onscrollend' in window;
    let frame = 0;
    let settleTimer = 0;
    const waitToSettle = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 300);
    };
    const onTrackScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
      if (hasScrollEnd) clearTimeout(settleTimer); // still moving: scrollend will come
      else waitToSettle();
    };
    track.addEventListener('scroll', onTrackScroll, { passive: true });
    if (hasScrollEnd) track.addEventListener('scrollend', settle);
    track.addEventListener('touchstart', () => { touching = true; clearTimeout(settleTimer); }, { passive: true });
    const onTouchEnd = () => {
      touching = false;
      waitToSettle(); // a tap without scrolling fires no scrollend
    };
    track.addEventListener('touchend', onTouchEnd, { passive: true });
    track.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('resize', () => {
      onTrackScroll();
      waitToSettle();
    });

    // Start among the real cards: the head coach (data-start) in the middle with 3 in view, else the first
    update();
    const start = getComputedStyle(track).getPropertyValue('--show').trim() === '3' && track.querySelector('[data-start]');
    show(start || real[0], 'instant');
    update();

    // Clicking a dimmed card brings it to the middle; only the trainer in the middle opens their page
    track.addEventListener('click', (event) => {
      const card = event.target.closest('.trainer-wrap');
      if (!card || card.classList.contains('is-center') || !hasMiddle()) return;
      event.preventDefault();
      show(card);
    });
  }

  /* ----- Pointer effects: feature spotlight and trainer card tilt ----- */

  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.feature').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      });
    });

    document.querySelectorAll('.trainer').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--ry', `${x * 12}deg`);
        card.style.setProperty('--rx', `${y * -12}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });

    // Buttons lean slightly towards the pointer.
    document.querySelectorAll('.hero .btn, .cta .btn').forEach((btn) => {
      btn.addEventListener('pointermove', (event) => {
        const rect = btn.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.25 - 2}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ----- Gallery lightbox ----- */
  // The homepage only (trainer pages share this script but have no gallery)
  const shots = [...document.querySelectorAll('[data-gallery] .shot')];
  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    const lbCaption = lightbox.querySelector('figcaption');
    let current = 0;
    let lastFocus = null;

    const show = (index) => {
      current = (index + shots.length) % shots.length;
      const img = shots[current].querySelector('img');
      lbImg.src = img.src.replace(/w=\d+/, 'w=2000');
      lbImg.alt = img.alt;
      lbCaption.textContent = shots[current].querySelector('.caption b').textContent + ' · ' + img.alt;
    };

    const openLightbox = (index) => {
      lastFocus = document.activeElement;
      show(index);
      lightbox.hidden = false;
      requestAnimationFrame(() => lightbox.classList.add('open'));
      document.body.style.overflow = 'hidden';
      lightbox.querySelector('.lb-close').focus();
    };

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => { lightbox.hidden = true; }, reduceMotion ? 0 : 300);
      lastFocus?.focus();
    };

    shots.forEach((shot, i) => shot.addEventListener('click', () => openLightbox(i)));
    lightbox.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lb-prev').addEventListener('click', () => show(current - 1));
    lightbox.querySelector('.lb-next').addEventListener('click', () => show(current + 1));
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });

    document.addEventListener('keydown', (event) => {
      if (lightbox.hidden) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
      if (event.key === 'Tab') { // keep focus inside the viewer
        const buttons = [...lightbox.querySelectorAll('button')];
        const i = buttons.indexOf(document.activeElement);
        event.preventDefault();
        buttons[(i + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      }
    });

    // Swipe between photos on touch screens.
    let touchX = null;
    lightbox.addEventListener('touchstart', (event) => { touchX = event.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (event) => {
      if (touchX === null) return;
      const dx = event.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  /* ----- Footer year ----- */

  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
