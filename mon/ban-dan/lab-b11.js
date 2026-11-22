/* ==========================================================================
   lab-b11.js — PHÒNG THÍ NGHIỆM MÔ PHỎNG BUỔI 11:
   TỤ MOS HAI CỰC, ĐIỆN ÁP NGƯỠNG V_T, ĐẶC TUYẾN C-V, DÒNG MOSFET,
   HIỆU ỨNG MILLER & 5 HIỆU ỨNG PHI LÝ TƯỞNG
   - Hoàn toàn mô phỏng vật lý trực quan (lớp oxit, hạt tải, ion cố định,
     đồng hồ kim LCR, bộ tạo sóng AC tần số thấp/cao, mặt cắt kênh thắt,
     van dòng tải đèn, bơm nạp tụ Miller, buồng rò dưới ngưỡng, vùng nghèo
     máng lấn kênh, đường đua bão hòa vận tốc & đạn đạo) — KHÔNG dùng đồ thị.
   - Đồng bộ bảng biến màu CSS, khung popup 95% và nhật ký như lab-b7.js.
   - Đủ 11 tab ứng 1–1 với 11 mỏ neo "Mô hình tương tác" trong Buổi 11:
       1.4 · Tụ MOS          | 2.3 · Ngưỡng đảo     | 2.7 · Điện áp V_T
       3.2 · Tụ MOS C-V      | 3.4 · Tần số C-V     | 4.2 · Kênh thắt
       4.5 · Van dòng I_D    | 5.5 · Miller & f_T   | 6.2 · Dưới ngưỡng
       6.4 · Điều biến L     | 6.7 · Bão hòa & Đạn đạo
   - API: LabB11.open(tabId?, panelIndex?, patch?)  LabB11.close()  LabB11.mark(root)
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
const GATES = {
  Al:    { name: 'Nhôm (Al)',       phiM: 4.28 },
  nPoly: { name: 'n⁺-PolySi',       phiM: 3.25 },
  pPoly: { name: 'p⁺-PolySi',       phiM: 4.37 },
  Au:    { name: 'Vàng (Au)',       phiM: 5.10 }
};

function mosCalc(subType, gateKey, N, toxNm, QssCnt) {
  const g = GATES[gateKey] || GATES.Al;
  const tox = toxNm * 1e-7; // cm
  const Cox = EPS_OX / tox; // F/cm^2
  const Qss = QssCnt * E_CHG; // C/cm^2
  const phiF = VT_300 * Math.log(Math.max(1.1, N / NI_SI)); // dương (V)
  const chiP = 3.25, Eg = 1.12;
  const phiMS = subType === 'p'
    ? g.phiM - (chiP + Eg / 2 + phiF)
    : g.phiM - (chiP + Eg / 2 - phiF);
  const VFB = phiMS - Qss / Cox;
  const xdT = Math.sqrt((4 * EPS_SI * phiF) / (E_CHG * N));
  const QsdMax = E_CHG * N * xdT;
  const Vdep = QsdMax / Cox;
  const VT = subType === 'p'
    ? Vdep + VFB + 2 * phiF
    : -Vdep + VFB - 2 * phiF;
  const Cmin = EPS_OX / (tox + (EPS_OX / EPS_SI) * xdT);
  const LDebye = Math.sqrt((VT_300 * EPS_SI) / (E_CHG * N));
  const CFB = EPS_OX / (tox + (EPS_OX / EPS_SI) * LDebye);
  return { g, tox, Cox, Qss, phiF, phiMS, VFB, xdT, QsdMax, Vdep, VT, Cmin, LDebye, CFB };
}

function mosStateAtVg(m, subType, VG) {
  // Đế p: VG < VFB tích lũy, VFB <= VG < VT nghèo, VG >= VT đảo ngược.
  // Đế n: dấu đảo ngược.
  const eff = subType === 'p' ? (VG - m.VFB) : (m.VFB - VG);
  const span = Math.max(0.05, Math.abs(m.VT - m.VFB));
  if (eff < -0.02) {
    return { mode: 'acc', label: 'Tích lũy', xd: 0, phiS: eff * 0.15, C: m.Cox, invFrac: 0, accFrac: clamp(-eff / 1.5, 0.1, 1) };
  }
  if (eff <= 0.02) {
    return { mode: 'fb', label: 'Dải phẳng (V_FB)', xd: 0, phiS: 0, C: m.CFB, invFrac: 0, accFrac: 0 };
  }
  if (eff < span) {
    // Giải chính xác phương trình cân bằng điện áp: eff = phi_s + sqrt(2*e*eps_s*N*phi_s)/Cox
    const N = m.QsdMax / (E_CHG * m.xdT);
    const gamma = Math.sqrt(2 * E_CHG * EPS_SI * N) / m.Cox;
    const u = (-gamma + Math.sqrt(gamma * gamma + 4 * eff)) / 2;
    const phiS = clamp(u * u, 0, 2 * m.phiF);
    const xd = m.xdT * Math.sqrt(phiS / (2 * m.phiF));
    const C = EPS_OX / (m.tox + (EPS_OX / EPS_SI) * xd);
    return { mode: 'dep', label: 'Nghèo (Depletion)', xd, phiS, C, invFrac: 0, accFrac: 0 };
  }
  const over = eff - span;
  const invFrac = clamp(over / 1.5, 0.08, 1);
  return { mode: 'inv', label: 'Đảo ngược (Inversion)', xd: m.xdT, phiS: 2 * m.phiF + 0.04 * Math.log(1 + over / 0.05), C: m.Cmin, invFrac, accFrac: 0 };
}

const LABS = [];

/* ==========================================================================
   1. MỤC 1.4 — TỤ MOS HAI CỰC: 3D TRÊN WAFER (TRÊN) & MẶT CẮT DỌC BÊN TRONG (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'mos', tag: '1.4', name: 'Tụ MOS', sec: 1,
  S: { sub: 'p', VG: 1.2 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Tụ MOS trên phiến wafer Si + Kim dò cổng & Nguồn DC',
      area: 'a', anim: true,
      ctrls: [
        { k: 'sub', seg: [['p', 'Đế p (kênh n)'], ['n', 'Đế n (kênh p)']], set: { p: { VG: 1.2 }, n: { VG: -1.2 } } },
        { k: 'VG', l: 'V_G', min: -2.2, max: 2.2, step: 0.05, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' },
        { btn: 'Tích lũy', fn: p => { p.S.VG = p.S.sub === 'p' ? -1.6 : 1.6; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Nghèo', fn: p => { p.S.VG = p.S.sub === 'p' ? 0.55 : -0.55; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Đảo ngược', fn: p => { p.S.VG = p.S.sub === 'p' ? 1.6 : -1.6; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const m = mosCalc(S.sub, 'Al', 1e15, 12, 1e10);
        const curSt = mosStateAtVg(m, S.sub, S.VG);
        const isP = S.sub === 'p';
        const majCol = isP ? C.c4 : C.c2, minCol = isP ? C.c2 : C.c4;
        const ionCol = isP ? C.c5 : C.c4;
        const modeCol = curSt.mode === 'inv' ? minCol : curSt.mode === 'dep' ? C.main : curSt.mode === 'acc' ? majCol : C.ink;

        // Phóng to tối đa khối tụ MOS 3D lệch trái để tận dụng không gian
        const bw = Math.min(320, W * 0.50), bd = Math.min(156, H * 0.42), subH = Math.min(112, H * 0.35), oxH = 18, gH = 16;
        const ox = W * 0.25, oy = H * 0.72;
        const targetDep = curSt.xd > 0 ? subH * clamp(curSt.xd / m.xdT, 0.14, 1) * 0.68 : 0;
        if (st.dep3d == null) st.dep3d = targetDep;
        st.dep3d += (targetDep - st.dep3d) * Math.min(1, dt * 8);

        isoBox(ctx, ox, oy, -14, -12, -16, bw + 28, bd + 24, 16, C.sub, 0.85, C.ink);
        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, subH, C.card, 1, C.sub);

        const padW = bw * 0.62, padD = bd * 0.62, padX = (bw - padW) / 2, padY = (bd - padD) / 2;
        if (st.dep3d > 2) isoBox(ctx, ox, oy, padX, padY, subH - st.dep3d, padW, padD, st.dep3d, ionCol, 0.34, ionCol);
        if (curSt.mode === 'inv' || curSt.mode === 'acc') {
          const cLayer = curSt.mode === 'inv' ? minCol : majCol;
          isoBox(ctx, ox, oy, padX, padY, subH - 7, padW, padD, 7, cLayer, 0.68 + 0.22 * Math.sin(t * 5), cLayer);
        }
        isoBox(ctx, ox, oy, 0, 0, subH, bw, bd, oxH, C.c1, 0.22, C.g);
        isoBox(ctx, ox, oy, padX, padY, subH + oxH, padW, padD, gH, C.main, 0.92, C.ink);

        const gTop = isoP(ox, oy, padX + padW * 0.5, padY + padD * 0.5, subH + oxH + gH);
        const backPt = isoP(ox, oy, bw + 14, bd * 0.5, -8);
        const psuX = Math.max(W * 0.72, ox + bw + 22), psuW = Math.min(156, W - psuX - 12), psuH = 88, psuY = 34;
        drawProbe(ctx, gTop[0], gTop[1], 1, C.main, 'Cổng (G)');
        ln(ctx, gTop[0] + 42, gTop[1] - 54, psuX, psuY + 24, C.main, 2.2);
        ln(ctx, backPt[0], backPt[1], psuX, psuY + psuH - 18, C.sub, 2.2);

        rr(ctx, psuX, psuY, psuW, psuH, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.4; ctx.stroke();
        txt(ctx, 'NGUỒN DC (V_G)', psuX + psuW / 2, psuY + 13, C.mut, 9.5, 'center', 700);
        rr(ctx, psuX + 8, psuY + 24, psuW - 16, 28, 5); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = modeCol; ctx.lineWidth = 1.2; ctx.stroke();
        txt(ctx, (S.VG >= 0 ? '+' : '−') + Math.abs(S.VG).toFixed(2) + ' V', psuX + psuW / 2, psuY + 38, modeCol, 14, 'center', 800);
        txt(ctx, 'I_cổng = 0 A (Oxit chặn)', psuX + psuW / 2, psuY + 65, C.c2, 9.5, 'center', 700);
        txt(ctx, 'Đế ' + (isP ? 'p-Si' : 'n-Si') + ' nối đất', psuX + psuW / 2, psuY + 78, C.mut, 9, 'center', 600);

        // Đồng hồ mini KHÔNG khung đặt ở vùng trống góc dưới-phải dưới bộ nguồn DC!
        const gCx = psuX + psuW * 0.5, gCy = Math.min(H - 28, psuY + psuH + 54);
        drawMiniGauge(ctx, gCx, gCy, 23, 'Uốn bề mặt φ_s', curSt.phiS.toFixed(2) + ' V · x_d=' + fmtLen(curSt.xd),
          clamp(Math.abs(curSt.phiS) / (2.2 * m.phiF), 0, 1), modeCol);

        const lbOx = isoP(ox, oy, 0, bd, subH + oxH * 0.5);
        const lbSi = isoP(ox, oy, 0, bd, subH * 0.45);
        txt(ctx, 'Oxit SiO₂', lbOx[0] - 8, lbOx[1], C.c1, 10.5, 'right', 700);
        txt(ctx, 'Phiến ' + (isP ? 'p-Si' : 'n-Si'), lbSi[0] - 8, lbSi[1], C.ink, 10.5, 'right', 700);
        chip(ctx, 'Chế độ: ' + curSt.label, W * 0.42, 15, modeCol, 'center');
      }
    },
    {
      title: 'Bên trong (chiều dọc trên → dưới đồng bộ với khối 3D): Cổng → Oxit SiO₂ → Lớp bề mặt & Đế Si',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const m = mosCalc(S.sub, 'Al', 1e15, 12, 1e10);
        const curSt = mosStateAtVg(m, S.sub, S.VG);
        const isP = S.sub === 'p';
        const majCol = isP ? C.c4 : C.c2, minCol = isP ? C.c2 : C.c4;
        const majSign = isP ? '+' : '−', minSign = isP ? '−' : '+';
        const ionSign = isP ? '−' : '+', ionCol = isP ? C.c5 : C.c4;

        // Xếp DỌC từ trên xuống dưới khớp 100% hướng xem khối 3D phía trên!
        const padX = 16, rightLbl = 128, topY = 10, botY = H - 10;
        const bw = W - padX - rightLbl, bh = botY - topY;
        const gH = bh * 0.17, oxH = bh * 0.16, yOx = topY + gH, ySi = yOx + oxH, siH = botY - ySi;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.22; ctx.fillStyle = C.c1; ctx.fillRect(padX, topY, bw, gH);
        ctx.globalAlpha = 0.20; ctx.fillStyle = C.g; ctx.fillRect(padX, yOx, bw, oxH);

        const targetDep = curSt.xd > 0 ? siH * clamp(curSt.xd / m.xdT, 0.12, 1) * 0.56 : 0;
        if (st.depPx == null) st.depPx = targetDep;
        st.depPx += (targetDep - st.depPx) * Math.min(1, dt * 8);

        if (st.depPx > 2) { ctx.globalAlpha = 0.18; ctx.fillStyle = ionCol; ctx.fillRect(padX, ySi, bw, st.depPx); }
        if (curSt.mode === 'acc') { ctx.globalAlpha = 0.36 * curSt.accFrac; ctx.fillStyle = majCol; ctx.fillRect(padX, ySi, bw, 16); }
        if (curSt.mode === 'inv') { ctx.globalAlpha = 0.48 * curSt.invFrac + 0.15; ctx.fillStyle = minCol; ctx.fillRect(padX, ySi, bw, 14 + curSt.invFrac * 7); }
        ctx.restore();

        ln(ctx, padX, yOx, padX + bw, yOx, C.ink, 1.6);
        ln(ctx, padX, ySi, padX + bw, ySi, C.ink, 1.6);
        if (st.depPx > 4) ln(ctx, padX, ySi + st.depPx, padX + bw, ySi + st.depPx, ionCol, 1.5, [4, 3]);

        // Điện tích cổng & mũi tên điện trường E chạy THẲNG ĐỨNG qua lớp oxit!
        const qGateSign = S.VG > m.VFB + 0.03 ? '+' : S.VG < m.VFB - 0.03 ? '−' : '';
        const qGateCol = qGateSign === '+' ? C.c4 : C.c2;
        const nCols = Math.max(6, Math.floor(bw / 34));
        if (qGateSign) {
          const nQ = Math.max(3, Math.round(clamp(Math.abs(S.VG - m.VFB) / 1.8, 0.35, 1) * nCols));
          for (let i = 0; i < nQ; i++) {
            const x = padX + (i + 0.5) * (bw / nQ);
            txt(ctx, qGateSign, x, yOx - 7, qGateCol, 13, 'center', 800);
            if (qGateSign === '+') arr(ctx, x, yOx + 3, x, ySi - 3, C.main, 1.8);
            else arr(ctx, x, ySi - 3, x, yOx + 3, C.main, 1.8);
          }
        }

        // Ion cố định lộ ra trong vùng nghèo (phía dưới mặt oxit)
        if (st.depPx > 14) {
          const rows = Math.max(1, Math.round((st.depPx - (curSt.mode === 'inv' ? 14 : 2)) / 20));
          const yStart = ySi + (curSt.mode === 'inv' ? 16 : 2);
          for (let r = 0; r < rows; r++) for (let c = 0; c < nCols; c++) {
            const iy = yStart + (r + 0.5) * ((ySi + st.depPx - yStart) / rows);
            if (iy < ySi + st.depPx - 5) drawIon(ctx, padX + (c + 0.5) * (bw / nCols), iy, ionSign, ionCol, 4.8);
          }
        }

        // Lớp đảo ngược hoặc lớp tích lũy ôm sát mép dưới SiO2
        if (curSt.mode === 'inv' || curSt.mode === 'acc') {
          const isInv = curSt.mode === 'inv';
          const cnt = Math.round(6 + (isInv ? curSt.invFrac : curSt.accFrac) * 10);
          for (let i = 0; i < cnt; i++) {
            const x = padX + (i + 0.5) * (bw / cnt) + Math.sin(t * 7 + i * 1.7) * 3;
            const y = ySi + 8 + Math.cos(t * 6 + i) * 1.5;
            dot(ctx, x, y, 4.6, isInv ? minCol : majCol);
            txt(ctx, isInv ? minSign : majSign, x, y + 0.5, C.bg, 8.5, 'center', 800);
          }
        }

        // Hạt đa số chuyển động nhiệt ở lõi đế bên dưới cùng
        if (!st.ps || st.W !== W) {
          st.W = W;
          st.ps = Array.from({ length: 22 }, () => ({ u: rnd(0.05, 0.95), v: rnd(0.1, 0.9), vx: gauss() * 38, vy: gauss() * 34 }));
        }
        const bulkTop = ySi + Math.max(st.depPx, curSt.mode === 'acc' ? 16 : 5);
        const bulkH = Math.max(16, botY - bulkTop);
        st.ps.forEach(q => {
          if (Math.random() < dt * 3) { q.vx = gauss() * 40; q.vy = gauss() * 34; }
          let x = padX + q.u * bw + q.vx * dt;
          let y = bulkTop + q.v * bulkH + q.vy * dt;
          if (x < padX + 7 || x > padX + bw - 7) { q.vx = -q.vx; x = clamp(x, padX + 7, padX + bw - 7); }
          if (y < bulkTop + 6) { y = bulkTop + 6; q.vy = Math.abs(q.vy); }
          if (y > botY - 6) { y = botY - 6; q.vy = -Math.abs(q.vy); }
          q.u = clamp((x - padX) / bw, 0.02, 0.98);
          q.v = clamp((y - bulkTop) / bulkH, 0.05, 0.95);
          dot(ctx, x, y, 4.6, majCol);
          txt(ctx, majSign, x, y + 0.5, C.bg, 8.5, 'center', 800);
        });

        // Chú thích từng tầng bên lề phải (cùng trục dọc!)
        const lx = padX + bw + 8;
        txt(ctx, '▲ Cổng (' + (S.VG >= 0 ? '+' : '') + S.VG.toFixed(1) + 'V)', lx, topY + gH / 2, C.c1, 10.5, 'left', 700);
        txt(ctx, '▸ Oxit SiO₂ (E dọc)', lx, yOx + oxH / 2, C.mut, 10, 'left', 600);
        txt(ctx, curSt.mode === 'inv' ? '▸ Lớp đảo ' + (isP ? 'e⁻' : 'h⁺') : curSt.mode === 'acc' ? '▸ Tích lũy ' + (isP ? 'h⁺' : 'e⁻') : '▸ Nghèo x_d=' + fmtLen(curSt.xd),
          lx, ySi + Math.max(14, st.depPx * 0.5), curSt.mode === 'inv' ? minCol : curSt.mode === 'acc' ? majCol : ionCol, 10.2, 'left', 700);
        txt(ctx, '▼ Lõi đế ' + (isP ? 'p-Si' : 'n-Si'), lx, bulkTop + bulkH * 0.55, majCol, 10.2, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   2. MỤC 2.3 — VÙNG NGHÈO CỰC ĐẠI x_dT & BÙNG NỔ ELECTRON BỀ MẶT KHI φ_s = 2φ_fp
   ========================================================================== */
LABS.push({
  id: 'inv', tag: '2.3', name: 'Ngưỡng đảo', sec: 2,
  S: { Na: 1e15, phiS: 0.575 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Phiến Si phóng lớn — vùng nghèo ăn sâu tới sàn chặn đỏ x_dT rồi màng e⁻ bùng sáng',
      area: 'a', anim: true,
      ctrls: [
        { k: 'phiS', l: 'φ_s', min: 0, max: 0.90, step: 0.01, f: v => v.toFixed(2) + ' V' },
        { k: 'Na', l: 'Nₐ', min: 14.5, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { btn: 'Ngưỡng 2φ_fp', fn: p => { const pf = VT_300 * Math.log(p.S.Na / NI_SI); p.S.phiS = +(2 * pf).toFixed(2); p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const phiFp = VT_300 * Math.log(S.Na / NI_SI), phiTh = 2 * phiFp;
        const xdT = Math.sqrt((4 * EPS_SI * phiFp) / (E_CHG * S.Na));
        const xd = Math.sqrt((2 * EPS_SI * Math.min(S.phiS, phiTh)) / (E_CHG * S.Na));
        const ns = (NI_SI * NI_SI / S.Na) * Math.exp(S.phiS / VT_300);
        const overTh = S.phiS >= phiTh - 0.005;
        const invGlow = clamp((Math.log10(Math.max(1e6, ns)) - Math.log10(S.Na) + 2) / 4, 0, 1);

        // Khối cắt 3D phóng to tối đa ở bên trái-giữa
        const bw = Math.min(340, W * 0.54), bd = Math.min(156, H * 0.42), siH = Math.min(155, H * 0.50), oxH = 16;
        const ox = W * 0.24, oy = H * 0.78;
        const maxD = siH * 0.68, curD = maxD * clamp(xd / xdT, 0, 1);

        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, siH, C.card, 1, C.sub);
        const zFloor = siH - maxD;
        const flPts = [isoP(ox, oy, 0, 0, zFloor), isoP(ox, oy, bw, 0, zFloor), isoP(ox, oy, bw, bd, zFloor), isoP(ox, oy, 0, bd, zFloor)];
        polyFill(ctx, flPts, C.err, 0.16, C.err, 1.8);

        if (curD > 2) isoBox(ctx, ox, oy, 0, 0, siH - curD, bw, bd, curD, C.c5, 0.35, C.c5);
        if (invGlow > 0.06) {
          isoBox(ctx, ox, oy, 0, 0, siH - 8, bw, bd, 8, C.c2, clamp(0.28 + invGlow * 0.65 + Math.sin(t * 6) * 0.07, 0.2, 0.96), C.c2);
        }
        isoBox(ctx, ox, oy, 0, 0, siH, bw, bd, oxH, C.c1, 0.22, C.g);
        isoBox(ctx, ox, oy, bw * 0.14, bd * 0.14, siH + oxH, bw * 0.72, bd * 0.72, 13, C.main, 0.9, C.ink);

        const topR = isoP(ox, oy, bw + 10, bd * 0.5, siH);
        const curR = isoP(ox, oy, bw + 10, bd * 0.5, siH - curD);
        const limR = isoP(ox, oy, bw + 10, bd * 0.5, zFloor);
        if (curD > 6) arr(ctx, topR[0], topR[1], curR[0], curR[1], C.main, 2.4);
        ln(ctx, limR[0] - 8, limR[1], limR[0] + 10, limR[1], C.err, 2);
        txt(ctx, 'x_dT=' + fmtLen(xdT), limR[0] + 12, limR[1], C.err, 10, 'left', 700);

        // Hai đồng hồ kim thu nhỏ KHÔNG khung đặt gọn ở cột trống ngoài cùng bên phải!
        const gx = W - 64;
        drawMiniGauge(ctx, gx, H * 0.30, 23, 'x_d / x_dT', fmtLen(xd) + (overTh ? ' (TRẦN)' : ''), xd / xdT, C.c5, 0.99);
        drawMiniGauge(ctx, gx, H * 0.72, 23, 'Electron n_s', sci(ns, 1), clamp((Math.log10(Math.max(1e6, ns)) - 8) / 11, 0, 1), ns >= S.Na ? C.c2 : C.main);

        chip(ctx, overTh ? 'ĐẠT NGƯỠNG (φ_s ≥ 2φ_fp=' + phiTh.toFixed(2) + 'V): x_d khóa ở x_dT, màng e⁻ bùng sáng!'
          : 'Đang đào vùng nghèo x_d xuống sàn chặn đỏ x_dT (φ_s < 2φ_fp)', W * 0.44, 15, overTh ? C.c2 : C.main, 'center');
      }
    },
    {
      title: 'Bên trong (chiều dọc trên → dưới): Oxit SiO₂ → Màng đảo e⁻ → Ion nghèo ăn xuống trần x_dT',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, st = p.st;
        const phiFp = VT_300 * Math.log(S.Na / NI_SI), phiTh = 2 * phiFp;
        const xdT = Math.sqrt((4 * EPS_SI * phiFp) / (E_CHG * S.Na));
        const xd = Math.sqrt((2 * EPS_SI * Math.min(S.phiS, phiTh)) / (E_CHG * S.Na));
        const ns = (NI_SI * NI_SI / S.Na) * Math.exp(S.phiS / VT_300);
        const invGlow = clamp((Math.log10(Math.max(1e6, ns)) - Math.log10(S.Na) + 2) / 4, 0, 1);

        const padX = 16, rightLbl = 128, topY = 10, botY = H - 10;
        const bw = W - padX - rightLbl, bh = botY - topY;
        const oxH = 18, ySi = topY + oxH, siH = botY - ySi;
        const maxDepPx = siH * 0.66, depPx = maxDepPx * clamp(xd / xdT, 0, 1);

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.24; ctx.fillStyle = C.g; ctx.fillRect(padX, topY, bw, oxH);
        ctx.globalAlpha = 0.18; ctx.fillStyle = C.c5; ctx.fillRect(padX, ySi, bw, depPx);
        ctx.globalAlpha = 0.08; ctx.fillStyle = C.c4; ctx.fillRect(padX, ySi + depPx, bw, botY - (ySi + depPx));
        if (invGlow > 0.04) {
          const gh = 10 + invGlow * 18;
          const grd = ctx.createLinearGradient(0, ySi, 0, ySi + gh);
          grd.addColorStop(0, C.c2); grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalAlpha = 0.25 + invGlow * 0.55; ctx.fillStyle = grd; ctx.fillRect(padX, ySi, bw, gh);
        }
        ctx.restore();

        ln(ctx, padX, ySi, padX + bw, ySi, C.ink, 1.8);
        ln(ctx, padX, ySi + maxDepPx, padX + bw, ySi + maxDepPx, C.err, 1.8, [6, 4]);
        if (depPx > 2) ln(ctx, padX, ySi + depPx, padX + bw, ySi + depPx, C.main, 2.4);

        const cols = Math.max(6, Math.floor(bw / 34));
        if (depPx > 14) {
          const rows = Math.max(1, Math.round((depPx - 14) / 20));
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            drawIon(ctx, padX + (c + 0.5) * (bw / cols), ySi + 14 + (r + 0.5) * ((depPx - 16) / rows), '−', C.c5, 4.6);
          }
        }
        const nE = Math.round(invGlow * 22);
        for (let i = 0; i < nE; i++) {
          const x = padX + ((i + 0.5) / Math.max(1, nE)) * bw;
          const y = ySi + 6 + (i % 2) * 6 + Math.sin(t * 8 + i * 1.7) * 1.5;
          dot(ctx, x, y, 4.3, C.c2); txt(ctx, '−', x, y + 0.5, C.bg, 8, 'center', 800);
        }

        if (!st.hs) st.hs = Array.from({ length: 16 }, () => ({ u: rnd(0.05, 0.95), v: rnd(0.12, 0.88), ph: rnd(0, TAU2) }));
        const bT = ySi + depPx + 5, bH = Math.max(12, botY - bT);
        st.hs.forEach(h => {
          dot(ctx, padX + clamp(h.u * bw + Math.sin(t * 4.5 + h.ph) * 4, 6, bw - 6),
            bT + clamp(h.v * bH + Math.cos(t * 4.1 + h.ph) * 3, 5, bH - 5), 4.2, C.c4);
        });

        const lx = padX + bw + 8;
        txt(ctx, 'Oxit SiO₂', lx, topY + oxH / 2, C.mut, 10, 'left', 700);
        txt(ctx, 'Màng e⁻: ' + sci(ns, 1), lx, ySi + 12, C.c2, 10, 'left', 700);
        txt(ctx, 'Trần x_dT=' + fmtLen(xdT), lx, ySi + maxDepPx, C.err, 10, 'left', 700);
        txt(ctx, 'Lõi p (Nₐ=' + pw(S.Na) + ')', lx, botY - 10, C.c4, 10, 'left', 600);
      }
    }
  ]
});

/* ==========================================================================
   3. MỤC 2.7 — ĐIỆN ÁP NGƯỠNG V_T: XẾP LỚP 3D + LED (TRÊN) & NGÂN SÁCH 4 KHOẢN (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'vt', tag: '2.7', name: 'Điện áp V_T', sec: 2,
  S: { sub: 'p', gate: 'Al', Na: 1e15, tox: 12, Qss: 1e10 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Vật liệu cổng + độ dày kính SiO₂ + điện tích Q\'_ss & Đèn LED kiểm thử tại V_G = 0 V',
      area: 'a',
      ctrls: [
        { k: 'gate', seg: [['Al', 'Al'], ['nPoly', 'n⁺-Poly'], ['pPoly', 'p⁺-Poly'], ['Au', 'Au']] },
        { k: 'Na', l: 'Nₐ', min: 14.5, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'tox', l: 't_ox', min: 4, max: 60, step: 1, f: v => v + ' nm' },
        { k: 'Qss', l: 'Q\'_ss', min: 9.5, max: 12.2, step: 0.1, log: 1, f: v => pw(v) + '/cm²' },
        { btn: 'Ví dụ 2.1', fn: p => { p.S.sub = 'p'; p.S.gate = 'Al'; p.S.Na = 1e15; p.S.tox = 12; p.S.Qss = 1e10; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H) {
        const S = p.S, m = mosCalc(S.sub, S.gate, S.Na, S.tox, S.Qss);
        const isEnh = m.VT > 0;
        const gateCol = S.gate === 'Au' ? C.main : S.gate === 'Al' ? C.sub : S.gate === 'nPoly' ? C.c2 : C.c5;

        const bw = Math.min(310, W * 0.50), bd = Math.min(150, H * 0.40), subH = Math.min(106, H * 0.34);
        const oxH = clamp(8 + (S.tox / 60) * 52, 8, 60), gH = 20;
        const ox = W * 0.25, oy = H * 0.78;

        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, subH, C.card, 1, C.sub);
        if (!isEnh) isoBox(ctx, ox, oy, 0, 0, subH - 9, bw, bd, 9, C.c2, 0.76, C.c2);
        isoBox(ctx, ox, oy, 0, 0, subH, bw, bd, oxH, C.c1, 0.28, C.c1);

        const nQ = Math.round(clamp((Math.log10(S.Qss) - 9.4) * 3.2, 1, 10));
        for (let i = 0; i < nQ; i++) {
          const qp = isoP(ox, oy, 16 + ((i + 0.5) / nQ) * (bw - 32), bd - 4, subH + 3);
          dot(ctx, qp[0], qp[1], 4.5, C.err);
          txt(ctx, '+', qp[0], qp[1] + 0.5, C.bg, 8.5, 'center', 800);
        }
        isoBox(ctx, ox, oy, bw * 0.12, bd * 0.12, subH + oxH, bw * 0.76, bd * 0.76, gH, gateCol, 0.92, C.ink);

        // LED thử mạch + số đọc V_FB, V_TN không khung rườm rà ở vùng trống bên phải
        const rx = Math.max(W * 0.76, ox + bw + 32), lcy = H * 0.34;
        txt(ctx, 'THỬ TẠI V_G = 0 V', rx, lcy - 34, C.mut, 9.5, 'center', 700);
        if (!isEnh) { ctx.save(); ctx.globalAlpha = 0.38; dot(ctx, rx, lcy, 27, C.err); ctx.restore(); }
        dot(ctx, rx, lcy, 17, isEnh ? C.tint : C.err);
        ctx.beginPath(); ctx.arc(rx, lcy, 17, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.stroke();
        txt(ctx, isEnh ? 'OFF' : 'ON!', rx, lcy + 0.5, isEnh ? C.mut : C.bg, 10.5, 'center', 800);
        txt(ctx, isEnh ? 'LOẠI GIÀU (V_T > 0)' : 'LOẠI NGHÈO (V_T ≤ 0)', rx, lcy + 30, isEnh ? C.c2 : C.err, 11, 'center', 800);

        // Số liệu gọn không khung ngay bên dưới LED
        txt(ctx, 'V_FB = ' + (m.VFB >= 0 ? '+' : '−') + Math.abs(m.VFB).toFixed(3) + ' V', rx, lcy + 56, C.c1, 11, 'center', 700);
        txt(ctx, 'V_TN = ' + (m.VT >= 0 ? '+' : '−') + Math.abs(m.VT).toFixed(3) + ' V', rx, lcy + 76, isEnh ? C.main : C.err, 13.5, 'center', 800);

        const gLbl = isoP(ox, oy, bw * 0.5, 0, subH + oxH + gH + 12);
        txt(ctx, 'Cổng ' + m.g.name + ' (φ\'_m=' + m.g.phiM + 'V)', gLbl[0], gLbl[1], gateCol, 11, 'center', 700);
        const oxLbl = isoP(ox, oy, 0, bd, subH + oxH / 2);
        txt(ctx, 'SiO₂: ' + S.tox + ' nm', oxLbl[0] - 8, oxLbl[1], C.c1, 10.5, 'right', 700);
        chip(ctx, 'Cấu trúc vật liệu quyết định V_TN = ' + (m.VT >= 0 ? '+' : '−') + Math.abs(m.VT).toFixed(3) + ' V', W * 0.44, 15, isEnh ? C.main : C.err, 'center');
      }
    },
    {
      title: 'Bên trong: Mặt cắt dọc đồng bộ (trái) & 4 khoản ngân sách cộng thành V_TN (phải)',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, m = mosCalc(S.sub, S.gate, S.Na, S.tox, S.Qss);
        const padX = 14, topY = 10, botY = H - 10, bh = botY - topY;

        // Trái (26%): mặt cắt DỌC Cổng → SiO2 (dày theo t_ox + Q'_ss) → Vùng nghèo x_dT → Đế Si
        const sw = Math.min(132, W * 0.25);
        const gH = bh * 0.18, oxH = clamp(12 + (S.tox / 60) * bh * 0.24, 12, bh * 0.30);
        const yOx = topY + gH, ySi = yOx + oxH;
        rr(ctx, padX, topY, sw, bh, 7); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, sw, bh, 7); ctx.clip();
        ctx.globalAlpha = 0.24; ctx.fillStyle = C.c1; ctx.fillRect(padX, topY, sw, gH);
        ctx.globalAlpha = 0.25; ctx.fillStyle = C.g; ctx.fillRect(padX, yOx, sw, oxH);
        ctx.globalAlpha = 0.18; ctx.fillStyle = C.c5; ctx.fillRect(padX, ySi, sw, (botY - ySi) * 0.65);
        ctx.restore();
        ln(ctx, padX, yOx, padX + sw, yOx, C.ink, 1.4);
        ln(ctx, padX, ySi, padX + sw, ySi, C.ink, 1.4);
        txt(ctx, m.g.name, padX + sw / 2, topY + gH / 2, C.c1, 10, 'center', 700);
        txt(ctx, 'SiO₂ ' + S.tox + 'nm', padX + sw / 2, yOx + oxH * 0.42, C.ink, 9.5, 'center', 700);
        const nQss = Math.round(clamp((Math.log10(S.Qss) - 9.4) * 2.4, 1, 6));
        for (let i = 0; i < nQss; i++) {
          const qx = padX + (i + 0.5) * (sw / nQss);
          dot(ctx, qx, ySi - 4, 3.6, C.err); txt(ctx, '+', qx, ySi - 3.5, C.bg, 7.5, 'center', 800);
        }
        txt(ctx, 'x_dT=' + fmtLen(m.xdT), padX + sw / 2, ySi + (botY - ySi) * 0.36, C.c5, 9.8, 'center', 700);
        txt(ctx, 'C_ox=' + (m.Cox * 1e9).toFixed(0) + 'nF', padX + sw / 2, botY - 10, C.mut, 9.5, 'center', 600);

        // Phải (74%): 4 khoản cộng thành V_TN
        const rx = padX + sw + 16, rw = W - rx - 14;
        const items = [
          { lbl: '1) Công thoát φ_ms', val: m.phiMS, col: C.c1 },
          { lbl: '2) Oxit −Q\'_ss/C_ox', val: -m.Qss / m.Cox, col: C.err },
          { lbl: '3) Nghèo |Q\'_SD|/C_ox', val: m.Vdep, col: C.c5 },
          { lbl: '4) Uốn vùng 2φ_fp', val: 2 * m.phiF, col: C.c2 }
        ];
        const zeroX = rx + rw * 0.44, scalePx = (rw * 0.50) / 2.2, rowH = bh / 4;
        ln(ctx, zeroX, topY, zeroX, botY, C.sub, 1.3);
        items.forEach((it, i) => {
          const y = topY + (i + 0.5) * rowH;
          txt(ctx, it.lbl, rx, y, C.ink, 10.5, 'left', 600);
          const w = clamp(it.val * scalePx, -rw * 0.34, rw * 0.48);
          rr(ctx, w >= 0 ? zeroX : zeroX + w, y - 6, Math.max(3, Math.abs(w)), 12, 4);
          ctx.fillStyle = it.col; ctx.fill();
          txt(ctx, (it.val >= 0 ? '+' : '−') + Math.abs(it.val).toFixed(3) + 'V',
            w >= 0 ? zeroX + Math.max(3, w) + 5 : zeroX + w - 5, y, it.col, 10.5, w >= 0 ? 'left' : 'right', 700);
        });
      }
    }
  ]
});

/* ==========================================================================
   4. MỤC 3.2 — ĐẶC TRƯNG C-V: TRẠM ĐO LCR 3D (TRÊN) & MÔ HÌNH 2 TỤ DỌC (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'moscv', tag: '3.2', name: 'Tụ MOS C-V', sec: 3,
  S: { VG: 0.4, tox: 12, Na: 1e15, Qss: 1e10 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Mâm kẹp wafer tụ MOS + Kim dò BNC nối Máy đo LCR',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VG', l: 'V_G', min: -1.5, max: 2.0, step: 0.05, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' },
        { k: 'tox', l: 't_ox', min: 6, max: 40, step: 1, f: v => v + ' nm' },
        { k: 'Na', l: 'Nₐ', min: 14.5, max: 17.0, step: 0.1, log: 1, f: v => pw(v) },
        { btn: 'VD 3.1 (V_T)', fn: p => { p.S.tox = 12; p.S.Na = 1e15; p.S.Qss = 1e10; p.S.VG = 0.80; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, m = mosCalc('p', 'Al', S.Na, S.tox, S.Qss);
        const curSt = mosStateAtVg(m, 'p', S.VG);
        const Cmeas = curSt.mode === 'inv' ? m.Cox : curSt.C;

        // Phóng to mâm wafer + tụ MOS 3D
        const bw = Math.min(220, W * 0.36), bd = Math.min(126, H * 0.36), siH = Math.min(72, H * 0.25), oxH = 13;
        const ox = W * 0.21, oy = H * 0.72;
        isoBox(ctx, ox, oy, -14, -12, -16, bw + 28, bd + 24, 16, C.c3, 0.45, C.sub);
        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, siH, C.card, 1, C.sub);
        if (curSt.mode === 'dep') {
          const dH = siH * clamp(curSt.xd / m.xdT, 0.16, 0.74);
          isoBox(ctx, ox, oy, bw * 0.18, bd * 0.18, siH - dH, bw * 0.64, bd * 0.64, dH, C.c5, 0.40, C.c5);
        }
        isoBox(ctx, ox, oy, 0, 0, siH, bw, bd, oxH, C.c1, 0.25, C.g);
        isoBox(ctx, ox, oy, bw * 0.18, bd * 0.18, siH + oxH, bw * 0.64, bd * 0.64, 12, C.main, 0.92, C.ink);

        const pTop = isoP(ox, oy, bw * 0.5, bd * 0.5, siH + oxH + 12);
        const pChuck = isoP(ox, oy, bw + 14, bd * 0.5, -8);
        drawProbe(ctx, pTop[0], pTop[1], 1, C.main, 'HI');

        // Máy đo LCR để bàn to rõ bên phải
        const lx = W * 0.55, lw = Math.min(270, W - lx - 14), lh = Math.min(176, H - 44), ly = (H - lh) * 0.55;
        ln(ctx, pTop[0] + 42, pTop[1] - 54, lx, ly + 40, C.main, 2.5);
        ln(ctx, pChuck[0], pChuck[1], lx, ly + lh - 32, C.c2, 2.5);
        const uSig = (t * 0.85) % 1;
        dot(ctx, pTop[0] + 42 + (lx - (pTop[0] + 42)) * uSig, (pTop[1] - 54) + (ly + 40 - (pTop[1] - 54)) * uSig, 3.8, C.main);

        rr(ctx, lx, ly, lw, lh, 10); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.6; ctx.stroke();
        txt(ctx, 'MÁY ĐO LCR · CHẾ ĐỘ C-V', lx + lw / 2, ly + 15, C.mut, 10, 'center', 700);
        rr(ctx, lx + 10, ly + 26, lw - 20, 62, 6); ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = curSt.mode === 'dep' ? C.c5 : C.main; ctx.lineWidth = 1.4; ctx.stroke();
        txt(ctx, (Cmeas * 1e9).toFixed(1) + ' nF/cm²', lx + lw / 2, ly + 48, curSt.mode === 'dep' ? C.c5 : C.main, 18, 'center', 800);
        txt(ctx, 'V_G: ' + (S.VG >= 0 ? '+' : '') + S.VG.toFixed(2) + ' V  ·  ' + Math.round((Cmeas / m.Cox) * 100) + '% C_ox', lx + lw / 2, ly + 72, C.ink, 10.5, 'center', 600);

        const leds = [['acc', 'TÍCH LŨY', C.c4], ['dep', 'NGHÈO', C.c5], ['inv', 'ĐẢO NGƯỢC', C.c2]];
        leds.forEach((ld, i) => {
          const ex = lx + 26 + i * ((lw - 52) / 2), ey = ly + lh - 38;
          const on = curSt.mode === ld[0];
          dot(ctx, ex, ey, 6, on ? ld[2] : C.tint);
          ctx.beginPath(); ctx.arc(ex, ey, 6, 0, TAU2); ctx.strokeStyle = on ? ld[2] : C.g; ctx.lineWidth = 1.2; ctx.stroke();
          txt(ctx, ld[1], ex, ey + 15, on ? ld[2] : C.mut, 9.5, 'center', on ? 800 : 500);
        });

        // Đồng hồ mini không khung ở khoảng trống góc trên-trái
        drawMiniGauge(ctx, 52, 48, 21, 'C\' / C_ox', Math.round((Cmeas / m.Cox) * 100) + '%', Cmeas / m.Cox, C.main);
        chip(ctx, 'Trạm đo C-V: quét V_G đo độ võng tụ MOS', W * 0.54, 15, C.main, 'center');
      }
    },
    {
      title: 'Bên trong (mô hình 2 tụ xếp DỌC đồng bộ khối 3D): Cổng (trên) → C_ox → C\'_SD nối tiếp (khi nghèo)',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, m = mosCalc('p', 'Al', S.Na, S.tox, S.Qss);
        const curSt = mosStateAtVg(m, 'p', S.VG), Cmeas = curSt.mode === 'inv' ? m.Cox : curSt.C;

        const padX = 18, rightInfo = Math.min(220, W * 0.38);
        const areaW = W - padX - rightInfo, cx = padX + areaW * 0.5;
        const pW = Math.min(200, areaW * 0.72), pH = 10;
        const osc = Math.sin(t * 5.2) * 3.5;

        const oxGap = clamp(18 + (S.tox / 40) * 26, 18, 44);
        const depGap = curSt.mode === 'dep' ? clamp((curSt.xd / m.xdT) * (H * 0.42), 14, H * 0.44) : 0;
        const totH = pH * 2 + oxGap + depGap;
        const yTop = Math.max(12, (H - totH) / 2);
        const yIface = yTop + pH + oxGap, yBot = yIface + depGap;

        // Dây dẫn dọc nối hai bản cực (đồng bộ chiều dọc!)
        ln(ctx, cx, 4, cx, yTop, C.sub, 2.5);
        ln(ctx, cx, yBot + pH, cx, H - 4, C.sub, 2.5);

        ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.g; ctx.fillRect(cx - pW / 2, yTop + pH, pW, oxGap); ctx.restore();
        txt(ctx, 'Tụ oxit C_ox', cx, yTop + pH + oxGap / 2, C.ink, 10.5, 'center', 700);

        if (depGap > 4) {
          ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.c5; ctx.fillRect(cx - pW / 2, yIface, pW, depGap); ctx.restore();
          ln(ctx, cx - pW / 2, yIface, cx + pW / 2, yIface, C.mut, 1.4, [4, 3]);
          txt(ctx, 'C\'_SD nối tiếp (x_d=' + fmtLen(curSt.xd) + ')', cx, yIface + depGap / 2, C.c5, 10.5, 'center', 700);
        }

        // Bản tụ trên (Cổng) & bản tụ dưới (Bán dẫn)
        rr(ctx, cx - pW / 2, yTop, pW, pH, 4); ctx.fillStyle = C.c1; ctx.fill();
        rr(ctx, cx - pW / 2, yBot, pW, pH, 4); ctx.fillStyle = curSt.mode === 'inv' ? C.c2 : C.c4; ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.48; ctx.fillStyle = C.main;
        ctx.fillRect(cx - pW / 2, yTop + pH - 2, pW, 4 + Math.max(0, osc));
        ctx.fillRect(cx - pW / 2, yBot - 2 - Math.max(0, osc), pW, 4 + Math.max(0, osc));
        ctx.restore();

        txt(ctx, 'Cổng', cx - pW / 2 - 8, yTop + pH / 2, C.c1, 10, 'right', 700);
        txt(ctx, curSt.mode === 'acc' ? 'Lớp lỗ (+)' : curSt.mode === 'inv' ? 'Lớp đảo (−)' : 'Mép x_d',
          cx - pW / 2 - 8, yBot + pH / 2, curSt.mode === 'inv' ? C.c2 : C.c4, 10, 'right', 700);

        // 3 mốc chuẩn không khung bên phải
        const rx = W - rightInfo + 8;
        txt(ctx, 'Ba mốc chuẩn tụ MOS:', rx, H * 0.20, C.mut, 10.5, 'left', 700);
        txt(ctx, '• C_ox (Tích lũy): ' + (m.Cox * 1e9).toFixed(1) + ' nF/cm²', rx, H * 0.42, C.c2, 10.8, 'left', 700);
        txt(ctx, '• C\'_FB (Phẳng):   ' + (m.CFB * 1e9).toFixed(1) + ' nF/cm²', rx, H * 0.62, C.c1, 10.8, 'left', 700);
        txt(ctx, '• C\'_min (Ngưỡng): ' + (m.Cmin * 1e9).toFixed(1) + ' nF/cm²', rx, H * 0.82, C.c5, 10.8, 'left', 700);
        void Cmeas;
      }
    }
  ]
});

/* ==========================================================================
   5. MỤC 3.4 — TẦN SỐ THẤP VS CAO: BÀN MÁY PHÁT SÓNG AC (TRÊN) & MẶT CẮT DỌC (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'cvfreq', tag: '3.4', name: 'Tần số C-V', sec: 3,
  S: { logF: 1.5 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Bàn máy phát sóng AC đo mẫu tụ MOS 3D đang đảo ngược nối máy đọc LCR',
      area: 'a', anim: true,
      ctrls: [
        { k: 'logF', l: 'Tần số', min: 0.7, max: 6.3, step: 0.1, f: v => fmtFreq(Math.pow(10, v)) },
        { btn: '50 Hz', fn: p => { p.S.logF = 1.7; p.syncCtrls(); p.dirty = true; } },
        { btn: '1 kHz', fn: p => { p.S.logF = 3.0; p.syncCtrls(); p.dirty = true; } },
        { btn: '1 MHz', fn: p => { p.S.logF = 6.0; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, freq = Math.pow(10, S.logF);
        const follow = 1 / (1 + Math.pow(freq / 1200, 1.35));
        const visOmega = 2.2 + (S.logF - 0.7) * 2.5;
        const gateSig = Math.sin(t * visOmega);
        const m = mosCalc('p', 'Al', 1e15, 12, 1e10);
        const Cmeas = m.Cmin + (m.Cox - m.Cmin) * follow;

        const pad = 14, boxH = Math.min(162, H - 56), boxY = (H - boxH) * 0.56;
        const genW = Math.min(182, W * 0.28), lcrW = Math.min(182, W * 0.28);

        // 1) Máy phát sóng AC (trái)
        rr(ctx, pad, boxY, genW, boxH, 9); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.c1; ctx.lineWidth = 1.5; ctx.stroke();
        txt(ctx, 'MÁY PHÁT SÓNG AC', pad + genW / 2, boxY + 15, C.c1, 10, 'center', 700);
        rr(ctx, pad + 10, boxY + 26, genW - 20, 62, 5); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        const cycles = 1 + (S.logF - 0.7) * 1.4;
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const sx = pad + 14 + (i / 48) * (genW - 28);
          const sy = boxY + 57 + Math.sin((i / 48) * TAU2 * cycles - t * visOmega) * 20;
          i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
        }
        ctx.strokeStyle = C.main; ctx.lineWidth = 2.1; ctx.stroke();
        txt(ctx, fmtFreq(freq), pad + genW / 2, boxY + 112, C.ink, 14.5, 'center', 800);
        txt(ctx, follow > 0.7 ? 'Đảo cực CHẬM' : follow < 0.2 ? 'Đảo cực SIÊU NHANH!' : 'Tốc độ vừa',
          pad + genW / 2, boxY + 136, follow < 0.2 ? C.err : C.c2, 10.5, 'center', 700);

        // 2) Tụ MOS 3D phóng lớn ở giữa
        const midX = W * 0.50, midY = boxY + boxH * 0.66;
        const bw = Math.min(126, W * 0.22), bd = Math.min(80, H * 0.24), siH = Math.min(64, H * 0.22);
        const mx = midX - bw * 0.36, my = midY + 14;
        ln(ctx, pad + genW, boxY + 57, mx + 6, my - siH - 12, C.main, 2.5);
        ln(ctx, mx + bw, my - siH * 0.4, W - pad - lcrW, boxY + 57, C.c2, 2.5);

        isoBox(ctx, mx, my, 0, 0, 0, bw, bd, siH, C.card, 1, C.sub);
        const depH = siH * 0.56 + gateSig * 9 * (1 - follow);
        isoBox(ctx, mx, my, 0, 0, siH - depH, bw, bd, depH, C.c5, 0.34, (1 - follow) > 0.4 ? C.err : C.c5);
        isoBox(ctx, mx, my, 0, 0, siH - 8, bw, bd, 8, C.c2, clamp(0.45 + gateSig * 0.35 * follow, 0.2, 0.96), C.c2);
        isoBox(ctx, mx, my, 0, 0, siH, bw, bd, 10, C.c1, 0.24, C.g);
        isoBox(ctx, mx, my, bw * 0.14, bd * 0.14, siH + 10, bw * 0.72, bd * 0.72, 11, C.main, 0.92, C.ink);

        // Đồng hồ mini không khung ở khoảng trống ngay trên tụ MOS 3D
        drawMiniGauge(ctx, midX, 52, 19, 'Lớp đảo bám kịp', Math.round(follow * 100) + '%', follow, follow < 0.2 ? C.err : C.c2);

        // 3) Máy đọc LCR (phải)
        const rx = W - pad - lcrW;
        rr(ctx, rx, boxY, lcrW, boxH, 9); ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = follow < 0.2 ? C.err : C.c2; ctx.lineWidth = 1.6; ctx.stroke();
        txt(ctx, 'MÁY ĐO LCR', rx + lcrW / 2, boxY + 15, C.mut, 10, 'center', 700);
        rr(ctx, rx + 10, boxY + 28, lcrW - 20, 58, 5); ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = follow < 0.2 ? C.err : C.c2; ctx.lineWidth = 1.2; ctx.stroke();
        txt(ctx, (Cmeas * 1e9).toFixed(1), rx + lcrW / 2, boxY + 50, follow < 0.2 ? C.err : C.c2, 19, 'center', 800);
        txt(ctx, 'nF/cm²', rx + lcrW / 2, boxY + 72, C.mut, 10, 'center', 700);
        txt(ctx, follow > 0.7 ? 'Đọc ra ≈ C_ox' : follow < 0.2 ? 'Tụt phẳng ≈ C\'_min!' : 'Đang tụt dần...',
          rx + lcrW / 2, boxY + 110, follow < 0.2 ? C.err : C.c2, 11.5, 'center', 700);
        txt(ctx, follow < 0.2 ? 'Lớp đảo ĐÓNG BĂNG' : 'Lớp đảo nhấp nháy kịp', rx + lcrW / 2, boxY + 134, C.ink, 10, 'center', 600);

        chip(ctx, 'Tần số cao (1 MHz) → lớp đảo không theo kịp AC, C\' giữ ở C\'_min', W / 2, 14, follow < 0.2 ? C.err : C.main, 'center');
      }
    },
    {
      title: 'Bên trong (chiều dọc trên → dưới đồng bộ tụ 3D): xem lớp đảo e⁻ theo kịp hay đóng băng nhường mép x_dT rung',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, freq = Math.pow(10, S.logF);
        const follow = 1 / (1 + Math.pow(freq / 1200, 1.35));
        const gateSig = Math.sin(t * (2.2 + (S.logF - 0.7) * 2.5));

        const padX = 16, rightLbl = 148, topY = 10, botY = H - 10;
        const bw = W - padX - rightLbl, bh = botY - topY;
        const gH = bh * 0.16, oxH = bh * 0.14, yOx = topY + gH, ySi = yOx + oxH, siH = botY - ySi;
        const invThick = 12 + gateSig * 6 * follow;
        const depPx = siH * 0.62 + gateSig * 12 * (1 - follow);

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.22; ctx.fillStyle = C.c1; ctx.fillRect(padX, topY, bw, gH);
        ctx.globalAlpha = 0.24; ctx.fillStyle = C.g; ctx.fillRect(padX, yOx, bw, oxH);
        ctx.globalAlpha = 0.18; ctx.fillStyle = C.c5; ctx.fillRect(padX, ySi, bw, depPx);
        ctx.globalAlpha = 0.48; ctx.fillStyle = C.c2; ctx.fillRect(padX, ySi, bw, Math.max(7, invThick));
        ctx.restore();

        ln(ctx, padX, yOx, padX + bw, yOx, C.ink, 1.5);
        ln(ctx, padX, ySi, padX + bw, ySi, C.ink, 1.5);
        ln(ctx, padX, ySi + depPx, padX + bw, ySi + depPx, (1 - follow) > 0.4 ? C.err : C.c5, (1 - follow) > 0.4 ? 2.8 : 1.5, [4, 3]);

        const nG = Math.round(7 + gateSig * 3);
        for (let i = 0; i < nG; i++) txt(ctx, '+', padX + (i + 0.5) * (bw / nG), yOx - 7, C.c4, 12.5, 'center', 800);
        const nInv = Math.round(8 + gateSig * 4 * follow);
        for (let i = 0; i < nInv; i++) {
          const x = padX + (i + 0.5) * (bw / nInv);
          dot(ctx, x, ySi + 7, 4.3, C.c2); txt(ctx, '−', x, ySi + 7.5, C.bg, 8, 'center', 800);
        }

        const midX = padX + bw * 0.5;
        if (follow > 0.25) {
          if (gateSig > 0) arr(ctx, midX, ySi + depPx - 6, midX, ySi + 18, C.c2, 2.6);
          else arr(ctx, midX, ySi + 18, midX, ySi + depPx - 6, C.c2, 2.6);
        } else {
          arr(ctx, midX, ySi + depPx - 12, midX, ySi + depPx + 14, C.err, 2.6);
          arr(ctx, midX, ySi + depPx + 14, midX, ySi + depPx - 12, C.err, 2.6);
        }

        const lx = padX + bw + 8;
        txt(ctx, 'Cổng AC (' + fmtFreq(freq) + ')', lx, topY + gH / 2, C.c1, 10, 'left', 700);
        txt(ctx, follow > 0.25 ? 'Lớp e⁻ theo kịp!' : 'Lớp e⁻ ĐÓNG BĂNG', lx, ySi + 10, follow > 0.25 ? C.c2 : C.mut, 10, 'left', 700);
        txt(ctx, follow > 0.25 ? 'Mép x_dT đứng yên' : 'Chỉ mép x_dT RUNG!', lx, ySi + depPx, follow > 0.25 ? C.mut : C.err, 10, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   6. MỤC 4.2 — KÊNH THẮT MOSFET: VỎ TO-220 + CHIP 3D (TRÊN) & MẶT CẮT KÊNH (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'pinch', tag: '4.2', name: 'Kênh thắt', sec: 4,
  S: { VGS: 2.0, VDS: 0.6, VT: 0.80 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Linh kiện vỏ TO-220 & Khối n-MOSFET phẳng trên chip phóng lớn',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VGS', l: 'V_GS', min: 0.4, max: 3.0, step: 0.05, f: v => v.toFixed(2) + ' V' },
        { k: 'VDS', l: 'V_DS', min: 0, max: 3.0, step: 0.05, f: v => v.toFixed(2) + ' V' },
        { btn: 'Cắt', fn: p => { p.S.VGS = 0.5; p.S.VDS = 1.0; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Tuyến tính', fn: p => { p.S.VGS = 2.0; p.S.VDS = 0.3; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Điểm thắt', fn: p => { p.S.VGS = 2.0; p.S.VDS = 1.2; p.syncCtrls(); p.dirty = true; } },
        { btn: 'Bão hòa', fn: p => { p.S.VGS = 2.0; p.S.VDS = 2.5; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const Vov = S.VGS - S.VT, isCut = Vov <= 0.01, Vdsat = Math.max(0, Vov), isSat = !isCut && S.VDS >= Vdsat;
        const Kn = 5.75e-4;
        const ID = isCut ? 0 : isSat ? Kn * Vov * Vov : Kn * (2 * Vov * S.VDS - S.VDS * S.VDS);
        const gd = isCut || isSat ? 0 : 2 * Kn * (Vov - S.VDS);

        // Vỏ TO-220 thực tế ở góc trái
        const pkgX = Math.min(58, W * 0.10), pkgY = H * 0.50;
        drawTO220(ctx, pkgX, pkgY, 0.95, isCut ? C.mut : isSat ? C.err : C.c2, true);
        txt(ctx, 'TO-220', pkgX, pkgY - 48, C.mut, 9.5, 'center', 700);

        // Khối n-MOSFET 3D phóng to tối đa ở giữa!
        const bw = Math.min(340, W * 0.52), bd = Math.min(150, H * 0.40), subH = Math.min(106, H * 0.36);
        const ox = W * 0.30, oy = H * 0.78;
        const sdW = bw * 0.22, chW = bw - sdW * 2, sdH = subH * 0.44;

        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, subH, C.card, 1, C.sub);
        isoBox(ctx, ox, oy, 0, 0, subH - sdH, sdW, bd, sdH, C.c2, 0.38, C.c2);
        isoBox(ctx, ox, oy, bw - sdW, 0, subH - sdH, sdW, bd, sdH, C.c2, 0.38, C.c2);

        if (!isCut) {
          const hL = clamp((Vov / 2.2) * 32 + 6, 6, 34);
          const hR = isSat ? 2.5 : hL * clamp(1 - S.VDS / Vdsat, 0.06, 1);
          const xEnd = isSat ? bw - sdW - clamp((S.VDS - Vdsat) * 12, 0, chW * 0.18) : bw - sdW;
          const cFront = [
            isoP(ox, oy, sdW, bd, subH), isoP(ox, oy, xEnd, bd, subH),
            isoP(ox, oy, xEnd, bd, subH - hR), isoP(ox, oy, sdW, bd, subH - hL)
          ];
          polyFill(ctx, cFront, C.c2, 0.78, C.c2, 1.5);
          const sp = clamp(ID / 1.2e-3, 0.08, 1.8) * 1.1;
          for (let k = 0; k < 10; k++) {
            const u = ((t * sp + k * 0.1) % 1);
            const pt = isoP(ox, oy, sdW + u * chW, bd * (0.18 + (k % 4) * 0.22), subH - 2);
            dot(ctx, pt[0], pt[1], 4, C.main);
          }
        }

        isoBox(ctx, ox, oy, sdW - 4, 0, subH, chW + 8, bd, 10, C.c1, 0.25, C.g);
        isoBox(ctx, ox, oy, sdW - 4, -4, subH + 10, chW + 8, bd + 8, 16, C.main, 0.92, C.ink);
        isoBox(ctx, ox, oy, 6, 8, subH, sdW - 14, bd - 16, 11, C.c1, 0.85, C.ink);
        isoBox(ctx, ox, oy, bw - sdW + 8, 8, subH, sdW - 14, bd - 16, 11, C.c1, 0.85, C.ink);

        const pS = isoP(ox, oy, sdW * 0.5, bd * 0.5, subH + 24);
        const pG = isoP(ox, oy, bw * 0.5, bd * 0.3, subH + 38);
        const pD = isoP(ox, oy, bw - sdW * 0.5, bd * 0.5, subH + 24);
        txt(ctx, 'Source (S)', pS[0], pS[1], C.c2, 10.5, 'center', 800);
        txt(ctx, 'Gate (' + S.VGS.toFixed(1) + 'V)', pG[0], pG[1], C.main, 11, 'center', 800);
        txt(ctx, 'Drain (+' + S.VDS.toFixed(1) + 'V)', pD[0], pD[1], C.c1, 10.5, 'center', 800);
        ln(ctx, pkgX + 24, pkgY - 10, ox - bd * 0.45, oy - subH * 0.5, C.g, 1.1, [4, 3]);

        // 2 đồng hồ mini không khung ở khoảng trống bên phải khối 3D
        const gx = W - 62;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Dòng máng I_D', fmtCur(ID), clamp(ID / 2.6e-3, 0, 1), isSat ? C.err : C.main);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Độ dẫn g_d', isSat ? '0 (bão hòa)' : (gd * 1e3).toFixed(2) + ' mS', clamp(gd / 2.5e-3, 0, 1), C.c2);

        chip(ctx, isCut ? 'TẮT: chưa có kênh dẫn' : isSat ? 'BÃO HÒA (V_DS ≥ V_GS − V_T): ĐÃ THẮT KÊNH!' : 'KHÔNG BÃO HÒA: kênh như điện trở',
          W * 0.46, 15, isCut ? C.mut : isSat ? C.err : C.c2, 'center');
      }
    },
    {
      title: 'Bên trong (mặt cắt ngang đồng bộ trái → phải): Source n⁺ → Kênh hình nêm dưới Gate → Drain n⁺',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const Vov = S.VGS - S.VT, isCut = Vov <= 0.01, Vdsat = Math.max(0, Vov), isSat = !isCut && S.VDS >= Vdsat;
        const Kn = 5.75e-4;
        const ID = isCut ? 0 : isSat ? Kn * Vov * Vov : Kn * (2 * Vov * S.VDS - S.VDS * S.VDS);

        const padX = 16, topY = 34, botY = H - 10, bw = W - padX * 2, bh = botY - topY;
        const sdW = bw * 0.17, xS = padX + sdW, xD = padX + bw - sdW, chW = xD - xS;
        const oxH = 10, gateH = 14, sdH = bh * 0.46;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.08; ctx.fillStyle = C.c4; ctx.fillRect(padX, topY, bw, bh);
        ctx.globalAlpha = 0.30; ctx.fillStyle = C.c2; ctx.fillRect(padX, topY, sdW, sdH); ctx.fillRect(xD, topY, sdW, sdH);

        const dDep = 12 + S.VDS * 12;
        ctx.globalAlpha = 0.14; ctx.fillStyle = C.c5;
        ctx.beginPath();
        ctx.moveTo(xS - 5, topY + sdH);
        ctx.quadraticCurveTo(xS + chW * 0.5, topY + sdH + 10 + S.VDS * 10, xD + 5, topY + sdH + dDep);
        ctx.lineTo(xD + sdW, topY + sdH + dDep); ctx.lineTo(xD + sdW, topY); ctx.lineTo(padX, topY);
        ctx.closePath(); ctx.fill();

        if (!isCut) {
          const hLeft = clamp((Vov / 2.2) * 28 + 5, 5, 32);
          const pinchX = isSat ? xD - clamp((S.VDS - Vdsat) * 14, 0, chW * 0.18) : xD;
          const hRight = isSat ? 1.5 : hLeft * clamp(1 - S.VDS / Vdsat, 0.04, 1);
          ctx.globalAlpha = 0.62; ctx.fillStyle = C.c2;
          ctx.beginPath();
          ctx.moveTo(xS, topY); ctx.lineTo(pinchX, topY); ctx.lineTo(pinchX, topY + hRight);
          ctx.quadraticCurveTo((xS + pinchX) / 2, topY + (hLeft + hRight) * 0.56, xS, topY + hLeft);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();

        ln(ctx, xS, topY, xS, topY + sdH, C.c2, 1.4); ln(ctx, padX, topY + sdH, xS, topY + sdH, C.c2, 1.4);
        ln(ctx, xD, topY, xD, topY + sdH, C.c2, 1.4); ln(ctx, xD, topY + sdH, padX + bw, topY + sdH, C.c2, 1.4);

        rr(ctx, xS - 4, topY - oxH, chW + 8, oxH, 3); ctx.fillStyle = C.tint; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        rr(ctx, xS - 4, topY - oxH - gateH, chW + 8, gateH, 4); ctx.fillStyle = C.main; ctx.fill();
        txt(ctx, 'Gate (V_GS=' + S.VGS.toFixed(2) + 'V)', xS + chW / 2, topY - oxH - gateH / 2, C.bg, 10, 'center', 800);
        txt(ctx, 'Source (0V)', padX + sdW / 2, topY - 10, C.c2, 10, 'center', 700);
        txt(ctx, 'Drain (+' + S.VDS.toFixed(2) + 'V)', xD + sdW / 2, topY - 10, C.c1, 10, 'center', 700);

        if (!st.es || st.W !== W) {
          st.W = W; st.es = Array.from({ length: 24 }, () => ({ u: Math.random(), v: Math.random() }));
        }
        if (!isCut) {
          const speed = clamp(ID / 1.4e-3, 0.04, 1.5) * 0.95;
          const nFlow = Math.round(clamp(Vov / 2.2, 0.2, 1) * 24);
          const hLeft = clamp((Vov / 2.2) * 26 + 4, 4, 28);
          st.es.forEach((e, i) => {
            if (i >= nFlow) return;
            e.u += speed * dt * (S.VDS > 0.02 ? 1 : 0);
            if (e.u > 1) e.u -= 1;
            const ex = xS + e.u * chW;
            const localH = isSat ? Math.max(4, hLeft * (1 - e.u * 0.92)) : Math.max(4, hLeft * (1 - e.u * (S.VDS / Math.max(0.05, Vdsat))));
            dot(ctx, ex, topY + 3 + e.v * (localH - 2), 4, C.main);
          });
          if (isSat) {
            const pinchX = xD - clamp((S.VDS - Vdsat) * 14, 0, chW * 0.18);
            dot(ctx, pinchX, topY + 3, 5, C.err);
            chip(ctx, 'Điểm thắt kênh (Pinch-off!)', pinchX - 8, topY + 42, C.err, 'right');
          }
        }
        txt(ctx, 'n⁺', padX + sdW / 2, topY + sdH / 2, C.c2, 12.5, 'center', 800);
        txt(ctx, 'n⁺', xD + sdW / 2, topY + sdH / 2, C.c2, 12.5, 'center', 800);
        txt(ctx, 'Đế loại p (V_T=' + S.VT.toFixed(2) + 'V)', W / 2, botY - 10, C.mut, 10.5, 'center', 600);
        void t;
      }
    }
  ]
});

/* ==========================================================================
   7. MỤC 4.5 — VAN DÒNG MOSFET: MẠCH TẢI ĐÈN + QUẠT (TRÊN) & 3 ỐNG BÌNH PHƯƠNG (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'ivlaw', tag: '4.5', name: 'Van dòng I_D', sec: 4,
  S: { Vov: 1.2, WL: 10, mu: 400, tox: 12 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Mạch MOSFET TO-220 lái Bóng đèn & Quạt động cơ quay theo luật bình phương (V_GS − V_T)²',
      area: 'a', anim: true,
      ctrls: [
        { k: 'Vov', l: 'V_GS−V_T', min: 0.4, max: 2.0, step: 0.1, f: v => v.toFixed(1) + ' V' },
        { k: 'WL', l: 'W/L', min: 2, max: 30, step: 1, f: v => v + '×' },
        { k: 'mu', l: 'μₙ', min: 200, max: 800, step: 50, f: v => v + '' },
        { k: 'tox', l: 't_ox', min: 6, max: 30, step: 2, f: v => v + ' nm' },
        { btn: 'Ví dụ 4.1', fn: p => { p.S.Vov = 1.2; p.S.WL = 10; p.S.mu = 400; p.S.tox = 12; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const Cox = EPS_OX / (S.tox * 1e-7), knP = S.mu * Cox, Kn = 0.5 * knP * S.WL;
        const ID = Kn * S.Vov * S.Vov, gms = knP * S.WL * S.Vov;
        const normI = clamp(ID / 3.2e-3, 0.04, 1);
        if (st.ang == null) st.ang = 0;
        st.ang += dt * (1.2 + normI * 19);

        const padX = 24, topY = 34, botY = H - 20;
        const mX = W * 0.28, mY = H * 0.60;
        const lampX = W * 0.56, lampY = H * 0.42;
        const fanX = W * 0.80, fanY = H * 0.44;

        ln(ctx, lampX, topY + 12, fanX, topY + 12, C.c4, 2.8);
        ln(ctx, lampX, topY + 12, lampX, lampY - 28, C.c4, 2.5);
        ln(ctx, fanX, topY + 12, fanX, fanY - 36, C.c4, 2.5);
        ln(ctx, lampX, lampY + 28, lampX, mY + 34, C.c1, 2.5);
        ln(ctx, fanX, fanY + 36, fanX, mY + 34, C.c1, 2.5);
        ln(ctx, mX, mY + 34, fanX, mY + 34, C.c1, 2.5);
        ln(ctx, mX + 18, mY + 56, mX + 18, botY, C.c2, 2.5);
        ln(ctx, mX + 6, botY, mX + 30, botY, C.c2, 2.5);
        ln(ctx, mX + 11, botY + 5, mX + 25, botY + 5, C.c2, 2);

        ln(ctx, padX + 68, mY + 50, mX - 18, mY + 50, C.main, 2.5);
        rr(ctx, padX, mY + 32, 68, 36, 6); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.main; ctx.lineWidth = 1.4; ctx.stroke();
        txt(ctx, 'V_GS−V_T', padX + 34, mY + 44, C.mut, 9, 'center', 700);
        txt(ctx, S.Vov.toFixed(1) + ' V', padX + 34, mY + 58, C.main, 12, 'center', 800);

        for (let k = 0; k < 6; k++) {
          const u = ((t * (0.4 + normI * 2.2) + k * (1 / 6)) % 1);
          dot(ctx, fanX - u * (fanX - mX), mY + 34, 4, C.main);
        }

        drawTO220(ctx, mX, mY, 1.32, C.main, true);

        // Bóng đèn phóng lớn tỏa sáng rực rỡ
        ctx.save(); ctx.globalAlpha = 0.14 + normI * 0.56; dot(ctx, lampX, lampY, 28 + normI * 34, C.main); ctx.restore();
        dot(ctx, lampX, lampY, 26, normI > 0.12 ? C.main : C.tint);
        ctx.beginPath(); ctx.arc(lampX, lampY, 26, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.7; ctx.stroke();
        txt(ctx, 'Tải đèn', lampX, lampY + 40, C.ink, 11, 'center', 700);

        // Quạt động cơ phóng lớn quay tít
        ctx.beginPath(); ctx.arc(fanX, fanY, 36, 0, TAU2); ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = C.c2; ctx.lineWidth = 2.2; ctx.stroke();
        for (let b = 0; b < 4; b++) {
          const a = st.ang + b * (Math.PI / 2);
          ctx.beginPath(); ctx.moveTo(fanX, fanY);
          ctx.lineTo(fanX + Math.cos(a) * 30, fanY + Math.sin(a) * 30);
          ctx.lineTo(fanX + Math.cos(a + 0.35) * 24, fanY + Math.sin(a + 0.35) * 24);
          ctx.closePath(); ctx.fillStyle = C.c2; ctx.fill();
        }
        dot(ctx, fanX, fanY, 6, C.ink);
        txt(ctx, 'Động cơ quạt', fanX, fanY + 50, C.c2, 11, 'center', 700);

        // Đồng hồ mini không khung ở khoảng trống góc trên-trái (trên TO-220)
        drawMiniGauge(ctx, padX + 58, 56, 22, 'I_D(sat)', fmtCur(ID), normI, C.main);
        txt(ctx, 'g_ms = ' + (gms * 1e3).toFixed(2) + ' mS', padX + 58, 92, C.c2, 10.5, 'center', 700);

        txt(ctx, '+V_DD (Nguồn tải)', (lampX + fanX) / 2, topY + 1, C.c4, 10.5, 'center', 700);
        chip(ctx, 'Tăng 2× (V_GS−V_T) ⇒ Đèn & Quạt nhận dòng tăng GẤP 4×!', W * 0.56, 14, C.main, 'center');
      }
    },
    {
      title: 'Bên trong: So sánh trực quan 3 ống dòng đặt 0.5× · 1× · 2× (V_GS − V_T) → Tỉ lệ dòng 0.25× : 1× : 4×!',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, Cox = EPS_OX / (S.tox * 1e-7), knP = S.mu * Cox, Kn = 0.5 * knP * S.WL;
        const cases = [
          { lbl: '0.5×', v: S.Vov * 0.5, mul: '0.25×', col: C.c1 },
          { lbl: '1.0×', v: S.Vov * 1.0, mul: '1.00×', col: C.main },
          { lbl: '2.0×', v: S.Vov * 2.0, mul: '4.00×!', col: C.c2 }
        ];
        const padX = 14, topY = 18, gapY = 6, rowH = (H - topY - gapY * 2 - 8) / 3, bw = W - padX * 2;
        const maxI = Math.max(1e-5, Kn * Math.pow(S.Vov * 2, 2));

        txt(ctx, 'k\'ₙ = ' + sci(knP, 2) + ' A/V²   ·   Kₙ = ' + sci(Kn, 2) + ' A/V²   ·   Biên V_DS(sat) = ' + S.Vov.toFixed(1) + ' V', W / 2, 9, C.mut, 10.2, 'center', 700);
        cases.forEach((cs, idx) => {
          const y = topY + idx * (rowH + gapY);
          const ID = Kn * cs.v * cs.v, frac = clamp(ID / maxI, 0.05, 1);
          const pipeX = padX + 86, pipeW = bw - 224, pipeH = Math.max(7, (rowH - 6) * frac);
          const py = y + rowH / 2 - pipeH / 2;

          txt(ctx, cs.lbl + ' (' + cs.v.toFixed(1) + 'V)', padX, y + rowH / 2, cs.col, 11, 'left', 700);
          rr(ctx, pipeX, y + 3, pipeW, rowH - 6, 4); ctx.fillStyle = C.tint; ctx.fill();
          ctx.save(); rr(ctx, pipeX, py, pipeW, pipeH, 4); ctx.fillStyle = cs.col; ctx.globalAlpha = 0.28; ctx.fill(); ctx.restore();
          rr(ctx, pipeX, py, pipeW, pipeH, 4); ctx.strokeStyle = cs.col; ctx.lineWidth = 1.5; ctx.stroke();

          const nDots = Math.max(3, Math.round(3 + frac * 9)), sp = 45 + frac * 140;
          for (let k = 0; k < nDots; k++) {
            const dx = pipeX + 5 + ((t * sp + k * ((pipeW - 10) / nDots)) % (pipeW - 10));
            const dy = py + ((k % 3 + 0.5) / 3) * pipeH;
            dot(ctx, dx, dy, Math.min(3.8, pipeH * 0.35 + 1.2), cs.col);
          }
          txt(ctx, fmtCur(ID) + ' (' + cs.mul + ')', pipeX + pipeW + 10, y + rowH / 2, idx === 1 ? C.main : C.ink, 11, 'left', 700);
        });
      }
    }
  ]
});

/* ==========================================================================
   8. MỤC 5.5 — MILLER & f_T: CHỒNG LẤN 3D + SCOPE (TRÊN) & BÌNH TỤ MILLER (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'miller', tag: '5.5', name: 'Miller & f_T', sec: 5,
  S: { L: 1.0, Vov: 1.2, RL: 2000, Cgdp: 4 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Cận cảnh mép cổng chồng lấn đỏ C_gdp + Dao động ký RF thử nghiệm tại 2 GHz',
      area: 'a', anim: true,
      ctrls: [
        { k: 'L', l: 'L', min: 0.25, max: 3.0, step: 0.05, f: v => v.toFixed(2) + ' µm' },
        { k: 'Vov', l: 'V_GS−V_T', min: 0.4, max: 2.0, step: 0.1, f: v => v.toFixed(1) + ' V' },
        { k: 'RL', l: 'R_L', min: 0, max: 5000, step: 250, f: v => v >= 1000 ? (v / 1000).toFixed(2) + ' kΩ' : v + ' Ω' },
        { k: 'Cgdp', l: 'C_gdp', min: 0, max: 20, step: 1, f: v => v + ' fF' },
        { btn: 'VD 5.1', fn: p => { p.S.L = 1.0; p.S.Vov = 1.2; p.S.RL = 0; p.S.Cgdp = 0; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const L_cm = S.L * 1e-4, W_cm = 10 * L_cm, Cox = EPS_OX / (12e-7);
        const gms = (W_cm / L_cm) * 400 * Cox * S.Vov;
        const Cgs = Cox * W_cm * L_cm, Cgdp = S.Cgdp * 1e-15, CM = Cgdp * (1 + gms * S.RL);
        const CG = Cgs + CM, fT = gms / (TAU2 * CG);

        // Phóng to khối MOSFET 3D bên trái
        const bw = Math.min(256, W * 0.41), bd = Math.min(130, H * 0.36), subH = Math.min(82, H * 0.29);
        const ox = W * 0.16, oy = H * 0.78;
        const sdW = bw * 0.28, ovPx = clamp(S.Cgdp * 1.2, 0, 24);

        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, subH, C.card, 1, C.sub);
        isoBox(ctx, ox, oy, 0, 0, subH - 28, sdW, bd, 28, C.c2, 0.36, C.c2);
        isoBox(ctx, ox, oy, bw - sdW, 0, subH - 28, sdW, bd, 28, C.c2, 0.36, C.c2);
        isoBox(ctx, ox, oy, sdW - ovPx, 0, subH, bw - sdW * 2 + ovPx * 2, bd, 10, C.c1, 0.28, C.g);
        isoBox(ctx, ox, oy, sdW - ovPx, -3, subH + 10, bw - sdW * 2 + ovPx * 2, bd + 6, 15, C.main, 0.92, C.ink);

        if (ovPx > 1) {
          isoBox(ctx, ox, oy, bw - sdW, 0, subH, ovPx, bd, 10, C.err, 0.80, C.err);
          const pOv = isoP(ox, oy, bw - sdW + ovPx * 0.5, bd, subH + 5);
          arr(ctx, pOv[0] + 18, pOv[1] - 28, pOv[0] + 2, pOv[1] - 2, C.err, 2);
          chip(ctx, 'C_gdp=' + S.Cgdp + 'fF', pOv[0] + 18, pOv[1] - 36, C.err, 'center');
        }
        const pG = isoP(ox, oy, bw * 0.5, 0, subH + 34);
        txt(ctx, 'L = ' + S.L.toFixed(2) + ' µm', pG[0], pG[1], C.main, 11, 'center', 700);

        // Đồng hồ mini f_T KHÔNG khung ở góc trên-trái
        drawMiniGauge(ctx, 56, 52, 22, 'Tần số cắt f_T', fmtFreq(fT), clamp(Math.log10(fT / 1e8) / 3.2, 0, 1), C.main);

        // Dao động ký RF bên phải
        const sx = W * 0.54, sw = Math.min(266, W - sx - 12), sh = Math.min(180, H - 44), sy = (H - sh) * 0.56;
        rr(ctx, sx, sy, sw, sh, 10); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.6; ctx.stroke();
        txt(ctx, 'DAO ĐỘNG KÝ RF · THỬ TẠI 2 GHz', sx + sw / 2, sy + 15, C.mut, 10, 'center', 700);
        const scX = sx + 10, scY = sy + 26, scW = sw - 20, scH = sh - 66;
        rr(ctx, scX, scY, scW, scH, 6); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        ln(ctx, scX, scY + scH / 2, scX + scW, scY + scH / 2, C.g, 1, [3, 3]);

        const ampRatio = clamp(fT / 2e9, 0.08, 2.4);
        ctx.beginPath();
        for (let i = 0; i <= 50; i++) {
          const x = scX + 4 + (i / 50) * (scW - 8);
          const y = scY + scH / 2 + Math.sin((i / 50) * TAU2 * 2.5 - t * 6) * (scH * 0.16);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = C.c1; ctx.lineWidth = 1.6; ctx.stroke();

        const outAmp = Math.min(scH * 0.43, scH * 0.16 * ampRatio);
        ctx.beginPath();
        for (let i = 0; i <= 50; i++) {
          const x = scX + 4 + (i / 50) * (scW - 8);
          const y = scY + scH / 2 - Math.sin((i / 50) * TAU2 * 2.5 - t * 6) * outAmp;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = ampRatio >= 1 ? C.c2 : C.err; ctx.lineWidth = 2.6; ctx.stroke();
        txt(ctx, ampRatio >= 1 ? ('Còn khuếch đại ×' + ampRatio.toFixed(1) + ' tại 2 GHz') : ('Bị suy hao ×' + ampRatio.toFixed(2) + '!'),
          sx + sw / 2, sy + sh - 24, ampRatio >= 1 ? C.c2 : C.err, 10.5, 'center', 700);
        txt(ctx, 'R_L = ' + S.RL + ' Ω  ·  Miller = ' + Math.round((CM / CG) * 100) + '% C_G', sx + sw / 2, sy + sh - 9, C.ink, 10, 'center', 600);
        chip(ctx, 'Mép chồng lấn nhỏ C_gdp bị nhân (1 + g_m R_L) làm sập băng thông RF!', W * 0.56, 14, CM > Cgs ? C.err : C.main, 'center');
      }
    },
    {
      title: 'Bên trong: Thời gian bay τ_t (trái → phải) vs Bình nạp điện dung cổng C_gs + Miller C_M',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S, L_cm = S.L * 1e-4, W_cm = 10 * L_cm, Cox = EPS_OX / (12e-7);
        const gms = (W_cm / L_cm) * 400 * Cox * S.Vov;
        const Cgs = Cox * W_cm * L_cm, gain = gms * S.RL, CM = S.Cgdp * 1e-15 * (1 + gain);
        const fT = gms / (TAU2 * (Cgs + CM)), tauT = L_cm / VSAT_SI;

        const padX = 16, bw = W - padX * 2;
        // Dải trên: Electron bay Source → Drain (τ_t = L/v_sat)
        const trY = 26, trL = padX + 12, trR = padX + bw - 12;
        txt(ctx, '1) Thời gian bay qua kênh: τ_t = ' + (tauT * 1e12).toFixed(1) + ' ps (~' + fmtFreq(1 / tauT) + ', rất nhanh)', padX, 11, C.c2, 10.5, 'left', 700);
        ln(ctx, trL, trY, trR, trY, C.g, 3.5);
        const ex = trL + ((t * clamp(1.0 / S.L, 0.4, 3.8) * 1.4) % 1) * (trR - trL);
        ln(ctx, Math.max(trL, ex - 22), trY, ex, trY, C.c2, 2.6);
        dot(ctx, ex, trY, 5, C.c2);

        // Dải dưới: 2 bình tụ nạp điện C_gs và C_M
        const tTop = 52, tBot = H - 20, tH = Math.max(28, tBot - tTop);
        const maxTank = Math.max(Cgs, CM, 30e-15);
        const w1 = clamp((Cgs / maxTank) * (bw * 0.36), 36, bw * 0.38);
        const w2 = CM > 0 ? clamp((CM / maxTank) * (bw * 0.36), 24, bw * 0.38) : 16;
        const fillLvl = 0.5 + 0.42 * Math.sin(t * clamp(Math.log10(fT) - 6.5, 1.5, 5.5) * 1.4);

        txt(ctx, '2) Nút cổ chai thật — Nạp 2 bình tụ cổng (g_m R_L = ' + gain.toFixed(1) + '×):', padX, 42, C.main, 10.5, 'left', 700);
        const x1 = padX + bw * 0.25 - w1 / 2;
        rr(ctx, x1, tTop, w1, tH, 5); ctx.fillStyle = C.tint; ctx.fill();
        ctx.save(); rr(ctx, x1, tTop, w1, tH, 5); ctx.clip();
        ctx.fillStyle = C.c1; ctx.globalAlpha = 0.55; ctx.fillRect(x1, tBot - tH * fillLvl, w1, tH * fillLvl); ctx.restore();
        rr(ctx, x1, tTop, w1, tH, 5); ctx.strokeStyle = C.c1; ctx.lineWidth = 1.5; ctx.stroke();
        txt(ctx, 'C_gs = ' + (Cgs * 1e15).toFixed(1) + ' fF', x1 + w1 / 2, tBot + 10, C.c1, 10, 'center', 700);

        const x2 = padX + bw * 0.73 - w2 / 2;
        rr(ctx, x2, tTop, w2, tH, 5); ctx.fillStyle = C.tint; ctx.fill();
        ctx.save(); rr(ctx, x2, tTop, w2, tH, 5); ctx.clip();
        ctx.fillStyle = C.err; ctx.globalAlpha = 0.55; ctx.fillRect(x2, tBot - tH * fillLvl, w2, tH * fillLvl); ctx.restore();
        rr(ctx, x2, tTop, w2, tH, 5); ctx.strokeStyle = CM > 0 ? C.err : C.g; ctx.lineWidth = 1.5; ctx.stroke();
        txt(ctx, CM > 0 ? ('Miller C_M = ' + (CM * 1e15).toFixed(1) + ' fF (×' + (1 + gain).toFixed(1) + ')') : 'C_M = 0 fF',
          x2 + w2 / 2, tBot + 10, CM > 0 ? C.err : C.mut, 10, 'center', 700);
        txt(ctx, '+', padX + bw * 0.49, (tTop + tBot) / 2, C.mut, 16, 'center', 800);
      }
    }
  ]
});

/* ==========================================================================
   9. MỤC 6.2 — DÒNG DƯỚI NGƯỠNG: CHIP CPU + PIN (TRÊN) & RÀO RÒ (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'subth', tag: '6.2', name: 'Dưới ngưỡng', sec: 6,
  S: { VGS: 0.55, VDS: 0.15, SS: 75, VT: 0.80 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế: Chip 1 tỉ MOSFET đang "NGỦ" (ảnh nhiệt hồng ngoại & Pin tụt vì dòng rò tĩnh)',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VGS', l: 'V_GS', min: 0.0, max: 0.90, step: 0.02, f: v => v.toFixed(2) + ' V' },
        { k: 'VDS', l: 'V_DS', min: 0.0, max: 0.50, step: 0.02, f: v => v.toFixed(2) + ' V' },
        { k: 'SS', l: 'SS', min: 60, max: 120, step: 5, f: v => v + ' mV/dec' }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const Isub = 1e-7 * Math.pow(10, (S.VGS - S.VT) / (S.SS * 1e-3)) * (1 - Math.exp(-S.VDS / VT_300));
        const chipLeakW = Isub * 1e9 * Math.max(0.1, S.VDS);
        const heat = clamp((Math.log10(Math.max(1e-5, chipLeakW)) + 4) / 6, 0, 1);
        if (st.bat == null) st.bat = 1;
        st.bat -= dt * (0.01 + heat * 0.24);
        if (st.bat < 0.08) st.bat = 1;

        const cx = W * 0.30, cy = H * 0.55, chipSz = Math.min(164, H * 0.56);
        rr(ctx, cx - chipSz * 0.82, cy - chipSz * 0.72, chipSz * 1.64, chipSz * 1.44, 12);
        ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1.4; ctx.stroke();
        for (let i = -3; i <= 3; i++) {
          const off = i * (chipSz * 0.12);
          ln(ctx, cx - chipSz * 0.66, cy + off, cx + chipSz * 0.66, cy + off, C.sub, 2.2);
          ln(ctx, cx + off, cy - chipSz * 0.66, cx + off, cy + chipSz * 0.66, C.sub, 2.2);
        }
        rr(ctx, cx - chipSz / 2, cy - chipSz / 2, chipSz, chipSz, 9);
        ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = heat > 0.55 ? C.err : C.sub; ctx.lineWidth = 2; ctx.stroke();

        const grd = ctx.createRadialGradient(cx, cy, 4, cx, cy, chipSz * 0.54);
        grd.addColorStop(0, heat > 0.55 ? C.err : heat > 0.25 ? C.main : C.c1);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save(); ctx.globalAlpha = 0.18 + heat * 0.68 + Math.sin(t * 5) * 0.05;
        ctx.fillStyle = grd; ctx.fillRect(cx - chipSz / 2, cy - chipSz / 2, chipSz, chipSz); ctx.restore();
        txt(ctx, 'CPU / SoC', cx, cy - 14, C.ink, 14, 'center', 800);
        txt(ctx, '1 tỉ MOSFET "TẮT"', cx, cy + 6, C.mut, 10.5, 'center', 700);
        txt(ctx, '≈ ' + (28 + heat * 62).toFixed(0) + ' °C', cx, cy + 28, heat > 0.55 ? C.err : C.c2, 13.5, 'center', 800);

        // Pin điện thoại phóng lớn ở giữa-phải
        const bx = W * 0.60, bW = 78, bH = Math.min(144, H * 0.54), by = cy - bH / 2;
        rr(ctx, bx + bW * 0.3, by - 9, bW * 0.4, 9, 3); ctx.fillStyle = C.sub; ctx.fill();
        rr(ctx, bx, by, bW, bH, 8); ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = st.bat < 0.25 ? C.err : C.sub; ctx.lineWidth = 2; ctx.stroke();
        const fillH = (bH - 12) * st.bat;
        rr(ctx, bx + 6, by + bH - 6 - fillH, bW - 12, fillH, 5);
        ctx.fillStyle = st.bat < 0.25 ? C.err : heat > 0.55 ? C.main : C.c2; ctx.fill();
        txt(ctx, Math.round(st.bat * 100) + '%', bx + bW / 2, cy, C.ink, 14, 'center', 800);
        txt(ctx, 'Pin chế độ ngủ', bx + bW / 2, by + bH + 15, C.mut, 10, 'center', 700);

        ln(ctx, cx + chipSz * 0.82, cy, bx, cy, heat > 0.5 ? C.err : C.main, 2.4, [4, 3]);
        if (heat > 0.1) {
          const u = (t * (0.4 + heat * 2.5)) % 1;
          dot(ctx, bx - u * (bx - (cx + chipSz * 0.82)), cy, 4.4, C.err);
        }

        // 2 đồng hồ mini không khung ở khoảng trống bên phải ngoài cùng
        const gx = W - 62;
        const pStr = chipLeakW >= 1 ? chipLeakW.toFixed(1) + ' W' : chipLeakW >= 1e-3 ? (chipLeakW * 1e3).toFixed(1) + ' mW' : sci(chipLeakW, 1) + ' W';
        drawMiniGauge(ctx, gx, H * 0.32, 22, 'Rò 1 MOS', fmtCur(Isub), clamp((Math.log10(Math.max(1e-16, Isub)) + 15) / 9, 0, 1), C.err, 0.65);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Hao 1 tỉ MOS', pStr, clamp((Math.log10(Math.max(1e-6, chipLeakW)) + 5) / 7, 0, 1), C.main, 0.72);

        chip(ctx, heat > 0.55 ? 'DÒNG RÒ LỚN: Chip nóng & tụt pin dù đang "TẮT"!' : 'Chế độ ngủ: dòng rò dưới ngưỡng nhỏ, chip mát',
          W * 0.45, 14, heat > 0.55 ? C.err : C.c2, 'center');
      }
    },
    {
      title: 'Bên trong (Source → Rào thế đảo ngược yếu → Drain): Hạt nhiệt rò hàm mũ qua hàng rào dù V_GS < V_T',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const Isub = 1e-7 * Math.pow(10, (S.VGS - S.VT) / (S.SS * 1e-3)) * (1 - Math.exp(-S.VDS / VT_300));
        const leakLog = clamp((Math.log10(Math.max(1e-16, Isub)) + 15) / 9, 0, 1);

        const padX = 16, topY = 14, botY = H - 10, bw = W - padX * 2, bh = botY - topY;
        const wallL = padX + bw * 0.24, wallR = padX + bw * 0.76;
        const barH = bh * clamp(0.84 - (S.VGS / 0.95) * 0.66, 0.16, 0.84);
        const yPeak = botY - barH, yDrainFloor = botY - 8 + Math.min(7, S.VDS * 14);

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = leakLog > 0.55 ? C.err : C.g; ctx.lineWidth = 1.3; ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(padX + 6, botY); ctx.lineTo(wallL - 20, botY);
        ctx.quadraticCurveTo(wallL, yPeak, wallL + 24, yPeak);
        ctx.lineTo(wallR - 24, yPeak);
        ctx.quadraticCurveTo(wallR, yPeak, wallR + 20, yDrainFloor);
        ctx.lineTo(padX + bw - 6, yDrainFloor); ctx.lineTo(padX + bw - 6, botY);
        ctx.closePath();
        ctx.save(); ctx.globalAlpha = 0.20; ctx.fillStyle = C.c5; ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.c5; ctx.lineWidth = 2.4; ctx.stroke();

        if (!st.es) st.es = Array.from({ length: 24 }, (_, i) => ({ x: rnd(padX + 12, wallL - 10), y: rnd(yPeak + 6, botY - 8), vx: rnd(45, 110), leak: i < 4 }));
        const nLeak = S.VDS < 0.01 ? 0 : Math.round(leakLog * 20);
        st.es.forEach((e, i) => {
          e.leak = i < nLeak;
          e.x += e.vx * dt;
          if (!e.leak && e.x > wallL - 8) { e.x = wallL - 8; e.vx = -Math.abs(e.vx); }
          if (e.x < padX + 10) { e.x = padX + 10; e.vx = rnd(55, 120); }
          if (e.leak && e.x > padX + bw - 10) { e.x = padX + 12; e.vx = rnd(70, 145); }
          const ey = e.leak && e.x > wallL - 12 && e.x < wallR + 12 ? yPeak - 6 : clamp(e.y, yPeak + 6, botY - 7);
          dot(ctx, e.x, ey, e.leak ? 4.8 : 4, e.leak ? C.err : C.c2);
          txt(ctx, '−', e.x, ey + 0.5, C.bg, 8, 'center', 800);
        });

        txt(ctx, 'Source', padX + 12, botY - 12, C.c2, 10, 'left', 700);
        txt(ctx, 'Drain (+' + S.VDS.toFixed(2) + 'V)', padX + bw - 12, botY - 12, C.c1, 10, 'right', 700);
        txt(ctx, S.VGS <= S.VT ? 'Lý tưởng: I_D = 0 · Thực tế: rò ' + fmtCur(Isub) : 'Đã vượt ngưỡng V_T = 0.80V',
          W / 2, topY + 11, S.VGS <= S.VT ? C.main : C.c2, 10.5, 'center', 700);
        void t;
      }
    }
  ]
});

/* ==========================================================================
   10. MỤC 6.4 — ĐIỀU BIẾN ĐỘ DÀI KÊNH: KHỐI 3D VÒM NGHÈO (TRÊN) & MẶT CẮT ΔL (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'clm', tag: '6.4', name: 'Điều biến L', sec: 6,
  S: { L: 0.6, VDS: 2.5, Na: 5e15, Vov: 1.0 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Vòm vùng nghèo đỏ của Drain phình to lấn ngang dưới cực cổng khi tăng V_DS',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VDS', l: 'V_DS', min: 1.0, max: 6.0, step: 0.1, f: v => v.toFixed(1) + ' V' },
        { k: 'L', l: 'L gốc', min: 0.3, max: 3.0, step: 0.1, f: v => v.toFixed(1) + ' µm' },
        { k: 'Na', l: 'Nₐ', min: 15, max: 17, step: 0.1, log: 1, f: v => pw(v) }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const phiFp = VT_300 * Math.log(S.Na / NI_SI);
        const xp0 = Math.sqrt((2 * EPS_SI * (phiFp + S.Vov)) / (E_CHG * S.Na)) * 1e4;
        const xpNow = Math.sqrt((2 * EPS_SI * (phiFp + S.VDS)) / (E_CHG * S.Na)) * 1e4;
        const dL = clamp(Math.max(0, xpNow - xp0) * 0.55, 0, S.L * 0.62);
        const Leff = Math.max(0.08, S.L - dL), boost = S.L / Leff;

        // Phóng to khối 3D lệch trái để chừa chỗ trống gọn cho 2 đồng hồ mini bên phải
        const sdW = 62, chW = clamp(80 + (S.L / 3.0) * Math.min(220, W * 0.36), 80, 260);
        const bw = sdW * 2 + chW, bd = Math.min(144, H * 0.38), subH = Math.min(106, H * 0.35), sdH = subH * 0.44;
        const ox = W * 0.24, oy = H * 0.78;
        const eatPx = chW * (dL / S.L);

        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, subH, C.card, 1, C.sub);
        isoBox(ctx, ox, oy, 0, 0, subH - sdH, sdW, bd, sdH, C.c2, 0.36, C.c2);
        isoBox(ctx, ox, oy, bw - sdW, 0, subH - sdH, sdW, bd, sdH, C.c2, 0.36, C.c2);
        isoBox(ctx, ox, oy, bw - sdW - eatPx, 0, subH - sdH - 14, sdW + eatPx, bd, sdH + 14, C.err, 0.30, C.err);
        isoBox(ctx, ox, oy, sdW, 0, subH - 16, Math.max(8, chW - eatPx), bd, 16, C.c2, 0.68, C.c2);
        isoBox(ctx, ox, oy, sdW, -3, subH + 7, chW, bd + 6, 14, C.main, 0.78, C.ink);

        for (let k = 0; k < 10; k++) {
          const u = ((t * (0.6 * boost) + k * 0.1) % 1);
          const pt = isoP(ox, oy, sdW + u * chW, bd * (0.2 + (k % 4) * 0.2), subH - 5);
          dot(ctx, pt[0], pt[1], 4, u * chW > (chW - eatPx) ? C.err : C.main);
        }

        const pG = isoP(ox, oy, sdW + chW / 2, 0, subH + 30);
        txt(ctx, 'L = ' + S.L.toFixed(1) + ' µm → L\' = ' + Leff.toFixed(2) + ' µm', pG[0], pG[1], C.main, 11, 'center', 700);

        // 2 đồng hồ mini không khung ở cột trống bên phải
        const gx = W - 62;
        drawMiniGauge(ctx, gx, H * 0.30, 22, 'Kênh bị ăn ΔL/L', Math.round((dL / S.L) * 100) + '%', dL / S.L, C.c5, 0.30);
        drawMiniGauge(ctx, gx, H * 0.72, 22, 'Dòng thực/lý tưởng', '×' + boost.toFixed(2), clamp((boost - 1) / 1.5, 0, 1), C.err, 0.35);

        chip(ctx, 'Kênh càng ngắn, vòm nghèo Drain càng "nuốt" mạnh chiều dài cổng!', W * 0.44, 14, boost > 1.25 ? C.err : C.main, 'center');
      }
    },
    {
      title: 'Bên trong (mặt cắt ngang đồng bộ trái → phải): đo trực tiếp L\' = L − ΔL và dòng vọt lên ×L/L\'',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const phiFp = VT_300 * Math.log(S.Na / NI_SI);
        const xp0 = Math.sqrt((2 * EPS_SI * (phiFp + S.Vov)) / (E_CHG * S.Na)) * 1e4;
        const xpNow = Math.sqrt((2 * EPS_SI * (phiFp + S.VDS)) / (E_CHG * S.Na)) * 1e4;
        const dL = clamp(Math.max(0, xpNow - xp0) * 0.55, 0, S.L * 0.62);
        const Leff = Math.max(0.08, S.L - dL), boost = S.L / Leff;

        const padX = 16, topY = 30, botY = H - 14, bw = W - padX * 2, bh = botY - topY;
        const sdW = bw * 0.16, xS = padX + sdW, xD = padX + bw - sdW, chW = xD - xS;
        const oxH = 9, gateH = 13, sdH = bh * 0.44, eatPx = chW * (dL / S.L), xPinch = xD - eatPx;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.30; ctx.fillStyle = C.c2; ctx.fillRect(padX, topY, sdW, sdH); ctx.fillRect(xD, topY, sdW, sdH);
        ctx.globalAlpha = 0.26; ctx.fillStyle = C.err;
        ctx.beginPath(); ctx.ellipse(xD, topY + sdH * 0.45, Math.max(12, eatPx + 12), sdH * 0.85 + eatPx * 0.35, 0, 0, TAU2); ctx.fill();
        ctx.globalAlpha = 0.62; ctx.fillStyle = C.c2;
        ctx.beginPath(); ctx.moveTo(xS, topY); ctx.lineTo(xPinch, topY); ctx.lineTo(xPinch, topY + 3);
        ctx.quadraticCurveTo((xS + xPinch) / 2, topY + 16, xS, topY + 24); ctx.closePath(); ctx.fill();
        ctx.restore();

        ln(ctx, xS, topY, xS, topY + sdH, C.c2, 1.4); ln(ctx, padX, topY + sdH, xS, topY + sdH, C.c2, 1.4);
        ln(ctx, xD, topY, xD, topY + sdH, C.c2, 1.4); ln(ctx, xD, topY + sdH, padX + bw, topY + sdH, C.c2, 1.4);
        ln(ctx, xPinch, topY, xPinch, topY + sdH + 10, C.err, 1.8, [4, 3]);

        rr(ctx, xS - 4, topY - oxH, chW + 8, oxH, 3); ctx.fillStyle = C.tint; ctx.fill(); ctx.strokeStyle = C.g; ctx.stroke();
        rr(ctx, xS - 4, topY - oxH - gateH, chW + 8, gateH, 4); ctx.fillStyle = C.main; ctx.fill();
        txt(ctx, 'Gate (bão hòa)', xS + chW / 2, topY - oxH - gateH / 2, C.bg, 10, 'center', 800);

        const dimY = topY + sdH + 18;
        arr(ctx, xS, dimY, xPinch - 2, dimY, C.c2, 2);
        arr(ctx, xPinch - 2, dimY, xS, dimY, C.c2, 2);
        txt(ctx, 'L\' = ' + Leff.toFixed(2) + ' µm', (xS + xPinch) / 2, dimY + 13, C.c2, 10.5, 'center', 700);
        if (eatPx > 10) {
          arr(ctx, xPinch + 2, dimY, xD, dimY, C.err, 2);
          txt(ctx, 'ΔL=' + dL.toFixed(2) + 'µm', (xPinch + xD) / 2, dimY + 13, C.err, 10.5, 'center', 700);
        }

        if (!st.es) st.es = Array.from({ length: 18 }, () => ({ u: Math.random(), v: Math.random() }));
        st.es.forEach(e => {
          e.u += (0.55 * boost) * dt; if (e.u > 1) e.u -= 1;
          const ex = xS + e.u * chW;
          const ey = topY + 3 + e.v * (ex < xPinch ? 18 * (1 - (ex - xS) / Math.max(10, xPinch - xS) * 0.85) : 3);
          dot(ctx, ex, ey, 4, ex >= xPinch ? C.err : C.main);
        });
        txt(ctx, 'Source', padX + sdW / 2, topY + sdH / 2, C.c2, 10.5, 'center', 800);
        txt(ctx, 'Drain (+' + S.VDS.toFixed(1) + 'V)', xD + sdW / 2, topY + sdH / 2, C.err, 10, 'center', 800);
        void t;
      }
    }
  ]
});

/* ==========================================================================
   11. MỤC 6.7 — BÃO HÒA & ĐẠN ĐẠO: KIẾN TRÚC 3D THẬT (TRÊN) & ĐƯỜNG ĐUA HẠT (DƯỚI)
   ========================================================================== */
LABS.push({
  id: 'velsat', tag: '6.7', name: 'Bão hòa & Đạn đạo', sec: 6,
  S: { mode: 'sat', L: 0.4, Vov: 1.2 },
  cols: '2.1fr 1fr', rows: '1.52fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Thực tế 3D: Tiến hóa hình dáng transistor theo L — Planar (nhám) → FinFET (v_sat) → GAA Nanosheet (đạn đạo)',
      area: 'a', anim: true,
      ctrls: [
        { k: 'mode', seg: [['sat', 'Bão hòa v_sat'], ['surf', 'Nhám bề mặt'], ['ball', 'Đạn đạo <0.1µm']], set: { sat: { L: 0.4 }, surf: { L: 1.0 }, ball: { L: 0.08 } } },
        { k: 'L', l: 'L', min: 0.05, max: 3.0, step: 0.05, f: v => v < 0.1 ? (v * 1000).toFixed(0) + ' nm' : v.toFixed(2) + ' µm' },
        { k: 'Vov', l: 'V_GS−V_T', min: 0.4, max: 2.2, step: 0.1, f: v => v.toFixed(1) + ' V' },
        { btn: 'VD 6.1', fn: p => { p.S.mode = 'sat'; p.S.L = 1.0; p.S.Vov = 1.2; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, L_cm = S.L * 1e-4, W_cm = 10e-4, Cox = EPS_OX / (12e-7);
        const muEff = 450 * Math.pow(clamp(S.Vov / 0.6, 0.6, 4), -1 / 3);
        const Ehoriz = S.Vov / L_cm;
        const vDrift = (muEff / Math.sqrt(1 + Math.pow((muEff * Ehoriz) / VSAT_SI, 2))) * Ehoriz;
        const isBall = S.mode === 'ball' || S.L <= 0.10;
        const vActual = isBall ? VSAT_SI * (1.25 + (0.12 - Math.min(0.12, S.L)) * 6) : vDrift;
        const fTSat = VSAT_SI / (TAU2 * L_cm);
        const Ilong = (W_cm * muEff * Cox / (2 * L_cm)) * S.Vov * S.Vov;
        const IsatVel = W_cm * Cox * S.Vov * VSAT_SI;

        const arch = isBall ? 'gaa' : (S.mode === 'surf' || S.L >= 0.8 ? 'planar' : 'finfet');
        const bw = Math.min(316, W * 0.50), bd = Math.min(144, H * 0.38);
        const ox = W * 0.22, oy = H * 0.78;

        isoBox(ctx, ox, oy, 0, 0, 0, bw, bd, 38, C.card, 1, C.sub);

        if (arch === 'planar') {
          isoBox(ctx, ox, oy, 0, 0, 14, 66, bd, 24, C.c2, 0.38, C.c2);
          isoBox(ctx, ox, oy, bw - 66, 0, 14, 66, bd, 24, C.c2, 0.38, C.c2);
          isoBox(ctx, ox, oy, 64, 0, 38, bw - 128, bd, 10, C.c1, 0.25, C.g);
          isoBox(ctx, ox, oy, 64, -4, 48, bw - 128, bd + 8, 20, C.main, 0.92, C.ink);
          for (let k = 0; k < 8; k++) {
            const u = (t * 0.55 + k * 0.125) % 1;
            const pt = isoP(ox, oy, 64 + u * (bw - 128), bd * (0.2 + (k % 3) * 0.3), 36);
            dot(ctx, pt[0], pt[1], 4.2, C.c2);
          }
          chip(ctx, 'Kiến trúc PLANAR (phẳng · L ≥ 0.8 µm): cổng phủ 1 mặt trên', W * 0.44, 14, C.c5, 'center');
        } else if (arch === 'finfet') {
          const finY = bd * 0.35, finD = bd * 0.30, finH = 66;
          isoBox(ctx, ox, oy, 18, finY, 38, bw - 36, finD, finH, C.c2, 0.55, C.c2);
          const gX = bw * 0.34, gW = bw * 0.32;
          isoBox(ctx, ox, oy, gX, 6, 38, gW, finY - 6, finH + 16, C.main, 0.86, C.ink);
          isoBox(ctx, ox, oy, gX, finY + finD, 38, gW, bd - (finY + finD) - 6, finH + 16, C.main, 0.86, C.ink);
          isoBox(ctx, ox, oy, gX, 6, 38 + finH, gW, bd - 12, 16, C.main, 0.94, C.ink);
          for (let k = 0; k < 10; k++) {
            const u = (t * 1.1 + k * 0.1) % 1;
            const pt = isoP(ox, oy, 20 + u * (bw - 40), finY + finD * 0.5, 48 + (k % 3) * 18);
            dot(ctx, pt[0], pt[1], 4.2, C.main);
          }
          chip(ctx, 'Kiến trúc FinFET 3D (kênh ngắn · v_sat): cổng bọc ôm 3 mặt vây Si!', W * 0.44, 14, C.main, 'center');
        } else {
          const sY = bd * 0.27, sD = bd * 0.46;
          isoBox(ctx, ox, oy, 8, sY - 4, 38, 48, sD + 8, 78, C.c1, 0.72, C.ink);
          isoBox(ctx, ox, oy, bw - 56, sY - 4, 38, 48, sD + 8, 78, C.c1, 0.72, C.ink);
          [46, 70, 94].forEach(z => isoBox(ctx, ox, oy, 54, sY, z, bw - 108, sD, 11, C.c2, 0.88, C.c2));
          isoBox(ctx, ox, oy, bw * 0.34, sY - 12, 38, bw * 0.32, sD + 24, 78, C.main, 0.38, C.main);
          for (let k = 0; k < 12; k++) {
            const u = (t * 2.4 + k * 0.083) % 1;
            const z = [51, 75, 99][k % 3];
            const pt = isoP(ox, oy, 52 + u * (bw - 104), sY + sD * 0.5, z);
            const ptPrev = isoP(ox, oy, Math.max(52, 52 + u * (bw - 104) - 26), sY + sD * 0.5, z);
            ln(ctx, ptPrev[0], ptPrev[1], pt[0], pt[1], C.main, 2.4);
            dot(ctx, pt[0], pt[1], 4, C.main);
          }
          chip(ctx, 'Kiến trúc GAA Nanosheet (<0.1 µm · ĐẠN ĐẠO): cổng bọc kín 4 mặt!', W * 0.44, 14, C.c2, 'center');
        }

        // Đồng hồ mini f_T & 2 dòng so sánh I_long vs I_sat KHÔNG khung ở vùng trống bên phải!
        const gx = W - 74;
        drawMiniGauge(ctx, gx, H * 0.28, 22, 'f_T = v_sat/(2πL)', fmtFreq(fTSat), clamp(Math.log10(fTSat / 1e9) / 2.6, 0, 1), C.main);
        txt(ctx, 'Kênh dài (∝V²):', gx, H * 0.58, C.mut, 9.5, 'center', 700);
        txt(ctx, fmtCur(Ilong), gx, H * 0.67, C.c2, 11.5, 'center', 800);
        txt(ctx, 'Bão hòa (∝V):', gx, H * 0.79, C.mut, 9.5, 'center', 700);
        txt(ctx, fmtCur(IsatVel), gx, H * 0.88, C.c5, 11.5, 'center', 800);

        txt(ctx, 'Source (trái)  →  L = ' + (S.L < 0.1 ? (S.L * 1000).toFixed(0) + ' nm' : S.L.toFixed(2) + ' µm') + '  ·  v = ' + sci(vActual, 2) + ' cm/s  →  Drain (phải)',
          W * 0.42, H - 10, C.ink, 10.5, 'center', 700);
      }
    },
    {
      title: 'Bên trong (Source trái → Drain phải, trần SiO₂ ở trên đồng bộ 3D): Nhám bề mặt · Bão hòa v_sat · Đạn đạo',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const L_cm = S.L * 1e-4;
        const muEff = 450 * Math.pow(clamp(S.Vov / 0.6, 0.6, 4), -1 / 3);
        const Ehoriz = S.Vov / L_cm;
        const vDrift = (muEff / Math.sqrt(1 + Math.pow((muEff * Ehoriz) / VSAT_SI, 2))) * Ehoriz;
        const isBall = S.mode === 'ball' || S.L <= 0.10;
        const vActual = isBall ? VSAT_SI * (1.25 + (0.12 - Math.min(0.12, S.L)) * 6) : vDrift;

        const padX = 16, topY = 12, botY = H - 18, bw = W - padX * 2, bh = botY - topY;
        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.3; ctx.stroke();

        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const rx = padX + (bw * i) / 48;
          const rough = (S.mode === 'surf' ? 6 : 2.5) * (i % 2 ? 1 : 0);
          i ? ctx.lineTo(rx, topY + 12 + rough) : ctx.moveTo(rx, topY + 12 + rough);
        }
        ctx.strokeStyle = S.mode === 'surf' ? C.err : C.g; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, 'Trần Si/SiO₂ nhám (E_eff ép hạt lên trần)', W / 2, topY + 8, S.mode === 'surf' ? C.err : C.mut, 9.5, 'center', 700);

        if (S.mode === 'surf') {
          for (let k = 1; k <= 5; k++) arr(ctx, padX + (bw * k) / 6, botY - 12, padX + (bw * k) / 6, topY + 24, C.c5, 1.6);
        }

        if (!st.ps || st.W !== W) {
          st.W = W; st.fl = [];
          st.ps = Array.from({ length: 16 }, (_, i) => ({ x: rnd(padX + 12, padX + bw - 12), y: topY + 24 + (i % 4) * ((bh - 34) / 4), vx: 120 }));
        }
        const vNorm = clamp(vActual / (VSAT_SI * 1.6), 0.12, 1.35);
        st.ps.forEach((q, i) => {
          if (isBall) {
            q.vx = 290; q.x += q.vx * dt; q.y = topY + 24 + (i % 4) * ((bh - 34) / 4);
          } else if (S.mode === 'surf') {
            const targetY = topY + 20 + (i % 3) * 12 * clamp(1.4 - S.Vov * 0.4, 0.35, 1.2);
            q.y += (targetY - q.y) * Math.min(1, dt * 4);
            if (Math.random() < dt * (2.5 + S.Vov * 3.5)) { q.vx = 30; st.fl.push({ x: q.x, y: q.y, a: 1 }); }
            q.vx = Math.min(155, q.vx + 110 * dt); q.x += q.vx * dt;
          } else {
            const scatRate = 1.2 + clamp(Ehoriz / 2e4, 0.5, 6);
            if (Math.random() < dt * scatRate) { q.vx = 45; if (Ehoriz > 2e4) st.fl.push({ x: q.x, y: q.y, a: 1 }); }
            q.vx = Math.min(210 * vNorm, q.vx + (120 + 180 * vNorm) * dt); q.x += q.vx * dt;
          }
          if (q.x > padX + bw - 10) q.x = padX + 10;
          if (isBall) ln(ctx, Math.max(padX + 6, q.x - 26), q.y, q.x, q.y, C.main, 2.2);
          dot(ctx, q.x, q.y, 4.6, isBall ? C.main : C.c2);
          txt(ctx, '−', q.x, q.y + 0.5, C.bg, 8.5, 'center', 800);
        });

        st.fl = (st.fl || []).filter(f => (f.a -= dt * 2.8) > 0);
        st.fl.forEach(f => {
          ctx.beginPath(); ctx.arc(f.x, f.y, 4 + (1 - f.a) * 12, 0, TAU2);
          ctx.strokeStyle = C.err; ctx.globalAlpha = f.a; ctx.lineWidth = 1.6; ctx.stroke(); ctx.globalAlpha = 1;
        });

        txt(ctx, isBall ? 'ĐẠN ĐẠO: không kịp va chạm → vượt trần v_sat!'
          : S.mode === 'surf' ? 'Nhám bề mặt: μ_eff tụt còn ' + Math.round(muEff) + ' cm²/V·s'
          : (vDrift > 0.78 * VSAT_SI ? 'ĐÃ BÃO HÒA v_sat (E=' + sci(Ehoriz, 1) + ' V/cm): I_D tuyến tính theo V_GS−V_T' : 'Kênh dài: vận tốc chưa chạm trần v_sat'),
          W / 2, botY + 10, isBall ? C.main : S.mode === 'surf' ? C.err : C.c5, 10.5, 'center', 700);
        void t;
      }
    }
  ]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM CHO ĐỦ 11 MÔ HÌNH TƯƠNG TÁC BUỔI 11
   ========================================================================== */
const LD = {};
LD.mos = {
  intro: [
    ['i', 'Tụ MOS (Cổng / Oxit SiO₂ / Đế bán dẫn) là trái tim của MOSFET: lớp oxit cách điện chặn hoàn toàn dòng một chiều qua cổng.'],
    ['w', 'Đế loại p: V_G âm hút lỗ trống tụ sát oxit (Tích lũy); V_G dương nhỏ đẩy lỗ trống lộ ion âm (Nghèo).'],
    ['w', 'Khi V_G đủ dương, điện trường mạnh hút electron về sát mặt oxit tạo LỚP ĐẢO NGƯỢC — đây chính là kênh dẫn của n-MOSFET!'],
    ['i', 'Ở cân bằng nhiệt không có dòng qua oxit nên mức Fermi E_F phẳng; đổi sang đế n thì mọi dấu V_G đảo ngược.'],
    ['v', 'Thử bấm 3 nút Tích lũy · Nghèo · Đảo ngược hoặc kéo V_G liên tục để xem hạt tải di chuyển!']
  ],
  react(S, k, P, say) {
    const m = mosCalc(S.sub, 'Al', 1e15, 12, 1e10);
    const st = mosStateAtVg(m, S.sub, S.VG);
    say('v', `Đế ${S.sub}, V_G = ${S.VG >= 0 ? '+' : ''}${S.VG.toFixed(2)} V → chế độ ${st.label}.`);
    if (st.mode === 'inv') say('w', `Bề mặt đã đảo loại dẫn (E_Fi vượt qua E_F): hình thành lớp ${S.sub === 'p' ? 'electron' : 'lỗ trống'} sát oxit.`);
    else if (st.mode === 'dep') say('w', `Hạt đa số bị đẩy sâu ${fmtLen(st.xd)}, lộ các ion cố định cân bằng điện tích cổng.`);
  }
};
LD.inv = {
  intro: [
    ['i', 'Điểm ngưỡng đảo ngược được định nghĩa khi thế bề mặt φ_s = 2φ_fp (nồng độ electron bề mặt bằng đúng nồng độ lỗ trống lõi Nₐ).'],
    ['w', 'Khi φ_s < 2φ_fp, tăng φ_s làm bề rộng vùng nghèo x_d ăn sâu dần theo √φ_s.'],
    ['w', 'Chạm đúng 2φ_fp, x_d đạt TRẦN CỰC ĐẠI x_dT = √(4ε_s φ_fp / eNₐ) và không rộng thêm nữa!'],
    ['i', 'Vượt qua 2φ_fp, chỉ nhích thêm vài chục mV là mật độ electron bề mặt n_s bùng nổ theo hàm mũ exp(Δφ_s/V_t).'],
    ['v', 'Bấm nút "Điểm ngưỡng 2φ_fp" rồi nhích φ_s cao hơn một chút để thấy đồng hồ n_s vọt qua Nₐ!']
  ],
  react(S, k, P, say) {
    const pf = VT_300 * Math.log(S.Na / NI_SI), xdT = Math.sqrt((4 * EPS_SI * pf) / (E_CHG * S.Na));
    const ns = (NI_SI * NI_SI / S.Na) * Math.exp(S.phiS / VT_300);
    say('v', `φ_s = ${S.phiS.toFixed(2)} V (2φ_fp = ${(2 * pf).toFixed(3)} V) → x_dT = ${fmtLen(xdT)}, n_s = ${sci(ns, 1)} cm⁻³.`);
    if (S.phiS >= 2 * pf) say('w', 'Vùng nghèo đã khóa ở trần x_dT — mọi điện tích cổng thêm vào nay chỉ dùng để bơm electron vào lớp đảo!');
  }
};
LD.vt = {
  intro: [
    ['i', 'Điện áp ngưỡng V_TN = φ_ms − Q\'_ss/C_ox + |Q\'_SD(max)|/C_ox + 2φ_fp là tổng của 4 khoản điện áp vật lý.'],
    ['w', 'Điện tích oxit cố định Q\'_ss dương luôn kéo V_FB và V_TN xuống thấp hơn (âm hơn).'],
    ['w', 'Tăng Nₐ hoặc tăng t_ox làm phần "đào vùng nghèo" |Q\'_SD|/C_ox lớn lên, đẩy V_TN tăng mạnh.'],
    ['i', 'Nếu V_TN > 0: MOSFET loại giàu (thường tắt ở V_G=0). Nếu V_TN < 0: loại nghèo (đã có sẵn kênh dẫn ở V_G=0!).'],
    ['v', 'Mặc định khớp Ví dụ 2.1 (Al, Nₐ=10¹⁵, t_ox=12 nm, Q\'_ss=10¹⁰): V_FB = +0,177 V, V_TN ≈ +0,80 V.']
  ],
  react(S, k, P, say) {
    const m = mosCalc(S.sub, S.gate, S.Na, S.tox, S.Qss);
    say('v', `${m.g.name}, Nₐ=${pw(S.Na)}, t_ox=${S.tox}nm, Q\'_ss=${pw(S.Qss)} → V_FB=${m.VFB.toFixed(3)}V, V_TN=${m.VT.toFixed(3)}V.`);
    if (m.VT <= 0) say('w', 'V_TN ≤ 0: linh kiện trở thành LOẠI NGHÈO (depletion mode) — phải kéo cổng âm mới tắt được kênh!');
  }
};
LD.moscv = {
  intro: [
    ['i', 'Phép đo C-V dùng tín hiệu AC nhỏ dV để thăm dò nơi điện tích thay đổi: C\' = dQ\'/dV.'],
    ['w', 'Ở Tích lũy (và Đảo ngược tần số thấp), điện tích thay đổi ngay sát mặt oxit → chỉ có tụ oxit C_ox = ε_ox/t_ox.'],
    ['w', 'Ở chế độ Nghèo, lớp điện tích AC nằm sâu ở mép x_d → tụ oxit C_ox mắc NỐI TIẾP với tụ vùng nghèo C\'_SD = ε_s/x_d, nên C\' giảm sâu xuống C\'_min!'],
    ['v', 'Mặc định khớp Ví dụ 3.1 (t_ox=12 nm, Nₐ=10¹⁵): C_ox = 288, C\'_FB = 62,6, C\'_min = 11,5 nF/cm² (chỉ bằng 4% C_ox!).']
  ],
  react(S, k, P, say) {
    const m = mosCalc('p', 'Al', S.Na, S.tox, S.Qss);
    const st = mosStateAtVg(m, 'p', S.VG);
    const Cmeas = st.mode === 'inv' ? m.Cox : st.C;
    say('v', `V_G=${S.VG.toFixed(2)}V (${st.label}): C\' = ${(Cmeas * 1e9).toFixed(1)} nF/cm² (${Math.round((Cmeas / m.Cox) * 100)}% C_ox).`);
  }
};
LD.cvfreq = {
  intro: [
    ['i', 'Trong vùng đảo ngược của tụ MOS, electron lớp đảo phải sinh ra từ phát sinh nhiệt hoặc khuếch tán thiểu số — các quá trình này tốn thời gian!'],
    ['w', 'Ở tần số THẤP (5–100 Hz): electron kịp chảy ra/vào lớp đảo theo nhịp AC → điện dung đo quay trở lại C_ox.'],
    ['w', 'Ở tần số CAO (~1 MHz, chuẩn công nghiệp): tín hiệu đảo chiều quá nhanh, lớp đảo ĐÓNG BĂNG không phản ứng → chỉ mép x_dT rung, điện dung giữ phẳng ở C\'_min!'],
    ['v', 'Kéo thanh tần số từ 50 Hz lên 1 MHz và nhìn điểm rung AC nhảy từ sát oxit ra tận mép vùng nghèo x_dT.']
  ],
  react(S, k, P, say) {
    const f = Math.pow(10, S.logF), follow = 1 / (1 + Math.pow(f / 1200, 1.35));
    say('v', `f = ${fmtFreq(f)}: lớp đảo theo kịp ${Math.round(follow * 100)}% → ${follow > 0.7 ? 'C\' ≈ C_ox (tần số thấp)' : follow < 0.2 ? 'C\' ≈ C\'_min (tần số cao!)' : 'vùng chuyển tiếp'}.`);
  }
};
LD.pinch = {
  intro: [
    ['i', 'Đặt thêm 2 vùng n⁺ (Source và Drain) hai bên tụ MOS ta được n-MOSFET. Khi V_GS > V_T, lớp đảo nối thông S–D.'],
    ['w', 'Khi V_DS nhỏ: kênh gần đều, MOSFET hoạt động như một điện trở có độ dẫn g_d = (W/L) μₙ C_ox (V_GS − V_T).'],
    ['w', 'Tăng V_DS làm điện áp cổng–kênh ở đầu máng giảm xuống → kênh thon thành hình nêm và THẮT HẲN tại V_DS(sat) = V_GS − V_T!'],
    ['i', 'Vượt qua điểm thắt (bão hòa), điện áp rơi dọc phần kênh dẫn giữ cố định bằng V_GS − V_T nên dòng I_D bão hòa phẳng.'],
    ['v', 'Thử bấm 4 nút chế độ: Cắt · Tuyến tính · Đúng điểm thắt · Bão hòa sâu.']
  ],
  react(S, k, P, say) {
    const Vov = Math.max(0, S.VGS - S.VT), Kn = 5.75e-4;
    const isSat = Vov > 0 && S.VDS >= Vov;
    const ID = Vov <= 0 ? 0 : isSat ? Kn * Vov * Vov : Kn * (2 * Vov * S.VDS - S.VDS * S.VDS);
    say('v', `V_GS=${S.VGS.toFixed(2)}V, V_DS=${S.VDS.toFixed(2)}V (V_DS(sat)=${Vov.toFixed(2)}V) → ${Vov <= 0 ? 'TẮT' : isSat ? 'BÃO HÒA' : 'KHÔNG BÃO HÒA'}, I_D=${fmtCur(ID)}.`);
  }
};
LD.ivlaw = {
  intro: [
    ['i', 'Trong vùng bão hòa lý tưởng, dòng máng tuân theo LUẬT BÌNH PHƯƠNG: I_D(sat) = (W μₙ C_ox / 2L)(V_GS − V_T)².'],
    ['w', 'Ba ống dòng phía trên đặt điện áp điều khiển theo tỉ lệ 0,5× : 1× : 2× — hãy nhìn dòng chảy tăng theo tỉ lệ 0,25× : 1× : 4×!'],
    ['i', 'Tăng W/L hoặc làm oxit t_ox mỏng hơn làm tham số Kₙ tăng tuyến tính, đẩy dòng và độ truyền dẫn g_ms lên cao.'],
    ['v', 'Mặc định khớp Ví dụ 4.1 (W/L=10, μₙ=400, t_ox=12 nm, V_GS−V_T=1,2 V): I_D(sat) = 0,83 mA, g_ms = 1,40 mS.']
  ],
  react(S, k, P, say) {
    const Cox = EPS_OX / (S.tox * 1e-7), knP = S.mu * Cox, Kn = 0.5 * knP * S.WL;
    say('v', `V_GS−V_T=${S.Vov.toFixed(1)}V, W/L=${S.WL}, t_ox=${S.tox}nm → I_D(sat)=${fmtCur(Kn * S.Vov * S.Vov)}, g_ms=${(knP * S.WL * S.Vov * 1e3).toFixed(2)} mS.`);
  }
};
LD.miller = {
  intro: [
    ['i', 'Electron bay qua kênh 1 µm chỉ mất τ_t = L/v_sat = 10 ps (~100 GHz), nhưng tốc độ thực của MOSFET bị kìm bởi việc NẠP ĐIỆN DUNG CỔNG!'],
    ['w', 'Hiệu ứng Miller: một tụ chồng lấn cực nhỏ C_gdp giữa cổng và máng bị nhân với độ lợi áp (1 + g_m R_L) thành bình tụ khổng lồ C_M!'],
    ['i', 'Lý tưởng (C_gdp = 0): f_T = μₙ(V_GS − V_T) / (2πL²) ∝ 1/L² — thu nhỏ kênh tăng tốc độ cực mạnh.'],
    ['v', 'Bấm nút "Ví dụ 5.1" để ra f_T = 7,64 GHz, rồi kéo R_L và C_gdp lên xem bình Miller C_M phình to kéo sập f_T!']
  ],
  react(S, k, P, say) {
    const L_cm = S.L * 1e-4, Cox = EPS_OX / (12e-7), gms = 10 * 400 * Cox * S.Vov;
    const Cgs = Cox * 10 * L_cm * L_cm, CM = S.Cgdp * 1e-15 * (1 + gms * S.RL);
    const fT = gms / (TAU2 * (Cgs + CM));
    say('v', `L=${S.L.toFixed(2)}µm, C_gs=${(Cgs * 1e15).toFixed(1)}fF, C_M=${(CM * 1e15).toFixed(1)}fF → f_T = ${fmtFreq(fT)}.`);
    if (CM > Cgs) say('w', 'Điện dung Miller C_M đã LỚN HƠN cả C_gs — đây là thủ phạm số một giới hạn băng thông mạch khuếch đại!');
  }
};
LD.subth = {
  intro: [
    ['i', 'Lý thuyết lý tưởng coi I_D = 0 khi V_GS ≤ V_T, nhưng thực tế khi φ_fp < φ_s < 2φ_fp (đảo ngược yếu) vẫn có dòng rò dưới ngưỡng!'],
    ['w', 'Cơ chế: electron nhiệt vẫn đủ năng lượng khuếch tán qua hàng rào giữa Source và Drain theo hàm mũ exp(eV_GS/kT).'],
    ['w', 'Chỉ cần V_DS lớn hơn vài kT/e (~0,1 V) là dòng rò đạt mức bão hòa theo V_DS.'],
    ['i', 'Với 1 tỉ transistor đang ở trạng thái "TẮT" trong một con chip, dòng rò dưới ngưỡng cộng dồn gây hao pin và tỏa nhiệt tĩnh đáng kể!'],
    ['v', 'Thử kéo V_GS sát lên V_T = 0,80 V hoặc tăng độ dốc SS (nhiều trạng thái bề mặt) để xem đồng hồ hao pin vọt lên.']
  ],
  react(S, k, P, say) {
    const Isub = 1e-7 * Math.pow(10, (S.VGS - S.VT) / (S.SS * 1e-3)) * (1 - Math.exp(-S.VDS / VT_300));
    say('v', `V_GS=${S.VGS.toFixed(2)}V, V_DS=${S.VDS.toFixed(2)}V, SS=${S.SS} mV/dec → I_sub = ${fmtCur(Isub)}.`);
    if (k === 'SS') say('w', 'Độ dốc SS lớn (mật độ trạng thái bề mặt cao) làm transistor tắt kém dứt khoát → dòng rò ở V_GS=0 tăng vọt!');
  }
};
LD.clm = {
  intro: [
    ['i', 'Trong vùng bão hòa, tăng V_DS tiếp làm vùng nghèo tiếp giáp máng–đế mở rộng theo chiều ngang: x_p = √[2ε_s(φ_fp + V_DS)/(eNₐ)].'],
    ['w', 'Vùng nghèo máng "ăn" lấn vào kênh một đoạn ΔL, khiến chiều dài kênh dẫn thực tế bị rút ngắn thành L\' = L − ΔL!'],
    ['w', 'Kênh ngắn lại nên dòng bão hòa tăng theo tỉ lệ L / (L − ΔL) — không còn nằm ngang phẳng lì như lý tưởng.'],
    ['v', 'Thử kéo L xuống ngắn (0,3–0,5 µm) rồi tăng V_DS để thấy ΔL/L lớn rõ rệt và dòng bão hòa vọt lên!']
  ],
  react(S, k, P, say) {
    const pf = VT_300 * Math.log(S.Na / NI_SI);
    const xp0 = Math.sqrt((2 * EPS_SI * (pf + S.Vov)) / (E_CHG * S.Na)) * 1e4;
    const xpNow = Math.sqrt((2 * EPS_SI * (pf + S.VDS)) / (E_CHG * S.Na)) * 1e4;
    const dL = clamp(Math.max(0, xpNow - xp0) * 0.55, 0, S.L * 0.62);
    say('v', `L=${S.L.toFixed(1)}µm, V_DS=${S.VDS.toFixed(1)}V → ΔL=${dL.toFixed(2)}µm (${Math.round(dL / S.L * 100)}%), dòng tăng ×${(S.L / Math.max(0.08, S.L - dL)).toFixed(2)}.`);
  }
};
LD.velsat = {
  intro: [
    ['i', 'Khi thu nhỏ MOSFET, xuất hiện 3 hiệu ứng vận chuyển phi lý tưởng quan trọng:'],
    ['w', '1) Tán xạ bề mặt (6.5): điện trường dọc E_eff kéo electron ép sát trần Si/SiO₂ nhám → μ_eff ∝ E_eff^(−1/3) giảm mạnh.'],
    ['w', '2) Bão hòa vận tốc (6.6): kênh ngắn có trường ngang lớn làm hạt chạm trần v_sat = 10⁷ cm/s → dòng I_D(sat) = W C_ox (V_GS − V_T) v_sat trở thành TUYẾN TÍNH (hết luật bình phương!) và f_T = v_sat/(2πL).'],
    ['w', '3) Vận chuyển đạn đạo (6.8): khi L < 0,1 µm, electron bay xuyên kênh không kịp va chạm → vận tốc vượt cả v_sat!'],
    ['v', 'Bấm nút "Ví dụ 6.1 (L=1 µm)" xem f_T ≈ 16 GHz, hoặc chuyển giữa 3 chế độ để nhìn trực tiếp chuyển động hạt.']
  ],
  react(S, k, P, say) {
    const fTSat = VSAT_SI / (TAU2 * S.L * 1e-4);
    if (S.mode === 'ball' || S.L <= 0.1) say('w', `Đạn đạo (L=${(S.L * 1000).toFixed(0)} nm): quãng đường nhỏ hơn quãng đường tự do → hạt bay thẳng không va chạm, vượt trần v_sat!`);
    else if (S.mode === 'surf') say('w', `Nhám bề mặt: V_GS−V_T càng lớn thì lực ép lên mặt oxit nhám càng mạnh → tán xạ liên tục làm tụt μ_eff.`);
    else say('v', `Bão hòa vận tốc (L=${S.L.toFixed(2)}µm): cận trên f_T = v_sat/(2πL) = ${fmtFreq(fTSat)}, dòng bão hòa tỉ lệ tuyến tính với V_GS − V_T.`);
  }
};
LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (#lab11 — đồng bộ 100% phong cách & biến màu CSS của lab-b7.js)
   ========================================================================== */
const CSS = `
#lab11{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab11[hidden]{display:none}
#lab11 *{box-sizing:border-box}
#lab11 .lb-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
#lab11 .lb-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
#lab11 .lb-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
#lab11 .lb-ic{color:var(--main);display:flex}
#lab11 .lb-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
#lab11 .lb-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
#lab11 .lb-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
#lab11 .lb-tab:hover{color:var(--ink);background:var(--tint)}
#lab11 .lb-tab.on{background:var(--main);color:var(--bg);font-weight:700}
#lab11 .lb-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
#lab11 .lb-x:hover{color:var(--err);background:var(--tint)}
#lab11 .lb-b{flex:1;min-height:0;display:grid;gap:6px;padding:6px}
#lab11 .lb-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
#lab11 .lb-p.glow{animation:lb11glow 1.4s ease-out}
@keyframes lb11glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
#lab11 .lb-t{font:600 11.5px/1.2 var(--font-ui);color:var(--mut);padding:5px 10px 0;flex:none}
#lab11 .lb-cv{flex:1;min-height:0;position:relative}
#lab11 .lb-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#lab11 .lb-c{display:flex;flex-wrap:wrap;gap:5px 10px;padding:4px 10px 6px;flex:none;align-items:center}
#lab11 .lb-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
#lab11 .lb-k input[type=range]{width:clamp(64px,7vw,108px);margin:0}
#lab11 .lb-k output{color:var(--ink);font-weight:700;min-width:3em}
#lab11 .lb-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
#lab11 .lb-seg button,#lab11 .lb-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:5px 8px;cursor:pointer}
#lab11 .lb-btn{background:var(--tint)}
#lab11 .lb-seg button:hover,#lab11 .lb-btn:hover{color:var(--ink)}
#lab11 .lb-seg button.on{background:var(--main);color:var(--bg)}
#lab11 .lb-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
#lab11 .lb-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb11in .4s ease-out;overflow-wrap:anywhere}
#lab11 .lb-ln::before{position:absolute;left:0;font-weight:700}
#lab11 .lb-ln.i{color:var(--ink)}#lab11 .lb-ln.i::before{content:'›';color:var(--c5)}
#lab11 .lb-ln.w{color:var(--ink)}#lab11 .lb-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
#lab11 .lb-ln.v{color:var(--main)}#lab11 .lb-ln.v::before{content:'=';color:var(--main)}
@keyframes lb11in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab-m:hover,.lab-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){#lab11 .lb-win{width:100vw;height:100dvh;border-radius:0}#lab11 .lb-b{overflow:auto;display:flex;flex-direction:column}#lab11 .lb-p{min-height:300px;flex:none}#lab11 .lb-p:nth-child(2){min-height:210px}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style');
sty.textContent = CSS;
document.head.appendChild(sty);

let timers = [], ros = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'mos';

function ensureDom() {
  if (root) return;
  root = document.createElement('div');
  root.id = 'lab11';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 11');
  root.innerHTML = '<div class="lb-win"><div class="lb-h"><span class="lb-ic">' + FLASK + '</span><span class="lb-bd">Phòng thí nghiệm · Buổi 11</span><nav class="lb-tabs"></nav><button class="lb-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb-b"></div></div>';
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
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty && window.LabB11 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden && (document.getElementById('tb-badge') || {}).textContent === 'Buổi 11') {
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
    try { p.spec.draw(p, ctx, p.W, p.H, tAcc, dt); } catch (err) { console.error('[LabB11]', err); }
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

/* ---------- gắn biểu tượng bình thí nghiệm nhỏ cạnh tiêu đề Buổi 11 (1–1 cho đủ 11 mỏ neo) ---------- */
const H2MAP = { 1: 'mos', 2: 'inv', 3: 'moscv', 4: 'pinch', 5: 'miller', 6: 'subth' };
const H3MAP = [
  [/^1\.2/, 'mos', 0],    [/^1\.3/, 'mos', 0, { sub: 'n', VG: -1.2 }], [/^1\.4/, 'mos', 0],
  [/^2\.2/, 'inv', 0],    [/^2\.3/, 'inv', 0],
  [/^2\.5/, 'vt', 1],     [/^2\.6/, 'vt', 0],    [/^2\.7/, 'vt', 0],
  [/^3\.1/, 'moscv', 0],  [/^3\.2/, 'moscv', 0],
  [/^3\.3/, 'cvfreq', 0], [/^3\.4/, 'cvfreq', 0],
  [/^4\.1/, 'pinch', 0, { VGS: 2.0, VDS: 0.3 }], [/^4\.2/, 'pinch', 0], [/^4\.3/, 'pinch', 0, { VGS: 2.0, VDS: 1.2 }],
  [/^4\.4/, 'ivlaw', 0],  [/^4\.5/, 'ivlaw', 0],
  [/^5\.2/, 'miller', 0], [/^5\.3/, 'miller', 0, { RL: 3000, Cgdp: 10 }], [/^5\.4/, 'miller', 1], [/^5\.5/, 'miller', 0],
  [/^6\.1/, 'subth', 0],  [/^6\.2/, 'subth', 0],
  [/^6\.3/, 'clm', 0],    [/^6\.4/, 'clm', 0],
  [/^6\.5/, 'velsat', 0, { mode: 'surf' }], [/^6\.6/, 'velsat', 0, { mode: 'sat' }],
  [/^6\.7/, 'velsat', 0], [/^6\.8/, 'velsat', 0, { mode: 'ball', L: 0.08 }]
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

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 11') {
  markLesson(document.getElementById('app-content'));
}
window.LabB11 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
