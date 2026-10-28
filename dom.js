// Мелкие помощники для построения экрана без библиотек
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v === false || v == null) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  const add = c => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(add);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  };
  kids.forEach(add);
  return el;
}

const card = (title, ...kids) => h('section', { class: 'card' }, title ? h('h3', null, title) : null, ...kids);
const small = (...kids) => h('p', { class: 'small' }, ...kids);
const infoRow = (label, value) => h('div', { class: 'info' }, h('span', { class: 'lbl' }, label), h('span', { class: 'val' }, value));
const statTile = (label, value) => h('div', { class: 'tile' }, h('div', { class: 'small' }, label), h('div', { class: 'tv' }, value));

function btn(label, onclick, opts = {}) {
  return h('button', {
    class: 'btn' + (opts.primary ? ' primary' : '') + (opts.flat ? ' flat' : '') + (opts.danger ? ' danger' : '') + (opts.cls ? ' ' + opts.cls : ''),
    type: 'button', disabled: opts.disabled, onclick
  }, label);
}

// Ряд кнопок-переключателей: текущая закрашена
function segmented(items, current, onPick) {
  return h('div', { class: 'seg' }, items.map(([key, label, disabled]) =>
    h('button', {
      class: 'btn' + (key === current ? ' primary' : ''), type: 'button', disabled,
      onclick: () => { if (key !== current) onPick(key); }
    }, label)));
}

function select(options, current, onChange) {
  const s = h('select', { class: 'field', onchange: e => onChange(e.target.value) },
    options.map(([v, label]) => h('option', { value: v }, label)));
  s.value = current;
  return s;
}

// Сохранить файл (на iPhone через меню «Поделиться», на остальных обычной загрузкой)
async function saveFile(name, blob) {
  try {
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return true;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return true;
  }
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 4000);
  return true;
}
