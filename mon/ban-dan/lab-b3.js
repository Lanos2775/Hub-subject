/* ==========================================================================
   lab-b3.js — PHÒNG THÍ NGHIỆM BUỔI 3 (popup 95% màn hình)
   - Tự chứa: tự chèn CSS + HTML popup, không phụ thuộc code bài học.
   - NGUYÊN TẮC: MÔ PHỎNG VẬT LÝ THỰC TẾ — TUYỆT ĐỐI KHÔNG BIỂU ĐỒ / SƠ ĐỒ TRỪU TƯỢNG.
   - 5 tab ứng với 5 hiện tượng vật lý lượng tử nền tảng của Buổi 3:
       1. Hạt tự do: Sóng phẳng vật chất de Broglie lan truyền, hạt bất định vị trí
       2. Giếng vô hạn: Hộp lượng tử 2 vách, sóng dừng rung tại chỗ, hạt tụ ở bụng sóng
       3. Bậc thế năng: Sóng electron đập vào vách cản, đâm xuyên hàm mũ vào lòng tường
       4. Xuyên hầm: Electron chui qua rào thế mỏng nanomet (dòng rò transistor nano, Si vs GaAs)
       5. Vỏ nguyên tử & Pauli: Đám mây orbital (1s, 2s có nút, 2p hình tạ) & cơ chế điền vỏ Pauli (H → Si)
   - API: LabB3.open(tabId?, panelIndex?)  LabB3.close()  LabB3.mark(root)
   ========================================================================== */
(function () {
'use strict';

/* ---------- tiện ích và hằng số vật lý ---------- */
const TAU2 = Math.PI * 2, Q = 1.602e-19, HBAR = 1.055e-34, ME = 9.109e-31, EV = 1.602e-19;
const rnd = (a, b) => a + Math.random() * (b - a);
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU2 * v); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[d]).join('');
const sci = (x, d = 1) => { if (!x) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); return (x / Math.pow(10, e)).toFixed(d) + '×10' + sup(e); };
const FONT = '"Be Vietnam Pro",system-ui,sans-serif';

const C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ['bg', 'card', 'ink', 'mut', 'sub', 'main', 'err', 'c1', 'c2', 'c3', 'c4', 'c5', 'g', 'tint'].forEach(k => {
    C[k] = cs.getPropertyValue('--' + k).trim() || '#888';
  });
}

/* ---------- tiện ích vẽ Canvas ---------- */
function txt(ctx, s, x, y, col, size, al, wt) {
  ctx.font = (wt || 500) + ' ' + (size || 12) + 'px ' + FONT;
  ctx.fillStyle = col || C.ink; ctx.textAlign = al || 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}
function ln(ctx, x1, y1, x2, y2, col, w, dash) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = col; ctx.lineWidth = w || 1; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
}
function arr(ctx, x1, y1, x2, y2, col, w) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 4 + (w || 2) * 1.6;
  ln(ctx, x1, y1, x2, y2, col, w || 2);
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45));
  ctx.lineTo(x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45));
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
function dot(ctx, x, y, r, col) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU2); ctx.fillStyle = col; ctx.fill();
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

const LABS = [];

/* ==========================================================================
   TAB 1 — HẠT TỰ DO: SÓNG PHẲNG VẬT CHẤT TRONG KHÔNG GIAN (V = 0)
   Mô phỏng ống dẫn sóng lượng tử / mặt phẳng không ma sát.
   Sóng de Broglie lan truyền thực tế; hạt electron xuất hiện bất định khắp nơi.
   ========================================================================== */
LABS.push({
  id: 'free', name: 'Hạt tự do', sec: 1,
  S: { k: 8, pres: 'a', dens: 1 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Electron tự do trong không gian (V = 0) — Sóng phẳng & Bất định vị trí',
    area: 'a', anim: true,
    ctrls: [
      { k: 'pres', seg: [['a', 'Câu 1a: k > 0 (→)'], ['b', 'Câu 1b: k < 0 (←)'], ['0', 'Đứng yên (k = 0)']],
        set: { a: { k: 8 }, b: { k: -8 }, '0': { k: 0 } } },
      { k: 'k', l: 'Số sóng k', min: -20, max: 20, step: 0.5, f: v => (v > 0 ? '+' : '') + v.toFixed(1) + ' ×10⁸ m⁻¹' },
      { k: 'dens', l: 'Chùm hạt', min: 0.5, max: 2, step: 0.1, f: v => (v === 1 ? 'Chuẩn' : v > 1 ? 'Dày' : 'Thưa') }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, k = S.k;
      const pipeY = H * 0.5, pipeH = clamp(H * 0.44, 90, 200);
      const topY = pipeY - pipeH / 2, botY = pipeY + pipeH / 2;
      const kVal = k * 1e8; // m^-1
      const E_eV = kVal !== 0 ? (HBAR * HBAR * kVal * kVal / (2 * ME * EV)) : 0;
      const lam_A = k !== 0 ? (TAU2 / (Math.abs(k) * 1e8) * 1e10).toFixed(2) : '∞';
      const vp_kms = k !== 0 ? (Math.sqrt(2 * Math.abs(E_eV) * EV / ME) / 2 / 1000).toFixed(0) : '0';

      /* ---- Khung ống dẫn lượng tử (Quantum Waveguide) ---- */
      rr(ctx, 12, topY, W - 24, pipeH, 10);
      ctx.fillStyle = C.card; ctx.fill();
      ctx.strokeStyle = C.g; ctx.lineWidth = 1.5; ctx.stroke();

      // Vạch lưới không gian tinh thể (spatial ticks)
      ctx.save();
      rr(ctx, 12, topY, W - 24, pipeH, 10);
      ctx.clip();
      for (let x = 30; x < W - 20; x += 40) {
        ln(ctx, x, topY, x, topY + 8, C.g, 1);
        ln(ctx, x, botY - 8, x, botY, C.g, 1);
      }

      /* ---- Sóng phẳng de Broglie đang truyền đi ---- */
      // kpx: số radian trên mỗi pixel màn hình
      const kpx = k * 0.028;
      const omega = Math.abs(k) * 2.8; // tốc độ pha thị giác
      const waveAmp = pipeH * 0.34;

      if (Math.abs(k) > 0.05) {
        // Dải sáng lượng tử (quantum phase ribbon): vùng biên độ dương / âm
        ctx.beginPath();
        ctx.moveTo(12, pipeY);
        for (let x = 12; x <= W - 12; x += 2) {
          const ph = kpx * (x - 12) - (k > 0 ? 1 : -1) * omega * t;
          const y = pipeY - Math.cos(ph) * waveAmp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W - 12, pipeY); ctx.closePath();
        ctx.fillStyle = k > 0 ? C.c2 : C.c4;
        ctx.globalAlpha = 0.16; ctx.fill(); ctx.globalAlpha = 1;

        // Đường sóng chính
        ctx.beginPath();
        for (let x = 12; x <= W - 12; x += 2) {
          const ph = kpx * (x - 12) - (k > 0 ? 1 : -1) * omega * t;
          const y = pipeY - Math.cos(ph) * waveAmp;
          x === 12 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = k > 0 ? C.c2 : C.c4;
        ctx.lineWidth = 3; ctx.stroke();

        // Các đỉnh sóng sáng (wavefront crests) chuyển động
        const lamPx = TAU2 / Math.abs(kpx);
        const shift = ((omega * t / Math.abs(kpx)) * (k > 0 ? 1 : -1)) % lamPx;
        for (let cx = 12 + ((shift % lamPx) + lamPx) % lamPx; cx < W - 12; cx += lamPx) {
          dot(ctx, cx, pipeY - waveAmp, 5, C.main);
          ctx.beginPath(); ctx.arc(cx, pipeY - waveAmp, 11, 0, TAU2);
          ctx.strokeStyle = C.main; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1;
        }

        // Mũi tên chỉ hướng truyền sóng
        const arrX1 = k > 0 ? W * 0.18 : W * 0.82;
        const arrX2 = k > 0 ? W * 0.42 : W * 0.58;
        arr(ctx, arrX1, topY - 14, arrX2, topY - 14, k > 0 ? C.c2 : C.c4, 2.5);
        txt(ctx, k > 0 ? 'Sóng truyền theo chiều dương (+x) →' : '← Sóng truyền theo chiều âm (−x)',
          (arrX1 + arrX2) / 2, topY - 14, k > 0 ? C.c2 : C.c4, 11.5, 'center', 700);
      } else {
        // k = 0: sóng phẳng lặng
        ln(ctx, 12, pipeY, W - 12, pipeY, C.mut, 2, [6, 4]);
        txt(ctx, 'k = 0: Không có dao động — Hạt đứng yên, động lượng p = 0, E = 0', W / 2, pipeY - 16, C.mut, 12, 'center', 600);
      }

      /* ---- Nguyên lý Bất định: Hạt xuất hiện ngẫu nhiên khắp nơi (|ψ|² = hằng số) ---- */
      if (!st.detections) st.detections = [];
      const rate = 12 * S.dens;
      if (Math.random() < rate * dt) {
        st.detections.push({
          x: rnd(24, W - 24),
          y: pipeY + rnd(-waveAmp * 0.85, waveAmp * 0.85),
          life: 1.0
        });
      }
      st.detections.forEach(d => {
        d.life -= dt * 2.2;
        if (d.life <= 0) return;
        ctx.globalAlpha = d.life;
        dot(ctx, d.x, d.y, 4, C.c1);
        ctx.beginPath(); ctx.arc(d.x, d.y, 14 * (1 - d.life * 0.4), 0, TAU2);
        ctx.strokeStyle = C.c1; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.globalAlpha = 1;
      });
      st.detections = st.detections.filter(d => d.life > 0);
      ctx.restore();

      /* ---- Bảng thông số đo đạc vật lý thực tế ---- */
      txt(ctx, 'V = 0 (Không gian tự do)', 18, 16, C.mut, 11, 'left', 600);
      txt(ctx, 'λ = ' + lam_A + ' Å', 18, 32, C.c5, 12.5, 'left', 700);
      txt(ctx, 'Động năng E = ' + (E_eV > 0 ? E_eV.toFixed(3) : '0') + ' eV', W - 18, 16, C.main, 13, 'right', 700);
      txt(ctx, 'Vận tốc pha v_p ≈ ' + vp_kms + ' km/s', W - 18, 32, C.mut, 11, 'right', 600);

      // Chú thích chân hình
      txt(ctx, '● Chấm vàng chớp tắt: Vị trí đo được electron. Xác suất |ψ|² đồng đều khắp mọi nơi (Bất định Heisenberg)',
        W / 2, H - 14, C.c1, 11, 'center', 600);
    }
  }]
});

/* ==========================================================================
   TAB 2 — GIẾNG THẾ VÔ HẠN: SÓNG DỪNG TRONG HỘP LƯỢNG TỬ
   Mô phỏng chiếc hộp lượng tử 2 vách phản xạ tuyệt đối (V = ∞).
   Sóng dừng rung bần bật; hạt chỉ xuất hiện ở bụng sóng, không có ở nút.
   ========================================================================== */
LABS.push({
  id: 'well', name: 'Giếng vô hạn', sec: 2,
  S: { n: 1, a: 75 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Hộp lượng tử giam giữ electron — Sóng dừng & Lượng tử hóa năng lượng',
    area: 'a', anim: true,
    ctrls: [
      { k: 'n', l: 'Mức lượng tử n', min: 1, max: 4, step: 1,
        f: v => 'n = ' + v + '  (' + v + ' bụng sóng, Eₙ = ' + (v * v) + '×E₁)' },
      { k: 'a', l: 'Bề rộng giếng a', min: 10, max: 100, step: 5,
        f: v => v + ' Å  (' + (v === 75 ? 'Câu 2' : v === 5 ? 'Ví dụ 2.3' : '') + ')' }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, n = Math.round(S.n), a_A = S.a;
      const wallThick = 28;
      // Bề rộng giếng trên màn hình co giãn theo giá trị a thực tế!
      const minBoxW = W * 0.32, maxBoxW = W * 0.82;
      const boxW = minBoxW + (a_A - 10) / 90 * (maxBoxW - minBoxW);
      const boxX = (W - boxW) / 2;
      const centerY = H * 0.5, boxH = clamp(H * 0.54, 110, 240);
      const topY = centerY - boxH / 2, botY = centerY + boxH / 2;

      // Vật lý: E_n = n^2 * pi^2 * hbar^2 / (2 * m * a^2)
      const a_m = a_A * 1e-10;
      const E1_eV = (Math.PI * Math.PI * HBAR * HBAR / (2 * ME * a_m * a_m)) / EV;
      const En_eV = n * n * E1_eV;

      // Tần số rung trực quan: tỉ lệ với n^2 và tỉ lệ nghịch với a
      const freq = (n * n * 2.2) * (50 / a_A);
      const phase = Math.cos(freq * t);

      /* ---- Vách tường thế năng vô hạn (V = ∞) hai bên ---- */
      // Vách trái
      rr(ctx, boxX - wallThick, topY - 12, wallThick, boxH + 24, 6);
      ctx.fillStyle = C.tint; ctx.fill();
      ctx.strokeStyle = C.c4; ctx.lineWidth = 2.5; ctx.stroke();
      txt(ctx, 'V = ∞', boxX - wallThick / 2, centerY, C.c4, 10.5, 'center', 700);

      // Vách phải
      rr(ctx, boxX + boxW, topY - 12, wallThick, boxH + 24, 6);
      ctx.fillStyle = C.tint; ctx.fill();
      ctx.strokeStyle = C.c4; ctx.lineWidth = 2.5; ctx.stroke();
      txt(ctx, 'V = ∞', boxX + boxW + wallThick / 2, centerY, C.c4, 10.5, 'center', 700);

      /* ---- Lòng giếng thế (0 < x < a, V = 0) ---- */
      rr(ctx, boxX, topY, boxW, boxH, 4);
      ctx.fillStyle = C.card; ctx.fill();
      ctx.strokeStyle = C.sub; ctx.lineWidth = 1; ctx.stroke();

      // Mũi tên đo bề rộng a ở đáy giếng
      arr(ctx, boxX + 6, botY + 16, boxX + boxW - 6, botY + 16, C.mut, 1.8);
      arr(ctx, boxX + boxW - 6, botY + 16, boxX + 6, botY + 16, C.mut, 1.8);
      txt(ctx, 'Chiều rộng giếng a = ' + a_A + ' Å', boxX + boxW / 2, botY + 16, C.ink, 11.5, 'center', 700);

      /* ---- Sóng dừng dao động tại chỗ: ψ_n(x, t) = sin(n*pi*x/a) * cos(omega*t) ---- */
      const waveAmp = boxH * 0.38;
      ctx.save();
      rr(ctx, boxX, topY, boxW, boxH, 4);
      ctx.clip();

      // Tô màu vùng sóng dương / âm
      ctx.beginPath();
      ctx.moveTo(boxX, centerY);
      for (let i = 0; i <= 200; i++) {
        const x = boxX + (i / 200) * boxW;
        const v = Math.sin(n * Math.PI * (i / 200)) * phase;
        ctx.lineTo(x, centerY - v * waveAmp);
      }
      ctx.lineTo(boxX + boxW, centerY); ctx.closePath();
      ctx.fillStyle = C.c2; ctx.globalAlpha = 0.22; ctx.fill(); ctx.globalAlpha = 1;

      // Đường sóng dừng
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = boxX + (i / 200) * boxW;
        const v = Math.sin(n * Math.PI * (i / 200)) * phase;
        const y = centerY - v * waveAmp;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = C.c2; ctx.lineWidth = 3; ctx.stroke();

      // Đánh dấu các ĐIỂM NÚT (Nodes: nơi biên độ sóng luôn bằng 0)
      for (let nodeIdx = 1; nodeIdx < n; nodeIdx++) {
        const nodeX = boxX + (nodeIdx / n) * boxW;
        ln(ctx, nodeX, centerY - 14, nodeX, centerY + 14, C.err, 2);
        txt(ctx, '× Nút', nodeX, centerY + 24, C.err, 10.5, 'center', 700);
      }

      /* ---- Các hạt electron xuất hiện theo xác suất |ψ|² ---- */
      if (!st.hits) st.hits = [];
      // Rejection sampling theo phân bố sin^2(n*pi*x/a)
      for (let tryCount = 0; tryCount < 5; tryCount++) {
        const u = Math.random();
        const pDensity = Math.pow(Math.sin(n * Math.PI * u), 2);
        if (Math.random() < pDensity) {
          st.hits.push({
            x: boxX + u * boxW,
            y: centerY + rnd(-waveAmp * 0.75, waveAmp * 0.75),
            life: 1.0
          });
          break;
        }
      }
      st.hits.forEach(h => {
        h.life -= dt * 2.0;
        if (h.life <= 0) return;
        ctx.globalAlpha = h.life * 0.85;
        dot(ctx, h.x, h.y, 3.5, C.c1);
        ctx.globalAlpha = 1;
      });
      st.hits = st.hits.filter(h => h.life > 0);
      ctx.restore();

      /* ---- Thông tin mức năng lượng lượng tử hóa ---- */
      txt(ctx, 'Mức n = ' + n + ' : E_' + n + ' = ' + En_eV.toFixed(3) + ' eV', 18, 16, C.main, 14, 'left', 700);
      txt(ctx, 'Mức cơ bản E₁ = ' + E1_eV.toFixed(3) + ' eV (Zero-point energy > 0)', 18, 34, C.mut, 11.5, 'left', 500);
      txt(ctx, 'Số bụng sóng = ' + n + '  |  Số nút sóng = ' + (n - 1), W - 18, 16, C.c2, 12, 'right', 600);
      txt(ctx, 'Tần số dao động ∝ n² (n=4 rung gấp 16 lần n=1)', W - 18, 34, C.c5, 11.5, 'right', 600);

      txt(ctx, '● Chấm vàng: Hạt tụ tập ở các BỤNG SÓNG (xác suất cực đại) và TUYỆT ĐỐI KHÔNG xuất hiện tại các ĐIỂM NÚT (×)',
        W / 2, H - 12, C.c1, 11, 'center', 600);
    }
  }]
});

/* ==========================================================================
   TAB 3 — BẬC THẾ NĂNG: SỰ ĐÂM XUYÊN HÀM MŨ VÀO VÙNG CẤM
   Minh họa hiện tượng sóng electron gặp gờ dốc thế năng V₀.
   Khi E < V₀: không bị bật lại ở mặt ngoài mà đâm sâu một đoạn δ = 1/κ vào trong tường!
   ========================================================================== */
LABS.push({
  id: 'step', name: 'Bậc thế năng', sec: 3,
  S: { E: 0.65, V0: 1.0 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Electron đập vào bậc thế năng — Sự đâm xuyên hàm mũ vào lòng bức tường',
    area: 'a', anim: true,
    ctrls: [
      { k: 'E', l: 'Năng lượng E', min: 0.1, max: 2.5, step: 0.05, f: v => v.toFixed(2) + ' eV' },
      { k: 'V0', l: 'Độ cao bậc thế V₀', min: 0.5, max: 2.5, step: 0.1, f: v => v.toFixed(1) + ' eV' }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, E = S.E, V0 = S.V0;
      const stepX = W * 0.44;
      const centerY = H * 0.52, waveH = clamp(H * 0.46, 100, 210);
      const underBarrier = E < V0;

      // Vật lý: κ = sqrt(2m(V0 - E))/hbar, độ sâu xuyên δ = 1/κ
      const diffEV = Math.abs(V0 - E);
      const kappa = underBarrier ? Math.sqrt(2 * ME * diffEV * EV) / HBAR : 0;
      const delta_nm = underBarrier ? (1 / kappa * 1e9).toFixed(2) : '∞ (Vượt rào)';
      const k1 = Math.sqrt(2 * ME * E * EV) / HBAR;

      /* ---- Nền 2 vùng: Trái (V = 0) và Phải (V = V0) ---- */
      // Vùng trái
      ctx.fillStyle = C.card;
      ctx.fillRect(14, centerY - waveH / 2, stepX - 14, waveH);

      // Vùng phải: Bức tường thế năng
      ctx.fillStyle = underBarrier ? 'rgba(235, 94, 40, 0.12)' : 'rgba(56, 189, 248, 0.1)';
      ctx.fillRect(stepX, centerY - waveH / 2, W - 14 - stepX, waveH);

      // Vách ranh giới tại x = 0
      ln(ctx, stepX, centerY - waveH / 2 - 8, stepX, centerY + waveH / 2 + 8, underBarrier ? C.c4 : C.c2, 3);
      txt(ctx, 'Ranh giới x = 0', stepX, centerY + waveH / 2 + 18, C.ink, 11, 'center', 700);

      txt(ctx, 'VÙNG I: V(x) = 0', (14 + stepX) / 2, centerY - waveH / 2 + 16, C.mut, 11, 'center', 700);
      txt(ctx, 'VÙNG II: Bậc thế V(x) = ' + V0.toFixed(1) + ' eV', (stepX + W - 14) / 2, centerY - waveH / 2 + 16,
        underBarrier ? C.c4 : C.c2, 11, 'center', 700);

      /* ---- Sóng electron: Vùng trái (giao thoa tới + phản xạ) & Vùng phải ---- */
      const k1px = 0.08 * Math.sqrt(E);
      const omega = k1px * 45;
      const amp = waveH * 0.28;

      ctx.save();
      rr(ctx, 14, centerY - waveH / 2, W - 28, waveH, 4);
      ctx.clip();

      if (underBarrier) {
        // E < V0: Phản xạ toàn phần (R = 1), tạo sóng dừng giao thoa bên trái
        // Bên phải: sóng đâm xuyên tắt dần e^(-kappa * x)
        const kappaPx = clamp(kappa * 1e-9 * 16, 0.02, 0.25);

        // Vùng sáng đâm xuyên trong lòng bức tường
        const grad = ctx.createLinearGradient(stepX, 0, stepX + 180, 0);
        grad.addColorStop(0, 'rgba(235, 94, 40, 0.35)');
        grad.addColorStop(1, 'rgba(235, 94, 40, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(stepX, centerY - waveH / 2, W - stepX, waveH);

        // Vẽ sóng bên trái (sóng tới + phản xạ)
        ctx.beginPath();
        for (let x = 14; x <= stepX; x += 2) {
          const dx = x - stepX;
          // Sóng dừng gần ranh giới
          const waveVal = Math.cos(k1px * dx) * Math.cos(omega * t);
          const y = centerY - waveVal * amp;
          x === 14 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = C.c2; ctx.lineWidth = 2.8; ctx.stroke();

        // Vẽ sóng đâm xuyên bên trong bức tường: tắt dần theo e^(-kappa * x)
        ctx.beginPath();
        ctx.moveTo(stepX, centerY - Math.cos(omega * t) * amp);
        for (let x = stepX; x <= W - 14; x += 2) {
          const dx = x - stepX;
          const decay = Math.exp(-kappaPx * dx);
          const waveVal = decay * Math.cos(omega * t);
          const y = centerY - waveVal * amp;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = C.c4; ctx.lineWidth = 2.8; ctx.stroke();

        // Vệt sáng chỉ độ sâu đâm xuyên delta = 1/kappa
        const deltaPx = clamp(1 / kappaPx, 10, W - stepX - 20);
        ln(ctx, stepX, centerY + waveH * 0.35, stepX + deltaPx, centerY + waveH * 0.35, C.c4, 2, [4, 3]);
        txt(ctx, 'Độ sâu đâm xuyên δ ≈ ' + delta_nm + ' nm', stepX + deltaPx / 2, centerY + waveH * 0.35 - 12,
          C.c4, 11, 'center', 700);

        // Hạt electron chui vào lòng bức tường rồi dội ra
        if (!st.penetrations) st.penetrations = [];
        if (Math.random() < 0.35) {
          st.penetrations.push({
            x: stepX + rnd(2, deltaPx * 1.2),
            y: centerY + rnd(-amp * 0.6, amp * 0.6),
            life: 1.0
          });
        }
        st.penetrations.forEach(pPoint => {
          pPoint.life -= dt * 2.5;
          if (pPoint.life <= 0) return;
          ctx.globalAlpha = pPoint.life * 0.9;
          dot(ctx, pPoint.x, pPoint.y, 4, C.c4);
          ctx.globalAlpha = 1;
        });
        st.penetrations = st.penetrations.filter(pPoint => pPoint.life > 0);
      } else {
        // E >= V0: Hạt vượt rào thế, sóng truyền tiếp sang phải với k2 < k1
        const k2px = 0.08 * Math.sqrt(E - V0);
        ctx.beginPath();
        for (let x = 14; x <= W - 14; x += 2) {
          const y = x < stepX
            ? centerY - Math.cos(k1px * (x - stepX) - omega * t) * amp
            : centerY - Math.cos(k2px * (x - stepX) - omega * t) * (amp * 0.85);
          x === 14 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = C.c1; ctx.lineWidth = 2.8; ctx.stroke();
        txt(ctx, 'Hạt đủ năng lượng vượt rào → Tiếp tục bay với bước sóng dài hơn',
          (stepX + W) / 2, centerY + waveH * 0.35, C.c1, 11.5, 'center', 700);
      }
      ctx.restore();

      /* ---- Bảng thông tin vật lý ---- */
      txt(ctx, underBarrier ? 'E < V₀: Cổ điển bật lại 100% tại x=0 — Lượng tử đâm sâu vào tường!' : 'E ≥ V₀: Hạt tự do vượt qua bậc thế',
        18, 16, underBarrier ? C.c4 : C.c1, 13.5, 'left', 700);
      txt(ctx, 'Năng lượng E = ' + E.toFixed(2) + ' eV  |  Độ cao V₀ = ' + V0.toFixed(1) + ' eV', 18, 34, C.mut, 11.5, 'left', 500);
      txt(ctx, underBarrier ? 'Hệ số suy giảm κ = ' + (kappa * 1e-9).toFixed(2) + ' ×10⁹ m⁻¹' : 'Hệ số phản xạ R < 1',
        W - 18, 16, C.ink, 12, 'right', 600);
      txt(ctx, underBarrier ? 'Độ sâu đâm xuyên δ = 1/κ ≈ ' + delta_nm + ' nm' : 'Truyền qua một phần',
        W - 18, 34, C.c5, 11.5, 'right', 600);

      txt(ctx, '● Chấm đỏ cam: Electron xuất hiện bên trong bức tường cấm trước khi quay đầu phản xạ',
        W / 2, H - 12, C.c4, 11, 'center', 600);
    }
  }]
});

/* ==========================================================================
   TAB 4 — RÀO THẾ MỎNG & XUYÊN HẦM LƯỢNG TỬ (QUANTUM TUNNELING)
   Mô phỏng linh kiện transistor nano có rào oxide mỏng nanomet.
   Kéo mỏng rào → electron xuyên qua như bóng ma → dòng rò ampe kế nhảy số!
   ========================================================================== */
LABS.push({
  id: 'tunnel', name: 'Xuyên hầm', sec: 4,
  S: { mat: 'si', d: 1.2, E: 0.6, V0: 1.2 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Xuyên hầm qua rào thế nanomet — Dòng rò lượng tử trong Transistor',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mat', seg: [['si', 'Silicon (m* = 0.98m₀)'], ['gaas', 'GaAs (m* = 0.067m₀)']] },
      { k: 'd', l: 'Độ dày rào d', min: 0.4, max: 3.5, step: 0.1, f: v => v.toFixed(1) + ' nm' },
      { k: 'E', l: 'Năng lượng E', min: 0.2, max: 2.0, step: 0.05, f: v => v.toFixed(2) + ' eV' },
      { k: 'V0', l: 'Rào V₀', min: 0.8, max: 2.5, step: 0.1, f: v => v.toFixed(1) + ' eV' }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const mEff = S.mat === 'gaas' ? 0.067 * ME : 0.98 * ME;
      const E = S.E, V0 = S.V0, d_nm = S.d;
      const underBarrier = E < V0;

      // Tính xác suất xuyên hầm T ≈ exp(-2 * kappa * d)
      const diffEV = Math.max(0, V0 - E);
      const kappa = Math.sqrt(2 * mEff * diffEV * EV) / HBAR;
      const d_m = d_nm * 1e-9;
      const T_prob = underBarrier ? Math.exp(-2 * kappa * d_m) : 1;
      const R_prob = 1 - T_prob;

      // Dòng điện tương đối
      const current_uA = T_prob * 850;

      // Tọa độ hình học
      const barCX = W * 0.48;
      // Bề rộng rào trên màn hình tỉ lệ trực tiếp với d thực tế!
      const barW = clamp(d_nm * 38, 16, W * 0.28);
      const barLeft = barCX - barW / 2, barRight = barCX + barW / 2;
      const centerY = H * 0.52, simH = clamp(H * 0.52, 110, 230);
      const topY = centerY - simH / 2, botY = centerY + simH / 2;

      /* ---- Cực phát (Source / Emitter) bên trái ---- */
      rr(ctx, 14, topY, barLeft - 22, simH, 8);
      ctx.fillStyle = C.card; ctx.fill();
      ctx.strokeStyle = C.sub; ctx.lineWidth = 1; ctx.stroke();
      txt(ctx, 'CỰC NGUỒN (SOURCE)', (14 + barLeft - 22) / 2, topY + 16, C.mut, 10.5, 'center', 700);

      /* ---- Rào thế cách điện mỏng ở giữa (Tunnel Barrier / Oxide layer) ---- */
      rr(ctx, barLeft, topY - 14, barW, simH + 28, 6);
      ctx.fillStyle = underBarrier ? 'rgba(235, 94, 40, 0.22)' : 'rgba(56, 189, 248, 0.18)';
      ctx.fill();
      ctx.strokeStyle = underBarrier ? C.c4 : C.c2; ctx.lineWidth = 2.5; ctx.stroke();

      txt(ctx, 'RÀO CÁCH ĐIỆN', barCX, topY - 24, underBarrier ? C.c4 : C.c2, 11, 'center', 700);
      txt(ctx, 'd = ' + d_nm.toFixed(1) + ' nm', barCX, centerY, underBarrier ? C.c4 : C.c2, 12, 'center', 800);
      txt(ctx, 'V₀ = ' + V0.toFixed(1) + ' eV', barCX, centerY + 18, C.mut, 10.5, 'center', 600);

      /* ---- Cực thu (Drain / Collector) bên phải + Ampe kế đo dòng rò ---- */
      rr(ctx, barRight + 8, topY, W - 14 - (barRight + 8), simH, 8);
      ctx.fillStyle = C.card; ctx.fill();
      ctx.strokeStyle = C.sub; ctx.lineWidth = 1; ctx.stroke();
      txt(ctx, 'CỰC MÁNG (DRAIN)', (barRight + 8 + W - 14) / 2, topY + 16, C.mut, 10.5, 'center', 700);

      // Đồng hồ Ampe kế hiển thị dòng rò
      const meterW = 140, meterH = 46;
      const meterX = W - 24 - meterW, meterY = botY - meterH - 8;
      rr(ctx, meterX, meterY, meterW, meterH, 6);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.strokeStyle = current_uA > 0.05 ? C.c1 : C.mut; ctx.lineWidth = 1.5; ctx.stroke();

      txt(ctx, 'DÒNG RÒ XUYÊN HẦM', meterX + meterW / 2, meterY + 12, C.mut, 9.5, 'center', 600);
      const currentStr = current_uA >= 1000 ? (current_uA / 1000).toFixed(2) + ' mA'
        : current_uA >= 0.01 ? current_uA.toFixed(2) + ' µA'
        : current_uA > 1e-5 ? (current_uA * 1000).toFixed(1) + ' nA' : '0.00 pA';
      txt(ctx, currentStr, meterX + meterW / 2, meterY + 30, current_uA > 0.05 ? C.c1 : C.mut, 15, 'center', 800);

      /* ---- Chùm electron bay tới, dội lại và XUYÊN QUA RÀO THẾ ---- */
      if (!st.particles) st.particles = [];

      // Sinh hạt mới từ cực Nguồn bên trái
      st.genTimer = (st.genTimer || 0) + dt;
      if (st.genTimer > 0.04) {
        st.genTimer = 0;
        st.particles.push({
          x: 24,
          y: centerY + rnd(-simH * 0.32, simH * 0.32),
          vx: rnd(140, 180),
          state: 'incoming', // incoming, reflected, tunneled
          alpha: 1.0
        });
      }

      st.particles.forEach(pt => {
        if (pt.state === 'incoming') {
          pt.x += pt.vx * dt;
          if (pt.x >= barLeft) {
            // Quyết định số phận hạt: Xuyên hầm hay Bị dội lại!
            if (Math.random() < T_prob) {
              pt.state = 'tunneled';
              pt.x = barRight + 2; // Nhảy xuyên sang bờ bên kia rào thế!
              pt.vx = Math.abs(pt.vx);
            } else {
              pt.state = 'reflected';
              pt.vx = -Math.abs(pt.vx);
            }
          }
        } else if (pt.state === 'reflected') {
          pt.x += pt.vx * dt;
          if (pt.x < 16) pt.alpha -= dt * 3;
        } else if (pt.state === 'tunneled') {
          pt.x += pt.vx * dt;
          if (pt.x > W - 20) pt.alpha -= dt * 3;
        }

        // Vẽ hạt electron
        ctx.globalAlpha = clamp(pt.alpha, 0, 1);
        const ptCol = pt.state === 'tunneled' ? C.c1 : pt.state === 'reflected' ? C.c4 : C.c2;
        dot(ctx, pt.x, pt.y, pt.state === 'tunneled' ? 4.5 : 3.5, ptCol);

        // Vệt sáng đuôi hạt
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x - (pt.vx > 0 ? 1 : -1) * 10, pt.y);
        ctx.strokeStyle = ptCol; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.globalAlpha = 1;
      });

      st.particles = st.particles.filter(pt => pt.alpha > 0 && pt.x >= 10 && pt.x <= W);

      /* ---- Bảng thông tin vật lý ---- */
      txt(ctx, S.mat === 'gaas' ? 'Vật liệu: GaAs (m* = 0.067 m₀ — Siêu nhẹ, Xuyên hầm cực mạnh!)'
                                : 'Vật liệu: Silicon (m* = 0.98 m₀ — Khối lượng lớn hơn, Rào cản tốt hơn)',
        18, 16, S.mat === 'gaas' ? C.c5 : C.c2, 13, 'left', 700);
      txt(ctx, 'Xác suất xuyên hầm T ≈ ' + (T_prob * 100 >= 0.01 ? (T_prob * 100).toFixed(2) + ' %' : sci(T_prob * 100, 1) + ' %'),
        18, 34, current_uA > 0.05 ? C.c1 : C.mut, 13, 'left', 700);

      txt(ctx, 'Hệ số suy giảm κ = ' + (kappa * 1e-9).toFixed(2) + ' ×10⁹ m⁻¹', W - 18, 16, C.ink, 12, 'right', 600);
      txt(ctx, 'Hệ số phản xạ R ≈ ' + (R_prob * 100).toFixed(2) + ' %', W - 18, 34, C.c4, 12, 'right', 600);

      txt(ctx, '● Hạt xanh lá: Electron XUYÊN HẦM chui qua lớp cách điện nanomet  |  ● Hạt cam: Electron bị dội ngược lại',
        W / 2, H - 12, C.c1, 11, 'center', 600);
    }
  }]
});

/* ==========================================================================
   TAB 5 — NGUYÊN TỬ HYDRO & NGUYÊN LÝ PAULI
   Mô phỏng 2 chế độ:
   1. Đám mây orbital electron thực tế (1s đặc, 2s có vành nút cầu, 2p hình quả tạ)
   2. Cơ chế điền electron vào các lớp vỏ theo nguyên lý loại trừ Pauli (H → Si)
   ========================================================================== */
LABS.push({
  id: 'atom', name: 'Vỏ e⁻ & Pauli', sec: 5,
  S: { mode: 'pauli', orb: '1s', Z: 14 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Cấu trúc nguyên tử lượng tử — Đám mây Orbital & Nguyên lý Loại trừ Pauli',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mode', seg: [['pauli', 'Điền vỏ Pauli (H → Si)'], ['orb', 'Đám mây Orbital (1s, 2s, 2p, 3s)']],
        set: { pauli: {}, orb: {} } },
      { k: 'Z', l: 'Nguyên tố (Z)', min: 1, max: 14, step: 1,
        f: v => 'Z = ' + v + ' (' + ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si'][v - 1] + ')' },
      { k: 'orb', seg: [['1s', '1s (Cầu đặc)'], ['2s', '2s (Nút cầu)'], ['2p', '2p (Quả tạ)'], ['3s', '3s (2 nút)']] }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, mode = S.mode;
      const nucX = W * 0.5, nucY = H * 0.52;

      if (mode === 'orb') {
        /* ================= CHẾ ĐỘ 1: ĐÁM MÂY ORBITAL XÁC SUẤT ================= */
        const orb = S.orb;
        const rmaxBohr = orb === '1s' ? 6 : orb.startsWith('2') ? 16 : 28;
        const scale = Math.min(W, H) * 0.42 / rmaxBohr;

        // Reset cloud nếu đổi orbital
        if (st.curOrb !== orb) {
          st.curOrb = orb;
          st.cloudDots = [];
        }

        // Hàm mật độ xác suất |ψ(r, θ)|²
        function getProb(r, th) {
          if (orb === '1s') return Math.exp(-2 * r);
          if (orb === '2s') {
            const f = (2 - r) * Math.exp(-r / 2);
            return f * f * 0.28;
          }
          if (orb === '2p') {
            return r * r * Math.exp(-r) * Math.pow(Math.cos(th), 2) * 0.75;
          }
          if (orb === '3s') {
            const f = (27 - 18 * r + 2 * r * r) * Math.exp(-2 * r / 3);
            return f * f * 0.0006;
          }
          return Math.exp(-2 * r);
        }

        // Sinh liên tục các chấm lượng tử (mỗi chấm = 1 lần đo thấy electron)
        const maxProb = orb === '1s' ? 1 : orb === '2s' ? 0.28 : orb === '2p' ? 0.35 : 0.05;
        for (let attempt = 0; attempt < 25; attempt++) {
          const r = Math.random() * rmaxBohr;
          const th = Math.random() * TAU2;
          const pr = getProb(r, th) * r; // nhân thêm Jacobian r (mặt cắt 2D)
          if (Math.random() * maxProb * rmaxBohr < pr) {
            st.cloudDots.push({
              x: nucX + r * Math.cos(th) * scale,
              y: nucY + r * Math.sin(th) * scale,
              life: 1.0
            });
          }
        }

        st.cloudDots.forEach(d => {
          d.life -= dt * 0.45;
          if (d.life <= 0) return;
          ctx.globalAlpha = d.life * 0.75;
          dot(ctx, d.x, d.y, 2.2, orb === '2p' ? C.c5 : orb === '2s' ? C.c2 : C.c1);
          ctx.globalAlpha = 1;
        });
        st.cloudDots = st.cloudDots.filter(d => d.life > 0);

        // Nút cầu (Spherical Node) của 2s tại r = 2 a0
        if (orb === '2s') {
          const nodeR = 2 * scale;
          ctx.beginPath(); ctx.arc(nucX, nucY, nodeR, 0, TAU2);
          ctx.strokeStyle = C.err; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
          txt(ctx, 'Vành nút cầu |ψ|² = 0 (r = 2a₀)', nucX + nodeR + 6, nucY, C.err, 10.5, 'left', 600);
        }

        // Hạt nhân proton ở giữa
        dot(ctx, nucX, nucY, 8, C.c4);
        txt(ctx, '+1', nucX, nucY + 0.5, C.bg, 9.5, 'center', 800);

        // Chú thích orbital
        const orbInfo = {
          '1s': 'Orbital 1s: n=1, l=0, m=0 — Đối xứng cầu hoàn toàn, dày nhất tại bán kính Bohr a₀ = 0.53 Å',
          '2s': 'Orbital 2s: n=2, l=0, m=0 — Có 1 mặt NÚT CẦU tĩnh lặng (vòng đỏ). Electron không bao giờ ở trên nút!',
          '2p': 'Orbital 2p: n=2, l=1, m=0 — Hướng tính hình quả tạ (2 thùy đối xứng), mặt phẳng nút đi qua hạt nhân',
          '3s': 'Orbital 3s: n=3, l=0, m=0 — Dãn nở to hơn với 2 mặt nút cầu đồng tâm'
        };
        txt(ctx, orbInfo[orb] || '', W / 2, 18, C.main, 12.5, 'center', 700);
        txt(ctx, 'Mỗi chấm sáng là một lần "chụp ảnh" bắt gặp electron tại vị trí đó', W / 2, 36, C.mut, 11, 'center', 500);

      } else {
        /* ================= CHẾ ĐỘ 2: ĐIỀN ELECTRON THEO NGUYÊN LÝ PAULI ================= */
        const Z = Math.round(S.Z);
        const elemNames = ['Hydro (H)','Heli (He)','Liti (Li)','Beri (Be)','Bo (B)','Cacbon (C)','Nito (N)','Oxi (O)','Flo (F)','Neon (Ne)','Natri (Na)','Magie (Mg)','Nhom (Al)','SILICON (Si)'];
        const configs = [
          '1s¹', '1s² (Khí hiếm bền)', '[He] 2s¹', '[He] 2s²', '[He] 2s² 2p¹', '[He] 2s² 2p²',
          '[He] 2s² 2p³ (Bán bão hòa)', '[He] 2s² 2p⁴', '[He] 2s² 2p⁵', '[He] 2s² 2p⁶ (Khí hiếm Ne)',
          '[Ne] 3s¹', '[Ne] 3s²', '[Ne] 3s² 3p¹', '[Ne] 3s² 3p² (BÁN DẪN 4 e⁻ HÓA TRỊ)'
        ];

        // 3 lớp vỏ chính (shells n = 1, 2, 3)
        const shellR = { 1: clamp(H * 0.17, 45, 75), 2: clamp(H * 0.31, 85, 140), 3: clamp(H * 0.44, 125, 200) };

        // Cấu hình tọa độ 14 electron theo Pauli và Hund
        const ELEC_TABLE = [
          { n: 1, l: '1s', ms: +1, angle0: 0, speed: 2.2 },
          { n: 1, l: '1s', ms: -1, angle0: Math.PI, speed: -2.1 },
          { n: 2, l: '2s', ms: +1, angle0: 0.5, speed: 1.5 },
          { n: 2, l: '2s', ms: -1, angle0: Math.PI + 0.5, speed: -1.4 },
          { n: 2, l: '2p', ms: +1, angle0: 0.1, speed: 1.6 }, // Hund 2p_x ↑
          { n: 2, l: '2p', ms: +1, angle0: 2.1, speed: 1.55 }, // Hund 2p_y ↑
          { n: 2, l: '2p', ms: +1, angle0: 4.2, speed: 1.5 }, // Hund 2p_z ↑
          { n: 2, l: '2p', ms: -1, angle0: 0.8, speed: -1.6 }, // 2p_x ↓
          { n: 2, l: '2p', ms: -1, angle0: 2.8, speed: -1.55 }, // 2p_y ↓
          { n: 2, l: '2p', ms: -1, angle0: 4.9, speed: -1.5 }, // 2p_z ↓
          { n: 3, l: '3s', ms: +1, angle0: 0.4, speed: 1.1 },
          { n: 3, l: '3s', ms: -1, angle0: Math.PI + 0.4, speed: -1.05 },
          { n: 3, l: '3p', ms: +1, angle0: 1.2, speed: 1.15 }, // Hund 3p_x ↑
          { n: 3, l: '3p', ms: +1, angle0: 3.5, speed: 1.1 }   // Hund 3p_y ↑ (Si!)
        ];

        // Vẽ các vòng vỏ quỹ đạo nét đứt n = 1, 2, 3
        const maxShell = Z <= 2 ? 1 : Z <= 10 ? 2 : 3;
        for (let nVal = 1; nVal <= maxShell; nVal++) {
          const r = shellR[nVal];
          ctx.beginPath(); ctx.arc(nucX, nucY, r, 0, TAU2);
          ctx.strokeStyle = nVal === maxShell ? C.c2 : C.g;
          ctx.lineWidth = nVal === maxShell ? 1.8 : 1.2;
          ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
          txt(ctx, 'Vỏ n = ' + nVal + (nVal === 1 ? ' (K)' : nVal === 2 ? ' (L)' : ' (M - Hóa trị)'),
            nucX + r + 6, nucY, C.mut, 10.5, 'left', 600);
        }

        // Hạt nhân ở giữa (điện tích Z+)
        const nucR = 12 + Z * 0.6;
        dot(ctx, nucX, nucY, nucR, C.c4);
        txt(ctx, '+' + Z, nucX, nucY + 0.5, C.bg, 11 + Math.min(Z * 0.4, 4), 'center', 800);

        // Khởi tạo electron nếu thay đổi Z
        if (!st.elecs || st.curZ !== Z) {
          st.curZ = Z;
          st.elecs = ELEC_TABLE.slice(0, Z).map(cfg => ({
            ...cfg,
            curAngle: cfg.angle0
          }));
        }

        // Cập nhật vị trí và vẽ electron
        st.elecs.forEach((e, idx) => {
          e.curAngle += e.speed * dt;
          const r = shellR[e.n];
          const ex = nucX + r * Math.cos(e.curAngle);
          const ey = nucY + r * Math.sin(e.curAngle);

          // Vệt chuyển động
          for (let step = 1; step <= 5; step++) {
            const trAngle = e.curAngle - e.speed * dt * step * 2.5;
            const tx = nucX + r * Math.cos(trAngle);
            const ty = nucY + r * Math.sin(trAngle);
            ctx.globalAlpha = (1 - step / 6) * 0.22;
            dot(ctx, tx, ty, 3.5, e.ms > 0 ? C.c1 : C.c5);
            ctx.globalAlpha = 1;
          }

          // Electron hạt
          const isValence = (e.n === maxShell && maxShell > 1);
          dot(ctx, ex, ey, isValence ? 8 : 7, e.ms > 0 ? C.c1 : C.c5);
          ctx.strokeStyle = C.bg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ex, ey, isValence ? 8 : 7, 0, TAU2); ctx.stroke();

          // Ký hiệu Spin (↑ hoặc ↓)
          txt(ctx, e.ms > 0 ? '↑' : '↓', ex, ey + 0.5, C.bg, 11, 'center', 800);

          // Nhãn phân lớp (1s, 2s, 2p, 3s, 3p)
          txt(ctx, e.l, ex + 10, ey - 9, isValence ? C.main : C.mut, 10, 'left', isValence ? 700 : 500);
        });

        // Bảng tóm tắt cấu hình nguyên tử
        txt(ctx, elemNames[Z - 1] + '  —  Cấu hình: ' + configs[Z - 1], W / 2, 18, C.main, 14, 'center', 700);

        let pauliMsg = '';
        if (Z === 2) pauliMsg = 'Lớp 1s đã đầy 2 electron đối song (↑↓). Pauli cấm hạt thứ 3 vào 1s!';
        else if (Z === 3) pauliMsg = 'Liti: Electron thứ 3 bị Pauli "đuổi" ra lớp n=2! Tạo nên 1 e hóa trị dẫn điện.';
        else if (Z === 7) pauliMsg = 'Nito: 3 electron ở 2p đều mang spin ↑ chiếm 3 ô khác nhau (Quy tắc Hund).';
        else if (Z === 10) pauliMsg = 'Neon: Cả lớp n=1 và n=2 đều kín đặc electron → Khí hiếm trơ cực kỳ bền vững.';
        else if (Z === 14) pauliMsg = 'SILICON: 4 electron hóa trị ngoài cùng ở lớp n=3 (3s² 3p²) tạo mạng tinh thể bán dẫn!';
        else pauliMsg = 'Mỗi trạng thái (n, l, m, s) chỉ chứa duy nhất 1 electron (Nguyên lý Loại trừ Pauli)';

        txt(ctx, pauliMsg, W / 2, 36, Z === 14 ? C.c1 : C.c5, 11.5, 'center', 600);
      }

      txt(ctx, '● Xanh dương: Spin ↑ (ms = +½)   |   ● Tím hồng: Spin ↓ (ms = −½)   |   Đầy 2 hạt đối spin là đóng vỏ',
        W / 2, H - 12, C.mut, 11, 'center', 500);
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
    ['i', 'Hạt tự do: không có lực nào tác dụng (V = 0). Phương trình Schrödinger cho nghiệm là sóng phẳng chạy Ψ = A·e^{j(kx − ωt)}.'],
    ['w', 'Sóng lan truyền liên tục trong không gian. Đỉnh sóng nhấp nhô chạy sang phải khi k > 0 và chạy sang trái khi k < 0.'],
    ['w', 'Chấm vàng chớp tắt là các vị trí phát hiện electron: Chúng xuất hiện hoàn toàn ngẫu nhiên và đồng đều khắp nơi (|Ψ|² = hằng số).'],
    ['i', 'Nguyên lý Bất định Heisenberg: Động lượng p = ħk được biết chính xác 100%, nhưng vị trí electron thì hoàn toàn bất định!'],
    ['v', 'Kéo k đổi chiều và bước sóng; thử k = 0 để thấy sóng phẳng lặng và hạt đứng yên.']
  ],
  react(S, k, P, say) {
    const kVal = Math.abs(S.k) * 1e8;
    const E = kVal !== 0 ? (HBAR * HBAR * kVal * kVal / (2 * ME * EV)) : 0;
    const lam = S.k !== 0 ? (TAU2 / kVal * 1e10).toFixed(2) : '∞';
    if (k === 'k' || k === 'pres') {
      say('v', `Số sóng k = ${S.k > 0 ? '+' : ''}${S.k.toFixed(1)}×10⁸ m⁻¹ → Bước sóng λ = ${lam} Å, Động năng E = ${E.toFixed(3)} eV.`);
      if (S.k > 0) say('w', 'k > 0: Sóng phẳng chạy về phía +x. Đỉnh sóng trôi sang phải với vận tốc pha v_p = ω/k.');
      else if (S.k < 0) say('w', 'k < 0: Sóng phẳng chạy về phía −x. Động lượng p = ħk mang dấu âm (hướng ngược lại).');
      else say('i', 'k = 0: Sóng không dao động, năng lượng E = 0. Hạt đứng yên nhưng vị trí vẫn bất định.');
    } else if (k === 'dens') {
      say('w', S.dens > 1 ? 'Chùm hạt dày hơn: Số lần máy dò bắt gặp electron tăng lên.' : 'Chùm hạt thưa hơn.');
    }
  }
};

LD.well = {
  intro: [
    ['i', 'Hai vách giếng cao vô hạn (V = ∞) giam hãm electron trong khoảng 0 < x < a. Sóng vật chất bị phản xạ qua lại liên tục.'],
    ['w', 'Giao thoa giữa sóng tới và sóng phản xạ tạo thành SÓNG DỪNG (Standing Wave): Sóng không chạy mà dao động tại chỗ.'],
    ['w', 'Các bụng sóng phập phồng nhịp nhàng. Các điểm nút (×) đứng yên tuyệt đối, biên độ sóng luôn bằng 0.'],
    ['i', 'Lượng tử hóa năng lượng: Sóng bắt buộc triệt tiêu tại 2 vách, nên chiều dài a phải chứa đúng nguyên lần nửa bước sóng (a = n·λ/2).'],
    ['v', 'Kéo n: xem số bụng sóng tăng lên và tần số rung nhanh gấp n² lần. Kéo a: giếng hẹp lại làm năng lượng tăng vọt!']
  ],
  react(S, k, P, say) {
    const n = Math.round(S.n), a_A = S.a;
    const a_m = a_A * 1e-10;
    const E1 = (Math.PI * Math.PI * HBAR * HBAR / (2 * ME * a_m * a_m)) / EV;
    const En = n * n * E1;
    if (k === 'n') {
      say('v', `Mức n = ${n}: Có ${n} bụng sóng và ${n - 1} nút sóng. Năng lượng E_${n} = ${En.toFixed(3)} eV = ${n}² × E₁.`);
      say('w', `Tần số rung tăng theo n² = ${n * n} lần: Hạt ở mức n=${n} chuyển động dữ dội hơn nhiều so với n=1.`);
    } else if (k === 'a') {
      say('v', `Bề rộng a = ${a_A} Å → Mức cơ bản E₁ = ${E1.toFixed(3)} eV (E tỉ lệ nghịch với a²).`);
      say('w', a_A < 30 ? 'Giếng rất hẹp: Sóng bị nén mạnh, năng lượng tăng vọt (hiệu ứng giam giữ lượng tử trong giếng nano).'
                         : 'Giếng mở rộng: Khoảng cách giữa các mức năng lượng thu hẹp dần.');
    }
  }
};

LD.step = {
  intro: [
    ['i', 'Bậc thế năng: Tại x = 0, thế năng đột ngột tăng lên V₀. Hãy so sánh hành vi lượng tử với quả bóng cơ học cổ điển!'],
    ['w', 'Cổ điển: Nếu E < V₀, quả bóng đập vào mặt gờ dốc và bật ngược lại 100%, không bao giờ lọt vào bên trong gờ dốc dù chỉ 1 nm.'],
    ['w', 'Lượng tử: Sóng electron đâm xuyên vào sâu bên trong bức tường cấm theo hàm mũ giảm dần e^{−κx}!'],
    ['i', 'Độ sâu đâm xuyên δ = 1/κ: Vùng electron thấm vào trước khi bị dội ngược lại hoàn toàn (R = 1).'],
    ['v', 'Kéo E tăng sát V₀: Độ chênh (V₀ − E) giảm → electron thấm càng sâu vào lòng bức tường!']
  ],
  react(S, k, P, say) {
    const E = S.E, V0 = S.V0;
    if (E < V0) {
      const kappa = Math.sqrt(2 * ME * (V0 - E) * EV) / HBAR;
      const delta_nm = (1 / kappa * 1e9).toFixed(2);
      say('v', `E = ${E.toFixed(2)} eV < V₀ = ${V0.toFixed(1)} eV → Độ sâu đâm xuyên δ = 1/κ ≈ ${delta_nm} nm.`);
      say('w', `Electron tồn tại một đoạn ~${delta_nm} nm bên trong vùng cấm trước khi quay đầu phản xạ.`);
    } else {
      say('v', `E = ${E.toFixed(2)} eV ≥ V₀ = ${V0.toFixed(1)} eV: Hạt đủ năng lượng vượt rào.`);
      say('w', 'Sóng tiếp tục truyền sang phải với bước sóng dãn dài hơn và vận tốc chậm hơn.');
    }
  }
};

LD.tunnel = {
  intro: [
    ['i', 'Xuyên hầm lượng tử (Quantum Tunneling): Hiện tượng kỳ diệu chi phối giới hạn thu nhỏ của transistor nano hiện đại.'],
    ['w', 'Khi rào thế chỉ là một bức tường mỏng nanomet, đuôi sóng đâm xuyên chưa kịp tắt hẳn đã chạm tới bờ bên kia!'],
    ['w', 'Electron chui xuyên qua bức tường đặc như bóng ma: Cực thu bên phải bắt đầu xuất hiện dòng rò!'],
    ['i', 'Xác suất T ≈ exp(−2κd): Cực kỳ nhạy cảm với độ dày d. Rào mỏng đi một chút là dòng rò tăng vọt hàng ngàn lần.'],
    ['v', 'Kéo mỏng d từ 3 nm xuống 1 nm và quan sát ampe kế nhảy số. Chuyển sang GaAs để thấy hạt nhẹ xuyên hầm mạnh hơn Si!']
  ],
  react(S, k, P, say) {
    const mEff = S.mat === 'gaas' ? 0.067 * ME : 0.98 * ME;
    const diffEV = Math.max(0, S.V0 - S.E);
    const kappa = Math.sqrt(2 * mEff * diffEV * EV) / HBAR;
    const T = S.E < S.V0 ? Math.exp(-2 * kappa * S.d * 1e-9) : 1;
    const tPercent = (T * 100);
    say('v', `Độ dày d = ${S.d.toFixed(1)} nm, V₀ = ${S.V0.toFixed(1)} eV, E = ${S.E.toFixed(2)} eV → Xác suất T ≈ ${tPercent >= 0.01 ? tPercent.toFixed(2) + '%' : sci(tPercent, 1) + '%'}.`);
    if (k === 'mat') {
      say('w', S.mat === 'gaas'
        ? 'Chuyển sang GaAs: Khối lượng hiệu dụng m* = 0.067 m₀ (nhẹ hơn Silicon 14 lần) → κ giảm mạnh → Xuyên hầm tăng vọt hàng triệu lần!'
        : 'Chuyển sang Silicon: m* = 0.98 m₀ nặng hơn, electron khó xuyên hầm hơn.');
    } else if (k === 'd') {
      say('w', S.d <= 1.0 ? 'Rào cực mỏng (d ≤ 1 nm): Transistor bị rò điện nghiêm trọng, không thể tắt hoàn toàn!'
                           : 'Rào dày (d > 2.5 nm): Xuyên hầm bị dập tắt, dòng rò gần như bằng 0.');
    }
  }
};

LD.atom = {
  intro: [
    ['i', 'Nguyên tử lượng tử: Electron không bay theo đường tròn cổ điển của Bohr, mà tạo thành ĐÁM MÂY XÁC SUẤT phát sáng quanh hạt nhân.'],
    ['w', 'Orbital 1s: Đám mây hình cầu đặc quanh hạt nhân. 2s: Có một mặt nút cầu |ψ|² = 0. 2p: Hình quả tạ 2 thùy hướng tính.'],
    ['i', 'Nguyên lý Loại trừ Pauli: Không có hai electron nào trong cùng nguyên tử có chung 4 số lượng tử (n, l, m, s).'],
    ['w', 'Mỗi trạng thái chỉ chứa tối đa 2 electron đối spin (↑ và ↓). Đầy vỏ thì electron tiếp theo buộc phải nhảy ra vỏ ngoài!'],
    ['v', 'Kéo Z từ 1 đến 14: Thấy e₃ bị đuổi lên n=2 (Li), e điền Hund ở 2p, và Silicon (Z=14) có đúng 4 e hóa trị ngoài cùng!']
  ],
  react(S, k, P, say) {
    if (S.mode === 'pauli') {
      const Z = Math.round(S.Z);
      const names = ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si'];
      say('v', `Nguyên tố Z = ${Z} (${names[Z - 1]}):`);
      if (Z === 2) say('w', 'Heli (He): Lớp 1s bão hòa với 2 electron ↑↓. Khí hiếm trơ cực kỳ bền.');
      else if (Z === 3) say('i', 'Liti (Li): Pauli cấm e thứ 3 vào 1s! Bắt buộc nhảy lên 2s → 1 e hóa trị dễ mất, kim loại kiềm.');
      else if (Z === 6) say('w', 'Cacbon (C): 2 electron ở 2p chia vào 2 orbital khác nhau với spin cùng hướng ↑ (Quy tắc Hund).');
      else if (Z === 10) say('w', 'Neon (Ne): Đầy cả lớp n=1 và n=2 (1s² 2s² 2p⁶). Khí hiếm bền vững.');
      else if (Z === 14) say('i', 'SILICON (Si): Có 4 electron hóa trị ở lớp n=3 (3s² 3p²). Tạo 4 liên kết cộng hóa trị hình thành mạng bán dẫn Si!');
    } else {
      const desc = {
        '1s': '1s: n=1, l=0. Bán kính Bohr a₀ = 0.53 Å là nơi mật độ electron dày đặc nhất.',
        '2s': '2s: n=2, l=0. Vành nút cầu tĩnh lặng tại r = 2a₀: Electron có thể ở trong hoặc ngoài, nhưng không bao giờ ở trên vành!',
        '2p': '2p: n=2, l=1. Hướng tính rõ rệt theo trục không gian (hình quả tạ), mặt phẳng nút đi qua hạt nhân.',
        '3s': '3s: n=3, l=0. Kích thước dãn rộng với 2 mặt nút cầu.'
      };
      say('w', desc[S.orb] || '');
    }
  }
};

LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (Tự chèn CSS + HTML popup, đồng bộ với phong cách hệ thống)
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
.lb3-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.lb3-c{display:flex;flex-wrap:wrap;gap:6px 14px;padding:4px 10px 8px;flex:none;align-items:center}
.lb3-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb3-k input[type=range]{width:clamp(70px,8vw,120px);margin:0}
.lb3-k output{color:var(--ink);font-weight:700;min-width:3.2em}
.lb3-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb3-seg button,.lb3-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer}
.lb3-btn{background:var(--tint)}
.lb3-seg button:hover,.lb3-btn:hover{color:var(--ink)}
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
@media(max-width:900px){.lb3-win{width:100vw;height:100dvh;border-radius:0}.lb3-b{overflow:auto;display:flex;flex-direction:column}.lb3-p{min-height:260px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.200 6.200V2"/><path d="M4.600 10h6.800"/></svg>';

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
  }, 350);
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
  tab.panels.concat([{ title: 'Nhật ký thí nghiệm', area: 'l', log: true }]).forEach((spec, i) => {
    const el = document.createElement('div'); el.className = 'lb3-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb3-t"></div><div class="lb3-cv"><canvas></canvas></div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) {
      const lg = document.createElement('div'); lg.className = 'lb3-log'; lg.setAttribute('aria-live', 'polite');
      el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el);
      curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 250 + j * 900)));
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
    const ctx = p.ctx; ctx.clearRect(0, 0, p.W, p.H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, p.W, p.H);
    ctx.save(); p.spec.draw(p, ctx, p.W, p.H, tAcc, dt); ctx.restore();
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
