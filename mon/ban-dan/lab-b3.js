/* ==========================================================================
   lab-b3.js — PHÒNG THÍ NGHIỆM VẬT LÝ LƯỢNG TỬ BUỔI 3 (Bản Đầy Đủ & Tự Chứa)
   - Tự chứa hoàn toàn: tự chèn CSS + HTML popup, đồng bộ bảng màu & font trang.
   - Tích hợp bộ giải 1D-TDSE (Visscher ổn định tuyệt đối), 20 SVG orbital & 3D.
   - 8 tab phủ trọn lý thuyết & 5 bài tập Buổi 3:
       1. Hạt tự do: Buồng chân không + Ống phóng e⁻ + Sóng phẳng (Câu 1a, 1b)
       2. Giếng vô hạn: Hộp lượng tử 1D + Sóng dừng + Phát/hấp thụ Photon (Câu 2)
       3. Bậc thế năng: Bộ giải 1D-TDSE + Đâm xuyên hàm mũ e^(−2k₂x) (Câu 3)
       4. Xuyên hầm: Rào thế nano + TDSE + Ampe kế dòng rò GaAs vs Si (Câu 4)
       5. Giếng bất đối xứng: Vùng I (V₀) – II (0) – III (∞), tan(k₂a) = −k₂/k₁ (Câu 5)
       6. Orbital & (n,l,m,s): 20 SVG #o100..#o433 + Soi mặt nút + Vector L, S & Zeeman
       7. Stern–Gerlach (Spin): Lò Ag (l=0), nam châm N–S không đều, 2 vết lượng tử
       8. Vỏ e⁻ & Pauli: Đám mây Orbital 3D xoay + Cấu hình nguyên tử Pauli (Z=1..18)
   - API: LabB3.open(tabId?, panelIndex?)  LabB3.close()  LabB3.mark(root)  LabB3.tabs()
   ========================================================================== */
(function () {
'use strict';

/* ---------- Hằng số vật lý & tiện ích toán học ---------- */
const TAU = Math.PI * 2;
const HBAR = 1.0545718e-34; // J·s
const ME = 9.1093837e-31;   // kg
const EV = 1.6021766e-19;   // J

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
function drawLabChamberBg(ctx, x, y, w, h, r = 8) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.g;
  ctx.lineWidth = 1;
  ctx.stroke();

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

/* ==========================================================================
   BỘ GIẢI PHƯƠNG TRÌNH SCHRÖDINGER PHỤ THUỘC THỜI GIAN 1D (VISSCHER LEAPFROG)
   Ổn định bảo toàn chuẩn ∫|ψ|²dx = 1, tự chọn bước thời gian theo điều kiện CFL.
   ========================================================================== */
function createTDSE(N, x0, k0, sigma, Vfn, mSim = 1.0) {
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  const V = new Float64Array(N);
  let maxV = 0;
  for (let i = 0; i < N; i++) {
    V[i] = Vfn(i);
    if (V[i] > maxV) maxV = V[i];
  }
  // Bước thời gian đảm bảo điều kiện ổn định Visscher: dt * (2/mSim + maxV) < 2
  const dt = Math.min(0.16, 0.82 / (2 / mSim + maxV));
  const halfKin = 0.5 / mSim;

  // Khởi tạo bó sóng Gauss ψ(x, 0) = exp(-(x-x0)² / 2σ²) · exp(i k0 x)
  let norm = 0;
  for (let i = 1; i < N - 1; i++) {
    const dx = i - x0;
    const env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
    re[i] = env * Math.cos(k0 * dx);
    im[i] = env * Math.sin(k0 * dx);
    norm += re[i] * re[i] + im[i] * im[i];
  }
  const invN = 1 / Math.sqrt(norm || 1);
  for (let i = 0; i < N; i++) { re[i] *= invN; im[i] *= invN; }

  // Lùi phần ảo nửa bước dt/2 để bắt đầu vòng lặp nhảy cóc (staggered leapfrog)
  const imPrev = new Float64Array(N);
  for (let i = 1; i < N - 1; i++) {
    const Hre = -halfKin * (re[i + 1] - 2 * re[i] + re[i - 1]) + V[i] * re[i];
    imPrev[i] = im[i] + 0.5 * dt * Hre;
  }
  im.set(imPrev);

  return {
    N, re, im, V, dt, halfKin, steps: 0,
    step(nSub = 6) {
      for (let s = 0; s < nSub; s++) {
        for (let i = 1; i < N - 1; i++) {
          const Him = -halfKin * (im[i + 1] - 2 * im[i] + im[i - 1]) + V[i] * im[i];
          re[i] += dt * Him;
        }
        for (let i = 1; i < N - 1; i++) {
          const Hre = -halfKin * (re[i + 1] - 2 * re[i] + re[i - 1]) + V[i] * re[i];
          im[i] -= dt * Hre;
        }
        // Giảm chấn nhẹ ở hai mép buồng để sóng phản xạ không dội ngược gây nhiễu
        for (let b = 1; b <= 10; b++) {
          const damp = 1 - 0.035 * Math.pow((11 - b) / 10, 2);
          re[b] *= damp; im[b] *= damp;
          re[N - 1 - b] *= damp; im[N - 1 - b] *= damp;
        }
        this.steps++;
      }
    }
  };
}

/* ==========================================================================
   TIỆN ÍCH TÁI SỬ DỤNG 20 SVG ORBITAL (#o100..#o433) & HÀM SÓNG HYDRO CHÍNH XÁC
   ========================================================================== */
function assocLaguerre(k, alpha, x) {
  if (k <= 0) return 1;
  let L0 = 1, L1 = 1 + alpha - x;
  if (k === 1) return L1;
  for (let i = 2; i <= k; i++) {
    const L2 = ((2 * i - 1 + alpha - x) * L1 - (i - 1 + alpha) * L0) / i;
    L0 = L1; L1 = L2;
  }
  return L1;
}

function assocLegendre(l, mAbs, u) {
  let pmm = Math.pow(Math.max(0, 1 - u * u), mAbs * 0.5);
  if (l === mAbs) return pmm;
  let pmmp1 = u * (2 * mAbs + 1) * pmm;
  if (l === mAbs + 1) return pmmp1;
  let pll = pmmp1;
  for (let k = mAbs + 2; k <= l; k++) {
    pll = ((2 * k - 1) * u * pmmp1 - (k + mAbs - 1) * pmm) / (k - mAbs);
    pmm = pmmp1; pmmp1 = pll;
  }
  return pll;
}

function hydroProbXZ(n, l, m, x, z) {
  const r = Math.hypot(x, z);
  const cosT = r > 1e-6 ? z / r : 1;
  const rho = (2 * r) / n;
  const radial = Math.pow(rho, l) * Math.exp(-rho * 0.5) * assocLaguerre(n - l - 1, 2 * l + 1, rho);
  const angular = assocLegendre(l, Math.abs(m), cosT);
  const psi = radial * angular;
  return psi * psi;
}

const ORB_RMAX_A0 = { 1: 6.2, 2: 12.2, 3: 25.8, 4: 44.2 };

function getRadialNodesA0(n, l) {
  const count = n - l - 1;
  if (count <= 0) return [];
  const roots = [];
  const rLimit = (ORB_RMAX_A0[n] || 26) * 0.95;
  const steps = 600;
  let prevR = 0.02;
  let prevV = assocLaguerre(count, 2 * l + 1, (2 * prevR) / n);
  for (let i = 1; i <= steps; i++) {
    const r = (i / steps) * rLimit;
    const v = assocLaguerre(count, 2 * l + 1, (2 * r) / n);
    if (prevV * v <= 0) {
      let lo = prevR, hi = r, fLo = prevV;
      for (let it = 0; it < 20; it++) {
        const mid = (lo + hi) * 0.5;
        const fm = assocLaguerre(count, 2 * l + 1, (2 * mid) / n);
        if (fLo * fm <= 0) hi = mid; else { lo = mid; fLo = fm; }
      }
      roots.push((lo + hi) * 0.5);
    }
    prevR = r; prevV = v;
  }
  return roots;
}

function getAngularNodeAngles(l, mAbs) {
  if (l === 0) return [];
  const angs = [];
  if (mAbs > 0) angs.push(0);
  if ((l - mAbs) % 2 === 1) angs.push(Math.PI * 0.5);
  if (l === 2 && mAbs === 0) angs.push(Math.acos(Math.sqrt(1 / 3)));
  if (l === 3 && mAbs === 0) angs.push(Math.acos(Math.sqrt(3 / 5)));
  if (l === 3 && mAbs === 1) angs.push(Math.acos(Math.sqrt(1 / 5)));
  return angs;
}

const ORB_SVG_IMG = {};
function getOrbitalSVGImage(n, l, m) {
  const id = 'o' + n + l + Math.abs(m);
  if (ORB_SVG_IMG[id]) return ORB_SVG_IMG[id];

  let sym = document.getElementById(id);
  if (!sym) {
    const tpl = document.getElementById('tpl-buoi-3');
    if (tpl && tpl.content) sym = tpl.content.getElementById(id);
  }

  if (sym) {
    const svgStr = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="384" height="384">' + sym.innerHTML + '</svg>';
    const img = new Image();
    const rec = { img, ready: false, fromPageSVG: true };
    img.onload = () => { rec.ready = true; curPanels.forEach(q => q.dirty = true); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    ORB_SVG_IMG[id] = rec;
    return rec;
  }

  // Fallback dựng bitmap bảng màu inferno nếu không tìm thấy symbol trong DOM
  const off = document.createElement('canvas');
  off.width = off.height = 120;
  const octx = off.getContext('2d');
  const rMax = ORB_RMAX_A0[n] || 26;
  const vals = new Float32Array(120 * 120);
  let maxP = 1e-12;
  for (let py = 0; py < 120; py++) {
    const z = (0.5 - (py + 0.5) / 120) * 2 * rMax;
    for (let px = 0; px < 120; px++) {
      const x = ((px + 0.5) / 120 - 0.5) * 2 * rMax;
      const pr = hydroProbXZ(n, l, m, x, z);
      vals[py * 120 + px] = pr;
      if (pr > maxP) maxP = pr;
    }
  }
  const pal = [[6,3,12],[58,14,92],[122,35,128],[193,58,110],[238,106,53],[251,171,48],[255,241,184]];
  const imgData = octx.createImageData(120, 120);
  for (let i = 0; i < vals.length; i++) {
    const lv = vals[i] > 0 ? clamp((Math.log10(vals[i] / maxP) + 4.2) / 4.2, 0, 1) : 0;
    const bi = clamp(Math.floor(lv * (pal.length - 1)), 0, pal.length - 1);
    imgData.data[i * 4] = pal[bi][0];
    imgData.data[i * 4 + 1] = pal[bi][1];
    imgData.data[i * 4 + 2] = pal[bi][2];
    imgData.data[i * 4 + 3] = 255;
  }
  octx.putImageData(imgData, 0, 0);
  const rec = { img: off, ready: true, fromPageSVG: false };
  ORB_SVG_IMG[id] = rec;
  return rec;
}

const LABS = [];

/* ==========================================================================
   TAB 1 — HẠT TỰ DO (V = 0): BUỒNG CHÂN KHÔNG & SÓNG PHẲNG CHẠY (Câu 1a, 1b)
   ========================================================================== */
LABS.push({
  id: 'free', name: 'Hạt tự do', no: '1', sec: 1,
  S: { k: 8.0, waveType: 'plane' },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng chân không (V = 0) — Sóng phẳng Ψ(x,t) = A·e^{j(kx−ωt)} & Hạt tự do',
    area: 'a', anim: true,
    ctrls: [
      { k: 'k', l: 'Số sóng k', min: -20, max: 20, step: 0.5, f: v => (v > 0 ? '+' : '') + v.toFixed(1) + '×10⁸ m⁻¹' },
      { k: 'waveType', seg: [['plane', 'Sóng phẳng'], ['packet', 'Bó sóng']] },
      { btn: 'Câu 1a (+8×10⁸)', fn: p => { p.S.k = 8.0; p.syncCtrls(); queueReact(p.tab, 'k'); } },
      { btn: 'Câu 1b (−15×10⁸)', fn: p => { p.S.k = -15.0; p.syncCtrls(); queueReact(p.tab, 'k'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawLabChamberBg(ctx, chX, chY, chW, chH, 10);

      // Đại lượng vật lý thực khớp Câu 1a & 1b
      const kSI = S.k * 1e8; // m^-1
      const kAbs = Math.abs(kSI);
      const lam_nm = kAbs > 1e-3 ? (TAU / kAbs) * 1e9 : Infinity;
      const pSI = HBAR * kSI;
      const E_eV = ((pSI * pSI) / (2 * ME)) / EV;
      const vp_kms = 10.0 * (kSI >= 0 ? 1 : -1); // Câu 1a & 1b đều cho |ω/k| = 10⁴ m/s = 10 km/s

      const tubeX = chX + 26, tubeW = chW - 52;
      const tubeY = chY + 42, tubeH = chH - 64;
      const midY = tubeY + tubeH * 0.5;
      const dir = S.k === 0 ? 0 : S.k > 0 ? 1 : -1;
      const col = dir >= 0 ? C.c2 : C.c4;

      // Vỏ ống chân không
      rr(ctx, tubeX, tubeY, tubeW, tubeH, 10);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.4; ctx.stroke();

      // Hai đầu phát/thu ở trái & phải
      rr(ctx, chX + 10, midY - 22, 16, 44, 4);
      ctx.fillStyle = dir >= 0 ? hexA(C.c2, 0.35) : C.sub; ctx.fill();
      rr(ctx, chX + chW - 26, midY - 22, 16, 44, 4);
      ctx.fillStyle = dir < 0 ? hexA(C.c4, 0.35) : C.sub; ctx.fill();

      ctx.save();
      rr(ctx, tubeX + 1, tubeY + 1, tubeW - 2, tubeH - 2, 9);
      ctx.clip();

      // Mặt băng phẳng V = 0
      ln(ctx, tubeX, midY, tubeX + tubeW, midY, hexA(C.g, 0.9), 1, [4, 4]);

      const amp = tubeH * 0.34;
      const kPx = S.k * 0.011; // tỉ lệ trực quan số đỉnh sóng theo k
      const omegaSim = Math.abs(S.k) * 0.45 + 1.5;

      if (!st.xPkt) st.xPkt = 0.5;
      st.xPkt += dir * (0.14 + Math.abs(S.k) * 0.015) * dt;
      if (st.xPkt > 1.15) st.xPkt = -0.15;
      if (st.xPkt < -0.15) st.xPkt = 1.15;

      // Vẽ trường pha màu (sọc sáng tối biểu diễn Re(Ψ))
      const M = 160;
      const dxPx = tubeW / (M - 1);
      for (let i = 0; i < M; i++) {
        const u = i / (M - 1);
        const sx = tubeX + u * tubeW;
        const env = S.waveType === 'packet' ? Math.exp(-Math.pow((u - st.xPkt) / 0.14, 2)) : 1;
        const ph = kPx * (sx - tubeX) - omegaSim * t;
        const val = Math.cos(ph) * env;
        if (Math.abs(val) > 0.04) {
          ctx.fillStyle = hexA(val > 0 ? col : C.c5, Math.abs(val) * 0.16 * env);
          ctx.fillRect(sx - dxPx * 0.5, tubeY, dxPx + 0.6, tubeH);
        }
      }

      // Phần ảo Im(Ψ) nét đứt mờ & Phần thực Re(Ψ) nét đậm
      ctx.beginPath();
      for (let i = 0; i < M; i++) {
        const u = i / (M - 1), sx = tubeX + u * tubeW;
        const env = S.waveType === 'packet' ? Math.exp(-Math.pow((u - st.xPkt) / 0.14, 2)) : 1;
        const sy = midY - Math.sin(kPx * (sx - tubeX) - omegaSim * t) * amp * env;
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = hexA(C.c5, 0.45); ctx.lineWidth = 1.3; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);

      ctx.beginPath();
      for (let i = 0; i < M; i++) {
        const u = i / (M - 1), sx = tubeX + u * tubeW;
        const env = S.waveType === 'packet' ? Math.exp(-Math.pow((u - st.xPkt) / 0.14, 2)) : 1;
        const sy = midY - Math.cos(kPx * (sx - tubeX) - omegaSim * t) * amp * env;
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.stroke();

      // Hạt electron chạy đều trong chùm (minh họa p = ħk)
      if (!st.parts) {
        st.parts = Array.from({ length: 14 }, (_, i) => ({ u: i / 14, y: rnd(-0.32, 0.32) }));
      }
      st.parts.forEach(pt => {
        pt.u += dir * (0.12 + Math.abs(S.k) * 0.014) * dt;
        if (pt.u > 1) pt.u -= 1;
        if (pt.u < 0) pt.u += 1;
        const px = tubeX + pt.u * tubeW;
        const py = midY + pt.y * tubeH;
        const show = S.waveType === 'plane' || Math.abs(pt.u - st.xPkt) < 0.18;
        if (show) {
          glowDot(ctx, px, py, 3.6, C.ink, hexA(C.main, 0.85));
          dot(ctx, px, py, 3, C.main);
        }
      });

      // Mũi tên chỉ chiều truyền sóng (+x hoặc −x)
      if (dir !== 0) {
        const ax0 = tubeX + tubeW * 0.5 - dir * 48;
        const ax1 = tubeX + tubeW * 0.5 + dir * 48;
        ln(ctx, ax0, tubeY + 22, ax1, tubeY + 22, C.main, 2.2);
        ln(ctx, ax1, tubeY + 22, ax1 - dir * 8, tubeY + 17, C.main, 2.2);
        ln(ctx, ax1, tubeY + 22, ax1 - dir * 8, tubeY + 27, C.main, 2.2);
        txt(ctx, dir > 0 ? 'Chạy về +x (v_p > 0)' : 'Chạy về −x (v_p < 0)',
          tubeX + tubeW * 0.5, tubeY + 37, C.main, 10, 'center', 700, MONO);
      }
      ctx.restore();

      // Thông số rõ nét ở mép trên & dưới
      txt(ctx, 'λ = ' + (isFinite(lam_nm) ? lam_nm.toFixed(2) + ' nm' : '∞') + '  |  p = ' + (pSI >= 0 ? '+' : '−') + sci(Math.abs(pSI), 2) + ' kg·m/s',
        chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
      txt(ctx, 'E = ħ²k²/2m = ' + (E_eV * 1000).toFixed(1) + ' meV (' + E_eV.toFixed(4) + ' eV)  |  v_p = ' + (dir === 0 ? '0' : vp_kms.toFixed(0)) + ' km/s',
        chX + chW - 14, chY + 18, C.main, 10.8, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 2 — GIẾNG THẾ VÔ HẠN 1 CHIỀU (V = ∞ TẠI x = 0, a) — MINH HỌA CÂU 2
   ========================================================================== */
LABS.push({
  id: 'well', name: 'Giếng vô hạn', no: '2', sec: 2,
  S: { n: 1, a: 75 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Hộp lượng tử 1D (V = ∞) — Sóng dừng ψ_n(x), Xác suất |ψ_n|² & Phát xạ Photon',
    area: 'a', anim: true,
    ctrls: [
      { k: 'n', l: 'Mức n', min: 1, max: 5, step: 1, f: v => 'n = ' + v },
      { k: 'a', l: 'Rộng giếng a', min: 5, max: 100, step: 5, f: v => v + ' Å' },
      { btn: 'Câu 2 (75 Å)', fn: p => { p.S.a = 75; p.syncCtrls(); queueReact(p.tab, 'a'); } },
      { btn: 'Siêu hẹp (5 Å)', fn: p => { p.S.a = 5; p.syncCtrls(); queueReact(p.tab, 'a'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const n = Math.round(S.n);
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawLabChamberBg(ctx, chX, chY, chW, chH, 10);

      const a_m = S.a * 1e-10;
      const E1_eV = (Math.PI * Math.PI * HBAR * HBAR / (2 * ME * a_m * a_m)) / EV;
      const En_eV = n * n * E1_eV;

      // Khi chuyển mức n → tạo bó photon phát xạ hoặc hấp thụ
      if (!st.photons) { st.photons = []; st.hits = []; }
      if (st.prevN != null && st.prevN !== n) {
        const dE = Math.abs(st.prevN * st.prevN - n * n) * E1_eV;
        st.photons.push({ emit: n < st.prevN, from: st.prevN, to: n, dE, prog: 0 });
      }
      st.prevN = n;

      // Hình học giếng thế vô hạn co giãn trực quan theo bề rộng a
      const topY = chY + 42, botY = chY + chH - 28;
      const wellH = botY - topY;
      const wellW = clamp((S.a / 100) * (chW * 0.56) + chW * 0.18, chW * 0.22, chW * 0.72);
      const x0 = chX + (chW - wellW) * 0.44;
      const x1 = x0 + wellW;

      // Hai vách tường vô hạn V = ∞ (kẻ chéo rắn chắn tuyệt đối)
      ctx.fillStyle = hexA(C.err, 0.16);
      ctx.fillRect(chX + 12, topY, x0 - (chX + 12), wellH);
      ctx.fillRect(x1, topY, (chX + chW - 12) - x1, wellH);
      ln(ctx, x0, topY, x0, botY, C.err, 3);
      ln(ctx, x1, topY, x1, botY, C.err, 3);
      ln(ctx, x0, botY, x1, botY, C.ink, 2);

      // Các vạch mức năng lượng E₁..E₅ (tỉ lệ n²)
      const yOfN = k => botY - (0.08 + 0.84 * (k * k) / 25) * wellH;
      for (let k = 1; k <= 5; k++) {
        const yk = yOfN(k);
        const sel = k === n;
        ln(ctx, x0, yk, x1, yk, sel ? C.main : hexA(C.g, 0.9), sel ? 2 : 1, [4, 4]);
        const ek = k * k * E1_eV;
        const eLbl = ek < 0.1 ? (ek * 1000).toFixed(2) + ' meV' : ek.toFixed(3) + ' eV';
        txt(ctx, 'E' + k + ' (' + k * k + 'E₁) = ' + eLbl, x1 + 8, yk, sel ? C.main : C.ink, sel ? 10.2 : 9.2, 'left', sel ? 700 : 500, MONO);
      }

      // Đám mây xác suất |ψ_n(x)|² & Sóng dừng ψ_n(x) tại mức đang chọn
      const curY = yOfN(n);
      const amp = Math.min(34, wellH * 0.14);
      const osc = Math.cos(t * (3.2 + n * 1.4));
      const Npts = 120;

      for (let i = 0; i < Npts; i++) {
        const u = i / Npts;
        const pr = Math.pow(Math.sin(n * Math.PI * u), 2);
        if (pr < 0.01) continue;
        ctx.fillStyle = hexA(C.c2, pr * 0.36);
        ctx.fillRect(x0 + u * wellW, curY - pr * amp * 1.1, wellW / Npts + 1, pr * amp * 1.1);
      }

      ctx.beginPath();
      for (let i = 0; i <= Npts; i++) {
        const u = i / Npts;
        const sy = curY - Math.sin(n * Math.PI * u) * osc * amp;
        i === 0 ? ctx.moveTo(x0 + u * wellW, sy) : ctx.lineTo(x0 + u * wellW, sy);
      }
      ctx.strokeStyle = C.c2; ctx.lineWidth = 2.6; ctx.stroke();

      // Đánh dấu hai nút biên & n-1 nút bên trong giếng
      for (let nd = 0; nd <= n; nd++) {
        dot(ctx, x0 + (nd / n) * wellW, curY, nd === 0 || nd === n ? 4 : 3.2, nd === 0 || nd === n ? C.err : C.c5);
      }

      // Chớp đo vị trí electron xuất hiện đúng theo sin²(nπx/a)
      if (Math.random() < dt * 16) {
        let uPick = 0.5;
        for (let tr = 0; tr < 16; tr++) {
          const cand = Math.random();
          if (Math.random() < Math.pow(Math.sin(n * Math.PI * cand), 2)) { uPick = cand; break; }
        }
        st.hits.push({ x: x0 + uPick * wellW, y: curY + rnd(-amp * 0.35, amp * 0.35), life: 1.0 });
      }
      st.hits.forEach(h => {
        h.life -= dt * 1.9;
        if (h.life > 0) glowDot(ctx, h.x, h.y, 2.8, C.ink, hexA(C.c1, h.life * 0.9));
      });
      st.hits = st.hits.filter(h => h.life > 0);

      // Vẽ photon phát/hấp thụ khi chuyển mức
      for (let i = st.photons.length - 1; i >= 0; i--) {
        const ph = st.photons[i];
        ph.prog += dt * 1.1;
        const yMid = (yOfN(ph.from) + yOfN(ph.to)) * 0.5;
        const dist = ph.emit ? ph.prog * 140 : (1 - ph.prog) * 140;
        const px = (x0 + x1) * 0.5 + dist;
        const al = clamp(1 - Math.abs(ph.prog - 0.5) * 1.9, 0, 1);
        ctx.beginPath();
        for (let s = -18; s <= 18; s += 2) {
          const wy = Math.sin(s * 0.7 - t * 24) * 6 * Math.exp(-(s * s) / 140);
          s === -18 ? ctx.moveTo(px + s, yMid + wy) : ctx.lineTo(px + s, yMid + wy);
        }
        ctx.strokeStyle = hexA(C.main, al); ctx.lineWidth = 2.2; ctx.stroke();
        if (ph.prog >= 1.05) st.photons.splice(i, 1);
      }

      // Nhãn tọa độ chân giếng & thông số mép trên
      txt(ctx, 'x = 0', x0, botY + 14, C.ink, 9.5, 'center', 700, MONO);
      txt(ctx, 'x = a (' + S.a + ' Å)', x1, botY + 14, C.ink, 9.5, 'center', 700, MONO);
      txt(ctx, 'V = ∞', (chX + 12 + x0) * 0.5, topY + 16, C.err, 10, 'center', 700, MONO);

      const eCurStr = En_eV < 0.1 ? (En_eV * 1000).toFixed(2) + ' meV' : En_eV.toFixed(3) + ' eV';
      txt(ctx, 'Mức n = ' + n + ' (' + n + ' bụng sóng, ' + (n - 1) + ' nút trong)  |  a = ' + S.a + ' Å',
        chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
      txt(ctx, 'E_' + n + ' = ' + eCurStr + '  |  λ_' + n + ' = 2a/' + n + ' = ' + (2 * S.a / n).toFixed(1) + ' Å',
        chX + chW - 14, chY + 18, C.main, 10.8, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 3 — BẬC THẾ NĂNG (STEP POTENTIAL, E < V₀) — BỘ GIẢI TDSE 1D & CÂU 3
   ========================================================================== */
LABS.push({
  id: 'step', name: 'Bậc thế năng', no: '3', sec: 3,
  S: { E: 2.8, V0: 3.5, xProbe: 5 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Bậc thế năng (TDSE 1D) — Đâm xuyên hàm mũ e^(−2k₂x) vào vùng cấm cổ điển (Câu 3)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'E', l: 'Năng lượng E', min: 1.0, max: 5.5, step: 0.1, f: v => v.toFixed(1) + ' eV' },
      { k: 'V0', l: 'Bậc thế V₀', min: 1.5, max: 6.0, step: 0.1, f: v => v.toFixed(1) + ' eV' },
      { k: 'xProbe', l: 'Đầu dò x', min: 1, max: 40, step: 1, f: v => v + ' Å' },
      { btn: 'Câu 3 (5 / 15 / 40 Å)', fn: p => {
        p.S.E = 2.8; p.S.V0 = 3.5;
        p.S.xProbe = p.S.xProbe === 5 ? 15 : p.S.xProbe === 15 ? 40 : 5;
        p.syncCtrls(); queueReact(p.tab, 'xProbe');
      } },
      { btn: 'Bắn lại bó sóng', fn: p => { p.st.tdse = null; } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawLabChamberBg(ctx, chX, chY, chW, chH, 10);

      const under = S.E < S.V0;
      const k2 = under ? Math.sqrt(2 * ME * (S.V0 - S.E) * EV) / HBAR : 0; // m^-1
      const pRel = under ? Math.exp(-2 * k2 * (S.xProbe * 1e-10)) : 1;

      const regX0 = chX + 16, regX1 = chX + chW - 16, regW = regX1 - regX0;
      const topY = chY + 42, botY = chY + chH - 28, regH = botY - topY;
      const xStep = regX0 + regW * 0.50;

      // Khởi tạo bộ giải số TDSE 1D (N = 220 điểm, mép bậc thế tại idx = 110)
      const simKey = S.E.toFixed(1) + '_' + S.V0.toFixed(1);
      const N = 220, stepIdx = 110;
      if (!st.tdse || st.key !== simKey) {
        st.key = simKey;
        const kSim = 0.46 + (S.E / 6.0) * 0.62;
        const Esim = 0.5 * kSim * kSim;
        const Vsim = Esim * (S.V0 / Math.max(S.E, 0.2));
        st.tdse = createTDSE(N, 52, kSim, 11, i => (i >= stepIdx ? Vsim : 0), 1.0);
        st.timer = 0;
      }
      st.tdse.step(5);
      st.timer += dt;
      if (st.timer > 6.8) { st.tdse = null; }

      const eMax = Math.max(S.V0, S.E, 4.5) * 1.15;
      const yOfE = eVal => botY - (eVal / eMax) * regH;
      const yV0 = yOfE(S.V0);
      const yE = yOfE(S.E);

      // 1. Vùng II (x ≥ 0): Khối bậc thế V₀
      const gBar = ctx.createLinearGradient(xStep, yV0, regX1, yV0);
      gBar.addColorStop(0, hexA(C.c4, 0.28));
      gBar.addColorStop(1, hexA(C.c4, 0.08));
      ctx.fillStyle = gBar;
      ctx.fillRect(xStep, yV0, regX1 - xStep, botY - yV0);

      ctx.beginPath();
      ctx.moveTo(regX0, botY); ctx.lineTo(xStep, botY); ctx.lineTo(xStep, yV0); ctx.lineTo(regX1, yV0);
      ctx.strokeStyle = C.c4; ctx.lineWidth = 2.4; ctx.stroke();

      // Mức năng lượng tới E
      ln(ctx, regX0, yE, regX1, yE, hexA(C.main, 0.7), 1.4, [5, 4]);
      txt(ctx, 'E=' + S.E.toFixed(1) + 'eV', regX0 + 6, yE - 10, C.main, 9.8, 'left', 700, MONO);
      txt(ctx, 'V₀=' + S.V0.toFixed(1) + 'eV', xStep + 8, yV0 - 10, C.c4, 9.8, 'left', 700, MONO);

      // 2. Đường bao đâm xuyên tĩnh chuẩn xác e^(−2k₂x) và Đầu dò tại xProbe (Å)
      if (under) {
        const pxPerA = (regX1 - xStep) / 45;
        const ampEnv = regH * 0.28;
        ctx.beginPath();
        for (let a = 0; a <= 45; a += 0.5) {
          const sx = xStep + a * pxPerA;
          const sy = botY - Math.exp(-2 * k2 * a * 1e-10) * ampEnv;
          a === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = hexA(C.main, 0.65); ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);

        // Đầu dò đo tại xProbe (Å)
        const prX = xStep + S.xProbe * pxPerA;
        ln(ctx, prX, yV0, prX, botY, C.c1, 1.5, [3, 3]);
        const prY = botY - pRel * ampEnv;
        glowDot(ctx, prX, prY, 4.5, C.ink, hexA(C.c1, 0.9));
        txt(ctx, 'x=' + S.xProbe + 'Å', prX, botY + 14, C.c1, 9.5, 'center', 700, MONO);
      }

      // 3. Vẽ mật độ xác suất |ψ(x,t)|² & phần thực Re(ψ) từ bộ giải số TDSE 1D
      if (st.tdse) {
        const td = st.tdse;
        const ampP = regH * 1.45;
        ctx.beginPath();
        ctx.moveTo(regX0, botY);
        for (let i = 0; i < N; i++) {
          const sx = regX0 + (i / (N - 1)) * regW;
          const pr = td.re[i] * td.re[i] + td.im[i] * td.im[i];
          ctx.lineTo(sx, botY - Math.min(pr * ampP, regH * 0.88));
        }
        ctx.lineTo(regX1, botY);
        ctx.closePath();
        ctx.fillStyle = hexA(C.c2, 0.32); ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const sx = regX0 + (i / (N - 1)) * regW;
          const pr = td.re[i] * td.re[i] + td.im[i] * td.im[i];
          const sy = botY - Math.min(pr * ampP, regH * 0.88);
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = C.c2; ctx.lineWidth = 2.2; ctx.stroke();
      }

      txt(ctx, 'x = 0', xStep, botY + 14, C.ink, 9.5, 'center', 700, MONO);

      // Thông số rõ nét ở mép trên
      txt(ctx, under ? 'k₂ = ' + sci(k2, 2) + ' m⁻¹  |  x = ' + S.xProbe + ' Å' : 'E ≥ V₀: Sóng truyền qua tự do (Phản xạ một phần)',
        chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
      const pTxt = under
        ? '|ψ(x)|²/|ψ(0)|² = ' + (pRel >= 0.001 ? (pRel * 100).toFixed(2) + '%' : sci(pRel, 2))
        : 'T > 0 (Không tắt hàm mũ)';
      txt(ctx, pTxt, chX + chW - 14, chY + 18, under ? C.c1 : C.main, 10.8, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 4 — XUYÊN HẦM LƯỢNG TỬ (QUANTUM TUNNELING) — GAAS VS SILICON (CÂU 4)
   ========================================================================== */
LABS.push({
  id: 'tunnel', name: 'Xuyên hầm', no: '4', sec: 3,
  S: { mat: 'gaas', a: 15, E: 0.20, V0: 0.80 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Mặt cắt Rào thế Nano (TDSE 1D) — Xuyên hầm trong GaAs vs Silicon & Ampe kế (Câu 4)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mat', seg: [['gaas', 'GaAs (m*=0.067m₀)'], ['si', 'Silicon (m*=1.08m₀)']] },
      { k: 'a', l: 'Dày rào a', min: 5, max: 30, step: 1, f: v => v + ' Å' },
      { k: 'E', l: 'Năng lượng E', min: 0.10, max: 0.75, step: 0.05, f: v => v.toFixed(2) + ' eV' },
      { k: 'V0', l: 'Cao rào V₀', min: 0.40, max: 1.50, step: 0.05, f: v => v.toFixed(2) + ' eV' },
      { btn: 'Câu 4 (15 Å)', fn: p => { Object.assign(p.S, { a: 15, E: 0.20, V0: 0.80 }); p.syncCtrls(); queueReact(p.tab, 'mat'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawLabChamberBg(ctx, chX, chY, chW, chH, 10);

      const mStarRatio = S.mat === 'gaas' ? 0.067 : 1.08;
      const mStar = mStarRatio * ME;
      const E_eff = Math.min(S.E, S.V0 - 0.02);
      const a_m = S.a * 1e-10;
      const k2 = Math.sqrt(2 * mStar * (S.V0 - E_eff) * EV) / HBAR;
      const ratioE = E_eff / S.V0;
      // Công thức xấp xỉ bài học & công thức chính xác sinh²(k₂a)
      const T_wkb = clamp(16 * ratioE * (1 - ratioE) * Math.exp(-2 * k2 * a_m), 0, 1);
      const sh = Math.sinh(Math.min(k2 * a_m, 40));
      const T_exact = 1 / (1 + (sh * sh) / (4 * ratioE * (1 - ratioE)));

      const regX0 = chX + 16, regX1 = chX + chW - 118, regW = regX1 - regX0;
      const topY = chY + 42, botY = chY + chH - 28, regH = botY - topY;
      const barWpx = clamp((S.a / 30) * (regW * 0.24), 14, regW * 0.24);
      const barX0 = regX0 + regW * 0.44;
      const barX1 = barX0 + barWpx;

      // Bộ giải số TDSE 1D (điều chỉnh độ cao rào hiệu dụng để biểu diễn trực quan sự chênh lệch m*)
      const N = 220;
      const i0 = Math.round(((barX0 - regX0) / regW) * N);
      const i1 = Math.max(i0 + 3, Math.round(((barX1 - regX0) / regW) * N));
      const simKey = `${S.mat}_${S.a}_${S.E.toFixed(2)}_${S.V0.toFixed(2)}`;
      if (!st.tdse || st.key !== simKey) {
        st.key = simKey;
        const kSim = 0.68;
        const Esim = 0.5 * kSim * kSim;
        // Giữ mSim ổn định mà vẫn phản ánh đúng suy giảm mạnh hơn ở Silicon
        const boost = S.mat === 'gaas' ? 1.18 : 2.35;
        const Vsim = Esim * (1 + (S.V0 - E_eff) / Math.max(E_eff, 0.1) * 0.22 * boost);
        st.tdse = createTDSE(N, 42, kSim, 10, i => (i >= i0 && i <= i1 ? Vsim : 0), 1.0);
        st.timer = 0;
      }
      st.tdse.step(5);
      st.timer += dt;
      if (st.timer > 6.6) st.tdse = null;

      // 1. Vẽ rào thế Oxide ở giữa (Vùng I: Nguồn | Vùng II: Rào thế | Vùng III: Máng)
      const eMax = Math.max(S.V0 * 1.2, 1.2);
      const yV0 = botY - (S.V0 / eMax) * regH;
      const yE = botY - (E_eff / eMax) * regH;

      rr(ctx, barX0, yV0, barWpx, botY - yV0, 2);
      ctx.fillStyle = hexA(S.mat === 'gaas' ? C.c2 : C.c4, 0.26); ctx.fill();
      ctx.strokeStyle = S.mat === 'gaas' ? C.c2 : C.c4; ctx.lineWidth = 2; ctx.stroke();

      ln(ctx, regX0, botY, regX1, botY, C.g, 1.5);
      ln(ctx, regX0, yE, regX1, yE, hexA(C.main, 0.65), 1.2, [4, 4]);
      txt(ctx, 'Rào a=' + S.a + 'Å', (barX0 + barX1) * 0.5, yV0 - 11, S.mat === 'gaas' ? C.c2 : C.c4, 9.5, 'center', 700, MONO);
      txt(ctx, 'Nguồn (I)', (regX0 + barX0) * 0.5, botY + 14, C.ink, 9.5, 'center', 600, MONO);
      txt(ctx, 'Máng (III)', (barX1 + regX1) * 0.5, botY + 14, C.c1, 9.5, 'center', 600, MONO);

      // 2. Vẽ sóng TDSE xuyên hầm qua rào thế
      if (st.tdse) {
        const td = st.tdse;
        const ampP = regH * 1.55;
        ctx.beginPath();
        ctx.moveTo(regX0, botY);
        for (let i = 0; i < N; i++) {
          const sx = regX0 + (i / (N - 1)) * regW;
          const pr = td.re[i] * td.re[i] + td.im[i] * td.im[i];
          ctx.lineTo(sx, botY - Math.min(pr * ampP, regH * 0.88));
        }
        ctx.lineTo(regX1, botY);
        ctx.closePath();
        ctx.fillStyle = hexA(C.c1, 0.28); ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const sx = regX0 + (i / (N - 1)) * regW;
          const pr = td.re[i] * td.re[i] + td.im[i] * td.im[i];
          const sy = botY - Math.min(pr * ampP, regH * 0.88);
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = C.c1; ctx.lineWidth = 2.2; ctx.stroke();
      }

      // 3. Ampe kế kim cơ đo dòng rò xuyên hầm bên phải
      const mX = regX1 + 12, mW = chX + chW - mX - 12, mH = 112;
      const mY = topY + (regH - mH) * 0.5;
      rr(ctx, mX, mY, mW, mH, 8);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = T_exact > 0.01 ? C.c1 : C.g; ctx.lineWidth = 1.4; ctx.stroke();

      const mcx = mX + mW * 0.5, mcy = mY + 56, mr = Math.min(mW * 0.38, 32);
      ctx.beginPath(); ctx.arc(mcx, mcy, mr, Math.PI * 1.12, Math.PI * 1.88);
      ctx.strokeStyle = C.g; ctx.lineWidth = 2.5; ctx.stroke();
      // Thang log cho kim Ampe kế để thấy rõ từ 10⁻⁸ đến 100%
      const needleTarget = clamp((Math.log10(Math.max(T_exact, 1e-8)) + 8) / 8, 0, 1);
      st.needle = (st.needle || 0) + (needleTarget - (st.needle || 0)) * Math.min(1, dt * 8);
      const nAng = Math.PI * (1.12 + st.needle * 0.76);
      ln(ctx, mcx, mcy, mcx + Math.cos(nAng) * (mr - 3), mcy + Math.sin(nAng) * (mr - 3), S.mat === 'gaas' ? C.c1 : C.c4, 2.2);
      dot(ctx, mcx, mcy, 3, C.ink);

      txt(ctx, 'DÒNG RÒ T', mcx, mY + 14, C.ink, 9.5, 'center', 700, MONO);
      const tStr = T_exact >= 0.001 ? (T_exact * 100).toFixed(1) + '%' : sci(T_exact, 1);
      txt(ctx, tStr, mcx, mY + 80, S.mat === 'gaas' ? C.c1 : C.c4, 11.5, 'center', 800, MONO);
      txt(ctx, 'WKB: ' + (T_wkb >= 0.001 ? (T_wkb * 100).toFixed(1) + '%' : sci(T_wkb, 1)), mcx, mY + 98, C.mut, 8.8, 'center', 600, MONO);

      // Thông số rõ nét ở mép trên
      txt(ctx, (S.mat === 'gaas' ? 'GaAs (m* = 0.067 m₀)' : 'Silicon (m* = 1.08 m₀)') + '  |  k₂ = ' + sci(k2, 2) + ' m⁻¹',
        chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
      txt(ctx, '2k₂a = ' + (2 * k2 * a_m).toFixed(2) + '  |  T_exact = ' + tStr,
        chX + chW - 14, chY + 18, S.mat === 'gaas' ? C.c1 : C.c4, 10.8, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 5 — GIẾNG THẾ BẤT ĐỐI XỨNG (CÂU 5 · FIGURE P2.40)
   Vùng I (x < 0): V = V₀  |  Vùng II (0 < x < a): V = 0  |  Vùng III (x > a): V = ∞
   ========================================================================== */
function solveAsymWell(V0_eV, a_A) {
  const a_m = a_A * 1e-10;
  const R = (Math.sqrt(2 * ME * V0_eV * EV) * a_m) / HBAR;
  const states = [];
  for (let n = 1; n <= 8; n++) {
    const loStart = (n - 0.5) * Math.PI + 1e-5;
    if (R <= loStart) break;
    let lo = loStart;
    let hi = Math.min(n * Math.PI - 1e-5, R - 1e-6);
    const f = u => u * Math.cos(u) + Math.sqrt(Math.max(0, R * R - u * u)) * Math.sin(u);
    let fLo = f(lo);
    if (fLo * f(hi) > 0) continue;
    for (let it = 0; it < 42; it++) {
      const mid = (lo + hi) * 0.5;
      const fm = f(mid);
      if (fLo * fm <= 0) hi = mid; else { lo = mid; fLo = fm; }
    }
    const u = (lo + hi) * 0.5;
    const k1a = Math.sqrt(Math.max(0, R * R - u * u));
    const E_eV = V0_eV * (u / R) * (u / R);
    const normI = (Math.sin(u) * Math.sin(u)) / (2 * Math.max(k1a, 1e-6));
    const normII = 0.5 - Math.sin(2 * u) / (4 * u);
    const pLeak = normI / (normI + normII);
    states.push({ n, u, k1a, E_eV, pLeak });
  }
  return { R, states };
}

LABS.push({
  id: 'asym', name: 'Giếng bất đối xứng', no: '5', sec: 3,
  S: { V0: 1.8, a: 14, n: 1 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Giếng thế bất đối xứng (Câu 5) — Vách trái V₀ hữu hạn (rò sóng) & Vách phải V = ∞',
    area: 'a', anim: true,
    ctrls: [
      { k: 'V0', l: 'Rào trái V₀', min: 0.2, max: 5.0, step: 0.1, f: v => v.toFixed(1) + ' eV' },
      { k: 'a', l: 'Rộng giếng a', min: 4, max: 30, step: 1, f: v => v + ' Å' },
      { k: 'n', l: 'Mức liên kết n', min: 1, max: 6, step: 1,
        dynRange: S => [1, Math.max(1, solveAsymWell(S.V0, S.a).states.length)],
        f: v => 'n = ' + v },
      { btn: 'Ngưỡng mất mức', fn: p => { p.S.V0 = 0.4; p.S.a = 4; curPanels.forEach(q => q.syncCtrls && q.syncCtrls()); queueReact(p.tab, 'V0'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawLabChamberBg(ctx, chX, chY, chW, chH, 10);

      const { R, states } = solveAsymWell(S.V0, S.a);
      const count = states.length;
      const curState = count > 0 ? states[clamp(Math.round(S.n) - 1, 0, count - 1)] : null;
      const a_m = S.a * 1e-10;
      const E1_inf = (Math.PI * Math.PI * HBAR * HBAR / (2 * ME * a_m * a_m)) / EV;

      const regX0 = chX + 16, regX1 = chX + chW - 16;
      const topY = chY + 42, botY = chY + chH - 36;
      const regH = botY - topY;
      const xZero = chX + chW * 0.36;
      const wellW = clamp((S.a / 30) * (chW * 0.42), chW * 0.14, chW * 0.44);
      const xA = xZero + wellW;

      const eScaleMax = Math.max(S.V0 * 1.18, 1.5);
      const yOfE = eVal => botY - clamp(eVal / eScaleMax, 0, 1.02) * regH;
      const yV0 = yOfE(S.V0);

      // 1. Vùng I: Rào thế hữu hạn bên trái (V = V₀)
      const gLeft = ctx.createLinearGradient(regX0, yV0, xZero, yV0);
      gLeft.addColorStop(0, hexA(C.c4, 0.07));
      gLeft.addColorStop(1, hexA(C.c4, 0.24));
      ctx.fillStyle = gLeft;
      ctx.fillRect(regX0, yV0, xZero - regX0, botY - yV0);

      for (let gx = regX0 + 12; gx < xZero - 4; gx += 18) {
        for (let gy = yV0 + 12; gy < botY - 4; gy += 18) {
          dot(ctx, gx, gy, 1.6, hexA(C.c4, 0.28));
        }
      }

      // 2. Vùng III: Tường thế vô hạn bên phải (V = ∞)
      const gRight = ctx.createLinearGradient(xA, topY, regX1, topY);
      gRight.addColorStop(0, hexA(C.err, 0.28));
      gRight.addColorStop(1, hexA(C.bg, 0.9));
      ctx.fillStyle = gRight;
      ctx.fillRect(xA, topY, regX1 - xA, regH);
      for (let gy = topY + 8; gy < botY; gy += 14) {
        ln(ctx, xA + 2, gy, Math.min(regX1, xA + 28), gy - 10, hexA(C.err, 0.32), 1.2);
      }

      ctx.beginPath();
      ctx.moveTo(regX0, yV0); ctx.lineTo(xZero, yV0); ctx.lineTo(xZero, botY); ctx.lineTo(xA, botY); ctx.lineTo(xA, topY);
      ctx.strokeStyle = C.c4; ctx.lineWidth = 2.4; ctx.stroke();

      states.forEach(s => {
        const ey = yOfE(s.E_eV);
        const isSel = curState && s.n === curState.n;
        ln(ctx, regX0, ey, xA, ey, isSel ? C.main : hexA(C.mut, 0.48), isSel ? 1.8 : 1, isSel ? [5, 3] : [3, 4]);
        txt(ctx, 'E' + s.n + '=' + s.E_eV.toFixed(2) + 'eV', xA + 8, ey, isSel ? C.main : C.mut, isSel ? 10.5 : 9.5, 'left', isSel ? 700 : 500, MONO);
      });

      if (curState) {
        const ey = yOfE(curState.E_eV);
        const amp = Math.min(46, regH * 0.22);
        const osc = Math.cos(t * (3.5 + curState.n * 1.4));
        const sinU = Math.sin(curState.u);

        // Vùng I: Đuôi hàm mũ ψ₁(x) = sin(u)·exp(k₁x)
        const nLeft = 90;
        for (let i = 0; i < nLeft; i++) {
          const sx = regX0 + (i / nLeft) * (xZero - regX0);
          const xNorm = (sx - xZero) / wellW;
          const psi = sinU * Math.exp(curState.k1a * xNorm);
          const pr = psi * psi;
          if (pr < 0.004) continue;
          ctx.fillStyle = hexA(C.c4, clamp(pr * 0.45, 0.03, 0.45));
          ctx.fillRect(sx, ey - pr * amp * 1.15, (xZero - regX0) / nLeft + 1, pr * amp * 1.15);
        }

        // Vùng II: Sóng dừng ψ₂(x) = sin(u·(1 − x/a))
        const nMid = 110;
        for (let i = 0; i < nMid; i++) {
          const uFrac = i / nMid;
          const sx = xZero + uFrac * wellW;
          const psi = Math.sin(curState.u * (1 - uFrac));
          const pr = psi * psi;
          if (pr < 0.004) continue;
          ctx.fillStyle = hexA(C.c2, clamp(pr * 0.38, 0.03, 0.38));
          ctx.fillRect(sx, ey - pr * amp * 1.15, wellW / nMid + 1, pr * amp * 1.15);
        }

        ctx.beginPath();
        for (let i = 0; i <= 90; i++) {
          const sx = regX0 + (i / 90) * (xZero - regX0);
          const xNorm = (sx - xZero) / wellW;
          const sy = ey - sinU * Math.exp(curState.k1a * xNorm) * osc * amp;
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        for (let i = 1; i <= 110; i++) {
          const uFrac = i / 110;
          const sx = xZero + uFrac * wellW;
          const sy = ey - Math.sin(curState.u * (1 - uFrac)) * osc * amp;
          ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = C.c2; ctx.lineWidth = 2.4; ctx.stroke();

        dot(ctx, xZero, ey - sinU * osc * amp, 4.2, C.main);
        dot(ctx, xA, ey, 4.5, C.err);

        if (!st.hits) st.hits = [];
        if (Math.random() < dt * 16) {
          const inLeft = Math.random() < curState.pLeak;
          let hx;
          if (inLeft) {
            const dxNorm = Math.log(Math.max(1e-4, Math.random())) / (2 * Math.max(curState.k1a, 0.1));
            hx = clamp(xZero + dxNorm * wellW, regX0 + 4, xZero - 2);
          } else {
            let uPick = 0.5;
            for (let tr = 0; tr < 16; tr++) {
              const cand = Math.random();
              if (Math.random() < Math.pow(Math.sin(curState.u * (1 - cand)), 2)) { uPick = cand; break; }
            }
            hx = xZero + uPick * wellW;
          }
          st.hits.push({ x: hx, y: ey + rnd(-amp * 0.42, amp * 0.42), left: inLeft, life: 1.0 });
        }
        st.hits.forEach(h => {
          h.life -= dt * 1.8;
          if (h.life > 0) glowDot(ctx, h.x, h.y, 2.8, C.ink, hexA(h.left ? C.c4 : C.c1, h.life * 0.9));
        });
        st.hits = st.hits.filter(h => h.life > 0);
      } else {
        txt(ctx, 'R = ' + R.toFixed(2) + ' ≤ π/2 (1.57) : KHÔNG CÓ TRẠNG THÁI LIÊN KẾT!',
          chX + chW * 0.46, topY + regH * 0.45, C.err, 12, 'center', 700, MONO);
      }

      txt(ctx, 'I: V = ' + S.V0.toFixed(1) + ' eV', (regX0 + xZero) * 0.5, yV0 - 12, C.c4, 10, 'center', 700, MONO);
      txt(ctx, 'II: V = 0', (xZero + xA) * 0.5, botY + 18, C.c2, 10.5, 'center', 700, MONO);
      txt(ctx, 'III: V = ∞', (xA + regX1) * 0.5, topY + 14, C.err, 10, 'center', 700, MONO);
      txt(ctx, 'x = 0', xZero, botY + 18, C.ink, 9.5, 'center', 700, MONO);
      txt(ctx, 'x = a (' + S.a + ' Å)', xA, botY + 18, C.ink, 9.5, 'center', 700, MONO);

      const leftInfo = curState
        ? 'Số mức liên kết: ' + count + '  |  E_' + curState.n + ' = ' + curState.E_eV.toFixed(3) + ' eV  (Vô hạn: ' + (curState.n * curState.n * E1_inf).toFixed(3) + ' eV)'
        : 'Số mức liên kết: 0  |  R = ' + R.toFixed(2) + ' ≤ π/2';
      txt(ctx, leftInfo, chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
      txt(ctx, curState ? 'Rò vào Vùng I: ' + (curState.pLeak * 100).toFixed(1) + '%  |  tan(k₂a) = −k₂/k₁' : 'Tăng V₀ hoặc a để giữ được electron',
        chX + chW - 14, chY + 18, curState ? C.main : C.err, 10.8, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 6 — ORBITAL HYDRO (20 SVG #o100..#o433) & 4 SỐ LƯỢNG TỬ (n,l,m,s) + ZEEMAN
   ========================================================================== */
LABS.push({
  id: 'orbitals', name: 'Orbital & (n,l,m,s)', no: '6', sec: 4,
  S: { n: 3, l: 1, m: 0, s: '+1/2', B: 0.0, nodes: true },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Kính hiển vi Orbital Hydro (n, l, m, s) — SVG mật độ |ψ|², Mặt nút & Hiệu ứng Zeeman',
    area: 'a', anim: true,
    ctrls: [
      { k: 'n', l: 'n', min: 1, max: 4, step: 1, f: v => v + ' (' + ['K','L','M','N'][v - 1] + ')' },
      { k: 'l', l: 'l (≤n−1)', min: 0, max: 3, step: 1, dynRange: S => [0, S.n - 1], f: v => v + ' (' + ['s','p','d','f'][v] + ')' },
      { k: 'm', l: 'm (|m|≤l)', min: -3, max: 3, step: 1, dynRange: S => [-S.l, S.l], f: v => (v > 0 ? '+' : '') + v },
      { k: 's', seg: [['+1/2', 's = +½ (↑)'], ['-1/2', 's = −½ (↓)']] },
      { k: 'B', l: 'Từ trường B', min: 0, max: 5, step: 0.5, f: v => v.toFixed(1) + ' T' },
      { btn: 'Soi mặt nút', fn: p => { p.S.nodes = !p.S.nodes; queueReact(p.tab, 'nodes'); } },
      { btn: 'Bắn đo 40 e⁻', fn: p => { p.st.burst = 40; queueReact(p.tab, 'burst'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const n = clamp(Math.round(S.n), 1, 4);
      const l = clamp(Math.round(S.l), 0, n - 1);
      const m = clamp(Math.round(S.m), -l, l);
      const mAbs = Math.abs(m);
      const sUp = S.s === '+1/2';
      const B = S.B;

      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawLabChamberBg(ctx, chX, chY, chW, chH, 10);

      const subName = n + ['s', 'p', 'd', 'f'][l];
      const En = -13.6 / (n * n);
      const Lmag = Math.sqrt(l * (l + 1));
      const nRad = n - l - 1;
      const rMax = ORB_RMAX_A0[n] || 26;

      const topInfo = chY + 34;
      const availH = chH - 46;
      const sqSz = Math.min(availH, chW * 0.52);
      const ox = chX + 18;
      const oy = topInfo + (availH - sqSz) * 0.5;
      const ocx = ox + sqSz * 0.5, ocy = oy + sqSz * 0.5;
      const halfSq = sqSz * 0.5;

      // 1. Vẽ trực tiếp SVG orbital #o{n}{l}{|m|} từ buổi 3.html
      const rec = getOrbitalSVGImage(n, l, m);
      rr(ctx, ox, oy, sqSz, sqSz, 8);
      ctx.fillStyle = '#06030c'; ctx.fill();
      ctx.save();
      rr(ctx, ox, oy, sqSz, sqSz, 8);
      ctx.clip();
      if (rec.ready) ctx.drawImage(rec.img, ox, oy, sqSz, sqSz);

      ln(ctx, ocx, oy + 6, ocx, oy + sqSz - 6, 'rgba(255,255,255,0.18)', 1, [3, 4]);
      txt(ctx, 'z', ocx + 7, oy + 14, 'rgba(255,255,255,0.72)', 10, 'left', 700, MONO);

      // Chiều quay dòng xác suất khi m ≠ 0
      if (m !== 0) {
        const dir = m > 0 ? 1 : -1;
        const rotR = sqSz * 0.44;
        const a0 = t * dir * (1.2 + mAbs * 0.45);
        for (let kArc = 0; kArc < 2; kArc++) {
          const sa = a0 + kArc * Math.PI;
          ctx.beginPath(); ctx.arc(ocx, ocy, rotR, sa, sa + 0.55);
          ctx.strokeStyle = dir > 0 ? hexA(C.c1, 0.72) : hexA(C.c4, 0.72);
          ctx.lineWidth = 2; ctx.stroke();
        }
      }

      // 2. Lớp phủ "Soi mặt nút"
      if (S.nodes) {
        getRadialNodesA0(n, l).forEach(rA0 => {
          const rPx = (rA0 / rMax) * halfSq;
          ctx.beginPath(); ctx.arc(ocx, ocy, rPx, 0, TAU);
          ctx.strokeStyle = 'rgba(155, 231, 255, 0.82)';
          ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
        });

        getAngularNodeAngles(l, mAbs).forEach(th => {
          const dx = Math.sin(th) * halfSq * 1.25;
          const dy = Math.cos(th) * halfSq * 1.25;
          ln(ctx, ocx - dx, ocy - dy, ocx + dx, ocy + dy, 'rgba(155, 231, 255, 0.78)', 1.4, [5, 4]);
          if (th > 0.05 && th < Math.PI * 0.48) {
            ln(ctx, ocx - dx, ocy + dy, ocx + dx, ocy - dy, 'rgba(155, 231, 255, 0.78)', 1.4, [5, 4]);
          }
        });
      }

      // 3. Bắn đo vị trí electron theo đúng |ψ_{nlm}(x, 0, z)|²
      const stateKey = `${n}_${l}_${m}`;
      if (!st.dots || st.key !== stateKey) {
        st.key = stateKey;
        st.dots = [];
        let mx = 1e-12;
        for (let i = 0; i < 1600; i++) {
          const v = hydroProbXZ(n, l, m, rnd(-rMax, rMax), rnd(-rMax, rMax));
          if (v > mx) mx = v;
        }
        st.maxP = mx;
      }
      const addSample = () => {
        for (let tr = 0; tr < 48; tr++) {
          const rx = rnd(-rMax, rMax), rz = rnd(-rMax, rMax);
          if (Math.random() * st.maxP < hydroProbXZ(n, l, m, rx, rz)) {
            st.dots.push({ x: ocx + (rx / rMax) * halfSq, y: ocy - (rz / rMax) * halfSq, life: 1.0 });
            break;
          }
        }
      };
      if (st.burst > 0) {
        const take = Math.min(st.burst, 8);
        for (let i = 0; i < take; i++) addSample();
        st.burst -= take;
      }
      if (st.dots.length > 260) st.dots.splice(0, st.dots.length - 260);
      st.dots.forEach(d => {
        d.life = Math.max(0.28, d.life - dt * 0.25);
        glowDot(ctx, d.x, d.y, 2.5, '#ffffff', hexA('#9be7ff', d.life));
      });

      txt(ctx, subName + '  (' + n + ',' + l + ',' + (m > 0 ? '+' : '') + m + ')', ox + 10, oy + 15, '#fff1b8', 11.5, 'left', 700, MONO);
      txt(ctx, 'Nút: ' + nRad + ' cầu · ' + l + ' góc', ox + sqSz - 10, oy + sqSz - 12, '#9be7ff', 9.5, 'right', 700, MONO);
      ctx.restore();

      rr(ctx, ox, oy, sqSz, sqSz, 8);
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.4; ctx.stroke();

      // 4. KHU PHẢI: Vector tiến động L & Spin S + Hiệu ứng Zeeman
      const rx0 = ox + sqSz + 18;
      const rw = Math.max(120, chX + chW - rx0 - 12);
      const vecH = availH * 0.56;
      const vecY = topInfo;

      rr(ctx, rx0, vecY, rw, vecH, 8);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

      const lcx = rx0 + rw * 0.34, lcy = vecY + vecH * 0.54;
      const lRad = Math.min(rw * 0.24, vecH * 0.38);

      ln(ctx, lcx, lcy + lRad + 12, lcx, lcy - lRad - 14, B > 0 ? C.c2 : C.mut, B > 0 ? 2 : 1.3);
      txt(ctx, B > 0 ? 'B (' + B.toFixed(1) + 'T)' : 'z', lcx + 6, lcy - lRad - 10, B > 0 ? C.c2 : C.mut, 9.5, 'left', 700, MONO);

      if (l > 0) {
        ctx.beginPath(); ctx.arc(lcx, lcy, lRad, 0, TAU);
        ctx.strokeStyle = hexA(C.g, 0.9); ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);

        for (let mk = -l; mk <= l; mk++) {
          const yM = lcy - (mk / Lmag) * lRad;
          const xM = Math.sqrt(Math.max(0, lRad * lRad - (yM - lcy) * (yM - lcy)));
          const active = mk === m;
          ln(ctx, lcx, yM, lcx + xM, yM, active ? hexA(C.main, 0.6) : hexA(C.g, 0.7), 1, [3, 3]);
          if (active) {
            const phiP = t * (1.4 + B * 1.6);
            const pxTip = lcx + Math.cos(phiP) * xM;
            const pyTip = yM + Math.sin(phiP) * xM * 0.22;
            ctx.beginPath();
            ctx.ellipse(lcx, yM, Math.max(1, xM), Math.max(1, xM * 0.22), 0, 0, TAU);
            ctx.strokeStyle = hexA(C.main, 0.48); ctx.lineWidth = 1.3; ctx.stroke();
            ln(ctx, lcx, lcy, pxTip, pyTip, C.main, 2.6);
            glowDot(ctx, pxTip, pyTip, 4, C.ink, hexA(C.main, 0.9));
          }
        }
      } else {
        dot(ctx, lcx, lcy, 5, C.main);
      }
      txt(ctx, '|L|=' + Lmag.toFixed(2) + 'ħ', lcx, vecY + 13, C.main, 10, 'center', 700, MONO);
      txt(ctx, 'L_z=' + (m > 0 ? '+' : '') + m + 'ħ', lcx, vecY + vecH - 12, C.ink, 10, 'center', 700, MONO);

      // Vector Spin S
      const scx = rx0 + rw * 0.76, scy = lcy;
      const sRad = lRad * 0.68;
      ln(ctx, scx, scy + sRad + 10, scx, scy - sRad - 12, C.mut, 1.2);
      ctx.beginPath(); ctx.arc(scx, scy, sRad, 0, TAU);
      ctx.strokeStyle = hexA(C.g, 0.85); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      const sSign = sUp ? 1 : -1;
      const sY = scy - sSign * (0.5 / (Math.sqrt(3) * 0.5)) * sRad;
      const sX = Math.sqrt(Math.max(0, sRad * sRad - (sY - scy) * (sY - scy)));
      const sPhi = t * (2.6 + B * 2.4) * sSign;
      const sCol = sUp ? C.c1 : C.c4;
      ctx.beginPath(); ctx.ellipse(scx, sY, sX, sX * 0.24, 0, 0, TAU);
      ctx.strokeStyle = hexA(sCol, 0.45); ctx.lineWidth = 1.2; ctx.stroke();
      ln(ctx, scx, scy, scx + Math.cos(sPhi) * sX, sY + Math.sin(sPhi) * sX * 0.24, sCol, 2.5);
      glowDot(ctx, scx + Math.cos(sPhi) * sX, sY + Math.sin(sPhi) * sX * 0.24, 3.8, C.ink, hexA(sCol, 0.9));
      txt(ctx, 'Spin ' + (sUp ? '+½ ↑' : '−½ ↓'), scx, vecY + 13, sCol, 10, 'center', 700, MONO);
      txt(ctx, 'S_z=' + (sUp ? '+' : '−') + '½ħ', scx, vecY + vecH - 12, C.ink, 10, 'center', 700, MONO);

      // Hộp Hiệu ứng Zeeman
      const zY = vecY + vecH + 10;
      const zH = Math.max(66, availH - vecH - 10);
      rr(ctx, rx0, zY, rw, zH, 8);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = B > 0 ? hexA(C.c2, 0.6) : C.g; ctx.lineWidth = 1.2; ctx.stroke();

      txt(ctx, B > 0 ? 'HIỆU ỨNG ZEEMAN (Tách ' + (2 * l + 1) + ' mức)' : 'KHÔNG TỪ TRƯỜNG (Suy biến ' + (2 * l + 1) + ' bậc)',
        rx0 + rw * 0.5, zY + 13, B > 0 ? C.c2 : C.ink, 9.8, 'center', 700, MONO);

      const zMidY = zY + zH * 0.56;
      const xBase0 = rx0 + 14, xBase1 = rx0 + rw * 0.34;
      const xSplit0 = rx0 + rw * 0.50, xSplit1 = rx0 + rw - 44;
      ln(ctx, xBase0, zMidY, xBase1, zMidY, C.ink, 2.2);
      txt(ctx, subName, (xBase0 + xBase1) * 0.5, zMidY - 12, C.ink, 10, 'center', 700, MONO);

      const maxSpan = (zH * 0.34) * (B / 5);
      for (let mk = -l; mk <= l; mk++) {
        const frac = l === 0 ? 0 : mk / l;
        const yLv = zMidY - frac * maxSpan;
        const isSel = mk === m;
        ln(ctx, xBase1, zMidY, xSplit0, yLv, isSel ? hexA(C.main, 0.7) : hexA(C.g, 0.7), 1, [3, 3]);
        ln(ctx, xSplit0, yLv, xSplit1, yLv, isSel ? C.main : hexA(C.c2, 0.6), isSel ? 2.8 : 1.5);
        if (isSel || B >= 1.5 || l <= 1) {
          txt(ctx, 'm=' + (mk > 0 ? '+' : '') + mk, xSplit1 + 6, yLv, isSel ? C.main : C.mut, 9.2, 'left', isSel ? 700 : 500, MONO);
        }
      }
      const dE_ueV = m * 57.88 * B;
      txt(ctx, 'ΔE = m·μ_B·B = ' + (dE_ueV >= 0 ? '+' : '') + dE_ueV.toFixed(0) + ' µeV',
        rx0 + rw * 0.5, zY + zH - 10, B > 0 && m !== 0 ? C.main : C.mut, 9.5, 'center', 700, MONO);

      txt(ctx, 'Trạng thái (' + n + ', ' + l + ', ' + (m > 0 ? '+' : '') + m + ', ' + S.s + ')  |  E_' + n + ' = ' + En.toFixed(2) + ' eV',
        chX + 14, chY + 17, C.ink, 11, 'left', 700, MONO);
      txt(ctx, 'Lớp n=' + n + ': ' + (n * n) + ' orbital (' + (2 * n * n) + ' e⁻)  |  Tổng nút = ' + (n - 1),
        chX + chW - 14, chY + 17, C.main, 10.8, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 7 — THÍ NGHIỆM STERN–GERLACH (1922) — CHỨNG MINH SPIN LƯỢNG TỬ (Mục 4.5)
   ========================================================================== */
LABS.push({
  id: 'stern', name: 'Stern–Gerlach (Spin)', no: '7', sec: 4,
  S: { mode: 'quantum', gradB: 75, flip: false },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng chân không Stern–Gerlach (1922) — Tách chùm nguyên tử Ag (l = 0) thành 2 hướng Spin',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['quantum', 'Lượng tử (Spin ±½)'], ['classic', 'Dự đoán Cổ điển']] },
      { k: 'gradB', l: 'Gradient ∂B/∂z', min: 0, max: 100, step: 5, f: v => v + '%' },
      { btn: 'Đảo cực N ↔ S', fn: p => { p.S.flip = !p.S.flip; if (p.st.bins) { p.st.bins.fill(0); p.st.marks = []; } queueReact(p.tab, 'flip'); } },
      { btn: 'Xóa màn dò', fn: p => { if (p.st.bins) { p.st.bins.fill(0); p.st.marks = []; p.st.nUp = 0; p.st.nDn = 0; } } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const isQ = S.mode === 'quantum';
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawLabChamberBg(ctx, chX, chY, chW, chH, 10);

      const midY = chY + chH * 0.54;
      const ovenX = chX + 26;
      const magX0 = chX + chW * 0.25, magX1 = chX + chW * 0.56;
      const scrX = chX + chW * 0.80;
      const scrSpan = Math.min(chH * 0.72, 240);
      const scrTop = midY - scrSpan * 0.5, scrBot = midY + scrSpan * 0.5;
      const pol = S.flip ? -1 : 1;

      const key = S.mode + '_' + S.gradB + '_' + S.flip;
      if (!st.atoms || st.key !== key) {
        st.key = key;
        st.atoms = [];
        st.marks = [];
        st.bins = new Float32Array(72);
        st.acc = 0;
        st.nUp = 0;
        st.nDn = 0;
      }

      // 1. Lò nung Bạc & Khe chuẩn trực
      rr(ctx, ovenX - 16, midY - 26, 36, 52, 6);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.c4; ctx.lineWidth = 1.8; ctx.stroke();
      glowDot(ctx, ovenX + 2, midY, 8, C.main, hexA(C.c4, 0.75));
      txt(ctx, 'Lò Ag', ovenX + 2, midY - 36, C.c4, 10, 'center', 700, MONO);

      const slitX = ovenX + 44;
      ctx.fillStyle = C.sub;
      ctx.fillRect(slitX - 3, midY - 38, 6, 31);
      ctx.fillRect(slitX - 3, midY + 7, 6, 31);

      // 2. Nam châm không đều N–S
      const magW = magX1 - magX0;
      const topCol = S.flip ? C.c1 : C.c4;
      const botCol = S.flip ? C.c4 : C.c1;
      const topLbl = S.flip ? 'S' : 'N';
      const botLbl = S.flip ? 'N' : 'S';

      ctx.beginPath();
      ctx.moveTo(magX0, midY - 76); ctx.lineTo(magX1, midY - 76); ctx.lineTo(magX1, midY - 36);
      ctx.lineTo(magX0 + magW * 0.5, midY - 18); ctx.lineTo(magX0, midY - 36); ctx.closePath();
      ctx.fillStyle = hexA(topCol, 0.25); ctx.fill();
      ctx.strokeStyle = topCol; ctx.lineWidth = 1.8; ctx.stroke();
      txt(ctx, topLbl, magX0 + magW * 0.5, midY - 54, topCol, 14, 'center', 800, MONO);

      ctx.beginPath();
      ctx.moveTo(magX0, midY + 76); ctx.lineTo(magX1, midY + 76); ctx.lineTo(magX1, midY + 34);
      ctx.lineTo(magX0, midY + 34); ctx.closePath();
      ctx.fillStyle = hexA(botCol, 0.25); ctx.fill();
      ctx.strokeStyle = botCol; ctx.lineWidth = 1.8; ctx.stroke();
      txt(ctx, botLbl, magX0 + magW * 0.5, midY + 56, botCol, 14, 'center', 800, MONO);

      if (S.gradB > 0) {
        const al = 0.16 + (S.gradB / 100) * 0.35;
        for (let i = -2; i <= 2; i++) {
          ln(ctx, magX0 + magW * 0.5 + i * 10, midY - 22, magX0 + magW * 0.5 + i * 24, midY + 34, hexA(C.c2, al), 1.1, [3, 3]);
        }
      }

      // 3. Phóng nguyên tử Ag mang vector spin
      const gFrac = S.gradB / 100;
      st.acc += dt * 36;
      while (st.acc >= 1) {
        st.acc -= 1;
        if (st.atoms.length < 75) {
          const sz = isQ ? (Math.random() < 0.5 ? 1 : -1) : rnd(-1, 1);
          st.atoms.push({
            x: ovenX + 18, y: midY + rnd(-2.2, 2.2), vx: 230, vy: 0, sz,
            ang: isQ ? (sz > 0 ? -Math.PI * 0.5 : Math.PI * 0.5) : Math.acos(sz) - Math.PI * 0.5
          });
        }
      }

      const forceScale = 310 * gFrac * pol;
      for (let i = st.atoms.length - 1; i >= 0; i--) {
        const a = st.atoms[i];
        if (a.x >= magX0 && a.x <= magX1) a.vy -= a.sz * forceScale * dt;
        a.x += a.vx * dt; a.y += a.vy * dt;

        const col = isQ ? (a.sz > 0 ? C.c1 : C.c4) : C.c3;
        glowDot(ctx, a.x, a.y, 3.2, C.ink, hexA(col, 0.85));
        dot(ctx, a.x, a.y, 2.8, col);
        const vx = Math.cos(a.ang) * 7, vy = Math.sin(a.ang) * 7;
        ln(ctx, a.x - vx * 0.4, a.y - vy * 0.4, a.x + vx, a.y + vy, col, 1.5);

        if (a.x >= scrX) {
          const u = clamp((a.y - scrTop) / scrSpan, 0.01, 0.99);
          const bi = clamp(Math.floor(u * st.bins.length), 0, st.bins.length - 1);
          st.bins[bi]++;
          st.marks.push({ x: scrX + rnd(-9, 9), y: clamp(a.y, scrTop + 4, scrBot - 4), col });
          if (st.marks.length > 500) st.marks.shift();
          if (a.sz >= 0) st.nUp++; else st.nDn++;
          st.atoms.splice(i, 1);
        } else if (a.y < chY + 24 || a.y > chY + chH - 12) {
          st.atoms.splice(i, 1);
        }
      }

      // 4. Màn dò tích lũy
      rr(ctx, scrX - 12, scrTop, 24, scrSpan, 4);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.4; ctx.stroke();

      st.marks.forEach(mk => { dot(ctx, mk.x, mk.y, 1.9, hexA(mk.col, 0.82)); });

      const barX = scrX + 18, barMaxW = Math.max(24, chX + chW - barX - 14);
      let maxB = 1;
      for (let i = 0; i < st.bins.length; i++) if (st.bins[i] > maxB) maxB = st.bins[i];
      const bh = scrSpan / st.bins.length;
      for (let i = 0; i < st.bins.length; i++) {
        const wB = (st.bins[i] / maxB) * barMaxW;
        if (wB < 0.5) continue;
        const yB = scrTop + i * bh;
        const colB = isQ ? ((yB < midY) === !S.flip ? C.c1 : C.c4) : C.c3;
        ctx.fillStyle = hexA(colB, 0.78);
        ctx.fillRect(barX, yB, wB, Math.max(1.5, bh - 0.3));
      }

      if (isQ && S.gradB >= 20) {
        const yOff = clamp(gFrac * scrSpan * 0.30, 16, scrSpan * 0.36);
        txt(ctx, 's = +½ (↑)', scrX - 18, midY - pol * yOff, C.c1, 10, 'right', 700, MONO);
        txt(ctx, 's = −½ (↓)', scrX - 18, midY + pol * yOff, C.c4, 10, 'right', 700, MONO);
      }

      txt(ctx, 'Nguyên tử Ag (5s¹, l = 0)  |  Lực tách F_z = μ_z·(∂B/∂z)',
        chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
      txt(ctx, isQ ? 'LƯỢNG TỬ: CHỈ 2 VẾT RỜI RẠC (↑ ' + st.nUp + ' · ↓ ' + st.nDn + ')' : 'CỔ ĐIỂN: 1 DẢI VỆT LIÊN TỤC (Bị thực nghiệm bác bỏ)',
        chX + chW - 14, chY + 18, isQ ? C.c1 : C.c3, 10.8, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 8 — ĐÁM MÂY ORBITAL 3D XOAY & CẤU HÌNH ELECTRON PAULI (Z = 1..18)
   ========================================================================== */
const ELEMS = [
  null,
  ['H', 'Hydro'], ['He', 'Heli'], ['Li', 'Liti'], ['Be', 'Beri'], ['B', 'Bo'],
  ['C', 'Cacbon'], ['N', 'Nitơ'], ['O', 'Oxy'], ['F', 'Flo'], ['Ne', 'Neon'],
  ['Na', 'Natri'], ['Mg', 'Magie'], ['Al', 'Nhôm'], ['Si', 'Silicon'],
  ['P', 'Photpho'], ['S', 'Lưu huỳnh'], ['Cl', 'Clo'], ['Ar', 'Argon']
];

const PAULI_BOXES = [
  { sub: '1s', n: 1, boxes: 1 },
  { sub: '2s', n: 2, boxes: 1 },
  { sub: '2p', n: 2, boxes: 3 },
  { sub: '3s', n: 3, boxes: 1 },
  { sub: '3p', n: 3, boxes: 3 }
];

function fillPauli(Z) {
  let rem = Z;
  const out = [];
  PAULI_BOXES.forEach(s => {
    const arr = Array.from({ length: s.boxes }, () => ({ up: false, dn: false }));
    // Quy tắc Hund: điền spin lên (↑) khắp các ô trước rồi mới ghép cặp spin xuống (↓)
    for (let i = 0; i < s.boxes && rem > 0; i++) { arr[i].up = true; rem--; }
    for (let i = 0; i < s.boxes && rem > 0; i++) { arr[i].dn = true; rem--; }
    out.push({ ...s, slots: arr });
  });
  return out;
}

LABS.push({
  id: 'atom', name: 'Vỏ e⁻ & Pauli', no: '8', sec: 4,
  S: { mode: 'pauli', orb: '2s', slice: 'off', Z: 14 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Nguyên lý loại trừ Pauli (Z = 1..18) & Đám mây Orbital 3D tương tác',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['pauli', 'Bảng Pauli (Z=1..18)'], ['orb', 'Mây Orbital 3D']] },
      { k: 'Z', l: 'Số hiệu Z', min: 1, max: 18, step: 1, f: v => v + ' (' + ELEMS[v][0] + ')' },
      { k: 'orb', seg: [['1s', '1s'], ['2s', '2s'], ['2p', '2p_z'], ['3d', '3d_z²']] },
      { k: 'slice', seg: [['off', 'Toàn khối'], ['on', 'Cắt lát']] },
      { btn: 'Silicon (Z=14)', fn: p => { p.S.mode = 'pauli'; p.S.Z = 14; p.syncCtrls(); queueReact(p.tab, 'Z'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawLabChamberBg(ctx, chX, chY, chW, chH, 10);

      // Gắn tương tác kéo xoay 3D cho chế độ Mây Orbital 3D
      if (!st.dragBound && p.cv) {
        st.dragBound = true;
        st.rotY = 0.5; st.rotX = 0.35; st.dragging = false;
        p.cv.addEventListener('pointerdown', e => { st.dragging = true; st.lx = e.clientX; st.ly = e.clientY; });
        window.addEventListener('pointermove', e => {
          if (!st.dragging) return;
          st.rotY += (e.clientX - st.lx) * 0.009;
          st.rotX = clamp(st.rotX + (e.clientY - st.ly) * 0.009, -1.4, 1.4);
          st.lx = e.clientX; st.ly = e.clientY;
        });
        window.addEventListener('pointerup', () => { st.dragging = false; });
      }

      if (S.mode === 'pauli') {
        const Z = clamp(Math.round(S.Z), 1, 18);
        const filled = fillPauli(Z);
        const shellCounts = [0, 0, 0];
        filled.forEach(s => s.slots.forEach(sl => {
          if (sl.up) shellCounts[s.n - 1]++;
          if (sl.dn) shellCounts[s.n - 1]++;
        }));
        const outerN = shellCounts[2] > 0 ? 3 : shellCounts[1] > 0 ? 2 : 1;
        const valence = shellCounts[outerN - 1];

        // Trái: Nguyên tử với các lớp vỏ K, L, M quay quanh hạt nhân +Z
        const cx = chX + chW * 0.28, cy = chY + chH * 0.54;
        const maxR = Math.min(chW * 0.22, chH * 0.36);
        const radii = [maxR * 0.36, maxR * 0.68, maxR * 1.0];

        radii.forEach((rad, si) => {
          const cnt = shellCounts[si];
          if (cnt === 0 && si > 0) return;
          const isVal = si + 1 === outerN;
          ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU);
          ctx.strokeStyle = isVal ? hexA(C.c4, 0.7) : hexA(C.g, 0.9);
          ctx.lineWidth = isVal ? 1.8 : 1.1; ctx.stroke();

          for (let i = 0; i < cnt; i++) {
            const ang = (i / cnt) * TAU + t * (1.5 / (si + 1)) * (si % 2 === 0 ? 1 : -1);
            const ex = cx + Math.cos(ang) * rad, ey = cy + Math.sin(ang) * rad;
            const col = isVal ? C.c4 : C.c2;
            glowDot(ctx, ex, ey, 4.2, C.ink, hexA(col, 0.85));
            dot(ctx, ex, ey, 3.5, col);
          }
        });
        glowDot(ctx, cx, cy, 13, C.ink, hexA(C.main, 0.8));
        dot(ctx, cx, cy, 13, C.main);
        txt(ctx, ELEMS[Z][0], cx, cy + 0.5, C.bg, 11, 'center', 800, MONO);

        // Phải: Sơ đồ ô lượng tử Pauli & Quy tắc Hund (1s, 2s, 2p, 3s, 3p)
        const bx0 = chX + chW * 0.52;
        const rowH = (chH - 72) / 3;
        const boxW = Math.min(38, (chW * 0.42) / 5.2);
        const boxH = Math.min(34, rowH * 0.58);

        [3, 2, 1].forEach((nLv, ri) => {
          const ry = chY + 58 + ri * rowH;
          const isOuter = nLv === outerN;
          txt(ctx, 'n=' + nLv, bx0 - 12, ry + boxH * 0.5, isOuter ? C.c4 : C.ink, 11, 'right', 700, MONO);

          let curX = bx0;
          filled.filter(s => s.n === nLv).forEach(sub => {
            txt(ctx, sub.sub, curX + (sub.boxes * (boxW + 4) - 4) * 0.5, ry - 11, C.mut, 10, 'center', 700, MONO);
            sub.slots.forEach(sl => {
              rr(ctx, curX, ry, boxW, boxH, 5);
              ctx.fillStyle = C.bg; ctx.fill();
              ctx.strokeStyle = (sl.up || sl.dn) ? (isOuter ? C.c4 : C.c2) : C.g;
              ctx.lineWidth = (sl.up || sl.dn) ? 1.8 : 1.1; ctx.stroke();
              const sym = (sl.up ? '↑' : '') + (sl.dn ? '↓' : '');
              if (sym) txt(ctx, sym, curX + boxW * 0.5, ry + boxH * 0.5 + 1, isOuter ? C.c4 : C.c2, 14, 'center', 700, MONO);
              curX += boxW + 4;
            });
            curX += 14;
          });
        });

        const cfgStr = filled.map(s => {
          const cnt = s.slots.reduce((a, b) => a + (b.up ? 1 : 0) + (b.dn ? 1 : 0), 0);
          return cnt > 0 ? s.sub + sup(cnt) : '';
        }).filter(Boolean).join(' ');

        txt(ctx, ELEMS[Z][1] + ' (' + ELEMS[Z][0] + ', Z = ' + Z + ')  |  ' + cfgStr,
          chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
        txt(ctx, 'Lớp ngoài n=' + outerN + ': ' + valence + ' e⁻ hóa trị',
          chX + chW - 14, chY + 18, C.c4, 10.8, 'right', 700, MONO);
      } else {
        // Chế độ Mây Orbital 3D tương tác (xoay bằng chuột & cắt lát)
        if (!st.dragging) st.rotY += dt * 0.45;
        const orbKey = S.orb;
        if (!st.cloud || st.cKey !== orbKey) {
          st.cKey = orbKey;
          const pts = [];
          const mapNLM = { '1s': [1,0,0,5.5], '2s': [2,0,0,12], '2p': [2,1,0,12], '3d': [3,2,0,22] }[orbKey];
          const [nn, ll, mm, rm] = mapNLM;
          let mx = 1e-12;
          for (let i = 0; i < 1500; i++) {
            const v = hydroProbXZ(nn, ll, mm, rnd(-rm, rm), rnd(-rm, rm));
            if (v > mx) mx = v;
          }
          let tries = 0;
          while (pts.length < 900 && tries < 60000) {
            tries++;
            const x = rnd(-rm, rm), y = rnd(-rm, rm), z = rnd(-rm, rm);
            const r = Math.hypot(x, y, z);
            if (r > rm) continue;
            const rhoXY = Math.hypot(x, y);
            const pr = hydroProbXZ(nn, ll, mm, rhoXY, z);
            if (Math.random() * mx < pr) {
              pts.push({ x: x / rm, y: z / rm, z: y / rm, rNorm: r / rm });
            }
          }
          st.cloud = pts;
        }

        const cx = chX + chW * 0.5, cy = chY + chH * 0.53;
        const sc = Math.min(chW, chH) * 0.42;
        const cY = Math.cos(st.rotY), sY = Math.sin(st.rotY);
        const cX = Math.cos(st.rotX), sX = Math.sin(st.rotX);

        // Hạt nhân ở tâm
        glowDot(ctx, cx, cy, 5, C.ink, hexA(C.c4, 0.9));

        st.cloud.forEach(pt => {
          if (S.slice === 'on' && pt.z > 0.08) return;
          const x1 = pt.x * cY - pt.z * sY;
          const z1 = pt.x * sY + pt.z * cY;
          const y2 = pt.y * cX - z1 * sX;
          const z2 = pt.y * sX + z1 * cX;
          const persp = 2.8 / (2.8 - z2 * 0.7);
          const sx = cx + x1 * sc * persp;
          const sy = cy - y2 * sc * persp;
          const col = pt.rNorm < 0.28 ? C.main : pt.y >= 0 ? C.c2 : C.c5;
          dot(ctx, sx, sy, 1.55 * persp, hexA(col, clamp(0.42 + z2 * 0.25, 0.15, 0.85)));
        });

        const peakInfo = {
          '1s': 'Đỉnh xuyên tâm tại r = a₀ = 0.529 Å (0 nút)',
          '2s': 'Đỉnh chính tại r ≈ 5.2 a₀ (1 mặt cầu nút tại r = 2 a₀)',
          '2p': '2 thùy dọc trục z (1 mặt phẳng nút z = 0)',
          '3d': '2 thùy dọc trục z + vành xích đạo (2 mặt nón nút)'
        }[orbKey];
        txt(ctx, 'Đám mây 3D Orbital ' + orbKey + (S.slice === 'on' ? ' (Đã cắt lát)' : ''), chX + 14, chY + 18, C.ink, 11, 'left', 700, MONO);
        txt(ctx, peakInfo, chX + chW - 14, chY + 18, C.main, 10.5, 'right', 700, MONO);
      }
    }
  }]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM (Log intro + react chi tiết cho cả 8 tab Buổi 3)
   ========================================================================== */
const LD = {};

LD.free = {
  intro: [
    ['i', 'Electron tự do (V = 0): Không chịu lực tác dụng, nghiệm phương trình Schrödinger là sóng phẳng Ψ(x,t) = A·e^{j(kx−ωt)}.'],
    ['w', 'Dấu của số sóng k quyết định chiều truyền: k > 0 sóng chạy về +x, k < 0 sóng chạy ngược về −x; năng lượng E = ħ²k²/2m nhận mọi giá trị liên tục.'],
    ['v', 'Bấm nhanh "Câu 1a (+8×10⁸)" và "Câu 1b (−15×10⁸)" để đối chiếu trực tiếp kết quả λ, p và động năng E của Bài tập 1!']
  ],
  react(S, k, P, say) {
    const kSI = S.k * 1e8;
    const pSI = HBAR * kSI;
    const E_eV = ((pSI * pSI) / (2 * ME)) / EV;
    const lam = Math.abs(kSI) > 1 ? (TAU / Math.abs(kSI)) * 1e9 : Infinity;
    say('v', `k = ${S.k.toFixed(1)}×10⁸ m⁻¹ → λ = ${isFinite(lam) ? lam.toFixed(2) + ' nm' : '∞'}, p = ${sci(pSI, 2)} kg·m/s, E = ${(E_eV * 1000).toFixed(1)} meV.`);
    if (S.k < 0) say('w', 'k < 0: Sóng phẳng và vector động lượng p hướng ngược theo chiều âm trục x (−x), nhưng bước sóng λ và động năng E vẫn dương.');
  }
};

LD.well = {
  intro: [
    ['i', 'Giếng thế vô hạn 1 chiều (V = ∞ tại x = 0 và x = a): Sóng vật chất bị phản xạ qua lại tạo sóng dừng ψ_n(x) = √(2/a)·sin(nπx/a).'],
    ['w', 'Điều kiện biên ψ(0) = ψ(a) = 0 ép năng lượng bị lượng tử hóa: E_n = n²π²ħ²/(2ma²) — tăng rất nhanh theo n² và tỉ lệ nghịch với a².'],
    ['v', 'Giếng mặc định để a = 75 Å khớp Câu 2 (E₁ = 6.69 meV, E₂ = 26.8 meV, E₃ = 60.2 meV). Thử đổi n để xem phát/hấp thụ photon!']
  ],
  react(S, k, P, say) {
    const n = Math.round(S.n);
    const a_m = S.a * 1e-10;
    const E1 = (Math.PI * Math.PI * HBAR * HBAR / (2 * ME * a_m * a_m)) / EV;
    const En = n * n * E1;
    say('v', `a = ${S.a} Å, n = ${n} → E_${n} = ${En < 0.1 ? (En * 1000).toFixed(2) + ' meV' : En.toFixed(3) + ' eV'} (E₁ = ${E1 < 0.1 ? (E1 * 1000).toFixed(2) + ' meV' : E1.toFixed(3) + ' eV'}).`);
    if (k === 'a' && S.a <= 10) say('w', 'Giếng siêu hẹp (a nhỏ): Khoảng cách giữa các mức năng lượng vọt lên hàng eV do E ∝ 1/a²!');
  }
};

LD.step = {
  intro: [
    ['i', 'Bậc thế năng khi E < V₀: Cơ học cổ điển cấm tuyệt đối hạt đi vào vùng x > 0, nhưng sóng lượng tử vẫn đâm xuyên một đoạn ngắn theo hàm mũ e^(−k₂x).'],
    ['w', 'Mật độ xác suất tương đối tại độ sâu x so với mép biên là |ψ₂(x)|²/|ψ₂(0)|² = e^(−2k₂x), với k₂ = √(2m(V₀−E))/ħ.'],
    ['v', 'Bấm nút "Câu 3 (5 / 15 / 40 Å)" để dịch đầu dò đúng 3 mốc của Bài tập 3 (E = 2.8 eV, V₀ = 3.5 eV) và kiểm tra kết quả 1.38%, 2.6×10⁻⁶, 1.3×10⁻¹⁵!']
  ],
  react(S, k, P, say) {
    if (S.E >= S.V0) {
      say('w', `E = ${S.E.toFixed(1)} eV ≥ V₀ = ${S.V0.toFixed(1)} eV: Hạt vượt lên trên đỉnh bậc thế nên sóng truyền tiếp sang vùng II (chỉ phản xạ một phần).`);
      return;
    }
    const k2 = Math.sqrt(2 * ME * (S.V0 - S.E) * EV) / HBAR;
    const pRel = Math.exp(-2 * k2 * (S.xProbe * 1e-10));
    say('v', `E = ${S.E.toFixed(1)} eV, V₀ = ${S.V0.toFixed(1)} eV → k₂ = ${sci(k2, 2)} m⁻¹. Tại x = ${S.xProbe} Å: |ψ|²/|ψ(0)|² = ${pRel >= 0.001 ? (pRel * 100).toFixed(2) + '%' : sci(pRel, 2)}.`);
  }
};

LD.tunnel = {
  intro: [
    ['i', 'Xuyên hầm lượng tử (Tunneling): Khi rào thế hữu hạn đủ mỏng (bề rộng a cỡ vài nm), đuôi hàm mũ chưa tắt hẳn đã chạm mép phải và tái sinh thành sóng chạy!'],
    ['w', 'Hệ số xuyên hầm T ≈ 16(E/V₀)(1−E/V₀)·e^(−2k₂a) phụ thuộc cực nhạy theo hàm mũ vào độ dày a và khối lượng hiệu dụng m*.'],
    ['v', 'Chuyển đổi giữa GaAs (m* = 0.067 m₀) và Silicon (m* = 1.08 m₀) ở Câu 4 (a = 15 Å, E = 0.2 eV, V₀ = 0.8 eV) để thấy kim dòng rò chênh nhau hơn 10.000 lần!']
  ],
  react(S, k, P, say) {
    const mRatio = S.mat === 'gaas' ? 0.067 : 1.08;
    const E_eff = Math.min(S.E, S.V0 - 0.02);
    const k2 = Math.sqrt(2 * mRatio * ME * (S.V0 - E_eff) * EV) / HBAR;
    const r = E_eff / S.V0;
    const T_wkb = 16 * r * (1 - r) * Math.exp(-2 * k2 * S.a * 1e-10);
    say('v', `${S.mat === 'gaas' ? 'GaAs' : 'Silicon'} (a = ${S.a} Å): k₂ = ${sci(k2, 2)} m⁻¹, 2k₂a = ${(2 * k2 * S.a * 1e-10).toFixed(2)} → T_WKB ≈ ${T_wkb >= 0.001 ? (T_wkb * 100).toFixed(1) + '%' : sci(T_wkb, 2)}.`);
    if (k === 'mat') say('w', S.mat === 'gaas' ? 'Electron trong GaAs nhẹ hơn trong Si 16 lần nên xuyên hầm cực mạnh!' : 'Electron trong Si có khối lượng hiệu dụng lớn nên xác suất xuyên hầm tụt giảm dữ dội.');
  }
};

LD.asym = {
  intro: [
    ['i', 'Giếng thế bất đối xứng (Câu 5): Vùng I có rào hữu hạn V₀, Vùng II (0 < x < a) có V = 0, còn Vùng III là vách vô hạn V = ∞.'],
    ['w', 'Tại x = 0 (vách hữu hạn), hàm sóng ψ và đạo hàm ψ′ liên tục nên có đuôi hàm mũ e^{+k₁x} rò sâu sang trái; tại x = a (vách vô hạn), ψ(a) = 0 tuyệt đối!'],
    ['w', 'Khử các hệ số biên độ thu được phương trình siêu việt tan(k₂a) = −k₂/k₁ — chỉ nhận các mức năng lượng rời rạc thấp hơn mức của giếng vô hạn cùng bề rộng a.'],
    ['v', 'Thử bấm "Ngưỡng mất mức" (V₀ = 0.4 eV, a = 4 Å) để thấy khi R ≤ π/2, giếng bất đối xứng không giữ nổi bất kỳ trạng thái liên kết nào!']
  ],
  react(S, k, P, say) {
    const { R, states } = solveAsymWell(S.V0, S.a);
    if (!states.length) {
      say('w', `V₀ = ${S.V0.toFixed(1)} eV, a = ${S.a} Å → R = ${R.toFixed(2)} ≤ π/2 (1.57): Không có trạng thái liên kết nào tồn tại!`);
      return;
    }
    const cur = states[clamp(Math.round(S.n) - 1, 0, states.length - 1)];
    say('v', `Có ${states.length} mức liên kết. Mức n = ${cur.n}: E_${cur.n} = ${cur.E_eV.toFixed(3)} eV, xác suất rò sang Vùng I là ${(cur.pLeak * 100).toFixed(1)}%.`);
    if (k === 'V0' && S.V0 >= 4.0) say('i', 'Khi V₀ càng lớn, đuôi sóng rò sang trái càng ngắn và E_n tiến sát giá trị của giếng thế vô hạn!');
  }
};

LD.orbitals = {
  intro: [
    ['i', '4 số lượng tử (n, l, m, s) xác định duy nhất một trạng thái electron trong nguyên tử Hydro với chuỗi ràng buộc: 0 ≤ l ≤ n−1 và −l ≤ m ≤ l.'],
    ['w', 'Khung trái dùng trực tiếp mặt cắt xz của mật độ |ψ_{nlm}|²: đếm vòng tối đồng tâm = số nút xuyên tâm (n−l−1), đếm vạch tối qua tâm = số nút góc (l).'],
    ['w', 'Khung phải mô phỏng vector moment động lượng quỹ đạo L (dài √(l(l+1))ħ) tiến động quanh trục từ trường B với hình chiếu L_z = mħ và vector spin S (±½ħ).'],
    ['v', 'Tăng từ trường B > 0 T để quan sát Hiệu ứng Zeeman tách phân lớp thành 2l+1 mức năng lượng, hoặc bấm "Bắn đo 40 e⁻" xem hạt rơi đúng vào các thùy sáng!']
  ],
  react(S, k, P, say) {
    const n = Math.round(S.n), l = Math.min(Math.round(S.l), n - 1), m = clamp(Math.round(S.m), -l, l);
    const sub = n + ['s', 'p', 'd', 'f'][l];
    if (k === 'burst') {
      say('v', `Đã bắn đo 40 electron trên orbital ${sub} (${n},${l},${m}): Các chấm sáng tập trung vào vùng sáng và tránh tuyệt đối các mặt nút!`);
      return;
    }
    if (k === 'nodes') {
      say('i', S.nodes ? `Đang soi mặt nút: ${n - l - 1} nút cầu xuyên tâm + ${l} nút góc = ${n - 1} nút.` : 'Đã ẩn lưới soi mặt nút.');
      return;
    }
    if (k === 'B') {
      const dE = m * 57.88 * S.B;
      say('w', S.B > 0
        ? `Hiệu ứng Zeeman ở B = ${S.B.toFixed(1)} T: Phân lớp ${sub} tách thành ${2 * l + 1} mức cách đều μ_B·B = ${(57.88 * S.B).toFixed(0)} µeV (m = ${m} dịch ${dE >= 0 ? '+' : ''}${dE.toFixed(0)} µeV).`
        : 'Đã tắt từ trường (B = 0 T): Các trạng thái m khác nhau quay về cùng mức năng lượng suy biến.');
      return;
    }
    say('v', `Orbital ${sub} (${n}, ${l}, ${m > 0 ? '+' : ''}${m}, ${S.s}): E_${n} = ${(-13.6 / (n * n)).toFixed(2)} eV, |L| = ${Math.sqrt(l * (l + 1)).toFixed(2)}ħ, L_z = ${m}ħ.`);
  }
};

LD.stern = {
  intro: [
    ['i', 'Thí nghiệm Stern–Gerlach (1922): Chùm nguyên tử Bạc (Ag, electron hóa trị 5s¹ có l = 0) bay qua từ trường không đều N–S.'],
    ['w', 'Vì l = 0, moment động lượng quỹ đạo bằng 0; thế nhưng chùm tia vẫn tách đúng làm 2 nhánh đối xứng → chứng minh electron có Spin nội tại s = ±½!'],
    ['v', 'Chuyển sang "Dự đoán Cổ điển" để so sánh 1 vệt dài liên tục với 2 vết rời rạc của cơ học lượng tử, hoặc thử bấm "Đảo cực N ↔ S"!']
  ],
  react(S, k, P, say) {
    if (k === 'mode') {
      say('w', S.mode === 'quantum'
        ? 'Chế độ Lượng tử: Hình chiếu spin chỉ nhận 2 giá trị rời rạc S_z = ±ħ/2 → tích lũy đúng 2 vết sắc nét trên màn.'
        : 'Dự đoán Cổ điển: Nếu nam châm nguyên tử quay theo mọi góc ngẫu nhiên, chùm tia sẽ dàn đều thành 1 dải liên tục.');
    } else if (k === 'flip') {
      say('v', 'Đã đảo cực nam châm N ↔ S: Gradient từ trường đổi chiều khiến 2 nhánh spin ↑ và ↓ đổi vị trí trên màn dò.');
    } else if (k === 'gradB') {
      say('v', S.gradB === 0 ? 'Tắt từ trường (∂B/∂z = 0): Lực F_z = 0, toàn bộ chùm Ag đi thẳng vào 1 điểm chính giữa.' : `Gradient từ trường ∂B/∂z = ${S.gradB}%: Lực tách F_z tăng tỉ lệ thuận làm 2 vết rời xa nhau hơn.`);
    }
  }
};

LD.atom = {
  intro: [
    ['i', 'Nguyên lý loại trừ Pauli: Không có hai electron nào trong cùng nguyên tử có cùng bộ 4 số lượng tử (n, l, m, s) → mỗi ô orbital chứa tối đa 2 electron ngược spin (↑↓).'],
    ['w', 'Ở chế độ "Bảng Pauli", kéo Z từ 1 đến 18 để xem thứ tự điền lớp vỏ K, L, M và Quy tắc Hund trên các phân lớp p.'],
    ['v', 'Chuyển sang "Mây Orbital 3D" để kéo chuột xoay đám mây xác suất 3 chiều và bật "Cắt lát" để soi lõi bên trong orbital 2s!']
  ],
  react(S, k, P, say) {
    if (S.mode === 'orb') {
      say('v', `Đám mây 3D orbital ${S.orb} (${S.slice === 'on' ? 'đang cắt lát xích đạo' : 'toàn khối 3D'}): Kéo chuột để xoay góc nhìn.`);
      return;
    }
    const Z = Math.round(S.Z);
    if (Z === 3) say('i', 'Liti (Z=3): Ô 1s đã kín 2 spin ngược nhau (↑↓) → Nguyên lý Pauli đẩy electron thứ 3 lên lớp 2s!');
    else if (Z === 7) say('w', 'Nitơ (Z=7): Quy tắc Hund — 3 electron phân lớp 2p đứng riêng vào 3 ô với spin song song (↑ ↑ ↑).');
    else if (Z === 14) say('i', 'SILICON (Z=14): Có đúng 4 electron hóa trị ở lớp n=3 (3s² 3p²), nền tảng của toàn bộ công nghiệp vi mạch bán dẫn!');
    else say('v', `${ELEMS[Z][1]} (${ELEMS[Z][0]}, Z = ${Z}): Đã cập nhật lớp vỏ nguyên tử và sơ đồ ô lượng tử Pauli.`);
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
.lb3-k input[type=range]{width:clamp(64px,7vw,108px);margin:0;accent-color:var(--main)}
.lb3-k output{color:var(--ink);font-weight:700;min-width:2.6em}
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
@media(max-width:900px){.lb3-win{width:100vw;height:100dvh;border-radius:0}.lb3-b{overflow:auto;display:flex;flex-direction:column}.lb3-p{min-height:280px;flex:none}}
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
    b.textContent = (l.no || l.sec) + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b);
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
  [/^4\.[1234]/, 'orbitals', 0],
  [/^4\.5/, 'stern', 0],
  [/^4\.[67]/, 'atom', 0],
  [/^Câu 5/, 'asym', 0]
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
    const m = /^\s*(\d+)\./.exec(h.textContent); if (!m) return;
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