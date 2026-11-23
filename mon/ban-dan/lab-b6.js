/* ==========================================================================
   lab-b6.js — PHÒNG THÍ NGHIỆM BÁN DẪN PHA TẠP & SUY BIẾN BUỔI 6 (Tự Chứa)
   - Tuân thủ 100% Rule-lab.md: TUYỆT ĐỐI KHÔNG BIỂU ĐỒ, KHÔNG TRỤC TỌA ĐỘ,
     KHÔNG SƠ ĐỒ KHỐI DẢI NĂNG LƯỢNG TRỪU TƯỢNG!
   - Thẩm mỹ đồng bộ phong cách kính hiển vi lượng tử 2D phân tầng đồng mức
     Inferno (pha dương / biển e⁻) & Ice-Cyan (pha âm / biển lỗ trống) trên
     nền đêm #0f0c14, hạt nhân trắng viền đen và đồng hồ kim cơ đo trực tiếp.
   - 7 phòng thí nghiệm vật lý thực phủ trọn Mục 1–10 & Câu 1–6 Bài 6:
       1. Cân bằng n₀p₀ = nᵢ² : Kính hiển vi mật độ tái hợp 2D & 2 đồng hồ bập bênh (Mục 1–2, Câu 1)
       2. Suy biến & Quầng tạp chất : 3 khung chồng lấn quầng Bohr & Đồng hồ lệch Boltzmann (Mục 3–4, Câu 2)
       3. Buồng Cryostat Ion hóa : Đóng băng (20 K) → Ion hóa hoàn toàn (300 K) (Mục 5–6, VD 6.1, 6.3, Câu 3)
       4. Buồng Bù trừ P⁺–B⁻ : Trường tĩnh điện ion cố định, hiệu ứng "nuốt" e⁻ & Ampe kế 2 chiều (Mục 7, Câu 4)
       5. Máy Cấy Ion thiết kế E_F : Súng chùm ion đảo loại Wafer Si & Cảnh báo ngưỡng 3kT (Mục 8, Câu 5–6)
       6. Buồng Kiểm định 3 Chế độ Nhiệt : Đóng băng → Cửa sổ Ngoại lai → Sụp đổ Nội tại (Mục 9)
       7. Bàn Ép Tiếp xúc N–P : Khuếch tán, Vùng nghèo bất đối xứng, Điện trường E_bi & Vôn kế V_bi (Mục 10)
   - API: LabB6.open(tabId?, panelIndex?)  LabB6.close()  LabB6.mark(root)  LabB6.tabs()
   ========================================================================== */
(function () {
'use strict';

/* ---------- Hằng số vật lý chuẩn Silicon Bài 6 & tiện ích toán học ---------- */
const TAU = Math.PI * 2;
const Q_EL = 1.6021766e-19;   // C
const EG = 1.12;              // eV (vùng cấm Si)
const NC0 = 2.8e19;           // cm⁻³ ở 300 K
const NV0 = 1.04e19;          // cm⁻³ ở 300 K
const NI0 = 1.5e10;           // cm⁻³ ở 300 K (giá trị chuẩn dùng trong Bài 6)
const KT300 = 0.0259;         // eV ở 300 K (khớp chính xác mọi ví dụ & bài tập Bài 6)
const E_ION_D = 0.045;        // eV (năng lượng ion hóa P trong Si)
const E_ION_A = 0.045;        // eV (năng lượng ion hóa B trong Si)

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const rnd = (a, b) => a + Math.random() * (b - a);
const ex = x => Math.exp(clamp(x, -300, 300));
const lg10 = v => Math.log10(Math.max(v, 1e-30));

/* Bộ sinh số giả ngẫu nhiên cố định theo seed để lưới tạp chất không nhấp nháy */
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

/* ---------- Mô hình vật lý chính xác Bài 6 ---------- */
const kT_of = T => KT300 * (T / 300);
const Nc_of = T => NC0 * Math.pow(T / 300, 1.5);
const Nv_of = T => NV0 * Math.pow(T / 300, 1.5);
const ni_of = T => NI0 * Math.pow(T / 300, 1.5) * ex(-EG / (2 * kT_of(T)) + EG / (2 * KT300));

/* Tích phân Fermi–Dirac bậc 1/2: F_{1/2}(η_F) = ∫₀^∞ η^(1/2) / (1 + e^(η − η_F)) dη */
function F12(eta) {
  if (eta < -22) return (Math.sqrt(Math.PI) * 0.5) * Math.exp(eta);
  const uMax = Math.sqrt(Math.max(eta, 0) + 38);
  const N = 220;
  const h = uMax / N;
  let sum = 0;
  for (let i = 0; i <= N; i++) {
    const u = i * h;
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    const arg = u * u - eta;
    const denom = arg > 300 ? Infinity : (1 + Math.exp(arg));
    sum += w * (2 * u * u) / denom;
  }
  return (sum * h) / 3;
}
const nFD_of = (N_eff, eta) => (2 / Math.sqrt(Math.PI)) * N_eff * F12(eta);

/* Giải ngược η sao cho (2/√π) F_{1/2}(η) = ratio */
function etaForRatio(ratio) {
  const r = Math.max(ratio, 1e-20);
  if (r < 1e-4) return Math.log(r);
  let lo = -25, hi = 60;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) * 0.5;
    if ((2 / Math.sqrt(Math.PI)) * F12(mid) < r) lo = mid;
    else hi = mid;
  }
  return (lo + hi) * 0.5;
}

/* Giải phương trình trung hòa điện tích đầy đủ (cả Fermi–Dirac + thống kê donor g=2, acceptor g=4)
   Quy ước mốc năng lượng: E_c = 0, E_v = −E_g = −1.12 eV. */
function solveNeutrality(T, Nd, Na) {
  const kT = kT_of(T);
  const nc = Nc_of(T);
  const nv = Nv_of(T);
  const Ed = -E_ION_D;
  const Ea = -EG + E_ION_A;
  // Tính hiệu điện tích (âm − dương) = n + N_a⁻ − p − N_d⁺ (hàm đơn điệu tăng theo E_F)
  // Chú ý hệ số suy biến: N_d⁺ = N_d / (1 + 2·exp((E_F − E_d)/kT)), N_a⁻ = N_a / (1 + 4·exp((E_a − E_F)/kT))
  const netNeg = E => {
    const n = nFD_of(nc, E / kT);
    const p = nFD_of(nv, (-EG - E) / kT);
    const ndPlus = Nd > 0 ? Nd / (1 + 2 * ex((E - Ed) / kT)) : 0;
    const naMinus = Na > 0 ? Na / (1 + 4 * ex((Ea - E) / kT)) : 0;
    return (n + naMinus) - (p + ndPlus);
  };
  let lo = -EG - 0.35, hi = 0.45;
  for (let i = 0; i < 72; i++) {
    const mid = (lo + hi) * 0.5;
    if (netNeg(mid) < 0) lo = mid;
    else hi = mid;
  }
  const Ef = (lo + hi) * 0.5;
  const n = nFD_of(nc, Ef / kT);
  const p = nFD_of(nv, (-EG - Ef) / kT);
  const ndPlus = Nd > 0 ? Nd / (1 + 2 * ex((Ef - Ed) / kT)) : 0;
  const naMinus = Na > 0 ? Na / (1 + 4 * ex((Ea - Ef) / kT)) : 0;
  const ndNeut = Math.max(0, Nd - ndPlus);
  const naNeut = Math.max(0, Na - naMinus);
  const Efi = -EG * 0.5 + 0.5 * kT * Math.log(nv / nc);
  return {
    Ef, Efi, kT, nc, nv, n, p,
    ndPlus, naMinus, ndNeut, naNeut,
    ionD: Nd > 0 ? ndPlus / Nd : 1,
    ionA: Na > 0 ? naMinus / Na : 1
  };
}

/* Độ linh động Caughey–Thomas ước lượng độ dẫn thực của wafer Si (cho đồng hồ đo độ dẫn) */
function muSi(Ntot, isN) {
  if (isN) return 92 + (1350 - 92) / (1 + Math.pow(Ntot / 1.3e17, 0.91));
  return 49 + (480 - 49) / (1 + Math.pow(Ntot / 6.3e16, 0.76));
}

/* ---------- Bảng màu phân tầng đồng mức (Isocontour) chuẩn Rule-lab.md ---------- */
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
const COL_PURP = '#a774f0';

/* ---------- Đọc biến CSS khung giao diện của trang ---------- */
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
function drawNucleus(ctx, x, y, r = 4.8, fill = '#ffffff', stroke = '#120f17') {
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
function drawScopeBg(ctx, x, y, w, h, r = 10, borderCol) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = NIGHT_BG;
  ctx.fill();
  ctx.strokeStyle = borderCol || C.g;
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
  const r = clamp(Math.min(w * 0.34, h * 0.24), 20, 34);
  const cy = y + h * 0.48 + r * 0.12;
  const a0 = Math.PI * 1.12, a1 = Math.PI * 1.88;

  // Cung thang chia chính
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a1);
  ctx.strokeStyle = C.g;
  ctx.lineWidth = 3.2;
  ctx.stroke();

  // Vạch màu vùng cảnh báo hoặc vùng hoạt động (nếu có)
  if (o.zones) {
    o.zones.forEach(z => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0 + z[0] * (a1 - a0), a0 + z[1] * (a1 - a0));
      ctx.strokeStyle = z[2];
      ctx.lineWidth = 3.2;
      ctx.stroke();
    });
  }

  // Các vạch chia cơ khí nhỏ
  for (let i = 0; i <= 4; i++) {
    const a = a0 + (i / 4) * (a1 - a0);
    ln(ctx, cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4),
            cx + Math.cos(a) * (r + 1.5), cy + Math.sin(a) * (r + 1.5), C.sub, 1.1);
  }

  // Kim cơ dao động mượt
  const frac = clamp(o.frac, 0, 1);
  const ang = a0 + frac * (a1 - a0);
  const acc = o.accent || C.main;
  ln(ctx, cx, cy, cx + Math.cos(ang) * (r - 3), cy + Math.sin(ang) * (r - 3), acc, 2.3);
  dot(ctx, cx, cy, 3.0, C.ink);

  txt(ctx, o.title || '', cx, y + 15, C.mut, 9.2, 'center', 700, MONO);
  txt(ctx, o.val || '', cx, cy + 20, acc, 11.2, 'center', 800, MONO);
  if (o.sub) txt(ctx, o.sub, cx, y + h - 14, o.subCol || C.mut, 9.0, 'center', 600, MONO);
}

const LABS = [];

/* Hàm tiện ích vẽ nền lưới kỹ thuật mờ cho chế độ mô phỏng lý thuyết đơn giản */
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

/* ==========================================================================
   TAB 1 — CÂN BẰNG n₀p₀ = nᵢ²: KÍNH HIỂN VI MẬT ĐỘ & ĐÒN BẨY E_F (Mục 1–2, Câu 1)
   - Chế độ 1 ("Buồng tương tác"): Kéo E_F − E_Fi và T để thấy biển hạt tải 2D
     Inferno (e⁻) ↔ Ice-Cyan (h⁺) đổi cực mạnh và hai đồng hồ kim cơ n₀, p₀
     chuyển động bập bênh ngược chiều giữ tích n₀·p₀ = nᵢ² không đổi!
   - Chế độ 2 ("Đối xứng ±0.30 eV · Câu 1"): Hai buồng kính hiển vi đặt cạnh
     nhau so trực tiếp Si loại N (+0.30 eV) và Si loại P (−0.30 eV).
   ========================================================================== */
LABS.push({
  id: 'balance', name: 'Cân bằng n₀p₀', no: '1–2', secs: [1, 2],
  S: { mode: 'simple', view: 'live', dE: 0.30, T: 300 },
  cols: '2.1fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng mật độ hạt tải & Đòn bẩy cân bằng n₀·p₀ = nᵢ²',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'view', seg: [['live', 'Buồng tương tác'], ['sym', 'Đối xứng ±0.30 eV (Câu 1)']] },
      { k: 'dE', l: 'E_F − E_Fi', min: -0.45, max: 0.45, step: 0.01, f: v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + ' eV' },
      { k: 'T', l: 'Nhiệt độ T', min: 250, max: 450, step: 10, f: v => v + ' K' },
      { btn: 'Câu 1a (+0.30eV)', fn: p => { p.S.view = 'live'; p.S.dE = 0.30; p.S.T = 300; p.syncCtrls(); queueReact(p.tab, 'dE'); } },
      { btn: 'Thuần (0 eV)', fn: p => { p.S.view = 'live'; p.S.dE = 0; p.S.T = 300; p.syncCtrls(); queueReact(p.tab, 'dE'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const kT = kT_of(S.T);
      const ni = ni_of(S.T);
      const n0 = ni * ex(S.dE / kT);
      const p0 = ni * ex(-S.dE / kT);

      const topBar = 32;
      const areaX = chX + 10, areaY = chY + topBar + 4, areaW = chW - 20, areaH = chH - topBar - 14;

      if (!st.ePts) {
        const rg = mkRng(101);
        st.ePts = Array.from({ length: 28 }, () => ({ u: rg(), v: rg(), vx: (rg() - 0.5) * 0.45, vy: (rg() - 0.5) * 0.45 }));
        st.hPts = Array.from({ length: 28 }, () => ({ u: rg(), v: rg(), vx: (rg() - 0.5) * 0.36, vy: (rg() - 0.5) * 0.36 }));
        st.recomb = [];
        st.nNeedle = 0.5; st.pNeedle = 0.5;
      }

      // Hàm vẽ 1 buồng kính hiển vi mật độ hạt tải 2D
      const drawCarrierChamber = (fx, fy, fw, fh, dEval, label) => {
        const nLoc = ni * ex(dEval / kT);
        const pLoc = ni * ex(-dEval / kT);
        const nVis = Math.round(clamp((lg10(nLoc) - 4) / 14 * 26, 0, 26));
        const pVis = Math.round(clamp((lg10(pLoc) - 4) / 14 * 26, 0, 26));
        // Cân bằng sắc trường nền: dương → Inferno ấm, âm → Ice-Cyan lạnh, thuần → trung tính sâu
        const bias = clamp(dEval / 0.35, -1, 1);

        ctx.save();
        rr(ctx, fx, fy, fw, fh, 6);
        ctx.clip();

        const cols = 7, rows = 5;
        const gaugeW = 0;
        const simX = fx + gaugeW, simW = fw - gaugeW;

        if (S.mode === 'field') {
          const resW = clamp(Math.round(fw * 0.42), 110, 190);
          const resH = clamp(Math.round(fh * 0.42), 80, 140);
          renderWaveField(ctx, fx, fy, fw, fh, resW, resH, (u, v) => {
            const gx = u * cols, gy = v * rows;
            const dx = (gx - Math.floor(gx)) - 0.5;
            const dy = (gy - Math.floor(gy)) - 0.5;
            const r = Math.hypot(dx, dy);
            const lattice = Math.exp(-r * 2.5) * 0.55 + 0.25;
            const ripple = Math.sin(u * 11 - t * 2.3) * Math.cos(v * 9 + t * 1.9) * 0.22;
            if (Math.abs(bias) < 0.06) {
              // Bán dẫn thuần: gợn cân bằng cả 2 pha nhẹ
              return clamp(ripple * lattice * 1.6, -0.55, 0.55);
            }
            return clamp(bias * (0.45 + 0.55 * lattice + ripple), -1, 1);
          });
        } else {
          drawSimpleGrid(ctx, fx, fy, fw, fh, 30);
        }

        // Lưới hạt nhân Silicon
        const vib = 0.5 + (S.T - 250) / 180;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const ax = simX + ((c + 0.5) / cols) * simW + Math.sin(t * 14 + r * 3 + c) * vib;
            const ay = fy + ((r + 0.5) / rows) * (fh - 22) + Math.cos(t * 15 + c * 4 + r) * vib;
            if (S.mode === 'simple') dot(ctx, ax, ay, 2.8, 'rgba(255,255,255,0.20)');
            else drawNucleus(ctx, ax, ay, 4.2, 'rgba(255,255,255,0.82)', '#14111c');
          }
        }

        // Hạt electron tự do (vàng kem rực) và lỗ trống (vòng cyan) chuyển động nhiệt
        const spScale = Math.sqrt(S.T / 300);
        for (let i = 0; i < nVis; i++) {
          const pt = st.ePts[i];
          const u = ((pt.u + t * pt.vx * spScale) % 1 + 1) % 1;
          const v = ((pt.v + t * pt.vy * spScale) % 1 + 1) % 1;
          const ex_ = simX + 8 + u * (simW - 16), ey_ = fy + 10 + v * (fh - 40);
          glowDot(ctx, ex_, ey_, 4.0, '#fef1b6', hexA(COL_WARM, 0.92));
          if (S.mode === 'simple') {
            dot(ctx, ex_, ey_, 4.2, COL_WARM);
            txt(ctx, '−', ex_, ey_ + 0.5, '#0f0c14', 8.5, 'center', 800, MONO);
          }
        }
        for (let i = 0; i < pVis; i++) {
          const pt = st.hPts[i];
          const u = ((pt.u + t * pt.vx * spScale) % 1 + 1) % 1;
          const v = ((pt.v + t * pt.vy * spScale) % 1 + 1) % 1;
          const hx = simX + 8 + u * (simW - 16), hy = fy + 10 + v * (fh - 40);
          glowDot(ctx, hx, hy, 4.0, '#dafefe', hexA(COL_CYAN, 0.9));
          ctx.beginPath(); ctx.arc(hx, hy, 5.2, 0, TAU);
          ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.6; ctx.stroke();
          if (S.mode === 'simple') txt(ctx, '+', hx, hy + 0.5, COL_ICE, 8.8, 'center', 800, MONO);
        }

        // Lóe vòng tái hợp khi có cặp gặp nhau
        if (Math.random() < dt * (2.6 + Math.abs(bias) * 3)) {
          st.recomb.push({ u: rnd(0.12, 0.88), v: rnd(0.14, 0.86), life: 1.0, box: fx });
        }
        for (let i = st.recomb.length - 1; i >= 0; i--) {
          const rc = st.recomb[i];
          if (Math.abs(rc.box - fx) > 2) continue;
          rc.life -= dt * 1.9;
          if (rc.life <= 0) { st.recomb.splice(i, 1); continue; }
          ctx.beginPath();
          ctx.arc(simX + rc.u * simW, fy + rc.v * (fh - 22), 4 + (1 - rc.life) * 18, 0, TAU);
          ctx.strokeStyle = hexA('#fef1b6', rc.life * 0.85);
          ctx.lineWidth = 1.6; ctx.stroke();
        }

        // Nhãn đáy khung
        ctx.fillStyle = 'rgba(15, 12, 20, 0.80)';
        ctx.fillRect(fx, fy + fh - 22, fw, 22);
        txt(ctx, label, fx + fw * 0.5, fy + fh - 11, C.ink, 10.2, 'center', 700, MONO);
        ctx.restore();

        rr(ctx, fx, fy, fw, fh, 6);
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
      };

      if (S.view === 'live') {
        const meterW = 88;
        const bx = areaX, bw = areaW - meterW - 10;
        const kindTxt = S.dE > 0.02 ? 'Bán dẫn loại N (e⁻ áp đảo · Tái hợp kìm h⁺)'
          : S.dE < -0.02 ? 'Bán dẫn loại P (h⁺ áp đảo · Tái hợp kìm e⁻)'
          : 'Bán dẫn thuần (Sinh nhiệt = Tái hợp · n₀ = p₀ = nᵢ)';
        drawCarrierChamber(bx, areaY, bw, areaH, S.dE, kindTxt);

        // Hai đồng hồ kim cơ bập bênh n₀ và p₀ bên phải
        const mx = bx + bw + 10;
        const mh = (areaH - 28) * 0.5;
        const nTarget = clamp((lg10(n0) - 2) / 17, 0, 1);
        const pTarget = clamp((lg10(p0) - 2) / 17, 0, 1);
        st.nNeedle += (nTarget - st.nNeedle) * Math.min(1, dt * 8);
        st.pNeedle += (pTarget - st.pNeedle) * Math.min(1, dt * 8);

        drawMeter(ctx, mx, areaY, meterW, mh, {
          title: 'MẬT ĐỘ e⁻ (n₀)',
          val: fmtSci(n0, 1),
          sub: 'cm⁻³ (log)',
          frac: st.nNeedle,
          accent: C.main,
          zones: [[0.5, 1, C.main]]
        });

        // Khóa liên động giữ tích n₀p₀ = nᵢ² nằm giữa 2 đồng hồ
        const lockY = areaY + mh + 14;
        ln(ctx, mx + meterW * 0.5, areaY + mh, mx + meterW * 0.5, areaY + mh + 28, C.g, 1.6);
        rr(ctx, mx + 6, lockY - 10, meterW - 12, 20, 4);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1.1; ctx.stroke();
        txt(ctx, 'n₀p₀ = ' + fmtSci(ni * ni, 1), mx + meterW * 0.5, lockY, C.ink, 8.8, 'center', 700, MONO);

        drawMeter(ctx, mx, areaY + mh + 28, meterW, mh, {
          title: 'MẬT ĐỘ h⁺ (p₀)',
          val: fmtSci(p0, 1),
          sub: 'cm⁻³ (log)',
          frac: st.pNeedle,
          accent: C.c2,
          zones: [[0.5, 1, C.c2]]
        });

        txt(ctx, 'E_F − E_Fi = ' + (S.dE >= 0 ? '+' : '−') + Math.abs(S.dE).toFixed(2) + ' eV  |  T = ' + S.T + ' K  (kT = ' + (kT * 1000).toFixed(1) + ' meV)',
          chX + 12, chY + 17, C.ink, 10.4, 'left', 700, MONO);
        txt(ctx, 'nᵢ = ' + fmtSci(ni, 1) + ' cm⁻³', chX + chW - 12, chY + 17, C.main, 10.6, 'right', 700, MONO);
      } else {
        // Chế độ so sánh 2 mẫu đối xứng ±0.30 eV (Câu 1)
        const gap = 12;
        const cw = (areaW - gap) * 0.5;
        const nA = ni * ex(0.30 / kT), pA = ni * ex(-0.30 / kT);
        drawCarrierChamber(areaX, areaY, cw, areaH, +0.30,
          'Loại N (+0.30 eV): n₀ = ' + fmtSci(nA, 1) + ' · p₀ = ' + fmtSci(pA, 1));
        drawCarrierChamber(areaX + cw + gap, areaY, cw, areaH, -0.30,
          'Loại P (−0.30 eV): p₀ = ' + fmtSci(nA, 1) + ' · n₀ = ' + fmtSci(pA, 1));

        txt(ctx, 'Câu 1: Dịch ±0.30 eV quanh E_Fi → Vai trò electron (cam) & lỗ trống (cyan) hoán đổi hoàn hảo!',
          chX + 12, chY + 17, C.ink, 10.3, 'left', 700, MONO);
        txt(ctx, 'Tích n₀p₀ = ' + fmtSci(ni * ni, 2), chX + chW - 12, chY + 17, C.main, 10.6, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 2 — SUY BIẾN & DẢI TẠP CHẤT: CHỒNG LẤN QUẦNG BOHR 2D (Mục 3–4, Câu 2)
   - Chế độ 1 ("3 mức pha tạp"): 3 khung kính hiển vi đặt song song y hệt style
     trio của lab-b4: Không suy biến (10¹⁶) | Ngưỡng 3kT (3×10¹⁷) | Suy biến (3×10¹⁹)
   - Chế độ 2 ("Kính hiển vi η_F · Câu 2"): Kéo η_F (−5 → +4) và đổi Loại N / P;
     các quầng tạp chất co gần theo n₀^(−1/3) hòa thành đại dương kim loại, kèm
     2 đồng hồ kim cơ đo n₀ (Fermi–Dirac) & % sai số Boltzmann!
   ========================================================================== */
LABS.push({
  id: 'degenerate', name: 'Suy biến & FD', no: '3–4', secs: [3, 4],
  S: { mode: 'simple', view: 'trio', type: 'n', eta: 0.0 },
  cols: '2.1fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Chồng lấn quầng tạp chất — Không suy biến vs Suy biến (Fermi–Dirac)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'view', seg: [['trio', '3 mức pha tạp'], ['live', 'Kính hiển vi η_F (Câu 2)']] },
      { k: 'type', seg: [['n', 'Loại N (Donor P)'], ['p', 'Loại P (Acceptor B)']] },
      { k: 'eta', l: 'Vị trí η_F', min: -5.0, max: 4.0, step: 0.1, f: v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + ' kT' },
      { btn: 'Câu 2 (−3.5)', fn: p => { p.S.view = 'live'; p.S.eta = -3.5; p.syncCtrls(); queueReact(p.tab, 'eta'); } },
      { btn: 'Câu 2 (0)', fn: p => { p.S.view = 'live'; p.S.eta = 0.0; p.syncCtrls(); queueReact(p.tab, 'eta'); } },
      { btn: 'VD (+2.0)', fn: p => { p.S.view = 'live'; p.S.eta = 2.0; p.syncCtrls(); queueReact(p.tab, 'eta'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const isN = S.type === 'n';
      const Nref = isN ? NC0 : NV0;
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      if (!st.seeds) {
        const rg = mkRng(404);
        st.seeds = Array.from({ length: 42 }, () => [0.09 + rg() * 0.82, 0.10 + rg() * 0.80, rg() * TAU]);
        st.nNeedle = 0.5; st.errNeedle = 0.0;
      }

      const topBar = 32;
      const areaX = chX + 8, areaY = chY + topBar + 4, areaW = chW - 16, areaH = chH - topBar - 14;

      // Hàm vẽ 1 khung kính hiển vi trường quầng tạp chất chồng lấn 2D
      const drawImpurityField = (fx, fy, fw, fh, count, radU, sign, label, borderCol) => {
        const pts = st.seeds.slice(0, count);
        const aspect = fw / Math.max(fh, 1);
        const breathe = 1 + 0.025 * Math.sin(t * 2.5);
        const resW = clamp(Math.round(fw * 0.45), 96, 190);
        const resH = clamp(Math.round(fh * 0.45), 86, 160);

        ctx.save();
        rr(ctx, fx, fy, fw, fh, 6);
        ctx.clip();

        if (S.mode === 'field') {
          renderWaveField(ctx, fx, fy, fw, fh, resW, resH, (u, v) => {
            let sum = 0;
            for (let i = 0; i < pts.length; i++) {
              const dx = (u - pts[i][0]) * aspect;
              const dy = v - pts[i][1];
              const dist = Math.hypot(dx, dy);
              if (dist < radU * 4.2) {
                sum += Math.exp(-dist / (radU * breathe));
              }
            }
            // Giới hạn ngưỡng Pauli bão hòa mịn ở mức 1.0 (chồng lấn tạo biển vàng kem / trắng băng!)
            const sat = 1 - Math.exp(-sum * 1.15);
            return sign * clamp(sat * 1.05, 0, 1);
          });
        } else {
          // Chế độ ĐƠN GIẢN: Các vòng quầng Bohr rõ nét chồng lấn lên nhau theo mật độ pha tạp
          drawSimpleGrid(ctx, fx, fy, fw, fh, 26);
          const colOrb = sign > 0 ? COL_WARM : COL_CYAN;
          const rPx = radU * 1.85 * Math.min(fw, fh) * breathe;
          if (count >= 24) {
            ctx.fillStyle = hexA(colOrb, 0.09);
            ctx.fillRect(fx, fy, fw, fh - 22);
          }
          for (let i = 0; i < pts.length; i++) {
            const px = fx + pts[i][0] * fw, py = fy + pts[i][1] * (fh - 22);
            const gOrb = ctx.createRadialGradient(px, py, 0, px, py, rPx);
            gOrb.addColorStop(0, hexA(colOrb, 0.24));
            gOrb.addColorStop(0.75, hexA(colOrb, 0.08));
            gOrb.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gOrb;
            ctx.beginPath(); ctx.arc(px, py, rPx, 0, TAU); ctx.fill();

            ctx.beginPath(); ctx.arc(px, py, rPx * 0.78, 0, TAU);
            ctx.strokeStyle = hexA(colOrb, count >= 12 ? 0.55 : 0.78);
            ctx.lineWidth = 1.2;
            if (count < 12) ctx.setLineDash([4, 3]);
            ctx.stroke(); ctx.setLineDash([]);
          }
        }

        // Vẽ cầu nối liên thông màu vàng/cyan giữa các quầng chồng lấn khi sắp/đã suy biến
        if (count >= 12) {
          for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
              const d = Math.hypot((pts[i][0] - pts[j][0]) * aspect, pts[i][1] - pts[j][1]);
              if (d < radU * 2.35) {
                const x1 = fx + pts[i][0] * fw, y1 = fy + pts[i][1] * (fh - 22);
                const x2 = fx + pts[j][0] * fw, y2 = fy + pts[j][1] * (fh - 22);
                ln(ctx, x1, y1, x2, y2,
                   sign > 0 ? hexA('#fef1b6', 0.48) : hexA('#dafefe', 0.48), 1.4, [4, 3]);
                if (S.mode === 'simple' && (i + j) % 3 === 0) {
                  const ph = (t * 0.8 + i * 0.23) % 1;
                  dot(ctx, x1 + (x2 - x1) * ph, y1 + (y2 - y1) * ph, 2.3, sign > 0 ? '#fef1b6' : '#dafefe');
                }
              }
            }
          }
        }

        // Hạt nhân tạp chất
        const rNuc = clamp(Math.min(fw, fh) * 0.023, 3.6, 5.4);
        for (let i = 0; i < pts.length; i++) {
          const px = fx + pts[i][0] * fw, py = fy + pts[i][1] * (fh - 22);
          drawNucleus(ctx, px, py, rNuc,
            S.mode === 'simple' ? (sign > 0 ? COL_HOT : COL_CYAN) : (sign > 0 ? '#ffffff' : '#e8ffff'), '#120f17');
          if (S.mode === 'simple' && count < 12) {
            const rOrb = radU * 1.44 * Math.min(fw, fh);
            const ang = t * (sign > 0 ? 2.0 : -1.8) + pts[i][2];
            dot(ctx, px + Math.cos(ang) * rOrb, py + Math.sin(ang) * rOrb, 2.8, sign > 0 ? '#fef1b6' : '#dafefe');
          }
        }

        ctx.fillStyle = 'rgba(15, 12, 20, 0.80)';
        ctx.fillRect(fx, fy + fh - 22, fw, 22);
        txt(ctx, label, fx + fw * 0.5, fy + fh - 11, C.ink, 9.8, 'center', 700, MONO);
        ctx.restore();

        rr(ctx, fx, fy, fw, fh, 6);
        ctx.strokeStyle = borderCol || C.g; ctx.lineWidth = 1.2; ctx.stroke();
      };

      const sign = isN ? 1 : -1;
      const fdRatio = (2 / Math.sqrt(Math.PI)) * F12(S.eta);
      const nFD = Nref * fdRatio;
      const nBoltz = Nref * Math.exp(S.eta);
      const errPct = ((nBoltz - nFD) / Math.max(nFD, 1e-30)) * 100;

      if (S.view === 'trio') {
        const gap = 10;
        const cw = (areaW - gap * 2) / 3;
        drawImpurityField(areaX, areaY, cw, areaH, 4, 0.052, sign, 'Không suy biến (~10¹⁶ · Cô lập)', C.g);
        drawImpurityField(areaX + cw + gap, areaY, cw, areaH, 14, 0.068, sign, 'Ngưỡng 3kT (~3×10¹⁷ · Chạm quầng)', C.g);
        drawImpurityField(areaX + (cw + gap) * 2, areaY, cw, areaH, 36, 0.095, sign, 'Suy biến (≥ N_c · Biển kim loại)', C.g);

        txt(ctx, 'So sánh 3 chế độ pha tạp ' + (isN ? 'Donor P (Inferno)' : 'Acceptor B (Ice-Cyan)') + ' trong Silicon (300 K)',
          chX + 12, chY + 17, C.ink, 10.4, 'left', 700, MONO);
        txt(ctx, 'Mốc Boltzmann: cách mép ≥ 3kT (~3×10¹⁷)', chX + chW - 12, chY + 17, C.main, 10.4, 'right', 700, MONO);
      } else {
        const meterW = 92;
        const bw = areaW - meterW - 10;
        const normEta = clamp((S.eta + 5.0) / 9.0, 0, 1);
        const cnt = Math.round(3 + Math.pow(normEta, 1.4) * 38);
        const rad = 0.048 + normEta * 0.055;
        const regLbl = S.eta > 0 ? 'SUY BIẾN: Quầng tạp chất chồng lấn thành biển kim loại!'
          : S.eta > -3 ? 'SẮP SUY BIẾN (< 3kT): Bắt đầu có cầu chồng lấn, Boltzmann sai!'
          : 'KHÔNG SUY BIẾN (≥ 3kT): Quầng cô lập, Boltzmann chính xác (< 5%)';

        drawImpurityField(areaX, areaY, bw, areaH, cnt, rad, sign, regLbl, C.g);

        // 2 đồng hồ kim cơ bên phải: Mật độ thật Fermi–Dirac & Tỷ lệ đoán lố Boltzmann
        const mx = areaX + bw + 10;
        const mh = (areaH - 10) * 0.5;
        const nFrac = clamp((lg10(nFD) - 16) / 5.0, 0, 1);
        const errFrac = clamp(Math.log10(1 + Math.max(0, errPct) / 10) / 2.2, 0, 1);
        st.nNeedle += (nFrac - st.nNeedle) * Math.min(1, dt * 8);
        st.errNeedle += (errFrac - st.errNeedle) * Math.min(1, dt * 8);

        drawMeter(ctx, mx, areaY, meterW, mh, {
          title: isN ? 'n₀ (FERMI–DIRAC)' : 'p₀ (FERMI–DIRAC)',
          val: fmtSci(nFD, 2),
          sub: 'F₁/₂ = ' + F12(S.eta).toFixed(3),
          frac: st.nNeedle,
          accent: isN ? C.main : C.c2
        });

        const errCol = errPct <= 5 ? C.c1 : errPct < 35 ? C.main : C.err;
        const errTxt = errPct < 100 ? '+' + errPct.toFixed(1) + '%' : (nBoltz / nFD).toFixed(1) + '× lố';
        drawMeter(ctx, mx, areaY + mh + 10, meterW, mh, {
          title: 'BOLTZMANN LỐ',
          val: errTxt,
          sub: errPct <= 5 ? 'Dùng tốt (≤5%)' : errPct < 35 ? 'Bắt đầu lệch' : 'SAI NẶNG!',
          subCol: errCol,
          frac: st.errNeedle,
          accent: errCol,
          zones: [[0, 0.14, C.c1], [0.14, 0.42, C.main], [0.42, 1, C.err]]
        });

        txt(ctx, 'η_F = ' + (S.eta >= 0 ? '+' : '−') + Math.abs(S.eta).toFixed(1) + ' kT  |  FD: ' + fmtSci(nFD, 2) + '  vs  Boltzmann: ' + fmtSci(nBoltz, 2),
          chX + 12, chY + 17, C.ink, 10.3, 'left', 700, MONO);
        txt(ctx, S.eta > 0 ? 'SUY BIẾN' : S.eta > -3 ? 'CẬN SUY BIẾN' : 'KHÔNG SUY BIẾN',
          chX + chW - 12, chY + 17, S.eta > 0 ? C.err : S.eta > -3 ? C.main : C.c1, 10.5, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   TAB 3 — BUỒNG CRYOSTAT ION HÓA & ĐÓNG BĂNG (Mục 5–6, VD 6.1, 6.3, Câu 3)
   - Buồng làm lạnh Cryostat chứa tinh thể Silicon pha Donor P (g=2) hoặc
     Acceptor B (g=4), nền kính hiển vi 2D phân tầng đồng mức:
       * Chưa ion hóa (Đóng băng): Quầng sóng Bohr ôm chặt quanh từng tâm tạp chất.
       * Đã ion hóa: Lõi ion trần (+ hoặc −) đứng yên tại nút, gói sóng tự do phóng ra chạy khắp buồng!
   - Đồng hồ kim cơ đo chính xác % Ion hóa từ phương trình trung hòa đầy đủ.
   ========================================================================== */
LABS.push({
  id: 'ionize', name: 'Ion hóa & Đóng băng', no: '5–6', secs: [5, 6],
  S: { mode: 'simple', type: 'n', T: 300, N: 1e16 },
  cols: '2.1fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng Cryostat — Bẫy quầng Bohr (Đóng băng) vs Ion hóa hoàn toàn (Donor g=2 / Acceptor g=4)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'type', seg: [['n', 'Donor P (g = 2)'], ['p', 'Acceptor B (g = 4)']] },
      { k: 'T', l: 'Nhiệt độ T', min: 20, max: 360, step: 5, f: v => v + ' K' },
      { k: 'N', l: 'Nồng độ N', min: 15, max: 18, step: 0.1, log: 1, f: v => fmtPow(v) },
      { btn: 'Đóng băng (35K)', fn: p => { p.S.T = 35; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: 'VD 6.3 (B·193K)', fn: p => { p.S.type = 'p'; p.S.T = 193; p.S.N = 1e16; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: 'VD 6.1 (P·300K)', fn: p => { p.S.type = 'n'; p.S.T = 300; p.S.N = 1e16; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: 'Câu 3 (P·10¹⁷)', fn: p => { p.S.type = 'n'; p.S.T = 300; p.S.N = 1e17; p.syncCtrls(); queueReact(p.tab, 'N'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const isN = S.type === 'n';
      const sol = solveNeutrality(S.T, isN ? S.N : 0, isN ? 0 : S.N);
      const ionFrac = isN ? sol.ionD : sol.ionA;
      const unIonPct = (1 - ionFrac) * 100;

      // Viền buồng Cryostat chuyển xanh băng khi rất lạnh (< 100 K)
      const frost = clamp((130 - S.T) / 110, 0, 1);
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10, C.g);

      const topBar = 32, meterW = 92;
      const bx = chX + 10, by = chY + topBar + 4, bw = chW - meterW - 30, bh = chH - topBar - 14;

      if (!st.sites) {
        const rg = mkRng(606);
        st.sites = [];
        // 12 vị trí tạp chất trải đều tự nhiên trên mạng tinh thể
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 4; c++) {
            st.sites.push({
              u: (c + 0.5 + (rg() - 0.5) * 0.32) / 4,
              v: (r + 0.5 + (rg() - 0.5) * 0.32) / 3,
              phase: rg() * TAU,
              ion: true,
              fu: rg(), fv: rg(), vx: (rg() - 0.5) * 0.48, vy: (rg() - 0.5) * 0.48
            });
          }
        }
        st.ionNeedle = ionFrac;
      }

      // Số tạp chất hiển thị theo nồng độ N (6..12) và đồng bộ trạng thái ion hóa mượt
      const nSites = clamp(Math.round(6 + (lg10(S.N) - 15) * 2), 6, 12);
      const targetIon = Math.round(ionFrac * nSites);
      let curIon = 0;
      for (let i = 0; i < nSites; i++) if (st.sites[i].ion) curIon++;
      if (curIon !== targetIon) {
        for (let i = 0; i < nSites; i++) st.sites[i].ion = i < targetIon;
      }

      const aspect = bw / Math.max(bh, 1);
      const sign = isN ? 1 : -1;

      ctx.save();
      rr(ctx, bx, by, bw, bh, 6);
      ctx.clip();

      if (S.mode === 'field') {
        // Render trường sóng 2D: Quầng Bohr đậm ôm chặt các nguyên tử CHƯA ion hóa!
        const resW = clamp(Math.round(bw * 0.45), 130, 210);
        const resH = clamp(Math.round(bh * 0.45), 90, 150);
        const pulse = 1 + 0.04 * Math.sin(t * 3.2);
        renderWaveField(ctx, bx, by, bw, bh, resW, resH, (u, v) => {
          let field = 0;
          for (let i = 0; i < nSites; i++) {
            const s = st.sites[i];
            const dx = (u - s.u) * aspect, dy = v - s.v;
            const dist = Math.hypot(dx, dy);
            if (!s.ion) {
              // Quầng sóng Bohr lớn sáng rực bám quanh tâm tạp chất bị đóng băng!
              if (dist < 0.36) field += Math.exp(-dist / (0.088 * pulse)) * 1.05;
            } else {
              // Đã ion hóa: chỉ còn vầng tĩnh điện rất nhỏ quanh lõi ion trần
              if (dist < 0.14) field -= Math.exp(-dist / 0.032) * 0.28;
            }
          }
          return sign * clamp(field, -0.5, 1);
        });
      } else {
        drawSimpleGrid(ctx, bx, by, bw, bh, 28);
        // Ánh băng rất dịu khi buồng Cryostat hạ lạnh sâu
        if (frost > 0.05) {
          ctx.fillStyle = hexA(COL_CYAN, 0.08 * frost);
          ctx.fillRect(bx, by, bw, bh - 22);
        }
      }

      // Lưới hạt nhân Silicon nền 8×5
      const vib = 0.2 + (S.T / 360) * 1.6;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 8; c++) {
          const ax = bx + ((c + 0.5) / 8) * bw + Math.sin(t * 15 + r * 3 + c) * vib;
          const ay = by + ((r + 0.5) / 5) * (bh - 22) + Math.cos(t * 16 + c * 4 + r) * vib;
          if (S.mode === 'simple') dot(ctx, ax, ay, 2.4, 'rgba(255,255,255,0.18)');
          else drawNucleus(ctx, ax, ay, 3.6, 'rgba(255,255,255,0.62)', '#14111c');
        }
      }

      // Vẽ các nguyên tử tạp chất & các hạt dẫn đã bứt thoát chạy tự do
      const sp = 0.25 + Math.sqrt(S.T / 300) * 0.65;
      for (let i = 0; i < nSites; i++) {
        const s = st.sites[i];
        const sx = bx + s.u * bw, sy = by + s.v * (bh - 22);
        if (!s.ion) {
          // Vòng quỹ đạo Bohr + hạt bị trói quay quanh tâm
          if (S.mode === 'simple') {
            ctx.fillStyle = isN ? hexA(COL_WARM, 0.14) : hexA(COL_CYAN, 0.14);
            ctx.beginPath(); ctx.arc(sx, sy, 20, 0, TAU); ctx.fill();
          }
          ctx.beginPath(); ctx.arc(sx, sy, 18, 0, TAU);
          ctx.strokeStyle = isN ? hexA(COL_WARM, 0.72) : hexA(COL_ICE, 0.72);
          ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
          drawNucleus(ctx, sx, sy, 7.2, COL_PURP, '#120f17');
          txt(ctx, isN ? 'P' : 'B', sx, sy + 0.5, '#ffffff', 8.6, 'center', 800, MONO);
          const ang = t * 2.6 + s.phase;
          const ox = sx + Math.cos(ang) * 18, oy = sy + Math.sin(ang) * 18;
          glowDot(ctx, ox, oy, 3.8, isN ? '#fef1b6' : '#dafefe', hexA(isN ? COL_WARM : COL_CYAN, 0.95));
          if (S.mode === 'simple') {
            dot(ctx, ox, oy, 3.6, isN ? COL_WARM : COL_CYAN);
            txt(ctx, isN ? '−' : '+', ox, oy + 0.5, '#0f0c14', 8, 'center', 800, MONO);
          }
        } else {
          // Lõi ion cố định đã mất/nhận electron (P⁺ đỏ cam hoặc B⁻ xanh ngọc)
          drawNucleus(ctx, sx, sy, 7.6, isN ? COL_HOT : COL_CYAN, '#120f17');
          txt(ctx, isN ? 'P⁺' : 'B⁻', sx, sy + 0.5, '#0f0c14', 8.2, 'center', 800, MONO);
          // Hạt dẫn tự do bay lượn khắp buồng tinh thể
          s.fu = ((s.fu + s.vx * dt * sp) % 1 + 1) % 1;
          s.fv = ((s.fv + s.vy * dt * sp) % 1 + 1) % 1;
          const fx = bx + 10 + s.fu * (bw - 20), fy = by + 10 + s.fv * (bh - 42);
          glowDot(ctx, fx, fy, 4.4, isN ? '#fef1b6' : '#dafefe', hexA(isN ? COL_WARM : COL_CYAN, 0.95));
          if (S.mode === 'simple') {
            if (isN) {
              dot(ctx, fx, fy, 4.2, COL_WARM);
              txt(ctx, '−', fx, fy + 0.5, '#0f0c14', 8.5, 'center', 800, MONO);
            } else {
              ctx.beginPath(); ctx.arc(fx, fy, 5.0, 0, TAU);
              ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.7; ctx.stroke();
              txt(ctx, '+', fx, fy + 0.5, COL_ICE, 8.8, 'center', 800, MONO);
            }
          }
        }
      }

      // Nhãn trạng thái dưới buồng
      const regMsg = ionFrac >= 0.95 ? 'ION HÓA HOÀN TOÀN: Tạp chất đã nhả gần hết → hạt tự do ≈ N'
        : ionFrac >= 0.70 ? 'ION HÓA MỘT PHẦN: Vẫn còn hạt bị giữ ở quầng tạp chất'
        : 'ĐÓNG BĂNG (FREEZE-OUT): Quá lạnh, hạt bị trói chặt trong quầng Bohr!';
      ctx.fillStyle = 'rgba(15, 12, 20, 0.80)';
      ctx.fillRect(bx, by + bh - 22, bw, 22);
      txt(ctx, regMsg, bx + bw * 0.5, by + bh - 11, ionFrac < 0.7 ? C.c2 : C.ink, 9.8, 'center', 700, MONO);
      ctx.restore();

      rr(ctx, bx, by, bw, bh, 6);
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      // 2 đồng hồ bên phải: % Đã Ion hóa & Mật độ hạt tự do thực
      const mx = bx + bw + 10, mh = (bh - 10) * 0.5;
      st.ionNeedle += (ionFrac - st.ionNeedle) * Math.min(1, dt * 8);
      const ionAcc = ionFrac < 0.7 ? C.c2 : ionFrac >= 0.95 ? C.c1 : C.main;

      drawMeter(ctx, mx, by, meterW, mh, {
        title: 'TỶ LỆ ION HÓA',
        val: (ionFrac * 100).toFixed(1) + '%',
        sub: 'Còn kẹt: ' + unIonPct.toFixed(unIonPct < 1 ? 2 : 1) + '%',
        subCol: unIonPct > 10 ? C.c2 : C.mut,
        frac: st.ionNeedle,
        accent: ionAcc,
        zones: [[0, 0.7, C.c2], [0.7, 0.95, C.main], [0.95, 1, C.c1]]
      });

      const freeCar = isN ? sol.n : sol.p;
      drawMeter(ctx, mx, by + mh + 10, meterW, mh, {
        title: isN ? 'ELECTRON n₀' : 'LỖ TRỐNG p₀',
        val: fmtSci(freeCar, 2),
        sub: 'g = ' + (isN ? '2 (P)' : '4 (B)'),
        frac: clamp((lg10(freeCar) - 12) / 6.5, 0, 1),
        accent: isN ? C.main : C.c2
      });

      txt(ctx, (isN ? 'Donor P (g=2)' : 'Acceptor B (g=4)') + ' · N = ' + fmtPow(S.N) + ' cm⁻³ · T = ' + S.T + ' K (kT = ' + (sol.kT * 1000).toFixed(1) + ' meV)',
        chX + 12, chY + 17, C.ink, 10.3, 'left', 700, MONO);
      txt(ctx, ionFrac >= 0.95 ? 'ION HÓA HOÀN TOÀN' : ionFrac < 0.7 ? 'VÙNG ĐÓNG BĂNG' : 'BÁN ION HÓA',
        chX + chW - 12, chY + 17, ionAcc, 10.5, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 4 — BUỒNG BÙ TRỪ ĐIỆN TÍCH: DONOR P⁺ GẶP ACCEPTOR B⁻ (Mục 7, Câu 4)
   - Tinh thể Silicon chứa đồng thời cả Donor P⁺ (trường ấm) & Acceptor B⁻
     (trường lạnh). Các cặp bù trừ liên kết trao e⁻ (tia hồ quang ngắn), chỉ
     phần dư |N_d − N_a| mới tạo hạt dẫn trôi qua 2 điện cực!
   - Ampe kế kim cơ 2 chiều (Loại P ← 0 → Loại N): khi N_d = N_a kim rơi đúng về 0!
   ========================================================================== */
LABS.push({
  id: 'compensate', name: 'Bù trừ P⁺–B⁻', no: '7', secs: [7],
  S: { mode: 'simple', Nd: 8, Na: 3, nearNi: false },
  cols: '2.1fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng tinh thể bù trừ — Ion cố định P⁺/B⁻, cặp bù trừ & Ampe kế 2 chiều',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'Nd', l: 'Donor N_d', min: 0, max: 15, step: 1, f: v => v + '×10¹⁵' },
      { k: 'Na', l: 'Acceptor N_a', min: 0, max: 15, step: 1, f: v => v + '×10¹⁵' },
      { btn: 'Câu 4a (8 vs 3)', fn: p => { p.S.nearNi = false; p.S.Nd = 8; p.S.Na = 3; p.syncCtrls(); queueReact(p.tab, 'Nd'); } },
      { btn: 'Câu 4b (Dư 10¹⁰)', fn: p => { p.S.nearNi = true; p.S.Nd = 5; p.S.Na = 5; p.syncCtrls(); queueReact(p.tab, 'Nd'); } },
      { btn: 'Bù trừ hết (5=5)', fn: p => { p.S.nearNi = false; p.S.Nd = 5; p.S.Na = 5; p.syncCtrls(); queueReact(p.tab, 'Nd'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const ndReal = S.nearNi ? (5e15 + 1e10) : S.Nd * 1e15;
      const naReal = S.nearNi ? 5e15 : S.Na * 1e15;
      const diff = ndReal - naReal;
      // Nghiệm chính xác phương trình bậc hai trung hòa điện tích ở 300 K
      let n0, p0;
      if (diff >= 0) {
        n0 = diff * 0.5 + Math.sqrt(diff * diff * 0.25 + NI0 * NI0);
        p0 = (NI0 * NI0) / n0;
      } else {
        const ad = -diff;
        p0 = ad * 0.5 + Math.sqrt(ad * ad * 0.25 + NI0 * NI0);
        n0 = (NI0 * NI0) / p0;
      }

      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32, meterW = 92;
      const bx = chX + 24, by = chY + topBar + 4, bw = chW - meterW - 54, bh = chH - topBar - 14;

      // Điện cực thăm dò dòng yếu hai bên buồng
      rr(ctx, chX + 8, by + 12, 11, bh - 24, 3);
      ctx.fillStyle = C.c2; ctx.fill();
      txt(ctx, '−', chX + 13.5, by + bh * 0.5, C.bg, 10, 'center', 800, MONO);
      rr(ctx, bx + bw + 5, by + 12, 11, bh - 24, 3);
      ctx.fillStyle = C.main; ctx.fill();
      txt(ctx, '+', bx + bw + 10.5, by + bh * 0.5, C.bg, 10, 'center', 800, MONO);

      if (!st.donPos) {
        const rg = mkRng(707);
        st.donPos = Array.from({ length: 15 }, () => [0.10 + rg() * 0.80, 0.12 + rg() * 0.76]);
        st.accPos = Array.from({ length: 15 }, () => [0.10 + rg() * 0.80, 0.12 + rg() * 0.76]);
        st.carriers = Array.from({ length: 18 }, () => ({ u: rg(), v: 0.10 + rg() * 0.80, sp: 0.22 + rg() * 0.25 }));
        st.ampNeedle = 0.5;
      }

      const nDon = S.Nd, nAcc = S.Na;
      const nPair = Math.min(nDon, nAcc);
      const nFree = Math.abs(nDon - nAcc);
      const aspect = bw / Math.max(bh, 1);

      ctx.save();
      rr(ctx, bx, by, bw, bh, 6);
      ctx.clip();

      if (S.mode === 'field') {
        // Trường tĩnh điện 2D phân tầng quanh các ion P⁺ (Inferno) & B⁻ (Ice-Cyan)
        const resW = clamp(Math.round(bw * 0.44), 130, 200);
        const resH = clamp(Math.round(bh * 0.44), 90, 150);
        renderWaveField(ctx, bx, by, bw, bh, resW, resH, (u, v) => {
          let phi = 0;
          for (let i = 0; i < nDon; i++) {
            const d = Math.hypot((u - st.donPos[i][0]) * aspect, v - st.donPos[i][1]);
            if (d < 0.28) phi += Math.exp(-d / 0.068) * 0.92;
          }
          for (let i = 0; i < nAcc; i++) {
            const d = Math.hypot((u - st.accPos[i][0]) * aspect, v - st.accPos[i][1]);
            if (d < 0.28) phi -= Math.exp(-d / 0.068) * 0.92;
          }
          return clamp(phi, -1, 1);
        });
      } else {
        drawSimpleGrid(ctx, bx, by, bw, bh, 28);
      }

      // Các cặp P⁺ – B⁻ đã bù trừ lẫn nhau: vẽ dây nối trao e⁻ bị khóa
      for (let i = 0; i < nPair; i++) {
        const dp = st.donPos[i], ap = st.accPos[i];
        const x1 = bx + dp[0] * bw, y1 = by + dp[1] * (bh - 22);
        const x2 = bx + ap[0] * bw, y2 = by + ap[1] * (bh - 22);
        ln(ctx, x1, y1, x2, y2, S.mode === 'simple' ? 'rgba(254, 241, 182, 0.48)' : 'rgba(254, 241, 182, 0.35)', 1.3, [4, 4]);
        const ph = (t * 0.75 + i * 0.17) % 1;
        dot(ctx, x1 + (x2 - x1) * ph, y1 + (y2 - y1) * ph, 2.6, hexA(COL_WARM, 1 - ph));
      }

      // Vẽ các ion cố định P⁺ và B⁻
      for (let i = 0; i < nDon; i++) {
        const x = bx + st.donPos[i][0] * bw, y = by + st.donPos[i][1] * (bh - 22);
        drawNucleus(ctx, x, y, S.mode === 'simple' ? 8.2 : 5.8, COL_HOT, '#120f17');
        txt(ctx, S.mode === 'simple' ? 'P⁺' : '+', x, y + 0.5, '#0f0c14', S.mode === 'simple' ? 8.4 : 9.5, 'center', 800, MONO);
      }
      for (let i = 0; i < nAcc; i++) {
        const x = bx + st.accPos[i][0] * bw, y = by + st.accPos[i][1] * (bh - 22);
        drawNucleus(ctx, x, y, S.mode === 'simple' ? 8.2 : 5.8, COL_CYAN, '#120f17');
        txt(ctx, S.mode === 'simple' ? 'B⁻' : '−', x, y + 0.5, '#0f0c14', S.mode === 'simple' ? 8.4 : 9.5, 'center', 800, MONO);
      }

      // Hạt dẫn tự do dư (N_d > N_a: e⁻ vàng trôi sang phải; N_a > N_d: h⁺ cyan trôi sang trái)
      if (!S.nearNi && nFree > 0) {
        const isTypeN = nDon > nAcc;
        for (let i = 0; i < nFree; i++) {
          const c = st.carriers[i];
          const dir = isTypeN ? 1 : -1;
          const u = ((c.u + t * c.sp * dir) % 1 + 1) % 1;
          const cx = bx + u * bw, cy = by + c.v * (bh - 22);
          glowDot(ctx, cx, cy, 4.4, isTypeN ? '#fef1b6' : '#dafefe', hexA(isTypeN ? COL_WARM : COL_CYAN, 0.95));
          if (S.mode === 'simple') {
            if (isTypeN) {
              dot(ctx, cx, cy, 4.3, COL_WARM);
              txt(ctx, '−', cx, cy + 0.5, '#0f0c14', 8.5, 'center', 800, MONO);
            } else {
              ctx.beginPath(); ctx.arc(cx, cy, 5.2, 0, TAU);
              ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.7; ctx.stroke();
              txt(ctx, '+', cx, cy + 0.5, COL_ICE, 8.8, 'center', 800, MONO);
            }
          }
        }
      }

      const footTxt = S.nearNi
        ? 'Câu 4b (N_d − N_a = 10¹⁰ ~ nᵢ): Bù trừ gần tuyệt đối → Phải giữ căn bậc hai!'
        : nFree === 0
          ? 'Bù trừ hoàn toàn (N_d = N_a): Mọi e⁻ của P⁺ bị B⁻ nuốt hết → n₀ = p₀ = nᵢ!'
          : (nDon > nAcc
              ? `Bù trừ loại N: ${nPair}×10¹⁵ bị B⁻ nuốt, còn ${nFree}×10¹⁵ e⁻ tự do dẫn điện`
              : `Bù trừ loại P: ${nPair}×10¹⁵ bị P⁺ trung hòa, còn ${nFree}×10¹⁵ lỗ trống tự do`);
      ctx.fillStyle = 'rgba(15, 12, 20, 0.80)';
      ctx.fillRect(bx, by + bh - 22, bw, 22);
      txt(ctx, footTxt, bx + bw * 0.5, by + bh - 11, C.ink, 9.6, 'center', 700, MONO);
      ctx.restore();

      rr(ctx, bx, by, bw, bh, 6);
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      // Đồng hồ bên phải: Ampe kế 2 chiều (Loại P ← 0 → Loại N) & Đồng hồ hạt thiểu số
      const mx = bx + bw + 22, mh = (bh - 10) * 0.5;
      const ampTarget = S.nearNi ? 0.50 : clamp(0.5 + ((nDon - nAcc) / 15) * 0.45, 0.05, 0.95);
      st.ampNeedle += (ampTarget - st.ampNeedle) * Math.min(1, dt * 8);

      const majKind = diff > 0 ? 'LOẠI N' : diff < 0 ? 'LOẠI P' : 'THUẦN (nᵢ)';
      const majVal = diff >= 0 ? n0 : p0;
      const minVal = diff >= 0 ? p0 : n0;
      const majAcc = diff > 0 ? C.main : diff < 0 ? C.c2 : C.mut;

      drawMeter(ctx, mx, by, meterW, mh, {
        title: 'AMPE KẾ (P ← 0 → N)',
        val: fmtSci(majVal, 2),
        sub: majKind,
        subCol: majAcc,
        frac: st.ampNeedle,
        accent: majAcc,
        zones: [[0, 0.46, C.c2], [0.54, 1, C.main]]
      });

      drawMeter(ctx, mx, by + mh + 10, meterW, mh, {
        title: diff >= 0 ? 'THIỂU SỐ p₀' : 'THIỂU SỐ n₀',
        val: fmtSci(minVal, 2),
        sub: 'n₀p₀ = nᵢ²',
        frac: clamp((lg10(minVal) - 3) / 9, 0, 1),
        accent: diff >= 0 ? C.c2 : C.main
      });

      txt(ctx, 'Trung hòa: n₀ + N_a⁻ = p₀ + N_d⁺  |  Hiệu dụng: |N_d − N_a| = ' + (diff === 0 ? '0' : fmtSci(Math.abs(diff), 1)),
        chX + 12, chY + 17, C.ink, 10.3, 'left', 700, MONO);
      txt(ctx, 'n₀ = ' + fmtSci(n0, 2) + '  ·  p₀ = ' + fmtSci(p0, 2),
        chX + chW - 12, chY + 17, C.main, 10.3, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 5 — MÁY CẤY ION THIẾT KẾ PHA TẠP & VỊ TRÍ E_F (Mục 8, Câu 5 & Câu 6)
   - Khẩu súng cấy ion bắn luồng P⁺ (cam) hoặc B⁺ (cyan) cắm vào phiến Wafer Si
     đang có sẵn nền tạp chất (ví dụ nền B = 10¹⁶ ở Câu 5)!
   - Khi liều cấy vượt qua nền, trường mật độ 2D trong phiến Wafer ĐẢO LOẠI
     (Ice-Cyan → Inferno ấm)!
   - Hai đồng hồ cơ đo trực tiếp: Khoảng cách tới mép dải (eV & số kT, có vạch
     cảnh báo đỏ ngay mốc 3kT!) và Độ dẫn điện σ của tấm wafer.
   ========================================================================== */
LABS.push({
  id: 'designer', name: 'Cấy Ion & E_F', no: '8', secs: [8],
  S: { mode: 'simple', beam: 'P', baseNa: 16, dose: 2.24e16 },
  cols: '2.1fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Máy Cấy Ion (Ion Implanter) — Thiết kế pha tạp điều khiển khoảng cách |E_mép − E_F|',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'beam', seg: [['P', 'Cấy Donor P⁺'], ['B', 'Cấy Acceptor B⁺']] },
      { k: 'baseNa', l: 'Nền B sẵn', min: 0, max: 16.5, step: 0.5, f: v => v === 0 ? 'Thuần' : fmtPow(Math.pow(10, v)) },
      { k: 'dose', l: 'Liều cấy', min: 15, max: 18.8, step: 0.05, log: 1, f: v => fmtSci(v, 2) },
      { btn: 'Câu 5 (0.20eV)', fn: p => { p.S.beam = 'P'; p.S.baseNa = 16; p.S.dose = 2.24e16; p.syncCtrls(); queueReact(p.tab, 'dose'); } },
      { btn: 'Câu 6a (B·10¹⁶)', fn: p => { p.S.beam = 'B'; p.S.baseNa = 0; p.S.dose = 1e16; p.syncCtrls(); queueReact(p.tab, 'dose'); } },
      { btn: 'Câu 6b (B·10¹⁸)', fn: p => { p.S.beam = 'B'; p.S.baseNa = 0; p.S.dose = 1e18; p.syncCtrls(); queueReact(p.tab, 'dose'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const Na0 = S.baseNa === 0 ? 0 : Math.pow(10, S.baseNa);
      const Nd = S.beam === 'P' ? S.dose : 0;
      const Na = Na0 + (S.beam === 'B' ? S.dose : 0);
      const diff = Nd - Na;
      const isTypeN = diff > 0;
      const isIntrinsic = Math.abs(diff) < NI0 * 0.1;

      let n0, p0;
      if (diff >= 0) {
        n0 = diff * 0.5 + Math.sqrt(diff * diff * 0.25 + NI0 * NI0);
        p0 = (NI0 * NI0) / n0;
      } else {
        const ad = -diff;
        p0 = ad * 0.5 + Math.sqrt(ad * ad * 0.25 + NI0 * NI0);
        n0 = (NI0 * NI0) / p0;
      }

      // Khoảng cách từ E_F tới mép dải gần nhất (theo Boltzmann bài học & kiểm tra mốc 3kT)
      const distEdge = isTypeN ? KT300 * Math.log(NC0 / n0) : KT300 * Math.log(NV0 / p0);
      const distKT = distEdge / KT300;
      const sigma = Q_EL * (n0 * muSi(Nd + Na, true) + p0 * muSi(Nd + Na, false));

      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32, meterW = 94;
      const bx = chX + 10, by = chY + topBar + 4, bw = chW - meterW - 30, bh = chH - topBar - 14;

      if (!st.ions) {
        const rg = mkRng(808);
        st.ions = []; st.acc = 0; st.distNeedle = 0.5; st.sigNeedle = 0.2;
        st.subPts = Array.from({ length: 12 }, () => [0.08 + rg() * 0.84, 0.16 + rg() * 0.64]);
        st.impPts = Array.from({ length: 24 }, () => [0.07 + rg() * 0.86, 0.12 + rg() * 0.68]);
        st.mobPts = Array.from({ length: 20 }, () => ({ u: rg(), v: 0.12 + rg() * 0.66, vx: (rg() - 0.5) * 0.42, vy: (rg() - 0.5) * 0.36 }));
      }

      // 1. Súng cấy ion ở phía trên buồng chân không
      const beamCol = S.beam === 'P' ? COL_HOT : COL_CYAN;
      const beamLight = S.beam === 'P' ? '#fef1b6' : '#dafefe';
      const gunH = clamp(Math.round(bh * 0.24), 56, 74);
      const wafY = by + gunH + 6;
      const wafH = bh - gunH - 6;

      const gunW = clamp(bw * 0.38, 120, 176);
      const gunX = bx + (bw - gunW) * 0.5;
      rr(ctx, gunX, by, gunW, 24, 5);
      ctx.fillStyle = C.card; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
      txt(ctx, 'SÚNG CẤY ' + (S.beam === 'P' ? 'P⁺ (Donor)' : 'B⁺ (Acceptor)'), gunX + gunW * 0.5, by + 12, beamCol, 9.2, 'center', 800, MONO);

      const nozY = by + 24;
      const beamGrad = ctx.createLinearGradient(0, nozY, 0, wafY);
      beamGrad.addColorStop(0, hexA(beamCol, 0.34));
      beamGrad.addColorStop(1, hexA(beamCol, 0.04));
      ctx.beginPath();
      ctx.moveTo(gunX + gunW * 0.30, nozY);
      ctx.lineTo(gunX + gunW * 0.70, nozY);
      ctx.lineTo(bx + bw * 0.88, wafY);
      ctx.lineTo(bx + bw * 0.12, wafY);
      ctx.closePath();
      ctx.fillStyle = beamGrad; ctx.fill();

      const rate = 6 + clamp((lg10(S.dose) - 15) * 6, 0, 24);
      st.acc += dt * rate;
      while (st.acc >= 1) {
        st.acc -= 1;
        if (st.ions.length < 36) {
          const uEnd = 0.14 + Math.random() * 0.72;
          st.ions.push({ u0: 0.5 + (uEnd - 0.5) * 0.22, u1: uEnd, p: 0, sp: 1.5 + Math.random() * 0.9 });
        }
      }
      for (let i = st.ions.length - 1; i >= 0; i--) {
        const io = st.ions[i];
        io.p += dt * io.sp;
        if (io.p >= 1) { st.ions.splice(i, 1); continue; }
        const ix = bx + (io.u0 + (io.u1 - io.u0) * io.p) * bw;
        const iy = nozY + io.p * (wafY - nozY);
        glowDot(ctx, ix, iy, 3.0, beamLight, hexA(beamCol, 0.9));
        dot(ctx, ix, iy, 2.2, beamCol);
      }

      // 2. Render bên trong lòng phiến Wafer Silicon
      ctx.save();
      rr(ctx, bx, wafY, bw, wafH, 7);
      ctx.clip();

      const strength = clamp((lg10(Math.max(Math.abs(diff), NI0)) - 13) / 6.0, 0.12, 1.0);
      const sign = isIntrinsic ? 0 : (isTypeN ? 1 : -1);

      if (S.mode === 'field') {
        const resW = clamp(Math.round(bw * 0.45), 130, 210);
        const resH = clamp(Math.round(wafH * 0.45), 72, 120);
        renderWaveField(ctx, bx, wafY, bw, wafH, resW, resH, (u, v) => {
          // Phía trên gần mặt wafer là lớp cấy ion đậm nhất, thấm đều xuống dưới
          const depth = Math.exp(-v * 0.75);
          const ripple = Math.sin(u * 14 + t * 2.6) * Math.cos(v * 7 - t * 2.1) * 0.14;
          return sign * clamp(strength * (0.58 + 0.42 * depth + ripple), 0, 1);
        });

        // Lưới nguyên tử Si trong wafer
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 9; c++) {
            drawNucleus(ctx, bx + ((c + 0.5) / 9) * bw, wafY + ((r + 0.5) / 4) * (wafH - 22), 3.6, 'rgba(255,255,255,0.72)', '#14111c');
          }
        }
      } else {
        // Chế độ ĐƠN GIẢN: Thấy rõ ion nền B⁻, ion cấy P⁺/B⁻ cắm vào wafer & hạt tải dư sau đảo loại
        drawSimpleGrid(ctx, bx, wafY, bw, wafH, 26);
        if (!isIntrinsic) {
          ctx.fillStyle = hexA(isTypeN ? COL_WARM : COL_CYAN, 0.08 * strength);
          ctx.fillRect(bx, wafY, bw, wafH - 22);
        }
        // Ion nền Acceptor B⁻ sẵn có trong phiến đế
        const nSub = Na0 > 0 ? clamp(Math.round((S.baseNa - 14) * 4), 3, 12) : 0;
        for (let i = 0; i < nSub; i++) {
          const x = bx + st.subPts[i][0] * bw, y = wafY + st.subPts[i][1] * (wafH - 22);
          drawNucleus(ctx, x, y, 6.8, COL_CYAN, '#120f17');
          txt(ctx, 'B⁻', x, y + 0.5, '#0f0c14', 7.6, 'center', 800, MONO);
        }
        // Ion được cấy từ súng bắn vào
        const nImp = clamp(Math.round((lg10(S.dose) - 14.8) * 6), 4, 22);
        for (let i = 0; i < nImp; i++) {
          const x = bx + st.impPts[i][0] * bw, y = wafY + st.impPts[i][1] * (wafH - 22);
          const isP = S.beam === 'P';
          drawNucleus(ctx, x, y, 6.8, isP ? COL_HOT : COL_CYAN, '#120f17');
          txt(ctx, isP ? 'P⁺' : 'B⁻', x, y + 0.5, '#0f0c14', 7.6, 'center', 800, MONO);
        }
        // Hạt tải đa số tự do chạy trong wafer theo loại N / P sau bù trừ
        if (!isIntrinsic) {
          const nMob = clamp(Math.round((lg10(Math.abs(diff)) - 14.5) * 5.2), 4, 20);
          for (let i = 0; i < nMob; i++) {
            const pt = st.mobPts[i];
            const u = ((pt.u + t * pt.vx) % 1 + 1) % 1;
            const v = ((pt.v + t * pt.vy) % 1 + 1) % 1;
            const mx_ = bx + 10 + u * (bw - 20), my_ = wafY + 10 + v * (wafH - 42);
            if (isTypeN) {
              glowDot(ctx, mx_, my_, 3.8, '#fef1b6', hexA(COL_WARM, 0.9));
              dot(ctx, mx_, my_, 3.8, COL_WARM);
              txt(ctx, '−', mx_, my_ + 0.5, '#0f0c14', 8, 'center', 800, MONO);
            } else {
              glowDot(ctx, mx_, my_, 3.8, '#dafefe', hexA(COL_CYAN, 0.85));
              ctx.beginPath(); ctx.arc(mx_, my_, 4.6, 0, TAU);
              ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.6; ctx.stroke();
              txt(ctx, '+', mx_, my_ + 0.5, COL_ICE, 8.2, 'center', 800, MONO);
            }
          }
        }
      }

      const wafLbl = isIntrinsic
        ? 'ĐẢO LOẠI / BÙ TRỪ HOÀN TOÀN (N_d ≈ N_a → Wafer trở về thuần!)'
        : (isTypeN ? 'WAFER LOẠI N' : 'WAFER LOẠI P') +
          ' · N_eff = ' + fmtSci(Math.abs(diff), 2) + ' cm⁻³' +
          (distKT < 3 ? ' · CẢNH BÁO < 3kT (Sắp suy biến!)' : ' · Không suy biến (Boltzmann tốt)');
      ctx.fillStyle = 'rgba(15, 12, 20, 0.82)';
      ctx.fillRect(bx, wafY + wafH - 22, bw, 22);
      txt(ctx, wafLbl, bx + bw * 0.5, wafY + wafH - 11, distKT < 3 ? C.err : C.ink, 9.6, 'center', 700, MONO);
      ctx.restore();

      rr(ctx, bx, wafY, bw, wafH, 7);
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      // 3. Hai đồng hồ kim cơ bên phải: Độ sâu |E_mép − E_F| (vạch cảnh báo 3kT) & Độ dẫn σ
      const mx = bx + bw + 10, mh = (bh - 10) * 0.5;
      const dTarget = clamp(distKT / 15.0, 0, 1);
      const sTarget = clamp((lg10(sigma) + 2) / 4.2, 0, 1);
      st.distNeedle += (dTarget - st.distNeedle) * Math.min(1, dt * 8);
      st.sigNeedle += (sTarget - st.sigNeedle) * Math.min(1, dt * 8);

      drawMeter(ctx, mx, by, meterW, mh, {
        title: isTypeN ? 'E_c − E_F' : 'E_F − E_v',
        val: distEdge.toFixed(3) + ' eV',
        sub: distKT.toFixed(1) + ' kT ' + (distKT < 3 ? '(<3kT!)' : '(≥3kT)'),
        subCol: distKT < 3 ? C.err : C.c1,
        frac: st.distNeedle,
        accent: distKT < 3 ? C.err : C.main,
        zones: [[0, 0.20, C.err], [0.20, 1, C.c1]]
      });

      drawMeter(ctx, mx, by + mh + 10, meterW, mh, {
        title: 'ĐỘ DẪN WAFER σ',
        val: sigma >= 1 ? sigma.toFixed(1) + ' S/cm' : fmtSci(sigma, 1),
        sub: 'ρ = ' + (1 / Math.max(sigma, 1e-12) < 100 ? (1 / sigma).toFixed(2) : fmtSci(1 / sigma, 1)) + ' Ω·cm',
        frac: st.sigNeedle,
        accent: isTypeN ? C.main : C.c2
      });

      txt(ctx, 'Đế nền B: ' + (Na0 ? fmtPow(Na0) : '0') + '  |  Cấy ' + (S.beam === 'P' ? 'Donor P⁺' : 'Acceptor B⁺') + ': ' + fmtSci(S.dose, 2) + ' cm⁻³',
        chX + 12, chY + 17, C.ink, 10.3, 'left', 700, MONO);
      txt(ctx, (isTypeN ? 'E_c−E_F = ' : 'E_F−E_v = ') + distEdge.toFixed(3) + ' eV (' + distKT.toFixed(1) + ' kT)',
        chX + chW - 12, chY + 17, distKT < 3 ? C.err : C.main, 10.4, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 6 — BUỒNG KIỂM ĐỊNH 3 CHẾ ĐỘ NHIỆT CHIP SILICON (Mục 9)
   - Không phải lò 3 vật liệu của lab-b4! Đây là buồng kiểm định 1 chip Silicon
     pha tạp N_d khi quét nhiệt từ 30 K (vũ trụ lạnh) → 300 K (cửa sổ ngoại lai
     ổn định) → 850 K (quá nhiệt sụp đổ thành nội tại!).
   - Kính hiển vi 2D thấy ngay sự chuyển pha thực: Quầng đóng băng → Hạt ngoại
     lai ổn định → Cơn bão sinh cặp nhiệt phá vỡ pha tạp!
   - Hai đồng hồ cơ bên phải: Tỷ số n₀/N_d (ổn định đúng vạch 1.0× ở vùng ngoại
     lai!) & Nhiệt kế đánh dấu giới hạn làm việc T_max phụ thuộc N_d!
   ========================================================================== */
LABS.push({
  id: 'thermal', name: '3 Vùng Nhiệt độ', no: '9', secs: [9],
  S: { mode: 'simple', T: 300, Nd: 1e15 },
  cols: '2.1fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng thử nghiệm nhiệt chip Si — Đóng băng · Cửa sổ Ngoại lai · Sụp đổ Nội tại',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'T', l: 'Nhiệt độ T', min: 30, max: 850, step: 10, f: v => v + ' K' },
      { k: 'Nd', l: 'Pha tạp N_d', min: 14, max: 17, step: 0.25, log: 1, f: v => fmtPow(v) },
      { btn: 'Đóng băng (40K)', fn: p => { p.S.T = 40; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: 'Cửa sổ ổn định (300K)', fn: p => { p.S.T = 300; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: 'Quá nhiệt Nội tại (700K)', fn: p => { p.S.T = 700; p.syncCtrls(); queueReact(p.tab, 'T'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const sol = solveNeutrality(S.T, S.Nd, 0);
      const ni = ni_of(S.T);
      // Tính nhanh nhiệt độ sụp đổ nội tại T_max (nơi n_i(T) ≈ 0.5·N_d)
      let Tmax = 850;
      for (let Tk = 300; Tk <= 950; Tk += 10) {
        if (ni_of(Tk) >= 0.5 * S.Nd) { Tmax = Tk; break; }
      }
      const regime = sol.ionD < 0.85 ? 'freeze' : (ni >= 0.35 * S.Nd ? 'intrinsic' : 'extrinsic');
      const ratioN = sol.n / S.Nd;

      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      const bCol = regime === 'freeze' ? C.c2 : regime === 'intrinsic' ? C.err : C.c1;
      drawScopeBg(ctx, chX, chY, chW, chH, 10, C.g);

      const topBar = 32, meterW = 94;
      const bx = chX + 10, by = chY + topBar + 4, bw = chW - meterW - 30, bh = chH - topBar - 14;

      if (!st.donors) {
        const rg = mkRng(909);
        st.donors = Array.from({ length: 8 }, (_, i) => ({
          u: ((i % 4) + 0.5 + (rg() - 0.5) * 0.28) / 4,
          v: (Math.floor(i / 4) + 0.5 + (rg() - 0.5) * 0.28) / 2,
          ph: rg() * TAU
        }));
        st.eMob = Array.from({ length: 34 }, () => ({ u: rg(), v: rg(), vx: (rg() - 0.5) * 0.6, vy: (rg() - 0.5) * 0.6 }));
        st.hMob = Array.from({ length: 26 }, () => ({ u: rg(), v: rg(), vx: (rg() - 0.5) * 0.5, vy: (rg() - 0.5) * 0.5 }));
        st.bursts = [];
        st.rNeedle = 0.5; st.tNeedle = 0.35;
      }

      const aspect = bw / Math.max(bh, 1);
      ctx.save();
      rr(ctx, bx, by, bw, bh, 6);
      ctx.clip();

      const intrFrac = clamp(ni / Math.max(S.Nd, 1), 0, 1.4);
      if (S.mode === 'field') {
        // Trường 2D phản ánh đúng 3 trạng thái nhiệt của tinh thể Silicon
        const resW = clamp(Math.round(bw * 0.44), 130, 200);
        const resH = clamp(Math.round(bh * 0.44), 90, 150);
        renderWaveField(ctx, bx, by, bw, bh, resW, resH, (u, v) => {
          if (regime === 'freeze') {
            // Đóng băng: quầng Bohr co chặt quanh 8 tâm donor P
            let s = 0;
            for (let i = 0; i < st.donors.length; i++) {
              const d = Math.hypot((u - st.donors[i].u) * aspect, v - st.donors[i].v);
              if (d < 0.34) s += Math.exp(-d / 0.082);
            }
            return clamp(s * (1 - sol.ionD * 0.7), 0, 1);
          }
          // Ngoại lai / Nội tại: sóng nhiệt trong mạng; khi Nội tại xuất hiện pha kép cam & cyan hỗn loạn!
          const w1 = Math.sin(u * 13 - t * (2.5 + S.T / 200)) * Math.cos(v * 9 + t * 2.2);
          const w2 = Math.cos((u + v) * 10 + t * 3.1);
          if (regime === 'extrinsic') {
            return clamp(0.42 + 0.25 * w1, 0, 0.85);
          }
          return clamp((w1 * 0.65 + w2 * 0.55) * clamp(0.65 + intrFrac * 0.35, 0.65, 1.0), -1, 1);
        });
      } else {
        drawSimpleGrid(ctx, bx, by, bw, bh, 28);
        if (regime === 'freeze') {
          ctx.fillStyle = hexA(COL_CYAN, 0.07);
          ctx.fillRect(bx, by, bw, bh - 22);
        } else if (regime === 'intrinsic') {
          ctx.fillStyle = hexA(COL_HOT, 0.07 * clamp(intrFrac, 0.4, 1));
          ctx.fillRect(bx, by, bw, bh - 22);
        }
      }

      // Mạng hạt nhân Si 8×5 rung mạnh dần theo √T
      const vib = 0.2 + Math.pow(S.T / 850, 1.2) * 3.8;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 8; c++) {
          const ax = bx + ((c + 0.5) / 8) * bw + Math.sin(t * 17 + r * 4 + c * 2) * vib;
          const ay = by + ((r + 0.5) / 5) * (bh - 22) + Math.cos(t * 18 + c * 3 + r * 5) * vib;
          if (S.mode === 'simple') dot(ctx, ax, ay, 2.5, 'rgba(255,255,255,0.20)');
          else drawNucleus(ctx, ax, ay, 3.6, 'rgba(255,255,255,0.68)', '#14111c');
        }
      }

      // 8 nguyên tử donor P cố định
      const nIonDon = Math.round(sol.ionD * st.donors.length);
      st.donors.forEach((d, i) => {
        const dx = bx + d.u * bw, dy = by + d.v * (bh - 22);
        if (i < nIonDon) {
          drawNucleus(ctx, dx, dy, S.mode === 'simple' ? 7.6 : 5.6, COL_HOT, '#120f17');
          txt(ctx, S.mode === 'simple' ? 'P⁺' : '+', dx, dy + 0.5, '#0f0c14', S.mode === 'simple' ? 8.0 : 9, 'center', 800, MONO);
        } else {
          if (S.mode === 'simple') {
            ctx.fillStyle = hexA(COL_WARM, 0.14);
            ctx.beginPath(); ctx.arc(dx, dy, 17, 0, TAU); ctx.fill();
            ctx.beginPath(); ctx.arc(dx, dy, 15, 0, TAU);
            ctx.strokeStyle = hexA(COL_WARM, 0.72); ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
          }
          drawNucleus(ctx, dx, dy, S.mode === 'simple' ? 7.0 : 5.6, COL_PURP, '#120f17');
          if (S.mode === 'simple') txt(ctx, 'P', dx, dy + 0.5, '#ffffff', 8.2, 'center', 800, MONO);
          const a = t * 2.5 + d.ph;
          const ox = dx + Math.cos(a) * 15, oy = dy + Math.sin(a) * 15;
          glowDot(ctx, ox, oy, 3.4, '#fef1b6', hexA(COL_WARM, 0.9));
          if (S.mode === 'simple') dot(ctx, ox, oy, 3.2, COL_WARM);
        }
      });

      // Electron ngoại lai (8 hạt khi ion hóa đủ) + cơn bão cặp nhiệt e⁻/h⁺ khi T cao!
      const nThermalPairs = Math.round(clamp(intrFrac * 22, 0, 24));
      const nShowE = clamp(nIonDon + nThermalPairs, 0, 34);
      const sp = 0.3 + Math.sqrt(S.T / 300) * 0.7;

      for (let i = 0; i < nShowE; i++) {
        const pt = st.eMob[i];
        pt.u = ((pt.u + pt.vx * dt * sp) % 1 + 1) % 1;
        pt.v = ((pt.v + pt.vy * dt * sp) % 1 + 1) % 1;
        const ex_ = bx + 8 + pt.u * (bw - 16), ey_ = by + 10 + pt.v * (bh - 40);
        glowDot(ctx, ex_, ey_, 4.0, '#fef1b6', hexA(COL_WARM, 0.95));
        if (S.mode === 'simple') {
          dot(ctx, ex_, ey_, 4.0, COL_WARM);
          txt(ctx, '−', ex_, ey_ + 0.5, '#0f0c14', 8.2, 'center', 800, MONO);
        }
      }
      for (let i = 0; i < nThermalPairs; i++) {
        const pt = st.hMob[i];
        pt.u = ((pt.u + pt.vx * dt * sp) % 1 + 1) % 1;
        pt.v = ((pt.v + pt.vy * dt * sp) % 1 + 1) % 1;
        const hx = bx + 8 + pt.u * (bw - 16), hy = by + 10 + pt.v * (bh - 40);
        glowDot(ctx, hx, hy, 4.0, '#dafefe', hexA(COL_CYAN, 0.92));
        ctx.beginPath(); ctx.arc(hx, hy, 5.0, 0, TAU);
        ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.6; ctx.stroke();
        if (S.mode === 'simple') txt(ctx, '+', hx, hy + 0.5, COL_ICE, 8.5, 'center', 800, MONO);
      }

      // Chớp sinh cặp nhiệt liên kết Si–Si gãy vỡ khi nóng
      if (nThermalPairs > 2 && Math.random() < dt * (2 + nThermalPairs * 0.5)) {
        st.bursts.push({ u: rnd(0.1, 0.9), v: rnd(0.12, 0.88), life: 1.0 });
      }
      for (let i = st.bursts.length - 1; i >= 0; i--) {
        const b = st.bursts[i];
        b.life -= dt * 2.2;
        if (b.life <= 0) { st.bursts.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(bx + b.u * bw, by + b.v * bh, 3 + (1 - b.life) * 20, 0, TAU);
        ctx.strokeStyle = hexA(COL_HOT, b.life * 0.85); ctx.lineWidth = 1.6; ctx.stroke();
      }

      const foot = regime === 'freeze'
        ? 'VÙNG ĐÓNG BĂNG: Quá lạnh, donor giữ chặt e⁻ → n₀ tụt dưới N_d'
        : regime === 'extrinsic'
          ? 'CỬA SỔ NGOẠI LAI (ỔN ĐỊNH): n₀ ≈ N_d phẳng — Vùng làm việc tin cậy của chip!'
          : 'SỤP ĐỔ NỘI TẠI (QUÁ NHIỆT): Mưa cặp nhiệt nᵢ ≫ N_d lấn át pha tạp, E_F → E_Fi!';
      ctx.fillStyle = 'rgba(15, 12, 20, 0.82)';
      ctx.fillRect(bx, by + bh - 22, bw, 22);
      txt(ctx, foot, bx + bw * 0.5, by + bh - 11, regime === 'extrinsic' ? C.ink : bCol, 9.6, 'center', 700, MONO);
      ctx.restore();

      rr(ctx, bx, by, bw, bh, 6);
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      // 2 đồng hồ bên phải: Tỷ số n₀ / N_d & Nhiệt kế giới hạn T_max
      const mx = bx + bw + 10, mh = (bh - 10) * 0.5;
      // Ánh xạ n₀/N_d: 0→0, 1.0→0.50 (giữa thang ổn định!), >10→1.0
      const rFrac = ratioN <= 1 ? (ratioN * 0.5) : clamp(0.5 + Math.log10(ratioN) * 0.35, 0.5, 1);
      const tFrac = clamp((S.T - 30) / 820, 0, 1);
      const tMaxFrac = clamp((Tmax - 30) / 820, 0.25, 0.98);
      st.rNeedle += (rFrac - st.rNeedle) * Math.min(1, dt * 8);
      st.tNeedle += (tFrac - st.tNeedle) * Math.min(1, dt * 8);

      drawMeter(ctx, mx, by, meterW, mh, {
        title: 'TỶ SỐ n₀ / N_d',
        val: ratioN < 10 ? ratioN.toFixed(2) + '×' : fmtSci(ratioN, 1) + '×',
        sub: 'n₀ = ' + fmtSci(sol.n, 1),
        frac: st.rNeedle,
        accent: bCol,
        zones: [[0, 0.42, C.c2], [0.42, 0.58, C.c1], [0.58, 1, C.err]]
      });

      drawMeter(ctx, mx, by + mh + 10, meterW, mh, {
        title: 'NHIỆT KẾ CHIP',
        val: S.T + ' K',
        sub: 'Giới hạn T_max ≈ ' + Tmax + ' K',
        subCol: S.T >= Tmax ? C.err : C.mut,
        frac: st.tNeedle,
        accent: bCol,
        zones: [[0, 0.14, C.c2], [0.14, tMaxFrac, C.c1], [tMaxFrac, 1, C.err]]
      });

      txt(ctx, 'Chip Si pha N_d = ' + fmtPow(S.Nd) + ' cm⁻³  |  nᵢ(T) = ' + fmtSci(ni, 1) + '  |  E_F − E_Fi = ' + (sol.Ef - sol.Efi).toFixed(2) + ' eV',
        chX + 12, chY + 17, C.ink, 10.3, 'left', 700, MONO);
      txt(ctx, regime === 'freeze' ? 'ĐÓNG BĂNG' : regime === 'extrinsic' ? 'NGOẠI LAI · ỔN ĐỊNH' : 'QUÁ NHIỆT · NỘI TẠI',
        chX + chW - 12, chY + 17, bCol, 10.5, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 7 — BÀN ÉP TIẾP XÚC N–P: VÙNG NGHÈO & VÔN KẾ THẾ NỘI TẠI V_bi (Mục 10)
   - Bàn thí nghiệm cơ học ghép 2 phiến Silicon: Phiến loại N (trái, Inferno)
     và Phiến loại P (phải, Ice-Cyan).
   - Khi bấm "Ghép tiếp xúc": Hai phiến áp khít nhau → bùng lóe khuếch tán &
     tái hợp → mở ra Vùng nghèo tối màu ở giữa để lộ ion cố định P⁺ và B⁻
     (bất đối xứng x_p / x_n = N_d / N_a!) cùng điện trường nội tại E_bi!
   - Vôn kế tĩnh điện kim cơ nối dây dò đo trực tiếp qV_bi = kT·ln(N_d N_a/nᵢ²).
   ========================================================================== */
LABS.push({
  id: 'junction', name: 'Tiếp xúc N–P', no: '10', secs: [10],
  S: { mode: 'simple', joined: 1, Nd: 1e17, Na: 1e16 },
  cols: '2.1fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Bàn ép tiếp xúc N–P — Khuếch tán, Vùng nghèo bất đối xứng, E_bi & Vôn kế thế nội tại V_bi',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['simple', 'Đơn giản'], ['field', 'Trường 2D']] },
      { k: 'joined', seg: [[0, 'Tách rời hai phiến'], [1, 'Ghép tiếp xúc (Cân bằng)']] },
      { k: 'Nd', l: 'Phiến N (N_d)', min: 15, max: 18, step: 0.25, log: 1, f: v => fmtPow(v) },
      { k: 'Na', l: 'Phiến P (N_a)', min: 15, max: 18, step: 0.25, log: 1, f: v => fmtPow(v) },
      { btn: 'VD Bài 6 (10¹⁷/10¹⁶)', fn: p => { p.S.joined = 1; p.S.Nd = 1e17; p.S.Na = 1e16; p.syncCtrls(); queueReact(p.tab, 'Nd'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const Vbi = KT300 * Math.log((S.Nd * S.Na) / (NI0 * NI0));

      // Tỷ lệ bề rộng vùng nghèo theo điều kiện trung hòa N_d·x_n = N_a·x_p!
      const fracN = S.Na / (S.Nd + S.Na);
      const fracP = S.Nd / (S.Nd + S.Na);

      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);

      const topBar = 32, meterW = 94;
      const bx = chX + 10, by = chY + topBar + 4, bw = chW - meterW - 30, bh = chH - topBar - 14;

      if (st.joinAnim == null) {
        const rg = mkRng(1010);
        st.joinAnim = S.joined ? 1 : 0;
        st.vNeedle = S.joined ? Vbi / 1.12 : 0;
        st.ePts = Array.from({ length: 18 }, () => ({ u: rg(), v: 0.1 + rg() * 0.8, vx: (rg() - 0.5) * 0.35, vy: (rg() - 0.5) * 0.35 }));
        st.hPts = Array.from({ length: 18 }, () => ({ u: rg(), v: 0.1 + rg() * 0.8, vx: (rg() - 0.5) * 0.32, vy: (rg() - 0.5) * 0.32 }));
        st.flashes = [];
      }

      const prevJ = st.joinAnim;
      const targetJ = S.joined ? 1 : 0;
      st.joinAnim += (targetJ - st.joinAnim) * Math.min(1, dt * 6.5);
      if (Math.abs(targetJ - st.joinAnim) < 0.004) st.joinAnim = targetJ;
      const q = st.joinAnim;

      if (prevJ < 0.72 && q >= 0.72) {
        for (let i = 0; i < 12; i++) {
          st.flashes.push({ xOff: rnd(-14, 14), v: rnd(0.10, 0.84), life: 1.0 });
        }
      }

      const maxGap = clamp(bw * 0.14, 28, 56);
      const gap = (1 - q) * maxGap;
      const slabW = (bw - gap) * 0.5;
      const midX = bx + bw * 0.5;
      const nX0 = bx;
      const pX0 = bx + slabW + gap;

      const totalDep = q * clamp(bw * (0.28 + 0.04 * (17.5 - 0.5 * (lg10(S.Nd) + lg10(S.Na)))), 54, bw * 0.46);
      const xnPx = clamp(totalDep * fracN, q > 0.25 ? 14 : 0, slabW * 0.72);
      const xpPx = clamp(totalDep * fracP, q > 0.25 ? 14 : 0, slabW * 0.72);
      const depL = midX - xnPx;
      const depR = midX + xpPx;

      // 1. Vẽ 2 phiến N và P với Vùng Nghèo tối ở giữa
      const drawHalfSlab = (sx, sw, isN, depEdgePx) => {
        ctx.save();
        rr(ctx, sx, by, sw, bh, 6);
        ctx.clip();

        const dopStrength = clamp((lg10(isN ? S.Nd : S.Na) - 14.2) / 4.2, 0.35, 1.0);
        if (S.mode === 'field') {
          const resW = clamp(Math.round(sw * 0.48), 80, 140);
          const resH = clamp(Math.round(bh * 0.45), 86, 145);
          const depU = isN ? (1 - depEdgePx / sw) : (depEdgePx / sw);
          renderWaveField(ctx, sx, by, sw, bh, resW, resH, (u, v) => {
            // Trong vùng nghèo (không còn biển hạt tự do) → nền đêm sâu tối màu
            const distFromDep = isN ? (depU - u) : (u - depU);
            const mask = q < 0.05 ? 1.0 : clamp(distFromDep / 0.09, 0, 1);
            const ripple = Math.sin(u * 12 + (isN ? -t : t) * 2.4) * Math.cos(v * 9 + t * 1.9) * 0.16;
            return (isN ? 1 : -1) * clamp(mask * dopStrength * (0.72 + ripple), 0, 1);
          });
        } else {
          // Chế độ ĐƠN GIẢN: Phân tách cực rõ Vùng trung hòa (nhuộm nhẹ) và Vùng nghèo (nền tối để lộ ion cố định)
          drawSimpleGrid(ctx, sx, by, sw, bh, 26);
          const neutX = isN ? sx : (sx + depEdgePx);
          const neutW = Math.max(0, sw - depEdgePx);
          ctx.fillStyle = hexA(isN ? COL_WARM : COL_CYAN, 0.12 * dopStrength);
          ctx.fillRect(neutX, by, neutW, bh - 22);
          if (q > 0.2 && depEdgePx > 2) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
            ctx.fillRect(isN ? (sx + sw - depEdgePx) : sx, by, depEdgePx, bh - 22);
          }
        }

        // Lưới ion tạp chất cố định lộ ra trong vùng nghèo (P⁺ cam bên N, B⁻ cyan bên P)
        const nRows = 5;
        if (q > 0.25) {
          const colsDep = Math.max(1, Math.round(depEdgePx / 24));
          for (let r = 0; r < nRows; r++) {
            const iy = by + ((r + 0.5) / nRows) * (bh - 22);
            for (let c = 0; c < colsDep; c++) {
              const frac = (c + 0.5) / colsDep;
              const ix = isN ? (sx + sw - frac * depEdgePx) : (sx + frac * depEdgePx);
              drawNucleus(ctx, ix, iy, S.mode === 'simple' ? 6.8 : 5.2, isN ? COL_HOT : COL_CYAN, '#120f17');
              txt(ctx, isN ? '+' : '−', ix, iy + 0.5, '#0f0c14', 9.2, 'center', 800, MONO);
            }
          }
        }

        // Các hạt tự do chuyển động trong vùng trung hòa (bị chắn lại trước mép vùng nghèo!)
        const pts = isN ? st.ePts : st.hPts;
        const nShow = Math.round(clamp((lg10(isN ? S.Nd : S.Na) - 14.5) * 4.5, 6, 18));
        for (let i = 0; i < nShow; i++) {
          const pt = pts[i];
          pt.u = ((pt.u + pt.vx * dt) % 1 + 1) % 1;
          pt.v = ((pt.v + pt.vy * dt) % 1 + 1) % 1;
          const xMin = isN ? sx + 10 : sx + depEdgePx + 10;
          const xMax = isN ? sx + sw - depEdgePx - 10 : sx + sw - 10;
          if (xMax > xMin) {
            const px = xMin + pt.u * (xMax - xMin);
            const py = by + 16 + pt.v * (bh - 42);
            glowDot(ctx, px, py, 3.8, isN ? '#fef1b6' : '#dafefe', hexA(isN ? COL_WARM : COL_CYAN, 0.92));
            if (S.mode === 'simple') {
              if (isN) {
                dot(ctx, px, py, 3.8, COL_WARM);
                txt(ctx, '−', px, py + 0.5, '#0f0c14', 8, 'center', 800, MONO);
              } else {
                ctx.beginPath(); ctx.arc(px, py, 4.6, 0, TAU);
                ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.6; ctx.stroke();
                txt(ctx, '+', px, py + 0.5, COL_ICE, 8.2, 'center', 800, MONO);
              }
            }
          }
        }

        // Nhãn dưới từng phiến
        ctx.fillStyle = 'rgba(15, 12, 20, 0.78)';
        ctx.fillRect(sx, by + bh - 22, sw, 22);
        txt(ctx, isN ? ('PHIẾN N · N_d = ' + fmtPow(S.Nd)) : ('PHIẾN P · N_a = ' + fmtPow(S.Na)),
          sx + sw * 0.5, by + bh - 11, isN ? C.main : C.c2, 9.8, 'center', 700, MONO);
        ctx.restore();

        rr(ctx, sx, by, sw, bh, 6);
        ctx.strokeStyle = C.g;
        ctx.lineWidth = 1.2; ctx.stroke();
      };

      drawHalfSlab(nX0, slabW, true, xnPx);
      drawHalfSlab(pX0, slabW, false, xpPx);

      // 2. Đường biên vùng nghèo & Các mũi tên điện trường nội tại E_bi hướng N → P
      if (q > 0.35) {
        ln(ctx, depL, by + 4, depL, by + bh - 24, COL_ICE, 1.5, [5, 4]);
        ln(ctx, depR, by + 4, depR, by + bh - 24, COL_ICE, 1.5, [5, 4]);
        ln(ctx, midX, by + 4, midX, by + bh - 24, 'rgba(255,255,255,0.45)', 1.2);
        if (q > 0.7) {
          for (let r = 0; r < 3; r++) {
            const ey = by + 34 + r * ((bh - 90) / 2);
            arrow(ctx, depL + 6, ey, depR - 6, ey, C.main, 2.0);
          }
          ctx.fillStyle = 'rgba(15, 12, 20, 0.85)';
          rr(ctx, midX - 44, by + 6, 88, 18, 4); ctx.fill();
          txt(ctx, 'Vùng nghèo · E_bi →', midX, by + 15, C.ink, 8.8, 'center', 700, MONO);
        }
      } else if (gap > 8) {
        txt(ctx, 'KHE TÁCH', midX, by + bh * 0.48, C.mut, 9, 'center', 700, MONO);
      }

      // Lóe sáng tái hợp tại mặt tiếp xúc lúc vừa ghép
      for (let i = st.flashes.length - 1; i >= 0; i--) {
        const fl = st.flashes[i];
        fl.life -= dt * 2.2;
        if (fl.life <= 0) { st.flashes.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(midX + fl.xOff, by + fl.v * bh, 4 + (1 - fl.life) * 16, 0, TAU);
        ctx.strokeStyle = hexA('#fef1b6', fl.life * 0.9); ctx.lineWidth = 1.8; ctx.stroke();
      }

      // 3. Hai đồng hồ cơ bên phải: Vôn kế đo thế nội tại V_bi & Tỷ lệ phân bố vùng nghèo x_p/x_n
      const mx = bx + bw + 10, mh = (bh - 10) * 0.5;
      const vNow = q * Vbi;
      st.vNeedle += ((vNow / 1.12) - st.vNeedle) * Math.min(1, dt * 7);

      drawMeter(ctx, mx, by, meterW, mh, {
        title: 'VÔN KẾ THẾ V_bi',
        val: vNow.toFixed(2) + ' V',
        sub: q > 0.9 ? 'E_F đã thẳng hàng!' : 'Chưa cân bằng',
        subCol: q > 0.9 ? C.c1 : C.mut,
        frac: st.vNeedle,
        accent: C.main,
        zones: [[0, 0.5, C.c2], [0.5, 1, C.main]]
      });

      const asymRatio = S.Nd / S.Na;
      const asymTxt = asymRatio >= 1 ? ('x_p / x_n = ' + asymRatio.toFixed(asymRatio >= 10 ? 0 : 1) + '×')
                                     : ('x_n / x_p = ' + (1 / asymRatio).toFixed((1 / asymRatio) >= 10 ? 0 : 1) + '×');
      const asymFrac = clamp(0.5 + (Math.log10(asymRatio) / 3) * 0.45, 0.05, 0.95);
      drawMeter(ctx, mx, by + mh + 10, meterW, mh, {
        title: 'LỆCH VÙNG NGHÈO',
        val: asymTxt,
        sub: S.Nd > S.Na ? 'Ăn sâu sang P' : S.Na > S.Nd ? 'Ăn sâu sang N' : 'Đối xứng 1:1',
        frac: asymFrac,
        accent: C.c2,
        zones: [[0, 0.48, C.main], [0.52, 1, C.c2]]
      });

      txt(ctx, q > 0.9 ? 'Đã ghép cân bằng: E_F phẳng xuyên suốt · Điện trường nội E_bi chặn dòng khuếch tán' : 'Hai phiến N và P đang tách rời: mức Fermi hai bên còn chênh nhau ' + Vbi.toFixed(2) + ' eV',
        chX + 12, chY + 17, C.ink, 10.2, 'left', 700, MONO);
      txt(ctx, 'qV_bi = ' + Vbi.toFixed(2) + ' eV', chX + chW - 12, chY + 17, C.main, 10.6, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM (Cột phải — Intro + React chi tiết cho cả 7 tab Buổi 6)
   ========================================================================== */
/* ==========================================================================
   TAB 0 — TỔNG QUAN: MỘT KHỐI Si N–P 3D LIÊN KẾT BẢY THÍ NGHIỆM
   - Máy cấy ion bắn hai chùm vào hai nửa khối; nhiệt độ quyết định tạp ion hóa
     hay đóng băng; hạt tải, ion cố định và vùng nghèo hình thành ở mặt ghép.
   - Bấm số ①–⑦ để vào thí nghiệm chi tiết tương ứng.
   ========================================================================== */
function allCalc(S) {
  const sn = solveNeutrality(S.T, S.Nd, 0), sp = solveNeutrality(S.T, 0, S.Na), ni = ni_of(S.T), kT = kT_of(S.T);
  const Vbi = Math.max(0, kT * Math.log((S.Nd * S.Na) / (ni * ni)));
  const w = clamp(.08 * Math.sqrt(Vbi * (1 / S.Nd + 1 / S.Na)) / 8.8e-9, 0, .3);
  return { sn, sp, ni, kT, Vbi, w, wn: w * S.Na / (S.Na + S.Nd), wp: w * S.Nd / (S.Na + S.Nd) };
}
const ALLNAV = [['balance', '①', 'Cân bằng n₀p₀'], ['degenerate', '②', 'Suy biến'], ['ionize', '③', 'Ion hóa'], ['compensate', '④', 'Bù trừ'], ['designer', '⑤', 'Cấy ion'], ['thermal', '⑥', '3 vùng nhiệt'], ['junction', '⑦', 'Tiếp xúc N–P']];
LABS.unshift({
  id: 'all', name: 'Tổng quan', no: '★', secs: [],
  S: { T: 300, Nd: 1e17, Na: 1e16, view: .45 },
  cols: '2.1fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Khối Si N–P 3D: máy cấy ion bắn tạp vào hai nửa, nhiệt độ làm tạp ion hóa — bấm số ①–⑦ để vào thí nghiệm chi tiết',
    area: 'a', anim: true,
    ctrls: [
      { k: 'T', l: 'Nhiệt độ T', min: 80, max: 800, step: 10, f: v => v + ' K' },
      { k: 'Nd', l: 'Phiến N (N_d)', min: 15, max: 19, step: 0.25, log: 1, f: v => fmtPow(v) },
      { k: 'Na', l: 'Phiến P (N_a)', min: 15, max: 19, step: 0.25, log: 1, f: v => fmtPow(v) },
      { k: 'view', l: 'Góc nhìn 3D', min: 0.05, max: 1, step: 0.05, f: v => Math.round(5 + 80 * v) + '°' },
      { btn: 'VD Bài 6 (10¹⁷/10¹⁶)', fn: p => { p.S.T = 300; p.S.Nd = 1e17; p.S.Na = 1e16; p.syncCtrls(); queueReact(p.tab, 'Nd'); } },
      { btn: 'Đóng băng (100 K)', fn: p => { p.S.T = 100; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: 'Nội tại (700 K)', fn: p => { p.S.T = 700; p.syncCtrls(); queueReact(p.tab, 'T'); } }
    ],
    onClick(p, x, y) { const h = (p.hits || []).find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h); if (h) show(h.id); },
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, key = S.T + '|' + S.Nd + '|' + S.Na;
      if (st.key !== key) { st.key = key; st.K = allCalc(S); }
      const K = st.K;
      if (!st.pts) {
        const rg = mkRng(606), mk = () => ({ u: rg(), y: rg(), z: rg(), ph: rg() * TAU, f: .6 + rg() * 1.2 });
        st.pts = { eN: Array.from({ length: 30 }, mk), hN: Array.from({ length: 30 }, mk), eP: Array.from({ length: 30 }, mk), hP: Array.from({ length: 30 }, mk), dN: Array.from({ length: 16 }, mk), aP: Array.from({ length: 16 }, mk), ion: Array.from({ length: 14 }, mk) };
        st.mN = .5; st.mI = .5;
      }
      const pad = 10, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawScopeBg(ctx, chX, chY, chW, chH, 10);
      const meterW = 92, topBar = 32, areaX = chX + 10, areaY = chY + topBar + 4, areaH = chH - topBar - 14, aw = chW - 20 - meterW - 10;
      const th = (5 + 80 * S.view) * Math.PI / 180, Dd = Math.min(aw * .2, areaH * .34), vx = Math.cos(th) * Dd, vy = -Math.sin(th) * Dd * .6;
      const Lp = aw - 30 - Math.abs(vx), hp = areaH * .17, ox = areaX + 12, oy = areaY + areaH * .72;
      const P = (x, y, z) => [ox + x * Lp + y * vx, oy + y * vy - z * hp];
      const face = (pts, col, al, edge) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fillStyle = hexA(col, al); ctx.fill(); ctx.strokeStyle = hexA(edge || C.sub, .8); ctx.lineWidth = 1; ctx.stroke(); };
      const box = (x0, x1, y0, y1, z0, z1, col, al) => {
        face([P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], col, al);
        face([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], col, al * .8);
        face([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], col, al * .6);
      };
      const xl = .5 - K.wn, xr = .5 + K.wp;
      /* mặt sau của hai nửa */
      face([P(0, 1, 0), P(xl, 1, 0), P(xl, 1, 1), P(0, 1, 1)], COL_WARM, .10);
      face([P(xr, 1, 0), P(1, 1, 0), P(1, 1, 1), P(xr, 1, 1)], COL_CYAN, .10);
      face([P(xl, 1, 0), P(xr, 1, 0), P(xr, 1, 1), P(xl, 1, 1)], COL_PURP, .22);
      /* hạt */
      const cnt = v => Math.round(clamp((lg10(v) - 4) / 14 * 30, 0, 30));
      const items = [], pos = (o, a, b) => [a + (b - a) * (.04 + .92 * ((o.u + .012 * Math.sin(t * o.f + o.ph)) % 1)), clamp(o.y + .02 * Math.sin(t * o.f * 1.3 + o.ph), 0, 1), clamp(o.z + .02 * Math.cos(t * o.f + o.ph), 0, 1)];
      const nd = Math.round(clamp((lg10(S.Nd) - 14) / 5 * 12 + 4, 4, 16)), na = Math.round(clamp((lg10(S.Na) - 14) / 5 * 12 + 4, 4, 16));
      for (let i = 0; i < cnt(K.sn.n); i++) items.push({ k: 'e', q: pos(st.pts.eN[i], 0, xl) });
      for (let i = 0; i < cnt(K.sn.p); i++) items.push({ k: 'h', q: pos(st.pts.hN[i], 0, xl) });
      for (let i = 0; i < cnt(K.sp.n); i++) items.push({ k: 'e', q: pos(st.pts.eP[i], xr, 1) });
      for (let i = 0; i < cnt(K.sp.p); i++) items.push({ k: 'h', q: pos(st.pts.hP[i], xr, 1) });
      for (let i = 0; i < nd; i++) { const o = st.pts.dN[i]; items.push({ k: 'd', q: [.03 + .94 * o.u * xl, o.y, o.z], on: i < Math.round(nd * K.sn.ionD) }); }
      for (let i = 0; i < na; i++) { const o = st.pts.aP[i]; items.push({ k: 'a', q: [xr + .03 * (1 - xr) + .94 * o.u * (1 - xr), o.y, o.z], on: i < Math.round(na * K.sp.ionA) }); }
      items.sort((a, b) => b.q[1] - a.q[1]);
      items.forEach(it => {
        const c = P(it.q[0], it.q[1], it.q[2]), r = 3.9 - 1.2 * it.q[1];
        if (it.k === 'e') glowDot(ctx, c[0], c[1], r, '#fef1b6', hexA(COL_WARM, .9));
        else if (it.k === 'h') { glowDot(ctx, c[0], c[1], r * .8, '#dafefe', hexA(COL_CYAN, .85)); ctx.beginPath(); ctx.arc(c[0], c[1], r + 1.4, 0, TAU); ctx.strokeStyle = COL_ICE; ctx.lineWidth = 1.3; ctx.stroke(); }
        else {
          const col = it.k === 'd' ? COL_WARM : COL_CYAN;
          ctx.beginPath(); ctx.rect(c[0] - 3.4, c[1] - 3.4, 6.8, 6.8);
          if (it.on) { ctx.fillStyle = col; ctx.fill(); txt(ctx, it.k === 'd' ? '+' : '−', c[0], c[1] + .5, NIGHT_BG, 8, 'center', 800, MONO); }
          else { ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke(); }
        }
      });
      /* khối kính ngoài */
      box(0, xl, 0, 1, 0, 1, COL_WARM, .13); box(xr, 1, 0, 1, 0, 1, COL_CYAN, .13); box(xl, xr, 0, 1, 0, 1, COL_PURP, .30);
      /* hai máy cấy ion: chùm + hạt ion rơi */
      const nz = (xc, col, label, id) => {
        const sp = P(xc, .5, 1), nx = sp[0], ny = sp[1] - areaH * .30;
        const patch = [P(xc - .07, .15, 1), P(xc + .07, .15, 1), P(xc + .07, .85, 1), P(xc - .07, .85, 1)];
        const pts = [[nx - 9, ny + 12], [nx + 9, ny + 12]].concat(patch).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const cr = (o, u, v) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]), lo = [], up = [];
        pts.forEach(q => { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
        pts.slice().reverse().forEach(q => { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
        face(lo.slice(0, -1).concat(up.slice(0, -1)), col, .13, col); face(patch, col, .38, col);
        rr(ctx, nx - 15, ny - 6, 30, 14, 4); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke();
        for (let i = 0; i < 7; i++) { const o = st.pts.ion[i], u = (t * .7 + i / 7) % 1, tx = P(xc - .06 + o.u * .12, .2 + o.y * .6, 1); glowDot(ctx, nx + (tx[0] - nx) * u, ny + 12 + (tx[1] - ny - 12) * u, 2.8, '#ffffff', hexA(col, .9)); }
        return [nx, ny];
      };
      const nA = nz(.25, COL_WARM), nB = nz(.75, COL_CYAN);
      /* chip bấm được */
      const hits = [], chip = (i, x, y, col) => {
        const [id, num, label] = ALLNAV[i], wd = 30 + label.length * 7, xx = clamp(x - wd / 2, chX + 4, chX + chW - wd - 4);
        rr(ctx, xx, y - 11, wd, 22, 11); ctx.fillStyle = hexA(NIGHT_BG, .92); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke();
        txt(ctx, num + ' ' + label, xx + wd / 2, y + .5, col, 10.6, 'center', 700, MONO); hits.push({ x: xx, y: y - 11, w: wd, h: 22, id });
      };
      const fb = P(.5, 0, 0), jt = P(.5, 1, 1);
      chip(4, nA[0], nA[1] - 24, COL_WARM);
      chip(0, P(.25, 0, 0)[0] - 70, fb[1] + 28, COL_WARM);
      chip(1, P(.25, 0, 0)[0] + 70, fb[1] + 28, COL_PURP);
      chip(2, P(.25, 0, 0)[0], fb[1] + 56, COL_WARM);
      chip(3, P(.75, 0, 0)[0] - 60, fb[1] + 28, COL_CYAN);
      chip(5, P(.75, 0, 0)[0] + 70, fb[1] + 28, COL_HOT);
      chip(6, jt[0], jt[1] - 26, COL_PURP);
      p.hits = hits;
      /* đồng hồ kim */
      const mx = chX + chW - meterW - 10, mh = (areaH - 20) / 3;
      st.mN += (clamp((lg10(K.sn.n) - 2) / 17, 0, 1) - st.mN) * Math.min(1, dt * 8);
      st.mI += (K.sn.ionD - st.mI) * Math.min(1, dt * 8);
      drawMeter(ctx, mx, areaY, meterW, mh, { title: 'n BÊN N', val: fmtSci(K.sn.n, 1), sub: 'cm⁻³ (log)', frac: st.mN, accent: C.main, zones: [[0.5, 1, C.main]] });
      drawMeter(ctx, mx, areaY + mh + 10, meterW, mh, { title: 'ION HÓA TẠP', val: Math.round(K.sn.ionD * 100) + '%', sub: S.T < 150 ? 'đóng băng' : S.T > 550 ? 'nội tại' : 'ngoại lai', frac: st.mI, accent: COL_HOT });
      drawMeter(ctx, mx, areaY + 2 * (mh + 10), meterW, mh, { title: 'V_bi', val: K.Vbi.toFixed(2) + ' V', sub: 'vùng nghèo ' + (K.w * 100).toFixed(0) + '%', frac: clamp(K.Vbi / 1.0, 0, 1), accent: COL_PURP });
      txt(ctx, 'T = ' + S.T + ' K  |  N_d = ' + fmtPow(S.Nd) + '  |  N_a = ' + fmtPow(S.Na) + ' cm⁻³', chX + 12, chY + 17, C.ink, 10.4, 'left', 700, MONO);
      txt(ctx, 'nᵢ = ' + fmtSci(K.ni, 1) + ' cm⁻³', chX + chW - 12, chY + 17, C.main, 10.6, 'right', 700, MONO);
    }
  }]
});

const LD = {};
LD.all = {
  intro: [
    ['i', 'Cả bảy thí nghiệm của Bài 6 là các góc nhìn vào cùng MỘT khối Si: hai nửa pha tạp khác loại ghép lại, giữa là vùng nghèo.'],
    ['w', '⑤ Máy cấy ion bắn tạp vào từng nửa (cam: donor vào phiến N, cyan: acceptor vào phiến P). ③ Mỗi tạp chỉ cho hạt tải khi ion hóa: ô đặc là đã ion hóa, ô rỗng là còn đóng băng.'],
    ['w', '① Hạt tải đa số do tạp ion hóa quyết định, hạt thiểu số theo n₀p₀ = nᵢ². ② Pha tạp quá nặng thì chồng lấn quầng, Boltzmann hết đúng (suy biến). ④ Donor và acceptor cùng có mặt sẽ bù trừ nhau.'],
    ['w', '⑥ Nhiệt độ thấp: đóng băng. Vừa phải: ngoại lai, n ≈ N_d. Rất cao: nội tại, nᵢ lấn át. ⑦ Hai nửa ghép lại: hạt tải khuếch tán, để lại ion cố định tạo vùng nghèo (tím) và hiệu thế V_bi.'],
    ['v', 'Kéo "Góc nhìn 3D" để xoay khối, kéo T, N_d, N_a và xem ba đồng hồ đổi. Bấm số ①–⑦ để vào thí nghiệm chi tiết.']
  ],
  react(S, k, P, say) {
    const K = allCalc(S);
    if (k === 'T') say('w', `T = ${S.T} K: tạp ion hóa ${Math.round(K.sn.ionD * 100)}% bên N, n = ${fmtSci(K.sn.n, 2)} cm⁻³, nᵢ = ${fmtSci(K.ni, 2)}. ${S.T < 150 ? 'Còn nhiều ô rỗng: đóng băng.' : S.T > 550 ? 'nᵢ đã gần bằng pha tạp: sắp thành nội tại, V_bi tụt.' : 'Gần như ion hóa hết: vùng ngoại lai.'}`);
    else say('w', `N_d = ${fmtPow(S.Nd)}, N_a = ${fmtPow(S.Na)}: V_bi = ${K.Vbi.toFixed(2)} V. Phiến pha nhẹ hơn có vùng nghèo lấn sâu hơn (N_d·x_n = N_a·x_p).`);
  }
};


LD.balance = {
  intro: [
    ['i', 'Trong bán dẫn không suy biến ở cân bằng nhiệt, nồng độ hạt tải tuân theo đòn bẩy hàm mũ: n₀ = nᵢ·e^((E_F−E_Fi)/kT) và p₀ = nᵢ·e^(−(E_F−E_Fi)/kT).'],
    ['w', 'Biển cam-vàng (Inferno) biểu diễn mật độ electron tự do, biển xanh băng (Ice-Cyan) biểu diễn lỗ trống. Khi đẩy E_F lên cao, electron tràn ngập và tái hợp kìm lỗ trống tụt xuống!'],
    ['w', 'Quan sát hai đồng hồ kim cơ bên phải: hai kim luôn xoay ngược chiều đối xứng nhau để khóa chặt tích n₀·p₀ = nᵢ² không đổi ở một nhiệt độ T!'],
    ['v', 'Bấm "Câu 1a (+0.30eV)" hoặc chế độ "Đối xứng ±0.30 eV" để kiểm chứng ngay kết quả n₀ = 1.6×10¹⁵ và p₀ = 1.4×10⁵ cm⁻³ của Câu 1!']
  ],
  react(S, k, P, say) {
    const kT = kT_of(S.T), ni = ni_of(S.T);
    const n0 = ni * ex(S.dE / kT), p0 = ni * ex(-S.dE / kT);
    if (S.view === 'sym') {
      say('v', `Đối xứng ±0.30 eV ở ${S.T} K: Hai mẫu có vai trò e⁻ và h⁺ hoán đổi hoàn hảo (đa số ${fmtSci(ni * ex(0.30 / kT), 2)}, thiểu số ${fmtSci(ni * ex(-0.30 / kT), 2)} cm⁻³).`);
    } else {
      say('v', `E_F − E_Fi = ${(S.dE >= 0 ? '+' : '−') + Math.abs(S.dE).toFixed(2)} eV (T = ${S.T} K) → n₀ = ${fmtSci(n0, 2)}, p₀ = ${fmtSci(p0, 2)} cm⁻³, tích n₀p₀ = ${fmtSci(ni * ni, 2)}.`);
    }
  }
};

LD.degenerate = {
  intro: [
    ['i', 'Khi pha tạp nhẹ (E_F cách mép dải ≥ 3kT), các nguyên tử tạp chất đứng tách rời nhau và xấp xỉ Boltzmann dùng rất chính xác (< 5% sai số).'],
    ['w', 'Khi pha tạp cực nặng (vượt ~3×10¹⁷ và chạm N_c ≈ 2.8×10¹⁹ cm⁻³), các quầng sóng Bohr 2D chồng lấn liên thông thành biển dẫn như kim loại — đó là Bán dẫn Suy biến!'],
    ['w', 'Lúc này nguyên lý Pauli ngăn nhồi thêm e⁻ vào đáy dải nên công thức Boltzmann đoán lố mạnh, bắt buộc dùng tích phân Fermi–Dirac F₁/₂(η_F).'],
    ['v', 'Chuyển sang "Kính hiển vi η_F (Câu 2)" rồi bấm lần lượt "Câu 2 (−3.5)", "Câu 2 (0)" và "VD (+2.0)" để đọc ngay độ lệch Boltzmann trên đồng hồ!']
  ],
  react(S, k, P, say) {
    const Nref = S.type === 'n' ? NC0 : NV0;
    const nFD = nFD_of(Nref, S.eta), nBo = Nref * Math.exp(S.eta);
    const err = ((nBo - nFD) / Math.max(nFD, 1e-30)) * 100;
    if (S.view === 'trio') {
      say('w', `3 khung ${S.type === 'n' ? 'Donor P (Inferno)' : 'Acceptor B (Ice-Cyan)'}: Từ quầng tách rời (10¹⁶) → chạm ngưỡng 3kT (3×10¹⁷) → biển kim loại suy biến (≥ N_c).`);
    } else {
      say('v', `η_F = ${(S.eta >= 0 ? '+' : '−') + Math.abs(S.eta).toFixed(1)} kT: F₁/₂ = ${F12(S.eta).toFixed(3)} → n₀(FD) = ${fmtSci(nFD, 2)} vs Boltzmann = ${fmtSci(nBo, 2)} (lố ${err < 100 ? '+' + err.toFixed(1) + '%' : (nBo / nFD).toFixed(2) + '×'}).`);
    }
  }
};

LD.ionize = {
  intro: [
    ['i', 'Thống kê tạp chất tính thêm hệ số suy biến spin: Donor có g = 2 (hệ số 1/2), Acceptor trong Si có g = 4 (hệ số 1/4).'],
    ['w', 'Trong buồng Cryostat, các quầng sóng tròn đậm là hạt còn bị trói quanh tâm tạp chất (chưa ion hóa). Khi đủ ấm, quầng tách ra để lộ lõi ion cố định (+ hoặc −) và hạt chạy tự do!'],
    ['w', 'Ở nhiệt độ rất thấp (35 K) xảy ra Đóng băng (Freeze-out); ở 300 K với pha 10¹⁶ đạt Ion hóa hoàn toàn (>99.5%). Pha càng nặng, tỷ lệ còn kẹt càng tăng (Câu 3).'],
    ['v', 'Bấm các nút "VD 6.3 (B·193K)", "VD 6.1 (P·300K)" và "Câu 3 (P·10¹⁷)" để kiểm chứng trực tiếp từng số liệu trong bài học!']
  ],
  react(S, k, P, say) {
    const isN = S.type === 'n';
    const sol = solveNeutrality(S.T, isN ? S.N : 0, isN ? 0 : S.N);
    const ion = (isN ? sol.ionD : sol.ionA) * 100;
    say('v', `${isN ? 'Donor P (g=2)' : 'Acceptor B (g=4)'}, N = ${fmtPow(S.N)}, T = ${S.T} K: Đã ion hóa ${ion.toFixed(2)}% (còn kẹt ${(100 - ion).toFixed(2)}%), hạt tự do = ${fmtSci(isN ? sol.n : sol.p, 2)} cm⁻³.`);
  }
};

LD.compensate = {
  intro: [
    ['i', 'Bán dẫn bù trừ chứa đồng thời Donor P⁺ (vầng cam) và Acceptor B⁻ (vầng xanh). Điều kiện trung hòa điện tích: n₀ + N_a⁻ = p₀ + N_d⁺.'],
    ['w', 'Electron của donor rơi xuống lấp đầy các acceptor trước (các cặp nối nét đứt trao e⁻). Chỉ phần chênh lệch |N_d − N_a| mới tạo hạt tự do chạy qua 2 điện cực!'],
    ['w', 'Khi N_d = N_a (bù trừ hoàn toàn), kim Ampe kế rơi thẳng về vạch 0: nồng độ hạt tải trở về đúng bán dẫn thuần n₀ = p₀ = nᵢ = 1.5×10¹⁰ cm⁻³.'],
    ['v', 'Bấm "Câu 4b (Dư 10¹⁰)" để xem trường hợp chênh lệch cỡ nᵢ — lúc này không được bỏ căn bậc hai (n₀ = 2.08×10¹⁰, p₀ = 1.08×10¹⁰ cm⁻³)!']
  ],
  react(S, k, P, say) {
    const ndR = S.nearNi ? (5e15 + 1e10) : S.Nd * 1e15;
    const naR = S.nearNi ? 5e15 : S.Na * 1e15;
    const d = ndR - naR;
    const n0 = d >= 0 ? d * 0.5 + Math.sqrt(d * d * 0.25 + NI0 * NI0) : (NI0 * NI0) / (-d * 0.5 + Math.sqrt(d * d * 0.25 + NI0 * NI0));
    const p0 = (NI0 * NI0) / n0;
    if (S.nearNi) {
      say('v', `Câu 4b (N_d − N_a = 10¹⁰ ~ nᵢ): Phải giữ căn bậc hai → n₀ = ${fmtSci(n0, 2)}, p₀ = ${fmtSci(p0, 2)} cm⁻³.`);
    } else {
      say('v', `N_d = ${S.Nd}×10¹⁵, N_a = ${S.Na}×10¹⁵ → N_eff = ${d === 0 ? '0 (Thuần)' : fmtSci(Math.abs(d), 1)} → n₀ = ${fmtSci(n0, 2)}, p₀ = ${fmtSci(p0, 2)} cm⁻³.`);
    }
  }
};

LD.designer = {
  intro: [
    ['i', 'Máy cấy ion cho phép kỹ sư chủ động đặt vị trí mức Fermi theo công thức E_c − E_F = kT·ln(N_c / (N_d − N_a)) cho loại N hoặc E_F − E_v = kT·ln(N_v / (N_a − N_d)) cho loại P.'],
    ['w', 'Nếu tấm đế đã có sẵn nền Acceptor B (màu băng Ice-Cyan), muốn tạo vùng loại N (Inferno) thì liều cấy Donor P⁺ phải bù hết nền B trước rồi mới dư ra n₀ mong muốn!'],
    ['w', 'Theo dõi vạch đỏ 3kT trên đồng hồ trên: khi khoảng cách tới mép dải tụt xuống dưới 3kT (như Câu 6b: 10¹⁸ chỉ còn 2.3 kT), Boltzmann hết chính xác!'],
    ['v', 'Bấm "Câu 5 (0.20eV)" để thấy nền B = 10¹⁶ cần cấy đúng N_d = 2.24×10¹⁶ cm⁻³ để đảo loại wafer và đạt E_c − E_F = 0.200 eV!']
  ],
  react(S, k, P, say) {
    const Na0 = S.baseNa === 0 ? 0 : Math.pow(10, S.baseNa);
    const Nd = S.beam === 'P' ? S.dose : 0;
    const Na = Na0 + (S.beam === 'B' ? S.dose : 0);
    const d = Nd - Na;
    const n0 = d >= 0 ? d * 0.5 + Math.sqrt(d * d * 0.25 + NI0 * NI0) : (NI0 * NI0) / (-d * 0.5 + Math.sqrt(d * d * 0.25 + NI0 * NI0));
    const p0 = (NI0 * NI0) / n0;
    const dist = d >= 0 ? KT300 * Math.log(NC0 / n0) : KT300 * Math.log(NV0 / p0);
    const kts = dist / KT300;
    say('v', `${d >= 0 ? 'Loại N' : 'Loại P'} (N_eff = ${fmtSci(Math.abs(d), 2)}): ${d >= 0 ? 'E_c − E_F' : 'E_F − E_v'} = ${dist.toFixed(3)} eV (${kts.toFixed(1)} kT)${kts < 3 ? ' — Dưới mốc 3kT, sắp suy biến!' : ' — Không suy biến.'}`);
  }
};

LD.thermal = {
  intro: [
    ['i', 'Khi tăng nhiệt độ của một con chip Si pha tạp cố định N_d từ 30 K lên 850 K, chip đi qua 3 chế độ vật lý hoàn toàn khác nhau.'],
    ['w', '1) Đóng băng (< 100 K): e⁻ bị giữ trong quầng Bohr quanh P. 2) Cửa sổ Ngoại lai (quanh 300 K): kim n₀/N_d đứng im tại 1.0× — vùng làm việc ổn định của chip!'],
    ['w', '3) Sụp đổ Nội tại (nhiệt cao): liên kết Si–Si gãy nổ sinh cơn bão cặp e⁻ (vàng) & h⁺ (cyan) lấn át pha tạp, chip trở lại thành bán dẫn thuần (E_F → E_Fi)!'],
    ['v', 'Thử tăng N_d lên 10¹⁷ và nhìn vạch giới hạn T_max trên nhiệt kế: pha tạp càng nặng thì chip chịu được nhiệt độ càng cao!']
  ],
  react(S, k, P, say) {
    const sol = solveNeutrality(S.T, S.Nd, 0);
    const ni = ni_of(S.T);
    const reg = sol.ionD < 0.85 ? 'ĐÓNG BĂNG' : (ni >= 0.35 * S.Nd ? 'SỤP ĐỔ NỘI TẠI' : 'NGOẠI LAI ỔN ĐỊNH');
    say('v', `T = ${S.T} K, N_d = ${fmtPow(S.Nd)} [${reg}]: n₀ = ${fmtSci(sol.n, 2)} (${(sol.n / S.Nd).toFixed(2)}× N_d), nᵢ(T) = ${fmtSci(ni, 1)}, E_F − E_Fi = ${(sol.Ef - sol.Efi).toFixed(2)} eV.`);
  }
};

LD.junction = {
  intro: [
    ['i', 'Ý nghĩa sâu nhất của mức Fermi: Khi hai vật liệu tiếp xúc ở cân bằng nhiệt, hạt tải tự khuếch tán qua mặt ghép cho tới khi E_F thẳng hàng ở mọi nơi!'],
    ['w', 'Khi ép phiến N (biển Inferno) vào phiến P (biển Ice-Cyan), e⁻ và h⁺ tái hợp ở ranh giới để lộ vùng nghèo chứa ion cố định P⁺ (+) và B⁻ (−), tạo điện trường nội tại E_bi hướng N → P.'],
    ['w', 'Nhờ trung hòa điện tích N_d·x_n = N_a·x_p, vùng nghèo luôn ăn sâu sang phía pha tạp nhẹ hơn!'],
    ['v', 'Bấm "Tách rời" rồi "Ghép tiếp xúc", và thử "VD Bài 6 (10¹⁷/10¹⁶)" để đọc đúng thế nội tại qV_bi = 0.75 eV trên Vôn kế!']
  ],
  react(S, k, P, say) {
    const Vbi = KT300 * Math.log((S.Nd * S.Na) / (NI0 * NI0));
    if (!S.joined) {
      say('i', `Hai phiến đang tách rời: Vôn kế = 0 V, chênh lệch mức Fermi ban đầu ΔE_F = ${Vbi.toFixed(2)} eV.`);
    } else {
      const ratio = S.Nd / S.Na;
      say('v', `Đã ghép cân bằng (N_d=${fmtPow(S.Nd)}, N_a=${fmtPow(S.Na)}): Thế nội tại qV_bi = ${Vbi.toFixed(2)} eV, tỷ lệ độ sâu vùng nghèo x_p/x_n = ${ratio >= 1 ? ratio.toFixed(1) : '1/' + (1 / ratio).toFixed(1)}.`);
    }
  }
};

LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP TỰ CHỨA (#lab6 / .lb6-*, tách biệt hoàn toàn Namespace)
   ========================================================================== */
const CSS = `
#lab6{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab6[hidden]{display:none}
#lab6 *{box-sizing:border-box}
.lb6-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
.lb6-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
.lb6-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
.lb6-ic{color:var(--main);display:flex}
.lb6-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
.lb6-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
.lb6-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
.lb6-tab:hover{color:var(--ink);background:var(--tint)}
.lb6-tab.on{background:var(--main);color:var(--bg);font-weight:700}
.lb6-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
.lb6-x:hover{color:var(--err);background:var(--tint)}
.lb6-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
.lb6-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
.lb6-p.glow{animation:lb6glow 1.4s ease-out}
@keyframes lb6glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
.lb6-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
.lb6-cv{flex:1;min-height:0;position:relative}
.lb6-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.lb6-c{display:flex;flex-wrap:wrap;gap:6px 12px;padding:5px 10px 8px;flex:none;align-items:center}
.lb6-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb6-k input[type=range]{width:clamp(64px,7vw,108px);margin:0;accent-color:var(--main)}
.lb6-k output{color:var(--ink);font-weight:700;min-width:3.2em}
.lb6-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb6-seg button,.lb6-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer;transition:color .15s,background .15s}
.lb6-btn{background:var(--tint);color:var(--ink)}
.lb6-seg button:hover,.lb6-btn:hover{color:var(--ink);background:var(--g)}
.lb6-seg button.on{background:var(--main);color:var(--bg)}
.lb6-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
.lb6-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb6in .4s ease-out;overflow-wrap:anywhere}
.lb6-ln::before{position:absolute;left:0;font-weight:700}
.lb6-ln.i{color:var(--ink)}.lb6-ln.i::before{content:'›';color:var(--c5)}
.lb6-ln.w{color:var(--ink)}.lb6-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
.lb6-ln.v{color:var(--main)}.lb6-ln.v::before{content:'=';color:var(--main)}
@keyframes lb6in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab6-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab6-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab6-m:hover,.lab6-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb6-win{width:100vw;height:100dvh;border-radius:0}.lb6-b{overflow:auto;display:flex;flex-direction:column}.lb6-p{min-height:280px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'all';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab6'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 6');
  root.innerHTML = '<div class="lb6-win"><div class="lb6-h"><span class="lb6-ic">' + FLASK + '</span><span class="lb6-bd">Phòng thí nghiệm · Buổi 6</span><nav class="lb6-tabs"></nav><button class="lb6-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb6-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb6-b'); tabsEl = root.querySelector('.lb6-tabs');
  LABS.forEach(l => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lb6-tab'; b.dataset.id = l.id;
    b.textContent = l.no + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b);
  });
  root.querySelector('.lb6-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) {
      const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty &&
          window.LabB6 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden &&
          (document.getElementById('tb-badge') || {}).textContent === 'Buổi 6') {
        e.preventDefault(); open();
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
}

const say = (kind, text) => {
  if (!logEl) return;
  const d = document.createElement('div'); d.className = 'lb6-ln ' + kind; d.textContent = text;
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
    w.className = 'lb6-btn'; w.textContent = c.btn; w.setAttribute('role', 'button'); w.tabIndex = 0;
    w.onclick = () => c.fn(p); return w;
  }
  if (c.seg) {
    w.className = 'lb6-seg';
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
  w.className = 'lb6-k';
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
    if (tab.id === 'compensate') S.nearNi = false;
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
    const el = document.createElement('div'); el.className = 'lb6-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb6-t"></div><div class="lb6-cv"><canvas></canvas></div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) {
      const lg = document.createElement('div'); lg.className = 'lb6-log'; lg.setAttribute('aria-live', 'polite');
      el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el);
      curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 220 + j * 850)));
      return;
    }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb6-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.onClick) { cv.style.cursor = 'pointer'; cv.addEventListener('click', ev => { const r = cv.getBoundingClientRect(); spec.onClick(p, ev.clientX - r.left, ev.clientY - r.top); }); }
    if (spec.ctrls && spec.ctrls.length) {
      const cb = document.createElement('div'); cb.className = 'lb6-c';
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
    catch (err) { console.error('LabB6 render error:', err); }
    ctx.restore();
  });
  raf = requestAnimationFrame(loop);
}

function open(id, panelIdx) {
  ensureDom(); readColors(); opener = document.activeElement;
  root.hidden = false; show(id || lastTab, panelIdx);
  last = performance.now(); if (!raf) raf = requestAnimationFrame(loop);
  root.querySelector('.lb6-x').focus({ preventScroll: true });
  const b = document.getElementById('tb-lab'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
}
function close() {
  if (!root || root.hidden) return;
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  const b = document.getElementById('tb-lab'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- Gắn biểu tượng bình thí nghiệm vào tiêu đề Bài 6 ---------- */
const H3MAP = [
  [/^1\.[23]/, 'balance', 0],
  [/^2\.[12]/, 'balance', 0],
  [/^3\.1/, 'degenerate', 0],
  [/^4\.[12]/, 'degenerate', 0],
  [/^5\.[123]/, 'ionize', 0],
  [/^6\.[123]/, 'ionize', 0],
  [/^7\.[123]/, 'compensate', 0],
  [/^8\.[12]/, 'designer', 0],
  [/^9\.[123]/, 'thermal', 0],
  [/^10\.[12]/, 'junction', 0],
  [/^Câu 1\b/, 'balance', 0],
  [/^Câu 2\b/, 'degenerate', 0],
  [/^Câu 3\b/, 'ionize', 0],
  [/^Câu 4\b/, 'compensate', 0],
  [/^Câu [56]\b/, 'designer', 0]
];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab6-m')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab6-m'; b.innerHTML = FLASK;
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

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 6') {
  markLesson(document.getElementById('app-content'));
}

window.LabB6 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
