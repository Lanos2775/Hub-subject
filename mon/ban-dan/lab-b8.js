/* ==========================================================================
   lab-b8.js — PHÒNG THÍ NGHIỆM BUỔI 8 (popup 95% màn hình)
   - Tự chứa, cùng khung với lab-b7.js. 7 tab ứng với các mục của Buổi 8.
   - API: LabB8.open(tabId?, panelIndex?)  LabB8.close()  LabB8.mark(root)
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
function gauge(ctx, cx, cy, r, title, valText, frac, col, ghost) {
  txt(ctx, title, cx, cy - r - 12, C.mut, 11.5, 'center', 700);
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 1.12, Math.PI * 1.88); ctx.strokeStyle = C.g; ctx.lineWidth = 5; ctx.stroke();
  const ang = f => Math.PI * (1.12 + .76 * clamp(f, 0, 1));
  if (ghost != null) { const a = ang(ghost); ln(ctx, cx, cy, cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2), C.main, 1.6, [3, 3]); }
  const a = ang(frac); arr(ctx, cx, cy, cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4), col || C.main, 2.4);
  dot(ctx, cx, cy, 3.5, col || C.main);
  txt(ctx, valText, cx, cy + 16, col || C.main, 12, 'center', 700);
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
   TAB 1 — SINH & TÁI HỢP (Mục 1–2)
   ========================================================================== */
const N0P = 7, KREC = .6;
LABS.push({
  id: 'gr', name: 'Sinh – tái hợp', no: '1–2', secs: [1, 2],
  S: { I: 0 },
  cols: '1.5fr 1fr', rows: '2.4fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Cặp electron – lỗ trống sinh ra và biến mất', area: 'a', anim: true,
      ctrls: [{ k: 'I', l: 'Ánh sáng', min: 0, max: 1, step: .05, f: v => v ? Math.round(v * 100) + '%' : 'Tắt' }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, M = p.tab.M, cbH = H * .3, vbY = H * .68, vbH = H * .3, mx = 14;
        const mk = (rise) => ({ ex: rnd(.04, .96), ey: rnd(.1, .9), hx: rnd(.04, .96), hy: rnd(.1, .9), fall: 0, rise: rise ? .01 : 0, lit: 0 });
        if (!M.pairs) { M.pairs = Array.from({ length: N0P }, () => mk(0)); M.fl = []; M.ev = []; M.G = 4; M.R = 4; M.t = 0; }
        M.t += dt;
        const Gl = 18 * S.I, Gt = KREC * N0P;
        let g = (Gt + Gl) * dt; while (g > 0) { if (Math.random() < Math.min(1, g)) { const q = mk(1); q.lit = Math.random() < Gl / (Gt + Gl) ? 1 : 0; M.pairs.push(q); M.ev.push([M.t, 'g']); } g -= 1; }
        M.pairs.forEach(q => {
          if (!q.fall && !q.rise && Math.random() < KREC * dt) { q.fall = .01; }
          if (q.rise) { q.rise += dt * 2.2; if (q.rise >= 1) q.rise = 0; }
          else if (!q.fall) { q.ex = clamp(q.ex + gauss() * dt * .12, .03, .97); q.ey = clamp(q.ey + gauss() * dt * .3, .05, .95); q.hx = clamp(q.hx + gauss() * dt * .12, .03, .97); q.hy = clamp(q.hy + gauss() * dt * .3, .05, .95); }
          if (q.fall) { q.fall += dt * 2.2; if (q.fall >= 1) { q.dead = 1; M.fl.push({ x: q.hx, y: q.hy, a: 1 }); M.ev.push([M.t, 'r']); } }
        });
        M.pairs = M.pairs.filter(q => !q.dead);
        M.ev = M.ev.filter(e => e[0] > M.t - 3);
        const cg = M.ev.filter(e => e[1] === 'g').length / 3, cr = M.ev.filter(e => e[1] === 'r').length / 3;
        M.G += (cg - M.G) * .1; M.R += (cr - M.R) * .1; M.N = M.pairs.length;
        const bw = W - 2 * mx;
        rr(ctx, mx, 10, bw, cbH, 8); ctx.fillStyle = C.tint; ctx.fill();
        rr(ctx, mx, vbY, bw, vbH, 8); ctx.fillStyle = C.tint; ctx.fill();
        txt(ctx, 'Vùng dẫn', mx + 10, 22, C.mut, 11.5, 'left', 700); txt(ctx, 'Vùng hóa trị', mx + 10, vbY + vbH - 12, C.mut, 11.5, 'left', 700);
        txt(ctx, 'Vùng cấm', W / 2, H * .5, C.sub, 12, 'center', 700);
        if (S.I > 0) for (let i = 0; i < Math.ceil(S.I * 5); i++) { const x = W * (.15 + i * .17), y0 = 2 + ((t * 40 + i * 25) % 30); arr(ctx, x, y0, x + 10, y0 + 18, C.main, 2.5); }
        const ePos = q => { const X = mx + q.ex * bw, Y = 10 + q.ey * cbH; return [X, Y]; }, hPos = q => [mx + q.hx * bw, vbY + q.hy * vbH];
        M.pairs.forEach(q => {
          const h = hPos(q); let e = ePos(q);
          if (q.fall) { const f = q.fall; e = [e[0] + (h[0] - e[0]) * f, e[1] + (h[1] - e[1]) * f]; ln(ctx, e[0], e[1], h[0], h[1], C.main, 1.2, [3, 3]); }
          if (q.rise) { const f = q.rise, s = [h[0], h[1]]; e = [s[0] + (e[0] - s[0]) * f, s[1] + (e[1] - s[1]) * f]; if (q.lit) { ctx.globalAlpha = 1 - f; ctx.beginPath(); ctx.arc(h[0], h[1], 8 + 14 * f, 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; } }
          dot(ctx, e[0], e[1], 6, C.c2); txt(ctx, '−', e[0], e[1] + .5, C.bg, 11, 'center', 800);
          dot(ctx, h[0], h[1], 6, C.c4); txt(ctx, '+', h[0], h[1] + .5, C.bg, 11, 'center', 800);
        });
        M.fl = M.fl.filter(f => (f.a -= dt * 2) > 0);
        M.fl.forEach(f => { const x = mx + f.x * bw, y = vbY + f.y * vbH; ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(x, y, 6 + (1 - f.a) * 18, 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 2.5; ctx.stroke(); ctx.globalAlpha = 1; });
      } },
    { title: 'Ba đồng hồ kim: sinh G, tái hợp R, tích n·p', area: 'c',
      anim: true,
      draw(p, ctx, W, H) {
        const M = p.tab.M; if (M.G == null) return;
        const r = Math.min(W / 7, H * .34, 46), cy = H * .52, ratio = Math.pow(M.N / N0P, 2), eq = Math.abs(M.G - M.R) < 2;
        gauge(ctx, W * .17, cy, r, 'Sinh G', M.G.toFixed(1) + '/s', M.G / 22, C.c1);
        gauge(ctx, W * .50, cy, r, 'Tái hợp R', M.R.toFixed(1) + '/s', M.R / 22, C.c3);
        gauge(ctx, W * .83, cy, r, 'n·p ÷ nᵢ²', ratio.toFixed(1), clamp(Math.log10(Math.max(1, ratio)) / 2, 0, 1), eq ? C.c2 : C.main);
        if (eq) txt(ctx, 'G ≈ R: cân bằng', W / 2, H - 14, C.c2, 12.5, 'center', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 2 — TÁI HỢP & THỜI GIAN SỐNG (Mục 3, 8.1, 8.2)
   ========================================================================== */
LABS.push({
  id: 'rec', name: 'Thời gian sống', no: '3', secs: [3],
  S: { tau: 1.5, g: 20, on: 1 },
  cols: '1.5fr 1fr', rows: '2.4fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Bật / tắt sáng: hạt dư tái hợp dần', area: 'a', anim: true,
      ctrls: [{ k: 'on', seg: [[1, 'Bật sáng'], [0, 'Tắt sáng']] }, { k: 'tau', l: 'τ', min: .5, max: 4, step: .1, f: v => v.toFixed(1) + ' s' }, { k: 'g', l: "g′", min: 5, max: 40, step: 1, f: v => v + '/s' }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, M = p.tab.M, bx = 14, by = 30, bw = W - 28, bh = H - by - 12;
        if (!M.ps) { M.ps = []; M.fl = []; M.hist = []; M.hs = 0; M.sig = ''; M.maj = Array.from({ length: 70 }, () => [Math.random(), Math.random()]); M.t = 0; M.ev = { ts: 0, N0: 0, Ninf: S.on ? S.g * S.tau : 0, tau: S.tau }; }
        M.t += dt;
        const sig = S.on + '|' + S.tau + '|' + S.g;
        if (sig !== M.sig) { if (M.sig) M.ev = { ts: M.t, N0: M.ps.length, Ninf: S.on ? S.g * S.tau : 0, tau: S.tau }; M.sig = sig; }
        if (S.on) { let k = S.g * dt; while (k > 0) { if (Math.random() < Math.min(1, k)) M.ps.push({ x: Math.random(), y: Math.random(), vx: 0, vy: 0 }); k -= 1; } }
        M.ps = M.ps.filter(q => { if (Math.random() < dt / S.tau) { M.fl.push({ x: q.x, y: q.y, a: 1 }); return false; } return true; });
        M.hs += dt; if (M.hs > .1) { M.hs = 0; M.hist.push([M.t, M.ps.length]); while (M.hist.length && M.hist[0][0] < M.t - 14) M.hist.shift(); }
        rr(ctx, bx, by, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        M.maj.forEach(m => dot(ctx, bx + 8 + m[0] * (bw - 16), by + 8 + m[1] * (bh - 16), 3, C.sub));
        M.ps.forEach(q => { q.x = clamp(q.x + gauss() * dt * .06, .01, .99); q.y = clamp(q.y + gauss() * dt * .06, .02, .98); dot(ctx, bx + 8 + q.x * (bw - 16), by + 8 + q.y * (bh - 16), 5, C.c2); });
        M.fl = M.fl.filter(f => (f.a -= dt * 2.5) > 0);
        M.fl.forEach(f => { ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(bx + 8 + f.x * (bw - 16), by + 8 + f.y * (bh - 16), 5 + (1 - f.a) * 14, 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; });
        txt(ctx, 'Si loại P: chấm xám = lỗ trống (đa số), chấm xanh = electron dư', bx + 2, 14, C.mut, 11.5, 'left', 600);
        txt(ctx, 'δn = ' + M.ps.length, W - 14, 14, C.main, 14, 'right', 700);
        if (S.on) { for (let i = 0; i < 4; i++) { const x = bx + bw * (.15 + i * .23), y0 = by - 2 + ((t * 30 + i * 12) % 20); arr(ctx, x, y0 - 14, x + 6, y0, C.main, 2); } }
      } },
    { title: 'Đồng hồ kim δn: kim đặc = số hạt thật, kim đứt = công thức', area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, M = p.tab.M; if (!M.hist) return; const ev = M.ev, r = Math.min(W / 5, H * .36, 52);
        const dtm = Math.max(0, M.t - ev.ts), fm = ev.Ninf + (ev.N0 - ev.Ninf) * Math.exp(-dtm / ev.tau);
        const top = Math.max(10, ev.Ninf, ev.N0, M.ps.length) * 1.15; M.ym = M.ym ? M.ym + (top - M.ym) * .05 : top;
        gauge(ctx, W * .27, H * .55, r, 'δn', M.ps.length + ' hạt', M.ps.length / M.ym, C.c2, fm / M.ym);
        const k = Math.round((S.on ? 1 - Math.exp(-dtm / ev.tau) : Math.exp(-dtm / ev.tau)) * 100);
        gauge(ctx, W * .73, H * .55, r, S.on ? 'đã đạt' : 'còn lại', k + '%', k / 100, C.main);
        txt(ctx, 'sau ' + dtm.toFixed(1) + ' s' + (ev.Ninf > 0 ? ' · g′τ = ' + Math.round(ev.Ninf) : ''), W / 2, H - 14, C.ink, 12, 'center', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 3 — LIÊN TỤC & KHUẾCH TÁN, ĐỘ DÀI L (Mục 4, 5, 8.3)
   ========================================================================== */
const SLAB = 6, NB = 24;
LABS.push({
  id: 'diff', name: 'Độ dài khuếch tán', no: '4–5', secs: [4, 5],
  S: { D: 1.2, tau: 1.5 },
  cols: '1.5fr 1fr', rows: '2.4fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Nguồn ở mép trái: hạt loang ra và chết dần', area: 'a', anim: true,
      ctrls: [{ k: 'D', l: 'D', min: .2, max: 3, step: .1, f: v => v.toFixed(1) }, { k: 'tau', l: 'τ', min: .3, max: 3, step: .1, f: v => v.toFixed(1) }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, M = p.tab.M, bx = 14, bw = W - 28, sy = 28, sh = H * .5, hy = sy + sh + 14, hh = H - hy - 10, dm = dt * 2, L = Math.sqrt(S.D * S.tau);
        if (!M.ps) { M.ps = []; M.h = new Array(NB).fill(0); }
        let k = 70 * dm; while (k > 0) { if (Math.random() < Math.min(1, k)) M.ps.push({ x: Math.abs(gauss()) * .03, y: Math.random() }); k -= 1; }
        const sd = Math.sqrt(2 * S.D * dm), cnt = new Array(NB).fill(0);
        M.ps = M.ps.filter(q => {
          q.x += gauss() * sd; q.y = clamp(q.y + gauss() * .05, 0, 1); if (q.x < 0) q.x = -q.x;
          if (q.x > SLAB || Math.random() < dm / S.tau) return false;
          cnt[Math.min(NB - 1, Math.floor(q.x / SLAB * NB))]++; return true;
        });
        cnt.forEach((c, i) => M.h[i] += (c - M.h[i]) * .04);
        rr(ctx, bx, sy, bw, sh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        rr(ctx, bx - 4, sy, 8, sh, 3); ctx.fillStyle = C.main; ctx.fill();
        M.ps.forEach(q => dot(ctx, bx + q.x / SLAB * bw, sy + 6 + q.y * (sh - 12), 3, C.c2));
        txt(ctx, 'nguồn', bx + 10, sy - 10, C.main, 11.5, 'left', 700);
        const xL = bx + Math.min(L, SLAB) / SLAB * bw; ln(ctx, xL, sy, xL, hy + hh, C.main, 1.6, [5, 4]); txt(ctx, 'x = L', xL + 5, sy + 12, C.main, 12, 'left', 700);
        const h0 = Math.max(1, (M.h[0] + M.h[1]) / 2), bwd = bw / NB, sh2 = (hh - 14) / 2;
        for (let i = 0; i < NB; i++) {
          const th = h0 * Math.exp(-((i + .5) * SLAB / NB - SLAB / NB / 2) / L);
          ctx.save(); ctx.fillStyle = C.c2;
          ctx.globalAlpha = .08 + .8 * clamp(M.h[i] / h0, 0, 1); ctx.fillRect(bx + i * bwd, hy, bwd - 1, sh2);
          ctx.globalAlpha = .08 + .8 * clamp(th / h0, 0, 1); ctx.fillRect(bx + i * bwd, hy + sh2 + 14, bwd - 1, sh2);
          ctx.restore();
        }
        txt(ctx, 'độ đậm = mật độ hạt đo được', bx + 4, hy + sh2 / 2, C.ink, 11, 'left', 700);
        txt(ctx, 'độ đậm theo công thức e^(−x/L)', bx + 4, hy + sh2 + 14 + sh2 / 2, C.ink, 11, 'left', 700);
      } },
    { title: 'L = √(D·τ)', area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, L = Math.sqrt(S.D * S.tau);
        txt(ctx, 'L = √(' + S.D.toFixed(1) + ' × ' + S.tau.toFixed(1) + ') = ' + L.toFixed(2), W / 2, H * .22, C.ink, 16, 'center', 700);
        const bx = 20, bw = W - 40, y = H * .45, h = 26, NS = 40;
        rr(ctx, bx, y, bw, h, 6); ctx.fillStyle = C.tint; ctx.fill();
        for (let i = 0; i < NS; i++) { ctx.save(); ctx.globalAlpha = Math.exp(-(i + .5) / NS * 4) * .9; ctx.fillStyle = C.c2; ctx.fillRect(bx + i * bw / NS, y, bw / NS + .5, h); ctx.restore(); }
        [0, 1, 2, 3].forEach(m => { const x = bx + m / 4 * bw; ln(ctx, x, y - 4, x, y + h + 4, C.main, 1.6); txt(ctx, m ? m + 'L' : '0', x, y + h + 16, C.main, 12, 'center', 700); txt(ctx, Math.round(Math.exp(-m) * 100) + '%', x, y - 14, C.ink, 12, 'center', 700); });
        txt(ctx, 'còn lại bao nhiêu % hạt dư so với mép nguồn', W / 2, H - 14, C.sub, 11, 'center', 600);
      } }
  ]
});

/* ==========================================================================
   TAB 4 — LƯỠNG CỰC (Mục 6–7)
   ========================================================================== */
const MUN = 1350, MUP = 480, DN = 34.9, DP = 12.4;
const ambD = r => (MUN * DP + MUP * DN * r) / (MUN * r + MUP);
const ambM = r => MUN * MUP * (1 - r) / (MUN * r + MUP);
LABS.push({
  id: 'amb', name: 'Lưỡng cực', no: '6–7', secs: [6, 7],
  S: { link: 1, r: .001, E: .5 },
  cols: '1.5fr 1fr', rows: '2.4fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Đám electron và đám lỗ trống dư trong điện trường', area: 'a', anim: true,
      ctrls: [{ k: 'link', seg: [[1, 'Đi chung (lưỡng cực)'], [0, 'Tách rời (giả định)']] }, { k: 'r', l: 'n/p', min: -3, max: 3, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }, { k: 'E', l: 'E', min: 0, max: 1, step: .05, f: v => v.toFixed(2) }, { btn: 'Đặt lại', fn: p => { p.tab.M = {}; } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, M = p.tab.M, N = 55, by = 40, bh = H - by - 14;
        if (!M.e) { M.e = Array.from({ length: N }, () => ({ x: W * .3 + gauss() * 14, y: Math.random() })); M.h = Array.from({ length: N }, () => ({ x: W * .3 + gauss() * 14, y: Math.random() })); }
        const r = S.r, Dl = ambD(r), Ml = ambM(r), k = .13, kd = 1.5, E = S.E;
        const ve = S.link ? -Ml * E * k : -MUN * E * k, vh = S.link ? -Ml * E * k : MUP * E * k, De = S.link ? Dl : DN, Dh = S.link ? Dl : DP;
        const step = (q, v, D) => { q.x += v * dt + gauss() * Math.sqrt(2 * D * dt) * kd; q.y = clamp(q.y + gauss() * dt * .25, 0, 1); if (q.x < 6) q.x += W - 12; if (q.x > W - 6) q.x -= W - 12; };
        M.e.forEach(q => step(q, ve, De)); M.h.forEach(q => step(q, vh, Dh));
        rr(ctx, 8, by, W - 16, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        M.e.forEach(q => { dot(ctx, q.x, by + 8 + q.y * (bh - 16), 5, C.c2); });
        M.h.forEach(q => { dot(ctx, q.x, by + 8 + q.y * (bh - 16), 3.2, C.c4); });
        const mxE = M.e.reduce((s, q) => s + q.x, 0) / N, mxH = M.h.reduce((s, q) => s + q.x, 0) / N;
        arr(ctx, 18, 18, 18 + 20 + E * 70, 18, C.main, 3); txt(ctx, 'E ngoài', 26 + E * 70 + 18, 18, C.main, 12, 'left', 700);
        txt(ctx, 'electron (to)', W - 14, 12, C.c2, 11.5, 'right', 700); txt(ctx, 'lỗ trống (nhỏ)', W - 14, 28, C.c4, 11.5, 'right', 700);
        if (!S.link && E > .1) txt(ctx, 'electron chạy nhanh hơn: tách điện tích!', W / 2, by + bh - 12, C.err, 12, 'center', 700);
        if (S.link && E > .1) txt(ctx, 'điện trường nội kéo hai đám đi chung', W / 2, by + bh - 12, C.c2, 12, 'center', 700);
        M.sep = Math.abs(mxE - mxH);
      } },
    { title: 'Hai đồng hồ kim: D′ và μ′ của đám lưỡng cực', area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, Dl = ambD(S.r), Ml = ambM(S.r), r = Math.min(W / 5, H * .34, 48);
        gauge(ctx, W * .27, H * .52, r, 'D′ (cm²/s)', Dl.toFixed(1), Dl / 40, C.main);
        gauge(ctx, W * .73, H * .52, r, 'μ′ (cm²/V·s)', Math.round(Ml) + '', (Ml + 600) / 2100, Ml < 0 ? C.c4 : C.c2);
        txt(ctx, 'D_p = ' + DP + ' · D_n = ' + DN + '   |   μ_p = ' + MUP + ' · μ_n = ' + MUN, W / 2, H - 14, C.sub, 11, 'center', 600);
      } }
  ]
});

/* ==========================================================================
   TAB 5 — XUNG GAUSS & HAYNES–SHOCKLEY (Mục 8.4, 10)
   ========================================================================== */
function hsCurve(S) {
  const mu = S.mu, E = S.E, D = mu * .0259, tau = S.tau, d = 1, n = 600, t0 = 1e6 / (mu * E), tm = 3 * t0, ts = [], ys = [];
  let mx = 0, im = 0;
  for (let i = 1; i <= n; i++) { const t = tm * i / n, ts_ = t * 1e-6, y = Math.exp(-Math.pow(d - mu * E * ts_, 2) / (4 * D * ts_) - t / tau) / Math.sqrt(4 * Math.PI * D * ts_); ts.push(t); ys.push(y); if (y > mx) { mx = y; im = i - 1; } }
  const th = mx / Math.E; let a = im, b = im; while (a > 0 && ys[a] > th) a--; while (b < n - 1 && ys[b] > th) b++;
  return { ts, ys, mx, tp: ts[im], t1: ts[a], t2: ts[b], t0, tm, D };
}
LABS.push({
  id: 'pulse', name: 'Xung & Haynes–Shockley', no: '8, 10', secs: [8, 10],
  S: { E: 10, mu: 1000, tau: 100 },
  cols: '1.5fr 1fr', rows: '2.4fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Xung lỗ trống: trôi, loang rộng, hao hụt', area: 'a', anim: true,
      ctrls: [{ k: 'E', l: 'E', min: 4, max: 20, step: 1, f: v => v + ' V/cm' }, { k: 'mu', l: 'μ', min: 500, max: 1500, step: 50, f: v => v }, { k: 'tau', l: 'τ', min: 20, max: 400, step: 10, f: v => v + ' µs' }, { btn: 'Bắn xung', fn: p => { p.tab.M.ps = null; } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, M = p.tab.M, c = hsCurve(S), D = c.D, by = H * .3, bh = H * .4, x0 = 30, xs = (W - 60) / 1.3, X = x => x0 + (x + .1) * xs;
        const sig = S.E + '|' + S.mu + '|' + S.tau; if (sig !== M.sig) { M.sig = sig; M.ps = null; }
        if (!M.ps) { M.ps = Array.from({ length: 450 }, () => ({ x: Math.abs(gauss()) * .004, y: Math.random() })); M.tm = 0; M.hold = 0; }
        const dtm = dt * c.t0 / 3, ds = dtm * 1e-6;
        if (M.tm < 2.3 * c.t0) { M.tm += dtm; M.ps = M.ps.filter(q => { q.x += S.mu * S.E * ds + gauss() * Math.sqrt(2 * D * ds); return Math.random() > dtm / S.tau; }); }
        else if ((M.hold += dt) > 1) M.ps = null;
        if (!M.ps) return;
        rr(ctx, X(-.1), by, X(1.2) - X(-.1), bh, 6); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        [[0, 'A'], [1, 'B']].forEach(a => { ctx.fillStyle = C.main; ctx.fillRect(X(a[0]) - 3, by - 8, 6, bh + 16); txt(ctx, a[1], X(a[0]), by - 18, C.main, 13, 'center', 700); });
        arr(ctx, X(.05), by + bh + 20, X(.3), by + bh + 20, C.main, 2.5); txt(ctx, 'E', X(.3) + 8, by + bh + 20, C.main, 12, 'left', 700);
        M.ps.forEach(q => { if (q.x > -.1 && q.x < 1.2) dot(ctx, X(q.x), by + 6 + q.y * (bh - 12), 3.2, C.c4); });
        txt(ctx, 'còn ' + M.ps.length + '/450 hạt', W - 14, 14, C.ink, 12.5, 'right', 700);
        txt(ctx, 't = ' + Math.round(M.tm) + ' µs', 14, 14, C.mut, 12.5, 'left', 700);
        p.tab.M.tmNow = M.tm;
      } },
    { title: 'Đầu dò tại B: đèn nháy khi xung đi qua, hai đồng hồ đọc μ và D', area: 'c', anim: true,
      draw(p, ctx, W, H) {
        const S = p.S, M = p.tab.M, c = hsCurve(S), r = Math.min(W / 7, H * .3, 44), cy = H * .5;
        const near = M.ps ? M.ps.filter(q => Math.abs(q.x - 1) < .05).length : 0, a = clamp(near / 14, 0, 1);
        ctx.save(); ctx.globalAlpha = .15 + .7 * a; dot(ctx, W * .12, cy, 26, C.c4); ctx.restore();
        dot(ctx, W * .12, cy, 18, a > .08 ? C.c4 : C.tint); ctx.beginPath(); ctx.arc(W * .12, cy, 18, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.stroke();
        txt(ctx, 'đầu dò B', W * .12, cy + 38, C.mut, 11, 'center', 700);
        const dt_ = c.t2 - c.t1, muM = 1e6 / (S.E * c.tp), DM = Math.pow(muM * S.E * dt_ * 1e-6, 2) / (16 * c.tp * 1e-6);
        gauge(ctx, W * .42, cy, r, 'μ đo', Math.round(muM) + '', muM / 1500, C.c4, S.mu / 1500);
        gauge(ctx, W * .74, cy, r, 'D đo', DM.toFixed(1), DM / 40, C.c2, c.D / 40);
        txt(ctx, 't₀ = d/(E·μ) = ' + Math.round(c.tp) + ' µs · Δt = ' + Math.round(dt_) + ' µs   (kim đứt = giá trị thật)', 12, H - 34, C.ink, 12, 'left', 700);
        txt(ctx, 'diện tích còn ∝ e^(−t₀/τ) = ' + Math.round(Math.exp(-c.tp / S.tau) * 100) + '%', 12, H - 14, C.main, 12, 'left', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 6 — PHỤC HỒI ĐIỆN MÔI (Mục 9)
   ========================================================================== */
LABS.push({
  id: 'relax', name: 'Phục hồi điện môi', no: '9', secs: [9],
  S: { N: 1e16 },
  cols: '1.5fr 1fr', rows: '2.4fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Bơm lỗ trống vào loại N: electron lao tới trung hòa', area: 'a', anim: true,
      ctrls: [{ k: 'N', l: 'Nd', min: 14, max: 19, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }, { btn: 'Bơm lại', fn: p => { p.tab.M = {}; } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, M = p.tab.M, bx = 14, by = 30, bw = W - 28, bh = H - by - 12, cx = bx + bw / 2, cy = by + bh / 2, K = 14, TS = 1.2;
        if (!M.el) {
          M.t = 0; M.el = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), jt: Math.random() * 6 })); M.hl = Array.from({ length: K }, () => ({ a: Math.random() * TAU2, r: Math.random() * 18 }));
          M.arr = Array.from({ length: 34 }, () => { const a = Math.random() * TAU2, R = Math.max(bw, bh) * (.35 + Math.random() * .25); return { sx: cx + Math.cos(a) * R, sy: cy + Math.sin(a) * R * .6, a: Math.random() * TAU2, r: 6 + Math.random() * 30, tA: -Math.log(1 - Math.random() * .98) * TS }; });
        }
        M.t += dt; const tp = M.t % (TS * 6);
        const sig = 1 / 1 * Math.exp(-tp / TS);
        const mu = ct(S.N, 'n'), td = 11.7 * 8.854e-14 / (Q * S.N * mu);
        rr(ctx, bx, by, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) { txt(ctx, '+', bx + (i + .5) * bw / 10, by + (j + .5) * bh / 4, C.sub, 13, 'center', 700); }
        const rad = 90; for (let k = 0; k < 6; k++) { ctx.save(); ctx.globalAlpha = .09 * sig; dot(ctx, cx, cy, rad * (1 - k / 6), C.c4); ctx.restore(); }
        M.el.forEach(e => { dot(ctx, bx + 8 + e.x * (bw - 16) + Math.sin(M.t * 4 + e.jt) * 2, by + 8 + e.y * (bh - 16) + Math.cos(M.t * 3 + e.jt) * 2, 3, C.c2); });
        M.arr.forEach(a => { const f = clamp(1 - Math.exp(-0), 0, 1); const prog = tp > a.tA ? clamp((tp - a.tA) / .35, 0, 1) : 0; const ex = a.sx + (cx + Math.cos(a.a) * a.r - a.sx) * prog, ey = a.sy + (cy + Math.sin(a.a) * a.r - a.sy) * prog; dot(ctx, ex, ey, 4.5, C.c2); });
        M.hl.forEach(h => { dot(ctx, cx + Math.cos(h.a) * h.r, cy + Math.sin(h.a) * h.r, 5.5, C.c4); txt(ctx, '+', cx + Math.cos(h.a) * h.r, cy + Math.sin(h.a) * h.r + .5, C.bg, 11, 'center', 800); });
        txt(ctx, 'đồng hồ chậm: t = ' + (tp / TS * td * 1e12).toFixed(2) + ' ps', 14, 14, C.main, 12.5, 'left', 700);
        txt(ctx, 'τ_d = ' + (td * 1e12).toFixed(2) + ' ps', W - 14, 14, C.ink, 12.5, 'right', 700);
        M.td = td; M.sig = sig;
      } },
    { title: 'Hai đèn: τ_d tắt ngay, τ vẫn còn sáng', area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const M = p.tab.M; if (!M.td) return; const tau = 1e-7, ratio = tau / M.td, cy = H * .42, r = 20, TSL = 1.2;
        const tp = (M.t || 0) % (TSL * 6), al = Math.exp(-tp / TSL);
        [[W * .2, C.c4, al, 'τ_d = ' + (M.td * 1e12).toFixed(2) + ' ps'], [W * .5, C.c2, 1, 'τ ≈ 0,1 µs']].forEach(l => {
          ctx.save(); ctx.globalAlpha = .15 + .7 * l[2]; dot(ctx, l[0], cy, r + 8, l[1]); ctx.restore();
          dot(ctx, l[0], cy, r, l[2] > .15 ? l[1] : C.tint); ctx.beginPath(); ctx.arc(l[0], cy, r, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.stroke();
          txt(ctx, l[3], l[0], cy + r + 18, l[1], 12, 'center', 700);
        });
        gauge(ctx, W * .82, cy + 6, Math.min(W * .12, 40), 'log₁₀(τ ÷ τ_d)', Math.log10(ratio).toFixed(1), Math.log10(ratio) / 8, C.main);
        txt(ctx, 'τ ÷ τ_d ≈ ' + sci(ratio, 1), W / 2, H - 16, C.ink, 14, 'center', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 7 — MỨC FERMI CHUẨN (Mục 11)
   ========================================================================== */
LABS.push({
  id: 'qf', name: 'Fermi chuẩn', no: '11', secs: [11],
  S: { type: 'n', N: 1e15, d: 1e13 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  qf() { const S = this.S, ni = 1e10, kT = .0259, n0 = S.type === 'n' ? S.N : ni * ni / S.N, p0 = S.type === 'n' ? ni * ni / S.N : S.N;
    const Ef = kT * Math.log(n0 / ni), Efn = kT * Math.log((n0 + S.d) / ni), Efp = -kT * Math.log((p0 + S.d) / ni); return { Ef, Efn, Efp, n0, p0, kT, lli: S.d / S.N }; },
  panels: [
    { title: 'Hạt trong tinh thể: một mức Fermi hay hai? Ba đồng hồ kim đọc E_F, E_Fn, E_Fp', area: 'a', anim: true,
      ctrls: [{ k: 'type', seg: [['n', 'Loại N'], ['p', 'Loại P']] }, { k: 'N', l: 'pha tạp', min: 14, max: 18, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }, { k: 'd', l: 'δn = δp', min: 8, max: 17, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }],
      draw(p, ctx, W, H, t) {
        const q = p.tab.qf(), by = 30, bh = H * .46, bw = W * .4, cnt = v => Math.round(2 + 26 * clamp((Math.log10(Math.max(v, 1)) - 4) / 14, 0, 1));
        const box = (x0, title, ne, nh) => {
          txt(ctx, title, x0 + bw / 2, 14, C.mut, 12, 'center', 700);
          rr(ctx, x0, by, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
          for (let i = 0; i < ne; i++) { const x = x0 + 10 + ((i * .618 + .13) % 1) * (bw - 20) + Math.sin(t * 2.6 + i) * 3, y = by + 10 + ((i * .382 + .21) % 1) * (bh - 20) + Math.cos(t * 3 + i * 1.3) * 3; dot(ctx, x, y, 4.4, C.c2); }
          for (let i = 0; i < nh; i++) { const x = x0 + 10 + ((i * .414 + .31) % 1) * (bw - 20) + Math.sin(t * 2.2 + i * 1.7) * 3, y = by + 10 + ((i * .732 + .47) % 1) * (bh - 20) + Math.cos(t * 2.8 + i) * 3; dot(ctx, x, y, 3, C.c4); }
        };
        box(W * .04, 'Cân bằng (tối)', cnt(q.n0), cnt(q.p0));
        box(W * .56, 'Có hạt dư (sáng)', cnt(q.n0 + p.S.d), cnt(q.p0 + p.S.d));
        txt(ctx, 'electron (to)', W * .5, by + bh * .35, C.c2, 11, 'center', 700); txt(ctx, 'lỗ trống (nhỏ)', W * .5, by + bh * .55, C.c4, 11, 'center', 700);
        const r = Math.min(W / 8, (H - by - bh) * .32, 40), cy = by + bh + (H - by - bh) * .55, fr = e => (e + .56) / 1.12;
        gauge(ctx, W * .2, cy, r, 'E_F (tối)', (q.Ef >= 0 ? '+' : '−') + Math.abs(q.Ef).toFixed(3), fr(q.Ef), C.main);
        gauge(ctx, W * .5, cy, r, 'E_Fn (sáng)', (q.Efn >= 0 ? '+' : '−') + Math.abs(q.Efn).toFixed(3), fr(q.Efn), C.c2);
        gauge(ctx, W * .8, cy, r, 'E_Fp (sáng)', (q.Efp >= 0 ? '+' : '−') + Math.abs(q.Efp).toFixed(3), fr(q.Efp), C.c4);
        txt(ctx, 'E_Fn − E_Fp = ' + (q.Efn - q.Efp).toFixed(3) + ' eV  (đo từ Eᵢ)', W / 2, H - 10, C.ink, 12, 'center', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 0 — TỔNG QUAN: MỘT THANH Si, MỘT XUNG SÁNG, BẢY THÍ NGHIỆM LIÊN KẾT
   ========================================================================== */
const AOV = [
  ['gr', 1, 'Sinh'], ['rec', 2, 'Sống τ'], ['diff', 3, 'Khuếch tán L'], ['amb', 4, 'Lưỡng cực'], ['pulse', 5, 'Đọc tại B'], ['relax', 6, 'Đa số trung hòa'], ['qf', 7, 'Fermi chuẩn']
];
function allCalc(S) {
  const mu = ct(S.N, 'n'), D = mu * .0259, t0 = 1e6 / (mu * S.E), L = Math.sqrt(D * S.tau * 1e-6), td = 11.7 * 8.854e-14 / (Q * S.N * ct(S.N, 'p'));
  const ni = 1e10, d = 1e13 * S.I, n0 = ni * ni / S.N, dEF = .0259 * Math.log((n0 + d) * (S.N + d) / (ni * ni));
  return { mu, D, t0, L, td, dEF, d };
}
const FOLLOW_SLOW = .2, FOLLOW_ZOOM = 4.2;   /* hệ số tua chậm và độ zoom khi theo dõi 1 hạt */
LABS.unshift({
  id: 'all', name: 'Tổng quan', no: '★', secs: [],
  S: { E: 10, tau: 100, N: 1e15, I: 1, yaw: 30, pitch: 32, zoom: 1, speed: 1 },
  cols: '1.5fr 1fr', rows: '3.4fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Khối 3D thanh Si loại P dài 1 cm — bấm số ①–⑦ để vào thí nghiệm',
      area: 'a', anim: true,
      ctrls: [
        { k: 'E', l: 'E', min: 4, max: 20, step: 1, f: v => v + ' V/cm' },
        { k: 'tau', l: 'τ', min: 20, max: 400, step: 10, f: v => v + ' µs' },
        { k: 'N', l: 'pha tạp P', min: 14, max: 18, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) },
        { k: 'I', l: 'Ánh sáng', min: .1, max: 1, step: .05, f: v => Math.round(v * 100) + '%' },
        { k: 'yaw', l: 'Xoay ngang', min: -180, max: 180, step: 5, f: v => v + '°' },
        { k: 'pitch', l: 'Nghiêng', min: 5, max: 90, step: 5, f: v => v + '°' },
        { k: 'zoom', l: 'Phóng to', min: .5, max: 3, step: .1, f: v => v.toFixed(1) + '×' },
        { k: 'speed', l: 'Tốc độ', min: .05, max: 1, step: .05, f: v => v.toFixed(2) + '×' },
        { btn: 'Tua chậm 0,2×', fn: p => { p.S.speed = .2; p.syncCtrls(); } },
        { btn: 'Bình thường 1×', fn: p => { p.S.speed = 1; p.syncCtrls(); } },
        { btn: 'Đặt lại góc nhìn', fn: p => { p.S.yaw = 30; p.S.pitch = 32; p.S.zoom = 1; p.syncCtrls(); } },
        { btn: 'Bắn xung', fn: p => { p.tab.M.ps = null; } }
      ],
      onDrag(p, dx, dy) { const S = p.S; S.yaw = ((S.yaw + dx * .5 + 540) % 360) - 180; S.pitch = clamp(S.pitch + dy * .4, 5, 90); p.syncCtrls(); },
      onWheel(p, dy) {
        if (p.follow) p.fz = clamp(p.fz * (dy < 0 ? 1.1 : 1 / 1.1), 2, 9);
        else { p.S.zoom = clamp(p.S.zoom * (dy < 0 ? 1.1 : 1 / 1.1), .5, 3); p.syncCtrls(); }
      },
      onClick(p, x, y) {
        const hit = r => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
        if (p.follow) { p.follow = false; return; }
        if (p.cam && p.cam.k > .05) return;               /* đang lùi camera ra: bỏ qua */
        const h = (p.hits || []).find(hit); if (h) { show(h.id); return; }
        const c = p.cloud; if (!c || Math.hypot(x - c.x, y - c.y) > c.r) return;
        /* chọn hạt gần điểm bấm nhất trong số hạt đang hiện trong thanh */
        let best = null, bd = 1e9;
        (p.proj || []).forEach(o => { if (o.q.x <= 0 || o.q.x >= 1) return; const d = Math.hypot(o.c[0] - x, o.c[1] - y); if (d < bd) { bd = d; best = o.q; } });
        const M = p.tab.M; if (!best || !M.ps || !M.ps.includes(best)) return;
        M.ps = M.ps.filter(q => !(q.trk && q.arr)); M.ps.forEach(q => { q.trk = false; q.seg = null; q.trail = null; });
        best.trk = true; best.arr = false; best.hit = 0; best.seg = null; best.trail = [[best.x, best.y, best.z]];
        p.follow = true; p.fz = FOLLOW_ZOOM;
        say('w', 'Camera zoom vào 1 electron dư và tua chậm. Đường gấp khúc là quỹ đạo: mỗi đoạn = trôi theo E cộng một bước khuếch tán ngẫu nhiên. Hạt này được giữ sống đến B để bạn đi hết quãng đường (các hạt khác vẫn có thể tái hợp). Bấm bất kỳ đâu để thoát.');
      },
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, M = p.tab.M, K = allCalc(S), NP = 300, sp = S.speed;
        /* tua chậm mượt khi đang theo dõi 1 hạt */
        p.slow = (p.slow == null ? 1 : p.slow); p.slow += ((p.follow ? FOLLOW_SLOW : 1) - p.slow) * (1 - Math.exp(-dt * 3));
        const dts = dt * sp * p.slow;
        const sig = S.E + '|' + S.tau + '|' + S.N + '|' + S.I; if (sig !== M.sig) { M.sig = sig; M.ps = null; }
        if (!M.ps) { M.ps = Array.from({ length: NP }, () => ({ x: Math.abs(gauss()) * .004, y: Math.random(), z: Math.random() })); M.tm = 0; M.hold = 0; M.fl = []; }
        M.at = (M.at || 0) + dts; const ta = M.at;
        const dtm = dts * K.t0 / 3, ds = dtm * 1e-6;
        if (M.tm < 2.3 * K.t0) { M.tm += dtm; M.ps = M.ps.filter(q => { if (q.trk) return true; q.x += K.mu * S.E * ds + gauss() * Math.sqrt(2 * K.D * ds); q.y = clamp(q.y + gauss() * .03, 0, 1); q.z = clamp(q.z + gauss() * .03, 0, 1); if (Math.random() < dtm / S.tau) { M.fl.push({ x: q.x, y: q.y, z: q.z, a: 1 }); return false; } return true; }); }
        else if ((M.hold += dts) > 1.2 && !p.follow) M.ps = null;
        if (!M.ps) return;
        M.fl = M.fl.filter(f => (f.a -= dts * 2.5) > 0);

        /* ===== THEO DÕI 1 HẠT: mô hình chuyển động ===== */
        let T = M.ps.find(q => q.trk);
        if (p.follow && !T) p.follow = false;                         /* xung bị đặt lại */
        if (!p.follow && T && (!p.cam || p.cam.k < .05)) { T.trk = false; T.seg = null; T.trail = null; if (T.arr) M.ps = M.ps.filter(q => q !== T); T = null; }
        if (T) {
          if (T.arr) { T.hit += dt; if (T.hit > 2.6) p.follow = false; }
          else {
            /* quỹ đạo = chuỗi ~28 bước, mỗi bước: trôi μE·Δt + khuếch tán √(2DΔt); nội suy thẳng giữa hai mốc để nhìn rõ */
            const dseg = K.t0 / 28, nseg = q => {
              const d2 = dseg * 1e-6;
              let x1 = Math.max(.002, q.x + K.mu * S.E * d2 + gauss() * Math.sqrt(2 * K.D * d2)), y1 = clamp(q.y + gauss() * .075, 0, 1), z1 = clamp(q.z + gauss() * .075, 0, 1), dur = dseg, fin = false;
              if (x1 >= 1) { const f = (1 - q.x) / (x1 - q.x); y1 = q.y + (y1 - q.y) * f; z1 = q.z + (z1 - q.z) * f; x1 = 1; dur = dseg * f; fin = true; }
              q.seg = { x0: q.x, y0: q.y, z0: q.z, x1, y1, z1, u: 0, dur: Math.max(dur, 1e-3), fin };
            };
            if (!T.seg) nseg(T);
            let adv = dtm;
            while (adv > 0 && !T.arr) {
              const s = T.seg, need = (1 - s.u) * s.dur;
              if (adv < need) { s.u += adv / s.dur; adv = 0; }
              else {
                adv -= need; T.x = s.x1; T.y = s.y1; T.z = s.z1; T.trail.push([T.x, T.y, T.z]);
                if (s.fin) { T.arr = true; T.hit = 0; say('v', 'Hạt chạm tấm B sau ' + Math.round(M.tm) + ' µs (cả đám: t₀ = ' + Math.round(K.t0) + ' µs). Từng hạt đến sớm/muộn hơn t₀ một chút vì khuếch tán ngẫu nhiên, đó là độ rộng của xung tại B.'); }
                else nseg(T);
              }
            }
            if (!T.arr) { const s = T.seg; T.x = s.x0 + (s.x1 - s.x0) * s.u; T.y = s.y0 + (s.y1 - s.y0) * s.u; T.z = s.z0 + (s.z1 - s.z0) * s.u; }
          }
        }
        /* ===== camera lia theo hạt ===== */
        const cam = p.cam || (p.cam = { tx: .5, ty: .5, tz: .5, z: S.zoom, k: 0 }), fol = !!(p.follow && T);
        const a1 = 1 - Math.exp(-dt * 3), a2 = 1 - Math.exp(-dt * 2.4), dest = fol ? [T.x, T.y, T.z] : [.5, .5, .5], zd = fol ? p.fz : S.zoom;
        cam.tx += (dest[0] - cam.tx) * a1; cam.ty += (dest[1] - cam.ty) * a1; cam.tz += (dest[2] - cam.tz) * a1;
        cam.z += (zd - cam.z) * a2; cam.k += ((fol ? 1 : 0) - cam.k) * a2;
        if (!fol && cam.k < .01) { cam.k = 0; cam.tx = cam.ty = cam.tz = .5; cam.z = S.zoom; }
        const ao = 1 - clamp(cam.k * 1.25, 0, 1);            /* độ hiện của các hạt còn lại */

        /* ===== phép chiếu 3D thật: xoay ngang, nghiêng, phóng to (tâm = điểm camera nhìn) ===== */
        const ya = S.yaw * Math.PI / 180, pb = S.pitch * Math.PI / 180, cyw = Math.cos(ya), syw = Math.sin(ya), cpb = Math.cos(pb), spb = Math.sin(pb);
        const U = Math.min(W / 3.9, H / 2.9) * cam.z, ccx = W / 2, ccy = H * .52;
        const R = (x, y, z) => { const wx = (x - cam.tx) * 3, wy = (y - cam.ty) * .8, wz = (z - cam.tz) * .8, ax = wx * cyw - wy * syw, ay = wx * syw + wy * cyw; return [ccx + U * ax, ccy - U * (wz * cpb + ay * spb), ay * cpb - wz * spb]; };
        const fillPoly = (pts, col, al, edge) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = col; ctx.fill(); ctx.restore(); if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = 1.1; ctx.stroke(); } };
        const faces = [], addBox = (x0, x1, y0, y1, z0, z1, col, al) => {
          const c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].map(v => R(v[0], v[1], v[2]));
          [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]].forEach(f => { const pts = f.map(i => c[i]); faces.push({ pts, col, al, d: pts.reduce((a, q) => a + q[2], 0) / 4 }); });
        };
        /* lưới '+' đa số (mặt phẳng giữa) */
        for (let i = 0; i < 22; i++) for (let j = 0; j < 3; j++) { const q = R((i + .5) / 22, .5, (j + .5) / 3); txt(ctx, '+', q[0], q[1], C.g, 10, 'center', 700); }
        /* đèn + chùm sáng */
        const lampC = R(.05, .5, 1.9), lx = lampC[0], ly = lampC[1], k = .35 + .65 * S.I;
        const patch = [R(0, .1, 1), R(.1, .1, 1), R(.1, .9, 1), R(0, .9, 1)];
        const hull = pts => { const a = pts.slice().sort((u, v) => u[0] - v[0] || u[1] - v[1]), cr = (o, u, v) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]), lo = [], up = [];
          a.forEach(q => { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
          a.slice().reverse().forEach(q => { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
          return lo.slice(0, -1).concat(up.slice(0, -1)); };
        fillPoly(hull([[lx - 9, ly + 9], [lx + 9, ly + 9]].concat(patch)), C.main, .16 * k);
        /* hạt dư xếp từ xa đến gần; khi theo dõi: mờ dần rồi ẩn (hạt được theo dõi vẽ riêng ở trên cùng) */
        const rs = Math.max(.6, Math.min(1.8, cam.z)), pr = M.ps.filter(q => q.x > -.05 && q.x < 1.05 && !q.trk).map(q => ({ q, c: R(q.x, q.y, q.z) })).sort((a, b) => b.c[2] - a.c[2]);
        p.proj = pr;
        if (ao > .01) {
          pr.forEach(o => {
            const r = Math.max(1.8, (3.4 - o.c[2] * .9) * rs), bl = cam.k;
            if (bl > .02) { ctx.globalAlpha = ao * .3; dot(ctx, o.c[0], o.c[1], r * (1 + 3 * bl), C.c2); }
            ctx.globalAlpha = ao * (1 - .5 * bl); dot(ctx, o.c[0], o.c[1], r, C.c2); dot(ctx, o.c[0] + 5 * rs, o.c[1] + 2 * rs, Math.max(1.2, r * .62), C.c4);
          });
          ctx.globalAlpha = 1;
          M.fl.forEach(f => { const c = R(f.x, f.y, f.z); ctx.globalAlpha = f.a * ao; ctx.beginPath(); ctx.arc(c[0], c[1], (4 + (1 - f.a) * 12) * rs, 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; });
        }
        /* khối thanh + đầu dò A, B: các mặt xếp xa → gần */
        addBox(0, 1, 0, 1, 0, 1, C.tint, .22); addBox(-.03, 0, -.04, 1.04, -.08, 1.08, C.main, .85); addBox(1, 1.03, -.04, 1.04, -.08, 1.08, C.main, .85);
        faces.sort((a, b) => b.d - a.d).forEach(f => fillPoly(f.pts, f.col, f.al * .8, C.sub));
        fillPoly(patch, C.main, .5 * k, C.main);
        const a0 = R(-.015, .5, -.08), b0 = R(1.015, .5, -.08);
        txt(ctx, 'A', a0[0], a0[1] + 16, C.main, 12, 'center', 700); txt(ctx, 'B', b0[0], b0[1] + 16, C.main, 12, 'center', 700);
        for (let r = 3; r >= 1; r--) { ctx.save(); ctx.globalAlpha = .12 * k; dot(ctx, lx, ly + 9, (8 + r * 8) * rs, C.main); ctx.restore(); }
        rr(ctx, lx - 14 * rs, ly - 4 * rs, 28 * rs, 12 * rs, 4); ctx.fillStyle = C.sub; ctx.fill();
        rr(ctx, lx - 11 * rs, ly + 6 * rs, 22 * rs, 7 * rs, 3); ctx.fillStyle = C.main; ctx.fill();
        for (let i = 0; i < 8; i++) { const u = (ta * .9 + i / 8) % 1, tx = R(.01 + ((i * .37) % 1) * .08, .15 + ((i * .61) % 1) * .7, 1), x = lx + (tx[0] - lx) * u, y = ly + 9 + (tx[1] - ly - 9) * u; ctx.save(); ctx.globalAlpha = (.3 + .7 * u) * k; dot(ctx, x, y, 2.6 * rs, C.main); ctx.restore(); }

        /* ===== hạt được theo dõi: đuôi quỹ đạo + đầu hạt (trên cùng của khối) ===== */
        if (T && cam.k > .02) {
          const ak = clamp(cam.k * 1.5, 0, 1), pts = (T.trail || []).slice(-60).map(v => R(v[0], v[1], v[2])), hd = R(T.x, T.y, T.z);
          pts.push(hd);
          ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          for (let i = 1; i < pts.length; i++) { const f = i / (pts.length - 1); ctx.globalAlpha = ak * (.12 + .88 * f); ln(ctx, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], C.main, 1.6 + 2.6 * f); }
          for (let i = 0; i < pts.length - 1; i++) { const f = i / (pts.length - 1); ctx.globalAlpha = ak * (.15 + .85 * f); dot(ctx, pts[i][0], pts[i][1], 2.4 + 1.6 * f, C.main); }
          const pul = 1 + .12 * Math.sin(t * 7);
          ctx.globalAlpha = ak * .22; dot(ctx, hd[0], hd[1], 24 * pul, C.main);
          ctx.globalAlpha = ak; dot(ctx, hd[0], hd[1], 10, C.c2); txt(ctx, '−', hd[0], hd[1] + .5, C.bg, 14, 'center', 800);
          dot(ctx, hd[0] + 13, hd[1] + 5, 6, C.c4); txt(ctx, '+', hd[0] + 13, hd[1] + 5.5, C.bg, 11, 'center', 800);
          txt(ctx, 'electron dư đang theo dõi (+ lỗ trống đi kèm)', hd[0], hd[1] - 32, C.main, 11.5, 'center', 800);
          if (T.arr) {                                            /* va chạm tấm B: vòng sóng + tia */
            const g = T.hit;
            for (let i = 0; i < 3; i++) { const f = g * 1.3 - i * .22; if (f <= 0 || f >= 1) continue; ctx.globalAlpha = ak * (1 - f); ctx.beginPath(); ctx.arc(hd[0], hd[1], 12 + f * 110, 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 3 * (1 - f) + 1; ctx.stroke(); }
            if (g < .9) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU2, r1 = 14 + g * 90, r2 = r1 + 14 * (1 - g); ctx.globalAlpha = ak * (1 - g / .9); ln(ctx, hd[0] + Math.cos(a) * r1, hd[1] + Math.sin(a) * r1, hd[0] + Math.cos(a) * r2, hd[1] + Math.sin(a) * r2, C.main, 2.2); }
          }
          ctx.restore();
        }

        /* thống kê đám hạt */
        let cx = 0, n = M.ps.length; M.ps.forEach(q => cx += q.x); cx = n ? cx / n : 0;
        let sd = 0; M.ps.forEach(q => sd += (q.x - cx) * (q.x - cx)); sd = n ? Math.sqrt(sd / n) : 0;
        const cc = R(clamp(cx, 0, 1), .5, .5), s1 = R(clamp(cx - sd, 0, 1), .5, .5), s2 = R(clamp(cx + sd, 0, 1), .5, .5);
        const cr_ = Math.max(36, Math.hypot(s2[0] - s1[0], s2[1] - s1[1]) * 1.1 + 18);
        p.cloud = n ? { x: cc[0], y: cc[1], r: cr_ } : null;
        if (n && ao > .01) { ctx.save(); ctx.globalAlpha = ao; ctx.setLineDash([5, 4]); ctx.strokeStyle = C.main; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(cc[0], cc[1], cr_, 0, TAU2); ctx.stroke(); ctx.setLineDash([]); txt(ctx, 'bấm để theo dõi 1 hạt', cc[0], cc[1] - cr_ - 8, C.main, 10.5, 'center', 700); ctx.restore(); }
        /* các số bấm được (ẩn khi camera đang theo hạt) */
        const hits = [], placed = [], ca = clamp(1 - cam.k * 4, 0, 1), chip = (id, num, label, x, y, col) => {
          const wd = 30 + label.length * 6.8; let xx = clamp(x - wd / 2, 4, W - wd - 4), yy = y;
          for (let it = 0; it < 6; it++) { const o = placed.find(q => Math.abs(q.y - yy) < 24 && xx < q.x + q.w + 4 && xx + wd + 4 > q.x); if (!o) break; yy += 26; }
          yy = clamp(yy, 14, H - 14); placed.push({ x: xx, y: yy, w: wd });
          rr(ctx, xx, yy - 11, wd, 22, 11); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke();
          txt(ctx, num + ' ' + label, xx + wd / 2, yy + .5, col, 11.5, 'center', 700); hits.push({ x: xx, y: yy - 11, w: wd, h: 22, id });
        };
        if (ca > .02) {
          ctx.save(); ctx.globalAlpha = ca;
          chip('gr', '①', 'Sinh', lx, ly - 26, C.c1);
          chip('diff', '③', 'Khuếch tán L', cc[0], cc[1] - cr_ - 30, C.main);
          chip('pulse', '⑤', 'Đọc tại B', b0[0], R(1.015, .5, 1.1)[1] - 30, C.c4);
          [['rec', '②', 'Sống τ', C.c3], ['relax', '⑥', 'Đa số trung hòa', C.c4], ['amb', '④', 'Lưỡng cực', C.c2], ['qf', '⑦', 'Fermi chuẩn', C.c5]].forEach((q, i) => chip(q[0], q[1], q[2], W * (.14 + i * .24), H - 18, q[3]));
          ctx.restore();
        }
        p.hits = ca > .5 ? hits : [];
        txt(ctx, 't = ' + Math.round(M.tm) + ' µs · còn ' + n + '/' + NP + ' hạt · tốc độ ' + (sp * p.slow).toFixed(2) + '×', W - 14, 14, C.ink, 12, 'right', 700);
        if (cam.k > .5) txt(ctx, 'THEO DÕI 1 HẠT · tua chậm', 14, 14, C.main, 12, 'left', 800);
        else txt(ctx, 'chấm to = electron dư · chấm nhỏ cạnh = lỗ trống đi kèm · vòng vàng = tái hợp', 14, 14, C.mut, 11, 'left', 600);
        /* thanh tiến độ A → B + trạng thái */
        if (T && cam.k > .05) {
          const ak = clamp(cam.k * 1.5, 0, 1), mw = Math.min(W * .5, 340), mx0 = (W - mw) / 2, my = H - 40, xp = mx0 + mw * clamp(T.x, 0, 1);
          ctx.save();
          rr(ctx, mx0 - 70, H - 64, mw + 140, 56, 12); ctx.globalAlpha = ak * .9; ctx.fillStyle = C.card; ctx.fill(); ctx.globalAlpha = ak; ctx.strokeStyle = C.main; ctx.lineWidth = 1.4; ctx.stroke();
          ln(ctx, mx0, my, mx0 + mw, my, C.g, 5); ln(ctx, mx0, my, xp, my, C.main, 5);
          txt(ctx, 'A', mx0 - 14, my, C.main, 12, 'center', 800); txt(ctx, 'B', mx0 + mw + 14, my, C.main, 12, 'center', 800);
          dot(ctx, xp, my, 7, C.c2);
          txt(ctx, T.arr ? 'ĐÃ CHẠM TẤM B · t = ' + Math.round(M.tm) + ' µs' : 'x = ' + T.x.toFixed(2) + ' cm · còn ' + (1 - T.x).toFixed(2) + ' cm tới B · bấm để thoát', W / 2, H - 20, T.arr ? C.main : C.ink, 11.5, 'center', 700);
          ctx.restore();
        }
        M.K = K;
      } },
    { title: 'Một chuỗi nhân quả: τ → L → t₀ → τ_d → E_Fn − E_Fp', area: 'c', anim: true,
      draw(p, ctx, W, H) {
        const S = p.S, K = allCalc(S), r = Math.min(W / 12, H * .3, 36), cy = H * .5, g = [
          ['τ', S.tau + ' µs', S.tau / 400, C.c3], ['L', (K.L * 1e4).toFixed(0) + ' µm', K.L * 1e4 / 1500, C.main], ['t₀', Math.round(K.t0) + ' µs', K.t0 / 200, C.c4],
          ['τ_d', (K.td * 1e12).toFixed(1) + ' ps', clamp(Math.log10(K.td * 1e12 + 1) / 2, 0, 1), C.c4], ['ΔE_F', K.dEF.toFixed(2) + ' eV', K.dEF / .8, C.c5]
        ];
        g.forEach((q, i) => gauge(ctx, W * (.1 + i * .2), cy, r, q[0], q[1], q[2], q[3]));
        txt(ctx, 'L = √(Dτ)   ·   t₀ = d/(μE)   ·   τ_d = ε/σ', W / 2, H - 12, C.sub, 11, 'center', 600);
      } }
  ]
});

/* ==========================================================================
   NHẬT KÝ GIẢI THÍCH. Loại dòng: i = nguyên lý · w = cơ chế · v = số liệu
   ========================================================================== */
const LD = {};
const pw = v => p10(Math.round(Math.log10(v)));
LD.all = {
  intro: [
    ['i', 'Cả bảy thí nghiệm là các lát cắt của cùng MỘT câu chuyện: bắn một xung sáng vào đầu thanh Si loại P và theo dõi nó cho đến khi biến mất.'],
    ['w', '① Ánh sáng sinh cặp e–h (hạt dư). ② Mỗi electron dư sống trung bình τ rồi tái hợp (vòng vàng). ③ Trong lúc sống, đám hạt loang ra: đi được cỡ L = √(Dτ).'],
    ['w', '④ Electron kéo theo lỗ trống nên cả đám trôi chung dưới điện trường E. ⑤ Đầu dò B đo lúc đám tới: t₀ cho μ, bề rộng cho D, độ hao hụt cho τ.'],
    ['w', '⑥ Hạt đa số lao tới trung hòa điện tích trong τ_d cực ngắn, nên đám hạt luôn gần trung hòa. ⑦ Khi đám còn đó, n và p không còn chung một mức Fermi: cần E_Fn và E_Fp.'],
    ['v', 'Bấm số ①–⑦ trên thanh để vào thí nghiệm chi tiết. Kéo chuột (hoặc các thanh Xoay ngang, Nghiêng, Phóng to) để xoay và zoom khối, bấm vào xung đang chạy để camera zoom vào 1 hạt, làm mờ các hạt khác và đi theo hạt đó tới tấm B (tua chậm, có đuôi quỹ đạo); chọn "Tua chậm" để xem cả xung kỹ hơn; kéo E, τ, pha tạp P, ánh sáng và xem cả chuỗi (đồng hồ bên dưới) đổi theo.']
  ],
  react(S, k, P, say) {
    const K = allCalc(S);
    if (k === 'E') say('w', `E = ${S.E} V/cm: đám tới B sau t₀ = ${Math.round(K.t0)} µs. E lớn thì tới sớm, ít kịp loang và hao hụt.`);
    else if (k === 'tau') say('w', `τ = ${S.tau} µs: L = √(Dτ) = ${(K.L * 1e4).toFixed(0)} µm. Sống lâu thì loang xa hơn và tới B còn nhiều hạt hơn.`);
    else if (k === 'N') say('w', `Pha tạp P = ${pw(S.N)}: μ giảm khi pha tạp nặng, nhưng σ tăng nên τ_d = ${(K.td * 1e12).toFixed(1)} ps còn ngắn hơn. Giả thiết δn ≈ δp càng đúng.`);
    else say('w', `Ánh sáng ${Math.round(S.I * 100)}%: hạt dư δ = ${sci(K.d, 1)} cm⁻³ ⇒ E_Fn − E_Fp = ${K.dEF.toFixed(2)} eV, hệ lệch cân bằng nhiệt càng xa.`);
  }
};
LD.gr = {
  intro: [
    ['i', 'Ở mọi nhiệt độ, nhiệt liên tục "bứt" electron từ vùng hóa trị lên vùng dẫn, tạo cặp electron–lỗ trống: đó là SINH. Electron rơi xuống lấp lỗ trống: đó là TÁI HỢP.'],
    ['w', 'Cân bằng nhiệt không có nghĩa là đứng yên: sinh và tái hợp vẫn diễn ra liên tục, chỉ là bằng nhau nên số hạt không đổi (cán cân bên dưới cân bằng).'],
    ['w', 'Vòng vàng khi hạt xuất hiện là sinh; vòng vàng ở vùng hóa trị khi hạt biến mất là tái hợp.'],
    ['v', 'Kéo thanh Ánh sáng để thêm nguồn sinh thứ hai và xem điều gì xảy ra.']
  ],
  react(S, k, P, say) {
    const M = LABS[0].M || {};
    if (S.I === 0) say('i', 'Tắt sáng: sinh nhiệt trở lại một mình, hệ lùi về cân bằng, n·p = nᵢ².');
    else { say('w', 'Ánh sáng sinh thêm cặp (hạt dư). Sinh lớn hơn tái hợp nên số hạt tăng.');
      say('w', 'Hạt càng nhiều thì càng dễ gặp nhau, tái hợp tăng theo, cho tới khi R đuổi kịp G: trạng thái dừng mới.');
      say('v', 'Lúc này n·p lớn hơn nᵢ² nhiều lần: hệ không còn ở cân bằng nhiệt (Mục 2).'); }
  }
};
LD.rec = {
  intro: [
    ['i', 'Mỗi electron dư sống một thời gian ngẫu nhiên rồi tái hợp. Trung bình thời gian đó là τ (thời gian sống của hạt thiểu số).'],
    ['w', 'Tốc độ mất hạt dư R′ = δn/τ: càng nhiều hạt dư thì càng nhiều hạt mất mỗi giây. Đó là lý do số hạt dư giảm theo hàm mũ.'],
    ['w', 'Bật sáng: δn tăng từ 0 lên g′τ (sinh bằng tái hợp). Tắt sáng: δn(t) = δn(0)·e^(−t/τ).'],
    ['v', 'Đổi τ, g′ hoặc bấm Bật/Tắt. Kim đứt là công thức, kim đặc là số hạt thật đếm được (có nhiễu).']
  ],
  react(S, k, P, say) {
    if (k === 'on') say('w', S.on ? 'Bật sáng: δn leo dần về g′τ, sau 1τ đạt 63%, sau 3τ đạt 95%.' : 'Tắt sáng: δn tụt theo e^(−t/τ), sau 1τ còn 37%, sau 3τ còn 5%.');
    else if (k === 'tau') say('w', `τ = ${S.tau.toFixed(1)} s. τ lớn thì hạt dư sống lâu, kim nhúc nhích chậm hơn và mức dừng g′τ = ${Math.round(S.g * S.tau)} cao hơn.`);
    else say('w', `g′ = ${S.g}/s. Sinh nhiều hơn thì mức dừng cao hơn (g′τ = ${Math.round(S.g * S.tau)}) nhưng kim vẫn chạy với cùng hằng số thời gian τ.`);
  }
};
LD.diff = {
  intro: [
    ['i', 'Phương trình liên tục: hạt trong một khoảng thay đổi vì có hạt chạy vào/ra, được sinh thêm hoặc tái hợp.'],
    ['w', 'Ở đây nguồn giữ nồng độ cố định ở mép trái. Hạt loang sang phải theo khuếch tán (hệ số D) và chết dần (thời gian sống τ).'],
    ['w', 'Hai cơ chế cân bằng nhau tạo ra phân bố mũ δn(x) = δn₀·e^(−x/L), với L = √(Dτ).'],
    ['v', 'Kéo D và τ: vạch vàng đứt là x = L, dải đậm nhạt phía dưới là mật độ hạt.']
  ],
  react(S, k, P, say) {
    const L = Math.sqrt(S.D * S.tau);
    say('v', `D = ${S.D.toFixed(1)}, τ = ${S.tau.toFixed(1)} → L = ${L.toFixed(2)}.`);
    if (k === 'D') say('w', 'D lớn: hạt loang nhanh nên đi xa hơn trước khi chết, L tăng.');
    else say('w', 'τ lớn: hạt sống lâu nên có nhiều thời gian để đi xa, L tăng. Vì L ∝ √τ nên gấp 4 lần τ mới gấp đôi L.');
  }
};
LD.amb = {
  intro: [
    ['i', 'Electron dư và lỗ trống dư sinh ra thành cặp. Electron linh động hơn nên muốn chạy xa hơn lỗ trống.'],
    ['w', 'Nếu chúng thật sự tách ra sẽ sinh điện trường nội kéo ngược lại. Hiệu ứng này mạnh đến mức hai đám phải đi chung: vận chuyển lưỡng cực.'],
    ['w', 'Cả khối đi theo D′ và μ′, là trung bình có trọng số của D, μ hai loại hạt. Hạt nào đông hơn (đa số) thì ít ảnh hưởng, hạt thiểu số quyết định.'],
    ['v', 'Thử chuyển "Tách rời" để thấy nếu không có điện trường nội thì electron sẽ bỏ lỗ trống lại. Kéo n/p để đổi loại bán dẫn.']
  ],
  react(S, k, P, say) {
    const Dl = ambD(S.r), Ml = ambM(S.r), typ = S.r < .1 ? 'loại P' : S.r > 10 ? 'loại N' : 'gần bán dẫn thuần';
    if (k === 'link') say('w', S.link ? 'Đi chung: hai đám dính nhau, chạy với cùng một vận tốc μ′E.' : 'Tách rời (chỉ là giả định để so sánh): electron chạy nhanh còn lỗ trống chậm, hai đám rời nhau. Thực tế không xảy ra vì điện trường nội.');
    else if (k === 'r') { say('v', `n/p = ${pw(S.r)} (${typ}): D′ = ${Dl.toFixed(1)}, μ′ = ${Math.round(Ml)}.`);
      say('w', S.r < .1 ? 'Loại P: D′ ≈ D_n, μ′ ≈ μ_n. Cả khối chạy theo electron, vì electron là hạt thiểu số.' : S.r > 10 ? 'Loại N: D′ ≈ D_p, μ′ ≈ −μ_p. Cả khối chạy theo lỗ trống, hạt thiểu số.' : 'Gần thuần: μ′ → 0, không còn hạt nào là thiểu số, khối gần như không trôi.'); }
    else say('w', 'E tăng: đám lưỡng cực trôi nhanh hơn, vận tốc = μ′E, nhưng vẫn loang rộng như cũ.');
  }
};
LD.pulse = {
  intro: [
    ['i', 'Bắn một xung lỗ trống tại A, điện trường E quét xung về B. Trên đường đi xung vừa dịch (trôi), vừa bè ra (khuếch tán), vừa nhỏ dần (tái hợp).'],
    ['w', 'Đỉnh xung tới B tại t₀ = d/(μE), nên đo t₀ cho ra μ. Độ rộng xung Δt cho ra D. Diện tích còn lại cho ra τ.'],
    ['w', 'Đầu dò tại B nháy khi xung đi qua. Số đo μ, D trên hai đồng hồ gần đúng với giá trị thật (sai lệch nhỏ vì công thức đã xấp xỉ).'],
    ['v', 'Đổi E, μ, τ. Bấm Bắn xung để chạy lại.']
  ],
  react(S, k, P, say) {
    const c = hsCurve(S);
    if (k === 'E') say('w', `E lớn: xung tới B sớm hơn (t₀ = ${Math.round(c.tp)} µs), ít thời gian để bè ra và hao hụt nên xung cao và hẹp hơn.`);
    else if (k === 'mu') say('w', `μ lớn: trôi nhanh hơn, t₀ = ${Math.round(c.tp)} µs. Vì D = μ·kT/e nên D = ${c.D.toFixed(1)} cm²/s cũng tăng theo (hệ thức Einstein).`);
    else say('w', `τ = ${S.tau} µs: tái hợp quyết định phần còn sống khi tới B, diện tích xung còn ${Math.round(Math.exp(-c.tp / S.tau) * 100)}%.`);
  }
};
LD.relax = {
  intro: [
    ['i', 'Bơm vào loại N một cụm lỗ trống mà không có electron đi kèm: ngay lập tức xuất hiện điện tích dương thừa.'],
    ['w', 'Electron đa số (rất đông, rất linh động) bị điện tích dương hút, lao tới bù trừ. Điện tích thừa tan theo ρ(t) = ρ₀·e^(−t/τ_d), τ_d = ε/σ.'],
    ['w', 'Hình dùng "đồng hồ chậm": thời gian thật chỉ cỡ pico giây. Hai đèn bên dưới so τ_d với thời gian sống hạt dư τ.'],
    ['v', 'Kéo pha tạp Nd để xem τ_d đổi.']
  ],
  react(S, k, P, say) {
    const mu = ct(S.N, 'n'), td = 11.7 * 8.854e-14 / (Q * S.N * mu);
    say('v', `Nd = ${pw(S.N)}: σ = ${sci(Q * S.N * mu, 2)} (Ω·cm)⁻¹ → τ_d = ${(td * 1e12).toFixed(2)} ps.`);
    say('w', 'Pha tạp nặng hơn: nhiều electron đa số hơn, độ dẫn lớn hơn, điện tích thừa tan còn nhanh hơn. Vì τ_d ≪ τ nên giả thiết gần trung hòa δn ≈ δp là hợp lý.');
  }
};
LD.qf = {
  intro: [
    ['i', 'Ở cân bằng, một mức Fermi E_F quyết định cả n lẫn p (số chấm xanh, chấm hồng trong ô tối). Khi có hạt dư, n và p tăng độc lập nên một E_F không đủ.'],
    ['w', 'Ta dùng hai mức: E_Fn cho electron (tăng thì n tăng), E_Fp cho lỗ trống (xuống thấp thì p tăng).'],
    ['w', 'Hạt đa số hầu như không đổi nên mức Fermi chuẩn của chúng gần như đứng yên. Hạt thiểu số tăng nhiều bậc nên mức chuẩn của chúng bị kéo đi xa.'],
    ['v', 'Kéo δ (hạt dư) từ nhỏ lên lớn, và đổi loại N/P.']
  ],
  react(S, k, P, say) {
    const q = LABS.find(l => l.id === 'qf').qf();
    say('v', `E_F = ${q.Ef.toFixed(3)}, E_Fn = ${q.Efn.toFixed(3)}, E_Fp = ${q.Efp.toFixed(3)} eV (so với Eᵢ).`);
    say('w', `Hạt đa số (${S.type === 'n' ? 'electron' : 'lỗ trống'}) dịch ${Math.abs((S.type === 'n' ? q.Efn : q.Efp) - q.Ef).toFixed(4)} eV; hạt thiểu số dịch ${Math.abs((S.type === 'n' ? q.Efp : q.Efn) - (S.type === 'n' ? -q.Ef : -q.Ef)).toFixed(3)} eV.`);
    if (q.lli > .1) say('w', 'Hạt dư đã gần bằng hạt đa số: không còn là kích thích mức thấp.');
    else say('i', 'n·p = nᵢ²·e^((E_Fn−E_Fp)/kT): hai mức càng tách xa, hệ càng lệch khỏi cân bằng.');
  }
};
LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP
   ========================================================================== */
const CSS = `
#lab8{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab8[hidden]{display:none}
#lab8 *{box-sizing:border-box}
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
.lb-hall{display:flex;flex-direction:column;background:var(--bg)}
.lb-hall canvas{position:static!important;flex:1;min-height:0;width:100%;height:100%;object-fit:contain}
.lab-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab-m:hover,.lab-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb-win{width:100vw;height:100dvh;border-radius:0}.lb-b{overflow:auto;display:flex;flex-direction:column}.lb-p{min-height:260px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.200 6.200V2"/><path d="M4.600 10h6.800"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'all';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab8'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 8');
  root.innerHTML = '<div class="lb-win"><div class="lb-h"><span class="lb-ic">' + FLASK + '</span><span class="lb-bd">Phòng thí nghiệm · Buổi 8</span><nav class="lb-tabs"></nav><button class="lb-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb-b'); tabsEl = root.querySelector('.lb-tabs');
  LABS.forEach(l => { const b = document.createElement('button'); b.type = 'button'; b.className = 'lb-tab'; b.dataset.id = l.id; b.textContent = l.no + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b); });
  root.querySelector('.lb-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) { const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName); if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty && window.LabB8 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden && (document.getElementById('tb-badge')||{}).textContent === 'Buổi 8') { e.preventDefault(); open(); } return; }
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
  rt[k] = setTimeout(() => { if (cur !== tab || !logEl) return; const P = tab.prev || {}; tab.log.react(tab.S, k, P, say); tab.prev = Object.assign({}, tab.S); tab.M = {}; }, 350);
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
    clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  [...tabsEl.children].forEach(b => b.classList.toggle('on', b.dataset.id === tab.id));
  const mob = innerWidth <= 900;
  if (!mob) { bodyEl.style.display = 'grid'; bodyEl.style.gridTemplateColumns = tab.cols; bodyEl.style.gridTemplateRows = tab.rows; bodyEl.style.gridTemplateAreas = tab.areas; }
  else { bodyEl.style.display = ''; bodyEl.style.gridTemplate = ''; }
  tab.prev = Object.assign({}, tab.S); tab.M = {};
  tab.panels.concat([{ title: 'Nhật ký thí nghiệm', area: 'l', log: true }]).forEach((spec, i) => {
    const el = document.createElement('div'); el.className = 'lb-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb-t"></div><div class="lb-cv">' + (spec.host ? '' : '<canvas></canvas>') + '</div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) { const lg = document.createElement('div'); lg.className = 'lb-log'; lg.setAttribute('aria-live', 'polite'); el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el); curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 250 + j * 900))); return; }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.onClick && cv) {
      cv.style.cursor = 'pointer'; cv.style.touchAction = 'none'; let dn = null;
      cv.addEventListener('pointerdown', ev => { dn = { x: ev.clientX, y: ev.clientY, mv: 0 }; });
      cv.addEventListener('pointermove', ev => { if (!dn) return; const dx = ev.clientX - dn.x, dy = ev.clientY - dn.y; dn.mv += Math.abs(dx) + Math.abs(dy); dn.x = ev.clientX; dn.y = ev.clientY; if (spec.onDrag && dn.mv > 6) spec.onDrag(p, dx, dy); });
      const up = ev => { if (dn && dn.mv <= 6 && ev.type === 'pointerup') { const r = cv.getBoundingClientRect(); spec.onClick(p, ev.clientX - r.left, ev.clientY - r.top); } dn = null; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      if (spec.onWheel) cv.addEventListener('wheel', ev => { ev.preventDefault(); spec.onWheel(p, ev.deltaY); }, { passive: false });
    }
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
    const b = document.getElementById('tb-lab'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- dấu hiệu tinh tế trong bài: biểu tượng bình thí nghiệm nhỏ cạnh tiêu đề ---------- */
const H3MAP = [[/^8\.[12]/, 'rec', 0], [/^8\.3/, 'diff', 0], [/^8\.4/, 'pulse', 0], [/^3\.4/, 'rec', 1], [/^9\.2/, 'relax', 0], [/^10\./, 'pulse', 1], [/^11\.2/, 'qf', 0], [/^6\.4/, 'amb', 1]];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab-m')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-m'; b.innerHTML = FLASK;
  b.setAttribute('aria-label', 'Xem thí nghiệm: ' + title); b.title = 'Xem thí nghiệm';
  b.onclick = e => { e.preventDefault(); e.stopPropagation(); open(id, pi); }; h.appendChild(b);
}
function markLesson(rootEl) {
  if (!rootEl) return;
  rootEl.querySelectorAll('h2').forEach(h => { const m = /^\s*(\d+)\./.exec(h.textContent); if (!m) return; const l = LABS.find(x => x.secs.includes(+m[1])); if (l) addMark(h, l.id, null, l.name); });
  rootEl.querySelectorAll('h3').forEach(h => { const t = h.textContent.trim(); const r = H3MAP.find(x => x[0].test(t)); if (r) addMark(h, r[1], r[2], t); });
}

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 8') markLesson(document.getElementById('app-content'));
window.LabB8 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
