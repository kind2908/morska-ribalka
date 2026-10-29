// Главный файл: состояние, переключение вкладок, загрузка данных, запуск
const APP_VERSION = '1.10.0';
const ANDROID_APK = 'app-release.apk';
const THEMES = ['sea', 'light', 'sand'];
const THEME_COLORS = { sea: ['#0B5C8E', '#0A1822'], light: ['#F6F7F5', '#F6F7F5'], sand: ['#F5ECDD', '#F5ECDD'] };

const S = {
  region: 'Херцег-Нови', selected: null, boat: false, fish: null,
  data: null, error: false, days: [], hourly: null, air: null,
  mySpots: [], tab: 0, showSettings: false, mapFocus: null, pick: null,
  diarySub: 0, draft: null, editNote: null, mark: null, slider: 10,
  rulesOpen: false, libOpen: null, aboutOpen: false, theme: 0,
  gps: { code: 0, acc: 0, loading: false }, token: 0, pending: false,
  updateReady: false, installHint: null, reload: null, picker: false
};

const $ = id => document.getElementById(id);
let lastTab = -1;

// ---------- Действия ----------
const A = {
  rerender() { render(); },
  openSettings() { S.showSettings = true; render(); },
  closeSettings() { S.showSettings = false; render(); },
  applyTheme() {
    const name = THEMES[S.theme] || 'sea';
    document.documentElement.dataset.theme = name;
    const dark = name === 'sea' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', THEME_COLORS[name][dark ? 1 : 0]);
    if (typeof Bg !== 'undefined') Bg.theme();
  },
  setBoat(v) {
    S.boat = v; Store.set('boat', v);
    S.fish = pickFish(v);
    const spots = regionSpots(S.region);
    if (!v && (S.selected.lat === spots[1].lat || S.selected.lat === spots[2].lat) && (S.selected.lon === spots[1].lon || S.selected.lon === spots[2].lon)) {
      S.selected = spots[0]; S.reload(); return;
    }
    render();
  },
  setFish(name) {
    S.fish = fishFor(S.boat).find(f => f.name === name) || fishFor(S.boat)[0];
    Store.set(S.boat ? 'fish_boat' : 'fish_shore', S.fish.name);
    render();
  },
  // выбор страны: ставит язык страны (если просили), районы, точку и перезагружает данные
  setCountry(code, withLang) {
    Country.set(code);
    if (withLang) Lang.set(Country.data.lang);
    refreshRegions();
    S.picker = false;
    S.region = REGIONS[0].key; Store.set('region', S.region);
    S.selected = regionSpots(S.region)[0];
    S.fish = pickFish(S.boat);
    S.libOpen = null; S.rulesOpen = false;
    render(true);
    S.reload();
  },
  setRegion(key) {
    if (key === S.region) return;
    S.region = key; Store.set('region', key);
    S.selected = regionSpots(key)[0];
    S.reload();
  },
  select(spot) { S.selected = spot; S.reload(); },
  addSpot(spot) {
    S.mySpots.push(spot); Store.set('my_spots', S.mySpots);
    render(); MapUI.ready(S);
  },
  removeSpot(i) { S.mySpots.splice(i, 1); Store.set('my_spots', S.mySpots); render(); },
  gps() {
    if (!navigator.geolocation) { S.gps = { code: 1, acc: 0, loading: false }; render(); return; }
    S.gps = { code: 0, acc: 0, loading: true }; render();
    navigator.geolocation.getCurrentPosition(pos => {
      const acc = Math.round(pos.coords.accuracy || -1);
      S.gps = { code: acc > 200 ? 3 : 2, acc, loading: false };
      S.selected = { name: 'Моё место', lat: pos.coords.latitude, lon: pos.coords.longitude };
      S.reload();
    }, err => {
      S.gps = { code: err && err.code === 1 ? 5 : 1, acc: 0, loading: false };
      render();
    }, { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 });
  },
  pickOnMap(req) { S.pick = req; S.showSettings = false; S.tab = 3; S.mapFocus = null; render(true); },
  showOnMap(p) { S.mapFocus = p; S.pick = null; S.tab = 3; render(true); },
  updateBanner() {
    return h('div', { class: 'warn caution row' },
      h('span', { class: 'grow' }, tr('Доступна новая версия приложения.', 'A new version of the app is available.', 'Dostupna je nova verzija aplikacije.')),
      btn(tr('Обновить', 'Update', 'Ažuriraj'), () => {
        if (S.waitingWorker) S.waitingWorker.postMessage({ type: 'SKIP_WAITING' }); else location.reload();
      }, { primary: true }));
  }
};

const mapHooks = {
  consumeFocus() { S.mapFocus = null; },
  cancelPick() {
    const kind = S.pick && S.pick.kind;
    S.pick = null; S.tab = kind === 'location' ? 0 : 4; render(true);
  },
  picked(point) {
    const p = S.pick; S.pick = null;
    if (!p) return;
    if (p.kind === 'location') { S.selected = { name: 'Точка на карте', lat: point.lat, lon: point.lon }; S.tab = 0; S.reload(); render(true); }
    else if (p.kind === 'diary') { S.draft.point = point; S.diarySub = 0; S.tab = 4; render(true); }
    else if (p.kind === 'entry') { Diary.update(p.id, { lat: point.lat, lon: point.lon }); S.diarySub = 1; S.tab = 4; render(true); }
  },
  useSpot(spot) { S.pick = null; S.tab = 0; S.selected = spot; S.reload(); render(true); },
  saveSpot(spot) { A.addSpot(spot); }
};

function pickFish(boat) {
  const name = Store.get(boat ? 'fish_boat' : 'fish_shore', null);
  const list = fishFor(boat);
  return list.find(f => f.name === name) || list[0];
}

// ---------- Загрузка данных ----------
S.reload = function () {
  const token = ++S.token, spot = S.selected;
  S.data = null; S.error = false; S.days = []; S.hourly = null; S.air = null; S.station = null;
  render();
  const ok = fn => v => { if (token === S.token) { fn(v); softRender(); } };
  const go = () => {
    loadSeaData(spot).then(ok(d => { S.data = d; })).catch(ok(() => { S.error = true; }));
    loadDays(spot).then(ok(d => { S.days = d; })).catch(ok(() => { S.days = []; }));
    loadHourly(spot).then(ok(d => { S.hourly = d; })).catch(ok(() => { S.hourly = null; }));
    loadAir(spot).then(ok(d => { S.air = d; })).catch(ok(() => { S.air = null; }));
    loadStation(spot).then(ok(d => { S.station = d; })).catch(ok(() => { S.station = null; }));
  };
  if (spot.snap === false) {
    // точки района проверяем по карте глубин и при необходимости сдвигаем на воду
    const key = 'snap.' + spot.lat.toFixed(4) + ',' + spot.lon.toFixed(4);
    const cached = Store.get(key, null);
    const apply = p => {
      if (p) { spot.lat = p.lat; spot.lon = p.lon; }
      spot.snap = true;
    };
    if (cached) { apply(cached); go(); return; }
    if (spot.shore) {
      // «Берег»: данные грузим сразу, а точку сдвигаем в фоне; если сдвинулась, загружаем заново
      const la0 = spot.lat, lo0 = spot.lon;
      go();
      snapToWater(la0, lo0, true).then(p => {
        if (p) Store.set(key, p);
        apply(p);
        if (p && token === S.token && (Math.abs(p.lat - la0) > 0.0003 || Math.abs(p.lon - lo0) > 0.0003)) S.reload();
      }).catch(() => { spot.snap = true; });
      return;
    }
    snapToWater(spot.lat, spot.lon).then(p => {
      if (p) Store.set(key, p);
      apply(p);
      if (token === S.token) { render(); go(); }
    }).catch(() => { spot.snap = true; if (token === S.token) go(); });
    return;
  }
  go();
};

// не перерисовываем под руками, пока человек печатает
function softRender() {
  const a = document.activeElement;
  if (a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName) && $('view').contains(a)) { S.pending = true; return; }
  render();
}

// ---------- Отрисовка ----------
function render(force) {
  const view = $('view'), nav = $('tabs');
  document.body.classList.toggle('picking', S.picker);
  if (S.picker) {
    if (MapUI.map || MapUI.box) MapUI.destroy();
    view.classList.remove('maponly');
    view.replaceChildren(h('div', { class: 'stack page-wrap' }, renderCountryPicker(S, A)));
    nav.replaceChildren();
    view.scrollTop = 0;
    lastTab = 'picker';
    return;
  }
  if (!force && S.tab === 3 && !S.showSettings && MapUI.alive()) { MapUI.ready(S); return; }
  const sameScreen = lastTab === (S.showSettings ? 'settings' : S.tab);
  const scroll = sameScreen ? view.scrollTop : 0;
  if (MapUI.map || MapUI.box) MapUI.destroy();

  document.body.classList.toggle('in-settings', S.showSettings);
  Bg.hold(!S.showSettings && S.tab === 3);
  view.classList.toggle('maponly', !S.showSettings && S.tab === 3);
  let content;
  if (S.showSettings) content = renderSettings(S, A);
  else if (S.tab === 0) content = renderBite(S, A);
  else if (S.tab === 1) content = renderConditions(S, A);
  else if (S.tab === 2) content = renderDays(S, A);
  else if (S.tab === 3) content = [MapUI.build(S, mapHooks)];
  else if (S.tab === 4) content = renderDiary(S, A);
  else content = renderLibrary(S, () => render());
  view.replaceChildren(h('div', { class: 'stack page-wrap' }, content));
  if (S.tab === 3 && !S.showSettings) view.replaceChildren(content[0]);
  view.scrollTop = scroll;
  lastTab = S.showSettings ? 'settings' : S.tab;
  if (!sameScreen) Stats.screen(S.tab, S.showSettings);

  nav.replaceChildren(...tabTitles().map((title, i) =>
    h('button', {
      class: 'tab' + (S.tab === i ? ' on' : ''), type: 'button',
      onclick: () => {
        if (S.tab === i && !S.showSettings) return;
        S.tab = i;
        if (i !== 3) { S.mapFocus = null; S.pick = null; }
        if (i === 4) S.diarySub = S.diarySub === 2 ? 2 : S.diarySub;
        render(true);
      }
    }, h('span', { class: 'ti' }, TAB_ICONS[i]), h('span', { class: 'tl' }, title))));
  document.documentElement.lang = Lang.current;
}

// ---------- Подсказка про установку на iPhone ----------
function makeInstallHint() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  if (!ios || standalone || Store.get('hint_closed', false)) return null;
  return h('div', { class: 'warn caution' },
    h('div', { class: 'row' },
      h('b', { class: 'grow' }, tr('Как поставить на iPhone', 'How to install on iPhone', 'Kako instalirati na iPhone')),
      h('button', { class: 'gear', type: 'button', 'aria-label': 'close', onclick: () => { Store.set('hint_closed', true); S.installHint = null; render(); } }, '×')),
    h('p', null, tr('В Safari нажмите «Поделиться» (квадрат со стрелкой), затем «На экран “Домой”». Дальше открывайте приложение с иконки: данные Safari и иконки хранятся раздельно, поэтому дневник начинайте вести уже в ней.',
      'In Safari tap “Share” (the square with an arrow), then “Add to Home Screen”. Then open the app from the icon: Safari and the icon keep their data separately, so start your diary in the icon.',
      'U Safariju dodirnite „Podijeli“ (kvadrat sa strelicom), zatim „Dodaj na početni ekran“. Zatim otvarajte aplikaciju s ikone: Safari i ikona čuvaju podatke odvojeno, pa dnevnik počnite voditi u ikoni.')));
}

// ---------- Service worker ----------
function registerWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    const flag = w => { S.waitingWorker = w; S.updateReady = true; render(); };
    if (reg.waiting && navigator.serviceWorker.controller) flag(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) flag(nw);
      });
    });
    // проверка новой версии при каждом открытии
    reg.update().catch(() => {});
  }).catch(() => {});
  // перезагружаем страницу только при обновлении, а не при самой первой установке
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded || !hadController) return;
    reloaded = true;
    location.reload();
  });
}

// ---------- Запуск ----------
function init() {
  Lang.load();
  S.theme = Math.min(2, Math.max(0, Store.get('theme', 0)));
  Bg.init();
  Stats.init();
  A.applyTheme();
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => A.applyTheme());

  // 1.6.1: «Зубатка» переименована в «Зубан» (Dentex dentex)
  ['fish_boat', 'fish_shore'].forEach(k => { if (Store.get(k, null) === 'Зубатка') Store.set(k, 'Зубан'); });
  const dl = Store.get('diary', []);
  if (dl.some(e => e.fish === 'Зубатка')) Store.set('diary', dl.map(e => e.fish === 'Зубатка' ? Object.assign({}, e, { fish: 'Зубан' }) : e));
  const savedCountry = Country.saved();
  Country.apply(savedCountry || 'ME');
  refreshRegions();
  S.picker = !savedCountry;
  const region = Store.get('region', REGIONS[0].key);
  S.region = REGIONS.some(r => r.key === region) ? region : REGIONS[0].key;
  S.boat = !!Store.get('boat', false);
  S.fish = pickFish(S.boat);
  S.selected = regionSpots(S.region)[0];
  S.mySpots = Store.get('my_spots', []);
  const mk = Store.get('mark', null);
  if (mk && mk.date === nowLocal().date) { S.mark = mk.m; S.slider = mk.m; }
  S.draft = newDraft(S);
  S.installHint = makeInstallHint();

  $('view').addEventListener('focusout', () => {
    if (S.pending) { S.pending = false; setTimeout(() => softRender(), 80); }
  });
  render(true);
  if (!S.picker) S.reload();
  registerWorker();
}
document.addEventListener('DOMContentLoaded', init);
