/* ===== PHÒNG THÍ NGHIỆM — Tín hiệu & Hệ thống =====
   Tải lười bởi tin-hieu.js. API: LAB.toggle(soBai, forceOpen, chỉSốTab), LAB.isOpen().
   Thêm bài mới: LAB.register(soBai, { title, tabs:[{name,tip,build(ui)}] }). */
(function () {
  'use strict';
  if (window.LAB) return;

  /* ---------- tiện ích ---------- */
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fx = (v, d = 1) => (Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v).toFixed(d).replace('-', '−');
  const tl = v => String(+(+v).toFixed(2)).replace('-', '−');
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const FONT = '11px "Roboto Mono", ui-monospace, Menlo, Consolas, monospace';
  let COL = {};
  function readColors() {
    const cs = getComputedStyle(document.documentElement), g = (n, d) => cs.getPropertyValue(n).trim() || d;
    COL = { bg: g('--bg', '#323437'), card: g('--sub-alt', '#2c2e31'), main: g('--main', '#e2b714'), sub: g('--sub', '#646669'),
      text: g('--text', '#d1d0c5'), err: g('--error', '#ca4754'), c1: g('--c1', '#6ea0ff'), c2: g('--c2', '#38d9a9'), grid: g('--g', '#3d4042') };
  }

  /* số phức [re, im] */
  const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1] || 1e-12; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const cabs = a => Math.hypot(a[0], a[1]);
  const carg = a => Math.atan2(a[1], a[0]);
  const cexp = a => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };

  /* đa thức (hệ số cao → thấp) */
  const polyMul = (a, b) => { const r = Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  const polyAdd = (a, b) => { const n = Math.max(a.length, b.length), r = Array(n).fill(0); a.forEach((x, i) => { r[n - a.length + i] += x; }); b.forEach((x, i) => { r[n - b.length + i] += x; }); return r; };
  const trim = p => { let i = 0; while (i < p.length - 1 && Math.abs(p[i]) < 1e-9) i++; return p.slice(i); };
  function polyEval(p, s) { let v = [0, 0]; for (const k of p) v = cadd(cmul(v, s), [k, 0]); return v; }
  function polyFromRoots(rs) {
    let p = [[1, 0]];
    for (const r of rs) {
      const q = Array(p.length + 1).fill(0).map(() => [0, 0]);
      p.forEach((c, i) => { q[i] = cadd(q[i], c); q[i + 1] = csub(q[i + 1], cmul(r, c)); });
      p = q;
    }
    return p.map(c => c[0]);
  }
  function polyRoots(p) {
    p = trim(p); const n = p.length - 1; if (n < 1) return [];
    const a = p.map(x => x / p[0]); const r = [];
    for (let i = 0; i < n; i++) { const g = TAU * i / n + .4; r.push([.9 * Math.cos(g) * (1 + i * .1), .9 * Math.sin(g) * (1 + i * .1)]); }
    for (let it = 0; it < 300; it++) {
      let mx = 0;
      for (let i = 0; i < n; i++) {
        let v = [1, 0]; for (let k = 1; k <= n; k++) v = cadd(cmul(v, r[i]), [a[k], 0]);
        let d = [1, 0]; for (let j = 0; j < n; j++) if (j !== i) d = cmul(d, csub(r[i], r[j]));
        const dl = cdiv(v, d); r[i] = csub(r[i], dl); mx = Math.max(mx, cabs(dl));
      }
      if (mx < 1e-13) break;
    }
    return r.map(z => [Math.abs(z[0]) < 1e-6 ? 0 : z[0], Math.abs(z[1]) < 1e-4 ? 0 : z[1]]);
  }
  /* mô phỏng H(s)=num/den bằng không gian trạng thái (RK4). mode: 'imp' | 'step' */
  function sim(num, den, mode, T, N) {
    num = trim(num); den = trim(den);
    const n = den.length - 1, out = new Float64Array(N + 1);
    const a = den.map(x => x / den[0]), nb = Array(n + 1).fill(0);
    num.map(x => x / den[0]).forEach((x, i) => { nb[n + 1 - num.length + i] = x; });
    const d = nb[0], bb = []; for (let k = 1; k <= n; k++) bb.push(nb[k] - d * a[k]);
    const u = mode === 'step' ? 1 : 0;
    if (n === 0) { out.fill(d * (mode === 'step' ? 1 : 0)); return out; }
    let x = Array(n).fill(0); if (mode === 'imp') x[n - 1] = 1;
    const f = z => { const r = Array(n); for (let i = 0; i < n - 1; i++) r[i] = z[i + 1]; let s = u; for (let k = 1; k <= n; k++) s -= a[k] * z[n - k]; r[n - 1] = s; return r; };
    const y = z => { let s = d * u; for (let k = 1; k <= n; k++) s += bb[k - 1] * z[n - k]; return s; };
    const sub = 5, h = T / N / sub;
    for (let i = 0; i <= N; i++) {
      out[i] = y(x);
      for (let q = 0; q < sub; q++) {
        const k1 = f(x), k2 = f(x.map((v, j) => v + h / 2 * k1[j])), k3 = f(x.map((v, j) => v + h / 2 * k2[j])), k4 = f(x.map((v, j) => v + h * k3[j]));
        x = x.map((v, j) => v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      }
    }
    return out;
  }

  /* ---------- hệ toạ độ & vẽ ---------- */
  function mkView(w, h, x0, x1, y0, y1, pad) {
    const P = Object.assign({ l: 34, r: 8, t: 8, b: 18 }, pad || {});
    const iw = w - P.l - P.r, ih = h - P.t - P.b;
    return { P, x0, x1, y0, y1, iw, ih,
      X: x => P.l + (x - x0) / (x1 - x0) * iw, Y: y => P.t + ih - (y - y0) / (y1 - y0) * ih,
      ix: px => x0 + (px - P.l) / iw * (x1 - x0), iy: py => y0 + (P.t + ih - py) / ih * (y1 - y0) };
  }
  const clipTo = (c, v) => { c.beginPath(); c.rect(v.P.l, v.P.t, v.iw, v.ih); c.clip(); };
  function ticks(a, b, n) {
    const raw = (b - a) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    const s = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p, out = [];
    for (let v = Math.ceil(a / s - 1e-9) * s; v <= b + 1e-9; v += s) out.push(Math.abs(v) < 1e-9 ? 0 : +v.toFixed(10));
    return out;
  }
  function axes(c, v, o = {}) {
    c.save(); c.font = FONT; c.lineWidth = 1;
    const xt = ticks(v.x0, v.x1, o.xn || Math.max(3, Math.round(v.iw / 70))), yt = ticks(v.y0, v.y1, o.yn || Math.max(2, Math.round(v.ih / 42)));
    c.strokeStyle = COL.grid; c.fillStyle = COL.sub; c.textAlign = 'center'; c.textBaseline = 'top';
    for (const x of xt) { const px = Math.round(v.X(x)) + .5; c.beginPath(); c.moveTo(px, v.P.t); c.lineTo(px, v.P.t + v.ih); c.stroke(); if (!o.noXL) c.fillText(o.xfmt ? o.xfmt(x) : tl(x), px, v.P.t + v.ih + 3); }
    c.textAlign = 'right'; c.textBaseline = 'middle';
    for (const y of yt) { const py = Math.round(v.Y(y)) + .5; c.beginPath(); c.moveTo(v.P.l, py); c.lineTo(v.P.l + v.iw, py); c.stroke(); if (!o.noYL) c.fillText(o.yfmt ? o.yfmt(y) : tl(y), v.P.l - 4, py); }
    c.strokeStyle = COL.sub;
    if (v.y0 < 0 && v.y1 > 0) { const py = Math.round(v.Y(0)) + .5; c.beginPath(); c.moveTo(v.P.l, py); c.lineTo(v.P.l + v.iw, py); c.stroke(); }
    if (v.x0 < 0 && v.x1 > 0) { const px = Math.round(v.X(0)) + .5; c.beginPath(); c.moveTo(px, v.P.t); c.lineTo(px, v.P.t + v.ih); c.stroke(); }
    c.fillStyle = COL.text; c.globalAlpha = .8;
    if (o.xl) { c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText(o.xl, v.P.l + v.iw - 3, v.P.t + v.ih - 2); }
    if (o.yl) { c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(o.yl, v.P.l + 4, v.P.t + 2); }
    c.restore();
  }
  function curve(c, v, f, a, b, col, lw = 2, n = 240, o = {}) {
    c.save(); clipTo(c, v); c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = 'round'; if (o.dash) c.setLineDash(o.dash);
    c.beginPath(); let pen = false, py = 0;
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n, y = f(x);
      if (!isFinite(y)) { pen = false; continue; }
      if (pen && o.jump && Math.abs(y - py) > o.jump) pen = false;
      const X = v.X(x), Y = v.Y(y); if (pen) c.lineTo(X, Y); else { c.moveTo(X, Y); pen = true; } py = y;
    }
    c.stroke(); c.restore();
  }
  const arrF = (arr, t0, dt) => x => arr[Math.round((x - t0) / dt)];
  function area(c, v, f, a, b, col, al = .22, n = 240) {
    c.save(); clipTo(c, v); c.fillStyle = col; c.globalAlpha = al; c.beginPath(); c.moveTo(v.X(a), v.Y(0));
    for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n, y = f(x); c.lineTo(v.X(x), v.Y(isFinite(y) ? y : 0)); }
    c.lineTo(v.X(b), v.Y(0)); c.closePath(); c.fill(); c.restore();
  }
  function param(c, v, f, a, b, col, lw = 2, n = 400, dash) {
    c.save(); clipTo(c, v); c.strokeStyle = col; c.lineWidth = lw; if (dash) c.setLineDash(dash); c.beginPath();
    for (let i = 0; i <= n; i++) { const p = f(a + (b - a) * i / n); const X = v.X(p[0]), Y = v.Y(p[1]); if (i) c.lineTo(X, Y); else c.moveTo(X, Y); }
    c.stroke(); c.restore();
  }
  function amp(fns, a, b, n, cap, floor) {
    let m = 0; for (const f of fns) for (let i = 0; i <= n; i++) { const y = f(a + (b - a) * i / n); if (isFinite(y)) m = Math.max(m, Math.abs(y)); }
    return clamp(m * 1.12, floor, cap);
  }
  const rngA = (arrs, cap, floor) => { let lo = 0, hi = 0; for (const r of arrs) for (const y of r) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); } hi = clamp(hi * 1.12, floor, cap); lo = -clamp(-lo * 1.12, floor * .15, cap); return [lo, hi]; };
  const ampA = (arrs, cap, floor) => { let m = 0; for (const r of arrs) for (const y of r) if (isFinite(y)) m = Math.max(m, Math.abs(y)); return clamp(m * 1.12, floor, cap); };
  function mark(c, t, x, y, col, ghost) {
    c.save(); c.globalAlpha = ghost ? .5 : 1; const r = 5.5;
    if (t === 'p') { for (const [s, w] of [[COL.bg, 4.5], [col, 2.2]]) { c.strokeStyle = s; c.lineWidth = w; c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x + r, y + r); c.moveTo(x + r, y - r); c.lineTo(x - r, y + r); c.stroke(); } }
    else if (t === 'z') { for (const [s, w] of [[COL.bg, 4.5], [col, 2.2]]) { c.strokeStyle = s; c.lineWidth = w; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); } }
    else { c.fillStyle = col; c.strokeStyle = COL.bg; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill(); c.stroke(); }
    c.restore();
  }
  /* mặt phẳng s: o = {tint, roc:[{a,b,col,alpha}], items:[{t,x,y,col,ghost}], vline:{x,col}} */
  function splane(c, v, o = {}) {
    c.save(); c.font = '10px "Roboto Mono", ui-monospace, monospace';
    const L = v.P.l, T = v.P.t, W = v.iw, H = v.ih; clipTo(c, v);
    if (o.tint) { const x0 = clamp(v.X(0), L, L + W); c.fillStyle = 'rgba(56,217,169,.07)'; c.fillRect(L, T, x0 - L, H); c.fillStyle = 'rgba(202,71,84,.08)'; c.fillRect(x0, T, L + W - x0, H); }
    for (const r of o.roc || []) {
      const a = Math.max(L, v.X(r.a)), b = Math.min(L + W, v.X(r.b)); if (b <= a) continue;
      c.save(); c.beginPath(); c.rect(a, T, b - a, H); c.clip(); c.fillStyle = r.col || COL.main; c.globalAlpha = r.alpha || .16; c.fillRect(a, T, b - a, H);
      c.globalAlpha = .35; c.strokeStyle = r.col || COL.main; c.lineWidth = 1; c.beginPath(); for (let x = a - H; x < b; x += 9) { c.moveTo(x, T + H); c.lineTo(x + H, T); } c.stroke(); c.restore();
    }
    c.strokeStyle = COL.grid; c.lineWidth = 1; c.fillStyle = COL.sub;
    for (const x of ticks(v.x0, v.x1, 7)) { const px = Math.round(v.X(x)) + .5; c.beginPath(); c.moveTo(px, T); c.lineTo(px, T + H); c.stroke(); }
    for (const y of ticks(v.y0, v.y1, 7)) { const py = Math.round(v.Y(y)) + .5; c.beginPath(); c.moveTo(L, py); c.lineTo(L + W, py); c.stroke(); }
    const x0 = v.X(0), y0 = v.Y(0);
    c.strokeStyle = COL.sub; c.beginPath(); c.moveTo(L, y0); c.lineTo(L + W, y0); c.stroke();
    c.strokeStyle = COL.main; c.lineWidth = 2; c.globalAlpha = .85; c.beginPath(); c.moveTo(x0, T); c.lineTo(x0, T + H); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = COL.sub; c.textAlign = 'center'; c.textBaseline = 'top';
    for (const x of ticks(v.x0, v.x1, 7)) if (x !== 0) c.fillText(tl(x), v.X(x), clamp(y0 + 3, T, T + H - 12));
    c.textAlign = 'right'; c.textBaseline = 'middle';
    for (const y of ticks(v.y0, v.y1, 7)) if (y !== 0) c.fillText('j' + tl(y), x0 - 4, v.Y(y));
    c.fillStyle = COL.text; c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText('σ', L + W - 4, y0 - 3);
    c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = COL.main; c.fillText('jω', x0 + 5, T + 3);
    if (o.vline) { c.strokeStyle = o.vline.col; c.lineWidth = 1.5; c.setLineDash([5, 4]); const px = v.X(o.vline.x); c.beginPath(); c.moveTo(px, T); c.lineTo(px, T + H); c.stroke(); c.setLineDash([]); }
    for (const it of o.items || []) mark(c, it.t, v.X(it.x), v.Y(it.y), it.col, it.ghost);
    c.restore();
  }
  /* bản đồ nhiệt */
  const STOPS = [[0, [22, 26, 44]], [.4, [44, 92, 150]], [.7, [56, 200, 160]], [1, [240, 200, 30]]];
  function cmap(t) {
    t = clamp(t, 0, 1);
    for (let i = 1; i < STOPS.length; i++) if (t <= STOPS[i][0]) { const [t0, a] = STOPS[i - 1], [t1, b] = STOPS[i], k = (t - t0) / (t1 - t0); return a.map((x, j) => x + (b[j] - x) * k); }
    return STOPS[STOPS.length - 1][1];
  }
  let heatCv = null;
  function heat(c, v, f) {
    const sc = 3, nx = Math.max(2, Math.ceil(v.iw / sc)), ny = Math.max(2, Math.ceil(v.ih / sc));
    heatCv = heatCv || document.createElement('canvas'); heatCv.width = nx; heatCv.height = ny;
    const g = heatCv.getContext('2d'), im = g.createImageData(nx, ny);
    for (let j = 0; j < ny; j++) { const y = v.iy(v.P.t + (j + .5) * v.ih / ny); for (let i = 0; i < nx; i++) {
      const x = v.ix(v.P.l + (i + .5) * v.iw / nx), m = cmap((Math.log10(f(x, y) + 1e-9) + 1.5) / 3), k = (j * nx + i) * 4;
      im.data[k] = m[0]; im.data[k + 1] = m[1]; im.data[k + 2] = m[2]; im.data[k + 3] = 255; } }
    g.putImageData(im, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(heatCv, v.P.l, v.P.t, v.iw, v.ih);
  }
  /* mặt |X(s)| dạng 3D */
  function surface(c, w, h, mag, az, el, pz) {
    const nS = 30, nW = 40, s0 = -4, s1 = 2, w0 = -4, w1 = 4, cap = 3.2, g = [];
    for (let i = 0; i <= nS; i++) { g[i] = []; for (let j = 0; j <= nW; j++) g[i][j] = Math.min(mag(s0 + (s1 - s0) * i / nS, w0 + (w1 - w0) * j / nW), cap) / cap; }
    const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el), S = Math.min(w / 3.1, h / 2.6), cx = w / 2, cy = h * .6;
    const P = (s, om, z) => { const X = (s + 1) / 4, Y = om / 4, xr = X * ca - Y * sa, yr = X * sa + Y * ca; return [cx + xr * S, cy - (z * ce * 1.1 + yr * se) * S, yr]; };
    const q = [];
    for (let i = 0; i < nS; i++) for (let j = 0; j < nW; j++) {
      const m = (g[i][j] + g[i + 1][j] + g[i][j + 1] + g[i + 1][j + 1]) / 4;
      const pts = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => P(s0 + (s1 - s0) * a / nS, w0 + (w1 - w0) * b / nW, g[a][b]));
      q.push({ pts, m, d: (pts[0][2] + pts[1][2] + pts[2][2] + pts[3][2]) / 4 });
    }
    q.sort((a, b) => b.d - a.d);
    c.save(); c.lineJoin = 'round';
    const fl = [[s0, w0], [s1, w0], [s1, w1], [s0, w1]].map(([s, o]) => P(s, o, 0));
    c.strokeStyle = COL.grid; c.lineWidth = 1; c.beginPath(); fl.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke();
    for (const k of q) { const m = cmap(.1 + .9 * Math.sqrt(k.m)); c.fillStyle = `rgb(${m[0] | 0},${m[1] | 0},${m[2] | 0})`; c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = .6; c.beginPath(); k.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.stroke(); }
    const i0 = Math.round((0 - s0) / (s1 - s0) * nS);
    c.strokeStyle = COL.main; c.lineWidth = 2.5; c.beginPath(); for (let j = 0; j <= nW; j++) { const p = P(0, w0 + (w1 - w0) * j / nW, g[i0][j]); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
    c.setLineDash([4, 4]); c.globalAlpha = .6; c.beginPath(); { const a = P(0, w0, 0), b = P(0, w1, 0); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    for (const it of pz) { const a = P(it.x, it.y, 0), b = P(it.x, it.y, it.t === 'p' ? 1 : 0); if (it.t === 'p') { c.strokeStyle = '#fff'; c.globalAlpha = .55; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.globalAlpha = 1; } mark(c, it.t, a[0], a[1], '#fff'); }
    c.restore();
  }
  function sub(c, y, h, fn) { c.save(); c.translate(0, y); fn(h); c.restore(); }
  function txt(c, s, x, y, col, al = 'left', bl = 'middle') { c.save(); c.font = FONT; c.fillStyle = col || COL.text; c.textAlign = al; c.textBaseline = bl; c.fillText(s, x, y); c.restore(); }

  /* ---------- Panel / UI ---------- */
  class Panel {
    constructor(title, area) {
      this.root = el('div', 'lab-pn'); if (area) this.root.style.gridArea = area;
      const head = el('div', 'lab-pt'); this.tag = el('span', 'lab-tgs'); head.append(el('span', '', title), this.tag);
      this.wrap = el('div', 'lab-cv'); this.cv = el('canvas'); this.wrap.append(this.cv); this.root.append(head, this.wrap);
      this.c = this.cv.getContext('2d'); this.w = 0; this.h = 0; this.hs = []; this.draw = null; this.onBg = null; this.onChange = null;
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.wrap);
      let drag = null, bg = null;
      const pos = e => { const r = this.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      const hit = (x, y) => { let best = null, bd = 1e9; for (const h of this.hs) { const d = Math.hypot(h.x - x, h.y - y); if (d < h.r + 8 && d < bd) { bd = d; best = h; } } return best; };
      this.cv.addEventListener('pointerdown', e => { const [x, y] = pos(e), h = hit(x, y); if (h) drag = h; else if (this.onBg) bg = [x, y]; else return; this.cv.setPointerCapture(e.pointerId); e.preventDefault(); });
      this.cv.addEventListener('pointermove', e => {
        const [x, y] = pos(e);
        if (drag) { drag.move(x, y); this.onChange && this.onChange(); }
        else if (bg) { this.onBg(x - bg[0], y - bg[1]); bg = [x, y]; this.render(); }
        else this.cv.style.cursor = hit(x, y) ? 'grab' : (this.onBg ? 'move' : 'default');
      });
      const up = () => { drag = null; bg = null; };
      this.cv.addEventListener('pointerup', up); this.cv.addEventListener('pointercancel', up);
    }
    resize() {
      const r = this.wrap.getBoundingClientRect(), w = Math.floor(r.width), h = Math.floor(r.height); if (w < 4 || h < 4) return;
      const d = Math.min(window.devicePixelRatio || 1, 2); this.cv.width = w * d; this.cv.height = h * d; this.w = w; this.h = h; this.d = d; this.render();
    }
    render() { if (!this.w || !this.draw) return; const c = this.c; c.setTransform(this.d, 0, 0, this.d, 0, 0); c.clearRect(0, 0, this.w, this.h); c.font = FONT; this.hs = []; this.draw(c, this.w, this.h, this); }
    tags(a) { this.tag.innerHTML = a.map(([t, k]) => `<span class="lab-tg ${k || ''}">${t}</span>`).join(''); }
    addHandle(c, x, y, move, r = 11) { this.hs.push({ x, y, r, move }); c.save(); c.strokeStyle = COL.main; c.globalAlpha = .6; c.setLineDash([3, 3]); c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); c.restore(); }
    dispose() { this.ro.disconnect(); }
  }
  function makeUI(body, ctl) {
    const ui = { panels: [], update() { ui.refresh(); }, anim: null };
    ui.refresh = () => ui.panels.forEach(p => p.render());
    ui.layout = (areas, cols, rows) => { body.style.gridTemplateAreas = areas.map(a => `"${a}"`).join(' '); body.style.gridTemplateColumns = cols; body.style.gridTemplateRows = rows; };
    ui.panel = (title, area) => { const p = new Panel(title, area); p.onChange = () => ui.update(); body.append(p.root); ui.panels.push(p); return p; };
    ui.slider = (label, min, max, step, val, d, on) => {
      const w = el('label', 'lab-sl'), i = el('input'), b = el('b', 'lab-sv');
      i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val; const show = v => { b.textContent = fx(+v, d); }; show(val);
      i.oninput = () => { show(i.value); on(+i.value); }; w.append(el('span', 'lab-sn', label), i, b); ctl.append(w);
      return { el: w, set(v) { i.value = v; show(v); } };
    };
    ui.seg = (opts, val, on) => {
      const g = el('div', 'lab-seg'), bs = [];
      const set = k => bs.forEach(([kk, b]) => b.classList.toggle('on', kk === k));
      opts.forEach(([k, t, tip]) => { const b = el('button', 'lab-sb', t); b.type = 'button'; if (tip) b.title = tip; b.onclick = () => { set(k); on(k); }; g.append(b); bs.push([k, b]); });
      set(val); ctl.append(g); return { el: g, set };
    };
    ui.dispose = () => ui.panels.forEach(p => p.dispose());
    return ui;
  }
  const show = (s, on) => { s.el.style.display = on ? '' : 'none'; };
  const pill = (txt, ok) => [txt, ok ? 'ok' : 'bad'];

  /* =====================================================================
     BÀI 11 — BIẾN ĐỔI LAPLACE
     ===================================================================== */
  const L11 = [];

  /* 1 · Sóng e^{st} (phần A, B) */
  L11.push({ name: 'Sóng <i>e</i><sup>st</sup>', tip: 'A–B · sóng mũ phức, Fourier là lát cắt σ=0', build(ui) {
    let sg = -.4, om = 3, tc = -3;
    const pS = ui.panel('mặt phẳng <i>s</i> — kéo điểm', 'a'), pC = ui.panel('quỹ đạo <i>e</i><sup>st</sup> trong mặt phẳng phức', 'b'),
      pW = ui.panel('Re{<i>e</i><sup>st</sup>} = <i>e</i><sup>σt</sup>·cos ωt', 'c');
    ui.layout(['a b', 'c c'], '1fr 1.2fr', '1.05fr 1fr');
    const sS = ui.slider('σ', -1.5, 1.5, .05, sg, 2, v => { sg = v; ui.update(); });
    const sO = ui.slider('ω', -8, 8, .1, om, 1, v => { om = v; ui.update(); });
    pS.draw = (c, w, h, p) => {
      const v = mkView(w, h, -2, 2, -9, 9, { l: 6, r: 6, t: 6, b: 6 });
      splane(c, v, { tint: true, items: [{ t: 'd', x: sg, y: -om, col: COL.sub }, { t: 'd', x: sg, y: om, col: COL.main }] });
      c.save(); c.setLineDash([3, 3]); c.strokeStyle = COL.main; c.globalAlpha = .6; c.beginPath(); c.moveTo(v.X(sg), v.Y(0)); c.lineTo(v.X(sg), v.Y(om)); c.lineTo(v.X(0), v.Y(om)); c.stroke(); c.restore();
      p.addHandle(c, v.X(sg), v.Y(om), (x, y) => { sg = clamp(v.ix(x), -1.5, 1.5); om = clamp(v.iy(y), -8, 8); sS.set(sg); sO.set(om); });
    };
    pC.draw = (c, w, h) => {
      const R = 3, s = (h - 16) / (2 * R), hw = (w - 16) / s / 2, v = mkView(w, h, -hw, hw, -R, R, { l: 8, r: 8, t: 8, b: 8 });
      axes(c, v, { noXL: 1, noYL: 1 });
      param(c, v, t => [Math.cos(t), Math.sin(t)], 0, TAU, COL.sub, 1, 80, [4, 4]);
      const f = t => [Math.exp(sg * t) * Math.cos(om * t), Math.exp(sg * t) * Math.sin(om * t)];
      param(c, v, f, -3, 0, COL.sub, 1.5, 400); param(c, v, f, 0, 3, COL.c2, 2, 400);
      const m = f(tc); c.save(); clipTo(c, v); c.strokeStyle = COL.main; c.globalAlpha = .6; c.beginPath(); c.moveTo(v.X(0), v.Y(0)); c.lineTo(v.X(m[0]), v.Y(m[1])); c.stroke(); c.restore();
      mark(c, 'd', clamp(v.X(m[0]), 0, w), clamp(v.Y(m[1]), 0, h), COL.main);
    };
    pW.draw = (c, w, h) => {
      const v = mkView(w, h, -3, 3, -3, 3); axes(c, v, { xl: 't' });
      const e = t => Math.exp(sg * t);
      curve(c, v, e, -3, 3, COL.sub, 1, 200, { dash: [4, 4] }); curve(c, v, t => -e(t), -3, 3, COL.sub, 1, 200, { dash: [4, 4] });
      curve(c, v, t => e(t) * Math.cos(om * t), -3, 3, COL.c1, 2, 700);
      c.save(); clipTo(c, v); c.strokeStyle = COL.main; c.globalAlpha = .5; c.beginPath(); c.moveTo(v.X(tc), v.P.t); c.lineTo(v.X(tc), v.P.t + v.ih); c.stroke(); c.restore();
      mark(c, 'd', v.X(tc), clamp(v.Y(e(tc) * Math.cos(om * tc)), 0, h), COL.main);
    };
    ui.update = () => { pS.tags([sg < -.02 ? ['tắt dần', 'ok'] : sg > .02 ? ['bùng nổ', 'bad'] : ['biên độ đều', 'neu']]); ui.refresh(); };
    ui.anim = dt => { tc += dt * .9; if (tc > 3) tc = -3; pC.render(); pW.render(); };
  } });

  /* 2 · ROC (phần C, K) */
  L11.push({ name: 'ROC', tip: 'C, K · vùng hội tụ và quan hệ với Fourier', build(ui) {
    let kind = 'R', a = 1, sg = .3;
    const pT = ui.panel('<span style="color:var(--c1)"><i>x</i>(<i>t</i>)</span> &nbsp;·&nbsp; <span style="color:var(--c2)"><i>x</i>(<i>t</i>)<i>e</i><sup>−σt</sup></span>', 'a'),
      pS = ui.panel('mặt phẳng <i>s</i> — kéo đường σ', 'b'), pM = ui.panel('|<i>X</i>(σ+<i>j</i>ω)| theo ω', 'c');
    ui.layout(['a a', 'b c'], '1fr 1fr', '1fr 1.05fr');
    ui.seg([['R', 'e<sup>−at</sup>u(t)'], ['L', '−e<sup>−at</sup>u(−t)']], kind, k => { kind = k; ui.update(); });
    const sa = ui.slider('a', -2, 2, .1, a, 1, v => { a = v; ui.update(); });
    const ss = ui.slider('σ', -3, 3, .05, sg, 2, v => { sg = v; ui.update(); });
    const inR = () => kind === 'R' ? sg > -a + 1e-9 : sg < -a - 1e-9;
    const four = () => kind === 'R' ? a > 1e-9 : a < -1e-9;
    const x = t => kind === 'R' ? (t >= 0 ? Math.exp(-a * t) : 0) : (t < 0 ? -Math.exp(-a * t) : 0);
    const wx = t => x(t) * Math.exp(-sg * t);
    pT.draw = (c, w, h) => {
      const v = mkView(w, h, -4, 4, -3, 3); axes(c, v, { xl: 't' }); const col = inR() ? COL.c2 : COL.err;
      area(c, v, wx, -4, 4, col, .22, 500); curve(c, v, x, -4, 4, COL.c1, 2, 500, { jump: 1.5 }); curve(c, v, wx, -4, 4, col, 2.2, 500, { jump: 1.5 });
    };
    pS.draw = (c, w, h, p) => {
      const v = mkView(w, h, -4, 4, -4, 4, { l: 6, r: 6, t: 6, b: 6 });
      splane(c, v, { roc: [kind === 'R' ? { a: -a, b: Infinity, col: COL.c2 } : { a: -Infinity, b: -a, col: COL.c2 }], items: [{ t: 'p', x: -a, y: 0, col: COL.text }], vline: { x: sg, col: inR() ? COL.c2 : COL.err } });
      p.addHandle(c, v.X(sg), v.Y(2.6), (px) => { sg = clamp(v.ix(px), -3, 3); ss.set(sg); });
    };
    pM.draw = (c, w, h) => {
      const mg = om => 1 / Math.hypot(sg + a, om), ym = inR() ? clamp(1.25 / Math.max(.15, Math.abs(sg + a)), 1.5, 7) : 3;
      const v = mkView(w, h, -8, 8, 0, ym); axes(c, v, { xl: 'ω' });
      if (four()) curve(c, v, om => 1 / Math.hypot(a, om), -8, 8, COL.main, 1.3, 300, { dash: [4, 4] });
      if (inR()) curve(c, v, mg, -8, 8, COL.c2, 2.2, 400); else txt(c, 'không hội tụ', w / 2, h / 2, COL.err, 'center');
    };
    ui.update = () => {
      const ok = inR(); pS.tags([pill(four() ? 'jω ∈ ROC' : 'jω ∉ ROC', four())]);
      pT.tags([ok ? pill('∫|·| = ' + fx(1 / Math.abs(sg + a), 2), true) : pill('∫|·| = ∞', false)]);
      pM.tags([['σ=0 : Fourier', 'neu']]); ui.refresh();
    };
  } });

  /* 3 · Cực · Không (phần D) */
  L11.push({ name: 'Cực · Không', tip: 'D · |X(s)| quanh điểm cực và điểm không', build(ui) {
    const PRE = {
      1: () => ({ K: 1, zr: [{ x: 1 }], zc: [], pr: [{ x: -1 }, { x: -2 }], pc: [] }),
      2: () => ({ K: 2, zr: [], zc: [{ x: -1.25, y: 2.1 }], pr: [{ x: -2 }], pc: [{ x: -1, y: 3 }] }),
      3: () => ({ K: 2, zr: [], zc: [], pr: [], pc: [{ x: -.4, y: 3 }] }),
      4: () => ({ K: 1, zr: [], zc: [], pr: [], pc: [{ x: 0, y: 3 }] }) };
    let S = PRE[1](), az = .6, el = .85;
    const pH = ui.panel('|<i>X</i>(<i>s</i>)| — kéo × và ○', 'a'), p3 = ui.panel('mặt |<i>X</i>| 3D — kéo để xoay', 'b'), pF = ui.panel('|<i>X</i>(<i>jω</i>)| và pha', 'c');
    ui.layout(['a b', 'a c'], '1fr 1fr', '1fr 1fr');
    const sp = ui.seg([['1', 'ví dụ 1', '(s−1)/((s+1)(s+2))'], ['2', 'ví dụ 2', 'cực −2, −1±3j'], ['3', 'cộng hưởng'], ['4', 'cực trên jω']], '1', k => { S = PRE[k](); sK.set(S.K); ui.update(); });
    const sK = ui.slider('K', .2, 4, .1, S.K, 1, v => { S.K = v; ui.update(); });
    const list = (r, cc) => [...r.map(e => [e.x, 0]), ...cc.flatMap(e => [[e.x, e.y], [e.x, -e.y]])];
    const Z = () => list(S.zr, S.zc), P = () => list(S.pr, S.pc);
    const mag = (x, y) => { let m = S.K; for (const z of Z()) m *= Math.hypot(x - z[0], y - z[1]); for (const p of P()) m /= Math.max(1e-6, Math.hypot(x - p[0], y - p[1])); return m; };
    const ph = w => { let a = 0; for (const z of Z()) a += Math.atan2(w - z[1], -z[0]); for (const p of P()) a -= Math.atan2(w - p[1], -p[0]); return a * 180 / Math.PI; };
    pH.draw = (c, w, h, p) => {
      const v = mkView(w, h, -4, 2, -4, 4, { l: 6, r: 6, t: 6, b: 6 }); heat(c, v, mag);
      const items = [], mk = (e, t, y) => { items.push({ t, x: e.x, y, col: '#fff' }); };
      S.zr.forEach(e => mk(e, 'z', 0)); S.zc.forEach(e => { mk(e, 'z', e.y); mk(e, 'z', -e.y); }); S.pr.forEach(e => mk(e, 'p', 0)); S.pc.forEach(e => { mk(e, 'p', e.y); mk(e, 'p', -e.y); });
      splane(c, v, { items });
      const hnd = (e, t, real) => p.addHandle(c, v.X(e.x), v.Y(real ? 0 : e.y), (px, py) => { e.x = clamp(v.ix(px), -3.9, 1.9); if (!real) e.y = clamp(v.iy(py), .2, 3.9); });
      S.zr.forEach(e => hnd(e, 'z', 1)); S.zc.forEach(e => hnd(e, 'z', 0)); S.pr.forEach(e => hnd(e, 'p', 1)); S.pc.forEach(e => hnd(e, 'p', 0));
    };
    p3.onBg = (dx, dy) => { az += dx * .01; el = clamp(el - dy * .006, .15, 1.45); };
    p3.draw = (c, w, h) => { surface(c, w, h, mag, az, el, [...Z().map(z => ({ t: 'z', x: z[0], y: z[1] })), ...P().map(z => ({ t: 'p', x: z[0], y: z[1] }))]); };
    pF.draw = (c, w, h) => {
      let mx = 0; for (let i = 0; i <= 200; i++) mx = Math.max(mx, mag(0, -6 + 12 * i / 200));
      const ym = clamp(mx * 1.15, .5, 8), h1 = Math.round(h * .58);
      sub(c, 0, h1, hh => { const v = mkView(w, hh, -6, 6, 0, ym, { b: 6 }); axes(c, v, { noXL: 1 }); curve(c, v, om => mag(0, om), -6, 6, COL.main, 2.2, 480); txt(c, '|X|', v.P.l + 4, v.P.t + 8, COL.main); });
      sub(c, h1, h - h1, hh => { const v = mkView(w, hh, -6, 6, -180, 180, { t: 4 }); axes(c, v, { xl: 'ω', yn: 2, yfmt: y => y + '°' }); curve(c, v, ph, -6, 6, COL.c1, 2, 480, { jump: 200 }); txt(c, '∠X', v.P.l + 4, v.P.t + 8, COL.c1); });
    };
    ui.update = () => { ui.refresh(); };
  } });

  /* 4 · ROC → x(t) (phần E, H.4, I.2–I.3) */
  L11.push({ name: 'ROC → <i>x</i>(<i>t</i>)', tip: 'E, H.4 · cùng X(s), ROC khác ⇒ tín hiệu khác', build(ui) {
    let p1 = -1, p2 = -2, z = 1, roc = 'R';
    const pS = ui.panel('mặt phẳng <i>s</i> — kéo cực/không', 'a'), pX = ui.panel('<i>x</i>(<i>t</i>) &nbsp;<span style="color:var(--sub)">(nét đứt: từng thành phần)</span>', 'b'), pF = ui.panel('|<i>X</i>(<i>jω</i>)|', 'c');
    ui.layout(['a b', 'a c'], '1fr 1.2fr', '1.2fr 1fr');
    ui.seg([['L', '◀ trái'], ['M', 'giữa'], ['R', 'phải ▶']], roc, k => { roc = k; ui.update(); });
    const s1 = ui.slider('p₁', -4, 3, .1, p1, 1, v => { p1 = v; ui.update(); });
    const s2 = ui.slider('p₂', -4, 3, .1, p2, 1, v => { p2 = v; ui.update(); });
    const sz = ui.slider('z', -4, 4, .1, z, 1, v => { z = v; ui.update(); });
    const poles = () => { let a = p1, b = p2; if (Math.abs(a - b) < .15) b = a - .15; return a < b ? [a, b] : [b, a]; };
    const resid = () => { const [pa, pb] = poles(); return [[pa, (pa - z) / (pa - pb)], [pb, (pb - z) / (pb - pa)]]; };
    const right = p => roc === 'R' || (roc === 'M' && p === poles()[0]);
    const comp = (p, A, t) => right(p) ? (t >= 0 ? A * Math.exp(p * t) : 0) : (t < 0 ? -A * Math.exp(p * t) : 0);
    const xt = t => resid().reduce((s, [p, A]) => s + comp(p, A, t), 0);
    const rocIv = () => { const [pa, pb] = poles(); return roc === 'R' ? { a: pb, b: Infinity } : roc === 'M' ? { a: pa, b: pb } : { a: -Infinity, b: pa }; };
    const stable = () => { const r = rocIv(); return r.a < 0 && r.b > 0; };
    const X = om => { const [pa, pb] = poles(), s = [0, om]; return cdiv(csub(s, [z, 0]), cmul(csub(s, [pa, 0]), csub(s, [pb, 0]))); };
    pS.draw = (c, w, h, p) => {
      const v = mkView(w, h, -5, 4, -4, 4, { l: 6, r: 6, t: 6, b: 6 }), [pa, pb] = poles();
      splane(c, v, { roc: [Object.assign({ col: COL.c2 }, rocIv())], items: [{ t: 'z', x: z, y: 0, col: COL.c1 }, { t: 'p', x: pa, y: 0, col: COL.text }, { t: 'p', x: pb, y: 0, col: COL.text }] });
      p.addHandle(c, v.X(p1), v.Y(0), px => { p1 = clamp(v.ix(px), -4, 3); s1.set(p1); });
      p.addHandle(c, v.X(p2), v.Y(0), px => { p2 = clamp(v.ix(px), -4, 3); s2.set(p2); });
      p.addHandle(c, v.X(z), v.Y(0), px => { z = clamp(v.ix(px), -4, 4); sz.set(z); });
    };
    pX.draw = (c, w, h) => {
      const ym = amp([xt], -4, 4, 300, 8, 1.2), v = mkView(w, h, -4, 4, -ym, ym); axes(c, v, { xl: 't' });
      resid().forEach(([p, A], i) => curve(c, v, t => comp(p, A, t), -4, 4, i ? COL.c1 : COL.c2, 1.3, 400, { dash: [4, 3], jump: 3 * ym }));
      curve(c, v, xt, -4, 4, COL.main, 2.4, 500, { jump: 3 * ym });
    };
    pF.draw = (c, w, h) => {
      if (!stable()) { const v = mkView(w, h, -8, 8, 0, 1); axes(c, v, { xl: 'ω', noYL: 1 }); txt(c, 'jω ∉ ROC — không có Fourier', w / 2, h / 2, COL.err, 'center'); return; }
      const ym = amp([om => cabs(X(om))], -8, 8, 200, 8, .5), v = mkView(w, h, -8, 8, 0, ym); axes(c, v, { xl: 'ω' }); curve(c, v, om => cabs(X(om)), -8, 8, COL.main, 2.2, 400);
    };
    ui.update = () => { pS.tags([pill('nhân quả', roc === 'R'), pill('ổn định', stable())]); pF.tags([pill(stable() ? 'jω ∈ ROC' : 'jω ∉ ROC', stable())]); ui.refresh(); };
  } });

  /* 5 · Tính chất (phần F, G) */
  L11.push({ name: 'Tính chất', tip: 'G · cực/không và ROC di chuyển theo phép toán', build(ui) {
    const A = .5, W = 4; let op = 'shift', t0 = 1.5, s0 = .8, cc = 1.5;
    const pT = ui.panel('<span style="color:var(--sub)"><i>x</i>(<i>t</i>)</span> &nbsp;→&nbsp; <span style="color:var(--main)"><i>y</i>(<i>t</i>)</span>', 'a'), pS = ui.panel('cực/không: <span style="color:var(--sub)">X</span> → <span style="color:var(--main)">Y</span>', 'b'), pB = ui.panel('Y(<i>jω</i>): biên độ & pha', 'c');
    ui.layout(['a a', 'b c'], '1fr 1.25fr', '1fr 1.1fr');
    const so = ui.seg([['shift', 'x(t−t₀)'], ['ss', 'e<sup>σ₀t</sup>x(t)'], ['sc', 'x(ct)'], ['d', 'dx/dt'], ['i', '∫x']], op, k => { op = k; vis(); ui.update(); });
    const st = ui.slider('t₀', -2, 3, .1, t0, 1, v => { t0 = v; ui.update(); });
    const ss = ui.slider('σ₀', -1.5, 1.5, .1, s0, 1, v => { s0 = v; ui.update(); });
    const sc = ui.slider('c', -2, 2, .1, cc, 1, v => { cc = Math.abs(v) < .2 ? (v < 0 ? -.2 : .2) : v; ui.update(); });
    const vis = () => { show(st, op === 'shift'); show(ss, op === 'ss'); show(sc, op === 'sc'); };
    const xb = t => t < 0 ? 0 : Math.exp(-A * t) * Math.cos(W * t);
    const Y = { shift: t => xb(t - t0), ss: t => Math.exp(s0 * t) * xb(t), sc: t => xb(cc * t), d: t => t < 0 ? 0 : Math.exp(-A * t) * (-A * Math.cos(W * t) - W * Math.sin(W * t)),
      i: t => { if (t < 0) return 0; const e = cexp([-A * t, W * t]); return cdiv([1 - e[0], -e[1]], [A, -W])[0]; } };
    const yf = t => Y[op](t);
    const Xf = s => { const q = cadd(s, [A, 0]); return cdiv(q, cadd(cmul(q, q), [W * W, 0])); };
    const Yjw = w => { const j = [0, w];
      switch (op) { case 'shift': return cmul(cexp([0, -w * t0]), Xf(j)); case 'ss': return Xf([-s0, w]); case 'sc': { const r = Xf([0, w / cc]); return [r[0] / Math.abs(cc), r[1] / Math.abs(cc)]; }
        case 'd': return cmul(j, Xf(j)); default: return cdiv(Xf(j), j); } };
    const pz = () => {
      let Zs = [[-A, 0]], Ps = [[-A, W], [-A, -W]], edge = -A, type = 'R';
      if (op === 'ss') { Zs = Zs.map(q => [q[0] + s0, q[1]]); Ps = Ps.map(q => [q[0] + s0, q[1]]); edge += s0; }
      if (op === 'sc') { Zs = Zs.map(q => [q[0] * cc, q[1] * cc]); Ps = Ps.map(q => [q[0] * cc, q[1] * cc]); edge = cc * -A; type = cc > 0 ? 'R' : 'L'; }
      if (op === 'd') Zs.push([0, 0]);
      if (op === 'i') { Ps.push([0, 0]); edge = Math.max(-A, 0); }
      return { Zs, Ps, edge, type };
    };
    const valid = () => { const q = pz(); return q.type === 'R' ? q.edge < -1e-9 : q.edge > 1e-9; };
    pT.draw = (c, w, h) => {
      const ym = amp([xb, yf], -3, 7, 600, 5, 1.2), v = mkView(w, h, -3, 7, -ym, ym); axes(c, v, { xl: 't' });
      curve(c, v, xb, -3, 7, COL.sub, 1.6, 900, { jump: 1.2 * ym }); curve(c, v, yf, -3, 7, COL.main, 2.4, 900, { jump: 1.2 * ym });
      if (op === 'd') { const x = v.X(0), y1 = v.Y(0), y2 = v.Y(Math.min(ym * .95, ym)); c.save(); c.strokeStyle = COL.main; c.fillStyle = COL.main; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y2); c.stroke(); c.beginPath(); c.moveTo(x - 4, y2 + 7); c.lineTo(x + 4, y2 + 7); c.lineTo(x, y2); c.fill(); c.restore(); }
    };
    pS.draw = (c, w, h) => {
      const q = pz(), v = mkView(w, h, -4, 4, -9, 9, { l: 6, r: 6, t: 6, b: 6 });
      c.save(); c.setLineDash([4, 4]); c.strokeStyle = COL.sub; c.globalAlpha = .8; c.beginPath(); c.moveTo(v.X(-A), v.P.t); c.lineTo(v.X(-A), v.P.t + v.ih); c.stroke(); c.restore();
      const items = [[[-A, 0]], [[-A, W], [-A, -W]]].map((l, i) => l.map(p => ({ t: i ? 'p' : 'z', x: p[0], y: p[1], col: COL.sub, ghost: 1 }))).flat();
      q.Zs.forEach(p => items.push({ t: 'z', x: p[0], y: p[1], col: COL.main })); q.Ps.forEach(p => items.push({ t: 'p', x: p[0], y: p[1], col: COL.main }));
      splane(c, v, { roc: [q.type === 'R' ? { a: q.edge, b: Infinity, col: COL.main } : { a: -Infinity, b: q.edge, col: COL.main }], items: [...items.slice(0, 3), ...items.slice(3)] });
    };
    pB.draw = (c, w, h) => {
      const ok = valid(), N = 360, w1 = 12, ma = [], pa = [];
      for (let i = 0; i <= N; i++) { const om = w1 * i / N, y = Yjw(om), x = Xf([0, om]); ma.push([cabs(x), cabs(y)]); pa.push([carg(x) * 180 / Math.PI, carg(y) * 180 / Math.PI]); }
      const ym = clamp(Math.max(...ma.flat().filter(isFinite)) * 1.1, .5, 4), h1 = Math.round(h * .56);
      const col = ok ? COL.main : COL.err, dash = ok ? null : [5, 4];
      sub(c, 0, h1, hh => { const v = mkView(w, hh, 0, w1, 0, ym, { b: 6 }); axes(c, v, { noXL: 1 }); curve(c, v, om => ma[Math.round(om / w1 * N)][0], 0, w1, COL.sub, 1.5, N); curve(c, v, om => ma[Math.round(om / w1 * N)][1], 0, w1, col, 2.2, N, { dash }); });
      sub(c, h1, h - h1, hh => { const v = mkView(w, hh, 0, w1, -180, 180, { t: 4 }); axes(c, v, { xl: 'ω', yn: 2, yfmt: y => y + '°' }); curve(c, v, om => pa[Math.round(om / w1 * N)][0], 0, w1, COL.sub, 1.5, N, { jump: 200 }); curve(c, v, om => pa[Math.round(om / w1 * N)][1], 0, w1, col, 2.2, N, { jump: 200, dash }); });
    };
    vis();
    ui.update = () => { pS.tags([pill(valid() ? 'jω ∈ ROC' : 'jω ∉ ROC', valid())]); ui.refresh(); };
  } });

  /* 6 · Hệ LTI: cực → h(t) (phần H, I.3–I.4) */
  L11.push({ name: 'Hệ LTI', tip: 'H, I · vị trí cực quyết định h(t) và tính ổn định', build(ui) {
    let mode = 'real', p1 = -1, p2 = -3, pd = -1, al = -.5, om = 4, zon = false, z = -2;
    const pS = ui.panel('mặt phẳng <i>s</i> — kéo cực', 'a'), pH = ui.panel('đáp ứng xung <i>h</i>(<i>t</i>)', 'b'), pB = ui.panel('|<i>H</i>(<i>jω</i>)|', 'c'), pU = ui.panel('đáp ứng bậc thang', 'd');
    ui.layout(['a b', 'c d'], '1fr 1.2fr', '1fr 1fr');
    const sm = ui.seg([['real', '2 cực thực'], ['dbl', 'cực kép'], ['cx', 'cực phức']], mode, k => { mode = k; vis(); ui.update(); });
    const s1 = ui.slider('p₁', -5, 2, .1, p1, 1, v => { p1 = v; ui.update(); }), s2 = ui.slider('p₂', -5, 2, .1, p2, 1, v => { p2 = v; ui.update(); });
    const sd = ui.slider('p', -5, 2, .1, pd, 1, v => { pd = v; ui.update(); });
    const sa = ui.slider('α', -3, 1.5, .05, al, 2, v => { al = v; ui.update(); }), so = ui.slider('ω', 0, 8, .1, om, 1, v => { om = v; ui.update(); });
    const zb = ui.seg([['0', 'không có ○'], ['1', 'có ○']], '0', k => { zon = k === '1'; vis(); ui.update(); });
    const sz = ui.slider('z', -4, 4, .1, z, 1, v => { z = v; ui.update(); });
    const vis = () => { show(s1, mode === 'real'); show(s2, mode === 'real'); show(sd, mode === 'dbl'); show(sa, mode === 'cx'); show(so, mode === 'cx'); show(sz, zon); };
    const P = () => mode === 'real' ? [[p1, 0], [p2, 0]] : mode === 'dbl' ? [[pd, 0], [pd, 0]] : [[al, om], [al, -om]];
    const den = () => polyFromRoots(P()), num = () => zon ? [1, -z] : [1];
    const state = () => { const m = Math.max(...P().map(p => p[0])); return Math.abs(m) < 1e-6 ? ['biên ổn định', 'neu'] : m < 0 ? ['ổn định', 'ok'] : ['không ổn định', 'bad']; };
    pS.draw = (c, w, h, p) => {
      const v = mkView(w, h, -5, 2.5, -9, 9, { l: 6, r: 6, t: 6, b: 6 }), pp = P(), items = pp.map(q => ({ t: 'p', x: q[0], y: q[1], col: COL.text }));
      if (zon) items.push({ t: 'z', x: z, y: 0, col: COL.c1 });
      splane(c, v, { tint: true, items });
      const lim = x => clamp(v.ix(x), -5, 2);
      if (mode === 'real') { p.addHandle(c, v.X(p1), v.Y(0), x => { p1 = lim(x); s1.set(p1); }); p.addHandle(c, v.X(p2), v.Y(0), x => { p2 = lim(x); s2.set(p2); }); }
      else if (mode === 'dbl') p.addHandle(c, v.X(pd), v.Y(0), x => { pd = lim(x); sd.set(pd); });
      else p.addHandle(c, v.X(al), v.Y(om), (x, y) => { al = clamp(v.ix(x), -3, 1.5); om = clamp(v.iy(y), 0, 8); sa.set(al); so.set(om); });
      if (zon) p.addHandle(c, v.X(z), v.Y(0), x => { z = clamp(v.ix(x), -4, 4); sz.set(z); });
    };
    let hArr, uArr; const T = 8, N = 320;
    const plot = (p, arr, col) => (c, w, h) => { const [lo, hi] = rngA([arr()], 12, .3), v = mkView(w, h, 0, T, lo, hi); axes(c, v, { xl: 't' }); curve(c, v, arrF(arr(), 0, T / N), 0, T, col, 2.4, N); };
    pH.draw = plot(pH, () => hArr, COL.main); pU.draw = plot(pU, () => uArr, COL.c1);
    const Hj = w => cdiv(polyEval(num(), [0, w]), polyEval(den(), [0, w]));
    pB.draw = (c, w, h) => { const ym = amp([om2 => cabs(Hj(om2))], 0, 10, 200, 10, .3), v = mkView(w, h, 0, 10, 0, ym); axes(c, v, { xl: 'ω' }); curve(c, v, om2 => cabs(Hj(om2)), 0, 10, COL.c2, 2.2, 400); };
    vis();
    ui.update = () => { hArr = sim(num(), den(), 'imp', T, N); uArr = sim(num(), den(), 'step', T, N); const s = state(); pS.tags([s]); pH.tags([s]); ui.refresh(); };
  } });

  /* 7 · Ghép nối (phần I.5) */
  L11.push({ name: 'Ghép nối', tip: 'I.5 · nối tiếp, song song, phản hồi', build(ui) {
    let mode = 'ser', b = 2, g = 1;
    const pD = ui.panel('sơ đồ khối', 'a'), pS = ui.panel('mặt phẳng <i>s</i>: <span style="color:var(--sub)">H₁, H₂</span> → <span style="color:var(--main)">H</span>', 'b'), pU = ui.panel('đáp ứng bậc thang', 'c'), pB = ui.panel('|<i>H</i>(<i>jω</i>)|', 'd');
    ui.layout(['a b', 'c d'], '1fr 1fr', '1fr 1fr');
    ui.seg([['ser', 'nối tiếp'], ['par', 'song song'], ['fb', 'phản hồi']], mode, k => { mode = k; ui.update(); });
    ui.slider('b', -2, 3, .1, b, 1, v => { b = v; ui.update(); }); ui.slider('g', -3, 6, .1, g, 1, v => { g = v; ui.update(); });
    const sys = () => {
      const N1 = [1], D1 = [1, 1], N2 = [g], D2 = [1, b], DD = polyMul(D1, D2);
      if (mode === 'ser') return { N: polyMul(N1, N2), D: DD };
      if (mode === 'par') return { N: polyAdd(polyMul(N1, D2), polyMul(N2, D1)), D: DD };
      return { N: polyMul(N1, D2), D: polyAdd(DD, polyMul(N1, N2)) };
    };
    const T = 8, N = 320; let u0, u1;
    const sgn = v => (v >= 0 ? '+' : '−') + fx(Math.abs(v), 1);
    pD.draw = (c, w, h) => {
      const bx = (x, y, t, col) => { const bw = Math.min(120, w * .26), bh = 34; c.save(); c.fillStyle = COL.bg; c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); c.roundRect(x - bw / 2, y - bh / 2, bw, bh, 5); c.fill(); c.stroke(); c.restore(); txt(c, t, x, y, COL.text, 'center'); return bw / 2; };
      const ar = (x1, y1, x2, y2) => { c.save(); c.strokeStyle = COL.sub; c.fillStyle = COL.sub; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); const a = Math.atan2(y2 - y1, x2 - x1); c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - 7 * Math.cos(a - .4), y2 - 7 * Math.sin(a - .4)); c.lineTo(x2 - 7 * Math.cos(a + .4), y2 - 7 * Math.sin(a + .4)); c.fill(); c.restore(); };
      const ln = (x1, y1, x2, y2) => { c.save(); c.strokeStyle = COL.sub; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore(); };
      const sm = (x, y, s) => { c.save(); c.strokeStyle = COL.sub; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.stroke(); c.restore(); txt(c, s, x, y, COL.text, 'center'); };
      const h1 = '1/(s+1)', h2 = `${fx(g, 1)}/(s${sgn(b)})`, cy = h * .42, bw = Math.min(120, w * .26) / 2;
      if (mode === 'ser') { ar(14, cy, w * .3 - bw, cy); bx(w * .3, cy, h1, COL.c1); ar(w * .3 + bw, cy, w * .7 - bw, cy); bx(w * .7, cy, h2, COL.c2); ar(w * .7 + bw, cy, w - 14, cy); txt(c, 'H = H₁·H₂', w / 2, h * .8, COL.main, 'center'); }
      else if (mode === 'par') { const y1 = h * .27, y2 = h * .58, xs = w * .16, xe = w * .84; ln(14, h * .425, xs, h * .425); ln(xs, y1, xs, y2); ar(xs, y1, w * .5 - bw, y1); ar(xs, y2, w * .5 - bw, y2); bx(w * .5, y1, h1, COL.c1); bx(w * .5, y2, h2, COL.c2); ln(w * .5 + bw, y1, xe, y1); ln(w * .5 + bw, y2, xe, y2); ln(xe, y1, xe, y2); ar(xe, h * .425, w - 14, h * .425); sm(xe, h * .425, '+'); txt(c, 'H = H₁ + H₂', w / 2, h * .82, COL.main, 'center'); }
      else { const xs = w * .12, xe = w * .84, yb = h * .62; ar(10, cy, xs - 9, cy); sm(xs, cy, '+'); ar(xs + 9, cy, w * .45 - bw, cy); bx(w * .45, cy, h1, COL.c1); ln(w * .45 + bw, cy, xe, cy); ar(xe, cy, w - 10, cy); ln(xe, cy, xe, yb); ln(xe, yb, w * .45 + bw, yb); ar(w * .45 - bw, yb, xs, yb); bx(w * .45, yb, h2, COL.c2); ln(xs, yb, xs, cy + 9); ar(xs, yb, xs, cy + 10); txt(c, '−', xs + 9, cy + 18, COL.text, 'center'); txt(c, 'H = H₁ / (1 + H₁H₂)', w / 2, h * .88, COL.main, 'center'); }
    };
    pS.draw = (c, w, h) => {
      const v = mkView(w, h, -5, 3, -4, 4, { l: 6, r: 6, t: 6, b: 6 }), q = sys(), items = [{ t: 'p', x: -1, y: 0, col: COL.c1, ghost: 1 }, { t: 'p', x: -b, y: 0, col: COL.c2, ghost: 1 }];
      polyRoots(q.D).forEach(p => items.push({ t: 'p', x: p[0], y: p[1], col: COL.main })); polyRoots(q.N).forEach(p => items.push({ t: 'z', x: p[0], y: p[1], col: COL.main }));
      splane(c, v, { tint: true, items });
    };
    pU.draw = (c, w, h) => { const [lo, hi] = rngA([u0, u1], 12, .5), v = mkView(w, h, 0, T, lo, hi); axes(c, v, { xl: 't' }); curve(c, v, arrF(u1, 0, T / N), 0, T, COL.sub, 1.4, N, { dash: [4, 4] }); curve(c, v, arrF(u0, 0, T / N), 0, T, COL.main, 2.4, N); };
    const Hj = (q, w) => cdiv(polyEval(q.N, [0, w]), polyEval(q.D, [0, w]));
    pB.draw = (c, w, h) => { const q = sys(), q1 = { N: [1], D: [1, 1] }, ym = amp([x => cabs(Hj(q, x)), x => cabs(Hj(q1, x))], 0, 8, 160, 10, .5), v = mkView(w, h, 0, 8, 0, ym); axes(c, v, { xl: 'ω' }); curve(c, v, x => cabs(Hj(q1, x)), 0, 8, COL.sub, 1.4, 300, { dash: [4, 4] }); curve(c, v, x => cabs(Hj(q, x)), 0, 8, COL.main, 2.4, 400); };
    ui.update = () => {
      const q = sys(), r = polyRoots(q.D), mx = Math.max(...r.map(p => p[0])); u0 = sim(q.N, q.D, 'step', T, N); u1 = sim([1], [1, 1], 'step', T, N);
      pS.tags([mx < -1e-6 ? ['ổn định', 'ok'] : Math.abs(mx) <= 1e-6 ? ['biên ổn định', 'neu'] : ['không ổn định', 'bad']]); ui.refresh();
    };
  } });

  /* 8 · Mạch RLC một phía (phần J) */
  L11.push({ name: 'Mạch RLC', tip: 'J · Laplace một phía, điều kiện đầu thành nguồn phụ', build(ui) {
    let R = .6, v0 = -1, i0 = 0, src = 1;
    const pC = ui.panel('mạch trong miền <i>s</i> (L = C = 1)', 'a'), pS = ui.panel('cực của <i>V<sub>C</sub></i>', 'b'), pW = ui.panel('<i>v<sub>C</sub></i>(<i>t</i>) = <span style="color:var(--c1)">trạng thái 0</span> + <span style="color:var(--c2)">đầu vào 0</span>', 'c');
    ui.layout(['a b', 'c c'], '1.3fr 1fr', '1fr 1.15fr');
    ui.slider('R', .2, 4, .05, R, 2, v => { R = v; ui.update(); }); ui.slider('v₀', -2, 2, .1, v0, 1, v => { v0 = v; ui.update(); }); ui.slider('i₀', -2, 2, .1, i0, 1, v => { i0 = v; ui.update(); });
    ui.seg([['1', 'nguồn u(t)'], ['0', 'nguồn 0']], '1', k => { src = +k; ui.update(); });
    const T = 14, N = 700;
    const run = (v, i, vs) => { const out = new Float64Array(N + 1), h = T / N / 4; let x = v, y = i; const f = (a, b) => [b, vs - R * b - a];
      for (let k = 0; k <= N; k++) { out[k] = x; for (let q = 0; q < 4; q++) { const k1 = f(x, y), k2 = f(x + h / 2 * k1[0], y + h / 2 * k1[1]), k3 = f(x + h / 2 * k2[0], y + h / 2 * k2[1]), k4 = f(x + h * k3[0], y + h * k3[1]); x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); } } return out; };
    let zs, zi; const poles = () => { const d = R * R - 4; return d >= 0 ? [[(-R + Math.sqrt(d)) / 2, 0], [(-R - Math.sqrt(d)) / 2, 0]] : [[-R / 2, Math.sqrt(-d) / 2], [-R / 2, -Math.sqrt(-d) / 2]]; };
    pC.draw = (c, w, h) => {
      const cy = h * .5, n = 4, xs = i => w * (.09 + .82 * i / (n - 1)), bw = Math.min(w * .17, 92), bh = Math.min(h * .2, 44);
      c.save(); c.strokeStyle = COL.sub; c.lineWidth = 1.6; c.beginPath(); c.moveTo(xs(0), cy + bh * 1.3); c.lineTo(xs(0), cy); c.moveTo(xs(0), cy + bh * 1.3); c.lineTo(xs(3), cy + bh * 1.3); c.lineTo(xs(3), cy); c.moveTo(xs(0), cy); c.lineTo(xs(3), cy); c.stroke(); c.restore();
      const bx = (i, t, sub2, col) => { const x = xs(i); c.save(); c.fillStyle = COL.card; c.strokeStyle = col; c.lineWidth = 1.8; c.beginPath(); c.roundRect(x - bw / 2, cy - bh / 2, bw, bh, 6); c.fill(); c.stroke(); c.restore(); txt(c, t, x, cy, COL.text, 'center'); if (sub2) txt(c, sub2, x, cy - bh * .95, col, 'center'); };
      bx(0, src ? '1/s' : '0', 'V', COL.main); bx(1, 'R=' + fx(R, 2), '', COL.sub); bx(2, 'sL', 'Li₀=' + fx(i0, 1), COL.c2); bx(3, '1/sC', 'v₀/s=' + fx(v0, 1) + '/s', COL.c2);
      txt(c, 'V_C = [V + L(i₀ + s·C·v₀) + RC·v₀] / (LCs² + RCs + 1)', w / 2, h - 14, COL.sub, 'center');
    };
    pS.draw = (c, w, h) => { const v = mkView(w, h, -4.4, 1, -2.2, 2.2, { l: 6, r: 6, t: 6, b: 6 }); splane(c, v, { tint: true, items: poles().map(p => ({ t: 'p', x: p[0], y: p[1], col: COL.main })) });
      c.save(); clipTo(c, v); c.setLineDash([3, 4]); c.strokeStyle = COL.sub; c.beginPath(); c.arc(v.X(0), v.Y(0), v.X(1) - v.X(0), Math.PI * .5, Math.PI * 1.5); c.stroke(); c.restore(); };
    pW.draw = (c, w, h) => { const tot = i => zs[i] + zi[i], [lo, hi] = rngA([zs, zi, Array.from(zs, (z, i) => tot(i))], 8, 1), v = mkView(w, h, 0, T, lo, hi); axes(c, v, { xl: 't' });
      curve(c, v, arrF(zs, 0, T / N), 0, T, COL.c1, 1.5, N, { dash: [5, 4] }); curve(c, v, arrF(zi, 0, T / N), 0, T, COL.c2, 1.5, N, { dash: [5, 4] }); curve(c, v, t => { const i = Math.round(t / (T / N)); return tot(i); }, 0, T, COL.main, 2.6, N);
      mark(c, 'd', v.X(0), v.Y(v0), COL.c2); txt(c, 'v₀', v.X(0) + 8, v.Y(v0) - 8, COL.c2); };
    ui.update = () => { zs = run(0, 0, src); zi = run(v0, i0, 0); const d = R * R - 4; pS.tags([d < 0 ? ['dao động tắt dần', 'neu'] : ['quá tắt', 'neu']]); ui.refresh(); };
  } });

  /* =====================================================================
     BÀI 7–10 — FOURIER (chuỗi, biến đổi, đáp ứng tần số, đọc phổ)
     ===================================================================== */
  const PI = Math.PI, sx = w => (Math.abs(w) < 1e-9 ? 1 : Math.sin(w) / w);
  const wrapPi = t => ((t + PI) % TAU + TAU) % TAU - PI;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const pif = v => { const r = +(v).toFixed(2); return r === 0 ? '0' : (r === 1 ? '' : r === -1 ? '−' : tl(r)) + 'π'; };
  /* cột + chấm tại các điểm [x,y] */
  function stems(c, v, pts, col, lw = 2, r = 3.2, dx = 0) {
    c.save(); clipTo(c, v); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw;
    for (const [x, y] of pts) { const X = v.X(x) + dx, Y0 = v.Y(0), Y = v.Y(y); c.beginPath(); c.moveTo(X, Y0); c.lineTo(X, Y); c.stroke(); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill(); }
    c.restore();
  }
  const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
  const lbl = (c, v, s, col) => txt(c, s, v.P.l + v.iw - 4, v.P.t + 10, col, 'right');
  const L7 = [], L8 = [], L9 = [], L10 = [];

  /* B7·1 — Chuỗi Fourier: tổng riêng và hiện tượng Gibbs */
  L7.push({ name: 'Tổng các hài', tip: 'B.1–B.2 · cộng dần các hài, sóng càng giống tín hiệu gốc', build(ui) {
    let N = 5, ty = 'sq';
    const term = (k, t) => ty === 'sq' ? (k % 2 ? 4 / (PI * k) * Math.sin(k * t) : 0) : ty === 'saw' ? 2 * (k % 2 ? 1 : -1) / (PI * k) * Math.sin(k * t) : (k % 2 ? 8 / (PI * PI * k * k) * Math.cos(k * t) : 0);
    const amp = k => ty === 'sq' ? (k % 2 ? 4 / (PI * k) : 0) : ty === 'saw' ? 2 / (PI * k) : (k % 2 ? 8 / (PI * PI * k * k) : 0);
    const ideal = t => { const w = wrapPi(t); return ty === 'sq' ? (w > 0 ? 1 : -1) : ty === 'saw' ? w / PI : 1 - 2 * Math.abs(w) / PI; };
    const part = t => { let s = 0; for (let k = 1; k <= N; k++) s += term(k, t); return s; };
    const pT = ui.panel('<i>x</i>(<i>t</i>) và tổng riêng <i>S<sub>N</sub></i>(<i>t</i>)', 'a'), pS = ui.panel('biên độ các hài |<i>a<sub>k</sub></i>|, |<i>b<sub>k</sub></i>|', 'b');
    ui.layout(['a', 'b'], '1fr', '1.5fr 1fr');
    ui.slider('N', 1, 40, 1, N, 0, v => { N = v; ui.update(); });
    ui.seg([['sq', 'vuông'], ['saw', 'răng cưa'], ['tri', 'tam giác']], ty, k => { ty = k; ui.update(); });
    pT.draw = (c, w, h) => { const v = mkView(w, h, -2, 2, -1.5, 1.5); axes(c, v, { xl: 't/π', xfmt: x => tl(x) });
      curve(c, v, u => ideal(u * PI), -2, 2, COL.sub, 1.5, 800, { dash: [5, 4], jump: 1 }); curve(c, v, u => part(u * PI), -2, 2, COL.main, 2.2, 900); };
    pS.draw = (c, w, h) => { const K = 40, v = mkView(w, h, 0, K + 1, 0, 1.4 * Math.max(amp(1), amp(2)) + .01); axes(c, v, { xl: 'k' });
      stems(c, v, range(1, N).map(k => [k, amp(k)]), COL.main, 3, 2.8); stems(c, v, range(N + 1, K).map(k => [k, amp(k)]), COL.sub, 2, 2.2); };
    ui.update = () => { let m = -9; for (let i = 0; i < 800; i++) m = Math.max(m, part(-PI + 2 * PI * i / 800)); pT.tags(ty === 'sq' ? [['đỉnh ' + fx(m, 2) + ' (Gibbs ≈ 1.18)', m > 1.05 ? 'bad' : 'ok']] : [['đỉnh ' + fx(m, 2), 'neu']]); ui.refresh(); };
  } });

  /* B7·2 — Phổ vạch của tổng cos */
  L7.push({ name: 'Phổ vạch', tip: 'B.3–B.4 · A cos(ωt+φ) → c₁ = (A/2)e^{jφ}, c₋₁ = c₁*', build(ui) {
    let A1 = 2, f1 = 45, A2 = 1, f2 = -90, m = 3;
    const pT = ui.panel('<i>x</i>(<i>t</i>) = <i>A</i>₁cos(<i>t</i>+φ₁) + <i>A</i>₂cos(<i>mt</i>+φ₂)', 'a'), pA = ui.panel('phổ biên độ |<i>c<sub>k</sub></i>|', 'b'), pP = ui.panel('phổ pha ∠<i>c<sub>k</sub></i> (độ)', 'c');
    ui.layout(['a a', 'b c'], '1fr 1fr', '1.1fr 1fr');
    ui.slider('A₁', 0, 3, .1, A1, 1, v => { A1 = v; ui.update(); }); ui.slider('φ₁°', -180, 180, 15, f1, 0, v => { f1 = v; ui.update(); });
    ui.slider('m', 2, 5, 1, m, 0, v => { m = v; ui.update(); }); ui.slider('A₂', 0, 3, .1, A2, 1, v => { A2 = v; ui.update(); }); ui.slider('φ₂°', -180, 180, 15, f2, 0, v => { f2 = v; ui.update(); });
    const ck = () => { const o = {}; const r = PI / 180; o[1] = [A1 / 2 * Math.cos(f1 * r), A1 / 2 * Math.sin(f1 * r)]; o[-1] = [o[1][0], -o[1][1]]; o[m] = [A2 / 2 * Math.cos(f2 * r), A2 / 2 * Math.sin(f2 * r)]; o[-m] = [o[m][0], -o[m][1]]; return o; };
    pT.draw = (c, w, h) => { const r = PI / 180, f = u => A1 * Math.cos(u * 2 * PI + f1 * r) + A2 * Math.cos(m * u * 2 * PI + f2 * r), M = Math.max(1, A1 + A2) * 1.1, v = mkView(w, h, -1, 1, -M, M); axes(c, v, { xl: 't/T₀' });
      curve(c, v, f, -1, 1, COL.main, 2.2, 900); };
    pA.draw = (c, w, h) => { const o = ck(), v = mkView(w, h, -6, 6, 0, 1.6); axes(c, v, { xl: 'k', yn: 3 }); stems(c, v, Object.keys(o).map(k => [+k, cabs(o[k])]), COL.c2, 3); };
    pP.draw = (c, w, h) => { const o = ck(), v = mkView(w, h, -6, 6, -200, 200); axes(c, v, { xl: 'k', yn: 4 }); stems(c, v, Object.keys(o).filter(k => cabs(o[k]) > 1e-3).map(k => [+k, carg(o[k]) * 180 / PI]), COL.c1, 3); };
    ui.update = () => { pT.tags([['T₀ = 2π', 'neu']]); pP.tags([['pha lẻ: ∠c₋ₖ = −∠cₖ', 'ok']]); ui.refresh(); };
  } });

  /* B7·3 — Từ FS sang FT */
  L7.push({ name: 'FS → FT', tip: 'C.1 · T₀ → ∞: vạch phổ khít lại thành phổ liên tục', build(ui) {
    let T0 = 4;
    const pT = ui.panel('xung vuông (độ rộng 2) lặp lại mỗi <i>T</i>₀', 'a'), pS = ui.panel('<i>T</i>₀·<i>c<sub>k</sub></i> tại ω = <i>k</i>ω₀  và đường bao <i>X</i>(ω) = 2sin ω / ω', 'b');
    ui.layout(['a', 'b'], '1fr', '1fr 1.5fr');
    ui.slider('T₀', 2.5, 40, .5, T0, 1, v => { T0 = v; ui.update(); });
    pT.draw = (c, w, h) => { const v = mkView(w, h, -20, 20, -.3, 1.4); axes(c, v, { xl: 't', yn: 2 }); c.save(); clipTo(c, v); c.fillStyle = COL.c1; c.globalAlpha = .5; c.strokeStyle = COL.c1;
      for (let k = Math.floor(-20 / T0) - 1; k <= 20 / T0 + 1; k++) { const a = v.X(k * T0 - 1), b = v.X(k * T0 + 1); c.fillRect(a, v.Y(1), b - a, v.Y(0) - v.Y(1)); } c.restore(); };
    pS.draw = (c, w, h) => { const v = mkView(w, h, -12, 12, -1, 2.4); axes(c, v, { xl: 'ω', yn: 3 }); curve(c, v, x => 2 * sx(x), -12, 12, COL.sub, 1.5, 600, { dash: [5, 4] });
      const w0 = TAU / T0, ks = []; for (let k = Math.ceil(-12 / w0); k <= 12 / w0; k++) ks.push([k * w0, 2 * sx(k * w0)]); stems(c, v, ks, COL.main, ks.length > 120 ? 1 : 2, ks.length > 120 ? 1.4 : 3); };
    ui.update = () => { pS.tags([['ω₀ = ' + fx(TAU / T0, 2), 'neu'], [T0 > 15 ? 'gần như liên tục' : 'rời rạc', T0 > 15 ? 'ok' : 'neu']]); ui.refresh(); };
  } });

  /* B7·4 — Xung vuông ↔ sinc, dịch thời gian */
  L7.push({ name: 'Xung ↔ sinc', tip: 'C.3–C.5 · hẹp ↔ rộng; dịch t₀ chỉ đổi pha', build(ui) {
    let a = 1, t0 = 0;
    const pT = ui.panel('<i>p<sub>a</sub></i>(<i>t</i> − <i>t</i>₀)', 'a'), pM = ui.panel('|<i>X</i>(ω)| = |2sin(ωa)/ω|', 'b'), pP = ui.panel('∠<i>X</i>(ω) = −ω<i>t</i>₀ (+π khi sinc < 0)', 'c');
    ui.layout(['a a', 'b c'], '1fr 1fr', '.8fr 1.2fr');
    ui.slider('a', .3, 3, .1, a, 1, v => { a = v; ui.update(); }); ui.slider('t₀', -3, 3, .1, t0, 1, v => { t0 = v; ui.update(); });
    const re = w => 2 * a * sx(w * a);
    pT.draw = (c, w, h) => { const v = mkView(w, h, -8, 8, -.3, 1.4); axes(c, v, { xl: 't', yn: 2 }); const f = t => (Math.abs(t - t0) < a ? 1 : 0); curve(c, v, f, -8, 8, COL.main, 2.4, 1200, { jump: .5 }); area(c, v, f, -8, 8, COL.main, .15, 1200); };
    pM.draw = (c, w, h) => { const v = mkView(w, h, -12, 12, 0, 6.4); axes(c, v, { xl: 'ω', yn: 3 }); curve(c, v, w2 => Math.abs(re(w2)), -12, 12, COL.c2, 2.2, 700); };
    pP.draw = (c, w, h) => { const v = mkView(w, h, -12, 12, -PI * 1.1, PI * 1.1); axes(c, v, { xl: 'ω', yn: 4, yfmt: pif }); curve(c, v, w2 => { const s = re(w2); return Math.abs(s) < 1e-3 ? NaN : Math.atan2(-s * Math.sin(w2 * t0), s * Math.cos(w2 * t0)); }, -12, 12, COL.c1, 2, 900, { jump: 3 }); };
    ui.update = () => { pM.tags([['lobe chính 2π/a = ' + fx(TAU / a, 1), 'neu']]); pP.tags([[Math.abs(t0) < .05 ? 'pha 0 / π' : 'đường thẳng dốc −t₀', 'ok']]); ui.refresh(); };
  } });

  /* B7·5 — DTFT */
  L7.push({ name: 'DTFT', tip: 'D.2 · aⁿu[n] ↔ 1/(1−ae^{−jΩ}); X tuần hoàn 2π', build(ui) {
    let a = .5;
    const pX = ui.panel('<i>x</i>[<i>n</i>] = <i>a<sup>n</sup></i><i>u</i>[<i>n</i>]', 'a'), pM = ui.panel('|<i>X</i>(Ω)| (hai chu kỳ)', 'b'), pP = ui.panel('∠<i>X</i>(Ω)', 'c');
    ui.layout(['a b', 'a c'], '1fr 1.4fr', '1fr 1fr');
    ui.slider('a', -.9, .95, .05, a, 2, v => { a = v; ui.update(); });
    const D = W => [1 - a * Math.cos(W), a * Math.sin(W)];
    pX.draw = (c, w, h) => { const v = mkView(w, h, -3, 14, -1.2, 1.2); axes(c, v, { xl: 'n', yn: 4 }); stems(c, v, range(0, 14).map(n => [n, Math.pow(a, n)]), COL.main, 2.4); };
    pM.draw = (c, w, h) => { const v = mkView(w, h, -2, 2, 0, Math.max(2.2, 1.1 / (1 - Math.abs(a)))); axes(c, v, { xl: 'Ω/π', xfmt: x => tl(x), yn: 3 }); curve(c, v, u => 1 / cabs(D(u * PI)), -2, 2, COL.c2, 2.2, 600); };
    pP.draw = (c, w, h) => { const v = mkView(w, h, -2, 2, -PI * 1.1, PI * 1.1); axes(c, v, { xl: 'Ω/π', xfmt: x => tl(x), yn: 4, yfmt: pif }); curve(c, v, u => -carg(D(u * PI)), -2, 2, COL.c1, 2.2, 600, { jump: 3 }); };
    ui.update = () => { pM.tags([[a > 0 ? 'thông thấp' : a < 0 ? 'thông cao' : 'phẳng', 'ok'], ['|X(0)| = ' + fx(1 / (1 - a), 2), 'neu']]); ui.refresh(); };
  } });

  /* B8·1 — Từ phổ cộng lại thành tín hiệu */
  L8.push({ name: 'Từ phổ → x(t)', tip: 'Thực chẵn → cos; ảo lẻ → sin (Quiz 7, câu 6–7)', build(ui) {
    let A = [2, 1, .5], ty = 'cos';
    const pS = ui.panel('phổ <i>c<sub>k</sub></i>: <span style="color:var(--c1)">Re</span> · <span style="color:var(--c2)">Im</span>', 'a'), pT = ui.panel('<i>x</i>(<i>t</i>) = Σ <i>c<sub>k</sub></i>e<sup>jkω₀t</sup>', 'b');
    ui.layout(['a b'], '1fr 1.5fr', '1fr');
    A.forEach((v0, i) => ui.slider('A' + (i + 1), 0, 3, .1, v0, 1, v => { A[i] = v; ui.update(); }));
    ui.seg([['cos', 'c thực, chẵn'], ['sin', 'c ảo, lẻ']], ty, k => { ty = k; ui.update(); });
    const f = (u, i) => ty === 'cos' ? A[i] * Math.cos((i + 1) * u * TAU) : A[i] * Math.sin((i + 1) * u * TAU);
    pS.draw = (c, w, h) => { const v = mkView(w, h, -3.6, 3.6, -1.7, 1.7); axes(c, v, { xl: 'k', yn: 4 }); const pts = [[], []];
      for (let i = 0; i < 3; i++) { const k = i + 1, h2 = A[i] / 2; if (ty === 'cos') { pts[0].push([k, h2], [-k, h2]); } else { pts[1].push([k, -h2], [-k, h2]); } }
      stems(c, v, pts[0], COL.c1, 3, 3, -3); stems(c, v, pts[1], COL.c2, 3, 3, 3); };
    pT.draw = (c, w, h) => { const M = Math.max(1, A[0] + A[1] + A[2]) * 1.1, v = mkView(w, h, -1, 1, -M, M); axes(c, v, { xl: 't/T₀' });
      for (let i = 0; i < 3; i++) curve(c, v, u => f(u, i), -1, 1, COL.sub, 1, 600, { dash: [4, 4] }); curve(c, v, u => f(u, 0) + f(u, 1) + f(u, 2), -1, 1, COL.main, 2.4, 900); };
    ui.update = () => { pS.tags([[ty === 'cos' ? 'c₋ₖ = cₖ = A/2 ⇒ A·cos' : 'cₖ = −jA/2, c₋ₖ = +jA/2 ⇒ A·sin', 'ok']]); ui.refresh(); };
  } });

  /* B8·2 — FT ngược của phổ vuông */
  L8.push({ name: 'Phổ vuông → sinc', tip: 'Đối ngẫu: phổ rộng ↔ xung hẹp, 1/(2π) trong FT ngược', build(ui) {
    let W = 3;
    const pS = ui.panel('<i>X</i>(ω) = <i>p<sub>W</sub></i>(ω)', 'a'), pT = ui.panel('<i>x</i>(<i>t</i>) = sin(<i>W t</i>) / (π<i>t</i>)', 'b');
    ui.layout(['a b'], '1fr 1.5fr', '1fr');
    ui.slider('W', .5, 6, .25, W, 2, v => { W = v; ui.update(); });
    pS.draw = (c, w, h) => { const v = mkView(w, h, -8, 8, -.3, 1.4); axes(c, v, { xl: 'ω', yn: 2 }); const f = x => (Math.abs(x) < W ? 1 : 0); curve(c, v, f, -8, 8, COL.main, 2.4, 1200, { jump: .5 }); area(c, v, f, -8, 8, COL.main, .15, 1200); };
    pT.draw = (c, w, h) => { const v = mkView(w, h, -10, 10, -.3 * 6 / PI, 6.4 / PI); axes(c, v, { xl: 't', yn: 4 }); curve(c, v, t => W / PI * sx(W * t), -10, 10, COL.c2, 2.2, 1200); };
    ui.update = () => { pT.tags([['x(0) = W/π = ' + fx(W / PI, 2), 'neu'], ['lobe 2π/W = ' + fx(TAU / W, 2), 'ok']]); ui.refresh(); };
  } });

  /* B8·3 — DTFS ngược */
  L8.push({ name: 'DTFS ngược', tip: 'X[k] = δ[k−k₀] ⇒ x[n] = e^{jk₀Ω₀n}: chu kỳ cơ bản N/gcd(N,k₀)', build(ui) {
    let N = 8, k0 = 1, cs = 0;
    const pS = ui.panel('<i>X</i>[<i>k</i>]', 'a'), pT = ui.panel('<i>x</i>[<i>n</i>]: <span style="color:var(--c1)">Re</span> · <span style="color:var(--c2)">Im</span>', 'b'), pC = ui.panel('các điểm e<sup>jk₀Ω₀n</sup> trên đường tròn đơn vị', 'c');
    ui.layout(['a c', 'b c'], '1.4fr 1fr', '1fr 1fr');
    ui.slider('N', 4, 16, 1, N, 0, v => { N = v; ui.update(); }); ui.slider('k₀', 0, 15, 1, k0, 0, v => { k0 = v; ui.update(); });
    ui.seg([['0', 'δ[k−k₀]'], ['1', 'δ[k−k₀]+δ[k+k₀]']], '0', k => { cs = +k; ui.update(); });
    const kk = () => k0 % N, val = n => { const a = TAU * kk() * n / N; return cs ? [2 * Math.cos(a), 0] : [Math.cos(a), Math.sin(a)]; };
    pS.draw = (c, w, h) => { const v = mkView(w, h, -.5, N - .5, 0, 1.4 * (cs ? 1 : 1)); axes(c, v, { xl: 'k', xn: N, yn: 2 }); const k = kk(); stems(c, v, cs ? [[k, 1], [(N - k) % N, 1]] : [[k, 1]], COL.main, 3.4); };
    pT.draw = (c, w, h) => { const M = cs ? 2.4 : 1.4, v = mkView(w, h, -.5, 2 * N - .5, -M, M); axes(c, v, { xl: 'n', xn: 2 * N, yn: 4 }); const ns = range(0, 2 * N - 1);
      stems(c, v, ns.map(n => [n, val(n)[0]]), COL.c1, 2.4, 3, -2); if (!cs) stems(c, v, ns.map(n => [n, val(n)[1]]), COL.c2, 2.4, 3, 2); };
    pC.draw = (c, w, h) => { const R = Math.min(w, h) / 2 - 22, cx = w / 2, cy = h / 2; c.save(); c.strokeStyle = COL.grid; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke(); c.restore();
      for (let n = 0; n < N; n++) { const a = TAU * kk() * n / N, x = cx + R * Math.cos(a), y = cy - R * Math.sin(a); mark(c, 'd', x, y, n ? COL.c1 : COL.main); txt(c, n, x + (Math.cos(a) >= 0 ? 9 : -9), y - 8, COL.sub, Math.cos(a) >= 0 ? 'left' : 'right'); } };
    ui.update = () => { const k = kk(), P = k ? N / gcd(N, k) : 1; pT.tags([['chu kỳ cơ bản = ' + P, 'ok']]); pC.tags([['Ω₀k₀ = ' + fx(2 * k / N, 2) + 'π', 'neu']]); ui.refresh(); };
  } });

  /* B9·1 — Đáp ứng tần số liên tục */
  L9.push({ name: 'H(ω) liên tục', tip: 'x = DC + cos ω₀t qua H = 1/(a+jω): đo |H|, ∠H tại ω₀ và 0', build(ui) {
    let a = 1, w0 = 2, dc = 1;
    const pM = ui.panel('|<i>H</i>(ω)|', 'a'), pP = ui.panel('∠<i>H</i>(ω)', 'b'), pT = ui.panel('<i>x</i>(<i>t</i>) <span style="color:var(--sub)">- -</span> và <i>y</i>(<i>t</i>) = <i>H</i>(0)·DC + |<i>H</i>|cos(ω₀<i>t</i>+∠<i>H</i>)', 'c');
    ui.layout(['a c', 'b c'], '1fr 1.5fr', '1fr 1fr');
    ui.slider('a', .2, 4, .1, a, 1, v => { a = v; ui.update(); }); ui.slider('ω₀', 0, 8, .1, w0, 1, v => { w0 = v; ui.update(); }); ui.slider('DC', 0, 2, .1, dc, 1, v => { dc = v; ui.update(); });
    const H = w => cdiv([1, 0], [a, w]);
    pM.draw = (c, w, h) => { const v = mkView(w, h, -10, 10, 0, Math.max(1.2, 1.2 / a)); axes(c, v, { xl: 'ω', yn: 3 }); curve(c, v, w2 => cabs(H(w2)), -10, 10, COL.c2, 2.2, 500); for (const s of [-1, 1]) mark(c, 'd', v.X(s * w0), v.Y(cabs(H(w0))), COL.main); };
    pP.draw = (c, w, h) => { const v = mkView(w, h, -10, 10, -PI / 2 * 1.15, PI / 2 * 1.15); axes(c, v, { xl: 'ω', yn: 4, yfmt: pif }); curve(c, v, w2 => carg(H(w2)), -10, 10, COL.c1, 2.2, 500); for (const s of [-1, 1]) mark(c, 'd', v.X(s * w0), v.Y(carg(H(s * w0))), COL.main); };
    pT.draw = (c, w, h) => { const hm = cabs(H(w0)), ph = carg(H(w0)), M = (dc + 1) * 1.1 + .1, v = mkView(w, h, 0, 12, -M, M); axes(c, v, { xl: 't' });
      curve(c, v, t => dc + Math.cos(w0 * t), 0, 12, COL.sub, 1.5, 900, { dash: [5, 4] }); curve(c, v, t => dc / a + hm * Math.cos(w0 * t + ph), 0, 12, COL.main, 2.4, 900); };
    ui.update = () => { const hm = cabs(H(w0)); pM.tags([['|H(ω₀)| = ' + fx(hm, 2), 'neu'], ['H(0) = ' + fx(1 / a, 2), 'neu']]); pP.tags([['∠H(ω₀) = ' + fx(carg(H(w0)) / PI, 2) + 'π', 'neu']]); ui.refresh(); };
  } });

  /* B9·2 — Đáp ứng tần số rời rạc */
  L9.push({ name: 'H(Ω) rời rạc', tip: 'x[n] = DC + cos Ω₀n qua H = 1/(1−ae^{−jΩ}) (Quiz 8, câu 4–5)', build(ui) {
    let a = -.5, u0 = .5, dc = 1;
    const pM = ui.panel('|<i>H</i>(Ω)|', 'a'), pP = ui.panel('∠<i>H</i>(Ω)', 'b'), pT = ui.panel('<i>x</i>[<i>n</i>] (xám) và <i>y</i>[<i>n</i>] (vàng)', 'c');
    ui.layout(['a c', 'b c'], '1fr 1.5fr', '1fr 1fr');
    ui.slider('a', -.9, .9, .05, a, 2, v => { a = v; ui.update(); }); ui.slider('Ω₀/π', 0, 1, .0625, u0, 2, v => { u0 = v; ui.update(); }); ui.slider('DC', 0, 2, .1, dc, 1, v => { dc = v; ui.update(); });
    const H = W => cdiv([1, 0], [1 - a * Math.cos(W), a * Math.sin(W)]);
    pM.draw = (c, w, h) => { const v = mkView(w, h, -1, 1, 0, Math.max(2, 1.15 / (1 - Math.abs(a)))); axes(c, v, { xl: 'Ω/π', xfmt: x => tl(x), yn: 3 }); curve(c, v, u => cabs(H(u * PI)), -1, 1, COL.c2, 2.2, 400); for (const s of [-1, 1]) mark(c, 'd', v.X(s * u0), v.Y(cabs(H(s * u0 * PI))), COL.main); };
    pP.draw = (c, w, h) => { const v = mkView(w, h, -1, 1, -PI * 1.1, PI * 1.1); axes(c, v, { xl: 'Ω/π', xfmt: x => tl(x), yn: 4, yfmt: pif }); curve(c, v, u => carg(H(u * PI)), -1, 1, COL.c1, 2.2, 400, { jump: 3 }); for (const s of [-1, 1]) mark(c, 'd', v.X(s * u0), v.Y(carg(H(s * u0 * PI))), COL.main); };
    pT.draw = (c, w, h) => { const W = u0 * PI, hm = cabs(H(W)), ph = carg(H(W)), h0 = cabs(H(0)), M = (dc * h0 + hm) * 1.1 + 1.2, v = mkView(w, h, -1, 30, -M, M); axes(c, v, { xl: 'n', yn: 4 }); const ns = range(0, 29);
      stems(c, v, ns.map(n => [n, dc + Math.cos(W * n)]), COL.sub, 1.6, 2.6, -2); stems(c, v, ns.map(n => [n, dc * h0 + hm * Math.cos(W * n + ph)]), COL.main, 2.4, 3, 2); };
    ui.update = () => { const W = u0 * PI; pM.tags([['|H(Ω₀)| = ' + fx(cabs(H(W)), 2), 'neu'], ['H(0) = ' + fx(cabs(H(0)), 3), 'neu']]); ui.refresh(); };
  } });

  /* B9·3 — Lọc nhiều thành phần tần số */
  L9.push({ name: 'Lọc nhiều tần số', tip: 'Y = X·H: mỗi vạch phổ được nhân riêng với H tại tần số của nó', build(ui) {
    let wc = 2, w1 = 1, w2 = 5;
    const pS = ui.panel('vạch phổ vào (xám) và ra (vàng)', 'a'), pH = ui.panel('|<i>H</i>(ω)| = 1/√(1+(ω/ω<sub>c</sub>)²)', 'b'), pT = ui.panel('<i>x</i>(<i>t</i>) = 1 + cos ω₁<i>t</i> + cos ω₂<i>t</i>  →  <i>y</i>(<i>t</i>)', 'c');
    ui.layout(['a b', 'c c'], '1.3fr 1fr', '1fr 1.2fr');
    ui.slider('ω<sub>c</sub>', .5, 6, .1, wc, 1, v => { wc = v; ui.update(); }); ui.slider('ω₁', .5, 8, .1, w1, 1, v => { w1 = v; ui.update(); }); ui.slider('ω₂', .5, 8, .1, w2, 1, v => { w2 = v; ui.update(); });
    const H = w => cdiv([1, 0], [1, w / wc]);
    pS.draw = (c, w, h) => { const v = mkView(w, h, -9, 9, 0, 1.3); axes(c, v, { xl: 'ω', yn: 3 }); const L = [[0, 1], [w1, .5], [-w1, .5], [w2, .5], [-w2, .5]];
      stems(c, v, L, COL.sub, 3, 3, -3); stems(c, v, L.map(([x, y]) => [x, y * cabs(H(x))]), COL.main, 3, 3, 3); };
    pH.draw = (c, w, h) => { const v = mkView(w, h, -9, 9, 0, 1.2); axes(c, v, { xl: 'ω', yn: 3 }); curve(c, v, x => cabs(H(x)), -9, 9, COL.c2, 2.2, 400); };
    pT.draw = (c, w, h) => { const v = mkView(w, h, 0, 14, -1.4, 3.4); axes(c, v, { xl: 't' }); const y = t => 1 + cabs(H(w1)) * Math.cos(w1 * t + carg(H(w1))) + cabs(H(w2)) * Math.cos(w2 * t + carg(H(w2)));
      curve(c, v, t => 1 + Math.cos(w1 * t) + Math.cos(w2 * t), 0, 14, COL.sub, 1.4, 1200, { dash: [5, 4] }); curve(c, v, y, 0, 14, COL.main, 2.4, 1200); };
    ui.update = () => { pS.tags([[w1 < wc ? 'ω₁ qua' : 'ω₁ bị chặn', w1 < wc ? 'ok' : 'bad'], [w2 < wc ? 'ω₂ qua' : 'ω₂ bị chặn', w2 < wc ? 'ok' : 'bad']]); ui.refresh(); };
  } });

  /* B10 — Đọc đồ thị phổ → tín hiệu (builder dùng cho 2 tab) */
  function specTab(filt) {
    return { name: filt ? 'Y = X·H' : 'Phổ → x(t)', tip: filt ? 'Nhân phổ với H(kω₀): đổi biên độ và cộng pha' : 'Quiz 9 · đọc |X|, ∠X tại 0, ±200π, ±400π rồi dựng x(t)', build(ui) {
      let A0 = 1, s0 = 0, A = [.75, 1], P = [-45, 45], sym = 1, kc = 1;
      const pA = ui.panel(filt ? '|<i>X</i>| (xám) và |<i>Y</i>| (vàng) theo <i>k</i> (ω = <i>k</i>·200π)' : '|<i>X</i>(ω)| tại ω = <i>k</i>·200π', 'a'), pP = ui.panel('∠<i>X</i>(ω) (độ)', 'b'),
        pT = ui.panel('<span style="color:var(--c1)">Re</span><i>x</i>(<i>t</i>) · <span style="color:var(--c2)">Im</span><i>x</i>(<i>t</i>)' + (filt ? ' · <span style="color:var(--main)">Re <i>y</i></span>' : ''), 'c');
      ui.layout(['a b', 'c c'], '1fr 1fr', '1fr 1.2fr');
      ui.slider('|X(0)|', 0, 2, .05, A0, 2, v => { A0 = v; ui.update(); }); ui.seg([['0', '∠X(0)=0'], ['1', '∠X(0)=π']], '0', k => { s0 = +k; ui.update(); });
      ui.slider('|X₁|', 0, 2, .05, A[0], 2, v => { A[0] = v; ui.update(); }); ui.slider('∠X₁°', -180, 180, 15, P[0], 0, v => { P[0] = v; ui.update(); });
      ui.slider('|X₂|', 0, 2, .05, A[1], 2, v => { A[1] = v; ui.update(); }); ui.slider('∠X₂°', -180, 180, 15, P[1], 0, v => { P[1] = v; ui.update(); });
      ui.seg([['1', 'pha lẻ (x thực)'], ['-1', 'pha chẵn (x phức)']], '1', k => { sym = +k; ui.update(); });
      if (filt) ui.slider('k<sub>c</sub>', .3, 4, .1, kc, 1, v => { kc = v; ui.update(); });
      const r = PI / 180, Hk = k => (filt ? cdiv([1, 0], [1, k / kc]) : [1, 0]);
      const X = () => { const o = {}; o[0] = [s0 ? -A0 : A0, 0]; for (let i = 0; i < 2; i++) { const k = i + 1, c1 = [A[i] * Math.cos(P[i] * r), A[i] * Math.sin(P[i] * r)]; o[k] = c1; o[-k] = [c1[0], -sym * c1[1]]; } return o; };
      const Y = () => { const o = X(); for (const k in o) o[k] = cmul(o[k], Hk(+k)); return o; };
      const ev = (o, u) => { let s = [0, 0]; for (const k in o) s = cadd(s, cmul(o[k], [Math.cos(TAU * k * u), Math.sin(TAU * k * u)])); return s; };
      pA.draw = (c, w, h) => { const o = X(), y = Y(), v = mkView(w, h, -3, 3, 0, 2.2); axes(c, v, { xl: 'k', xn: 6, yn: 3 }); stems(c, v, Object.keys(o).map(k => [+k, cabs(o[k])]), COL.sub, 3, 3, filt ? -3 : 0); if (filt) stems(c, v, Object.keys(y).map(k => [+k, cabs(y[k])]), COL.main, 3, 3, 3); };
      pP.draw = (c, w, h) => { const o = X(), y = filt ? Y() : o, v = mkView(w, h, -3, 3, -200, 200); axes(c, v, { xl: 'k', xn: 6, yn: 4 }); const ph = q => Object.keys(q).filter(k => cabs(q[k]) > 1e-3).map(k => [+k, carg(q[k]) * 180 / PI]);
        stems(c, v, ph(o), COL.c1, 3, 3, filt ? -3 : 0); if (filt) stems(c, v, ph(y), COL.main, 3, 3, 3); };
      pT.draw = (c, w, h) => { const o = X(), y = Y(); let M = .5; for (let i = 0; i <= 80; i++) { const u = -1 + i / 40, s = ev(o, u), q = ev(y, u); M = Math.max(M, Math.abs(s[0]), Math.abs(s[1]), Math.abs(q[0])); }
        const v = mkView(w, h, -1, 1, -M * 1.12, M * 1.12); axes(c, v, { xl: 't/T₀ (T₀ = 10 ms)' }); curve(c, v, u => ev(o, u)[0], -1, 1, COL.c1, 2.4, 800); if (sym < 0) curve(c, v, u => ev(o, u)[1], -1, 1, COL.c2, 2, 800); if (filt) curve(c, v, u => ev(y, u)[0], -1, 1, COL.main, 2.4, 800); };
      ui.update = () => { let mi = 0; const o = X(); for (let i = 0; i <= 80; i++) mi = Math.max(mi, Math.abs(ev(o, -1 + i / 40)[1])); pT.tags([mi < 1e-6 ? ['x(t) thực', 'ok'] : ['x(t) phức', 'bad']]); ui.refresh(); };
    } };
  }
  L10.push(specTab(false), specTab(true));

  /* ---------- lõi popup ---------- */
  const LESSONS = {};
  let pop, tabsEl, bodyEl, ctlEl, titleEl, open = false, curLesson = null, ui = null, raf = 0, last = 0, idx = 0;
  const FLASK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>';
  function ensureDOM() {
    if (pop) return;
    pop = el('div', 'lab-pop'); pop.id = 'labPop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'true'); pop.setAttribute('aria-label', 'Phòng thí nghiệm');
    pop.innerHTML = `<div class="lab-box"><div class="lab-head"><div class="lab-brand">${FLASK}<span class="lab-bt"></span></div><div class="lab-tabs"></div><button type="button" class="lab-x" aria-label="Đóng (Esc)">✕</button></div><div class="lab-body"></div><div class="lab-ctl"></div></div>`;
    document.body.appendChild(pop);
    tabsEl = pop.querySelector('.lab-tabs'); bodyEl = pop.querySelector('.lab-body'); ctlEl = pop.querySelector('.lab-ctl'); titleEl = pop.querySelector('.lab-bt');
    pop.addEventListener('click', e => { if (e.target === pop || e.target.closest('.lab-x')) toggle(0, false); });
    document.addEventListener('keydown', e => {
      if (!open) return;
      if (e.key === 'Escape' || ((e.key === 'l' || e.key === 'L') && !e.target.matches('input,textarea'))) { e.preventDefault(); toggle(0, false); return; }
      if (/^[1-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey && curLesson) { const i = +e.key - 1; if (curLesson.tabs[i]) selectTab(i); }
    });
  }
  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function loop(ts) { raf = 0; if (!open || !ui || !ui.anim) return; const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts; ui.anim(dt); raf = requestAnimationFrame(loop); }
  function selectTab(i) {
    stopLoop(); if (ui) ui.dispose(); ui = null; idx = i;
    bodyEl.replaceChildren(); bodyEl.removeAttribute('style'); ctlEl.replaceChildren();
    [...tabsEl.children].forEach((b, k) => b.classList.toggle('on', k === i));
    const t = curLesson.tabs[i]; ui = makeUI(bodyEl, ctlEl); t.build(ui); ui.update();
    if (ui.anim && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }
  function setLesson(num) {
    const L = LESSONS[num];
    if (curLesson === (L || null) && (L || bodyEl.firstChild)) return;
    curLesson = L || null; tabsEl.replaceChildren(); stopLoop(); if (ui) ui.dispose(); ui = null; bodyEl.replaceChildren(); bodyEl.removeAttribute('style'); ctlEl.replaceChildren();
    if (!L) { titleEl.textContent = 'Phòng thí nghiệm'; bodyEl.append(el('div', 'lab-empty', 'Bài này chưa có phòng thí nghiệm')); return; }
    titleEl.textContent = L.title;
    L.tabs.forEach((t, i) => { const b = el('button', 'lab-tab', t.name); b.type = 'button'; b.title = (t.tip || '') + ' (phím ' + (i + 1) + ')'; b.onclick = () => selectTab(i); tabsEl.append(b); });
    selectTab(0);
  }
  function toggle(num, force, tab) {
    ensureDOM(); readColors();
    const want = force === undefined ? !open : !!force;
    if (want === open) return;
    open = want; pop.classList.toggle('open', open);
    if (open) { setLesson(num); if (tab != null && curLesson && curLesson.tabs[tab] && tab !== idx) selectTab(tab); if (ui) { ui.refresh(); if (ui.anim && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } } }
    else stopLoop();
  }
  window.LAB = { toggle, isOpen: () => open, register: (num, def) => { LESSONS[num] = def; } };
  LESSONS[7] = { title: 'Bài 7 · Chuỗi & biến đổi Fourier', tabs: L7 };
  LESSONS[8] = { title: 'Bài 8 · Fourier ngược', tabs: L8 };
  LESSONS[9] = { title: 'Bài 9 · Đáp ứng tần số', tabs: L9 };
  LESSONS[10] = { title: 'Bài 10 · Đồ thị phổ', tabs: L10 };
  LESSONS[11] = { title: 'Bài 11 · Laplace', tabs: L11 };
})();
