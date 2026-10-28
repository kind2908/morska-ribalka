// Экраны приложения: клёв, условия, дни, дневник, настройки
const TAB_ICONS = ['🎣', '🌊', '📅', '🗺️', '📓', '🐟'];
const tabTitles = () => [
  tr('Клёв', 'Bite', 'Ribolov'), tr('Условия', 'Conditions', 'Uslovi'), tr('Дни', 'Days', 'Dani'),
  tr('Карта', 'Map', 'Karta'), tr('Дневник', 'Diary', 'Dnevnik'), tr('Рыбы', 'Fish', 'Ribe')
];

function contextBar(S, A) {
  const mode = S.boat ? tr('С лодки', 'From boat', 'Sa čamca') : tr('С берега', 'From shore', 'S obale');
  return h('div', { class: 'ctx' },
    h('div', { class: 'ctxtext' },
      h('div', { class: 'ctxtitle' }, regionLabel(S.region) + ' · ' + spotLabel(S.selected.name)),
      h('div', { class: 'small' }, mode + ' · ' + fishLabel(S.fish.name))),
    h('button', { class: 'gear', type: 'button', 'aria-label': 'settings', onclick: () => A.openSettings() }, '⚙️'));
}

function gate(S, build) {
  if (S.error) {
    return card(tr('Ошибка', 'Error', 'Greška'), h('p', null, tr(
      'Не удалось загрузить данные. Проверьте интернет. Для точек на суше данные о море недоступны.',
      'Could not load data. Check your internet connection. Sea data is not available for points on land.',
      'Nije moguće učitati podatke. Provjerite internet. Za tačke na kopnu podaci o moru nisu dostupni.')),
      btn(tr('Повторить', 'Retry', 'Ponovi'), () => S.reload()));
  }
  if (!S.data) return h('div', { class: 'spin' }, h('div', { class: 'spinner' }));
  return build(S.data);
}

// ---------------- Клёв ----------------
function renderBite(S, A) {
  const out = [contextBar(S, A)];
  if (S.installHint) out.push(S.installHint);
  if (S.updateReady) out.push(A.updateBanner());

  out.push(gate(S, d => {
    const wrap = h('div', { class: 'stack' });
    const res = biteExplain(d, S.fish, S.boat);
    const scoreD = res.score, score = Math.round(scoreD);
    const col = scoreColor(score);
    wrap.appendChild(card(tr(`Прогноз клёва: ${fishLabel(S.fish.name)}`, `Bite forecast: ${fishLabel(S.fish.name)}`, `Prognoza ulova: ${fishLabel(S.fish.name)}`),
      h('div', { class: 'scorerow' },
        h('span', { class: 'bigscore', style: { color: col } }, f1(scoreD)),
        h('span', { class: 'of10' }, ' / 10'),
        h('span', { class: 'grow' }),
        h('span', { class: 'scoreword', style: { color: col } }, scoreWord(score))),
      h('div', { class: 'bar' }, h('div', { style: { width: (clamp(scoreD / 10, 0.03, 1) * 100) + '%', background: col } }))));

    const today = S.days[0];
    if (today) {
      const w = safetyWarning(today.windMax, Math.max(isNaN_(today.gustMax) ? 0 : today.gustMax, isNaN_(d.gust) ? 0 : d.gust),
        today.waveMax, today.rain, today.rainPeakMmH, today.thunder, S.boat);
      if (w) wrap.appendChild(h('div', { class: 'warn ' + (w[0] === 2 ? 'danger' : 'caution') }, w[1]));

      const rc = card(tr('Осадки сегодня', 'Rain today', 'Padavine danas'));
      const level = rainLevelText(today);
      if (!level && !today.thunder) {
        rc.appendChild(h('p', null, tr('Заметных осадков не ожидается.', 'No significant rain expected.', 'Ne očekuju se značajne padavine.')));
      } else {
        if (level) {
          const head = level.charAt(0).toUpperCase() + level.slice(1);
          const total = f0(today.rain);
          rc.appendChild(h('p', { class: 'bold' }, tr(`${head}, всего за день ≈ ${total} мм`, `${head}, total for the day ≈ ${total} mm`, `${head}, ukupno za dan ≈ ${total} mm`)));
        }
        if (!today.rainWindows.length && level) rc.appendChild(h('p', null, tr('Основная часть дождя уже прошла.', 'Most of the rain has already passed.', 'Najveći dio kiše je već prošao.')));
        today.rainWindows.forEach(w2 => rc.appendChild(h('p', null, '☔ ' + rainWindowText(w2))));
        if (today.thunder) rc.appendChild(h('p', null, tr('⛈ Возможна гроза.', '⛈ Thunderstorm possible.', '⛈ Moguća je grmljavina.')));
      }
      if (today.rainProbMax >= 0) rc.appendChild(small(tr(`Вероятность осадков до ${today.rainProbMax}%`, `Chance of rain up to ${today.rainProbMax}%`, `Vjerovatnoća padavina do ${today.rainProbMax}%`)));
      wrap.appendChild(rc);
    }

    wrap.appendChild(card(tr('Сейчас', 'Now', 'Sada'),
      h('div', { class: 'tiles' },
        statTile(tr('Воздух', 'Air', 'Zrak'), S.air ? fmt(S.air.now.temp, '°C') : noData()),
        statTile(tr('Вода', 'Water', 'Voda'), fmt(d.waterTemp, '°C')),
        statTile(tr('Ветер', 'Wind', 'Vjetar'), fmt(d.wind, U.ms)),
        statTile(tr('Порывы', 'Gusts', 'Udari'), fmt(d.gust, U.ms)),
        statTile(tr('Волна', 'Waves', 'Talasi'), fmt(d.waveHeight, U.m())),
        statTile(tr('Давление', 'Pressure', 'Pritisak'), fmt(d.pressure, U.hpa()))),
      small(tr('Подробности на вкладке «Условия»', 'Details on the “Conditions” tab', 'Detalji na kartici „Uslovi“'))));

    const bh = card(tr('Лучшие часы сегодня', 'Best hours today', 'Najbolji sati danas'));
    const hours = bestHours(d);
    if (!hours.length) bh.appendChild(h('p', null, noData()));
    hours.forEach(x => bh.appendChild(h('p', null, '• ' + x)));
    if (S.hourly) {
      const nowHour = nowLocal().hour;
      const dir = S.hourly.windDir[nowHour];
      const info = windVsShore(dir, S.hourly.wind[nowHour]);
      if (info) {
        const cc = info[0] === 0 ? '#F0A030' : info[0] === 2 ? '#3B8FD1' : '';
        bh.appendChild(h('p', { style: cc ? { color: cc } : null }, `${tr('Ветер', 'Wind', 'Vjetar')} (${windFrom(dir)}): ${info[1]}`));
      }
    }
    wrap.appendChild(bh);

    // из чего складывается оценка
    const ex = card(tr('Из чего складывается оценка', 'How the score is made', 'Od čega se sastoji ocjena'));
    ex.appendChild(h('div', { class: 'info ex' }, h('span', { class: 'lbl' }, tr('Основа (сезон и вода для этой рыбы)', 'Base (season and water for this fish)', 'Osnova (sezona i voda za ovu ribu)')), h('span', { class: 'val bold' }, f1(res.base))));
    res.adjustments.forEach(([name, v]) => {
      const c = v > 0.05 ? '#2E9E5B' : v < -0.05 ? '#D9534F' : '';
      ex.appendChild(h('div', { class: 'info ex' }, h('span', { class: 'lbl' }, name), h('span', { class: 'val bold', style: c ? { color: c } : null }, sgn(v, 1))));
    });
    ex.appendChild(small(tr('Итог: основа плюс поправки, но не меньше 1 и не больше 10. Сезон и температура воды задают основу, остальное её двигает вверх или вниз.',
      'Total: base plus adjustments, limited to 1–10. Season and water temperature set the base, the rest moves it up or down.',
      'Ukupno: osnova plus korekcije, od 1 do 10. Sezona i temperatura vode daju osnovu, ostalo je pomjera gore ili dolje.')));
    wrap.appendChild(ex);

    if (S.hourly) wrap.appendChild(hourlyCard(S, d));
    return wrap;
  }));
  return out;
}

function hourlyCard(S, d) {
  const points = hourlyScores(S.hourly, S.fish, S.boat, d.sunrise, d.sunset);
  const nowHour = nowLocal().hour;
  const c = card(tr('Клёв по часам сегодня', 'Bite by hour today', 'Ribolov po satima danas'));
  const bars = h('div', { class: 'hbars' }, points.map(p => {
    const frac = clamp(p.score / 10, 0.05, 1);
    const color = scoreColor(Math.round(p.score));
    return h('div', { class: 'hb', title: `${pad2(p.hour)}:00 · ${f1(p.score)}`, style: { height: (frac * 100) + '%', background: color, opacity: p.hour < nowHour ? 0.35 : 1 } });
  }));
  const labels = h('div', { class: 'hlabels' }, points.map(p => h('span', null, p.hour % 3 === 0 ? pad2(p.hour) : '')));
  c.appendChild(bars); c.appendChild(labels);
  const best = bestWindow(points, clamp(nowHour, 0, 22));
  if (best) {
    c.appendChild(h('p', { class: 'bold' }, tr(`Лучшее время из оставшегося: ${pad2(best[0])}:00–${pad2(best[0] + 2)}:00 (оценка ${f1(best[1])})`,
      `Best of the rest of the day: ${pad2(best[0])}:00–${pad2(best[0] + 2)}:00 (score ${f1(best[1])})`,
      `Najbolje do kraja dana: ${pad2(best[0])}:00–${pad2(best[0] + 2)}:00 (ocjena ${f1(best[1])})`)));
  }
  c.appendChild(small(tr('Высота столбца это оценка в этот час. Прошедшие часы бледные. На зорях добавлено +0.8, в яркий полдень −0.3.',
    'Bar height is the score for that hour. Past hours are faded. Dawn and dusk add +0.8, bright midday −0.3.',
    'Visina stupca je ocjena za taj sat. Prošli sati su blijedi. Zora i sumrak daju +0.8, jarki podne −0.3.')));
  return c;
}

// ---------------- Условия ----------------
function renderConditions(S, A) {
  const out = [contextBar(S, A)];
  out.push(gate(S, d => {
    const wrap = h('div', { class: 'stack' });
    const trend = d.tideRising === true ? tr('уровень растёт', 'rising', 'raste') : d.tideRising === false ? tr('уровень падает', 'falling', 'opada') : '';
    wrap.appendChild(card(tr('Море', 'Sea', 'More'),
      infoRow(tr('Температура воды', 'Water temperature', 'Temperatura vode'), fmt(d.waterTemp, '°C')),
      infoRow(tr('Высота волны', 'Wave height', 'Visina talasa'), withNorm(d.waveHeight, U.m(), WAVE_LOW, WAVE_HIGH, 1)),
      infoRow(tr('Течение', 'Current', 'Struja'), isNaN_(d.currentSpeed) ? noData() : `${f1(d.currentSpeed)} ${U.kmh()}, ` + tr(`на ${compass(d.currentDir)}`, `heading ${compass(d.currentDir)}`, `smjer: ${compass(d.currentDir)}`)),
      infoRow(tr('Уровень моря', 'Sea level', 'Nivo mora'), isNaN_(d.seaLevel) ? noData() : `${sgn(d.seaLevel * 100, 0)} ${U.cm()}, ${trend}`),
      infoRow(tr('Прилив / отлив', 'High / low tide', 'Plima / oseka'), `${d.nextHigh} / ${d.nextLow}`)));

    wrap.appendChild(card(tr('Ветер и давление', 'Wind and pressure', 'Vjetar i pritisak'),
      infoRow(tr('Ветер', 'Wind', 'Vjetar'), withNorm(d.wind, U.ms, WIND_LOW, WIND_HIGH, 1)),
      infoRow(tr('Порывы', 'Gusts', 'Udari'), fmt(d.gust, U.ms)),
      infoRow(tr('По шкале Бофорта', 'Beaufort scale', 'Po Boforovoj skali'), windWord(d.wind) + '; ' + tr('порывы', 'gusts', 'udari') + ' ' + windWord(d.gust)),
      infoRow(tr('Давление', 'Pressure', 'Pritisak'), withNorm(d.pressure, U.hpa(), PRESSURE_LOW, PRESSURE_HIGH, 0)),
      infoRow(tr('Тренд давления', 'Pressure trend', 'Trend pritiska'), trendLabel(d.pressureTrend)),
      small(tr('Это данные прогнозной модели для выбранной точки. На улице, особенно между домами и у склонов, порывы бывают сильнее.',
        'This is forecast-model data for the selected point. On the street, especially between buildings and near slopes, gusts can be stronger.',
        'Ovo su podaci prognostičkog modela za izabranu tačku. Na ulici, naročito između zgrada i uz padine, udari mogu biti jači.'))));

    const clarity = clarityScore(d), vis = visibilityMeters(clarity);
    const vc = card(tr('Видимость под водой', 'Underwater visibility', 'Vidljivost pod vodom'));
    vc.appendChild(h('div', { class: 'headline' }, `≈ ${vis} ${U.m()}`));
    const from = Math.round(vis * 0.8), to = Math.round(vis * 1.2), clar = clarityLabel(clarity);
    vc.appendChild(h('p', null, tr(`Диапазон ${from}–${to} м, вода ${clar}`, `Range ${from}–${to} m, water: ${clar}`, `Raspon ${from}–${to} m, voda: ${clar}`)));
    const rain3 = f0(d.rain3d);
    vc.appendChild(small(tr(`Оценка по волне, ветру и осадкам за 3 дня (${rain3} мм)`, `Estimated from waves, wind and 3-day rainfall (${rain3} mm)`, `Procjena prema talasima, vjetru i padavinama za 3 dana (${rain3} mm)`)));
    const mineLabel = h('p', null);
    const setMine = () => { mineLabel.textContent = tr(`Твоя оценка: ${S.slider} м`, `Your estimate: ${S.slider} m`, `Tvoja procjena: ${S.slider} m`); };
    setMine();
    vc.appendChild(mineLabel);
    vc.appendChild(h('input', { type: 'range', min: 0, max: 30, step: 1, value: S.slider, class: 'range',
      oninput: e => { S.slider = parseInt(e.target.value, 10); setMine(); } }));
    vc.appendChild(btn(tr('Сохранить мою оценку', 'Save my estimate', 'Sačuvaj moju procjenu'), () => {
      S.mark = S.slider; Store.set('mark', { date: nowLocal().date, m: S.mark }); A.rerender();
    }, { primary: true }));
    if (S.mark != null) {
      const diff = S.mark - vis;
      const verdict = diff === 0 ? tr('расчёт совпал', 'estimate matched', 'procjena se poklapa')
        : diff > 0 ? tr(`расчёт занижен на ${Math.abs(diff)} м`, `estimate is ${Math.abs(diff)} m too low`, `procjena je preniska za ${Math.abs(diff)} m`)
          : tr(`расчёт завышен на ${Math.abs(diff)} м`, `estimate is ${Math.abs(diff)} m too high`, `procjena je previsoka za ${Math.abs(diff)} m`);
      vc.appendChild(h('p', null, tr(`Сохранено: ${S.mark} м (${verdict})`, `Saved: ${S.mark} m (${verdict})`, `Sačuvano: ${S.mark} m (${verdict})`)));
    }
    wrap.appendChild(vc);

    const sky = card(tr('Небо и воздух', 'Sky and air', 'Nebo i zrak'));
    const a = S.air;
    sky.appendChild(infoRow(tr('Воздух', 'Air', 'Zrak'), !a ? noData() : fmt(a.now.temp, '°C') + ' (' + tr('ощущается', 'feels like', 'osjeća se') + ' ' + fmt(a.now.feels, '°C') + ')'));
    const tt = a && a.days[0];
    if (tt) sky.appendChild(infoRow(tr('Сегодня', 'Today', 'Danas'), `${f0(tt.min)} … ${f0(tt.max)} °C`));
    sky.appendChild(infoRow(tr('Луна', 'Moon', 'Mjesec'), moonPhaseName(moonAge())));
    sky.appendChild(infoRow(tr('Восход / закат', 'Sunrise / sunset', 'Izlazak / zalazak'), `${d.sunrise} / ${d.sunset}`));
    wrap.appendChild(sky);
    return wrap;
  }));
  return out;
}

// ---------------- Дни ----------------
function renderDays(S, A) {
  const out = [contextBar(S, A)];
  if (!S.days.length) {
    out.push(card(tr('Прогноз по дням', 'Daily forecast', 'Dnevna prognoza'),
      h('p', null, tr('Загрузка или нет данных для этой точки.', 'Loading, or no data for this point.', 'Učitavanje ili nema podataka za ovu tačku.'))));
    return out;
  }
  const c = card(tr(`Прогноз на ${S.days.length} дней`, `${S.days.length}-day forecast`, `Prognoza za ${S.days.length} dana`));
  S.days.forEach(day => {
    const dayScore = dayBite(day, S.fish, S.boat);
    const warn = safetyWarning(day.windMax, day.gustMax, day.waveMax, day.rain, day.rainPeakMmH, day.thunder, S.boat);
    const flag = warn ? (warn[0] === 2 ? ' ' + tr('⚠ опасно', '⚠ dangerous', '⚠ opasno') : ' ⚠') : '';
    const gustText = isNaN_(day.gustMax) ? '' : ', ' + tr('порывы', 'gusts', 'udari') + ' ' + f0(day.gustMax * 3.6);
    const temps = S.air && S.air.days.find(x => x.date === day.date);
    const tempText = temps && !isNaN_(temps.min) && !isNaN_(temps.max) ? `🌡 ${f0(temps.min)} … ${f0(temps.max)} °C` : null;
    const extra = [tempText, rainShortText(day)].filter(Boolean).join(' · ');
    c.appendChild(h('div', { class: 'dayrow' },
      h('div', { class: 'daymain' },
        h('span', { class: 'dl' }, dayLabel(day.date)),
        h('span', { class: 'ds bold', style: { color: scoreColor(Math.round(dayScore)) } }, f1(dayScore)),
        h('span', { class: 'dt small' }, `${windFrom(day.windDir)} ${fmt(day.windMax, U.ms)}${gustText}, ${tr('волна', 'waves', 'talasi')} ${fmt(day.waveMax, U.m())}${flag}`)),
      extra ? h('div', { class: 'small sec' }, extra) : null));
  });
  out.push(c);
  out.push(small(tr('Цифра у дня это оценка клёва из 10. ⚠ значит осторожно или опасно для выбранного режима (берег или лодка): ветер, порывы, волна, ливень или гроза. Оценки на дальние дни грубее, чем на сегодня.',
    'The number next to each day is the bite score out of 10. ⚠ means caution or danger for the selected mode (shore or boat): wind, gusts, waves, downpour or thunderstorm. Scores for later days are rougher than for today.',
    'Broj uz dan je ocjena ulova od 10. ⚠ znači oprez ili opasnost za odabrani režim (obala ili čamac): vjetar, udari, talasi, pljusak ili grmljavina. Ocjene za dalje dane su grublje nego za danas.')));
  return out;
}

// ---------------- Дневник ----------------
function renderDiary(S, A) {
  const entries = Diary.load();
  const out = [h('h2', { class: 'page' }, tr('Дневник уловов', 'Catch diary', 'Dnevnik ulova'))];
  out.push(segmented([
    [0, tr('Новая запись', 'New entry', 'Novi zapis')],
    [1, tr(`Записи (${entries.length})`, `Entries (${entries.length})`, `Zapisi (${entries.length})`)],
    [2, tr('Статистика', 'Statistics', 'Statistika')]
  ], S.diarySub, k => { S.diarySub = k; S.diaryMsg = ''; A.rerender(); }));

  if (S.diarySub === 0) out.push(diaryNewEntry(S, A));
  else if (S.diarySub === 1) out.push(diaryList(S, A, entries));
  else out.push(diaryStatsView(S, A, entries));
  return out;
}

function diaryNewEntry(S, A) {
  const dr = S.draft;
  const fishes = fishFor(S.boat);
  // пока человек сам не выбрал рыбу, подставляем ту, что выбрана в настройках
  const fishName = dr.fish && fishes.some(f => f.name === dr.fish) ? dr.fish : S.fish.name;
  const c = card(tr('Новая запись', 'New entry', 'Novi zapis'));
  c.appendChild(small(tr('Режим', 'Mode', 'Režim') + ': ' + (S.boat ? tr('с лодки', 'from boat', 'sa čamca') : tr('с берега', 'from shore', 's obale')) + ' · ' + spotLabel(S.selected.name)));
  c.appendChild(h('label', { class: 'lab' }, tr('Рыба', 'Fish', 'Riba'),
    select(fishes.map(f => [f.name, fishLabel(f.name)]), fishName, v => { dr.fish = v; })));
  const countInput = h('input', { class: 'field', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 4, value: dr.count, oninput: e => { dr.count = e.target.value; } });
  const weightInput = h('input', { class: 'field', type: 'text', inputmode: 'decimal', maxlength: 7, placeholder: tr('необязательно', 'optional', 'neobavezno'), value: dr.weight, oninput: e => { dr.weight = e.target.value; } });
  c.appendChild(h('div', { class: 'two' },
    h('label', { class: 'lab' }, tr('Штук', 'Count', 'Komada'), countInput),
    h('label', { class: 'lab' }, tr('Вес, кг', 'Weight, kg', 'Težina, kg'), weightInput)));

  // место улова
  c.appendChild(h('div', { class: 'lab' }, tr('Место улова', 'Catch location', 'Mjesto ulova')));
  if (dr.point) {
    c.appendChild(h('p', { class: 'small' }, `📍 ${dr.point.lat.toFixed(5)}, ${dr.point.lon.toFixed(5)}`));
  } else {
    c.appendChild(h('p', { class: 'small' }, tr('📍 Точка не прикреплена', '📍 No point attached', '📍 Tačka nije priložena')));
  }
  c.appendChild(h('div', { class: 'row wrap' },
    btn(tr('🗺 На карте', '🗺 On map', '🗺 Na karti'), () => A.pickOnMap({ kind: 'diary', label: tr('место улова', 'catch location', 'mjesto ulova') })),
    btn(tr('Текущая точка', 'Current point', 'Trenutna tačka'), () => { dr.point = { lat: S.selected.lat, lon: S.selected.lon }; A.rerender(); }),
    dr.point ? btn(tr('Убрать', 'Remove', 'Ukloni'), () => { dr.point = null; A.rerender(); }, { flat: true }) : null));

  // фото
  const fileInput = h('input', { type: 'file', accept: 'image/*', class: 'hidden', onchange: async e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try { dr.photo = await Photos.shrink(f); dr.photoUrl = URL.createObjectURL(dr.photo); } catch (err) { dr.photo = null; }
    A.rerender();
  } });
  c.appendChild(fileInput);
  c.appendChild(h('div', { class: 'row wrap' },
    btn(dr.photo ? tr('Другое фото', 'Another photo', 'Druga fotografija') : tr('📷 Фото улова', '📷 Photo of the catch', '📷 Fotografija ulova'), () => fileInput.click()),
    dr.photo ? btn(tr('Убрать фото', 'Remove photo', 'Ukloni fotografiju'), () => { dr.photo = null; dr.photoUrl = null; A.rerender(); }, { flat: true }) : null));
  if (dr.photoUrl) c.appendChild(h('img', { class: 'catchimg', src: dr.photoUrl, alt: '' }));

  c.appendChild(h('label', { class: 'lab' }, tr('Комментарий', 'Comment', 'Komentar'),
    h('textarea', { class: 'field', rows: 2, oninput: e => { dr.note = e.target.value; } }, dr.note)));

  const save = async noCatch => {
    const count = noCatch ? 0 : Math.max(0, parseInt(dr.count, 10) || 0);
    if (!noCatch && count === 0) { countInput.focus(); return; }
    const w = parseFloat(String(dr.weight).replace(',', '.'));
    const d = S.data;
    const id = 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const entry = {
      id, time: new Date().toISOString(), spot: S.selected.name, boat: S.boat,
      fish: noCatch ? '—' : fishName, count, weightKg: noCatch || Number.isNaN(w) ? null : w,
      forecast: d ? Math.round(biteExplain(d, S.fish, S.boat).score) : -1,
      wind: d ? nn(d.wind) : null, wave: d ? nn(d.waveHeight) : null, pressure: d ? nn(d.pressure) : null,
      trend: d ? nn(d.pressureTrend) : null, waterTemp: d ? nn(d.waterTemp) : null, moon: moonAge(),
      photo: !!dr.photo, lat: dr.point ? dr.point.lat : null, lon: dr.point ? dr.point.lon : null, note: dr.note.trim()
    };
    // NaN не хранится в JSON
    Object.keys(entry).forEach(k => { if (typeof entry[k] === 'number' && Number.isNaN(entry[k])) entry[k] = null; });
    if (dr.photo) { try { await Photos.put(id, dr.photo); } catch (e) { entry.photo = false; } }
    Diary.add(entry);
    S.draft = newDraft(S);
    S.diarySub = 1;
    A.rerender();
  };
  c.appendChild(h('div', { class: 'row wrap' },
    btn(tr('Сохранить улов', 'Save catch', 'Sačuvaj ulov'), () => save(false), { primary: true }),
    btn(tr('Без улова', 'No catch', 'Bez ulova'), () => save(true))));
  c.appendChild(small(tr('К записи автоматически прикрепятся условия на этот момент (прогноз клёва, ветер, волна, давление, температура воды, луна). Фото уменьшается и хранится только в этом браузере.',
    'The conditions at this moment (bite forecast, wind, waves, pressure, water temperature, moon) are attached automatically. The photo is shrunk and stored only in this browser.',
    'Uslovi u ovom trenutku (prognoza ulova, vjetar, talasi, pritisak, temperatura vode, mjesec) prilažu se automatski. Fotografija se smanjuje i čuva samo u ovom pregledniku.')));
  return c;
}

function newDraft(S) { return { fish: null, count: '1', weight: '', note: '', point: null, photo: null, photoUrl: null }; }

function diaryList(S, A, entries) {
  const wrap = h('div', { class: 'stack' });
  if (!entries.length) { wrap.appendChild(card(tr('Записи', 'Entries', 'Zapisi'), h('p', null, tr('Пока нет записей.', 'No entries yet.', 'Još nema zapisa.')))); return wrap; }
  entries.forEach(e => {
    const c = card(entryTitle(e));
    c.appendChild(h('p', { class: 'small' }, `${fmtTime(e.time)} · ${e.spot ? spotLabel(e.spot) + ' · ' : ''}${e.boat ? tr('с лодки', 'from boat', 'sa čamca') : tr('с берега', 'from shore', 's obale')}`));
    if (e.photo) {
      const img = h('img', { class: 'catchimg', alt: '' });
      Photos.get(e.id).then(b => { if (b) img.src = URL.createObjectURL(b); else img.remove(); });
      c.appendChild(img);
    }
    const hasPoint = !isNaN_(e.lat);
    c.appendChild(h('p', { class: 'small' }, hasPoint ? `📍 ${e.lat.toFixed(5)}, ${e.lon.toFixed(5)}` : tr('📍 Точка не прикреплена', '📍 No point attached', '📍 Tačka nije priložena')));
    c.appendChild(h('div', { class: 'row wrap' },
      hasPoint ? btn(tr('На карте', 'On map', 'Na karti'), () => A.showOnMap({ lat: e.lat, lon: e.lon })) : null,
      btn(hasPoint ? tr('Изменить точку', 'Change point', 'Promijeni tačku') : tr('Прикрепить точку', 'Attach point', 'Priloži tačku'),
        () => A.pickOnMap({ kind: 'entry', id: e.id, label: tr('место улова', 'catch location', 'mjesto ulova') })),
      hasPoint ? btn(tr('Убрать точку', 'Remove point', 'Ukloni tačku'), () => { Diary.update(e.id, { lat: null, lon: null }); A.rerender(); }, { flat: true }) : null));

    c.appendChild(h('div', { class: 'lab' }, tr('Условия в тот день', 'Conditions that day', 'Uslovi tog dana')));
    c.appendChild(h('div', { class: 'tiles' },
      statTile(tr('Прогноз клёва', 'Bite forecast', 'Prognoza ulova'), e.forecast >= 0 ? `${e.forecast}/10` : noData()),
      statTile(tr('Вода', 'Water', 'Voda'), fmt(e.waterTemp, '°C')),
      statTile(tr('Ветер', 'Wind', 'Vjetar'), fmt(e.wind, U.ms)),
      statTile(tr('Волна', 'Waves', 'Talasi'), fmt(e.wave, U.m())),
      statTile(tr('Давление', 'Pressure', 'Pritisak'), fmt(e.pressure, U.hpa())),
      statTile(tr('Тренд давления', 'Pressure trend', 'Trend pritiska'), trendLabel(e.trend))));
    c.appendChild(small(tr('Луна', 'Moon', 'Mjesec') + ': ' + moonPhaseName(e.moon == null ? 0 : e.moon)));

    if (S.editNote === e.id) {
      const ta = h('textarea', { class: 'field', rows: 3 }, e.note || '');
      c.appendChild(ta);
      c.appendChild(h('div', { class: 'row' },
        btn(tr('Сохранить', 'Save', 'Sačuvaj'), () => { Diary.update(e.id, { note: ta.value.trim() }); S.editNote = null; A.rerender(); }, { primary: true }),
        btn(tr('Отмена', 'Cancel', 'Otkaži'), () => { S.editNote = null; A.rerender(); })));
    } else {
      if (e.note) c.appendChild(h('p', null, '💬 ' + e.note));
      c.appendChild(h('div', { class: 'row wrap' },
        btn(e.note ? tr('Изменить комментарий', 'Edit comment', 'Izmijeni komentar') : tr('Добавить комментарий', 'Add comment', 'Dodaj komentar'), () => { S.editNote = e.id; A.rerender(); }),
        btn(tr('Удалить запись', 'Delete entry', 'Obriši zapis'), () => {
          if (confirm(tr('Удалить эту запись?', 'Delete this entry?', 'Obrisati ovaj zapis?'))) { Diary.remove(e.id); A.rerender(); }
        }, { danger: true })));
    }
    wrap.appendChild(c);
  });
  return wrap;
}

function diaryStatsView(S, A, entries) {
  const wrap = h('div', { class: 'stack' });
  wrap.appendChild(card(tr('Статистика', 'Statistics', 'Statistika'), diaryStats(entries).map(l => h('p', null, l))));

  const status = h('p', { class: 'small' }, S.diaryMsg || '');
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'hidden', onchange: async ev => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    try {
      const n = await restoreBackup(f);
      S.diaryMsg = tr(`Восстановлено записей: ${n}`, `Entries restored: ${n}`, `Vraćeno zapisa: ${n}`);
      A.rerender();
    } catch (e) { status.textContent = tr('Не удалось прочитать файл копии', 'Could not read the backup file', 'Nije moguće pročitati datoteku kopije'); }
  } });
  wrap.appendChild(card(tr('Резервная копия', 'Backup', 'Rezervna kopija'),
    h('p', null, tr('Дневник хранится только в этом браузере. Если очистить данные сайта или удалить приложение с экрана, он пропадёт. Делайте копию время от времени.',
      'The diary is stored only in this browser. If you clear the site data or remove the app from the home screen, it is lost. Make a backup from time to time.',
      'Dnevnik se čuva samo u ovom pregledniku. Ako obrišete podatke sajta ili uklonite aplikaciju s početnog ekrana, nestaje. Povremeno napravite kopiju.')),
    h('div', { class: 'row wrap' },
      btn(tr('Сохранить копию', 'Save backup', 'Sačuvaj kopiju'), async () => {
        status.textContent = '…';
        const blob = await buildBackup();
        await saveFile('sea-fishing-backup-' + nowLocal().date + '.json', blob);
        status.textContent = tr('Копия готова', 'Backup ready', 'Kopija je spremna');
      }, { primary: true }),
      btn(tr('Восстановить из копии', 'Restore from backup', 'Vrati iz kopije'), () => fileInput.click())),
    fileInput, status));

  wrap.appendChild(card(tr('Экспорт дневника', 'Export diary', 'Izvoz dnevnika'),
    h('div', { class: 'row wrap' },
      btn(tr('Сохранить файл (CSV)', 'Save file (CSV)', 'Sačuvaj datoteku (CSV)'),
        () => saveFile('sea-fishing-diary.csv', new Blob([diaryCsv(entries)], { type: 'text/csv' }))),
      btn(tr('Отправить текстом', 'Send as text', 'Pošalji kao tekst'), async () => {
        const text = diaryText(entries);
        try {
          if (navigator.share) await navigator.share({ title: tr('Дневник уловов', 'Catch diary', 'Dnevnik ulova'), text });
          else { await navigator.clipboard.writeText(text); status.textContent = tr('Скопировано', 'Copied', 'Kopirano'); }
        } catch (e) { /* отмена */ }
      }))));
  return wrap;
}

// ---------------- Настройки ----------------
function renderSettings(S, A) {
  const out = [];
  out.push(h('div', { class: 'row head' },
    btn(tr('← Готово', '← Done', '← Gotovo'), () => A.closeSettings(), { primary: true }),
    h('h2', { class: 'page inline' }, tr('Рыбалка и место', 'Fishing and location', 'Ribolov i lokacija'))));

  out.push(card(tr('Язык', 'Language', 'Jezik'), segmented(LANGS.map(l => [l.code, l.label]), Lang.current, code => { Lang.set(code); S.diaryMsg = ''; A.rerender(); })));

  out.push(card(tr('Тема', 'Theme', 'Tema'),
    segmented([[0, tr('Море', 'Sea', 'More')], [1, tr('Светлая', 'Light', 'Svijetla')], [2, tr('Песок', 'Sand', 'Pijesak')]], S.theme, k => { S.theme = k; Store.set('theme', k); A.applyTheme(); A.rerender(); }),
    small(tr('«Море»: синяя, светлая или тёмная по настройке телефона. «Светлая»: белый фон и тёмный текст. «Песок»: тёплый бежевый фон.',
      '“Sea”: blue, light or dark following the phone setting. “Light”: white background and dark text. “Sand”: a warm beige background.',
      '„More“: plava, svijetla ili tamna prema postavci telefona. „Svijetla“: bijela pozadina i tamni tekst. „Pijesak“: topla bež pozadina.'))));

  out.push(card(tr('Фон', 'Background', 'Pozadina'),
    segmented([['video', tr('Видео', 'Video', 'Video')], ['fish', tr('Рыбки', 'Fish', 'Ribe')], ['off', tr('Выкл', 'Off', 'Isključeno')]], Bg.mode(), v => { Bg.set(v); A.rerender(); }),
    small(tr('«Видео»: лодка и тунец под водой. «Рыбки»: лёгкая анимация, меньше нагрузка на телефон. Выключите, если телефон быстро садится.',
      '“Video”: a boat and a tuna under water. “Fish”: a light animation that is easier on the phone. Turn it off if your phone drains quickly.',
      '„Video“: čamac i tunj pod vodom. „Ribe“: lagana animacija, manje opterećuje telefon. Isključite ako se telefon brzo prazni.'))));

  const fromShore = tr('С берега', 'From shore', 'S obale'), fromBoat = tr('С лодки', 'From boat', 'Sa čamca');
  out.push(card(tr('Рыбалка', 'Fishing', 'Ribolov'),
    segmented([[false, fromShore], [true, fromBoat]], S.boat, v => A.setBoat(v)),
    h('label', { class: 'lab' }, tr('Рыба', 'Fish', 'Riba'),
      select(fishFor(S.boat).map(f => [f.name, fishLabel(f.name)]), S.fish.name, v => A.setFish(v)))));

  const spots = regionSpots(S.region);
  const loc = card(tr('Место', 'Location', 'Lokacija'));
  loc.appendChild(h('div', { class: 'chips' }, REGIONS.map(r =>
    h('button', { class: 'btn' + (r.key === S.region ? ' primary' : ''), type: 'button', onclick: () => A.setRegion(r.key) }, regionLabel(r.key)))));
  loc.appendChild(h('div', { class: 'seg' }, spots.map((spot, i) => {
    const allowed = S.boat || i === 0;
    const on = spot.lat === S.selected.lat && spot.lon === S.selected.lon;
    return h('button', { class: 'btn' + (on ? ' primary' : ''), type: 'button', disabled: !allowed, onclick: () => A.select(spot) }, spotLabel(spot.name));
  })));
  loc.appendChild(small(S.region === 'Херцег-Нови'
    ? tr('Берег: Зеленика. 3 км: центр залива. 15 км: открытое море к юго-западу от острова Мамула. Точки «3 км» и «15 км» доступны только при рыбалке с лодки.',
      'Shore: Zelenika. 3 km: centre of the bay. 15 km: open sea to the south-west of Mamula island. The “3 km” and “15 km” points are available only when fishing from a boat.',
      'Obala: Zelenika. 3 km: sredina zaliva. 15 km: otvoreno more jugozapadno od ostrva Mamula. Tačke „3 km“ i „15 km“ dostupne su samo za ribolov sa čamca.')
    : tr('Берег: у береговой линии района. 3 км и 15 км: точки в море примерно на юго-запад от берега (только при рыбалке с лодки). Если нужна другая точка, выберите её на карте.',
      'Shore: at the coastline of the area. 3 km and 15 km: sea points roughly south-west of the shore (boat fishing only). For another point, pick it on the map.',
      'Obala: uz obalu područja. 3 km i 15 km: tačke na moru otprilike jugozapadno od obale (samo za ribolov sa čamca). Za drugu tačku izaberite je na karti.')));
  loc.appendChild(btn(S.gps.loading ? tr('Определяю позицию…', 'Locating…', 'Određujem poziciju…') : tr('Определить моё место (GPS)', 'Find my location (GPS)', 'Odredi moju lokaciju (GPS)'),
    () => A.gps(), { disabled: S.gps.loading, cls: 'full' }));
  loc.appendChild(btn(tr('🗺 Указать место на карте вручную', '🗺 Set location on the map manually', '🗺 Ručno odredi lokaciju na karti'),
    () => A.pickOnMap({ kind: 'location', label: tr('моё текущее место', 'my current location', 'moja trenutna lokacija') }), { cls: 'full' }));
  const gt = gpsText(S);
  if (gt) loc.appendChild(h('p', null, gt));
  loc.appendChild(small(`${tr('Точка', 'Point', 'Tačka')}: ${spotLabel(S.selected.name)} (${S.selected.lat.toFixed(4)}, ${S.selected.lon.toFixed(4)})`));
  out.push(loc);

  // Мои места
  const my = card(tr('Мои места', 'My spots', 'Moja mjesta'));
  if (!S.mySpots.length) my.appendChild(h('p', null, tr('Пока пусто. Выбери точку, введи название и сохрани (или сохрани прямо на карте).',
    'Nothing here yet. Pick a point, enter a name and save it (or save it right on the map).',
    'Za sada je prazno. Izaberi tačku, unesi naziv i sačuvaj je (ili sačuvaj direktno na karti).')));
  S.mySpots.forEach((s, i) => {
    const on = s.lat === S.selected.lat && s.lon === S.selected.lon;
    my.appendChild(h('div', { class: 'row' },
      h('button', { class: 'btn grow' + (on ? ' primary' : ''), type: 'button', onclick: () => A.select(s) }, s.name),
      btn(tr('Удалить', 'Delete', 'Obriši'), () => A.removeSpot(i), { flat: true })));
  });
  const nameInput = h('input', { class: 'field', type: 'text', maxlength: 40, placeholder: tr('Название места', 'Spot name', 'Naziv mjesta') });
  my.appendChild(nameInput);
  my.appendChild(btn(tr('Сохранить текущую точку', 'Save current point', 'Sačuvaj trenutnu tačku'), () => {
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    A.addSpot({ name, lat: S.selected.lat, lon: S.selected.lon });
  }, { primary: true }));
  out.push(my);

  out.push(aboutCard(S, A));
  return out;
}

function gpsText(S) {
  const acc = S.gps.acc;
  switch (S.gps.code) {
    case 1: return tr('Не удалось получить позицию. Включи геолокацию на телефоне, выйди на открытое место и попробуй снова. Если GPS не работает, нажми «Указать место на карте вручную».',
      'Could not get your position. Turn on location on your phone, go to an open area and try again. If GPS does not work, tap “Set location on the map manually”.',
      'Nije moguće dobiti poziciju. Uključi lokaciju na telefonu, izađi na otvoreno i pokušaj ponovo. Ako GPS ne radi, pritisni „Ručno odredi lokaciju na karti“.');
    case 2: return tr(`Позиция определена, точность ±${acc} м.`, `Position found, accuracy ±${acc} m.`, `Pozicija određena, tačnost ±${acc} m.`);
    case 3: return tr(`Позиция определена, но точность низкая (±${acc} м). Выйди на открытое место и повтори.`, `Position found, but accuracy is low (±${acc} m). Go to an open area and try again.`, `Pozicija određena, ali je tačnost niska (±${acc} m). Izađi na otvoreno i pokušaj ponovo.`);
    case 5: return tr('Нет разрешения на определение местоположения. Разрешите его для этого сайта в настройках телефона (Safari → Геопозиция).',
      'Location permission denied. Allow it for this site in the phone settings (Safari → Location).',
      'Nema dozvole za određivanje lokacije. Dozvolite je za ovaj sajt u postavkama telefona (Safari → Lokacija).');
    default: return null;
  }
}

function aboutCard(S, A) {
  const c = card(tr('О приложении', 'About', 'O aplikaciji'),
    h('a', { class: 'link', href: '#', onclick: e => { e.preventDefault(); S.aboutOpen = !S.aboutOpen; A.rerender(); } },
      S.aboutOpen ? tr('Свернуть ▲', 'Collapse ▲', 'Skupi ▲') : tr('Показать ▼', 'Show ▼', 'Prikaži ▼')));
  if (!S.aboutOpen) return c;
  c.appendChild(h('p', { class: 'bold' }, tr('Морская рыбалка · Адриатика', 'Sea fishing · Adriatic', 'Morski ribolov · Jadran') + ' · web ' + APP_VERSION));
  c.appendChild(h('p', { class: 'bold' }, tr('Безопасность', 'Safety', 'Sigurnost')));
  c.appendChild(h('p', null, tr(
    'Прогноз клёва и погоды считается по модели и открытым данным. Это ориентир, а не гарантия. Условия на море могут измениться быстрее прогноза. Перед выходом в море проверьте официальный морской прогноз, скажите близким, куда вы идёте, берите спасательный жилет и телефон. Решение о выходе на воду вы принимаете сами.',
    'The bite and weather forecast is calculated from a model and open data. It is a guide, not a guarantee. Conditions at sea can change faster than the forecast. Before going out, check the official marine forecast, tell someone where you are going, and take a life jacket and a phone. The decision to go on the water is yours.',
    'Prognoza ulova i vremena računa se po modelu i otvorenim podacima. To je orijentir, a ne garancija. Uslovi na moru mogu se promijeniti brže od prognoze. Prije izlaska na more provjerite zvaničnu pomorsku prognozu, javite bliskima kuda idete, ponesite prsluk za spasavanje i telefon. Odluku o izlasku na vodu donosite sami.')));
  c.appendChild(h('p', { class: 'bold' }, tr('Правила', 'Rules', 'Pravila')));
  c.appendChild(h('p', null, tr(
    'Сведения о правилах рыбалки собраны из открытых публикаций и могут устареть. Это не юридическая консультация. Актуальные правила уточняйте в рыболовном клубе или в Министерстве сельского хозяйства Черногории.',
    'The fishing rules information is collected from public sources and may be out of date. It is not legal advice. Check current rules with a fishing club or the Ministry of Agriculture of Montenegro.',
    'Podaci o pravilima ribolova prikupljeni su iz javnih izvora i mogu biti zastarjeli. To nije pravni savjet. Važeća pravila provjerite u ribolovačkom klubu ili u Ministarstvu poljoprivrede Crne Gore.')));
  c.appendChild(h('p', { class: 'bold' }, tr('Источники данных', 'Data sources', 'Izvori podataka')));
  c.appendChild(h('p', { class: 'pre' }, tr(
    '• Погода, волны, температура воды, течения: Open-Meteo.com (CC BY 4.0). Температура и волны для моря это модельные значения, а не измерения у вашего берега.\n• Глубины: EMODnet Bathymetry. Сетка около 100–250 м, у самого берега глубину она может занижать или завышать.\n• Спутниковая карта и названия: Esri World Imagery и Esri Reference.\n• Карта: библиотека Leaflet.\n• Фото рыб: Википедия и Wikimedia Commons, свободные лицензии.',
    '• Weather, waves, water temperature, currents: Open-Meteo.com (CC BY 4.0). Sea temperature and waves are model values, not measurements at your shore.\n• Depths: EMODnet Bathymetry. A grid of about 100–250 m, so near the shore it may under- or overstate the depth.\n• Satellite map and names: Esri World Imagery and Esri Reference.\n• Map: the Leaflet library.\n• Fish photos: Wikipedia and Wikimedia Commons, free licences.',
    '• Vrijeme, talasi, temperatura vode, struje: Open-Meteo.com (CC BY 4.0). Temperatura mora i talasi su modelske vrijednosti, a ne mjerenja uz vašu obalu.\n• Dubine: EMODnet Bathymetry. Mreža od oko 100–250 m, pa uz samu obalu može podcijeniti ili precijeniti dubinu.\n• Satelitska karta i nazivi: Esri World Imagery i Esri Reference.\n• Karta: biblioteka Leaflet.\n• Fotografije riba: Wikipedia i Wikimedia Commons, slobodne licence.')));
  c.appendChild(h('p', { class: 'bold' }, tr('Конфиденциальность', 'Privacy', 'Privatnost')));
  c.appendChild(h('p', null, tr(
    'Аккаунта нет. Дневник, фото и настройки хранятся только в браузере вашего телефона и никуда не отправляются. Для данных сайт отправляет координаты выбранной точки сервисам погоды, карт и глубин. Статистику посещений это приложение не собирает; сайт размещён на GitHub Pages, и GitHub может вести собственные технические журналы. Делайте резервную копию дневника: данные Safari и значка на домашнем экране хранятся раздельно, а при очистке данных сайта дневник пропадает.',
    'There is no account. The diary, photos and settings are stored only in your phone’s browser and are not sent anywhere. To get data, the site sends the coordinates of the selected point to the weather, map and depth services. This app does not collect visit statistics; the site is hosted on GitHub Pages, and GitHub may keep its own technical logs. Back up your diary: Safari and the home-screen icon keep their data separately, and clearing site data deletes the diary.',
    'Nema naloga. Dnevnik, fotografije i postavke čuvaju se samo u pregledniku vašeg telefona i nigdje se ne šalju. Za podatke sajt šalje koordinate izabrane tačke servisima za vrijeme, karte i dubine. Ova aplikacija ne prikuplja statistiku posjeta; sajt je na GitHub Pages, a GitHub može voditi vlastite tehničke zapise. Pravite rezervnu kopiju dnevnika: Safari i ikona na početnom ekranu čuvaju podatke odvojeno, a brisanjem podataka sajta dnevnik nestaje.')));
  c.appendChild(h('p', { class: 'bold' }, 'Android'));
  c.appendChild(h('p', null, h('a', { class: 'link', href: ANDROID_APK }, tr('Скачать версию для Android (APK)', 'Download the Android version (APK)', 'Preuzmi Android verziju (APK)'))));
  return c;
}
