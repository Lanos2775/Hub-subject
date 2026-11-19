/* ==========================================================================
   lab-b4.js — PHÒNG THÍ NGHIỆM LÝ THUYẾT LƯỢNG TỬ CHẤT RẮN BUỔI 4 (Tự Chứa)
   - Tự chứa hoàn toàn: tự chèn CSS + HTML popup (#lab4), đồng bộ 100% bảng màu
     & font chữ của trang, không xung đột với LabB1 / LabB2 / LabB3 / LabB5.
   - 7 tab mô phỏng vật lý trực tiếp phủ trọn lý thuyết & bài tập Buổi 4:
       1. Tách mức & Dải: 2 nguyên tử (ψA±ψB), chuỗi N nguyên tử & lai hóa Si
       2. Kronig–Penney & Bloch: Giải số f(αa)=cos(ka) (Câu 1, 2) & Sóng Bragg
       3. Đồ thị E-k, v & m*: 4 điểm A–D (Câu 4) & Đua độ cong Parabol (Câu 3)
       4. Dao động Bloch & Tán xạ: Gói sóng phản xạ Bragg vs Trôi v_d = μE
       5. Lỗ trống & Dải đầy: Nhảy liên kết Si + Không gian k (Σv = −v(k₀))
       6. Vật liệu & Quang học: GaAs thẳng vs Si xiên (Câu 5) & Kim/Bán/Cách
       7. g(E) & Fermi–Dirac: Nhân g(E)·f_F(E) rải hạt thật & So sánh MB/BE/FD
   - API: LabB4.open(tabId?, panelIndex?)  LabB4.close()  LabB4.mark(root)  LabB4.tabs()
   ========================================================================== */
(function () {
'use strict';

/* ---------- Hằng số vật lý & tiện ích toán học ---------- */
const TAU = Math.PI * 2;
const H_PL = 6.62607015e-34; // J·s
const HBAR = 1.0545718e-34;  // J·s
const ME = 9.1093837e-31;    // kg
const EV = 1.6021766e-19;    // J
const KB = 8.617333e-5;      // eV/K
const HBAR2_2ME_EV_A2 = 3.809982; // ħ²/(2m₀) theo đơn vị eV·Å²

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[d]).join('');
const sci = (x, d = 2) => {
  if (!x || !isFinite(x)) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  return (x / Math.pow(10, e)).toFixed(d) + '×10' + sup(e);
};

/* ---------- Đọc bảng màu & font trực tiếp từ giao diện trang ---------- */
const C = {};
let FONT = '"Be Vietnam Pro", system-ui, -apple-system, sans-serif';
let MONO = 'ui-monospace, SFMono-Regular, monospace';

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const def = {
    bg: '#2c2e31', card: '#242629', ink: '#d1d0c5', mut: '#646669', sub: '#525457',
    main: '#e2b714', err: '#ca4754', c1: '#86c27e', c2: '#7aa2f7', c3: '#e2b714',
    c4: '#e06c75', c5: '#bb9af7', g: '#3b3d42', tint: 'rgba(255,255,255,0.06)'
  };
  Object.keys(def).forEach(k => {
    C[k] = cs.getPropertyValue('--' + k).trim() || def[k];
  });
  const fUi = cs.getPropertyValue('--font-ui').trim();
  const fBody = cs.getPropertyValue('--font-body').trim();
  if (fUi) FONT = fUi;
  if (fBody || fUi) MONO = fUi || fBody;
}

function hexA(col, a) {
  if (!col) return `rgba(128,128,128,${a})`;
  const s = col.trim();
  if (s.startsWith('#')) {
    let h = s.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    if (!isNaN(n)) return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${a})`;
  return s;
}

/* Chuyển bước sóng ánh sáng (nm) sang màu RGB quang phổ thật */
function wlRGB(wl) {
  let r = 0, g = 0, b = 0;
  if (wl < 380) { r = 0.58; g = 0.28; b = 1.0; }
  else if (wl < 440) { r = -(wl - 440) / 60; g = 0; b = 1; }
  else if (wl < 490) { r = 0; g = (wl - 440) / 50; b = 1; }
  else if (wl < 510) { r = 0; g = 1; b = -(wl - 510) / 20; }
  else if (wl < 580) { r = (wl - 510) / 70; g = 1; b = 0; }
  else if (wl < 645) { r = 1; g = -(wl - 645) / 65; b = 0; }
  else if (wl <= 780) { r = 1; g = 0.10; b = 0.10; }
  else { r = 0.90; g = 0.24; b = 0.30; } // Hồng ngoại gần hiển thị đỏ thẫm
  const R = Math.round(r * 255), G = Math.round(g * 255), B = Math.round(b * 255);
  return { css: `rgb(${R},${G},${B})`, rgba: a => `rgba(${R},${G},${B},${a})` };
}

/* ---------- Tiện ích vẽ Canvas đồng bộ phong cách trang ---------- */
function txt(ctx, s, x, y, col, size, al, wt, fam) {
  ctx.font = (wt || 600) + ' ' + (size || 12) + 'px ' + (fam || FONT);
  ctx.fillStyle = col || C.ink;
  ctx.textAlign = al || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}
function ln(ctx, x1, y1, x2, y2, col, w, dash) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = col; ctx.lineWidth = w || 1;
  ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
}
function arrow(ctx, x1, y1, x2, y2, col, w, dash) {
  ln(ctx, x1, y1, x2, y2, col, w, dash);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hl = Math.max(6, (w || 1.5) * 3.4);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hl * Math.cos(ang - 0.42), y2 - hl * Math.sin(ang - 0.42));
  ctx.lineTo(x2 - hl * Math.cos(ang + 0.42), y2 - hl * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
}
function dot(ctx, x, y, r, col) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill();
}
function glowDot(ctx, x, y, r, colorCore, colorGlow) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
  g.addColorStop(0, colorCore);
  g.addColorStop(0.42, colorGlow);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, TAU); ctx.fill();
}
function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, Math.max(0, w / 2), Math.max(0, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
function drawChamber(ctx, x, y, w, h, r = 10) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = C.card; ctx.fill();
  ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.strokeStyle = hexA(C.g, 0.34);
  ctx.lineWidth = 1;
  for (let gx = x + 36; gx < x + w; gx += 36) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
  }
  for (let gy = y + 36; gy < y + h; gy += 36) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
  }
  ctx.restore();
}

/* ---------- Bộ giải số chính xác Kronig–Penney cho mọi P' >= 0 ---------- */
function kpF(u, P) {
  if (Math.abs(u) < 1e-6) return P + 1;
  return P * Math.sin(u) / u + Math.cos(u);
}

/* Tìm chính xác các dải cho phép [uMin, uMax] với n = 1..4 */
function solveKPBands(P) {
  const bands = [];
  for (let n = 1; n <= 4; n++) {
    const hiEdge = n * Math.PI;
    const loStart = (n - 1) * Math.PI + 1e-4;
    if (P < 1e-4) {
      bands.push({ n, lo: (n - 1) * Math.PI, hi: hiEdge });
      continue;
    }
    // f((n-1)π + ε) có dấu (-1)^(n-1) và vượt ±1; tại nπ thì f = (-1)^n
    const target = (n % 2 === 1) ? 1 : -1;
    let lo = loStart, hi = hiEdge - 1e-5;
    let fLo = kpF(lo, P) - target;
    for (let it = 0; it < 42; it++) {
      const mid = (lo + hi) * 0.5;
      const fm = kpF(mid, P) - target;
      if (fLo * fm <= 0) hi = mid;
      else { lo = mid; fLo = fm; }
    }
    bands.push({ n, lo: (lo + hi) * 0.5, hi: hiEdge });
  }
  return bands;
}

/* Giải ngược u = αa theo giá trị cos(ka) = rhs trong dải thứ n (1..4) */
function solveKPuAt(P, band, rhs) {
  if (P < 1e-4) {
    // Hạt tự do: cos(u) = rhs
    const base = (band.n - 1) * Math.PI;
    const ac = Math.acos(clamp(rhs, -1, 1));
    return band.n % 2 === 1 ? base + ac : band.n * Math.PI - ac;
  }
  let lo = band.lo, hi = band.hi;
  let fLo = kpF(lo, P) - rhs;
  for (let it = 0; it < 28; it++) {
    const mid = (lo + hi) * 0.5;
    const fm = kpF(mid, P) - rhs;
    if (fLo * fm <= 0) hi = mid;
    else { lo = mid; fLo = fm; }
  }
  return (lo + hi) * 0.5;
}

const LABS = [];

/* ==========================================================================
   TAB 1 — TÁCH MỨC NĂNG LƯỢNG & HÌNH THÀNH DẢI (Mục 1.1)
   - Chế độ 1 ("2 nguyên tử"): Kéo khoảng cách d → thấy 2 đám mây chồng lấn,
     tách mức E₀ ± Δ thành liên kết (ψA+ψB) và phản liên kết (ψA−ψB, mặt nút).
   - Chế độ 2 ("Chuỗi N nguyên tử"): Tăng N = 1..40, chọn mode k nút (0..N−1)
     quan sát trực tiếp sóng trên chuỗi và sự hội tụ thành dải rộng 4t!
   ========================================================================== */
LABS.push({
  id: 'bands', name: 'Tách mức & Dải', no: '1.1', secs: [1],
  S: { mode: 'two', dist: 2.35, sym: 'bond', N: 8, nodeIdx: 1, tHop: 0.50 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Từ nguyên tử rời rạc đến Dải năng lượng — Chồng lấn sóng & Lai hóa sp³',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['two', '2 nguyên tử (ψA±ψB)'], ['chain', 'Chuỗi N nguyên tử'], ['si', 'Silicon sp³ (d)']] },
      { k: 'dist', l: 'Khoảng cách d', min: 1.8, max: 5.5, step: 0.05, f: v => v.toFixed(2) + ' Å' },
      { k: 'sym', seg: [['bond', 'Liên kết (+)'], ['anti', 'Phản liên kết (−)']] },
      { k: 'N', l: 'Số nguyên tử N', min: 1, max: 40, step: 1, f: v => 'N = ' + v },
      { k: 'nodeIdx', l: 'Số nút', min: 0, max: 7, step: 1, dynRange: S => [0, Math.max(0, Math.min(S.N - 1, 15))], f: v => v + ' nút' },
      { btn: 'Si thật (2.35 Å)', fn: p => { p.S.mode = 'si'; p.S.dist = 2.35; curPanels.forEach(q => q.syncCtrls && q.syncCtrls()); queueReact(p.tab, 'dist'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      if (S.mode === 'two') {
        // --- CHẾ ĐỘ 1: HAI NGUYÊN TỬ TIẾN LẠI GẦN NHAU ---
        const d = S.dist; // 1.8 .. 5.5 Å
        const isBond = S.sym === 'bond';
        // Tích phân chồng lấn Δ tăng mạnh theo hàm mũ khi d giảm
        const delta = 2.4 * Math.exp(-(d - 1.8) / 0.85);

        const leftW = chW * 0.62;
        const boxX = chX + 14, boxY = chY + 38, boxW = leftW - 20, boxH = chH - 54;
        const midX = boxX + boxW * 0.5, midY = boxY + boxH * 0.44;

        // Vùng đám mây sóng 2D của 2 nguyên tử
        rr(ctx, boxX, boxY, boxW, boxH, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        const pxPerA = Math.min(boxW / 8.5, 58);
        const halfSep = (d * 0.5) * pxPerA;
        const xA = midX - halfSep, xB = midX + halfSep;
        const rOrb = 1.65 * pxPerA;

        ctx.save();
        rr(ctx, boxX + 1, boxY + 1, boxW - 2, boxH - 2, 7);
        ctx.clip();

        // Quầng đám mây nguyên tử A & B (cộng cùng pha hoặc trừ ngược pha)
        const pulse = 1 + 0.03 * Math.sin(t * 4);
        const colA = C.c3;
        const colB = isBond ? C.c3 : C.c2;

        const gA = ctx.createRadialGradient(xA, midY, 2, xA, midY, rOrb * pulse);
        gA.addColorStop(0, hexA(colA, 0.72));
        gA.addColorStop(0.45, hexA(colA, 0.30));
        gA.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gA;
        ctx.beginPath(); ctx.arc(xA, midY, rOrb * pulse, 0, TAU); ctx.fill();

        const gB = ctx.createRadialGradient(xB, midY, 2, xB, midY, rOrb * pulse);
        gB.addColorStop(0, hexA(colB, 0.72));
        gB.addColorStop(0.45, hexA(colB, 0.30));
        gB.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gB;
        ctx.beginPath(); ctx.arc(xB, midY, rOrb * pulse, 0, TAU); ctx.fill();

        // Cầu xác suất dồn vào giữa khi liên kết, hoặc mặt nút ψ = 0 khi phản liên kết
        if (isBond && d < 4.2) {
          const ov = clamp((4.2 - d) / 2.4, 0, 1);
          const gMid = ctx.createRadialGradient(midX, midY, 1, midX, midY, rOrb * 0.75);
          gMid.addColorStop(0, hexA('#fff1b8', 0.55 * ov));
          gMid.addColorStop(0.6, hexA(C.main, 0.25 * ov));
          gMid.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gMid;
          ctx.beginPath(); ctx.arc(midX, midY, rOrb * 0.75, 0, TAU); ctx.fill();
        } else if (!isBond) {
          ln(ctx, midX, boxY + 14, midX, boxY + boxH * 0.72, '#9be7ff', 1.6, [5, 4]);
          txt(ctx, 'Mặt nút ψ = 0', midX, boxY + 22, '#9be7ff', 10, 'center', 700, MONO);
        }

        // Vẽ đường cắt mặt phẳng sóng ψ(x) và mật độ |ψ(x)|² ở phần dưới hộp
        const baseY = boxY + boxH - 36;
        const ampY = Math.min(46, boxH * 0.20);
        ln(ctx, boxX + 12, baseY, boxX + boxW - 12, baseY, hexA(C.g, 0.9), 1, [3, 3]);

        const Npts = 140;
        const sigPx = 0.92 * pxPerA;
        // Tô mật độ |ψ|²
        ctx.beginPath();
        ctx.moveTo(boxX + 12, baseY);
        for (let i = 0; i <= Npts; i++) {
          const sx = boxX + 12 + (i / Npts) * (boxW - 24);
          const pA = Math.exp(-Math.abs(sx - xA) / sigPx);
          const pB = Math.exp(-Math.abs(sx - xB) / sigPx);
          const psi = isBond ? (pA + pB) * 0.65 : (pA - pB) * 0.78;
          ctx.lineTo(sx, baseY - psi * psi * ampY * 1.15);
        }
        ctx.lineTo(boxX + boxW - 12, baseY);
        ctx.closePath();
        ctx.fillStyle = hexA(isBond ? C.c2 : C.c4, 0.24); ctx.fill();

        // Đường sóng ψ(x) dao động pha nhẹ
        const osc = Math.cos(t * 3.0);
        ctx.beginPath();
        for (let i = 0; i <= Npts; i++) {
          const sx = boxX + 12 + (i / Npts) * (boxW - 24);
          const pA = Math.exp(-Math.abs(sx - xA) / sigPx);
          const pB = Math.exp(-Math.abs(sx - xB) / sigPx);
          const psi = (isBond ? (pA + pB) * 0.65 : (pA - pB) * 0.78) * osc;
          const sy = baseY - psi * ampY;
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = isBond ? C.c2 : C.c4; ctx.lineWidth = 2.4; ctx.stroke();

        // Hai hạt nhân A và B
        glowDot(ctx, xA, midY, 5.5, '#ffffff', hexA(C.main, 0.9));
        dot(ctx, xA, midY, 5, '#ffffff');
        txt(ctx, 'A', xA, midY - 14, C.ink, 10, 'center', 700, MONO);

        glowDot(ctx, xB, midY, 5.5, '#ffffff', hexA(C.main, 0.9));
        dot(ctx, xB, midY, 5, '#ffffff');
        txt(ctx, 'B', xB, midY - 14, C.ink, 10, 'center', 700, MONO);

        // Thước đo khoảng cách d
        ln(ctx, xA, midY + 18, xB, midY + 18, C.ink, 1.4);
        txt(ctx, 'd = ' + d.toFixed(2) + ' Å', midX, midY + 30, C.main, 10.5, 'center', 700, MONO);
        ctx.restore();

        // --- CỘT PHẢI: TÁCH MỨC NĂNG LƯỢNG E₀ → E₀ ± Δ ---
        const rx = chX + leftW + 4, rw = chW - leftW - 18, ry = boxY, rh = boxH;
        rr(ctx, rx, ry, rw, rh, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        const eMidY = ry + rh * 0.52;
        const pxPerEv = (rh * 0.36) / 2.4;
        const yAnti = eMidY - delta * pxPerEv;
        const yBond = eMidY + delta * pxPerEv;

        ln(ctx, rx + 14, eMidY, rx + rw - 14, eMidY, hexA(C.mut, 0.6), 1.2, [4, 4]);
        txt(ctx, 'E₀', rx + 16, eMidY - 10, C.mut, 10, 'left', 700, MONO);

        // Mức phản liên kết E₀ + Δ
        ln(ctx, rx + 26, yAnti, rx + rw - 22, yAnti, !isBond ? C.c4 : hexA(C.c4, 0.45), !isBond ? 3.5 : 2);
        txt(ctx, 'E₀ + Δ  (ψA − ψB)', rx + rw * 0.5, yAnti - 12, !isBond ? C.c4 : C.mut, 10, 'center', 700, MONO);

        // Mức liên kết E₀ − Δ
        ln(ctx, rx + 26, yBond, rx + rw - 22, yBond, isBond ? C.c2 : hexA(C.c2, 0.45), isBond ? 3.5 : 2);
        txt(ctx, 'E₀ − Δ  (ψA + ψB)', rx + rw * 0.5, yBond + 13, isBond ? C.c2 : C.mut, 10, 'center', 700, MONO);

        // Mũi tên chỉ độ tách 2Δ
        if (delta > 0.12) {
          arrow(ctx, rx + rw * 0.5, eMidY - 2, rx + rw * 0.5, yAnti + 4, C.c4, 1.5);
          arrow(ctx, rx + rw * 0.5, eMidY + 2, rx + rw * 0.5, yBond - 4, C.c2, 1.5);
        }
        txt(ctx, 'Độ tách 2Δ = ' + (2 * delta).toFixed(2) + ' eV', rx + rw * 0.5, ry + rh - 14, C.main, 10.5, 'center', 700, MONO);
        txt(ctx, 'TÁCH MỨC NĂNG LƯỢNG', rx + rw * 0.5, ry + 16, C.ink, 10, 'center', 700, MONO);

        txt(ctx, (isBond ? 'Tổ hợp cộng ψA + ψB: Xác suất dồn giữa 2 hạt nhân → E thấp' : 'Tổ hợp trừ ψA − ψB: Mặt nút ở giữa đẩy e⁻ ra ngoài → E cao'),
          chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
        txt(ctx, 'Δ = ' + delta.toFixed(2) + ' eV', chX + chW - 14, chY + 18, C.main, 10.8, 'right', 700, MONO);

      } else if (S.mode === 'chain') {
        // --- CHẾ ĐỘ 2: CHUỖI N NGUYÊN TỬ → DẢI LIÊN TỤC RỘNG 4t ---
        const N = clamp(Math.round(S.N), 1, 40);
        const kMode = clamp(Math.round(S.nodeIdx), 0, N - 1); // 0 .. N-1 nút
        const nIdx = kMode + 1; // 1 .. N
        const tVal = 1.0; // eV

        const leftW = chW * 0.60;
        const bx = chX + 14, by = chY + 38, bw = leftW - 18, bh = chH - 54;
        rr(ctx, bx, by, bw, bh, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        // Hiển thị chuỗi nguyên tử (tối đa 16 nguyên tử rõ nét trên trục sóng đứng)
        const Nshow = Math.min(N, 16);
        const nShowMode = clamp(kMode, 0, Nshow - 1) + 1;
        const midY = by + bh * 0.54;
        const ampMax = bh * 0.30;
        const osc = Math.cos(t * (2.6 + nShowMode * 0.45));

        ln(ctx, bx + 18, midY, bx + bw - 18, midY, hexA(C.g, 0.9), 1.2, [4, 4]);

        // Đường bao hình sin sóng đứng của trạng thái nShowMode
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const u = i / 120;
          const sx = bx + 20 + u * (bw - 40);
          const val = Math.sin(nShowMode * Math.PI * u) * osc;
          const sy = midY - val * ampMax;
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = hexA(C.c5, 0.45); ctx.lineWidth = 1.6; ctx.stroke();

        // Các nguyên tử trên chuỗi: bán kính ∝ |ψ_j|, màu cam (+) vs xanh (−)
        for (let j = 1; j <= Nshow; j++) {
          const u = j / (Nshow + 1);
          const ax = bx + 20 + u * (bw - 40);
          const psi = Math.sin(nShowMode * Math.PI * u) * osc;
          const ay = midY - psi * ampMax;
          const rad = clamp(4 + Math.abs(psi) * 10, 3.5, 14);
          const col = psi >= 0 ? C.c3 : C.c2;
          ln(ctx, ax, midY, ax, ay, hexA(col, 0.5), 1.6);
          dot(ctx, ax, midY, 2.5, C.sub);
          glowDot(ctx, ax, ay, rad * 0.65, C.ink, hexA(col, 0.85));
          dot(ctx, ax, ay, rad * 0.58, col);
        }
        txt(ctx, 'Trạng thái chuỗi (' + kMode + ' nút) — Cam: ψ > 0 · Xanh: ψ < 0',
          bx + bw * 0.5, by + 18, C.ink, 10.5, 'center', 700, MONO);
        txt(ctx, N > 16 ? '(Hiển thị 16/' + N + ' nguyên tử đầu để rõ pha sóng)' : 'Cả ' + N + ' nguyên tử dao động cùng một trạng thái dừng',
          bx + bw * 0.5, by + bh - 14, C.mut, 9.8, 'center', 500, MONO);

        // Cột phải: Toàn bộ N mức năng lượng bị nhốt trong [E₀ − 2t, E₀ + 2t]
        const rx = chX + leftW + 4, rw = chW - leftW - 18, ry = by, rh = bh;
        rr(ctx, rx, ry, rw, rh, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        const bTop = ry + 34, bBot = ry + rh - 30, bH = bBot - bTop;
        // Vùng nền dải cho phép [E₀ − 2t, E₀ + 2t]
        ctx.fillStyle = hexA(C.c1, 0.12);
        ctx.fillRect(rx + 26, bTop, rw - 52, bH);
        ln(ctx, rx + 20, bTop, rx + rw - 20, bTop, C.c4, 1.2, [4, 3]);
        ln(ctx, rx + 20, bBot, rx + rw - 20, bBot, C.c2, 1.2, [4, 3]);
        txt(ctx, '+2t', rx + rw - 16, bTop, C.c4, 9.5, 'left', 700, MONO);
        txt(ctx, '−2t', rx + rw - 16, bBot, C.c2, 9.5, 'left', 700, MONO);

        let curE = 0;
        for (let m = 1; m <= N; m++) {
          const eRel = -2 * tVal * Math.cos((m * Math.PI) / (N + 1)); // [-2t, +2t]
          const y = bBot - ((eRel + 2 * tVal) / (4 * tVal)) * bH;
          const isSel = m === nIdx;
          if (isSel) curE = eRel;
          ln(ctx, rx + 28, y, rx + rw - 28, y, isSel ? C.main : hexA(C.c1, N > 22 ? 0.65 : 0.85), isSel ? 2.8 : (N > 24 ? 1.0 : 1.8));
        }

        txt(ctx, 'PHỔ N = ' + N + ' MỨC', rx + rw * 0.5, ry + 16, C.ink, 10, 'center', 700, MONO);
        txt(ctx, 'Bề rộng cố định 4t · ΔE_tb ≈ ' + (4 / N).toFixed(2) + 't', rx + rw * 0.5, ry + rh - 14, C.main, 9.8, 'center', 700, MONO);

        txt(ctx, 'Chuỗi N = ' + N + ' nguyên tử: E_n = E₀ − 2t·cos(nπ/(N+1))',
          chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
        txt(ctx, 'Mức chọn (' + kMode + ' nút): E − E₀ = ' + (curE >= 0 ? '+' : '') + curE.toFixed(2) + 't',
          chX + chW - 14, chY + 18, C.main, 10.8, 'right', 700, MONO);

      } else {
        // --- CHẾ ĐỘ 3: SILICON LAI HÓA sp³ THEO KHOẢNG CÁCH d ---
        const d = S.dist; // 1.8 .. 5.5 Å
        const bx = chX + 16, by = chY + 42, bw = chW - 32, bh = chH - 64;
        rr(ctx, bx, by, bw, bh, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        const dMin = 1.8, dMax = 5.5;
        const xOfD = dv => bx + 36 + ((dv - dMin) / (dMax - dMin)) * (bw - 58);
        const yOfE = ev => by + bh - 24 - ((ev + 13) / 25) * (bh - 42);

        // Tính đường biên trên/dưới dải dẫn & dải hóa trị Silicon (khớp Hình 1.1e)
        const siBands = dv => {
          const ov = Math.exp(-(dv - 2.35) / 1.05);
          const vbBot = -4.2 - 7.8 * ov;
          const cbTop = 3.2 + 7.2 * ov;
          // Lai hóa sp³ mở khe khi d < 3.45 Å
          const gap = dv < 3.45 ? 1.12 * Math.pow((3.45 - dv) / (3.45 - 2.35), 1.25) : 0;
          const vbTop = dv < 3.45 ? -gap * 0.5 : -0.2 + 0.5 * (dv - 3.45) * 0.1;
          const cbBot = dv < 3.45 ? gap * 0.5 : -0.6 - 0.15 * (dv - 3.45);
          return { vbBot, vbTop, cbBot, cbTop, gap };
        };

        // Vẽ vùng Dải dẫn (hồng) & Dải hóa trị (xanh)
        const M = 80;
        ctx.beginPath();
        for (let i = 0; i <= M; i++) {
          const dv = dMin + (i / M) * (dMax - dMin);
          const b = siBands(dv);
          i === 0 ? ctx.moveTo(xOfD(dv), yOfE(b.cbTop)) : ctx.lineTo(xOfD(dv), yOfE(b.cbTop));
        }
        for (let i = M; i >= 0; i--) {
          const dv = dMin + (i / M) * (dMax - dMin);
          const b = siBands(dv);
          ctx.lineTo(xOfD(dv), yOfE(b.cbBot));
        }
        ctx.closePath();
        ctx.fillStyle = hexA(C.c4, 0.28); ctx.fill();
        ctx.strokeStyle = C.c4; ctx.lineWidth = 1.6; ctx.stroke();

        ctx.beginPath();
        for (let i = 0; i <= M; i++) {
          const dv = dMin + (i / M) * (dMax - dMin);
          const b = siBands(dv);
          i === 0 ? ctx.moveTo(xOfD(dv), yOfE(b.vbTop)) : ctx.lineTo(xOfD(dv), yOfE(b.vbTop));
        }
        for (let i = M; i >= 0; i--) {
          const dv = dMin + (i / M) * (dMax - dMin);
          const b = siBands(dv);
          ctx.lineTo(xOfD(dv), yOfE(b.vbBot));
        }
        ctx.closePath();
        ctx.fillStyle = hexA(C.c1, 0.30); ctx.fill();
        ctx.strokeStyle = C.c1; ctx.lineWidth = 1.6; ctx.stroke();

        // Mốc Silicon thật d = 2.35 Å
        const xSi = xOfD(2.35);
        ln(ctx, xSi, by + 10, xSi, by + bh - 24, hexA(C.c2, 0.65), 1.4, [4, 4]);
        txt(ctx, 'Si thật 2.35 Å', xSi + 6, by + 20, C.c2, 9.8, 'left', 700, MONO);

        // Con trỏ khoảng cách d hiện tại
        const xCur = xOfD(d);
        const curB = siBands(d);
        ln(ctx, xCur, by + 8, xCur, by + bh - 24, C.main, 2.2);
        if (curB.gap > 0.05) {
          ln(ctx, xCur, yOfE(curB.vbTop), xCur, yOfE(curB.cbBot), C.main, 5);
          txt(ctx, 'E_g = ' + curB.gap.toFixed(2) + ' eV', xCur + 10, yOfE(0), C.main, 11, 'left', 800, MONO);
        } else {
          txt(ctx, 'Chồng dải (E_g = 0)', xCur - 10, yOfE(0) - 16, C.err, 10.5, 'right', 700, MONO);
        }

        txt(ctx, 'Dải dẫn (4N chỗ, trống)', xOfD(4.4), yOfE(4.5), C.c4, 11, 'center', 700);
        txt(ctx, 'Dải hóa trị (4N chỗ, đầy 4N e⁻)', xOfD(4.4), yOfE(-4.2), C.c1, 11, 'center', 700);
        [2, 3, 4, 5].forEach(dv => { txt(ctx, dv + ' Å', xOfD(dv), by + bh - 10, C.mut, 10, 'center', 600, MONO); });

        txt(ctx, 'Silicon (3s² 3p² → lai hóa sp³): 8N trạng thái tách thành 4N + 4N',
          chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
        txt(ctx, 'd = ' + d.toFixed(2) + ' Å  |  ' + (curB.gap > 0.05 ? 'Vùng cấm E_g = ' + curB.gap.toFixed(2) + ' eV' : 'Chưa mở vùng cấm'),
          chX + chW - 14, chY + 18, curB.gap > 0.05 ? C.main : C.err, 10.8, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 2 — MÔ HÌNH KRONIG–PENNEY (Câu 1 & Câu 2) & SÓNG ĐỨNG BRAGG (Mục 1.2–1.5)
   - Chế độ 1 ("Đồ thị f(αa) & Câu 1,2"): Giải số chính xác phương trình
     P'·sin(αa)/(αa) + cos(αa) = cos(ka), tự tính các khoảng dải cho phép & eV!
   - Chế độ 2 ("Sóng đứng Bragg & Bloch"): Giải thích khe cấm tại k = π/a bằng
     hai sóng đứng ψ₊ ∝ cos(πx/a) (dồn lên ion) và ψ₋ ∝ sin(πx/a) (giữa 2 ion).
   ========================================================================== */
LABS.push({
  id: 'kp', name: 'Kronig–Penney & Bragg', no: '1.2–1.5', secs: [],
  S: { view: 'kp', P: 12.0, a: 5.0 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Kronig–Penney P′·sin(αa)/(αa) + cos(αa) = cos(ka) & Sóng đứng Bragg tại k = π/a',
    area: 'a', anim: true,
    ctrls: [
      { k: 'view', seg: [['kp', 'Giải f(αa) (Câu 1, 2)'], ['bragg', 'Sóng đứng Bragg (k=π/a)']] },
      { k: 'P', l: "Liên kết P'", min: 0, max: 16, step: 0.5, f: v => v.toFixed(1) },
      { k: 'a', l: 'Chu kỳ a', min: 2.5, max: 6.5, step: 0.5, f: v => v.toFixed(1) + ' Å' },
      { btn: "Câu 1,2 (P'=12)", fn: p => { p.S.view = 'kp'; p.S.P = 12; p.S.a = 5.0; p.syncCtrls(); queueReact(p.tab, 'P'); } },
      { btn: "Slide (P'=8)", fn: p => { p.S.view = 'kp'; p.S.P = 8; p.syncCtrls(); queueReact(p.tab, 'P'); } },
      { btn: "Tự do (P'=0)", fn: p => { p.S.view = 'kp'; p.S.P = 0; p.syncCtrls(); queueReact(p.tab, 'P'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      const bands = solveKPBands(S.P);
      const uToEv = u => HBAR2_2ME_EV_A2 * (u * u) / (S.a * S.a);

      if (S.view === 'kp') {
        // Bố cục 2 khu: Trái = f(αa) từ 0..4π với dải [-1, +1]; Phải = Giản đồ E(k) rút gọn
        const splitX = chX + chW * 0.60;
        const topY = chY + 42, botY = chY + chH - 36, gH = botY - topY;

        // 1. KHUNG TRÁI: Đồ thị f(αa)
        const gx0 = chX + 34, gx1 = splitX - 16, gW = gx1 - gx0;
        rr(ctx, gx0, topY, gW, gH, 6);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

        const fMax = 5.5;
        const xOfU = u => gx0 + (u / (4 * Math.PI)) * gW;
        const yOfF = f => topY + gH * 0.5 - clamp(f, -fMax, fMax) / fMax * (gH * 0.44);
        const yP1 = yOfF(1), yM1 = yOfF(-1), y0 = yOfF(0);

        // Tô các dải cho phép (xanh lam)
        bands.forEach(b => {
          const x1 = xOfU(b.lo), x2 = xOfU(b.hi);
          ctx.fillStyle = hexA(C.c2, 0.24);
          ctx.fillRect(x1, topY + 1, x2 - x1, gH - 2);
        });

        // Đường chuẩn 0, +1, -1
        ln(ctx, gx0, y0, gx1, y0, hexA(C.g, 0.9), 1);
        ln(ctx, gx0, yP1, gx1, yP1, C.c4, 1.4, [5, 3]);
        ln(ctx, gx0, yM1, gx1, yM1, C.c4, 1.4, [5, 3]);
        txt(ctx, '+1', gx0 - 6, yP1, C.c4, 9.5, 'right', 700, MONO);
        txt(ctx, '−1', gx0 - 6, yM1, C.c4, 9.5, 'right', 700, MONO);

        // Vẽ đường cong f(αa)
        ctx.save();
        rr(ctx, gx0 + 1, topY + 1, gW - 2, gH - 2, 5);
        ctx.clip();
        ctx.beginPath();
        const M = 240;
        for (let i = 0; i <= M; i++) {
          const u = (i / M) * 4 * Math.PI;
          const sy = yOfF(kpF(u, S.P));
          i === 0 ? ctx.moveTo(xOfU(u), sy) : ctx.lineTo(xOfU(u), sy);
        }
        ctx.strokeStyle = C.c5; ctx.lineWidth = 2.5; ctx.stroke();

        // Điểm sáng quét nhẹ theo thời gian trên dải 1 & 2 để người học thấy cos(ka) dao động trong [-1, 1]
        const cosK = Math.cos(t * 2.2);
        bands.slice(0, 2).forEach(b => {
          const uCur = solveKPuAt(S.P, b, cosK);
          glowDot(ctx, xOfU(uCur), yOfF(cosK), 4.2, C.ink, hexA(C.main, 0.95));
        });
        ctx.restore();

        [1, 2, 3, 4].forEach(n => {
          const ux = xOfU(n * Math.PI);
          ln(ctx, ux, topY, ux, botY, hexA(C.g, 0.6), 1, [2, 3]);
          txt(ctx, n + 'π', ux, botY + 12, C.ink, 10, 'center', 700, MONO);
        });
        txt(ctx, 'Trục ngang: αa   |   Vùng xanh: Dải cho phép (|f| ≤ 1)', (gx0 + gx1) * 0.5, botY + 26, C.mut, 9.8, 'center', 600, MONO);

        // 2. KHUNG PHẢI: Cấu trúc dải E(k) rút gọn [−π/a, +π/a] tính từ nghiệm trên
        const kx0 = splitX + 8, kx1 = chX + chW - 14, kW = kx1 - kx0;
        rr(ctx, kx0, topY, kW, gH, 6);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

        const uMaxPlot = 2.15 * Math.PI;
        const yOfU = u => botY - 12 - ((u * u) / (uMaxPlot * uMaxPlot)) * (gH - 28);
        const xOfK = kf => kx0 + 18 + ((kf + 1) * 0.5) * (kW - 36); // kf in [-1, +1]

        // Vùng cấm 1 giữa dải 1 và dải 2
        const yGapBot = yOfU(bands[0].hi), yGapTop = yOfU(bands[1].lo);
        if (yGapBot - yGapTop > 1) {
          ctx.fillStyle = hexA(C.c4, 0.16);
          ctx.fillRect(kx0 + 18, yGapTop, kW - 36, yGapBot - yGapTop);
          const eg12 = uToEv(bands[1].lo) - uToEv(bands[0].hi);
          txt(ctx, 'E_g = ' + eg12.toFixed(2) + ' eV', (kx0 + kx1) * 0.5, (yGapTop + yGapBot) * 0.5, C.c4, 10, 'center', 700, MONO);
        }

        // Đường parabol tự do nét đứt mờ
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const kf = -1 + (i / 60) * 2;
          const uFree = Math.abs(kf) * Math.PI;
          const sx = xOfK(kf), sy = yOfU(uFree);
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = hexA(C.mut, 0.45); ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);

        // Vẽ Dải 1 và Dải 2 trên vùng Brillouin thứ nhất
        [bands[0], bands[1]].forEach((b, bi) => {
          ctx.beginPath();
          for (let i = 0; i <= 64; i++) {
            const kf = -1 + (i / 64) * 2;
            const rhs = Math.cos(kf * Math.PI);
            const u = solveKPuAt(S.P, b, rhs);
            const sx = xOfK(kf), sy = yOfU(u);
            i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
          }
          ctx.strokeStyle = bi === 0 ? C.c3 : C.c2; ctx.lineWidth = 2.8; ctx.stroke();
        });

        txt(ctx, '−π/a', xOfK(-1), botY + 12, C.ink, 9.5, 'center', 700, MONO);
        txt(ctx, '0', xOfK(0), botY + 12, C.ink, 9.5, 'center', 700, MONO);
        txt(ctx, '+π/a', xOfK(1), botY + 12, C.ink, 9.5, 'center', 700, MONO);
        txt(ctx, 'Đồ thị E(k) vùng rút gọn', (kx0 + kx1) * 0.5, topY + 14, C.ink, 10, 'center', 700, MONO);

        // Thông số khớp chuẩn Câu 1 & Câu 2 ở mép trên
        const b1 = bands[0], b2 = bands[1];
        txt(ctx, "P' = " + S.P.toFixed(1) + '  |  Dải 1: αa ∈ [' + b1.lo.toFixed(2) + ', π] (' + uToEv(b1.lo).toFixed(2) + '–' + uToEv(b1.hi).toFixed(2) + ' eV)',
          chX + 14, chY + 18, C.ink, 10.6, 'left', 700, MONO);
        txt(ctx, 'Dải 2: [' + b2.lo.toFixed(2) + ', 2π] (' + uToEv(b2.lo).toFixed(2) + '–' + uToEv(b2.hi).toFixed(2) + ' eV)',
          chX + chW - 14, chY + 18, C.main, 10.6, 'right', 700, MONO);

      } else {
        // --- CHẾ ĐỘ 2: SÓNG ĐỨNG BRAGG TẠI k = π/a GIẢI THÍCH KHE CẤM E_g ---
        const boxX = chX + 16, boxW = chW - 32;
        const rowH = (chH - 72) * 0.5;
        const r1Y = chY + 42, r2Y = r1Y + rowH + 14;
        const nIons = 6;
        const ionStep = (boxW - 80) / (nIons - 1);
        const xStart = boxX + 40;

        const drawStandingRow = (ry, isCos, title, col, note) => {
          rr(ctx, boxX, ry, boxW, rowH, 8);
          ctx.fillStyle = C.bg; ctx.fill();
          ctx.strokeStyle = hexA(col, 0.55); ctx.lineWidth = 1.4; ctx.stroke();

          const midY = ry + rowH * 0.58;
          const amp = rowH * 0.30;
          ln(ctx, boxX + 16, midY, boxX + boxW - 16, midY, hexA(C.g, 0.8), 1, [3, 3]);

          // Vẽ mật độ xác suất |ψ|² = cos²(πx/a) hoặc sin²(πx/a)
          ctx.beginPath();
          ctx.moveTo(xStart - ionStep * 0.4, midY);
          const Np = 180;
          const xL = xStart - ionStep * 0.4, xR = xStart + (nIons - 1 + 0.4) * ionStep;
          for (let i = 0; i <= Np; i++) {
            const sx = xL + (i / Np) * (xR - xL);
            const ph = Math.PI * (sx - xStart) / ionStep;
            const v = isCos ? Math.cos(ph) : Math.sin(ph);
            ctx.lineTo(sx, midY - v * v * amp * 1.15);
          }
          ctx.lineTo(xR, midY);
          ctx.closePath();
          ctx.fillStyle = hexA(col, 0.30); ctx.fill();

          // Vẽ sóng đứng dao động tại chỗ theo thời gian: ψ(x,t) = ψ(x)·cos(ωt)
          const osc = Math.cos(t * 3.8);
          ctx.beginPath();
          for (let i = 0; i <= Np; i++) {
            const sx = xL + (i / Np) * (xR - xL);
            const ph = Math.PI * (sx - xStart) / ionStep;
            const v = (isCos ? Math.cos(ph) : Math.sin(ph)) * osc;
            const sy = midY - v * amp;
            i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
          }
          ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.stroke();

          // Hàng ion dương (+) nằm tại x = 0, a, 2a, ...
          for (let k = 0; k < nIons; k++) {
            const ix = xStart + k * ionStep;
            glowDot(ctx, ix, midY + 12, 6.5, C.ink, hexA(C.c3, 0.75));
            dot(ctx, ix, midY + 12, 6, C.c3);
            txt(ctx, '+', ix, midY + 12.5, C.bg, 9.5, 'center', 800, MONO);
          }

          txt(ctx, title, boxX + 14, ry + 16, col, 11, 'left', 700, MONO);
          txt(ctx, note, boxX + boxW - 14, ry + 16, C.ink, 10.2, 'right', 600);
        };

        drawStandingRow(r1Y, false, 'ψ₋ ∝ sin(πx/a)  →  Mép dưới dải trên (E₊ CAO)', C.c4, 'Xác suất dồn VÀO GIỮA hai ion (+), tránh ion');
        drawStandingRow(r2Y, true, 'ψ₊ ∝ cos(πx/a)  →  Mép trên dải dưới (E₋ THẤP)', C.c2, 'Xác suất dồn NGAY LÊN ion (+) → bị hút mạnh');

        const eg12 = uToEv(bands[1].lo) - uToEv(bands[0].hi);
        txt(ctx, 'Phản xạ Bragg tại k = π/a (λ = 2a): Sóng +k và −k tạo 2 sóng đứng',
          chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
        txt(ctx, 'Khe vùng cấm E_g = E₊ − E₋ = ' + eg12.toFixed(2) + ' eV',
          chX + chW - 14, chY + 18, C.main, 10.8, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 3 — GIẢN ĐỒ E-k, VẬN TỐC NHÓM v & KHỐI LƯỢNG HIỆU DỤNG m* (Câu 3 & Câu 4)
   - Chế độ 1 ("Câu 4: 4 điểm A,B,C,D"): Kéo k từ −π/a đến +π/a, đọc độ dốc v,
     độ cong m* và quan sát electron thực tế TĂNG TỐC hay PHANH NGƯỢC dưới lực F!
   - Chế độ 2 ("Câu 3: So sánh 2 Parabol"): Đường đua thực tế giữa electron ở
     Parabol A (hẹp, m* nhẹ) và Parabol B (rộng, m* nặng) dưới cùng lực F!
   ========================================================================== */
LABS.push({
  id: 'ek', name: 'Đồ thị E-k & m*', no: '2.1–2.4', secs: [2],
  S: { mode: 'q4', kFrac: 0.30, tA: 0.40, tB: 0.10, push: false },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Đọc chuyển động từ E(k) — Vận tốc v ∝ dE/dk, Khối lượng m* ∝ 1/(d²E/dk²)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['q4', 'Câu 4 (4 điểm A–D)'], ['q3', 'Câu 3 (Đua 2 Parabol)']] },
      { k: 'kFrac', l: 'Vị trí k', min: -0.95, max: 0.95, step: 0.05, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + 'π/a' },
      { btn: 'A (−0.8)', fn: p => { p.S.mode = 'q4'; p.S.kFrac = -0.80; p.syncCtrls(); queueReact(p.tab, 'kFrac'); } },
      { btn: 'B (−0.3)', fn: p => { p.S.mode = 'q4'; p.S.kFrac = -0.30; p.syncCtrls(); queueReact(p.tab, 'kFrac'); } },
      { btn: 'C (+0.3)', fn: p => { p.S.mode = 'q4'; p.S.kFrac = 0.30; p.syncCtrls(); queueReact(p.tab, 'kFrac'); } },
      { btn: 'D (+0.8)', fn: p => { p.S.mode = 'q4'; p.S.kFrac = 0.80; p.syncCtrls(); queueReact(p.tab, 'kFrac'); } },
      { btn: 'Đẩy lực F →', fn: p => { p.st.raceT = 0; p.S.push = !p.S.push; queueReact(p.tab, 'push'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      if (S.mode === 'q4') {
        // --- CHẾ ĐỘ CÂU 4: DẢI E(k) = (E₀/2)(1 − cos ka) + ĐƯỜNG THỬ GIA TỐC ---
        if (S.push) {
          S.kFrac += dt * 0.28;
          if (S.kFrac > 0.96) S.kFrac = -0.96;
          p.syncCtrls();
        }
        const kf = S.kFrac; // [-1, 1]
        const ka = kf * Math.PI;
        const E0 = 2.0; // eV
        const a_A = 5.43; // Å
        const eVal = (E0 * 0.5) * (1 - Math.cos(ka));
        const vNorm = Math.sin(ka); // tỉ lệ v
        const invM = Math.cos(ka);  // tỉ lệ 1/m*
        const vSI = ((E0 * 0.5 * EV * a_A * 1e-10) / HBAR) * vNorm; // m/s
        const m0Ratio = Math.abs(invM) > 0.03 ? (HBAR2_2ME_EV_A2 / (0.5 * E0 * a_A * a_A * 0.5 * invM)) : Infinity;

        const gX0 = chX + 34, gX1 = chX + chW - 22, gW = gX1 - gX0;
        const gY0 = chY + 40, gH = chH * 0.58, gY1 = gY0 + gH;

        rr(ctx, gX0, gY0, gW, gH, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

        const xOfK = k => gX0 + 16 + ((k + 1) * 0.5) * (gW - 32);
        const yOfE = e => gY1 - 16 - (e / E0) * (gH - 34);

        // Tô 3 vùng độ cong: Bát úp (m* < 0) hai bên hồng, Bát ngửa (m* > 0) giữa xanh
        const xL5 = xOfK(-0.5), xR5 = xOfK(0.5);
        ctx.fillStyle = hexA(C.c4, 0.11);
        ctx.fillRect(gX0 + 1, gY0 + 1, xL5 - gX0 - 1, gH - 2);
        ctx.fillRect(xR5, gY0 + 1, gX1 - xR5 - 1, gH - 2);
        ctx.fillStyle = hexA(C.c2, 0.10);
        ctx.fillRect(xL5, gY0 + 1, xR5 - xL5, gH - 2);

        ln(ctx, xL5, gY0, xL5, gY1, hexA(C.g, 0.85), 1, [4, 4]);
        ln(ctx, xR5, gY0, xR5, gY1, hexA(C.g, 0.85), 1, [4, 4]);
        ln(ctx, xOfK(0), gY0, xOfK(0), gY1, hexA(C.g, 0.6), 1, [2, 3]);

        txt(ctx, 'm* < 0 (∩)', (gX0 + xL5) * 0.5, gY0 + 15, C.c4, 10, 'center', 700, MONO);
        txt(ctx, 'm* > 0 (Bát ngửa ∪)', (xL5 + xR5) * 0.5, gY0 + 15, C.c2, 10, 'center', 700, MONO);
        txt(ctx, 'm* < 0 (∩)', (xR5 + gX1) * 0.5, gY0 + 15, C.c4, 10, 'center', 700, MONO);

        // Vẽ đường cong E(k) đổi màu xanh/hồng theo dấu độ cong
        const Np = 120;
        for (let i = 0; i < Np; i++) {
          const k1 = -1 + (i / Np) * 2, k2 = -1 + ((i + 1) / Np) * 2;
          const y1 = yOfE((E0 * 0.5) * (1 - Math.cos(k1 * Math.PI)));
          const y2 = yOfE((E0 * 0.5) * (1 - Math.cos(k2 * Math.PI)));
          const isPos = Math.abs((k1 + k2) * 0.5) < 0.5;
          ln(ctx, xOfK(k1), y1, xOfK(k2), y2, isPos ? C.c2 : C.c4, 3.2);
        }

        // Đánh dấu 4 điểm A, B, C, D của Câu 4
        [['A', -0.80], ['B', -0.30], ['C', 0.30], ['D', 0.80]].forEach(([lb, kk]) => {
          const px = xOfK(kk), py = yOfE((E0 * 0.5) * (1 - Math.cos(kk * Math.PI)));
          dot(ctx, px, py, 4, hexA(C.ink, 0.55));
          txt(ctx, lb, px, py - 13, C.mut, 9.5, 'center', 700, MONO);
        });

        // Điểm khảo sát hiện tại + Tiếp tuyến minh họa vận tốc v = (1/ħ)dE/dk
        const curX = xOfK(kf), curY = yOfE(eVal);
        const slopePx = ((yOfE((E0 * 0.5) * (1 - Math.cos((kf + 0.01) * Math.PI))) - curY) / (xOfK(kf + 0.01) - curX));
        const txLen = 38 / Math.hypot(1, slopePx);
        ln(ctx, curX - txLen, curY - txLen * slopePx, curX + txLen, curY + txLen * slopePx, C.main, 2.2);
        glowDot(ctx, curX, curY, 6, C.ink, hexA(C.main, 0.95));
        dot(ctx, curX, curY, 5.2, C.main);

        // Nhãn trục k
        [['−π/a', -1], ['−π/2a', -0.5], ['0', 0], ['+π/2a', 0.5], ['+π/a', 1]].forEach(([lb, kk]) => {
          txt(ctx, lb, xOfK(kk), gY1 + 12, C.ink, 9.5, 'center', 700, MONO);
        });

        // --- ĐƯỜNG THỬ PHẢN ỨNG GIA TỐC DƯỚI LỰC F (→) ---
        const trY = gY1 + 26, trH = Math.max(54, chY + chH - trY - 10);
        rr(ctx, gX0, trY, gW, trH, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = invM >= 0 ? hexA(C.c2, 0.6) : hexA(C.c4, 0.6); ctx.lineWidth = 1.4; ctx.stroke();

        const cyT = trY + trH * 0.56;
        const cxT = gX0 + gW * 0.5;
        ln(ctx, gX0 + 18, cyT, gX1 - 18, cyT, hexA(C.g, 0.8), 1.2);

        // Lực F luôn kéo sang phải (+x)
        arrow(ctx, gX0 + 22, trY + 15, gX0 + 82, trY + 15, C.main, 2.2);
        txt(ctx, 'Lực đẩy F (→)', gX0 + 88, trY + 15, C.main, 10, 'left', 700, MONO);

        // Hạt electron dao động/trôi tại chỗ với vector vận tốc v & vector gia tốc a = F/m*
        const ePosX = cxT + Math.sin(t * 4) * vNorm * 16;
        glowDot(ctx, ePosX, cyT, 6.5, C.ink, hexA(C.c2, 0.9));
        dot(ctx, ePosX, cyT, 6, C.c2);
        txt(ctx, 'e⁻', ePosX, cyT + 0.5, C.bg, 8.5, 'center', 800, MONO);

        // Mũi tên gia tốc a = F / m*
        const aLen = invM * 76;
        if (Math.abs(aLen) > 6) {
          const aCol = invM >= 0 ? C.c1 : C.c4;
          arrow(ctx, ePosX, cyT, ePosX + aLen, cyT, aCol, 2.8);
          txt(ctx, invM >= 0 ? 'a cùng chiều F' : 'a NGƯỢC chiều F (Phanh!)',
            ePosX + aLen + (invM >= 0 ? 8 : -8), cyT, aCol, 10, invM >= 0 ? 'left' : 'right', 700, MONO);
        } else {
          txt(ctx, 'Điểm uốn: m* → ∞ (a = 0, v đạt cực đại!)', ePosX + 14, cyT, C.c5, 10, 'left', 700, MONO);
        }

        // Thông số sắc nét ở mép trên
        const vDir = Math.abs(vNorm) < 0.04 ? 'v ≈ 0' : (vNorm > 0 ? 'v > 0 (→ +x)' : 'v < 0 (← −x)');
        txt(ctx, 'k = ' + (kf > 0 ? '+' : '') + kf.toFixed(2) + 'π/a  |  ' + vDir + ' (' + (vSI / 1e5).toFixed(1) + '×10⁵ m/s)',
          chX + 14, chY + 18, C.ink, 10.6, 'left', 700, MONO);
        const mTxt = isFinite(m0Ratio) ? 'm* = ' + (m0Ratio > 0 ? '+' : '') + m0Ratio.toFixed(2) + ' m₀' : 'm* → ∞';
        txt(ctx, mTxt + (invM < -0.03 ? '  (Hành xử như Lỗ trống!)' : ''),
          chX + chW - 14, chY + 18, invM >= 0 ? C.c2 : C.c4, 10.6, 'right', 700, MONO);

      } else {
        // --- CHẾ ĐỘ CÂU 3: SO SÁNH 2 PARABOL A (HẸP, NHẸ) VÀ B (RỘNG, NẶNG) ---
        const a_A = 5.43;
        const mA = HBAR2_2ME_EV_A2 / (S.tA * a_A * a_A); // 0.32 m₀
        const mB = HBAR2_2ME_EV_A2 / (S.tB * a_A * a_A); // 1.29 m₀ (nặng gấp 4 lần!)

        const gX0 = chX + 24, gX1 = chX + chW - 24, gW = gX1 - gX0;
        const gY0 = chY + 40, gH = chH * 0.52, gY1 = gY0 + gH;
        rr(ctx, gX0, gY0, gW, gH, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

        const xOfK = k => gX0 + 20 + ((k + 1) * 0.5) * (gW - 40);
        const yOfE = e => gY1 - 16 - (e / 1.7) * (gH - 32);

        // Vẽ Parabol A (dốc đứng, t = 0.40 eV) và Parabol B (thoải, t = 0.10 eV)
        const drawBand = (tVal, col, lbl) => {
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const kf = -1 + (i / 100) * 2;
            const e = 2 * tVal * (1 - Math.cos(kf * Math.PI));
            const sx = xOfK(kf), sy = yOfE(e);
            i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
          }
          ctx.strokeStyle = col; ctx.lineWidth = 2.8; ctx.stroke();
          txt(ctx, lbl, xOfK(0.65), yOfE(2 * tVal * (1 - Math.cos(0.65 * Math.PI))) - 12, col, 10.5, 'center', 700, MONO);
        };
        drawBand(S.tA, C.c4, 'Parabol A (Cong gắt → m*_A = ' + mA.toFixed(2) + ' m₀)');
        drawBand(S.tB, C.c1, 'Parabol B (Thoải → m*_B = ' + mB.toFixed(2) + ' m₀)');

        // Đường đua gia tốc thực tế bên dưới: cùng lực F đẩy cả 2 electron từ vạch xuất phát!
        const rY = gY1 + 16, rH = Math.max(76, chY + chH - rY - 12);
        rr(ctx, gX0, rY, gW, rH, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        st.raceT = ((st.raceT || 0) + dt * 0.85) % 2.4;
        const tSim = Math.min(st.raceT, 2.0);
        const trackX0 = gX0 + 82, trackX1 = gX1 - 24, trackW = trackX1 - trackX0;
        const laneA = rY + rH * 0.34, laneB = rY + rH * 0.72;

        ln(ctx, trackX0, laneA, trackX1, laneA, hexA(C.g, 0.8), 1, [4, 4]);
        ln(ctx, trackX0, laneB, trackX1, laneB, hexA(C.g, 0.8), 1, [4, 4]);
        txt(ctx, 'Hạt A (nhẹ)', gX0 + 12, laneA, C.c4, 10, 'left', 700, MONO);
        txt(ctx, 'Hạt B (nặng)', gX0 + 12, laneB, C.c1, 10, 'left', 700, MONO);

        // x(t) = ½ (F/m*) t²: Hạt A gia tốc gấp 4 lần Hạt B!
        const xA = trackX0 + clamp((0.5 * (1 / mA) * tSim * tSim) / (0.5 * (1 / mA) * 4.0), 0, 1) * trackW;
        const xB = trackX0 + clamp((0.5 * (1 / mB) * tSim * tSim) / (0.5 * (1 / mA) * 4.0), 0, 1) * trackW;

        glowDot(ctx, xA, laneA, 6, C.ink, hexA(C.c4, 0.9)); dot(ctx, xA, laneA, 5.5, C.c4);
        glowDot(ctx, xB, laneB, 6, C.ink, hexA(C.c1, 0.9)); dot(ctx, xB, laneB, 5.5, C.c1);

        txt(ctx, 'Câu 3: Cùng lực điện F — Parabol cong gắt (A) nhẹ hơn, tăng tốc gấp ' + (mB / mA).toFixed(1) + ' lần!',
          chX + 14, chY + 18, C.ink, 10.6, 'left', 700, MONO);
        txt(ctx, 'm*_B / m*_A = ' + (mB / mA).toFixed(1), chX + chW - 14, chY + 18, C.main, 10.6, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 4 — DAO ĐỘNG BLOCH VS TÁN XẠ TRÔI (Mục 2.2: Hình 2.2d, 2.2e, 2.2f)
   - Chế độ 1 ("Tinh thể lý tưởng, τ = ∞"): Điện trường nghiêng U = eEx, gói sóng
     electron chạy đi rồi gặp phản xạ Bragg ở k = π/a nên DAO ĐỘNG QUA LẠI!
   - Chế độ 2 ("Silicon thật, có tán xạ τ"): 24 electron va chạm tán xạ liên tục
     với phonon, triệt tiêu dao động Bloch và trôi đều với v_d = μE = (eτ/m*)E!
   ========================================================================== */
LABS.push({
  id: 'bloch', name: 'Dao động Bloch & Trôi', no: '2.2', secs: [],
  S: { regime: 'bloch', Efield: 10, tau: 0.20 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng tinh thể dưới điện trường E — Dao động Bloch (τ=∞) vs Trôi tán xạ (v_d=μE)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'regime', seg: [['bloch', 'Lý tưởng (Dao động Bloch)'], ['drift', 'Thực tế (Tán xạ trôi)']] },
      { k: 'Efield', l: 'Điện trường E', min: 2, max: 20, step: 1, f: v => v + ' kV/cm' },
      { k: 'tau', l: 'Thời gian τ', min: 0.05, max: 0.50, step: 0.05, f: v => v.toFixed(2) + ' ps' },
      { btn: 'Thả lại', fn: p => { p.st.simT = 0; p.st.particles = null; p.st.hist = []; } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      const a_m = 5.43e-10;
      const E_Vm = S.Efield * 1e5; // kV/cm -> V/m (1 kV/cm = 10^5 V/m)
      // Chu kỳ Bloch ở điện trường mạnh (nhân 100 để khớp cỡ 10^7 V/m khi hiển thị trực quan)
      const TB_ps = (H_PL / (EV * (E_Vm * 100) * a_m)) * 1e12;
      const mStar = 0.26 * ME;
      const mu_cm2 = ((EV * (S.tau * 1e-12)) / mStar) * 1e4; // cm²/V·s
      const vd_ms = (mu_cm2 * 1e-4) * E_Vm;

      if (S.regime === 'bloch') {
        // --- CHẾ ĐỘ 1: DAO ĐỘNG BLOCH CỦA GÓI SÓNG ELECTRON ---
        st.simT = (st.simT || 0) + dt * (0.45 + S.Efield * 0.04);
        const phase = st.simT; // 2π = 1 chu kỳ Bloch T_B
        const kNorm = ((((phase / Math.PI) + 1) % 2) + 2) % 2 - 1; // răng cưa trong [-1, +1]
        const vNorm = Math.sin(kNorm * Math.PI);
        const xNorm = -Math.cos(kNorm * Math.PI); // dao động qua lại quanh tâm!

        // Khung trên: Buồng mạng tinh thể với thế năng nghiêng & gói sóng |ψ(x,t)|²
        const bx = chX + 16, by = chY + 40, bw = chW - 32, bh = chH * 0.56;
        rr(ctx, bx, by, bw, bh, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        // Đường thế năng nghiêng U = eEx
        ln(ctx, bx + 16, by + 18, bx + bw - 16, by + bh - 26, hexA(C.c3, 0.55), 1.6, [6, 4]);
        txt(ctx, 'Thế năng nghiêng U = eEx', bx + bw - 20, by + bh - 36, C.c3, 9.8, 'right', 700, MONO);

        // Hàng nguyên tử Si ở đáy buồng
        const nAtoms = 28;
        for (let i = 0; i < nAtoms; i++) {
          dot(ctx, bx + 20 + (i / (nAtoms - 1)) * (bw - 40), by + bh - 12, 2.2, hexA(C.mut, 0.65));
        }

        // Gói sóng |ψ(x,t)|² dao động qua lại đúng chu kỳ T_B
        const ampX = bw * 0.30 * (10 / Math.max(S.Efield, 4));
        const cxWave = bx + bw * 0.5 + clamp(xNorm * ampX, -bw * 0.36, bw * 0.36);
        const baseY = by + bh - 20;
        const peakH = bh * 0.62;
        const sig = 28;

        ctx.beginPath();
        ctx.moveTo(bx + 12, baseY);
        for (let i = 0; i <= 140; i++) {
          const sx = bx + 12 + (i / 140) * (bw - 24);
          const env = Math.exp(-Math.pow((sx - cxWave) / sig, 2));
          ctx.lineTo(sx, baseY - env * peakH);
        }
        ctx.lineTo(bx + bw - 12, baseY);
        ctx.closePath();
        ctx.fillStyle = hexA(C.c1, 0.36); ctx.fill();
        ctx.strokeStyle = C.c1; ctx.lineWidth = 2.2; ctx.stroke();

        // Vạch tâm gói sóng
        ln(ctx, cxWave, by + 14, cxWave, baseY, C.c4, 1.6, [3, 3]);
        txt(ctx, Math.abs(kNorm) > 0.5 ? 'm* < 0 (Phanh ngược)' : 'm* > 0 (Tăng tốc)',
          cxWave, by + 24, Math.abs(kNorm) > 0.5 ? C.c4 : C.c2, 10, 'center', 700, MONO);

        // Khung dưới: Hiển thị đồng bộ k(t) chạy qua vùng Brillouin [−π/a, +π/a]
        const ky = by + bh + 14, kh = Math.max(54, chY + chH - ky - 12);
        rr(ctx, bx, ky, bw, kh, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        const barX0 = bx + 48, barX1 = bx + bw - 48, barMidY = ky + kh * 0.56;
        ln(ctx, barX0, barMidY, barX1, barMidY, C.g, 2);
        const kxCur = barX0 + ((kNorm + 1) * 0.5) * (barX1 - barX0);
        glowDot(ctx, kxCur, barMidY, 5.5, C.ink, hexA(C.c5, 0.95));
        dot(ctx, kxCur, barMidY, 5, C.c5);

        txt(ctx, 'Số sóng k(t) tiến đều sang phải, chạm +π/a thì quay vòng về −π/a (Phản xạ Bragg)',
          bx + bw * 0.5, ky + 15, C.ink, 10, 'center', 700, MONO);
        txt(ctx, '−π/a', barX0 - 8, barMidY, C.c4, 9.5, 'right', 700, MONO);
        txt(ctx, '+π/a', barX1 + 8, barMidY, C.c4, 9.5, 'left', 700, MONO);

        txt(ctx, 'Tinh thể lý tưởng (τ = ∞): Gói sóng dao động Bloch, KHÔNG chạy ra vô cực',
          chX + 14, chY + 18, C.ink, 10.6, 'left', 700, MONO);
        txt(ctx, 'T_B = h/(eEa) ≈ ' + TB_ps.toFixed(2) + ' ps  |  v_g ∝ ' + (vNorm >= 0 ? '+' : '') + vNorm.toFixed(2),
          chX + chW - 14, chY + 18, C.main, 10.6, 'right', 700, MONO);

      } else {
        // --- CHẾ ĐỘ 2: TÁN XẠ PHONON TRONG SILICON THẬT → VẬN TỐC TRÔI v_d = μE ---
        const bx = chX + 16, by = chY + 40, bw = chW - 32, bh = chH - 54;
        rr(ctx, bx, by, bw, bh, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        if (!st.particles) {
          st.particles = Array.from({ length: 22 }, () => ({
            x: rnd(0.06, 0.94), y: rnd(0.12, 0.88),
            vx: rnd(-0.45, 0.45), vy: rnd(-0.45, 0.45),
            trail: []
          }));
          st.sparks = [];
        }

        // Lưới ion Si dao động nhiệt
        for (let ix = bx + 26; ix < bx + bw - 16; ix += 38) {
          for (let iy = by + 26; iy < by + bh - 16; iy += 36) {
            const ox = Math.sin(t * 14 + ix) * 1.4, oy = Math.cos(t * 15 + iy) * 1.4;
            dot(ctx, ix + ox, iy + oy, 2.2, hexA(C.mut, 0.45));
          }
        }

        // Tần suất tán xạ ∝ 1/τ; gia tốc lực kéo ∝ E
        const scatRate = 1.6 / Math.max(S.tau, 0.05);
        const accelX = 0.20 * S.Efield;

        ctx.save();
        rr(ctx, bx + 1, by + 1, bw - 2, bh - 2, 7);
        ctx.clip();

        st.particles.forEach((pt, idx) => {
          pt.vx += accelX * dt;
          pt.x += pt.vx * dt * 0.35;
          pt.y += pt.vy * dt * 0.35;

          // Tán xạ ngẫu nhiên (làm quên vận tốc cũ)
          if (Math.random() < dt * scatRate) {
            const a = rnd(0, TAU), sp = rnd(0.35, 0.65);
            pt.vx = Math.cos(a) * sp;
            pt.vy = Math.sin(a) * sp;
            if (idx < 6) st.sparks.push({ x: pt.x, y: pt.y, life: 1.0 });
          }

          if (pt.x > 1.0) { pt.x -= 1.0; pt.trail = []; }
          if (pt.x < 0.0) { pt.x += 1.0; pt.trail = []; }
          if (pt.y < 0.06 || pt.y > 0.94) { pt.vy *= -1; pt.y = clamp(pt.y, 0.06, 0.94); }

          const sx = bx + pt.x * bw, sy = by + pt.y * bh;
          if (idx < 5) {
            pt.trail.push([sx, sy]);
            if (pt.trail.length > 26) pt.trail.shift();
            if (pt.trail.length > 1) {
              ctx.beginPath();
              pt.trail.forEach((q, qi) => qi === 0 ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]));
              ctx.strokeStyle = hexA(C.c2, 0.32); ctx.lineWidth = 1.3; ctx.stroke();
            }
          }
          glowDot(ctx, sx, sy, 3.6, C.ink, hexA(idx < 5 ? C.main : C.c2, 0.85));
          dot(ctx, sx, sy, 3.2, idx < 5 ? C.main : C.c2);
        });

        st.sparks.forEach(sp => {
          sp.life -= dt * 2.8;
          if (sp.life <= 0) return;
          ctx.beginPath(); ctx.arc(bx + sp.x * bw, by + sp.y * bh, 3 + (1 - sp.life) * 12, 0, TAU);
          ctx.strokeStyle = hexA(C.c4, sp.life * 0.8); ctx.lineWidth = 1.4; ctx.stroke();
        });
        st.sparks = st.sparks.filter(sp => sp.life > 0);

        // Mũi tên chỉ hướng lực trôi
        arrow(ctx, bx + bw - 132, by + bh - 20, bx + bw - 22, by + bh - 20, C.main, 2.2);
        txt(ctx, 'Lực qE (Trôi →)', bx + bw - 77, by + bh - 32, C.main, 10, 'center', 700, MONO);
        ctx.restore();

        txt(ctx, 'Si thật (m* = 0.26 m₀, τ = ' + S.tau.toFixed(2) + ' ps): μ = eτ/m* = ' + mu_cm2.toFixed(0) + ' cm²/V·s',
          chX + 14, chY + 18, C.ink, 10.6, 'left', 700, MONO);
        txt(ctx, 'v_trôi = μE = ' + (vd_ms / 1000).toFixed(1) + ' km/s  (≪ v_nhiệt ≈ 132 km/s)',
          chX + chW - 14, chY + 18, C.c1, 10.6, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 5 — LỖ TRỐNG & DẢI ĐẦY (Mục 2.3: Hình 2.3a, 2.3b, 2.3c, 2.3d)
   Đồng bộ 2 khung nhìn song song:
   - Khung trên (Không gian thực): Chuỗi liên kết Silicon có 1 chỗ trống; dưới
     điện trường E, electron nhảy ngược chiều E khiến lỗ trống (+e) chạy cùng E!
   - Khung dưới (Không gian k): 24 trạng thái của dải hóa trị — khi đầy kín thì
     Σv = 0; khi rút 1 electron ở k₀ thì Σv = −v(k₀) ⇒ dòng I = +e·v(k₀)!
   ========================================================================== */
LABS.push({
  id: 'hole', name: 'Lỗ trống & Dải đầy', no: '2.3', secs: [],
  S: { fill: 'oneHole', Edir: 'right', k0: 0.75 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Hai góc nhìn Lỗ trống — Nhảy liên kết mạng Si & Tổng vận tốc trong không gian k',
    area: 'a', anim: true,
    ctrls: [
      { k: 'fill', seg: [['full', 'Dải đầy (0 K)'], ['oneHole', 'Thiếu 1 e⁻ (1 lỗ trống)']] },
      { k: 'Edir', seg: [['off', 'E = 0'], ['right', 'E hướng →'], ['left', 'E hướng ←']] },
      { k: 'k0', l: 'Vị trí lỗ k₀', min: -0.90, max: 0.90, step: 0.05, f: v => (v > 0 ? '+' : '') + v.toFixed(2) + 'π/a' }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const hasHole = S.fill === 'oneHole';
      const eSign = S.Edir === 'right' ? 1 : S.Edir === 'left' ? -1 : 0;

      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      // --- KHUNG TRÊN: CHUỖI LIÊN KẾT SILICON TRONG KHÔNG GIAN THỰC ---
      const rx = chX + 16, ry = chY + 38, rw = chW - 32, rh = chH * 0.42;
      rr(ctx, rx, ry, rw, rh, 8);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      const nBonds = 10;
      if (st.holePos == null) st.holePos = 4;
      if (st.hopTimer == null) st.hopTimer = 0;

      if (hasHole && eSign !== 0) {
        st.hopTimer += dt;
        if (st.hopTimer > 0.65) {
          st.hopTimer = 0;
          const prev = st.holePos;
          st.holePos = (st.holePos + eSign + nBonds) % nBonds;
          st.lastHop = { from: st.holePos, to: prev, life: 1.0 }; // electron nhảy từ vị trí mới về vị trí cũ!
        }
      }
      if (st.lastHop) st.lastHop.life = Math.max(0, st.lastHop.life - dt * 1.8);

      const midY = ry + rh * 0.54;
      const stepX = (rw - 60) / nBonds;
      const x0 = rx + 30;

      // Vẽ mũi tên điện trường E và hướng nhảy e⁻ / lỗ trống
      if (eSign !== 0) {
        const ax1 = rx + rw * 0.5 - eSign * 56, ax2 = rx + rw * 0.5 + eSign * 56;
        arrow(ctx, ax1, ry + 18, ax2, ry + 18, C.c3, 2.2);
        txt(ctx, eSign > 0 ? 'Điện trường E (→)' : 'Điện trường E (←)', rx + rw * 0.5, ry + 32, C.c3, 10, 'center', 700, MONO);
      } else {
        txt(ctx, 'Không gian thực: Chuỗi liên kết cộng hóa trị Silicon (E = 0)', rx + rw * 0.5, ry + 18, C.ink, 10.2, 'center', 700, MONO);
      }

      // Vẽ các liên kết & cặp electron
      for (let i = 0; i < nBonds; i++) {
        const lx1 = x0 + i * stepX, lx2 = x0 + (i + 1) * stepX;
        const bmx = (lx1 + lx2) * 0.5;
        ln(ctx, lx1, midY - 4, lx2, midY - 4, hexA(C.g, 0.9), 1.5);
        ln(ctx, lx1, midY + 4, lx2, midY + 4, hexA(C.g, 0.9), 1.5);
        // Electron trên
        dot(ctx, bmx, midY - 4, 3.2, C.c2);
        // Electron dưới hoặc Lỗ trống
        if (hasHole && i === st.holePos) {
          glowDot(ctx, bmx, midY + 4, 7.5, hexA(C.c4, 0.25), hexA(C.c4, 0.75));
          ctx.beginPath(); ctx.arc(bmx, midY + 4, 6.2, 0, TAU);
          ctx.fillStyle = C.bg; ctx.fill();
          ctx.strokeStyle = C.c4; ctx.lineWidth = 2.4; ctx.stroke();
          txt(ctx, '+', bmx, midY + 4.5, C.c4, 9.5, 'center', 800, MONO);
        } else {
          dot(ctx, bmx, midY + 4, 3.2, C.c2);
        }
      }

      // Cung nhảy của electron láng giềng lấp vào chỗ trống
      if (hasHole && st.lastHop && st.lastHop.life > 0.05 && Math.abs(st.lastHop.from - st.lastHop.to) === 1) {
        const fx = x0 + (st.lastHop.from + 0.5) * stepX;
        const tx = x0 + (st.lastHop.to + 0.5) * stepX;
        ctx.beginPath();
        ctx.moveTo(fx, midY + 11);
        ctx.quadraticCurveTo((fx + tx) * 0.5, midY + 34, tx, midY + 11);
        ctx.strokeStyle = hexA(C.c2, st.lastHop.life * 0.9);
        ctx.lineWidth = 2; ctx.setLineDash([4, 2]); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, 'e⁻ nhảy', (fx + tx) * 0.5, midY + 30, hexA(C.c2, st.lastHop.life), 9, 'center', 700, MONO);
      }

      // Các lõi nguyên tử Si
      for (let i = 0; i <= nBonds; i++) {
        const ax = x0 + i * stepX;
        dot(ctx, ax, midY, 9.5, C.card);
        ctx.beginPath(); ctx.arc(ax, midY, 9.5, 0, TAU);
        ctx.strokeStyle = C.sub; ctx.lineWidth = 1.4; ctx.stroke();
        txt(ctx, 'Si', ax, midY + 0.5, C.ink, 8.5, 'center', 700, MONO);
      }
      txt(ctx, hasHole ? (eSign !== 0 ? 'Electron nhảy ngược chiều E ⇒ Lỗ trống (+e) tiến CÙNG CHIỀU E!' : 'Bật điện trường E để xem lỗ trống trôi cùng chiều E') : 'Mọi liên kết đủ 2 e⁻: Không ai nhích được (Cách điện ở 0 K)',
        rx + rw * 0.5, ry + rh - 14, hasHole ? C.c4 : C.mut, 10, 'center', 700, MONO);

      // --- KHUNG DƯỚI: KHÔNG GIAN k — 24 TRẠNG THÁI VẬN TỐC v(k) ---
      const ky = ry + rh + 12, kh = Math.max(100, chY + chH - ky - 10);
      rr(ctx, rx, ky, rw, kh, 8);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      const kMidY = ky + kh * 0.54;
      const kAmp = kh * 0.30;
      const kx0 = rx + 26, kx1 = rx + rw - 26;
      ln(ctx, kx0, kMidY, kx1, kMidY, hexA(C.g, 0.9), 1.2, [4, 4]);

      // Chọn 1 trong 24 chấm gần k0 nhất làm trạng thái bị rút electron
      const Nstates = 24;
      let holeIdx = -1;
      let bestDist = 99;
      for (let i = 0; i < Nstates; i++) {
        const kf = -0.958 + (i / (Nstates - 1)) * 1.916;
        if (Math.abs(kf - S.k0) < bestDist) { bestDist = Math.abs(kf - S.k0); holeIdx = i; }
      }

      let sumV = 0, vMissing = 0;
      for (let i = 0; i < Nstates; i++) {
        const kf = -0.958 + (i / (Nstates - 1)) * 1.916;
        // Dải hóa trị úp: v(k) = −v_max · sin(kπ) (hoặc dùng dạng sin như Hình 2.3b)
        const vVal = 4.2 * Math.sin(kf * Math.PI); // 10⁵ m/s
        const sx = kx0 + (i / (Nstates - 1)) * (kx1 - kx0);
        const sy = kMidY - (vVal / 4.2) * kAmp;

        if (hasHole && i === holeIdx) {
          vMissing = vVal;
          ctx.beginPath(); ctx.arc(sx, sy, 6.8, 0, TAU);
          ctx.strokeStyle = C.c4; ctx.lineWidth = 2.2; ctx.setLineDash([3, 2]); ctx.stroke(); ctx.setLineDash([]);
          txt(ctx, 'k₀', sx, sy - 14, C.c4, 9.5, 'center', 700, MONO);
        } else {
          sumV += vVal;
          dot(ctx, sx, sy, 4.4, C.c1);
        }
      }

      txt(ctx, 'Không gian k (24 trạng thái): Độ cao chấm = vận tốc v(k) (10⁵ m/s)', rx + 14, ky + 15, C.ink, 10, 'left', 700, MONO);
      const sumTxt = hasHole
        ? 'Σv_còn lại = ' + (sumV >= 0 ? '+' : '') + sumV.toFixed(2) + ' = −v(k₀)  ⇒  I = +e·(' + (vMissing >= 0 ? '+' : '') + vMissing.toFixed(2) + ')'
        : 'Σv = 0.00 (Cặp +k, −k triệt tiêu nhau ⇒ Dòng = 0)';
      txt(ctx, sumTxt, rx + rw - 14, ky + kh - 13, hasHole ? C.c4 : C.c1, 10.2, 'right', 700, MONO);

      txt(ctx, hasHole ? 'Dải hóa trị thiếu 1 electron tại k₀ = ' + (S.k0 > 0 ? '+' : '') + S.k0.toFixed(2) + 'π/a' : 'Dải hóa trị đầy 100% electron',
        chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
      txt(ctx, hasHole ? 'Hành xử như 1 hạt +e, m_p* > 0, v_h = v(k₀)' : 'Dải đầy KHÔNG dẫn điện',
        chX + chW - 14, chY + 18, hasHole ? C.c4 : C.c1, 10.8, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 6 — VẬT LIỆU (KIM LOẠI / BÁN DẪN / CÁCH ĐIỆN) & QUANG HỌC (Câu 5)
   - Chế độ 1 ("Quang học Câu 5"): Chiếu laser bước sóng λ (400–1400 nm) vào
     GaAs (Thẳng, 1.42 eV, λ_max=873 nm) vs Si (Xiên, 1.12 eV, λ_max=1107 nm).
     Thấy rõ bước nhảy thẳng đứng (photon) vs cần thêm phonon ở Si!
   - Chế độ 2 ("Phân loại 3 chất rắn"): So sánh Kim loại, Si và Kim cương
     theo nhiệt độ T (0 K → 600 K) với dãy ghế & dòng điện thực tế!
   ========================================================================== */
LABS.push({
  id: 'materials', name: 'Vật liệu & Quang học', no: '2.5', secs: [],
  S: { mode: 'optical', semi: 'gaas', wl: 780, T: 300 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Bán dẫn Vùng cấm thẳng (GaAs) vs Xiên (Si) (Câu 5) & Phân loại chất rắn',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['optical', 'Quang học (Câu 5)'], ['class', 'Kim loại / Bán dẫn / Cách điện']] },
      { k: 'semi', seg: [['gaas', 'GaAs (Thẳng 1.42eV)'], ['si', 'Si (Xiên 1.12eV)']] },
      { k: 'wl', l: 'Laser λ', min: 400, max: 1400, step: 10, f: v => v + ' nm' },
      { k: 'T', l: 'Nhiệt độ T', min: 0, max: 600, step: 20, f: v => v + ' K' },
      { btn: 'Ngưỡng GaAs (873nm)', fn: p => { p.S.mode = 'optical'; p.S.semi = 'gaas'; p.S.wl = 870; p.syncCtrls(); queueReact(p.tab, 'wl'); } },
      { btn: 'Ngưỡng Si (1107nm)', fn: p => { p.S.mode = 'optical'; p.S.semi = 'si'; p.S.wl = 1100; p.syncCtrls(); queueReact(p.tab, 'wl'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      if (S.mode === 'optical') {
        // --- CHẾ ĐỘ 1: HẤP THỤ & PHÁT XẠ PHOTON TRÊN GaAs (THẲNG) VS Si (XIÊN) ---
        const isGaAs = S.semi === 'gaas';
        const Eg = isGaAs ? 1.42 : 1.12;
        const lamMax = 1239.84 / Eg;
        const Eph = 1239.84 / S.wl;
        const absorbed = Eph >= Eg;
        const rgb = wlRGB(S.wl);

        const topY = chY + 40, botY = chY + chH - 18, boxH = botY - topY;
        const leftW = chW * 0.44;
        const lx = chX + 14, lw = leftW - 14;
        const rx = chX + leftW + 10, rw = chW - leftW - 24;

        // 1. TRÁI: Buồng chiếu Laser vào mẫu bán dẫn
        rr(ctx, lx, topY, lw, boxH, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        const midY = topY + boxH * 0.54;
        const wafX = lx + lw * 0.48, wafW = 46, wafH = Math.min(130, boxH * 0.62);

        // Đầu nguồn Laser bên trái
        rr(ctx, lx + 12, midY - 14, 34, 28, 5);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = rgb.css; ctx.lineWidth = 1.8; ctx.stroke();
        txt(ctx, 'hν', lx + 29, midY, rgb.css, 10.5, 'center', 700, MONO);

        // Chùm tia Laser tới & xuyên qua (nếu hν < E_g thì trong suốt xuyên thẳng!)
        const beamH = 14;
        ctx.fillStyle = rgb.rgba(0.28);
        ctx.fillRect(lx + 46, midY - beamH / 2, wafX - (lx + 46), beamH);
        if (!absorbed) {
          ctx.fillStyle = rgb.rgba(0.22);
          ctx.fillRect(wafX + wafW, midY - beamH / 2, (lx + lw - 12) - (wafX + wafW), beamH);
        }

        // Phiến tinh thể GaAs / Si
        rr(ctx, wafX, midY - wafH / 2, wafW, wafH, 5);
        ctx.fillStyle = hexA(isGaAs ? C.c4 : C.c2, absorbed ? 0.28 : 0.14); ctx.fill();
        ctx.strokeStyle = isGaAs ? C.c4 : C.c2; ctx.lineWidth = 1.8; ctx.stroke();
        txt(ctx, isGaAs ? 'GaAs' : 'Si', wafX + wafW * 0.5, midY - wafH / 2 - 12, isGaAs ? C.c4 : C.c2, 11, 'center', 700, MONO);

        // Hạt photon bay từ laser tới phiến
        if (!st.ph) { st.ph = []; st.em = []; st.acc = 0; }
        st.acc += dt * 7;
        while (st.acc >= 1) {
          st.acc -= 1;
          if (st.ph.length < 18) st.ph.push({ x: lx + 46, y: midY + rnd(-4, 4), passed: false });
        }
        for (let i = st.ph.length - 1; i >= 0; i--) {
          const ph = st.ph[i];
          ph.x += dt * 165;
          glowDot(ctx, ph.x, ph.y, 3.6, '#ffffff', rgb.rgba(0.9));
          if (absorbed && ph.x >= wafX + 14) {
            // Bị hấp thụ → nếu là GaAs tái hợp phát sáng LED rực rỡ, nếu là Si chủ yếu tỏa nhiệt phonon!
            if (isGaAs && Math.random() < 0.75) {
              const a = rnd(0, TAU);
              st.em.push({ x: wafX + wafW * 0.5, y: ph.y, vx: Math.cos(a) * 85, vy: Math.sin(a) * 85, life: 1.0, light: true });
            } else {
              st.em.push({ x: wafX + wafW * 0.5, y: ph.y, vx: rnd(-20, 20), vy: rnd(-20, 20), life: 1.0, light: false });
            }
            st.ph.splice(i, 1);
          } else if (ph.x > lx + lw - 12) {
            st.ph.splice(i, 1);
          }
        }
        for (let i = st.em.length - 1; i >= 0; i--) {
          const e = st.em[i];
          e.life -= dt * 1.5;
          e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.life <= 0) { st.em.splice(i, 1); continue; }
          if (e.light) {
            glowDot(ctx, e.x, e.y, 4, '#ffffff', hexA(C.c4, e.life));
          } else {
            ctx.beginPath(); ctx.arc(e.x, e.y, 4 + (1 - e.life) * 16, 0, TAU);
            ctx.strokeStyle = hexA(C.c3, e.life * 0.7); ctx.lineWidth = 1.4; ctx.stroke();
          }
        }

        txt(ctx, absorbed ? (isGaAs ? 'Hấp thụ mạnh & Phát sáng (LED/Laser)' : 'Hấp thụ cần Phonon (Tỏa nhiệt)') : 'TRONG SUỐT (hν < E_g: Xuyên thẳng qua)',
          lx + lw * 0.5, topY + boxH - 14, absorbed ? C.c1 : C.mut, 9.8, 'center', 700, MONO);

        // 2. PHẢI: Giản đồ E-k minh họa nhảy thẳng đứng (GaAs) vs nhảy xiên + phonon (Si)
        rr(ctx, rx, topY, rw, boxH, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        const cxK = rx + rw * 0.40;
        const yEv = topY + boxH * 0.66;
        const yEc = topY + boxH * 0.36;
        const kCbMin = isGaAs ? cxK : rx + rw * 0.72;

        ln(ctx, cxK, topY + 20, cxK, topY + boxH - 16, hexA(C.g, 0.8), 1.2, [4, 4]);
        txt(ctx, 'k = 0 (Γ)', cxK, topY + boxH - 10, C.mut, 9.5, 'center', 700, MONO);

        // Dải hóa trị (parabol úp tại k = 0)
        ctx.beginPath();
        for (let i = -40; i <= 40; i++) {
          const sx = cxK + (i / 40) * (rw * 0.34);
          const sy = yEv + Math.pow(i / 40, 2) * (boxH * 0.24);
          i === -40 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = C.c1; ctx.lineWidth = 2.8; ctx.stroke();

        // Dải dẫn (parabol ngửa tại k = 0 cho GaAs, lệch phải cho Si)
        ctx.beginPath();
        for (let i = -36; i <= 36; i++) {
          const sx = kCbMin + (i / 36) * (rw * 0.28);
          const sy = yEc - Math.pow(i / 36, 2) * (boxH * 0.24);
          i === -36 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = C.c4; ctx.lineWidth = 2.8; ctx.stroke();

        // Minh họa chuyển dời photon (+ phonon nếu là Si)
        const jumpLen = clamp((Eph / Eg) * (yEv - yEc), 14, boxH * 0.48);
        const yTarget = yEv - jumpLen;
        arrow(ctx, cxK, yEv - 4, cxK, yTarget, rgb.css, 2.8);
        txt(ctx, 'Photon ' + Eph.toFixed(2) + ' eV', cxK - 10, (yEv + yTarget) * 0.5, rgb.css, 9.8, 'right', 700, MONO);

        if (absorbed && !isGaAs) {
          // Mũi tên ngang Phonon đẩy sang đáy dải dẫn lệch k của Silicon
          arrow(ctx, cxK + 4, yEc, kCbMin - 6, yEc, C.c2, 2.4, [4, 3]);
          txt(ctx, '+ Phonon (đổi Δk)', (cxK + kCbMin) * 0.5, yEc - 14, C.c2, 9.8, 'center', 700, MONO);
        }

        dot(ctx, cxK, yEv, 5, C.c1);
        dot(ctx, kCbMin, yEc, 5, C.c4);
        txt(ctx, isGaAs ? 'VÙNG CẤM THẲNG (Δk = 0)' : 'VÙNG CẤM XIÊN (Δk ≠ 0)',
          rx + rw * 0.5, topY + 16, isGaAs ? C.c4 : C.c2, 10.5, 'center', 700, MONO);

        txt(ctx, 'λ = ' + S.wl + ' nm  →  hν = ' + Eph.toFixed(2) + ' eV  |  E_g(' + (isGaAs ? 'GaAs' : 'Si') + ') = ' + Eg.toFixed(2) + ' eV',
          chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
        txt(ctx, 'Bước sóng giới hạn λ_max = ' + lamMax.toFixed(0) + ' nm  |  ' + (absorbed ? 'HẤP THỤ' : 'KHÔNG HẤP THỤ'),
          chX + chW - 14, chY + 18, absorbed ? C.c1 : C.err, 10.8, 'right', 700, MONO);

      } else {
        // --- CHẾ ĐỘ 2: PHÂN LOẠI KIM LOẠI — BÁN DẪN — CÁCH ĐIỆN ---
        const T = S.T;
        const specs = [
          { name: 'KIM LOẠI (Cu, Al)', eg: 0.0, col: C.c3, desc: 'Dải đầy một nửa · Dẫn mạnh ở mọi T' },
          { name: 'BÁN DẪN (Si)', eg: 1.12, col: C.c1, desc: 'E_g = 1.12 eV · T > 0 có e⁻ nhảy qua' },
          { name: 'CÁCH ĐIỆN (Kim cương)', eg: 5.5, col: C.c5, desc: 'E_g = 5.5 eV · Không ai vượt nổi' }
        ];
        const gap = 12, colW = (chW - 28 - gap * 2) / 3;
        const topY = chY + 42, colH = chH - 58;

        specs.forEach((sp, si) => {
          const x0 = chX + 14 + si * (colW + gap);
          rr(ctx, x0, topY, colW, colH, 8);
          ctx.fillStyle = C.bg; ctx.fill();
          ctx.strokeStyle = hexA(sp.col, 0.55); ctx.lineWidth = 1.3; ctx.stroke();

          txt(ctx, sp.name, x0 + colW * 0.5, topY + 16, sp.col, 10.8, 'center', 700, MONO);

          const bx = x0 + 18, bw = colW - 36;
          const bTop = topY + 34, bBot = topY + colH - 42, bSpan = bBot - bTop;

          if (sp.eg === 0) {
            // 1 dải liên tục đầy nửa dưới, nửa trên trống (hạt chạy tự do)
            rr(ctx, bx, bTop, bw, bSpan, 6);
            ctx.fillStyle = hexA(C.c3, 0.14); ctx.fill();
            ctx.strokeStyle = C.c3; ctx.lineWidth = 1.5; ctx.stroke();
            const mid = bTop + bSpan * 0.5;
            ctx.fillStyle = hexA(C.c2, 0.25);
            ctx.fillRect(bx + 1, mid, bw - 2, bSpan * 0.5 - 1);
            ln(ctx, bx - 6, mid, bx + bw + 6, mid, C.ink, 1.4, [4, 3]);
            txt(ctx, 'E_F', bx + bw + 8, mid, C.ink, 9, 'left', 700, MONO);

            // Vẽ các electron trôi nhanh ngang qua ghế trống gần E_F
            for (let i = 0; i < 8; i++) {
              const ex = bx + 10 + (((i * 27 + t * 55) % (bw - 20)));
              const ey = mid - 6 + (i % 3) * 14;
              dot(ctx, ex, ey, 3.6, C.c2);
            }
          } else {
            const gPx = sp.eg > 3 ? bSpan * 0.44 : bSpan * 0.22;
            const bandH = (bSpan - gPx) * 0.5;
            // Dải dẫn (trên)
            rr(ctx, bx, bTop, bw, bandH, 5);
            ctx.fillStyle = hexA(C.c4, 0.12); ctx.fill();
            ctx.strokeStyle = C.c4; ctx.lineWidth = 1.4; ctx.stroke();
            // Dải hóa trị (dưới)
            rr(ctx, bx, bBot - bandH, bw, bandH, 5);
            ctx.fillStyle = hexA(C.c1, 0.28); ctx.fill();
            ctx.strokeStyle = C.c1; ctx.lineWidth = 1.4; ctx.stroke();

            txt(ctx, 'E_g = ' + sp.eg + ' eV', x0 + colW * 0.5, bTop + bandH + gPx * 0.5, C.main, 10, 'center', 700, MONO);

            // Số cặp electron-lỗ trống kích thích nhiệt trong bán dẫn
            const nExc = sp.eg < 2 ? (T < 80 ? 0 : Math.min(7, Math.floor(Math.pow((T - 60) / 140, 1.4)))) : 0;
            for (let i = 0; i < nExc; i++) {
              const ex = bx + 10 + (((i * 33 + t * 38) % (bw - 20)));
              const hx = bx + 10 + (((bw - 20) - ((i * 29 + t * 24) % (bw - 20))));
              dot(ctx, ex, bTop + bandH - 10 - (i % 2) * 10, 3.5, C.c2);
              ctx.beginPath(); ctx.arc(hx, bBot - bandH + 10 + (i % 2) * 10, 3.8, 0, TAU);
              ctx.strokeStyle = C.c4; ctx.lineWidth = 1.8; ctx.stroke();
            }
          }

          const condTxt = sp.eg === 0 ? 'DẪN ĐIỆN RẤT MẠNH' : (sp.eg < 2 ? (T === 0 ? '0 K: CÁCH ĐIỆN' : 'DẪN YẾU (Tăng theo T)') : 'CÁCH ĐIỆN TUYỆT ĐỐI');
          txt(ctx, condTxt, x0 + colW * 0.5, topY + colH - 24, sp.eg === 0 ? C.c1 : (sp.eg < 2 && T > 0 ? C.main : C.err), 10, 'center', 700, MONO);
          txt(ctx, sp.desc, x0 + colW * 0.5, topY + colH - 10, C.mut, 8.8, 'center', 500);
        });

        txt(ctx, 'Nhiệt độ mẫu T = ' + T + ' K (kT = ' + (KB * T * 1000).toFixed(1) + ' meV)',
          chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
        txt(ctx, 'Dải đầy kín không dẫn điện · Chỉ ghế trống gần electron mới tạo dòng',
          chX + chW - 14, chY + 18, C.main, 10.6, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 7 — MẬT ĐỘ TRẠNG THÁI g(E) & THỐNG KÊ FERMI–DIRAC f_F(E) (Mục 3.1 & 3.2)
   - Chế độ 1 ("Nhân g(E)·f_F(E)"): Bức tranh tổng 4 cột tương tác theo T, E_F, m_n*
     + rải hạt dẫn e⁻ / h⁺ thực tế theo đúng phân bố năng lượng!
   - Chế độ 2 ("So sánh 3 thống kê"): Maxwell–Boltzmann vs Bose–Einstein vs
     Fermi–Dirac (trần Pauli = 1) + đo trực tiếp sai số xấp xỉ Boltzmann tại (E−E_F)/kT!
   ========================================================================== */
LABS.push({
  id: 'fermi', name: 'g(E) & Fermi–Dirac', no: '3.1–3.2', secs: [3],
  S: { mode: 'product', T: 300, efPos: 0.50, mn: 1.0, dEkT: 3.0 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Đếm hạt dẫn: Số ghế g(E) × Xác suất Fermi–Dirac f_F(E) & 3 Thống kê lượng tử',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['product', 'Nhân g(E)·f_F(E)'], ['stats', 'So sánh MB / BE / FD']] },
      { k: 'T', l: 'Nhiệt độ T', min: 0, max: 600, step: 10, f: v => v + ' K' },
      { k: 'efPos', l: 'Vị trí E_F', min: 0.15, max: 0.85, step: 0.05, f: v => (v < 0.45 ? 'Loại P' : v > 0.55 ? 'Loại N' : 'Giữa Eg') },
      { k: 'mn', l: 'm_n*/m₀', min: 0.2, max: 2.0, step: 0.1, f: v => v.toFixed(1) },
      { k: 'dEkT', l: '(E−E_F)/kT', min: 0.5, max: 6.0, step: 0.5, f: v => v.toFixed(1) + ' kT' }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      const T = S.T;
      const kT = Math.max(KB * T, 1e-5); // eV
      // Để trực quan hóa sắc nét gò electron & lỗ trống trên canvas, dùng thang kT hiệu dụng khi vẽ
      const kTvis = T === 0 ? 1e-4 : 0.03 + (T / 600) * 0.24;

      if (S.mode === 'product') {
        const topY = chY + 42, botY = chY + chH - 22, spanH = botY - topY;
        const eMin = -1.4, eMax = 2.52; // Ev = 0, Ec = 1.12 eV
        const yOfE = e => botY - ((e - eMin) / (eMax - eMin)) * spanH;
        const yEc = yOfE(1.12), yEv = yOfE(0.0);
        const Ef = S.efPos * 1.12;
        const yEf = yOfE(Ef);

        const c1X = chX + 14, c1W = chW * 0.19;
        const c2X = c1X + c1W + 14, c2W = chW * 0.22;
        const c3X = c2X + c2W + 18, c3W = chW * 0.21;
        const c4X = c3X + c3W + 18, c4W = Math.max(70, chX + chW - c4X - 14);

        // Đường chuẩn Ec, Ev, Ef nối xuyên suốt cả 4 cột
        ln(ctx, c1X, yEc, c4X + c4W, yEc, hexA(C.c2, 0.45), 1, [4, 4]);
        ln(ctx, c1X, yEv, c4X + c4W, yEv, hexA(C.c4, 0.45), 1, [4, 4]);
        ln(ctx, c1X, yEf, c4X + c4W, yEf, hexA(C.main, 0.7), 1.3, [5, 3]);

        // --- CỘT 1: Dải dẫn & Dải hóa trị có hạt dẫn nhảy động ---
        rr(ctx, c1X, topY, c1W, yEc - topY, 4);
        ctx.fillStyle = hexA(C.c2, 0.16); ctx.fill();
        ctx.strokeStyle = C.c2; ctx.lineWidth = 1.4; ctx.stroke();
        rr(ctx, c1X, yEv, c1W, botY - yEv, 4);
        ctx.fillStyle = hexA(C.c4, 0.16); ctx.fill();
        ctx.strokeStyle = C.c4; ctx.lineWidth = 1.4; ctx.stroke();

        txt(ctx, 'Dải', c1X + c1W * 0.5, topY - 12, C.ink, 10, 'center', 700, MONO);
        txt(ctx, 'E_c', c1X + 4, yEc - 8, C.c2, 9.5, 'left', 700, MONO);
        txt(ctx, 'E_v', c1X + 4, yEv + 9, C.c4, 9.5, 'left', 700, MONO);
        txt(ctx, 'E_F', c1X + c1W - 4, yEf - 8, C.main, 9.5, 'right', 700, MONO);

        // --- CỘT 2: Mật độ trạng thái g(E) ∝ (m*)^(3/2) √ΔE ---
        ln(ctx, c2X, topY, c2X, botY, C.ink, 1.4);
        txt(ctx, 'g(E) · Số ghế', c2X + c2W * 0.5, topY - 12, C.ink, 10, 'center', 700, MONO);
        const mnScale = Math.pow(S.mn, 0.65);

        ctx.beginPath(); ctx.moveTo(c2X, yEc);
        for (let i = 0; i <= 50; i++) {
          const e = 1.12 + (i / 50) * (eMax - 1.12);
          const g = Math.sqrt(e - 1.12) * mnScale;
          ctx.lineTo(c2X + clamp(g / 1.5, 0, 1) * c2W, yOfE(e));
        }
        ctx.lineTo(c2X, topY); ctx.closePath();
        ctx.fillStyle = hexA(C.c2, 0.25); ctx.fill();
        ctx.strokeStyle = C.c2; ctx.lineWidth = 2; ctx.stroke();

        ctx.beginPath(); ctx.moveTo(c2X, yEv);
        for (let i = 0; i <= 50; i++) {
          const e = 0 - (i / 50) * (0 - eMin);
          const g = Math.sqrt(-e);
          ctx.lineTo(c2X + clamp(g / 1.4, 0, 1) * c2W, yOfE(e));
        }
        ctx.lineTo(c2X, botY); ctx.closePath();
        ctx.fillStyle = hexA(C.c4, 0.25); ctx.fill();
        ctx.strokeStyle = C.c4; ctx.lineWidth = 2; ctx.stroke();

        // --- CỘT 3: Hàm Fermi–Dirac f_F(E) ---
        ln(ctx, c3X, topY, c3X, botY, C.ink, 1.4);
        ln(ctx, c3X + c3W, topY, c3X + c3W, botY, hexA(C.g, 0.7), 1, [3, 3]);
        txt(ctx, 'f_F(E)', c3X + c3W * 0.5, topY - 12, C.main, 10, 'center', 700, MONO);

        const fFD = e => T === 0 ? (e < Ef ? 1 : e > Ef ? 0 : 0.5) : 1 / (1 + Math.exp(clamp((e - Ef) / kTvis, -50, 50)));
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const e = eMin + (i / 120) * (eMax - eMin);
          const sx = c3X + fFD(e) * c3W;
          const sy = yOfE(e);
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = C.main; ctx.lineWidth = 2.6; ctx.stroke();
        dot(ctx, c3X + c3W * 0.5, yEf, 4, C.main);
        txt(ctx, '½', c3X + c3W * 0.5 + 8, yEf - 8, C.main, 9.5, 'left', 700, MONO);
        txt(ctx, '0', c3X, botY + 11, C.mut, 9, 'center', 600, MONO);
        txt(ctx, '1', c3X + c3W, botY + 11, C.mut, 9, 'center', 600, MONO);

        // --- CỘT 4: Tích n(E) = g_c·f_F và p(E) = g_v·(1−f_F) ---
        ln(ctx, c4X, topY, c4X, botY, C.ink, 1.4);
        txt(ctx, 'n(E), p(E)', c4X + c4W * 0.5, topY - 12, C.c1, 10, 'center', 700, MONO);

        let maxN = 1e-6, maxP = 1e-6;
        for (let i = 0; i <= 60; i++) {
          const ec = 1.12 + (i / 60) * (eMax - 1.12);
          const ev = -(i / 60) * (-eMin);
          const nv = Math.sqrt(ec - 1.12) * mnScale * fFD(ec);
          const pv = Math.sqrt(-ev) * (1 - fFD(ev));
          if (nv > maxN) maxN = nv;
          if (pv > maxP) maxP = pv;
        }
        const normMax = Math.max(maxN, maxP, 0.08);

        if (T > 0) {
          // Gò electron ở đáy dải dẫn
          ctx.beginPath(); ctx.moveTo(c4X, yEc);
          for (let i = 0; i <= 60; i++) {
            const e = 1.12 + (i / 60) * (eMax - 1.12);
            const nv = Math.sqrt(e - 1.12) * mnScale * fFD(e);
            ctx.lineTo(c4X + (nv / normMax) * c4W * 0.92, yOfE(e));
          }
          ctx.lineTo(c4X, topY); ctx.closePath();
          ctx.fillStyle = hexA(C.c2, 0.45); ctx.fill();
          ctx.strokeStyle = C.c2; ctx.lineWidth = 2; ctx.stroke();

          // Gò lỗ trống ở đỉnh dải hóa trị
          ctx.beginPath(); ctx.moveTo(c4X, yEv);
          for (let i = 0; i <= 60; i++) {
            const e = -(i / 60) * (-eMin);
            const pv = Math.sqrt(-e) * (1 - fFD(e));
            ctx.lineTo(c4X + (pv / normMax) * c4W * 0.92, yOfE(e));
          }
          ctx.lineTo(c4X, botY); ctx.closePath();
          ctx.fillStyle = hexA(C.c4, 0.45); ctx.fill();
          ctx.strokeStyle = C.c4; ctx.lineWidth = 2; ctx.stroke();

          // Rải hạt e⁻ và h⁺ thực tế vào Cột 1 tương ứng với độ lớn gò n(E), p(E)
          const nDots = clamp(Math.round((maxN / normMax) * 14), 1, 14);
          const pDots = clamp(Math.round((maxP / normMax) * 14), 1, 14);
          for (let i = 0; i < nDots; i++) {
            const ex = c1X + 8 + ((i * 23 + t * 24) % Math.max(8, c1W - 16));
            const ey = yEc - 6 - ((i * 19) % 34) * (T / 600 + 0.35);
            dot(ctx, ex, clamp(ey, topY + 5, yEc - 4), 3, C.c2);
          }
          for (let i = 0; i < pDots; i++) {
            const hx = c1X + 8 + ((i * 29 + t * 18) % Math.max(8, c1W - 16));
            const hy = yEv + 6 + ((i * 17) % 34) * (T / 600 + 0.35);
            ctx.beginPath(); ctx.arc(hx, clamp(hy, yEv + 4, botY - 5), 3.2, 0, TAU);
            ctx.strokeStyle = C.c4; ctx.lineWidth = 1.6; ctx.stroke();
          }
        }

        // Dấu × và = giữa các cột
        txt(ctx, '×', (c2X + c2W + c3X) * 0.5, yEf, C.c5, 18, 'center', 800);
        txt(ctx, '=', (c3X + c3W + c4X) * 0.5, yEf, C.c5, 18, 'center', 800);

        // Xác suất thực tại E_c theo đúng kT thật ở nhiệt độ T
        const fEcReal = T === 0 ? 0 : 1 / (1 + Math.exp(clamp((1.12 - Ef) / kT, -100, 100)));
        txt(ctx, 'T = ' + T + ' K (kT = ' + (KB * T * 1000).toFixed(1) + ' meV)  |  E_c − E_F = ' + (1.12 - Ef).toFixed(2) + ' eV',
          chX + 14, chY + 18, C.ink, 10.6, 'left', 700, MONO);
        txt(ctx, 'f_F(E_c) = ' + (fEcReal >= 0.001 ? (fEcReal * 100).toFixed(2) + '%' : sci(fEcReal, 2)),
          chX + chW - 14, chY + 18, C.main, 10.6, 'right', 700, MONO);

      } else {
        // --- CHẾ ĐỘ 2: SO SÁNH 3 QUY LUẬT THỐNG KÊ (MB / BE / FD) & XẤP XỈ BOLTZMANN ---
        const topY = chY + 42, botY = chY + chH - 28, gH = botY - topY;
        const leftW = chW * 0.58;
        const gx0 = chX + 34, gx1 = chX + leftW - 10, gW = gx1 - gx0;

        rr(ctx, gx0, topY, gW, gH, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

        // Trục x: (E − μ)/kT từ -2 đến +6; Trục y: số hạt trung bình f từ 0 đến 2.2
        const xMin = -2.0, xMax = 6.0, yMax = 2.2;
        const xOf = u => gx0 + ((u - xMin) / (xMax - xMin)) * gW;
        const yOf = f => botY - 12 - (clamp(f, 0, yMax) / yMax) * (gH - 24);

        // Đường trần Pauli f = 1
        ln(ctx, gx0, yOf(1), gx1, yOf(1), hexA(C.c4, 0.7), 1.4, [5, 3]);
        txt(ctx, 'Trần Pauli = 1', gx0 + 8, yOf(1) - 10, C.c4, 9.5, 'left', 700, MONO);
        ln(ctx, xOf(0), topY, xOf(0), botY, hexA(C.g, 0.8), 1, [3, 3]);

        // 1. Bose–Einstein: 1 / (e^u − 1) cho u > 0.35
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const u = 0.38 + (i / 100) * (xMax - 0.38);
          const f = 1 / (Math.exp(u) - 1);
          i === 0 ? ctx.moveTo(xOf(u), yOf(f)) : ctx.lineTo(xOf(u), yOf(f));
        }
        ctx.strokeStyle = C.c5; ctx.lineWidth = 2.4; ctx.stroke();

        // 2. Maxwell–Boltzmann: e^(−u)
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const u = -0.8 + (i / 120) * (xMax + 0.8);
          const f = Math.exp(-u);
          i === 0 ? ctx.moveTo(xOf(u), yOf(f)) : ctx.lineTo(xOf(u), yOf(f));
        }
        ctx.strokeStyle = C.c3; ctx.lineWidth = 2.2; ctx.setLineDash([5, 3]); ctx.stroke(); ctx.setLineDash([]);

        // 3. Fermi–Dirac: 1 / (e^u + 1)
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const u = xMin + (i / 120) * (xMax - xMin);
          const f = 1 / (Math.exp(u) + 1);
          i === 0 ? ctx.moveTo(xOf(u), yOf(f)) : ctx.lineTo(xOf(u), yOf(f));
        }
        ctx.strokeStyle = C.c1; ctx.lineWidth = 3.0; ctx.stroke();

        // Vạch kiểm tra xấp xỉ Boltzmann tại u = dEkT
        const uProbe = S.dEkT;
        const fFDv = 1 / (Math.exp(uProbe) + 1);
        const fMBv = Math.exp(-uProbe);
        const relErr = ((fMBv - fFDv) / fFDv) * 100;
        const xp = xOf(uProbe);
        ln(ctx, xp, topY + 8, xp, botY - 8, C.c2, 1.6, [3, 3]);
        dot(ctx, xp, yOf(fFDv), 4.5, C.c1);
        dot(ctx, xp, yOf(fMBv), 4.5, C.c3);

        txt(ctx, '(E − E_F) / kT', (gx0 + gx1) * 0.5, botY + 13, C.ink, 10, 'center', 700, MONO);
        txt(ctx, 'BE (Boson)', xOf(1.2), yOf(1.6), C.c5, 9.8, 'left', 700, MONO);
        txt(ctx, 'MB (Boltzmann)', xOf(0.5), yOf(1.15), C.c3, 9.8, 'left', 700, MONO);
        txt(ctx, 'FD (Electron)', xOf(-1.7), yOf(0.82), C.c1, 9.8, 'left', 700, MONO);

        // Bảng so sánh giá trị chính xác bên phải
        const rx = chX + leftW + 8, rw = chW - leftW - 22;
        rr(ctx, rx, topY, rw, gH, 8);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = relErr < 5 ? C.c1 : C.c4; ctx.lineWidth = 1.4; ctx.stroke();

        const cxR = rx + rw * 0.5;
        txt(ctx, 'KIỂM TRA XẤP XỈ BOLTZMANN', cxR, topY + 20, C.ink, 10, 'center', 700, MONO);
        txt(ctx, 'Tại ΔE = ' + uProbe.toFixed(1) + ' kT (' + (uProbe * KB * Math.max(T, 1) * 1000).toFixed(0) + ' meV)', cxR, topY + 44, C.c2, 10.5, 'center', 700, MONO);
        txt(ctx, 'Fermi–Dirac: ' + (fFDv >= 0.001 ? fFDv.toFixed(4) : sci(fFDv, 2)), cxR, topY + 76, C.c1, 11, 'center', 700, MONO);
        txt(ctx, 'Boltzmann:  ' + (fMBv >= 0.001 ? fMBv.toFixed(4) : sci(fMBv, 2)), cxR, topY + 100, C.c3, 11, 'center', 700, MONO);
        txt(ctx, 'Sai số tương đối:', cxR, topY + 132, C.mut, 10, 'center', 600, MONO);
        txt(ctx, relErr.toFixed(2) + ' %', cxR, topY + 156, relErr <= 5.1 ? C.c1 : C.c4, 18, 'center', 800, MONO);
        txt(ctx, relErr <= 5.1 ? 'Đạt chuẩn ≤ 5% (Dùng được!)' : 'Sai số lớn (> 5%: Phải dùng FD)',
          cxR, topY + 184, relErr <= 5.1 ? C.c1 : C.c4, 10, 'center', 700, MONO);

        txt(ctx, '3 Quy luật thống kê: Chỉ Fermi–Dirac bị chặn bởi trần Pauli = 1',
          chX + 14, chY + 18, C.ink, 10.6, 'left', 700, MONO);
        txt(ctx, 'Ngưỡng xấp xỉ Boltzmann: E − E_F ≥ 3kT (Sai số < 5%)',
          chX + chW - 14, chY + 18, C.main, 10.6, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM (Log intro + react chi tiết cho cả 7 tab Buổi 4)
   ========================================================================== */
const LD = {};

LD.bands = {
  intro: [
    ['i', 'Khi nhiều nguyên tử tiến lại gần nhau, đám mây electron chồng lấn khiến mỗi mức năng lượng rời rạc tách thành nhiều mức khác nhau (do nguyên lý Pauli).'],
    ['w', 'Với 2 nguyên tử: cộng sóng ψA+ψB dồn xác suất vào giữa 2 hạt nhân nên hạ năng lượng (E₀−Δ); trừ sóng ψA−ψB tạo mặt nút đẩy e⁻ ra ngoài nên tăng năng lượng (E₀+Δ).'],
    ['w', 'Với N nguyên tử xếp thành chuỗi, N mức luôn bị nhốt trong bề rộng 4t cố định → khi N ~ 10²² chúng dày đặc thành một Dải năng lượng liên tục!'],
    ['v', 'Thử chuyển sang "Chuỗi N nguyên tử" kéo N lên 40, hoặc bấm "Si thật (2.35 Å)" để xem lai hóa sp³ mở khe vùng cấm E_g = 1.12 eV!']
  ],
  react(S, k, P, say) {
    if (S.mode === 'two') {
      const delta = 2.4 * Math.exp(-(S.dist - 1.8) / 0.85);
      say('v', `2 nguyên tử cách d = ${S.dist.toFixed(2)} Å (${S.sym === 'bond' ? 'Liên kết ψA+ψB' : 'Phản liên kết ψA−ψB'}): Độ tách năng lượng 2Δ = ${(2 * delta).toFixed(2)} eV.`);
    } else if (S.mode === 'chain') {
      const N = Math.round(S.N), kn = Math.round(S.nodeIdx);
      const eRel = -2 * Math.cos(((kn + 1) * Math.PI) / (N + 1));
      say('v', `Chuỗi N = ${N} nguyên tử, trạng thái ${kn} nút: E − E₀ = ${eRel >= 0 ? '+' : ''}${eRel.toFixed(2)}t. Khoảng cách trung bình giữa các mức = ${(4 / N).toFixed(2)}t.`);
    } else {
      const gap = S.dist < 3.45 ? 1.12 * Math.pow((3.45 - S.dist) / (3.45 - 2.35), 1.25) : 0;
      say('v', gap > 0.05
        ? `Silicon ở d = ${S.dist.toFixed(2)} Å: Lai hóa sp³ tách 8N trạng thái thành 4N dải hóa trị + 4N dải dẫn, mở vùng cấm E_g = ${gap.toFixed(2)} eV!`
        : `d = ${S.dist.toFixed(2)} Å (quá xa): Dải 3s và 3p chồng lên nhau nên chưa có vùng cấm.`);
    }
  }
};

LD.kp = {
  intro: [
    ['i', 'Mô hình Kronig–Penney thay thế năng tuần hoàn của chuỗi ion bằng dãy giếng–rào vuông, cho phương trình siêu việt P′·sin(αa)/(αa) + cos(αa) = cos(ka).'],
    ['w', 'Vì −1 ≤ cos(ka) ≤ +1 với mọi số sóng thực k, chỉ các đoạn đường cong f(αa) nằm giữa −1 và +1 mới là Dải cho phép; phần vượt ra ngoài là Vùng cấm!'],
    ['v', 'Mặc định P′ = 12, a = 5 Å khớp đề Câu 1 & 2 (αa ∈ [2.70, π] và [5.44, 2π]). Chuyển sang tab "Sóng đứng Bragg" để thấy lý do khe mở tại k = π/a!']
  ],
  react(S, k, P, say) {
    const bands = solveKPBands(S.P);
    const uToEv = u => HBAR2_2ME_EV_A2 * (u * u) / (S.a * S.a);
    if (S.view === 'bragg') {
      say('w', 'Tại k = π/a (λ = 2a), phản xạ Bragg tạo 2 sóng đứng: ψ₊ ∝ cos(πx/a) ngồi ngay lên ion dương (thế năng thấp E₋) còn ψ₋ ∝ sin(πx/a) ngồi giữa 2 ion (thế năng cao E₊) → mở khe E_g!');
      return;
    }
    if (S.P === 0) {
      say('w', 'P′ = 0 (không có rào thế): Electron tự do hoàn toàn, toàn bộ vùng cấm biến mất và E(k) trở về parabol liên tục!');
      return;
    }
    const b1 = bands[0], b2 = bands[1];
    say('v', `P′ = ${S.P.toFixed(1)}, a = ${S.a.toFixed(1)} Å → Dải 1: αa ∈ [${b1.lo.toFixed(2)}, 3.14] (${uToEv(b1.lo).toFixed(2)}–${uToEv(b1.hi).toFixed(2)} eV); Khe E_g1 = ${(uToEv(b2.lo) - uToEv(b1.hi)).toFixed(2)} eV.`);
  }
};

LD.ek = {
  intro: [
    ['i', 'Mọi thông tin động lực học của electron trong tinh thể nằm trong đồ thị E(k): Vận tốc nhóm v = (1/ħ)·dE/dk (độ dốc) và Khối lượng hiệu dụng 1/m* = (1/ħ²)·d²E/dk² (độ cong).'],
    ['w', 'Gần đáy dải (bát ngửa ∪): m* > 0, lực đẩy làm electron tăng tốc bình thường. Gần đỉnh dải (bát úp ∩): m* < 0, lực kéo tới nhưng electron bị "phanh ngược"!'],
    ['v', 'Bấm lần lượt A, B, C, D để đối chiếu đáp án Câu 4, hoặc chuyển sang "Câu 3 (Đua 2 Parabol)" để thấy hạt trên parabol cong gắt nhẹ hơn và tăng tốc nhanh gấp 4 lần!']
  ],
  react(S, k, P, say) {
    if (S.mode === 'q3') {
      say('v', 'Câu 3: Parabol A cong gắt hơn (d²E/dk² lớn) → khối lượng hiệu dụng m*_A = 0.32 m₀ nhỏ hơn 4 lần so với Parabol B thoải (m*_B = 1.29 m₀).');
      return;
    }
    const kf = S.kFrac, ka = kf * Math.PI;
    const vPos = Math.sin(ka), mPos = Math.cos(ka);
    const vStr = Math.abs(vPos) < 0.05 ? 'v ≈ 0' : (vPos > 0 ? 'v > 0 (hướng +x)' : 'v < 0 (hướng −x)');
    const mStr = Math.abs(mPos) < 0.05 ? 'm* → ∞ (điểm uốn)' : (mPos > 0 ? 'm* > 0 (bát ngửa ∪)' : 'm* < 0 (bát úp ∩, gia tốc ngược lực!)');
    say('v', `Tại k = ${kf >= 0 ? '+' : ''}${kf.toFixed(2)}π/a: ${vStr} và ${mStr}.`);
  }
};

LD.bloch = {
  intro: [
    ['i', 'Nếu tinh thể hoàn hảo không tán xạ (τ = ∞), điện trường đều làm k tăng mãi tới biên +π/a, gặp phản xạ Bragg quay về −π/a nên gói sóng DAO ĐỘNG QUA LẠI (Dao động Bloch).'],
    ['w', 'Trong Silicon thật ở 300 K, thời gian tán xạ phonon τ ≈ 0.2 ps ngắn hơn chu kỳ Bloch → electron liên tục va chạm trước khi kịp tới biên vùng, tạo ra vận tốc trôi đều v_d = μE!'],
    ['v', 'Chuyển đổi giữa "Lý tưởng (Dao động Bloch)" và "Thực tế (Tán xạ trôi)" rồi chỉnh τ và E để thấy μ = eτ/m* quyết định tốc độ trôi!']
  ],
  react(S, k, P, say) {
    if (S.regime === 'bloch') {
      const TB = (H_PL / (EV * S.Efield * 1e7 * 5.43e-10)) * 1e12;
      say('v', `Dao động Bloch (E mạnh): Chu kỳ T_B = h/(eEa) ≈ ${TB.toFixed(2)} ps. Điện trường càng lớn thì chu kỳ càng ngắn và biên độ dao động càng nhỏ!`);
    } else {
      const mu = ((EV * S.tau * 1e-12) / (0.26 * ME)) * 1e4;
      const vd = (mu * 1e-4) * (S.Efield * 1e5);
      say('v', `Tán xạ trong Si (τ = ${S.tau.toFixed(2)} ps): Độ linh động μ = ${mu.toFixed(0)} cm²/V·s → vận tốc trôi v_d = ${(vd / 1000).toFixed(1)} km/s.`);
    }
  }
};

LD.hole = {
  intro: [
    ['i', 'Một dải hóa trị đầy 100% electron (ở 0 K) KHÔNG tạo dòng điện: mỗi electron có vận tốc v(k) đều bị triệt tiêu bởi một electron ở −k có vận tốc −v(k) ⇒ Σv = 0.'],
    ['w', 'Khi rút đi 1 electron tại k₀ (tạo 1 chỗ trống): tổng vận tốc của toàn bộ electron còn lại là −v(k₀), nên dòng điện là (−e)·[−v(k₀)] = +e·v(k₀) — hệt như 1 hạt mang điện dương +e!'],
    ['v', 'Bật "E hướng →" hoặc "E hướng ←" để quan sát electron liên kết nhảy ngược chiều E khiến Lỗ trống (+e) chạy CÙNG CHIỀU điện trường E!']
  ],
  react(S, k, P, say) {
    if (S.fill === 'full') {
      say('w', 'Dải đầy (0 K): Không còn ghế trống để đổi trạng thái và mọi cặp (+k, −k) triệt tiêu nhau ⇒ Σv = 0, dòng điện bằng 0.');
      return;
    }
    const vMiss = 4.2 * Math.sin(S.k0 * Math.PI);
    say('v', `Thiếu 1 electron ở k₀ = ${S.k0 >= 0 ? '+' : ''}${S.k0.toFixed(2)}π/a: Tổng vận tốc còn lại Σv = ${(-vMiss).toFixed(2)}×10⁵ m/s ⇒ tương đương 1 lỗ trống (+e) chạy với v_h = ${vMiss.toFixed(2)}×10⁵ m/s.`);
  }
};

LD.materials = {
  intro: [
    ['i', 'Photon mang năng lượng hν = 1240/λ[nm] nhưng động lượng gần như bằng 0 → trên giản đồ E–k, photon chỉ kéo electron nhảy THẲNG ĐỨNG (Δk = 0).'],
    ['w', 'GaAs (vùng cấm thẳng, E_g = 1.42 eV): Đáy dải dẫn nằm ngay trên đỉnh dải hóa trị → hấp thụ và phát sáng cực hiệu quả (LED, Laser).'],
    ['w', 'Silicon (vùng cấm xiên, E_g = 1.12 eV): Đáy dải dẫn lệch k → ngoài photon phải cần thêm Phonon mạng để đổi Δk nên hiệu suất phát sáng rất thấp.'],
    ['v', 'Bấm thử "Ngưỡng GaAs (873nm)" và "Ngưỡng Si (1107nm)" để kiểm chứng trực tiếp Câu 5, hoặc xem tab "Kim loại / Bán dẫn / Cách điện"!']
  ],
  react(S, k, P, say) {
    if (S.mode === 'class') {
      say('v', `Phân loại ở T = ${S.T} K: Kim loại luôn dẫn mạnh; Silicon ${S.T === 0 ? 'cách điện tuyệt đối ở 0 K' : 'có cặp e⁻–h⁺ kích thích nhiệt'}; Cách điện (5.5 eV) vẫn trống trơn.`);
      return;
    }
    const isGaAs = S.semi === 'gaas';
    const Eg = isGaAs ? 1.42 : 1.12;
    const Eph = 1239.84 / S.wl;
    say('v', `${isGaAs ? 'GaAs (Thẳng 1.42 eV)' : 'Si (Xiên 1.12 eV)'}, λ = ${S.wl} nm (hν = ${Eph.toFixed(2)} eV): ${Eph >= Eg ? 'HẤP THỤ ĐƯỢC!' : 'hν < E_g → Ánh sáng xuyên qua trong suốt!'}`);
  }
};

LD.fermi = {
  intro: [
    ['i', 'Để đếm mật độ hạt dẫn ở mức năng lượng E, ta lấy Số ghế có sẵn g(E) nhân với Xác suất có người ngồi f_F(E) = 1 / [1 + exp((E−E_F)/kT)].'],
    ['w', 'Tại E = E_F, xác suất luôn bằng đúng ½ với mọi T > 0. Khi T tăng, hàm Fermi–Dirac nhòe rộng thêm khoảng vài kT tạo ra hai gò electron (sát E_c) và lỗ trống (sát E_v).'],
    ['v', 'Thử chuyển sang "So sánh MB / BE / FD" và kéo (E−E_F)/kT tới 3.0 kT để kiểm chứng quy tắc sai số xấp xỉ Boltzmann < 5% (nền tảng của Buổi 5)!']
  ],
  react(S, k, P, say) {
    if (S.mode === 'stats') {
      const fFD = 1 / (Math.exp(S.dEkT) + 1), fMB = Math.exp(-S.dEkT);
      const err = ((fMB - fFD) / fFD) * 100;
      say('v', `Tại E − E_F = ${S.dEkT.toFixed(1)} kT: f_FD = ${fFD.toFixed(4)}, f_Boltzmann = ${fMB.toFixed(4)} → Sai số = ${err.toFixed(2)}% ${err <= 5.1 ? '(Dùng tốt xấp xỉ Boltzmann!)' : '(Phải dùng Fermi–Dirac!)'}.`);
      return;
    }
    const Ef = S.efPos * 1.12;
    const kT = Math.max(KB * S.T, 1e-5);
    const fEc = S.T === 0 ? 0 : 1 / (1 + Math.exp(clamp((1.12 - Ef) / kT, -100, 100)));
    say('v', `T = ${S.T} K (kT = ${(KB * S.T * 1000).toFixed(1)} meV), E_c−E_F = ${(1.12 - Ef).toFixed(2)} eV, m_n* = ${S.mn.toFixed(1)} m₀ → f_F(E_c) = ${fEc >= 0.001 ? (fEc * 100).toFixed(2) + '%' : sci(fEc, 2)}.`);
  }
};

LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (Tự chèn CSS + HTML popup #lab4 / .lb4-*, tách biệt hoàn toàn)
   ========================================================================== */
const CSS = `
#lab4{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab4[hidden]{display:none}
#lab4 *{box-sizing:border-box}
.lb4-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
.lb4-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
.lb4-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
.lb4-ic{color:var(--main);display:flex}
.lb4-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
.lb4-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
.lb4-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
.lb4-tab:hover{color:var(--ink);background:var(--tint)}
.lb4-tab.on{background:var(--main);color:var(--bg);font-weight:700}
.lb4-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
.lb4-x:hover{color:var(--err);background:var(--tint)}
.lb4-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
.lb4-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
.lb4-p.glow{animation:lb4glow 1.4s ease-out}
@keyframes lb4glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
.lb4-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
.lb4-cv{flex:1;min-height:0;position:relative}
.lb4-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.lb4-c{display:flex;flex-wrap:wrap;gap:6px 12px;padding:5px 10px 8px;flex:none;align-items:center}
.lb4-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb4-k input[type=range]{width:clamp(64px,7vw,108px);margin:0;accent-color:var(--main)}
.lb4-k output{color:var(--ink);font-weight:700;min-width:2.6em}
.lb4-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb4-seg button,.lb4-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer;transition:color .15s,background .15s}
.lb4-btn{background:var(--tint);color:var(--ink)}
.lb4-seg button:hover,.lb4-btn:hover{color:var(--ink);background:var(--g)}
.lb4-seg button.on{background:var(--main);color:var(--bg)}
.lb4-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
.lb4-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb4in .4s ease-out;overflow-wrap:anywhere}
.lb4-ln::before{position:absolute;left:0;font-weight:700}
.lb4-ln.i{color:var(--ink)}.lb4-ln.i::before{content:'›';color:var(--c5)}
.lb4-ln.w{color:var(--ink)}.lb4-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
.lb4-ln.v{color:var(--main)}.lb4-ln.v::before{content:'=';color:var(--main)}
@keyframes lb4in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab4-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab4-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab4-m:hover,.lab4-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb4-win{width:100vw;height:100dvh;border-radius:0}.lb4-b{overflow:auto;display:flex;flex-direction:column}.lb4-p{min-height:280px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'bands';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab4'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 4');
  root.innerHTML = '<div class="lb4-win"><div class="lb4-h"><span class="lb4-ic">' + FLASK + '</span><span class="lb4-bd">Phòng thí nghiệm · Buổi 4</span><nav class="lb4-tabs"></nav><button class="lb4-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb4-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb4-b'); tabsEl = root.querySelector('.lb4-tabs');
  LABS.forEach(l => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lb4-tab'; b.dataset.id = l.id;
    b.textContent = l.no + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b);
  });
  root.querySelector('.lb4-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) {
      const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty &&
          window.LabB4 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden &&
          (document.getElementById('tb-badge') || {}).textContent === 'Buổi 4') {
        e.preventDefault(); open();
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
}

const say = (kind, text) => {
  if (!logEl) return;
  const d = document.createElement('div'); d.className = 'lb4-ln ' + kind; d.textContent = text;
  logEl.appendChild(d);
  while (logEl.children.length > 60) logEl.removeChild(logEl.firstChild);
  logEl.scrollTop = logEl.scrollHeight;
};
const rt = {};
function queueReact(tab, k) {
  if (!tab.log || !tab.log.react) return; clearTimeout(rt[k]);
  rt[k] = setTimeout(() => {
    if (cur !== tab || !logEl) return;
    const P = tab.prev || {};
    tab.log.react(tab.S, k, P, say);
    tab.prev = Object.assign({}, tab.S);
  }, 320);
}
function clearTimers() { timers.forEach(clearTimeout); timers = []; Object.keys(rt).forEach(k => clearTimeout(rt[k])); }

function mkCtrl(tab, c, p) {
  const S = tab.S, w = document.createElement('div');
  const touch = () => { curPanels.forEach(q => q.dirty = true); queueReact(tab, c.k); };
  if (c.btn) {
    w.className = 'lb4-btn'; w.textContent = c.btn; w.setAttribute('role', 'button'); w.tabIndex = 0;
    w.onclick = () => c.fn(p); return w;
  }
  if (c.seg) {
    w.className = 'lb4-seg';
    c.seg.forEach(o => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = o[1]; b.className = S[c.k] === o[0] ? 'on' : '';
      b.onclick = () => {
        S[c.k] = o[0];
        if (c.set && c.set[o[0]]) Object.assign(S, c.set[o[0]]);
        curPanels.forEach(q => q.syncCtrls && q.syncCtrls());
        touch();
      };
      w.appendChild(b);
    });
    p.syncs.push(() => { [...w.children].forEach((b, i) => b.classList.toggle('on', S[c.k] === c.seg[i][0])); });
    return w;
  }
  w.className = 'lb4-k';
  const lab = document.createElement('span'); lab.textContent = c.l;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step;
  const out = document.createElement('output'); w.append(lab, inp, out);
  const sync = () => {
    if (c.dynRange) {
      const [mn, mx] = c.dynRange(S);
      inp.min = mn; inp.max = mx;
      if (S[c.k] < mn) S[c.k] = mn;
      if (S[c.k] > mx) S[c.k] = mx;
    }
    inp.value = c.log ? Math.log10(S[c.k]) : S[c.k];
    out.textContent = c.f(S[c.k]);
  };
  inp.oninput = () => {
    S[c.k] = c.log ? Math.pow(10, +inp.value) : +inp.value;
    curPanels.forEach(q => q.syncCtrls && q.syncCtrls());
    out.textContent = c.f(S[c.k]);
    touch();
  };
  inp.setAttribute('aria-label', c.l); p.syncs.push(sync); sync();
  return w;
}

function show(id, panelIdx) {
  const tab = LABS.find(l => l.id === id) || LABS[0]; cur = tab; lastTab = tab.id;
  clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  [...tabsEl.children].forEach(b => b.classList.toggle('on', b.dataset.id === tab.id));
  const mob = innerWidth <= 900;
  if (!mob) {
    bodyEl.style.display = 'grid'; bodyEl.style.gridTemplateColumns = tab.cols;
    bodyEl.style.gridTemplateRows = tab.rows; bodyEl.style.gridTemplateAreas = tab.areas;
  } else {
    bodyEl.style.display = ''; bodyEl.style.gridTemplate = '';
  }
  tab.prev = Object.assign({}, tab.S);
  tab.panels.concat([{ title: 'Nhật ký thí nghiệm', area: 'l', log: true }]).forEach(spec => {
    const el = document.createElement('div'); el.className = 'lb4-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb4-t"></div><div class="lb4-cv"><canvas></canvas></div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) {
      const lg = document.createElement('div'); lg.className = 'lb4-log'; lg.setAttribute('aria-live', 'polite');
      el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el);
      curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 220 + j * 850)));
      return;
    }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb4-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.ctrls && spec.ctrls.length) {
      const cb = document.createElement('div'); cb.className = 'lb4-c';
      spec.ctrls.forEach(c => cb.appendChild(mkCtrl(tab, c, p)));
      el.appendChild(cb);
    }
    bodyEl.appendChild(el); curPanels.push(p);
    new ResizeObserver(() => {
      const r = box.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      p.W = Math.max(10, r.width); p.H = Math.max(10, r.height);
      cv.width = Math.round(p.W * d); cv.height = Math.round(p.H * d);
      p.ctx.setTransform(d, 0, 0, d, 0, 0); p.dirty = true;
    }).observe(box);
  });
  if (panelIdx != null && curPanels[panelIdx]) {
    const e = curPanels[panelIdx].el; e.classList.add('glow');
    setTimeout(() => e.classList.remove('glow'), 1500);
  }
}

function loop(ts) {
  if (root.hidden) { raf = 0; return; }
  const dt = Math.min(0.04, (ts - last) / 1000); last = ts; tAcc += dt;
  curPanels.forEach(p => {
    if (!p.ctx || !p.W || !(p.spec.anim || p.dirty)) return; p.dirty = false;
    const ctx = p.ctx;
    ctx.clearRect(0, 0, p.W, p.H);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, p.W, p.H);
    ctx.save();
    try { p.spec.draw(p, ctx, p.W, p.H, tAcc, dt); }
    catch (err) { console.error('LabB4 render error:', err); }
    ctx.restore();
  });
  raf = requestAnimationFrame(loop);
}

function open(id, panelIdx) {
  ensureDom(); readColors(); opener = document.activeElement;
  root.hidden = false; show(id || lastTab, panelIdx);
  last = performance.now(); if (!raf) raf = requestAnimationFrame(loop);
  root.querySelector('.lb4-x').focus({ preventScroll: true });
  const b = document.getElementById('tb-lab'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
}
function close() {
  if (!root || root.hidden) return;
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  const b = document.getElementById('tb-lab'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- Dấu hiệu bình thí nghiệm trong bài học Buổi 4 ---------- */
const H3MAP = [
  [/^1\.1/, 'bands', 0],
  [/^1\.[2345]/, 'kp', 0],
  [/^2\.1/, 'ek', 0],
  [/^2\.2/, 'bloch', 0],
  [/^2\.3/, 'hole', 0],
  [/^2\.4/, 'ek', 0],
  [/^2\.5/, 'materials', 0],
  [/^3\.[12]/, 'fermi', 0]
];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab4-m')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab4-m'; b.innerHTML = FLASK;
  b.setAttribute('aria-label', 'Xem thí nghiệm: ' + title); b.title = 'Xem thí nghiệm';
  b.onclick = e => { e.preventDefault(); e.stopPropagation(); open(id, pi); }; h.appendChild(b);
}
function markLesson(rootEl) {
  if (!rootEl) return;
  rootEl.querySelectorAll('h2').forEach(h => {
    const m = /^\s*(\d+)\./.exec(h.textContent); if (!m) return;
    const l = LABS.find(x => x.secs.includes(+m[1])); if (l) addMark(h, l.id, null, l.name);
  });
  rootEl.querySelectorAll('h3').forEach(h => {
    const t = h.textContent.trim();
    const r = H3MAP.find(x => x[0].test(t)); if (r) addMark(h, r[1], r[2], t);
  });
}

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 4') {
  markLesson(document.getElementById('app-content'));
}

window.LabB4 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
