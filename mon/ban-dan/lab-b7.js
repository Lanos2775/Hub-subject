/* ==========================================================================
   lab-b7.js — PHÒNG THÍ NGHIỆM BUỔI 7 (popup 95% màn hình)
   - Tự chứa: tự chèn CSS + HTML popup, không phụ thuộc code bài học.
   - 8 tab = 8 mục của Buổi 7. Mỗi tab gồm vài "màn hình nhỏ" (canvas) + thanh trượt.
   - API: LabB7.open(tabId?, panelIndex?)  LabB7.close()  LabB7.mark(root)
   ========================================================================== */
(function () {
'use strict';

/* ---------- tiện ích ---------- */
const TAU2 = Math.PI * 2, Q = 1.602e-19, KB = 8.617e-5;
const rnd = (a, b) => a + Math.random() * (b - a);
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU2 * v); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[d]).join('');
const p10 = n => '10' + sup(n);
const sci = (x, d = 1) => { if (!x) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); return (x / Math.pow(10, e)).toFixed(d) + '×10' + sup(e); };
const lin = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
const FONT = '"Be Vietnam Pro",system-ui,sans-serif';
const C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ['bg', 'card', 'ink', 'mut', 'sub', 'main', 'err', 'c1', 'c2', 'c3', 'c4', 'c5', 'g', 'tint'].forEach(k => C[k] = cs.getPropertyValue('--' + k).trim() || '#888');
}

/* ---------- vẽ ---------- */
function txt(ctx, s, x, y, col, size, al, wt) {
  ctx.font = (wt || 500) + ' ' + (size || 12) + 'px ' + FONT; ctx.fillStyle = col || C.ink;
  ctx.textAlign = al || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}
function ln(ctx, x1, y1, x2, y2, col, w, dash) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = col; ctx.lineWidth = w || 1; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
}
function arr(ctx, x1, y1, x2, y2, col, w) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 4 + (w || 2) * 1.6;
  ln(ctx, x1, y1, x2, y2, col, w || 2);
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - h * Math.cos(a - .45), y2 - h * Math.sin(a - .45));
  ctx.lineTo(x2 - h * Math.cos(a + .45), y2 - h * Math.sin(a + .45)); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
function dot(ctx, x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU2); ctx.fillStyle = col; ctx.fill(); }
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
/* ---------- vật lý dùng chung ---------- */
const MU = { n: { mn: 92, mx: 1350, N0: 1.3e17, a: 0.91 }, p: { mn: 49, mx: 480, N0: 6.3e16, a: 0.76 } };
const ct = (N, t) => { const m = MU[t]; return m.mn + (m.mx - m.mn) / (1 + Math.pow(N / m.N0, m.a)); };
const muL = T => 1400 * Math.pow(T / 300, -1.5);
const muI = (T, N) => 1.7e20 * Math.pow(T / 300, 1.5) / N;
const muT = (T, N) => 1 / (1 / muL(T) + 1 / muI(T, N));
const VT = T => KB * T;
const rho = (N, t) => 1 / (Q * N * ct(N, t));
const vdE = (E, mu0, vs, n) => mu0 * E / Math.pow(1 + Math.pow(mu0 * E / vs, n), 1 / n);
const fmtR = r => r >= 1e6 ? (r / 1e6).toPrecision(3) + ' MΩ' : r >= 1e3 ? (r / 1e3).toPrecision(3) + ' kΩ' : r.toPrecision(3) + ' Ω';

const LABS = [];

/* ==========================================================================
   TAB 1 — TRÔI
   ========================================================================== */
LABS.push({
  id: 'drift', name: 'Trôi', sec: 1,
  S: { E: 400, type: 'n', N: 1e16, P: 1e10 },
  cols: '1.5fr 1fr', rows: '1.5fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Hạt tải trôi trong điện trường', area: 'a', anim: true,
      ctrls: [{ k: 'E', l: 'E', min: 0, max: 1000, step: 10, f: v => v + ' V/cm' }, { k: 'type', seg: [['n', 'Electron'], ['p', 'Lỗ trống']] }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, bx = 12, by = 32, bw = W - 24, bh = H - by - 12;
        if (!st.ps) st.ps = Array.from({ length: 34 }, () => ({ x: rnd(0, bw), y: rnd(8, bh - 8), vx: gauss() * 55, vy: gauss() * 55, tc: rnd(0, .3) })), st.tr = [];
        const isn = S.type === 'n', mu = isn ? 1350 : 480, vd = (isn ? -1 : 1) * mu / 1350 * (S.E / 1000) * 190;
        txt(ctx, 'E', bx + 2, 14, C.main, 13, 'left', 700);
        if (S.E > 20) arr(ctx, bx + 16, 14, bx + 16 + S.E / 1000 * (W * .5), 14, C.main, 2.5);
        txt(ctx, 'v_d = ' + sci(mu * S.E) + ' cm/s', W - 14, 14, C.ink, 12, 'right', 700);
        rr(ctx, bx, by, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        ctx.save(); rr(ctx, bx, by, bw, bh, 8); ctx.clip(); ctx.translate(bx, by);
        const col = isn ? C.c2 : C.c4;
        st.ps.forEach((q, i) => {
          q.tc -= dt; if (q.tc <= 0) { q.vx = gauss() * 55; q.vy = gauss() * 55; q.tc = rnd(.1, .4); }
          q.x += (q.vx + vd) * dt; q.y += q.vy * dt;
          if (q.x > bw) { q.x -= bw; if (i === 0) st.tr = []; } if (q.x < 0) { q.x += bw; if (i === 0) st.tr = []; }
          if (q.y < 7 || q.y > bh - 7) { q.vy = -q.vy; q.y = clamp(q.y, 7, bh - 7); }
          if (i === 0) { st.tr.push([q.x, q.y]); if (st.tr.length > 90) st.tr.shift(); }
        });
        if (st.tr.length > 1) { ctx.beginPath(); st.tr.forEach((a, i) => i ? ctx.lineTo(a[0], a[1]) : ctx.moveTo(a[0], a[1])); ctx.strokeStyle = C.main; ctx.lineWidth = 2; ctx.stroke(); }
        st.ps.forEach((q, i) => { dot(ctx, q.x, q.y, 7, col); if (i === 0) { ctx.lineWidth = 2; ctx.strokeStyle = C.main; ctx.beginPath(); ctx.arc(q.x, q.y, 8, 0, TAU2); ctx.stroke(); } txt(ctx, isn ? '−' : '+', q.x, q.y + .5, C.bg, 12, 'center', 800); });
        ctx.restore();
      } },
    { title: 'J = q(nμₙ + pμₚ)E', area: 'c',
      ctrls: [{ k: 'N', l: 'n', min: 10, max: 18, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }, { k: 'P', l: 'p', min: 10, max: 18, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }],
      draw(p, ctx, W, H) {
        const S = p.S, jn = Q * S.N * 1350 * S.E, jp = Q * S.P * 480 * S.E, J = jn + jp, f = jn / (J || 1);
        const bx = 16, bw = W - 32, y = H * .52, h = 30;
        txt(ctx, 'J = ' + (J ? sci(J, 2) : '0') + ' A/cm²', W / 2, H * .22, C.ink, 17, 'center', 700);
        rr(ctx, bx, y, bw, h, 6); ctx.fillStyle = C.tint; ctx.fill();
        if (J) { ctx.save(); rr(ctx, bx, y, bw, h, 6); ctx.clip(); ctx.fillStyle = C.c2; ctx.fillRect(bx, y, bw * f, h); ctx.fillStyle = C.c4; ctx.fillRect(bx + bw * f, y, bw * (1 - f), h); ctx.restore(); }
        txt(ctx, 'Jₙ ' + Math.round(f * 100) + '%', bx, y + h + 16, C.c2, 12.5, 'left', 700);
        txt(ctx, 'Jₚ ' + Math.round((1 - f) * 100) + '%', bx + bw, y + h + 16, C.c4, 12.5, 'right', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 2 — ĐỘ LINH ĐỘNG
   ========================================================================== */
LABS.push({
  id: 'mobility', name: 'Linh động', sec: 2,
  S: { T: 300, N: 1e16 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [
    { title: 'Va chạm làm hạt tải bị cản', area: 'a', anim: true,
      ctrls: [{ k: 'T', l: 'T', min: 100, max: 600, step: 10, f: v => v + ' K' }, { k: 'N', l: 'N', min: 14, max: 19, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, mu = muT(S.T, S.N), tau = Math.max(.07, .6 * mu / 1400);
        if (!st.ps || st.W !== W) {
          st.W = W; st.ions = Array.from({ length: 40 }, () => [rnd(10, W - 10), rnd(10, H - 10)]);
          st.ps = Array.from({ length: 6 }, (_, i) => ({ x: rnd(0, W * .3), y: H * (i + .7) / 6.4, vx: 0, vy: 0, tr: [], fl: 0 })); st.fl = [];
        }
        const amp = 1 + 4.5 * Math.sqrt(S.T / 300), cols = Math.floor(W / 46), rows = Math.floor(H / 46);
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          const x = (i + .5) * W / cols + amp * Math.sin(t * 7 + i * 1.7 + j), y = (j + .5) * H / rows + amp * Math.cos(t * 6.3 + j * 2.1 + i);
          dot(ctx, x, y, 6, C.tint); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU2); ctx.stroke();
        }
        const k = Math.round(3 + (Math.log10(S.N) - 14) * 7);
        for (let i = 0; i < k; i++) { const a = st.ions[i]; dot(ctx, a[0], a[1], 7, C.c4); txt(ctx, '+', a[0], a[1] + .5, C.bg, 12, 'center', 800); }
        st.ps.forEach(q => {
          if (Math.random() < dt / tau) { q.vx = gauss() * 35; q.vy = gauss() * 35; st.fl.push({ x: q.x, y: q.y, a: 1 }); }
          q.vx += 260 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
          if (q.y < 6 || q.y > H - 6) { q.vy = -q.vy; q.y = clamp(q.y, 6, H - 6); }
          if (q.x > W) { q.x = 0; q.tr = []; }
          q.tr.push([q.x, q.y]); if (q.tr.length > 40) q.tr.shift();
          ctx.beginPath(); q.tr.forEach((a, i) => i ? ctx.lineTo(a[0], a[1]) : ctx.moveTo(a[0], a[1])); ctx.strokeStyle = C.main; ctx.globalAlpha = .55; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
          dot(ctx, q.x, q.y, 6, C.c2); txt(ctx, '−', q.x, q.y + .5, C.bg, 12, 'center', 800);
        });
        st.fl = st.fl.filter(f => (f.a -= dt * 2.5) > 0); st.fl.forEach(f => { ctx.beginPath(); ctx.arc(f.x, f.y, 6 + (1 - f.a) * 16, 0, TAU2); ctx.strokeStyle = C.main; ctx.globalAlpha = f.a; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; });
        rr(ctx, 8, 8, 112, 22, 6); ctx.fillStyle = C.card; ctx.fill(); txt(ctx, 'μ = ' + Math.round(mu), 16, 19, C.main, 13, 'left', 700);
        arr(ctx, W - 70, 19, W - 16, 19, C.main, 2.5); txt(ctx, 'E', W - 78, 19, C.main, 12, 'right', 700);
      } },
  ]
});

/* ==========================================================================
   TAB 3 — ĐỘ DẪN, ĐIỆN TRỞ
   ========================================================================== */
LABS.push({
  id: 'resist', name: 'Điện trở', sec: 3,
  S: { N: 1e16, L: 120, A: 12, V: 3, T: 300 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  R() { const S = this.S; return rho(S.N, 'n') * S.L * 1e4 / S.A; },
  panels: [
    { title: 'Thanh bán dẫn: R = ρL/A', area: 'a', anim: true,
      ctrls: [{ k: 'N', l: 'N', min: 14, max: 19, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }, { k: 'L', l: 'L', min: 20, max: 500, step: 10, f: v => v + ' µm' }, { k: 'A', l: 'A', min: 2, max: 100, step: 1, f: v => v + ' µm²' }, { k: 'V', l: 'V', min: 0, max: 5, step: .1, f: v => v.toFixed(1) + ' V' }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, R = p.tab.R(), I = S.V / R;
        const len = clamp(W * (.28 + S.L / 500 * .5), 60, W - 120), s = 22 + Math.sqrt(S.A) * 5.2, dx = s * .55, dy = s * .3;
        const x0 = (W - len - dx) / 2, y0 = H * .5 + s / 2 - dy / 2 + 6;
        if (!st.ps) st.ps = Array.from({ length: 70 }, () => ({ u: Math.random(), v: Math.random(), w: Math.random() }));
        const P = (x, y, z) => [x0 + x + dx * y, y0 - z - dy * y];
        const face = (pts, col) => { ctx.beginPath(); pts.forEach((a, i) => i ? ctx.lineTo(a[0], a[1]) : ctx.moveTo(a[0], a[1])); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.2; ctx.stroke(); };
        face([P(0, 1, 0), P(len, 1, 0), P(len, 1, s), P(0, 1, s)], C.tint);
        face([P(0, 0, s), P(len, 0, s), P(len, 1, s), P(0, 1, s)], C.g);
        face([P(len, 0, 0), P(len, 1, 0), P(len, 1, s), P(len, 0, s)], C.card);
        face([P(0, 0, 0), P(len, 0, 0), P(len, 0, s), P(0, 0, s)], C.card);
        const nvis = Math.round(12 + (Math.log10(S.N) - 14) / 5 * 58);
        const sp = I > 0 ? clamp(Math.log10(I / 1e-7) * .12, .02, .9) : 0;
        st.ps.forEach((q, i) => {
          q.u -= sp * dt; if (q.u < 0) q.u += 1; if (i >= nvis) return;
          const pt = P(q.u * (len - 12) + 6, q.v * .8 + .1, q.w * (s - 12) + 6); dot(ctx, pt[0], pt[1], 3.4, C.c2);
        });
        ln(ctx, x0 - 24, y0 - s / 2 - 2, x0, y0 - s / 2 - 2, C.main, 3);
        ln(ctx, x0 + len + dx, y0 - s / 2 - dy / 2 - 2, x0 + len + dx + 26, y0 - s / 2 - dy / 2 - 2, C.main, 3);
        txt(ctx, 'L', x0 + len / 2, y0 + 16, C.mut, 12, 'center', 700);
        txt(ctx, 'R = ' + fmtR(R), 14, 18, C.main, 16, 'left', 700); txt(ctx, 'I = ' + (I >= 1e-3 ? (I * 1e3).toPrecision(3) + ' mA' : I >= 1e-6 ? (I * 1e6).toPrecision(3) + ' µA' : (I * 1e9).toPrecision(3) + ' nA'), W - 14, 18, C.ink, 14, 'right', 700);
        txt(ctx, 'ρ = ' + sci(rho(S.N, 'n'), 2) + ' Ω·cm', 14, H - 12, C.mut, 12, 'left', 600);
      } },
  ]
});

/* ==========================================================================
   TAB 4 — BÃO HÒA VẬN TỐC
   ========================================================================== */
const SAT = { e: { mu: 1350, vs: 1e7, n: 2 }, h: { mu: 480, vs: 8e6, n: 1 } };
LABS.push({
  id: 'sat', name: 'Bão hòa', sec: 4,
  S: { E: 3e3, m: 'e', n: 2, L: 1 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [
    { title: 'Hạt tải nóng phát phonon quang', area: 'a', anim: true,
      ctrls: [{ k: 'E', l: 'E', min: 2, max: 6, step: .05, log: 1, f: v => sci(v, 0) + ' V/cm' }, { k: 'm', seg: [['e', 'Electron'], ['h', 'Lỗ trống']], set: { e: { n: 2 }, h: { n: 1 } } }, { k: 'n', l: 'n', min: 1, max: 4, step: .5, f: v => v }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, en = (Math.log10(S.E) - 2) / 4, a = 20 + 1500 * Math.pow(en, 2.2), vth = 150, lanes = 5;
        if (!st.ps || st.W !== W) { st.W = W; st.vm = 0; st.fl = []; st.ps = Array.from({ length: lanes }, (_, i) => ({ x: rnd(0, W), y: (i + .5) * (H - 34) / lanes + 4, v: 0 })); }
        const h = (H - 34) / lanes;
        st.ps.forEach((q, i) => {
          if (Math.random() < dt * 3.2) q.v = Math.abs(gauss()) * 12;
          q.v += a * dt; if (q.v > vth) { q.v = vth * .18; st.fl.push({ x: q.x, y: q.y, a: 1 }); }
          q.x += q.v * dt; if (q.x > W) q.x -= W;
          for (let k = 0; k < 14; k++) dot(ctx, (k + .5) * W / 14, q.y + h * .42, 2.4, C.g);
          const g = clamp(q.v / vth, 0, 1); dot(ctx, q.x, q.y, 6 + 2 * g, `rgb(${Math.round(226 * g + 127 * (1 - g))},${Math.round(183 * g + 194 * (1 - g))},${Math.round(20 * g + 155 * (1 - g))})`);
        });
        const vm = st.ps.reduce((s, q) => s + q.v, 0) / lanes; st.vm += (vm - st.vm) * Math.min(1, dt * 1.5);
        st.fl = st.fl.filter(f => (f.a -= dt * 2) > 0); st.fl.forEach(f => { ctx.beginPath(); ctx.arc(f.x, f.y, 8 + (1 - f.a) * 24, 0, TAU2); ctx.strokeStyle = C.c4; ctx.globalAlpha = f.a; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; });
        const by = H - 22, bw = W - 28; rr(ctx, 14, by, bw, 10, 5); ctx.fillStyle = C.tint; ctx.fill();
        rr(ctx, 14, by, Math.max(6, bw * clamp(st.vm / vth, 0, 1)), 10, 5); ctx.fillStyle = C.main; ctx.fill();
        txt(ctx, 'v_d', 14, by - 8, C.mut, 11, 'left', 700); txt(ctx, 'v_sat', 14 + bw, by - 8, C.c3, 11, 'right', 700);
        txt(ctx, 'phonon quang', W - 14, 14, C.c4, 11.5, 'right', 700);
      } },
  ]
});

/* ==========================================================================
   TAB 5 — KHUẾCH TÁN
   ========================================================================== */
LABS.push({
  id: 'diff', name: 'Khuếch tán', sec: 5,
  S: { D: 1.2, g: .6, E: 0 },
  cols: '1.5fr 1fr', rows: '1.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Hạt tải loang từ nơi đông sang nơi thưa', area: 'a', anim: true,
      ctrls: [{ k: 'D', l: 'D', min: .3, max: 3, step: .1, f: v => v.toFixed(1) }, { btn: 'Chạy lại', fn: p => { p.st.ps = null; } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, N = 320, bx = 14, bw = W - 28, hy = H * .56, hh = H * .36;
        if (!st.ps) { st.ps = Array.from({ length: N }, () => ({ x: .1 + Math.abs(gauss()) * .02, y: Math.random() })); st.t0 = t; }
        if (t - st.t0 > 16) st.ps = null; if (!st.ps) return;
        const sd = Math.sqrt(2 * S.D * 0.004 * dt);
        st.ps.forEach(q => { q.x += gauss() * sd; q.y = clamp(q.y + gauss() * .04 * dt * 6, 0, 1); if (q.x < 0) q.x = -q.x; if (q.x > 1) q.x = 2 - q.x; });
        rr(ctx, bx, 14, bw, H - 28, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        st.ps.forEach(q => dot(ctx, bx + q.x * bw, 20 + q.y * (H - 40), 3.2, C.c4));
      } },
    { title: 'Trôi + khuếch tán: hai dòng có thể triệt tiêu', area: 'c',
      ctrls: [{ k: 'E', l: 'E', min: -1, max: 1, step: .05, f: v => v.toFixed(2) }, { k: 'g', l: 'dốc n', min: -1, max: 1, step: .05, f: v => v.toFixed(2) }],
      draw(p, ctx, W, H) {
        const S = p.S, jd = .8 * S.E, jf = S.D * S.g * .8 * -1 * -1, jt = jd + (-jf * -1) * 0;
        const Jf = -S.D * S.g * .8, Jt = jd + Jf, mid = W / 2, sc = (W / 2 - 24) / 2.6, bh = 20;
        [['J trôi', jd, C.c1], ['J khuếch tán', Jf, C.c3], ['J tổng', Jt, C.main]].forEach((r, i) => {
          const y = 16 + i * (H - 32) / 3 + 6;
          txt(ctx, r[0], 10, y - 4, C.mut, 11.5, 'left', 700);
          ctx.fillStyle = r[2]; const w = r[1] * sc; ctx.fillRect(Math.min(mid, mid + w), y + 4, Math.abs(w), bh);
        });
        ln(ctx, mid, 14, mid, H - 12, C.sub, 1.4);
        if (Math.abs(Jt) < .03) txt(ctx, 'cân bằng: J tổng = 0', W - 12, 14, C.c2, 12.5, 'right', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 6 — HỆ THỨC EINSTEIN
   ========================================================================== */
const MAT = [['Si e', 1350, 35, 'c2'], ['Si h', 480, 12.4, 'c4'], ['GaAs e', 8500, 220, 'c5'], ['GaAs h', 400, 10.4, 'c3'], ['Ge e', 3900, 101, 'c1'], ['Ge h', 1900, 49.2, 'c2']];
LABS.push({
  id: 'einstein', name: 'Einstein', sec: 6,
  S: { T: 300, mu: 1350 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [
    { title: 'Nhanh trôi thì cũng nhanh loang', area: 'a', anim: true,
      ctrls: [{ k: 'T', l: 'T', min: 100, max: 600, step: 10, f: v => v + ' K' }, { k: 'mu', l: 'μ', min: 2, max: 4, step: .05, log: 1, f: v => Math.round(v) }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, k = S.mu / 1350, Dn = k * (S.T / 300);
        if (!st.ps) { st.ps = Array.from({ length: 150 }, () => ({ x: W * .12, y: Math.random() })); st.t0 = t; }
        if (t - st.t0 > 7) { st.ps = null; return; }
        const v = clamp(k, .02, 6) * 26, sd = Math.sqrt(2 * Dn * 420 * dt);
        st.ps.forEach(q => { q.x += v * dt + gauss() * sd; q.y = clamp(q.y + gauss() * .03, 0, 1); });
        ln(ctx, 12, H - 30, W - 12, H - 30, C.sub, 1.4);
        const ty = 16, th = H - 70; st.ps.forEach(q => dot(ctx, clamp(q.x, 8, W - 8), ty + q.y * th, 3, C.c2));
        txt(ctx, 'μ = ' + Math.round(S.mu) + '   D = ' + (S.mu * VT(S.T)).toFixed(1), 12, H - 12, C.ink, 12.5, 'left', 700);
        txt(ctx, 'D/μ = ' + (VT(S.T) * 1000).toFixed(1) + ' mV', W - 12, H - 12, C.main, 12.5, 'right', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 7 — PHA TẠP KHÔNG ĐỀU
   ========================================================================== */
LABS.push({
  id: 'graded', name: 'Pha tạp', sec: 7,
  S: { a: .3, T: 300, on: 1 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [
    { title: 'Cân bằng: khuếch tán đẩy ra, điện trường kéo về', area: 'a', anim: true,
      ctrls: [{ k: 'a', l: 'độ dốc', min: .1, max: .5, step: .01, f: v => v.toFixed(2) }, { k: 'T', l: 'T', min: 200, max: 500, step: 10, f: v => v + ' K' }, { k: 'on', seg: [[1, 'Có điện trường'], [0, 'Tắt điện trường']] }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, N = 260, bx = 14, bw = W - 28, bh = H - 70, by = 40;
        const Dn = .02 * S.T / 300, a = S.a;
        if (!st.ps) st.ps = Array.from({ length: N }, () => { let x; do { x = -a * Math.log(1 - Math.random() * (1 - Math.exp(-1 / a))); } while (!(x >= 0 && x <= 1)); return { x, y: Math.random() }; });
        const steps = 4, h = dt / steps;
        for (let s = 0; s < steps; s++) st.ps.forEach(q => { q.x += (S.on ? -Dn / a : 0) * h + Math.sqrt(2 * Dn * h) * gauss(); if (q.x < 0) q.x = -q.x; if (q.x > 1) q.x = 2 - q.x; if (q.x < 0) q.x = 0; q.y = clamp(q.y + gauss() * .02, 0, 1); });
        rr(ctx, bx, by, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        st.ps.forEach(q => dot(ctx, bx + q.x * bw, by + 6 + q.y * (bh - 12), 3.2, C.c2));
        const L = 70;
        arr(ctx, bx + 12, 18, bx + 12 + L, 18, C.c3, 3.5); txt(ctx, 'khuếch tán', bx + 18 + L, 18, C.c3, 12, 'left', 700);
        if (S.on) { arr(ctx, W - 20, 18, W - 20 - L, 18, C.c5, 3.5); txt(ctx, 'trôi', W - 26 - L, 18, C.c5, 12, 'right', 700); }
      } }
  ]
});

/* ==========================================================================
   TAB 8 — HIỆU ỨNG HALL
   ========================================================================== */
LABS.push({
  id: 'hall', name: 'Hall', sec: 8,
  S: { B: .2, I: 1, N: 1e16, d: 5, type: 'p' },
  VH() { const S = this.S; return 1e3 * (S.type === 'p' ? 1 : -1) * S.I * 1e-3 * S.B / (Q * S.N * 1e6 * S.d * 1e-6); },
  cols: '1.7fr 1fr', rows: '1.3fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Thí nghiệm Hall tự chạy', area: 'a', host: true,
      mount(p, box) {
        box.className += ' lb-hall';
        box.innerHTML = '<canvas></canvas><div class="hall-cap">…</div><div class="hall-chips">' + Array.from({ length: 10 }, (_, i) => '<span class="hall-chip">' + (i + 1) + '</span>').join('') + '</div>';
        initHallSim(box);
      } },
    { title: 'Mặt cắt thanh: điện tích dồn về một mặt', area: 'c', anim: true,
      ctrls: [{ k: 'B', l: 'B', min: 0, max: .5, step: .01, f: v => v.toFixed(2) + ' T' }, { k: 'I', l: 'I', min: .1, max: 5, step: .1, f: v => v.toFixed(1) + ' mA' }, { k: 'N', l: 'n', min: 14, max: 18, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }, { k: 'd', l: 'd', min: 1, max: 50, step: 1, f: v => v + ' µm' }, { k: 'type', seg: [['p', 'Loại P'], ['n', 'Loại N']] }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, VH = p.tab.VH(), pos = VH > 0, col = pos ? C.c4 : C.c2, k = clamp(Math.abs(VH) / 60, .05, 1);
        const bx = 28, bw = W - 56, bh = Math.min(H * .46, 90), by = H / 2 - bh / 2 + 6;
        rr(ctx, bx, by, bw, bh, 6); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.4; ctx.stroke();
        arr(ctx, bx + 6, by - 12, bx + 66, by - 12, C.main, 3); txt(ctx, 'I', bx + 74, by - 12, C.main, 13, 'left', 700);
        const n = Math.round(2 + k * 10);
        for (let i = 0; i < n; i++) { const x = bx + 10 + (i + .5) * (bw - 20) / n; txt(ctx, pos ? '+' : '−', x, by + bh - 8, col, 15, 'center', 800); txt(ctx, pos ? '−' : '+', x, by + 9, pos ? C.c2 : C.c4, 15, 'center', 800); }
        const cx = W / 2 + 40; ctx.beginPath(); ctx.arc(cx, by + bh / 2, 9, 0, TAU2); ctx.strokeStyle = C.c3; ctx.lineWidth = 2; ctx.stroke(); dot(ctx, cx, by + bh / 2, 2.5, C.c3); txt(ctx, 'B', cx + 16, by + bh / 2, C.c3, 13, 'left', 700);
        const ex = W / 2 - 50; arr(ctx, ex, by + bh / 2 + (pos ? 26 : -26), ex, by + bh / 2 - (pos ? 26 : -26), C.main, 3); txt(ctx, 'E_H', ex + 8, by + bh / 2, C.main, 12.5, 'left', 700);
        txt(ctx, 'V_H = ' + (VH >= 0 ? '+' : '−') + Math.abs(VH).toFixed(1) + ' mV', W / 2, 16, col, 15, 'center', 700);
        txt(ctx, 'R_H = ' + (pos ? '+' : '−') + sci(1 / (Q * S.N), 2) + ' cm³/C', W / 2, H - 14, C.mut, 12, 'center', 600);
      } }
  ]
});

/* ==========================================================================
   NHẬT KÝ GIẢI THÍCH (thay cho biểu đồ): intro = nguyên lý/cơ chế, react = phản hồi khi kéo thanh trượt
   Loại dòng: i = nguyên lý · w = cơ chế · v = số liệu
   ========================================================================== */
const LD = {};
const pw = v => p10(Math.round(Math.log10(v)));
LD.drift = {
  intro: [
    ['i', 'Hạt tải luôn chuyển động nhiệt hỗn loạn, hướng nào cũng như nhau, nên dòng trung bình bằng 0.'],
    ['i', 'Đặt điện trường E: mỗi hạt bị đẩy nhẹ về một phía. Giữa hai va chạm nó được tăng tốc, va chạm xong lại mất đà.'],
    ['w', 'Kết quả là cả đám trôi chậm theo một hướng: vận tốc trôi v_d = μE. Hạt viền vàng có vệt là hạt được theo dõi.'],
    ['w', 'Electron (−) trôi ngược chiều E, lỗ trống (+) trôi cùng chiều E. Nhưng dòng điện của cả hai đều cùng chiều E.'],
    ['v', 'Kéo thanh E, đổi loại hạt, hoặc chỉnh n, p để xem số liệu.']
  ],
  react(S, k, P, say) {
    const mu = S.type === 'n' ? 1350 : 480, nm = S.type === 'n' ? 'electron' : 'lỗ trống';
    if (k === 'E') say('v', `E = ${S.E} V/cm → v_d = ${sci(mu * S.E)} cm/s (${nm}, μ = ${mu}).` + (P.E && S.E && Math.abs(S.E / P.E - 2) < .05 ? ' E gấp đôi thì v_d gấp đôi: quan hệ tuyến tính.' : ''));
    else if (k === 'type') say('w', `Đổi sang ${nm}: μ = ${mu} cm²/V·s. Electron nhẹ hơn nên linh động gấp ~2,8 lần lỗ trống, và trôi ngược hướng.`);
    else { const jn = Q * S.N * 1350 * S.E, jp = Q * S.P * 480 * S.E, f = jn / ((jn + jp) || 1);
      say('v', `n = ${pw(S.N)}, p = ${pw(S.P)} → J = ${sci(jn + jp, 2)} A/cm², electron chiếm ${Math.round(f * 100)}%.`);
      say('w', 'Dòng trôi tổng = cộng hai loại hạt: J = q(nμₙ + pμₚ)E. Bán dẫn loại N: n ≫ p nên gần như chỉ electron tải điện.'); }
  }
};
LD.mobility = {
  intro: [
    ['i', 'Độ linh động μ = eτ/m*. τ là thời gian tự do giữa hai va chạm: càng bị cản, τ càng ngắn, μ càng nhỏ.'],
    ['w', 'Vòng vàng nhấp nháy = một lần va chạm. Chấm xám: nguyên tử mạng đang rung. Chấm hồng +: tạp chất ion hóa.'],
    ['w', 'Hai kẻ cản đường cộng nghịch đảo (Matthiessen): 1/μ = 1/μ_L + 1/μ_I. Kẻ cản mạnh hơn quyết định μ.'],
    ['w', 'Nhiệt độ cao: mạng rung mạnh, μ_L giảm (∝ T^−3/2). Nhiệt độ thấp: hạt chậm nên bị tạp chất bẻ hướng mạnh, μ_I giảm.'],
    ['v', 'Kéo T và N để xem kẻ cản nào chiếm ưu thế.']
  ],
  react(S, k, P, say) {
    const L = muL(S.T), I = muI(S.T, S.N), m = muT(S.T, S.N);
    say('v', `T = ${S.T} K, N = ${pw(S.N)}: μ_L = ${Math.round(L)}, μ_I = ${I > 1e5 ? '> 10⁵' : Math.round(I)}, μ = ${Math.round(m)}.`);
    say('w', L < I ? 'Mạng rung là kẻ cản chính (va chạm phonon nhiều).' : 'Tạp chất là kẻ cản chính (hạt bị ion lệch hướng nhiều).');
    if (k === 'N') say('i', `Pha tạp nặng làm μ tụt dần từ μ_max ≈ 1350 về μ_min ≈ 92 (Caughey–Thomas): μ(N) ≈ ${Math.round(ct(S.N, 'n'))} cho electron.`);
  }
};
LD.resist = {
  intro: [
    ['i', 'Từ vật liệu ra linh kiện: σ = qnμ (độ dẫn), ρ = 1/σ (điện trở suất), R = ρL/A.'],
    ['w', 'Thanh dài hơn: đường đi dài hơn nên R tăng. Tiết diện lớn hơn: nhiều "làn xe" song song nên R giảm.'],
    ['w', 'Chấm xanh là electron: nhiều hơn khi pha tạp nặng, chạy nhanh hơn khi dòng I lớn.'],
    ['w', 'Pha tạp làm n tăng rất mạnh nên ρ giảm mạnh, dù μ giảm nhẹ. Đó là lý do pha tạp biến bán dẫn thành vật dẫn.'],
    ['v', 'Kéo N, L, A, V và đọc R, I ở góc hình.']
  ],
  react(S, k, P, say) {
    const rh = rho(S.N, 'n'), R = rh * S.L * 1e4 / S.A, I = S.V / R;
    if (k === 'N') say('v', `N = ${pw(S.N)} → ρ = ${sci(rh, 2)} Ω·cm (μ = ${Math.round(ct(S.N, 'n'))}).`);
    else if (k === 'L') say('v', `L = ${S.L} µm → R = ${fmtR(R)}. R tỉ lệ thuận với L.`);
    else if (k === 'A') say('v', `A = ${S.A} µm² → R = ${fmtR(R)}. R tỉ lệ nghịch với A.`);
    else say('v', `V = ${S.V.toFixed(1)} V → I = V/R = ${sci(I, 2)} A (định luật Ohm, R không đổi).`);
  }
};
LD.sat = {
  intro: [
    ['i', 'E nhỏ: v_d = μE tăng đều theo E. E rất lớn: v_d không tăng nữa, chạm trần v_sat ≈ 10⁷ cm/s (Si).'],
    ['w', 'Cơ chế: hạt được tăng tốc đến năng lượng đủ lớn (đổi màu vàng) thì phát ra phonon quang (vòng đỏ) và mất đà ngay.'],
    ['w', 'Thanh dưới cùng là v_d trung bình, so với trần v_sat.'],
    ['i', 'Hệ quả: tăng điện áp không tăng thêm dòng. μ(E) = v_d/E giảm theo 1/E.'],
    ['i', 'Transistor kênh ngắn (dưới ~1 µm) có E rất lớn nên dòng gần như tuyến tính theo V_GS thay vì bậc hai.']
  ],
  react(S, k, P, say) {
    const M = SAT[S.m], v = vdE(S.E, M.mu, M.vs, S.n), f = v / M.vs;
    if (k === 'E') { say('v', `E = ${sci(S.E, 0)} V/cm → v_d = ${sci(v)} cm/s = ${Math.round(f * 100)}% v_sat, μ(E) = ${Math.round(v / S.E)}.`);
      say('w', f < .3 ? 'Vùng tuyến tính (Ohm): hạt ít khi đủ năng lượng để phát phonon.' : f < .85 ? 'Vùng chuyển tiếp: v_d bắt đầu uốn cong.' : 'Vùng bão hòa: mỗi lần hạt lấy thêm năng lượng lại bị phonon quang lấy đi.'); }
    else if (k === 'm') say('w', `${S.m === 'e' ? 'Electron' : 'Lỗ trống'} Si: μ₀ = ${M.mu}, v_sat = ${sci(M.vs, 0)} cm/s. Lỗ trống nặng hơn nên μ thấp và bão hòa sớm hơn.`);
    else say('w', `n = ${S.n}: số mũ làm khớp, n càng lớn thì chỗ uốn từ tuyến tính sang bão hòa càng gắt.`);
  }
};
LD.diff = {
  intro: [
    ['i', 'Khuếch tán không cần điện trường, chỉ cần nồng độ không đều.'],
    ['w', 'Mỗi hạt đi ngẫu nhiên, không "biết" nên đi đâu. Nhưng chỗ đông có nhiều hạt đi ra hơn số đi vào, nên cả đám loang từ nơi đông sang nơi thưa.'],
    ['w', 'Giống giọt mực trong cốc nước: loang ra rồi dần đều.'],
    ['i', 'J = qD·dn/dx: dốc nồng độ càng gắt, dòng càng lớn. D lớn thì loang nhanh.'],
    ['i', 'Khi có cả điện trường và dốc nồng độ, hai dòng cộng lại. Ở thanh dưới, chúng có thể triệt tiêu: J tổng = 0.']
  ],
  react(S, k, P, say) {
    if (k === 'D') say('v', `D = ${S.D.toFixed(1)}: ${S.D > P.D ? 'hạt loang nhanh hơn' : 'hạt loang chậm hơn'} (D = v_nhiệt · quãng đường tự do).`);
    else if (k === 'g') say('v', `Dốc nồng độ = ${S.g.toFixed(2)} → J khuếch tán ${(-S.D * S.g * .8).toFixed(2)} (đơn vị tương đối). Dốc đổi dấu thì dòng đổi chiều.`);
    else say('v', `E = ${S.E.toFixed(2)} → J trôi ${(.8 * S.E).toFixed(2)}.`);
    const jt = .8 * S.E - S.D * S.g * .8;
    say(Math.abs(jt) < .03 ? 'w' : 'v', Math.abs(jt) < .03 ? 'Trôi và khuếch tán triệt tiêu: J tổng = 0, trạng thái cân bằng.' : `J tổng = ${jt.toFixed(2)}.`);
  }
};
LD.einstein = {
  intro: [
    ['i', 'Trôi và khuếch tán là hai mặt của cùng một chuyển động ngẫu nhiên có va chạm, nên chúng liên hệ nhau: D/μ = kT/e.'],
    ['w', 'Hạt trôi nhanh (μ lớn) thì cũng loang nhanh (D lớn), cùng một hệ số kT/e ≈ 25,9 mV ở 300 K.'],
    ['w', 'Đám chấm xanh: tâm dịch sang phải là trôi, độ rộng nở ra là khuếch tán. Tăng μ thì cả hai cùng nhanh hơn.'],
    ['w', 'Nhiệt độ cao: hạt dao động mạnh hơn nên khuếch tán nhanh hơn.'],
    ['i', 'Ý nghĩa: biết μ (đo từ độ dẫn) là suy ra D, không cần đo riêng. Si: μₙ = 1350 → Dₙ = 35 cm²/s.']
  ],
  react(S, k, P, say) {
    say('v', `μ = ${Math.round(S.mu)}, T = ${S.T} K → kT/e = ${(VT(S.T) * 1000).toFixed(1)} mV → D = μ·kT/e = ${(S.mu * VT(S.T)).toFixed(1)} cm²/s.`);
    if (k === 'mu') say('w', 'μ tăng bao nhiêu lần thì D tăng bấy nhiêu lần: D tỉ lệ thuận với μ.'); else say('w', 'T tăng làm kT/e tăng, D tăng theo dù μ giữ nguyên.');
  }
};
LD.graded = {
  intro: [
    ['i', 'Pha tạp không đều (nhiều bên trái, ít bên phải): electron khuếch tán sang phải.'],
    ['w', 'Electron rời đi để lại ion donor dương, nên xuất hiện điện trường nội tại hướng sang phải, kéo electron ngược về trái. Không cần pin ngoài.'],
    ['w', 'Cân bằng: dòng khuếch tán (cam) đúng bằng dòng trôi (xanh), J tổng = 0. Mật độ hạt giữ nguyên dạng giảm dần.'],
    ['i', 'Công thức: E = (kT/e)·(1/N_d)·dN_d/dx. Dải năng lượng bị nghiêng, độ dốc tỉ lệ với E.'],
    ['v', 'Thử "Tắt điện trường" để thấy hạt khuếch tán tự do và san phẳng, rồi bật lại.']
  ],
  react(S, k, P, say) {
    if (k === 'on') say(S.on ? 'w' : 'v', S.on ? 'Điện trường nội tại bật: kéo hạt về lại, profile giảm dần được giữ.' : 'Không có điện trường: chỉ còn khuếch tán, hạt dần phân bố đều.');
    else if (k === 'a') say('v', `Độ dốc a = ${S.a.toFixed(2)}: nồng độ đổi càng gắt (a nhỏ) thì điện trường E = kT/(e·a) càng mạnh.`);
    else say('w', `T = ${S.T} K: khuếch tán nhanh hơn và E ∝ kT cũng mạnh hơn, hai bên vẫn cân bằng.`);
  }
};
LD.hall = {
  intro: [
    ['i', 'Dòng I chạy dọc thanh, từ trường B xuyên qua thanh. Lực Lorentz F = qv×B đẩy hạt tải lệch sang một mặt bên.'],
    ['w', 'Lỗ trống hay electron đều bị đẩy về cùng một mặt (đổi dấu điện tích và đổi chiều chạy triệt tiêu nhau). Khác nhau ở chỗ ai tích tụ.'],
    ['w', 'Điện tích dồn lại tạo điện trường Hall E_H đẩy ngược lực từ. Khi hai lực cân bằng, điện áp V_H ổn định.'],
    ['i', 'Dấu của V_H cho biết loại hạt tải: V_H > 0 là loại P, V_H < 0 là loại N.'],
    ['i', 'Độ lớn V_H = IB/(q·n·d) cho biết nồng độ n, rồi R_H = 1/(q·n).']
  ],
  react(S, k, P, say) {
    const tab = LABS.find(l => l.id === 'hall'), V = tab.VH();
    say('v', `V_H = ${V >= 0 ? '+' : '−'}${Math.abs(V).toFixed(1)} mV → loại ${V >= 0 ? 'P (lỗ trống)' : 'N (electron)'}.`);
    if (k === 'type') say('w', 'Đổi loại hạt tải: cùng lực từ nhưng điện tích tích tụ trái dấu nên V_H đổi dấu.');
    else if (k === 'N') say('w', `n = ${pw(S.N)} → R_H = ${sci(1 / (Q * S.N), 2)} cm³/C. Ít hạt tải hơn thì V_H lớn hơn.`);
    else if (k === 'd') say('w', 'Thanh mỏng hơn (d nhỏ) thì cùng dòng I mật độ hạt dồn nhiều hơn, V_H lớn hơn.');
    else say('w', `V_H tỉ lệ thuận với ${k === 'B' ? 'B' : 'I'}: gấp đôi ${k === 'B' ? 'từ trường' : 'dòng điện'} thì V_H gấp đôi.`);
  }
};
LABS.forEach(l => { l.log = LD[l.id]; });

function initHallSim(host) {
  const cv = host.querySelector('canvas');
  if (!cv) return;
  if (window.__b7HallRAF) { cancelAnimationFrame(window.__b7HallRAF); window.__b7HallRAF = null; }
  const capEl = host.querySelector('.hall-cap');
  const chips = Array.from(host.querySelectorAll('.hall-chip'));
  const ctx = cv.getContext('2d');
  const CW = 800, CH = 480;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = CW * dpr; cv.height = CH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  /* ---------- hình học 3D -> 2D (chiếu xiên) ---------- */
  const L = 330, WD = 120, D = 46;
  const OX = 190, OY = 320;
  const P = (x, y, z) => [OX + x + 0.55 * y, OY - z - 0.30 * y];

  /* ---------- kịch bản tự động (giây) ---------- */
  const CYCLE = 44;
  const STAGES = [
    [0, '1 · Mẫu P, chưa có B: V_H = 0'],
    [4, '2 · Đưa nam châm vào: B xuyên qua thanh'],
    [7, '3 · Lực từ đẩy lỗ trống về mặt trước (+)'],
    [12, '4 · Cân bằng F_E = F_B: V_H > 0 ⇒ loại P'],
    [17, '5 · Rút nam châm: V_H về 0'],
    [20, '6 · Đổi sang mẫu N: electron chạy ngược chiều dòng'],
    [23, '7 · Đưa nam châm vào lại, cùng chiều B'],
    [26, '8 · Electron cũng bị đẩy về mặt trước (−)'],
    [32, '9 · Cân bằng: V_H < 0 ⇒ loại N'],
    [38, '10 · Rút nam châm: lặp lại']
  ];
  const stageOf = t => { let s = 0; for (let i = 0; i < STAGES.length; i++) if (t >= STAGES[i][0]) s = i; return s; };
  const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  function magnetP(t) {
    if (t < 4) return 0;
    if (t < 7) return smooth((t - 4) / 3);
    if (t < 17) return 1;
    if (t < 20) return 1 - smooth((t - 17) / 3);
    if (t < 23) return 0;
    if (t < 26) return smooth((t - 23) / 3);
    if (t < 38) return 1;
    if (t < 41) return 1 - smooth((t - 38) / 3);
    return 0;
  }
  const isN = t => t >= 20;

  /* ---------- hạt tải ---------- */
  const N = 60;
  const TH = 46;          // tốc độ nhiệt (px/s)
  const AE = 280;         // gia tốc do điện trường dọc thanh
  const W0 = 1.6;         // tần số cyclotron khi có nam châm
  const KH = 3.0;         // hệ số đẩy lại của điện trường Hall (trường trung bình)
  const TAU = 0.25;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const ps = [];
  for (let i = 0; i < N; i++) {
    ps.push({ x: rnd(0, L), y: rnd(8, WD - 8), z: rnd(8, D - 8), vx: gauss() * TH, vy: gauss() * TH, tn: rnd(0, TAU * 2), trail: [] });
  }
  let nType = false;        // false = P, true = N
  let ybar = WD / 2, ybarS = WD / 2;
  let vH = 0, needle = 0;
  let sim = 0, lastTs = null, paused = false, lastStage = -1;

  function step(dt, mp) {
    const s = nType ? -1 : 1;
    const dirx = nType ? -1 : 1;
    const om = W0 * mp;
    let sy = 0;
    for (const p of ps) {
      const ax = dirx * AE + s * om * p.vy;
      const ay = -s * om * p.vx - KH * (ybar - WD / 2);
      p.vx += ax * dt; p.vy += ay * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.tn -= dt;
      if (p.tn <= 0) {
        p.vx = gauss() * TH; p.vy = gauss() * TH;
        p.tn = -Math.log(1 - Math.random()) * TAU;
      }
      if (p.y < 4) { p.y = 4; p.vy = Math.abs(p.vy) * 0.4; }
      if (p.y > WD - 4) { p.y = WD - 4; p.vy = -Math.abs(p.vy) * 0.4; }
      if (p.x > L) p.x -= L;
      if (p.x < 0) p.x += L;
      sy += p.y;
    }
    ybar = sy / N;
    const k = 1 - Math.exp(-dt / 0.6);
    ybarS += (ybar - ybarS) * k;
    let shift = WD / 2 - ybarS;
    const dz = 3.5; shift = Math.sign(shift) * Math.max(0, Math.abs(shift) - dz) * (24 / (24 - dz));
    const target = (nType ? -1 : 1) * 0.052 * shift;
    vH += (target - vH) * (1 - Math.exp(-dt / 0.15));
    needle += ((Math.max(-1, Math.min(1, vH / 1.6))) - needle) * (1 - Math.exp(-dt / 0.12));
    const tr = ps[0];
    tr.trail.push(P(tr.x, tr.y, tr.z));
    if (tr.trail.length > 46) tr.trail.shift();
    if (Math.abs(tr.vx) > 0 && tr.trail.length > 1) {
      const a = tr.trail[tr.trail.length - 1], b = tr.trail[tr.trail.length - 2];
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 40) tr.trail.length = 0;
    }
  }

  /* ---------- tiện ích vẽ ---------- */
  function poly(pts, fill, stroke, lw) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.2; ctx.stroke(); }
  }
  function box(x0, x1, y0, y1, z0, z1, cFront, cTop, cRight, label, labelCol) {
    // mặt phải
    poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], cRight, 'rgba(255,255,255,.35)', 1);
    // mặt trên
    poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], cTop, 'rgba(255,255,255,.35)', 1);
    // mặt trước
    poly([P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], cFront, 'rgba(255,255,255,.45)', 1.2);
    if (label) {
      const c = P((x0 + x1) / 2, y0, (z0 + z1) / 2);
      ctx.fillStyle = labelCol || '#fff'; ctx.font = '700 26px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, c[0], c[1] + 1);
    }
  }
  function line(pts, col, lw, dash) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); ctx.setLineDash([]);
  }
  function arrow(x1, y1, x2, y2, col, lw, head) {
    const a = Math.atan2(y2 - y1, x2 - x1); head = head || 9;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45));
    ctx.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45)); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  function text(s, x, y, col, size, weight, align) {
    ctx.fillStyle = col; ctx.font = (weight || 600) + ' ' + (size || 13) + 'px Arial'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }
  function carrier(x, y, r, isHole, ring) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832);
    if (isHole) { ctx.fillStyle = '#ff7fb0'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - r * .5, y); ctx.lineTo(x + r * .5, y); ctx.moveTo(x, y - r * .5); ctx.lineTo(x, y + r * .5); ctx.stroke(); }
    else { ctx.fillStyle = '#5b9bff'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - r * .5, y); ctx.lineTo(x + r * .5, y); ctx.stroke(); }
    if (ring) { ctx.beginPath(); ctx.arc(x, y, r + 4, 0, 6.2832); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.stroke(); }
  }

  /* ---------- dây điện ---------- */
  const pl = P(0, WD / 2, D / 2), pr = P(L, WD / 2, D / 2);
  const cf = P(L / 2, 0, D / 2), cb = P(L / 2, WD, D / 2);
  const wireIn = [[50, 330], [50, pl[1]], [pl[0] - 6, pl[1]]];
  const wireOut = [[pr[0] + 6, pr[1]], [600, pr[1]], [600, 450], [50, 450], [50, 346]];
  const pathPts = wireIn.concat([]);
  function pointsAlong(pts, d) {
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const sl = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (d <= acc + sl) { const u = (d - acc) / sl; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]; }
      acc += sl;
    }
    return pts[pts.length - 1];
  }
  const lenOf = pts => { let a = 0; for (let i = 1; i < pts.length; i++) a += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return a; };
  const lenIn = lenOf(wireIn), lenOut = lenOf(wireOut);

  function draw(t, mp) {
    const stg = stageOf(t);
    // nền
    const g = ctx.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, '#0e1430'); g.addColorStop(1, '#1d2650');
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
    // bóng dưới sàn
    ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(OX + L / 2 + 40, OY + 18, L / 2 + 40, 20, 0, 0, 6.2832); ctx.fill(); ctx.restore();

    const s = nType ? -1 : 1;
    const gapTop = 34 + 130 * (1 - mp);
    const zTb = D + gapTop, zTt = zTb + 50;
    const zBt = -26 - 130 * (1 - mp), zBb = zBt - 50;

    // nam châm dưới (N)
    box(24, L - 24, -10, WD + 10, zBb, zBt, '#d9444f', '#ee6a73', '#a8303a', 'N', '#fff');

    // dây vôn kế phía sau (nối mặt sau)
    ctx.save();
    line([[cb[0], cb[1]], [632, cb[1]], [640, 262]], '#cfd6ee', 2.6);
    ctx.restore();
    circ(cb[0], cb[1], 5, '#cfd6ee', '#fff');

    // mặt sau / trên / phải của thanh bán dẫn (thể tích)
    const gBack = ctx.createLinearGradient(0, OY - D, 0, OY);
    poly([P(0, WD, 0), P(L, WD, 0), P(L, WD, D), P(0, WD, D)], 'rgba(120,140,190,.20)', 'rgba(200,215,255,.45)', 1);
    poly([P(0, 0, D), P(L, 0, D), P(L, WD, D), P(0, WD, D)], 'rgba(170,190,235,.26)', 'rgba(220,230,255,.7)', 1.3);
    poly([P(L, 0, 0), P(L, WD, 0), P(L, WD, D), P(L, 0, D)], 'rgba(100,120,170,.30)', 'rgba(210,222,255,.65)', 1.3);

    // điện tích mặt sau (nhìn xuyên)
    let shift = WD / 2 - ybarS; shift = Math.sign(shift) * Math.max(0, Math.abs(shift) - 3.5) * (24 / 20.5);
    const amt = Math.max(0, Math.min(1, Math.abs(shift) / 24));
    const nSym = Math.round(amt * 8);
    for (let i = 0; i < nSym; i++) {
      const q = P(34 + i * (L - 68) / 7, WD - 1, D * 0.55);
      ctx.globalAlpha = .55; symbol(q[0], q[1], nType ? '+' : '−', nType ? '#ff7fb0' : '#6aa7ff'); ctx.globalAlpha = 1;
    }

    // đường sức từ (xuyên qua thanh)
    if (mp > 0.02) {
      ctx.save(); ctx.globalAlpha = 0.55 * mp;
      for (let ix = 0; ix < 4; ix++) for (let iy = 0; iy < 3; iy++) {
        const x = 55 + ix * 74, y = 22 + iy * 38;
        const a = P(x, y, zBt), b = P(x, y, zTb);
        ctx.setLineDash([5, 5]); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
        const mid = P(x, y, (zBt + zTb) / 2 + 20);
        arrow(mid[0], mid[1] + 8, mid[0], mid[1] - 6, '#ffd166', 1.6, 7);
      }
      ctx.restore();
    }

    // hạt tải (xa -> gần)
    const order = ps.slice().sort((a, b) => b.y - a.y);
    for (const p of order) {
      const q = P(p.x, p.y, p.z);
      if (p === ps[0] && p.trail.length > 2) {
        ctx.beginPath(); ctx.moveTo(p.trail[0][0], p.trail[0][1]);
        for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i][0], p.trail[i][1]);
        ctx.strokeStyle = 'rgba(255,209,102,.85)'; ctx.lineWidth = 1.8; ctx.stroke();
      }
      carrier(q[0], q[1], 5.2, !nType, p === ps[0]);
    }
    // lực từ lên hạt theo dõi
    if (mp > 0.2) {
      const tr = ps[0], q = P(tr.x, tr.y, tr.z);
      const dx = -0.55 * 34 * mp, dy = 0.30 * 34 * mp;     // hướng -y (về phía người xem)
      arrow(q[0], q[1], q[0] + dx, q[1] + dy, '#ffa94d', 3, 9);
      text('F = q·v×B', q[0] + dx - 6, q[1] + dy + 14, '#ffa94d', 12, 700, 'right');
    }

    // mặt trước của thanh (phủ lên hạt)
    const gf = ctx.createLinearGradient(0, OY - D, 0, OY);
    gf.addColorStop(0, 'rgba(190,205,245,.30)'); gf.addColorStop(1, 'rgba(90,105,160,.30)');
    poly([P(0, 0, 0), P(L, 0, 0), P(L, 0, D), P(0, 0, D)], gf, 'rgba(235,242,255,.85)', 1.6);
    // điện cực hai đầu
    poly([P(-7, 0, 0), P(0, 0, 0), P(0, 0, D), P(-7, 0, D)], '#d08a4b', 'rgba(255,255,255,.6)', 1);
    poly([P(L, 0, 0), P(L + 7, 0, 0), P(L + 7, 0, D), P(L, 0, D)], '#d08a4b', 'rgba(255,255,255,.6)', 1);
    text('mẫu bán dẫn ' + (nType ? 'loại N' : 'loại P'), P(L / 2, 0, D * 0.2)[0], P(L / 2, 0, D * 0.2)[1], 'rgba(255,255,255,.85)', 11, 600);

    // điện tích mặt trước
    for (let i = 0; i < nSym; i++) {
      const q = P(34 + i * (L - 68) / 7, 0, D * 0.62);
      symbol(q[0], q[1], nType ? '−' : '+', nType ? '#6aa7ff' : '#ff7fb0', true);
    }
    // điện trường Hall
    if (amt > 0.05) {
      const a = nType ? P(L * 0.62, WD - 10, D / 2) : P(L * 0.62, 10, D / 2);
      const b = nType ? P(L * 0.62, 10, D / 2) : P(L * 0.62, WD - 10, D / 2);
      ctx.save(); ctx.globalAlpha = Math.min(1, amt * 1.2);
      arrow(a[0], a[1], b[0], b[1], '#ffd166', 3.6, 11);
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      text('E_H', m[0] + 18, m[1] - 8, '#ffd166', 13, 700);
      ctx.restore();
    }
    // kích thước
    text('d', P(-14, 0, D / 2)[0] - 4, P(-14, 0, D / 2)[1], 'rgba(255,255,255,.55)', 12, 600);
    text('W', P(L + 8, WD / 2, 0)[0] + 12, P(L + 8, WD / 2, 0)[1] + 4, 'rgba(255,255,255,.55)', 12, 600);

    // nam châm trên (S)
    box(24, L - 24, -10, WD + 10, zTb, zTt, '#3f73d6', '#6a98ec', '#2c56a8', 'S', '#fff');
    if (mp > 0.5) text('B ↑', P(L - 10, WD + 6, zTb + 62)[0] + 18, P(L - 10, WD + 6, zTb + 62)[1], '#ffd166', 14, 700, 'left');

    // pin + dây dòng điện
    line(wireIn, '#ffd166', 3); line(wireOut, '#ffd166', 3);
    ctx.fillStyle = '#d08a4b'; ctx.fillRect(pl[0] - 10, pl[1] - 2, 5, 4); ctx.fillRect(pr[0] + 5, pr[1] - 2, 5, 4);
    // pin
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(30, 330); ctx.lineTo(70, 330); ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(40, 346); ctx.lineTo(60, 346); ctx.stroke();
    text('+', 84, 328, '#ff9aa8', 16, 700); text('−', 84, 348, '#9ec5ff', 18, 700); text('pin', 22, 338, '#aab3d6', 12, 600, 'right');
    // chấm dòng điện quy ước chạy dọc dây
    const sp = 90, gap = 30, tt = (t * sp) % gap;
    for (let d = tt; d < lenIn; d += gap) { const q = pointsAlong(wireIn, d); circ(q[0], q[1], 3, '#fff6c7'); }
    for (let d = tt; d < lenOut; d += gap) { const q = pointsAlong(wireOut, d); circ(q[0], q[1], 3, '#fff6c7'); }
    text('I', 120, pl[1] - 12, '#ffd166', 14, 700);
    arrow(98, pl[1] - 0, 136, pl[1] - 0, 'rgba(255,209,102,.0)', 1, 1);

    // dây vôn kế phía trước (nối mặt trước) có "cầu" bắc qua dây pin
    line([[cf[0], cf[1]], [cf[0], 408], [594, 408]], '#ff6b81', 2.6);
    ctx.beginPath(); ctx.arc(600, 408, 6, Math.PI, 0); ctx.strokeStyle = '#ff6b81'; ctx.lineWidth = 2.6; ctx.stroke();
    line([[606, 408], [630, 408], [630, 300], [640, 300]], '#ff6b81', 2.6);
    circ(cf[0], cf[1], 5, '#ff6b81', '#fff');

    // vôn kế
    const bx = 640, by = 232, bw = 130, bh = 108;
    const gm = ctx.createLinearGradient(0, by, 0, by + bh);
    gm.addColorStop(0, '#2a3366'); gm.addColorStop(1, '#161c40');
    ctx.fillStyle = gm; roundRect(bx, by, bw, bh, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.6; roundRect(bx, by, bw, bh, 10); ctx.stroke();
    // mặt đồng hồ
    ctx.fillStyle = '#f3efe0'; roundRect(bx + 10, by + 24, bw - 20, 64, 8); ctx.fill();
    const pvx = bx + bw / 2 + 4, pvy = by + 84;
    ctx.strokeStyle = '#6b6f86'; ctx.lineWidth = 1.5;
    for (let k = -4; k <= 4; k++) {
      const an = (-90 + k * 14.5) * Math.PI / 180;
      const r1 = 46, r2 = k % 2 === 0 ? 40 : 43;
      ctx.beginPath(); ctx.moveTo(pvx + r1 * Math.cos(an), pvy + r1 * Math.sin(an)); ctx.lineTo(pvx + r2 * Math.cos(an), pvy + r2 * Math.sin(an)); ctx.stroke();
    }
    text('−', pvx - 40, by + 44, '#4a4e66', 13, 700); text('0', pvx, by + 40, '#4a4e66', 11, 700); text('+', pvx + 40, by + 44, '#4a4e66', 13, 700);
    const ang = (-90 + needle * 58) * Math.PI / 180;
    ctx.strokeStyle = '#d6303f'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(pvx, pvy); ctx.lineTo(pvx + 42 * Math.cos(ang), pvy + 42 * Math.sin(ang)); ctx.stroke();
    circ(pvx, pvy, 4.5, '#333', '#999');
    const vs = (vH >= 0 ? '+' : '−') + Math.abs(vH).toFixed(2) + ' mV';
    const colV = Math.abs(vH) < 0.03 ? '#ffffff' : (vH > 0 ? '#ff9ec0' : '#8cb8ff');
    text('V_H = ' + vs, bx + bw / 2, by + 13, colV, 14, 700);
    // cực
    circ(bx, 300, 6, '#ff6b81', '#fff'); circ(bx, 262, 6, '#cfd6ee', '#fff');
    text('+', bx + 14, 300, '#ff9aa8', 14, 700); text('−', bx + 14, 262, '#cfd6ee', 15, 700);
    text('vôn kế', bx + bw / 2, by + bh + 14, '#aab3d6', 12, 600);

    // nhãn mẫu
    ctx.save();
    ctx.fillStyle = nType ? 'rgba(91,155,255,.22)' : 'rgba(255,127,176,.22)';
    roundRect(24, 20, 220, 50, 10); ctx.fill();
    ctx.strokeStyle = nType ? '#5b9bff' : '#ff7fb0'; ctx.lineWidth = 1.6; roundRect(24, 20, 220, 50, 10); ctx.stroke();
    carrier(46, 45, 6.5, !nType, false);
    text(nType ? 'Loại N: electron (−)' : 'Loại P: lỗ trống (+)', 60, 36, '#fff', 14, 700, 'left');
    text(nType ? 'chạy NGƯỢC chiều dòng điện' : 'chạy CÙNG chiều dòng điện', 60, 56, 'rgba(255,255,255,.8)', 12, 600, 'left');
    ctx.restore();
    text('mặt trước (y = 0)', P(L / 2, 0, 0)[0], P(L / 2, 0, 0)[1] + 16, 'rgba(255,255,255,.5)', 11, 600);
    text('mặt sau', P(L * 0.85, WD, 0)[0] + 8, P(L * 0.85, WD, 0)[1] + 12, 'rgba(255,255,255,.4)', 11, 600);

    // phụ đề
    if (stg !== lastStage) {
      lastStage = stg;
      if (capEl) capEl.textContent = STAGES[stg][1];
      chips.forEach((c, i) => c.classList.toggle('on', i === stg));
    }
    if (paused) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, CW, CH); text('Tạm dừng · nhấn để chạy tiếp', CW / 2, CH / 2, '#fff', 20, 700); }
  }
  function circ(x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke(); }
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function symbol(x, y, ch, col, glow) {
    if (glow) { ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.2832); ctx.fillStyle = col; ctx.globalAlpha *= .28; ctx.fill(); ctx.globalAlpha /= .28; }
    text(ch, x, y, col, 20, 800);
  }

  cv.style.cursor = 'pointer';
  cv.onclick = () => { paused = !paused; };

  /* ---------- vòng lặp ---------- */
  function frame(ts) {
    if (!cv.isConnected) { window.__b7HallRAF = null; return; }
    if (lastTs === null) lastTs = ts;
    let dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;
    if (!paused) {
      sim += dt;
      if (sim >= CYCLE) { sim -= CYCLE; }
      const wantN = isN(sim);
      if (wantN !== nType) {
        nType = wantN;
        for (const p of ps) { p.vx = gauss() * TH; p.vy = gauss() * TH; }
        ybarS = ybar = WD / 2 - (WD / 2 - ybarS) * 0; ps.forEach(p => { p.y = rnd(10, WD - 10); });
        ybar = ybarS = WD / 2; ps[0].trail.length = 0;
      }
      step(dt, magnetP(sim));
    }
    draw(sim, magnetP(sim));
    window.__b7HallRAF = requestAnimationFrame(frame);
  }
  window.__b7HallRAF = requestAnimationFrame(frame);
  window.__b7HallDbg = () => ({ t: sim, vH, ybarS });
}


/* ==========================================================================
   KHUNG POPUP
   ========================================================================== */
const CSS = `
#lab{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab[hidden]{display:none}
#lab *{box-sizing:border-box}
.lb-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
.lb-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
.lb-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
.lb-ic{color:var(--main);display:flex}
.lb-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
.lb-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
.lb-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
.lb-tab:hover{color:var(--ink);background:var(--tint)}
.lb-tab.on{background:var(--main);color:var(--bg);font-weight:700}
.lb-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
.lb-x:hover{color:var(--err);background:var(--tint)}
.lb-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
.lb-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
.lb-p.glow{animation:lbglow 1.4s ease-out}
@keyframes lbglow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
.lb-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
.lb-cv{flex:1;min-height:0;position:relative}
.lb-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.lb-c{display:flex;flex-wrap:wrap;gap:6px 14px;padding:4px 10px 8px;flex:none;align-items:center}
.lb-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb-k input[type=range]{width:clamp(70px,8vw,120px);margin:0}
.lb-k output{color:var(--ink);font-weight:700;min-width:3.2em}
.lb-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb-seg button,.lb-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer}
.lb-btn{background:var(--tint)}
.lb-seg button:hover,.lb-btn:hover{color:var(--ink)}
.lb-seg button.on{background:var(--main);color:var(--bg)}
.lb-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
.lb-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lbin .4s ease-out;overflow-wrap:anywhere}
.lb-ln::before{position:absolute;left:0;font-weight:700}
.lb-ln.i{color:var(--ink)}.lb-ln.i::before{content:'›';color:var(--c5)}
.lb-ln.w{color:var(--ink)}.lb-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
.lb-ln.v{color:var(--main)}.lb-ln.v::before{content:'=';color:var(--main)}
@keyframes lbin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lb-hall{display:flex;flex-direction:column;background:#0e1430}
.lb-hall canvas{position:static!important;flex:1;min-height:0;width:100%;height:100%;object-fit:contain}
.lb-hall .hall-cap{padding:6px 12px;font-size:14px;min-height:0;border-top:1px solid rgba(255,255,255,.15);color:#fff;background:#0f1530;flex:none}
.lb-hall .hall-chips{padding:0 12px 8px;flex:none;background:#0f1530;display:flex;gap:6px}
.lb-hall .hall-chip{width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:700 11px Arial;color:#aab3d6;border:1.5px solid rgba(255,255,255,.25);transition:all .25s}
.lb-hall .hall-chip.on{background:#ffd166;color:#1b2147;border-color:#ffd166;transform:scale(1.15)}
.lab-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab-m:hover,.lab-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb-win{width:100vw;height:100dvh;border-radius:0}.lb-b{overflow:auto;display:flex;flex-direction:column}.lb-p{min-height:260px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.200 6.200V2"/><path d="M4.600 10h6.800"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'drift';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 7');
  root.innerHTML = '<div class="lb-win"><div class="lb-h"><span class="lb-ic">' + FLASK + '</span><span class="lb-bd">Phòng thí nghiệm · Buổi 7</span><nav class="lb-tabs"></nav><button class="lb-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb-b'); tabsEl = root.querySelector('.lb-tabs');
  LABS.forEach(l => { const b = document.createElement('button'); b.type = 'button'; b.className = 'lb-tab'; b.dataset.id = l.id; b.textContent = l.sec + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b); });
  root.querySelector('.lb-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) { const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName); if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty && window.LabB7 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden) { e.preventDefault(); open(); } return; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
}

const say = (kind, text) => {
  if (!logEl) return; const d = document.createElement('div'); d.className = 'lb-ln ' + kind; d.textContent = text; logEl.appendChild(d);
  while (logEl.children.length > 60) logEl.removeChild(logEl.firstChild); logEl.scrollTop = logEl.scrollHeight;
};
const rt = {};
function queueReact(tab, k) {
  if (!tab.log || !tab.log.react) return; clearTimeout(rt[k]);
  rt[k] = setTimeout(() => { if (cur !== tab || !logEl) return; const P = tab.prev || {}; tab.log.react(tab.S, k, P, say); tab.prev = Object.assign({}, tab.S); }, 350);
}
function clearTimers() { timers.forEach(clearTimeout); timers = []; Object.keys(rt).forEach(k => clearTimeout(rt[k])); }
function mkCtrl(tab, c, p) {
  const S = tab.S, w = document.createElement('div');
  const touch = () => { curPanels.forEach(q => q.dirty = true); queueReact(tab, c.k); };
  if (c.btn) { w.className = 'lb-btn'; w.textContent = c.btn; w.setAttribute('role', 'button'); w.tabIndex = 0; w.onclick = () => c.fn(p); return w; }
  if (c.seg) {
    w.className = 'lb-seg';
    c.seg.forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.textContent = o[1]; b.className = S[c.k] === o[0] ? 'on' : '';
      b.onclick = () => { S[c.k] = o[0]; if (c.set && c.set[o[0]]) Object.assign(S, c.set[o[0]]); curPanels.forEach(q => q.syncCtrls && q.syncCtrls()); touch(); }; w.appendChild(b); });
    p.syncs.push(() => { [...w.children].forEach((b, i) => b.classList.toggle('on', S[c.k] === c.seg[i][0])); });
    return w;
  }
  w.className = 'lb-k';
  const lab = document.createElement('span'); lab.textContent = c.l; const inp = document.createElement('input'); inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step;
  const out = document.createElement('output'); w.append(lab, inp, out);
  const sync = () => { inp.value = c.log ? Math.log10(S[c.k]) : S[c.k]; out.textContent = c.f(S[c.k]); };
  inp.oninput = () => { S[c.k] = c.log ? Math.pow(10, +inp.value) : +inp.value; out.textContent = c.f(S[c.k]); touch(); };
  inp.setAttribute('aria-label', c.l); p.syncs.push(sync); sync();
  return w;
}

function show(id, panelIdx) {
  const tab = LABS.find(l => l.id === id) || LABS[0]; cur = tab; lastTab = tab.id;
  window.__b7HallRAF && (cancelAnimationFrame(window.__b7HallRAF), window.__b7HallRAF = null);
  clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  [...tabsEl.children].forEach(b => b.classList.toggle('on', b.dataset.id === tab.id));
  const mob = innerWidth <= 900;
  if (!mob) { bodyEl.style.display = 'grid'; bodyEl.style.gridTemplateColumns = tab.cols; bodyEl.style.gridTemplateRows = tab.rows; bodyEl.style.gridTemplateAreas = tab.areas; }
  else { bodyEl.style.display = ''; bodyEl.style.gridTemplate = ''; }
  tab.prev = Object.assign({}, tab.S);
  tab.panels.concat([{ title: 'Nhật ký thí nghiệm', area: 'l', log: true }]).forEach((spec, i) => {
    const el = document.createElement('div'); el.className = 'lb-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb-t"></div><div class="lb-cv">' + (spec.host ? '' : '<canvas></canvas>') + '</div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) { const lg = document.createElement('div'); lg.className = 'lb-log'; lg.setAttribute('aria-live', 'polite'); el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el); curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 250 + j * 900))); return; }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.ctrls && spec.ctrls.length) { const cb = document.createElement('div'); cb.className = 'lb-c'; spec.ctrls.forEach(c => cb.appendChild(mkCtrl(tab, c, p))); el.appendChild(cb); }
    bodyEl.appendChild(el); curPanels.push(p);
    if (spec.host) spec.mount(p, box);
    else new ResizeObserver(() => {
      const r = box.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); p.W = Math.max(10, r.width); p.H = Math.max(10, r.height);
      cv.width = Math.round(p.W * d); cv.height = Math.round(p.H * d); p.ctx.setTransform(d, 0, 0, d, 0, 0); p.dirty = true;
    }).observe(box);
  });
  if (panelIdx != null && curPanels[panelIdx]) { const e = curPanels[panelIdx].el; e.classList.add('glow'); setTimeout(() => e.classList.remove('glow'), 1500); }
}

function loop(ts) {
  if (root.hidden) { raf = 0; return; }
  const dt = Math.min(.04, (ts - last) / 1000); last = ts; tAcc += dt;
  curPanels.forEach(p => {
    if (!p.ctx || !p.W || !(p.spec.anim || p.dirty)) return; p.dirty = false;
    const ctx = p.ctx; ctx.clearRect(0, 0, p.W, p.H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, p.W, p.H);
    ctx.save(); p.spec.draw(p, ctx, p.W, p.H, tAcc, dt); ctx.restore();
  });
  raf = requestAnimationFrame(loop);
}

function open(id, panelIdx) {
  ensureDom(); readColors(); opener = document.activeElement;
  root.hidden = false; show(id || lastTab, panelIdx);
  last = performance.now(); if (!raf) raf = requestAnimationFrame(loop);
  root.querySelector('.lb-x').focus({ preventScroll: true });
  const b = document.getElementById('tb-lab'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
}
function close() {
  if (!root || root.hidden) return;
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  window.__b7HallRAF && (cancelAnimationFrame(window.__b7HallRAF), window.__b7HallRAF = null);
  const b = document.getElementById('tb-lab'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- dấu hiệu tinh tế trong bài: biểu tượng bình thí nghiệm nhỏ cạnh tiêu đề ---------- */
const H3MAP = [[/^2\.5/, 'mobility', 1], [/^2\.6/, 'mobility', 2], [/^3\.2/, 'resist', 1], [/^3\.3/, 'resist', 0], [/^3\.5/, 'resist', 3],
  [/^4\.3/, 'sat', 0], [/^4\.4/, 'sat', 1], [/^4\.2/, 'sat', 2], [/^4\.5/, 'sat', 3], [/^5\.3/, 'diff', 1], [/^5\.4/, 'diff', 2],
  [/^6\.1/, 'einstein', 0], [/^7\.3/, 'graded', 1], [/^8\.1/, 'hall', 0], [/^8\.4/, 'hall', 1]];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab-m')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-m'; b.innerHTML = FLASK;
  b.setAttribute('aria-label', 'Xem thí nghiệm: ' + title); b.title = 'Xem thí nghiệm';
  b.onclick = e => { e.preventDefault(); e.stopPropagation(); open(id, pi); }; h.appendChild(b);
}
function markLesson(rootEl) {
  if (!rootEl) return;
  rootEl.querySelectorAll('h2').forEach(h => { const m = /^\s*(\d)\./.exec(h.textContent); if (!m) return; const l = LABS.find(x => x.sec === +m[1]); if (l) addMark(h, l.id, null, l.name); });
  rootEl.querySelectorAll('h3').forEach(h => { const t = h.textContent.trim(); const r = H3MAP.find(x => x[0].test(t)); if (r) addMark(h, r[1], r[2], t); });
}

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 7') markLesson(document.getElementById('app-content'));
window.LabB7 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
