/* ==========================================================================
   lab-b9.5.js — PHÒNG THÍ NGHIỆM MÔ PHỎNG BUỔI 9.5:
   ĐIỐT TIẾP GIÁP p-n: DÒNG ĐIỆN LÝ TƯỞNG, DÒNG KHÔNG LÝ TƯỞNG & MÔ HÌNH TÍN HIỆU NHỎ
   - Đồng bộ 100% bảng biến màu CSS, khung popup 95%, hệ camera 3D tương tác,
     phim tự động (▶/■) và nhật ký thí nghiệm như lab-b11.js.
   - Đủ 9 tab ứng 1–1 với 9 mỏ neo "Mô hình tương tác" (b95-lab-01 → b95-lab-09):
       1.3 · Phân cực p-n     | 2.4 · Mép vùng nghèo   | 2.6 · Hạt thiểu số dư
       3.4 · Đặc tuyến I-V    | 4.2 · Thành phần dòng  | 4.5 · Điốt dài/ngắn
       5.6 · 3 vùng thuận     | 5.7 · Dòng sinh ngược  | 6.6 · Tín hiệu nhỏ
   - Khớp chính xác mọi số liệu Ví dụ 2.1, 2.2, 3.1, 3.2, 4.1, 5.1, 5.2, 5.3,
     6.1, 6.2 và 6.3 trong bài giảng Buổi 9.5.
   - API: LabB95.open(tabId?, panelIndex?, patch?)  LabB95.close()  LabB95.mark(root)
   ========================================================================== */
(function () {
'use strict';

/* ---------- hằng số vật lý & tiện ích ---------- */
const TAU2 = Math.PI * 2;
const E_CHG = 1.6e-19;          // C
const KB_EV = 8.617333e-5;      // eV/K
const EPS0 = 8.85e-14;          // F/cm
const MATS = {
  Si:   { name: 'Silicon (Si)', ni300: 1.5e10, Eg: 1.12, eps: 11.7 * EPS0 },
  GaAs: { name: 'GaAs',         ni300: 1.8e6,  Eg: 1.42, eps: 13.1 * EPS0 }
};

const rnd = (a, b) => a + Math.random() * (b - a);
const gauss = () => {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU2 * v);
};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const expSafe = x => Math.exp(clamp(x, -70, 70));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[d]).join('');
const p10 = n => '10' + sup(n);
const sci = (x, d = 2) => {
  if (!x || !isFinite(x)) return '0';
  const s = x < 0 ? '−' : '';
  const ax = Math.abs(x);
  const e = Math.floor(Math.log10(ax));
  return s + (ax / Math.pow(10, e)).toFixed(d) + '×10' + sup(e);
};
const pw = v => {
  const lg = Math.log10(v);
  const e = Math.floor(lg + 1e-9);
  const m = v / Math.pow(10, e);
  return Math.abs(m - 1) < 0.06 ? p10(e) : m.toFixed(1) + '×10' + sup(e);
};
const fmtLen = cm => {
  const um = cm * 1e4;
  return um >= 100 ? um.toFixed(0) + ' µm'
    : um >= 10 ? um.toFixed(1) + ' µm'
    : um >= 0.1 ? um.toFixed(2) + ' µm'
    : (um * 1000).toFixed(0) + ' nm';
};
const fmtCur = a => {
  const x = Math.abs(a), s = a < 0 ? '−' : '';
  if (x === 0) return '0 A';
  if (x >= 1) return s + x.toFixed(2) + ' A';
  if (x >= 1e-3) return s + (x * 1e3).toFixed(2) + ' mA';
  if (x >= 1e-6) return s + (x * 1e6).toFixed(1) + ' µA';
  if (x >= 1e-9) return s + (x * 1e9).toFixed(2) + ' nA';
  if (x >= 1e-12) return s + (x * 1e12).toFixed(2) + ' pA';
  return s + sci(x, 2) + ' A';
};
const fmtJ = j => {
  const x = Math.abs(j), s = j < 0 ? '−' : '';
  if (x === 0) return '0 A/cm²';
  if (x >= 1e-2 && x < 1e3) return s + x.toFixed(2) + ' A/cm²';
  return s + sci(x, 2) + ' A/cm²';
};
const fmtCap = f => {
  if (f >= 1e-6) return (f * 1e6).toFixed(2) + ' µF';
  if (f >= 1e-9) return (f * 1e9).toFixed(2) + ' nF';
  if (f >= 1e-12) return (f * 1e12).toFixed(1) + ' pF';
  return (f * 1e15).toFixed(1) + ' fF';
};
const fmtOhm = r => {
  if (r >= 1e6) return (r / 1e6).toFixed(2) + ' MΩ';
  if (r >= 1e3) return (r / 1e3).toFixed(2) + ' kΩ';
  if (r >= 10) return r.toFixed(1) + ' Ω';
  return r.toFixed(2) + ' Ω';
};
const fmtFreq = hz => {
  if (hz >= 1e9) return (hz / 1e9).toFixed(2) + ' GHz';
  if (hz >= 1e6) return (hz / 1e6).toFixed(2) + ' MHz';
  if (hz >= 1e3) return (hz / 1e3).toFixed(1) + ' kHz';
  return hz.toFixed(0) + ' Hz';
};

/* ---------- mô hình vật lý điốt p-n (Buổi 9.5 / Neamen Ch.8) ---------- */
function vtOf(T) {
  return 0.0259 * ((T || 300) / 300); // khớp chính xác 0.0259 V tại 300 K
}
function niOf(T, matKey) {
  const m = MATS[matKey] || MATS.Si;
  const TK = T || 300;
  if (Math.abs(TK - 300) < 0.05) return m.ni300;
  const r = TK / 300;
  return m.ni300 * Math.pow(r, 1.5) * Math.exp((-m.Eg / (2 * KB_EV)) * (1 / TK - 1 / 300));
}
function pnCalc(opts) {
  const matKey = opts.mat || 'Si';
  const m = MATS[matKey] || MATS.Si;
  const T = opts.T || 300;
  const Na = opts.Na || 1e16;
  const Nd = opts.Nd || 1e16;
  const Dn = opts.Dn != null ? opts.Dn : 25;
  const Dp = opts.Dp != null ? opts.Dp : 10;
  const tauN = opts.tauN != null ? opts.tauN : (opts.tau != null ? opts.tau : 5e-7);
  const tauP = opts.tauP != null ? opts.tauP : (opts.tau != null ? opts.tau : 5e-7);
  const A = opts.A != null ? opts.A : 1e-4;
  const Va = opts.Va != null ? opts.Va : 0;

  const Vt = vtOf(T);
  const ni = niOf(T, matKey);
  const ni2 = ni * ni;
  const np0 = ni2 / Na;
  const pn0 = ni2 / Nd;
  const Vbi = Math.max(0.05, Vt * Math.log(Math.max(1.1, (Na * Nd) / ni2)));
  const Vbar = Math.max(0.02, Vbi - Va);
  const W0 = Math.sqrt((2 * m.eps * Vbi / E_CHG) * ((Na + Nd) / (Na * Nd)));
  const W = Math.sqrt((2 * m.eps * Vbar / E_CHG) * ((Na + Nd) / (Na * Nd)));
  const xp = W * (Nd / (Na + Nd));
  const xn = W * (Na / (Na + Nd));

  const Ln = Math.sqrt(Dn * tauN);
  const Lp = Math.sqrt(Dp * tauP);
  const Jp0 = (E_CHG * Dp * pn0) / Lp;
  const Jn0 = (E_CHG * Dn * np0) / Ln;
  const Js = Jp0 + Jn0;
  const Is = A * Js;

  const fac = expSafe(Va / Vt);
  const npEdge = np0 * fac;
  const pnEdge = pn0 * fac;
  const dnpEdge = np0 * (fac - 1);
  const dpnEdge = pn0 * (fac - 1);

  const Jp = Jp0 * (fac - 1);
  const Jn = Jn0 * (fac - 1);
  const J = Js * (fac - 1);
  const I = Is * (fac - 1);

  const tau0 = 0.5 * (tauN + tauP);
  const Neff = (Na * Nd) / (Na + Nd);
  const Ecrit = 3.8e5 * Math.pow(clamp(Neff / 1e16, 0.05, 50), 0.12);
  const VB = (m.eps * Ecrit * Ecrit) / (2 * E_CHG * Neff);
  const VhiN = 2 * Vt * Math.log(Math.max(1.1, Nd / ni));
  const VhiP = 2 * Vt * Math.log(Math.max(1.1, Na / ni));

  return {
    m, T, Vt, ni, Na, Nd, Dn, Dp, tauN, tauP, tau0, A, Va,
    np0, pn0, Vbi, Vbar, W0, W, xp, xn, Ln, Lp,
    Jp0, Jn0, Js, Is, fac, npEdge, pnEdge, dnpEdge, dpnEdge,
    Jp, Jn, J, I, VB, VhiN, VhiP
  };
}

/* Giải dòng điốt thực (tái hợp + khuếch tán + phun mức cao + điện trở nối tiếp rs) */
function realDiodeCurrent(VaApp, p) {
  // Mô hình mượt qua cả 3 vùng:
  //   a) I_rec = I_r0 * (exp(Vj/(2Vt)) - 1)
  //   b) I_diff_eff = I_diff / (1 + sqrt(I_diff / I_hi)) → chuyển mượt từ exp(Vj/Vt) sang exp(Vj/(2Vt)) ở phun mức cao!
  //   c) V_app = V_j + I * r_s (giải lặp Newton khi r_s > 0)
  const Vt = p.Vt;
  const Ir0 = p.Ir0;
  const Is = p.Is;
  const Ihi = p.Ihi;
  const rs = p.rs || 0;

  const evalAtVj = Vj => {
    const e1 = expSafe(Vj / Vt) - 1;
    const e2 = expSafe(Vj / (2 * Vt)) - 1;
    const Irec = Ir0 * Math.max(0, e2);
    const IdiffRaw = Is * Math.max(0, e1);
    const Idiff = IdiffRaw / (1 + Math.sqrt(IdiffRaw / Math.max(1e-30, Ihi)));
    return { Irec, IdiffRaw, Idiff, Itot: Irec + Idiff };
  };

  if (VaApp <= 0) {
    const r = evalAtVj(0);
    return { Vj: 0, Irec: 0, IdiffRaw: 0, Idiff: 0, Itot: 0, nLoc: 2 };
  }

  let Vj = VaApp;
  if (rs > 0) {
    // Tìm Vj bằng chia đôi ổn định tuyệt đối trên [0, VaApp]
    let lo = 0, hi = VaApp;
    for (let it = 0; it < 38; it++) {
      const mid = 0.5 * (lo + hi);
      const val = mid + evalAtVj(mid).Itot * rs;
      if (val < VaApp) lo = mid; else hi = mid;
    }
    Vj = 0.5 * (lo + hi);
  }
  const cur = evalAtVj(Vj);
  // Tính hệ số lý tưởng cục bộ n(Va) = (1/Vt) / (d(ln I)/dV_app)
  const dV = 0.002;
  let Vj2 = VaApp + dV;
  if (rs > 0) {
    let lo = 0, hi = VaApp + dV;
    for (let it = 0; it < 28; it++) {
      const mid = 0.5 * (lo + hi);
      if (mid + evalAtVj(mid).Itot * rs < VaApp + dV) lo = mid; else hi = mid;
    }
    Vj2 = 0.5 * (lo + hi);
  }
  const I2 = evalAtVj(Vj2).Itot;
  const dlnI = (cur.Itot > 1e-30 && I2 > cur.Itot) ? Math.log(I2 / cur.Itot) / dV : 1 / (2 * Vt);
  const nLoc = clamp(1 / (Vt * Math.max(1e-6, dlnI)), 0.98, 25);
  return { Vj, Irec: cur.Irec, IdiffRaw: cur.IdiffRaw, Idiff: cur.Idiff, Itot: cur.Itot, nLoc };
}

/* ---------- bảng màu CSS & hàm vẽ canvas dùng chung ---------- */
const FONT = '"Be Vietnam Pro",system-ui,sans-serif';
const C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ['bg', 'card', 'ink', 'mut', 'sub', 'main', 'err', 'c1', 'c2', 'c3', 'c4', 'c5', 'g', 'tint']
    .forEach(k => C[k] = cs.getPropertyValue('--' + k).trim() || '#888');
}

let CAM = null;
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
  if (CAM && r > 3.5 && r < 6) r *= Math.pow(CAM.zoom, 0.55);
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
  const r = sz || 5.2;
  rr(ctx, x - r, y - r, r * 2, r * 2, 3);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.stroke();
  txt(ctx, sign, x, y + 0.5, col, Math.max(8, r * 1.55), 'center', 800);
}
function drawMiniGauge(ctx, cx, cy, rad, title, valText, frac, col, dangerFrac) {
  const r = clamp(rad || 22, 16, 30);
  if (CAM) {
    ctx.save(); ctx.globalAlpha = 0.88; ctx.fillStyle = C.bg;
    rr(ctx, cx - 56, cy - r - 20, 112, r + 42, 8); ctx.fill(); ctx.restore();
  }
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

/* ---------- hệ camera 3D trực giao & khối hộp 3D (đồng bộ lab-b11.js) ---------- */
const lerp = (a, b, k) => a + (b - a) * k;
const newCam = () => ({ yaw: 0, sy: 0.28, zoom: 1, fx: 0.5, fy: 0.5, fz: 0.5, follow: 0, px: 0, py: 0, mx: 0, my: 0, bb: null, nb: null, o: null, cs: 1, sn: 0, zk: 1 });
const camCtr = c => c.bb ? [(c.bb.x0 + c.bb.x1) / 2, (c.bb.y0 + c.bb.y1) / 2, (c.bb.z0 + c.bb.z1) / 2] : [0, 0, 0];
function camProj(c, ox, oy, x, y, z) {
  const m = camCtr(c), dx = x - m[0], dy = y - m[1], dz = z - m[2];
  const rx = dx * c.cs - dy * c.sn, ry = dx * c.sn + dy * c.cs, k = 1.118 * c.zoom;
  return [ox + m[0] - m[1] * 0.5 + k * rx, oy + m[1] * 0.28 - m[2] + k * (ry * c.sy - dz * c.zk)];
}
function beginCam(c, W, H) {
  if (c.nb) c.bb = c.nb;
  c.nb = null;
  const th = c.yaw + 0.4636; c.cs = Math.cos(th); c.sn = Math.sin(th); c.zk = Math.sqrt(1 - c.sy * c.sy) * 1.04;
  c.px = 0; c.py = 0;
  if (c.bb && c.o) {
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
  const FACES = [
    [0, 1, 0, [0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], [0, -1, 0, [0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
    [1, 0, 0, [1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], [-1, 0, 0, [0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]],
    [0, 0, -1, [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], [0, 0, 1, [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]
  ];
  const cs = c ? c.cs : 1, sn = c ? c.sn : 0, kz = c ? c.sy / Math.sqrt(1 - c.sy * c.sy) : 0.29;
  FACES.forEach(f => {
    const rx = f[0] * cs - f[1] * sn, ry = f[0] * sn + f[1] * cs;
    if (ry + f[2] * kz <= 0) return;
    const pts = f.slice(3).map(q => P(q[0], q[1], q[2]));
    if (f[2] === 1) { polyFill(ctx, pts, col, a, sc, 1.1); return; }
    polyFill(ctx, pts, col, a * 0.85, sc, 1);
    polyFill(ctx, pts, '#000', a * (0.16 + 0.18 * Math.max(0, rx)));
  });
}
function p3(ctx, ox, oy, x, y, z, r, col, sg) {
  const q = isoP(ox, oy, x, y, z);
  dot(ctx, q[0], q[1], r, col);
  if (sg && CAM && CAM.zoom > 1.25) txt(ctx, sg, q[0], q[1] + 0.5, C.bg, 8, 'center', 800);
  return q;
}
function i3(ctx, ox, oy, x, y, z, sg, col) {
  const q = isoP(ox, oy, x, y, z);
  drawIon(ctx, q[0], q[1], sg, col, 3.6);
}
function ions3(ctx, ox, oy, x0, y0, w, d, z0, h, sg, col, nx, ny, nz) {
  const kx = Math.max(1, nx), ky = Math.max(1, ny), kz = Math.max(1, nz || Math.floor(h / 24));
  for (let k = 0; k < kz; k++) for (let i = 0; i < kx; i++) for (let j = 0; j < ky; j++)
    i3(ctx, ox, oy, x0 + (i + 0.5) * w / kx, y0 + (j + 0.5) * d / ky, z0 + (k + 0.5) * h / kz, sg, col);
}
function swarm(st, key, nmax, t, sp) {
  let s = st[key];
  if (!s) s = st[key] = { t, a: Array.from({ length: nmax }, () => ({ u: Math.random(), v: Math.random(), w: Math.random(), x: gauss(), y: gauss(), z: gauss() })) };
  const dt = clamp(t - s.t, 0, 0.05); s.t = t;
  s.a.forEach(q => {
    if (Math.random() < dt * 3) { q.x = gauss(); q.y = gauss(); q.z = gauss(); }
    q.u += q.x * sp * dt; q.v += q.y * sp * dt; q.w += q.z * sp * dt;
    if (q.u < 0.04) { q.u = 0.04; q.x = Math.abs(q.x); } else if (q.u > 0.96) { q.u = 0.96; q.x = -Math.abs(q.x); }
    if (q.v < 0.04) { q.v = 0.04; q.y = Math.abs(q.y); } else if (q.v > 0.96) { q.v = 0.96; q.y = -Math.abs(q.y); }
    if (q.w < 0.04) { q.w = 0.04; q.z = Math.abs(q.z); } else if (q.w > 0.96) { q.w = 0.96; q.z = -Math.abs(q.z); }
  });
  return s.a;
}

/* Vẽ điốt axial DO-41 thực tế (thân đen + vạch bạc cực âm K) */
function drawDO41(ctx, cx, cy, sc, glowFrac, col) {
  const bw = 64 * sc, bh = 28 * sc, lead = 28 * sc;
  // Hai chân kim loại
  ln(ctx, cx - bw / 2 - lead, cy, cx - bw / 2, cy, C.sub, 3.2 * sc);
  ln(ctx, cx + bw / 2, cy, cx + bw / 2 + lead, cy, C.sub, 3.2 * sc);
  // Quầng sáng khi dẫn dòng lớn
  if (glowFrac > 0.05) {
    ctx.save(); ctx.globalAlpha = 0.14 + glowFrac * 0.35;
    rr(ctx, cx - bw / 2 - 6, cy - bh / 2 - 6, bw + 12, bh + 12, 10 * sc);
    ctx.fillStyle = col || C.main; ctx.fill(); ctx.restore();
  }
  // Thân epoxy đen
  rr(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 5 * sc);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = glowFrac > 0.1 ? (col || C.main) : C.sub; ctx.lineWidth = 1.6; ctx.stroke();
  // Vạch bạc cực âm Cathode (phía n bên phải)
  ctx.fillStyle = C.ink;
  ctx.fillRect(cx + bw * 0.22, cy - bh / 2 + 1, bw * 0.12, bh - 2);
  // Ký hiệu điốt nhỏ bên trên thân
  txt(ctx, 'A (p)', cx - bw / 2 - lead * 0.4, cy - 14 * sc, C.c4, Math.max(9, 10 * sc), 'center', 700);
  txt(ctx, 'K (n)', cx + bw / 2 + lead * 0.4, cy - 14 * sc, C.c2, Math.max(9, 10 * sc), 'center', 700);
  txt(ctx, '1N4148', cx - bw * 0.12, cy + 0.5, C.mut, Math.max(8, 9.5 * sc), 'center', 700);
}

/* ---------- PHIM TỰ ĐỘNG cho đủ 9 thí nghiệm Buổi 9.5 ---------- */
const V = (yaw, tilt, zoom, f) => ({ yaw, tilt, zoom, f });
const SNAPK = ['mat', 'scale', 'mode', 'rsOn'];
const FILM = {
  bias: [
    { d: 7, cap: 'Cân bằng nhiệt (V_a = 0 V): vùng nghèo ở giữa tạo hàng rào thế eV_bi giữ cân bằng giữa khuếch tán và trôi. Hai mức Fermi phẳng liền mạch, dòng tổng bằng 0.', v: V(22, 24, 1.0), orbit: 5, set: { Va: 0, Na: 1e16, Nd: 1e16, T: 300 } },
    { d: 10, cap: 'Phân cực ngược (V_a = −3 V): hàng rào nâng cao lên e(V_bi + V_R), vùng nghèo mở rộng mạnh. Hạt đa số hai bên bị chặn hoàn toàn, chỉ còn dòng rỉ rất nhỏ.', v: V(0, 14, 1.45, [0.5, 0.5, 0.55]), set: { Va: -3.0 }, slow: 0.5 },
    { d: 11, cap: 'Phân cực thuận (V_a = +0,55 V): hàng rào hạ xuống e(V_bi − V_a), vùng nghèo co hẹp, hai mức Fermi tách nhau đúng eV_a. Hạt đa số vượt đập phun sang bên kia thành hạt thiểu số!', v: V(0, 12, 1.6, [0.5, 0.5, 0.55]), set: { Va: 0.55 }, slow: 0.45 },
    { d: 9, cap: 'Tăng nhẹ V_a lên +0,65 V: chỉ nhích thêm 0,1 V nhưng lượng hạt phun qua đập tăng vọt theo hàm mũ — đây là nguồn gốc đặc tuyến mũ của điốt.', v: V(0, 14, 1.4), set: { Va: 0.65 }, slow: 0.45 }
  ],
  edge: [
    { d: 7, cap: 'Cận cảnh hai mép vùng nghèo −x_p và +x_n. Ở V_a = 0 V, nồng độ hạt thiểu số tại mép bằng đúng giá trị cân bằng n_p0, p_n0 rất nhỏ.', v: V(20, 22, 1.0), orbit: 5, set: { mat: 'Si', Va: 0, Na: 1e16, Nd: 1e16, T: 300 } },
    { d: 10, cap: 'Tăng V_a lên 0,60 V (Ví dụ 2.1): p_n(x_n) tăng hơn 10 bậc độ lớn lên 2,6×10¹⁴ cm⁻³ — cứ mỗi ≈60 mV lại nhân 10 lần trên đồ thị log bên dưới!', v: V(0, 12, 1.65, [0.5, 0.5, 0.55]), set: { Va: 0.60 }, slow: 0.45 },
    { d: 10, cap: 'Đẩy V_a lên 0,72 V: nồng độ lỗ trống phun vào vượt cả mật độ hạt đa số N_d = 10¹⁶ cm⁻³ — điều kiện phun mức thấp bị phá vỡ, điốt bước vào phun mức cao!', v: V(0, 12, 1.65, [0.5, 0.5, 0.55]), set: { Va: 0.72 }, slow: 0.45 },
    { d: 8, cap: 'Chuyển sang GaAs (E_g lớn hơn nên n_i cực nhỏ): cùng V_a = 0,72 V nhưng p_n(x_n) vẫn rất bé, nên điốt GaAs cần điện áp mở lớn hơn nhiều so với Si.', v: V(10, 18, 1.2), set: { mat: 'GaAs', Va: 0.72 } }
  ],
  excess: [
    { d: 7, cap: 'Khi phân cực thuận, hạt thiểu số dư cao nhất ngay mép vùng nghèo rồi giảm dần theo hàm mũ khi đi sâu vào vùng trung hòa do tái hợp với hạt đa số.', v: V(20, 24, 1.0), orbit: 5, set: { Va: 0.60, Dp: 10, Dn: 25, tau: 0.5, scale: 'lin' } },
    { d: 10, cap: 'Ví dụ 2.2 (D_p = 10 cm²/s, τ = 0,5 µs): độ dài khuếch tán L_p = 22,4 µm là quãng đường nồng độ giảm còn 1/e (37%). Sau 3L_p ≈ 67 µm chỉ còn 5%.', v: V(0, 12, 1.55, [0.65, 0.5, 0.55]), slow: 0.45 },
    { d: 10, cap: 'Tăng thời gian sống τ lên 2,0 µs: hạt sống lâu hơn nên khuếch tán đi xa gấp đôi (L_p = 44,7 µm), phần điện tích tích trữ Q_s (vùng tô màu) phình to gấp đôi!', v: V(0, 12, 1.5, [0.65, 0.5, 0.55]), set: { tau: 2.0 }, slow: 0.45 },
    { d: 8, cap: 'Chuyển trục y sang thang log: đường cong suy giảm mũ lập tức biến thành đường thẳng có độ dốc tỉ lệ nghịch với L_p và L_n.', v: V(10, 18, 1.15), set: { scale: 'log' } }
  ],
  iv: [
    { d: 7, cap: 'Bàn đo đặc tuyến I-V của điốt lý tưởng 1N4148 (Ví dụ 3.1): với N_a = N_d = 10¹⁶ cm⁻³, I_s = 4,16×10⁻¹⁵ A. Ở V_a = 0,60 V dòng đo được 48 µA.', set: { Va: 0.60, Na: 1e16, Nd: 1e16, tau: 0.5, T: 300, scale: 'lin' }, slow: 0.6 },
    { d: 9, cap: 'Tăng V_a lên 0,679 V (Ví dụ 3.2): chỉ nhích 79 mV nhưng dòng vọt lên đúng 1,00 mA — đèn báo sáng rực. Điện áp mở Si luôn bám sát quanh 0,6–0,7 V.', set: { Va: 0.679 }, slow: 0.6 },
    { d: 9, cap: 'Chuyển sang thang log₁₀|I|: nhánh thuận thành đường thẳng tắp 60 mV/decade, còn nhánh ngược nằm phẳng ở mức bão hòa −I_s.', set: { scale: 'log', Va: -0.30 }, slow: 0.6 },
    { d: 9, cap: 'Nâng nhiệt độ lên 330 K (+30°C): vì I_s ∝ n_i², dòng bão hòa vọt lên hàng trăm lần khiến đặc tuyến dịch sang trái — với cùng dòng thuận, V_a giảm ≈ −1,8 mV/°C!', set: { T: 330, Va: 0.60 }, slow: 0.6 }
  ],
  jcomp: [
    { d: 7, cap: 'Dòng tổng J_total luôn là hằng số dọc khắp điốt, nhưng vai trò giữa lỗ trống và electron thay đổi liên tục theo vị trí x.', v: V(20, 24, 1.0), orbit: 5, set: { ratio: 0, Lp: 22, Ln: 35, xProbe: 0.35 } },
    { d: 10, cap: 'Di chuyển lát cắt thăm dò sang sâu vùng n: dòng lỗ trống thiểu số J_p(x) tắt dần theo hàm mũ vì tái hợp, còn dòng electron đa số J_n tăng bù lại để giữ tổng không đổi!', v: V(0, 14, 1.5, [0.72, 0.5, 0.5]), set: { xProbe: 0.85 }, slow: 0.45 },
    { d: 10, cap: 'Tăng pha tạp phía p gấp 10 lần phía n (điốt p⁺n): phía pha tạp nặng phun áp đảo sang phía nhẹ nên dòng qua tiếp giáp gần như hoàn toàn là dòng lỗ trống.', v: V(0, 14, 1.45, [0.5, 0.5, 0.5]), set: { ratio: 1.0, xProbe: 0.15 }, slow: 0.45 }
  ],
  short: [
    { d: 7, cap: 'Vùng n trung hòa dài W_n = 4 L_p (điốt dài): lỗ trống phun vào tái hợp tắt gần hết trước khi chạm tiếp xúc kim loại bên phải.', v: V(18, 22, 1.0), orbit: 5, set: { wnRatio: 4.0, Lp: 22.4, Va: 0.60 } },
    { d: 11, cap: 'Đẩy tiếp xúc kim loại lại sát mép vùng nghèo (W_n = 0,25 L_p — điốt ngắn): hạt chưa kịp tái hợp đã chạm tiếp xúc ohmic (δp_n = 0). Phân bố thẳng tắp thành đường tuyến tính!', v: V(0, 12, 1.6, [0.38, 0.5, 0.5]), set: { wnRatio: 0.25 }, slow: 0.45 },
    { d: 9, cap: 'Vì độ dốc tại mép vùng nghèo dốc hơn L_p/W_n = 4 lần, dòng lỗ trống của điốt ngắn lớn gấp 4 lần điốt dài ở cùng điện áp V_a!', v: V(0, 12, 1.6, [0.35, 0.5, 0.5]), set: { wnRatio: 0.12 }, slow: 0.45 }
  ],
  real: [
    { d: 7, cap: 'Vùng a (V_a = 0,28 V, thấp): electron và lỗ trống tái hợp qua các bẫy đỏ ngay trong vùng nghèo tạo dòng J_rec ∝ exp(V_a/2V_t), hệ số lý tưởng n ≈ 2 (120 mV/decade).', v: V(18, 22, 1.0), orbit: 5, set: { Va: 0.28, tau0: 0.5, Nd: 1e16, rs: 2.0, T: 300 } },
    { d: 10, cap: 'Vượt ngưỡng 0,39 V (Ví dụ 5.2) sang Vùng b (V_a = 0,55 V): dòng khuếch tán lý tưởng áp đảo, hệ số n tụt về gần 1 (60 mV/decade).', v: V(0, 12, 1.5, [0.5, 0.5, 0.55]), set: { Va: 0.55 }, slow: 0.45 },
    { d: 11, cap: 'Vượt 0,695 V (Ví dụ 5.3) sang Vùng c (V_a = 0,88 V): phun mức cao cùng sụt áp I·r_s trên điện trở nối tiếp (khối nóng đỏ hai đầu) làm đặc tuyến cong xuống tăng chậm hẳn lại!', v: V(0, 12, 1.55, [0.5, 0.5, 0.55]), set: { Va: 0.88 }, slow: 0.45 }
  ],
  gen: [
    { d: 7, cap: 'Ví dụ 5.1 ở V_R = 5 V: vùng nghèo mở rộng W = 1,21 µm. Các bẫy trong vùng cấm liên tục sinh cặp e⁻–h⁺ và điện trường mạnh quét chúng ra hai phía tạo dòng sinh J_gen.', v: V(18, 22, 1.0), orbit: 5, set: { VR: 5, N: 1e16, tau0: 0.5, T: 300, scale: 'log' } },
    { d: 10, cap: 'So sánh trên đồ thị: J_gen = 2,9×10⁻⁷ A/cm² lớn gấp 7000 lần J_s lý tưởng! Khi tăng V_R lên 25 V, vùng nghèo rộng ra 2,58 µm nên dòng ngược thật tăng theo √(V_bi + V_R), không bão hòa phẳng.', v: V(0, 12, 1.5, [0.5, 0.5, 0.55]), set: { VR: 25 }, slow: 0.45 },
    { d: 9, cap: 'Giảm τ_0 (nhiều tâm bẫy hơn): tốc độ sinh G = n_i/(2τ_0) tăng vọt làm dòng rò ngược tăng tương ứng.', v: V(0, 14, 1.4, [0.5, 0.5, 0.55]), set: { tau0: 0.1 }, slow: 0.45 }
  ],
  small: [
    { d: 7, cap: 'Ví dụ 6.1 & 6.2 tại điểm làm việc I_DQ = 1 mA, τ = 0,5 µs: điện trở tín hiệu nhỏ r_d = V_t/I_DQ = 25,9 Ω (nhỏ hơn 26 lần so với R_DC = 680 Ω!) và C_d = 9,7 nF, f_c ≈ 640 kHz.', set: { IDQ: 1e-3, tau: 0.5, Cj: 15, rs: 2.0, n: 1.0, T: 300 }, slow: 0.6 },
    { d: 10, cap: 'Hạ dòng phân cực xuống 0,1 mA: tiếp tuyến I-V thoải hơn 10 lần nên r_d tăng lên 259 Ω, đồng thời C_d giảm 10 lần — chú ý tích r_d·C_d = τ/2 giữ nguyên không đổi!', set: { IDQ: 1e-4 }, slow: 0.6 },
    { d: 10, cap: 'Đẩy dòng lên 100 mA (Ví dụ 6.3): r_d tụt xuống chỉ còn 0,26 Ω ≪ r_s = 2 Ω. Trên đồ thị Bode, tổng trở bị sàn r_s khống chế và điện áp ngoài V_app = V_a + I·r_s ≈ 1,00 V!', set: { IDQ: 0.1 }, slow: 0.6 }
  ]
};
const THREE = new Set(['bias', 'edge', 'excess', 'jcomp', 'short', 'real', 'gen']);
const NOCAM = new Set(['iv', 'small']);

/* ---------- tiện ích vẽ đồ thị gọn đẹp cho Panel C ---------- */
function drawPlotFrame(ctx, x0, y0, pw, ph, xLbl, yLbl) {
  rr(ctx, x0, y0, pw, ph, 6);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = C.g; ctx.lineWidth = 1.1; ctx.stroke();
  if (xLbl) txt(ctx, xLbl, x0 + pw, y0 + ph + 13, C.mut, 9.8, 'right', 700);
  if (yLbl) txt(ctx, yLbl, x0 + 4, y0 - 9, C.mut, 9.8, 'left', 700);
}

const LABS = [];

/* ==========================================================================
   1. b95-lab-01 (1.3) — BA TRẠNG THÁI PHÂN CỰC CỦA TIẾP GIÁP p-n
   ========================================================================== */
LABS.push({
  id: 'bias', anchor: 'b95-lab-01', tag: '1.3', name: 'Phân cực p-n', sec: 1,
  S: { Va: 0.0, Na: 1e16, Nd: 1e16, T: 300 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Tiếp giáp p-n — độ rộng vùng nghèo W(V_a) và luồng phun hạt tải qua tiếp giáp',
      area: 'a', anim: true,
      ctrls: [
        { k: 'Va', l: 'V_a', min: -5.0, max: 0.72, step: 0.02, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' },
        { k: 'Na', l: 'Nₐ', min: 15, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'Nd', l: 'N_d', min: 15, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'T', l: 'T', min: 250, max: 400, step: 5, f: v => v + ' K' },
        { btn: 'Cân bằng', fn: p => { p.S.Va = 0; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Ngược', fn: p => { p.S.Va = -3.0; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Thuận', fn: p => { p.S.Va = 0.58; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, st = p.st;
        const m = pnCalc({ Na: S.Na, Nd: S.Nd, T: S.T, Va: Math.min(S.Va, 0.72) });
        const VaEff = Math.min(S.Va, m.Vbi - 0.03);
        const mEff = pnCalc({ Na: S.Na, Nd: S.Nd, T: S.T, Va: VaEff });
        const state = VaEff > 0.02 ? 'fwd' : VaEff < -0.02 ? 'rev' : 'eq';
        const stCol = state === 'fwd' ? C.c2 : state === 'rev' ? C.c5 : C.main;

        const bw = Math.min(350, W * 0.54), bd = Math.min(134, H * 0.36), bh = Math.min(92, H * 0.30);
        const ox = W * 0.22, oy = H * 0.72;
        const jX = bw * 0.5;
        // Tỉ lệ độ rộng vùng nghèo trực quan theo W / W0
        const wVis = clamp((mEff.W / mEff.W0) * (bw * 0.22), 18, bw * 0.66);
        const xpPx = clamp(wVis * (S.Nd / (S.Na + S.Nd)), 6, bw * 0.44);
        const xnPx = clamp(wVis * (S.Na / (S.Na + S.Nd)), 6, bw * 0.44);

        // Tiếp xúc kim loại hai đầu (Anode p trái, Cathode n phải)
        isoBox(ctx, ox, oy, -14, 0, 0, 14, bd, bh, C.sub, 0.9, C.ink);
        isoBox(ctx, ox, oy, bw, 0, 0, 14, bd, bh, C.sub, 0.9, C.ink);

        // Vùng p trung hòa, vùng nghèo, vùng n trung hòa
        isoBox(ctx, ox, oy, 0, 0, 0, jX - xpPx, bd, bh, C.c4, 0.24, C.c4);
        isoBox(ctx, ox, oy, jX - xpPx, 0, 0, xpPx, bd, bh, C.c5, 0.30, C.c5);
        isoBox(ctx, ox, oy, jX, 0, 0, xnPx, bd, bh, C.c1, 0.30, C.c1);
        isoBox(ctx, ox, oy, jX + xnPx, 0, 0, bw - (jX + xnPx), bd, bh, C.c2, 0.24, C.c2);

        // Ion cố định lộ trong vùng nghèo
        ions3(ctx, ox, oy, jX - xpPx + 2, 4, Math.max(8, xpPx - 4), bd - 8, 6, bh - 12, '−', C.c5, Math.max(1, Math.round(xpPx / 24)), 2, 2);
        ions3(ctx, ox, oy, jX + 2, 4, Math.max(8, xnPx - 4), bd - 8, 6, bh - 12, '+', C.c1, Math.max(1, Math.round(xnPx / 24)), 2, 2);

        // Hạt đa số nhiệt bên p (lỗ trống +) và bên n (electron −)
        swarm(st, 'hp', 14, t, 0.28).forEach(q => p3(ctx, ox, oy, 6 + q.u * Math.max(8, jX - xpPx - 10), 6 + q.v * (bd - 12), 6 + q.w * (bh - 12), 4.2, C.c4, '+'));
        swarm(st, 'en', 14, t, 0.28).forEach(q => p3(ctx, ox, oy, jX + xnPx + 4 + q.u * Math.max(8, bw - jX - xnPx - 10), 6 + q.v * (bd - 12), 6 + q.w * (bh - 12), 4.2, C.c2, '−'));

        // Luồng hạt phun qua vùng nghèo khi phân cực thuận
        if (state === 'fwd') {
          const injStrength = clamp((VaEff - 0.15) / (mEff.Vbi - 0.2), 0.12, 1);
          const nFlow = Math.round(3 + injStrength * 10);
          const spd = 0.45 + injStrength * 1.4;
          for (let k = 0; k < nFlow; k++) {
            const u = (t * spd + k / nFlow) % 1;
            const yL = bd * (0.18 + (k % 3) * 0.30);
            const zH = bh * (0.28 + ((k + 1) % 2) * 0.42);
            // Lỗ trống phun từ p → n
            p3(ctx, ox, oy, jX - xpPx + u * (bw - (jX - xpPx) - 10), yL, zH, 4.3, C.c4, '+');
            // Electron phun từ n → p
            p3(ctx, ox, oy, jX + xnPx - u * (jX + xnPx - 10), bd - yL, bh - zH, 4.3, C.c2, '−');
          }
          // Mũi tên dòng tổng to dày theo cường độ mũ
          const aL = isoP(ox, oy, jX - xpPx - 18, bd * 0.5, bh + 18);
          const aR = isoP(ox, oy, jX + xnPx + 18, bd * 0.5, bh + 18);
          arr(ctx, aL[0], aL[1], aR[0], aR[1], C.main, 2 + injStrength * 4);
          txt(ctx, 'Dòng phun I (hàm mũ!)', (aL[0] + aR[0]) / 2, aL[1] - 12, C.main, 10.5, 'center', 800);
        } else if (state === 'rev') {
          // Mũi tên điện trường E tăng mạnh trong vùng nghèo (từ n → p)
          const eR = isoP(ox, oy, jX + xnPx - 4, bd * 0.5, bh + 16);
          const eL = isoP(ox, oy, jX - xpPx + 4, bd * 0.5, bh + 16);
          arr(ctx, eR[0], eR[1], eL[0], eL[1], C.err, 2.6);
          txt(ctx, 'Điện trường E chặn hạt đa số', (eL[0] + eR[0]) / 2, eL[1] - 11, C.err, 10, 'center', 700);
        }

        // Nhãn cực ngoài 3D
        const lbP = isoP(ox, oy, -7, bd * 0.5, bh + 16);
        const lbN = isoP(ox, oy, bw + 7, bd * 0.5, bh + 16);
        txt(ctx, 'p (' + (VaEff >= 0 ? '+' : '−') + Math.abs(VaEff).toFixed(2) + 'V)', lbP[0], lbP[1], C.c4, 10.5, 'center', 800);
        txt(ctx, 'n (0V)', lbN[0], lbN[1], C.c2, 10.5, 'center', 800);

        // 3 đồng hồ mini gọn ở cột trống bên phải
        const gx = W - 64;
        drawMiniGauge(ctx, gx, H * 0.22, 20, 'Hàng rào V_bi−V_a', mEff.Vbar.toFixed(2) + ' V', clamp(mEff.Vbar / 5.7, 0, 1), state === 'rev' ? C.err : C.main);
        drawMiniGauge(ctx, gx, H * 0.52, 20, 'Vùng nghèo W', fmtLen(mEff.W), clamp(mEff.W / (mEff.W0 * 3), 0, 1), C.c5);
        drawMiniGauge(ctx, gx, H * 0.82, 20, 'Dòng điện I', fmtCur(mEff.I), state === 'fwd' ? clamp((Math.log10(Math.max(1e-15, Math.abs(mEff.I))) + 14) / 12, 0, 1) : 0.04, stCol);

        const modeStr = state === 'fwd' ? 'PHÂN CỰC THUẬN: hạ hàng rào → hạt đa số phun thành thiểu số!'
          : state === 'rev' ? 'PHÂN CỰC NGƯỢC: nâng hàng rào, mở rộng vùng nghèo → chặn dòng'
          : 'CÂN BẰNG NHIỆT (V_a = 0 V): khuếch tán = trôi → I = 0';
        chip(ctx, modeStr, W * 0.44, 15, stCol, 'center');
      }
    },
    {
      title: 'Bên trong: Giản đồ vùng năng lượng (E_c, E_v, E_Fp, E_Fn) — hàng rào e(V_bi − V_a) & tách mức Fermi eV_a',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const m0 = pnCalc({ Na: S.Na, Nd: S.Nd, T: S.T, Va: 0 });
        const VaEff = Math.min(S.Va, m0.Vbi - 0.03);
        const m = pnCalc({ Na: S.Na, Nd: S.Nd, T: S.T, Va: VaEff });

        const padX = 48, padR = 140, topY = 16, botY = H - 16;
        const bw = W - padX - padR, bh = botY - topY;
        const jX = padX + bw * 0.5;
        const wVis = clamp((m.W / m.W0) * (bw * 0.18), 16, bw * 0.56);
        const xL = jX - wVis * (S.Nd / (S.Na + S.Nd));
        const xR = jX + wVis * (S.Na / (S.Na + S.Nd));

        rr(ctx, padX, topY, bw, bh, 7); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1.1; ctx.stroke();
        // Tô nền vùng nghèo
        ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = C.c5; ctx.fillRect(xL, topY + 1, xR - xL, bh - 2); ctx.restore();
        ln(ctx, xL, topY, xL, botY, C.c5, 1, [3, 3]);
        ln(ctx, xR, topY, xR, botY, C.c5, 1, [3, 3]);

        // Tính tọa độ y cho Ec, Ev (nén mượt khi Va rất âm để luôn nằm gọn trong khung)
        const barShift = clamp(m.Vbar, 0.04, 2.2) / 2.2 * (bh * 0.44);
        const egPx = bh * 0.28;
        const midY = topY + bh * 0.50;
        const ecP = midY - barShift * 0.5 - egPx * 0.5;
        const ecN = midY + barShift * 0.5 - egPx * 0.5;
        const evP = ecP + egPx, evN = ecN + egPx;

        // Vẽ đường cong Ec và Ev nối mượt qua vùng nghèo
        const drawBand = (yP, yN, col, lbl) => {
          ctx.beginPath();
          ctx.moveTo(padX + 4, yP); ctx.lineTo(xL, yP);
          ctx.bezierCurveTo((xL + xR) / 2, yP, (xL + xR) / 2, yN, xR, yN);
          ctx.lineTo(padX + bw - 4, yN);
          ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.stroke();
          txt(ctx, lbl, padX - 6, yP, col, 10, 'right', 700);
        };
        drawBand(ecP, ecN, C.c2, 'E_c');
        drawBand(evP, evN, C.c4, 'E_v');

        // Mức chuẩn Fermi E_Fp (phía p) và E_Fn (phía n) tách nhau đúng eV_a
        const efP = evP - egPx * 0.20;
        const efN = ecN + egPx * 0.20;
        ln(ctx, padX + 4, efP, jX, efP, C.c4, 1.5, [5, 4]);
        ln(ctx, jX, efN, padX + bw - 4, efN, C.c2, 1.5, [5, 4]);
        txt(ctx, 'E_Fp', padX + 8, efP - 9, C.c4, 9.5, 'left', 700);
        txt(ctx, 'E_Fn', padX + bw - 8, efN + 9, C.c2, 9.5, 'right', 700);

        // Mũi tên đánh dấu chiều cao hàng rào e(V_bi − V_a) và tách mức eV_a
        const mx = padX + bw - 26;
        ln(ctx, xL, ecP, mx + 4, ecP, C.mut, 0.9, [2, 3]);
        if (Math.abs(ecN - ecP) > 10) {
          arr(ctx, mx, ecN, mx, ecP, C.main, 1.6);
          arr(ctx, mx, ecP, mx, ecN, C.main, 1.6);
        }

        // Chấm hạt nhảy vượt hàng rào khi thuận
        if (VaEff > 0.08) {
          const sp = clamp(VaEff / m.Vbi, 0.15, 1) * 1.4;
          for (let k = 0; k < 4; k++) {
            const u = (t * sp + k * 0.25) % 1;
            const ex = xR - u * (xR - xL + 40);
            dot(ctx, ex, lerp(ecN - 6, ecP - 6, clamp(u * 1.2, 0, 1)), 3.6, C.c2);
            const hx = xL + u * (xR - xL + 40);
            dot(ctx, hx, lerp(evP + 6, evN + 6, clamp(u * 1.2, 0, 1)), 3.6, C.c4);
          }
        }

        // Bảng thông số gọn bên phải
        const rx = padX + bw + 10;
        txt(ctx, 'V_bi = ' + m.Vbi.toFixed(3) + ' V', rx, topY + 14, C.ink, 10.5, 'left', 700);
        txt(ctx, 'Hàng rào: ' + m.Vbar.toFixed(2) + ' eV', rx, topY + 34, C.main, 10.5, 'left', 700);
        txt(ctx, 'Tách Fermi: ' + (VaEff >= 0 ? '+' : '−') + Math.abs(VaEff).toFixed(2) + ' eV', rx, topY + 54, VaEff > 0 ? C.c2 : VaEff < 0 ? C.err : C.mut, 10.2, 'left', 700);
        txt(ctx, 'W = ' + fmtLen(m.W), rx, topY + 74, C.c5, 10.2, 'left', 700);
        txt(ctx, '−x_p', xL, botY + 9, C.mut, 9, 'center', 700);
        txt(ctx, '+x_n', xR, botY + 9, C.mut, 9, 'center', 700);
      }
    }
  ]
});

/* ==========================================================================
   2. b95-lab-02 (2.4) — HẠT THIỂU SỐ TẠI MÉP VÙNG NGHÈO THEO V_a
   ========================================================================== */
LABS.push({
  id: 'edge', anchor: 'b95-lab-02', tag: '2.4', name: 'Mép vùng nghèo', sec: 2,
  S: { mat: 'Si', Va: 0.60, Na: 1e16, Nd: 1e16, T: 300 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Tích tụ hạt thiểu số tại hai mép vùng nghèo (−x_p, +x_n) tăng hàm mũ theo V_a',
      area: 'a', anim: true,
      ctrls: [
        { k: 'mat', seg: [['Si', 'Si (1,12 eV)'], ['GaAs', 'GaAs (1,42 eV)']] },
        { k: 'Va', l: 'V_a', min: -0.30, max: 0.80, step: 0.01, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' },
        { k: 'Na', l: 'Nₐ', min: 15, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'Nd', l: 'N_d', min: 15, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'T', l: 'T', min: 260, max: 380, step: 5, f: v => v + ' K' },
        { btn: 'Ví dụ 2.1', fn: p => { p.S.mat = 'Si'; p.S.Va = 0.60; p.S.Na = 1e16; p.S.Nd = 1e16; p.S.T = 300; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, st = p.st;
        const m = pnCalc({ mat: S.mat, Va: S.Va, Na: S.Na, Nd: S.Nd, T: S.T });
        const ratioN = m.pnEdge / S.Nd;
        const ratioP = m.npEdge / S.Na;
        const hiInj = ratioN > 0.1 || ratioP > 0.1;

        const bw = Math.min(340, W * 0.52), bd = Math.min(130, H * 0.36), bh = Math.min(92, H * 0.32);
        const ox = W * 0.22, oy = H * 0.72;
        const depW = 54, jX = bw * 0.5, xL = jX - depW / 2, xR = jX + depW / 2;

        // Khối bán dẫn hai bên & vùng nghèo giữa
        isoBox(ctx, ox, oy, 0, 0, 0, xL, bd, bh, C.card, 1, C.c4);
        isoBox(ctx, ox, oy, xL, 0, 0, depW, bd, bh, C.c5, 0.25, C.c5);
        isoBox(ctx, ox, oy, xR, 0, 0, bw - xR, bd, bh, C.card, 1, C.c2);

        // Lớp hạt thiểu số sáng lên tại 2 mép theo log10(pnEdge / pn0)
        const glowN = clamp((Math.log10(Math.max(1, m.pnEdge)) - Math.log10(Math.max(1, m.pn0))) / 12, 0, 1);
        const glowP = clamp((Math.log10(Math.max(1, m.npEdge)) - Math.log10(Math.max(1, m.np0))) / 12, 0, 1);
        if (glowP > 0.05) isoBox(ctx, ox, oy, xL - 18, 0, 0, 18, bd, bh, ratioP > 0.1 ? C.err : C.c2, 0.25 + glowP * 0.65, ratioP > 0.1 ? C.err : C.c2);
        if (glowN > 0.05) isoBox(ctx, ox, oy, xR, 0, 0, 18, bd, bh, ratioN > 0.1 ? C.err : C.c4, 0.25 + glowN * 0.65, ratioN > 0.1 ? C.err : C.c4);

        // Hạt thiểu số tập trung ở mép
        const cntP = Math.round(glowP * 14), cntN = Math.round(glowN * 14);
        swarm(st, 'mp', 14, t, 0.4).slice(0, cntP).forEach(q => p3(ctx, ox, oy, xL - 16 + q.u * 14, 6 + q.v * (bd - 12), 6 + q.w * (bh - 12), 4.3, C.c2, '−'));
        swarm(st, 'mn', 14, t, 0.4).slice(0, cntN).forEach(q => p3(ctx, ox, oy, xR + 2 + q.u * 14, 6 + q.v * (bd - 12), 6 + q.w * (bh - 12), 4.3, C.c4, '+'));
        ions3(ctx, ox, oy, xL + 4, 8, depW * 0.42, bd - 16, 10, bh - 20, '−', C.c5, 1, 2, 2);
        ions3(ctx, ox, oy, jX + 4, 8, depW * 0.42, bd - 16, 10, bh - 20, '+', C.c1, 1, 2, 2);

        const pL = isoP(ox, oy, xL - 9, bd * 0.5, bh + 18);
        const pR = isoP(ox, oy, xR + 9, bd * 0.5, bh + 18);
        txt(ctx, 'n_p(−x_p)=' + sci(m.npEdge, 1), pL[0], pL[1], C.c2, 10, 'center', 700);
        txt(ctx, 'p_n(x_n)=' + sci(m.pnEdge, 1), pR[0], pR[1], C.c4, 10, 'center', 700);

        // 3 đồng hồ mini bên phải
        const gx = W - 64;
        const decPerV = m.Vt * Math.LN10 * 1000;
        drawMiniGauge(ctx, gx, H * 0.21, 19, 'Hệ số exp(V_a/V_t)', sci(m.fac, 1), clamp(Math.log10(Math.max(1e-5, m.fac)) / 14, 0, 1), C.main);
        drawMiniGauge(ctx, gx, H * 0.51, 19, 'p_n(x_n) / N_d', ratioN >= 0.01 ? (ratioN * 100).toFixed(1) + '%' : sci(ratioN * 100, 1) + '%', clamp((Math.log10(Math.max(1e-12, ratioN)) + 6) / 6.5, 0, 1), C.c4, 0.78);
        drawMiniGauge(ctx, gx, H * 0.81, 19, 'Bước ×10 lần', decPerV.toFixed(1) + ' mV', clamp((decPerV - 40) / 50, 0, 1), C.c1);

        chip(ctx, hiInj ? 'CẢNH BÁO: Hết phun mức thấp! (p_n hoặc n_p tiến sát hạt đa số)'
          : 'Phun mức thấp hợp lệ · Cứ +' + decPerV.toFixed(1) + ' mV nồng độ mép nhân 10×',
          W * 0.44, 15, hiInj ? C.err : C.c2, 'center');
      }
    },
    {
      title: 'Đồ thị log₁₀ nồng độ hạt thiểu số tại mép p_n(x_n), n_p(−x_p) theo V_a & ngưỡng hết phun mức thấp (N_d, N_a)',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const m = pnCalc({ mat: S.mat, Va: S.Va, Na: S.Na, Nd: S.Nd, T: S.T });
        const x0 = 52, y0 = 18, pw = W - x0 - 138, ph = H - y0 - 26;
        drawPlotFrame(ctx, x0, y0, pw, ph, 'V_a (V)', 'log₁₀(cm⁻³)');

        const vMin = -0.30, vMax = 0.85;
        const yMin = S.mat === 'GaAs' ? -6 : 0, yMax = 19;
        const X = v => x0 + ((v - vMin) / (vMax - vMin)) * pw;
        const Y = lg => y0 + ph - (clamp(lg, yMin, yMax) - yMin) / (yMax - yMin) * ph;

        // Lưới trục
        for (let v = -0.2; v <= 0.81; v += 0.2) {
          const xv = X(v);
          ln(ctx, xv, y0, xv, y0 + ph, C.g, 0.7, [2, 3]);
          txt(ctx, v.toFixed(1), xv, y0 + ph + 10, C.mut, 9.2, 'center', 600);
        }
        ln(ctx, X(0), y0, X(0), y0 + ph, C.sub, 1);
        for (let lg = Math.ceil(yMin / 4) * 4; lg <= yMax; lg += 4) {
          const yv = Y(lg);
          ln(ctx, x0, yv, x0 + pw, yv, C.g, 0.7, [2, 3]);
          txt(ctx, p10(lg), x0 - 5, yv, C.mut, 9.2, 'right', 600);
        }

        // Đường ngang mức hạt đa số Nd, Na và cân bằng pn0, np0
        const yNd = Y(Math.log10(S.Nd)), yNa = Y(Math.log10(S.Na));
        ln(ctx, x0, yNd, x0 + pw, yNd, C.err, 1.3, [5, 3]);
        txt(ctx, 'N_d', x0 + pw - 4, yNd - 7, C.err, 9.2, 'right', 700);
        if (Math.abs(yNa - yNd) > 10) {
          ln(ctx, x0, yNa, x0 + pw, yNa, C.c5, 1.1, [4, 4]);
          txt(ctx, 'Nₐ', x0 + pw - 4, yNa - 7, C.c5, 9.2, 'right', 700);
        }
        ln(ctx, x0, Y(Math.log10(Math.max(1e-8, m.pn0))), x0 + pw, Y(Math.log10(Math.max(1e-8, m.pn0))), C.c4, 0.9, [2, 4]);

        // Đường cong log10(p_n(x_n)) và log10(n_p(-x_p))
        const plotLine = (n0, col, lw) => {
          ctx.beginPath();
          let started = false;
          for (let i = 0; i <= 80; i++) {
            const v = vMin + (i / 80) * (vMax - vMin);
            const lg = Math.log10(Math.max(1e-12, n0)) + (v / m.Vt) * Math.LOG10E;
            if (lg < yMin - 0.2 || lg > yMax + 0.2) continue;
            const px = X(v), py = Y(lg);
            if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
        };
        plotLine(m.pn0, C.c4, 2.3);
        plotLine(m.np0, C.c2, 1.8);

        // Thước đo 60 mV / decade trực quan
        const decV = m.Vt * Math.LN10;
        const vRef = clamp(S.Va - decV, 0.05, 0.55);
        const lgRef = Math.log10(Math.max(1e-12, m.pn0)) + (vRef / m.Vt) * Math.LOG10E;
        if (lgRef > yMin + 1 && lgRef < yMax - 2) {
          const x1 = X(vRef), x2 = X(vRef + decV), y1 = Y(lgRef), y2 = Y(lgRef + 1);
          ln(ctx, x1, y1, x2, y1, C.main, 1.5);
          ln(ctx, x2, y1, x2, y2, C.main, 1.5);
          txt(ctx, '+' + (decV * 1000).toFixed(0) + 'mV → ×10', x2 + 4, (y1 + y2) / 2, C.main, 9.2, 'left', 700);
        }

        // Điểm chạm N_d (hết phun mức thấp)
        const vLim = m.VhiN;
        if (vLim >= vMin && vLim <= vMax) {
          ln(ctx, X(vLim), yNd, X(vLim), y0 + ph, C.err, 1.1, [3, 3]);
          dot(ctx, X(vLim), yNd, 4.2, C.err);
          txt(ctx, 'Hết mức thấp ' + vLim.toFixed(2) + 'V', X(vLim) - 4, yNd + 12, C.err, 9, 'right', 700);
        }

        // Điểm hiện tại ở V_a
        const xCur = X(S.Va);
        ln(ctx, xCur, y0, xCur, y0 + ph, C.main, 1.2, [3, 2]);
        const lgPn = Math.log10(Math.max(1e-12, m.pnEdge));
        const lgNp = Math.log10(Math.max(1e-12, m.npEdge));
        if (lgPn >= yMin && lgPn <= yMax) dot(ctx, xCur, Y(lgPn), 5, C.c4);
        if (lgNp >= yMin && lgNp <= yMax) dot(ctx, xCur, Y(lgNp), 4.2, C.c2);

        // Chú thích số liệu bên phải
        const rx = x0 + pw + 10;
        txt(ctx, 'p_n0 = ' + sci(m.pn0, 2), rx, y0 + 12, C.mut, 9.6, 'left', 600);
        txt(ctx, 'p_n(x_n):', rx, y0 + 30, C.c4, 9.8, 'left', 700);
        txt(ctx, sci(m.pnEdge, 2) + ' cm⁻³', rx, y0 + 44, C.c4, 10.2, 'left', 800);
        txt(ctx, 'n_p(−x_p):', rx, y0 + 64, C.c2, 9.8, 'left', 700);
        txt(ctx, sci(m.npEdge, 2) + ' cm⁻³', rx, y0 + 78, C.c2, 10.2, 'left', 800);
        txt(ctx, 'V_a(chạm N_d)=' + vLim.toFixed(2) + 'V', rx, y0 + 98, C.err, 9.3, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   3. b95-lab-03 (2.6) — PHÂN BỐ HẠT THIỂU SỐ DƯ TRONG HAI VÙNG TRUNG HÒA
   ========================================================================== */
LABS.push({
  id: 'excess', anchor: 'b95-lab-03', tag: '2.6', name: 'Hạt thiểu số dư', sec: 2,
  S: { Va: 0.60, Dp: 10, Dn: 25, tau: 0.5, Na: 1e16, Nd: 1e16, scale: 'lin' },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Mây hạt thiểu số dư phun vào hai vùng trung hòa, suy giảm mũ theo L_n, L_p do tái hợp',
      area: 'a', anim: true,
      ctrls: [
        { k: 'Va', l: 'V_a', min: 0.40, max: 0.68, step: 0.01, f: v => v.toFixed(2) + ' V' },
        { k: 'tau', l: 'τ', min: 0.1, max: 2.5, step: 0.1, f: v => v.toFixed(1) + ' µs' },
        { k: 'Dp', l: 'D_p', min: 4, max: 20, step: 1, f: v => v + '' },
        { k: 'Dn', l: 'D_n', min: 10, max: 40, step: 2, f: v => v + '' },
        { k: 'scale', seg: [['lin', 'Tuyến tính'], ['log', 'Thang log']] },
        { btn: 'Ví dụ 2.2', fn: p => { p.S.Va = 0.60; p.S.Dp = 10; p.S.Dn = 25; p.S.tau = 0.5; p.S.Na = 1e16; p.S.Nd = 1e16; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, st = p.st;
        const m = pnCalc({ Va: S.Va, Dp: S.Dp, Dn: S.Dn, tau: S.tau * 1e-6, Na: S.Na, Nd: S.Nd });
        const LpUm = m.Lp * 1e4, LnUm = m.Ln * 1e4;
        const QsN = m.A * E_CHG * m.dpnEdge * m.Lp; // điện tích tích trữ lỗ trống phía n

        const bw = Math.min(350, W * 0.54), bd = Math.min(130, H * 0.36), bh = Math.min(88, H * 0.30);
        const ox = W * 0.22, oy = H * 0.72;
        const depW = 28, jX = bw * 0.5, xL = jX - depW / 2, xR = jX + depW / 2;
        const halfLen = bw * 0.5 - depW / 2; // đại diện cho ~120 µm mỗi bên

        isoBox(ctx, ox, oy, 0, 0, 0, xL, bd, bh, C.card, 1, C.c4);
        isoBox(ctx, ox, oy, xL, 0, 0, depW, bd, bh, C.c5, 0.28, C.c5);
        isoBox(ctx, ox, oy, xR, 0, 0, halfLen, bd, bh, C.card, 1, C.c2);

        // Các lát mây mật độ hạt thiểu số dư giảm mũ hai bên
        const slices = 8;
        const amp = clamp((S.Va - 0.38) / 0.30, 0.15, 1);
        for (let i = 0; i < slices; i++) {
          const sUm = ((i + 0.5) / slices) * 120;
          const sw = halfLen / slices;
          const aR = Math.exp(-sUm / LpUm) * amp * 0.62;
          const aL = Math.exp(-sUm / LnUm) * amp * 0.62;
          if (aR > 0.03) isoBox(ctx, ox, oy, xR + i * sw, 2, 2, sw, bd - 4, bh - 4, C.c4, aR, 'transparent');
          if (aL > 0.03) isoBox(ctx, ox, oy, xL - (i + 1) * sw, 2, 2, sw, bd - 4, bh - 4, C.c2, aL, 'transparent');
        }

        // Hạt phun vào và chớp tái hợp dọc quãng đường L_p, L_n
        if (!st.fl) st.fl = [];
        const dt3 = clamp(t - (st.t3 == null ? t : st.t3), 0, 0.05); st.t3 = t;
        st.fl = st.fl.filter(f => (f.a -= dt3 * 2.2) > 0);
        const nP = Math.round(5 + amp * 12);
        for (let k = 0; k < nP; k++) {
          const u = (t * 0.55 + k / nP) % 1;
          const distR = -LpUm * Math.log(1 - u * 0.94);
          if (distR < 118) {
            const xx = xR + (distR / 120) * halfLen;
            p3(ctx, ox, oy, xx, bd * (0.16 + (k % 4) * 0.22), bh * (0.25 + (k % 2) * 0.45), 4.1, C.c4, '+');
            if (u > 0.88 && Math.random() < dt3 * 6) st.fl.push({ x: xx, y: bd * 0.5, z: bh * 0.5, a: 1 });
          }
          const distL = -LnUm * Math.log(1 - u * 0.94);
          if (distL < 118) {
            const xx = xL - (distL / 120) * halfLen;
            p3(ctx, ox, oy, xx, bd * (0.20 + (k % 4) * 0.20), bh * (0.3 + ((k + 1) % 2) * 0.4), 4.1, C.c2, '−');
          }
        }
        st.fl.forEach(f => {
          const q = isoP(ox, oy, f.x, f.y, f.z);
          ctx.beginPath(); ctx.arc(q[0], q[1], 3 + (1 - f.a) * 10, 0, TAU2);
          ctx.strokeStyle = C.main; ctx.globalAlpha = f.a; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1;
        });

        // Thước L_p và L_n trên mặt trên khối 3D
        const lpPx = clamp((LpUm / 120) * halfLen, 10, halfLen);
        const lnPx = clamp((LnUm / 120) * halfLen, 10, halfLen);
        const r1 = isoP(ox, oy, xR, bd * 0.5, bh + 12), r2 = isoP(ox, oy, xR + lpPx, bd * 0.5, bh + 12);
        arr(ctx, r1[0], r1[1], r2[0], r2[1], C.c4, 2.2);
        txt(ctx, 'L_p=' + LpUm.toFixed(1) + 'µm', (r1[0] + r2[0]) / 2, r1[1] - 11, C.c4, 10, 'center', 700);
        const l1 = isoP(ox, oy, xL, bd * 0.5, bh + 12), l2 = isoP(ox, oy, xL - lnPx, bd * 0.5, bh + 12);
        arr(ctx, l1[0], l1[1], l2[0], l2[1], C.c2, 2.2);
        txt(ctx, 'L_n=' + LnUm.toFixed(1) + 'µm', (l1[0] + l2[0]) / 2, l1[1] - 11, C.c2, 10, 'center', 700);

        const gx = W - 64;
        drawMiniGauge(ctx, gx, H * 0.21, 19, 'Độ dài L_p', LpUm.toFixed(1) + ' µm', clamp(LpUm / 80, 0, 1), C.c4);
        drawMiniGauge(ctx, gx, H * 0.51, 19, 'Còn 5% tại 3L_p', (3 * LpUm).toFixed(0) + ' µm', clamp((3 * LpUm) / 240, 0, 1), C.c1);
        drawMiniGauge(ctx, gx, H * 0.81, 19, 'Điện tích Q_s(n)', sci(QsN, 1) + ' C', clamp((Math.log10(Math.max(1e-18, QsN)) + 15) / 6, 0, 1), C.main);

        chip(ctx, 'Hạt thiểu số dư giảm còn 37% sau 1·L và còn 5% sau ≈3·L do tái hợp', W * 0.44, 15, C.main, 'center');
      }
    },
    {
      title: 'Đồ thị phân bố n_p(x) (trái) và p_n(x) (phải) · Vùng tô màu là điện tích tích trữ Q_s',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const m = pnCalc({ Va: S.Va, Dp: S.Dp, Dn: S.Dn, tau: S.tau * 1e-6, Na: S.Na, Nd: S.Nd });
        const LpUm = m.Lp * 1e4, LnUm = m.Ln * 1e4;
        const x0 = 52, y0 = 18, pw = W - x0 - 134, ph = H - y0 - 24;
        drawPlotFrame(ctx, x0, y0, pw, ph, 'x (µm)', S.scale === 'log' ? 'log₁₀(cm⁻³)' : 'Nồng độ dư');

        const sMax = 120; // ±120 µm
        const gapW = 26;
        const jX = x0 + pw * 0.5, xL = jX - gapW / 2, xR = jX + gapW / 2;
        const sideW = (pw - gapW) / 2;

        ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = C.c5; ctx.fillRect(xL, y0 + 1, gapW, ph - 2); ctx.restore();
        ln(ctx, xL, y0, xL, y0 + ph, C.c5, 1.1, [3, 3]);
        ln(ctx, xR, y0, xR, y0 + ph, C.c5, 1.1, [3, 3]);
        txt(ctx, '−x_p', xL, y0 + ph + 10, C.mut, 9, 'center', 700);
        txt(ctx, '+x_n', xR, y0 + ph + 10, C.mut, 9, 'center', 700);

        const maxEdge = Math.max(m.pnEdge, m.npEdge, 1e6);
        const lgMax = Math.log10(maxEdge) + 0.5, lgMin = Math.log10(Math.min(m.pn0, m.np0)) - 0.5;
        const mapY = val => {
          if (S.scale === 'log') {
            const lg = Math.log10(Math.max(1, val));
            return y0 + ph - clamp((lg - lgMin) / Math.max(1, lgMax - lgMin), 0, 1) * (ph - 8) - 4;
          }
          return y0 + ph - clamp(val / maxEdge, 0, 1) * (ph - 10) - 4;
        };

        // Vẽ nhánh phải p_n(x) & vùng tô điện tích tích trữ Q_s
        ctx.beginPath();
        ctx.moveTo(xR, y0 + ph - 4);
        for (let i = 0; i <= 60; i++) {
          const s = (i / 60) * sMax;
          const val = m.pn0 + m.dpnEdge * Math.exp(-s / LpUm);
          ctx.lineTo(xR + (s / sMax) * sideW, mapY(val));
        }
        ctx.lineTo(xR + sideW, y0 + ph - 4); ctx.closePath();
        ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.c4; ctx.fill(); ctx.restore();

        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const s = (i / 60) * sMax;
          const val = m.pn0 + m.dpnEdge * Math.exp(-s / LpUm);
          const px = xR + (s / sMax) * sideW, py = mapY(val);
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.strokeStyle = C.c4; ctx.lineWidth = 2.3; ctx.stroke();

        // Vẽ nhánh trái n_p(x)
        ctx.beginPath();
        ctx.moveTo(xL, y0 + ph - 4);
        for (let i = 0; i <= 60; i++) {
          const s = (i / 60) * sMax;
          const val = m.np0 + m.dnpEdge * Math.exp(-s / LnUm);
          ctx.lineTo(xL - (s / sMax) * sideW, mapY(val));
        }
        ctx.lineTo(xL - sideW, y0 + ph - 4); ctx.closePath();
        ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.c2; ctx.fill(); ctx.restore();

        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const s = (i / 60) * sMax;
          const val = m.np0 + m.dnpEdge * Math.exp(-s / LnUm);
          const px = xL - (s / sMax) * sideW, py = mapY(val);
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.strokeStyle = C.c2; ctx.lineWidth = 2.3; ctx.stroke();

        // Đánh dấu mốc 1/e tại L_p và L_n
        if (LpUm < sMax) {
          const xLp = xR + (LpUm / sMax) * sideW;
          const yLp = mapY(m.pn0 + m.dpnEdge * Math.exp(-1));
          ln(ctx, xLp, yLp, xLp, y0 + ph, C.c4, 1.1, [3, 2]);
          dot(ctx, xLp, yLp, 4, C.c4);
          txt(ctx, 'L_p (37%)', xLp + 4, yLp - 8, C.c4, 9.2, 'left', 700);
        }
        if (LnUm < sMax) {
          const xLn = xL - (LnUm / sMax) * sideW;
          const yLn = mapY(m.np0 + m.dnpEdge * Math.exp(-1));
          ln(ctx, xLn, yLn, xLn, y0 + ph, C.c2, 1.1, [3, 2]);
          dot(ctx, xLn, yLn, 4, C.c2);
          txt(ctx, 'L_n', xLn - 4, yLn - 8, C.c2, 9.2, 'right', 700);
        }

        // Trục dọc giá trị đỉnh
        txt(ctx, sci(maxEdge, 1), x0 - 4, y0 + 8, C.mut, 8.8, 'right', 600);
        txt(ctx, S.scale === 'log' ? sci(m.pn0, 1) : '0', x0 - 4, y0 + ph - 4, C.mut, 8.8, 'right', 600);

        const rx = x0 + pw + 10;
        txt(ctx, 'δp_n(x_n)=' + sci(m.dpnEdge, 1), rx, y0 + 14, C.c4, 9.8, 'left', 700);
        txt(ctx, 'δn_p(−x_p)=' + sci(m.dnpEdge, 1), rx, y0 + 32, C.c2, 9.8, 'left', 700);
        txt(ctx, 'L_p = ' + LpUm.toFixed(1) + ' µm', rx, y0 + 54, C.ink, 9.8, 'left', 700);
        txt(ctx, 'L_n = ' + LnUm.toFixed(1) + ' µm', rx, y0 + 70, C.ink, 9.8, 'left', 700);
        txt(ctx, '3L_p ≈ ' + (3 * LpUm).toFixed(0) + ' µm (5%)', rx, y0 + 90, C.mut, 9.3, 'left', 600);
      }
    }
  ]
});

/* ==========================================================================
   4. b95-lab-04 (3.4) — ĐẶC TUYẾN I-V CỦA ĐIỐT LÝ TƯỞNG
   ========================================================================== */
LABS.push({
  id: 'iv', anchor: 'b95-lab-04', tag: '3.4', name: 'Đặc tuyến I-V', sec: 3,
  S: { Va: 0.60, Na: 1e16, Nd: 1e16, tau: 0.5, A: 1e-4, T: 300, scale: 'lin' },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Mạch đo I-V điốt p-n 1N4148 — Nguồn DC, Ampe kế & Tỉ lệ dòng lỗ trống / electron',
      area: 'a', anim: true,
      ctrls: [
        { k: 'Va', l: 'V_a', min: -0.50, max: 0.75, step: 0.01, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' },
        { k: 'Na', l: 'Nₐ', min: 15, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'Nd', l: 'N_d', min: 15, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'tau', l: 'τ', min: 0.1, max: 2.0, step: 0.1, f: v => v.toFixed(1) + ' µs' },
        { k: 'T', l: 'T', min: 270, max: 360, step: 5, f: v => v + ' K' },
        { k: 'scale', seg: [['lin', 'Tuyến tính'], ['log', 'Log₁₀|I|']] },
        { btn: 'VD 3.1', fn: p => { p.S.Va = 0.60; p.S.Na = 1e16; p.S.Nd = 1e16; p.S.tau = 0.5; p.S.A = 1e-4; p.S.T = 300; p.syncCtrls(); p.dirty = true; } },
        { btn: 'VD 3.2 (1mA)', fn: p => { p.S.Na = 1e16; p.S.Nd = 1e16; p.S.tau = 0.5; p.S.A = 1e-4; p.S.T = 300; const m0 = pnCalc({ Na: 1e16, Nd: 1e16, tau: 5e-7, A: 1e-4, T: 300 }); p.S.Va = +(m0.Vt * Math.log(1e-3 / m0.Is)).toFixed(3); p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const m = pnCalc({ Va: S.Va, Na: S.Na, Nd: S.Nd, tau: S.tau * 1e-6, A: S.A, T: S.T });
        const fracP = m.Jp0 / m.Js, fracN = m.Jn0 / m.Js;
        const glow = S.Va > 0.35 ? clamp((Math.log10(Math.max(1e-8, m.I)) + 6) / 4.5, 0, 1) : 0;

        const cy = H * 0.44;
        const srcX = W * 0.14, dX = W * 0.46, ledX = W * 0.74;
        // Vòng dây mạch điện
        ln(ctx, srcX, cy - 34, srcX, cy - 52, C.c4, 2.4);
        ln(ctx, srcX, cy - 52, ledX, cy - 52, C.c4, 2.4);
        ln(ctx, ledX, cy - 52, ledX, cy - 22, C.c4, 2.4);
        ln(ctx, ledX, cy + 22, ledX, cy + 52, C.c2, 2.4);
        ln(ctx, srcX, cy + 52, ledX, cy + 52, C.c2, 2.4);
        ln(ctx, srcX, cy + 34, srcX, cy + 52, C.c2, 2.4);

        // Chấm dòng điện chạy quanh dây
        if (glow > 0.04) {
          const sp = 0.35 + glow * 2.2;
          for (let k = 0; k < 7; k++) {
            const u = (t * sp + k / 7) % 1;
            dot(ctx, srcX + u * (ledX - srcX), cy - 52, 3.8, C.main);
            dot(ctx, ledX - u * (ledX - srcX), cy + 52, 3.8, C.c2);
          }
        }

        // Bộ nguồn DC bên trái
        rr(ctx, srcX - 42, cy - 34, 84, 68, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.main; ctx.lineWidth = 1.6; ctx.stroke();
        txt(ctx, 'NGUỒN DC', srcX, cy - 16, C.mut, 9, 'center', 700);
        txt(ctx, (S.Va >= 0 ? '+' : '−') + Math.abs(S.Va).toFixed(3) + 'V', srcX, cy + 5, C.main, 12.5, 'center', 800);
        txt(ctx, 'T = ' + S.T + ' K', srcX, cy + 22, C.c1, 9.5, 'center', 600);

        // Điốt DO-41 đặt ngay trên nhánh trên
        drawDO41(ctx, dX, cy - 52, 1.15, glow, C.main);

        // Đèn báo dòng dẫn bên phải
        if (glow > 0.05) {
          ctx.save(); ctx.globalAlpha = 0.16 + glow * 0.55; dot(ctx, ledX, cy, 22 + glow * 24, C.main); ctx.restore();
        }
        dot(ctx, ledX, cy, 20, glow > 0.08 ? C.main : C.tint);
        ctx.beginPath(); ctx.arc(ledX, cy, 20, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.stroke();
        txt(ctx, S.Va >= 0 ? 'THUẬN' : 'NGƯỢC', ledX, cy + 0.5, glow > 0.2 ? C.bg : C.mut, 9.5, 'center', 800);

        // Thanh xếp chồng tỉ lệ J_p vs J_n phía dưới mạch
        const barX = W * 0.12, barY = H * 0.78, barW = W * 0.64, barH = 18;
        rr(ctx, barX, barY, barW, barH, 5); ctx.fillStyle = C.tint; ctx.fill();
        rr(ctx, barX, barY, Math.max(8, barW * fracP), barH, 5); ctx.fillStyle = C.c4; ctx.fill();
        rr(ctx, barX + barW * fracP, barY, Math.max(8, barW * fracN), barH, 5); ctx.fillStyle = C.c2; ctx.fill();
        txt(ctx, 'Lỗ trống J_p: ' + Math.round(fracP * 100) + '%', barX + 8, barY - 10, C.c4, 10, 'left', 700);
        txt(ctx, 'Electron J_n: ' + Math.round(fracN * 100) + '%', barX + barW - 8, barY - 10, C.c2, 10, 'right', 700);
        txt(ctx, 'J_s = ' + sci(m.Js, 2) + ' A/cm²  ·  I_s = ' + sci(m.Is, 2) + ' A  ·  J_p/J_n = ' + (m.Jp0 / m.Jn0).toFixed(2),
          barX + barW / 2, barY + barH + 13, C.ink, 10.2, 'center', 700);

        // 2 đồng hồ mini bên phải
        const gx = W - 62;
        drawMiniGauge(ctx, gx, H * 0.30, 21, 'Dòng I(V_a)', fmtCur(m.I), S.Va > 0 ? clamp((Math.log10(Math.max(1e-12, m.I)) + 10) / 9, 0, 1) : 0.04, S.Va >= 0 ? C.main : C.c5);
        drawMiniGauge(ctx, gx, H * 0.70, 21, 'Bão hòa I_s', sci(m.Is, 1) + ' A', clamp((Math.log10(Math.max(1e-18, m.Is)) + 18) / 8, 0, 1), C.c1);

        chip(ctx, 'I = I_s [exp(V_a/V_t) − 1]  ·  Thuận tăng mũ, ngược bão hòa −I_s', W * 0.44, 14, C.main, 'center');
      }
    },
    {
      title: 'Đặc tuyến I–V của điốt lý tưởng (Tuyến tính hoặc Log₁₀|I|) — đối chiếu Ví dụ 3.1 & 3.2',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const m = pnCalc({ Va: S.Va, Na: S.Na, Nd: S.Nd, tau: S.tau * 1e-6, A: S.A, T: S.T });
        const x0 = 56, y0 = 18, pw = W - x0 - 138, ph = H - y0 - 24;
        drawPlotFrame(ctx, x0, y0, pw, ph, 'V_a (V)', S.scale === 'log' ? 'log₁₀|I| (A)' : 'I (mA)');

        const vMin = -0.50, vMax = 0.78;
        const X = v => x0 + ((v - vMin) / (vMax - vMin)) * pw;

        for (let v = -0.4; v <= 0.8; v += 0.2) {
          const xv = X(v);
          ln(ctx, xv, y0, xv, y0 + ph, C.g, 0.7, [2, 3]);
          txt(ctx, v.toFixed(1), xv, y0 + ph + 10, C.mut, 9.2, 'center', 600);
        }
        ln(ctx, X(0), y0, X(0), y0 + ph, C.sub, 1.1);

        if (S.scale === 'lin') {
          const iMax = 5e-3; // 5 mA
          const yZero = y0 + ph * 0.84;
          const Y = iVal => yZero - clamp(iVal / iMax, -0.15, 1) * (yZero - y0 - 6);
          ln(ctx, x0, yZero, x0 + pw, yZero, C.sub, 1.1);
          [0, 1, 2, 3, 4, 5].forEach(ma => {
            const yv = Y(ma * 1e-3);
            ln(ctx, x0, yv, x0 + pw, yv, C.g, 0.6, [2, 3]);
            txt(ctx, ma + '', x0 - 5, yv, C.mut, 9.2, 'right', 600);
          });

          ctx.beginPath();
          for (let k = 0; k <= 120; k++) {
            const v = vMin + (k / 120) * (vMax - vMin);
            const iVal = m.Is * (expSafe(v / m.Vt) - 1);
            const px = X(v), py = Y(Math.min(iVal, iMax * 1.05));
            k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.strokeStyle = C.main; ctx.lineWidth = 2.4; ctx.stroke();

          // Đánh dấu điểm hiện tại
          const yCur = Y(Math.min(m.I, iMax));
          ln(ctx, X(S.Va), yZero, X(S.Va), yCur, C.c2, 1.2, [3, 2]);
          dot(ctx, X(S.Va), yCur, 5, C.c2);
        } else {
          const lgMin = -16, lgMax = -1;
          const Y = lg => y0 + ph - clamp((lg - lgMin) / (lgMax - lgMin), 0, 1) * (ph - 8) - 4;
          for (let lg = -15; lg <= -3; lg += 3) {
            const yv = Y(lg);
            ln(ctx, x0, yv, x0 + pw, yv, C.g, 0.6, [2, 3]);
            txt(ctx, p10(lg), x0 - 5, yv, C.mut, 8.8, 'right', 600);
          }
          // Đường bão hòa ngược −I_s
          const lgIs = Math.log10(Math.max(1e-18, m.Is));
          if (lgIs >= lgMin && lgIs <= lgMax) {
            ln(ctx, x0, Y(lgIs), x0 + pw, Y(lgIs), C.c5, 1.2, [4, 3]);
            txt(ctx, '|I| ≈ I_s', x0 + 6, Y(lgIs) - 8, C.c5, 9, 'left', 700);
          }
          ctx.beginPath();
          let started = false;
          for (let k = 0; k <= 140; k++) {
            const v = vMin + (k / 140) * (vMax - vMin);
            if (Math.abs(v) < 0.005) { started = false; continue; }
            const ai = Math.abs(m.Is * (expSafe(v / m.Vt) - 1));
            const lg = Math.log10(Math.max(1e-18, ai));
            if (lg < lgMin || lg > lgMax) { started = false; continue; }
            const px = X(v), py = Y(lg);
            if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = C.main; ctx.lineWidth = 2.4; ctx.stroke();

          const lgCur = Math.log10(Math.max(1e-18, Math.abs(m.I)));
          if (lgCur >= lgMin && lgCur <= lgMax) {
            ln(ctx, X(S.Va), y0, X(S.Va), y0 + ph, C.c2, 1.1, [3, 2]);
            dot(ctx, X(S.Va), Y(lgCur), 5, C.c2);
          }
        }

        // Bảng số liệu phải
        const rx = x0 + pw + 10;
        const v1mA = m.Vt * Math.log(1e-3 / m.Is);
        txt(ctx, 'Điểm làm việc:', rx, y0 + 12, C.mut, 9.6, 'left', 700);
        txt(ctx, 'V_a = ' + S.Va.toFixed(3) + ' V', rx, y0 + 28, C.ink, 10.2, 'left', 700);
        txt(ctx, 'I = ' + fmtCur(m.I), rx, y0 + 44, C.c2, 10.8, 'left', 800);
        txt(ctx, 'V_a (1 mA):', rx, y0 + 68, C.mut, 9.4, 'left', 700);
        txt(ctx, v1mA.toFixed(3) + ' V', rx, y0 + 83, C.main, 10.4, 'left', 800);
        txt(ctx, '×100 dòng: +' + (m.Vt * Math.log(100) * 1000).toFixed(0) + ' mV', rx, y0 + 102, C.c1, 9.2, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   5. b95-lab-05 (4.2) — THÀNH PHẦN DÒNG DỌC ĐIỐT (THIỂU SỐ → ĐA SỐ)
   ========================================================================== */
LABS.push({
  id: 'jcomp', anchor: 'b95-lab-05', tag: '4.2', name: 'Thành phần dòng', sec: 4,
  S: { ratio: 0.0, Lp: 22, Ln: 35, xProbe: 0.30 }, // ratio = log10(Na/Nd)
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Lát cắt thăm dò tại x — dòng lỗ trống & electron chuyển hóa cho nhau nhờ tái hợp',
      area: 'a', anim: true,
      ctrls: [
        { k: 'xProbe', l: 'Vị trí x', min: -1.0, max: 1.0, step: 0.02, f: v => (v >= 0 ? '+' : '−') + Math.round(Math.abs(v) * 100) + ' µm' },
        { k: 'ratio', l: 'Nₐ/N_d', min: -1.5, max: 1.5, step: 0.1, f: v => Math.pow(10, v).toFixed(1) + '×' },
        { k: 'Lp', l: 'L_p', min: 10, max: 60, step: 2, f: v => v + ' µm' },
        { k: 'Ln', l: 'L_n', min: 10, max: 60, step: 2, f: v => v + ' µm' },
        { btn: 'Điốt p⁺n', fn: p => { p.S.ratio = 1.2; p.S.xProbe = 0.25; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const Na = 1e16 * Math.pow(10, S.ratio / 2), Nd = 1e16 * Math.pow(10, -S.ratio / 2);
        const Dp = 10, Dn = 25;
        const jpEdgeRaw = (Dp / (S.Lp * 1e-4)) / Nd;
        const jnEdgeRaw = (Dn / (S.Ln * 1e-4)) / Na;
        const fP0 = jpEdgeRaw / (jpEdgeRaw + jnEdgeRaw);
        const fN0 = 1 - fP0;

        // Tính thành phần dòng chuẩn hóa tại vị trí xUm (-100..+100 µm)
        const xUm = S.xProbe * 100;
        const depHalf = 8; // ±8 µm trực quan cho vùng nghèo
        let fP, fN;
        if (xUm > depHalf) {
          fP = fP0 * Math.exp(-(xUm - depHalf) / S.Lp);
          fN = 1 - fP;
        } else if (xUm < -depHalf) {
          fN = fN0 * Math.exp((xUm + depHalf) / S.Ln);
          fP = 1 - fN;
        } else {
          fP = fP0; fN = fN0;
        }

        const bw = Math.min(344, W * 0.54), bd = Math.min(130, H * 0.36), bh = Math.min(90, H * 0.31);
        const ox = W * 0.22, oy = H * 0.72;
        const depW = bw * 0.08, jX = bw * 0.5, xL = jX - depW / 2, xR = jX + depW / 2;

        isoBox(ctx, ox, oy, 0, 0, 0, xL, bd, bh, C.card, 1, C.c4);
        isoBox(ctx, ox, oy, xL, 0, 0, depW, bd, bh, C.c5, 0.30, C.c5);
        isoBox(ctx, ox, oy, xR, 0, 0, bw - xR, bd, bh, C.card, 1, C.c2);

        // Vẽ 2 dải dòng xếp chồng dọc theo chiều x bên trong khối 3D!
        const segs = 24;
        for (let i = 0; i < segs; i++) {
          const xu = -100 + ((i + 0.5) / segs) * 200;
          const xx = (i / segs) * bw, sw = bw / segs;
          let fpSeg = fP0;
          if (xu > depHalf) fpSeg = fP0 * Math.exp(-(xu - depHalf) / S.Lp);
          else if (xu < -depHalf) fpSeg = 1 - fN0 * Math.exp((xu + depHalf) / S.Ln);
          const hP = bh * fpSeg;
          isoBox(ctx, ox, oy, xx, 4, 0, sw, bd - 8, Math.max(2, hP), C.c4, 0.36, 'transparent');
          isoBox(ctx, ox, oy, xx, 4, hP, sw, bd - 8, Math.max(2, bh - hP), C.c2, 0.36, 'transparent');
        }

        // Hạt chảy dọc theo luồng tương ứng
        for (let k = 0; k < 12; k++) {
          const u = (t * 0.55 + k / 12) % 1;
          const xx = u * bw;
          const xu = -100 + u * 200;
          const fpLocal = xu > depHalf ? fP0 * Math.exp(-(xu - depHalf) / S.Lp) : xu < -depHalf ? 1 - fN0 * Math.exp((xu + depHalf) / S.Ln) : fP0;
          const zP = bh * fpLocal * (0.2 + (k % 3) * 0.25);
          p3(ctx, ox, oy, xx, bd * (0.2 + (k % 3) * 0.3), zP, 3.8, C.c4, '+');
          const xxN = (1 - u) * bw;
          const xuN = -100 + (1 - u) * 200;
          const fpLocalN = xuN > depHalf ? fP0 * Math.exp(-(xuN - depHalf) / S.Lp) : xuN < -depHalf ? 1 - fN0 * Math.exp((xuN + depHalf) / S.Ln) : fP0;
          const zN = bh * fpLocalN + bh * (1 - fpLocalN) * (0.2 + (k % 3) * 0.25);
          p3(ctx, ox, oy, xxN, bd * (0.3 + (k % 2) * 0.4), zN, 3.8, C.c2, '−');
        }

        // Lát cắt thăm dò trong suốt tại vị trí xProbe
        const pxSlice = ((S.xProbe + 1) / 2) * bw;
        isoBox(ctx, ox, oy, pxSlice - 2, -6, -4, 4, bd + 12, bh + 10, C.main, 0.55, C.main);
        const topP = isoP(ox, oy, pxSlice, bd * 0.5, bh + 18);
        txt(ctx, 'Lát x=' + (xUm >= 0 ? '+' : '−') + Math.round(Math.abs(xUm)) + 'µm', topP[0], topP[1], C.main, 10.5, 'center', 800);

        // Cột xếp chồng J_p + J_n = 100% J_total ở bên phải
        const gx = W - 66;
        if (CAM) { ctx.save(); ctx.globalAlpha = 0.88; ctx.fillStyle = C.bg; rr(ctx, gx - 50, H * 0.16, 100, H * 0.72, 8); ctx.fill(); ctx.restore(); }
        txt(ctx, 'TẠI LÁT CẮT x', gx, H * 0.21, C.mut, 9.2, 'center', 700);
        const barW = 34, barH = H * 0.42, barY = H * 0.28;
        const hN = barH * fN, hP = barH * fP;
        rr(ctx, gx - barW / 2, barY, barW, barH, 5); ctx.fillStyle = C.tint; ctx.fill();
        ctx.fillStyle = C.c2; ctx.fillRect(gx - barW / 2, barY, barW, hN);
        ctx.fillStyle = C.c4; ctx.fillRect(gx - barW / 2, barY + hN, barW, hP);
        rr(ctx, gx - barW / 2, barY, barW, barH, 5); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.stroke();
        txt(ctx, 'J_n: ' + Math.round(fN * 100) + '%', gx, barY + barH + 16, C.c2, 10.2, 'center', 800);
        txt(ctx, 'J_p: ' + Math.round(fP * 100) + '%', gx, barY + barH + 31, C.c4, 10.2, 'center', 800);
        txt(ctx, 'Tổng = 100%', gx, barY + barH + 46, C.main, 10, 'center', 800);

        chip(ctx, 'Tái hợp biến dòng hạt thiểu số thành dòng hạt đa số — J_total luôn không đổi!', W * 0.43, 15, C.main, 'center');
      }
    },
    {
      title: 'Đồ thị thành phần dòng J_p(x), J_n(x) và J_total dọc điốt (nét liền: thiểu số · nét đứt: đa số)',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const Na = 1e16 * Math.pow(10, S.ratio / 2), Nd = 1e16 * Math.pow(10, -S.ratio / 2);
        const jpEdgeRaw = (10 / (S.Lp * 1e-4)) / Nd;
        const jnEdgeRaw = (25 / (S.Ln * 1e-4)) / Na;
        const fP0 = jpEdgeRaw / (jpEdgeRaw + jnEdgeRaw), fN0 = 1 - fP0;

        const x0 = 48, y0 = 18, pw = W - x0 - 134, ph = H - y0 - 24;
        drawPlotFrame(ctx, x0, y0, pw, ph, 'x (µm)', 'J / J_total');

        const depHalf = 8;
        const X = xu => x0 + ((xu + 100) / 200) * pw;
        const Y = f => y0 + ph - 6 - clamp(f, 0, 1) * (ph - 16);

        ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = C.c5;
        ctx.fillRect(X(-depHalf), y0 + 1, X(depHalf) - X(-depHalf), ph - 2); ctx.restore();
        ln(ctx, X(-depHalf), y0, X(-depHalf), y0 + ph, C.c5, 1, [3, 3]);
        ln(ctx, X(depHalf), y0, X(depHalf), y0 + ph, C.c5, 1, [3, 3]);

        // Đường ngang J_total = 1
        ln(ctx, x0, Y(1), x0 + pw, Y(1), C.main, 2.2);
        txt(ctx, 'J_total', x0 + 6, Y(1) - 8, C.main, 9.5, 'left', 800);
        txt(ctx, '1.0', x0 - 5, Y(1), C.mut, 9, 'right', 600);
        txt(ctx, '0.5', x0 - 5, Y(0.5), C.mut, 9, 'right', 600);
        txt(ctx, '0', x0 - 5, Y(0), C.mut, 9, 'right', 600);

        const drawSeg = (xA, xB, fn, col, dash) => {
          ctx.beginPath();
          for (let i = 0; i <= 40; i++) {
            const xu = xA + (i / 40) * (xB - xA);
            const px = X(xu), py = Y(fn(xu));
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
        };

        // Phía p (x < -depHalf): J_n thiểu số (nét liền), J_p đa số (nét đứt)
        drawSeg(-100, -depHalf, x => fN0 * Math.exp((x + depHalf) / S.Ln), C.c2, []);
        drawSeg(-100, -depHalf, x => 1 - fN0 * Math.exp((x + depHalf) / S.Ln), C.c4, [5, 3]);
        // Trong vùng nghèo: hằng số
        drawSeg(-depHalf, depHalf, () => fP0, C.c4, []);
        drawSeg(-depHalf, depHalf, () => fN0, C.c2, []);
        // Phía n (x > depHalf): J_p thiểu số (nét liền), J_n đa số (nét đứt)
        drawSeg(depHalf, 100, x => fP0 * Math.exp(-(x - depHalf) / S.Lp), C.c4, []);
        drawSeg(depHalf, 100, x => 1 - fP0 * Math.exp(-(x - depHalf) / S.Lp), C.c2, [5, 3]);

        // Vạch lát cắt xProbe
        const xUm = S.xProbe * 100;
        const fpNow = xUm > depHalf ? fP0 * Math.exp(-(xUm - depHalf) / S.Lp) : xUm < -depHalf ? 1 - fN0 * Math.exp((xUm + depHalf) / S.Ln) : fP0;
        const fnNow = 1 - fpNow;
        ln(ctx, X(xUm), y0, X(xUm), y0 + ph, C.main, 1.5, [3, 2]);
        dot(ctx, X(xUm), Y(fpNow), 4.5, C.c4);
        dot(ctx, X(xUm), Y(fnNow), 4.5, C.c2);

        txt(ctx, 'Vùng p', x0 + pw * 0.22, y0 + ph + 10, C.c4, 9.5, 'center', 700);
        txt(ctx, 'Vùng n', x0 + pw * 0.78, y0 + ph + 10, C.c2, 9.5, 'center', 700);

        const rx = x0 + pw + 10;
        txt(ctx, 'Tại x = ' + (xUm >= 0 ? '+' : '−') + Math.round(Math.abs(xUm)) + ' µm:', rx, y0 + 14, C.main, 9.6, 'left', 700);
        txt(ctx, 'J_p = ' + Math.round(fpNow * 100) + '% ' + (xUm > depHalf ? '(thiểu số)' : '(đa số)'), rx, y0 + 34, C.c4, 9.6, 'left', 700);
        txt(ctx, 'J_n = ' + Math.round(fnNow * 100) + '% ' + (xUm < -depHalf ? '(thiểu số)' : '(đa số)'), rx, y0 + 52, C.c2, 9.6, 'left', 700);
        txt(ctx, 'Ở tiếp giáp:', rx, y0 + 76, C.mut, 9.3, 'left', 700);
        txt(ctx, 'J_p/J_n = ' + (fP0 / Math.max(1e-4, fN0)).toFixed(2), rx, y0 + 92, C.ink, 10, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   6. b95-lab-06 (4.5) — ĐIỐT DÀI VÀ ĐIỐT NGẮN (W_n vs L_p)
   ========================================================================== */
LABS.push({
  id: 'short', anchor: 'b95-lab-06', tag: '4.5', name: 'Điốt dài/ngắn', sec: 4,
  S: { wnRatio: 0.40, Lp: 22.4, Va: 0.60 }, // wnRatio = W_n / L_p
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Tiếp xúc ohmic trượt lại gần mép vùng nghèo — hạt thiểu số chưa kịp tái hợp đã tới tiếp xúc',
      area: 'a', anim: true,
      ctrls: [
        { k: 'wnRatio', l: 'W_n / L_p', min: 0.08, max: 5.0, step: 0.04, f: v => v.toFixed(2) + '×' },
        { k: 'Lp', l: 'L_p', min: 10, max: 50, step: 1, f: v => v.toFixed(1) + ' µm' },
        { k: 'Va', l: 'V_a', min: 0.45, max: 0.68, step: 0.01, f: v => v.toFixed(2) + ' V' },
        { btn: 'Điốt ngắn (0,1×)', fn: p => { p.S.wnRatio = 0.10; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Điốt dài (4×)', fn: p => { p.S.wnRatio = 4.0; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const r = S.wnRatio;
        const WnUm = r * S.Lp;
        const boostExact = 1 / Math.tanh(r); // coth(Wn/Lp) = J_p(exact) / J_p(long)
        const boostShort = 1 / r;            // Lp / Wn
        const regime = r <= 0.35 ? 'short' : r >= 2.5 ? 'long' : 'trans';
        const regCol = regime === 'short' ? C.err : regime === 'long' ? C.c2 : C.main;

        const maxW = Math.min(310, W * 0.50), bd = Math.min(130, H * 0.36), bh = Math.min(92, H * 0.32);
        const ox = W * 0.22, oy = H * 0.72;
        const wnPx = clamp(28 + (Math.min(r, 5) / 5) * (maxW - 28), 28, maxW);

        // Mép vùng nghèo bên trái
        isoBox(ctx, ox, oy, -26, 0, 0, 26, bd, bh, C.c5, 0.34, C.c5);
        // Vùng n trung hòa dài wnPx
        isoBox(ctx, ox, oy, 0, 0, 0, wnPx, bd, bh, C.card, 1, C.c2);
        // Tiếp xúc kim loại Ohmic bên phải (trượt theo W_n!)
        isoBox(ctx, ox, oy, wnPx, -4, -3, 18, bd + 8, bh + 6, C.sub, 0.92, C.ink);

        // Đám mây lỗ trống dư trong vùng n: đậm ở x=0, về 0 tại x=wnPx
        const sl = 10;
        for (let i = 0; i < sl; i++) {
          const u = (i + 0.5) / sl;
          const prof = Math.sinh(r * (1 - u)) / Math.sinh(r);
          isoBox(ctx, ox, oy, (i / sl) * wnPx, 3, 3, wnPx / sl, bd - 6, bh - 6, C.c4, prof * 0.58, 'transparent');
        }

        // Dòng lỗ trống lao nhanh hơn khi W_n ngắn!
        const nP = Math.round(clamp(5 + boostExact * 2.4, 6, 18));
        const spd = clamp(0.45 * Math.sqrt(boostExact), 0.4, 2.2);
        for (let k = 0; k < nP; k++) {
          const u = (t * spd + k / nP) % 1;
          const surv = Math.sinh(r * (1 - u)) / Math.sinh(r);
          if (u < 0.98 && (regime === 'short' || surv > 0.05)) {
            p3(ctx, ox, oy, u * wnPx, bd * (0.16 + (k % 4) * 0.22), bh * (0.24 + (k % 2) * 0.48), 4.1, C.c4, '+');
          }
        }

        const lbJ = isoP(ox, oy, -13, bd * 0.5, bh + 16);
        const lbM = isoP(ox, oy, wnPx + 9, bd * 0.5, bh + 18);
        txt(ctx, 'Mép x_n', lbJ[0], lbJ[1], C.c5, 10, 'center', 700);
        txt(ctx, 'Ohmic (δp_n=0)', lbM[0], lbM[1], C.ink, 10, 'center', 700);

        const gx = W - 64;
        drawMiniGauge(ctx, gx, H * 0.22, 20, 'Bề rộng W_n', WnUm.toFixed(1) + ' µm', clamp(r / 5, 0, 1), C.c1);
        drawMiniGauge(ctx, gx, H * 0.52, 20, 'J_p / J_p(dài)', '×' + boostExact.toFixed(2), clamp((boostExact - 1) / 8, 0, 1), regCol, 0.55);
        drawMiniGauge(ctx, gx, H * 0.82, 20, 'Xấp xỉ L_p/W_n', '×' + boostShort.toFixed(2), clamp((boostShort - 1) / 8, 0, 1), C.main);

        const lbl = regime === 'short' ? 'ĐIỐT NGẮN (W_n ≪ L_p): phân bố tuyến tính, thay L_p → W_n (dòng tăng mạnh!)'
          : regime === 'long' ? 'ĐIỐT DÀI (W_n ≫ L_p): hạt tắt hết trước tiếp xúc, dùng L_p'
          : 'VÙNG CHUYỂN TIẾP (W_n ~ L_p): dùng nghiệm chính xác coth(W_n/L_p)';
        chip(ctx, lbl, W * 0.44, 15, regCol, 'center');
      }
    },
    {
      title: 'So sánh phân bố δp_n(x): Nghiệm chính xác (sinh) · Điốt dài (mũ e⁻ˢ/ᴸᵖ) · Điốt ngắn (tuyến tính)',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, r = S.wnRatio, WnUm = r * S.Lp;
        const x0 = 50, y0 = 18, pw = W - x0 - 144, ph = H - y0 - 24;
        drawPlotFrame(ctx, x0, y0, pw, ph, 's = x − x_n (µm)', 'δp_n / δp_n(x_n)');

        const sView = Math.max(WnUm * 1.15, S.Lp * 1.6);
        const X = s => x0 + clamp(s / sView, 0, 1) * pw;
        const Y = v => y0 + ph - 6 - clamp(v, 0, 1) * (ph - 16);

        txt(ctx, '1.0', x0 - 5, Y(1), C.mut, 9, 'right', 600);
        txt(ctx, '0.37', x0 - 5, Y(Math.exp(-1)), C.mut, 8.8, 'right', 600);
        txt(ctx, '0', x0 - 5, Y(0), C.mut, 9, 'right', 600);
        ln(ctx, x0, Y(Math.exp(-1)), x0 + pw, Y(Math.exp(-1)), C.g, 0.7, [2, 3]);

        // Vạch tiếp xúc Ohmic tại s = W_n
        const xWn = X(WnUm);
        ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = C.sub; ctx.fillRect(xWn, y0 + 1, x0 + pw - xWn, ph - 2); ctx.restore();
        ln(ctx, xWn, y0, xWn, y0 + ph, C.ink, 1.8);
        txt(ctx, 'W_n=' + WnUm.toFixed(1) + 'µm', xWn, y0 + ph + 10, C.ink, 9.2, 'center', 700);

        // 1) Đường mũ điốt dài (nét đứt xanh lam)
        ctx.beginPath();
        for (let i = 0; i <= 70; i++) {
          const s = (i / 70) * sView;
          const px = X(s), py = Y(Math.exp(-s / S.Lp));
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.strokeStyle = C.c1; ctx.lineWidth = 1.8; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);

        // 2) Đường tuyến tính điốt ngắn (nét đứt cam)
        ln(ctx, X(0), Y(1), xWn, Y(0), C.c5, 1.8, [3, 3]);

        // 3) Đường chính xác sinh (nét liền đỏ/main đậm)
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const s = (i / 60) * WnUm;
          const val = Math.sinh((WnUm - s) / S.Lp) / Math.sinh(WnUm / S.Lp);
          const px = X(s), py = Y(val);
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.strokeStyle = C.c4; ctx.lineWidth = 2.6; ctx.stroke();

        // Chú thích
        const rx = x0 + pw + 10;
        txt(ctx, '— Chính xác (sinh)', rx, y0 + 14, C.c4, 9.6, 'left', 700);
        txt(ctx, '-- Điốt dài (mũ L_p)', rx, y0 + 32, C.c1, 9.6, 'left', 700);
        txt(ctx, '·· Điốt ngắn (thẳng)', rx, y0 + 50, C.c5, 9.6, 'left', 700);
        txt(ctx, 'Tỉ số dòng tại mép:', rx, y0 + 72, C.mut, 9.2, 'left', 700);
        txt(ctx, 'J_p / J_dài = ×' + (1 / Math.tanh(r)).toFixed(2), rx, y0 + 88, C.main, 10.5, 'left', 800);
      }
    }
  ]
});

/* ==========================================================================
   7. b95-lab-07 (5.6) — BA VÙNG CỦA ĐẶC TUYẾN THUẬN (TÁI HỢP · LÝ TƯỞNG · MỨC CAO + r_s)
   ========================================================================== */
LABS.push({
  id: 'real', anchor: 'b95-lab-07', tag: '5.6', name: '3 vùng thuận', sec: 5,
  S: { Va: 0.50, tau0: 0.5, Nd: 1e16, rs: 2.0, T: 300 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Cơ chế chi phối theo điện áp — Bẫy tái hợp (a) → Khuếch tán (b) → Phun mức cao & nóng r_s (c)',
      area: 'a', anim: true,
      ctrls: [
        { k: 'Va', l: 'V_a', min: 0.15, max: 1.00, step: 0.01, f: v => v.toFixed(2) + ' V' },
        { k: 'tau0', l: 'τ₀', min: 0.05, max: 5.0, step: 0.05, f: v => v.toFixed(2) + ' µs' },
        { k: 'Nd', l: 'N_d', min: 15, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'rs', l: 'r_s', min: 0, max: 10, step: 0.5, f: v => v.toFixed(1) + ' Ω' },
        { k: 'T', l: 'T', min: 270, max: 350, step: 5, f: v => v + ' K' },
        { btn: 'VD 5.2 (0,39V)', fn: p => { p.S.Va = 0.39; p.S.tau0 = 0.5; p.S.Nd = 1e16; p.S.rs = 2.0; p.S.T = 300; p.syncCtrls(); p.dirty = true; } },
        { btn: 'VD 5.3 (0,70V)', fn: p => { p.S.Va = 0.70; p.S.tau0 = 0.5; p.S.Nd = 1e16; p.S.rs = 2.0; p.S.T = 300; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const m = pnCalc({ Na: 1e16, Nd: S.Nd, tau: S.tau0 * 1e-6, T: S.T, A: 1e-4, Va: S.Va });
        const Wlow = 0.3e-4; // 0.3 µm đúng Ví dụ 5.2
        const Jr0 = (E_CHG * Wlow * m.ni) / (2 * S.tau0 * 1e-6);
        const Ir0 = m.A * Jr0;
        const VcrossAB = 2 * m.Vt * Math.log(Math.max(1.01, Jr0 / m.Js));
        const VcrossBC = m.VhiN;
        const Ihi = m.Is * expSafe(VcrossBC / m.Vt);

        const res = realDiodeCurrent(S.Va, { Vt: m.Vt, Ir0, Is: m.Is, Ihi, rs: S.rs });
        const reg = S.Va < VcrossAB ? 'a' : S.Va < VcrossBC ? 'b' : 'c';
        const regCol = reg === 'a' ? C.c5 : reg === 'b' ? C.c2 : C.err;

        const bw = Math.min(340, W * 0.52), bd = Math.min(126, H * 0.35), bh = Math.min(86, H * 0.30);
        const ox = W * 0.22, oy = H * 0.73;
        const depW = 54, jX = bw * 0.5, xL = jX - depW / 2, xR = jX + depW / 2;

        // Điện trở nối tiếp r_s hai đầu (nóng đỏ rực ở vùng c khi có r_s > 0!)
        const heatRs = reg === 'c' && S.rs > 0 ? clamp((res.Itot * S.rs) / 0.25, 0.2, 1) : 0;
        isoBox(ctx, ox, oy, -18, 0, 0, 18, bd, bh, heatRs > 0.1 ? C.err : C.sub, 0.5 + heatRs * 0.45, C.ink);
        isoBox(ctx, ox, oy, bw, 0, 0, 18, bd, bh, heatRs > 0.1 ? C.err : C.sub, 0.5 + heatRs * 0.45, C.ink);

        // Thân p-n
        isoBox(ctx, ox, oy, 0, 0, 0, xL, bd, bh, reg === 'c' ? C.err : C.c4, reg === 'c' ? 0.35 : 0.20, C.c4);
        isoBox(ctx, ox, oy, xL, 0, 0, depW, bd, bh, C.c5, reg === 'a' ? 0.45 : 0.22, C.c5);
        isoBox(ctx, ox, oy, xR, 0, 0, bw - xR, bd, bh, reg === 'c' ? C.err : C.c2, reg === 'c' ? 0.35 : 0.20, C.c2);

        // Vùng a: các bẫy tái hợp nhấp nháy ngay trong vùng nghèo!
        for (let k = 0; k < 5; k++) {
          const tz = 14 + (k / 4) * (bh - 28), ty = bd * (0.22 + (k % 3) * 0.28);
          const q = isoP(ox, oy, jX, ty, tz);
          if (reg === 'a') {
            const pulse = 0.5 + 0.5 * Math.sin(t * 7 + k * 1.4);
            ctx.beginPath(); ctx.arc(q[0], q[1], 5 + pulse * 6, 0, TAU2);
            ctx.strokeStyle = C.err; ctx.lineWidth = 1.6; ctx.stroke();
          }
          dot(ctx, q[0], q[1], reg === 'a' ? 4.2 : 2.6, reg === 'a' ? C.err : C.mut);
        }

        // Hạt chảy
        const nFlow = reg === 'a' ? 5 : reg === 'b' ? 10 : 16;
        for (let k = 0; k < nFlow; k++) {
          const u = (t * (reg === 'a' ? 0.5 : reg === 'b' ? 0.9 : 1.4) + k / nFlow) % 1;
          const xMax = reg === 'a' ? jX : bw - 6;
          p3(ctx, ox, oy, 6 + u * (xMax - 6), bd * (0.18 + (k % 4) * 0.22), bh * (0.25 + (k % 2) * 0.48), 3.9, C.c4, '+');
          const xMin = reg === 'a' ? jX : 6;
          p3(ctx, ox, oy, bw - 6 - u * (bw - 6 - xMin), bd * (0.22 + (k % 3) * 0.28), bh * (0.28 + ((k + 1) % 2) * 0.44), 3.9, C.c2, '−');
        }

        if (heatRs > 0.1) {
          const pRs = isoP(ox, oy, bw + 9, bd * 0.5, bh + 18);
          txt(ctx, 'Sụt áp I·r_s = ' + (res.Itot * S.rs).toFixed(2) + 'V', pRs[0], pRs[1], C.err, 10, 'center', 800);
        }

        const gx = W - 64;
        drawMiniGauge(ctx, gx, H * 0.21, 19, 'Hệ số lý tưởng n', res.nLoc > 8 ? '>8 (r_s!)' : res.nLoc.toFixed(2), clamp((res.nLoc - 1) / 2.2, 0, 1), regCol, 0.65);
        drawMiniGauge(ctx, gx, H * 0.51, 19, 'Dòng tổng I', fmtCur(res.Itot), clamp((Math.log10(Math.max(1e-12, res.Itot)) + 11) / 10, 0, 1), C.main);
        drawMiniGauge(ctx, gx, H * 0.81, 19, 'Tỉ lệ I_rec / I', Math.round((res.Irec / Math.max(1e-30, res.Itot)) * 100) + '%', res.Irec / Math.max(1e-30, res.Itot), C.c5);

        const msg = reg === 'a' ? 'VÙNG a (Thấp): Tái hợp trong vùng nghèo chi phối (n ≈ 2 · 120 mV/dec)'
          : reg === 'b' ? 'VÙNG b (Trung bình): Khuếch tán lý tưởng chi phối (n ≈ 1 · 60 mV/dec)'
          : 'VÙNG c (Cao): Phun mức cao + điện trở nối tiếp r_s làm dòng tăng chậm lại!';
        chip(ctx, msg, W * 0.44, 14, regCol, 'center');
      }
    },
    {
      title: 'Đồ thị log₁₀(I) theo V_a: 3 vùng (a: tái hợp · b: lý tưởng · c: mức cao + r_s) & 2 điểm chuyển vùng',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const m = pnCalc({ Na: 1e16, Nd: S.Nd, tau: S.tau0 * 1e-6, T: S.T, A: 1e-4, Va: S.Va });
        const Wlow = 0.3e-4;
        const Jr0 = (E_CHG * Wlow * m.ni) / (2 * S.tau0 * 1e-6);
        const Ir0 = m.A * Jr0;
        const Vab = 2 * m.Vt * Math.log(Math.max(1.01, Jr0 / m.Js));
        const Vbc = m.VhiN;
        const Ihi = m.Is * expSafe(Vbc / m.Vt);

        const x0 = 54, y0 = 18, pw = W - x0 - 140, ph = H - y0 - 24;
        drawPlotFrame(ctx, x0, y0, pw, ph, 'V_a (V)', 'log₁₀(I)');

        const vMin = 0.10, vMax = 1.05, lgMin = -11, lgMax = 0;
        const X = v => x0 + clamp((v - vMin) / (vMax - vMin), 0, 1) * pw;
        const Y = lg => y0 + ph - clamp((lg - lgMin) / (lgMax - lgMin), 0, 1) * (ph - 8) - 4;

        // Tô màu 3 vùng a, b, c
        const xAB = X(Vab), xBC = X(Vbc);
        ctx.save(); ctx.globalAlpha = 0.10;
        ctx.fillStyle = C.c5; ctx.fillRect(x0 + 1, y0 + 1, Math.max(0, xAB - x0 - 1), ph - 2);
        ctx.fillStyle = C.c2; ctx.fillRect(xAB, y0 + 1, Math.max(0, xBC - xAB), ph - 2);
        ctx.fillStyle = C.err; ctx.fillRect(xBC, y0 + 1, Math.max(0, x0 + pw - xBC - 1), ph - 2);
        ctx.restore();
        txt(ctx, 'a (n≈2)', (x0 + xAB) / 2, y0 + 12, C.c5, 9.5, 'center', 800);
        txt(ctx, 'b (n≈1)', (xAB + xBC) / 2, y0 + 12, C.c2, 9.5, 'center', 800);
        txt(ctx, 'c (cao+r_s)', (xBC + x0 + pw) / 2, y0 + 12, C.err, 9.5, 'center', 800);

        for (let v = 0.2; v <= 1.01; v += 0.2) {
          ln(ctx, X(v), y0, X(v), y0 + ph, C.g, 0.6, [2, 3]);
          txt(ctx, v.toFixed(1), X(v), y0 + ph + 10, C.mut, 9, 'center', 600);
        }
        for (let lg = -10; lg <= 0; lg += 2) {
          ln(ctx, x0, Y(lg), x0 + pw, Y(lg), C.g, 0.6, [2, 3]);
          txt(ctx, p10(lg), x0 - 4, Y(lg), C.mut, 8.8, 'right', 600);
        }

        // Vẽ 2 đường tiệm cận đứt nét: tái hợp (120 mV/dec) & khuếch tán (60 mV/dec)
        const plotFn = (fn, col, lw, dash) => {
          ctx.beginPath(); let st = false;
          for (let i = 0; i <= 95; i++) {
            const v = vMin + (i / 95) * (vMax - vMin);
            const lg = Math.log10(Math.max(1e-20, fn(v)));
            if (lg < lgMin || lg > lgMax) { st = false; continue; }
            const px = X(v), py = Y(lg);
            if (!st) { ctx.moveTo(px, py); st = true; } else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
        };
        plotFn(v => Ir0 * expSafe(v / (2 * m.Vt)), C.c5, 1.3, [4, 3]);
        plotFn(v => m.Is * expSafe(v / m.Vt), C.c2, 1.3, [4, 3]);
        // Đường tổng thực tế
        plotFn(v => realDiodeCurrent(v, { Vt: m.Vt, Ir0, Is: m.Is, Ihi, rs: S.rs }).Itot, C.main, 2.5, []);

        // Vạch 2 điểm giao a→b và b→c
        ln(ctx, xAB, y0 + 20, xAB, y0 + ph, C.c5, 1.1, [3, 3]);
        ln(ctx, xBC, y0 + 20, xBC, y0 + ph, C.err, 1.1, [3, 3]);

        // Điểm đang xét
        const cur = realDiodeCurrent(S.Va, { Vt: m.Vt, Ir0, Is: m.Is, Ihi, rs: S.rs });
        const lgCur = Math.log10(Math.max(1e-20, cur.Itot));
        ln(ctx, X(S.Va), y0, X(S.Va), y0 + ph, C.ink, 1.1, [2, 2]);
        if (lgCur >= lgMin && lgCur <= lgMax) dot(ctx, X(S.Va), Y(lgCur), 5, C.main);

        const rx = x0 + pw + 10;
        txt(ctx, 'Giao a→b: ' + Vab.toFixed(2) + ' V', rx, y0 + 16, C.c5, 9.6, 'left', 700);
        txt(ctx, 'Giao b→c: ' + Vbc.toFixed(2) + ' V', rx, y0 + 34, C.err, 9.6, 'left', 700);
        txt(ctx, 'Tại V_a = ' + S.Va.toFixed(2) + ' V:', rx, y0 + 58, C.mut, 9.4, 'left', 700);
        txt(ctx, 'I = ' + fmtCur(cur.Itot), rx, y0 + 74, C.main, 10.4, 'left', 800);
        txt(ctx, 'n(V_a) = ' + (cur.nLoc > 8 ? '>8' : cur.nLoc.toFixed(2)), rx, y0 + 92, C.ink, 10, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   8. b95-lab-08 (5.7) — DÒNG SINH KHI PHÂN CỰC NGƯỢC
   ========================================================================== */
LABS.push({
  id: 'gen', anchor: 'b95-lab-08', tag: '5.7', name: 'Dòng sinh ngược', sec: 5,
  S: { VR: 5.0, N: 1e16, tau0: 0.5, T: 300, scale: 'log' },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Vùng nghèo rộng ra theo √(V_bi + V_R), sinh cặp e⁻–h⁺ bị điện trường quét mạnh về hai cực',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VR', l: 'V_R', min: 0, max: 50, step: 0.5, f: v => v.toFixed(1) + ' V' },
        { k: 'N', l: 'Nₐ=N_d', min: 15, max: 17, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'tau0', l: 'τ₀', min: 0.05, max: 5.0, step: 0.05, f: v => v.toFixed(2) + ' µs' },
        { k: 'T', l: 'T', min: 270, max: 360, step: 5, f: v => v + ' K' },
        { k: 'scale', seg: [['log', 'Log₁₀|J|'], ['lin', 'Tuyến tính']] },
        { btn: 'VD 5.1 (5V)', fn: p => { p.S.VR = 5.0; p.S.N = 1e16; p.S.tau0 = 0.5; p.S.T = 300; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const m = pnCalc({ Na: S.N, Nd: S.N, tau: S.tau0 * 1e-6, T: S.T, Va: -S.VR });
        const Jgen = (E_CHG * m.ni * m.W) / (2 * S.tau0 * 1e-6);
        const JR = m.Js + Jgen;
        const nearVB = S.VR >= m.VB * 0.75;

        const bw = Math.min(340, W * 0.54), bd = Math.min(130, H * 0.36), bh = Math.min(90, H * 0.31);
        const ox = W * 0.22, oy = H * 0.72;
        const depW = clamp(44 + Math.sqrt(S.VR / 50) * (bw * 0.52), 44, bw * 0.68);
        const jX = bw * 0.5, xL = jX - depW / 2, xR = jX + depW / 2;

        isoBox(ctx, ox, oy, 0, 0, 0, xL, bd, bh, C.c4, 0.22, C.c4);
        isoBox(ctx, ox, oy, xL, 0, 0, depW, bd, bh, nearVB ? C.err : C.c5, nearVB ? 0.36 : 0.26, nearVB ? C.err : C.c5);
        isoBox(ctx, ox, oy, xR, 0, 0, bw - xR, bd, bh, C.c2, 0.22, C.c2);

        // Các cặp e⁻–h⁺ sinh ra từ tâm bẫy trong vùng nghèo rồi bị tách quét về 2 phía!
        const nGen = Math.round(clamp(3 + (depW / 44) * 3.5 + (0.5 / Math.max(0.1, S.tau0)), 4, 14));
        for (let k = 0; k < nGen; k++) {
          const u = (t * (0.65 + S.VR * 0.02) + k / nGen) % 1;
          const xSpawn = xL + ((k * 0.618) % 1) * depW;
          const yS = bd * (0.16 + (k % 4) * 0.22), zS = bh * (0.24 + (k % 2) * 0.48);
          if (u < 0.16) {
            const q = isoP(ox, oy, xSpawn, yS, zS);
            ctx.beginPath(); ctx.arc(q[0], q[1], 3 + u * 35, 0, TAU2);
            ctx.strokeStyle = C.main; ctx.lineWidth = 1.5; ctx.stroke();
          }
          // Electron bị quét về phía n (phải), lỗ trống bị quét về phía p (trái)
          const xe = lerp(xSpawn, bw - 6, u);
          const xh = lerp(xSpawn, 6, u);
          p3(ctx, ox, oy, xe, yS, zS, 3.8, C.c2, '−');
          p3(ctx, ox, oy, xh, yS, zS, 3.8, C.c4, '+');
        }

        // Mũi tên điện trường E (từ n → p)
        const eR = isoP(ox, oy, xR - 4, bd * 0.5, bh + 15);
        const eL = isoP(ox, oy, xL + 4, bd * 0.5, bh + 15);
        arr(ctx, eR[0], eR[1], eL[0], eL[1], nearVB ? C.err : C.main, 2.4);
        txt(ctx, 'W(V_R) = ' + fmtLen(m.W), (eL[0] + eR[0]) / 2, eL[1] - 12, C.c5, 10.5, 'center', 800);

        const gx = W - 64;
        drawMiniGauge(ctx, gx, H * 0.21, 19, 'Dòng ngược J_R', sci(JR, 1), clamp((Math.log10(Math.max(1e-12, JR)) + 11) / 7, 0, 1), C.main);
        drawMiniGauge(ctx, gx, H * 0.51, 19, 'J_gen / J_s', (Jgen / m.Js) >= 100 ? sci(Jgen / m.Js, 1) + '×' : (Jgen / m.Js).toFixed(1) + '×', clamp(Math.log10(Math.max(1, Jgen / m.Js)) / 5, 0, 1), C.c5);
        drawMiniGauge(ctx, gx, H * 0.81, 19, 'Cảnh báo V_B', S.VR.toFixed(0) + '/' + m.VB.toFixed(0) + 'V', clamp(S.VR / m.VB, 0, 1), C.c1, 0.75);

        chip(ctx, nearVB ? 'CẢNH BÁO: V_R tiến sát điện áp đánh thủng V_B ≈ ' + m.VB.toFixed(0) + ' V (Buổi 9)!'
          : 'Dòng sinh J_gen ∝ W ∝ √(V_bi + V_R) — dòng ngược thật KHÔNG bão hòa phẳng!',
          W * 0.44, 15, nearVB ? C.err : C.main, 'center');
      }
    },
    {
      title: 'Đồ thị |J_R| theo V_R (0 → 50 V): so sánh J_s lý tưởng (phẳng) vs J_gen (tăng theo √V_R)',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const mCur = pnCalc({ Na: S.N, Nd: S.N, tau: S.tau0 * 1e-6, T: S.T, Va: -S.VR });
        const JgenCur = (E_CHG * mCur.ni * mCur.W) / (2 * S.tau0 * 1e-6);
        const JRcur = mCur.Js + JgenCur;

        const mMax = pnCalc({ Na: S.N, Nd: S.N, tau: S.tau0 * 1e-6, T: S.T, Va: -50 });
        const Jmax = mMax.Js + (E_CHG * mMax.ni * mMax.W) / (2 * S.tau0 * 1e-6);

        const x0 = 56, y0 = 18, pw = W - x0 - 140, ph = H - y0 - 24;
        drawPlotFrame(ctx, x0, y0, pw, ph, 'V_R (V)', S.scale === 'log' ? 'log₁₀|J_R|' : '|J_R| (A/cm²)');

        const X = vr => x0 + clamp(vr / 50, 0, 1) * pw;
        for (let vr = 0; vr <= 50; vr += 10) {
          ln(ctx, X(vr), y0, X(vr), y0 + ph, C.g, 0.6, [2, 3]);
          txt(ctx, vr + '', X(vr), y0 + ph + 10, C.mut, 9, 'center', 600);
        }

        const lgMax = Math.ceil(Math.log10(Math.max(1e-12, Jmax))) + 0.5;
        const lgMin = Math.floor(Math.log10(Math.max(1e-15, Math.min(mCur.Js, JgenCur)))) - 0.8;
        const Y = j => {
          if (S.scale === 'log') {
            return y0 + ph - clamp((Math.log10(Math.max(1e-20, j)) - lgMin) / Math.max(1, lgMax - lgMin), 0, 1) * (ph - 10) - 5;
          }
          return y0 + ph - 5 - clamp(j / (Jmax * 1.1), 0, 1) * (ph - 12);
        };

        if (S.scale === 'log') {
          for (let lg = Math.ceil(lgMin); lg <= lgMax; lg += 2) {
            ln(ctx, x0, Y(Math.pow(10, lg)), x0 + pw, Y(Math.pow(10, lg)), C.g, 0.6, [2, 3]);
            txt(ctx, p10(lg), x0 - 4, Y(Math.pow(10, lg)), C.mut, 8.8, 'right', 600);
          }
        } else {
          txt(ctx, sci(Jmax * 1.1, 1), x0 - 4, y0 + 8, C.mut, 8.6, 'right', 600);
          txt(ctx, '0', x0 - 4, y0 + ph - 5, C.mut, 8.8, 'right', 600);
        }

        // Đường ngang J_s lý tưởng
        ln(ctx, x0, Y(mCur.Js), x0 + pw, Y(mCur.Js), C.c1, 1.6, [5, 3]);
        txt(ctx, 'J_s lý tưởng', x0 + 6, Y(mCur.Js) - 8, C.c1, 9, 'left', 700);

        // Đường J_gen và tổng J_R
        const plotCurve = (addJs, col, lw, dash) => {
          ctx.beginPath();
          for (let i = 0; i <= 70; i++) {
            const vr = (i / 70) * 50;
            const Wv = mCur.W0 * Math.sqrt((mCur.Vbi + vr) / mCur.Vbi);
            const jv = (E_CHG * mCur.ni * Wv) / (2 * S.tau0 * 1e-6) + (addJs ? mCur.Js : 0);
            const px = X(vr), py = Y(jv);
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
        };
        plotCurve(false, C.c5, 1.5, [3, 3]);
        plotCurve(true, C.main, 2.4, []);

        // Vạch điện áp đánh thủng V_B nếu nằm trong [0, 50]
        if (mCur.VB < 50) {
          ln(ctx, X(mCur.VB), y0, X(mCur.VB), y0 + ph, C.err, 1.6, [4, 2]);
          txt(ctx, 'V_B≈' + mCur.VB.toFixed(0) + 'V', X(mCur.VB) - 4, y0 + 12, C.err, 9, 'right', 700);
        }

        ln(ctx, X(S.VR), y0, X(S.VR), y0 + ph, C.ink, 1.1, [2, 2]);
        dot(ctx, X(S.VR), Y(JRcur), 5, C.main);

        const rx = x0 + pw + 10;
        txt(ctx, 'V_R = ' + S.VR.toFixed(1) + ' V', rx, y0 + 14, C.ink, 9.8, 'left', 700);
        txt(ctx, 'W = ' + fmtLen(mCur.W), rx, y0 + 30, C.c5, 9.8, 'left', 700);
        txt(ctx, 'J_gen = ' + sci(JgenCur, 2), rx, y0 + 48, C.main, 9.8, 'left', 700);
        txt(ctx, 'J_s = ' + sci(mCur.Js, 2), rx, y0 + 66, C.c1, 9.6, 'left', 700);
        txt(ctx, 'J_gen/J_s = ' + ((JgenCur / mCur.Js) >= 100 ? sci(JgenCur / mCur.Js, 1) : (JgenCur / mCur.Js).toFixed(1)), rx, y0 + 86, C.err, 9.8, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   9. b95-lab-09 (6.6) — MÔ HÌNH TÍN HIỆU NHỎ CỦA ĐIỐT (r_d, C_d, C_j, r_s)
   ========================================================================== */
LABS.push({
  id: 'small', anchor: 'b95-lab-09', tag: '6.6', name: 'Tín hiệu nhỏ', sec: 6,
  S: { IDQ: 1e-3, tau: 0.5, Cj: 15, rs: 2.0, n: 1.0, T: 300 }, // Cj in pF, tau in µs
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Sơ đồ tương đương r_s + (r_d ∥ C_d ∥ C_j) (trái) & Tuyến tính hóa quanh điểm Q (phải)',
      area: 'a', anim: true,
      ctrls: [
        { k: 'IDQ', l: 'I_DQ', min: -6, max: -1, step: 0.05, log: 1, f: v => fmtCur(v) },
        { k: 'tau', l: 'τ', min: 0.05, max: 2.0, step: 0.05, f: v => v.toFixed(2) + ' µs' },
        { k: 'Cj', l: 'C_j', min: 0, max: 100, step: 5, f: v => v + ' pF' },
        { k: 'rs', l: 'r_s', min: 0, max: 10, step: 0.5, f: v => v.toFixed(1) + ' Ω' },
        { k: 'n', l: 'n', min: 1.0, max: 2.0, step: 0.1, f: v => v.toFixed(1) },
        { btn: 'VD 6.1/6.2', fn: p => { p.S.IDQ = 1e-3; p.S.tau = 0.5; p.S.Cj = 15; p.S.rs = 2.0; p.S.n = 1.0; p.S.T = 300; p.syncCtrls(); p.dirty = true; } },
        { btn: 'VD 6.3 (100mA)', fn: p => { p.S.IDQ = 0.1; p.S.tau = 0.5; p.S.Cj = 15; p.S.rs = 2.0; p.S.n = 1.0; p.S.T = 300; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const Vt = vtOf(S.T);
        const Is = 4.16e-15; // khớp Ví dụ 3.1 & 6.3
        const Va = S.n * Vt * Math.log(Math.max(10, S.IDQ / Is));
        const Vapp = Va + S.IDQ * S.rs;
        const rd = (S.n * Vt) / S.IDQ;
        const RDC = Va / S.IDQ;
        const Cd = (S.IDQ * (S.tau * 1e-6)) / (2 * Vt);
        const Cj = S.Cj * 1e-12;
        const Ctot = Cd + Cj;
        const fc = 1 / (TAU2 * rd * Math.max(1e-15, Ctot));

        // === NỬA TRÁI: Sơ đồ tương đương r_s + (r_d || C_d || C_j) sống động ===
        const leftW = W * 0.54;
        const midY = H * 0.52;
        const xIn = 22, xRsL = leftW * 0.14, xRsR = leftW * 0.34;
        const xBusL = leftW * 0.44, xBusR = leftW * 0.88, xOut = leftW * 0.96;

        // Dây dẫn & điện trở nối tiếp r_s
        ln(ctx, xIn, midY, xRsL, midY, C.ink, 2.2);
        // Vẽ zigzag r_s
        const rsCol = S.rs > rd ? C.err : C.c5;
        ctx.beginPath(); ctx.moveTo(xRsL, midY);
        for (let k = 0; k < 6; k++) {
          const rx = xRsL + ((k + 0.5) / 6) * (xRsR - xRsL);
          ctx.lineTo(rx, midY + (k % 2 ? -8 : 8));
        }
        ctx.lineTo(xRsR, midY); ctx.strokeStyle = S.rs > 0 ? rsCol : C.g; ctx.lineWidth = 2.2; ctx.stroke();
        txt(ctx, 'r_s=' + S.rs.toFixed(1) + 'Ω', (xRsL + xRsR) / 2, midY - 18, rsCol, 10, 'center', 700);
        ln(ctx, xRsR, midY, xBusL, midY, C.ink, 2.2);

        // Khối song song 3 nhánh: r_d (trên), C_d (giữa), C_j (dưới)
        const ys = [midY - 52, midY, midY + 52];
        ln(ctx, xBusL, ys[0], xBusL, ys[2], C.ink, 2.2);
        ln(ctx, xBusR, ys[0], xBusR, ys[2], C.ink, 2.2);
        ln(ctx, xBusR, midY, xOut, midY, C.ink, 2.2);
        dot(ctx, xIn, midY, 4, C.main); dot(ctx, xOut, midY, 4, C.c2);

        // Nhánh 1: r_d
        const mx = (xBusL + xBusR) / 2;
        ln(ctx, xBusL, ys[0], mx - 22, ys[0], C.c2, 2);
        ctx.beginPath(); ctx.moveTo(mx - 22, ys[0]);
        for (let k = 0; k < 6; k++) ctx.lineTo(mx - 22 + ((k + 0.5) / 6) * 44, ys[0] + (k % 2 ? -7 : 7));
        ctx.lineTo(mx + 22, ys[0]); ctx.strokeStyle = C.c2; ctx.lineWidth = 2.2; ctx.stroke();
        ln(ctx, mx + 22, ys[0], xBusR, ys[0], C.c2, 2);
        txt(ctx, 'r_d = ' + fmtOhm(rd), mx, ys[0] - 16, C.c2, 10.5, 'center', 800);

        // Nhánh 2: C_d (tụ khuếch tán)
        ln(ctx, xBusL, ys[1], mx - 6, ys[1], C.main, 2);
        ln(ctx, mx - 6, ys[1] - 12, mx - 6, ys[1] + 12, C.main, 3);
        ln(ctx, mx + 6, ys[1] - 12, mx + 6, ys[1] + 12, C.main, 3);
        ln(ctx, mx + 6, ys[1], xBusR, ys[1], C.main, 2);
        txt(ctx, 'C_d = ' + fmtCap(Cd), mx, ys[1] - 18, C.main, 10.2, 'center', 800);

        // Nhánh 3: C_j (tụ vùng nghèo)
        const cjCol = Cj > 0 ? C.c1 : C.g;
        ln(ctx, xBusL, ys[2], mx - 6, ys[2], cjCol, 2);
        ln(ctx, mx - 6, ys[2] - 11, mx - 6, ys[2] + 11, cjCol, 2.8);
        ln(ctx, mx + 6, ys[2] - 11, mx + 6, ys[2] + 11, cjCol, 2.8);
        ln(ctx, mx + 6, ys[2], xBusR, ys[2], cjCol, 2);
        txt(ctx, 'C_j = ' + fmtCap(Cj), mx, ys[2] + 19, cjCol, 10, 'center', 700);

        // Hạt dòng xoay chiều tín hiệu nhỏ dao động trên dây (chớp qua r_s và nhánh song song)
        const osc = Math.sin(t * 5.2);
        const shift = osc * 11;
        dot(ctx, (xIn + xRsL) * 0.5 + shift * 0.6, midY, 3.8, C.main);
        dot(ctx, xBusL + 14 + shift * 0.7, ys[0], 3.4, C.c2);
        dot(ctx, xBusL + 14 + shift * 0.7, ys[1], 3.4, C.main);
        if (Cj > 0) dot(ctx, xBusL + 14 + shift * 0.7, ys[2], 3.1, C.c1);

        // Nhãn cực A và K cùng điện áp tổng V_app
        txt(ctx, 'A (+)', xIn, midY - 14, C.c4, 9.5, 'left', 700);
        txt(ctx, 'K (−)', xOut, midY - 14, C.c2, 9.5, 'right', 700);
        txt(ctx, 'V_app = V_a + I·r_s = ' + Vapp.toFixed(3) + ' V', leftW * 0.5, H - 14, S.rs > rd ? C.err : C.ink, 10.2, 'center', 700);

        // === NỬA PHẢI: Tuyến tính hóa tiếp tuyến quanh điểm làm việc Q ===
        const qx0 = W * 0.57, qy0 = 32, qw = W * 0.40, qh = H - 56;
        drawPlotFrame(ctx, qx0, qy0, qw, qh, 'v_D quanh V_a', 'i_D quanh I_DQ');

        const dVspan = 2.6 * S.n * Vt; // ±2.6 nVt quanh Q
        const iTop = S.IDQ * 3.1;
        const QX = dv => qx0 + ((dv + dVspan) / (2 * dVspan)) * qw;
        const QY = iVal => qy0 + qh - clamp(iVal / iTop, 0, 1) * (qh - 10) - 5;

        // Đường cong mũ I-V cục bộ quanh điểm Q
        ctx.beginPath();
        for (let k = 0; k <= 64; k++) {
          const dv = -dVspan + (k / 64) * (2 * dVspan);
          const iVal = S.IDQ * expSafe(dv / (S.n * Vt));
          const px = QX(dv), py = QY(iVal);
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.strokeStyle = C.main; ctx.lineWidth = 2.2; ctx.stroke();

        // Đường tiếp tuyến tại điểm Q có độ dốc 1/r_d
        const qx = QX(0), qy = QY(S.IDQ);
        const dvTan = 0.9 * S.n * Vt;
        ln(ctx, QX(-dvTan), QY(S.IDQ - dvTan / rd), QX(dvTan), QY(S.IDQ + dvTan / rd), C.c2, 2, [5, 3]);

        // Dao động tín hiệu nhỏ v_d(t) chiếu lên tiếp tuyến tạo i_d(t)
        const dvSig = 0.35 * S.n * Vt * osc;
        const iSig = S.IDQ + dvSig / rd;
        const sx = QX(dvSig), sy = QY(iSig);
        ln(ctx, sx, qy0 + qh, sx, sy, C.c5, 1.2, [2, 2]);
        ln(ctx, qx0, sy, sx, sy, C.c5, 1.2, [2, 2]);
        dot(ctx, qx, qy, 4.6, C.err);
        dot(ctx, sx, sy, 4.2, C.c5);

        txt(ctx, 'Q (' + Va.toFixed(2) + 'V, ' + fmtCur(S.IDQ) + ')', qx + 6, qy + 12, C.err, 9.2, 'left', 700);
        txt(ctx, 'Độ dốc 1/r_d', QX(dvTan * 0.55), QY(S.IDQ + dvTan * 0.9 / rd) - 6, C.c2, 9.2, 'center', 700);
        txt(ctx, 'R_DC / r_d = ' + (RDC / rd).toFixed(1) + '×', qx0 + 8, qy0 + 13, C.mut, 9.4, 'left', 700);

        const banner = S.rs > rd
          ? 'Dòng lớn (r_d = ' + fmtOhm(rd) + ' ≪ r_s = ' + fmtOhm(S.rs) + '): điện trở nối tiếp r_s khống chế!'
          : 'Tín hiệu nhỏ tại Q: r_d = ' + fmtOhm(rd) + ' ≪ R_DC = ' + fmtOhm(RDC) + ' · f_c = ' + fmtFreq(fc);
        chip(ctx, banner, W * 0.5, 14, S.rs > rd ? C.err : C.main, 'center');
      }
    },
    {
      title: 'Đồ thị Bode tổng trở tín hiệu nhỏ |Z(f)| (1 kHz → 1 GHz) — tần số cắt f_c và sàn điện trở r_s',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const Vt = vtOf(S.T);
        const Is = 4.16e-15;
        const Va = S.n * Vt * Math.log(Math.max(10, S.IDQ / Is));
        const rd = (S.n * Vt) / S.IDQ;
        const RDC = Va / S.IDQ;
        const Cd = (S.IDQ * (S.tau * 1e-6)) / (2 * Vt);
        const Cj = S.Cj * 1e-12;
        const Ctot = Cd + Cj;
        const fc = 1 / (TAU2 * rd * Math.max(1e-15, Ctot));

        const x0 = 56, y0 = 18, pw = W - x0 - 150, ph = H - y0 - 24;
        drawPlotFrame(ctx, x0, y0, pw, ph, 'Tần số f (log)', '|Z(f)| (Ω)');

        const lfMin = 3, lfMax = 9; // 1 kHz → 1 GHz
        const zLow = S.rs + rd;
        const zFloor = Math.max(0.1, S.rs > 0 ? S.rs * 0.5 : rd * 1e-3);
        const lzMax = Math.ceil(Math.log10(Math.max(10, zLow * 2.2)));
        const lzMin = Math.floor(Math.log10(Math.min(0.5, zFloor)));

        const X = lf => x0 + clamp((lf - lfMin) / (lfMax - lfMin), 0, 1) * pw;
        const Y = z => y0 + ph - clamp((Math.log10(Math.max(1e-3, z)) - lzMin) / Math.max(1, lzMax - lzMin), 0, 1) * (ph - 10) - 5;

        const fLabels = { 3: '1k', 4: '10k', 5: '100k', 6: '1M', 7: '10M', 8: '100M', 9: '1G' };
        for (let lf = lfMin; lf <= lfMax; lf++) {
          ln(ctx, X(lf), y0, X(lf), y0 + ph, C.g, 0.6, [2, 3]);
          txt(ctx, fLabels[lf], X(lf), y0 + ph + 10, C.mut, 8.8, 'center', 600);
        }
        const zStep = (lzMax - lzMin) > 5 ? 2 : 1;
        for (let lz = lzMin; lz <= lzMax; lz += zStep) {
          const val = Math.pow(10, lz);
          ln(ctx, x0, Y(val), x0 + pw, Y(val), C.g, 0.6, [2, 3]);
          txt(ctx, lz >= 3 ? p10(lz) : (val >= 1 ? val.toFixed(0) : val.toFixed(1)), x0 - 5, Y(val), C.mut, 8.8, 'right', 600);
        }

        // Đường ngang tham chiếu r_s + r_d (thấp tần) và sàn r_s (cao tần)
        ln(ctx, x0, Y(zLow), x0 + pw, Y(zLow), C.c2, 1.1, [4, 3]);
        txt(ctx, 'r_s+r_d', x0 + 6, Y(zLow) - 8, C.c2, 8.8, 'left', 700);
        if (S.rs > 0) {
          ln(ctx, x0, Y(S.rs), x0 + pw, Y(S.rs), C.err, 1.3, [4, 3]);
          txt(ctx, 'Sàn r_s = ' + fmtOhm(S.rs), x0 + pw - 6, Y(S.rs) - 8, C.err, 8.8, 'right', 700);
        }

        // Đường cong |Z(f)| chính xác
        ctx.beginPath();
        for (let i = 0; i <= 110; i++) {
          const lf = lfMin + (i / 110) * (lfMax - lfMin);
          const w = TAU2 * Math.pow(10, lf);
          const denom = 1 + Math.pow(w * rd * Ctot, 2);
          const re = S.rs + rd / denom;
          const im = -(w * rd * rd * Ctot) / denom;
          const mag = Math.hypot(re, im);
          const px = X(lf), py = Y(mag);
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.strokeStyle = C.main; ctx.lineWidth = 2.5; ctx.stroke();

        // Đánh dấu tần số cắt f_c
        const lfc = Math.log10(Math.max(1, fc));
        if (lfc >= lfMin && lfc <= lfMax) {
          const wFc = TAU2 * fc;
          const reFc = S.rs + rd / 2, imFc = -rd / 2;
          const zFc = Math.hypot(reFc, imFc);
          ln(ctx, X(lfc), y0, X(lfc), y0 + ph, C.c5, 1.4, [3, 3]);
          dot(ctx, X(lfc), Y(zFc), 5, C.c5);
          txt(ctx, 'f_c=' + fmtFreq(fc), X(lfc) + (lfc > 7.5 ? -5 : 5), y0 + 12, C.c5, 9.2, lfc > 7.5 ? 'right' : 'left', 800);
        }

        // Bảng thông số gọn bên phải
        const rx = x0 + pw + 10;
        txt(ctx, 'r_d = ' + fmtOhm(rd), rx, y0 + 12, C.c2, 10, 'left', 800);
        txt(ctx, 'R_DC = ' + fmtOhm(RDC), rx, y0 + 28, C.mut, 9.6, 'left', 600);
        txt(ctx, 'C_d = ' + fmtCap(Cd), rx, y0 + 46, C.main, 9.8, 'left', 700);
        txt(ctx, 'C_tot = ' + fmtCap(Ctot), rx, y0 + 62, C.c1, 9.6, 'left', 700);
        txt(ctx, 'f_c = ' + fmtFreq(fc), rx, y0 + 80, C.c5, 9.8, 'left', 800);
        txt(ctx, 'r_d·C_d = ' + ((rd * Cd) * 1e6).toFixed(2) + ' µs (τ/2)', rx, y0 + 98, C.ink, 9.1, 'left', 600);
      }
    }
  ]
});

/* ==========================================================================
   DỮ LIỆU HƯỚNG DẪN THỰC HÀNH, CÔNG THỨC & HÀM TRÍCH XUẤT CHỈ SỐ CHO 9 LAB
   ========================================================================== */
const LAB_META = {
  bias: {
    formula: 'V_bi = V_t ln(NₐN_d / nᵢ²)  ·  W(V_a) = W₀ √(1 − V_a / V_bi)',
    tips: [
      'Đặt V_a = 0 V để quan sát cân bằng nhiệt: hai mức Fermi E_Fp = E_Fn liền mạch và dòng tổng bằng 0.',
      'Kéo V_a về −3 V (phân cực ngược): hàng rào e(V_bi + V_R) tăng vọt, vùng nghèo mở rộng, hạt đa số bị chặn hoàn toàn.',
      'Đẩy V_a lên +0,55 → +0,65 V (phân cực thuận): hàng rào hạ thấp, vùng nghèo co hẹp và hạt đa số phun ồ ạt qua tiếp giáp.'
    ],
    metrics(S) {
      const m0 = pnCalc({ Na: S.Na, Nd: S.Nd, T: S.T, Va: 0 });
      const Va = Math.min(S.Va, m0.Vbi - 0.03);
      const m = pnCalc({ Na: S.Na, Nd: S.Nd, T: S.T, Va });
      return [
        ['Trạng thái', Va > 0.02 ? 'Thuận' : Va < -0.02 ? 'Ngược' : 'Cân bằng'],
        ['V_bi', m.Vbi.toFixed(3) + ' V'],
        ['Hàng rào', m.Vbar.toFixed(2) + ' eV'],
        ['Vùng nghèo W', fmtLen(m.W)],
        ['Dòng I', fmtCur(m.I)]
      ];
    }
  },
  edge: {
    formula: 'p_n(x_n) = p_n0 · exp(V_a / V_t)  ·  n_p(−x_p) = n_p0 · exp(V_a / V_t)',
    tips: [
      'Nhấn nút "Ví dụ 2.1" (Si, Nₐ = N_d = 10¹⁶, V_a = 0,60 V): kiểm chứng p_n(x_n) ≈ 2,6×10¹⁴ cm⁻³ (tăng hơn 10 bậc!).',
      'Tăng V_a thêm đúng +60 mV tại 300 K và nhìn thước đo trên đồ thị log: nồng độ mép nhân đúng 10 lần.',
      'Đẩy V_a > 0,70 V để thấy nồng độ lỗ trống phun vào chạm N_d — điều kiện phun mức thấp bị phá vỡ. Sau đó đổi sang GaAs để so sánh.'
    ],
    metrics(S) {
      const m = pnCalc({ mat: S.mat, Va: S.Va, Na: S.Na, Nd: S.Nd, T: S.T });
      return [
        ['Vật liệu', S.mat + ' (nᵢ=' + sci(m.ni, 1) + ')'],
        ['V_a', S.Va.toFixed(2) + ' V'],
        ['p_n(x_n)', sci(m.pnEdge, 2) + ' cm⁻³'],
        ['n_p(−x_p)', sci(m.npEdge, 2) + ' cm⁻³'],
        ['Ngưỡng mức cao', m.VhiN.toFixed(2) + ' V']
      ];
    }
  },
  excess: {
    formula: 'δp_n(x) = δp_n(x_n) · exp(−(x − x_n) / L_p),   L_p = √(D_p τ)',
    tips: [
      'Nhấn "Ví dụ 2.2" (D_p = 10, τ = 0,5 µs): L_p = 22,4 µm là khoảng cách nồng độ giảm còn 1/e (37%); sau 3L_p ≈ 67 µm chỉ còn 5%.',
      'Tăng thời gian sống τ lên 2,0 µs: L_p tăng gấp đôi (44,7 µm), điện tích tích trữ Q_s tăng gấp đôi (nguồn gốc tụ khuếch tán C_d).',
      'Chuyển sang "Thang log" để thấy đường cong suy giảm mũ duỗi thành đường thẳng.'
    ],
    metrics(S) {
      const m = pnCalc({ Va: S.Va, Dp: S.Dp, Dn: S.Dn, tau: S.tau * 1e-6, Na: S.Na, Nd: S.Nd });
      const Qs = m.A * E_CHG * m.dpnEdge * m.Lp;
      return [
        ['L_p / L_n', (m.Lp * 1e4).toFixed(1) + ' / ' + (m.Ln * 1e4).toFixed(1) + ' µm'],
        ['3·L_p (5%)', (3 * m.Lp * 1e4).toFixed(0) + ' µm'],
        ['δp_n(x_n)', sci(m.dpnEdge, 2) + ' cm⁻³'],
        ['Q_s (phía n)', sci(Qs, 2) + ' C']
      ];
    }
  },
  iv: {
    formula: 'I = I_s [exp(V_a / V_t) − 1],   J_s = e D_p p_n0 / L_p + e D_n n_p0 / L_n',
    tips: [
      'Nhấn "VD 3.1" (V_a = 0,60 V): xác nhận I_s ≈ 4,16×10⁻¹⁵ A và dòng thuận I ≈ 48 µA.',
      'Nhấn "VD 3.2 (1mA)": chỉ cần tăng V_a từ 0,60 V lên 0,679 V (+79 mV), dòng nhảy vọt hơn 20 lần lên 1,00 mA.',
      'Chuyển sang "Log₁₀|I|" rồi nâng T từ 300 K lên 330 K để quan sát I_s tăng mạnh làm đặc tuyến dịch trái (≈ −1,8 mV/°C).'
    ],
    metrics(S) {
      const m = pnCalc({ Va: S.Va, Na: S.Na, Nd: S.Nd, tau: S.tau * 1e-6, A: S.A, T: S.T });
      return [
        ['V_a', S.Va.toFixed(3) + ' V'],
        ['I_s', sci(m.Is, 2) + ' A'],
        ['Dòng I', fmtCur(m.I)],
        ['J_p / J_n', (m.Jp0 / m.Jn0).toFixed(2)],
        ['V_a (1 mA)', (m.Vt * Math.log(1e-3 / m.Is)).toFixed(3) + ' V']
      ];
    }
  },
  jcomp: {
    formula: 'J_total = J_p(x) + J_n(x) = hằng số dọc toàn bộ điốt',
    tips: [
      'Trượt "Vị trí x" từ vùng p sang sâu vùng n: quan sát dòng lỗ trống thiểu số tắt dần và dòng electron đa số tăng bù đúng bằng phần hao hụt.',
      'Nhấn "Điốt p⁺n" (Nₐ ≫ N_d): phía pha tạp nặng phun áp đảo sang phía nhẹ — gần như toàn bộ dòng tại tiếp giáp do lỗ trống đảm nhiệm.',
      'Thay đổi L_p, L_n để xem khoảng cách chuyển giao vai trò từ dòng thiểu số sang dòng đa số.'
    ],
    metrics(S) {
      const Na = 1e16 * Math.pow(10, S.ratio / 2), Nd = 1e16 * Math.pow(10, -S.ratio / 2);
      const jp0 = (10 / (S.Lp * 1e-4)) / Nd, jn0 = (25 / (S.Ln * 1e-4)) / Na;
      const fP0 = jp0 / (jp0 + jn0), fN0 = 1 - fP0;
      const xUm = S.xProbe * 100, d = 8;
      const fP = xUm > d ? fP0 * Math.exp(-(xUm - d) / S.Lp) : xUm < -d ? 1 - fN0 * Math.exp((xUm + d) / S.Ln) : fP0;
      return [
        ['Vị trí x', (xUm >= 0 ? '+' : '−') + Math.round(Math.abs(xUm)) + ' µm'],
        ['Nₐ / N_d', Math.pow(10, S.ratio).toFixed(1) + '×'],
        ['J_p(x)', Math.round(fP * 100) + '%'],
        ['J_n(x)', Math.round((1 - fP) * 100) + '%']
      ];
    }
  },
  short: {
    formula: 'J_p(chính xác) / J_p(dài) = coth(W_n / L_p)  ≈  L_p / W_n  (khi W_n ≪ L_p)',
    tips: [
      'Nhấn "Điốt dài (4×)": lỗ trống tái hợp gần hết trước khi tới tiếp xúc ohmic, nghiệm sinh trùng khít đường mũ.',
      'Nhấn "Điốt ngắn (0,1×)": phân bố duỗi thẳng tuyến tính từ mép x_n về 0 tại tiếp xúc, độ dốc dốc gấp 10 lần nên dòng tăng 10×!',
      'So sánh sai khác giữa xấp xỉ tuyến tính L_p/W_n và nghiệm chính xác coth(W_n/L_p) ở vùng chuyển tiếp W_n ≈ L_p.'
    ],
    metrics(S) {
      const r = S.wnRatio;
      return [
        ['W_n / L_p', r.toFixed(2) + '×'],
        ['W_n', (r * S.Lp).toFixed(1) + ' µm'],
        ['coth(W_n/L_p)', '×' + (1 / Math.tanh(r)).toFixed(2)],
        ['Xấp xỉ L_p/W_n', '×' + (1 / r).toFixed(2)]
      ];
    }
  },
  real: {
    formula: 'I = I_r0[exp(V_j/2V_t)−1] + I_s[exp(V_j/V_t)−1],   V_a = V_j + I·r_s',
    tips: [
      'Kéo V_a ≈ 0,25 V (Vùng a): tái hợp trong vùng nghèo chi phối, hệ số lý tưởng n ≈ 2 (120 mV/decade).',
      'Nhấn "VD 5.2 (0,39V)" để kiểm tra điểm giao chuyển từ Vùng a (tái hợp) sang Vùng b (khuếch tán lý tưởng, n ≈ 1).',
      'Nhấn "VD 5.3 (0,70V)" rồi kéo tiếp lên 0,90 V (Vùng c): phun mức cao và sụt áp I·r_s bẻ cong đặc tuyến mạnh.'
    ],
    metrics(S) {
      const m = pnCalc({ Na: 1e16, Nd: S.Nd, tau: S.tau0 * 1e-6, T: S.T, A: 1e-4, Va: S.Va });
      const Jr0 = (E_CHG * 0.3e-4 * m.ni) / (2 * S.tau0 * 1e-6);
      const Ir0 = m.A * Jr0;
      const Vab = 2 * m.Vt * Math.log(Math.max(1.01, Jr0 / m.Js));
      const Vbc = m.VhiN;
      const Ihi = m.Is * expSafe(Vbc / m.Vt);
      const res = realDiodeCurrent(S.Va, { Vt: m.Vt, Ir0, Is: m.Is, Ihi, rs: S.rs });
      return [
        ['Vùng hoạt động', S.Va < Vab ? 'a (Tái hợp)' : S.Va < Vbc ? 'b (Lý tưởng)' : 'c (Mức cao+r_s)'],
        ['Dòng I', fmtCur(res.Itot)],
        ['Hệ số n(V_a)', res.nLoc > 8 ? '>8' : res.nLoc.toFixed(2)],
        ['Giao a→b / b→c', Vab.toFixed(2) + ' / ' + Vbc.toFixed(2) + ' V']
      ];
    }
  },
  gen: {
    formula: 'J_gen = e n_i W(V_R) / (2 τ₀)  ∝  √(V_bi + V_R)',
    tips: [
      'Nhấn "VD 5.1 (5V)": ở V_R = 5 V, W ≈ 1,21 µm cho J_gen ≈ 2,9×10⁻⁷ A/cm² — lớn gấp ~7000 lần J_s lý tưởng!',
      'Tăng V_R từ 5 V lên 40 V: vùng nghèo mở rộng nên dòng ngược thực tăng theo căn bậc hai, không phẳng như lý thuyết lý tưởng.',
      'Giảm τ₀ (nhiều tâm bẫy hơn) hoặc tăng nhiệt độ T để thấy dòng rò ngược tăng vọt.'
    ],
    metrics(S) {
      const m = pnCalc({ Na: S.N, Nd: S.N, tau: S.tau0 * 1e-6, T: S.T, Va: -S.VR });
      const Jgen = (E_CHG * m.ni * m.W) / (2 * S.tau0 * 1e-6);
      return [
        ['V_R', S.VR.toFixed(1) + ' V'],
        ['W(V_R)', fmtLen(m.W)],
        ['J_gen', sci(Jgen, 2) + ' A/cm²'],
        ['J_gen / J_s', (Jgen / m.Js) >= 100 ? sci(Jgen / m.Js, 1) + '×' : (Jgen / m.Js).toFixed(1) + '×'],
        ['Ngưỡng V_B', '≈ ' + m.VB.toFixed(0) + ' V']
      ];
    }
  },
  small: {
    formula: 'r_d = n V_t / I_DQ  ·  C_d = I_DQ τ / (2 V_t)  ·  f_c = 1 / [2π r_d (C_d + C_j)]',
    tips: [
      'Nhấn "VD 6.1/6.2" (1 mA, τ = 0,5 µs): r_d = 25,9 Ω (nhỏ hơn ~26 lần R_DC), C_d ≈ 9,7 nF, f_c ≈ 640 kHz.',
      'Thay đổi I_DQ từ 0,1 mA đến 10 mA và quan sát tích r_d·C_d = τ/2 luôn giữ nguyên bất biến!',
      'Nhấn "VD 6.3 (100mA)": r_d tụt xuống 0,26 Ω ≪ r_s = 2 Ω, sàn r_s khống chế đồ thị Bode và V_app ≈ 1,00 V.'
    ],
    metrics(S) {
      const Vt = vtOf(S.T), rd = (S.n * Vt) / S.IDQ;
      const Va = S.n * Vt * Math.log(Math.max(10, S.IDQ / 4.16e-15));
      const Cd = (S.IDQ * (S.tau * 1e-6)) / (2 * Vt);
      const Ctot = Cd + S.Cj * 1e-12;
      const fc = 1 / (TAU2 * rd * Math.max(1e-15, Ctot));
      return [
        ['I_DQ', fmtCur(S.IDQ)],
        ['r_d / R_DC', fmtOhm(rd) + ' / ' + fmtOhm(Va / S.IDQ)],
        ['C_d / C_tot', fmtCap(Cd) + ' / ' + fmtCap(Ctot)],
        ['Tần số cắt f_c', fmtFreq(fc)],
        ['V_app', (Va + S.IDQ * S.rs).toFixed(3) + ' V']
      ];
    }
  }
};

/* ---------- NHẬT KÝ THÍ NGHIỆM kiểu lab-b11: dòng thuyết minh mở đầu + dòng phản ứng khi chỉnh thông số ---------- */
const LD = {};
LABS.forEach(lab => {
  const mt = LAB_META[lab.id];
  if (!mt) return;
  const tips = mt.tips || [];
  const intro = [['i', 'Công thức cốt lõi: ' + mt.formula]];
  tips.forEach((t, i) => intro.push([i === tips.length - 1 ? 'v' : 'w', t]));
  LD[lab.id] = {
    intro,
    react(S, k, P, say) {
      say('v', mt.metrics(S).map(r => r[0] + ' = ' + r[1]).join(' · '));
    }
  };
  lab.log = LD[lab.id];
});

function getLab(idOrKey) {
  if (typeof idOrKey === 'number') return LABS[clamp(idOrKey, 0, LABS.length - 1)] || LABS[0];
  if (!idOrKey) return LABS[0];
  const s = String(idOrKey).trim();
  return LABS.find(l => l.id === s || l.anchor === s || l.tag === s) || LABS[0];
}

/* ==========================================================================
   KHUNG POPUP (#lab95 — bố cục nút, màn hình & nhật ký đồng bộ lab-b11.js)
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

const LAUNCH_CSS = `
.b95-launch{display:inline-flex;align-items:center;gap:7px;margin-top:8px;padding:7px 13px;border-radius:9px;
  border:1px solid var(--main,#38bdf8);background:var(--tint,rgba(56,189,248,.12));color:var(--main,#38bdf8);
  font:700 12.5px ${FONT};cursor:pointer;transition:.16s}
.b95-launch:hover{background:var(--main,#38bdf8);color:var(--bg,#0f172a)}
`;
function ensureStyles() {
  if (document.getElementById('lab-b95-style')) return;
  const st = document.createElement('style');
  st.id = 'lab-b95-style';
  st.textContent = CSS + LAUNCH_CSS;
  document.head.appendChild(st);
}
ensureStyles();

let timers = [], ros = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = LABS[0].id;

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

  try {
    new MutationObserver(() => {
      if (root.hidden) return;
      readColors();
      curPanels.forEach(q => { q.dirty = true; });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
  } catch (_) {}
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
const D2R = Math.PI / 180;
const tiltOf = sy => Math.asin(clamp(sy, -1, 1)) / D2R;   // đúng quy ước độ nghiêng của FILM Buổi 9.5 (sy = sin(tilt))
const syOf = tilt => clamp(Math.sin(tilt * D2R), 0.06, 0.85);

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
  filmStop(false, true);
  const home = Object.assign({}, tab.S), ctrl = {};
  const stepOf = {}; tab.panels.forEach(q => (q.ctrls || []).forEach(k => { if (k.k && k.step && !k.log) stepOf[k.k] = k.step; }));
  const steps = FILM[tab.id].concat([{ d: 3, cap: 'Kết thúc phim — mọi thông số và góc nhìn đã trở về như ban đầu. Bạn có thể tự xoay, zoom và chỉnh thanh trượt để thử lại.', v: V(0, tiltOf(0.28), 1), set: home, slow: 1 }]);
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
  const st = f.steps[f.i], c = f.p.cam, S = f.tab.S;
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
  const tab = getLab(id);
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
    try { p.spec.draw(p, ctx, p.W, p.H, TT, dt * TSC); } catch (err) { console.error('[LabB95]', err); txt(ctx, 'Lỗi vẽ mô phỏng: ' + (err && err.message ? err.message : String(err)), 12, 20, C.err, 12, 'left', 700); }
    CAM = null;
    ctx.restore();
  });
  raf = requestAnimationFrame(loop);
}

function open(id, panelIdx, patch) {
  ensureDom(); readColors(); opener = document.activeElement;
  root.hidden = false;
  const wantFilm = panelIdx === 'film' || panelIdx === true;
  show(id || lastTab, wantFilm ? null : panelIdx, patch);
  last = performance.now();
  if (!raf) raf = requestAnimationFrame(loop);
  if (wantFilm) { const fp = curPanels.find(q => q.cam); if (fp) filmStart(cur, fp); }
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


const openLab = open;
const closeLab = close;

function markAnchors(root) {
  const scope = root && root.querySelectorAll ? root : document;
  ensureStyles();
  let count = 0;
  LABS.forEach(lab => {
    const sels = [
      '#' + lab.anchor,
      '[data-lab-b95="' + lab.id + '"]',
      '[data-lab-b95="' + lab.anchor + '"]',
      '[data-anchor="' + lab.anchor + '"]'
    ];
    scope.querySelectorAll(sels.join(',')).forEach(el => {
      if (el.dataset.b95Marked) return;
      el.dataset.b95Marked = '1';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'b95-launch';
      btn.innerHTML = `<span>▶</span><span>Mở mô hình tương tác · ${lab.tag} ${lab.name}</span>`;
      btn.addEventListener('click', () => openLab(lab.id));
      el.appendChild(btn);
      count++;
    });
  });
  return count;
}

const LabB95 = {
  open: openLab,
  close: closeLab,
  mark: markAnchors,
  tabs: () => LABS.map(l => l.id),
  film: (id, at) => { ensureDom(); if (root.hidden || (id && (!cur || cur.id !== id))) open(id); const p = curPanels.find(q => q.cam); if (p) filmStart(cur, p, at); },
  LABS,
  pnCalc,
  realDiodeCurrent
};

window.LabB95 = LabB95;

// Tự động gắn nút vào các mỏ neo có sẵn ngay khi trang tải xong
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => markAnchors(document));
} else {
  markAnchors(document);
}

})();
