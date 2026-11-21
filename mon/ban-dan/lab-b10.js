/* ==========================================================================
   lab-b10.js — PHÒNG THÍ NGHIỆM MÔ PHỎNG BUỔI 10:
   TIẾP XÚC KIM LOẠI–BÁN DẪN, DỊ TIẾP GIÁP, 2-DEG & TRANSISTOR HEMT
   - Hoàn toàn mô phỏng vật lý trực quan (khối tinh thể, hạt di động, ion,
     bậc thềm thế năng, gương lực ảnh, ổ khóa ghim mức Fermi, lò phát xạ nhiệt,
     mạch đèn so áp mở, cuộc đua chuyển mạch, tường xuyên hầm, dị tiếp giáp
     Anderson/nP/n-N, giếng lượng tử 2-DEG & mặt cắt HEMT) — KHÔNG dùng đồ thị.
   - Đồng bộ bảng biến màu CSS, khung popup 95% và nhật ký như lab-b7.js.
   - Đủ 15 tab ứng 1–1 với 15 mỏ neo "Mô hình tương tác" trong Buổi 10:
       1.4 · Ghép M-S         | 2.3 · Phân cực        | 2.6 · Đo C-V
       3.2 · Lực ảnh          | 3.4 · Ghim E_F        | 4.3 · Phát xạ nhiệt
       5.4 · So áp mở         | 5.5 · Chuyển mạch     | 6.3 · Ohmic tích lũy
       6.5 · Ohmic hầm        | 7.3 · Anderson        | 7.6 · Dị tiếp giáp nP
       7.8 · Khe n-N          | 8.2 · Giếng 2-DEG     | 8.4 · Transistor HEMT
   - API: LabB10.open(tabId?, panelIndex?, patch?)  LabB10.close()  LabB10.mark(root)
   ========================================================================== */
(function () {
'use strict';

/* ---------- hằng số vật lý & tiện ích ---------- */
const TAU2 = Math.PI * 2;
const E_CHG = 1.6e-19;          // C
const EPS0_CM = 8.85e-14;       // F/cm
const EPS0_M = 8.854e-12;       // F/m
const HBAR = 1.0546e-34;        // J·s
const M0 = 9.11e-31;            // kg
const KB = 8.617e-5;            // eV/K
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
  const r = sz || 6.5;
  rr(ctx, x - r, y - r, r * 2, r * 2, 3);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke();
  txt(ctx, sign, x, y + 0.5, col, Math.max(9, r * 1.55), 'center', 800);
}
function drawMeter(ctx, x, y, w, h, title, valText, frac, col, dangerFrac) {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = (dangerFrac != null && frac >= dangerFrac) ? C.err : C.sub;
  ctx.lineWidth = 1.5; ctx.stroke();
  txt(ctx, title, x + w / 2, y + 13, C.mut, 10.5, 'center', 700);
  const cx = x + w / 2, cy = y + h - 26, rad = Math.min(w * 0.40, h * 0.50);
  ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI * 1.15, Math.PI * 1.85);
  ctx.strokeStyle = C.g; ctx.lineWidth = 5.5; ctx.stroke();
  if (dangerFrac != null) {
    const aD = Math.PI * (1.15 + 0.7 * clamp(dangerFrac, 0, 1));
    ctx.beginPath(); ctx.arc(cx, cy, rad, aD, Math.PI * 1.85);
    ctx.strokeStyle = C.err; ctx.lineWidth = 5.5; ctx.stroke();
  }
  const f = clamp(frac, 0, 1);
  const ang = Math.PI * (1.15 + 0.7 * f);
  const ncol = (dangerFrac != null && f >= dangerFrac) ? C.err : (col || C.main);
  arr(ctx, cx, cy, cx + Math.cos(ang) * (rad - 5), cy + Math.sin(ang) * (rad - 5), ncol, 2.4);
  dot(ctx, cx, cy, 4, ncol);
  txt(ctx, valText, cx, y + h - 10, ncol, 11.8, 'center', 700);
}
function drawLock(ctx, x, y, locked, col) {
  ctx.save();
  ctx.strokeStyle = col; ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (locked) ctx.arc(x, y - 5, 6.5, Math.PI, 0);
  else ctx.arc(x - 3, y - 8, 6.5, Math.PI * 1.05, -0.2);
  ctx.stroke();
  rr(ctx, x - 9, y - 5, 18, 14, 3);
  ctx.fillStyle = locked ? col : C.card; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke();
  dot(ctx, x, y + 2, 2.2, locked ? C.bg : col);
  ctx.restore();
}

/* ---------- dữ liệu vật liệu & hàm tính vật lý Buổi 10 (Neamen Ch.9) ---------- */
const METALS = {
  Al: { name: 'Al', phi: 4.28 },
  Ti: { name: 'Ti', phi: 4.33 },
  W:  { name: 'W',  phi: 4.55 },
  Au: { name: 'Au', phi: 5.10 },
  Pt: { name: 'Pt', phi: 5.65 }
};
const SEMIS = {
  Si:     { name: 'Si',     chi: 4.01, Eg: 1.12, er: 11.7, Nc: 2.8e19,  Nv: 1.04e19, mn: 0.26, Astar: 120, phi0: 0.37 },
  GaAs:   { name: 'GaAs',   chi: 4.07, Eg: 1.42, er: 13.1, Nc: 4.7e17,  Nv: 7.0e18,  mn: 0.067, Astar: 8.16, phi0: 0.52 },
  Ge:     { name: 'Ge',     chi: 4.13, Eg: 0.66, er: 16.0, Nc: 1.04e19, Nv: 6.0e18,  mn: 0.12, Astar: 50,  phi0: 0.18 },
  AlAs:   { name: 'AlAs',   chi: 3.50, Eg: 2.16, er: 10.1, Nc: 1.5e19,  Nv: 1.8e19,  mn: 0.15, Astar: 18,  phi0: 0.70 },
  AlGaAs: { name: 'AlGaAs', chi: 3.74, Eg: 1.80, er: 12.2, Nc: 6.5e17,  Nv: 9.0e18,  mn: 0.092, Astar: 11, phi0: 0.65 },
  InAs:   { name: 'InAs',   chi: 4.90, Eg: 0.35, er: 15.1, Nc: 8.7e16,  Nv: 6.6e18,  mn: 0.023, Astar: 3,  phi0: 0.20 },
  GaSb:   { name: 'GaSb',   chi: 4.06, Eg: 0.73, er: 15.7, Nc: 2.1e17,  Nv: 1.8e19,  mn: 0.041, Astar: 5,  phi0: 0.30 }
};

function vtOf(T) { return 0.0259 * (T / 300); }

function schottkyCalc(phiM, scKey, Nd, T, Va) {
  const sc = SEMIS[scKey] || SEMIS.Si;
  const Vt = vtOf(T);
  const eps = sc.er * EPS0_CM;
  const phiN = Math.max(0.01, Vt * Math.log(Math.max(1.05, sc.Nc / Nd)));
  const phiS = sc.chi + phiN;
  const phiB0 = phiM - sc.chi;
  const Vbi = phiB0 - phiN; // = phiM - phiS
  const isRect = Vbi > 0.03;
  // Va > 0: thuận (hạ hàng rào Vbi - Va); Va < 0: ngược (tăng hàng rào Vbi + |Va|)
  const Veff = Math.max(0.02, Vbi - (Va || 0));
  const W = isRect ? Math.sqrt((2 * eps * Veff) / (E_CHG * Nd)) : 0;
  const Emax = isRect ? (E_CHG * Nd * W) / eps : 0;
  const Cp = W > 0 ? eps / W : Infinity;
  // Hiệu ứng lực ảnh
  const dPhi = Emax > 0 ? Math.sqrt((E_CHG * Emax) / (4 * Math.PI * eps)) : 0;
  const xm = Emax > 0 ? Math.sqrt(E_CHG / (16 * Math.PI * eps * Emax)) : 0;
  const phiBn = Math.max(0.05, phiB0 - dPhi);
  const JsT = sc.Astar * T * T * Math.exp(-phiBn / Vt);
  const J = JsT * (Math.exp(clamp((Va || 0) / Vt, -40, 35)) - 1);
  return { sc, Vt, eps, phiN, phiS, phiB0, Vbi, isRect, Veff, W, Emax, Cp, dPhi, xm, phiBn, JsT, J };
}

function tunnelE00(scKey, Nd_cm3) {
  const sc = SEMIS[scKey] || SEMIS.Si;
  const epsSI = sc.er * EPS0_M;
  const mStar = sc.mn * M0;
  const Nd_m3 = Nd_cm3 * 1e6;
  const E00_J = (E_CHG * HBAR / 2) * Math.sqrt(Nd_m3 / (epsSI * mStar));
  return E00_J / E_CHG; // eV
}

function heteroAlign(k1, k2) {
  const s1 = SEMIS[k1], s2 = SEMIS[k2];
  const Ec1 = -s1.chi, Ev1 = -(s1.chi + s1.Eg);
  const Ec2 = -s2.chi, Ev2 = -(s2.chi + s2.Eg);
  const dEc = Math.abs(Ec1 - Ec2);
  const dEv = Math.abs(Ev1 - Ev2);
  let kind = 'Straddling (bao trùm)';
  const overlapTop = Math.min(Ec1, Ec2);
  const overlapBot = Math.max(Ev1, Ev2);
  if (overlapTop <= overlapBot) kind = 'Broken gap (vùng cấm gãy)';
  else if (!((Ec1 <= Ec2 && Ev1 >= Ev2) || (Ec2 <= Ec1 && Ev2 >= Ev1))) kind = 'Staggered (so le)';
  return { s1, s2, Ec1, Ev1, Ec2, Ev2, dEc, dEv, kind };
}

function triWellLevel(mRatio, F_Vcm, n) {
  // E_n ≈ (hbar^2 / 2m*)^(1/3) * [1.5*pi * e * F * (n + 3/4)]^(2/3)
  const F_Vm = F_Vcm * 100;
  const t1 = Math.pow((HBAR * HBAR) / (2 * mRatio * M0), 1 / 3);
  const t2 = Math.pow(1.5 * Math.PI * E_CHG * F_Vm * (n + 0.75), 2 / 3);
  return (t1 * t2) / E_CHG; // eV
}

const LABS = [];

/* ==========================================================================
   1. MỤC 1.4 — GHÉP KIM LOẠI – BÁN DẪN: HÌNH THÀNH HÀNG RÀO SCHOTTKY
   ========================================================================== */
LABS.push({
  id: 'ms', tag: '1.4', name: 'Ghép M-S', sec: 1,
  S: { joined: 1, metal: 'Au', phiM: 5.10, sc: 'Si', Nd: 1e16 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Đặt kim loại cạnh bán dẫn n rồi ghép lại: electron tràn sang kim loại → lộ ion donor & dựng hàng rào',
      area: 'a', anim: true,
      ctrls: [
        { k: 'joined', seg: [[0, 'Tách rời M | n'], [1, 'Ghép M–S']] },
        { k: 'metal', seg: [['Al', 'Al'], ['W', 'W'], ['Au', 'Au'], ['Pt', 'Pt']], set: { Al: { phiM: 4.28 }, W: { phiM: 4.55 }, Au: { phiM: 5.10 }, Pt: { phiM: 5.65 } } },
        { k: 'phiM', l: 'φ_m', min: 3.9, max: 5.7, step: 0.02, f: v => v.toFixed(2) + ' V' },
        { k: 'sc', seg: [['Si', 'Si'], ['GaAs', 'GaAs'], ['Ge', 'Ge']] },
        { k: 'Nd', l: 'N_d', min: 15, max: 18, step: 0.1, log: 1, f: v => pw(v) }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const m = schottkyCalc(S.phiM, S.sc, S.Nd, 300, 0);
        const padX = 16, topY = 34, botY = H - 16, bh = botY - topY, bw = W - padX * 2;
        const midX = padX + bw * 0.42;

        if (st.prog == null) st.prog = S.joined ? 1 : 0;
        if (st.prevJ !== S.joined) { st.prevJ = S.joined; if (S.joined) st.prog = 0.02; }
        if (S.joined) st.prog = Math.min(1, st.prog + dt * 0.48);
        else st.prog = Math.max(0, st.prog - dt * 1.8);

        const gap = S.joined ? 0 : Math.min(34, bw * 0.08) * (1 - st.prog);
        const mL = padX, mR = midX - gap / 2, sL = midX + gap / 2, sR = padX + bw;

        rr(ctx, mL, topY, mR - mL, bh, 8);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = C.c1; ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.c1; ctx.lineWidth = 1.4; ctx.stroke();

        rr(ctx, sL, topY, sR - sL, bh, 8);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = C.c2; ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        const wVis = m.isRect
          ? clamp(bw * 0.36 * Math.sqrt(m.Vbi / 0.9) * Math.pow(1e16 / S.Nd, 0.28), 26, (sR - sL) * 0.72) * st.prog
          : 0;

        const eScale = bh * 0.36;
        const yF_s_sep = topY + bh * 0.35;
        const yF_m_sep = clamp(yF_s_sep + (S.phiM - m.phiS) * eScale * 0.65, topY + 26, botY - 26);
        const yF_eq = (yF_m_sep + yF_s_sep) * 0.5;
        const yFm = yF_m_sep + (yF_eq - yF_m_sep) * st.prog;
        const yFs = yF_s_sep + (yF_eq - yF_s_sep) * st.prog;

        if (st.prog > 0.05) {
          if (m.isRect) {
            ctx.save(); ctx.globalAlpha = 0.17; ctx.fillStyle = C.c4; ctx.fillRect(sL, topY + 1, wVis, bh - 2); ctx.restore();
            ln(ctx, sL + wVis, topY, sL + wVis, botY, C.c4, 1.4, [4, 4]);
            const rows = Math.max(4, Math.floor(bh / 26));
            for (let r = 0; r < rows; r++) txt(ctx, '−', mR - 7, topY + (r + 0.5) * (bh / rows), C.c5, 14, 'center', 800);
            const cols = Math.max(2, Math.round(wVis / 26));
            for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
              drawIon(ctx, sL + (c + 0.5) * (wVis / cols), topY + (r + 0.5) * (bh / rows), '+', C.c4, 5.8);
            }
            if (wVis > 28) {
              const ey = topY + bh * 0.5;
              arr(ctx, sL + wVis - 8, ey, sL + 8, ey, C.main, 3);
              chip(ctx, 'E nội (n → M)', sL + wVis * 0.5, ey - 18, C.main, 'center');
            }
          } else {
            ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = C.c2; ctx.fillRect(sL, topY + 1, 22 * st.prog, bh - 2); ctx.restore();
            chip(ctx, 'Lớp tích lũy e⁻ (Ohmic!)', sL + 10, topY + 24, C.c2, 'left');
          }
        }

        if (!st.me || st.W !== W) {
          st.W = W;
          st.me = Array.from({ length: 24 }, () => ({ u: rnd(0.06, 0.88), v: rnd(0.08, 0.92), ph: rnd(0, TAU2) }));
          st.se = Array.from({ length: 26 }, () => ({ u: rnd(0.06, 0.94), v: rnd(0.08, 0.92), vx: gauss() * 44, vy: gauss() * 44 }));
        }
        st.me.forEach(q => {
          const x = mL + q.u * (mR - mL - 12) + Math.sin(t * 4 + q.ph) * 3;
          const y = topY + q.v * bh + Math.cos(t * 3.6 + q.ph) * 3;
          dot(ctx, clamp(x, mL + 6, mR - 14), clamp(y, topY + 7, botY - 7), 4.2, C.c1);
        });

        const nStart = sL + wVis, nSpan = Math.max(16, sR - nStart);
        const flowing = S.joined && st.prog < 0.88;
        const nVisE = Math.round(10 + (Math.log10(S.Nd) - 15) * 5.2);
        st.se.forEach((e, i) => {
          if (i >= nVisE) return;
          if (Math.random() < dt * 3) { e.vx = gauss() * 48; e.vy = gauss() * 48; }
          const push = flowing ? (m.isRect ? -75 * (1 - st.prog) : 45 * (1 - st.prog)) : 0;
          let x = nStart + e.u * nSpan + (e.vx + push) * dt;
          let y = topY + e.v * bh + e.vy * dt;
          if (x < nStart + 7) { x = nStart + 7; e.vx = Math.abs(e.vx); }
          if (x > sR - 7) { x = sR - 7; e.vx = -Math.abs(e.vx); }
          if (y < topY + 8 || y > botY - 8) { e.vy = -e.vy; y = clamp(y, topY + 8, botY - 8); }
          e.u = clamp((x - nStart) / nSpan, 0.02, 0.98);
          e.v = clamp((y - topY) / bh, 0.05, 0.95);
          dot(ctx, x, y, 5.5, C.c2);
          txt(ctx, '−', x, y + 0.5, C.bg, 10, 'center', 800);
        });

        ln(ctx, mL + 4, yFm, mR - 4, yFm, C.main, 2, [6, 4]);
        ln(ctx, sL + 4, yFs, sR - 4, yFs, C.main, 2, [6, 4]);
        txt(ctx, 'E_Fm', mL + 8, yFm - 10, C.main, 10.5, 'left', 700);
        txt(ctx, 'E_Fs', sR - 8, yFs - 10, C.main, 10.5, 'right', 700);

        txt(ctx, 'Kim loại ' + S.metal + ' (φ_m=' + S.phiM.toFixed(2) + 'V)', mL + 4, 15, C.c1, 11.5, 'left', 700);
        txt(ctx, S.sc + ' loại n (φ_s=' + m.phiS.toFixed(2) + 'V)', sR - 4, 15, C.c2, 11.5, 'right', 700);
        txt(ctx, !S.joined ? 'Chưa tiếp xúc' : (m.isRect ? (st.prog >= 0.99 ? 'Hàng rào Schottky cân bằng' : 'Electron tràn sang kim loại...') : 'φ_m ≤ φ_s: Không có hàng rào (Ohmic)'),
          midX, 15, m.isRect ? C.main : C.c2, 11.5, 'center', 700);
      }
    },
    {
      title: 'Hai bậc thềm thế năng: φ_B0 = φ_m − χ (độc lập N_d) và V_bi = φ_B0 − φ_n (phụ thuộc N_d)',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, m = schottkyCalc(S.phiM, S.sc, S.Nd, 300, 0);
        const pad = 16, bw = W - pad * 2, y1 = H * 0.28, y2 = H * 0.62, bh = 20, maxV = 1.8;

        const w1 = bw * clamp(Math.max(0, m.phiB0) / maxV, 0, 1);
        txt(ctx, 'Từ Kim loại → Bán dẫn:  φ_B0 = φ_m − χ = ' + m.phiB0.toFixed(3) + ' V  (KHÔNG đổi theo N_d)', pad, y1 - 12, C.c5, 11.5, 'left', 700);
        rr(ctx, pad, y1, bw, bh, 6); ctx.fillStyle = C.tint; ctx.fill();
        if (w1 > 2) { rr(ctx, pad, y1, w1, bh, 6); ctx.fillStyle = C.c5; ctx.fill(); }

        const w2 = bw * clamp(Math.max(0, m.Vbi) / maxV, 0, 1);
        const wPn = bw * clamp(m.phiN / maxV, 0, 1);
        txt(ctx, 'Từ Bán dẫn → Kim loại:  V_bi = φ_B0 − φ_n = ' + m.Vbi.toFixed(3) + ' V   (φ_n = ' + m.phiN.toFixed(3) + ' V)', pad, y2 - 12, m.isRect ? C.main : C.c2, 11.5, 'left', 700);
        rr(ctx, pad, y2, bw, bh, 6); ctx.fillStyle = C.tint; ctx.fill();
        if (m.isRect) {
          rr(ctx, pad, y2, w2, bh, 6); ctx.fillStyle = C.main; ctx.fill();
          if (w2 + wPn <= bw) {
            ctx.save(); ctx.globalAlpha = 0.45; rr(ctx, pad + w2, y2, wPn, bh, 4); ctx.fillStyle = C.c2; ctx.fill(); ctx.restore();
            txt(ctx, 'φ_n', pad + w2 + wPn / 2, y2 + bh / 2, C.ink, 10, 'center', 700);
          }
        } else {
          txt(ctx, 'φ_m ≤ φ_s → KHÔNG còn rào chắn (Ohmic!)', W / 2, y2 + bh / 2, C.c2, 11.5, 'center', 700);
        }
        txt(ctx, 'W(0V) = ' + (m.isRect ? fmtLen(m.W) : '0 (tích lũy)'), pad, H - 10, C.mut, 11, 'left', 600);
        txt(ctx, 'Ví dụ 1.1: Au/Si, N_d=10¹⁶ → φ_B0=1.09 V, V_bi=0.884 V', W - pad, H - 10, C.mut, 10.5, 'right', 600);
      }
    }
  ]
});

/* ==========================================================================
   2. MỤC 2.3 — PHÂN CỰC THUẬN & NGƯỢC: HÀNG RÀO, VÙNG NGHÈO & DÒNG ELECTRON
   ========================================================================== */
LABS.push({
  id: 'bias', tag: '2.3', name: 'Phân cực', sec: 2,
  S: { Va: -5.0, metal: 'Au', sc: 'Si', Nd: 1e16 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Kéo áp V từ Ngược (−) sang Thuận (+): rào bên bán dẫn lên/xuống, còn φ_B0 bên kim loại đứng yên!',
      area: 'a', anim: true,
      ctrls: [
        { k: 'Va', l: 'Áp V', min: -8, max: 0.65, step: 0.05, f: v => (v < 0 ? 'Ngược ' + (-v).toFixed(2) : v > 0 ? 'Thuận +' + v.toFixed(2) : '0.00') + ' V' },
        { k: 'metal', seg: [['W', 'W'], ['Au', 'Au'], ['Pt', 'Pt']] },
        { k: 'sc', seg: [['Si', 'Si'], ['GaAs', 'GaAs']] },
        { k: 'Nd', l: 'N_d', min: 15, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { btn: 'Ví dụ 2.1 (V_R=5V)', fn: p => { p.S.metal = 'Au'; p.S.sc = 'Si'; p.S.Nd = 1e16; p.S.Va = -5; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const phiM = METALS[S.metal].phi;
        const m = schottkyCalc(phiM, S.sc, S.Nd, 300, S.Va);
        const mMax = schottkyCalc(phiM, S.sc, S.Nd, 300, -8);

        const targetFrac = clamp(m.W / Math.max(1e-7, mMax.W), 0.07, 1);
        if (st.wFrac == null) st.wFrac = targetFrac;
        st.wFrac += (targetFrac - st.wFrac) * Math.min(1, dt * 9);

        const bx = 34, by = 36, bw = W - 68, bh = Math.min(144, H * 0.48);
        const mW = bw * 0.24, xJ = bx + mW, sW = bw - mW;
        const depPx = sW * 0.72 * st.wFrac, xEdge = xJ + depPx;

        // Dây nối nguồn pin phía dưới
        const wy = by + bh + Math.min(48, (H - by - bh) * 0.56), px = bx + bw / 2;
        ln(ctx, bx, by + bh / 2, bx - 16, by + bh / 2, C.sub, 2.5);
        ln(ctx, bx - 16, by + bh / 2, bx - 16, wy, C.sub, 2.5);
        ln(ctx, bx - 16, wy, px - 18, wy, C.sub, 2.5);
        ln(ctx, bx + bw, by + bh / 2, bx + bw + 16, by + bh / 2, C.sub, 2.5);
        ln(ctx, bx + bw + 16, by + bh / 2, bx + bw + 16, wy, C.sub, 2.5);
        ln(ctx, bx + bw + 16, wy, px + 18, wy, C.sub, 2.5);

        const isFwd = S.Va > 0.02, isRev = S.Va < -0.02;
        if (isFwd) {
          ln(ctx, px - 18, wy - 16, px - 18, wy + 16, C.c4, 2.6);
          ln(ctx, px + 18, wy - 9, px + 18, wy + 9, C.c2, 4.5);
          txt(ctx, '+', px - 30, wy - 11, C.c4, 14, 'center', 800);
          txt(ctx, '−', px + 30, wy - 11, C.c2, 14, 'center', 800);
        } else {
          ln(ctx, px - 18, wy - 9, px - 18, wy + 9, C.c2, 4.5);
          ln(ctx, px + 18, wy - 16, px + 18, wy + 16, C.c4, 2.6);
          txt(ctx, '−', px - 30, wy - 11, C.c2, 14, 'center', 800);
          txt(ctx, '+', px + 30, wy - 11, C.c4, 14, 'center', 800);
        }
        chip(ctx, isFwd ? ('THUẬN: rào bán dẫn hạ còn V_bi − V_a = ' + m.Veff.toFixed(2) + ' V')
          : isRev ? ('NGƯỢC: rào bán dẫn dâng lên V_bi + V_R = ' + m.Veff.toFixed(2) + ' V')
          : ('Cân bằng 0V: rào bán dẫn = V_bi = ' + m.Vbi.toFixed(2) + ' V'),
          px, wy + 22, isFwd ? C.c2 : isRev ? C.c5 : C.main, 'center');

        rr(ctx, bx, by, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.save(); rr(ctx, bx, by, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.22; ctx.fillStyle = C.c1; ctx.fillRect(bx, by, mW, bh);
        ctx.globalAlpha = 0.18; ctx.fillStyle = C.c4; ctx.fillRect(xJ, by, depPx, bh);
        ctx.globalAlpha = 0.10; ctx.fillStyle = C.c2; ctx.fillRect(xEdge, by, bx + bw - xEdge, bh);
        ctx.restore();
        ln(ctx, xJ, by, xJ, by + bh, C.ink, 2);
        ln(ctx, xEdge, by, xEdge, by + bh, C.main, 2.2, [4, 3]);

        const rows = Math.max(3, Math.floor(bh / 28)), cols = Math.max(1, Math.round(depPx / 24));
        for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
          drawIon(ctx, xJ + (c + 0.5) * (depPx / cols), by + (r + 0.5) * (bh / rows), '+', C.c4, 5.2);
        }
        for (let r = 0; r < rows; r++) txt(ctx, '−', xJ - 8, by + (r + 0.5) * (bh / rows), C.c5, 13, 'center', 800);

        if (!st.es || st.W !== W) {
          st.W = W;
          st.es = Array.from({ length: 26 }, () => ({ x: rnd(xEdge, bx + bw - 8), y: rnd(by + 10, by + bh - 10), vx: gauss() * 35, vy: gauss() * 35 }));
        }
        const fwdBurst = isFwd ? clamp(Math.pow(S.Va / Math.max(0.25, m.Vbi * 0.72), 2.4), 0, 1) : 0;
        st.es.forEach((e, i) => {
          if (Math.random() < dt * 3) { e.vx = gauss() * 38; e.vy = gauss() * 38; }
          if (fwdBurst > 0.08 && i < Math.round(4 + fwdBurst * 22)) {
            e.x -= (75 + 220 * fwdBurst) * dt;
            e.y = clamp(e.y + e.vy * dt * 0.4, by + 9, by + bh - 9);
            if (e.x < bx + 8) e.x = bx + bw - 8;
          } else {
            e.x += e.vx * dt; e.y += e.vy * dt;
            if (e.x < xEdge + 7) { e.x = xEdge + 7; e.vx = Math.abs(e.vx); }
            if (e.x > bx + bw - 7) { e.x = bx + bw - 7; e.vx = -Math.abs(e.vx); }
            if (e.y < by + 8 || e.y > by + bh - 8) { e.vy = -e.vy; e.y = clamp(e.y, by + 8, by + bh - 8); }
          }
          dot(ctx, e.x, e.y, 5, C.c2);
          txt(ctx, '−', e.x, e.y + 0.5, C.bg, 9.5, 'center', 800);
        });

        if (fwdBurst > 0.15) {
          arr(ctx, xEdge + 16, by + bh * 0.5, xJ - 18, by + bh * 0.5, C.c2, 3.2);
          chip(ctx, 'J_{s→m} áp đảo (electron n → M)', (xJ + xEdge) / 2, by + bh * 0.5 - 18, C.c2, 'center');
        } else if (depPx > 32) {
          arr(ctx, xEdge - 8, by + bh * 0.5, xJ + 8, by + bh * 0.5, C.main, 2.4 + Math.max(0, -S.Va) * 0.2);
        }

        txt(ctx, 'Kim loại ' + S.metal, bx + mW / 2, by + 14, C.c1, 11.5, 'center', 700);
        txt(ctx, 'φ_B0=' + m.phiB0.toFixed(2) + 'V (cố định)', bx + mW / 2, by + bh - 12, C.mut, 9.5, 'center', 600);
        txt(ctx, 'W = ' + fmtLen(m.W) + ' · |E_max| = ' + sci(m.Emax, 2) + ' V/cm', xJ + depPx / 2, by - 14, C.main, 11.5, 'center', 700);
        txt(ctx, S.sc + ' trung hòa', bx + bw - 4, by - 14, C.c2, 11, 'right', 700);
        void t;
      }
    },
    {
      title: 'Cân bằng hai chiều phát xạ J_{s→m} vs J_{m→s} & Đồng hồ vùng nghèo W, |E_max|',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, phiM = METALS[S.metal].phi;
        const m = schottkyCalc(phiM, S.sc, S.Nd, 300, S.Va);
        const mMax = schottkyCalc(phiM, S.sc, S.Nd, 300, -8);

        const pad = 10, gap = 10, lw = (W - pad * 2 - gap * 2) * 0.40, mw = (W - pad * 2 - gap * 2 - lw) / 2, mh = H - pad * 2;
        // Hộp trái: hai mũi tên đối kháng J_{s->m} và J_{m->s}
        rr(ctx, pad, pad, lw, mh, 10); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
        txt(ctx, 'Hai luồng electron đối nghịch', pad + lw / 2, pad + 15, C.mut, 10.5, 'center', 700);
        const bx = pad + 10, bw = lw - 20;
        const fSM = S.Va > 0 ? clamp(0.28 + (S.Va / 0.65) * 0.72, 0.28, 1) : clamp(0.28 * Math.exp(S.Va * 0.9), 0.03, 0.28);
        const fMS = 0.28; // cố định vì φ_B0 không đổi theo điện áp!
        const y1 = pad + mh * 0.45, y2 = pad + mh * 0.78;
        txt(ctx, 'J_{s→m} (thay đổi mạnh theo V)', bx, y1 - 10, C.c2, 10, 'left', 700);
        rr(ctx, bx, y1, bw, 11, 5); ctx.fillStyle = C.tint; ctx.fill();
        rr(ctx, bx, y1, bw * fSM, 11, 5); ctx.fillStyle = C.c2; ctx.fill();

        txt(ctx, 'J_{m→s} (cố định, chỉ phụ thuộc φ_B0)', bx, y2 - 10, C.c5, 10, 'left', 700);
        rr(ctx, bx, y2, bw, 11, 5); ctx.fillStyle = C.tint; ctx.fill();
        rr(ctx, bx, y2, bw * fMS, 11, 5); ctx.fillStyle = C.c5; ctx.fill();

        // Hai đồng hồ kim W và |E_max|
        drawMeter(ctx, pad + lw + gap, pad, mw, mh, 'Bề rộng vùng nghèo W', fmtLen(m.W), m.W / Math.max(1e-7, mMax.W), C.main);
        drawMeter(ctx, pad + lw + gap * 2 + mw, pad, mw, mh, 'Điện trường |E_max|', sci(m.Emax, 2) + ' V/cm', m.Emax / Math.max(1, mMax.Emax), C.c1);
      }
    }
  ]
});

/* ==========================================================================
   3. MỤC 2.6 — ĐO C-V TIẾP XÚC SCHOTTKY: PÍT-TÔNG xₙ & MÁY LCR GIẢI MÃ
   ========================================================================== */
LABS.push({
  id: 'cv', tag: '2.6', name: 'Đo C-V', sec: 2,
  S: { sample: 'AuSi', metal: 'Au', sc: 'Si', Nd: 1e16, VR: 5.0 },
  cols: '1.5fr 1fr', rows: '1.45fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Bàn đo C-V Schottky: vặn V_R làm pít-tông biên W quét qua các lớp donor + lớp rung AC ±dQ\'',
      area: 'a', anim: true,
      ctrls: [
        {
          k: 'sample',
          seg: [['AuSi', 'Au/Si (VD 2.1)'], ['WSi', 'W/Si'], ['WGaAs', 'W/GaAs']],
          set: {
            AuSi:  { metal: 'Au', sc: 'Si',   Nd: 1e16,  VR: 5.0 },
            WSi:   { metal: 'W',  sc: 'Si',   Nd: 3e15,  VR: 4.0 },
            WGaAs: { metal: 'W',  sc: 'GaAs', Nd: 8e15,  VR: 4.0 }
          }
        },
        { k: 'VR', l: 'Vặn V_R', min: 0, max: 12, step: 0.2, f: v => v.toFixed(1) + ' V' },
        { k: 'Nd', l: 'N_d thật', min: 14.8, max: 17.0, step: 0.05, log: 1, f: v => pw(v) }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const phiM = METALS[S.metal].phi;
        const m = schottkyCalc(phiM, S.sc, S.Nd, 300, -S.VR);

        const padX = 18, topY = 36, botY = H - 22, bh = botY - topY, bw = W - padX * 2;
        const mW = bw * 0.17, xJ = padX + mW, sAreaW = bw - mW;

        const maxVisCm = 3.0e-4; // 3 µm
        const targetPx = sAreaW * clamp(m.W / maxVisCm, 0.06, 0.94);
        if (st.wPx == null) st.wPx = targetPx;
        st.wPx += (targetPx - st.wPx) * Math.min(1, dt * 9);
        const xEdge = xJ + st.wPx;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.28; ctx.fillStyle = C.c1; ctx.fillRect(padX, topY, mW, bh);
        ctx.globalAlpha = 0.18; ctx.fillStyle = C.main; ctx.fillRect(xJ, topY, st.wPx, bh);
        ctx.globalAlpha = 0.10; ctx.fillStyle = C.c2; ctx.fillRect(xEdge, topY, padX + bw - xEdge, bh);
        // Dải rung AC thăm dò dV_R nhỏ làm lộ ±dQ' ngay tại biên xEdge!
        const osc = Math.sin(t * 6.5) * 6;
        ctx.globalAlpha = 0.38; ctx.fillStyle = C.c3; ctx.fillRect(xEdge - 3, topY, osc + 6, bh);
        ctx.restore();

        ln(ctx, xJ, topY, xJ, botY, C.ink, 2);
        ln(ctx, xEdge, topY, xEdge, botY, C.main, 3);

        const seedKey = Math.round(Math.log10(S.Nd) * 20);
        if (!st.donors || st.seedKey !== seedKey || st.W !== W) {
          st.seedKey = seedKey; st.W = W;
          const cnt = Math.round(24 + (Math.log10(S.Nd) - 14.8) * 34);
          st.donors = Array.from({ length: cnt }, (_, i) => {
            const cols = Math.ceil(Math.sqrt(cnt * 2.2)), rows = Math.ceil(cnt / cols);
            const c = i % cols, r = Math.floor(i / cols);
            return { u: clamp((c + 0.5 + rnd(-0.3, 0.3)) / cols, 0.03, 0.97), v: clamp((r + 0.5 + rnd(-0.3, 0.3)) / rows, 0.08, 0.92) };
          });
        }
        st.donors.forEach(d => {
          const x = xJ + d.u * sAreaW, y = topY + d.v * bh;
          if (x < xEdge - 3) drawIon(ctx, x, y, '+', C.c4, 5.2);
          else dot(ctx, x, y, 4.1, C.c2);
        });

        txt(ctx, S.metal, padX + mW / 2, topY + bh * 0.42, C.c1, 16, 'center', 800);
        txt(ctx, 'Kim loại', padX + mW / 2, topY + bh * 0.64, C.mut, 10, 'center', 600);
        txt(ctx, '−dQ\'', xJ - 14, topY + 14, C.c5, 10.5, 'center', 700);
        txt(ctx, '+dQ\'', xEdge + 18, topY + 14, C.c3, 10.5, 'center', 700);

        txt(ctx, 'Khe tụ vùng nghèo W = ' + fmtLen(m.W), xJ + st.wPx / 2, topY - 14, C.main, 11.5, 'center', 700);
        txt(ctx, S.sc + ' trung hòa', padX + bw - 6, topY - 14, C.c2, 11.5, 'right', 700);
        txt(ctx, 'Máy LCR đặt tín hiệu AC nhỏ dV_R đo C\' = dQ\'/dV_R = ε_s/W để giải mã ngược N_d, V_bi và φ_Bn', W / 2, botY + 12, C.mut, 10.8, 'center', 600);
      }
    },
    {
      title: 'Màn hình máy đo LCR số: từ C\' tại 0V và V_R trích xuất N_d, V_bi và chiều cao hàng rào φ_Bn',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, phiM = METALS[S.metal].phi;
        const m0 = schottkyCalc(phiM, S.sc, S.Nd, 300, 0);
        const VRref = Math.max(1, S.VR);
        const m1 = schottkyCalc(phiM, S.sc, S.Nd, 300, -VRref);
        const mNow = schottkyCalc(phiM, S.sc, S.Nd, 300, -S.VR);

        const inv0 = 1 / (m0.Cp * m0.Cp), inv1 = 1 / (m1.Cp * m1.Cp);
        const slope = (inv1 - inv0) / VRref;
        const NdMeas = 2 / (E_CHG * m0.eps * slope);
        const VbiMeas = inv0 / slope;
        const phiBnMeas = VbiMeas + m0.phiN;

        const pad = 12, gap = 10, cw = (W - pad * 2 - gap * 2) / 3, ch = H - pad * 2;
        const cards = [
          { t: 'Số đọc LCR tại V_R=' + S.VR.toFixed(1) + 'V', v: (mNow.Cp * 1e9).toFixed(2) + ' nF/cm²', sub: 'W = ε_s/C\' = ' + fmtLen(mNow.W), col: C.c2 },
          { t: 'Giải mã N_d từ độ dốc 1/C\'²', v: 'N_d = ' + sci(NdMeas, 2), sub: 'Độ dốc = ' + sci(slope, 2), col: C.main },
          { t: 'Ngoại suy −V_bi → Hàng rào', v: 'φ_Bn = ' + phiBnMeas.toFixed(3) + ' V', sub: 'V_bi=' + VbiMeas.toFixed(3) + ' + φ_n=' + m0.phiN.toFixed(3), col: C.c5 }
        ];
        cards.forEach((c, i) => {
          const x = pad + i * (cw + gap);
          rr(ctx, x, pad, cw, ch, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = i === 2 ? C.c5 : (i === 1 ? C.main : C.g); ctx.lineWidth = i ? 1.5 : 1; ctx.stroke();
          txt(ctx, c.t, x + cw / 2, pad + 18, C.mut, 10.2, 'center', 600);
          txt(ctx, c.v, x + cw / 2, pad + ch * 0.50, c.col, 13, 'center', 800);
          txt(ctx, c.sub, x + cw / 2, pad + ch - 16, C.ink, 10.2, 'center', 600);
        });
      }
    }
  ]
});

/* ==========================================================================
   4. MỤC 3.2 — HẠ THẤP HÀNG RÀO DO LỰC ẢNH (HIỆU ỨNG SCHOTTKY)
   ========================================================================== */
LABS.push({
  id: 'image', tag: '3.2', name: 'Lực ảnh', sec: 3,
  S: { E: 1e5, sc: 'Si' },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Gương lực ảnh: electron −e hút ảnh ảo +e trong kim loại → đỉnh hàng rào bo tròn và tụt xuống Δφ tại x_m',
      area: 'a', anim: true,
      ctrls: [
        { k: 'E', l: 'Điện trường E', min: 4, max: 6.2, step: 0.05, log: 1, f: v => sci(v, 1) + ' V/cm' },
        { k: 'sc', seg: [['Si', 'Si (ε_r=11.7)'], ['GaAs', 'GaAs (ε_r=13.1)'], ['Ge', 'Ge (ε_r=16)']] },
        { btn: 'Ví dụ 3.1 (E=10⁵)', fn: p => { p.S.sc = 'Si'; p.S.E = 1e5; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, sc = SEMIS[S.sc], eps = sc.er * EPS0_CM;
        const xmNm = Math.sqrt(E_CHG / (16 * Math.PI * eps * S.E)) * 1e7;
        const dPhi = Math.sqrt((E_CHG * S.E) / (4 * Math.PI * eps));

        const padX = 16, topY = 30, botY = H - 18, bh = botY - topY;
        const mirrorX = padX + (W - padX * 2) * 0.34;
        const rightX = W - padX, leftX = padX;

        rr(ctx, leftX, topY, mirrorX - leftX, bh, 8);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.c1; ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.c1; ctx.lineWidth = 1.5; ctx.stroke();

        rr(ctx, mirrorX, topY, rightX - mirrorX, bh, 8);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
        ln(ctx, mirrorX, topY - 4, mirrorX, botY + 4, C.ink, 2.6);

        // Ngọn đồi thế năng vật lý (không có trục tọa độ)
        const yIdealTop = topY + bh * 0.22;
        const pxPerNm = (rightX - mirrorX - 24) / 6.0;
        const dPhiPx = clamp(dPhi * bh * 2.1, 8, bh * 0.45);
        const xmPx = clamp(xmNm * pxPerNm, 18, (rightX - mirrorX) * 0.62);

        ln(ctx, mirrorX, yIdealTop, rightX - 10, yIdealTop + bh * 0.36, C.mut, 1.5, [5, 4]);
        ctx.beginPath();
        for (let i = 1; i <= 60; i++) {
          const dx = 4 + (i / 60) * (rightX - mirrorX - 14);
          const drop = (dPhiPx * 0.5) * (xmPx / dx + dx / xmPx);
          const y = clamp(yIdealTop + drop, yIdealTop, botY - 4);
          i === 1 ? ctx.moveTo(mirrorX + dx, y) : ctx.lineTo(mirrorX + dx, y);
        }
        ctx.strokeStyle = C.main; ctx.lineWidth = 3; ctx.stroke();

        const peakX = mirrorX + xmPx, peakY = yIdealTop + dPhiPx;
        dot(ctx, peakX, peakY, 4.5, C.main);
        ln(ctx, mirrorX, yIdealTop, peakX + 12, yIdealTop, C.mut, 1, [3, 3]);
        arr(ctx, peakX, yIdealTop, peakX, peakY - 4, C.err, 2.2);
        chip(ctx, 'Tụt đỉnh Δφ = ' + (dPhi * 1000).toFixed(1) + ' mV', peakX + 10, (yIdealTop + peakY) / 2, C.err, 'left');

        // Electron thật & ảnh gương +e dao động đối xứng
        const oscDist = clamp(xmPx + Math.sin(t * 2.2) * Math.min(xmPx * 0.55, 36), 16, Math.min(mirrorX - leftX - 18, rightX - mirrorX - 24));
        const eX = mirrorX + oscDist, imgX = mirrorX - oscDist, eY = botY - bh * 0.20;

        ln(ctx, imgX, eY, eX, eY, C.c4, 1.6, [4, 3]);
        arr(ctx, eX - 8, eY, eX - 30, eY, C.c4, 2.4);
        arr(ctx, eX + 8, eY, eX + 18 + (Math.log10(S.E) - 4) * 16, eY, C.c2, 2.4);

        ctx.save(); ctx.globalAlpha = 0.72;
        ctx.beginPath(); ctx.arc(imgX, eY, 7.5, 0, TAU2);
        ctx.fillStyle = C.c4; ctx.fill();
        ctx.setLineDash([2, 2]); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.stroke();
        txt(ctx, '+e', imgX, eY + 0.5, C.bg, 9.5, 'center', 800);
        ctx.restore();
        txt(ctx, 'Ảnh gương (−x)', imgX, eY + 18, C.c4, 10, 'center', 700);

        dot(ctx, eX, eY, 7.5, C.c2);
        txt(ctx, '−e', eX, eY + 0.5, C.bg, 9.5, 'center', 800);
        txt(ctx, 'Electron (+x)', eX, eY + 18, C.c2, 10, 'center', 700);

        txt(ctx, 'Mặt gương kim loại', (leftX + mirrorX) / 2, 15, C.c1, 11.5, 'center', 700);
        txt(ctx, 'Đỉnh rào tại x_m = ' + xmNm.toFixed(2) + ' nm  ·  Δφ = 2·E·x_m', (mirrorX + rightX) / 2, 15, C.main, 11.5, 'center', 700);
      }
    },
    {
      title: 'Đồng hồ đo vị trí đỉnh x_m & Hệ số tăng dòng rò ngược exp(eΔφ/kT)',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, sc = SEMIS[S.sc], eps = sc.er * EPS0_CM;
        const xmNm = Math.sqrt(E_CHG / (16 * Math.PI * eps * S.E)) * 1e7;
        const dPhi = Math.sqrt((E_CHG * S.E) / (4 * Math.PI * eps));
        const boost = Math.exp(dPhi / 0.0259);

        const pad = 12, gap = 10, mw = (W - pad * 2 - gap) / 2, mh = H - pad * 2;
        drawMeter(ctx, pad, pad, mw, mh, 'Vị trí đỉnh hàng rào x_m',
          xmNm.toFixed(2) + ' nm (càng sát mặt khi E lớn)', clamp(1 - xmNm / 6, 0, 1), C.c2);
        drawMeter(ctx, pad + mw + gap, pad, mw, mh, 'Dòng rò ngược tăng gấp',
          '×' + (boost >= 100 ? boost.toFixed(0) : boost.toFixed(1)) + ' lần (Δφ=' + (dPhi * 1000).toFixed(1) + ' mV)',
          clamp(Math.log10(boost) / 2.6, 0, 1), C.err, 0.7);
      }
    }
  ]
});

/* ==========================================================================
   5. MỤC 3.4 — GHIM MỨC FERMI: TRẠNG THÁI BỀ MẶT D_it & 4 KIM LOẠI CÙNG LÚC
   ========================================================================== */
LABS.push({
  id: 'pin', tag: '3.4', name: 'Ghim E_F', sec: 3,
  S: { sc: 'GaAs', Dit: 0.80, metal: 'Au' },
  cols: '1.5fr 1fr', rows: '1.45fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Lớp bẫy bề mặt D_it như "bọt biển điện tích" khóa chặt hàng rào dù thay kim loại khác nhau',
      area: 'a',
      ctrls: [
        { k: 'Dit', l: 'Bẫy bề mặt D_it', min: 0, max: 1, step: 0.05, f: v => v < 0.05 ? 'Sạch (0)' : v > 0.9 ? 'Ghim cứng!' : Math.round(v * 100) + '%' },
        { k: 'metal', seg: [['Al', 'Al (4.28V)'], ['W', 'W (4.55V)'], ['Au', 'Au (5.10V)'], ['Pt', 'Pt (5.65V)']] },
        { k: 'sc', seg: [['Si', 'Si'], ['GaAs', 'GaAs (dễ ghim)']] }
      ],
      draw(p, ctx, W, H) {
        const S = p.S, sc = SEMIS[S.sc];
        const phiM = METALS[S.metal].phi;
        const phiIdeal = clamp(phiM - sc.chi, 0.06, sc.Eg - 0.04);
        const phiPinned = sc.Eg - sc.phi0;
        const phiAct = (1 - S.Dit) * phiIdeal + S.Dit * phiPinned;

        const padX = 16, topY = 30, botY = H - 16, bw = W - padX * 2, bh = botY - topY;
        const trapW = 36, ifaceX = padX + bw * 0.34;

        // Khối kim loại trái
        rr(ctx, padX, topY, ifaceX - padX - trapW / 2, bh, 8);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = C.c1; ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.c1; ctx.lineWidth = 1.4; ctx.stroke();
        txt(ctx, 'Kim loại ' + S.metal, padX + (ifaceX - padX - trapW / 2) / 2, topY + bh * 0.42, C.c1, 14, 'center', 800);
        txt(ctx, 'φ_m = ' + phiM.toFixed(2) + ' V', padX + (ifaceX - padX - trapW / 2) / 2, topY + bh * 0.62, C.mut, 11.5, 'center', 600);

        // Lớp bẫy oxit/trạng thái bề mặt giữa
        rr(ctx, ifaceX - trapW / 2, topY, trapW, bh, 6);
        ctx.fillStyle = C.tint; ctx.fill();
        ctx.strokeStyle = S.Dit > 0.65 ? C.err : C.g; ctx.lineWidth = S.Dit > 0.65 ? 2 : 1.2; ctx.stroke();
        const nTraps = Math.round(S.Dit * 10);
        for (let i = 0; i < nTraps; i++) {
          const ty = topY + 14 + (i + 0.5) * ((bh - 28) / Math.max(1, nTraps));
          ln(ctx, ifaceX - 10, ty, ifaceX + 10, ty, C.err, 2.2);
          dot(ctx, ifaceX + (i % 2 ? 4 : -4), ty, 2.6, C.main);
        }
        txt(ctx, 'Bẫy D_it', ifaceX, topY - 12, S.Dit > 0.65 ? C.err : C.mut, 10.5, 'center', 700);

        // Khối bán dẫn phải: hiển thị chiều cao tường rào thật φ_Bn và ổ khóa ghim mức Fermi!
        const sx = ifaceX + trapW / 2 + 8, sw = padX + bw - sx;
        rr(ctx, sx, topY, sw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        const barX = sx + 16, barW = sw - 82, barH = 22;
        const y1 = topY + bh * 0.32, y2 = topY + bh * 0.68;

        txt(ctx, 'Nếu mặt sạch (φ_m − χ) = ' + phiIdeal.toFixed(2) + ' V', barX, y1 - 13, C.mut, 11, 'left', 600);
        rr(ctx, barX, y1, barW, barH, 6); ctx.fillStyle = C.tint; ctx.fill();
        rr(ctx, barX, y1, barW * clamp(phiIdeal / 1.7, 0.04, 1), barH, 6); ctx.fillStyle = C.c2; ctx.fill();

        txt(ctx, 'Thực tế đo được φ_Bn = ' + phiAct.toFixed(2) + ' V', barX, y2 - 13, S.Dit > 0.65 ? C.err : C.main, 12, 'left', 700);
        rr(ctx, barX, y2, barW, barH, 6); ctx.fillStyle = C.tint; ctx.fill();
        rr(ctx, barX, y2, barW * clamp(phiAct / 1.7, 0.04, 1), barH, 6); ctx.fillStyle = S.Dit > 0.65 ? C.err : C.main; ctx.fill();

        // Ổ khóa ghim mức Fermi
        const lx = sx + sw - 34, ly = topY + bh * 0.50;
        drawLock(ctx, lx, ly, S.Dit > 0.65, S.Dit > 0.65 ? C.err : C.c2);
        txt(ctx, S.Dit > 0.65 ? 'ĐÃ GHIM' : 'Tự do', lx, ly + 24, S.Dit > 0.65 ? C.err : C.c2, 10.5, 'center', 700);
        txt(ctx, 'Mức ghim (E_g − eφ₀)/e = ' + phiPinned.toFixed(2) + ' V (' + S.sc + ')', sx + sw / 2, 15, C.ink, 11.5, 'center', 700);
      }
    },
    {
      title: 'Đặt 4 mẫu Al · W · Au · Pt cạnh nhau: kéo D_it lên 100% xem 4 hàng rào bị kéo bằng phẳng tăm tắp!',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, sc = SEMIS[S.sc], phiPinned = sc.Eg - sc.phi0;
        const keys = ['Al', 'W', 'Au', 'Pt'];
        const pad = 14, gap = 10, cw = (W - pad * 2 - gap * 3) / 4;
        const topY = 18, botY = H - 22, maxH = botY - topY - 14;

        keys.forEach((k, i) => {
          const x = pad + i * (cw + gap);
          const phiId = clamp(METALS[k].phi - sc.chi, 0.06, sc.Eg - 0.04);
          const phiAc = (1 - S.Dit) * phiId + S.Dit * phiPinned;
          const hPx = maxH * clamp(phiAc / 1.6, 0.08, 1);
          const active = k === S.metal;

          rr(ctx, x, topY, cw, botY - topY, 7); ctx.fillStyle = C.card; ctx.fill();
          ctx.strokeStyle = active ? C.main : C.g; ctx.lineWidth = active ? 1.8 : 1; ctx.stroke();

          rr(ctx, x + 8, botY - hPx - 4, cw - 16, hPx, 5);
          ctx.fillStyle = S.Dit > 0.65 ? C.err : (active ? C.main : C.c2); ctx.fill();
          txt(ctx, phiAc.toFixed(2) + ' V', x + cw / 2, botY - hPx - 14, C.ink, 11, 'center', 700);
          txt(ctx, k + ' (' + METALS[k].phi.toFixed(2) + ')', x + cw / 2, botY + 12, active ? C.main : C.mut, 10.5, 'center', 700);
        });
      }
    }
  ]
});

/* ==========================================================================
   6. MỤC 4.3 — PHÁT XẠ NHIỆT ĐIỆN TỬ ĐIỐT SCHOTTKY (φ_Bn, T, A*, LỰC ẢNH)
   ========================================================================== */
LABS.push({
  id: 'therm', tag: '4.3', name: 'Phát xạ nhiệt', sec: 4,
  S: { phiBn: 0.80, T: 300, Va: 0.44, Astar: 120, imgOn: 1 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Lò phát xạ nhiệt điện tử: chỉ hạt "nóng" mới đủ năng lượng nhảy qua đỉnh hàng rào φ_Bn!',
      area: 'a', anim: true,
      ctrls: [
        { k: 'phiBn', l: 'φ_Bn', min: 0.55, max: 0.95, step: 0.02, f: v => v.toFixed(2) + ' V' },
        { k: 'T', l: 'Nhiệt độ T', min: 220, max: 420, step: 10, f: v => v + ' K' },
        { k: 'Va', l: 'Áp V_a', min: -3, max: 0.65, step: 0.02, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' },
        { k: 'imgOn', seg: [[1, 'Có lực ảnh Δφ'], [0, 'Tắt lực ảnh']] },
        { btn: 'Ví dụ 4.1', fn: p => { p.S.phiBn = 0.80; p.S.T = 300; p.S.Va = 0.44; p.S.Astar = 120; p.S.imgOn = 0; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const Vt = vtOf(S.T);
        // Nếu bật lực ảnh và phân cực ngược, hạ hàng rào nhẹ Δφ ~ 0.025 * sqrt(1 + |VR|)
        const dPhi = (S.imgOn && S.Va < 0) ? 0.028 * Math.sqrt(1 + (-S.Va) * 2.5) : 0;
        const phiEff = Math.max(0.1, S.phiBn - dPhi);
        const JsT = S.Astar * S.T * S.T * Math.exp(-phiEff / Vt);
        const J = JsT * (Math.exp(clamp(S.Va / Vt, -35, 32)) - 1);

        const padX = 18, topY = 30, botY = H - 20, bw = W - padX * 2, bh = botY - topY;
        const wallX = padX + bw * 0.35;

        // Vẽ bức tường hàng rào giữa Kim loại (trái) và Bán dẫn n (phải)
        const wallH = clamp(phiEff / 1.1, 0.25, 0.86) * bh;
        const baseRightY = clamp(botY - 18 - Math.max(0, S.Va) * bh * 0.45 + Math.max(0, -S.Va) * bh * 0.04, topY + 26, botY - 12);
        const peakY = clamp(botY - wallH, topY + 14, botY - 30);

        // Nền kim loại trái & bán dẫn phải
        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.16; ctx.fillStyle = C.c1; ctx.fillRect(padX, topY, wallX - padX, bh);
        // Sàn thế năng bán dẫn dốc lên đỉnh tường
        ctx.beginPath();
        ctx.moveTo(wallX, botY); ctx.lineTo(wallX, peakY);
        ctx.quadraticCurveTo(wallX + 60, baseRightY, padX + bw, baseRightY);
        ctx.lineTo(padX + bw, botY); ctx.closePath();
        ctx.globalAlpha = 0.20; ctx.fillStyle = C.c5; ctx.fill();
        ctx.restore();

        ln(ctx, wallX, peakY, wallX, botY, C.c5, 3);
        ctx.beginPath();
        ctx.moveTo(wallX, peakY);
        ctx.quadraticCurveTo(wallX + 60, baseRightY, padX + bw, baseRightY);
        ctx.strokeStyle = C.c5; ctx.lineWidth = 2.8; ctx.stroke();

        // Hạt electron nhiệt chạy bên bán dẫn: tốc độ & số lượng hạt "nóng" nhảy qua đỉnh tường theo T, φ_Bn, V_a!
        const crossProb = clamp(Math.log10(Math.max(1e-10, Math.abs(J)) / 1e-9) / 11, 0.02, 0.96);
        const tempAg = Math.sqrt(S.T / 300);
        if (!st.es || st.W !== W) {
          st.W = W;
          st.es = Array.from({ length: 28 }, (_, i) => ({
            x: rnd(wallX + 16, padX + bw - 12),
            y: rnd(topY + 22, botY - 12),
            vx: -rnd(40, 120),
            vy: gauss() * 30,
            hot: i < 4
          }));
        }
        const nHot = S.Va > 0 ? Math.round(1 + crossProb * 24) : Math.round(1 + (S.imgOn ? 3 : 1) * tempAg);
        st.es.forEach((e, i) => {
          e.hot = i < nHot;
          e.x += e.vx * dt * tempAg;
          e.y += e.vy * dt * tempAg;
          if (Math.random() < dt * 2.5) e.vy = gauss() * 35;

          const overWall = e.hot && (S.Va > 0 || (S.Va < 0 && e.x < wallX + 6));
          if (e.x < wallX + 7 && e.x > wallX - 7) {
            if (overWall && e.vx < 0) {
              // Hạt nóng vọt qua đỉnh tường rơi sang kim loại!
              e.y = Math.min(e.y, peakY - 7);
            } else if (!overWall && e.vx < 0) {
              // Hạt lạnh đập tường dội ngược lại bán dẫn!
              e.x = wallX + 8; e.vx = Math.abs(e.vx);
            }
          }
          if (e.x < padX + 8) { e.x = padX + bw - 10; e.vx = -rnd(60, 150); e.y = rnd(peakY, baseRightY - 8); }
          if (e.x > padX + bw - 8) { e.x = padX + bw - 8; e.vx = -rnd(55, 140); }
          const yFloor = e.x < wallX ? botY - 10 : baseRightY - 6;
          if (e.y > yFloor) { e.y = yFloor; e.vy = -Math.abs(e.vy); }
          if (e.y < topY + 10) { e.y = topY + 10; e.vy = Math.abs(e.vy); }

          const col = e.hot ? (S.T > 350 ? C.err : C.main) : C.c2;
          dot(ctx, e.x, e.y, e.hot ? 5.6 : 4.6, col);
          txt(ctx, '−', e.x, e.y + 0.5, C.bg, 9, 'center', 800);
        });

        txt(ctx, 'Kim loại (A*=' + S.Astar + ')', padX + (wallX - padX) / 2, 15, C.c1, 11.5, 'center', 700);
        chip(ctx, 'Đỉnh rào φ_Bn = ' + phiEff.toFixed(3) + ' V' + (dPhi > 0.001 ? ' (−Δφ)' : ''), wallX + 12, peakY - 12, C.main, 'left');
        txt(ctx, 'Bán dẫn n · T = ' + S.T + ' K', padX + bw - 6, 15, S.T > 350 ? C.err : C.c2, 11.5, 'right', 700);
      }
    },
    {
      title: 'Ampe kế dòng bão hòa ngược J_sT & Dòng thực J = J_sT [exp(eV_a/kT) − 1]',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, Vt = vtOf(S.T);
        const dPhi = (S.imgOn && S.Va < 0) ? 0.028 * Math.sqrt(1 + (-S.Va) * 2.5) : 0;
        const phiEff = Math.max(0.1, S.phiBn - dPhi);
        const JsT = S.Astar * S.T * S.T * Math.exp(-phiEff / Vt);
        const J = JsT * (Math.exp(clamp(S.Va / Vt, -35, 32)) - 1);

        const pad = 12, gap = 10, mw = (W - pad * 2 - gap) / 2, mh = H - pad * 2;
        const jsFrac = clamp((Math.log10(Math.max(1e-12, JsT)) + 11) / 9, 0, 1);
        const jFrac = S.Va > 0 ? clamp((Math.log10(Math.max(1e-9, J)) + 8) / 11, 0, 1) : clamp(jsFrac * 0.45, 0.03, 0.45);
        drawMeter(ctx, pad, pad, mw, mh, 'Dòng bão hòa J_sT = A*T²e^(−φ/V_t)', sci(JsT, 2) + ' A/cm²', jsFrac, C.c5);
        drawMeter(ctx, pad + mw + gap, pad, mw, mh, 'Mật độ dòng điện J',
          (Math.abs(J) >= 0.1 && Math.abs(J) < 1000 ? J.toFixed(2) : sci(J, 2)) + ' A/cm²', jFrac, S.Va > 0 ? C.main : C.c2);
      }
    }
  ]
});

/* ==========================================================================
   7. MỤC 5.4 — SO SÁNH ĐIỆN ÁP MỞ THUẬN: MẠCH ĐÈN SCHOTTKY VS ĐIỐT p-n
   ========================================================================== */
LABS.push({
  id: 'von', tag: '5.4', name: 'So áp mở', sec: 5,
  S: { Va: 0.38, phiBn: 0.672, Jtar: 10 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Hai mạch đèn mắc song song chung nguồn V_a: vặn V_a từ 0V → 0.8V xem đèn Schottky sáng sớm hơn hẳn p-n!',
      area: 'a', anim: true,
      ctrls: [
        { k: 'Va', l: 'Nguồn chung V_a', min: 0, max: 0.80, step: 0.01, f: v => v.toFixed(2) + ' V' },
        { k: 'phiBn', l: 'φ_Bn (Sch)', min: 0.55, max: 0.85, step: 0.01, f: v => v.toFixed(2) + ' V' },
        { k: 'Jtar', seg: [[1, 'Mốc 1 A/cm²'], [10, 'Mốc 10 A/cm²'], [100, 'Mốc 100 A/cm²']] }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, Vt = 0.0259;
        const JsSch = 120 * 300 * 300 * Math.exp(-S.phiBn / Vt);
        const JsPN = 3.7e-11; // khớp Ví dụ 5.1 (0.682V tại 10 A/cm²)
        const JSch = JsSch * (Math.exp(clamp(S.Va / Vt, 0, 32)) - 1);
        const JPN = JsPN * (Math.exp(clamp(S.Va / Vt, 0, 35)) - 1);

        // Độ sáng bóng đèn theo hàm log của dòng (0.1 A/cm² bắt đầu ửng sáng, >=10 A/cm² sáng rực!)
        const brSch = clamp((Math.log10(Math.max(1e-4, JSch)) + 1.5) / 3.0, 0, 1);
        const brPN = clamp((Math.log10(Math.max(1e-4, JPN)) + 1.5) / 3.0, 0, 1);

        const padX = 20, topY = 26, gap = 22, bh = (H - topY - gap - 18) / 2, bw = W - padX * 2;
        function drawBranch(y, title, sym, br, Jval, accent) {
          rr(ctx, padX, y, bw, bh, 9); ctx.fillStyle = C.card; ctx.fill();
          ctx.strokeStyle = br > 0.3 ? accent : C.g; ctx.lineWidth = br > 0.3 ? 1.8 : 1.2; ctx.stroke();

          const cy = y + bh * 0.54, x1 = padX + 24, x2 = padX + bw - 24;
          ln(ctx, x1, cy, x2, cy, C.sub, 2.5);

          // Dòng chấm sáng chạy nhanh dần khi bóng đèn sáng
          if (br > 0.05) {
            const sp = 28 + br * 130;
            for (let k = 0; k < 6; k++) {
              const px = x1 + ((t * sp + k * ((x2 - x1) / 6)) % (x2 - x1));
              dot(ctx, px, cy, 3.6, accent);
            }
          }

          // Hộp điốt giữa nhánh
          const dx = padX + bw * 0.36;
          rr(ctx, dx - 44, cy - 16, 88, 32, 6); ctx.fillStyle = C.bg; ctx.fill();
          ctx.strokeStyle = accent; ctx.lineWidth = 1.6; ctx.stroke();
          txt(ctx, sym, dx, cy + 0.5, accent, 11.5, 'center', 700);

          // Bóng đèn hiển thị cường độ dòng trực quan!
          const bx = padX + bw * 0.72, rB = Math.min(24, bh * 0.28);
          if (br > 0.04) {
            ctx.save(); ctx.globalAlpha = br * 0.45;
            dot(ctx, bx, cy, rB * (1.5 + br * 0.7), accent);
            ctx.restore();
          }
          dot(ctx, bx, cy, rB, br > 0.1 ? accent : C.tint);
          ctx.beginPath(); ctx.arc(bx, cy, rB, 0, TAU2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.stroke();
          txt(ctx, br > 0.6 ? 'SÁNG RỰC' : br > 0.15 ? 'ỨNG SÁNG' : 'TỐI', bx + rB + 12, cy, br > 0.15 ? accent : C.mut, 11, 'left', 700);

          txt(ctx, title, padX + 12, y + 14, accent, 11.5, 'left', 700);
          txt(ctx, 'J = ' + (Jval >= 1000 ? '>10³' : Jval >= 0.01 ? Jval.toFixed(2) : sci(Jval, 1)) + ' A/cm²', padX + bw - 12, y + 14, C.ink, 11.5, 'right', 700);
        }

        drawBranch(topY, 'Nhánh 1: Điốt SCHOTTKY (J_sT = ' + sci(JsSch, 1) + ' A/cm²)', 'Schottky', brSch, JSch, C.main);
        drawBranch(topY + bh + gap, 'Nhánh 2: Điốt p-n (J_s = ' + sci(JsPN, 1) + ' A/cm²)', 'Điốt p-n', brPN, JPN, C.c4);
        txt(ctx, 'Cả hai nhánh đặt cùng một nguồn V_a = ' + S.Va.toFixed(2) + ' V', W / 2, 12, C.ink, 12, 'center', 700);
      }
    },
    {
      title: 'Thang so sánh điện áp mở thuận tại cùng mật độ dòng mục tiêu J = V_t ln(J / J_s)',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, Vt = 0.0259;
        const JsSch = 120 * 300 * 300 * Math.exp(-S.phiBn / Vt);
        const JsPN = 3.7e-11;
        const VonSch = Math.max(0.02, Vt * Math.log(S.Jtar / JsSch));
        const VonPN = Math.max(0.05, Vt * Math.log(S.Jtar / JsPN));
        const dV = VonPN - VonSch;

        const pad = 16, bw = W - pad * 2, y1 = H * 0.30, y2 = H * 0.66, bh = 20;
        txt(ctx, 'Schottky mở ở V_a = ' + VonSch.toFixed(3) + ' V  (tại J = ' + S.Jtar + ' A/cm²)', pad, y1 - 12, C.main, 12, 'left', 700);
        rr(ctx, pad, y1, bw, bh, 6); ctx.fillStyle = C.tint; ctx.fill();
        rr(ctx, pad, y1, bw * clamp(VonSch / 1.0, 0.04, 1), bh, 6); ctx.fillStyle = C.main; ctx.fill();

        txt(ctx, 'Điốt p-n mở ở V_a = ' + VonPN.toFixed(3) + ' V   (chênh ΔV = ' + dV.toFixed(3) + ' V)', pad, y2 - 12, C.c4, 12, 'left', 700);
        rr(ctx, pad, y2, bw, bh, 6); ctx.fillStyle = C.tint; ctx.fill();
        rr(ctx, pad, y2, bw * clamp(VonPN / 1.0, 0.04, 1), bh, 6); ctx.fillStyle = C.c4; ctx.fill();

        // Vạch vị trí V_a đang đặt trên cả hai thang
        const xNow = pad + bw * clamp(S.Va / 1.0, 0, 1);
        ln(ctx, xNow, y1 - 4, xNow, y2 + bh + 4, C.ink, 2, [3, 3]);
        txt(ctx, 'V_a hiện tại (' + S.Va.toFixed(2) + 'V)', xNow, H - 10, C.ink, 10.5, 'center', 700);
      }
    }
  ]
});

/* ==========================================================================
   8. MỤC 5.5 — CHUYỂN MẠCH: TÍCH TRỮ ĐIỆN TÍCH THIỂU SỐ & PHỤC HỒI NGƯỢC
   ========================================================================== */
LABS.push({
  id: 'switch', tag: '5.5', name: 'Chuyển mạch', sec: 5,
  S: { sw: 'fwd', Ifwd: 1.0, tau: 2.0 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Gạt công tắc THUẬN → NGƯỢC: Schottky khóa tức thì (~ps), còn điốt p-n kẹt xả đám mây thiểu số (~ns)!',
      area: 'a', anim: true,
      ctrls: [
        { k: 'sw', seg: [['fwd', 'Đang dẫn THUẬN'], ['rev', 'Gạt sang NGƯỢC!']] },
        { k: 'Ifwd', l: 'Mức dòng thuận', min: 0.3, max: 1.5, step: 0.1, f: v => v.toFixed(1) + '×' },
        { k: 'tau', l: 'Thời gian xả p-n', min: 1.0, max: 4.0, step: 0.5, f: v => v.toFixed(1) + '×' }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        if (st.storePN == null) st.storePN = 0.85;
        if (S.sw === 'fwd') {
          const tgt = clamp(S.Ifwd / 1.5, 0.2, 1);
          st.storePN += (tgt - st.storePN) * Math.min(1, dt * 2.4);
        } else {
          st.storePN = Math.max(0, st.storePN - dt * (0.85 / S.tau));
        }

        const padX = 16, topY = 24, gapY = 26, bw = W - padX * 2, chH = (H - topY - gapY - 14) / 2;
        const xDiv = padX + bw * 0.32;

        // Buồng 1: Schottky
        const y1 = topY + 6;
        txt(ctx, '1) Điốt SCHOTTKY (hạt đa số · KHÔNG có điện tích thiểu số tích trữ)', padX, y1 - 10, C.main, 11.5, 'left', 700);
        txt(ctx, S.sw === 'fwd' ? 'Đang dẫn thuận' : 'KHÓA NGAY LẬP TỨC (~ps)!', padX + bw, y1 - 10, S.sw === 'rev' ? C.c2 : C.main, 11.5, 'right', 700);

        rr(ctx, padX, y1, bw, chH, 8); ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = S.sw === 'fwd' ? C.main : C.c2; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.save(); rr(ctx, padX, y1, bw, chH, 8); ctx.clip();
        ctx.globalAlpha = 0.2; ctx.fillStyle = C.c1; ctx.fillRect(padX, y1, xDiv - padX, chH);
        ctx.globalAlpha = 0.08; ctx.fillStyle = C.c2; ctx.fillRect(xDiv, y1, padX + bw - xDiv, chH);
        ctx.restore();
        ln(ctx, xDiv, y1, xDiv, y1 + chH, C.ink, 1.8);

        if (!st.sEs) st.sEs = Array.from({ length: 22 }, () => ({ x: rnd(xDiv + 10, padX + bw - 10), y: rnd(0.22, 0.88) }));
        st.sEs.forEach(e => {
          if (S.sw === 'fwd') { e.x -= (90 + 130 * S.Ifwd) * dt; if (e.x < padX + 8) e.x = padX + bw - 8; }
          else e.x = clamp(e.x + gauss() * 14 * dt, xDiv + 14, padX + bw - 10);
          dot(ctx, e.x, y1 + e.y * chH, 4.8, C.c2);
        });
        if (S.sw === 'rev') chip(ctx, 'Q_thiểu số = 0 → Không có xung dòng ngược!', (xDiv + padX + bw) / 2, y1 + chH * 0.56, C.c2, 'center');

        // Buồng 2: Điốt p-n
        const y2 = y1 + chH + gapY;
        const rec = S.sw === 'rev' && st.storePN > 0.02;
        txt(ctx, '2) Điốt p-n (bơm lỗ trống thiểu số sang n → tạo "đám mây" tích trữ)', padX, y2 - 10, C.c4, 11.5, 'left', 700);
        txt(ctx, S.sw === 'fwd' ? 'Đang bơm & tích trữ lỗ trống' : (rec ? 'ĐANG XẢ ĐÁM MÂY THIỂU SỐ (chưa khóa!)' : 'Đã khóa xong (sau t_rr ~ ns)'),
          padX + bw, y2 - 10, rec ? C.err : (S.sw === 'fwd' ? C.c4 : C.c2), 11.5, 'right', 700);

        rr(ctx, padX, y2, bw, chH, 8); ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = rec ? C.err : C.g; ctx.lineWidth = rec ? 1.8 : 1.2; ctx.stroke();
        ctx.save(); rr(ctx, padX, y2, bw, chH, 8); ctx.clip();
        ctx.globalAlpha = 0.16; ctx.fillStyle = C.c4; ctx.fillRect(padX, y2, xDiv - padX, chH);
        ctx.globalAlpha = 0.08; ctx.fillStyle = C.c2; ctx.fillRect(xDiv, y2, padX + bw - xDiv, chH);
        if (st.storePN > 0.02) {
          const cw = (padX + bw - xDiv) * 0.78 * st.storePN;
          const grd = ctx.createLinearGradient(xDiv, 0, xDiv + cw, 0);
          grd.addColorStop(0, C.err); grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalAlpha = 0.28; ctx.fillStyle = grd; ctx.fillRect(xDiv, y2, cw, chH);
        }
        ctx.restore();
        ln(ctx, xDiv, y2, xDiv, y2 + chH, C.ink, 1.8);

        if (!st.pHs) st.pHs = Array.from({ length: 28 }, () => ({ x: rnd(xDiv + 8, padX + bw - 20), y: rnd(0.22, 0.88) }));
        const nCloud = Math.round(st.storePN * 28);
        st.pHs.forEach((h, i) => {
          if (i >= nCloud) return;
          if (S.sw === 'fwd') { h.x += (45 + 90 * S.Ifwd) * dt; if (h.x > xDiv + (padX + bw - xDiv) * 0.85) h.x = xDiv + 6; }
          else { h.x -= 135 * dt; if (h.x < padX + 8) h.x = xDiv + rnd(8, (padX + bw - xDiv) * 0.75 * st.storePN + 10); }
          const yy = y2 + h.y * chH;
          dot(ctx, h.x, yy, 5, rec ? C.err : C.c4);
          txt(ctx, '+', h.x, yy + 0.5, C.bg, 9.5, 'center', 800);
        });
        if (rec) {
          arr(ctx, xDiv + 68, y2 + chH * 0.56, xDiv - 34, y2 + chH * 0.56, C.err, 3.2);
          chip(ctx, 'Dòng xả ngược I_R đang hút đám mây về p!', (xDiv + padX + bw) / 2, y2 + chH * 0.56, C.err, 'center');
        }
        void t;
      }
    },
    {
      title: 'Đồng hồ đo điện tích tích trữ Q_s & Xung dòng xả ngược khi chuyển mạch',
      area: 'c', anim: true,
      draw(p, ctx, W, H) {
        const S = p.S, p0 = curPanels[0];
        const store = (p0 && p0.st && p0.st.storePN != null) ? p0.st.storePN : 0;
        const rec = S.sw === 'rev' && store > 0.02;
        const pad = 12, gap = 10, mw = (W - pad * 2 - gap) / 2, mh = H - pad * 2;
        drawMeter(ctx, pad, pad, mw, mh, 'Điện tích thiểu số tích trữ (p-n)',
          store > 0.02 ? ('Còn ' + Math.round(store * 100) + '% (Schottky = 0%)') : '0% (Đã xả sạch)', store, C.c4, 0.55);
        drawMeter(ctx, pad + mw + gap, pad, mw, mh, 'Xung dòng xả ngược (p-n vs Sch)',
          rec ? 'p-n: ĐANG RÒ NGƯỢC MẠNH!' : (S.sw === 'rev' ? 'Cả hai đã khóa' : 'Đang dẫn thuận'),
          rec ? 0.92 : 0.03, rec ? C.err : C.c2, 0.5);
      }
    }
  ]
});

/* ==========================================================================
   9. MỤC 6.3 — TIẾP XÚC OHMIC LÝ TƯỞNG: LỚP TÍCH LŨY VS CHỈNH LƯU SCHOTTKY
   ========================================================================== */
LABS.push({
  id: 'ohmicIdeal', tag: '6.3', name: 'Ohmic tích lũy', sec: 6,
  S: { scType: 'n', phiM: 4.05, V: 0.5 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Kéo φ_m vượt qua φ_s (loại n và loại p): khi nào hình thành lớp tích lũy dẫn 2 chiều không hàng rào?',
      area: 'a', anim: true,
      ctrls: [
        { k: 'scType', seg: [['n', 'Bán dẫn loại n (φ_s≈4.21V)'], ['p', 'Bán dẫn loại p (φ_s≈4.93V)']], set: { n: { phiM: 4.05 }, p: { phiM: 5.20 } } },
        { k: 'phiM', l: 'φ_m', min: 3.7, max: 5.65, step: 0.05, f: v => v.toFixed(2) + ' V' },
        { k: 'V', l: 'Áp 2 chiều V', min: -1, max: 1, step: 0.1, f: v => (v > 0 ? '+' : '') + v.toFixed(1) + ' V' }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const phiS = S.scType === 'n' ? 4.21 : 4.93;
        const isOhmic = S.scType === 'n' ? (S.phiM <= phiS) : (S.phiM >= phiS);
        const carrierCol = S.scType === 'n' ? C.c2 : C.c4;
        const carrierSign = S.scType === 'n' ? '−' : '+';

        const padX = 18, topY = 34, botY = H - 18, bw = W - padX * 2, bh = botY - topY;
        const mW = bw * 0.28, xJ = padX + mW;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.22; ctx.fillStyle = C.c1; ctx.fillRect(padX, topY, mW, bh);
        if (isOhmic) {
          const grd = ctx.createLinearGradient(xJ, 0, xJ + 76, 0);
          grd.addColorStop(0, carrierCol); grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalAlpha = 0.36; ctx.fillStyle = grd; ctx.fillRect(xJ, topY, 76, bh);
        } else {
          ctx.globalAlpha = 0.22; ctx.fillStyle = C.err; ctx.fillRect(xJ, topY, 72, bh);
        }
        ctx.restore();
        ln(ctx, xJ, topY, xJ, botY, C.ink, 2);
        if (!isOhmic) ln(ctx, xJ + 72, topY, xJ + 72, botY, C.err, 1.8, [4, 3]);

        // Hạt di động thử chạy 2 chiều (+V và -V)
        if (!st.ps || st.W !== W) {
          st.W = W;
          st.ps = Array.from({ length: 28 }, (_, i) => ({ x: rnd(padX + 10, padX + bw - 10), y: topY + ((i % 6) + 0.5) * (bh / 6) }));
        }
        // V > 0: cực dương tại Kim loại (trái). Electron đi sang trái (-1), lỗ trống đi sang phải (+1)
        const dirFlow = S.V === 0 ? 0 : (S.scType === 'n' ? (S.V > 0 ? -1 : 1) : (S.V > 0 ? 1 : -1));
        const canPass = isOhmic || (S.scType === 'n' ? S.V > 0.25 : S.V < -0.25);

        st.ps.forEach(q => {
          if (dirFlow !== 0) {
            if (canPass) {
              q.x += dirFlow * Math.abs(S.V) * 170 * dt;
              if (q.x < padX + 8) q.x = padX + bw - 8;
              if (q.x > padX + bw - 8) q.x = padX + 8;
            } else {
              q.x += dirFlow * 45 * dt;
              if (q.x >= xJ - 6 && q.x <= xJ + 78) q.x = dirFlow > 0 ? xJ - 8 : xJ + 80;
              q.x = clamp(q.x, padX + 8, padX + bw - 8);
            }
          } else {
            q.x = clamp(q.x + gauss() * 14 * dt, padX + 8, padX + bw - 8);
          }
          dot(ctx, q.x, q.y, 5, carrierCol);
          txt(ctx, carrierSign, q.x, q.y + 0.5, C.bg, 9.5, 'center', 800);
        });

        txt(ctx, 'Kim loại (φ_m=' + S.phiM.toFixed(2) + 'V)', padX + mW / 2, 15, C.c1, 11, 'center', 700);
        txt(ctx, isOhmic
          ? ('OHMIC LÝ TƯỞNG: lớp tích lũy ' + (S.scType === 'n' ? 'electron' : 'lỗ trống') + ' → dẫn mượt cả 2 chiều!')
          : ('CHỈNH LƯU SCHOTTKY: có vùng nghèo chặn chiều ngược!'),
          xJ + (bw - mW) / 2, 15, isOhmic ? C.c2 : C.err, 11.5, 'center', 700);
        if (S.V !== 0 && canPass) arr(ctx, xJ + (dirFlow < 0 ? 44 : -44), topY + bh * 0.5, xJ + (dirFlow < 0 ? -44 : 44), topY + bh * 0.5, C.main, 3.2);
        void t;
      }
    },
    {
      title: 'Bảng thử dẫn điện 2 chiều: Tiếp xúc Ohmic phải dẫn thông cả khi đặt +V lẫn −V',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, phiS = S.scType === 'n' ? 4.21 : 4.93;
        const isOhmic = S.scType === 'n' ? (S.phiM <= phiS) : (S.phiM >= phiS);
        const passPos = isOhmic || (S.scType === 'n');
        const passNeg = isOhmic || (S.scType === 'p');

        const pad = 12, gap = 12, cw = (W - pad * 2 - gap) / 2, ch = H - pad * 2;
        [
          { t: 'Khi đặt +V (Kim loại dương)', ok: passPos, sub: passPos ? 'THÔNG MẠCH (I tỉ lệ V)' : 'BỊ CHẶN (dòng ≈ 0)' },
          { t: 'Khi đặt −V (Kim loại âm)', ok: passNeg, sub: passNeg ? 'THÔNG MẠCH (I tỉ lệ V)' : 'BỊ CHẶN (dòng ≈ 0)' }
        ].forEach((b, i) => {
          const x = pad + i * (cw + gap);
          rr(ctx, x, pad, cw, ch, 10); ctx.fillStyle = C.card; ctx.fill();
          ctx.strokeStyle = b.ok ? C.c2 : C.err; ctx.lineWidth = 1.6; ctx.stroke();
          dot(ctx, x + 24, pad + ch / 2, 10, b.ok ? C.c2 : C.err);
          txt(ctx, b.t, x + 44, pad + ch * 0.36, C.ink, 11.5, 'left', 700);
          txt(ctx, b.sub, x + 44, pad + ch * 0.66, b.ok ? C.c2 : C.err, 11.5, 'left', 700);
        });
      }
    }
  ]
});

/* ==========================================================================
   10. MỤC 6.5 — OHMIC XUYÊN HẦM: ÉP TƯỜNG MỎNG BẰNG PHA TẠP CỰC NẶNG n⁺
   ========================================================================== */
LABS.push({
  id: 'ohmicTun', tag: '6.5', name: 'Ohmic hầm', sec: 6,
  S: { Nd: 1e19, phiBn: 0.80, V: 0.5 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Hàng rào vẫn cao (do ghim E_F), nhưng pha tạp cực nặng ép W mỏng còn vài nm → electron XUYÊN HẦM 2 chiều!',
      area: 'a', anim: true,
      ctrls: [
        { k: 'Nd', l: 'Pha tạp N_d', min: 16.5, max: 20, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'phiBn', l: 'φ_Bn', min: 0.50, max: 1.0, step: 0.05, f: v => v.toFixed(2) + ' V' },
        { k: 'V', l: 'Áp 2 chiều V', min: -1, max: 1, step: 0.1, f: v => (v > 0 ? '+' : '') + v.toFixed(1) + ' V' },
        { btn: 'VD 6.1: 10¹⁷ (Chặn)', fn: p => { p.S.Nd = 1e17; p.S.phiBn = 0.80; p.syncCtrls(); p.dirty = true; } },
        { btn: 'VD 6.1: 10¹⁹ (Hầm)', fn: p => { p.S.Nd = 1e19; p.S.phiBn = 0.80; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const eps = SEMIS.Si.er * EPS0_CM;
        const W_cm = Math.sqrt((2 * eps * S.phiBn) / (E_CHG * S.Nd));
        const E00 = tunnelE00('Si', S.Nd);
        const isTun = E00 >= 0.018;

        const padX = 18, topY = 34, botY = H - 18, bw = W - padX * 2, bh = botY - topY;
        const mW = bw * 0.26, xJ = padX + mW;
        const wallPx = clamp(10 + ((20 - Math.log10(S.Nd)) / 3.5) * (bw * 0.48), 10, bw * 0.50);

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.22; ctx.fillStyle = C.c1; ctx.fillRect(padX, topY, mW, bh);
        ctx.globalAlpha = isTun ? 0.22 : 0.34; ctx.fillStyle = isTun ? C.c2 : C.c5; ctx.fillRect(xJ, topY, wallPx, bh);
        ctx.restore();
        ln(ctx, xJ, topY, xJ, botY, C.ink, 2);
        ln(ctx, xJ + wallPx, topY, xJ + wallPx, botY, isTun ? C.c2 : C.err, 2, [4, 3]);

        // Hạt electron tiến tới tường: nếu tường mỏng → hóa sóng lượng tử xuyên thẳng qua 2 chiều!
        if (!st.ps || st.W !== W) {
          st.W = W;
          st.ps = Array.from({ length: 26 }, (_, i) => ({ x: rnd(padX + 10, padX + bw - 10), y: topY + ((i % 6) + 0.5) * (bh / 6) }));
        }
        const dirFlow = S.V === 0 ? 0 : (S.V > 0 ? -1 : 1);
        const canPass = isTun || S.V > 0.55;

        st.ps.forEach(q => {
          if (dirFlow !== 0) {
            if (canPass) {
              q.x += dirFlow * Math.abs(S.V) * (isTun ? 175 : 70) * dt;
              if (q.x < padX + 8) q.x = padX + bw - 8;
              if (q.x > padX + bw - 8) q.x = padX + 8;
            } else {
              q.x += dirFlow * 45 * dt;
              if (q.x >= xJ - 6 && q.x <= xJ + wallPx + 6) q.x = dirFlow > 0 ? xJ - 8 : xJ + wallPx + 8;
              q.x = clamp(q.x, padX + 8, padX + bw - 8);
            }
          } else {
            q.x = clamp(q.x + gauss() * 14 * dt, padX + 8, padX + bw - 8);
          }

          const inWall = q.x > xJ && q.x < xJ + wallPx;
          if (inWall && isTun) {
            ctx.beginPath();
            for (let k = -9; k <= 9; k += 2) {
              const wx = q.x + k, wy = q.y + Math.sin(k * 0.8 - t * 20 * (dirFlow || 1)) * 3.8;
              k === -9 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
            }
            ctx.strokeStyle = C.main; ctx.lineWidth = 2.4; ctx.stroke();
          } else {
            dot(ctx, q.x, q.y, 5, C.c2);
            txt(ctx, '−', q.x, q.y + 0.5, C.bg, 9.5, 'center', 800);
          }
        });

        txt(ctx, 'Kim loại', padX + mW / 2, 15, C.c1, 11.5, 'center', 700);
        txt(ctx, 'Tường dày W = ' + fmtLen(W_cm) + (isTun ? ' → XUYÊN HẦM 2 CHIỀU (Ohmic!)' : ' → Quá dày, chặn dòng!'),
          xJ + (bw - mW) / 2, 15, isTun ? C.c2 : C.err, 11.5, 'center', 700);
      }
    },
    {
      title: 'Đồng hồ điện trở tiếp xúc riêng R_c & So sánh năng lượng hầm E₀₀ với kT (25.9 meV)',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, eps = SEMIS.Si.er * EPS0_CM;
        const W_cm = Math.sqrt((2 * eps * S.phiBn) / (E_CHG * S.Nd));
        const E00 = tunnelE00('Si', S.Nd);
        const ratio = S.phiBn / E00;
        const logRc = -5 + (ratio - 24) * 0.12;
        const rcFrac = clamp((logRc + 7) / 14, 0, 1);

        const pad = 12, gap = 10, mw = (W - pad * 2 - gap) * 0.46, mh = H - pad * 2;
        const rcStr = logRc < -3.5 ? 'Cực nhỏ (~10' + sup(Math.round(logRc)) + ' Ω·cm²)'
          : logRc < 0.5 ? 'Trung bình (~10' + sup(Math.round(logRc)) + ')' : 'Rất lớn (Chặn!)';
        drawMeter(ctx, pad, pad, mw, mh, 'Điện trở tiếp xúc riêng R_c', rcStr, rcFrac, C.c2, 0.62);

        const rx = pad + mw + gap, rw = W - rx - pad;
        rr(ctx, rx, pad, rw, mh, 10); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
        txt(ctx, 'Chỉ số xuyên hầm (Si, m* = 0.26 m₀)', rx + 12, pad + 16, C.mut, 10.5, 'left', 700);
        txt(ctx, 'Bề rộng tường W = ' + fmtLen(W_cm), rx + 12, pad + mh * 0.42, C.ink, 11.8, 'left', 700);
        txt(ctx, 'E₀₀ = ' + (E00 * 1000).toFixed(1) + ' meV   (kT = 25.9 meV)', rx + 12, pad + mh * 0.64, E00 >= 0.02 ? C.c2 : C.c5, 11.5, 'left', 700);
        txt(ctx, 'Số mũ eφ_Bn / E₀₀ = ' + ratio.toFixed(1) + (ratio < 35 ? ' → R_c cực nhỏ!' : ' → Chưa xuyên hầm'),
          rx + 12, pad + mh * 0.85, ratio < 35 ? C.main : C.mut, 11, 'left', 700);
      }
    }
  ]
});

/* ==========================================================================
   11. MỤC 7.3 — QUY TẮC ANDERSON: TREO 2 VẬT LIỆU DƯỚI E_vac & 3 KIỂU XẾP VÙNG
   ========================================================================== */
LABS.push({
  id: 'anderson', tag: '7.3', name: 'Anderson', sec: 7,
  S: { preset: 'Ge_GaAs', chi1: 4.13, Eg1: 0.66, n1: 'Ge', chi2: 4.07, Eg2: 1.42, n2: 'GaAs' },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Treo hai khối vật liệu dưới cùng mái nhà chân không E_vac: thấy ngay ΔE_c, ΔE_v và 3 kiểu xếp vùng',
      area: 'a',
      ctrls: [
        {
          k: 'preset',
          seg: [['Ge_GaAs', 'Ge/GaAs'], ['GaAs_AlAs', 'GaAs/AlAs'], ['Si_Ge', 'Si/Ge (So le)'], ['InAs_GaSb', 'InAs/GaSb (Gãy)']],
          set: {
            Ge_GaAs:   { n1: 'Ge',   chi1: 4.13, Eg1: 0.66, n2: 'GaAs', chi2: 4.07, Eg2: 1.42 },
            GaAs_AlAs: { n1: 'GaAs', chi1: 4.07, Eg1: 1.42, n2: 'AlAs', chi2: 3.50, Eg2: 2.16 },
            Si_Ge:     { n1: 'Si',   chi1: 4.01, Eg1: 1.12, n2: 'Ge',   chi2: 4.13, Eg2: 0.66 },
            InAs_GaSb: { n1: 'InAs', chi1: 4.90, Eg1: 0.35, n2: 'GaSb', chi2: 4.06, Eg2: 0.73 }
          }
        },
        { k: 'chi2', l: 'χ₂ (phải)', min: 3.3, max: 5.0, step: 0.02, f: v => v.toFixed(2) + ' V' },
        { k: 'Eg2', l: 'E_g2 (phải)', min: 0.3, max: 2.3, step: 0.02, f: v => v.toFixed(2) + ' eV' }
      ],
      draw(p, ctx, W, H) {
        const S = p.S;
        const Ec1 = -S.chi1, Ev1 = -(S.chi1 + S.Eg1);
        const Ec2 = -S.chi2, Ev2 = -(S.chi2 + S.Eg2);
        const dEc = Math.abs(Ec1 - Ec2), dEv = Math.abs(Ev1 - Ev2);
        let kind = 'Straddling (bao trùm)', kCol = C.c2;
        if (Math.min(Ec1, Ec2) <= Math.max(Ev1, Ev2)) { kind = 'Broken gap (vùng cấm gãy)'; kCol = C.err; }
        else if (!((Ec1 <= Ec2 && Ev1 >= Ev2) || (Ec2 <= Ec1 && Ev2 >= Ev1))) { kind = 'Staggered (so le)'; kCol = C.c3; }

        const padX = 18, topY = 34, botY = H - 16, bw = W - padX * 2, midX = padX + bw / 2;
        const yVac = topY + 10;
        ln(ctx, padX, yVac, padX + bw, yVac, C.mut, 1.5, [6, 4]);
        txt(ctx, 'Mốc chung: Mức chân không E_vac = 0', midX, yVac - 12, C.mut, 11, 'center', 700);

        const yOf = E => yVac + clamp((-E - 3.0) / 3.4, 0.04, 0.96) * (botY - yVac - 8);
        const yC1 = yOf(Ec1), yV1 = yOf(Ev1), yC2 = yOf(Ec2), yV2 = yOf(Ev2);

        // Khối 1 (trái) & Khối 2 (phải)
        rr(ctx, padX, yVac + 4, midX - padX - 2, botY - yVac - 4, 8);
        ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.c2; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.c2; ctx.fillRect(padX + 2, yC1, midX - padX - 6, yV1 - yC1); ctx.restore();
        ln(ctx, padX + 2, yC1, midX - 2, yC1, C.c2, 3);
        ln(ctx, padX + 2, yV1, midX - 2, yV1, C.c2, 3);

        rr(ctx, midX + 2, yVac + 4, padX + bw - midX - 2, botY - yVac - 4, 8);
        ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.c5; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = C.c5; ctx.fillRect(midX + 4, yC2, padX + bw - midX - 6, yV2 - yC2); ctx.restore();
        ln(ctx, midX + 2, yC2, padX + bw - 2, yC2, C.c5, 3);
        ln(ctx, midX + 2, yV2, padX + bw - 2, yV2, C.c5, 3);

        // Dây treo χ₁ và χ₂ từ trần E_vac xuống sàn Ec
        arr(ctx, padX + 26, yVac + 2, padX + 26, yC1 - 2, C.c2, 1.8);
        txt(ctx, 'χ₁=' + S.chi1.toFixed(2) + 'V', padX + 34, (yVac + yC1) / 2, C.c2, 10.5, 'left', 700);
        arr(ctx, padX + bw - 26, yVac + 2, padX + bw - 26, yC2 - 2, C.c5, 1.8);
        txt(ctx, 'χ₂=' + S.chi2.toFixed(2) + 'V', padX + bw - 34, (yVac + yC2) / 2, C.c5, 10.5, 'right', 700);

        if (Math.abs(yC1 - yC2) > 3) arr(ctx, midX, yC1, midX, yC2, C.main, 2.8);
        chip(ctx, 'ΔE_c = ' + dEc.toFixed(2) + ' eV', midX, (yC1 + yC2) / 2 - 14, C.main, 'center');
        if (Math.abs(yV1 - yV2) > 3) arr(ctx, midX, yV1, midX, yV2, C.c4, 2.8);
        chip(ctx, 'ΔE_v = ' + dEv.toFixed(2) + ' eV', midX, (yV1 + yV2) / 2 + 14, C.c4, 'center');

        txt(ctx, S.n1 + '  (E_g1=' + S.Eg1.toFixed(2) + ' eV)', (padX + midX) / 2, (yC1 + yV1) / 2, C.ink, 12, 'center', 700);
        txt(ctx, S.n2 + '  (E_g2=' + S.Eg2.toFixed(2) + ' eV)', (midX + padX + bw) / 2, (yC2 + yV2) / 2, C.ink, 12, 'center', 700);
        chip(ctx, 'Kiểu xếp vùng: ' + kind, midX, 15, kCol, 'center');
      }
    },
    {
      title: 'Phân bổ độ chênh vùng cấm vào bậc nhảy ΔE_c và ΔE_v',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const dEc = Math.abs(S.chi1 - S.chi2);
        const dEv = Math.abs((S.chi1 + S.Eg1) - (S.chi2 + S.Eg2));
        const dEg = Math.abs(S.Eg2 - S.Eg1);
        const sum = Math.max(0.01, dEc + dEv);
        const pad = 16, bw = W - pad * 2, yBar = H * 0.46, bh = 26;

        rr(ctx, pad, yBar, bw, bh, 7); ctx.fillStyle = C.tint; ctx.fill();
        ctx.save(); rr(ctx, pad, yBar, bw, bh, 7); ctx.clip();
        ctx.fillStyle = C.main; ctx.fillRect(pad, yBar, bw * (dEc / sum), bh);
        ctx.fillStyle = C.c4; ctx.fillRect(pad + bw * (dEc / sum), yBar, bw * (dEv / sum), bh);
        ctx.restore();

        txt(ctx, 'ΔE_c = ' + dEc.toFixed(2) + ' eV (' + Math.round((dEc / sum) * 100) + '%)', pad, yBar - 14, C.main, 12, 'left', 700);
        txt(ctx, 'ΔE_v = ' + dEv.toFixed(2) + ' eV (' + Math.round((dEv / sum) * 100) + '%)', pad + bw, yBar - 14, C.c4, 12, 'right', 700);
        txt(ctx, 'Chênh vùng cấm |E_g2 − E_g1| = ' + dEg.toFixed(2) + ' eV  (Ví dụ 7.1 Ge/GaAs: 0.06 + 0.70 = 0.76 eV)', W / 2, yBar + bh + 18, C.mut, 11, 'center', 600);
      }
    }
  ]
});

/* ==========================================================================
   12. MỤC 7.6 — DỊ TIẾP GIÁP DỊ LOẠI nP: VÙNG NGHÈO, ε₁ ≠ ε₂ & CHIA THẾ V_bi
   ========================================================================== */
LABS.push({
  id: 'hetNP', tag: '7.6', name: 'Dị tiếp giáp nP', sec: 7,
  S: { pair: 'Ge_GaAs', Nd: 1e16, Na: 1e16 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Dị tiếp giáp nP: N_d xₙ = Nₐ x_P giữ trung hòa điện, nhưng ε₁ ≠ ε₂ làm điện trường nhảy bậc tại x = 0!',
      area: 'a',
      ctrls: [
        { k: 'pair', seg: [['Ge_GaAs', 'n-Ge / P-GaAs (VD 7.2)'], ['GaAs_AlAs', 'n-GaAs / P-AlAs'], ['Si_Ge', 'n-Ge / P-Si']] },
        { k: 'Nd', l: 'N_d (n trái)', min: 15, max: 17.5, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'Na', l: 'Nₐ (P phải)', min: 15, max: 17.5, step: 0.1, log: 1, f: v => pw(v) }
      ],
      draw(p, ctx, W, H) {
        const S = p.S;
        const map = { Ge_GaAs: ['Ge', 'GaAs'], GaAs_AlAs: ['GaAs', 'AlAs'], Si_Ge: ['Ge', 'Si'] };
        const [k1, k2] = map[S.pair] || ['Ge', 'GaAs'];
        const s1 = SEMIS[k1], s2 = SEMIS[k2];
        const eps1 = s1.er * EPS0_CM, eps2 = s2.er * EPS0_CM, Vt = 0.0259;
        const phiS1 = s1.chi + Vt * Math.log(Math.max(1.1, s1.Nc / S.Nd));
        const phiS2 = s2.chi + s2.Eg - Vt * Math.log(Math.max(1.1, s2.Nv / S.Na));
        const Vbi = Math.max(0.12, Math.abs(phiS2 - phiS1));
        const xn = Math.sqrt((2 * eps1 * eps2 * S.Na * Vbi) / (E_CHG * S.Nd * (eps1 * S.Nd + eps2 * S.Na)));
        const xP = xn * (S.Nd / S.Na);
        const Wtot = xn + xP;
        const E1 = (E_CHG * S.Nd * xn) / eps1, E2 = (E_CHG * S.Na * xP) / eps2;

        const padX = 18, topY = 36, botY = H - 24, bw = W - padX * 2, bh = botY - topY;
        const midX = padX + bw * 0.5;
        const depPx = bw * 0.62;
        const xnPx = depPx * clamp(xn / Wtot, 0.15, 0.85);
        const xpPx = depPx * clamp(xP / Wtot, 0.15, 0.85);
        const xL = midX - xnPx, xR = midX + xpPx;

        // Vẽ 2 khối vật liệu khác màu nhau
        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.10; ctx.fillStyle = C.c2; ctx.fillRect(padX, topY, midX - padX, bh);
        ctx.globalAlpha = 0.10; ctx.fillStyle = C.c5; ctx.fillRect(midX, topY, padX + bw - midX, bh);
        ctx.globalAlpha = 0.22; ctx.fillStyle = C.c4; ctx.fillRect(xL, topY, xnPx, bh);
        ctx.globalAlpha = 0.22; ctx.fillStyle = C.c5; ctx.fillRect(midX, topY, xpPx, bh);
        ctx.restore();

        ln(ctx, xL, topY, xL, botY, C.c4, 1.5, [4, 3]);
        ln(ctx, xR, topY, xR, botY, C.c5, 1.5, [4, 3]);
        ln(ctx, midX, topY - 4, midX, botY + 4, C.ink, 2.2);

        // Vẽ cùng số ion (+) bên n và (−) bên P để nhìn rõ N_d xₙ = Nₐ x_P!
        const rows = Math.max(3, Math.floor(bh / 30)), cols = 4;
        for (let r = 0; r < rows; r++) {
          const y = topY + (r + 0.5) * (bh / rows);
          for (let c = 0; c < cols; c++) {
            drawIon(ctx, xL + ((c + 0.5) / cols) * xnPx, y, '+', C.c4, clamp(xnPx / 12, 4.5, 6.5));
            drawIon(ctx, midX + ((c + 0.5) / cols) * xpPx, y, '−', C.c5, clamp(xpPx / 12, 4.5, 6.5));
          }
        }

        // Hai mũi tên điện trường ngay sát trái & phải x=0 có độ dài khác nhau đúng theo tỉ lệ ε₂/ε₁!
        const cy = topY + bh * 0.5;
        const maxE = Math.max(E1, E2);
        const l1 = 36 + 54 * (E1 / maxE), l2 = 36 + 54 * (E2 / maxE);
        arr(ctx, midX - 6 - l1, cy - 10, midX - 6, cy - 10, C.c2, 2.8);
        arr(ctx, midX + 6, cy + 10, midX + 6 + l2, cy + 10, C.main, 2.8);
        chip(ctx, 'E₁ = ' + sci(E1, 1), midX - 10, cy - 28, C.c2, 'right');
        chip(ctx, 'E₂ = ' + sci(E2, 1) + ' (nhảy ×' + (E2 / E1).toFixed(2) + ')', midX + 10, cy + 28, C.main, 'left');

        txt(ctx, 'n-' + s1.name + ' (ε_r=' + s1.er + ')', padX + 6, 16, C.c2, 12, 'left', 700);
        txt(ctx, 'xₙ = ' + fmtLen(xn) + '  |  x_P = ' + fmtLen(xP), midX, 16, C.ink, 11.5, 'center', 700);
        txt(ctx, 'P-' + s2.name + ' (ε_r=' + s2.er + ')', padX + bw - 6, 16, C.c5, 12, 'right', 700);
        txt(ctx, 'Độ điện dịch liên tục: ε₁E₁ = ε₂E₂  ⇒  phía ε_r nhỏ hơn có điện trường E lớn hơn!', midX, botY + 13, C.mut, 11, 'center', 600);
      }
    },
    {
      title: 'Chia thế tiếp xúc V_bi = V_bin + V_biP giữa hai vật liệu có hằng số điện môi khác nhau',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const map = { Ge_GaAs: ['Ge', 'GaAs'], GaAs_AlAs: ['GaAs', 'AlAs'], Si_Ge: ['Ge', 'Si'] };
        const [k1, k2] = map[S.pair] || ['Ge', 'GaAs'];
        const s1 = SEMIS[k1], s2 = SEMIS[k2];
        const eps1 = s1.er * EPS0_CM, eps2 = s2.er * EPS0_CM, Vt = 0.0259;
        const phiS1 = s1.chi + Vt * Math.log(Math.max(1.1, s1.Nc / S.Nd));
        const phiS2 = s2.chi + s2.Eg - Vt * Math.log(Math.max(1.1, s2.Nv / S.Na));
        const Vbi = Math.max(0.12, Math.abs(phiS2 - phiS1));
        const xn = Math.sqrt((2 * eps1 * eps2 * S.Na * Vbi) / (E_CHG * S.Nd * (eps1 * S.Nd + eps2 * S.Na)));
        const xP = xn * (S.Nd / S.Na);
        const Vbin = (E_CHG * S.Nd * xn * xn) / (2 * eps1);
        const VbiP = (E_CHG * S.Na * xP * xP) / (2 * eps2);

        const pad = 12, gap = 10, mw = (W - pad * 2 - gap) / 2, mh = H - pad * 2;
        drawMeter(ctx, pad, pad, mw, mh, 'Phần thế bên n-' + s1.name + ' (ε_r=' + s1.er + ')',
          'V_bin = ' + Vbin.toFixed(3) + ' V (' + Math.round(Vbin / Vbi * 100) + '%)', Vbin / Vbi, C.c2);
        drawMeter(ctx, pad + mw + gap, pad, mw, mh, 'Phần thế bên P-' + s2.name + ' (ε_r=' + s2.er + ')',
          'V_biP = ' + VbiP.toFixed(3) + ' V (' + Math.round(VbiP / Vbi * 100) + '%)', VbiP / Vbi, C.c5);
      }
    }
  ]
});

/* ==========================================================================
   13. MỤC 7.8 — DỊ TIẾP GIÁP ĐẲNG LOẠI n-N: ĐỔ THÁC ELECTRON & KHE TAM GIÁC
   ========================================================================== */
LABS.push({
  id: 'hetNN', tag: '7.8', name: 'Khe n-N', sec: 7,
  S: { joined: 1, NdN: 1e18, dEc: 0.33 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'N-AlGaAs ghép n-GaAs: electron từ donor bên AlGaAs đổ thác qua bậc ΔE_c tụ thành hồ trong khe tam giác',
      area: 'a', anim: true,
      ctrls: [
        { k: 'joined', seg: [[0, 'Trước ghép'], [1, 'Sau ghép (hồ khe)']] },
        { k: 'NdN', l: 'N_d (AlGaAs)', min: 16.5, max: 18.5, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'dEc', l: 'Bậc ΔE_c', min: 0.15, max: 0.55, step: 0.02, f: v => v.toFixed(2) + ' eV' }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        if (st.prog == null) st.prog = S.joined ? 1 : 0;
        if (S.joined) st.prog = Math.min(1, st.prog + dt * 0.7);
        else st.prog = Math.max(0, st.prog - dt * 1.6);

        const padX = 16, topY = 32, botY = H - 16, bw = W - padX * 2, bh = botY - topY;
        const xJ = padX + bw * 0.46;

        rr(ctx, padX, topY, xJ - padX, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.c5; ctx.lineWidth = 1.3; ctx.stroke();
        rr(ctx, xJ, topY, padX + bw - xJ, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.c2; ctx.lineWidth = 1.3; ctx.stroke();

        // Chiều sâu khe tam giác tăng theo ΔEc và pha tạp N_dN của AlGaAs
        const depthMul = clamp((S.dEc / 0.35) * (0.65 + (Math.log10(S.NdN) - 16.5) * 0.25), 0.35, 1.35) * st.prog;
        const yLeftBulk = topY + bh * 0.32;
        const ySpike = yLeftBulk - bh * 0.14 * depthMul;
        const yRightBulk = yLeftBulk + bh * clamp(S.dEc * 0.62, 0.10, 0.34);
        const yNotch = clamp(yRightBulk + bh * 0.24 * depthMul, yRightBulk + 4, botY - 12);
        const yEF = yRightBulk + bh * 0.08 * st.prog;

        // Vẽ khối thế năng dưới sàn dẫn E_c
        ctx.beginPath();
        ctx.moveTo(padX, botY); ctx.lineTo(padX, yLeftBulk);
        ctx.quadraticCurveTo(xJ - (xJ - padX) * 0.28, yLeftBulk, xJ, ySpike);
        ctx.lineTo(xJ, yNotch);
        ctx.quadraticCurveTo(xJ + (padX + bw - xJ) * 0.22, yRightBulk, padX + bw, yRightBulk);
        ctx.lineTo(padX + bw, botY); ctx.closePath();
        ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = C.c5; ctx.fill(); ctx.restore();

        // Hồ electron ngập dưới E_F trong khe tam giác
        if (st.prog > 0.15 && yNotch > yEF + 4) {
          const pondW = 28 + 56 * clamp(depthMul, 0.3, 1.2);
          ctx.beginPath();
          ctx.moveTo(xJ, yEF); ctx.lineTo(xJ, yNotch);
          ctx.quadraticCurveTo(xJ + pondW * 0.45, yEF + 6, xJ + pondW, yEF);
          ctx.closePath();
          ctx.save(); ctx.globalAlpha = 0.32 * st.prog; ctx.fillStyle = C.c2; ctx.fill(); ctx.restore();
        }

        // Đường sàn E_c
        ctx.beginPath();
        ctx.moveTo(padX, yLeftBulk);
        ctx.quadraticCurveTo(xJ - (xJ - padX) * 0.28, yLeftBulk, xJ, ySpike);
        ctx.lineTo(xJ, yNotch);
        ctx.quadraticCurveTo(xJ + (padX + bw - xJ) * 0.22, yRightBulk, padX + bw, yRightBulk);
        ctx.strokeStyle = C.c2; ctx.lineWidth = 3; ctx.stroke();

        // Mức Fermi ngang khi đã ghép
        if (st.prog > 0.1) {
          ln(ctx, padX + 4, yEF, padX + bw - 4, yEF, C.main, 1.6, [6, 4]);
          txt(ctx, 'E_F (nằm cao hơn đáy khe!)', padX + bw - 8, yEF - 10, C.main, 10.5, 'right', 700);
        }

        // Ion donor (+) cố định bị bỏ lại bên N-AlGaAs
        const nIon = Math.round(3 + (Math.log10(S.NdN) - 16.5) * 3);
        for (let i = 0; i < nIon; i++) {
          const ix = xJ - 18 - (i % 4) * 24, iy = topY + 22 + Math.floor(i / 4) * 24;
          if (st.prog > 0.2) drawIon(ctx, ix, iy, '+', C.c4, 5.4);
          else dot(ctx, ix, iy, 4.4, C.c2);
        }

        // Electron tụ đặc trong khe tam giác bên n-GaAs
        if (!st.es) st.es = Array.from({ length: 22 }, () => ({ x: rnd(xJ + 6, xJ + 48), y: rnd(yEF + 4, yNotch - 6), vx: gauss() * 26, vy: gauss() * 18 }));
        const nShow = Math.round(6 + clamp(depthMul, 0, 1.2) * 14);
        st.es.forEach((e, i) => {
          if (i >= nShow || st.prog < 0.2) return;
          e.x += e.vx * dt; e.y += e.vy * dt;
          const pondW = 24 + 44 * clamp(depthMul, 0.3, 1.2);
          const maxX = xJ + 8 + ((yNotch - e.y) / Math.max(8, yNotch - yEF)) * pondW;
          if (e.x < xJ + 6) { e.x = xJ + 6; e.vx = Math.abs(e.vx); }
          if (e.x > maxX) { e.x = maxX; e.vx = -Math.abs(e.vx); }
          if (e.y < yEF + 4) { e.y = yEF + 4; e.vy = Math.abs(e.vy); }
          if (e.y > yNotch - 6) { e.y = yNotch - 6; e.vy = -Math.abs(e.vy); }
          dot(ctx, e.x, e.y, 4.6, C.c2);
          txt(ctx, '−', e.x, e.y + 0.5, C.bg, 8.5, 'center', 800);
        });

        if (st.prog > 0.35) {
          arr(ctx, xJ - 24, ySpike + 12, xJ + 16, yNotch - 26, C.main, 2.4);
          chip(ctx, 'Khe tam giác (giam e⁻)', xJ + 74, yNotch - 10, C.c2, 'left');
        }
        txt(ctx, 'N-AlGaAs (E_g rộng · cho electron)', padX + 6, 15, C.c5, 11.5, 'left', 700);
        txt(ctx, 'n-GaAs (E_g hẹp · hứng electron)', padX + bw - 6, 15, C.c2, 11.5, 'right', 700);
        void t;
      }
    },
    {
      title: 'Đồng hồ độ sâu khe tam giác & Mật độ electron dồn về mặt phân cách',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const factor = S.joined ? clamp((S.dEc / 0.35) * (0.55 + (Math.log10(S.NdN) - 16.5) * 0.28), 0.15, 1.3) : 0;
        const ns = factor * 1.1e12; // cm^-2 điển hình của AlGaAs/GaAs
        const depthMeV = factor * 115;

        const pad = 12, gap = 10, mw = (W - pad * 2 - gap) / 2, mh = H - pad * 2;
        drawMeter(ctx, pad, pad, mw, mh, 'Mật độ electron trong khe n_s',
          ns > 0 ? sci(ns, 1) + ' cm⁻²' : '0 (chưa ghép)', clamp(ns / 1.5e12, 0, 1), C.c2);
        drawMeter(ctx, pad + mw + gap, pad, mw, mh, 'Độ sâu đáy khe dưới E_F',
          depthMeV > 1 ? depthMeV.toFixed(0) + ' meV' : '0 meV', clamp(depthMeV / 150, 0, 1), C.main);
      }
    }
  ]
});

/* ==========================================================================
   14. MỤC 8.2 — GIẾNG TAM GIÁC LƯỢNG TỬ: SÓNG ĐỨNG E₀, E₁ (z) & TRƯỢT 2D (x,y)
   ========================================================================== */
LABS.push({
  id: 'well2deg', tag: '8.2', name: 'Giếng 2-DEG', sec: 8,
  S: { F: 1e5, mRatio: 0.067, EF: 125 }, // F in V/cm, EF in meV từ đáy giếng
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Trái: nhốt lượng tử theo phương z (sóng đứng E₀, E₁)  ·  Phải: trượt hoàn toàn tự do trên mặt phẳng (x,y)',
      area: 'a', anim: true,
      ctrls: [
        { k: 'F', l: 'Trường khe F', min: 4.5, max: 5.6, step: 0.05, log: 1, f: v => sci(v, 1) + ' V/cm' },
        { k: 'mRatio', seg: [[0.067, 'GaAs (0.067 m₀)'], [0.19, 'Si (0.19 m₀)']] },
        { k: 'EF', l: 'Mức E_F', min: 50, max: 240, step: 5, f: v => v + ' meV' },
        { btn: 'Ví dụ 8.1', fn: p => { p.S.F = 1e5; p.S.mRatio = 0.067; p.S.EF = 125; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const E0 = triWellLevel(S.mRatio, S.F, 0) * 1000; // meV
        const E1 = triWellLevel(S.mRatio, S.F, 1) * 1000; // meV
        const E2 = triWellLevel(S.mRatio, S.F, 2) * 1000; // meV

        const padX = 14, topY = 30, botY = H - 16, gap = 14;
        const lw = (W - padX * 2 - gap) * 0.50, rw = W - padX * 2 - gap - lw, bh = botY - topY;

        // --- NỬA TRÁI: Giếng thế tam giác V(z) = eFz với sóng đứng lượng tử ---
        rr(ctx, padX, topY, lw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
        const wxL = padX + 20, wxR = padX + lw - 14, wyT = topY + 18, wyB = botY - 14;
        const slopeX = wxL + clamp((wxR - wxL) * (1.28 - (Math.log10(S.F) - 4.5) * 0.56), 56, wxR - wxL);
        ln(ctx, wxL, wyT, wxL, wyB, C.c5, 2.8);
        ln(ctx, wxL, wyB, slopeX, wyT, C.c2, 2.8);

        const eMax = 300; // meV
        // Đường E_F
        const yEF = wyB - clamp(S.EF / eMax, 0.05, 0.95) * (wyB - wyT);
        ln(ctx, wxL, yEF, wxR, yEF, C.err, 1.5, [5, 4]);
        txt(ctx, 'E_F=' + S.EF + ' meV', wxR - 2, yEF - 9, C.err, 10, 'right', 700);

        [
          { E: E0, lbl: 'E₀=' + E0.toFixed(0), col: C.main, lobes: 1 },
          { E: E1, lbl: 'E₁=' + E1.toFixed(0), col: C.c1, lobes: 2 },
          { E: E2, lbl: 'E₂=' + E2.toFixed(0), col: C.mut, lobes: 3 }
        ].forEach(lv => {
          if (lv.E > eMax) return;
          const frac = lv.E / eMax;
          const y = wyB - frac * (wyB - wyT);
          const xEnd = wxL + frac * (slopeX - wxL);
          const occupied = S.EF > lv.E;
          ln(ctx, wxL, y, xEnd, y, lv.col, occupied ? 1.8 : 1, [4, 3]);
          ctx.beginPath();
          for (let i = 0; i <= 34; i++) {
            const u = i / 34, xx = wxL + u * (xEnd - wxL);
            const env = Math.sin(u * Math.PI * lv.lobes) * Math.exp(-u * 0.45);
            const yy = y - env * (occupied ? 15 : 8) * Math.cos(t * (2.5 + lv.lobes * 1.8));
            i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
          }
          ctx.strokeStyle = lv.col; ctx.globalAlpha = occupied ? 1 : 0.4; ctx.lineWidth = occupied ? 2.4 : 1.4; ctx.stroke(); ctx.globalAlpha = 1;
          txt(ctx, lv.lbl + (occupied ? ' ✓' : ''), Math.min(wxR - 2, xEnd + 5), y, lv.col, 10, 'left', occupied ? 700 : 500);
        });
        txt(ctx, 'Phương z: Bị nhốt (lượng tử hóa)', padX + lw / 2, 15, C.main, 11.5, 'center', 700);

        // --- NỬA PHẢI: Mặt phẳng 2D (x,y) — các electron trượt tự do như bi-a trên mặt băng! ---
        const rx = padX + lw + gap;
        rr(ctx, rx, topY, rw, bh, 8); ctx.fillStyle = C.card; ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = C.c2; ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.c2; ctx.lineWidth = 1.4; ctx.stroke();

        // Lưới nghiêng nhẹ tạo cảm giác mặt phẳng 2D (x,y) song song mặt phân cách
        for (let i = 1; i <= 4; i++) {
          const gy = topY + (i / 5) * bh;
          ln(ctx, rx + 8, gy, rx + rw - 8, gy, C.g, 0.8, [3, 4]);
        }

        if (!st.p2 || st.W !== W) {
          st.W = W;
          st.p2 = Array.from({ length: 24 }, () => ({ x: rnd(12, rw - 12), y: rnd(12, bh - 12), vx: gauss() * 75, vy: gauss() * 75 }));
        }
        const nOcc = (S.EF > E0 ? 1 : 0) + (S.EF > E1 ? 1 : 0) + (S.EF > E2 ? 1 : 0);
        const nVis = nOcc === 0 ? 2 : Math.round(clamp(((S.EF - E0) / 140) * 20 + 6, 6, 24));
        st.p2.forEach((q, i) => {
          if (i >= nVis) return;
          q.x += q.vx * dt; q.y += q.vy * dt;
          if (q.x < 8 || q.x > rw - 8) { q.vx = -q.vx; q.x = clamp(q.x, 8, rw - 8); }
          if (q.y < 8 || q.y > bh - 8) { q.vy = -q.vy; q.y = clamp(q.y, 8, bh - 8); }
          const col = (nOcc >= 2 && i % 3 === 0) ? C.c1 : C.c2;
          ln(ctx, rx + q.x - q.vx * 0.08, topY + q.y - q.vy * 0.08, rx + q.x, topY + q.y, col, 1.5);
          dot(ctx, rx + q.x, topY + q.y, 5, col);
          txt(ctx, '−', rx + q.x, topY + q.y + 0.5, C.bg, 9, 'center', 800);
        });
        txt(ctx, 'Mặt phẳng (x,y): Tự do (Khí 2-DEG)', rx + rw / 2, 15, C.c2, 11.5, 'center', 700);
      }
    },
    {
      title: 'Thông số các miền con năng lượng E₀, E₁, độ tách mức & trạng thái điền electron',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const E0 = triWellLevel(S.mRatio, S.F, 0) * 1000;
        const E1 = triWellLevel(S.mRatio, S.F, 1) * 1000;
        const z0Nm = (E0 * 1e-3 / S.F) * 1e7; // độ dày khe ở mức E0 (nm)
        const nOcc = (S.EF > E0 ? 1 : 0) + (S.EF > E1 ? 1 : 0);

        const pad = 12, gap = 10, cw = (W - pad * 2 - gap * 2) / 3, ch = H - pad * 2;
        const cards = [
          { t: 'Mức cơ bản E₀ & Mức E₁', v: E0.toFixed(0) + ' | ' + E1.toFixed(0) + ' meV', sub: 'Cách nhau ΔE = ' + (E1 - E0).toFixed(0) + ' meV', col: C.main },
          { t: 'Bề rộng khe tại mức E₀', v: z0Nm.toFixed(1) + ' nm', sub: 'F tăng → khe ép mỏng → Eₙ tăng F^(2/3)', col: C.c2 },
          { t: 'Số miền con dưới E_F', v: nOcc === 0 ? 'Trống (E_F < E₀)' : (nOcc === 1 ? '1 miền (chỉ E₀)' : '2 miền (E₀ & E₁)'), sub: 'kT(300K) = 25.9 meV', col: nOcc > 0 ? C.c1 : C.mut }
        ];
        cards.forEach((c, i) => {
          const x = pad + i * (cw + gap);
          rr(ctx, x, pad, cw, ch, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = i === 0 ? C.main : C.g; ctx.lineWidth = i === 0 ? 1.5 : 1; ctx.stroke();
          txt(ctx, c.t, x + cw / 2, pad + 18, C.mut, 10.5, 'center', 700);
          txt(ctx, c.v, x + cw / 2, pad + ch * 0.52, c.col, 12.5, 'center', 800);
          txt(ctx, c.sub, x + cw / 2, pad + ch - 15, C.ink, 10, 'center', 600);
        });
      }
    }
  ]
});

/* ==========================================================================
   15. MỤC 8.4 — CẤU TRÚC TRANSISTOR HEMT & ĐIỀU KHIỂN KÊNH 2-DEG BẰNG CỔNG
   ========================================================================== */
LABS.push({
  id: 'hemt', tag: '8.4', name: 'HEMT', sec: 8,
  S: { VG: 0.2, mode: 'hemt', d: 30 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Mặt cắt Transistor HEMT: kéo V_G để bóp/mở cao tốc 2-DEG sạch ion, hoặc so với kênh pha tạp thường!',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VG', l: 'Áp cổng V_G', min: -1.1, max: 0.6, step: 0.05, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + ' V' },
        { k: 'mode', seg: [['hemt', 'HEMT (2-DEG sạch ion)'], ['doped', 'Kênh pha tạp thường']] },
        { k: 'd', l: 'Bề dày AlGaAs d', min: 15, max: 60, step: 5, f: v => v + ' nm' }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const Voff = -0.80;
        const openFrac = clamp((S.VG - Voff) / (0.6 - Voff), 0, 1);

        const padX = 18, topY = 44, botY = H - 14, bw = W - padX * 2, bh = botY - topY;
        const alH = bh * clamp(0.24 + (S.d / 60) * 0.22, 0.26, 0.46), yIface = topY + alH;
        const sW = bw * 0.16, gW = bw * 0.34, dW = bw * 0.16, gX = padX + (bw - gW) / 2, elecH = 18;

        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.14; ctx.fillStyle = C.c5; ctx.fillRect(padX, topY, bw, alH);
        ctx.globalAlpha = 0.07; ctx.fillStyle = C.c2; ctx.fillRect(padX, yIface, bw, bh - alH);
        ctx.restore();
        ln(ctx, padX, yIface, padX + bw, yIface, C.c2, 1.8);

        rr(ctx, padX + 6, topY - elecH, sW, elecH, 4); ctx.fillStyle = C.c1; ctx.fill();
        txt(ctx, 'Source', padX + 6 + sW / 2, topY - elecH / 2, C.bg, 11, 'center', 800);
        rr(ctx, gX, topY - elecH, gW, elecH, 4); ctx.fillStyle = C.main; ctx.fill();
        txt(ctx, 'Gate (V_G=' + (S.VG >= 0 ? '+' : '') + S.VG.toFixed(2) + 'V)', gX + gW / 2, topY - elecH / 2, C.bg, 10.5, 'center', 800);
        rr(ctx, padX + bw - dW - 6, topY - elecH, dW, elecH, 4); ctx.fillStyle = C.c1; ctx.fill();
        txt(ctx, 'Drain (+)', padX + bw - dW / 2 - 6, topY - elecH / 2, C.bg, 11, 'center', 800);

        const isHEMT = S.mode === 'hemt';
        const nIonCols = Math.max(6, Math.floor(bw / 46));
        for (let i = 0; i < nIonCols; i++) {
          const ix = padX + (i + 0.5) * (bw / nIonCols);
          drawIon(ctx, ix, topY + alH * 0.45, '+', C.c4, 5.4);
          if (!isHEMT) drawIon(ctx, ix, yIface + 14, '+', C.err, 5.6);
        }

        const gateDepH = alH * (0.35 + (1 - openFrac) * 0.85);
        ctx.save(); ctx.globalAlpha = 0.24; ctx.fillStyle = C.main;
        ctx.beginPath();
        ctx.moveTo(gX - 8, topY); ctx.lineTo(gX + gW + 8, topY);
        ctx.quadraticCurveTo(gX + gW + 6, topY + gateDepH, gX + gW * 0.5, topY + gateDepH + 6);
        ctx.quadraticCurveTo(gX - 6, topY + gateDepH, gX - 8, topY);
        ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.main; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);

        const laneH = 14 + openFrac * 12;
        if (openFrac > 0.02) {
          ctx.save(); ctx.globalAlpha = 0.14 + 0.26 * openFrac; ctx.fillStyle = C.c2;
          ctx.fillRect(padX + 4, yIface + 2, bw - 8, laneH); ctx.restore();
        }

        if (!st.es || st.W !== W) {
          st.W = W; st.fl = [];
          st.es = Array.from({ length: 28 }, () => ({ x: rnd(padX + 12, padX + bw - 12), yOff: rnd(4, 18), vx: 120, vy: 0 }));
        }
        const nActive = Math.round(openFrac * 28);
        st.es.forEach((e, i) => {
          if (i >= nActive) return;
          if (isHEMT) {
            e.vx = 180 + openFrac * 150;
            e.x += e.vx * dt;
            e.yOff = clamp(e.yOff + Math.sin(t * 6 + i) * 4 * dt, 5, laneH - 4);
          } else {
            if (Math.random() < dt * 6.5) {
              e.vx = rnd(25, 65); e.vy = gauss() * 48;
              st.fl.push({ x: e.x, y: yIface + e.yOff, a: 1 });
            }
            e.vx = Math.min(110, e.vx + 80 * dt);
            e.x += e.vx * dt;
            e.yOff = clamp(e.yOff + e.vy * dt, 5, laneH + 8);
          }
          if (e.x > padX + bw - 10) e.x = padX + 10;
          const ey = yIface + e.yOff;
          if (isHEMT) ln(ctx, e.x - 14, ey, e.x, ey, C.c2, 1.8);
          dot(ctx, e.x, ey, 4.8, C.c2);
          txt(ctx, '−', e.x, ey + 0.5, C.bg, 9, 'center', 800);
        });

        st.fl = (st.fl || []).filter(f => (f.a -= dt * 3) > 0);
        st.fl.forEach(f => {
          ctx.beginPath(); ctx.arc(f.x, f.y, 4 + (1 - f.a) * 12, 0, TAU2);
          ctx.strokeStyle = C.err; ctx.globalAlpha = f.a; ctx.lineWidth = 1.6; ctx.stroke(); ctx.globalAlpha = 1;
        });

        txt(ctx, 'N-AlGaAs (lớp cung cấp donor +)', padX + 8, topY + 13, C.c5, 10.5, 'left', 700);
        txt(ctx, 'i-GaAs (không pha tạp · sạch hoàn toàn)', padX + 8, botY - 12, C.mut, 10.5, 'left', 600);
        chip(ctx, openFrac <= 0.02 ? 'KÊNH BỊ KHÓA (V_G ≤ V_off = −0.80V)'
          : (isHEMT ? 'Cao tốc 2-DEG sạch ion → độ linh động cực cao!' : 'Kênh pha tạp thường: va chạm ion đỏ → chậm & nhiễu!'),
          W / 2, botY - 30, openFrac <= 0.02 ? C.err : (isHEMT ? C.c2 : C.c5), 'center');
      }
    },
    {
      title: 'Đồng hồ mật độ mặt 2-DEG  n_s = ε_s(V_G − V_off)/(ed)  &  Dòng máng I_DS',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, Voff = -0.80;
        const openFrac = clamp((S.VG - Voff) / (0.6 - Voff), 0, 1);
        const eps = SEMIS.AlGaAs.er * EPS0_CM;
        const ns = openFrac > 0 ? (eps * (S.VG - Voff)) / (E_CHG * S.d * 1e-7) : 0;
        const iFrac = openFrac * (S.mode === 'hemt' ? 1.0 : 0.36) * clamp(30 / S.d, 0.45, 1.2);

        const pad = 12, gap = 10, mw = (W - pad * 2 - gap) / 2, mh = H - pad * 2;
        drawMeter(ctx, pad, pad, mw, mh, 'Mật độ mặt 2-DEG (mô hình tụ)',
          ns > 0 ? sci(ns, 2) + ' cm⁻²' : '0 (Kênh tắt)', clamp(ns / 5e12, 0, 1), C.main);
        drawMeter(ctx, pad + mw + gap, pad, mw, mh, 'Dòng Drain I_DS',
          openFrac <= 0.02 ? 'TẮT (0 mA)' : (S.mode === 'hemt' ? 'HEMT cao tốc (' + Math.round(iFrac * 100) + '%)' : 'Bị tán xạ (' + Math.round(iFrac * 100) + '%)'),
          iFrac, S.mode === 'hemt' ? C.c2 : C.c5);
      }
    }
  ]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM CHO ĐỦ 15 MÔ HÌNH TƯƠNG TÁC
   ========================================================================== */
const LD = {};
LD.ms = {
  intro: [
    ['i', 'Kim loại có công thoát φ_m, bán dẫn n có ái lực χ và công thoát φ_s = χ + φ_n.'],
    ['w', 'Khi φ_m > φ_s và ghép sát: electron tự do từ bán dẫn tràn sang kim loại để san phẳng mức Fermi E_F.'],
    ['w', 'Bán dẫn mất electron nên lộ ion donor (+) cố định (vùng nghèo W); mặt kim loại tích một lớp điện tích âm mỏng.'],
    ['i', 'Có hai hàng rào: từ kim loại là φ_B0 = φ_m − χ (không phụ thuộc N_d); từ bán dẫn là V_bi = φ_B0 − φ_n.'],
    ['v', 'Mặc định khớp Ví dụ 1.1: Au/Si (N_d=10¹⁶) → φ_B0 = 1,09 V, φ_n = 0,206 V, V_bi = 0,884 V.']
  ],
  react(S, k, P, say) {
    const m = schottkyCalc(S.phiM, S.sc, S.Nd, 300, 0);
    if (k === 'joined') say(S.joined ? 'w' : 'i', S.joined ? 'Đang ghép M–S: electron di chuyển để đưa hai mực E_F về ngang bằng nhau.' : 'Đã tách rời: hai khối đứng độc lập với hai mực Fermi khác nhau.');
    else if (!m.isRect) say('w', `φ_m (${S.phiM.toFixed(2)}V) ≤ φ_s (${m.phiS.toFixed(2)}V): tạo lớp tích lũy electron → tiếp xúc OHMIC!`);
    else {
      say('v', `${S.metal}/${S.sc} (N_d=${pw(S.Nd)}): φ_B0 = ${m.phiB0.toFixed(3)} V, V_bi = ${m.Vbi.toFixed(3)} V, W = ${fmtLen(m.W)}.`);
      if (k === 'Nd') say('w', 'Đổi N_d không hề làm đổi φ_B0 lý tưởng, nhưng làm đổi φ_n nên V_bi và W thay đổi.');
    }
  }
};
LD.bias = {
  intro: [
    ['i', 'Phân cực NGƯỢC (+ vào bán dẫn): rào bán dẫn dâng thành V_bi + V_R, vùng nghèo phình to, |E_max| tăng mạnh.'],
    ['w', 'Phân cực THUẬN (+ vào kim loại): rào bán dẫn hạ còn V_bi − V_a → electron đa số vượt ào ạt sang kim loại!'],
    ['i', 'Điểm khác biệt quan trọng: hàng rào φ_B0 nhìn từ phía kim loại KHÔNG đổi theo điện áp → J_{m→s} đứng yên.'],
    ['v', 'Mặc định khớp Ví dụ 2.1 (Au/Si, V_R=5 V): W = 0,873 µm, |E_max| = 1,35×10⁵ V/cm.']
  ],
  react(S, k, P, say) {
    const m = schottkyCalc(METALS[S.metal].phi, S.sc, S.Nd, 300, S.Va);
    if (S.Va > 0.02) say('v', `THUẬN +${S.Va.toFixed(2)} V: rào bán dẫn hạ còn ${m.Veff.toFixed(2)} V, W co còn ${fmtLen(m.W)}, J_{s→m} áp đảo J_{m→s}.`);
    else say('v', `NGƯỢC V_R = ${(-S.Va).toFixed(2)} V: W = ${fmtLen(m.W)}, |E_max| = ${sci(m.Emax, 2)} V/cm.`);
  }
};
LD.cv = {
  intro: [
    ['i', 'Tiếp xúc Schottky giống tiếp giáp một phía p⁺n: toàn bộ vùng nghèo nằm trong bán dẫn (W = xₙ).'],
    ['w', 'Vặn V_R tăng lên, biên W quét sâu sang phải như pít-tông; tín hiệu AC nhỏ dV_R làm rung lớp điện tích ±dQ\' ở hai mép để đo C\' = ε_s/W.'],
    ['i', 'Từ độ nhạy C\' theo V_R (độ dốc 1/C\'²), máy LCR giải mã chính xác N_d, ngoại suy V_bi rồi suy ra hàng rào φ_Bn = V_bi + φ_n.'],
    ['v', 'Thử đổi giữa mẫu Au/Si, W/Si, W/GaAs hoặc chỉnh N_d thật để xem pít-tông quét sâu hay nông!']
  ],
  react(S, k, P, say) {
    const m = schottkyCalc(METALS[S.metal].phi, S.sc, S.Nd, 300, -S.VR);
    say('v', `${S.metal}/${S.sc}, V_R=${S.VR.toFixed(1)}V: W=${fmtLen(m.W)}, C\'=${(m.Cp * 1e9).toFixed(2)} nF/cm², φ_Bn=${m.phiB0.toFixed(3)} V.`);
  }
};
LD.image = {
  intro: [
    ['i', 'Một electron (−e) đi gần mặt kim loại cảm nhận lực hút như thể có ảnh gương (+e) nằm đối xứng bên kia mặt gương.'],
    ['w', 'Cộng thế năng lực ảnh với điện trường vùng nghèo E làm đỉnh hàng rào bị bo tròn, dịch vào x_m và tụt thấp xuống Δφ.'],
    ['i', 'Công thức: x_m = √(e / 16πε_s E) và Δφ = √(eE / 4πε_s) = 2·E·x_m.'],
    ['w', 'Khi V_R tăng → E tăng → Δφ tăng → hàng rào thấp đi → dòng ngược của điốt Schottky tăng theo V_R!'],
    ['v', 'Mặc định khớp Ví dụ 3.1 (Si, E=10⁵ V/cm): x_m = 1,75 nm, Δφ = 35 mV.']
  ],
  react(S, k, P, say) {
    const eps = SEMIS[S.sc].er * EPS0_CM;
    const xmNm = Math.sqrt(E_CHG / (16 * Math.PI * eps * S.E)) * 1e7;
    const dPhi = Math.sqrt((E_CHG * S.E) / (4 * Math.PI * eps));
    say('v', `${S.sc}, E = ${sci(S.E, 1)} V/cm → x_m = ${xmNm.toFixed(2)} nm, hạ rào Δφ = ${(dPhi * 1000).toFixed(1)} mV (dòng rò tăng ×${Math.exp(dPhi / 0.0259).toFixed(1)}).`);
  }
};
LD.pin = {
  intro: [
    ['i', 'Thí nghiệm thực tế cho thấy hàng rào φ_Bn thường không đổi mạnh theo công thoát kim loại như công thức lý tưởng φ_m − χ.'],
    ['w', 'Nguyên nhân: mật độ trạng thái bẫy bề mặt D_it lớn tại mặt phân cách sẽ tích điện và "khóa chặt" (ghim) mức Fermi tại eφ₀.'],
    ['i', 'Khi D_it rất lớn: φ_Bn ≈ (E_g − eφ₀)/e — gần như KHÔNG phụ thuộc chọn kim loại nào!'],
    ['v', 'Hãy kéo D_it từ 0% lên 100% và nhìn 4 cột Al · W · Au · Pt phía dưới từ bậc thang dần san bằng nhau!']
  ],
  react(S, k, P, say) {
    const sc = SEMIS[S.sc], phiId = clamp(METALS[S.metal].phi - sc.chi, 0.06, sc.Eg - 0.04), phiPin = sc.Eg - sc.phi0;
    const phiAct = (1 - S.Dit) * phiId + S.Dit * phiPin;
    say('v', `${S.metal}/${S.sc}, D_it = ${Math.round(S.Dit * 100)}%: lý tưởng ${phiId.toFixed(2)} V → thực tế ${phiAct.toFixed(2)} V.`);
    if (S.Dit > 0.7) say('w', 'Đang bị GHIM chặt: đổi Al, W, Au hay Pt thì cả 4 hàng rào vẫn gần như bằng nhau!');
  }
};
LD.therm = {
  intro: [
    ['i', 'Dòng điốt Schottky sinh ra từ phát xạ nhiệt điện tử: electron đa số đủ nóng nhảy qua đỉnh hàng rào φ_Bn.'],
    ['w', 'J = J_sT [exp(eV_a/kT) − 1], với J_sT = A* T² exp(−eφ_Bn/kT).'],
    ['w', 'Vì φ_Bn nằm trên số mũ, tăng φ_Bn thêm chỉ 0,1 V làm J_sT tụt giảm khoảng 48 lần!'],
    ['v', 'Mặc định khớp Ví dụ 4.1 (φ_Bn = 0,8 V, 300 K): J_sT = 4,2×10⁻⁷ A/cm², ở V_a = 0,44 V dòng đạt ~10 A/cm².']
  ],
  react(S, k, P, say) {
    const Vt = vtOf(S.T);
    const dPhi = (S.imgOn && S.Va < 0) ? 0.028 * Math.sqrt(1 + (-S.Va) * 2.5) : 0;
    const JsT = S.Astar * S.T * S.T * Math.exp(-Math.max(0.1, S.phiBn - dPhi) / Vt);
    const J = JsT * (Math.exp(clamp(S.Va / Vt, -35, 32)) - 1);
    say('v', `T=${S.T}K, φ_Bn=${S.phiBn.toFixed(2)}V, V_a=${S.Va.toFixed(2)}V → J_sT=${sci(JsT, 2)}, J=${sci(J, 2)} A/cm².`);
    if (k === 'T') say('w', S.T > (P.T || 300) ? 'Nhiệt độ tăng: nhiều electron "nóng" hơn hẳn → vượt rào ồ ạt, J_sT tăng vọt!' : 'Lạnh đi: số hạt nóng tụt mạnh theo hàm mũ.');
  }
};
LD.von = {
  intro: [
    ['i', 'Cả điốt Schottky và điốt p-n đều có dòng tăng theo hàm mũ exp(eV_a/kT), nhưng dòng bão hòa J_sT của Schottky lớn hơn J_s của p-n hàng triệu lần!'],
    ['w', 'Do V_a = V_t ln(J / J_s), ở cùng mật độ dòng mục tiêu, điốt Schottky cần điện áp mở THẤP hơn hẳn điốt p-n.'],
    ['v', 'Mặc định khớp Ví dụ 5.1 (tại 10 A/cm²): Schottky mở ở 0,312 V, điốt p-n tận 0,682 V (chênh 0,37 V). Kéo V_a từ 0V lên 0,8V xem hai bóng đèn!']
  ],
  react(S, k, P, say) {
    const Vt = 0.0259, JsSch = 120 * 300 * 300 * Math.exp(-S.phiBn / Vt), JsPN = 3.7e-11;
    say('v', `V_a = ${S.Va.toFixed(2)} V | Mốc ${S.Jtar} A/cm²: Schottky mở ở ${(Vt * Math.log(S.Jtar / JsSch)).toFixed(3)} V, p-n ở ${(Vt * Math.log(S.Jtar / JsPN)).toFixed(3)} V.`);
    if (k === 'Va' && S.Va > 0.30 && S.Va < 0.62) say('w', 'Khoảng 0,32–0,60 V: đèn nhánh Schottky đã sáng rực trong khi nhánh p-n vẫn tối om!');
  }
};
LD.switch = {
  intro: [
    ['i', 'Ưu điểm số 1 của điốt Schottky trong mạch RF & nguồn xung là tốc độ chuyển mạch siêu nhanh (cỡ picô giây).'],
    ['w', 'Điốt p-n dẫn thuận bằng cách bơm lỗ trống thiểu số sang vùng n, tạo một "đám mây" điện tích tích trữ Q_s.'],
    ['w', 'Khi gạt sang NGƯỢC, điốt p-n phải mất thời gian phục hồi ngược t_rr (~ns) để rút cạn đám mây đỏ này mới khóa dòng được!'],
    ['i', 'Điốt Schottky chỉ dùng electron đa số nên Q_s = 0 → khóa ngay lập tức không có xung dòng xả ngược.'],
    ['v', 'Hãy bấm nút "Gạt sang NGƯỢC!" để xem trực tiếp sự khác biệt giữa hai buồng.']
  ],
  react(S, k, P, say) {
    if (k === 'sw') say(S.sw === 'rev' ? 'w' : 'i', S.sw === 'rev'
      ? 'Đã gạt sang NGƯỢC: Schottky khóa tức thì (~ps), còn điốt p-n xuất hiện xung dòng ngược đỏ xả hết đám mây thiểu số!'
      : 'Đã gạt sang THUẬN: điốt p-n đang bơm đầy đám mây lỗ trống thiểu số sang vùng n.');
    else say('v', `Mức dòng thuận ${S.Ifwd.toFixed(1)}×: dòng thuận càng lớn thì đám mây thiểu số tích trữ bên p-n càng đậm, khóa càng lâu.`);
  }
};
LD.ohmicIdeal = {
  intro: [
    ['i', 'Tiếp xúc Ohmic lý tưởng không tạo vùng nghèo mà tạo lớp TÍCH LŨY hạt đa số ngay sát bề mặt kim loại.'],
    ['w', 'Với bán dẫn loại n cần φ_m < φ_s (lớp tích lũy electron); với loại p lại ĐẢO NGƯỢC: cần φ_m > φ_s (lớp tích lũy lỗ trống).'],
    ['i', 'Khi là Ohmic, tiếp xúc dẫn mượt cả khi đặt +V lẫn −V (hai đèn thử phía dưới cùng sáng xanh).'],
    ['v', 'Thử kéo φ_m vượt qua φ_s và đảo loại n ⇄ p để thấy điều kiện chỉnh lưu đảo chiều!']
  ],
  react(S, k, P, say) {
    const phiS = S.scType === 'n' ? 4.21 : 4.93;
    const ok = S.scType === 'n' ? (S.phiM <= phiS) : (S.phiM >= phiS);
    say(ok ? 'w' : 'v', ok
      ? `Loại ${S.scType}, φ_m = ${S.phiM.toFixed(2)} V: hình thành lớp tích lũy → OHMIC, thông mạch cả +V và −V!`
      : `Loại ${S.scType}, φ_m = ${S.phiM.toFixed(2)} V: tạo vùng nghèo Schottky → một chiều bị chặn!`);
  }
};
LD.ohmicTun = {
  intro: [
    ['i', 'Trong thực tế mức Fermi hay bị ghim nên vẫn tồn tại hàng rào φ_Bn cao (~0,8 V) bất kể chọn kim loại nào.'],
    ['w', 'Giải pháp công nghệ: pha tạp cực nặng (n⁺ ~ 10¹⁹–10²⁰ cm⁻³) ở lớp bề mặt để ép vùng nghèo W ∝ 1/√N_d mỏng còn vài nm!'],
    ['w', 'Khi W chỉ cỡ vài nm, electron không cần leo đỉnh tường mà XUYÊN HẦM lượng tử tự do theo cả 2 chiều.'],
    ['i', 'Khi N_d tăng 100 lần (10¹⁷ → 10¹⁹): W giảm 10 lần (102 nm → 10 nm), E₀₀ tăng 10 lần và R_c giảm hàng triệu lần!'],
    ['v', 'Thử bấm 2 nút Ví dụ 6.1 (10¹⁷ vs 10¹⁹) để thấy tường rào co ép và sóng electron xuyên hầm.']
  ],
  react(S, k, P, say) {
    const eps = SEMIS.Si.er * EPS0_CM;
    const W_cm = Math.sqrt((2 * eps * S.phiBn) / (E_CHG * S.Nd));
    const E00 = tunnelE00('Si', S.Nd);
    say('v', `N_d = ${pw(S.Nd)} → tường dày W = ${fmtLen(W_cm)}, E₀₀ = ${(E00 * 1000).toFixed(1)} meV, eφ_Bn/E₀₀ = ${(S.phiBn / E00).toFixed(1)}.`);
    say('w', E00 >= 0.018 ? 'Đã vào chế độ xuyên hầm mạnh: dẫn mượt hai chiều (Ohmic tốt)!' : 'Tường vẫn quá dày — cần tăng N_d lên cỡ 10¹⁹ cm⁻³ để xuyên hầm.');
  }
};
LD.anderson = {
  intro: [
    ['i', 'Quy tắc Anderson: treo cả hai bán dẫn từ cùng mức chân không E_vac xuống một khoảng bằng ái lực điện tử χ₁, χ₂.'],
    ['w', 'Chênh lệch giữa hai đáy vùng dẫn là ΔE_c = e|χ₁ − χ₂|; với kiểu bao trùm (Straddling) thì ΔE_c + ΔE_v = ΔE_g.'],
    ['w', 'Tùy độ sâu χ và bề rộng E_g, có 3 kiểu dị tiếp giáp: Bao trùm (Ge/GaAs, GaAs/AlAs), So le (Si/Ge) và Vùng cấm gãy (InAs/GaSb).'],
    ['v', 'Mặc định khớp Ví dụ 7.1 (Ge/GaAs): ΔE_c = 0,06 eV, ΔE_v = 0,70 eV (92% rơi vào vùng hóa trị).']
  ],
  react(S, k, P, say) {
    const dEc = Math.abs(S.chi1 - S.chi2), dEv = Math.abs((S.chi1 + S.Eg1) - (S.chi2 + S.Eg2));
    say('v', `${S.n1}/${S.n2}: ΔE_c = ${dEc.toFixed(2)} eV, ΔE_v = ${dEv.toFixed(2)} eV.`);
    if (k === 'preset') say('w', 'Quan sát vị trí hai vùng cấm màu xanh và hồng: có nằm lồng vào nhau, lệch so le, hay tách rời hẳn không?');
  }
};
LD.hetNP = {
  intro: [
    ['i', 'Ở dị tiếp giáp dị loại nP, hai vật liệu có hằng số điện môi khác nhau (ε₁ ≠ ε₂), nhưng điện tích ion vùng nghèo vẫn trung hòa: N_d xₙ = Nₐ x_P.'],
    ['w', 'Tại mặt phân cách x = 0, độ điện dịch ε₁E₁ = ε₂E₂ liên tục nên điện trường E có bước nhảy đột ngột (E₂/E₁ = ε₁/ε₂)!'],
    ['i', 'Hệ quả: dù N_d = Nₐ (nên xₙ = x_P), phía có hằng số điện môi ε_r NHỎ hơn sẽ có E lớn hơn và gánh phần thế V_bi lớn hơn.'],
    ['v', 'Mặc định khớp Ví dụ 7.2 (n-Ge/P-GaAs, 10¹⁶): xₙ = x_P = 0,284 µm, V_bin = 0,455 V < V_biP = 0,556 V (vì ε_GaAs=13,1 < ε_Ge=16).']
  ],
  react(S, k, P, say) {
    const map = { Ge_GaAs: ['Ge', 'GaAs'], GaAs_AlAs: ['GaAs', 'AlAs'], Si_Ge: ['Ge', 'Si'] };
    const [k1, k2] = map[S.pair] || ['Ge', 'GaAs'];
    const s1 = SEMIS[k1], s2 = SEMIS[k2], eps1 = s1.er * EPS0_CM, eps2 = s2.er * EPS0_CM, Vt = 0.0259;
    const Vbi = Math.max(0.12, Math.abs((s2.chi + s2.Eg - Vt * Math.log(Math.max(1.1, s2.Nv / S.Na))) - (s1.chi + Vt * Math.log(Math.max(1.1, s1.Nc / S.Nd)))));
    const xn = Math.sqrt((2 * eps1 * eps2 * S.Na * Vbi) / (E_CHG * S.Nd * (eps1 * S.Nd + eps2 * S.Na)));
    const xP = xn * (S.Nd / S.Na);
    say('v', `n-${s1.name}/P-${s2.name}: xₙ = ${fmtLen(xn)}, x_P = ${fmtLen(xP)}, bước nhảy E₂/E₁ = ${(s1.er / s2.er).toFixed(2)}.`);
  }
};
LD.hetNN = {
  intro: [
    ['i', 'Dị tiếp giáp đẳng loại N-AlGaAs (E_g rộng) ghép n-GaAs (E_g hẹp): mức Fermi ban đầu bên AlGaAs cao hơn GaAs.'],
    ['w', 'Khi ghép lại, electron từ donor bên N-AlGaAs đổ thác qua bậc ΔE_c sang n-GaAs để cân bằng E_F.'],
    ['w', 'Ion donor (+) ở lại AlGaAs kéo vùng dẫn bên GaAs cong mạnh xuống DƯỚI E_F → tạo thành KHE TAM GIÁC giam electron!'],
    ['i', 'Điều tuyệt vời: electron tụ trong khe nằm ở bên GaAs, tách rời hoàn toàn khỏi các ion donor bên AlGaAs.'],
    ['v', 'Thử tách rồi ghép, hoặc tăng N_d (AlGaAs) và ΔE_c để thấy hồ electron trong khe sâu và dày thêm!']
  ],
  react(S, k, P, say) {
    if (k === 'joined') say(S.joined ? 'w' : 'i', S.joined ? 'Đã ghép n-N: electron đổ thác từ N-AlGaAs sang tụ trong khe tam giác bên GaAs!' : 'Đã tách rời: chưa có trao đổi electron và chưa hình thành khe tam giác.');
    else say('v', `N_d(AlGaAs) = ${pw(S.NdN)}, ΔE_c = ${S.dEc.toFixed(2)} eV: pha tạp càng cao & bậc ΔE_c càng lớn thì hồ electron càng sâu.`);
  }
};
LD.well2deg = {
  intro: [
    ['i', 'Khe tam giác ở mặt phân cách AlGaAs/GaAs chỉ mỏng vài nanomet → electron bị giam giữ lượng tử theo phương z!'],
    ['w', 'Trái (phương z): electron chỉ được tồn tại ở các trạng thái sóng dừng rời rạc E₀, E₁, E₂... với Eₙ ∝ F^(2/3).'],
    ['w', 'Phải (mặt phẳng x,y): electron hoàn toàn TỰ DO trượt như bi-a trên mặt băng mỏng → Khí điện tử 2 chiều (2-DEG).'],
    ['v', 'Mặc định khớp Ví dụ 8.1 (GaAs, m*=0,067m₀, F=10⁵ V/cm): E₀ ≈ 89 meV, E₁ ≈ 157 meV (cách nhau 68 meV > kT).']
  ],
  react(S, k, P, say) {
    const E0 = triWellLevel(S.mRatio, S.F, 0) * 1000, E1 = triWellLevel(S.mRatio, S.F, 1) * 1000;
    const nOcc = (S.EF > E0 ? 1 : 0) + (S.EF > E1 ? 1 : 0);
    say('v', `F = ${sci(S.F, 1)} V/cm, m* = ${S.mRatio}m₀ → E₀ = ${E0.toFixed(0)} meV, E₁ = ${E1.toFixed(0)} meV (${nOcc} miền con dưới E_F).`);
    if (k === 'F') say('w', S.F > (P.F || 1e5) ? 'Trường khe F mạnh hơn → khe ép hẹp lại → các mức lượng tử E₀, E₁ dâng cao lên!' : 'Trường khe F yếu đi → khe mở rộng hơn → các mức E₀, E₁ hạ thấp xuống.');
  }
};
LD.hemt = {
  intro: [
    ['i', 'Transistor HEMT ghép trọn kiến thức của buổi: lớp N-AlGaAs trên cấp electron, lớp i-GaAs sạch bên dưới tạo cao tốc 2-DEG.'],
    ['w', 'Vì tách riêng khỏi ion donor (+), electron lướt từ Source sang Drain mà KHÔNG bị tán xạ tạp chất → siêu nhanh, cực ít nhiễu.'],
    ['w', 'Kéo áp cổng V_G âm dần: vùng nghèo cổng đẩy xuống như pít-tông bóp cạn mật độ mặt n_s = ε_s(V_G − V_off)/(ed) cho đến khi khóa hẳn!'],
    ['v', 'Bấm nút "Kênh pha tạp thường" để thấy ngay ion donor nằm trên đường chạy cản trở electron thế nào!']
  ],
  react(S, k, P, say) {
    const Voff = -0.80;
    if (k === 'mode') say('w', S.mode === 'hemt'
      ? 'HEMT (2-DEG sạch ion): electron lướt thẳng băng từ Source → Drain với tốc độ cực cao!'
      : 'Kênh pha tạp thường: ion đỏ nằm ngay trong kênh khiến electron va chạm tán xạ liên tục, dòng tụt mạnh!');
    else {
      const eps = SEMIS.AlGaAs.er * EPS0_CM;
      const ns = S.VG > Voff ? (eps * (S.VG - Voff)) / (E_CHG * S.d * 1e-7) : 0;
      say('v', `V_G = ${S.VG.toFixed(2)} V, d = ${S.d} nm → n_s = ${ns > 0 ? sci(ns, 2) + ' cm⁻²' : '0 (Kênh đã khóa!)'}.`);
    }
  }
};
LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (#lab10 — đồng bộ 100% phong cách & biến màu CSS của lab-b7.js)
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
#lab10 .lb-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
#lab10 .lb-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
#lab10 .lb-p.glow{animation:lb10glow 1.4s ease-out}
@keyframes lb10glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
#lab10 .lb-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
#lab10 .lb-cv{flex:1;min-height:0;position:relative}
#lab10 .lb-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#lab10 .lb-c{display:flex;flex-wrap:wrap;gap:6px 14px;padding:4px 10px 8px;flex:none;align-items:center}
#lab10 .lb-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
#lab10 .lb-k input[type=range]{width:clamp(70px,8vw,120px);margin:0}
#lab10 .lb-k output{color:var(--ink);font-weight:700;min-width:3.2em}
#lab10 .lb-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
#lab10 .lb-seg button,#lab10 .lb-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer}
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
@media(max-width:900px){#lab10 .lb-win{width:100vw;height:100dvh;border-radius:0}#lab10 .lb-b{overflow:auto;display:flex;flex-direction:column}#lab10 .lb-p{min-height:260px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style');
sty.textContent = CSS;
document.head.appendChild(sty);

let timers = [], ros = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'ms';

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
    try { p.spec.draw(p, ctx, p.W, p.H, tAcc, dt); } catch (err) { console.error('[LabB10]', err); }
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

/* ---------- gắn biểu tượng bình thí nghiệm nhỏ cạnh tiêu đề Buổi 10 (1–1 cho đủ 15 mỏ neo) ---------- */
const H2MAP = { 1: 'ms', 2: 'bias', 3: 'image', 4: 'therm', 5: 'von', 6: 'ohmicIdeal', 7: 'anderson', 8: 'well2deg' };
const H3MAP = [
  [/^1\.3/, 'ms', 0],         [/^1\.4/, 'ms', 0],         [/^1\.5/, 'ms', 1],
  [/^2\.1/, 'bias', 0, { Va: -5 }], [/^2\.2/, 'bias', 0, { Va: 0.45 }],
  [/^2\.3/, 'bias', 0],       [/^2\.5/, 'cv', 0],         [/^2\.6/, 'cv', 0],
  [/^3\.1/, 'image', 0],      [/^3\.2/, 'image', 0],
  [/^3\.3/, 'pin', 0],        [/^3\.4/, 'pin', 0],
  [/^4\.1/, 'therm', 0],      [/^4\.2/, 'therm', 1],      [/^4\.3/, 'therm', 0],
  [/^5\.2/, 'von', 1],        [/^5\.3/, 'switch', 0, { sw: 'rev' }],
  [/^5\.4/, 'von', 0],        [/^5\.5/, 'switch', 0],
  [/^6\.2/, 'ohmicIdeal', 0], [/^6\.3/, 'ohmicIdeal', 0],
  [/^6\.4/, 'ohmicTun', 0],   [/^6\.5/, 'ohmicTun', 0],
  [/^7\.2/, 'anderson', 0],   [/^7\.3/, 'anderson', 0],
  [/^7\.5/, 'hetNP', 1],      [/^7\.6/, 'hetNP', 0],
  [/^7\.7/, 'hetNN', 0],      [/^7\.8/, 'hetNN', 0],
  [/^8\.1/, 'well2deg', 0],   [/^8\.2/, 'well2deg', 0],
  [/^8\.3/, 'hemt', 0],       [/^8\.4/, 'hemt', 0]
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
window.LabB10 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
