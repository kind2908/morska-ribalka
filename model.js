// Расчёты: клёв, видимость, непогода, луна. Это точный перенос формул из Android-приложения.

// ---------- Луна ----------
function moonAge(daysAhead = 0) {
  const newMoonRef = 947182440000;
  const synodic = 29.530588853;
  const days = (Date.now() - newMoonRef) / 86400000 + daysAhead;
  const age = days % synodic;
  return age < 0 ? age + synodic : age;
}

function moonPhaseName(age) {
  if (age < 1.5 || age >= 28.0) return tr('Новолуние', 'New moon', 'Mlad mjesec');
  if (age < 6.4) return tr('Растущий серп', 'Waxing crescent', 'Rastući srp');
  if (age < 8.4) return tr('Первая четверть', 'First quarter', 'Prva četvrt');
  if (age < 13.8) return tr('Растущая луна', 'Waxing gibbous', 'Mjesec raste');
  if (age < 15.8) return tr('Полнолуние', 'Full moon', 'Pun mjesec');
  if (age < 21.1) return tr('Убывающая луна', 'Waning gibbous', 'Mjesec opada');
  if (age < 23.1) return tr('Последняя четверть', 'Last quarter', 'Posljednja četvrt');
  return tr('Убывающий серп', 'Waning crescent', 'Opadajući srp');
}

// ---------- Видимость под водой ----------
function clarityScore(d) {
  let score = 9.0;
  const wave = isNaN_(d.waveHeight) ? 0.5 : d.waveHeight;
  score -= wave > 1.2 ? 4.0 : wave > 0.7 ? 2.5 : wave > 0.3 ? 1.0 : 0.0;
  const wind = isNaN_(d.wind) ? 4.0 : d.wind;
  score -= wind > 9 ? 1.5 : wind > 6 ? 0.5 : 0.0;
  score -= d.rain3d > 30 ? 3.0 : d.rain3d > 10 ? 2.0 : d.rain3d > 2 ? 1.0 : 0.0;
  return Math.min(10, Math.max(1, Math.trunc(score)));
}
const visibilityMeters = score => Math.round(2 + (score - 1) * 2.5);
function clarityLabel(score) {
  if (score >= 8) return tr('очень чистая', 'very clear', 'veoma bistra');
  if (score >= 6) return tr('хорошая', 'good', 'dobra');
  if (score >= 4) return tr('средняя', 'average', 'srednja');
  return tr('мутная', 'murky', 'mutna');
}

function trendLabel(t) {
  if (isNaN_(t)) return noData();
  const word = t < -2.0 ? tr('быстро падает', 'falling fast', 'brzo pada')
    : t < -0.5 ? tr('медленно падает', 'falling slowly', 'sporo pada')
      : t <= 0.5 ? tr('стабильно', 'steady', 'stabilan')
        : t <= 2.0 ? tr('медленно растёт', 'rising slowly', 'sporo raste')
          : tr('быстро растёт', 'rising fast', 'brzo raste');
  return `${word} (${sgn(t, 1)} ${U.hpa()} ${tr('за 3 ч', 'per 3 h', 'za 3 h')})`;
}

// ---------- Модель клёва ----------
function interp(x, pts) {
  if (x <= pts[0][0]) return pts[0][1];
  if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1];
    const [x2, y2] = pts[i];
    if (x <= x2) return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
  }
  return pts[pts.length - 1][1];
}

// Давление: по исследованиям эффект слабый, поэтому вес небольшой
const trendAdjPts = [[-8, 0], [-6, 0.3], [-3.4, 0.9], [-1.5, 0.6], [-0.5, 0.2], [0, 0], [1, -0.25], [3, -0.7], [6, -1.1]];
// Ветер и волна больше про комфорт и безопасность, чем про клёв: рыба клюёт и в ветер, и в волну. Вес мягкий.
const windAdjPts = [[0, -0.2], [2, 0.2], [4, 0.3], [7, 0], [10, -0.5], [13, -1.2], [16, -2.0]];
const waveAdjPts = [[0, 0.2], [0.3, 0.2], [0.6, 0], [1.0, -0.3], [1.5, -0.8], [2.5, -1.8]];
const surfWindAdjPts = [[0, -0.8], [3, -0.2], [6, 0.6], [9, 1.0], [11, 0.6], [13, 0], [16, -1.5]];
const surfWaveAdjPts = [[0, -0.5], [0.3, 0.0], [0.6, 0.5], [1.0, 0.8], [1.5, 0.5], [2.0, -0.3], [3.0, -2.0]];
const cloudAdjPts = [[0, -0.3], [30, 0.0], [60, 0.4], [90, 0.6], [100, 0.6]];
const rainAdjPts = [[0, 0], [2, 0.1], [8, 0.0], [20, -0.8], [40, -2.0], [60, -3.0]];
const tempChangeAdjPts = [[-3, -1.5], [-1.5, -0.8], [-0.5, -0.1], [0, 0], [1, 0.2], [2.5, 0.1], [4, -0.5]];

// date: 'YYYY-MM-DD'
function seasonValue(fish, date) {
  const [y, mo, d] = date.split('-').map(Number);
  const m = mo - 1;
  const len = new Date(y, mo, 0).getDate();
  const pos = (d - 1) / len;
  const cur = fish.season[m];
  if (pos < 0.5) {
    const prev = fish.season[(m + 11) % 12];
    return cur + (prev - cur) * (0.5 - pos);
  }
  const next = fish.season[(m + 1) % 12];
  return cur + (next - cur) * (pos - 0.5);
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// p: { fish, boat, date, waterTemp, tempChange, pressureHpa, trend3h, windMs, gustMs, waveM, cloudPct, rainMm, thunder, moonDays }
function biteModel(p) {
  const seasonF = clamp(seasonValue(p.fish, p.date) / 10.0, 0, 1);
  const tempF = isNaN_(p.waterTemp) ? 0.85 : clamp(interp(p.waterTemp, p.fish.tempPts), 0, 1);
  const presence = Math.sqrt(seasonF * tempF);
  const base = 1.5 + 6.0 * presence;
  const adj = [];

  let pAdj = isNaN_(p.trend3h) ? 0.0 : interp(p.trend3h, trendAdjPts);
  if (!isNaN_(p.pressureHpa)) {
    if (p.pressureHpa > 1025.0 && !isNaN_(p.cloudPct) && p.cloudPct < 30.0) pAdj -= 0.7;
    else if (p.pressureHpa < 1000.0) pAdj -= 0.3;
  }
  adj.push([tr('Давление и тренд', 'Pressure and trend', 'Pritisak i trend'), pAdj]);

  const surf = p.fish.surf && !p.boat;
  const windRaw = isNaN_(p.windMs) ? 4.0 : p.windMs;
  const windEff0 = isNaN_(p.gustMs) ? windRaw : Math.max(windRaw, p.gustMs * 0.55);
  const windEff = p.boat ? windEff0 * 1.15 : windEff0;
  adj.push([tr('Ветер', 'Wind', 'Vjetar'), interp(windEff, surf ? surfWindAdjPts : windAdjPts)]);

  const waveRaw = isNaN_(p.waveM) ? 0.5 : p.waveM;
  const waveEff = p.boat ? waveRaw * 1.2 : waveRaw;
  adj.push([tr('Волна', 'Waves', 'Talasi'), interp(waveEff, surf ? surfWaveAdjPts : waveAdjPts)]);

  adj.push([tr('Облачность', 'Cloud cover', 'Oblačnost'), isNaN_(p.cloudPct) ? 0.0 : interp(p.cloudPct, cloudAdjPts)]);

  let rAdj = isNaN_(p.rainMm) ? 0.0 : interp(p.rainMm, rainAdjPts);
  if (p.thunder) rAdj -= 2.5;
  adj.push([tr('Осадки и гроза', 'Rain and thunderstorm', 'Padavine i grmljavina'), rAdj]);

  adj.push([tr('Изменение температуры воды', 'Water temperature change', 'Promjena temperature vode'),
    isNaN_(p.tempChange) ? 0.0 : interp(p.tempChange, tempChangeAdjPts)]);

  const half = 29.530588853 / 2.0;
  const m = p.moonDays % half;
  const d = Math.min(m, half - m);
  adj.push([tr('Луна', 'Moon', 'Mjesec'), 0.3 - 0.5 * (d / (half / 2.0))]);

  const score = clamp(base + adj.reduce((s, a) => s + a[1], 0), 1.0, 10.0);
  return { score, base, adjustments: adj };
}

function biteExplain(data, fish, boat) {
  const now = nowLocal();
  const r = biteModel({
    fish, boat, date: now.date,
    waterTemp: data.waterTemp, tempChange: NaN,
    pressureHpa: data.pressure, trend3h: data.pressureTrend,
    windMs: data.wind, gustMs: data.gust, waveM: data.waveHeight,
    cloudPct: data.cloud, rainMm: data.rainNow * 3.0, thunder: false, moonDays: moonAge()
  });
  // время суток входит и в оценку «сейчас» (раньше было только в графике по часам)
  const tod = timeOfDayAdj(now.hour, data.sunrise, data.sunset, data.cloud);
  r.adjustments.push([tr('Время суток', 'Time of day', 'Doba dana'), tod]);
  r.score = clamp(r.score + tod, 1.0, 10.0);
  return r;
}

// ---------- Условия для рыбака (комфорт и безопасность, это не клёв) ----------
// Отдельная шкала 1–10: 10 всё спокойно. Клёв от неё не зависит: рыба клюёт и в дождь, но стоять под ливнем и порывами тяжело.
const comfWindPts = [[0, 0], [6, 0], [8, -0.6], [10, -1.5], [13, -3.0], [16, -5.0], [20, -7.0]];
const comfWavePts = [[0, 0], [0.6, 0], [1.0, -0.8], [1.5, -2.0], [2.0, -3.0], [3.0, -5.0], [4.0, -7.0]];
const comfRainDayPts = [[0, 0], [2, -0.3], [5, -1.0], [10, -2.0], [20, -3.5], [40, -5.0], [60, -6.0]];
const comfRainPeakPts = [[0, 0], [1, -0.2], [2.5, -0.8], [4, -1.8], [7.6, -3.5], [10, -5.0]];
const comfTempPts = [[-5, -4.0], [0, -3.0], [5, -1.5], [10, -0.5], [14, 0], [31, 0], [35, -1.0], [39, -2.5]];

// p: { windMs, gustMs, waveM, rainMm, rainPeakMmH, thunder, snow, feelsC, boat }
function comfortModel(p) {
  const items = [];
  let cap = 10;
  const w = isNaN_(p.windMs) ? 0 : p.windMs, g = isNaN_(p.gustMs) ? 0 : p.gustMs;
  const wp = interp(Math.max(w, g * 0.7) * (p.boat ? 1.2 : 1), comfWindPts);
  if (wp < -0.05) items.push([tr('Ветер', 'Wind', 'Vjetar'), trv('{0} км/ч, порывы {1}', '{0} km/h, gusts {1}', '{0} km/h, udari {1}', [f0(w * 3.6), f0(g * 3.6)]), wp]);
  const wave = isNaN_(p.waveM) ? 0 : p.waveM;
  const vp = interp(wave * (p.boat ? 1.4 : 1), comfWavePts);
  if (vp < -0.05) items.push([tr('Волна', 'Waves', 'Talasi'), `${f1(wave)} ${U.m()}`, vp]);
  const rain = isNaN_(p.rainMm) ? 0 : p.rainMm, peak = isNaN_(p.rainPeakMmH) ? 0 : p.rainPeakMmH;
  const rp = Math.min(interp(rain, comfRainDayPts), interp(peak, comfRainPeakPts));
  if (rp < -0.05) items.push([tr('Дождь', 'Rain', 'Kiša'), trv('{0} мм за день', '{0} mm per day', '{0} mm za dan', [f0(rain)]), rp]);
  if (p.thunder) { items.push([tr('Гроза', 'Thunderstorm', 'Grmljavina'), tr('возможна', 'possible', 'moguća'), -6.0]); cap = Math.min(cap, 3.0); }
  if (p.snow) { items.push([tr('Снег', 'Snow', 'Snijeg'), tr('возможен', 'possible', 'moguć'), -4.0]); cap = Math.min(cap, 4.5); }
  if (!isNaN_(p.feelsC)) {
    const tp = interp(p.feelsC, comfTempPts);
    if (tp < -0.05) items.push([p.feelsC < 14 ? tr('Холод', 'Cold', 'Hladnoća') : tr('Жара', 'Heat', 'Vrućina'),
      trv('ощущается {0} °C', 'feels like {0} °C', 'osjeća se {0} °C', [f0(p.feelsC)]), tp]);
  }
  const score = Math.min(cap, clamp(10 + items.reduce((s, i) => s + i[2], 0), 1.0, 10.0));
  items.sort((a, b) => a[2] - b[2]);
  return { score, items };
}

// 0 зелёный, 1 жёлтый, 2 оранжевый, 3 красный
function comfortLevel(score) { return score >= 8 ? 0 : score >= 6 ? 1 : score >= 4 ? 2 : 3; }
const COMFORT_COLORS = ['#2E9E5B', '#E0B000', '#F0841C', '#D9534F'];
function comfortWord(level) {
  return [tr('Комфортно', 'Comfortable', 'Udobno'), tr('Терпимо', 'Tolerable', 'Podnošljivo'),
    tr('Неприятно', 'Unpleasant', 'Neugodno'), tr('Опасно', 'Dangerous', 'Opasno')][level];
}

// Условия «сейчас и сегодня»: берём худшее из текущих значений и суточных максимумов
function comfortNow(d, today, air, boat) {
  const nz = v => (isNaN_(v) ? 0 : v);
  return comfortModel({
    windMs: Math.max(nz(d.wind), today ? nz(today.windMax) * 0.75 : 0),
    gustMs: Math.max(nz(d.gust), today ? nz(today.gustMax) : 0),
    waveM: Math.max(nz(d.waveHeight), today ? nz(today.waveMax) * 0.8 : 0),
    rainMm: today ? today.rain : NaN, rainPeakMmH: today ? today.rainPeakMmH : nz(d.rainNow),
    thunder: !!(today && today.thunder), snow: !!(today && today.snow),
    feelsC: air && air.now ? air.now.feels : NaN, boat
  });
}

// Короткий список «из чего складывается» для карточки клёва: основа и главные поправки
function biteTop(res) {
  const out = [[tr('Сезон и вода', 'Season and water', 'Sezona i voda'), f1(res.base), 0]];
  res.adjustments.filter(a => Math.abs(a[1]) >= 0.2).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4)
    .forEach(a => out.push([a[0], sgn(a[1], 1), a[1]]));
  return out;
}

// ---------- Предупреждение о непогоде ----------
// Возвращает null или [уровень (1 осторожно, 2 опасно), текст]
function safetyWarning(windMax, gustMax, waveMax, rainMm, rainPeakMmH, thunder, boat) {
  const wind = isNaN_(windMax) ? 0 : windMax;
  const gust = isNaN_(gustMax) ? 0 : gustMax;
  const wave = isNaN_(waveMax) ? 0 : waveMax;
  const rain = isNaN_(rainMm) ? 0 : rainMm;
  const peak = isNaN_(rainPeakMmH) ? 0 : rainPeakMmH;

  const windDanger = boat ? (wind >= 10.0 || gust >= 15.0) : gust >= 17.0;
  const windCaution = boat ? (wind >= 7.0 || gust >= 11.0) : (wind >= 8.0 || gust >= 11.0);
  const waveDanger = boat ? wave >= 1.5 : wave >= 2.0;
  const waveCaution = boat ? wave >= 1.0 : wave >= 1.2;
  const rainDanger = peak >= 10.0 || rain >= 40.0;
  const rainCaution = peak >= 4.0 || rain >= 10.0;

  const danger = windDanger || waveDanger || rainDanger || thunder;
  const caution = windCaution || waveCaution || rainCaution;
  if (!danger && !caution) return null;

  const reasons = [];
  if (thunder) reasons.push(tr('гроза', 'thunderstorm', 'grmljavina'));
  if (rainDanger) reasons.push(tr('ливень', 'downpour', 'pljusak'));
  else if (rainCaution) reasons.push(tr('сильный дождь', 'heavy rain', 'jaka kiša'));
  if (windDanger || windCaution) {
    reasons.push(boat ? tr('сильный ветер', 'strong wind', 'jak vjetar') : tr('порывистый ветер', 'gusty wind', 'udarni vjetar'));
  }
  if (waveDanger || waveCaution) reasons.push(tr('высокая волна', 'high waves', 'visoki talasi'));

  const w = f0(wind * 3.6), g = f0(gust * 3.6), wv = f1(wave), r = f0(rain), p = f1(peak);
  const details = trv('Максимум за день: ветер {0} км/ч, порывы {1} км/ч, волна {2} м, осадки {3} мм (до {4} мм/ч).', 'Daily maximum: wind {0} km/h, gusts {1} km/h, waves {2} m, rain {3} mm (up to {4} mm/h).', 'Dnevni maksimum: vjetar {0} km/h, udari {1} km/h, talasi {2} m, padavine {3} mm (do {4} mm/h).', [w, g, wv, r, p]);
  const head = danger ? tr('⚠ Опасно: ', '⚠ Dangerous: ', '⚠ Opasno: ') : tr('⚠ Осторожно: ', '⚠ Caution: ', '⚠ Oprez: ');
  return [danger ? 2 : 1, head + reasons.join(', ') + '. ' + details];
}

// ---------- Лучшие часы ----------
function hm(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }
function hmStr(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
}

function bestHours(d) {
  const out = [];
  try {
    if (d.sunrise !== '—') {
      const t = hm(d.sunrise);
      out.push(`${tr('Утренняя заря', 'Dawn', 'Zora')}: ${hmStr(t - 30)} – ${hmStr(t + 90)}`);
    }
    if (d.sunset !== '—') {
      const t = hm(d.sunset);
      out.push(`${tr('Вечерняя заря', 'Dusk', 'Sumrak')}: ${hmStr(t - 90)} – ${hmStr(t + 30)}`);
    }
  } catch (e) { /* пропускаем */ }
  if (d.nextHigh !== '—') {
    out.push(trv('Смена воды (прилив) около {0}', 'Tide change (high tide) around {0}', 'Promjena vode (plima) oko {0}', [d.nextHigh]));
  }
  if (d.nextLow !== '—') {
    out.push(trv('Смена воды (отлив) около {0}', 'Tide change (low tide) around {0}', 'Promjena vode (oseka) oko {0}', [d.nextLow]));
  }
  return out;
}

// ---------- По часам ----------
// Время суток: на зорях (утро и вечер) рыба активнее, в яркий полдень слабее (исследования и рыболовные источники сходятся в этом;
// ночью зависит от вида, поэтому ночь не трогаем). Зоря: от получаса до восхода до полутора часов после, вечером зеркально.
function timeOfDayAdj(hour, sunrise, sunset, cloudPct) {
  const mid = hour + 0.5;
  const sr = sunrise && sunrise !== '—' ? hm(sunrise) / 60 : null;
  const ss = sunset && sunset !== '—' ? hm(sunset) / 60 : null;
  if (sr !== null && mid >= sr - 0.5 && mid <= sr + 1.5) return 1.2;
  if (ss !== null && mid >= ss - 1.5 && mid <= ss + 0.5) return 1.2;
  if (sr !== null && mid >= sr - 1.5 && mid <= sr + 2.5) return 0.5;
  if (ss !== null && mid >= ss - 2.5 && mid <= ss + 1.5) return 0.5;
  if (mid >= 11.0 && mid <= 16.0) {
    const c = isNaN_(cloudPct) ? 0.3 : clamp(cloudPct / 100, 0, 1);
    return -0.8 + 0.4 * c;   // ясный полдень -0.8, сплошная облачность -0.4
  }
  return 0.0;
}

function hourlyScores(raw, fish, boat, sunrise, sunset) {
  const res = [];
  for (let hour = 0; hour < 24; hour++) {
    const pNow = raw.pressure[hour + 3] ?? NaN;
    const pBefore = raw.pressure[hour] ?? NaN;
    const trend = (Number.isNaN(pNow) || Number.isNaN(pBefore)) ? NaN : pNow - pBefore;
    let rain = 0;
    for (let k = -1; k <= 2; k++) {
      const v = raw.rain[hour + k];
      if (v != null && !Number.isNaN(v)) rain += v;
    }
    const r = biteModel({
      fish, boat, date: raw.date, waterTemp: raw.waterTemp[hour], tempChange: NaN,
      pressureHpa: pNow, trend3h: trend, windMs: raw.wind[hour], gustMs: raw.gust[hour],
      waveM: raw.wave[hour], cloudPct: raw.cloud[hour], rainMm: rain, thunder: false, moonDays: moonAge()
    });
    res.push({ hour, score: clamp(r.score + timeOfDayAdj(hour, sunrise, sunset, raw.cloud[hour]), 1.0, 10.0) });
  }
  return res;
}

function bestWindow(points, fromHour) {
  let best = null;
  for (let h = fromHour; h < 23; h++) {
    const avg = (points[h].score + points[h + 1].score) / 2.0;
    if (best === null || avg > best[1]) best = [h, avg];
  }
  return best;
}

// ---------- Ветер относительно берега ----------
const SHORE_FACING_DEG = 225.0;
function windVsShore(windFromDeg, windMs) {
  if (isNaN_(windFromDeg)) return null;
  let diff = Math.abs(windFromDeg - SHORE_FACING_DEG) % 360.0;
  if (diff > 180.0) diff = 360.0 - diff;
  const strong = !isNaN_(windMs) && windMs * 3.6 >= 25.0;
  if (diff <= 50.0) {
    return [0, strong
      ? tr('С моря, на берег: нагоняет волну и прибой', 'From the sea, onto the shore: builds waves and surf', 'S mora, prema obali: stvara talas i prasak')
      : tr('С моря, на берег: у берега может быть рябь и прибой', 'From the sea, onto the shore: some chop and surf near the shore', 'S mora, prema obali: uz obalu može biti mreškanje i prasak')];
  }
  if (diff >= 130.0) {
    return [2, strong
      ? tr('С берега, в море: в лодке может сносить от берега, будьте осторожны', 'Offshore, towards the sea: a boat can be pushed away from the coast, be careful', 'S kopna, prema moru: čamac može nositi od obale, budite oprezni')
      : tr('С берега, в море: у берега тихо, лодку может сносить в море', 'Offshore, towards the sea: calm near the shore, a boat can drift out', 'S kopna, prema moru: uz obalu je mirno, čamac može nositi na pučinu')];
  }
  return [1, tr('Вдоль берега', 'Along the shore', 'Duž obale')];
}

// ---------- Оценки и цвета ----------
function scoreColor(score) {
  // оценка округлённая; шкала строгая: 5-7 «средний», «хороший» с 8
  if (score >= 9) return '#2E9E5B';
  if (score >= 8) return '#8BC34A';
  if (score >= 5) return '#F0A030';
  return '#D9534F';
}
function scoreWord(score) {
  if (score >= 9) return tr('отличный', 'excellent', 'odličan');
  if (score >= 8) return tr('хороший', 'good', 'dobar');
  if (score >= 5) return tr('средний', 'fair', 'srednji');
  return tr('слабый', 'poor', 'slab');
}

// ---------- Рыбы для расчёта ----------
function buildFish(def) {
  return { name: def.name, season: def.season, tempPts: DATA.temps[def.temp], surf: def.surf };
}
const FISH = {
  shore: DATA.shore.map(buildFish),
  boat: DATA.boat.map(buildFish)
};
const fishFor = boat => (boat ? FISH.boat : FISH.shore).filter(f => Country.visible({ key: f.name }));

// ---------- Районы и точки (берутся из текущей страны) ----------
const SPOT_NAMES = ['Берег', '3 км', '15 км'];
function buildRegions() {
  return Country.regions().map((r, idx) => ({
    key: r.key,
    spots: r.pts.map((p, i) => ({ name: (idx === 0 ? '' : '') + SPOT_NAMES[i] + (idx === 0 ? '' : ' · ' + r.key), lat: p[0], lon: p[1], snap: false, shore: i === 0 }))
  }));
}
let REGIONS = buildRegions();
function refreshRegions() { REGIONS = buildRegions(); }
const regionSpots = key => (REGIONS.find(r => r.key === key) || REGIONS[0]).spots;

const WIND_LOW = 5 / 3.6, WIND_HIGH = 20 / 3.6;
const WAVE_LOW = 0.2, WAVE_HIGH = 0.8;
const PRESSURE_LOW = 1005, PRESSURE_HIGH = 1025;
