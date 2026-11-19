/* ==========================================================================
   lab-b2.js — PHÒNG THÍ NGHIỆM CƠ HỌC LƯỢNG TỬ BUỔI 2 (Mô phỏng Thực tế)
   - Tự chứa hoàn toàn: tự chèn CSS + HTML popup, đồng bộ 100% bảng màu & font trang.
   - Không biểu đồ, không ô HUD thừa, canvas sạch sẽ không có chữ mờ phụ trợ.
   - 5 tab thí nghiệm nền tảng của Buổi 2:
       1. Hiệu ứng quang điện: Ống chân không, đèn đơn sắc, điện áp hãm & Ampe kế
       2. Khe đôi de Broglie: Bắn từng electron qua 2 khe hẹp & tích lũy vân giao thoa
       3. Bất định Heisenberg: Khép mở khe hẹp Δy → chùm electron loe rộng Δp_y
       4. Nguyên tử Bohr (H): Sóng dừng tròn 2πr = nλ, nhảy mức phát/hấp thụ photon
       5. Tán xạ Compton: Va chạm photon tia X – electron, giãn bước sóng Δλ & giật lùi
   - API: LabB2.open(tabId?, panelIndex?)  LabB2.close()  LabB2.mark(root)  LabB2.tabs()
   ========================================================================== */
(function () {
'use strict';

/* ---------- Hằng số vật lý & tiện ích toán học ---------- */
const TAU = Math.PI * 2;
const H_PL = 6.62607015e-34; // J·s
const HBAR = 1.0545718e-34;  // J·s
const ME = 9.1093837e-31;    // kg
const EV = 1.6021766e-19;    // J
const C_LIGHT = 2.99792458e8; // m/s
const LAM_C = 0.024263;      // Å (Bước sóng Compton h / m_e c)

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

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

/* Chuyển bước sóng (nm) sang màu RGB quang phổ thật */
function wlRGB(wl) {
  let r = 0, g = 0, b = 0;
  if (wl < 380) { r = 0.58; g = 0.28; b = 1.0; }
  else if (wl < 440) { r = -(wl - 440) / 60; g = 0; b = 1; }
  else if (wl < 490) { r = 0; g = (wl - 440) / 50; b = 1; }
  else if (wl < 510) { r = 0; g = 1; b = -(wl - 510) / 20; }
  else if (wl < 580) { r = (wl - 510) / 70; g = 1; b = 0; }
  else if (wl < 645) { r = 1; g = -(wl - 645) / 65; b = 0; }
  else if (wl <= 780) { r = 1; g = 0.08; b = 0.08; }
  else { r = 0.92; g = 0.22; b = 0.28; }
  const R = Math.round(r * 255), G = Math.round(g * 255), B = Math.round(b * 255);
  return {
    css: `rgb(${R},${G},${B})`,
    rgba: a => `rgba(${R},${G},${B},${a})`
  };
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
function drawChamber(ctx, x, y, w, h, r = 8) {
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

const LABS = [];

/* ==========================================================================
   TAB 1 — HIỆU ỨNG QUANG ĐIỆN (PHOTOELECTRIC EFFECT)
   Ống chân không với nguồn đèn đơn sắc chiếu bó photon (màu quang phổ thật)
   vào bản Cathode kim loại (Cs, Na, Al, Cu), bật electron quang điện bay sang
   Anode dưới tác dụng điện áp hãm / tăng tốc V + Ampe kế kim cơ.
   ========================================================================== */
const METALS = {
  cs: { sym: 'Cs', name: 'Xesi (Cs)', phi: 2.14, col: '#e2b714' },
  na: { sym: 'Na', name: 'Natri (Na)', phi: 2.28, col: '#86c27e' },
  al: { sym: 'Al', name: 'Nhôm (Al)', phi: 4.08, col: '#7aa2f7' },
  cu: { sym: 'Cu', name: 'Đồng (Cu)', phi: 4.70, col: '#e06c75' }
};

LABS.push({
  id: 'photo', name: 'Quang điện', no: '1', secs: [1],
  S: { metal: 'na', wl: 360, inten: 65, V: 0.0 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Ống quang điện chân không — Đèn đơn sắc, Cathode kim loại & Điện áp hãm',
    area: 'a', anim: true,
    ctrls: [
      { k: 'metal', seg: [['cs', 'Cs (2.14eV)'], ['na', 'Na (2.28eV)'], ['al', 'Al (4.08eV)'], ['cu', 'Cu (4.70eV)']] },
      { k: 'wl', l: 'Bước sóng λ', min: 180, max: 700, step: 5, f: v => v + ' nm' },
      { k: 'inten', l: 'Cường độ', min: 15, max: 100, step: 5, f: v => v + '%' },
      { k: 'V', l: 'Điện áp V', min: -3.5, max: 2.0, step: 0.1, f: v => (v > 0 ? '+' : '') + v.toFixed(1) + ' V' }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const m = METALS[S.metal];
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      // Vật lý chuẩn: E_photon = hc / λ (eV) ≈ 1239.84 / λ(nm)
      const E_ph = 1239.84 / S.wl;
      const Kmax = Math.max(0, E_ph - m.phi);
      const canEmit = E_ph > m.phi;
      const Vstop = Kmax; // Điện áp hãm độ lớn = Kmax (V)
      const rgb = wlRGB(S.wl);

      // Tọa độ ống chân không trung tâm
      const tubeW = chW * 0.68, tubeH = Math.min(chH * 0.56, 210);
      const tubeX = chX + (chW - tubeW) * 0.5, tubeY = chY + chH * 0.44 - tubeH * 0.5;
      const catX = tubeX + 26, anoX = tubeX + tubeW - 26;
      const plateTop = tubeY + 26, plateBot = tubeY + tubeH - 26;
      const plateMidY = (plateTop + plateBot) * 0.5;

      // 1. Đèn đơn sắc phía trên chiếu chéo xuống bản Cathode
      const lampX = tubeX + tubeW * 0.52, lampY = chY + 28;
      // Chùm sáng đơn sắc
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(lampX - 10, lampY + 12);
      ctx.lineTo(lampX + 10, lampY + 12);
      ctx.lineTo(catX + 10, plateBot - 8);
      ctx.lineTo(catX + 4, plateTop + 8);
      ctx.closePath();
      const beamG = ctx.createLinearGradient(lampX, lampY, catX, plateMidY);
      beamG.addColorStop(0, rgb.rgba(0.28 * (S.inten / 100)));
      beamG.addColorStop(1, rgb.rgba(0.08 * (S.inten / 100)));
      ctx.fillStyle = beamG;
      ctx.fill();
      ctx.restore();

      // Thân đèn
      rr(ctx, lampX - 24, lampY - 12, 48, 22, 6);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = rgb.css; ctx.lineWidth = 1.6; ctx.stroke();
      glowDot(ctx, lampX, lampY + 8, 5.5, '#ffffff', rgb.rgba(0.85));

      // 2. Vỏ ống thủy tinh chân không
      rr(ctx, tubeX, tubeY, tubeW, tubeH, tubeH * 0.36);
      ctx.fillStyle = hexA(C.bg, 0.72); ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.6; ctx.stroke();

      // Bản Cathode kim loại (trái) và Anode thu điện tử (phải)
      rr(ctx, catX - 6, plateTop, 10, plateBot - plateTop, 3);
      ctx.fillStyle = hexA(m.col, 0.85); ctx.fill();
      rr(ctx, anoX - 4, plateTop, 10, plateBot - plateTop, 3);
      ctx.fillStyle = hexA(C.ink, 0.55); ctx.fill();

      txt(ctx, m.sym, catX - 16, plateMidY, m.col, 11.5, 'right', 700, MONO);
      txt(ctx, 'A', anoX + 16, plateMidY, C.ink, 11.5, 'left', 700, MONO);

      // 3. Khởi tạo & mô phỏng các bó photon + electron quang điện thực tế
      if (!st.photons) { st.photons = []; st.el = []; st.pAcc = 0; st.hits = 0; st.hitSmooth = 0; }
      const phRate = 5 + (S.inten / 100) * 18;
      st.pAcc += dt * phRate;
      while (st.pAcc >= 1) {
        st.pAcc -= 1;
        const ty = rnd(plateTop + 10, plateBot - 10);
        st.photons.push({ sx: lampX + rnd(-6, 6), sy: lampY + 10, tx: catX + 4, ty, prog: 0 });
      }

      // Cập nhật photon bay tới bản Cathode
      for (let i = st.photons.length - 1; i >= 0; i--) {
        const ph = st.photons[i];
        ph.prog += dt * 2.1;
        const x = ph.sx + (ph.tx - ph.sx) * ph.prog;
        const y = ph.sy + (ph.ty - ph.sy) * ph.prog;
        const ang = Math.atan2(ph.ty - ph.sy, ph.tx - ph.sx);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.beginPath();
        for (let s = -10; s <= 10; s += 2) {
          const wy = Math.sin(s * 0.7 - t * 22) * 3.2 * Math.exp(-(s * s) / 55);
          s === -10 ? ctx.moveTo(s, wy) : ctx.lineTo(s, wy);
        }
        ctx.strokeStyle = rgb.css; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.restore();

        if (ph.prog >= 1) {
          // Va chạm vào bản Cathode: nếu E_ph > Phi thì bật electron có động năng trong [0.35 Kmax, Kmax]
          if (canEmit && st.el.length < 70) {
            const K = Kmax * rnd(0.45, 1.0);
            const v0 = Math.sqrt(K) * 150; // tỉ lệ √K
            st.el.push({
              x: catX + 6, y: ph.ty,
              vx: Math.max(25, v0),
              vy: rnd(-18, 18)
            });
          }
          st.photons.splice(i, 1);
        }
      }

      // Chuyển động của electron trong điện trường đều E = -V / d (V < 0 là điện áp hãm kéo ngược!)
      const dPx = anoX - catX - 10;
      const accel = (S.V * 150 * 150) / (2 * Math.max(dPx, 40)); // đúng tỉ lệ a = (eV/md) để dừng khi -V = Kmax!
      let arrivedThisFrame = 0;

      ctx.save();
      rr(ctx, tubeX + 2, tubeY + 2, tubeW - 4, tubeH - 4, tubeH * 0.34);
      ctx.clip();
      for (let i = st.el.length - 1; i >= 0; i--) {
        const e = st.el[i];
        e.vx += accel * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        glowDot(ctx, e.x, e.y, 3.6, C.ink, hexA(C.c2, 0.85));
        dot(ctx, e.x, e.y, 3.1, C.c2);

        if (e.x >= anoX - 4) {
          arrivedThisFrame++;
          st.el.splice(i, 1);
        } else if (e.x <= catX + 2 && e.vx < 0) {
          // Bị điện áp hãm kéo bật ngược trở lại Cathode!
          st.el.splice(i, 1);
        } else if (e.y < tubeY + 6 || e.y > tubeY + tubeH - 6) {
          st.el.splice(i, 1);
        }
      }
      ctx.restore();

      // 4. Mạch điện ngoài nối xuống nguồn điện áp & Ampe kế kim cơ ở đáy buồng
      const wireY = tubeY + tubeH + 34;
      const meterX = chX + chW * 0.66, srcX = chX + chW * 0.34;
      ln(ctx, catX - 1, plateBot, catX - 1, wireY, C.g, 1.8);
      ln(ctx, anoX + 1, plateBot, anoX + 1, wireY, C.g, 1.8);
      ln(ctx, catX - 1, wireY, srcX - 38, wireY, C.g, 1.8);
      ln(ctx, srcX + 38, wireY, meterX - 44, wireY, C.g, 1.8);
      ln(ctx, meterX + 44, wireY, anoX + 1, wireY, C.g, 1.8);

      // Hộp nguồn điện áp V
      rr(ctx, srcX - 38, wireY - 18, 76, 36, 6);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = S.V < 0 ? C.c4 : S.V > 0 ? C.c1 : C.g; ctx.lineWidth = 1.4; ctx.stroke();
      txt(ctx, (S.V > 0 ? '+' : '') + S.V.toFixed(1) + ' V', srcX, wireY, S.V < 0 ? C.c4 : C.ink, 11.5, 'center', 700, MONO);

      // Tính dòng quang điện mượt cho kim Ampe kế
      let curFrac = 0;
      if (canEmit && S.V > -Vstop) {
        const reach = S.V >= 0 ? 1 : clamp((Kmax + S.V) / (Kmax * 0.65), 0, 1);
        curFrac = reach * (S.inten / 100);
      }
      st.hitSmooth += (curFrac - st.hitSmooth) * Math.min(1, dt * 7);
      const I_uA = st.hitSmooth * 80;

      // Đồng hồ Ampe kế
      rr(ctx, meterX - 44, wireY - 26, 88, 52, 6);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = I_uA > 0.5 ? C.c1 : C.g; ctx.lineWidth = 1.4; ctx.stroke();
      const mcy = wireY + 10, mr = 22;
      ctx.beginPath(); ctx.arc(meterX, mcy, mr, Math.PI * 1.12, Math.PI * 1.88);
      ctx.strokeStyle = C.g; ctx.lineWidth = 2.5; ctx.stroke();
      const ang = Math.PI * (1.12 + st.hitSmooth * 0.76) + (I_uA > 0.5 ? Math.sin(t * 24) * 0.012 : 0);
      ln(ctx, meterX, mcy, meterX + Math.cos(ang) * (mr - 3), mcy + Math.sin(ang) * (mr - 3), C.main, 2);
      dot(ctx, meterX, mcy, 2.8, C.ink);
      txt(ctx, I_uA.toFixed(1) + ' µA', meterX, wireY + 18, I_uA > 0.5 ? C.c1 : C.ink, 10, 'center', 700, MONO);

      // Dòng thông số sắc nét ở mép trên (không chữ mờ)
      txt(ctx, 'hν = ' + E_ph.toFixed(2) + ' eV  |  Φ(' + m.sym + ') = ' + m.phi.toFixed(2) + ' eV',
        chX + 14, chY + 18, C.ink, 11, 'left', 700, MONO);
      txt(ctx, canEmit ? 'K_max = ' + Kmax.toFixed(2) + ' eV  |  V_hãm = ' + Vstop.toFixed(2) + ' V' : 'hν < Φ : KHÔNG BẬT ELECTRON',
        chX + chW - 14, chY + 18, canEmit ? C.main : C.err, 11, 'right', 700, MONO);
      void arrivedThisFrame;
    }
  }]
});

/* ==========================================================================
   TAB 2 — THÍ NGHIỆM KHE ĐÔI & SÓNG DE BROGLIE (λ = h / p)
   Bắn từng electron rời rạc qua 2 khe hẹp trong buồng chân không:
   - Trường sóng de Broglie giao thoa từ 2 khe lan truyền tới màn huỳnh quang
   - Mỗi electron đập vào màn như một hạt điểm rời rạc nhưng tích lũy dần thành
     hệ vân sáng – tối giao thoa! Tăng điện áp gia tốc U → λ ngắn lại → vân xít lại.
   ========================================================================== */
LABS.push({
  id: 'duality', name: 'Khe đôi de Broglie', no: '2', secs: [2],
  S: { U: 50, slits: 'two', rate: 60 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng giao thoa Electron — Sóng vật chất de Broglie & Vân tích lũy từng hạt',
    area: 'a', anim: true,
    ctrls: [
      { k: 'U', l: 'Áp gia tốc U', min: 15, max: 150, step: 5, f: v => v + ' V' },
      { k: 'slits', seg: [['two', 'Hai khe (Giao thoa)'], ['one', 'Một khe (Không vân)']] },
      { k: 'rate', l: 'Tốc độ bắn', min: 10, max: 140, step: 10, f: v => v + ' e⁻/s' },
      { btn: 'Xóa màn dò', fn: p => { if (p.st.bins) { p.st.bins.fill(0); p.st.dots = []; p.st.total = 0; } } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      // Bước sóng de Broglie chính xác: λ (Å) = 12.264 / √U(V)
      const lam_A = 12.264 / Math.sqrt(S.U);
      const key = S.U + '_' + S.slits;
      if (!st.bins || st.key !== key) {
        st.key = key;
        st.bins = new Float32Array(96);
        st.dots = [];
        st.flying = [];
        st.total = 0;
        st.acc = 0;
      }

      const gunX = chX + 26;
      const wallX = chX + chW * 0.34;
      const scrX = chX + chW * 0.78;
      const midY = chY + chH * 0.52;
      const spanY = chH * 0.78;
      const topY = midY - spanY / 2, botY = midY + spanY / 2;
      const slitSep = 38;
      const s1Y = midY - slitSep / 2, s2Y = midY + slitSep / 2;

      // Cường độ xác suất giao thoa I(y) trên màn: cos²(π d y / λ L) × sinc²(π a y / λ L)
      const kWave = 0.085 * Math.sqrt(S.U / 50); // tỉ lệ 1/λ
      const probAt = u => {
        const yRel = (u - 0.5) * spanY;
        const env = Math.exp(-(yRel * yRel) / (2 * Math.pow(spanY * 0.27, 2)));
        if (S.slits === 'one') return env;
        const dPath = Math.hypot(scrX - wallX, yRel - slitSep / 2) - Math.hypot(scrX - wallX, yRel + slitSep / 2);
        const c = Math.cos(0.5 * kWave * dPath * 2.2);
        return env * c * c;
      };

      // 1. Vẽ sóng tròn giao thoa lan từ khe tới màn dò
      ctx.save();
      rr(ctx, wallX + 3, topY, scrX - wallX - 6, spanY, 4);
      ctx.clip();
      const waveLenPx = TAU / (kWave * 2.2);
      const speedPx = 58;
      const maxR = Math.hypot(scrX - wallX, spanY * 0.6);
      const phaseShift = (t * speedPx) % waveLenPx;
      const origins = S.slits === 'two' ? [s1Y, s2Y] : [midY];
      origins.forEach(oy => {
        for (let r = phaseShift; r < maxR; r += waveLenPx) {
          const al = clamp(0.32 * (1 - r / maxR), 0.04, 0.32);
          ctx.beginPath();
          ctx.arc(wallX, oy, r, -Math.PI * 0.48, Math.PI * 0.48);
          ctx.strokeStyle = hexA(C.c2, al);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
      ctx.restore();

      // 2. Súng phóng electron & vách ngăn có khe
      rr(ctx, chX + 8, midY - 18, 22, 36, 4);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.main; ctx.lineWidth = 1.4; ctx.stroke();
      glowDot(ctx, gunX + 4, midY, 4.5, C.ink, hexA(C.main, 0.85));

      // Vách ngăn khe
      ctx.fillStyle = C.sub;
      if (S.slits === 'two') {
        ctx.fillRect(wallX - 3, topY, 6, s1Y - 6 - topY);
        ctx.fillRect(wallX - 3, s1Y + 6, 6, (s2Y - 6) - (s1Y + 6));
        ctx.fillRect(wallX - 3, s2Y + 6, 6, botY - (s2Y + 6));
      } else {
        ctx.fillRect(wallX - 3, topY, 6, midY - 7 - topY);
        ctx.fillRect(wallX - 3, midY + 7, 6, botY - (midY + 7));
      }

      // 3. Bắn từng electron rời rạc tuân theo đúng phân bố I(y)
      st.acc += dt * S.rate;
      while (st.acc >= 1) {
        st.acc -= 1;
        // Rejection sampling chọn vị trí rơi trên màn đúng theo probAt(u)
        let u = 0.5;
        for (let tr = 0; tr < 24; tr++) {
          const cand = Math.random();
          if (Math.random() < probAt(cand)) { u = cand; break; }
        }
        const ty = topY + u * spanY;
        const bi = clamp(Math.floor(u * st.bins.length), 0, st.bins.length - 1);
        st.bins[bi]++;
        st.total++;
        st.dots.push({ x: scrX + rnd(-12, 12), y: ty });
        if (st.dots.length > 900) st.dots.shift();
        if (st.flying.length < 28) {
          st.flying.push({ p: 0, sy: S.slits === 'two' ? (Math.random() < 0.5 ? s1Y : s2Y) : midY, ty });
        }
      }

      // Vẽ các electron đang bay tới màn
      for (let i = st.flying.length - 1; i >= 0; i--) {
        const f = st.flying[i];
        f.p += dt * 1.9;
        let x, y;
        if (f.p < 0.35) {
          const k = f.p / 0.35;
          x = gunX + (wallX - gunX) * k;
          y = midY + (f.sy - midY) * k;
        } else {
          const k = (f.p - 0.35) / 0.65;
          x = wallX + (scrX - wallX) * k;
          y = f.sy + (f.ty - f.sy) * k;
        }
        dot(ctx, x, y, 2.4, C.main);
        if (f.p >= 1) st.flying.splice(i, 1);
      }

      // 4. Màn huỳnh quang (vết chấm rời rạc) + dải độ sáng tích lũy ngay sát phải
      rr(ctx, scrX - 15, topY, 30, spanY, 4);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();

      st.dots.forEach(d => {
        dot(ctx, d.x, d.y, 1.55, hexA(C.c1, 0.78));
      });

      // Dải tích lũy mật độ bên phải màn
      const barX = scrX + 22, barMaxW = Math.max(24, chX + chW - barX - 14);
      let maxBin = 1;
      for (let i = 0; i < st.bins.length; i++) if (st.bins[i] > maxBin) maxBin = st.bins[i];
      const bh = spanY / st.bins.length;
      for (let i = 0; i < st.bins.length; i++) {
        const wBar = (st.bins[i] / maxBin) * barMaxW;
        if (wBar < 0.5) continue;
        ctx.fillStyle = hexA(C.c1, 0.72);
        ctx.fillRect(barX, topY + i * bh, wBar, Math.max(1.2, bh - 0.4));
      }

      // Thông số rõ nét ở mép trên
      txt(ctx, 'U = ' + S.U + ' V  |  λ_dB = h/p = ' + lam_A.toFixed(2) + ' Å',
        chX + 14, chY + 18, C.ink, 11, 'left', 700, MONO);
      txt(ctx, 'Đã ghi nhận: ' + st.total + ' e⁻',
        chX + chW - 14, chY + 18, C.c1, 11, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 3 — NGUYÊN LÝ BẤT ĐỊNH HEISENBERG (Δy · Δp_y ≥ ħ/2)
   Thí nghiệm khe đơn hẹp (Single-Slit Electron Diffraction):
   - Kéo thanh trượt thu hẹp hai lá chắn kim loại (giảm Δy)
   - Chùm electron đi qua khe lập tức bị bùng loe ra góc rộng (Δp_y tăng nghịch đảo!)
   ========================================================================== */
LABS.push({
  id: 'heis', name: 'Bất định Heisenberg', no: '3', secs: [3],
  S: { dy: 2.0 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Nhiễu xạ khe đơn — Khép hẹp khe Δy làm động lượng ngang Δp_y bùng loe',
    area: 'a', anim: true,
    ctrls: [
      { k: 'dy', l: 'Độ rộng khe Δy', min: 0.4, max: 5.0, step: 0.1, f: v => v.toFixed(1) + ' Å' },
      { btn: 'Khe rộng (5.0 Å)', fn: p => { p.S.dy = 5.0; p.syncCtrls(); queueReact(p.tab, 'dy'); } },
      { btn: 'Khe siêu hẹp (0.5 Å)', fn: p => { p.S.dy = 0.5; p.syncCtrls(); queueReact(p.tab, 'dy'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      // Tính bất định động lượng ngang tối thiểu: Δp_y ≥ ħ / (2 Δy)
      const dy_m = S.dy * 1e-10;
      const dpy = HBAR / (2 * dy_m); // kg·m/s
      const dvy_kms = (dpy / ME) / 1000; // km/s

      const gunX = chX + 26;
      const slitX = chX + chW * 0.36;
      const scrX = chX + chW * 0.86;
      const midY = chY + chH * 0.52;
      const topY = chY + 34, botY = chY + chH - 16;
      const spanY = botY - topY;

      const slitPx = clamp(S.dy * 16, 7, 86);
      // Góc loe nhiễu xạ tỉ lệ nghịch với Δy!
      const spreadPx = clamp(120 / Math.max(S.dy, 0.35), 16, spanY * 0.46);

      if (!st.particles) { st.particles = []; st.bins = new Float32Array(72); st.acc = 0; }
      if (st.lastDy !== S.dy) {
        st.lastDy = S.dy;
        st.bins.fill(0);
      }

      // 1. Nón chùm electron trước và sau khe (sáng mượt theo phân bố chuẩn)
      ctx.save();
      const preG = ctx.createLinearGradient(gunX, midY, slitX, midY);
      preG.addColorStop(0, hexA(C.c2, 0.25));
      preG.addColorStop(1, hexA(C.c2, 0.12));
      ctx.fillStyle = preG;
      ctx.fillRect(gunX, midY - slitPx / 2, slitX - gunX, slitPx);

      // Nón loe sau khe (độ mở tỉ lệ nghịch Δy)
      ctx.beginPath();
      ctx.moveTo(slitX, midY - slitPx / 2);
      ctx.lineTo(scrX, clamp(midY - spreadPx, topY, botY));
      ctx.lineTo(scrX, clamp(midY + spreadPx, topY, botY));
      ctx.lineTo(slitX, midY + slitPx / 2);
      ctx.closePath();
      const postG = ctx.createLinearGradient(slitX, midY, scrX, midY);
      postG.addColorStop(0, hexA(C.main, 0.28));
      postG.addColorStop(1, hexA(C.main, 0.05));
      ctx.fillStyle = postG;
      ctx.fill();
      ctx.restore();

      // 2. Hai lá chắn khe kim loại đóng/mở thực tế theo Δy
      const gapTop = midY - slitPx / 2, gapBot = midY + slitPx / 2;
      rr(ctx, slitX - 6, topY, 12, Math.max(4, gapTop - topY), 3);
      ctx.fillStyle = C.sub; ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke();

      rr(ctx, slitX - 6, gapBot, 12, Math.max(4, botY - gapBot), 3);
      ctx.fillStyle = C.sub; ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke();

      // Thước đo Δy ngay bên cạnh khe
      ln(ctx, slitX - 18, gapTop, slitX - 18, gapBot, C.c2, 2);
      txt(ctx, 'Δy', slitX - 24, midY, C.c2, 10.5, 'right', 700, MONO);

      // 3. Bắn hạt electron thực tế xuyên qua khe rồi loe ra theo phân bố sinc²/Gauss
      st.acc += dt * 45;
      while (st.acc >= 1) {
        st.acc -= 1;
        if (st.particles.length < 95) {
          const y0 = midY + rnd(-slitPx * 0.42, slitPx * 0.42);
          // Lấy mẫu lệch ngang tỉ lệ nghịch Δy
          let g0 = 0; for (let k = 0; k < 6; k++) g0 += Math.random();
          const dyScat = (g0 - 3) * 0.55 * spreadPx;
          st.particles.push({ x: gunX, y: y0, passed: false, vy: dyScat * 1.45, vx: 210 });
        }
      }

      for (let i = st.particles.length - 1; i >= 0; i--) {
        const pt = st.particles[i];
        pt.x += pt.vx * dt;
        if (!pt.passed && pt.x >= slitX) pt.passed = true;
        if (pt.passed) pt.y += pt.vy * dt;

        glowDot(ctx, pt.x, pt.y, 2.8, C.ink, hexA(pt.passed ? C.main : C.c2, 0.85));
        if (pt.x >= scrX) {
          const u = (pt.y - topY) / spanY;
          if (u >= 0 && u <= 1) {
            const bi = clamp(Math.floor(u * st.bins.length), 0, st.bins.length - 1);
            st.bins[bi] = Math.min(st.bins[bi] + 1.2, 24);
          }
          st.particles.splice(i, 1);
        } else if (pt.y < topY || pt.y > botY) {
          st.particles.splice(i, 1);
        }
      }
      for (let i = 0; i < st.bins.length; i++) st.bins[i] = Math.max(0, st.bins[i] - dt * 0.6);

      // 4. Màn dò bên phải hiển thị dải phân bố Δp_y
      ln(ctx, scrX, topY, scrX, botY, C.g, 2);
      const bh = spanY / st.bins.length;
      const barMaxW = Math.max(20, chX + chW - scrX - 16);
      for (let i = 0; i < st.bins.length; i++) {
        const frac = clamp(st.bins[i] / 12, 0, 1);
        if (frac < 0.02) continue;
        ctx.fillStyle = hexA(C.main, 0.35 + frac * 0.65);
        ctx.fillRect(scrX + 4, topY + i * bh, frac * barMaxW, Math.max(1.5, bh - 0.5));
      }

      // Mũi tên chỉ bề rộng phân bố Δp_y
      const pTop = clamp(midY - spreadPx, topY + 6, botY - 6);
      const pBot = clamp(midY + spreadPx, topY + 6, botY - 6);
      ln(ctx, scrX - 10, pTop, scrX - 10, pBot, C.c4, 2);
      txt(ctx, 'Δp_y', scrX - 16, midY, C.c4, 10.5, 'right', 700, MONO);

      // Dòng thông số sắc nét ở mép trên
      txt(ctx, 'Δy = ' + S.dy.toFixed(1) + ' Å  →  Δp_y ≥ ' + (dpy * 1e24).toFixed(2) + '×10⁻²⁴ kg·m/s',
        chX + 14, chY + 18, C.ink, 11, 'left', 700, MONO);
      txt(ctx, 'Δv_y ≥ ' + dvy_kms.toFixed(0) + ' km/s  |  Δy·Δp_y = ħ/2',
        chX + chW - 14, chY + 18, S.dy < 1.2 ? C.c4 : C.main, 11, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 4 — MÔ HÌNH NGUYÊN TỬ BOHR & QUANG PHỔ VẠCH HYDRO
   - Hiển thị 5 quỹ đạo lượng tử n = 1..5 với sóng dừng de Broglie tròn khép kín (2πr_n = nλ)
   - Bấm đổi mức n: phóng ra hoặc hấp thụ photon mang đúng màu quang phổ thật
   - Thanh quang phổ vạch Hydrogen ngay bên phải sáng lên vạch tương ứng!
   ========================================================================== */
LABS.push({
  id: 'bohr', name: 'Nguyên tử Bohr (H)', no: '4', secs: [4],
  S: { n: 3, showWave: true },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Nguyên tử Hydro Bohr — Sóng dừng tròn 2πr = nλ & Vạch quang phổ phát xạ',
    area: 'a', anim: true,
    ctrls: [
      { k: 'n', seg: [['1', 'n=1'], ['2', 'n=2'], ['3', 'n=3'], ['4', 'n=4'], ['5', 'n=5']] },
      { btn: 'Bật / Tắt sóng de Broglie', fn: p => { p.S.showWave = !p.S.showWave; } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const n = parseInt(S.n, 10);
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      const En = -13.6 / (n * n);
      const rn_A = n * n * 0.529;

      // Phát hiện chuyển mức → tạo bó photon mang bước sóng thật!
      if (!st.photons) { st.photons = []; st.lastLine = null; }
      if (st.prevN != null && st.prevN !== n) {
        const dE = Math.abs(-13.6 / (st.prevN * st.prevN) - En);
        const wl = 1239.84 / dE;
        const emit = n < st.prevN;
        const rgb = wlRGB(wl);
        const info = { from: st.prevN, to: n, dE, wl, emit, rgb };
        st.photons.push({ ...info, p: 0, ang: -0.35 });
        st.lastLine = info;
      }
      st.prevN = n;

      // Trung tâm nguyên tử bên trái, dải quang phổ vạch bên phải
      const cx = chX + chW * 0.44, cy = chY + chH * 0.54;
      const maxR = Math.min(chW * 0.36, chH * 0.42);
      // Bán kính trực quan tỉ lệ nhẹ theo n^1.35 để cả 5 vòng đều rõ đẹp
      const rOf = k => maxR * (0.20 + 0.80 * Math.pow((k - 1) / 4, 1.32));

      // 1. Vẽ 5 quỹ đạo cho phép n = 1..5
      for (let k = 1; k <= 5; k++) {
        const rk = rOf(k);
        const active = k === n;
        ctx.beginPath(); ctx.arc(cx, cy, rk, 0, TAU);
        ctx.strokeStyle = active ? hexA(C.c2, 0.72) : hexA(C.g, 0.9);
        ctx.lineWidth = active ? 1.8 : 1;
        ctx.stroke();
        txt(ctx, 'n=' + k, cx + rk * 0.72 + 4, cy - rk * 0.72, active ? C.main : C.mut, 9.5, 'left', 700, MONO);
      }

      // 2. Sóng dừng de Broglie tròn khép kín đúng n bước sóng trên quỹ đạo hiện tại
      const rCur = rOf(n);
      if (S.showWave) {
        const amp = Math.min(11, rCur * 0.14);
        ctx.beginPath();
        for (let i = 0; i <= 180; i++) {
          const th = (i / 180) * TAU;
          const dr = Math.sin(n * th) * Math.cos(t * 6) * amp;
          const x = cx + (rCur + dr) * Math.cos(th);
          const y = cy + (rCur + dr) * Math.sin(th);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = hexA(C.c5, 0.85);
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }

      // 3. Hạt nhân Proton ở tâm + Electron quay trên quỹ đạo n
      glowDot(ctx, cx, cy, 8, C.ink, hexA(C.c4, 0.9));
      dot(ctx, cx, cy, 7.5, C.c4);
      txt(ctx, '+1', cx, cy + 0.5, C.bg, 8.5, 'center', 800, MONO);

      const eAng = t * (3.2 / Math.pow(n, 0.85));
      const ex = cx + rCur * Math.cos(eAng), ey = cy + rCur * Math.sin(eAng);
      glowDot(ctx, ex, ey, 5.2, C.ink, hexA(C.c2, 0.9));
      dot(ctx, ex, ey, 4.5, C.c2);

      // 4. Bó photon phát xạ / hấp thụ bay ra hoặc bay vào
      for (let i = st.photons.length - 1; i >= 0; i--) {
        const ph = st.photons[i];
        ph.p += dt * 0.9;
        const dist = ph.emit ? rCur + ph.p * (chW * 0.38) : rCur + (1 - ph.p) * (chW * 0.38);
        const px = cx + Math.cos(ph.ang) * dist;
        const py = cy + Math.sin(ph.ang) * dist;
        const al = clamp(1 - Math.abs(ph.p - 0.5) * 1.9, 0, 1);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ph.ang);
        ctx.beginPath();
        for (let s = -22; s <= 22; s += 2) {
          const wy = Math.sin(s * 0.65 - t * 24) * 7 * Math.exp(-(s * s) / 180);
          s === -22 ? ctx.moveTo(s, wy) : ctx.lineTo(s, wy);
        }
        ctx.strokeStyle = ph.rgb.rgba(al); ctx.lineWidth = 2.4; ctx.stroke();
        glowDot(ctx, 0, 0, 5, '#ffffff', ph.rgb.rgba(al * 0.9));
        ctx.restore();

        if (ph.p >= 1.05) st.photons.splice(i, 1);
      }

      // 5. Thanh Quang phổ vạch Balmer khả kiến bên phải (656nm đỏ, 486nm lam, 434nm chàm, 410nm tím)
      const spX = chX + chW - 46, spW = 28, spY = chY + 46, spH = chH - 66;
      rr(ctx, spX, spY, spW, spH, 4);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.2; ctx.stroke();
      txt(ctx, 'Balmer', spX + spW / 2, spY - 12, C.ink, 9.5, 'center', 700, MONO);

      const balmer = [
        { k: 3, wl: 656, col: wlRGB(656).css },
        { k: 4, wl: 486, col: wlRGB(486).css },
        { k: 5, wl: 434, col: wlRGB(434).css }
      ];
      balmer.forEach(b => {
        const u = (b.wl - 380) / (700 - 380);
        const ly = spY + 10 + u * (spH - 20);
        const hi = st.lastLine && Math.abs(st.lastLine.wl - b.wl) < 12;
        ln(ctx, spX + 3, ly, spX + spW - 3, ly, hi ? b.col : hexA(b.col, 0.5), hi ? 3.5 : 1.6);
        txt(ctx, b.wl + '', spX - 5, ly, hi ? b.col : C.ink, 9, 'right', hi ? 800 : 500, MONO);
      });

      // Dòng thông số sắc nét ở mép trên
      txt(ctx, 'n = ' + n + '  |  E_' + n + ' = ' + En.toFixed(2) + ' eV  |  r_' + n + ' = ' + rn_A.toFixed(2) + ' Å',
        chX + 14, chY + 18, C.ink, 11, 'left', 700, MONO);
      const lastTxt = st.lastLine
        ? (st.lastLine.emit ? 'Phát xạ ' : 'Hấp thụ ') + st.lastLine.from + '→' + st.lastLine.to + ': λ = ' + st.lastLine.wl.toFixed(0) + ' nm (' + st.lastLine.dE.toFixed(2) + ' eV)'
        : '2πr_' + n + ' = ' + n + 'λ';
      txt(ctx, lastTxt, chX + chW - 14, chY + 18, st.lastLine ? st.lastLine.rgb.css : C.main, 10.8, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   TAB 5 — TÁN XẠ COMPTON (PHOTON TIA X VA CHẠM ELECTRON TỰ DO)
   Chứng minh photon mang động lượng p = h/λ giống hệt hạt vật chất:
   - Photon tia X (bước sóng λ₀) lao vào electron đứng yên ở tâm buồng
   - Photon tán xạ lệch góc θ có bước sóng giãn dài λ' = λ₀ + λ_C(1 − cosθ)
   - Electron bị hất giật lùi theo đúng góc bảo toàn động lượng φ!
   ========================================================================== */
LABS.push({
  id: 'compton', name: 'Tán xạ Compton', no: '5', secs: [5],
  S: { lam0: 0.10, theta: 90 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng va chạm Compton — Photon tia X truyền động lượng cho Electron đứng yên',
    area: 'a', anim: true,
    ctrls: [
      { k: 'lam0', l: 'λ₀ (tia X)', min: 0.04, max: 0.25, step: 0.01, f: v => v.toFixed(2) + ' Å' },
      { k: 'theta', l: 'Góc tán xạ θ', min: 15, max: 180, step: 5, f: v => v + '°' },
      { btn: 'Bắn lại', fn: p => { p.st.phase = 0; } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 16;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      // Công thức Compton chính xác
      const thRad = (S.theta * Math.PI) / 180;
      const dLam = LAM_C * (1 - Math.cos(thRad)); // Å
      const lam1 = S.lam0 + dLam;
      const E0_keV = 12.3984 / S.lam0;
      const E1_keV = 12.3984 / lam1;
      const Ke_keV = Math.max(0, E0_keV - E1_keV);
      // Góc giật lùi electron φ: cot(φ) = (1 + E0 / m_e c²) · tan(θ/2)
      const ratio = E0_keV / 511.0;
      const phiRad = S.theta === 180 ? 0 : Math.atan(1 / ((1 + ratio) * Math.tan(thRad / 2)));
      const phiDeg = (phiRad * 180) / Math.PI;

      const cx = chX + chW * 0.48, cy = chY + chH * 0.54;
      const armLen = Math.min(chW * 0.40, chH * 0.42);

      // Trục bay ban đầu & vòng chia góc tại tâm va chạm
      ln(ctx, chX + 22, cy, chX + chW - 22, cy, hexA(C.g, 0.8), 1.2, [5, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, 42, -thRad, 0);
      ctx.strokeStyle = hexA(C.main, 0.7); ctx.lineWidth = 1.6; ctx.stroke();
      txt(ctx, 'θ=' + S.theta + '°', cx + 50, cy - 16, C.main, 10, 'left', 700, MONO);

      if (phiDeg > 2) {
        ctx.beginPath(); ctx.arc(cx, cy, 34, 0, phiRad);
        ctx.strokeStyle = hexA(C.c2, 0.7); ctx.lineWidth = 1.6; ctx.stroke();
        txt(ctx, 'φ=' + phiDeg.toFixed(0) + '°', cx + 42, cy + 16, C.c2, 10, 'left', 700, MONO);
      }

      // Chu kỳ va chạm lặp mượt mà: [0..0.44] photon bay tới, [0.44..1.0] photon lệch θ & e⁻ giật lùi φ
      st.phase = ((st.phase || 0) + dt * 0.42) % 1.05;
      const ph = st.phase;
      const hitT = 0.44;

      // Hàm vẽ bó sóng photon có mật độ gợn sóng tỉ lệ nghịch với bước sóng λ!
      const drawWavePacket = (x, y, ang, freqPx, col) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.beginPath();
        for (let s = -28; s <= 28; s += 1.5) {
          const wy = Math.sin(s * freqPx - t * 20) * 7.5 * Math.exp(-(s * s) / 220);
          s === -28 ? ctx.moveTo(s, wy) : ctx.lineTo(s, wy);
        }
        ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.stroke();
        glowDot(ctx, 0, 0, 4.5, C.ink, hexA(col, 0.85));
        ctx.restore();
      };

      const freq0 = clamp(0.11 / S.lam0, 0.42, 1.35);
      const freq1 = clamp(0.11 / lam1, 0.30, 1.25);

      if (ph < hitT) {
        // Trước va chạm: electron đứng yên tại tâm, photon tới từ trái
        const u = ph / hitT;
        const px = (cx - armLen) + u * armLen;
        drawWavePacket(px, cy, 0, freq0, C.c5);

        glowDot(ctx, cx, cy, 6.5, C.ink, hexA(C.c2, 0.85));
        dot(ctx, cx, cy, 5.8, C.c2);
        txt(ctx, 'e⁻', cx, cy - 16, C.c2, 10.5, 'center', 700, MONO);
      } else {
        // Sau va chạm: chớp năng lượng ở tâm, photon tán xạ góc -θ (hướng lên), electron giật lùi góc +φ (hướng xuống)
        const u = clamp((ph - hitT) / (1.0 - hitT), 0, 1);

        // Quỹ đạo mờ để dễ nhìn góc lệch
        ln(ctx, cx, cy, cx + Math.cos(-thRad) * armLen, cy + Math.sin(-thRad) * armLen, hexA(C.main, 0.35), 1.4, [4, 4]);
        ln(ctx, cx, cy, cx + Math.cos(phiRad) * armLen * 0.9, cy + Math.sin(phiRad) * armLen * 0.9, hexA(C.c2, 0.35), 1.4, [4, 4]);

        if (u < 0.25) {
          const fl = 1 - u / 0.25;
          ctx.beginPath(); ctx.arc(cx, cy, 6 + (1 - fl) * 28, 0, TAU);
          ctx.strokeStyle = hexA(C.main, fl * 0.85); ctx.lineWidth = 2; ctx.stroke();
        }

        // Photon tán xạ (bước sóng dài hơn → màu dịch sang vàng/đỏ và gợn sóng thưa hơn)
        const px = cx + Math.cos(-thRad) * (u * armLen);
        const py = cy + Math.sin(-thRad) * (u * armLen);
        drawWavePacket(px, py, -thRad, freq1, C.main);

        // Electron giật lùi (tốc độ tỉ lệ căn động năng K_e)
        const eDist = u * armLen * clamp(0.35 + Math.sqrt(Ke_keV / Math.max(E0_keV, 1)) * 0.65, 0.25, 0.92);
        const ex = cx + Math.cos(phiRad) * eDist;
        const ey = cy + Math.sin(phiRad) * eDist;
        glowDot(ctx, ex, ey, 6.2, C.ink, hexA(C.c2, 0.9));
        dot(ctx, ex, ey, 5.5, C.c2);
        txt(ctx, 'e⁻', ex, ey + 15, C.c2, 10, 'center', 700, MONO);
      }

      // Thông số đo sắc nét ở mép trên
      txt(ctx, 'λ₀ = ' + S.lam0.toFixed(3) + ' Å  →  λ′ = ' + lam1.toFixed(3) + ' Å  (Δλ = +' + dLam.toFixed(4) + ' Å)',
        chX + 14, chY + 18, C.ink, 10.8, 'left', 700, MONO);
      txt(ctx, 'E₀ = ' + E0_keV.toFixed(1) + ' keV  |  K_e = ' + Ke_keV.toFixed(1) + ' keV',
        chX + chW - 14, chY + 18, C.main, 10.8, 'right', 700, MONO);
    }
  }]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM (Log intro + react chi tiết cho 5 tab Buổi 2)
   ========================================================================== */
const LD = {};

LD.photo = {
  intro: [
    ['i', 'Thí nghiệm quang điện Einstein: Ánh sáng gồm các lượng tử photon mang năng lượng E = hν = hc/λ.'],
    ['w', 'Electron chỉ bật khỏi bề mặt kim loại khi năng lượng mỗi photon lớn hơn công thoát (hν > Φ); khi đó K_max = hν − Φ.'],
    ['w', 'Tăng cường độ sáng chỉ tăng số lượng photon (tăng dòng điện), KHÔNG làm tăng động năng K_max hay giúp bật electron nếu λ quá dài.'],
    ['v', 'Thử chỉnh điện áp âm V = −V_hãm để kéo ngược toàn bộ electron quay về Cathode làm kim Ampe kế tụt đúng về 0 µA!']
  ],
  react(S, k, P, say) {
    const m = METALS[S.metal];
    const E_ph = 1239.84 / S.wl;
    const Kmax = Math.max(0, E_ph - m.phi);
    if (E_ph <= m.phi) {
      say('v', `λ = ${S.wl} nm (hν = ${E_ph.toFixed(2)} eV) ≤ Φ(${m.sym}) = ${m.phi.toFixed(2)} eV → Không có hiện tượng quang điện.`);
    } else if (S.V <= -Kmax) {
      say('w', `Điện áp hãm V = ${S.V.toFixed(1)} V đã triệt tiêu toàn bộ electron (|V| ≥ V_hãm = ${Kmax.toFixed(2)} V) → Dòng I = 0 µA.`);
    } else {
      say('v', `${m.name}, λ = ${S.wl} nm → hν = ${E_ph.toFixed(2)} eV, K_max = ${Kmax.toFixed(2)} eV, V_hãm = ${Kmax.toFixed(2)} V.`);
    }
  }
};

LD.duality = {
  intro: [
    ['i', 'Giả thuyết de Broglie: Mọi hạt vật chất có động lượng p đều mang tính sóng với bước sóng λ = h/p = h/√(2meU).'],
    ['w', 'Khi bắn từng electron đơn lẻ qua 2 khe hẹp, mỗi electron đập vào màn như 1 hạt điểm, nhưng hàng trăm hạt tích lũy sẽ hiện rõ vân giao thoa sóng!'],
    ['w', 'Khi đóng 1 khe (chế độ Một khe), hệ vân giao thoa biến mất hoàn toàn — chứng minh mỗi electron đã tự giao thoa với chính nó qua cả 2 khe.'],
    ['v', 'Tăng điện áp gia tốc U lên 150 V để thấy bước sóng λ co ngắn và các vân sáng trên màn xít gần nhau hơn!']
  ],
  react(S, k, P, say) {
    const lam = 12.264 / Math.sqrt(S.U);
    if (k === 'slits') {
      say('w', S.slits === 'two' ? 'Hai khe mở: Xuất hiện hệ vân sáng–tối giao thoa đặc trưng của sóng vật chất.' : 'Chỉ mở một khe: Biến mất giao thoa, chỉ còn một cực đại trung tâm.');
    } else if (k === 'U') {
      say('v', `U = ${S.U} V → Bước sóng de Broglie λ = ${lam.toFixed(2)} Å. U càng lớn, λ càng ngắn và khoảng vân càng hẹp.`);
    }
  }
};

LD.heis = {
  intro: [
    ['i', 'Nguyên lý bất định Heisenberg: Không thể đồng thời xác định chính xác tuyệt đối vị trí và động lượng của hạt lượng tử (Δy·Δp_y ≥ ħ/2).'],
    ['w', 'Khi ta ép hẹp hai lá chắn khe để định vị chính xác tọa độ ngang Δy của electron, động lượng ngang Δp_y lập tức bùng nổ!'],
    ['v', 'Bấm "Khe siêu hẹp (0.5 Å)" rồi so sánh với "Khe rộng (5.0 Å)" để thấy chùm electron sau khe bị nhiễu xạ loe rộng ra màn dò.']
  ],
  react(S, k, P, say) {
    const dpy = HBAR / (2 * S.dy * 1e-10);
    const dvy = (dpy / ME) / 1000;
    say('v', `Độ rộng khe Δy = ${S.dy.toFixed(1)} Å → Bất định động lượng Δp_y ≥ ${(dpy * 1e24).toFixed(2)}×10⁻²⁴ kg·m/s (Δv_y ≥ ${dvy.toFixed(0)} km/s).`);
    say('w', S.dy <= 1.0 ? 'Khe rất hẹp: Định vị vị trí tốt nhưng đánh đổi bằng độ loe động lượng ngang rất lớn!' : 'Khe rộng: Electron bay gần như thẳng, độ bất định động lượng ngang nhỏ.');
  }
};

LD.bohr = {
  intro: [
    ['i', 'Mô hình Bohr giải thích tính bền vững của nguyên tử Hydro: Electron chỉ tồn tại trên các quỹ đạo dừng mà chu vi bằng số nguyên lần bước sóng de Broglie (2πr_n = nλ).'],
    ['w', 'Năng lượng mức dừng bị lượng tử hóa: E_n = −13.6 / n² (eV) và bán kính quỹ đạo tăng theo n² (r_n = n²·a₀ với a₀ = 0.529 Å).'],
    ['v', 'Bấm nhảy mức từ n = 3, 4, 5 xuống n = 2 để quan sát nguyên tử phát xạ các vạch màu đỏ (656 nm), lam (486 nm), chàm (434 nm) của dãy Balmer!']
  ],
  react(S, k, P, say) {
    const n = parseInt(S.n, 10);
    const prev = parseInt(P.n || n, 10);
    const En = -13.6 / (n * n);
    if (prev !== n) {
      const dE = Math.abs(-13.6 / (prev * prev) - En);
      const wl = 1239.84 / dE;
      const series = Math.min(prev, n) === 1 ? 'Lyman (UV)' : Math.min(prev, n) === 2 ? 'Balmer (Khả kiến)' : 'Paschen (Hồng ngoại)';
      say('v', `Chuyển mức n=${prev} → n=${n}: ${n < prev ? 'Phát xạ' : 'Hấp thụ'} photon ΔE = ${dE.toFixed(2)} eV, λ = ${wl.toFixed(0)} nm (${series}).`);
    } else {
      say('i', `Quỹ đạo n = ${n}: E_${n} = ${En.toFixed(2)} eV, r_${n} = ${(n * n * 0.529).toFixed(2)} Å.`);
    }
  }
};

LD.compton = {
  intro: [
    ['i', 'Tán xạ Compton (1923): Photon tia X va chạm đàn hồi với electron tự do làm bước sóng photon dài ra: Δλ = λ_C·(1 − cosθ) với λ_C = 0.0243 Å.'],
    ['w', 'Một phần năng lượng và động lượng của photon được truyền sang electron khiến electron bị hất giật lùi theo góc φ.'],
    ['v', 'Kéo góc tán xạ θ từ 15° đến 180° (tán xạ ngược) để thấy bước sóng giãn dài cực đại Δλ_max = 2λ_C = 0.0485 Å và động năng giật lùi K_e đạt đỉnh!']
  ],
  react(S, k, P, say) {
    const thRad = (S.theta * Math.PI) / 180;
    const dLam = LAM_C * (1 - Math.cos(thRad));
    const E0 = 12.3984 / S.lam0;
    const E1 = 12.3984 / (S.lam0 + dLam);
    say('v', `θ = ${S.theta}° → Δλ = +${dLam.toFixed(4)} Å (λ′ = ${(S.lam0 + dLam).toFixed(3)} Å), Electron nhận động năng K_e = ${(E0 - E1).toFixed(2)} keV.`);
    if (S.theta === 180) say('w', 'Tán xạ ngược 180°: Độ dịch bước sóng đạt cực đại 2λ_C = 0.0485 Å và electron giật lùi thẳng về phía trước (φ = 0°).');
  }
};

LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (Tự chèn CSS + HTML popup, tách biệt hoàn toàn #lab2 / .lb2-*)
   ========================================================================== */
const CSS = `
#lab2{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab2[hidden]{display:none}
#lab2 *{box-sizing:border-box}
.lb2-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
.lb2-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
.lb2-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
.lb2-ic{color:var(--main);display:flex}
.lb2-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
.lb2-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
.lb2-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
.lb2-tab:hover{color:var(--ink);background:var(--tint)}
.lb2-tab.on{background:var(--main);color:var(--bg);font-weight:700}
.lb2-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
.lb2-x:hover{color:var(--err);background:var(--tint)}
.lb2-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
.lb2-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
.lb2-p.glow{animation:lb2glow 1.4s ease-out}
@keyframes lb2glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
.lb2-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
.lb2-cv{flex:1;min-height:0;position:relative}
.lb2-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.lb2-c{display:flex;flex-wrap:wrap;gap:6px 12px;padding:5px 10px 8px;flex:none;align-items:center}
.lb2-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb2-k input[type=range]{width:clamp(68px,7.5vw,112px);margin:0;accent-color:var(--main)}
.lb2-k output{color:var(--ink);font-weight:700;min-width:3.2em}
.lb2-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb2-seg button,.lb2-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer;transition:color .15s,background .15s}
.lb2-btn{background:var(--tint);color:var(--ink)}
.lb2-seg button:hover,.lb2-btn:hover{color:var(--ink);background:var(--g)}
.lb2-seg button.on{background:var(--main);color:var(--bg)}
.lb2-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
.lb2-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb2in .4s ease-out;overflow-wrap:anywhere}
.lb2-ln::before{position:absolute;left:0;font-weight:700}
.lb2-ln.i{color:var(--ink)}.lb2-ln.i::before{content:'›';color:var(--c5)}
.lb2-ln.w{color:var(--ink)}.lb2-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
.lb2-ln.v{color:var(--main)}.lb2-ln.v::before{content:'=';color:var(--main)}
@keyframes lb2in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab2-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab2-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab2-m:hover,.lab2-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb2-win{width:100vw;height:100dvh;border-radius:0}.lb2-b{overflow:auto;display:flex;flex-direction:column}.lb2-p{min-height:280px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'photo';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab2'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 2');
  root.innerHTML = '<div class="lb2-win"><div class="lb2-h"><span class="lb2-ic">' + FLASK + '</span><span class="lb2-bd">Phòng thí nghiệm · Buổi 2</span><nav class="lb2-tabs"></nav><button class="lb2-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb2-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb2-b'); tabsEl = root.querySelector('.lb2-tabs');
  LABS.forEach(l => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lb2-tab'; b.dataset.id = l.id;
    b.textContent = l.no + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b);
  });
  root.querySelector('.lb2-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) {
      const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty &&
          window.LabB2 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden &&
          (document.getElementById('tb-badge') || {}).textContent === 'Buổi 2') {
        e.preventDefault(); open();
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
}

const say = (kind, text) => {
  if (!logEl) return;
  const d = document.createElement('div'); d.className = 'lb2-ln ' + kind; d.textContent = text;
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
    w.className = 'lb2-btn'; w.textContent = c.btn; w.setAttribute('role', 'button'); w.tabIndex = 0;
    w.onclick = () => c.fn(p); return w;
  }
  if (c.seg) {
    w.className = 'lb2-seg';
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
  w.className = 'lb2-k';
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
    const el = document.createElement('div'); el.className = 'lb2-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb2-t"></div><div class="lb2-cv"><canvas></canvas></div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) {
      const lg = document.createElement('div'); lg.className = 'lb2-log'; lg.setAttribute('aria-live', 'polite');
      el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el);
      curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 220 + j * 850)));
      return;
    }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb2-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.ctrls && spec.ctrls.length) {
      const cb = document.createElement('div'); cb.className = 'lb2-c';
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
    catch (err) { console.error('LabB2 render error:', err); }
    ctx.restore();
  });
  raf = requestAnimationFrame(loop);
}

function open(id, panelIdx) {
  ensureDom(); readColors(); opener = document.activeElement;
  root.hidden = false; show(id || lastTab, panelIdx);
  last = performance.now(); if (!raf) raf = requestAnimationFrame(loop);
  root.querySelector('.lb2-x').focus({ preventScroll: true });
  const b = document.getElementById('tb-lab'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
}
function close() {
  if (!root || root.hidden) return;
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  const b = document.getElementById('tb-lab'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- Dấu hiệu bình thí nghiệm trong bài học Buổi 2 ---------- */
const H3MAP = [
  [/^1\.1/, 'photo', 0], [/^1\.2/, 'photo', 0],
  [/^2\.1/, 'duality', 0], [/^2\.2/, 'duality', 0],
  [/^3\.1/, 'heis', 0], [/^3\.2/, 'heis', 0],
  [/^4\.1/, 'bohr', 0], [/^4\.2/, 'bohr', 0],
  [/^5\.1/, 'compton', 0], [/^5\.2/, 'compton', 0]
];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab2-m')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab2-m'; b.innerHTML = FLASK;
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

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 2') {
  markLesson(document.getElementById('app-content'));
}

window.LabB2 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
