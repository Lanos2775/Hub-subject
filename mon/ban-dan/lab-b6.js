/* ==========================================================================
   lab-b6.js — PHÒNG THÍ NGHIỆM BUỔI 6 (popup 95% màn hình) — làm lại theo khung lab-b8.js
   - Bán dẫn pha tạp: n₀p₀ = nᵢ², suy biến, ion hóa & đóng băng, bù trừ, cấy ion,
     3 vùng nhiệt, tiếp xúc N–P. Tab ★ Tổng quan: khối N–P 3D xoay / zoom / tua chậm / focus.
   - Mỗi tab 2 khung: "Thực tế" (dụng cụ, đồng hồ) và "Bên trong" (tinh thể, có chế độ
     "Trường 2D" kèm chú thích dải màu). KHÔNG biểu đồ, KHÔNG sơ đồ.
   - Màu vai trò: electron = c2 · lỗ trống = c4 · donor⁺ = c1 · acceptor⁻ = c5 · cảnh báo = err.
   - API: LabB6.open(tabId?, panelIndex?)  LabB6.close()  LabB6.mark(root)  LabB6.tabs()
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
/* ---------- hằng số & vật lý Bài 6 ---------- */

const TAU = TAU2;
const EG = 1.12;              // eV (vùng cấm Si)
const NC0 = 2.8e19;           // cm⁻³ ở 300 K
const NV0 = 1.04e19;          // cm⁻³ ở 300 K
const NI0 = 1.5e10;           // cm⁻³ ở 300 K (giá trị chuẩn dùng trong Bài 6)
const KT300 = 0.0259;         // eV ở 300 K (khớp chính xác mọi ví dụ & bài tập Bài 6)
const E_ION_D = 0.045;        // eV (năng lượng ion hóa P trong Si)
const E_ION_A = 0.045;        // eV (năng lượng ion hóa B trong Si)

const ex = x => Math.exp(clamp(x, -300, 300));
const lg10 = v => Math.log10(Math.max(v, 1e-30));

/* Bộ sinh số giả ngẫu nhiên cố định theo seed để lưới tạp chất không nhấp nháy */
function mkRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const toSup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[d] || d).join('');
const fmtPow = v => {
  if (!v || v <= 0) return '0';
  const e = Math.floor(Math.log10(v));
  const m = v / Math.pow(10, e);
  if (Math.abs(m - 1) < 0.06) return '10' + toSup(e);
  if (Math.abs(m - 10) < 0.06) return '10' + toSup(e + 1);
  return m.toFixed(1) + '×10' + toSup(e);
};
const fmtSci = (v, d = 2) => {
  if (!v || !isFinite(v)) return '0';
  const sgn = v < 0 ? '−' : '';
  const av = Math.abs(v);
  if (av >= 0.01 && av < 1000) return sgn + av.toFixed(d);
  const e = Math.floor(Math.log10(av));
  const m = av / Math.pow(10, e);
  return sgn + m.toFixed(d) + '×10' + toSup(e);
};

/* ---------- Mô hình vật lý chính xác Bài 6 ---------- */
const kT_of = T => KT300 * (T / 300);
const Nc_of = T => NC0 * Math.pow(T / 300, 1.5);
const Nv_of = T => NV0 * Math.pow(T / 300, 1.5);
const ni_of = T => NI0 * Math.pow(T / 300, 1.5) * ex(-EG / (2 * kT_of(T)) + EG / (2 * KT300));

/* Tích phân Fermi–Dirac bậc 1/2: F_{1/2}(η_F) = ∫₀^∞ η^(1/2) / (1 + e^(η − η_F)) dη */
function F12(eta) {
  if (eta < -22) return (Math.sqrt(Math.PI) * 0.5) * Math.exp(eta);
  const uMax = Math.sqrt(Math.max(eta, 0) + 38);
  const N = 220;
  const h = uMax / N;
  let sum = 0;
  for (let i = 0; i <= N; i++) {
    const u = i * h;
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    const arg = u * u - eta;
    const denom = arg > 300 ? Infinity : (1 + Math.exp(arg));
    sum += w * (2 * u * u) / denom;
  }
  return (sum * h) / 3;
}
const nFD_of = (N_eff, eta) => (2 / Math.sqrt(Math.PI)) * N_eff * F12(eta);

/* Giải ngược η sao cho (2/√π) F_{1/2}(η) = ratio */
function etaForRatio(ratio) {
  const r = Math.max(ratio, 1e-20);
  if (r < 1e-4) return Math.log(r);
  let lo = -25, hi = 60;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) * 0.5;
    if ((2 / Math.sqrt(Math.PI)) * F12(mid) < r) lo = mid;
    else hi = mid;
  }
  return (lo + hi) * 0.5;
}

/* Giải phương trình trung hòa điện tích đầy đủ (cả Fermi–Dirac + thống kê donor g=2, acceptor g=4)
   Quy ước mốc năng lượng: E_c = 0, E_v = −E_g = −1.12 eV. */
function solveNeutrality(T, Nd, Na) {
  const kT = kT_of(T);
  const nc = Nc_of(T);
  const nv = Nv_of(T);
  const Ed = -E_ION_D;
  const Ea = -EG + E_ION_A;
  // Tính hiệu điện tích (âm − dương) = n + N_a⁻ − p − N_d⁺ (hàm đơn điệu tăng theo E_F)
  // Chú ý hệ số suy biến: N_d⁺ = N_d / (1 + 2·exp((E_F − E_d)/kT)), N_a⁻ = N_a / (1 + 4·exp((E_a − E_F)/kT))
  const netNeg = E => {
    const n = nFD_of(nc, E / kT);
    const p = nFD_of(nv, (-EG - E) / kT);
    const ndPlus = Nd > 0 ? Nd / (1 + 2 * ex((E - Ed) / kT)) : 0;
    const naMinus = Na > 0 ? Na / (1 + 4 * ex((Ea - E) / kT)) : 0;
    return (n + naMinus) - (p + ndPlus);
  };
  let lo = -EG - 0.35, hi = 0.45;
  for (let i = 0; i < 72; i++) {
    const mid = (lo + hi) * 0.5;
    if (netNeg(mid) < 0) lo = mid;
    else hi = mid;
  }
  const Ef = (lo + hi) * 0.5;
  const n = nFD_of(nc, Ef / kT);
  const p = nFD_of(nv, (-EG - Ef) / kT);
  const ndPlus = Nd > 0 ? Nd / (1 + 2 * ex((Ef - Ed) / kT)) : 0;
  const naMinus = Na > 0 ? Na / (1 + 4 * ex((Ea - Ef) / kT)) : 0;
  const ndNeut = Math.max(0, Nd - ndPlus);
  const naNeut = Math.max(0, Na - naMinus);
  const Efi = -EG * 0.5 + 0.5 * kT * Math.log(nv / nc);
  return {
    Ef, Efi, kT, nc, nv, n, p,
    ndPlus, naMinus, ndNeut, naNeut,
    ionD: Nd > 0 ? ndPlus / Nd : 1,
    ionA: Na > 0 ? naMinus / Na : 1
  };
}

/* Độ linh động Caughey–Thomas ước lượng độ dẫn thực của wafer Si (cho đồng hồ đo độ dẫn) */
function muSi(Ntot, isN) {
  if (isN) return 92 + (1350 - 92) / (1 + Math.pow(Ntot / 1.3e17, 0.91));
  return 49 + (480 - 49) / (1 + Math.pow(Ntot / 6.3e16, 0.76));
}


/* ==========================================================================
   LÕI VẼ DÙNG CHUNG: màu → RGB, Trường 2D (dải màu đồng mức + chú thích), tinh thể "Bên trong"
   ========================================================================== */
const _cc = document.createElement('canvas').getContext('2d');
function rgbOf(col) {
  _cc.fillStyle = '#000'; _cc.fillStyle = col; const v = String(_cc.fillStyle);
  if (v[0] === '#') { const h = v.length === 4 ? v.replace(/./g, (c, i) => i ? c + c : c) : v; return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  const m = v.match(/[\d.]+/g) || [128, 128, 128]; return [+m[0], +m[1], +m[2]];
}
const FLV = 6; // số dải màu đồng mức
const cntOf = v => Math.round(clamp((lg10(v) - 4) / 16 * 46, 0, 46));
const cssMix = (a, b, f) => a.map((x, i) => Math.round(x * (1 - f) + b[i] * f));

/* Trường 2D kiểu kính hiển vi nền đêm (như bản cũ): dương = electron (Inferno ấm), âm = lỗ trống (Ice-Cyan lạnh), phân tầng đồng mức */
const NIGHT_BG = '#0f0c14', NIGHT_RGB = [15, 12, 20], NIGHT_INK = '#d9d6e0';
const PAL_POS = [[59, 18, 93], [113, 31, 119], [190, 54, 99], [236, 104, 46], [251, 169, 44], [254, 241, 182]];
const PAL_NEG = [[16, 52, 82], [22, 94, 130], [30, 141, 168], [52, 190, 201], [126, 232, 230], [218, 254, 254]];
const COL_WARM = '#fba92c', COL_CYAN = '#34bec9', FTH = [.09, .20, .34, .50, .68, .85];
const rgbS = c => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
function glowDot(ctx, x, y, r, core, glow) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6); g.addColorStop(0, core); g.addColorStop(.42, glow); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, TAU2); ctx.fill();
}
/* màu liên tục: nội suy tuyến tính qua bảng màu, 0 → nền đêm */
function palAt(pal, av) {
  const f = clamp((av - .02) / .9, 0, 1) * 5.999, i = Math.floor(f), m = f - Math.floor(f), a = i === 0 ? NIGHT_RGB : pal[i - 1], b = pal[i], k = Math.min(1, av / .08);
  const c = [0, 1, 2].map(j => a[j] + (b[j] - a[j]) * m); return k < 1 ? [0, 1, 2].map(j => NIGHT_RGB[j] + (c[j] - NIGHT_RGB[j]) * k) : c;
}
function drawField(ctx, x, y, w, h, fn, st) {
  const rw = 160, rh = Math.max(48, Math.round(160 * h / w));
  if (!st.fc || st.fc.width !== rw || st.fc.height !== rh) { st.fc = document.createElement('canvas'); st.fc.width = rw; st.fc.height = rh; st.fx = st.fc.getContext('2d'); st.fi = st.fx.createImageData(rw, rh); }
  const d = st.fi.data;
  for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
    const v = fn((i + .5) / rw, (j + .5) / rh), c = palAt(v >= 0 ? PAL_POS : PAL_NEG, Math.abs(v)), k = (j * rw + i) * 4;
    d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
  }
  st.fx.putImageData(st.fi, 0, 0); ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(st.fc, x, y, w, h); ctx.restore();
}
/* Chú thích dải màu: lỗ trống nhiều ← | trống | → electron nhiều */
function fieldLegend(ctx, x, y, w, o) {
  o = o || {}; const n = FLV, sw = clamp((w - 40) / (2 * n + 3), 8, 34), gx = x + w / 2 - (2 * n + 1) * sw / 2;
  const gw = (2 * n + 1) * sw, lg = ctx.createLinearGradient(gx, 0, gx + gw, 0), N = 24;
  for (let i = 0; i <= N; i++) { const q = i / N, v = (q - .5) * 2, c = palAt(v >= 0 ? PAL_POS : PAL_NEG, Math.abs(v)); lg.addColorStop(q, rgbS(c.map(Math.round))); }
  ctx.fillStyle = lg; rr(ctx, gx, y, gw, 12, 4); ctx.fill();
  txt(ctx, o.neg || 'lỗ trống (đậm = nhiều)', gx, y + 24, COL_CYAN, 10.5, 'left', 700);
  txt(ctx, o.mid || 'trống', gx + (n + .5) * sw, y + 24, C.mut, 10.5, 'center', 700);
  txt(ctx, o.pos || 'electron (đậm = nhiều)', gx + (2 * n + 1) * sw, y + 24, COL_WARM, 10.5, 'right', 700);
  if (o.note) txt(ctx, o.note, x + w / 2, y + 40, C.ink, 10.5, 'center', 600);
}

/* Tinh thể "Bên trong": mạng nguyên tử, donor/acceptor, e⁻, h⁺, vòng tái hợp. chế độ part | field */
function crystalInit(st) {
  if (st.cr) return st.cr; const rg = mkRng(77), mk = () => ({ u: rg(), v: rg(), vx: (rg() - .5) * .3, vy: (rg() - .5) * .3, ph: rg() * TAU }), grid = (off) => Array.from({ length: 20 }, (_, i) => ({ u: ((i % 5) + .5 + (rg() - .5) * .5 + off) / 5.2, v: (Math.floor(i / 5) + .5 + (rg() - .5) * .5) / 4, ph: rg() * TAU }));
  st.cr = { e: Array.from({ length: 48 }, mk), h: Array.from({ length: 48 }, mk), d: grid(0), a: grid(.5), fl: [] }; return st.cr;
}
function stepP(o, dt, sp) {
  o.u += o.vx * dt * sp; o.v += o.vy * dt * sp;
  if (o.u < 0 || o.u > 1) { o.vx *= -1; o.u = clamp(o.u, 0, 1); } if (o.v < 0 || o.v > 1) { o.vy *= -1; o.v = clamp(o.v, 0, 1); }
  o.vx = clamp(o.vx + gauss() * .8 * dt, -.35, .35); o.vy = clamp(o.vy + gauss() * .8 * dt, -.35, .35);
}
const legendH = 46;
function drawCrystal(ctx, x, y, w, h, o) {
  const st = o.st, cr = crystalInit(st), t = o.t, dt = o.dt || .016, field = !!o.field, lg = 0, ph = h - lg;
  rr(ctx, x, y, w, ph, 8); ctx.fillStyle = field ? NIGHT_BG : C.card; ctx.fill(); ctx.save(); rr(ctx, x, y, w, ph, 8); ctx.clip();
  const X = u => x + 8 + u * (w - 16), Y = v => y + 8 + v * (ph - 16), sp = o.speed || 1;
  const ne = o.ne | 0, nh = o.nh | 0;
  if (field) {
    const ker = o.ker || .085, asp = w / ph;
    drawField(ctx, x, y, w, ph, o.fieldFn || ((u, v) => { let s = 0; for (let i = 0; i < ne; i++) { const p = cr.e[i], du = (u - p.u) * asp, dv = v - p.v; s += Math.exp(-(du * du + dv * dv) / (2 * ker * ker)); } for (let i = 0; i < nh; i++) { const p = cr.h[i], du = (u - p.u) * asp, dv = v - p.v; s -= Math.exp(-(du * du + dv * dv) / (2 * ker * ker)); } return clamp(s * .5, -1, 1); }), st);
  }
  /* mạng nguyên tử + tạp chất (ẩn ở Trường 2D: chỉ xem nồng độ) */
  if (!field) {
  const vib = o.vib == null ? 1 : o.vib; ctx.lineWidth = 1.2; ctx.strokeStyle = field ? 'rgba(217,214,224,.35)' : C.g;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) { ctx.beginPath(); ctx.arc(X((c + .5) / 9) + Math.sin(t * 9 + r * 3 + c) * vib, Y((r + .5) / 5) + Math.cos(t * 10 + c * 4 + r) * vib, 4.4, 0, TAU2); ctx.stroke(); }
  /* tạp chất cố định */
  const nd = o.nd | 0, na = o.na | 0, di = Math.round(nd * clamp(o.ndIon == null ? 1 : o.ndIon, 0, 1)), ai = Math.round(na * clamp(o.naIon == null ? 1 : o.naIon, 0, 1));
  for (let i = 0; i < nd; i++) { const p = cr.d[i], px = X(p.u), py = Y(p.v);
    if (i < di) { dot(ctx, px, py, 5.4, C.c1); txt(ctx, '+', px, py + .5, C.bg, 10, 'center', 800); }
    else { ctx.beginPath(); ctx.arc(px, py, 5.4, 0, TAU2); ctx.strokeStyle = C.c1; ctx.lineWidth = 1.6; ctx.stroke(); if (!field) dot(ctx, px + Math.cos(t * 3 + p.ph) * 11, py + Math.sin(t * 3 + p.ph) * 11, 2.6, C.c2); } }
  for (let i = 0; i < na; i++) { const p = cr.a[i], px = X(p.u), py = Y(p.v);
    if (i < ai) { dot(ctx, px, py, 5.4, C.c5); txt(ctx, '−', px, py + .5, C.bg, 10, 'center', 800); }
    else { ctx.beginPath(); ctx.arc(px, py, 5.4, 0, TAU2); ctx.strokeStyle = C.c5; ctx.lineWidth = 1.6; ctx.stroke(); if (!field) { ctx.beginPath(); ctx.arc(px + Math.cos(t * 3 + p.ph) * 11, py + Math.sin(t * 3 + p.ph) * 11, 3, 0, TAU2); ctx.strokeStyle = C.c4; ctx.lineWidth = 1.3; ctx.stroke(); } } }
  }
  /* hạt tải tự do */
  if (!o.noStep) for (let i = 0; i < 48; i++) { if (i < ne) stepP(cr.e[i], dt, sp); if (i < nh) stepP(cr.h[i], dt, sp); }
  if (!field) {
    for (let i = 0; i < ne; i++) { const p = cr.e[i]; dot(ctx, X(p.u), Y(p.v), 4.4, C.c2); txt(ctx, '−', X(p.u), Y(p.v) + .5, C.bg, 8.5, 'center', 800); }
    for (let i = 0; i < nh; i++) { const p = cr.h[i]; ctx.beginPath(); ctx.arc(X(p.u), Y(p.v), 5, 0, TAU2); ctx.strokeStyle = C.c4; ctx.lineWidth = 1.7; ctx.stroke(); txt(ctx, '+', X(p.u), Y(p.v) + .5, C.c4, 9, 'center', 800); }
  }
  /* tái hợp / sinh nhiệt: vòng lóe */
  if (o.recomb && !o.noStep && Math.random() < dt * o.recomb) cr.fl.push({ u: rnd(.1, .9), v: rnd(.12, .88), a: 1 });
  cr.fl = cr.fl.filter(f => (f.a -= dt * 1.9) > 0);
  if (!field) cr.fl.forEach(f => { ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(X(f.u), Y(f.v), 4 + (1 - f.a) * 16, 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 1.8; ctx.stroke(); ctx.globalAlpha = 1; });
  if (o.extra && !field) o.extra(ctx, X, Y, x, y, w, ph);
  ctx.restore(); rr(ctx, x, y, w, ph, 8); ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
  if (o.label) txt(ctx, o.label, x + w / 2, y + ph - 12, field ? NIGHT_INK : C.ink, 11, 'center', 700);
  return { X, Y, ph };
}

/* Khối đẳng cự nhỏ cho "Thực tế": mặt trước, mặt trên, mặt phải */
function isoBox(ctx, ox, oy, w, d, h, col, al) {
  const dx = d * .6, dy = -d * .32, f = (pts, a) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fill(); ctx.restore(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.1; ctx.stroke(); };
  f([[ox, oy], [ox + w, oy], [ox + w, oy - h], [ox, oy - h]], al); f([[ox, oy - h], [ox + w, oy - h], [ox + w + dx, oy - h + dy], [ox + dx, oy - h + dy]], al * .75); f([[ox + w, oy], [ox + w + dx, oy + dy], [ox + w + dx, oy - h + dy], [ox + w, oy - h]], al * .55);
  return { dx, dy };
}
const sm = (st, k, target, dt, tau) => { st[k] = st[k] == null ? target : st[k] + (target - st[k]) * (1 - Math.exp(-dt / (tau || .15))); return st[k]; };
const fmtV = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + ' eV';
const viewCtrl = { k: 'view', seg: [['part', 'Hạt'], ['field', 'Trường 2D']] };

const LABS = [];
const iFlag = S => S.dE > .02 ? 'Loại N (electron áp đảo)' : S.dE < -.02 ? 'Loại P (lỗ trống áp đảo)' : 'Bán dẫn thuần (n₀ = p₀ = nᵢ)';
const balCalc = S => { const kT = kT_of(S.T), ni = ni_of(S.T); return { kT, ni, n0: ni * ex(S.dE / kT), p0: ni * ex(-S.dE / kT) }; };

/* ==========================================================================
   1. CÂN BẰNG n₀p₀ = nᵢ² — bập bênh hạt tải (Mục 1–2, Câu 1)
   ========================================================================== */
const shr = p => p.tab.cs || (p.tab.cs = {});
function balDraw(p, ctx, W, H, t, dt, f) {
  const S = p.S, st = shr(p), sp = Math.sqrt(S.T / 300), vib = .5 + (S.T - 250) / 180, ns = !f ? false : true;
  if (!S.sym) { const K = balCalc(S);
    drawCrystal(ctx, 10, 8, W - 20, H - 16, { st, t, dt, field: f, noStep: f, ne: cntOf(K.n0), nh: cntOf(K.p0), vib, speed: sp, recomb: 2.4 + 3 * Math.abs(S.dE),
      label: iFlag(S) + ' · n₀ = ' + sci(K.n0, 1) + ' · p₀ = ' + sci(K.p0, 1) + ' · n₀p₀ = nᵢ² = ' + sci(K.ni * K.ni, 1) + ' (T = ' + S.T + ' K)' });
  } else { const kT = kT_of(S.T), ni = ni_of(S.T), hw = (W - 30) / 2, A = ni * ex(.30 / kT), B = ni * ex(-.30 / kT); st.s2 = st.s2 || {};
    drawCrystal(ctx, 10, 8, hw, H - 16, { st, t, dt, field: f, noStep: f, ne: cntOf(A), nh: cntOf(B), vib, speed: sp, recomb: 3.5, label: 'Loại N (+0,30 eV): n₀ = ' + sci(A, 1) + ' · p₀ = ' + sci(B, 1) });
    drawCrystal(ctx, 20 + hw, 8, hw, H - 16, { st: st.s2, t, dt, field: f, noStep: f, ne: cntOf(B), nh: cntOf(A), vib, speed: sp, recomb: 3.5, label: 'Loại P (−0,30 eV): p₀ = ' + sci(A, 1) + ' · n₀ = ' + sci(B, 1) });
  }
}
LABS.push({
  id: 'balance', no: '1–2', name: 'Cân bằng n₀p₀', secs: [1, 2],
  S: { dE: .30, T: 300, sym: 0 },
  cols: '1.6fr 1fr', rows: '1fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Hạt: biển hạt tải trong tinh thể — đẩy E_F lên thì electron (chấm đặc) nhiều thêm, lỗ trống (vòng rỗng) ít đi', area: 'a', anim: true,
      ctrls: [
        { k: 'dE', l: 'E_F − E_Fi', min: -.45, max: .45, step: .01, f: fmtV },
        { k: 'T', l: 'Nhiệt độ T', min: 250, max: 450, step: 10, f: v => v + ' K' },
        { k: 'sym', seg: [[0, 'Một mẫu'], [1, 'Đối xứng ±0,30 eV (Câu 1)']] },
        { btn: 'Câu 1a (+0,30 eV)', fn: p => { p.S.dE = .30; p.S.T = 300; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Thuần (0 eV)', fn: p => { p.S.dE = 0; p.S.T = 300; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) { balDraw(p, ctx, W, H, t, dt, false); } },
    { title: 'Trường 2D: mật độ hạt tải của chính khung phía trên — vùng ấm là electron, vùng lạnh là lỗ trống', area: 'c', anim: true,
      ctrls: [{ legend: { neg: 'lỗ trống (đậm = nhiều)', pos: 'electron (đậm = nhiều)', mid: 'trống' }, always: 1 }],
      draw(p, ctx, W, H, t, dt) { balDraw(p, ctx, W, H, t, dt, true); } }
  ]
});

/* ==========================================================================
   2. SUY BIẾN — quầng tạp chất chồng lấn, Fermi–Dirac (Mục 3–4, Câu 2)
   ========================================================================== */
const AB_NM = 2.5;
const degCalc = S => {
  const Neff = S.type === 'n' ? Nc_of(S.T) : Nv_of(S.T), kT = kT_of(S.T), ratio = S.N / Neff, eta = etaForRatio(ratio), nB = Neff * Math.exp(eta), err = (nB - S.N) / S.N;
  const d = 1e7 / Math.cbrt(S.N), rt = AB_NM / d, reg = eta < -3 ? 0 : eta < 0 ? 1 : 2;
  return { Neff, kT, eta, err, d, rt, reg, free: clamp((rt - .35) / .45, 0, 1) };
};
function degInit(st) { if (!st.dp) { const rg = mkRng(31); st.dp = Array.from({ length: 24 }, (_, i) => ({ u: ((i % 6) + .5 + (rg() - .5) * .6) / 6, v: (Math.floor(i / 6) + .5 + (rg() - .5) * .6) / 4, ph: rg() * TAU })); } return st.dp; }
function degDraw(p, ctx, W, H, t, dt, f) {
  const S = p.S, st = shr(p), K = degCalc(S), isN = S.type === 'n', col = isN ? C.c2 : C.c4, NDON = 24, dp = degInit(st);
  const rw = W - 20, rh = H - 16, sp = Math.sqrt(rw * rh / NDON), rH = clamp(K.rt * 1.8, .1, 2.2) * sp, nfree = Math.round(K.free * NDON), sgn = isN ? 1 : -1;
  const regs = ['không suy biến: Boltzmann đúng', 'gần ngưỡng 3kT: bắt đầu lệch', 'suy biến: phải dùng Fermi–Dirac'];
  drawCrystal(ctx, 10, 8, W - 20, H - 16, { st, t, dt, field: f, noStep: f, ne: isN ? nfree : 0, nh: isN ? 0 : nfree, vib: .6, speed: 1,
    fieldFn: (u, v) => { let s = 0; dp.forEach(q => { const dx = (u - q.u) * rw, dy = (v - q.v) * rh, g = rH * 1.2; s += Math.exp(-(dx * dx + dy * dy) / (2 * g * g)); }); return sgn * clamp(s * .6, 0, 1); },
    label: (isN ? 'N_d = ' : 'N_a = ') + fmtPow(S.N) + ' · a_B/d = ' + K.rt.toFixed(2) + ' · η_F = ' + (K.eta >= 0 ? '+' : '−') + Math.abs(K.eta).toFixed(2) + ' · Boltzmann lệch ' + (K.err >= 0 ? '+' : '−') + Math.abs(K.err * 100).toFixed(1) + '% · ' + regs[K.reg],
    extra: (c, X, Y) => { dp.forEach((q, i) => { const px = X(q.u), py = Y(q.v);
      if (!f) { c.beginPath(); c.arc(px, py, rH, 0, TAU2); c.save(); c.globalAlpha = .13; c.fillStyle = col; c.fill(); c.restore(); c.strokeStyle = col; c.lineWidth = 1.1; c.stroke(); }
      dot(c, px, py, 4.6, isN ? C.c1 : C.c5); txt(c, isN ? '+' : '−', px, py + .5, C.bg, 8.5, 'center', 800);
      if (!f && i >= nfree) dot(c, px + Math.cos(t * 3 + q.ph) * rH * .5, py + Math.sin(t * 3 + q.ph) * rH * .5, 2.6, col); }); } });
}
LABS.push({
  id: 'degenerate', no: '3–4', name: 'Suy biến & FD', secs: [3, 4],
  S: { N: 1e17, type: 'n', T: 300 },
  cols: '1.6fr 1fr', rows: '1fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Hạt: quầng Bohr quanh mỗi tạp chất — pha tạp càng nặng, quầng càng chồng lấn, hạt tải càng thoát khỏi tạp chất', area: 'a', anim: true,
      ctrls: [
        { k: 'type', seg: [['n', 'Loại N (donor)'], ['p', 'Loại P (acceptor)']] },
        { k: 'N', l: 'Pha tạp N', min: 15, max: 21, step: .1, log: 1, f: v => fmtPow(v) },
        { k: 'T', l: 'Nhiệt độ T', min: 200, max: 450, step: 10, f: v => v + ' K' },
        { btn: 'Không suy biến (10¹⁶)', fn: p => { p.S.N = 1e16; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Ngưỡng 3kT', fn: p => { const K = degCalc(p.S); p.S.N = Math.pow(10, Math.round(Math.log10(K.Neff * .075) * 10) / 10); p.syncCtrls(); p.dirty = true; } },
        { btn: 'Suy biến (3×10¹⁹)', fn: p => { p.S.N = 3e19; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) { degDraw(p, ctx, W, H, t, dt, false); } },
    { title: 'Trường 2D: mỗi vết sáng là quầng của một tạp chất — khi các vết dính nhau thành mảng, hạt tải chạy khắp tinh thể', area: 'c', anim: true,
      ctrls: [{ legend: { neg: 'quầng lỗ trống (đậm = chồng lấn)', pos: 'quầng electron (đậm = chồng lấn)', mid: 'ngoài quầng' }, always: 1 }],
      draw(p, ctx, W, H, t, dt) { degDraw(p, ctx, W, H, t, dt, true); } }
  ]
});

/* ==========================================================================
   3. ION HÓA & ĐÓNG BĂNG — buồng Cryostat (Mục 5–6, VD 6.1, 6.3, Câu 3)
   ========================================================================== */
const ionCalc = S => { const d = S.type === 'd', sn = solveNeutrality(S.T, d ? S.N : 0, d ? 0 : S.N); return { sn, ion: d ? sn.ionD : sn.ionA, free: d ? sn.n : sn.p, d }; };
LABS.push({
  id: 'ionize', no: '5–6', name: 'Ion hóa & Đóng băng', secs: [5, 6],
  S: { T: 100, N: 1e16, type: 'd', view: 'part' },
  cols: '1.6fr 1fr', rows: '1fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Thực tế: buồng Cryostat — làm lạnh thì tạp chất giữ chặt hạt tải (đóng băng), nóng lên thì nhả hết', area: 'a', anim: true,
      ctrls: [
        { k: 'type', seg: [['d', 'Donor P (g = 2)'], ['a', 'Acceptor B (g = 4)']] },
        { k: 'T', l: 'Nhiệt độ T', min: 10, max: 500, step: 5, f: v => v + ' K' },
        { k: 'N', l: 'Pha tạp N', min: 14, max: 19, step: .1, log: 1, f: v => fmtPow(v) },
        { btn: 'Đóng băng (35 K)', fn: p => { p.S.T = 35; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Ion hóa hết (300 K)', fn: p => { p.S.T = 300; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, K = ionCalc(S), cold = clamp((220 - S.T) / 190, 0, 1);
        const fx = W * .08, fw = W * .3, fy = H * .12, fh = H * .76;
        rr(ctx, fx, fy, fw, fh, 14); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 2; ctx.stroke();
        const lh = fh * (.18 + .55 * cold), ly = fy + fh - lh; ctx.save(); ctx.globalAlpha = .28; ctx.fillStyle = C.c2; rr(ctx, fx + 4, ly, fw - 8, lh - 4, 10); ctx.fill(); ctx.restore();
        for (let i = 0; i < 6; i++) { const bx = fx + 18 + ((i * 37) % (fw - 36)), by = fy + fh - 12 - ((t * 24 + i * 29) % (lh - 10)); if (lh > 16) { ctx.beginPath(); ctx.arc(bx, by, 2.4, 0, TAU2); ctx.strokeStyle = C.c2; ctx.lineWidth = 1.2; ctx.stroke(); } }
        txt(ctx, S.T < 120 ? 'bể làm lạnh' : 'bể ấm', fx + fw / 2, fy + 14, C.mut, 10.5, 'center', 700);
        const cx = fx + fw / 2, cy = fy + fh * .42, cw = fw * .5; isoBox(ctx, cx - cw / 2, cy + 18, cw, 26, 22, K.d ? C.c2 : C.c4, .35);
        txt(ctx, 'chip Si', cx, cy + 40, C.ink, 10.5, 'center', 700);
        for (let i = 0; i < Math.round(cold * 14); i++) { const a = i * 2.4 + 1, r = 38 + (i % 4) * 9, sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r * .7; for (let k = 0; k < 3; k++) ln(ctx, sx - 5 * Math.cos(k * 1.05), sy - 5 * Math.sin(k * 1.05), sx + 5 * Math.cos(k * 1.05), sy + 5 * Math.sin(k * 1.05), C.c2, 1.3); }
        const tx = W * .46, ty = H * .16, th = H * .62, fl = clamp(S.T / 500, 0, 1);
        rr(ctx, tx - 7, ty, 14, th, 7); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.8; ctx.stroke();
        dot(ctx, tx, ty + th + 8, 12, S.T > 300 ? C.err : S.T < 150 ? C.c2 : C.c1); rr(ctx, tx - 3, ty + th - th * fl, 6, th * fl + 4, 3); ctx.fillStyle = S.T > 300 ? C.err : S.T < 150 ? C.c2 : C.c1; ctx.fill();
        txt(ctx, S.T + ' K', tx, ty - 12, C.ink, 12.5, 'center', 800);
        const gr = Math.min(W * .075, H * .2, 40);
        gauge(ctx, W * .64, H * .50, gr, 'Tạp đã ion hóa', (K.ion * 100).toFixed(1) + '%', K.ion, K.ion > .95 ? C.c5 : K.ion < .5 ? C.c2 : C.c1);
        gauge(ctx, W * .86, H * .50, gr, K.d ? 'n tự do (cm⁻³)' : 'p tự do (cm⁻³)', sci(K.free, 1), (lg10(K.free) - 2) / 17, K.d ? C.c2 : C.c4);
        txt(ctx, K.ion < .5 ? 'ĐÓNG BĂNG: hạt tải kẹt trong quầng tạp' : K.ion > .95 ? 'ION HÓA HOÀN TOÀN: n ≈ N' : 'đang ion hóa dần', W * .75, H - 16, K.ion > .95 ? C.c5 : C.c1, 11.5, 'center', 700);
      } },
    { title: 'Bên trong: ô vuông đặc = tạp đã nhả hạt tải · ô rỗng có chấm quay quanh = tạp còn giữ hạt tải (đóng băng)', area: 'c', anim: true,
      ctrls: [viewCtrl, { legend: { note: 'Khi lạnh, rất ít vùng màu: hạt tải bị tạp chất giữ lại. Khi ấm, vùng màu bao khắp tinh thể.' } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, K = ionCalc(S), nI = 18, f = S.view === 'field';
        drawCrystal(ctx, 10, 8, W - 20, H - 16, { st: p.st, t, dt, field: f, ne: cntOf(K.sn.n), nh: cntOf(K.sn.p), nd: K.d ? nI : 0, na: K.d ? 0 : nI, ndIon: K.ion, naIon: K.ion, vib: .3 + S.T / 300 * .9, speed: Math.sqrt(S.T / 300), recomb: 1.2,
          label: 'T = ' + S.T + ' K · ' + (K.d ? 'donor' : 'acceptor') + ' ion hóa ' + (K.ion * 100).toFixed(1) + '%',
          legend: { note: 'Khi lạnh, rất ít vùng màu: hạt tải bị tạp chất giữ lại. Khi ấm, vùng màu bao khắp tinh thể.' } });
      } }
  ]
});

/* ==========================================================================
   4. BÙ TRỪ P⁺–B⁻ (Mục 7, Câu 4)
   ========================================================================== */
const cmpCalc = S => { const sn = solveNeutrality(S.T, S.Nd, S.Na), net = sn.n - sn.p; return { sn, net, type: net > 1e3 ? 'N' : net < -1e3 ? 'P' : '0' }; };
function cmpDraw(p, ctx, W, H, t, dt, f) {
  const S = p.S, st = shr(p), K = cmpCalc(S), nd = Math.round(clamp((lg10(S.Nd) - 14) / 4 * 16 + 4, 4, 20)), na = Math.round(clamp((lg10(S.Na) - 14) / 4 * 16 + 4, 4, 20));
  drawCrystal(ctx, 10, 8, W - 20, H - 16, { st, t, dt, field: f, noStep: f, ne: cntOf(K.sn.n), nh: cntOf(K.sn.p), nd, na, ndIon: K.sn.ionD, naIon: K.sn.ionA, vib: 1, recomb: 1,
    label: 'N_d = ' + fmtPow(S.Nd) + ' · N_a = ' + fmtPow(S.Na) + ' → mẫu ' + (K.type === '0' ? 'gần thuần' : 'loại ' + K.type) + ' · n = ' + sci(K.sn.n, 1) + ' · p = ' + sci(K.sn.p, 1),
    extra: f ? null : (c, X, Y) => { const cr = crystalInit(st), m = Math.min(nd, na, 6); for (let i = 0; i < m; i++) { const a = cr.d[i], b = cr.a[i]; ln(c, X(a.u), Y(a.v), X(b.u), Y(b.v), C.sub, 1, [3, 4]); const u = (t * .45 + i / m) % 1; c.globalAlpha = 1 - Math.abs(u - .5) * .5; dot(c, X(a.u) + (X(b.u) - X(a.u)) * u, Y(a.v) + (Y(b.v) - Y(a.v)) * u, 3.4, C.c2); c.globalAlpha = 1; } } });
}
LABS.push({
  id: 'compensate', no: '7', name: 'Bù trừ P⁺–B⁻', secs: [7],
  S: { Nd: 5e16, Na: 3e16, T: 300 },
  cols: '1.6fr 1fr', rows: '1fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Hạt: electron của donor P⁺ rơi xuống acceptor B⁻ (đường đứt) — chỉ phần dư mới thành hạt tải tự do', area: 'a', anim: true,
      ctrls: [
        { k: 'Nd', l: 'Donor P (N_d)', min: 15, max: 18, step: .05, log: 1, f: v => fmtPow(v) },
        { k: 'Na', l: 'Acceptor B (N_a)', min: 15, max: 18, step: .05, log: 1, f: v => fmtPow(v) },
        { btn: 'Câu 4: N_d = 5×10¹⁶, N_a = 3×10¹⁶', fn: p => { p.S.Nd = 5e16; p.S.Na = 3e16; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Bù trừ hoàn toàn', fn: p => { p.S.Nd = 3e16; p.S.Na = 3e16; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) { cmpDraw(p, ctx, W, H, t, dt, false); } },
    { title: 'Trường 2D: chỉ còn phần hạt tải dư sau bù trừ — N_d ≈ N_a thì gần như không còn vùng màu', area: 'c', anim: true,
      ctrls: [{ legend: { neg: 'lỗ trống (đậm = nhiều)', pos: 'electron (đậm = nhiều)', mid: 'trống' }, always: 1 }],
      draw(p, ctx, W, H, t, dt) { cmpDraw(p, ctx, W, H, t, dt, true); } }
  ]
});

/* ==========================================================================
   5. MÁY CẤY ION & E_F (Mục 8, Câu 5–6)
   ========================================================================== */
const desCalc = S => {
  const Na0 = S.baseNa === 0 ? 0 : Math.pow(10, S.baseNa), Nd = S.beam === 'P' ? S.dose : 0, Na = Na0 + (S.beam === 'B' ? S.dose : 0), d = Nd - Na, isN = d > 0, a = Math.abs(d);
  const h = a * .5 + Math.sqrt(a * a * .25 + NI0 * NI0), l = NI0 * NI0 / h, n = isN ? h : l, pp = isN ? l : h;
  const dist = isN ? KT300 * Math.log(NC0 / n) : KT300 * Math.log(NV0 / pp), sigma = 1.602e-19 * (n * muSi(Nd + Na, true) + pp * muSi(Nd + Na, false));
  return { Na0, Nd, Na, d, isN, n, p: pp, dist, kts: dist / KT300, sigma };
};
LABS.push({
  id: 'designer', no: '8', name: 'Cấy ion & E_F', secs: [8],
  S: { beam: 'P', baseNa: 16, dose: 2.24e16, view: 'part' },
  cols: '1.6fr 1fr', rows: '1fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Thực tế: máy cấy ion bắn P⁺ hoặc B⁺ vào wafer — liều cấy quyết định loại bán dẫn và khoảng cách E_F tới mép dải', area: 'a', anim: true,
      ctrls: [
        { k: 'beam', seg: [['P', 'Cấy donor P⁺'], ['B', 'Cấy acceptor B⁺']] },
        { k: 'baseNa', l: 'Nền B sẵn', min: 0, max: 16.5, step: .5, f: v => v === 0 ? 'thuần' : fmtPow(Math.pow(10, v)) },
        { k: 'dose', l: 'Liều cấy', min: 15, max: 18.8, step: .05, log: 1, f: v => fmtPow(v) },
        { btn: 'Câu 5 (0,20 eV)', fn: p => { Object.assign(p.S, { beam: 'P', baseNa: 16, dose: 2.24e16 }); p.syncCtrls(); p.dirty = true; } },
        { btn: 'Câu 6a (B 10¹⁶)', fn: p => { Object.assign(p.S, { beam: 'B', baseNa: 0, dose: 1e16 }); p.syncCtrls(); p.dirty = true; } },
        { btn: 'Câu 6b (B 10¹⁸)', fn: p => { Object.assign(p.S, { beam: 'B', baseNa: 0, dose: 1e18 }); p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, K = desCalc(S), P = S.beam === 'P', col = P ? C.c1 : C.c5;
        const mx = W * .3, nz = H * .1, wy = H * .66, ww = W * .46;
        rr(ctx, mx - 34, nz - 4, 68, 30, 6); ctx.fillStyle = C.tint; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.5; ctx.stroke();
        txt(ctx, P ? 'P⁺' : 'B⁺', mx, nz + 11, col, 13, 'center', 800);
        const bt = nz + 26, bb = wy - 4, bw = 8 + 22 * clamp((lg10(S.dose) - 15) / 3.8, 0, 1);
        ctx.beginPath(); ctx.moveTo(mx - 8, bt); ctx.lineTo(mx + 8, bt); ctx.lineTo(mx + bw, bb); ctx.lineTo(mx - bw, bb); ctx.closePath(); ctx.save(); ctx.globalAlpha = .18; ctx.fillStyle = col; ctx.fill(); ctx.restore();
        st.ion = st.ion || []; const rate = 6 + 60 * clamp((lg10(S.dose) - 15) / 3.8, 0, 1); if (Math.random() < dt * rate) st.ion.push({ x: mx + rnd(-1, 1) * 6, y: bt, k: rnd(-1, 1) });
        st.ion.forEach(q => { q.y += dt * 260; q.x += (mx + q.k * bw * (q.y - bt) / (bb - bt) - q.x) * .2; }); st.ion = st.ion.filter(q => q.y < bb + 6);
        st.ion.forEach(q => dot(ctx, q.x, q.y, 2.6, col));
        isoBox(ctx, mx - ww / 2, wy + 40, ww, 56, 36, K.d > 0 ? C.c2 : K.d < 0 ? C.c4 : C.sub, .3);
        txt(ctx, 'wafer ' + (K.d > 0 ? 'loại N' : K.d < 0 ? 'loại P' : 'thuần'), mx, wy + 62, C.ink, 11.5, 'center', 700);
        txt(ctx, 'nền B = ' + (K.Na0 ? fmtPow(K.Na0) : '0'), mx, wy + 80, C.c5, 10.5, 'center', 600);
        const gr = Math.min(W * .075, H * .2, 40);
        gauge(ctx, W * .7, H * .30, gr, K.isN ? 'E_c − E_F (kT)' : 'E_F − E_v (kT)', K.kts.toFixed(1) + ' kT', clamp(K.kts / 25, 0, 1), K.kts < 3 ? C.err : C.c5, 3 / 25);
        gauge(ctx, W * .9, H * .30, gr, 'Khoảng cách (eV)', K.dist.toFixed(3), clamp(K.dist / .6, 0, 1), C.main);
        gauge(ctx, W * .7, H * .72, gr, 'σ (S/cm)', sci(K.sigma, 1), clamp((lg10(K.sigma) + 6) / 9, 0, 1), C.c1);
        gauge(ctx, W * .9, H * .72, gr, K.isN ? 'n₀ (cm⁻³)' : 'p₀ (cm⁻³)', sci(K.isN ? K.n : K.p, 1), clamp((lg10(K.isN ? K.n : K.p) - 8) / 12, 0, 1), K.isN ? C.c2 : C.c4);
        txt(ctx, K.kts < 3 ? 'DƯỚI 3kT: Boltzmann sắp hết đúng' : 'không suy biến (≥ 3kT)', W * .8, H - 12, K.kts < 3 ? C.err : C.mut, 11, 'center', 700);
      } },
    { title: 'Bên trong: sau khi cấy, donor và acceptor bù nhau — phần dư quyết định màu của vùng trường', area: 'c', anim: true,
      ctrls: [viewCtrl, { legend: { note: 'Màu electron hay lỗ trống thắng tùy N_d − N_a dương hay âm; càng gần 0 thì càng nhạt.' } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, K = desCalc(S), nd = Math.round(clamp((lg10(Math.max(K.Nd, 1e15)) - 14) / 4.8 * 18 + 2, 0, 20)) * (K.Nd > 0 ? 1 : 0), na = Math.round(clamp((lg10(Math.max(K.Na, 1e15)) - 14) / 4.8 * 18 + 2, 0, 20)) * (K.Na > 0 ? 1 : 0);
        drawCrystal(ctx, 10, 8, W - 20, H - 16, { st: p.st, t, dt, field: S.view === 'field', ne: cntOf(K.n), nh: cntOf(K.p), nd, na, vib: 1, recomb: .8,
          label: (K.d > 0 ? 'loại N' : 'loại P') + ' · n = ' + sci(K.n, 1) + ' · p = ' + sci(K.p, 1),
          legend: { note: 'Màu electron hay lỗ trống thắng tùy N_d − N_a dương hay âm; càng gần 0 thì càng nhạt.' } });
      } }
  ]
});

/* ==========================================================================
   6. BA VÙNG NHIỆT ĐỘ (Mục 9, VD 9.x)
   ========================================================================== */
const thCalc = S => { const sn = solveNeutrality(S.T, S.Nd, 0), ni = ni_of(S.T), reg = sn.ionD < .85 ? 0 : ni >= .35 * S.Nd ? 2 : 1; return { sn, ni, reg }; };
LABS.push({
  id: 'thermal', no: '9', name: '3 vùng nhiệt độ', secs: [9],
  S: { T: 300, Nd: 1e16, view: 'part' },
  cols: '1.6fr 1fr', rows: '1fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Thực tế: chip Si pha tạp trên bàn nhiệt — lạnh thì đóng băng, vừa thì ổn định, quá nóng thì mất tính pha tạp', area: 'a', anim: true,
      ctrls: [
        { k: 'T', l: 'Nhiệt độ T', min: 20, max: 900, step: 5, f: v => v + ' K' },
        { k: 'Nd', l: 'Donor N_d', min: 14, max: 18, step: .1, log: 1, f: v => fmtPow(v) },
        { btn: '35 K', fn: p => { p.S.T = 35; p.syncCtrls(); p.dirty = true; } },
        { btn: '300 K', fn: p => { p.S.T = 300; p.syncCtrls(); p.dirty = true; } },
        { btn: '800 K', fn: p => { p.S.T = 800; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, K = thCalc(S), hot = clamp((S.T - 300) / 600, 0, 1), cold = clamp((200 - S.T) / 180, 0, 1), pc = K.reg === 0 ? C.c2 : K.reg === 2 ? C.err : C.c5;
        const bx = W * .06, bw = W * .34, by = H * .62;
        rr(ctx, bx, by + 36, bw, 24, 6); ctx.fillStyle = C.tint; ctx.fill(); ctx.strokeStyle = hot > .05 ? C.err : cold > .05 ? C.c2 : C.sub; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, 'bàn nhiệt', bx + bw / 2, by + 48, C.mut, 10.5, 'center', 700);
        isoBox(ctx, bx + bw * .2, by + 30, bw * .6, 36, 24, C.main, .3);
        const sh = hot * 5 + K.reg * 0; const cx = bx + bw / 2 + Math.sin(t * 40) * sh;
        for (let i = 0; i < 5; i++) { const x = bx + bw * (.2 + i * .15), a = (t * 1.1 + i * .3) % 1; ctx.save(); ctx.globalAlpha = hot * (1 - a); ln(ctx, x, by + 26 - a * 50, x + 4, by + 12 - a * 50, C.err, 2); ctx.restore(); }
        txt(ctx, 'chip Si ' + fmtPow(S.Nd), cx, by - 6, C.ink, 11, 'center', 700);
        const tx = W * .5, ty = H * .1, th = H * .7, fl = clamp(S.T / 900, 0, 1);
        rr(ctx, tx - 7, ty, 14, th, 7); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.8; ctx.stroke(); dot(ctx, tx, ty + th + 8, 12, pc); rr(ctx, tx - 3, ty + th * (1 - fl), 6, th * fl + 4, 3); ctx.fillStyle = pc; ctx.fill();
        txt(ctx, S.T + ' K', tx, ty - 10, C.ink, 12.5, 'center', 800);
        const lamps = [['Đóng băng', 0, C.c2], ['Ngoại lai', 1, C.c5], ['Nội tại', 2, C.err]];
        lamps.forEach((l, i) => { const lx = W * .64 + i * W * .12, on = K.reg === l[1]; dot(ctx, lx, H * .16, 9, on ? l[2] : C.tint); ctx.beginPath(); ctx.arc(lx, H * .16, 9, 0, TAU2); ctx.strokeStyle = C.sub; ctx.lineWidth = 1; ctx.stroke(); txt(ctx, l[0], lx, H * .16 + 22, on ? C.ink : C.mut, 10.5, 'center', on ? 800 : 500); });
        const gr = Math.min(W * .075, H * .2, 40), r = K.sn.n / S.Nd;
        gauge(ctx, W * .7, H * .60, gr, 'n₀ / N_d', r.toFixed(2) + '×', clamp(r / 2, 0, 1), pc, .5);
        gauge(ctx, W * .9, H * .60, gr, 'nᵢ(T) (cm⁻³)', sci(K.ni, 1), clamp((lg10(K.ni) - 2) / 17, 0, 1), C.c4);
        txt(ctx, ['ĐÓNG BĂNG: ion hóa chưa đủ', 'NGOẠI LAI: n₀ ≈ N_d, làm việc ổn định', 'NỘI TẠI: nᵢ lấn át, chip trở thành thuần'][K.reg], W * .8, H - 14, pc, 11.5, 'center', 700);
      } },
    { title: 'Bên trong: lạnh — hạt tải còn quay quanh tạp; vừa — donor ion hóa; nóng — các cặp e⁻/h⁺ do gãy liên kết tràn ngập', area: 'c', anim: true,
      ctrls: [viewCtrl, { legend: { note: 'Ở vùng nội tại, số vùng electron và lỗ trống gần bằng nhau: màu hai loại trộn vào nhau.' } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, K = thCalc(S), ni = K.ni, ne = cntOf(K.sn.n), nh = cntOf(K.sn.p);
        drawCrystal(ctx, 10, 8, W - 20, H - 16, { st: p.st, t, dt, field: S.view === 'field', ne, nh, nd: 14, ndIon: K.sn.ionD, vib: .3 + S.T / 250, speed: Math.sqrt(S.T / 300), recomb: 1 + ni / S.Nd * 3,
          label: ['đóng băng', 'ngoại lai', 'nội tại'][K.reg] + ' · n = ' + sci(K.sn.n, 1) + ' · p = ' + sci(K.sn.p, 1),
          legend: { note: 'Ở vùng nội tại, số vùng electron và lỗ trống gần bằng nhau: màu hai loại trộn vào nhau.' } });
      } }
  ]
});

/* ==========================================================================
   7. TIẾP XÚC N–P (Mục 10) — dùng chung cho tab Tiếp xúc và ★ Tổng quan
   ========================================================================== */
const jnCalc = (Nd, Na, T) => {
  T = T || 300; const kT = kT_of(T), ni = ni_of(T), Vbi = Math.max(0, kT * Math.log(Nd * Na / (ni * ni))), eps = 11.7 * 8.854e-14, q = 1.602e-19;
  const Wc = Math.sqrt(2 * eps * Vbi / q * (1 / Nd + 1 / Na)), xn = Wc * Na / (Na + Nd), xp = Wc * Nd / (Na + Nd), Em = q * Nd * xn / eps;
  const Wum = Wc * 1e4, wd = .06 + .26 * (1 - Math.exp(-Wum / .5));
  return { Vbi, Wum, xnum: xn * 1e4, xpum: xp * 1e4, Em, wd, dn: wd * Na / (Na + Nd), dp: wd * Nd / (Na + Nd) };
};
const ampOf = N => clamp(.48 + .1 * (lg10(N) - 15), .48, .85);

function drawJunction(ctx, x, y, w, h, o) {
  const st = o.st, S = o.S, t = o.t, dt = o.dt, field = !!o.field, lg = 0, ph = h - lg, cr = crystalInit(st);
  const a = sm(st, 'ja', S.joined ? 1 : 0, dt, .35), K = jnCalc(S.Nd, S.Na, 300), g = (1 - a) * .06, uL = .5 - K.dn * a - g, uR = .5 + K.dp * a + g;
  rr(ctx, x, y, w, ph, 8); ctx.fillStyle = field ? NIGHT_BG : C.card; ctx.fill(); ctx.save(); rr(ctx, x, y, w, ph, 8); ctx.clip();
  const X = u => x + 8 + u * (w - 16), Y = v => y + 8 + v * (ph - 16), aN = ampOf(S.Nd), aP = ampOf(S.Na);
  if (field) drawField(ctx, x, y, w, ph, u => u < uL ? aN * (1 - .8 * Math.exp(-(uL - u) / .12)) : u > uR ? -aP * (1 - .8 * Math.exp(-(u - uR) / .12)) : 0, st);
  if (!field) {
  ctx.lineWidth = 1.2; ctx.strokeStyle = field ? 'rgba(217,214,224,.35)' : C.g;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) { const u = (c + .5) / 12; if (u > uL && u < uR && !field && a < .05) { } ctx.beginPath(); ctx.arc(X(u) + Math.sin(t * 9 + r * 3 + c), Y((r + .5) / 5) + Math.cos(t * 10 + c * 4 + r), 4, 0, TAU2); ctx.stroke(); }
  /* ion cố định trong vùng nghèo */
  const nc = Math.max(1, Math.min(3, Math.floor((.5 - uL) * (w - 16) / 18))), ncp = Math.max(1, Math.min(3, Math.floor((uR - .5) * (w - 16) / 18)));
  if (a > .05) { ctx.globalAlpha = Math.min(1, a * 1.3); for (let r = 0; r < 5; r++) { for (let c = 0; c < nc; c++) { const uu = uL + (.5 - uL) * (c + .5) / nc; dot(ctx, X(uu), Y((r + .5) / 5), 5, C.c1); txt(ctx, '+', X(uu), Y((r + .5) / 5) + .5, C.bg, 10, 'center', 800); } for (let c = 0; c < ncp; c++) { const u2 = .5 + (uR - .5) * (c + .5) / ncp; dot(ctx, X(u2), Y((r + .5) / 5), 5, C.c5); txt(ctx, '−', X(u2), Y((r + .5) / 5) + .5, C.bg, 10, 'center', 800); } } ctx.globalAlpha = 1; }
  const ne = Math.round(clamp((lg10(S.Nd) - 14) * 9 + 6, 6, 46)), nh = Math.round(clamp((lg10(S.Na) - 14) * 9 + 6, 6, 46));
  for (let i = 0; i < 48; i++) { if (i < ne) stepP(cr.e[i], dt, 1.2); if (i < nh) stepP(cr.h[i], dt, 1.2); }
  if (!field) {
    for (let i = 0; i < ne; i++) { const p = cr.e[i], px = X(p.u * uL), py = Y(p.v); dot(ctx, px, py, 4.4, C.c2); txt(ctx, '−', px, py + .5, C.bg, 8.5, 'center', 800); }
    for (let i = 0; i < nh; i++) { const p = cr.h[i], px = X(uR + p.u * (1 - uR)), py = Y(p.v); ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU2); ctx.strokeStyle = C.c4; ctx.lineWidth = 1.7; ctx.stroke(); txt(ctx, '+', px, py + .5, C.c4, 9, 'center', 800); }
  }
  /* khuếch tán (khi ghép): mũi tên + tái hợp ở mép */
  if (a > .3) {
    const ay = Y(.5); ctx.globalAlpha = a; arr(ctx, X(uL - .1), ay - 14, X(uL + .02), ay - 14, C.c2, 2); arr(ctx, X(uR + .1), ay + 14, X(uR - .02), ay + 14, C.c4, 2);
    arr(ctx, X(.5 - K.dn * .8), Y(.06), X(.5 + K.dp * .8), Y(.06), C.main, 2.6); txt(ctx, 'E_bi', X(.5), Y(.14), C.main, 11, 'center', 800); ctx.globalAlpha = 1;
    if (Math.random() < dt * 2.2) cr.fl.push({ u: Math.random() < .5 ? uL : uR, v: rnd(.1, .9), a: 1, raw: 1 });
  }
  cr.fl = cr.fl.filter(f => (f.a -= dt * 1.9) > 0); cr.fl.forEach(f => { if (!f.raw) return; ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(X(f.u), Y(f.v), 4 + (1 - f.a) * 14, 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 1.8; ctx.stroke(); ctx.globalAlpha = 1; });
  }
  ctx.restore(); rr(ctx, x, y, w, ph, 8); ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
  txt(ctx, 'N (donor ' + fmtPow(S.Nd) + ')', x + w * .2, y + ph - 12, field ? COL_WARM : C.c2, 11, 'center', 700); txt(ctx, 'P (acceptor ' + fmtPow(S.Na) + ')', x + w * .8, y + ph - 12, field ? COL_CYAN : C.c4, 11, 'center', 700);
  if (a > .5 && !field) txt(ctx, 'vùng nghèo: chỉ còn ion cố định', X(.5), y + ph - 28, field ? NIGHT_INK : C.ink, 10.5, 'center', 700);
}

LABS.push({
  id: 'junction', no: '10', name: 'Tiếp xúc N–P', secs: [10],
  S: { Nd: 1e17, Na: 1e16, joined: 1, view: 'part' },
  cols: '1.6fr 1fr', rows: '1fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Thực tế: hai phiến N và P trượt vào nhau trên ray — hạt tải khuếch tán và dựng nên thế nội tại V_bi', area: 'a', anim: true,
      ctrls: [
        { k: 'joined', seg: [[0, 'Tách rời'], [1, 'Ghép tiếp xúc']] },
        { k: 'Nd', l: 'Donor N_d', min: 15, max: 18, step: .1, log: 1, f: v => fmtPow(v) },
        { k: 'Na', l: 'Acceptor N_a', min: 15, max: 18, step: .1, log: 1, f: v => fmtPow(v) },
        { btn: 'VD Bài 6 (10¹⁷ / 10¹⁶)', fn: p => { p.S.Nd = 1e17; p.S.Na = 1e16; p.S.joined = 1; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, a = sm(st, 'ja2', S.joined ? 1 : 0, dt, .35), K = jnCalc(S.Nd, S.Na, 300), gap = (1 - a) * W * .1, x0 = W * .3, bw = W * .21, by = H * .66;
        ln(ctx, W * .04, by + 14, W * .56, by + 14, C.sub, 3); for (let i = 0; i < 9; i++) ln(ctx, W * .06 + i * W * .06, by + 14, W * .06 + i * W * .06, by + 22, C.sub, 1.5);
        isoBox(ctx, x0 - gap / 2 - bw, by, bw, 70, 56, C.c2, .35); isoBox(ctx, x0 + gap / 2, by, bw, 70, 56, C.c4, .35);
        txt(ctx, 'N', x0 - gap / 2 - bw / 2, by - 14, C.c2, 14, 'center', 800); txt(ctx, 'P', x0 + gap / 2 + bw / 2, by - 14, C.c4, 14, 'center', 800);
        if (a > .6) { ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = C.main; ctx.fillRect(x0 - K.dn * W * .5 * 1.2, by - 56, (K.dn + K.dp) * W * .5 * 1.2, 56); ctx.restore(); txt(ctx, 'vùng nghèo', x0, by - 66, C.main, 10.5, 'center', 700); }
        const gr = Math.min(W * .075, H * .2, 40), Vv = K.Vbi * a;
        gauge(ctx, W * .68, H * .32, gr, 'Vôn kế V_bi', Vv.toFixed(2) + ' V', clamp(Vv / 1.1, 0, 1), C.main);
        gauge(ctx, W * .88, H * .32, gr, 'Bề rộng nghèo W', (K.Wum * a).toFixed(2) + ' µm', clamp(K.Wum * a / 1.5, 0, 1), C.c5);
        gauge(ctx, W * .68, H * .74, gr, 'x_n (phía N)', (K.xnum * a).toFixed(3) + ' µm', clamp(K.xnum * a / 1.2, 0, 1), C.c2);
        gauge(ctx, W * .88, H * .74, gr, 'x_p (phía P)', (K.xpum * a).toFixed(3) + ' µm', clamp(K.xpum * a / 1.2, 0, 1), C.c4);
        txt(ctx, S.joined ? 'x_n : x_p = N_a : N_d — nghèo lấn sâu phía pha nhẹ' : 'tách rời: chưa có thế nội tại', W * .5, H - 12, C.ink, 11, 'center', 700);
      } },
    { title: 'Bên trong: electron (N) và lỗ trống (P) khuếch tán, tái hợp ở mép, để lại ion cố định P⁺ và B⁻', area: 'c', anim: true,
      ctrls: [viewCtrl, { legend: { neg: 'lỗ trống, phía P', pos: 'electron, phía N', mid: 'vùng nghèo', note: 'Vùng nghèo (ô tối ở giữa) lấn sâu sang phía pha tạp nhẹ hơn.' } }],
      draw(p, ctx, W, H, t, dt) { drawJunction(ctx, 10, 8, W - 20, H - 16, { st: p.st, S: p.S, t, dt, field: p.S.view === 'field' }); } }
  ]
});

/* ==========================================================================
   ★ TỔNG QUAN — khối 3D N–P nối các thí nghiệm lại với nhau
   ========================================================================== */
LABS.unshift({
  id: 'all', no: '★', name: 'Tổng quan 3D', secs: [],
  S: { T: 300, Nd: 1e17, Na: 1e16, yaw: 30, pitch: 32, zoom: 1, speed: 1 },
  cols: '1.5fr 1fr', rows: '3.4fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Khối 3D chip N–P — kéo để xoay, lăn chuột để phóng to, bấm vào vùng tiếp xúc để FOCUS, bấm số ①–⑦ để vào thí nghiệm', area: 'a', anim: true,
      ctrls: [
        { k: 'T', l: 'T', min: 100, max: 600, step: 10, f: v => v + ' K' },
        { k: 'Nd', l: 'Donor', min: 15, max: 18, step: .1, log: 1, f: v => fmtPow(v) },
        { k: 'Na', l: 'Acceptor', min: 15, max: 18, step: .1, log: 1, f: v => fmtPow(v) },
        { k: 'yaw', l: 'Xoay ngang', min: -180, max: 180, step: 5, f: v => v + '°', view: 1 },
        { k: 'pitch', l: 'Nghiêng', min: 5, max: 90, step: 5, f: v => v + '°', view: 1 },
        { k: 'zoom', l: 'Phóng to', min: .5, max: 3, step: .1, f: v => v.toFixed(1) + '×', view: 1 },
        { k: 'speed', l: 'Tốc độ', min: .05, max: 1, step: .05, f: v => v.toFixed(2) + '×', view: 1 },
        { btn: 'Tua chậm 0,2×', fn: p => { p.S.speed = .2; p.syncCtrls(); } },
        { btn: 'Bình thường 1×', fn: p => { p.S.speed = 1; p.syncCtrls(); } },
        { btn: 'Đặt lại góc nhìn', fn: p => { p.S.yaw = 30; p.S.pitch = 32; p.S.zoom = 1; p.syncCtrls(); } }
      ],
      onDrag(p, dx, dy) { const S = p.S; S.yaw = ((S.yaw + dx * .5 + 540) % 360) - 180; S.pitch = clamp(S.pitch + dy * .4, 5, 90); p.syncCtrls(); },
      onWheel(p, dy) { p.S.zoom = clamp(p.S.zoom * (dy < 0 ? 1.1 : 1 / 1.1), .5, 3); p.syncCtrls(); },
      onClick(p, x, y) {
        const hit = r => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
        if (p.focus) { p.focus = false; return; }
        const h = (p.hits || []).find(hit); if (h) { show(h.id); return; }
        const c = p.cloud; if (c && Math.hypot(x - c.x, y - c.y) <= c.r) p.focus = true;
      },
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, sp = S.speed, dts = dt * sp, K = jnCalc(S.Nd, S.Na, S.T), cr = crystalInit(p.st), M = p.tab.M;
        M.fl = M.fl || []; M.at = (M.at || 0) + dts; const ta = M.at;
        const uL = .5 - K.dn, uR = .5 + K.dp, ne = Math.round(clamp((lg10(S.Nd) - 14) * 9 + 6, 6, 46)), nh = Math.round(clamp((lg10(S.Na) - 14) * 9 + 6, 6, 46));
        M.yy = M.yy || Array.from({ length: 96 }, () => Math.random());
        for (let i = 0; i < 48; i++) { if (i < ne) stepP(cr.e[i], dts, 1.4); if (i < nh) stepP(cr.h[i], dts, 1.4); }
        if (Math.random() < dts * 3) M.fl.push({ x: Math.random() < .5 ? uL : uR, y: Math.random(), z: Math.random(), a: 1 });
        M.fl = M.fl.filter(f => (f.a -= dts * 2) > 0);
        const ya = S.yaw * Math.PI / 180, pb = S.pitch * Math.PI / 180, cyw = Math.cos(ya), syw = Math.sin(ya), cpb = Math.cos(pb), spb = Math.sin(pb);
        const U = Math.min(W / 3.9, H / 2.9) * S.zoom, ccx = W / 2, ccy = H * .54;
        const R = (x, y, z) => { const wx = (x - .5) * 3, wy = (y - .5) * .8, wz = (z - .5) * .8, ax = wx * cyw - wy * syw, ay = wx * syw + wy * cyw; return [ccx + U * ax, ccy - U * (wz * cpb + ay * spb), ay * cpb - wz * spb]; };
        const fillPoly = (pts, col, al, edge) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = col; ctx.fill(); ctx.restore(); if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = 1.1; ctx.stroke(); } };
        const faces = [], addBox = (x0, x1, y0, y1, z0, z1, col, al) => {
          const c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].map(v => R(v[0], v[1], v[2]));
          [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]].forEach(f => { const pts = f.map(i => c[i]); faces.push({ pts, col, al, d: pts.reduce((s, q) => s + q[2], 0) / 4 }); });
        };
        const hull = pts => { const a = pts.slice().sort((u, v) => u[0] - v[0] || u[1] - v[1]), cx_ = (o, u, v) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]), lo = [], up = [];
          a.forEach(q => { while (lo.length > 1 && cx_(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
          a.slice().reverse().forEach(q => { while (up.length > 1 && cx_(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
          return lo.slice(0, -1).concat(up.slice(0, -1)); };
        const rs = Math.max(.6, Math.min(1.8, S.zoom));
        /* hai vòi cấy ion + chùm */
        const nz = [[.22, C.c1, 'P⁺'], [.78, C.c5, 'B⁺']].map(q => { const c = R(q[0], .5, 1.9), patch = [R(q[0] - .08, .1, 1), R(q[0] + .08, .1, 1), R(q[0] + .08, .9, 1), R(q[0] - .08, .9, 1)]; return { c, patch, col: q[1], lab: q[2], x: q[0] }; });
        nz.forEach(o => fillPoly(hull([[o.c[0] - 9 * rs, o.c[1] + 9 * rs], [o.c[0] + 9 * rs, o.c[1] + 9 * rs]].concat(o.patch)), o.col, .16));
        /* hạt tải */
        const pr = [];
        for (let i = 0; i < ne; i++) { const q = cr.e[i]; pr.push({ c: R(q.u * uL, M.yy[i], q.v), k: 0 }); }
        for (let i = 0; i < nh; i++) { const q = cr.h[i]; pr.push({ c: R(uR + q.u * (1 - uR), M.yy[48 + i], q.v), k: 1 }); }
        pr.sort((a, b) => b.c[2] - a.c[2]).forEach(o => { const r = Math.max(1.8, (3.4 - o.c[2] * .9) * rs); if (!o.k) dot(ctx, o.c[0], o.c[1], r, C.c2); else { ctx.beginPath(); ctx.arc(o.c[0], o.c[1], r + .6, 0, TAU2); ctx.strokeStyle = C.c4; ctx.lineWidth = 1.5; ctx.stroke(); } });
        for (let r = 0; r < 3; r++) { for (let c = 0; c < 2; c++) { const a1 = R(uL + (.5 - uL) * (c + .5) / 2, .5, (r + .5) / 3), a2 = R(.5 + (uR - .5) * (c + .5) / 2, .5, (r + .5) / 3); dot(ctx, a1[0], a1[1], 3.4 * rs, C.c1); dot(ctx, a2[0], a2[1], 3.4 * rs, C.c5); } }
        M.fl.forEach(f => { const c = R(f.x, f.y, f.z); ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(c[0], c[1], (4 + (1 - f.a) * 12) * rs, 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; });
        addBox(0, uL, 0, 1, 0, 1, C.c2, .16); addBox(uL, uR, 0, 1, 0, 1, C.main, .26); addBox(uR, 1, 0, 1, 0, 1, C.c4, .16); addBox(-.03, 0, -.04, 1.04, -.08, 1.08, C.sub, .8); addBox(1, 1.03, -.04, 1.04, -.08, 1.08, C.sub, .8);
        faces.sort((a, b) => b.d - a.d).forEach(f => fillPoly(f.pts, f.col, f.al, C.sub));
        nz.forEach(o => { fillPoly(o.patch, o.col, .35, o.col); const c = o.c; rr(ctx, c[0] - 14 * rs, c[1] - 4 * rs, 28 * rs, 14 * rs, 4); ctx.fillStyle = C.sub; ctx.fill(); txt(ctx, o.lab, c[0], c[1] + 3 * rs, C.bg, 10.5 * rs, 'center', 800);
          for (let i = 0; i < 7; i++) { const u = (ta * .9 + i / 7) % 1, tp = R(o.x + (((i * .37) % 1) - .5) * .12, .15 + ((i * .61) % 1) * .7, 1); dot(ctx, c[0] + (tp[0] - c[0]) * u, c[1] + 9 + (tp[1] - c[1] - 9) * u, 2.4 * rs, o.col); } });
        txt(ctx, 'N', R(uL / 2, .5, 1.12)[0], R(uL / 2, .5, 1.12)[1], C.c2, 14 * rs, 'center', 800); txt(ctx, 'P', R((1 + uR) / 2, .5, 1.12)[0], R((1 + uR) / 2, .5, 1.12)[1], C.c4, 14 * rs, 'center', 800);
        /* vùng tiếp xúc: bấm để focus */
        const cc = R(.5, .5, .5), cr_ = Math.max(34, U * .55 * Math.max(K.wd, .1) * 3 + 20); p.cloud = { x: cc[0], y: cc[1], r: cr_ };
        ctx.setLineDash([5, 4]); ctx.strokeStyle = C.main; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(cc[0], cc[1], cr_, 0, TAU2); ctx.stroke(); ctx.setLineDash([]); txt(ctx, 'bấm để FOCUS', cc[0], cc[1] + cr_ + 12, C.main, 10.5, 'center', 700);
        const hits = [], placed = [], chip = (id, num, label, x, y, col) => {
          const wd = 30 + label.length * 6.8; let xx = clamp(x - wd / 2, 4, W - wd - 4), yy = y;
          for (let it = 0; it < 6; it++) { const o = placed.find(q => Math.abs(q.y - yy) < 24 && xx < q.x + q.w + 4 && xx + wd + 4 > q.x); if (!o) break; yy += 26; }
          yy = clamp(yy, 14, H - 14); placed.push({ x: xx, y: yy, w: wd });
          rr(ctx, xx, yy - 11, wd, 22, 11); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke();
          txt(ctx, num + ' ' + label, xx + wd / 2, yy + .5, col, 11.5, 'center', 700); hits.push({ x: xx, y: yy - 11, w: wd, h: 22, id });
        };
        chip('junction', '⑦', 'Tiếp xúc N–P', cc[0], cc[1] - cr_ - 26, C.main);
        chip('designer', '⑤', 'Cấy ion', nz[0].c[0], nz[0].c[1] - 28, C.c1);
        [['balance', '①', 'E_F & n·p', C.c2], ['degenerate', '②', 'Suy biến', C.c1], ['ionize', '③', 'Ion hóa', C.c5], ['compensate', '④', 'Bù trừ', C.c4], ['thermal', '⑥', '3 vùng nhiệt', C.c3]].forEach((q, i) => chip(q[0], q[1], q[2], W * (.1 + i * .2), H - 18, q[3]));
        p.hits = hits;
        txt(ctx, 'chấm đặc = electron · vòng rỗng = lỗ trống · ● vàng/xanh trong vùng nghèo = ion cố định P⁺ / B⁻ · vòng sáng = tái hợp', 14, 14, C.mut, 11, 'left', 600);
        txt(ctx, 'V_bi = ' + K.Vbi.toFixed(2) + ' V · W = ' + K.Wum.toFixed(2) + ' µm · tốc độ ' + sp.toFixed(2) + '×', W - 14, 32, C.ink, 12, 'right', 700);
        if (p.focus) {
          ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.restore();
          const Sq = Math.min(W * .62, H * .86), fx = (W - Sq) / 2, fy = (H - Sq) / 2, hd = 30, ix = fx + 12, iy = fy + hd + 6, iw = Sq - 24, ih = Sq - hd - 56;
          rr(ctx, fx, fy, Sq, Sq, 12); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.main; ctx.lineWidth = 2.4; ctx.stroke();
          txt(ctx, 'FOCUS · vùng tiếp xúc N–P', fx + 14, fy + 16, C.main, 12.5, 'left', 800); txt(ctx, '✕', fx + Sq - 16, fy + 16, C.ink, 14, 'center', 800);
          rr(ctx, ix, iy, iw, ih, 8); ctx.fillStyle = C.tint; ctx.fill(); ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();
          const x0 = .5 - .22, x1 = .5 + .22, FX = u => ix + (u - x0) / (x1 - x0) * iw, FY = v => iy + 14 + v * (ih - 28);
          ctx.globalAlpha = .22; ctx.fillStyle = C.main; ctx.fillRect(FX(uL), iy, FX(uR) - FX(uL), ih); ctx.globalAlpha = 1;
          for (let i = 0; i < ne; i++) { const q = cr.e[i], u = q.u * uL; if (u < x0) continue; dot(ctx, FX(u), FY(M.yy[i]), 5.5, C.c2); }
          for (let i = 0; i < nh; i++) { const q = cr.h[i], u = uR + q.u * (1 - uR); if (u > x1) continue; ctx.beginPath(); ctx.arc(FX(u), FY(M.yy[48 + i]), 6, 0, TAU2); ctx.strokeStyle = C.c4; ctx.lineWidth = 2; ctx.stroke(); }
          for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) { const a1 = uL + (.5 - uL) * (c + .5) / 3, a2 = .5 + (uR - .5) * (c + .5) / 3, yy = FY((r + .5) / 5); dot(ctx, FX(a1), yy, 6, C.c1); txt(ctx, '+', FX(a1), yy + .5, C.bg, 11, 'center', 800); dot(ctx, FX(a2), yy, 6, C.c5); txt(ctx, '−', FX(a2), yy + .5, C.bg, 11, 'center', 800); }
          M.fl.forEach(f => { ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(FX(f.x), FY(f.y), 6 + (1 - f.a) * 20, 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 2.4; ctx.stroke(); ctx.globalAlpha = 1; });
          arr(ctx, FX(uL), iy + 18, FX(uR), iy + 18, C.main, 3); txt(ctx, 'E_bi', FX(.5), iy + 34, C.main, 12, 'center', 800);
          ctx.restore();
          txt(ctx, 'x_n = ' + K.xnum.toFixed(3) + ' µm · x_p = ' + K.xpum.toFixed(3) + ' µm · khung rộng 44% chiều dài · bấm bất kỳ đâu để đóng', fx + Sq / 2, fy + Sq - 16, C.mut, 10.5, 'center', 600);
        }
      } },
    { title: 'Các số đo chính của chip này', area: 'c', anim: true,
      draw(p, ctx, W, H) {
        const S = p.S, K = jnCalc(S.Nd, S.Na, S.T), r = Math.min(W / 12, H * .3, 36), cy = H * .5, sn = solveNeutrality(S.T, S.Nd, 0), g = [
          ['T', S.T + ' K', (S.T - 100) / 500, C.c1], ['n phía N', sci(sn.n, 1), (lg10(sn.n) - 14) / 5, C.c2], ['V_bi', K.Vbi.toFixed(2) + ' V', K.Vbi / 1.2, C.main], ['W', K.Wum.toFixed(2) + ' µm', K.Wum / 1.5, C.c5], ['E_max', sci(K.Em, 1), (lg10(K.Em + 1) - 3) / 4, C.c4]];
        g.forEach((q, i) => gauge(ctx, W * (.1 + i * .2), cy, r, q[0], q[1], q[2], q[3]));
      } }
  ]
});

/* ==========================================================================
   NHẬT KÝ GIẢI THÍCH. Loại dòng: i = nguyên lý · w = cơ chế · v = số liệu
   ========================================================================== */
const LD = {};
const sg = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);

LD.all = {
  intro: [
    ['i', 'Đây là một chip N–P đặt dưới máy cấy ion. Mọi thí nghiệm của Buổi 6 đều là một lát cắt của khối này.'],
    ['w', 'Kéo chuột để xoay, lăn để phóng to, kéo thanh "Tốc độ" để tua chậm. Bấm vào vòng nét đứt ở mặt tiếp xúc để mở khung FOCUS.'],
    ['w', 'Bấm các số ①–⑦ để nhảy thẳng vào thí nghiệm tương ứng: E_F, suy biến, ion hóa, bù trừ, cấy ion, ba vùng nhiệt, tiếp xúc N–P.'],
    ['v', 'Thử kéo Donor lên 10¹⁸ rồi nhìn vùng nghèo thu hẹp và V_bi tăng.']
  ],
  react(S, k, P, say) { const K = jnCalc(S.Nd, S.Na, S.T); say('v', 'T = ' + S.T + ' K · N_d = ' + fmtPow(S.Nd) + ' · N_a = ' + fmtPow(S.Na) + ' → V_bi = ' + K.Vbi.toFixed(2) + ' V, W = ' + K.Wum.toFixed(2) + ' µm, x_n : x_p = N_a : N_d.'); }
};
LD.balance = {
  intro: [
    ['i', 'Ở cân bằng nhiệt, n₀ = nᵢ·e^((E_F−E_Fi)/kT) và p₀ = nᵢ·e^(−(E_F−E_Fi)/kT). Hai số này như hai đầu bập bênh.'],
    ['w', 'Kéo E_F lên cao thì electron chất đống, lỗ trống tụt xuống. Khóa ở giữa luôn giữ n₀·p₀ = nᵢ².'],
    ['w', 'Khung dưới là Trường 2D của đúng các hạt ở khung trên: vùng ấm là electron, vùng lạnh là lỗ trống. Thanh màu cạnh các nút cho biết màu nào là gì.'],
    ['v', 'Đặt ΔE = +0,30 eV ở 300 K để kiểm lại Câu 1: n₀ = 1,6×10¹⁵, p₀ = 1,4×10⁵ cm⁻³.']
  ],
  react(S, k, P, say) { const kT = kT_of(S.T), ni = ni_of(S.T); say('v', 'E_F − E_Fi = ' + sg(S.dE) + ' eV, T = ' + S.T + ' K → n₀ = ' + fmtSci(ni * ex(S.dE / kT), 2) + ', p₀ = ' + fmtSci(ni * ex(-S.dE / kT), 2) + ', n₀p₀ = ' + fmtSci(ni * ni, 2) + ' cm⁻³.'); }
};
LD.degenerate = {
  intro: [
    ['i', 'Khi E_F còn cách mép dải ≥ 3kT, xấp xỉ Boltzmann sai dưới 5%. Tạp chất đứng tách nhau.'],
    ['w', 'Pha tạp quá nặng thì các quầng Bohr chồng lên nhau, thành biển dẫn liên tục. Đó là bán dẫn suy biến, cần tích phân Fermi–Dirac F₁/₂(η_F).'],
    ['w', 'Ở khung Trường 2D, mỗi quầng là một vết sáng. Khi N tăng, các vết nối thành một mảng liền.'],
    ['v', 'Bấm các nút Câu 2 và ví dụ để đọc độ lệch Boltzmann trên đồng hồ.']
  ],
  react(S, k, P, say) { const d = degCalc(S); say('v', 'N = ' + fmtPow(S.N) + ' (' + (S.type === 'n' ? 'donor' : 'acceptor') + '), T = ' + S.T + ' K → η_F = ' + sg(d.eta) + ', Boltzmann lệch ' + (Math.abs(d.err) < 1 ? (d.err * 100).toFixed(1) + '%' : (1 + d.err).toFixed(2) + '×') + '.'); }
};
LD.ionize = {
  intro: [
    ['i', 'Thống kê tạp chất có thêm hệ số spin: donor g = 2, acceptor trong Si g = 4. Vì vậy ion hóa không chạy theo Boltzmann thuần.'],
    ['w', 'Trong buồng cryostat, ô rỗng có chấm quay là tạp chất còn giữ hạt tải. Lên ấm thì ô đặc có dấu + hoặc −: tạp đã nhả hạt tải.'],
    ['w', 'Ở 35 K xảy ra đóng băng; ở 300 K với pha 10¹⁶ ion hóa gần hết. Pha càng nặng, càng nhiều tạp còn kẹt.'],
    ['v', 'Kéo T xuống 35 K, rồi lên 300 K để xem khung Bên trong đổi từ ít màu sang nhiều màu.']
  ],
  react(S, k, P, say) { const K = ionCalc(S); say('v', (K.d ? 'Donor P' : 'Acceptor B') + ' ' + fmtPow(S.N) + ', T = ' + S.T + ' K: ion hóa ' + (K.ion * 100).toFixed(2) + '%, còn kẹt ' + (100 - K.ion * 100).toFixed(2) + '%, hạt tự do = ' + fmtSci(K.free, 2) + ' cm⁻³.'); }
};
LD.compensate = {
  intro: [
    ['i', 'Bán dẫn bù trừ có cả donor P⁺ lẫn acceptor B⁻. Điều kiện trung hòa: n₀ + N_a⁻ = p₀ + N_d⁺.'],
    ['w', 'Electron của donor rơi xuống lấp acceptor trước (đường đứt ở khung Hạt). Chỉ phần dư |N_d − N_a| thành hạt tải tự do.'],
    ['w', 'Khung Trường 2D chỉ còn phần hạt tải dư. Khi N_d = N_a, vùng màu gần như biến mất: mẫu gần như bán dẫn thuần.'],
    ['v', 'Bấm "Câu 4" rồi "Bù trừ hoàn toàn" để so sánh hai trạng thái.']
  ],
  react(S, k, P, say) { const K = cmpCalc(S); say('v', 'N_d = ' + fmtPow(S.Nd) + ', N_a = ' + fmtPow(S.Na) + ' → mẫu ' + (K.type === '0' ? 'gần thuần' : 'loại ' + K.type) + ', n₀ = ' + fmtSci(K.sn.n, 2) + ', p₀ = ' + fmtSci(K.sn.p, 2) + ' cm⁻³.'); }
};
LD.designer = {
  intro: [
    ['i', 'Máy cấy ion đặt E_F theo ý muốn: E_c − E_F = kT·ln(N_c/(N_d − N_a)) cho loại N, E_F − E_v = kT·ln(N_v/(N_a − N_d)) cho loại P.'],
    ['w', 'Nếu wafer đã có nền B, liều P⁺ phải bù hết nền trước, phần dư mới quyết định n₀.'],
    ['w', 'Kim 3kT trên đồng hồ khoảng cách báo khi Boltzmann sắp hết đúng (như Câu 6b).'],
    ['v', 'Bấm "Câu 5 (0,20 eV)": nền B 10¹⁶ cần liều P 2,24×10¹⁶ để E_c − E_F = 0,200 eV.']
  ],
  react(S, k, P, say) { const K = desCalc(S); say('v', (K.d > 0 ? 'Loại N' : 'Loại P') + ' (N_eff = ' + fmtSci(Math.abs(K.d), 2) + '): ' + (K.isN ? 'E_c − E_F' : 'E_F − E_v') + ' = ' + K.dist.toFixed(3) + ' eV (' + K.kts.toFixed(1) + ' kT)' + (K.kts < 3 ? ', dưới mốc 3kT.' : ', không suy biến.')); }
};
LD.thermal = {
  intro: [
    ['i', 'Chip Si pha tạp cố định đi qua ba chế độ khi nhiệt độ tăng: đóng băng, ngoại lai, nội tại.'],
    ['w', 'Đóng băng (lạnh): hạt tải kẹt ở tạp chất. Ngoại lai (quanh 300 K): n₀ ≈ N_d, chip làm việc ổn định.'],
    ['w', 'Nội tại (nóng): liên kết Si–Si gãy sinh nhiều cặp e⁻/h⁺ lấn át pha tạp. Ở khung Bên trong, vùng màu hai loại sẽ xuất hiện cùng lúc.'],
    ['v', 'Tăng N_d lên 10¹⁷ rồi quay T lên cao: chip chịu được nhiệt độ cao hơn.']
  ],
  react(S, k, P, say) { const K = thCalc(S); say('v', 'T = ' + S.T + ' K, N_d = ' + fmtPow(S.Nd) + ' [' + ['ĐÓNG BĂNG', 'NGOẠI LAI', 'NỘI TẠI'][K.reg] + ']: n₀ = ' + fmtSci(K.sn.n, 2) + ' (' + (K.sn.n / S.Nd).toFixed(2) + '× N_d), nᵢ = ' + fmtSci(K.ni, 1) + ' cm⁻³.'); }
};
LD.junction = {
  intro: [
    ['i', 'Khi hai vật liệu tiếp xúc ở cân bằng, hạt tải khuếch tán cho tới khi E_F thẳng hàng. Phần để lại là ion cố định và điện trường nội E_bi.'],
    ['w', 'Ép phiến N vào phiến P: electron và lỗ trống tái hợp ở ranh giới, vùng nghèo chỉ còn P⁺ và B⁻. Điện trường hướng từ N sang P.'],
    ['w', 'Trung hòa điện tích N_d·x_n = N_a·x_p nên vùng nghèo lấn sâu vào phía pha tạp nhẹ hơn. Trường 2D cho thấy rõ khoảng trống màu ở giữa.'],
    ['v', 'Bấm "VD Bài 6" để đọc V_bi ≈ 0,78 V trên vôn kế.']
  ],
  react(S, k, P, say) { const K = jnCalc(S.Nd, S.Na, 300), r = S.Nd / S.Na; say(S.joined ? 'v' : 'i', S.joined ? 'Đã ghép: V_bi = ' + K.Vbi.toFixed(2) + ' V, W = ' + K.Wum.toFixed(2) + ' µm, x_p/x_n = ' + (r >= 1 ? r.toFixed(1) : '1/' + (1 / r).toFixed(1)) + '.' : 'Tách rời: vôn kế về 0, chưa có vùng nghèo. Ghép lại để xem V_bi = ' + K.Vbi.toFixed(2) + ' V.'); }
};
LABS.forEach(l => { l.log = LD[l.id]; });
/* ==========================================================================
   KHUNG POPUP
   ========================================================================== */
const CSS = `
#lab6{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab6[hidden]{display:none}
#lab6 *{box-sizing:border-box}
.lb6-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
.lb6-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
.lb6-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
.lb6-ic{color:var(--main);display:flex}
.lb6-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
.lb6-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
.lb6-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
.lb6-tab:hover{color:var(--ink);background:var(--tint)}
.lb6-tab.on{background:var(--main);color:var(--bg);font-weight:700}
.lb6-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
.lb6-x:hover{color:var(--err);background:var(--tint)}
.lb6-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
.lb6-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
.lb6-p.glow{animation:lb6glow 1.4s ease-out}
@keyframes lb6glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
.lb6-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
.lb6-cv{flex:1;min-height:0;position:relative}
.lb6-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.lb6-c{display:flex;flex-wrap:wrap;gap:6px 14px;padding:4px 10px 8px;flex:none;align-items:center}
.lb6-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb6-k input[type=range]{width:clamp(70px,8vw,120px);margin:0}
.lb6-k output{color:var(--ink);font-weight:700;min-width:3.2em}
.lb6-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb6-seg button,.lb6-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer}
.lb6-btn{background:var(--tint)}
.lb6-lg{display:flex;align-items:center;gap:8px;font:700 11px/1 var(--font-ui)}.lb6-lg i{position:relative;display:block;width:clamp(110px,14vw,200px);height:16px;border-radius:5px;border:1px solid var(--g)}.lb6-lg b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 10px/1 var(--font-ui);color:#d9d6e0}
.lb6-seg button:hover,.lb6-btn:hover{color:var(--ink)}
.lb6-seg button.on{background:var(--main);color:var(--bg)}
.lb6-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
.lb6-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb6in .4s ease-out;overflow-wrap:anywhere}
.lb6-ln::before{position:absolute;left:0;font-weight:700}
.lb6-ln.i{color:var(--ink)}.lb6-ln.i::before{content:'›';color:var(--c5)}
.lb6-ln.w{color:var(--ink)}.lb6-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
.lb6-ln.v{color:var(--main)}.lb6-ln.v::before{content:'=';color:var(--main)}
@keyframes lb6in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lb6-hall{display:flex;flex-direction:column;background:var(--bg)}
.lb6-hall canvas{position:static!important;flex:1;min-height:0;width:100%;height:100%;object-fit:contain}
.lab6-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab6-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab6-m:hover,.lab6-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb6-win{width:100vw;height:100dvh;border-radius:0}.lb6-b{overflow:auto;display:flex;flex-direction:column}.lb6-p{min-height:260px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.200 6.200V2"/><path d="M4.600 10h6.800"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'all';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab6'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 6');
  root.innerHTML = '<div class="lb6-win"><div class="lb6-h"><span class="lb6-ic">' + FLASK + '</span><span class="lb6-bd">Phòng thí nghiệm · Buổi 6</span><nav class="lb6-tabs"></nav><button class="lb6-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb6-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb6-b'); tabsEl = root.querySelector('.lb6-tabs');
  LABS.forEach(l => { const b = document.createElement('button'); b.type = 'button'; b.className = 'lb6-tab'; b.dataset.id = l.id; b.textContent = l.no + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b); });
  root.querySelector('.lb6-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) { const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName); if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty && window.LabB6 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden && (document.getElementById('tb-badge')||{}).textContent === 'Buổi 6') { e.preventDefault(); open(); } return; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
}

const say = (kind, text) => {
  if (!logEl) return; const d = document.createElement('div'); d.className = 'lb6-ln ' + kind; d.textContent = text; logEl.appendChild(d);
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
  const touch = () => { curPanels.forEach(q => q.dirty = true); if (!c.view) queueReact(tab, c.k); };
  if (c.btn) { w.className = 'lb6-btn'; w.textContent = c.btn; w.setAttribute('role', 'button'); w.tabIndex = 0; w.onclick = () => c.fn(p); return w; }
  if (c.legend) {
    const o = c.legend, st = []; for (let i = 0; i <= 24; i++) { const q = i / 24, v = (q - .5) * 2; st.push(rgbS(palAt(v >= 0 ? PAL_POS : PAL_NEG, Math.abs(v)).map(Math.round)) + ' ' + Math.round(q * 100) + '%'); }
    w.className = 'lb6-lg'; w.innerHTML = '<span></span><i><b></b></i><span></span>'; const sp = w.querySelectorAll('span');
    sp[0].textContent = o.neg || 'lỗ trống (đậm = nhiều)'; sp[0].style.color = COL_CYAN; sp[1].textContent = o.pos || 'electron (đậm = nhiều)'; sp[1].style.color = COL_WARM;
    const bar = w.querySelector('i'); bar.style.background = 'linear-gradient(90deg,' + st.join(',') + ')'; bar.firstChild.textContent = o.mid || 'trống'; if (o.note) w.title = o.note;
    p.syncs.push(() => { w.style.display = (c.always || S.view === 'field') ? '' : 'none'; }); w.style.display = (c.always || S.view === 'field') ? '' : 'none';
    return w;
  }
  if (c.seg) {
    w.className = 'lb6-seg';
    c.seg.forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.textContent = o[1]; b.className = S[c.k] === o[0] ? 'on' : '';
      b.onclick = () => { S[c.k] = o[0]; if (c.set && c.set[o[0]]) Object.assign(S, c.set[o[0]]); curPanels.forEach(q => q.syncCtrls && q.syncCtrls()); touch(); }; w.appendChild(b); });
    p.syncs.push(() => { [...w.children].forEach((b, i) => b.classList.toggle('on', S[c.k] === c.seg[i][0])); });
    return w;
  }
  w.className = 'lb6-k';
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
    const el = document.createElement('div'); el.className = 'lb6-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb6-t"></div><div class="lb6-cv">' + (spec.host ? '' : '<canvas></canvas>') + '</div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) { const lg = document.createElement('div'); lg.className = 'lb6-log'; lg.setAttribute('aria-live', 'polite'); el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el); curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 250 + j * 900))); return; }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb6-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.onClick && cv) {
      cv.style.cursor = 'pointer'; cv.style.touchAction = 'none'; let dn = null;
      cv.addEventListener('pointerdown', ev => { dn = { x: ev.clientX, y: ev.clientY, mv: 0 }; });
      cv.addEventListener('pointermove', ev => { if (!dn) return; const dx = ev.clientX - dn.x, dy = ev.clientY - dn.y; dn.mv += Math.abs(dx) + Math.abs(dy); dn.x = ev.clientX; dn.y = ev.clientY; if (spec.onDrag && dn.mv > 6 && !p.focus) spec.onDrag(p, dx, dy); });
      const up = ev => { if (dn && dn.mv <= 6 && ev.type === 'pointerup') { const r = cv.getBoundingClientRect(); spec.onClick(p, ev.clientX - r.left, ev.clientY - r.top); } dn = null; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      if (spec.onWheel) cv.addEventListener('wheel', ev => { ev.preventDefault(); spec.onWheel(p, ev.deltaY); }, { passive: false });
    }
    if (spec.ctrls && spec.ctrls.length) { const cb = document.createElement('div'); cb.className = 'lb6-c'; spec.ctrls.forEach(c => cb.appendChild(mkCtrl(tab, c, p))); el.appendChild(cb); }
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
  root.querySelector('.lb6-x').focus({ preventScroll: true });
  const b = document.getElementById('tb-lab'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
}
function close() {
  if (!root || root.hidden) return;
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
    const b = document.getElementById('tb-lab'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- dấu hiệu tinh tế trong bài: biểu tượng bình thí nghiệm nhỏ cạnh tiêu đề ---------- */
const H3MAP = [[/^1\.[23]/,'balance',0],[/^2\.[12]/,'balance',0],[/^3\.1/,'degenerate',0],[/^4\.[12]/,'degenerate',0],[/^5\.[123]/,'ionize',0],[/^6\.[123]/,'ionize',0],[/^7\.[123]/,'compensate',0],[/^8\.[12]/,'designer',0],[/^9\.[123]/,'thermal',0],[/^10\.[12]/,'junction',0],[/^Câu 1/,'balance',0],[/^Câu 2/,'degenerate',0],[/^Câu 3/,'ionize',0],[/^Câu 4/,'compensate',0],[/^Câu [56]/,'designer',0]];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab6-m')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab6-m'; b.innerHTML = FLASK;
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
