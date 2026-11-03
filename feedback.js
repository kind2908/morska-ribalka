// Обратная связь: письмо на почту или сообщение в Telegram.
// Сервера нет: человек сам видит текст в почте или в чате и сам его отправляет.
const FEEDBACK_EMAIL = 'kind2908k@gmail.com';
const FEEDBACK_TG = 'https://t.me/tamtam2908';
const TOPIC_RULES = 1, TOPIC_FISH = 2, TOPIC_IDEA = 5;

function fbTopics() {
  return [
    tr('Перевод', 'Translation', 'Prevod'),
    tr('Законы и правила', 'Laws and rules', 'Zakoni i pravila'),
    tr('Рыба', 'Fish', 'Riba'),
    tr('Место или район', 'Place or area', 'Mjesto ili oblast'),
    tr('Ошибка в приложении', 'App error', 'Greška u aplikaciji'),
    tr('Идея', 'Idea', 'Ideja')
  ];
}

// Служебная строка в конце сообщения: по ней видно, о какой версии, языке и районе речь
function fbText(S, f) {
  const info = ['Sea Fishing web ' + APP_VERSION, 'lang ' + Lang.current,
    Country.code + ' · ' + regionLabel(S.region)].join(' · ');
  const head = fbTopics()[f.topic] + (f.about ? ': ' + f.about : '');
  return head + '\n\n' + f.text.trim() + '\n\n---\n' + info;
}

// id: где открыта форма (настройки, правила, рыба); always: форма видна без ссылки
function feedbackForm(S, rerender, id, topic, about, always) {
  const f = S.fb && S.fb.id === id ? S.fb : null;
  if (!f && !always) {
    return h('p', { class: 'small' }, h('a', { class: 'link', href: '#', onclick: e => {
      e.preventDefault(); S.fb = { id, topic, about, text: '' }; rerender();
    } }, tr('Нашли неточность? Сообщите', 'Spotted a mistake? Tell us', 'Primijetili ste grešku? Javite nam')));
  }
  const cur = f || { id, topic, about, text: '' };
  const status = small('');
  const ta = h('textarea', { class: 'field', rows: 4,
    placeholder: tr('Что исправить или добавить', 'What to fix or add', 'Šta ispraviti ili dodati'),
    oninput: e => { cur.text = e.target.value; S.fb = cur; } }, cur.text);
  const empty = () => {
    if (cur.text.trim()) return false;
    status.textContent = tr('Напишите, что исправить или добавить', 'Write what to fix or add', 'Napišite šta ispraviti ili dodati');
    return true;
  };
  return h('div', { class: 'fb' },
    about ? h('p', { class: 'bold' }, about) : null,
    h('div', { class: 'chips' }, fbTopics().map((name, i) =>
      h('button', { class: 'chip' + (cur.topic === i ? ' on' : ''), type: 'button',
        onclick: () => { cur.topic = i; S.fb = cur; rerender(); } }, name))),
    ta,
    small(tr('К сообщению добавятся версия приложения, язык, страна и район. Перед отправкой вы увидите весь текст.',
      'The app version, language, country and area are added to the message. You will see the whole text before sending.',
      'Poruci se dodaju verzija aplikacije, jezik, država i oblast. Prije slanja vidjet ćete cijeli tekst.')),
    h('div', { class: 'row wrap' },
      btn(tr('Отправить письмом', 'Send by email', 'Pošalji e-poštom'), () => {
        if (empty()) return;
        location.href = 'mailto:' + FEEDBACK_EMAIL + '?subject=' + encodeURIComponent('Sea Fishing: ' + fbTopics()[cur.topic]) +
          '&body=' + encodeURIComponent(fbText(S, cur));
      }, { primary: true }),
      // В Telegram нельзя передать готовый текст в личный чат, поэтому копируем его и открываем чат
      btn(tr('Написать в Telegram', 'Write in Telegram', 'Pišite u Telegram'), async () => {
        if (empty()) return;
        try {
          await navigator.clipboard.writeText(fbText(S, cur));
          status.textContent = tr('Текст скопирован. Вставьте его в чат', 'Text copied. Paste it into the chat', 'Tekst je kopiran. Zalijepite ga u razgovor');
        } catch (e) { /* без буфера просто откроем чат */ }
        window.open(FEEDBACK_TG, '_blank');
      }),
      always ? null : btn(tr('Отмена', 'Cancel', 'Otkaži'), () => { S.fb = null; rerender(); }, { flat: true })),
    status);
}

function feedbackCard(S, rerender) {
  return card(tr('Обратная связь', 'Feedback', 'Povratne informacije'),
    small(tr('Нашли ошибку в переводе, законах или описании рыбы, хотите новый район или есть идея? Напишите нам, мы читаем всё.',
      'Found a mistake in a translation, the laws or a fish description, want a new area or have an idea? Write to us, we read everything.',
      'Našli ste grešku u prevodu, zakonima ili opisu ribe, želite novu oblast ili imate ideju? Pišite nam, čitamo sve.')),
    feedbackForm(S, rerender, 'settings', TOPIC_IDEA, '', true),
    small('✉ ' + FEEDBACK_EMAIL + '  ·  Telegram @tamtam2908'));
}
