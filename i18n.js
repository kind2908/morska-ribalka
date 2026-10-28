// Язык и переводы. tr(ru, en, sr) берёт вариант для текущего языка.
const LANGS = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'sr', label: 'Srpski' }
];

const Store = {
  get(key, def) {
    try {
      const v = localStorage.getItem('fishing.' + key);
      return v === null ? def : JSON.parse(v);
    } catch (e) { return def; }
  },
  set(key, value) {
    try { localStorage.setItem('fishing.' + key, JSON.stringify(value)); } catch (e) { /* приватный режим */ }
  }
};

const Lang = {
  current: 'ru',
  load() {
    const saved = Store.get('lang', null);
    const phone = (navigator.language || 'ru').slice(0, 2).toLowerCase();
    const guess = ['ru', 'en', 'sr'].includes(phone) ? phone : (phone === 'hr' || phone === 'bs' ? 'sr' : 'ru');
    this.current = LANGS.some(l => l.code === saved) ? saved : guess;
  },
  set(code) { this.current = code; Store.set('lang', code); }
};

function tr(ru, en, sr) {
  if (Lang.current === 'en') return en;
  if (Lang.current === 'sr') return sr;
  return ru;
}
// массив [ru, en, sr] -> строка на текущем языке
function t3(arr) {
  if (!arr) return '';
  const i = Lang.current === 'en' ? 1 : Lang.current === 'sr' ? 2 : 0;
  return arr[i] != null ? arr[i] : arr[0];
}

const noData = () => tr('нет данных', 'no data', 'nema podataka');
const U = {
  m: () => tr('м', 'm', 'm'),
  ms: 'ms',            // внутренний признак: ветер хранится в м/с, показывается в км/ч
  hpa: () => tr('гПа', 'hPa', 'hPa'),
  kmh: () => tr('км/ч', 'km/h', 'km/h'),
  cm: () => tr('см', 'cm', 'cm'),
  mm: () => tr('мм', 'mm', 'mm')
};

const REGION_LABELS = {
  'Херцег-Нови': ['Херцег-Нови', 'Herceg Novi', 'Herceg Novi'],
  'Тиват': ['Тиват', 'Tivat / Boka', 'Tivat / Boka'],
  'Будва': ['Будва', 'Budva', 'Budva'],
  'Петровац': ['Петровац', 'Petrovac', 'Petrovac'],
  'Бар': ['Бар', 'Bar', 'Bar'],
  'Ульцинь': ['Ульцинь', 'Ulcinj', 'Ulcinj']
};
const regionLabel = key => REGION_LABELS[key] ? t3(REGION_LABELS[key]) : key;

function spotLabel(name) {
  if (name.includes(' · ')) {
    const base = name.split(' · ')[0];
    const region = name.split(' · ').slice(1).join(' · ');
    return spotLabel(base) + ' · ' + regionLabel(region);
  }
  switch (name) {
    case 'Берег': return tr('Берег', 'Shore', 'Obala');
    case '3 км': return tr('3 км', '3 km', '3 km');
    case '15 км': return tr('15 км', '15 km', '15 km');
    case 'Моё место': return tr('Моё место', 'My location', 'Moja lokacija');
    case 'Точка на карте': return tr('Точка на карте', 'Map point', 'Tačka na karti');
    default: return name;
  }
}

function fishLabel(name) {
  const l = DATA.fishLabels[name];
  return l ? t3(l) : name;
}

// ---------- форматирование ----------
const isNaN_ = v => v == null || Number.isNaN(v);
const f1 = v => v.toFixed(1);
const f0 = v => v.toFixed(0);
const sgn = (v, d) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);

// Ветер всегда в м/с внутри, на экране км/ч
function fmt(value, unit) {
  if (isNaN_(value)) return noData();
  if (unit === U.ms) return f0(value * 3.6) + ' ' + U.kmh();
  return f1(value) + ' ' + unit;
}

function withNorm(value, unit, low, high, digits) {
  if (isNaN_(value)) return noData();
  const wind = unit === U.ms;
  const k = wind ? 3.6 : 1;
  const shown = wind ? U.kmh() : unit;
  const d = wind ? 0 : digits;
  const status = value < low ? tr('ниже нормы', 'below normal', 'ispod normale')
    : value > high ? tr('выше нормы', 'above normal', 'iznad normale')
      : tr('в норме', 'normal', 'u normali');
  const usual = tr('обычно', 'usually', 'obično');
  return `${(value * k).toFixed(d)} ${shown} (${usual} ${(low * k).toFixed(d)}–${(high * k).toFixed(d)}, ${status})`;
}

function compass(deg) {
  if (isNaN_(deg)) return '';
  const names = {
    ru: ['север', 'северо-восток', 'восток', 'юго-восток', 'юг', 'юго-запад', 'запад', 'северо-запад'],
    en: ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'],
    sr: ['sjever', 'sjeveroistok', 'istok', 'jugoistok', 'jug', 'jugozapad', 'zapad', 'sjeverozapad']
  }[Lang.current];
  return names[Math.floor((deg + 22.5) / 45) % 8];
}

function windFrom(deg) {
  if (isNaN_(deg)) return '';
  const names = {
    ru: ['С', 'СВ (бора)', 'В', 'ЮВ (юго)', 'Ю', 'ЮЗ', 'З', 'СЗ'],
    en: ['N', 'NE (bora)', 'E', 'SE (jugo)', 'S', 'SW', 'W', 'NW'],
    sr: ['S', 'SI (bura)', 'I', 'JI (jugo)', 'J', 'JZ', 'Z', 'SZ']
  }[Lang.current];
  return names[Math.floor((deg + 22.5) / 45) % 8];
}

function beaufort(ms) {
  if (isNaN_(ms)) return -1;
  const k = ms * 3.6;
  const lim = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
  for (let i = 0; i < lim.length; i++) if (k < lim[i]) return i;
  return 12;
}

function windWord(ms) {
  const b = beaufort(ms);
  if (b < 0) return noData();
  const ru = ['штиль', 'тихий', 'лёгкий', 'слабый', 'умеренный', 'свежий', 'сильный', 'крепкий', 'очень крепкий', 'шторм', 'сильный шторм', 'жестокий шторм', 'ураган'];
  const en = ['calm', 'light air', 'light breeze', 'gentle breeze', 'moderate breeze', 'fresh breeze', 'strong breeze', 'near gale', 'gale', 'strong gale', 'storm', 'violent storm', 'hurricane'];
  const sr = ['bonaca', 'lahor', 'povjetarac', 'slab vjetar', 'umjeren vjetar', 'umjereno jak vjetar', 'jak vjetar', 'žestok vjetar', 'olujni vjetar', 'jak olujni vjetar', 'oluja', 'jaka oluja', 'orkan'];
  const word = { ru, en, sr }[Lang.current][b];
  return `${word}, ${b} ${tr('Бф', 'Bft', 'Bf')}`;
}

// ---------- время в Черногории (как в запросах к погоде) ----------
function nowLocal() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Belgrade', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const g = t => parts.find(p => p.type === t).value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, hour: parseInt(g('hour'), 10), minute: parseInt(g('minute'), 10) };
}

function dayLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const loc = { ru: 'ru', en: 'en', sr: 'sr-Latn' }[Lang.current];
  let w;
  try { w = new Intl.DateTimeFormat(loc, { weekday: 'short', timeZone: 'UTC' }).format(dt); } catch (e) { w = ''; }
  return `${w} ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
}
