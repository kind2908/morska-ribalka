// Библиотека рыб: данные из data.js, фото с Википедии (адрес запоминается на устройстве)
const photoAlias = {
  'Sphyraena sphyraena': ['European barracuda', 'Sphyraena', 'Barracuda'],
  'Sphyraena viridensis': ['Yellowmouth barracuda']
};

async function findPhotoUrl(latin) {
  const q = encodeURIComponent(latin);
  const wiki = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&pithumbsize=640&titles=';
  const fromPages = root => {
    const pages = root.query && root.query.pages;
    if (!pages) return null;
    let best = null;
    Object.values(pages).forEach(p => {
      const src = (p.thumbnail && p.thumbnail.source) || (p.imageinfo && p.imageinfo[0] && p.imageinfo[0].thumburl);
      if (!src) return;
      const index = p.index || 0;
      if (!best || index < best[0]) best = [index, src];
    });
    return best ? best[1] : null;
  };
  const attempts = (photoAlias[latin] || []).map(a => wiki + encodeURIComponent(a)).concat([
    wiki + q,
    `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=3&gsrsearch=${q}&prop=pageimages&pithumbsize=640`,
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=3&gsrsearch=${q}&prop=imageinfo&iiprop=url&iiurlwidth=640`
  ]);
  for (const url of attempts) {
    try {
      const found = fromPages(await getJson(url, 10000));
      if (found && !/\.svg(\/|$)/i.test(found)) return found;
    } catch (e) { /* пробуем следующий способ */ }
  }
  return null;
}

// очередь, чтобы не слать десятки запросов сразу
const photoQueue = { running: 0, waiting: [] };
function runPhotoJob(job) {
  return new Promise(resolve => {
    const go = () => {
      photoQueue.running++;
      job().then(resolve, () => resolve(null)).finally(() => {
        photoQueue.running--;
        const next = photoQueue.waiting.shift();
        if (next) next();
      });
    };
    if (photoQueue.running < 3) go(); else photoQueue.waiting.push(go);
  });
}

function photoUrlFor(latin) {
  const cached = Store.get('photo.' + latin, null);
  if (cached) return Promise.resolve(cached);
  return runPhotoJob(async () => {
    const url = await findPhotoUrl(latin);
    if (url) Store.set('photo.' + latin, url);
    return url;
  });
}

// Картинка с ленивой загрузкой; нажатие по серой плашке повторяет попытку
function fishPhoto(latin, cls) {
  const box = h('div', { class: 'photo ' + (cls || '') });
  const img = h('img', { alt: latin, loading: 'lazy' });
  const load = () => {
    box.classList.remove('failed');
    photoUrlFor(latin).then(url => {
      if (!url) { box.classList.add('failed'); return; }
      img.onerror = () => { Store.set('photo.' + latin, null); box.classList.add('failed'); };
      img.onload = () => box.classList.add('ready');
      img.src = url;
    });
  };
  box.appendChild(img);
  box.addEventListener('click', () => { if (box.classList.contains('failed')) load(); });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { io.disconnect(); load(); }
    }, { rootMargin: '200px' });
    // наблюдаем после вставки в документ
    setTimeout(() => io.observe(box), 0);
  } else load();
  return box;
}

// подключаем расширенные данные: рыба-лев и новые поля
(function () {
  if (!window.FISHX) return;
  FISHX.extra.forEach(e => { if (!DATA.lib.some(f => f.key === e.key)) DATA.lib.push(e); });
})();

const MONTHS = [
  ['Я','Ф','М','А','М','И','И','А','С','О','Н','Д'],
  ['J','F','M','A','M','J','J','A','S','O','N','D'],
  ['J','F','M','A','M','J','J','A','K','O','N','D']];
function seasonBar(months) {
  const names = [tr('Нет','No','Ne'), tr('Слабо','Weak','Slabo'), tr('Хорошо','Good','Dobro'), tr('Пик','Peak','Vrhunac')];
  let m;
  try {
    const loc = { ru: 'ru', en: 'en', sr: 'sr-Latn', hr: 'hr', it: 'it', el: 'el', sq: 'sq', bg: 'bg', sl: 'sl' }[Lang.current] || 'en';
    const f = new Intl.DateTimeFormat(loc, { month: 'narrow', timeZone: 'UTC' });
    m = Array.from({ length: 12 }, (_, i) => f.format(new Date(Date.UTC(2026, i, 15))));
  } catch (e) { m = MONTHS[1]; }
  const wrap = h('div', { class: 'sbar' });
  months.forEach((v, i) => wrap.appendChild(h('div', { class: 'sb s' + v, title: names[v] }, h('i', null), h('b', null, m[i]))));
  return wrap;
}

function recipeBlock(S, fkey, r, idx, rerender) {
  const id = fkey + '#' + idx;
  const open = S.recOpen === id;
  const box = h('div', { class: 'recipe' });
  box.appendChild(h('div', { class: 'row click', onclick: () => { S.recOpen = open ? null : id; rerender(); } },
    h('b', null, '🍽 ' + t3(r.title)),
    h('span', { class: 'link' }, open ? '▲' : '▼')));
  if (open) {
    box.appendChild(small(r.min + ' ' + tr('мин', 'min', 'min') + ' · ' + r.serves + ' ' + tr('порц.', 'servings', 'porcija')));
    box.appendChild(infoRow(tr('Продукты', 'Ingredients', 'Namirnice'), t3(r.ingr)));
    r.steps.forEach((st, i) => box.appendChild(h('p', null, (i + 1) + '. ' + t3(st))));
  }
  return box;
}

const libTitle = f => (f.en ? tr(f.key, f.en, f.sr || f.en) : fishLabel(f.key));

function renderLibrary(S, rerender) {
  const groups = [
    [0, tr('Рыбы', 'Fish', 'Ribe')],
    [1, tr('Головоногие', 'Cephalopods', 'Glavonošci')],
    [2, tr('Ракообразные', 'Crustaceans', 'Rakovi')]
  ];
  const out = [h('h2', { class: 'page' }, tr('Рыбы', 'Fish', 'Ribe') + ' · ' + Country.sea())];

  const rules = Country.rules();
  const rulesCard = card(tr('Основные правила и законы', 'Main rules and laws', 'Osnovna pravila i zakoni'),
    h('a', { class: 'link', href: '#', onclick: e => { e.preventDefault(); S.rulesOpen = !S.rulesOpen; rerender(); } },
      S.rulesOpen ? tr('Свернуть ▲', 'Collapse ▲', 'Skupi ▲') : tr('Показать ▼', 'Show ▼', 'Prikaži ▼')));
  if (S.rulesOpen) {
    rules.slice(0, rules.length - 2).forEach(r => rulesCard.appendChild(h('p', null, '• ' + t3(r))));
    rulesCard.appendChild(small(t3(rules[rules.length - 2])));
    rulesCard.appendChild(small(t3(rules[rules.length - 1])));
  }
  out.push(rulesCard);

  groups.forEach(([g, title]) => {
    const list = DATA.lib.filter(f => f.group === g && Country.visible(f));
    if (!list.length) return;
    out.push(h('h2', { class: 'group' }, title));
    list.forEach(f => {
      const open = S.libOpen === f.key;
      const c = card(libTitle(f) + '  ·  ' + f.latin);
      const toggle = () => { S.libOpen = open ? null : f.key; rerender(); };
      const head = h('div', { class: 'row click', onclick: toggle },
        open ? null : fishPhoto(f.latin, 'thumb'),
        h('span', { class: 'link' }, open ? tr('Свернуть ▲', 'Collapse ▲', 'Skupi ▲') : tr('Подробнее ▼', 'Details ▼', 'Detalji ▼')));
      c.appendChild(head);
      if (open) {
        c.appendChild(fishPhoto(f.latin, 'big'));
        c.appendChild(infoRow(tr('Где', 'Where', 'Gdje'), t3(f.where)));
        c.appendChild(infoRow(tr('Наживка и приманки', 'Bait and lures', 'Mamci i varalice'), t3(f.bait)));
        c.appendChild(infoRow(tr('Часы активности', 'Active hours', 'Aktivni sati'), t3(f.hours)));
        c.appendChild(infoRow(tr('Сезон', 'Season', 'Sezona'), t3(f.season)));
        c.appendChild(infoRow(tr('Правила', 'Rules', 'Pravila'), t3(f.rule)));
        const x = window.FISHX && FISHX.sp[f.key];
        if (x) {
          c.appendChild(infoRow(tr('Повадки', 'Habits', 'Navike'), t3(x.habits)));
          c.appendChild(seasonBar(x.months));
          if (x.safety) c.appendChild(h('div', { class: 'warn' }, '⚠ ' + t3(x.safety)));
          if (x.noeat) c.appendChild(h('div', { class: 'warn' }, '🚫 ' + t3(x.noeat)));
          if (x.rec.length) {
            c.appendChild(h('h3', { class: 'recs' }, tr('Что приготовить', 'What to cook', 'Što skuhati')));
            x.rec.forEach((r, i) => c.appendChild(recipeBlock(S, f.key, r, i, rerender)));
          }
        }
      }
      out.push(c);
    });
  });

  out.push(small(tr(
    'Названия по таблице иллюстраций «Рыбы Адриатики» (для других морей список сокращён). Фото загружаются из Википедии (свободные лицензии, авторы указаны на страницах статей) при первом показе. Фото может не совпасть с видом, поэтому ориентируйтесь на латинское название. Если фото не загрузилось, нажмите на серую плашку. Правила для моллюсков и крабов я не проверял и в библиотеку не включил.',
    'Names follow the “Fish of the Adriatic” illustration table. Photos are loaded from Wikipedia (free licences, authors are listed on the article pages) on first view. A photo may not match the species, so go by the Latin name. If a photo does not load, tap the grey box. I did not check the rules for shellfish and crabs and left them out.',
    'Nazivi prema tabeli ilustracija „Ribe Jadrana“. Fotografije se učitavaju s Wikipedije (slobodne licence, autori su navedeni na stranicama članaka) pri prvom prikazu. Fotografija se može ne poklapati s vrstom, pa se držite latinskog naziva. Ako se fotografija ne učita, dodirnite sivu pločicu. Pravila za školjke i rakove nisam provjeravao i nisam ih uključio.')));
  return out;
}
