/* ==========================================================================
   lab-b4.js — PHÒNG THÍ NGHIỆM LÝ THUYẾT LƯỢNG TỬ CHẤT RẮN BUỔI 4 (Tự Chứa)
   - TUYỆT ĐỐI KHÔNG BIỂU ĐỒ, KHÔNG SƠ ĐỒ TRỤC TỌA ĐỘ!
   - Thẩm mỹ đồng bộ 100% với SVG Buổi 4: trường hàm sóng 2D phân tầng đồng mức
     Inferno (pha dương ψ > 0) & Ice-Cyan (pha âm ψ < 0) trên nền đêm #0f0c14,
     hạt nhân trắng viền đen và mặt nút nét đứt cyan.
   - 6 phòng thí nghiệm vật lý thực tế phủ trọn lý thuyết & bài tập Buổi 4:
       1. Chồng lấn 2 Nguyên tử: Trường sóng 2D (Tách xa / Liên kết + / Phản liên kết −) & Chuỗi N
       2. Sóng Bloch 2D & Bragg: Mạng 6×6 nguyên tử (k=0..π/a), Sóng đứng Bragg ψ₊ vs ψ₋ (Câu 1, 2)
       3. Buồng Điện trường E: Gói sóng 2D Dao động Bloch vs Tán xạ Phonon & Đua m* (Câu 3, 4)
       4. Mạng Si & Lỗ trống: Trường liên kết Inferno đầy kín vs Khoang lỗ trống Cyan (+e) chạy cùng E
       5. Bàn Laser Quang học: Chiếu tia Laser màu thật vào phiến GaAs (Thẳng) vs Si (Xiên) (Câu 5)
       6. Lò nhiệt & Hộp Pauli: 3 phiến Kim loại / Si / Kim cương & 3 Hộp lượng tử FD / BE / MB
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

/* ---------- Bảng màu phân tầng đồng mức (Isocontour) trích chuẩn từ SVG Buổi 4 ---------- */
const NIGHT_BG = '#0f0c14';
const NIGHT_RGB = [15, 12, 20];
// 6 bậc màu Pha Dương (ψ > 0): Tím đậm → Tím hồng → Hồng đậm → Cam đỏ → Vàng cam → Vàng kem
const PAL_POS = [
  [59, 18, 93],
  [113, 31, 119],
  [190, 54, 99],
  [236, 104, 46],
  [251, 169, 44],
  [254, 241, 182]
];
// 6 bậc màu Pha Âm (ψ < 0): Xanh biển sẫm → Xanh biển → Ngọc lam → Cyan → Cyan sáng → Trắng băng
const PAL_NEG = [
  [16, 52, 82],
  [22, 94, 130],
  [30, 141, 168],
  [52, 190, 201],
  [126, 232, 230],
  [218, 254, 254]
];
const COL_WARM = '#fba92c';
const COL_HOT  = '#ec682e';
const COL_CYAN = '#34bec9';
const COL_ICE  = '#7ee8e6';
const COL_MAG  = '#be3663';

/* ---------- Đọc màu khung UI & font chữ của trang ---------- */
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
  else if (wl <= 780) { r = 1; g = 0.14; b = 0.14; }
  else { r = 0.92; g = 0.28; b = 0.36; }
  const R = Math.round(r * 255), G = Math.round(g * 255), B = Math.round(b * 255);
  return { css: `rgb(${R},${G},${B})`, rgba: a => `rgba(${R},${G},${B},${a})` };
}

/* ---------- Bộ vẽ trường sóng lượng tử 2D phân tầng đồng mức (Offscreen) ---------- */
const _wfCanvas = document.createElement('canvas');
const _wfCtx = _wfCanvas.getContext('2d');
let _wfImg = null;

function renderWaveField(ctx, x, y, w, h, resW, resH, evalFn, thresholds) {
  if (_wfCanvas.width !== resW || _wfCanvas.height !== resH) {
    _wfCanvas.width = resW;
    _wfCanvas.height = resH;
    _wfImg = _wfCtx.createImageData(resW, resH);
  }
  const data = _wfImg.data;
  const th = thresholds || [0.09, 0.20, 0.34, 0.50, 0.68, 0.85];
  let idx = 0;
  for (let py = 0; py < resH; py++) {
    const v = (py + 0.5) / resH;
    for (let px = 0; px < resW; px++) {
      const u = (px + 0.5) / resW;
      const val = evalFn(u, v);
      const av = Math.abs(val);
      let rgb = NIGHT_RGB;
      if (av >= th[0]) {
        let lvl = 0;
        if (av >= th[5]) lvl = 5;
        else if (av >= th[4]) lvl = 4;
        else if (av >= th[3]) lvl = 3;
        else if (av >= th[2]) lvl = 2;
        else if (av >= th[1]) lvl = 1;
        rgb = val >= 0 ? PAL_POS[lvl] : PAL_NEG[lvl];
      }
      data[idx++] = rgb[0];
      data[idx++] = rgb[1];
      data[idx++] = rgb[2];
      data[idx++] = 255;
    }
  }
  _wfCtx.putImageData(_wfImg, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = false; // Giữ độ sắc nét bậc thang đồng mức y hệt SVG!
  ctx.drawImage(_wfCanvas, x, y, w, h);
  ctx.restore();
}

/* ---------- Tiện ích vẽ Canvas ---------- */
function txt(ctx, s, x, y, col, size, al, wt, fam) {
  ctx.font = (wt || 600) + ' ' + (size || 12) + 'px ' + (fam || FONT);
  ctx.fillStyle = col || '#f3eedc';
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
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
  g.addColorStop(0, colorCore);
  g.addColorStop(0.42, colorGlow);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, TAU); ctx.fill();
}
/* Hạt nhân nguyên tử trắng tinh viền đen đặc trưng của SVG Buổi 4 */
function drawNucleus(ctx, x, y, r = 5.5, fill = '#ffffff', stroke = '#120f17') {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1.4, r * 0.32);
  ctx.stroke();
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
/* Buồng kính hiển vi nền đêm #0f0c14 sắc nét */
function drawScopeBg(ctx, x, y, w, h, r = 10) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = NIGHT_BG;
  ctx.fill();
  ctx.strokeStyle = '#3c3945';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

/* ---------- Bộ giải số chính xác Kronig–Penney cho thông số Câu 1 & Câu 2 ---------- */
function kpF(u, P) {
  if (Math.abs(u) < 1e-6) return P + 1;
  return P * Math.sin(u) / u + Math.cos(u);
}
function solveKPBands(P) {
  const bands = [];
  for (let n = 1; n <= 3; n++) {
    const hiEdge = n * Math.PI;
    const loStart = (n - 1) * Math.PI + 1e-4;
    if (P < 1e-4) { bands.push({ n, lo: (n - 1) * Math.PI, hi: hiEdge }); continue; }
    const target = (n % 2 === 1) ? 1 : -1;
    let lo = loStart, hi = hiEdge - 1e-5;
    let fLo = kpF(lo, P) - target;
    for (let it = 0; it < 40; it++) {
      const mid = (lo + hi) * 0.5;
      const fm = kpF(mid, P) - target;
      if (fLo * fm <= 0) hi = mid; else { lo = mid; fLo = fm; }
    }
    bands.push({ n, lo: (lo + hi) * 0.5, hi: hiEdge });
  }
  return bands;
}

const LABS = [];

/* ==========================================================================
   TAB 1 — CHỒNG LẤN 2 NGUYÊN TỬ & CHUỖI NGUYÊN TỬ (Mục 1.1)
   Tái hiện trực tiếp trường hàm sóng 2D phân tầng Inferno/Ice-Cyan y hệt Hình 1:
   - Chế độ "3 khung chuẩn": Tách xa | Liên kết (ψA+ψB) | Phản liên kết (ψA−ψB)
   - Chế độ "Liên kết (+)" / "Phản liên kết (−)": Phóng to tương tác kéo d mượt mà
   - Chế độ "Chuỗi N nguyên tử": Trường sóng 2D thực tế trên chuỗi N = 2..10 nguyên tử
   ========================================================================== */
LABS.push({
  id: 'overlap', name: 'Chồng lấn 2 Nguyên tử', no: '1.1', secs: [1],
  S: { view: 'trio', dist: 2.35, N: 6, nodes: 2, breathe: true },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Kính hiển vi hàm sóng 2D — Chồng lấn đám mây ψA ± ψB & Chuỗi N nguyên tử',
    area: 'a', anim: true,
    ctrls: [
      { k: 'view', seg: [['trio', '3 khung so sánh'], ['bond', 'Liên kết (+)'], ['anti', 'Phản liên kết (−)'], ['chain', 'Chuỗi N nguyên tử']] },
      { k: 'dist', l: 'Khoảng cách d', min: 1.7, max: 5.2, step: 0.05, f: v => v.toFixed(2) + ' Å' },
      { k: 'N', l: 'Số nguyên tử N', min: 2, max: 10, step: 1, f: v => 'N=' + v },
      { k: 'nodes', l: 'Số nút', min: 0, max: 5, step: 1, dynRange: S => [0, Math.max(0, S.N - 1)], f: v => v + ' nút' },
      { btn: 'Si thật (2.35 Å)', fn: p => { p.S.dist = 2.35; p.syncCtrls(); queueReact(p.tab, 'dist'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S;
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const d = S.dist;
      const delta = 2.4 * Math.exp(-(d - 1.7) / 0.88);
      const topBar = 32;
      const areaX = chX + 8, areaY = chY + topBar, areaW = chW - 16, areaH = chH - topBar - 10;

      // Hàm vẽ 1 khung trường sóng 2 nguyên tử phân tầng Inferno/Ice-Cyan
      const drawPairCell = (fx, fy, fw, fh, sepA, sign, label) => {
        const aspect = fw / Math.max(fh, 1);
        const spanY = 6.2; // Å theo chiều dọc
        const spanX = spanY * aspect;
        const halfD = sepA * 0.5;
        const decay = 0.88; // bán kính suy giảm orbital (Å)
        const pulse = S.breathe ? (1 + 0.025 * Math.sin(t * 2.8)) : 1;

        ctx.save();
        rr(ctx, fx, fy, fw, fh, 6);
        ctx.clip();

        const resW = clamp(Math.round(fw * 0.55), 110, 220);
        const resH = clamp(Math.round(fh * 0.55), 80, 170);
        renderWaveField(ctx, fx, fy, fw, fh, resW, resH, (u, v) => {
          const x = (u - 0.5) * spanX;
          const y = (v - 0.5) * spanY;
          const rA = Math.hypot(x + halfD, y);
          const rB = Math.hypot(x - halfD, y);
          const pA = Math.exp(-rA / (decay * pulse));
          const pB = Math.exp(-rB / (decay * pulse));
          const psi = sign > 0 ? (pA + pB) : (pA - pB);
          // Chuẩn hóa nhẹ sao cho vùng lõi đạt đỉnh bậc 6 vàng kem / trắng băng
          const norm = sign > 0 ? 1.05 : 0.96;
          return clamp(psi / norm, -1, 1);
        });

        // Đường nét đứt xanh mặt nút ψ = 0 cho tổ hợp Phản liên kết (−)
        const cx = fx + fw * 0.5, cy = fy + fh * 0.5;
        if (sign < 0) {
          ln(ctx, cx, fy + 4, cx, fy + fh - 4, COL_ICE, 2.2, [6, 5]);
        }

        // Hai hạt nhân nguyên tử trắng tinh viền đen
        const pxPerA = fh / spanY;
        const xA = cx - halfD * pxPerA;
        const xB = cx + halfD * pxPerA;
        drawNucleus(ctx, xA, cy, clamp(fw * 0.028, 5, 7.5));
        drawNucleus(ctx, xB, cy, clamp(fw * 0.028, 5, 7.5));

        txt(ctx, label, cx, fy + fh - 14, '#fef1b6', 10.5, 'center', 700, MONO);
        ctx.restore();

        rr(ctx, fx, fy, fw, fh, 6);
        ctx.strokeStyle = '#484554'; ctx.lineWidth = 1.2; ctx.stroke();
      };

      if (S.view === 'trio') {
        const gap = 8;
        const cw = (areaW - gap * 2) / 3;
        drawPairCell(areaX, areaY, cw, areaH, 4.7, 1, 'Tách xa (Độc lập)');
        drawPairCell(areaX + cw + gap, areaY, cw, areaH, d, 1, 'Liên kết ψA + ψB (E₀−Δ)');
        drawPairCell(areaX + (cw + gap) * 2, areaY, cw, areaH, d, -1, 'Phản liên kết ψA − ψB (E₀+Δ)');
      } else if (S.view === 'bond' || S.view === 'anti') {
        const sign = S.view === 'bond' ? 1 : -1;
        drawPairCell(areaX, areaY, areaW, areaH, d, sign,
          sign > 0 ? 'Liên kết ψA + ψB: Mật độ dồn giữa 2 hạt nhân → Hạ năng lượng'
                   : 'Phản liên kết ψA − ψB: Mặt nút ψ = 0 đẩy e⁻ ra ngoài → Tăng năng lượng');
      } else {
        // --- CHẾ ĐỘ CHUỖI N NGUYÊN TỬ: TRƯỜNG SÓNG 2D PHÂN TẦNG ĐỒNG MỨC ---
        const N = clamp(Math.round(S.N), 2, 10);
        const kNodes = clamp(Math.round(S.nodes), 0, N - 1);
        const modeM = kNodes + 1; // 1..N
        const osc = Math.cos(t * 2.2); // Dao động pha sống động trên chuỗi

        ctx.save();
        rr(ctx, areaX, areaY, areaW, areaH, 6);
        ctx.clip();

        // Tính vị trí các nguyên tử trong tọa độ chuẩn hóa u ∈ [0.09, 0.91]
        const atomUs = [];
        for (let j = 0; j < N; j++) atomUs.push(0.09 + (j / Math.max(N - 1, 1)) * 0.82);
        const atomWts = atomUs.map((_, j) => Math.sin((modeM * Math.PI * (j + 1)) / (N + 1)));
        const maxW = Math.max(...atomWts.map(Math.abs), 0.1);
        const aspect = areaW / Math.max(areaH, 1);
        const decU = clamp(0.44 / N, 0.045, 0.11);

        const resW = clamp(Math.round(areaW * 0.48), 160, 260);
        const resH = clamp(Math.round(areaH * 0.45), 90, 150);
        renderWaveField(ctx, areaX, areaY, areaW, areaH, resW, resH, (u, v) => {
          const dy = (v - 0.5) / aspect;
          let sum = 0;
          for (let j = 0; j < N; j++) {
            const dx = u - atomUs[j];
            const dist = Math.hypot(dx, dy);
            sum += (atomWts[j] / maxW) * Math.exp(-dist / decU);
          }
          return clamp(sum * (0.92 + 0.08 * osc), -1, 1);
        });

        // Vẽ các hạt nhân trắng viền đen dọc theo chuỗi & các vạch nút nét đứt cyan
        const cy = areaY + areaH * 0.5;
        for (let j = 0; j < N - 1; j++) {
          if (atomWts[j] * atomWts[j + 1] < -1e-4) {
            const frac = Math.abs(atomWts[j]) / (Math.abs(atomWts[j]) + Math.abs(atomWts[j + 1]));
            const nx = areaX + (atomUs[j] + frac * (atomUs[j + 1] - atomUs[j])) * areaW;
            ln(ctx, nx, areaY + 12, nx, areaY + areaH - 12, COL_ICE, 1.8, [5, 5]);
          }
        }
        atomUs.forEach(u => {
          drawNucleus(ctx, areaX + u * areaW, cy, clamp(10 - N * 0.45, 4.8, 7.5));
        });

        const eRel = -2 * Math.cos((modeM * Math.PI) / (N + 1));
        txt(ctx, 'Chuỗi N = ' + N + ' nguyên tử · Trạng thái ' + kNodes + ' nút · E − E₀ = ' + (eRel >= 0 ? '+' : '') + eRel.toFixed(2) + 't',
          areaX + areaW * 0.5, areaY + areaH - 14, '#fef1b6', 10.5, 'center', 700, MONO);
        ctx.restore();

        rr(ctx, areaX, areaY, areaW, areaH, 6);
        ctx.strokeStyle = '#484554'; ctx.lineWidth = 1.2; ctx.stroke();
      }

      // Thanh thông số gọn ở mép trên buồng
      txt(ctx, 'Cam ấm: pha dương (+ψ)   ·   Xanh ngọc: pha âm (−ψ)   ·   Nét đứt: mặt nút ψ = 0',
        chX + 12, chY + 17, '#e8e2d5', 10.4, 'left', 700, MONO);
      txt(ctx, 'd = ' + d.toFixed(2) + ' Å  |  Độ tách 2Δ = ' + (2 * delta).toFixed(2) + ' eV',
        chX + chW - 12, chY + 17, COL_WARM, 10.6, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 2 — KÍNH HIỂN VI SÓNG BLOCH 2D & PHẢN XẠ BRAGG (Mục 1.2–1.5 · Câu 1, 2)
   Tái hiện trực tiếp trường sóng 2D trên mạng tinh thể 6×6 nguyên tử y hệt Hình 2!
   - Chế độ "3 khung chuẩn (Hình 2)": k = π/3a | k = π/2a | k = 0 (36 nguyên tử đồng pha)
   - Chế độ "Sóng chạy Bloch": Kéo k (0..π/a) & P' xem sóng lướt thật xuyên qua lưới 6×6
   - Chế độ "Sóng đứng Bragg (k = π/a)": Đặt cạnh nhau ψ₊ (nằm trên ion → E₋) & ψ₋ (giữa 2 ion → E₊)
   ========================================================================== */
LABS.push({
  id: 'bloch', name: 'Sóng Bloch 2D & Bragg', no: '1.2–1.5', secs: [],
  S: { view: 'trio', kFrac: 0.50, P: 12.0, a: 5.0 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Kính hiển vi Sóng Bloch ψ_k(r) = e^{ikx}·u_k(r) trên mạng 6×6 & Sóng đứng Bragg',
    area: 'a', anim: true,
    ctrls: [
      { k: 'view', seg: [['trio', '3 mẫu Bloch (6×6)'], ['live', 'Sóng chạy Bloch'], ['bragg', 'Sóng đứng Bragg (k=π/a)']] },
      { k: 'kFrac', l: 'Số sóng k', min: 0, max: 1.0, step: 0.05, f: v => v === 0 ? '0' : v.toFixed(2) + 'π/a' },
      { k: 'P', l: "Liên kết P'", min: 0, max: 16, step: 0.5, f: v => v.toFixed(1) },
      { btn: "Câu 1,2 (P'=12)", fn: p => { p.S.P = 12; p.S.a = 5.0; p.syncCtrls(); queueReact(p.tab, 'P'); } },
      { btn: 'Bragg (k=π/a)', fn: p => { p.S.view = 'bragg'; p.S.kFrac = 1.0; p.syncCtrls(); queueReact(p.tab, 'kFrac'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S;
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const bands = solveKPBands(S.P);
      const uToEv = u => HBAR2_2ME_EV_A2 * (u * u) / (S.a * S.a);
      const eg1 = uToEv(bands[1].lo) - uToEv(bands[0].hi);

      const topBar = 32;
      const areaX = chX + 8, areaY = chY + topBar, areaW = chW - 16, areaH = chH - topBar - 10;

      // Hàm vẽ 1 tấm mạng tinh thể 6×6 với trường sóng Bloch 2D phân tầng đồng mức
      const drawBlochGrid = (fx, fy, fw, fh, kPi, phaseOff, modeKind, label, locFactor) => {
        const nx = 6, ny = 6;
        // locFactor điều chỉnh mức độ co cụm sóng quanh nguyên tử theo P'
        const tight = clamp(locFactor, 0.25, 1.45);
        const resW = clamp(Math.round(fw * 0.52), 96, 190);
        const resH = clamp(Math.round(fh * 0.52), 96, 190);

        ctx.save();
        rr(ctx, fx, fy, fw, fh, 5);
        ctx.clip();

        renderWaveField(ctx, fx, fy, fw, fh, resW, resH, (u, v) => {
          // Tọa độ liên tục theo đơn vị hằng số mạng a: x ∈ [0, 6], y ∈ [0, 6], nút tại i + 0.5
          const gx = u * nx;
          const gy = v * ny;
          const dx = (gx - Math.floor(gx)) - 0.5;
          const dy = (gy - Math.floor(gy)) - 0.5;
          const r = Math.hypot(dx, dy);
          // Hàm tuần hoàn u_k(r) quanh từng nút nguyên tử (co cụm mạnh hơn khi P' lớn)
          const uAtom = Math.exp(-r * (1.85 + tight * 1.65)) * 0.78 + 0.34;
          let env;
          if (modeKind === 'braggCos') {
            // Sóng đứng ψ₊ ∝ cos(π(x−0.5)): Đỉnh đặt NGAY TRÊN cột nguyên tử!
            env = Math.cos(Math.PI * (gx - 0.5)) * (0.85 + 0.15 * Math.cos(t * 3.4));
          } else if (modeKind === 'braggSin') {
            // Sóng đứng ψ₋ ∝ sin(π(x−0.5)): Mặt nút đen cắt NGANG QUA cột nguyên tử!
            env = Math.sin(Math.PI * (gx - 0.5)) * (0.85 + 0.15 * Math.cos(t * 3.4));
          } else {
            // Sóng Bloch chuẩn: Re[e^{i(k x − ωt)}] · u_k(r)
            env = Math.cos(kPi * Math.PI * (gx - 0.5) - phaseOff);
          }
          return clamp(env * uAtom * 1.06, -1, 1);
        });

        // Vẽ 6×6 hạt nhân nguyên tử trắng viền đen y hệt Hình 2
        const rNuc = clamp(Math.min(fw, fh) * 0.027, 3.6, 5.8);
        for (let iy = 0; iy < ny; iy++) {
          for (let ix = 0; ix < nx; ix++) {
            const ax = fx + ((ix + 0.5) / nx) * fw;
            const ay = fy + ((iy + 0.5) / ny) * fh;
            drawNucleus(ctx, ax, ay, rNuc);
          }
        }

        // Nhãn dưới khung có dải nền tối nhẹ để đọc sắc nét
        ctx.fillStyle = 'rgba(15, 12, 20, 0.78)';
        ctx.fillRect(fx, fy + fh - 22, fw, 22);
        txt(ctx, label, fx + fw * 0.5, fy + fh - 11, '#fef1b6', 10, 'center', 700, MONO);
        ctx.restore();

        rr(ctx, fx, fy, fw, fh, 5);
        ctx.strokeStyle = '#484554'; ctx.lineWidth = 1.2; ctx.stroke();
      };

      const loc = S.P / 12.0;

      if (S.view === 'trio') {
        const gap = 10;
        const sz = Math.min((areaW - gap * 2) / 3, areaH);
        const startX = areaX + (areaW - (sz * 3 + gap * 2)) * 0.5;
        const startY = areaY + (areaH - sz) * 0.5;
        // 3 khung chuẩn giống hệt Hình 2 (k = π/3a, k = π/2a, k = 0) với sóng thở nhẹ sống động
        drawBlochGrid(startX, startY, sz, sz, 0.34, t * 0.55, 'bloch', 'k ≈ π/3a (Dải rộng)', loc);
        drawBlochGrid(startX + sz + gap, startY, sz, sz, 0.62, t * 0.85, 'bloch', 'k ≈ 2π/3a (Nút dày)', loc);
        drawBlochGrid(startX + (sz + gap) * 2, startY, sz, sz, 0.0, 0, 'bloch', 'k = 0 (Cùng pha)', loc);
      } else if (S.view === 'live') {
        const sz = Math.min(areaW, areaH);
        const sx = areaX + (areaW - sz) * 0.5, sy = areaY + (areaH - sz) * 0.5;
        const speed = S.kFrac === 0 ? 0 : (1.2 + S.kFrac * 1.8);
        drawBlochGrid(sx, sy, sz, sz, S.kFrac, t * speed, 'bloch',
          'Sóng chạy Bloch: k = ' + S.kFrac.toFixed(2) + 'π/a  (P′ = ' + S.P.toFixed(1) + ')', loc);
      } else {
        const gap = 14;
        const sz = Math.min((areaW - gap) * 0.5, areaH);
        const startX = areaX + (areaW - (sz * 2 + gap)) * 0.5;
        const startY = areaY + (areaH - sz) * 0.5;
        drawBlochGrid(startX, startY, sz, sz, 1.0, 0, 'braggCos', 'ψ₊ = cos(πx/a) · Dồn LÊN ion (E₋ thấp)', loc);
        drawBlochGrid(startX + sz + gap, startY, sz, sz, 1.0, 0, 'braggSin', 'ψ₋ = sin(πx/a) · Dồn GIỮA 2 ion (E₊ cao)', loc);
      }

      // Thanh thông số nghiệm Kronig–Penney (Câu 1 & Câu 2) gọn sắc ở mép trên
      const b1 = bands[0];
      txt(ctx, "P′ = " + S.P.toFixed(1) + '  |  Dải 1: αa ∈ [' + b1.lo.toFixed(2) + ', π] (' + uToEv(b1.lo).toFixed(2) + '–' + uToEv(b1.hi).toFixed(2) + ' eV)',
        chX + 12, chY + 17, '#e8e2d5', 10.4, 'left', 700, MONO);
      txt(ctx, 'Khe vùng cấm E_g = ' + eg1.toFixed(2) + ' eV',
        chX + chW - 12, chY + 17, COL_WARM, 10.8, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 3 — BUỒNG ĐIỆN TRƯỜNG TINH THỂ: DAO ĐỘNG BLOCH, TÁN XẠ & ĐUA m* (Câu 3, 4)
   KHÔNG CÓ ĐỒ THỊ E-k!
   - Chế độ 1 ("Dao động Bloch"): Gói sóng electron 2D phân tầng Inferno/Cyan lao
     qua mạng nguyên tử dưới điện trường E → gặp phản xạ Bragg (m* < 0) nên phanh
     ngược và dao động qua lại!
   - Chế độ 2 ("Tán xạ Phonon"): Mạng Si nóng rung nhiệt; electron va chạm tán xạ
     tạo tốc độ trôi đều v_d = μE đo trên Ampe kế kim cơ!
   - Chế độ 3 ("Đua m* — Câu 3"): 2 buồng tinh thể song song (A nhẹ 0.32m₀ vs B nặng
     1.29m₀): 2 gói sóng 2D đồng mức cùng xuất phát dưới 1 điện trường E!
   ========================================================================== */
LABS.push({
  id: 'crystal', name: 'Bloch, Trôi & Đua m*', no: '2.1–2.4', secs: [2],
  S: { mode: 'bloch', Efield: 10, tau: 0.20 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng tinh thể dưới điện trường E — Gói sóng 2D Dao động Bloch, Tán xạ & Đua m*',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['bloch', 'Dao động Bloch (τ=∞)'], ['drift', 'Tán xạ Si (v_d=μE)'], ['race', 'Đua m* (Câu 3)']] },
      { k: 'Efield', l: 'Điện trường E', min: 2, max: 20, step: 1, f: v => v + ' kV/cm' },
      { k: 'tau', l: 'Thời gian τ', min: 0.05, max: 0.50, step: 0.05, f: v => v.toFixed(2) + ' ps' },
      { btn: 'Thả lại', fn: p => { p.st.simT = 0; p.st.raceT = 0; p.st.pts = null; } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32;
      const bx = chX + 26, by = chY + topBar + 6, bw = chW - 52, bh = chH - topBar - 22;

      // Hai bản điện cực tạo điện trường E ở hai đầu buồng tinh thể
      rr(ctx, chX + 10, by + 8, 12, bh - 16, 3);
      ctx.fillStyle = COL_CYAN; ctx.fill();
      txt(ctx, '−', chX + 16, by + bh * 0.5, '#0f0c14', 11, 'center', 800, MONO);

      rr(ctx, chX + chW - 22, by + 8, 12, bh - 16, 3);
      ctx.fillStyle = COL_WARM; ctx.fill();
      txt(ctx, '+', chX + chW - 16, by + bh * 0.5, '#0f0c14', 11, 'center', 800, MONO);

      const E_Vm = S.Efield * 1e5;
      const mu_cm2 = ((EV * (S.tau * 1e-12)) / (0.26 * ME)) * 1e4;
      const vd_kms = ((mu_cm2 * 1e-4) * E_Vm) / 1000;
      const TB_ps = (H_PL / (EV * (E_Vm * 100) * 5.43e-10)) * 1e12;

      if (S.mode === 'bloch') {
        // --- CHẾ ĐỘ 1: GÓI SÓNG ELECTRON 2D DAO ĐỘNG BLOCH TRONG MẠNG TINH THỂ ---
        st.simT = (st.simT || 0) + dt * (0.45 + S.Efield * 0.04);
        // kNorm quét răng cưa từ -1 -> +1 (vùng Brillouin)
        const kNorm = ((((st.simT / Math.PI) + 1) % 2) + 2) % 2 - 1;
        const vNorm = Math.sin(kNorm * Math.PI);
        const invM = Math.cos(kNorm * Math.PI);
        const xNorm = -Math.cos(kNorm * Math.PI); // dao động qua lại trong buồng!

        const ampU = 0.28 * (10 / Math.max(S.Efield, 5));
        const uCenter = 0.5 + clamp(xNorm * ampU, -0.34, 0.34);

        ctx.save();
        rr(ctx, bx, by, bw, bh, 6);
        ctx.clip();

        // Render gói sóng electron 2D phân tầng Inferno/Cyan có bước sóng nội tại nén theo |kNorm|!
        const resW = clamp(Math.round(bw * 0.45), 140, 220);
        const resH = clamp(Math.round(bh * 0.45), 90, 150);
        const kWave = 1.5 + Math.abs(kNorm) * 16.0; // Khi gần Bragg, vân cam/cyan nén sát rạt!
        renderWaveField(ctx, bx, by, bw, bh, resW, resH, (u, v) => {
          const dx = u - uCenter;
          const dy = v - 0.5;
          const env = Math.exp(-(dx * dx) / 0.011 - (dy * dy) / 0.055);
          if (env < 0.05) return 0;
          const carrier = Math.cos(kWave * dx * Math.PI - st.simT * 4.5);
          return clamp(env * carrier * 1.05, -1, 1);
        });

        // Lưới nguyên tử hoàn hảo 10×5 (trắng viền đen) nằm tĩnh
        const cols = 10, rows = 5;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const ax = bx + ((c + 0.5) / cols) * bw;
            const ay = by + ((r + 0.5) / rows) * bh;
            drawNucleus(ctx, ax, ay, 4.2, 'rgba(255,255,255,0.88)', '#14111c');
          }
        }

        // Vector vận tốc & trạng thái m* ngay trên gói sóng
        const wx = bx + uCenter * bw, wy = by + bh * 0.5;
        if (Math.abs(vNorm) > 0.08) {
          arrow(ctx, wx, wy - 38, wx + vNorm * 58, wy - 38, COL_WARM, 2.5);
        }
        const stateCol = invM >= 0 ? COL_ICE : COL_HOT;
        const stateLbl = invM >= 0 ? 'm* > 0 : Tăng tốc cùng lực' : 'm* < 0 : Phanh ngược Bragg!';
        txt(ctx, stateLbl, wx, wy + 44, stateCol, 10.8, 'center', 700, MONO);
        ctx.restore();

        rr(ctx, bx, by, bw, bh, 6);
        ctx.strokeStyle = '#484554'; ctx.lineWidth = 1.2; ctx.stroke();

        txt(ctx, 'Tinh thể lý tưởng (τ = ∞): Gói sóng 2D bị phản xạ Bragg nên dao động qua lại!',
          chX + 12, chY + 17, '#e8e2d5', 10.4, 'left', 700, MONO);
        txt(ctx, 'k = ' + (kNorm >= 0 ? '+' : '') + kNorm.toFixed(2) + 'π/a  |  T_B ≈ ' + TB_ps.toFixed(2) + ' ps',
          chX + chW - 12, chY + 17, COL_WARM, 10.6, 'right', 700, MONO);

      } else if (S.mode === 'drift') {
        // --- CHẾ ĐỘ 2: TÁN XẠ PHONON TRONG SILICON THẬT → VẬN TỐC TRÔI v_d = μE ---
        const mainW = bw - 114;
        rr(ctx, bx, by, mainW, bh, 6);
        ctx.fillStyle = NIGHT_BG; ctx.fill();
        ctx.strokeStyle = '#484554'; ctx.lineWidth = 1.2; ctx.stroke();

        if (!st.pts) {
          st.pts = Array.from({ length: 20 }, () => ({
            x: rnd(0.05, 0.95), y: rnd(0.10, 0.90),
            vx: rnd(-0.4, 0.4), vy: rnd(-0.4, 0.4), trail: []
          }));
          st.sparks = [];
          st.needle = 0;
        }

        ctx.save();
        rr(ctx, bx + 1, by + 1, mainW - 2, bh - 2, 5);
        ctx.clip();

        // Lưới nguyên tử Si dao động nhiệt phonon (tỉ lệ nghịch τ)
        const vib = clamp(0.6 / Math.max(S.tau, 0.05), 1.0, 4.2);
        const cols = 8, rows = 5;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const ax = bx + ((c + 0.5) / cols) * mainW + Math.sin(t * 16 + c * 3 + r) * vib;
            const ay = by + ((r + 0.5) / rows) * bh + Math.cos(t * 17 + r * 4 + c) * vib;
            drawNucleus(ctx, ax, ay, 4.2, 'rgba(255,255,255,0.75)', '#14111c');
          }
        }

        // Electron trôi sang bản dương (+) bên phải & va chạm tán xạ ngẫu nhiên
        const scatRate = 1.5 / Math.max(S.tau, 0.05);
        const accel = 0.22 * S.Efield;
        st.pts.forEach((pt, idx) => {
          pt.vx += accel * dt;
          pt.x += pt.vx * dt * 0.34;
          pt.y += pt.vy * dt * 0.34;
          if (Math.random() < dt * scatRate) {
            const a = rnd(0, TAU), sp = rnd(0.32, 0.60);
            pt.vx = Math.cos(a) * sp; pt.vy = Math.sin(a) * sp;
            if (idx < 6) st.sparks.push({ x: pt.x, y: pt.y, life: 1.0 });
          }
          if (pt.x > 1) { pt.x -= 1; pt.trail = []; }
          if (pt.x < 0) { pt.x += 1; pt.trail = []; }
          if (pt.y < 0.06 || pt.y > 0.94) { pt.vy *= -1; pt.y = clamp(pt.y, 0.06, 0.94); }

          const sx = bx + pt.x * mainW, sy = by + pt.y * bh;
          if (idx < 4) {
            pt.trail.push([sx, sy]);
            if (pt.trail.length > 26) pt.trail.shift();
            if (pt.trail.length > 1) {
              ctx.beginPath();
              pt.trail.forEach((q, qi) => qi === 0 ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]));
              ctx.strokeStyle = hexA(COL_WARM, 0.45); ctx.lineWidth = 1.5; ctx.stroke();
            }
          }
          glowDot(ctx, sx, sy, 4.2, '#fef1b6', hexA(idx < 4 ? COL_WARM : COL_HOT, 0.9));
        });

        // Vòng tán xạ Cyan mỗi khi electron va chạm phonon
        st.sparks.forEach(sp => {
          sp.life -= dt * 2.5;
          if (sp.life <= 0) return;
          ctx.beginPath();
          ctx.arc(bx + sp.x * mainW, by + sp.y * bh, 4 + (1 - sp.life) * 14, 0, TAU);
          ctx.strokeStyle = hexA(COL_ICE, sp.life * 0.9); ctx.lineWidth = 1.6; ctx.stroke();
        });
        st.sparks = st.sparks.filter(sp => sp.life > 0);
        ctx.restore();

        // Đồng hồ Ampe kế đo tốc độ trôi v_d bên phải buồng
        const mx = bx + mainW + 10, mw = 104, mh = 122, my = by + (bh - mh) * 0.5;
        rr(ctx, mx, my, mw, mh, 8);
        ctx.fillStyle = '#181420'; ctx.fill();
        ctx.strokeStyle = COL_WARM; ctx.lineWidth = 1.4; ctx.stroke();
        const mcx = mx + mw * 0.5, mcy = my + 58, mr = 32;
        ctx.beginPath(); ctx.arc(mcx, mcy, mr, Math.PI * 1.12, Math.PI * 1.88);
        ctx.strokeStyle = '#484554'; ctx.lineWidth = 2.6; ctx.stroke();
        const nTarget = clamp(vd_kms / 800, 0, 1);
        st.needle = (st.needle || 0) + (nTarget - (st.needle || 0)) * Math.min(1, dt * 8);
        const ang = Math.PI * (1.12 + st.needle * 0.76);
        ln(ctx, mcx, mcy, mcx + Math.cos(ang) * (mr - 3), mcy + Math.sin(ang) * (mr - 3), COL_WARM, 2.4);
        dot(ctx, mcx, mcy, 3.2, '#ffffff');
        txt(ctx, 'TỐC ĐỘ TRÔI', mcx, my + 14, '#e8e2d5', 9.2, 'center', 700, MONO);
        txt(ctx, vd_kms.toFixed(0) + ' km/s', mcx, my + 84, COL_WARM, 11.5, 'center', 800, MONO);
        txt(ctx, 'μ=' + mu_cm2.toFixed(0), mcx, my + 104, COL_ICE, 9.5, 'center', 700, MONO);

        txt(ctx, 'Si thật (m* = 0.26 m₀, τ = ' + S.tau.toFixed(2) + ' ps): Va chạm Phonon triệt tiêu Bloch',
          chX + 12, chY + 17, '#e8e2d5', 10.4, 'left', 700, MONO);
        txt(ctx, 'v_d = μE = ' + vd_kms.toFixed(0) + ' km/s', chX + chW - 12, chY + 17, COL_WARM, 10.6, 'right', 700, MONO);

      } else {
        // --- CHẾ ĐỘ 3 (CÂU 3): ĐƯỜNG ĐUA 2 BUỒNG TINH THỂ KHÁC KHỐI LƯỢNG HIỆU DỤNG m* ---
        const gap = 12;
        const laneH = (bh - gap) * 0.5;
        st.raceT = ((st.raceT || 0) + dt * (0.45 + S.Efield * 0.04)) % 2.4;
        const tSim = Math.min(st.raceT, 2.0);
        // m*_A = 0.32 m₀ (nhẹ, gia tốc gấp 4 lần), m*_B = 1.29 m₀ (nặng)
        const uA = 0.12 + clamp(0.76 * (tSim * tSim) / 4.0, 0, 0.76);
        const uB = 0.12 + clamp(0.19 * (tSim * tSim) / 4.0, 0, 0.76);

        const drawRaceLane = (ly, uPos, isFast, lbl, mTxt) => {
          ctx.save();
          rr(ctx, bx, ly, bw, laneH, 6);
          ctx.clip();

          const resW = clamp(Math.round(bw * 0.44), 140, 210);
          const resH = clamp(Math.round(laneH * 0.48), 54, 96);
          renderWaveField(ctx, bx, ly, bw, laneH, resW, resH, (u, v) => {
            const dx = u - uPos, dy = v - 0.5;
            const env = Math.exp(-(dx * dx) / 0.006 - (dy * dy) / 0.085);
            if (env < 0.06) return 0;
            // Gói sóng A rực Inferno (+), Gói sóng B lạnh Cyan (−) dễ phân biệt
            const wave = Math.cos(10 * dx * Math.PI - t * 6);
            return clamp((isFast ? 1 : -1) * env * (0.55 + 0.45 * wave), -1, 1);
          });

          // Lưới nguyên tử nền của từng vật liệu
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 11; c++) {
              drawNucleus(ctx, bx + ((c + 0.5) / 11) * bw, ly + ((r + 0.5) / 3) * laneH, 3.6, 'rgba(255,255,255,0.75)', '#14111c');
            }
          }

          txt(ctx, lbl, bx + 10, ly + 15, isFast ? COL_WARM : COL_ICE, 10.5, 'left', 700, MONO);
          txt(ctx, mTxt, bx + bw - 10, ly + 15, '#fef1b6', 10.2, 'right', 700, MONO);
          ctx.restore();

          rr(ctx, bx, ly, bw, laneH, 6);
          ctx.strokeStyle = isFast ? hexA(COL_WARM, 0.7) : hexA(COL_CYAN, 0.7);
          ctx.lineWidth = 1.4; ctx.stroke();
        };

        drawRaceLane(by, uA, true, 'Tinh thể A (Liên kết mạnh → Nhẹ)', 'm*_A = 0.32 m₀ · Tăng tốc 4×');
        drawRaceLane(by + laneH + gap, uB, false, 'Tinh thể B (Liên kết yếu → Nặng)', 'm*_B = 1.29 m₀ · Chậm hơn 4×');

        txt(ctx, 'Câu 3: Cùng điện trường E = ' + S.Efield + ' kV/cm — Gói sóng nhẹ A bứt tốc gấp 4 lần B!',
          chX + 12, chY + 17, '#e8e2d5', 10.4, 'left', 700, MONO);
        txt(ctx, 'a = qE / m*  |  m*_B / m*_A = 4.0', chX + chW - 12, chY + 17, COL_WARM, 10.6, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 4 — MẠNG SILICON: DẢI HÓA TRỊ ĐẦY & LỖ TRỐNG (+e) (Mục 2.3)
   KHÔNG CÓ BIỂU ĐỒ KHÔNG GIAN k!
   Kính hiển vi 2D trường mật độ electron liên kết Inferno ấm trên lưới Si 6×4:
   - Khi Đầy 100% (0 K): Mọi liên kết sáng ấm rực kín, bật E cũng không có dòng (Ampe kế = 0)
   - Khi Thiếu 1 e⁻ (1 Lỗ trống): Xuất hiện khoang xoáy Ice-Cyan sáng nổi bật; dưới E,
     electron liên kết nhảy ngược chiều E đẩy Lỗ trống (+e) chạy CÙNG CHIỀU E!
   ========================================================================== */
LABS.push({
  id: 'hole', name: 'Mạng Si & Lỗ trống', no: '2.3', secs: [],
  S: { fill: 'oneHole', Edir: 'right' },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Kính hiển vi trường mật độ liên kết Silicon — Dải đầy (I=0) vs Lỗ trống (+e) chạy cùng E',
    area: 'a', anim: true,
    ctrls: [
      { k: 'fill', seg: [['full', 'Đầy 100% (0 K)'], ['oneHole', 'Thiếu 1 e⁻ (1 Lỗ trống)']] },
      { k: 'Edir', seg: [['off', 'E = 0'], ['right', 'Điện trường E →'], ['left', 'Điện trường E ←']] }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const hasHole = S.fill === 'oneHole';
      const eSign = S.Edir === 'right' ? 1 : S.Edir === 'left' ? -1 : 0;

      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32;
      const bx = chX + 26, by = chY + topBar + 6, bw = chW - 148, bh = chH - topBar - 22;

      // Hai bản điện cực đổi cực tính thực tế theo chiều điện trường E
      const leftCol = eSign > 0 ? COL_WARM : eSign < 0 ? COL_CYAN : '#484554';
      const rightCol = eSign > 0 ? COL_CYAN : eSign < 0 ? COL_WARM : '#484554';
      rr(ctx, chX + 10, by + 10, 12, bh - 20, 3);
      ctx.fillStyle = leftCol; ctx.fill();
      txt(ctx, eSign > 0 ? '+' : eSign < 0 ? '−' : '0', chX + 16, by + bh * 0.5, '#0f0c14', 11, 'center', 800, MONO);

      rr(ctx, bx + bw + 4, by + 10, 12, bh - 20, 3);
      ctx.fillStyle = rightCol; ctx.fill();
      txt(ctx, eSign > 0 ? '−' : eSign < 0 ? '+' : '0', bx + bw + 10, by + bh * 0.5, '#0f0c14', 11, 'center', 800, MONO);

      // Quản lý vị trí khoang lỗ trống trên hàng giữa của lưới Si 6×4
      const cols = 6, rows = 4;
      if (st.holeC == null) { st.holeC = 2; st.holeR = 1; st.hopT = 0; st.needle = 0; }
      if (hasHole && eSign !== 0) {
        st.hopT += dt;
        if (st.hopT > 0.62) {
          st.hopT = 0;
          const prevC = st.holeC;
          st.holeC = (st.holeC + eSign + (cols - 1)) % (cols - 1);
          // Electron nhảy từ liên kết mới về lấp liên kết cũ (ngược chiều lỗ trống!)
          st.hopFlash = { fromC: st.holeC, toC: prevC, life: 1.0 };
        }
      }
      if (st.hopFlash) st.hopFlash.life = Math.max(0, st.hopFlash.life - dt * 1.9);

      // Tọa độ chuẩn hóa của tâm liên kết đang chứa lỗ trống
      const holeU = (st.holeC + 1.0) / cols;
      const holeV = (st.holeR + 0.5) / rows;

      ctx.save();
      rr(ctx, bx, by, bw, bh, 6);
      ctx.clip();

      // Render trường mật độ electron liên kết 2D (Inferno ấm khắp mạng, riêng chỗ Lỗ trống là xoáy Ice-Cyan!)
      const resW = clamp(Math.round(bw * 0.45), 130, 200);
      const resH = clamp(Math.round(bh * 0.45), 90, 150);
      const pulse = 0.04 * Math.sin(t * 3.5);
      renderWaveField(ctx, bx, by, bw, bh, resW, resH, (u, v) => {
        const gx = u * cols, gy = v * rows;
        const dx = (gx - Math.floor(gx)) - 0.5;
        const dy = (gy - Math.floor(gy)) - 0.5;
        // Mật độ cộng hóa trị nối dọc và ngang giữa các nguyên tử Si
        const rNode = Math.hypot(dx, dy);
        let dens = Math.exp(-rNode * 2.2) * 0.72 + Math.exp(-Math.abs(dy) * 5.2) * 0.36 + Math.exp(-Math.abs(dx) * 5.2) * 0.36;
        if (hasHole) {
          const dh = Math.hypot((u - holeU) * cols, (v - holeV) * rows);
          if (dh < 0.72) {
            // Tại khoang lỗ trống: đảo sang pha Ice-Cyan lạnh nổi bật!
            const hCore = Math.exp(-dh * 2.6);
            return -clamp(hCore * (1.05 + pulse), 0, 1);
          }
          // Giảm nhẹ vùng rìa để tạo viền nút tối quanh lỗ trống
          dens *= clamp((dh - 0.52) / 0.35, 0.05, 1);
        }
        return clamp(dens * (0.88 + pulse), 0, 1);
      });

      // Mũi tên chỉ đường nhảy của electron (cam, ngược E) và chiều dịch chuyển Lỗ trống (cyan, cùng E)
      if (hasHole && st.hopFlash && st.hopFlash.life > 0.06 && Math.abs(st.hopFlash.fromC - st.hopFlash.toC) === 1) {
        const fx = bx + ((st.hopFlash.fromC + 1.0) / cols) * bw;
        const tx = bx + ((st.hopFlash.toC + 1.0) / cols) * bw;
        const hy = by + holeV * bh;
        ctx.beginPath();
        ctx.moveTo(fx, hy + 12);
        ctx.quadraticCurveTo((fx + tx) * 0.5, hy + 38, tx, hy + 12);
        ctx.strokeStyle = hexA(COL_WARM, st.hopFlash.life); ctx.lineWidth = 2.4; ctx.stroke();
        txt(ctx, 'e⁻ nhảy', (fx + tx) * 0.5, hy + 34, hexA(COL_WARM, st.hopFlash.life), 9.5, 'center', 700, MONO);
      }

      // Lưới 6×4 hạt nhân Silicon trắng viền đen
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          drawNucleus(ctx, bx + ((c + 0.5) / cols) * bw, by + ((r + 0.5) / rows) * bh, 5.2);
        }
      }

      // Vòng đánh dấu lỗ trống (+e) nổi bật
      if (hasHole) {
        const hx = bx + holeU * bw, hy = by + holeV * bh;
        ctx.beginPath(); ctx.arc(hx, hy, 11, 0, TAU);
        ctx.strokeStyle = COL_ICE; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, '+e', hx, hy - 18, COL_ICE, 10.5, 'center', 800, MONO);
      }

      // Mũi tên điện trường E trên đầu buồng
      if (eSign !== 0) {
        const midX = bx + bw * 0.5;
        arrow(ctx, midX - eSign * 48, by + 16, midX + eSign * 48, by + 16, COL_WARM, 2.2);
        txt(ctx, 'E', midX, by + 30, COL_WARM, 10.5, 'center', 800, MONO);
      }
      ctx.restore();

      rr(ctx, bx, by, bw, bh, 6);
      ctx.strokeStyle = '#484554'; ctx.lineWidth = 1.2; ctx.stroke();

      // Đồng hồ Ampe kế đo dòng điện I thực tế bên phải buồng
      const mx = bx + bw + 24, mw = 96, mh = 122, my = by + (bh - mh) * 0.5;
      rr(ctx, mx, my, mw, mh, 8);
      ctx.fillStyle = '#181420'; ctx.fill();
      ctx.strokeStyle = (hasHole && eSign !== 0) ? COL_ICE : '#484554'; ctx.lineWidth = 1.4; ctx.stroke();
      const mcx = mx + mw * 0.5, mcy = my + 58, mr = 30;
      ctx.beginPath(); ctx.arc(mcx, mcy, mr, Math.PI * 1.12, Math.PI * 1.88);
      ctx.strokeStyle = '#484554'; ctx.lineWidth = 2.6; ctx.stroke();
      const curTarget = (hasHole && eSign !== 0) ? (eSign > 0 ? 0.78 : 0.22) : 0.50;
      st.needle += (curTarget - st.needle) * Math.min(1, dt * 8);
      const ang = Math.PI * (1.12 + st.needle * 0.76);
      ln(ctx, mcx, mcy, mcx + Math.cos(ang) * (mr - 3), mcy + Math.sin(ang) * (mr - 3), (hasHole && eSign !== 0) ? COL_ICE : '#888', 2.4);
      dot(ctx, mcx, mcy, 3.2, '#ffffff');
      txt(ctx, 'DÒNG ĐIỆN I', mcx, my + 14, '#e8e2d5', 9, 'center', 700, MONO);
      txt(ctx, (hasHole && eSign !== 0) ? (eSign > 0 ? '+I (→)' : '−I (←)') : 'I = 0',
        mcx, my + 84, (hasHole && eSign !== 0) ? COL_ICE : '#8e8a9c', 11.5, 'center', 800, MONO);
      txt(ctx, hasHole ? '1 lỗ trống' : 'Dải đầy', mcx, my + 104, '#a8a2b8', 9.2, 'center', 600, MONO);

      txt(ctx, hasHole ? 'Khoang xanh (+e): Thiếu 1 e⁻ → e⁻ nhảy ngược E đẩy lỗ trống chạy CÙNG E' : 'Dải hóa trị đầy 100%: Mọi liên kết kín đặc, Σv = 0 ⇒ Dòng I = 0',
        chX + 12, chY + 17, '#e8e2d5', 10.4, 'left', 700, MONO);
      txt(ctx, hasHole ? 'Hành xử như hạt +e, m_p* > 0' : 'Cách điện ở 0 K',
        chX + chW - 12, chY + 17, hasHole ? COL_ICE : COL_WARM, 10.6, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 5 — BÀN LASER QUANG HỌC: GaAs (VÙNG CẤM THẲNG) VS Si (XIÊN) (Câu 5)
   KHÔNG CÓ SƠ ĐỒ PARABOL E-k!
   Bàn thí nghiệm quang học thực tế:
   - Nguồn Laser bước sóng λ (400–1400 nm) bắn bó sóng màu quang phổ thật vào
     phiến tinh thể GaAs (1.42 eV) hoặc Silicon (1.12 eV)
   - hν < E_g → Xuyên thẳng qua phiến trong suốt tới cảm biến bên phải!
   - hν ≥ E_g trên GaAs → Hấp thụ mạnh & phát quang LED đỏ rực rỡ!
   - hν ≥ E_g trên Si → Cần sóng rung Phonon mới hấp thụ & chủ yếu tỏa nhiệt!
   ========================================================================== */
LABS.push({
  id: 'optical', name: 'Laser: GaAs vs Si', no: '2.5', secs: [],
  S: { semi: 'gaas', wl: 780 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Bàn thí nghiệm Laser — Hấp thụ & Phát quang trên GaAs (Thẳng) vs Silicon (Xiên)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'semi', seg: [['gaas', 'GaAs (Thẳng · 1.42eV)'], ['si', 'Silicon (Xiên · 1.12eV)']] },
      { k: 'wl', l: 'Bước sóng λ', min: 400, max: 1400, step: 10, f: v => v + ' nm' },
      { btn: 'Ngưỡng GaAs (873nm)', fn: p => { p.S.semi = 'gaas'; p.S.wl = 870; p.syncCtrls(); queueReact(p.tab, 'wl'); } },
      { btn: 'Ngưỡng Si (1107nm)', fn: p => { p.S.semi = 'si'; p.S.wl = 1100; p.syncCtrls(); queueReact(p.tab, 'wl'); } },
      { btn: 'Xuyên suốt (1300nm)', fn: p => { p.S.wl = 1300; p.syncCtrls(); queueReact(p.tab, 'wl'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const isGaAs = S.semi === 'gaas';
      const Eg = isGaAs ? 1.42 : 1.12;
      const lamMax = 1239.84 / Eg;
      const Eph = 1239.84 / S.wl;
      const absorbed = Eph >= Eg;
      const rgb = wlRGB(S.wl);

      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32;
      const midY = chY + topBar + (chH - topBar) * 0.52;
      const laserX = chX + 22;
      const wafW = Math.min(chW * 0.30, 175), wafH = Math.min(chH - topBar - 58, 210);
      const wafX = chX + chW * 0.44 - wafW * 0.5, wafY = midY - wafH * 0.5;
      const detX = chX + chW - 44;

      if (!st.ph) { st.ph = []; st.em = []; st.phonons = []; st.acc = 0; }

      // 1. Nguồn phát Laser bên trái & Chùm sáng tới
      rr(ctx, laserX, midY - 22, 48, 44, 6);
      ctx.fillStyle = '#1a1624'; ctx.fill();
      ctx.strokeStyle = rgb.css; ctx.lineWidth = 2; ctx.stroke();
      txt(ctx, 'LASER', laserX + 24, midY - 6, rgb.css, 9.5, 'center', 800, MONO);
      txt(ctx, S.wl + 'nm', laserX + 24, midY + 9, '#e8e2d5', 9.2, 'center', 700, MONO);

      const beamH = 18;
      ctx.fillStyle = rgb.rgba(0.28);
      ctx.fillRect(laserX + 48, midY - beamH * 0.5, wafX - (laserX + 48), beamH);

      // Nếu không hấp thụ (hν < E_g) → Tia sáng xuyên thẳng trong suốt sang đầu dò bên phải!
      if (!absorbed) {
        ctx.fillStyle = rgb.rgba(0.26);
        ctx.fillRect(wafX + wafW, midY - beamH * 0.5, detX - (wafX + wafW), beamH);
      }

      // 2. Phiến tinh thể GaAs hoặc Si phóng to có trường mật độ đồng mức bên trong
      ctx.save();
      rr(ctx, wafX, wafY, wafW, wafH, 8);
      ctx.clip();

      const resW = clamp(Math.round(wafW * 0.45), 76, 120);
      const resH = clamp(Math.round(wafH * 0.45), 86, 130);
      const nx = 4, ny = 5;
      const heatBoost = (absorbed && !isGaAs) ? 1.0 : 0.0;
      renderWaveField(ctx, wafX, wafY, wafW, wafH, resW, resH, (u, v) => {
        const gx = u * nx, gy = v * ny;
        const dx = (gx - Math.floor(gx)) - 0.5;
        const dy = (gy - Math.floor(gy)) - 0.5;
        const r = Math.hypot(dx, dy);
        let val = Math.exp(-r * 2.8) * (absorbed ? 0.85 : 0.46);
        if (absorbed) {
          // Tạo điểm kích thích cặp e⁻ (Inferno) / h⁺ (Cyan) sôi động trong phiến!
          const w = Math.sin(u * 10 - t * 4.2) * Math.cos(v * 9 + t * 3.1);
          val = val * (isGaAs ? (0.4 + 0.85 * w) : (0.55 + 0.5 * w));
        }
        return clamp(val, -1, 1);
      });

      // Các nút nguyên tử bên trong phiến (Si rung mạnh khi có phonon!)
      for (let r = 0; r < ny; r++) {
        for (let c = 0; c < nx; c++) {
          const vib = heatBoost ? 2.6 : 0.5;
          const ax = wafX + ((c + 0.5) / nx) * wafW + Math.sin(t * 18 + r * 3 + c) * vib;
          const ay = wafY + ((r + 0.5) / ny) * wafH + Math.cos(t * 19 + c * 4 + r) * vib;
          const isGa = isGaAs && ((r + c) % 2 === 0);
          drawNucleus(ctx, ax, ay, 4.4, isGa ? '#fef1b6' : '#ffffff', '#14111c');
        }
      }
      ctx.restore();

      rr(ctx, wafX, wafY, wafW, wafH, 8);
      ctx.strokeStyle = absorbed ? (isGaAs ? COL_HOT : COL_CYAN) : '#4d485c';
      ctx.lineWidth = 2; ctx.stroke();
      txt(ctx, isGaAs ? 'GaAs (Thẳng · 1.42 eV)' : 'Silicon (Xiên · 1.12 eV)',
        wafX + wafW * 0.5, wafY - 12, isGaAs ? COL_WARM : COL_ICE, 10.8, 'center', 700, MONO);

      // 3. Bắn từng xung photon laser thực tế
      st.acc += dt * 7.5;
      while (st.acc >= 1) {
        st.acc -= 1;
        if (st.ph.length < 22) st.ph.push({ x: laserX + 48, y: midY + rnd(-5, 5) });
      }
      for (let i = st.ph.length - 1; i >= 0; i--) {
        const ph = st.ph[i];
        ph.x += dt * 210;
        // Bó sóng photon màu thật
        ctx.beginPath();
        for (let s = -12; s <= 12; s += 2) {
          const wy = Math.sin(s * 0.65 - t * 26) * 4.5 * Math.exp(-(s * s) / 80);
          s === -12 ? ctx.moveTo(ph.x + s, ph.y + wy) : ctx.lineTo(ph.x + s, ph.y + wy);
        }
        ctx.strokeStyle = rgb.css; ctx.lineWidth = 2.2; ctx.stroke();
        glowDot(ctx, ph.x, ph.y, 3.6, '#ffffff', rgb.rgba(0.9));

        if (absorbed && ph.x >= wafX + rnd(18, wafW * 0.65)) {
          if (isGaAs) {
            // GaAs: Tái hợp trực tiếp phát quang LED rực rỡ ra mọi hướng!
            const a = rnd(0, TAU);
            st.em.push({ x: ph.x, y: ph.y, vx: Math.cos(a) * 115, vy: Math.sin(a) * 115, life: 1.0 });
          } else {
            // Silicon: Phát vòng sóng nhiệt Phonon làm nóng tinh thể!
            st.phonons.push({ x: ph.x, y: ph.y, life: 1.0 });
          }
          st.ph.splice(i, 1);
        } else if (ph.x >= detX) {
          st.ph.splice(i, 1);
        }
      }

      // Vẽ tia LED phát xạ từ GaAs
      for (let i = st.em.length - 1; i >= 0; i--) {
        const e = st.em[i];
        e.life -= dt * 1.2;
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.life <= 0) { st.em.splice(i, 1); continue; }
        glowDot(ctx, e.x, e.y, 5, '#fef1b6', hexA(COL_HOT, e.life));
      }

      // Vẽ gợn sóng nhiệt Phonon trong Silicon
      for (let i = st.phonons.length - 1; i >= 0; i--) {
        const pn = st.phonons[i];
        pn.life -= dt * 1.4;
        if (pn.life <= 0) { st.phonons.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(pn.x, pn.y, 6 + (1 - pn.life) * 34, 0, TAU);
        ctx.strokeStyle = hexA(COL_ICE, pn.life * 0.85); ctx.lineWidth = 1.8; ctx.stroke();
      }

      // 4. Cảm biến truyền qua bên phải & Trạng thái phát quang / tỏa nhiệt
      rr(ctx, detX, midY - 36, 26, 72, 5);
      ctx.fillStyle = '#1a1624'; ctx.fill();
      ctx.strokeStyle = !absorbed ? rgb.css : '#484554'; ctx.lineWidth = 1.8; ctx.stroke();
      if (!absorbed) glowDot(ctx, detX + 13, midY, 8, '#ffffff', rgb.rgba(0.9));
      txt(ctx, 'ĐẦU DÒ', detX + 13, midY - 48, '#e8e2d5', 9, 'center', 700, MONO);
      txt(ctx, absorbed ? '0%' : '100%', detX + 13, midY + 48, absorbed ? '#8e8a9c' : rgb.css, 10.5, 'center', 800, MONO);

      const footMsg = !absorbed
        ? 'hν < E_g → Phiến tinh thể TRONG SUỐT, tia Laser xuyên thẳng 100% tới đầu dò!'
        : isGaAs
          ? 'GaAs (Vùng cấm thẳng): Hấp thụ trực tiếp & tái hợp PHÁT QUANG LED cực mạnh!'
          : 'Silicon (Vùng cấm xiên): Cần thêm Phonon rung mạng → chủ yếu TỎA NHIỆT, không làm LED!';
      txt(ctx, footMsg, chX + chW * 0.5, chY + chH - 14, !absorbed ? COL_ICE : COL_WARM, 10.4, 'center', 700, MONO);

      txt(ctx, 'λ = ' + S.wl + ' nm  →  hν = ' + Eph.toFixed(2) + ' eV  |  λ_max(' + (isGaAs ? 'GaAs' : 'Si') + ') = ' + lamMax.toFixed(0) + ' nm',
        chX + 12, chY + 17, '#e8e2d5', 10.5, 'left', 700, MONO);
      txt(ctx, absorbed ? 'BỊ HẤP THỤ' : 'XUYÊN QUA (TRONG SUỐT)',
        chX + chW - 12, chY + 17, absorbed ? COL_WARM : COL_ICE, 10.6, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 6 — LÒ NHIỆT 3 VẬT LIỆU & HỘP LƯỢNG TỬ THỐNG KÊ (Mục 2.5, 3.1, 3.2)
   KHÔNG CÓ BIỂU ĐỒ g(E), f_F(E)!
   - Chế độ 1 ("Lò nhiệt 3 vật liệu"): Kim loại (Cu) · Bán dẫn (Si) · Cách điện
     đặt trên thanh điện trở gia nhiệt (0 K → 600 K), bên trong phiến là trường
     hạt dẫn thực tế + Ampe kế kim cơ đo dòng dẫn!
   - Chế độ 2 ("Hộp Pauli: FD vs BE vs MB"): 3 hộp ngăn lượng tử đặt song song
     chứa hạt thực tế nhảy theo nhiệt độ T — thấy ngay nguyên lý Pauli (tối đa
     1 hạt/ô ở FD) vs ngưng tụ Bose (tụ đám đông ở ngăn đáy BE)!
   ========================================================================== */
LABS.push({
  id: 'fermi', name: 'Lò nhiệt & Hộp Pauli', no: '3.1–3.2', secs: [3],
  S: { mode: 'furnace', T: 300 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Lò nhiệt Kim loại / Bán dẫn / Cách điện & 3 Hộp bẫy lượng tử (FD · BE · MB)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['furnace', 'Lò nhiệt 3 vật liệu'], ['box', '3 Hộp lượng tử (FD / BE / MB)']] },
      { k: 'T', l: 'Nhiệt độ T', min: 0, max: 600, step: 20, f: v => v + ' K' },
      { btn: '0 K (Đóng băng)', fn: p => { p.S.T = 0; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: '300 K (Phòng)', fn: p => { p.S.T = 300; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: '600 K (Nóng đỏ)', fn: p => { p.S.T = 600; p.syncCtrls(); queueReact(p.tab, 'T'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, T = S.T;
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32;
      const heat = clamp(T / 600, 0, 1);

      if (S.mode === 'furnace') {
        // --- CHẾ ĐỘ 1: LÒ GIA NHIỆT 3 PHIẾN TINH THỂ THỰC (CU · SI · KIM CƯƠNG) ---
        const gap = 12;
        const colW = (chW - 24 - gap * 2) / 3;
        const wafY = chY + topBar + 22;
        const coilH = 30, meterH = 68;
        const wafH = Math.max(82, chH - topBar - 22 - meterH - coilH - 22);

        if (!st.pts) {
          st.pts = Array.from({ length: 24 }, () => ({ u: rnd(0.06, 0.94), v: rnd(0.10, 0.90), sp: rnd(0.25, 0.55) }));
          st.needles = [0, 0, 0];
        }

        const specs = [
          { name: 'KIM LOẠI (Cu)', sub: 'Không có vùng cấm', col: COL_WARM, cond: 0.92, nFlow: 24, hasHole: false },
          { name: 'BÁN DẪN (Si)', sub: 'E_g = 1.12 eV', col: COL_ICE, cond: T < 60 ? 0 : clamp(Math.pow((T - 40) / 560, 1.45), 0, 0.72), nFlow: T < 60 ? 0 : Math.min(18, Math.floor(Math.pow(T / 150, 1.5))), hasHole: true },
          { name: 'CÁCH ĐIỆN (C)', sub: 'E_g = 5.50 eV', col: COL_MAG, cond: 0.0, nFlow: 0, hasHole: false }
        ];

        specs.forEach((sp, si) => {
          const x0 = chX + 12 + si * (colW + gap);
          txt(ctx, sp.name, x0 + colW * 0.5, chY + topBar + 6, sp.col, 10.8, 'center', 700, MONO);

          // Hai bản điện cực kẹp phiến
          const ew = 8;
          rr(ctx, x0, wafY + 8, ew, wafH - 16, 2);
          ctx.fillStyle = COL_CYAN; ctx.fill();
          rr(ctx, x0 + colW - ew, wafY + 8, ew, wafH - 16, 2);
          ctx.fillStyle = COL_WARM; ctx.fill();

          // Phiến vật liệu thực tế
          const wx = x0 + ew + 2, ww = colW - (ew + 2) * 2;
          ctx.save();
          rr(ctx, wx, wafY, ww, wafH, 5);
          ctx.clip();

          // Nền nhiệt mật độ Inferno ấm ở Kim loại, dịu tối ở Si khi lạnh & tối đen ở Cách điện
          const gBg = ctx.createRadialGradient(wx + ww * 0.5, wafY + wafH * 0.5, 4, wx + ww * 0.5, wafY + wafH * 0.5, ww * 0.75);
          gBg.addColorStop(0, hexA(sp.col, 0.14 + sp.cond * 0.24));
          gBg.addColorStop(1, NIGHT_BG);
          ctx.fillStyle = gBg;
          ctx.fillRect(wx, wafY, ww, wafH);

          // Lưới nguyên tử rung theo T
          const vib = heat * 2.4;
          for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
              const ax = wx + ((c + 0.5) / 4) * ww + Math.sin(t * 14 + r * 3 + c) * vib;
              const ay = wafY + ((r + 0.5) / 4) * wafH + Math.cos(t * 15 + c * 4 + r) * vib;
              drawNucleus(ctx, ax, ay, 3.0, 'rgba(255,255,255,0.6)', '#14111c');
            }
          }

          // Hạt tải trôi thực tế (Electron Inferno → phải, Lỗ trống Cyan → trái)
          for (let i = 0; i < sp.nFlow; i++) {
            const pt = st.pts[i];
            const ux = ((pt.u + t * pt.sp * (si === 0 ? 0.55 : 0.35)) % 1 + 1) % 1;
            glowDot(ctx, wx + ux * ww, wafY + pt.v * wafH, 3.4, '#fef1b6', hexA(COL_WARM, 0.9));
            if (sp.hasHole) {
              const hx = ((1 - pt.u - t * pt.sp * 0.25) % 1 + 1) % 1;
              glowDot(ctx, wx + hx * ww, wafY + (1 - pt.v) * wafH, 3.4, '#dafefe', hexA(COL_CYAN, 0.9));
            }
          }
          ctx.restore();

          rr(ctx, wx, wafY, ww, wafH, 5);
          ctx.strokeStyle = hexA(sp.col, 0.65); ctx.lineWidth = 1.4; ctx.stroke();

          // Ampe kế đo độ dẫn ngay dưới mỗi phiến
          const my = wafY + wafH + 8;
          rr(ctx, x0, my, colW, meterH, 6);
          ctx.fillStyle = '#181420'; ctx.fill();
          ctx.strokeStyle = '#3c3945'; ctx.lineWidth = 1.2; ctx.stroke();

          const mcx = x0 + colW * 0.5, mcy = my + 34, mr = 22;
          ctx.beginPath(); ctx.arc(mcx, mcy, mr, Math.PI * 1.12, Math.PI * 1.88);
          ctx.strokeStyle = '#484554'; ctx.lineWidth = 2.5; ctx.stroke();
          st.needles[si] += (sp.cond - st.needles[si]) * Math.min(1, dt * 7);
          const ang = Math.PI * (1.12 + st.needles[si] * 0.76);
          ln(ctx, mcx, mcy, mcx + Math.cos(ang) * (mr - 3), mcy + Math.sin(ang) * (mr - 3), sp.col, 2.2);
          dot(ctx, mcx, mcy, 2.8, '#ffffff');
          txt(ctx, sp.sub, mcx, my + 48, '#e8e2d5', 9.2, 'center', 700, MONO);
          const stTxt = si === 0 ? 'Dẫn mạnh mọi T' : si === 1 ? (T < 60 ? 'Cách điện (0 K)' : 'Dẫn tăng theo T') : 'Không dẫn điện';
          txt(ctx, stTxt, mcx, my + 60, sp.col, 9, 'center', 700, MONO);
        });

        // Thanh điện trở gia nhiệt nóng đỏ ở đáy lò
        const cyCoil = chY + chH - 16;
        ctx.beginPath();
        for (let i = 0; i <= 28; i++) {
          const cx = chX + 24 + (i / 28) * (chW - 48);
          const cy = cyCoil + (i % 2 === 0 ? -5 : 5);
          i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
        }
        ctx.strokeStyle = heat > 0.2 ? hexA(COL_HOT, 0.35 + heat * 0.65) : hexA(COL_CYAN, 0.55);
        ctx.lineWidth = 2.6; ctx.stroke();

        txt(ctx, 'Lò nhiệt T = ' + T + ' K (kT = ' + (KB * T * 1000).toFixed(1) + ' meV)',
          chX + 12, chY + 17, '#e8e2d5', 10.6, 'left', 700, MONO);
        txt(ctx, 'Vàng: e⁻ dẫn  ·  Cyan: Lỗ trống h⁺', chX + chW - 12, chY + 17, COL_WARM, 10.6, 'right', 700, MONO);

      } else {
        // --- CHẾ ĐỘ 2: 3 HỘP BẪY LƯỢNG TỬ SO SÁNH FERMI–DIRAC · BOSE–EINSTEIN · BOLTZMANN ---
        const gap = 12;
        const boxW = (chW - 24 - gap * 2) / 3;
        const boxY = chY + topBar + 10, boxH = chH - topBar - 24;
        const nLevels = 10; // 10 tầng năng lượng từ đáy (0) lên đỉnh (9)
        const efLevel = 4;  // Mực Fermi nằm ngay giữa tầng 4 và 5

        // Phân bố số hạt thực tế trên từng tầng (tổng 10 hạt mỗi hộp) thay đổi sống động theo T!
        const fracHot = clamp(T / 600, 0, 1);
        // 1. Fermi–Dirac: tối đa 2 hạt (↑↓) mỗi tầng! 0K xếp phẳng tầng 0..4; nóng lên nhảy sang 5..7 để lại lỗ Cyan ở 3..4!
        const fdOcc = [2, 2, 2, 2, 2, 0, 0, 0, 0, 0];
        if (T >= 120) { fdOcc[4] = 1; fdOcc[5] = 1; }
        if (T >= 300) { fdOcc[4] = 0; fdOcc[5] = 1; fdOcc[6] = 1; }
        if (T >= 480) { fdOcc[3] = 1; fdOcc[5] = 2; fdOcc[7] = 1; fdOcc[6] = 1; fdOcc[4] = 1; }

        // 2. Bose–Einstein: KHÔNG có trần Pauli! Lạnh thì toàn bộ 10 hạt tụ đám đông ở tầng đáy 0!
        const beOcc = T < 80 ? [10, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          : T < 260 ? [7, 2, 1, 0, 0, 0, 0, 0, 0, 0]
          : T < 460 ? [5, 2, 2, 1, 0, 0, 0, 0, 0, 0]
          : [3, 2, 2, 1, 1, 1, 0, 0, 0, 0];

        // 3. Maxwell–Boltzmann: Cổ điển, lạnh rơi hết xuống đáy, nóng tản rộng dần lên trên
        const mbOcc = T < 80 ? [10, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          : T < 260 ? [5, 3, 2, 0, 0, 0, 0, 0, 0, 0]
          : T < 460 ? [3, 2, 2, 1, 1, 1, 0, 0, 0, 0]
          : [2, 2, 1, 1, 1, 1, 1, 1, 0, 0];

        const boxes = [
          { name: 'FERMI–DIRAC (e⁻)', note: 'Trần Pauli: tối đa 2 (↑↓)/tầng', occ: fdOcc, col: COL_WARM, pauli: true },
          { name: 'BOSE–EINSTEIN', note: 'Thích tụ đám đông ở đáy', occ: beOcc, col: COL_ICE, pauli: false },
          { name: 'BOLTZMANN (Cổ điển)', note: 'Không bị Pauli · Khớp FD ở cao', occ: mbOcc, col: COL_MAG, pauli: false }
        ];

        boxes.forEach((bxObj, bi) => {
          const x0 = chX + 12 + bi * (boxW + gap);
          rr(ctx, x0, boxY, boxW, boxH, 8);
          ctx.fillStyle = '#16121e'; ctx.fill();
          ctx.strokeStyle = hexA(bxObj.col, 0.6); ctx.lineWidth = 1.4; ctx.stroke();

          txt(ctx, bxObj.name, x0 + boxW * 0.5, boxY + 15, bxObj.col, 10.5, 'center', 700, MONO);

          const padTop = 30, padBot = 26;
          const lvlH = (boxH - padTop - padBot) / nLevels;

          // Vẽ 10 ngăn lượng tử từ dưới (lv=0) lên trên (lv=9)
          for (let lv = 0; lv < nLevels; lv++) {
            const ly = boxY + boxH - padBot - (lv + 1) * lvlH;
            ln(ctx, x0 + 10, ly + lvlH, x0 + boxW - 10, ly + lvlH, '#2e293b', 1);

            const cnt = bxObj.occ[lv];
            const cy = ly + lvlH * 0.5;
            if (bxObj.pauli) {
              // Hộp Pauli có đúng 2 ô (↑ và ↓) mỗi tầng
              for (let slot = 0; slot < 2; slot++) {
                const sx = x0 + boxW * (slot === 0 ? 0.36 : 0.64);
                const filled = slot < cnt;
                if (filled) {
                  glowDot(ctx, sx, cy, 6.2, '#fef1b6', hexA(COL_WARM, 0.9));
                  txt(ctx, slot === 0 ? '↑' : '↓', sx, cy + 0.5, '#0f0c14', 9.5, 'center', 800, MONO);
                } else if (lv <= efLevel) {
                  // Lỗ trống Cyan khi hạt dưới E_F nhảy lên trên!
                  ctx.beginPath(); ctx.arc(sx, cy, 5.8, 0, TAU);
                  ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.8; ctx.stroke();
                } else {
                  ctx.beginPath(); ctx.arc(sx, cy, 4.5, 0, TAU);
                  ctx.strokeStyle = '#3a344a'; ctx.lineWidth = 1.1; ctx.stroke();
                }
              }
            } else {
              // BE & MB: cho phép nhiều hạt chen chúc cùng 1 tầng!
              for (let k = 0; k < cnt; k++) {
                const spread = cnt === 1 ? 0 : (k / (cnt - 1) - 0.5) * Math.min(boxW - 34, cnt * 14);
                const jx = Math.sin(t * (3 + fracHot * 5) + k * 2 + lv) * (1.2 + fracHot * 2);
                glowDot(ctx, x0 + boxW * 0.5 + spread + jx, cy, 5.2, '#ffffff', hexA(bxObj.col, 0.9));
              }
            }
          }

          // Mực Fermi E_F trên hộp Fermi–Dirac
          if (bxObj.pauli) {
            const yEf = boxY + boxH - padBot - (efLevel + 1) * lvlH;
            ln(ctx, x0 + 6, yEf, x0 + boxW - 6, yEf, COL_WARM, 1.8, [5, 3]);
            txt(ctx, 'E_F', x0 + boxW - 12, yEf - 8, COL_WARM, 9.5, 'right', 800, MONO);
          }

          txt(ctx, bxObj.note, x0 + boxW * 0.5, boxY + boxH - 12, '#c8c2d6', 9.2, 'center', 600);
        });

        txt(ctx, '3 Hộp lượng tử ở T = ' + T + ' K (kT = ' + (KB * T * 1000).toFixed(1) + ' meV)',
          chX + 12, chY + 17, '#e8e2d5', 10.6, 'left', 700, MONO);
        txt(ctx, 'Tầng cao (E − E_F ≥ 3kT): Mật độ thưa → FD khớp Boltzmann (< 5%)',
          chX + chW - 12, chY + 17, COL_WARM, 10.4, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM (Log intro + react chi tiết cho cả 6 tab Buổi 4)
   ========================================================================== */
const LD = {};

LD.overlap = {
  intro: [
    ['i', 'Khi hai nguyên tử tiến lại gần nhau, đám mây hàm sóng chồng lấn tạo 2 trạng thái lượng tử có năng lượng khác nhau (E₀ − Δ và E₀ + Δ).'],
    ['w', 'Màu cam-vàng ấm biểu thị pha dương (+ψ), màu xanh ngọc biểu thị pha âm (−ψ). Ở tổ hợp Liên kết (ψA+ψB), xác suất dồn vào giữa 2 hạt nhân trắng làm hạ năng lượng!'],
    ['w', 'Ở tổ hợp Phản liên kết (ψA−ψB), hai đám mây ngược pha triệt tiêu nhau tạo mặt nút nét đứt xanh (ψ = 0) ở giữa, đẩy electron ra xa nên năng lượng tăng cao!'],
    ['v', 'Kéo thanh "Khoảng cách d" hoặc chuyển sang "Chuỗi N nguyên tử" để quan sát trực tiếp trường sóng 2D phân tầng trên cả chuỗi nguyên tử!']
  ],
  react(S, k, P, say) {
    const delta = 2.4 * Math.exp(-(S.dist - 1.7) / 0.88);
    if (S.view === 'chain') {
      const N = Math.round(S.N), kn = Math.round(S.nodes);
      const eRel = -2 * Math.cos(((kn + 1) * Math.PI) / (N + 1));
      say('v', `Chuỗi N = ${N} nguyên tử, trạng thái ${kn} nút: Xuất hiện ${kn} mặt nút nét đứt xanh cắt ngang chuỗi, E − E₀ = ${eRel >= 0 ? '+' : ''}${eRel.toFixed(2)}t.`);
    } else {
      say('v', `Khoảng cách d = ${S.dist.toFixed(2)} Å → Cầu mật độ chồng lấn tạo độ tách năng lượng 2Δ = ${(2 * delta).toFixed(2)} eV.`);
    }
  }
};

LD.bloch = {
  intro: [
    ['i', 'Định lý Bloch: Hàm sóng electron trong tinh thể tuần hoàn có dạng ψ_k(r) = e^{ikx}·u_k(r) — sóng phẳng điều biến biên độ tuần hoàn theo từng nguyên tử!'],
    ['w', 'Quan sát 3 tấm mạng 6×6: Khi k = 0, cả 36 nguyên tử dao động cùng pha cam ấm; khi tăng k, xuất hiện các dải sọc cam (+) và xanh ngọc (−) xen kẽ bởi các rãnh đen (mặt nút).'],
    ['w', 'Tại biên Bragg k = π/a, sóng đứng ψ₊ = cos(πx/a) dồn thẳng lên các hạt nhân trắng (năng lượng thấp E₋), còn ψ₋ = sin(πx/a) dồn vào khe giữa 2 hàng nguyên tử (E₊ cao) → mở vùng cấm E_g!'],
    ['v', 'Bấm "Sóng đứng Bragg (k=π/a)" để soi trực tiếp nguyên nhân tạo vùng cấm, hoặc kéo P′ = 12 (Câu 1 & Câu 2) xem khe E_g = 3.16 eV!']
  ],
  react(S, k, P, say) {
    const bands = solveKPBands(S.P);
    const uToEv = u => HBAR2_2ME_EV_A2 * (u * u) / (S.a * S.a);
    const eg1 = uToEv(bands[1].lo) - uToEv(bands[0].hi);
    if (S.view === 'bragg') {
      say('w', `Sóng đứng Bragg tại k = π/a (λ = 2a): ψ₊ ngồi ngay trên hạt nhân dương (thế năng thấp), ψ₋ tránh hạt nhân (thế năng cao) → Mở khe vùng cấm E_g = ${eg1.toFixed(2)} eV.`);
    } else {
      say('v', `Mạng tinh thể 6×6 (P′ = ${S.P.toFixed(1)}, k = ${S.kFrac.toFixed(2)}π/a): Dải 1 từ ${uToEv(bands[0].lo).toFixed(2)} đến ${uToEv(bands[0].hi).toFixed(2)} eV, khe E_g = ${eg1.toFixed(2)} eV.`);
    }
  }
};

LD.crystal = {
  intro: [
    ['i', 'Trong tinh thể lý tưởng không tán xạ (τ = ∞), dưới điện trường đều E, gói sóng electron 2D không chạy mãi mà nén bước sóng tới ngưỡng Bragg rồi BỊ PHANH NGƯỢC (m* < 0) và dao động qua lại (Dao động Bloch)!'],
    ['w', 'Trong Silicon thật ở 300 K (τ ≈ 0.2 ps), electron liên tục va chạm tán xạ với dao động nhiệt mạng (vòng lóe cyan) nên không kịp tới Bragg mà trôi đều với vận tốc v_d = μE!'],
    ['v', 'Chuyển sang "Đua m* (Câu 3)" để xem hai gói sóng 2D đồng mức cùng xuất phát dưới 1 điện trường E: Hạt nhẹ A (0.32 m₀) bỏ xa hạt nặng B (1.29 m₀) đúng 4 lần!']
  ],
  react(S, k, P, say) {
    if (S.mode === 'race') {
      say('v', 'Câu 3: Cùng lực điện qE, gói sóng trong tinh thể A (m* = 0.32 m₀) có gia tốc a = qE/m* lớn gấp 4 lần tinh thể B (m* = 1.29 m₀).');
    } else if (S.mode === 'bloch') {
      const TB = (H_PL / (EV * S.Efield * 1e7 * 5.43e-10)) * 1e12;
      say('v', `Dao động Bloch (E = ${S.Efield} kV/cm): Khi bước sóng nội tại của gói sóng 2D nén bằng 2a, phản xạ Bragg đảo chiều chuyển động (chu kỳ T_B ≈ ${TB.toFixed(2)} ps).`);
    } else {
      const mu = ((EV * S.tau * 1e-12) / (0.26 * ME)) * 1e4;
      const vd = ((mu * 1e-4) * (S.Efield * 1e5)) / 1000;
      say('v', `Tán xạ Phonon (τ = ${S.tau.toFixed(2)} ps): Độ linh động μ = ${mu.toFixed(0)} cm²/V·s → tốc độ trôi đều v_d = ${vd.toFixed(0)} km/s.`);
    }
  }
};

LD.hole = {
  intro: [
    ['i', 'Kính hiển vi trường mật độ liên kết Silicon: Màu cam-vàng ấm là biển electron hóa trị dày đặc bao bọc quanh các hạt nhân trắng.'],
    ['w', 'Khi dải hóa trị đầy 100% (0 K), mọi liên kết kín đặc nên bật điện trường E cũng không có dòng điện (kim Ampe kế đứng im ở I = 0).'],
    ['w', 'Khi mất 1 electron, một khoang xoáy xanh-cyan (+e) xuất hiện: dưới điện trường E, từng electron kế bên nhảy lấp sang ngược chiều E đẩy Lỗ trống chạy CÙNG CHIỀU E!'],
    ['v', 'Thử đảo chiều điện trường "E →" và "E ←" để xem chiều nhảy của electron cam, chiều chạy của Lỗ trống cyan và kim Ampe kế đảo chiều theo!']
  ],
  react(S, k, P, say) {
    if (S.fill === 'full') {
      say('w', 'Liên kết đầy 100% (Dải đầy): Không có chỗ trống cho electron dịch chuyển, mọi vận tốc triệt tiêu nhau ⇒ I = 0.');
    } else if (S.Edir === 'off') {
      say('i', 'Đã tắt điện trường (E = 0): Lỗ trống đứng yên tại liên kết, dòng điện tổng I = 0.');
    } else {
      say('v', `Điện trường E hướng ${S.Edir === 'right' ? 'sang PHẢI (→)' : 'sang TRÁI (←)'}: Electron liên kết nhảy ngược chiều E làm khoang Lỗ trống (+e) chạy CÙNG CHIỀU E!`);
    }
  }
};

LD.optical = {
  intro: [
    ['i', 'Bàn thí nghiệm Laser kiểm chứng Câu 5: Năng lượng mỗi photon là hν = 1240 / λ[nm]. Tinh thể chỉ hấp thụ được ánh sáng khi hν ≥ E_g!'],
    ['w', 'GaAs (vùng cấm thẳng, E_g = 1.42 eV, λ_max = 873 nm): Hấp thụ trực tiếp cực mạnh và tái hợp phát quang LED rực rỡ.'],
    ['w', 'Silicon (vùng cấm xiên, E_g = 1.12 eV, λ_max = 1107 nm): Cần ghép thêm rung động mạng (sóng Phonon xanh cyan) nên chủ yếu tỏa nhiệt, không làm được LED!'],
    ['v', 'Bấm "Xuyên suốt (1300nm)" để thấy tia laser xuyên thẳng 100% qua cả GaAs lẫn Silicon như qua tấm kính trong suốt!']
  ],
  react(S, k, P, say) {
    const isGaAs = S.semi === 'gaas';
    const Eg = isGaAs ? 1.42 : 1.12;
    const Eph = 1239.84 / S.wl;
    const abs = Eph >= Eg;
    say('v', `${isGaAs ? 'GaAs (1.42 eV)' : 'Silicon (1.12 eV)'}, Laser λ = ${S.wl} nm (hν = ${Eph.toFixed(2)} eV): ${abs ? (isGaAs ? 'HẤP THỤ & PHÁT QUANG LED!' : 'HẤP THỤ NHỜ PHONON (TỎA NHIỆT)!') : 'TRONG SUỐT (Xuyên thẳng 100%)!'}`);
  }
};

LD.fermi = {
  intro: [
    ['i', 'Lò nhiệt đặt song song 3 phiến vật liệu thực (Kim loại Cu · Bán dẫn Si · Cách điện Kim cương) cho thấy khác biệt bản chất của vùng cấm E_g khi tăng T!'],
    ['w', 'Kim loại có biển electron tự do dẫn mạnh ở mọi T; Silicon cách điện ở 0 K nhưng dẫn mạnh dần khi nóng lên; Kim cương (5.5 eV) vẫn cách điện hoàn toàn.'],
    ['w', 'Chuyển sang "3 Hộp lượng tử (FD / BE / MB)" để so sánh trực tiếp quy tắc xếp hạt: Electron tuân theo Pauli (tối đa 2 spin ↑↓ mỗi tầng, tạo biển Fermi lên tới E_F) khác hẳn Boson tụ đám đông ở đáy!'],
    ['v', 'Kéo nhiệt độ T từ 0 K lên 600 K ở cả hai chế độ để quan sát sự kích thích nhiệt quanh mực Fermi E_F!']
  ],
  react(S, k, P, say) {
    if (S.mode === 'furnace') {
      say('v', `Lò nhiệt T = ${S.T} K (kT = ${(KB * S.T * 1000).toFixed(1)} meV): Kim loại dẫn ổn định; Silicon ${S.T < 60 ? 'đóng băng cách điện' : 'sinh nhiều cặp e⁻ (vàng) & h⁺ (cyan)'}; Kim cương vẫn tối đen.`);
    } else {
      say('v', `3 Hộp lượng tử ở T = ${S.T} K: Hộp Fermi–Dirac bị chặn bởi nguyên lý Pauli (tối đa ↑↓/tầng), chỉ các hạt sát E_F mới bật lên tầng trên để lại lỗ trống cyan!`);
    }
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
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'overlap';

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
  [/^1\.1/, 'overlap', 0],
  [/^1\.[2345]/, 'bloch', 0],
  [/^2\.1/, 'crystal', 0],
  [/^2\.2/, 'crystal', 0],
  [/^2\.3/, 'hole', 0],
  [/^2\.4/, 'crystal', 0],
  [/^2\.5/, 'optical', 0],
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