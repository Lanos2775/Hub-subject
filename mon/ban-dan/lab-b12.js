/* ==========================================================================
   lab-b12.js — PHÒNG THÍ NGHIỆM MÔ PHỎNG BUỔI 12:
   TRANSISTOR LƯỠNG CỰC BJT — PHÂN BỐ HẠT THIỂU SỐ, THÀNH PHẦN DÒNG, ĐƯỜNG TẢI,
   KHUẾCH ĐẠI, γ·α_T·δ, HIỆU ỨNG EARLY, MỨC CAO & ΔE_g, DỒN DÒNG,
   ĐÁNH THỦNG, TẦN SỐ f_α VÀ CHUYỂN MẠCH
   - Mô phỏng vật lý trực quan bằng hạt (electron, lỗ trống, ion cố định, vòng tái hợp / thác lũ),
     khối BJT 3D, đồng hồ kim — KHÔNG đồ thị, KHÔNG sơ đồ.
   - 3D xoay bằng chuột (kéo = xoay, lăn = thu phóng, nhấp đôi = về mặc định); phim tự động (nút ▶ góc trên phải):
     camera zoom thẳng vào vùng cốt lõi rồi bám theo hạt được theo dõi; bước nào đổi vùng thì tạm ẩn hạt và nhìn vào vùng đang đổi.
     Space / nhấp để tạm dừng, lăn chuột tua phim. Có thanh Tốc độ và Số hạt.
   - Đủ 11 tab ứng 1–1 với 11 mỏ neo "Mô hình tương tác" trong Buổi 12:
       1.3 · Phân bố e⁻ cơ sở | 1.5 · Thành phần dòng | 2.3 · Đường tải | 2.5 · Khuếch đại
       3.5 · γ·α_T·δ          | 4.2 · Early            | 4.5 · Mức cao & ΔE_g
       4.7 · Dồn dòng         | 4.10 · Đánh thủng      | 6.2 · Tần số f_α | 7.3 · Chuyển mạch
   - API: LabB12.open(tabId?, panelIndex?, patch?)  LabB12.close()  LabB12.mark(root)  LabB12.film(tabId?, at?)
   ========================================================================== */
(function () {
'use strict';
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

let CAM = null;
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
  if (CAM && r > 3.5 && r < 6) r *= Math.pow(CAM.zoom, 0.6);   // electron to dần khi zoom cận cảnh
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
  if (CAM) { ctx.save(); ctx.globalAlpha = 0.88; ctx.fillStyle = C.bg; rr(ctx, cx - 54, cy - r - 20, 108, r + 42, 8); ctx.fill(); ctx.restore(); }
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
const newCam = () => ({ yaw: 0, sy: 0.28, zoom: 1, fx: 0.5, fy: 0.5, fz: 0.5, follow: 0, px: 0, py: 0, mx: 0, my: 0, bb: null, nb: null, o: null, cs: 1, sn: 0, zk: 1 });
const camCtr = c => c.bb ? [(c.bb.x0 + c.bb.x1) / 2, (c.bb.y0 + c.bb.y1) / 2, (c.bb.z0 + c.bb.z1) / 2] : [0, 0, 0];
function camProj(c, ox, oy, x, y, z) {
  const m = camCtr(c), dx = x - m[0], dy = y - m[1], dz = z - m[2];
  const rx = dx * c.cs - dy * c.sn, ry = dx * c.sn + dy * c.cs, k = 1.118 * c.zoom;   // chiếu trực giao thật: xoay quanh trục z rồi nghiêng
  return [ox + m[0] - m[1] * 0.5 + k * rx, oy + m[1] * 0.28 - m[2] + k * (ry * c.sy - dz * c.zk)];
}
function beginCam(c, W, H) {
  if (c.nb) c.bb = c.nb;
  c.nb = null;
  const th = c.yaw + 0.4636; c.cs = Math.cos(th); c.sn = Math.sin(th); c.zk = Math.sqrt(1 - c.sy * c.sy) * 1.04;
  c.px = 0; c.py = 0;
  if (c.bb && c.o) {     // luôn đưa tâm hình chiếu của khối vào chính giữa khung
    const bb = c.bb; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let i = 0; i < 8; i++) {
      const q = camProj(c, c.o[0], c.o[1], i & 1 ? bb.x1 : bb.x0, i & 2 ? bb.y1 : bb.y0, i & 4 ? bb.z1 : bb.z0);
      if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
    }
    c.px = W * 0.5 - (x0 + x1) / 2; c.py = H * 0.54 - (y0 + y1) / 2;
    if (c.auto && c.gm) { const f0 = camFU(c, c.auto(c.gm.g)); if (f0) { c.fx = f0[0]; c.fy = f0[1]; c.fz = f0[2]; } }
    if (c.follow > 0) {
      const b = c.bb, s = camProj(c, c.o[0], c.o[1], b.x0 + (b.x1 - b.x0) * c.fx, b.y0 + (b.y1 - b.y0) * c.fy, b.z0 + (b.z1 - b.z0) * c.fz);
      c.px = lerp(c.px, W * 0.5 - s[0], c.follow); c.py = lerp(c.py, H * 0.46 - s[1], c.follow);
    }
  }
}
function camExtend(c, x0, x1, y0, y1, z0, z1) {
  const b = c.nb || (c.nb = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9 });
  if (x0 < b.x0) b.x0 = x0; if (x1 > b.x1) b.x1 = x1;
  if (y0 < b.y0) b.y0 = y0; if (y1 > b.y1) b.y1 = y1;
  if (z0 < b.z0) b.z0 = z0; if (z1 > b.z1) b.z1 = z1;
}
function isoP(ox, oy, x, y, z) {
  const c = CAM;
  if (!c) return [ox + x - y * 0.50, oy + y * 0.28 - z];
  c.o = [ox, oy];
  const p = camProj(c, ox, oy, x, y, z);
  return [p[0] + c.px, p[1] + c.py];
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
  const c = CAM, a = al == null ? 1 : al, sc = strokeCol || C.sub;
  if (c) camExtend(c, Math.min(x, x + dx), Math.max(x, x + dx), Math.min(y, y + dy), Math.max(y, y + dy), Math.min(z, z + dz), Math.max(z, z + dz));
  const P = (i, j, k) => isoP(ox, oy, x + dx * i, y + dy * j, z + dz * k);
  const FACES = [ // [nx, ny, nz, điểm...]
    [0, 1, 0, [0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], [0, -1, 0, [0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
    [1, 0, 0, [1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], [-1, 0, 0, [0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]],
    [0, 0, -1, [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], [0, 0, 1, [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]
  ];
  const cs = c ? c.cs : 1, sn = c ? c.sn : 0, kz = c ? c.sy / Math.sqrt(1 - c.sy * c.sy) : 0.29;
  FACES.forEach(f => {
    const rx = f[0] * cs - f[1] * sn, ry = f[0] * sn + f[1] * cs;
    if (ry + f[2] * kz <= 0) return;           // mặt quay lưng với người xem
    const pts = f.slice(3).map(q => P(q[0], q[1], q[2]));
    if (f[2] === 1) { polyFill(ctx, pts, col, a, sc, 1.1); return; }
    polyFill(ctx, pts, col, a >= 1 ? 1 : a * 0.85, sc, 1);
    polyFill(ctx, pts, '#000', a * (0.16 + 0.18 * Math.max(0, rx)));
  });
}


/* ---------- hạt bên trong khối 3D ---------- */
function p3(ctx, ox, oy, x, y, z, r, col, sg) {
  const q = isoP(ox, oy, x, y, z);
  dot(ctx, q[0], q[1], r, col);
  if (sg && CAM && CAM.zoom > 1.3) txt(ctx, sg, q[0], q[1] + 0.5, C.bg, 8, 'center', 800);
  return q;
}
function i3(ctx, ox, oy, x, y, z, sg, col) {
  const q = isoP(ox, oy, x, y, z);
  drawIon(ctx, q[0], q[1], sg, col, 3.8);
}
/* lưới ion cố định trong hộp [x0,x0+w]×[y0,y0+d]×[z0,z0+h] */
function ions3(ctx, ox, oy, x0, y0, w, d, z0, h, sg, col, nx, ny) {
  const nl = Math.floor(h / 15);
  for (let k = 0; k < nl; k++) for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++)
    i3(ctx, ox, oy, x0 + (i + 0.5) * w / nx, y0 + (j + 0.5) * d / ny, z0 + (k + 0.5) * h / nl, sg, col);
}
/* bầy hạt chuyển động nhiệt trong hộp đơn vị, pool cố định nmax */
function swarm(st, key, nmax, t, sp) {
  let s = st[key];
  if (!s) s = st[key] = { t, a: Array.from({ length: nmax }, () => ({ u: Math.random(), v: Math.random(), w: Math.random(), x: gauss(), y: gauss(), z: gauss() })) };
  const dt = clamp(t - s.t, 0, 0.05); s.t = t;
  s.a.forEach(q => {
    if (Math.random() < dt * 3) { q.x = gauss(); q.y = gauss(); q.z = gauss(); }
    const kk = 1 - Math.exp(-dt * 4); q.vx = (q.vx == null ? q.x : q.vx) + (q.x - (q.vx == null ? q.x : q.vx)) * kk; q.vy = (q.vy == null ? q.y : q.vy) + (q.y - (q.vy == null ? q.y : q.vy)) * kk; q.vz = (q.vz == null ? q.z : q.vz) + (q.z - (q.vz == null ? q.z : q.vz)) * kk;
    q.u += q.vx * sp * dt; q.v += q.vy * sp * dt; q.w += q.vz * sp * dt;
    if (q.u < 0.04) { q.u = 0.04; q.x = Math.abs(q.x); } else if (q.u > 0.96) { q.u = 0.96; q.x = -Math.abs(q.x); }
    if (q.v < 0.04) { q.v = 0.04; q.y = Math.abs(q.y); } else if (q.v > 0.96) { q.v = 0.96; q.y = -Math.abs(q.y); }
    if (q.w < 0.04) { q.w = 0.04; q.z = Math.abs(q.z); } else if (q.w > 0.96) { q.w = 0.96; q.z = -Math.abs(q.z); }
  });
  return s.a;
}
/* điện tích cổng: n×m dấu trên mặt trên của cổng */
function gateQ3(ctx, ox, oy, x0, y0, w, d, z, sg, col, nx, ny) {
  if (!sg) return;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const q = isoP(ox, oy, x0 + (i + 0.5) * w / nx, y0 + (j + 0.5) * d / ny, z);
    txt(ctx, sg, q[0], q[1], col, 12, 'center', 800);
  }
}


/* ==========================================================================
   MÔ HÌNH VẬT LÝ ĐIỐT p-n DÙNG CHUNG (số liệu + hình học hiển thị + bộ mô phỏng hạt tải)
   ========================================================================== */
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


/* ==========================================================================
   ĐỘNG CƠ MÔ PHỎNG BJT: hình học E|B|C, hạt tải chạy E → B → C, khung 3D (camera chuột) và dải 2D bên trong
   ========================================================================== */
let GS = { spd: 0.5, cnt: 0.3 }, GT = '', CALM = false;
const cF = () => Math.min(1.6, GS.cnt * 2), sF = () => GS.spd * 1.2;
const lgx = x => Math.log10(Math.max(1e-40, Math.abs(x)));

/* hình học hiển thị (đơn vị "du": thanh dài 1): emitter | cơ sở | collector + 2 vùng nghèo */
function bgeom(o) {
  o = o || {};
  const fB = o.fB != null ? o.fB : 0.2, jE = o.jE != null ? o.jE : 0.3, jC = jE + fB;
  const dEe = o.dEe != null ? o.dEe : 0.006, dEb = o.dEb != null ? o.dEb : 0.018;
  const dCb = Math.min(o.dCb != null ? o.dCb : 0.03, fB * 0.97 - dEb), dCc = o.dCc != null ? o.dCc : 0.07;
  return { jE, jC, fB, dEe, dEb, dCb, dCc, len: 1, d0: jE - dEe, d1: jE + dEb, c0: jC - dCb, c1: jC + dCc, bs: jE + dEb, be: jC - dCb, jx: (jE + jC) / 2, ne: jE, pe: jE };
}
const isMinorB = (q, g) => q.k === 'e' ? (q.u > g.d1 && q.u < g.c0) : (q.u < g.d0 || q.u > g.c1);

/* ---- bộ mô phỏng hạt: electron phun từ emitter qua cơ sở sang collector; lỗ trống phun ngược; tái hợp; bão hòa; thác lũ ----
   Mỗi hạt có kết cục định sẵn: 'C' tới collector · 'R' tái hợp trong cơ sở · 'X' tái hợp trong vùng nghèo B–E
   'H' lỗ trống phun ngược vào emitter · 'P' lỗ trống từ cực B xuống bù · 'Q' lỗ trống ngược từ C · 'F' e⁻ từ C vào B (bão hòa) · 'K' lỗ trống từ B sang C · 'A' cặp thác lũ */
const SHARED = {};
const ex = (p, k) => p <= 0 ? 0 : Math.min(0.5, 0.035 + p * (k || 3));
function simB(st, key, t, dt, g, o) {
  const store = SHARED[GT || '_'] || (SHARED[GT || '_'] = {});
  const s = store[key] || (store[key] = { a: [], fl: [], c: [0, 0, 0, 0, 0], n: 0 });
  if (s.lt === t) return s; s.lt = t;
  if (CALM) { s.a.length = 0; s.fl.length = 0; s.trk = null; s.tl = null; s.tw = 0.4; return s; }
  dt = clamp(dt, 0, 0.06);
  const sp = (o.sp || 0.17) * GS.spd * 1.2, cf = cF(), vm = o.vm || {};
  const R = (o.R || 0) * (o.mod ? o.mod(t) : 1);
  const pX = ex(o.pX || 0, 4), pR = ex(o.pR || 0, 3), pH = o.pH != null ? clamp(ex(o.pH, 2), 0, 0.6) : 0;
  const rx = (a, b) => a + Math.random() * (b - a), exr = L => -L * Math.log(1 - Math.random() * 0.96);
  const add = q => { if (s.a.length < 300) { q.v = q.v == null ? Math.random() : q.v; q.w = q.w == null ? Math.random() : q.w; q.tr = []; q.ta = 0; s.a.push(q); } return q; };
  const mkE = (m) => {
    let tg = Math.min(g.len, g.c1 + 0.14);
    if (m === 'X') tg = rx(g.d0, g.d1); else if (m === 'R') tg = g.bs + (g.be - g.bs) * (0.15 + 0.8 * Math.random());
    return add({ k: 'e', u: Math.max(0.02, g.d0 - 0.08), dir: 1, tg, m });
  };
  const pickE = () => { const r = Math.random(); return r < pX ? 'X' : r < pX + pR ? 'R' : 'C'; };
  s.c[0] += R * dt * cf; s.c[1] += R * pH * dt * cf; s.c[2] += (o.rev || 0) * dt * cf; s.c[3] += (o.sat || 0) * dt * cf;
  while (s.c[0] >= 1) { s.c[0]--; const m = pickE(); const q = mkE(m); if (m === 'R') add({ k: 'h', u: q.tg, dir: 0, tg: 0.5, m: 'P', v: rx(0.25, 0.75), w: 1 }); }
  while (s.c[1] >= 1) { s.c[1]--; add({ k: 'h', u: g.bs + 0.01, dir: -1, tg: Math.max(0.02, g.d0 - exr(0.05)), m: 'H' }); }
  while (s.c[2] >= 1) { s.c[2]--; add({ k: 'h', u: Math.min(g.len - 0.02, g.c1 + exr(0.07)), dir: -1, tg: g.bs + 0.03, m: 'Q' }); }
  while (s.c[3] >= 1) { s.c[3]--; add({ k: 'e', u: g.len - 0.03, dir: -1, tg: g.bs + exr(0.05), m: 'F' }); add({ k: 'h', u: g.be - 0.01, dir: 1, tg: g.c1 + exr(0.05), m: 'K' }); }
  if (GT && !o.noTrk) {
    const seq = o.seq || ['C'];
    if (s.trk && !s.a.includes(s.trk)) { s.tl = [s.trk.u, s.trk.v, s.trk.w]; s.trk = null; s.tw = 0.7; }
    if (!s.trk) {
      s.tw = (s.tw == null ? 0 : s.tw) - dt;
      if (s.tw <= 0) {
        const m = seq[(s.n++) % seq.length]; let q;
        if (m === 'Q') q = add({ k: 'h', u: Math.min(g.len - 0.03, g.c1 + 0.05), dir: -1, tg: g.bs + 0.03, m: 'Q' });
        else if (m === 'H') q = add({ k: 'h', u: g.bs + 0.02, dir: -1, tg: Math.max(0.03, g.d0 - exr(0.045)), m: 'H' });
        else if (m === 'F') q = add({ k: 'e', u: g.len - 0.03, dir: -1, tg: g.bs + exr(0.05), m: 'F' });
        else q = mkE(m);
        q.v = 0.5; q.w = 0.5; s.trk = q;
        if (m === 'R') add({ k: 'h', u: q.tg, dir: 0, tg: 0.5, m: 'P', v: 0.5, w: 1 });
      }
    }
  }
  const sq = Math.sqrt(dt);
  const pairs = [];
  s.a = s.a.filter(q => {
    if (q.m === 'P') {
      q.cs = q.cs == null ? sp * 1.6 : q.cs; q.w -= q.cs * dt * 1.2;
      q.ta += dt * 8; if (q.ta > 0.5) { q.ta = 0; q.tr.push([q.u, q.v, q.w]); if (q.tr.length > 8) q.tr.shift(); }
      if (q.w <= 0.5) { s.fl.push({ u: q.u, v: q.v, w: 0.5, t0: t, big: 0 }); return false; }
      return true;
    }
    let v = sp;
    const x = q.u;
    if (x > g.d0 && x < g.d1) v = sp * 1.9 * (vm.j || 1);
    else if (x >= g.d1 && x <= g.c0) v = sp * (q.m === 'Q' || q.m === 'K' ? 0.8 : 0.5) * (vm.b || 1);
    else if (x > g.c0 && x < g.c1) v = sp * 2.2 * (vm.d || 1);
    else if (x <= g.d0) v = sp * (q.k === 'h' ? 0.55 : 1) * (vm.e || 1);
    else v = sp * (q.k === 'h' ? 0.6 : 1) * (vm.c || 1);
    q.cs = q.cs == null ? v : q.cs + (v - q.cs) * (1 - Math.exp(-dt * 5)); v = q.cs;
    q.u += q.dir * v * dt; q.ta += Math.abs(v * dt);
    if (q.ta > 0.008) { q.ta = 0; q.tr.push([q.u, q.v, q.w]); if (q.tr.length > (q === s.trk ? 22 : 9)) q.tr.shift(); }
    q.dv = (q.dv || 0) - q.dv * 2 * dt + gauss() * 0.5 * sq; q.dw = (q.dw || 0) - q.dw * 2 * dt + gauss() * 0.5 * sq;
    if (q === s.trk) { q.v = 0.5; q.w = 0.5; } else { q.v = clamp(q.v + q.dv * dt, 0.06, 0.94); q.w = clamp(q.w + q.dw * dt, 0.06, 0.94); }
    if (o.av && q.k === 'e' && (q.m === 'C' || q.m === 'A') && !q.ava && q.u > g.c0 && q.u < g.c1 && Math.random() < o.av * dt * 5 && s.a.length < 200) { q.ava = 1; pairs.push(q); }
    const done = q.dir < 0 ? q.u <= q.tg : q.u >= q.tg;
    if (done) {
      if (q.m !== 'C' && q.m !== 'A') s.fl.push({ u: q.u, v: q.v, w: q.w, t0: t, big: q.m === 'X' ? 1 : 0 });
      return false;
    }
    return true;
  });
  pairs.forEach(q => { s.fl.push({ u: q.u, v: q.v, w: q.w, t0: t, big: 1 }); add({ k: 'e', u: q.u, dir: 1, tg: Math.min(g.len, g.c1 + 0.14), m: 'A', v: q.v, w: q.w }); add({ k: 'h', u: q.u, dir: -1, tg: g.bs + 0.02, m: 'A', v: q.v, w: q.w }); });
  s.fl = s.fl.filter(f => t - f.t0 < 0.6 && t - f.t0 > -1);
  return s;
}

/* ---- khối BJT 3D: hộp đặc E | B | C, vùng nghèo trong suốt, ion, hạt nền, tiếp xúc ---- */
function scene3b(p, ctx, W, H, t, g, o) {
  o = o || {};
  const st = p.st;
  const bw = Math.min(W * 0.62, 500), bd = Math.min(112, H * 0.3), bh = Math.min(88, H * 0.27);
  const ox = W * 0.12, oy = H * 0.7, X = u => u * bw;
  const hot = o.heat ? clamp(o.heat, 0, 1) : 0;
  const slab = (ua, ub, col, al) => {
    isoBox(ctx, ox, oy, X(ua), 0, 0, X(ub) - X(ua), bd, bh, C.card, 1, C.sub);
    isoBox(ctx, ox, oy, X(ua), 0, 0, X(ub) - X(ua), bd, bh, col, al + hot * 0.2, hot > 0.05 ? C.err : C.sub);
  };
  slab(0, g.d0, C.c2, 0.62); slab(g.d0, g.jE, C.c2, 0.62);
  slab(g.d1, g.c0, C.c4, 0.62);
  slab(g.c1, g.len, C.c2, 0.5);
  if (o.slices) { const n = o.slices.n, wb = g.c0 - g.d1; for (let i = 0; i < n; i++) isoBox(ctx, ox, oy, X(g.d1 + wb * i / n), 0, 0, X(wb / n) + 0.4, bd, bh, C.c2, o.slices.fn((i + 0.5) / n), C.c2); }
  if (g.dEb > 0.002 || g.dEe > 0.002) isoBox(ctx, ox, oy, X(g.d0), 0, 0, X(g.d1) - X(g.d0), bd, bh, o.depCol || C.c5, 0.36, o.depCol || C.c5);
  if (g.dCb + g.dCc > 0.002) isoBox(ctx, ox, oy, X(g.c0), 0, 0, X(g.c1) - X(g.c0), bd, bh, o.depCol2 || o.depCol || C.c5, 0.36, o.depCol2 || o.depCol || C.c5);
  // tiếp xúc kim loại phía trên
  const pad = (ua, ub, col) => isoBox(ctx, ox, oy, X(ua), bd * 0.22, bh, X(ub) - X(ua), bd * 0.56, 6, col, 0.95, C.ink);
  pad(0.04, g.d0 - 0.02, C.sub); pad(g.d1 + 0.02, g.c0 - 0.01 > g.d1 + 0.04 ? g.c0 - 0.01 : g.d1 + 0.04, C.sub); pad(g.c1 + 0.05, g.len - 0.03, C.sub);
  const lab = (u, s, col) => { const q = isoP(ox, oy, X(u), bd / 2, bh + 16); txt(ctx, s, q[0], q[1], col, 12, 'center', 800); };
  lab(g.d0 / 2, 'E', C.c2); lab((g.d1 + g.c0) / 2, 'B', C.c4); lab((g.c1 + g.len) / 2, 'C', C.c2);
  // ion cố định trong vùng nghèo (p-n: B–E và B–C)
  const nl = Math.floor(bh / 18);
  const grid = (xa, xb, sg, col) => { const wd = X(xb) - X(xa); if (wd < 5) return; const nx = Math.max(1, Math.round(wd / 22)); for (let k = 0; k < nl; k++) for (let i = 0; i < nx; i++) for (let j = 0; j < 3; j++) i3(ctx, ox, oy, X(xa) + (i + 0.5) * wd / nx, (j + 0.5) * bd / 3, (k + 0.5) * bh / nl, sg, col); };
  grid(g.d0, g.jE, '+', C.err); grid(g.jE, g.d1, '−', C.c5); grid(g.c0, g.jC, '−', C.c5); grid(g.jC, g.c1, '+', C.err);
  // hạt nền (đa số)
  const nE = Math.round(10 * cF() + 2), nB = Math.round((o.nh != null ? o.nh : 10) * cF() + 2);
  swarm(st, 'se', 22, t, 0.22 * sF()).slice(0, nE).forEach(q => p3(ctx, ox, oy, 6 + q.u * (X(g.d0) - 12), 6 + q.v * (bd - 12), 5 + q.w * (bh - 10), 4.2, C.c2, '−'));
  swarm(st, 'sb', 22, t, 0.22 * sF()).slice(0, nB).forEach(q => p3(ctx, ox, oy, X(g.d1) + 4 + q.u * (X(g.c0) - X(g.d1) - 8), 6 + q.v * (bd - 12), 5 + q.w * (bh - 10), 4.2, C.c4, '+'));
  swarm(st, 'sc', 22, t, 0.22 * sF()).slice(0, nE).forEach(q => p3(ctx, ox, oy, X(g.c1) + 6 + q.u * (X(g.len) - X(g.c1) - 12), 6 + q.v * (bd - 12), 5 + q.w * (bh - 10), 4.2, C.c2, '−'));
  if (o.extraB) swarm(st, 'xb', 26, t, 0.2 * sF()).slice(0, Math.round(o.extraB * 26 * Math.min(1.2, cF()))).forEach(q => p3(ctx, ox, oy, X(g.d1) + 4 + q.u * (X(g.c0) - X(g.d1) - 8), 6 + q.v * (bd - 12), 5 + q.w * (bh - 10), 4.4, C.c2, '−'));
  if (o.extraC) swarm(st, 'xc', 26, t, 0.2 * sF()).slice(0, Math.round(o.extraC * 26 * Math.min(1.2, cF()))).forEach(q => p3(ctx, ox, oy, X(g.c1) + 6 + q.u * (X(g.len) - X(g.c1) - 12), 6 + q.v * (bd - 12), 5 + q.w * (bh - 10), 4.4, C.c5, '−'));
  if (CAM) CAM.gm = { bw, bd, bh, len: g.len, g };
  return { ox, oy, bw, bd, bh, X };
}
function marker3(ctx, sc, u, col, label, up) {
  const x = sc.X(u);
  isoBox(ctx, sc.ox, sc.oy, x - 1.5, 0, 0, 3, sc.bd, sc.bh, col, 0.45, col);
  const q = isoP(sc.ox, sc.oy, x, sc.bd / 2, sc.bh + (up || 30));
  txt(ctx, label, q[0], q[1], col, 10.5, 'center', 800);
}
function trail(ctx, pts, col) {
  const n = pts.length; if (n < 2) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 1; i < n; i++) { ctx.globalAlpha = 0.8 * Math.pow(i / n, 2.2); ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); }
  ctx.restore();
}
function flow3(ctx, sc, s, g, t) {
  const zf = CAM ? CAM.zoom : 1;
  if (CAM) CAM.tp = s.trk ? [s.trk.u, s.trk.v, s.trk.w] : (s.tl || null);
  const P3 = a => isoP(sc.ox, sc.oy, a[0] * sc.bw, 6 + a[1] * (sc.bd - 12), 5 + a[2] * (sc.bh - 10));
  s.a.forEach(q => {
    trail(ctx, q.tr.concat([[q.u, q.v, q.w]]).map(P3), q.k === 'e' ? C.c2 : C.c4);
    const c = P3([q.u, q.v, q.w]);
    if (isMinorB(q, g) && q.m !== 'P') { ctx.beginPath(); ctx.arc(c[0], c[1], 7 * Math.pow(zf, 0.6), 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 1.4; ctx.stroke(); }
    dot(ctx, c[0], c[1], 4.4, q.k === 'e' ? C.c2 : C.c4); if (zf > 1.3) txt(ctx, q.k === 'e' ? '−' : '+', c[0], c[1] + 0.5, C.bg, 8, 'center', 800);
    if (q === s.trk) {
      const r = 11 * Math.pow(zf, 0.6), pu = 1 + 0.18 * Math.sin(t * 5);
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.main; ctx.beginPath(); ctx.arc(c[0], c[1], r * 1.9 * pu, 0, TAU2); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.stroke();
    }
  });
  s.fl.forEach(f => {
    const a = clamp((t - f.t0) / 0.55, 0, 1), c = P3([f.u, f.v, f.w]);
    ctx.save(); ctx.globalAlpha = 1 - a; ctx.beginPath(); ctx.arc(c[0], c[1], (5 + a * (f.big ? 20 : 13)) * Math.pow(zf, 0.5), 0, TAU2);
    ctx.strokeStyle = f.big ? C.err : C.main; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  });
}
function gcol(ctx, W, H, items, ys) {
  const n = items.length;
  items.forEach((it, i) => {
    const y = ys ? ys[i] : H * (n === 1 ? 0.5 : 0.17 + 0.66 * i / (n - 1));
    drawMiniGauge(ctx, W - 64, y, 23, it[0], it[1], it[2], it[3], it[4]);
  });
}
function chipTop(ctx, W, s, col) { chip(ctx, s, W * 0.43, 15, col || C.main, 'center'); }

/* ---- dải 2D "kính hiển vi": cùng hạt, cùng quy luật với khối 3D ---- */
function stripB(ctx, W, H, t, g, o) {
  const st = o.st, pad = 14, x0 = pad, x1 = W - pad - (o.rt || 0), y0 = o.y0, y1 = o.y1, hh = y1 - y0;
  const MX = u => x0 + (u - o.u0) / (o.u1 - o.u0) * (x1 - x0);
  ctx.save(); rr(ctx, x0, y0, x1 - x0, hh, 8); ctx.clip();
  ctx.fillStyle = C.card; ctx.fillRect(x0, y0, x1 - x0, hh);
  const reg = (ua, ub, col, al) => { const a = clamp(MX(ua), x0, x1), b = clamp(MX(ub), x0, x1); if (b > a) { ctx.globalAlpha = al; ctx.fillStyle = col; ctx.fillRect(a, y0, b - a, hh); ctx.globalAlpha = 1; } };
  const hot = o.heat || 0;
  reg(-2, g.d0, hot > 0.05 ? C.err : C.c2, 0.16); reg(g.d1, g.c0, C.c4, 0.16); reg(g.c1, g.len + 2, hot > 0.05 ? C.err : C.c2, 0.1);
  if (o.slices) { const n = o.slices.n, wb = g.c0 - g.d1; for (let i = 0; i < n; i++) reg(g.d1 + wb * i / n, g.d1 + wb * (i + 1) / n + 0.002, C.c2, o.slices.fn((i + 0.5) / n) * 0.7); }
  reg(g.d0, g.d1, o.depCol || C.c5, 0.3); reg(g.c0, g.c1, o.depCol2 || o.depCol || C.c5, 0.3);
  const ion = (ua, ub, sg, col) => { const a = clamp(MX(ua), x0, x1), b = clamp(MX(ub), x0, x1); if (b - a < 6) return; const nx = Math.max(1, Math.round((b - a) / 22)), ny = Math.max(2, Math.round(hh / 34)); for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) drawIon(ctx, a + (i + 0.5) * (b - a) / nx, y0 + (j + 0.5) * hh / ny, sg, col, 4.6); };
  ion(g.d0, g.jE, '+', C.err); ion(g.jE, g.d1, '−', C.c5); ion(g.c0, g.jC, '−', C.c5); ion(g.jC, g.c1, '+', C.err);
  const amb = (key, ua, ub, col, sg, n) => {
    const a = clamp(MX(ua), x0, x1), b = clamp(MX(ub), x0, x1); if (b - a < 12) return;
    const nn = Math.max(2, Math.round(n * (b - a) / (x1 - x0) * 1.6 * cF()));
    swarm(st, key, 26, t, 0.22 * sF()).slice(0, Math.min(26, nn)).forEach(q => { const x = a + 6 + q.u * (b - a - 12), y = y0 + 6 + q.v * (hh - 12); dot(ctx, x, y, 4.8, col); txt(ctx, sg, x, y + 0.5, C.bg, 8.5, 'center', 800); });
  };
  amb('te', Math.max(o.u0, 0), g.d0, C.c2, '−', 20); amb('tb', g.d1, g.c0, C.c4, '+', 20); amb('tc', g.c1, Math.min(o.u1, g.len), C.c2, '−', 20);
  if (o.extraB) amb('txb', g.d1, g.c0, C.c2, '−', 20 * o.extraB);
  if (o.extraC) amb('txc', g.c1, Math.min(o.u1, g.len), C.c5, '−', 20 * o.extraC);
  if (o.fl) {
    const ym = q => q.m === 'P' ? y0 + (0.08 + 0.84 * (1 - q.w)) * hh : y0 + (0.08 + 0.84 * q.v) * hh;
    o.fl.a.forEach(q => {
      if (q.u < o.u0 || q.u > o.u1) return;
      const x = MX(q.u), y = ym(q), mn = isMinorB(q, g) && q.m !== 'P';
      trail(ctx, q.tr.concat([[q.u, q.v, q.w]]).map(a => [MX(a[0]), ym({ m: q.m, v: a[1], w: a[2] })]), q.k === 'e' ? C.c2 : C.c4);
      if (mn) { ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 1.5; ctx.stroke(); }
      dot(ctx, x, y, 5, q.k === 'e' ? C.c2 : C.c4); txt(ctx, q.k === 'e' ? '−' : '+', x, y + 0.5, C.bg, 9, 'center', 800);
      if (q === o.fl.trk) {
        ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.main; ctx.beginPath(); ctx.arc(x, y, 19 * (1 + 0.18 * Math.sin(t * 5)), 0, TAU2); ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.stroke();
      }
    });
    o.fl.fl.forEach(f => {
      if (f.u < o.u0 || f.u > o.u1) return;
      const a = clamp((t - f.t0) / 0.55, 0, 1), y = y0 + (0.08 + 0.84 * f.v) * hh;
      ctx.save(); ctx.globalAlpha = 1 - a; ctx.beginPath(); ctx.arc(MX(f.u), y, 6 + a * (f.big ? 24 : 15), 0, TAU2); ctx.strokeStyle = f.big ? C.err : C.main; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    });
  }
  ctx.restore();
  rr(ctx, x0, y0, x1 - x0, hh, 8); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
  [['E', (Math.max(o.u0, 0) + g.d0) / 2, C.c2], ['B', (g.d1 + g.c0) / 2, C.c4], ['C', (g.c1 + Math.min(o.u1, g.len)) / 2, C.c2]].forEach(r => { const x = MX(r[1]); if (x > x0 + 6 && x < x1 - 6) txt(ctx, r[0], x, y0 + 11, r[2], 11, 'center', 800); });
  return { MX, x0, x1, y0, y1 };
}
function stripMark(ctx, s, u, col, label, dash) {
  const x = s.MX(u); if (x < s.x0 || x > s.x1) return;
  ln(ctx, x, s.y0, x, s.y1, col, 1.8, dash === false ? null : [5, 4]);
  txt(ctx, label, x + 3, s.y0 + 22, col, 10, 'left', 800);
}
/* ---- camera phim ---- */
function camFU(c, u, fy, fz) {
  const gm = c.gm, bb = c.bb; if (!gm || !bb) return null;
  return [clamp((u * gm.bw - bb.x0) / (bb.x1 - bb.x0), 0, 1), fy == null ? 0.5 : fy, fz == null ? 0.5 : fz];
}
function camTracer(c) {
  const gm = c.gm, bb = c.bb, tp = c.tp; if (!gm || !bb || !tp) return null;
  return [clamp((tp[0] * gm.bw - bb.x0) / (bb.x1 - bb.x0), 0, 1), 0.5, 0.5];
}
const atU = fn => prog => { const c = film.p.cam; return c.gm ? camFU(c, fn(c.gm.g, prog)) : null; };
const atT = () => () => camTracer(film.p.cam);


/* ---------- PHIM TỰ ĐỘNG: camera bám theo hạt "theo dõi", hoặc dừng ở vùng đang thay đổi (hạt bay qua tạm ẩn) ---------- */
const V = (yaw, tilt, zoom, f) => ({ yaw, tilt, zoom, f });
const SNAPK = ['bgn', 'mode', 'nf'];
const ST = (d, cap, zoom, track, extra) => Object.assign({ d, cap, v: V(0, 20, zoom), track, mv: 0.35, slow: 0.7 }, extra || {});
const CH = (d, cap, zoom, track, set) => ST(d, cap, zoom, track, { calm: true, set });
const jx = atU(g => g.jx), jE = atU(g => g.jE), jC = atU(g => g.jC), baseC = atU(g => (g.d1 + g.c0) / 2);
const TOPC = (d, cap, zoom, track, set) => TOP(d, cap, zoom, track, { calm: true, set });
const TOP = (d, cap, zoom, track, extra) => ST(d, cap, zoom, track, Object.assign({ v: V(0, 62, zoom) }, extra || {}));
const FILM = {
  base: [
    ST(9, 'Cơ sở mỏng (x_B = 0,8 µm ≪ L_B): hai bên là emitter n⁺⁺ và collector. Dải sọc xanh dương trong cơ sở đậm nhạt theo nồng độ electron n_B(x).', 4.0, baseC, { set: { VBE: 0.65, VBC: -2, xB: 0.8, LB: 10 } }),
    ST(15, 'Theo dõi một electron (quầng sáng): qua vùng nghèo B–E, vào cơ sở thành hạt thiểu số (viền vàng), khuếch tán rồi bị điện trường B–C quét nhanh sang collector. Hầu hết đều tới được collector.', 3.2, atT()),
    CH(8, 'Kéo dài cơ sở (x_B = 12 µm, L_B = 6 µm): nhìn vào cơ sở — nó giãn ra, dải sọc nhạt dần mạnh về phía collector.', 3.0, baseC, { xB: 12, LB: 6 }),
    ST(15, 'Cơ sở dài: electron phải đi rất xa nên nhiều hạt tái hợp (vòng sáng) với lỗ trống giữa đường, α_T tụt, dòng I_C giảm.', 2.6, atT())
  ],
  comp: [
    ST(9, 'Phun thuận V_BE = 0,65 V: dòng emitter gồm ba nhóm hạt — electron phun (i_E1), lỗ trống phun ngược (i_E2) và electron tái hợp trong cơ sở.', 3.4, jE, { set: { VBE: 0.65, r2: 0.004, rb: 0.005 } }),
    ST(18, 'Theo dõi lần lượt: electron tới collector (i_C) · lỗ trống phun ngược vào emitter (i_E2 = i_Ba) · electron tái hợp trong cơ sở, lỗ trống từ cực B xuống bù (i_Bb).', 3.0, atT()),
    CH(8, 'Tăng V_BE thêm 60 mV: vùng nghèo B–E co lại, mọi dòng đều tăng gấp mười.', 3.4, jE, { VBE: 0.71 }),
    ST(12, 'Dòng hạt dày gấp mười nhưng tỉ lệ các nhóm hầu như giữ nguyên — nên α, β gần như hằng số.', 3.0, atT())
  ],
  mode: [
    ST(8, 'Ngắt (I_B = 0): B–E không phun, cả hai vùng nghèo rộng — không có hạt nào chạy qua cơ sở, I_C = 0.', 3.4, jx, { set: { IB: 0, VCC: 10, RC: 2, beta: 100 } }),
    CH(8, 'Tăng I_B lên 20 µA: nhìn vào các vùng nghèo — B–E co lại để phun được, B–C vẫn ngược.', 3.4, jx, { IB: 20 }),
    ST(14, 'Thuận tích cực: electron phun, qua cơ sở rồi bị quét sang collector — chạy một chiều, I_C = β·I_B.', 3.0, atT()),
    CH(9, 'Tăng I_B lên 60 µA (bão hòa): vùng nghèo B–C sụp xuống vì tiếp giáp B–C cũng thuận.', 3.4, jC, { IB: 60 }),
    ST(14, 'Bão hòa: electron từ collector chạy ngược vào cơ sở, lỗ trống chạy sang collector — dòng bị đường tải chặn, không còn I_C = β·I_B.', 3.0, atT())
  ],
  amp: [
    ST(10, 'Điểm làm việc đẹp: V_BE tĩnh 0,65 V cộng tín hiệu ±10 mV. Nhìn dòng hạt phun lúc dày lúc thưa theo nhịp v_i, ba kim đảo nhịp theo.', 3.2, jE, { set: { VBEQ: 0.65, vi: 10, RC: 4 } }),
    ST(14, 'Theo dõi một electron: mỗi nhịp v_BE tăng nhẹ, số hạt phun tăng rất nhiều (hàm mũ) nên i_C đổi lớn, v_o đổi ngược pha.', 3.0, atT()),
    CH(8, 'Quá kích: V_BE tĩnh 0,70 V, biên độ 30 mV — nhìn vùng B–C khi i_C chạm đường tải.', 3.2, jC, { VBEQ: 0.7, vi: 30 }),
    ST(10, 'Đỉnh dòng bị đường tải chặn: transistor bão hòa nên v_o bị cắt đỉnh, tín hiệu méo.', 3.0, jx)
  ],
  gain: [
    ST(9, 'Ví dụ 3.1: dòng emitter "rò" ở ba chỗ — lỗ trống phun ngược (1−γ), tái hợp cơ sở (1−α_T), tái hợp vùng nghèo (1−δ). Phần rò được phóng đại để thấy.', 3.2, jE, { set: { NE: 3.02e17, NB: 1e15, xB: 0.8, LB: 10, VBE: 0.8 } }),
    ST(24, 'Theo dõi lần lượt năm hạt: tới collector · lỗ trống phun ngược (γ) · tái hợp trong cơ sở (α_T) · tái hợp vùng nghèo (δ, vòng đỏ) · tới collector.', 3.0, atT()),
    CH(8, 'Pha emitter nhẹ hơn (N_E = 10¹⁷ gần N_B): γ tụt — nhìn vào B–E, lỗ trống phun ngược nhiều lên.', 3.2, jE, { NE: 1e17 }),
    ST(14, 'Lỗ trống phun ngược vào emitter xuất hiện thường xuyên hơn — hạt rò (1−γ) lớn, β giảm.', 3.0, atT())
  ],
  early: [
    ST(9, 'V_CB = 4 V: vùng nghèo B–C (xanh lá) mới lấn nhẹ vào cơ sở; bề rộng trung hòa x_B còn gần x_B0.', 3.6, baseC, { set: { VCB: 4, xB0: 1.0, NB: 1e16 } }),
    CH(8, 'Tăng V_CB lên 16 V: nhìn mép collector — vùng nghèo B–C lấn sâu vào cơ sở, x_B co lại.', 3.6, jC, { VCB: 16 }),
    ST(14, 'Cơ sở hẹp hơn: electron được theo dõi băng qua nhanh hơn, gradient nồng độ dốc hơn nên I_C tăng — đó là hiệu ứng Early.', 3.0, atT())
  ],
  hl: [
    ST(9, 'Hẹp vùng cấm BẬT: emitter pha tạp nặng (10¹⁹) làm lỗ trống phun ngược vào emitter nhiều lên so với electron.', 3.2, jE, { set: { bgn: 'on', NE: 1e19, NB: 1e16, VBE: 0.6 } }),
    ST(15, 'Theo dõi electron và lỗ trống ngược: đa số electron tới collector nhưng hạt lỗ trống chạy ngược (1−γ) xuất hiện đáng kể.', 3.0, atT()),
    CH(9, 'Tăng V_BE lên 0,82 V: nhìn vào cơ sở — electron phun dư (xanh dương) ngày càng dày, vượt dần lỗ trống đa số N_B.', 3.2, baseC, { VBE: 0.82 }),
    ST(12, 'Phun mức cao: electron dư trong cơ sở đông ngang nồng độ pha tạp, β tụt.', 3.0, baseC)
  ],
  crowd: [
    TOP(9, 'Emitter một ngón nhìn từ trên (20 µm): các ô xanh dương nhạt ở giữa, đỏ ở hai mép — electron phun xuống cơ sở nhiều nhất ở mép.', 2.6, atU(() => 0.5), { set: { wE: 20, Rsb: 10000, I: 30, nf: 1 } }),
    TOP(15, 'Theo dõi electron rơi ở mép ngón: điện áp rơi ngang trên điện trở cơ sở làm mép bị kích mạnh hơn giữa, hạt phun dồn ra mép (vòng đỏ).', 3.0, atT()),
    TOPC(8, 'Chia emitter thành 4 ngón: nhìn lại cấu trúc — nhiều mép hơn, mỗi ngón hẹp hơn nên dồn dòng yếu đi.', 2.6, atU(() => 0.5), { nf: 4 }),
    TOP(12, 'Mỗi ngón hẹp có dòng gần đều: hạt rơi ở giữa cũng nhiều ngang mép.', 2.8, atT())
  ],
  brk: [
    ST(9, 'Xuyên thấu, V_CB = 30 V: vùng nghèo B–C đã lấn đáng kể vào cơ sở nhưng vẫn còn một dải cơ sở trung hòa.', 3.4, jC, { set: { mode: 'pt', VCB: 30, xBO: 0.8, NB: 1e16, beta: 100 } }),
    CH(9, 'Tăng V_CB lên 80 V: vùng nghèo B–C lấn thẳng tới vùng nghèo B–E — nhìn vào cơ sở, dải trung hòa biến mất.', 3.4, jC, { VCB: 80 }),
    ST(14, 'Hết cơ sở trung hòa: rào B–E bị hạ, electron từ emitter chạy thẳng sang collector, thác lũ nhân đôi hạt (vòng đỏ lớn).', 3.0, atT()),
    ST(12, 'Chuyển sang I_CEO (cơ sở hở): lỗ trống ngược từ collector chui vào cơ sở làm B dương hơn E, B–E thuận và phun electron.', 3.2, jC, { set: { mode: 'ceo', VCB: 20 } }),
    ST(15, 'Theo dõi lỗ trống I_CBO đi ngược từ collector vào cơ sở: mỗi lỗ trống kéo theo cỡ β electron phun, nên I_CEO ≈ β·I_CBO.', 3.0, atT())
  ],
  fa: [
    ST(9, 'Bốn chặng của electron: nạp C_je (τ_e), bay qua cơ sở (τ_b), bay qua vùng nghèo collector (τ_d), nạp C_C (τ_c). Hạt chậm ở chặng nào có τ lớn.', 2.4, jx, { set: { te: 4, tb: 12, td: 3, tc: 1, logF: 9 } }),
    ST(14, 'Theo dõi một electron: chạy chậm nhất ở cơ sở (chặng dài nhất, nút cổ chai), lao nhanh qua vùng nghèo collector.', 2.6, atT()),
    CH(8, 'Rút ngắn τ_b còn một nửa: nhìn vào cơ sở — thời gian bay giảm, tổng τ_ec giảm, f_α tăng.', 2.6, jx, { tb: 6 }),
    ST(12, 'Electron băng qua cơ sở nhanh gần gấp đôi: đây là cách tăng tần số cắt f_α.', 2.6, atT())
  ],
  sw: [
    ST(10, 'BJT đóng cắt tuần hoàn: xung dòng cơ sở bật rồi tắt. Bốn đèn pha t_d · t_r · t_s · t_f ở góc trái sáng lần lượt; electron chỉ phun khi có xung.', 3.0, jx, { set: { k: 3, m: 0.5 } }),
    ST(15, 'Theo dõi electron khi có xung: điện tích tích trữ trong cơ sở (xanh dương) tăng dần (t_d rồi t_r); dư dòng cơ sở đẩy transistor vào bão hòa.', 3.0, atT()),
    CH(9, 'Quá kích sâu I_B1 = 8×: nhìn vào cơ sở và collector — điện tích dư Q_BX (xanh lá) tràn sang collector.', 3.0, jC, { k: 8, m: 0 }),
    ST(14, 'Khi tắt xung, Q_BX phải được rút hết (t_s) trước khi I_C giảm: đây là thời gian lưu trữ — thành phần chậm nhất.', 2.8, atU(g => (g.jC + g.len) / 2))
  ]
};
const NOCAM = new Set();
const THREE = new Set(['base', 'comp', 'mode', 'amp', 'gain', 'early', 'hl', 'crowd', 'brk', 'fa', 'sw']);


/* ==========================================================================
   11 THÍ NGHIỆM BJT — mỗi tab: khối 3D (camera chuột) + khung bên trong (cùng hạt, cùng quy luật)
   ========================================================================== */
const LABS = [];
const LAY = { cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"' };
const frI = I => clamp((lg10(Math.abs(I)) + 9) / 8, 0, 1);
const rateI = I => 0.9 + 2.5 * frI(I);
const needle = (l, v, f, col, dg) => [l, v, clamp(f, 0, 1), col, dg];

/* tạo tab dùng chung: cfg(S, t) → { g, so (tuỳ chọn mô phỏng), sc (tuỳ chọn khung 3D), gs (đồng hồ), chip, st (tuỳ chọn dải), lines } */
function mkTab(meta, cfg, ctrls3, ctrlsC, titleC) {
  return Object.assign({}, meta, LAY, {
    panels: [
      {
        title: meta.title3, area: 'a', anim: true, ctrls: ctrls3,
        draw(p, ctx, W, H, t, dt) {
          const c = cfg(p.S, t), fl = simB(p.st, 'fl', t, dt, c.g, c.so);
          const sc = scene3b(p, ctx, W, H, t, c.g, c.sc || {});
          if (c.over) c.over(ctx, sc, t, p, c);
          flow3(ctx, sc, fl, c.g, t);
          gcol(ctx, W, H, c.gs);
          chipTop(ctx, W, c.chip[0], c.chip[1]);
        }
      },
      {
        title: titleC, area: 'c', anim: true, ctrls: ctrlsC,
        draw(p, ctx, W, H, t, dt) {
          const c = cfg(p.S, t), fl = simB(p.st, 'fl', t, dt, c.g, c.so);
          const so = Object.assign({ st: p.st, u0: 0, u1: 1, y0: 24, y1: H - 30, fl, rt: 0 }, c.st || {});
          const s = stripB(ctx, W, H, t, c.g, so);
          if (c.stOver) c.stOver(ctx, s, t, c);
          txt(ctx, c.line[0], W / 2, H - 13, c.line[1] || C.ink, 10.5, 'center', 700);
        }
      }
    ]
  });
}
const cdep = VBC => Math.min(0.05, 0.012 + 0.016 * Math.sqrt(Math.max(0, -VBC) + 0.6));
const slicesOf = P => ({ n: 10, fn: u => 0.08 + 0.78 * clamp(P.n(u) / P.nmax, 0, 1) });

/* ---------- 1. MỤC 1.3 — PHÂN BỐ ELECTRON THIỂU SỐ TRONG CƠ SỞ ---------- */
LABS.push(mkTab({
  id: 'base', tag: '1.3', name: 'Phân bố e⁻ cơ sở', sec: 1, S: { VBE: 0.65, VBC: -2.0, xB: 0.8, LB: 10 },
  title3: 'Thực tế 3D: Khối BJT npn — electron phun từ emitter khuếch tán qua cơ sở; dải sọc đậm nhạt = nồng độ n_B(x)'
}, (S) => {
  const P = baseProf(S.VBE, S.VBC, S.xB, S.LB, 1e16), md = bjtMode(S.VBE, S.VBC), dc = cdep(S.VBC), fB = fBof(S.xB);
  const g = bgeom({ fB, dEb: S.VBE > 0.4 ? 0.008 : 0.016, dCb: Math.min(dc * 0.45, fB * 0.4), dCc: dc });
  const on = S.VBE > 0.3;
  return {
    g, so: { R: on ? rateI(P.IC) : 0, pR: Math.max(0, 1 - P.aT), seq: ['C', 'C', 'R', 'C'], noTrk: !on },
    sc: { slices: slicesOf(P) }, st: { slices: slicesOf(P) },
    gs: [needle('Dòng I_C', fmtCur(P.IC), frI(P.IC), C.main), needle('n_B(0)', sci(P.n(0), 1), (lg10(P.n(0)) - 4) / 14, C.c2), needle('α_T', P.aT.toFixed(3), (P.aT - 0.5) / 0.5, C.c3)],
    chip: ['Chế độ: ' + md.label + ' · x_B/L_B = ' + (S.xB / S.LB).toFixed(2), md.k === 'fa' ? C.main : C.c5],
    line: [S.xB / S.LB < 0.3 ? 'Cơ sở mỏng: dải sọc gần đều — hầu hết electron tới collector' : 'Cơ sở dài: dải nhạt dần mạnh — nhiều electron tái hợp giữa đường', S.xB / S.LB < 0.3 ? C.c5 : C.err]
  };
}, [
  { k: 'VBE', l: 'V_BE', min: 0, max: 0.85, step: 0.01, f: fmtV },
  { k: 'VBC', l: 'V_BC', min: -5, max: 0.7, step: 0.05, f: fmtV },
  { k: 'xB', l: 'x_B', min: -1, max: 1.08, step: 0.02, log: 1, f: fmtUm },
  { k: 'LB', l: 'L_B', min: 2, max: 30, step: 1, f: v => v + ' µm' },
  { btn: 'Cơ sở mỏng', fn: p => { p.S.xB = 0.8; p.S.LB = 10; p.syncCtrls(); p.dirty = true; } },
  { btn: 'Cơ sở dài', fn: p => { p.S.xB = 12; p.S.LB = 6; p.syncCtrls(); p.dirty = true; } }
], null, 'Bên trong (E → B → C): cùng các hạt như khối 3D — electron phun, khuếch tán trong cơ sở, tái hợp hoặc bị quét sang collector'));

/* ---------- 2. MỤC 1.5 — THÀNH PHẦN DÒNG ---------- */
LABS.push(mkTab({
  id: 'comp', tag: '1.5', name: 'Thành phần dòng', sec: 1, S: { VBE: 0.65, r2: 0.004, rb: 0.005 },
  title3: 'Thực tế 3D: Dòng emitter gồm e⁻ phun (i_E1) và lỗ trống phun ngược (i_E2); e⁻ tái hợp ở cơ sở được bù bởi lỗ trống từ cực B (i_Bb)'
}, (S) => {
  const K = compCalc(S), g = bgeom({ fB: 0.2, dCb: 0.03, dCc: 0.05 });
  return {
    g, so: { R: rateI(K.IC), pH: K.iE2 / K.iE1, pR: K.rb || S.rb, seq: ['C', 'H', 'C', 'R', 'C'] },
    gs: [needle('i_E', fmtCur(K.iE), frI(K.iE), C.c2), needle('i_B', fmtCur(K.iB), frI(K.iB), C.c4), needle('i_C', fmtCur(K.IC), frI(K.IC), C.c1)],
    chip: ['α = ' + K.alpha.toFixed(4) + ' · β = ' + K.beta.toFixed(1) + ' · mọi thành phần ∝ exp(V_BE/V_t)', C.main],
    line: ['Phần hiếm: lỗ trống chạy ngược (i_Ba) và electron tái hợp (i_Bb) — hai thành phần của dòng cơ sở (phóng đại để thấy)', C.mut]
  };
}, [
  { k: 'VBE', l: 'V_BE', min: 0.45, max: 0.80, step: 0.005, f: v => v.toFixed(3) + ' V' },
  { k: 'r2', l: 'I_S2/I_S', min: 0.001, max: 0.05, step: 0.001, f: v => (v * 100).toFixed(1) + ' %' },
  { k: 'rb', l: 'Tái hợp cơ sở', min: 0.001, max: 0.05, step: 0.001, f: v => (v * 100).toFixed(1) + ' %' },
  { btn: '+60 mV', fn: p => { p.S.VBE = Math.min(0.8, p.S.VBE + 0.06); p.syncCtrls(); p.dirty = true; } },
  { btn: 'Đặt lại', fn: p => { p.S.VBE = 0.65; p.S.r2 = 0.004; p.S.rb = 0.005; p.syncCtrls(); p.dirty = true; } }
], null, 'Bên trong: cùng hạt — vòng sáng vàng là tái hợp, hạt viền vàng là hạt thiểu số'));

/* ---------- 3. MỤC 2.3 — NGẮT · THUẬN TÍCH CỰC · BÃO HÒA ---------- */
LABS.push(mkTab({
  id: 'mode', tag: '2.3', name: 'Đường tải', sec: 2, S: { IB: 20, VCC: 10, RC: 2, beta: 100 },
  title3: 'Thực tế 3D: Ba chế độ làm việc — ngắt (không phun), thuận tích cực (phun & quét), bão hòa (hai tiếp giáp cùng phun, vùng nghèo B–C sụp)'
}, (S) => {
  const M = modeCalc(S), f = clamp(M.IC / Math.max(1e-9, M.ICmax), 0, 1), sat = M.k === 'sat', cut = M.k === 'cut';
  const g = bgeom({ fB: 0.2, dEb: cut ? 0.026 : 0.01, dCb: sat ? 0.002 : 0.02 + 0.02 * Math.sqrt(M.VCE / S.VCC), dCc: sat ? 0.004 : 0.03 + 0.04 * Math.sqrt(M.VCE / S.VCC) });
  const lbl = cut ? 'NGẮT: I_B ≈ 0 ⇒ không phun, I_C = 0' : sat ? 'BÃO HÒA: hai tiếp giáp thuận — collector cũng phun ngược vào cơ sở' : 'THUẬN TÍCH CỰC: I_C = β·I_B';
  return {
    g, so: { R: cut ? 0 : 0.8 + 2.4 * f, pR: 0.04, sat: sat ? 1.1 : 0, seq: sat ? ['C', 'F', 'C'] : ['C'], noTrk: cut },
    gs: [needle('I_C', fmtCur(M.IC), f, sat ? C.err : C.main, 0.97), needle('V_CE', M.VCE.toFixed(2) + ' V', M.VCE / S.VCC, C.c2), needle('V_R = I_C·R_C', M.VR.toFixed(2) + ' V', M.VR / S.VCC, C.c1)],
    depCol2: sat ? C.err : undefined,
    chip: [lbl, sat ? C.err : cut ? C.mut : C.main],
    line: ['I_C = ' + fmtCur(M.IC) + ' · V_CE = ' + M.VCE.toFixed(2) + ' V · I_C(max) = V_CC/R_C = ' + fmtCur(M.ICmax), sat ? C.err : C.ink],
    sc: { depCol2: sat ? C.err : undefined }, st: { depCol2: sat ? C.err : undefined }
  };
}, [
  { k: 'IB', l: 'I_B', min: 0, max: 100, step: 1, f: v => v + ' µA' },
  { k: 'VCC', l: 'V_CC', min: 3, max: 15, step: 0.5, f: v => v.toFixed(1) + ' V' },
  { k: 'RC', l: 'R_C', min: 0.5, max: 5, step: 0.1, f: v => v.toFixed(1) + ' kΩ' },
  { k: 'beta', l: 'β', min: 50, max: 300, step: 10, f: v => v + '' },
  { btn: 'Ngắt', fn: p => { p.S.IB = 0; p.syncCtrls(); p.dirty = true; } },
  { btn: 'Tích cực', fn: p => { p.S.IB = 20; p.S.VCC = 10; p.S.RC = 2; p.S.beta = 100; p.syncCtrls(); p.dirty = true; } },
  { btn: 'Bão hòa', fn: p => { p.S.IB = 60; p.S.VCC = 10; p.S.RC = 2; p.S.beta = 100; p.syncCtrls(); p.dirty = true; } }
], null, 'Bên trong: cùng hạt — thuận tích cực: e⁻ chạy một chiều; bão hòa: e⁻ và lỗ trống chạy hai chiều'));

/* ---------- 4. MỤC 2.5 — KHUẾCH ĐẠI ---------- */
const AMP_VCC = 10;
function ampAt(S, ph) {
  const vi = S.vi * 1e-3 * Math.sin(ph), RC = S.RC * 1e3, ICmax = (AMP_VCC - 0.2) / RC;
  const iRaw = IS0 * Math.exp((S.VBEQ + vi) / VT_300), iC = Math.min(iRaw, ICmax);
  return { vi, iC, vce: clamp(AMP_VCC - iC * RC, 0.2, AMP_VCC), ICmax, sat: iRaw >= ICmax };
}
LABS.push(mkTab({
  id: 'amp', tag: '2.5', name: 'Khuếch đại', sec: 2, S: { VBEQ: 0.65, vi: 10, RC: 4 },
  title3: 'Thực tế 3D: Tín hiệu nhỏ v_i làm dòng electron phun lúc dày lúc thưa — ba kim đo v_i, i_C, v_o đảo pha'
}, (S, t) => {
  const A = ampAt(S, -t * 3), IQ = IS0 * Math.exp(S.VBEQ / VT_300), gm = IQ / VT_300;
  let clip = false; for (let i = 0; i <= 40; i++) if (ampAt(S, i / 40 * TAU2).sat) clip = true;
  const g = bgeom({ fB: 0.2, dCb: 0.03, dCc: 0.05 + 0.02 * (A.vce / AMP_VCC) });
  return {
    g, so: { R: 1.5, mod: tt => clamp(ampAt(S, -tt * 3).iC / IQ, 0.05, 3), pR: 0.03, seq: ['C'] },
    gs: [needle('v_i', (A.vi * 1e3).toFixed(1) + ' mV', 0.5 + A.vi / 0.04 * 0.45, C.c1), needle('i_C', fmtCur(A.iC), A.iC / A.ICmax, C.main), needle('v_o = V_CE', A.vce.toFixed(2) + ' V', A.vce / AMP_VCC, C.c2, A.sat ? 0.9 : null)],
    chip: [clip ? 'MÉO: transistor chạm bão hòa, đỉnh v_o bị cắt' : 'Không méo: dòng phun bám theo v_i, v_o ngược pha', clip ? C.err : C.main],
    line: ['I_CQ = ' + fmtCur(IQ) + ' · g_m = ' + (gm * 1e3).toFixed(1) + ' mS · A_v ≈ −g_m·R_C = −' + (gm * S.RC * 1e3).toFixed(0), C.ink]
  };
}, [
  { k: 'VBEQ', l: 'V_BE tĩnh', min: 0.55, max: 0.72, step: 0.005, f: v => v.toFixed(3) + ' V' },
  { k: 'vi', l: 'Biên độ v_i', min: 1, max: 40, step: 1, f: v => v + ' mV' },
  { k: 'RC', l: 'R_C', min: 1, max: 5, step: 0.1, f: v => v.toFixed(1) + ' kΩ' },
  { btn: 'Điểm Q đẹp', fn: p => { p.S.VBEQ = 0.65; p.S.vi = 10; p.S.RC = 4; p.syncCtrls(); p.dirty = true; } },
  { btn: 'Quá kích', fn: p => { p.S.VBEQ = 0.70; p.S.vi = 30; p.S.RC = 4; p.syncCtrls(); p.dirty = true; } }
], null, 'Bên trong: cùng hạt — dòng hạt phun dày lên rồi thưa đi theo nhịp v_BE'));

/* ---------- 5. MỤC 3.5 — γ · α_T · δ ---------- */
LABS.push(mkTab({
  id: 'gain', tag: '3.5', name: 'γ·α_T·δ', sec: 3, S: { NE: 3.02e17, NB: 1e15, xB: 0.8, LB: 10, VBE: 0.60 },
  title3: 'Thực tế 3D: Dòng emitter "rò" ở 3 chỗ — lỗ trống phun ngược (1−γ), tái hợp cơ sở (1−α_T), tái hợp vùng nghèo (1−δ); phần rò được phóng đại để thấy'
}, (S) => {
  const K = gainCalc(S), g = bgeom({ fB: fBof(S.xB), dCb: 0.02, dCc: 0.05 });
  const fr = clamp((S.VBE - 0.3) / 0.5, 0, 1), mp = x => (x - 0.9) / 0.1;
  return {
    g, so: { R: 0.9 + 2.2 * fr, pH: (1 - K.gamma) / Math.max(K.gamma, 0.05), pR: 1 - K.aT, pX: 1 - K.delta, seq: ['C', 'H', 'R', 'X', 'C'] },
    gs: [needle('γ', K.gamma.toFixed(4), mp(K.gamma), C.c4), needle('α_T', K.aT.toFixed(4), mp(K.aT), C.c3), needle('δ', K.delta.toFixed(4), mp(K.delta), C.c5)],
    chip: ['α = γ·α_T·δ = ' + K.alpha.toFixed(4) + '  ⇒  β = ' + K.beta.toFixed(0), C.main],
    line: ['Mất: 1−γ = ' + pct(K.l1, 2) + ' · 1−α_T = ' + pct(K.l2, 2) + ' · 1−δ = ' + pct(K.l3, 2), C.ink]
  };
}, [
  { k: 'NE', l: 'Nₑ', min: 16, max: 20, step: 0.05, log: 1, f: v => pw(v) },
  { k: 'NB', l: 'N_B', min: 14, max: 17, step: 0.05, log: 1, f: v => pw(v) },
  { k: 'xB', l: 'x_B', min: -1, max: 0.6, step: 0.02, log: 1, f: fmtUm },
  { k: 'LB', l: 'L_B', min: 2, max: 30, step: 1, f: v => v + ' µm' },
  { k: 'VBE', l: 'V_BE', min: 0.30, max: 0.80, step: 0.01, f: v => v.toFixed(2) + ' V' },
  { btn: 'Ví dụ 3.1', fn: p => { p.S.NE = 3.02e17; p.S.NB = 1e15; p.S.xB = 0.8; p.S.LB = 10; p.S.VBE = 0.80; p.syncCtrls(); p.dirty = true; } }
], null, 'Bên trong: cùng hạt — vòng đỏ = tái hợp vùng nghèo (δ), vòng vàng = tái hợp cơ sở / lỗ trống ngược (α_T, γ)'));

/* ---------- 6. MỤC 4.2 — HIỆU ỨNG EARLY ---------- */
LABS.push(mkTab({
  id: 'early', tag: '4.2', name: 'Hiệu ứng Early', sec: 4, S: { VCB: 4, xB0: 1.0, NB: 1e16 },
  title3: 'Thực tế 3D: V_CB ngược tăng — vùng nghèo B–C lấn vào cơ sở, bề rộng trung hòa x_B co lại, electron qua cơ sở nhanh hơn'
}, (S) => {
  const E = earlyCalc(S), fB = 0.26, g = bgeom({ fB, dEb: 0.014, dCb: Math.min(clamp(E.xd / S.xB0, 0, 0.95) * fB, fB * 0.9), dCc: 0.02 + 0.016 * Math.sqrt(S.VCB) });
  return {
    g, so: { R: 1.2 * Math.min(E.boost, 3), vm: { b: Math.min(E.boost, 3) }, pR: 0.05, seq: ['C'] },
    gs: [needle('x_B / x_B0', Math.round(E.xB / E.xB0r * 100) + '%', E.xB / E.xB0r, C.c4), needle('r_o', fmtOhm(E.ro), lg10(E.ro) / 6.5, C.main), needle('I_C', fmtCur(E.IC), frI(E.IC), C.c1)],
    chip: [E.xB < 0.15 ? 'Cơ sở gần cạn: sắp xuyên thấu!' : 'V_CB ↑ ⇒ x_B ↓ ⇒ gradient ↑ ⇒ I_C ×' + E.boost.toFixed(3), E.xB < 0.15 ? C.err : C.main],
    line: ['x_B = ' + fmtUm(E.xB) + ' · I_C = ' + fmtCur(E.IC) + ' · g_o = ' + (E.go * 1e6).toFixed(1) + ' µS · r_o = ' + fmtOhm(E.ro), C.ink],
    over: (ctx, sc) => marker3(ctx, sc, g.be, C.c4, 'x_B = ' + fmtUm(E.xB), 30)
  };
}, [
  { k: 'VCB', l: 'V_CB', min: 0, max: 20, step: 0.5, f: v => v.toFixed(1) + ' V' },
  { k: 'xB0', l: 'x_B0', min: 0.4, max: 2, step: 0.05, f: v => v.toFixed(2) + ' µm' },
  { k: 'NB', l: 'N_B', min: 15.5, max: 17.5, step: 0.05, log: 1, f: v => pw(v) },
  { btn: 'Cơ sở mỏng', fn: p => { p.S.xB0 = 0.5; p.S.NB = 1e16; p.syncCtrls(); p.dirty = true; } },
  { btn: 'V_A lớn', fn: p => { p.S.xB0 = 1.5; p.S.NB = 1e17; p.syncCtrls(); p.dirty = true; } }
], null, 'Bên trong (E → B → C): cùng hạt — cơ sở trung hòa (nền hồng) hẹp dần khi vùng nghèo (xanh lá) lấn vào'));

/* ---------- 7. MỤC 4.5 — HẸP VÙNG CẤM & PHUN MỨC CAO ---------- */
LABS.push(mkTab({
  id: 'hl', tag: '4.5', name: 'Mức cao & ΔE_g', sec: 4, S: { bgn: 'on', NE: 1e19, NB: 1e16, VBE: 0.60 },
  title3: 'Thực tế 3D: Emitter pha tạp nặng bị hẹp vùng cấm ⇒ lỗ trống phun ngược nhiều hơn; phun mức cao ⇒ electron trong cơ sở vượt nồng độ pha tạp'
}, (S) => {
  const K = hlCalc(S), over = K.r > 1, g = bgeom({ fB: 0.2, dCb: 0.03, dCc: 0.05 });
  const on = clamp((S.VBE - 0.45) / 0.4, 0, 1);
  return {
    g, so: { R: 0.7 + 2.3 * on, pH: (1 - K.gamma) / Math.max(K.gamma, 0.05), pR: 0.03 + (over ? 0.1 : 0), seq: ['C', 'H', 'C'] },
    sc: { extraB: clamp(K.r, 0, 1.4) / 1.4 * 0.9, nh: 8 + 14 * Math.max(0, K.r - 1) }, st: { extraB: clamp(K.r, 0, 1.4) / 1.4 * 0.9 },
    gs: [needle('ΔE_g', (K.dEg * 1000).toFixed(0) + ' meV', K.dEg / 0.15, C.c2), needle('γ', K.gamma.toFixed(4), (K.gamma - 0.9) / 0.1, C.c4), needle('β', K.beta.toFixed(0), K.beta / 300, over ? C.err : C.main)],
    chip: [S.bgn === 'on' ? 'Hẹp vùng cấm BẬT: p′_E0 tăng ×' + K.fac.toFixed(1) + ' ⇒ lỗ trống phun ngược nhiều hơn' : 'Hẹp vùng cấm TẮT: lỗ trống phun ngược ít', K.fac > 5 && S.bgn === 'on' ? C.err : C.main],
    line: ['n_B(0)/N_B = ' + K.r.toFixed(K.r < 0.1 ? 3 : 2) + (over ? ' > 1: phun mức cao — luật e^(V/2kT), β tụt' : ' < 1: phun mức thấp — luật e^(V/kT)') + ' · V_ngưỡng ≈ ' + K.VK.toFixed(2) + ' V', over ? C.err : C.ink]
  };
}, [
  { k: 'bgn', seg: [['on', 'Hẹp vùng cấm: BẬT'], ['off', 'TẮT']] },
  { k: 'NE', l: 'Nₑ', min: 17, max: 20, step: 0.05, log: 1, f: v => pw(v) },
  { k: 'NB', l: 'N_B', min: 15, max: 18, step: 0.05, log: 1, f: v => pw(v) },
  { k: 'VBE', l: 'V_BE', min: 0.50, max: 0.85, step: 0.01, f: v => v.toFixed(2) + ' V' }
], null, 'Bên trong: cùng hạt — hạt xanh dương thêm trong cơ sở là electron phun dư; lỗ trống chạy ngược vào emitter'));

/* ---------- 8. MỤC 4.7 — DỒN DÒNG Ở EMITTER ---------- */
function simCrowd(st, key, t, dt, K, S) {
  const store = SHARED[GT || '_'] || (SHARED[GT || '_'] = {});
  const s = store[key] || (store[key] = { a: [], fl: [], c: 0, n: 0 });
  if (s.lt === t) return s; s.lt = t;
  if (CALM) { s.a.length = 0; s.fl.length = 0; s.trk = null; s.tl = null; s.tw = 0.4; return s; }
  dt = clamp(dt, 0, 0.06);
  const spd = 0.45 * GS.spd * 1.2, prof = u => K.J[clamp(Math.round((1 - Math.abs(u * 2 - 1)) * K.N), 0, K.N)];
  const pick = () => { for (let i = 0; i < 40; i++) { const u = Math.random(); if (Math.random() < prof(u)) return u; } return 0.5; };
  s.c += (1.3 + 2.4 * clamp((lgx(S.I) + 1.5) / 2.1, 0, 1)) * dt * cF();
  while (s.c >= 1) { s.c--; if (s.a.length < 160) s.a.push({ f: Math.floor(Math.random() * S.nf), s: pick(), v: Math.random(), w: 1, tr: [], ta: 0 }); }
  if (!s.trk || !s.a.includes(s.trk)) {
    if (s.trk) { s.tl = [s.trk.f, s.trk.s, s.trk.v, s.trk.w]; s.trk = null; s.tw = 0.7; }
    s.tw = (s.tw == null ? 0 : s.tw) - dt;
    if (s.tw <= 0) { const q = { f: 0, s: (s.n++ % 2) ? 0.05 : 0.95, v: 0.5, w: 1, tr: [], ta: 0 }; s.a.push(q); s.trk = q; }
  }
  s.a = s.a.filter(q => {
    q.w -= spd * dt * (0.8 + 0.6 * prof(q.s)); q.ta += dt; if (q.ta > 0.06) { q.ta = 0; q.tr.push([q.f, q.s, q.v, q.w]); if (q.tr.length > (q === s.trk ? 14 : 6)) q.tr.shift(); }
    if (q !== s.trk) q.v = clamp(q.v + gauss() * 0.4 * dt, 0.08, 0.92);
    if (q.w <= 0.02) { s.fl.push({ f: q.f, s: q.s, v: q.v, t0: t, big: prof(q.s) > 0.7 ? 1 : 0 }); return false; }
    return true;
  });
  s.fl = s.fl.filter(f => t - f.t0 < 0.6 && t - f.t0 > -1);
  return s;
}
LABS.push(Object.assign({
  id: 'crowd', tag: '4.7', name: 'Dồn dòng', sec: 4, S: { wE: 20, Rsb: 10000, I: 30, nf: 1 }
}, LAY, {
  panels: [
    {
      title: 'Thực tế 3D: Mặt emitter nhìn từ trên — electron phun xuống cơ sở dồn ra hai mép (đỏ = mật độ dòng cao, nóng cục bộ)',
      area: 'a', anim: true,
      ctrls: [
        { k: 'wE', l: 'Rộng emitter', min: 4, max: 40, step: 2, f: v => v + ' µm' },
        { k: 'Rsb', l: 'R_sb', min: 2000, max: 20000, step: 1000, f: v => (v / 1000) + ' kΩ/□' },
        { k: 'I', l: 'Dòng tổng', min: 0, max: 2.5, step: 0.05, log: 1, f: v => v.toFixed(v < 10 ? 1 : 0) + ' mA' },
        { k: 'nf', seg: [[1, '1 ngón'], [2, '2 ngón'], [4, '4 ngón']] }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, K = crowdSolve(S), s = simCrowd(p.st, 'fl', t, dt, K, S);
        const bw = Math.min(W * 0.62, 480), bd = Math.min(120, H * 0.32), h = Math.min(70, H * 0.22), ox = W * 0.12, oy = H * 0.7;
        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, h, C.card, 1, C.sub);
        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, h, C.c4, 0.6, C.sub);
        const nf = S.nf, fw = bw * 0.72 / nf, gap = (bw - fw * nf) / (nf + 1), Ns = 12;
        for (let f = 0; f < nf; f++) {
          const x0 = gap + f * (fw + gap);
          for (let j = 0; j < Ns; j++) {
            const u = Math.abs((j + 0.5) / Ns * 2 - 1), jn = K.J[clamp(Math.round((1 - u) * K.N), 0, K.N)];
            isoBox(ctx, ox, oy, x0 + j * fw / Ns, bd * 0.1, h, fw / Ns, bd * 0.8, 8, jn > 0.7 ? C.err : C.c2, 0.25 + 0.7 * jn, jn > 0.7 ? C.err : C.c2);
          }
        }
        for (let f = 0; f <= nf; f++) isoBox(ctx, ox, oy, f * (fw + gap) + gap * 0.1, bd * 0.1, h, Math.max(4, gap * 0.8), bd * 0.8, 5, C.c4, 0.95, C.ink);
        const lb = isoP(ox, oy, bw * 0.5, 0, h + 26);
        txt(ctx, nf + ' ngón · mỗi ngón ' + (S.wE / nf).toFixed(1) + ' µm', lb[0], lb[1], C.c2, 10.5, 'center', 700);
        const X3 = q => gap + q.f * (fw + gap) + q.s * fw, P3 = a => isoP(ox, oy, gap + a[0] * (fw + gap) + a[1] * fw, bd * 0.1 + a[2] * bd * 0.8, 4 + a[3] * (h + 22));
        const zf = CAM ? CAM.zoom : 1;
        if (CAM) { CAM.gm = { bw, bd, bh: h, len: 1, g: { jx: 0.5, ne: 0.5, pe: 0.5, d0: 0.4, d1: 0.6, c0: 0.5, bs: 0.5, be: 0.5 } }; CAM.tp = s.trk ? [X3(s.trk) / bw, 0.5, 0.5] : (s.tl ? [(gap + s.tl[0] * (fw + gap) + s.tl[1] * fw) / bw, 0.5, 0.5] : null); }
        s.a.forEach(q => {
          trail(ctx, q.tr.concat([[q.f, q.s, q.v, q.w]]).map(P3), C.c2);
          const c = P3([q.f, q.s, q.v, q.w]);
          dot(ctx, c[0], c[1], 4.2, C.c2); if (zf > 1.3) txt(ctx, '−', c[0], c[1] + 0.5, C.bg, 8, 'center', 800);
          if (q === s.trk) { const r = 11 * Math.pow(zf, 0.6); ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.main; ctx.beginPath(); ctx.arc(c[0], c[1], r * 1.9 * (1 + 0.18 * Math.sin(t * 5)), 0, TAU2); ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.stroke(); }
        });
        s.fl.forEach(f => { const a = clamp((t - f.t0) / 0.55, 0, 1), c = P3([f.f, f.s, f.v, 0.02]); ctx.save(); ctx.globalAlpha = 1 - a; ctx.beginPath(); ctx.arc(c[0], c[1], (5 + a * (f.big ? 18 : 11)) * Math.pow(zf, 0.5), 0, TAU2); ctx.strokeStyle = f.big ? C.err : C.main; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); });
        gcol(ctx, W, H, [needle('J_mép / J_giữa', '×' + (K.ratio < 100 ? K.ratio.toFixed(1) : K.ratio.toExponential(0)), lg10(K.ratio) / 3, C.c2, 0.45), needle('ΔV mép–giữa', (K.dV * 1000).toFixed(0) + ' mV', K.dV / 0.3, C.c5, 0.5)], [H * 0.3, H * 0.66]);
        chipTop(ctx, W, K.ratio > 3 ? 'DỒN DÒNG: chỉ ' + Math.round(clamp(K.dep / K.Sx, 0, 1) * 100) + '% bề rộng mỗi bên còn phun mạnh' : 'Dòng gần đều dưới emitter', K.ratio > 3 ? C.err : C.c2);
      }
    },
    {
      title: 'Bên trong (mặt cắt ngang một ngón): cùng hạt rơi từ emitter xuống cơ sở — mép nhận nhiều hơn giữa',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, K = crowdSolve(S), s = simCrowd(p.st, 'fl', t, dt, K, S);
        const x0 = 16, x1 = W - 16, ey = 26, ey1 = 44, by1 = H - 30, fx0 = x0 + (x1 - x0) * 0.1, fx1 = x0 + (x1 - x0) * 0.9;
        rr(ctx, x0, ey1, x1 - x0, by1 - ey1, 6); ctx.fillStyle = C.c4; ctx.globalAlpha = 0.2; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        const Nn = 28; for (let i = 0; i < Nn; i++) { const u = (i + 0.5) / Nn, jn = K.J[clamp(Math.round((1 - Math.abs(u * 2 - 1)) * K.N), 0, K.N)]; ctx.fillStyle = jn > 0.7 ? C.err : C.c2; ctx.globalAlpha = 0.1 + 0.4 * jn; ctx.fillRect(fx0 + (fx1 - fx0) * i / Nn, ey1, (fx1 - fx0) / Nn + 0.5, by1 - ey1); ctx.globalAlpha = 1; }
        rr(ctx, fx0, ey, fx1 - fx0, ey1 - ey, 4); ctx.fillStyle = C.c2; ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = C.c2; ctx.lineWidth = 1.3; ctx.stroke();
        txt(ctx, 'Emitter n⁺⁺', (fx0 + fx1) / 2, (ey + ey1) / 2, C.ink, 10, 'center', 700);
        const PX = a => [fx0 + a[1] * (fx1 - fx0), ey1 + (1 - a[3]) * (by1 - ey1)];
        s.a.filter(q => q.f === 0).forEach(q => {
          trail(ctx, q.tr.concat([[q.f, q.s, q.v, q.w]]).map(PX), C.c2);
          const c = PX([0, q.s, 0, q.w]); dot(ctx, c[0], c[1], 4.8, C.c2); txt(ctx, '−', c[0], c[1] + 0.5, C.bg, 9, 'center', 800);
          if (q === s.trk) { ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.main; ctx.beginPath(); ctx.arc(c[0], c[1], 18 * (1 + 0.18 * Math.sin(t * 5)), 0, TAU2); ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.arc(c[0], c[1], 10, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.stroke(); }
        });
        s.fl.filter(f => f.f === 0).forEach(f => { const a = clamp((t - f.t0) / 0.55, 0, 1), c = PX([0, f.s, 0, 0.02]); ctx.save(); ctx.globalAlpha = 1 - a; ctx.beginPath(); ctx.arc(c[0], c[1], 5 + a * (f.big ? 18 : 11), 0, TAU2); ctx.strokeStyle = f.big ? C.err : C.main; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); });
        txt(ctx, 'J_mép = ×' + (K.ratio < 100 ? K.ratio.toFixed(1) : K.ratio.toExponential(0)) + ' J_giữa  ·  ΔV = ' + (K.dV * 1000).toFixed(0) + ' mV  ·  thâm nhập ≈ ' + K.dep.toFixed(1) + ' µm', W / 2, H - 13, K.ratio > 3 ? C.err : C.ink, 10.5, 'center', 700);
      }
    }
  ]
}));

/* ---------- 9. MỤC 4.10 — ĐÁNH THỦNG XUYÊN THẤU & I_CEO ---------- */
LABS.push(mkTab({
  id: 'brk', tag: '4.10', name: 'Đánh thủng', sec: 4, S: { mode: 'pt', VCB: 30, xBO: 0.8, NB: 1e16, beta: 100 },
  title3: 'Thực tế 3D: V_CB ngược tăng — vùng nghèo B–C lấn xuyên cơ sở (xuyên thấu), hoặc cơ sở hở: lỗ trống ngược khuếch đại I_CBO thành I_CEO; thác lũ nhân đôi hạt'
}, (S) => {
  const B = brkCalc(S), pt = S.mode === 'pt', fB = 0.26;
  const dcb = Math.min(clamp(B.xd / S.xBO, 0, 1.05) * fB, fB - 0.018 - 0.002);
  const g = bgeom({ fB, dEb: 0.018, dCb: dcb, dCc: 0.03 + 0.012 * Math.sqrt(S.VCB / 5) });
  const fl = pt ? 1 - B.bar : clamp(lg10(B.ICEO / 1e-9) / 6, 0.1, 1);
  const av = clamp((B.M - 1) / 6, 0, 0.8), I = pt ? B.Ipt : B.ICEO, hit = pt && B.touch, col = hit ? C.err : C.c5;
  return {
    g, so: { R: pt ? 0.2 + 2.8 * fl : 0.5 + 2.4 * fl, pR: pt ? 0.02 : 0.06, rev: pt ? 0 : 0.7, av, seq: pt ? ['C'] : ['C', 'Q'], vm: hit ? { b: 2 } : null },
    sc: { depCol2: col }, st: { depCol2: col }, depCol2: col,
    gs: [needle(pt ? 'Dòng I_C' : 'I_CEO', fmtCur(I), (lg10(I) + 9) / 8, C.main, 0.8), pt ? needle('V_pt', B.Vpt.toFixed(0) + ' V', S.VCB / B.Vpt, C.c5, 0.99) : needle('I_CBO', fmtCur(B.ICBO), (lg10(B.ICBO) + 9.5) / 3, C.c5)],
    chip: [pt ? (B.touch ? 'XUYÊN THẤU: vùng nghèo chạm B–E, rào hạ — dòng vọt!' : 'x_d = ' + fmtUm(B.xd) + ' < x_BO: cơ sở còn trung hòa') : 'I_CEO = I_CBO/(1−α) ≈ β·I_CBO = ' + fmtCur(B.ICEO), hit ? C.err : C.main],
    line: [pt ? 'V_pt = ' + B.Vpt.toFixed(0) + ' V · x_d/x_BO = ' + (B.xd / S.xBO).toFixed(2) : 'I_CBO = ' + fmtCur(B.ICBO) + ' ⇒ I_CEO ≈ ×' + (B.ICEO / B.ICBO).toFixed(0) + ' · BV_CEO ≈ ' + B.BVceo.toFixed(0) + ' V < BV_CBO ≈ 120 V', hit ? C.err : C.ink]
  };
}, [
  { k: 'mode', seg: [['pt', 'Xuyên thấu'], ['ceo', 'I_CEO (B hở)']], set: { pt: { VCB: 30 }, ceo: { VCB: 20 } } },
  { k: 'VCB', l: 'V_CB', min: 0, max: 120, step: 1, f: v => v + ' V' },
  { k: 'xBO', l: 'x_BO', min: 0.4, max: 2, step: 0.05, f: v => v.toFixed(2) + ' µm' },
  { k: 'NB', l: 'N_B', min: 15.5, max: 17.5, step: 0.05, log: 1, f: v => pw(v) },
  { k: 'beta', l: 'β', min: 20, max: 300, step: 10, f: v => v + '' }
], null, 'Bên trong: cùng hạt — vòng đỏ lớn = thác lũ (một hạt va chạm tạo thêm cặp electron–lỗ trống)'));

/* ---------- 10. MỤC 6.2 — BỐN THỜI GIAN TRỄ & f_α ---------- */
function faCalc(S) {
  const te = S.te, tb = S.tb, td = S.td, tc = S.tc, tau = (te + tb + td + tc) * 1e-12, fa = 1 / (TAU2 * tau), f = Math.pow(10, S.logF);
  const mag = 1 / Math.sqrt(1 + Math.pow(f / fa, 2)), ph = Math.atan(f / fa);
  return { te, tb, td, tc, tau, fa, f, mag, ph, tot: te + tb + td + tc };
}
const faCfg = S => {
  const F = faCalc(S), g = bgeom({ fB: 0.2, dCb: 0.03, dCc: 0.06 }), sv = x => clamp(10 / x, 0.25, 3.5);
  return {
    g, F, so: { R: 1.3, pR: 0.03, seq: ['C'], vm: { e: sv(F.te), j: sv(F.te), b: sv(F.tb), d: sv(F.td), c: sv(F.tc) } },
    gs: [needle('f_α', fmtFreq(F.fa), lg10(F.fa / 1e8) / 3, C.main), needle('τ_ec', F.tot.toFixed(1) + ' ps', F.tot / 60, C.c3)],
    chip: ['f_α = 1/(2π·τ_ec) — muốn nhanh phải rút ngắn chặng dài nhất', C.main],
    line: ['τ_e = ' + F.te + ' · τ_b = ' + F.tb + ' · τ_d = ' + F.td + ' · τ_c = ' + F.tc + ' ps  ⇒  τ_ec = ' + F.tot.toFixed(1) + ' ps', C.ink]
  };
};
LABS.push(Object.assign({ id: 'fa', tag: '6.2', name: 'Tần số f_α', sec: 6, S: { te: 4, tb: 12, td: 3, tc: 1, logF: 9.0 } }, LAY, {
  panels: [
    {
      title: 'Thực tế 3D: Đường đua 4 chặng của electron từ emitter tới collector — chặng nào τ dài thì hạt chạy chậm ở chặng đó (τ_ec = τ_e + τ_b + τ_d + τ_c)',
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
        const c = faCfg(p.S), fl = simB(p.st, 'fl', t, dt, c.g, c.so), sc = scene3b(p, ctx, W, H, t, c.g, {});
        const mx = Math.max(c.F.te, c.F.tb, c.F.td, c.F.tc), nm = mx === c.F.tb ? 'τ_b (cơ sở)' : mx === c.F.te ? 'τ_e (nạp C_je)' : mx === c.F.td ? 'τ_d (vùng nghèo C)' : 'τ_c (nạp C_C)';
        marker3(ctx, sc, c.g.jE, C.c1, 'τ_e', 36); marker3(ctx, sc, c.g.jC, C.c5, 'τ_d', 36);
        flow3(ctx, sc, fl, c.g, t); gcol(ctx, W, H, c.gs, [H * 0.3, H * 0.66]);
        chipTop(ctx, W, 'Nút cổ chai: ' + nm + ' — ' + Math.round(mx / c.F.tot * 100) + '% thời gian bay', C.c3);
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
          txt(ctx, name, x, cy + r0 + 14, col, 10, 'center', 700);
        };
        lamp(c1x, a1, C.c1, 'đèn vào i_e'); lamp(c2x, a2, C.main, 'đèn ra i_c');
        for (let k = 0; k < 6; k++) { const u = ((t * 0.5 + k / 6) % 1), x = c1x + r0 + 8 + u * (c2x - c1x - 2 * r0 - 16); ctx.save(); ctx.globalAlpha = 0.25 + 0.7 * F.mag * (1 - u * (1 - F.mag)); dot(ctx, x, cy, 3.6, C.c2); ctx.restore(); }
        const lx = sx + sw + 12;
        txt(ctx, 'f = ' + fmtFreq(F.f), lx, H * 0.16, C.ink, 11.5, 'left', 800);
        txt(ctx, 'f/f_α = ' + (F.f / F.fa).toFixed(2), lx, H * 0.34, C.mut, 10.5, 'left', 700);
        txt(ctx, '|α|/α₀ = ' + F.mag.toFixed(2), lx, H * 0.54, F.mag < 0.72 ? C.err : C.main, 12, 'left', 800);
        txt(ctx, 'trễ pha ' + (F.ph * 180 / Math.PI).toFixed(0) + '°', lx, H * 0.72, C.c3, 11, 'left', 700);
        txt(ctx, F.f >= F.fa ? 'Quá f_α: giảm > 3 dB' : 'Dưới f_α', lx, H * 0.88, F.f >= F.fa ? C.err : C.c2, 10, 'left', 700);
      }
    }
  ]
}));

/* ---------- 11. MỤC 7.3 — CHUYỂN MẠCH ---------- */
const SW_SPEED = 46;
LABS.push(mkTab({
  id: 'sw', tag: '7.3', name: 'Chuyển mạch', sec: 7, S: { k: 3, m: 0.5 },
  title3: 'Thực tế 3D: BJT đóng cắt — điện tích tích trữ trong cơ sở (xanh dương), tràn sang collector khi bão hòa (xanh lá = Q_BX); bốn đèn pha (định tính)'
}, (S, t) => {
  const Z = swCalc(S), ph = (t * SW_SPEED) % Z.Ttot, q = Z.q(ph), ic = Math.min(1, q), ibN = Z.ib(ph), sat = q > 1;
  const g = bgeom({ fB: 0.2, dCb: sat ? 0.004 : 0.03, dCc: sat ? 0.008 : 0.06 });
  const phases = [['t_d', C.c1, ph >= Z.ton && ph < Z.ton + Z.td], ['t_r', C.c2, ph >= Z.ton + Z.td && ph < Z.ton + Z.td + Z.tr], ['t_s', C.c5, ph >= Z.toff && ph < Z.toff + Z.ts], ['t_f', C.c3, ph >= Z.toff + Z.ts && ph < Z.toff + Z.ts + Z.tf]];
  const ibMax = Math.max(Z.k, Z.m, 1), xs = clamp((q - 1) / Math.max(1, Z.k - 1), 0, 1);
  return {
    g, so: { R: ic > 0.03 ? 0.5 + 2.5 * ic : 0, pR: 0.03, sat: sat ? 1 : 0, seq: ['C'], noTrk: ic < 0.03 },
    sc: { extraB: Math.min(q, 1) * 0.85, extraC: xs * 0.9 }, st: { extraB: Math.min(q, 1) * 0.85, extraC: xs * 0.9 },
    gs: [needle('I_B', (ibN >= 0 ? '+' : '−') + Math.abs(ibN).toFixed(1) + ' I_Bsat', 0.5 + 0.5 * ibN / ibMax, ibN < 0 ? C.c3 : C.c1), needle('I_C', (ic * 100).toFixed(0) + ' %', ic, C.main)],
    over: (ctx, sc2) => phases.forEach((qq, i) => { const x = 22 + i * 56, y = 52; ctx.save(); ctx.globalAlpha = qq[2] ? 0.35 : 0; dot(ctx, x, y, 16, qq[1]); ctx.restore(); dot(ctx, x, y, 10, qq[2] ? qq[1] : C.tint); ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.3; ctx.stroke(); txt(ctx, qq[0], x, y + 21, qq[1], 10, 'center', 800); }),
    chip: [Z.ts >= Z.tr && Z.ts >= Z.tf ? 'Thời gian tích trữ t_s đang chiếm ưu thế' : 'Quá kích càng sâu, t_s càng dài; rút ngược mạnh thì rút ngắn', Z.ts > 20 ? C.c5 : C.main],
    line: ['t = ' + ph.toFixed(0) + ' ns · q = ' + q.toFixed(2) + (sat ? ' (B–C thuận: Q_BX dư)' : '') + ' · t_d=' + Z.td.toFixed(1) + ' t_r=' + Z.tr.toFixed(1) + ' t_s=' + Z.ts.toFixed(1) + ' t_f=' + Z.tf.toFixed(1) + ' ns', sat ? C.c5 : C.ink]
  };
}, [
  { k: 'k', l: 'Quá kích I_B1/I_Bsat', min: 1, max: 10, step: 0.5, f: v => v.toFixed(1) + '×' },
  { k: 'm', l: 'Rút ngược I_B2/I_Bsat', min: 0, max: 3, step: 0.1, f: v => v.toFixed(1) + '×' },
  { btn: 'Vừa bão hòa', fn: p => { p.S.k = 1.2; p.S.m = 0; p.syncCtrls(); p.dirty = true; } },
  { btn: 'Bão hòa sâu', fn: p => { p.S.k = 8; p.S.m = 0; p.syncCtrls(); p.dirty = true; } },
  { btn: 'Rút mạnh', fn: p => { p.S.k = 8; p.S.m = 2.5; p.syncCtrls(); p.dirty = true; } }
], null, 'Bên trong: cùng hạt — điện tích tích trữ trong cơ sở (xanh dương) và tràn sang collector (xanh lá) theo thời gian'));


/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM CHO ĐỦ 11 MÔ HÌNH TƯƠNG TÁC BUỔI 12
   ========================================================================== */
const LD = {};
LD.base = {
  intro: [
    ['i', 'Ở chế độ thuận tích cực, tiếp giáp B–E thuận phun electron vào cơ sở p, còn B–C ngược nên nồng độ electron ở mép collector gần như bằng 0.'],
    ['w', 'Nồng độ electron tại mép emitter là n_B(0) = n_B0·e^(V_BE/V_t): tăng ~60 mV là tăng ~10 lần.'],
    ['w', 'Cơ sở mỏng (x_B ≪ L_B): dải sọc xanh dương nhạt dần đều, dòng khuếch tán tỉ lệ độ chênh sáng–tối — gần như không electron nào kịp tái hợp (theo dõi hạt có quầng sáng).'],
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
    ['v', 'Mặc định: i_C = 1 mA tại 0,65 V. Bấm "+60 mV" để thấy dòng hạt dày lên khoảng 10 lần và cả ba kim đo i_E, i_B, i_C nhảy theo.']
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
    ['v', 'Bấm "Quá kích" để thấy méo, rồi "Điểm Q đẹp" để quay lại dòng hạt phun đều, ba kim chạy sạch.']
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
const VIEW0 = {
  base: { zoom: 3.6, fu: g => (g.d1 + g.c0) / 2 }, comp: { zoom: 3.0, fu: g => g.jE }, mode: { zoom: 3.0, fu: g => g.jx },
  amp: { zoom: 3.0, fu: g => g.jE }, gain: { zoom: 3.0, fu: g => g.jE }, early: { zoom: 3.4, fu: g => (g.d1 + g.c0) / 2 },
  hl: { zoom: 3.0, fu: g => g.jE }, crowd: { zoom: 2.4, sy: 0.6, fu: () => 0.5 }, brk: { zoom: 3.2, fu: g => g.jC },
  fa: { zoom: 2.2, fu: g => g.jx }, sw: { zoom: 2.6, fu: g => g.jx }
};
const spdCtrl = { k: 'spd', l: 'Tốc độ', min: 0.1, max: 2, step: 0.05, f: v => '×' + v.toFixed(2) };
const cntCtrl = { k: 'cnt', l: 'Số hạt', min: 0.05, max: 1, step: 0.05, f: v => Math.round(v * 100) + '%' };
LABS.forEach(l => { l.panels.forEach(q => q.tid = l.id); l.view0 = VIEW0[l.id]; l.S.spd = 0.5; l.S.cnt = 0.3; l.panels[0].ctrls.push(spdCtrl, cntCtrl); });


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
#lab12 .lb-cv canvas.cam{cursor:grab;touch-action:none}
#lab12 .lb-cv canvas.cam:active{cursor:grabbing}
#lab12 .lb-sep{width:1px;height:18px;background:var(--g);margin:0 2px}
#lab12 .lb-c{position:relative}
#lab12 .lb-film{position:absolute;top:0;right:4px;z-index:3;width:22px;height:22px;display:flex;align-items:center;justify-content:center;background:none;color:var(--ink);font:700 15px/1 var(--font-body);cursor:pointer;opacity:.8;user-select:none}
#lab12 .lb-film:hover{opacity:1}
#lab12.filming .lb-c>*:not(.lb-cap){visibility:hidden}
#lab12.filming .lb-cv canvas.cam{cursor:default}
#lab12 .lb-cap{position:absolute;left:0;right:0;bottom:0;min-height:100%;box-sizing:border-box;display:none;background:var(--card);border-top:1px solid var(--main);padding:8px 14px 9px;font:600 13px/1.45 var(--font-body);color:var(--ink);pointer-events:none;z-index:2}
#lab12 .lb-cap i{display:block;height:3px;background:var(--main);border-radius:2px;margin-top:7px;width:0}
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
  if (!tab.log || !tab.log.react || k === 'spd' || k === 'cnt') return;
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

/* ---------- ĐIỀU KHIỂN CAMERA (kéo xoay · lăn chuột zoom) & PHIM TỰ ĐỘNG ---------- */
let film = null, TSC = 1, TT = 0;
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const lerp = (a, b, k) => a + (b - a) * k;
const D2R = Math.PI / 180;
const tiltOf = sy => (sy - 0.06) / 0.79 * 90;
const syOf = tilt => 0.06 + clamp(tilt, 0, 90) / 90 * 0.79;

function resetCam(c, tab) { const v = tab.view0 || { zoom: 1 }; Object.assign(c, { yaw: 0, sy: v.sy || 0.28, zoom: v.zoom, follow: (v.fu || v.f) ? 1 : 0, mx: 0, my: 0, auto: v.fu || null }); if (v.f) { c.fx = v.f[0]; c.fy = v.f[1]; c.fz = v.f[2]; } }
function setupCam(tab, p, el, cv) {
  const three = THREE.has(tab.id), c = p.cam = newCam(); resetCam(c, tab);
  p.three = three;
  const still = NOCAM.has(tab.id);
  if (!still) cv.classList.add('cam');
  let cb = el.querySelector('.lb-c');
  if (!cb) { cb = document.createElement('div'); cb.className = 'lb-c'; el.appendChild(cb); }
  const view = (label, min, max, step, get, set, fmt) => {
    const w = document.createElement('div'); w.className = 'lb-k';
    const lab = document.createElement('span'); lab.textContent = label;
    const inp = document.createElement('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step;
    const out = document.createElement('output'); w.append(lab, inp, out);
    const sync = () => { inp.value = get(); out.textContent = fmt(get()); };
    inp.oninput = () => { set(+inp.value); out.textContent = fmt(+inp.value); p.dirty = true; };
    inp.setAttribute('aria-label', label); p.syncs.push(sync); sync(); cb.appendChild(w);
  };
  const resetView = () => { if (film) return; resetCam(c, tab); p.syncCtrls(); p.dirty = true; };
  if (FILM[tab.id]) {
    const fb = document.createElement('div'); fb.className = 'lb-film'; fb.textContent = '▶'; fb.title = 'Phim tự động'; fb.setAttribute('aria-label', 'Phim tự động'); fb.setAttribute('role', 'button'); fb.tabIndex = 0;
    fb.onclick = e => { if (e) e.stopPropagation(); if (film) filmStop(false); else { filmStart(tab, p); fb.blur(); } };
    fb.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); fb.onclick(); } };
    el.querySelector('.lb-cv').appendChild(fb); p.filmBtn = fb;
    el.querySelector('.lb-cv').addEventListener('click', () => { if (film) film.paused = !film.paused; });
    el.addEventListener('wheel', e => { if (!film) return; e.preventDefault(); filmSeek(Math.sign(e.deltaY) * clamp(Math.abs(e.deltaY) / 100, 0.5, 3) * 1.5); }, { passive: false });
    const cap = document.createElement('div'); cap.className = 'lb-cap'; cap.innerHTML = '<span></span><i></i>';
    cb.appendChild(cap); p.cap = cap;
  }
  /* kéo = xoay (3D) hoặc dịch (2D); lăn chuột = zoom; nhấp đúp = về góc gốc */
  let drag = null;
  cv.addEventListener('pointerdown', e => { if (film || still) return; drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => {
    if (!drag || film) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    if (three) { c.yaw = clamp(c.yaw - dx * 0.008, -80 * D2R, 80 * D2R); c.sy = clamp(c.sy + dy * 0.004, 0.06, 0.85); }
    else { c.mx = clamp(c.mx + dx, -p.W, p.W); c.my = clamp(c.my + dy, -p.H, p.H); }
    p.syncCtrls(); p.dirty = true;
  });
  const up = () => { drag = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { if (film || still) return; e.preventDefault(); c.zoom = clamp(c.zoom * Math.exp(-e.deltaY * 0.0015), 0.5, 4); p.syncCtrls(); p.dirty = true; }, { passive: false });
  if (!still) cv.addEventListener('dblclick', resetView);
}

function camSnap(c) { return { yaw: c.yaw / D2R, tilt: tiltOf(c.sy), zoom: c.zoom, f: [c.fx, c.fy, c.fz], follow: c.follow, slow: TSC }; }

function filmStart(tab, p, at) {
  if (!FILM[tab.id] || !p.cam) return;
  filmStop(false, true); p.cam.auto = null;
  const home = Object.assign({}, tab.S), ctrl = {};
  const stepOf = {}; tab.panels.forEach(q => (q.ctrls || []).forEach(k => { if (k.k && k.step && !k.log) stepOf[k.k] = k.step; }));
  const steps = FILM[tab.id].concat([{ d: 3, cap: 'Kết thúc phim — mọi thông số và góc nhìn đã trở về như ban đầu. Bạn có thể tự xoay, zoom và chỉnh thanh trượt để thử lại.', v: V(0, tiltOf(0.28), 1.0, [0.5, 0.5, 0.5]), set: home, slow: 1, mv: 0.8 }]);
  film = { tab, p, steps, stepOf, i: -1, t: 0, total: steps.reduce((s, q) => s + q.d, 0), done: 0, home, cam0: camSnap(p.cam), paused: false, quiet: false };
  root.classList.add('filming');
  if (p.filmBtn) { p.filmBtn.textContent = '■'; p.filmBtn.title = 'Dừng phim'; p.filmBtn.setAttribute('aria-label', 'Dừng phim'); p.filmBtn.classList.add('on'); }
  if (p.cap) p.cap.style.display = 'block';
  filmNext();
  for (let rest = at || 0; rest > 0 && film;) { const s = Math.min(0.1, rest); filmTick(s); rest -= s; }
}
function filmNext() {
  const f = film; f.i++;
  if (f.i >= f.steps.length) { filmStop(true); return; }
  const st = f.steps[f.i], c = f.p.cam, S = f.tab.S; CALM = !!st.calm;
  f.from = { cam: camSnap(c), S: {} };
  f.t = 0;
  if (st.set) Object.keys(st.set).forEach(k => {
    if (typeof st.set[k] !== 'number' || SNAPK.includes(k)) S[k] = st.set[k]; else f.from.S[k] = S[k];
  });
  if (f.p.cap) { const n = f.p.cap; n.firstChild.textContent = st.cap; }
  if (!f.quiet) say('w', st.cap);
}
function filmTick(dt) {
  const f = film; if (!f) return;
  const st = f.steps[f.i], c = f.p.cam, S = f.tab.S, from = f.from;
  f.t += dt;
  const mv = st.mv || 0.5, sc = ease(f.t / (st.d * mv)), ss = ease(f.t / (st.d * 0.8)), v = st.v || {};
  const tYaw = v.yaw != null ? v.yaw : from.cam.yaw, tTilt = v.tilt != null ? v.tilt : from.cam.tilt, tZoom = v.zoom != null ? v.zoom : from.cam.zoom;
  c.yaw = (lerp(from.cam.yaw, tYaw, sc) + (st.orbit || 0) * Math.max(0, f.t - st.d * mv)) * D2R;
  c.sy = syOf(lerp(from.cam.tilt, tTilt, sc));
  c.zoom = Math.exp(lerp(Math.log(from.cam.zoom), Math.log(tZoom), sc));
  const tf = st.track ? st.track(clamp(f.t / st.d, 0, 1)) : v.f;
  if (tf) {
    if (st.track && sc >= 1) { const kk = 1 - Math.exp(-dt * 1.3); c.fx += (tf[0] - c.fx) * kk; c.fy += (tf[1] - c.fy) * kk; if (tf[2] != null) c.fz += (tf[2] - c.fz) * kk; }
    else { c.fx = lerp(from.cam.f[0], tf[0], sc); c.fy = lerp(from.cam.f[1], tf[1], sc); if (tf[2] != null) c.fz = lerp(from.cam.f[2], tf[2], sc); }
    c.follow = lerp(from.cam.follow, 1, sc);
  } else if (!st.track && v.f === undefined && (v.yaw != null || v.zoom != null)) c.follow = lerp(from.cam.follow, 0, sc);
  TSC = lerp(from.cam.slow, st.slow != null ? st.slow : from.cam.slow, sc);
  if (st.set) Object.keys(from.S).forEach(k => {
    const a = from.S[k], b = st.set[k];
    if (a == null) return;
    let val = (a > 0 && b > 0 && Math.max(a, b) / Math.min(a, b) >= 10) ? Math.pow(10, lerp(Math.log10(a), Math.log10(b), ss)) : lerp(a, b, ss);
    const sp = f.stepOf[k]; if (sp && ss < 1) val = Math.round(val / sp) * sp;
    S[k] = ss >= 1 ? b : val;
  });
  if (f.t >= st.d) { f.done += st.d; filmNext(); }
  if (!film) return;
  if (!f.quiet) curPanels.forEach(q => { q.dirty = true; if (q.syncCtrls) q.syncCtrls(); });
  if (f.p.cap) f.p.cap.lastChild.style.width = (100 * clamp((f.done + f.t) / f.total, 0, 1)) + '%';
}
function camApply(c, k) { c.yaw = k.yaw * D2R; c.sy = syOf(k.tilt); c.zoom = k.zoom; c.fx = k.f[0]; c.fy = k.f[1]; c.fz = k.f[2]; c.follow = k.follow; }
function filmSeek(delta) {            // lăn chuột: tua tới / lùi thời gian của phim
  const f = film; if (!f) return;
  const T = clamp(f.done + f.t + delta, 0, f.total - 0.05), prevI = f.i;
  Object.assign(f.tab.S, f.home); camApply(f.p.cam, f.cam0); TSC = 1;
  f.i = -1; f.done = 0; f.t = 0; f.quiet = true;
  filmNext();
  for (let rest = T; rest > 0 && film === f;) { const s = Math.min(0.1, rest); filmTick(s); rest -= s; }
  if (film !== f) return;
  f.quiet = false;
  if (f.i !== prevI) say('w', f.steps[f.i].cap);
  curPanels.forEach(q => { q.dirty = true; if (q.syncCtrls) q.syncCtrls(); });
}
document.addEventListener('keydown', e => {      // phím cách: tạm dừng / tiếp tục
  if (film && root && !root.hidden && (e.key === ' ' || e.code === 'Space')) { e.preventDefault(); e.stopImmediatePropagation(); film.paused = !film.paused; }
}, true);
function filmStop(done, silent) {
  const f = film; if (!f) return;
  film = null; TSC = 1; CALM = false;
  root.classList.remove('filming');
  if (f.p.filmBtn) { f.p.filmBtn.textContent = '▶'; f.p.filmBtn.title = 'Phim tự động'; f.p.filmBtn.setAttribute('aria-label', 'Phim tự động'); f.p.filmBtn.classList.remove('on'); }
  if (f.p.cap) f.p.cap.style.display = 'none';
  if (!done) { Object.assign(f.tab.S, f.home); resetCam(f.p.cam, f.tab); }
  f.tab.prev = Object.assign({}, f.tab.S);
  curPanels.forEach(q => { q.dirty = true; if (q.syncCtrls) q.syncCtrls(); });
  if (done && !silent) say('v', 'Phim đã kết thúc. Hãy tự thử thay đổi các thanh trượt!');
}


function show(id, panelIdx, patch) {
  const tab = LABS.find(l => l.id === id) || LABS[0];
  if (patch) Object.assign(tab.S, patch);
  filmStop(false, true);
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
    if (spec.area === 'a') setupCam(tab, p, el, cv);

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
  const dt = (film && film.paused) ? 0 : Math.min(0.04, (ts - last) / 1000);
  last = ts; tAcc += dt; TT += dt * TSC;
  if (film && !film.paused) filmTick(dt);
  curPanels.forEach(p => {
    if (!p.ctx || !p.W || !(p.spec.anim || p.dirty)) return;
    p.dirty = false;
    const ctx = p.ctx;
    ctx.clearRect(0, 0, p.W, p.H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, p.W, p.H);
    ctx.save();
    const cm = p.cam;
    if (cm && p.three) { CAM = cm; beginCam(cm, p.W, p.H); }
    GS = p.S; GT = p.spec.tid || ''; try { p.spec.draw(p, ctx, p.W, p.H, TT, dt * TSC); } catch (err) { console.error('[LabB12]', err); }
    CAM = null;
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
  filmStop(false, true);
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  const b = document.getElementById('tb-lab');
  if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- gắn biểu tượng bình thí nghiệm nhỏ cạnh tiêu đề Buổi 12 (1–1 cho đủ 11 mỏ neo) ---------- */
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
window.LabB12 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id),
  film: (id, at) => { ensureDom(); if (root.hidden || (id && (!cur || cur.id !== id))) open(id); const p = curPanels.find(q => q.cam); if (p) filmStart(cur, p, at); } };
})();
