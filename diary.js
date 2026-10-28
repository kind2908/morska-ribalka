// Дневник уловов. Записи лежат в localStorage, фото в IndexedDB (маленькие, до 1280 px).
const Diary = {
  load() {
    const list = Store.get('diary', []);
    return Array.isArray(list) ? list : [];
  },
  save(list) { Store.set('diary', list); },
  add(entry) { const l = this.load(); l.unshift(entry); this.save(l); },
  update(id, patch) {
    const l = this.load();
    const i = l.findIndex(e => e.id === id);
    if (i >= 0) { l[i] = Object.assign({}, l[i], patch); this.save(l); }
  },
  remove(id) {
    this.save(this.load().filter(e => e.id !== id));
    Photos.del(id);
  }
};

// ---------- Фото в IndexedDB ----------
const Photos = {
  _db: null,
  open() {
    if (this._db) return this._db;
    this._db = new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open('fishing-photos', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('photos');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
    return this._db;
  },
  async put(id, blob) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put(blob, id);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  },
  async get(id) {
    try {
      const db = await this.open();
      return await new Promise((res, rej) => {
        const r = db.transaction('photos').objectStore('photos').get(id);
        r.onsuccess = () => res(r.result || null);
        r.onerror = () => rej(r.error);
      });
    } catch (e) { return null; }
  },
  async del(id) {
    try {
      const db = await this.open();
      db.transaction('photos', 'readwrite').objectStore('photos').delete(id);
    } catch (e) { /* ничего */ }
  },
  // уменьшает фото до 1280 px по длинной стороне (EXIF и место съёмки не сохраняются)
  async shrink(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
    let w, hgt, source;
    if (bmp) { w = bmp.width; hgt = bmp.height; source = bmp; }
    else {
      source = await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = URL.createObjectURL(file);
      });
      w = source.naturalWidth; hgt = source.naturalHeight;
    }
    const k = Math.min(1, 1280 / Math.max(w, hgt));
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * k); cv.height = Math.round(hgt * k);
    cv.getContext('2d').drawImage(source, 0, 0, cv.width, cv.height);
    return await new Promise(res => cv.toBlob(b => res(b), 'image/jpeg', 0.82));
  }
};

const blobToDataUrl = blob => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(blob);
});
const dataUrlToBlob = url => fetch(url).then(r => r.blob());

// ---------- Резервная копия ----------
async function buildBackup() {
  const entries = Diary.load();
  const photos = {};
  for (const e of entries) {
    if (e.photo) {
      const b = await Photos.get(e.id);
      if (b) photos[e.id] = await blobToDataUrl(b);
    }
  }
  return new Blob([JSON.stringify({ app: 'sea-fishing-web', version: 1, entries, photos, mySpots: Store.get('my_spots', []) })], { type: 'application/json' });
}

async function restoreBackup(file) {
  const data = JSON.parse(await file.text());
  if (!data || !Array.isArray(data.entries)) throw new Error('bad file');
  const current = Diary.load();
  const have = new Set(current.map(e => e.id));
  let added = 0;
  for (const e of data.entries) {
    if (have.has(e.id)) continue;
    current.push(e); added++;
    if (e.photo && data.photos && data.photos[e.id]) await Photos.put(e.id, await dataUrlToBlob(data.photos[e.id]));
  }
  current.sort((a, b) => (a.time < b.time ? 1 : -1));
  Diary.save(current);
  if (Array.isArray(data.mySpots)) {
    const mine = Store.get('my_spots', []);
    data.mySpots.forEach(s => { if (!mine.some(m => m.lat === s.lat && m.lon === s.lon && m.name === s.name)) mine.push(s); });
    Store.set('my_spots', mine);
  }
  return added;
}

// ---------- Статистика и экспорт ----------
function avgOf(values) {
  const v = values.filter(x => !isNaN_(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
}

function diaryStats(list) {
  if (!list.length) return [tr('Пока нет записей.', 'No entries yet.', 'Još nema zapisa.')];
  const good = list.filter(e => e.count > 0), bad = list.filter(e => e.count === 0);
  const lines = [];
  lines.push(tr(`Выходов: ${list.length}, с уловом: ${good.length}, без улова: ${bad.length}`,
    `Trips: ${list.length}, with catch: ${good.length}, without catch: ${bad.length}`,
    `Izlazaka: ${list.length}, sa ulovom: ${good.length}, bez ulova: ${bad.length}`));
  const totalCount = good.reduce((s, e) => s + e.count, 0);
  const totalWeight = f1(good.filter(e => !isNaN_(e.weightKg)).reduce((s, e) => s + e.weightKg, 0));
  lines.push(tr(`Всего рыбы: ${totalCount} шт., вес по записям: ${totalWeight} кг`,
    `Total fish: ${totalCount} pcs, weight in entries: ${totalWeight} kg`,
    `Ukupno ribe: ${totalCount} kom, težina u zapisima: ${totalWeight} kg`));
  const by = {};
  good.forEach(e => { by[e.fish] = (by[e.fish] || 0) + e.count; });
  const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    const name = fishLabel(top[0]);
    lines.push(tr(`Чаще всего ловится: ${name} (${top[1]} шт.)`, `Most often caught: ${name} (${top[1]} pcs)`, `Najčešće se lovi: ${name} (${top[1]} kom)`));
  }
  if (good.length >= 3 && bad.length >= 3) {
    lines.push(tr('Средние условия (удачные выходы / без улова):', 'Average conditions (successful trips / no catch):', 'Prosječni uslovi (uspješni izlasci / bez ulova):'));
    const fG = avgOf(good.filter(e => e.forecast >= 0).map(e => e.forecast));
    const fB = avgOf(bad.filter(e => e.forecast >= 0).map(e => e.forecast));
    const fm = v => (isNaN_(v) ? noData() : f1(v));
    lines.push('• ' + tr('Прогноз клёва', 'Bite forecast', 'Prognoza ulova') + `: ${fm(fG)} / ${fm(fB)}`);
    const row = (label, key, unit) => '• ' + label + `: ${fmt(avgOf(good.map(e => e[key])), unit)} / ${fmt(avgOf(bad.map(e => e[key])), unit)}`;
    lines.push(row(tr('Ветер', 'Wind', 'Vjetar'), 'wind', U.ms));
    lines.push(row(tr('Волна', 'Waves', 'Talasi'), 'wave', U.m()));
    lines.push(row(tr('Давление', 'Pressure', 'Pritisak'), 'pressure', U.hpa()));
    lines.push(row(tr('Температура воды', 'Water temperature', 'Temperatura vode'), 'waterTemp', '°C'));
    lines.push(tr('Это просто средние по твоим записям, чем их больше, тем они полезнее.',
      'These are just averages of your entries; the more entries, the more useful they are.',
      'Ovo su samo prosjeci iz tvojih zapisa; što ih je više, to su korisniji.'));
  } else {
    lines.push(tr('Для сравнения условий нужно минимум 3 выхода с уловом и 3 без улова.',
      'To compare conditions you need at least 3 trips with a catch and 3 without.',
      'Za poređenje uslova potrebna su najmanje 3 izlaska sa ulovom i 3 bez ulova.'));
  }
  return lines;
}

function entryTitle(e) {
  return e.count === 0 ? tr('Выход без улова', 'Trip with no catch', 'Izlazak bez ulova')
    : `${fishLabel(e.fish)} × ${e.count}` + (!isNaN_(e.weightKg) ? ` · ${f1(e.weightKg)} ${tr('кг', 'kg', 'kg')}` : '');
}
function fmtTime(iso) {
  try {
    const loc = { ru: 'ru-RU', en: 'en-GB', sr: 'sr-Latn-ME' }[Lang.current];
    return new Date(iso).toLocaleString(loc, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return iso; }
}

function diaryText(list) {
  let out = tr('Дневник уловов', 'Catch diary', 'Dnevnik ulova') + '\n\n';
  list.forEach(e => {
    out += `${fmtTime(e.time)} · ${e.spot ? spotLabel(e.spot) + ' · ' : ''}${e.boat ? tr('лодка', 'boat', 'čamac') : tr('берег', 'shore', 'obala')}\n${entryTitle(e)}\n`;
    if (!isNaN_(e.lat)) out += `${tr('Точка', 'Point', 'Tačka')}: ${e.lat.toFixed(5)}, ${e.lon.toFixed(5)}\n`;
    if (e.note) out += `${tr('Комментарий', 'Comment', 'Komentar')}: ${e.note}\n`;
    out += '\n';
  });
  return out;
}

function diaryCsv(list) {
  const esc = v => '"' + String(v == null || Number.isNaN(v) ? '' : v).replace(/"/g, '""') + '"';
  const head = ['time', 'spot', 'mode', 'fish', 'count', 'weight_kg', 'forecast', 'wind_ms', 'wave_m', 'pressure_hpa', 'trend_3h', 'water_c', 'moon_age', 'lat', 'lon', 'note'];
  const rows = list.map(e => [e.time, e.spot, e.boat ? 'boat' : 'shore', e.fish, e.count, e.weightKg, e.forecast, e.wind, e.wave, e.pressure, e.trend, e.waterTemp, e.moon, e.lat, e.lon, e.note].map(esc).join(','));
  return '﻿' + [head.join(',')].concat(rows).join('\n');
}
