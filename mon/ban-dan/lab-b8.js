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
  cols: '1.5fr 1fr', rows: '1.4fr 1fr', areas: '"a l" "c l"',
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
    { title: 'Cán cân sinh – tái hợp', area: 'c',
      anim: true,
      draw(p, ctx, W, H) {
        const M = p.tab.M; if (M.G == null) return;
        const bx = 70, bw = W - bx - 16, mx = 22, bh = 16;
        [['Sinh G', M.G, C.c1], ['Tái hợp R', M.R, C.c3]].forEach((r, i) => {
          const y = 14 + i * 34; txt(ctx, r[0], 12, y + bh / 2, C.mut, 12, 'left', 700);
          rr(ctx, bx, y, bw, bh, 5); ctx.fillStyle = C.tint; ctx.fill(); rr(ctx, bx, y, Math.max(2, bw * clamp(r[1] / mx, 0, 1)), bh, 5); ctx.fillStyle = r[2]; ctx.fill();
        });
        const ratio = Math.pow(M.N / N0P, 2), y = 14 + 2 * 34 + 8;
        txt(ctx, 'n·p ÷ nᵢ² = ' + ratio.toFixed(1), 12, y + 8, C.ink, 14, 'left', 700);
        rr(ctx, bx, y + 24, bw, bh, 5); ctx.fillStyle = C.tint; ctx.fill();
        const f = clamp(Math.log10(Math.max(1, ratio)) / 2, 0, 1); rr(ctx, bx, y + 24, Math.max(2, bw * f), bh, 5); ctx.fillStyle = Math.abs(M.G - M.R) < 2 ? C.c2 : C.main; ctx.fill();
        txt(ctx, '1', bx, y + 24 + bh + 10, C.sub, 10.5, 'left', 600); txt(ctx, '100', bx + bw, y + 24 + bh + 10, C.sub, 10.5, 'right', 600);
        if (Math.abs(M.G - M.R) < 2) txt(ctx, 'G ≈ R: cân bằng', W - 12, y + 8, C.c2, 12, 'right', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 2 — TÁI HỢP & THỜI GIAN SỐNG (Mục 3, 8.1, 8.2)
   ========================================================================== */
LABS.push({
  id: 'rec', name: 'Thời gian sống', no: '3', secs: [3],
  S: { tau: 1.5, g: 20, on: 1 },
  cols: '1.4fr 1fr', rows: '1.2fr 1fr', areas: '"a l" "c l"',
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
    { title: 'Số hạt dư theo thời gian (nét đứt: công thức)', area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, M = p.tab.M; if (!M.hist) return; const ev = M.ev, win = 14, mx = 14, my = 22, pw = W - 2 * mx, ph = H - my - 16;
        let ymax = Math.max(10, ev.Ninf, ...M.hist.map(h => h[1])) * 1.15; M.ym = M.ym ? M.ym + (ymax - M.ym) * .05 : ymax; ymax = M.ym;
        const X = tt => mx + (tt - (M.t - win)) / win * pw, Y = v => my + ph - v / ymax * ph;
        ln(ctx, mx, my + ph, mx + pw, my + ph, C.sub, 1.2);
        if (ev.Ninf > 0) { ln(ctx, mx, Y(ev.Ninf), mx + pw, Y(ev.Ninf), C.c2, 1, [4, 4]); txt(ctx, "g′τ = " + Math.round(ev.Ninf), mx + 4, Y(ev.Ninf) - 8, C.c2, 11, 'left', 700); }
        ctx.beginPath(); M.hist.forEach((h, i) => i ? ctx.lineTo(X(h[0]), Y(h[1])) : ctx.moveTo(X(h[0]), Y(h[1]))); ctx.strokeStyle = C.c2; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.beginPath(); let st = false; for (let tt = Math.max(ev.ts, M.t - win); tt <= M.t; tt += .15) { const v = ev.Ninf + (ev.N0 - ev.Ninf) * Math.exp(-(tt - ev.ts) / ev.tau); st ? ctx.lineTo(X(tt), Y(v)) : ctx.moveTo(X(tt), Y(v)); st = true; }
        ctx.setLineDash([5, 4]); ctx.strokeStyle = C.main; ctx.lineWidth = 1.8; ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, 'δn(t)', mx + 2, 12, C.mut, 11.5, 'left', 700);
        const k = Math.round((S.on ? 1 - Math.exp(-(M.t - ev.ts) / ev.tau) : Math.exp(-(M.t - ev.ts) / ev.tau)) * 100);
        txt(ctx, 'sau ' + Math.max(0, (M.t - ev.ts)).toFixed(1) + ' s: ' + (S.on ? 'đạt ' : 'còn ') + k + '%', W - 12, 12, C.ink, 11.5, 'right', 700);
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
  cols: '1.5fr 1fr', rows: '1.5fr 1fr', areas: '"a l" "c l"',
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
        const h0 = Math.max(1, (M.h[0] + M.h[1]) / 2), mxh = h0 * 1.25, bwd = bw / NB;
        ln(ctx, bx, hy + hh, bx + bw, hy + hh, C.sub, 1.2);
        M.h.forEach((v, i) => { const hgt = clamp(v / mxh, 0, 1) * hh; ctx.globalAlpha = .55; ctx.fillStyle = C.c2; ctx.fillRect(bx + i * bwd + 1, hy + hh - hgt, bwd - 2, hgt); ctx.globalAlpha = 1; });
        ctx.beginPath(); for (let i = 0; i <= 60; i++) { const x = i / 60 * SLAB, v = h0 * Math.exp(-(x - SLAB / NB / 2) / L); const px = bx + x / SLAB * bw, py = hy + hh - clamp(v / mxh, 0, 1) * hh; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.strokeStyle = C.main; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, 'mật độ δn(x): cột = đo, đường = e^(−x/L)', bx + 4, hy + 8, C.mut, 11, 'left', 600);
      } },
    { title: 'L = √(D·τ)', area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, L = Math.sqrt(S.D * S.tau);
        txt(ctx, 'L = √(' + S.D.toFixed(1) + ' × ' + S.tau.toFixed(1) + ') = ' + L.toFixed(2), W / 2, H * .22, C.ink, 16, 'center', 700);
        const bx = 20, bw = W - 40, y = H * .45, h = 26;
        const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); for (let i = 0; i <= 10; i++) g.addColorStop(i / 10, 'rgba(120,200,240,' + Math.exp(-i / 10 * 4) + ')');
        rr(ctx, bx, y, bw, h, 6); ctx.fillStyle = C.tint; ctx.fill(); rr(ctx, bx, y, bw, h, 6); ctx.fillStyle = g; ctx.fill();
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
  cols: '1.5fr 1fr', rows: '1.3fr 1fr', areas: '"a l" "c l"',
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
    { title: 'Hệ số lưỡng cực theo loại bán dẫn', area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, r = S.r, Dl = ambD(r), Ml = ambM(r), bx = 80, bw = W - bx - 16;
        const bar = (y, lab, v, lo, hi, marks) => {
          txt(ctx, lab, 10, y + 8, C.ink, 12.5, 'left', 700);
          rr(ctx, bx, y, bw, 16, 5); ctx.fillStyle = C.tint; ctx.fill();
          const X = vv => bx + (vv - lo) / (hi - lo) * bw; const z = X(0);
          ctx.fillStyle = C.main; ctx.fillRect(Math.min(z, X(v)), y + 2, Math.abs(X(v) - z), 12);
          marks.forEach(m => { ln(ctx, X(m[0]), y - 3, X(m[0]), y + 19, C.sub, 1.2); txt(ctx, m[1], X(m[0]), y + 30, C.sub, 10.5, 'center', 600); });
        };
        bar(18, 'D′', Dl, 0, 40, [[DP, 'D_p'], [DN, 'D_n']]);
        bar(H * .52, 'μ′', Ml, -600, 1500, [[-MUP, '−μ_p'], [0, '0'], [MUN, 'μ_n']]);
        txt(ctx, 'D′ = ' + Dl.toFixed(1) + ' cm²/s    μ′ = ' + Math.round(Ml) + ' cm²/V·s', W / 2, H - 12, C.ink, 12.5, 'center', 700);
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
  cols: '1.5fr 1fr', rows: '1fr 1.15fr', areas: '"a l" "c l"',
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
    { title: 'Tín hiệu đọc tại B (như trên máy hiện sóng)', area: 'c', anim: true,
      draw(p, ctx, W, H) {
        const S = p.S, M = p.tab.M, c = hsCurve(S), mx = 14, my = 18, pw = W - 2 * mx, ph = H * .5;
        const X = t => mx + t / c.tm * pw, Y = y => my + ph - y / c.mx * ph * .95;
        ln(ctx, mx, my + ph, mx + pw, my + ph, C.sub, 1.2);
        ctx.beginPath(); c.ts.forEach((t, i) => i ? ctx.lineTo(X(t), Y(c.ys[i])) : ctx.moveTo(X(t), Y(c.ys[i]))); ctx.strokeStyle = C.c4; ctx.lineWidth = 2.4; ctx.stroke();
        ln(ctx, X(c.tp), my, X(c.tp), my + ph, C.main, 1.2, [4, 4]); txt(ctx, 't₀', X(c.tp), my + ph + 11, C.main, 12, 'center', 700);
        const yh = Y(c.mx / Math.E); ln(ctx, X(c.t1), yh, X(c.t2), yh, C.c2, 2.2); txt(ctx, 'Δt', (X(c.t1) + X(c.t2)) / 2, yh - 9, C.c2, 12, 'center', 700);
        if (M.tmNow != null) { const x = X(Math.min(M.tmNow, c.tm)); ln(ctx, x, my, x, my + ph, C.err, 1.4); }
        const dt_ = c.t2 - c.t1, muM = 1e6 / (S.E * c.tp), DM = Math.pow(muM * S.E * dt_ * 1e-6, 2) / (16 * c.tp * 1e-6);
        const y0 = my + ph + 32;
        txt(ctx, 'μ = d/(E·t₀) = ' + Math.round(muM) + '   (thật ' + S.mu + ')', 12, y0, C.ink, 12.5, 'left', 700);
        txt(ctx, 'D = (μEΔt)²/(16t₀) = ' + DM.toFixed(1) + '   (thật ' + c.D.toFixed(1) + ')', 12, y0 + 20, C.ink, 12.5, 'left', 700);
        txt(ctx, 'diện tích ∝ e^(−t₀/τ) = ' + Math.round(Math.exp(-c.tp / S.tau) * 100) + '%', 12, y0 + 40, C.main, 12.5, 'left', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 6 — PHỤC HỒI ĐIỆN MÔI (Mục 9)
   ========================================================================== */
LABS.push({
  id: 'relax', name: 'Phục hồi điện môi', no: '9', secs: [9],
  S: { N: 1e16 },
  cols: '1.5fr 1fr', rows: '1.4fr 1fr', areas: '"a l" "c l"',
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
        const rad = 90; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, 'rgba(230,100,150,' + (.55 * sig) + ')'); g.addColorStop(1, 'rgba(230,100,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU2); ctx.fill();
        M.el.forEach(e => { dot(ctx, bx + 8 + e.x * (bw - 16) + Math.sin(M.t * 4 + e.jt) * 2, by + 8 + e.y * (bh - 16) + Math.cos(M.t * 3 + e.jt) * 2, 3, C.c2); });
        M.arr.forEach(a => { const f = clamp(1 - Math.exp(-0), 0, 1); const prog = tp > a.tA ? clamp((tp - a.tA) / .35, 0, 1) : 0; const ex = a.sx + (cx + Math.cos(a.a) * a.r - a.sx) * prog, ey = a.sy + (cy + Math.sin(a.a) * a.r - a.sy) * prog; dot(ctx, ex, ey, 4.5, C.c2); });
        M.hl.forEach(h => { dot(ctx, cx + Math.cos(h.a) * h.r, cy + Math.sin(h.a) * h.r, 5.5, C.c4); txt(ctx, '+', cx + Math.cos(h.a) * h.r, cy + Math.sin(h.a) * h.r + .5, C.bg, 11, 'center', 800); });
        txt(ctx, 'đồng hồ chậm: t = ' + (tp / TS * td * 1e12).toFixed(2) + ' ps', 14, 14, C.main, 12.5, 'left', 700);
        txt(ctx, 'τ_d = ' + (td * 1e12).toFixed(2) + ' ps', W - 14, 14, C.ink, 12.5, 'right', 700);
        M.td = td; M.sig = sig;
      } },
    { title: 'Điện tích thừa tan nhanh hơn mọi thứ khác', area: 'c', anim: true,
      draw(p, ctx, W, H) {
        const M = p.tab.M; if (!M.td) return; const lo = -15, hi = -3, bx = 16, bw = W - 32, y = H * .42;
        const X = v => bx + (Math.log10(v) - lo) / (hi - lo) * bw;
        ln(ctx, bx, y, bx + bw, y, C.sub, 2);
        [-15, -12, -9, -6, -3].forEach(e => { ln(ctx, X(Math.pow(10, e)), y - 4, X(Math.pow(10, e)), y + 4, C.sub, 1.5); txt(ctx, e === -15 ? 'fs' : e === -12 ? 'ps' : e === -9 ? 'ns' : e === -6 ? 'µs' : 'ms', X(Math.pow(10, e)), y + 18, C.sub, 11, 'center', 600); });
        const tau = 1e-7;
        dot(ctx, X(M.td), y, 7, C.c4); txt(ctx, 'τ_d', X(M.td), y - 18, C.c4, 13, 'center', 700);
        dot(ctx, X(tau), y, 7, C.c2); txt(ctx, 'τ (≈0,1 µs)', X(tau), y - 18, C.c2, 13, 'center', 700);
        txt(ctx, 'τ ÷ τ_d ≈ ' + sci(tau / M.td, 1), W / 2, H - 16, C.ink, 14, 'center', 700);
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
    { title: 'Giản đồ năng lượng: một mức Fermi hay hai?', area: 'a',
      ctrls: [{ k: 'type', seg: [['n', 'Loại N'], ['p', 'Loại P']] }, { k: 'N', l: 'pha tạp', min: 14, max: 18, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }, { k: 'd', l: 'δn = δp', min: 8, max: 17, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }],
      draw(p, ctx, W, H) {
        const q = p.tab.qf(), top = 28, bot = H - 36, mid = (top + bot) / 2, sc = (bot - top) / 1.5, Y = e => mid - e * sc, hg = .56;
        const side = (x0, x1, title, lines) => {
          txt(ctx, title, (x0 + x1) / 2, 12, C.mut, 12, 'center', 700);
          ctx.fillStyle = C.tint; ctx.fillRect(x0, top - 6, x1 - x0, Y(hg) - top + 6); ctx.fillRect(x0, Y(-hg), x1 - x0, bot + 6 - Y(-hg));
          ln(ctx, x0, Y(hg), x1, Y(hg), C.sub, 2.5); ln(ctx, x0, Y(-hg), x1, Y(-hg), C.sub, 2.5);
          txt(ctx, 'Ec', x0 + 6, Y(hg) - 9, C.sub, 11, 'left', 700); txt(ctx, 'Ev', x0 + 6, Y(-hg) + 10, C.sub, 11, 'left', 700);
          ln(ctx, x0, Y(0), x1, Y(0), C.sub, 1.2, [4, 4]); txt(ctx, 'Eᵢ', x1 - 6, Y(0) - 8, C.sub, 11, 'right', 700);
          lines.forEach(l => { const e = clamp(l[0], -hg + .02, hg - .02); ln(ctx, x0, Y(e), x1, Y(e), l[2], l[3] || 2.6, l[4]); txt(ctx, l[1] + ' ' + (l[0] >= 0 ? '+' : '−') + Math.abs(l[0]).toFixed(3), (x0 + x1) / 2, Y(e) + (l[5] || -9), l[2], 12, 'center', 700); });
        };
        side(W * .04, W * .44, 'Cân bằng (tối)', [[q.Ef, 'E_F', C.main, 2.8, 0, -9]]);
        const gap = Math.abs(q.Efn - q.Efp);
        side(W * .56, W * .96, 'Có hạt dư (sáng)', [[q.Efn, 'E_Fn', C.c2, 2.8, 0, q.Efn >= q.Efp ? -9 : 12], [q.Efp, 'E_Fp', C.c4, 2.8, 0, q.Efn >= q.Efp ? 12 : -9]]);
        arr(ctx, W * .46, mid, W * .54, mid, C.sub, 2);
        txt(ctx, 'E_Fn − E_Fp = ' + (q.Efn - q.Efp).toFixed(3) + ' eV', W / 2, H - 12, C.ink, 12.5, 'center', 700);
      } }
  ]
});

/* ==========================================================================
   NHẬT KÝ GIẢI THÍCH. Loại dòng: i = nguyên lý · w = cơ chế · v = số liệu
   ========================================================================== */
const LD = {};
const pw = v => p10(Math.round(Math.log10(v)));
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
    ['w', 'Tốc độ mất hạt dư R′ = δn/τ: càng nhiều hạt dư thì càng nhiều hạt mất mỗi giây. Đó là lý do ra đường cong hàm mũ.'],
    ['w', 'Bật sáng: δn tăng từ 0 lên g′τ (sinh bằng tái hợp). Tắt sáng: δn(t) = δn(0)·e^(−t/τ).'],
    ['v', 'Đổi τ, g′ hoặc bấm Bật/Tắt. Nét đứt là công thức, nét liền là số hạt thật đếm được (có nhiễu).']
  ],
  react(S, k, P, say) {
    if (k === 'on') say('w', S.on ? 'Bật sáng: δn leo dần về g′τ, sau 1τ đạt 63%, sau 3τ đạt 95%.' : 'Tắt sáng: δn tụt theo e^(−t/τ), sau 1τ còn 37%, sau 3τ còn 5%.');
    else if (k === 'tau') say('w', `τ = ${S.tau.toFixed(1)} s. τ lớn thì hạt dư sống lâu, đường cong thoải hơn và mức dừng g′τ = ${Math.round(S.g * S.tau)} cao hơn.`);
    else say('w', `g′ = ${S.g}/s. Sinh nhiều hơn thì mức dừng cao hơn (g′τ = ${Math.round(S.g * S.tau)}) nhưng đường cong vẫn có cùng hằng số thời gian τ.`);
  }
};
LD.diff = {
  intro: [
    ['i', 'Phương trình liên tục: hạt trong một khoảng thay đổi vì có hạt chạy vào/ra, được sinh thêm hoặc tái hợp.'],
    ['w', 'Ở đây nguồn giữ nồng độ cố định ở mép trái. Hạt loang sang phải theo khuếch tán (hệ số D) và chết dần (thời gian sống τ).'],
    ['w', 'Hai cơ chế cân bằng nhau tạo ra phân bố mũ δn(x) = δn₀·e^(−x/L), với L = √(Dτ).'],
    ['v', 'Kéo D và τ: nét vàng đứt là x = L, cột xanh là mật độ hạt đo được.']
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
    ['w', 'Đồ thị dưới là tín hiệu tại B. Số đo μ, D từ đường cong gần đúng với giá trị thật (sai lệch nhỏ vì công thức đã xấp xỉ).'],
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
    ['w', 'Hình dùng "đồng hồ chậm": thời gian thật chỉ cỡ pico giây. Đồ thị dưới so τ_d với thời gian sống hạt dư τ.'],
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
    ['i', 'Ở cân bằng, một mức Fermi E_F quyết định cả n lẫn p. Khi có hạt dư, n và p tăng độc lập nên một E_F không đủ.'],
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
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'gr';

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
