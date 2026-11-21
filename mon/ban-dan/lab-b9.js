/* ==========================================================================
   lab-b9.js — PHÒNG THÍ NGHIỆM MÔ PHỎNG BUỔI 9: TIẾP GIÁP p-n
   - Hoàn toàn trực quan (hạt, ion, dốc thế năng, đường sức, mạch pin, đồng hồ
     kim, máy đo LCR, mạch đài LC) — KHÔNG dùng đồ thị/biểu đồ trục tọa độ.
   - Đồng bộ màu sắc CSS, bố cục popup 95% và nhật ký thí nghiệm như lab-b7.js.
   - 8 tab phủ trọn Buổi 9:
       1  · Ghép p-n         (Mục 1.2)
       2a · Đồi thế V_bi     (Mục 2.3)
       2b · Thăm dò vùng nghèo (Mục 2.7)
       3a · Phân cực ngược   (Mục 3.3)
       3b · Máy đo C-V       (Mục 3.6)
       4  · Đánh thủng       (Mục 4.1)
       5a · So sánh pha tạp  (Mục 5.2)
       5b · Đài LC biến dung (Mục 5.4)
   - API: LabB9.open(tabId?, panelIndex?)  LabB9.close()  LabB9.mark(root)
   ========================================================================== */
(function () {
'use strict';

/* ---------- hằng số & tiện ích ---------- */
const TAU2 = Math.PI * 2;
const E_CHG = 1.6e-19;        // C
const EPS0 = 8.85e-14;        // F/cm
const KB = 8.617e-5;          // eV/K
const rnd = (a, b) => a + Math.random() * (b - a);
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU2 * v); };
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
  return um >= 10 ? um.toFixed(1) + ' µm' : um >= 1 ? um.toFixed(2) + ' µm' : um >= 0.01 ? um.toFixed(3) + ' µm' : (um * 1000).toFixed(1) + ' nm';
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
  const r = sz || 7;
  rr(ctx, x - r, y - r, r * 2, r * 2, 3);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke();
  txt(ctx, sign, x, y + 0.5, col, Math.max(9, r * 1.55), 'center', 800);
}
function drawMeter(ctx, x, y, w, h, title, valText, frac, col, dangerFrac) {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = (dangerFrac != null && frac >= dangerFrac) ? C.err : C.sub;
  ctx.lineWidth = 1.6; ctx.stroke();
  txt(ctx, title, x + w / 2, y + 13, C.mut, 11, 'center', 700);
  const cx = x + w / 2, cy = y + h - 28, rad = Math.min(w * 0.42, h * 0.52);
  ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI * 1.15, Math.PI * 1.85);
  ctx.strokeStyle = C.g; ctx.lineWidth = 6; ctx.stroke();
  if (dangerFrac != null) {
    const aD = Math.PI * (1.15 + 0.7 * clamp(dangerFrac, 0, 1));
    ctx.beginPath(); ctx.arc(cx, cy, rad, aD, Math.PI * 1.85);
    ctx.strokeStyle = C.err; ctx.lineWidth = 6; ctx.stroke();
  }
  const f = clamp(frac, 0, 1);
  const ang = Math.PI * (1.15 + 0.7 * f);
  const ncol = (dangerFrac != null && f >= dangerFrac) ? C.err : (col || C.main);
  arr(ctx, cx, cy, cx + Math.cos(ang) * (rad - 5), cy + Math.sin(ang) * (rad - 5), ncol, 2.6);
  dot(ctx, cx, cy, 4.5, ncol);
  txt(ctx, valText, cx, y + h - 11, ncol, 12.5, 'center', 700);
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
   TAB 1 — GHÉP p-n: HAI KHỐI BÁN DẪN → KHUẾCH TÁN → VÙNG NGHÈO & E NỘI (Mục 1.2)
   ========================================================================== */
LABS.push({
  id: 'join', tag: '1', name: 'Ghép p-n', sec: 1,
  S: { joined: 1, Na: 1e16, Nd: 1e16 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Đặt hai khối p và n rồi ghép lại: khuếch tán → lộ ion cố định → E nội',
      area: 'a', anim: true,
      ctrls: [
        { k: 'joined', seg: [[0, 'Tách rời p | n'], [1, 'Ghép p-n']] },
        { k: 'Na', l: 'Nₐ (p)', min: 15, max: 17, step: 0.2, log: 1, f: v => pw(v) },
        { k: 'Nd', l: 'N_d (n)', min: 15, max: 17, step: 0.2, log: 1, f: v => pw(v) },
        { btn: 'Chạy lại lúc ghép', fn: p => { p.S.joined = 1; p.st.prog = 0; p.st.fl = []; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const padX = 16, topY = 34, botY = H - 14, bh = botY - topY, bw = W - padX * 2;
        const midX = padX + bw / 2;

        if (st.prog == null) st.prog = S.joined ? 1 : 0;
        if (st.prevJoined !== S.joined) {
          st.prevJoined = S.joined;
          if (S.joined) st.prog = 0.02;
          st.fl = [];
        }
        if (S.joined) st.prog = Math.min(1, st.prog + dt * 0.40);
        else st.prog = Math.max(0, st.prog - dt * 1.9);

        const gap = S.joined ? 0 : Math.min(34, bw * 0.08) * (1 - st.prog);
        const totDepPx = bw * 0.44 * st.prog;
        const xpPx = totDepPx * clamp(S.Nd / (S.Na + S.Nd), 0.14, 0.86);
        const xnPx = totDepPx * clamp(S.Na / (S.Na + S.Nd), 0.14, 0.86);

        const pL = padX, pR = midX - gap / 2, nL = midX + gap / 2, nR = padX + bw;

        // Khối p & khối n
        rr(ctx, pL, topY, pR - pL, bh, 8);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = C.c4; ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        rr(ctx, nL, topY, nR - nL, bh, 8);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = C.c2; ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        // Vùng nghèo
        if (st.prog > 0.04) {
          ctx.save(); ctx.globalAlpha = 0.15;
          ctx.fillStyle = C.c5; ctx.fillRect(midX - xpPx, topY + 1, xpPx, bh - 2);
          ctx.fillStyle = C.c4; ctx.fillRect(midX, topY + 1, xnPx, bh - 2);
          ctx.restore();
          ln(ctx, midX - xpPx, topY, midX - xpPx, botY, C.c5, 1.3, [4, 4]);
          ln(ctx, midX + xnPx, topY, midX + xnPx, botY, C.c4, 1.3, [4, 4]);
          ln(ctx, midX, topY, midX, botY, C.mut, 1.5);
        }

        // Ion cố định lộ ra trong vùng nghèo
        const rows = Math.max(3, Math.floor(bh / 30));
        if (st.prog > 0.08) {
          const cP = Math.max(1, Math.round(xpPx / 24));
          for (let i = 0; i < cP; i++) for (let j = 0; j < rows; j++) {
            drawIon(ctx, midX - (i + 0.5) * (xpPx / cP), topY + (j + 0.5) * (bh / rows), '−', C.c5, 6.5);
          }
          const cN = Math.max(1, Math.round(xnPx / 24));
          for (let i = 0; i < cN; i++) for (let j = 0; j < rows; j++) {
            drawIon(ctx, midX + (i + 0.5) * (xnPx / cN), topY + (j + 0.5) * (bh / rows), '+', C.c4, 6.5);
          }
        }

        // Hạt di động (lỗ trống + bên p, electron − bên n)
        if (!st.holes || st.W !== W) {
          st.W = W; st.fl = [];
          st.holes = Array.from({ length: 30 }, () => ({ u: rnd(0.05, 0.95), v: rnd(0.08, 0.92), vx: gauss() * 40, vy: gauss() * 40 }));
          st.elecs = Array.from({ length: 30 }, () => ({ u: rnd(0.05, 0.95), v: rnd(0.08, 0.92), vx: gauss() * 46, vy: gauss() * 46 }));
        }
        const nH = Math.round(12 + (Math.log10(S.Na) - 15) * 9);
        const nE = Math.round(12 + (Math.log10(S.Nd) - 15) * 9);
        const pNW = Math.max(18, (pR - pL) - xpPx);
        const nNW = Math.max(18, (nR - nL) - xnPx);
        const diffusing = S.joined && st.prog < 0.88;

        st.holes.forEach((h, i) => {
          if (i >= nH) return;
          if (Math.random() < dt * 3) { h.vx = gauss() * 42; h.vy = gauss() * 42; }
          let x = pL + h.u * pNW + (h.vx + (diffusing ? 60 * (1 - st.prog) : 0)) * dt;
          let y = topY + h.v * bh + h.vy * dt;
          if (x > pL + pNW - 7) {
            if (diffusing && Math.random() < 0.16) st.fl.push({ x: midX - rnd(-10, 10), y: clamp(y, topY + 10, botY - 10), a: 1 });
            x = pL + pNW - 7; h.vx = -Math.abs(h.vx);
          }
          if (x < pL + 7) { x = pL + 7; h.vx = Math.abs(h.vx); }
          if (y < topY + 8 || y > botY - 8) { h.vy = -h.vy; y = clamp(y, topY + 8, botY - 8); }
          h.u = clamp((x - pL) / pNW, 0.02, 0.98); h.v = clamp((y - topY) / bh, 0.05, 0.95);
          dot(ctx, x, y, 5.8, C.c4); txt(ctx, '+', x, y + 0.5, C.bg, 10.5, 'center', 800);
        });

        st.elecs.forEach((e, i) => {
          if (i >= nE) return;
          if (Math.random() < dt * 3) { e.vx = gauss() * 48; e.vy = gauss() * 48; }
          const xMin = nL + xnPx;
          let x = xMin + e.u * nNW + (e.vx + (diffusing ? -60 * (1 - st.prog) : 0)) * dt;
          let y = topY + e.v * bh + e.vy * dt;
          if (x < xMin + 7) {
            if (diffusing && Math.random() < 0.16) st.fl.push({ x: midX + rnd(-10, 10), y: clamp(y, topY + 10, botY - 10), a: 1 });
            x = xMin + 7; e.vx = Math.abs(e.vx);
          }
          if (x > nR - 7) { x = nR - 7; e.vx = -Math.abs(e.vx); }
          if (y < topY + 8 || y > botY - 8) { e.vy = -e.vy; y = clamp(y, topY + 8, botY - 8); }
          e.u = clamp((x - xMin) / nNW, 0.02, 0.98); e.v = clamp((y - topY) / bh, 0.05, 0.95);
          dot(ctx, x, y, 5.8, C.c2); txt(ctx, '−', x, y + 0.5, C.bg, 10.5, 'center', 800);
        });

        // Chớp sáng tái hợp
        st.fl = (st.fl || []).filter(f => (f.a -= dt * 2.3) > 0);
        st.fl.forEach(f => {
          ctx.beginPath(); ctx.arc(f.x, f.y, 4 + (1 - f.a) * 14, 0, TAU2);
          ctx.strokeStyle = C.main; ctx.globalAlpha = f.a; ctx.lineWidth = 1.8; ctx.stroke(); ctx.globalAlpha = 1;
        });

        // Mũi tên điện trường nội (n → p)
        if (st.prog > 0.14) {
          const eLen = Math.max(28, (xpPx + xnPx) * 0.65);
          const ey = topY + bh * 0.5;
          arr(ctx, midX + eLen / 2, ey, midX - eLen / 2, ey, C.main, 3.2);
          chip(ctx, 'E nội (n → p)', midX, ey - 18, C.main, 'center');
        }

        txt(ctx, 'Khối p (lỗ trống +)', pL + 4, 16, C.c4, 12, 'left', 700);
        txt(ctx, 'Khối n (electron −)', nR - 4, 16, C.c2, 12, 'right', 700);
        txt(ctx, !S.joined ? 'Đang tách rời' : (st.prog >= 0.99 ? 'Đã cân bằng: dòng ròng = 0' : 'Khuếch tán & lộ ion cố định...'),
          midX, 16, !S.joined ? C.mut : (st.prog >= 0.99 ? C.main : C.c3), 11.5, 'center', 700);
      }
    },
    {
      title: 'Cân lực khuếch tán – trôi & Trung hòa điện tích (Nₐ xₚ = N_d xₙ)',
      area: 'c', anim: true,
      draw(p, ctx, W, H) {
        const S = p.S, p0 = curPanels[0];
        const prog = (p0 && p0.st && p0.st.prog != null) ? p0.st.prog : (S.joined ? 1 : 0);
        const j = stepJunc('Si', S.Na, S.Nd, 300, 0);
        const lx = 14, bw = W - 28;
        const y1 = H * 0.24, y2 = H * 0.50;

        txt(ctx, 'Lực khuếch tán (đẩy hạt đa số tràn qua tiếp giáp)', lx, y1 - 11, C.c3, 11.5, 'left', 700);
        rr(ctx, lx, y1, bw, 12, 6); ctx.fillStyle = C.tint; ctx.fill();
        if (S.joined) { rr(ctx, lx, y1, bw, 12, 6); ctx.fillStyle = C.c3; ctx.fill(); }

        txt(ctx, 'Lực điện trường nội E (kéo ngược hạt về lại vùng cũ)', lx, y2 - 11, C.main, 11.5, 'left', 700);
        rr(ctx, lx, y2, bw, 12, 6); ctx.fillStyle = C.tint; ctx.fill();
        if (prog > 0.01) { rr(ctx, lx, y2, Math.max(8, bw * prog), 12, 6); ctx.fillStyle = C.main; ctx.fill(); }

        const y3 = H * 0.79;
        rr(ctx, lx, y3 - 15, bw, 32, 7); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        if (prog < 0.05) {
          txt(ctx, 'Bấm "Ghép p-n" để quan sát vùng nghèo hình thành', W / 2, y3 + 1, C.mut, 12, 'center', 600);
        } else {
          txt(ctx, 'Bề rộng p: xₚ = ' + fmtUm(j.xp * prog), lx + 10, y3 + 1, C.c5, 11.5, 'left', 700);
          txt(ctx, 'Bề rộng n: xₙ = ' + fmtUm(j.xn * prog), W / 2, y3 + 1, C.c4, 11.5, 'center', 700);
          txt(ctx, 'V_bi = ' + (j.Vbi * prog).toFixed(3) + ' V', lx + bw - 10, y3 + 1, C.main, 11.5, 'right', 700);
        }
      }
    }
  ]
});

/* ==========================================================================
   TAB 2 — ĐỒI THẾ V_bi: ELECTRON LEO DỐC THẾ NĂNG Ở CÂN BẰNG (Mục 2.3)
   ========================================================================== */
LABS.push({
  id: 'hill', tag: '2a', name: 'Đồi thế V_bi', sec: 2,
  S: { mat: 'Si', Na: 1e16, Nd: 1e15, T: 300 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Bức tường thế năng eV_bi: hạt nhiệt chạy lên dốc và bị dội ngược về',
      area: 'a', anim: true,
      ctrls: [
        { k: 'mat', seg: [['Si', 'Si'], ['GaAs', 'GaAs'], ['Ge', 'Ge']] },
        { k: 'Na', l: 'Nₐ', min: 14, max: 18, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'Nd', l: 'N_d', min: 14, max: 18, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'T', l: 'T', min: 200, max: 450, step: 10, f: v => v + ' K' }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const j = stepJunc(S.mat, S.Na, S.Nd, S.T, 0);
        const padX = 18, topY = 30, botY = H - 22, bw = W - padX * 2, bh = botY - topY;

        // Hình học "con dốc": bên trái (p) là đỉnh đồi cao eV_bi, bên phải (n) là thung lũng thấp
        const midX = padX + bw * 0.5;
        const depPx = bw * 0.30;
        const xpPx = depPx * clamp(j.xp / j.W, 0.15, 0.85);
        const xnPx = depPx * clamp(j.xn / j.W, 0.15, 0.85);
        const xP = midX - xpPx, xN = midX + xnPx;

        const yLow = botY - bh * 0.16;                      // sàn năng lượng electron bên n
        const hillH = clamp(j.Vbi / 1.5, 0.12, 0.92) * (bh * 0.68);
        const yHigh = yLow - hillH;                         // đỉnh đồi năng lượng bên p

        function floorY(x) {
          if (x <= xP) return yHigh;
          if (x >= xN) return yLow;
          const s = (x - xP) / (xN - xP);
          return yHigh + hillH * (s * s * (3 - 2 * s));
        }

        // Tô nền mặt đồi (khối thế năng cản electron)
        ctx.beginPath();
        ctx.moveTo(padX, botY);
        for (let i = 0; i <= 80; i++) {
          const x = padX + (bw * i) / 80;
          ctx.lineTo(x, floorY(x));
        }
        ctx.lineTo(padX + bw, botY);
        ctx.closePath();
        ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = C.c5; ctx.fill(); ctx.restore();

        // Vẽ đường mặt dốc
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const x = padX + (bw * i) / 80;
          i ? ctx.lineTo(x, floorY(x)) : ctx.moveTo(x, floorY(x));
        }
        ctx.strokeStyle = C.c2; ctx.lineWidth = 3; ctx.stroke();

        // Đường mức Fermi phẳng xuyên ngang để nhớ cân bằng nhiệt
        const yEF = yLow + (yHigh - yLow) * clamp(Math.abs(j.phiFn) / j.Vbi, 0.15, 0.85);
        ln(ctx, padX, yEF, padX + bw, yEF, C.main, 1.5, [6, 4]);
        txt(ctx, 'Mức Fermi E_F (nằm ngang)', padX + bw - 6, yEF - 9, C.main, 10.5, 'right', 700);

        // Khởi tạo đàn electron bên n (lao lên dốc) và một ít electron thiểu số bên p (trượt xuống dốc)
        if (!st.es || st.W !== W) {
          st.W = W;
          st.es = Array.from({ length: 24 }, (_, i) => ({
            x: rnd(xN + 12, padX + bw - 12),
            vx: -rnd(55, 160),
            hot: i < 2,
            yOff: rnd(8, 22)
          }));
          st.minE = Array.from({ length: 3 }, () => ({ x: rnd(padX + 10, xP - 10), vx: rnd(25, 55), yOff: rnd(8, 18) }));
        }
        const tempBoost = Math.sqrt(S.T / 300);
        const slopeForce = 240 * (j.Vbi / 0.7); // dốc càng cao lực kéo ngược càng mạnh

        // Mô phỏng electron từ n lao sang trái lên dốc
        st.es.forEach(e => {
          const onSlope = e.x > xP && e.x < xN;
          if (onSlope) e.vx += slopeForce * dt; // trọng lực thế năng kéo tụt về n!
          e.x += e.vx * dt;
          if (e.x > padX + bw - 8) {
            e.x = padX + bw - 8;
            // Hạt "nóng" có vận tốc đủ để thỉnh thoảng vượt dốc; hạt thường bị dội lại
            const vMinCross = Math.sqrt(2 * slopeForce * (xN - xP)) * 1.02;
            e.vx = e.hot && Math.random() < clamp(0.18 * tempBoost, 0.08, 0.55)
              ? -vMinCross * rnd(1.03, 1.18)
              : -rnd(45, vMinCross * 0.90) * tempBoost;
          }
          if (e.x < padX + 8) {
            // Hạt vượt qua đỉnh tái hợp bên p rồi tái xuất bên n
            e.x = padX + bw - 10;
            e.vx = -rnd(55, 130) * tempBoost;
          }
          const y = floorY(e.x) - e.yOff;
          dot(ctx, e.x, y, 5.5, e.hot && e.x < xN ? C.main : C.c2);
          txt(ctx, '−', e.x, y + 0.5, C.bg, 10, 'center', 800);
        });

        // Electron thiểu số sinh nhiệt bên p trượt xuống dốc về n (dòng trôi bù lại đúng số hạt nóng vượt đỉnh!)
        st.minE.forEach(e => {
          const onSlope = e.x > xP && e.x < xN;
          if (onSlope) e.vx += slopeForce * 1.2 * dt;
          e.x += e.vx * dt;
          if (e.x > padX + bw - 10) { e.x = padX + rnd(8, 28); e.vx = rnd(28, 52) * tempBoost; }
          const y = floorY(e.x) - e.yOff;
          dot(ctx, e.x, y, 4.8, C.c3);
          txt(ctx, '−', e.x, y + 0.5, C.bg, 9, 'center', 800);
        });

        // Nhãn chiều cao dốc eV_bi (chỉ vẽ mũi tên đo chiều cao dốc, không phải trục đồ thị)
        const ax = xP - 18;
        ln(ctx, xP, yHigh, ax - 8, yHigh, C.mut, 1, [3, 3]);
        ln(ctx, xN, yLow, ax - 8, yLow, C.mut, 1, [3, 3]);
        arr(ctx, ax, yLow, ax, yHigh, C.main, 2.2);
        chip(ctx, 'Chiều cao dốc = eV_bi = ' + j.Vbi.toFixed(3) + ' eV', padX + 4, 15, C.main, 'left');
        txt(ctx, S.mat + ' · E_g = ' + j.m.Eg + ' eV · T = ' + S.T + ' K', W - padX, 15, C.ink, 11.5, 'right', 700);
        txt(ctx, 'Phía p (đỉnh dốc: ít electron)', padX + 6, botY + 10, C.c4, 11, 'left', 700);
        txt(ctx, 'Phía n (đáy dốc: rất nhiều electron)', padX + bw - 6, botY + 10, C.c2, 11, 'right', 700);
      }
    },
    {
      title: 'Hai nửa đóng góp vào hàng rào thế: V_bi = |φ_Fp| + |φ_Fn|',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const j = stepJunc(S.mat, S.Na, S.Nd, S.T, 0);
        const pad = 16, bw = W - pad * 2;
        const fracP = j.phiFp / j.Vbi;
        const yBar = H * 0.44, hBar = 26;

        // Thanh ghép hai nửa thế tiếp xúc so với trần vùng cấm E_g/e
        const usedW = bw * clamp(j.Vbi / j.m.Eg, 0.05, 1);
        rr(ctx, pad, yBar, bw, hBar, 7); ctx.fillStyle = C.tint; ctx.fill();
        ctx.save(); rr(ctx, pad, yBar, usedW, hBar, 7); ctx.clip();
        ctx.fillStyle = C.c5; ctx.fillRect(pad, yBar, usedW * fracP, hBar);
        ctx.fillStyle = C.c1; ctx.fillRect(pad + usedW * fracP, yBar, usedW * (1 - fracP), hBar);
        ctx.restore();
        rr(ctx, pad, yBar, bw, hBar, 7); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

        txt(ctx, 'V_bi = ' + j.Vbi.toFixed(3) + ' V   (trần vùng cấm E_g/e = ' + j.m.Eg.toFixed(2) + ' V)', pad, yBar - 14, C.ink, 12.5, 'left', 700);
        txt(ctx, 'nᵢ(' + S.T + 'K) = ' + sci(j.ni, 1) + ' cm⁻³', pad + bw, yBar - 14, C.mut, 11.5, 'right', 600);
        txt(ctx, 'Nửa bên p: φ_Fp = +' + j.phiFp.toFixed(3) + ' V', pad, yBar + hBar + 16, C.c5, 11.5, 'left', 700);
        txt(ctx, 'Nửa bên n: |φ_Fn| = ' + Math.abs(j.phiFn).toFixed(3) + ' V', pad + bw, yBar + hBar + 16, C.c1, 11.5, 'right', 700);
      }
    }
  ]
});

/* ==========================================================================
   TAB 3 — THĂM DÒ VÙNG NGHÈO: ION, ĐƯỜNG SỨC & ĐẦU DÒ E(x), φ(x) (Mục 2.7)
   ========================================================================== */
LABS.push({
  id: 'probe', tag: '2b', name: 'Thăm dò vùng nghèo', sec: 2,
  S: { mat: 'Si', Na: 1e16, Nd: 1e15, pos: 0 }, // pos ∈ [-1, 1] theo tọa độ chuẩn hóa trong khung
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Kéo đầu dò chạy qua vùng nghèo: mật độ ion → mật độ đường sức → lực điện trường',
      area: 'a',
      ctrls: [
        { k: 'pos', l: 'Vị trí đầu dò x', min: -1, max: 1, step: 0.02, f: v => v === 0 ? 'x = 0 (giữa)' : (v > 0 ? '+' : '−') + Math.abs(v * 100).toFixed(0) + '%' },
        { k: 'Na', l: 'Nₐ (p)', min: 14.8, max: 17.2, step: 0.1, log: 1, f: v => pw(v) },
        { k: 'Nd', l: 'N_d (n)', min: 14.8, max: 17.2, step: 0.1, log: 1, f: v => pw(v) },
        { btn: 'Ví dụ 2.2', fn: p => { p.S.mat = 'Si'; p.S.Na = 1e16; p.S.Nd = 1e15; p.S.pos = 0; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H) {
        const S = p.S;
        const j = stepJunc(S.mat, S.Na, S.Nd, 300, 0);

        const padX = 20, topY = 36, botY = H - 28, bw = W - padX * 2, bh = botY - topY;
        // Khung hiển thị tương ứng dải vật lý [-xSpan/2, +xSpan/2] đặt quanh tâm vùng nghèo
        const halfPhys = Math.max(j.xp, j.xn) * 1.25;
        const xOf = xPhys => padX + bw * (0.5 + xPhys / (2 * halfPhys));
        const x0 = xOf(0), xP = xOf(-j.xp), xN = xOf(j.xn);

        // Khung thanh bán dẫn
        rr(ctx, padX, topY, bw, bh, 10);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.4; ctx.stroke();

        // Tô hai vùng trung hòa mờ nhẹ ở ngoài
        ctx.save(); rr(ctx, padX, topY, bw, bh, 10); ctx.clip();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = C.c4; ctx.fillRect(padX, topY, xP - padX, bh);
        ctx.fillStyle = C.c2; ctx.fillRect(xN, topY, padX + bw - xN, bh);
        // Tô vùng nghèo
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = C.c5; ctx.fillRect(xP, topY, x0 - xP, bh);
        ctx.fillStyle = C.c4; ctx.fillRect(x0, topY, xN - x0, bh);
        ctx.restore();

        ln(ctx, xP, topY, xP, botY, C.c5, 1.5, [4, 4]);
        ln(ctx, xN, topY, xN, botY, C.c4, 1.5, [4, 4]);
        ln(ctx, x0, topY, x0, botY, C.ink, 1.4);

        // Vẽ đúng CÙNG SỐ LƯỢNG ion (−) bên p và ion (+) bên n để nhìn thấy ngay Nₐxₚ = N_dxₙ!
        const rows = Math.max(3, Math.min(6, Math.floor(bh / 30)));
        const colsPerSide = 4; // tổng cộng rows * 4 ion mỗi bên!
        const ionsP = [], ionsN = [];
        for (let r = 0; r < rows; r++) {
          const y = topY + (r + 0.5) * (bh / rows);
          for (let c = 0; c < colsPerSide; c++) {
            const ixP = xP + ((c + 0.5) / colsPerSide) * (x0 - xP);
            const ixN = x0 + ((c + 0.5) / colsPerSide) * (xN - x0);
            ionsP.push([ixP, y]);
            ionsN.push([ixN, y]);
          }
        }

        // Vẽ đường sức điện trường nối từng cặp ion (+) bên n sang ion (−) bên p!
        // Mọi đường sức đều phải đi qua x=0 → người học THẤY NGAY tại x=0 dày đặc nhất (|E_max|)!
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < colsPerSide; c++) {
            const idx = r * colsPerSide + c;
            const pIon = ionsP[r * colsPerSide + (colsPerSide - 1 - c)]; // ghép đối xứng từ ngoài vào trong
            const nIon = ionsN[idx];
            const yOff = (c - (colsPerSide - 1) / 2) * 3.4;
            ln(ctx, nIon[0], nIon[1] + yOff, pIon[0], pIon[1] + yOff, C.c1, 1.15);
            // Mũi tên nhỏ chỉ chiều đường sức ngay gần x=0
            if (c === 1 || c === 2) {
              arr(ctx, x0 + 6, nIon[1] + yOff, x0 - 6, nIon[1] + yOff, C.c1, 1.2);
            }
          }
        }

        // Vẽ các ion đè lên trên đường sức
        const szP = clamp((x0 - xP) / (colsPerSide * 2.5), 4.5, 7);
        const szN = clamp((xN - x0) / (colsPerSide * 2.5), 4.5, 7);
        ionsP.forEach(([x, y]) => drawIon(ctx, x, y, '−', C.c5, szP));
        ionsN.forEach(([x, y]) => drawIon(ctx, x, y, '+', C.c4, szN));

        // Đầu dò điện trường tại vị trí S.pos
        const xProbePhys = S.pos * halfPhys;
        const xProbe = xOf(xProbePhys);
        let Ecur = 0, phiCur = 0;
        if (xProbePhys <= -j.xp) { Ecur = 0; phiCur = 0; }
        else if (xProbePhys >= j.xn) { Ecur = 0; phiCur = j.Vbi; }
        else if (xProbePhys <= 0) {
          Ecur = (E_CHG * S.Na / j.eps) * (xProbePhys + j.xp);
          phiCur = (E_CHG * S.Na / (2 * j.eps)) * Math.pow(xProbePhys + j.xp, 2);
        } else {
          Ecur = (E_CHG * S.Nd / j.eps) * (j.xn - xProbePhys);
          phiCur = (E_CHG * S.Na / (2 * j.eps)) * j.xp * j.xp + (E_CHG * S.Nd / j.eps) * (j.xn * xProbePhys - 0.5 * xProbePhys * xProbePhys);
        }

        // Vẽ cây đầu dò & mũi tên lực điện trường đo được tại chỗ đầu dò
        ln(ctx, xProbe, topY - 12, xProbe, botY + 4, C.main, 2.2);
        const cy = topY + bh * 0.5;
        dot(ctx, xProbe, cy, 7.5, C.main);
        txt(ctx, '+', xProbe, cy + 0.5, C.bg, 11, 'center', 800);
        const eFrac = Ecur / (j.Emax || 1);
        if (eFrac > 0.03) {
          arr(ctx, xProbe, cy, xProbe - (18 + 75 * eFrac), cy, C.main, 3.2);
        }
        chip(ctx, 'x = ' + (xProbePhys >= 0 ? '+' : '−') + fmtUm(Math.abs(xProbePhys)), xProbe, topY - 18, C.main, 'center');

        // Nhãn dưới
        txt(ctx, '−xₚ (' + fmtUm(j.xp) + ')', xP, botY + 14, C.c5, 11, 'center', 700);
        txt(ctx, 'x = 0', x0, botY + 14, C.ink, 11, 'center', 700);
        txt(ctx, '+xₙ (' + fmtUm(j.xn) + ')', xN, botY + 14, C.c4, 11, 'center', 700);
      }
    },
    {
      title: 'Đồng hồ đầu dò tại x: Điện trường |E(x)| & Điện thế φ(x)',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const j = stepJunc(S.mat, S.Na, S.Nd, 300, 0);
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

        const pad = 12, gap = 10, mw = (W - pad * 2 - gap) / 2, mh = H - pad * 2;
        drawMeter(ctx, pad, pad, mw, mh, 'Điện trường tại đầu dò |E(x)|',
          Ecur > 10 ? sci(Ecur, 2) + ' V/cm' : '0 V/cm (trung hòa)', Ecur / (j.Emax || 1), C.c1);
        drawMeter(ctx, pad + mw + gap, pad, mw, mh, 'Điện thế tại đầu dò φ(x)',
          phiCur.toFixed(3) + ' V  /  ' + j.Vbi.toFixed(3) + ' V', phiCur / (j.Vbi || 1), C.main);
      }
    }
  ]
});

/* ==========================================================================
   TAB 4 — PHÂN CỰC NGƯỢC: MẠCH PIN 3D + TỤ ĐIỆN VÙNG NGHÈO (Mục 3.3)
   ========================================================================== */
LABS.push({
  id: 'rev', tag: '3a', name: 'Phân cực ngược', sec: 3,
  S: { VR: 5, Na: 1e16, Nd: 1e15, mat: 'Si', A: 1e-4 },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Mạch phân cực ngược: pin kéo hạt tải lùi xa → vùng nghèo phình to, C giảm',
      area: 'a', anim: true,
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

        // Chuyển động mượt cho bề rộng vùng nghèo khi kéo V_R
        const targetFrac = clamp(j.W / jMax.W, 0.12, 1);
        if (st.depFrac == null) st.depFrac = targetFrac;
        st.depFrac += (targetFrac - st.depFrac) * Math.min(1, dt * 8);

        // Bố cục: thanh bán dẫn ở giữa trên, nguồn pin V_R ở dưới, đồng hồ điện dung bên phải
        const meterW = Math.min(168, W * 0.28);
        const devAreaW = W - meterW - 24;
        const bx = 36, by = 36, bw = devAreaW - 44, bh = Math.min(132, H * 0.44);
        const midX = bx + bw * 0.5;

        const maxDepPx = bw * 0.72;
        const depPx = maxDepPx * st.depFrac;
        const xpPx = depPx * clamp(j.xp / j.W, 0.12, 0.88);
        const xnPx = depPx * clamp(j.xn / j.W, 0.12, 0.88);
        const xP = midX - xpPx, xN = midX + xnPx;

        // Dây nối mạch tới nguồn pin ngược (− nối p, + nối n)
        const wireY = by + bh + Math.min(54, (H - by - bh) * 0.55);
        const pinX = midX;
        ln(ctx, bx, by + bh / 2, bx - 18, by + bh / 2, C.sub, 2.6);
        ln(ctx, bx - 18, by + bh / 2, bx - 18, wireY, C.sub, 2.6);
        ln(ctx, bx - 18, wireY, pinX - 18, wireY, C.sub, 2.6);

        ln(ctx, bx + bw, by + bh / 2, bx + bw + 18, by + bh / 2, C.sub, 2.6);
        ln(ctx, bx + bw + 18, by + bh / 2, bx + bw + 18, wireY, C.sub, 2.6);
        ln(ctx, bx + bw + 18, wireY, pinX + 18, wireY, C.sub, 2.6);

        // Ký hiệu nguồn pin (− bên trái kéo lỗ trống, + bên phải kéo electron)
        ln(ctx, pinX - 18, wireY - 9, pinX - 18, wireY + 9, C.c2, 4.5);   // cực âm ngắn dày
        ln(ctx, pinX + 18, wireY - 17, pinX + 18, wireY + 17, C.c4, 2.6); // cực dương dài mảnh
        txt(ctx, '−', pinX - 30, wireY - 12, C.c2, 14, 'center', 800);
        txt(ctx, '+', pinX + 30, wireY - 12, C.c4, 14, 'center', 800);
        chip(ctx, 'Nguồn ngược V_R = ' + S.VR.toFixed(1) + ' V', pinX, wireY + 24, C.main, 'center');

        // Khối tiếp giáp p-n
        rr(ctx, bx, by, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.save(); rr(ctx, bx, by, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = C.c4; ctx.fillRect(bx, by, xP - bx, bh);
        ctx.fillStyle = C.c2; ctx.fillRect(xN, by, bx + bw - xN, bh);
        ctx.globalAlpha = 0.20;
        ctx.fillStyle = C.c5; ctx.fillRect(xP, by, midX - xP, bh);
        ctx.fillStyle = C.c3; ctx.fillRect(midX, by, xN - midX, bh);
        ctx.restore();
        ln(ctx, midX, by, midX, by + bh, C.mut, 1.2);
        ln(ctx, xP, by, xP, by + bh, C.c5, 1.5, [4, 3]);
        ln(ctx, xN, by, xN, by + bh, C.c3, 1.5, [4, 3]);

        // Ion cố định lộ ra trong vùng nghèo
        const rows = Math.max(3, Math.floor(bh / 28));
        const cP = Math.max(1, Math.round(xpPx / 22));
        for (let i = 0; i < cP; i++) for (let r = 0; r < rows; r++) {
          drawIon(ctx, midX - (i + 0.5) * (xpPx / cP), by + (r + 0.5) * (bh / rows), '−', C.c5, 5.5);
        }
        const cN = Math.max(1, Math.round(xnPx / 22));
        for (let i = 0; i < cN; i++) for (let r = 0; r < rows; r++) {
          drawIon(ctx, midX + (i + 0.5) * (xnPx / cN), by + (r + 0.5) * (bh / rows), '+', C.c4, 5.5);
        }

        // Hạt di động bị hút lùi ra sát 2 đầu cực
        if (!st.ps) {
          st.ps = Array.from({ length: 16 }, () => ({ u: rnd(0.08, 0.92), v: rnd(0.1, 0.9), ph: rnd(0, TAU2) }));
        }
        const pW = Math.max(10, xP - bx), nW = Math.max(10, bx + bw - xN);
        st.ps.forEach(q => {
          const jx = Math.sin(t * 5 + q.ph) * 2.5, jy = Math.cos(t * 4.3 + q.ph) * 2.5;
          dot(ctx, bx + clamp(q.u * pW + jx, 6, pW - 6), by + clamp(q.v * bh + jy, 7, bh - 7), 4.5, C.c4);
          dot(ctx, xN + clamp(q.u * nW - jx, 6, nW - 6), by + clamp(q.v * bh - jy, 7, bh - 7), 4.5, C.c2);
        });

        // Mũi tên lực pin kéo lùi & điện trường E tăng mạnh
        if (S.VR > 0.2) {
          arr(ctx, xP - 4, by + bh / 2, Math.max(bx + 6, xP - 26), by + bh / 2, C.c4, 2.2);
          arr(ctx, xN + 4, by + bh / 2, Math.min(bx + bw - 6, xN + 26), by + bh / 2, C.c2, 2.2);
        }
        const nE = Math.min(5, Math.max(2, Math.round(2 + S.VR / 8)));
        for (let k = 0; k < nE; k++) {
          const ey = by + (k + 0.5) * (bh / nE);
          arr(ctx, xN - 6, ey, xP + 6, ey, C.main, 1.7 + S.VR / 30);
        }

        // Nhãn bề rộng W
        txt(ctx, 'Vùng p', bx + 4, by - 14, C.c4, 11.5, 'left', 700);
        chip(ctx, 'W = ' + fmtUm(j.W) + ' (×' + (j.W / j0.W).toFixed(2) + ')', midX, by - 14, C.main, 'center');
        txt(ctx, 'Vùng n', bx + bw - 4, by - 14, C.c2, 11.5, 'right', 700);

        // Đồng hồ đo điện dung C' bên phải
        const mx = W - meterW - 12, my = 20, mh = Math.min(138, H - 40);
        drawMeter(ctx, mx, my, meterW, mh, 'Điện dung C\' = ε_s / W',
          (j.Cp * 1e9).toFixed(2) + ' nF/cm²', j.Cp / j0.Cp, C.c2);
        txt(ctx, '|E_max| = ' + sci(j.Emax, 2) + ' V/cm', mx + meterW / 2, my + mh + 18, C.c1, 11.5, 'center', 700);
        txt(ctx, 'C(A=10⁻⁴) = ' + (j.Cp * S.A * 1e12).toFixed(3) + ' pF', mx + meterW / 2, my + mh + 36, C.mut, 11, 'center', 600);
      }
    },
    {
      title: 'Tụ điện phẳng tương đương: tín hiệu xoay chiều nhỏ dV_R làm rung 2 mép điện tích ±dQ\'',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const j = stepJunc(S.mat, S.Na, S.Nd, 300, S.VR);
        const jMax = stepJunc(S.mat, S.Na, S.Nd, 300, 30);

        const midX = W * 0.5, cy = H * 0.52;
        const gapMax = W * 0.48;
        const baseGap = gapMax * clamp(j.W / jMax.W, 0.14, 1);
        const osc = Math.sin(t * 4.5) * 9; // rung do điện áp thăm dò dV_R nhỏ
        const gap = baseGap + osc;
        const plateH = H * 0.62, plateW = 16;

        // Hai bản tụ (vùng trung hòa dẫn điện)
        const leftX = midX - gap / 2 - plateW;
        const rightX = midX + gap / 2;

        // Lớp điện môi vùng nghèo ở giữa
        ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = C.main;
        ctx.fillRect(leftX + plateW, cy - plateH / 2, gap, plateH); ctx.restore();

        // Lớp vi phân ±dQ' nhấp nháy ở 2 mép bản tụ
        if (osc > 0) {
          ctx.save(); ctx.globalAlpha = 0.45;
          ctx.fillStyle = C.c5; ctx.fillRect(leftX + plateW, cy - plateH / 2, osc / 2 + 2, plateH);
          ctx.fillStyle = C.c4; ctx.fillRect(rightX - osc / 2 - 2, cy - plateH / 2, osc / 2 + 2, plateH);
          ctx.restore();
        }

        rr(ctx, leftX, cy - plateH / 2, plateW, plateH, 4); ctx.fillStyle = C.c4; ctx.fill();
        rr(ctx, rightX, cy - plateH / 2, plateW, plateH, 4); ctx.fillStyle = C.c2; ctx.fill();
        ln(ctx, 24, cy, leftX, cy, C.sub, 3);
        ln(ctx, rightX + plateW, cy, W - 24, cy, C.sub, 3);

        txt(ctx, '−dQ\'', leftX + plateW + 6, cy - plateH / 2 + 12, C.c5, 11, 'left', 700);
        txt(ctx, '+dQ\'', rightX - 6, cy - plateH / 2 + 12, C.c4, 11, 'right', 700);
        txt(ctx, 'Khoảng cách 2 bản = W = ' + fmtUm(j.W), midX, cy, C.ink, 12, 'center', 700);
        txt(ctx, 'Hai bản càng xa → C\' = dQ\'/dV_R = ε_s/W càng nhỏ', midX, H - 12, C.mut, 11.5, 'center', 600);
      }
    }
  ]
});

/* ==========================================================================
   TAB 5 — MÁY ĐO C-V: PÍT-TÔNG VÙNG NGHÈO QUÉT PHÍA NHẸ & GIẢI MÃ N_d, V_bi (Mục 3.6)
   ========================================================================== */
LABS.push({
  id: 'cv', tag: '3b', name: 'Máy đo C-V', sec: 3,
  S: { sample: 'ex34', VR: 4, Nd: 1.96e15, Na: 1.64e17 },
  cols: '1.5fr 1fr', rows: '1.45fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Bàn đo C-V trên tiếp giáp một phía p⁺n: biên xₙ như pít-tông quét qua các lớp donor',
      area: 'a', anim: true,
      ctrls: [
        {
          k: 'sample',
          seg: [['ex34', 'Mẫu Ví dụ 3.4'], ['light', 'Mẫu n nhẹ'], ['heavy', 'Mẫu n đậm']],
          set: {
            ex34:  { Nd: 1.96e15, Na: 1.64e17 },
            light: { Nd: 5e14,    Na: 1e17 },
            heavy: { Nd: 1.5e16,  Na: 5e17 }
          }
        },
        { k: 'VR', l: 'Vặn V_R', min: 0, max: 12, step: 0.2, f: v => v.toFixed(1) + ' V' },
        { k: 'Nd', l: 'N_d thật', min: 14.5, max: 16.5, step: 0.05, log: 1, f: v => pw(v) }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const j0 = stepJunc('Si', S.Na, S.Nd, 300, 0);
        const j = stepJunc('Si', S.Na, S.Nd, 300, S.VR);
        const jRef = stepJunc('Si', 1e17, 5e14, 300, 12); // mốc độ rộng lớn nhất để so trực quan

        const padX = 18, topY = 36, botY = H - 22, bh = botY - topY, bw = W - padX * 2;
        const pPlusW = bw * 0.16; // phía p+ cực đậm chỉ là một dải hẹp
        const xJunc = padX + pPlusW;
        const nAreaW = bw - pPlusW;

        // Biên x_n quét qua phía n (tỉ lệ trực tiếp với độ sâu thật so với 6 µm)
        const maxVisCm = 6.5e-4;
        const targetXnPx = nAreaW * clamp(j.xn / maxVisCm, 0.05, 0.94);
        if (st.xnPx == null) st.xnPx = targetXnPx;
        st.xnPx += (targetXnPx - st.xnPx) * Math.min(1, dt * 9);
        const xEdge = xJunc + st.xnPx;

        // Vẽ khối p+n
        rr(ctx, padX, topY, bw, bh, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.sub; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        // Phía p+ dày đặc
        ctx.globalAlpha = 0.28; ctx.fillStyle = C.c4; ctx.fillRect(padX, topY, pPlusW, bh);
        // Phần vùng nghèo đã quét bên n (lộ ion donor +)
        ctx.globalAlpha = 0.18; ctx.fillStyle = C.main; ctx.fillRect(xJunc, topY, st.xnPx, bh);
        // Phần n trung hòa chưa quét
        ctx.globalAlpha = 0.10; ctx.fillStyle = C.c2; ctx.fillRect(xEdge, topY, padX + bw - xEdge, bh);
        ctx.restore();

        ln(ctx, xJunc, topY, xJunc, botY, C.ink, 1.8);
        // "Pít-tông" biên vùng nghèo đang quét
        ln(ctx, xEdge, topY, xEdge, botY, C.main, 3);
        const pulse = Math.sin(t * 7) * 2.5;
        ln(ctx, xEdge + pulse, topY + 6, xEdge + pulse, botY - 6, C.c3, 1.2, [3, 3]);

        // Các điểm nguyên tử donor cố định rải đều trong phía n (mật độ hiển thị tăng theo N_d!)
        const seedKey = Math.round(Math.log10(S.Nd) * 20);
        if (!st.donors || st.seedKey !== seedKey || st.W !== W) {
          st.seedKey = seedKey; st.W = W;
          const cnt = Math.round(24 + (Math.log10(S.Nd) - 14.5) * 48);
          st.donors = Array.from({ length: cnt }, (_, i) => {
            // rải gần đều theo lưới có nhiễu nhẹ để mật độ nhìn thật mắt
            const cols = Math.ceil(Math.sqrt(cnt * 2.2)), rows = Math.ceil(cnt / cols);
            const c = i % cols, r = Math.floor(i / cols);
            return { u: clamp((c + 0.5 + rnd(-0.3, 0.3)) / cols, 0.03, 0.97), v: clamp((r + 0.5 + rnd(-0.3, 0.3)) / rows, 0.08, 0.92) };
          });
        }
        st.donors.forEach(d => {
          const x = xJunc + d.u * nAreaW, y = topY + d.v * bh;
          if (x < xEdge - 3) {
            drawIon(ctx, x, y, '+', C.c4, 5.2); // đã bị quét → lộ ion +
          } else {
            dot(ctx, x, y, 4.2, C.c2);          // còn trung hòa (ion + được electron bọc)
          }
        });

        // Ký hiệu p+ cực đậm bên trái
        txt(ctx, 'p⁺', padX + pPlusW / 2, topY + bh * 0.42, C.c4, 18, 'center', 800);
        txt(ctx, 'Nₐ ≫ N_d', padX + pPlusW / 2, topY + bh * 0.62, C.mut, 10, 'center', 600);
        txt(ctx, 'xₚ ≈ 0', padX + pPlusW / 2, topY + bh * 0.78, C.c5, 10, 'center', 700);

        // Chú thích phía trên & dưới
        txt(ctx, 'Vùng nghèo W ≈ xₙ = ' + fmtUm(j.xn), xJunc + st.xnPx / 2, topY - 14, C.main, 11.5, 'center', 700);
        txt(ctx, 'n trung hòa', padX + bw - 6, topY - 14, C.c2, 11.5, 'right', 700);
        txt(ctx, 'N_d càng nhỏ → pít-tông xₙ quét càng sâu → điện dung C\' tụt càng nhanh', W / 2, botY + 12, C.mut, 11, 'center', 600);
        void j0; void jRef;
      }
    },
    {
      title: 'Máy đo LCR số: từ 2 phép đo C\' tại 0V và V_R suy ngược N_d & V_bi',
      area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const j0 = stepJunc('Si', S.Na, S.Nd, 300, 0);
        const j1 = stepJunc('Si', S.Na, S.Nd, 300, Math.max(1, S.VR));
        const jNow = stepJunc('Si', S.Na, S.Nd, 300, S.VR);

        // Tính đúng theo phép đo 2 điểm: độ dốc = [(1/C1')^2 - (1/C0')^2] / (V1 - 0)
        const invC0sq = 1 / (j0.Cp * j0.Cp);
        const invC1sq = 1 / (j1.Cp * j1.Cp);
        const slope = (invC1sq - invC0sq) / Math.max(1, S.VR);
        const NdMeas = 2 / (E_CHG * j0.eps * slope);
        const VbiMeas = invC0sq / slope;
        const NaMeas = (j0.ni * j0.ni / NdMeas) * Math.exp(VbiMeas / j0.Vt);

        const pad = 12, gap = 10, cw = (W - pad * 2 - gap * 2) / 3, ch = H - pad * 2;
        const cards = [
          { t: 'Máy đo tại V_R = ' + S.VR.toFixed(1) + ' V', v: (jNow.Cp * 1e9).toFixed(2) + ' nF/cm²', sub: 'W = ε_s/C\' = ' + fmtUm(jNow.W), col: C.c2 },
          { t: 'Trích xuất từ độ nhạy C-V', v: 'N_d = ' + sci(NdMeas, 2), sub: 'Độ dốc = ' + sci(slope, 2), col: C.main },
          { t: 'Ngoại suy về 1/C\'² = 0', v: 'V_bi = ' + VbiMeas.toFixed(3) + ' V', sub: '→ Nₐ ≈ ' + sci(NaMeas, 2), col: C.c4 }
        ];
        cards.forEach((c, i) => {
          const x = pad + i * (cw + gap);
          rr(ctx, x, pad, cw, ch, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = i === 1 ? C.main : C.g; ctx.lineWidth = i === 1 ? 1.5 : 1; ctx.stroke();
          txt(ctx, c.t, x + cw / 2, pad + 18, C.mut, 10.5, 'center', 600);
          txt(ctx, c.v, x + cw / 2, pad + ch * 0.50, c.col, 13.5, 'center', 800);
          txt(ctx, c.sub, x + cw / 2, pad + ch - 16, C.ink, 10.5, 'center', 600);
        });
      }
    }
  ]
});

/* ==========================================================================
   TAB 6 — ĐÁNH THỦNG ZENER & THÁC LŨ (Mục 4.1) — BUỒNG HẠT + AMPE KẾ KIM
   ========================================================================== */
LABS.push({
  id: 'brk', tag: '4', name: 'Đánh thủng', sec: 4,
  S: { mode: 'avalanche', NB: 4e15, VR: 90, mat: 'Si' },
  cols: '1.5fr 1fr', rows: '1.55fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Bên trong vùng nghèo ở điện áp ngược lớn: Tuyết lở Thác lũ vs Xuyên hầm Zener',
      area: 'a', anim: true,
      ctrls: [
        { k: 'mode', seg: [['avalanche', 'Thác lũ (Avalanche)'], ['zener', 'Xuyên hầm (Zener)']], set: { avalanche: { NB: 4e15, VR: 95 }, zener: { NB: 9e17, VR: 3.6 } } },
        { k: 'NB', l: 'N_B (nhẹ)', min: 14.5, max: 18.2, step: 0.05, log: 1, f: v => pw(v) },
        { k: 'VR', l: 'V_R', min: 0, max: 150, step: 0.5, f: v => v.toFixed(1) + ' V' },
        { k: 'mat', seg: [['Si', 'Si'], ['GaAs', 'GaAs']] }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const { Ec, VB } = vBreakOf(S.mat, S.NB);
        const ratio = clamp(S.VR / Math.max(0.5, VB), 0, 1.2);
        const isZener = S.mode === 'zener' || VB < 4.5;
        const broken = ratio >= 0.98;

        const padX = 16, topY = 34, botY = H - 18, bw = W - padX * 2, bh = botY - topY;
        const midX = padX + bw / 2;

        // Vẽ buồng tinh thể: Zener có tường rào cực mỏng, Thác lũ có hành lang vùng nghèo rộng
        const depW = bw * (isZener ? 0.14 : 0.62);
        const x1 = midX - depW / 2, x2 = midX + depW / 2;

        rr(ctx, padX, topY, bw, bh, 8);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = broken ? C.err : C.g; ctx.lineWidth = broken ? 2 : 1.2; ctx.stroke();

        ctx.save(); rr(ctx, padX, topY, bw, bh, 8); ctx.clip();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = C.c4; ctx.fillRect(padX, topY, x1 - padX, bh);
        ctx.fillStyle = C.c2; ctx.fillRect(x2, topY, padX + bw - x2, bh);
        ctx.globalAlpha = broken ? 0.22 : 0.12;
        ctx.fillStyle = broken ? C.err : C.main; ctx.fillRect(x1, topY, depW, bh);
        ctx.restore();

        ln(ctx, x1, topY, x1, botY, C.c5, 1.5, [4, 3]);
        ln(ctx, x2, topY, x2, botY, C.c4, 1.5, [4, 3]);

        if (isZener) {
          // Zener: tường rào cực mỏng, các liên kết mạng bị điện trường kéo căng → electron xuyên hầm ngang!
          const rows = Math.max(4, Math.floor(bh / 28));
          for (let r = 0; r < rows; r++) {
            const y = topY + (r + 0.5) * (bh / rows);
            dot(ctx, x1 - 16, y, 5, C.g);
            dot(ctx, x2 + 16, y, 5, C.g);
            // Liên kết rung mạnh hơn khi V_R tiến tới V_B
            const vib = Math.sin(t * 18 + r * 2) * (1 + 3.5 * ratio);
            ln(ctx, x1 - 10, y, x2 + 10, y + vib, broken ? C.err : C.mut, 1.2, [3, 3]);
          }
          if (!st.zps) st.zps = Array.from({ length: 18 }, (_, i) => ({ u: i / 18, row: i % 5 }));
          const speed = ratio < 0.5 ? 0.08 : 0.3 + Math.pow(ratio, 3) * 1.6;
          st.zps.forEach(q => {
            q.u += dt * speed;
            if (q.u > 1) q.u -= 1;
            const y = topY + ((q.row + 0.5) / 5) * bh;
            const x = padX + 12 + q.u * (bw - 24);
            const inWall = x > x1 && x < x2;
            if (inWall && ratio < 0.55) return; // chưa đủ áp thì chưa xuyên hầm
            ctx.save();
            ctx.globalAlpha = inWall ? 0.45 : 1; // mờ như sóng khi xuyên hầm qua tường
            if (inWall) {
              ctx.beginPath();
              for (let k = -10; k <= 10; k += 2) {
                const wx = x + k, wy = y + Math.sin(k * 0.7 - t * 20) * 3.5;
                k === -10 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
              }
              ctx.strokeStyle = C.c2; ctx.lineWidth = 2; ctx.stroke();
            } else {
              dot(ctx, x, y, 5.2, C.c2);
              txt(ctx, '−', x, y + 0.5, C.bg, 9.5, 'center', 800);
            }
            ctx.restore();
          });
          chip(ctx, ratio >= 0.95 ? 'Xuyên hầm Zener ồ ạt qua tường mỏng!' : 'Tường vùng nghèo siêu mỏng (pha tạp rất nặng)', midX, topY + 16, broken ? C.err : C.main, 'center');
        } else {
          // Thác lũ: lưới nguyên tử Si trong hành lang rộng + hiệu ứng tuyết lở ion hóa va chạm
          const cols = Math.max(4, Math.floor(depW / 44)), rows = Math.max(3, Math.floor(bh / 36));
          for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
            const ax = x1 + (c + 0.5) * (depW / cols), ay = topY + (r + 0.5) * (bh / rows);
            dot(ctx, ax, ay, 5.5, C.tint);
            ctx.beginPath(); ctx.arc(ax, ay, 5.5, 0, TAU2); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
          }
          if (!st.aps) st.aps = [];
          if (!st.fl) st.fl = [];
          st.spawn = (st.spawn || 0) - dt;
          if (st.spawn <= 0 && st.aps.length < 54) {
            st.aps.push({ x: x1 + 4, y: rnd(topY + 16, botY - 16), vx: 95, vy: gauss() * 14, type: 'e', dist: 0, gen: 0 });
            st.spawn = broken ? 0.14 : 0.65;
          }
          const ionRate = ratio < 0.35 ? 0 : Math.pow(ratio, 3.2) * 3.2;
          const next = [];
          st.aps.forEach(q => {
            const dir = q.type === 'e' ? 1 : -1;
            q.vx = Math.min(270, q.vx + (120 + 240 * ratio) * dt);
            q.x += dir * q.vx * dt;
            q.y = clamp(q.y + q.vy * dt, topY + 10, botY - 10);
            q.dist += q.vx * dt;
            // Va chạm nguyên tử mạng sinh cặp e-h mới
            if (q.x > x1 + 16 && q.x < x2 - 16 && q.dist > 48 && q.gen < 3 && next.length + st.aps.length < 56 && Math.random() < ionRate * dt * 3.5) {
              q.dist = 0; q.vx = 75;
              st.fl.push({ x: q.x, y: q.y, a: 1 });
              next.push({ x: q.x + 3, y: clamp(q.y + rnd(-10, 10), topY + 10, botY - 10), vx: 75, vy: gauss() * 26, type: 'e', dist: 0, gen: q.gen + 1 });
              next.push({ x: q.x - 3, y: clamp(q.y + rnd(-10, 10), topY + 10, botY - 10), vx: 65, vy: gauss() * 26, type: 'h', dist: 0, gen: q.gen + 1 });
            }
            if (q.x >= padX + 4 && q.x <= padX + bw - 4) {
              next.push(q);
              const hot = clamp((q.vx - 90) / 170, 0, 1);
              if (hot > 0.35) ln(ctx, q.x - dir * (6 + hot * 14), q.y, q.x, q.y, C.main, 2);
              dot(ctx, q.x, q.y, 5.2, q.type === 'e' ? C.c2 : C.c4);
              txt(ctx, q.type === 'e' ? '−' : '+', q.x, q.y + 0.5, C.bg, 9.5, 'center', 800);
            }
          });
          st.aps = next;
          st.fl = st.fl.filter(f => (f.a -= dt * 2.4) > 0);
          st.fl.forEach(f => {
            ctx.beginPath(); ctx.arc(f.x, f.y, 6 + (1 - f.a) * 18, 0, TAU2);
            ctx.strokeStyle = broken ? C.err : C.main; ctx.globalAlpha = f.a; ctx.lineWidth = 2.2; ctx.stroke(); ctx.globalAlpha = 1;
          });
          chip(ctx, broken ? 'TUYẾT LỞ THÁC LŨ! (∫αdx → 1, Mₙ → ∞)' : 'Vùng nghèo rộng: hạt tăng tốc đập nguyên tử mạng', midX, topY + 16, broken ? C.err : C.main, 'center');
        }

        txt(ctx, 'Phía p', padX + 4, 15, C.c4, 12, 'left', 700);
        txt(ctx, 'V_B ≈ ' + (VB >= 10 ? VB.toFixed(0) : VB.toFixed(1)) + ' V · E_crit ≈ ' + sci(Ec, 2) + ' V/cm', midX, 15, broken ? C.err : C.ink, 11.5, 'center', 700);
        txt(ctx, 'Phía n', padX + bw - 4, 15, C.c2, 12, 'right', 700);
      }
    },
    {
      title: 'Ampe kế dòng ngược & Hệ số nhân hạt tải Mₙ',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const { VB } = vBreakOf(S.mat, S.NB);
        const r = S.VR / Math.max(0.5, VB);
        const iTarget = clamp(0.03 + (r > 0.65 ? Math.pow((r - 0.65) / 0.36, 5) : 0), 0, 1);
        if (st.iVal == null) st.iVal = iTarget;
        st.iVal += (iTarget - st.iVal) * Math.min(1, dt * 8);

        const M = r >= 0.99 ? Infinity : 1 / Math.max(0.005, 1 - Math.pow(clamp(r, 0, 0.99), 3));
        const intA = r >= 0.99 ? 1 : (1 - 1 / M);

        const pad = 12, gap = 10, mw = (W - pad * 2 - gap) * 0.48, mh = H - pad * 2;
        const iStr = r >= 0.98 ? 'ĐÁNH THỦNG (vọt mạnh!)' : r > 0.78 ? 'Đang tăng nhân...' : 'Rất nhỏ (I_rò ≈ 0)';
        drawMeter(ctx, pad, pad, mw, mh, 'Ampe kế dòng ngược', iStr, st.iVal, C.main, 0.75);

        // Bảng chỉ báo nhân hạt bên phải
        const rx = pad + mw + gap, rw = W - rx - pad;
        rr(ctx, rx, pad, rw, mh, 10); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = r >= 0.98 ? C.err : C.g; ctx.lineWidth = 1.3; ctx.stroke();
        txt(ctx, 'Điều kiện đánh thủng', rx + 12, pad + 18, C.mut, 11, 'left', 700);
        txt(ctx, 'V_R / V_B = ' + (r * 100).toFixed(0) + '%', rx + rw - 12, pad + 18, r >= 0.98 ? C.err : C.main, 11.5, 'right', 700);

        // Thanh tiến trình ∫αdx từ 0 → 1
        const by = pad + mh * 0.44, bw_ = rw - 24;
        txt(ctx, 'Tích phân ion hóa  ∫α dx  (chạm 1 = đánh thủng)', rx + 12, by - 11, C.ink, 10.5, 'left', 600);
        rr(ctx, rx + 12, by, bw_, 12, 6); ctx.fillStyle = C.tint; ctx.fill();
        rr(ctx, rx + 12, by, Math.max(6, bw_ * intA), 12, 6); ctx.fillStyle = r >= 0.98 ? C.err : C.c3; ctx.fill();

        txt(ctx, 'Hệ số nhân Mₙ = ' + (isFinite(M) ? M.toFixed(1) + '×' : '∞'), rx + 12, pad + mh - 18, r >= 0.98 ? C.err : C.ink, 12.5, 'left', 700);
        txt(ctx, VB < 4.5 ? 'Loại: Zener' : 'Loại: Thác lũ', rx + rw - 12, pad + mh - 18, VB < 4.5 ? C.c5 : C.c2, 11.5, 'right', 700);
      }
    }
  ]
});

/* ==========================================================================
   TAB 7 — SO SÁNH TRỰC TIẾP PHA TẠP ĐỘT BIẾN VS TUYẾN TÍNH VS SIÊU ĐỘT BIẾN (Mục 5.2)
   ========================================================================== */
LABS.push({
  id: 'grad', tag: '5a', name: 'So sánh pha tạp', sec: 5,
  S: { VR: 5, cmp: 'linear', a: 1e20 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [
    {
      title: 'Hai thanh p-n mắc chung một nguồn V_R: mật độ ion quyết định tốc độ nở vùng nghèo!',
      area: 'a', anim: true,
      ctrls: [
        { k: 'VR', l: 'V_R chung', min: 0, max: 20, step: 0.4, f: v => v.toFixed(1) + ' V' },
        { k: 'cmp', seg: [['linear', 'Đột biến vs Tuyến tính'], ['hyper', 'Đột biến vs Siêu đột biến']] },
        { k: 'a', l: 'Gradien a', min: 19, max: 21.5, step: 0.1, log: 1, f: v => pw(v) }
      ],
      draw(p, ctx, W, H, t, dt) {
        const S = p.S, st = p.st;
        const Vbi = 0.68;
        const rV = (Vbi + S.VR) / Vbi; // tỉ số tăng tổng thế so với 0V

        // Tỉ lệ mở rộng bề rộng vùng nghèo W(V_R) / W(0) của từng loại:
        // Đột biến (m=0): rV^(1/2)
        // Tuyến tính (m=1): rV^(1/3)
        // Siêu đột biến (m=-3/2): rV^2 (nén trực quan nhẹ khi rV lớn để vừa khung nhưng vẫn thấy vọt gấp bội!)
        const wStep = Math.pow(rV, 0.5);
        const wLin  = Math.pow(rV, 1 / 3);
        const wHyp  = Math.pow(rV, 1.35); // trực quan độ phóng cực nhanh của m<0

        const wB_target = S.cmp === 'linear' ? wLin : wHyp;
        if (st.wA == null) { st.wA = wStep; st.wB = wB_target; }
        st.wA += (wStep - st.wA) * Math.min(1, dt * 8);
        st.wB += (wB_target - st.wB) * Math.min(1, dt * 8);

        const padX = 20, topY = 26, gapY = 28;
        const barH = (H - topY - gapY - 26) / 2;
        const bw = W - padX * 2, midX = padX + bw / 2;

        // Hàm vẽ 1 thanh tinh thể với phân bố ion thật theo luật (step / linear / hyper)
        function drawBar(y, label, expLabel, wRatio, mode, accent) {
          const baseHalf = bw * 0.055; // nửa vùng nghèo ở V_R = 0 giống nhau để so sánh công bằng!
          const maxHalf = bw * 0.46;
          const halfPx = clamp(baseHalf * wRatio, baseHalf, maxHalf);
          const xL = midX - halfPx, xR = midX + halfPx;

          txt(ctx, label, padX, y - 10, accent, 12, 'left', 700);
          txt(ctx, expLabel + '  ·  W/W₀ = ×' + wRatio.toFixed(2) + '  ·  C\'/C\'₀ = ' + (1 / wRatio).toFixed(2), padX + bw, y - 10, C.ink, 11.5, 'right', 700);

          rr(ctx, padX, y, bw, barH, 8); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.save(); rr(ctx, padX, y, bw, barH, 8); ctx.clip();

          // Nền vùng trung hòa và vùng nghèo
          ctx.globalAlpha = 0.09;
          ctx.fillStyle = C.c4; ctx.fillRect(padX, y, xL - padX, barH);
          ctx.fillStyle = C.c2; ctx.fillRect(xR, y, padX + bw - xR, barH);
          ctx.globalAlpha = 0.19;
          ctx.fillStyle = accent; ctx.fillRect(xL, y, xR - xL, barH);
          ctx.restore();

          // Vẽ từng cột ion bên trong thanh theo đúng mật độ không gian!
          const rows = Math.max(3, Math.floor(barH / 26));
          const cols = 14;
          for (let c = 0; c < cols; c++) {
            const u = (c + 0.5) / cols; // khoảng cách chuẩn hóa từ x=0 ra biên (0..1)
            // Mật độ ion dọc theo u
            const dens = mode === 'step' ? 0.65
              : mode === 'linear' ? (0.15 + 0.85 * u)          // thưa ở giữa, dày dần ra ngoài!
              : (1.0 - 0.82 * Math.pow(u, 0.55));              // siêu đột biến: cực dày ở giữa, thưa hẳn ra ngoài!
            const nRows = Math.max(1, Math.round(dens * rows));
            const dx = u * (bw * 0.48);
            const inDep = dx <= halfPx;

            for (let r = 0; r < nRows; r++) {
              const yy = y + (r + 0.5) * (barH / nRows);
              if (inDep) {
                drawIon(ctx, midX - dx, yy, '−', C.c5, 4.8);
                drawIon(ctx, midX + dx, yy, '+', C.c4, 4.8);
              } else {
                dot(ctx, midX - dx, yy, 3.3, C.c4);
                dot(ctx, midX + dx, yy, 3.3, C.c2);
              }
            }
          }

          ln(ctx, midX, y, midX, y + barH, C.mut, 1.2);
          ln(ctx, xL, y, xL, y + barH, accent, 2, [4, 3]);
          ln(ctx, xR, y, xR, y + barH, accent, 2, [4, 3]);
          // Mũi tên chỉ biên vùng nghèo mở rộng
          if (S.VR > 0.4) {
            arr(ctx, midX - 8, y + barH / 2, xL + 4, y + barH / 2, accent, 2.2);
            arr(ctx, midX + 8, y + barH / 2, xR - 4, y + barH / 2, accent, 2.2);
          }
        }

        drawBar(topY + 6, '1) Tiếp giáp Đột biến (ion phân bố đều)', 'W ∝ V^(1/2) · C\' ∝ V^(−1/2)', st.wA, 'step', C.c5);

        const y2 = topY + barH + gapY + 6;
        if (S.cmp === 'linear') {
          const lj = linearJunc(S.a, S.VR, 'Si', 300);
          drawBar(y2, '2) Tiếp giáp Tuyến tính (ion thưa ở giữa, dày ra ngoài · W=' + fmtUm(lj.W) + ')', 'W ∝ V^(1/3) · C\' ∝ V^(−1/3)', st.wB, 'linear', C.c2);
        } else {
          drawBar(y2, '2) Siêu đột biến m < 0 (ion cực dày ở giữa, thưa dần ra ngoài)', 'W nở CỰC NHANH · C\' tụt mạnh', st.wB, 'hyper', C.main);
        }

        txt(ctx, S.cmp === 'linear'
          ? 'Ion càng ra ngoài càng dày → mép vùng nghèo chỉ cần nhích nhẹ là đủ điện tích (nở chậm hơn đột biến).'
          : 'Ion càng ra ngoài càng thưa → mép vùng nghèo phải phóng rất xa mới gom đủ điện tích (điện dung cực nhạy theo V_R!).',
          W / 2, H - 10, C.mut, 11, 'center', 600);
      }
    }
  ]
});

/* ==========================================================================
   TAB 8 — ĐIỐT BIẾN DUNG VARACTOR & THANG DÒ ĐÀI RADIO LC (Mục 5.4)
   ========================================================================== */
LABS.push({
  id: 'var', tag: '5b', name: 'Đài LC biến dung', sec: 5,
  S: { m: -1.5, VR: 4, Vbi: 0.7 },
  cols: '1.5fr 1fr', rows: '1.45fr 1fr', areas: '"a l" "c l"',
  panels: [
    {
      title: 'Mạch cộng hưởng LC dùng Varactor: vặn V_R để chỉnh khe tụ W & tần số dao động',
      area: 'a', anim: true,
      ctrls: [
        { k: 'm', l: 'Số mũ m', min: -1.75, max: 2, step: 0.05, f: v => v.toFixed(2) },
        { k: 'VR', l: 'Áp chỉnh V_R', min: 0, max: 10, step: 0.2, f: v => v.toFixed(1) + ' V' },
        { btn: 'm = −3/2 (Tuyến tính)', fn: p => { p.S.m = -1.5; p.syncCtrls(); p.dirty = true; } },
        { btn: 'm = 0 (Đột biến)', fn: p => { p.S.m = 0; p.syncCtrls(); p.dirty = true; } },
        { btn: 'm = +1 (Tuyến tính ρ)', fn: p => { p.S.m = 1; p.syncCtrls(); p.dirty = true; } }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const expC = -1 / (S.m + 2);
        const expF = 1 / (2 * (S.m + 2));
        const rC = Math.pow(1 + S.VR / S.Vbi, expC);     // C / C0
        const rW = 1 / rC;                               // W / W0
        const rF = Math.pow(1 + S.VR / S.Vbi, expF);     // f / f0
        const isLin = Math.abs(S.m + 1.5) < 0.03;

        // Vẽ mạch dao động LC thật: bên trái cuộn dây L, bên phải điốt biến dung (thấy khe W co giãn)
        const lx = W * 0.25, rx = W * 0.70, topY = 44, botY = H - 30, midY = (topY + botY) / 2;

        // Khung dây mạch kín LC
        ln(ctx, lx, topY, rx, topY, C.sub, 2.6);
        ln(ctx, lx, botY, rx, botY, C.sub, 2.6);
        ln(ctx, lx, topY, lx, topY + 22, C.sub, 2.6);
        ln(ctx, lx, botY - 22, lx, botY, C.sub, 2.6);
        ln(ctx, rx, topY, rx, midY - 46, C.sub, 2.6);
        ln(ctx, rx, midY + 46, rx, botY, C.sub, 2.6);

        // Chấm dòng điện dao động qua lại trong mạch LC với đúng tốc độ tỉ lệ rF!
        const omega = 2.2 + clamp(rF - 1, 0, 14) * 0.65;
        const osc = Math.sin(t * omega);
        const curPos = (rx - lx) * (0.5 + 0.36 * osc);
        dot(ctx, lx + curPos, topY, 4.5, C.main);
        dot(ctx, rx - curPos, botY, 4.5, C.main);

        // Cuộn cảm L (5 vòng cung đồng phát sáng theo nhịp từ trường)
        const coilTop = topY + 22, coilBot = botY - 22, nLoops = 5, loopH = (coilBot - coilTop) / nLoops;
        const magGlow = Math.abs(Math.cos(t * omega));
        ctx.save();
        ctx.globalAlpha = 0.1 + 0.22 * magGlow;
        rr(ctx, lx - 26, coilTop - 4, 52, coilBot - coilTop + 8, 12);
        ctx.fillStyle = C.c1; ctx.fill();
        ctx.restore();
        ctx.strokeStyle = C.c1; ctx.lineWidth = 3;
        for (let i = 0; i < nLoops; i++) {
          ctx.beginPath();
          ctx.arc(lx, coilTop + (i + 0.5) * loopH, loopH * 0.55, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
        }
        txt(ctx, 'Cuộn cảm L', lx - 36, midY, C.c1, 12, 'right', 700);

        // Điốt biến dung Varactor phóng to bên phải (thấy rõ hai vùng dẫn & khe vùng nghèo W!)
        const vw = 88, vh = 92, vx = rx - vw / 2, vy = midY - vh / 2;
        rr(ctx, vx, vy, vw, vh, 10); ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = isLin ? C.main : C.c4; ctx.lineWidth = 2; ctx.stroke();

        // Khe vùng nghèo W tỉ lệ trực tiếp với rW (nhưng kẹp trong lòng hộp để luôn đẹp mắt)
        const gapPx = clamp(10 + Math.log10(Math.max(1, rW)) * 42, 10, vh - 22);
        const pH = (vh - gapPx) / 2;
        ctx.save(); rr(ctx, vx, vy, vw, vh, 10); ctx.clip();
        ctx.fillStyle = C.c4; ctx.globalAlpha = 0.45; ctx.fillRect(vx, vy, vw, pH);
        ctx.fillStyle = C.c2; ctx.globalAlpha = 0.45; ctx.fillRect(vx, vy + vh - pH, vw, pH);
        ctx.fillStyle = C.main; ctx.globalAlpha = 0.16; ctx.fillRect(vx, vy + pH, vw, gapPx);
        ctx.restore();
        ln(ctx, vx, vy + pH, vx + vw, vy + pH, C.c4, 1.8);
        ln(ctx, vx, vy + vh - pH, vx + vw, vy + vh - pH, C.c2, 1.8);
        txt(ctx, 'p⁺', rx, vy + pH / 2, C.ink, 10.5, 'center', 800);
        txt(ctx, 'n (xᵐ)', rx, vy + vh - pH / 2, C.ink, 10.5, 'center', 800);
        txt(ctx, 'W = ' + rW.toFixed(1) + '×', rx, midY, C.main, 11.5, 'center', 800);

        // Nhãn thông số bên phải Varactor
        const tx = vx + vw + 12;
        txt(ctx, 'Varactor', tx, midY - 22, C.ink, 12, 'left', 700);
        txt(ctx, 'C/C₀ = ' + rC.toFixed(3), tx, midY, C.c4, 12, 'left', 700);
        txt(ctx, 'mũ C: ' + expC.toFixed(2), tx, midY + 20, C.mut, 11, 'left', 600);

        // Thanh tiêu đề trạng thái
        chip(ctx, isLin ? 'm = −3/2: Tần số TUYẾN TÍNH theo V_R!' : (S.m < 0 ? 'Siêu đột biến (m < 0): chỉnh tần rộng' : 'm ≥ 0: khe tụ mở chậm, dải chỉnh hẹp'),
          W / 2, 18, isLin ? C.main : C.c2, 'center');
        txt(ctx, 'f = 1 / (2π√LC) = ' + rF.toFixed(2) + ' f₀', W / 2, H - 12, isLin ? C.main : C.ink, 12.5, 'center', 700);
      }
    },
    {
      title: 'Thang dò đài Radio (MHz): nhìn độ đều của các vạch 0V, 2V, 4V, 6V, 8V, 10V!',
      area: 'c', anim: true,
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const expF = 1 / (2 * (S.m + 2));
        const fOf = v => Math.pow(1 + v / S.Vbi, expF);
        const f0 = 1, fMax = fOf(10), fCur = fOf(S.VR);
        const isLin = Math.abs(S.m + 1.5) < 0.03;

        // Khung mặt số đài Radio cổ điển
        const dx = 18, dy = 14, dw = W - 36, dh = H - 28;
        rr(ctx, dx, dy, dw, dh, 10);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = isLin ? C.main : C.sub; ctx.lineWidth = isLin ? 2 : 1.4; ctx.stroke();

        const tx1 = dx + 22, tx2 = dx + dw - 22, trackW = tx2 - tx1;
        const scaleY = dy + dh * 0.56;
        const xOfF = f => tx1 + ((f - f0) / Math.max(0.01, fMax - f0)) * trackW;

        // Thanh thang đo tần số
        ln(ctx, tx1, scaleY, tx2, scaleY, C.sub, 2);

        // Các vạch chia tương ứng V_R = 0, 2, 4, 6, 8, 10 V đặt lên thang tần số đều!
        // Nếu m = -3/2, các vạch 0V, 2V, 4V, 6V, 8V, 10V CÁCH ĐỀU NHAU TĂM TẮP!
        // Nếu m khác -3/2, các vạch bị dồn cục lại rất rõ!
        [0, 2, 4, 6, 8, 10].forEach(v => {
          const x = xOfF(fOf(v));
          ln(ctx, x, scaleY - 14, x, scaleY + 12, isLin ? C.c2 : C.c3, 2);
          txt(ctx, v + 'V', x, scaleY + 23, C.ink, 10.5, 'center', 700);
          txt(ctx, (10 * fOf(v)).toFixed(0), x, scaleY - 22, C.mut, 9.5, 'center');
        });

        // Kim dò đài màu đỏ/vàng chạy tới vị trí V_R hiện tại
        const cx = xOfF(fCur);
        ln(ctx, cx, dy + 8, cx, dy + dh - 8, C.err, 3);
        dot(ctx, cx, scaleY, 5.5, C.err);

        // Nhịp sóng nhỏ ở góc trái
        const freqMHz = 10 * fCur;
        txt(ctx, 'Tần số thu: ' + freqMHz.toFixed(1) + ' MHz', dx + 14, dy + 14, C.main, 12, 'left', 700);
        txt(ctx, isLin ? 'Các vạch 0V–10V cách đều nhau hoàn hảo!' : 'Các vạch V bị dồn lệch (không tuyến tính)',
          dx + dw - 14, dy + 14, isLin ? C.c2 : C.mut, 11, 'right', 700);
        void t;
      }
    }
  ]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM (intro = nguyên lý/cơ chế · react = phản hồi khi kéo)
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
    ['w', 'Chỉ số ít electron rất "nóng" (hạt vàng) mới leo qua được đỉnh dốc sang p — vừa khít bù lại vài electron thiểu số từ p trượt xuống n!'],
    ['i', 'V_bi = |φ_Fp| + |φ_Fn| = V_t ln(Nₐ N_d / nᵢ²): phụ thuộc logarit nên đổi pha tạp rất nhiều mà dốc chỉ cao thêm chút ít.'],
    ['v', 'Thử kéo Nₐ, N_d, nhiệt độ T hoặc đổi Si → GaAs (dốc cao hơn) / Ge (dốc thấp hơn).']
  ],
  react(S, k, P, say) {
    const j = stepJunc(S.mat, S.Na, S.Nd, S.T, 0);
    say('v', `${S.mat} (${S.T} K): chiều cao dốc V_bi = ${j.Vbi.toFixed(3)} V (φ_Fp = +${j.phiFp.toFixed(3)} V, |φ_Fn| = ${Math.abs(j.phiFn).toFixed(3)} V).`);
    if (k === 'mat') say('w', `${S.mat} có E_g = ${j.m.Eg} eV, nᵢ(300K) = ${sci(j.m.ni300, 1)} → vùng cấm rộng thì dốc thế V_bi càng cao.`);
    else if (k === 'T') say('w', S.T > (P.T || 300) ? 'Nhiệt độ tăng: hạt nhảy mạnh hơn, nᵢ tăng cực nhanh nên dốc thế V_bi hạ thấp dần.' : 'Nhiệt độ giảm: nᵢ tụt mạnh nên dốc thế V_bi dựng cao hơn.');
    else say('w', 'Tăng pha tạp 10 lần chỉ nâng dốc thế thêm ~60 mV (ở 300 K) vì quan hệ logarit.');
  }
};
LD.probe = {
  intro: [
    ['i', 'Trong vùng nghèo, mỗi đường sức điện trường bắt đầu từ một ion dương (+) bên n và kết thúc ở một ion âm (−) bên p.'],
    ['w', 'Tổng số ion (+) phải đúng bằng tổng số ion (−) (Nₐ xₚ = N_d xₙ) nên phía pha tạp nhẹ có ion thưa hơn → buộc phải lấn sâu hơn!'],
    ['w', 'Tất cả đường sức đều phải chui qua ranh giới x = 0, nên tại x = 0 điện trường mạnh nhất (|E_max|), càng ra mép càng thưa về 0.'],
    ['i', 'Di chuyển đầu dò từ −xₚ sang +xₙ: điện thế φ(x) tăng dần từ 0 đến đúng V_bi.'],
    ['v', 'Mặc định khớp Ví dụ 2.2 (Si, Nₐ=10¹⁶, N_d=10¹⁵): W = 0,951 µm, |E_max| = 1,34×10⁴ V/cm tại x = 0.']
  ],
  react(S, k, P, say) {
    const j = stepJunc(S.mat, S.Na, S.Nd, 300, 0);
    if (k === 'pos') {
      const halfPhys = Math.max(j.xp, j.xn) * 1.25;
      const xp = S.pos * halfPhys;
      if (xp <= -j.xp || xp >= j.xn) say('w', 'Đầu dò đang ở ngoài vùng nghèo (vùng trung hòa): không có đường sức đi qua nên |E(x)| = 0.');
      else if (Math.abs(S.pos) < 0.04) say('v', `Ngay tại tiếp giáp luyện kim x = 0: mọi đường sức đều cắt qua → |E_max| = ${sci(j.Emax, 2)} V/cm.`);
      else say('v', `Đầu dò tại x = ${xp >= 0 ? '+' : '−'}${fmtUm(Math.abs(xp))}: mật độ đường sức giảm dần về phía mép vùng nghèo.`);
    } else {
      say('v', `W = ${fmtUm(j.W)} (xₚ = ${fmtUm(j.xp)}, xₙ = ${fmtUm(j.xn)}), |E_max| = ${sci(j.Emax, 2)} V/cm.`);
      say('w', 'Nhìn khoảng cách giữa các ô vuông ion: bên pha tạp nhẹ ion thưa hơn nên vùng nghèo phải ăn sâu sang bên đó.');
    }
  }
};
LD.rev = {
  intro: [
    ['i', 'Phân cực ngược: nối cực âm pin vào p, cực dương pin vào n. Pin hút hạt đa số lùi xa khỏi tiếp giáp!'],
    ['w', 'Lùi hạt ra ngoài làm lộ thêm nhiều hàng ion cố định → vùng nghèo W phình rộng (W ∝ √(V_bi + V_R)) và điện trường bên trong tăng mạnh.'],
    ['w', 'Vùng p và n trung hòa ở hai đầu giống hai bản tụ dẫn điện, khe vùng nghèo W ở giữa là lớp cách điện → C\' = ε_s / W.'],
    ['i', 'V_R tăng làm khe W giãn rộng ra, nên điện dung C\' tụt giảm!'],
    ['v', 'Mặc định khớp Ví dụ 3.1 & 3.3: V_R = 5 V → W = 2,83 µm, C\' = 3,66 nF/cm², C = 0,366 pF.']
  ],
  react(S, k, P, say) {
    const j = stepJunc(S.mat, S.Na, S.Nd, 300, S.VR);
    say('v', `V_R = ${S.VR.toFixed(1)} V → W = ${fmtUm(j.W)}, |E_max| = ${sci(j.Emax, 2)} V/cm, C\' = ${(j.Cp * 1e9).toFixed(2)} nF/cm².`);
    if (k === 'VR') say('w', S.VR > (P.VR || 0) ? 'V_R tăng: hai "bản tụ" vùng trung hòa bị kéo ra xa hơn → kim điện dung tụt xuống.' : 'V_R giảm: vùng nghèo co lại, hai bản tụ tiến gần nhau hơn → kim điện dung tăng lên.');
    else say('w', 'Pha tạp càng đậm thì vùng nghèo càng mỏng, tụ có điện dung càng lớn nhưng điện trường |E_max| cũng tăng.');
  }
};
LD.cv = {
  intro: [
    ['i', 'Trong tiếp giáp một phía p⁺n (Nₐ ≫ N_d), phía p⁺ quá dày đặc nên gần như không lùi (xₚ ≈ 0); toàn bộ vùng nghèo nằm bên n (W ≈ xₙ).'],
    ['w', 'Khi ta vặn V_R tăng lên, mép vùng nghèo xₙ chạy sang phải như một pít-tông quét qua từng lớp nguyên tử donor bên n.'],
    ['w', 'Nếu phía n pha tạp nhẹ (donor thưa), chỉ nhích thêm 1V là pít-tông xₙ phóng đi rất xa → máy đo thấy điện dung C\' tụt rất mạnh!'],
    ['i', 'Từ tốc độ tụt của C\' theo V_R (độ dốc của 1/C\'²), máy đo giải mã chính xác N_d và ngoại suy ra V_bi mà không cần cắt mẫu.'],
    ['v', 'Mặc định là Mẫu Ví dụ 3.4: V_bi = 0,725 V, N_d = 1,96×10¹⁵ cm⁻³, Nₐ = 1,64×10¹⁷ cm⁻³. Thử đổi mẫu n nhẹ / n đậm!']
  ],
  react(S, k, P, say) {
    const j = stepJunc('Si', S.Na, S.Nd, 300, S.VR);
    say('v', `Tại V_R = ${S.VR.toFixed(1)} V: pít-tông quét sâu xₙ = ${fmtUm(j.xn)} → máy đo C\' = ${(j.Cp * 1e9).toFixed(2)} nF/cm².`);
    if (k === 'sample' || k === 'Nd') say('w', `N_d = ${pw(S.Nd)}: mật độ donor thay đổi làm độ sâu quét xₙ và số đọc C\' thay đổi ngay lập tức.`);
  }
};
LD.brk = {
  intro: [
    ['i', 'Tăng điện áp ngược V_R đến điện áp đánh thủng V_B, dòng ngược bùng phát mạnh (kim Ampe kế vọt vào vùng đỏ).'],
    ['w', 'Thác lũ (pha tạp nhẹ/vừa, vùng nghèo rộng): electron tăng tốc đập vỡ liên kết nguyên tử mạng tạo cặp e–h mới → chuỗi tuyết lở dây chuyền (∫αdx → 1).'],
    ['w', 'Zener (pha tạp rất nặng, tường rào cực mỏng): điện trường kéo căng liên kết, electron xuyên hầm lượng tử thẳng qua bức tường!'],
    ['i', 'Tiếp giáp một phía có V_B = ε_s E_crit² / (2e N_B): pha tạp phía nhẹ N_B càng thấp thì chịu áp ngược càng cao.'],
    ['v', 'Mặc định khớp Ví dụ 4.1 (N_B = 4×10¹⁵ → V_B ≈ 110 V). Kéo V_R vượt V_B để thấy hiệu ứng tuyết lở và kim Ampe kế vọt kịch khung!']
  ],
  react(S, k, P, say) {
    const { Ec, VB } = vBreakOf(S.mat, S.NB);
    say('v', `${S.mat}, N_B = ${pw(S.NB)}: E_crit ≈ ${sci(Ec, 2)} V/cm → V_B ≈ ${VB >= 10 ? VB.toFixed(0) : VB.toFixed(1)} V (đang đặt V_R = ${S.VR.toFixed(1)} V).`);
    if (S.VR >= VB) say('w', 'ĐÃ ĐÁNH THỦNG! Dòng ngược tăng dựng đứng — trong mạch thật phải có điện trở hạn dòng để bảo vệ linh kiện.');
    else if (k === 'mode') say('w', S.mode === 'zener' ? 'Chế độ Zener: bức tường vùng nghèo mỏng đi rõ rệt, sóng electron xuyên hầm qua rào ở điện áp thấp.' : 'Chế độ Thác lũ: vùng nghèo rộng đủ để hạt tải lấy đà va chạm ion hóa nhân hạt dây chuyền.');
    else if (k === 'NB') say('w', S.NB > (P.NB || 4e15) ? 'Tăng N_B làm vùng nghèo mỏng hơn, |E_max| nhanh chạm ngưỡng hơn → V_B giảm mạnh.' : 'Giảm N_B giúp chịu áp ngược V_B cao hơn nhiều.');
  }
};
LD.grad = {
  intro: [
    ['i', 'Hai thanh p-n được mắc chung một nguồn V_R và có cùng bề rộng ban đầu ở 0V để so sánh công bằng.'],
    ['w', 'Thanh trên (Đột biến): các ion xếp đều tăm tắp → vùng nghèo mở rộng theo căn bậc hai √V.'],
    ['w', 'Thanh dưới ở chế độ Tuyến tính: ion thưa ở giữa nhưng dày đặc ra hai bên → mép vùng nghèo chỉ nhích chút là đủ điện tích (nở chậm theo V^(1/3)).'],
    ['w', 'Chuyển sang Siêu đột biến (m < 0): ion tập trung dày ở giữa và thưa hẳn ra ngoài → mép vùng nghèo phóng cực xa để gom điện tích!'],
    ['v', 'Kéo thanh V_R chung và nhìn trực tiếp khoảng mở rộng của hai thanh trên dưới.']
  ],
  react(S, k, P, say) {
    const rV = (0.68 + S.VR) / 0.68;
    const wStep = Math.pow(rV, 0.5), wLin = Math.pow(rV, 1 / 3);
    if (S.cmp === 'linear') {
      const lj = linearJunc(S.a, S.VR, 'Si', 300);
      say('v', `V_R = ${S.VR.toFixed(1)} V: Đột biến nở ×${wStep.toFixed(2)}, còn Tuyến tính chỉ nở ×${wLin.toFixed(2)} (W = ${fmtUm(lj.W)}).`);
    } else {
      say('v', `V_R = ${S.VR.toFixed(1)} V: Đột biến nở ×${wStep.toFixed(2)}, còn Siêu đột biến phóng rộng hơn hẳn → điện dung C\' tụt cực nhanh!`);
    }
    if (k === 'cmp') say('w', S.cmp === 'hyper' ? 'Siêu đột biến có mật độ ion giảm dần ra xa: chính cấu trúc này tạo ra điốt biến dung cực nhạy.' : 'Tiếp giáp tuyến tính xuất hiện tự nhiên khi khuếch tán tạp chất vào tinh thể.');
  }
};
LD.var = {
  intro: [
    ['i', 'Điốt biến dung (Varactor) dùng trong mạch cộng hưởng LC: vặn điện áp V_R làm thay đổi khe W → đổi điện dung C → đổi tần số thu f = 1/(2π√LC).'],
    ['w', 'Hãy quan sát vị trí các vạch 0V, 2V, 4V, 6V, 8V, 10V trên mặt số thang dò đài Radio bên dưới!'],
    ['i', 'Khi chọn đúng m = −3/2 (siêu đột biến tuyến tính): C ∝ (V_bi+V_R)⁻² nên f ∝ 1/√C ∝ (V_bi+V_R) — các vạch điện áp cách đều nhau hoàn hảo trên thang tần số!'],
    ['w', 'Thử chuyển sang m = 0 (đột biến thường) hoặc m = +1 (tuyến tính): các vạch áp bị dồn cục lại, chỉnh đài không đều và dải tần rất hẹp.'],
    ['v', 'Vặn V_R để thấy kim dò đài trượt và cuộn dây LC đổi nhịp dao động ngay lập tức.']
  ],
  react(S, k, P, say) {
    const expC = -1 / (S.m + 2), expF = 1 / (2 * (S.m + 2));
    const rC = Math.pow(1 + S.VR / S.Vbi, expC), rF = Math.pow(1 + S.VR / S.Vbi, expF);
    say('v', `m = ${S.m.toFixed(2)}, V_R = ${S.VR.toFixed(1)} V → C/C₀ = ${rC.toFixed(3)}, tần số thu = ${(10 * rF).toFixed(1)} MHz (${rF.toFixed(2)}× f₀).`);
    if (Math.abs(S.m + 1.5) < 0.03) say('i', 'Đúng điểm vàng m = −3/2: mỗi bước tăng 2V đẩy kim dò đài đi đúng một quãng MHz bằng nhau!');
    else if (k === 'm') say('w', S.m < 0 ? 'm < 0 (siêu đột biến): khe tụ giãn mạnh, kim dò đài quét được dải tần rộng.' : 'm ≥ 0: vạch 6V–10V bị ép sát nhau, tăng thêm áp nhưng tần số hầu như nhích rất ít.');
  }
};
LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (#lab9 — phối màu & bố cục đồng bộ 100% với lab-b7.js)
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
#lab9 .lb-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
#lab9 .lb-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
#lab9 .lb-p.glow{animation:lb9glow 1.4s ease-out}
@keyframes lb9glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
#lab9 .lb-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
#lab9 .lb-cv{flex:1;min-height:0;position:relative}
#lab9 .lb-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#lab9 .lb-c{display:flex;flex-wrap:wrap;gap:6px 14px;padding:4px 10px 8px;flex:none;align-items:center}
#lab9 .lb-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
#lab9 .lb-k input[type=range]{width:clamp(70px,8vw,120px);margin:0}
#lab9 .lb-k output{color:var(--ink);font-weight:700;min-width:3.2em}
#lab9 .lb-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
#lab9 .lb-seg button,#lab9 .lb-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer}
#lab9 .lb-btn{background:var(--tint)}
#lab9 .lb-seg button:hover,#lab9 .lb-btn:hover{color:var(--ink)}
#lab9 .lb-seg button.on{background:var(--main);color:var(--bg)}
#lab9 .lb-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
#lab9 .lb-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb9in .4s ease-out;overflow-wrap:anywhere}
#lab9 .lb-ln::before{position:absolute;left:0;font-weight:700}
#lab9 .lb-ln.i{color:var(--ink)}#lab9 .lb-ln.i::before{content:'›';color:var(--c5)}
#lab9 .lb-ln.w{color:var(--ink)}#lab9 .lb-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
#lab9 .lb-ln.v{color:var(--main)}#lab9 .lb-ln.v::before{content:'=';color:var(--main)}
@keyframes lb9in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab-m:hover,.lab-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){#lab9 .lb-win{width:100vw;height:100dvh;border-radius:0}#lab9 .lb-b{overflow:auto;display:flex;flex-direction:column}#lab9 .lb-p{min-height:260px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style');
sty.textContent = CSS;
document.head.appendChild(sty);

let timers = [], ros = [], logEl = null;
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

function show(id, panelIdx) {
  const tab = LABS.find(l => l.id === id) || LABS[0];
  cur = tab; lastTab = tab.id;
  clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  [...tabsEl.children].forEach(b => b.classList.toggle('on', b.dataset.id === tab.id));

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
    try { p.spec.draw(p, ctx, p.W, p.H, tAcc, dt); } catch (err) { console.error('[LabB9]', err); }
    ctx.restore();
  });
  raf = requestAnimationFrame(loop);
}

function open(id, panelIdx) {
  ensureDom(); readColors(); opener = document.activeElement;
  root.hidden = false; show(id || lastTab, panelIdx);
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

function addMark(h, id, pi, title) {
  if (h.querySelector('.lab-m')) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'lab-m';
  b.innerHTML = FLASK;
  b.setAttribute('aria-label', 'Xem thí nghiệm: ' + title);
  b.title = 'Xem thí nghiệm';
  b.onclick = e => { e.preventDefault(); e.stopPropagation(); open(id, pi); };
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
    if (r) addMark(h, r[1], r[2], t);
  });
}

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 9') {
  markLesson(document.getElementById('app-content'));
}
window.LabB9 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
