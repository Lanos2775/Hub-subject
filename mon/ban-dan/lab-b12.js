/* ==========================================================================
   lab-b12.js — PHÒNG THÍ NGHIỆM MÔ PHỎNG BUỔI 12:
   TRANSISTOR LƯỠNG CỰC BJT — PHÂN BỐ HẠT THIỂU SỐ, THÀNH PHẦN DÒNG, ĐƯỜNG TẢI,
   KHUẾCH ĐẠI, γ·α_T·δ, HIỆU ỨNG EARLY, MỨC CAO & HẸP VÙNG CẤM, DỒN DÒNG,
   ĐÁNH THỦNG, TẦN SỐ f_α VÀ CHUYỂN MẠCH
   - Mô phỏng vật lý trực quan (khối BJT 3D, mặt cắt E|B|C, ampe kế, đồng hồ kim, đèn,
     đường đua thời gian bay) — KHÔNG biểu đồ, KHÔNG sơ đồ.
   - Đồng bộ bảng biến màu CSS, khung popup 95% và nhật ký như lab-b11.js.
   - Đủ 11 tab ứng 1–1 với 11 mỏ neo "Mô hình tương tác" trong Buổi 12:
       1.3 · Phân bố e⁻ cơ sở | 1.5 · Thành phần dòng | 2.3 · Đường tải | 2.5 · Khuếch đại
       3.5 · γ·α_T·δ          | 4.2 · Early            | 4.5 · Mức cao & ΔE_g
       4.7 · Dồn dòng         | 4.10 · Đánh thủng      | 6.2 · Tần số f_α | 7.3 · Chuyển mạch
   - API: LabB12.open(tabId?, panelIndex?, patch?)  LabB12.close()  LabB12.mark(root)
   ========================================================================== */
(function () {
'use strict';

/* ---------- hằng số vật lý & tiện ích ---------- */
const TAU2 = Math.PI * 2;
const E_CHG = 1.6e-19;          // C
const EPS0 = 8.85e-14;          // F/cm
const EPS_SI = 11.7 * EPS0;     // F/cm
const EPS_OX = 3.9 * EPS0;      // F/cm
const NI_SI = 1.5e10;           // cm^-3 (300K)
const VT_300 = 0.0259;          // V (300K)
const VSAT_SI = 1e7;            // cm/s
const rnd = (a, b) => a + Math.random() * (b - a);
const gauss = () => {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU2 * v);
};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[d]).join('');
const p10 = n => '10' + sup(n);
const sci = (x, d = 2) => {
  if (!x || !isFinite(x)) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  return (x / Math.pow(10, e)).toFixed(d) + '×10' + sup(e);
};
const pw = v => {
  const lg = Math.log10(v);
  const e = Math.floor(lg + 1e-9);
  const m = v / Math.pow(10, e);
  return Math.abs(m - 1) < 0.06 ? p10(e) : m.toFixed(1) + '×10' + sup(e);
};
const fmtLen = cm => {
  const um = cm * 1e4;
  return um >= 10 ? um.toFixed(1) + ' µm'
    : um >= 0.1 ? um.toFixed(3) + ' µm'
    : (um * 1000).toFixed(1) + ' nm';
};
const fmtFreq = hz => {
  if (hz >= 1e9) return (hz / 1e9).toFixed(2) + ' GHz';
  if (hz >= 1e6) return (hz / 1e6).toFixed(2) + ' MHz';
  if (hz >= 1e3) return (hz / 1e3).toFixed(1) + ' kHz';
  return hz.toFixed(0) + ' Hz';
};
const fmtCur = a => {
  const x = Math.abs(a), s = a < 0 ? '−' : '';
  if (x >= 1) return s + x.toFixed(2) + ' A';
  if (x >= 1e-3) return s + (x * 1e3).toFixed(2) + ' mA';
  if (x >= 1e-6) return s + (x * 1e6).toFixed(2) + ' µA';
  if (x >= 1e-9) return s + (x * 1e9).toFixed(2) + ' nA';
  return x === 0 ? '0 A' : s + sci(x, 1) + ' A';
};
const FONT = '"Be Vietnam Pro",system-ui,sans-serif';
const C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ['bg', 'card', 'ink', 'mut', 'sub', 'main', 'err', 'c1', 'c2', 'c3', 'c4', 'c5', 'g', 'tint']
    .forEach(k => C[k] = cs.getPropertyValue('--' + k).trim() || '#888');
}

/* ---------- hàm vẽ canvas dùng chung ---------- */
function txt(ctx, s, x, y, col, size, al, wt) {
  ctx.font = (wt || 500) + ' ' + (size || 12) + 'px ' + FONT;
  ctx.fillStyle = col || C.ink;
  ctx.textAlign = al || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}
function ln(ctx, x1, y1, x2, y2, col, w, dash) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = col; ctx.lineWidth = w || 1; ctx.setLineDash(dash || []);
  ctx.stroke(); ctx.setLineDash([]);
}
function arr(ctx, x1, y1, x2, y2, col, w) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 4 + (w || 2) * 1.55;
  ln(ctx, x1, y1, x2, y2, col, w || 2);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45));
  ctx.lineTo(x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45));
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
function dot(ctx, x, y, r, col) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU2); ctx.fillStyle = col; ctx.fill();
}
function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function chip(ctx, text, x, y, col, al) {
  ctx.font = '700 11.5px ' + FONT;
  const tw = ctx.measureText(text).width + 14;
  const bx = al === 'right' ? x - tw : al === 'center' ? x - tw / 2 : x;
  rr(ctx, bx, y - 10, tw, 20, 6);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = col || C.g; ctx.lineWidth = 1; ctx.stroke();
  txt(ctx, text, bx + tw / 2, y + 0.5, col || C.ink, 11.5, 'center', 700);
}
function drawIon(ctx, x, y, sign, col, sz) {
  const r = sz || 6;
  rr(ctx, x - r, y - r, r * 2, r * 2, 3);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke();
  txt(ctx, sign, x, y + 0.5, col, Math.max(8.5, r * 1.55), 'center', 800);
}
/* Đồng hồ kim siêu gọn, KHÔNG bọc khung — đặt trực tiếp vào góc trống trên canvas */
function drawMiniGauge(ctx, cx, cy, rad, title, valText, frac, col, dangerFrac) {
  const r = clamp(rad || 22, 16, 30);
  txt(ctx, title, cx, cy - r - 9, C.mut, 9.5, 'center', 700);
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 1.12, Math.PI * 1.88);
  ctx.strokeStyle = C.g; ctx.lineWidth = 4; ctx.stroke();
  if (dangerFrac != null) {
    const aD = Math.PI * (1.12 + 0.76 * clamp(dangerFrac, 0, 1));
    ctx.beginPath(); ctx.arc(cx, cy, r, aD, Math.PI * 1.88);
    ctx.strokeStyle = C.err; ctx.lineWidth = 4; ctx.stroke();
  }
  const f = clamp(frac, 0, 1);
  const ang = Math.PI * (1.12 + 0.76 * f);
  const ncol = (dangerFrac != null && f >= dangerFrac) ? C.err : (col || C.main);
  arr(ctx, cx, cy, cx + Math.cos(ang) * (r - 3), cy + Math.sin(ang) * (r - 3), ncol, 2);
  dot(ctx, cx, cy, 3, ncol);
  txt(ctx, valText, cx, cy + 12, ncol, 10.5, 'center', 800);
}

/* ---------- hàm vẽ hình khối 3D & linh kiện thực tế ---------- */
function isoP(ox, oy, x, y, z) {
  return [ox + x - y * 0.50, oy + y * 0.28 - z];
}
function polyFill(ctx, pts, col, al, strokeCol, lw) {
  ctx.beginPath();
  pts.forEach((a, i) => i ? ctx.lineTo(a[0], a[1]) : ctx.moveTo(a[0], a[1]));
  ctx.closePath();
  if (col) {
    ctx.save(); ctx.globalAlpha = al == null ? 1 : al;
    ctx.fillStyle = col; ctx.fill(); ctx.restore();
  }
  if (strokeCol) { ctx.strokeStyle = strokeCol; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function isoBox(ctx, ox, oy, x, y, z, dx, dy, dz, col, al, strokeCol) {
  const p000 = isoP(ox, oy, x, y, z), p100 = isoP(ox, oy, x + dx, y, z);
  const p010 = isoP(ox, oy, x, y + dy, z), p110 = isoP(ox, oy, x + dx, y + dy, z);
  const p001 = isoP(ox, oy, x, y, z + dz), p101 = isoP(ox, oy, x + dx, y, z + dz);
  const p011 = isoP(ox, oy, x, y + dy, z + dz), p111 = isoP(ox, oy, x + dx, y + dy, z + dz);
  const a = al == null ? 1 : al, sc = strokeCol || C.sub;
  // Mặt trước (y + dy)
  polyFill(ctx, [p010, p110, p111, p011], col, a * 0.85, sc, 1);
  polyFill(ctx, [p010, p110, p111, p011], '#000', a * 0.16);
  // Mặt phải (x + dx)
  polyFill(ctx, [p110, p100, p101, p111], col, a * 0.85, sc, 1);
  polyFill(ctx, [p110, p100, p101, p111], '#000', a * 0.34);
  // Mặt trên (z + dz)
  polyFill(ctx, [p001, p101, p111, p011], col, a, sc, 1.1);
}
function drawProbe(ctx, tx, ty, dir, col, label) {
  const s = dir < 0 ? -1 : 1;
  ln(ctx, tx + s * 42, ty - 54, tx + s * 10, ty - 16, C.sub, 5);
  ln(ctx, tx + s * 10, ty - 16, tx, ty, col || C.main, 2.2);
  dot(ctx, tx, ty, 3, col || C.main);
  if (label) txt(ctx, label, tx + s * 46, ty - 56, col || C.ink, 10.5, s > 0 ? 'left' : 'right', 700);
}
function drawTO220(ctx, cx, cy, sc, activeCol, showLabels) {
  const w = 44 * sc, h = 42 * sc, tabH = 18 * sc;
  // Tấm tản nhiệt kim loại trên
  rr(ctx, cx - w / 2, cy - h / 2 - tabH, w, tabH + 4, 3);
  ctx.fillStyle = C.g; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.2; ctx.stroke();
  dot(ctx, cx, cy - h / 2 - tabH * 0.52, 5.2 * sc, C.bg);
  ctx.beginPath(); ctx.arc(cx, cy - h / 2 - tabH * 0.52, 5.2 * sc, 0, TAU2); ctx.strokeStyle = C.sub; ctx.lineWidth = 1; ctx.stroke();
  // Thân nhựa đen epoxy
  rr(ctx, cx - w / 2, cy - h / 2, w, h, 3);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = activeCol || C.sub; ctx.lineWidth = 1.6; ctx.stroke();
  txt(ctx, 'MOS', cx, cy - 5 * sc, activeCol || C.ink, Math.max(8, 10 * sc), 'center', 800);
  txt(ctx, 'FET', cx, cy + 7 * sc, C.mut, Math.max(7.5, 9 * sc), 'center', 700);
  // 3 chân G - D - S
  const xs = [cx - w * 0.32, cx, cx + w * 0.32];
  const ls = ['G', 'D', 'S'];
  const lcols = [C.main, C.c1, C.c2];
  xs.forEach((lx, i) => {
    ln(ctx, lx, cy + h / 2, lx, cy + h / 2 + 24 * sc, lcols[i], 3 * sc);
    if (showLabels) txt(ctx, ls[i], lx, cy + h / 2 + 33 * sc, lcols[i], Math.max(9, 10.5 * sc), 'center', 800);
  });
}

/* ---------- mô hình vật lý MOS & MOSFET (Buổi 11 / Neamen Ch.10–14) ---------- */
const DN = 25; // cm²/s, hệ số khuếch tán electron trong cơ sở

/* ---------- bảng vai trò màu (cố định cho cả file) ----------
   c2 = electron / vùng n · c4 = lỗ trống / vùng p · c5 = vùng nghèo, ion cố định
   c1 = tiếp xúc, collector, đại lượng vào · c3 = tổn hao, tái hợp, thời gian thứ 4
   main = đại lượng chủ đạo / kết quả · err = cảnh báo, đánh thủng */
const IS0 = 1.26e-14;            // A, dòng bão hòa mẫu (I_C = 1 mA tại V_BE = 0,65 V)
const NC_DOP = 1e15;             // cm^-3, pha tạp collector mẫu
const sm = (o, k, v, dt, tau) => { if (o[k] == null) o[k] = v; o[k] += (v - o[k]) * (1 - Math.exp(-dt / (tau || 0.15))); return o[k]; };
const fBof = x => clamp(0.10 + 0.24 * (Math.log10(x) + 1) / 2.08, 0.10, 0.36);
const fmtUm = v => v < 1 ? v.toFixed(2) + ' µm' : v.toFixed(1) + ' µm';
const fmtV = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + ' V';
const fmtOhm = r => !isFinite(r) ? '∞' : r >= 1e6 ? (r / 1e6).toFixed(2) + ' MΩ' : r >= 1e3 ? (r / 1e3).toFixed(1) + ' kΩ' : r.toFixed(0) + ' Ω';
const fmtT = s => s >= 1e-6 ? (s * 1e6).toFixed(2) + ' µs' : s >= 1e-9 ? (s * 1e9).toFixed(1) + ' ns' : (s * 1e12).toFixed(1) + ' ps';
const pct = (x, d) => (x * 100).toFixed(d == null ? 2 : d) + ' %';
const lg10 = x => Math.log10(Math.max(1e-30, x));

/* ---------- linh kiện & ký hiệu mạch ---------- */
function drawTO92(ctx, cx, cy, sc, col) {
  const r = 22 * sc;
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.lineTo(cx + r, cy + 3 * sc); ctx.lineTo(cx - r, cy + 3 * sc); ctx.closePath();
  ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = col || C.sub; ctx.lineWidth = 1.6; ctx.stroke();
  txt(ctx, 'BJT', cx, cy - 8 * sc, col || C.ink, Math.max(8, 10 * sc), 'center', 800);
  txt(ctx, 'npn', cx, cy + 3 * sc, C.mut, Math.max(7.5, 9 * sc), 'center', 700);
  const lc = [C.c2, C.c4, C.c1], lb = ['E', 'B', 'C'], xs = [cx - 12 * sc, cx, cx + 12 * sc];
  xs.forEach((x, i) => {
    ln(ctx, x, cy + 3 * sc, x, cy + 28 * sc, lc[i], 2.4);
    txt(ctx, lb[i], x, cy + 38 * sc, lc[i], 9.5, 'center', 800);
  });
  return xs.map(x => [x, cy + 28 * sc]);
}
function drawNPN(ctx, cx, cy, r, col) {
  const xb = cx - r * 0.3, xc = cx + r * 0.55;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU2); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = col || C.sub; ctx.lineWidth = 1.6; ctx.stroke();
  ln(ctx, xb, cy - r * 0.55, xb, cy + r * 0.55, C.ink, 3);
  ln(ctx, cx - r * 1.6, cy, xb, cy, C.c4, 2.4);
  ln(ctx, xb, cy - r * 0.3, xc, cy - r * 0.78, C.c1, 2.4);
  ln(ctx, xc, cy - r * 0.78, xc, cy - r * 1.6, C.c1, 2.4);
  arr(ctx, xb, cy + r * 0.3, xc, cy + r * 0.78, C.c2, 2.4);
  ln(ctx, xc, cy + r * 0.78, xc, cy + r * 1.6, C.c2, 2.4);
  return { B: [cx - r * 1.6, cy], C: [xc, cy - r * 1.6], E: [xc, cy + r * 1.6] };
}
function drawRes(ctx, x1, y1, x2, y2, col, w) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + ux * L * 0.2, y1 + uy * L * 0.2);
  for (let i = 0; i < 6; i++) {
    const f = 0.2 + 0.6 * (i + 0.5) / 6, s = i % 2 ? -1 : 1;
    ctx.lineTo(x1 + ux * L * f + nx * 5 * s, y1 + uy * L * f + ny * 5 * s);
  }
  ctx.lineTo(x1 + ux * L * 0.8, y1 + uy * L * 0.8); ctx.lineTo(x2, y2);
  ctx.strokeStyle = col; ctx.lineWidth = w || 2.2; ctx.stroke();
}
function drawBat(ctx, x, y1, y2, col) {
  const yc = (y1 + y2) / 2;
  ln(ctx, x, y1, x, yc - 4, col, 2.4); ln(ctx, x, yc + 4, x, y2, col, 2.4);
  ln(ctx, x - 11, yc - 4, x + 11, yc - 4, col, 3); ln(ctx, x - 6, yc + 4, x + 6, yc + 4, col, 3);
  txt(ctx, '+', x + 18, yc - 6, col, 11, 'left', 800);
}
function pathDots(ctx, pts, n, sp, t, col, r) {
  let tot = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
  if (tot < 1) return;
  for (let k = 0; k < n; k++) {
    let u = ((((t * sp + k / n) % 1) + 1) % 1) * tot, i = 0;
    while (i < seg.length - 1 && u > seg[i]) { u -= seg[i]; i++; }
    const f = seg[i] ? u / seg[i] : 0;
    dot(ctx, pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f, r || 3.6, col);
  }
}
function flowDots(ctx, st, key, n, x0, x1, y0, y1, sp, dt, t, col, sign) {
  let a = st[key]; if (!a) a = st[key] = [];
  while (a.length < n) a.push({ u: Math.random(), v: Math.random(), ph: rnd(0, TAU2) });
  for (let i = 0; i < n; i++) {
    const q = a[i];
    q.u += sp * dt;
    if (q.u > 1) { q.u -= 1; q.v = Math.random(); }
    if (q.u < 0) { q.u += 1; q.v = Math.random(); }
    const x = x0 + q.u * (x1 - x0), y = y0 + q.v * (y1 - y0) + Math.sin(t * 5 + q.ph) * 1.8;
    dot(ctx, x, y, 4.2, col);
    if (sign) txt(ctx, sign, x, y + 0.5, C.bg, 8, 'center', 800);
  }
}
function addFlash(st, x, y) { const f = st.fl || (st.fl = []); if (f.length < 40) f.push({ x, y, a: 1 }); }
function drawFlashes(ctx, st, dt, col) {
  const f = st.fl; if (!f) return;
  for (let i = f.length - 1; i >= 0; i--) {
    const q = f[i]; q.a -= dt * 2.4;
    if (q.a <= 0) { f.splice(i, 1); continue; }
    ctx.beginPath(); ctx.arc(q.x, q.y, 4 + (1 - q.a) * 14, 0, TAU2);
    ctx.strokeStyle = col || C.err; ctx.globalAlpha = q.a; ctx.lineWidth = 1.6; ctx.stroke(); ctx.globalAlpha = 1;
  }
}
/* Khối BJT 3D: E | B | C, vùng nghèo, tiếp xúc; trả về điểm đặt kim dò */
function bjt3D(ctx, ox, oy, o) {
  const bw = o.bw, bd = o.bd, h = o.h, wE = bw * o.fE, wB = bw * o.fB, wC = bw - wE - wB;
  isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, h, C.card, 1, C.sub);
  isoBox(ctx, ox, oy, 0, 0, 0, wE, bd, h, C.c2, 0.34, C.c2);
  isoBox(ctx, ox, oy, wE, 0, 0, wB, bd, h, C.c4, 0.34, C.c4);
  if (o.slices) {
    const n = o.slices.n;
    for (let i = 0; i < n; i++) isoBox(ctx, ox, oy, wE + i * wB / n, 0, 0, wB / n, bd, h, C.c2, o.slices.fn((i + 0.5) / n), C.c2);
  }
  isoBox(ctx, ox, oy, wE + wB, 0, 0, wC, bd, h, C.c2, 0.2, C.c2);
  const dE = o.depBEe || 0, dB = o.depBEb || 0, cB = o.depBCb || 0, cC = o.depBCc || 0;
  if (dE + dB > 0.5) isoBox(ctx, ox, oy, wE - dE, 0, 0, dE + dB, bd, h, C.c5, 0.36, o.depCol || C.c5);
  if (cB + cC > 0.5) isoBox(ctx, ox, oy, wE + wB - cB, 0, 0, cB + cC, bd, h, C.c5, 0.36, o.depCol || C.c5);
  const pad = (x, w) => isoBox(ctx, ox, oy, x, bd * 0.2, h, w, bd * 0.6, 6, C.sub, 0.95, C.ink);
  if (!o.noPads) { pad(wE * 0.2, wE * 0.6); pad(wE + wB * 0.1, wB * 0.8); pad(wE + wB + wC * 0.2, wC * 0.6); }
  return {
    wE, wB, wC,
    E: isoP(ox, oy, wE * 0.5, bd * 0.5, h + 6), B: isoP(ox, oy, wE + wB * 0.5, bd * 0.5, h + 6), C: isoP(ox, oy, wE + wB + wC * 0.5, bd * 0.5, h + 6)
  };
}
/* Mặt cắt 2D E | B | C */
function secFrame(ctx, x, y, w, h, fE, fB, o) {
  o = o || {};
  const xBE = x + w * fE, xBC = xBE + w * fB;
  rr(ctx, x, y, w, h, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
  ctx.save(); rr(ctx, x, y, w, h, 8); ctx.clip();
  ctx.globalAlpha = 0.20; ctx.fillStyle = C.c2; ctx.fillRect(x, y, xBE - x, h);
  ctx.globalAlpha = 0.16; ctx.fillStyle = C.c4; ctx.fillRect(xBE, y, xBC - xBE, h);
  ctx.globalAlpha = 0.10; ctx.fillStyle = C.c2; ctx.fillRect(xBC, y, x + w - xBC, h);
  const a = o.depBEe || 0, b = o.depBEb || 0, c = o.depBCb || 0, d = o.depBCc || 0;
  ctx.globalAlpha = 0.30; ctx.fillStyle = o.depCol || C.c5;
  if (a + b > 0.5) ctx.fillRect(xBE - a, y, a + b, h);
  if (c + d > 0.5) ctx.fillRect(xBC - c, y, c + d, h);
  ctx.restore();
  ln(ctx, xBE, y, xBE, y + h, C.ink, 1.4); ln(ctx, xBC, y, xBC, y + h, C.ink, 1.4);
  if (!o.noLabels) {
    txt(ctx, 'E n⁺⁺', (x + xBE) / 2, y + 11, C.c2, 10, 'center', 700);
    txt(ctx, 'B p', (xBE + xBC) / 2, y + 11, C.c4, 10, 'center', 700);
    txt(ctx, 'C n', (xBC + x + w) / 2, y + 11, C.c2, 10, 'center', 700);
  }
  return { xBE, xBC, x0: x, x1: x + w, y0: y, y1: y + h, wB: xBC - xBE };
}

/* ---------- mô hình vật lý BJT (Neamen Ch.12 / Buổi 12) ---------- */
function bjtMode(vbe, vbc) {
  const f1 = vbe > 0.4, f2 = vbc > 0.4;
  if (f1 && !f2) return { k: 'fa', label: 'Thuận tích cực' };
  if (f1 && f2) return { k: 'sat', label: 'Bão hòa' };
  if (!f1 && f2) return { k: 'ra', label: 'Ngược tích cực' };
  return { k: 'cut', label: 'Ngắt' };
}
/* Phân bố electron thiểu số trong cơ sở: xB, LB (µm); NB (cm⁻³) */
function baseProf(VBE, VBC, xB, LB, NB) {
  const n0 = NI_SI * NI_SI / NB, a = xB / LB, sh = Math.sinh(a), ch = Math.cosh(a);
  const eBE = Math.exp(VBE / VT_300) - 1, eBC = Math.exp(VBC / VT_300) - 1;
  const n = u => n0 * (1 + (eBE * Math.sinh(a * (1 - u)) + eBC * Math.sinh(a * u)) / sh);
  const k = DN * n0 / (LB * 1e-4 * sh), A = 1e-4;
  const F0 = k * (eBE * ch - eBC), FC = k * (eBE - eBC * ch);
  const IC = E_CHG * A * FC, IE1 = E_CHG * A * F0;
  const aT = Math.abs(F0) > 1e-30 ? FC / F0 : 1;
  const nmax = Math.max(n(0), n(1), 2000 * n0);
  return { n0, a, n, IC, IE1, aT, nmax, eBE, eBC };
}
function compCalc(S) {
  const IC = IS0 * Math.exp(S.VBE / VT_300), iE1 = IC / (1 - S.rb), iE2 = S.r2 * IC;
  const iBa = iE2, iBb = iE1 - IC, iE = iE1 + iE2, iB = iBa + iBb;
  return { IC, iE1, iE2, iBa, iBb, iE, iB, alpha: IC / iE, beta: IC / iB, gamma: iE1 / iE };
}
function modeCalc(S) {
  const IBa = S.IB * 1e-6, RC = S.RC * 1e3, ICmax = (S.VCC - 0.2) / RC, want = S.beta * IBa;
  let k, IC, VCE;
  if (IBa < 0.2e-6) { k = 'cut'; IC = 0; VCE = S.VCC; }
  else if (want >= ICmax) { k = 'sat'; IC = ICmax; VCE = 0.2; }
  else { k = 'act'; IC = want; VCE = S.VCC - want * RC; }
  return { k, IC, VCE, VR: S.VCC - VCE, ICmax, want, IBa, RC };
}
function gainCalc(S) {
  const xE = 0.8, LE = S.LB;
  const nb2 = S.NB / S.NE;
  const gamma = 1 / (1 + nb2 * Math.tanh(S.xB / S.LB) / Math.tanh(xE / LE));
  const aT = 1 / Math.cosh(S.xB / S.LB);
  const delta = 1 / (1 + Math.exp((0.38 - S.VBE) / (2 * VT_300)));
  const alpha = gamma * aT * delta, beta = alpha / (1 - alpha);
  const l1 = 1 - gamma, l2 = gamma * (1 - aT), l3 = gamma * aT * (1 - delta);
  return { gamma, aT, delta, alpha, beta, l1, l2, l3 };
}
function xdBase(VR, NB) {
  return Math.sqrt(2 * EPS_SI * (VT_300 * Math.log(NB * NC_DOP / (NI_SI * NI_SI)) + VR) / E_CHG * NC_DOP / (NB * (NB + NC_DOP))) * 1e4;
}
function earlyCalc(S) {
  const Vbi = VT_300 * Math.log(S.NB * NC_DOP / (NI_SI * NI_SI));
  const xd = xdBase(S.VCB, S.NB), xd0 = xdBase(0, S.NB);
  const xB0r = Math.max(0.05, S.xB0 - xd0), xB = Math.max(0.05, S.xB0 - xd), boost = xB0r / xB;
  const VAtot = xd > 1e-6 ? 2 * (Vbi + S.VCB) * xB / xd : Infinity;
  const IC = 1e-3 * boost;
  return { Vbi, xd, xd0, xB, xB0r, boost, VAtot, VA: VAtot - (S.VCB + 0.65), IC, ro: VAtot / IC, go: IC / VAtot };
}
function hlCalc(S) {
  const L = Math.log(S.NE / 1e17);
  const dEg = S.bgn === 'on' ? 0.009 * (L + Math.sqrt(L * L + 0.5)) : 0;
  const fac = Math.exp(dEg / VT_300);
  const gamma = 1 / (1 + S.NB / S.NE * fac), gamma0 = 1 / (1 + S.NB / S.NE);
  const n0 = NI_SI * NI_SI / S.NB, VK = VT_300 * Math.log(S.NB / n0);
  const nB = S.VBE <= VK ? n0 * Math.exp(S.VBE / VT_300) : S.NB * Math.exp((S.VBE - VK) / (2 * VT_300));
  const aL = gamma * 0.9968, bLow = aL / (1 - aL);
  const beta = S.VBE <= VK ? bLow : bLow * Math.exp(-(S.VBE - VK) / (2 * VT_300));
  return { dEg, fac, gamma, gamma0, n0, VK, nB, r: nB / S.NB, bLow, beta };
}
function crowdSolve(S) {
  const n = S.nf, w = S.wE / n, Sx = w / 2, I = S.I * 1e-3 / n, Le = 100, beta = 50, N = 40, dx = Sx / N;
  const prof = Jc => {
    let Il = 0, U = 0, J = Jc; const a = new Array(N + 1); a[N] = J;
    for (let i = N - 1; i >= 0; i--) { Il += Le / beta * J * dx; U += S.Rsb / Le * Il * dx; J = Jc * Math.exp(Math.min(U / VT_300, 40)); a[i] = J; }
    return a;
  };
  const tot = a => { let s = 0; for (let i = 0; i < N; i++) s += (a[i] + a[i + 1]) / 2; return 2 * Le * dx * s; };
  let lo = -14, hi = -2;
  for (let it = 0; it < 50; it++) { const mid = (lo + hi) / 2; if (tot(prof(Math.pow(10, mid))) < I) lo = mid; else hi = mid; }
  const a = prof(Math.pow(10, (lo + hi) / 2)), mx = Math.max(a[0], a[N]);
  let dep = Sx;
  for (let i = 0; i <= N; i++) if (a[i] < mx / Math.E) { dep = i / N * Sx; break; }
  return { J: a.map(v => v / mx), N, ratio: a[0] / a[N], dV: VT_300 * Math.log(Math.max(1, a[0] / a[N])), w, Sx, dep, nf: n };
}
function brkCalc(S) {
  const xd = xdBase(S.VCB, S.NB);
  const Vpt = E_CHG * Math.pow(S.xBO * 1e-4, 2) / (2 * EPS_SI) * S.NB * (NC_DOP + S.NB) / NC_DOP;
  const bar = 1 / (1 + Math.exp((S.VCB - Vpt) / 2.5));
  const Ipt = 1e-9 * (1 + Math.exp(Math.min(40, (S.VCB - Vpt) / 1.2)));
  const alpha = S.beta / (1 + S.beta), BV = 120;
  const x = Math.pow(S.VCB / BV, 4), M = x < 0.999 ? 1 / (1 - x) : 1e6;
  const ICBO = 1e-9 * (1 + S.VCB / 50), den = 1 - alpha * M;
  const ICEO = den > 0.001 ? Math.min(0.2, M * ICBO / den) : 0.2;
  return { xd, Vpt, bar, Ipt: Math.min(0.2, Ipt), touch: xd >= S.xBO, M, ICBO, ICEO, BVceo: BV * Math.pow(S.beta + 1, -0.25), alpha };
}
function swCalc(S) {
  const tau = 20, t0 = 3, ton = 20, toff = 180, Ttot = 320, k = S.k, m = S.m;
  const qOff = k * (1 - Math.exp(-(toff - ton - t0) / tau));
  const q = tt => {
    if (tt < ton + t0) return 0;
    if (tt <= toff) return k * (1 - Math.exp(-(tt - ton - t0) / tau));
    return Math.max(0, (qOff + m) * Math.exp(-(tt - toff) / tau) - m);
  };
  const ib = tt => tt < ton ? 0 : tt <= toff ? k : (q(tt) > 0 ? -m : 0);
  const t10 = -tau * Math.log(1 - 0.1 / k), t90 = -tau * Math.log(1 - 0.9 / k);
  const td = t0 + t10, tr = t90 - t10;
  const ts = Math.max(0, tau * Math.log((qOff + m) / (0.9 + m))), tf = tau * Math.log((0.9 + m) / (0.1 + m));
  return { tau, t0, ton, toff, Ttot, k, m, q, ib, td, tr, ts, tf };
}

const LABS = [];

/* ==========================================================================
   1. MỤC 1.3 — PHÂN BỐ ELECTRON THIỂU SỐ TRONG CƠ SỞ
   ========================================================================== */
LABS.push({
  id: 'base', tag: '1.3', name: 'Phân bố e⁻ cơ sở', sec: 1,
  S: { VBE: 0.65, VBC: -2.0, xB: 0.8, LB: 10 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Khối BJT npn — dải sọc c2 trong cơ sở đậm nhạt theo nồng độ electron n_B(x)',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VBE', l: 'V_BE', min: 0, max: 0.85, step: 0.01, f: fmtV },
        { k: 'VBC', l: 'V_BC', min: -5, max: 0.7, step: 0.05, f: fmtV },
        { k: 'xB', l: 'x_B', min: -1, max: 1.08, step: 0.02, log: 1, f: fmtUm },
        { k: 'LB', l: 'L_B', min: 2, max: 30, step: 1, f: v => v + ' µm' },
        { btn: 'Cơ sở mỏng', fn: p => { p.S.xB = 0.8; p.S.LB = 10; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Cơ sở dài', fn: p => { p.S.xB = 12; p.S.LB = 6; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = baseProf(S.VBE, S.VBC, S.xB, S.LB, 1e16), md = bjtMode(S.VBE, S.VBC);
        const bw = Math.min(310, W * 0.50), bd = Math.min(140, H * 0.38), h = Math.min(88, H * 0.28);
        const fB = fBof(S.xB), fE = 0.34, ox = W * 0.22, oy = H * 0.78;
        const depC = S.VBC < 0.3 ? 3 + 5 * Math.sqrt(Math.max(0, -S.VBC) + 0.6) : 2;
        const wB = bw * fB, wC = bw * (1 - fE - fB);
        const G = bjt3D(ctx, ox, oy, {
          bw, bd, h, fE, fB, depBEe: 2, depBEb: 4, depBCb: Math.min(depC * 0.4, wB * 0.45), depBCc: Math.min(depC * 1.1, wC * 0.5),
          slices: { n: 10, fn: u => 0.08 + 0.78 * clamp(P.n(u) / P.nmax, 0, 1) }
        });
        drawProbe(ctx, G.E[0], G.E[1], -1, C.c2, 'E · 0 V');
        drawProbe(ctx, G.B[0], G.B[1], 1, C.c4, 'B · ' + fmtV(S.VBE));
        drawProbe(ctx, G.C[0], G.C[1], 1, C.c1, 'C · ' + fmtV(S.VBE - S.VBC));
        const gx = W - 62;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Dòng I_C', fmtCur(P.IC), clamp((lg10(Math.abs(P.IC)) + 12) / 10, 0, 1), C.main);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'n_B(0)', sci(P.n(0), 1), clamp((lg10(P.n(0)) - 4) / 14, 0, 1), C.c2);
        chip(ctx, 'Chế độ: ' + md.label + ' · x_B/L_B = ' + (S.xB / S.LB).toFixed(2), W * 0.44, 15, md.k === 'fa' ? C.main : C.c5, 'center');
      }
    },
    {
      title: 'Bên trong (E → B → C): dải sáng–tối nồng độ electron trong cơ sở, electron phun – khuếch tán – bị quét',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, P = baseProf(S.VBE, S.VBC, S.xB, S.LB, 1e16);
        const padX = 16, rightLbl = 140, topY = 10, botY = H - 10, bw = W - padX - rightLbl, bh = botY - topY;
        const fB = fBof(S.xB) + 0.06, fE = 0.28;
        const depC = S.VBC < 0.3 ? 3 + 4 * Math.sqrt(Math.max(0, -S.VBC) + 0.6) : 2;
        const G = secFrame(ctx, padX, topY, bw, bh, fE, fB, { depBEe: 2, depBEb: 3, depBCb: Math.min(depC * 0.4, G0(bw * fB)), depBCc: Math.min(depC, bw * 0.1) });
        const yB = botY - 8, hP = bh * 0.60, xs = G.xBE, xe = G.xBC;
        const Y = n => yB - clamp(n / P.nmax, 0, 1) * hP;
        const NS = 28;
        for (let i = 0; i < NS; i++) {
          ctx.save(); ctx.globalAlpha = 0.08 + 0.62 * clamp(P.n((i + 0.5) / NS) / P.nmax, 0, 1); ctx.fillStyle = C.c2;
          ctx.fillRect(xs + (xe - xs) * i / NS, G.y0 + 22, (xe - xs) / NS + 0.6, G.y1 - G.y0 - 30); ctx.restore();
        }

        const f = clamp(S.VBE / 0.8, 0, 1), dir = P.IC >= 0 ? 1 : -1, sp = 0.35 + 0.7 * f;
        const nAct = Math.round(3 + 30 * f), pk = clamp((1 - P.aT) * 7, 0, 0.95);
        const y0 = G.y0 + 24, y1 = G.y1 - 10;
        if (!st.es) st.es = Array.from({ length: 34 }, () => ({ u: Math.random(), v: Math.random(), ud: 2 }));
        st.es.forEach((q, i) => {
          if (i >= nAct) return;
          q.u += sp * dt;
          if (q.u >= q.ud || q.u > 1) {
            if (q.u >= q.ud) addFlash(st, xs + (dir > 0 ? q.u : 1 - q.u) * (xe - xs), y0 + q.v * (y1 - y0));
            q.u = 0; q.v = Math.random(); q.ud = Math.random() < pk ? rnd(0.15, 0.95) : 2;
          }
          const uu = dir > 0 ? q.u : 1 - q.u;
          const x = xs + uu * (xe - xs), y = y0 + q.v * (y1 - y0);
          dot(ctx, x, y, 4, C.c2); txt(ctx, '−', x, y + 0.5, C.bg, 8, 'center', 800);
        });
        for (let i = 0; i < 12; i++) {
          const x = xs + (0.1 + 0.8 * ((i * 0.37) % 1)) * (xe - xs) + Math.sin(t * 3 + i) * 2, y = y0 + (((i * 0.61) % 1) * 0.9 + 0.05) * (y1 - y0) + Math.cos(t * 3.4 + i) * 2;
          dot(ctx, x, y, 3.6, C.c4); txt(ctx, '+', x, y + 0.5, C.bg, 7.5, 'center', 800);
        }
        flowDots(ctx, st, 'fe', Math.round(f * 10), G.x0 + 8, xs - 4, y0, y1, sp * 0.9 * dir, dt, t, C.c2, '−');
        flowDots(ctx, st, 'fc', Math.round(f * 8), xe + 4, G.x1 - 8, y0, y1, sp * 0.9 * dir, dt, t, C.c2, '−');
        drawFlashes(ctx, st, dt, C.c3);

        const lx = padX + bw + 8;
        txt(ctx, 'x_B/L_B = ' + (S.xB / S.LB).toFixed(2), lx, topY + bh * 0.12, C.c5, 10, 'left', 700);
        txt(ctx, 'n_B(0) = ' + sci(P.n(0), 1), lx, topY + bh * 0.30, C.c2, 10, 'left', 700);
        txt(ctx, 'n_B(x_B) = ' + sci(P.n(1), 1), lx, topY + bh * 0.48, C.c2, 10, 'left', 700);
        txt(ctx, 'α_T = ' + P.aT.toFixed(4), lx, topY + bh * 0.66, C.c3, 10, 'left', 700);
        txt(ctx, S.xB / S.LB < 0.3 ? 'Dải đậm nhạt gần đều (cơ sở mỏng)' : 'Dải nhạt dần mạnh (cơ sở dài)', lx, topY + bh * 0.84, C.mut, 9.5, 'left', 600);
      }
    }
  ]
});
function G0(x) { return Math.max(1, x * 0.45); }

/* ==========================================================================
   2. MỤC 1.5 — CÁC THÀNH PHẦN DÒNG i_E1, i_E2, i_Ba, i_Bb, i_C
   ========================================================================== */
LABS.push({
  id: 'comp', tag: '1.5', name: 'Thành phần dòng', sec: 1,
  S: { VBE: 0.65, r2: 0.004, rb: 0.005 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: BJT TO-92 trên bàn thử — 3 ampe kế đo i_E, i_B, i_C khi quét V_BE',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VBE', l: 'V_BE', min: 0.45, max: 0.80, step: 0.005, f: v => v.toFixed(3) + ' V' },
        { k: 'r2', l: 'I_S2/I_S', min: 0.001, max: 0.05, step: 0.001, f: v => (v * 100).toFixed(1) + ' %' },
        { k: 'rb', l: 'Tái hợp cơ sở', min: 0.001, max: 0.05, step: 0.001, f: v => (v * 100).toFixed(1) + ' %' },
        { btn: '+60 mV', fn: p => { p.S.VBE = Math.min(0.8, p.S.VBE + 0.06); p.syncCtrls(); p.dirty = true; } },
        { btn: 'Đặt lại', fn: p => { p.S.VBE = 0.65; p.S.r2 = 0.004; p.S.rb = 0.005; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, K = compCalc(S), st = p.st;
        const cx = W * 0.26, cy = H * 0.26, sc = 1.25;
        const legs = drawTO92(ctx, cx, cy, sc, C.main);
        const gy = H * 0.76, gxs = [W * 0.10, W * 0.26, W * 0.42];
        const cur = [K.iE, K.iB, K.iC || K.IC], names = ['i_E', 'i_B', 'i_C'], cols = [C.c2, C.c4, C.c1];
        legs.forEach((lp, i) => {
          const fr = clamp((lg10(cur[i]) + 9) / 8, 0, 1);
          ln(ctx, lp[0], lp[1], gxs[i], gy - 42, cols[i], 2.4);
          pathDots(ctx, [lp, [gxs[i], gy - 42]], 3, 0.3 + fr * 0.9, t, cols[i], 3);
          drawMiniGauge(ctx, gxs[i], gy, 21, names[i], fmtCur(cur[i]), fr, cols[i]);
        });
        const rx = W * 0.60;
        txt(ctx, 'α = ' + K.alpha.toFixed(4), rx, H * 0.22, C.main, 18, 'left', 800);
        txt(ctx, 'β = ' + K.beta.toFixed(1), rx, H * 0.38, C.main, 18, 'left', 800);
        txt(ctx, 'γ = i_E1/i_E = ' + K.gamma.toFixed(4), rx, H * 0.54, C.c4, 11, 'left', 700);
        const up = K.IC * Math.exp(0.06 / VT_300);
        txt(ctx, 'V_BE +60 mV ⇒ i_C ×10', rx, H * 0.68, C.mut, 10.5, 'left', 700);
        txt(ctx, fmtCur(K.IC) + ' → ' + fmtCur(up), rx, H * 0.80, C.ink, 11.5, 'left', 800);
        chip(ctx, 'Mọi thành phần ∝ exp(V_BE/V_t) nên α, β gần như hằng số', W * 0.50, 14, C.main, 'center');
      }
    },
    {
      title: 'Bên trong: dòng emitter = e⁻ phun i_E1 + lỗ trống phun ngược i_E2; dòng cơ sở = i_Ba + i_Bb',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, K = compCalc(S);
        const padX = 14, lblW = 92, rightW = 150, barX = padX + lblW, barW = W - barX - rightW, rowH = Math.min(46, (H - 40) / 3);
        const rows = [
          { lb: 'i_E', parts: [[K.iE1 / K.iE, C.c2], [K.iE2 / K.iE, C.c4]], val: fmtCur(K.iE) + ' (100 %)' },
          { lb: 'i_C', parts: [[K.IC / K.iE, C.main]], val: fmtCur(K.IC) + ' (' + pct(K.IC / K.iE, 1) + ')' },
          { lb: 'i_B', parts: [[K.iBa / K.iE, C.c4], [K.iBb / K.iE, C.c3]], val: fmtCur(K.iB) + ' (' + pct(K.iB / K.iE, 2) + ')' }
        ];
        txt(ctx, 'Thanh dài = i_E; mỗi thanh chia theo nguồn gốc dòng', W / 2, 11, C.mut, 10, 'center', 700);
        rows.forEach((r, i) => {
          const y = 28 + i * (rowH + 4);
          txt(ctx, r.lb, padX, y + rowH / 2, C.ink, 12, 'left', 800);
          rr(ctx, barX, y, barW, rowH - 6, 4); ctx.fillStyle = C.tint; ctx.fill();
          let x = barX;
          r.parts.forEach(pt => {
            const w = Math.max(3, pt[0] * barW);
            rr(ctx, x, y, w, rowH - 6, 4); ctx.fillStyle = pt[1]; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
            rr(ctx, x, y, w, rowH - 6, 4); ctx.strokeStyle = pt[1]; ctx.lineWidth = 1.4; ctx.stroke();
            for (let k = 0; k < 4; k++) dot(ctx, x + 4 + ((t * 70 + k * w / 4) % Math.max(6, w - 8)), y + (rowH - 6) / 2, 2.6, pt[1]);
            x += w;
          });
          txt(ctx, r.val, barX + barW + 8, y + rowH / 2 - 3, i === 1 ? C.main : C.ink, 10.5, 'left', 700);
        });
        const yy = 28 + 3 * (rowH + 4) + 4;
        txt(ctx, 'i_E1 e⁻ phun · i_E2 = i_Ba lỗ trống ngược · i_Bb bù tái hợp trong cơ sở', padX, yy + 4, C.mut, 10, 'left', 600);
        txt(ctx, 'α = i_C/i_E = ' + K.alpha.toFixed(4) + '   β = i_C/i_B = ' + K.beta.toFixed(1) + '   β = α/(1−α)', padX, yy + 24, C.main, 11.5, 'left', 800);
      }
    }
  ]
});

/* ==========================================================================
   3. MỤC 2.3 — ĐƯỜNG TẢI: NGẮT · THUẬN TÍCH CỰC · BÃO HÒA
   ========================================================================== */
LABS.push({
  id: 'mode', tag: '2.3', name: 'Đường tải', sec: 2,
  S: { IB: 20, VCC: 10, RC: 2, beta: 100 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Mạch emitter chung — V_CC, điện trở tải R_C, nguồn dòng cơ sở I_B và cột điện áp V_R + V_CE',
      area: 'a', anim: true,
      ctrls: [
        { k: 'IB', l: 'I_B', min: 0, max: 100, step: 1, f: v => v + ' µA' },
        { k: 'VCC', l: 'V_CC', min: 3, max: 15, step: 0.5, f: v => v.toFixed(1) + ' V' },
        { k: 'RC', l: 'R_C', min: 0.5, max: 5, step: 0.1, f: v => v.toFixed(1) + ' kΩ' },
        { k: 'beta', l: 'β', min: 50, max: 300, step: 10, f: v => v + '' },
        { btn: 'Ngắt', fn: p => { p.S.IB = 0; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Tích cực', fn: p => { p.S.IB = 20; p.S.VCC = 10; p.S.RC = 2; p.S.beta = 100; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Bão hòa', fn: p => { p.S.IB = 60; p.S.VCC = 10; p.S.RC = 2; p.S.beta = 100; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, M = modeCalc(S);
        const batX = W * 0.10, railY = H * 0.17, gndY = H * 0.88, qx = W * 0.47, qy = H * 0.55, r = Math.min(26, H * 0.09);
        const Q = drawNPN(ctx, qx, qy, r, M.k === 'sat' ? C.err : M.k === 'cut' ? C.mut : C.main);
        drawBat(ctx, batX, railY, gndY, C.c4);
        ln(ctx, batX, railY, Q.C[0], railY, C.c1, 2.4);
        drawRes(ctx, Q.C[0], railY, Q.C[0], Q.C[1], C.c1, 2.4);
        ln(ctx, Q.E[0], Q.E[1], Q.E[0], gndY, C.c2, 2.4); ln(ctx, batX, gndY, Q.E[0], gndY, C.c2, 2.4);
        txt(ctx, 'R_C = ' + S.RC.toFixed(1) + ' kΩ', Q.C[0] + 12, (railY + Q.C[1]) / 2, C.c1, 10.5, 'left', 700);
        txt(ctx, 'V_CC', batX + 16, (railY + gndY) / 2 + 14, C.c4, 10.5, 'left', 700);
        const bx0 = W * 0.20, bw0 = 66;
        rr(ctx, bx0, Q.B[1] - 17, bw0, 34, 6); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.c4; ctx.lineWidth = 1.4; ctx.stroke();
        txt(ctx, 'I_B', bx0 + bw0 / 2, Q.B[1] - 5, C.mut, 9, 'center', 700);
        txt(ctx, S.IB + ' µA', bx0 + bw0 / 2, Q.B[1] + 7, C.c4, 11.5, 'center', 800);
        ln(ctx, bx0 + bw0, Q.B[1], Q.B[0], Q.B[1], C.c4, 2.4);
        ln(ctx, bx0 + bw0 / 2, Q.B[1] + 17, bx0 + bw0 / 2, gndY, C.c4, 2); ln(ctx, bx0 + bw0 / 2, gndY, batX, gndY, C.c4, 2);
        const fC = clamp(M.IC / Math.max(1e-9, M.ICmax), 0, 1);
        if (M.IC > 0) pathDots(ctx, [[batX, railY], [Q.C[0], railY], [Q.C[0], gndY], [batX, gndY]], Math.round(3 + fC * 9), 0.12 + fC * 0.5, t, C.c1, 3.6);
        if (M.IBa > 0) pathDots(ctx, [[bx0 + bw0, Q.B[1]], Q.B], 2, 0.3 + S.IB / 100 * 0.6, t, C.c4, 3.2);
        // cột điện áp
        const vx = W * 0.70, vy = H * 0.20, vh = H * 0.62, vw = 34;
        const vr = sm(st, 'vr', M.VR, dt, 0.2), hR = vh * vr / S.VCC;
        rr(ctx, vx, vy, vw, vh, 5); ctx.fillStyle = C.tint; ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = C.c1; ctx.fillRect(vx, vy, vw, hR); ctx.fillStyle = C.c2; ctx.fillRect(vx, vy + hR, vw, vh - hR); ctx.restore();
        rr(ctx, vx, vy, vw, vh, 5); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.4; ctx.stroke();
        txt(ctx, 'V_CC = ' + S.VCC.toFixed(1) + ' V', vx + vw / 2, vy - 10, C.c4, 10.5, 'center', 800);
        txt(ctx, 'V_R = I_C·R_C = ' + M.VR.toFixed(2) + ' V', vx + vw + 8, vy + Math.max(10, hR / 2), C.c1, 10.5, 'left', 700);
        txt(ctx, 'V_CE = ' + M.VCE.toFixed(2) + ' V', vx + vw + 8, vy + hR + (vh - hR) / 2, C.c2, 10.5, 'left', 700);
        const gx = W - 52;
        drawMiniGauge(ctx, gx, H * 0.74, 20, 'I_C', fmtCur(M.IC), fC, M.k === 'sat' ? C.err : C.main, 0.97);
        const lbl = M.k === 'cut' ? 'NGẮT: I_B ≈ 0 ⇒ I_C = 0, V_CE = V_CC' : M.k === 'sat' ? 'BÃO HÒA: β·I_B = ' + fmtCur(M.want) + ' > ' + fmtCur(M.ICmax) + ' — đường tải chặn I_C' : 'THUẬN TÍCH CỰC: I_C = β·I_B';
        chip(ctx, lbl, W * 0.46, 14, M.k === 'sat' ? C.err : M.k === 'cut' ? C.mut : C.main, 'center');
      }
    },
    {
      title: 'Bên trong: điểm làm việc trượt trên đường tải từ ngắt (trái) đến bão hòa (phải) và trạng thái hai tiếp giáp',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, M = modeCalc(S);
        const padX = 18, barX = padX + 6, barW = W - padX * 2 - 12, barY = 30, barH = 18;
        const u = sm(st, 'u', clamp(M.IC / M.ICmax, 0, 1), dt, 0.2);
        txt(ctx, 'ĐƯỜNG TẢI  V_CE = V_CC − I_C·R_C', W / 2, 11, C.mut, 10, 'center', 700);
        rr(ctx, barX, barY, barW, barH, 5); ctx.fillStyle = C.tint; ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = C.c2; ctx.fillRect(barX + barW * 0.02, barY, barW * 0.94, barH);
        ctx.globalAlpha = 0.55; ctx.fillStyle = C.c5; ctx.fillRect(barX + barW * (1 - 0.2 / S.VCC) - 2, barY, barW * 0.2 / S.VCC + 2, barH); ctx.restore();
        rr(ctx, barX, barY, barW, barH, 5); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        const mx = barX + u * barW;
        dot(ctx, mx, barY + barH / 2, 8, M.k === 'sat' ? C.err : C.main);
        txt(ctx, 'Q', mx, barY + barH / 2 + 0.5, C.bg, 9, 'center', 800);
        txt(ctx, 'NGẮT  I_C = 0', barX, barY + barH + 12, C.mut, 9.5, 'left', 700);
        txt(ctx, 'BÃO HÒA  I_C = V_CC/R_C = ' + fmtCur(M.ICmax), barX + barW, barY + barH + 12, C.c5, 9.5, 'right', 700);
        if (M.k === 'sat') txt(ctx, 'β·I_B = ' + fmtCur(M.want) + ' (không thể xảy ra)', mx - 8, barY - 8, C.err, 10, 'right', 700);
        else txt(ctx, 'I_C = ' + fmtCur(M.IC) + ' · V_CE = ' + M.VCE.toFixed(2) + ' V', mx, barY - 8, C.ink, 10.5, 'center', 700);
        const sy = 86, sh = Math.max(50, H - sy - 34);
        const dBC = M.k === 'sat' ? 3 : 22 + 12 * Math.sqrt(M.VCE / S.VCC);
        const G = secFrame(ctx, padX, sy, W - padX * 2 - 150, sh, 0.28, 0.14, { depBEe: 2, depBEb: 3, depBCb: dBC * 0.3, depBCc: dBC * 0.7 });
        const f = clamp(M.IC / M.ICmax, 0, 1), y0 = sy + 22, y1 = sy + sh - 8;
        flowDots(ctx, st, 'e1', Math.round(f * 14), G.x0 + 8, G.x1 - 8, y0, y1, 0.3 + f * 0.8, dt, t, C.c2, '−');
        if (M.k === 'sat') flowDots(ctx, st, 'h1', 6, G.xBC, G.xBC + 70, y0, y1, -0.3, dt, t, C.c4, '+');
        const lx = G.x1 + 10;
        const be = M.k !== 'cut', bc = M.k === 'sat';
        dot(ctx, lx + 5, sy + 14, 5, be ? C.c2 : C.tint); txt(ctx, 'B–E: ' + (be ? 'thuận' : 'không phun'), lx + 14, sy + 14, be ? C.c2 : C.mut, 10, 'left', 700);
        dot(ctx, lx + 5, sy + 36, 5, bc ? C.err : C.c5); txt(ctx, 'B–C: ' + (bc ? 'THUẬN' : 'ngược'), lx + 14, sy + 36, bc ? C.err : C.c5, 10, 'left', 700);
        txt(ctx, M.k === 'sat' ? 'Hai tiếp giáp cùng phun' : 'Vùng nghèo B–C rộng', lx, sy + 62, C.mut, 9.5, 'left', 600);
      }
    }
  ]
});

/* ==========================================================================
   4. MỤC 2.5 — KHUẾCH ĐẠI TÍN HIỆU: SÓNG XOAY CHIỀU CHỒNG LÊN GIÁ TRỊ TĨNH
   ========================================================================== */
const AMP_VCC = 10;
function ampAt(S, ph) {
  const vi = S.vi * 1e-3 * Math.sin(ph), RC = S.RC * 1e3, ICmax = (AMP_VCC - 0.2) / RC;
  const iRaw = IS0 * Math.exp((S.VBEQ + vi) / VT_300), iC = Math.min(iRaw, ICmax);
  return { vi, iC, vce: clamp(AMP_VCC - iC * RC, 0.2, AMP_VCC), ICmax, sat: iRaw >= ICmax };
}
LABS.push({
  id: 'amp', tag: '2.5', name: 'Khuếch đại', sec: 2,
  S: { VBEQ: 0.65, vi: 10, RC: 4 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Mạch emitter chung + 3 đồng hồ kim — tín hiệu nhỏ v_i điều khiển i_C và v_o lớn, đảo pha',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VBEQ', l: 'V_BE tĩnh', min: 0.55, max: 0.72, step: 0.005, f: v => v.toFixed(3) + ' V' },
        { k: 'vi', l: 'Biên độ v_i', min: 1, max: 40, step: 1, f: v => v + ' mV' },
        { k: 'RC', l: 'R_C', min: 1, max: 5, step: 0.1, f: v => v.toFixed(1) + ' kΩ' },
        { btn: 'Điểm Q đẹp', fn: p => { p.S.VBEQ = 0.65; p.S.vi = 10; p.S.RC = 4; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Quá kích', fn: p => { p.S.VBEQ = 0.70; p.S.vi = 30; p.S.RC = 4; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, sx = 14, sy = 26, sw = W * 0.70, sh = Math.min(H - 40, 230);
        rr(ctx, sx, sy - 14, sw, sh + 22, 10); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.6; ctx.stroke();
        txt(ctx, 'BA ĐỒNG HỒ KIM TỨC THỜI (V_CC = ' + AMP_VCC + ' V)', sx + sw / 2, sy - 4, C.mut, 10, 'center', 700);
        let clip = false, vmin = 1e9, vmax = -1e9;
        for (let i = 0; i <= 80; i++) {
          const A = ampAt(S, i / 80 * TAU2 * 2);
          vmin = Math.min(vmin, A.vce); vmax = Math.max(vmax, A.vce); if (A.sat) clip = true;
        }
        const Ai = ampAt(S, -t * 3), gy = sy + sh * 0.58, gr = Math.min(30, sh * 0.3);
        const fr = [clamp(0.5 + Ai.vi / 0.040 * 0.45, 0, 1), clamp(Ai.iC / Ai.ICmax, 0, 1), clamp(Ai.vce / AMP_VCC, 0, 1)];
        drawMiniGauge(ctx, sx + sw * 0.17, gy, gr, 'v_i', (Ai.vi * 1e3).toFixed(1) + ' mV', fr[0], C.c1);
        drawMiniGauge(ctx, sx + sw * 0.50, gy, gr, 'i_C', fmtCur(Ai.iC), fr[1], C.main);
        drawMiniGauge(ctx, sx + sw * 0.83, gy, gr, 'v_o = V_CE', Ai.vce.toFixed(2) + ' V', fr[2], C.c2, Ai.sat ? 0.9 : null);
        const A0 = ampAt(S, 0), IQ = IS0 * Math.exp(S.VBEQ / VT_300), gm = IQ / VT_300, Av = gm * S.RC * 1e3;
        const rx = sx + sw + 12;
        txt(ctx, 'I_CQ = ' + fmtCur(IQ), rx, H * 0.18, C.main, 11, 'left', 800);
        txt(ctx, 'g_m = ' + (gm * 1e3).toFixed(1) + ' mS', rx, H * 0.32, C.ink, 11, 'left', 700);
        txt(ctx, 'A_v ≈ −g_m·R_C', rx, H * 0.46, C.mut, 10, 'left', 700);
        txt(ctx, '= −' + Av.toFixed(0), rx, H * 0.58, C.c2, 14, 'left', 800);
        txt(ctx, 'Đo: ×' + ((vmax - vmin) / (2 * S.vi * 1e-3)).toFixed(0), rx, H * 0.72, clip ? C.err : C.c2, 11, 'left', 700);
        chip(ctx, clip ? 'MÉO: transistor chạm bão hòa, đỉnh v_o bị cắt' : 'Không méo: i_C bám theo v_i, v_o ngược pha', W * 0.40, 12, clip ? C.err : C.main, 'center');
        void A0;
      }
    },
    {
      title: 'Bên trong: mật độ electron phun theo nhịp v_BE và ba cột đo tức thời v_BE · i_C · v_CE',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, A = ampAt(S, -t * 3);
        const padX = 16, rightW = 170, topY = 10, botY = H - 10, bw = W - padX - rightW, bh = botY - topY;
        const G = secFrame(ctx, padX, topY, bw, bh, 0.30, 0.14, { depBEe: 2, depBEb: 3 + 2 * Math.max(0, A.vi / 0.04), depBCb: 4, depBCc: 12 });
        const f = clamp(A.iC / A.ICmax, 0, 1), y0 = topY + 22, y1 = botY - 8;
        flowDots(ctx, st, 'e', Math.round(2 + f * 24), G.x0 + 8, G.x1 - 8, y0, y1, 0.2 + f * 1.1, dt, t, C.c2, '−');
        const cx0 = padX + bw + 18, colH = bh * 0.70, cw = 20, cy1 = botY - 22;
        const bars = [
          { lb: 'v_BE', v: 0.5 + A.vi / 0.08, col: C.c1, txtv: 'V_BE ' + (S.VBEQ + A.vi).toFixed(3) },
          { lb: 'i_C', v: f, col: C.main, txtv: fmtCur(A.iC) },
          { lb: 'v_CE', v: A.vce / AMP_VCC, col: C.c2, txtv: A.vce.toFixed(2) + ' V' }
        ];
        bars.forEach((b, i) => {
          const x = cx0 + i * 50, lv = sm(st, 'b' + i, clamp(b.v, 0, 1), dt, 0.06);
          rr(ctx, x, cy1 - colH, cw, colH, 4); ctx.fillStyle = C.tint; ctx.fill();
          rr(ctx, x, cy1 - colH * lv, cw, colH * lv, 4); ctx.fillStyle = b.col; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;
          rr(ctx, x, cy1 - colH, cw, colH, 4); ctx.strokeStyle = b.col; ctx.lineWidth = 1.3; ctx.stroke();
          txt(ctx, b.lb, x + cw / 2, cy1 + 10, b.col, 10, 'center', 700);
          txt(ctx, b.txtv, x + cw / 2, cy1 - colH - 8, b.col, 8.5, 'center', 700);
        });
      }
    }
  ]
});

/* ==========================================================================
   5. MỤC 3.5 — HỆ SỐ γ · α_T · δ ⇒ α, β
   ========================================================================== */
LABS.push({
  id: 'gain', tag: '3.5', name: 'γ·α_T·δ', sec: 3,
  S: { NE: 3.02e17, NB: 1e15, xB: 0.8, LB: 10, VBE: 0.60 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Dòng emitter "rò" ở 3 chỗ — lỗ trống phun ngược (1−γ), tái hợp cơ sở (1−α_T), tái hợp vùng nghèo (1−δ)',
      area: 'a', anim: true,
      ctrls: [
        { k: 'NE', l: 'Nₑ', min: 16, max: 20, step: 0.05, log: 1, f: v => pw(v) },
        { k: 'NB', l: 'N_B', min: 14, max: 17, step: 0.05, log: 1, f: v => pw(v) },
        { k: 'xB', l: 'x_B', min: -1, max: 0.6, step: 0.02, log: 1, f: fmtUm },
        { k: 'LB', l: 'L_B', min: 2, max: 30, step: 1, f: v => v + ' µm' },
        { k: 'VBE', l: 'V_BE', min: 0.30, max: 0.80, step: 0.01, f: v => v.toFixed(2) + ' V' },
        { btn: 'Ví dụ 3.1', fn: p => { p.S.NE = 3.02e17; p.S.NB = 1e15; p.S.xB = 0.8; p.S.LB = 10; p.S.VBE = 0.80; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, K = gainCalc(S), st = p.st;
        const bw = Math.min(300, W * 0.48), bd = Math.min(130, H * 0.36), h = Math.min(80, H * 0.26);
        const fB = fBof(S.xB), fE = 0.34, ox = W * 0.20, oy = H * 0.78;
        const G = bjt3D(ctx, ox, oy, { bw, bd, h, fE, fB, depBEe: 2, depBEb: 3, depBCb: 3, depBCc: 8, noPads: true });
        const aw = l => 1.8 + clamp(l * 160, 0, 6);
        const pE = isoP(ox, oy, G.wE * 0.5, bd * 0.5, h + 8), pC = isoP(ox, oy, G.wE + G.wB + G.wC * 0.5, bd * 0.5, h + 8);
        const pB = isoP(ox, oy, G.wE + G.wB * 0.5, bd * 0.5, h + 8);
        arr(ctx, pE[0], pE[1] - 14, pC[0], pC[1] - 14, C.main, 3 + K.alpha * 2);
        txt(ctx, 'α·I_E → collector', (pE[0] + pC[0]) / 2, pC[1] - 28, C.main, 10.5, 'center', 800);
        arr(ctx, pB[0] - 4, pB[1] - 4, pE[0] + 8, pE[1] - 4, C.c4, aw(K.l1));
        txt(ctx, '1−γ = ' + pct(K.l1, 2), (pB[0] + pE[0]) / 2, pE[1] + 10, C.c4, 9.5, 'center', 700);
        const pD = isoP(ox, oy, G.wE + G.wB * 0.5, bd, h * 0.4);
        arr(ctx, pD[0], pD[1] - 8, pD[0], pD[1] + 26, C.c3, aw(K.l2));
        txt(ctx, '1−α_T', pD[0] + 6, pD[1] + 36, C.c3, 9.5, 'left', 700);
        const pS = isoP(ox, oy, G.wE, bd, h * 0.3);
        arr(ctx, pS[0] - 4, pS[1] - 4, pS[0] - 30, pS[1] + 24, C.c5, aw(K.l3));
        txt(ctx, '1−δ', pS[0] - 32, pS[1] + 34, C.c5, 9.5, 'right', 700);
        flowDots(ctx, st, 'f', 8, pE[0], pC[0], pE[1] - 18, pE[1] - 10, 0.5, dt, t, C.c2, '');
        const gx = W - 58, mp = x => clamp((x - 0.9) / 0.1, 0, 1);
        drawMiniGauge(ctx, gx, H * 0.20, 19, 'γ', K.gamma.toFixed(4), mp(K.gamma), C.c4);
        drawMiniGauge(ctx, gx, H * 0.50, 19, 'α_T', K.aT.toFixed(4), mp(K.aT), C.c3);
        drawMiniGauge(ctx, gx, H * 0.80, 19, 'δ', K.delta.toFixed(4), mp(K.delta), C.c5);
        chip(ctx, 'α = γ·α_T·δ = ' + K.alpha.toFixed(4) + '   ⇒   β = ' + K.beta.toFixed(0), W * 0.42, 14, C.main, 'center');
      }
    },
    {
      title: 'Bên trong: dòng emitter chảy trong ống — hạt rò ở ba chỗ (γ, α_T, δ), hạt sống sót thành dòng collector',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, K = gainCalc(S), st = p.st;
        const padX = 16, tx = padX, tw = W - padX * 2 - 100, ty = 30, th = 34;
        const loss = K.l1 + K.l2 + K.l3, vs = Math.min(80, 0.55 / Math.max(loss, 1e-9));
        const stU = [0.25, 0.5, 0.75], cols = [C.c4, C.c3, C.c5], nms = ['γ', 'α_T', 'δ'];
        txt(ctx, 'Ống dòng emitter — mỗi hạt electron phun vào bên trái; chỗ rò rơi xuống (phóng ×' + vs.toFixed(0) + ' để thấy)', padX, 14, C.mut, 10, 'left', 700);
        rr(ctx, tx, ty, tw, th, 6); ctx.fillStyle = C.tint; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        stU.forEach((u, i) => { ln(ctx, tx + u * tw, ty - 4, tx + u * tw, ty + th + 4, cols[i], 2); txt(ctx, nms[i], tx + u * tw, ty + th + 14, cols[i], 10.5, 'center', 800); });
        if (!st.pp) st.pp = Array.from({ length: 44 }, (_, i) => ({ u: i / 44, v: Math.random(), f: -1, d: 0 }));
        const roll = () => { const r = Math.random(), a = K.l1 * vs, b = a + K.l2 * vs, c = b + K.l3 * vs; return r < a ? 0 : r < b ? 1 : r < c ? 2 : -1; };
        st.pp.forEach(q => {
          if (q.u === undefined) return;
          q.u += 0.32 * dt;
          if (q.f >= 0 && q.u >= stU[q.f]) { q.u = stU[q.f]; q.d += 70 * dt; if (q.d > 46) { q.u = 0; q.d = 0; q.v = Math.random(); q.f = roll(); } }
          else if (q.u > 1) { q.u = 0; q.v = Math.random(); q.f = roll(); }
          const al = q.f >= 0 && q.d > 0 ? Math.max(0, 1 - q.d / 46) : 1;
          ctx.save(); ctx.globalAlpha = al;
          dot(ctx, tx + 6 + q.u * (tw - 12), ty + 6 + q.v * (th - 12) + q.d, 3.6, q.f >= 0 && q.d > 0 ? cols[q.f] : C.c2);
          ctx.restore();
        });
        txt(ctx, 'β = ' + K.beta.toFixed(0), W - 14, ty + th / 2, C.main, 20, 'right', 800);
        txt(ctx, 'α = ' + K.alpha.toFixed(4) + ' · mất tổng cộng (1−α) = ' + pct(loss, 3), padX, ty + th + 56, C.ink, 11, 'left', 800);
        const y2 = ty + th + 60;
        const lines = [
          ['1) γ = ' + K.gamma.toFixed(4) + ' · mất ' + pct(K.l1, 2) + ' — pha emitter nặng hơn cơ sở để γ → 1', C.c4],
          ['2) α_T = ' + K.aT.toFixed(4) + ' · mất ' + pct(K.l2, 2) + ' — cơ sở mỏng so với L_B', C.c3],
          ['3) δ = ' + K.delta.toFixed(4) + ' · mất ' + pct(K.l3, 2) + ' — nặng nhất ở dòng nhỏ (V_BE thấp)', C.c5]
        ];
        lines.forEach((l, i) => txt(ctx, l[0], padX, y2 + 14 + i * Math.min(22, (H - y2 - 26) / 3), l[1], 10.5, 'left', 700));
      }
    }
  ]
});

/* ==========================================================================
   6. MỤC 4.2 — HIỆU ỨNG EARLY
   ========================================================================== */
LABS.push({
  id: 'early', tag: '4.2', name: 'Hiệu ứng Early', sec: 4,
  S: { VCB: 4, xB0: 1.0, NB: 1e16 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: V_CB ngược tăng — vùng nghèo B–C lấn vào cơ sở, x_B co lại, dòng khuếch tán tăng',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VCB', l: 'V_CB', min: 0, max: 20, step: 0.5, f: v => v.toFixed(1) + ' V' },
        { k: 'xB0', l: 'x_B0', min: 0.4, max: 2, step: 0.05, f: v => v.toFixed(2) + ' µm' },
        { k: 'NB', l: 'N_B', min: 15.5, max: 17.5, step: 0.05, log: 1, f: v => pw(v) },
        { btn: 'Cơ sở mỏng', fn: p => { p.S.xB0 = 0.5; p.S.NB = 1e16; p.syncCtrls(); p.dirty = true; } },
        { btn: 'V_A lớn', fn: p => { p.S.xB0 = 1.5; p.S.NB = 1e17; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, E = earlyCalc(S);
        const bw = Math.min(320, W * 0.50), bd = Math.min(140, H * 0.38), h = Math.min(88, H * 0.28);
        const fB = 0.26, fE = 0.30, ox = W * 0.22, oy = H * 0.78, wB = bw * fB;
        const dpx = sm(st, 'dpx', clamp(E.xd / S.xB0, 0, 1) * wB * 3.2, dt, 0.2);
        const G = bjt3D(ctx, ox, oy, { bw, bd, h, fE, fB, depBEe: 2, depBEb: 3, depBCb: Math.min(dpx, wB * 0.92), depBCc: 6 + dpx * 0.4 });
        const nB = 1 - Math.min(dpx, wB * 0.92) / wB, sp = 0.3 * E.boost;
        for (let k = 0; k < 8; k++) {
          const u = (t * sp + k / 8) % 1, pt = isoP(ox, oy, 6 + u * (bw - 12), bd * (0.25 + (k % 3) * 0.25), h - 3);
          dot(ctx, pt[0], pt[1], 3.8, C.c2);
        }
        const lb = isoP(ox, oy, G.wE + wB * 0.5, 0, h + 14);
        txt(ctx, 'x_B = ' + fmtUm(E.xB), lb[0], lb[1], C.c4, 11, 'center', 800);
        const gx = W - 62;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'x_B / x_B0', Math.round(E.xB / E.xB0r * 100) + '%', E.xB / E.xB0r, C.c4, undefined);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'r_o', fmtOhm(E.ro), clamp(lg10(E.ro) / 6.5, 0, 1), C.main);
        chip(ctx, E.xB < 0.15 ? 'Cơ sở gần cạn: sắp xuyên thấu!' : 'V_CB ↑ ⇒ x_B ↓ ⇒ gradient ↑ ⇒ I_C ×' + E.boost.toFixed(3), W * 0.44, 15, E.xB < 0.15 ? C.err : C.main, 'center');
      }
    },
    {
      title: 'Bên trong (E → B → C): thước đo bề rộng cơ sở trung hòa và thước điện áp từ −V_A đến V_CE',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, E = earlyCalc(S);
        const padX = 16, topY = 10, secH = H * 0.56, bw = W - padX * 2;
        const wBpx = bw * 0.26, dpx = sm(st, 'dp', clamp(E.xd / S.xB0, 0, 1) * wBpx * 3.2, dt, 0.2);
        const G = secFrame(ctx, padX, topY, bw, secH, 0.30, 0.26, { depBEe: 2, depBEb: 3, depBCb: Math.min(dpx, wBpx * 0.92), depBCc: 8 + dpx * 0.4 });
        const xn0 = G.xBE, xn1 = G.xBC - Math.min(dpx, wBpx * 0.92), yy = topY + secH - 14;
        arr(ctx, xn0, yy, xn1, yy, C.c4, 2); arr(ctx, xn1, yy, xn0, yy, C.c4, 2);
        txt(ctx, 'x_B = ' + fmtUm(E.xB), (xn0 + xn1) / 2, yy - 10, C.c4, 10.5, 'center', 800);
        flowDots(ctx, st, 'e', 16, G.x0 + 8, G.x1 - 8, topY + 22, topY + secH - 26, 0.3 * E.boost, dt, t, C.c2, '−');
        const ry = topY + secH + 34, rx0 = padX + 20, rw = bw - 40;
        const span = E.VA + (S.VCB + 0.65), tot = isFinite(span) ? span : 300, vm = x => rx0 + (x + E.VA) / tot * rw;
        ln(ctx, rx0, ry, rx0 + rw, ry, C.sub, 2.4);
        dot(ctx, rx0, ry, 5, C.c5); dot(ctx, vm(0), ry, 4, C.mut); dot(ctx, vm(S.VCB + 0.65), ry, 6, C.main);
        txt(ctx, '−V_A = −' + (isFinite(E.VA) ? E.VA.toFixed(0) : '∞') + ' V', rx0, ry + 15, C.c5, 10, 'left', 700);
        txt(ctx, '0', vm(0), ry + 15, C.mut, 10, 'center', 600);
        txt(ctx, 'V_CE = ' + (S.VCB + 0.65).toFixed(2) + ' V', rx0 + rw, ry + 15, C.main, 10, 'right', 700);
        txt(ctx, 'I_C = ' + fmtCur(E.IC) + '   g_o = ' + (E.go * 1e6).toFixed(1) + ' µS   r_o = ' + fmtOhm(E.ro), W / 2, ry - 16, C.ink, 10.5, 'center', 700);
      }
    }
  ]
});

/* ==========================================================================
   7. MỤC 4.5 — HẸP VÙNG CẤM Ở EMITTER & PHUN MỨC CAO
   ========================================================================== */
LABS.push({
  id: 'hl', tag: '4.5', name: 'Mức cao & ΔE_g', sec: 4,
  S: { bgn: 'on', NE: 1e19, NB: 1e16, VBE: 0.60 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Tinh thể emitter pha tạp nặng — donor chen chúc, electron chạm nhau, vùng cấm hẹp lại ΔE_g',
      area: 'a', anim: true,
      ctrls: [
        { k: 'bgn', seg: [['on', 'Hẹp vùng cấm: BẬT'], ['off', 'TẮT']] },
        { k: 'NE', l: 'Nₑ', min: 17, max: 20, step: 0.05, log: 1, f: v => pw(v) },
        { k: 'NB', l: 'N_B', min: 15, max: 18, step: 0.05, log: 1, f: v => pw(v) },
        { k: 'VBE', l: 'V_BE', min: 0.50, max: 0.85, step: 0.01, f: v => v.toFixed(2) + ' V' }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, K = hlCalc(S);
        const hv = clamp(Math.log(S.NE / 1e17) / 6.9, 0, 1), bw = W * 0.33, bh = H * 0.60, by = H * 0.22, bx1 = W * 0.04, bx2 = bx1 + bw + W * 0.06;
        const crystal = (bx, heavy, title, col) => {
          rr(ctx, bx, by, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke();
          txt(ctx, title, bx + bw / 2, by - 12, col, 10.5, 'center', 800);
          for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) {
            ctx.beginPath(); ctx.arc(bx + bw * (0.1 + 0.8 * i / 6), by + bh * (0.12 + 0.76 * j / 4), 4.5, 0, TAU2); ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
          }
          const nd = heavy ? 3 + Math.round(15 * hv) : 3;
          for (let k = 0; k < nd; k++) {
            const x = bx + bw * (0.08 + 0.84 * ((k * 0.618 + 0.11) % 1)), y = by + bh * (0.1 + 0.8 * ((k * 0.382 + 0.27) % 1));
            dot(ctx, x, y, 4.2, C.c5);
            const ex = x + Math.cos(t * 2.4 + k * 1.7) * (heavy ? 9 : 5), ey = y + Math.sin(t * 2.9 + k) * (heavy ? 9 : 5);
            dot(ctx, ex, ey, 3.4, C.c2); txt(ctx, '−', ex, ey + 0.5, C.bg, 7.5, 'center', 800);
          }
          txt(ctx, heavy ? nd + ' donor chen chúc' : '3 donor thưa', bx + bw / 2, by + bh + 14, C.c5, 10, 'center', 700);
        };
        crystal(bx1, false, 'Pha tạp thường · E_g = 1,12 eV', C.mut);
        crystal(bx2, true, 'Emitter pha tạp nặng · E_g − ' + (K.dEg * 1000).toFixed(0) + ' meV', C.c2);
        const gx = W - 62;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'ΔE_g', (K.dEg * 1000).toFixed(0) + ' meV', clamp(K.dEg / 0.15, 0, 1), C.c2);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'γ', K.gamma.toFixed(4), clamp((K.gamma - 0.9) / 0.1, 0, 1), C.c4);
        chip(ctx, 'p′_E0 = (nᵢ²/Nₑ)·e^(ΔE_g/kT)  ⇒  ×' + K.fac.toFixed(1) + ' dòng lỗ trống phun ngược', W * 0.46, 14, K.fac > 5 ? C.err : C.main, 'center');
        void dt; void st;
      }
    },
    {
      title: 'Bên trong: mức phun — electron phun n_B(0) vượt dần N_B; vượt rồi, e⁻ phun chỉ còn tăng theo e^(V/2kT) và β tụt',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, K = hlCalc(S);
        const padX = 16, topY = 14, botY = H - 22, th = botY - topY;
        const bx = padX, bw = W - bx - 160, by = topY + 6, bh = th * 0.64;
        rr(ctx, bx, by, bw, bh, 6); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.2; ctx.stroke();
        txt(ctx, 'Hạt trong cơ sở (nhìn gần)', bx + bw / 2, by + 10, C.mut, 9.5, 'center', 700);
        const ne = clamp(Math.round(2 + 18 * Math.min(K.r, 1.4)), 2, 28), nh = clamp(14 + Math.round(12 * Math.max(0, K.r - 1)), 14, 30);
        for (let i = 0; i < nh; i++) {
          const x = bx + 12 + ((i * 0.618) % 1) * (bw - 24) + Math.sin(t * 3 + i) * 2, y = by + 22 + ((i * 0.37) % 1) * (bh - 32) + Math.cos(t * 3.3 + i) * 2;
          dot(ctx, x, y, 3.6, C.c4); txt(ctx, '+', x, y + 0.5, C.bg, 7.5, 'center', 800);
        }
        for (let i = 0; i < ne; i++) {
          const x = bx + 12 + ((i * 0.381 + 0.17) % 1) * (bw - 24) + Math.sin(t * 4 + i * 1.3) * 2.5, y = by + 22 + ((i * 0.71 + 0.3) % 1) * (bh - 32) + Math.cos(t * 3.7 + i) * 2.5;
          dot(ctx, x, y, 3.8, C.c2); txt(ctx, '−', x, y + 0.5, C.bg, 8, 'center', 800);
        }
        const lx = W - 150, over = K.r > 1;
        txt(ctx, 'n_B(0)/N_B = ' + K.r.toFixed(K.r < 0.1 ? 3 : 2), lx, topY + th * 0.14, C.c2, 10.5, 'left', 700);
        txt(ctx, 'Quy luật phun:', lx, topY + th * 0.34, C.mut, 10, 'left', 700);
        txt(ctx, over ? 'e^(V/2kT)  (½)' : 'e^(V/kT)  (1×)', lx, topY + th * 0.48, over ? C.err : C.main, 11.5, 'left', 800);
        txt(ctx, 'β = ' + K.beta.toFixed(0), lx, topY + th * 0.68, over ? C.err : C.main, 16, 'left', 800);
        txt(ctx, 'V_BE ngưỡng ≈ ' + K.VK.toFixed(2) + ' V', lx, topY + th * 0.86, C.mut, 9.5, 'left', 600);
      }
    }
  ]
});

/* ==========================================================================
   8. MỤC 4.7 — DỒN DÒNG Ở EMITTER
   ========================================================================== */
LABS.push({
  id: 'crowd', tag: '4.7', name: 'Dồn dòng', sec: 4,
  S: { wE: 20, Rsb: 10000, I: 30, nf: 1 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Mặt emitter nhìn từ trên — dòng phun dồn ra hai mép (đỏ = mật độ dòng cao, nóng cục bộ)',
      area: 'a', anim: true,
      ctrls: [
        { k: 'wE', l: 'Rộng emitter', min: 4, max: 40, step: 2, f: v => v + ' µm' },
        { k: 'Rsb', l: 'R_sb', min: 2000, max: 20000, step: 1000, f: v => (v / 1000) + ' kΩ/□' },
        { k: 'I', l: 'Dòng tổng', min: 0, max: 2.5, step: 0.05, log: 1, f: v => v.toFixed(v < 10 ? 1 : 0) + ' mA' },
        { k: 'nf', seg: [[1, '1 ngón'], [2, '2 ngón'], [4, '4 ngón']] }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, K = crowdSolve(S);
        const bw = Math.min(330, W * 0.52), bd = Math.min(130, H * 0.36), h = Math.min(70, H * 0.22), ox = W * 0.22, oy = H * 0.78;
        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, h, C.card, 1, C.sub);
        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, h, C.c4, 0.22, C.c4);
        const nf = S.nf, fw = bw * 0.72 / nf, gap = (bw - fw * nf) / (nf + 1), Ns = 12;
        for (let f = 0; f < nf; f++) {
          const x0 = gap + f * (fw + gap);
          for (let j = 0; j < Ns; j++) {
            const s = Math.abs((j + 0.5) / Ns * 2 - 1), idx = Math.round((1 - s) * K.N);
            const jn = K.J[clamp(idx, 0, K.N)];
            isoBox(ctx, ox, oy, x0 + j * fw / Ns, bd * 0.1, h, fw / Ns, bd * 0.8, 8, jn > 0.7 ? C.err : C.c2, 0.18 + 0.78 * jn, jn > 0.7 ? C.err : C.c2);
          }
        }
        for (let f = 0; f <= nf; f++) isoBox(ctx, ox, oy, f * (fw + gap) + gap * 0.1, bd * 0.1, h, Math.max(4, gap * 0.8), bd * 0.8, 5, C.c4, 0.9, C.ink);
        const lb = isoP(ox, oy, bw * 0.5, 0, h + 22);
        txt(ctx, nf + ' ngón · mỗi ngón ' + (S.wE / nf).toFixed(1) + ' µm', lb[0], lb[1], C.c2, 10.5, 'center', 700);
        const gx = W - 62;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'J_mép / J_giữa', '×' + (K.ratio < 100 ? K.ratio.toFixed(1) : K.ratio.toExponential(0)), clamp(lg10(K.ratio) / 3, 0, 1), C.c2, 0.45);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'ΔV mép–giữa', (K.dV * 1000).toFixed(0) + ' mV', clamp(K.dV / 0.3, 0, 1), C.c5, 0.5);
        chip(ctx, K.ratio > 3 ? 'DỒN DÒNG: chỉ ' + Math.round(clamp(K.dep / K.Sx, 0, 1) * 100) + '% bề rộng mỗi bên còn phun mạnh' : 'Dòng gần đều dưới emitter', W * 0.44, 14, K.ratio > 3 ? C.err : C.c2, 'center');
        void st; void dt; void t;
      }
    },
    {
      title: 'Bên trong (mặt cắt ngang một ngón): điện áp rơi ngang trên R_sb ⇒ mép phun mạnh hơn giữa',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, K = crowdSolve(S);
        const padX = 16, topY = 18, bw = W - padX * 2, eY = topY + 6, eH = 18, bH = H * 0.30, cX0 = padX + bw * 0.2, cX1 = padX + bw * 0.8;
        rr(ctx, padX, eY + eH, bw, bH + 24, 6); ctx.fillStyle = C.c4; ctx.globalAlpha = 0.16; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = C.sub; ctx.lineWidth = 1.2; ctx.stroke();
        rr(ctx, cX0, eY, cX1 - cX0, eH, 4); ctx.fillStyle = C.c2; ctx.globalAlpha = 0.4; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = C.c2; ctx.lineWidth = 1.3; ctx.stroke();
        txt(ctx, 'Emitter n⁺⁺ (đẳng thế)', (cX0 + cX1) / 2, eY + eH / 2, C.c2, 9.5, 'center', 700);
        const Nn = 20, aMax = bH + 6;
        for (let i = 0; i < Nn; i++) {
          const u = (i + 0.5) / Nn, s = Math.abs(u * 2 - 1), idx = Math.round((1 - s) * K.N), jn = K.J[clamp(idx, 0, K.N)];
          const x = cX0 + u * (cX1 - cX0), ln0 = 4 + jn * aMax * 0.9, sl = sm(st, 'a' + i, ln0, dt, 0.15);
          arr(ctx, x, eY + eH + 1, x, eY + eH + 1 + sl, jn > 0.7 ? C.err : C.c2, 2);
        }
        const yb = eY + eH + bH + 14;
        rr(ctx, padX - 6, yb - 8, 22, 16, 3); ctx.fillStyle = C.c1; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
        rr(ctx, padX + bw - 16, yb - 8, 22, 16, 3); ctx.fillStyle = C.c1; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
        txt(ctx, 'B', padX + 5, yb, C.bg, 9.5, 'center', 800); txt(ctx, 'B', padX + bw - 5, yb, C.bg, 9.5, 'center', 800);
        drawRes(ctx, padX + 16, yb, cX0, yb, C.c3, 2); drawRes(ctx, cX1, yb, padX + bw - 16, yb, C.c3, 2);
        txt(ctx, 'R_b (điện trở cơ sở)', (cX0 + cX1) / 2, yb + 16, C.c3, 10, 'center', 700);
        pathDots(ctx, [[padX + 5, yb], [cX0, yb]], 3, 0.3, t, C.c4, 3); pathDots(ctx, [[padX + bw - 5, yb], [cX1, yb]], 3, 0.3, t, C.c4, 3);
        txt(ctx, 'J_mép = ×' + (K.ratio < 100 ? K.ratio.toFixed(1) : K.ratio.toExponential(0)) + ' J_giữa  ·  ΔV = ' + (K.dV * 1000).toFixed(0) + ' mV  ·  thâm nhập ≈ ' + (K.dep).toFixed(1) + ' µm',
          W / 2, H - 12, K.ratio > 3 ? C.err : C.ink, 10.5, 'center', 700);
      }
    }
  ]
});

/* ==========================================================================
   9. MỤC 4.10 — ĐÁNH THỦNG XUYÊN THẤU & DÒNG I_CEO
   ========================================================================== */
LABS.push({
  id: 'brk', tag: '4.10', name: 'Đánh thủng', sec: 4,
  S: { mode: 'pt', VCB: 30, xBO: 0.8, NB: 1e16, beta: 100 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: V_CB ngược tăng — vùng nghèo B–C lấn xuyên cơ sở (xuyên thấu) hoặc cơ sở hở khuếch đại I_CBO thành I_CEO',
      area: 'a', anim: true,
      ctrls: [
        { k: 'mode', seg: [['pt', 'Xuyên thấu'], ['ceo', 'I_CEO (B hở)']], set: { pt: { VCB: 30 }, ceo: { VCB: 20 } } },
        { k: 'VCB', l: 'V_CB', min: 0, max: 120, step: 1, f: v => v + ' V' },
        { k: 'xBO', l: 'x_BO', min: 0.4, max: 2, step: 0.05, f: v => v.toFixed(2) + ' µm' },
        { k: 'NB', l: 'N_B', min: 15.5, max: 17.5, step: 0.05, log: 1, f: v => pw(v) },
        { k: 'beta', l: 'β', min: 20, max: 300, step: 10, f: v => v + '' }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, B = brkCalc(S), pt = S.mode === 'pt';
        const bw = Math.min(320, W * 0.50), bd = Math.min(140, H * 0.38), h = Math.min(88, H * 0.28), fB = 0.26, fE = 0.30, ox = W * 0.22, oy = H * 0.78, wB = bw * fB;
        const dpx = sm(st, 'd', clamp(B.xd / S.xBO, 0, 1.05) * wB, dt, 0.2);
        const G = bjt3D(ctx, ox, oy, { bw, bd, h, fE, fB, depBEe: 2, depBEb: 4, depBCb: Math.min(dpx, wB * 0.96), depBCc: 8 + dpx * 0.3, depCol: B.touch && pt ? C.err : C.c5, noPads: !pt });
        if (pt) {
          drawProbe(ctx, G.E[0], G.E[1], -1, C.c2, 'E · 0 V'); drawProbe(ctx, G.C[0], G.C[1], 1, C.c1, 'C · +' + S.VCB + ' V');
        } else {
          const pb = isoP(ox, oy, G.wE + G.wB * 0.5, bd * 0.5, h + 6);
          ctx.beginPath(); ctx.arc(pb[0], pb[1] - 10, 7, 0, TAU2); ctx.strokeStyle = C.c4; ctx.lineWidth = 2; ctx.stroke();
          txt(ctx, 'B hở', pb[0], pb[1] - 26, C.c4, 10, 'center', 800);
          for (let k = 0; k < 5; k++) { const u = (t * 0.4 + k / 5) % 1, q = isoP(ox, oy, G.wE + G.wB + G.wC * (1 - u * 0.9), bd * 0.5, h - 4); dot(ctx, q[0], q[1], 3.8, C.c4); }
        }
        const gx = W - 62, I = pt ? B.Ipt : B.ICEO;
        drawMiniGauge(ctx, gx, H * 0.30, 22, pt ? 'Dòng I_C' : 'I_CEO', fmtCur(I), clamp((lg10(I) + 9) / 8, 0, 1), C.main, 0.8);
        drawMiniGauge(ctx, gx, H * 0.72, 22, pt ? 'V_pt' : 'I_CBO', pt ? B.Vpt.toFixed(0) + ' V' : fmtCur(B.ICBO), pt ? clamp(S.VCB / B.Vpt, 0, 1) : clamp((lg10(B.ICBO) + 9.5) / 3, 0, 1), C.c5, pt ? 0.99 : undefined);
        const msg = pt ? (B.touch ? 'XUYÊN THẤU: vùng nghèo chạm B–E, hàng rào hạ — dòng vọt!' : 'x_d = ' + fmtUm(B.xd) + ' < x_BO: cơ sở còn trung hòa') : 'I_CEO = I_CBO/(1−α) ≈ β·I_CBO = ' + fmtCur(B.ICEO);
        chip(ctx, msg, W * 0.44, 15, pt && B.touch ? C.err : C.main, 'center');
      }
    },
    {
      title: 'Bên trong: vùng nghèo B–C phình dần vào cơ sở tới khi xuyên thấu — hoặc lỗ trống ngược làm B–E phun e⁻ (×β)',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, B = brkCalc(S), pt = S.mode === 'pt';
        const padX = 16, topY = 12, bw = W - padX * 2, bh = H - 24;
        if (pt) {
          const r = sm(st, 'rx', clamp(B.xd / S.xBO, 0, 1), dt, 0.2), wBp = bw * 0.30;
          const G = secFrame(ctx, padX, topY, bw, bh * 0.70, 0.28, 0.30, { depBEe: 2, depBEb: 3, depBCb: Math.max(6, r * wBp), depBCc: 14, depCol: r > 0.98 ? C.err : C.c5 });
          const y0 = topY + 24, y1 = topY + bh * 0.70 - 8, fl = 1 - B.bar;
          flowDots(ctx, st, 'pe', Math.round(3 + fl * 22), G.x0 + 8, G.x1 - 8, y0, y1, 0.2 + fl * 0.9, dt, t, C.c2, '−');
          txt(ctx, r > 0.98 ? 'Vùng nghèo B–C đã chạm vùng nghèo B–E: không còn cơ sở trung hòa' : 'Còn một dải cơ sở trung hòa giữa hai vùng nghèo', padX, topY + bh * 0.70 + 20, r > 0.98 ? C.err : C.mut, 10.5, 'left', 700);
          txt(ctx, 'V_pt = ' + B.Vpt.toFixed(0) + ' V · x_d/x_BO = ' + (B.xd / S.xBO).toFixed(2), padX, topY + bh * 0.70 + 42, B.touch ? C.err : C.ink, 11, 'center', 800);
        } else {
          const G = secFrame(ctx, padX, topY, bw, bh * 0.66, 0.30, 0.18, { depBEe: 2, depBEb: 3, depBCb: 6, depBCc: 16 });
          const y0 = topY + 22, y1 = topY + bh * 0.66 - 8, fq = clamp(lg10(B.ICEO / 1e-9) / 6, 0.1, 1);
          flowDots(ctx, st, 'h', 4, G.xBC + 4, G.xBE + 4, y0, y1, -0.3, dt, t, C.c4, '+');
          flowDots(ctx, st, 'e', Math.round(4 + fq * 18), G.x0 + 8, G.x1 - 8, y0, y1, 0.3 + fq * 0.6, dt, t, C.c2, '−');
          const yy = topY + bh * 0.66 + 22;
          txt(ctx, 'I_CBO (lỗ trống từ C) = ' + fmtCur(B.ICBO), padX, yy, C.c4, 10.5, 'left', 700);
          txt(ctx, '⇒ B dương hơn E, B–E thuận, phun e⁻: I_CEO = ' + fmtCur(B.ICEO) + ' (≈ ×' + (B.ICEO / B.ICBO).toFixed(0) + ')', padX, yy + 20, C.main, 10.5, 'left', 800);
          txt(ctx, 'Thác lũ ở C–E sớm hơn: BV_CEO ≈ ' + B.BVceo.toFixed(0) + ' V < BV_CBO ≈ 120 V', padX, yy + 40, C.c5, 10, 'left', 700);
        }
      }
    }
  ]
});

/* ==========================================================================
   10. MỤC 6.2 — BỐN THỜI GIAN TRỄ & TẦN SỐ CẮT f_α
   ========================================================================== */
function faCalc(S) {
  const te = S.te, tb = S.tb, td = S.td, tc = S.tc, tau = (te + tb + td + tc) * 1e-12, fa = 1 / (TAU2 * tau), f = Math.pow(10, S.logF);
  const mag = 1 / Math.sqrt(1 + Math.pow(f / fa, 2)), ph = Math.atan(f / fa);
  return { te, tb, td, tc, tau, fa, f, mag, ph, tot: te + tb + td + tc };
}
LABS.push({
  id: 'fa', tag: '6.2', name: 'Tần số f_α', sec: 6,
  S: { te: 4, tb: 12, td: 3, tc: 1, logF: 9.0 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Đường đua 4 chặng của hạt tải từ emitter tới collector — τ_ec = τ_e + τ_b + τ_d + τ_c',
      area: 'a', anim: true,
      ctrls: [
        { k: 'te', l: 'τ_e', min: 0.5, max: 30, step: 0.5, f: v => v + ' ps' },
        { k: 'tb', l: 'τ_b', min: 0.5, max: 30, step: 0.5, f: v => v + ' ps' },
        { k: 'td', l: 'τ_d', min: 0.5, max: 20, step: 0.5, f: v => v + ' ps' },
        { k: 'tc', l: 'τ_c', min: 0.5, max: 30, step: 0.5, f: v => v + ' ps' },
        { btn: 'Ví dụ 6.1 (20 ps)', fn: p => { p.S.te = 5; p.S.tb = 10; p.S.td = 3; p.S.tc = 2; p.syncCtrls(); p.dirty = true; } },
        { btn: 'τ_b ÷ 2', fn: p => { p.S.tb = Math.max(0.5, p.S.tb / 2); p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, F = faCalc(S);
        const barX = W * 0.06, barW = W * 0.62, barY = H * 0.46, barH = 34;
        const segs = [[F.te, C.c1, 'τ_e', 'nạp C_je'], [F.tb, C.c2, 'τ_b', 'bay qua cơ sở'], [F.td, C.c5, 'τ_d', 'bay qua nghèo C'], [F.tc, C.c3, 'τ_c', 'nạp C_C']];
        let x = barX, maxI = 0;
        segs.forEach((s, i) => { if (s[0] > segs[maxI][0]) maxI = i; });
        segs.forEach((s, i) => {
          const w = Math.max(10, s[0] / F.tot * barW);
          rr(ctx, x, barY, w, barH, 4); ctx.fillStyle = s[1]; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
          rr(ctx, x, barY, w, barH, 4); ctx.strokeStyle = s[1]; ctx.lineWidth = i === maxI ? 2.6 : 1.4; ctx.stroke();
          txt(ctx, s[2], x + w / 2, barY + barH / 2, C.ink, 11, 'center', 800);
          txt(ctx, s[0].toFixed(1) + ' ps', x + w / 2, barY + barH + 13, s[1], 10, 'center', 700);
          if (w > 56) txt(ctx, s[3], x + w / 2, barY - 11, C.mut, 9, 'center', 600);
          x += w;
        });
        txt(ctx, 'E', barX - 4, barY - 12, C.c2, 11, 'right', 800); txt(ctx, 'C', barX + barW + 4, barY - 12, C.c1, 11, 'left', 800);
        const u = (t * 0.3) % 1;
        dot(ctx, barX + u * barW, barY + barH / 2, 6, C.main); dot(ctx, barX + ((u + 0.5) % 1) * barW, barY + barH / 2, 4, C.main);
        const gx = W - 62;
        drawMiniGauge(ctx, gx, H * 0.34, 23, 'f_α', fmtFreq(F.fa), clamp(lg10(F.fa / 1e8) / 3, 0, 1), C.main);
        txt(ctx, 'τ_ec = ' + F.tot.toFixed(1) + ' ps', gx, H * 0.62, C.ink, 11, 'center', 800);
        txt(ctx, 'Nút cổ chai: ' + segs[maxI][2] + ' (' + Math.round(segs[maxI][0] / F.tot * 100) + '%)', W * 0.37, H * 0.84, C.c3, 11, 'center', 700);
        chip(ctx, 'f_α = 1/(2π·τ_ec) — muốn nhanh phải rút ngắn chặng dài nhất', W * 0.40, 14, C.main, 'center');
        void st; void dt;
      }
    },
    {
      title: 'Bên trong: đèn vào nháy theo tần số f, đèn ra mờ dần và chậm nhịp khi f tiến gần f_α',
      area: 'c', anim: true,
      ctrls: [{ k: 'logF', l: 'Tần số tín hiệu', min: 8, max: 11.3, step: 0.05, f: v => fmtFreq(Math.pow(10, v)) }],
      draw(p, ctx, W, H, t) {
        const S = p.S, F = faCalc(S), sx = 14, sy = 22, sw = W - 28 - 150, sh = H - 36;
        rr(ctx, sx, sy, sw, sh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        const ph0 = t * 4, a1 = 0.5 + 0.5 * Math.sin(ph0), a2 = 0.5 + 0.5 * F.mag * Math.sin(ph0 - F.ph) + 0.5 * (1 - F.mag) * 0.5;
        const r0 = Math.min(sh * 0.30, 34), c1x = sx + sw * 0.22, c2x = sx + sw * 0.78, cy = sy + sh * 0.5;
        const lamp = (x, a, col, name) => {
          ctx.save(); ctx.globalAlpha = 0.15 + 0.7 * clamp(a, 0, 1); dot(ctx, x, cy, r0 + 8, col); ctx.restore();
          dot(ctx, x, cy, r0, a > 0.45 ? col : C.tint); ctx.beginPath(); ctx.arc(x, cy, r0, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.stroke();
          txt(ctx, name, x, cy + r0 + 16, col, 10, 'center', 700);
        };
        lamp(c1x, a1, C.c1, 'đèn vào i_e'); lamp(c2x, a2, C.main, 'đèn ra i_c');
        for (let k = 0; k < 6; k++) { const u = ((t * 0.5 + k / 6) % 1), x = c1x + r0 + 8 + u * (c2x - c1x - 2 * r0 - 16); const lag = F.mag; ctx.save(); ctx.globalAlpha = 0.25 + 0.7 * lag * (1 - u * (1 - lag)); dot(ctx, x, cy, 3.6, C.c2); ctx.restore(); }
        const lx = sx + sw + 12;
        txt(ctx, 'f = ' + fmtFreq(F.f), lx, H * 0.16, C.ink, 11.5, 'left', 800);
        txt(ctx, 'f/f_α = ' + (F.f / F.fa).toFixed(2), lx, H * 0.34, C.mut, 10.5, 'left', 700);
        txt(ctx, '|α|/α₀ = ' + F.mag.toFixed(2), lx, H * 0.54, F.mag < 0.72 ? C.err : C.main, 12, 'left', 800);
        txt(ctx, 'trễ pha ' + (F.ph * 180 / Math.PI).toFixed(0) + '°', lx, H * 0.72, C.c3, 11, 'left', 700);
        txt(ctx, F.f >= F.fa ? 'Quá f_α: giảm > 3 dB' : 'Dưới f_α', lx, H * 0.88, F.f >= F.fa ? C.err : C.c2, 10, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   11. MỤC 7.3 — XUNG CHUYỂN MẠCH: t_d · t_r · t_s · t_f & ĐIỆN TÍCH TÍCH TRỮ
   ========================================================================== */
const SW_SPEED = 46; // ns mỗi giây thực
LABS.push({
  id: 'sw', tag: '7.3', name: 'Chuyển mạch', sec: 7,
  S: { k: 3, m: 0.5 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: BJT đóng cắt đèn LED — hai đồng hồ kim I_B, I_C và bốn đèn pha t_d · t_r · t_s · t_f lần lượt sáng (minh họa định tính)',
      area: 'a', anim: true,
      ctrls: [
        { k: 'k', l: 'Quá kích I_B1/I_Bsat', min: 1, max: 10, step: 0.5, f: v => v.toFixed(1) + '×' },
        { k: 'm', l: 'Rút ngược I_B2/I_Bsat', min: 0, max: 3, step: 0.1, f: v => v.toFixed(1) + '×' },
        { btn: 'Vừa bão hòa', fn: p => { p.S.k = 1.2; p.S.m = 0; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Bão hòa sâu', fn: p => { p.S.k = 8; p.S.m = 0; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Rút mạnh', fn: p => { p.S.k = 8; p.S.m = 2.5; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, Z = swCalc(S), sx = 14, sy = 24, sw = W * 0.68, sh = Math.min(H - 40, 220);
        rr(ctx, sx, sy - 12, sw, sh + 20, 10); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.6; ctx.stroke();
        const ph = (t * SW_SPEED) % Z.Ttot, ic = Math.min(1, Z.q(ph)), ibN = Z.ib(ph);
        const ibMax = Math.max(Z.k, Z.m, 1);
        const gr = Math.min(30, sh * 0.24), gy = sy + sh * 0.34;
        drawMiniGauge(ctx, sx + sw * 0.18, gy, gr, 'I_B', (ibN >= 0 ? '+' : '−') + Math.abs(ibN).toFixed(1) + ' I_Bsat', clamp(0.5 + 0.5 * ibN / ibMax, 0, 1), ibN < 0 ? C.c3 : C.c1);
        drawMiniGauge(ctx, sx + sw * 0.50, gy, gr, 'I_C', (ic * 100).toFixed(0) + ' %', ic, C.main);
        const phases = [['t_d', C.c1, ph >= Z.ton && ph < Z.ton + Z.td], ['t_r', C.c2, ph >= Z.ton + Z.td && ph < Z.ton + Z.td + Z.tr], ['t_s', C.c5, ph >= Z.toff && ph < Z.toff + Z.ts], ['t_f', C.c3, ph >= Z.toff + Z.ts && ph < Z.toff + Z.ts + Z.tf]];
        phases.forEach((q, i) => {
          const x = sx + sw * (0.16 + i * 0.22), y = sy + sh * 0.78;
          ctx.save(); ctx.globalAlpha = q[2] ? 0.35 : 0; dot(ctx, x, y, 17, q[1]); ctx.restore();
          dot(ctx, x, y, 11, q[2] ? q[1] : C.tint); ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.3; ctx.stroke();
          txt(ctx, q[0], x, y + 24, q[1], 10, 'center', 800);
        });
        const rx = sx + sw + 14;
        ctx.save(); ctx.globalAlpha = 0.2 + 0.7 * ic; dot(ctx, rx + 22, H * 0.20, 16, C.main); ctx.restore();
        dot(ctx, rx + 22, H * 0.20, 11, ic > 0.05 ? C.main : C.tint); ctx.beginPath(); ctx.arc(rx + 22, H * 0.20, 11, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.stroke();
        txt(ctx, 'LED', rx + 22, H * 0.20 + 26, C.mut, 9.5, 'center', 700);
        [['t_d', Z.td, C.c1], ['t_r', Z.tr, C.c2], ['t_s', Z.ts, C.c5], ['t_f', Z.tf, C.c3]].forEach((r, i) => txt(ctx, r[0] + ' = ' + r[1].toFixed(1) + ' ns', rx, H * 0.42 + i * 22, r[2], 11, 'left', 700));
        chip(ctx, Z.ts >= Z.tr && Z.ts >= Z.tf ? 'Thời gian tích trữ t_s đang chiếm ưu thế' : 'Quá kích càng sâu, t_s càng dài; rút ngược mạnh thì rút ngắn', W * 0.40, 12, Z.ts > 20 ? C.c5 : C.main, 'center');
      }
    },
    {
      title: 'Bên trong: điện tích tích trữ trong cơ sở theo thời gian — q > 1 là điện tích dư Q_BX làm B–C thuận',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, Z = swCalc(S), ph = (t * SW_SPEED) % Z.Ttot, q = Z.q(ph), padX = 16, rightW = 150;
        const bw = W - padX - rightW, topY = 12, bh = H - 24;
        const G = secFrame(ctx, padX, topY, bw, bh, 0.28, 0.14, { depBEe: 2, depBEb: 3, depBCb: q > 1 ? 1 : 4, depBCc: q > 1 ? 2 : 10 });
        const y0 = topY + 22, y1 = topY + bh - 8;
        const nA = Math.round(clamp(Math.min(q, 1), 0, 1) * 16), nX = Math.round(clamp((q - 1) / Math.max(1, Z.k - 1), 0, 1) * 22);
        if (!st.a) { st.a = Array.from({ length: 16 }, () => ({ u: Math.random(), v: Math.random() })); st.x = Array.from({ length: 22 }, () => ({ u: Math.random(), v: Math.random() })); }
        st.a.forEach((o, i) => { if (i < nA) { const x = G.xBE + 4 + o.u * (G.wB - 8) + Math.sin(t * 4 + i) * 2, y = y0 + o.v * (y1 - y0); dot(ctx, x, y, 3.8, C.c2); txt(ctx, '−', x, y + 0.5, C.bg, 8, 'center', 800); } });
        st.x.forEach((o, i) => { if (i < nX) { const x = G.xBC + 4 + o.u * (G.x1 - G.xBC - 12) + Math.sin(t * 3 + i) * 2, y = y0 + o.v * (y1 - y0); dot(ctx, x, y, 3.8, C.c5); txt(ctx, '−', x, y + 0.5, C.bg, 8, 'center', 800); } });
        const lx = padX + bw + 10, bcF = q > 1;
        txt(ctx, 't = ' + ph.toFixed(0) + ' ns', lx, topY + bh * 0.10, C.mut, 10.5, 'left', 700);
        txt(ctx, 'q = Q/Q_sat = ' + q.toFixed(2), lx, topY + bh * 0.28, C.main, 11.5, 'left', 800);
        dot(ctx, lx + 5, topY + bh * 0.46, 5, bcF ? C.err : C.c5); txt(ctx, 'B–C: ' + (bcF ? 'THUẬN' : 'ngược'), lx + 14, topY + bh * 0.46, bcF ? C.err : C.c5, 10, 'left', 700);
        txt(ctx, bcF ? 'Q_BX dư: phải rút' : 'Chưa bão hòa', lx, topY + bh * 0.62, bcF ? C.c5 : C.mut, 10, 'left', 700);
        txt(ctx, ph > Z.toff ? 'Dòng I_B ngược rút Q' : ph > Z.ton ? 'Dòng I_B cấp Q' : 'Chờ xung', lx, topY + bh * 0.80, ph > Z.toff ? C.c3 : C.c1, 10, 'left', 700);
        void dt;
      }
    }
  ]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM CHO ĐỦ 11 MÔ HÌNH TƯƠNG TÁC BUỔI 12
   ========================================================================== */
const LD = {};
LD.base = {
  intro: [
    ['i', 'Ở chế độ thuận tích cực, tiếp giáp B–E thuận phun electron vào cơ sở p, còn B–C ngược nên nồng độ electron ở mép collector gần như bằng 0.'],
    ['w', 'Nồng độ electron tại mép emitter là n_B(0) = n_B0·e^(V_BE/V_t): tăng ~60 mV là tăng ~10 lần.'],
    ['w', 'Cơ sở mỏng (x_B ≪ L_B): dải nồng độ nhạt dần đều, dòng khuếch tán tỉ lệ độ chênh sáng–tối — gần như không electron nào kịp tái hợp.'],
    ['i', 'Cơ sở dài (x_B ≳ L_B): dải nhạt đi rất nhanh, nhiều electron tái hợp giữa đường (vòng loé), dòng tới collector giảm.'],
    ['v', 'Kéo V_BE, V_BC rồi bấm "Cơ sở mỏng" / "Cơ sở dài" để so sánh hai dáng đường nồng độ.']
  ],
  react(S, k, P, say) {
    const Pf = baseProf(S.VBE, S.VBC, S.xB, S.LB, 1e16), md = bjtMode(S.VBE, S.VBC);
    say('v', `V_BE=${S.VBE.toFixed(2)} V, V_BC=${S.VBC.toFixed(2)} V (${md.label}) → n_B(0)=${sci(Pf.n(0), 1)} cm⁻³, I_C=${fmtCur(Pf.IC)}, α_T=${Pf.aT.toFixed(4)}.`);
    if (S.xB / S.LB > 0.6) say('w', 'x_B/L_B đã lớn: phân bố cong, α_T tụt rõ — cơ sở không còn đủ mỏng.');
    if (md.k === 'sat') say('w', 'B–C cũng thuận: electron cũng được phun từ collector, mép x_B không còn bằng 0 — đó là bão hòa.');
  }
};
LD.comp = {
  intro: [
    ['i', 'Tiếp giáp B–E thuận phun hai loại hạt: electron từ emitter vào cơ sở (i_E1) và lỗ trống từ cơ sở sang emitter (i_E2, không đóng góp vào collector).'],
    ['w', 'Dòng cơ sở có hai phần: i_Ba chính là i_E2, và i_Bb bù cho lỗ trống tái hợp với electron trong cơ sở.'],
    ['w', 'Cả bốn thành phần đều ∝ e^(V_BE/V_t) nên tỉ số i_C/i_E = α và i_C/i_B = β gần như hằng số khi quét V_BE.'],
    ['v', 'Mặc định: i_C = 1 mA tại 0,65 V. Bấm "+60 mV" để thấy mọi ampe kế nhảy lên khoảng 10 lần.']
  ],
  react(S, k, P, say) {
    const K = compCalc(S);
    say('v', `i_C=${fmtCur(K.IC)}, i_B=${fmtCur(K.iB)}, i_E=${fmtCur(K.iE)} → α=${K.alpha.toFixed(4)}, β=${K.beta.toFixed(1)}.`);
    if (k === 'r2' || k === 'rb') say('w', 'Tăng lỗ trống phun ngược hoặc tái hợp đều làm i_B lớn hơn và β nhỏ đi — α chỉ nhích rất nhẹ.');
  }
};
LD.mode = {
  intro: [
    ['i', 'Vòng collector–emitter cho đường tải: V_CE = V_CC − I_C·R_C. Điểm làm việc luôn nằm trên đường này.'],
    ['w', 'Thuận tích cực: I_C = β·I_B và V_CE còn đủ lớn để B–C ngược.'],
    ['w', 'Tăng I_B mãi thì V_R = I_C·R_C ăn hết V_CC, V_CE tụt về ~0,2 V, B–C chuyển sang thuận: bão hòa, I_C bị đường tải chặn.'],
    ['i', 'I_B ≈ 0: không phun, I_C = 0 và V_CE = V_CC (ngắt).'],
    ['v', 'Bấm "Ngắt", "Tích cực", "Bão hòa" hoặc kéo I_B; mặc định khớp Ví dụ 2.1 (I_B = 20 µA ⇒ V_CE = 6 V).']
  ],
  react(S, k, P, say) {
    const M = modeCalc(S), tx = { cut: 'NGẮT', act: 'THUẬN TÍCH CỰC', sat: 'BÃO HÒA' }[M.k];
    say('v', `I_B=${S.IB} µA → I_C=${fmtCur(M.IC)}, V_CE=${M.VCE.toFixed(2)} V (${tx}).`);
    if (M.k === 'sat') say('w', `β·I_B = ${fmtCur(M.want)} vượt quá V_CC/R_C = ${fmtCur(M.ICmax)}: đường tải chặn dòng.`);
  }
};
LD.amp = {
  intro: [
    ['i', 'Chồng một điện áp xoay chiều nhỏ v_i lên V_BE tĩnh: dòng cơ sở và dòng collector cũng có thành phần xoay chiều chồng lên giá trị tĩnh.'],
    ['w', 'Vì i_C = β·i_B và i_C phụ thuộc hàm mũ vào v_BE, dòng collector biến thiên lớn hơn nhiều.'],
    ['w', 'Dòng này chạy qua R_C tạo ra điện áp ra v_o lớn hơn v_i và ngược pha: đó là độ lợi điện áp A_v ≈ −g_m·R_C.'],
    ['i', 'Điểm Q quá cao hoặc biên độ quá lớn thì i_C chạm trần V_CC/R_C: đỉnh v_o bị cắt (méo).'],
    ['v', 'Bấm "Quá kích" để thấy méo, rồi "Điểm Q đẹp" để quay lại kim đồng hồ chạy sạch.']
  ],
  react(S, k, P, say) {
    const IQ = IS0 * Math.exp(S.VBEQ / VT_300), gm = IQ / VT_300;
    say('v', `V_BEQ=${S.VBEQ.toFixed(3)} V → I_CQ=${fmtCur(IQ)}, g_m=${(gm * 1e3).toFixed(1)} mS, A_v ≈ −${(gm * S.RC * 1e3).toFixed(0)}.`);
    if (IQ > (AMP_VCC - 0.2) / (S.RC * 1e3)) say('w', 'Điểm Q đã nằm trong vùng bão hòa của đường tải — hầu như không còn khuếch đại.');
  }
};
LD.gain = {
  intro: [
    ['i', 'Hệ số khuếch đại dòng cơ sở chung tách thành tích ba tỉ số: α = γ·α_T·δ, mỗi hệ số "ăn bớt" ở một nơi.'],
    ['w', 'γ: tỉ lệ dòng emitter là electron — cần emitter pha nặng hơn cơ sở nhiều (N_E ≫ N_B).'],
    ['w', 'α_T ≈ 1/cosh(x_B/L_B): cơ sở càng mỏng so với L_B thì electron càng ít tái hợp.'],
    ['w', 'δ: tái hợp trong vùng nghèo B–E, nặng nhất khi dòng nhỏ (V_BE thấp).'],
    ['v', 'Bấm "Ví dụ 3.1": N_E/N_B ≈ 302, x_B = 0,8 µm, L_B = 10 µm cho γ ≈ 0,9967, α_T ≈ 0,9968 (δ ≈ 1 ở V_BE cao).']
  ],
  react(S, k, P, say) {
    const K = gainCalc(S);
    say('v', `γ=${K.gamma.toFixed(4)}, α_T=${K.aT.toFixed(4)}, δ=${K.delta.toFixed(4)} → α=${K.alpha.toFixed(4)}, β=${K.beta.toFixed(0)}.`);
    const big = K.l1 >= K.l2 && K.l1 >= K.l3 ? 'phun ngược (γ)' : K.l2 >= K.l3 ? 'tái hợp trong cơ sở (α_T)' : 'tái hợp vùng nghèo (δ)';
    say('w', `Nguồn mất lớn nhất lúc này: ${big}.`);
  }
};
LD.early = {
  intro: [
    ['i', 'Điện áp ngược B–C tăng làm vùng nghèo B–C rộng ra và lấn vào cơ sở: bề rộng cơ sở trung hòa x_B giảm.'],
    ['w', 'x_B nhỏ hơn ⇒ gradient nồng độ electron lớn hơn ⇒ dòng khuếch tán I_C tăng — đó là hiệu ứng Early.'],
    ['w', 'Hệ quả: dòng I_C không bão hòa phẳng mà còn tăng theo V_CE, g_o = I_C/(V_CE + V_A) và r_o = 1/g_o hữu hạn.'],
    ['i', 'V_A càng lớn thì BJT càng giống nguồn dòng lý tưởng; cơ sở mỏng, pha tạp nhẹ làm V_A nhỏ đi.'],
    ['v', 'Kéo V_CB; thử "Cơ sở mỏng" rồi "V_A lớn" và nhìn thước điện áp −V_A lùi xa.']
  ],
  react(S, k, P, say) {
    const E = earlyCalc(S);
    say('v', `V_CB=${S.VCB.toFixed(1)} V → x_B=${fmtUm(E.xB)}, I_C ×${E.boost.toFixed(3)}, V_A≈${isFinite(E.VA) ? E.VA.toFixed(0) : '∞'} V, r_o=${fmtOhm(E.ro)}.`);
    if (E.xB < 0.15) say('w', 'Cơ sở trung hòa gần cạn — đây là ngưỡng xuyên thấu.');
  }
};
LD.hl = {
  intro: [
    ['i', 'Hệ số phun γ → 1 khi N_E/N_B tăng, nhưng ở pha tạp rất nặng mức donor tách thành dải rồi nhập vào vùng dẫn: vùng cấm hẹp lại ΔE_g.'],
    ['w', 'Khi đó n_iE² = n_i²·e^(ΔE_g/kT) nên p′_E0 lớn hơn và dòng lỗ trống phun ngược tăng: γ thấp hơn so với không có hẹp vùng cấm.'],
    ['w', 'Phun mức cao: khi n_B(0) vượt N_B, nồng độ lỗ trống cũng tăng theo nên n_B(0) ∝ e^(V_BE/2kT): hệ số mũ giảm một nửa và β tụt.'],
    ['v', 'Chuyển bật/tắt "Hẹp vùng cấm" và kéo N_E; rồi kéo V_BE qua ngưỡng phun mức cao để thấy β rơi.']
  ],
  react(S, k, P, say) {
    const K = hlCalc(S);
    say('v', `ΔE_g=${(K.dEg * 1000).toFixed(0)} meV (×${K.fac.toFixed(1)}), γ=${K.gamma.toFixed(4)} (không hẹp: ${K.gamma0.toFixed(4)}); n_B(0)/N_B=${K.r.toFixed(2)}, β≈${K.beta.toFixed(0)}.`);
    if (K.r > 1) say('w', 'Đã phun mức cao: dòng phun chỉ còn e^(V/2kT), β giảm khi tăng V_BE.');
  }
};
LD.crowd = {
  intro: [
    ['i', 'Cơ sở rất mỏng nên có điện trở cơ sở đáng kể; dòng cơ sở chạy ngang tạo chênh lệch điện thế dưới emitter.'],
    ['w', 'Emitter gần đẳng thế nên điện áp B–E hiệu dụng ở mép lớn hơn ở giữa; vì dòng phun phụ thuộc hàm mũ vào V_BE, dòng dồn ra mép.'],
    ['w', 'Mật độ dòng cao ở mép gây nóng cục bộ và phun mức cao cục bộ.'],
    ['i', 'Cách chữa: chia emitter thành nhiều ngón hẹp song song, mỗi ngón có tiếp xúc cơ sở hai bên.'],
    ['v', 'Tăng dòng tổng hoặc R_sb rồi bấm "2 ngón", "4 ngón" để thấy tỉ số J_mép/J_giữa giảm.']
  ],
  react(S, k, P, say) {
    const K = crowdSolve(S);
    say('v', `${S.nf} ngón × ${(S.wE / S.nf).toFixed(1)} µm, I=${S.I.toFixed(0)} mA, R_sb=${S.Rsb / 1000} kΩ/□ → J_mép/J_giữa=×${K.ratio.toFixed(1)}, ΔV=${(K.dV * 1000).toFixed(0)} mV.`);
    if (K.ratio > 5) say('w', 'Dồn dòng mạnh: phần giữa emitter gần như không làm việc.');
  }
};
LD.brk = {
  intro: [
    ['i', 'Điện áp ngược B–C tăng làm vùng nghèo B–C rộng ra; nếu nó xuyên hết cơ sở và chạm vùng nghèo B–E thì hàng rào thế B–E bị hạ: xuyên thấu.'],
    ['w', 'Điện áp xuyên thấu V_pt = (e·x_BO²/2ε_s)·N_B(N_C+N_B)/N_C: cơ sở mỏng, pha tạp nhẹ thì V_pt thấp.'],
    ['w', 'Khi cơ sở hở, lỗ trống ngược I_CBO làm B dương hơn E, B–E phun electron và dòng được khuếch đại: I_CEO = I_CBO/(1−α) ≈ β·I_CBO.'],
    ['i', 'Vì I_CEO lớn hơn I_CBO cỡ β lần nên thác lũ ở nối emitter chung xảy ra ở điện áp thấp hơn nối cơ sở chung.'],
    ['v', 'Đổi giữa "Xuyên thấu" và "I_CEO (B hở)" rồi kéo V_CB.']
  ],
  react(S, k, P, say) {
    const B = brkCalc(S);
    if (S.mode === 'pt') say('v', `V_CB=${S.VCB} V, x_d=${fmtUm(B.xd)}, x_BO=${S.xBO.toFixed(2)} µm → V_pt≈${B.Vpt.toFixed(0)} V, I=${fmtCur(B.Ipt)}.`);
    else say('v', `V_CB=${S.VCB} V: I_CBO=${fmtCur(B.ICBO)}, I_CEO=${fmtCur(B.ICEO)} (β=${S.beta}); BV_CEO≈${B.BVceo.toFixed(0)} V.`);
    if (S.mode === 'pt' && B.touch) say('w', 'Vùng nghèo B–C đã chạm B–E: dòng vọt lên rất nhanh khi điện áp nhích thêm chút.');
  }
};
LD.fa = {
  intro: [
    ['i', 'BJT là linh kiện thời gian bay: thời gian từ emitter đến collector gồm bốn chặng τ_ec = τ_e + τ_b + τ_d + τ_c.'],
    ['w', 'Tần số cắt f_α = 1/(2π·τ_ec): tại đó độ lớn hệ số khuếch đại dòng giảm còn 1/√2 giá trị tần số thấp.'],
    ['w', 'Tần số tăng, thời gian bay so sánh được với chu kỳ: dòng ra trễ pha và nhỏ dần so với dòng vào.'],
    ['v', 'Bấm "Ví dụ 6.1 (20 ps)" ⇒ f_α ≈ 8 GHz; rồi "τ_b ÷ 2" để xem rút ngắn chặng dài nhất tăng f_α.']
  ],
  react(S, k, P, say) {
    const F = faCalc(S);
    say('v', `τ_ec=${F.tot.toFixed(1)} ps → f_α=${fmtFreq(F.fa)}; tại f=${fmtFreq(F.f)}: |α|/α₀=${F.mag.toFixed(2)}, trễ pha ${(F.ph * 180 / Math.PI).toFixed(0)}°.`);
  }
};
LD.sw = {
  intro: [
    ['i', 'Chuyển mạch đưa BJT giữa ngắt và bão hòa; một xung dòng cơ sở bật rồi tắt.'],
    ['w', 'Bật: t_d (I_C lên 10 %) rồi t_r (10 % → 90 %). Cơ sở tiếp tục được cấp dòng, đẩy transistor vào bão hòa và tích điện tích dư Q_BX.'],
    ['w', 'Tắt: t_s rút điện tích dư (I_C chưa đổi nhiều), rồi t_f (90 % → 10 %). t_s thường là thành phần chậm nhất.'],
    ['i', 'Đây là minh họa định tính theo mô hình điều khiển điện tích — slide không cho công thức cho bốn thời gian này.'],
    ['v', 'Bấm "Bão hòa sâu" rồi "Rút mạnh" để thấy t_s rút ngắn khi dòng cơ sở đảo chiều mạnh.']
  ],
  react(S, k, P, say) {
    const Z = swCalc(S);
    say('v', `I_B1=${S.k.toFixed(1)}×, I_B2=${S.m.toFixed(1)}× → t_d=${Z.td.toFixed(1)} ns, t_r=${Z.tr.toFixed(1)} ns, t_s=${Z.ts.toFixed(1)} ns, t_f=${Z.tf.toFixed(1)} ns.`);
    if (Z.ts > 25) say('w', 'Bão hòa sâu tích nhiều điện tích dư nên t_s dài — muốn đóng cắt nhanh thì đừng quá kích hoặc rút ngược mạnh.');
  }
};
LABS.forEach(l => { l.log = LD[l.id]; });


/* ==========================================================================
   KHUNG POPUP (#lab12 — đồng bộ 100% phong cách & biến màu CSS của lab-b7.js)
   ========================================================================== */
const CSS = `
#lab12{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab12[hidden]{display:none}
#lab12 *{box-sizing:border-box}
#lab12 .lb-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
#lab12 .lb-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
#lab12 .lb-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
#lab12 .lb-ic{color:var(--main);display:flex}
#lab12 .lb-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
#lab12 .lb-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
#lab12 .lb-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
#lab12 .lb-tab:hover{color:var(--ink);background:var(--tint)}
#lab12 .lb-tab.on{background:var(--main);color:var(--bg);font-weight:700}
#lab12 .lb-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
#lab12 .lb-x:hover{color:var(--err);background:var(--tint)}
#lab12 .lb-b{flex:1;min-height:0;display:grid;gap:6px;padding:6px}
#lab12 .lb-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
#lab12 .lb-p.glow{animation:lb12glow 1.4s ease-out}
@keyframes lb12glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
#lab12 .lb-t{font:600 11.5px/1.2 var(--font-ui);color:var(--mut);padding:5px 10px 0;flex:none}
#lab12 .lb-cv{flex:1;min-height:0;position:relative}
#lab12 .lb-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#lab12 .lb-c{display:flex;flex-wrap:wrap;gap:5px 10px;padding:4px 10px 6px;flex:none;align-items:center}
#lab12 .lb-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
#lab12 .lb-k input[type=range]{width:clamp(64px,7vw,108px);margin:0}
#lab12 .lb-k output{color:var(--ink);font-weight:700;min-width:3em}
#lab12 .lb-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
#lab12 .lb-seg button,#lab12 .lb-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:5px 8px;cursor:pointer}
#lab12 .lb-btn{background:var(--tint)}
#lab12 .lb-seg button:hover,#lab12 .lb-btn:hover{color:var(--ink)}
#lab12 .lb-seg button.on{background:var(--main);color:var(--bg)}
#lab12 .lb-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
#lab12 .lb-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb12in .4s ease-out;overflow-wrap:anywhere}
#lab12 .lb-ln::before{position:absolute;left:0;font-weight:700}
#lab12 .lb-ln.i{color:var(--ink)}#lab12 .lb-ln.i::before{content:'›';color:var(--c5)}
#lab12 .lb-ln.w{color:var(--ink)}#lab12 .lb-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
#lab12 .lb-ln.v{color:var(--main)}#lab12 .lb-ln.v::before{content:'=';color:var(--main)}
@keyframes lb12in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab-m:hover,.lab-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){#lab12 .lb-win{width:100vw;height:100dvh;border-radius:0}#lab12 .lb-b{overflow:auto;display:flex;flex-direction:column}#lab12 .lb-p{min-height:300px;flex:none}#lab12 .lb-p:nth-child(2){min-height:210px}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style');
sty.textContent = CSS;
document.head.appendChild(sty);

let timers = [], ros = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'base';

function ensureDom() {
  if (root) return;
  root = document.createElement('div');
  root.id = 'lab12';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 12');
  root.innerHTML = '<div class="lb-win"><div class="lb-h"><span class="lb-ic">' + FLASK + '</span><span class="lb-bd">Phòng thí nghiệm · Buổi 12</span><nav class="lb-tabs"></nav><button class="lb-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb-b');
  tabsEl = root.querySelector('.lb-tabs');

  LABS.forEach(l => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lb-tab';
    b.dataset.id = l.id;
    b.textContent = l.tag + ' · ' + l.name;
    b.onclick = () => show(l.id);
    tabsEl.appendChild(b);
  });

  root.querySelector('.lb-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) {
      const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty && window.LabB12 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden && (document.getElementById('tb-badge') || {}).textContent === 'Buổi 12') {
        e.preventDefault(); open();
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
}

const say = (kind, text) => {
  if (!logEl) return;
  const d = document.createElement('div');
  d.className = 'lb-ln ' + kind;
  d.textContent = text;
  logEl.appendChild(d);
  while (logEl.children.length > 60) logEl.removeChild(logEl.firstChild);
  logEl.scrollTop = logEl.scrollHeight;
};
const rt = {};
function queueReact(tab, k) {
  if (!tab.log || !tab.log.react) return;
  clearTimeout(rt[k]);
  rt[k] = setTimeout(() => {
    if (cur !== tab || !logEl) return;
    const P = tab.prev || {};
    tab.log.react(tab.S, k, P, say);
    tab.prev = Object.assign({}, tab.S);
  }, 350);
}
function clearTimers() {
  timers.forEach(clearTimeout); timers = [];
  Object.keys(rt).forEach(k => clearTimeout(rt[k]));
  ros.forEach(ro => ro.disconnect()); ros = [];
}

function mkCtrl(tab, c, p) {
  const S = tab.S, w = document.createElement('div');
  const touch = key => {
    curPanels.forEach(q => q.dirty = true);
    queueReact(tab, key || c.k);
  };
  if (c.btn) {
    w.className = 'lb-btn';
    w.textContent = c.btn;
    w.setAttribute('role', 'button');
    w.tabIndex = 0;
    const run = () => { c.fn(p); touch(c.k || 'preset'); };
    w.onclick = run;
    w.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } };
    return w;
  }
  if (c.seg) {
    w.className = 'lb-seg';
    c.seg.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o[1];
      b.className = S[c.k] === o[0] ? 'on' : '';
      b.onclick = () => {
        S[c.k] = o[0];
        if (c.set && c.set[o[0]]) Object.assign(S, c.set[o[0]]);
        curPanels.forEach(q => q.syncCtrls && q.syncCtrls());
        touch(c.k);
      };
      w.appendChild(b);
    });
    p.syncs.push(() => { [...w.children].forEach((b, i) => b.classList.toggle('on', S[c.k] === c.seg[i][0])); });
    return w;
  }
  w.className = 'lb-k';
  const lab = document.createElement('span'); lab.textContent = c.l;
  const inp = document.createElement('input');
  inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step;
  const out = document.createElement('output');
  w.append(lab, inp, out);
  const sync = () => {
    inp.value = c.log ? Math.log10(S[c.k]) : S[c.k];
    out.textContent = c.f(S[c.k]);
  };
  inp.oninput = () => {
    S[c.k] = c.log ? Math.pow(10, +inp.value) : +inp.value;
    out.textContent = c.f(S[c.k]);
    touch(c.k);
  };
  inp.setAttribute('aria-label', c.l);
  p.syncs.push(sync);
  sync();
  return w;
}

function show(id, panelIdx, patch) {
  const tab = LABS.find(l => l.id === id) || LABS[0];
  if (patch) Object.assign(tab.S, patch);
  cur = tab; lastTab = tab.id;
  clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];

  [...tabsEl.children].forEach(b => {
    const on = b.dataset.id === tab.id;
    b.classList.toggle('on', on);
    if (on && b.scrollIntoView) b.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  });

  const mob = innerWidth <= 900;
  if (!mob) {
    bodyEl.style.display = 'grid';
    bodyEl.style.gridTemplateColumns = tab.cols;
    bodyEl.style.gridTemplateRows = tab.rows;
    bodyEl.style.gridTemplateAreas = tab.areas;
  } else {
    bodyEl.style.display = ''; bodyEl.style.gridTemplate = '';
  }

  tab.prev = Object.assign({}, tab.S);
  tab.panels.concat([{ title: 'Nhật ký thí nghiệm', area: 'l', log: true }]).forEach(spec => {
    const el = document.createElement('div');
    el.className = 'lb-p';
    if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb-t"></div><div class="lb-cv"><canvas></canvas></div>';
    el.firstChild.textContent = spec.title;

    if (spec.log) {
      const lg = document.createElement('div');
      lg.className = 'lb-log';
      lg.setAttribute('aria-live', 'polite');
      el.replaceChild(lg, el.lastChild);
      logEl = lg;
      bodyEl.appendChild(el);
      curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => {
        timers.push(setTimeout(() => say(ln_[0], ln_[1]), 250 + j * 850));
      });
      return;
    }

    const cv = el.querySelector('canvas'), box = el.querySelector('.lb-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());

    if (spec.ctrls && spec.ctrls.length) {
      const cb = document.createElement('div');
      cb.className = 'lb-c';
      spec.ctrls.forEach(c => cb.appendChild(mkCtrl(tab, c, p)));
      el.appendChild(cb);
    }

    bodyEl.appendChild(el);
    curPanels.push(p);

    const ro = new ResizeObserver(() => {
      const r = box.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      p.W = Math.max(10, r.width); p.H = Math.max(10, r.height);
      cv.width = Math.round(p.W * d); cv.height = Math.round(p.H * d);
      p.ctx.setTransform(d, 0, 0, d, 0, 0);
      p.dirty = true;
    });
    ro.observe(box);
    ros.push(ro);
  });

  if (panelIdx != null && curPanels[panelIdx]) {
    const e = curPanels[panelIdx].el;
    e.classList.add('glow');
    setTimeout(() => e.classList.remove('glow'), 1500);
  }
}

function loop(ts) {
  if (!root || root.hidden) { raf = 0; return; }
  const dt = Math.min(0.04, (ts - last) / 1000);
  last = ts; tAcc += dt;
  curPanels.forEach(p => {
    if (!p.ctx || !p.W || !(p.spec.anim || p.dirty)) return;
    p.dirty = false;
    const ctx = p.ctx;
    ctx.clearRect(0, 0, p.W, p.H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, p.W, p.H);
    ctx.save();
    try { p.spec.draw(p, ctx, p.W, p.H, tAcc, dt); } catch (err) { console.error('[LabB12]', err); }
    ctx.restore();
  });
  raf = requestAnimationFrame(loop);
}

function open(id, panelIdx, patch) {
  ensureDom(); readColors(); opener = document.activeElement;
  root.hidden = false; show(id || lastTab, panelIdx, patch);
  last = performance.now();
  if (!raf) raf = requestAnimationFrame(loop);
  root.querySelector('.lb-x').focus({ preventScroll: true });
  const b = document.getElementById('tb-lab');
  if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
}

function close() {
  if (!root || root.hidden) return;
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  const b = document.getElementById('tb-lab');
  if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

const H2MAP = { 1: 'base', 2: 'mode', 3: 'gain', 4: 'early', 6: 'fa', 7: 'sw' };
const H3MAP = [
  [/^1\.2/, 'base', 0],  [/^1\.3/, 'base', 0],  [/^1\.4/, 'comp', 0], [/^1\.5/, 'comp', 0],
  [/^2\.2/, 'mode', 0],  [/^2\.3/, 'mode', 0],  [/^2\.4/, 'amp', 0],  [/^2\.5/, 'amp', 0],
  [/^3\.3/, 'gain', 0],  [/^3\.4/, 'gain', 0],  [/^3\.5/, 'gain', 0],
  [/^4\.1(?!\d)/, 'early', 0], [/^4\.2/, 'early', 0],
  [/^4\.3/, 'hl', 0, { bgn: 'off' }], [/^4\.4/, 'hl', 0, { bgn: 'on' }], [/^4\.5/, 'hl', 0],
  [/^4\.6/, 'crowd', 0], [/^4\.7/, 'crowd', 0],
  [/^4\.8/, 'brk', 0, { mode: 'pt', VCB: 30 }], [/^4\.9/, 'brk', 0, { mode: 'ceo', VCB: 20 }], [/^4\.10/, 'brk', 0],
  [/^6\.1/, 'fa', 0],    [/^6\.2/, 'fa', 0],
  [/^7\.1/, 'sw', 0],    [/^7\.2/, 'sw', 0],    [/^7\.3/, 'sw', 0]
];
function addMark(h, id, pi, title, patch) {
  if (h.querySelector('.lab-m')) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'lab-m';
  b.innerHTML = FLASK;
  b.setAttribute('aria-label', 'Xem thí nghiệm: ' + title);
  b.title = 'Xem thí nghiệm';
  b.onclick = e => { e.preventDefault(); e.stopPropagation(); open(id, pi, patch); };
  h.appendChild(b);
}

function markLesson(rootEl) {
  if (!rootEl) return;
  rootEl.querySelectorAll('h2').forEach(h => {
    const m = /^\s*(\d)\./.exec(h.textContent);
    if (!m) return;
    const id = H2MAP[+m[1]];
    if (id) addMark(h, id, null, h.textContent.trim());
  });
  rootEl.querySelectorAll('h3').forEach(h => {
    const t = h.textContent.trim();
    const r = H3MAP.find(x => x[0].test(t));
    if (r) addMark(h, r[1], r[2], t, r[3]);
  });
}

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 12') {
  markLesson(document.getElementById('app-content'));
}
window.LabB12 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
