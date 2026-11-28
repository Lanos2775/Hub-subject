/* ==========================================================================
   lab-b9.5.js — PHÒNG THÍ NGHIỆM MÔ PHỎNG BUỔI 9.5:
   ĐIỐT TIẾP GIÁP p-n — DÒNG LÝ TƯỞNG, KHÔNG LÝ TƯỞNG, TÍN HIỆU NHỎ
   - Mô phỏng vật lý trực quan bằng hạt (electron, lỗ trống, ion cố định, cặp tái hợp / sinh),
     đập thế năng, đồng hồ kim — KHÔNG dùng đồ thị hay sơ đồ.
   - 3D xoay bằng chuột, phim tự động (nút ▶ góc trên phải), Space / nhấp để tạm dừng, lăn chuột tua phim.
   - 9 tab ứng 1–1 với 9 mỏ neo b95-lab-01…09:
       1.3 Ba trạng thái | 2.4 Hạt thiểu số ở mép | 2.6 Phân bố hạt dư | 3.4 Diốt lý tưởng
       4.2 Thành phần dòng | 4.5 Diốt dài/ngắn | 5.6 Ba vùng thuận | 5.7 Dòng sinh ngược | 6.6 Tín hiệu nhỏ
   - API: LabB95.open(tabId?, panelIndex?, patch?)  LabB95.close()  LabB95.mark(root)  LabB95.film(tabId?, at?)
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
    polyFill(ctx, pts, col, a * 0.85, sc, 1);
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
let GS = { spd: 0.5, cnt: 0.3 }, GT = '', CALM = false;
const cF = () => Math.min(1.6, GS.cnt * 2), sF = () => GS.spd * 1.2;
const KQ = 8.617e-5;
const MATS = { si: { ni: 1.5e10, eps: 11.7 * EPS0, eg: 1.12 }, gaas: { ni: 1.8e6, eps: 13.1 * EPS0, eg: 1.42 } };
const fV = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + ' V';
const fT = s => s >= 1e-6 ? (s * 1e6).toFixed(s >= 1e-5 ? 0 : 1) + ' µs' : (s * 1e9).toFixed(s >= 1e-7 ? 0 : 1) + ' ns';
const fRes = r => r >= 1e6 ? (r / 1e6).toFixed(2) + ' MΩ' : r >= 1e3 ? (r / 1e3).toFixed(2) + ' kΩ' : r.toFixed(r >= 100 ? 0 : 1) + ' Ω';
const fCap = c => c >= 1e-6 ? (c * 1e6).toFixed(2) + ' µF' : c >= 1e-9 ? (c * 1e9).toFixed(2) + ' nF' : c >= 1e-12 ? (c * 1e12).toFixed(2) + ' pF' : (c * 1e15).toFixed(1) + ' fF';
const fJ = j => sci(j, 2) + ' A/cm²';
const lg = x => Math.log10(Math.max(1e-40, Math.abs(x)));

function phys(S) {
  const T = S.T || 300, Vt = VT_300 * T / 300, m = MATS[S.mat || 'si'];
  const ni = m.ni * Math.pow(T / 300, 1.5) * Math.exp(-(m.eg / (2 * KQ)) * (1 / T - 1 / 300));
  const Na = S.Na, Nd = S.Nd, Va = S.Va;
  const Vbi = Vt * Math.log(Na * Nd / (ni * ni));
  const Vj = Math.max(0.02, Vbi - Va);
  const W = Math.sqrt(2 * m.eps * Vj / E_CHG * (1 / Na + 1 / Nd));
  const xn = W * Na / (Na + Nd), xp = W - xn;
  const tau = S.tau || 5e-7, Dn = S.Dn || 25, Dp = S.Dp || 10, tau0 = S.tau0 || tau;
  const Ln = Math.sqrt(Dn * tau), Lp = Math.sqrt(Dp * tau);
  const pn0 = ni * ni / Nd, np0 = ni * ni / Na;
  const Jp0 = E_CHG * Dp * pn0 / Lp, Jn0 = E_CHG * Dn * np0 / Ln, Js = Jp0 + Jn0;
  const A = S.A || 1e-4, Is = A * Js;
  const ev = Math.exp(Math.min(Va, 1.6) / Vt);
  const J = Js * (ev - 1), I = A * J;
  const Jg0 = E_CHG * ni * W / (2 * tau0);                // J_gen = e n_i W / 2τ0
  const Jr = Jg0 * Math.exp(Math.max(0, Math.min(Va, 1.6)) / (2 * Vt));
  const Vk = Vt * Math.log(Nd / pn0);                      // điểm tiêm mạnh: p_n(x_n) = N_d
  return { T, Vt, ni, Vbi, Vj, W, xn, xp, tau, Dn, Dp, Ln, Lp, pn0, np0, Jp0, Jn0, Js, A, Is, ev, J, I, Jg0, Jr, Vk, tau0, Va, Na, Nd,
    fr: clamp(Math.log10(1 + Math.abs(I) / Is) / 12, 0, 1) };
}
/* hình học hiển thị (đơn vị "du": thanh dài tối đa 1) — vùng nghèo được nén log để luôn nhìn thấy */
function geom(P, o) {
  o = o || {};
  const Wd = 0.05 + 0.33 * clamp((Math.log10(P.W) - Math.log10(3e-6)) / 2.3, 0, 1);
  const jx = 0.5, pe = jx - Wd * P.xp / P.W, ne = jx + Wd * P.xn / P.W;
  const fL = L => 0.07 + 0.26 * clamp(Math.log10(L / 3e-4) / 1.5, 0, 1);
  const lp0 = o.lp != null ? o.lp : fL(P.Lp), ln0 = o.ln != null ? o.ln : fL(P.Ln);
  const len = o.len ? o.len(pe, ne, lp0) : 1;
  return { pe, ne, len, Wd, jx, lp: Math.min(lp0, (len - ne) * 0.8), ln: Math.min(ln0, pe * 0.8) };
}
/* nghiệm V_j của diode có r_s: V_app = V_j + I(V_j)·r_s */
function curTot(S, vj) {
  const P = phys(Object.assign({}, S, { Va: vj }));
  const Id = P.I / Math.sqrt(1 + Math.exp((vj - P.Vk) / P.Vt));
  const Ir = P.A * P.Jr;
  return { P, Id, Ir, I: Id + Ir };
}
function solveVj(S) {
  let a = -1, b = S.Va;
  for (let i = 0; i < 46; i++) { const m = (a + b) / 2; if (m + curTot(S, m).I * (S.rs || 0) > S.Va) b = m; else a = m; }
  return (a + b) / 2;
}

/* ---- bộ mô phỏng dòng hạt tải (electron ← từ cực n, lỗ trống ← từ cực p) ----
   Mỗi hạt có đích riêng: 'I' xuyên mối nối làm hạt thiểu số rồi tái hợp sau quãng ~Exp(L);
   'S' tái hợp trong vùng trung hòa phía mình (bù cho hạt kia); 'X' tái hợp ngay trong vùng nghèo;
   'Q' hạt thiểu số bị cuốn qua khi phân cực ngược; 'G' cặp sinh ra trong vùng nghèo. */
const trkSpec = (g, o) => {
  switch (GT) {
    case 'bias': return { k: 'e', m: GS.Va > 0.35 ? 'I' : 'B' };
    case 'edge': case 'excess': case 'comp': case 'short': return { k: 'h', m: 'I' };
    case 'regions': return { k: 'e', m: (o.fX || 0) > 0.5 ? 'X' : 'I' };
    case 'gen': return { k: 'e', m: 'G' };
    default: return { k: 'e', m: 'I' };
  }
};
const SHARED = {};
function simFlow(st, key, t, dt, g, o) {
  const store = SHARED[GT || '_'] || (SHARED[GT || '_'] = {});   // dùng chung giữa khung 3D và khung bên trong
  const s = store[key] || (store[key] = { a: [], fl: [], c: [0, 0, 0, 0] });
  if (s.lt === t) return s; s.lt = t;
  if (CALM) { s.a.length = 0; s.fl.length = 0; s.trk = null; s.tl = null; s.tw = 0.4; return s; }   // đang đổi vùng: tạm ẩn hạt bay qua
  dt = clamp(dt, 0, 0.06);
  const ex = L => -L * Math.log(1 - Math.random() * 0.97), fX = o.fX || 0;
  const fe = o.fe != null ? o.fe : 0.5, fh = o.fh != null ? o.fh : 1 - fe;
  const sp = (o.sp || 0.16) * GS.spd * 1.2, cf = cF();
  const add = (k, u, dir, tg, m) => { if (s.a.length < 280) s.a.push({ k, u, dir, tg, m, v: Math.random(), w: Math.random(), tr: [], ta: 0 }); };
  s.c[0] += (o.R || 0) * dt * cf; s.c[1] += (o.R || 0) * dt * cf; s.c[2] += (o.rev || 0) * dt * cf; s.c[3] += (o.gen || 0) * dt * cf;
  while (s.c[0] >= 1) {
    s.c[0]--; const r = Math.random();
    const eu = tg => Math.min(g.len, Math.max(g.ne + 0.3, tg + 0.06));
    if (r < fX) { const tg = g.pe + Math.random() * (g.ne - g.pe); add('e', eu(tg), -1, tg, 'X'); }
    else if (r < fX + (1 - fX) * fe) { const tg = Math.max(0.02, g.pe - ex(g.ln)); add('e', eu(g.ne), -1, tg, 'I'); }
    else { const tg = Math.min(g.len - 0.02, g.ne + ex(g.lp)); add('e', eu(tg), -1, tg, 'S'); }
  }
  while (s.c[1] >= 1) {
    s.c[1]--; const r = Math.random();
    const hu = tg => Math.max(0, Math.min(g.pe - 0.3, tg - 0.06));
    if (r < fX) { const tg = g.pe + Math.random() * (g.ne - g.pe); add('h', hu(tg), 1, tg, 'X'); }
    else if (r < fX + (1 - fX) * fh) add('h', hu(g.pe), 1, o.shortN ? g.len : Math.min(g.len - 0.02, g.ne + ex(g.lp)), 'I');
    else { const tg = Math.max(0.02, g.pe - ex(g.ln)); add('h', hu(tg), 1, tg, 'S'); }
  }
  while (s.c[2] >= 1) {
    s.c[2]--;
    add('e', Math.max(0.02, g.pe - ex(g.ln)), 1, g.len, 'Q');
    add('h', Math.min(g.len - 0.02, g.ne + ex(g.lp)), -1, 0, 'Q');
  }
  while (s.c[3] >= 1) {
    s.c[3]--; const u = g.pe + Math.random() * (g.ne - g.pe), v = Math.random(), w = Math.random();
    add('e', u, 1, g.len, 'G'); add('h', u, -1, 0, 'G');
    s.a[s.a.length - 1].v = s.a[s.a.length - 2].v = v; s.a[s.a.length - 1].w = s.a[s.a.length - 2].w = w;
    s.fl.push({ u, v, w, t0: t, big: 0 });
  }
  if (GT && !o.noTrk) {            // một hạt "theo dõi" luôn có mặt: camera phim bám theo hạt này
    const sp2 = trkSpec(g, o);
    if (s.trk && s.a.includes(s.trk) && s.trk.m !== sp2.m) { s.a = s.a.filter(q => q !== s.trk); s.trk = null; s.tw = 0.2; }
    if (!s.trk || !s.a.includes(s.trk)) {
      if (s.trk) { s.tl = [s.trk.u, s.trk.v, s.trk.w]; s.trk = null; s.tw = 0.6; }
      s.tw = (s.tw == null ? 0 : s.tw) - dt;
      if (s.tw <= 0) {
        const e = sp2.k === 'e', m = sp2.m, ey = -Math.log(1 - Math.random() * 0.97);
        let q;
        if (e) {
          const u0 = Math.min(g.len - 0.01, (m === 'G' ? g.jx : g.ne + (m === 'B' ? 0.16 : 0.12)));
          if (m === 'G') q = { k: 'e', u: u0, dir: 1, tg: Math.min(g.len, g.ne + 0.1), m: 'G' };
          else if (m === 'B') q = { k: 'e', u: u0, dir: -1, tg: g.ne + 0.015, m: 'B', u0, bt: g.ne + 0.015, ad: -1 };
          else if (m === 'X') q = { k: 'e', u: u0, dir: -1, tg: g.pe + Math.random() * (g.ne - g.pe), m: 'X' };
          else q = { k: 'e', u: u0, dir: -1, tg: Math.max(0.02, g.pe - ey * g.ln), m: 'I' };
        } else q = { k: 'h', u: Math.max(0.01, g.pe - 0.12), dir: 1, tg: o.shortN ? g.len : Math.min(g.len - 0.02, g.ne + ey * g.lp), m: 'I' };
        q.v = 0.5; q.w = 0.5; q.tr = []; q.ta = 0;
        s.a.push(q); s.trk = q;
        if (m === 'G') { const h = { k: 'h', u: q.u, dir: -1, tg: 0, m: 'G', v: 0.5, w: 0.5, tr: [], ta: 0 }; s.a.push(h); s.fl.push({ u: q.u, v: 0.5, w: 0.5, t0: t, big: 0 }); }
      }
    }
  }
  const sq = Math.sqrt(dt);
  s.a = s.a.filter(q => {
    let v = sp;
    const inDep = q.u > g.pe && q.u < g.ne;
    if (inDep) v = sp * (q.m === 'G' || q.m === 'Q' ? (o.fast || 1.8) : 1.8);
    else if (q.m === 'I' || q.m === 'Q') {
      const minor = q.k === 'e' ? q.u <= g.pe : q.u >= g.ne;
      if (minor) { v = sp * 0.55; if (o.shortN && q.k === 'h') v = sp * 0.5 / (0.14 + Math.max(0, g.len - q.u) / Math.max(0.05, g.len - g.ne)); }
    }
    if (q.m === 'B') v *= clamp(Math.abs(q.u - q.bt) / 0.08 + 0.3, 0.3, 1);
    q.cs = q.cs == null ? v : q.cs + (v - q.cs) * (1 - Math.exp(-dt * 5)); v = q.cs;
    q.u += q.dir * v * dt; q.ta += Math.abs(v * dt);
    if (q.ta > 0.008) { q.ta = 0; q.tr.push([q.u, q.v, q.w]); if (q.tr.length > (q === s.trk ? 22 : 9)) q.tr.shift(); }
    q.dv = (q.dv || 0) - q.dv * 2 * dt + gauss() * 0.5 * sq; q.dw = (q.dw || 0) - q.dw * 2 * dt + gauss() * 0.5 * sq;
    if (q === s.trk) { q.v = 0.5; q.w = 0.5; } else { q.v = clamp(q.v + q.dv * dt, 0.06, 0.94); q.w = clamp(q.w + q.dw * dt, 0.06, 0.94); }
    if (q.m === 'B') {
      if (q.dir < 0 ? q.u <= q.tg : q.u >= q.tg) {
        if (q.dir === q.ad) { s.fl.push({ u: q.u, v: q.v, w: q.w, t0: t, big: 0 }); q.dir = -q.ad; q.tg = q.u0; } else { q.dir = q.ad; q.tg = q.bt; }
      }
      return true;
    }
    const done = q.dir < 0 ? q.u <= q.tg : q.u >= q.tg;
    if (done) {
      if (q.m === 'X' || q.m === 'I' || q.m === 'S') s.fl.push({ u: q.u, v: q.v, w: q.w, t0: t, big: q.m === 'X' ? 1 : 0 });
      return false;
    }
    return true;
  });
  s.fl = s.fl.filter(f => t - f.t0 < 0.6 && t - f.t0 > -1);
  return s;
}
const isMinor = (q, g) => (q.k === 'e' ? q.u < g.pe : q.u > g.ne);

/* ---- khung 3D: thanh p-n phóng lớn, hạt nền, ion vùng nghèo, hạt dòng ---- */
function scene3(p, ctx, W, H, t, P, g, o) {
  o = o || {};
  const st = p.st;
  const bw = Math.min(W * 0.6, 470), bd = Math.min(110, H * 0.3), bh = Math.min(84, H * 0.26);
  const ox = W * 0.14, oy = H * 0.7, X = u => u * bw;
  const hot = o.heat ? clamp(o.heat, 0, 1) : 0;
  isoBox(ctx, ox, oy, -12, 0, 0, 12, bd, bh, C.sub, 0.9, C.ink);
  isoBox(ctx, ox, oy, X(g.len), 0, 0, 12, bd, bh, C.sub, 0.9, C.ink);
  isoBox(ctx, ox, oy, 0, 0, 0, X(g.pe), bd, bh, C.card, 1, C.sub);
  isoBox(ctx, ox, oy, X(g.ne), 0, 0, X(g.len) - X(g.ne), bd, bh, C.card, 1, C.sub);
  isoBox(ctx, ox, oy, 0, 0, 0, X(g.pe), bd, bh, C.c4, 0.26 + hot * 0.2, hot > 0.05 ? C.err : C.sub);
  isoBox(ctx, ox, oy, X(g.ne), 0, 0, X(g.len) - X(g.ne), bd, bh, C.c2, 0.26 + hot * 0.2, hot > 0.05 ? C.err : C.sub);
  isoBox(ctx, ox, oy, X(g.pe), 0, 0, X(g.ne) - X(g.pe), bd, bh, C.c5, 0.36, C.c5);
  const tp = isoP(ox, oy, -6, bd / 2, bh + 4), tn = isoP(ox, oy, X(g.len) + 6, bd / 2, bh + 4);
  txt(ctx, 'p', tp[0], tp[1], C.c4, 12, 'center', 800); txt(ctx, 'n', tn[0], tn[1], C.c2, 12, 'center', 800);
  if (o.sign != null) {
    const a = isoP(ox, oy, -6, bd / 2, -14), b = isoP(ox, oy, X(g.len) + 6, bd / 2, -14);
    txt(ctx, o.sign > 0 ? '+' : '−', a[0], a[1], o.sign > 0 ? C.err : C.c2, 15, 'center', 800);
    txt(ctx, o.sign > 0 ? '−' : '+', b[0], b[1], o.sign > 0 ? C.c2 : C.err, 15, 'center', 800);
  }
  // ion cố định
  const wl = X(g.jx) - X(g.pe), wr = X(g.ne) - X(g.jx), nl = Math.floor(bh / 17);
  const grid = (xa, wd, sg, col) => { const nx = Math.max(1, Math.round(wd / 24)); for (let k = 0; k < nl; k++) for (let i = 0; i < nx; i++) for (let j = 0; j < 3; j++) i3(ctx, ox, oy, xa + (i + 0.5) * wd / nx, (j + 0.5) * bd / 3, (k + 0.5) * bh / nl, sg, col); };
  if (wl > 8) grid(X(g.pe), wl, '−', C.c5); if (wr > 8) grid(X(g.jx), wr, '+', C.err);
  // hạt đa số (nền nhiệt)
  const nH = Math.round(8 + 14 * clamp((Math.log10(P.Na) - 14) / 4, 0, 1)), nE = Math.round(8 + 14 * clamp((Math.log10(P.Nd) - 14) / 4, 0, 1));
  swarm(st, 'hp', 22, t, 0.22 * sF()).slice(0, Math.ceil(nH * cF())).forEach(q => p3(ctx, ox, oy, 6 + q.u * (X(g.pe) - 12), 6 + q.v * (bd - 12), 5 + q.w * (bh - 10), 4.2, C.c4, '+'));
  swarm(st, 'en', 22, t, 0.22 * sF()).slice(0, Math.ceil(nE * cF())).forEach(q => p3(ctx, ox, oy, X(g.ne) + 6 + q.u * (X(g.len) - X(g.ne) - 12), 6 + q.v * (bd - 12), 5 + q.w * (bh - 10), 4.2, C.c2, '−'));
  if (CAM) CAM.gm = { bw, bd, bh, len: g.len, g };
  return { ox, oy, bw, bd, bh, X };
}
function marker3(ctx, sc, u, col, label, up) {
  const x = sc.X(u);
  isoBox(ctx, sc.ox, sc.oy, x - 1.5, 0, 0, 3, sc.bd, sc.bh, col, 0.45, col);
  const q = isoP(sc.ox, sc.oy, x, sc.bd / 2, sc.bh + (up || 14));
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
  s.a.forEach(q => {
    trail(ctx, q.tr.concat([[q.u, q.v, q.w]]).map(a => isoP(sc.ox, sc.oy, a[0] * sc.bw, 6 + a[1] * (sc.bd - 12), 5 + a[2] * (sc.bh - 10))), q.k === 'e' ? C.c2 : C.c4);
    const x = q.u * sc.bw, y = 6 + q.v * (sc.bd - 12), z = 5 + q.w * (sc.bh - 10);
    if (isMinor(q, g)) { const c = isoP(sc.ox, sc.oy, x, y, z); ctx.beginPath(); ctx.arc(c[0], c[1], 7 * Math.pow(zf, 0.6), 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 1.4; ctx.stroke(); }
    p3(ctx, sc.ox, sc.oy, x, y, z, 4.4, q.k === 'e' ? C.c2 : C.c4, q.k === 'e' ? '−' : '+');
    if (q === s.trk) {
      const c = isoP(sc.ox, sc.oy, x, y, z), r = 11 * Math.pow(zf, 0.6), pu = 1 + 0.18 * Math.sin(t * 5);
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.main; ctx.beginPath(); ctx.arc(c[0], c[1], r * 1.9 * pu, 0, TAU2); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.stroke();
    }
  });
  s.fl.forEach(f => {
    const a = clamp((t - f.t0) / 0.55, 0, 1), c = isoP(sc.ox, sc.oy, f.u * sc.bw, 6 + f.v * (sc.bd - 12), 5 + f.w * (sc.bh - 10));
    ctx.save(); ctx.globalAlpha = 1 - a; ctx.beginPath(); ctx.arc(c[0], c[1], (5 + a * (f.big ? 20 : 13)) * Math.pow(zf, 0.5), 0, TAU2);
    ctx.strokeStyle = f.big ? C.err : C.main; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  });
}
/* cột đồng hồ kim thu nhỏ bên phải màn hình 3D */
function gcol(ctx, W, H, items, ys) {
  const n = items.length;
  items.forEach((it, i) => {
    const y = ys ? ys[i] : H * (n === 1 ? 0.5 : 0.17 + 0.66 * i / (n - 1));
    drawMiniGauge(ctx, W - 64, y, 23, it[0], it[1], it[2], it[3], it[4]);
  });
}
function chipTop(ctx, W, s, col) { chip(ctx, s, W * 0.43, 15, col || C.main, 'center'); }

/* ---- dải 2D (kính hiển vi): cùng hạt, cùng quy luật với khối 3D ---- */
function strip(ctx, W, H, t, P, g, o) {
  const st = o.st, pad = 14, x0 = pad, x1 = W - pad - (o.rt || 0), y0 = o.y0, y1 = o.y1, hh = y1 - y0;
  const MX = u => x0 + (u - o.u0) / (o.u1 - o.u0) * (x1 - x0);
  ctx.save(); rr(ctx, x0, y0, x1 - x0, hh, 8); ctx.clip();
  ctx.fillStyle = C.card; ctx.fillRect(x0, y0, x1 - x0, hh);
  const reg = (ua, ub, col, al) => { const a = clamp(MX(ua), x0, x1), b = clamp(MX(ub), x0, x1); if (b > a) { ctx.globalAlpha = al; ctx.fillStyle = col; ctx.fillRect(a, y0, b - a, hh); ctx.globalAlpha = 1; } };
  const hot = o.heat || 0;
  reg(-2, g.pe, hot > 0.05 ? C.err : C.c4, hot > 0.05 ? 0.12 + hot * 0.2 : 0.13);
  reg(g.pe, g.ne, C.c5, 0.28);
  reg(g.ne, g.len + 2, hot > 0.05 ? C.err : C.c2, hot > 0.05 ? 0.12 + hot * 0.2 : 0.13);
  // ion vùng nghèo
  const ion = (ua, ub, sg, col) => { const a = clamp(MX(ua), x0, x1), b = clamp(MX(ub), x0, x1); if (b - a < 8) return; const nx = Math.max(1, Math.round((b - a) / 22)), ny = Math.max(2, Math.round(hh / 34)); for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) drawIon(ctx, a + (i + 0.5) * (b - a) / nx, y0 + (j + 0.5) * hh / ny, sg, col, 4.6); };
  ion(g.pe, g.jx, '−', C.c5); ion(g.jx, g.ne, '+', C.err);
  // hạt nền
  const amb = (key, ua, ub, col, sg, n) => {
    const a = clamp(MX(ua), x0, x1), b = clamp(MX(ub), x0, x1); if (b - a < 12) return;
    const nn = Math.max(2, Math.round(n * (b - a) / (x1 - x0) * 1.6 * cF()));
    swarm(st, key, 26, t, 0.22 * sF()).slice(0, Math.min(26, nn)).forEach(q => { const x = a + 6 + q.u * (b - a - 12), y = y0 + 6 + q.v * (hh - 12); dot(ctx, x, y, 4.8, col); txt(ctx, sg, x, y + 0.5, C.bg, 8.5, 'center', 800); });
  };
  amb('sp', Math.max(o.u0, 0), g.pe, C.c4, '+', 20); amb('sn', g.ne, Math.min(o.u1, g.len), C.c2, '−', 20);
  // hạt dòng
  if (o.fl) {
    const ym = (q) => o.lanes ? (q.k === 'e' ? y0 + (0.08 + 0.38 * q.v) * hh : y0 + (0.54 + 0.38 * q.v) * hh) : y0 + (0.08 + 0.84 * q.v) * hh;
    o.fl.a.forEach(q => {
      if (q.u < o.u0 || q.u > o.u1) return;
      const x = MX(q.u), y = ym(q), mn = isMinor(q, g);
      trail(ctx, q.tr.concat([[q.u, q.v, q.w]]).map(a => [MX(a[0]), ym({ k: q.k, v: a[1] })]), q.k === 'e' ? C.c2 : C.c4);
      if (mn) { ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU2); ctx.strokeStyle = C.main; ctx.lineWidth = 1.5; ctx.stroke(); }
      dot(ctx, x, y, 5, q.k === 'e' ? C.c2 : C.c4); txt(ctx, q.k === 'e' ? '−' : '+', x, y + 0.5, C.bg, 9, 'center', 800);
      if (q === o.fl.trk) {
        ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.main; ctx.beginPath(); ctx.arc(x, y, 19 * (1 + 0.18 * Math.sin(t * 5)), 0, TAU2); ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.stroke();
      }
    });
    o.fl.fl.forEach(f => {
      if (f.u < o.u0 || f.u > o.u1) return;
      const a = clamp((t - f.t0) / 0.55, 0, 1), y = o.lanes ? y0 + 0.5 * hh : y0 + (0.08 + 0.84 * f.v) * hh;
      ctx.save(); ctx.globalAlpha = 1 - a; ctx.beginPath(); ctx.arc(MX(f.u), y, 6 + a * (f.big ? 24 : 15), 0, TAU2); ctx.strokeStyle = f.big ? C.err : C.main; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    });
  }
  ctx.restore();
  rr(ctx, x0, y0, x1 - x0, hh, 8); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
  return { MX, x0, x1, y0, y1 };
}
function stripMark(ctx, s, u, col, label, dash) {
  const x = s.MX(u); if (x < s.x0 || x > s.x1) return;
  ln(ctx, x, s.y0, x, s.y1, col, 1.8, dash === false ? null : [5, 4]);
  txt(ctx, label, x + 3, s.y0 + 9, col, 10, 'left', 800);
}

/* ---- trợ giúp camera phim: lấy tiêu điểm theo vị trí thật (du) hoặc theo hạt theo dõi ---- */
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
const SNAPK = ['mat'];
const ST = (d, cap, zoom, track, extra) => Object.assign({ d, cap, v: V(0, 20, zoom), track, mv: 0.35, slow: 0.7 }, extra || {});
const CH = (d, cap, zoom, track, set) => ST(d, cap, zoom, track, { calm: true, set });   // bước đổi vùng: không hạt bay qua, focus vào vùng đang đổi
const FILM = {
  bias: [
    ST(9, 'Cân bằng (V_a = 0). Ta theo dõi một electron (quầng sáng) từ vùng n: nó tiến tới đập thế nhưng không đủ năng lượng trèo qua nên bật ngược trở lại. Lỗ trống bên p cũng bị giữ chặt như vậy — dòng tổng bằng 0.', 3.6, atU(g => g.jx), { set: { Va: 0, Na: 1e16, Nd: 1e16, T: 300 } }),
    CH(7, 'Chuyển sang phân cực thuận 0,60 V: nhìn vào vùng nghèo — đập hạ thấp xuống và vùng nghèo co hẹp lại.', 3.6, atU(g => g.jx), { Va: 0.6 }),
    ST(14, 'Bây giờ electron được theo dõi vượt qua mối nối: nó đi qua vùng nghèo (điện trường kéo nhanh hơn), sang vùng p trở thành hạt thiểu số (viền vàng), khuếch tán thêm một đoạn rồi tái hợp với một lỗ trống (vòng sáng).', 3.0, atT()),
    CH(8, 'Đảo cực sang phân cực ngược −5 V: vùng nghèo nở rộng ra hai phía và đập dâng cao.', 3.2, atU(g => g.jx), { Va: -5 }),
    ST(10, 'Electron lại bật ngược ngay từ xa, không còn hạt đa số nào qua được; chỉ vài hạt thiểu số bị điện trường cuốn nên dòng cực nhỏ.', 3.0, atU(g => g.jx))
  ],
  edge: [
    ST(8, 'Mép vùng nghèo phía n (x_n): bên phải là đám electron đa số dày đặc. Hạt có quầng sáng là một lỗ trống vừa từ vùng p tràn sang.', 3.0, atU(g => g.ne), { set: { Va: 0.3, Na: 1e16, Nd: 1e16, mat: 'si' } }),
    CH(6, 'Tăng V_a lên 0,45 V: vùng nghèo co hẹp, số lỗ trống thiểu số ở mép tăng lên.', 3.0, atU(g => g.ne), { Va: 0.45 }),
    ST(13, 'Theo dõi lỗ trống này: nó vào vùng n thành hạt thiểu số (viền vàng) giữa đám electron, khuếch tán rồi tái hợp. Cứ +60 mV, số lỗ trống thiểu số ở mép tăng gấp mười.', 2.8, atT()),
    CH(8, 'V_a = 0,60 V: p_n(x_n) ≈ 2,6×10¹⁴ cm⁻³ (khớp Ví dụ 2.1) — mười một đèn bậc ×10 đã sáng, nhưng vẫn nhỏ so với N_d = 10¹⁶.', 3.0, atU(g => g.ne), { Va: 0.6 }),
    CH(9, 'V_a ≈ 0,69 V: p_n(x_n) chạm cỡ N_d, hạt thiểu số ngang hạt đa số — vòng chuyển đỏ báo tiêm mạnh, mô hình đơn giản hết đúng.', 3.0, atU(g => g.ne), { Va: 0.69 })
  ],
  excess: [
    ST(8, 'Lỗ trống tiêm vào vùng n là hạt thiểu số: nó khuếch tán rồi tái hợp. Thước L_p đánh dấu quãng đi trung bình.', 2.5, atU(g => g.ne + g.lp * 0.8), { set: { Va: 0.55, tau: 5e-7 } }),
    ST(14, 'Theo dõi một lỗ trống từ mép: nó đi vòng vèo (khuếch tán) rồi tái hợp (vòng sáng) sau quãng cỡ L_p. Rất nhiều hạt như vậy ⇒ mật độ giảm còn 1/e sau mỗi L_p.', 2.5, atT()),
    CH(8, 'Giảm thời gian sống τ xuống 10 ns: nhìn vào vùng n — thước L_p co ngắn lại.', 2.5, atU(g => g.ne + g.lp * 0.8), { tau: 1e-8 }),
    ST(10, 'Với L_p ngắn, lỗ trống tái hợp ngay sát mép.', 2.8, atT()),
    CH(8, 'Tăng τ lên 5 µs: thước L_p dài ra rất nhiều.', 2.0, atU(g => g.ne + g.lp * 0.8), { tau: 5e-6 }),
    ST(14, 'Hạt sống lâu và đi rất xa mới tái hợp, điện tích tích trữ Q_p lớn hơn nhiều.', 2.0, atT())
  ],
  iv: [
    ST(8, 'Dòng diốt có hai thành phần: electron tiêm sang vùng p và lỗ trống tiêm sang vùng n. Ở V_a = 0,4 V mới chỉ có lác đác vài hạt.', 3.6, atU(g => g.jx), { set: { Va: 0.4, Na: 1e16, Nd: 1e16, tau: 5e-7 } }),
    CH(6, 'Tăng lên 0,60 V: vùng nghèo co hẹp, rào thấp xuống.', 3.6, atU(g => g.jx), { Va: 0.6 }),
    ST(14, 'Theo dõi một electron: nó đi qua vùng nghèo, vào vùng p làm hạt thiểu số rồi tái hợp. Mỗi +60 mV số hạt vượt mối nối tăng khoảng mười lần; I ≈ 48 µA (Ví dụ 3.1).', 3.0, atT()),
    CH(9, 'Muốn dòng gấp 100 lần chỉ cần thêm 119 mV (Ví dụ 3.2): điện áp thuận gần như "đứng yên" quanh 0,6–0,8 V.', 3.6, atU(g => g.jx), { Va: 0.72 })
  ],
  comp: [
    ST(8, 'Ngay sau mép x_n gần như toàn bộ dòng là lỗ trống thiểu số khuếch tán vào vùng n. Các mặt phẳng ghi sẵn phần trăm dòng lỗ trống còn lại.', 1.8, atU(g => g.ne + g.lp * 0.6), { set: { Va: 0.55 } }),
    ST(15, 'Theo dõi một lỗ trống đi sâu vào vùng n: nó tái hợp (vòng sáng) nên dòng J_p(x) tắt dần theo hàm mũ; mỗi lần tái hợp một electron đa số cũng mất đi.', 2.4, atT()),
    ST(11, 'Xa mép, dòng gần như chỉ do electron đa số từ cực n đến bù — tổng dòng J vẫn bằng nhau ở mọi mặt cắt.', 1.6, atU(g => (g.ne + g.len) / 2))
  ],
  short: [
    ST(8, 'Vùng n dài (W_n = 10 L_p): lỗ trống tiêm vào có đủ chỗ để khuếch tán rồi tái hợp dọc đường.', 2.0, atU(g => (g.ne + g.len) / 2), { set: { Va: 0.55, WnL: 1 } }),
    CH(7, 'Rút ngắn vùng n xuống W_n ≈ L_p: nhìn vào phần đuôi thanh — cực kim loại tiến sát lại.', 2.0, atU(g => (g.ne + g.len) / 2), { WnL: 0 }),
    ST(13, 'Theo dõi một lỗ trống: nó đi tới sát cực kim loại mới tái hợp, nhiều hạt chạm cực trước khi kịp tái hợp.', 2.4, atT()),
    CH(7, 'Rút tiếp xuống W_n = 0,1 L_p: vùng n chỉ còn rất ngắn.', 2.4, atU(g => (g.ne + g.len) / 2), { WnL: -1 }),
    ST(13, 'Diốt ngắn: lỗ trống chạy thẳng về cực, tăng tốc khi tới gần và biến mất ở đó. Mật độ dốc đều nên dòng J_p lớn hơn diốt dài cỡ 10 lần.', 2.8, atT())
  ],
  regions: [
    ST(8, 'Vùng 1, V_a = 0,30 V: dòng bị chi phối bởi tái hợp ngay trong vùng nghèo.', 3.6, atU(g => g.jx), { set: { Va: 0.3, rs: 0 } }),
    ST(13, 'Theo dõi một electron: nó đi vào vùng nghèo, gặp lỗ trống ngay giữa mối nối và tái hợp (vòng đỏ) — không xuyên qua được. Dòng tỉ lệ e^(V/2V_t), n ≈ 2.', 3.2, atT()),
    CH(7, 'Tăng lên vùng 2, V_a = 0,55 V: vùng nghèo co hẹp, tái hợp thưa dần, khuếch tán lên ưu thế, hệ số lý tưởng n về 1.', 3.6, atU(g => g.jx), { Va: 0.55 }),
    ST(13, 'Electron được theo dõi giờ xuyên hẳn qua mối nối, vào vùng p rồi mới tái hợp — đây là dòng khuếch tán, I ∝ e^(V/V_t).', 3.0, atT()),
    CH(10, 'Vùng 3, V_a = 0,9 V cùng r_s = 1 kΩ: tiêm quá mạnh, vùng trung hòa nóng đỏ và một phần điện áp rơi vô ích trên r_s, đặc tuyến bị bẻ cong.', 3.0, atU(g => g.jx), { Va: 0.9, rs: 1000 })
  ],
  gen: [
    ST(8, 'Phân cực ngược 5 V: vùng nghèo nở rộng (≈ 1,2 µm), gần như trống hạt tải. Nhưng nhiệt vẫn liên tục sinh ra từng cặp electron–lỗ trống.', 3.3, atU(g => g.jx), { set: { Va: 5, T: 300 } }),
    ST(14, 'Theo dõi một cặp mới sinh: điện trường mạnh cuốn electron (quầng sáng) sang phía n và lỗ trống sang phía p — mỗi cặp góp một phần vào dòng sinh J_gen = e·n_i·W/2τ₀ (Ví dụ 5.1: 2,9×10⁻⁷ A/cm²).', 3.0, atT()),
    CH(9, 'Tăng V_R lên 10 V: nhìn vào vùng nghèo — nó nở rộng thêm, có nhiều chỗ sinh cặp hơn, J_gen ∝ √(V_bi + V_R) tăng.', 3.0, atU(g => g.jx), { Va: 10 }),
    ST(10, 'Nung nóng lên 400 K: n_i tăng vọt nên số cặp sinh ra tăng rất nhiều — dòng rò ngược rất nhạy với nhiệt độ.', 3.0, atU(g => g.jx), { set: { T: 400 } })
  ],
  small: [
    ST(8, 'Diốt đang phân cực thuận tại điểm làm việc DC. Ta chồng thêm một tín hiệu AC nhỏ và theo dõi cách đám hạt thiểu số ở hai bên mối nối đáp ứng.', 2.0, atU(g => g.jx), { set: { Va: 0.68, f: 1e3, rs: 0, tau: 5e-7 } }),
    ST(11, 'Tần số thấp (1 kHz): nhìn về phía vùng p — dòng theo kịp điện áp, hai kim đồng pha; diốt như điện trở nhỏ r_d = V_t/I.', 2.2, atU(g => g.pe - g.ln * 0.4)),
    ST(11, 'Tăng tới f_c ≈ 640 kHz và nhìn về phía vùng n: đám hạt tích trữ (điện dung khuếch tán C_d) không kịp xả nạp, dòng nhỏ đi và trễ pha.', 2.2, atU(g => g.ne + g.lp * 0.4), { set: { f: 6.4e5 } }),
    ST(10, 'Tới 10 MHz: vượt xa f_c, dòng gần như không theo nổi — kim dòng hầu như đứng yên.', 2.0, atU(g => g.jx), { set: { f: 1e7 } })
  ]
};
const NOCAM = new Set();
const THREE = new Set(['bias', 'edge', 'excess', 'iv', 'comp', 'short', 'regions', 'gen', 'small']);

const LABS = [];
const cVa = (min, max, l) => ({ k: 'Va', l: l || 'V_a', min, max, step: 0.01, f: fV });
const cNa = { k: 'Na', l: 'Nₐ', min: 14, max: 18, step: 0.1, log: 1, f: v => pw(v) };
const cNd = { k: 'Nd', l: 'N_d', min: 14, max: 18, step: 0.1, log: 1, f: v => pw(v) };
const cT = { k: 'T', l: 'T', min: 250, max: 400, step: 5, f: v => v.toFixed(0) + ' K' };
const cTau = (k, l) => ({ k: k || 'tau', l: l || 'τ', min: -8, max: -5, step: 0.1, log: 1, f: fT });
const LAY = { cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"' };
const rateOf = P => 1.0 + 2.6 * P.fr;
const fraL = x => clamp((lg(x) - lg(3e-6)) / 2.3, 0, 1);
const coth = x => 1 / Math.tanh(x);

/* ==========================================================================
   1. MỤC 1.3 — BA TRẠNG THÁI PHÂN CỰC: ĐẬP THẾ NĂNG, VÙNG NGHÈO & DÒNG HẠT TẢI
   ========================================================================== */
LABS.push(Object.assign({
  id: 'bias', tag: '1.3', name: 'Ba trạng thái', sec: 1,
  S: { Va: 0, Na: 1e16, Nd: 1e16, T: 300 },
  panels: [
    {
      title: 'Thực tế 3D: Mối nối p-n phóng lớn — tấm "đập" đỏ cao thấp theo rào thế eV(V_bi − V_a), vùng nghèo co giãn',
      area: 'a', anim: true,
      ctrls: [cVa(-5, 0.72), cNa, cNd, cT,
        { btn: 'Cân bằng', fn: p => { p.S.Va = 0; } }, { btn: 'Ngược −5 V', fn: p => { p.S.Va = -5; } }, { btn: 'Thuận +0,60 V', fn: p => { p.S.Va = 0.6; } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), g = geom(P), fwd = S.Va > 0.04, rev = S.Va < -0.04;
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: fwd ? rateOf(P) : 0, fe: P.Jn0 / P.Js, rev: rev ? 0.6 + 0.6 * clamp(-S.Va / 5, 0, 1) : 0 });
        const sc = scene3(p, ctx, W, H, t, P, g, { sign: fwd ? 1 : rev ? -1 : null });
        const wh = sc.bh * (0.2 + 1.3 * clamp(P.Vj / 6.5, 0, 1));
        isoBox(ctx, sc.ox, sc.oy, sc.X(g.jx) - 4, 0, 0, 8, sc.bd, wh, C.err, 0.42, C.err);
        const wt = isoP(sc.ox, sc.oy, sc.X(g.jx), sc.bd / 2, wh + 12);
        txt(ctx, 'rào ' + P.Vj.toFixed(2) + ' eV', wt[0], wt[1], C.err, 10.5, 'center', 800);
        flow3(ctx, sc, fl, g, t);
        gcol(ctx, W, H, [['Rào thế', P.Vj.toFixed(2) + ' eV', clamp(P.Vj / 6.5, 0, 1), C.err], ['Vùng nghèo W', fmtLen(P.W), fraL(P.W), C.c5], ['Dòng I', fmtCur(P.I), clamp((lg(P.I) + 15) / 14, 0, 1), C.main]]);
        chipTop(ctx, W, fwd ? 'PHÂN CỰC THUẬN: rào hạ thấp, hạt đa số tràn qua' : rev ? 'PHÂN CỰC NGƯỢC: rào dâng cao, chỉ còn vài hạt thiểu số bị cuốn' : 'CÂN BẰNG: rào V_bi = ' + P.Vbi.toFixed(2) + ' V giữ hai bên', fwd ? C.c5 : rev ? C.err : C.main);
      }
    },
    {
      title: 'Bên trong: Con đập thế năng — hạt đa số phải nhảy qua đỉnh đập; hạ đập thì dòng tăng, nâng đập thì chỉ còn hạt thiểu số trượt qua',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), st = p.st, fwd = S.Va > 0.04, rev = S.Va < -0.04;
        const base = H - 24, wx = W * 0.5, hMax = H - 56, hw = hMax * (0.16 + 0.8 * clamp(P.Vj / 6.5, 0, 1)), poolH = hMax * 0.34;
        rr(ctx, 10, 8, W - 20, H - 16, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.globalAlpha = 0.14; ctx.fillStyle = C.c4; ctx.fillRect(16, base - poolH, wx - 24, poolH); ctx.fillStyle = C.c2; ctx.fillRect(wx + 8, base - poolH, W - wx - 24, poolH); ctx.globalAlpha = 1;
        ctx.fillStyle = C.g; ctx.fillRect(14, base, W - 28, 8);
        ctx.globalAlpha = 0.5; ctx.fillStyle = C.err; ctx.fillRect(wx - 8, base - hw, 16, hw); ctx.globalAlpha = 1;
        ctx.strokeStyle = C.err; ctx.lineWidth = 1.8; ctx.strokeRect(wx - 8, base - hw, 16, hw);
        swarm(st, 'dh', 14, t, 0.2 * sF()).slice(0, Math.ceil(14 * cF())).forEach(q => { const x = 26 + q.u * (wx - 52), y = base - 8 - q.v * (poolH - 10); dot(ctx, x, y, 4.8, C.c4); txt(ctx, '+', x, y + 0.5, C.bg, 9, 'center', 800); });
        swarm(st, 'de', 14, t, 0.2 * sF()).slice(0, Math.ceil(14 * cF())).forEach(q => { const x = wx + 20 + q.u * (W - wx - 52), y = base - 8 - q.v * (poolH - 10); dot(ctx, x, y, 4.8, C.c2); txt(ctx, '−', x, y + 0.5, C.bg, 9, 'center', 800); });
        // hạt nhảy qua đập
        if (!st.jm) st.jm = []; if (st.ac == null) st.ac = [0, 0, 0];
        const cf = cF(), R = fwd ? rateOf(P) * 0.5 * cf : 0, Rq = rev ? 0.3 * cf : 0, d2 = clamp(dt, 0, 0.06), jf = Math.max(0.15, GS.spd * 2);
        st.ac[0] += R * d2; st.ac[1] += R * d2; st.ac[2] += Rq * d2;
        const jump = (k, x0, x1, dur) => st.jm.push({ k, x0, x1, s: 0, dur, ap: 16 + Math.random() * 14 });
        while (st.ac[0] >= 1) { st.ac[0]--; jump('e', rnd(wx + 30, W - 40), rnd(30, wx - 30), rnd(2.2, 3.0)); }
        while (st.ac[1] >= 1) { st.ac[1]--; jump('h', rnd(30, wx - 30), rnd(wx + 30, W - 40), rnd(2.2, 3.0)); }
        while (st.ac[2] >= 1) { st.ac[2]--; jump('e', rnd(30, wx - 30), rnd(wx + 30, W - 40), rnd(3.2, 4.2)); }
        st.jm = st.jm.filter(j => { j.s += d2 / j.dur * jf; return j.s < 1; });
        st.jm.forEach(j => {
          const pos = s_ => [j.x0 + (j.x1 - j.x0) * s_, base - 14 - 4 * (hw + j.ap) * s_ * (1 - s_)];
          const tp = []; for (let i = 0; i <= 7; i++) tp.push(pos(Math.max(0, j.s - (7 - i) * 0.01)));
          trail(ctx, tp, j.k === 'e' ? C.c2 : C.c4);
          const x = pos(j.s)[0], y = pos(j.s)[1];
          dot(ctx, x, y, 5.2, j.k === 'e' ? C.c2 : C.c4); txt(ctx, j.k === 'e' ? '−' : '+', x, y + 0.5, C.bg, 9, 'center', 800);
        });
        txt(ctx, 'p: lỗ trống', 24, base + 18 > H ? H - 8 : base - poolH - 8, C.c4, 10.5, 'left', 700);
        txt(ctx, 'n: electron', W - 24, base - poolH - 8, C.c2, 10.5, 'right', 700);
        chip(ctx, 'rào eV(V_bi − V_a) = ' + P.Vj.toFixed(2) + ' eV', wx, Math.max(22, base - hw - 14), C.err, 'center');
        txt(ctx, fwd ? '60 mV hạ rào → dòng ×10' : rev ? 'đập cao: chỉ hạt thiểu số trượt qua' : 'hai chiều nhảy cân bằng nhau', wx, H - 12, C.mut, 10.5, 'center', 700);
      }
    }
  ]
}, LAY));

/* ==========================================================================
   2. MỤC 2.4 — HẠT THIỂU SỐ Ở MÉP VÙNG NGHÈO: p_n(x_n) = p_n0·e^{V_a/V_t}
   ========================================================================== */
const minLvl = (x, x0) => clamp((lg(x) - 3) / (lg(x0) - 3), 0, 1);
LABS.push(Object.assign({
  id: 'edge', tag: '2.4', name: 'Hạt thiểu số ở mép', sec: 2,
  S: { Va: 0.3, Na: 1e16, Nd: 1e16, T: 300, mat: 'si' },
  panels: [
    {
      title: 'Thực tế 3D: Mép vùng nghèo — số hạt thiểu số (vòng vàng) leo theo bậc ×10 cho mỗi +60 mV',
      area: 'a', anim: true,
      ctrls: [cVa(0, 0.9), cNa, cNd, cT, { k: 'mat', seg: [['si', 'Si'], ['gaas', 'GaAs']] },
        { btn: 'Mốc 0,60 V', fn: p => { p.S.Va = 0.6; } }, { btn: 'Chạm N_d', fn: p => { const P = phys(p.S); p.S.Va = clamp(+(P.Vt * Math.log(p.S.Nd / P.pn0)).toFixed(2), 0, 0.9); } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), g = geom(P), st = p.st, ex = Math.exp(S.Va / P.Vt);
        const pnx = P.pn0 * ex, npx = P.np0 * ex, fn = minLvl(pnx, S.Nd), fp = minLvl(npx, S.Na), hi = pnx >= 0.5 * S.Nd;
        const sc = scene3(p, ctx, W, H, t, P, g, { sign: S.Va > 0.02 ? 1 : null });
        marker3(ctx, sc, g.ne, C.main, 'x_n'); marker3(ctx, sc, g.pe, C.main, '−x_p');
        flow3(ctx, sc, simFlow(p.st, 'fl', t, dt, g, { R: 0, fe: 0.5 }), g, t);
        const ring = (q, col) => { ctx.beginPath(); ctx.arc(q[0], q[1], 7.5 * Math.pow(CAM ? CAM.zoom : 1, 0.6), 0, TAU2); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke(); };
        swarm(st, 'mh', 20, t, 0.3 * sF()).slice(0, Math.round(fn * 20)).forEach(q => ring(p3(ctx, sc.ox, sc.oy, sc.X(g.ne) + 4 + q.u * sc.X(0.13), 6 + q.v * (sc.bd - 12), 5 + q.w * (sc.bh - 10), 4.4, C.c4, '+'), hi ? C.err : C.main));
        swarm(st, 'me', 20, t, 0.3 * sF()).slice(0, Math.round(fp * 20)).forEach(q => ring(p3(ctx, sc.ox, sc.oy, sc.X(g.pe) - 4 - q.u * sc.X(0.13), 6 + q.v * (sc.bd - 12), 5 + q.w * (sc.bh - 10), 4.4, C.c2, '−'), hi ? C.err : C.main));
        const dec = clamp(Math.floor(Math.log10(ex)), 0, 12), pct = pnx / S.Nd * 100;
        gcol(ctx, W, H, [['p_n(x_n)', sci(pnx, 1), clamp((lg(pnx) - 3) / 13, 0, 1), C.c4], ['p_n / N_d', pct >= 0.1 ? pct.toFixed(1) + '%' : sci(pnx / S.Nd, 1), fn, C.c2, 0.92]], [H * 0.15, H * 0.87]);
        const lx = W - 64, ly = H * 0.5 - 70;
        ctx.save(); ctx.globalAlpha = 0.88; ctx.fillStyle = C.bg; rr(ctx, lx - 54, ly - 20, 108, 168, 8); ctx.fill(); ctx.restore();
        txt(ctx, 'Bậc ×10 so với p_n0', lx, ly - 9, C.mut, 9.5, 'center', 700);
        for (let i = 0; i < 12; i++) { const on = i < dec; rr(ctx, lx - 17, ly + 118 - i * 11, 34, 9, 3); ctx.fillStyle = on ? (i >= 10 ? C.err : C.main) : C.g; ctx.globalAlpha = on ? 0.95 : 0.55; ctx.fill(); ctx.globalAlpha = 1; }
        txt(ctx, '×' + sci(ex, 1), lx, ly + 138, C.main, 10.5, 'center', 800);
        chipTop(ctx, W, hi ? 'TIÊM MẠNH: p_n(x_n) đã chạm cỡ N_d — hạt thiểu số ngang hạt đa số!' : 'Mép vùng nghèo: p_n(x_n) = ' + sci(pnx, 1) + ' cm⁻³ (số hạt vẽ theo thang log)', hi ? C.err : C.main);
      }
    },
    {
      title: 'Bên trong: Kính hiển vi tại mép x_n — đám electron đa số dày đặc, hạt thiểu số (vòng vàng) tăng bậc theo V_a',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), g = geom(P), ex = Math.exp(S.Va / P.Vt), pnx = P.pn0 * ex, fn = minLvl(pnx, S.Nd);
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: 0, fe: 0.5 });
        const s = strip(ctx, W, H, t, P, g, { st: p.st, u0: g.ne - 0.12, u1: g.ne + 0.30, y0: 12, y1: H - 12, fl });
        stripMark(ctx, s, g.ne, C.main, 'x_n');
        const hh = s.y1 - s.y0;
        swarm(p.st, 'mi', 22, t, 0.35 * sF()).slice(0, Math.round(fn * 22)).forEach(q => {
          const x = s.MX(g.ne + 0.006 + q.u * 0.13), y = s.y0 + 8 + q.v * (hh - 16);
          ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU2); ctx.strokeStyle = pnx >= 0.5 * S.Nd ? C.err : C.main; ctx.lineWidth = 1.5; ctx.stroke();
          dot(ctx, x, y, 5, C.c4); txt(ctx, '+', x, y + 0.5, C.bg, 9, 'center', 800);
        });
        chip(ctx, 'e^(V_a/V_t) = ' + sci(ex, 1) + '  ·  +60 mV ⇒ ×10', W * 0.5, s.y1 - 14, C.main, 'center');
      }
    }
  ]
}, LAY));

/* ==========================================================================
   3. MỤC 2.6 — HẠT THIỂU SỐ DƯ TRONG VÙNG TRUNG HÒA: ĐUÔI e^{−x/L}
   ========================================================================== */
LABS.push(Object.assign({
  id: 'excess', tag: '2.6', name: 'Phân bố hạt dư', sec: 2,
  S: { Va: 0.55, tau: 5e-7, Na: 1e16, Nd: 1e16 },
  panels: [
    {
      title: 'Thực tế 3D: Lỗ trống phun từ mép vào vùng n rồi tái hợp — mật độ hạt giảm 1/e sau mỗi quãng L_p',
      area: 'a', anim: true,
      ctrls: [cVa(0.1, 0.75), cTau('tau', 'τ (→ L_p, L_n)'), cNa, cNd],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), g = geom(P), on = S.Va > 0.05;
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: on ? rateOf(P) : 0, fe: P.Jn0 / P.Js });
        const sc = scene3(p, ctx, W, H, t, P, g, { sign: 1 });
        marker3(ctx, sc, g.ne, C.main, 'x_n'); marker3(ctx, sc, g.ne + g.lp, C.c4, 'L_p'); marker3(ctx, sc, g.pe - g.ln, C.c2, 'L_n');
        flow3(ctx, sc, fl, g, t);
        const dp = P.pn0 * (P.ev - 1), Qp = E_CHG * P.Lp * dp;
        gcol(ctx, W, H, [['δp_n(x_n)', sci(dp, 1), clamp((lg(dp) - 3) / 13, 0, 1), C.c4], ['Điện tích tích trữ Q_p', sci(Qp, 1) + ' C/cm²', clamp((lg(Qp) + 12) / 8, 0, 1), C.main], ['Quãng L_p', fmtLen(P.Lp), clamp(Math.log10(P.Lp / 3e-4) / 1.5, 0, 1), C.c5]]);
        chipTop(ctx, W, 'L_p = ' + fmtLen(P.Lp) + ' · L_n = ' + fmtLen(P.Ln) + ' — cứ qua một L_p, số hạt còn lại ≈ 37%', C.main);
      }
    },
    {
      title: 'Bên trong: Vùng n trung hòa phóng lớn — thước đánh dấu L_p, 2L_p, 3L_p; hạt thưa dần theo hàm mũ',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), g = geom(P), on = S.Va > 0.05;
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: on ? rateOf(P) : 0, fe: P.Jn0 / P.Js });
        const s = strip(ctx, W, H, t, P, g, { st: p.st, u0: g.ne - 0.03, u1: g.len, y0: 12, y1: H - 30, fl });
        stripMark(ctx, s, g.ne, C.main, 'x_n', false);
        [1, 2, 3].forEach(k => stripMark(ctx, s, g.ne + k * g.lp, k === 1 ? C.c4 : C.mut, k === 1 ? 'L_p (còn 37%)' : k + 'L_p'));
        const nIn = fl.a.filter(q => q.k === 'h' && q.u > g.ne).length;
        txt(ctx, 'Lỗ trống thiểu số đang có mặt: ' + nIn + ' hạt', s.x0 + 6, H - 14, C.mut, 10.5, 'left', 700);
      }
    }
  ]
}, LAY));

/* ==========================================================================
   4. MỤC 3.4 — DIỐT LÝ TƯỞNG: I = I_s(e^{V_a/V_t} − 1), HAI LÀN DÒNG LỖ TRỐNG & ELECTRON
   ========================================================================== */
LABS.push(Object.assign({
  id: 'iv', tag: '3.4', name: 'Diốt lý tưởng', sec: 3,
  S: { Va: 0.6, Na: 1e16, Nd: 1e16, Dn: 25, Dp: 10, tau: 5e-7, A: 1e-4, T: 300 },
  panels: [
    {
      title: 'Thực tế 3D: Diốt khuếch tán — dòng hạt qua mối nối tăng ×10 cho mỗi +60 mV; I_s quyết định "độ rò gốc"',
      area: 'a', anim: true,
      ctrls: [cVa(0, 0.8), cNa, cNd, { k: 'Dn', l: 'D_n', min: 5, max: 50, step: 1, f: v => v.toFixed(0) + ' cm²/s' }, { k: 'Dp', l: 'D_p', min: 2, max: 30, step: 1, f: v => v.toFixed(0) + ' cm²/s' },
        cTau(), { k: 'A', l: 'Tiết diện A', min: -5, max: -2, step: 0.1, log: 1, f: v => pw(v) + ' cm²' }, cT,
        { btn: 'I = 1 mA', fn: p => { const P = phys(p.S); p.S.Va = clamp(+(P.Vt * Math.log(1e-3 / P.Is + 1)).toFixed(3), 0, 0.8); } },
        { btn: '×100 dòng (+119 mV)', fn: p => { const P = phys(p.S); p.S.Va = clamp(+(p.S.Va + P.Vt * Math.log(100)).toFixed(3), 0, 0.8); } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), g = geom(P);
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: S.Va > 0.05 ? rateOf(P) : 0, fe: P.Jn0 / P.Js });
        const sc = scene3(p, ctx, W, H, t, P, g, { sign: 1 });
        flow3(ctx, sc, fl, g, t);
        gcol(ctx, W, H, [['Dòng I', fmtCur(P.I), clamp((lg(P.I) + 15) / 14, 0, 1), C.main], ['Dòng bão hòa I_s', fmtCur(P.Is), clamp((lg(P.Is) + 22) / 14, 0, 1), C.c5], ['Phần lỗ trống J_p/J', (100 * P.Jp0 / P.Js).toFixed(0) + '%', P.Jp0 / P.Js, C.c4]]);
        chipTop(ctx, W, 'I = ' + fmtCur(P.I) + ' tại V_a = ' + S.Va.toFixed(3) + ' V  (I_s = ' + fmtCur(P.Is) + ')', C.main);
      }
    },
    {
      title: 'Bên trong: Phóng lớn mối nối — làn trên là electron tiêm sang p, làn dưới là lỗ trống tiêm sang n; tỉ lệ hạt = tỉ lệ J_n : J_p',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), g = geom(P);
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: S.Va > 0.05 ? rateOf(P) : 0, fe: P.Jn0 / P.Js });
        const s = strip(ctx, W, H, t, P, g, { st: p.st, u0: g.pe - 0.2, u1: g.ne + 0.2, y0: 12, y1: H - 12, fl, lanes: true });
        ln(ctx, s.x0, (s.y0 + s.y1) / 2, s.x1, (s.y0 + s.y1) / 2, C.g, 1, [3, 4]);
        txt(ctx, 'làn electron → p  (J_n = ' + fJ(P.Jn0 * (P.ev - 1)) + ')', s.x0 + 8, s.y0 + 11, C.c2, 10.5, 'left', 800);
        txt(ctx, 'làn lỗ trống → n  (J_p = ' + fJ(P.Jp0 * (P.ev - 1)) + ')', s.x0 + 8, s.y1 - 11, C.c4, 10.5, 'left', 800);
      }
    }
  ]
}, LAY));

/* ==========================================================================
   5. MỤC 4.2 — CÁC THÀNH PHẦN DÒNG DỌC DIỐT: J_p(x) tắt dần, J_n(đa số) bù lại, tổng không đổi
   ========================================================================== */
const shareLbl = (P, g, side, k) => {
  const fe = P.Jn0 / P.Js, fh = 1 - fe;
  if (side > 0) { const d = k * g.lp, jp = fh * Math.exp(-d / g.lp); return [g.ne + d, 'J_p ' + (100 * jp).toFixed(0) + '% · J_n ' + (100 * (1 - jp)).toFixed(0) + '%']; }
  const d = k * g.ln, jn = fe * Math.exp(-d / g.ln); return [g.pe - d, 'J_n ' + (100 * jn).toFixed(0) + '% · J_p ' + (100 * (1 - jn)).toFixed(0) + '%'];
};
LABS.push(Object.assign({
  id: 'comp', tag: '4.2', name: 'Thành phần dòng', sec: 4,
  S: { Va: 0.55, tau: 5e-7, Na: 1e16, Nd: 1e16 },
  panels: [
    {
      title: 'Thực tế 3D: Lỗ trống tiêm vào vùng n tái hợp dần, electron đa số từ cực n đến bù — tổng dòng tại mọi mặt cắt vẫn bằng nhau',
      area: 'a', anim: true,
      ctrls: [cVa(0.1, 0.75), cTau('tau', 'τ (→ L_p, L_n)'), cNa, cNd],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), g = geom(P);
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: S.Va > 0.05 ? rateOf(P) : 0, fe: P.Jn0 / P.Js });
        const sc = scene3(p, ctx, W, H, t, P, g, { sign: 1 });
        [0.5, 1.5, 3].forEach(k => { const r = shareLbl(P, g, 1, k); if (r[0] < g.len - 0.03) marker3(ctx, sc, r[0], C.c4, (100 * (1 - P.Jn0 / P.Js) * Math.exp(-k)).toFixed(0) + '%', 12 + (k > 1 ? 0 : 0)); });
        [0.5, 1.5].forEach(k => { const r = shareLbl(P, g, -1, k); if (r[0] > 0.03) marker3(ctx, sc, r[0], C.c2, (100 * (P.Jn0 / P.Js) * Math.exp(-k)).toFixed(0) + '%', 12); });
        flow3(ctx, sc, fl, g, t);
        gcol(ctx, W, H, [['Tổng dòng J', fJ(P.J), clamp((lg(P.J) + 11) / 12, 0, 1), C.main], ['J_p tại mép x_n', (100 * P.Jp0 / P.Js).toFixed(0) + '% J', P.Jp0 / P.Js, C.c4], ['J_n tại mép x_n', (100 * P.Jn0 / P.Js).toFixed(0) + '% J', P.Jn0 / P.Js, C.c2]]);
        chipTop(ctx, W, 'Số % trên mặt phẳng: phần dòng do hạt thiểu số đảm nhận · phần còn lại là hạt đa số', C.main);
      }
    },
    {
      title: 'Bên trong: Toàn thân diốt — mỗi lỗ trống tái hợp (vòng sáng) làm một electron đa số biến mất; tổng dòng vẫn không đổi',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), g = geom(P);
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: S.Va > 0.05 ? rateOf(P) : 0, fe: P.Jn0 / P.Js });
        const s = strip(ctx, W, H, t, P, g, { st: p.st, u0: 0, u1: g.len, y0: 12, y1: H - 40, fl });
        [[1, 0.5], [1, 1.5], [1, 3], [-1, 0.5], [-1, 1.5], [-1, 3]].forEach((q, i) => {
          const r = shareLbl(P, g, q[0], q[1]); if (r[0] < 0.02 || r[0] > g.len - 0.02) return;
          stripMark(ctx, s, r[0], q[0] > 0 ? C.c4 : C.c2, '');
          txt(ctx, r[1], s.MX(r[0]), s.y1 + 13 + (i % 2) * 14, q[0] > 0 ? C.c4 : C.c2, 9.5, 'center', 700);
        });
        txt(ctx, 'J = J_p + J_n = hằng số tại mọi x', W * 0.5, H - 6, C.main, 10.5, 'center', 800);
      }
    }
  ]
}, LAY));

/* ==========================================================================
   6. MỤC 4.5 — DIỐT DÀI VÀ DIỐT NGẮN: HẠT CHẠY THẲNG TỚI CỰC KHI W_n ≪ L_p
   ========================================================================== */
LABS.push(Object.assign({
  id: 'short', tag: '4.5', name: 'Diốt dài / ngắn', sec: 4,
  S: { Va: 0.55, WnL: 0.5, Na: 1e16, Nd: 1e16 },
  panels: [
    {
      title: 'Thực tế 3D: Rút ngắn vùng n — hạt tiêm chạy thẳng tới cực kim loại (tăng tốc dần) thay vì tái hợp dọc đường',
      area: 'a', anim: true,
      ctrls: [cVa(0.1, 0.75), { k: 'WnL', l: 'W_n / L_p', min: -1, max: 1, step: 0.05, f: v => Math.pow(10, v).toFixed(2) + ' L_p' }, cNa, cNd,
        { btn: 'Ngắn 0,1 L_p', fn: p => { p.S.WnL = -1; } }, { btn: 'Dài 10 L_p', fn: p => { p.S.WnL = 1; } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), x = Math.pow(10, S.WnL), ratio = coth(x);
        const g = geom(P, { lp: 0.12, len: (pe, ne, lp) => ne + lp * Math.pow(x, 0.6) });
        const jeff = P.Jn0 / P.Js + (1 - P.Jn0 / P.Js) * ratio;
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: S.Va > 0.05 ? rateOf(P) * Math.min(2.2, jeff) : 0, fe: (P.Jn0 / P.Js) / jeff, fh: (1 - P.Jn0 / P.Js) * ratio / jeff, shortN: true });
        const sc = scene3(p, ctx, W, H, t, P, g, { sign: 1 });
        marker3(ctx, sc, g.ne + 0.12, C.c4, 'L_p'); marker3(ctx, sc, g.len, C.main, 'W_n', 20);
        flow3(ctx, sc, fl, g, t);
        gcol(ctx, W, H, [['J_p ngắn / J_p dài', ratio.toFixed(2) + '×', clamp(Math.log10(ratio) / 1.05, 0, 1), C.err, 0.95], ['W_n / L_p', x.toFixed(2), (S.WnL + 1) / 2, C.c5], ['Dòng I', fmtCur(P.A * P.Js * jeff * (P.ev - 1)), clamp((lg(P.A * P.Js * jeff * (P.ev - 1)) + 15) / 14, 0, 1), C.main]]);
        chipTop(ctx, W, x < 1 ? 'DIỐT NGẮN: hạt không kịp tái hợp, gradient mật độ dốc đều → dòng lớn hơn ' + ratio.toFixed(1) + '×' : 'DIỐT DÀI: hạt tái hợp dọc đường, dòng chỉ phụ thuộc L_p', x < 1 ? C.err : C.c5);
      }
    },
    {
      title: 'Bên trong: So sánh hai vùng n cạnh nhau — trên: diốt dài (hạt tắt dần), dưới: diốt ngắn đang chọn (hạt dồn thẳng về cực)',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(S), x = Math.pow(10, S.WnL), ratio = coth(x), on = S.Va > 0.05;
        const gL = geom(P, { lp: 0.12, len: (pe, ne) => ne + 0.5 }), gS = geom(P, { lp: 0.12, len: (pe, ne, lp) => ne + lp * Math.pow(x, 0.6) });
        const R = on ? rateOf(P) : 0, fe = P.Jn0 / P.Js;
        const f1 = simFlow(p.st, 'fa', t, dt, gL, { R, fe }), f2 = simFlow(p.st, 'fb', t, dt, gS, { R, fe, shortN: true });
        const h2 = (H - 36) / 2;
        const s1 = strip(ctx, W, H, t, P, gL, { st: p.st, u0: gL.ne - 0.02, u1: gL.ne + 0.5, y0: 10, y1: 10 + h2, fl: f1 });
        const s2 = strip(ctx, W, H, t, P, gS, { st: p.st2 || (p.st2 = {}), u0: gS.ne - 0.02, u1: gS.ne + 0.5, y0: 10 + h2 + 16, y1: H - 10, fl: f2 });
        const xm = s2.MX(gS.len); ctx.fillStyle = C.sub; ctx.fillRect(xm, s2.y0, Math.max(0, s2.x1 - xm), s2.y1 - s2.y0);
        if (xm < s2.x1 - 20) txt(ctx, 'cực kim loại', (xm + s2.x1) / 2, (s2.y0 + s2.y1) / 2, C.bg, 11, 'center', 800);
        txt(ctx, 'DÀI (W_n ≫ L_p): hạt tắt dần e^(−x/L_p)', s1.x0 + 8, s1.y0 + 11, C.c5, 10.5, 'left', 800);
        txt(ctx, 'NGẮN (W_n = ' + x.toFixed(2) + ' L_p): chạy thẳng tới cực', s2.x0 + 8, s2.y0 + 11, C.err, 10.5, 'left', 800);
      }
    }
  ]
}, LAY));

/* ==========================================================================
   7. MỤC 5.6 — BA VÙNG ĐẶC TUYẾN THUẬN: tái hợp n≈2 · khuếch tán n≈1 · tiêm mạnh + r_s
   ========================================================================== */
LABS.push(Object.assign({
  id: 'regions', tag: '5.6', name: 'Ba vùng thuận', sec: 5,
  S: { Va: 0.5, rs: 0, tau: 5e-7, Na: 1e16, Nd: 1e16 },
  panels: [
    {
      title: 'Thực tế 3D: Tăng điện áp thuận — hạt tái hợp ngay trong vùng nghèo (vòng đỏ), rồi khuếch tán, rồi tiêm mạnh làm nóng điện trở nối tiếp',
      area: 'a', anim: true,
      ctrls: [{ k: 'Va', l: 'V_ap (đặt vào)', min: 0.1, max: 1.2, step: 0.01, f: v => v.toFixed(2) + ' V' }, { k: 'rs', l: 'r_s', min: 0, max: 2000, step: 10, f: v => v.toFixed(0) + ' Ω' }, cTau('tau', 'τ₀'), cNa, cNd,
        { btn: 'Vùng 1 · 0,30 V', fn: p => { p.S.Va = 0.3; } }, { btn: 'Vùng 2 · 0,55 V', fn: p => { p.S.Va = 0.55; } }, { btn: 'Vùng 3 · 0,90 V', fn: p => { p.S.Va = 0.9; } }],
      draw(p, ctx, W, H, t, dt) {
        const R3 = regCalc(p.S), P = R3.P, g = geom(P), S = p.S;
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: 1.0 + 2.6 * R3.fr, fe: P.Jn0 / P.Js, fX: R3.fX });
        const sc = scene3(p, ctx, W, H, t, P, g, { sign: 1, heat: R3.heat });
        flow3(ctx, sc, fl, g, t);
        gcol(ctx, W, H, [['Hệ số lý tưởng n', R3.n.toFixed(2), clamp((R3.n - 0.9) / 1.3, 0, 1), R3.n > 2.05 ? C.err : C.c5, 0.99], ['Sụt áp I·r_s', (R3.I * S.rs).toFixed(2) + ' V', clamp(R3.I * S.rs / 0.8, 0, 1), C.err, 0.5], ['Dòng I', fmtCur(R3.I), clamp((lg(R3.I) + 15) / 14, 0, 1), C.main]]);
        chipTop(ctx, W, R3.label, R3.col);
      }
    },
    {
      title: 'Bên trong: Phóng lớn vùng nghèo — vòng đỏ là cặp electron–lỗ trống tái hợp ngay giữa mối nối (không xuyên qua được)',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const R3 = regCalc(p.S), P = R3.P, g = geom(P);
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: 1.0 + 2.6 * R3.fr, fe: P.Jn0 / P.Js, fX: R3.fX });
        const s = strip(ctx, W, H, t, P, g, { st: p.st, u0: g.pe - 0.14, u1: g.ne + 0.14, y0: 12, y1: H - 12, fl, heat: R3.heat });
        const nx = fl.fl.filter(f => f.big).length;
        chip(ctx, 'tái hợp: J_rec = ' + fJ(R3.Ir / P.A) + ' · khuếch tán: J_diff = ' + fJ(R3.Id / P.A), W * 0.5, s.y1 - 14, C.mut, 'center');
        if (nx) txt(ctx, '●'.repeat(Math.min(nx, 12)), s.x1 - 8, s.y0 + 11, C.err, 10, 'right', 800);
      }
    }
  ]
}, LAY));
function regCalc(S) {
  const vj = solveVj(S), ct = curTot(S, vj), P = ct.P, I = ct.I;
  const Iat = v => curTot(S, solveVj(Object.assign({}, S, { Va: v }))).I;
  const n = 0.02 / (P.Vt * Math.log(Iat(S.Va + 0.01) / Iat(S.Va - 0.01)));
  const drop = I * (S.rs || 0);
  let label, col;
  if (ct.Ir > ct.Id) { label = 'VÙNG 1 — TÁI HỢP trong vùng nghèo chiếm ưu thế: n ≈ 2 (I ∝ e^(V/2V_t))'; col = C.err; }
  else if (vj < P.Vk - 0.03 && drop < 0.1) { label = 'VÙNG 2 — KHUẾCH TÁN chiếm ưu thế: n ≈ 1 (I ∝ e^(V/V_t))'; col = C.c5; }
  else { label = 'VÙNG 3 — TIÊM MẠNH + r_s: dòng bị bẻ cong (n → 2, sụt áp trên điện trở nối tiếp)'; col = C.main; }
  return { P, Id: ct.Id, Ir: ct.Ir, I, n, fr: clamp(Math.log10(1 + I / P.Is) / 12, 0, 1), fX: clamp(ct.Ir / I, 0, 0.95), heat: clamp(drop / 0.6, 0, 1), label, col, vj };
}

/* ==========================================================================
   8. MỤC 5.7 — DÒNG SINH NHIỆT KHI PHÂN CỰC NGƯỢC: J_gen = e·n_i·W / 2τ₀
   ========================================================================== */
LABS.push(Object.assign({
  id: 'gen', tag: '5.7', name: 'Dòng sinh ngược', sec: 5,
  S: { Va: 5, tau: 5e-7, T: 300, Na: 1e16, Nd: 1e16 },
  panels: [
    {
      title: 'Thực tế 3D: Phân cực ngược — nhiệt sinh cặp electron–lỗ trống ngay trong vùng nghèo, điện trường cuốn hai hạt về hai phía',
      area: 'a', anim: true,
      ctrls: [{ k: 'Va', l: 'V_R', min: 0, max: 10, step: 0.1, f: v => v.toFixed(1) + ' V' }, cTau('tau', 'τ₀'), cT, cNa, cNd,
        { btn: 'V_R = 5 V', fn: p => { p.S.Va = 5; } }, { btn: 'Nóng 400 K', fn: p => { p.S.T = 400; } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(Object.assign({}, S, { Va: -S.Va, tau0: S.tau })), g = geom(P), JR = P.Js + P.Jg0;
        const fl = simFlow(p.st, 'fl', t, dt, g, { gen: 0.5 + 4 * clamp((lg(P.Jg0) + 9) / 5, 0, 1), rev: 0.3 + 0.5 * clamp((lg(P.Js) + 13) / 4, 0, 1), fast: 1.3 + 1.5 * clamp(S.Va / 10, 0, 1) });
        const sc = scene3(p, ctx, W, H, t, P, g, { sign: -1 });
        flow3(ctx, sc, fl, g, t);
        gcol(ctx, W, H, [['J_sinh (J_gen)', sci(P.Jg0, 1), clamp((lg(P.Jg0) + 12) / 8, 0, 1), C.err], ['J_R = J_s + J_gen', sci(JR, 1), clamp((lg(JR) + 12) / 8, 0, 1), C.main], ['Vùng nghèo W', fmtLen(P.W), fraL(P.W), C.c5]]);
        chipTop(ctx, W, 'V_R = ' + S.Va.toFixed(1) + ' V → W = ' + fmtLen(P.W) + ' · J_gen/J_s = ' + sci(P.Jg0 / P.Js, 1), C.main);
      }
    },
    {
      title: 'Bên trong: Phóng lớn vùng nghèo — mỗi chớp sáng là một cặp mới sinh ra, bị điện trường cuốn tách đôi nhanh hơn khi V_R lớn',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, P = phys(Object.assign({}, S, { Va: -S.Va, tau0: S.tau })), g = geom(P);
        const fl = simFlow(p.st, 'fl', t, dt, g, { gen: 0.5 + 4 * clamp((lg(P.Jg0) + 9) / 5, 0, 1), rev: 0.3 + 0.5 * clamp((lg(P.Js) + 13) / 4, 0, 1), fast: 1.3 + 1.5 * clamp(S.Va / 10, 0, 1) });
        const s = strip(ctx, W, H, t, P, g, { st: p.st, u0: g.pe - 0.12, u1: g.ne + 0.12, y0: 12, y1: H - 12, fl });
        const aw = 20 + 40 * clamp(S.Va / 10, 0, 1), xm = (s.MX(g.pe) + s.MX(g.ne)) / 2;
        [0.3, 0.7].forEach(k => { const y = s.y0 + (s.y1 - s.y0) * k; ctx.save(); ctx.globalAlpha = 0.55; arr(ctx, xm + aw, y, xm - aw, y, C.main, 2.6); ctx.restore(); });
        chip(ctx, 'điện trường E (mạnh dần theo V_R)', xm, s.y1 - 14, C.main, 'center');
      }
    }
  ]
}, LAY));

/* ==========================================================================
   9. MỤC 6.6 — MÔ HÌNH TÍN HIỆU NHỎ: r_d = V_t/I, C_d = Iτ/2V_t, f_c = 1/(πτ)
   ========================================================================== */
const smCalc = S => {
  const P = phys(S), I = Math.max(P.I, 1e-18), rd = P.Vt / I, Cd = I * P.tau / (2 * P.Vt), fc = 1 / (TAU2 * rd * Cd), r = S.f / fc;
  return { P, I, rd, Cd, fc, r, a: 1 / Math.sqrt(1 + r * r), ph: Math.atan(r) };
};
LABS.push(Object.assign({
  id: 'small', tag: '6.6', name: 'Tín hiệu nhỏ', sec: 6,
  S: { Va: 0.6, tau: 5e-7, f: 1e5, rs: 0, Na: 1e16, Nd: 1e16 },
  panels: [
    {
      title: 'Thực tế 3D: Chồng tín hiệu AC nhỏ lên điểm làm việc — đám hạt tích trữ "thở" theo nhịp; trên f_c nó không theo kịp',
      area: 'a', anim: true,
      ctrls: [cVa(0.3, 0.75, 'V_a (DC)'), { k: 'f', l: 'Tần số f', min: 3, max: 9, step: 0.1, log: 1, f: fmtFreq }, cTau('tau', 'τ'), { k: 'rs', l: 'r_s', min: 0, max: 1000, step: 10, f: v => v.toFixed(0) + ' Ω' }, cNa, cNd,
        { btn: 'I = 1 mA (Ví dụ 6.1)', fn: p => { const P = phys(p.S); p.S.Va = clamp(+(P.Vt * Math.log(1e-3 / P.Is + 1)).toFixed(3), 0.3, 0.75); } }],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, m = smCalc(S), P = m.P, g = geom(P), w = TAU2 * 0.45;
        const R = (1.0 + 2.6 * P.fr) * clamp(1 + 0.7 * m.a * Math.sin(w * t - m.ph), 0.1, 2);
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: S.Va > 0.05 ? R : 0, fe: P.Jn0 / P.Js });
        const sc = scene3(p, ctx, W, H, t, P, g, { sign: 1 });
        flow3(ctx, sc, fl, g, t);
        gcol(ctx, W, H, [['r_d = V_t / I', fRes(m.rd), clamp(lg(m.rd) / 6, 0, 1), C.c5], ['C_d khuếch tán', fCap(m.Cd), clamp((lg(m.Cd) + 12) / 6, 0, 1), C.c2], ['f / f_c', (m.r >= 100 ? m.r.toFixed(0) : m.r.toFixed(2)), clamp((lg(m.r) + 3) / 6, 0, 1), C.err, 0.5]]);
        chipTop(ctx, W, 'I_DQ = ' + fmtCur(m.I) + ' · r_d = ' + fRes(m.rd) + ' · C_d = ' + fCap(m.Cd) + ' · f_c = ' + fmtFreq(m.fc), C.main);
      }
    },
    {
      title: 'Bên trong: Hai kim đo — kim điện áp v và kim dòng i; dưới f_c hai kim đồng pha, trên f_c kim dòng nhỏ dần và trễ pha',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, m = smCalc(S), P = m.P, g = geom(P), w = TAU2 * 0.45;
        const R = (1.0 + 2.6 * P.fr) * clamp(1 + 0.7 * m.a * Math.sin(w * t - m.ph), 0.1, 2);
        const fl = simFlow(p.st, 'fl', t, dt, g, { R: S.Va > 0.05 ? R : 0, fe: P.Jn0 / P.Js });
        const s = strip(ctx, W, H, t, P, g, { st: p.st, u0: 0, u1: g.len, y0: 12, y1: H - 12, fl, rt: 130 });
        const gx = W - 64, vs = Math.sin(w * t), is = m.a * Math.sin(w * t - m.ph);
        drawMiniGauge(ctx, gx, H * 0.30, 23, 'v tín hiệu', (vs >= 0 ? '+' : '−') + Math.abs(vs * 10).toFixed(0) + ' mV', 0.5 + 0.45 * vs, C.c5);
        drawMiniGauge(ctx, gx, H * 0.74, 23, 'i qua diốt', 'biên ' + (100 * m.a).toFixed(0) + '%', 0.5 + 0.45 * is, C.c2);
        const vapp = S.Va + m.I * (S.rs || 0);
        chip(ctx, 'V_app = V_a + I·r_s = ' + vapp.toFixed(3) + ' V · trễ pha ' + (m.ph * 180 / Math.PI).toFixed(0) + '°', (s.x0 + s.x1) / 2, s.y1 - 14, C.mut, 'center');
      }
    }
  ]
}, LAY));

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM CHO ĐỦ 9 MÔ HÌNH TƯƠNG TÁC BUỔI 9.5
   ========================================================================== */
const LD = {};
const sgn = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);
LD.bias = {
  intro: [
    ['i', 'Mối nối p-n có ba trạng thái: cân bằng (V_a = 0), thuận (V_a > 0) và ngược (V_a < 0). Tấm đập đỏ là rào thế eV(V_bi − V_a).'],
    ['w', 'Thuận: đập hạ thấp, vùng nghèo hẹp lại, hạt đa số tràn qua — dòng tăng theo hàm mũ.'],
    ['w', 'Ngược: đập dâng cao, vùng nghèo nở rộng; chỉ hạt thiểu số bị cuốn qua nên dòng cực nhỏ.'],
    ['v', 'Bấm Cân bằng · Ngược · Thuận, rồi kéo V_a và quan sát đập, vùng nghèo, dòng hạt.']
  ],
  react(S, k, P, say) {
    const p = phys(S);
    say('v', `V_a = ${sgn(S.Va)} V → rào ${p.Vj.toFixed(2)} eV, W = ${fmtLen(p.W)}, I = ${fmtCur(p.I)}.`);
    if (S.Va > 0.04) say('w', 'Hạ rào 60 mV thì dòng khuếch tán tăng khoảng ×10.');
    else if (S.Va < -0.04) say('w', 'Dòng ngược chỉ cỡ I_s: do hạt thiểu số quanh vùng nghèo quyết định, gần như không đổi theo V_R.');
  }
};
LD.edge = {
  intro: [
    ['i', 'Ở mép vùng nghèo, nồng độ hạt thiểu số tăng theo p_n(x_n) = p_n0·e^(V_a/V_t) — hiệu ứng mũ này là gốc của đặc tuyến diốt.'],
    ['w', 'Cứ +60 mV, p_n(x_n) tăng ×10: mỗi đèn trên thang bậc là một nấc. Số hạt vẽ theo thang log để thấy được.'],
    ['w', 'Ví dụ 2.1: N_d = 10¹⁶ cm⁻³, V_a = 0,6 V cho p_n(x_n) ≈ 2,6×10¹⁴ cm⁻³ — bấm nút "Mốc 0,60 V" để kiểm.'],
    ['v', 'Bấm "Chạm N_d" để thấy lúc thiểu số ngang đa số (tiêm mạnh); thử đổi sang GaAs.']
  ],
  react(S, k, P, say) {
    const p = phys(S), pnx = p.pn0 * Math.exp(S.Va / p.Vt);
    say('v', `p_n0 = ${sci(p.pn0, 1)} → p_n(x_n) = ${sci(pnx, 1)} cm⁻³ (×${sci(Math.exp(S.Va / p.Vt), 1)}).`);
    if (pnx >= 0.5 * S.Nd) say('w', 'p_n(x_n) đã cỡ N_d: giả thiết tiêm yếu không còn đúng.');
    if (k === 'mat') say('i', S.mat === 'gaas' ? 'GaAs có n_i rất nhỏ nên p_n0 nhỏ hơn hàng tỉ lần và V_bi lớn hơn.' : 'Trở về Si, n_i = 1,5×10¹⁰ cm⁻³.');
  }
};
LD.excess = {
  intro: [
    ['i', 'Hạt thiểu số tiêm vào vùng trung hòa khuếch tán và tái hợp: δp_n(x) = p_n0(e^(V_a/V_t) − 1)·e^(−(x−x_n)/L_p).'],
    ['w', 'Sau mỗi quãng L_p, mật độ giảm 1/e ≈ 37% — thước L_p, 2L_p, 3L_p đánh dấu điều đó ở khung dưới.'],
    ['w', 'L_p = √(D_p·τ): hạt sống càng lâu thì đi càng xa và điện tích tích trữ Q_p càng lớn.'],
    ['v', 'Kéo τ để đổi L_p, kéo V_a để đổi số hạt tiêm.']
  ],
  react(S, k, P, say) {
    const p = phys(S);
    say('v', `τ = ${fT(S.tau)} → L_p = ${fmtLen(p.Lp)}, L_n = ${fmtLen(p.Ln)}; δp_n(x_n) = ${sci(p.pn0 * (p.ev - 1), 1)} cm⁻³.`);
  }
};
LD.iv = {
  intro: [
    ['i', 'Diốt lý tưởng: I = I_s(e^(V_a/V_t) − 1) với I_s = A·J_s, J_s = e·n_i²(D_p/L_pN_d + D_n/L_nN_a).'],
    ['w', 'Hai làn ở khung dưới: electron tiêm sang p và lỗ trống tiêm sang n, tỉ lệ hạt ≈ tỉ lệ J_n : J_p.'],
    ['w', 'Ví dụ 3.1 (N_a = N_d = 10¹⁶, D_n = 25, D_p = 10, τ = 0,5 µs, A = 10⁻⁴): I_s = 4,16 fA, I(0,6 V) ≈ 48 µA.'],
    ['v', 'Bấm "I = 1 mA" (Ví dụ 3.2: 0,679 V) rồi "×100 dòng": điện áp chỉ tăng 119 mV.']
  ],
  react(S, k, P, say) {
    const p = phys(S);
    say('v', `I_s = ${fmtCur(p.Is)}; V_a = ${S.Va.toFixed(3)} V → I = ${fmtCur(p.I)}; J_p/J = ${(100 * p.Jp0 / p.Js).toFixed(0)}%.`);
  }
};
LD.comp = {
  intro: [
    ['i', 'Dọc diốt, dòng lỗ trống J_p(x) tắt dần theo e^(−x/L_p) vì lỗ trống tái hợp; dòng electron đa số J_n = J − J_p(x) tăng bù lại.'],
    ['w', 'Mỗi vòng sáng (tái hợp) làm cả một lỗ trống và một electron biến mất — electron mới từ cực n đến thay.'],
    ['w', 'Tổng dòng J tại mọi mặt cắt là hằng số, đúng định luật bảo toàn điện tích.'],
    ['v', 'Đổi τ hoặc V_a và đọc phần trăm J_p, J_n ghi ở từng mặt phẳng.']
  ],
  react(S, k, P, say) {
    const p = phys(S), g = geom(p);
    say('v', `J = ${fJ(p.J)}; tại mép x_n: J_p = ${(100 * p.Jp0 / p.Js).toFixed(0)}% J, J_n = ${(100 * p.Jn0 / p.Js).toFixed(0)}% J; sau một L_p: J_p còn ${(100 * p.Jp0 / p.Js / Math.E).toFixed(0)}% J.`);
  }
};
LD.short = {
  intro: [
    ['i', 'Diốt dài (W_n ≫ L_p): hạt thiểu số tái hợp dọc đường, mật độ giảm theo hàm mũ.'],
    ['w', 'Diốt ngắn (W_n ≪ L_p): hạt chưa kịp tái hợp đã tới cực kim loại, mật độ giảm tuyến tính nên gradient lớn hơn.'],
    ['w', 'Tỉ lệ dòng J_p(ngắn)/J_p(dài) = coth(W_n/L_p): ≈ 10 khi W_n = 0,1 L_p, → 1 khi W_n ≫ L_p.'],
    ['v', 'Kéo W_n từ 0,1 L_p đến 10 L_p để thấy hạt chuyển từ "chạy thẳng về cực" sang "tắt dần".']
  ],
  react(S, k, P, say) {
    const x = Math.pow(10, S.WnL);
    say('v', `W_n = ${x.toFixed(2)} L_p → J_p(ngắn)/J_p(dài) = coth(${x.toFixed(2)}) = ${coth(x).toFixed(2)}.`);
  }
};
LD.regions = {
  intro: [
    ['i', 'Đặc tuyến thuận có ba vùng: (1) tái hợp trong vùng nghèo n ≈ 2, (2) khuếch tán n ≈ 1, (3) tiêm mạnh + r_s.'],
    ['w', 'Vòng đỏ là cặp tái hợp ngay trong vùng nghèo: chúng ăn dòng nhưng không xuyên qua mối nối.'],
    ['w', 'Ví dụ 5.2: tái hợp và khuếch tán bằng nhau quanh ≈ 0,39 V. Ví dụ 5.3: tiêm mạnh bắt đầu quanh ≈ 0,695 V (p_n(x_n) = N_d).'],
    ['v', 'Bấm Vùng 1 · 2 · 3, rồi thêm r_s để thấy nóng và rơi áp.']
  ],
  react(S, k, P, say) {
    const R = regCalc(S);
    say('v', `V_ap = ${S.Va.toFixed(2)} V → V_j = ${R.vj.toFixed(3)} V, I = ${fmtCur(R.I)}, n ≈ ${R.n.toFixed(2)}.`);
    say('w', R.label);
    if (S.rs > 0) say('w', `r_s = ${S.rs} Ω làm rơi ${(R.I * S.rs).toFixed(3)} V; V_app = V_j + I·r_s.`);
  }
};
LD.gen = {
  intro: [
    ['i', 'Khi phân cực ngược, vùng nghèo hầu như không có hạt tải nên nhiệt sinh cặp electron–lỗ trống tại đó là nguồn dòng chính.'],
    ['w', 'J_gen = e·n_i·W / 2τ₀ ∝ √(V_bi + V_R): vùng nghèo rộng hơn nên dòng ngược tăng theo V_R chứ không bão hòa phẳng.'],
    ['w', 'Ví dụ 5.1 (N_a = N_d = 10¹⁶, τ₀ = 0,5 µs, V_R = 5 V): W = 1,21 µm, J_gen = 2,9×10⁻⁷ A/cm².'],
    ['v', 'Kéo V_R và T: n_i tăng theo nhiệt độ nên số chớp sáng tăng rất nhanh.']
  ],
  react(S, k, P, say) {
    const p = phys(Object.assign({}, S, { Va: -S.Va, tau0: S.tau }));
    say('v', `V_R = ${S.Va.toFixed(1)} V → W = ${fmtLen(p.W)}, J_gen = ${fJ(p.Jg0)}, J_s = ${fJ(p.Js)}, J_R = ${fJ(p.Js + p.Jg0)}.`);
  }
};
LD.small = {
  intro: [
    ['i', 'Tín hiệu nhỏ: diốt tương đương r_d = V_t/I_DQ song song với C_d = (I_p0τ_p0 + I_n0τ_n0)/(2V_t); r_d·C_d = τ/2.'],
    ['w', 'Ví dụ 6.1: I = 1 mA cho r_d = 25,9 Ω. Ví dụ 6.2: τ = 0,5 µs cho C_d ≈ 9,7 nF và f_c ≈ 640 kHz.'],
    ['w', 'Dưới f_c hai kim cùng pha; trên f_c kim dòng nhỏ dần và trễ pha vì đám hạt tích trữ không kịp xả nạp.'],
    ['v', 'Bấm "I = 1 mA" rồi kéo tần số quanh 640 kHz; thêm r_s để thấy V_app = V_a + I·r_s (Ví dụ 6.3).']
  ],
  react(S, k, P, say) {
    const m = smCalc(S);
    say('v', `I = ${fmtCur(m.I)} → r_d = ${fRes(m.rd)}, C_d = ${fCap(m.Cd)}, f_c = ${fmtFreq(m.fc)}; f/f_c = ${m.r.toFixed(2)}.`);
    if (S.rs > 0) say('w', `V_app = ${S.Va.toFixed(3)} + ${fmtCur(m.I)}×${S.rs} Ω = ${(S.Va + m.I * S.rs).toFixed(3)} V.`);
  }
};
LABS.forEach(l => { l.log = LD[l.id]; });

const VIEW0 = { bias: { zoom: 3.6, fu: g => g.jx }, edge: { zoom: 3.0, fu: g => g.ne }, excess: { zoom: 2.5, fu: g => g.ne + g.lp * 0.8 }, iv: { zoom: 3.6, fu: g => g.jx }, comp: { zoom: 1.5, fu: g => g.jx },
  short: { zoom: 2.6, fu: g => (g.ne + g.len) / 2 }, regions: { zoom: 3.6, fu: g => g.jx }, gen: { zoom: 3.3, fu: g => g.jx }, small: { zoom: 2.0, fu: g => g.jx } };
LABS.forEach(l => {
  l.panels.forEach(q => { q.tid = l.id; });
  l.view0 = VIEW0[l.id]; l.S.spd = 0.5; l.S.cnt = 0.3;
  l.panels[0].ctrls.push({ k: 'spd', l: 'Tốc độ', min: 0.1, max: 2, step: 0.05, f: v => '×' + v.toFixed(2) }, { k: 'cnt', l: 'Số hạt', min: 0.05, max: 1, step: 0.05, f: v => Math.round(v * 100) + '%' });
});

/* ==========================================================================
   KHUNG POPUP (#lab95 — đồng bộ 100% phong cách & biến màu CSS của lab-b7.js)
   ========================================================================== */
const CSS = `
#lab95{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab95[hidden]{display:none}
#lab95 *{box-sizing:border-box}
#lab95 .lb-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
#lab95 .lb-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
#lab95 .lb-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
#lab95 .lb-ic{color:var(--main);display:flex}
#lab95 .lb-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
#lab95 .lb-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
#lab95 .lb-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
#lab95 .lb-tab:hover{color:var(--ink);background:var(--tint)}
#lab95 .lb-tab.on{background:var(--main);color:var(--bg);font-weight:700}
#lab95 .lb-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
#lab95 .lb-x:hover{color:var(--err);background:var(--tint)}
#lab95 .lb-b{flex:1;min-height:0;display:grid;gap:6px;padding:6px}
#lab95 .lb-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
#lab95 .lb-p.glow{animation:lb95glow 1.4s ease-out}
@keyframes lb95glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
#lab95 .lb-t{font:600 11.5px/1.2 var(--font-ui);color:var(--mut);padding:5px 10px 0;flex:none}
#lab95 .lb-cv{flex:1;min-height:0;position:relative}
#lab95 .lb-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#lab95 .lb-c{display:flex;flex-wrap:wrap;gap:5px 10px;padding:4px 10px 6px;flex:none;align-items:center}
#lab95 .lb-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
#lab95 .lb-k input[type=range]{width:clamp(64px,7vw,108px);margin:0}
#lab95 .lb-k output{color:var(--ink);font-weight:700;min-width:3em}
#lab95 .lb-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
#lab95 .lb-seg button,#lab95 .lb-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:5px 8px;cursor:pointer}
#lab95 .lb-btn{background:var(--tint)}
#lab95 .lb-seg button:hover,#lab95 .lb-btn:hover{color:var(--ink)}
#lab95 .lb-seg button.on{background:var(--main);color:var(--bg)}
#lab95 .lb-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
#lab95 .lb-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb95in .4s ease-out;overflow-wrap:anywhere}
#lab95 .lb-ln::before{position:absolute;left:0;font-weight:700}
#lab95 .lb-ln.i{color:var(--ink)}#lab95 .lb-ln.i::before{content:'›';color:var(--c5)}
#lab95 .lb-ln.w{color:var(--ink)}#lab95 .lb-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
#lab95 .lb-ln.v{color:var(--main)}#lab95 .lb-ln.v::before{content:'=';color:var(--main)}
@keyframes lb95in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab-m:hover,.lab-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
#lab95 .lb-cv canvas.cam{cursor:grab;touch-action:none}
#lab95 .lb-cv canvas.cam:active{cursor:grabbing}
#lab95 .lb-sep{width:1px;height:18px;background:var(--g);margin:0 2px}
#lab95 .lb-c{position:relative}
#lab95 .lb-film{position:absolute;top:0;right:4px;z-index:3;width:22px;height:22px;display:flex;align-items:center;justify-content:center;background:none;color:var(--ink);font:700 15px/1 var(--font-body);cursor:pointer;opacity:.8;user-select:none}
#lab95 .lb-film:hover{opacity:1}
#lab95.filming .lb-c>*:not(.lb-cap){visibility:hidden}
#lab95.filming .lb-cv canvas.cam{cursor:default}
#lab95 .lb-cap{position:absolute;left:0;right:0;bottom:0;min-height:100%;box-sizing:border-box;display:none;background:var(--card);border-top:1px solid var(--main);padding:8px 14px 9px;font:600 13px/1.45 var(--font-body);color:var(--ink);pointer-events:none;z-index:2}
#lab95 .lb-cap i{display:block;height:3px;background:var(--main);border-radius:2px;margin-top:7px;width:0}
@media(max-width:900px){#lab95 .lb-win{width:100vw;height:100dvh;border-radius:0}#lab95 .lb-b{overflow:auto;display:flex;flex-direction:column}#lab95 .lb-p{min-height:300px;flex:none}#lab95 .lb-p:nth-child(2){min-height:210px}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style');
sty.textContent = CSS;
document.head.appendChild(sty);

let timers = [], ros = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'bias';

function ensureDom() {
  if (root) return;
  root = document.createElement('div');
  root.id = 'lab95';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 9.5');
  root.innerHTML = '<div class="lb-win"><div class="lb-h"><span class="lb-ic">' + FLASK + '</span><span class="lb-bd">Phòng thí nghiệm · Buổi 9.5</span><nav class="lb-tabs"></nav><button class="lb-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb-b"></div></div>';
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
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty && window.LabB95 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden && (document.getElementById('tb-badge') || {}).textContent === 'Buổi 9.5') {
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

function resetCam(c, tab) { const v = tab.view0 || { zoom: 1 }; Object.assign(c, { yaw: 0, sy: 0.28, zoom: v.zoom, follow: (v.fu || v.f) ? 1 : 0, mx: 0, my: 0, auto: v.fu || null }); if (v.f) { c.fx = v.f[0]; c.fy = v.f[1]; c.fz = v.f[2]; } }
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
    GS = p.S; GT = p.spec.tid || ''; try { p.spec.draw(p, ctx, p.W, p.H, TT, dt * TSC); } catch (err) { console.error('[LabB95]', err); }
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

/* ---------- gắn biểu tượng bình thí nghiệm nhỏ cạnh tiêu đề Buổi 9.5 (1–1 cho đủ 11 mỏ neo) ---------- */
const H2MAP = { 1: 'bias', 2: 'edge', 3: 'iv', 4: 'comp', 5: 'regions', 6: 'small' };
const H3MAP = [
  [/^1\.3/, 'bias', 0],   [/^2\.4/, 'edge', 0],   [/^2\.6/, 'excess', 0],
  [/^3\.4/, 'iv', 0],     [/^4\.2/, 'comp', 0],   [/^4\.5/, 'short', 0],
  [/^5\.6/, 'regions', 0],[/^5\.7/, 'gen', 0],    [/^6\.6/, 'small', 0]
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

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 9.5') {
  markLesson(document.getElementById('app-content'));
}
window.LabB95 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id),
  film: (id, at) => { ensureDom(); if (root.hidden || (id && (!cur || cur.id !== id))) open(id); const p = curPanels.find(q => q.cam); if (p) filmStart(cur, p, at); } };
})();
