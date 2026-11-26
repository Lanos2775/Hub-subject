/* ==========================================================================
   lab-b9.js — PHÒNG THÍ NGHIỆM MÔ PHỎNG BUỔI 9: TIẾP GIÁP p-n
   - Nâng cấp theo chuẩn tiêu chí lab-b11.js:
     + Hoàn toàn mô phỏng vật lý trực quan 2 tầng (Thực tế 3D ở trên + Mặt cắt
       nguyên lý bên trong đồng bộ ở dưới) — KHÔNG dùng đồ thị/biểu đồ trục tọa độ.
     + Dùng đồng hồ kim siêu gọn không khung (drawMiniGauge) đặt vào góc trống,
       bố cục lưới 2.1fr 1fr đồng nhất cho cả 8 tab, hỗ trợ open(id, pi, patch).
     + Đồng bộ 100% bảng biến màu CSS, khung popup 95% và nhật ký thí nghiệm.
   - Đủ 8 tab phủ trọn Buổi 9:
       1  · Ghép p-n          (Mục 1.2) | 2a · Đồi thế V_bi     (Mục 2.3)
       2b · Thăm dò vùng nghèo(Mục 2.7) | 3a · Phân cực ngược   (Mục 3.3)
       3b · Máy đo C-V        (Mục 3.6) | 4  · Đánh thủng       (Mục 4.1)
       5a · So sánh pha tạp   (Mục 5.2) | 5b · Đài LC biến dung (Mục 5.4)
   - Khối 3D (7 tab) xoay/zoom được bằng chuột, trong suốt, có hạt tải & ion chuyển động bên trong (ENGINE 3D THẬT).
   - API: LabB9.open(tabId?, panelIndex?, patch?)  LabB9.close()  LabB9.mark(root)
   ========================================================================== */
(function () {
'use strict';

/* ---------- hằng số vật lý & tiện ích ---------- */
const TAU2 = Math.PI * 2;
const E_CHG = 1.6e-19;        // C
const EPS0 = 8.85e-14;        // F/cm
const KB = 8.617e-5;          // eV/K
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
const fmtUm = cm => {
  const um = cm * 1e4;
  return um >= 10 ? um.toFixed(1) + ' µm'
    : um >= 1 ? um.toFixed(2) + ' µm'
    : um >= 0.01 ? um.toFixed(3) + ' µm'
    : (um * 1000).toFixed(1) + ' nm';
};
const FONT = '"Be Vietnam Pro",system-ui,sans-serif';
const C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ['bg', 'card', 'ink', 'mut', 'sub', 'main', 'err', 'c1', 'c2', 'c3', 'c4', 'c5', 'g', 'tint']
    .forEach(k => C[k] = cs.getPropertyValue('--' + k).trim() || '#888');
}

/* ---------- hàm vẽ canvas dùng chung (đồng bộ chuẩn lab-b11.js) ---------- */
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
  const r = sz || 5.5;
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

/* ---------- hàm vẽ hình khối 3D isometric & linh kiện thực tế ---------- */
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
  polyFill(ctx, [p010, p110, p111, p011], col, a * 0.85, sc, 1);
  polyFill(ctx, [p010, p110, p111, p011], '#000', a * 0.16);
  polyFill(ctx, [p110, p100, p101, p111], col, a * 0.85, sc, 1);
  polyFill(ctx, [p110, p100, p101, p111], '#000', a * 0.34);
  polyFill(ctx, [p001, p101, p111, p011], col, a, sc, 1.1);
}
function drawProbe(ctx, tx, ty, dir, col, label) {
  const s = dir < 0 ? -1 : 1;
  ln(ctx, tx + s * 40, ty - 50, tx + s * 10, ty - 15, C.sub, 4.8);
  ln(ctx, tx + s * 10, ty - 15, tx, ty, col || C.main, 2.2);
  dot(ctx, tx, ty, 3, col || C.main);
  if (label) txt(ctx, label, tx + s * 44, ty - 52, col || C.ink, 10.2, s > 0 ? 'left' : 'right', 700);
}
function drawDiodePkg(ctx, cx, cy, sc, col, label) {
  const w = 48 * sc, h = 22 * sc;
  ln(ctx, cx - w * 0.85, cy, cx - w * 0.5, cy, C.sub, 2.8 * sc);
  ln(ctx, cx + w * 0.5, cy, cx + w * 0.85, cy, C.sub, 2.8 * sc);
  rr(ctx, cx - w / 2, cy - h / 2, w, h, 4);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = col || C.sub; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = col || C.main;
  ctx.fillRect(cx + w * 0.24, cy - h / 2 + 1, 5 * sc, h - 2);
  const bx = cx - 4 * sc, s = 6.5 * sc;
  ctx.beginPath();
  ctx.moveTo(bx - s, cy - s * 0.85); ctx.lineTo(bx - s, cy + s * 0.85); ctx.lineTo(bx + s * 0.7, cy);
  ctx.closePath(); ctx.fillStyle = col || C.main; ctx.fill();
  ln(ctx, bx + s * 0.7, cy - s * 0.9, bx + s * 0.7, cy + s * 0.9, col || C.main, 1.8);
  if (label) txt(ctx, label, cx, cy - h / 2 - 10, col || C.ink, 10, 'center', 700);
}

/* ==========================================================================
   ENGINE 3D THẬT — xoay · zoom · khối kính trong suốt · hạt chuyển động bên trong
   - Mỗi panel 3D có camera riêng p.cam3 {yaw, pitch, zoom}:
       kéo chuột = xoay · lăn chuột / chụm hai ngón = zoom · bấm đúp hoặc nút "Đặt lại góc nhìn" = về mặc định.
   - Thế giới dùng đơn vị px như isoBox cũ: x phải (p → n), y hướng ra phía người xem, z hướng lên.
   - Thứ tự vẽ theo từng khối (xa → gần). Trong mỗi khối: mặt sau → hạt → mặt trước,
     nên hạt bên trong luôn nhìn thấy xuyên qua lớp kính, ở mọi góc xoay.
   ========================================================================== */
const DEG = Math.PI / 180;
const CAM0 = { yaw: 30, pitch: 22, zoom: 1 };
/* [chỉ số đỉnh, pháp tuyến ngoài, độ tối] — đỉnh i: bit0 = x1, bit1 = y1, bit2 = z1 */
const FACES = [
  [[0, 2, 6, 4], [-1, 0, 0], 0.22], [[1, 3, 7, 5], [1, 0, 0], 0.32],
  [[0, 1, 5, 4], [0, -1, 0], 0.28], [[2, 3, 7, 6], [0, 1, 0], 0.14],
  [[0, 1, 3, 2], [0, 0, -1], 0.36], [[4, 5, 7, 6], [0, 0, 1], 0]
];
function camOf(p, v0) {
  if (!p.cam3) {
    const b = Object.assign({}, CAM0, v0 || {});
    p.cam3 = { yaw: b.yaw, pitch: b.pitch, zoom: b.zoom, b, goal: null };
  }
  return p.cam3;
}
function resetCam(p) {
  const c = camOf(p, p.spec && p.spec.view0);
  c.goal = Object.assign({}, c.b); p.dirty = true;
}
function scene3(p, ctx, dt, tgt0, anchor0, v0) {
  const c = camOf(p, v0);
  if (c.goal) {                                   /* về góc mặc định thật mượt */
    const k = 1 - Math.exp(-dt * 7);
    let d = c.goal.yaw - c.yaw; d = ((d + 540) % 360) - 180;
    c.yaw += d * k; c.pitch += (c.goal.pitch - c.pitch) * k; c.zoom += (c.goal.zoom - c.zoom) * k;
    if (Math.abs(d) < 0.1 && Math.abs(c.goal.pitch - c.pitch) < 0.1 && Math.abs(c.goal.zoom - c.zoom) < 0.005) {
      c.yaw = c.goal.yaw; c.pitch = c.goal.pitch; c.zoom = c.goal.zoom; c.goal = null;
    }
  }
  /* luôn đặt tâm khối vào chính giữa khung; khi chiếu phim thì tâm xoay/zoom dời tới tiêu điểm */
  const fol = c.follow || 0, ff = c.f || [0.5, 0.5, 0.5];
  const tgt = [0, 1, 2].map(i => lerp(tgt0[i], tgt0[i] * 2 * ff[i], fol));
  const anchor = [p.W * 0.5, p.H * lerp(0.53, 0.47, fol)];
  const ya = c.yaw * DEG, pb = c.pitch * DEG, cy = Math.cos(ya), sy = Math.sin(ya), cp = Math.cos(pb), sp = Math.sin(pb), S = c.zoom * lerp(clamp(Math.min(p.W / 640, p.H / 350), 0.85, 1.6), 1, clamp((c.zoom - 1) / 1.5, 0, 1));
  /* chiếu trực giao: trả [sx, sy, độ sâu] — độ sâu càng lớn càng xa người xem */
  const P = (x, y, z) => {
    const dx = x - tgt[0], dy = y - tgt[1], dz = z - tgt[2], xr = dx * cy - dy * sy, away = -(dx * sy + dy * cy);
    return [anchor[0] + S * xr, anchor[1] - S * (dz * cp + away * sp), away * cp - dz * sp];
  };
  const groups = [], over = [];
  const mkBox = (x, y, z, dx, dy, dz, col, al, edge) => {
    const cs = [];
    for (let i = 0; i < 8; i++) cs.push(P(x + (i & 1 ? dx : 0), y + (i & 2 ? dy : 0), z + (i & 4 ? dz : 0)));
    const fr = FACES.map(f => (f[1][0] * sy + f[1][1] * cy) * cp + f[1][2] * sp > 0);
    return { cs, fr, col, al: al == null ? 1 : al, edge: edge || C.sub, mid: P(x + dx / 2, y + dy / 2, z + dz / 2)[2] };
  };
  const paint = (b, front) => FACES.forEach((f, i) => {
    if (b.fr[i] !== front) return;
    const pts = f[0].map(k => b.cs[k]), a = front ? b.al : b.al * 0.55;
    polyFill(ctx, pts, b.col, a, null);
    if (f[2]) polyFill(ctx, pts, '#000', a * f[2]);
    ctx.save(); ctx.globalAlpha = front ? 1 : 0.45; polyFill(ctx, pts, null, 0, b.edge, front ? 1.1 : 0.9); ctx.restore();
  });
  const sc = {
    P, S, cam: c,
    group(x, y, z, dx, dy, dz, col, al, edge) {
      const g = { box: mkBox(x, y, z, dx, dy, dz, col, al, edge), subs: [], items: [] };
      g.sub = (sx, sy_, sz, sdx, sdy, sdz, scol, sal, sedge) => g.subs.push(mkBox(sx, sy_, sz, sdx, sdy, sdz, scol, sal, sedge));
      g.dot = (x_, y_, z_, r, col_, glyph, al_) => {
        const q = P(x_, y_, z_);
        g.items.push({ d: q[2], fn: () => {
          ctx.save(); ctx.globalAlpha = al_ == null ? 1 : al_;
          const rd = Math.max(2, r * Math.pow(S, 0.65)); dot(ctx, q[0], q[1], rd, col_);
          if (glyph && rd >= 4) txt(ctx, glyph, q[0], q[1] + 0.5, C.bg, Math.max(8, rd * 1.7), 'center', 800);
          ctx.restore();
        } });
      };
      g.ion = (x_, y_, z_, sign, col_, sz) => { const q = P(x_, y_, z_); g.items.push({ d: q[2], fn: () => drawIon(ctx, q[0], q[1], sign, col_, Math.max(3, (sz || 4.2) * Math.pow(S, 0.65))) }); };
      g.fn = (x_, y_, z_, fn) => { const q = P(x_, y_, z_); g.items.push({ d: q[2], fn: () => fn(q) }); };
      groups.push(g); return g;
    },
    over(fn) { over.push(fn); },
    flush() {
      groups.sort((a, b) => b.box.mid - a.box.mid).forEach(g => {
        paint(g.box, false); g.subs.forEach(b => paint(b, false));
        g.items.sort((a, b) => b.d - a.d).forEach(it => it.fn());
        g.subs.forEach(b => paint(b, true)); paint(g.box, true);
      });
      over.forEach(fn => fn());
    }
  };
  return sc;
}
/* hạt chuyển động nhiệt: toạ độ tương đối (u,v,w ∈ 0..1) trong một vùng → hạt luôn nằm trong vùng dù vùng co giãn.
   bx / bz = vận tốc trôi thêm (px/s). Trả 1 nếu vừa dội vào mép x cao, 2 nếu mép x thấp. */
const mkGas = (n, sp) => Array.from({ length: n }, () => ({ u: rnd(0.06, 0.94), v: rnd(0.08, 0.92), w: rnd(0.08, 0.92), vx: gauss() * sp, vy: gauss() * sp, vz: gauss() * sp }));
function stepGas(q, dt, lx, ly, lz, sp, bx, bz) {
  if (Math.random() < dt * 3) { q.vx = gauss() * sp; q.vy = gauss() * sp; q.vz = gauss() * sp; }
  let hit = 0;
  q.u += (q.vx + (bx || 0)) * dt / Math.max(10, lx);
  q.v += q.vy * dt / Math.max(10, ly);
  if (lz) q.w += (q.vz + (bz || 0)) * dt / Math.max(10, lz);
  if (q.u > 0.96) { q.u = 0.96; q.vx = -Math.abs(q.vx); hit = 1; } else if (q.u < 0.04) { q.u = 0.04; q.vx = Math.abs(q.vx); hit = 2; }
  if (q.v > 0.94 || q.v < 0.06) { q.vy = -q.vy; q.v = clamp(q.v, 0.06, 0.94); }
  if (lz && (q.w > 0.94 || q.w < 0.06)) { q.vz = -q.vz; q.w = clamp(q.w, 0.06, 0.94); }
  return hit;
}

/* ---------- mô hình vật lý tiếp giáp p-n (Buổi 9 / Neamen Ch.7) ---------- */
const MATS = {
  Si:   { name: 'Si',   Eg: 1.12, er: 11.7, ni300: 1.5e10, ecMul: 1.00 },
  GaAs: { name: 'GaAs', Eg: 1.42, er: 13.1, ni300: 1.8e6,  ecMul: 1.35 },
  Ge:   { name: 'Ge',   Eg: 0.66, er: 16.0, ni300: 2.4e13, ecMul: 0.55 }
};

function vtOf(T) { return 0.0259 * (T / 300); }
function niOf(matKey, T) {
  const m = MATS[matKey] || MATS.Si;
  if (Math.abs(T - 300) < 0.01) return m.ni300;
  return m.ni300 * Math.pow(T / 300, 1.5) * Math.exp(-(m.Eg / (2 * KB)) * (1 / T - 1 / 300));
}
function stepJunc(matKey, Na, Nd, T, VR) {
  const m = MATS[matKey] || MATS.Si;
  const eps = m.er * EPS0;
  const Vt = vtOf(T);
  const ni = niOf(matKey, T);
  const phiFp = Vt * Math.log(Math.max(1.01, Na / ni));
  const phiFn = -Vt * Math.log(Math.max(1.01, Nd / ni));
  const Vbi = Math.max(0.02, Math.min(m.Eg - 0.02, phiFp - phiFn));
  const Vtot = Math.max(0.02, Vbi + (VR || 0));
  const W = Math.sqrt((2 * eps * Vtot / E_CHG) * ((Na + Nd) / (Na * Nd)));
  const xn = W * Na / (Na + Nd);
  const xp = W * Nd / (Na + Nd);
  const Emax = (E_CHG * Nd * xn) / eps;
  const Cp = eps / W;
  return { m, eps, Vt, ni, phiFp, phiFn, Vbi, Vtot, W, xn, xp, Emax, Cp };
}
function eCritOf(matKey, NB) {
  const m = MATS[matKey] || MATS.Si;
  const baseSi = 4.2e5 * Math.pow(NB / 1e16, 0.145);
  const lg = Math.log10(NB);
  const tunBoost = lg > 17 ? 1 + 0.35 * Math.pow(lg - 17, 1.6) : 1;
  return baseSi * tunBoost * m.ecMul;
}
function vBreakOf(matKey, NB) {
  const m = MATS[matKey] || MATS.Si;
  const eps = m.er * EPS0;
  const Ec = eCritOf(matKey, NB);
  const VB = (eps * Ec * Ec) / (2 * E_CHG * NB);
  return { Ec, VB };
}
function linearJunc(a, VR, matKey, T) {
  const m = MATS[matKey || 'Si'];
  const eps = m.er * EPS0;
  const Vt = vtOf(T || 300);
  const ni = niOf(matKey || 'Si', T || 300);
  let Vbi = 0.65;
  for (let i = 0; i < 10; i++) {
    const x0i = Math.pow((1.5 * eps * Math.max(0.05, Vbi)) / (E_CHG * a), 1 / 3);
    Vbi = clamp(2 * Vt * Math.log(Math.max(1.1, (a * x0i) / ni)), 0.15, m.Eg - 0.02);
  }
  const Vtot = Vbi + (VR || 0);
  const x0 = Math.pow((1.5 * eps * Vtot) / (E_CHG * a), 1 / 3);
  const W = 2 * x0;
  const Emax = (E_CHG * a * x0 * x0) / (2 * eps);
  const Cp = eps / W;
  return { eps, Vbi, Vtot, x0, W, Emax, Cp };
}

const LABS = [];

/* ==========================================================================
   TAB 1 — GHÉP p-n (Mục 1.2): KHỐI TINH THỂ 3D (TRÊN) & MẶT CẮT KHUẾCH TÁN (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'join', tag: '1', name: 'Ghép p-n', sec: 1,
  S: { joined: 1, Na: 1e16, Nd: 1e16 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Hai khối tinh thể p-Si & n-Si ghép liền tạo vùng nghèo & điện trường nội E',
      area: 'a', anim: true, view3d: true,
      ctrls: [
        { k: 'joined', seg: [[0, 'Tách rời p | n'], [1, 'Ghép p-n']] },
        { k: 'Na', l: 'Nₐ (p)', min: 15, max: 17, step: 0.2, log: 1, f: v => pw(v) },
        { k: 'Nd', l: 'N_d (n)', min: 15, max: 17, step: 0.2, log: 1, f: v => pw(v) },
        { btn: 'Chạy lại lúc ghép', fn: p => { p.S.joined = 1; p.st.prog = 0; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const j = stepJunc('Si', S.Na, S.Nd, 300, 0);

        if (st.prog == null) st.prog = S.joined ? 1 : 0;
        if (st.prevJoined !== S.joined) {
          st.prevJoined = S.joined;
          if (S.joined) st.prog = 0.02;
        }
        if (S.joined) st.prog = Math.min(1, st.prog + dt * 0.45);
        else st.prog = Math.max(0, st.prog - dt * 2.0);

        const bw = Math.min(310, W * 0.50), half = bw / 2, bd = Math.min(132, H * 0.38), bh = Math.min(92, H * 0.34);
        const gap = S.joined ? 0 : 28 * (1 - st.prog);
        const depTot = bw * 0.44 * st.prog;
        const xpPx = depTot * clamp(S.Nd / (S.Na + S.Nd), 0.14, 0.86);
        const xnPx = depTot * clamp(S.Na / (S.Na + S.Nd), 0.14, 0.86);
        const sc = scene3(p, ctx, dt, [bw / 2, bd / 2, bh / 2], [W * 0.23 + bw / 2 - bd / 4, H * 0.78 + bd * 0.14 - bh / 2], p.spec.view0);

        // Khối p (trái) & khối n (phải): kính trong suốt, hạt nằm bên trong
        const gp = sc.group(-gap, 0, 0, half, bd, bh, C.c4, 0.13, C.c4);
        const gn = sc.group(half + gap, 0, 0, half, bd, bh, C.c2, 0.13, C.c2);
        if (st.prog > 0.04) {
          gp.sub(half - gap - xpPx, 0, 0, xpPx, bd, bh, C.c5, 0.36, C.c5);
          gn.sub(half + gap, 0, 0, xnPx, bd, bh, C.c3, 0.36, C.c3);
          // Ion cố định lộ ra trong vùng nghèo (rung nhẹ theo dao động mạng)
          const ny = Math.max(2, Math.round(bd / 42)), nz = Math.max(2, Math.round(bh / 38));
          const nxP = Math.max(1, Math.round(xpPx / 26)), nxN = Math.max(1, Math.round(xnPx / 26));
          for (let a = 0; a < ny; a++) for (let b = 0; b < nz; b++) {
            for (let i = 0; i < nxP; i++) {
              const ph = i * 1.7 + a * 2.3 + b * 3.1;
              gp.ion(half - gap - (i + 0.5) * xpPx / nxP + Math.sin(t * 8 + ph) * 0.7, (a + 0.5) * bd / ny + Math.cos(t * 7 + ph) * 0.7, (b + 0.5) * bh / nz, '−', C.c5, 3.8);
            }
            for (let i = 0; i < nxN; i++) {
              const ph = i * 2.1 + a * 1.3 + b * 2.9;
              gn.ion(half + gap + (i + 0.5) * xnPx / nxN + Math.sin(t * 8 + ph) * 0.7, (a + 0.5) * bd / ny + Math.cos(t * 7 + ph) * 0.7, (b + 0.5) * bh / nz, '+', C.c4, 3.8);
            }
          }
        }

        // Hạt tải đa số: lỗ trống (p) & electron (n) chuyển động nhiệt 3D, khuếch tán qua ranh giới khi mới ghép
        if (!st.hs) { st.hs = mkGas(16, 38); st.es = mkGas(16, 44); st.fl = []; }
        const diff = S.joined && st.prog < 0.88, yL = bd - 12, zL = bh - 12;
        const hx0 = -gap + 6, hLx = Math.max(10, half - xpPx - 12);
        const ex0 = half + gap + xnPx + 6, eLx = Math.max(10, half - xnPx - 12);
        st.hs.forEach(h => {
          const hit = stepGas(h, dt, hLx, yL, zL, 38, diff ? 55 * (1 - st.prog) : 0, 0);
          const y = 6 + h.v * yL, z = 6 + h.w * zL;
          if (hit === 1 && diff && Math.random() < 0.16) st.fl.push({ x: half - gap, y, z, a: 1 });
          gp.dot(hx0 + h.u * hLx, y, z, 4.2, C.c4, '+');
        });
        st.es.forEach(e => {
          const hit = stepGas(e, dt, eLx, yL, zL, 44, diff ? -55 * (1 - st.prog) : 0, 0);
          const y = 6 + e.v * yL, z = 6 + e.w * zL;
          if (hit === 2 && diff && Math.random() < 0.16) st.fl.push({ x: half + gap, y, z, a: 1 });
          gn.dot(ex0 + e.u * eLx, y, z, 4.2, C.c2, '−');
        });
        st.fl = st.fl.filter(f => (f.a -= dt * 2.5) > 0);

        sc.over(() => {
          if (st.prog > 0.05) {
            const e1 = sc.P(half + xnPx * 0.6, bd * 0.5, bh + 30), e2 = sc.P(half - xpPx * 0.6, bd * 0.5, bh + 30);
            arr(ctx, e1[0], e1[1], e2[0], e2[1], C.main, 2.8);
            txt(ctx, 'E nội (n → p)', (e1[0] + e2[0]) / 2, Math.min(e1[1], e2[1]) - 12, C.main, 10.5, 'center', 800);
          }
          st.fl.forEach(f => {
            const q = sc.P(f.x, f.y, f.z);
            ctx.save(); ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(q[0], q[1], (4 + (1 - f.a) * 12) * sc.S, 0, TAU2);
            ctx.strokeStyle = C.main; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
          });
          const lp = sc.P(-gap + half / 2, bd / 2, bh + 8), ln_ = sc.P(half + gap + half / 2, bd / 2, bh + 8);
          txt(ctx, 'Khối p (h⁺)', lp[0], lp[1], C.c4, 10.5, 'center', 800);
          txt(ctx, 'Khối n (e⁻)', ln_[0], ln_[1], C.c2, 10.5, 'center', 800);
        });
        sc.flush();

        const gx = W - 68;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Thế V_bi', (j.Vbi * st.prog).toFixed(3) + ' V', clamp((j.Vbi * st.prog) / 1.1, 0, 1), C.main);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Vùng nghèo W', st.prog > 0.05 ? fmtUm(j.W * st.prog) : '0 µm', clamp((j.W * st.prog * 1e4) / 1.2, 0, 1), C.c5);

        chip(ctx, !S.joined ? 'ĐANG TÁCH RỜI: hai khối trung hòa, chưa có vùng nghèo'
          : st.prog >= 0.99 ? 'CÂN BẰNG NHIỆT: lực khuếch tán = lực E nội (xₚ=' + fmtUm(j.xp) + ', xₙ=' + fmtUm(j.xn) + ')'
          : 'Đang khuếch tán qua ranh giới & lộ ion cố định...', W * 0.44, 15, !S.joined ? C.mut : st.prog >= 0.99 ? C.main : C.c3, 'center');
      }
    },
    {
      title: 'Bên trong (mặt cắt ngang đồng bộ trái p → phải n): Hạt đa số khuếch tán, tái hợp & để lộ ion cố định',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, p0 = curPanels[0];
        const prog = (p0 && p0.st && p0.st.prog != null) ? p0.st.prog : (S.joined ? 1 : 0);
        const padX = 16, rightInfo = 152, topY = 10, botY = H - 10;
        const bw = W - padX - rightInfo, bh = botY - topY, midX = padX + bw / 2;
        const gap = S.joined ? 0 : 18 * (1 - prog);
        const totDepPx = bw * 0.44 * prog;
        const xpPx = totDepPx * clamp(S.Nd / (S.Na + S.Nd), 0.14, 0.86);
        const xnPx = totDepPx * clamp(S.Na / (S.Na + S.Nd), 0.14, 0.86);
        const pL = padX, pR = midX - gap / 2, nL = midX + gap / 2, nR = padX + bw;

        rr(ctx, pL, topY, pR - pL, bh, 7); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
        rr(ctx, nL, topY, nR - nL, bh, 7); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();

        if (prog > 0.04) {
          ctx.save(); ctx.globalAlpha = 0.16;
          ctx.fillStyle = C.c5; ctx.fillRect(midX - xpPx, topY + 1, xpPx, bh - 2);
          ctx.fillStyle = C.c3; ctx.fillRect(midX, topY + 1, xnPx, bh - 2);
          ctx.restore();
          ln(ctx, midX - xpPx, topY, midX - xpPx, botY, C.c5, 1.3, [4, 3]);
          ln(ctx, midX + xnPx, topY, midX + xnPx, botY, C.c3, 1.3, [4, 3]);
          ln(ctx, midX, topY, midX, botY, C.ink, 1.4);

          const rows = Math.max(2, Math.floor(bh / 26));
          const cP = Math.max(1, Math.round(xpPx / 22));
          for (let i = 0; i < cP; i++) for (let r = 0; r < rows; r++)
            drawIon(ctx, midX - (i + 0.5) * (xpPx / cP), topY + (r + 0.5) * (bh / rows), '−', C.c5, 4.8);
          const cN = Math.max(1, Math.round(xnPx / 22));
          for (let i = 0; i < cN; i++) for (let r = 0; r < rows; r++)
            drawIon(ctx, midX + (i + 0.5) * (xnPx / cN), topY + (r + 0.5) * (bh / rows), '+', C.c4, 4.8);
        }

        if (!st.hs || st.W !== W) {
          st.W = W; st.fl = [];
          st.hs = Array.from({ length: 18 }, () => ({ u: rnd(0.06, 0.94), v: rnd(0.1, 0.9), vx: gauss() * 38, vy: gauss() * 36 }));
          st.es = Array.from({ length: 18 }, () => ({ u: rnd(0.06, 0.94), v: rnd(0.1, 0.9), vx: gauss() * 44, vy: gauss() * 36 }));
        }
        const pNW = Math.max(14, (pR - pL) - xpPx), nNW = Math.max(14, (nR - nL) - xnPx);
        const diff = S.joined && prog < 0.88;
        st.hs.forEach(h => {
          if (Math.random() < dt * 3) { h.vx = gauss() * 38; h.vy = gauss() * 34; }
          let x = pL + h.u * pNW + (h.vx + (diff ? 55 * (1 - prog) : 0)) * dt, y = topY + h.v * bh + h.vy * dt;
          if (x > pL + pNW - 6) { if (diff && Math.random() < 0.16) st.fl.push({ x: midX, y: clamp(y, topY + 8, botY - 8), a: 1 }); x = pL + pNW - 6; h.vx = -Math.abs(h.vx); }
          if (x < pL + 6) { x = pL + 6; h.vx = Math.abs(h.vx); }
          if (y < topY + 6 || y > botY - 6) { h.vy = -h.vy; y = clamp(y, topY + 6, botY - 6); }
          h.u = clamp((x - pL) / pNW, 0.02, 0.98); h.v = clamp((y - topY) / bh, 0.05, 0.95);
          dot(ctx, x, y, 4.5, C.c4); txt(ctx, '+', x, y + 0.5, C.bg, 8.5, 'center', 800);
        });
        st.es.forEach(e => {
          if (Math.random() < dt * 3) { e.vx = gauss() * 44; e.vy = gauss() * 34; }
          const xMin = nL + xnPx;
          let x = xMin + e.u * nNW + (e.vx + (diff ? -55 * (1 - prog) : 0)) * dt, y = topY + e.v * bh + e.vy * dt;
          if (x < xMin + 6) { if (diff && Math.random() < 0.16) st.fl.push({ x: midX, y: clamp(y, topY + 8, botY - 8), a: 1 }); x = xMin + 6; e.vx = Math.abs(e.vx); }
          if (x > nR - 6) { x = nR - 6; e.vx = -Math.abs(e.vx); }
          if (y < topY + 6 || y > botY - 6) { e.vy = -e.vy; y = clamp(y, topY + 6, botY - 6); }
          e.u = clamp((x - xMin) / nNW, 0.02, 0.98); e.v = clamp((y - topY) / bh, 0.05, 0.95);
          dot(ctx, x, y, 4.5, C.c2); txt(ctx, '−', x, y + 0.5, C.bg, 8.5, 'center', 800);
        });
        st.fl = (st.fl || []).filter(f => (f.a -= dt * 2.5) > 0);
        st.fl.forEach(f => {
          ctx.beginPath(); ctx.arc(f.x, f.y, 4 + (1 - f.a) * 12, 0, TAU2);
          ctx.strokeStyle = C.main; ctx.globalAlpha = f.a; ctx.lineWidth = 1.8; ctx.stroke(); ctx.globalAlpha = 1;
        });

        // Cột so sánh lực khuếch tán vs lực điện trường nội bên phải (không khung rườm rà)
        const rx = padX + bw + 10, rw = rightInfo - 18;
        txt(ctx, 'Lực khuếch tán:', rx, topY + 14, C.c3, 9.8, 'left', 700);
        rr(ctx, rx, topY + 24, rw, 10, 4); ctx.fillStyle = C.tint; ctx.fill();
        if (S.joined) { rr(ctx, rx, topY + 24, rw, 10, 4); ctx.fillStyle = C.c3; ctx.fill(); }
        txt(ctx, 'Lực E nội (trôi):', rx, topY + 50, C.main, 9.8, 'left', 700);
        rr(ctx, rx, topY + 60, rw, 10, 4); ctx.fillStyle = C.tint; ctx.fill();
        if (prog > 0.02) { rr(ctx, rx, topY + 60, Math.max(6, rw * prog), 10, 4); ctx.fillStyle = C.main; ctx.fill(); }
        txt(ctx, 'Nₐxₚ = N_dxₙ', rx, botY - 12, C.ink, 10.2, 'left', 800);
        void t;
      }
    }
  ]
});

/* ==========================================================================
   TAB 2 — ĐỒI THẾ V_bi (Mục 2.3): ĐIỐT TRÊN BÀN NHIỆT 3D (TRÊN) & CON DỐC THẾ (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'hill', tag: '2a', name: 'Đồi thế V_bi', sec: 2,
  S: { mat: 'Si', Na: 1e16, Nd: 1e15, T: 300 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Mẫu p-n trên đế gia nhiệt T — thay đổi vật liệu (Si/GaAs/Ge) & pha tạp đổi V_bi',
      area: 'a', anim: true, view3d: true,
      ctrls: [
        { k: 'mat', seg: [['Si', 'Si'], ['GaAs', 'GaAs'], ['Ge', 'Ge']] },
        { k: 'Na', l: 'Nₐ', min: 14, max: 18, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'Nd', l: 'N_d', min: 14, max: 18, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'T', l: 'T', min: 200, max: 450, step: 10, f: v => v + ' K' }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, j = stepJunc(S.mat, S.Na, S.Nd, S.T, 0);
        const heat = clamp((S.T - 200) / 250, 0, 1);
        const bw = Math.min(290, W * 0.48), half = bw / 2, bd = Math.min(126, H * 0.36), bh = 74;
        const sc = scene3(p, ctx, dt, [bw / 2, bd / 2, bh / 2], [W * 0.24 + bw / 2 - bd / 4, H * 0.74 + bd * 0.14 - bh / 2], p.spec.view0);

        // Đế gia nhiệt đổi màu lạnh (xanh) → nóng (đỏ) theo T
        const plateCol = heat > 0.6 ? C.err : heat > 0.35 ? C.main : C.c1;
        sc.group(-16, -12, -16, bw + 32, bd + 24, 16, plateCol, 0.45 + 0.15 * Math.sin(t * 4), plateCol);

        // Khối mẫu p-n: kính trong suốt + vùng nghèo
        const dep = bw * 0.32, dp = dep * (j.xp / j.W), dn = dep - dp, xP = half - dp, xN = half + dn;
        const gp = sc.group(0, 0, 0, half, bd, bh, C.c4, 0.15, C.c4), gn = sc.group(half, 0, 0, half, bd, bh, C.c2, 0.15, C.c2);
        gp.sub(xP, 0, 0, dp, bd, bh, C.c5, 0.32, C.c5);
        gn.sub(half, 0, 0, dn, bd, bh, C.c5, 0.32, C.c5);

        // Hạt nhiệt leo "con dốc thế" eV_bi: phần lớn bị dội ngược, rất ít hạt nóng vượt qua
        const tb = Math.sqrt(S.T / 300), slopeF = 240 * (j.Vbi / 0.7), vMin = Math.sqrt(2 * slopeF * Math.max(10, xN - xP)) * 1.02;
        if (!st.es) {
          const yz = q => { q.y = rnd(8, bd - 8); q.z = rnd(8, bh - 8); q.vy = 0; q.vz = 0; return q; };
          st.es = Array.from({ length: 14 }, (_, i) => yz({ x: rnd(half + 10, bw - 8), vx: -rnd(55, 145), hot: i < 2 }));
          st.hs = Array.from({ length: 10 }, (_, i) => yz({ x: rnd(8, half - 10), vx: rnd(55, 145), hot: i < 2 }));
          st.me = Array.from({ length: 2 }, () => yz({ x: rnd(10, half - 10), vx: rnd(28, 52) }));
          st.mh = Array.from({ length: 2 }, () => yz({ x: rnd(half + 10, bw - 10), vx: -rnd(28, 52) }));
        }
        const walk = q => {
          if (Math.random() < dt * 3) { q.vy = gauss() * 26; q.vz = gauss() * 26; }
          q.y += q.vy * dt; q.z += q.vz * dt;
          if (q.y < 6 || q.y > bd - 6) { q.vy = -q.vy; q.y = clamp(q.y, 6, bd - 6); }
          if (q.z < 6 || q.z > bh - 6) { q.vz = -q.vz; q.z = clamp(q.z, 6, bh - 6); }
        };
        const put = (q, col, glyph, r) => { q.x = clamp(q.x, 4, bw - 4); (q.x < half ? gp : gn).dot(q.x, q.y, q.z, r, col, glyph); };
        st.es.forEach(e => {
          if (e.x > xP && e.x < xN) e.vx += slopeF * dt;
          e.x += e.vx * dt; walk(e);
          if (e.x > bw - 8) { e.x = bw - 8; e.vx = e.hot && Math.random() < clamp(0.22 * tb, 0.1, 0.55) ? -vMin * rnd(1.04, 1.18) : -rnd(45, vMin * 0.88) * tb; }
          if (e.x < 8) { e.x = bw - 10; e.vx = -rnd(55, 125) * tb; }
          put(e, e.hot && e.x < xN ? C.main : C.c2, '−', 4.2);
        });
        st.hs.forEach(h => {
          if (h.x > xP && h.x < xN) h.vx -= slopeF * dt;
          h.x += h.vx * dt; walk(h);
          if (h.x < 8) { h.x = 8; h.vx = h.hot && Math.random() < clamp(0.22 * tb, 0.1, 0.55) ? vMin * rnd(1.04, 1.18) : rnd(45, vMin * 0.88) * tb; }
          if (h.x > bw - 8) { h.x = 10; h.vx = rnd(55, 125) * tb; }
          put(h, h.hot && h.x > xP ? C.main : C.c4, '+', 4.2);
        });
        st.me.forEach(e => {
          if (e.x > xP && e.x < xN) e.vx += slopeF * 1.2 * dt;
          e.x += e.vx * dt; walk(e);
          if (e.x > bw - 8) { e.x = rnd(10, 26); e.vx = rnd(28, 50) * tb; }
          put(e, C.c3, null, 3.6);
        });
        st.mh.forEach(h => {
          if (h.x > xP && h.x < xN) h.vx -= slopeF * 1.2 * dt;
          h.x += h.vx * dt; walk(h);
          if (h.x < 8) { h.x = bw - rnd(10, 26); h.vx = -rnd(28, 50) * tb; }
          put(h, C.c3, null, 3.6);
        });

        sc.over(() => {
          // Hai kim dò đo thế tiếp xúc nội tại
          const pL = sc.P(half * 0.4, bd * 0.5, bh), pR = sc.P(half * 1.6, bd * 0.5, bh);
          drawProbe(ctx, pL[0], pL[1], -1, C.c4, 'p (φ_Fp=+' + j.phiFp.toFixed(2) + 'V)');
          drawProbe(ctx, pR[0], pR[1], 1, C.c2, 'n (|φ_Fn|=' + Math.abs(j.phiFn).toFixed(2) + 'V)');
        });
        sc.flush();

        txt(ctx, 'Đế nhiệt: ' + S.T + ' K (' + (S.T - 273) + ' °C) · ' + S.mat + ' (E_g=' + j.m.Eg + ' eV)', W * 0.44, H - 12, plateCol, 10.5, 'center', 700);

        const gx = W - 68;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Đồi thế V_bi', j.Vbi.toFixed(3) + ' V', clamp(j.Vbi / j.m.Eg, 0, 1), C.main);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Nội tại nᵢ(T)', sci(j.ni, 1), clamp((Math.log10(Math.max(1e4, j.ni)) - 4) / 12, 0, 1), plateCol);

        chip(ctx, 'V_bi = |φ_Fp| + |φ_Fn| = ' + j.Vbi.toFixed(3) + ' V (trần E_g/e = ' + j.m.Eg.toFixed(2) + ' V)', W * 0.44, 15, C.main, 'center');
      }
    },
    {
      title: 'Bên trong (con dốc thế năng đồng bộ trái p → phải n): Hạt nhiệt lao lên dốc eV_bi và bị dội ngược về',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, j = stepJunc(S.mat, S.Na, S.Nd, S.T, 0);
        const padX = 16, topY = 12, botY = H - 14, bw = W - padX * 2, bh = botY - topY;
        const midX = padX + bw * 0.5, depPx = bw * 0.30;
        const xP = midX - depPx * clamp(j.xp / j.W, 0.15, 0.85);
        const xN = midX + depPx * clamp(j.xn / j.W, 0.15, 0.85);
        const yLow = botY - 12, hillH = clamp(j.Vbi / 1.5, 0.18, 0.88) * (bh * 0.74), yHigh = yLow - hillH;

        const floorY = x => x <= xP ? yHigh : x >= xN ? yLow : yHigh + hillH * ((x - xP) / (xN - xP)) ** 2 * (3 - 2 * ((x - xP) / (xN - xP)));

        ctx.beginPath(); ctx.moveTo(padX, botY);
        for (let i = 0; i <= 60; i++) { const x = padX + (bw * i) / 60; ctx.lineTo(x, floorY(x)); }
        ctx.lineTo(padX + bw, botY); ctx.closePath();
        ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = C.c5; ctx.fill(); ctx.restore();
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) { const x = padX + (bw * i) / 60; i ? ctx.lineTo(x, floorY(x)) : ctx.moveTo(x, floorY(x)); }
        ctx.strokeStyle = C.c2; ctx.lineWidth = 2.6; ctx.stroke();

        if (!st.es || st.W !== W) {
          st.W = W;
          st.es = Array.from({ length: 18 }, (_, i) => ({ x: rnd(xN + 10, padX + bw - 10), vx: -rnd(55, 145), hot: i < 2, yOff: rnd(6, 16) }));
          st.minE = Array.from({ length: 2 }, () => ({ x: rnd(padX + 10, xP - 10), vx: rnd(28, 52), yOff: rnd(6, 14) }));
        }
        const tempBoost = Math.sqrt(S.T / 300), slopeF = 240 * (j.Vbi / 0.7);
        st.es.forEach(e => {
          if (e.x > xP && e.x < xN) e.vx += slopeF * dt;
          e.x += e.vx * dt;
          if (e.x > padX + bw - 8) {
            e.x = padX + bw - 8;
            const vMin = Math.sqrt(2 * slopeF * (xN - xP)) * 1.02;
            e.vx = e.hot && Math.random() < clamp(0.22 * tempBoost, 0.1, 0.55) ? -vMin * rnd(1.04, 1.18) : -rnd(45, vMin * 0.88) * tempBoost;
          }
          if (e.x < padX + 8) { e.x = padX + bw - 10; e.vx = -rnd(55, 125) * tempBoost; }
          const y = floorY(e.x) - e.yOff;
          dot(ctx, e.x, y, 4.6, e.hot && e.x < xN ? C.main : C.c2);
        });
        st.minE.forEach(e => {
          if (e.x > xP && e.x < xN) e.vx += slopeF * 1.2 * dt;
          e.x += e.vx * dt;
          if (e.x > padX + bw - 8) { e.x = padX + rnd(8, 24); e.vx = rnd(28, 50) * tempBoost; }
          dot(ctx, e.x, floorY(e.x) - e.yOff, 4, C.c3);
        });

        arr(ctx, xP - 14, yLow, xP - 14, yHigh, C.main, 2);
        txt(ctx, 'eV_bi = ' + j.Vbi.toFixed(3) + ' eV', xP - 20, (yLow + yHigh) / 2, C.main, 10, 'right', 800);
        txt(ctx, 'Phía p (đỉnh dốc)', padX + 6, topY + 10, C.c4, 10, 'left', 700);
        txt(ctx, 'Phía n (đáy dốc: nhiều e⁻)', padX + bw - 6, topY + 10, C.c2, 10, 'right', 700);
        void t;
      }
    }
  ]
});

/* ==========================================================================
   TAB 3 — THĂM DÒ VÙNG NGHÈO (Mục 2.7): KIM DÒ 3D (TRÊN) & ĐƯỜNG SỨC ION (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'probe', tag: '2b', name: 'Thăm dò vùng nghèo', sec: 2,
  S: { mat: 'Si', Na: 1e16, Nd: 1e15, pos: 0 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Kéo kim đầu dò trượt qua tiếp giáp p-n đo trực tiếp |E(x)| và φ(x)',
      area: 'a', anim: true, view3d: true,
      ctrls: [
        { k: 'pos', l: 'Vị trí x', min: -1, max: 1, step: 0.02, f: v => v === 0 ? 'x = 0' : (v > 0 ? '+' : '−') + Math.abs(v * 100).toFixed(0) + '%' },
        { k: 'Na', l: 'Nₐ (p)', min: 14.8, max: 17.2, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'Nd', l: 'N_d (n)', min: 14.8, max: 17.2, step: 0.1, log: 1, f: v => pw(v) },
        { btn: 'Ví dụ 2.2', fn: p => { p.S.mat = 'Si'; p.S.Na = 1e16; p.S.Nd = 1e15; p.S.pos = 0; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, j = stepJunc(S.mat, S.Na, S.Nd, 300, 0);
        const halfPhys = Math.max(j.xp, j.xn) * 1.25;
        const xPhys = S.pos * halfPhys;
        let Ecur = 0, phiCur = 0;
        if (xPhys <= -j.xp) { Ecur = 0; phiCur = 0; }
        else if (xPhys >= j.xn) { Ecur = 0; phiCur = j.Vbi; }
        else if (xPhys <= 0) {
          Ecur = (E_CHG * S.Na / j.eps) * (xPhys + j.xp);
          phiCur = (E_CHG * S.Na / (2 * j.eps)) * Math.pow(xPhys + j.xp, 2);
        } else {
          Ecur = (E_CHG * S.Nd / j.eps) * (j.xn - xPhys);
          phiCur = (E_CHG * S.Na / (2 * j.eps)) * j.xp * j.xp + (E_CHG * S.Nd / j.eps) * (j.xn * xPhys - 0.5 * xPhys * xPhys);
        }

        const bw = Math.min(320, W * 0.52), bd = Math.min(132, H * 0.36), bh = 86;
        const x3d = xp => bw * (0.5 + xp / (2 * halfPhys));
        const xP3 = x3d(-j.xp), x03 = x3d(0), xN3 = x3d(j.xn), xPr3 = x3d(xPhys);
        const sc = scene3(p, ctx, dt, [bw / 2, bd / 2, bh / 2], [W * 0.22 + bw / 2 - bd / 4, H * 0.78 + bd * 0.14 - bh / 2], p.spec.view0);

        const g = sc.group(0, 0, 0, bw, bd, bh, C.tint, 0.30, C.sub);
        g.sub(xP3, 0, 0, x03 - xP3, bd, bh, C.c5, 0.30, C.c5);
        g.sub(x03, 0, 0, xN3 - x03, bd, bh, C.c3, 0.30, C.c3);
        g.sub(xPr3 - 1.4, 0, 0, 2.8, bd, bh, C.main, 0.28, C.main);       // lát cắt tại vị trí đầu dò

        // Hạt tải đa số chuyển động nhiệt ở hai vùng trung hòa
        if (!st.hs) { st.hs = mkGas(9, 36); st.es = mkGas(9, 40); st.fd = Array.from({ length: 16 }, () => Math.random()); }
        const nP = Math.max(10, xP3 - 10), nN = Math.max(10, bw - xN3 - 10), yL = bd - 12, zL = bh - 12;
        st.hs.forEach(h => { stepGas(h, dt, nP, yL, zL, 36); g.dot(5 + h.u * nP, 6 + h.v * yL, 6 + h.w * zL, 4.2, C.c4, '+'); });
        st.es.forEach(e => { stepGas(e, dt, nN, yL, zL, 40); g.dot(xN3 + 5 + e.u * nN, 6 + e.v * yL, 6 + e.w * zL, 4.2, C.c2, '−'); });

        // Ion cố định + đường sức: chấm đi từ ion (+) sang ion (−), nhanh nhất ở x = 0 (E mạnh nhất)
        const rows = 2, layers = 2, cols = 4;
        for (let r = 0; r < rows; r++) for (let k = 0; k < layers; k++) for (let c = 0; c < cols; c++) {
          const yy = (r + 0.5) * bd / rows, zz = (k + 0.5) * bh / layers, yOff = (c - (cols - 1) / 2) * 3;
          const ixP = xP3 + ((cols - 1 - c + 0.5) / cols) * (x03 - xP3), ixN = x03 + ((c + 0.5) / cols) * (xN3 - x03);
          g.fn((ixP + ixN) / 2, yy + yOff, zz, () => {
            const a = sc.P(ixN, yy + yOff, zz), b = sc.P(ixP, yy + yOff, zz);
            ln(ctx, a[0], a[1], b[0], b[1], C.c1, 1);
          });
          g.ion(ixP, yy, zz, '−', C.c5, 3.6);
          g.ion(ixN, yy, zz, '+', C.c4, 3.6);
          const idx = (r * layers + k) * cols + c;
          let u = st.fd[idx];
          const xd = ixN + (ixP - ixN) * u;
          const eT = xd >= x03 ? (xN3 - xd) / Math.max(1e-6, xN3 - x03) : (xd - xP3) / Math.max(1e-6, x03 - xP3);
          u += (16 + 120 * clamp(eT, 0, 1)) * dt / Math.max(8, Math.abs(ixN - ixP));
          if (u >= 1) u -= 1;
          st.fd[idx] = u;
          g.dot(ixN + (ixP - ixN) * u, yy + yOff, zz, 2.4, C.c1);
        }

        sc.over(() => {
          // Kim đầu dò trượt trên mặt trên khối 3D
          const prPt = sc.P(xPr3, bd * 0.5, bh);
          drawProbe(ctx, prPt[0], prPt[1], 1, C.main, 'x=' + (xPhys >= 0 ? '+' : '−') + fmtUm(Math.abs(xPhys)));
          const lbP = sc.P(xP3 * 0.5, bd * 0.5, bh + 12), lbN = sc.P((xN3 + bw) * 0.5, bd * 0.5, bh + 12);
          txt(ctx, 'p (xₚ=' + fmtUm(j.xp) + ')', lbP[0], lbP[1], C.c5, 10, 'center', 700);
          txt(ctx, 'n (xₙ=' + fmtUm(j.xn) + ')', lbN[0], lbN[1], C.c2, 10, 'center', 700);
        });
        sc.flush();

        const gx = W - 70;
        drawMiniGauge(ctx, gx, H * 0.30, 22, '|E(x)| tại đầu dò', Ecur > 10 ? sci(Ecur, 2) : '0 V/cm', Ecur / (j.Emax || 1), C.c1);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Điện thế φ(x)', phiCur.toFixed(3) + ' V', phiCur / (j.Vbi || 1), C.main);

        chip(ctx, 'W = ' + fmtUm(j.W) + ' · |E_max| tại x=0 = ' + sci(j.Emax, 2) + ' V/cm', W * 0.44, 15, C.main, 'center');
      }
    },
    {
      title: 'Bên trong (mặt cắt ngang đồng bộ): Số ion (−) = số ion (+), mọi đường sức chụm dày nhất tại x = 0',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, j = stepJunc(S.mat, S.Na, S.Nd, 300, 0);
        const padX = 16, topY = 12, botY = H - 18, bw = W - padX * 2, bh = botY - topY;
        const halfPhys = Math.max(j.xp, j.xn) * 1.25;
        const xOf = xPhys => padX + bw * (0.5 + xPhys / (2 * halfPhys));
        const x0 = xOf(0), xP = xOf(-j.xp), xN = xOf(j.xn);

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = C.c5; ctx.fillRect(xP, topY, x0 - xP, bh);
        ctx.fillStyle = C.c3; ctx.fillRect(x0, topY, xN - x0, bh);
        ctx.restore();
        ln(ctx, xP, topY, xP, botY, C.c5, 1.4, [4, 3]);
        ln(ctx, xN, topY, xN, botY, C.c3, 1.4, [4, 3]);
        ln(ctx, x0, topY, x0, botY, C.ink, 1.5);

        // Hạt tải đa số chuyển động nhiệt ở hai vùng trung hòa
        if (!st.hs) { st.hs = mkGas(7, 36); st.es = mkGas(7, 40); }
        const nP = Math.max(10, xP - padX - 12), nN = Math.max(10, padX + bw - xN - 12), yL = bh - 12;
        st.hs.forEach(h => {
          stepGas(h, dt, nP, yL, 0, 36);
          const x = padX + 6 + h.u * nP, y = topY + 6 + h.v * yL;
          dot(ctx, x, y, 4.2, C.c4); txt(ctx, '+', x, y + 0.5, C.bg, 8.5, 'center', 800);
        });
        st.es.forEach(e => {
          stepGas(e, dt, nN, yL, 0, 40);
          const x = xN + 6 + e.u * nN, y = topY + 6 + e.v * yL;
          dot(ctx, x, y, 4.2, C.c2); txt(ctx, '−', x, y + 0.5, C.bg, 8.5, 'center', 800);
        });

        const rows = Math.max(2, Math.min(4, Math.floor(bh / 26))), cols = 4;
        if (!st.fd || st.fd.length !== rows * cols) st.fd = Array.from({ length: rows * cols }, () => Math.random());
        for (let r = 0; r < rows; r++) {
          const y = topY + (r + 0.5) * (bh / rows);
          for (let c = 0; c < cols; c++) {
            const ixP = xP + ((cols - 1 - c + 0.5) / cols) * (x0 - xP);
            const ixN = x0 + ((c + 0.5) / cols) * (xN - x0);
            const yOff = (c - (cols - 1) / 2) * 3;
            ln(ctx, ixN, y + yOff, ixP, y + yOff, C.c1, 1.1);
            drawIon(ctx, ixP, y, '−', C.c5, clamp((x0 - xP) / 11, 4, 5.8));
            drawIon(ctx, ixN, y, '+', C.c4, clamp((xN - x0) / 11, 4, 5.8));
            // chấm chạy dọc đường sức từ (+) sang (−): nhanh nhất ở x = 0
            const idx = r * cols + c;
            let u = st.fd[idx];
            const xd = ixN + (ixP - ixN) * u;
            const eT = xd >= x0 ? (xN - xd) / Math.max(1e-6, xN - x0) : (xd - xP) / Math.max(1e-6, x0 - xP);
            u += (16 + 120 * clamp(eT, 0, 1)) * dt / Math.max(8, Math.abs(ixN - ixP));
            if (u >= 1) u -= 1;
            st.fd[idx] = u;
            dot(ctx, ixN + (ixP - ixN) * u, y + yOff, 2.6, C.c1);
          }
        }

        const xPhys = S.pos * halfPhys, xPr = xOf(xPhys);
        let Ecur = 0;
        if (xPhys > -j.xp && xPhys <= 0) Ecur = (E_CHG * S.Na / j.eps) * (xPhys + j.xp);
        else if (xPhys > 0 && xPhys < j.xn) Ecur = (E_CHG * S.Nd / j.eps) * (j.xn - xPhys);
        ln(ctx, xPr, topY, xPr, botY, C.main, 2);
        const cy = topY + bh * 0.5, eFrac = Ecur / (j.Emax || 1);
        dot(ctx, xPr, cy, 5.5, C.main);
        if (eFrac > 0.03) arr(ctx, xPr, cy, xPr - (14 + 58 * eFrac), cy, C.main, 2.8);

        txt(ctx, '−xₚ (' + fmtUm(j.xp) + ')', xP, botY + 9, C.c5, 9.8, 'center', 700);
        txt(ctx, 'x=0', x0, botY + 9, C.ink, 9.8, 'center', 800);
        txt(ctx, '+xₙ (' + fmtUm(j.xn) + ')', xN, botY + 9, C.c4, 9.8, 'center', 700);
      }
    }
  ]
});

/* ==========================================================================
   TAB 4 — PHÂN CỰC NGƯỢC (Mục 3.3): MẠCH PIN 3D (TRÊN) & TỤ PHẲNG AC (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'rev', tag: '3a', name: 'Phân cực ngược', sec: 3,
  S: { VR: 5, Na: 1e16, Nd: 1e15, mat: 'Si', A: 1e-4 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Khối điốt p-n nối Nguồn ngược DC (cực − vào p, + vào n) làm vùng nghèo phình to',
      area: 'a', anim: true, view3d: true,
      ctrls: [
        { k: 'VR', l: 'V_R', min: 0, max: 30, step: 0.5, f: v => v.toFixed(1) + ' V' },
        { k: 'Na', l: 'Nₐ', min: 15, max: 18, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'Nd', l: 'N_d', min: 14.5, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'mat', seg: [['Si', 'Si'], ['GaAs', 'GaAs']] },
        { btn: 'Ví dụ 3.1', fn: p => { p.S.mat = 'Si'; p.S.Na = 1e16; p.S.Nd = 1e15; p.S.VR = 5; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const j0 = stepJunc(S.mat, S.Na, S.Nd, 300, 0);
        const j = stepJunc(S.mat, S.Na, S.Nd, 300, S.VR);
        const jMax = stepJunc(S.mat, S.Na, S.Nd, 300, 30);

        const targetF = clamp(j.W / jMax.W, 0.14, 1);
        if (st.depF == null) st.depF = targetF;
        st.depF += (targetF - st.depF) * Math.min(1, dt * 8);

        const bw = Math.min(280, W * 0.46), half = bw / 2, bd = Math.min(126, H * 0.36), bh = 80;
        const dep = bw * 0.70 * st.depF;
        const xp3 = dep * clamp(j.xp / j.W, 0.12, 0.88), xn3 = dep * clamp(j.xn / j.W, 0.12, 0.88);
        const sc = scene3(p, ctx, dt, [bw / 2, bd / 2, bh / 2], [W * 0.22 + bw / 2 - bd / 4, H * 0.78 + bd * 0.14 - bh / 2], p.spec.view0);

        const g = sc.group(0, 0, 0, bw, bd, bh, C.tint, 0.26, C.sub);
        g.sub(0, 0, 0, Math.max(4, half - xp3), bd, bh, C.c4, 0.16, C.c4);
        g.sub(half + xn3, 0, 0, Math.max(4, half - xn3), bd, bh, C.c2, 0.16, C.c2);
        g.sub(half - xp3, 0, 0, xp3, bd, bh, C.c5, 0.38, C.c5);
        g.sub(half, 0, 0, xn3, bd, bh, C.c3, 0.38, C.c3);

        // Ion cố định trong vùng nghèo đang phình
        const ny = Math.max(2, Math.round(bd / 42)), nz = Math.max(2, Math.round(bh / 38));
        const nxP = Math.max(1, Math.round(xp3 / 22)), nxN = Math.max(1, Math.round(xn3 / 22));
        for (let a = 0; a < ny; a++) for (let b = 0; b < nz; b++) {
          for (let i = 0; i < nxP; i++) { const ph = i * 1.7 + a * 2.3 + b * 3.1; g.ion(half - (i + 0.5) * xp3 / nxP + Math.sin(t * 8 + ph) * 0.6, (a + 0.5) * bd / ny + Math.cos(t * 7 + ph) * 0.6, (b + 0.5) * bh / nz, '−', C.c5, 3.6); }
          for (let i = 0; i < nxN; i++) { const ph = i * 2.1 + a * 1.3 + b * 2.9; g.ion(half + (i + 0.5) * xn3 / nxN + Math.sin(t * 8 + ph) * 0.6, (a + 0.5) * bd / ny + Math.cos(t * 7 + ph) * 0.6, (b + 0.5) * bh / nz, '+', C.c4, 3.6); }
        }

        // Hạt tải đa số bị V_R hút dạt về hai điện cực (lỗ trống → cực − bên p, electron → cực + bên n)
        if (!st.hs) {
          st.hs = mkGas(10, 36); st.es = mkGas(10, 40);
          st.mn = Array.from({ length: 3 }, () => ({ x: rnd(8, 40), y: rnd(8, bd - 8), z: rnd(8, bh - 8), vx: rnd(30, 45), vy: 0, vz: 0 }));
          st.mh = Array.from({ length: 3 }, () => ({ x: bw - rnd(8, 40), y: rnd(8, bd - 8), z: rnd(8, bh - 8), vx: -rnd(30, 45), vy: 0, vz: 0 }));
        }
        const sw = Math.min(36, 6 + 1.2 * S.VR), yL = bd - 12, zL = bh - 12;
        const hLx = Math.max(10, half - xp3 - 10), eLx = Math.max(10, half - xn3 - 10), ex0 = half + xn3 + 5;
        st.hs.forEach(h => { stepGas(h, dt, hLx, yL, zL, 36, -sw, 0); g.dot(5 + h.u * hLx, 6 + h.v * yL, 6 + h.w * zL, 4.2, C.c4, '+'); });
        st.es.forEach(e => { stepGas(e, dt, eLx, yL, zL, 40, sw, 0); g.dot(ex0 + e.u * eLx, 6 + e.v * yL, 6 + e.w * zL, 4.2, C.c2, '−'); });

        // Hạt thiểu số tạo dòng ngược rất nhỏ: bị E trong vùng nghèo kéo vọt qua
        const xL = half - xp3, xR = half + xn3, vIn = 150 + 6 * S.VR;
        const jig = q => {
          if (Math.random() < dt * 3) { q.vy = gauss() * 22; q.vz = gauss() * 22; }
          q.y += q.vy * dt; q.z += q.vz * dt;
          if (q.y < 6 || q.y > bd - 6) { q.vy = -q.vy; q.y = clamp(q.y, 6, bd - 6); }
          if (q.z < 6 || q.z > bh - 6) { q.vz = -q.vz; q.z = clamp(q.z, 6, bh - 6); }
        };
        st.mn.forEach(e => {
          const inD = e.x > xL && e.x < xR;
          e.x += (inD ? vIn : e.vx) * dt; jig(e);
          if (e.x > bw - 6) { e.x = rnd(8, Math.max(10, xL - 6)); e.vx = rnd(30, 45); }
          g.dot(e.x, e.y, e.z, 3.4, C.c3);
        });
        st.mh.forEach(h => {
          const inD = h.x > xL && h.x < xR;
          h.x -= (inD ? vIn : -h.vx) * dt; jig(h);
          if (h.x < 6) { h.x = bw - rnd(8, Math.max(10, bw - xR - 6)); h.vx = -rnd(30, 45); }
          g.dot(h.x, h.y, h.z, 3.4, C.c3);
        });

        sc.over(() => {
          const pL = sc.P(10, bd * 0.5, bh), pR = sc.P(bw - 10, bd * 0.5, bh);
          drawProbe(ctx, pL[0], pL[1], -1, C.c2, '− nối p');
          drawProbe(ctx, pR[0], pR[1], 1, C.c4, '+ nối n');
        });
        sc.flush();

        // Đồng hồ kim gọn ở cột phải (nguồn ngược, vùng nghèo, điện dung)
        const gx = W - 68, gr = H < 360 ? 18 : 22;
        drawMiniGauge(ctx, gx, H * 0.20, gr, 'Nguồn ngược V_R', S.VR.toFixed(1) + ' V', S.VR / 30, C.main);
        drawMiniGauge(ctx, gx, H * 0.50, gr, 'W (×' + (j.W / j0.W).toFixed(1) + ')', fmtUm(j.W), st.depF, C.c5);
        drawMiniGauge(ctx, gx, H * 0.80, gr, 'C\' = ε_s/W', (j.Cp * 1e9).toFixed(2) + ' nF', j.Cp / j0.Cp, C.c2);

        chip(ctx, 'V_R = ' + S.VR.toFixed(1) + ' V → W = ' + fmtUm(j.W) + ' · |E_max| = ' + sci(j.Emax, 2) + ' V/cm', W * 0.44, 15, C.main, 'center');
      }
    },
    {
      title: 'Bên trong (tụ điện phẳng tương đương đồng bộ trái p → phải n): Hai bản trung hòa tách xa theo W, mép ±dQ\' rung theo AC',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, j = stepJunc(S.mat, S.Na, S.Nd, 300, S.VR), jMax = stepJunc(S.mat, S.Na, S.Nd, 300, 30);
        const midX = W * 0.5, cy = H * 0.50;
        const baseGap = (W * 0.50) * clamp(j.W / jMax.W, 0.14, 1);
        const osc = Math.sin(t * 4.8) * 7, gap = baseGap + osc;
        const plateH = H * 0.64, plateW = 16;
        const leftX = midX - gap / 2 - plateW, rightX = midX + gap / 2;

        ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = C.main; ctx.fillRect(leftX + plateW, cy - plateH / 2, gap, plateH); ctx.restore();
        if (osc > 0) {
          ctx.save(); ctx.globalAlpha = 0.45;
          ctx.fillStyle = C.c5; ctx.fillRect(leftX + plateW, cy - plateH / 2, osc / 2 + 2, plateH);
          ctx.fillStyle = C.c4; ctx.fillRect(rightX - osc / 2 - 2, cy - plateH / 2, osc / 2 + 2, plateH);
          ctx.restore();
        }
        rr(ctx, leftX, cy - plateH / 2, plateW, plateH, 4); ctx.fillStyle = C.c4; ctx.fill();
        rr(ctx, rightX, cy - plateH / 2, plateW, plateH, 4); ctx.fillStyle = C.c2; ctx.fill();
        ln(ctx, 20, cy, leftX, cy, C.sub, 2.8);
        ln(ctx, rightX + plateW, cy, W - 20, cy, C.sub, 2.8);

        // Hạt tải đa số ở hai vùng trung hòa: bị V_R hút dạt ra xa bản, và "thở" theo AC khi mép ±dQ' rung
        if (!st.hs) { st.hs = mkGas(9, 34); st.es = mkGas(9, 34); }
        const zy = cy - plateH / 2 + 6, zh = plateH - 12;
        const lxL = Math.max(10, leftX - 8 - 26), lxR = Math.max(10, W - 26 - (rightX + plateW) - 8);
        const sw = Math.min(30, 6 + S.VR) * 0.6, ac = 22 * Math.cos(t * 4.8);
        st.hs.forEach(h => {
          stepGas(h, dt, lxL, zh, 0, 34, -(sw + ac), 0);
          const x = 26 + h.u * lxL, y = zy + h.v * zh;
          dot(ctx, x, y, 4.2, C.c4); txt(ctx, '+', x, y + 0.5, C.bg, 8.5, 'center', 800);
        });
        st.es.forEach(e => {
          stepGas(e, dt, lxR, zh, 0, 34, sw + ac, 0);
          const x = rightX + plateW + 8 + e.u * lxR, y = zy + e.v * zh;
          dot(ctx, x, y, 4.2, C.c2); txt(ctx, '−', x, y + 0.5, C.bg, 8.5, 'center', 800);
        });

        txt(ctx, '−dQ\'', leftX + plateW + 5, cy - plateH / 2 + 10, C.c5, 10, 'left', 700);
        txt(ctx, '+dQ\'', rightX - 5, cy - plateH / 2 + 10, C.c4, 10, 'right', 700);
        txt(ctx, 'Khe cách điện W = ' + fmtUm(j.W), midX, cy, C.ink, 11.5, 'center', 800);
        txt(ctx, 'Hai bản càng xa → điện dung C\' = dQ\'/dV_R = ε_s/W càng giảm!', midX, H - 10, C.mut, 10.5, 'center', 600);
      }
    }
  ]
});

/* ==========================================================================
   TAB 5 — MÁY ĐO C-V (Mục 3.6): TRẠM ĐO WAFER LCR 3D (TRÊN) & PÍT-TÔNG QUÉT (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'cv', tag: '3b', name: 'Máy đo C-V', sec: 3,
  S: { sample: 'ex34', VR: 4, Nd: 1.96e15, Na: 1.64e17 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Mâm kẹp wafer p⁺n + Kim dò BNC nối Máy đo LCR giải mã N_d và V_bi',
      area: 'a', anim: true, view3d: true,
      ctrls: [
        {
          k: 'sample',
          seg: [['ex34', 'Mẫu VD 3.4'], ['light', 'Mẫu n nhẹ'], ['heavy', 'Mẫu n đậm']],
          set: { ex34: { Nd: 1.96e15, Na: 1.64e17 }, light: { Nd: 5e14, Na: 1e17 }, heavy: { Nd: 1.5e16, Na: 5e17 } }
        },
        { k: 'VR', l: 'Vặn V_R', min: 0, max: 12, step: 0.2, f: v => v.toFixed(1) + ' V' },
        { k: 'Nd', l: 'N_d thật', min: 14.5, max: 16.5, step: 0.05, log: 1, f: v => pw(v) }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const j0 = stepJunc('Si', S.Na, S.Nd, 300, 0);
        const j1 = stepJunc('Si', S.Na, S.Nd, 300, Math.max(1, S.VR));
        const jNow = stepJunc('Si', S.Na, S.Nd, 300, S.VR);

        const invC0sq = 1 / (j0.Cp * j0.Cp), invC1sq = 1 / (j1.Cp * j1.Cp);
        const slope = (invC1sq - invC0sq) / Math.max(1, S.VR);
        const NdMeas = 2 / (E_CHG * j0.eps * slope);
        const VbiMeas = invC0sq / slope;
        const NaMeas = (j0.ni * j0.ni / NdMeas) * Math.exp(VbiMeas / j0.Vt);

        const bw = Math.min(200, W * 0.34), bd = Math.min(118, H * 0.34), siH = Math.min(78, H * 0.28);
        const depH = clamp((jNow.xn / 6.5e-4) * siH * 0.85, 8, siH * 0.86);
        const sc = scene3(p, ctx, dt, [bw / 2, bd / 2, siH / 2], [W * 0.19 + bw / 2 - bd / 4, H * 0.74 + bd * 0.14 - siH / 2], p.spec.view0);

        sc.group(-12, -10, -14, bw + 24, bd + 20, 14, C.c3, 0.45, C.sub);                 // mâm kẹp
        const g = sc.group(0, 0, 0, bw, bd, siH, C.tint, 0.26, C.sub);                   // wafer n
        g.sub(0, 0, siH - depH, bw, bd, depH, C.main, 0.32, C.main);                      // vùng nghèo xₙ
        const ge = sc.group(bw * 0.14, bd * 0.14, siH, bw * 0.72, bd * 0.72, 12, C.c4, 0.88, C.ink);   // lớp p⁺

        // Ion donor (+) cố định trong vùng nghèo: N_d càng lớn càng dày
        const lg = Math.log10(S.Nd), nxy = clamp(Math.round(2 + (lg - 14.5) * 1.2), 2, 4), nl = clamp(Math.round(depH / 18), 1, 4);
        for (let a = 0; a < nxy; a++) for (let b = 0; b < nxy; b++) for (let k = 0; k < nl; k++) {
          const ph = a * 1.9 + b * 2.7 + k * 3.3;
          g.ion((a + 0.5) * bw / nxy + Math.sin(t * 8 + ph) * 0.6, (b + 0.5) * bd / nxy + Math.cos(t * 7 + ph) * 0.6, siH - (k + 0.5) * depH / nl, '+', C.c4, 3.4);
        }
        // Electron tự do vùng trung hòa: bị V_R dồn xuống đế khi pít-tông vùng nghèo quét sâu
        if (!st.es) { st.es = mkGas(18, 30); st.hp = mkGas(8, 30); }
        const ne = clamp(Math.round(8 + (lg - 14.5) * 5), 8, 18), lz = Math.max(10, siH - depH - 8), bz = -Math.min(24, 6 + 2.2 * S.VR);
        for (let i = 0; i < ne; i++) {
          const e = st.es[i]; stepGas(e, dt, bw - 12, bd - 12, lz, 30, 0, bz);
          g.dot(6 + e.u * (bw - 12), 6 + e.v * (bd - 12), 4 + e.w * lz, 4, C.c2, '−');
        }
        // Lỗ trống cực đậm trong lớp p⁺
        st.hp.forEach(h => {
          stepGas(h, dt, bw * 0.72 - 10, bd * 0.72 - 10, 8, 30);
          ge.dot(bw * 0.14 + 5 + h.u * (bw * 0.72 - 10), bd * 0.14 + 5 + h.v * (bd * 0.72 - 10), siH + 2 + h.w * 8, 2.8, C.bg, null, 0.9);
        });

        let pTop, pCh;
        sc.over(() => {
          pTop = sc.P(bw * 0.5, bd * 0.5, siH + 12); pCh = sc.P(bw + 12, bd * 0.5, -7);
          drawProbe(ctx, pTop[0], pTop[1], 1, C.main, 'p⁺ (HI)');
        });
        sc.flush();
        pTop = sc.P(bw * 0.5, bd * 0.5, siH + 12); pCh = sc.P(bw + 12, bd * 0.5, -7);

        // Đồng hồ kim gọn ở cột phải: kết quả máy đo LCR giải mã
        const gx = W - 68, gr = H < 400 ? 17 : 21;
        drawMiniGauge(ctx, gx, H * 0.15, gr, 'Điện dung C\'', (jNow.Cp * 1e9).toFixed(2) + ' nF/cm²', clamp(jNow.Cp / j0.Cp, 0, 1), C.main);
        drawMiniGauge(ctx, gx, H * 0.38, gr, 'Bề dày xₙ', fmtUm(jNow.xn), clamp(jNow.xn / 6.5e-4, 0, 1), C.c2);
        drawMiniGauge(ctx, gx, H * 0.61, gr, 'N_d (từ dốc 1/C\'²)', sci(NdMeas, 2), clamp((Math.log10(Math.max(1e13, NdMeas)) - 14.5) / 2, 0, 1), C.ink);
        drawMiniGauge(ctx, gx, H * 0.84, gr, 'V_bi (ngoại suy)', VbiMeas.toFixed(3) + ' V', clamp(VbiMeas / 1.0, 0, 1), C.c5);
        chip(ctx, 'Tiếp giáp một phía p⁺n: đo C\' theo V_R để "soi" N_d mà không cần cắt mẫu!', W * 0.5, 15, C.main, 'center');
      }
    },
    {
      title: 'Bên trong (mặt cắt p⁺n): Lớp p⁺ cực đậm đứng yên (xₚ≈0), pít-tông xₙ quét qua các nguyên tử donor phía n',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, j = stepJunc('Si', S.Na, S.Nd, 300, S.VR);
        const padX = 16, topY = 12, botY = H - 16, bw = W - padX * 2, bh = botY - topY;
        const pPlusW = bw * 0.14, xJunc = padX + pPlusW, nAreaW = bw - pPlusW;
        const targetXnPx = nAreaW * clamp(j.xn / 6.5e-4, 0.05, 0.94);
        if (st.xnPx == null) st.xnPx = targetXnPx;
        st.xnPx += (targetXnPx - st.xnPx) * Math.min(1, dt * 9);
        const xEdge = xJunc + st.xnPx;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.28; ctx.fillStyle = C.c4; ctx.fillRect(padX, topY, pPlusW, bh);
        ctx.globalAlpha = 0.18; ctx.fillStyle = C.main; ctx.fillRect(xJunc, topY, st.xnPx, bh);
        ctx.globalAlpha = 0.08; ctx.fillStyle = C.c2; ctx.fillRect(xEdge, topY, padX + bw - xEdge, bh);
        ctx.restore();
        ln(ctx, xJunc, topY, xJunc, botY, C.ink, 1.8);
        ln(ctx, xEdge, topY, xEdge, botY, C.main, 2.8);
        ln(ctx, xEdge + Math.sin(t * 7) * 2.5, topY + 5, xEdge + Math.sin(t * 7) * 2.5, botY - 5, C.c3, 1.2, [3, 3]);

        const seedKey = Math.round(Math.log10(S.Nd) * 20);
        if (!st.donors || st.seedKey !== seedKey || st.W !== W) {
          st.seedKey = seedKey; st.W = W;
          const cnt = Math.round(22 + (Math.log10(S.Nd) - 14.5) * 44);
          st.donors = Array.from({ length: cnt }, (_, i) => {
            const cols = Math.ceil(Math.sqrt(cnt * 2.4)), rows = Math.ceil(cnt / cols);
            return { u: clamp((i % cols + 0.5 + rnd(-0.25, 0.25)) / cols, 0.03, 0.97), v: clamp((Math.floor(i / cols) + 0.5 + rnd(-0.25, 0.25)) / rows, 0.1, 0.9) };
          });
        }
        st.donors.forEach((d, i) => {
          const x = xJunc + d.u * nAreaW, y = topY + d.v * bh;
          if (x < xEdge - 3) drawIon(ctx, x + Math.sin(t * 9 + i) * 0.8, y + Math.cos(t * 8 + i * 1.7) * 0.8, '+', C.c4, 4.6);   // ion cố định: chỉ rung nhẹ
          else {                                                                                                              // electron tự do: chuyển động nhiệt quanh donor
            d.jx = (d.jx || 0) + (-(d.jx || 0) * 4 + gauss() * 55) * dt; d.jy = (d.jy || 0) + (-(d.jy || 0) * 4 + gauss() * 55) * dt;
            d.jx = clamp(d.jx, -9, 9); d.jy = clamp(d.jy, -9, 9);
            dot(ctx, x + d.jx, y + d.jy, 3.8, C.c2);
          }
        });
        txt(ctx, 'p⁺', padX + pPlusW / 2, topY + bh * 0.42, C.c4, 15, 'center', 800);
        txt(ctx, 'xₚ≈0', padX + pPlusW / 2, topY + bh * 0.68, C.c5, 9.5, 'center', 700);
        txt(ctx, 'N_d càng nhỏ → donor càng thưa → pít-tông xₙ quét càng sâu → C\' tụt càng mạnh', W / 2, botY + 9, C.mut, 9.8, 'center', 600);
      }
    }
  ]
});

/* ==========================================================================
   TAB 6 — ĐÁNH THỦNG (Mục 4.1): MẠCH CAO ÁP 3D (TRÊN) & BUỒNG TUYẾT LỞ/ZENER (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'brk', tag: '4', name: 'Đánh thủng', sec: 4,
  S: { mode: 'avalanche', NB: 4e15, VR: 90, mat: 'Si' },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Bàn thử đánh thủng cao áp — Điốt p-n + Điện trở hạn dòng & Cảnh báo dòng vọt',
      area: 'a', anim: true, view3d: true,
      ctrls: [
        { k: 'mode', seg: [['avalanche', 'Thác lũ (Avalanche)'], ['zener', 'Xuyên hầm (Zener)']], set: { avalanche: { NB: 4e15, VR: 95 }, zener: { NB: 9e17, VR: 3.6 } } },
        { k: 'NB', l: 'N_B (nhẹ)', min: 14.5, max: 18.2, step: 0.05, log: 1, f: v => pw(v) },
        { k: 'VR', l: 'V_R', min: 0, max: 150, step: 0.5, f: v => v.toFixed(1) + ' V' },
        { k: 'mat', seg: [['Si', 'Si'], ['GaAs', 'GaAs']] }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const { Ec, VB } = vBreakOf(S.mat, S.NB);
        const r = S.VR / Math.max(0.5, VB), ratio = clamp(r, 0, 1.2);
        const broken = r >= 0.98, isZener = S.mode === 'zener' || VB < 4.5;
        const iTarget = clamp(0.03 + (r > 0.65 ? Math.pow((r - 0.65) / 0.36, 5) : 0), 0, 1);
        if (st.iVal == null) st.iVal = iTarget;
        st.iVal += (iTarget - st.iVal) * Math.min(1, dt * 8);
        const M = r >= 0.99 ? Infinity : 1 / Math.max(0.005, 1 - Math.pow(clamp(r, 0, 0.99), 3));

        const bw = Math.min(260, W * 0.44), bd = Math.min(120, H * 0.34), bh = 74;
        const depW = bw * (isZener ? 0.14 : 0.58), x1 = (bw - depW) / 2, x2 = x1 + depW;
        const sc = scene3(p, ctx, dt, [bw / 2, bd / 2, bh / 2], [W * 0.22 + bw / 2 - bd / 4, H * 0.76 + bd * 0.14 - bh / 2], p.spec.view0);
        const g = sc.group(0, 0, 0, bw, bd, bh, C.tint, 0.26, broken ? C.err : C.sub);
        g.sub(x1, 0, 0, depW, bd, bh, broken ? C.err : C.main, broken ? 0.42 + 0.16 * Math.sin(t * 14) : 0.28, broken ? C.err : C.main);

        if (!st.hs) {
          st.hs = mkGas(7, 34); st.es = mkGas(7, 38); st.aps = []; st.fl = []; st.spawn = 0;
          st.zps = Array.from({ length: 14 }, (_, i) => ({ u: i / 14, y: rnd(10, bd - 10), z: rnd(10, bh - 10) }));
        }
        // Hạt đa số ở hai vùng trung hòa bị điện áp ngược hút dạt ra xa vùng nghèo
        const lxL = Math.max(10, x1 - 12), lxR = Math.max(10, bw - x2 - 12), sw = 8 + 26 * clamp(ratio, 0, 1), yL = bd - 12, zL = bh - 12;
        st.hs.forEach(h => { stepGas(h, dt, lxL, yL, zL, 34, -sw, 0); g.dot(6 + h.u * lxL, 6 + h.v * yL, 6 + h.w * zL, 4, C.c4, '+'); });
        st.es.forEach(e => { stepGas(e, dt, lxR, yL, zL, 38, sw, 0); g.dot(x2 + 6 + e.u * lxR, 6 + e.v * yL, 6 + e.w * zL, 4, C.c2, '−'); });

        if (isZener) {
          // Xuyên hầm: electron "chui" qua vùng nghèo mỏng thành dạng sóng khi E đủ lớn
          const spd = ratio < 0.5 ? 0.08 : 0.3 + Math.pow(ratio, 3) * 1.5;
          st.zps.forEach(q => {
            q.u = (q.u + dt * spd) % 1;
            const x = 6 + q.u * (bw - 12), inW = x > x1 && x < x2;
            if (inW && ratio < 0.55) return;
            if (inW) g.fn(x, q.y, q.z, c => {
              ctx.beginPath();
              for (let k = -8; k <= 8; k += 2) { const wx = c[0] + k * sc.S, wy = c[1] + Math.sin(k * 0.7 - t * 20) * 3; k === -8 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy); }
              ctx.strokeStyle = C.c2; ctx.lineWidth = 2; ctx.stroke();
            });
            else g.dot(x, q.y, q.z, 3.8, C.c2, '−');
          });
        } else {
          // Thác lũ: electron được E gia tốc, va chạm ion hóa sinh cặp e⁻/h⁺ mới
          st.spawn -= dt;
          if (st.spawn <= 0 && st.aps.length < 40) {
            st.aps.push({ x: x1 + 4, y: rnd(8, bd - 8), z: rnd(8, bh - 8), vx: 95, vy: gauss() * 12, vz: gauss() * 12, type: 'e', dist: 0, gen: 0 });
            st.spawn = broken ? 0.14 : 0.4;
          }
          const ionRate = ratio < 0.35 ? 0 : Math.pow(ratio, 3.2) * 3.2, next = [];
          st.aps.forEach(q => {
            const dir = q.type === 'e' ? 1 : -1;
            q.vx = Math.min(260, q.vx + (120 + 220 * ratio) * dt);
            q.x += dir * q.vx * dt; q.y = clamp(q.y + q.vy * dt, 8, bd - 8); q.z = clamp(q.z + q.vz * dt, 8, bh - 8); q.dist += q.vx * dt;
            if (q.x > x1 + 14 && q.x < x2 - 14 && q.dist > 44 && q.gen < 3 && next.length + st.aps.length < 46 && Math.random() < ionRate * dt * 3.5) {
              q.dist = 0; q.vx = 70; st.fl.push({ x: q.x, y: q.y, z: q.z, a: 1 });
              next.push({ x: q.x + 3, y: clamp(q.y + rnd(-8, 8), 8, bd - 8), z: clamp(q.z + rnd(-8, 8), 8, bh - 8), vx: 70, vy: gauss() * 22, vz: gauss() * 22, type: 'e', dist: 0, gen: q.gen + 1 });
              next.push({ x: q.x - 3, y: clamp(q.y + rnd(-8, 8), 8, bd - 8), z: clamp(q.z + rnd(-8, 8), 8, bh - 8), vx: 60, vy: gauss() * 22, vz: gauss() * 22, type: 'h', dist: 0, gen: q.gen + 1 });
            }
            if (q.x >= 4 && q.x <= bw - 4) { next.push(q); g.dot(q.x, q.y, q.z, 4, q.type === 'e' ? C.c2 : C.c4, q.type === 'e' ? '−' : '+'); }
          });
          st.aps = next;
          st.fl = st.fl.filter(f => (f.a -= dt * 2.5) > 0);
        }

        sc.over(() => {
          st.fl.forEach(f => {
            const q = sc.P(f.x, f.y, f.z);
            ctx.save(); ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(q[0], q[1], (5 + (1 - f.a) * 14) * sc.S, 0, TAU2);
            ctx.strokeStyle = broken ? C.err : C.main; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
          });
          // Chớp sáng phóng điện khi đánh thủng
          if (broken) {
            const cPt = sc.P(bw * 0.5, bd * 0.5, bh * 0.5);
            ctx.save(); ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 18); dot(ctx, cPt[0], cPt[1], 36 * sc.S, C.err); ctx.restore();
          }
        });
        sc.flush();

        // Vỏ điốt thực tế thu nhỏ bên trái kết nối dây mạch
        drawDiodePkg(ctx, W * 0.10, H * 0.48, 0.95, broken ? C.err : C.main, isZener ? 'Zener' : 'Avalanche');

        // 2 đồng hồ mini KHÔNG khung bên phải
        const gx = W - 70;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Ampe kế ngược', broken ? 'VỌT ĐỎ!' : r > 0.78 ? 'Đang tăng...' : 'I_rò ≈ 0', st.iVal, C.main, 0.75);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Nhân hạt Mₙ', isFinite(M) ? M.toFixed(1) + '×' : '∞ (Đánh thủng)', clamp(1 - 1 / Math.max(1, M), 0, 1), C.c3, 0.85);

        txt(ctx, 'V_B ≈ ' + (VB >= 10 ? VB.toFixed(0) : VB.toFixed(1)) + ' V · E_crit ≈ ' + sci(Ec, 2) + ' V/cm · ∫αdx = ' + (r >= 0.99 ? '1.00!' : (1 - 1 / M).toFixed(2)),
          W * 0.44, H - 12, broken ? C.err : C.ink, 10.5, 'center', 700);
        chip(ctx, broken ? 'ĐÃ ĐÁNH THỦNG (' + (isZener ? 'XUYÊN HẦM ZENER' : 'TUYẾT LỞ THÁC LŨ') + ')! Cần R hạn dòng!'
          : 'Đang ở ' + Math.round(r * 100) + '% V_B — kéo V_R vượt V_B để thấy đánh thủng', W * 0.44, 15, broken ? C.err : C.main, 'center');
      }
    },
    {
      title: 'Bên trong (buồng vùng nghèo đồng bộ trái p → phải n): Tuyết lở ion hóa va chạm vs Xuyên hầm Zener',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const { VB } = vBreakOf(S.mat, S.NB);
        const ratio = clamp(S.VR / Math.max(0.5, VB), 0, 1.2);
        const isZener = S.mode === 'zener' || VB < 4.5, broken = ratio >= 0.98;
        const padX = 16, topY = 10, botY = H - 10, bw = W - padX * 2, bh = botY - topY, midX = padX + bw / 2;
        const depW = bw * (isZener ? 0.14 : 0.64), x1 = midX - depW / 2, x2 = midX + depW / 2;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = broken ? C.err : C.g; ctx.lineWidth = broken ? 1.8 : 1.2; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = broken ? 0.22 : 0.12; ctx.fillStyle = broken ? C.err : C.main; ctx.fillRect(x1, topY, depW, bh);
        ctx.restore();
        ln(ctx, x1, topY, x1, botY, C.c5, 1.4, [4, 3]);
        ln(ctx, x2, topY, x2, botY, C.c4, 1.4, [4, 3]);

        if (isZener) {
          const rows = 4;
          for (let r = 0; r < rows; r++) {
            const y = topY + (r + 0.5) * (bh / rows);
            ln(ctx, x1 - 8, y, x2 + 8, y + Math.sin(t * 18 + r * 2) * (1 + 3 * ratio), broken ? C.err : C.mut, 1.2, [3, 3]);
          }
          if (!st.zps) st.zps = Array.from({ length: 14 }, (_, i) => ({ u: i / 14, row: i % 4 }));
          const sp = ratio < 0.5 ? 0.08 : 0.3 + Math.pow(ratio, 3) * 1.5;
          st.zps.forEach(q => {
            q.u = (q.u + dt * sp) % 1;
            const y = topY + ((q.row + 0.5) / 4) * bh, x = padX + 10 + q.u * (bw - 20);
            const inW = x > x1 && x < x2;
            if (inW && ratio < 0.55) return;
            if (inW) {
              ctx.beginPath();
              for (let k = -8; k <= 8; k += 2) { const wx = x + k, wy = y + Math.sin(k * 0.7 - t * 20) * 3; k === -8 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy); }
              ctx.strokeStyle = C.c2; ctx.lineWidth = 2; ctx.stroke();
            } else { dot(ctx, x, y, 4.4, C.c2); }
          });
        } else {
          if (!st.aps) st.aps = [];
          if (!st.fl) st.fl = [];
          st.spawn = (st.spawn || 0) - dt;
          if (st.spawn <= 0 && st.aps.length < 44) {
            st.aps.push({ x: x1 + 4, y: rnd(topY + 12, botY - 12), vx: 95, vy: gauss() * 12, type: 'e', dist: 0, gen: 0 });
            st.spawn = broken ? 0.14 : 0.65;
          }
          const ionRate = ratio < 0.35 ? 0 : Math.pow(ratio, 3.2) * 3.2, next = [];
          st.aps.forEach(q => {
            const dir = q.type === 'e' ? 1 : -1;
            q.vx = Math.min(260, q.vx + (120 + 220 * ratio) * dt);
            q.x += dir * q.vx * dt; q.y = clamp(q.y + q.vy * dt, topY + 8, botY - 8); q.dist += q.vx * dt;
            if (q.x > x1 + 14 && q.x < x2 - 14 && q.dist > 44 && q.gen < 3 && next.length + st.aps.length < 46 && Math.random() < ionRate * dt * 3.5) {
              q.dist = 0; q.vx = 70; st.fl.push({ x: q.x, y: q.y, a: 1 });
              next.push({ x: q.x + 3, y: clamp(q.y + rnd(-8, 8), topY + 8, botY - 8), vx: 70, vy: gauss() * 22, type: 'e', dist: 0, gen: q.gen + 1 });
              next.push({ x: q.x - 3, y: clamp(q.y + rnd(-8, 8), topY + 8, botY - 8), vx: 60, vy: gauss() * 22, type: 'h', dist: 0, gen: q.gen + 1 });
            }
            if (q.x >= padX + 4 && q.x <= padX + bw - 4) {
              next.push(q);
              dot(ctx, q.x, q.y, 4.4, q.type === 'e' ? C.c2 : C.c4);
            }
          });
          st.aps = next;
          st.fl = st.fl.filter(f => (f.a -= dt * 2.5) > 0);
          st.fl.forEach(f => {
            ctx.beginPath(); ctx.arc(f.x, f.y, 5 + (1 - f.a) * 14, 0, TAU2);
            ctx.strokeStyle = broken ? C.err : C.main; ctx.globalAlpha = f.a; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
          });
        }
        txt(ctx, 'p', padX + 10, topY + 12, C.c4, 10.5, 'left', 800);
        txt(ctx, 'n', padX + bw - 10, topY + 12, C.c2, 10.5, 'right', 800);
      }
    }
  ]
});

/* ==========================================================================
   TAB 7 — SO SÁNH PHA TẠP (Mục 5.2): 2 KHỐI 3D CHUNG NGUỒN V_R (TRÊN) & MẬT ĐỘ ION (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'grad', tag: '5a', name: 'So sánh pha tạp', sec: 5,
  S: { VR: 5, cmp: 'linear', a: 1e20 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Hai khối p-n mắc chung một nguồn V_R — so tốc độ phình vùng nghèo 3D',
      area: 'a', anim: true, view3d: true, view0: { yaw: 24, pitch: 34, zoom: 1.1 },
      ctrls: [
        { k: 'VR', l: 'V_R chung', min: 0, max: 20, step: 0.4, f: v => v.toFixed(1) + ' V' },
        { k: 'cmp', seg: [['linear', 'Đột biến vs Tuyến tính'], ['hyper', 'Đột biến vs Siêu đột biến']] },
        { k: 'a', l: 'Gradien a', min: 19, max: 21.5, step: 0.1, log: 1, f: v => pw(v) }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st, rV = (0.68 + S.VR) / 0.68;
        const wStep = Math.pow(rV, 0.5), wLin = Math.pow(rV, 1 / 3), wHyp = Math.pow(rV, 1.35);
        const wB_t = S.cmp === 'linear' ? wLin : wHyp;
        if (st.wA == null) { st.wA = wStep; st.wB = wB_t; }
        st.wA += (wStep - st.wA) * Math.min(1, dt * 8);
        st.wB += (wB_t - st.wB) * Math.min(1, dt * 8);

        const bw = Math.min(280, W * 0.46), bd = 54, bh = 42, gY = 90, y2 = bd + gY;
        const baseDep = bw * 0.11;
        const dA = clamp(baseDep * st.wA, baseDep, bw * 0.88);
        const dB = clamp(baseDep * st.wB, baseDep, bw * 0.88);
        const colB = S.cmp === 'linear' ? C.c2 : C.main;
        const sc = scene3(p, ctx, dt, [bw / 2, (0 + y2 + bd) / 2, bh / 2], [W * 0.24 + bw / 2 - 14, H * 0.60], p.spec.view0);

        sc.group(-14, -14, -10, bw + 28, y2 + bd + 28, 10, C.c1, 0.12, C.sub);              // bo mạch chung nguồn V_R
        const dens = (mode, u) => { u = clamp(u, 0, 1); return mode === 'step' ? 0.65 : mode === 'linear' ? (0.15 + 0.85 * u) : (1.0 - 0.82 * Math.pow(u, 0.55)); };
        if (!st.cs) st.cs = [0, 1, 2, 3].map(() => ({ h: mkGas(9, 34), e: mkGas(9, 38) }));
        const build = (y0, d, col, mode, cs) => {
          const g = sc.group(0, y0, 0, bw, bd, bh, C.tint, 0.26, col);
          g.sub((bw - d) / 2, 0, 0, d, bd, bh, col, 0.44, col);
          // Ion lộ ra: mật độ theo kiểu pha tạp (đều / tuyến tính / siêu đột biến)
          const cols = 6;
          for (let c = 0; c < cols; c++) {
            const dx = (c + 0.5) / cols * (d / 2), nR = Math.max(1, Math.round(dens(mode, dx / (bw * 0.48)) * 3));
            for (let r = 0; r < nR; r++) {
              const yy = y0 + (r + 0.5) * bd / nR, zz = bh * ((((r * 2 + c) % 3) + 0.5) / 3), ph = c * 1.9 + r * 2.7;
              g.ion(bw / 2 - dx + Math.sin(t * 8 + ph) * 0.6, yy + Math.cos(t * 7 + ph) * 0.6, zz, '−', C.c5, 3.2);
              g.ion(bw / 2 + dx + Math.sin(t * 8 + ph + 1) * 0.6, yy + Math.cos(t * 7 + ph + 1) * 0.6, zz, '+', C.c4, 3.2);
            }
          }
          // Hạt tải chuyển động nhiệt ở hai vùng trung hòa
          const lx = Math.max(10, (bw - d) / 2 - 10), yL = bd - 10, zL = bh - 10;
          cs.h.forEach(h => { stepGas(h, dt, lx, yL, zL, 34); g.dot(5 + h.u * lx, y0 + 5 + h.v * yL, 5 + h.w * zL, 3.6, C.c4, '+'); });
          cs.e.forEach(e => { stepGas(e, dt, lx, yL, zL, 38); g.dot((bw + d) / 2 + 5 + e.u * lx, y0 + 5 + e.v * yL, 5 + e.w * zL, 3.6, C.c2, '−'); });
        };
        build(0, dA, C.c5, 'step', st.cs[0]);
        build(y2, dB, colB, S.cmp === 'linear' ? 'linear' : 'hyper', st.cs[1]);

        sc.over(() => {
          const p1 = sc.P(bw / 2, bd / 2, bh + 34), p2 = sc.P(bw / 2, y2 + bd / 2, bh + 34);
          txt(ctx, '1) Đột biến (V¹ᐟ²)', p1[0], p1[1], C.c5, 10.5, 'center', 800);
          txt(ctx, S.cmp === 'linear' ? '2) Tuyến tính (V¹ᐟ³)' : '2) Siêu đột biến (m<0)', p2[0], p2[1], colB, 10.5, 'center', 800);
        });
        sc.flush();

        const gx = W - 70;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Đột biến W/W₀', '×' + st.wA.toFixed(2), clamp(st.wA / 6, 0, 1), C.c5);
        drawMiniGauge(ctx, gx, H * 0.72, 22, S.cmp === 'linear' ? 'Tuyến tính W/W₀' : 'Siêu đột biến', '×' + st.wB.toFixed(2), clamp(st.wB / 8, 0, 1), colB);

        chip(ctx, 'Cùng đặt V_R = ' + S.VR.toFixed(1) + ' V: ' + (S.cmp === 'linear' ? 'Tuyến tính nở chậm hơn Đột biến' : 'Siêu đột biến phóng vùng nghèo CỰC NHANH!'),
          W * 0.44, 15, colB, 'center');
      }
    },
    {
      title: 'Bên trong (mặt cắt phân bố ion): mật độ ion dày/thưa ra ngoài quyết định biên vùng nghèo nở nhanh hay chậm',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, p0 = curPanels[0];
        const wA = (p0 && p0.st && p0.st.wA) || 1, wB = (p0 && p0.st && p0.st.wB) || 1;
        const padX = 16, topY = 14, gapY = 18, barH = (H - topY - gapY - 14) / 2, bw = W - padX * 2, midX = padX + bw / 2;

        const drawBar = (y, lbl, wRat, mode, col) => {
          const halfPx = clamp(bw * 0.055 * wRat, bw * 0.055, bw * 0.46);
          const xL = midX - halfPx, xR = midX + halfPx;
          txt(ctx, lbl, padX, y - 6, col, 10, 'left', 700);
          txt(ctx, 'C\'/C\'₀ = ' + (1 / wRat).toFixed(2), padX + bw, y - 6, C.ink, 10, 'right', 700);
          rr(ctx, padX, y + 2, bw, barH - 4, 6); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
          ctx.save(); ctx.globalAlpha = 0.20; ctx.fillStyle = col; ctx.fillRect(xL, y + 3, xR - xL, barH - 6); ctx.restore();

          const rows = Math.max(2, Math.floor((barH - 6) / 18)), cols = 12;
          for (let c = 0; c < cols; c++) {
            const u = (c + 0.5) / cols;
            const dens = mode === 'step' ? 0.65 : mode === 'linear' ? (0.15 + 0.85 * u) : (1.0 - 0.82 * Math.pow(u, 0.55));
            const nR = Math.max(1, Math.round(dens * rows)), dx = u * (bw * 0.48), inD = dx <= halfPx;
            for (let r = 0; r < nR; r++) {
              const yy = y + 3 + (r + 0.5) * ((barH - 6) / nR), ph = c * 1.9 + r * 2.7 + y * 0.13;
              if (inD) {   // ion cố định: chỉ rung nhẹ tại chỗ
                drawIon(ctx, midX - dx + Math.sin(t * 8 + ph) * 0.8, yy + Math.cos(t * 7 + ph) * 0.8, '−', C.c5, 3.8);
                drawIon(ctx, midX + dx + Math.sin(t * 8 + ph + 1) * 0.8, yy + Math.cos(t * 7 + ph + 1) * 0.8, '+', C.c4, 3.8);
              } else {      // hạt tải tự do: chuyển động nhiệt hỗn loạn quanh vị trí
                dot(ctx, midX - dx + Math.sin(t * 3.1 + ph) * 2.6 + Math.sin(t * 7.3 + ph * 2) * 1.2, yy + Math.cos(t * 2.7 + ph * 1.3) * 2.6, 2.8, C.c4);
                dot(ctx, midX + dx + Math.sin(t * 3.3 + ph + 2) * 2.6 + Math.sin(t * 6.9 + ph * 2) * 1.2, yy + Math.cos(t * 2.9 + ph * 1.1) * 2.6, 2.8, C.c2);
              }
            }
          }
          ln(ctx, xL, y + 2, xL, y + barH - 2, col, 1.8, [3, 2]);
          ln(ctx, xR, y + 2, xR, y + barH - 2, col, 1.8, [3, 2]);
        };

        drawBar(topY, '1) Đột biến (ion phân bố đều)', wA, 'step', C.c5);
        const lj = linearJunc(S.a, S.VR, 'Si', 300);
        drawBar(topY + barH + gapY, S.cmp === 'linear' ? '2) Tuyến tính (thưa giữa, dày ngoài · W=' + fmtUm(lj.W) + ')' : '2) Siêu đột biến m<0 (dày giữa, thưa ngoài)',
          wB, S.cmp === 'linear' ? 'linear' : 'hyper', S.cmp === 'linear' ? C.c2 : C.main);
      }
    }
  ]
});

/* ==========================================================================
   TAB 8 — ĐÀI LC BIẾN DUNG (Mục 5.4): MẠCH LC + VARACTOR (TRÊN) & THANG RADIO (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'var', tag: '5b', name: 'Đài LC biến dung', sec: 5,
  S: { m: -1.5, VR: 4, Vbi: 0.7 },
  cols: '2.1fr 1fr', rows: '2.6fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Mạch cộng hưởng LC dùng Varactor — vặn V_R giãn khe tụ W chỉnh tần số dao động f',
      area: 'a', anim: true, cam2d: true,
      ctrls: [
        { k: 'm', l: 'Số mũ m', min: -1.75, max: 2, step: 0.05, f: v => v.toFixed(2) },
        { k: 'VR', l: 'Áp V_R', min: 0, max: 10, step: 0.2, f: v => v.toFixed(1) + ' V' },
        { btn: 'm = −3/2', fn: p => { p.S.m = -1.5; p.syncCtrls(); p.dirty = true; } },
        { btn: 'm = 0', fn: p => { p.S.m = 0; p.syncCtrls(); p.dirty = true; } },
        { btn: 'm = +1', fn: p => { p.S.m = 1; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const expC = -1 / (S.m + 2), expF = 1 / (2 * (S.m + 2));
        const rC = Math.pow(1 + S.VR / S.Vbi, expC), rW = 1 / rC, rF = Math.pow(1 + S.VR / S.Vbi, expF);
        const isLin = Math.abs(S.m + 1.5) < 0.03;

        const lx = W * 0.22, rx = W * 0.58, topY = 40, botY = H - 24, midY = (topY + botY) / 2;
        ln(ctx, lx, topY, rx, topY, C.sub, 2.5); ln(ctx, lx, botY, rx, botY, C.sub, 2.5);
        ln(ctx, lx, topY, lx, topY + 20, C.sub, 2.5); ln(ctx, lx, botY - 20, lx, botY, C.sub, 2.5);
        ln(ctx, rx, topY, rx, midY - 46, C.sub, 2.5); ln(ctx, rx, midY + 46, rx, botY, C.sub, 2.5);

        const omega = 2.2 + clamp(rF - 1, 0, 14) * 0.65;
        const osc = Math.sin(t * omega);
        const curPos = (rx - lx) * (0.5 + 0.36 * osc);
        dot(ctx, lx + curPos, topY, 4.4, C.main);
        dot(ctx, rx - curPos, botY, 4.4, C.main);

        // Cuộn cảm L phát sáng nhịp từ trường
        const cTop = topY + 20, cBot = botY - 20, nLoops = 5, loopH = (cBot - cTop) / nLoops;
        ctx.save(); ctx.globalAlpha = 0.1 + 0.22 * Math.abs(Math.cos(t * omega));
        rr(ctx, lx - 24, cTop - 4, 48, cBot - cTop + 8, 12); ctx.fillStyle = C.c1; ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.c1; ctx.lineWidth = 3;
        for (let i = 0; i < nLoops; i++) {
          ctx.beginPath(); ctx.arc(lx, cTop + (i + 0.5) * loopH, loopH * 0.55, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        }
        txt(ctx, 'Cuộn cảm L', lx - 30, midY, C.c1, 11, 'right', 700);

        // Varactor phóng lớn bên phải (thấy rõ khe W co giãn)
        const vw = 88, vh = 92, vx = rx - vw / 2, vy = midY - vh / 2;
        rr(ctx, vx, vy, vw, vh, 9); ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = isLin ? C.main : C.c4; ctx.lineWidth = 2; ctx.stroke();
        const gapPx = clamp(10 + Math.log10(Math.max(1, rW)) * 42, 10, vh - 22), pH = (vh - gapPx) / 2;
        ctx.save(); rr(ctx, vx, vy, vw, vh, 9); ctx.clip();
        ctx.fillStyle = C.c4; ctx.globalAlpha = 0.45; ctx.fillRect(vx, vy, vw, pH);
        ctx.fillStyle = C.c2; ctx.globalAlpha = 0.45; ctx.fillRect(vx, vy + vh - pH, vw, pH);
        ctx.fillStyle = C.main; ctx.globalAlpha = 0.16; ctx.fillRect(vx, vy + pH, vw, gapPx);
        ctx.restore();
        txt(ctx, 'p⁺', rx, vy + pH / 2, C.ink, 10, 'center', 800);
        txt(ctx, 'n (xᵐ)', rx, vy + vh - pH / 2, C.ink, 10, 'center', 800);
        txt(ctx, 'W=' + rW.toFixed(1) + '×', rx, midY, C.main, 11, 'center', 800);

        // 2 đồng hồ mini không khung ở cột trống bên phải
        const gx = W - 68;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Tỉ lệ C/C₀', rC.toFixed(3), clamp(rC, 0, 1), C.c4);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Tần số f/f₀', rF.toFixed(2) + '×', clamp((rF - 1) / 14, 0, 1), isLin ? C.main : C.c2);

        chip(ctx, isLin ? 'm = −3/2: Tần số TUYẾN TÍNH hoàn hảo theo V_R!'
          : S.m < 0 ? 'Siêu đột biến (m < 0): dải chỉnh tần rộng' : 'm ≥ 0: khe tụ mở chậm, dải chỉnh hẹp',
          W * 0.44, 15, isLin ? C.main : C.c2, 'center');
      }
    },
    {
      title: 'Thực tế mặt số Đài Radio (MHz): Quan sát độ đều của các vạch 0V, 2V, 4V, 6V, 8V, 10V!',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, expF = 1 / (2 * (S.m + 2));
        const fOf = v => Math.pow(1 + v / S.Vbi, expF);
        const f0 = 1, fMax = fOf(10), fCur = fOf(S.VR), isLin = Math.abs(S.m + 1.5) < 0.03;

        const dx = 16, dy = 10, dw = W - 32, dh = H - 20;
        rr(ctx, dx, dy, dw, dh, 9); ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = isLin ? C.main : C.sub; ctx.lineWidth = isLin ? 1.8 : 1.3; ctx.stroke();

        const tx1 = dx + 20, tx2 = dx + dw - 20, scaleY = dy + dh * 0.56;
        const xOfF = f => tx1 + ((f - f0) / Math.max(0.01, fMax - f0)) * (tx2 - tx1);
        ln(ctx, tx1, scaleY, tx2, scaleY, C.sub, 2);

        [0, 2, 4, 6, 8, 10].forEach(v => {
          const x = xOfF(fOf(v));
          ln(ctx, x, scaleY - 12, x, scaleY + 10, isLin ? C.c2 : C.c3, 2);
          txt(ctx, v + 'V', x, scaleY + 20, C.ink, 10, 'center', 700);
          txt(ctx, (10 * fOf(v)).toFixed(0), x, scaleY - 19, C.mut, 9.2, 'center');
        });

        const cx = xOfF(fCur);
        ln(ctx, cx, dy + 6, cx, dy + dh - 6, C.err, 2.8);
        dot(ctx, cx, scaleY, 5, C.err);

        txt(ctx, 'Tần số thu: ' + (10 * fCur).toFixed(1) + ' MHz', dx + 12, dy + 13, C.main, 11.5, 'left', 800);
        txt(ctx, isLin ? 'Các vạch 0V–10V cách đều nhau hoàn hảo!' : 'Các vạch V bị dồn lệch (không tuyến tính)',
          dx + dw - 12, dy + 13, isLin ? C.c2 : C.mut, 10.5, 'right', 700);
        void t;
      }
    }
  ]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM (giữ trọn vẹn & sắc nét cho 8 tab Buổi 9)
   ========================================================================== */
const LD = {};
LD.join = {
  intro: [
    ['i', 'Ghép p và n trong cùng đơn tinh thể: lỗ trống (+ bên p) và electron (− bên n) tràn qua ranh giới do chênh nồng độ.'],
    ['w', 'Khi rời đi, chúng để lại ion cố định (ô vuông − ở p, + ở n): vùng ở giữa mất hết hạt tự do → gọi là vùng nghèo.'],
    ['w', 'Hai lớp ion cố định tạo điện trường nội E hướng từ n sang p, đẩy hạt tải quay ngược lại (lực trôi).'],
    ['i', 'Cân bằng đạt được khi lực khuếch tán đúng bằng lực điện trường nội: dòng tổng bằng 0 và vùng nghèo ngừng nở.'],
    ['v', 'Thử tách rồi ghép lại, hoặc chỉnh Nₐ ≠ N_d để thấy vùng nghèo lấn sâu vào phía pha tạp nhẹ.']
  ],
  react(S, k, P, say) {
    const j = stepJunc('Si', S.Na, S.Nd, 300, 0);
    if (k === 'joined') say(S.joined ? 'w' : 'i', S.joined ? 'Đang ghép p và n: hạt đa số khuếch tán qua x=0, lộ ion cố định và dựng E nội cho tới cân bằng.' : 'Đã tách rời: hai khối đều trung hòa điện, không có vùng nghèo hay điện trường nội.');
    else {
      say('v', `Nₐ = ${pw(S.Na)}, N_d = ${pw(S.Nd)} → xₚ = ${fmtUm(j.xp)}, xₙ = ${fmtUm(j.xn)}, V_bi = ${j.Vbi.toFixed(3)} V.`);
      say('w', S.Na > S.Nd ? 'Phía n pha tạp nhẹ hơn nên vùng nghèo ăn sâu sang bên n (xₙ > xₚ) để tổng ion hai bên bằng nhau.' : S.Na < S.Nd ? 'Phía p pha tạp nhẹ hơn nên vùng nghèo ăn sâu sang bên p (xₚ > xₙ).' : 'Hai phía pha tạp bằng nhau nên vùng nghèo chia đều (xₚ = xₙ).');
    }
  }
};
LD.hill = {
  intro: [
    ['i', 'Thế tiếp xúc V_bi giống một con dốc năng lượng cao eV_bi ngăn giữa phía n (đáy dốc) và phía p (đỉnh dốc).'],
    ['w', 'Electron bên n chuyển động nhiệt lao lên dốc nhưng hầu hết không đủ năng lượng nên bị trượt tụt trở về n.'],
    ['w', 'Chỉ số ít electron rất "nóng" mới leo qua được đỉnh dốc sang p — vừa khít bù lại vài electron thiểu số từ p trượt xuống n!'],
    ['i', 'V_bi = |φ_Fp| + |φ_Fn| = V_t ln(Nₐ N_d / nᵢ²): phụ thuộc logarit nên đổi pha tạp rất nhiều mà dốc chỉ cao thêm chút ít.'],
    ['v', 'Thử kéo Nₐ, N_d, nhiệt độ T hoặc đổi Si → GaAs (dốc cao hơn) / Ge (dốc thấp hơn).']
  ],
  react(S, k, P, say) {
    const j = stepJunc(S.mat, S.Na, S.Nd, S.T, 0);
    say('v', `${S.mat} (${S.T} K): V_bi = ${j.Vbi.toFixed(3)} V (φ_Fp = +${j.phiFp.toFixed(3)} V, |φ_Fn| = ${Math.abs(j.phiFn).toFixed(3)} V).`);
    if (k === 'mat') say('w', `${S.mat} có E_g = ${j.m.Eg} eV, nᵢ(300K) = ${sci(j.m.ni300, 1)} → vùng cấm rộng thì dốc thế V_bi càng cao.`);
    else if (k === 'T') say('w', S.T > (P.T || 300) ? 'Nhiệt độ tăng: nᵢ tăng cực nhanh nên dốc thế V_bi hạ thấp dần.' : 'Nhiệt độ giảm: nᵢ tụt mạnh nên dốc thế V_bi dựng cao hơn.');
  }
};
LD.probe = {
  intro: [
    ['i', 'Trong vùng nghèo, mỗi đường sức điện trường bắt đầu từ một ion dương (+) bên n và kết thúc ở một ion âm (−) bên p.'],
    ['w', 'Tổng số ion (+) phải đúng bằng tổng số ion (−) (Nₐ xₚ = N_d xₙ) nên phía pha tạp nhẹ có ion thưa hơn → buộc phải lấn sâu hơn!'],
    ['w', 'Tất cả đường sức đều chui qua x = 0, nên tại x = 0 điện trường mạnh nhất (|E_max|), càng ra mép càng giảm về 0.'],
    ['v', 'Mặc định khớp Ví dụ 2.2 (Si, Nₐ=10¹⁶, N_d=10¹⁵): W = 0,951 µm, |E_max| = 1,34×10⁴ V/cm tại x = 0.']
  ],
  react(S, k, P, say) {
    const j = stepJunc(S.mat, S.Na, S.Nd, 300, 0);
    if (k === 'pos') {
      const xp = S.pos * Math.max(j.xp, j.xn) * 1.25;
      if (xp <= -j.xp || xp >= j.xn) say('w', 'Đầu dò đang ở ngoài vùng nghèo (vùng trung hòa): |E(x)| = 0.');
      else if (Math.abs(S.pos) < 0.04) say('v', `Ngay tại tiếp giáp luyện kim x = 0: |E_max| = ${sci(j.Emax, 2)} V/cm.`);
      else say('v', `Đầu dò tại x = ${xp >= 0 ? '+' : '−'}${fmtUm(Math.abs(xp))}: mật độ đường sức giảm dần về mép.`);
    } else {
      say('v', `W = ${fmtUm(j.W)} (xₚ = ${fmtUm(j.xp)}, xₙ = ${fmtUm(j.xn)}), |E_max| = ${sci(j.Emax, 2)} V/cm.`);
    }
  }
};
LD.rev = {
  intro: [
    ['i', 'Phân cực ngược: nối cực âm pin vào p, cực dương pin vào n. Pin hút hạt đa số lùi xa khỏi tiếp giáp!'],
    ['w', 'Lùi hạt ra ngoài làm lộ thêm nhiều ion cố định → vùng nghèo W phình rộng (W ∝ √(V_bi + V_R)) và điện trường bên trong tăng mạnh.'],
    ['w', 'Vùng p và n trung hòa ở hai đầu giống hai bản tụ dẫn điện, khe vùng nghèo W ở giữa là lớp cách điện → C\' = ε_s / W.'],
    ['v', 'Mặc định khớp Ví dụ 3.1 & 3.3: V_R = 5 V → W = 2,83 µm, C\' = 3,66 nF/cm², C = 0,366 pF.']
  ],
  react(S, k, P, say) {
    const j = stepJunc(S.mat, S.Na, S.Nd, 300, S.VR);
    say('v', `V_R = ${S.VR.toFixed(1)} V → W = ${fmtUm(j.W)}, |E_max| = ${sci(j.Emax, 2)} V/cm, C\' = ${(j.Cp * 1e9).toFixed(2)} nF/cm².`);
  }
};
LD.cv = {
  intro: [
    ['i', 'Trong tiếp giáp một phía p⁺n (Nₐ ≫ N_d), phía p⁺ quá dày đặc nên xₚ ≈ 0; toàn bộ vùng nghèo nằm bên n (W ≈ xₙ).'],
    ['w', 'Khi vặn V_R tăng lên, mép vùng nghèo xₙ chạy sang phải như pít-tông quét qua từng lớp nguyên tử donor bên n.'],
    ['i', 'Từ độ dốc của 1/C\'² theo V_R, máy đo giải mã chính xác N_d và ngoại suy ra V_bi mà không cần cắt mẫu.'],
    ['v', 'Mặc định là Mẫu Ví dụ 3.4: V_bi = 0,725 V, N_d = 1,96×10¹⁵ cm⁻³, Nₐ = 1,64×10¹⁷ cm⁻³.']
  ],
  react(S, k, P, say) {
    const j = stepJunc('Si', S.Na, S.Nd, 300, S.VR);
    say('v', `V_R = ${S.VR.toFixed(1)} V: pít-tông quét sâu xₙ = ${fmtUm(j.xn)} → máy đo C\' = ${(j.Cp * 1e9).toFixed(2)} nF/cm².`);
  }
};
LD.brk = {
  intro: [
    ['i', 'Tăng điện áp ngược V_R đến điện áp đánh thủng V_B, dòng ngược bùng phát mạnh (kim Ampe kế vọt vào vùng đỏ).'],
    ['w', 'Thác lũ (pha tạp nhẹ/vừa, vùng nghèo rộng): electron tăng tốc đập vỡ liên kết nguyên tử mạng tạo cặp e–h mới → chuỗi tuyết lở (∫αdx → 1).'],
    ['w', 'Zener (pha tạp rất nặng, tường rào cực mỏng): điện trường kéo căng liên kết, electron xuyên hầm lượng tử thẳng qua tường!'],
    ['v', 'Mặc định khớp Ví dụ 4.1 (N_B = 4×10¹⁵ → V_B ≈ 110 V). Kéo V_R vượt V_B để thấy hiệu ứng tuyết lở!']
  ],
  react(S, k, P, say) {
    const { Ec, VB } = vBreakOf(S.mat, S.NB);
    say('v', `${S.mat}, N_B = ${pw(S.NB)}: E_crit ≈ ${sci(Ec, 2)} V/cm → V_B ≈ ${VB >= 10 ? VB.toFixed(0) : VB.toFixed(1)} V.`);
    if (S.VR >= VB) say('w', 'ĐÃ ĐÁNH THỦNG! Dòng ngược tăng dựng đứng — cần điện trở hạn dòng bảo vệ.');
  }
};
LD.grad = {
  intro: [
    ['i', 'Hai khối p-n mắc chung nguồn V_R và có cùng bề rộng ban đầu ở 0V để so sánh công bằng.'],
    ['w', 'Đột biến: ion xếp đều → vùng nghèo mở rộng theo căn bậc hai √V. Tuyến tính: ion dày ra ngoài → nở chậm hơn (V^(1/3)).'],
    ['w', 'Siêu đột biến (m < 0): ion tập trung dày ở giữa và thưa hẳn ra ngoài → mép vùng nghèo phóng cực xa để gom điện tích!'],
    ['v', 'Kéo thanh V_R chung và nhìn trực tiếp tốc độ phình của hai khối 3D trên dưới.']
  ],
  react(S, k, P, say) {
    const rV = (0.68 + S.VR) / 0.68;
    const wStep = Math.pow(rV, 0.5), wLin = Math.pow(rV, 1 / 3);
    if (S.cmp === 'linear') {
      const lj = linearJunc(S.a, S.VR, 'Si', 300);
      say('v', `V_R = ${S.VR.toFixed(1)} V: Đột biến nở ×${wStep.toFixed(2)}, Tuyến tính nở ×${wLin.toFixed(2)} (W = ${fmtUm(lj.W)}).`);
    } else {
      say('v', `V_R = ${S.VR.toFixed(1)} V: Đột biến nở ×${wStep.toFixed(2)}, Siêu đột biến phóng rộng hơn hẳn → C\' tụt cực nhanh!`);
    }
  }
};
LD.var = {
  intro: [
    ['i', 'Điốt biến dung (Varactor) dùng trong mạch cộng hưởng LC: vặn V_R đổi khe W → đổi C → đổi tần số thu f = 1/(2π√LC).'],
    ['w', 'Khi chọn đúng m = −3/2 (siêu đột biến tuyến tính): f ∝ (V_bi + V_R) — các vạch 0V, 2V, ..., 10V cách đều nhau hoàn hảo trên mặt số Radio!'],
    ['v', 'Thử chuyển sang m = 0 hoặc m = +1 để thấy các vạch áp bị dồn cục lại.']
  ],
  react(S, k, P, say) {
    const expC = -1 / (S.m + 2), expF = 1 / (2 * (S.m + 2));
    const rC = Math.pow(1 + S.VR / S.Vbi, expC), rF = Math.pow(1 + S.VR / S.Vbi, expF);
    say('v', `m = ${S.m.toFixed(2)}, V_R = ${S.VR.toFixed(1)} V → C/C₀ = ${rC.toFixed(3)}, f = ${(10 * rF).toFixed(1)} MHz.`);
  }
};
LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (#lab9 — đồng bộ 100% phong cách & biến màu CSS của lab-b11.js)
   ========================================================================== */
const CSS = `
#lab9{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab9[hidden]{display:none}
#lab9 *{box-sizing:border-box}
#lab9 .lb-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
#lab9 .lb-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
#lab9 .lb-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
#lab9 .lb-ic{color:var(--main);display:flex}
#lab9 .lb-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
#lab9 .lb-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
#lab9 .lb-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
#lab9 .lb-tab:hover{color:var(--ink);background:var(--tint)}
#lab9 .lb-tab.on{background:var(--main);color:var(--bg);font-weight:700}
#lab9 .lb-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
#lab9 .lb-x:hover{color:var(--err);background:var(--tint)}
#lab9 .lb-b{flex:1;min-height:0;display:grid;gap:6px;padding:6px}
#lab9 .lb-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
#lab9 .lb-p.glow{animation:lb9glow 1.4s ease-out}
@keyframes lb9glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
#lab9 .lb-t{font:600 11.5px/1.2 var(--font-ui);color:var(--mut);padding:5px 10px 0;flex:none}
#lab9 .lb-cv{flex:1;min-height:0;position:relative}
#lab9 .lb-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#lab9 .lb-c{display:flex;flex-wrap:wrap;gap:5px 10px;padding:4px 10px 6px;flex:none;align-items:center}
#lab9 .lb-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
#lab9 .lb-k input[type=range]{width:clamp(64px,7vw,108px);margin:0}
#lab9 .lb-k output{color:var(--ink);font-weight:700;min-width:3em}
#lab9 .lb-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
#lab9 .lb-seg button,#lab9 .lb-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:5px 8px;cursor:pointer}
#lab9 .lb-btn{background:var(--tint)}
#lab9 .lb-seg button:hover,#lab9 .lb-btn:hover{color:var(--ink)}
#lab9 .lb-seg button.on{background:var(--main);color:var(--bg)}
#lab9 .lb-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
#lab9 .lb-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb9in .4s ease-out;overflow-wrap:anywhere}
#lab9 .lb-ln::before{position:absolute;left:0;font-weight:700}
#lab9 .lb-ln.i{color:var(--ink)}#lab9 .lb-ln.i::before{content:'›';color:var(--c5)}
#lab9 .lb-ln.w{color:var(--ink)}#lab9 .lb-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
#lab9 .lb-ln.v{color:var(--main)}#lab9 .lb-ln.v::before{content:'=';color:var(--main)}
#lab9 .lb-c{position:relative}
#lab9 .lb-film{position:absolute;top:3px;right:3px;z-index:3;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--main);color:var(--bg);font:700 13px/1 var(--font-ui);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35);user-select:none}
#lab9 .lb-film.on{background:var(--err);color:#fff}
#lab9.filming .lb-c>*:not(.lb-cap){visibility:hidden}
#lab9.filming .lb-cv canvas{cursor:default!important}
#lab9 .lb-cap{position:absolute;left:0;right:0;bottom:0;min-height:100%;box-sizing:border-box;display:none;background:var(--card);border-top:1px solid var(--main);padding:8px 14px 9px;font:600 13px/1.45 var(--font-body);color:var(--ink);pointer-events:none;z-index:2}
#lab9 .lb-cap i{display:block;height:3px;background:var(--main);border-radius:2px;margin-top:7px;width:0}
@keyframes lb9in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab-m:hover,.lab-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){#lab9 .lb-win{width:100vw;height:100dvh;border-radius:0}#lab9 .lb-b{overflow:auto;display:flex;flex-direction:column}#lab9 .lb-p{min-height:300px;flex:none}#lab9 .lb-p:nth-child(2){min-height:210px}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style');
sty.textContent = CSS;
document.head.appendChild(sty);

let timers = [], ros = [], logEl = null;
let film = null, TSC = 1, TT = 0;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'join';

function ensureDom() {
  if (root) return;
  root = document.createElement('div');
  root.id = 'lab9';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 9');
  root.innerHTML = '<div class="lb-win"><div class="lb-h"><span class="lb-ic">' + FLASK + '</span><span class="lb-bd">Phòng thí nghiệm · Buổi 9</span><nav class="lb-tabs"></nav><button class="lb-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb-b"></div></div>';
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
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty && window.LabB9 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden && (document.getElementById('tb-badge') || {}).textContent === 'Buổi 9') {
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

/* ==========================================================================
   PHIM TỰ ĐỘNG — một nút (biểu tượng ▶) ở góc trên bên phải màn hình thực tế.
   Trong khi chiếu: thanh điều khiển được ẩn, lời thuyết minh hiện ngay tại đó,
   người xem không chỉnh được thông số. Camera chỉ zoom cận / lia ở những chỗ có hạt tải chuyển động
   hoặc có nguyên lý cần nhìn kỹ; chuyển động hạt được làm chậm (slow).
   Bước: { d: giây, cap: thuyết minh, v: V(yaw°, pitch°, zoom, [fx,fy,fz]?), set: {thông số: đích}, slow: tốc độ (1 = thường), orbit: °/s }
   fx,fy,fz = vị trí tiêu điểm theo tỉ lệ trong khối (x: p→n, y: sau→trước, z: dưới→trên).
   ========================================================================== */
const V = (yaw, pitch, zoom, f) => ({ yaw, pitch, zoom, f });
const SNAPK = ['joined', 'mode', 'sample', 'mat', 'cmp'];
const FILM = {
  join: [
    { d: 6, cap: 'Hai khối tinh thể Si riêng rẽ: bên trái là loại p (nhiều lỗ trống +), bên phải là loại n (nhiều electron −). Mỗi khối riêng đều trung hòa điện.', v: V(30, 22, 1.0), orbit: 4, set: { joined: 0, Na: 1e16, Nd: 1e16 } },
    { d: 8, cap: 'Trong khối p, các lỗ trống (+) chuyển động nhiệt hỗn loạn khắp nơi — mỗi lỗ trống có một ion acceptor đứng yên đi kèm làm cân bằng điện tích.', v: V(12, 14, 3.0, [0.25, 0.5, 0.5]), slow: 0.4 },
    { d: 7, cap: 'Khối n thì ngược lại: các electron (−) chuyển động hỗn loạn, mỗi electron đi kèm một ion donor dương.', v: V(-12, 14, 3.0, [0.75, 0.5, 0.5]) },
    { d: 11, cap: 'Ghép hai khối lại: ở mặt ghép có chênh lệch nồng độ rất lớn nên lỗ trống từ p tràn sang n, electron từ n tràn sang p — gọi là khuếch tán. Các vòng sáng đánh dấu khoảnh khắc hạt vượt qua ranh giới.', v: V(0, 12, 3.4, [0.5, 0.5, 0.5]), set: { joined: 1 }, slow: 0.3 },
    { d: 9, cap: 'Hạt đi qua rồi tái hợp, để lại phía sau các ion cố định: ion acceptor âm (−) bên p, ion donor dương (+) bên n. Vùng chứa các ion trần ấy là vùng nghèo.', slow: 0.3 },
    { d: 9, cap: 'Hai lớp ion trái dấu tạo ra điện trường nội E hướng từ n sang p (mũi tên vàng) — nó cản các hạt khuếch tán tiếp. Khi E cân bằng với khuếch tán thì dừng lại: đó là trạng thái cân bằng nhiệt với thế tiếp xúc V_bi.', v: V(15, 26, 1.8, [0.5, 0.5, 1.0]), slow: 1 },
    { d: 8, cap: 'Tăng pha tạp bên p lên 10¹⁷: để điện tích hai phía bù nhau, vùng nghèo co lại bên p (nhiều ion trên mỗi đơn vị bề dày) và lấn sâu sang phía n.', v: V(20, 24, 2.0, [0.5, 0.5, 0.6]), set: { Na: 1e17 } },
    { d: 8, cap: 'Giảm pha tạp bên n xuống 10¹⁵: lúc này vùng nghèo lấn rất sâu vào phía n vì ion donor quá thưa.', set: { Na: 1e16, Nd: 1e15 } }
  ],
  hill: [
    { d: 6, cap: 'Mẫu p-n đặt trên đế gia nhiệt. Tại vùng nghèo có một "con dốc thế năng" eV_bi cản các hạt tải đi sang phía bên kia.', v: V(30, 22, 1.0), orbit: 4, set: { mat: 'Si', Na: 1e16, Nd: 1e15, T: 300 } },
    { d: 10, cap: 'Cận cảnh, chuyển động chậm: electron (−) từ phía n lao về phía p, gặp dốc thì bị đẩy chậm lại rồi dội ngược trở về. Đa số hạt không đủ động năng để leo lên.', v: V(0, 12, 3.3, [0.5, 0.5, 0.5]), slow: 0.3 },
    { d: 9, cap: 'Chỉ rất ít hạt "nóng" (màu vàng) đủ năng lượng leo qua đỉnh dốc. Đó là dòng khuếch tán nhỏ giọt, cân bằng với dòng trôi do điện trường nội kéo ngược lại.', slow: 0.25 },
    { d: 9, cap: 'Nung đế lên 450 K: hạt có động năng nhiệt lớn hơn nên nhiều hạt hơn leo được qua dốc. Đồng hồ nᵢ(T) tăng vọt.', set: { T: 450 }, slow: 0.3 },
    { d: 8, cap: 'Đổi sang GaAs ở 300 K: vùng cấm rộng hơn nên V_bi (chiều cao dốc) cao hơn nhiều — hạt càng khó vượt.', v: V(15, 20, 2.4, [0.5, 0.5, 0.5]), set: { mat: 'GaAs', T: 300 }, slow: 0.5 },
    { d: 8, cap: 'Quay lại Si và pha tạp nặng 10¹⁸ ở cả hai bên: dốc cao hơn và dựng đứng hơn, vùng nghèo hẹp lại.', set: { mat: 'Si', Na: 1e18, Nd: 1e18 } }
  ],
  probe: [
    { d: 6, cap: 'Một kim dò trượt trên mặt khối p-n để đo trực tiếp điện trường |E(x)| và điện thế φ(x) tại từng vị trí.', v: V(25, 24, 1.0), orbit: 4, set: { mat: 'Si', Na: 1e16, Nd: 1e15, pos: -1 } },
    { d: 8, cap: 'Kim ở sát điện cực phía p, ngoài vùng nghèo: E = 0 và φ = 0 vì vùng trung hòa không có điện trường.', v: V(15, 20, 1.7, [0.2, 0.5, 0.9]) },
    { d: 12, cap: 'Đưa kim vào vùng nghèo: các ion − và + đứng yên tạo đường sức; chấm nhỏ chạy từ ion + sang ion −. Chấm chạy nhanh nhất ở x = 0, nghĩa là E lớn nhất ngay tại mặt ghép.', v: V(0, 14, 3.2, [0.5, 0.5, 0.5]), set: { pos: 0 }, slow: 0.35 },
    { d: 9, cap: 'Kim sang phía n: đường sức thưa dần, E giảm đều về 0 ở mép vùng nghèo; điện thế φ thì tăng lên.', v: V(10, 16, 2.4, [0.65, 0.5, 0.6]), set: { pos: 0.6 }, slow: 0.5 },
    { d: 8, cap: 'Ra khỏi vùng nghèo hẳn: E = 0 còn φ giữ nguyên bằng V_bi — thế của toàn bộ phía n cao hơn phía p đúng một lượng V_bi.', v: V(15, 20, 1.7, [0.8, 0.5, 0.9]), set: { pos: 1 }, slow: 1 },
    { d: 8, cap: 'Cho pha tạp hai phía bằng nhau 10¹⁶: vùng nghèo cân đối hai bên mặt ghép và E_max cao hơn.', v: V(0, 14, 2.4, [0.5, 0.5, 0.6]), set: { Nd: 1e16, pos: 0 } }
  ],
  rev: [
    { d: 6, cap: 'Điốt p-n nối với nguồn ngược: cực âm vào p, cực dương vào n. Ta sẽ xem vùng nghèo phản ứng thế nào khi tăng V_R.', v: V(25, 22, 1.0), orbit: 4, set: { VR: 0, Na: 1e16, Nd: 1e15, mat: 'Si' } },
    { d: 8, cap: 'Chưa có điện áp ngoài (V_R = 0): vùng nghèo mỏng, các hạt đa số chuyển động nhiệt tự do ở hai phía.', v: V(0, 14, 2.6, [0.5, 0.5, 0.5]), slow: 0.4 },
    { d: 12, cap: 'Tăng V_R lên 10 V: cực âm hút lỗ trống (+) về phía điện cực p, cực dương hút electron (−) về phía điện cực n. Hạt đa số dạt khỏi mặt ghép, để lộ thêm các ion cố định — vùng nghèo phình rộng.', v: V(0, 14, 2.4, [0.5, 0.5, 0.5]), set: { VR: 10 }, slow: 0.4 },
    { d: 9, cap: 'Tăng tiếp đến 30 V: vùng nghèo còn rộng hơn nữa. Vì phía n pha tạp nhẹ hơn nên nó chủ yếu lấn sâu sang phía n.', v: V(0, 14, 1.9, [0.5, 0.5, 0.5]), set: { VR: 30 } },
    { d: 10, cap: 'Cận cảnh: chỉ có vài hạt thiểu số (chấm nhạt) bị điện trường mạnh cuốn vọt ngang qua vùng nghèo. Chúng tạo ra dòng ngược bão hòa rất nhỏ.', v: V(0, 12, 3.0, [0.5, 0.5, 0.5]), slow: 0.25 },
    { d: 8, cap: 'Giảm V_R còn 10 V rồi tăng pha tạp n lên 10¹⁶: ion dày hơn nên vùng nghèo hẹp hơn nhiều với cùng điện áp.', v: V(15, 20, 2.0, [0.5, 0.5, 0.5]), set: { VR: 10, Nd: 1e16 }, slow: 0.6 },
    { d: 8, cap: 'Đổi sang GaAs: V_bi lớn hơn nên vùng nghèo hơi rộng hơn ở cùng V_R.', set: { mat: 'GaAs' } }
  ],
  cv: [
    { d: 6, cap: 'Wafer p⁺n kẹp trên mâm, kim dò nối vào máy đo LCR. Lớp p⁺ phía trên pha tạp cực đậm nên vùng nghèo hầu như nằm hết trong lớp n bên dưới.', v: V(30, 24, 1.0), orbit: 4, set: { sample: 'ex34', VR: 0, Nd: 1.96e15, Na: 1.64e17 } },
    { d: 9, cap: 'Cận cảnh: khi chưa phân cực, vùng nghèo (khối vàng nhạt) mỏng, chỉ lộ ra các ion donor dương (+); electron tự do bên dưới chuyển động nhiệt.', v: V(0, 14, 3.0, [0.5, 0.5, 0.78]), slow: 0.4 },
    { d: 12, cap: 'Vặn V_R lên 12 V: electron tự do bị đẩy xuống đáy wafer, mép vùng nghèo như một pít-tông quét sâu vào lớp n và để lộ thêm nhiều ion donor.', v: V(0, 14, 2.6, [0.5, 0.5, 0.65]), set: { VR: 12 }, slow: 0.35 },
    { d: 9, cap: 'Máy đo: C′ = ε_s / xₙ nên điện dung giảm khi vùng nghèo sâu hơn. Từ độ dốc của 1/C′² theo V_R, máy suy ra N_d; ngoại suy về trục cho V_bi.', v: V(25, 22, 1.3), set: { VR: 6 }, slow: 1 },
    { d: 8, cap: 'Mẫu n đậm (N_d = 1,5×10¹⁶): nhiều ion hơn nên vùng nghèo mỏng hơn, C′ lớn hơn và đường 1/C′² dốc nhỏ lại.', v: V(10, 18, 1.8, [0.5, 0.5, 0.7]), set: { sample: 'heavy', Nd: 1.5e16, Na: 5e17 } },
    { d: 8, cap: 'Mẫu n nhẹ (N_d = 5×10¹⁴): ít ion nên vùng nghèo rất sâu, C′ nhỏ.', set: { sample: 'light', Nd: 5e14, Na: 1e17 } }
  ],
  brk: [
    { d: 6, cap: 'Bàn thử đánh thủng: điốt p-n phân cực ngược mạnh, có điện trở hạn dòng. Ta xem vùng nghèo chịu đựng thế nào khi V_R tăng lên.', v: V(25, 22, 1.0), orbit: 4, set: { mode: 'avalanche', NB: 4e15, VR: 40, mat: 'Si' } },
    { d: 9, cap: 'Ở 40 V: electron đi vào vùng nghèo bị điện trường gia tốc, nhưng chưa đủ mạnh để va chạm gây ion hóa — hầu như không có dòng.', v: V(0, 14, 2.4, [0.5, 0.5, 0.5]), slow: 0.35 },
    { d: 12, cap: 'Tăng V_R đến gần điện áp đánh thủng V_B: electron nhanh dần, va chạm vào mạng tinh thể và bứt ra cặp electron − lỗ trống mới (vòng sáng). Các hạt mới lại được gia tốc rồi va chạm tiếp — hiện tượng thác lũ.', v: V(0, 14, 2.4, [0.5, 0.5, 0.5]), set: { VR: 104 }, slow: 0.25 },
    { d: 9, cap: 'Vượt V_B: thác lũ lan rộng, dòng vọt lên không kiểm soát và điốt phát sáng cảnh báo — nếu không có điện trở hạn dòng thì linh kiện sẽ hỏng.', v: V(10, 20, 1.7, [0.5, 0.5, 0.5]), set: { VR: 118 }, slow: 0.5 },
    { d: 12, cap: 'Chuyển sang pha tạp rất nặng (Zener): vùng nghèo mỏng cỡ vài nm nên chỉ cần vài volt đã có điện trường khổng lồ. Electron không cần va chạm mà xuyên hầm lượng tử (đoạn sóng lượn) thẳng qua vùng nghèo.', v: V(0, 14, 2.5, [0.5, 0.5, 0.5]), set: { mode: 'zener', NB: 9e17, VR: 3.6 }, slow: 0.3 },
    { d: 8, cap: 'Đổi sang GaAs: vùng cấm rộng hơn nên cần điện trường lớn hơn mới đánh thủng.', set: { mat: 'GaAs' } }
  ],
  grad: [
    { d: 6, cap: 'Hai điốt p-n đặt cạnh nhau, dùng chung một nguồn V_R. Khối trước có mối ghép đột biến, khối sau có mối ghép khác kiểu — ta so sánh tốc độ vùng nghèo phình ra.', v: V(24, 34, 1.1), orbit: 4, set: { VR: 5, cmp: 'linear', a: 1e20 } },
    { d: 10, cap: 'Tăng V_R chung lên 20 V: mối ghép đột biến mở rộng theo V^(1/2), mối ghép tuyến tính chỉ theo V^(1/3) nên nở chậm hơn — nhìn hai đồng hồ W/W₀.', v: V(14, 36, 1.3), set: { VR: 20 } },
    { d: 9, cap: 'Cận cảnh các ion: ở mối ghép đột biến, mật độ ion đều và dày cho tới mép; ở mối ghép tuyến tính, ion thưa dần ra xa mặt ghép nên bên trong cần ít điện tích hơn để đạt cùng điện áp.', v: V(0, 22, 2.8, [0.5, 0.5, 0.4]), slow: 0.5 },
    { d: 10, cap: 'Chuyển sang so sánh với mối ghép siêu đột biến (m < 0): ion tập trung sát mặt ghép nên vùng nghèo phình CỰC NHANH theo V^1,35.', v: V(14, 36, 1.3), set: { cmp: 'hyper' } },
    { d: 8, cap: 'Hạ V_R về 5 V: các vùng nghèo co lại — chênh lệch tốc độ giữa hai kiểu mối ghép là cơ sở để làm varactor.', set: { VR: 5 } }
  ],
  var: [
    { d: 6, cap: 'Mạch cộng hưởng LC dùng varactor: điện dung của điốt p⁺n phân cực ngược thay đổi theo V_R và quyết định tần số dao động.', set: { m: -1.5, VR: 4 } },
    { d: 9, cap: 'Cận cảnh varactor (bên phải): khe giữa hai bản là vùng nghèo W. Dòng điện trong mạch (chấm vàng) dao động qua lại giữa cuộn cảm L và tụ.', v: V(0, 0, 2.3, [0.58, 0.5]), slow: 0.4 },
    { d: 10, cap: 'Tăng V_R lên 10 V: khe W mở rộng nên điện dung C giảm; theo f = 1/(2π√LC), tần số dao động tăng lên — chấm vàng chạy nhanh dần.', set: { VR: 10 }, slow: 0.4 },
    { d: 9, cap: 'Với m = −3/2 (mối ghép siêu đột biến), tần số f tăng TUYẾN TÍNH theo V_R — điều lý tưởng cho dò đài.', v: V(0, 0, 1.2, [0.5, 0.5]), set: { VR: 4 }, slow: 1 },
    { d: 8, cap: 'Mối ghép đột biến m = 0: khe tụ mở chậm hơn, dải chỉnh tần hẹp hơn và các vạch 0V–10V bị dồn lệch.', set: { m: 0 } },
    { d: 8, cap: 'm = +1: dải chỉnh tần còn hẹp hơn nữa.', set: { m: 1 } }
  ]
};

/* ---------- ĐIỀU KHIỂN PHIM: camera + thông số + chậm ---------- */
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const lerp = (a, b, k) => a + (b - a) * k;
const wrapD = (a, b) => ((b - a + 540) % 360) - 180;

function camGet(p) {                      // 3D: camera thật; 2D: camera phẳng đơn giản
  if (p.spec.view3d) return camOf(p, p.spec.view0);
  return p.cam2 || (p.cam2 = { zoom: 1, fx: 0.5, fy: 0.5, follow: 0 });
}
function camSnap(p) {
  const c = camGet(p);
  return p.spec.view3d
    ? { yaw: c.yaw, pitch: c.pitch, zoom: c.zoom, f: (c.f || [0.5, 0.5, 0.5]).slice(), follow: c.follow || 0, slow: TSC }
    : { yaw: 0, pitch: 0, zoom: c.zoom, f: [c.fx, c.fy, 0.5], follow: c.follow, slow: TSC };
}
function setupFilm(tab, p, el, box, cb) {
  if (!FILM[tab.id]) return;
  const fb = document.createElement('div');
  fb.className = 'lb-film'; fb.textContent = '▶'; fb.title = 'Phim tự động'; fb.setAttribute('aria-label', 'Phim tự động');
  fb.setAttribute('role', 'button'); fb.tabIndex = 0;
  fb.onclick = () => { if (film) filmStop(false); else filmStart(tab, p); };
  fb.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fb.onclick(); } };
  box.appendChild(fb); p.filmBtn = fb;
  const cap = document.createElement('div'); cap.className = 'lb-cap'; cap.innerHTML = '<span></span><i></i>';
  cb.appendChild(cap); p.cap = cap;
}
function filmStart(tab, p, at) {
  if (!FILM[tab.id] || !p.filmBtn) return;
  filmStop(false, true);
  const c = camGet(p), home = Object.assign({}, tab.S), stepOf = {};
  tab.panels.forEach(q => (q.ctrls || []).forEach(k => { if (k.k && k.step && !k.log) stepOf[k.k] = k.step; }));
  const hv = p.spec.view3d ? V(c.b.yaw, c.b.pitch, c.b.zoom) : V(0, 0, 1);
  const steps = FILM[tab.id].concat([{ d: 3, cap: 'Kết thúc phim — mọi thông số và góc nhìn đã trở về như ban đầu. Bạn có thể tự xoay hình, kéo thanh trượt để thử lại.', v: hv, set: home, slow: 1 }]);
  film = { tab, p, steps, stepOf, i: -1, t: 0, total: steps.reduce((s, q) => s + q.d, 0), done: 0, home };
  if (c.goal) c.goal = null;
  root.classList.add('filming');
  p.filmBtn.textContent = '■'; p.filmBtn.title = 'Dừng phim'; p.filmBtn.setAttribute('aria-label', 'Dừng phim'); p.filmBtn.classList.add('on');
  p.cap.style.display = 'block';
  filmNext();
  for (let rest = at || 0; rest > 0 && film;) { const s = Math.min(0.1, rest); filmTick(s); rest -= s; }
}
function filmNext() {
  const f = film; f.i++;
  if (f.i >= f.steps.length) { filmStop(true); return; }
  const st = f.steps[f.i], S = f.tab.S;
  f.from = { cam: camSnap(f.p), S: {} };
  f.t = 0;
  if (st.set) Object.keys(st.set).forEach(k => {
    if (typeof st.set[k] !== 'number' || SNAPK.includes(k)) S[k] = st.set[k]; else f.from.S[k] = S[k];
  });
  f.p.cap.firstChild.textContent = st.cap;
  say('w', st.cap);
}
function filmTick(dt) {
  const f = film; if (!f) return;
  const st = f.steps[f.i], p = f.p, c = camGet(p), S = f.tab.S, from = f.from, three = !!p.spec.view3d;
  f.t += dt;
  const mv = st.mv || 0.5, sc = ease(f.t / (st.d * mv)), ss = ease(f.t / (st.d * 0.8)), v = st.v || {};
  const tZoom = v.zoom != null ? v.zoom : from.cam.zoom;
  const zoom = Math.exp(lerp(Math.log(from.cam.zoom), Math.log(tZoom), sc));
  if (three) {
    c.goal = null;
    const tYaw = v.yaw != null ? v.yaw : from.cam.yaw, tPit = v.pitch != null ? v.pitch : from.cam.pitch;
    c.yaw = from.cam.yaw + wrapD(from.cam.yaw, tYaw) * sc + (st.orbit || 0) * Math.max(0, f.t - st.d * mv);
    c.yaw = ((c.yaw + 540) % 360) - 180;
    c.pitch = clamp(lerp(from.cam.pitch, tPit, sc), 4, 89);
    c.zoom = zoom;
    const tf = v.f;
    if (tf) { c.f = [lerp(from.cam.f[0], tf[0], sc), lerp(from.cam.f[1], tf[1], sc), lerp(from.cam.f[2], tf[2] != null ? tf[2] : 0.5, sc)]; c.follow = lerp(from.cam.follow, 1, sc); }
    else if (v.zoom != null || v.yaw != null) c.follow = lerp(from.cam.follow, 0, sc);
  } else {
    c.zoom = zoom;
    const tf = v.f;
    if (tf) { c.fx = lerp(from.cam.f[0], tf[0], sc); c.fy = lerp(from.cam.f[1], tf[1], sc); c.follow = lerp(from.cam.follow, 1, sc); }
    else if (v.zoom != null) c.follow = lerp(from.cam.follow, 0, sc);
  }
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
  p.cap.lastChild.style.width = (100 * clamp((f.done + f.t) / f.total, 0, 1)) + '%';
}
function filmStop(done, silent) {
  const f = film; if (!f) return;
  film = null; TSC = 1;
  root.classList.remove('filming');
  const p = f.p;
  if (p.filmBtn) { p.filmBtn.textContent = '▶'; p.filmBtn.title = 'Phim tự động'; p.filmBtn.setAttribute('aria-label', 'Phim tự động'); p.filmBtn.classList.remove('on'); }
  if (p.cap) p.cap.style.display = 'none';
  if (!done) {
    Object.assign(f.tab.S, f.home);
    const c = camGet(p);
    if (p.spec.view3d) { c.goal = Object.assign({}, c.b); c.follow = 0; } else Object.assign(c, { zoom: 1, fx: 0.5, fy: 0.5, follow: 0 });
  } else if (p.spec.view3d) camGet(p).follow = 0;
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

    if (spec.view3d) {   /* kéo = xoay · lăn / chụm = zoom · bấm đúp = đặt lại */
      const ptrs = new Map(); let pd = 0;
      cv.style.cursor = 'grab'; cv.style.touchAction = 'none';
      cv.addEventListener('pointerdown', ev => {
        if (film) return;
        ptrs.set(ev.pointerId, [ev.clientX, ev.clientY]);
        try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* bỏ qua */ }
        cv.style.cursor = 'grabbing'; camOf(p, spec.view0).goal = null;
        if (ptrs.size === 2) { const a = [...ptrs.values()]; pd = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); }
      });
      cv.addEventListener('pointermove', ev => {
        if (film) return;
        const old = ptrs.get(ev.pointerId); if (!old) return;
        const c = camOf(p, spec.view0);
        if (ptrs.size === 1) {
          c.yaw = ((c.yaw - (ev.clientX - old[0]) * 0.5 + 540) % 360) - 180;
          c.pitch = clamp(c.pitch + (ev.clientY - old[1]) * 0.4, 4, 89);
        }
        ptrs.set(ev.pointerId, [ev.clientX, ev.clientY]);
        if (ptrs.size === 2) {
          const a = [...ptrs.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]);
          if (pd) c.zoom = clamp(c.zoom * d / pd, 0.5, 4);
          pd = d;
        }
        p.dirty = true;
      });
      const up = ev => { ptrs.delete(ev.pointerId); pd = 0; if (!ptrs.size) cv.style.cursor = 'grab'; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('wheel', ev => {
        ev.preventDefault(); if (film) return;
        const c = camOf(p, spec.view0); c.goal = null;
        c.zoom = clamp(c.zoom * (ev.deltaY < 0 ? 1.1 : 1 / 1.1), 0.5, 4); p.dirty = true;
      }, { passive: false });
      cv.addEventListener('dblclick', () => { if (!film) resetCam(p); });
    }

    if ((spec.ctrls && spec.ctrls.length) || (spec.area === 'a' && FILM[tab.id])) {
      const cb = document.createElement('div');
      cb.className = 'lb-c';
      (spec.ctrls || []).forEach(c => cb.appendChild(mkCtrl(tab, c, p)));
      el.appendChild(cb);
      if (spec.area === 'a') setupFilm(tab, p, el, box, cb);
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
    const c2 = p.spec.cam2d && p.cam2;
    if (c2 && (c2.zoom !== 1 || c2.follow)) {
      const gx = 0.5 + (c2.fx - 0.5) * c2.follow, gy = 0.5 + (c2.fy - 0.5) * c2.follow;
      ctx.translate(p.W / 2, p.H / 2); ctx.scale(c2.zoom, c2.zoom); ctx.translate(-gx * p.W, -gy * p.H);
    }
    try { p.spec.draw(p, ctx, p.W, p.H, TT, dt * TSC); } catch (err) { console.error('[LabB9]', err); }
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

/* ---------- gắn biểu tượng bình thí nghiệm nhỏ cạnh tiêu đề Buổi 9 ---------- */
const H3MAP = [
  [/^1\.1/, 'join', 0],  [/^1\.2/, 'join', 0],
  [/^2\.2/, 'hill', 1],  [/^2\.3/, 'hill', 0],
  [/^2\.4/, 'probe', 0], [/^2\.5/, 'probe', 0], [/^2\.6/, 'probe', 0], [/^2\.7/, 'probe', 0],
  [/^3\.2/, 'rev', 0],   [/^3\.3/, 'rev', 0],   [/^3\.4/, 'rev', 1],
  [/^3\.5/, 'cv', 0],    [/^3\.6/, 'cv', 0],
  [/^4\.1/, 'brk', 0],   [/^4\.2/, 'brk', 1],   [/^4\.3/, 'brk', 0],
  [/^5\.1/, 'grad', 0],  [/^5\.2/, 'grad', 0],
  [/^5\.3/, 'var', 0],   [/^5\.4/, 'var', 0]
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
    const l = LABS.find(x => x.sec === +m[1]);
    if (l) addMark(h, l.id, null, l.name);
  });
  rootEl.querySelectorAll('h3').forEach(h => {
    const t = h.textContent.trim();
    const r = H3MAP.find(x => x[0].test(t));
    if (r) addMark(h, r[1], r[2], t, r[3]);
  });
}

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 9') {
  markLesson(document.getElementById('app-content'));
}
window.LabB9 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id), film: (id, at) => { open(id); const p = curPanels.find(q => q.filmBtn); if (p) filmStart(cur, p, at); } };
})();
