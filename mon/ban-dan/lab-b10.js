/* ==========================================================================
   lab-b10.js — PHÒNG THÍ NGHIỆM MÔ PHỎNG BUỔI 10:
   TIẾP XÚC KIM LOẠI–BÁN DẪN & DỊ TIẾP GIÁP (SCHOTTKY, OHMIC, ANDERSON, 2-DEG, HEMT)
   - Theo đúng tôn chỉ của lab-b11.js: hoàn toàn mô phỏng vật lý trực quan 3D
     kết hợp mặt cắt bên trong, hạt tải chuyển động, tụ phẳng cơ học, buồng
     phát xạ nhiệt, mạch tải đèn & van ngắt mạch — KHÔNG dùng biểu đồ/đồ thị.
   - Đồng bộ 100% biến màu CSS, khung popup 95% và cơ chế gắn nút bình thí nghiệm.
   - Đủ 15 tab ứng 1–1 với 15 mỏ neo "Mô hình tương tác" trong Buổi 10:
       1.4 · Hàng rào       | 2.3 · Phân cực       | 2.6 · Đo C-V
       3.2 · Lực ảnh        | 3.4 · Ghim Fermi     | 4.3 · Dòng Schottky
       5.4 · So sánh p-n    | 5.5 · Chuyển mạch    | 6.3 · Ohmic lý tưởng
       6.5 · Xuyên hầm      | 7.3 · Anderson       | 7.6 · Dị tiếp giáp nP
       7.8 · Dị tiếp giáp nN| 8.2 · Giếng 2-DEG    | 8.4 · Transistor HEMT
   - API: LabB10.open(tabId?, panelIndex?, patch?)  LabB10.close()  LabB10.mark(root)
   ========================================================================== */
(function () {
'use strict';

/* ---------- hằng số vật lý & tiện ích ---------- */
const TAU2 = Math.PI * 2;
const E_CHG = 1.6e-19;          // C
const HBAR = 1.05457e-34;       // J·s
const M0 = 9.10938e-31;         // kg
const KB = 1.38065e-23;         // J/K
const EPS0_CM = 8.854e-14;      // F/cm
const EPS0_SI = 8.854e-12;      // F/m
const VT_300 = 0.0259;          // V (300 K)

const rnd = (a, b) => a + Math.random() * (b - a);
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
const fmtCurDen = j => {
  const x = Math.abs(j), s = j < 0 ? '−' : '';
  if (x >= 1) return s + x.toFixed(2) + ' A/cm²';
  if (x >= 1e-3) return s + (x * 1e3).toFixed(2) + ' mA/cm²';
  if (x >= 1e-6) return s + (x * 1e6).toFixed(2) + ' µA/cm²';
  if (x >= 1e-9) return s + (x * 1e9).toFixed(2) + ' nA/cm²';
  return x === 0 ? '0 A/cm²' : s + sci(x, 1) + ' A/cm²';
};
const FONT = '"Be Vietnam Pro",system-ui,sans-serif';
const C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ['bg', 'card', 'ink', 'mut', 'sub', 'main', 'err', 'c1', 'c2', 'c3', 'c4', 'c5', 'g', 'tint']
    .forEach(k => C[k] = cs.getPropertyValue('--' + k).trim() || '#888');
}

/* ---------- hàm vẽ canvas dùng chung (đồng bộ lab-b11.js) ---------- */
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
  const r = sz || 5.5;
  rr(ctx, x - r, y - r, r * 2, r * 2, 3);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke();
  txt(ctx, sign, x, y + 0.5, col, Math.max(8.5, r * 1.55), 'center', 800);
}
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
/* ---------- CAMERA 3D: xoay · nghiêng · zoom · theo dõi (dùng chung cho isoP / isoBox) ---------- */
let CAM = null;
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
    polyFill(ctx, pts, col, a * 0.85, sc, 1);
    polyFill(ctx, pts, '#000', a * (0.16 + 0.18 * Math.max(0, rx)));
  });
}
function drawProbe(ctx, tx, ty, dir, col, label) {
  const s = dir < 0 ? -1 : 1;
  ln(ctx, tx + s * 40, ty - 50, tx + s * 10, ty - 15, C.sub, 4.8);
  ln(ctx, tx + s * 10, ty - 15, tx, ty, col || C.main, 2.2);
  dot(ctx, tx, ty, 3, col || C.main);
  if (label) txt(ctx, label, tx + s * 44, ty - 52, col || C.ink, 10.2, s > 0 ? 'left' : 'right', 700);
}
function drawDiodePkg(ctx, cx, cy, sc, isSchottky, col, label) {
  const w = 52 * sc, h = 24 * sc;
  ln(ctx, cx - w * 0.9, cy, cx - w * 0.5, cy, C.sub, 3 * sc);
  ln(ctx, cx + w * 0.5, cy, cx + w * 0.9, cy, C.sub, 3 * sc);
  rr(ctx, cx - w / 2, cy - h / 2, w, h, 4);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = col || C.sub; ctx.lineWidth = 1.6; ctx.stroke();
  // Vạch cathode bên phải
  ctx.fillStyle = col || C.main;
  ctx.fillRect(cx + w * 0.24, cy - h / 2 + 1, 5 * sc, h - 2);
  // Ký hiệu điốt bên trong
  const bx = cx - 4 * sc, s = 7 * sc;
  ctx.beginPath();
  ctx.moveTo(bx - s, cy - s * 0.85); ctx.lineTo(bx - s, cy + s * 0.85); ctx.lineTo(bx + s * 0.7, cy);
  ctx.closePath(); ctx.fillStyle = col || C.main; ctx.fill();
  ln(ctx, bx + s * 0.7, cy - s * 0.9, bx + s * 0.7, cy + s * 0.9, col || C.main, 1.8);
  if (isSchottky) {
    // Móc chữ S đặc trưng điốt Schottky
    ln(ctx, bx + s * 0.7, cy - s * 0.9, bx + s * 1.15, cy - s * 0.9, col || C.main, 1.6);
    ln(ctx, bx + s * 0.7, cy + s * 0.9, bx + s * 0.25, cy + s * 0.9, col || C.main, 1.6);
  }
  if (label) txt(ctx, label, cx, cy - h / 2 - 10, col || C.ink, 10.5, 'center', 700);
}

/* ---------- bảng dữ liệu vật liệu (khớp Bảng 9.1, 9.2 & các ví dụ Buổi 10) ---------- */
const METALS = {
  Ag: { name: 'Bạc (Ag)',  phiM: 4.26, col: '#9aa4b2' },
  Al: { name: 'Nhôm (Al)', phiM: 4.28, col: '#94a3b8' },
  Ti: { name: 'Titan (Ti)', phiM: 4.33, col: '#8b9dc3' },
  W:  { name: 'Vonfram (W)', phiM: 4.55, col: '#64748b' },
  Au: { name: 'Vàng (Au)', phiM: 5.10, col: '#eab308' },
  Pt: { name: 'Platin (Pt)', phiM: 5.65, col: '#cbd5e1' }
};
const SEMIS = {
  Si:   { name: 'Si',   chi: 4.01, Eg: 1.12, epsR: 11.7, Nc: 2.8e19, Nv: 1.04e19, mStar: 0.26, phi0: 0.33 },
  GaAs: { name: 'GaAs', chi: 4.07, Eg: 1.42, epsR: 13.1, Nc: 4.7e17, Nv: 7.0e18,  mStar: 0.067, phi0: 0.53 },
  Ge:   { name: 'Ge',   chi: 4.13, Eg: 0.66, epsR: 16.0, Nc: 1.04e19, Nv: 6.0e18, mStar: 0.12, phi0: 0.18 },
  AlAs: { name: 'AlAs', chi: 3.50, Eg: 2.16, epsR: 10.1, Nc: 1.5e19, Nv: 1.9e19,  mStar: 0.15, phi0: 0.80 },
  InAs: { name: 'InAs', chi: 4.90, Eg: 0.36, epsR: 15.1, Nc: 8.7e16, Nv: 6.6e18,  mStar: 0.023, phi0: 0.20 },
  GaSb: { name: 'GaSb', chi: 4.06, Eg: 0.72, epsR: 15.7, Nc: 2.1e17, Nv: 1.8e19,  mStar: 0.041, phi0: 0.25 }
};

function schottkyCalc(metalKey, semiKey, Nd, VR = 0) {
  const mt = METALS[metalKey] || METALS.Au;
  const sm = SEMIS[semiKey] || SEMIS.Si;
  const eps = sm.epsR * EPS0_CM;
  const phiB0 = mt.phiM - sm.chi;
  const phiN = VT_300 * Math.log(Math.max(1.05, sm.Nc / Nd));
  const phiS = sm.chi + phiN;
  const Vbi = phiB0 - phiN;
  const isRect = mt.phiM > phiS;
  const Vtot = Math.max(0.02, Vbi + VR);
  const W = isRect ? Math.sqrt((2 * eps * Vtot) / (E_CHG * Nd)) : 0;
  const Emax = isRect ? (E_CHG * Nd * W) / eps : 0;
  const Cprime = W > 0 ? eps / W : 0;
  return { mt, sm, eps, phiB0, phiN, phiS, Vbi, isRect, Vtot, W, Emax, Cprime };
}

function imageCalc(semiKey, E) {
  const sm = SEMIS[semiKey] || SEMIS.Si;
  const eps = sm.epsR * EPS0_CM;
  const xm = Math.sqrt(E_CHG / (16 * Math.PI * eps * E)); // cm
  const dPhi = Math.sqrt((E_CHG * E) / (4 * Math.PI * eps)); // V
  return { sm, eps, xm, dPhi };
}

function tunnelCalc(Nd, phiBn, mRel = 0.26, epsR = 11.7) {
  const epsCM = epsR * EPS0_CM;
  const epsSI = epsR * EPS0_SI;
  const W = Math.sqrt((2 * epsCM * Math.max(0.05, phiBn)) / (E_CHG * Nd)); // cm
  const E00_J = (E_CHG * HBAR / 2) * Math.sqrt((Nd * 1e6) / (epsSI * mRel * M0));
  const E00_eV = E00_J / E_CHG;
  const ratio = phiBn / Math.max(1e-6, E00_eV);
  return { W, E00_eV, ratio };
}

function wkbTriangular(F_Vcm, mRel) {
  const F_SI = F_Vcm * 100; // V/m
  const mEff = mRel * M0;
  const En = n => Math.pow((HBAR * HBAR) / (2 * mEff), 1 / 3)
    * Math.pow(1.5 * Math.PI * E_CHG * F_SI * (n + 0.75), 2 / 3) / E_CHG; // eV
  return { E0: En(0), E1: En(1), E2: En(2) };
}


/* ==========================================================================
   PHIM TỰ ĐỘNG — mỗi thí nghiệm có một đoạn dài, máy quay tự lia, zoom, theo dõi;
   thông số tự chạy, người xem không can thiệp được. Nhấn "▶ Phim tự động" để chạy.
   Cú pháp bước: { d: giây, cap: lời thuyết minh, v: V(yaw°, nghiêng°, zoom, [fx,fy,fz]?),
                   set: {thông số: giá trị đích}, orbit: °/giây, track: u => [fx,fy,fz] }
   ========================================================================== */
const V = (yaw, tilt, zoom, f) => ({ yaw, tilt, zoom, f });
const SNAPK = ['imgOn', 'mRel'];
const FILM = {
  schottky: [
    { d: 7, cap: 'Điốt Schottky là một khối kim loại (vàng, phía trên) áp sát bán dẫn n-Si (phía dưới). Mọi điều thú vị đều xảy ra ở mặt tiếp xúc giữa hai khối.', v: V(25, 28, 1.0), orbit: 6, set: { metal: 'Au', semi: 'Si', Nd: 1e16 } },
    { d: 7, cap: 'Kim loại là một biển electron tự do. Công thoát φ_m = 5,10 eV: phải cấp từng ấy năng lượng thì một electron mới thoát hẳn ra chân không.', v: V(10, 20, 2.2, [0.5, 0.9, 0.93]) },
    { d: 7, cap: 'n-Si cũng có electron tự do (do các nguyên tử donor nhả ra) nhưng công thoát chỉ ≈ 4,2 eV, nhỏ hơn kim loại — nghĩa là electron ở Si "dễ rời" hơn và muốn sang kim loại.', v: V(-10, 20, 2.2, [0.5, 0.9, 0.42]) },
    { d: 10, cap: 'Cận cảnh mặt tiếp xúc: electron tràn từ Si sang kim loại, bỏ lại các ion donor dương (ô vuông +) đứng yên. Vùng đầy ion + ấy là vùng nghèo; kim loại nhận thêm một lớp điện tích âm rất mỏng. Hai lớp điện tích trái dấu tạo điện trường chặn dòng chảy tiếp — đó là hàng rào Schottky.', v: V(0, 6, 3.6, [0.45, 1, 0.76]) },
    { d: 8, cap: 'Pha tạp nhẹ N_d = 10¹⁵: ion donor thưa nên phải lấy electron từ một lớp Si dày hơn mới đủ trung hòa — vùng nghèo giãn rộng.', v: V(0, 8, 2.4, [0.5, 1, 0.68]), set: { Nd: 1e15 } },
    { d: 8, cap: 'Pha tạp nặng N_d = 10¹⁸: ion dày đặc, chỉ cần một lớp rất mỏng là đủ — vùng nghèo co lại, điện trường ngay mặt tiếp xúc mạnh hơn nhiều.', v: V(0, 8, 3.2, [0.5, 1, 0.76]), set: { Nd: 1e18 } },
    { d: 7, cap: 'Đổi sang platin (φ_m = 5,65 eV): kim loại "giữ" electron chặt hơn nên hàng rào φ_B0 = φ_m − χ cao lên — xem đồng hồ bên phải.', v: V(0, 15, 1.3), set: { Nd: 1e16, metal: 'Pt' } },
    { d: 8, cap: 'Đổi sang nhôm (4,28 eV): φ_m gần bằng φ_s nên gần như không còn rào, electron chỉ tích tụ nhẹ ở mặt tiếp xúc — khả năng chỉnh lưu yếu đi hẳn.', v: V(0, 8, 3.0, [0.5, 1, 0.78]), set: { metal: 'Al' } }
  ],
  bias: [
    { d: 6, cap: 'Điốt Au/n-Si. Khối xanh là vùng nghèo; các chấm xanh là electron vượt qua mặt tiếp xúc giữa kim loại và bán dẫn.', v: V(20, 26, 1.0), orbit: 5, set: { Va: 0, Nd: 1e16 } },
    { d: 9, cap: 'Cân bằng V_a = 0: chỉ một số ít electron đủ năng lượng nhiệt để leo qua rào. Số lượt vượt rào theo hai chiều bằng nhau nên dòng tổng bằng 0.', v: V(0, 8, 3.4, [0.5, 0.5, 0.82]), slow: 0.3 },
    { d: 9, cap: 'Phân cực ngược: hạ V_a từ 0 xuống −5 V. Rào phía bán dẫn cao lên, vùng nghèo giãn rộng ra (khối xanh dày dần) và điện trường cực đại |E_max| tăng.', v: V(0, 10, 2.0, [0.5, 0.5, 0.6]), set: { Va: -5 }, slow: 0.5 },
    { d: 8, cap: 'Ở −5 V, electron phía bán dẫn phải leo một rào quá cao nên gần như không qua được; chỉ còn vài electron từ kim loại sang — dòng ngược rất nhỏ.', v: V(0, 8, 3.6, [0.5, 0.5, 0.84]), slow: 0.3 },
    { d: 10, cap: 'Phân cực thuận: nâng V_a lên +0,45 V. Rào phía bán dẫn hạ thấp, vùng nghèo co lại, và electron ào ạt xuyên qua vùng nghèo lên kim loại — đó là dòng thuận.', v: V(0, 8, 3.0, [0.5, 0.5, 0.74]), set: { Va: 0.45 }, slow: 0.3 },
    { d: 9, cap: 'Tăng V_a lên mức tối đa: rào hạ thêm, số electron vượt rào tăng theo hàm mũ — cứ cỡ 60 mV dòng lại tăng khoảng mười lần.', set: { Va: 0.65 } },
    { d: 8, cap: 'Giảm N_d xuống 10¹⁵ khi vẫn phân cực thuận: vùng nghèo dày hơn nên electron phải vượt quãng đường dài hơn trước khi sang kim loại.', v: V(0, 10, 2.4, [0.5, 0.5, 0.66]), set: { Nd: 1e15 } }
  ],
  cv: [
    { d: 6, cap: 'Trạm đo C–V: điốt Schottky Au/Si, đầu dò HI chạm kim loại. Khối xanh là vùng nghèo — nó đóng vai chất điện môi giữa hai "bản tụ".', v: V(25, 28, 1.0), orbit: 5, set: { metal: 'Au', semi: 'Si', Nd: 1e16, VR: 0 } },
    { d: 9, cap: 'Nhìn ngang: bản trên là kim loại, bản dưới là mép vùng nghèo ở độ sâu W, khoảng giữa chứa các ion donor dương. Điện dung trên đơn vị diện tích là C′ = ε_s / W, giống tụ phẳng.', v: V(0, 5, 2.8, [0.5, 1, 0.74]) },
    { d: 11, cap: 'Quét điện áp ngược V_R từ 0 lên 5 V: mép vùng nghèo lùi sâu vào Si, hai bản tụ tách xa nhau nên C′ giảm — kim đồng hồ điện dung quay xuống.', v: V(0, 5, 2.4, [0.5, 1, 0.64]), set: { VR: 5 } },
    { d: 8, cap: 'Từ các số đo C′ theo V_R: đồ thị 1/C′² là đường thẳng. Độ dốc cho biết nồng độ pha tạp N_d, điểm cắt trục cho biết thế tiếp xúc V_bi.', v: V(15, 22, 1.2), set: { VR: 2 } },
    { d: 8, cap: 'Tăng N_d lên 10¹⁷: vùng nghèo mỏng đi, hai bản tụ sát nhau hơn nên C′ lớn hơn — độ dốc của đường 1/C′² vì thế nhỏ lại.', v: V(0, 5, 2.8, [0.5, 1, 0.74]), set: { Nd: 1e17 } },
    { d: 8, cap: 'Đổi sang GaAs và kim loại Pt: V_bi và φ_Bn thay đổi, các đồng hồ cho kết quả mới.', v: V(15, 22, 1.2), set: { Nd: 1e16, semi: 'GaAs', metal: 'Pt' } }
  ],
  image: [
    { d: 8, cap: 'Electron (−e) đứng cách mặt kim loại một đoạn x. Kim loại tạo ra một "điện tích ảnh" +e đối xứng bên trong gương, cách electron 2x.', v: V(0, 0, 2.6, [0.4, 0.56]), set: { E: 1e5, semi: 'Si' } },
    { d: 8, cap: 'Lực hút Coulomb F_ảnh (mũi tên đỏ) kéo electron về phía kim loại, còn điện trường vùng nghèo (mũi tên xanh) đẩy nó sâu vào bán dẫn. Hai lực cân bằng ở khoảng cách x_m — đó là đỉnh của rào.', v: V(0, 0, 3.2, [0.42, 0.56]) },
    { d: 9, cap: 'Tăng điện trường E từ 10⁵ lên 10⁶ V/cm: lực đẩy xanh mạnh hơn nên điểm cân bằng x_m dịch sát kim loại, đỉnh rào bị hạ thấp nhiều hơn (Δφ tăng).', v: V(0, 0, 2.6, [0.42, 0.56]), set: { E: 1e6 } },
    { d: 8, cap: 'Thử GaAs (ε_r = 13,1) ở cùng điện trường: Δφ và x_m khác Si vì hằng số điện môi khác.', set: { semi: 'GaAs' } },
    { d: 7, cap: 'Quay về Si, E = 10⁵ V/cm: x_m ≈ 1,75 nm và Δφ ≈ 0,035 V.', v: V(0, 0, 1.3, [0.5, 0.5]), set: { semi: 'Si', E: 1e5 } }
  ],
  pinning: [
    { d: 6, cap: 'Bề mặt lý tưởng (mức ghim 0%): kim loại áp thẳng lên bán dẫn nên hàng rào φ_Bn = φ_m − χ do kim loại quyết định.', v: V(25, 28, 1.0), orbit: 5, set: { pin: 0, semi: 'GaAs', metal: 'Au' } },
    { d: 6, cap: 'Đổi sang nhôm khi chưa ghim: φ_Bn tụt xuống theo công thoát thấp của Al (đồng hồ bên phải).', set: { metal: 'Al' } },
    { d: 6, cap: 'Đổi sang platin: φ_Bn lại vọt lên. Khi chưa ghim, kim loại nào thì rào đó.', set: { metal: 'Pt' } },
    { d: 9, cap: 'Thực tế giữa kim loại và bán dẫn có lớp oxit mỏng cùng các trạng thái bề mặt D_it (lớp đỏ). Kéo mức ghim lên 95%: lớp bẫy ngày càng đậm và tích điện âm.', v: V(0, 8, 3.2, [0.5, 1, 0.77]), set: { pin: 0.95 } },
    { d: 8, cap: 'Các điện tích âm dày đặc trên lớp D_it chắn đường sức điện trường như một tấm khiên: kim loại không còn "với tới" được bán dẫn, mức Fermi bị bẫy bề mặt ghim lại.', v: V(0, 8, 3.8, [0.5, 1, 0.77]) },
    { d: 6, cap: 'Với bề mặt đã ghim 95%, đổi sang nhôm: φ_Bn gần như không đổi.', v: V(15, 18, 1.4), set: { metal: 'Al' } },
    { d: 6, cap: 'Đổi tiếp sang platin vẫn thế: kim loại đã mất quyền quyết định hàng rào.', set: { metal: 'Pt' } }
  ],
  iv: [
    { d: 8, cap: 'Bàn đo I–V: điốt Schottky đặt trên đế gia nhiệt. Các chấm xanh là electron đa số đang nhảy qua hàng rào — chúng ta sẽ quan sát chúng ở chế độ chuyển động chậm.', v: V(0, 0, 3.8, [0.35, 0.5]), set: { phiBn: 0.8, T: 300, Va: 0.44, imgOn: 0 }, slow: 0.3 },
    { d: 8, cap: 'Đặt V_a = 0: không có điện trường ngoài, electron qua lại hai chiều như nhau nên dòng bằng không.', set: { Va: 0 } },
    { d: 9, cap: 'Tăng V_a thuận lên 0,6 V: rào hạ thấp, ngày càng nhiều electron đủ năng lượng vượt qua — dòng tăng theo hàm mũ.', set: { Va: 0.6 } },
    { d: 9, cap: 'Nung đế từ 300 lên 400 K: electron có nhiều động năng nhiệt hơn nên nhiều hạt hơn leo được qua rào, dòng bão hòa J_sT = A*T²·exp(−eφ_Bn/kT) tăng mạnh.', set: { T: 400, Va: 0.3 } },
    { d: 8, cap: 'Hạ rào φ_Bn từ 0,8 xuống 0,6 V: dòng bão hòa J_sT tăng cỡ hàng nghìn lần — xem đồng hồ bên phải.', v: V(0, 0, 1.4, [0.55, 0.5]), set: { phiBn: 0.6, T: 300 }, slow: 1 },
    { d: 9, cap: 'Phân cực ngược V_a = −3 V với hiệu ứng lực ảnh bật: dòng ngược rất nhỏ nhưng tăng chậm theo |V_a| vì rào bị hạ dần.', set: { phiBn: 0.8, Va: -3, imgOn: 1 } }
  ],
  compare: [
    { d: 7, cap: 'Hai điốt cùng chịu mật độ dòng J = 10 A/cm². Bên trái: Schottky (hạt tải đa số). Bên phải: p-n (hạt tải thiểu số).', v: V(0, 0, 1.1, [0.5, 0.5]), set: { Jtarget: 10, phiBn: 0.672, logJspn: -10.43 } },
    { d: 9, cap: 'Schottky chỉ cần V_a ≈ 0,31 V: dòng chỉ do electron đa số có sẵn chạy qua rào, không phải bơm hạt thiểu số vào.', v: V(0, 0, 2.7, [0.24, 0.5]), slow: 0.4 },
    { d: 9, cap: 'Điốt p-n phải tới ≈ 0,68 V: dòng bão hòa J_s của nó nhỏ hơn hàng triệu lần nên cần áp lớn hơn nhiều mới đẩy được cùng dòng.', v: V(0, 0, 2.7, [0.755, 0.5]) },
    { d: 8, cap: 'Tăng dòng lên 100 A/cm²: cả hai cùng tăng áp, nhưng Schottky luôn thấp hơn nên tỏa nhiệt ít hơn.', v: V(0, 0, 1.2, [0.5, 0.5]), set: { Jtarget: 100 }, slow: 1 },
    { d: 8, cap: 'Nâng hàng rào Schottky φ_Bn lên 0,90 V: J_s giảm, điện áp mở tăng dần — ưu thế thu hẹp.', set: { Jtarget: 10, phiBn: 0.9 } },
    { d: 8, cap: 'Giảm J_s của p-n xuống 10⁻¹²: p-n càng khó dẫn, chênh lệch ΔV với Schottky càng lớn.', set: { phiBn: 0.672, logJspn: -12 } }
  ],
  switch: [
    { d: 7, cap: 'Xung thuận (ON): cả hai điốt đều dẫn. Trái: Schottky chỉ có electron đa số. Phải: p-n bơm đầy lỗ trống (chấm đỏ) vào miền n và tích trữ ở đó.', v: V(0, 0, 1.1, [0.5, 0.54]), set: { mode: 'on', tauNs: 20 } },
    { d: 8, cap: 'Đám mây lỗ trống thiểu số bên p-n là điện tích tích trữ Q. Muốn tắt điốt, phải chờ chúng biến mất — mất cỡ thời gian sống τ_p.', v: V(0, 0, 2.8, [0.75, 0.54]), slow: 0.4 },
    { d: 9, cap: 'Chuyển sang ngược (OFF): Schottky tắt tức thì vì không có điện tích thiểu số nào tích trữ — chuyển mạch cỡ picô giây.', v: V(0, 0, 2.4, [0.25, 0.54]), set: { mode: 'off' } },
    { d: 9, cap: 'Điốt p-n bị kẹt: lỗ trống phải bị rút ngược ra trong thời gian t_rr, mạch vẫn chảy dòng ngược (hộp viền đỏ).', v: V(0, 0, 2.8, [0.75, 0.54]) },
    { d: 8, cap: 'Tăng τ_p lên 50 ns: đám mây lỗ trống tan chậm hơn, t_rr kéo dài.', set: { tauNs: 50 } },
    { d: 9, cap: 'Giảm τ_p còn 5 ns và cho xung chạy tự động: p-n nhanh hơn nhưng vẫn không bằng Schottky.', v: V(0, 0, 1.05, [0.5, 0.54]), set: { tauNs: 5, mode: 'auto' }, slow: 1 }
  ],
  ohmic: [
    { d: 6, cap: 'Tiếp xúc ohmic cho bán dẫn loại n: φ_m = 4,05 V nhỏ hơn φ_s ≈ 4,22 V nên không có rào. Sát kim loại là một lớp electron tích lũy (lớp xanh mỏng).', v: V(25, 28, 1.0), orbit: 5, set: { type: 'n', phiM: 4.05, Va: 0.3 } },
    { d: 9, cap: 'Cận cảnh: với V_a = +0,3 V, electron đa số chảy thẳng qua mặt tiếp xúc, không có hàng rào nào chặn đường.', v: V(0, 8, 3.4, [0.5, 0.5, 0.82]), slow: 0.3 },
    { d: 9, cap: 'Đảo cực sang −0,5 V: electron chạy ngược chiều và vẫn qua dễ dàng như cũ. Dòng tuyến tính, đối xứng hai chiều — đúng nghĩa tiếp xúc ohmic.', set: { Va: -0.5 } },
    { d: 9, cap: 'Nâng φ_m lên 5,2 V (lớn hơn φ_s): lớp tích lũy biến mất, vùng nghèo hiện ra và chặn electron lại — tiếp xúc thành Schottky, mất dòng một chiều.', v: V(0, 8, 3.0, [0.5, 0.5, 0.74]), set: { phiM: 5.2, Va: 0.3 }, slow: 0.4 },
    { d: 8, cap: 'Bán dẫn loại p thì ngược lại: hạt tải là lỗ trống (chấm đỏ) và cần φ_m lớn hơn φ_s (≈ 4,92 V) để lỗ trống tích lũy sát tiếp xúc.', v: V(0, 8, 3.2, [0.5, 0.5, 0.8]), set: { type: 'p', phiM: 5.15, Va: 0.3 }, slow: 0.3 },
    { d: 8, cap: 'Hạ φ_m xuống 3,9 V ở loại p: lớp tích lũy lỗ trống mất, vùng nghèo xuất hiện, dòng bị chặn.', set: { phiM: 3.9 } }
  ],
  tunnel: [
    { d: 6, cap: 'Pha tạp vừa phải N_d = 10¹⁷: vùng nghèo dày khoảng 100 nm (khối xanh dày) — một bức tường quá dày với electron.', v: V(25, 28, 1.0), orbit: 5, set: { Nd: 1e17, phiBn: 0.8 } },
    { d: 8, cap: 'Cận cảnh dưới chân tường: các electron (chấm đỏ) nảy lên rồi rơi xuống — chúng chỉ đập vào rào chứ không thể xuyên qua một bức tường dày thế.', v: V(0, 8, 2.8, [0.5, 0.5, 0.14]), slow: 0.35 },
    { d: 11, cap: 'Tăng N_d lên 10¹⁹: bề rộng W ∝ 1/√N_d co mỏng còn cỡ 10 nm, vùng nghèo đổi màu — và electron bắt đầu xuyên qua tường.', v: V(0, 8, 3.0, [0.5, 0.5, 0.78]), set: { Nd: 1e19 }, slow: 0.35 },
    { d: 10, cap: 'Quan sát thật chậm: electron không leo lên đỉnh rào mà "thấm" xuyên qua tường mỏng như qua một đường hầm. Đó là hiệu ứng xuyên hầm lượng tử: xác suất qua rào giảm theo hàm mũ của bề dày tường.', v: V(0, 8, 4.2, [0.5, 0.5, 0.82]), slow: 0.22 },
    { d: 8, cap: 'N_d = 10²⁰: tường mỏng hơn nữa, xuyên hầm càng mạnh, điện trở tiếp xúc càng thấp — tiếp xúc trở thành ohmic.', v: V(0, 8, 3.4, [0.5, 0.5, 0.84]), set: { Nd: 1e20 }, slow: 0.35 },
    { d: 8, cap: 'Hạ φ_Bn xuống 0,5 V: tường vừa mỏng vừa thấp, electron xuyên qua càng dễ dàng.', set: { phiBn: 0.5 } }
  ],
  anderson: [
    { d: 6, cap: 'Ghép epitaxy: hai lớp bán dẫn khác nhau (Ge và GaAs) chồng lên nhau. Quy tắc Anderson lấy mức chân không làm mốc chung để so sánh các vùng năng lượng.', v: V(25, 28, 1.0), orbit: 5, set: { m1: 'Ge', m2: 'GaAs' } },
    { d: 9, cap: 'Cận cảnh mặt ghép: độ lệch vùng dẫn ΔE_c = |χ₁ − χ₂| và vùng hóa trị ΔE_v hình thành ngay tại đây — xem bậc thềm ở khung "Bên trong".', v: V(0, 6, 3.0, [0.5, 1, 0.5]) },
    { d: 8, cap: 'Đổi sang cặp GaAs/AlAs: vùng cấm của GaAs nằm gọn trong vùng cấm của AlAs — kiểu bao trùm (Straddling).', set: { m1: 'GaAs', m2: 'AlAs' } },
    { d: 8, cap: 'Cặp InAs/GaSb: vùng cấm bị gãy (Broken Gap) — đáy vùng dẫn InAs thấp hơn đỉnh vùng hóa trị GaSb.', set: { m1: 'InAs', m2: 'GaSb' } },
    { d: 8, cap: 'Cặp Si/GaAs: ΔE_c rất nhỏ, gần như toàn bộ chênh lệch vùng cấm dồn vào vùng hóa trị.', set: { m1: 'Si', m2: 'GaAs' } }
  ],
  heteronp: [
    { d: 6, cap: 'Dị tiếp giáp n-Ge / P-GaAs: hai khối khác chất ghép cạnh nhau, trái là n-Ge, phải là P-GaAs.', v: V(25, 28, 1.0), orbit: 5, set: { Nd: 1e16, Na: 1e16 } },
    { d: 9, cap: 'Cận cảnh mặt ghép: hai phía là vùng nghèo (nền đậm) — ion donor dương bên n, ion acceptor âm bên P — chúng tạo điện trường nội.', v: V(0, 8, 2.8, [0.5, 1, 0.5]) },
    { d: 9, cap: 'Tăng N_d của n-Ge lên 10¹⁷: để điện tích hai bên bù nhau, vùng nghèo bên n co lại còn bên P giãn ra — luôn thỏa N_d·x_n = N_a·x_P.', set: { Nd: 1e17 } },
    { d: 8, cap: 'Giảm N_d xuống 10¹⁵: ngược lại, vùng nghèo bên n phình rộng, bên P hẹp đi.', set: { Nd: 1e15 } },
    { d: 8, cap: 'Cho N_d = 10¹⁶ rồi tăng N_a của P-GaAs lên 10¹⁷: lúc này bên P co lại, bên n giãn ra.', set: { Nd: 1e16, Na: 1e17 } }
  ],
  heteronn: [
    { d: 6, cap: 'Dị tiếp giáp đẳng loại: lớp N-AlGaAs (phía trên, chứa ion donor +) ghép lên n-GaAs (phía dưới).', v: V(25, 28, 1.0), orbit: 5, set: { ND: 2e17, dEc: 0.3 } },
    { d: 10, cap: 'Cận cảnh: electron rời donor ở AlGaAs rồi rơi xuống GaAs vì vùng dẫn bên GaAs thấp hơn. Các chấm vàng là electron tụ lại thành màng mỏng, trượt dọc sát mặt tiếp xúc — tách hẳn khỏi các ion + phía trên.', v: V(-12, 12, 3.2, [0.5, 0.7, 0.5]), slow: 0.3 },
    { d: 8, cap: 'Tăng N_D lên 10¹⁸: nhiều donor hơn nên nhiều electron rơi xuống hơn — màng dày đặc và đậm hơn.', set: { ND: 1e18 } },
    { d: 8, cap: 'Tăng ΔE_c lên 0,48 eV: khe tam giác sâu hơn nên giữ electron chặt hơn.', set: { dEc: 0.48 } },
    { d: 8, cap: 'Pha tạp nhẹ N_D = 10¹⁶ và ΔE_c chỉ 0,15 eV: màng electron mờ nhạt, ít hạt tụ lại.', set: { ND: 1e16, dEc: 0.15 } }
  ],
  twodeg: [
    { d: 6, cap: 'Khí điện tử 2 chiều (2-DEG): tấm xanh siêu mỏng nằm ở mặt phân cách, các chấm là electron chạy trong tấm.', v: V(25, 35, 1.0), orbit: 5, set: { F: 1e5, mRel: 0.067 } },
    { d: 10, cap: 'Nhìn từ trên xuống, chuyển động chậm: electron trượt tự do theo cả x lẫn y — hai bậc tự do.', v: V(0, 62, 2.4, [0.5, 0.5, 0.93]), slow: 0.3 },
    { d: 9, cap: 'Nhìn ngang: tấm chỉ dày vài nm. Electron bị nhốt theo phương z nên năng lượng theo z chỉ nhận các giá trị rời rạc E₀, E₁ (xem khung "Bên trong").', v: V(0, 5, 3.6, [0.5, 1, 0.93]), slow: 0.3 },
    { d: 9, cap: 'Tăng điện trường F lên 4×10⁵ V/cm: khe thế hẹp lại, E₀ và E₁ tăng mạnh (∝ F^(2/3)).', v: V(15, 25, 1.4), set: { F: 4e5 }, slow: 1 },
    { d: 8, cap: 'Đổi sang khối lượng hiệu dụng của Si (0,19 m₀): hạt nặng hơn nên E₀, E₁ thấp xuống.', set: { F: 1e5, mRel: 0.19 } },
    { d: 8, cap: 'InGaAs (0,041 m₀): hạt nhẹ nên các mức rời rạc cao và cách xa nhau.', set: { mRel: 0.041 } }
  ],
  hemt: [
    { d: 6, cap: 'Transistor HEMT: ba điện cực trên mặt — Nguồn (S), Cổng (G), Máng (D) — đặt trên lớp N-AlGaAs; kênh dẫn là lớp GaAs sạch nằm bên dưới.', v: V(25, 28, 1.0), orbit: 5, set: { VG: 0, dNm: 25, VDS: 1 } },
    { d: 10, cap: 'Cận cảnh kênh 2-DEG: electron (chấm vàng) bị nhốt ở GaAs không pha tạp nên không va chạm với ion donor, chạy rất nhanh từ Nguồn sang Máng.', v: V(-10, 16, 2.6, [0.5, 0.5, 0.52]), slow: 0.3, track: u => [0.15 + 0.7 * u, 0.5, 0.52] },
    { d: 9, cap: 'Tăng V_DS lên 2 V: điện trường dọc kênh mạnh hơn, electron chạy nhanh hơn và dòng I_DS tăng.', set: { VDS: 2 }, v: V(-10, 16, 2.6, [0.5, 0.5, 0.52]), track: u => [0.85 - 0.7 * u, 0.5, 0.52] },
    { d: 11, cap: 'Hạ V_G xuống −1 V: cổng âm đẩy electron ra khỏi kênh phía dưới — kênh thưa dần rồi cạn hẳn khi V_G < V_off ≈ −0,85 V, dòng tắt.', set: { VG: -1 }, v: V(-10, 14, 2.4, [0.5, 0.5, 0.52]) },
    { d: 9, cap: 'Mở cổng V_G = +0,4 V: kênh dày đặc electron, dòng rất lớn.', set: { VG: 0.4, VDS: 1.2 } },
    { d: 8, cap: 'Tăng bề dày lớp AlGaAs lên 50 nm: cổng xa kênh hơn nên mật độ n_s ∝ 1/d giảm, kênh thưa electron hơn.', set: { dNm: 50 }, v: V(15, 20, 1.6, [0.5, 0.5, 0.5]), slow: 1 }
  ]
};

const NOCAM = new Set(['image', 'compare', 'switch']);
NOCAM.forEach(id => FILM[id].forEach(st => { delete st.v; }));
const THREE = new Set(['schottky', 'bias', 'cv', 'pinning', 'ohmic', 'tunnel', 'anderson', 'heteronp', 'heteronn', 'twodeg', 'hemt']);

const LABS = [];

/* ==========================================================================
   1. MỤC 1.4 — HÌNH THÀNH HÀNG RÀO SCHOTTKY: 3D TIẾP XÚC & GIẢN ĐỒ TRƯỚC/SAU
   ========================================================================== */
LABS.push({
  id: 'schottky', tag: '1.4', name: 'Hàng rào', sec: 1,
  S: { metal: 'Au', semi: 'Si', Nd: 1e16 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Khối tiếp xúc Kim loại / Bán dẫn loại n — trao đổi electron & hình thành vùng nghèo',
      area: 'a', anim: true,
      ctrls: [
        { k: 'metal', seg: [['Al', 'Al'], ['W', 'W'], ['Au', 'Au'], ['Pt', 'Pt']] },
        { k: 'semi', seg: [['Si', 'Si'], ['GaAs', 'GaAs'], ['Ge', 'Ge']] },
        { k: 'Nd', l: 'N_d', min: 15, max: 18, step: 0.1, log: 1, f: v => pw(v) },
        { btn: 'Ví dụ 1.1', fn: p => { p.S.metal = 'Au'; p.S.semi = 'Si'; p.S.Nd = 1e16; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, r = schottkyCalc(S.metal, S.semi, S.Nd, 0);
        const bw = Math.min(320, W * 0.52), bd = Math.min(144, H * 0.40), subH = Math.min(110, H * 0.36), mtH = 26;
        const ox = W * 0.24, oy = H * 0.76;
        const depFrac = r.isRect ? clamp((r.W * 1e4) / 0.9, 0.16, 0.72) : 0;
        const depH = subH * depFrac;

        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, subH, C.card, 1, C.sub);
        if (r.isRect) {
          isoBox(ctx, ox, oy, 0, 0, subH - depH, bw, bd, depH, C.c5, 0.34, C.c5);
          // Ion donor dương (+) cố định lộ ra trên mặt trước vùng nghèo
          for (let i = 0; i < 6; i++) {
            const pt = isoP(ox, oy, 24 + i * ((bw - 48) / 5), bd, subH - depH * 0.5);
            drawIon(ctx, pt[0], pt[1], '+', C.c4, 4.8);
          }
        } else {
          // Lớp tích lũy electron khi phi_m < phi_s
          isoBox(ctx, ox, oy, 0, 0, subH - 12, bw, bd, 12, C.c2, 0.55 + 0.15 * Math.sin(t * 5), C.c2);
        }
        isoBox(ctx, ox, oy, 0, 0, subH, bw, bd, mtH, r.mt.col, 0.92, C.ink);

        // Điện tích âm mỏng trên mặt dưới kim loại (nếu chỉnh lưu)
        if (r.isRect) {
          for (let i = 0; i < 6; i++) {
            const pt = isoP(ox, oy, 24 + i * ((bw - 48) / 5), bd, subH + 5);
            txt(ctx, '−', pt[0], pt[1], C.c2, 12, 'center', 800);
          }
        }

        const lbMt = isoP(ox, oy, 0, bd, subH + mtH * 0.5);
        const lbSi = isoP(ox, oy, 0, bd, subH * 0.42);
        txt(ctx, r.mt.name + ' (φ_m=' + r.mt.phiM + 'V)', lbMt[0] - 8, lbMt[1], C.main, 10.5, 'right', 700);
        txt(ctx, 'n-' + r.sm.name + ' (χ=' + r.sm.chi + 'V)', lbSi[0] - 8, lbSi[1], C.ink, 10.5, 'right', 700);

        const gx = W - 66;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Hàng rào φ_B0', r.phiB0.toFixed(2) + ' V', clamp(r.phiB0 / 1.7, 0, 1), r.isRect ? C.main : C.c2);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Thế tiếp xúc V_bi', r.isRect ? r.Vbi.toFixed(3) + ' V' : 'Không rào', clamp(r.Vbi / 1.5, 0, 1), r.isRect ? C.c5 : C.c2);

        chip(ctx, r.isRect
          ? 'φ_m (' + r.mt.phiM + 'V) > φ_s (' + r.phiS.toFixed(2) + 'V) → CHỈNH LƯU SCHOTTKY (W = ' + fmtLen(r.W) + ')'
          : 'φ_m (' + r.mt.phiM + 'V) ≤ φ_s (' + r.phiS.toFixed(2) + 'V) → KHÔNG CÒN HÀNG RÀO (OHMIC)',
          W * 0.44, 15, r.isRect ? C.main : C.c2, 'center');
      }
    },
    {
      title: 'Bên trong (chiều dọc trên → dưới đồng bộ khối 3D): Kim loại → Mặt tiếp xúc → Vùng nghèo & Lõi n',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, r = schottkyCalc(S.metal, S.semi, S.Nd, 0);
        const padX = 16, rightLbl = 148, topY = 10, botY = H - 10;
        const bw = W - padX - rightLbl, bh = botY - topY;
        const mtH = bh * 0.24, yIf = topY + mtH, siH = botY - yIf;
        const depPx = r.isRect ? clamp((r.W * 1e4 / 0.9) * siH * 0.68, 22, siH * 0.72) : 0;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.28; ctx.fillStyle = r.mt.col; ctx.fillRect(padX, topY, bw, mtH);
        if (r.isRect) {
          ctx.globalAlpha = 0.18; ctx.fillStyle = C.c5; ctx.fillRect(padX, yIf, bw, depPx);
        } else {
          ctx.globalAlpha = 0.36; ctx.fillStyle = C.c2; ctx.fillRect(padX, yIf, bw, 20);
        }
        ctx.restore();

        ln(ctx, padX, yIf, padX + bw, yIf, C.ink, 1.8);
        if (r.isRect) {
          ln(ctx, padX, yIf + depPx, padX + bw, yIf + depPx, C.c5, 1.5, [4, 3]);
          // Lớp điện tích âm mỏng trên mặt dưới kim loại & mũi tên điện trường E hướng lên kim loại
          const nCols = Math.max(6, Math.floor(bw / 36));
          for (let i = 0; i < nCols; i++) {
            const x = padX + (i + 0.5) * (bw / nCols);
            txt(ctx, '−', x, yIf - 8, C.c2, 13, 'center', 800);
            drawIon(ctx, x, yIf + depPx * 0.52, '+', C.c4, 4.8);
            arr(ctx, x, yIf + depPx - 6, x, yIf + 4, C.main, 1.4);
          }
        } else {
          // Electron tràn xuống tạo lớp tích lũy sát mặt phân cách
          for (let i = 0; i < 14; i++) {
            const x = padX + (i + 0.5) * (bw / 14) + Math.sin(t * 6 + i) * 3;
            const y = yIf + 10 + Math.cos(t * 5 + i) * 2;
            dot(ctx, x, y, 4.2, C.c2); txt(ctx, '−', x, y + 0.5, C.bg, 8, 'center', 800);
          }
        }

        // Electron chuyển động nhiệt trong lõi bán dẫn bên dưới
        const bTop = yIf + (r.isRect ? depPx + 6 : 24), bH = Math.max(14, botY - bTop);
        for (let k = 0; k < 14; k++) {
          const x = padX + 12 + ((k * 43 + Math.sin(t * 3 + k) * 18) % (bw - 24) + (bw - 24)) % (bw - 24);
          const y = bTop + ((k * 19 + Math.cos(t * 2.8 + k) * 8) % bH + bH) % bH;
          dot(ctx, x, y, 4, C.c2);
        }

        const lx = padX + bw + 8;
        txt(ctx, '▲ ' + r.mt.name + ' (φ_m=' + r.mt.phiM + 'V)', lx, topY + mtH * 0.5, C.main, 10, 'left', 700);
        txt(ctx, r.isRect ? '▸ Vùng nghèo W=' + fmtLen(r.W) : '▸ Lớp tích lũy e⁻!', lx, yIf + Math.max(14, depPx * 0.5), r.isRect ? C.c5 : C.c2, 10, 'left', 700);
        txt(ctx, 'φ_B0=' + r.phiB0.toFixed(2) + 'V · V_bi=' + r.Vbi.toFixed(2) + 'V', lx, botY - 22, C.ink, 9.8, 'left', 700);
        txt(ctx, '▼ Lõi n-' + r.sm.name + ' (N_d=' + pw(S.Nd) + ')', lx, botY - 8, C.mut, 9.6, 'left', 600);
      }
    }
  ]
});

/* ==========================================================================
   2. MỤC 2.3 — PHÂN CỰC THUẬN & NGƯỢC: HÀNG RÀO, VÙNG NGHÈO & DÒNG ELECTRON
   ========================================================================== */
LABS.push({
  id: 'bias', tag: '2.3', name: 'Phân cực', sec: 2,
  S: { Va: 0.0, Nd: 1e16 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Phân cực điốt Au/n-Si — vùng nghèo co/giãn & chiều electron vượt rào',
      area: 'a', anim: true,
      ctrls: [
        { k: 'Va', l: 'V_a', min: -5.0, max: 0.65, step: 0.05, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' },
        { k: 'Nd', l: 'N_d', min: 15, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { btn: 'Ngược −5V', fn: p => { p.S.Va = -5.0; p.S.Nd = 1e16; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Cân bằng 0V', fn: p => { p.S.Va = 0.0; p.S.Nd = 1e16; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Thuận +0.45V', fn: p => { p.S.Va = 0.45; p.S.Nd = 1e16; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, VR = -S.Va;
        const r = schottkyCalc('Au', 'Si', S.Nd, VR);
        const Vbar = Math.max(0.05, r.Vbi - S.Va);
        const mode = S.Va > 0.03 ? 'fwd' : S.Va < -0.03 ? 'rev' : 'eq';
        const mCol = mode === 'fwd' ? C.c2 : mode === 'rev' ? C.err : C.main;

        const bw = Math.min(310, W * 0.50), bd = Math.min(136, H * 0.38), subH = Math.min(116, H * 0.38), mtH = 22;
        const ox = W * 0.24, oy = H * 0.78;
        const depH = clamp((r.W * 1e4 / 1.2) * subH * 0.85, 10, subH * 0.88);

        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, subH, C.card, 1, C.sub);
        isoBox(ctx, ox, oy, 0, 0, subH - depH, bw, bd, depH, C.c5, 0.34, C.c5);
        isoBox(ctx, ox, oy, 0, 0, subH, bw, bd, mtH, METALS.Au.col, 0.92, C.ink);

        // Hạt electron chuyển động dọc trục thẳng đứng qua mặt tiếp xúc
        const nFlow = mode === 'fwd' ? Math.round(4 + clamp(S.Va / 0.65, 0, 1) * 10) : 2;
        for (let i = 0; i < nFlow; i++) {
          const u = (t * (mode === 'fwd' ? 1.1 + S.Va * 1.4 : 0.35) + i / nFlow) % 1;
          const z = mode === 'fwd' ? (subH - depH + u * (depH + 14)) : (subH + 6 - u * 16);
          const pt = isoP(ox, oy, 30 + (i % 5) * ((bw - 60) / 4), bd * 0.5, z);
          dot(ctx, pt[0], pt[1], 4.2, C.c2);
        }

        const pTop = isoP(ox, oy, bw * 0.5, bd * 0.5, subH + mtH);
        drawProbe(ctx, pTop[0], pTop[1], 1, mCol, (S.Va >= 0 ? '+' : '−') + Math.abs(S.Va).toFixed(2) + 'V');

        const gx = W - 66;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Vùng nghèo W', fmtLen(r.W), clamp((r.W * 1e4) / 1.2, 0, 1), C.c5);
        drawMiniGauge(ctx, gx, H * 0.72, 22, '|E_max|', sci(r.Emax, 2) + ' V/cm', clamp(r.Emax / 3e5, 0, 1), C.err, 0.75);

        chip(ctx, mode === 'fwd' ? 'PHÂN CỰC THUẬN: Rào bán dẫn hạ còn ' + Vbar.toFixed(2) + 'V → e⁻ ồ ạt sang kim loại!'
          : mode === 'rev' ? 'PHÂN CỰC NGƯỢC: Rào tăng ' + Vbar.toFixed(2) + 'V, W giãn rộng, C\'=' + (r.Cprime * 1e9).toFixed(1) + ' nF/cm²'
          : 'CÂN BẰNG (V_a = 0 V): J_{s→m} = J_{m→s}, dòng tổng = 0', W * 0.44, 15, mCol, 'center');
      }
    },
    {
      title: 'Bên trong (chiều dọc đồng bộ 3D): Hai luồng electron J_{s→m} (thay đổi theo V_a) & J_{m→s} (cố định)',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, r = schottkyCalc('Au', 'Si', S.Nd, -S.Va);
        const Vbar = Math.max(0.05, r.Vbi - S.Va);
        const padX = 16, rightLbl = 164, topY = 10, botY = H - 10;
        const bw = W - padX - rightLbl, bh = botY - topY;
        const mtH = bh * 0.22, yIf = topY + mtH, siH = botY - yIf;
        const depPx = clamp((r.W * 1e4 / 1.2) * siH * 0.72, 14, siH * 0.78);

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.28; ctx.fillStyle = METALS.Au.col; ctx.fillRect(padX, topY, bw, mtH);
        ctx.globalAlpha = 0.20; ctx.fillStyle = C.c5; ctx.fillRect(padX, yIf, bw, depPx);
        ctx.restore();

        ln(ctx, padX, yIf, padX + bw, yIf, C.ink, 1.8);
        ln(ctx, padX, yIf + depPx, padX + bw, yIf + depPx, C.c5, 1.5, [4, 3]);

        // Ion donor dương lộ ra trong vùng nghèo
        const nCols = Math.max(5, Math.floor(bw / 44));
        for (let i = 0; i < nCols; i++) {
          drawIon(ctx, padX + (i + 0.5) * (bw / nCols), yIf + depPx * 0.5, '+', C.c4, 4.6);
        }

        // Luồng 1 (bên trái): J_{m->s} từ kim loại xuống bán dẫn — LUÔN nhỏ & cố định vì phi_B0 đứng yên!
        const xLeft = padX + bw * 0.25;
        arr(ctx, xLeft, topY + 6, xLeft, yIf + 22, C.err, 2);
        const uDown = (t * 0.65) % 1;
        dot(ctx, xLeft, topY + 8 + uDown * (mtH + 22), 4, C.err);
        txt(ctx, 'J_{m→s} (cố định)', xLeft + 8, topY + mtH * 0.5, C.err, 9.5, 'left', 700);

        // Luồng 2 (bên phải): J_{s->m} từ bán dẫn lên kim loại — bùng mạnh khi thuận, tắc khi ngược!
        const xRight = padX + bw * 0.70;
        const nUp = S.Va > 0.05 ? Math.round(3 + clamp(S.Va / 0.65, 0, 1) * 9) : S.Va < -0.2 ? 0 : 1;
        if (nUp > 0) {
          arr(ctx, xRight, botY - 8, xRight, topY + 6, C.c2, 1.8 + clamp(S.Va * 3, 0, 2.2));
          for (let k = 0; k < nUp; k++) {
            const u = (t * (0.7 + Math.max(0, S.Va) * 2.2) + k / nUp) % 1;
            const ey = botY - 8 - u * (bh - 16);
            dot(ctx, xRight + Math.sin(u * 12 + k) * 4, ey, 4.2, C.c2);
          }
        } else {
          // Phân cực ngược: electron từ dưới dội bật ngược lại mép vùng nghèo
          const bounce = Math.abs(Math.sin(t * 4));
          dot(ctx, xRight, yIf + depPx + 4 + bounce * 10, 4, C.c2);
          txt(ctx, 'Bị rào chặn!', xRight + 10, yIf + depPx + 8, C.err, 9.5, 'left', 700);
        }

        const lx = padX + bw + 8;
        txt(ctx, 'Rào kim loại φ_B0: 1.09V', lx, topY + 16, C.main, 10, 'left', 700);
        txt(ctx, '(KHÔNG ĐỔI theo V_a)', lx, topY + 30, C.mut, 9.2, 'left', 600);
        txt(ctx, 'Rào bán dẫn: ' + Vbar.toFixed(2) + ' V', lx, yIf + depPx * 0.5, C.c5, 10.2, 'left', 800);
        txt(ctx, 'W = ' + fmtLen(r.W), lx, botY - 12, C.ink, 10.2, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   3. MỤC 2.6 — ĐO C-V TIẾP XÚC SCHOTTKY: TRẠM LCR 3D & TRÍCH XUẤT 1/C'^2 - V_R
   ========================================================================== */
LABS.push({
  id: 'cv', tag: '2.6', name: 'Đo C-V', sec: 2,
  S: { metal: 'Au', semi: 'Si', Nd: 1e16, VR: 2.0 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Trạm đo LCR trên tiếp xúc Schottky — quét V_R đo điện dung C\' = ε_s / W',
      area: 'a', anim: true,
      ctrls: [
        { k: 'metal', seg: [['Au', 'Au'], ['W', 'W'], ['Pt', 'Pt']] },
        { k: 'semi', seg: [['Si', 'Si'], ['GaAs', 'GaAs']] },
        { k: 'Nd', l: 'N_d', min: 15, max: 17, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'VR', l: 'V_R', min: 0, max: 5.0, step: 0.2, f: v => v.toFixed(1) + ' V' },
        { btn: 'VD 2.1 (5V)', fn: p => { p.S.metal = 'Au'; p.S.semi = 'Si'; p.S.Nd = 1e16; p.S.VR = 5.0; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, r = schottkyCalc(S.metal, S.semi, S.Nd, S.VR);
        const bw = Math.min(210, W * 0.35), bd = Math.min(120, H * 0.34), siH = Math.min(76, H * 0.28);
        const ox = W * 0.20, oy = H * 0.74;
        const depH = clamp((r.W * 1e4 / 1.2) * siH * 0.85, 10, siH * 0.86);

        isoBox(ctx, ox, oy, -12, -10, -14, bw + 24, bd + 20, 14, C.c3, 0.45, C.sub);
        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, siH, C.card, 1, C.sub);
        isoBox(ctx, ox, oy, 0, 0, siH - depH, bw, bd, depH, C.c5, 0.36, C.c5);
        isoBox(ctx, ox, oy, bw * 0.15, bd * 0.15, siH, bw * 0.70, bd * 0.70, 14, r.mt.col, 0.92, C.ink);

        const pTop = isoP(ox, oy, bw * 0.5, bd * 0.5, siH + 14);
        drawProbe(ctx, pTop[0], pTop[1], 1, C.main, 'HI');

        const gx = W - 66, gr = H < 330 ? 18 : 22;
        drawMiniGauge(ctx, gx, H * 0.22, gr, 'Điện dung C\'', (r.Cprime * 1e9).toFixed(1) + ' nF/cm²', clamp(r.Cprime / 4e-8, 0, 1), C.main);
        drawMiniGauge(ctx, gx, H * 0.50, gr, 'Vùng nghèo W', fmtLen(r.W), clamp((r.W * 1e4) / 1.2, 0, 1), C.c5);
        drawMiniGauge(ctx, gx, H * 0.78, gr, 'φ_Bn', (r.Vbi + r.phiN).toFixed(3) + ' V', clamp((r.Vbi + r.phiN) / 1.6, 0, 1), C.c1);

        chip(ctx, 'Quét V_R = ' + S.VR.toFixed(1) + ' V → W = ' + fmtLen(r.W) + ', C\' = ' + (r.Cprime * 1e9).toFixed(1) + ' nF/cm²', W * 0.48, 15, C.main, 'center');
      }
    },
    {
      title: 'Bên trong (mô hình tụ phẳng xếp DỌC đồng bộ 3D): Bản cực Kim loại (trên) ↔ Mép vùng nghèo W rung theo AC (dưới)',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, r = schottkyCalc(S.metal, S.semi, S.Nd, S.VR);
        const r0 = schottkyCalc(S.metal, S.semi, S.Nd, 0);
        const r5 = schottkyCalc(S.metal, S.semi, S.Nd, 5.0);

        const padX = 18, rightInfo = Math.min(230, W * 0.40);
        const areaW = W - padX - rightInfo, cx = padX + areaW * 0.5;
        const pW = Math.min(200, areaW * 0.72), pH = 10;
        const osc = Math.sin(t * 5.5) * 2.8;

        const gapPx = clamp((r.W / Math.max(r5.W, 1e-6)) * (H * 0.52), 18, H * 0.56);
        const yTop = 14, yBot = yTop + pH + gapPx + osc;

        ln(ctx, cx, 2, cx, yTop, C.sub, 2.4);
        ln(ctx, cx, yBot + pH, cx, H - 2, C.sub, 2.4);

        // Lớp điện môi vùng nghèo giữa hai bản tụ
        ctx.save(); ctx.globalAlpha = 0.20; ctx.fillStyle = C.c5; ctx.fillRect(cx - pW / 2, yTop + pH, pW, gapPx + osc); ctx.restore();
        for (let i = 0; i < 5; i++) {
          drawIon(ctx, cx - pW * 0.36 + i * (pW * 0.18), yTop + pH + (gapPx + osc) * 0.5, '+', C.c4, 4.4);
        }

        // Bản cực trên (Kim loại) & bản cực dưới (Mép vùng nghèo W)
        rr(ctx, cx - pW / 2, yTop, pW, pH, 4); ctx.fillStyle = r.mt.col; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke();
        rr(ctx, cx - pW / 2, yBot, pW, pH, 4); ctx.fillStyle = C.c2; ctx.fill();

        txt(ctx, 'Mặt kim loại (0)', cx - pW / 2 - 8, yTop + pH / 2, C.main, 9.8, 'right', 700);
        txt(ctx, 'Mép W=' + fmtLen(r.W), cx - pW / 2 - 8, yBot + pH / 2, C.c2, 9.8, 'right', 700);
        arr(ctx, cx + pW / 2 + 12, yTop + pH, cx + pW / 2 + 12, yBot, C.c5, 1.6);
        arr(ctx, cx + pW / 2 + 12, yBot, cx + pW / 2 + 12, yTop + pH, C.c5, 1.6);

        // Bảng đối chiếu 3 mốc điện áp (không khung)
        const rx = W - rightInfo + 10;
        txt(ctx, 'Kéo V_R làm hai bản tụ tách xa:', rx, H * 0.16, C.mut, 10, 'left', 700);
        txt(ctx, '• V_R = 0 V:  C\' = ' + (r0.Cprime * 1e9).toFixed(1) + ' nF/cm²', rx, H * 0.38, C.c2, 10.5, 'left', 700);
        txt(ctx, '• Hiện tại:   C\' = ' + (r.Cprime * 1e9).toFixed(1) + ' nF/cm²', rx, H * 0.58, C.main, 11, 'left', 800);
        txt(ctx, '• V_R = 5 V:  C\' = ' + (r5.Cprime * 1e9).toFixed(1) + ' nF/cm²', rx, H * 0.78, C.c5, 10.5, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   4. MỤC 3.2 — HẠ THẤP HÀNG RÀO DO LỰC ẢNH (HIỆU ỨNG SCHOTTKY)
   ========================================================================== */
LABS.push({
  id: 'image', tag: '3.2', name: 'Lực ảnh', sec: 3,
  S: { semi: 'Si', E: 1e5 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế vật lý: Electron (−e) trước gương kim loại bị điện tích ảnh (+e) hút mạnh',
      area: 'a', anim: true,
      ctrls: [
        { k: 'E', l: 'Điện trường E', min: 4, max: 6.3, step: 0.05, log: 1, f: v => sci(v, 1) + ' V/cm' },
        { k: 'semi', seg: [['Si', 'Si'], ['GaAs', 'GaAs'], ['Ge', 'Ge']] },
        { btn: 'Ví dụ 3.1', fn: p => { p.S.semi = 'Si'; p.S.E = 1e5; p.syncCtrls(); p.dirty = true; } },
        { btn: 'E = 10⁶ V/cm', fn: p => { p.S.semi = 'Si'; p.S.E = 1e6; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, im = imageCalc(S.semi, S.E);
        const xmNm = im.xm * 1e7;
        const padX = 20, topY = 30, botY = H - 22, midX = W * 0.38;

        // Khối gương kim loại bên trái & bán dẫn bên phải
        rr(ctx, padX, topY, midX - padX, botY - topY, 8); ctx.fillStyle = C.tint; ctx.fill(); ctx.strokeStyle = C.sub; ctx.stroke();
        rr(ctx, midX, topY, W * 0.72 - midX, botY - topY, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
        ln(ctx, midX, topY, midX, botY, C.main, 3);
        txt(ctx, 'KIM LOẠI (Gương dẫn)', (padX + midX) / 2, topY + 14, C.mut, 10, 'center', 700);
        txt(ctx, 'BÁN DẪN ' + im.sm.name + ' (ε_r=' + im.sm.epsR + ')', (midX + W * 0.72) / 2, topY + 14, C.ink, 10, 'center', 700);

        const cy = (topY + botY) * 0.56;
        const distPx = clamp(24 + xmNm * 18, 22, (W * 0.72 - midX) * 0.65);
        const osc = Math.sin(t * 3.5) * 4;
        const ex = midX + distPx + osc, ix = midX - distPx - osc;

        // Đường sức lực hút giữa +e (ảnh) và -e (thật)
        ln(ctx, ix, cy, ex, cy, C.err, 1.8, [4, 3]);
        arr(ctx, ex - 8, cy, ex - 34, cy, C.err, 2.2);
        txt(ctx, 'F_ảnh', ex - 22, cy - 14, C.err, 10, 'center', 700);
        arr(ctx, ex + 8, cy, ex + 36, cy, C.c2, 2.2);
        txt(ctx, 'F_trường', ex + 24, cy - 14, C.c2, 10, 'center', 700);

        dot(ctx, ix, cy, 11, C.c4); txt(ctx, '+e', ix, cy + 0.5, C.bg, 10.5, 'center', 800);
        txt(ctx, 'Ảnh ở −x', ix, cy + 20, C.c4, 9.5, 'center', 700);
        dot(ctx, ex, cy, 11, C.c2); txt(ctx, '−e', ex, cy + 0.5, C.bg, 10.5, 'center', 800);
        txt(ctx, 'Electron ở +x', ex, cy + 20, C.c2, 9.5, 'center', 700);

        arr(ctx, ix, cy + 36, ex, cy + 36, C.mut, 1.3);
        arr(ctx, ex, cy + 36, ix, cy + 36, C.mut, 1.3);
        txt(ctx, 'Khoảng cách 2x (đỉnh rào x_m = ' + xmNm.toFixed(2) + ' nm)', midX, cy + 49, C.ink, 10, 'center', 700);

        const gx = W - 66;
        drawMiniGauge(ctx, gx, H * 0.32, 22, 'Vị trí đỉnh x_m', xmNm.toFixed(2) + ' nm', clamp(1 - xmNm / 5, 0, 1), C.c1);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Độ hạ Δφ', (im.dPhi * 1e3).toFixed(1) + ' mV', clamp(im.dPhi / 0.15, 0, 1), C.err);

        chip(ctx, 'Δφ = √(eE / 4πε_s) = ' + im.dPhi.toFixed(3) + ' V = 2·E·x_m', W * 0.44, 15, C.err, 'center');
      }
    },
    {
      title: 'Bên trong (buồng vượt cửa rào): Điện trường E càng mạnh, cổng rào tụt thấp Δφ và dịch sát kim loại (x_m) ⇒ dòng rò tăng!',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, im = imageCalc(S.semi, S.E);
        const xmNm = im.xm * 1e7;
        const padX = 16, topY = 12, botY = H - 12, bw = W - padX * 2, bh = botY - topY;
        const xMt = padX + bw * 0.24, xGate = xMt + clamp(xmNm * 22, 14, bw * 0.28);
        const dropPx = clamp((im.dPhi / 0.14) * (bh * 0.42), 4, bh * 0.44);
        const yIdeal = topY + 14, yNow = yIdeal + dropPx;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
        ctx.save(); ctx.globalAlpha = 0.24; ctx.fillStyle = C.main; ctx.fillRect(padX, topY, xMt - padX, bh); ctx.restore();
        ln(ctx, xMt, topY, xMt, botY, C.ink, 2);

        // Vạch mốc chiều cao cổng lý tưởng phi_B0 và cánh cửa trượt bị hạ thấp xuống yNow
        ln(ctx, xMt, yIdeal, xGate + 36, yIdeal, C.mut, 1.3, [4, 3]);
        rr(ctx, xGate - 7, yNow, 14, botY - yNow, 4); ctx.fillStyle = C.c5; ctx.fill();
        arr(ctx, xGate, yIdeal, xGate, yNow - 2, C.err, 2);
        txt(ctx, 'Hạ Δφ=' + (im.dPhi * 1e3).toFixed(0) + 'mV', xGate + 14, (yIdeal + yNow) / 2, C.err, 10, 'left', 800);

        // Hạt electron từ kim loại nhảy qua cánh cửa trượt đã hạ thấp (số hạt tăng mạnh theo Δφ!)
        const nLeak = Math.max(2, Math.round(2 + (im.dPhi / 0.12) * 10));
        for (let k = 0; k < nLeak; k++) {
          const u = (t * (0.55 + im.dPhi * 8) + k / nLeak) % 1;
          const ex = padX + 14 + u * (bw - 28);
          const ey = yNow - 6 - Math.sin(u * Math.PI) * 10 + (k % 3) * 3;
          dot(ctx, ex, ey, 3.8, C.c2);
        }

        txt(ctx, 'Kim loại', padX + (xMt - padX) / 2, botY - 12, C.main, 10, 'center', 700);
        txt(ctx, 'Đỉnh cửa ở x_m = ' + xmNm.toFixed(2) + ' nm', xGate, botY - 12, C.bg, 0);
        txt(ctx, 'Vị trí cửa x_m = ' + xmNm.toFixed(2) + ' nm', xGate + 14, botY - 14, C.c1, 10, 'left', 700);
        txt(ctx, 'Rào hạ ⇒ dòng ngược tăng ' + Math.exp(im.dPhi / VT_300).toFixed(1) + '×!', padX + bw - 10, topY + 16, C.err, 10.5, 'right', 800);
      }
    }
  ]
});

/* ==========================================================================
   5. MỤC 3.4 — GHIM MỨC FERMI: TRẠNG THÁI BỀ MẶT D_it & ĐỘ NHẠY THEO φ_m
   ========================================================================== */
LABS.push({
  id: 'pinning', tag: '3.4', name: 'Ghim Fermi', sec: 3,
  S: { semi: 'GaAs', metal: 'Au', pin: 0.75 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Lớp trạng thái bề mặt D_it tích điện chắn điện trường — "ghim" hàng rào φ_Bn',
      area: 'a',
      ctrls: [
        { k: 'pin', l: 'Mức ghim (D_it)', min: 0, max: 1, step: 0.05, f: v => Math.round(v * 100) + '%' },
        { k: 'metal', seg: [['Al', 'Al'], ['W', 'W'], ['Au', 'Au'], ['Pt', 'Pt']] },
        { k: 'semi', seg: [['Si', 'Si'], ['GaAs', 'GaAs']] },
        { btn: 'Lý tưởng (0%)', fn: p => { p.S.pin = 0; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Ghim mạnh (95%)', fn: p => { p.S.pin = 0.95; p.S.semi = 'GaAs'; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H) {
        const S = p.S, sm = SEMIS[S.semi], mt = METALS[S.metal];
        const phiIdeal = mt.phiM - sm.chi;
        const phiPinned = sm.Eg - sm.phi0;
        const phiBn = (1 - S.pin) * phiIdeal + S.pin * phiPinned;

        const bw = Math.min(310, W * 0.50), bd = Math.min(136, H * 0.38), subH = 92, oxH = 14, mtH = 22;
        const ox = W * 0.24, oy = H * 0.78;
        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, subH, C.card, 1, C.sub);
        isoBox(ctx, ox, oy, 0, 0, subH, bw, bd, oxH, C.err, 0.14 + S.pin * 0.45, C.err);
        isoBox(ctx, ox, oy, 0, 0, subH + oxH, bw, bd, mtH, mt.col, 0.92, C.ink);

        const nTrap = Math.round(S.pin * 10);
        for (let i = 0; i < nTrap; i++) {
          const pt = isoP(ox, oy, 18 + ((i + 0.5) / Math.max(1, nTrap)) * (bw - 36), bd, subH + 4);
          dot(ctx, pt[0], pt[1], 4.5, C.err);
        }
        const lbIf = isoP(ox, oy, 0, bd, subH + oxH / 2);
        txt(ctx, 'Trạng thái D_it (' + Math.round(S.pin * 100) + '%)', lbIf[0] - 8, lbIf[1], C.err, 10, 'right', 700);

        const gx = W - 68;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'φ_Bn thực tế', phiBn.toFixed(2) + ' V', clamp(phiBn / 1.6, 0, 1), C.main);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Độ nhạy dφ/dφ_m', (1 - S.pin).toFixed(2), 1 - S.pin, S.pin > 0.7 ? C.err : C.c2);

        chip(ctx, S.pin > 0.7 ? 'GHIM MỨC FERMI: đổi kim loại hầu như không đổi φ_Bn ≈ ' + phiPinned.toFixed(2) + ' V!'
          : S.pin < 0.1 ? 'LÝ TƯỞNG (D_it → 0): φ_Bn = φ_m − χ nhạy hoàn toàn theo kim loại'
          : 'Trung gian: cả kim loại lẫn trạng thái bề mặt cùng quyết định φ_Bn', W * 0.44, 15, S.pin > 0.7 ? C.err : C.main, 'center');
      }
    },
    {
      title: 'Bên trong (mặt cắt dọc): Lớp bẫy bề mặt D_it như "tấm khiên" chắn đường sức điện trường từ kim loại',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, sm = SEMIS[S.semi], mt = METALS[S.metal];
        const phiIdeal = mt.phiM - sm.chi, phiPin = sm.Eg - sm.phi0;
        const phiBn = (1 - S.pin) * phiIdeal + S.pin * phiPin;

        const padX = 16, rightLbl = 166, topY = 10, botY = H - 10;
        const bw = W - padX - rightLbl, bh = botY - topY;
        const mtH = bh * 0.22, trH = 20, yTr = topY + mtH, ySi = yTr + trH;
        const depPx = clamp((phiBn / 1.6) * (botY - ySi) * 0.78, 16, (botY - ySi) * 0.85);

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.28; ctx.fillStyle = mt.col; ctx.fillRect(padX, topY, bw, mtH);
        ctx.globalAlpha = 0.14 + S.pin * 0.42; ctx.fillStyle = C.err; ctx.fillRect(padX, yTr, bw, trH);
        ctx.globalAlpha = 0.18; ctx.fillStyle = C.c5; ctx.fillRect(padX, ySi, bw, depPx);
        ctx.restore();

        ln(ctx, padX, yTr, padX + bw, yTr, C.ink, 1.5);
        ln(ctx, padX, ySi, padX + bw, ySi, C.ink, 1.5);

        // Các ổ bẫy D_it hấp thụ đường sức từ kim loại
        const nRays = 8, nShielded = Math.round(nRays * S.pin);
        for (let i = 0; i < nRays; i++) {
          const x = padX + (i + 0.5) * (bw / nRays);
          if (i < nShielded) {
            // Bị tấm khiên D_it chặn ngay tại mặt phân cách!
            arr(ctx, x, topY + 6, x, yTr + trH * 0.5 - 4, C.err, 1.8);
            dot(ctx, x, yTr + trH * 0.5, 5 + Math.sin(t * 5 + i) * 0.8, C.err);
          } else {
            // Xuyên thẳng xuống điều khiển bán dẫn
            arr(ctx, x, topY + 6, x, ySi + depPx - 4, C.c2, 1.8);
          }
        }

        const lx = padX + bw + 8;
        txt(ctx, '▲ ' + mt.name + ' (φ_m=' + mt.phiM + 'V)', lx, topY + mtH * 0.5, C.main, 10, 'left', 700);
        txt(ctx, '▸ Khiên D_it: chắn ' + Math.round(S.pin * 100) + '%', lx, yTr + trH * 0.5, C.err, 10, 'left', 800);
        txt(ctx, 'φ_Bn = ' + phiBn.toFixed(2) + ' V', lx, ySi + depPx * 0.5, C.ink, 11, 'left', 800);
        txt(ctx, S.pin > 0.7 ? 'Đổi kim loại gần như vô ích!' : 'Nhạy theo công thoát φ_m', lx, botY - 10, S.pin > 0.7 ? C.err : C.c2, 9.6, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   6. MỤC 4.3 — ĐẶC TUYẾN I-V ĐIỐT SCHOTTKY: PHÁT XẠ NHIỆT ĐIỆN TỬ
   ========================================================================== */
LABS.push({
  id: 'iv', tag: '4.3', name: 'Dòng Schottky', sec: 4,
  S: { phiBn: 0.80, T: 300, Va: 0.44, imgOn: 1 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Bàn đo I-V điốt Schottky có đế gia nhiệt T — dòng bão hòa J_sT cực nhạy theo φ_Bn',
      area: 'a', anim: true,
      ctrls: [
        { k: 'phiBn', l: 'φ_Bn', min: 0.55, max: 1.05, step: 0.02, f: v => v.toFixed(2) + ' V' },
        { k: 'T', l: 'T', min: 250, max: 400, step: 10, f: v => v + ' K' },
        { k: 'Va', l: 'V_a', min: -3.0, max: 0.60, step: 0.02, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' },
        { k: 'imgOn', seg: [[1, 'Bật Δφ'], [0, 'Tắt Δφ']] },
        { btn: 'Ví dụ 4.1', fn: p => { p.S.phiBn = 0.80; p.S.T = 300; p.S.Va = 0.44; p.S.imgOn = 0; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, Astar = 120, Vt = (KB * S.T) / E_CHG;
        const dPhi = S.imgOn && S.Va < 0 ? 0.028 * Math.sqrt(Math.max(0, -S.Va)) : 0;
        const JsT0 = Astar * S.T * S.T * Math.exp(-S.phiBn / Vt);
        const JsT = Astar * S.T * S.T * Math.exp(-(S.phiBn - dPhi) / Vt);
        const J = JsT * (Math.exp(clamp(S.Va / Vt, -40, 32)) - 1);
        const Von10 = Vt * Math.log(10 / Math.max(1e-25, JsT0));

        // Điốt Schottky trên bàn nhiệt
        const dx = W * 0.34, dy = H * 0.52;
        const heat = clamp((S.T - 250) / 150, 0, 1);
        rr(ctx, dx - 96, dy + 28, 192, 26, 6);
        ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = heat > 0.5 ? C.err : C.c5; ctx.lineWidth = 1.5; ctx.stroke();
        txt(ctx, 'Đế nhiệt: ' + S.T + ' K (' + (S.T - 273) + ' °C)', dx, dy + 41, heat > 0.5 ? C.err : C.c5, 10.5, 'center', 700);

        drawDiodePkg(ctx, dx, dy, 1.5, true, J > 0.1 ? C.c2 : J < -1e-9 ? C.err : C.main, 'Điốt Schottky (A* = 120)');
        if (Math.abs(J) > 1e-8) {
          const dir = J > 0 ? 1 : -1;
          const sp = clamp(Math.log10(Math.abs(J) + 1e-9) + 9, 1, 10) * 0.25;
          for (let k = 0; k < 6; k++) {
            const u = ((t * sp + k / 6) % 1);
            const px = dir > 0 ? dx - 85 + u * 170 : dx + 85 - u * 170;
            dot(ctx, px, dy, 4, dir > 0 ? C.c2 : C.err);
          }
        }

        const gx = W - 76;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'J_sT (bão hòa)', sci(JsT0, 1), clamp((Math.log10(Math.max(1e-14, JsT0)) + 14) / 12, 0, 1), C.main);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'V_a @ 10 A/cm²', Von10.toFixed(2) + ' V', clamp(Von10 / 0.85, 0, 1), C.c2);

        chip(ctx, 'Tại V_a = ' + (S.Va >= 0 ? '+' : '') + S.Va.toFixed(2) + ' V ⇒ J = ' + fmtCurDen(J), W * 0.44, 15, J > 0.1 ? C.c2 : C.main, 'center');
      }
    },
    {
      title: 'Bên trong (buồng phát xạ nhiệt điện tử): Bể electron nóng trong bán dẫn nhảy vọt qua bờ đập (φ_Bn − V_a)',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, Astar = 120, Vt = (KB * S.T) / E_CHG;
        const dPhi = S.imgOn && S.Va < 0 ? 0.028 * Math.sqrt(-S.Va) : 0;
        const JsT = Astar * S.T * S.T * Math.exp(-(S.phiBn - dPhi) / Vt);
        const J = JsT * (Math.exp(clamp(S.Va / Vt, -40, 32)) - 1);

        const padX = 16, topY = 12, botY = H - 12, bw = W - padX * 2, bh = botY - topY;
        const wallX = padX + bw * 0.46;
        const wallH = bh * clamp((S.phiBn - Math.max(0, S.Va)) / 1.1, 0.16, 0.84);
        const yCrest = botY - wallH;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
        // Bờ đập hàng rào ở giữa
        rr(ctx, wallX - 8, yCrest, 16, wallH, 4); ctx.fillStyle = C.c5; ctx.fill();
        txt(ctx, 'Đập rào', wallX, yCrest - 8, C.c5, 9.5, 'center', 800);

        // Hạt electron nóng nhảy loạn xạ ở bể bán dẫn (trái), hạt đủ năng lượng nhiệt nhảy vọt qua đập sang kim loại (phải)
        const vHeat = 0.6 + ((S.T - 250) / 150) * 1.4;
        const overFrac = clamp((Math.log10(Math.abs(J) + 1e-10) + 9) / 10.5, 0.05, 1);
        const nJump = J > 1e-6 ? Math.round(overFrac * 12) : 1;
        for (let k = 0; k < 16; k++) {
          if (k < nJump) {
            const u = (t * (0.7 * vHeat + overFrac) + k / nJump) % 1;
            const ex = padX + 20 + u * (bw - 40);
            const ey = yCrest - 8 - Math.sin(u * Math.PI) * 14 + (u > 0.55 ? (u - 0.55) * 40 : 0);
            dot(ctx, ex, clamp(ey, topY + 6, botY - 8), 4.2, C.c2);
          } else {
            const ex = padX + 14 + ((k * 31 + Math.sin(t * 4 * vHeat + k) * 26) % (wallX - padX - 30) + (wallX - padX - 30)) % (wallX - padX - 30);
            const ey = botY - 10 - Math.abs(Math.sin(t * (3.5 * vHeat) + k * 1.3)) * (wallH * 0.72);
            dot(ctx, ex, ey, 3.8, C.c1);
          }
        }

        txt(ctx, 'Bể e⁻ nóng (T=' + S.T + 'K)', padX + 12, topY + 14, C.c1, 10, 'left', 700);
        txt(ctx, 'Kim loại nhận dòng: ' + fmtCurDen(J), padX + bw - 12, topY + 14, J > 0.1 ? C.c2 : C.main, 10.5, 'right', 800);
        txt(ctx, 'Nhiệt độ T tăng hoặc φ_Bn giảm ⇒ số hạt nhảy qua đập tăng theo hàm mũ!', W / 2, botY - 8, C.mut, 9.5, 'center', 600);
      }
    }
  ]
});

/* ==========================================================================
   7. MỤC 5.4 — SO SÁNH ĐIỐT SCHOTTKY VÀ ĐIỐT P-N: ĐIỆN ÁP MỞ THUẬN
   ========================================================================== */
LABS.push({
  id: 'compare', tag: '5.4', name: 'So sánh p-n', sec: 5,
  S: { phiBn: 0.672, Jtarget: 10, logJspn: -10.43 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Bàn thử song song 2 điốt cùng tải dòng J — đo sụt áp thuận & công suất tỏa nhiệt',
      area: 'a', anim: true,
      ctrls: [
        { k: 'Jtarget', l: 'Dòng J', min: -1, max: 2, step: 0.1, log: 1, f: v => v.toFixed(1) + ' A/cm²' },
        { k: 'phiBn', l: 'φ_Bn (Sch)', min: 0.55, max: 0.90, step: 0.01, f: v => v.toFixed(2) + ' V' },
        { k: 'logJspn', l: 'log J_s(pn)', min: -12, max: -9, step: 0.1, f: v => '10' + sup(Math.round(v)) },
        { btn: 'Ví dụ 5.1', fn: p => { p.S.Jtarget = 10; p.S.phiBn = 0.672; p.S.logJspn = -10.43; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const JsSch = 120 * 300 * 300 * Math.exp(-S.phiBn / VT_300);
        const JsPn = Math.pow(10, S.logJspn);
        const VaSch = Math.max(0.02, VT_300 * Math.log(S.Jtarget / JsSch));
        const VaPn = Math.max(0.05, VT_300 * Math.log(S.Jtarget / JsPn));
        const dV = VaPn - VaSch;

        const padX = 18, midY = H * 0.54;
        const c1x = W * 0.28, c2x = W * 0.72;

        // Khung Schottky (trái)
        rr(ctx, padX, 34, W * 0.45, H - 52, 9); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.c2; ctx.lineWidth = 1.5; ctx.stroke();
        drawDiodePkg(ctx, c1x, midY - 16, 1.35, true, C.c2, 'ĐIỐT SCHOTTKY (Hạt đa số)');
        txt(ctx, 'V_a = ' + VaSch.toFixed(3) + ' V', c1x, midY + 26, C.c2, 16, 'center', 800);
        txt(ctx, 'J_sT = ' + sci(JsSch, 1) + ' A/cm²', c1x, midY + 46, C.mut, 10, 'center', 700);
        txt(ctx, 'Tổn hao: ' + (VaSch * S.Jtarget).toFixed(2) + ' W/cm² (Mát hơn!)', c1x, midY + 64, C.c2, 10, 'center', 700);

        // Khung p-n (phải)
        rr(ctx, W - padX - W * 0.45, 34, W * 0.45, H - 52, 9); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.c5; ctx.lineWidth = 1.5; ctx.stroke();
        drawDiodePkg(ctx, c2x, midY - 16, 1.35, false, C.c5, 'ĐIỐT P-N (Hạt thiểu số)');
        txt(ctx, 'V_a = ' + VaPn.toFixed(3) + ' V', c2x, midY + 26, C.c5, 16, 'center', 800);
        txt(ctx, 'J_s = ' + sci(JsPn, 1) + ' A/cm²', c2x, midY + 46, C.mut, 10, 'center', 700);
        txt(ctx, 'Tổn hao: ' + (VaPn * S.Jtarget).toFixed(2) + ' W/cm²', c2x, midY + 64, C.err, 10, 'center', 700);

        // Hạt chảy qua 2 điốt ở cùng mật độ dòng J
        const sp = 0.6 + clamp(Math.log10(S.Jtarget + 1), 0, 2) * 0.7;
        for (let k = 0; k < 4; k++) {
          const u = (t * sp + k * 0.25) % 1;
          dot(ctx, c1x - 65 + u * 130, midY - 16, 3.6, C.c2);
          dot(ctx, c2x - 65 + u * 130, midY - 16, 3.6, C.c5);
        }
        chip(ctx, 'Cùng J = ' + S.Jtarget.toFixed(1) + ' A/cm²: Schottky mở thấp hơn p-n đúng ΔV = ' + dV.toFixed(2) + ' V!', W / 2, 15, C.main, 'center');
      }
    },
    {
      title: 'Bên trong (hai buồng bơm dòng ở cùng lưu lượng J): Schottky chỉ cần áp thấp, p-n phải bơm cả 2 loại hạt!',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const JsSch = 120 * 300 * 300 * Math.exp(-S.phiBn / VT_300);
        const JsPn = Math.pow(10, S.logJspn);
        const VaSch = Math.max(0.02, VT_300 * Math.log(S.Jtarget / JsSch));
        const VaPn = Math.max(0.05, VT_300 * Math.log(S.Jtarget / JsPn));

        const padX = 16, topY = 12, botY = H - 10, bw = W - padX * 2, rowH = (botY - topY - 10) / 2;
        const rows = [
          { lbl: 'Schottky', va: VaSch, js: JsSch, col: C.c2, sub: 'Hạt đa số e⁻ vượt rào' },
          { lbl: 'Điốt p-n', va: VaPn, js: JsPn, col: C.c5, sub: 'Khuếch tán e⁻ + h⁺' }
        ];
        rows.forEach((rw, idx) => {
          const y = topY + idx * (rowH + 10);
          rr(ctx, padX, y, bw, rowH, 7); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = rw.col; ctx.lineWidth = 1.4; ctx.stroke();
          // Thanh mức điện áp mở cần cấp (bên trái)
          const barX = padX + 82, barMax = bw * 0.30, barW = clamp((rw.va / 0.90) * barMax, 12, barMax);
          txt(ctx, rw.lbl, padX + 10, y + rowH * 0.38, rw.col, 11, 'left', 800);
          txt(ctx, rw.va.toFixed(3) + ' V', padX + 10, y + rowH * 0.72, C.ink, 10.5, 'left', 700);
          rr(ctx, barX, y + rowH * 0.25, barMax, rowH * 0.50, 4); ctx.fillStyle = C.tint; ctx.fill();
          rr(ctx, barX, y + rowH * 0.25, barW, rowH * 0.50, 4); ctx.fillStyle = rw.col; ctx.fill();

          // Ống dòng hạt chạy ở bên phải
          const pipeX = barX + barMax + 18, pipeW = padX + bw - pipeX - 12;
          rr(ctx, pipeX, y + 8, pipeW, rowH - 16, 5); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
          const sp = 0.7 + clamp(Math.log10(S.Jtarget + 1), 0, 2) * 0.7;
          for (let k = 0; k < 6; k++) {
            const u = (t * sp + k / 6) % 1;
            dot(ctx, pipeX + 8 + u * (pipeW - 16), y + rowH * (idx === 1 ? 0.36 : 0.5), 3.8, rw.col);
            if (idx === 1) dot(ctx, pipeX + pipeW - 8 - u * (pipeW - 16), y + rowH * 0.68, 3.6, C.c4);
          }
          txt(ctx, rw.sub, pipeX + pipeW / 2, y + rowH - 8, C.mut, 9, 'center', 600);
        });
      }
    }
  ]
});

/* ==========================================================================
   8. MỤC 5.5 — CHUYỂN MẠCH: ĐIỆN TÍCH THIỂU SỐ TÍCH TRỮ & THỜI GIAN PHỤC HỒI NGƯỢC
   ========================================================================== */
LABS.push({
  id: 'switch', tag: '5.5', name: 'Chuyển mạch', sec: 5,
  S: { mode: 'auto', tauNs: 20 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Đóng cắt xung thuận → ngược — p-n bị kẹt đám mây hạt thiểu số, Schottky ngắt tức thì!',
      area: 'a', anim: true,
      ctrls: [
        { k: 'mode', seg: [['auto', 'Xung tự động'], ['on', 'Giữ Thuận'], ['off', 'Cắt Ngược']] },
        { k: 'tauNs', l: 'τ_p (p-n)', min: 5, max: 50, step: 5, f: v => v + ' ns' }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const cyc = (t * 0.45) % 1;
        const isOn = S.mode === 'on' ? true : S.mode === 'off' ? false : cyc < 0.45;
        if (st.qStore == null) st.qStore = 0.8;
        const decayRate = 18 / S.tauNs;
        st.qStore = isOn ? Math.min(1, st.qStore + dt * 3.5) : Math.max(0, st.qStore - dt * decayRate);

        const padX = 16, boxW = (W - padX * 3) / 2, boxH = H - 48, topY = 32;

        // Trái: Điốt Schottky (hạt đa số, không tích trữ)
        rr(ctx, padX, topY, boxW, boxH, 9); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.c2; ctx.lineWidth = 1.5; ctx.stroke();
        txt(ctx, 'SCHOTTKY (Chuyển mạch cỡ ps)', padX + boxW / 2, topY + 14, C.c2, 10.5, 'center', 800);
        const sy = topY + boxH * 0.54;
        rr(ctx, padX + 14, sy - 26, boxW * 0.34, 52, 5); ctx.fillStyle = METALS.Au.col; ctx.fill();
        txt(ctx, 'Kim loại', padX + 14 + boxW * 0.17, sy, C.bg, 10, 'center', 800);
        rr(ctx, padX + 14 + boxW * 0.34, sy - 26, boxW * 0.58, 52, 5); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
        if (isOn) {
          for (let k = 0; k < 7; k++) {
            const u = (t * 1.8 + k / 7) % 1;
            dot(ctx, padX + 14 + boxW * 0.90 - u * (boxW * 0.56), sy + ((k % 3) - 1) * 12, 4, C.c2);
          }
        }
        txt(ctx, isOn ? 'Đang dẫn (chỉ hạt đa số e⁻)' : 'NGẮT TỨC THÌ! (Q_thiểu số = 0)', padX + boxW / 2, topY + boxH - 16, isOn ? C.c2 : C.main, 10.5, 'center', 700);

        // Phải: Điốt p-n (tích trữ hạt thiểu số!)
        const rx = padX * 2 + boxW;
        rr(ctx, rx, topY, boxW, boxH, 9); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = st.qStore > 0.05 && !isOn ? C.err : C.c5; ctx.lineWidth = 1.5; ctx.stroke();
        txt(ctx, 'ĐIỐT P-N (Chuyển mạch cỡ ns)', rx + boxW / 2, topY + 14, C.c5, 10.5, 'center', 800);
        rr(ctx, rx + 14, sy - 26, boxW * 0.34, 52, 5); ctx.fillStyle = C.tint; ctx.fill(); ctx.strokeStyle = C.c4; ctx.stroke();
        txt(ctx, 'p⁺', rx + 14 + boxW * 0.17, sy, C.c4, 12, 'center', 800);
        rr(ctx, rx + 14 + boxW * 0.34, sy - 26, boxW * 0.58, 52, 5); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();

        // Đám mây lỗ trống thiểu số bị bơm vào miền n
        const nHoles = Math.round(st.qStore * 14);
        for (let k = 0; k < nHoles; k++) {
          const hx = rx + 20 + boxW * 0.34 + ((k * 17 + (isOn ? t * 40 : -t * 60)) % (boxW * 0.50) + boxW * 0.50) % (boxW * 0.50);
          const hy = sy + ((k % 3) - 1) * 13;
          dot(ctx, hx, hy, 4.3, C.err); txt(ctx, '+', hx, hy + 0.5, C.bg, 8, 'center', 800);
        }
        txt(ctx, isOn ? 'Bơm & TÍCH TRỮ lỗ trống thiểu số!'
          : st.qStore > 0.05 ? 'ĐANG XẢ NGƯỢC (t_rr ≈ ' + Math.round(S.tauNs * 1.4) + ' ns)!' : 'Đã xả xong — tắt hẳn',
          rx + boxW / 2, topY + boxH - 16, st.qStore > 0.05 && !isOn ? C.err : C.c5, 10.5, 'center', 700);

        chip(ctx, isOn ? 'XUNG THUẬN (ON): cả hai điốt đang dẫn dòng' : 'CHUYỂN SANG NGƯỢC (OFF): Schottky tắt ngay, p-n phải chờ xả hạt thiểu số!', W / 2, 14, isOn ? C.c2 : C.err, 'center');
      }
    },
    {
      title: 'Thực tế trên mạch tải xung: Đèn & Van ngắt mạch khi chuyển sang OFF — p-n bị phụt dòng xả ngược trong t_rr!',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const cyc = (t * 0.45) % 1;
        const isOn = S.mode === 'on' ? true : S.mode === 'off' ? false : cyc < 0.45;
        const revPhase = !isOn && (S.mode === 'auto' ? (cyc - 0.45) < (S.tauNs / 130) : false);

        const padX = 16, halfW = (W - padX * 3) / 2, topY = 12, bh = H - 24;
        const drawLane = (x, title, col, activeOn, reverseLeak, timeStr) => {
          rr(ctx, x, topY, halfW, bh, 8); ctx.fillStyle = C.card; ctx.fill();
          ctx.strokeStyle = reverseLeak ? C.err : activeOn ? col : C.g; ctx.lineWidth = 1.5; ctx.stroke();
          txt(ctx, title, x + halfW / 2, topY + 14, col, 10.5, 'center', 800);

          const my = topY + bh * 0.54;
          ln(ctx, x + 18, my, x + halfW - 18, my, reverseLeak ? C.err : activeOn ? col : C.sub, 3);
          // Bóng đèn tải bên phải
          const lx = x + halfW - 40;
          if (activeOn || reverseLeak) {
            ctx.save(); ctx.globalAlpha = 0.35; dot(ctx, lx, my, 22, reverseLeak ? C.err : col); ctx.restore();
          }
          dot(ctx, lx, my, 13, reverseLeak ? C.err : activeOn ? col : C.tint);
          ctx.beginPath(); ctx.arc(lx, my, 13, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.3; ctx.stroke();

          // Hạt dòng thuận hoặc dòng phụt ngược màu đỏ
          if (activeOn || reverseLeak) {
            for (let k = 0; k < 5; k++) {
              const u = (t * 1.8 + k * 0.2) % 1;
              const px = reverseLeak ? (lx - 18 - u * (halfW - 80)) : (x + 22 + u * (halfW - 80));
              dot(ctx, px, my, 4, reverseLeak ? C.err : col);
            }
          }
          txt(ctx, reverseLeak ? 'PHỤT DÒNG XẢ NGƯỢC! (' + timeStr + ')' : activeOn ? 'Đèn SÁNG (dẫn thuận)' : 'Đèn TẮT SẠCH (' + timeStr + ')',
            x + halfW / 2, topY + bh - 14, reverseLeak ? C.err : activeOn ? col : C.mut, 10, 'center', 700);
        };

        drawLane(padX, 'MẠCH SCHOTTKY', C.c2, isOn, false, '~10 ps');
        drawLane(padX * 2 + halfW, 'MẠCH ĐIỐT P-N', C.c5, isOn, revPhase, 't_rr ≈ ' + Math.round(S.tauNs * 1.4) + ' ns');
      }
    }
  ]
});

/* ==========================================================================
   9. MỤC 6.3 — TIẾP XÚC OHMIC LÝ TƯỞNG: LỚP TÍCH LŨY & SO SÁNH VỚI SCHOTTKY
   ========================================================================== */
LABS.push({
  id: 'ohmic', tag: '6.3', name: 'Ohmic lý tưởng', sec: 6,
  S: { type: 'n', phiM: 4.05, Va: 0.30 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Kiểm tra tiếp xúc hai chiều — lớp tích lũy dẫn dòng tuyến tính cả thuận lẫn ngược!',
      area: 'a', anim: true,
      ctrls: [
        { k: 'type', seg: [['n', 'Bán dẫn loại n'], ['p', 'Bán dẫn loại p']], set: { n: { phiM: 4.05 }, p: { phiM: 5.15 } } },
        { k: 'phiM', l: 'φ_m', min: 3.80, max: 5.40, step: 0.05, f: v => v.toFixed(2) + ' V' },
        { k: 'Va', l: 'V_a', min: -0.5, max: 0.5, step: 0.05, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, isN = S.type === 'n';
        const phiS = isN ? 4.22 : 4.92; // Si n hoặc p điển hình
        const isOhmic = isN ? S.phiM < phiS : S.phiM > phiS;
        const majCol = isN ? C.c2 : C.c4;

        const bw = Math.min(300, W * 0.48), bd = Math.min(134, H * 0.38), subH = 96, mtH = 22;
        const ox = W * 0.24, oy = H * 0.78;

        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, subH, C.card, 1, C.sub);
        if (isOhmic) {
          isoBox(ctx, ox, oy, 0, 0, subH - 16, bw, bd, 16, majCol, 0.62, majCol);
        } else {
          isoBox(ctx, ox, oy, 0, 0, subH - 44, bw, bd, 44, C.c5, 0.35, C.c5);
        }
        isoBox(ctx, ox, oy, 0, 0, subH, bw, bd, mtH, C.main, 0.88, C.ink);

        // Dòng hạt hai chiều nếu là ohmic, một chiều nếu là Schottky
        const conduct = isOhmic || (isN ? S.Va > 0.15 : S.Va < -0.15);
        const dir = S.Va >= 0 ? 1 : -1;
        if (conduct && Math.abs(S.Va) > 0.02) {
          for (let k = 0; k < 8; k++) {
            const u = (t * (0.8 + Math.abs(S.Va) * 2.5) + k / 8) % 1;
            const z = dir > 0 ? u * (subH + mtH) : (1 - u) * (subH + mtH);
            const pt = isoP(ox, oy, 30 + (k % 4) * ((bw - 60) / 3), bd * 0.5, z);
            dot(ctx, pt[0], pt[1], 4.2, majCol);
          }
        }

        const gx = W - 70;
        const Irel = isOhmic ? Math.abs(S.Va) * 2 : (conduct ? Math.abs(S.Va) * 1.4 : 0.02);
        drawMiniGauge(ctx, gx, H * 0.32, 22, 'Dòng đo |I|', conduct ? (Irel * 10).toFixed(1) + ' mA' : 'Bị chặn!', clamp(Irel, 0, 1), isOhmic ? C.c2 : C.err);
        txt(ctx, isOhmic ? 'Lớp tích lũy' : 'Vùng nghèo', gx, H * 0.72, isOhmic ? majCol : C.c5, 11, 'center', 800);
        txt(ctx, isOhmic ? 'Dẫn 2 chiều (Ohmic)' : 'Chỉnh lưu (Schottky)', gx, H * 0.84, isOhmic ? C.c2 : C.err, 9.8, 'center', 700);

        chip(ctx, (isN ? 'Loại n: ' : 'Loại p: ') + 'φ_m=' + S.phiM.toFixed(2) + 'V vs φ_s=' + phiS.toFixed(2) + 'V → ' + (isOhmic ? 'TIẾP XÚC OHMIC!' : 'HÀNG RÀO SCHOTTKY'),
          W * 0.44, 15, isOhmic ? C.c2 : C.err, 'center');
      }
    },
    {
      title: 'Bên trong (mạch thử đèn đảo cực 2 chiều): Kéo V_a từ âm sang dương xem tiếp xúc dẫn 2 chiều hay khóa 1 chiều!',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, isN = S.type === 'n', phiS = isN ? 4.22 : 4.92;
        const isOhmic = isN ? S.phiM < phiS : S.phiM > phiS;
        const conduct = isOhmic || (isN ? S.Va > 0.15 : S.Va < -0.15);
        const majCol = isN ? C.c2 : C.c4;

        const padX = 16, topY = 12, botY = H - 12, bw = W - padX * 2, bh = botY - topY, my = (topY + botY) * 0.54;
        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = isOhmic ? C.c2 : C.err; ctx.stroke();

        // Dây mạch ngang đi qua tiếp xúc ở giữa và bóng đèn bên phải
        const xLeft = padX + 52, xMid = padX + bw * 0.48, xLamp = padX + bw - 56;
        ln(ctx, xLeft, my, xLamp, my, conduct && Math.abs(S.Va) > 0.02 ? majCol : C.sub, 3);

        // Khối tiếp xúc kim loại / bán dẫn ở giữa
        rr(ctx, xMid - 46, my - 20, 38, 40, 5); ctx.fillStyle = C.main; ctx.fill();
        txt(ctx, 'M', xMid - 27, my, C.bg, 12, 'center', 800);
        rr(ctx, xMid - 8, my - 20, 54, 40, 5); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = majCol; ctx.lineWidth = 1.6; ctx.stroke();
        if (isOhmic) {
          ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = majCol; ctx.fillRect(xMid - 7, my - 19, 14, 38); ctx.restore();
          txt(ctx, 'Tích lũy', xMid + 19, my, majCol, 9.5, 'center', 700);
        } else {
          ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = C.c5; ctx.fillRect(xMid - 7, my - 19, 26, 38); ctx.restore();
          txt(ctx, 'Nghèo', xMid + 19, my, C.c5, 9.5, 'center', 700);
        }

        // Nguồn đảo cực bên trái
        rr(ctx, padX + 12, my - 18, 44, 36, 6); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.main; ctx.stroke();
        txt(ctx, (S.Va >= 0 ? '+' : '−') + Math.abs(S.Va).toFixed(2) + 'V', padX + 34, my, C.main, 9.5, 'center', 800);

        // Bóng đèn tải bên phải
        const bright = conduct ? clamp(Math.abs(S.Va) * 2, 0, 1) : 0;
        if (bright > 0.05) { ctx.save(); ctx.globalAlpha = bright * 0.45; dot(ctx, xLamp, my, 24, majCol); ctx.restore(); }
        dot(ctx, xLamp, my, 14, bright > 0.05 ? majCol : C.tint);
        ctx.beginPath(); ctx.arc(xLamp, my, 14, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.stroke();

        // Hạt tải chạy qua mạch theo đúng chiều V_a
        if (bright > 0.05) {
          const dir = S.Va >= 0 ? 1 : -1;
          for (let k = 0; k < 6; k++) {
            const u = (t * (0.8 + bright * 1.4) + k / 6) % 1;
            const px = dir > 0 ? (xLeft + 10 + u * (xLamp - xLeft - 24)) : (xLamp - 14 - u * (xLamp - xLeft - 24));
            dot(ctx, px, my, 4, majCol);
          }
        }
        txt(ctx, isOhmic ? 'OHMIC: Đảo cực ±V_a bóng đèn đều sáng mượt hai chiều!' : (bright > 0.05 ? 'SCHOTTKY: Chỉ dẫn ở chiều thuận' : 'SCHOTTKY: Chiều ngược bị khóa — đèn TẮT!'),
          W / 2, topY + 14, isOhmic ? C.c2 : C.err, 10.5, 'center', 800);
      }
    }
  ]
});

/* ==========================================================================
   10. MỤC 6.5 — TIẾP XÚC OHMIC XUYÊN HẦM: BỀ RỘNG W, E_00 & R_c THEO N_d
   ========================================================================== */
LABS.push({
  id: 'tunnel', tag: '6.5', name: 'Xuyên hầm', sec: 6,
  S: { Nd: 1e19, phiBn: 0.80 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Pha tạp cực nặng n⁺ làm vùng nghèo co mỏng còn vài nm → electron XUYÊN HẦM qua rào!',
      area: 'a', anim: true,
      ctrls: [
        { k: 'Nd', l: 'N_d', min: 16.5, max: 20, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'phiBn', l: 'φ_Bn', min: 0.50, max: 1.00, step: 0.05, f: v => v.toFixed(2) + ' V' },
        { btn: '10¹⁷ (Chặn)', fn: p => { p.S.Nd = 1e17; p.S.phiBn = 0.80; p.syncCtrls(); p.dirty = true; } },
        { btn: 'VD 6.1 (10¹⁹)', fn: p => { p.S.Nd = 1e19; p.S.phiBn = 0.80; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, r = tunnelCalc(S.Nd, S.phiBn, 0.26, 11.7);
        const wNm = r.W * 1e7, isTun = r.E00_eV >= 0.020;

        const bw = Math.min(310, W * 0.50), bd = Math.min(134, H * 0.38), subH = 104, mtH = 22;
        const ox = W * 0.24, oy = H * 0.78;
        const depH = clamp((wNm / 120) * subH * 0.82, 8, subH * 0.84);

        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, subH, C.card, 1, C.sub);
        isoBox(ctx, ox, oy, 0, 0, subH - depH, bw, bd, depH, isTun ? C.c2 : C.c5, 0.38, isTun ? C.c2 : C.c5);
        isoBox(ctx, ox, oy, 0, 0, subH, bw, bd, mtH, METALS.Au.col, 0.92, C.ink);

        // Sóng electron xuyên hầm qua lớp mỏng
        const nE = isTun ? 10 : 2;
        for (let k = 0; k < nE; k++) {
          const u = (t * (isTun ? 1.8 : 0.4) + k / nE) % 1;
          const z = isTun ? (subH - depH - 18 + u * (depH + 34)) : (subH - depH - 10 - Math.abs(Math.sin(t * 3 + k)) * 18);
          const pt = isoP(ox, oy, 26 + (k % 5) * ((bw - 52) / 4), bd * 0.5, z);
          dot(ctx, pt[0], pt[1], 4.2, isTun ? C.c2 : C.err);
        }

        const gx = W - 70;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Bề rộng W', wNm.toFixed(1) + ' nm', clamp(1 - wNm / 120, 0, 1), isTun ? C.c2 : C.c5);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'E_00 / kT', (r.E00_eV * 1e3).toFixed(1) + ' meV', clamp(r.E00_eV / 0.06, 0, 1), isTun ? C.c2 : C.err);

        chip(ctx, isTun ? 'XUYÊN HẦM MẠNH (W=' + wNm.toFixed(1) + ' nm, eφ/E₀₀=' + r.ratio.toFixed(0) + ') → R_c cực nhỏ (Ohmic!)'
          : 'Hàng rào còn dày (W=' + wNm.toFixed(0) + ' nm, eφ/E₀₀=' + r.ratio.toFixed(0) + ') → vẫn phát xạ nhiệt (Chặn)',
          W * 0.44, 15, isTun ? C.c2 : C.err, 'center');
      }
    },
    {
      title: 'Bên trong (mặt cắt bức tường lượng tử): Tăng N_d làm tường nghèo co mỏng từ 102 nm còn vài nm → hạt đi xuyên qua!',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, r = tunnelCalc(S.Nd, S.phiBn, 0.26, 11.7);
        const wNm = r.W * 1e7, isTun = r.E00_eV >= 0.020;
        const padX = 16, topY = 12, botY = H - 12, bw = W - padX * 2, bh = botY - topY, my = (topY + botY) * 0.52;
        const xMt = padX + bw * 0.26;
        const wallPx = clamp((wNm / 120) * (bw * 0.36), 10, bw * 0.38);

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
        ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = METALS.Au.col; ctx.fillRect(padX, topY, xMt - padX, bh); ctx.restore();
        ln(ctx, xMt, topY, xMt, botY, C.ink, 1.8);

        // Bức tường vùng nghèo dày/mỏng tỉ lệ W
        ctx.save(); ctx.globalAlpha = isTun ? 0.22 : 0.45; ctx.fillStyle = isTun ? C.c2 : C.c5;
        ctx.fillRect(xMt, topY + 6, wallPx, bh - 12); ctx.restore();
        rr(ctx, xMt, topY + 6, wallPx, bh - 12, 3); ctx.strokeStyle = isTun ? C.c2 : C.c5; ctx.lineWidth = 1.6; ctx.stroke();

        // Hạt electron lao tới bức tường: xuyên thẳng qua nếu tường mỏng, dội bật lại nếu tường dày!
        for (let k = 0; k < 8; k++) {
          const u = (t * (isTun ? 1.5 : 0.9) + k / 8) % 1;
          const ey = topY + 18 + (k % 4) * ((bh - 36) / 3);
          if (isTun) {
            const ex = padX + bw - 14 - u * (bw - 28);
            dot(ctx, ex, ey, 4.2, C.c2);
          } else {
            const bounce = u < 0.5 ? u * 2 : (1 - u) * 2;
            const ex = padX + bw - 14 - bounce * (padX + bw - 18 - (xMt + wallPx + 6));
            dot(ctx, ex, ey, 4, C.err);
          }
        }

        txt(ctx, 'Kim loại', padX + (xMt - padX) / 2, topY + 14, C.main, 10, 'center', 700);
        txt(ctx, 'Tường W = ' + wNm.toFixed(1) + ' nm', xMt + wallPx / 2, botY - 12, isTun ? C.c2 : C.c5, 9.8, 'center', 800);
        txt(ctx, isTun ? 'Màng siêu mỏng → XUYÊN HẦM ồ ạt (Ohmic!)' : 'Tường quá dày → Electron dội ngược lại!',
          padX + bw - 12, topY + 14, isTun ? C.c2 : C.err, 10.2, 'right', 800);
      }
    }
  ]
});

/* ==========================================================================
   11. MỤC 7.3 — QUY TẮC ANDERSON: GHÉP HAI BÁN DẪN, ΔE_c, ΔE_v & KIỂU DỊ TIẾP GIÁP
   ========================================================================== */
LABS.push({
  id: 'anderson', tag: '7.3', name: 'Anderson', sec: 7,
  S: { m1: 'Ge', m2: 'GaAs' },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Ghép dị vật liệu epitaxy — phân loại Straddling / Staggered / Broken Gap',
      area: 'a',
      ctrls: [
        { k: 'm1', seg: [['Ge', 'Ge'], ['Si', 'Si'], ['GaAs', 'GaAs'], ['InAs', 'InAs']] },
        { k: 'm2', seg: [['GaAs', 'GaAs'], ['AlAs', 'AlAs'], ['GaSb', 'GaSb']] },
        { btn: 'VD 7.1 (Ge/GaAs)', fn: p => { p.S.m1 = 'Ge'; p.S.m2 = 'GaAs'; p.syncCtrls(); p.dirty = true; } },
        { btn: 'GaAs/AlAs', fn: p => { p.S.m1 = 'GaAs'; p.S.m2 = 'AlAs'; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Broken (InAs/GaSb)', fn: p => { p.S.m1 = 'InAs'; p.S.m2 = 'GaSb'; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H) {
        const S = p.S, s1 = SEMIS[S.m1], s2 = SEMIS[S.m2];
        const ec1 = -s1.chi, ev1 = -(s1.chi + s1.Eg);
        const ec2 = -s2.chi, ev2 = -(s2.chi + s2.Eg);
        const dEc = Math.abs(s1.chi - s2.chi);
        const dEv = Math.abs((s1.chi + s1.Eg) - (s2.chi + s2.Eg));
        let kind = 'Straddling (Loại I — bao trùm)', kCol = C.c2;
        if (ec1 < ev2 || ec2 < ev1) { kind = 'Broken Gap (Loại III — vùng cấm gãy)'; kCol = C.err; }
        else if (!((ec1 <= ec2 && ev1 >= ev2) || (ec2 <= ec1 && ev2 >= ev1))) { kind = 'Staggered (Loại II — so le)'; kCol = C.main; }

        const bw = Math.min(300, W * 0.48), bd = Math.min(136, H * 0.38), h1 = 56, h2 = 56;
        const ox = W * 0.24, oy = H * 0.78;
        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, h2, C.c1, 0.30, C.c1);
        isoBox(ctx, ox, oy, 0, 0, h2, bw, bd, h1, C.c2, 0.38, C.c2);

        const lb1 = isoP(ox, oy, 0, bd, h2 + h1 / 2);
        const lb2 = isoP(ox, oy, 0, bd, h2 / 2);
        txt(ctx, s1.name + ' (E_g=' + s1.Eg + 'eV, χ=' + s1.chi + 'V)', lb1[0] - 8, lb1[1], C.c2, 10.2, 'right', 700);
        txt(ctx, s2.name + ' (E_g=' + s2.Eg + 'eV, χ=' + s2.chi + 'V)', lb2[0] - 8, lb2[1], C.c1, 10.2, 'right', 700);

        const gx = W - 70;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Bậc ΔE_c', dEc.toFixed(2) + ' eV', clamp(dEc / 1.2, 0, 1), C.c2);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Bậc ΔE_v', dEv.toFixed(2) + ' eV', clamp(dEv / 1.2, 0, 1), C.c4);

        chip(ctx, s1.name + ' / ' + s2.name + ': ' + kind, W * 0.44, 15, kCol, 'center');
      }
    },
    {
      title: 'Bên trong (mô hình 2 hành lang vật liệu ghép sát): nhìn trực tiếp bậc thềm electron (trên) & lỗ trống (dưới)',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, s1 = SEMIS[S.m1], s2 = SEMIS[S.m2];
        const padX = 16, topY = 12, botY = H - 12, rightInfo = 152;
        const bw = W - padX - rightInfo, midX = padX + bw * 0.50;
        const bh = botY - topY, sc = (bh - 16) / 3.4;
        const yTopRef = topY + 8;
        const yOf = phi => yTopRef + (phi - 3.3) * sc;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
        const yC1 = clamp(yOf(s1.chi), topY + 8, botY - 26), yV1 = clamp(yOf(s1.chi + s1.Eg), yC1 + 14, botY - 8);
        const yC2 = clamp(yOf(s2.chi), topY + 8, botY - 26), yV2 = clamp(yOf(s2.chi + s2.Eg), yC2 + 14, botY - 8);

        // Tô bức tường gạch vùng cấm của 2 vật liệu để thấy hành lang dẫn ở trên và dưới
        ctx.save(); ctx.globalAlpha = 0.24;
        ctx.fillStyle = C.c2; ctx.fillRect(padX + 2, yC1, midX - padX - 2, yV1 - yC1);
        ctx.fillStyle = C.c1; ctx.fillRect(midX, yC2, padX + bw - midX - 2, yV2 - yC2);
        ctx.restore();
        ln(ctx, midX, topY, midX, botY, C.ink, 2);

        // Hạt electron chạy trong hành lang dẫn phía trên (tự rơi xuống phía có sàn thấp hơn!)
        const lowSide = yC1 > yC2 ? 1 : 2;
        for (let k = 0; k < 5; k++) {
          const u = (t * 0.9 + k * 0.2) % 1;
          const ex = lowSide === 1 ? (padX + 12 + u * (midX - padX - 24)) : (midX + 12 + u * (padX + bw - midX - 24));
          const ey = (lowSide === 1 ? yC1 : yC2) - 6;
          dot(ctx, ex, clamp(ey, topY + 6, botY - 6), 3.8, C.c2);
        }

        txt(ctx, s1.name + ' (tường cấm ' + s1.Eg + 'eV)', (padX + midX) / 2, (yC1 + yV1) / 2, C.ink, 10, 'center', 700);
        txt(ctx, s2.name + ' (tường cấm ' + s2.Eg + 'eV)', (midX + padX + bw) / 2, (yC2 + yV2) / 2, C.ink, 10, 'center', 700);

        const rx = padX + bw + 12;
        const dEc = Math.abs(s1.chi - s2.chi), dEv = Math.abs((s1.chi + s1.Eg) - (s2.chi + s2.Eg));
        txt(ctx, 'Bậc thềm e⁻ (ΔE_c):', rx, topY + 18, C.mut, 9.5, 'left', 600);
        txt(ctx, dEc.toFixed(2) + ' eV', rx, topY + 34, C.main, 12, 'left', 800);
        txt(ctx, 'Bậc thềm h⁺ (ΔE_v):', rx, topY + 58, C.mut, 9.5, 'left', 600);
        txt(ctx, dEv.toFixed(2) + ' eV', rx, topY + 74, C.err, 12, 'left', 800);
      }
    }
  ]
});

/* ==========================================================================
   12. MỤC 7.6 — DỊ TIẾP GIÁP nP: VÙNG NGHÈO, V_bi & CÁC BẬC ΔE_c, ΔE_v
   ========================================================================== */
LABS.push({
  id: 'heteronp', tag: '7.6', name: 'Dị tiếp giáp nP', sec: 7,
  S: { Nd: 1e16, Na: 1e16 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Dị tiếp giáp n-Ge / P-GaAs — trung hòa điện N_d x_n = N_a x_P & chia thế theo ε_s',
      area: 'a',
      ctrls: [
        { k: 'Nd', l: 'N_d (n-Ge)', min: 15, max: 17, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'Na', l: 'N_a (P-GaAs)', min: 15, max: 17, step: 0.1, log: 1, f: v => pw(v) },
        { btn: 'Ví dụ 7.2', fn: p => { p.S.Nd = 1e16; p.S.Na = 1e16; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H) {
        const S = p.S, sN = SEMIS.Ge, sP = SEMIS.GaAs;
        const epsN = sN.epsR * EPS0_CM, epsP = sP.epsR * EPS0_CM;
        const phiN = VT_300 * Math.log(sN.Nc / S.Nd);
        const phiP = VT_300 * Math.log(sP.Nv / S.Na);
        const Vbi = Math.max(0.1, (sP.chi + sP.Eg - phiP) - (sN.chi + phiN));
        const denom = epsN * S.Nd + epsP * S.Na;
        const xn = Math.sqrt((2 * epsN * epsP * S.Na * Vbi) / (E_CHG * S.Nd * denom));
        const xP = Math.sqrt((2 * epsN * epsP * S.Nd * Vbi) / (E_CHG * S.Na * denom));
        const Vbin = (E_CHG * S.Nd * xn * xn) / (2 * epsN);
        const VbiP = (E_CHG * S.Na * xP * xP) / (2 * epsP);

        const bw = Math.min(310, W * 0.50), bd = Math.min(132, H * 0.36), bh = 88;
        const ox = W * 0.24, oy = H * 0.78, half = bw / 2;
        const xnPx = clamp((xn * 1e4 / 0.8) * half, 12, half - 6);
        const xPPx = clamp((xP * 1e4 / 0.8) * half, 12, half - 6);

        isoBox(ctx, ox, oy, 0, 0, 0, half, bd, bh, C.card, 1, C.c2);
        isoBox(ctx, ox, oy, half, 0, 0, half, bd, bh, C.card, 1, C.c4);
        isoBox(ctx, ox, oy, half - xnPx, 0, 0, xnPx, bd, bh, C.c2, 0.30, C.c2);
        isoBox(ctx, ox, oy, half, 0, 0, xPPx, bd, bh, C.c4, 0.30, C.c4);

        const pL = isoP(ox, oy, half * 0.4, bd, bh + 12);
        const pR = isoP(ox, oy, half * 1.6, bd, bh + 12);
        txt(ctx, 'n-Ge (ε=16ε₀) · x_n=' + fmtLen(xn), pL[0], pL[1], C.c2, 10, 'center', 700);
        txt(ctx, 'P-GaAs (ε=13.1ε₀) · x_P=' + fmtLen(xP), pR[0], pR[1], C.c4, 10, 'center', 700);

        const gx = W - 68;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'V_bin (Ge)', Vbin.toFixed(3) + ' V', Vbin / Vbi, C.c2);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'V_biP (GaAs)', VbiP.toFixed(3) + ' V', VbiP / Vbi, C.c4);

        chip(ctx, 'V_bi = ' + Vbi.toFixed(3) + ' V = ' + Vbin.toFixed(3) + ' + ' + VbiP.toFixed(3) + ' V  (N_d x_n = N_a x_P)', W * 0.44, 15, C.main, 'center');
      }
    },
    {
      title: 'Bên trong (mặt cắt ngang n-Ge / P-GaAs): Ion donor (+) & acceptor (−) cân bằng N_d x_n = N_a x_P, điện trường nhảy bậc',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, sN = SEMIS.Ge, sP = SEMIS.GaAs;
        const epsN = sN.epsR * EPS0_CM, epsP = sP.epsR * EPS0_CM;
        const phiN = VT_300 * Math.log(sN.Nc / S.Nd), phiP = VT_300 * Math.log(sP.Nv / S.Na);
        const Vbi = Math.max(0.1, (sP.chi + sP.Eg - phiP) - (sN.chi + phiN));
        const denom = epsN * S.Nd + epsP * S.Na;
        const xn = Math.sqrt((2 * epsN * epsP * S.Na * Vbi) / (E_CHG * S.Nd * denom));
        const xP = Math.sqrt((2 * epsN * epsP * S.Nd * Vbi) / (E_CHG * S.Na * denom));
        const Vbin = (E_CHG * S.Nd * xn * xn) / (2 * epsN);
        const VbiP = (E_CHG * S.Na * xP * xP) / (2 * epsP);

        const padX = 16, topY = 12, botY = H - 14, bw = W - padX * 2, bh = botY - topY, midX = padX + bw * 0.50;
        const wL = clamp((xn * 1e4 / 0.8) * (bw * 0.42), 26, bw * 0.44);
        const wR = clamp((xP * 1e4 / 0.8) * (bw * 0.42), 26, bw * 0.44);

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
        ctx.save(); ctx.globalAlpha = 0.20;
        ctx.fillStyle = C.c2; ctx.fillRect(midX - wL, topY + 2, wL, bh - 4);
        ctx.fillStyle = C.c4; ctx.fillRect(midX, topY + 2, wR, bh - 4);
        ctx.restore();
        ln(ctx, midX, topY, midX, botY, C.ink, 2);

        // Ion cố định hai bên & mũi tên điện trường xuyên qua mặt phân cách
        for (let i = 0; i < 4; i++) {
          drawIon(ctx, midX - wL + (i + 0.5) * (wL / 4), topY + bh * 0.44, '+', C.c2, 4.8);
          drawIon(ctx, midX + (i + 0.5) * (wR / 4), topY + bh * 0.44, '−', C.c4, 4.8);
        }
        arr(ctx, midX - 28, topY + bh * 0.72, midX + 34, topY + bh * 0.72, C.main, 2.2);
        txt(ctx, 'D = ε_s E liên tục (E nhảy bậc)', midX, topY + bh * 0.86, C.main, 9.5, 'center', 700);

        txt(ctx, 'n-Ge · x_n=' + fmtLen(xn) + ' · V_bin=' + Vbin.toFixed(3) + 'V', midX - wL / 2, topY + 14, C.c2, 10, 'center', 800);
        txt(ctx, 'P-GaAs · x_P=' + fmtLen(xP) + ' · V_biP=' + VbiP.toFixed(3) + 'V', midX + wR / 2, topY + 14, C.c4, 10, 'center', 800);
      }
    }
  ]
});

/* ==========================================================================
   13. MỤC 7.8 — DỊ TIẾP GIÁP ĐẲNG LOẠI n-N: KHE THẾ TAM GIÁC Ở MẶT PHÂN CÁCH
   ========================================================================== */
LABS.push({
  id: 'heteronn', tag: '7.8', name: 'Dị tiếp giáp n-N', sec: 7,
  S: { ND: 2e17, dEc: 0.30 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: N-AlGaAs / n-GaAs — electron từ donor AlGaAs rơi xuống tụ thành màng mỏng bên GaAs',
      area: 'a', anim: true,
      ctrls: [
        { k: 'ND', l: 'N_D (AlGaAs)', min: 16, max: 18, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'dEc', l: 'ΔE_c', min: 0.15, max: 0.48, step: 0.02, f: v => v.toFixed(2) + ' eV' }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const depth = clamp((Math.log10(S.ND) - 15.8) / 2.2 * (S.dEc / 0.30), 0.15, 1.2);
        const bw = Math.min(310, W * 0.50), bd = Math.min(134, H * 0.38), hAl = 54, hGa = 66;
        const ox = W * 0.24, oy = H * 0.78;

        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, hGa, C.card, 1, C.sub);
        isoBox(ctx, ox, oy, 0, 0, hGa - 10, bw, bd, 10, C.c2, clamp(0.35 + depth * 0.55, 0.35, 0.95), C.c2);
        isoBox(ctx, ox, oy, 0, 0, hGa, bw, bd, hAl, C.c1, 0.26, C.c1);

        // Ion donor (+) nằm bên trên trong N-AlGaAs, tách rời hẳn khỏi màng e- bên dưới!
        for (let i = 0; i < 6; i++) {
          const pt = isoP(ox, oy, 24 + i * ((bw - 48) / 5), bd, hGa + 22);
          drawIon(ctx, pt[0], pt[1], '+', C.c4, 4.8);
        }
        // Electron tụ lại trong khe bên GaAs
        const nE = Math.round(5 + depth * 9);
        for (let i = 0; i < nE; i++) {
          const u = (t * 0.9 + i / nE) % 1;
          const pt = isoP(ox, oy, 14 + u * (bw - 28), bd * (0.2 + (i % 4) * 0.2), hGa - 5);
          dot(ctx, pt[0], pt[1], 4, C.main);
        }

        const l1 = isoP(ox, oy, 0, bd, hGa + hAl * 0.5);
        const l2 = isoP(ox, oy, 0, bd, hGa * 0.45);
        txt(ctx, 'N-AlGaAs (rộng, chứa donor +)', l1[0] - 8, l1[1], C.c1, 10, 'right', 700);
        txt(ctx, 'n-GaAs (hẹp, màng e⁻ tụ sát mặt)', l2[0] - 8, l2[1], C.c2, 10, 'right', 700);

        const gx = W - 68;
        drawMiniGauge(ctx, gx, H * 0.50, 24, 'Mật độ màng e⁻', Math.round(depth * 100) + '%', clamp(depth, 0, 1), C.c2);
        chip(ctx, 'Electron tách khỏi ion donor dương ⇒ tạo nền cho khí điện tử 2 chiều (2-DEG)!', W * 0.44, 15, C.c2, 'center');
      }
    },
    {
      title: 'Bên trong (chiều dọc đồng bộ 3D): Ion donor (+) nằm trên N-AlGaAs, electron rơi xuống tụ thành dòng sông sát mặt n-GaAs',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const depth = clamp((Math.log10(S.ND) - 15.8) / 2.2 * (S.dEc / 0.30), 0.15, 1.2);
        const padX = 16, rightLbl = 162, topY = 10, botY = H - 10;
        const bw = W - padX - rightLbl, bh = botY - topY, yIf = topY + bh * 0.48;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.stroke();
        ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.c1; ctx.fillRect(padX, topY, bw, yIf - topY); ctx.restore();
        const chH = 8 + depth * 12;
        ctx.save(); ctx.globalAlpha = 0.48; ctx.fillStyle = C.c2; ctx.fillRect(padX, yIf, bw, chH); ctx.restore();
        ln(ctx, padX, yIf, padX + bw, yIf, C.ink, 1.8);

        // Ion donor dương ở tầng trên (N-AlGaAs) + mũi tên electron rơi qua mặt phân cách
        for (let i = 0; i < 7; i++) {
          const x = padX + (i + 0.5) * (bw / 7);
          drawIon(ctx, x, topY + (yIf - topY) * 0.48, '+', C.c4, 4.8);
          if (i % 2 === 0) arr(ctx, x, yIf - 12, x, yIf + 5, C.main, 1.5);
        }
        // Dải electron tụ dày đặc và trượt mượt trong lớp mỏng bên GaAs
        const nE = Math.round(6 + depth * 10);
        for (let k = 0; k < nE; k++) {
          const x = padX + 8 + ((t * 95 + k * ((bw - 16) / nE)) % (bw - 16));
          dot(ctx, x, yIf + chH * 0.5, 4, C.c2);
        }

        const lx = padX + bw + 8;
        txt(ctx, '▲ N-AlGaAs (Donor +)', lx, topY + (yIf - topY) * 0.5, C.c1, 10, 'left', 700);
        txt(ctx, '▸ Khe tam giác tụ e⁻', lx, yIf + chH * 0.5, C.c2, 10.2, 'left', 800);
        txt(ctx, 'ΔE_c = ' + S.dEc.toFixed(2) + ' eV', lx, botY - 12, C.main, 10, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   14. MỤC 8.2 — GIẾNG TAM GIÁC & KHÍ ĐIỆN TỬ HAI CHIỀU (2-DEG)
   ========================================================================== */
LABS.push({
  id: 'twodeg', tag: '8.2', name: 'Giếng 2-DEG', sec: 8,
  S: { F: 1e5, mRel: 0.067 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Mặt phẳng khí điện tử 2 chiều (2-DEG) — bị khóa theo z, trượt tự do theo (x, y)',
      area: 'a', anim: true,
      ctrls: [
        { k: 'F', l: 'Trường F', min: 4.3, max: 5.7, step: 0.05, log: 1, f: v => sci(v, 1) + ' V/cm' },
        { k: 'mRel', seg: [[0.067, 'GaAs (0.067m₀)'], [0.041, 'InGaAs (0.041)'], [0.19, 'Si (0.19)']] },
        { btn: 'Ví dụ 8.1', fn: p => { p.S.F = 1e5; p.S.mRel = 0.067; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, w = wkbTriangular(S.F, S.mRel);
        const bw = Math.min(310, W * 0.50), bd = Math.min(150, H * 0.42);
        const ox = W * 0.24, oy = H * 0.72;

        isoBox(ctx, ox, oy, 0, 0, -40, bw, bd, 40, C.card, 0.75, C.sub);
        // Tấm khí điện tử 2-DEG siêu mỏng phát sáng ở z=0
        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, 6, C.c2, 0.65, C.c2);

        // Các electron lướt tự do trong mặt phẳng (x, y) ở z=3
        for (let k = 0; k < 14; k++) {
          const x = ((k * 37 + t * 85 * (k % 2 ? 1 : -0.8)) % bw + bw) % bw;
          const y = ((k * 29 + t * 55 * (k % 3 ? 0.7 : -1)) % bd + bd) % bd;
          const pt = isoP(ox, oy, x, y, 3);
          dot(ctx, pt[0], pt[1], 4.2, C.main);
        }

        const pz = isoP(ox, oy, 0, bd, 4);
        arr(ctx, pz[0] - 24, pz[1] - 24, pz[0] - 24, pz[1] + 24, C.err, 2);
        txt(ctx, 'Khóa z (lượng tử)', pz[0] - 30, pz[1], C.err, 9.8, 'right', 700);
        const pxy = isoP(ox, oy, bw * 0.5, bd * 0.5, 22);
        txt(ctx, 'Tự do 2D trong mặt phẳng (x, y)', pxy[0], pxy[1], C.c2, 10.5, 'center', 800);

        const gx = W - 70;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Mức đáy E₀', (w.E0 * 1e3).toFixed(0) + ' meV', clamp(w.E0 / 0.25, 0, 1), C.c2);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Khoảng E₁−E₀', ((w.E1 - w.E0) * 1e3).toFixed(0) + ' meV', clamp((w.E1 - w.E0) / 0.20, 0, 1), C.main);

        chip(ctx, 'E₀ ≈ ' + (w.E0 * 1e3).toFixed(0) + ' meV, E₁ ≈ ' + (w.E1 * 1e3).toFixed(0) + ' meV (E₁−E₀ = ' + ((w.E1 - w.E0) * 1e3).toFixed(0) + ' meV > kT = 26 meV)',
          W * 0.44, 15, C.c2, 'center');
      }
    },
    {
      title: 'Bên trong (hộp cộng hưởng lượng tử theo chiều dày z): Sóng dừng rời rạc E₀, E₁ ép sát tường khi trường F tăng',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, w = wkbTriangular(S.F, S.mRel);
        const padX = 16, rightLbl = 156, topY = 12, botY = H - 12;
        const bw = W - padX - rightLbl, bh = botY - topY;
        const zWidthPx = clamp((1e5 / S.F) * bw * 0.55, bw * 0.28, bw * 0.85);

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
        ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = C.c2; ctx.fillRect(padX, topY, zWidthPx, bh); ctx.restore();
        ln(ctx, padX + 2, topY, padX + 2, botY, C.ink, 3);
        ln(ctx, padX + zWidthPx, topY, padX + zWidthPx, botY, C.c1, 1.6, [4, 3]);

        // Hai dây đàn sóng dừng lượng tử (mức E0 một bụng, mức E1 hai bụng)
        const drawStanding = (yMid, nMode, col, lbl) => {
          ctx.beginPath();
          for (let i = 0; i <= 40; i++) {
            const u = i / 40, x = padX + 4 + u * (zWidthPx - 6);
            const y = yMid + Math.sin(Math.PI * nMode * u) * Math.cos(t * (4 + nMode * 2.5)) * 14;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.stroke();
          txt(ctx, lbl, padX + zWidthPx + 8, yMid, col, 10, 'left', 800);
        };
        drawStanding(topY + bh * 0.30, 2, C.main, 'E₁ (' + (w.E1 * 1e3).toFixed(0) + ' meV)');
        drawStanding(topY + bh * 0.72, 1, C.c2, 'E₀ (' + (w.E0 * 1e3).toFixed(0) + ' meV)');

        const lx = padX + bw + 10;
        txt(ctx, 'Điện trường F ép hẹp', lx, topY + 18, C.mut, 9.5, 'left', 600);
        txt(ctx, 'E₀ = ' + (w.E0 * 1e3).toFixed(0) + ' meV', lx, topY + 40, C.c2, 10.8, 'left', 800);
        txt(ctx, 'E₁ = ' + (w.E1 * 1e3).toFixed(0) + ' meV', lx, topY + 60, C.main, 10.8, 'left', 800);
        txt(ctx, 'e⁻ chủ yếu ở mức E₀!', lx, botY - 10, C.c2, 9.8, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   15. MỤC 8.4 — TRANSISTOR HEMT: LỚP CUNG CẤP N-AlGaAs, KÊNH 2-DEG & ĐIỀU KHIỂN CỔNG
   ========================================================================== */
LABS.push({
  id: 'hemt', tag: '8.4', name: 'Transistor HEMT', sec: 8,
  S: { VG: 0.0, dNm: 25, VDS: 1.0 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: AlGaAs/GaAs HEMT — electron cao tốc trong GaAs không pha tạp, tách khỏi ion donor!',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VG', l: 'V_G', min: -1.2, max: 0.6, step: 0.05, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' },
        { k: 'dNm', l: 'Bề dày d', min: 15, max: 50, step: 5, f: v => v + ' nm' },
        { k: 'VDS', l: 'V_DS', min: 0, max: 2.0, step: 0.1, f: v => v.toFixed(1) + ' V' },
        { btn: 'Mở mạnh', fn: p => { p.S.VG = 0.4; p.S.VDS = 1.2; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Tắt kênh (V_off)', fn: p => { p.S.VG = -1.0; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, Voff = -0.85, epsAl = 12.2 * EPS0_CM;
        const dCm = S.dNm * 1e-7;
        const ns = Math.max(0, (epsAl * (S.VG - Voff)) / (E_CHG * dCm)); // cm^-2
        const frac = clamp(ns / 2.2e12, 0, 1);
        const ids = frac * clamp(S.VDS / 0.8, 0, 1.3) * 180; // mA/mm minh họa

        const bw = Math.min(330, W * 0.52), bd = Math.min(144, H * 0.40), hGa = 64, hAl = clamp(18 + S.dNm * 0.5, 22, 46);
        const ox = W * 0.23, oy = H * 0.78;

        // Lớp dẫn GaAs không pha tạp (dưới)
        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, hGa, C.card, 1, C.sub);
        // Kênh 2-DEG phát sáng ngay dưới mặt phân cách
        if (frac > 0.02) {
          isoBox(ctx, ox, oy, 0, 0, hGa - 8, bw, bd, 8, C.c2, 0.25 + frac * 0.72, C.c2);
        }
        // Lớp cung cấp N-AlGaAs (trên)
        isoBox(ctx, ox, oy, 0, 0, hGa, bw, bd, hAl, C.c1, 0.28, C.c1);

        // 3 điện cực Source, Gate (Schottky), Drain
        isoBox(ctx, ox, oy, 6, 8, hGa + hAl, 54, bd - 16, 16, C.c2, 0.88, C.ink);
        isoBox(ctx, ox, oy, bw * 0.36, 4, hGa + hAl, bw * 0.28, bd - 8, 18, C.main, 0.94, C.ink);
        isoBox(ctx, ox, oy, bw - 60, 8, hGa + hAl, 54, bd - 16, 16, C.c5, 0.88, C.ink);

        // Electron chạy cao tốc trong kênh 2-DEG
        if (frac > 0.03 && S.VDS > 0.05) {
          const nE = Math.max(3, Math.round(frac * 14));
          for (let k = 0; k < nE; k++) {
            const u = (t * (1.2 + S.VDS * 1.1) + k / nE) % 1;
            const pt = isoP(ox, oy, 20 + u * (bw - 40), bd * (0.2 + (k % 4) * 0.2), hGa - 4);
            dot(ctx, pt[0], pt[1], 4.2, C.main);
          }
        }

        const pS = isoP(ox, oy, 33, bd * 0.5, hGa + hAl + 26);
        const pG = isoP(ox, oy, bw * 0.5, bd * 0.5, hGa + hAl + 28);
        const pD = isoP(ox, oy, bw - 33, bd * 0.5, hGa + hAl + 26);
        txt(ctx, 'Source', pS[0], pS[1], C.c2, 10, 'center', 800);
        txt(ctx, 'Gate (' + (S.VG >= 0 ? '+' : '') + S.VG.toFixed(2) + 'V)', pG[0], pG[1], C.main, 10.5, 'center', 800);
        txt(ctx, 'Drain (+' + S.VDS.toFixed(1) + 'V)', pD[0], pD[1], C.c5, 10, 'center', 800);

        const gx = W - 70;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Mật độ 2-DEG n_s', ns > 0 ? sci(ns, 1) : '0 (Cạn)', frac, C.c2);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Dòng kênh I_DS', ids.toFixed(0) + ' mA/mm', clamp(ids / 220, 0, 1), frac > 0.03 ? C.main : C.err);

        chip(ctx, frac <= 0.02 ? 'V_G ≤ V_off (−0.85V): KÊNH 2-DEG ĐÃ CẠN → HEMT TẮT!'
          : 'HEMT đang dẫn cao tốc (n_s ≈ ε_s(V_G−V_off)/ed): độ linh động cực cao cho 5G/Radar!', W * 0.44, 15, frac <= 0.02 ? C.err : C.c2, 'center');
      }
    },
    {
      title: 'Mặt cắt dọc đồng bộ: Cổng Schottky điều khiển tụ phẳng n_s ≈ ε_s(V_G − V_off)/(e·d) làm đầy/cạn kênh 2-DEG',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, Voff = -0.85, epsAl = 12.2 * EPS0_CM;
        const ns = Math.max(0, (epsAl * (S.VG - Voff)) / (E_CHG * S.dNm * 1e-7));
        const frac = clamp(ns / 2.2e12, 0, 1);

        const padX = 16, rightLbl = 162, topY = 14, botY = H - 12;
        const bw = W - padX - rightLbl, bh = botY - topY;
        const gH = 14, alH = clamp(18 + S.dNm * 0.55, 22, bh * 0.42);
        const yAl = topY + gH, yIf = yAl + alH;

        rr(ctx, padX, yAl, bw, botY - yAl, 7); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.stroke();
        ctx.save(); ctx.globalAlpha = 0.20; ctx.fillStyle = C.c1; ctx.fillRect(padX, yAl, bw, alH); ctx.restore();
        ln(ctx, padX, yIf, padX + bw, yIf, C.ink, 1.8);

        // Cổng Schottky ở giữa trên cùng
        const gX = padX + bw * 0.28, gW = bw * 0.44;
        rr(ctx, gX, topY, gW, gH, 4); ctx.fillStyle = C.main; ctx.fill();
        txt(ctx, 'Gate Schottky', gX + gW / 2, topY + gH / 2, C.bg, 9.5, 'center', 800);

        // Vùng nghèo dưới cổng (mở rộng xuống chạm mặt phân cách khi V_G âm!)
        const depGate = alH * clamp(1 - frac * 0.65, 0.35, 1.05);
        ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = C.err;
        ctx.fillRect(gX, yAl, gW, Math.min(botY - yAl - 4, depGate)); ctx.restore();

        // Ion donor (+) trong lớp cung cấp N-AlGaAs
        for (let i = 0; i < 8; i++) {
          drawIon(ctx, padX + (i + 0.5) * (bw / 8), yAl + alH * 0.5, '+', C.c4, 4.5);
        }

        // Kênh 2-DEG trong GaAs không pha tạp (bị thắt dưới cổng khi frac nhỏ)
        if (frac > 0.02) {
          const chH = 4 + frac * 11;
          ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = C.c2; ctx.fillRect(padX + 2, yIf + 1, bw - 4, chH); ctx.restore();
          const nE = Math.max(4, Math.round(frac * 14));
          for (let k = 0; k < nE; k++) {
            const x = padX + 8 + ((t * (70 + S.VDS * 110) + k * ((bw - 16) / nE)) % (bw - 16));
            dot(ctx, x, yIf + chH * 0.5 + 1, 3.8, C.c2);
          }
        }

        const lx = padX + bw + 10;
        txt(ctx, '▲ N-AlGaAs (d=' + S.dNm + ' nm)', lx, yAl + alH * 0.5, C.c1, 10, 'left', 700);
        txt(ctx, '▸ Kênh 2-DEG (GaAs sạch)', lx, yIf + 10, frac > 0.02 ? C.c2 : C.err, 10, 'left', 700);
        txt(ctx, 'n_s = ' + (ns > 0 ? sci(ns, 1) + '/cm²' : '0 (Tắt)'), lx, yIf + 28, C.ink, 10.2, 'left', 800);
        txt(ctx, 'Không tán xạ ion donor!', lx, botY - 8, C.mut, 9.5, 'left', 600);
      }
    }
  ]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM CHO ĐỦ 15 MÔ HÌNH TƯƠNG TÁC BUỔI 10
   ========================================================================== */
const LD = {};
LD.schottky = {
  intro: [
    ['i', 'Khi kim loại (công thoát φ_m) áp vào bán dẫn loại n (ái lực χ, φ_s = χ + φ_n) với φ_m > φ_s, electron từ bán dẫn tràn sang kim loại để cân bằng mức Fermi.'],
    ['w', 'Hàng rào lý tưởng nhìn từ kim loại φ_B0 = φ_m − χ KHÔNG phụ thuộc pha tạp N_d; còn thế tiếp xúc V_bi = φ_B0 − φ_n phụ thuộc N_d qua φ_n.'],
    ['v', 'Mặc định khớp Ví dụ 1.1 (Au/Si, N_d=10¹⁶): φ_B0 = 1,09 V, φ_n = 0,206 V, V_bi = 0,884 V. Thử đổi sang Al xem hàng rào tụt thấp thế nào!']
  ],
  react(S, k, P, say) {
    const r = schottkyCalc(S.metal, S.semi, S.Nd, 0);
    say('v', `${r.mt.name} / n-${r.sm.name} (N_d=${pw(S.Nd)}): φ_B0 = ${r.phiB0.toFixed(2)} V, φ_n = ${r.phiN.toFixed(3)} V, V_bi = ${r.Vbi.toFixed(3)} V.`);
    if (!r.isRect) say('w', 'φ_m ≤ φ_s: vùng năng lượng uốn xuống (tích lũy electron) — không còn hàng rào chỉnh lưu!');
  }
};
LD.bias = {
  intro: [
    ['i', 'Khác với tiếp giáp p-n: ở điốt Schottky, hàng rào nhìn từ kim loại (φ_B0) KHÔNG ĐỔI theo điện áp; chỉ hàng rào nhìn từ bán dẫn (V_bi − V_a) thay đổi!'],
    ['w', 'Phân cực ngược (V_a < 0): rào tăng thành V_bi + V_R, vùng nghèo W rộng ra và |E_max| tăng mạnh.'],
    ['v', 'Bấm nút "Ngược −5V" để đối chiếu Ví dụ 2.1 (W = 0,873 µm, |E_max| = 1,35×10⁵ V/cm, C\' = 11,9 nF/cm²).']
  ],
  react(S, k, P, say) {
    const r = schottkyCalc('Au', 'Si', S.Nd, -S.Va);
    say('v', `V_a=${S.Va >= 0 ? '+' : ''}${S.Va.toFixed(2)} V → V_barrier=${Math.max(0.05, r.Vbi - S.Va).toFixed(2)} V, W=${fmtLen(r.W)}, |E_max|=${sci(r.Emax, 2)} V/cm.`);
  }
};
LD.cv = {
  intro: [
    ['i', 'Đo C-V là phương pháp thực nghiệm chuẩn xác để tìm cùng lúc V_bi, nồng độ pha tạp N_d và chiều cao hàng rào φ_Bn.'],
    ['w', 'Khi tăng V_R, hai bản cực của tụ phẳng (mặt kim loại và mép vùng nghèo W) tách xa nhau làm điện dung C\' = ε_s/W giảm dần.'],
    ['v', 'Bấm "VD 2.1 (5V)" để kiểm chứng C\' = 11,9 nF/cm², sau đó thử đổi sang W/GaAs như hình trong slide!']
  ],
  react(S, k, P, say) {
    const r = schottkyCalc(S.metal, S.semi, S.Nd, S.VR);
    say('v', `${S.metal}/${S.semi}, V_R=${S.VR.toFixed(1)} V → C\'=${(r.Cprime * 1e9).toFixed(1)} nF/cm², cắt −V_bi=−${r.Vbi.toFixed(3)} V, φ_Bn=${(r.Vbi + r.phiN).toFixed(3)} V.`);
  }
};
LD.image = {
  intro: [
    ['i', 'Electron đứng trước bề mặt kim loại chịu lực hút Coulomb từ điện tích ảnh (+e) đối xứng bên trong kim loại (cách nhau 2x).'],
    ['w', 'Cộng thế lực ảnh với thế điện trường vùng nghèo E làm đỉnh hàng rào bị cắt thấp đi Δφ = √(eE/4πε_s) tại vị trí x_m = √(e/16πε_s E).'],
    ['v', 'Mặc định khớp Ví dụ 3.1 (Si, E=10⁵ V/cm): x_m = 1,75 nm, Δφ = 0,035 V. Bấm "E = 10⁶ V/cm" xem Δφ tăng √10 lần lên 0,111 V!']
  ],
  react(S, k, P, say) {
    const im = imageCalc(S.semi, S.E);
    say('v', `${im.sm.name}, E=${sci(S.E, 1)} V/cm → x_m = ${(im.xm * 1e7).toFixed(2)} nm, Δφ = ${im.dPhi.toFixed(3)} V.`);
  }
};
LD.pinning = {
  intro: [
    ['i', 'Thực tế bề mặt bán dẫn có lớp oxit mỏng và các trạng thái bề mặt D_it có khả năng tích điện, làm lệch hàng rào khỏi công thức lý tưởng φ_m − χ.'],
    ['w', 'Khi D_it rất lớn (như ở GaAs), lớp bẫy bề mặt đóng vai trò như "tấm khiên" chắn điện trường: φ_Bn ≈ (E_g − eφ_0)/e gần như không phụ thuộc kim loại!'],
    ['v', 'Kéo mức ghim về 0% rồi đổi kim loại (Al→Pt), sau đó kéo lên 95% để thấy tấm khiên D_it chặn hoàn toàn đường sức!']
  ],
  react(S, k, P, say) {
    const sm = SEMIS[S.semi], mt = METALS[S.metal];
    const pb = (1 - S.pin) * (mt.phiM - sm.chi) + S.pin * (sm.Eg - sm.phi0);
    say('v', `${S.metal}/${S.semi}, ghim ${Math.round(S.pin * 100)}% → φ_Bn = ${pb.toFixed(2)} V.`);
  }
};
LD.iv = {
  intro: [
    ['i', 'Dòng trong điốt Schottky do các electron đa số có đủ năng lượng nhiệt nhảy qua hàng rào φ_Bn (phát xạ nhiệt điện tử).'],
    ['w', 'Vì J_sT = A*T² exp(−eφ_Bn/kT) phụ thuộc hàm mũ vào φ_Bn, hạ rào chỉ 0,1 V làm dòng bão hòa tăng tới ~48 lần!'],
    ['v', 'Bấm "Ví dụ 4.1" để đối chiếu J_sT = 4,2×10⁻⁷ A/cm² và V_a = 0,44 V tại J = 10 A/cm². Bật/tắt Δφ để xem dòng ngược dốc lên.']
  ],
  react(S, k, P, say) {
    const Vt = (KB * S.T) / E_CHG;
    const js = 120 * S.T * S.T * Math.exp(-S.phiBn / Vt);
    say('v', `φ_Bn=${S.phiBn.toFixed(2)} V, T=${S.T} K → J_sT = ${sci(js, 2)} A/cm², V_a(10 A/cm²) = ${(Vt * Math.log(10 / js)).toFixed(2)} V.`);
  }
};
LD.compare = {
  intro: [
    ['i', 'Điốt Schottky dẫn bằng hạt đa số (phát xạ nhiệt) nên dòng bão hòa ngược J_sT lớn hơn điốt p-n (hạt thiểu số, khuếch tán) nhiều bậc độ lớn.'],
    ['w', 'Vì V_a = V_t ln(J/J_s), J_s lớn hơn ~10⁶ lần khiến điện áp mở thuận của Schottky thấp hơn p-n khoảng 0,37 V ở cùng mật độ dòng!'],
    ['v', 'Mặc định khớp Ví dụ 5.1 (J = 10 A/cm²): Schottky mở ở 0,312 V, p-n mở ở 0,682 V — tiết kiệm đáng kể tổn hao công suất.']
  ],
  react(S, k, P, say) {
    const jsS = 120 * 300 * 300 * Math.exp(-S.phiBn / VT_300), jsP = Math.pow(10, S.logJspn);
    const vS = VT_300 * Math.log(S.Jtarget / jsS), vP = VT_300 * Math.log(S.Jtarget / jsP);
    say('v', `J=${S.Jtarget.toFixed(1)} A/cm²: V_a(Schottky)=${vS.toFixed(3)} V vs V_a(p-n)=${vP.toFixed(3)} V (chênh ${(vP - vS).toFixed(2)} V).`);
  }
};
LD.switch = {
  intro: [
    ['i', 'Ưu điểm vượt trội thứ hai của điốt Schottky là tốc độ chuyển mạch cực nhanh (cỡ picô giây so với nanô giây của p-n).'],
    ['w', 'Khi đang dẫn thuận, điốt p-n bơm đầy hạt thiểu số vào miền đối diện; lúc cắt ngược, mạch phải chờ rút hết đám mây điện tích này (thời gian phục hồi ngược t_rr).'],
    ['v', 'Quan sát mạch tải xung bên dưới: điốt Schottky tắt đèn ngay lập tức, còn điốt p-n bị phụt dòng xả ngược màu đỏ trong suốt t_rr!']
  ],
  react(S, k, P, say) {
    say('v', `Chế độ: ${S.mode}, thời gian sống τ_p = ${S.tauNs} ns → điốt p-n mất t_rr ≈ ${Math.round(S.tauNs * 1.4)} ns mới tắt hẳn.`);
  }
};
LD.ohmic = {
  intro: [
    ['i', 'Tiếp xúc ohmic cần điện trở tiếp xúc rất nhỏ và dẫn dòng tuyến tính theo CẢ HAI CHIỀU (không chỉnh lưu).'],
    ['w', 'Lý tưởng: bán dẫn loại n cần φ_m < φ_s (tạo lớp tích lũy electron); bán dẫn loại p đảo lại cần φ_m > φ_s (tích lũy lỗ trống).'],
    ['v', 'Thử kéo φ_m vượt qua φ_s và đảo chiều V_a để thấy tiếp xúc biến từ ohmic hai chiều thành Schottky một chiều!']
  ],
  react(S, k, P, say) {
    const phiS = S.type === 'n' ? 4.22 : 4.92;
    const ok = S.type === 'n' ? S.phiM < phiS : S.phiM > phiS;
    say('v', `Loại ${S.type}, φ_m=${S.phiM.toFixed(2)} V vs φ_s=${phiS.toFixed(2)} V → ${ok ? 'OHMIC (tích lũy hạt đa số)' : 'SCHOTTKY (vùng nghèo chặn dòng)'}.`);
  }
};
LD.tunnel = {
  intro: [
    ['i', 'Do ghim mức Fermi, thực tế luôn tồn tại hàng rào φ_Bn dù chọn kim loại nào. Giải pháp công nghiệp là pha tạp cực nặng lớp bề mặt (n⁺ ≥ 10¹⁹ cm⁻³).'],
    ['w', 'Vì W ∝ 1/√N_d, hàng rào co mỏng xuống chỉ còn vài nm (~10–100 Å): electron xuyên hầm lượng tử trực tiếp qua rào, làm R_c giảm hàng triệu lần!'],
    ['v', 'Bấm lần lượt "10¹⁷ (Chặn)" và "VD 6.1 (10¹⁹)" để đối chiếu W = 102 nm vs 10 nm và E_00 = 3,4 meV vs 34 meV.']
  ],
  react(S, k, P, say) {
    const r = tunnelCalc(S.Nd, S.phiBn, 0.26, 11.7);
    say('v', `N_d=${pw(S.Nd)}: W = ${(r.W * 1e7).toFixed(1)} nm, E_00 = ${(r.E00_eV * 1e3).toFixed(1)} meV, tỉ số eφ_Bn/E_00 = ${r.ratio.toFixed(0)}.`);
  }
};
LD.anderson = {
  intro: [
    ['i', 'Quy tắc Anderson dùng mức chân không E_vac làm mốc chung để dự đoán độ lệch vùng dẫn ΔE_c = e|χ₁ − χ₂| và vùng hóa trị ΔE_v tại dị tiếp giáp.'],
    ['w', 'Tùy cặp vật liệu mà vùng cấm xếp kiểu Straddling (bao trùm), Staggered (so le) hoặc Broken Gap (vùng cấm gãy như InAs/GaSb).'],
    ['v', 'Mặc định khớp Ví dụ 7.1 (Ge/GaAs): ΔE_c = 0,06 eV, ΔE_v = 0,70 eV (92% độ chênh vùng cấm rơi vào vùng hóa trị).']
  ],
  react(S, k, P, say) {
    const s1 = SEMIS[S.m1], s2 = SEMIS[S.m2];
    const dEc = Math.abs(s1.chi - s2.chi), dEv = Math.abs((s1.chi + s1.Eg) - (s2.chi + s2.Eg));
    say('v', `${s1.name}/${s2.name}: ΔE_c = ${dEc.toFixed(2)} eV, ΔE_v = ${dEv.toFixed(2)} eV.`);
  }
};
LD.heteronp = {
  intro: [
    ['i', 'Ở dị tiếp giáp n-P, hằng số điện môi hai phía khác nhau (ε_sn ≠ ε_sP) nên độ điện dịch D = ε_s E liên tục qua mặt phân cách, còn trung hòa điện vẫn là N_d x_n = N_a x_P!'],
    ['w', 'Phía có hằng số điện môi ε_s nhỏ hơn (GaAs: 13,1 so với Ge: 16) sẽ gánh phần thế tiếp xúc lớn hơn.'],
    ['v', 'Mặc định khớp Ví dụ 7.2 (n-Ge/P-GaAs, N_d=N_a=10¹⁶): x_n = x_P = 0,284 µm, V_bin = 0,455 V, V_biP = 0,556 V, tổng V_bi = 1,010 V.']
  ],
  react(S, k, P, say) {
    const sN = SEMIS.Ge, sP = SEMIS.GaAs, epsN = sN.epsR * EPS0_CM, epsP = sP.epsR * EPS0_CM;
    const Vbi = Math.max(0.1, (sP.chi + sP.Eg - VT_300 * Math.log(sP.Nv / S.Na)) - (sN.chi + VT_300 * Math.log(sN.Nc / S.Nd)));
    const d = epsN * S.Nd + epsP * S.Na;
    const xn = Math.sqrt((2 * epsN * epsP * S.Na * Vbi) / (E_CHG * S.Nd * d));
    const xP = Math.sqrt((2 * epsN * epsP * S.Nd * Vbi) / (E_CHG * S.Na * d));
    say('v', `N_d=${pw(S.Nd)}, N_a=${pw(S.Na)} → x_n=${fmtLen(xn)}, x_P=${fmtLen(xP)}, V_bi=${Vbi.toFixed(3)} V.`);
  }
};
LD.heteronn = {
  intro: [
    ['i', 'Khi ghép dị tiếp giáp đẳng loại N-AlGaAs (vùng cấm rộng) với n-GaAs (hẹp), electron từ N-AlGaAs tràn sang GaAs để cân bằng mức Fermi.'],
    ['w', 'Vùng dẫn E_c của GaAs bị kéo cong xuống THẤP HƠN mức Fermi E_F ngay tại x = 0, tạo một khe thế năng hình tam giác giam giữ electron!'],
    ['v', 'Tăng N_D của N-AlGaAs hoặc ΔE_c để thấy khe tam giác đào sâu hơn và mật độ electron tích tụ tăng mạnh.']
  ],
  react(S, k, P, say) {
    say('v', `N_D=${pw(S.ND)}, ΔE_c=${S.dEc.toFixed(2)} eV → electron tách khỏi ion donor dương ở AlGaAs, tụ kín trong khe tam giác bên GaAs.`);
  }
};
LD.twodeg = {
  intro: [
    ['i', 'Khe tam giác ở mặt phân cách AlGaAs/GaAs chỉ rộng vài nm nên xảy ra giam giữ lượng tử theo phương vuông góc z (các mức rời rạc E₀, E₁ ∝ F^(2/3)).'],
    ['w', 'Trong khi đó, electron vẫn trượt hoàn toàn tự do theo mặt phẳng (x, y) — tạo thành khí điện tử hai chiều (2-DEG).'],
    ['v', 'Mặc định khớp Ví dụ 8.1 (GaAs, m*=0,067m₀, F=10⁵ V/cm): E₀ ≈ 89 meV, E₁ ≈ 157 meV (cách nhau 68 meV > kT = 26 meV).']
  ],
  react(S, k, P, say) {
    const w = wkbTriangular(S.F, S.mRel);
    say('v', `F=${sci(S.F, 1)} V/cm, m*=${S.mRel}m₀ → E₀ ≈ ${(w.E0 * 1e3).toFixed(0)} meV, E₁ ≈ ${(w.E1 * 1e3).toFixed(0)} meV.`);
  }
};
LD.hemt = {
  intro: [
    ['i', 'Transistor HEMT gom toàn bộ kiến thức Buổi 10: lớp N-AlGaAs cung cấp electron, còn kênh dẫn 2-DEG nằm gọn trong lớp GaAs không pha tạp.'],
    ['w', 'Vì electron tách rời khỏi ion tạp chất donor nên không bị tán xạ ion hóa → độ linh động cực cao và nhiễu cực thấp (radar, vệ tinh, 5G/6G).'],
    ['v', 'Kéo điện áp cổng V_G âm dần tới V_off = −0,85 V để xem cổng Schottky làm cạn sạch kênh 2-DEG theo mô hình tụ n_s ≈ ε_s(V_G − V_off)/(ed).']
  ],
  react(S, k, P, say) {
    const epsAl = 12.2 * EPS0_CM, ns = Math.max(0, (epsAl * (S.VG + 0.85)) / (E_CHG * S.dNm * 1e-7));
    say('v', `V_G=${S.VG >= 0 ? '+' : ''}${S.VG.toFixed(2)} V, d=${S.dNm} nm → n_s = ${ns > 0 ? sci(ns, 2) + ' cm⁻²' : '0 (Kênh đã tắt!)'}.`);
  }
};
LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (#lab10 — đồng bộ 100% phong cách & biến màu CSS của lab-b11.js)
   ========================================================================== */
const CSS = `
#lab10{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab10[hidden]{display:none}
#lab10 *{box-sizing:border-box}
#lab10 .lb-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
#lab10 .lb-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
#lab10 .lb-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
#lab10 .lb-ic{color:var(--main);display:flex}
#lab10 .lb-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
#lab10 .lb-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
#lab10 .lb-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
#lab10 .lb-tab:hover{color:var(--ink);background:var(--tint)}
#lab10 .lb-tab.on{background:var(--main);color:var(--bg);font-weight:700}
#lab10 .lb-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
#lab10 .lb-x:hover{color:var(--err);background:var(--tint)}
#lab10 .lb-b{flex:1;min-height:0;display:grid;gap:6px;padding:6px}
#lab10 .lb-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
#lab10 .lb-p.glow{animation:lb10glow 1.4s ease-out}
@keyframes lb10glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
#lab10 .lb-t{font:600 11.5px/1.2 var(--font-ui);color:var(--mut);padding:5px 10px 0;flex:none}
#lab10 .lb-cv{flex:1;min-height:0;position:relative}
#lab10 .lb-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#lab10 .lb-c{display:flex;flex-wrap:wrap;gap:5px 10px;padding:4px 10px 6px;flex:none;align-items:center}
#lab10 .lb-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
#lab10 .lb-k input[type=range]{width:clamp(64px,7vw,108px);margin:0}
#lab10 .lb-k output{color:var(--ink);font-weight:700;min-width:3em}
#lab10 .lb-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
#lab10 .lb-seg button,#lab10 .lb-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:5px 8px;cursor:pointer}
#lab10 .lb-btn{background:var(--tint)}
#lab10 .lb-seg button:hover,#lab10 .lb-btn:hover{color:var(--ink)}
#lab10 .lb-seg button.on{background:var(--main);color:var(--bg)}
#lab10 .lb-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
#lab10 .lb-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb10in .4s ease-out;overflow-wrap:anywhere}
#lab10 .lb-ln::before{position:absolute;left:0;font-weight:700}
#lab10 .lb-ln.i{color:var(--ink)}#lab10 .lb-ln.i::before{content:'›';color:var(--c5)}
#lab10 .lb-ln.w{color:var(--ink)}#lab10 .lb-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
#lab10 .lb-ln.v{color:var(--main)}#lab10 .lb-ln.v::before{content:'=';color:var(--main)}
@keyframes lb10in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab-m:hover,.lab-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
#lab10 .lb-cv canvas.cam{cursor:grab;touch-action:none}
#lab10 .lb-cv canvas.cam:active{cursor:grabbing}
#lab10 .lb-sep{width:1px;height:18px;background:var(--g);margin:0 2px}
#lab10 .lb-c{position:relative}
#lab10 .lb-film{position:absolute;top:3px;right:3px;z-index:3;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--main);color:var(--bg);font:700 13px/1 var(--font-body);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35);user-select:none}
#lab10 .lb-film.on{background:var(--err);color:#fff}
#lab10.filming .lb-c>*:not(.lb-cap){visibility:hidden}
#lab10.filming .lb-cv canvas.cam{cursor:default}
#lab10 .lb-cap{position:absolute;left:0;right:0;bottom:0;min-height:100%;box-sizing:border-box;display:none;background:var(--card);border-top:1px solid var(--main);padding:8px 14px 9px;font:600 13px/1.45 var(--font-body);color:var(--ink);pointer-events:none;z-index:2}
#lab10 .lb-cap i{display:block;height:3px;background:var(--main);border-radius:2px;margin-top:7px;width:0}
@media(max-width:900px){#lab10 .lb-win{width:100vw;height:100dvh;border-radius:0}#lab10 .lb-b{overflow:auto;display:flex;flex-direction:column}#lab10 .lb-p{min-height:300px;flex:none}#lab10 .lb-p:nth-child(2){min-height:210px}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style');
sty.textContent = CSS;
document.head.appendChild(sty);

let timers = [], ros = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'schottky';

function ensureDom() {
  if (root) return;
  root = document.createElement('div');
  root.id = 'lab10';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 10');
  root.innerHTML = '<div class="lb-win"><div class="lb-h"><span class="lb-ic">' + FLASK + '</span><span class="lb-bd">Phòng thí nghiệm · Buổi 10</span><nav class="lb-tabs"></nav><button class="lb-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb-b"></div></div>';
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
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty && window.LabB10 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden && (document.getElementById('tb-badge') || {}).textContent === 'Buổi 10') {
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

/* ---------- ĐIỀU KHIỂN CAMERA (kéo xoay · lăn chuột zoom) & PHIM TỰ ĐỘNG ---------- */
let film = null, TSC = 1, TT = 0;
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const lerp = (a, b, k) => a + (b - a) * k;
const D2R = Math.PI / 180;
const tiltOf = sy => (sy - 0.06) / 0.79 * 90;
const syOf = tilt => 0.06 + clamp(tilt, 0, 90) / 90 * 0.79;

function setupCam(tab, p, el, cv) {
  const three = THREE.has(tab.id), c = p.cam = newCam();
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
  const resetView = () => { if (film) return; Object.assign(c, { yaw: 0, sy: 0.28, zoom: 1, follow: 0, mx: 0, my: 0 }); p.syncCtrls(); p.dirty = true; };
  if (FILM[tab.id]) {
    const fb = document.createElement('div'); fb.className = 'lb-film'; fb.textContent = '▶'; fb.title = 'Phim tự động'; fb.setAttribute('aria-label', 'Phim tự động'); fb.setAttribute('role', 'button'); fb.tabIndex = 0;
    fb.onclick = () => { if (film) filmStop(false); else filmStart(tab, p); };
    fb.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fb.onclick(); } };
    el.querySelector('.lb-cv').appendChild(fb); p.filmBtn = fb;
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
  filmStop(false, true);
  const home = Object.assign({}, tab.S), ctrl = {};
  const stepOf = {}; tab.panels.forEach(q => (q.ctrls || []).forEach(k => { if (k.k && k.step && !k.log) stepOf[k.k] = k.step; }));
  const steps = FILM[tab.id].concat([{ d: 3, cap: 'Kết thúc phim — mọi thông số và góc nhìn đã trở về như ban đầu. Bạn có thể tự xoay, zoom và chỉnh thanh trượt để thử lại.', v: V(0, tiltOf(0.28), 1), set: home, slow: 1 }]);
  film = { tab, p, steps, stepOf, i: -1, t: 0, total: steps.reduce((s, q) => s + q.d, 0), done: 0, home };
  root.classList.add('filming');
  if (p.filmBtn) { p.filmBtn.textContent = '■'; p.filmBtn.title = 'Dừng phim'; p.filmBtn.setAttribute('aria-label', 'Dừng phim'); p.filmBtn.classList.add('on'); }
  if (p.cap) p.cap.style.display = 'block';
  filmNext();
  for (let rest = at || 0; rest > 0 && film;) { const s = Math.min(0.1, rest); filmTick(s); rest -= s; }
}
function filmNext() {
  const f = film; f.i++;
  if (f.i >= f.steps.length) { filmStop(true); return; }
  const st = f.steps[f.i], c = f.p.cam, S = f.tab.S;
  f.from = { cam: camSnap(c), S: {} };
  f.t = 0;
  if (st.set) Object.keys(st.set).forEach(k => {
    if (typeof st.set[k] !== 'number' || SNAPK.includes(k)) S[k] = st.set[k]; else f.from.S[k] = S[k];
  });
  if (f.p.cap) { const n = f.p.cap; n.firstChild.textContent = st.cap; }
  say('w', st.cap);
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
    c.fx = lerp(from.cam.f[0], tf[0], sc); c.fy = lerp(from.cam.f[1], tf[1], sc); if (tf[2] != null) c.fz = lerp(from.cam.f[2], tf[2], sc);
    c.follow = lerp(from.cam.follow, 1, sc);
  } else if (v.f === undefined && (v.yaw != null || v.zoom != null)) c.follow = lerp(from.cam.follow, 0, sc);
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
  curPanels.forEach(q => { q.dirty = true; if (q.syncCtrls) q.syncCtrls(); });
  if (f.p.cap) f.p.cap.lastChild.style.width = (100 * clamp((f.done + f.t) / f.total, 0, 1)) + '%';
}
function filmStop(done, silent) {
  const f = film; if (!f) return;
  film = null; TSC = 1;
  root.classList.remove('filming');
  if (f.p.filmBtn) { f.p.filmBtn.textContent = '▶'; f.p.filmBtn.title = 'Phim tự động'; f.p.filmBtn.setAttribute('aria-label', 'Phim tự động'); f.p.filmBtn.classList.remove('on'); }
  if (f.p.cap) f.p.cap.style.display = 'none';
  if (!done) { Object.assign(f.tab.S, f.home); Object.assign(f.p.cam, { yaw: 0, sy: 0.28, zoom: 1, follow: 0, mx: 0, my: 0 }); }
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
  const dt = Math.min(0.04, (ts - last) / 1000);
  last = ts; tAcc += dt; TT += dt * TSC;
  if (film) filmTick(dt);
  curPanels.forEach(p => {
    if (!p.ctx || !p.W || !(p.spec.anim || p.dirty)) return;
    p.dirty = false;
    const ctx = p.ctx;
    ctx.clearRect(0, 0, p.W, p.H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, p.W, p.H);
    ctx.save();
    const cm = p.cam;
    if (cm) {
      if (p.three) { CAM = cm; beginCam(cm, p.W, p.H); }
      else if (cm.zoom !== 1 || cm.mx || cm.my || cm.follow) {
        const gx = 0.5 + (cm.fx - 0.5) * cm.follow, gy = 0.5 + (cm.fy - 0.5) * cm.follow;
        ctx.translate(p.W / 2 + cm.mx, p.H / 2 + cm.my); ctx.scale(cm.zoom, cm.zoom); ctx.translate(-gx * p.W, -gy * p.H);
      }
    }
    try { p.spec.draw(p, ctx, p.W, p.H, TT, dt * TSC); } catch (err) { console.error('[LabB10]', err); }
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

/* ---------- gắn biểu tượng bình thí nghiệm cạnh tiêu đề Buổi 10 (đủ 15 mỏ neo) ---------- */
const H2MAP = { 1: 'schottky', 2: 'bias', 3: 'image', 4: 'iv', 5: 'compare', 6: 'ohmic', 7: 'anderson', 8: 'twodeg' };
const H3MAP = [
  [/^1\.2/, 'schottky', 1], [/^1\.3/, 'schottky', 0], [/^1\.4/, 'schottky', 0], [/^1\.5/, 'schottky', 1],
  [/^2\.1/, 'bias', 0, { Va: -5.0 }], [/^2\.2/, 'bias', 0, { Va: 0.45 }], [/^2\.3/, 'bias', 0],
  [/^2\.4/, 'bias', 0, { Va: -5.0 }], [/^2\.5/, 'cv', 1], [/^2\.6/, 'cv', 0],
  [/^3\.1/, 'image', 0], [/^3\.2/, 'image', 0], [/^3\.3/, 'pinning', 1], [/^3\.4/, 'pinning', 0],
  [/^4\.1/, 'iv', 0], [/^4\.2/, 'iv', 1], [/^4\.3/, 'iv', 0],
  [/^5\.1/, 'compare', 0], [/^5\.2/, 'compare', 1], [/^5\.3/, 'switch', 0], [/^5\.4/, 'compare', 0], [/^5\.5/, 'switch', 0],
  [/^6\.1/, 'ohmic', 0], [/^6\.2/, 'ohmic', 1], [/^6\.3/, 'ohmic', 0], [/^6\.4/, 'tunnel', 1], [/^6\.5/, 'tunnel', 0],
  [/^7\.1/, 'anderson', 0], [/^7\.2/, 'anderson', 1], [/^7\.3/, 'anderson', 0],
  [/^7\.4/, 'heteronp', 1], [/^7\.5/, 'heteronp', 0], [/^7\.6/, 'heteronp', 0],
  [/^7\.7/, 'heteronn', 1], [/^7\.8/, 'heteronn', 0], [/^7\.9/, 'anderson', 0],
  [/^8\.1/, 'twodeg', 1], [/^8\.2/, 'twodeg', 0], [/^8\.3/, 'hemt', 1], [/^8\.4/, 'hemt', 0]
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

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 10') {
  markLesson(document.getElementById('app-content'));
}
window.LabB10 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id),
  film: (id, at) => { ensureDom(); if (root.hidden || (id && (!cur || cur.id !== id))) open(id); const p = curPanels.find(q => q.cam); if (p) filmStart(cur, p, at); } };
})();
