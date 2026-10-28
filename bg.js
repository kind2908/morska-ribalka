// Анимированный подводный фон: лучи света, волны, рыбки, пузыри и планктон.
// Рисуется на canvas позади всего приложения. Можно отключить в настройках.
const Bg = (() => {
  let cv = null, ctx = null, W = 0, H = 0, dpr = 1, raf = 0, last = 0, t = 0;
  let mode = 'video', held = false, pal = null, grad = null, vid = null, veil = null;
  let fish = [], bubbles = [], dust = [], rays = [];
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rnd = (a, b) => a + Math.random() * (b - a);

  function palette() {
    const th = document.documentElement.dataset.theme || 'sea';
    const dark = th === 'sea' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    if (th === 'light') return { top: '#f3f9fc', bot: '#c9e0ea', ray: '255,255,255', rayA: .55, wave: '11,92,142', waveA: .07, fish: '11,92,142', fishA: .18, bub: '11,92,142', bubA: .22, dust: '11,92,142' };
    if (th === 'sand') return { top: '#f8efdd', bot: '#e4d0a8', ray: '255,255,255', rayA: .5, wave: '138,75,20', waveA: .07, fish: '138,75,20', fishA: .18, bub: '138,75,20', bubA: .22, dust: '138,75,20' };
    if (dark) return { top: '#0f4d73', bot: '#03101a', ray: '190,230,255', rayA: .16, wave: '130,205,240', waveA: .13, fish: '160,215,245', fishA: .36, bub: '200,235,255', bubA: .38, dust: '200,235,255' };
    return { top: '#86c9ea', bot: '#1f72a4', ray: '255,255,255', rayA: .20, wave: '255,255,255', waveA: .16, fish: '7,55,90', fishA: .30, bub: '255,255,255', bubA: .5, dust: '255,255,255' };
  }

  function seed() {
    fish = []; bubbles = []; dust = []; rays = [];
    const area = W * H, k = Math.max(.7, Math.min(1.6, area / (390 * 800)));
    const lone = Math.round(6 * k);
    for (let i = 0; i < lone; i++) {
      const far = Math.random() < .5;
      fish.push(mkFish(rnd(0, W), rnd(H * .16, H * .78), far ? rnd(11, 18) : rnd(20, 34), far ? rnd(14, 26) : rnd(30, 56), Math.random() < .5 ? 1 : -1, far ? .55 : 1));
    }
    for (let g = 0; g < 2; g++) {
      const dir = Math.random() < .5 ? 1 : -1, x = rnd(0, W), y = rnd(H * .2, H * .7), sp = rnd(26, 38);
      for (let j = 0; j < 5; j++) {
        const f = mkFish(x - dir * rnd(0, 70), y + rnd(-28, 28), rnd(9, 13), sp * rnd(.95, 1.05), dir, .6);
        f.school = true; fish.push(f);
      }
    }
    for (let i = 0; i < Math.round(22 * k); i++) bubbles.push(mkBubble(true));
    for (let i = 0; i < Math.round(46 * k); i++) dust.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(.6, 1.8), vx: rnd(-6, 6), vy: rnd(-4, 5), ph: rnd(0, 6.28) });
    for (let i = 0; i < 5; i++) rays.push({ x: rnd(-.1, 1.1) * W, w: rnd(40, 110) * Math.max(1, W / 500), sk: rnd(.25, .5), ph: rnd(0, 6.28), sp: rnd(.15, .35) });
  }
  function mkFish(x, y, s, v, dir, depth) {
    return { x, y, s, v, dir, depth, ph: rnd(0, 6.28), bob: rnd(5, 14), bs: rnd(.5, 1.1), y0: y };
  }
  function mkBubble(any) {
    return { x: rnd(0, W), y: any ? rnd(0, H) : H + 10, r: rnd(1.5, 5.5), v: rnd(16, 44), wob: rnd(4, 14), ph: rnd(0, 6.28) };
  }

  function resize() {
    if (!cv) return;
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    grad = null;
    seed();
    if (!raf) frame(performance.now(), true);
  }

  function drawFish(f) {
    const s = f.s, w = Math.sin(t * 7 * f.bs + f.ph) * s * .14;
    ctx.save();
    ctx.translate(f.x, f.y + Math.sin(t * f.bs + f.ph) * f.bob * .35);
    ctx.scale(f.dir, 1);
    ctx.beginPath();
    ctx.moveTo(.6 * s, 0);
    ctx.bezierCurveTo(.3 * s, -.44 * s, -.25 * s, -.36 * s, -.5 * s, -.06 * s);
    ctx.lineTo(-.88 * s, -.32 * s + w);
    ctx.quadraticCurveTo(-.7 * s, w * .5, -.88 * s, .32 * s + w);
    ctx.lineTo(-.5 * s, .06 * s);
    ctx.bezierCurveTo(-.25 * s, .36 * s, .3 * s, .44 * s, .6 * s, 0);
    ctx.closePath();
    ctx.fillStyle = `rgba(${pal.fish},${pal.fishA * f.depth})`;
    ctx.fill();
    // спинной плавник
    ctx.beginPath();
    ctx.moveTo(.15 * s, -.3 * s); ctx.lineTo(-.2 * s, -.58 * s + w * .3); ctx.lineTo(-.3 * s, -.28 * s);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function frame(ts, once) {
    raf = 0;
    if (!ctx || !pal) return;
    const dt = once ? 0 : Math.min((ts - last) / 1000, .1);
    last = ts; t += dt;

    if (!grad) { grad = ctx.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, pal.top); grad.addColorStop(1, pal.bot); }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // лучи света
    for (const r of rays) {
      const a = pal.rayA * (.55 + .45 * Math.sin(t * r.sp + r.ph));
      const x = r.x + Math.sin(t * r.sp * .6 + r.ph) * 30, len = H * .85;
      const g = ctx.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, `rgba(${pal.ray},${a})`); g.addColorStop(1, `rgba(${pal.ray},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x + r.w, 0);
      ctx.lineTo(x + r.w * 2 + len * r.sk, len); ctx.lineTo(x + len * r.sk, len);
      ctx.closePath(); ctx.fill();
    }

    // волны у поверхности
    for (let i = 0; i < 3; i++) {
      const base = 10 + i * 13, amp = 5 + i * 2, sp = (.5 + i * .25) * (i % 2 ? -1 : 1), len = 90 + i * 55;
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, base + Math.sin(x / len * 6.28 + t * sp * 1.6 + i) * amp);
      ctx.lineTo(W, 0); ctx.closePath();
      ctx.fillStyle = `rgba(${pal.wave},${pal.waveA * (1 - i * .22)})`; ctx.fill();
    }

    // планктон
    ctx.fillStyle = `rgba(${pal.dust},.35)`;
    for (const d of dust) {
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.x < -5) d.x = W + 5; else if (d.x > W + 5) d.x = -5;
      if (d.y < -5) d.y = H + 5; else if (d.y > H + 5) d.y = -5;
      ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * .8 + d.ph));
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // рыбки
    for (const f of fish) {
      f.x += f.v * f.dir * dt;
      if (f.dir > 0 && f.x > W + f.s * 2) { f.x = -f.s * 2; if (!f.school) f.y = rnd(H * .16, H * .78); }
      else if (f.dir < 0 && f.x < -f.s * 2) { f.x = W + f.s * 2; if (!f.school) f.y = rnd(H * .16, H * .78); }
      drawFish(f);
    }

    // пузыри
    ctx.lineWidth = 1;
    for (const b of bubbles) {
      b.y -= b.v * dt;
      if (b.y < -10) Object.assign(b, mkBubble(false));
      const x = b.x + Math.sin(t * 1.3 + b.ph) * b.wob;
      ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, 6.283);
      ctx.fillStyle = `rgba(${pal.bub},${pal.bubA * .22})`; ctx.fill();
      ctx.strokeStyle = `rgba(${pal.bub},${pal.bubA})`; ctx.stroke();
      ctx.beginPath(); ctx.arc(x - b.r * .35, b.y - b.r * .35, b.r * .25, 0, 6.283);
      ctx.fillStyle = `rgba(${pal.bub},${pal.bubA})`; ctx.fill();
    }

    if (!once && !reduce && mode === 'fish' && !held && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function tick(ts) { if (ts - last < 32) { raf = requestAnimationFrame(tick); return; } frame(ts, false); }

  // ---- видеофон ----
  function ensureVideo() {
    if (vid) return vid;
    vid = document.createElement('video');
    vid.id = 'bgv'; vid.setAttribute('aria-hidden', 'true');
    vid.muted = true; vid.loop = true; vid.playsInline = true; vid.autoplay = true;
    vid.setAttribute('muted', ''); vid.setAttribute('playsinline', ''); vid.setAttribute('webkit-playsinline', '');
    vid.preload = 'auto';
    vid.addEventListener('error', () => fallback());
    veil = document.createElement('div'); veil.id = 'bgveil';
    document.body.prepend(veil); document.body.prepend(vid);
    return vid;
  }
  // если видео не запустилось (экономия заряда, старый браузер), показываем рыбок
  function fallback() { if (mode === 'video') { mode = 'fish'; run(); } }

  function run() {
    if (!cv) return;
    const showVideo = mode === 'video', showFish = mode === 'fish';
    cv.style.display = showFish ? 'block' : 'none';
    document.body.classList.toggle('has-bg', mode !== 'off');
    if (showVideo) {
      ensureVideo();
      // на широком экране (компьютер) горизонтальный ролик, на телефоне вертикальный
      const want = window.innerWidth / window.innerHeight > 1.15 ? 'bg-wide.mp4' : 'bg.mp4';
      if (vid.getAttribute('data-src') !== want) { vid.setAttribute('data-src', want); vid.src = want; }
      vid.style.display = 'block'; veil.style.display = 'block';
      if (held || document.hidden) vid.pause();
      else { const p = vid.play(); if (p && p.catch) p.catch(() => fallback()); }
    } else if (vid) { vid.pause(); vid.style.display = 'none'; veil.style.display = 'none'; }
    if (!showFish) { if (raf) cancelAnimationFrame(raf); raf = 0; return; }
    pal = palette(); grad = null;
    if (reduce || held || document.hidden) { if (!raf) frame(performance.now(), true); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  return {
    init() {
      const saved = Store.get('bg_mode', null);
      mode = saved === 'video' || saved === 'fish' || saved === 'off' ? saved : (Store.get('bg_anim', true) === false ? 'off' : 'video');
      if (reduce && mode === 'video') mode = 'fish';
      cv = document.createElement('canvas');
      cv.id = 'bg'; cv.setAttribute('aria-hidden', 'true');
      document.body.prepend(cv);
      ctx = cv.getContext('2d');
      if (!ctx) { cv.remove(); cv = null; return; }
      resize();
      let rt = 0;
      window.addEventListener('resize', () => { resize(); clearTimeout(rt); rt = setTimeout(run, 150); });
      document.addEventListener('visibilitychange', run);
      run();
    },
    mode() { return mode; },
    set(m) { mode = m; Store.set('bg_mode', m); run(); },
    hold(v) { if (held === !!v) return; held = !!v; run(); },
    theme() { if (!cv) return; pal = palette(); grad = null; if (!raf) frame(performance.now(), true); }
  };
})();
