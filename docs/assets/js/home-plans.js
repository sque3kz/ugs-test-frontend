// TEST COPY, built by build.py: the plans are baked in, nothing is loaded from the server.
// Homepage memberships (index.html #memberships): the up to 3 plans the owner placed on
// the homepage (Plans & prices → "Show on the homepage"), with their real names and prices.
// GET /api/v1/member/homepage-plans/ is public: no login, no cookies.
// The middle place is highlighted as the most popular. Re-drawn when the language changes.
//
// The buy button: a logged-in member goes to the checkout page (member/checkout.html: one-time
// or automatic renewal, start date, then Stripe), like the shop on the member page. Plans that
// can't be paid online say "buy at reception". Visitors who aren't logged in go to registration.

(() => {
  const PLANS = [{"name": "JEDNORAZOVÝ", "description": "Jednorazový vstup", "price": "5.00", "duration_days": null, "entries": 1, "homepage_position": 1, "id": 1, "online": true}, {"name": "MESAČNÁ", "description": "Mesačná permanentka", "price": "50.00", "duration_days": 30, "entries": null, "homepage_position": 2, "id": 2, "online": true}, {"name": "10 VSTUPOV", "description": "10 Vstupová permanentka", "price": "45.00", "duration_days": null, "entries": 10, "homepage_position": 3, "id": 3, "online": true}];
  const box = document.getElementById('home-plans');
  if (!box) return;

  let plans = null; // once loaded
  const t = (key, vars = {}) => (window.UG_I18N?.t(key) ?? key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
  const lang = () => window.UG_I18N?.lang || document.documentElement.lang || 'sk';
  const local = (item, field) => window.UG_I18N?.local(item, field) ?? item[field];

  // e.g. plural('member.shopEntries', 10) → "10 vstupov" (keys …One / …Few / …Many)
  function plural(base, n) {
    const form = new Intl.PluralRules(lang()).select(n);
    return t(form === 'one' ? `${base}One` : form === 'few' ? `${base}Few` : `${base}Many`, { n });
  }

  function price(amount) {
    const value = Number(amount);
    return new Intl.NumberFormat(lang(), {
      style: 'currency', currency: 'EUR', minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  }

  // What the price is for: "/ vstup", "/ 10 vstupov", "/ mesiac", "/ rok", "/ 14 dní"
  function unit(plan) {
    if (plan.entries === 1) return t('plans.unitEntry');
    if (plan.entries) return plural('plans.unitEntries', plan.entries);
    if (plan.duration_days === 30 || plan.duration_days === 31) return t('plans.unitMonth');
    if (plan.duration_days === 365 || plan.duration_days === 366) return t('plans.unitYear');
    return plural('plans.unitDays', plan.duration_days);
  }

  function perks(plan) {
    return [
      plan.entries ? plural('member.shopEntries', plan.entries) : t('member.shopUnlimited'),
      plan.duration_days ? plural('member.shopDays', plan.duration_days) : t('member.shopNoExpiry'),
      t('plan.qrEntry'),
      t('plans.perkLockers'),
    ];
  }

  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text; // textContent: plan names come from the server
    return el;
  }

  const SVG = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" /></svg>`; // static markup only

  function card(plan) {
    const featured = plan.homepage_position === 2;
    const article = node('article', `plan${featured ? ' featured' : ''}`);
    if (featured) article.append(node('span', 'ribbon', t('plans.ribbon')));
    article.append(node('h3', '', local(plan, 'name')));
    article.append(node('p', 'plan-sub', local(plan, 'description') || perks(plan).slice(0, 2).join(' · ')));

    const priceBox = node('div', 'price');
    priceBox.append(node('strong', '', price(plan.price)), node('span', '', unit(plan)));
    article.append(priceBox);

    const list = node('ul');
    for (const perk of perks(plan)) {
      const item = node('li');
      item.innerHTML = SVG('M5 12l5 5L20 7');
      item.append(node('span', '', perk));
      list.append(item);
    }
    article.append(list);

    article.append(buyButton(plan, featured));
    return article;
  }

  const loggedIn = () => Boolean(window.UG_SESSION?.logged_in);

  function buyButton(plan, featured) {
    if (loggedIn() && !plan.online) return node('p', 'plan-note', t('member.shopAtReception'));
    const button = node('a', featured ? 'btn' : 'btn btn-ghost');
    button.href = '#test-off';
    button.dataset.testOff = '';
    button.append(node('span', '', t(plan.entries === 1 ? 'plans.btnEntry' : 'plans.btnPass')));
    if (featured) button.insertAdjacentHTML('beforeend', SVG('M5 12h14M13 6l6 6-6 6'));
    return button;
  }

  function render() {
    box.replaceChildren(...(plans ?? []).map(card));
    box.dataset.count = plans?.length ?? 0;
    box.hidden = !plans?.length;
    document.getElementById('home-plans-note').hidden = Boolean(plans?.length);
  }

  function load() {
    plans = PLANS;
    render();
  }

  document.addEventListener('ug:langchange', () => { if (plans) render(); });
  document.addEventListener('ug:session', () => { if (plans) render(); }); // logged in: buy buttons go to the checkout page
  load();
})();
