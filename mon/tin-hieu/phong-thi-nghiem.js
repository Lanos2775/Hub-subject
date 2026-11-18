/* ===== PHÒNG THÍ NGHIỆM — Tín hiệu & Hệ thống =====
   Tải lười bởi tin-hieu.js.
   API:
     LAB.toggle(soBai, forceOpen, opts)   // opts: { tab, preset } hoặc chuỗi "roc:vd2"
     LAB.open("11:inv:vd6" | "roc:vd1")   // mở thẳng đúng bài, đúng tab và preset
     LAB.isOpen()
     LAB.has(soBai)
     LAB.register(soBai, { title, tabs:[{ key, name, tip, autoPlay, build(ui, preset) }] })
*/
(function () {
  'use strict';
  if (window.LAB) return;

  /* ---------- hằng & tiện ích toán học ---------- */
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fx = (v, d = 1) => (Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v).toFixed(d).replace('-', '−');
  const tl = v => String(+(+v).toFixed(2)).replace('-', '−');
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const FONT = '11px "Roboto Mono", ui-monospace, Menlo, Consolas, monospace';
  const FONT_SM = '10px "Roboto Mono", ui-monospace, Menlo, Consolas, monospace';

  let COL = {};
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const g = (n, d) => cs.getPropertyValue(n).trim() || d;
    COL = {
      bg: g('--bg', '#323437'),
      card: g('--sub-alt', '#2c2e31'),
      main: g('--main', '#e2b714'),
      sub: g('--sub', '#646669'),
      text: g('--text', '#d1d0c5'),
      err: g('--error', '#ca4754'),
      c1: g('--c1', '#6ea0ff'),
      c2: g('--c2', '#38d9a9'),
      c3: '#f59f00',
      c4: '#ff8787',
      vio: '#b197fc',
      grid: g('--g', '#3d4042')
    };
  }

  /* số phức [re, im] */
  const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => {
    const d = b[0] * b[0] + b[1] * b[1] || 1e-12;
    return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
  };
  const cabs = a => Math.hypot(a[0], a[1]);
  const carg = a => Math.atan2(a[1], a[0]);
  const cexp = a => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };

  /* đa thức (hệ số cao → thấp) */
  const polyMul = (a, b) => {
    const r = Array(a.length + b.length - 1).fill(0);
    a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; }));
    return r;
  };
  const polyAdd = (a, b) => {
    const n = Math.max(a.length, b.length), r = Array(n).fill(0);
    a.forEach((x, i) => { r[n - a.length + i] += x; });
    b.forEach((x, i) => { r[n - b.length + i] += x; });
    return r;
  };
  const trim = p => {
    let i = 0;
    while (i < p.length - 1 && Math.abs(p[i]) < 1e-9) i++;
    return p.slice(i);
  };
  function polyEval(p, s) {
    let v = [0, 0];
    for (const k of p) v = cadd(cmul(v, s), [k, 0]);
    return v;
  }
  function polyFromRoots(rs) {
    let p = [[1, 0]];
    for (const r of rs) {
      const q = Array(p.length + 1).fill(0).map(() => [0, 0]);
      p.forEach((c, i) => {
        q[i] = cadd(q[i], c);
        q[i + 1] = csub(q[i + 1], cmul(r, c));
      });
      p = q;
    }
    return p.map(c => c[0]);
  }
  function polyRoots(p) {
    p = trim(p);
    const n = p.length - 1;
    if (n < 1) return [];
    if (n === 1) return [[-p[1] / p[0], 0]];
    if (n === 2) {
      const A = p[0], B = p[1], C = p[2], D = B * B - 4 * A * C;
      if (D >= 0) {
        const sq = Math.sqrt(D);
        return [[(-B + sq) / (2 * A), 0], [(-B - sq) / (2 * A), 0]];
      }
      const sq = Math.sqrt(-D);
      return [[-B / (2 * A), sq / (2 * A)], [-B / (2 * A), -sq / (2 * A)]];
    }
    const a = p.map(x => x / p[0]);
    const r = [];
    for (let i = 0; i < n; i++) {
      const g = TAU * i / n + .4;
      r.push([.9 * Math.cos(g) * (1 + i * .1), .9 * Math.sin(g) * (1 + i * .1)]);
    }
    for (let it = 0; it < 300; it++) {
      let mx = 0;
      for (let i = 0; i < n; i++) {
        let v = [1, 0];
        for (let k = 1; k <= n; k++) v = cadd(cmul(v, r[i]), [a[k], 0]);
        let d = [1, 0];
        for (let j = 0; j < n; j++) if (j !== i) d = cmul(d, csub(r[i], r[j]));
        const dl = cdiv(v, d);
        r[i] = csub(r[i], dl);
        mx = Math.max(mx, cabs(dl));
      }
      if (mx < 1e-13) break;
    }
    return r.map(z => [Math.abs(z[0]) < 1e-6 ? 0 : z[0], Math.abs(z[1]) < 1e-4 ? 0 : z[1]]);
  }

  /* mô phỏng H(s) = num/den bằng không gian trạng thái (RK4). mode: 'imp' | 'step' | fn(t) */
  function sim(num, den, mode, T, N) {
    num = trim(num);
    den = trim(den);
    const n = den.length - 1, out = new Float64Array(N + 1);
    const a = den.map(x => x / den[0]), nb = Array(n + 1).fill(0);
    num.map(x => x / den[0]).forEach((x, i) => { nb[n + 1 - num.length + i] = x; });
    const d = nb[0], bb = [];
    for (let k = 1; k <= n; k++) bb.push(nb[k] - d * a[k]);
    const uFn = typeof mode === 'function' ? mode : (mode === 'step' ? () => 1 : () => 0);
    if (n === 0) {
      for (let i = 0; i <= N; i++) out[i] = d * uFn(T * i / N);
      return out;
    }
    let x = Array(n).fill(0);
    if (mode === 'imp') x[n - 1] = 1;
    const f = (z, u) => {
      const r = Array(n);
      for (let i = 0; i < n - 1; i++) r[i] = z[i + 1];
      let s = u;
      for (let k = 1; k <= n; k++) s -= a[k] * z[n - k];
      r[n - 1] = s;
      return r;
    };
    const y = (z, u) => {
      let s = d * u;
      for (let k = 1; k <= n; k++) s += bb[k - 1] * z[n - k];
      return s;
    };
    const sub = 5, h = T / N / sub;
    for (let i = 0; i <= N; i++) {
      const tBase = T * i / N;
      out[i] = y(x, uFn(tBase));
      for (let q = 0; q < sub; q++) {
        const tq = tBase + q * h;
        const k1 = f(x, uFn(tq));
        const k2 = f(x.map((v, j) => v + h / 2 * k1[j]), uFn(tq + h / 2));
        const k3 = f(x.map((v, j) => v + h / 2 * k2[j]), uFn(tq + h / 2));
        const k4 = f(x.map((v, j) => v + h * k3[j]), uFn(tq + h));
        x = x.map((v, j) => v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      }
    }
    return out;
  }

  /* ---------- hệ toạ độ & công cụ vẽ Canvas ---------- */
  function mkView(w, h, x0, x1, y0, y1, pad) {
    const P = Object.assign({ l: 34, r: 8, t: 8, b: 17 }, pad || {});
    const iw = Math.max(10, w - P.l - P.r), ih = Math.max(10, h - P.t - P.b);
    return {
      P, x0, x1, y0, y1, iw, ih,
      X: x => P.l + (x - x0) / (x1 - x0) * iw,
      Y: y => P.t + ih - (y - y0) / (y1 - y0) * ih,
      ix: px => x0 + (px - P.l) / iw * (x1 - x0),
      iy: py => y0 + (P.t + ih - py) / ih * (y1 - y0)
    };
  }
  const clipTo = (c, v) => { c.beginPath(); c.rect(v.P.l, v.P.t, v.iw, v.ih); c.clip(); };

  function ticks(a, b, n) {
    const span = Math.abs(b - a) || 1;
    const raw = span / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    const s = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p, out = [];
    for (let v = Math.ceil(a / s - 1e-9) * s; v <= b + 1e-9; v += s) {
      out.push(Math.abs(v) < 1e-9 ? 0 : +v.toFixed(10));
    }
    return out;
  }

  function axes(c, v, o = {}) {
    c.save();
    c.font = FONT_SM;
    c.lineWidth = 1;
    const xt = ticks(v.x0, v.x1, o.xn || Math.max(3, Math.round(v.iw / 68)));
    const yt = ticks(v.y0, v.y1, o.yn || Math.max(2, Math.round(v.ih / 40)));
    c.strokeStyle = COL.grid;
    c.fillStyle = COL.sub;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    for (const x of xt) {
      const px = Math.round(v.X(x)) + .5;
      c.beginPath(); c.moveTo(px, v.P.t); c.lineTo(px, v.P.t + v.ih); c.stroke();
      if (!o.noXL) c.fillText(o.xfmt ? o.xfmt(x) : tl(x), px, v.P.t + v.ih + 2);
    }
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (const y of yt) {
      const py = Math.round(v.Y(y)) + .5;
      c.beginPath(); c.moveTo(v.P.l, py); c.lineTo(v.P.l + v.iw, py); c.stroke();
      if (!o.noYL) c.fillText(o.yfmt ? o.yfmt(y) : tl(y), v.P.l - 4, py);
    }
    c.strokeStyle = COL.sub;
    if (v.y0 <= 0 && v.y1 >= 0) {
      const py = Math.round(v.Y(0)) + .5;
      c.beginPath(); c.moveTo(v.P.l, py); c.lineTo(v.P.l + v.iw, py); c.stroke();
    }
    if (v.x0 <= 0 && v.x1 >= 0) {
      const px = Math.round(v.X(0)) + .5;
      c.beginPath(); c.moveTo(px, v.P.t); c.lineTo(px, v.P.t + v.ih); c.stroke();
    }
    c.fillStyle = COL.text;
    c.globalAlpha = .82;
    if (o.xl) { c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText(o.xl, v.P.l + v.iw - 3, v.P.t + v.ih - 2); }
    if (o.yl) { c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(o.yl, v.P.l + 4, v.P.t + 2); }
    c.restore();
  }

  function curve(c, v, f, a, b, col, lw = 2, n = 260, o = {}) {
    c.save();
    clipTo(c, v);
    c.strokeStyle = col;
    c.lineWidth = lw;
    c.lineJoin = 'round';
    if (o.alpha != null) c.globalAlpha = o.alpha;
    if (o.dash) c.setLineDash(o.dash);
    c.beginPath();
    let pen = false, py = 0;
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n, y = f(x);
      if (!isFinite(y)) { pen = false; continue; }
      if (pen && o.jump && Math.abs(y - py) > o.jump) pen = false;
      const X = v.X(x), Y = clamp(v.Y(y), -2000, 4000);
      if (pen) c.lineTo(X, Y); else { c.moveTo(X, Y); pen = true; }
      py = y;
    }
    c.stroke();
    c.restore();
  }

  const arrF = (arr, t0, dt) => x => {
    const idx = clamp((x - t0) / dt, 0, arr.length - 1);
    const i0 = Math.floor(idx), f = idx - i0;
    return i0 >= arr.length - 1 ? arr[arr.length - 1] : arr[i0] * (1 - f) + arr[i0 + 1] * f;
  };

  function area(c, v, f, a, b, col, al = .2, n = 260) {
    c.save();
    clipTo(c, v);
    c.fillStyle = col;
    c.globalAlpha = al;
    c.beginPath();
    c.moveTo(v.X(a), v.Y(0));
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n, y = f(x);
      c.lineTo(v.X(x), clamp(v.Y(isFinite(y) ? y : 0), -500, 2500));
    }
    c.lineTo(v.X(b), v.Y(0));
    c.closePath();
    c.fill();
    c.restore();
  }

  function param(c, v, f, a, b, col, lw = 2, n = 400, dash) {
    c.save();
    clipTo(c, v);
    c.strokeStyle = col;
    c.lineWidth = lw;
    if (dash) c.setLineDash(dash);
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const p = f(a + (b - a) * i / n);
      const X = clamp(v.X(p[0]), -2000, 4000), Y = clamp(v.Y(p[1]), -2000, 4000);
      if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
    }
    c.stroke();
    c.restore();
  }

  function amp(fns, a, b, n, cap, floor) {
    let m = 0;
    for (const f of fns) {
      for (let i = 0; i <= n; i++) {
        const y = f(a + (b - a) * i / n);
        if (isFinite(y)) m = Math.max(m, Math.abs(y));
      }
    }
    return clamp(m * 1.14, floor, cap);
  }

  const rngA = (arrs, cap, floor) => {
    let lo = 0, hi = 0;
    for (const r of arrs) if (r) for (const y of r) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
    hi = clamp(hi * 1.15, floor, cap);
    lo = -clamp(-lo * 1.15, floor * .18, cap);
    return [lo, hi];
  };

  /* Ký hiệu cực ×, cực bội ×², không ○, điểm ● */
  function mark(c, t, x, y, col, ghost, mult) {
    c.save();
    c.globalAlpha = ghost ? .45 : 1;
    const r = 5.5;
    if (t === 'p') {
      for (const [s, w] of [[COL.bg, 4.5], [col, 2.2]]) {
        c.strokeStyle = s; c.lineWidth = w;
        c.beginPath();
        c.moveTo(x - r, y - r); c.lineTo(x + r, y + r);
        c.moveTo(x + r, y - r); c.lineTo(x - r, y + r);
        c.stroke();
      }
      if (mult && mult > 1) {
        c.font = '700 10px "Roboto Mono", monospace';
        c.fillStyle = col;
        c.fillText('²', x + 7, y - 5);
      }
    } else if (t === 'z') {
      for (const [s, w] of [[COL.bg, 4.5], [col, 2.2]]) {
        c.strokeStyle = s; c.lineWidth = w;
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
      }
    } else {
      c.fillStyle = col;
      c.strokeStyle = COL.bg;
      c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, 4.8, 0, TAU); c.fill(); c.stroke();
    }
    c.restore();
  }

  /* Vẽ mũi tên xung Dirac δ(t) hoặc xung đạo hàm δ'(t) */
  function impulseArrow(c, x, y0, yTip, col, label, isDoublet) {
    c.save();
    c.strokeStyle = col;
    c.fillStyle = col;
    c.lineWidth = 2.5;
    const dir = yTip < y0 ? -1 : 1;
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, yTip); c.stroke();
    c.beginPath();
    c.moveTo(x, yTip);
    c.lineTo(x - 4.5, yTip - dir * 7.5);
    c.lineTo(x + 4.5, yTip - dir * 7.5);
    c.closePath();
    c.fill();
    if (isDoublet) {
      const yOpp = y0 - (yTip - y0) * .65;
      c.beginPath(); c.moveTo(x + 5, y0); c.lineTo(x + 5, yOpp); c.stroke();
      c.beginPath();
      c.moveTo(x + 5, yOpp);
      c.lineTo(x + 1.5, yOpp + dir * 6.5);
      c.lineTo(x + 8.5, yOpp + dir * 6.5);
      c.closePath();
      c.fill();
    }
    if (label) {
      c.font = '700 10.5px "Roboto Mono", monospace';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText(label, x + (isDoublet ? 11 : 7), yTip + (yTip < y0 ? 5 : -5));
    }
    c.restore();
  }

  /* Vẽ đoạn thẳng có mũi tên */
  function arrowSeg(c, x1, y1, x2, y2, col, lw = 1.6, dash = null) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    if (len < 3) return;
    c.save();
    c.strokeStyle = col;
    c.fillStyle = col;
    c.lineWidth = lw;
    if (dash) c.setLineDash(dash);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.setLineDash([]);
    const a = Math.atan2(dy, dx);
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - 6.5 * Math.cos(a - .42), y2 - 6.5 * Math.sin(a - .42));
    c.lineTo(x2 - 6.5 * Math.cos(a + .42), y2 - 6.5 * Math.sin(a + .42));
    c.closePath();
    c.fill();
    c.restore();
  }

  /* Mặt phẳng phức s = σ + jω */
  function splane(c, v, o = {}) {
    c.save();
    c.font = FONT_SM;
    const L = v.P.l, T = v.P.t, W = v.iw, H = v.ih;
    clipTo(c, v);
    if (o.tint) {
      const x0 = clamp(v.X(0), L, L + W);
      c.fillStyle = 'rgba(56,217,169,.065)';
      c.fillRect(L, T, x0 - L, H);
      c.fillStyle = 'rgba(202,71,84,.075)';
      c.fillRect(x0, T, L + W - x0, H);
    }
    for (const r of o.roc || []) {
      const a = Math.max(L, r.a === -Infinity ? L : v.X(r.a));
      const b = Math.min(L + W, r.b === Infinity ? L + W : v.X(r.b));
      if (b <= a) continue;
      c.save();
      c.beginPath(); c.rect(a, T, b - a, H); c.clip();
      c.fillStyle = r.col || COL.c2;
      c.globalAlpha = r.alpha || .16;
      c.fillRect(a, T, b - a, H);
      c.globalAlpha = .32;
      c.strokeStyle = r.col || COL.c2;
      c.lineWidth = 1;
      c.beginPath();
      for (let x = a - H; x < b; x += 9) { c.moveTo(x, T + H); c.lineTo(x + H, T); }
      c.stroke();
      c.restore();
      if (r.a > -1e6) {
        const px = v.X(r.a);
        c.save(); c.strokeStyle = r.col || COL.c2; c.globalAlpha = .7; c.setLineDash([4, 3]);
        c.beginPath(); c.moveTo(px, T); c.lineTo(px, T + H); c.stroke(); c.restore();
      }
      if (r.b < 1e6) {
        const px = v.X(r.b);
        c.save(); c.strokeStyle = r.col || COL.c2; c.globalAlpha = .7; c.setLineDash([4, 3]);
        c.beginPath(); c.moveTo(px, T); c.lineTo(px, T + H); c.stroke(); c.restore();
      }
    }
    c.strokeStyle = COL.grid;
    c.lineWidth = 1;
    const xTicks = ticks(v.x0, v.x1, 6), yTicks = ticks(v.y0, v.y1, 6);
    for (const x of xTicks) {
      const px = Math.round(v.X(x)) + .5;
      c.beginPath(); c.moveTo(px, T); c.lineTo(px, T + H); c.stroke();
    }
    for (const y of yTicks) {
      const py = Math.round(v.Y(y)) + .5;
      c.beginPath(); c.moveTo(L, py); c.lineTo(L + W, py); c.stroke();
    }
    const x0 = v.X(0), y0 = v.Y(0);
    c.strokeStyle = COL.sub;
    c.beginPath(); c.moveTo(L, y0); c.lineTo(L + W, y0); c.stroke();
    c.strokeStyle = COL.main;
    c.lineWidth = 2;
    c.globalAlpha = .85;
    c.beginPath(); c.moveTo(x0, T); c.lineTo(x0, T + H); c.stroke();
    c.globalAlpha = 1;

    c.fillStyle = COL.sub;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    for (const x of xTicks) if (x !== 0) c.fillText(tl(x), v.X(x), clamp(y0 + 3, T + 2, T + H - 12));
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (const y of yTicks) if (y !== 0) c.fillText('j' + tl(y), clamp(x0 - 4, L + 22, L + W - 4), v.Y(y));

    c.fillStyle = COL.text;
    c.textAlign = 'right';
    c.textBaseline = 'bottom';
    c.fillText('σ', L + W - 4, clamp(y0 - 3, T + 12, T + H - 2));
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillStyle = COL.main;
    c.fillText('jω', clamp(x0 + 5, L + 2, L + W - 18), T + 3);

    if (o.vline) {
      c.strokeStyle = o.vline.col;
      c.lineWidth = 1.8;
      c.setLineDash([5, 4]);
      const px = v.X(o.vline.x);
      c.beginPath(); c.moveTo(px, T); c.lineTo(px, T + H); c.stroke();
      c.setLineDash([]);
    }
    if (o.extra) o.extra(c, v);
    for (const it of o.items || []) mark(c, it.t, v.X(it.x), v.Y(it.y), it.col, it.ghost, it.mult);
    c.restore();
  }

  /* Bản đồ nhiệt có bộ nhớ đệm (60fps khi quét ω₀ hoặc xoay 3D) */
  const STOPS = [[0, [20, 24, 40]], [.38, [40, 88, 148]], [.7, [54, 198, 158]], [1, [242, 200, 32]]];
  function cmap(t) {
    t = clamp(t, 0, 1);
    for (let i = 1; i < STOPS.length; i++) {
      if (t <= STOPS[i][0]) {
        const [t0, a] = STOPS[i - 1], [t1, b] = STOPS[i], k = (t - t0) / (t1 - t0);
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
      }
    }
    return STOPS[STOPS.length - 1][1];
  }

  function makeHeatCache() {
    const cv = document.createElement('canvas');
    let lastKey = '';
    return function drawHeat(c, v, f, sigKey) {
      const sc = 3;
      const nx = Math.max(2, Math.ceil(v.iw / sc)), ny = Math.max(2, Math.ceil(v.ih / sc));
      const fullKey = `${nx}x${ny}:${sigKey}`;
      if (fullKey !== lastKey) {
        lastKey = fullKey;
        cv.width = nx; cv.height = ny;
        const g = cv.getContext('2d'), im = g.createImageData(nx, ny);
        for (let j = 0; j < ny; j++) {
          const y = v.iy(v.P.t + (j + .5) * v.ih / ny);
          for (let i = 0; i < nx; i++) {
            const x = v.ix(v.P.l + (i + .5) * v.iw / nx);
            const m = cmap((Math.log10(f(x, y) + 1e-9) + 1.5) / 3);
            const k = (j * nx + i) * 4;
            im.data[k] = m[0]; im.data[k + 1] = m[1]; im.data[k + 2] = m[2]; im.data[k + 3] = 255;
          }
        }
        g.putImageData(im, 0, 0);
      }
      c.save();
      c.imageSmoothingEnabled = true;
      c.drawImage(cv, v.P.l, v.P.t, v.iw, v.ih);
      c.restore();
    };
  }

  /* Mặt nổi 3D |X(s)| có lát cắt jω phát sáng và hạt dò ω₀ */
  function surface3D(c, w, h, mag, az, elAng, pz, probeOm) {
    const nS = 34, nW = 44, s0 = -4, s1 = 2, w0 = -4.5, w1 = 4.5, cap = 3.4, g = [];
    for (let i = 0; i <= nS; i++) {
      g[i] = [];
      const s = s0 + (s1 - s0) * i / nS;
      for (let j = 0; j <= nW; j++) {
        const om = w0 + (w1 - w0) * j / nW;
        g[i][j] = Math.min(mag(s, om), cap) / cap;
      }
    }
    const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(elAng), se = Math.sin(elAng);
    const S = Math.min(w / 3.05, h / 2.55), cx = w * .5, cy = h * .62;
    const P = (s, om, z) => {
      const X = (s + 1) / 3.8, Y = om / 4.2;
      const xr = X * ca - Y * sa, yr = X * sa + Y * ca;
      return [cx + xr * S, cy - (z * ce * 1.12 + yr * se) * S, yr];
    };
    const q = [];
    for (let i = 0; i < nS; i++) {
      for (let j = 0; j < nW; j++) {
        const m = (g[i][j] + g[i + 1][j] + g[i][j + 1] + g[i + 1][j + 1]) * .25;
        const pts = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) =>
          P(s0 + (s1 - s0) * a / nS, w0 + (w1 - w0) * b / nW, g[a][b])
        );
        q.push({ pts, m, d: (pts[0][2] + pts[1][2] + pts[2][2] + pts[3][2]) * .25 });
      }
    }
    q.sort((a, b) => b.d - a.d);
    c.save();
    c.lineJoin = 'round';
    const fl = [[s0, w0], [s1, w0], [s1, w1], [s0, w1]].map(([s, o]) => P(s, o, 0));
    c.strokeStyle = COL.grid; c.lineWidth = 1;
    c.beginPath(); fl.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke();

    for (const k of q) {
      const m = cmap(.08 + .92 * Math.sqrt(k.m));
      c.fillStyle = `rgb(${m[0] | 0},${m[1] | 0},${m[2] | 0})`;
      c.strokeStyle = 'rgba(0,0,0,.2)';
      c.lineWidth = .55;
      c.beginPath();
      k.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
      c.closePath();
      c.fill();
      c.stroke();
    }

    /* lát cắt Fourier σ = 0 */
    c.strokeStyle = COL.main;
    c.lineWidth = 2.6;
    c.beginPath();
    for (let j = 0; j <= 90; j++) {
      const om = w0 + (w1 - w0) * j / 90;
      const z = Math.min(mag(0, om), cap) / cap;
      const p = P(0, om, z);
      j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]);
    }
    c.stroke();

    c.setLineDash([4, 4]); c.globalAlpha = .55;
    c.beginPath();
    const a0 = P(0, w0, 0), b0 = P(0, w1, 0);
    c.moveTo(a0[0], a0[1]); c.lineTo(b0[0], b0[1]); c.stroke();
    c.setLineDash([]); c.globalAlpha = 1;

    for (const it of pz) {
      if (it.x < s0 || it.x > s1 || it.y < w0 || it.y > w1) continue;
      const a = P(it.x, it.y, 0), b = P(it.x, it.y, it.t === 'p' ? 1 : 0);
      if (it.t === 'p') {
        c.strokeStyle = '#fff'; c.globalAlpha = .55; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
        c.globalAlpha = 1;
      }
      mark(c, it.t, a[0], a[1], '#fff');
    }

    if (probeOm != null && probeOm >= w0 && probeOm <= w1) {
      const zp = Math.min(mag(0, probeOm), cap) / cap;
      const pb = P(0, probeOm, 0), pt = P(0, probeOm, zp);
      c.strokeStyle = COL.c2; c.lineWidth = 1.6; c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(pb[0], pb[1]); c.lineTo(pt[0], pt[1]); c.stroke();
      c.setLineDash([]);
      mark(c, 'd', pt[0], pt[1], COL.c2);
    }
    c.restore();
  }

  function sub(c, y, h, fn) { c.save(); c.translate(0, y); fn(h); c.restore(); }
  function txt(c, s, x, y, col, al = 'left', bl = 'middle', fnt = FONT) {
    c.save(); c.font = fnt; c.fillStyle = col || COL.text; c.textAlign = al; c.textBaseline = bl; c.fillText(s, x, y); c.restore();
  }

  /* ---------- Panel tương tác & khung giao diện ---------- */
  class Panel {
    constructor(title, area) {
      this.root = el('div', 'lab-pn');
      if (area) this.root.style.gridArea = area;
      const head = el('div', 'lab-pt');
      this.titleSpan = el('span', 'lab-pt-l', title);
      this.tag = el('span', 'lab-tgs');
      head.append(this.titleSpan, this.tag);
      this.wrap = el('div', 'lab-cv');
      this.cv = el('canvas');
      this.wrap.append(this.cv);
      this.root.append(head, this.wrap);
      this.c = this.cv.getContext('2d');
      this.w = 0; this.h = 0;
      this.hs = [];
      this.zones = [];
      this.hoverIdx = -1;
      this.mouse = null;
      this.draw = null;
      this.onBg = null;
      this.onChange = null;
      this.onDragState = null;

      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this.wrap);

      let drag = null, bg = null;
      const pos = e => { const r = this.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      const hitIdx = (x, y) => {
        let bi = -1, bd = 1e9;
        this.hs.forEach((h, i) => {
          const d = Math.hypot(h.x - x, h.y - y);
          if (d < h.r + 9 && d < bd) { bd = d; bi = i; }
        });
        return bi;
      };
      const hitZone = (x, y) => this.zones.find(z => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1);

      this.cv.addEventListener('pointerdown', e => {
        const [x, y] = pos(e), hi = hitIdx(x, y);
        if (hi >= 0) {
          drag = this.hs[hi];
          this.cv.style.cursor = 'grabbing';
          this.onDragState && this.onDragState(true);
        } else if (this.onBg) {
          bg = [x, y];
          this.cv.style.cursor = 'grabbing';
        } else {
          const z = hitZone(x, y);
          if (z) { z.onClick(x, y); this.onChange && this.onChange(); }
          return;
        }
        try { this.cv.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
      });

      this.cv.addEventListener('pointermove', e => {
        const [x, y] = pos(e);
        this.mouse = [x, y];
        if (drag) {
          drag.move(x, y);
          this.onChange && this.onChange();
        } else if (bg) {
          this.onBg(x - bg[0], y - bg[1]);
          bg = [x, y];
          this.render();
        } else {
          const hi = hitIdx(x, y);
          const z = hi < 0 ? hitZone(x, y) : null;
          this.cv.style.cursor = hi >= 0 ? 'grab' : z ? 'pointer' : this.onBg ? 'move' : 'default';
          if (hi !== this.hoverIdx || this.showCrosshair) {
            this.hoverIdx = hi;
            this.render();
          }
        }
      });

      this.cv.addEventListener('pointerleave', () => {
        if (!drag && !bg) {
          this.mouse = null;
          if (this.hoverIdx >= 0 || this.showCrosshair) {
            this.hoverIdx = -1;
            this.render();
          }
        }
      });

      const up = () => {
        if (drag) this.onDragState && this.onDragState(false);
        drag = null; bg = null;
        this.cv.style.cursor = this.hoverIdx >= 0 ? 'grab' : this.onBg ? 'move' : 'default';
      };
      this.cv.addEventListener('pointerup', up);
      this.cv.addEventListener('pointercancel', up);
    }

    resize() {
      const r = this.wrap.getBoundingClientRect(), w = Math.floor(r.width), h = Math.floor(r.height);
      if (w < 4 || h < 4) return;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      this.cv.width = w * d; this.cv.height = h * d;
      this.w = w; this.h = h; this.d = d;
      this.render();
    }

    render() {
      if (!this.w || !this.draw) return;
      const c = this.c;
      c.setTransform(this.d, 0, 0, this.d, 0, 0);
      c.clearRect(0, 0, this.w, this.h);
      c.font = FONT;
      this.hs = [];
      this.zones = [];
      this.draw(c, this.w, this.h, this);
    }

    tags(a) {
      this.tag.innerHTML = a.map(([t, k]) => `<span class="lab-tg ${k || ''}">${t}</span>`).join('');
    }

    addHandle(c, x, y, move, r = 11, col = COL.main) {
      const idx = this.hs.length;
      const hov = this.hoverIdx === idx;
      this.hs.push({ x, y, r, move });
      c.save();
      if (hov) {
        c.fillStyle = col;
        c.globalAlpha = .16;
        c.beginPath(); c.arc(x, y, r + 3, 0, TAU); c.fill();
      }
      c.strokeStyle = col;
      c.globalAlpha = hov ? .95 : .58;
      c.lineWidth = hov ? 1.8 : 1.2;
      c.setLineDash(hov ? [] : [3, 3]);
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
      c.restore();
    }

    addZone(x0, y0, x1, y1, onClick) {
      this.zones.push({ x0, y0, x1, y1, onClick });
    }

    /* Đọc toạ độ con trỏ chuột mượt mà góc trên phải mà không tốn chữ */
    hoverReadout(c, v, fnY, xLabel = 't', yLabel = 'y', col = COL.c2) {
      this.showCrosshair = true;
      if (!this.mouse) return;
      const [mx, my] = this.mouse;
      if (mx < v.P.l || mx > v.P.l + v.iw || my < v.P.t || my > v.P.t + v.ih) return;
      const xv = v.ix(mx), yv = fnY ? fnY(xv) : v.iy(my);
      if (!isFinite(yv)) return;
      const py = v.Y(yv);
      c.save();
      clipTo(c, v);
      c.strokeStyle = col; c.globalAlpha = .35; c.lineWidth = 1; c.setLineDash([2, 3]);
      c.beginPath(); c.moveTo(mx, v.P.t); c.lineTo(mx, v.P.t + v.ih); c.stroke();
      if (py >= v.P.t && py <= v.P.t + v.ih) {
        c.globalAlpha = .95; c.setLineDash([]);
        mark(c, 'd', mx, py, col);
      }
      c.restore();
      const label = `${xLabel}=${fx(xv, 2)}  ${yLabel}=${fx(yv, 2)}`;
      c.save();
      c.font = FONT_SM;
      const tw = c.measureText(label).width + 10;
      const bx = v.P.l + v.iw - tw - 3, by = v.P.t + 3;
      c.fillStyle = 'rgba(20, 22, 25, .82)';
      c.strokeStyle = COL.grid;
      c.beginPath(); c.roundRect(bx, by, tw, 16, 4); c.fill(); c.stroke();
      c.fillStyle = col; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(label, bx + 5, by + 8.5);
      c.restore();
    }

    dispose() { this.ro.disconnect(); }
  }

  function makeUI(body, ctl, onDragState) {
    const ui = { panels: [], update() { ui.refresh(); }, anim: null, applyPreset: null, hintEl: null };
    ui.refresh = () => ui.panels.forEach(p => p.render());
    ui.layout = (areas, cols, rows) => {
      body.style.gridTemplateAreas = areas.map(a => `"${a}"`).join(' ');
      body.style.gridTemplateColumns = cols;
      body.style.gridTemplateRows = rows;
    };
    ui.panel = (title, area) => {
      const p = new Panel(title, area);
      p.onChange = () => ui.update();
      p.onDragState = onDragState;
      body.append(p.root);
      ui.panels.push(p);
      return p;
    };
    ui.slider = (label, min, max, step, val, d, on) => {
      const w = el('label', 'lab-sl'), i = el('input'), b = el('b', 'lab-sv');
      i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val;
      const show = v => { b.textContent = fx(+v, d); };
      show(val);
      i.oninput = () => { show(i.value); on(+i.value); };
      w.append(el('span', 'lab-sn', label), i, b);
      ctl.append(w);
      return { el: w, set(v) { i.value = v; show(v); } };
    };
    ui.seg = (opts, val, on) => {
      const g = el('div', 'lab-seg'), bs = [];
      const set = k => bs.forEach(([kk, b]) => b.classList.toggle('on', kk === k));
      opts.forEach(([k, t, tip]) => {
        const b = el('button', 'lab-sb', t);
        b.type = 'button';
        if (tip) b.title = tip;
        b.onclick = () => { set(k); on(k); };
        g.append(b);
        bs.push([k, b]);
      });
      set(val);
      ctl.append(g);
      return { el: g, set };
    };
    ui.sep = () => { const s = el('div', 'lab-sep'); ctl.append(s); return { el: s }; };
    ui.hint = text => {
      if (!ui.hintEl) { ui.hintEl = el('span', 'lab-hint'); ctl.append(ui.hintEl); }
      ui.hintEl.textContent = text;
    };
    ui.dispose = () => ui.panels.forEach(p => p.dispose());
    return ui;
  }

  const show = (s, on) => { if (s && s.el) s.el.style.display = on ? '' : 'none'; };
  const pill = (txtStr, ok) => [txtStr, ok ? 'ok' : 'bad'];

  /* =====================================================================
     BÀI 11 — BIẾN ĐỔI LAPLACE (9 MÔ-ĐUN TƯƠNG TÁC TOÀN DIỆN)
     ===================================================================== */
  const L11 = [];

  /* ---------------------------------------------------------------------
     1 · Sóng mũ phức e^{st} & Hàm riêng LTI (Phần A, B.1–B.3, FIG L.1)
     --------------------------------------------------------------------- */
  L11.push({
    key: 'est',
    name: '<i>e</i><sup>st</sup>',
    tip: 'Phần A, B · Sóng mũ phức s = σ + jω & Hàm riêng H(s)e^{st}',
    autoPlay: true,
    build(ui, preset) {
      let sg = -.4, om = 3.5, proj = 'cos', aSys = 1.2, tc = -3;
      const pS = ui.panel('mặt phẳng <i>s</i> — kéo điểm <i>s</i>', 'a');
      const pC = ui.panel('xoắn ốc <i>e</i><sup>st</sup> (mặt phẳng phức)', 'b');
      const pW = ui.panel('hình chiếu thời gian — kéo con chạy <i>t</i>', 'c');
      const pE = ui.panel('hàm riêng hệ LTI: <span style="color:var(--sub)"><i>e</i><sup>st</sup></span> → <span style="color:var(--c2)"><i>H</i>(<i>s</i>)<i>e</i><sup>st</sup></span>', 'd');
      ui.layout(['a b', 'c d'], '1fr 1.18fr', '1.02fr 1fr');

      const segPre = ui.seg([
        ['decay', 'tắt dần'],
        ['fourier', 'σ=0 (Fourier)'],
        ['grow', 'bùng nổ · L.1'],
        ['b3', 'hàm riêng B.3']
      ], 'decay', k => applyP(k));
      ui.sep();
      const segProj = ui.seg([['cos', 'Re (cos)'], ['sin', 'Im (sin)'], ['both', 'Re & Im']], proj, k => { proj = k; ui.update(); });
      const sS = ui.slider('σ', -1.2, 1.2, .05, sg, 2, v => { sg = v; ui.update(); });
      const sO = ui.slider('ω', -8, 8, .1, om, 1, v => { om = v; ui.update(); });
      const sA = ui.slider('p_H', -2.5, -.2, .1, -aSys, 1, v => { aSys = -v; ui.update(); });

      function applyP(k) {
        if (k === 'decay') { sg = -.4; om = 3.5; proj = 'cos'; }
        else if (k === 'fourier') { sg = 0; om = 3.5; proj = 'both'; }
        else if (k === 'grow') { sg = .45; om = 5; proj = 'sin'; }
        else if (k === 'b3') { sg = -.25; om = 3.8; proj = 'cos'; aSys = 1.2; }
        segPre.set(k); segProj.set(proj); sS.set(sg); sO.set(om); sA.set(-aSys);
        ui.update();
      }

      const Hs = () => cdiv([1, 0], [sg + aSys, om]);
      const inSysROC = () => sg > -aSys + 1e-6;

      pS.draw = (c, w, h, p) => {
        const v = mkView(w, h, -2.8, 1.8, -9, 9, { l: 6, r: 6, t: 6, b: 6 });
        splane(c, v, {
          tint: true,
          roc: [{ a: -aSys, b: Infinity, col: COL.c2, alpha: .09 }],
          items: [
            { t: 'p', x: -aSys, y: 0, col: COL.c2 },
            { t: 'd', x: sg, y: -om, col: COL.sub, ghost: 1 },
            { t: 'd', x: sg, y: om, col: COL.main }
          ]
        });
        c.save();
        c.setLineDash([3, 3]); c.strokeStyle = COL.main; c.globalAlpha = .65;
        c.beginPath(); c.moveTo(v.X(sg), v.Y(0)); c.lineTo(v.X(sg), v.Y(om)); c.lineTo(v.X(0), v.Y(om)); c.stroke();
        c.restore();
        p.addHandle(c, v.X(sg), v.Y(om), (x, y) => {
          sg = clamp(v.ix(x), -1.2, 1.2);
          om = clamp(v.iy(y), -8, 8);
          sS.set(sg); sO.set(om);
        });
        p.addHandle(c, v.X(-aSys), v.Y(0), x => {
          aSys = -clamp(v.ix(x), -2.5, -.2);
          sA.set(-aSys);
        }, 9, COL.c2);
      };

      pC.draw = (c, w, h) => {
        const R = clamp(Math.exp(Math.abs(sg) * 2.4), 1.6, 5.5);
        const s = (h - 16) / (2 * R), hw = (w - 16) / s / 2;
        const v = mkView(w, h, -hw, hw, -R, R, { l: 8, r: 8, t: 8, b: 8 });
        axes(c, v, { noXL: 1, noYL: 1 });
        param(c, v, t => [Math.cos(t), Math.sin(t)], 0, TAU, COL.sub, 1.1, 80, [4, 4]);
        const f = t => [Math.exp(sg * t) * Math.cos(om * t), Math.exp(sg * t) * Math.sin(om * t)];
        param(c, v, f, -3, 0, COL.sub, 1.4, 320);
        param(c, v, f, 0, 3, COL.c2, 2.2, 360);
        const m = f(tc);
        arrowSeg(c, v.X(0), v.Y(0), clamp(v.X(m[0]), 4, w - 4), clamp(v.Y(m[1]), 4, h - 4), COL.main, 2);
        mark(c, 'd', clamp(v.X(m[0]), 4, w - 4), clamp(v.Y(m[1]), 4, h - 4), COL.main);
        txt(c, '|z|=1', v.X(1) + 4, v.Y(0) - 8, COL.sub, 'left', 'middle', FONT_SM);
      };

      pW.draw = (c, w, h, p) => {
        const ym = clamp(Math.exp(Math.abs(sg) * 2.7), 1.4, 8);
        const v = mkView(w, h, -3, 3, -ym, ym);
        axes(c, v, { xl: 't' });
        const env = t => Math.exp(sg * t);
        curve(c, v, env, -3, 3, COL.sub, 1.1, 180, { dash: [4, 4] });
        curve(c, v, t => -env(t), -3, 3, COL.sub, 1.1, 180, { dash: [4, 4] });
        if (proj === 'cos' || proj === 'both') curve(c, v, t => env(t) * Math.cos(om * t), -3, 3, COL.c1, 2.2, 600);
        if (proj === 'sin' || proj === 'both') curve(c, v, t => env(t) * Math.sin(om * t), -3, 3, COL.c3, 2, 600);
        const yCur = env(tc) * (proj === 'sin' ? Math.sin(om * tc) : Math.cos(om * tc));
        c.save(); clipTo(c, v); c.strokeStyle = COL.main; c.globalAlpha = .55;
        c.beginPath(); c.moveTo(v.X(tc), v.P.t); c.lineTo(v.X(tc), v.P.t + v.ih); c.stroke(); c.restore();
        const py = clamp(v.Y(yCur), v.P.t, v.P.t + v.ih);
        mark(c, 'd', v.X(tc), py, COL.main);
        p.addHandle(c, v.X(tc), py, x => { tc = clamp(v.ix(x), -3, 3); }, 10, COL.main);
      };

      pE.draw = (c, w, h) => {
        if (!inSysROC()) {
          const v = mkView(w, h, -3, 3, -1, 1); axes(c, v, { xl: 't', noYL: 1 });
          txt(c, 's nằm ngoài ROC của H(s) = 1/(s+' + fx(aSys, 1) + ')', w / 2, h / 2, COL.err, 'center');
          return;
        }
        const H = Hs(), gMag = cabs(H), gPh = carg(H);
        const fnIn = t => Math.exp(sg * t) * (proj === 'sin' ? Math.sin(om * t) : Math.cos(om * t));
        const fnOut = t => gMag * Math.exp(sg * t) * (proj === 'sin' ? Math.sin(om * t + gPh) : Math.cos(om * t + gPh));
        const ym = amp([fnIn, fnOut], -3, 3, 240, 9, 1.2);
        const v = mkView(w, h, -3, 3, -ym, ym);
        axes(c, v, { xl: 't' });
        curve(c, v, fnIn, -3, 3, COL.sub, 1.5, 500, { dash: [4, 3] });
        curve(c, v, fnOut, -3, 3, COL.c2, 2.3, 550);
        mark(c, 'd', v.X(tc), clamp(v.Y(fnOut(tc)), v.P.t, v.P.t + v.ih), COL.c2);
      };

      ui.update = () => {
        pS.tags([
          sg < -.02 ? ['σ<0 tắt dần', 'ok'] : sg > .02 ? ['σ>0 bùng nổ', 'bad'] : ['σ=0 đều', 'neu']
        ]);
        pW.tags([[`t = ${fx(tc, 2)}`, 'inf']]);
        if (inSysROC()) {
          const H = Hs();
          pE.tags([[`|H|=${fx(cabs(H), 2)}`, 'ok'], [`∠H=${fx(carg(H) * 180 / Math.PI, 0)}°`, 'inf']]);
        } else {
          pE.tags([['s ∉ ROC(H)', 'bad']]);
        }
        ui.refresh();
      };

      ui.anim = dt => {
        tc += dt * .95;
        if (tc > 3) tc = -3;
        pW.tags([[`t = ${fx(tc, 2)}`, 'inf']]);
        pC.render(); pW.render(); pE.render();
      };

      ui.applyPreset = applyP;
      if (preset) applyP(preset);
    }
  });

  /* ---------------------------------------------------------------------
     2 · Vùng hội tụ ROC & Liên hệ Fourier (Phần C, E.1, K, FIG L.2, VD 1–3)
     --------------------------------------------------------------------- */
  L11.push({
    key: 'roc',
    name: 'ROC',
    tip: 'Phần C, K · Vùng hội tụ, tích phân |x·e^{−σt}| và bẫy u(t)',
    autoPlay: false,
    build(ui, preset) {
      let kind = 'R', a = 1, sg = .2, swDir = 1;
      const pT = ui.panel('<span style="color:var(--c1)"><i>x</i>(<i>t</i>)</span> &nbsp;·&nbsp; <span style="color:var(--c2)"><i>x</i>(<i>t</i>)<i>e</i><sup>−σt</sup></span>', 'a');
      const pI = ui.panel('tích phân hội tụ ∫<sub>−T</sub><sup>T</sup> |<i>x</i>(<i>t</i>)<i>e</i><sup>−σt</sup>| <i>dt</i>', 'b');
      const pS = ui.panel('mặt phẳng <i>s</i> — kéo đường σ và cực', 'c');
      const pM = ui.panel('|<i>X</i>(σ+<i>jω</i>)| so với <span style="color:var(--main)">Fourier (σ=0)</span>', 'd');
      ui.layout(['a b', 'c d'], '1.08fr 1fr', '1fr 1.05fr');

      const segKind = ui.seg([
        ['R', 'e<sup>−at</sup>u(t)'],
        ['L', '−e<sup>−at</sup>u(−t)'],
        ['U', 'u(t) · Phần K'],
        ['B', 'e<sup>−a|t|</sup>']
      ], kind, k => { kind = k; vis(); ui.update(); });
      const segPre = ui.seg([
        ['vd1', 'VD1'],
        ['vd2', 'VD2 (e<sup>t</sup>u)'],
        ['vd3', 'VD3 (−e<sup>t</sup>u(−t))']
      ], 'vd1', k => applyP(k));
      const sa = ui.slider('a', -2, 2.5, .1, a, 1, v => { a = v; ui.update(); });
      const ss = ui.slider('σ', -3, 3, .05, sg, 2, v => { sg = v; ui.update(); });
      const vis = () => { show(sa, kind !== 'U'); };

      function applyP(k) {
        if (k === 'vd1') { kind = 'R'; a = 1; sg = .2; }
        else if (k === 'vd2') { kind = 'R'; a = -1; sg = 1.45; }
        else if (k === 'vd3') { kind = 'L'; a = -1; sg = .2; }
        else if (k === 'step') { kind = 'U'; a = 0; sg = .35; }
        else if (k === 'both') { kind = 'B'; a = 1.2; sg = .2; }
        segKind.set(kind);
        if (['vd1', 'vd2', 'vd3'].includes(k)) segPre.set(k);
        sa.set(a); ss.set(sg); vis(); ui.update();
      }

      const effA = () => kind === 'U' ? 0 : a;
      const inR = () => {
        const aa = effA();
        if (kind === 'R' || kind === 'U') return sg > -aa + 1e-6;
        if (kind === 'L') return sg < -aa - 1e-6;
        return aa > 1e-6 && sg > -aa + 1e-6 && sg < aa - 1e-6;
      };
      const hasFourier = () => {
        const aa = effA();
        if (kind === 'U') return false; // jω nằm trên biên, cần thêm πδ(ω)
        if (kind === 'R') return aa > 1e-6;
        if (kind === 'L') return aa < -1e-6;
        return aa > 1e-6;
      };
      const xt = t => {
        const aa = effA();
        if (kind === 'R' || kind === 'U') return t >= 0 ? Math.exp(-aa * t) : 0;
        if (kind === 'L') return t < 0 ? -Math.exp(-aa * t) : 0;
        return Math.exp(-aa * Math.abs(t));
      };
      const wx = t => xt(t) * Math.exp(-sg * t);
      const expInt = (r, T) => Math.abs(r) < 1e-6 ? T : (1 - Math.exp(-r * T)) / r;
      const cumInt = T => {
        const aa = effA();
        if (kind === 'R' || kind === 'U') return expInt(aa + sg, T);
        if (kind === 'L') return expInt(-(aa + sg), T);
        return expInt(aa + sg, T) + expInt(aa - sg, T);
      };
      const totalInt = () => {
        const aa = effA();
        if (!inR()) return Infinity;
        if (kind === 'B') return 1 / (aa + sg) + 1 / (aa - sg);
        return 1 / Math.abs(aa + sg);
      };
      const magAt = (sRe, om) => {
        const aa = effA();
        if (kind === 'B') {
          const c1 = cdiv([1, 0], [sRe + aa, om]), c2 = cdiv([1, 0], [aa - sRe, -om]);
          return cabs(cadd(c1, c2));
        }
        return 1 / Math.hypot(sRe + aa, om);
      };

      pT.draw = (c, w, h, p) => {
        const v = mkView(w, h, -4, 4, -3.2, 3.2);
        axes(c, v, { xl: 't' });
        const col = inR() ? COL.c2 : COL.err;
        area(c, v, wx, -4, 4, col, .22, 480);
        curve(c, v, xt, -4, 4, COL.c1, 1.9, 480, { jump: 1.5 });
        curve(c, v, wx, -4, 4, col, 2.3, 480, { jump: 1.5 });
        p.hoverReadout(c, v, wx, 't', 'x·e⁻σt', col);
      };

      pI.draw = (c, w, h, p) => {
        const ok = inR(), lim = totalInt();
        const ym = ok ? clamp(lim * 1.35, 1.5, 12) : 10;
        const v = mkView(w, h, 0, 6, 0, ym);
        axes(c, v, { xl: 'T' });
        if (ok) {
          curve(c, v, () => lim, 0, 6, COL.sub, 1.2, 20, { dash: [4, 4] });
          txt(c, 'I(∞) = ' + fx(lim, 2), v.P.l + v.iw - 6, clamp(v.Y(lim) - 8, v.P.t + 8, v.P.t + v.ih - 8), COL.c2, 'right', 'middle', FONT_SM);
        }
        curve(c, v, cumInt, 0, 6, ok ? COL.c2 : COL.err, 2.4, 300);
        p.hoverReadout(c, v, cumInt, 'T', '∫', ok ? COL.c2 : COL.err);
      };

      pS.draw = (c, w, h, p) => {
        const aa = effA(), v = mkView(w, h, -3.8, 3.8, -4, 4, { l: 6, r: 6, t: 6, b: 6 });
        const rocs = [];
        if (kind === 'R' || kind === 'U') rocs.push({ a: -aa, b: Infinity, col: COL.c2 });
        else if (kind === 'L') rocs.push({ a: -Infinity, b: -aa, col: COL.c2 });
        else if (aa > 0) rocs.push({ a: -aa, b: aa, col: COL.c2 });

        const items = kind === 'B'
          ? [{ t: 'p', x: -aa, y: 0, col: COL.text }, { t: 'p', x: aa, y: 0, col: COL.text }]
          : [{ t: 'p', x: -aa, y: 0, col: COL.text }];

        splane(c, v, { roc: rocs, items, vline: { x: sg, col: inR() ? COL.c2 : COL.err } });
        if (kind === 'B' && aa <= 0) txt(c, 'ROC = ∅ (rỗng)', w / 2, 22, COL.err, 'center');
        p.addHandle(c, v.X(sg), v.Y(2.5), px => { sg = clamp(v.ix(px), -3, 3); ss.set(sg); }, 10, inR() ? COL.c2 : COL.err);
        if (kind !== 'U') {
          p.addHandle(c, v.X(-aa), v.Y(0), px => { a = -clamp(v.ix(px), -2.5, 2); sa.set(a); }, 10, COL.main);
        }
      };

      pM.draw = (c, w, h, p) => {
        const ok = inR(), ym = ok ? clamp(magAt(sg, 0) * 1.22, 1.8, 8) : 4;
        const v = mkView(w, h, -8, 8, 0, ym);
        axes(c, v, { xl: 'ω' });
        if (hasFourier()) {
          curve(c, v, om => magAt(0, om), -8, 8, COL.main, 1.5, 320, { dash: [4, 4] });
        } else if (kind === 'U') {
          curve(c, v, om => Math.abs(om) < .12 ? NaN : 1 / Math.abs(om), -8, 8, COL.main, 1.4, 320, { dash: [4, 4] });
          impulseArrow(c, v.X(0), v.Y(0), v.P.t + 10, COL.main, 'πδ(ω)', false);
        }
        if (ok) {
          curve(c, v, om => magAt(sg, om), -8, 8, COL.c2, 2.3, 400);
          p.hoverReadout(c, v, om => magAt(sg, om), 'ω', '|X|', COL.c2);
        } else {
          txt(c, 'σ ∉ ROC → X(σ+jω) phân kỳ', w / 2, h / 2, COL.err, 'center');
        }
      };

      ui.update = () => {
        const ok = inR(), hf = hasFourier();
        pT.tags([ok ? pill('∫|·| = ' + fx(totalInt(), 2), true) : pill('∫|·| = ∞', false)]);
        pI.tags([ok ? ['tiệm cận hữu hạn', 'ok'] : ['phân kỳ → ∞', 'bad']]);
        pS.tags([kind === 'U' ? ['jω trên biên: thiếu πδ(ω)', 'neu'] : pill(hf ? 'jω ∈ ROC' : 'jω ∉ ROC', hf)]);
        pM.tags([kind === 'U' ? ['ℱ{u} = πδ(ω) + 1/jω', 'neu'] : ['nét đứt: σ=0', 'inf']]);
        ui.refresh();
      };

      ui.anim = dt => {
        sg += swDir * dt * .85;
        if (sg > 2.4) { sg = 2.4; swDir = -1; }
        if (sg < -2.4) { sg = -2.4; swDir = 1; }
        ss.set(sg);
        ui.update();
      };

      vis();
      ui.applyPreset = applyP;
      if (preset) applyP(preset);
    }
  });

  /* ---------------------------------------------------------------------
     3 · Điểm cực · Điểm không & Hình học 3D (Phần D, D.1)
     --------------------------------------------------------------------- */
  L11.push({
    key: 'pz',
    name: 'Cực·Không',
    tip: 'Phần D · Bản đồ nhiệt, mặt 3D |X(s)| & vectơ hình học tới jω₀',
    autoPlay: false,
    build(ui, preset) {
      const S71 = Math.sqrt(71) / 4; // ≈ 2.1065 (Ví dụ D.1.2)
      const PRE = {
        d1a: () => ({ K: 1, zr: [{ x: 1 }], zc: [], pr: [{ x: -1 }, { x: -2 }], pc: [] }),
        d1b: () => ({ K: 2, zr: [], zc: [{ x: -1.25, y: S71 }], pr: [{ x: -2 }], pc: [{ x: -1, y: 3 }] }),
        res: () => ({ K: 2, zr: [], zc: [], pr: [], pc: [{ x: -.32, y: 3 }] }),
        notch: () => ({ K: 1, zr: [], zc: [{ x: 0, y: 2.5 }], pr: [], pc: [{ x: -.8, y: 2.5 }] })
      };
      let S = PRE.d1a(), az = .62, elAng = .84, om0 = 1.5, vecOn = true, dir = 1;
      const drawHeat = makeHeatCache();

      const pH = ui.panel('|<i>X</i>(<i>s</i>)| — kéo ×, ○ và điểm dò <i>jω</i><sub>0</sub>', 'a');
      const p3 = ui.panel('mặt |<i>X</i>(<i>s</i>)| 3D — kéo nền để xoay', 'b');
      const pF = ui.panel('đáp ứng dọc trục <i>jω</i>: biên độ & pha', 'c');
      ui.layout(['a b', 'a c'], '1.05fr 1fr', '1.08fr 1fr');

      const segPre = ui.seg([
        ['d1a', 'VD D.1a'],
        ['d1b', 'VD D.1b'],
        ['res', 'cộng hưởng'],
        ['notch', 'chắn tần (○ trên jω)']
      ], 'd1a', k => applyP(k));
      const segVec = ui.seg([['1', 'vectơ ON'], ['0', 'vectơ OFF']], '1', k => { vecOn = k === '1'; ui.update(); });
      const sK = ui.slider('K', .2, 4, .1, S.K, 1, v => { S.K = v; ui.update(); });
      const sW = ui.slider('ω₀', -5, 5, .05, om0, 2, v => { om0 = v; ui.update(); });

      function applyP(k) {
        if (!PRE[k]) return;
        S = PRE[k]();
        segPre.set(k); sK.set(S.K);
        ui.update();
      }

      const list = (r, cc) => [...r.map(e => [e.x, 0]), ...cc.flatMap(e => [[e.x, e.y], [e.x, -e.y]])];
      const Z = () => list(S.zr, S.zc);
      const P = () => list(S.pr, S.pc);
      const sigKey = () => `${fx(S.K, 2)}|${Z().map(z => z.map(n => n.toFixed(3))).join(';')}|${P().map(p => p.map(n => n.toFixed(3))).join(';')}`;

      const evalX = (x, y) => {
        let v = [S.K, 0];
        for (const z of Z()) v = cmul(v, [x - z[0], y - z[1]]);
        for (const p of P()) v = cdiv(v, [x - p[0], y - p[1]]);
        return v;
      };
      const mag = (x, y) => {
        let m = S.K;
        for (const z of Z()) m *= Math.hypot(x - z[0], y - z[1]);
        for (const p of P()) m /= Math.max(1e-5, Math.hypot(x - p[0], y - p[1]));
        return m;
      };
      const phDeg = om => carg(evalX(0, om)) * 180 / Math.PI;

      pH.draw = (c, w, h, p) => {
        const v = mkView(w, h, -4, 2, -4.5, 4.5, { l: 6, r: 6, t: 6, b: 6 });
        drawHeat(c, v, mag, sigKey());
        const zs = Z(), ps = P();
        const items = [
          ...zs.map(z => ({ t: 'z', x: z[0], y: z[1], col: '#fff' })),
          ...ps.map(q => ({ t: 'p', x: q[0], y: q[1], col: '#fff' }))
        ];
        splane(c, v, {
          items,
          extra: (cc, vv) => {
            if (!vecOn) return;
            const tx = vv.X(0), ty = vv.Y(om0);
            zs.forEach(z => arrowSeg(cc, vv.X(z[0]), vv.Y(z[1]), tx, ty, COL.c1, 1.5));
            ps.forEach(q => arrowSeg(cc, vv.X(q[0]), vv.Y(q[1]), tx, ty, COL.c4, 1.5, [4, 3]));
          }
        });
        mark(c, 'd', v.X(0), v.Y(om0), COL.c2);
        p.addHandle(c, v.X(0), v.Y(om0), (_, py) => { om0 = clamp(v.iy(py), -4.5, 4.5); sW.set(om0); }, 10, COL.c2);
        const hnd = (e, real) => p.addHandle(c, v.X(e.x), v.Y(real ? 0 : e.y), (px, py) => {
          e.x = clamp(v.ix(px), -3.85, 1.85);
          if (!real) e.y = clamp(v.iy(py), .2, 4.2);
        }, 11, '#fff');
        S.zr.forEach(e => hnd(e, 1)); S.zc.forEach(e => hnd(e, 0));
        S.pr.forEach(e => hnd(e, 1)); S.pc.forEach(e => hnd(e, 0));
      };

      p3.onBg = (dx, dy) => { az += dx * .01; elAng = clamp(elAng - dy * .006, .15, 1.45); };
      p3.draw = (c, w, h) => {
        const items = [...Z().map(z => ({ t: 'z', x: z[0], y: z[1] })), ...P().map(z => ({ t: 'p', x: z[0], y: z[1] }))];
        surface3D(c, w, h, mag, az, elAng, items, om0);
      };

      pF.draw = (c, w, h, p) => {
        let mx = 0;
        for (let i = 0; i <= 240; i++) {
          const m = mag(0, -6 + 12 * i / 240);
          if (m < 25) mx = Math.max(mx, m);
        }
        const ym = clamp(mx * 1.15, .6, 10), h1 = Math.round(h * .56);
        sub(c, 0, h1, hh => {
          const v = mkView(w, hh, -6, 6, 0, ym, { b: 5 });
          axes(c, v, { noXL: 1 });
          curve(c, v, om => mag(0, om), -6, 6, COL.main, 2.2, 480);
          const m0 = mag(0, om0);
          c.save(); clipTo(c, v); c.strokeStyle = COL.c2; c.globalAlpha = .5; c.setLineDash([3, 3]);
          c.beginPath(); c.moveTo(v.X(om0), v.P.t); c.lineTo(v.X(om0), v.P.t + v.ih); c.stroke(); c.restore();
          mark(c, 'd', v.X(om0), clamp(v.Y(m0), v.P.t, v.P.t + v.ih), COL.c2);
          txt(c, '|X(jω)|', v.P.l + 4, v.P.t + 8, COL.main, 'left', 'middle', FONT_SM);
          p.addHandle(c, v.X(om0), clamp(v.Y(m0), v.P.t + 4, v.P.t + v.ih - 4), px => { om0 = clamp(v.ix(px), -5, 5); sW.set(om0); }, 9, COL.c2);
        });
        sub(c, h1, h - h1, hh => {
          const v = mkView(w, hh, -6, 6, -180, 180, { t: 4 });
          axes(c, v, { xl: 'ω', yn: 2, yfmt: y => y + '°' });
          curve(c, v, phDeg, -6, 6, COL.c1, 2, 480, { jump: 170 });
          mark(c, 'd', v.X(om0), v.Y(phDeg(om0)), COL.c2);
          txt(c, '∠X', v.P.l + 4, v.P.t + 8, COL.c1, 'left', 'middle', FONT_SM);
        });
      };

      ui.update = () => {
        const m0 = mag(0, om0), p0 = phDeg(om0);
        pH.tags([[`${P().length} cực · ${Z().length} không`, 'inf']]);
        pF.tags([[`|X(j${fx(om0, 1)})| = ${m0 > 99 ? '∞' : fx(m0, 2)}`, 'ok'], [`∠ = ${fx(p0, 0)}°`, 'inf']]);
        ui.refresh();
      };

      ui.anim = dt => {
        om0 += dir * dt * 1.4;
        if (om0 > 4.5) { om0 = 4.5; dir = -1; }
        if (om0 < -4.5) { om0 = -4.5; dir = 1; }
        sW.set(om0);
        ui.update();
      };

      ui.applyPreset = applyP;
      if (preset) applyP(preset);
    }
  });

  /* ---------------------------------------------------------------------
     4 · Đa vùng ROC → x(t), Nhân quả & Ổn định (Phần E, FIG L.3, VD 4–5, I.3)
     --------------------------------------------------------------------- */
  L11.push({
    key: 'mroc',
    name: 'Đa ROC',
    tip: 'Phần E, H.4, I.3 · Nhấp trực tiếp vào từng dải ROC trên mặt phẳng s',
    autoPlay: false,
    build(ui, preset) {
      let p1 = -1, p2 = -2, z = 1, hasZ = true, finiteMode = false, roc = 'R';
      const pS = ui.panel('mặt phẳng <i>s</i> — nhấp vào dải để chọn ROC', 'a');
      const pX = ui.panel('tín hiệu <i>x</i>(<i>t</i>) <span style="color:var(--sub)">(nét đứt: nhánh từng cực)</span>', 'b');
      const pF = ui.panel('phổ Fourier |<i>X</i>(<i>jω</i>)|', 'c');
      ui.layout(['a b', 'a c'], '1.05fr 1.2fr', '1.18fr 1fr');

      const segPre = ui.seg([
        ['l3', 'FIG L.3'],
        ['vd4', 'VD 4'],
        ['vd5', 'VD 5 (3 ROC)'],
        ['i3', 'I.3 (cực −1, +2)'],
        ['fin', 'xung hữu hạn']
      ], 'l3', k => applyP(k));
      const segRoc = ui.seg([['L', '◀ trái'], ['M', 'giữa'], ['R', 'phải ▶']], roc, k => { roc = k; ui.update(); });
      const segZ = ui.seg([['1', 'có ○'], ['0', 'không ○']], '1', k => { hasZ = k === '1'; vis(); ui.update(); });
      const s1 = ui.slider('p₁', -4, 3, .1, p1, 1, v => { p1 = v; ui.update(); });
      const s2 = ui.slider('p₂', -4, 3, .1, p2, 1, v => { p2 = v; ui.update(); });
      const sz = ui.slider('z', -4, 4, .1, z, 1, v => { z = v; ui.update(); });
      const vis = () => {
        show(segRoc, !finiteMode); show(segZ, !finiteMode);
        show(s1, !finiteMode); show(s2, !finiteMode); show(sz, !finiteMode && hasZ);
      };

      function applyP(k) {
        finiteMode = k === 'fin';
        if (k === 'l3') { p1 = -1; p2 = -2; z = 1; hasZ = true; roc = 'R'; }
        else if (k === 'vd4') { p1 = -1; p2 = -2; hasZ = false; roc = 'R'; }
        else if (k === 'vd5') { p1 = -1; p2 = -2; hasZ = false; roc = 'M'; }
        else if (k === 'i3') { p1 = 2; p2 = -1; z = 1; hasZ = true; roc = 'M'; }
        segPre.set(k); segRoc.set(roc); segZ.set(hasZ ? '1' : '0');
        s1.set(p1); s2.set(p2); sz.set(z);
        vis(); ui.update();
      }

      const poles = () => {
        let a = p1, b = p2;
        if (Math.abs(a - b) < .15) b = a - .15;
        return a < b ? [a, b] : [b, a];
      };
      const resid = () => {
        const [pa, pb] = poles();
        if (!hasZ) return [[pa, 1 / (pa - pb)], [pb, 1 / (pb - pa)]];
        return [[pa, (pa - z) / (pa - pb)], [pb, (pb - z) / (pb - pa)]];
      };
      const isRight = p => roc === 'R' || (roc === 'M' && p === poles()[0]);
      const comp = (p, A, t) => isRight(p) ? (t >= 0 ? A * Math.exp(p * t) : 0) : (t < 0 ? -A * Math.exp(p * t) : 0);
      const xt = t => finiteMode ? (Math.abs(t) <= 1 ? 1 : 0) : resid().reduce((s, [p, A]) => s + comp(p, A, t), 0);
      const rocIv = () => {
        if (finiteMode) return { a: -Infinity, b: Infinity };
        const [pa, pb] = poles();
        return roc === 'R' ? { a: pb, b: Infinity } : roc === 'M' ? { a: pa, b: pb } : { a: -Infinity, b: pa };
      };
      const stable = () => { const r = rocIv(); return r.a < -1e-6 && r.b > 1e-6; };
      const Xjw = om => {
        if (finiteMode) return [Math.abs(om) < 1e-6 ? 2 : 2 * Math.sin(om) / om, 0];
        const [pa, pb] = poles(), s = [0, om];
        const num = hasZ ? csub(s, [z, 0]) : [1, 0];
        return cdiv(num, cmul(csub(s, [pa, 0]), csub(s, [pb, 0])));
      };

      pS.draw = (c, w, h, p) => {
        const v = mkView(w, h, -4.5, 3.8, -7, 7, { l: 6, r: 6, t: 6, b: 6 });
        if (finiteMode) {
          const zs = [-2, -1, 1, 2].map(k => ({ t: 'z', x: 0, y: k * Math.PI, col: COL.c1 }));
          splane(c, v, { roc: [{ a: -Infinity, b: Infinity, col: COL.c2, alpha: .15 }], items: zs });
          txt(c, 'cực s=0 bị triệt tiêu ⇒ ROC = toàn mặt phẳng s', w / 2, h - 12, COL.c2, 'center', 'middle', FONT_SM);
          return;
        }
        const [pa, pb] = poles();
        const items = [{ t: 'p', x: pa, y: 0, col: COL.text }, { t: 'p', x: pb, y: 0, col: COL.text }];
        if (hasZ) items.unshift({ t: 'z', x: z, y: 0, col: COL.c1 });
        splane(c, v, { roc: [Object.assign({ col: stable() ? COL.c2 : COL.c3, alpha: .18 }, rocIv())], items });

        /* vùng nhấp trực tiếp trên mặt phẳng s để đổi ROC */
        const xa = clamp(v.X(pa), v.P.l, v.P.l + v.iw), xb = clamp(v.X(pb), v.P.l, v.P.l + v.iw);
        p.addZone(v.P.l, v.P.t, xa - 8, v.P.t + v.ih, () => { roc = 'L'; segRoc.set('L'); });
        p.addZone(xa + 8, v.P.t, xb - 8, v.P.t + v.ih, () => { roc = 'M'; segRoc.set('M'); });
        p.addZone(xb + 8, v.P.t, v.P.l + v.iw, v.P.t + v.ih, () => { roc = 'R'; segRoc.set('R'); });

        p.addHandle(c, v.X(p1), v.Y(0), px => { p1 = clamp(v.ix(px), -4, 3); s1.set(p1); });
        p.addHandle(c, v.X(p2), v.Y(0), px => { p2 = clamp(v.ix(px), -4, 3); s2.set(p2); });
        if (hasZ) p.addHandle(c, v.X(z), v.Y(0), px => { z = clamp(v.ix(px), -4, 4); sz.set(z); }, 10, COL.c1);
      };

      pX.draw = (c, w, h, p) => {
        const ym = amp([xt], -4, 4, 320, 8, 1.2);
        const v = mkView(w, h, -4, 4, -ym, ym);
        axes(c, v, { xl: 't' });
        if (!finiteMode) {
          resid().forEach(([pl, A], i) => curve(c, v, t => comp(pl, A, t), -4, 4, i ? COL.c1 : COL.c2, 1.35, 400, { dash: [4, 3], jump: 2.5 * ym }));
        } else {
          area(c, v, xt, -4, 4, COL.c2, .18, 300);
        }
        curve(c, v, xt, -4, 4, COL.main, 2.5, 500, { jump: 2.5 * ym });
        p.hoverReadout(c, v, xt, 't', 'x(t)', COL.main);
      };

      pF.draw = (c, w, h, p) => {
        if (!stable()) {
          const v = mkView(w, h, -8, 8, 0, 1); axes(c, v, { xl: 'ω', noYL: 1 });
          txt(c, 'jω ∉ ROC — không tồn tại biến đổi Fourier', w / 2, h / 2, COL.err, 'center');
          return;
        }
        const fn = om => cabs(Xjw(om));
        const ym = amp([fn], -8, 8, 240, 8, .5);
        const v = mkView(w, h, -8, 8, 0, ym);
        axes(c, v, { xl: 'ω' });
        curve(c, v, fn, -8, 8, COL.c2, 2.3, 420);
        p.hoverReadout(c, v, fn, 'ω', '|X|', COL.c2);
      };

      let cyc = 0;
      ui.anim = dt => {
        if (finiteMode) return;
        cyc += dt;
        if (cyc > 1.35) {
          cyc = 0;
          const seq = ['L', 'M', 'R'];
          roc = seq[(seq.indexOf(roc) + 1) % 3];
          segRoc.set(roc);
          ui.update();
        }
      };

      ui.update = () => {
        const st = stable();
        const causalLbl = finiteMode ? ['hữu hạn (phi nhân quả)', 'inf'] : roc === 'R' ? ['nhân quả', 'ok'] : roc === 'L' ? ['phản nhân quả', 'neu'] : ['hai phía', 'inf'];
        pS.tags([causalLbl, pill(st ? 'ổn định' : 'bất ổn định', st)]);
        pF.tags([pill(st ? 'jω ∈ ROC' : 'jω ∉ ROC', st)]);
        ui.refresh();
      };

      vis();
      ui.applyPreset = applyP;
      if (preset) applyP(preset);
    }
  });

  /* ---------------------------------------------------------------------
     5 · Biến đổi Laplace ngược ℒ⁻¹ (Phần H, Ví dụ 5, 6, 7, H.3)
     --------------------------------------------------------------------- */
  L11.push({
    key: 'inv',
    name: 'ℒ⁻¹ ngược',
    tip: 'Phần H · Phân thức tối giản: cực đơn, cực kép ×², chia đa thức (δ, δ′) & cực phức',
    autoPlay: true,
    build(ui, preset) {
      let mode = 'vd6', tc = 0;
      // VD6 params: (b1*s + b0) / ((s - p1)*(s - p2)^2)
      let p1 = -1, p2 = -2, b1 = 3, b0 = 4;
      // VD7 params: (q1*s + q0) + A/(s - r1) + B/(s - r2)
      let q1 = 2, q0 = -3, r1 = 1.2, r2 = -1, A7 = 2, B7 = 1;
      // H3 params: (B1*s + B2) / ((s - al)^2 + w0^2)
      let al = -.6, w0 = 3.2, B1 = 1.5, B2 = 3;

      const pS = ui.panel('cực / không & bội số trên mặt phẳng <i>s</i>', 'a');
      const pC = ui.panel('tách từng hạng tử phân thức <i>x<sub>k</sub></i>(<i>t</i>)', 'b');
      const pX = ui.panel('tổng hợp <i>x</i>(<i>t</i>) = Σ <i>x<sub>k</sub></i>(<i>t</i>) (nhân quả)', 'c');
      ui.layout(['a b', 'c c'], '1fr 1.35fr', '1.05fr 1fr');

      const segM = ui.seg([
        ['vd5', 'VD5 · cực đơn'],
        ['vd6', 'VD6 · cực kép ×²'],
        ['vd7', 'VD7 · tử ≥ mẫu (δ, δ′)'],
        ['h3', 'H.3 · cực phức']
      ], mode, k => applyP(k));

      const sp1 = ui.slider('p₁', -4, -.3, .1, p1, 1, v => { p1 = v; ui.update(); });
      const sp2 = ui.slider('p₂', -4, -.3, .1, p2, 1, v => { p2 = v; ui.update(); });
      const sb1 = ui.slider('b₁', -4, 5, .5, b1, 1, v => { b1 = v; ui.update(); });
      const sb0 = ui.slider('b₀', -4, 6, .5, b0, 1, v => { b0 = v; ui.update(); });

      const sq1 = ui.slider('q₁(δ′)', -3, 3, .5, q1, 1, v => { q1 = v; ui.update(); });
      const sq0 = ui.slider('q₀(δ)', -4, 4, .5, q0, 1, v => { q0 = v; ui.update(); });
      const sr1 = ui.slider('p₁', -2, 4, .2, r1, 1, v => { r1 = v; ui.update(); });

      const sal = ui.slider('α', -2.5, .5, .1, al, 1, v => { al = v; ui.update(); });
      const sw0 = ui.slider('ω₀', .8, 6, .2, w0, 1, v => { w0 = v; ui.update(); });
      const sB1 = ui.slider('B₁', -3, 3, .2, B1, 1, v => { B1 = v; ui.update(); });
      const sB2 = ui.slider('B₂', -5, 5, .5, B2, 1, v => { B2 = v; ui.update(); });

      function vis() {
        const is56 = mode === 'vd5' || mode === 'vd6';
        show(sp1, is56); show(sp2, is56);
        show(sb1, mode === 'vd6'); show(sb0, mode === 'vd6');
        show(sq1, mode === 'vd7'); show(sq0, mode === 'vd7'); show(sr1, mode === 'vd7');
        show(sal, mode === 'h3'); show(sw0, mode === 'h3'); show(sB1, mode === 'h3'); show(sB2, mode === 'h3');
      }

      function applyP(k) {
        if (['vd5', 'vd6', 'vd7', 'h3'].includes(k)) mode = k;
        if (k === 'vd5') { p1 = -1; p2 = -2; }
        else if (k === 'vd6') { p1 = -1; p2 = -2; b1 = 3; b0 = 4; }
        else if (k === 'vd7') { q1 = 2; q0 = -3; r1 = 4; r2 = -1; A7 = 2; B7 = 1; }
        else if (k === 'h3') { al = -.6; w0 = 3.2; B1 = 1.5; B2 = 3; }
        segM.set(mode);
        sp1.set(p1); sp2.set(p2); sb1.set(b1); sb0.set(b0);
        sq1.set(q1); sq0.set(q0); sr1.set(r1);
        sal.set(al); sw0.set(w0); sB1.set(B1); sB2.set(B2);
        tc = 0;
        vis(); ui.update();
      }

      function terms() {
        if (mode === 'vd5') {
          let a = p1, b = p2; if (Math.abs(a - b) < .2) b = a - .25;
          const A = 1 / (a - b), B = -A;
          return {
            Tmax: 5,
            list: [
              { col: COL.c1, lbl: `${fx(A, 2)}e^{${fx(a, 1)}t}`, f: t => t < 0 ? 0 : A * Math.exp(a * t) },
              { col: COL.c2, lbl: `${fx(B, 2)}e^{${fx(b, 1)}t}`, f: t => t < 0 ? 0 : B * Math.exp(b * t) }
            ],
            imps: [],
            pz: { rocA: Math.max(a, b), items: [{ t: 'p', x: a, y: 0, col: COL.c1 }, { t: 'p', x: b, y: 0, col: COL.c2 }] }
          };
        }
        if (mode === 'vd6') {
          let a = p1, b = p2; if (Math.abs(a - b) < .25) b = a - .3;
          const c1 = (b1 * a + b0) / ((a - b) * (a - b));
          const l2 = (b1 * b + b0) / (b - a);
          const l1 = -c1;
          const zItems = Math.abs(b1) > .05 ? [{ t: 'z', x: -b0 / b1, y: 0, col: COL.main }] : [];
          return {
            Tmax: 5,
            list: [
              { col: COL.c1, lbl: `${fx(c1, 2)}e^{${fx(a, 1)}t}`, f: t => t < 0 ? 0 : c1 * Math.exp(a * t) },
              { col: COL.vio, lbl: `${fx(l1, 2)}e^{${fx(b, 1)}t}`, f: t => t < 0 ? 0 : l1 * Math.exp(b * t) },
              { col: COL.c2, lbl: `${fx(l2, 2)}·t·e^{${fx(b, 1)}t}`, f: t => t < 0 ? 0 : l2 * t * Math.exp(b * t) }
            ],
            imps: [],
            pz: { rocA: Math.max(a, b), items: [...zItems, { t: 'p', x: a, y: 0, col: COL.c1 }, { t: 'p', x: b, y: 0, col: COL.c2, mult: 2 }] }
          };
        }
        if (mode === 'vd7') {
          const Tmax = r1 > 1.8 ? 1.1 : 4;
          const imps = [];
          if (Math.abs(q0) > .05) imps.push({ w: q0, col: COL.c4, lbl: `${fx(q0, 1)}δ(t)`, dbl: false });
          if (Math.abs(q1) > .05) imps.push({ w: q1, col: COL.c3, lbl: `${fx(q1, 1)}δ′(t)`, dbl: true });
          return {
            Tmax,
            list: [
              { col: COL.c1, lbl: `${fx(A7, 1)}e^{${fx(r1, 1)}t}`, f: t => t < 0 ? 0 : A7 * Math.exp(r1 * t) },
              { col: COL.c2, lbl: `${fx(B7, 1)}e^{${fx(r2, 1)}t}`, f: t => t < 0 ? 0 : B7 * Math.exp(r2 * t) }
            ],
            imps,
            pz: { rocA: Math.max(r1, r2), items: [{ t: 'p', x: r1, y: 0, col: COL.c1 }, { t: 'p', x: r2, y: 0, col: COL.c2 }] }
          };
        }
        const C1 = B1, C2 = (B1 * al + B2) / w0;
        const zItems = Math.abs(B1) > .05 ? [{ t: 'z', x: -B2 / B1, y: 0, col: COL.main }] : [];
        return {
          Tmax: 6,
          list: [
            { col: COL.c1, lbl: `${fx(C1, 2)}e^{αt}cos`, f: t => t < 0 ? 0 : C1 * Math.exp(al * t) * Math.cos(w0 * t) },
            { col: COL.c2, lbl: `${fx(C2, 2)}e^{αt}sin`, f: t => t < 0 ? 0 : C2 * Math.exp(al * t) * Math.sin(w0 * t) }
          ],
          imps: [],
          pz: { rocA: al, items: [...zItems, { t: 'p', x: al, y: w0, col: COL.c1 }, { t: 'p', x: al, y: -w0, col: COL.c1 }] }
        };
      }

      pS.draw = (c, w, h) => {
        const D = terms(), v = mkView(w, h, -4.5, 4.5, -5, 5, { l: 6, r: 6, t: 6, b: 6 });
        splane(c, v, { roc: [{ a: D.pz.rocA, b: Infinity, col: COL.c2 }], items: D.pz.items });
        if (D.imps.length) txt(c, 'Q(s) ≠ 0 ⇒ cực tại ∞ (xung tại t=0)', w / 2, h - 11, COL.c3, 'center', 'middle', FONT_SM);
      };

      pC.draw = (c, w, h) => {
        const D = terms(), t0 = -.15 * D.Tmax, t1 = D.Tmax;
        const ym = amp(D.list.map(it => it.f), t0, t1, 240, 25, 1.2);
        const v = mkView(w, h, t0, t1, -ym, ym);
        axes(c, v, { xl: 't' });
        D.list.forEach((it, idx) => {
          curve(c, v, it.f, t0, t1, it.col, 2, 380, { jump: 2 * ym });
          txt(c, it.lbl, v.P.l + 8 + idx * 112, v.P.t + 9, it.col, 'left', 'middle', FONT_SM);
        });
        D.imps.forEach((im, idx) => {
          const yTip = clamp(v.Y(Math.sign(im.w) * ym * (.78 - idx * .18)), v.P.t + 8, v.P.t + v.ih - 8);
          impulseArrow(c, v.X(0) + idx * 14, v.Y(0), yTip, im.col, im.lbl, im.dbl);
        });
      };

      pX.draw = (c, w, h, p) => {
        const D = terms(), t0 = -.15 * D.Tmax, t1 = D.Tmax;
        const sumF = t => D.list.reduce((s, it) => s + it.f(t), 0);
        const ym = amp([sumF], t0, t1, 280, 30, 1.2);
        const v = mkView(w, h, t0, t1, -ym, ym);
        axes(c, v, { xl: 't' });
        D.list.forEach(it => curve(c, v, it.f, t0, t1, it.col, 1.2, 300, { dash: [4, 4], alpha: .6, jump: 2 * ym }));
        curve(c, v, sumF, t0, t1, COL.main, 2.5, 480, { jump: 2 * ym });
        D.imps.forEach((im, idx) => {
          const yTip = clamp(v.Y(Math.sign(im.w) * ym * (.82 - idx * .18)), v.P.t + 8, v.P.t + v.ih - 8);
          impulseArrow(c, v.X(0) + idx * 14, v.Y(0), yTip, im.col, im.lbl, im.dbl);
        });
        const tCur = clamp(tc, 0, t1);
        c.save(); clipTo(c, v); c.strokeStyle = COL.main; c.globalAlpha = .45;
        c.beginPath(); c.moveTo(v.X(tCur), v.P.t); c.lineTo(v.X(tCur), v.P.t + v.ih); c.stroke(); c.restore();
        mark(c, 'd', v.X(tCur), clamp(v.Y(sumF(tCur)), v.P.t, v.P.t + v.ih), COL.main);
        p.hoverReadout(c, v, sumF, 't', 'x(t)', COL.main);
      };

      ui.anim = dt => {
        const Tmax = terms().Tmax;
        tc += dt * (Tmax * .24);
        if (tc > Tmax) tc = 0;
        pX.render();
      };

      ui.update = () => {
        const D = terms();
        pS.tags([[`ROC: Re(s) > ${fx(D.pz.rocA, 1)}`, D.pz.rocA < 0 ? 'ok' : 'neu']]);
        pC.tags([[`${D.list.length + D.imps.length} hạng tử`, 'inf']]);
        ui.refresh();
      };

      vis();
      ui.applyPreset = applyP;
      if (preset) applyP(preset);
    }
  });

  /* ---------------------------------------------------------------------
     6 · Tính chất của Biến đổi Laplace (Phần F, G — 7 phép toán + Triệt tiêu)
     --------------------------------------------------------------------- */
  L11.push({
    key: 'prop',
    name: 'Tính chất',
    tip: 'Phần F, G · 7 phép toán làm di chuyển cực/không, ROC và triệt tiêu ×/○',
    autoPlay: false,
    build(ui, preset) {
      const A = .5, W = 4;
      let op = 'shift', t0 = 1.5, s0 = .8, cc = 1.5, zc = -1.2, dir = 1;
      const pT = ui.panel('<span style="color:var(--sub)"><i>x</i>(<i>t</i>) gốc</span> &nbsp;→&nbsp; <span style="color:var(--main)"><i>y</i>(<i>t</i>) biến đổi</span>', 'a');
      const pS = ui.panel('mặt phẳng <i>s</i>: <span style="color:var(--sub)">X</span> → <span style="color:var(--main)">Y</span> &amp; dải ROC', 'b');
      const pB = ui.panel('phổ <i>Y</i>(<i>jω</i>): biên độ &amp; pha', 'c');
      ui.layout(['a a', 'b c'], '1fr 1.25fr', '1fr 1.08fr');

      const segOp = ui.seg([
        ['shift', 'x(t−t₀)'],
        ['ss', 'e<sup>σ₀t</sup>x'],
        ['sc', 'x(ct)'],
        ['d', 'dx/dt'],
        ['ts', '−t·x ↔ dX/ds'],
        ['i', '∫x'],
        ['cancel', 'triệt tiêu ×/○']
      ], op, k => applyP(k));

      const st = ui.slider('t₀', -2, 3, .1, t0, 1, v => { t0 = v; ui.update(); });
      const ss = ui.slider('σ₀', -1.5, 1.5, .1, s0, 1, v => { s0 = v; ui.update(); });
      const sc = ui.slider('c', -2, 2, .1, cc, 1, v => { cc = Math.abs(v) < .2 ? (v < 0 ? -.2 : .2) : v; ui.update(); });
      const sz = ui.slider('z', -2.8, 1, .05, zc, 2, v => {
        if (Math.abs(v + .5) < .06) v = -.5;
        else if (Math.abs(v + 2) < .06) v = -2;
        zc = v; sz.set(v); ui.update();
      });

      const vis = () => {
        show(st, op === 'shift'); show(ss, op === 'ss');
        show(sc, op === 'sc'); show(sz, op === 'cancel');
      };

      function applyP(k) {
        if (['shift', 'ss', 'sc', 'd', 'ts', 'i', 'cancel'].includes(k)) op = k;
        segOp.set(op); vis(); ui.update();
      }

      const xb = t => op === 'cancel'
        ? (t < 0 ? 0 : Math.exp(-.5 * t) + Math.exp(-2 * t))
        : (t < 0 ? 0 : Math.exp(-A * t) * Math.cos(W * t));

      const yf = t => {
        if (op === 'cancel') {
          if (t < 0) return 0;
          if (Math.abs(zc + .5) < .04) return Math.exp(-2 * t);
          if (Math.abs(zc + 2) < .04) return Math.exp(-.5 * t);
          const A1 = (-.5 - zc) / 1.5, A2 = (2 + zc) / 1.5;
          return A1 * Math.exp(-.5 * t) + A2 * Math.exp(-2 * t);
        }
        switch (op) {
          case 'shift': return xb(t - t0);
          case 'ss': return Math.exp(s0 * t) * xb(t);
          case 'sc': return xb(cc * t);
          case 'd': return t < 0 ? 0 : Math.exp(-A * t) * (-A * Math.cos(W * t) - W * Math.sin(W * t));
          case 'ts': return -t * xb(t);
          case 'i': {
            if (t < 0) return 0;
            const e = cexp([-A * t, W * t]);
            return cdiv([1 - e[0], -e[1]], [A, -W])[0];
          }
          default: return xb(t);
        }
      };

      const Xf = s => {
        if (op === 'cancel') return cadd(cdiv([1, 0], cadd(s, [.5, 0])), cdiv([1, 0], cadd(s, [2, 0])));
        const q = cadd(s, [A, 0]);
        return cdiv(q, cadd(cmul(q, q), [W * W, 0]));
      };

      const Yjw = w => {
        const j = [0, w];
        if (op === 'cancel') {
          if (Math.abs(zc + .5) < .04) return cdiv([1, 0], [2, w]);
          if (Math.abs(zc + 2) < .04) return cdiv([1, 0], [.5, w]);
          return cdiv([-zc, w], cmul([.5, w], [2, w]));
        }
        switch (op) {
          case 'shift': return cmul(cexp([0, -w * t0]), Xf(j));
          case 'ss': return Xf([-s0, w]);
          case 'sc': { const r = Xf([0, w / cc]); return [r[0] / Math.abs(cc), r[1] / Math.abs(cc)]; }
          case 'd': return cmul(j, Xf(j));
          case 'ts': {
            const q = [A, w], den = cadd(cmul(q, q), [W * W, 0]);
            return cdiv(csub([W * W, 0], cmul(q, q)), cmul(den, den));
          }
          default: return Math.abs(w) < .03 ? [NaN, NaN] : cdiv(Xf(j), j);
        }
      };

      const pz = () => {
        if (op === 'cancel') {
          const hit1 = Math.abs(zc + .5) < .04, hit2 = Math.abs(zc + 2) < .04;
          const Zs = (hit1 || hit2) ? [] : [[zc, 0]];
          const Ps = [];
          if (!hit1) Ps.push([-.5, 0, 1]);
          if (!hit2) Ps.push([-2, 0, 1]);
          const edge = hit1 ? -2 : -.5;
          return { Zs, Ps, edge, type: 'R', canceled: hit1 || hit2 };
        }
        let Zs = [[-A, 0]], Ps = [[-A, W, 1], [-A, -W, 1]], edge = -A, type = 'R';
        if (op === 'ss') { Zs = Zs.map(q => [q[0] + s0, q[1]]); Ps = Ps.map(q => [q[0] + s0, q[1], 1]); edge += s0; }
        if (op === 'sc') { Zs = Zs.map(q => [q[0] * cc, q[1] * cc]); Ps = Ps.map(q => [q[0] * cc, q[1] * cc, 1]); edge = cc * -A; type = cc > 0 ? 'R' : 'L'; }
        if (op === 'd') Zs.push([0, 0]);
        if (op === 'ts') { Zs = [[-A - W, 0], [-A + W, 0]]; Ps = [[-A, W, 2], [-A, -W, 2]]; }
        if (op === 'i') { Ps.push([0, 0, 1]); edge = Math.max(-A, 0); }
        return { Zs, Ps, edge, type, canceled: false };
      };

      const valid = () => {
        const q = pz();
        return q.type === 'R' ? q.edge < -1e-6 : q.edge > 1e-6;
      };

      pT.draw = (c, w, h, p) => {
        const ym = amp([xb, yf], -3, 7, 500, 5, 1.2), v = mkView(w, h, -3, 7, -ym, ym);
        axes(c, v, { xl: 't' });
        curve(c, v, xb, -3, 7, COL.sub, 1.5, 700, { dash: [4, 3], jump: 1.4 * ym });
        curve(c, v, yf, -3, 7, COL.main, 2.4, 800, { jump: 1.4 * ym });
        if (op === 'd') impulseArrow(c, v.X(0), v.Y(0), v.Y(ym * .88), COL.main, 'δ(t)', false);
        p.hoverReadout(c, v, yf, 't', 'y(t)', COL.main);
      };

      pS.draw = (c, w, h, p) => {
        const q = pz(), v = mkView(w, h, -5, 3.5, -8.5, 8.5, { l: 6, r: 6, t: 6, b: 6 });
        const ghosts = op === 'cancel'
          ? [{ t: 'p', x: -.5, y: 0, col: COL.sub, ghost: 1 }, { t: 'p', x: -2, y: 0, col: COL.sub, ghost: 1 }]
          : [{ t: 'z', x: -A, y: 0, col: COL.sub, ghost: 1 }, { t: 'p', x: -A, y: W, col: COL.sub, ghost: 1 }, { t: 'p', x: -A, y: -W, col: COL.sub, ghost: 1 }];
        const items = [...ghosts];
        q.Zs.forEach(z => items.push({ t: 'z', x: z[0], y: z[1], col: COL.c1 }));
        q.Ps.forEach(pl => items.push({ t: 'p', x: pl[0], y: pl[1], col: COL.main, mult: pl[2] }));
        splane(c, v, {
          roc: [q.type === 'R' ? { a: q.edge, b: Infinity, col: q.canceled ? COL.c2 : COL.main } : { a: -Infinity, b: q.edge, col: COL.main }],
          items
        });
        if (op === 'cancel') {
          p.addHandle(c, v.X(zc), v.Y(0), px => {
            let nv = clamp(v.ix(px), -2.8, 1);
            if (Math.abs(nv + .5) < .07) nv = -.5;
            else if (Math.abs(nv + 2) < .07) nv = -2;
            zc = nv; sz.set(zc);
          }, 11, COL.c1);
        }
      };

      pB.draw = (c, w, h) => {
        const ok = valid(), N = 340, w1 = 10, ma = [], pa = [];
        for (let i = 0; i <= N; i++) {
          const om = w1 * i / N, y = Yjw(om), x = Xf([0, om]);
          ma.push([cabs(x), cabs(y)]);
          pa.push([carg(x) * 180 / Math.PI, carg(y) * 180 / Math.PI]);
        }
        const ym = clamp(Math.max(...ma.flat().filter(v => isFinite(v) && v < 15)) * 1.12, .6, 5);
        const h1 = Math.round(h * .56), col = ok ? COL.main : COL.err, dash = ok ? null : [5, 4];
        sub(c, 0, h1, hh => {
          const v = mkView(w, hh, 0, w1, 0, ym, { b: 5 });
          axes(c, v, { noXL: 1 });
          curve(c, v, om => ma[Math.round(om / w1 * N)][0], 0, w1, COL.sub, 1.4, N, { dash: [3, 3] });
          curve(c, v, om => ma[Math.round(om / w1 * N)][1], 0, w1, col, 2.2, N, { dash });
          txt(c, '|Y(jω)|', v.P.l + 4, v.P.t + 8, col, 'left', 'middle', FONT_SM);
        });
        sub(c, h1, h - h1, hh => {
          const v = mkView(w, hh, 0, w1, -180, 180, { t: 4 });
          axes(c, v, { xl: 'ω', yn: 2, yfmt: y => y + '°' });
          curve(c, v, om => pa[Math.round(om / w1 * N)][0], 0, w1, COL.sub, 1.3, N, { jump: 170, dash: [3, 3] });
          curve(c, v, om => pa[Math.round(om / w1 * N)][1], 0, w1, col, 2, N, { jump: 170, dash });
          txt(c, '∠Y', v.P.l + 4, v.P.t + 8, col, 'left', 'middle', FONT_SM);
        });
      };

      ui.anim = dt => {
        if (op === 'cancel') {
          zc += dir * dt * .85;
          if (zc > .5) { zc = .5; dir = -1; }
          if (zc < -2.5) { zc = -2.5; dir = 1; }
          sz.set(zc); ui.update();
        } else if (op === 'ss') {
          s0 += dir * dt * .7;
          if (s0 > 1.2) { s0 = 1.2; dir = -1; }
          if (s0 < -1.2) { s0 = -1.2; dir = 1; }
          ss.set(s0); ui.update();
        } else if (op === 'shift') {
          t0 += dir * dt * 1.1;
          if (t0 > 2.6) { t0 = 2.6; dir = -1; }
          if (t0 < -1.5) { t0 = -1.5; dir = 1; }
          st.set(t0); ui.update();
        }
      };

      ui.update = () => {
        const q = pz(), ok = valid();
        pS.tags([
          q.canceled ? ['triệt tiêu ×/○ → ROC mở rộng!', 'ok'] : [`ROC: σ ${q.type === 'R' ? '>' : '<'} ${fx(q.edge, 2)}`, 'inf'],
          pill(ok ? 'jω ∈ ROC' : 'jω ∉ ROC', ok)
        ]);
        ui.refresh();
      };

      vis();
      ui.applyPreset = applyP;
      if (preset) applyP(preset);
    }
  });

  /* ---------------------------------------------------------------------
     7 · Hệ LTI: Vị trí cực → h(t), u(t) & Cộng hưởng sin (Phần I.1–I.4, VD 8)
     --------------------------------------------------------------------- */
  L11.push({
    key: 'lti',
    name: 'Hệ LTI',
    tip: 'Phần I · Vị trí cực quyết định h(t), tính ổn định và đáp ứng cưỡng bức',
    autoPlay: false,
    build(ui, preset) {
      let mode = 'cx', p1 = -1, p2 = -3, pd = -1.2, al = -.45, om = 3.5, zon = false, z = -2, gain = 1;
      let inpKind = 'step', wIn = 3.5;

      const pS = ui.panel('mặt phẳng <i>s</i> — kéo cực × và không ○', 'a');
      const pH = ui.panel('đáp ứng xung <i>h</i>(<i>t</i>)', 'b');
      const pB = ui.panel('đáp ứng tần số |<i>H</i>(<i>jω</i>)|', 'c');
      const pU = ui.panel('đáp ứng đầu ra <i>y</i>(<i>t</i>)', 'd');
      ui.layout(['a b', 'c d'], '1fr 1.2fr', '1fr 1fr');

      const sm = ui.seg([
        ['real', '2 cực thực'],
        ['dbl', 'cực kép'],
        ['cx', 'cực phức'],
        ['vd8', 'VD8 · 3y″+2y′+3y']
      ], mode, k => applyP(k));

      const s1 = ui.slider('p₁', -5, 1.5, .1, p1, 1, v => { p1 = v; ui.update(); });
      const s2 = ui.slider('p₂', -5, 1.5, .1, p2, 1, v => { p2 = v; ui.update(); });
      const sd = ui.slider('p', -5, 1.5, .1, pd, 1, v => { pd = v; ui.update(); });
      const sa = ui.slider('α', -3, 1.2, .05, al, 2, v => { al = v; ui.update(); });
      const so = ui.slider('ω_d', 0, 8, .1, om, 1, v => { om = v; ui.update(); });
      const zb = ui.seg([['0', 'không ○'], ['1', 'có ○']], '0', k => { zon = k === '1'; vis(); ui.update(); });
      const sz = ui.slider('z', -4, 4, .1, z, 1, v => { z = v; ui.update(); });
      const segIn = ui.seg([['step', 'vào u(t)'], ['sin', 'vào cos(ω₀t)']], inpKind, k => { inpKind = k; vis(); ui.update(); });
      const swIn = ui.slider('ω₀', .2, 8, .1, wIn, 1, v => { wIn = v; ui.update(); });

      const vis = () => {
        const isCx = mode === 'cx' || mode === 'vd8';
        show(s1, mode === 'real'); show(s2, mode === 'real');
        show(sd, mode === 'dbl');
        show(sa, isCx); show(so, isCx);
        show(sz, zon); show(swIn, inpKind === 'sin');
      };

      function applyP(k) {
        if (k === 'vd8') {
          mode = 'vd8'; al = -1 / 3; om = Math.sqrt(8) / 3; zon = true; z = -.5; gain = 2 / 3;
          zb.set('1'); sz.set(z); sa.set(al); so.set(om);
        } else if (['real', 'dbl', 'cx'].includes(k)) {
          mode = k; gain = 1;
        }
        sm.set(mode); vis(); ui.update();
      }

      const P = () => mode === 'real' ? [[p1, 0], [p2, 0]] : mode === 'dbl' ? [[pd, 0], [pd, 0]] : [[al, om], [al, -om]];
      const den = () => polyFromRoots(P());
      const num = () => (zon ? [1, -z] : [1]).map(v => v * gain);
      const state = () => {
        const m = Math.max(...P().map(p => p[0]));
        return Math.abs(m) < 1e-4 ? ['ổn định biên', 'neu'] : m < 0 ? ['nhân quả & ổn định', 'ok'] : ['bất ổn định', 'bad'];
      };

      pS.draw = (c, w, h, p) => {
        const v = mkView(w, h, -5, 2.2, -8.5, 8.5, { l: 6, r: 6, t: 6, b: 6 });
        const pp = P(), items = pp.map(q => ({ t: 'p', x: q[0], y: q[1], col: COL.text, mult: mode === 'dbl' ? 2 : 1 }));
        if (zon) items.push({ t: 'z', x: z, y: 0, col: COL.c1 });
        splane(c, v, {
          tint: true,
          items,
          extra: (cc, vv) => {
            if ((mode === 'cx' || mode === 'vd8') && al < 0) {
              const wn = Math.hypot(al, om);
              cc.save(); cc.strokeStyle = COL.sub; cc.globalAlpha = .45; cc.setLineDash([3, 3]);
              cc.beginPath(); cc.moveTo(vv.X(0), vv.Y(0)); cc.lineTo(vv.X(al), vv.Y(om)); cc.stroke();
              cc.restore();
              txt(cc, `ωn=${fx(wn, 1)}`, vv.X(al / 2) - 4, vv.Y(om / 2) - 7, COL.sub, 'right', 'middle', FONT_SM);
            }
          }
        });
        const lim = x => clamp(v.ix(x), -5, 1.5);
        if (mode === 'real') {
          p.addHandle(c, v.X(p1), v.Y(0), x => { p1 = lim(x); s1.set(p1); });
          p.addHandle(c, v.X(p2), v.Y(0), x => { p2 = lim(x); s2.set(p2); });
        } else if (mode === 'dbl') {
          p.addHandle(c, v.X(pd), v.Y(0), x => { pd = lim(x); sd.set(pd); });
        } else {
          p.addHandle(c, v.X(al), v.Y(om), (x, y) => { al = clamp(v.ix(x), -3, 1.2); om = clamp(v.iy(y), 0, 8); sa.set(al); so.set(om); });
        }
        if (zon) p.addHandle(c, v.X(z), v.Y(0), x => { z = clamp(v.ix(x), -4, 4); sz.set(z); }, 10, COL.c1);
      };

      let hArr, yArr;
      const T = 9, N = 360;
      pH.draw = (c, w, h, p) => {
        const [lo, hi] = rngA([hArr], 14, .3), v = mkView(w, h, 0, T, lo, hi);
        axes(c, v, { xl: 't' });
        curve(c, v, arrF(hArr, 0, T / N), 0, T, COL.main, 2.4, N);
        p.hoverReadout(c, v, arrF(hArr, 0, T / N), 't', 'h(t)', COL.main);
      };

      const Hj = w => cdiv(polyEval(num(), [0, w]), polyEval(den(), [0, w]));
      pB.draw = (c, w, h, p) => {
        const mMax = Math.max(...P().map(q => q[0]));
        if (mMax > 1e-4) {
          const v = mkView(w, h, 0, 9, 0, 1); axes(c, v, { xl: 'ω', noYL: 1 });
          txt(c, 'hệ bất ổn định → H(jω) không tồn tại', w / 2, h / 2, COL.err, 'center');
          return;
        }
        const fn = om2 => cabs(Hj(om2));
        const ym = amp([fn], 0, 9, 220, 12, .3), v = mkView(w, h, 0, 9, 0, ym);
        axes(c, v, { xl: 'ω' });
        curve(c, v, fn, 0, 9, COL.c2, 2.3, 400);
        if (inpKind === 'sin') {
          const m0 = fn(wIn);
          c.save(); clipTo(c, v); c.strokeStyle = COL.c1; c.setLineDash([3, 3]);
          c.beginPath(); c.moveTo(v.X(wIn), v.P.t); c.lineTo(v.X(wIn), v.P.t + v.ih); c.stroke(); c.restore();
          mark(c, 'd', v.X(wIn), clamp(v.Y(m0), v.P.t, v.P.t + v.ih), COL.c1);
          p.addHandle(c, v.X(wIn), clamp(v.Y(m0), v.P.t + 5, v.P.t + v.ih - 5), px => { wIn = clamp(v.ix(px), .2, 8); swIn.set(wIn); }, 9, COL.c1);
        }
        p.hoverReadout(c, v, fn, 'ω', '|H|', COL.c2);
      };

      pU.draw = (c, w, h, p) => {
        const [lo, hi] = rngA([yArr], 16, .35), v = mkView(w, h, 0, T, lo, hi);
        axes(c, v, { xl: 't' });
        if (inpKind === 'sin') curve(c, v, t => Math.cos(wIn * t), 0, T, COL.sub, 1.2, 360, { dash: [3, 3] });
        curve(c, v, arrF(yArr, 0, T / N), 0, T, COL.c1, 2.3, N);
        p.hoverReadout(c, v, arrF(yArr, 0, T / N), 't', 'y(t)', COL.c1);
      };

      let sw = 1;
      ui.anim = dt => {
        if (inpKind === 'sin') {
          wIn += sw * dt * 1.3;
          if (wIn > 7.5) { wIn = 7.5; sw = -1; }
          if (wIn < .4) { wIn = .4; sw = 1; }
          swIn.set(wIn); ui.update();
        } else if (mode === 'cx' || mode === 'vd8') {
          al += sw * dt * .55;
          if (al > .5) { al = .5; sw = -1; }
          if (al < -2.2) { al = -2.2; sw = 1; }
          sa.set(al); ui.update();
        }
      };

      ui.update = () => {
        hArr = sim(num(), den(), 'imp', T, N);
        yArr = sim(num(), den(), inpKind === 'step' ? 'step' : t => Math.cos(wIn * t), T, N);
        const st = state();
        pS.tags([st]);
        pU.tags([inpKind === 'step' ? ['bậc thang u(t)', 'inf'] : [`vào cos(${fx(wIn, 1)}t)`, 'inf']]);
        ui.refresh();
      };

      vis();
      ui.applyPreset = applyP;
      if (preset) applyP(preset);
    }
  });

  /* ---------------------------------------------------------------------
     8 · Ghép nối hệ thống & Quỹ đạo nghiệm số (Phần I.5)
     --------------------------------------------------------------------- */
  L11.push({
    key: 'conn',
    name: 'Ghép nối',
    tip: 'Phần I.5 · Nối tiếp, Song song, Phản hồi âm & Quỹ đạo cực kín (Root Locus)',
    autoPlay: false,
    build(ui, preset) {
      let mode = 'fb', b = 2, g = 1.8, dir = 1;
      const pD = ui.panel('sơ đồ khối ghép nối', 'a');
      const pS = ui.panel('mặt phẳng <i>s</i>: <span style="color:var(--sub)">cực hở</span> → <span style="color:var(--main)">cực ghép</span> &amp; quỹ đạo', 'b');
      const pU = ui.panel('đáp ứng bậc thang <span style="color:var(--sub)">(nét đứt: H₁)</span>', 'c');
      const pB = ui.panel('đáp ứng tần số |<i>H</i>(<i>jω</i>)|', 'd');
      ui.layout(['a b', 'c d'], '1fr 1.08fr', '1fr 1fr');

      const segM = ui.seg([['ser', 'nối tiếp'], ['par', 'song song'], ['fb', 'phản hồi âm']], mode, k => applyP(k));
      const sb = ui.slider('b (cực −b)', -2, 4, .1, b, 1, v => { b = v; ui.update(); });
      const sg = ui.slider('g (hệ số)', -2, 8, .1, g, 1, v => { g = v; ui.update(); });

      function applyP(k) {
        if (['ser', 'par', 'fb'].includes(k)) mode = k;
        segM.set(mode); ui.update();
      }

      const sysAt = gainVal => {
        const N1 = [1], D1 = [1, 1], N2 = [gainVal], D2 = [1, b], DD = polyMul(D1, D2);
        if (mode === 'ser') return { N: polyMul(N1, N2), D: DD };
        if (mode === 'par') return { N: polyAdd(polyMul(N1, D2), polyMul(N2, D1)), D: DD };
        return { N: polyMul(N1, D2), D: polyAdd(DD, polyMul(N1, N2)) };
      };
      const sys = () => sysAt(g);

      const T = 8, N = 320;
      let u0, u1;
      const sgn = v => (v >= 0 ? '+' : '−') + fx(Math.abs(v), 1);

      pD.draw = (c, w, h) => {
        const bx = (x, y, t, col) => {
          const bw = Math.min(126, w * .27), bh = 32;
          c.save(); c.fillStyle = COL.bg; c.strokeStyle = col; c.lineWidth = 1.7;
          c.beginPath(); c.roundRect(x - bw / 2, y - bh / 2, bw, bh, 5); c.fill(); c.stroke(); c.restore();
          txt(c, t, x, y, COL.text, 'center');
          return bw / 2;
        };
        const ln = (x1, y1, x2, y2) => {
          c.save(); c.strokeStyle = COL.sub; c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore();
        };
        const sm = (x, y, s) => {
          c.save(); c.fillStyle = COL.bg; c.strokeStyle = COL.main; c.lineWidth = 1.5;
          c.beginPath(); c.arc(x, y, 9.5, 0, TAU); c.fill(); c.stroke(); c.restore();
          txt(c, s, x, y, COL.main, 'center');
        };
        const h1 = 'H₁ = 1/(s+1)', h2 = `H₂ = ${fx(g, 1)}/(s${sgn(b)})`;
        const cy = h * .4, bw = Math.min(126, w * .27) / 2;
        if (mode === 'ser') {
          arrowSeg(c, 14, cy, w * .3 - bw, cy, COL.sub, 1.5);
          bx(w * .3, cy, h1, COL.c1);
          arrowSeg(c, w * .3 + bw, cy, w * .7 - bw, cy, COL.sub, 1.5);
          bx(w * .7, cy, h2, COL.c2);
          arrowSeg(c, w * .7 + bw, cy, w - 14, cy, COL.sub, 1.5);
          txt(c, 'H(s) = H₁(s) · H₂(s)', w / 2, h * .82, COL.main, 'center');
        } else if (mode === 'par') {
          const y1 = h * .25, y2 = h * .58, xs = w * .15, xe = w * .84;
          ln(14, h * .415, xs, h * .415); ln(xs, y1, xs, y2);
          arrowSeg(c, xs, y1, w * .48 - bw, y1, COL.sub, 1.5);
          arrowSeg(c, xs, y2, w * .48 - bw, y2, COL.sub, 1.5);
          bx(w * .48, y1, h1, COL.c1); bx(w * .48, y2, h2, COL.c2);
          ln(w * .48 + bw, y1, xe, y1); ln(w * .48 + bw, y2, xe, y2);
          arrowSeg(c, xe, y1, xe, h * .415 - 10, COL.sub, 1.5);
          arrowSeg(c, xe, y2, xe, h * .415 + 10, COL.sub, 1.5);
          sm(xe, h * .415, '+');
          arrowSeg(c, xe + 10, h * .415, w - 12, h * .415, COL.sub, 1.5);
          txt(c, 'H(s) = H₁(s) + H₂(s)', w / 2, h * .84, COL.main, 'center');
        } else {
          const xs = w * .13, xe = w * .85, yb = h * .64;
          arrowSeg(c, 10, cy, xs - 10, cy, COL.sub, 1.5);
          sm(xs, cy, 'Σ');
          arrowSeg(c, xs + 10, cy, w * .48 - bw, cy, COL.sub, 1.5);
          bx(w * .48, cy, h1, COL.c1);
          ln(w * .48 + bw, cy, xe, cy);
          arrowSeg(c, xe, cy, w - 10, cy, COL.sub, 1.5);
          ln(xe, cy, xe, yb);
          arrowSeg(c, xe, yb, w * .48 + bw, yb, COL.sub, 1.5);
          bx(w * .48, yb, h2, COL.c2);
          ln(w * .48 - bw, yb, xs, yb);
          arrowSeg(c, xs, yb, xs, cy + 10, COL.sub, 1.5);
          txt(c, '−', xs + 10, cy + 18, COL.err, 'center');
          txt(c, 'H(s) = H₁ / (1 + H₁·H₂)', w / 2, h * .88, COL.main, 'center');
        }
      };

      pS.draw = (c, w, h) => {
        const v = mkView(w, h, -4.5, 2.5, -4, 4, { l: 6, r: 6, t: 6, b: 6 }), q = sys();
        const items = [
          { t: 'p', x: -1, y: 0, col: COL.c1, ghost: 1 },
          { t: 'p', x: -b, y: 0, col: COL.c2, ghost: 1 }
        ];
        polyRoots(q.N).forEach(z => items.push({ t: 'z', x: z[0], y: z[1], col: COL.c1 }));
        polyRoots(q.D).forEach(p => items.push({ t: 'p', x: p[0], y: p[1], col: COL.main }));
        splane(c, v, {
          tint: true,
          items,
          extra: (cc, vv) => {
            if (mode !== 'fb') return;
            /* vẽ quỹ đạo nghiệm số khi g quét từ 0 → 8 */
            cc.save(); cc.fillStyle = COL.main; cc.globalAlpha = .32;
            for (let gk = 0; gk <= 8; gk += .08) {
              for (const rt of polyRoots(sysAt(gk).D)) {
                cc.beginPath(); cc.arc(vv.X(rt[0]), vv.Y(rt[1]), 1.3, 0, TAU); cc.fill();
              }
            }
            cc.restore();
          }
        });
      };

      pU.draw = (c, w, h, p) => {
        const [lo, hi] = rngA([u0, u1], 12, .5), v = mkView(w, h, 0, T, lo, hi);
        axes(c, v, { xl: 't' });
        curve(c, v, arrF(u1, 0, T / N), 0, T, COL.sub, 1.4, N, { dash: [4, 4] });
        curve(c, v, arrF(u0, 0, T / N), 0, T, COL.main, 2.4, N);
        p.hoverReadout(c, v, arrF(u0, 0, T / N), 't', 'y(t)', COL.main);
      };

      const Hj = (q, w) => cdiv(polyEval(q.N, [0, w]), polyEval(q.D, [0, w]));
      pB.draw = (c, w, h, p) => {
        const q = sys(), q1 = { N: [1], D: [1, 1] };
        const mx = Math.max(...polyRoots(q.D).map(r => r[0]));
        if (mx > 1e-4) {
          const v = mkView(w, h, 0, 8, 0, 1); axes(c, v, { xl: 'ω', noYL: 1 });
          txt(c, 'cực kín sang nửa phải → hệ mất ổn định', w / 2, h / 2, COL.err, 'center');
          return;
        }
        const fn = x => cabs(Hj(q, x));
        const ym = amp([fn, x => cabs(Hj(q1, x))], 0, 8, 160, 10, .5), v = mkView(w, h, 0, 8, 0, ym);
        axes(c, v, { xl: 'ω' });
        curve(c, v, x => cabs(Hj(q1, x)), 0, 8, COL.sub, 1.4, 280, { dash: [4, 4] });
        curve(c, v, fn, 0, 8, COL.c2, 2.3, 380);
        p.hoverReadout(c, v, fn, 'ω', '|H|', COL.c2);
      };

      ui.anim = dt => {
        g += dir * dt * 2.2;
        if (g > 7.5) { g = 7.5; dir = -1; }
        if (g < -.8) { g = -.8; dir = 1; }
        sg.set(g); ui.update();
      };

      ui.update = () => {
        const q = sys(), r = polyRoots(q.D), mx = Math.max(...r.map(p => p[0]));
        u0 = sim(q.N, q.D, 'step', T, N);
        u1 = sim([1], [1, 1], 'step', T, N);
        const hasOsc = r.some(p => Math.abs(p[1]) > .05);
        pS.tags([
          mx < -1e-4 ? ['ổn định', 'ok'] : Math.abs(mx) <= 1e-4 ? ['ổn định biên', 'neu'] : ['bất ổn định', 'bad'],
          hasOsc ? ['dao động phức', 'inf'] : ['cực thực', 'inf']
        ]);
        ui.refresh();
      };

      ui.applyPreset = applyP;
      if (preset) applyP(preset);
    }
  });

  /* ---------------------------------------------------------------------
     9 · Mạch RLC miền s — Laplace một phía & Điều kiện đầu (Phần J)
     --------------------------------------------------------------------- */
  L11.push({
    key: 'rlc',
    name: 'Mạch RLC',
    tip: 'Phần J · Mạch tương đương miền s, nguồn phụ điều kiện đầu & tách ZSR + ZIR',
    autoPlay: true,
    build(ui, preset) {
      let R = .5, v0 = -1, i0 = 0, src = 1, tc = 0, beadPhase = 0;
      const pC = ui.panel('sơ đồ mạch miền <i>s</i> (<i>L</i>=1, <i>C</i>=1) &amp; dòng điện tức thời', 'a');
      const pS = ui.panel('quỹ đạo cực <i>V<sub>C</sub></i>(<i>s</i>) theo <i>R</i>', 'b');
      const pW = ui.panel('<i>v<sub>C</sub></i>(<i>t</i>) = <span style="color:var(--c1)">ZSR (trạng thái 0)</span> + <span style="color:var(--c2)">ZIR (đầu vào 0)</span>', 'c');
      ui.layout(['a b', 'c c'], '1.35fr 1fr', '1.05fr 1.12fr');

      const segPre = ui.seg([
        ['under', 'thiếu tắt (R<2)'],
        ['crit', 'tới hạn (R=2)'],
        ['over', 'quá tắt (R>2)'],
        ['zir', 'tự do (nguồn 0)']
      ], 'under', k => applyP(k));
      const sR = ui.slider('R', 0, 4, .05, R, 2, v => { R = v; ui.update(); });
      const sv0 = ui.slider('v(0⁻)', -2, 2, .1, v0, 1, v => { v0 = v; ui.update(); });
      const si0 = ui.slider('i(0⁻)', -2, 2, .1, i0, 1, v => { i0 = v; ui.update(); });
      const segSrc = ui.seg([['1', 'V = u(t)'], ['0', 'V = 0']], '1', k => { src = +k; ui.update(); });

      function applyP(k) {
        if (k === 'under') { R = .5; v0 = -1; i0 = 0; src = 1; }
        else if (k === 'crit') { R = 2; v0 = -1; i0 = 0; src = 1; }
        else if (k === 'over') { R = 3.2; v0 = -1; i0 = 0; src = 1; }
        else if (k === 'zir') { R = .35; v0 = 1.5; i0 = .6; src = 0; }
        segPre.set(k); segSrc.set(String(src));
        sR.set(R); sv0.set(v0); si0.set(i0);
        tc = 0; ui.update();
      }

      const T = 14, N = 700;
      function runRLC(vInit, iInit, vs) {
        const vOut = new Float64Array(N + 1), iOut = new Float64Array(N + 1), h = T / N / 4;
        let x = vInit, y = iInit;
        const f = (a, b) => [b, vs - R * b - a];
        for (let k = 0; k <= N; k++) {
          vOut[k] = x; iOut[k] = y;
          for (let q = 0; q < 4; q++) {
            const k1 = f(x, y);
            const k2 = f(x + h / 2 * k1[0], y + h / 2 * k1[1]);
            const k3 = f(x + h / 2 * k2[0], y + h / 2 * k2[1]);
            const k4 = f(x + h * k3[0], y + h * k3[1]);
            x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
            y += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
          }
        }
        return { v: vOut, i: iOut };
      }

      let zs, zi;
      const poles = () => {
        const d = R * R - 4;
        return d >= 0
          ? [[(-R + Math.sqrt(d)) / 2, 0], [(-R - Math.sqrt(d)) / 2, 0]]
          : [[-R / 2, Math.sqrt(-d) / 2], [-R / 2, -Math.sqrt(-d) / 2]];
      };
      const curAt = t => {
        const k = clamp(Math.round(t / (T / N)), 0, N);
        return zs.i[k] + zi.i[k];
      };

      /* Sơ đồ mạch vòng RLC nối tiếp chuẩn kỹ thuật điện trong miền s */
      pC.draw = (c, w, h) => {
        const xL = Math.round(w * .13), xR = Math.round(w * .85);
        const yT = Math.round(h * .25), yB = Math.round(h * .82);
        const ym = (yT + yB) / 2;
        c.save();
        c.strokeStyle = COL.sub; c.lineWidth = 1.8; c.lineJoin = 'round';

        /* 1. Nhánh trái: Nguồn V(s) */
        c.beginPath(); c.moveTo(xL, yT); c.lineTo(xL, ym - 16); c.moveTo(xL, ym + 16); c.lineTo(xL, yB); c.stroke();
        c.strokeStyle = COL.main; c.fillStyle = COL.bg;
        c.beginPath(); c.arc(xL, ym, 16, 0, TAU); c.fill(); c.stroke();
        txt(c, '+', xL, ym - 6, COL.main, 'center', 'middle', FONT_SM);
        txt(c, '−', xL, ym + 7, COL.sub, 'center', 'middle', FONT_SM);
        txt(c, src ? '1/s' : '0', xL - 22, ym, COL.main, 'right', 'middle', FONT_SM);

        /* 2. Nhánh trên: Điện trở R (zíc-zắc) + Cuộn cảm sL (xoắn) + Nguồn phụ Li(0⁻) */
        const rA = xL + (xR - xL) * .1, rB = xL + (xR - xL) * .32;
        const lA = xL + (xR - xL) * .42, lB = xL + (xR - xL) * .68;
        const sLx = xL + (xR - xL) * .83;
        c.strokeStyle = COL.sub;
        c.beginPath(); c.moveTo(xL, yT); c.lineTo(rA, yT); c.stroke();
        /* zíc-zắc R */
        c.strokeStyle = COL.text;
        c.beginPath(); c.moveTo(rA, yT);
        const nZ = 6;
        for (let k = 0; k < nZ; k++) {
          const xx = rA + (rB - rA) * (k + .5) / nZ;
          c.lineTo(xx, yT + (k % 2 ? 7 : -7));
        }
        c.lineTo(rB, yT); c.stroke();
        txt(c, `R=${fx(R, 2)}`, (rA + rB) / 2, yT - 15, COL.text, 'center', 'middle', FONT_SM);

        c.strokeStyle = COL.sub;
        c.beginPath(); c.moveTo(rB, yT); c.lineTo(lA, yT); c.stroke();
        /* cuộn cảm 4 vòng cung sL */
        c.strokeStyle = COL.c1;
        c.beginPath();
        const nL = 4, lw = (lB - lA) / nL;
        for (let k = 0; k < nL; k++) {
          const x0k = lA + lw * k, x1k = x0k + lw;
          c.moveTo(x0k, yT);
          c.bezierCurveTo(x0k + lw * .1, yT - 13, x1k - lw * .1, yT - 13, x1k, yT);
        }
        c.stroke();
        txt(c, 'sL', (lA + lB) / 2, yT - 20, COL.c1, 'center', 'middle', FONT_SM);

        /* nguồn phụ nối tiếp Li(0⁻) */
        c.strokeStyle = COL.sub;
        c.beginPath(); c.moveTo(lB, yT); c.lineTo(sLx - 12, yT); c.moveTo(sLx + 12, yT); c.lineTo(xR, yT); c.stroke();
        const hasI0 = Math.abs(i0) > .02;
        c.strokeStyle = hasI0 ? COL.c2 : COL.grid; c.fillStyle = COL.bg;
        c.beginPath(); c.arc(sLx, yT, 12, 0, TAU); c.fill(); c.stroke();
        txt(c, `Li₀=${fx(i0, 1)}`, sLx, yT - 18, hasI0 ? COL.c2 : COL.sub, 'center', 'middle', FONT_SM);
        txt(c, '∓', sLx, yT + .5, hasI0 ? COL.c2 : COL.sub, 'center', 'middle', FONT_SM);

        /* 3. Nhánh phải: Tụ điện 1/sC (2 bản cực) + Nguồn phụ v(0⁻)/s */
        const cY = yT + (yB - yT) * .33, vY = yT + (yB - yT) * .72;
        c.strokeStyle = COL.sub;
        c.beginPath();
        c.moveTo(xR, yT); c.lineTo(xR, cY - 5);
        c.moveTo(xR, cY + 5); c.lineTo(xR, vY - 13);
        c.moveTo(xR, vY + 13); c.lineTo(xR, yB);
        c.moveTo(xL, yB); c.lineTo(xR, yB);
        c.stroke();
        /* 2 bản cực tụ 1/sC */
        c.strokeStyle = COL.c1; c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(xR - 12, cY - 5); c.lineTo(xR + 12, cY - 5); c.moveTo(xR - 12, cY + 5); c.lineTo(xR + 12, cY + 5); c.stroke();
        txt(c, '1/sC', xR - 16, cY, COL.c1, 'right', 'middle', FONT_SM);
        /* nguồn phụ v(0⁻)/s */
        const hasV0 = Math.abs(v0) > .02;
        c.lineWidth = 1.8; c.strokeStyle = hasV0 ? COL.c2 : COL.grid; c.fillStyle = COL.bg;
        c.beginPath(); c.arc(xR, vY, 13, 0, TAU); c.fill(); c.stroke();
        txt(c, '±', xR, vY + .5, hasV0 ? COL.c2 : COL.sub, 'center', 'middle', FONT_SM);
        txt(c, `${fx(v0, 1)}/s`, xR - 17, vY, hasV0 ? COL.c2 : COL.sub, 'right', 'middle', FONT_SM);
        txt(c, 'V_C(s)', xR + 16, ym, COL.main, 'left', 'middle', FONT_SM);

        /* 4. Các hạt dòng điện chạy quanh mạch theo i(t_c) */
        const iNow = curAt(tc);
        if (Math.abs(iNow) > .015) {
          const perim = 2 * ((xR - xL) + (yB - yT));
          const ptOnLoop = u => {
            let d = ((u % 1) + 1) % 1 * perim;
            const W = xR - xL, H = yB - yT;
            if (d < W) return [xL + d, yT];
            d -= W;
            if (d < H) return [xR, yT + d];
            d -= H;
            if (d < W) return [xR - d, yB];
            return [xL, yB - (d - W)];
          };
          c.fillStyle = iNow >= 0 ? COL.main : COL.c4;
          c.globalAlpha = clamp(.35 + Math.abs(iNow) * .6, .35, .95);
          for (let k = 0; k < 10; k++) {
            const [bx, by] = ptOnLoop(beadPhase + k / 10);
            c.beginPath(); c.arc(bx, by, 2.7, 0, TAU); c.fill();
          }
        }
        c.restore();
      };

      pS.draw = (c, w, h) => {
        const v = mkView(w, h, -3.6, .8, -2, 2, { l: 6, r: 6, t: 6, b: 6 });
        splane(c, v, {
          tint: true,
          items: poles().map(p => ({ t: 'p', x: p[0], y: p[1], col: COL.main, mult: Math.abs(R - 2) < .03 ? 2 : 1 })),
          extra: (cc, vv) => {
            cc.save(); cc.setLineDash([3, 4]); cc.strokeStyle = COL.sub;
            cc.beginPath(); cc.arc(vv.X(0), vv.Y(0), Math.abs(vv.X(1) - vv.X(0)), Math.PI * .5, Math.PI * 1.5); cc.stroke();
            cc.restore();
          }
        });
      };

      pW.draw = (c, w, h, p) => {
        const totArr = Float64Array.from(zs.v, (z, i) => z + zi.v[i]);
        const [lo, hi] = rngA([zs.v, zi.v, totArr], 8, 1.1);
        const v = mkView(w, h, 0, T, lo, hi);
        axes(c, v, { xl: 't' });
        curve(c, v, arrF(zs.v, 0, T / N), 0, T, COL.c1, 1.5, N, { dash: [5, 4] });
        curve(c, v, arrF(zi.v, 0, T / N), 0, T, COL.c2, 1.5, N, { dash: [5, 4] });
        const fnTot = arrF(totArr, 0, T / N);
        curve(c, v, fnTot, 0, T, COL.main, 2.6, N);
        mark(c, 'd', v.X(0), v.Y(v0), COL.c2);
        txt(c, 'v(0⁻)', v.X(0) + 7, v.Y(v0) - 8, COL.c2, 'left', 'middle', FONT_SM);
        c.save(); clipTo(c, v); c.strokeStyle = COL.main; c.globalAlpha = .45;
        c.beginPath(); c.moveTo(v.X(tc), v.P.t); c.lineTo(v.X(tc), v.P.t + v.ih); c.stroke(); c.restore();
        mark(c, 'd', v.X(tc), clamp(v.Y(fnTot(tc)), v.P.t, v.P.t + v.ih), COL.main);
        p.hoverReadout(c, v, fnTot, 't', 'v_C', COL.main);
      };

      ui.anim = dt => {
        tc += dt * 1.45;
        if (tc > T) tc = 0;
        beadPhase += dt * curAt(tc) * .35;
        pC.tags([[`i(t) = ${fx(curAt(tc), 2)} A`, 'inf']]);
        pC.render(); pW.render();
      };

      ui.update = () => {
        zs = runRLC(0, 0, src);
        zi = runRLC(v0, i0, 0);
        const d = R * R - 4;
        const modeTag = R < .02 ? ['không tổn hao (LC)', 'neu']
          : Math.abs(d) < .08 ? ['tắt dần tới hạn', 'ok']
          : d < 0 ? ['dao động tắt dần', 'inf']
          : ['quá tắt', 'ok'];
        pS.tags([modeTag]);
        pC.tags([[`i(t) = ${fx(curAt(tc), 2)} A`, 'inf']]);
        ui.refresh();
      };

      ui.applyPreset = applyP;
      if (preset) applyP(preset);
    }
  });

  /* ---------- Lõi quản lý Popup Phòng thí nghiệm ---------- */
  const LESSONS = {};
  let pop, tabsEl, bodyEl, ctlEl, titleEl, playBtn, rstBtn;
  let open = false, curLesson = null, curLessonNum = 0, ui = null, raf = 0, last = 0, idx = 0;
  let playing = true, dragPaused = false;

  const FLASK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>';
  const ICO_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>';
  const ICO_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
  const ICO_RST = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>';

  /* Ẩn thanh nổi #vBar của Hub khi popup 95% mở để không che nút đóng */
  function syncParentChrome(isOpen) {
    try {
      if (window.parent && window.parent !== window) {
        const doc = window.parent.document;
        const vb = doc.getElementById('vBar'), hm = doc.getElementById('hmenu');
        if (vb) {
          vb.style.opacity = isOpen ? '0' : '';
          vb.style.pointerEvents = isOpen ? 'none' : '';
        }
        if (hm && isOpen) hm.classList.remove('on');
      }
    } catch (_) {}
  }

  function ensureDOM() {
    if (pop) return;
    pop = el('div', 'lab-pop');
    pop.id = 'labPop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');
    pop.setAttribute('aria-label', 'Phòng thí nghiệm tương tác');
    pop.innerHTML =
      `<div class="lab-box">` +
      `<div class="lab-head">` +
      `<div class="lab-brand">${FLASK}<span class="lab-bt"></span></div>` +
      `<div class="lab-tabs" role="tablist"></div>` +
      `<div class="lab-hacts">` +
      `<button type="button" class="lab-ibtn lab-play" title="Chạy / Tạm dừng mô phỏng động (Phím Space)">${ICO_PLAY}</button>` +
      `<button type="button" class="lab-ibtn lab-rst" title="Đặt lại thông số tab này (Phím R)">${ICO_RST}</button>` +
      `<button type="button" class="lab-x" aria-label="Đóng (Esc)" title="Đóng phòng thí nghiệm (Esc / L)">✕</button>` +
      `</div>` +
      `</div>` +
      `<div class="lab-body"></div>` +
      `<div class="lab-ctl"></div>` +
      `</div>`;
    document.body.appendChild(pop);
    tabsEl = pop.querySelector('.lab-tabs');
    bodyEl = pop.querySelector('.lab-body');
    ctlEl = pop.querySelector('.lab-ctl');
    titleEl = pop.querySelector('.lab-bt');
    playBtn = pop.querySelector('.lab-play');
    rstBtn = pop.querySelector('.lab-rst');

    playBtn.onclick = () => setPlaying(!playing);
    rstBtn.onclick = () => { if (curLesson) selectTab(idx); };
    pop.addEventListener('click', e => {
      if (e.target === pop || e.target.closest('.lab-x')) toggle(0, false);
    });
    document.addEventListener('keydown', e => {
      if (!open) return;
      if (e.key === 'Escape' || ((e.key === 'l' || e.key === 'L') && !e.target.matches('input,textarea'))) {
        e.preventDefault(); e.stopPropagation();
        toggle(0, false);
        return;
      }
      if (e.target.matches('input,textarea,select')) return;
      if (e.key === ' ') {
        e.preventDefault();
        setPlaying(!playing);
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (curLesson) selectTab(idx);
        return;
      }
      if (/^[1-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey && curLesson) {
        const i = +e.key - 1;
        if (curLesson.tabs[i]) selectTab(i);
      }
    }, true);
  }

  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function startLoopIfNeeded() {
    if (!open || !ui || !ui.anim || !playing || dragPaused) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }
  function loop(ts) {
    raf = 0;
    if (!open || !ui || !ui.anim || !playing || dragPaused) return;
    const dt = Math.min(.05, (ts - last) / 1000 || 0);
    last = ts;
    ui.anim(dt);
    raf = requestAnimationFrame(loop);
  }
  function updatePlayUI() {
    if (!playBtn) return;
    const hasAnim = !!(ui && ui.anim);
    playBtn.style.display = hasAnim ? '' : 'none';
    playBtn.innerHTML = playing ? ICO_PAUSE : ICO_PLAY;
    playBtn.classList.toggle('on', playing && hasAnim);
  }
  function setPlaying(val) {
    playing = !!val;
    if (!playing) stopLoop();
    else startLoopIfNeeded();
    updatePlayUI();
  }

  function selectTab(i, preset) {
    if (!curLesson || !curLesson.tabs[i]) return;
    stopLoop();
    if (ui) ui.dispose();
    ui = null;
    idx = i;
    dragPaused = false;
    bodyEl.replaceChildren();
    bodyEl.removeAttribute('style');
    ctlEl.replaceChildren();
    [...tabsEl.children].forEach((b, k) => {
      b.classList.toggle('on', k === i);
      b.setAttribute('aria-selected', k === i ? 'true' : 'false');
    });
    const t = curLesson.tabs[i];
    playing = t.autoPlay !== undefined ? !!t.autoPlay : false;
    ui = makeUI(bodyEl, ctlEl, isDragging => {
      dragPaused = isDragging;
      if (isDragging) stopLoop();
      else startLoopIfNeeded();
    });
    t.build(ui, preset);
    ui.update();
    updatePlayUI();
    startLoopIfNeeded();
  }

  function resolveTabIndex(L, tabKeyOrIdx) {
    if (tabKeyOrIdx == null || tabKeyOrIdx === '') return -1;
    if (typeof tabKeyOrIdx === 'number') return L.tabs[tabKeyOrIdx] ? tabKeyOrIdx : -1;
    const byKey = L.tabs.findIndex(t => t.key === tabKeyOrIdx);
    if (byKey >= 0) return byKey;
    const n = +tabKeyOrIdx;
    return !isNaN(n) && L.tabs[n] ? n : -1;
  }

  function setLesson(num, opts) {
    const L = LESSONS[num] || null;
    const parsed = parseOpts(opts);
    const sameLesson = curLesson === L && curLessonNum === num && (L ? tabsEl.childElementCount > 0 : bodyEl.firstChild);

    if (!sameLesson) {
      curLesson = L;
      curLessonNum = num;
      tabsEl.replaceChildren();
      stopLoop();
      if (ui) ui.dispose();
      ui = null;
      bodyEl.replaceChildren();
      bodyEl.removeAttribute('style');
      ctlEl.replaceChildren();
      if (!L) {
        titleEl.textContent = 'Phòng thí nghiệm';
        bodyEl.append(el('div', 'lab-empty', 'Bài này chưa có phòng thí nghiệm tương tác'));
        if (playBtn) playBtn.style.display = 'none';
        if (rstBtn) rstBtn.style.display = 'none';
        return;
      }
      if (rstBtn) rstBtn.style.display = '';
      titleEl.textContent = L.title;
      L.tabs.forEach((t, i) => {
        const b = el('button', 'lab-tab', `<span class="tk">${i + 1}</span>${t.name}`);
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.title = (t.tip || '') + ` (Phím ${i + 1})`;
        b.onclick = () => selectTab(i);
        tabsEl.append(b);
      });
      const ti = resolveTabIndex(L, parsed.tab);
      selectTab(ti >= 0 ? ti : 0, parsed.preset);
      return;
    }

    if (L && (parsed.tab != null || parsed.preset != null)) {
      const ti = resolveTabIndex(L, parsed.tab);
      if (ti >= 0 && ti !== idx) {
        selectTab(ti, parsed.preset);
      } else if (parsed.preset && ui && ui.applyPreset) {
        ui.applyPreset(parsed.preset);
      }
    }
  }

  function parseOpts(opts) {
    if (!opts) return { tab: null, preset: null };
    if (typeof opts === 'string') {
      const parts = opts.split(':');
      return { tab: parts[0] || null, preset: parts[1] || null };
    }
    return { tab: opts.tab ?? null, preset: opts.preset ?? null };
  }

  function toggle(num, force, opts) {
    ensureDOM();
    readColors();
    const want = force === undefined ? !open : !!force;
    if (!want) {
      if (!open) return;
      open = false;
      pop.classList.remove('open');
      syncParentChrome(false);
      stopLoop();
      return;
    }
    const wasOpen = open;
    open = true;
    pop.classList.add('open');
    syncParentChrome(true);
    setLesson(num, opts);
    if (wasOpen && ui) ui.refresh();
    startLoopIfNeeded();
  }

  function openSpec(spec, fallbackLesson) {
    if (!spec) { toggle(fallbackLesson || 11, true); return; }
    const parts = String(spec).split(':');
    let lessonNum = fallbackLesson || 11, tab = null, preset = null;
    if (/^\d+$/.test(parts[0]) && LESSONS[+parts[0]]) {
      lessonNum = +parts[0];
      tab = parts[1] || null;
      preset = parts[2] || null;
    } else {
      tab = parts[0] || null;
      preset = parts[1] || null;
    }
    toggle(lessonNum, true, { tab, preset });
  }

  window.LAB = {
    toggle,
    open: openSpec,
    isOpen: () => open,
    has: num => !!LESSONS[num],
    register: (num, def) => { LESSONS[num] = def; }
  };

  LESSONS[11] = { title: 'Bài 11 · Laplace', tabs: L11 };
})();
