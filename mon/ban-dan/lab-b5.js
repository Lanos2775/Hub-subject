/* ==========================================================================
   lab-b5.js — PHÒNG THÍ NGHIỆM BÁN DẪN CÂN BẰNG BUỔI 5 (Tự Chứa)
   - Tuân thủ 100% Rule-lab.md: TUYỆT ĐỐI KHÔNG BIỂU ĐỒ, KHÔNG TRỤC TỌA ĐỘ,
     KHÔNG SƠ ĐỒ KHỐI DẢI NĂNG LƯỢNG TRỪU TƯỢNG!
   - Thẩm mỹ đồng bộ hoàn toàn với lab-b4 & lab-b6: kính hiển vi lượng tử 2D
     phân tầng đồng mức Inferno (biển e⁻ / pha dương) & Ice-Cyan (lỗ trống /
     pha âm) trên nền đêm #0f0c14, hạt nhân trắng viền đen, đồng hồ kim cơ
     và màu viền/chữ đồng bộ 100% biến CSS của trang web.
   - 7 phòng thí nghiệm vật lý thực phủ trọn lý thuyết Mục 1–3 Buổi 5:
       1. Mật độ n₀, p₀       : Kính hiển vi cân bằng nhiệt theo E_F, T & vật liệu (Si · GaAs · Ge)
       2. Đứt liên kết (2.1)  : 3 giai đoạn (0 K → Đứt liên kết → Nhảy lỗ trống) & Kính hiển vi động
       3. Nội tại & E_Fi      : 3 buồng Ge / Si / GaAs so sánh nᵢ(T) & Cân bằng ghế N_c vs N_v (ΔE_Fi)
       4. Donor & Acceptor    : 3 khung Si thuần | Donor P (Loại n) | Acceptor B (Loại p) & thăm dò E
       5. Bohr mở rộng (3.4)  : 3 khung cùng tỉ lệ 1 nm (H · Donor P · Acceptor B) & Tinh chỉnh ε_r, m*
       6. Khối Si 100 nm (3.5): Đếm hạt thực trong 10⁻¹⁵ cm³ (5×10⁷ Si): Thuần vs 10¹⁶ / 10¹⁷ / 10¹⁸
       7. Pha tạp GaAs (3.6)  : Kính hiển vi mạng III–V (Ga–As), thế chỗ Ga/As & Tạp chất lưỡng tính
   - API: LabB5.open(tabId?, panelIndex?)  LabB5.close()  LabB5.mark(root)  LabB5.tabs()
   ========================================================================== */
(function () {
'use strict';

/* ---------- Hằng số vật lý chuẩn Buổi 5 & tiện ích toán học ---------- */
const TAU = Math.PI * 2;
const Q_EL = 1.6021766e-19; // C
const KT300 = 0.0259;       // eV ở 300 K (theo chuẩn bài học Buổi 5)
const A0_BOHR = 0.53;       // Å (bán kính Bohr hydro)
const EH_EV = 13.6;         // eV (năng lượng liên kết hydro)

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const rnd = (a, b) => a + Math.random() * (b - a);
const ex = x => Math.exp(clamp(x, -300, 300));
const lg10 = v => Math.log10(Math.max(v, 1e-30));

function mkRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const toSup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[d] || d).join('');
const fmtPow = v => {
  if (!v || v <= 0) return '0';
  const e = Math.floor(Math.log10(v));
  const m = v / Math.pow(10, e);
  if (Math.abs(m - 1) < 0.06) return '10' + toSup(e);
  if (Math.abs(m - 10) < 0.06) return '10' + toSup(e + 1);
  return m.toFixed(1) + '×10' + toSup(e);
};
const fmtSci = (v, d = 2) => {
  if (!v || !isFinite(v)) return '0';
  const sgn = v < 0 ? '−' : '';
  const av = Math.abs(v);
  if (av >= 0.01 && av < 1000) return sgn + av.toFixed(d);
  const e = Math.floor(Math.log10(av));
  const m = av / Math.pow(10, e);
  return sgn + m.toFixed(d) + '×10' + toSup(e);
};

/* Bảng thông số chuẩn 3 vật liệu bán dẫn ở 300 K (khớp Bảng 4.1 & 4.2 Buổi 5) */
const MATS = {
  ge: { id: 'ge', name: 'Ge', full: 'Germanium (Ge)', Eg: 0.66, Nc: 1.04e19, Nv: 6.00e18, mn: 0.55, mp: 0.37, mun: 3900, mup: 1900, er: 16.0, a: 5.66 },
  si: { id: 'si', name: 'Si', full: 'Silicon (Si)',   Eg: 1.12, Nc: 2.80e19, Nv: 1.04e19, mn: 1.08, mp: 0.56, mun: 1400, mup: 450,  er: 11.7, a: 5.43 },
  ga: { id: 'ga', name: 'GaAs', full: 'GaAs (III–V)', Eg: 1.42, Nc: 4.70e17, Nv: 7.00e18, mn: 0.067, mp: 0.48, mun: 8500, mup: 400, er: 13.1, a: 5.65 }
};

const kT_of = T => KT300 * (T / 300);
const Nc_of = (m, T) => m.Nc * Math.pow(T / 300, 1.5);
const Nv_of = (m, T) => m.Nv * Math.pow(T / 300, 1.5);
const ni_of = (m, T) => Math.sqrt(Nc_of(m, T) * Nv_of(m, T)) * ex(-m.Eg / (2 * kT_of(T)));
const dEfi_meV = (m, T) => 0.75 * kT_of(T) * Math.log(m.mp / m.mn) * 1000;

/* ---------- Bảng màu phân tầng đồng mức chuẩn Rule-lab.md ---------- */
const NIGHT_BG = '#0f0c14';
const NIGHT_RGB = [15, 12, 20];
const PAL_POS = [
  [59, 18, 93],
  [113, 31, 119],
  [190, 54, 99],
  [236, 104, 46],
  [251, 169, 44],
  [254, 241, 182]
];
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

/* ---------- Đọc biến CSS đồng bộ hoàn toàn với giao diện trang ---------- */
const C = {};
let FONT = '"Be Vietnam Pro", system-ui, -apple-system, sans-serif';
let MONO = '"Roboto Mono", ui-monospace, SFMono-Regular, monospace';

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

/* ---------- Bộ vẽ trường sóng / mật độ 2D phân tầng đồng mức (Offscreen) ---------- */
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
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(_wfCanvas, x, y, w, h);
  ctx.restore();
}

/* ---------- Tiện ích vẽ Canvas ---------- */
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
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
  g.addColorStop(0, colorCore);
  g.addColorStop(0.42, colorGlow);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, TAU); ctx.fill();
}
function drawNucleus(ctx, x, y, r = 4.6, fill = '#ffffff', stroke = '#120f17') {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1.4, r * 0.3);
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
function drawScopeBg(ctx, x, y, w, h, r = 10) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = NIGHT_BG;
  ctx.fill();
  ctx.strokeStyle = C.g;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

/* Đồng hồ kim cơ đo đại lượng vật lý — viền, nền & chữ đồng bộ 100% màu web */
function drawMeter(ctx, x, y, w, h, o) {
  rr(ctx, x, y, w, h, 8);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = o.border || C.g;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const cx = x + w * 0.5;
  const r = clamp(Math.min(w * 0.34, h * 0.24), 19, 34);
  const cy = y + h * 0.48 + r * 0.12;
  const a0 = Math.PI * 1.12, a1 = Math.PI * 1.88;

  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a1);
  ctx.strokeStyle = C.g;
  ctx.lineWidth = 3.2;
  ctx.stroke();

  if (o.zones) {
    o.zones.forEach(z => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0 + z[0] * (a1 - a0), a0 + z[1] * (a1 - a0));
      ctx.strokeStyle = z[2];
      ctx.lineWidth = 3.2;
      ctx.stroke();
    });
  }

  for (let i = 0; i <= 4; i++) {
    const a = a0 + (i / 4) * (a1 - a0);
    ln(ctx, cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4),
            cx + Math.cos(a) * (r + 1.5), cy + Math.sin(a) * (r + 1.5), C.sub, 1.1);
  }

  const frac = clamp(o.frac, 0, 1);
  const ang = a0 + frac * (a1 - a0);
  const acc = o.accent || C.main;
  ln(ctx, cx, cy, cx + Math.cos(ang) * (r - 3), cy + Math.sin(ang) * (r - 3), acc, 2.3);
  dot(ctx, cx, cy, 3.0, C.ink);

  txt(ctx, o.title || '', cx, y + 15, C.mut, 9.2, 'center', 700, MONO);
  txt(ctx, o.val || '', cx, cy + 20, acc, 11.0, 'center', 800, MONO);
  if (o.sub) txt(ctx, o.sub, cx, y + h - 14, o.subCol || C.mut, 8.9, 'center', 600, MONO);
}

const LABS = [];

/* Hàm tiện ích vẽ nền lưới kỹ thuật rất mờ cho chế độ mô phỏng lý thuyết đơn giản */
function drawSimpleGrid(ctx, x, y, w, h, step = 28) {
  ctx.fillStyle = NIGHT_BG;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  for (let gx = x + step; gx < x + w; gx += step) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
  }
  for (let gy = y + step; gy < y + h; gy += step) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
  }
}

/* Hàm tiện ích vẽ cặp liên kết cộng hóa trị giữa 2 nút nguyên tử (có hoặc thiếu 1 e⁻) */
function drawCovBond(ctx, x1, y1, x2, y2, broken, t, seed) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const nx = -Math.sin(ang) * 3.8, ny = Math.cos(ang) * 3.8;
  const mx = (x1 + x2) * 0.5, my = (y1 + y2) * 0.5;
  if (!broken) {
    ln(ctx, x1 + nx, y1 + ny, x2 + nx, y2 + ny, hexA(COL_WARM, 0.42), 1.4);
    ln(ctx, x1 - nx, y1 - ny, x2 - nx, y2 - ny, hexA(COL_WARM, 0.42), 1.4);
    const osc = Math.sin(t * 2.6 + seed) * 0.12;
    dot(ctx, x1 + (x2 - x1) * (0.42 + osc) + nx, y1 + (y2 - y1) * (0.42 + osc) + ny, 2.2, '#fef1b6');
    dot(ctx, x1 + (x2 - x1) * (0.58 - osc) - nx, y1 + (y2 - y1) * (0.58 - osc) - ny, 2.2, '#fef1b6');
  } else {
    ln(ctx, x1 + nx, y1 + ny, x2 + nx, y2 + ny, hexA(COL_WARM, 0.35), 1.3);
    ln(ctx, x1 - nx, y1 - ny, x2 - nx, y2 - ny, hexA(COL_ICE, 0.58), 1.3, [3, 3]);
    dot(ctx, mx + nx, my + ny, 2.1, '#fef1b6');
    glowDot(ctx, mx - nx, my - ny, 5.2, 'rgba(218,254,254,0.2)', hexA(COL_CYAN, 0.65));
    ctx.beginPath(); ctx.arc(mx - nx, my - ny, 5.4, 0, TAU);
    ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.8; ctx.stroke();
    txt(ctx, '+', mx - nx, my - ny + 0.5, COL_ICE, 8.8, 'center', 800, MONO);
  }
}

/* ==========================================================================
   TAB 1 — MẬT ĐỘ HẠT DẪN CÂN BẰNG n₀, p₀ & N_c, N_v (Mục 1.1–1.7)
   - Chế độ "Đơn giản" (mặc định): Buồng tinh thể nền sạch kèm thước vị trí E_F
     giữa E_c & E_v (đánh dấu vùng 3kT), hạt e⁻ & h⁺ chuyển động rõ nét.
   - Chế độ "Trường 2D": Kính hiển vi mật độ 2D phân tầng Inferno / Ice-Cyan.
   ========================================================================== */
LABS.push({
  id: 'density', name: 'Mật độ n₀, p₀', no: '1', secs: [1],
  S: { mode: 'simple', mat: 'si', EcEf: 0.25, T: 300 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng cân bằng nhiệt — Nồng độ n₀, p₀ theo E_F, nhiệt độ T & N_c, N_v',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'mat', seg: [['si', 'Silicon'], ['ga', 'GaAs'], ['ge', 'Germanium']] },
      { k: 'EcEf', l: 'E_c − E_F', min: 0.06, max: 1.06, step: 0.01,
        dynRange: S => [0.06, +(MATS[S.mat].Eg - 0.06).toFixed(2)],
        f: v => v.toFixed(2) + ' eV' },
      { k: 'T', l: 'Nhiệt độ T', min: 150, max: 450, step: 10, f: v => v + ' K' },
      { btn: 'Gần E_c (n ≫ p)', fn: p => { p.S.EcEf = 0.22; p.syncCtrls(); queueReact(p.tab, 'EcEf'); } },
      { btn: 'Giữa vùng cấm', fn: p => { p.S.EcEf = +(MATS[p.S.mat].Eg * 0.5).toFixed(2); p.syncCtrls(); queueReact(p.tab, 'EcEf'); } },
      { btn: 'Gần E_v (p ≫ n)', fn: p => { p.S.EcEf = +(MATS[p.S.mat].Eg - 0.22).toFixed(2); p.syncCtrls(); queueReact(p.tab, 'EcEf'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const m = MATS[S.mat];
      const kT = kT_of(S.T);
      const Nc = Nc_of(m, S.T);
      const Nv = Nv_of(m, S.T);
      const EcEf = clamp(S.EcEf, 0.05, m.Eg - 0.05);
      const EfEv = m.Eg - EcEf;
      const n0 = Nc * ex(-EcEf / kT);
      const p0 = Nv * ex(-EfEv / kT);
      const ni = ni_of(m, S.T);
      const boltzOk = EcEf >= 3 * kT && EfEv >= 3 * kT;

      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32, meterW = 124;
      const bx = chX + 10, by = chY + topBar + 4, bw = chW - meterW - 30, bh = chH - topBar - 14;

      if (!st.ePts) {
        const rg = mkRng(501);
        st.ePts = Array.from({ length: 28 }, () => ({ u: rg(), v: rg(), vx: (rg() - 0.5) * 0.45, vy: (rg() - 0.5) * 0.45 }));
        st.hPts = Array.from({ length: 28 }, () => ({ u: rg(), v: rg(), vx: (rg() - 0.5) * 0.36, vy: (rg() - 0.5) * 0.36 }));
        st.flashes = [];
        st.nNeedle = 0.5; st.pNeedle = 0.5;
      }

      const EcEfi = m.Eg * 0.5 - 0.5 * kT * Math.log(Nv / Nc);
      const bias = clamp((EcEfi - EcEf) / (m.Eg * 0.36), -1, 1);
      const nVis = Math.round(clamp((lg10(n0) - 4) / 14 * 26, 0, 26));
      const pVis = Math.round(clamp((lg10(p0) - 4) / 14 * 26, 0, 26));

      ctx.save();
      rr(ctx, bx, by, bw, bh, 6);
      ctx.clip();

      const cols = 8, rows = 5;
      const gaugeW = S.mode === 'simple' ? 76 : 0;
      const simX = bx + gaugeW, simW = bw - gaugeW;

      if (S.mode === 'field') {
        const resW = clamp(Math.round(bw * 0.44), 130, 200);
        const resH = clamp(Math.round(bh * 0.44), 90, 150);
        renderWaveField(ctx, bx, by, bw, bh, resW, resH, (u, v) => {
          const gx = u * cols, gy = v * rows;
          const dx = (gx - Math.floor(gx)) - 0.5;
          const dy = (gy - Math.floor(gy)) - 0.5;
          const r = Math.hypot(dx, dy);
          const lat = Math.exp(-r * 2.5) * 0.52 + 0.28;
          const rip = Math.sin(u * 12 - t * 2.4) * Math.cos(v * 9 + t * 2.0) * 0.22;
          if (Math.abs(bias) < 0.06) return clamp(rip * lat * 1.7, -0.5, 0.5);
          return clamp(bias * (0.42 + 0.56 * lat + rip), -1, 1);
        });
      } else {
        drawSimpleGrid(ctx, bx, by, bw, bh, 32);
        // Thước đo vị trí mức Fermi E_F giữa E_c và E_v dọc mép trái buồng
        const gx0 = bx + 8, gw = gaugeW - 14;
        const gyTop = by + 18, gyBot = by + bh - 36, gSpan = gyBot - gyTop;
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        rr(ctx, gx0, gyTop, gw, gSpan, 5); ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

        // Hai dải cảnh báo 3kT gần mép E_c và E_v
        const h3kT = clamp((3 * kT / m.Eg) * gSpan, 4, gSpan * 0.35);
        ctx.fillStyle = hexA(C.err, 0.18);
        ctx.fillRect(gx0 + 1, gyTop + 1, gw - 2, h3kT);
        ctx.fillRect(gx0 + 1, gyBot - h3kT - 1, gw - 2, h3kT);

        ln(ctx, gx0, gyTop, gx0 + gw, gyTop, COL_WARM, 2.2);
        ln(ctx, gx0, gyBot, gx0 + gw, gyBot, COL_CYAN, 2.2);
        txt(ctx, 'E_c', gx0 + gw * 0.5, gyTop - 9, COL_WARM, 9.2, 'center', 800, MONO);
        txt(ctx, 'E_v', gx0 + gw * 0.5, gyBot + 9, COL_CYAN, 9.2, 'center', 800, MONO);

        // Vạch tâm nội tại E_Fi (nét đứt mờ)
        const yFi = gyTop + (EcEfi / m.Eg) * gSpan;
        ln(ctx, gx0 + 4, yFi, gx0 + gw - 4, yFi, C.mut, 1, [3, 3]);
        txt(ctx, 'E_Fi', gx0 + gw * 0.5, yFi - 8, C.mut, 8.2, 'center', 600, MONO);

        // Vạch mức Fermi E_F hiện tại
        const yEf = gyTop + (EcEf / m.Eg) * gSpan;
        ln(ctx, gx0 + 2, yEf, gx0 + gw - 2, yEf, boltzOk ? C.main : C.err, 2.4);
        txt(ctx, 'E_F', gx0 + gw * 0.5, yEf + (yEf < gyTop + 18 ? 10 : -9), boltzOk ? C.main : C.err, 9.4, 'center', 800, MONO);

        ln(ctx, simX, by, simX, by + bh - 22, C.g, 1);
      }

      // Mạng nguyên tử nền rung nhiệt theo T
      const vib = 0.4 + Math.sqrt(S.T / 300) * 1.2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ax = simX + ((c + 0.5) / cols) * simW + Math.sin(t * 14 + r * 3 + c) * vib;
          const ay = by + ((r + 0.5) / rows) * (bh - 22) + Math.cos(t * 15 + c * 4 + r) * vib;
          const isAlt = S.mat === 'ga' && ((r + c) % 2 === 1);
          if (S.mode === 'simple') {
            dot(ctx, ax, ay, 3.0, isAlt ? hexA(COL_ICE, 0.35) : 'rgba(255,255,255,0.22)');
          } else {
            drawNucleus(ctx, ax, ay, 4.0, isAlt ? '#d6ecff' : 'rgba(255,255,255,0.82)', '#14111c');
          }
        }
      }

      const sp = Math.sqrt(S.T / 300);
      for (let i = 0; i < nVis; i++) {
        const pt = st.ePts[i];
        const u = ((pt.u + t * pt.vx * sp) % 1 + 1) % 1;
        const v = ((pt.v + t * pt.vy * sp) % 1 + 1) % 1;
        const ex_ = simX + 10 + u * (simW - 20), ey_ = by + 12 + v * (bh - 44);
        glowDot(ctx, ex_, ey_, 4.2, '#fef1b6', hexA(COL_WARM, 0.92));
        if (S.mode === 'simple') {
          dot(ctx, ex_, ey_, 4.2, COL_WARM);
          txt(ctx, '−', ex_, ey_ + 0.5, '#0f0c14', 8.5, 'center', 800, MONO);
        }
      }
      for (let i = 0; i < pVis; i++) {
        const pt = st.hPts[i];
        const u = ((pt.u + t * pt.vx * sp) % 1 + 1) % 1;
        const v = ((pt.v + t * pt.vy * sp) % 1 + 1) % 1;
        const hx = simX + 10 + u * (simW - 20), hy = by + 12 + v * (bh - 44);
        glowDot(ctx, hx, hy, 4.0, '#dafefe', hexA(COL_CYAN, 0.85));
        ctx.beginPath(); ctx.arc(hx, hy, 5.2, 0, TAU);
        ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.7; ctx.stroke();
        if (S.mode === 'simple') txt(ctx, '+', hx, hy + 0.5, COL_ICE, 8.8, 'center', 800, MONO);
      }

      // Chớp sinh / tái hợp giữ cân bằng nhiệt
      if (Math.random() < dt * (2.4 + S.T / 160)) {
        st.flashes.push({ u: rnd(0.10, 0.90), v: rnd(0.14, 0.84), life: 1.0 });
      }
      for (let i = st.flashes.length - 1; i >= 0; i--) {
        const fl = st.flashes[i];
        fl.life -= dt * 1.9;
        if (fl.life <= 0) { st.flashes.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(simX + fl.u * simW, by + fl.v * (bh - 22), 4 + (1 - fl.life) * 16, 0, TAU);
        ctx.strokeStyle = hexA('#fef1b6', fl.life * 0.8); ctx.lineWidth = 1.5; ctx.stroke();
      }

      const foot = !boltzOk
        ? 'CẢNH BÁO (< 3kT): E_F quá sát mép dải, xấp xỉ Boltzmann không còn chính xác!'
        : m.full + ' · N_c(T) = ' + fmtSci(Nc, 2) + ' · N_v(T) = ' + fmtSci(Nv, 2) + ' cm⁻³ (∝ T^(3/2))';
      ctx.fillStyle = 'rgba(15, 12, 20, 0.82)';
      ctx.fillRect(bx, by + bh - 22, bw, 22);
      txt(ctx, foot, bx + bw * 0.5, by + bh - 11, boltzOk ? C.ink : C.err, 9.7, 'center', 700, MONO);
      ctx.restore();

      rr(ctx, bx, by, bw, bh, 6);
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      // 2 đồng hồ kim cơ đo n₀ và p₀ ngược chiều nhau
      const mx = bx + bw + 10, mh = (bh - 26) * 0.5;
      st.nNeedle += (clamp((lg10(n0) - 2) / 17, 0, 1) - st.nNeedle) * Math.min(1, dt * 8);
      st.pNeedle += (clamp((lg10(p0) - 2) / 17, 0, 1) - st.pNeedle) * Math.min(1, dt * 8);

      drawMeter(ctx, mx, by, meterW, mh, {
        title: 'ELECTRON n₀',
        val: fmtSci(n0, 2),
        sub: 'E_c−E_F = ' + (EcEf / kT).toFixed(1) + ' kT',
        subCol: EcEf < 3 * kT ? C.err : C.mut,
        frac: st.nNeedle,
        accent: C.main,
        zones: [[0.5, 1, C.main]]
      });

      const midY = by + mh + 13;
      ln(ctx, mx + meterW * 0.5, by + mh, mx + meterW * 0.5, by + mh + 26, C.g, 1.4);
      rr(ctx, mx + 6, midY - 9, meterW - 12, 18, 4);
      ctx.fillStyle = C.card; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.1; ctx.stroke();
      txt(ctx, 'n₀p₀ = ' + fmtSci(ni * ni, 1), mx + meterW * 0.5, midY, C.ink, 8.6, 'center', 700, MONO);

      drawMeter(ctx, mx, by + mh + 26, meterW, mh, {
        title: 'LỖ TRỐNG p₀',
        val: fmtSci(p0, 2),
        sub: 'E_F−E_v = ' + (EfEv / kT).toFixed(1) + ' kT',
        subCol: EfEv < 3 * kT ? C.err : C.mut,
        frac: st.pNeedle,
        accent: C.c2,
        zones: [[0.5, 1, C.c2]]
      });

      txt(ctx, m.name + ' (E_g=' + m.Eg.toFixed(2) + ' eV) · E_c−E_F = ' + EcEf.toFixed(2) + ' | E_F−E_v = ' + EfEv.toFixed(2) + ' eV · T = ' + S.T + ' K',
        chX + 12, chY + 17, C.ink, 10.2, 'left', 700, MONO);
      txt(ctx, boltzOk ? 'Boltzmann OK (≥ 3kT)' : 'QUÁ SÁT MÉP (< 3kT)',
        chX + chW - 12, chY + 17, boltzOk ? C.c1 : C.err, 10.3, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 2 — BÁN DẪN NỘI TẠI: ĐỨT LIÊN KẾT & NHẢY LỖ TRỐNG (Mục 2.1)
   - Chế độ "Đơn giản" (mặc định): Mạng nguyên tử Si nối bằng cặp liên kết cộng
     hóa trị rõ nét; đứt liên kết, nhảy lỗ trống & tia photon hiển thị trực tiếp.
   - Chế độ "Trường 2D": Trường mật độ liên kết 2D phân tầng đồng mức.
   ========================================================================== */
LABS.push({
  id: 'intrinsic', name: 'Đứt liên kết', no: '2.1', secs: [2],
  S: { mode: 'simple', view: 'trio', T: 300 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Mạng liên kết cộng hóa trị Silicon — Đứt liên kết nhiệt & Nhảy lỗ trống',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'view', seg: [['trio', '3 giai đoạn'], ['live', 'Kính hiển vi động']] },
      { k: 'T', l: 'Nhiệt độ T', min: 0, max: 600, step: 20, f: v => v + ' K' },
      { btn: '0 K (Cách điện)', fn: p => { p.S.view = 'live'; p.S.T = 0; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: 'Bắn Photon (hν ≥ E_g)', fn: p => { p.S.view = 'live'; p.st.firePhoton = true; p.syncCtrls(); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32;
      const areaX = chX + 8, areaY = chY + topBar + 4, areaW = chW - 16, areaH = chH - topBar - 14;

      // Hàm vẽ 1 khung trường mật độ hoặc mạng liên kết cộng hóa trị Si 2D
      const drawBondFrame = (fx, fy, fw, fh, stage, label) => {
        const cols = 4, rows = 4;
        const holeU = stage === 2 ? 0.50 : stage === 3 ? 0.25 : -10;
        const holeV = stage === 2 ? 0.50 : stage === 3 ? 0.375 : -10;
        const elecU = stage === 2 ? (0.54 + 0.03 * Math.sin(t * 3.5)) : stage === 3 ? (0.74 + 0.05 * Math.sin(t * 2.4)) : -10;
        const elecV = stage === 2 ? (0.48 + 0.03 * Math.cos(t * 3.1)) : stage === 3 ? (0.64 + 0.04 * Math.cos(t * 2.7)) : -10;
        const elecR = stage === 2 ? 0.14 : 0.22;

        ctx.save();
        rr(ctx, fx, fy, fw, fh, 6);
        ctx.clip();

        const vib = stage === 1 ? 0 : 1.0;
        const aPos = (c, r) => ({
          x: fx + ((c + 0.5) / cols) * fw + Math.sin(t * 14 + r * 3 + c) * vib,
          y: fy + ((r + 0.5) / rows) * (fh - 22) + Math.cos(t * 15 + c * 4 + r) * vib
        });

        if (S.mode === 'field') {
          const resW = clamp(Math.round(fw * 0.5), 96, 170);
          const resH = clamp(Math.round(fh * 0.5), 88, 160);
          renderWaveField(ctx, fx, fy, fw, fh, resW, resH, (u, v) => {
            const gx = u * cols, gy = v * rows;
            const dx = (gx - Math.floor(gx)) - 0.5;
            const dy = (gy - Math.floor(gy)) - 0.5;
            const bondH = Math.exp(-Math.abs(dy) * 5.2) * (0.42 + 0.45 * Math.pow(Math.sin(gx * Math.PI), 2));
            const bondV = Math.exp(-Math.abs(dx) * 5.2) * (0.42 + 0.45 * Math.pow(Math.sin(gy * Math.PI), 2));
            let val = Math.max(bondH, bondV) * 0.92;
            if (stage >= 2) {
              const dh = Math.hypot((u - holeU) * cols, (v - holeV) * rows);
              if (dh < 0.65) val *= clamp((dh - 0.36) / 0.30, 0, 1);
              const de = Math.hypot(u - elecU, v - elecV);
              if (de < elecR * 2.2) {
                const wave = Math.exp(-de / elecR) * (0.85 + 0.15 * Math.cos(de * 22 - t * 4));
                if (wave > 0.22) return -clamp(wave, 0, 1);
              }
            }
            return clamp(val, 0, 1);
          });
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const pt = aPos(c, r);
              drawNucleus(ctx, pt.x, pt.y, 4.2);
            }
          }
          if (stage >= 2) {
            const hx = fx + holeU * fw, hy = fy + holeV * (fh - 22);
            ctx.beginPath(); ctx.arc(hx, hy, 9.5, 0, TAU);
            ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.8; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
            txt(ctx, '+', hx, hy + 0.5, COL_ICE, 11, 'center', 800, MONO);
            if (stage === 3) {
              arrow(ctx, fx + 0.50 * fw, fy + 0.50 * (fh - 22), hx + 8, hy + 5, COL_ICE, 1.6, [4, 3]);
              txt(ctx, 'e⁻ loang', fx + elecU * fw, fy + elecV * (fh - 22), '#dafefe', 9.2, 'center', 800, MONO);
            }
          }
        } else {
          // Chế độ ĐƠN GIẢN: Mạng cặp liên kết cộng hóa trị Si–Si sắc nét
          drawSimpleGrid(ctx, fx, fy, fw, fh, 28);
          let bi = 0;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const p1 = aPos(c, r);
              if (c + 1 < cols) {
                const isBroken = (stage === 2 && c === 1 && r === 1) || (stage === 3 && c === 0 && r === 1);
                drawCovBond(ctx, p1.x, p1.y, aPos(c + 1, r).x, aPos(c + 1, r).y, isBroken, t, bi++);
              }
              if (r + 1 < rows) {
                drawCovBond(ctx, p1.x, p1.y, aPos(c, r + 1).x, aPos(c, r + 1).y, false, t, bi++);
              }
            }
          }
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const pt = aPos(c, r);
              dot(ctx, pt.x, pt.y, 9.5, C.card);
              ctx.beginPath(); ctx.arc(pt.x, pt.y, 9.5, 0, TAU);
              ctx.strokeStyle = C.g; ctx.lineWidth = 1.4; ctx.stroke();
              txt(ctx, 'Si', pt.x, pt.y + 0.5, C.ink, 8.6, 'center', 700, MONO);
            }
          }
          if (stage >= 2) {
            const pOldA = aPos(1, 1), pOldB = aPos(2, 1);
            const oldX = (pOldA.x + pOldB.x) * 0.5, oldY = (pOldA.y + pOldB.y) * 0.5;
            const ex_ = stage === 2 ? (oldX + 18 + Math.sin(t * 3) * 4) : (fx + fw * 0.78 + Math.cos(t * 2.4) * 10);
            const ey_ = stage === 2 ? (oldY - 18 + Math.cos(t * 3) * 4) : (fy + (fh - 22) * 0.72 + Math.sin(t * 2.7) * 8);
            if (stage === 2) {
              arrow(ctx, oldX, oldY, ex_ - 6, ey_ + 6, COL_WARM, 1.4, [3, 3]);
            } else {
              const pNewA = aPos(0, 1), pNewB = aPos(1, 1);
              const newX = (pNewA.x + pNewB.x) * 0.5, newY = (pNewA.y + pNewB.y) * 0.5;
              arrow(ctx, oldX - 6, oldY - 10, newX + 6, newY - 10, COL_ICE, 1.6, [4, 3]);
              txt(ctx, 'nhảy h⁺', (oldX + newX) * 0.5, oldY - 21, COL_ICE, 8.5, 'center', 700, MONO);
            }
            glowDot(ctx, ex_, ey_, 5.2, '#fef1b6', hexA(COL_WARM, 0.95));
            dot(ctx, ex_, ey_, 4.6, COL_WARM);
            txt(ctx, '−', ex_, ey_ + 0.5, '#0f0c14', 9, 'center', 800, MONO);
            txt(ctx, 'e⁻ tự do', ex_, ey_ - 13, C.main, 8.6, 'center', 700, MONO);
          }
        }

        ctx.fillStyle = 'rgba(15, 12, 20, 0.82)';
        ctx.fillRect(fx, fy + fh - 22, fw, 22);
        txt(ctx, label, fx + fw * 0.5, fy + fh - 11, C.ink, 9.6, 'center', 700, MONO);
        ctx.restore();

        rr(ctx, fx, fy, fw, fh, 6);
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
      };

      if (S.view === 'trio') {
        const gap = 10;
        const cw = (areaW - gap * 2) / 3;
        drawBondFrame(areaX, areaY, cw, areaH, 1, '① 0 K: Mọi liên kết đầy (Cách điện)');
        drawBondFrame(areaX + cw + gap, areaY, cw, areaH, 2, '② Nhiệt làm đứt 1 liên kết (e⁻ + h⁺)');
        drawBondFrame(areaX + (cw + gap) * 2, areaY, cw, areaH, 3, '③ e⁻ tự do tách xa · Lỗ trống nhảy');

        txt(ctx, 'Cơ chế sinh cặp electron – lỗ trống trong Silicon nội tại (n₀ = p₀ = nᵢ)',
          chX + 12, chY + 17, C.ink, 10.4, 'left', 700, MONO);
        txt(ctx, 'Cam: e⁻ liên kết / tự do · Xanh: lỗ trống (+)',
          chX + chW - 12, chY + 17, C.main, 10.2, 'right', 700, MONO);
      } else {
        // --- CHẾ ĐỘ KÍNH HIỂN VI ĐỘNG: ĐỨT LIÊN KẾT THEO T & BẮN PHOTON ---
        const meterW = 122;
        const bw = areaW - meterW - 10;
        const cols = 6, rows = 4;

        if (!st.holes) {
          st.holes = []; // { c, r, cd }
          st.freeE = []; // { u, v, vx, vy, age }
          st.photons = [];
          st.flashes = [];
          st.niNeedle = 0.3;
        }

        const targetPairs = S.T < 60 ? 0 : Math.round(clamp(Math.pow((S.T - 40) / 145, 1.85), 1, 8));
        const spawnPair = (c, r, fromPhoton) => {
          const u = (c + 1.0) / cols, v = (r + 0.5) / rows;
          st.holes.push({ c, r, cd: rnd(0.8, 1.6) });
          const a = rnd(0, TAU);
          st.freeE.push({ u, v, vx: Math.cos(a) * 0.32, vy: Math.sin(a) * 0.32, age: 0 });
          st.flashes.push({ u, v, life: 1.0, col: fromPhoton ? C.main : COL_ICE });
        };

        if (st.firePhoton) {
          st.firePhoton = false;
          const tc = Math.floor(rnd(1, cols - 1)), tr = Math.floor(rnd(0, rows));
          st.photons.push({ u: 0.02, v: (tr + 0.5) / rows, tc, tr, tu: (tc + 1.0) / cols });
          queueReact(p.tab, 'photon');
        }

        // Cập nhật photon đang lao vào liên kết
        for (let i = st.photons.length - 1; i >= 0; i--) {
          const ph = st.photons[i];
          ph.u += dt * 1.1;
          if (ph.u >= ph.tu) {
            if (st.holes.length < 10) spawnPair(ph.tc, ph.tr, true);
            st.photons.splice(i, 1);
          }
        }

        // Sinh nhiệt theo T
        if (st.holes.length < targetPairs && Math.random() < dt * (1.2 + S.T / 150)) {
          spawnPair(Math.floor(rnd(0, cols - 1)), Math.floor(rnd(0, rows)), false);
        }
        // Làm lạnh về 0 K → tái hợp sạch về liên kết đầy
        if (S.T < 50 && st.holes.length > 0 && Math.random() < dt * 3.5) {
          st.holes.pop();
          if (st.freeE.length > 0) st.freeE.pop();
        }

        // Lỗ trống nhảy từng bước sang liên kết kề nhau
        st.holes.forEach(h => {
          h.cd -= dt * (0.5 + S.T / 300);
          if (h.cd <= 0) {
            h.cd = rnd(0.9, 1.7);
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            h.c = clamp(h.c + d[0], 0, cols - 2);
            h.r = clamp(h.r + d[1], 0, rows - 1);
          }
        });

        // Electron tự do bay loang & tái hợp nếu vượt cân bằng
        const sp = 0.4 + Math.sqrt(Math.max(S.T, 40) / 300) * 0.7;
        for (let i = st.freeE.length - 1; i >= 0; i--) {
          const e = st.freeE[i];
          e.age += dt;
          e.u += e.vx * dt * sp; e.v += e.vy * dt * sp;
          if (e.u < 0.04 || e.u > 0.96) { e.vx *= -1; e.u = clamp(e.u, 0.04, 0.96); }
          if (e.v < 0.08 || e.v > 0.88) { e.vy *= -1; e.v = clamp(e.v, 0.08, 0.88); }
          if (e.age > 1.8 && st.freeE.length > targetPairs) {
            for (let j = st.holes.length - 1; j >= 0; j--) {
              const hu = (st.holes[j].c + 1.0) / cols, hv = (st.holes[j].r + 0.5) / rows;
              if (Math.hypot(e.u - hu, e.v - hv) < 0.08) {
                st.flashes.push({ u: hu, v: hv, life: 1.0, col: C.c1 });
                st.holes.splice(j, 1);
                st.freeE.splice(i, 1);
                break;
              }
            }
          }
        }

        ctx.save();
        rr(ctx, areaX, areaY, bw, areaH, 6);
        ctx.clip();

        const vib = S.T === 0 ? 0 : Math.sqrt(S.T / 300) * 2.2;
        const nPos = (c, r) => ({
          x: areaX + ((c + 0.5) / cols) * bw + Math.sin(t * 15 + r * 3 + c) * vib,
          y: areaY + ((r + 0.5) / rows) * (areaH - 22) + Math.cos(t * 16 + c * 4 + r) * vib
        });

        if (S.mode === 'field') {
          const resW = clamp(Math.round(bw * 0.44), 130, 200);
          const resH = clamp(Math.round(areaH * 0.44), 90, 150);
          renderWaveField(ctx, areaX, areaY, bw, areaH, resW, resH, (u, v) => {
            const gx = u * cols, gy = v * rows;
            const dx = (gx - Math.floor(gx)) - 0.5, dy = (gy - Math.floor(gy)) - 0.5;
            const bH = Math.exp(-Math.abs(dy) * 5.0) * (0.38 + 0.45 * Math.pow(Math.sin(gx * Math.PI), 2));
            const bV = Math.exp(-Math.abs(dx) * 5.0) * (0.38 + 0.45 * Math.pow(Math.sin(gy * Math.PI), 2));
            let val = Math.max(bH, bV) * 0.88;
            for (let i = 0; i < st.holes.length; i++) {
              const hu = (st.holes[i].c + 1.0) / cols, hv = (st.holes[i].r + 0.5) / rows;
              const dh = Math.hypot((u - hu) * cols, (v - hv) * rows);
              if (dh < 0.62) return -clamp(Math.exp(-dh * 2.5) * 0.95, 0, 1);
            }
            return clamp(val, 0, 1);
          });
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const pt = nPos(c, r);
              drawNucleus(ctx, pt.x, pt.y, 4.6);
            }
          }
          st.holes.forEach(h => {
            const hx = areaX + ((h.c + 1.0) / cols) * bw, hy = areaY + ((h.r + 0.5) / rows) * (areaH - 22);
            ctx.beginPath(); ctx.arc(hx, hy, 9.5, 0, TAU);
            ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.8; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
            txt(ctx, '+', hx, hy + 0.5, COL_ICE, 10.5, 'center', 800, MONO);
          });
        } else {
          drawSimpleGrid(ctx, areaX, areaY, bw, areaH, 30);
          let bi = 0;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const p1 = nPos(c, r);
              if (c + 1 < cols) {
                const hasH = st.holes.some(h => h.c === c && h.r === r);
                drawCovBond(ctx, p1.x, p1.y, nPos(c + 1, r).x, nPos(c + 1, r).y, hasH, t, bi++);
              }
              if (r + 1 < rows) {
                drawCovBond(ctx, p1.x, p1.y, nPos(c, r + 1).x, nPos(c, r + 1).y, false, t, bi++);
              }
            }
          }
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const pt = nPos(c, r);
              dot(ctx, pt.x, pt.y, 11.5, C.card);
              ctx.beginPath(); ctx.arc(pt.x, pt.y, 11.5, 0, TAU);
              ctx.strokeStyle = S.T > 420 ? hexA(C.main, 0.7) : C.g; ctx.lineWidth = 1.5; ctx.stroke();
              txt(ctx, 'Si', pt.x, pt.y + 0.5, C.ink, 9.5, 'center', 700, MONO);
            }
          }
        }

        // Electron tự do (vàng)
        st.freeE.forEach(e => {
          const ex_ = areaX + e.u * bw, ey_ = areaY + e.v * (areaH - 22);
          glowDot(ctx, ex_, ey_, 4.6, '#fef1b6', hexA(COL_WARM, 0.95));
          if (S.mode === 'simple') {
            dot(ctx, ex_, ey_, 4.4, COL_WARM);
            txt(ctx, '−', ex_, ey_ + 0.5, '#0f0c14', 9, 'center', 800, MONO);
          }
        });

        // Vẽ tia photon đang bay vào
        st.photons.forEach(ph => {
          const px = areaX + ph.u * bw, py = areaY + ph.v * (areaH - 22);
          ctx.beginPath();
          for (let s = -18; s <= 8; s += 2) {
            const wy = Math.sin(s * 0.65 - t * 24) * 5;
            s === -18 ? ctx.moveTo(px + s, py + wy) : ctx.lineTo(px + s, py + wy);
          }
          ctx.strokeStyle = C.main; ctx.lineWidth = 2.2; ctx.stroke();
          glowDot(ctx, px, py, 4, '#ffffff', hexA(C.main, 0.9));
        });

        // Chớp sinh / tái hợp
        for (let i = st.flashes.length - 1; i >= 0; i--) {
          const f = st.flashes[i];
          f.life -= dt * 1.8;
          if (f.life <= 0) { st.flashes.splice(i, 1); continue; }
          ctx.beginPath();
          ctx.arc(areaX + f.u * bw, areaY + f.v * (areaH - 22), 4 + (1 - f.life) * 20, 0, TAU);
          ctx.strokeStyle = hexA(f.col, f.life * 0.88); ctx.lineWidth = 1.8; ctx.stroke();
        }

        ctx.fillStyle = 'rgba(15, 12, 20, 0.80)';
        ctx.fillRect(areaX, areaY + areaH - 22, bw, 22);
        txt(ctx, S.T === 0 ? 'T = 0 K: Mọi liên kết kín đặc, 0 hạt tự do → Si cách điện hoàn toàn'
          : 'Sinh thành cặp e⁻ (vàng) & h⁺ (khoang cyan) → Luôn giữ n₀ = p₀ = nᵢ',
          areaX + bw * 0.5, areaY + areaH - 11, C.ink, 9.8, 'center', 700, MONO);
        ctx.restore();

        rr(ctx, areaX, areaY, bw, areaH, 6);
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

        // 2 đồng hồ bên phải: nᵢ(T) & Đếm cặp cân bằng
        const ni = S.T > 20 ? ni_of(MATS.si, S.T) : 0;
        const mx = areaX + bw + 10, mh = (areaH - 10) * 0.5;
        st.niNeedle += ((ni > 1 ? clamp((lg10(ni) - 4) / 12, 0, 1) : 0) - st.niNeedle) * Math.min(1, dt * 8);

        drawMeter(ctx, mx, areaY, meterW, mh, {
          title: 'MẬT ĐỘ nᵢ(Si)',
          val: ni > 1 ? fmtSci(ni, 1) : '≈ 0',
          sub: 'cm⁻³ ở ' + S.T + ' K',
          frac: st.niNeedle,
          accent: C.main
        });
        drawMeter(ctx, mx, areaY + mh + 10, meterW, mh, {
          title: 'CẶP TỰ DO',
          val: st.freeE.length + ' e⁻ = ' + st.holes.length + ' h⁺',
          sub: 'Luôn sinh từng cặp',
          frac: clamp(st.freeE.length / 10, 0, 1),
          accent: C.c2
        });

        txt(ctx, 'Si nội tại · T = ' + S.T + ' K (kT = ' + (kT_of(S.T) * 1000).toFixed(1) + ' meV)',
          chX + 12, chY + 17, C.ink, 10.4, 'left', 700, MONO);
        txt(ctx, 'n₀ = p₀ = nᵢ', chX + chW - 12, chY + 17, C.main, 10.6, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 3 — BÁN DẪN NỘI TẠI Ge / Si / GaAs & LỆCH MỨC FERMI E_Fi (Mục 2.2–2.4)
   - Chế độ "Đơn giản" (mặc định): 3 buồng tinh thể sạch so sánh mật độ cặp
     e⁻–h⁺ theo E_g; và khay ghế lượng tử N_c vs N_v trực quan cho lệch E_Fi.
   - Chế độ "Trường 2D": Nền sóng mật độ phân tầng Inferno / Ice-Cyan.
   ========================================================================== */
LABS.push({
  id: 'efishift', name: 'nᵢ(T) & Lệch E_Fi', no: '2.2–2.4', secs: [],
  S: { mode: 'simple', view: 'trio', T: 300, focusMat: 'ga' },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'So sánh nội tại Ge · Si · GaAs theo nhiệt độ T & Độ lệch mức Fermi nội tại E_Fi',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'view', seg: [['trio', '3 bán dẫn (Ge · Si · GaAs)'], ['efi', 'Cơ chế lệch E_Fi (N_c vs N_v)']] },
      { k: 'T', l: 'Nhiệt độ T', min: 200, max: 520, step: 10, f: v => v + ' K' },
      { k: 'focusMat', seg: [['si', 'Si (m_n* > m_p*)'], ['ga', 'GaAs (m_n* ≪ m_p*)'], ['ge', 'Ge']] }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, T = S.T;
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32;
      const areaX = chX + 8, areaY = chY + topBar + 4, areaW = chW - 16, areaH = chH - topBar - 14;

      if (!st.pts) {
        const rg = mkRng(503);
        st.pts = Array.from({ length: 26 }, () => ({ u: rg(), v: rg(), vx: (rg() - 0.5) * 0.4, vy: (rg() - 0.5) * 0.4 }));
        st.needles = { ge: 0.5, si: 0.3, ga: 0.1 };
        st.efiNeedle = 0.5;
      }

      if (S.view === 'trio') {
        const gap = 10;
        const cw = (areaW - gap * 2) / 3;
        const meterH = 92;
        const boxH = areaH - meterH - 8;
        const keys = ['ge', 'si', 'ga'];

        keys.forEach((k, idx) => {
          const m = MATS[k];
          const ni = ni_of(m, T);
          const rhoI = 1 / (Q_EL * ni * (m.mun + m.mup));
          const x0 = areaX + idx * (cw + gap);
          const nPairs = Math.round(clamp((lg10(ni) - 5.5) / 10.5 * 24, 0, 24));
          const intensity = clamp((lg10(ni) - 6) / 10, 0.08, 1.0);

          ctx.save();
          rr(ctx, x0, areaY, cw, boxH, 6);
          ctx.clip();

          if (S.mode === 'field') {
            const resW = clamp(Math.round(cw * 0.45), 90, 150);
            const resH = clamp(Math.round(boxH * 0.45), 76, 130);
            renderWaveField(ctx, x0, areaY, cw, boxH, resW, resH, (u, v) => {
              const w1 = Math.sin(u * 10 - t * 2.2 + idx) * Math.cos(v * 9 + t * 1.8);
              const w2 = Math.cos((u - v) * 9 - t * 2.5);
              return clamp((w1 * 0.6 + w2 * 0.5) * intensity, -1, 1);
            });
          } else {
            drawSimpleGrid(ctx, x0, areaY, cw, boxH, 26);
          }

          // Lưới nguyên tử nền rung theo T
          const vib = 0.4 + ((T - 200) / 320) * 2.2;
          for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
              const ax = x0 + ((c + 0.5) / 4) * cw + Math.sin(t * 14 + r * 3 + c) * vib;
              const ay = areaY + ((r + 0.5) / 4) * (boxH - 22) + Math.cos(t * 15 + c * 4 + r) * vib;
              if (S.mode === 'simple') dot(ctx, ax, ay, 2.6, 'rgba(255,255,255,0.22)');
              else drawNucleus(ctx, ax, ay, 3.6, 'rgba(255,255,255,0.72)', '#14111c');
            }
          }

          // Cặp e⁻ (vàng) & h⁺ (cyan) sinh nhiệt thực tế
          const sp = Math.sqrt(T / 300);
          for (let i = 0; i < nPairs; i++) {
            const pt = st.pts[i];
            const eu = ((pt.u + t * pt.vx * sp) % 1 + 1) % 1;
            const ev = ((pt.v + t * pt.vy * sp) % 1 + 1) % 1;
            const hu = ((1 - pt.u - t * pt.vx * sp * 0.8) % 1 + 1) % 1;
            const hv = ((1 - pt.v - t * pt.vy * sp * 0.8) % 1 + 1) % 1;
            const pxE = x0 + 8 + eu * (cw - 16), pyE = areaY + 10 + ev * (boxH - 40);
            const pxH = x0 + 8 + hu * (cw - 16), pyH = areaY + 10 + hv * (boxH - 40);
            glowDot(ctx, pxE, pyE, 3.4, '#fef1b6', hexA(COL_WARM, 0.92));
            if (S.mode === 'simple') dot(ctx, pxE, pyE, 3.2, COL_WARM);
            glowDot(ctx, pxH, pyH, 3.4, '#dafefe', hexA(COL_CYAN, 0.85));
            ctx.beginPath(); ctx.arc(pxH, pyH, 4.0, 0, TAU);
            ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.5; ctx.stroke();
          }

          ctx.fillStyle = 'rgba(15, 12, 20, 0.82)';
          ctx.fillRect(x0, areaY + boxH - 22, cw, 22);
          txt(ctx, m.full + ' · E_g = ' + m.Eg.toFixed(2) + ' eV', x0 + cw * 0.5, areaY + boxH - 11, C.ink, 9.6, 'center', 700, MONO);
          ctx.restore();

          rr(ctx, x0, areaY, cw, boxH, 6);
          ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

          // Đồng hồ kim cơ dưới mỗi buồng đọc nᵢ và ρᵢ
          const targetN = clamp((lg10(ni) - 4) / 13, 0, 1);
          st.needles[k] += (targetN - st.needles[k]) * Math.min(1, dt * 8);
          const acc = k === 'ge' ? C.main : k === 'si' ? C.c1 : C.c2;
          drawMeter(ctx, x0, areaY + boxH + 8, cw, meterH, {
            title: 'nᵢ(' + m.name + ') ở ' + T + 'K',
            val: fmtSci(ni, 1) + ' cm⁻³',
            sub: 'ρᵢ ≈ ' + (rhoI < 1e16 ? fmtSci(rhoI, 1) : '>10¹⁶') + ' Ω·cm',
            frac: st.needles[k],
            accent: acc
          });
        });

        txt(ctx, 'Nhiệt độ T = ' + T + ' K (kT = ' + (kT_of(T) * 1000).toFixed(1) + ' meV) — E_g nhỏ hơn một chút làm nᵢ vọt hàng bậc độ lớn!',
          chX + 12, chY + 17, C.ink, 10.2, 'left', 700, MONO);
        txt(ctx, 'nᵢ = √(N_cN_v)·e^(−E_g/2kT)', chX + chW - 12, chY + 17, C.main, 10.3, 'right', 700, MONO);
      } else {
        // --- CHẾ ĐỘ CƠ CHẾ LỆCH E_Fi DO N_c ≠ N_v (Mục 2.4) ---
        const m = MATS[S.focusMat];
        const Nc = Nc_of(m, T), Nv = Nv_of(m, T);
        const shift = dEfi_meV(m, T);
        const meterW = 132;
        const bw = areaW - meterW - 10;
        const gapMid = S.mode === 'simple' ? 38 : 10;
        const halfH = (areaH - gapMid) * 0.5;

        // 2 buồng xếp chồng: Buồng trên = "Ghế dải dẫn N_c", Buồng dưới = "Ghế dải hóa trị N_v"
        const drawSeatRoom = (ry, isCond, Nval, mStar, label) => {
          const density = clamp(Math.pow(mStar, 0.75) * 1.1, 0.16, 1.0);
          const nCols = Math.max(4, Math.round(4 + density * 10));
          const nRows = Math.max(2, Math.round(2 + density * 3));

          ctx.save();
          rr(ctx, areaX, ry, bw, halfH, 6);
          ctx.clip();

          if (S.mode === 'field') {
            const resW = clamp(Math.round(bw * 0.42), 120, 190);
            const resH = clamp(Math.round(halfH * 0.44), 58, 96);
            renderWaveField(ctx, areaX, ry, bw, halfH, resW, resH, (u, v) => {
              const gx = u * nCols, gy = v * nRows;
              const dx = (gx - Math.floor(gx)) - 0.5, dy = (gy - Math.floor(gy)) - 0.5;
              const r = Math.hypot(dx, dy);
              const cell = Math.exp(-r * 2.4) * (0.55 + 0.45 * density);
              return (isCond ? 1 : -1) * clamp(cell * (0.9 + 0.08 * Math.sin(t * 3 + gx)), 0, 1);
            });
            for (let r = 0; r < nRows; r++) {
              for (let c = 0; c < nCols; c++) {
                const sx = areaX + ((c + 0.5) / nCols) * bw;
                const sy = ry + ((r + 0.5) / nRows) * (halfH - 22);
                drawNucleus(ctx, sx, sy, clamp(5.2 - density * 1.6, 3.2, 5.2),
                  isCond ? '#fef1b6' : '#dafefe', '#120f17');
              }
            }
          } else {
            // Chế độ ĐƠN GIẢN: Vẽ rõ từng "ghế lượng tử" (vòng tròn trống) & đúng 4 hạt đang ngồi (n₀ = p₀)
            drawSimpleGrid(ctx, areaX, ry, bw, halfH, 28);
            const totalSeats = nCols * nRows;
            const seatR = clamp(Math.min(bw / (nCols * 3.1), (halfH - 28) / (nRows * 3.0)), 4.5, 9.5);
            const occSet = new Set([0, Math.floor(totalSeats * 0.33), Math.floor(totalSeats * 0.66), totalSeats - 1]);
            let idxS = 0;
            for (let r = 0; r < nRows; r++) {
              for (let c = 0; c < nCols; c++) {
                const sx = areaX + ((c + 0.5) / nCols) * bw;
                const sy = ry + ((r + 0.5) / nRows) * (halfH - 22);
                const occupied = occSet.has(idxS++);
                ctx.beginPath(); ctx.arc(sx, sy, seatR, 0, TAU);
                ctx.strokeStyle = isCond ? hexA(COL_WARM, 0.55) : hexA(COL_CYAN, 0.55);
                ctx.lineWidth = 1.3; ctx.stroke();
                if (occupied) {
                  glowDot(ctx, sx, sy, seatR * 0.8, isCond ? '#fef1b6' : '#dafefe', hexA(isCond ? COL_WARM : COL_CYAN, 0.9));
                  dot(ctx, sx, sy, seatR * 0.65, isCond ? COL_WARM : COL_CYAN);
                }
              }
            }
          }

          ctx.fillStyle = 'rgba(15, 12, 20, 0.82)';
          ctx.fillRect(areaX, ry + halfH - 22, bw, 22);
          txt(ctx, label + ' · m* = ' + mStar + ' m₀ · ' + (isCond ? 'N_c' : 'N_v') + ' = ' + fmtSci(Nval, 2) + ' cm⁻³',
            areaX + bw * 0.5, ry + halfH - 11, C.ink, 9.7, 'center', 700, MONO);
          ctx.restore();

          rr(ctx, areaX, ry, bw, halfH, 6);
          ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
        };

        drawSeatRoom(areaY, true, Nc, m.mn, 'DẢI DẪN (Ghế cho e⁻)');
        drawSeatRoom(areaY + halfH + gapMid, false, Nv, m.mp, 'DẢI HÓA TRỊ (Ghế cho h⁺)');

        // Dải chỉ thị vị trí E_Fi so với tâm vùng cấm E_mid ở giữa 2 khay (chế độ đơn giản)
        if (S.mode === 'simple') {
          const midBandY = areaY + halfH + gapMid * 0.5;
          const efiOff = clamp(-(shift / 55) * (gapMid * 0.34), -gapMid * 0.36, gapMid * 0.36);
          ln(ctx, areaX + 12, midBandY, areaX + bw - 12, midBandY, C.mut, 1, [4, 4]);
          txt(ctx, 'E_mid', areaX + 14, midBandY - 8, C.mut, 8.6, 'left', 600, MONO);
          const colShift = shift > 1 ? C.main : shift < -1 ? C.c2 : C.ink;
          ln(ctx, areaX + 70, midBandY + efiOff, areaX + bw - 12, midBandY + efiOff, colShift, 2.2);
          txt(ctx, 'E_Fi (' + (shift >= 0 ? '+' : '−') + Math.abs(shift).toFixed(1) + ' meV · Dịch ' + (shift >= 0 ? 'LÊN' : 'XUỐNG') + ')',
            areaX + bw * 0.55, midBandY + efiOff - (shift >= 0 ? 8 : -9), colShift, 9.2, 'center', 800, MONO);
        }

        // Đồng hồ 2 chiều đo ΔE_Fi bên phải
        const mx = areaX + bw + 10, mh = (areaH - 10) * 0.5;
        const targetEfi = clamp(0.5 + shift / 100, 0.05, 0.95);
        st.efiNeedle += (targetEfi - st.efiNeedle) * Math.min(1, dt * 8);
        const efiCol = shift > 1 ? C.main : shift < -1 ? C.c2 : C.ink;

        drawMeter(ctx, mx, areaY, meterW, mh, {
          title: 'LỆCH ΔE_Fi (mV)',
          val: (shift >= 0 ? '+' : '−') + Math.abs(shift).toFixed(1) + ' meV',
          sub: shift > 0 ? 'Dịch LÊN (gần E_c)' : 'Dịch XUỐNG (gần E_v)',
          subCol: efiCol,
          frac: st.efiNeedle,
          accent: efiCol,
          zones: [[0, 0.48, C.c2], [0.52, 1, C.main]]
        });

        const ratioNvNc = Nv / Nc;
        drawMeter(ctx, mx, areaY + mh + 10, meterW, mh, {
          title: 'TỶ SỐ N_v / N_c',
          val: ratioNvNc >= 1 ? ratioNvNc.toFixed(1) + '×' : '1 / ' + (1 / ratioNvNc).toFixed(1),
          sub: ratioNvNc > 1 ? 'N_v đông ghế hơn' : 'N_c đông ghế hơn',
          frac: clamp(0.5 + Math.log10(ratioNvNc) * 0.35, 0.05, 0.95),
          accent: ratioNvNc > 1 ? C.c2 : C.main
        });

        txt(ctx, m.full + ' ở ' + T + ' K: Để giữ n₀ = p₀, mức E_Fi phải dịch RA XA dải đông ghế hơn!',
          chX + 12, chY + 17, C.ink, 10.2, 'left', 700, MONO);
        txt(ctx, 'ΔE_Fi = ' + (shift >= 0 ? '+' : '−') + Math.abs(shift).toFixed(1) + ' meV',
          chX + chW - 12, chY + 17, efiCol, 10.5, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 4 — DONOR (P) & ACCEPTOR (B) TRONG SILICON (Mục 3.1–3.3)
   - Chế độ "Đơn giản" (mặc định): Mạng 3×3 nguyên tử Si với cặp thanh liên kết
     cộng hóa trị thực tế, tâm thế Si / P⁺ / B⁻ & hạt dẫn trôi theo E cực rõ.
   - Chế độ "Trường 2D": Trường mật độ liên kết 2D phân tầng đồng mức.
   ========================================================================== */
LABS.push({
  id: 'doping', name: 'Donor & Acceptor', no: '3.1–3.3', secs: [3],
  S: { mode: 'simple', view: 'trio', sample: 'donor', Edir: 'right' },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Thế chỗ mạng tinh thể Si — Si thuần vs Donor P (Loại n) vs Acceptor B (Loại p)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'view', seg: [['trio', '3 khung so sánh'], ['probe', 'Thăm dò điện trường E']] },
      { k: 'sample', seg: [['pure', 'Si thuần'], ['donor', 'Donor P (Loại n)'], ['acceptor', 'Acceptor B (Loại p)']] },
      { k: 'Edir', seg: [['off', 'E = 0'], ['right', 'E →']] }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32;
      const areaX = chX + 8, areaY = chY + topBar + 4, areaW = chW - 16, areaH = chH - topBar - 14;

      if (!st.init) {
        st.init = true;
        st.eU = 0.72; st.eV = 0.28;
        st.hC = 2; st.hR = 1; st.hCD = 0;
        st.ampNeedle = 0;
      }

      // Hàm vẽ 1 khung kính hiển vi 3×3 nguyên tử Si với nguyên tử tâm là Si / P⁺ / B⁻
      const drawDopantCell = (fx, fy, fw, fh, kind, eOn, label) => {
        const cols = 3, rows = 3;
        // Lưu ý chiều vật lý khi bật E →: electron (−) trôi SANG TRÁI, lỗ trống (+) trôi SANG PHẢI!
        const ePosU = kind === 'donor' ? (eOn ? (0.93 - ((t * 0.40) % 0.86)) : (0.5 + 0.24 * Math.cos(t * 2.4))) : -10;
        const ePosV = kind === 'donor' ? (eOn ? (0.28 + 0.06 * Math.sin(t * 4)) : (0.5 + 0.22 * Math.sin(t * 2.4))) : -10;
        const hPosU = kind === 'acceptor' ? (eOn ? (0.07 + ((t * 0.34) % 0.86)) : (0.5 + 0.22 * Math.cos(t * 2.1 + 1))) : -10;
        const hPosV = kind === 'acceptor' ? (eOn ? (0.72 + 0.05 * Math.cos(t * 4)) : (0.5 + 0.20 * Math.sin(t * 2.1 + 1))) : -10;

        ctx.save();
        rr(ctx, fx, fy, fw, fh, 6);
        ctx.clip();

        const nPos = (c, r) => ({
          x: fx + ((c + 0.5) / cols) * fw,
          y: fy + ((r + 0.5) / rows) * (fh - 22)
        });

        if (S.mode === 'field') {
          const resW = clamp(Math.round(fw * 0.5), 96, 170);
          const resH = clamp(Math.round(fh * 0.5), 90, 155);
          renderWaveField(ctx, fx, fy, fw, fh, resW, resH, (u, v) => {
            const gx = u * cols, gy = v * rows;
            const dx = (gx - Math.floor(gx)) - 0.5, dy = (gy - Math.floor(gy)) - 0.5;
            const bH = Math.exp(-Math.abs(dy) * 4.8) * (0.35 + 0.45 * Math.pow(Math.sin(gx * Math.PI), 2));
            const bV = Math.exp(-Math.abs(dx) * 4.8) * (0.35 + 0.45 * Math.pow(Math.sin(gy * Math.PI), 2));
            let val = Math.max(bH, bV) * 0.85;
            if (kind === 'donor') {
              const de = Math.hypot(u - ePosU, v - ePosV);
              if (de < 0.22) val = Math.max(val, Math.exp(-de / 0.085) * 1.1);
            } else if (kind === 'acceptor') {
              const dh = Math.hypot(u - hPosU, v - hPosV);
              if (dh < 0.19) return -clamp(Math.exp(-dh / 0.08) * 1.05, 0, 1);
            }
            return clamp(val, 0, 1);
          });
        } else {
          drawSimpleGrid(ctx, fx, fy, fw, fh, 28);
          let bi = 0;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const p1 = nPos(c, r);
              if (c + 1 < cols) {
                const broken = kind === 'acceptor' && !eOn && c === 1 && r === 1;
                drawCovBond(ctx, p1.x, p1.y, nPos(c + 1, r).x, nPos(c + 1, r).y, broken, t, bi++);
              }
              if (r + 1 < rows) {
                drawCovBond(ctx, p1.x, p1.y, nPos(c, r + 1).x, nPos(c, r + 1).y, false, t, bi++);
              }
            }
          }
        }

        // Lưới 3×3 hạt nhân (tâm là Si, P⁺ cố định hoặc B⁻ cố định)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const pt = nPos(c, r);
            const isCenter = c === 1 && r === 1;
            if (isCenter && kind === 'donor') {
              drawNucleus(ctx, pt.x, pt.y, 12.0, COL_HOT, '#120f17');
              txt(ctx, 'P⁺', pt.x, pt.y + 0.5, '#0f0c14', 10.5, 'center', 800, MONO);
            } else if (isCenter && kind === 'acceptor') {
              drawNucleus(ctx, pt.x, pt.y, 12.0, COL_CYAN, '#120f17');
              txt(ctx, 'B⁻', pt.x, pt.y + 0.5, '#0f0c14', 10.5, 'center', 800, MONO);
            } else if (S.mode === 'simple') {
              dot(ctx, pt.x, pt.y, 10.5, C.card);
              ctx.beginPath(); ctx.arc(pt.x, pt.y, 10.5, 0, TAU);
              ctx.strokeStyle = C.g; ctx.lineWidth = 1.4; ctx.stroke();
              txt(ctx, 'Si', pt.x, pt.y + 0.5, C.ink, 8.8, 'center', 700, MONO);
            } else {
              drawNucleus(ctx, pt.x, pt.y, 6.2, '#ffffff', '#120f17');
              txt(ctx, 'Si', pt.x, pt.y + 0.5, '#120f17', 7.5, 'center', 800, MONO);
            }
          }
        }

        // Vẽ electron tự do của Donor hoặc lỗ trống tự do của Acceptor
        if (kind === 'donor') {
          const ex_ = fx + ePosU * fw, ey_ = fy + ePosV * (fh - 22);
          glowDot(ctx, ex_, ey_, 5.2, '#fef1b6', hexA(COL_WARM, 0.95));
          dot(ctx, ex_, ey_, 4.6, COL_WARM);
          txt(ctx, '−', ex_, ey_ + 0.5, '#0f0c14', 9, 'center', 800, MONO);
          txt(ctx, eOn ? '← e⁻' : 'e⁻ tự do', ex_, ey_ - 13, C.main, 9.2, 'center', 800, MONO);
        } else if (kind === 'acceptor' && (S.mode === 'field' || eOn)) {
          const hx = fx + hPosU * fw, hy = fy + hPosV * (fh - 22);
          ctx.beginPath(); ctx.arc(hx, hy, 9.5, 0, TAU);
          ctx.strokeStyle = COL_ICE; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
          txt(ctx, '+', hx, hy + 0.5, COL_ICE, 10, 'center', 800, MONO);
          txt(ctx, eOn ? 'h⁺ →' : 'h⁺', hx, hy - 14, C.c2, 9.2, 'center', 800, MONO);
        }

        if (eOn) {
          arrow(ctx, fx + fw * 0.34, fy + 15, fx + fw * 0.66, fy + 15, C.main, 2.0);
          txt(ctx, 'E →', fx + fw * 0.5, fy + 27, C.main, 9.2, 'center', 800, MONO);
        }

        ctx.fillStyle = 'rgba(15, 12, 20, 0.82)';
        ctx.fillRect(fx, fy + fh - 22, fw, 22);
        txt(ctx, label, fx + fw * 0.5, fy + fh - 11, C.ink, 9.4, 'center', 700, MONO);
        ctx.restore();

        rr(ctx, fx, fy, fw, fh, 6);
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
      };

      if (S.view === 'trio') {
        const gap = 10;
        const cw = (areaW - gap * 2) / 3;
        drawDopantCell(areaX, areaY, cw, areaH, 'pure', false, 'Si thuần (4 e⁻): 4 liên kết kín');
        drawDopantCell(areaX + cw + gap, areaY, cw, areaH, 'donor', false, 'Donor P (5 e⁻): Dư e⁻ · Ion P⁺ cố định');
        drawDopantCell(areaX + (cw + gap) * 2, areaY, cw, areaH, 'acceptor', false, 'Acceptor B (3 e⁻): Sinh h⁺ · Ion B⁻ cố định');

        txt(ctx, 'Pha tạp thay thế trong Silicon: Donor cho e⁻ (không tạo h⁺) · Acceptor tạo h⁺ (không tạo e⁻)',
          chX + 12, chY + 17, C.ink, 10.2, 'left', 700, MONO);
        txt(ctx, 'Tổng điện tích mẫu = 0 (Trung hòa)', chX + chW - 12, chY + 17, C.c1, 10.3, 'right', 700, MONO);
      } else {
        const meterW = 126;
        const bw = areaW - meterW - 10;
        const eOn = S.Edir === 'right';
        const lbl = S.sample === 'pure' ? 'Si thuần: Hầu như không có hạt tự do → Dòng I ≈ 0'
          : S.sample === 'donor' ? 'Loại n: P⁺ khóa tại nút mạng · e⁻ tự do trôi ngược E → Dòng I mạnh!'
          : 'Loại p: B⁻ khóa tại nút mạng · Lỗ trống h⁺ trôi cùng E → Dòng I mạnh!';
        drawDopantCell(areaX, areaY, bw, areaH, S.sample, eOn, lbl);

        const mx = areaX + bw + 10, mh = (areaH - 10) * 0.5;
        const curTarget = (!eOn || S.sample === 'pure') ? 0.04 : (S.sample === 'donor' ? 0.86 : 0.62);
        st.ampNeedle += (curTarget - st.ampNeedle) * Math.min(1, dt * 8);

        drawMeter(ctx, mx, areaY, meterW, mh, {
          title: 'AMPE KẾ DÒNG I',
          val: (!eOn || S.sample === 'pure') ? 'I ≈ 0' : (S.sample === 'donor' ? 'Dòng e⁻ (n)' : 'Dòng h⁺ (p)'),
          sub: S.sample === 'donor' ? 'μ_n > μ_p (chạy nhanh)' : S.sample === 'acceptor' ? 'Lỗ trống dẫn chính' : 'Cách điện gần hoàn toàn',
          frac: st.ampNeedle,
          accent: S.sample === 'donor' ? C.main : S.sample === 'acceptor' ? C.c2 : C.mut
        });

        drawMeter(ctx, mx, areaY + mh + 10, meterW, mh, {
          title: 'ĐIỆN TÍCH TỔNG',
          val: 'ΣQ = 0',
          sub: S.sample === 'donor' ? '1 P⁺ + 1 e⁻ = 0' : S.sample === 'acceptor' ? '1 B⁻ + 1 h⁺ = 0' : 'Mọi nút trung hòa',
          subCol: C.c1,
          frac: 0.5,
          accent: C.c1,
          zones: [[0.45, 0.55, C.c1]]
        });

        txt(ctx, 'Thăm dò mẫu ' + (S.sample === 'pure' ? 'Si thuần' : S.sample === 'donor' ? 'Loại n (Donor P)' : 'Loại p (Acceptor B)') + ' · ' + (eOn ? 'Đã bật E →' : 'Tắt điện trường'),
          chX + 12, chY + 17, C.ink, 10.3, 'left', 700, MONO);
        txt(ctx, 'Mẫu luôn trung hòa điện!', chX + chW - 12, chY + 17, C.c1, 10.3, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 5 — MÔ HÌNH BOHR MỞ RỘNG & NĂNG LƯỢNG ION HÓA E_i (Mục 3.4)
   - Chế độ "Đơn giản" (mặc định): Quỹ đạo Bohr rõ nét cùng hạt quay trên lưới
     tinh thể Si 5.43 Å đúng tỉ lệ 1 nm (+ ô phóng ×30 cho H).
   - Chế độ "Trường 2D": Đám mây xác suất 1s phân tầng đồng mức.
   ========================================================================== */
LABS.push({
  id: 'bohr', name: 'Bohr mở rộng', no: '3.4', secs: [],
  S: { mode: 'simple', view: 'trio', er: 11.7, mStar: 0.26 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Mô hình Bohr mở rộng cùng tỉ lệ 1 nm — Vì sao tạp chất dễ ion hóa (E_i ≪ E_g)?',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'view', seg: [['trio', '3 khung cùng tỉ lệ (1 nm)'], ['tune', 'Tinh chỉnh ε_r & m*']] },
      { k: 'er', l: 'Điện môi ε_r', min: 1.0, max: 18.0, step: 0.1, f: v => v.toFixed(1) },
      { k: 'mStar', l: 'm* / m₀', min: 0.06, max: 1.0, step: 0.01, f: v => v.toFixed(2) },
      { btn: 'H chân không', fn: p => { p.S.view = 'tune'; p.S.er = 1.0; p.S.mStar = 1.0; p.syncCtrls(); queueReact(p.tab, 'er'); } },
      { btn: 'Donor Si', fn: p => { p.S.view = 'tune'; p.S.er = 11.7; p.S.mStar = 0.26; p.syncCtrls(); queueReact(p.tab, 'er'); } },
      { btn: 'Donor GaAs', fn: p => { p.S.view = 'tune'; p.S.er = 13.1; p.S.mStar = 0.067; p.syncCtrls(); queueReact(p.tab, 'er'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32;
      const areaX = chX + 8, areaY = chY + topBar + 4, areaW = chW - 16, areaH = chH - topBar - 14;

      if (st.rNeedle == null) { st.rNeedle = 0.4; st.eNeedle = 0.2; }

      // Hàm vẽ 1 khung Bohr 1s trên lưới Si 5.43 Å (cả 2 chế độ: Đơn giản & Trường 2D)
      const drawBohrPanel = (fx, fy, fw, fh, rAng, sign, showLattice, showInset, coreChar, label) => {
        const spanA = 90.0;
        const pxPerA = Math.min(fw, fh) / spanA;
        const cx = fx + fw * 0.5, cy = fy + (fh - 22) * 0.5;
        const aspect = fw / Math.max(fh, 1);
        const pulse = 1 + 0.025 * Math.sin(t * 2.6);
        const orbCol = sign > 0 ? COL_WARM : COL_CYAN;

        ctx.save();
        rr(ctx, fx, fy, fw, fh, 6);
        ctx.clip();

        const radPx = rAng * pxPerA;
        if (S.mode === 'field') {
          const resW = clamp(Math.round(fw * 0.5), 96, 190);
          const resH = clamp(Math.round(fh * 0.5), 90, 170);
          const rDrawA = Math.max(rAng, 1.4);
          renderWaveField(ctx, fx, fy, fw, fh, resW, resH, (u, v) => {
            const xA = (u - 0.5) * spanA * aspect;
            const yA = (v - 0.5) * spanA;
            const distA = Math.hypot(xA, yA);
            const psi = Math.exp(-distA / (rDrawA * 0.82 * pulse));
            return sign * clamp(psi * 1.05, 0, 1);
          });
        } else {
          drawSimpleGrid(ctx, fx, fy, fw, fh, 28);
          // Vầng sáng cực nhẹ bên trong quỹ đạo Bohr để giữ chiều sâu mà không rối mắt
          if (radPx >= 3) {
            const gOrb = ctx.createRadialGradient(cx, cy, 0, cx, cy, radPx * 1.35);
            gOrb.addColorStop(0, hexA(orbCol, 0.20));
            gOrb.addColorStop(0.75, hexA(orbCol, 0.07));
            gOrb.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gOrb;
            ctx.beginPath(); ctx.arc(cx, cy, radPx * 1.35, 0, TAU); ctx.fill();
          }
        }

        // Lưới nguyên tử Si (5.43 Å) làm nền đối chiếu kích thước thực
        if (showLattice) {
          const stepPx = 5.43 * pxPerA;
          const nx = Math.ceil(fw / (2 * stepPx)) + 1;
          const ny = Math.ceil(fh / (2 * stepPx)) + 1;
          for (let iy = -ny; iy <= ny; iy++) {
            for (let ix = -nx; ix <= nx; ix++) {
              if (ix === 0 && iy === 0) continue;
              dot(ctx, cx + ix * stepPx, cy + iy * stepPx, S.mode === 'simple' ? 1.8 : 1.4,
                S.mode === 'simple' ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.52)');
            }
          }
        }

        // Vòng quỹ đạo Bohr hiệu dụng r₁ = a*
        if (radPx >= 3) {
          ctx.beginPath(); ctx.arc(cx, cy, radPx, 0, TAU);
          ctx.strokeStyle = S.mode === 'simple' ? orbCol : 'rgba(255,255,255,0.82)';
          ctx.lineWidth = S.mode === 'simple' ? 1.8 : 1.2;
          if (S.mode === 'field') ctx.setLineDash([4, 3]);
          ctx.stroke(); ctx.setLineDash([]);

          if (S.mode === 'simple') {
            // Hạt quay trên quỹ đạo Bohr + mũi tên ghi bán kính r₁
            const ang = t * (sign > 0 ? 1.8 : -1.5);
            const ox = cx + Math.cos(ang) * radPx, oy = cy + Math.sin(ang) * radPx;
            glowDot(ctx, ox, oy, 4.4, sign > 0 ? '#fef1b6' : '#dafefe', hexA(orbCol, 0.95));
            dot(ctx, ox, oy, 4.0, orbCol);
            txt(ctx, sign > 0 ? '−' : '+', ox, oy + 0.5, '#0f0c14', 8.5, 'center', 800, MONO);
            const rLab = Math.min(radPx, Math.min(fw, fh) * 0.42);
            arrow(ctx, cx + 6, cy, cx + rLab - 2, cy, hexA(C.ink, 0.72), 1.2, [3, 3]);
            txt(ctx, 'r₁=' + rAng.toFixed(1) + 'Å', cx + rLab * 0.52, cy - 9, C.ink, 8.6, 'center', 700, MONO);
          }
        }

        // Lõi hạt nhân tâm
        drawNucleus(ctx, cx, cy, coreChar ? 6.6 : 3.4,
          coreChar === '+' ? COL_HOT : coreChar === '−' ? COL_CYAN : '#fef1b6', '#120f17');
        if (coreChar) txt(ctx, coreChar, cx, cy + 0.5, '#0f0c14', 9.5, 'center', 800, MONO);

        // Ô phóng to ×30 cho nguyên tử Hydro
        if (showInset) {
          const isz = clamp(Math.min(fw, fh) * 0.34, 46, 68);
          const ix = fx + fw - isz - 8, iy = fy + 8;
          ctx.save();
          rr(ctx, ix, iy, isz, isz, 4);
          ctx.clip();
          if (S.mode === 'field') {
            renderWaveField(ctx, ix, iy, isz, isz, 54, 54, (u, v) => {
              const d = Math.hypot(u - 0.5, v - 0.5);
              return clamp(Math.exp(-d / 0.16) * 1.05, 0, 1);
            });
          } else {
            ctx.fillStyle = NIGHT_BG; ctx.fillRect(ix, iy, isz, isz);
            const icx = ix + isz * 0.5, icy = iy + isz * 0.5, ir = isz * 0.34;
            ctx.beginPath(); ctx.arc(icx, icy, ir, 0, TAU);
            ctx.strokeStyle = COL_WARM; ctx.lineWidth = 1.4; ctx.stroke();
            dot(ctx, icx + Math.cos(t * 3.5) * ir, icy + Math.sin(t * 3.5) * ir, 2.8, '#fef1b6');
          }
          drawNucleus(ctx, ix + isz * 0.5, iy + isz * 0.5, 2.8, '#ffffff', '#120f17');
          ctx.restore();
          rr(ctx, ix, iy, isz, isz, 4);
          ctx.strokeStyle = C.g; ctx.lineWidth = 1.1; ctx.stroke();
          ln(ctx, cx + 3, cy - 3, ix, iy + isz, C.mut, 1.0, [3, 3]);
          txt(ctx, 'phóng ×30', ix + isz * 0.5, iy + isz + 9, C.mut, 8.6, 'center', 700, MONO);
        }

        // Thước đo vật lý 1 nm (10 Å) ở góc dưới trái
        const nmPx = 10 * pxPerA;
        const barY = fy + fh - 32;
        ln(ctx, fx + 10, barY, fx + 10 + nmPx, barY, '#ffffff', 2.0);
        txt(ctx, '1 nm', fx + 14 + nmPx, barY, '#ffffff', 9.0, 'left', 700, MONO);

        ctx.fillStyle = 'rgba(15, 12, 20, 0.82)';
        ctx.fillRect(fx, fy + fh - 22, fw, 22);
        txt(ctx, label, fx + fw * 0.5, fy + fh - 11, C.ink, 9.4, 'center', 700, MONO);
        ctx.restore();

        rr(ctx, fx, fy, fw, fh, 6);
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
      };

      if (S.view === 'trio') {
        const gap = 10;
        const cw = (areaW - gap * 2) / 3;
        drawBohrPanel(areaX, areaY, cw, areaH, 0.53, 1, false, true, '', 'Hydro H: a₀ = 0.53 Å · E_i = 13.6 eV');
        drawBohrPanel(areaX + cw + gap, areaY, cw, areaH, 23.9, 1, true, false, '+', 'Donor P (Si): a* = 23.9 Å · 25.8 meV');
        drawBohrPanel(areaX + (cw + gap) * 2, areaY, cw, areaH, 12.6, -1, true, false, '−', 'Acceptor B (Si): a* = 12.6 Å · 48.7 meV');

        txt(ctx, 'Cùng một tỉ lệ thước 1 nm: Quầng electron Donor P rộng gấp 45 lần nguyên tử Hydro (bao trùm ~4.4 ô mạng Si)!',
          chX + 12, chY + 17, C.ink, 10.2, 'left', 700, MONO);
        txt(ctx, 'r₁ = a₀·ε_r·(m₀/m*)', chX + chW - 12, chY + 17, C.main, 10.3, 'right', 700, MONO);
      } else {
        const meterW = 128;
        const bw = areaW - meterW - 10;
        const r1 = A0_BOHR * S.er / S.mStar;
        const Ei_meV = (EH_EV * S.mStar / (S.er * S.er)) * 1000;
        const isVac = S.er < 1.5;

        drawBohrPanel(areaX, areaY, bw, areaH, r1, 1, !isVac, isVac, isVac ? '' : '+',
          'r₁ = ' + r1.toFixed(1) + ' Å (' + (r1 / 5.43).toFixed(1) + ' ô mạng Si)  ·  E_i = ' +
          (Ei_meV >= 1000 ? (Ei_meV / 1000).toFixed(2) + ' eV' : Ei_meV.toFixed(1) + ' meV'));

        const mx = areaX + bw + 10, mh = (areaH - 10) * 0.5;
        st.rNeedle += (clamp(lg10(r1 / 0.5) / 2.6, 0, 1) - st.rNeedle) * Math.min(1, dt * 8);
        st.eNeedle += (clamp(lg10(Math.max(Ei_meV, 1)) / 4.2, 0, 1) - st.eNeedle) * Math.min(1, dt * 8);

        drawMeter(ctx, mx, areaY, meterW, mh, {
          title: 'BÁN KÍNH r₁ (a*)',
          val: r1.toFixed(r1 < 10 ? 2 : 1) + ' Å',
          sub: (r1 / A0_BOHR).toFixed(0) + '× a₀ (' + (r1 / 5.43).toFixed(1) + ' a)',
          frac: st.rNeedle,
          accent: C.main
        });

        drawMeter(ctx, mx, areaY + mh + 10, meterW, mh, {
          title: 'NĂNG LƯỢNG E_i',
          val: Ei_meV >= 1000 ? (Ei_meV / 1000).toFixed(2) + ' eV' : Ei_meV.toFixed(1) + ' meV',
          sub: Ei_meV <= 60 ? '≈ kT → Dễ ion hóa!' : 'Liên kết chặt',
          subCol: Ei_meV <= 60 ? C.c1 : C.err,
          frac: st.eNeedle,
          accent: Ei_meV <= 60 ? C.c1 : C.err,
          zones: [[0, 0.42, C.c1], [0.42, 0.72, C.main], [0.72, 1, C.err]]
        });

        txt(ctx, 'ε_r = ' + S.er.toFixed(1) + '  |  m* = ' + S.mStar.toFixed(3) + ' m₀  |  So với kT(300K) = 25.9 meV',
          chX + 12, chY + 17, C.ink, 10.3, 'left', 700, MONO);
        txt(ctx, 'E_i = 13.6·(m*/m₀)/ε_r²', chX + chW - 12, chY + 17, C.main, 10.3, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 6 — ĐẾM HẠT THỰC TRONG KHỐI SILICON CẠNH 100 nm (Mục 3.5)
   - Chế độ "Đơn giản" (mặc định): Khối lập phương Silicon 3D wireframe sạch
     sẽ đếm rõ từng ion P⁺ & hạt e⁻ tự do bên trong thể tích (100 nm)³.
   - Chế độ "Trường 2D": Nền mật độ Inferno chồng lấn tăng dần theo N_D.
   ========================================================================== */
LABS.push({
  id: 'cube', name: 'Khối Si 100 nm', no: '3.5', secs: [],
  S: { mode: 'simple', view: 'quad', Nd: 1e17 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng đếm hạt thực trong khối Si cạnh 100 nm (V = 10⁻¹⁵ cm³ · 5×10⁷ nguyên tử Si)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'view', seg: [['quad', '4 khối so sánh'], ['live', 'Quét nồng độ N_D']] },
      { k: 'Nd', l: 'Nồng độ N_D', min: 15, max: 18, step: 0.1, log: 1, f: v => fmtPow(v) }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const NI_BOX = 1.0e10; // Khớp chính xác Mục 3.5 bài học (10¹⁰ cm⁻³ → 0.00001 e⁻ trong khối)
      const VOL = 1e-15;     // (100 nm)³ = 10⁻¹⁵ cm³
      const N_SI_BOX = 5e7;  // 5×10⁷ nguyên tử Si trong khối 100 nm

      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32;
      const areaX = chX + 8, areaY = chY + topBar + 4, areaW = chW - 16, areaH = chH - topBar - 14;

      if (!st.pool) {
        const rg = mkRng(3535);
        st.pool = Array.from({ length: 240 }, () => ({
          du: 0.08 + rg() * 0.84, dv: 0.08 + rg() * 0.78,
          eu: rg(), ev: rg(), vx: (rg() - 0.5) * 0.35, vy: (rg() - 0.5) * 0.35
        }));
        st.eNeedle = 0.5; st.pNeedle = 0.2;
      }

      const drawCubeBox = (fx, fy, fw, fh, ndVal, title, countTxt) => {
        const nDots = ndVal <= 0 ? 0 : clamp(Math.round(ndVal * VOL), 0, 220);
        const density = ndVal <= 0 ? 0 : clamp((lg10(ndVal) - 15) / 3.2, 0.15, 1.0);

        ctx.save();
        rr(ctx, fx, fy, fw, fh, 6);
        ctx.clip();

        if (S.mode === 'field' && density > 0) {
          const resW = clamp(Math.round(fw * 0.38), 72, 160);
          const resH = clamp(Math.round(fh * 0.38), 72, 140);
          const nClus = Math.min(nDots, 28);
          const aspect = fw / Math.max(fh, 1);
          renderWaveField(ctx, fx, fy, fw, fh, resW, resH, (u, v) => {
            let s = 0;
            for (let i = 0; i < nClus; i++) {
              const d = Math.hypot((u - st.pool[i].du) * aspect, v - st.pool[i].dv);
              if (d < 0.28) s += Math.exp(-d / (0.045 + density * 0.03));
            }
            return clamp((1 - Math.exp(-s * 0.9)) * (0.55 + density * 0.45), 0, 1);
          });
        } else {
          drawSimpleGrid(ctx, fx, fy, fw, fh, 26);
        }

        // Khung khối lập phương 3D chiếu xiên (Chế độ Đơn giản)
        const inX = fx + 12, inY = fy + 30, inW = fw - 24, inH = fh - 66;
        if (S.mode === 'simple') {
          const d = clamp(Math.min(inW, inH) * 0.12, 8, 18);
          // Mặt sau (nét đứt mờ)
          ctx.strokeStyle = hexA(C.g, 0.55); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
          ctx.strokeRect(inX + d, inY, inW - d, inH - d);
          ctx.setLineDash([]);
          // Các cạnh nối 3D
          ln(ctx, inX, inY + d, inX + d, inY, hexA(C.g, 0.7), 1);
          ln(ctx, inX + inW - d, inY + d, inX + inW, inY, hexA(C.g, 0.7), 1);
          ln(ctx, inX, inY + inH, inX + d, inY + inH - d, hexA(C.g, 0.55), 1, [3, 3]);
          ln(ctx, inX + inW - d, inY + inH, inX + inW, inY + inH - d, hexA(C.g, 0.7), 1);
          // Mặt trước khối 100 nm
          ctx.strokeStyle = hexA(C.mut, 0.75); ctx.lineWidth = 1.2;
          ctx.strokeRect(inX, inY + d, inW - d, inH - d);
          txt(ctx, '100 nm', inX + (inW - d) * 0.5, inY + inH + 7, C.mut, 8.2, 'center', 600, MONO);
        } else {
          // Lưới mờ đại diện hàng chục triệu nguyên tử Si nền
          for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
              dot(ctx, fx + ((c + 0.5) / 6) * fw, fy + ((r + 0.5) / 6) * (fh - 34) + 12, 1.2, 'rgba(255,255,255,0.22)');
            }
          }
        }

        // Ion donor P⁺ cố định & Electron tự do chuyển động thực trong khối 100 nm
        const rDot = nDots > 100 ? 1.9 : nDots > 25 ? 2.6 : 3.6;
        for (let i = 0; i < nDots; i++) {
          const pt = st.pool[i];
          dot(ctx, inX + 4 + pt.du * (inW - 8), inY + 6 + pt.dv * (inH - 12), rDot, hexA(COL_HOT, 0.85));
          const eu = ((pt.eu + t * pt.vx) % 1 + 1) % 1;
          const ev = ((pt.ev + t * pt.vy) % 1 + 1) % 1;
          dot(ctx, inX + 4 + eu * (inW - 8), inY + 6 + ev * (inH - 12), rDot, '#fef1b6');
        }

        // Thanh tiêu đề trên & số hạt đếm dưới đáy hộp
        ctx.fillStyle = 'rgba(15, 12, 20, 0.78)';
        ctx.fillRect(fx, fy, fw, 20);
        txt(ctx, title, fx + fw * 0.5, fy + 10, C.ink, 9.6, 'center', 700, MONO);

        ctx.fillStyle = 'rgba(15, 12, 20, 0.84)';
        ctx.fillRect(fx, fy + fh - 24, fw, 24);
        txt(ctx, countTxt, fx + fw * 0.5, fy + fh - 12, ndVal > 0 ? C.main : C.mut, 9.8, 'center', 800, MONO);
        ctx.restore();

        rr(ctx, fx, fy, fw, fh, 6);
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
      };

      if (S.view === 'quad') {
        const gap = 8;
        const cw = (areaW - gap * 3) / 4;
        drawCubeBox(areaX, areaY, cw, areaH, 0, 'Si tinh khiết', '0.00001 e⁻');
        drawCubeBox(areaX + (cw + gap), areaY, cw, areaH, 1e16, 'N_D = 10¹⁶', '10 e⁻ (+10⁶×)');
        drawCubeBox(areaX + (cw + gap) * 2, areaY, cw, areaH, 1e17, 'N_D = 10¹⁷', '100 e⁻ (+10⁷×)');
        drawCubeBox(areaX + (cw + gap) * 3, areaY, cw, areaH, 1e18, 'N_D = 10¹⁸', '1000 e⁻ (+10⁸×)');

        txt(ctx, 'Mỗi khối cạnh 100 nm chứa 5×10⁷ nguyên tử Si: Chỉ thêm 10 donor đã làm e⁻ tăng một triệu lần!',
          chX + 12, chY + 17, C.ink, 10.2, 'left', 700, MONO);
        txt(ctx, 'Vàng: e⁻ tự do · Cam đỏ: ion P⁺', chX + chW - 12, chY + 17, C.main, 10.2, 'right', 700, MONO);
      } else {
        const meterW = 128;
        const bw = areaW - meterW - 10;
        const nInBox = S.Nd * VOL;
        const siPerDon = N_SI_BOX / Math.max(nInBox, 1e-9);
        const p0 = (NI_BOX * NI_BOX) / S.Nd;

        drawCubeBox(areaX, areaY, bw, areaH, S.Nd,
          'Khối Si cạnh 100 nm · Pha N_D = ' + fmtPow(S.Nd) + ' cm⁻³',
          '≈ ' + (nInBox < 10 ? nInBox.toFixed(1) : Math.round(nInBox)) + ' e⁻ tự do · Cứ ' + fmtSci(siPerDon, 1) + ' nguyên tử Si mới có 1 donor P');

        const mx = areaX + bw + 10, mh = (areaH - 10) * 0.5;
        st.eNeedle += (clamp((lg10(S.Nd) - 15) / 3.0, 0, 1) - st.eNeedle) * Math.min(1, dt * 8);
        st.pNeedle += (clamp((lg10(p0) - 1) / 5.0, 0, 1) - st.pNeedle) * Math.min(1, dt * 8);

        drawMeter(ctx, mx, areaY, meterW, mh, {
          title: 'SỐ e⁻ TRONG KHỐI',
          val: (nInBox < 10 ? nInBox.toFixed(1) : Math.round(nInBox)) + ' hạt',
          sub: 'Gấp ' + fmtPow(S.Nd / NI_BOX) + ' lần nᵢ',
          frac: st.eNeedle,
          accent: C.main
        });

        drawMeter(ctx, mx, areaY + mh + 10, meterW, mh, {
          title: 'LỖ TRỐNG BỊ KÌM p₀',
          val: fmtSci(p0, 1) + ' cm⁻³',
          sub: 'p₀ = nᵢ²/n₀ (≈0/khối)',
          frac: st.pNeedle,
          accent: C.c2
        });

        txt(ctx, 'Thể tích khối V = (100 nm)³ = 10⁻¹⁵ cm³ (5×10⁷ nguyên tử Si) · Tỷ lệ tạp chất = ' + fmtSci(S.Nd / 5e22, 1),
          chX + 12, chY + 17, C.ink, 10.2, 'left', 700, MONO);
        txt(ctx, 'n₀ ≈ N_D · p₀ bị kìm!', chX + chW - 12, chY + 17, C.main, 10.3, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 7 — PHA TẠP BÁN DẪN HỢP CHẤT NHÓM III–V: GaAs (Mục 3.6)
   - Chế độ "Đơn giản" (mặc định): Mạng 5×3 Ga–As nối bằng cặp liên kết cộng
     hóa trị rõ nét, thấy ngay số e⁻ thừa hoặc số liên kết thiếu quanh tạp chất.
   - Chế độ "Trường 2D": Trường mật độ liên kết 2D phân tầng đồng mức.
   ========================================================================== */
const GAAS_IMP = {
  si: { sym: 'Si', name: 'Silicon (Nhóm IV · lưỡng tính)', val: 4, eiGa: 5.8,  eiAs: 34.5, pref: 'ga' },
  ge: { sym: 'Ge', name: 'Germanium (Nhóm IV · lưỡng tính)', val: 4, eiGa: 6.1,  eiAs: 40.4, pref: 'as' },
  se: { sym: 'Se', name: 'Selen (Nhóm VI)',                 val: 6, eiGa: null, eiAs: 5.9,  pref: 'as' },
  zn: { sym: 'Zn', name: 'Kẽm (Nhóm II)',                   val: 2, eiGa: 30.7, eiAs: null, pref: 'ga' }
};

LABS.push({
  id: 'gaas', name: 'Pha tạp GaAs', no: '3.6', secs: [],
  S: { mode: 'simple', imp: 'si', site: 'ga' },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Mạng hợp chất III–V (GaAs) — Quy tắc thế chỗ Ga (3e⁻) / As (5e⁻) & Lưỡng tính',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'imp', seg: [['si', 'Si (IV·4e)'], ['ge', 'Ge (IV·4e)'], ['se', 'Se (VI·6e)'], ['zn', 'Zn (II·2e)']] },
      { k: 'site', seg: [['ga', 'Thế Ga (III·3e)'], ['as', 'Thế As (V·5e)']] },
      { btn: 'Si→Ga (Donor)', fn: p => { p.S.imp = 'si'; p.S.site = 'ga'; p.syncCtrls(); queueReact(p.tab, 'imp'); } },
      { btn: 'Ge→As (Acceptor)', fn: p => { p.S.imp = 'ge'; p.S.site = 'as'; p.syncCtrls(); queueReact(p.tab, 'imp'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const imp = GAAS_IMP[S.imp] || GAAS_IMP.si;
      const hostVal = S.site === 'ga' ? 3 : 5;
      const hostSym = S.site === 'ga' ? 'Ga' : 'As';
      const dZ = imp.val - hostVal; // >0 Donor, <0 Acceptor
      const isDonor = dZ > 0;
      const eiTable = S.site === 'ga' ? imp.eiGa : imp.eiAs;

      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32, meterW = 126;
      const bx = chX + 10, by = chY + topBar + 4, bw = chW - meterW - 30, bh = chH - topBar - 14;

      if (st.zNeedle == null) { st.zNeedle = 0.75; st.eNeedle = 0.2; }

      const cols = 5, rows = 3;
      const cMid = 2, rMid = 1;
      const eU = isDonor ? (0.5 + 0.26 * Math.cos(t * 2.2)) : -10;
      const eV = isDonor ? (0.5 + 0.22 * Math.sin(t * 2.2)) : -10;
      const hU = !isDonor ? (0.5 + 0.24 * Math.cos(t * 1.9 + 0.8)) : -10;
      const hV = !isDonor ? (0.5 + 0.20 * Math.sin(t * 1.9 + 0.8)) : -10;

      ctx.save();
      rr(ctx, bx, by, bw, bh, 6);
      ctx.clip();

      const nPos = (c, r) => ({
        x: bx + ((c + 0.5) / cols) * bw + Math.sin(t * 10 + r * 3 + c) * 0.9,
        y: by + ((r + 0.5) / rows) * (bh - 22) + Math.cos(t * 11 + c * 4 + r) * 0.9
      });

      if (S.mode === 'field') {
        const resW = clamp(Math.round(bw * 0.45), 130, 200);
        const resH = clamp(Math.round(bh * 0.45), 86, 145);
        renderWaveField(ctx, bx, by, bw, bh, resW, resH, (u, v) => {
          const gx = u * cols, gy = v * rows;
          const dx = (gx - Math.floor(gx)) - 0.5, dy = (gy - Math.floor(gy)) - 0.5;
          const bH = Math.exp(-Math.abs(dy) * 4.8) * (0.32 + 0.42 * Math.pow(Math.sin(gx * Math.PI), 2));
          const bV = Math.exp(-Math.abs(dx) * 4.8) * (0.32 + 0.42 * Math.pow(Math.sin(gy * Math.PI), 2));
          let val = Math.max(bH, bV) * 0.78;
          if (isDonor) {
            const de = Math.hypot(u - eU, v - eV);
            if (de < 0.30) val = Math.max(val, Math.exp(-de / 0.115) * 1.12);
          } else {
            const dh = Math.hypot(u - hU, v - hV);
            if (dh < 0.22) return -clamp(Math.exp(-dh / 0.082) * 1.08, 0, 1);
          }
          return clamp(val, 0, 1);
        });
      } else {
        drawSimpleGrid(ctx, bx, by, bw, bh, 30);
        // Vẽ các cặp liên kết Ga–As rõ ràng; nếu là Acceptor thì làm đứt đúng |ΔZ| liên kết quanh tâm!
        const missingCnt = isDonor ? 0 : Math.min(Math.abs(dZ), 3);
        let bi = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const p1 = nPos(c, r);
            if (c + 1 < cols) {
              const brokenH = (!isDonor) && (
                (missingCnt >= 1 && c === cMid && r === rMid) ||
                (missingCnt >= 2 && c === cMid - 1 && r === rMid)
              );
              drawCovBond(ctx, p1.x, p1.y, nPos(c + 1, r).x, nPos(c + 1, r).y, brokenH, t, bi++);
            }
            if (r + 1 < rows) {
              const brokenV = (!isDonor) && (missingCnt >= 3 && c === cMid && r === rMid - 1);
              drawCovBond(ctx, p1.x, p1.y, nPos(c, r + 1).x, nPos(c, r + 1).y, brokenV, t, bi++);
            }
          }
        }
      }

      // Vẽ lưới 5×3 nút Ga (III) và As (V) xen kẽ, tâm là nguyên tử tạp chất
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = nPos(c, r);
          const isCenter = c === cMid && r === rMid;
          const sameParity = (c + r) % 2 === (cMid + rMid) % 2;
          const isGaNode = S.site === 'ga' ? sameParity : !sameParity;

          if (isCenter) {
            const charge = dZ > 0 ? (dZ === 1 ? '⁺' : toSup(dZ) + '⁺') : (dZ === -1 ? '⁻' : toSup(Math.abs(dZ)) + '⁻');
            drawNucleus(ctx, pt.x, pt.y, 13.0, isDonor ? COL_HOT : COL_CYAN, '#120f17');
            txt(ctx, imp.sym + charge, pt.x, pt.y + 0.5, '#0f0c14', 9.8, 'center', 800, MONO);
          } else if (S.mode === 'simple') {
            dot(ctx, pt.x, pt.y, 11.5, C.card);
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 11.5, 0, TAU);
            ctx.strokeStyle = isGaNode ? hexA(COL_WARM, 0.72) : hexA(COL_ICE, 0.72);
            ctx.lineWidth = 1.5; ctx.stroke();
            txt(ctx, isGaNode ? 'Ga' : 'As', pt.x, pt.y + 0.5, isGaNode ? '#fef1b6' : '#dafefe', 9.2, 'center', 700, MONO);
          } else {
            drawNucleus(ctx, pt.x, pt.y, 7.6, isGaNode ? '#fef1b6' : '#d6ecff', '#120f17');
            txt(ctx, isGaNode ? 'Ga' : 'As', pt.x, pt.y + 0.5, '#120f17', 8.0, 'center', 800, MONO);
          }
        }
      }

      // Hạt dẫn sinh ra bay lượn quanh tâm
      if (isDonor) {
        const nExtra = Math.abs(dZ);
        for (let k = 0; k < nExtra; k++) {
          const ang = t * 2.2 + (k * TAU) / nExtra;
          const ex_ = bx + (0.5 + 0.25 * Math.cos(ang)) * bw;
          const ey_ = by + (0.5 + 0.22 * Math.sin(ang)) * (bh - 22);
          glowDot(ctx, ex_, ey_, 5.2, '#fef1b6', hexA(COL_WARM, 0.95));
          dot(ctx, ex_, ey_, 4.6, COL_WARM);
          txt(ctx, '−', ex_, ey_ + 0.5, '#0f0c14', 9, 'center', 800, MONO);
          if (k === 0) txt(ctx, '+' + nExtra + ' e⁻ tự do', ex_, ey_ - 14, C.main, 9.5, 'center', 800, MONO);
        }
      } else if (S.mode === 'field') {
        const hx = bx + hU * bw, hy = by + hV * (bh - 22);
        ctx.beginPath(); ctx.arc(hx, hy, 10, 0, TAU);
        ctx.strokeStyle = COL_ICE; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, '+' + Math.abs(dZ) + ' lỗ trống', hx, hy - 14, C.c2, 9.5, 'center', 800, MONO);
      }

      const foot = eiTable != null
        ? imp.sym + ' thế chỗ ' + hostSym + ' → ' + (isDonor ? 'DONOR (Loại n)' : 'ACCEPTOR (Loại p)') + ' · E_i thực nghiệm = ' + eiTable.toFixed(1) + ' meV'
        : imp.sym + ' thế chỗ ' + hostSym + ' (ΔZ = ' + (dZ > 0 ? '+' : '') + dZ + ') — Thực tế ' + imp.sym + ' ưu tiên thế nút ' + (imp.pref === 'ga' ? 'Ga!' : 'As!');
      ctx.fillStyle = 'rgba(15, 12, 20, 0.82)';
      ctx.fillRect(bx, by + bh - 22, bw, 22);
      txt(ctx, foot, bx + bw * 0.5, by + bh - 11, eiTable != null ? C.ink : C.err, 9.6, 'center', 700, MONO);
      ctx.restore();

      rr(ctx, bx, by, bw, bh, 6);
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      // 2 đồng hồ kim cơ bên phải: Loại (Acceptor ← 0 → Donor) & E_i đo trong GaAs (Bảng 4.4)
      const mx = bx + bw + 10, mh = (bh - 10) * 0.5;
      const zTarget = clamp(0.5 + dZ * 0.16, 0.08, 0.92);
      const eTarget = eiTable != null ? clamp(eiTable / 45.0, 0.08, 0.95) : 0.95;
      st.zNeedle += (zTarget - st.zNeedle) * Math.min(1, dt * 8);
      st.eNeedle += (eTarget - st.eNeedle) * Math.min(1, dt * 8);

      drawMeter(ctx, mx, by, meterW, mh, {
        title: 'VAI TRÒ (p ← 0 → n)',
        val: isDonor ? 'DONOR (n)' : 'ACCEPTOR (p)',
        sub: 'ΔZ = ' + (dZ > 0 ? '+' : '') + dZ + ' e⁻ hóa trị',
        subCol: isDonor ? C.main : C.c2,
        frac: st.zNeedle,
        accent: isDonor ? C.main : C.c2,
        zones: [[0, 0.48, C.c2], [0.52, 1, C.main]]
      });

      drawMeter(ctx, mx, by + mh + 10, meterW, mh, {
        title: 'E_i TRONG GaAs',
        val: eiTable != null ? eiTable.toFixed(1) + ' meV' : 'Không ưu tiên',
        sub: eiTable != null ? (isDonor ? 'Rất nhỏ (m_n* nhẹ)' : 'Lớn hơn (m_p* nặng)') : 'Thế ' + (imp.pref === 'ga' ? 'Ga' : 'As') + ' mới bền',
        subCol: eiTable != null ? C.mut : C.err,
        frac: st.eNeedle,
        accent: eiTable != null ? (isDonor ? C.c1 : C.main) : C.err,
        zones: [[0, 0.25, C.c1], [0.25, 1, C.main]]
      });

      txt(ctx, imp.name + ' (' + imp.val + 'e⁻) thế nút ' + hostSym + ' (' + hostVal + 'e⁻) trong GaAs',
        chX + 12, chY + 17, C.ink, 10.3, 'left', 700, MONO);
      txt(ctx, isDonor ? 'LOẠI N (DONOR)' : 'LOẠI P (ACCEPTOR)',
        chX + chW - 12, chY + 17, isDonor ? C.main : C.c2, 10.5, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM (Cột phải — Intro + React gắn lý thuyết Buổi 5)
   ========================================================================== */
const LD = {};

LD.density = {
  intro: [
    ['i', 'Công thức trung tâm Mục 1: n₀ = N_c·e^(−(E_c−E_F)/kT) và p₀ = N_v·e^(−(E_F−E_v)/kT), trong đó N_c, N_v tỉ lệ theo (m*·T)^(3/2).'],
    ['w', 'Biển cam-vàng (Inferno) là electron tự do ở dải dẫn, biển xanh băng (Ice-Cyan) là lỗ trống ở dải hóa trị. Khi kéo E_F gần E_c thì n₀ vọt lên và p₀ tụt xuống tương ứng.'],
    ['w', 'Thử chuyển giữa Silicon và GaAs ở cùng khoảng cách E_c − E_F: vì m_n*(GaAs) = 0.067 m₀ rất nhẹ nên N_c(GaAs) nhỏ hơn Si gần 60 lần!'],
    ['v', 'Đẩy E_c − E_F xuống dưới 3kT để thấy cảnh báo giới hạn của xấp xỉ Boltzmann, hoặc kéo T để xem cả N_c(T), N_v(T) và kT cùng thay đổi.']
  ],
  react(S, k, P, say) {
    const m = MATS[S.mat], kT = kT_of(S.T);
    const Nc = Nc_of(m, S.T), Nv = Nv_of(m, S.T);
    const EcEf = clamp(S.EcEf, 0.05, m.Eg - 0.05), EfEv = m.Eg - EcEf;
    const n0 = Nc * ex(-EcEf / kT), p0 = Nv * ex(-EfEv / kT);
    const ok = EcEf >= 3 * kT && EfEv >= 3 * kT;
    say('v', `${m.name} (${S.T} K): N_c = ${fmtSci(Nc, 2)}, N_v = ${fmtSci(Nv, 2)} → n₀ = ${fmtSci(n0, 2)}, p₀ = ${fmtSci(p0, 2)} cm⁻³.`);
    if (!ok) say('w', 'E_F cách mép dải nhỏ hơn 3kT: xấp xỉ Boltzmann bắt đầu sai lệch (vượt quá ~5%).');
  }
};

LD.intrinsic = {
  intro: [
    ['i', 'Trong bán dẫn nội tại (tinh khiết), mỗi liên kết cộng hóa trị bị nhiệt làm đứt luôn tạo ra đúng 1 cặp electron – lỗ trống nên n₀ = p₀ = nᵢ.'],
    ['w', 'Quan sát 3 giai đoạn: ① Ở 0 K mọi liên kết đầy kín (cách điện); ② Nhiệt bứt 1 liên kết sinh khoang lỗ trống (+); ③ Electron loang rộng qua nhiều ô mạng còn lỗ trống nhảy sang liên kết bên!'],
    ['v', 'Chuyển sang "Kính hiển vi động", kéo nhiệt độ T từ 0 K lên 600 K hoặc bấm "Bắn Photon" để xem trực tiếp cơ chế đứt liên kết và tái hợp.']
  ],
  react(S, k, P, say) {
    if (k === 'photon') {
      say('v', 'Đã phóng photon năng lượng hν ≥ 1.12 eV: bứt gãy liên kết cộng hóa trị Si–Si tạo thêm 1 cặp e⁻ (vàng) & h⁺ (cyan).');
      return;
    }
    if (S.view === 'trio') {
      say('i', 'Ba giai đoạn sinh cặp nội tại: Liên kết đầy (0 K) → Đứt 1 liên kết → Tách rời thành sóng electron tự do và lỗ trống nhảy.');
    } else {
      const ni = S.T > 20 ? ni_of(MATS.si, S.T) : 0;
      say('v', `T = ${S.T} K (kT = ${(kT_of(S.T) * 1000).toFixed(1)} meV): nᵢ(Si) ≈ ${ni > 1 ? fmtSci(ni, 2) + ' cm⁻³' : '0 (cách điện)'}.`);
    }
  }
};

LD.efishift = {
  intro: [
    ['i', 'Nồng độ nội tại nᵢ = √(N_c·N_v)·e^(−E_g/2kT) cực kỳ nhạy với cả độ rộng vùng cấm E_g lẫn nhiệt độ T (ở Si quanh 300 K, tăng ~9 K là nᵢ tăng gấp đôi!).'],
    ['w', 'Ở cùng nhiệt độ: Ge (0.66 eV) có mật độ cặp nhiệt dày đặc nhất, Si (1.12 eV) ở mức giữa (~10¹⁰ cm⁻³ ở 300 K), còn GaAs (1.42 eV) thưa thớt nhất.'],
    ['w', 'Chuyển sang "Cơ chế lệch E_Fi" để thấy: ΔE_Fi = (3/4)·kT·ln(m_p*/m_n*). Dải nào nhiều "ghế" hơn thì E_Fi phải dịch ra xa dải đó để giữ n₀ = p₀!'],
    ['v', 'So sánh Si (N_c > N_v ⇒ ΔE_Fi = −12.8 meV) với GaAs (N_v ≫ N_c ⇒ ΔE_Fi = +38.2 meV) ở 300 K.']
  ],
  react(S, k, P, say) {
    if (S.view === 'trio') {
      const nGe = ni_of(MATS.ge, S.T), nSi = ni_of(MATS.si, S.T), nGa = ni_of(MATS.ga, S.T);
      say('v', `T = ${S.T} K: nᵢ(Ge) = ${fmtSci(nGe, 1)} | nᵢ(Si) = ${fmtSci(nSi, 1)} | nᵢ(GaAs) = ${fmtSci(nGa, 1)} cm⁻³.`);
    } else {
      const m = MATS[S.focusMat];
      const sh = dEfi_meV(m, S.T);
      say('v', `${m.full} ở ${S.T} K (m_n*=${m.mn}, m_p*=${m.mp}): N_v/N_c = ${(Nv_of(m, S.T) / Nc_of(m, S.T)).toFixed(2)} → ΔE_Fi = ${(sh >= 0 ? '+' : '−') + Math.abs(sh).toFixed(1)} meV.`);
    }
  }
};

LD.doping = {
  intro: [
    ['i', 'Pha tạp thay thế biến Si gần như cách điện thành vật liệu điều khiển được: Donor (Nhóm V: P) cho electron tự do → loại n; Acceptor (Nhóm III: B) tạo lỗ trống → loại p.'],
    ['w', 'Điểm cốt lõi: Donor đưa electron lên dải dẫn mà KHÔNG tạo lỗ trống; Acceptor tạo lỗ trống ở dải hóa trị mà KHÔNG tạo electron dẫn!'],
    ['w', 'Các ion P⁺ và B⁻ bị khóa cố định tại nút mạng nên tổng điện tích của bán dẫn pha tạp vẫn bằng 0 (luôn trung hòa điện).'],
    ['v', 'Chuyển sang "Thăm dò điện trường E" và bật E → để xem hạt dẫn trôi tạo dòng mạnh trên Ampe kế trong khi ion tạp chất đứng im!']
  ],
  react(S, k, P, say) {
    if (S.view === 'trio') {
      say('i', 'So sánh 3 mẫu: Si thuần (kín liên kết) | Donor P (dư e⁻ tự do + P⁺ cố định) | Acceptor B (sinh h⁺ + B⁻ cố định).');
    } else {
      const eOn = S.Edir === 'right';
      say('v', `Mẫu ${S.sample === 'pure' ? 'Si thuần' : S.sample === 'donor' ? 'Loại n (Donor P)' : 'Loại p (Acceptor B)'}, ${eOn ? 'E →' : 'E = 0'}: ${!eOn || S.sample === 'pure' ? 'Dòng I ≈ 0' : S.sample === 'donor' ? 'e⁻ trôi ngược E tạo dòng mạnh (ΣQ = 0)' : 'h⁺ trôi cùng E tạo dòng mạnh (ΣQ = 0)'}.`);
    }
  }
};

LD.bohr = {
  intro: [
    ['i', 'Mô hình Bohr mở rộng giải thích vì sao năng lượng ion hóa tạp chất nhỏ hơn hàng trăm lần so với Hydro: r₁ = a₀·ε_r·(m₀/m*) và E_i = 13.6·(m*/m₀)/ε_r².'],
    ['w', 'Đặt cùng 1 thước đo 1 nm: nguyên tử H (0.53 Å) chỉ là một chấm nhỏ, còn quầng electron thứ 5 của Donor P trong Si (ε_r = 11.7, m* = 0.26 m₀) trải rộng ~23.9 Å, bao trùm tới 4.4 ô mạng Si!'],
    ['w', 'Quầng của Acceptor B (m_p* lớn hơn) nhỏ hơn một nửa (~12.6 Å). Vì E_i của Si chỉ cỡ 26–45 meV (ngang tầm kT = 25.9 meV ở 300 K) nên tạp chất dễ dàng ion hóa ở nhiệt độ phòng!'],
    ['v', 'Chuyển sang "Tinh chỉnh ε_r & m*" và thử nút "Donor GaAs" để thấy m* = 0.067 m₀ làm đám mây phình tới >100 Å và E_i tụt xuống còn 5.3 meV!']
  ],
  react(S, k, P, say) {
    if (S.view === 'trio') {
      say('i', 'Cùng tỉ lệ 1 nm: H (0.53 Å · 13.6 eV) vs Donor P trong Si (23.9 Å · 25.8 meV) vs Acceptor B trong Si (12.6 Å · 48.7 meV).');
    } else {
      const r1 = A0_BOHR * S.er / S.mStar;
      const Ei = (EH_EV * S.mStar / (S.er * S.er)) * 1000;
      say('v', `ε_r = ${S.er.toFixed(1)}, m* = ${S.mStar.toFixed(3)} m₀ → Bán kính r₁ = ${r1.toFixed(1)} Å (${(r1 / 5.43).toFixed(1)} ô Si), E_i = ${Ei >= 1000 ? (Ei / 1000).toFixed(2) + ' eV' : Ei.toFixed(1) + ' meV'}.`);
    }
  }
};

LD.cube = {
  intro: [
    ['i', 'Xét một khối lập phương Si cạnh 100 nm (V = 10⁻¹⁵ cm³), chứa tới 5×10⁷ nguyên tử Si nhưng ở trạng thái tinh khiết (nᵢ ≈ 10¹⁰ cm⁻³) chỉ có trung bình 0.00001 electron tự do!'],
    ['w', 'Chỉ cần pha N_D = 10¹⁶ cm⁻³ (tức cứ 5 triệu nguyên tử Si mới thay 1 nguyên tử P), số electron tự do trong khối tăng vọt 1 triệu lần lên 10 hạt — mà mạng tinh thể hầu như không đổi!'],
    ['w', 'Đồng thời theo n₀p₀ = nᵢ², lỗ trống p₀ bị kìm xuống còn 10⁴ cm⁻³ (gần như 0 hạt trong khối): pha donor vừa tăng mạnh e⁻ vừa triệt tiêu lỗ trống.'],
    ['v', 'Chuyển sang "Quét nồng độ N_D" để kéo N_D và đọc đồng thời số e⁻ trong khối cùng nồng độ lỗ trống p₀ bị kìm trên đồng hồ!']
  ],
  react(S, k, P, say) {
    if (S.view === 'quad') {
      say('i', 'So sánh 4 khối cạnh 100 nm: Tinh khiết (0.00001 e⁻) → 10¹⁶ (10 e⁻) → 10¹⁷ (100 e⁻) → 10¹⁸ (1000 e⁻).');
    } else {
      const nBox = S.Nd * 1e-15;
      const p0 = 1e20 / S.Nd;
      say('v', `N_D = ${fmtPow(S.Nd)} cm⁻³ → Trong khối 100 nm có ≈ ${nBox < 10 ? nBox.toFixed(1) : Math.round(nBox)} e⁻ tự do (1 donor / ${fmtSci(5e22 / S.Nd, 1)} Si), lỗ trống bị kìm còn p₀ = ${fmtSci(p0, 1)} cm⁻³.`);
    }
  }
};

LD.gaas = {
  intro: [
    ['i', 'Trong bán dẫn hợp chất III–V (GaAs), quy tắc chung vẫn là so số e⁻ hóa trị tạp chất với nút bị thay: nhiều hơn → Donor (n), ít hơn → Acceptor (p).'],
    ['w', 'Nhóm II (Zn) thế Ga (III) → thiếu 1 e⁻ → Acceptor (p). Nhóm VI (Se) thế As (V) → thừa 1 e⁻ → Donor (n).'],
    ['w', 'Nhóm IV (Si, Ge) là tạp chất lưỡng tính: thực nghiệm cho thấy trong GaAs, Si chủ yếu thế Ga (Donor, E_i = 5.8 meV) còn Ge chủ yếu thế As (Acceptor, E_i = 40.4 meV).'],
    ['v', 'Thử đảo vị trí Si và Ge giữa nút Ga và nút As để thấy cùng một nguyên tố chuyển vai trò ngay lập tức giữa Donor và Acceptor!']
  ],
  react(S, k, P, say) {
    const imp = GAAS_IMP[S.imp] || GAAS_IMP.si;
    const hostVal = S.site === 'ga' ? 3 : 5;
    const dZ = imp.val - hostVal;
    const ei = S.site === 'ga' ? imp.eiGa : imp.eiAs;
    say('v', `${imp.sym} (${imp.val}e⁻) thế nút ${S.site === 'ga' ? 'Ga (3e⁻)' : 'As (5e⁻)'}: ΔZ = ${dZ > 0 ? '+' : ''}${dZ} → ${dZ > 0 ? 'Donor (loại n)' : 'Acceptor (loại p)'}${ei != null ? `, E_i đo được = ${ei.toFixed(1)} meV.` : ' (vị trí không ưu tiên trong thực tế).'}`);
  }
};

LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP TỰ CHỨA (#lab5 / .lb5-*, tách biệt hoàn toàn Namespace)
   ========================================================================== */
const CSS = `
#lab5{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab5[hidden]{display:none}
#lab5 *{box-sizing:border-box}
.lb5-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
.lb5-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
.lb5-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
.lb5-ic{color:var(--main);display:flex}
.lb5-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
.lb5-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
.lb5-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
.lb5-tab:hover{color:var(--ink);background:var(--tint)}
.lb5-tab.on{background:var(--main);color:var(--bg);font-weight:700}
.lb5-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
.lb5-x:hover{color:var(--err);background:var(--tint)}
.lb5-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
.lb5-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
.lb5-p.glow{animation:lb5glow 1.4s ease-out}
@keyframes lb5glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
.lb5-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
.lb5-cv{flex:1;min-height:0;position:relative}
.lb5-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.lb5-c{display:flex;flex-wrap:wrap;gap:6px 12px;padding:5px 10px 8px;flex:none;align-items:center}
.lb5-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb5-k input[type=range]{width:clamp(64px,7vw,108px);margin:0;accent-color:var(--main)}
.lb5-k output{color:var(--ink);font-weight:700;min-width:3.2em}
.lb5-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb5-seg button,.lb5-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer;transition:color .15s,background .15s}
.lb5-btn{background:var(--tint);color:var(--ink)}
.lb5-seg button:hover,.lb5-btn:hover{color:var(--ink);background:var(--g)}
.lb5-seg button.on{background:var(--main);color:var(--bg)}
.lb5-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
.lb5-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb5in .4s ease-out;overflow-wrap:anywhere}
.lb5-ln::before{position:absolute;left:0;font-weight:700}
.lb5-ln.i{color:var(--ink)}.lb5-ln.i::before{content:'›';color:var(--c5)}
.lb5-ln.w{color:var(--ink)}.lb5-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
.lb5-ln.v{color:var(--main)}.lb5-ln.v::before{content:'=';color:var(--main)}
@keyframes lb5in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab5-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab5-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab5-m:hover,.lab5-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb5-win{width:100vw;height:100dvh;border-radius:0}.lb5-b{overflow:auto;display:flex;flex-direction:column}.lb5-p{min-height:280px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'density';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab5'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 5');
  root.innerHTML = '<div class="lb5-win"><div class="lb5-h"><span class="lb5-ic">' + FLASK + '</span><span class="lb5-bd">Phòng thí nghiệm · Buổi 5</span><nav class="lb5-tabs"></nav><button class="lb5-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb5-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb5-b'); tabsEl = root.querySelector('.lb5-tabs');
  LABS.forEach(l => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lb5-tab'; b.dataset.id = l.id;
    b.textContent = l.no + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b);
  });
  root.querySelector('.lb5-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) {
      const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty &&
          window.LabB5 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden &&
          (document.getElementById('tb-badge') || {}).textContent === 'Buổi 5') {
        e.preventDefault(); open();
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
}

const say = (kind, text) => {
  if (!logEl) return;
  const d = document.createElement('div'); d.className = 'lb5-ln ' + kind; d.textContent = text;
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
    w.className = 'lb5-btn'; w.textContent = c.btn; w.setAttribute('role', 'button'); w.tabIndex = 0;
    w.onclick = () => c.fn(p); return w;
  }
  if (c.seg) {
    w.className = 'lb5-seg';
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
  w.className = 'lb5-k';
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
    const el = document.createElement('div'); el.className = 'lb5-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb5-t"></div><div class="lb5-cv"><canvas></canvas></div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) {
      const lg = document.createElement('div'); lg.className = 'lb5-log'; lg.setAttribute('aria-live', 'polite');
      el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el);
      curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 220 + j * 850)));
      return;
    }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb5-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.ctrls && spec.ctrls.length) {
      const cb = document.createElement('div'); cb.className = 'lb5-c';
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
    catch (err) { console.error('LabB5 render error:', err); }
    ctx.restore();
  });
  raf = requestAnimationFrame(loop);
}

function open(id, panelIdx) {
  ensureDom(); readColors(); opener = document.activeElement;
  root.hidden = false; show(id || lastTab, panelIdx);
  last = performance.now(); if (!raf) raf = requestAnimationFrame(loop);
  root.querySelector('.lb5-x').focus({ preventScroll: true });
  const b = document.getElementById('tb-lab'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
}
function close() {
  if (!root || root.hidden) return;
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  const b = document.getElementById('tb-lab'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- Gắn biểu tượng bình thí nghiệm vào tiêu đề Bài 5 ---------- */
const H3MAP = [
  [/^1\.[1-7]/, 'density', 0],
  [/^2\.1/, 'intrinsic', 0],
  [/^2\.[234]/, 'efishift', 0],
  [/^3\.[123]/, 'doping', 0],
  [/^3\.4/, 'bohr', 0],
  [/^3\.5/, 'cube', 0],
  [/^3\.6/, 'gaas', 0]
];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab5-m')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab5-m'; b.innerHTML = FLASK;
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

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 5') {
  markLesson(document.getElementById('app-content'));
}

window.LabB5 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
