// Карта: Leaflet (подгружается при первом открытии вкладки), спутник Esri, глубины EMODnet
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';

let leafletPromise = null;
function loadLeaflet() {
  if (window.L && window.L.map) return Promise.resolve();
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = LEAFLET_CSS;
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = LEAFLET_JS;
    js.onload = () => resolve();
    js.onerror = () => { leafletPromise = null; reject(new Error('leaflet')); };
    document.head.appendChild(js);
  });
  return leafletPromise;
}

const MapUI = {
  map: null,
  overlay: null,   // слой с маркерами
  depthLayer: null,
  box: null,
  sheet: null,
  point: null,     // выбранная нажатием точка {lat, lon}
  pointMarker: null,

  alive() { return !!(this.map && this.box && document.body.contains(this.box)); },

  destroy() {
    if (this.map) { try { this.map.remove(); } catch (e) { /* уже удалена */ } }
    this.map = null; this.overlay = null; this.depthLayer = null; this.box = null;
    this.sheet = null; this.point = null; this.pointMarker = null;
  },

  // Строит экран карты и возвращает DOM-элемент
  build(S, hooks) {
    this.destroy();
    const mapDiv = h('div', { class: 'map' });
    const sheet = h('div', { class: 'sheet hidden' });
    const top = h('div', { class: 'maptop' });
    const box = h('div', { class: 'mapbox' }, mapDiv, top, sheet);
    this.box = box; this.sheet = sheet; this.top = top;
    this.hooks = hooks;
    loadLeaflet().then(() => this._init(mapDiv, S, hooks)).catch(() => {
      mapDiv.appendChild(h('div', { class: 'card', style: { margin: '16px' } },
        h('h3', null, tr('Карта недоступна', 'Map unavailable', 'Karta nije dostupna')),
        h('p', null, tr('Не удалось загрузить карту. Проверьте интернет и откройте вкладку ещё раз.',
          'Could not load the map. Check your internet connection and open the tab again.',
          'Nije moguće učitati kartu. Provjerite internet i ponovo otvorite karticu.'))));
    });
    return box;
  },

  _init(mapDiv, S, hooks) {
    if (!document.body.contains(mapDiv)) return;
    const L = window.L;
    const focus = S.mapFocus;
    const centre = focus ? [focus.lat, focus.lon] : [S.selected.lat, S.selected.lon];
    const map = L.map(mapDiv, { zoomControl: false, attributionControl: true }).setView(centre, focus ? 15 : 13);
    L.control.zoom({ position: 'topright' }).addTo(map);
    this.map = map;
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, zIndex: 1, attribution: 'Esri World Imagery' }).addTo(map);
    this.depthLayer = L.tileLayer.wms('https://ows.emodnet-bathymetry.eu/wms',
      { layers: 'emodnet:mean_multicolour', format: 'image/png', transparent: true, opacity: 0.65, version: '1.1.1', zIndex: 3, attribution: 'EMODnet Bathymetry' });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, zIndex: 5, attribution: 'Esri Reference' }).addTo(map);
    this.overlay = L.layerGroup().addTo(map);
    this.refreshMarkers(S);
    map.on('click', e => this.onTap(e.latlng.lat, e.latlng.lng, S));
    setTimeout(() => map.invalidateSize(), 50);
    this.renderTop(S);
    if (S.pick) this.showHint(S);
    if (focus) {
      this.setPoint(focus.lat, focus.lon);
      hooks.consumeFocus();
    }
  },

  renderTop(S) {
    const top = this.top;
    top.replaceChildren();
    const depthOn = this.map && this.map.hasLayer(this.depthLayer);
    top.appendChild(h('button', {
      class: 'chip' + (depthOn ? ' on' : ''), type: 'button',
      onclick: () => {
        if (!this.map) return;
        if (this.map.hasLayer(this.depthLayer)) this.map.removeLayer(this.depthLayer); else this.depthLayer.addTo(this.map);
        this.renderTop(S);
      }
    }, tr('Глубины', 'Depths', 'Dubine')));
    top.appendChild(h('button', { class: 'chip', type: 'button', onclick: () => this.locate(S) }, tr('📍 Я здесь', '📍 Me', '📍 Ja')));
    if (S.pick) {
      top.appendChild(h('div', { class: 'hint' },
        tr('Нажмите на карту: ', 'Tap the map: ', 'Dodirnite kartu: ') + S.pick.label,
        h('button', { class: 'chip', type: 'button', onclick: () => this.hooks.cancelPick() }, tr('Отмена', 'Cancel', 'Otkaži'))));
    }
  },

  showHint() { /* подсказка уже в верхней панели */ },

  locate(S) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      this.map.setView([pos.coords.latitude, pos.coords.longitude], 15);
      this.setPoint(pos.coords.latitude, pos.coords.longitude);
      this.onTap(pos.coords.latitude, pos.coords.longitude, S);
    }, () => {
      this.sheet.classList.remove('hidden');
      this.sheet.replaceChildren(h('p', null, tr('Не удалось получить позицию. Разрешите геолокацию в настройках телефона.',
        'Could not get your position. Allow location access in the phone settings.',
        'Nije moguće dobiti poziciju. Dozvolite lokaciju u postavkama telefona.')));
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 });
  },

  setPoint(lat, lon) {
    const L = window.L;
    if (!this.map) return;
    this.point = { lat, lon };
    if (this.pointMarker) this.map.removeLayer(this.pointMarker);
    this.pointMarker = L.circleMarker([lat, lon], { radius: 9, color: '#fff', weight: 3, fillColor: '#e53935', fillOpacity: 0.9 }).addTo(this.map);
  },

  refreshMarkers(S) {
    if (!this.map || !this.overlay) return;
    const L = window.L;
    this.overlay.clearLayers();
    const dot = (lat, lon, color, label, r) => {
      const m = L.circleMarker([lat, lon], { radius: r || 6, color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.95 });
      if (label) m.bindTooltip(label);
      m.on('click', ev => { L.DomEvent.stopPropagation(ev); this.onTap(lat, lon, S); });
      m.addTo(this.overlay);
    };
    regionSpots(S.region).forEach(s => dot(s.lat, s.lon, s === S.selected || (s.lat === S.selected.lat && s.lon === S.selected.lon) ? '#FFC107' : '#1E88E5', spotLabel(s.name), 7));
    S.mySpots.forEach(s => dot(s.lat, s.lon, '#FB8C00', s.name, 7));
    Diary.load().forEach(e => {
      if (!isNaN_(e.lat)) dot(e.lat, e.lon, '#43A047', entryTitle(e) + ' · ' + fmtTime(e.time), 6);
    });
    if (S.selected && S.selected.name !== undefined && !regionSpots(S.region).some(s => s.lat === S.selected.lat && s.lon === S.selected.lon) &&
      !S.mySpots.some(s => s.lat === S.selected.lat && s.lon === S.selected.lon)) {
      dot(S.selected.lat, S.selected.lon, '#FFC107', spotLabel(S.selected.name), 7);
    }
  },

  async onTap(lat, lon, S) {
    this.setPoint(lat, lon);
    const sheet = this.sheet;
    sheet.classList.remove('hidden');
    const depthLine = h('p', { class: 'small' }, tr('Глубина: загрузка…', 'Depth: loading…', 'Dubina: učitavanje…'));
    const nameInput = h('input', { class: 'field', type: 'text', placeholder: tr('Название места', 'Spot name', 'Naziv mjesta'), maxlength: 40 });
    const pick = S.pick;
    const row = h('div', { class: 'row wrap' });
    const point = { lat, lon };
    if (pick) {
      row.appendChild(btn(tr('Выбрать эту точку', 'Use this point', 'Izaberi ovu tačku'), () => this.hooks.picked(point), { primary: true }));
    } else {
      row.appendChild(btn(tr('Смотреть прогноз здесь', 'Forecast for this point', 'Prognoza za ovu tačku'),
        () => this.hooks.useSpot({ name: 'Точка на карте', lat, lon }), { primary: true }));
    }
    sheet.replaceChildren(
      h('div', { class: 'small' }, `${lat.toFixed(5)}, ${lon.toFixed(5)}`),
      depthLine, row,
      pick ? null : h('div', { class: 'row' }, nameInput,
        btn(tr('Сохранить', 'Save', 'Sačuvaj'), () => {
          const name = nameInput.value.trim();
          if (!name) { nameInput.focus(); return; }
          this.hooks.saveSpot({ name, lat, lon });
          nameInput.value = '';
        })),
      h('button', { class: 'close', type: 'button', onclick: () => sheet.classList.add('hidden'), 'aria-label': 'close' }, '×'));
    const d = await fetchDepth(lat, lon);
    if (!this.point || this.point.lat !== lat) return;
    let text;
    if (!d) text = tr('Глубина: нет данных (сервис недоступен).', 'Depth: no data (service unavailable).', 'Dubina: nema podataka (servis nije dostupan).');
    else if (d.avg <= -1) text = trv('Глубина ≈ {0} м', 'Depth ≈ {0} m', 'Dubina ≈ {0} m', [f0(-d.avg)]);
    else if (!Number.isNaN(d.nearDepth)) {
      text = trv('Берег. Рядом глубина до {0} м. Сетка EMODnet (~100 м) у кромки воды неточна.', 'Shoreline. Nearby depth reaches {0} m. The EMODnet grid (~100 m) is imprecise at the water\'s edge.', 'Obala. U blizini dubina doseže {0} m. EMODnet mreža (~100 m) je neprecizna uz samu obalu.', [f0(d.nearDepth)]);
    } else text = tr('Суша.', 'Land.', 'Kopno.');
    depthLine.textContent = text;
  },

  ready(S) { if (this.alive()) { this.refreshMarkers(S); this.renderTop(S); } }
};
