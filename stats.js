// Анонимная статистика посещений (Google Analytics 4, тот же проект Firebase, что и у Android-версии).
// Отправляются только: открытие, переходы между экранами, язык и страна (определяет сам Google).
// Дневник, фото, координаты и настройки в статистику не попадают. Можно выключить в настройках.
const Stats = (() => {
  const MID = 'G-GH0CQBNDMV';
  const NAMES = ['bite', 'conditions', 'days', 'map', 'diary', 'fish'];
  let on = true, loaded = false;

  function load() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', MID, {
      send_page_view: false, allow_google_signals: false,
      allow_ad_personalization_signals: false, anonymize_ip: true
    });
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MID;
    document.head.appendChild(s);
  }
  function send(name, params) {
    if (!on || !loaded || typeof gtag !== 'function') return;
    try { gtag('event', name, params || {}); } catch (e) { /* статистика не должна ломать сайт */ }
  }

  return {
    init() {
      on = Store.get('stats', true) !== false;
      window['ga-disable-' + MID] = !on;
      if (on) load();
      window.addEventListener('appinstalled', () => send('pwa_installed'));
    },
    isOn() { return on; },
    set(v) {
      on = !!v; Store.set('stats', on);
      window['ga-disable-' + MID] = !on;
      if (on) load();
    },
    screen(tab, settings) {
      send('screen_view', { screen_name: settings ? 'settings' : NAMES[tab] || String(tab), app_version: APP_VERSION });
    },
    event(name, params) { send(name, params); }
  };
})();
