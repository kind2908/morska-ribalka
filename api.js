// Загрузка данных: Open-Meteo (погода и море). Всё как в Android-приложении.

async function getJson(url, timeoutMs = 15000) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

const nv = (arr, i) => {
  if (!arr) return NaN;
  const v = arr[i];
  return v == null ? NaN : v;
};
const nn = v => (v == null ? NaN : v);

function seriesOf(h, name, start, count) {
  const arr = h ? h[name] : null;
  return Array.from({ length: count }, (_, i) => nv(arr, start + i));
}

// ---------- «Сейчас» ----------
async function loadSeaData(spot) {
  const marineRoot = await getJson(
    `https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lon}` +
    `&current=wave_height,sea_surface_temperature,ocean_current_velocity,ocean_current_direction` +
    `&hourly=sea_level_height_msl&forecast_days=2&timezone=${TZ}`);
  const marine = marineRoot.current;
  if (!marine) throw new Error('no marine data');

  const weatherRoot = await getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}` +
    `&current=wind_speed_10m,wind_gusts_10m,cloud_cover,pressure_msl,precipitation` +
    `&hourly=pressure_msl&daily=precipitation_sum,sunrise,sunset` +
    `&past_days=2&forecast_days=1&wind_speed_unit=ms&timezone=${TZ}`);
  const weather = weatherRoot.current;
  if (!weather) throw new Error('no weather data');

  let rain = 0, sunrise = '—', sunset = '—';
  const daily = weatherRoot.daily;
  if (daily) {
    (daily.precipitation_sum || []).forEach(v => { rain += v == null ? 0 : v; });
    const sr = daily.sunrise, ss = daily.sunset;
    if (sr && sr.length) sunrise = sr[sr.length - 1].substring(11, 16);
    if (ss && ss.length) sunset = ss[ss.length - 1].substring(11, 16);
  }

  let pTrend = NaN;
  const wh = weatherRoot.hourly;
  if (wh) {
    const key = weather.time.substring(0, 13);
    const wi = wh.time.findIndex(t => t.startsWith(key));
    if (wi >= 3) {
      const nowP = nv(wh.pressure_msl, wi), beforeP = nv(wh.pressure_msl, wi - 3);
      if (!Number.isNaN(nowP) && !Number.isNaN(beforeP)) pTrend = nowP - beforeP;
    }
  }

  let seaLevel = NaN, rising = null, high = '—', low = '—';
  const hourly = marineRoot.hourly;
  if (hourly) {
    const times = hourly.time, levels = hourly.sea_level_height_msl;
    const nowKey = marine.time.substring(0, 13);
    const idx = times.findIndex(t => t.startsWith(nowKey));
    if (idx >= 0 && idx + 1 < levels.length) {
      seaLevel = nv(levels, idx);
      const next = nv(levels, idx + 1);
      if (!Number.isNaN(seaLevel) && !Number.isNaN(next)) rising = next > seaLevel;
      const end = Math.min(idx + 24, levels.length - 2);
      for (let i = idx + 1; i <= end; i++) {
        const p = nv(levels, i - 1), c = nv(levels, i), n = nv(levels, i + 1);
        if (Number.isNaN(p) || Number.isNaN(c) || Number.isNaN(n)) continue;
        if (high === '—' && c > p && c >= n) high = times[i].substring(11, 16);
        if (low === '—' && c < p && c <= n) low = times[i].substring(11, 16);
      }
    }
  }

  return {
    waveHeight: nn(marine.wave_height),
    waterTemp: nn(marine.sea_surface_temperature),
    wind: nn(weather.wind_speed_10m),
    gust: nn(weather.wind_gusts_10m),
    cloud: nn(weather.cloud_cover),
    pressure: nn(weather.pressure_msl),
    pressureTrend: pTrend,
    currentSpeed: nn(marine.ocean_current_velocity),
    currentDir: nn(marine.ocean_current_direction),
    seaLevel, tideRising: rising, nextHigh: high, nextLow: low,
    rain3d: rain,
    rainNow: weather.precipitation == null ? 0 : weather.precipitation,
    sunrise, sunset
  };
}

// ---------- По часам на сегодня ----------
async function loadHourly(spot) {
  const root = await getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}` +
    `&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,precipitation,pressure_msl` +
    `&past_days=1&forecast_days=1&wind_speed_unit=ms&timezone=${TZ}`);
  const h = root.hourly;
  const today = nowLocal().date;
  let start = h.time.findIndex(t => t.startsWith(today));
  if (start < 0) start = 0;

  let mh = null, mStart = 0;
  try {
    const m = await getJson(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lon}` +
      `&hourly=wave_height,sea_surface_temperature&past_days=1&forecast_days=1&timezone=${TZ}`);
    mh = m.hourly;
    mStart = Math.max(0, mh.time.findIndex(t => t.startsWith(today)));
  } catch (e) { mh = null; }

  return {
    date: today,
    wind: seriesOf(h, 'wind_speed_10m', start, 24),
    gust: seriesOf(h, 'wind_gusts_10m', start, 24),
    windDir: seriesOf(h, 'wind_direction_10m', start, 24),
    cloud: seriesOf(h, 'cloud_cover', start, 24),
    rain: seriesOf(h, 'precipitation', start, 24),
    wave: seriesOf(mh, 'wave_height', mStart, 24),
    waterTemp: seriesOf(mh, 'sea_surface_temperature', mStart, 24),
    pressure: seriesOf(h, 'pressure_msl', Math.max(start - 3, 0), 27)
  };
}

// ---------- Дни ----------
function dayMean(arr, dayIndex, fromH = 0, toH = 23) {
  if (!arr) return NaN;
  let sum = 0, n = 0;
  for (let h = fromH; h <= toH; h++) {
    const v = nv(arr, dayIndex * 24 + h);
    if (!Number.isNaN(v)) { sum += v; n++; }
  }
  return n === 0 ? NaN : sum / n;
}

function rainWindowsFor(hourly, dayIndex, fromHour) {
  const result = [];
  if (!hourly) return result;
  let start = -1, last = -1, sum = 0, peak = 0;
  const close = () => {
    if (start >= 0 && sum >= 0.5 && last + 1 > fromHour) result.push({ fromHour: start, toHour: last + 1, mm: sum, peakMmH: peak });
    start = -1; last = -1; sum = 0; peak = 0;
  };
  for (let h = 0; h <= 23; h++) {
    const raw = hourly[dayIndex * 24 + h];
    const v = raw == null ? 0 : raw;
    if (v >= 0.2) {
      if (start < 0) start = h;
      last = h; sum += v; peak = Math.max(peak, v);
    } else if (start >= 0 && h - last > 1) close();
  }
  close();
  return result;
}

async function loadDays(spot) {
  const base = `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}`;
  const tail = `&past_days=1&forecast_days=5&wind_speed_unit=ms&timezone=${TZ}`;
  const full = base +
    `&daily=wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,pressure_msl_mean,precipitation_sum,precipitation_probability_max,weather_code` +
    `&hourly=precipitation,cloud_cover` + tail;
  const simple = base +
    `&daily=wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,pressure_msl_mean,precipitation_sum` + tail;
  let root;
  try { root = await getJson(full); } catch (e) { root = await getJson(simple); }

  const weather = root.daily;
  const hourlyObj = root.hourly;
  const hourly = hourlyObj ? hourlyObj.precipitation : null;
  const cloudArr = hourlyObj ? hourlyObj.cloud_cover : null;
  const probs = weather.precipitation_probability_max;
  const codes = weather.weather_code;

  let marine = null;
  try {
    marine = await getJson(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lon}` +
      `&daily=wave_height_max&hourly=sea_surface_temperature&past_days=1&forecast_days=5&timezone=${TZ}`);
  } catch (e) { marine = null; }
  const waves = marine && marine.daily ? marine.daily.wave_height_max : null;
  const sst = marine && marine.hourly ? marine.hourly.sea_surface_temperature : null;

  const now = nowLocal();
  const result = [];
  for (let i = 1; i < weather.time.length; i++) {
    const date = weather.time[i];
    const p = nv(weather.pressure_msl_mean, i), prev = nv(weather.pressure_msl_mean, i - 1);
    let peak = 0;
    if (hourly) for (let h = 0; h <= 23; h++) peak = Math.max(peak, nv(hourly, i * 24 + h) || 0);
    const code = codes && codes[i] != null ? codes[i] : 0;
    const tNow = dayMean(sst, i), tPrev = dayMean(sst, i - 1);
    result.push({
      date,
      windMax: nv(weather.wind_speed_10m_max, i),
      gustMax: nv(weather.wind_gusts_10m_max, i),
      windDir: nv(weather.wind_direction_10m_dominant, i),
      waveMax: nv(waves, i),
      pressureMean: p,
      pressureChange: (Number.isNaN(p) || Number.isNaN(prev)) ? NaN : p - prev,
      rain: weather.precipitation_sum[i] == null ? 0 : weather.precipitation_sum[i],
      rainProbMax: probs && probs[i] != null ? probs[i] : -1,
      thunder: code >= 95 && code <= 99,
      rainPeakMmH: peak,
      rainWindows: rainWindowsFor(hourly, i, date === now.date ? now.hour : 0),
      waterTemp: tNow,
      tempChange: (Number.isNaN(tNow) || Number.isNaN(tPrev)) ? NaN : tNow - tPrev,
      cloud: dayMean(cloudArr, i, 6, 20)
    });
  }
  return result;
}

function daysBetween(a, b) {
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
}

function dayExplain(day, fish, boat) {
  const ahead = daysBetween(nowLocal().date, day.date);
  return biteModel({
    fish, boat, date: day.date, waterTemp: day.waterTemp, tempChange: day.tempChange,
    pressureHpa: day.pressureMean, trend3h: day.pressureChange / 6.0,
    windMs: day.windMax * 0.75, gustMs: day.gustMax, waveM: day.waveMax * 0.8,
    cloudPct: day.cloud, rainMm: day.rain, thunder: day.thunder, moonDays: moonAge(ahead)
  });
}
const dayBite = (day, fish, boat) => dayExplain(day, fish, boat).score;

function rainLevelText(day) {
  if (day.rainPeakMmH >= 7.6 || day.rain >= 30) return tr('сильный дождь, возможны ливни', 'heavy rain, downpours possible', 'jaka kiša, mogući pljuskovi');
  if (day.rain >= 10 || day.rainPeakMmH >= 2.5) return tr('дождь', 'rain', 'kiša');
  if (day.rain >= 1.0) return tr('небольшой дождь', 'light rain', 'slaba kiša');
  return null;
}
const pad2 = n => String(n).padStart(2, '0');
function rainWindowText(w) {
  return `${pad2(w.fromHour)}:00–${pad2(w.toHour % 24)}:00 · ≈ ${f0(w.mm)} ${U.mm()} (${tr('до', 'up to', 'do')} ${f1(w.peakMmH)} ${U.mm()}/${tr('ч', 'h', 'h')})`;
}
function rainShortText(day) {
  const parts = [];
  const level = rainLevelText(day);
  if (level) {
    const windows = day.rainWindows.map(w => `${pad2(w.fromHour)}:00–${pad2(w.toHour % 24)}:00`).join('; ');
    parts.push(`☔ ${level}` + (windows ? `: ${windows}` : '') + ` (≈ ${f0(day.rain)} ${U.mm()})`);
  }
  if (day.thunder) parts.push(tr('⛈ гроза', '⛈ thunderstorm', '⛈ grmljavina'));
  return parts.length ? parts.join(' · ') : null;
}

// ---------- Температура воздуха ----------
async function loadAir(spot) {
  const root = await getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}` +
    `&current=temperature_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=${TZ}`);
  const cur = root.current || {};
  const days = [];
  if (root.daily) {
    root.daily.time.forEach((t, i) => days.push({ date: t, min: nv(root.daily.temperature_2m_min, i), max: nv(root.daily.temperature_2m_max, i) }));
  }
  return { now: { temp: nn(cur.temperature_2m), feels: nn(cur.apparent_temperature) }, days };
}

// ---------- Глубина (EMODnet) ----------
async function fetchDepth(lat, lon) {
  const one = async (la, lo) => {
    try {
      const r = await getJson(`https://rest.emodnet-bathymetry.eu/depth_sample?geom=POINT(${lo.toFixed(5)}%20${la.toFixed(5)})`, 8000);
      return typeof r.avg === 'number' ? r.avg : null;
    } catch (e) { return null; }
  };
  const dLat = 120 / 111320, dLon = 120 / (111320 * Math.cos(lat * Math.PI / 180));
  const [c, a, b, d, e] = await Promise.all([
    one(lat, lon), one(lat + dLat, lon), one(lat - dLat, lon), one(lat, lon + dLon), one(lat, lon - dLon)
  ]);
  if (c === null) return null;
  let near = NaN;
  [a, b, d, e].forEach(v => { if (v !== null && v <= -1 && (Number.isNaN(near) || -v > near)) near = -v; });
  return { avg: c, nearDepth: near };
}


// ---------- Метеостанция: ближайший аэропорт (METAR, aviationweather.gov) ----------
async function loadStation(spot) {
  const st = nearestStation(spot.lat, spot.lon);
  if (!st) return null;
  const r = await getJson(`https://aviationweather.gov/api/data/metar?ids=${st.icao}&format=json&hours=3`, 9000);
  const m = Array.isArray(r) && r.length ? r[0] : null;
  if (!m) return null;
  const KT = 0.514444;
  const num = v => (typeof v === 'number' && !Number.isNaN(v) ? v : NaN);
  const t = typeof m.obsTime === 'number' ? new Date(m.obsTime * 1000) : (m.reportTime ? new Date(m.reportTime) : null);
  const ageMin = t ? (Date.now() - t.getTime()) / 60000 : 0;
  if (ageMin > 360) return null; // старше 6 часов не показываем
  const vis = typeof m.visib === 'number' ? m.visib * 1.609 : (m.visib === '10+' ? 10 : NaN);
  return {
    icao: st.icao, name: st.name, km: Math.round(st.km),
    time: t ? hmStr(t.getHours() * 60 + t.getMinutes()) : '', // время в часовом поясе устройства
    temp: num(m.temp), windDir: num(m.wdir), wind: num(m.wspd) * KT, gust: num(m.wgst) * KT,
    pressure: num(m.altim), vis
  };
}

// ---------- Привязка пресетов к воде (EMODnet): точку на суше сдвигаем в ближайшее море ----------
async function snapToWater(lat, lon) {
  const probe = async (la, lo) => {
    try {
      const r = await getJson(`https://rest.emodnet-bathymetry.eu/depth_sample?geom=POINT(${lo.toFixed(5)}%20${la.toFixed(5)})`, 7000);
      return { ok: true, v: typeof r.avg === 'number' ? r.avg : null };
    } catch (e) { return { ok: false, v: null }; }
  };
  const water = p => p.ok && p.v !== null && p.v <= -3;
  const p0 = await probe(lat, lon);
  if (!p0.ok) return null;          // сервис не ответил: оставляем как есть
  if (water(p0)) return { lat, lon };
  const kmLat = 1 / 111.32, kmLon = 1 / (111.32 * Math.cos(lat * Math.PI / 180));
  for (const r of [0.7, 1.4, 2.2, 3.2, 4.6, 6.5, 9, 12]) {
    const cands = [];
    for (let k = 0; k < 8; k++) {
      const ang = k * Math.PI / 4;
      cands.push([lat + Math.sin(ang) * r * kmLat, lon + Math.cos(ang) * r * kmLon]);
    }
    const res = await Promise.all(cands.map(c => probe(c[0], c[1])));
    let best = -1, bestD = 0;
    res.forEach((p, i) => { if (water(p) && -p.v > bestD) { bestD = -p.v; best = i; } });
    if (best >= 0) return { lat: +cands[best][0].toFixed(5), lon: +cands[best][1].toFixed(5) };
  }
  return null;
}
