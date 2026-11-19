/* ==========================================================================
   lab-b3.js — PHÒNG THÍ NGHIỆM VẬT LÝ LƯỢNG TỬ BUỔI 3 (Phiên bản Mô phỏng Thực tế)
   - Tự chứa hoàn toàn: tự chèn CSS + HTML popup, giữ nguyên API LabB3.
   - NGUYÊN TẮC: MÔ PHỎNG VẬT LÝ THỰC TẾ — TÍCH HỢP BỘ GIẢI TDSE 1D & ĐỒ HỌA 3D.
   - 5 tab ứng với 5 hiện tượng vật lý lượng tử nền tảng của Buổi 3:
       1. Hạt tự do: Buồng chân không + Ống phóng e⁻ + Trường pha sóng + Màn huỳnh quang
       2. Giếng vô hạn: Hộp lượng tử bán dẫn GaAs/AlGaAs + Đám mây sóng dừng + Phát xạ Photon
       3. Bậc thế năng: Bộ giải số 1D-TDSE (Visscher) mô phỏng bó sóng đâm xuyên vùng cấm thực
       4. Xuyên hầm: Mặt cắt Transistor nano (Source–Oxide–Drain) + TDSE + Ampe kế dòng rò
       5. Vỏ e⁻ & Pauli: Đám mây Orbital 3D tương tác (xoay & cắt lát) + Nguyên tử 3D & Bảng Pauli
   - API: LabB3.open(tabId?, panelIndex?)  LabB3.close()  LabB3.mark(root)  LabB3.tabs()
   ========================================================================== */
(function () {
'use strict';

/* ---------- Hằng số vật lý & tiện ích toán học ---------- */
const TAU = Math.PI * 2;
const HBAR = 1.0545718e-34; // J·s
const ME = 9.1093837e-31;   // kg
const EV = 1.6021766e-19;   // J
const C_LIGHT = 2.99792458e8; // m/s
const H_PLANCK = 6.62607015e-34;

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[d]).join('');
const sci = (x, d = 1) => {
  if (!x || !isFinite(x)) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  return (x / Math.pow(10, e)).toFixed(d) + '×10' + sup(e);
};

/* ---------- Đọc bảng màu & font chữ trực tiếp từ giao diện trang ---------- */
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

/* Chuyển đổi màu hex/rgb của theme sang rgba có độ trong suốt */
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

/* ---------- Chuyển bước sóng (nm) sang màu RGB quang phổ thật ---------- */
function wavelengthToRGB(wl) {
  let r = 0, g = 0, b = 0, label = '';
  if (wl < 380) { r = 0.55; g = 0.25; b = 1.0; label = 'Tử ngoại (UV)'; }
  else if (wl < 440) { r = -(wl - 440) / 60; g = 0; b = 1; label = 'Tím'; }
  else if (wl < 490) { r = 0; g = (wl - 440) / 50; b = 1; label = 'Lam'; }
  else if (wl < 510) { r = 0; g = 1; b = -(wl - 510) / 20; label = 'Lục lam'; }
  else if (wl < 580) { r = (wl - 510) / 70; g = 1; b = 0; label = 'Lục / Vàng'; }
  else if (wl < 645) { r = 1; g = -(wl - 645) / 65; b = 0; label = 'Cam'; }
  else if (wl <= 780) { r = 1; g = 0.08; b = 0.08; label = 'Đỏ'; }
  else { r = 0.95; g = 0.22; b = 0.22; label = 'Hồng ngoại (IR)'; }
  return {
    css: `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`,
    rgba: a => `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`,
    label
  };
}

/* ---------- Chuyển góc pha lượng tử (-π..π) sang màu HSL hài hòa ---------- */
function phaseColor(angle, alpha = 1, light = 56) {
  const hue = (((angle / TAU) * 360) % 360 + 360) % 360;
  return `hsla(${hue.toFixed(0)}, 68%, ${light}%, ${alpha})`;
}

/* ---------- Tiện ích vẽ Canvas ---------- */
function txt(ctx, s, x, y, col, size, al, wt, fam) {
  ctx.font = (wt || 500) + ' ' + (size || 12) + 'px ' + (fam || FONT);
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
function dot(ctx, x, y, r, col) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill();
}
function glowDot(ctx, x, y, r, colorCore, colorGlow) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
  g.addColorStop(0, colorCore);
  g.addColorStop(0.4, colorGlow);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, TAU); ctx.fill();
}
function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/* Nền buồng thí nghiệm đồng bộ hoàn toàn với tông màu nền của trang */
function drawLabChamberBg(ctx, x, y, w, h, r = 8) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.g;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Lưới đo vi mô mảnh theo màu đường kẻ của trang
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.strokeStyle = hexA(C.g, 0.45);
  ctx.lineWidth = 1;
  for (let gx = x + 36; gx < x + w; gx += 36) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
  }
  for (let gy = y + 36; gy < y + h; gy += 36) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
  }
  ctx.restore();
}

/* Khung bảng thông số HUD tối giản theo phong cách trang */
function drawHUD(ctx, x, y, w, h, title, val, sub, accent) {
  rr(ctx, x, y, w, h, 6);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.g;
  ctx.lineWidth = 1;
  ctx.stroke();
  // Vạch nhấn mảnh bên trái
  rr(ctx, x + 3, y + 6, 2.5, h - 12, 1.5);
  ctx.fillStyle = accent || C.main;
  ctx.fill();
  txt(ctx, title, x + 12, y + 12, C.mut, 9.5, 'left', 600);
  txt(ctx, val, x + 12, y + 28, C.ink, 12.5, 'left', 700, MONO);
  if (sub) txt(ctx, sub, x + 12, y + 42, accent || C.main, 9.5, 'left', 500);
}

/* ==========================================================================
   BỘ GIẢI SỐ 1D-TDSE (VISSCHER STAGGERED-TIME LEAPFROG)
   Giải phương trình Schrödinger phụ thuộc thời gian thực:
     i ∂ψ/∂t = -(1 / 2m) ∂²ψ/∂x² + V(x) ψ
   Ổn định tuyệt đối, có lớp hấp thụ biên (CAP) chống phản xạ giả.
   ========================================================================== */
function createTDSE(N) {
  return {
    N,
    R: new Float64Array(N),
    I: new Float64Array(N),
    V: new Float64Array(N),
    cap: new Float64Array(N),
    m: 1.0,
    dt: 0.12,
    t: 0,
    peakProb: 1
  };
}

function initTDSEWavepacket(sim, x0, sigma, k0, mEffSim, Vfunc) {
  const N = sim.N;
  sim.m = mEffSim;
  let vMax = 0;
  for (let i = 0; i < N; i++) {
    const v = Vfunc(i, N);
    sim.V[i] = v;
    if (v > vMax) vMax = v;
    // Lớp hấp thụ biên (Complex Absorbing Potential) ở 22 ô ngoài cùng
    const edge = Math.min(i, N - 1 - i);
    sim.cap[i] = edge < 22 ? 0.085 * Math.pow((22 - edge) / 22, 3) : 0;
  }
  // Đảm bảo điều kiện ổn định Visscher: dt * (2/m + Vmax) < 0.45
  sim.dt = Math.min(0.14 * mEffSim, 0.42 / (2.0 / mEffSim + vMax + 0.01));
  sim.t = 0;

  let norm = 0;
  const alpha = sim.dt / (2 * mEffSim);
  for (let i = 0; i < N; i++) {
    const dx = i - x0;
    const env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
    sim.R[i] = env * Math.cos(k0 * dx);
    // Khởi tạo I tại t = +dt/2 (lệch nửa bước thời gian)
    const phHalf = k0 * dx - (k0 * k0 / (2 * mEffSim)) * (sim.dt * 0.5);
    sim.I[i] = env * Math.sin(phHalf);
    norm += env * env;
  }
  const inv = 1 / Math.sqrt(norm || 1);
  let pMax = 0;
  for (let i = 0; i < N; i++) {
    sim.R[i] *= inv;
    sim.I[i] *= inv;
    const p = sim.R[i] * sim.R[i] + sim.I[i] * sim.I[i];
    if (p > pMax) pMax = p;
  }
  sim.peakProb = pMax || 0.01;
  void alpha;
}

function stepTDSE(sim, substeps) {
  const N = sim.N, R = sim.R, I = sim.I, V = sim.V, cap = sim.cap;
  const dt = sim.dt;
  const alpha = dt / (2 * sim.m);
  for (let s = 0; s < substeps; s++) {
    // Cập nhật phần thực R
    for (let i = 1; i < N - 1; i++) {
      const lapI = I[i + 1] - 2 * I[i] + I[i - 1];
      R[i] += -alpha * lapI + dt * V[i] * I[i];
    }
    // Cập nhật phần ảo I
    for (let i = 1; i < N - 1; i++) {
      const lapR = R[i + 1] - 2 * R[i] + R[i - 1];
      I[i] += alpha * lapR - dt * V[i] * R[i];
    }
    // Áp dụng lớp hấp thụ biên chống dội lại từ mép màn hình
    for (let i = 0; i < N; i++) {
      if (cap[i] > 0) {
        const d = 1 - cap[i];
        R[i] *= d;
        I[i] *= d;
      }
    }
    R[0] = R[N - 1] = I[0] = I[N - 1] = 0;
    sim.t += dt;
  }
}

const LABS = [];

/* ==========================================================================
   TAB 1 — HẠT TỰ DO: BUỒNG CHÂN KHÔNG & ỐNG PHÓNG ELECTRON
   Mô phỏng chùm electron bay trong ống chân không (V = 0):
   - Chế độ Sóng phẳng đơn sắc (Δp = 0, Δx = ∞): trường pha lan truyền, phát hiện bất định
   - Chế độ Bó sóng Gauss thực tế (Δx·Δp ≥ ħ/2): bó sóng lan truyền và dãn rộng tự nhiên
   - Nút "Đo vị trí": mô phỏng sụp đổ hàm sóng (Wavefunction Collapse) trên màn dò!
   ========================================================================== */
LABS.push({
  id: 'free', name: 'Hạt tự do', sec: 1,
  S: { k: 8, pres: 'a', waveType: 'plane', dens: 1 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng chân không Electron (V = 0) — Sóng vật chất de Broglie & Sụp đổ hàm sóng',
    area: 'a', anim: true,
    ctrls: [
      { k: 'waveType', seg: [['plane', 'Sóng phẳng (Δp=0)'], ['packet', 'Bó sóng thực (Gauss)']] },
      { k: 'pres', seg: [['a', 'k > 0 (→)'], ['b', 'k < 0 (←)'], ['0', 'k = 0']],
        set: { a: { k: 8 }, b: { k: -8 }, '0': { k: 0 } } },
      { k: 'k', l: 'Số sóng k', min: -18, max: 18, step: 0.5, f: v => (v > 0 ? '+' : '') + v.toFixed(1) + '×10⁸ m⁻¹' },
      { btn: 'Đo vị trí (Collapse)', fn(p) { p.st.triggerMeasure = true; } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, k = S.k;
      const pad = 16;
      const hudTop = 64;
      const chX = pad, chY = hudTop, chW = W - pad * 2, chH = H - hudTop - 32;
      const midY = chY + chH * 0.46;
      const tubeH = clamp(chH * 0.58, 96, 210);
      const tubeTop = midY - tubeH / 2, tubeBot = midY + tubeH / 2;

      // Tính thông số vật lý thực
      const kVal = k * 1e8; // m^-1
      const E_eV = kVal !== 0 ? (HBAR * HBAR * kVal * kVal) / (2 * ME * EV) : 0;
      const lam_A = k !== 0 ? (TAU / Math.abs(kVal)) * 1e10 : Infinity;
      const vg_kms = k !== 0 ? (HBAR * Math.abs(kVal) / ME) / 1000 : 0; // vận tốc nhóm thực v_g = ħk/m

      // Khung buồng chân không
      drawLabChamberBg(ctx, chX, chY, chW, chH, 12);

      // Ống gia tốc cực âm (Electron Gun) ở đầu phát
      const gunLeft = k >= 0;
      const gunX = gunLeft ? chX + 6 : chX + chW - 44;
      rr(ctx, gunX, midY - 34, 38, 68, 6);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      // Dây tóc Cathode nung đỏ phát electron
      const filX = gunLeft ? gunX + 12 : gunX + 26;
      glowDot(ctx, filX, midY, 7, C.main, hexA(C.c4, 0.7));
      // Vòng Anode hội tụ
      const anodeX = gunLeft ? gunX + 30 : gunX + 8;
      ln(ctx, anodeX, midY - 24, anodeX, midY - 9, C.mut, 2.5);
      ln(ctx, anodeX, midY + 9, anodeX, midY + 24, C.mut, 2.5);
      txt(ctx, 'GUN', gunX + 19, midY - 43, C.mut, 9, 'center', 700, MONO);

      // Vùng buồng bay chân không (Beam Chamber)
      const beamX0 = chX + 48, beamX1 = chX + chW - 48, beamW = Math.max(40, beamX1 - beamX0);
      rr(ctx, beamX0, tubeTop, beamW, tubeH, 6);
      ctx.fillStyle = hexA(C.bg, 0.82); ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      // Khởi tạo trạng thái bó sóng / vết đo huỳnh quang
      if (!st.hits) st.hits = [];
      if (!st.bins || st.bins.length !== 48) st.bins = new Float32Array(48);
      if (st.pktX == null) { st.pktX = 0.2; st.pktSpread = 0; }
      if (st.lastType !== S.waveType || st.lastDir !== Math.sign(k)) {
        st.lastType = S.waveType;
        st.lastDir = Math.sign(k);
        st.pktX = k >= 0 ? 0.15 : 0.85;
        st.pktSpread = 0;
        st.bins.fill(0);
      }

      // Cập nhật bó sóng Gauss (chuyển động theo vận tốc nhóm & tán sắc tự nhiên)
      if (S.waveType === 'packet') {
        const speedNorm = (k / 18) * 0.26;
        st.pktX += speedNorm * dt;
        st.pktSpread += dt * 0.012 * (1 + Math.abs(k) * 0.05);
        if (st.pktX > 1.08) { st.pktX = -0.06; st.pktSpread = 0; }
        if (st.pktX < -0.08) { st.pktX = 1.06; st.pktSpread = 0; }
      }

      // Xử lý sự kiện nhấn nút "Đo vị trí (Collapse)"
      if (st.triggerMeasure) {
        st.triggerMeasure = false;
        let uMeas;
        if (S.waveType === 'plane') {
          uMeas = Math.random(); // Bất định hoàn toàn: đều khắp buồng
        } else {
          // Lấy mẫu Gauss quanh tâm bó sóng
          const sig = 0.065 + st.pktSpread * 0.35;
          let g0 = 0;
          for (let i = 0; i < 6; i++) g0 += Math.random();
          uMeas = clamp(st.pktX + (g0 - 3) * 0.55 * sig, 0.02, 0.98);
        }
        st.collapse = { x: beamX0 + uMeas * beamW, y: midY + rnd(-tubeH * 0.25, tubeH * 0.25), life: 1.0 };
        const bi = clamp(Math.floor(uMeas * st.bins.length), 0, st.bins.length - 1);
        st.bins[bi] = Math.min(st.bins[bi] + 1, 14);
        st.hits.push({ x: st.collapse.x, y: st.collapse.y, life: 1.0, big: true });
      }

      // Vẽ trường sóng vật chất bên trong buồng chân không
      ctx.save();
      rr(ctx, beamX0, tubeTop, beamW, tubeH, 8);
      ctx.clip();

      const kpx = k * 0.036;
      const omega = Math.abs(k) * 3.6;
      const dir = k >= 0 ? 1 : -1;
      const sigNorm = 0.065 + st.pktSpread * 0.35;

      // 1. Dải trường pha quang học (Quantum Phase Field)
      const cols = 120;
      const colW = beamW / cols + 0.8;
      for (let i = 0; i < cols; i++) {
        const u = (i + 0.5) / cols;
        const x = beamX0 + u * beamW;
        let env = 1.0;
        if (S.waveType === 'packet') {
          const du = u - st.pktX;
          env = Math.exp(-(du * du) / (2 * sigNorm * sigNorm));
        }
        if (env < 0.02) continue;

        const ph = kpx * (x - beamX0) - dir * omega * t;
        const intensity = env * env * (0.20 + 0.16 * (Math.cos(ph) * 0.5 + 0.5));
        const gVert = ctx.createLinearGradient(x, tubeTop, x, tubeBot);
        const col = Math.abs(k) > 0.05 ? phaseColor(ph, intensity, 54) : hexA(C.mut, intensity * 0.45);
        gVert.addColorStop(0, 'rgba(0,0,0,0)');
        gVert.addColorStop(0.5, col);
        gVert.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gVert;
        ctx.fillRect(x - colW / 2, tubeTop, colW, tubeH);
      }

      // 2. Đường sóng thực Re(ψ) và đường sóng ảo Im(ψ) nổi khối 3D
      const amp = tubeH * 0.34;
      if (Math.abs(k) > 0.05 || S.waveType === 'packet') {
        // Im(ψ) mờ phía sau (tạo cảm giác sóng xoắn ốc phức e^{i(kx-ωt)})
        ctx.beginPath();
        for (let i = 0; i <= 180; i++) {
          const u = i / 180, x = beamX0 + u * beamW;
          const env = S.waveType === 'packet' ? Math.exp(-Math.pow((u - st.pktX) / sigNorm, 2) * 0.5) : 1;
          const ph = kpx * (x - beamX0) - dir * omega * t;
          const y = midY - Math.sin(ph) * amp * env * 0.65;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = hexA(C.c5, 0.5);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Re(ψ) phát sáng phía trước
        ctx.beginPath();
        for (let i = 0; i <= 180; i++) {
          const u = i / 180, x = beamX0 + u * beamW;
          const env = S.waveType === 'packet' ? Math.exp(-Math.pow((u - st.pktX) / sigNorm, 2) * 0.5) : 1;
          const ph = kpx * (x - beamX0) - dir * omega * t;
          const y = midY - Math.cos(ph) * amp * env;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = k >= 0 ? C.c2 : C.c4;
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Đường bao mật độ xác suất |ψ|² (nét đứt sáng)
        if (S.waveType === 'packet') {
          ctx.beginPath();
          for (let i = 0; i <= 180; i++) {
            const u = i / 180, x = beamX0 + u * beamW;
            const env = Math.exp(-Math.pow((u - st.pktX) / sigNorm, 2) * 0.5);
            const y = midY - env * amp;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.strokeStyle = hexA(C.main, 0.8);
          ctx.lineWidth = 1.4;
          ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
        }
      } else {
        ln(ctx, beamX0, midY, beamX1, midY, hexA(C.mut, 0.55), 2, [6, 5]);
        txt(ctx, 'k = 0 : Sóng dừng lặng — Động lượng p = 0, Vị trí bất định tuyệt đối', beamX0 + beamW / 2, midY - 18, C.mut, 11.5, 'center', 600);
      }

      // 3. Hiệu ứng Sụp đổ hàm sóng (Wavefunction Collapse) khi bấm nút Đo
      if (st.collapse && st.collapse.life > 0) {
        st.collapse.life -= dt * 1.1;
        const lf = clamp(st.collapse.life, 0, 1);
        const rad = 6 + (1 - lf) * 44;
        ctx.beginPath();
        ctx.arc(st.collapse.x, st.collapse.y, rad, 0, TAU);
        ctx.strokeStyle = hexA(C.main, lf * 0.9);
        ctx.lineWidth = 2;
        ctx.stroke();
        glowDot(ctx, st.collapse.x, st.collapse.y, 7 * lf + 2.5, C.ink, hexA(C.main, 0.8));
        txt(ctx, 'PHÁT HIỆN e⁻', st.collapse.x, st.collapse.y - 18, hexA(C.main, lf), 10, 'center', 700, MONO);
      }

      // 4. Các chớp huỳnh quang phát hiện electron liên tục theo |ψ|²
      if (Math.random() < 11 * dt) {
        let uHit = Math.random();
        if (S.waveType === 'packet') {
          let g0 = 0; for (let i = 0; i < 6; i++) g0 += Math.random();
          uHit = clamp(st.pktX + (g0 - 3) * 0.55 * sigNorm, 0.01, 0.99);
        }
        st.hits.push({
          x: beamX0 + uHit * beamW,
          y: midY + rnd(-tubeH * 0.36, tubeH * 0.36),
          life: 1.0, big: false
        });
        const bi = clamp(Math.floor(uHit * st.bins.length), 0, st.bins.length - 1);
        st.bins[bi] = Math.min(st.bins[bi] + 0.35, 14);
      }
      // Làm mờ dần histogram để phản ánh thời gian thực
      for (let i = 0; i < st.bins.length; i++) st.bins[i] = Math.max(0, st.bins[i] - dt * 0.45);

      st.hits.forEach(h => {
        h.life -= dt * (h.big ? 0.9 : 1.9);
        if (h.life <= 0) return;
        glowDot(ctx, h.x, h.y, (h.big ? 4.5 : 2.6) * h.life + 0.8,
          hexA(C.ink, h.life), hexA(C.c1, h.life * 0.75));
      });
      st.hits = st.hits.filter(h => h.life > 0);
      ctx.restore();

      // 5. Dải Màn Huỳnh Quang (Phosphor Scintillation Detector Strip) ngay dưới ống
      const detY = tubeBot + 10, detH = clamp(chY + chH - detY - 10, 26, 54);
      rr(ctx, beamX0, detY, beamW, detH, 6);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

      const bw = beamW / st.bins.length;
      for (let i = 0; i < st.bins.length; i++) {
        const frac = clamp(st.bins[i] / 10, 0, 1);
        if (frac <= 0.01) continue;
        const bh = frac * (detH - 6);
        ctx.fillStyle = hexA(C.c1, 0.28 + frac * 0.65);
        ctx.fillRect(beamX0 + i * bw + 1, detY + detH - 3 - bh, bw - 2, bh);
      }
      txt(ctx, 'MÀN DÒ HUỲNH QUANG (Tích lũy |ψ(x)|²)', beamX0 + 8, detY + 10, C.c1, 9.5, 'left', 600, MONO);

      // 6. Bảng HUD thông số đo thực tế phía trên
      const hudW = (W - pad * 2 - 20) / 3;
      drawHUD(ctx, pad, 8, hudW, 50, 'ĐỘNG NĂNG ELECTRON (E)',
        E_eV.toFixed(3) + ' eV', 'p = ħk = ' + (k !== 0 ? sci(HBAR * kVal, 1) : '0') + ' kg·m/s', C.main);
      drawHUD(ctx, pad + hudW + 10, 8, hudW, 50, 'BƯỚC SÓNG DE BROGLIE (λ)',
        isFinite(lam_A) ? lam_A.toFixed(2) + ' Å' : '∞',
        S.waveType === 'plane' ? 'Δp = 0 → Δx = ∞ (Bất định)' : 'Bó sóng định xứ (Δx·Δp ≥ ħ/2)', C.c5);
      drawHUD(ctx, pad + (hudW + 10) * 2, 8, hudW, 50, 'VẬN TỐC NHÓM (v_g)',
        vg_kms.toFixed(0) + ' km/s', k > 0 ? 'Hướng truyền: +x (→)' : k < 0 ? 'Hướng truyền: −x (←)' : 'Trạng thái tĩnh', C.c1);

      // Chú thích chân
      txt(ctx, 'Màu sắc dải sáng biểu diễn pha lượng tử phức e^{i(kx−ωt)} · Nhấn "Đo vị trí" để quan sát hàm sóng sụp đổ thành hạt',
        W / 2, H - 14, C.mut, 10.5, 'center', 500);
    }
  }]
});

/* ==========================================================================
   TAB 2 — GIẾNG THẾ VÔ HẠN: HỘP LƯỢNG TỬ BÁN DẪN (GaAs/AlGaAs) & PHÁT XẠ PHOTON
   Mô phỏng cấu trúc dị thể nano thực tế:
   - Hai vách mạng tinh thể AlGaAs (rào thế cao) kẹp chặt lớp GaAs mỏng nanomet
   - Đám mây xác suất lượng tử 2D/3D phát sáng theo |ψ_n(x)|² + sóng pha dao động
   - Khi chuyển mức n cao → n thấp: PHÁT XẠ PHOTON THẬT với bước sóng & màu quang phổ chính xác!
   ========================================================================== */
LABS.push({
  id: 'well', name: 'Giếng vô hạn', sec: 2,
  S: { n: 1, a: 20 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Hộp lượng tử bán dẫn (GaAs/AlGaAs) — Đám mây sóng dừng & Phát xạ Photon',
    area: 'a', anim: true,
    ctrls: [
      { k: 'n', l: 'Mức lượng tử n', min: 1, max: 5, step: 1,
        f: v => 'n = ' + v + '  (' + v + ' bụng, ' + (v - 1) + ' nút)' },
      { k: 'a', l: 'Bề rộng giếng a', min: 8, max: 80, step: 2,
        f: v => v + ' Å  (' + (v / 10).toFixed(1) + ' nm)' }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, n = Math.round(S.n), a_A = S.a;
      const pad = 16, hudTop = 64;
      const chX = pad, chY = hudTop, chW = W - pad * 2, chH = H - hudTop - 32;

      // Vật lý chính xác: E_n = n² π² ħ² / (2 m_e a²)
      const a_m = a_A * 1e-10;
      const E1_eV = (Math.PI * Math.PI * HBAR * HBAR / (2 * ME * a_m * a_m)) / EV;
      const En_eV = n * n * E1_eV;

      // Phát hiện chuyển mức năng lượng để bắn PHOTON quang phổ thật!
      if (!st.photons) st.photons = [];
      if (st.prevN != null && st.prevN !== n) {
        const dE = Math.abs((st.prevN * st.prevN - n * n) * E1_eV);
        const wl_nm = (H_PLANCK * C_LIGHT / (dE * EV)) * 1e9;
        const rgb = wavelengthToRGB(wl_nm);
        const isEmit = n < st.prevN; // Phát xạ khi nhảy xuống, hấp thụ khi nhảy lên
        st.photons.push({
          t: 0,
          emit: isEmit,
          rgb,
          wl_nm,
          dE,
          fromN: st.prevN,
          toN: n,
          angle: rnd(-0.35, 0.35)
        });
        st.flash = { life: 1.0, rgb };
      }
      st.prevN = n;

      // Vẽ buồng thí nghiệm
      drawLabChamberBg(ctx, chX, chY, chW, chH, 12);

      // Hình học giếng lượng tử co giãn thực tế theo a
      const minW = chW * 0.24, maxW = chW * 0.72;
      const boxW = minW + ((a_A - 8) / 72) * (maxW - minW);
      const boxX = chX + (chW - boxW) / 2;
      const boxH = clamp(chH * 0.68, 120, 250);
      const midY = chY + chH * 0.50;
      const topY = midY - boxH / 2, botY = midY + boxH / 2;

      // 1. Vẽ 2 khối tinh thể rào thế (AlGaAs Barrier Walls) hai bên với mạng nguyên tử
      const drawCrystalWall = (wx, ww, side) => {
        ctx.save();
        rr(ctx, wx, topY - 12, ww, boxH + 24, 6);
        const wg = ctx.createLinearGradient(wx, topY, wx + ww, topY);
        if (side === 'left') {
          wg.addColorStop(0, C.bg); wg.addColorStop(1, hexA(C.c4, 0.16));
        } else {
          wg.addColorStop(0, hexA(C.c4, 0.16)); wg.addColorStop(1, C.bg);
        }
        ctx.fillStyle = wg; ctx.fill();
        ctx.strokeStyle = hexA(C.c4, 0.6); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.clip();

        // Các nguyên tử mạng tinh thể rào cản
        const step = 18;
        for (let gx = wx + 9; gx < wx + ww; gx += step) {
          for (let gy = topY; gy < botY + 10; gy += step) {
            dot(ctx, gx, gy, 2, hexA(C.c4, 0.26));
          }
        }
        ctx.restore();
        txt(ctx, 'V = ∞', wx + ww / 2, topY - 22, C.c4, 10, 'center', 700, MONO);
      };

      const leftWallW = Math.max(24, boxX - chX - 12);
      const rightWallW = Math.max(24, chX + chW - (boxX + boxW) - 12);
      drawCrystalWall(chX + 8, leftWallW, 'left');
      drawCrystalWall(boxX + boxW + 4, rightWallW, 'right');

      // 2. Lòng giếng lượng tử (GaAs Quantum Well)
      rr(ctx, boxX, topY, boxW, boxH, 4);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      // Vẽ đám mây mật độ xác suất |ψ_n(x)|² phát sáng (Quantum Cloud)
      const freq = Math.min(18, (n * n * 1.6) * (25 / Math.max(a_A, 10)));
      const phT = freq * t;
      const cosT = Math.cos(phT), sinT = Math.sin(phT);

      ctx.save();
      rr(ctx, boxX, topY, boxW, boxH, 4);
      ctx.clip();

      // Lớp mạng tinh thể mờ bên trong giếng GaAs
      for (let gx = boxX + 12; gx < boxX + boxW; gx += 20) {
        for (let gy = topY + 14; gy < botY; gy += 20) {
          dot(ctx, gx, gy, 1.3, hexA(C.mut, 0.2));
        }
      }

      // Đám mây xác suất thể tích (Volumetric Probability Density Glow)
      const slices = 110;
      const sw = boxW / slices + 0.8;
      for (let i = 0; i < slices; i++) {
        const u = (i + 0.5) / slices;
        const psi = Math.sin(n * Math.PI * u);
        const prob = psi * psi; // |ψ|²
        if (prob < 0.01) continue;
        const sx = boxX + u * boxW;
        // Màu thay đổi theo dấu pha của từng bụng sóng (nút đổi dấu)
        const sign = psi * cosT >= 0 ? 1 : -1;
        const col = sign > 0 ? hexA(C.c2, prob * 0.34) : hexA(C.c5, prob * 0.34);
        const gCloud = ctx.createLinearGradient(sx, topY, sx, botY);
        gCloud.addColorStop(0, 'rgba(0,0,0,0)');
        gCloud.addColorStop(0.5, col);
        gCloud.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gCloud;
        ctx.fillRect(sx - sw / 2, topY, sw, boxH);
      }

      // Hiệu ứng chớp sáng khi vừa chuyển mức phát xạ photon
      if (st.flash && st.flash.life > 0) {
        st.flash.life -= dt * 2.4;
        ctx.fillStyle = st.flash.rgb.rgba(Math.max(0, st.flash.life * 0.22));
        ctx.fillRect(boxX, topY, boxW, boxH);
      }

      // Sóng dừng phức 3D (Re + Im quay trong mặt phẳng phức)
      const amp = boxH * 0.36;
      // Phần ảo Im(ψ)
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const u = i / 160;
        const y = midY - Math.sin(n * Math.PI * u) * sinT * amp * 0.55;
        i === 0 ? ctx.moveTo(boxX + u * boxW, y) : ctx.lineTo(boxX + u * boxW, y);
      }
      ctx.strokeStyle = hexA(C.c5, 0.55); ctx.lineWidth = 1.6; ctx.stroke();

      // Phần thực Re(ψ)
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const u = i / 160;
        const y = midY - Math.sin(n * Math.PI * u) * cosT * amp;
        i === 0 ? ctx.moveTo(boxX + u * boxW, y) : ctx.lineTo(boxX + u * boxW, y);
      }
      ctx.strokeStyle = C.c2; ctx.lineWidth = 2.6; ctx.stroke();

      // Đánh dấu các mặt phẳng NÚT (Nodal planes: |ψ|² = 0 tuyệt đối)
      for (let kNode = 1; kNode < n; kNode++) {
        const nx = boxX + (kNode / n) * boxW;
        ln(ctx, nx, topY + 6, nx, botY - 6, hexA(C.err, 0.55), 1.2, [4, 4]);
        dot(ctx, nx, midY, 4, C.err);
        txt(ctx, 'Nút', nx, botY - 12, C.err, 9.5, 'center', 700);
      }

      // Các chớp phát hiện hạt electron theo đúng phân bố sin²(nπx/a)
      if (!st.hits) st.hits = [];
      for (let tr = 0; tr < 4; tr++) {
        const u = Math.random();
        if (Math.random() < Math.pow(Math.sin(n * Math.PI * u), 2)) {
          st.hits.push({
            x: boxX + u * boxW,
            y: midY + rnd(-amp * 0.72, amp * 0.72),
            life: 1.0
          });
          break;
        }
      }
      ctx.globalCompositeOperation = 'lighter';
      st.hits.forEach(h => {
        h.life -= dt * 1.8;
        if (h.life <= 0) return;
        glowDot(ctx, h.x, h.y, 2.6 * h.life + 0.8, hexA(C.ink, h.life), hexA(C.main, h.life * 0.75));
      });
      st.hits = st.hits.filter(h => h.life > 0);
      ctx.restore();

      // 3. Vẽ PHOTON bay ra (hoặc bay vào) khi chuyển mức năng lượng!
      st.photons.forEach(ph => {
        ph.t += dt * 0.85;
        const dist = ph.emit ? ph.t * (chW * 0.52) : (1 - ph.t) * (chW * 0.52);
        const px = boxX + boxW / 2 + Math.cos(ph.angle) * dist;
        const py = midY + Math.sin(ph.angle) * dist;
        const alpha = clamp(1 - Math.abs(ph.t - 0.5) * 2, 0, 1);
        if (alpha <= 0) return;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ph.angle);
        // Sóng điện từ của bó photon
        ctx.beginPath();
        for (let s = -28; s <= 28; s += 2) {
          const env = Math.exp(-(s * s) / 260);
          const wy = Math.sin(s * 0.55 - t * 22) * 9 * env;
          s === -28 ? ctx.moveTo(s, wy) : ctx.lineTo(s, wy);
        }
        ctx.strokeStyle = ph.rgb.rgba(alpha);
        ctx.lineWidth = 2.6;
        ctx.stroke();
        glowDot(ctx, 0, 0, 6, '#ffffff', ph.rgb.rgba(alpha * 0.9));
        ctx.restore();

        txt(ctx, (ph.emit ? 'PHÁT XẠ γ: ' : 'HẤP THỤ γ: ') + ph.wl_nm.toFixed(0) + ' nm (' + ph.rgb.label + ')',
          px, py - 18, ph.rgb.rgba(alpha), 10.5, 'center', 700, MONO);
      });
      st.photons = st.photons.filter(ph => ph.t < 1.15);

      // Thước đo bề rộng nano ngay đáy giếng
      ln(ctx, boxX, botY + 14, boxX + boxW, botY + 14, C.mut, 1.4);
      ln(ctx, boxX, botY + 9, boxX, botY + 19, C.mut, 1.4);
      ln(ctx, boxX + boxW, botY + 9, boxX + boxW, botY + 19, C.mut, 1.4);
      txt(ctx, 'a = ' + a_A + ' Å (' + (a_A / 10).toFixed(1) + ' nm)', boxX + boxW / 2, botY + 26, C.ink, 11, 'center', 700, MONO);

      // Bảng HUD phía trên
      const hudW = (W - pad * 2 - 20) / 3;
      drawHUD(ctx, pad, 8, hudW, 50, 'NĂNG LƯỢNG MỨC E_' + n,
        En_eV.toFixed(3) + ' eV', 'E_' + n + ' = ' + (n * n) + ' × E₁ (E₁ = ' + E1_eV.toFixed(3) + ' eV)', C.main);
      drawHUD(ctx, pad + hudW + 10, 8, hudW, 50, 'BƯỚC SÓNG ĐỨNG (λ_n)',
        (2 * a_A / n).toFixed(1) + ' Å', 'a = ' + n + ' × (λ/2) · Không triệt tiêu năng lượng', C.c5);
      const dE_next = ((n + 1) * (n + 1) - n * n) * E1_eV;
      const wl_next = (H_PLANCK * C_LIGHT / (dE_next * EV)) * 1e9;
      drawHUD(ctx, pad + (hudW + 10) * 2, 8, hudW, 50, 'CHUYỂN MỨC KẾ TIẾP',
        'ΔE = ' + dE_next.toFixed(2) + ' eV', 'λ ≈ ' + (wl_next < 9999 ? wl_next.toFixed(0) + ' nm' : '>10 µm') + ' (Kéo n để phát photon)', C.c1);

      txt(ctx, 'Thay đổi mức n để xem electron nhảy mức và phát/hấp thụ photon mang đúng màu quang phổ thực tế',
        W / 2, H - 14, C.mut, 10.5, 'center', 500);
    }
  }]
});

/* ==========================================================================
   TAB 3 — BẬC THẾ NĂNG: MÔ PHỎNG BỘ GIẢI SỐ 1D-TDSE THỜI GIAN THỰC
   Giải trực tiếp phương trình Schrödinger phụ thuộc thời gian!
   - Bó sóng electron bay từ vùng chân không đập vào mặt phân cách bậc thế V₀.
   - E < V₀: Giao thoa mạnh ở mặt ngoài, đâm xuyên hàm mũ vào lòng tường rồi dội ngược!
   - E ≥ V₀: Tách thành sóng phản xạ một phần và sóng truyền qua chậm hơn, bước sóng dài hơn!
   ========================================================================== */
LABS.push({
  id: 'step', name: 'Bậc thế năng', sec: 3,
  S: { E: 0.65, V0: 1.0 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Mô phỏng 1D-TDSE thực tế — Bó sóng Electron va chạm bậc thế năng V₀',
    area: 'a', anim: true,
    ctrls: [
      { k: 'E', l: 'Năng lượng E', min: 0.15, max: 2.5, step: 0.05, f: v => v.toFixed(2) + ' eV' },
      { k: 'V0', l: 'Độ cao bậc V₀', min: 0.4, max: 2.5, step: 0.1, f: v => v.toFixed(1) + ' eV' },
      { btn: 'Bắn bó sóng mới', fn(p) { p.st.resetSim = true; } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, E = S.E, V0 = S.V0;
      const pad = 16, hudTop = 64;
      const chX = pad, chY = hudTop, chW = W - pad * 2, chH = H - hudTop - 32;
      const underBarrier = E < V0;

      // Vật lý lý thuyết chính xác
      const kappa = underBarrier ? Math.sqrt(2 * ME * (V0 - E) * EV) / HBAR : 0;
      const delta_nm = underBarrier ? (1 / kappa) * 1e9 : Infinity;
      const k1_phys = Math.sqrt(2 * ME * E * EV) / HBAR;
      const k2_phys = !underBarrier ? Math.sqrt(2 * ME * (E - V0) * EV) / HBAR : 0;
      const R_theo = underBarrier ? 1 : Math.pow((k1_phys - k2_phys) / (k1_phys + k2_phys), 2);
      const T_theo = 1 - R_theo;

      // Khởi tạo / cập nhật bộ giải số 1D-TDSE
      const N = 260;
      const stepIdx = Math.floor(N * 0.48);
      const key = `${E.toFixed(2)}_${V0.toFixed(1)}`;
      if (!st.sim || st.key !== key || st.resetSim) {
        st.key = key;
        st.resetSim = false;
        st.sim = createTDSE(N);
        const Vref = Math.max(E, V0, 1.0);
        const E_sim = (E / Vref) * 0.16;
        const V_sim = (V0 / Vref) * 0.16;
        const k0 = Math.sqrt(2 * 1.0 * E_sim);
        initTDSEWavepacket(st.sim, N * 0.22, 13, k0, 1.0, i => (i >= stepIdx ? V_sim : 0));
        st.penHits = [];
      }

      // Chạy 10 bước thời gian TDSE mỗi khung hình
      stepTDSE(st.sim, 10);

      // Tính xác suất đang nằm trong vùng I và vùng II (đo trực tiếp từ hàm sóng TDSE!)
      let pLeft = 0, pRight = 0, pTotal = 0;
      const sim = st.sim;
      for (let i = 0; i < N; i++) {
        const pr = sim.R[i] * sim.R[i] + sim.I[i] * sim.I[i];
        if (i < stepIdx) pLeft += pr; else pRight += pr;
      }
      pTotal = pLeft + pRight;
      // Tự động bắn lại bó sóng mới khi bó sóng cũ đã rời khỏi buồng đo
      if (pTotal < 0.06) st.resetSim = true;

      // Vẽ buồng thí nghiệm
      drawLabChamberBg(ctx, chX, chY, chW, chH, 12);

      const simX = chX + 12, simW = chW - 24;
      const simY = chY + 26, simH = chH - 44;
      const stepX = simX + (stepIdx / (N - 1)) * simW;
      const baseLine = simY + simH * 0.78;

      // Vẽ khối vật liệu Vùng II (Bậc thế V0) có chiều cao tỉ lệ với V0
      const maxE = Math.max(E, V0, 2.5);
      const vHeightPx = (V0 / maxE) * (simH * 0.65);
      const eHeightPx = (E / maxE) * (simH * 0.65);
      const wallTopY = baseLine - vHeightPx;

      ctx.save();
      rr(ctx, simX, simY, simW, simH, 8);
      ctx.clip();

      // Khối thế năng Vùng II
      const wallGrad = ctx.createLinearGradient(stepX, wallTopY, stepX + 160, wallTopY);
      wallGrad.addColorStop(0, underBarrier ? hexA(C.c4, 0.24) : hexA(C.c2, 0.18));
      wallGrad.addColorStop(1, underBarrier ? hexA(C.c4, 0.07) : hexA(C.c2, 0.05));
      ctx.fillStyle = wallGrad;
      ctx.fillRect(stepX, wallTopY, simX + simW - stepX, baseLine - wallTopY + 40);

      // Lưới tinh thể bên trong bậc thế năng
      for (let gx = stepX + 14; gx < simX + simW; gx += 22) {
        for (let gy = wallTopY + 12; gy < baseLine + 12; gy += 22) {
          dot(ctx, gx, gy, 1.5, underBarrier ? hexA(C.c4, 0.25) : hexA(C.c2, 0.2));
        }
      }

      // Viền bậc thế V(x)
      ctx.beginPath();
      ctx.moveTo(simX, baseLine);
      ctx.lineTo(stepX, baseLine);
      ctx.lineTo(stepX, wallTopY);
      ctx.lineTo(simX + simW, wallTopY);
      ctx.strokeStyle = underBarrier ? C.c4 : C.c2;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Mức năng lượng E của chùm hạt (đường nét đứt ngang)
      const eY = baseLine - eHeightPx;
      ln(ctx, simX, eY, simX + simW, eY, hexA(C.main, 0.55), 1.2, [5, 4]);
      txt(ctx, 'E = ' + E.toFixed(2) + ' eV', simX + 8, eY - 10, C.main, 10, 'left', 700, MONO);
      txt(ctx, 'V₀ = ' + V0.toFixed(1) + ' eV', stepX + 10, wallTopY - 10, underBarrier ? C.c4 : C.c2, 10, 'left', 700, MONO);

      // Vẽ hàm sóng TDSE thực tế: Dải sáng |ψ(x,t)|² tô màu theo pha phức arg(ψ)
      const waveScale = (simH * 0.58) / (sim.peakProb || 0.01);
      for (let i = 1; i < N - 1; i++) {
        const pr = sim.R[i] * sim.R[i] + sim.I[i] * sim.I[i];
        const hBar = Math.min(simH * 0.72, pr * waveScale);
        if (hBar < 0.8) continue;
        const x = simX + (i / (N - 1)) * simW;
        const ph = Math.atan2(sim.I[i], sim.R[i]);
        const inWall = i >= stepIdx && underBarrier;
        const col = inWall
          ? hexA(C.c4, clamp(0.32 + hBar / 90, 0.32, 0.88))
          : phaseColor(ph, clamp(0.24 + hBar / 110, 0.24, 0.78), 55);
        ctx.fillStyle = col;
        ctx.fillRect(x - 1.5, baseLine - hBar, simW / N + 1.5, hBar);
      }

      // Đường biên mật độ xác suất |ψ(x,t)|² sắc nét
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const pr = sim.R[i] * sim.R[i] + sim.I[i] * sim.I[i];
        const x = simX + (i / (N - 1)) * simW;
        const y = baseLine - Math.min(simH * 0.72, pr * waveScale);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.9;
      ctx.stroke();

      // Hiển thị chớp đâm xuyên thực khi hàm sóng đang thấm vào lòng bức tường cấm
      if (underBarrier && pRight > 0.015) {
        const depthGlow = clamp(pRight * 4.5, 0, 1);
        txt(ctx, 'ĐANG ĐÂM XUYÊN VÀO VÙNG CẤM: ' + (pRight * 100).toFixed(1) + '%',
          stepX + 12, simY + 26, hexA(C.main, depthGlow), 10.5, 'left', 700, MONO);
      }
      ctx.restore();

      // Nhãn 2 vùng
      txt(ctx, 'VÙNG I : CHÂN KHÔNG (V = 0)', simX + (stepX - simX) / 2, chY + 14, C.mut, 10, 'center', 700, MONO);
      txt(ctx, 'VÙNG II : BẬC THẾ V₀', stepX + (simX + simW - stepX) / 2, chY + 14, underBarrier ? C.c4 : C.c2, 10, 'center', 700, MONO);

      // Bảng HUD phía trên
      const hudW = (W - pad * 2 - 20) / 3;
      drawHUD(ctx, pad, 8, hudW, 50, 'CHẾ ĐỘ TƯƠNG TÁC',
        underBarrier ? 'ĐÂM XUYÊN VÙNG CẤM' : 'VƯỢT RÀO MỘT PHẦN',
        underBarrier ? 'E < V₀ (Cổ điển: bật lại 100% tại x=0)' : 'E ≥ V₀ (Tách sóng phản xạ & truyền qua)',
        underBarrier ? C.c4 : C.c1);
      drawHUD(ctx, pad + hudW + 10, 8, hudW, 50, 'ĐỘ SÂU ĐÂM XUYÊN (δ = 1/κ)',
        isFinite(delta_nm) ? delta_nm.toFixed(2) + ' nm' : '∞ (Truyền tự do)',
        underBarrier ? 'κ = ' + (kappa * 1e-9).toFixed(2) + '×10⁹ m⁻¹' : 'Tỷ lệ truyền lý thuyết T = ' + (T_theo * 100).toFixed(1) + '%', C.main);
      drawHUD(ctx, pad + (hudW + 10) * 2, 8, hudW, 50, 'ĐO TRỰC TIẾP TỪ TDSE',
        'Vùng II: ' + (pRight * 100).toFixed(1) + '%',
        'Vùng I: ' + (pLeft * 100).toFixed(1) + '%  |  R_lt = ' + (R_theo * 100).toFixed(1) + '%', C.c2);

      txt(ctx, 'Bộ giải số 1D-TDSE thời gian thực: Quan sát gợn giao thoa tại vách và đuôi sóng thấm sâu vào lòng tường trước khi dội ra',
        W / 2, H - 14, C.mut, 10.5, 'center', 500);
    }
  }]
});

/* ==========================================================================
   TAB 4 — XUYÊN HẦM LƯỢNG TỬ: MẶT CẮT TRANSISTOR NANO (SOURCE–OXIDE–DRAIN)
   Mô phỏng thực tế dòng rò xuyên hầm qua lớp cách điện mỏng nanomet:
   - Kết hợp bộ giải 1D-TDSE cho thấy sóng tắt dần trong lớp Oxide và tái sinh ở cực Máng
   - Các lớp nguyên tử SiO₂ hiển thị thật theo độ dày d (nm)
   - Đồng hồ Ampe kế cơ + điện tử nhảy kim thật theo dòng rò (pA → nA → µA → mA)
   ========================================================================== */
LABS.push({
  id: 'tunnel', name: 'Xuyên hầm', sec: 4,
  S: { mat: 'si', d: 1.0, E: 0.65, V0: 1.2 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Mặt cắt Transistor Nano — Xuyên hầm lượng tử TDSE qua lớp Oxide mỏng',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mat', seg: [['si', 'Silicon (m*=0.98m₀)'], ['gaas', 'GaAs (m*=0.067m₀)']] },
      { k: 'd', l: 'Độ dày rào d', min: 0.4, max: 3.0, step: 0.1, f: v => v.toFixed(1) + ' nm' },
      { k: 'E', l: 'Năng lượng E', min: 0.2, max: 2.0, step: 0.05, f: v => v.toFixed(2) + ' eV' },
      { k: 'V0', l: 'Rào V₀', min: 0.8, max: 2.5, step: 0.1, f: v => v.toFixed(1) + ' eV' },
      { btn: 'Bắn xung sóng', fn(p) { p.st.resetSim = true; } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const mEff = S.mat === 'gaas' ? 0.067 * ME : 0.98 * ME;
      const E = S.E, V0 = S.V0, d_nm = S.d;
      const underBarrier = E < V0;

      // Xác suất xuyên hầm chính xác (Công thức giải tích cho rào chữ nhật 1D)
      let T_prob = 1;
      let kappa = 0;
      if (underBarrier) {
        kappa = Math.sqrt(2 * mEff * (V0 - E) * EV) / HBAR;
        const kd = kappa * (d_nm * 1e-9);
        const sinhKd = kd > 40 ? Math.exp(kd) * 0.5 : Math.sinh(kd);
        const pref = (V0 * V0) / (4 * E * (V0 - E));
        T_prob = 1 / (1 + pref * sinhKd * sinhKd);
      } else if (E > V0) {
        const k2 = Math.sqrt(2 * mEff * (E - V0) * EV) / HBAR;
        const sinKd = Math.sin(k2 * d_nm * 1e-9);
        const pref = (V0 * V0) / (4 * E * (E - V0));
        T_prob = 1 / (1 + pref * sinKd * sinKd);
      }
      const R_prob = 1 - T_prob;
      const current_uA = T_prob * 1200; // quy đổi dòng rò đỉnh 1.2 mA

      // Khởi tạo / cập nhật bộ giải TDSE cho mặt cắt xuyên hầm
      const N = 260;
      const barCenterIdx = Math.floor(N * 0.47);
      const barCells = clamp(Math.round(d_nm * 8.5), 4, 34);
      const barLIdx = barCenterIdx - Math.floor(barCells / 2);
      const barRIdx = barLIdx + barCells;
      const key = `${S.mat}_${d_nm.toFixed(1)}_${E.toFixed(2)}_${V0.toFixed(1)}`;
      if (!st.sim || st.key !== key || st.resetSim) {
        st.key = key;
        st.resetSim = false;
        st.sim = createTDSE(N);
        const Vref = Math.max(E, V0, 1.0);
        const mSim = S.mat === 'gaas' ? 0.28 : 1.0; // GaAs nhẹ hơn → suy giảm chậm hơn hẳn trong rào
        const E_sim = (E / Vref) * 0.15;
        const V_sim = (V0 / Vref) * 0.15;
        const k0 = Math.sqrt(2 * mSim * E_sim);
        initTDSEWavepacket(st.sim, N * 0.20, 12, k0, mSim, i => (i >= barLIdx && i <= barRIdx ? V_sim : 0));
      }
      stepTDSE(st.sim, 10);

      // Kiểm tra nếu bó sóng đã đi hết thì tự bắn tiếp
      let pTotal = 0;
      const sim = st.sim;
      for (let i = 0; i < N; i++) pTotal += sim.R[i] * sim.R[i] + sim.I[i] * sim.I[i];
      if (pTotal < 0.05) st.resetSim = true;

      // Vẽ buồng linh kiện Transistor Nano
      const pad = 16, hudTop = 64;
      const chX = pad, chY = hudTop, chW = W - pad * 2, chH = H - hudTop - 32;
      drawLabChamberBg(ctx, chX, chY, chW, chH, 12);

      const devX = chX + 14, devW = chW - 28;
      const devY = chY + 26, devH = chH - 42;
      const barL = devX + (barLIdx / (N - 1)) * devW;
      const barR = devX + (barRIdx / (N - 1)) * devW;
      const barW = Math.max(8, barR - barL);
      const midY = devY + devH * 0.56;
      const baseLine = devY + devH * 0.86;

      // 1. Khối Cực Nguồn (Source - n+ Semiconductor) & Cực Máng (Drain)
      rr(ctx, devX, devY, barL - devX - 2, devH, 6);
      ctx.fillStyle = hexA(C.bg, 0.72); ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

      rr(ctx, barR + 2, devY, devX + devW - barR - 2, devH, 6);
      ctx.fillStyle = hexA(C.bg, 0.72); ctx.fill();
      ctx.strokeStyle = current_uA > 0.05 ? hexA(C.c1, 0.45) : C.g; ctx.lineWidth = 1; ctx.stroke();

      // 2. Lớp Rào Cách Điện Oxide (Gate Oxide / Tunnel Barrier) với các lớp nguyên tử thật
      rr(ctx, barL, devY - 6, barW, devH + 12, 4);
      const oxGrad = ctx.createLinearGradient(barL, devY, barR, devY);
      oxGrad.addColorStop(0, underBarrier ? hexA(C.c4, 0.26) : hexA(C.c2, 0.2));
      oxGrad.addColorStop(0.5, underBarrier ? hexA(C.main, 0.14) : hexA(C.c2, 0.1));
      oxGrad.addColorStop(1, underBarrier ? hexA(C.c4, 0.26) : hexA(C.c2, 0.2));
      ctx.fillStyle = oxGrad; ctx.fill();
      ctx.strokeStyle = underBarrier ? C.c4 : C.c2; ctx.lineWidth = 1.8; ctx.stroke();

      // Vẽ các hàng nguyên tử SiO₂ bên trong rào (1 lớp nguyên tử ≈ 0.25 nm)
      const atomCols = Math.max(1, Math.round(d_nm / 0.28));
      for (let ac = 0; ac < atomCols; ac++) {
        const ax = barL + ((ac + 0.5) / atomCols) * barW;
        for (let ay = devY + 14; ay < devY + devH - 8; ay += 20) {
          dot(ctx, ax, ay, 2, underBarrier ? hexA(C.c4, 0.45) : hexA(C.c2, 0.4));
        }
      }
      txt(ctx, 'OXIDE d=' + d_nm.toFixed(1) + 'nm (~' + atomCols + ' lớp nt)', (barL + barR) / 2, devY - 15,
        underBarrier ? C.c4 : C.c2, 9.5, 'center', 700, MONO);

      // 3. Vẽ sóng TDSE xuyên qua lớp Oxide (tắt dần hàm mũ bên trong và tái sinh phía Drain!)
      const waveScale = (devH * 0.62) / (sim.peakProb || 0.01);
      ctx.save();
      rr(ctx, devX, devY, devW, devH, 6);
      ctx.clip();
      for (let i = 1; i < N - 1; i++) {
        const pr = sim.R[i] * sim.R[i] + sim.I[i] * sim.I[i];
        // Khuếch đại thị giác nhẹ ở phần xuyên hầm nếu quá nhỏ nhưng > 0 để thấy sóng mờ
        const boost = i > barRIdx ? Math.min(3.5, 1 + 0.5 / Math.max(T_prob, 0.05)) : 1;
        const hBar = Math.min(devH * 0.72, pr * waveScale * boost);
        if (hBar < 0.6) continue;
        const x = devX + (i / (N - 1)) * devW;
        const ph = Math.atan2(sim.I[i], sim.R[i]);
        let col;
        if (i >= barLIdx && i <= barRIdx) col = hexA(C.main, clamp(0.32 + hBar / 80, 0.32, 0.9));
        else if (i > barRIdx) col = hexA(C.c1, clamp(0.32 + hBar / 70, 0.32, 0.9));
        else col = phaseColor(ph, clamp(0.24 + hBar / 100, 0.24, 0.76), 55);
        ctx.fillStyle = col;
        ctx.fillRect(x - 1.4, baseLine - hBar, devW / N + 1.4, hBar);
      }

      // Đường sóng |ψ|² rõ nét
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const pr = sim.R[i] * sim.R[i] + sim.I[i] * sim.I[i];
        const x = devX + (i / (N - 1)) * devW;
        const y = baseLine - Math.min(devH * 0.72, pr * waveScale);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.7; ctx.stroke();

      // 4. Dòng hạt electron thực tế (mờ dần như sóng ma KHI ĐI QUA LÒNG RÀO, không teleport!)
      if (!st.particles) st.particles = [];
      st.gen = (st.gen || 0) + dt;
      if (st.gen > 0.055) {
        st.gen = 0;
        const willTunnel = Math.random() < clamp(T_prob, 0, 1);
        st.particles.push({
          x: devX + 10,
          y: devY + rnd(26, devH * 0.55),
          vx: rnd(130, 175),
          willTunnel,
          state: 'in',
          alpha: 1
        });
      }

      ctx.globalCompositeOperation = 'lighter';
      st.particles.forEach(pt => {
        if (pt.state === 'in') {
          pt.x += pt.vx * dt;
          if (pt.x >= barL) {
            if (pt.willTunnel) {
              pt.state = 'inside';
            } else {
              pt.state = 'ref';
              pt.vx = -Math.abs(pt.vx);
            }
          }
        } else if (pt.state === 'inside') {
          // Chui chậm qua lớp Oxide với hiệu ứng bán trong suốt (evanescent ghost)
          pt.x += pt.vx * 0.55 * dt;
          if (pt.x >= barR) {
            pt.state = 'out';
            st.drainSpark = 1.0;
          }
        } else if (pt.state === 'ref') {
          pt.x += pt.vx * dt;
          if (pt.x < devX + 12) pt.alpha -= dt * 3;
        } else if (pt.state === 'out') {
          pt.x += pt.vx * dt;
          if (pt.x > devX + devW - 14) pt.alpha -= dt * 3;
        }

        const a = clamp(pt.alpha, 0, 1) * (pt.state === 'inside' ? 0.45 : 0.95);
        const baseCol = pt.state === 'out' ? C.c1 : pt.state === 'ref' ? C.c4 : pt.state === 'inside' ? C.main : C.c2;
        glowDot(ctx, pt.x, pt.y, pt.state === 'out' ? 3.2 : 2.5, hexA(C.ink, a), hexA(baseCol, a * 0.8));
        ctx.globalAlpha = a * 0.55;
        ln(ctx, pt.x, pt.y, pt.x - Math.sign(pt.vx) * 11, pt.y, baseCol, 1.4);
        ctx.globalAlpha = 1;
      });
      st.particles = st.particles.filter(pt => pt.alpha > 0 && pt.x >= devX && pt.x <= devX + devW);
      ctx.restore();

      // 5. Đồng hồ AMPE KẾ (Analog Needle + Digital Readout) đặt ở góc phải Cực Máng
      const mW = 148, mH = 82;
      const mX = devX + devW - mW - 8, mY = devY + 10;
      rr(ctx, mX, mY, mW, mH, 6);
      ctx.fillStyle = C.card; ctx.fill();
      ctx.strokeStyle = current_uA > 1 ? hexA(C.c1, 0.7) : C.g;
      ctx.lineWidth = 1.2; ctx.stroke();

      // Cung chia độ đồng hồ cơ
      const cxM = mX + mW / 2, cyM = mY + 52, rM = 34;
      ctx.beginPath(); ctx.arc(cxM, cyM, rM, Math.PI * 1.12, Math.PI * 1.88);
      ctx.strokeStyle = C.g; ctx.lineWidth = 3; ctx.stroke();
      // Vùng cảnh báo rò điện mạnh
      ctx.beginPath(); ctx.arc(cxM, cyM, rM, Math.PI * 1.68, Math.PI * 1.88);
      ctx.strokeStyle = hexA(C.err, 0.85); ctx.lineWidth = 3; ctx.stroke();

      // Góc kim (log scale cho dải rộng từ pA đến mA)
      const logI = current_uA > 1e-6 ? clamp((Math.log10(current_uA) + 6) / 9, 0, 1) : 0;
      st.needle = (st.needle || 0) + (logI - (st.needle || 0)) * Math.min(1, dt * 8);
      const ang = Math.PI * (1.12 + st.needle * 0.76) + (current_uA > 0.01 ? Math.sin(t * 28) * 0.012 : 0);
      ln(ctx, cxM, cyM, cxM + Math.cos(ang) * (rM - 4), cyM + Math.sin(ang) * (rM - 4), C.main, 2);
      dot(ctx, cxM, cyM, 3.5, C.ink);

      const curStr = current_uA >= 1000 ? (current_uA / 1000).toFixed(2) + ' mA'
        : current_uA >= 0.01 ? current_uA.toFixed(2) + ' µA'
        : current_uA >= 1e-5 ? (current_uA * 1000).toFixed(1) + ' nA'
        : current_uA >= 1e-8 ? (current_uA * 1e6).toFixed(1) + ' pA' : '0.00 pA';
      txt(ctx, 'AMPE KẾ DÒNG RÒ', cxM, mY + 11, C.mut, 8.5, 'center', 700, MONO);
      txt(ctx, curStr, cxM, mY + 69, current_uA > 0.05 ? C.c1 : C.mut, 13, 'center', 800, MONO);

      // Nhãn 2 cực
      txt(ctx, 'CỰC NGUỒN (SOURCE)', devX + 10, devY + 14, C.mut, 10, 'left', 700, MONO);
      txt(ctx, 'CỰC MÁNG (DRAIN)', barR + 10, devY + 14, C.c1, 10, 'left', 700, MONO);

      // Bảng HUD phía trên
      const hudW = (W - pad * 2 - 20) / 3;
      drawHUD(ctx, pad, 8, hudW, 50, 'VẬT LIỆU BÁN DẪN',
        S.mat === 'gaas' ? 'GaAs (m* = 0.067 m₀)' : 'Silicon (m* = 0.98 m₀)',
        S.mat === 'gaas' ? 'Electron siêu nhẹ → Xuyên hầm cực mạnh' : 'Electron nặng hơn → Cản rò tốt hơn',
        S.mat === 'gaas' ? C.c5 : C.c2);
      drawHUD(ctx, pad + hudW + 10, 8, hudW, 50, 'XÁC SUẤT XUYÊN HẦM (T)',
        T_prob * 100 >= 0.01 ? (T_prob * 100).toFixed(2) + ' %' : sci(T_prob * 100, 1) + ' %',
        'Phản xạ R = ' + (R_prob * 100).toFixed(2) + ' %', current_uA > 0.05 ? C.c1 : C.mut);
      drawHUD(ctx, pad + (hudW + 10) * 2, 8, hudW, 50, 'HỆ SỐ SUY GIẢM TRONG RÀO',
        underBarrier ? 'κ = ' + (kappa * 1e-9).toFixed(2) + '×10⁹ m⁻¹' : 'Vượt rào (E ≥ V₀)',
        '2κd = ' + (2 * kappa * d_nm * 1e-9).toFixed(2) + ' · Rào mỏng 1nm → rò mạnh', C.main);

      txt(ctx, 'Sóng điện tử suy giảm hàm mũ bên trong lớp Oxide và tái sinh ở cực Máng — Tạo dòng rò lượng tử làm nhảy kim Ampe kế',
        W / 2, H - 14, C.mut, 10.5, 'center', 500);
    }
  }]
});

/* ==========================================================================
   TAB 5 — VỎ NGUYÊN TỬ 3D & NGUYÊN LÝ PAULI
   Hai chế độ mô phỏng 3D thực tế:
   1. Đám mây Orbital 3D (1s, 2s, 2p, 3s, 3d): 2.600 điểm Monte Carlo 3D thật,
      tô màu theo pha âm/dương của hàm sóng, KÉO CHUỘT ĐỂ XOAY 3D, có nút Cắt lát 3D
      để nhìn xuyên vào bên trong các mặt nút cầu của 2s và 3s!
   2. Nguyên tử 3D & Bảng điền Pauli/Hund (H → Si): Hạt nhân 3D đa nucleon, vỏ 3D
      và các thùy orbital p, electron mang vector spin ↑/↓, kèm bảng mức năng lượng
      Aufbau/Pauli/Hund sáng lên theo thời gian thực.
   ========================================================================== */
const ORB_CACHE = {};
function sampleOrbital3D(orb) {
  if (ORB_CACHE[orb]) return ORB_CACHE[orb];
  const pts = [];
  const rmax = orb === '1s' ? 5.5 : orb.startsWith('2') ? 13 : 22;
  const count = 2500;
  let maxVal = 0;

  // Hàm sóng hydro 3D thực tế ψ(x, y, z)
  function psi3D(x, y, z) {
    const r = Math.sqrt(x * x + y * y + z * z) + 1e-9;
    if (orb === '1s') return Math.exp(-r);
    if (orb === '2s') return (2 - r) * Math.exp(-r / 2);
    if (orb === '2p') return z * Math.exp(-r / 2);
    if (orb === '3s') return (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3);
    if (orb === '3d') return (3 * z * z - r * r) * Math.exp(-r / 3);
    return Math.exp(-r);
  }

  // Ước lượng cực đại |ψ|²
  for (let i = 0; i < 4000; i++) {
    const x = rnd(-rmax, rmax), y = rnd(-rmax, rmax), z = rnd(-rmax, rmax);
    const p = psi3D(x, y, z);
    if (p * p > maxVal) maxVal = p * p;
  }

  // Lấy mẫu Rejection Sampling 3D đúng theo |ψ(x,y,z)|²
  let guard = 0;
  while (pts.length < count && guard < 350000) {
    guard++;
    const x = rnd(-rmax, rmax), y = rnd(-rmax, rmax), z = rnd(-rmax, rmax);
    const r = Math.sqrt(x * x + y * y + z * z);
    if (r > rmax) continue;
    const v = psi3D(x, y, z);
    if (Math.random() * maxVal < v * v) {
      pts.push({ x: x / rmax, y: y / rmax, z: z / rmax, sign: v >= 0 ? 1 : -1, ph: rnd(0, TAU) });
    }
  }
  ORB_CACHE[orb] = pts;
  return pts;
}

LABS.push({
  id: 'atom', name: 'Vỏ e⁻ & Pauli', sec: 5,
  S: { mode: 'orb', orb: '2s', slice: 'off', Z: 14 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Kính hiển vi Lượng tử 3D — Đám mây Orbital (xoay 3D) & Cơ chế điền vỏ Pauli',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['orb', 'Đám mây 3D'], ['pauli', 'Điền vỏ Pauli (H→Si)']] },
      { k: 'orb', seg: [['1s', '1s'], ['2s', '2s (1 nút)'], ['2p', '2p (Tạ)'], ['3s', '3s (2 nút)'], ['3d', '3d (Vòng)']] },
      { k: 'slice', seg: [['off', 'Nguyên khối'], ['on', 'Cắt lát 3D']] },
      { k: 'Z', l: 'Nguyên tố Z', min: 1, max: 14, step: 1,
        f: v => 'Z=' + v + ' (' + ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si'][v - 1] + ')' }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 16, hudTop = 64;
      const chX = pad, chY = hudTop, chW = W - pad * 2, chH = H - hudTop - 32;

      // Gắn tương tác kéo chuột xoay 3D một lần duy nhất cho canvas
      if (!st.dragBound && p.cv) {
        st.dragBound = true;
        st.rotY = 0.4; st.rotX = 0.38; st.dragging = false;
        p.cv.style.cursor = 'grab';
        p.cv.addEventListener('pointerdown', e => {
          st.dragging = true; st.lx = e.clientX; st.ly = e.clientY;
          p.cv.style.cursor = 'grabbing';
        });
        window.addEventListener('pointermove', e => {
          if (!st.dragging) return;
          st.rotY += (e.clientX - st.lx) * 0.008;
          st.rotX = clamp(st.rotX + (e.clientY - st.ly) * 0.008, -1.45, 1.45);
          st.lx = e.clientX; st.ly = e.clientY;
        });
        window.addEventListener('pointerup', () => {
          st.dragging = false; if (p.cv) p.cv.style.cursor = 'grab';
        });
      }
      if (!st.dragging) st.rotY += dt * 0.35;

      drawLabChamberBg(ctx, chX, chY, chW, chH, 12);

      const cosY = Math.cos(st.rotY), sinY = Math.sin(st.rotY);
      const cosX = Math.cos(st.rotX), sinX = Math.sin(st.rotX);

      // Hàm chiếu 3D có phối cảnh
      const proj = (x, y, z, cx, cy, sc) => {
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const persp = 2.6 / (2.6 - z2 * 0.65);
        return { sx: cx + x1 * sc * persp, sy: cy - y2 * sc * persp, z: z2, s: persp };
      };

      if (S.mode === 'orb') {
        /* ================= CHẾ ĐỘ 1: ĐÁM MÂY ORBITAL 3D THỰC TẾ ================= */
        const orb = S.orb;
        const pts = sampleOrbital3D(orb);
        const cx = chX + chW * 0.5, cy = chY + chH * 0.52;
        const sc = Math.min(chW, chH) * 0.44;
        const sliced = S.slice === 'on';

        // Vẽ hệ trục tọa độ 3D x, y, z mảnh
        const o0 = proj(0, 0, 0, cx, cy, sc);
        [['x', 0.95, 0, 0], ['y', 0, 0.95, 0], ['z', 0, 0, 0.95]].forEach(([lb, ax, ay, az]) => {
          const p1 = proj(ax, ay, az, cx, cy, sc);
          ln(ctx, o0.sx, o0.sy, p1.sx, p1.sy, hexA(C.mut, 0.35), 1, [3, 3]);
          txt(ctx, lb, p1.sx + 6, p1.sy, C.mut, 10, 'left', 700, MONO);
        });

        // Vẽ 2.500 hạt mây xác suất 3D (phân biệt màu pha ψ > 0 và ψ < 0 theo màu theme)
        ctx.save();
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i];
          // Nếu bật Cắt lát 3D: cắt bỏ góc phần tư phía trước (x > 0 && z > 0) để lộ lõi nút cầu!
          if (sliced && pt.x > 0 && pt.z > 0) continue;
          const q = proj(pt.x, pt.z, pt.y, cx, cy, sc); // trục z hướng lên trên
          const depthA = clamp(0.18 + (q.z + 1) * 0.34, 0.12, 0.85);
          const twinkle = 0.80 + 0.20 * Math.sin(t * 3.5 + pt.ph);
          const rad = (1.5 + q.s * 0.85) * twinkle;
          ctx.fillStyle = pt.sign > 0
            ? hexA(C.c2, depthA * twinkle)
            : hexA(C.c4, depthA * twinkle);
          ctx.beginPath();
          ctx.arc(q.sx, q.sy, rad, 0, TAU);
          ctx.fill();
        }
        ctx.restore();

        // Hạt nhân Proton ở tâm
        glowDot(ctx, o0.sx, o0.sy, 6, C.ink, hexA(C.main, 0.9));
        txt(ctx, '+1', o0.sx, o0.sy + 0.5, C.bg, 8.5, 'center', 800, MONO);

        // Chú thích góc buồng
        txt(ctx, 'Kéo chuột để xoay 3D · Màu xanh: ψ > 0  |  Màu đỏ hồng: ψ < 0',
          chX + chW / 2, chY + chH - 14, C.mut, 10, 'center', 600);

        const meta = {
          '1s': ['n=1, l=0, m=0', '0 mặt nút', 'Đối xứng cầu đặc — Dày nhất tại bán kính Bohr a₀ = 0.53 Å'],
          '2s': ['n=2, l=0, m=0', '1 nút cầu (r=2a₀)', 'Bật "Cắt lát 3D" để thấy lõi dương nằm trong vỏ âm'],
          '2p': ['n=2, l=1, m=0', '1 mặt phẳng nút', 'Hình quả tạ 2 thùy ngược pha đối xứng qua tâm'],
          '3s': ['n=3, l=0, m=0', '2 nút cầu đồng tâm', 'Bật "Cắt lát 3D" để nhìn 3 lớp pha đan xen nhau'],
          '3d': ['n=3, l=2, m=0', '2 mặt nón nút', 'Orbital 3d_z²: Hai thùy cực và vòng xuyến xích đạo ngược pha']
        }[orb];

        const hudW = (W - pad * 2 - 20) / 3;
        drawHUD(ctx, pad, 8, hudW, 50, 'ORBITAL LƯỢNG TỬ 3D', 'Orbital ' + orb, meta[0], C.main);
        drawHUD(ctx, pad + hudW + 10, 8, hudW, 50, 'MẶT NÚT (|ψ|² = 0)', meta[1], 'Electron không bao giờ có mặt trên nút', C.c4);
        drawHUD(ctx, pad + (hudW + 10) * 2, 8, hudW, 50, 'ĐẶC ĐIỂM HÌNH HỌC',
          sliced ? 'Đang cắt lát 3D' : 'Nguyên khối 3D', meta[2].slice(0, 38), C.c1);

      } else {
        /* ================= CHẾ ĐỘ 2: NGUYÊN TỬ 3D & BẢNG ĐIỀN PAULI/HUND ================= */
        const Z = Math.round(S.Z);
        const elemNames = ['Hydro (H)','Heli (He)','Liti (Li)','Beri (Be)','Bo (B)','Cacbon (C)','Nitơ (N)','Oxi (O)','Flo (F)','Neon (Ne)','Natri (Na)','Magie (Mg)','Nhôm (Al)','SILICON (Si)'];
        const configs = [
          '1s¹','1s²','[He] 2s¹','[He] 2s²','[He] 2s² 2p¹','[He] 2s² 2p²',
          '[He] 2s² 2p³','[He] 2s² 2p⁴','[He] 2s² 2p⁵','[He] 2s² 2p⁶',
          '[Ne] 3s¹','[Ne] 3s²','[Ne] 3s² 3p¹','[Ne] 3s² 3p²'
        ];

        // Bố cục: Trái 62% là Nguyên tử 3D, Phải 38% là Bảng mức năng lượng Pauli/Hund
        const atomCX = chX + chW * 0.33, atomCY = chY + chH * 0.52;
        const maxR = Math.min(chW * 0.29, chH * 0.43);
        const maxShell = Z <= 2 ? 1 : Z <= 10 ? 2 : 3;

        // Các electron điền đúng thứ tự Aufbau + Pauli + Hund
        const TABLE = [
          { n: 1, sub: '1s', box: 0, ms: +1, inc: 0.25, az: 0.0, sp: 2.3 },
          { n: 1, sub: '1s', box: 0, ms: -1, inc: 0.25, az: Math.PI, sp: -2.2 },
          { n: 2, sub: '2s', box: 1, ms: +1, inc: -0.45, az: 0.7, sp: 1.55 },
          { n: 2, sub: '2s', box: 1, ms: -1, inc: -0.45, az: Math.PI + 0.7, sp: -1.5 },
          { n: 2, sub: '2p', box: 2, ms: +1, inc: 0.9, az: 0.2, sp: 1.65 },
          { n: 2, sub: '2p', box: 3, ms: +1, inc: -0.9, az: 2.3, sp: 1.6 },
          { n: 2, sub: '2p', box: 4, ms: +1, inc: 0.1, az: 4.4, sp: 1.58 },
          { n: 2, sub: '2p', box: 2, ms: -1, inc: 0.9, az: 3.3, sp: -1.65 },
          { n: 2, sub: '2p', box: 3, ms: -1, inc: -0.9, az: 5.4, sp: -1.6 },
          { n: 2, sub: '2p', box: 4, ms: -1, inc: 0.1, az: 1.3, sp: -1.58 },
          { n: 3, sub: '3s', box: 5, ms: +1, inc: 0.4, az: 0.4, sp: 1.05 },
          { n: 3, sub: '3s', box: 5, ms: -1, inc: 0.4, az: Math.PI + 0.4, sp: -1.0 },
          { n: 3, sub: '3p', box: 6, ms: +1, inc: -0.8, az: 1.2, sp: 1.12 },
          { n: 3, sub: '3p', box: 7, ms: +1, inc: 0.85, az: 3.7, sp: 1.08 }
        ];

        // Vẽ các lớp vỏ xác suất 3D trong mờ (n=1, 2, 3)
        for (let sh = 1; sh <= maxShell; sh++) {
          const r = maxR * (sh === 1 ? 0.38 : sh === 2 ? 0.68 : 0.98);
          const gSh = ctx.createRadialGradient(atomCX, atomCY, r * 0.72, atomCX, atomCY, r);
          gSh.addColorStop(0, 'rgba(0,0,0,0)');
          gSh.addColorStop(0.85, sh === maxShell ? hexA(C.main, 0.14) : hexA(C.mut, 0.08));
          gSh.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gSh;
          ctx.beginPath(); ctx.arc(atomCX, atomCY, r, 0, TAU); ctx.fill();

          // Đường quỹ đạo nghiêng 3D mảnh
          ctx.beginPath();
          for (let a = 0; a <= 64; a++) {
            const th = (a / 64) * TAU;
            const rNorm = r / maxR;
            const q = proj(rNorm * Math.cos(th), rNorm * Math.sin(th) * 0.35, rNorm * Math.sin(th), atomCX, atomCY, maxR);
            a === 0 ? ctx.moveTo(q.sx, q.sy) : ctx.lineTo(q.sx, q.sy);
          }
          ctx.strokeStyle = sh === maxShell ? hexA(C.main, 0.4) : hexA(C.g, 0.8);
          ctx.lineWidth = 1; ctx.stroke();
        }

        // Hạt nhân đa nucleon 3D (Proton + Neutron kết tụ)
        const nucCount = Math.min(Z, 12);
        for (let i = 0; i < nucCount; i++) {
          const phi = i * 2.39996;
          const rrN = 0.055 * Math.sqrt(i / Math.max(1, nucCount));
          const q = proj(rrN * Math.cos(phi), rrN * Math.sin(phi * 1.7), rrN * Math.sin(phi), atomCX, atomCY, maxR);
          dot(ctx, q.sx, q.sy, 4.2, i % 2 === 0 ? C.c4 : C.mut);
        }
        glowDot(ctx, atomCX, atomCY, 9, C.ink, hexA(C.c4, 0.75));
        txt(ctx, '+' + Z, atomCX, atomCY + 0.5, C.bg, 10, 'center', 800, MONO);

        // Vẽ các electron 3D có độ sâu z & vector spin ↑/↓
        const activeElecs = TABLE.slice(0, Z).map(e => {
          const rNorm = e.n === 1 ? 0.38 : e.n === 2 ? 0.68 : 0.98;
          const th = e.az + t * e.sp;
          const x = rNorm * Math.cos(th);
          const y = rNorm * Math.sin(th) * Math.sin(e.inc);
          const z = rNorm * Math.sin(th) * Math.cos(e.inc);
          const q = proj(x, y, z, atomCX, atomCY, maxR);
          return { e, q };
        }).sort((a, b) => a.q.z - b.q.z);

        activeElecs.forEach(({ e, q }) => {
          const isVal = e.n === maxShell;
          const up = e.ms > 0;
          const col = up ? C.c2 : C.c5;
          glowDot(ctx, q.sx, q.sy, (isVal ? 4.8 : 3.8) * q.s, C.ink, hexA(col, 0.8));
          dot(ctx, q.sx, q.sy, (isVal ? 5.2 : 4) * q.s, col);
          txt(ctx, up ? '↑' : '↓', q.sx, q.sy + 0.5, C.bg, 9.5 * q.s, 'center', 800);
        });

        /* ---- BẢNG MỨC NĂNG LƯỢNG & Ô LƯỢNG TỬ PAULI / HUND BÊN PHẢI ---- */
        const rkX = chX + chW * 0.64, rkW = chW * 0.33;
        const rkY = chY + 14, rkH = chH - 28;
        rr(ctx, rkX, rkY, rkW, rkH, 6);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        txt(ctx, 'GIẢN ĐỒ ĐIỀN PAULI & HUND', rkX + rkW / 2, rkY + 16, C.mut, 10, 'center', 700, MONO);

        const rows = [
          { lbl: '3p', boxes: [6, 7, 8], y: rkY + rkH * 0.22 },
          { lbl: '3s', boxes: [5], y: rkY + rkH * 0.37 },
          { lbl: '2p', boxes: [2, 3, 4], y: rkY + rkH * 0.54 },
          { lbl: '2s', boxes: [1], y: rkY + rkH * 0.69 },
          { lbl: '1s', boxes: [0], y: rkY + rkH * 0.84 }
        ];
        const filled = TABLE.slice(0, Z);
        const bw = clamp((rkW - 56) / 3, 24, 38), bh = 26;

        rows.forEach(row => {
          txt(ctx, row.lbl, rkX + 16, row.y, C.ink, 11.5, 'left', 700, MONO);
          row.boxes.forEach((bIdx, j) => {
            const bx = rkX + 44 + j * (bw + 6), by = row.y - bh / 2;
            const inBox = filled.filter(e => e.box === bIdx);
            rr(ctx, bx, by, bw, bh, 4);
            ctx.fillStyle = inBox.length === 2 ? hexA(C.c1, 0.14) : inBox.length === 1 ? hexA(C.c2, 0.14) : C.card;
            ctx.fill();
            ctx.strokeStyle = inBox.length === 2 ? C.c1 : inBox.length === 1 ? C.c2 : C.g;
            ctx.lineWidth = 1.2; ctx.stroke();

            inBox.forEach(e => {
              const sx = bx + (e.ms > 0 ? bw * 0.32 : bw * 0.68);
              txt(ctx, e.ms > 0 ? '↑' : '↓', sx, row.y, e.ms > 0 ? C.c2 : C.c5, 14, 'center', 800);
            });
          });
        });

        // HUD phía trên
        const hudW = (W - pad * 2 - 20) / 3;
        drawHUD(ctx, pad, 8, hudW, 50, 'NGUYÊN TỐ HIỆN TẠI',
          elemNames[Z - 1], 'Cấu hình: ' + configs[Z - 1], Z === 14 ? C.c1 : C.main);
        const valCount = Z <= 2 ? Z : Z <= 10 ? Z - 2 : Z - 10;
        drawHUD(ctx, pad + hudW + 10, 8, hudW, 50, 'ELECTRON HÓA TRỊ',
          valCount + ' e⁻ (Vỏ n = ' + maxShell + ')',
          Z === 14 ? 'Bán dẫn Si: 4 liên kết cộng hóa trị' : (Z === 2 || Z === 10 ? 'Vỏ kín bão hòa (Khí hiếm trơ)' : 'Quyết định tính chất hóa học & dẫn điện'),
          Z === 14 ? C.c1 : C.main);
        drawHUD(ctx, pad + (hudW + 10) * 2, 8, hudW, 50, 'NGUYÊN LÝ PAULI & HUND',
          'Tối đa 2 e⁻ / ô (↑↓)', 'Mỗi trạng thái (n,l,m,s) là duy nhất', C.c5);
      }

      txt(ctx, 'Chuyển chế độ "Đám mây 3D" để xoay & cắt lát orbital · Chuyển "Điền vỏ Pauli" để theo dõi H → Silicon (Z=14)',
        W / 2, H - 14, C.mut, 10.5, 'center', 500);
    }
  }]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM (Log intro + react chi tiết cho từng tab)
   Loại dòng: i = nguyên lý · w = cơ chế thực tế · v = số liệu đo đạc
   ========================================================================== */
const LD = {};

LD.free = {
  intro: [
    ['i', 'Buồng chân không (V = 0): Electron rời súng phóng tạo thành trường sóng vật chất de Broglie lan truyền tự do.'],
    ['w', 'Màu sắc dải sáng biểu diễn góc pha phức e^{i(kx−ωt)} đang tiến về phía trước (k > 0) hoặc lùi lại (k < 0).'],
    ['w', 'Màn huỳnh quang bên dưới tích lũy các điểm chớp sáng rời rạc: với sóng phẳng đơn sắc, xác suất |ψ|² phẳng đều khắp nơi.'],
    ['i', 'Chuyển sang "Bó sóng thực (Gauss)" để thấy electron định xứ thành bó sóng bay đi và tự dãn rộng do tán sắc lượng tử.'],
    ['v', 'Nhấn "Đo vị trí (Collapse)" để quan sát phép đo làm sụp đổ hàm sóng thành một hạt điểm xác định.']
  ],
  react(S, k, P, say) {
    const kVal = Math.abs(S.k) * 1e8;
    const E = kVal !== 0 ? (HBAR * HBAR * kVal * kVal / (2 * ME * EV)) : 0;
    const lam = S.k !== 0 ? (TAU / kVal * 1e10).toFixed(2) : '∞';
    if (k === 'waveType') {
      say('i', S.waveType === 'packet'
        ? 'Chế độ Bó sóng Gauss: Tổng hợp nhiều sóng phẳng giúp định xứ electron (Δx hữu hạn), nhưng bó sóng sẽ dãn rộng dần theo thời gian.'
        : 'Chế độ Sóng phẳng đơn sắc: Động lượng p = ħk chính xác tuyệt đối (Δp = 0) → Vị trí bất định hoàn toàn trên toàn bộ buồng!');
    } else if (k === 'k' || k === 'pres') {
      say('v', `k = ${S.k > 0 ? '+' : ''}${S.k.toFixed(1)}×10⁸ m⁻¹ → λ = ${lam} Å, Động năng E = ${E.toFixed(3)} eV.`);
      if (S.k === 0) say('w', 'k = 0: Sóng lặng hoàn toàn, p = 0, E = 0.');
    }
  }
};

LD.well = {
  intro: [
    ['i', 'Hộp lượng tử bán dẫn (GaAs kẹp giữa hai khối AlGaAs): Electron bị giam giữ giữa hai vách thế năng cực cao.'],
    ['w', 'Đám mây sáng thể hiện mật độ xác suất |ψ_n(x)|². Tại các mặt nút (chấm đỏ), xác suất tìm thấy electron bằng 0 tuyệt đối.'],
    ['w', 'Đường sóng xanh/tím dao động quay trong mặt phẳng phức tạo thành sóng dừng lượng tử với tần số tỉ lệ theo n².'],
    ['i', 'Hiệu ứng phát xạ lượng tử: Khi bạn kéo n từ mức cao xuống mức thấp, electron lập tức phóng ra một PHOTON mang đúng màu quang phổ của ΔE!'],
    ['v', 'Thử thu hẹp giếng a xuống 8–12 Å rồi kéo n từ 3 xuống 2 để thấy photon chuyển sang màu xanh/tím (năng lượng cao)!']
  ],
  react(S, k, P, say) {
    const n = Math.round(S.n), a_A = S.a;
    const a_m = a_A * 1e-10;
    const E1 = (Math.PI * Math.PI * HBAR * HBAR / (2 * ME * a_m * a_m)) / EV;
    const En = n * n * E1;
    if (k === 'n') {
      say('v', `Mức n = ${n}: E_${n} = ${En.toFixed(3)} eV = ${n * n}×E₁ (${n} bụng sóng, ${n - 1} mặt nút).`);
      if (P.n && P.n !== n) {
        const dE = Math.abs((P.n * P.n - n * n) * E1);
        const wl = (H_PLANCK * C_LIGHT / (dE * EV)) * 1e9;
        say('w', n < P.n
          ? `Nhảy xuống (${P.n} → ${n}): Phát xạ photon năng lượng ΔE = ${dE.toFixed(2)} eV, bước sóng λ ≈ ${wl.toFixed(0)} nm!`
          : `Nhảy lên (${P.n} → ${n}): Hấp thụ photon năng lượng ΔE = ${dE.toFixed(2)} eV để lên mức kích thích.`);
      }
    } else if (k === 'a') {
      say('v', `Bề rộng giếng a = ${a_A} Å (${(a_A / 10).toFixed(1)} nm) → E₁ = ${E1.toFixed(3)} eV (tỉ lệ nghịch với a²).`);
      say('w', a_A <= 16 ? 'Giam giữ lượng tử mạnh (Quantum Confinement): Khoảng cách mức năng lượng dãn rất rộng, photon phát ra dịch về phía xanh/UV.'
                         : 'Giếng rộng hơn: Các mức năng lượng xít gần nhau dần về giới hạn cổ điển.');
    }
  }
};

LD.step = {
  intro: [
    ['i', 'Bộ giải số 1D-TDSE thực tế: Giải trực tiếp phương trình Schrödinger phụ thuộc thời gian tại mặt phân cách bậc thế V₀.'],
    ['w', 'Khi E < V₀: Bó sóng đập vào vách tạo các gợn giao thoa dữ dội và THẤM SÂU vào lòng vùng cấm (màu cam) trước khi bật ngược lại!'],
    ['w', 'Khi E ≥ V₀: Bó sóng tự tách thành 2 phần — một phần vẫn bị phản xạ ngược lại (đặc trưng sóng lượng tử) và phần còn lại truyền qua chậm hơn.'],
    ['v', 'Tăng E tiến sát V₀ (nhưng vẫn nhỏ hơn V₀) để thấy độ sâu đâm xuyên δ = 1/κ tăng vọt và sóng lún sâu vào bức tường!']
  ],
  react(S, k, P, say) {
    const E = S.E, V0 = S.V0;
    if (E < V0) {
      const kappa = Math.sqrt(2 * ME * (V0 - E) * EV) / HBAR;
      const delta_nm = (1 / kappa * 1e9).toFixed(2);
      say('v', `E = ${E.toFixed(2)} eV < V₀ = ${V0.toFixed(1)} eV → Độ sâu đâm xuyên δ = ${delta_nm} nm (κ = ${(kappa * 1e-9).toFixed(2)}×10⁹ m⁻¹).`);
      say('w', 'Quan sát phần sóng màu cam thấm vào Vùng II rồi rút ra: đó là sóng tắt dần (evanescent wave) có thật trong tự nhiên!');
    } else {
      say('v', `E = ${E.toFixed(2)} eV ≥ V₀ = ${V0.toFixed(1)} eV: Hạt vượt bậc thế.`);
      say('w', 'Ngay cả khi E > V₀, một phần bó sóng vẫn bị phản xạ tại ranh giới x = 0 — điều cơ học cổ điển không thể giải thích.');
    }
  }
};

LD.tunnel = {
  intro: [
    ['i', 'Mặt cắt Transistor Nano (Source – Oxide – Drain): Mô phỏng dòng rò xuyên hầm lượng tử bằng bộ giải 1D-TDSE kết hợp Ampe kế thực.'],
    ['w', 'Lớp cách điện Oxide hiển thị đúng số lớp nguyên tử (~0.28 nm/lớp). Khi d ≈ 1 nm, rào chỉ dày khoảng 3–4 lớp nguyên tử!'],
    ['w', 'Sóng electron suy giảm theo hàm mũ bên trong lớp Oxide nhưng chưa kịp về 0 đã chạm tới cực Máng → Tái sinh thành sóng xanh lá và tạo dòng rò!'],
    ['i', 'Thử đổi vật liệu sang GaAs (m* = 0.067 m₀): Hạt nhẹ hơn Silicon 14 lần khiến xác suất xuyên hầm và kim Ampe kế vọt lên dữ dội!'],
    ['v', 'Kéo mỏng độ dày rào d xuống dưới 0.8 nm để thấy hiện tượng rò điện cổng — giới hạn vật lý của định luật Moore.']
  ],
  react(S, k, P, say) {
    const mEff = S.mat === 'gaas' ? 0.067 * ME : 0.98 * ME;
    const diffEV = Math.max(0, S.V0 - S.E);
    const kappa = Math.sqrt(2 * mEff * diffEV * EV) / HBAR;
    const kd = kappa * S.d * 1e-9;
    const T = S.E < S.V0 ? 1 / (1 + ((S.V0 * S.V0) / (4 * S.E * (S.V0 - S.E))) * Math.pow(kd > 40 ? Math.exp(kd) * 0.5 : Math.sinh(kd), 2)) : 1;
    say('v', `d = ${S.d.toFixed(1)} nm, E = ${S.E.toFixed(2)} eV, V₀ = ${S.V0.toFixed(1)} eV → Xác suất xuyên hầm T ≈ ${T * 100 >= 0.01 ? (T * 100).toFixed(2) + '%' : sci(T * 100, 1) + '%'}.`);
    if (k === 'mat') {
      say('w', S.mat === 'gaas'
        ? 'GaAs (m* = 0.067 m₀): Khối lượng hiệu dụng cực nhỏ làm giảm hệ số suy giảm κ → Xuyên hầm mạnh gấp nhiều bậc độ lớn so với Silicon!'
        : 'Silicon (m* = 0.98 m₀): Electron nặng hơn, suy giảm nhanh trong lớp Oxide nên giữ cách điện tốt hơn.');
    } else if (k === 'd') {
      say('w', S.d <= 0.9
        ? 'Cảnh báo rò cổng (d ≤ 0.9 nm): Chỉ còn 2–3 lớp nguyên tử cách điện, transistor bị rò dòng mạnh và nóng lên dù đã ngắt!'
        : 'Rào dày hơn làm xác suất T giảm theo hàm mũ e^{−2κd}, kim Ampe kế sụt nhanh về 0.');
    }
  }
};

LD.atom = {
  intro: [
    ['i', 'Kính hiển vi Lượng tử 3D: Mô phỏng 2.500 điểm mật độ xác suất |ψ(r,θ,φ)|² trong không gian 3 chiều thực tế.'],
    ['w', 'Dùng chuột kéo trực tiếp trên khung thí nghiệm để xoay orbital 3D theo mọi góc nhìn.'],
    ['w', 'Hai màu tương phản biểu thị dấu pha hàm sóng (ψ > 0 và ψ < 0). Ranh giới giữa hai màu chính là mặt nút nơi |ψ|² = 0.'],
    ['i', 'Chọn orbital 2s hoặc 3s rồi nhấn "Cắt lát 3D" để bổ đôi đám mây và nhìn thấy các lớp vỏ nút cầu đồng tâm bên trong.'],
    ['v', 'Chuyển sang chế độ "Điền vỏ Pauli (H→Si)" để xem nguyên tử 3D cùng bảng điền spin ↑/↓ từ Hydro tới bán dẫn Silicon (Z=14).']
  ],
  react(S, k, P, say) {
    if (S.mode === 'orb') {
      if (k === 'slice') {
        say('w', S.slice === 'on'
          ? 'Đã bật Cắt lát 3D: Quan sát rõ lõi trung tâm và các lớp vỏ ngược pha ngăn cách bởi mặt nút cầu tối!'
          : 'Đã khôi phục đám mây 3D nguyên khối.');
      } else {
        const desc = {
          '1s': 'Orbital 1s: Không có nút, đối xứng cầu hoàn toàn quanh hạt nhân.',
          '2s': 'Orbital 2s: Có 1 mặt nút cầu tại r = 2a₀ ngăn cách lõi dương (xanh) và vỏ âm (hồng).',
          '2p': 'Orbital 2p: Hai thùy hình quả tạ ngược pha, mặt phẳng nút đi ngang qua hạt nhân.',
          '3s': 'Orbital 3s: Có 2 mặt nút cầu đồng tâm (3 lớp pha Xanh–Hồng–Xanh).',
          '3d': 'Orbital 3d_z²: Hai thùy cực dọc trục z kèm vòng xuyến xích đạo ngược pha đặc trưng.'
        };
        say('v', desc[S.orb] || '');
      }
    } else {
      const Z = Math.round(S.Z);
      const names = ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si'];
      say('v', `Nguyên tố Z = ${Z} (${names[Z - 1]}): Đã cập nhật mô hình 3D và bảng ô lượng tử.`);
      if (Z === 3) say('i', 'Liti (Z=3): Ô 1s đã kín 2 spin ngược nhau (↑↓) → Nguyên lý Pauli đẩy electron thứ 3 lên lớp 2s!');
      else if (Z === 7) say('w', 'Nitơ (Z=7): Quy tắc Hund — 3 electron phân lớp 2p đứng riêng vào 3 ô với spin song song (↑ ↑ ↑).');
      else if (Z === 14) say('i', 'SILICON (Z=14): Có đúng 4 electron hóa trị ở lớp n=3 (3s² 3p²), nền tảng của toàn bộ công nghiệp vi mạch bán dẫn!');
    }
  }
};

LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (Tự chèn CSS + HTML popup, đồng bộ tuyệt đối với hệ thống)
   ========================================================================== */
const CSS = `
#lab3{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab3[hidden]{display:none}
#lab3 *{box-sizing:border-box}
.lb3-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
.lb3-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
.lb3-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
.lb3-ic{color:var(--main);display:flex}
.lb3-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
.lb3-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
.lb3-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
.lb3-tab:hover{color:var(--ink);background:var(--tint)}
.lb3-tab.on{background:var(--main);color:var(--bg);font-weight:700}
.lb3-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
.lb3-x:hover{color:var(--err);background:var(--tint)}
.lb3-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
.lb3-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
.lb3-p.glow{animation:lb3glow 1.4s ease-out}
@keyframes lb3glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
.lb3-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
.lb3-cv{flex:1;min-height:0;position:relative}
.lb3-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.lb3-c{display:flex;flex-wrap:wrap;gap:6px 12px;padding:5px 10px 8px;flex:none;align-items:center}
.lb3-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb3-k input[type=range]{width:clamp(68px,7.5vw,112px);margin:0;accent-color:var(--main)}
.lb3-k output{color:var(--ink);font-weight:700;min-width:3.2em}
.lb3-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb3-seg button,.lb3-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer;transition:color .15s,background .15s}
.lb3-btn{background:var(--tint);color:var(--ink)}
.lb3-seg button:hover,.lb3-btn:hover{color:var(--ink);background:var(--g)}
.lb3-seg button.on{background:var(--main);color:var(--bg)}
.lb3-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
.lb3-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb3in .4s ease-out;overflow-wrap:anywhere}
.lb3-ln::before{position:absolute;left:0;font-weight:700}
.lb3-ln.i{color:var(--ink)}.lb3-ln.i::before{content:'›';color:var(--c5)}
.lb3-ln.w{color:var(--ink)}.lb3-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
.lb3-ln.v{color:var(--main)}.lb3-ln.v::before{content:'=';color:var(--main)}
@keyframes lb3in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab3-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab3-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab3-m:hover,.lab3-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb3-win{width:100vw;height:100dvh;border-radius:0}.lb3-b{overflow:auto;display:flex;flex-direction:column}.lb3-p{min-height:300px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'free';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab3'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 3');
  root.innerHTML = '<div class="lb3-win"><div class="lb3-h"><span class="lb3-ic">' + FLASK + '</span><span class="lb3-bd">Phòng thí nghiệm · Buổi 3</span><nav class="lb3-tabs"></nav><button class="lb3-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb3-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb3-b'); tabsEl = root.querySelector('.lb3-tabs');
  LABS.forEach(l => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lb3-tab'; b.dataset.id = l.id;
    b.textContent = l.sec + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b);
  });
  root.querySelector('.lb3-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) {
      const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty &&
          window.LabB3 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden &&
          (document.getElementById('tb-badge') || {}).textContent === 'Buổi 3') {
        e.preventDefault(); open();
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
}

const say = (kind, text) => {
  if (!logEl) return;
  const d = document.createElement('div'); d.className = 'lb3-ln ' + kind; d.textContent = text;
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
    w.className = 'lb3-btn'; w.textContent = c.btn; w.setAttribute('role', 'button'); w.tabIndex = 0;
    w.onclick = () => c.fn(p); return w;
  }
  if (c.seg) {
    w.className = 'lb3-seg';
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
  w.className = 'lb3-k';
  const lab = document.createElement('span'); lab.textContent = c.l;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step;
  const out = document.createElement('output'); w.append(lab, inp, out);
  const sync = () => { inp.value = c.log ? Math.log10(S[c.k]) : S[c.k]; out.textContent = c.f(S[c.k]); };
  inp.oninput = () => { S[c.k] = c.log ? Math.pow(10, +inp.value) : +inp.value; out.textContent = c.f(S[c.k]); touch(); };
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
  tab.panels.concat([{ title: 'Nhật ký thí nghiệm', area: 'l', log: true }]).forEach((spec) => {
    const el = document.createElement('div'); el.className = 'lb3-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb3-t"></div><div class="lb3-cv"><canvas></canvas></div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) {
      const lg = document.createElement('div'); lg.className = 'lb3-log'; lg.setAttribute('aria-live', 'polite');
      el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el);
      curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 220 + j * 850)));
      return;
    }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb3-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.ctrls && spec.ctrls.length) {
      const cb = document.createElement('div'); cb.className = 'lb3-c';
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
    catch (err) { console.error('LabB3 render error:', err); }
    ctx.restore();
  });
  raf = requestAnimationFrame(loop);
}

function open(id, panelIdx) {
  ensureDom(); readColors(); opener = document.activeElement;
  root.hidden = false; show(id || lastTab, panelIdx);
  last = performance.now(); if (!raf) raf = requestAnimationFrame(loop);
  root.querySelector('.lb3-x').focus({ preventScroll: true });
  const b = document.getElementById('tb-lab'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
}
function close() {
  if (!root || root.hidden) return;
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  const b = document.getElementById('tb-lab'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- Dấu hiệu bình thí nghiệm trong bài học Buổi 3 ---------- */
const H3MAP = [
  [/^1\.1/, 'free', 0], [/^1\.2/, 'free', 0],
  [/^2\.1/, 'well', 0], [/^2\.2/, 'well', 0],
  [/^3\.1/, 'step', 0], [/^3\.2/, 'step', 0],
  [/^3\.3/, 'tunnel', 0], [/^3\.4/, 'tunnel', 0],
  [/^4\.[1234567]/, 'atom', 0]
];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab3-m')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab3-m'; b.innerHTML = FLASK;
  b.setAttribute('aria-label', 'Xem thí nghiệm: ' + title); b.title = 'Xem thí nghiệm';
  b.onclick = e => { e.preventDefault(); e.stopPropagation(); open(id, pi); }; h.appendChild(b);
}
function markLesson(rootEl) {
  if (!rootEl) return;
  rootEl.querySelectorAll('h2').forEach(h => {
    const m = /^\s*(\d)\./.exec(h.textContent); if (!m) return;
    const l = LABS.find(x => x.sec === +m[1]); if (l) addMark(h, l.id, null, l.name);
  });
  rootEl.querySelectorAll('h3').forEach(h => {
    const t = h.textContent.trim();
    const r = H3MAP.find(x => x[0].test(t)); if (r) addMark(h, r[1], r[2], t);
  });
}

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 3') {
  markLesson(document.getElementById('app-content'));
}

window.LabB3 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
