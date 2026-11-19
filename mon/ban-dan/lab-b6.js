/* ==========================================================================
   lab-b6.js — PHÒNG THÍ NGHIỆM BUỔI 6 (popup 95% màn hình)
   - Tự chứa, cùng khung với lab-b7.js. 7 tab ứng với các mục của Buổi 6.
   - API: LabB6.open(tabId?, panelIndex?)  LabB6.close()  LabB6.mark(root)
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

/* ---------- vật lý dùng chung cho Buổi 6 (năng lượng tính từ E_c = 0, E_v = −Eg) ---------- */
const EG = 1.12, NC0 = 2.8e19, NV0 = 1.04e19, ED = .045;
const NCT = T => NC0 * Math.pow(T / 300, 1.5), NVT = T => NV0 * Math.pow(T / 300, 1.5);
const NI = T => 1.5e10 * Math.pow(T / 300, 1.5) * Math.exp(-EG / (2 * KB) * (1 / T - 1 / 300));
function F12(eta) {            // tích phân Fermi–Dirac F_1/2(η) (không chuẩn hóa)
  if (eta < -25) return Math.sqrt(Math.PI) / 2 * Math.exp(eta);
  const um = Math.sqrt(Math.max(eta, 0) + 40), n = 300, h = um / n; let s = 0;
  for (let i = 0; i <= n; i++) { const u = i * h, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; s += w * 2 * u * u / (1 + Math.exp(Math.min(u * u - eta, 700))); }
  return s * h / 3;
}
const nFD = (N, eta) => 2 / Math.sqrt(Math.PI) * N * F12(eta);
function etaFor(ratio) {       // tìm η sao cho (2/√π)F(η) = ratio
  let lo = -40, hi = 60; for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; (2 / Math.sqrt(Math.PI) * F12(m) < ratio) ? lo = m : hi = m; } return (lo + hi) / 2;
}
const ex = x => Math.exp(clamp(x, -300, 300));
function solveEF(T, Nd, Na) {   // giải phương trình trung hòa điện tích, trả E_F (eV, E_c = 0)
  const kT = KB * T, nc = NCT(T), nv = NVT(T);
  const f = E => { const n = nFD(nc, E / kT), p = nFD(nv, (-EG - E) / kT), dp = Nd / (1 + 2 * ex((E + ED) / kT)), an = Na / (1 + .25 * ex((-EG + ED - E) / kT)); return n + an - p - dp; };
  let lo = -EG - .3, hi = .4; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; f(m) < 0 ? lo = m : hi = m; } 
  const E = (lo + hi) / 2, n = nFD(nc, E / kT), p = nFD(nv, (-EG - E) / kT), dp = Nd / (1 + 2 * ex((E + ED) / kT));
  return { E, n, p, ionD: Nd ? dp / Nd : 1, Ei: -EG / 2 + kT / 2 * Math.log(nv / nc) };
}
const lg = v => Math.log10(Math.max(v, 1e-30));

/* ==========================================================================
   TAB 1 — MỨC FERMI QUYẾT ĐỊNH n₀, p₀ (Mục 1–2)
   ========================================================================== */
LABS.push({
  id: 'ef', name: 'Mức Fermi & n₀p₀', no: '1–2', secs: [1, 2],
  S: { dE: .2, T: 300 },
  cols: '1.5fr 1fr', rows: '1.5fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Kéo mức Fermi: dải dẫn đông lên hay vắng đi?', area: 'a', anim: true,
      ctrls: [{ k: 'dE', l: 'E_F − E_Fi', min: -.55, max: .55, step: .01, f: v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + ' eV' }, { k: 'T', l: 'T', min: 250, max: 500, step: 10, f: v => v + ' K' }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, M = p.tab.M, kT = KB * S.T, ni = NI(S.T), n0 = ni * ex(S.dE / kT), p0 = ni * ex(-S.dE / kT);
        const top = 14, bot = H - 14, Y = e => top + (EG / 2 + .3 - e) / (EG + .6) * (bot - top), cbY = Y(EG / 2), vbY = Y(-EG / 2), x0 = 12, x1 = W - 12;
        const dn = Math.round(clamp((lg(n0) - 5) / 15 * 34, 0, 34)), dp = Math.round(clamp((lg(p0) - 5) / 15 * 34, 0, 34));
        if (!M.e) { M.e = Array.from({ length: 36 }, () => [Math.random(), Math.random()]); M.h = Array.from({ length: 36 }, () => [Math.random(), Math.random()]); }
        ctx.fillStyle = C.tint; ctx.fillRect(x0, top, x1 - x0, cbY - top); ctx.fillRect(x0, vbY, x1 - x0, bot - vbY);
        ln(ctx, x0, cbY, x1, cbY, C.sub, 2.5); ln(ctx, x0, vbY, x1, vbY, C.sub, 2.5);
        txt(ctx, 'Vùng dẫn', x0 + 6, top + 10, C.mut, 11.5, 'left', 700); txt(ctx, 'Vùng hóa trị', x0 + 6, bot - 10, C.mut, 11.5, 'left', 700);
        ln(ctx, x0, Y(0), x1, Y(0), C.sub, 1.2, [4, 4]); txt(ctx, 'E_Fi', x1 - 4, Y(0) - 8, C.sub, 11, 'right', 700);
        M.e.forEach((q, i) => { if (i >= dn) return; q.push; const X = x0 + 60 + q[0] * (x1 - x0 - 80), yy = top + 14 + q[1] * (cbY - top - 26) + Math.sin(t * 3 + i) * 2; dot(ctx, X, yy, 5, C.c2); });
        M.h.forEach((q, i) => { if (i >= dp) return; const X = x0 + 60 + q[0] * (x1 - x0 - 80), yy = vbY + 12 + q[1] * (bot - vbY - 24) + Math.cos(t * 3 + i) * 2; dot(ctx, X, yy, 5, C.c4); });
        const yf = Y(clamp(S.dE, -EG / 2 + .01, EG / 2 - .01)); ln(ctx, x0, yf, x1, yf, C.main, 3); txt(ctx, 'E_F', x0 + 6, yf - 9, C.main, 12.5, 'left', 700);
        txt(ctx, S.dE > .02 ? 'loại N' : S.dE < -.02 ? 'loại P' : 'thuần', x1 - 6, (cbY + vbY) / 2, C.ink, 14, 'right', 700);
      } },
    { title: 'n₀ và p₀ ngược nhau, tích luôn là nᵢ²', area: 'c', anim: true,
      draw(p, ctx, W, H) {
        const S = p.S, kT = KB * S.T, ni = NI(S.T), n0 = ni * ex(S.dE / kT), p0 = ni * ex(-S.dE / kT), bx = 56, bw = W - bx - 14, mx = 22;
        [['n₀', n0, C.c2], ['p₀', p0, C.c4], ['n₀·p₀', n0 * p0, C.main]].forEach((r, i) => {
          const y = 12 + i * 34; txt(ctx, r[0], 10, y + 9, C.ink, 12.5, 'left', 700);
          rr(ctx, bx, y, bw, 18, 5); ctx.fillStyle = C.tint; ctx.fill(); rr(ctx, bx, y, Math.max(3, bw * clamp(lg(r[1]) / mx, 0, 1)), 18, 5); ctx.fillStyle = r[2]; ctx.fill();
          txt(ctx, sci(r[1], 1), bx + bw - 6, y + 9, C.bg, 11.5, 'right', 700);
        });
        txt(ctx, 'thang log: 10⁰ → 10²²  cm⁻³,  nᵢ = ' + sci(ni, 1), W / 2, H - 14, C.sub, 11, 'center', 600);
      } }
  ]
});

/* ==========================================================================
   TAB 2 — FERMI–DIRAC & SUY BIẾN (Mục 3–4)
   ========================================================================== */
LABS.push({
  id: 'fd', name: 'Fermi–Dirac', no: '3–4', secs: [3, 4],
  S: { eta: -2 },
  cols: '1.5fr 1fr', rows: '1.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Các trạng thái trong dải dẫn đầy đến đâu?', area: 'a',
      ctrls: [{ k: 'eta', l: 'η_F', min: -6, max: 5, step: .1, f: v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) }],
      draw(p, ctx, W, H) {
        const S = p.S, lo = -4, hi = 8, top = 14, bot = H - 22, Y = e => bot - (e - lo) / (hi - lo) * (bot - top), x0 = 60, x1 = W - 14, cells = 14, rows = 13;
        txt(ctx, 'Gap', 30, Y(-2), C.sub, 11, 'center', 700);
        ctx.fillStyle = C.tint; ctx.fillRect(x0 - 8, top, x1 - x0 + 16, Y(0) - top);
        ln(ctx, x0 - 8, Y(0), x1 + 8, Y(0), C.sub, 2.5); txt(ctx, 'E_c', 30, Y(0), C.sub, 12, 'center', 700);
        for (let r = 0; r < rows; r++) { const e = .5 + r * (hi - .5) / rows * .98, y = Y(e), rh = Math.min(14, (bot - top) / (hi - lo) * (hi - .5) / rows * .98 - 3), f = 1 / (1 + Math.exp(e - S.eta)), k = Math.round(f * cells), cw = (x1 - x0) / cells;
          for (let c = 0; c < cells; c++) { ctx.fillStyle = c < k ? C.c2 : C.bg; ctx.globalAlpha = c < k ? .9 : 1; ctx.fillRect(x0 + c * cw + 1, y - rh / 2, cw - 2, rh); ctx.globalAlpha = 1; } }
        const yf = Y(S.eta); ln(ctx, 40, yf, x1 + 8, yf, C.main, 3); txt(ctx, 'E_F', 36, yf - 10, C.main, 12.5, 'center', 700);
        const d = -S.eta; txt(ctx, d >= 3 ? 'E_F cách E_c ' + d.toFixed(1) + ' kT (≥ 3): không suy biến' : S.eta > 0 ? 'E_F nằm trong dải dẫn: SUY BIẾN' : 'E_F cách E_c chưa tới 3kT: sắp suy biến', (x0 + x1) / 2, bot + 10, S.eta > 0 ? C.err : d >= 3 ? C.c2 : C.main, 12.5, 'center', 700);
      } },
    { title: 'n₀ chính xác so với công thức Boltzmann', area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, fd = 2 / Math.sqrt(Math.PI) * F12(S.eta), bo = Math.exp(S.eta), bx = 80, bw = W - bx - 14;
        const bar = (y, lab, v, col) => { txt(ctx, lab, 10, y + 9, C.ink, 12, 'left', 700); rr(ctx, bx, y, bw, 18, 5); ctx.fillStyle = C.tint; ctx.fill(); rr(ctx, bx, y, Math.max(3, bw * clamp((lg(v) + 3) / 6, 0, 1)), 18, 5); ctx.fillStyle = col; ctx.fill(); txt(ctx, v.toPrecision(2), bx + bw - 6, y + 9, C.bg, 11.5, 'right', 700); };
        bar(12, 'Fermi–Dirac', fd, C.c2); bar(44, 'Boltzmann', bo, C.main);
        const r = bo / fd; txt(ctx, 'Boltzmann ' + (r > 1.05 ? 'đoán lố ' + r.toFixed(2) + ' lần' : 'sai dưới 5%: dùng được'), W / 2, 92, r > 1.05 ? C.err : C.c2, 13, 'center', 700);
        txt(ctx, 'đơn vị: n₀/N_c, thang log 10⁻³ … 10³', W / 2, H - 12, C.sub, 11, 'center', 600);
      } }
  ]
});

/* ==========================================================================
   TAB 3 — ION HÓA DONOR, ĐÓNG BĂNG (Mục 5–6)
   ========================================================================== */
LABS.push({
  id: 'ion', name: 'Ion hóa & đóng băng', no: '5–6', secs: [5, 6],
  S: { T: 300, N: 1e16 },
  cols: '1.5fr 1fr', rows: '1.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Donor nhả electron lên dải dẫn khi đủ nóng', area: 'a', anim: true,
      ctrls: [{ k: 'T', l: 'T', min: 20, max: 700, step: 10, f: v => v + ' K' }, { k: 'N', l: 'N_d', min: 14, max: 18, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, M = p.tab.M, key = S.T + '|' + S.N; if (M.key !== key) { M.key = key; M.r = solveEF(S.T, S.N, 0); }
        const r = M.r, K = 26, cb = H * .42, x0 = 14, x1 = W - 14, ion = Math.round(K * clamp(r.ionD, 0, 1));
        if (!M.q) M.q = Array.from({ length: K }, () => [Math.random(), Math.random(), Math.random() * 6]);
        ctx.fillStyle = C.tint; ctx.fillRect(x0, 10, x1 - x0, cb - 10); ln(ctx, x0, cb, x1, cb, C.sub, 2.5); txt(ctx, 'Vùng dẫn', x0 + 6, 22, C.mut, 11.5, 'left', 700);
        const yd = cb + 34; ln(ctx, x0, yd, x1, yd, C.c5, 1.4, [5, 4]); txt(ctx, 'mức donor E_d', x1 - 6, yd + 12, C.c5, 11, 'right', 700);
        const yv = H - 16; ln(ctx, x0, yv, x1, yv, C.sub, 2.5); txt(ctx, 'Vùng hóa trị', x0 + 6, yv - 10, C.mut, 11.5, 'left', 700);
        for (let i = 0; i < K; i++) { const X = x0 + 20 + (i + .5) / K * (x1 - x0 - 40), q = M.q[i];
          if (i < ion) { dot(ctx, X, yd, 4, C.err); txt(ctx, '+', X, yd + .5, C.bg, 8, 'center', 800); const ex_ = 10 + (x0 + 10 + q[0] * (x1 - x0 - 20) - X) * 0 + Math.sin(t * 2 + q[2]) * 0, ey = 22 + q[1] * (cb - 40); dot(ctx, x0 + 10 + ((q[0] + t * .05 * (1 + q[1])) % 1) * (x1 - x0 - 20), ey, 5, C.c2); }
          else { dot(ctx, X, yd, 6, C.c2); }
        }
        txt(ctx, 'đã ion hóa ' + Math.round(r.ionD * 100) + '%', x1 - 8, 22, C.ink, 13, 'right', 700);
        txt(ctx, 'chấm xanh trên mức E_d = electron còn kẹt; chấm đỏ + = donor đã nhả', W / 2, yd + 30, C.sub, 11, 'center', 600);
      } },
    { title: 'Đang ở chặng nào?', area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, M = p.tab.M, r = M.r || solveEF(S.T, S.N, 0), ni = NI(S.T);
        const reg = r.ionD < .85 ? ['ĐÓNG BĂNG: donor chưa nhả hết', C.c5] : ni > .3 * S.N ? ['NỘI TẠI: hạt tải nhiệt áp đảo', C.err] : ['ION HÓA HOÀN TOÀN: n₀ ≈ N_d', C.c2];
        txt(ctx, reg[0], W / 2, H * .22, reg[1], 15, 'center', 700);
        txt(ctx, 'n₀ = ' + sci(r.n, 2) + ' cm⁻³', W / 2, H * .5, C.ink, 15, 'center', 700);
        txt(ctx, 'n₀ / N_d = ' + (r.n / S.N).toFixed(2), W / 2, H * .72, C.mut, 13, 'center', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 4 — BÙ TRỪ (Mục 7)
   ========================================================================== */
LABS.push({
  id: 'comp', name: 'Bù trừ', no: '7', secs: [7],
  S: { Nd: 8, Na: 3 },
  cols: '1.5fr 1fr', rows: '1.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Electron donor lấp acceptor trước, phần dư mới dẫn điện', area: 'a', anim: true,
      ctrls: [{ k: 'Nd', l: 'N_d', min: 0, max: 15, step: 1, f: v => v + '×10¹⁵' }, { k: 'Na', l: 'N_a', min: 0, max: 15, step: 1, f: v => v + '×10¹⁵' }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, x0 = 14, x1 = W - 14, cb = H * .3, vb = H * .78, dY = H * .5, aY = H * .56, free = Math.max(0, S.Nd - S.Na), holes = Math.max(0, S.Na - S.Nd), move = Math.min(S.Nd, S.Na);
        ctx.fillStyle = C.tint; ctx.fillRect(x0, 8, x1 - x0, cb - 8); ctx.fillRect(x0, vb, x1 - x0, H - 8 - vb);
        ln(ctx, x0, cb, x1, cb, C.sub, 2.5); ln(ctx, x0, vb, x1, vb, C.sub, 2.5); txt(ctx, 'Vùng dẫn', x0 + 6, 20, C.mut, 11.5, 'left', 700); txt(ctx, 'Vùng hóa trị', x0 + 6, H - 20, C.mut, 11.5, 'left', 700);
        const dx = i => x0 + 30 + (i + .5) / 15 * (x1 - x0 - 60);
        txt(ctx, 'donor', x0 + 6, dY - 14, C.c5, 11.5, 'left', 700); txt(ctx, 'acceptor', x0 + 6, aY + 16, C.c3, 11.5, 'left', 700);
        for (let i = 0; i < S.Nd; i++) { const X = dx(i); if (i < S.Na) { dot(ctx, X, dY, 4, C.err); } else { dot(ctx, X, dY, 4, C.err); } txt(ctx, '+', X, dY + .5, C.bg, 8, 'center', 800); }
        for (let i = 0; i < S.Na; i++) { const X = dx(i); dot(ctx, X, aY, 5, C.bg); ctx.beginPath(); ctx.arc(X, aY, 5, 0, TAU2); ctx.strokeStyle = C.c3; ctx.lineWidth = 2; ctx.stroke(); if (i < S.Nd) { dot(ctx, X, aY, 3.2, C.c2); } }
        for (let i = 0; i < move; i++) { const ph = (t * .6 + i * .13) % 1, X = dx(i); const yy = dY + (aY - dY) * ph; ctx.globalAlpha = 1 - ph; dot(ctx, X + 6, yy, 3.5, C.c2); ctx.globalAlpha = 1; }
        for (let i = 0; i < free; i++) { const X = dx(S.Na + i) + Math.sin(t * 2 + i) * 6, yy = 24 + ((i * 37) % 60) / 60 * (cb - 44) + Math.cos(t * 2.4 + i) * 4; dot(ctx, X, clamp(yy, 20, cb - 8), 5, C.c2); }
        for (let i = 0; i < holes; i++) { const X = dx(S.Nd + i) + Math.sin(t * 2 + i) * 6, yy = vb + 14 + ((i * 29) % 40) / 40 * (H - vb - 30); dot(ctx, X, yy, 5, C.c4); }
        txt(ctx, S.Nd === S.Na ? 'bù trừ hoàn toàn: gần như thuần' : free ? 'còn ' + free + '×10¹⁵ electron tự do (loại N)' : 'còn ' + holes + '×10¹⁵ lỗ trống (loại P)', W - 10, cb - 12, C.ink, 12.5, 'right', 700);
      } },
    { title: 'Cán cân điện tích và kết quả', area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, nd = S.Nd * 1e15, na = S.Na * 1e15, ni = 1.5e10, d = nd - na;
        const n0 = d >= 0 ? d / 2 + Math.sqrt(d * d / 4 + ni * ni) : ni * ni / (-d / 2 + Math.sqrt(d * d / 4 + ni * ni)), p0 = ni * ni / n0;
        const bx = 70, bw = W - bx - 14, mx = 16e15; const neg = n0 + na, pos = p0 + nd;
        [['(−) n₀+Nₐ⁻', neg, C.c2], ['(+) p₀+N_d⁺', pos, C.err]].forEach((r, i) => { const y = 12 + i * 30; txt(ctx, r[0], 8, y + 9, C.ink, 11, 'left', 700); rr(ctx, bx + 20, y, bw - 20, 18, 5); ctx.fillStyle = C.tint; ctx.fill(); rr(ctx, bx + 20, y, Math.max(2, (bw - 20) * clamp(r[1] / mx, 0, 1)), 18, 5); ctx.fillStyle = r[2]; ctx.fill(); });
        txt(ctx, 'hai bên luôn bằng nhau: trung hòa điện', W / 2, 84, C.sub, 11, 'center', 600);
        txt(ctx, 'n₀ = ' + sci(n0, 2) + '    p₀ = ' + sci(p0, 2), W / 2, H - 28, C.ink, 13.5, 'center', 700);
        txt(ctx, 'N_d − N_a = ' + sci(Math.abs(d) || 0, 1) + (d === 0 ? ' → n₀ = nᵢ' : d > 0 ? '  (loại N)' : '  (loại P)'), W / 2, H - 10, C.mut, 11.5, 'center', 700);
      } }
  ]
});

/* ==========================================================================
   TAB 5 — E_F THEO PHA TẠP (Mục 8, 3–4)
   ========================================================================== */
LABS.push({
  id: 'doping', name: 'E_F theo pha tạp', no: '8', secs: [8],
  S: { type: 'n', N: 1e16, T: 300 },
  cols: '1.5fr 1fr', rows: '1.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Pha càng đậm, mức Fermi càng sát dải', area: 'a',
      ctrls: [{ k: 'type', seg: [['n', 'Loại N'], ['p', 'Loại P']] }, { k: 'N', l: 'N', min: 12, max: 20.5, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }, { k: 'T', l: 'T', min: 200, max: 500, step: 10, f: v => v + ' K' }],
      draw(p, ctx, W, H) {
        const d = p.tab.calc(), top = 14, bot = H - 14, Y = e => top + (.5 - e) / (EG + .7) * (bot - top), x0 = 12, x1 = W - 12;
        ctx.fillStyle = C.tint; ctx.fillRect(x0, top, x1 - x0, Y(0) - top); ctx.fillRect(x0, Y(-EG), x1 - x0, bot - Y(-EG));
        ln(ctx, x0, Y(0), x1, Y(0), C.sub, 2.5); ln(ctx, x0, Y(-EG), x1, Y(-EG), C.sub, 2.5);
        txt(ctx, 'E_c', x0 + 6, Y(0) - 9, C.sub, 11.5, 'left', 700); txt(ctx, 'E_v', x0 + 6, Y(-EG) + 10, C.sub, 11.5, 'left', 700);
        const kT = d.kT; ctx.fillStyle = C.sub; ctx.globalAlpha = .25; ctx.fillRect(x0, Y(0) , x1 - x0, 0); ctx.globalAlpha = 1;
        ln(ctx, x0, Y(-3 * kT), x1, Y(-3 * kT), C.sub, 1, [3, 5]); ln(ctx, x0, Y(-EG + 3 * kT), x1, Y(-EG + 3 * kT), C.sub, 1, [3, 5]);
        txt(ctx, '3kT', x1 - 4, Y(-3 * kT) + 10, C.sub, 10.5, 'right', 600); txt(ctx, '3kT', x1 - 4, Y(-EG + 3 * kT) - 9, C.sub, 10.5, 'right', 600);
        ln(ctx, x0, Y(d.Eb), x1, Y(d.Eb), C.c3, 2, [6, 4]); ln(ctx, x0, Y(d.Ex), x1, Y(d.Ex), C.main, 3);
        txt(ctx, 'E_F (chính xác)', x0 + 8, Y(d.Ex) + (d.Ex <= d.Eb ? 12 : -9), C.main, 12, 'left', 700); txt(ctx, 'công thức Boltzmann', x0 + 8, Y(d.Eb) + (d.Ex <= d.Eb ? -9 : 12), C.c3, 12, 'left', 700);
        txt(ctx, d.reg[0], (x0 + x1) / 2, (Y(0) + Y(-EG)) / 2, d.reg[1], 14, 'center', 700);
      } },
    { title: 'Khoảng cách tới mép dải', area: 'c',
      draw(p, ctx, W, H) {
        const d = p.tab.calc(), x = d.dist / d.kT; txt(ctx, (p.S.type === 'n' ? 'E_c − E_F' : 'E_F − E_v') + ' = ' + d.dist.toFixed(3) + ' eV = ' + x.toFixed(1) + ' kT', W / 2, H * .25, C.ink, 14.5, 'center', 700);
        const bx = 20, bw = W - 40, y = H * .5; rr(ctx, bx, y, bw, 18, 5); ctx.fillStyle = C.tint; ctx.fill();
        rr(ctx, bx, y, Math.max(3, bw * clamp((x + 2) / 14, 0, 1)), 18, 5); ctx.fillStyle = x >= 3 ? C.c2 : C.err; ctx.fill();
        const m = bx + bw * (5 / 14); ln(ctx, m, y - 4, m, y + 22, C.main, 2); txt(ctx, '3 kT', m, y + 34, C.main, 12, 'center', 700);
        txt(ctx, 'phải ≥ 3kT thì Boltzmann mới dùng được', W / 2, H - 14, C.sub, 11.5, 'center', 600);
      } }
  ],
  calc() {
    const S = this.S, kT = KB * S.T, nc = S.type === 'n' ? NCT(S.T) : NVT(S.T), eta = etaFor(S.N / nc), dist = -eta * kT, bolt = kT * Math.log(nc / S.N);
    const Ex = S.type === 'n' ? eta * kT : -EG - eta * kT, Eb = S.type === 'n' ? -bolt : -EG + bolt;
    const x = dist / kT, reg = x < 0 ? ['SUY BIẾN: E_F trong dải', C.err] : x < 3 ? ['Gần suy biến', C.main] : ['Không suy biến', C.c2];
    return { kT, dist, Ex, Eb, reg };
  }
});

/* ==========================================================================
   TAB 6 — NHIỆT ĐỘ (Mục 9)
   ========================================================================== */
LABS.push({
  id: 'temp', name: 'Nhiệt độ', no: '9', secs: [9],
  S: { T: 300, N: 1e16 },
  cols: '1.5fr 1fr', rows: '1.7fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Nóng lên: mức Fermi đi từ sát dải về giữa vùng cấm', area: 'a', anim: true,
      ctrls: [{ k: 'T', l: 'T', min: 20, max: 900, step: 10, f: v => v + ' K' }, { k: 'N', l: 'N_d', min: 13, max: 18, step: .1, log: 1, f: v => p10(Math.round(Math.log10(v))) }],
      draw(p, ctx, W, H, t) {
        const S = p.S, M = p.tab.M, key = S.T + '|' + S.N; if (M.key !== key) { M.key = key; M.r = solveEF(S.T, S.N, 0); }
        const r = M.r, top = 12, bot = H - 12, Y = e => top + (.25 - e) / (EG + .5) * (bot - top), x0 = 12, x1 = W - 12;
        ctx.fillStyle = C.tint; ctx.fillRect(x0, top, x1 - x0, Y(0) - top); ctx.fillRect(x0, Y(-EG), x1 - x0, bot - Y(-EG));
        ln(ctx, x0, Y(0), x1, Y(0), C.sub, 2.5); ln(ctx, x0, Y(-EG), x1, Y(-EG), C.sub, 2.5);
        txt(ctx, 'E_c', x0 + 6, Y(0) - 9, C.sub, 11.5, 'left', 700); txt(ctx, 'E_v', x0 + 6, Y(-EG) + 10, C.sub, 11.5, 'left', 700);
        ln(ctx, x0, Y(-ED), x1, Y(-ED), C.c5, 1.4, [5, 4]); txt(ctx, 'E_d', x1 - 4, Y(-ED) + 10, C.c5, 11, 'right', 700);
        ln(ctx, x0, Y(r.Ei), x1, Y(r.Ei), C.sub, 1.2, [4, 4]); txt(ctx, 'E_Fi', x1 - 4, Y(r.Ei) - 8, C.sub, 11, 'right', 700);
        ln(ctx, x0, Y(r.E), x1, Y(r.E), C.main, 3); txt(ctx, 'E_F', x0 + 8, Y(r.E) - 9, C.main, 12.5, 'left', 700);
        const dn = Math.round(clamp((lg(r.n) - 5) / 15 * 30, 0, 30)), dpp = Math.round(clamp((lg(r.p) - 5) / 15 * 30, 0, 30));
        for (let i = 0; i < dn; i++) dot(ctx, x0 + 50 + ((i * 53 + t * 20 * (1 + i % 3)) % (x1 - x0 - 70)), Y(0) - 12 - ((i * 31) % 20) - Math.sin(t * 3 + i) * 3, 4.5, C.c2);
        for (let i = 0; i < dpp; i++) dot(ctx, x0 + 50 + ((i * 47 + t * 18) % (x1 - x0 - 70)), Y(-EG) + 12 + ((i * 23) % 18), 4.5, C.c4);
        txt(ctx, 'n₀ = ' + sci(r.n, 1), x1 - 6, top + 12, C.c2, 12.5, 'right', 700);
      } },
    { title: 'Ba chặng của nhiệt độ', area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, bx = 16, bw = W - 32, y = H * .3, h = 28, Tmax = 900, X = T => bx + T / Tmax * bw;
        let t1 = 20, t3 = 900; for (let T = 20; T <= 900; T += 10) { if (solveEF(T, S.N, 0).ionD < .9) t1 = T; }
        for (let T = 900; T >= 20; T -= 10) { if (NI(T) > .3 * S.N) t3 = T; else break; }
        [[20, t1 + 10, C.c5, 'đóng băng'], [t1 + 10, t3, C.c2, 'ngoại lai'], [t3, 900, C.err, 'nội tại']].forEach(s => { ctx.fillStyle = s[2]; ctx.globalAlpha = .75; ctx.fillRect(X(s[0]), y, Math.max(0, X(s[1]) - X(s[0])), h); ctx.globalAlpha = 1; if (X(s[1]) - X(s[0]) > 50) txt(ctx, s[3], (X(s[0]) + X(s[1])) / 2, y + h / 2, C.bg, 12, 'center', 700); });
        ln(ctx, X(S.T), y - 8, X(S.T), y + h + 8, C.ink, 3); txt(ctx, S.T + ' K', X(S.T), y - 16, C.ink, 12.5, 'center', 700);
        const r = p.tab.M.r || solveEF(S.T, S.N, 0); txt(ctx, 'n₀ / N_d = ' + (r.n / S.N).toFixed(2), W / 2, H * .75, C.ink, 14.5, 'center', 700);
        txt(ctx, 'vùng ngoại lai = cửa sổ làm việc của linh kiện', W / 2, H - 12, C.sub, 11, 'center', 600);
      } }
  ]
});

/* ==========================================================================
   TAB 7 — TIẾP XÚC: E_F THẲNG HÀNG (Mục 10)
   ========================================================================== */
LABS.push({
  id: 'contact', name: 'Tiếp xúc N–P', no: '10', secs: [10],
  S: { Nd: 17, Na: 16, on: 0 },
  cols: '1.6fr 1fr', rows: '1.5fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Ghép loại N với loại P: electron chảy, dải uốn', area: 'a', anim: true,
      ctrls: [{ k: 'on', seg: [[0, 'Trước khi ghép'], [1, 'Sau khi ghép']] }, { k: 'Nd', l: 'N_d', min: 15, max: 18, step: .1, f: v => p10(Math.round(v)) }, { k: 'Na', l: 'N_a', min: 15, max: 18, step: .1, f: v => p10(Math.round(v)) }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, M = p.tab.M, kT = .0259, ni = 1.5e10, EFn = -kT * Math.log(NC0 / Math.pow(10, S.Nd)), EFp = -EG + kT * Math.log(NV0 / Math.pow(10, S.Na)), Vbi = EFn - EFp;
        M.q = M.q == null ? 0 : M.q; M.q += ((S.on ? 1 : 0) - M.q) * Math.min(1, dt * 2.2);
        const q = M.q, top = 14, bot = H - 30, lo = -EG - .35, hi = Vbi + .35, Y = e => top + (hi - e) / (hi - lo) * (bot - top), x0 = 14, x1 = W - 14, xm = (x0 + x1) / 2, wj = (x1 - x0) * .13;
        const sh = x => { const s = clamp((x - (xm - wj)) / (2 * wj), 0, 1); return q * Vbi * (s * s * (3 - 2 * s)); };
        const curve = (off, col, w) => { ctx.beginPath(); for (let x = x0; x <= x1; x += 3) { const e = off + sh(x) * 0 ; x === x0 ? ctx.moveTo(x, Y(e + sh(x))) : ctx.lineTo(x, Y(e + sh(x))); } ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
        // vẽ N bên trái cố định, P bên phải được nâng lên q·Vbi
        const sh2 = x => sh(x);
        ctx.beginPath(); ctx.moveTo(x0, Y(0)); for (let x = x0; x <= x1; x += 3) ctx.lineTo(x, Y(sh2(x))); ctx.strokeStyle = C.sub; ctx.lineWidth = 3; ctx.stroke(); txt(ctx, 'E_c', x0 + 4, Y(0) - 9, C.sub, 11, 'left', 700);
        ctx.beginPath(); for (let x = x0; x <= x1; x += 3) x === x0 ? ctx.moveTo(x, Y(-EG + sh2(x))) : ctx.lineTo(x, Y(-EG + sh2(x))); ctx.stroke(); txt(ctx, 'E_v', x0 + 4, Y(-EG) + 11, C.sub, 11, 'left', 700);
        // E_F
        ln(ctx, x0, Y(EFn), xm, Y(EFn), C.main, 3); ln(ctx, xm, Y(EFp + q * Vbi), x1, Y(EFp + q * Vbi), C.main, 3);
        if (q > .02 && q < .98) ln(ctx, xm, Y(EFn), xm, Y(EFp + q * Vbi), C.main, 1.5, [3, 3]);
        txt(ctx, 'E_F', x0 + 6, Y(EFn) - 9, C.main, 12.5, 'left', 700); txt(ctx, 'E_F', x1 - 6, Y(EFp + q * Vbi) - 9, C.main, 12.5, 'right', 700);
        txt(ctx, 'loại N', x0 + (xm - x0) / 2, bot + 18, C.c2, 12.5, 'center', 700); txt(ctx, 'loại P', xm + (x1 - xm) / 2, bot + 18, C.c4, 12.5, 'center', 700);
        // electron chảy
        if (q > .02 && q < .98 || S.on) { for (let i = 0; i < 6; i++) { const ph = (t * .5 + i / 6) % 1, x = xm - 70 + ph * 140, a = (1 - q) * 1; if (a > .03) { ctx.globalAlpha = a; dot(ctx, x, Y(-.15 + ph * .0) , 4.5, C.c2); ctx.globalAlpha = 1; } } }
        if (q > .95) { const d = Y(0) - Y(Vbi); arr(ctx, xm + wj + 14, Y(Vbi + -.05), xm + wj + 14, Y(0 * 1 + 0), C.err, 2); txt(ctx, 'qV_bi', xm + wj + 20, (Y(0) + Y(Vbi)) / 2 - 18, C.err, 12.5, 'left', 700); }
        M.Vbi = Vbi;
      } },
    { title: 'Mức Fermi chênh nhau bao nhiêu thì dải uốn bấy nhiêu', area: 'c', anim: true,
      draw(p, ctx, W, H) {
        const S = p.S, M = p.tab.M, kT = .0259, ni = 1.5e10, V = kT * Math.log(Math.pow(10, S.Nd + S.Na) / (ni * ni));
        txt(ctx, 'qV_bi = kT·ln(N_d N_a / nᵢ²)', W / 2, H * .22, C.mut, 13, 'center', 700);
        txt(ctx, V.toFixed(2) + ' eV', W / 2, H * .5, C.err, 24, 'center', 700);
        txt(ctx, M.q > .95 ? 'E_F phẳng xuyên suốt: đã cân bằng' : 'E_F hai bên đang lệch nhau', W / 2, H * .78, M.q > .95 ? C.c2 : C.main, 13, 'center', 700);
      } }
  ]
});

/* ==========================================================================
   KHUNG 3D DÙNG CHUNG (chiếu phối cảnh, kéo chuột để xoay, lăn để phóng to)
   ========================================================================== */
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mk3(p, ctx, W, H, dt, sc0) {
  const st = p.st;
  if (!st.cam) {
    const cam = st.cam = { yaw: .55, pitch: .32, zoom: 1, auto: true }, cv = p.cv; let d = null;
    cv.style.cursor = 'grab'; cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', e => { d = [e.clientX, e.clientY]; cam.auto = false; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
    cv.addEventListener('pointermove', e => { if (!d) return; cam.yaw += (e.clientX - d[0]) * .01; cam.pitch = clamp(cam.pitch + (e.clientY - d[1]) * .01, -1.3, 1.3); d = [e.clientX, e.clientY]; });
    const up = () => { d = null; cv.style.cursor = 'grab'; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { e.preventDefault(); cam.zoom = clamp(cam.zoom * (e.deltaY < 0 ? 1.1 : .9), .5, 2.6); }, { passive: false });
  }
  const cam = st.cam; if (cam.auto) cam.yaw += dt * .1;
  const sc = sc0 * cam.zoom, items = [], cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), D = 8;
  const P = (x, y, z) => { const X = x * cy + z * sy; let Z = -x * sy + z * cy; const Y = y * cp - Z * sp; Z = y * sp + Z * cp; const f = D / (D + Z); return [W / 2 + X * sc * f, H / 2 - Y * sc * f, Z, f]; };
  const fade = Z => clamp(1 - Z * .05, .5, 1);
  return {
    cam, sc, P,
    sphere(x, y, z, r, col, al, label, ring) {
      const q = P(x, y, z); items.push([q[2], () => {
        const R = Math.max(1.5, r * sc * q[3]); ctx.globalAlpha = (al == null ? 1 : al) * fade(q[2]);
        ctx.beginPath(); ctx.arc(q[0], q[1], R, 0, TAU2);
        if (ring) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); } else { ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha *= .3; ctx.beginPath(); ctx.arc(q[0] - R * .3, q[1] - R * .3, R * .38, 0, TAU2); ctx.fillStyle = '#fff'; ctx.fill(); }
        ctx.globalAlpha = 1; if (label && R > 5) txt(ctx, label, q[0], q[1] + .5, C.bg, Math.min(16, R * 1.3), 'center', 800);
      }]);
    },
    line(a, b, col, w, al, dash) {
      const A = P(a[0], a[1], a[2]), B = P(b[0], b[1], b[2]); items.push([(A[2] + B[2]) / 2, () => { ctx.globalAlpha = (al == null ? 1 : al) * fade((A[2] + B[2]) / 2); ln(ctx, A[0], A[1], B[0], B[1], col, w || 1, dash); ctx.globalAlpha = 1; }]);
    },
    box(x0, x1, y0, y1, z0, z1, col, w, al) {
      const c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(e => this.line(c[e[0]], c[e[1]], col, w, al));
    },
    arrow(a, b, col, w) {
      const A = P(a[0], a[1], a[2]), B = P(b[0], b[1], b[2]); items.push([Math.min(A[2], B[2]) - .5, () => { arr(ctx, A[0], A[1], B[0], B[1], col, w || 3); }]);
    },
    flush() { items.sort((a, b) => b[0] - a[0]); items.forEach(i => i[1]()); },
    hint() { txt(ctx, 'kéo chuột để xoay · lăn để phóng', W - 8, H - 10, C.sub, 10.5, 'right', 600); }
  };
}
function crystalSites(nx, ny, nz) { const s = []; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) s.push([i - (nx - 1) / 2, j - (ny - 1) / 2, k - (nz - 1) / 2]); return s; }
function drawCrystal(g, sites, dims, t, amp, skip, atomCol, atomR) {
  const [nx, ny, nz] = dims, id = (i, j, k) => (i * ny + j) * nz + k, pos = sites.map((s, n) => { const ph = n * 1.7; return [s[0] + amp * Math.sin(t * 5 + ph), s[1] + amp * Math.sin(t * 4.3 + ph * 1.3), s[2] + amp * Math.sin(t * 4.7 + ph * .7)]; });
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) { const a = id(i, j, k);
    if (i + 1 < nx) g.line(pos[a], pos[id(i + 1, j, k)], C.sub, 1, .22); if (j + 1 < ny) g.line(pos[a], pos[id(i, j + 1, k)], C.sub, 1, .22); if (k + 1 < nz) g.line(pos[a], pos[id(i, j, k + 1)], C.sub, 1, .22);
    if (!skip || !skip.has(a)) g.sphere(pos[a][0], pos[a][1], pos[a][2], atomR || .15, atomCol || C.sub, .75); }
  return pos;
}
function wander(e, B, dt, v) { for (let a = 0; a < 3; a++) { e.v[a] += gauss() * dt * 3; e.v[a] = clamp(e.v[a], -v, v); e.p[a] += e.v[a] * dt; if (e.p[a] < B[a][0]) { e.p[a] = B[a][0]; e.v[a] = Math.abs(e.v[a]); } if (e.p[a] > B[a][1]) { e.p[a] = B[a][1]; e.v[a] = -Math.abs(e.v[a]); } } }
const newE = B => ({ p: B.map(b => b[0] + Math.random() * (b[1] - b[0])), v: [gauss(), gauss(), gauss()].map(x => x * .8) });
function repPanel(id, idx, spec) { const l = LABS.find(x => x.id === id); l.panels[idx] = spec; return l; }

/* ============ TAB 2: FERMI–DIRAC → KHÔNG GIAN k (quả cầu Fermi) ============ */
{
  const l = LABS.find(x => x.id === 'fd'), ctrls = l.panels[0].ctrls;
  l.panels[0] = { title: 'Không gian xung lượng k: electron lấp đầy từ tâm ra', area: 'a', anim: true, ctrls,
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, M = p.tab.M, g = mk3(p, ctx, W, H, dt, Math.min(W, H) / 7.4), R = Math.sqrt(Math.max(S.eta, 0) + 9);
      if (!M.pts) { const r = rng(7); M.pts = []; while (M.pts.length < 900) { const x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1; if (x * x + y * y + z * z <= 1) M.pts.push([x, y, z, r()]); } }
      const Rb = 3.2; g.box(-Rb, Rb, -Rb, Rb, -Rb, Rb, C.sub, 1, .35);
      g.line([-Rb, 0, 0], [Rb, 0, 0], C.sub, 1, .5); g.line([0, -Rb, 0], [0, Rb, 0], C.sub, 1, .5); g.line([0, 0, -Rb], [0, 0, Rb], C.sub, 1, .5);
      const R2 = Math.min(R, Rb) / 1; let on = 0;
      M.pts.forEach(q => { const x = q[0] * Rb, y = q[1] * Rb, z = q[2] * Rb, e = x * x + y * y + z * z, f = 1 / (1 + Math.exp(e - S.eta)); if (q[3] < f) { on++; g.sphere(x, y, z, .075 + .045 * f, C.c2, .95); } else if (e < 16) g.sphere(x, y, z, .05, C.sub, .4); });
      if (S.eta > 0) { const kF = Math.sqrt(S.eta), N = 36; for (let a = 0; a < N; a++) { const t1 = a / N * TAU2, t2 = (a + 1) / N * TAU2; g.line([kF * Math.cos(t1), kF * Math.sin(t1), 0], [kF * Math.cos(t2), kF * Math.sin(t2), 0], C.main, 2.2, .9); g.line([kF * Math.cos(t1), 0, kF * Math.sin(t1)], [kF * Math.cos(t2), 0, kF * Math.sin(t2)], C.main, 2.2, .9); } }
      g.flush(); g.hint();
      txt(ctx, S.eta > 0 ? 'Quả cầu Fermi: E_F nằm trong dải, suy biến' : S.eta > -3 ? 'Đám mây đang đặc dần' : 'Vài electron rải rác quanh tâm: không suy biến', 10, 14, S.eta > 0 ? C.main : C.ink, 12.5, 'left', 700);
      txt(ctx, 'mỗi chấm xanh là một trạng thái k đã có electron', 10, H - 10, C.sub, 10.5, 'left', 600);
    } };
}

/* ============ TAB 3: ION HÓA — TINH THỂ 3D ============ */
{
  const l = LABS.find(x => x.id === 'ion'), ctrls = l.panels[0].ctrls, DIM = [6, 4, 4], BND = [[-2.7, 2.7], [-1.7, 1.7], [-1.7, 1.7]];
  l.panels[0] = { title: 'Tinh thể Si pha P: donor nhả electron khi đủ nóng', area: 'a', anim: true, ctrls,
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, M = p.tab.M, g = mk3(p, ctx, W, H, dt, Math.min(W / 8.6, H / 6.2)), key = S.T + '|' + S.N; if (M.key !== key) { M.key = key; M.r = solveEF(S.T, S.N, 0); }
      if (!M.sites) { M.sites = crystalSites(...DIM); const r = rng(11), idx = M.sites.map((_, i) => i).sort(() => r() - .5); M.order = idx; M.don = idx.slice(0, 16).map(i => ({ i, ion: false, th: r() * 6, e: null })); }
      const K = Math.round(clamp((lg(S.N) - 13.5) / 4.5 * 14 + 2, 2, 16)), f = M.r.ionD, skip = new Set(M.don.slice(0, K).map(d => d.i)), amp = .05 + .2 * Math.sqrt(S.T / 700);
      g.box(BND[0][0] - .4, BND[0][1] + .4, BND[1][0] - .4, BND[1][1] + .4, BND[2][0] - .4, BND[2][1] + .4, C.sub, 1.2, .4);
      const pos = drawCrystal(g, M.sites, DIM, t, amp, skip, C.sub, .15); let ion = 0;
      M.don.slice(0, K).forEach(d => {
        const q = pos[d.i];
        if (!d.ion && Math.random() < dt * 1.5 * f) { d.ion = true; d.e = newE(BND); d.e.p = q.slice(); }
        else if (d.ion && Math.random() < dt * 1.5 * (1 - f)) { d.ion = false; d.e = null; }
        if (d.ion) { ion++; g.sphere(q[0], q[1], q[2], .27, C.err, 1, '+'); wander(d.e, BND, dt, 1.6); g.sphere(d.e.p[0], d.e.p[1], d.e.p[2], .12, C.c2, 1); }
        else { g.sphere(q[0], q[1], q[2], .27, C.c5, 1, 'P'); const a = t * 3 + d.th; g.sphere(q[0] + .38 * Math.cos(a), q[1] + .2 * Math.sin(a * 1.3), q[2] + .38 * Math.sin(a), .1, C.c2, 1); }
      });
      g.flush(); g.hint();
      txt(ctx, 'đã nhả: ' + ion + '/' + K + ' donor  (≈ ' + Math.round(f * 100) + '%)', 10, 14, C.ink, 13, 'left', 700);
      txt(ctx, 'T = ' + S.T + ' K', W - 10, 14, C.mut, 12.5, 'right', 700);
      txt(ctx, 'P tím + electron quay quanh = còn kẹt · P đỏ (+) = đã nhả, electron xanh chạy tự do', 10, H - 10, C.sub, 10.5, 'left', 600);
    } };
}

/* ============ TAB 4: BÙ TRỪ — TINH THỂ 3D ============ */
{
  const l = LABS.find(x => x.id === 'comp'), ctrls = l.panels[0].ctrls, DIM = [7, 4, 4], BND = [[-3.2, 3.2], [-1.7, 1.7], [-1.7, 1.7]];
  l.panels[0] = { title: 'Electron donor lấp acceptor trước, phần dư mới dẫn điện', area: 'a', anim: true, ctrls,
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, M = p.tab.M, g = mk3(p, ctx, W, H, dt, Math.min(W / 9.4, H / 6.2));
      if (!M.sites) { M.sites = crystalSites(...DIM); const r = rng(5); M.perm = M.sites.map((_, i) => i).sort(() => r() - .5); M.fe = []; M.fh = []; }
      const nd = S.Nd, na = S.Na, don = M.perm.slice(0, nd), acc = M.perm.slice(M.perm.length - na), skip = new Set(don.concat(acc)), pair = Math.min(nd, na);
      g.box(BND[0][0] - .4, BND[0][1] + .4, BND[1][0] - .4, BND[1][1] + .4, BND[2][0] - .4, BND[2][1] + .4, C.sub, 1.2, .4);
      const pos = drawCrystal(g, M.sites, DIM, t, .06, skip, C.sub, .15);
      while (M.fe.length < Math.max(0, nd - na)) M.fe.push(newE(BND)); M.fe.length = Math.max(0, nd - na);
      while (M.fh.length < Math.max(0, na - nd)) M.fh.push(newE(BND)); M.fh.length = Math.max(0, na - nd);
      don.forEach((i, n) => { const q = pos[M.sites.length ? i : 0]; g.sphere(q[0], q[1], q[2], .26, C.err, 1, '+'); });
      acc.forEach((i, n) => { const q = pos[i]; g.sphere(q[0], q[1], q[2], .26, n < pair ? C.c5 : C.c5, n < pair ? 1 : .55, n < pair ? '−' : null, n >= pair); });
      for (let n = 0; n < pair; n++) { const a = pos[don[n]], b = pos[acc[acc.length - 1 - n] !== undefined ? acc[n] : acc[n]]; const ph = (t * .5 + n * .17) % 1; g.line(a, b, C.c2, 1, .25, [3, 4]); g.sphere(a[0] + (b[0] - a[0]) * ph, a[1] + (b[1] - a[1]) * ph, a[2] + (b[2] - a[2]) * ph, .11, C.c2, 1); }
      M.fe.forEach(e => { wander(e, BND, dt, 1.5); g.sphere(e.p[0], e.p[1], e.p[2], .13, C.c2, 1); });
      M.fh.forEach(e => { wander(e, BND, dt, 1.2); g.sphere(e.p[0], e.p[1], e.p[2], .13, C.c4, 1); });
      g.flush(); g.hint();
      txt(ctx, nd === na ? 'Bù trừ hoàn toàn: không còn hạt tải dư' : nd > na ? 'Dư ' + (nd - na) + ' electron tự do (loại N)' : 'Dư ' + (na - nd) + ' lỗ trống (loại P)', 10, 14, C.ink, 13, 'left', 700);
      txt(ctx, 'đỏ + = donor · tím − = acceptor đã nhận electron (vòng rỗng = còn trống) · xanh = electron · hồng = lỗ trống', 10, H - 10, C.sub, 10.5, 'left', 600);
    } };
}

/* ============ TAB 5: PHA TẠP — mật độ tạp chất trong tinh thể 3D, giản đồ dải ở ô dưới ============ */
{
  const l = LABS.find(x => x.id === 'doping'), ctrls = l.panels[0].ctrls, oldBand = l.panels[0].draw, DIM = [8, 5, 5], BND = [[-3.6, 3.6], [-2.2, 2.2], [-2.2, 2.2]];
  l.panels[0] = { title: 'Pha càng đậm, các nguyên tử tạp chất càng sát nhau', area: 'a', anim: true, ctrls,
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, M = p.tab.M, g = mk3(p, ctx, W, H, dt, Math.min(W / 10.4, H / 7));
      if (!M.sites) { M.sites = crystalSites(...DIM); const r = rng(3); M.perm = M.sites.map((_, i) => i).sort(() => r() - .5); M.fe = []; }
      const K = Math.round(clamp((lg(S.N) - 12) / 8.5 * 70 + 1, 1, 70)), dop = M.perm.slice(0, K), skip = new Set(dop), colD = S.type === 'n' ? C.err : C.c5;
      g.box(BND[0][0] - .4, BND[0][1] + .4, BND[1][0] - .4, BND[1][1] + .4, BND[2][0] - .4, BND[2][1] + .4, C.sub, 1.2, .4);
      const pos = drawCrystal(g, M.sites, DIM, t, .05, skip, C.sub, .12);
      let links = 0; for (let a = 0; a < K; a++) for (let b = a + 1; b < K; b++) { const A = pos[dop[a]], B = pos[dop[b]]; if (Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) < 1.6) { links++; g.line(A, B, C.main, 1.6, .75); } }
      dop.forEach(i => { const q = pos[i]; g.sphere(q[0], q[1], q[2], .5, colD, .1); g.sphere(q[0], q[1], q[2], .24, colD, 1, S.type === 'n' ? '+' : '−'); });
      const nf = Math.min(40, K); while (M.fe.length < nf) M.fe.push(newE(BND)); M.fe.length = nf;
      M.fe.forEach(e => { wander(e, BND, dt, 1.5); g.sphere(e.p[0], e.p[1], e.p[2], .11, S.type === 'n' ? C.c2 : C.c4, .95); });
      g.flush(); g.hint();
      txt(ctx, K + ' nguyên tử ' + (S.type === 'n' ? 'donor' : 'acceptor') + (links > 6 ? '  ·  các quầng chồng nhau: dải tạp chất' : ''), 10, 14, C.ink, 13, 'left', 700);
      txt(ctx, 'quầng mờ = vùng ảnh hưởng của mỗi tạp chất · đường vàng = hai quầng chạm nhau', 10, H - 10, C.sub, 10.5, 'left', 600);
    } };
  l.panels[1] = { title: 'Giản đồ dải: E_F chính xác (liền) và công thức Boltzmann (đứt)', area: 'c', draw: (p, ctx, W, H, t, dt) => { oldBand(p, ctx, W, H, t, dt); const d = p.tab.calc(); txt(ctx, (p.S.type === 'n' ? 'E_c − E_F' : 'E_F − E_v') + ' = ' + (d.dist / d.kT).toFixed(1) + ' kT', W - 8, 12, d.dist / d.kT >= 3 ? C.c2 : C.err, 12, 'right', 700); } };
}

/* ============ TAB 6: NHIỆT ĐỘ — tinh thể rung, hạt tải xuất hiện ============ */
{
  const l = LABS.find(x => x.id === 'temp'), ctrls = l.panels[0].ctrls, oldBand = l.panels[0].draw, DIM = [6, 4, 4], BND = [[-2.7, 2.7], [-1.7, 1.7], [-1.7, 1.7]];
  l.panels[0] = { title: 'Nóng lên: tinh thể rung mạnh, hạt tải nhiệt đông dần', area: 'a', anim: true, ctrls,
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, M = p.tab.M, g = mk3(p, ctx, W, H, dt, Math.min(W / 8.6, H / 6.2)), key = S.T + '|' + S.N; if (M.key !== key) { M.key = key; M.r = solveEF(S.T, S.N, 0); }
      if (!M.sites) { M.sites = crystalSites(...DIM); const r = rng(9); M.don = M.sites.map((_, i) => i).sort(() => r() - .5).slice(0, 10).map(i => ({ i, ion: false, th: r() * 6 })); M.fe = []; M.fh = []; }
      const r = M.r, f = r.ionD, nE = Math.round(clamp((lg(r.n) - 8) / 10 * 38, 0, 38)), nH = Math.round(clamp((lg(r.p) - 8) / 10 * 38, 0, 38)), amp = .04 + .24 * Math.sqrt(S.T / 900), skip = new Set(M.don.map(d => d.i));
      g.box(BND[0][0] - .4, BND[0][1] + .4, BND[1][0] - .4, BND[1][1] + .4, BND[2][0] - .4, BND[2][1] + .4, C.sub, 1.2, .4);
      const pos = drawCrystal(g, M.sites, DIM, t, amp, skip, C.sub, .15);
      M.don.forEach(d => { const q = pos[d.i]; if (!d.ion && Math.random() < dt * 1.5 * f) d.ion = true; else if (d.ion && Math.random() < dt * 1.5 * (1 - f)) d.ion = false;
        if (d.ion) g.sphere(q[0], q[1], q[2], .26, C.err, 1, '+'); else { g.sphere(q[0], q[1], q[2], .26, C.c5, 1, 'P'); const a = t * 3 + d.th; g.sphere(q[0] + .36 * Math.cos(a), q[1] + .2 * Math.sin(a * 1.3), q[2] + .36 * Math.sin(a), .1, C.c2, 1); } });
      while (M.fe.length < nE) M.fe.push(newE(BND)); M.fe.length = nE; while (M.fh.length < nH) M.fh.push(newE(BND)); M.fh.length = nH;
      const sp = 1 + 1.2 * S.T / 900;
      M.fe.forEach(e => { wander(e, BND, dt, 1.2 * sp); g.sphere(e.p[0], e.p[1], e.p[2], .11, C.c2, 1); }); M.fh.forEach(e => { wander(e, BND, dt, 1.0 * sp); g.sphere(e.p[0], e.p[1], e.p[2], .11, C.c4, 1); });
      g.flush(); g.hint();
      txt(ctx, 'T = ' + S.T + ' K', 10, 14, C.ink, 13.5, 'left', 700);
      txt(ctx, 'n₀ = ' + sci(r.n, 1) + '   p₀ = ' + sci(r.p, 1), W - 10, 14, C.mut, 12.5, 'right', 700);
      txt(ctx, 'rung tinh thể (biên độ ∝ √T) · P đỏ = donor đã nhả · xanh = electron · hồng = lỗ trống', 10, H - 10, C.sub, 10.5, 'left', 600);
    } };
}

/* ============ TAB 7: TIẾP XÚC N–P — khối 3D, vùng nghèo, trường nội tại ============ */
{
  const l = LABS.find(x => x.id === 'contact'), ctrls = l.panels[0].ctrls, oldBand = l.panels[0].draw;
  l.panels[0] = { title: 'Khối loại N ghép khối loại P: vùng nghèo hình thành', area: 'a', anim: true, ctrls,
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, M = p.tab.M, g = mk3(p, ctx, W, H, dt, Math.min(W / 8.2, H / 5.8)), kT = .0259, V = kT * Math.log(Math.pow(10, S.Nd + S.Na) / (1.5e10 * 1.5e10)), L = 2.6, hy = 1.1;
      M.q = M.q == null ? 0 : M.q; M.q += ((S.on ? 1 : 0) - M.q) * Math.min(1, dt * 2.2);
      if (!M.ions) { const r = rng(21); M.ions = Array.from({ length: 34 }, () => [r(), r(), r()]); M.e = Array.from({ length: 30 }, () => ({ p: [-Math.random() * L, (Math.random() * 2 - 1) * hy, (Math.random() * 2 - 1) * hy], v: [gauss(), gauss(), gauss()] })); M.h = Array.from({ length: 30 }, () => ({ p: [Math.random() * L, (Math.random() * 2 - 1) * hy, (Math.random() * 2 - 1) * hy], v: [gauss(), gauss(), gauss()] })); M.fl = []; }
      const q = M.q, gap = (1 - q) * .9, w = q * (.55 + .5 * clamp(V / 1, 0, 1)), sh = gap / 2;
      g.box(-L - sh, -sh, -hy, hy, -hy, hy, C.c2, 1.8, .9); g.box(sh, L + sh, -hy, hy, -hy, hy, C.c4, 1.8, .9);
      txt(ctx, 'loại N', g.P(-L / 2 - sh, hy + .1, 0)[0], g.P(-L / 2, hy + .1, 0)[1] - 14, C.c2, 13, 'center', 700); txt(ctx, 'loại P', g.P(L / 2 + sh, hy + .1, 0)[0], g.P(L / 2, hy + .1, 0)[1] - 14, C.c4, 13, 'center', 700);
      M.ions.forEach((o, i) => { const left = i < 17, x = left ? -(o[0] * L) - sh : o[0] * L + sh, y = (o[1] * 2 - 1) * hy * .9, z = (o[2] * 2 - 1) * hy * .9, dep = left ? -(x + sh) < w : (x - sh) < w;
        g.sphere(x, y, z, dep && q > .3 ? .13 : .08, left ? C.err : C.c5, dep && q > .3 ? 1 : .5); });
      const step = (e, side) => { for (let a = 0; a < 3; a++) { e.v[a] += gauss() * dt * 3; e.v[a] = clamp(e.v[a], -1.3, 1.3); e.p[a] += e.v[a] * dt; }
        const lo = side < 0 ? -L - sh : sh + (q > .02 ? w : 0), hi = side < 0 ? -sh - (q > .02 ? w : 0) : L + sh;
        if (e.p[0] < lo) { e.p[0] = lo; e.v[0] = Math.abs(e.v[0]); } if (e.p[0] > hi) { e.p[0] = hi; e.v[0] = -Math.abs(e.v[0]); if (q > .05 && q < .95 && Math.random() < .08) M.fl.push({ x: e.p[0], y: e.p[1], z: e.p[2], a: 1 }); }
        ['y', 'z'].forEach((_, k) => { const i = k + 1; if (e.p[i] < -hy) { e.p[i] = -hy; e.v[i] = Math.abs(e.v[i]); } if (e.p[i] > hy) { e.p[i] = hy; e.v[i] = -Math.abs(e.v[i]); } }); };
      M.e.forEach(e => { step(e, -1); g.sphere(e.p[0], e.p[1], e.p[2], .1, C.c2, 1); }); M.h.forEach(e => { step(e, 1); g.sphere(e.p[0], e.p[1], e.p[2], .1, C.c4, 1); });
      M.fl = M.fl.filter(f => (f.a -= dt * 1.5) > 0); M.fl.forEach(f => g.sphere(f.x, f.y, f.z, .2 * (2 - f.a), C.main, f.a, null, true));
      if (q > .85) { [-.6, 0, .6].forEach(y => g.arrow([-w * .8, y, 0], [w * .8, y, 0], C.err, 2.6)); }
      g.flush(); g.hint();
      txt(ctx, q > .95 ? 'Cân bằng: vùng nghèo (không còn hạt tải) rộng ' + (2 * w).toFixed(1) + ', trường nội tại E hướng từ N sang P' : q < .05 ? 'Chưa ghép: hai khối riêng, hạt tải phân bố đều' : 'Electron và lỗ trống đang khuếch tán qua mối nối...', 10, 14, C.ink, 12.5, 'left', 700);
      txt(ctx, 'qV_bi = ' + V.toFixed(2) + ' eV', W - 10, 14, C.err, 13, 'right', 700);
    } };
  l.panels[1] = { title: 'Giản đồ dải năng lượng tương ứng', area: 'c', anim: true, draw: (p, ctx, W, H, t) => oldBand(p, ctx, W, H, t, 0) };
}

/* ==========================================================================
   NHẬT KÝ GIẢI THÍCH. Loại dòng: i = nguyên lý · w = cơ chế · v = số liệu
   ========================================================================== */
const LD = {};
const pw = v => p10(Math.round(Math.log10(v)));
LD.ef = {
  intro: [
    ['i', 'Mức Fermi E_F là "mực nước" của các trạng thái: dưới nó hầu hết đã có electron, trên nó hầu hết còn trống.'],
    ['w', 'Mực nước càng gần dải dẫn thì dải dẫn càng đông electron (n₀ tăng); càng gần dải hóa trị thì càng nhiều lỗ trống (p₀ tăng).'],
    ['w', 'Chỉ cần dịch E_F khoảng 0,06 eV là n₀ đổi 10 lần, và p₀ đổi ngược lại 10 lần. Vì vậy tích n₀·p₀ không đổi.'],
    ['v', 'Kéo E_F − E_Fi qua lại, rồi thử đổi nhiệt độ T.']
  ],
  react(S, k, P, say) {
    const kT = KB * S.T, ni = NI(S.T), n0 = ni * ex(S.dE / kT), p0 = ni * ex(-S.dE / kT);
    if (k === 'dE') { say('v', `E_F − E_Fi = ${S.dE.toFixed(2)} eV → n₀ = ${sci(n0, 1)}, p₀ = ${sci(p0, 1)}.`);
      say('w', S.dE > .02 ? 'E_F cao hơn E_Fi: electron nhiều hơn lỗ trống, loại N.' : S.dE < -.02 ? 'E_F thấp hơn E_Fi: lỗ trống nhiều hơn, loại P.' : 'E_F trùng E_Fi: n₀ = p₀ = nᵢ, bán dẫn thuần.'); }
    else say('w', `T = ${S.T} K: nᵢ = ${sci(ni, 1)}. Nhiệt độ cao làm kT lớn, cùng độ dịch E_F nhưng n₀, p₀ lệch nhau ít hơn; nᵢ cũng tăng nhanh.`);
    say('i', 'Mọi lúc n₀·p₀ = nᵢ²: hạt đa số tăng bao nhiêu lần thì hạt thiểu số giảm bấy nhiêu lần.');
  }
};
LD.fd = {
  intro: [
    ['i', 'Mỗi hàng ô là một mức năng lượng trong dải dẫn; ô xanh là trạng thái đã có electron. Xác suất đầy f(E) = 1/(1 + e^((E−E_F)/kT)).'],
    ['w', 'Công thức Boltzmann coi mọi trạng thái đều thưa. Khi E_F áp sát hoặc vượt vào dải thì các hàng gần đáy dải gần đầy, Boltzmann đoán lố.'],
    ['w', 'η_F = (E_F − E_c)/kT. η_F ≤ −3: không suy biến. η_F > 0: E_F nằm trong dải, suy biến.'],
    ['v', 'Kéo η_F từ −6 lên +5 và xem hai thanh n₀ tách nhau ra.']
  ],
  react(S, k, P, say) {
    const fd = 2 / Math.sqrt(Math.PI) * F12(S.eta), bo = Math.exp(S.eta);
    say('v', `η_F = ${S.eta.toFixed(1)}: n₀/N_c = ${fd.toPrecision(2)} (Fermi–Dirac), ${bo.toPrecision(2)} (Boltzmann), ` + (bo / fd > 1.05 ? `Boltzmann lố ${(bo / fd).toFixed(2)} lần.` : 'lệch dưới 5%.'));
    say('w', S.eta > 0 ? 'E_F đã vào dải dẫn: bán dẫn suy biến, bắt buộc dùng tích phân Fermi–Dirac, và n₀·p₀ ≠ nᵢ².' : S.eta > -3 ? 'E_F cách mép dải chưa tới 3kT: Boltzmann bắt đầu sai.' : 'E_F cách mép dải từ 3kT trở lên: Boltzmann dùng tốt.');
  }
};
LD.ion = {
  intro: [
    ['i', 'Donor có mức E_d nằm sát dưới dải dẫn. Electron ngồi trên E_d chỉ cần chút năng lượng nhiệt để nhảy lên dải dẫn; donor khi đó thành ion dương.'],
    ['w', 'Nhiệt độ phòng, pha 10¹⁶: hơn 99% donor đã nhả hết, gọi là ion hóa hoàn toàn, nên n₀ ≈ N_d.'],
    ['w', 'Rất lạnh: không đủ năng lượng nhiệt, electron kẹt lại ở donor. Đó là đóng băng.'],
    ['v', 'Kéo T xuống thấp và N_d lên cao để thấy donor khó ion hóa hơn.']
  ],
  react(S, k, P, say) {
    const r = solveEF(S.T, S.N, 0);
    say('v', `T = ${S.T} K, N_d = ${pw(S.N)}: ion hóa ${Math.round(r.ionD * 100)}%, n₀ = ${sci(r.n, 1)}.`);
    if (k === 'N') say('w', 'Pha càng nặng thì mức Fermi càng gần E_d, donor càng khó nhả hết: phần ion hóa giảm.');
    else say('w', r.ionD < .85 ? 'Lạnh: donor còn giữ nhiều electron (đóng băng), n₀ nhỏ hơn N_d.' : 'Đủ ấm: donor nhả gần hết, n₀ ≈ N_d.');
  }
};
LD.comp = {
  intro: [
    ['i', 'Bán dẫn bù trừ có cả donor lẫn acceptor. Acceptor là các "chỗ trống chờ electron".'],
    ['w', 'Electron của donor rơi xuống lấp acceptor trước (hạt đi xuống chỗ thấp hơn). Chỉ phần donor còn dư mới lên dải dẫn.'],
    ['w', 'Vì vậy n₀ ≈ N_d − N_a. Nếu N_a lớn hơn thì dư lỗ trống và thành loại P.'],
    ['v', 'Kéo N_d và N_a, thử cho chúng bằng nhau.']
  ],
  react(S, k, P, say) {
    const d = S.Nd - S.Na;
    say('v', `N_d = ${S.Nd}×10¹⁵, N_a = ${S.Na}×10¹⁵ → N_d − N_a = ${d}×10¹⁵.`);
    say('w', d > 0 ? `${S.Na}×10¹⁵ electron bị acceptor giữ lại, còn ${d}×10¹⁵ electron dẫn điện (loại N).` : d < 0 ? `Acceptor nhiều hơn: dư ${-d}×10¹⁵ lỗ trống (loại P).` : 'Bù trừ hoàn toàn: không còn hạt tải dư, bán dẫn trở về n₀ = p₀ = nᵢ.');
    say('i', 'Tổng điện tích âm (n₀ + N_a⁻) luôn bằng tổng điện tích dương (p₀ + N_d⁺): điều kiện trung hòa.');
  }
};
LD.doping = {
  intro: [
    ['i', 'E_c − E_F = kT·ln(N_c/N_d): pha càng đậm thì E_F càng sát dải. Với loại P là E_F − E_v = kT·ln(N_v/N_a).'],
    ['w', 'Nét đứt là công thức Boltzmann, nét liền là giá trị chính xác từ Fermi–Dirac. Hai nét trùng nhau khi pha nhẹ.'],
    ['w', 'Pha trên cỡ 3×10¹⁷ thì E_F cách dải chưa tới 3kT, hai nét tách ra, và vượt N_c thì E_F vào hẳn trong dải: suy biến.'],
    ['v', 'Kéo N lên 10²⁰ rồi đổi loại N/P, đổi T.']
  ],
  react(S, k, P, say) {
    const d = LABS.find(l => l.id === 'doping').calc();
    say('v', `N = ${pw(S.N)}: ${S.type === 'n' ? 'E_c − E_F' : 'E_F − E_v'} = ${d.dist.toFixed(3)} eV = ${(d.dist / d.kT).toFixed(1)} kT.`);
    say('w', d.dist / d.kT < 0 ? 'E_F đã nằm trong dải: suy biến, công thức Boltzmann sai nặng.' : d.dist / d.kT < 3 ? 'Dưới 3kT: Boltzmann bắt đầu lệch so với giá trị chính xác.' : 'Trên 3kT: nét đứt và nét liền gần trùng nhau.');
  }
};
LD.temp = {
  intro: [
    ['i', 'Tăng nhiệt độ qua ba chặng. Chặng lạnh: đóng băng (donor chưa nhả). Chặng giữa: ngoại lai, n₀ ≈ N_d phẳng.'],
    ['w', 'Chặng nóng: electron nhảy thẳng qua vùng cấm đông hơn cả donor, n₀ ≈ nᵢ(T), tăng rất nhanh. Bán dẫn trở lại như bán dẫn thuần, E_F về E_Fi.'],
    ['w', 'Pha càng nặng thì chặng ngoại lai kéo dài lên nhiệt độ càng cao.'],
    ['v', 'Kéo T từ 20 K lên 900 K, thử đổi N_d.']
  ],
  react(S, k, P, say) {
    const r = solveEF(S.T, S.N, 0), ni = NI(S.T);
    say('v', `T = ${S.T} K: E_F = ${r.E.toFixed(3)} eV (so với E_c), n₀ = ${sci(r.n, 1)}, nᵢ = ${sci(ni, 1)}.`);
    say('w', r.ionD < .85 ? 'Đóng băng: n₀ nhỏ, E_F nằm giữa E_d và E_c.' : ni > .3 * S.N ? 'Nội tại: nᵢ cỡ hoặc lớn hơn N_d, E_F tiến về E_Fi.' : 'Ngoại lai: n₀ ≈ N_d, đây là cửa sổ làm việc ổn định của linh kiện.');
  }
};
LD.contact = {
  intro: [
    ['i', 'Loại N có E_F cao (gần E_c), loại P có E_F thấp (gần E_v). Khi chưa ghép, hai E_F lệch nhau.'],
    ['w', 'Ghép lại, electron chảy từ N sang P (từ mức cao xuống mức thấp) cho tới khi E_F hai bên bằng nhau, như hai bình nước nối thông.'],
    ['w', 'Cân bằng xong, E_F nằm ngang suốt, còn các dải E_c, E_v bị uốn một đoạn đúng bằng độ chênh E_F ban đầu: qV_bi = kT·ln(N_d N_a/nᵢ²).'],
    ['v', 'Bấm "Sau khi ghép" để xem dải uốn, đổi N_d, N_a để đổi V_bi.']
  ],
  react(S, k, P, say) {
    const V = .0259 * Math.log(Math.pow(10, S.Nd + S.Na) / (1.5e10 * 1.5e10));
    if (k === 'on') say('w', S.on ? 'Ghép: electron từ N sang P, dải bên P bị đẩy lên cho tới khi E_F thẳng hàng.' : 'Về trạng thái tách rời, E_F hai bên lệch nhau.');
    else say('v', `N_d = ${pw(Math.pow(10, S.Nd))}, N_a = ${pw(Math.pow(10, S.Na))} → qV_bi = ${V.toFixed(2)} eV.`);
    if (k !== 'on') say('w', 'Pha càng nặng thì E_F hai bên càng xa nhau nên dải uốn càng nhiều.');
  }
};
LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP
   ========================================================================== */
const CSS = `
#lab6{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab6[hidden]{display:none}
#lab6 *{box-sizing:border-box}
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
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'ef';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab6'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 6');
  root.innerHTML = '<div class="lb-win"><div class="lb-h"><span class="lb-ic">' + FLASK + '</span><span class="lb-bd">Phòng thí nghiệm · Buổi 6</span><nav class="lb-tabs"></nav><button class="lb-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb-b'); tabsEl = root.querySelector('.lb-tabs');
  LABS.forEach(l => { const b = document.createElement('button'); b.type = 'button'; b.className = 'lb-tab'; b.dataset.id = l.id; b.textContent = l.no + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b); });
  root.querySelector('.lb-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) { const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName); if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty && window.LabB6 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden && (document.getElementById('tb-badge')||{}).textContent === 'Buổi 6') { e.preventDefault(); open(); } return; }
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
const H3MAP = [[/^1\.2/, 'ef', 0], [/^2\.2/, 'ef', 1], [/^3\.1/, 'fd', 0], [/^6\.1/, 'ion', 0], [/^7\.3/, 'comp', 0], [/^9\.1/, 'temp', 0], [/^10\.2/, 'contact', 0]];
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

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 6') markLesson(document.getElementById('app-content'));
window.LabB6 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
