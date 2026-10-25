// Draws the decorative (demo) QR codes in elements with data-qr="…": the homepage
// hero card and phone mockup, and the phone on the login page. Needs the QR library
// (assets/vendor/qrcode-generator-1.4.4.js) loaded before this file.
//
// In the phone mockups the code also changes each time the countdown bar runs out,
// and [data-demo-date] shows today's date, like the real member app.

(() => {
  function drawQr(el, payload) {
    const code = qrcode(0, 'M');
    code.addData(payload);
    code.make();
    const n = code.getModuleCount();
    let path = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) if (code.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
    }
    el.innerHTML = `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-hidden="true"><path d="${path}" fill="#0b0b0c"/></svg>`;
  }

  if (typeof qrcode === 'function') {
    document.querySelectorAll('[data-qr]').forEach((el) => {
      drawQr(el, el.dataset.qr);
      // Phone mockups: a new code every time the timer bar under it starts over
      const timer = el.closest('.app-pass')?.querySelector('.app-timer span');
      let step = 0;
      timer?.addEventListener('animationiteration', () => drawQr(el, `${el.dataset.qr}-${++step}`));
    });
  }

  const showDate = () => {
    const lang = document.documentElement.lang || 'sk';
    const text = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    document.querySelectorAll('[data-demo-date]').forEach((el) => { el.textContent = text.charAt(0).toUpperCase() + text.slice(1); });
  };
  showDate();
  document.addEventListener('ug:langchange', showDate);
})();
