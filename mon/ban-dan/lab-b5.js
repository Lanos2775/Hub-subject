/* ==========================================================================
   lab-b5.js — PHÒNG THÍ NGHIỆM VẬT LÝ BÁN DẪN BUỔI 5 (Mô phỏng Vật lý Thực tế)
   - Tự chứa hoàn toàn: tự chèn CSS + HTML popup, đồng bộ 100% bảng màu & font trang.
   - TUYỆT ĐỐI KHÔNG BIỂU ĐỒ, KHÔNG SƠ ĐỒ TRỪU TƯỢNG, KHÔNG Ô HUD THỪA.
   - 5 tab mô phỏng trực tiếp hiện tượng vật lý bán dẫn sát bài học & bài tập Buổi 5:
       1. Cân bằng n₀, p₀: Buồng tinh thể Si (E_c−E_F, T, sinh nhiệt & va chạm tái hợp)
       2. Đứt liên kết & nᵢ: Kính hiển vi mạng tinh thể Si (phonon, tia photon, hole hopping)
       3. Lò nhiệt Ge / Si / GaAs: 3 phiến bán dẫn thực + đo dòng, nᵢ, ΔE_Fi & điện trở suất ρᵢ
       4. Bohr mở rộng & E_i: Kính hiển vi kép Donor P & Acceptor B trên lưới Si 5.43 Å
       5. Pha tạp III-V (GaAs): Kính hiển vi mạng Ga–As, thế chỗ Ga/As bằng Si, Ge, Se, Zn
   - API: LabB5.open(tabId?, panelIndex?)  LabB5.close()  LabB5.mark(root)  LabB5.tabs()
   ========================================================================== */
(function () {
'use strict';

/* ---------- Hằng số vật lý & tiện ích toán học ---------- */
const TAU = Math.PI * 2;
const KB = 8.617333e-5; // eV/K
const Q_EL = 1.6021766e-19; // C
const EG_SI = 1.12;

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ex = x => Math.exp(clamp(x, -300, 300));
const lg = v => Math.log10(Math.max(v, 1e-30));

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[d]).join('');
const sci = (x, d = 1) => {
  if (!x || !isFinite(x)) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  return (x / Math.pow(10, e)).toFixed(d) + '×10' + sup(e);
};

/* Thông số vật liệu bán dẫn chuẩn ở 300 K (khớp bảng & bài tập Buổi 5) */
const MAT = {
  ge: { n: 'Ge', full: 'Germani (Ge)', Eg: 0.66, Nc: 1.04e19, Nv: 6.0e18, mn: 0.55, mp: 0.37, mun: 3900, mup: 1900, col: 'c3' },
  si: { n: 'Si', full: 'Silicon (Si)', Eg: 1.12, Nc: 2.80e19, Nv: 1.04e19, mn: 1.08, mp: 0.56, mun: 1400, mup: 450, col: 'c2' },
  ga: { n: 'GaAs', full: 'GaAs', Eg: 1.42, Nc: 4.70e17, Nv: 7.00e18, mn: 0.067, mp: 0.48, mun: 8500, mup: 400, col: 'c4' }
};
const ncT = (m, T) => m.Nc * Math.pow(T / 300, 1.5);
const nvT = (m, T) => m.Nv * Math.pow(T / 300, 1.5);
const niM = (m, T) => Math.sqrt(ncT(m, T) * nvT(m, T)) * Math.exp(-m.Eg / (2 * KB * T));
const NI = T => niM(MAT.si, T);

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
  ctx.strokeStyle = hexA(C.g, 0.38);
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
   TAB 1 — CÂN BẰNG HẠT TẢI & TÁC DỤNG KHỐI LƯỢNG (n₀, p₀ theo E_c−E_F & T)
   Mô phỏng thuần túy buồng tinh thể Silicon pha tạp dưới kính hiển vi:
   - Điều khiển trực tiếp khoảng cách E_c − E_F (eV) và nhiệt độ T (khớp Mục 1 & Câu 1)
   - Tính chính xác N_c(T), N_v(T), n₀, p₀ và tích n₀·p₀ = nᵢ²
   - Ion tạp chất cố định P⁺ / B⁻ + sinh nhiệt & va chạm tái hợp thực tế trong tinh thể
   ========================================================================== */
LABS.push({
  id: 'nop', name: 'Cân bằng n₀, p₀', no: '1', secs: [1],
  S: { EcEf: 0.25, T: 300 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Buồng tinh thể Silicon — Nồng độ cân bằng n₀, p₀ theo vị trí E_F & nhiệt độ T',
    area: 'a', anim: true,
    ctrls: [
      { k: 'EcEf', l: 'E_c − E_F', min: 0.10, max: 1.02, step: 0.01,
        f: v => v.toFixed(2) + ' eV' },
      { k: 'T', l: 'Nhiệt độ T', min: 150, max: 500, step: 10, f: v => v + ' K' },
      { btn: 'Câu 1a (N · 300K)', fn: p => { p.S.EcEf = 0.25; p.S.T = 300; p.syncCtrls(); queueReact(p.tab, 'EcEf'); } },
      { btn: 'Tinh khiết', fn: p => { p.S.EcEf = 0.57; p.S.T = 300; p.syncCtrls(); queueReact(p.tab, 'EcEf'); } },
      { btn: 'Câu 1b (P · 400K)', fn: p => { p.S.EcEf = 0.85; p.S.T = 400; p.syncCtrls(); queueReact(p.tab, 'EcEf'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, kT = KB * S.T;
      const pad = 12;
      const chX = pad, chY = 8, chW = W - pad * 2, chH = H - 34;

      // Vật lý chính xác theo công thức Mục 1.2 Buổi 5
      const Nc = ncT(MAT.si, S.T);
      const Nv = nvT(MAT.si, S.T);
      const EcEf = S.EcEf;
      const EfEv = EG_SI - EcEf;
      const n0 = Nc * ex(-EcEf / kT);
      const p0 = Nv * ex(-EfEv / kT);
      const ni = NI(S.T);
      const boltzOk = EcEf >= 3 * kT && EfEv >= 3 * kT;

      // Độ lệch tương đối so với E_Fi (E_c − E_Fi ≈ 0.573 eV ở 300 K)
      const EcEfi = EG_SI / 2 - 0.5 * kT * Math.log(Nv / Nc);
      const dE = EcEfi - EcEf; // > 0 là loại N, < 0 là loại P

      // Số lượng ion tạp chất cố định hiển thị trong mạng (tỉ lệ theo mức độ pha tạp)
      const dopMag = Math.abs(dE) < 0.03 ? 0 : Math.round(clamp((Math.abs(dE) - 0.03) / 0.45 * 22, 1, 22));
      const dopType = dE > 0.03 ? 'N' : dE < -0.03 ? 'P' : 'I';

      // Khởi tạo lưới nguyên tử Si và các hạt tải động trong buồng tinh thể
      const cols = 10, rows = 6;
      const totalSites = cols * rows;
      if (!st.init) {
        st.init = true;
        st.el = [];
        st.hl = [];
        st.flashes = [];
        st.genAcc = 0;
        // Thứ tự chọn vị trí tạp chất trải đều tự nhiên trong tinh thể
        st.dopOrder = Array.from({ length: totalSites }, (_, i) => i)
          .sort((a, b) => Math.sin(a * 12.9898) - Math.sin(b * 12.9898));
        // Khởi tạo sẵn một số cặp cân bằng
        for (let i = 0; i < 12; i++) {
          st.el.push({ x: rnd(0.08, 0.92), y: rnd(0.12, 0.88), vx: rnd(-1, 1), vy: rnd(-1, 1), age: 2 });
        }
        for (let i = 0; i < 4; i++) {
          st.hl.push({ x: rnd(0.08, 0.92), y: rnd(0.12, 0.88), vx: rnd(-1, 1), vy: rnd(-1, 1), age: 2 });
        }
      }

      // Đảm bảo trung hòa điện tích (n - p = N_D - N_A) khi người dùng thay đổi pha tạp
      const targetDiff = dopType === 'N' ? dopMag * 2 : dopType === 'P' ? -dopMag * 2 : 0;
      const curDiff = st.el.length - st.hl.length;
      if (curDiff < targetDiff) {
        const add = Math.min(3, targetDiff - curDiff);
        for (let i = 0; i < add; i++) {
          st.el.push({ x: rnd(0.06, 0.94), y: rnd(0.12, 0.88), vx: rnd(-1, 1), vy: rnd(-1, 1), age: 1 });
        }
      } else if (curDiff > targetDiff) {
        const diff = curDiff - targetDiff;
        if (dopType === 'P' || st.el.length > Math.max(0, targetDiff)) {
          const addH = Math.min(3, diff);
          for (let i = 0; i < addH; i++) {
            if (st.el.length > Math.max(0, targetDiff) && st.hl.length >= 24) st.el.pop();
            else st.hl.push({ x: rnd(0.06, 0.94), y: rnd(0.12, 0.88), vx: rnd(-1, 1), vy: rnd(-1, 1), age: 1 });
          }
        }
      }

      // Tốc độ sinh nhiệt tự nhiên G(T): chỉ phụ thuộc nhiệt độ T, KHÔNG phụ thuộc pha tạp!
      const genRate = 0.8 + Math.pow((S.T - 120) / 140, 2.2) * 2.2;
      st.genAcc += dt * genRate;
      const maxCarriers = 78;
      while (st.genAcc >= 1) {
        st.genAcc -= 1;
        if (st.el.length < maxCarriers && st.hl.length < maxCarriers) {
          const gx = rnd(0.08, 0.92), gy = rnd(0.14, 0.86);
          const a = rnd(0, TAU);
          st.el.push({ x: gx, y: gy, vx: Math.cos(a), vy: Math.sin(a), age: 0 });
          st.hl.push({ x: gx, y: gy, vx: -Math.cos(a), vy: -Math.sin(a), age: 0 });
          st.flashes.push({ x: gx, y: gy, life: 1.0, col: C.main, kind: 'gen' });
        }
      }

      // Cập nhật chuyển động nhiệt Brownian của electron và lỗ trống
      const vTh = 0.20 * Math.sqrt(S.T / 300);
      const stepList = (arr, speedMul) => {
        for (let i = 0; i < arr.length; i++) {
          const q = arr[i];
          q.age += dt;
          q.x += q.vx * vTh * speedMul * dt;
          q.y += q.vy * vTh * speedMul * dt;
          if (q.x < 0.03 || q.x > 0.97) { q.vx *= -1; q.x = clamp(q.x, 0.03, 0.97); }
          if (q.y < 0.08 || q.y > 0.92) { q.vy *= -1; q.y = clamp(q.y, 0.08, 0.92); }
          if (Math.random() < dt * (1.5 + S.T / 220)) {
            const a = rnd(0, TAU);
            q.vx = Math.cos(a); q.vy = Math.sin(a);
          }
        }
      };
      stepList(st.el, 1.25);
      stepList(st.hl, 0.85);

      // Va chạm TÁI HỢP (Recombination): electron gặp lỗ trống → hủy cặp & phát xung năng lượng!
      const recombRad = 0.038;
      for (let i = st.el.length - 1; i >= 0; i--) {
        const e = st.el[i];
        if (e.age < 0.35) continue;
        for (let j = st.hl.length - 1; j >= 0; j--) {
          const h = st.hl[j];
          if (h.age < 0.35) continue;
          const dx = e.x - h.x, dy = e.y - h.y;
          if (dx * dx + dy * dy < recombRad * recombRad) {
            st.flashes.push({ x: (e.x + h.x) * 0.5, y: (e.y + h.y) * 0.5, life: 1.0, col: C.c1, kind: 'rec' });
            st.el.splice(i, 1);
            st.hl.splice(j, 1);
            break;
          }
        }
      }

      // Vẽ khung buồng tinh thể toàn màn hình
      drawChamber(ctx, chX, chY, chW, chH, 10);

      // 1. Vẽ mạng nguyên tử Si nền + các ion tạp chất cố định (P⁺ hoặc B⁻)
      const dopSet = new Set(st.dopOrder.slice(0, dopMag));
      const padInX = 34, padInY = 44;
      const stepX = (chW - padInX * 2) / (cols - 1);
      const stepY = (chH - padInY * 2) / (rows - 1);
      const vib = Math.sqrt(S.T / 300) * 1.4;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const id = r * cols + c;
          const ax = chX + padInX + c * stepX + Math.sin(t * 10 + id) * vib;
          const ay = chY + padInY + r * stepY + Math.cos(t * 11 + id * 1.7) * vib;

          if (dopSet.has(id) && dopType !== 'I') {
            // Ion tạp chất cố định trong mạng tinh thể
            const isN = dopType === 'N';
            const ionCol = isN ? C.c2 : C.c4;
            dot(ctx, ax, ay, 9.5, C.bg);
            ctx.beginPath(); ctx.arc(ax, ay, 9.5, 0, TAU);
            ctx.strokeStyle = hexA(ionCol, 0.72); ctx.lineWidth = 1.5; ctx.stroke();
            txt(ctx, isN ? 'P⁺' : 'B⁻', ax, ay + 0.5, ionCol, 8.5, 'center', 700, MONO);
          } else {
            // Nguyên tử Silicon trung hòa
            dot(ctx, ax, ay, 3.2, hexA(C.mut, 0.32));
          }
        }
      }

      // 2. Vẽ các chớp sự kiện Sinh nhiệt & Tái hợp
      st.flashes.forEach(f => {
        f.life -= dt * 1.6;
        if (f.life <= 0) return;
        const fx = chX + f.x * chW, fy = chY + f.y * chH;
        const rad = 5 + (1 - f.life) * 22;
        ctx.beginPath(); ctx.arc(fx, fy, rad, 0, TAU);
        ctx.strokeStyle = hexA(f.col, f.life * 0.85);
        ctx.lineWidth = 1.6; ctx.stroke();
        txt(ctx, f.kind === 'gen' ? 'Sinh e⁻+h⁺' : 'Tái hợp', fx, fy - 14, hexA(f.col, f.life), 9, 'center', 700, MONO);
      });
      st.flashes = st.flashes.filter(f => f.life > 0);

      // 3. Vẽ lỗ trống h⁺ (vòng đỏ)
      st.hl.forEach(h => {
        const hx = chX + h.x * chW, hy = chY + h.y * chH;
        glowDot(ctx, hx, hy, 4.5, hexA(C.c4, 0.2), hexA(C.c4, 0.5));
        ctx.beginPath(); ctx.arc(hx, hy, 4.6, 0, TAU);
        ctx.strokeStyle = C.c4; ctx.lineWidth = 1.9; ctx.stroke();
        txt(ctx, '+', hx, hy + 0.5, C.c4, 8.5, 'center', 800, MONO);
      });

      // 4. Vẽ electron tự do e⁻ (hạt xanh phát sáng)
      st.el.forEach(e => {
        const ex_ = chX + e.x * chW, ey_ = chY + e.y * chH;
        glowDot(ctx, ex_, ey_, 4.2, C.ink, hexA(C.c2, 0.85));
        dot(ctx, ex_, ey_, 3.8, C.c2);
        txt(ctx, '−', ex_, ey_ + 0.5, C.bg, 8.5, 'center', 800, MONO);
      });

      // 5. Dòng thông số đọc trực tiếp gọn nhẹ ở mép trên & dưới bên trong buồng (KHÔNG ô HUD)
      const typeLabel = dopType === 'N' ? 'SI LOẠI N (P⁺)' : dopType === 'P' ? 'SI LOẠI P (B⁻)' : 'SI TINH KHIẾT (Nội tại)';
      txt(ctx, typeLabel + ' · E_c−E_F=' + EcEf.toFixed(2) + ' | E_F−E_v=' + EfEv.toFixed(2) + ' eV',
        chX + 14, chY + 16, C.ink, 10.5, 'left', 700, MONO);
      txt(ctx, 'n₀=' + sci(n0, 2) + ' | p₀=' + sci(p0, 2) + ' | n₀p₀=' + sci(ni * ni, 1),
        chX + chW - 14, chY + 16, C.main, 10.2, 'right', 700, MONO);

      const statusText = !boltzOk
        ? 'Cảnh báo suy biến: E_F cách mép dải < 3kT (' + (3 * kT * 1000).toFixed(0) + ' meV), cần dùng Fermi–Dirac'
        : 'N_c(T)=' + sci(Nc, 2) + ' · N_v(T)=' + sci(Nv, 2) + ' cm⁻³ · Trong khung: ' + st.el.length + ' e⁻ & ' + st.hl.length + ' h⁺ · kT=' + (kT * 1000).toFixed(1) + ' meV';
      txt(ctx, statusText, W / 2, H - 12, boltzOk ? C.mut : C.err, 10.2, 'center', boltzOk ? 500 : 700);
    }
  }]
});

/* ==========================================================================
   TAB 2 — ĐỨT LIÊN KẾT & nᵢ (Mục 2.1)
   Kính hiển vi mạng tinh thể Silicon 5×4 toàn màn hình (đã bỏ 3 ô HUD trên):
   - Dao động nhiệt phonon thực tế theo T (0 K → 600 K)
   - Bắn chùm tia Photon thực tế bay vào bứt gãy liên kết cộng hóa trị
   - Cơ chế lỗ trống nhảy từng bước qua liên kết lân cận (Hole Hopping) & Tái hợp
   ========================================================================== */
LABS.push({
  id: 'bond', name: 'Đứt liên kết & nᵢ', no: '2.1', secs: [],
  S: { T: 300, play: true },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Kính hiển vi mạng tinh thể Silicon — Dao động nhiệt, tia Photon & nhảy lỗ trống',
    area: 'a', anim: true,
    ctrls: [
      { k: 'T', l: 'Nhiệt độ T', min: 0, max: 600, step: 10, f: v => v + ' K' },
      { btn: '0 K (Cách điện)', fn: p => { p.S.T = 0; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: '300 K (Phòng)', fn: p => { p.S.T = 300; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: 'Bắn Photon (hν > E_g)', fn: p => { p.st.injectPhoton = true; } },
      { btn: 'Tạm dừng / Chạy', fn: p => { p.S.play = !p.S.play; queueReact(p.tab, 'play'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12;
      const chX = pad, chY = 8, chW = W - pad * 2, chH = H - 34;
      const T = S.T;
      const effDt = S.play ? dt : 0;

      const cols = 5, rows = 4;
      if (!st.init) {
        st.init = true;
        st.atoms = [];
        st.bonds = [];
        st.freeE = [];
        st.flashes = [];
        st.hops = [];
        st.photons = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            st.atoms.push({ c, r, phX: rnd(0, TAU), phY: rnd(0, TAU), fX: rnd(9, 14), fY: rnd(9, 14) });
          }
        }
        const idx = (c, r) => r * cols + c;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (c + 1 < cols) st.bonds.push({ a: idx(c, r), b: idx(c + 1, r), hole: false, hopCD: 0 });
            if (r + 1 < rows) st.bonds.push({ a: idx(c, r), b: idx(c, r + 1), hole: false, hopCD: 0 });
          }
        }
      }

      const gridW = chW * 0.80, gridH = chH * 0.74;
      const gx0 = chX + (chW - gridW) / 2, gy0 = chY + (chH - gridH) / 2 + 10;
      const dx = gridW / (cols - 1), dy = gridH / (rows - 1);
      const vibAmp = T > 0 ? clamp(Math.sqrt(T / 300) * 3.6, 0.3, 6.5) : 0;

      const atomPos = st.atoms.map(a => ({
        x: gx0 + a.c * dx + Math.sin(t * a.fX + a.phX) * vibAmp,
        y: gy0 + a.r * dy + Math.cos(t * a.fY + a.phY) * vibAmp
      }));
      const bondMid = b => ({
        x: (atomPos[b.a].x + atomPos[b.b].x) * 0.5,
        y: (atomPos[b.a].y + atomPos[b.b].y) * 0.5
      });

      const targetPairs = T < 60 ? 0 : Math.round(clamp(Math.pow((T - 50) / 145, 2.0), 1, 10));

      const breakSpecificBond = (b, isPhoton) => {
        if (!b || b.hole) return;
        b.hole = true;
        b.hopCD = rnd(0.8, 1.8);
        const m = bondMid(b);
        const ang = rnd(0, TAU);
        st.freeE.push({
          x: m.x, y: m.y,
          vx: Math.cos(ang) * rnd(78, 118),
          vy: Math.sin(ang) * rnd(78, 118),
          age: 0
        });
        st.flashes.push({ x: m.x, y: m.y, life: 1.0, col: isPhoton ? C.main : C.c2, lbl: isPhoton ? 'hν → e⁻ + h⁺' : 'Sinh nhiệt' });
      };

      // Phóng 1 bó sóng photon thực tế từ mép trái lao vào đúng 1 liên kết còn nguyên
      if (st.injectPhoton) {
        st.injectPhoton = false;
        const intact = st.bonds.filter(b => !b.hole);
        if (intact.length) {
          const targetBond = intact[Math.floor(Math.random() * intact.length)];
          st.photons.push({ bond: targetBond, prog: 0 });
          queueReact(p.tab, 'photon');
        }
      }

      if (effDt > 0) {
        // Cập nhật bó sóng photon đang lao vào liên kết
        for (let i = st.photons.length - 1; i >= 0; i--) {
          const ph = st.photons[i];
          ph.prog += effDt * 2.4;
          if (ph.prog >= 1) {
            breakSpecificBond(ph.bond, true);
            st.photons.splice(i, 1);
          }
        }

        const curHoles = st.bonds.filter(b => b.hole).length;
        if (curHoles < targetPairs && Math.random() < effDt * (1.2 + T / 180)) {
          const intact = st.bonds.filter(b => !b.hole);
          if (intact.length) breakSpecificBond(intact[Math.floor(Math.random() * intact.length)], false);
        }
        if (T === 0 && st.freeE.length > 0 && Math.random() < effDt * 4) {
          const hb = st.bonds.find(b => b.hole);
          if (hb) hb.hole = false;
          st.freeE.pop();
        }

        // Hole Hopping
        st.bonds.forEach(b => {
          if (!b.hole) return;
          b.hopCD -= effDt * (0.6 + T / 300);
          if (b.hopCD <= 0) {
            b.hopCD = rnd(1.0, 2.2);
            const neigh = st.bonds.filter(o => !o.hole && (o.a === b.a || o.a === b.b || o.b === b.a || o.b === b.b));
            if (neigh.length) {
              const nb = neigh[Math.floor(Math.random() * neigh.length)];
              const m1 = bondMid(b), m2 = bondMid(nb);
              b.hole = false;
              nb.hole = true;
              nb.hopCD = rnd(1.0, 2.2);
              st.hops.push({ x1: m1.x, y1: m1.y, x2: m2.x, y2: m2.y, life: 1.0 });
            }
          }
        });

        // Electron tự do & Tái hợp
        const spdScale = 0.65 + Math.sqrt(Math.max(T, 30) / 300) * 0.6;
        for (let i = st.freeE.length - 1; i >= 0; i--) {
          const e = st.freeE[i];
          e.age += effDt;
          e.x += e.vx * spdScale * effDt;
          e.y += e.vy * spdScale * effDt;
          if (e.x < chX + 14) { e.x = chX + 14; e.vx = Math.abs(e.vx); }
          if (e.x > chX + chW - 14) { e.x = chX + chW - 14; e.vx = -Math.abs(e.vx); }
          if (e.y < chY + 28) { e.y = chY + 28; e.vy = Math.abs(e.vy); }
          if (e.y > chY + chH - 14) { e.y = chY + chH - 14; e.vy = -Math.abs(e.vy); }
          if (Math.random() < effDt * (1.2 + T / 240)) {
            const a = rnd(0, TAU), sp = rnd(75, 118);
            e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp;
          }
          if (e.age > 1.6 && st.freeE.length > Math.max(0, targetPairs - 1)) {
            for (let j = 0; j < st.bonds.length; j++) {
              const b = st.bonds[j];
              if (!b.hole) continue;
              const m = bondMid(b);
              if (Math.hypot(e.x - m.x, e.y - m.y) < 16) {
                b.hole = false;
                st.freeE.splice(i, 1);
                st.flashes.push({ x: m.x, y: m.y, life: 1.0, col: C.c1, lbl: 'Tái hợp' });
                break;
              }
            }
          }
        }
      }

      drawChamber(ctx, chX, chY, chW, chH, 10);

      // 1. Liên kết cộng hóa trị
      st.bonds.forEach((b, bi) => {
        const p1 = atomPos[b.a], p2 = atomPos[b.b];
        const mx = (p1.x + p2.x) * 0.5, my = (p1.y + p2.y) * 0.5;
        const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const nx = -Math.sin(ang) * 4.8, ny = Math.cos(ang) * 4.8;

        if (!b.hole) {
          ln(ctx, p1.x + nx, p1.y + ny, p2.x + nx, p2.y + ny, hexA(C.g, 0.95), 1.6);
          ln(ctx, p1.x - nx, p1.y - ny, p2.x - nx, p2.y - ny, hexA(C.g, 0.95), 1.6);
          const osc = Math.sin(t * 2.6 + bi) * 0.14;
          dot(ctx, p1.x + (p2.x - p1.x) * (0.42 + osc) + nx, p1.y + (p2.y - p1.y) * (0.42 + osc) + ny, 2.4, hexA(C.c2, 0.72));
          dot(ctx, p1.x + (p2.x - p1.x) * (0.58 - osc) - nx, p1.y + (p2.y - p1.y) * (0.58 - osc) - ny, 2.4, hexA(C.c2, 0.72));
        } else {
          ln(ctx, p1.x + nx, p1.y + ny, p2.x + nx, p2.y + ny, hexA(C.g, 0.8), 1.4);
          ln(ctx, p1.x - nx, p1.y - ny, p2.x - nx, p2.y - ny, hexA(C.c4, 0.45), 1.2, [3, 3]);
          dot(ctx, mx + nx, my + ny, 2.3, hexA(C.c2, 0.65));
          glowDot(ctx, mx - nx, my - ny, 5.8, hexA(C.c4, 0.25), hexA(C.c4, 0.45));
          ctx.beginPath(); ctx.arc(mx - nx, my - ny, 5.8, 0, TAU);
          ctx.strokeStyle = C.c4; ctx.lineWidth = 2; ctx.stroke();
          txt(ctx, '+', mx - nx, my - ny + 0.5, C.c4, 9.5, 'center', 800, MONO);
        }
      });

      // 2. Vệt nhảy lỗ trống
      st.hops.forEach(h => {
        h.life -= effDt * 1.4;
        if (h.life <= 0) return;
        ln(ctx, h.x1, h.y1, h.x2, h.y2, hexA(C.c4, h.life * 0.78), 2, [4, 3]);
      });
      st.hops = st.hops.filter(h => h.life > 0);

      // 3. Bó sóng photon đang bay tới liên kết
      st.photons.forEach(ph => {
        const m = bondMid(ph.bond);
        const sx = chX + 10, sy = m.y - 40;
        const px = sx + (m.x - sx) * ph.prog;
        const py = sy + (m.y - sy) * ph.prog;
        const ang = Math.atan2(m.y - sy, m.x - sx);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang);
        ctx.beginPath();
        for (let s = -22; s <= 12; s += 2) {
          const wy = Math.sin(s * 0.6 - t * 24) * 6 * Math.exp(-(s * s) / 180);
          s === -22 ? ctx.moveTo(s, wy) : ctx.lineTo(s, wy);
        }
        ctx.strokeStyle = C.main; ctx.lineWidth = 2.2; ctx.stroke();
        glowDot(ctx, 0, 0, 5, C.ink, hexA(C.main, 0.9));
        ctx.restore();
      });

      // 4. Lõi nguyên tử Silicon
      atomPos.forEach(pt => {
        dot(ctx, pt.x, pt.y, 13.5, C.bg);
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 13.5, 0, TAU);
        ctx.strokeStyle = T > 420 ? hexA(C.main, 0.75) : C.sub;
        ctx.lineWidth = 1.6; ctx.stroke();
        txt(ctx, 'Si', pt.x, pt.y + 0.5, C.ink, 11, 'center', 700, MONO);
      });

      // 5. Electron tự do
      st.freeE.forEach(e => {
        glowDot(ctx, e.x, e.y, 4.6, C.ink, hexA(C.c2, 0.85));
        dot(ctx, e.x, e.y, 4.3, C.c2);
        txt(ctx, '−', e.x, e.y + 0.5, C.bg, 9.5, 'center', 800, MONO);
      });

      // 6. Chớp sự kiện
      st.flashes.forEach(f => {
        f.life -= effDt * 1.3;
        if (f.life <= 0) return;
        ctx.beginPath(); ctx.arc(f.x, f.y, 6 + (1 - f.life) * 26, 0, TAU);
        ctx.strokeStyle = hexA(f.col, f.life * 0.85);
        ctx.lineWidth = 1.8; ctx.stroke();
        txt(ctx, f.lbl, f.x, f.y - 16, hexA(f.col, f.life), 9.5, 'center', 700, MONO);
      });
      st.flashes = st.flashes.filter(f => f.life > 0);

      // Dòng thông số gọn gàng ngay mép buồng (không có ô HUD)
      const niVal = T > 20 ? NI(T) : 0;
      txt(ctx, 'T = ' + T + ' K  (kT = ' + (KB * T * 1000).toFixed(1) + ' meV)', chX + 14, chY + 16, T === 0 ? C.mut : C.main, 11, 'left', 700, MONO);
      txt(ctx, 'Cặp tự do: ' + st.freeE.length + ' (n₀ = p₀)  |  nᵢ(Si) ≈ ' + (niVal > 1e-20 ? sci(niVal, 1) + ' cm⁻³' : '0 cm⁻³'),
        chX + chW - 14, chY + 16, C.ink, 10.5, 'right', 700, MONO);

      txt(ctx, 'Chấm xanh (−): Electron tự do  |  Vòng đỏ (+): Lỗ trống nhảy qua các liên kết cộng hóa trị kề nhau',
        W / 2, H - 12, C.mut, 10.5, 'center', 500);
    }
  }]
});

/* ==========================================================================
   TAB 3 — LÒ NHIỆT SO SÁNH 3 PHIẾN BÁN DẪN THỰC (Ge — Si — GaAs)
   KHÔNG sơ đồ vùng năng lượng, KHÔNG đồ thị!
   Mô phỏng bàn thí nghiệm lò nhiệt đặt song song 3 phiến tinh thể thực:
   - Dưới đáy là thanh điện trở gia nhiệt (Heating Coil) nóng dần theo nhiệt độ T
   - 3 phiến bán dẫn Ge (0.66 eV), Si (1.12 eV), GaAs (1.42 eV) kẹp giữa điện cực đồng
   - Đo trực tiếp nᵢ(T), độ lệch mức Fermi ΔE_Fi (Câu 3) và điện trở suất nội tại ρᵢ (Câu 5)
   ========================================================================== */
LABS.push({
  id: 'ni', name: 'nᵢ & ρᵢ theo T', no: '2.2–2.3', secs: [2],
  S: { mat: 'si', T: 300 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Lò nhiệt thí nghiệm — So sánh 3 phiến Ge, Si, GaAs (nᵢ, ΔE_Fi & điện trở suất ρᵢ)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'T', l: 'Nhiệt độ lò T', min: 150, max: 600, step: 10, f: v => v + ' K' },
      { btn: '250 K (Câu 2a)', fn: p => { p.S.T = 250; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: '300 K (Phòng)', fn: p => { p.S.T = 300; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: '400 K (Câu 2b)', fn: p => { p.S.T = 400; p.syncCtrls(); queueReact(p.tab, 'T'); } },
      { btn: '500 K (Nóng)', fn: p => { p.S.T = 500; p.syncCtrls(); queueReact(p.tab, 'T'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st, T = S.T;
      const pad = 12;
      const chX = pad, chY = 8, chW = W - pad * 2, chH = H - 34;

      drawChamber(ctx, chX, chY, chW, chH, 10);

      // Hệ số nóng của lò (0 ở 150 K → 1 ở 600 K)
      const heat = clamp((T - 150) / 450, 0, 1);

      // Vầng sáng bức xạ nhiệt từ đáy lò gia nhiệt
      const glowH = chH * 0.28;
      const heatGrad = ctx.createLinearGradient(0, chY + chH, 0, chY + chH - glowH);
      heatGrad.addColorStop(0, heat > 0.25 ? hexA(C.c4, 0.26 * heat) : hexA(C.c2, 0.14 * (1 - heat)));
      heatGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = heatGrad;
      ctx.fillRect(chX + 1, chY + chH - glowH, chW - 2, glowH - 1);

      // 3 phiến bán dẫn đặt song song trong buồng lò
      const keys = ['ge', 'si', 'ga'];
      const gap = 14;
      const colW = (chW - 28 - gap * 2) / 3;
      const waferTop = chY + 40;
      const coilH = 32;
      const meterH = 74;
      const waferH = Math.max(82, chH - 40 - meterH - coilH - 26);

      if (!st.carriers) {
        st.carriers = {};
        st.needles = { ge: 0, si: 0, ga: 0 };
        keys.forEach(k => {
          st.carriers[k] = Array.from({ length: 34 }, () => ({
            ex: rnd(0.08, 0.92), ey: rnd(0.1, 0.9),
            hx: rnd(0.08, 0.92), hy: rnd(0.1, 0.9),
            sp: rnd(0.22, 0.42)
          }));
        });
      }

      keys.forEach((k, idx) => {
        const m = MAT[k];
        const col = C[m.col];
        const x0 = chX + 14 + idx * (colW + gap);
        const ni = niM(m, T);
        // Độ lệch E_Fi chuẩn theo Câu 3: (3/4)·kT·ln(m_p* / m_n*)
        const shift_meV = 0.75 * KB * T * Math.log(m.mp / m.mn) * 1000;
        // Độ dẫn điện và điện trở suất nội tại chuẩn theo Câu 5: σ_i = q·n_i·(μ_n + μ_p)
        const sigma_i = Q_EL * ni * (m.mun + m.mup);
        const rho_i = sigma_i > 1e-30 ? 1 / sigma_i : Infinity;

        // Tên phiến vật liệu & năng lượng liên kết E_g
        txt(ctx, m.full, x0 + colW / 2, chY + 18, col, 12, 'center', 700);
        txt(ctx, 'E_g = ' + m.Eg.toFixed(2) + ' eV', x0 + colW / 2, chY + 31, C.mut, 9.5, 'center', 600, MONO);

        // 2 bản điện cực kim loại kẹp trái/phải phiến bán dẫn
        const elecW = 9;
        rr(ctx, x0, waferTop + 8, elecW, waferH - 16, 2);
        ctx.fillStyle = hexA(C.main, 0.55); ctx.fill();
        rr(ctx, x0 + colW - elecW, waferTop + 8, elecW, waferH - 16, 2);
        ctx.fillStyle = hexA(C.main, 0.55); ctx.fill();
        txt(ctx, '−', x0 + elecW / 2, waferTop + waferH / 2, C.bg, 9, 'center', 800, MONO);
        txt(ctx, '+', x0 + colW - elecW / 2, waferTop + waferH / 2, C.bg, 9, 'center', 800, MONO);

        // Thân phiến tinh thể bán dẫn thực tế
        const wx = x0 + elecW + 2, ww = colW - (elecW + 2) * 2;
        rr(ctx, wx, waferTop, ww, waferH, 5);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = hexA(col, 0.55); ctx.lineWidth = 1.4; ctx.stroke();

        ctx.save();
        rr(ctx, wx + 1, waferTop + 1, ww - 2, waferH - 2, 4);
        ctx.clip();

        // Lưới nguyên tử bên trong phiến rung theo nhiệt độ T
        const vib = 0.5 + heat * 2.2;
        for (let gx = wx + 14; gx < wx + ww - 6; gx += 20) {
          for (let gy = waferTop + 14; gy < waferTop + waferH - 6; gy += 20) {
            const ox = Math.sin(t * 11 + gx + gy) * vib;
            const oy = Math.cos(t * 12 + gx - gy) * vib;
            dot(ctx, gx + ox, gy + oy, 1.8, hexA(C.mut, 0.34));
          }
        }

        // Mật độ cặp hạt sinh nhiệt thực tế tỉ lệ theo log10(n_i)
        const nPairs = Math.round(clamp((lg(ni) - 5.5) / 10.5 * 32, 0, 32));
        const list = st.carriers[k];
        const drift = 0.25 + heat * 0.45;
        for (let i = 0; i < nPairs; i++) {
          const q = list[i];
          // Electron trôi về điện cực dương (+) bên phải
          q.ex += q.sp * drift * dt;
          if (q.ex > 0.98) { q.ex = 0.02; q.ey = rnd(0.08, 0.92); }
          // Lỗ trống trôi về điện cực âm (−) bên trái
          q.hx -= q.sp * drift * 0.7 * dt;
          if (q.hx < 0.02) { q.hx = 0.98; q.hy = rnd(0.08, 0.92); }

          const pxE = wx + q.ex * ww;
          const pyE = waferTop + q.ey * waferH + Math.sin(t * 5 + i) * 2;
          const pxH = wx + q.hx * ww;
          const pyH = waferTop + q.hy * waferH + Math.cos(t * 5 + i) * 2;

          glowDot(ctx, pxE, pyE, 3.0, C.ink, hexA(C.c2, 0.85));
          ctx.beginPath(); ctx.arc(pxH, pyH, 3.2, 0, TAU);
          ctx.strokeStyle = C.c4; ctx.lineWidth = 1.6; ctx.stroke();
        }
        ctx.restore();

        // Đồng hồ đo dòng dẫn nội tại đặt ngay dưới mỗi phiến
        const mY = waferTop + waferH + 8;
        rr(ctx, x0, mY, colW, meterH, 6);
        ctx.fillStyle = C.bg; ctx.fill();
        ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();

        // Cung chia độ kim cơ
        const cxM = x0 + colW / 2, cyM = mY + 32, rM = 22;
        ctx.beginPath(); ctx.arc(cxM, cyM, rM, Math.PI * 1.12, Math.PI * 1.88);
        ctx.strokeStyle = C.g; ctx.lineWidth = 2.5; ctx.stroke();

        const normNi = clamp((lg(ni) - 4) / 13, 0, 1);
        st.needles[k] += (normNi - st.needles[k]) * Math.min(1, dt * 8);
        const ang = Math.PI * (1.12 + st.needles[k] * 0.76);
        ln(ctx, cxM, cyM, cxM + Math.cos(ang) * (rM - 3), cyM + Math.sin(ang) * (rM - 3), col, 2);
        dot(ctx, cxM, cyM, 2.8, C.ink);

        txt(ctx, 'nᵢ = ' + sci(ni, 2) + ' cm⁻³', cxM, mY + 43, col, 9.8, 'center', 700, MONO);
        txt(ctx, 'ρᵢ = ' + (rho_i < 1e18 ? sci(rho_i, 1) : '>10¹⁸') + ' Ω·cm', cxM, mY + 55, C.ink, 9.2, 'center', 600, MONO);
        txt(ctx, 'ΔE_Fi ' + (shift_meV >= 0 ? '+' : '−') + Math.abs(shift_meV).toFixed(1) + ' meV',
          cxM, mY + 66, C.mut, 8.8, 'center', 600, MONO);
      });

      // Thanh điện trở gia nhiệt ở đáy lò (Heating Element Coil)
      const coilY = chY + chH - coilH + 6;
      const coilX0 = chX + 26, coilX1 = chX + chW - 26;
      ctx.beginPath();
      const loops = 26;
      for (let i = 0; i <= loops; i++) {
        const u = i / loops;
        const cx = coilX0 + u * (coilX1 - coilX0);
        const cy = coilY + (i % 2 === 0 ? -6 : 6);
        i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
      }
      ctx.strokeStyle = heat > 0.25 ? hexA(C.c4, 0.35 + heat * 0.65) : hexA(C.c2, 0.45);
      ctx.lineWidth = 2.6;
      ctx.stroke();

      txt(ctx, 'THANH GIA NHIỆT LÒ THÍ NGHIỆM: T = ' + T + ' K  (kT = ' + (KB * T * 1000).toFixed(1) + ' meV)',
        chX + chW / 2, chY + chH - 8, heat > 0.45 ? C.c4 : C.mut, 9.5, 'center', 700, MONO);

      txt(ctx, 'Cùng một nhiệt độ lò: E_g nhỏ (Ge) sinh hạt rất mạnh làm kim dòng vọt cao; E_g lớn (GaAs) gần như cách điện ở 300 K',
        W / 2, H - 12, C.mut, 10.5, 'center', 500);
    }
  }]
});

/* ==========================================================================
   TAB 4 — BÁN KÍNH BOHR MỞ RỘNG & NĂNG LƯỢNG ION HÓA E_i (Mục 3.1, 3.3, Câu 4)
   Kính hiển vi lượng tử kép toàn màn hình:
   - Trái = Donor P (P⁺ + e⁻), Phải = Acceptor B (B⁻ + h⁺) trên lưới nguyên tử Si 5.43 Å
   - Đám mây 1s mở rộng co giãn theo ε_r và m* (khớp đúng Câu 4a Si & Câu 4b GaAs)
   ========================================================================== */
LABS.push({
  id: 'bohr', name: 'Bohr mở rộng & E_i', no: '3.1', secs: [3],
  S: { er: 11.7, mn: 0.26, mp: 0.49, T: 300 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Kính hiển vi tạp chất trên lưới tinh thể (5.43 Å) — Đám mây Bohr & Ion hóa nhiệt',
    area: 'a', anim: true,
    ctrls: [
      { k: 'er', l: 'ε_r', min: 1, max: 24, step: 0.1, f: v => v.toFixed(1) },
      { k: 'mn', l: 'm*(e⁻)/m₀', min: 0.05, max: 1.0, step: 0.01, f: v => v.toFixed(2) },
      { k: 'mp', l: 'm*(h⁺)/m₀', min: 0.05, max: 1.0, step: 0.01, f: v => v.toFixed(2) },
      { k: 'T', l: 'Nhiệt độ T', min: 10, max: 400, step: 10, f: v => v + ' K' },
      { btn: 'Si (Câu 4a)', fn: p => { Object.assign(p.S, { er: 11.7, mn: 0.26, mp: 0.49 }); p.syncCtrls(); queueReact(p.tab, 'er'); } },
      { btn: 'GaAs (Câu 4b)', fn: p => { Object.assign(p.S, { er: 13.1, mn: 0.067, mp: 0.48 }); p.syncCtrls(); queueReact(p.tab, 'er'); } },
      { btn: 'Ge', fn: p => { Object.assign(p.S, { er: 16.0, mn: 0.12, mp: 0.30 }); p.syncCtrls(); queueReact(p.tab, 'er'); } },
      { btn: 'H (chân không)', fn: p => { Object.assign(p.S, { er: 1.0, mn: 1.0, mp: 1.0 }); p.syncCtrls(); queueReact(p.tab, 'er'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, topY = 8, chH = H - 34;
      const gap = 12;
      const halfW = (W - pad * 2 - gap) / 2;

      const a0 = 0.529;
      const aD = a0 * S.er / S.mn;
      const aA = a0 * S.er / S.mp;
      const EiD = 13580 * S.mn / (S.er * S.er);
      const EiA = 13580 * S.mp / (S.er * S.er);
      const kT_meV = KB * S.T * 1000;

      const ionProb = Ei => 1 / (1 + 2 * Math.exp(clamp((Ei - 0.5 * kT_meV) / Math.max(kT_meV, 0.5), -30, 30)));
      const fIonD = clamp(ionProb(EiD), 0, 1);
      const fIonA = clamp(ionProb(EiA), 0, 1);

      if (!st.cloud) {
        st.cloud = Array.from({ length: 420 }, () => {
          const u1 = Math.max(1e-4, Math.random()), u2 = Math.max(1e-4, Math.random());
          const rNorm = -0.5 * Math.log(u1 * u2);
          return { r: rNorm, th: rnd(0, TAU), ph: rnd(0, TAU), sp: rnd(0.4, 1.2) };
        });
        st.orb = {
          d: { ang: 0, free: false, x: 0, y: 0, vx: 65, vy: 40 },
          a: { ang: 2, free: false, x: 0, y: 0, vx: -55, vy: 45 }
        };
      }

      const pxPerA = clamp(Math.min(halfW, chH) / 76, 2.2, 4.4);
      const latPx = 5.43 * pxPerA;

      const drawImpurityScope = (x, w, cfg) => {
        const { title, ionLabel, aStar, Ei, fIon, col, key } = cfg;
        drawChamber(ctx, x, topY, w, chH, 10);
        const cx = x + w / 2, cy = topY + chH * 0.52;

        ctx.save();
        rr(ctx, x + 1, topY + 1, w - 2, chH - 2, 9);
        ctx.clip();

        // 1. Mạng tinh thể nguyên tử Si đứng yên làm thước đo (5.43 Å)
        const nx = Math.ceil(w / (2 * latPx)) + 1;
        const ny = Math.ceil(chH / (2 * latPx)) + 1;
        for (let ix = -nx; ix <= nx; ix++) {
          for (let iy = -ny; iy <= ny; iy++) {
            if (ix === 0 && iy === 0) continue;
            dot(ctx, cx + ix * latPx, cy + iy * latPx, 2.2, hexA(C.mut, 0.42));
          }
        }

        // 2. Đám mây xác suất lượng tử 1s
        const rStarPx = aStar * pxPerA;
        const boundAlpha = 1 - fIon * 0.65;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(4, rStarPx * 2.2));
        grad.addColorStop(0, hexA(col, 0.34 * boundAlpha));
        grad.addColorStop(0.5, hexA(col, 0.14 * boundAlpha));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, rStarPx * 2.2), 0, TAU); ctx.fill();

        for (let i = 0; i < st.cloud.length; i++) {
          const pt = st.cloud[i];
          const rrPx = pt.r * rStarPx;
          if (rrPx > Math.max(w, chH)) continue;
          const th = pt.th + t * pt.sp * 0.25;
          const tw = 0.45 + 0.55 * Math.sin(t * 3 + pt.ph);
          dot(ctx, cx + Math.cos(th) * rrPx, cy + Math.sin(th) * rrPx, 1.4, hexA(col, 0.52 * tw * boundAlpha));
        }

        if (rStarPx >= 2) {
          ctx.beginPath(); ctx.arc(cx, cy, rStarPx, 0, TAU);
          ctx.strokeStyle = hexA(C.ink, 0.65 * boundAlpha);
          ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
        }

        // 3. Hạt tải thực tế (bị giam khi lạnh, tự do khi ion hóa nhiệt)
        const orb = st.orb[key];
        const shouldBeFree = fIon > 0.5;
        if (shouldBeFree && !orb.free) {
          orb.free = true;
          orb.x = cx + Math.cos(orb.ang) * Math.min(rStarPx, 50);
          orb.y = cy + Math.sin(orb.ang) * Math.min(rStarPx, 50);
        } else if (!shouldBeFree && orb.free) {
          orb.free = false;
        }

        let px, py;
        if (!orb.free) {
          orb.ang += dt * (2.2 + 18 / Math.max(aStar, 2));
          const radOrbit = clamp(rStarPx, 6, Math.min(w, chH) * 0.42);
          px = cx + Math.cos(orb.ang) * radOrbit;
          py = cy + Math.sin(orb.ang) * radOrbit;
        } else {
          const spScale = Math.sqrt(S.T / 300);
          orb.x += orb.vx * spScale * dt;
          orb.y += orb.vy * spScale * dt;
          if (orb.x < x + 16 || orb.x > x + w - 16) { orb.vx *= -1; orb.x = clamp(orb.x, x + 16, x + w - 16); }
          if (orb.y < topY + 28 || orb.y > topY + chH - 28) { orb.vy *= -1; orb.y = clamp(orb.y, topY + 28, topY + chH - 28); }
          if (Math.random() < dt * 1.5) {
            const a = rnd(0, TAU);
            orb.vx = Math.cos(a) * 80; orb.vy = Math.sin(a) * 80;
          }
          px = orb.x; py = orb.y;
        }

        if (key === 'd') {
          glowDot(ctx, px, py, 4.2, C.ink, hexA(C.c2, 0.9));
          dot(ctx, px, py, 3.8, C.c2);
        } else {
          glowDot(ctx, px, py, 4.4, hexA(C.c4, 0.25), hexA(C.c4, 0.7));
          ctx.beginPath(); ctx.arc(px, py, 4.4, 0, TAU);
          ctx.strokeStyle = C.c4; ctx.lineWidth = 2; ctx.stroke();
        }

        // 4. Lõi ion tạp chất cố định ở tâm
        glowDot(ctx, cx, cy, 8, C.ink, hexA(C.main, 0.85));
        dot(ctx, cx, cy, 8.5, C.main);
        txt(ctx, ionLabel, cx, cy + 0.5, C.bg, 9.5, 'center', 800, MONO);

        // Thước đo 1 nm
        const nmPx = 10 * pxPerA;
        ln(ctx, x + 12, topY + chH - 16, x + 12 + nmPx, topY + chH - 16, C.ink, 2);
        ln(ctx, x + 12, topY + chH - 20, x + 12, topY + chH - 12, C.ink, 1.5);
        ln(ctx, x + 12 + nmPx, topY + chH - 20, x + 12 + nmPx, topY + chH - 12, C.ink, 1.5);
        txt(ctx, '1 nm (10 Å)', x + 16 + nmPx, topY + chH - 16, C.ink, 9.5, 'left', 700, MONO);

        const stTxt = orb.free ? 'ĐÃ ION HÓA (' + Math.round(fIon * 100) + '%)' : 'ĐÓNG BĂNG (' + Math.round(fIon * 100) + '%)';
        txt(ctx, stTxt, x + w - 12, topY + chH - 16, orb.free ? C.c1 : C.mut, 9.5, 'right', 700, MONO);
        ctx.restore();

        // Nhãn thông số gọn gàng ngay trên góc kính hiển vi
        txt(ctx, title, x + 12, topY + 15, col, 11, 'left', 700);
        txt(ctx, 'a* = ' + aStar.toFixed(aStar < 10 ? 2 : 1) + ' Å (' + (aStar / 5.43).toFixed(1) + ' ô Si)',
          x + w - 12, topY + 15, C.ink, 10, 'right', 700, MONO);
        txt(ctx, 'E_i = ' + (Ei >= 1000 ? (Ei / 1000).toFixed(2) + ' eV' : Ei.toFixed(1) + ' meV'),
          x + w - 12, topY + 29, C.main, 10, 'right', 700, MONO);
      };

      drawImpurityScope(pad, halfW, {
        title: 'DONOR P (e⁻ thứ 5)', ionLabel: 'P⁺', aStar: aD, Ei: EiD, fIon: fIonD, col: C.c2, key: 'd'
      });
      drawImpurityScope(pad + halfW + gap, halfW, {
        title: 'ACCEPTOR B (lỗ trống)', ionLabel: 'B⁻', aStar: aA, Ei: EiA, fIon: fIonA, col: C.c4, key: 'a'
      });

      txt(ctx, 'Lưới chấm xám: nguyên tử Si (5.43 Å) · Nhiệt năng kT = ' + kT_meV.toFixed(1) + ' meV (' + S.T + ' K) · Hạ T xuống 20 K để thấy freeze-out',
        W / 2, H - 12, C.mut, 10.2, 'center', 500);
    }
  }]
});

/* ==========================================================================
   TAB 5 — QUY TẮC PHA TẠP BÁN DẪN HỢP CHẤT NHÓM III-V (GaAs) (Mục 3.2)
   Kính hiển vi mạng tinh thể Ga–As (Nhóm III – Nhóm V):
   - Chọn nguyên tử tạp chất: Si (IV), Ge (IV), Se (VI), Zn (II)
   - Chọn vị trí nút mạng bị thế chỗ: Ga (III, 3e⁻) hoặc As (V, 5e⁻)
   - Quan sát trực tiếp: nhiều e⁻ hóa trị hơn nút cũ → Donor (nhả e⁻ tự do, loại N);
     ít e⁻ hóa trị hơn nút cũ → Acceptor (thiếu liên kết, sinh lỗ trống h⁺ nhảy trong mạng, loại P)
   ========================================================================== */
const GAAS_IMP = {
  si: { sym: 'Si', name: 'Silicon (Nhóm IV)', val: 4 },
  ge: { sym: 'Ge', name: 'Germani (Nhóm IV)', val: 4 },
  se: { sym: 'Se', name: 'Selen (Nhóm VI)', val: 6 },
  zn: { sym: 'Zn', name: 'Kẽm (Nhóm II)', val: 2 }
};

LABS.push({
  id: 'gaas', name: 'Pha tạp III-V (GaAs)', no: '3.2', secs: [],
  S: { imp: 'si', site: 'ga' },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Kính hiển vi mạng tinh thể GaAs (III–V) — Thế chỗ nút Ga (3e⁻) hoặc As (5e⁻)',
    area: 'a', anim: true,
    ctrls: [
      { k: 'imp', seg: [['si', 'Si (IV·4e)'], ['ge', 'Ge (IV·4e)'], ['se', 'Se (VI·6e)'], ['zn', 'Zn (II·2e)']] },
      { k: 'site', seg: [['ga', 'Thế Ga (III·3e)'], ['as', 'Thế As (V·5e)']] },
      { btn: 'Si→Ga (N)', fn: p => { p.S.imp = 'si'; p.S.site = 'ga'; p.syncCtrls(); queueReact(p.tab, 'imp'); } },
      { btn: 'Ge→As (P)', fn: p => { p.S.imp = 'ge'; p.S.site = 'as'; p.syncCtrls(); queueReact(p.tab, 'imp'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12;
      const chX = pad, chY = 8, chW = W - pad * 2, chH = H - 34;

      const imp = GAAS_IMP[S.imp] || GAAS_IMP.si;
      const hostVal = S.site === 'ga' ? 3 : 5;
      const hostSym = S.site === 'ga' ? 'Ga' : 'As';
      const dZ = imp.val - hostVal; // >0: Donor (N), <0: Acceptor (P)
      const isDonor = dZ > 0;
      const carrierCount = Math.abs(dZ);

      // Khởi tạo lưới 5×3 xen kẽ Ga–As
      const cols = 5, rows = 3;
      const centerC = 2, centerR = 1;
      const stateKey = S.imp + '_' + S.site;

      if (!st.init || st.key !== stateKey) {
        st.init = true;
        st.key = stateKey;
        st.freeE = [];
        st.holes = [];
        st.hops = [];
        if (isDonor) {
          for (let i = 0; i < carrierCount; i++) {
            const a = rnd(0, TAU);
            st.freeE.push({ x: 0.5, y: 0.52, vx: Math.cos(a) * 0.24, vy: Math.sin(a) * 0.24 });
          }
        } else {
          // Tạo các lỗ trống bắt đầu từ các liên kết quanh tâm
          const startBonds = [[2, 1, 3, 1], [1, 1, 2, 1], [2, 0, 2, 1]];
          for (let i = 0; i < Math.min(carrierCount, startBonds.length); i++) {
            const b = startBonds[i];
            st.holes.push({ aC: b[0], aR: b[1], bC: b[2], bR: b[3], cd: rnd(0.8, 1.5) });
          }
        }
      }

      drawChamber(ctx, chX, chY, chW, chH, 10);

      const gridW = chW * 0.78, gridH = chH * 0.64;
      const gx0 = chX + (chW - gridW) / 2, gy0 = chY + (chH - gridH) / 2 + 12;
      const dx = gridW / (cols - 1), dy = gridH / (rows - 1);

      const pos = (c, r) => ({
        x: gx0 + c * dx + Math.sin(t * 7 + c * 2 + r) * 1.4,
        y: gy0 + r * dy + Math.cos(t * 7.5 + r * 3 + c) * 1.4
      });

      // Cập nhật lỗ trống nhảy giữa các liên kết Ga–As
      const allBonds = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c + 1 < cols) allBonds.push({ aC: c, aR: r, bC: c + 1, bR: r });
          if (r + 1 < rows) allBonds.push({ aC: c, aR: r, bC: c, bR: r + 1 });
        }
      }
      st.holes.forEach(h => {
        h.cd -= dt;
        if (h.cd <= 0) {
          h.cd = rnd(1.0, 1.8);
          const neigh = allBonds.filter(b =>
            !(b.aC === h.aC && b.aR === h.aR && b.bC === h.bC && b.bR === h.bR) &&
            ((b.aC === h.aC && b.aR === h.aR) || (b.bC === h.aC && b.bR === h.aR) ||
             (b.aC === h.bC && b.aR === h.bR) || (b.bC === h.bC && b.bR === h.bR))
          );
          if (neigh.length) {
            const oldP1 = pos(h.aC, h.aR), oldP2 = pos(h.bC, h.bR);
            const nb = neigh[Math.floor(Math.random() * neigh.length)];
            const newP1 = pos(nb.aC, nb.aR), newP2 = pos(nb.bC, nb.bR);
            st.hops.push({
              x1: (oldP1.x + oldP2.x) * 0.5, y1: (oldP1.y + oldP2.y) * 0.5,
              x2: (newP1.x + newP2.x) * 0.5, y2: (newP1.y + newP2.y) * 0.5,
              life: 1.0
            });
            h.aC = nb.aC; h.aR = nb.aR; h.bC = nb.bC; h.bR = nb.bR;
          }
        }
      });

      // 1. Vẽ liên kết cộng hóa trị giữa Ga và As
      allBonds.forEach((b, bi) => {
        const p1 = pos(b.aC, b.aR), p2 = pos(b.bC, b.bR);
        const mx = (p1.x + p2.x) * 0.5, my = (p1.y + p2.y) * 0.5;
        const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const nx = -Math.sin(ang) * 4.5, ny = Math.cos(ang) * 4.5;
        const hasHole = st.holes.some(h => h.aC === b.aC && h.aR === b.aR && h.bC === b.bC && h.bR === b.bR);

        if (!hasHole) {
          ln(ctx, p1.x + nx, p1.y + ny, p2.x + nx, p2.y + ny, hexA(C.g, 0.95), 1.6);
          ln(ctx, p1.x - nx, p1.y - ny, p2.x - nx, p2.y - ny, hexA(C.g, 0.95), 1.6);
          const osc = Math.sin(t * 2.5 + bi) * 0.12;
          dot(ctx, p1.x + (p2.x - p1.x) * (0.42 + osc) + nx, p1.y + (p2.y - p1.y) * (0.42 + osc) + ny, 2.3, hexA(C.c2, 0.7));
          dot(ctx, p1.x + (p2.x - p1.x) * (0.58 - osc) - nx, p1.y + (p2.y - p1.y) * (0.58 - osc) - ny, 2.3, hexA(C.c2, 0.7));
        } else {
          ln(ctx, p1.x + nx, p1.y + ny, p2.x + nx, p2.y + ny, hexA(C.g, 0.8), 1.4);
          ln(ctx, p1.x - nx, p1.y - ny, p2.x - nx, p2.y - ny, hexA(C.c4, 0.5), 1.3, [3, 3]);
          dot(ctx, mx + nx, my + ny, 2.2, hexA(C.c2, 0.65));
          glowDot(ctx, mx - nx, my - ny, 6, hexA(C.c4, 0.25), hexA(C.c4, 0.55));
          ctx.beginPath(); ctx.arc(mx - nx, my - ny, 6, 0, TAU);
          ctx.strokeStyle = C.c4; ctx.lineWidth = 2; ctx.stroke();
          txt(ctx, '+', mx - nx, my - ny + 0.5, C.c4, 9.5, 'center', 800, MONO);
        }
      });

      // Vệt nhảy lỗ trống
      st.hops.forEach(h => {
        h.life -= dt * 1.4;
        if (h.life > 0) ln(ctx, h.x1, h.y1, h.x2, h.y2, hexA(C.c4, h.life * 0.8), 2, [4, 3]);
      });
      st.hops = st.hops.filter(h => h.life > 0);

      // 2. Vẽ các nút nguyên tử Ga (III) và As (V) xen kẽ, tâm là nguyên tử tạp chất
      const centerIsGa = S.site === 'ga';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pt = pos(c, r);
          const isCenter = c === centerC && r === centerR;
          const parity = (c + r) % 2 === (centerC + centerR) % 2;
          const isGaNode = centerIsGa ? parity : !parity;

          if (isCenter) {
            const ionCol = isDonor ? C.c2 : C.c4;
            const chargeStr = dZ > 0 ? (dZ === 1 ? '⁺' : sup(dZ) + '⁺') : (dZ === -1 ? '⁻' : sup(Math.abs(dZ)) + '⁻');
            glowDot(ctx, pt.x, pt.y, 17, hexA(ionCol, 0.25), hexA(ionCol, 0.45));
            dot(ctx, pt.x, pt.y, 17, C.bg);
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 17, 0, TAU);
            ctx.strokeStyle = ionCol; ctx.lineWidth = 2.4; ctx.stroke();
            txt(ctx, imp.sym + chargeStr, pt.x, pt.y + 0.5, ionCol, 11.5, 'center', 800, MONO);
          } else {
            dot(ctx, pt.x, pt.y, 13.5, C.bg);
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 13.5, 0, TAU);
            ctx.strokeStyle = isGaNode ? hexA(C.c5, 0.65) : hexA(C.c3, 0.65);
            ctx.lineWidth = 1.6; ctx.stroke();
            txt(ctx, isGaNode ? 'Ga' : 'As', pt.x, pt.y + 0.5, isGaNode ? C.c5 : C.c3, 10.5, 'center', 700, MONO);
          }
        }
      }

      // 3. Vẽ các electron tự do nếu là Donor
      st.freeE.forEach(e => {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.x < 0.06 || e.x > 0.94) { e.vx *= -1; e.x = clamp(e.x, 0.06, 0.94); }
        if (e.y < 0.14 || e.y > 0.90) { e.vy *= -1; e.y = clamp(e.y, 0.14, 0.90); }
        if (Math.random() < dt * 1.4) {
          const a = rnd(0, TAU);
          e.vx = Math.cos(a) * 0.24; e.vy = Math.sin(a) * 0.24;
        }
        const ex_ = chX + e.x * chW, ey_ = chY + e.y * chH;
        glowDot(ctx, ex_, ey_, 5.2, C.ink, hexA(C.c2, 0.9));
        dot(ctx, ex_, ey_, 4.6, C.c2);
        txt(ctx, '−', ex_, ey_ + 0.5, C.bg, 9.5, 'center', 800, MONO);
      });

      // 4. Thông số gọn ở mép trên & dưới buồng (KHÔNG ô HUD)
      const resLabel = isDonor
        ? 'DONOR → LOẠI N (Thừa +' + carrierCount + ' e⁻ tự do)'
        : 'ACCEPTOR → LOẠI P (Thiếu ' + carrierCount + ' e⁻ → sinh ' + carrierCount + ' h⁺)';
      txt(ctx, imp.sym + ' (' + imp.val + 'e⁻) thế chỗ ' + hostSym + ' (' + hostVal + 'e⁻)',
        chX + 14, chY + 16, C.ink, 11, 'left', 700, MONO);
      txt(ctx, resLabel, chX + chW - 14, chY + 16, isDonor ? C.c2 : C.c4, 11, 'right', 700, MONO);

      txt(ctx, 'Quy tắc III–V: Tạp chất nhiều e⁻ hóa trị hơn nút bị thay → Donor (loại N) · Ít e⁻ hóa trị hơn → Acceptor (loại P)',
        W / 2, H - 12, C.mut, 10.3, 'center', 500);
    }
  }]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM (Log intro + react chi tiết cho từng tab)
   Loại dòng: i = nguyên lý · w = cơ chế thực tế · v = số liệu đo đạc
   ========================================================================== */
const LD = {};

LD.nop = {
  intro: [
    ['i', 'Trong bán dẫn cân bằng nhiệt: n₀ = N_c·exp(−(E_c−E_F)/kT) và p₀ = N_v·exp(−(E_F−E_v)/kT), với N_c, N_v tỉ lệ theo T^(3/2).'],
    ['w', 'Khi E_F dịch lên gần E_c (pha tạp loại N, ion P⁺): Biển electron tự do dày đặc đẩy mạnh va chạm tái hợp làm lỗ trống thiểu số giảm sâu.'],
    ['w', 'Khi E_F dịch xuống gần E_v (pha tạp loại P, ion B⁻): Lỗ trống áp đảo và triệt tiêu hầu hết electron thiểu số.'],
    ['i', 'Dù E_F dịch đi đâu trong vùng không suy biến (cách mép dải ≥ 3kT), tích số n₀·p₀ luôn bằng đúng hằng số nᵢ²(T)!'],
    ['v', 'Bấm thử "Câu 1a (N · 300K)" và "Câu 1b (P · 400K)" để kiểm chứng trực tiếp kết quả Bài tập 1 trong Buổi 5.']
  ],
  react(S, k, P, say) {
    const kT = KB * S.T;
    const Nc = ncT(MAT.si, S.T), Nv = nvT(MAT.si, S.T);
    const EcEf = S.EcEf, EfEv = EG_SI - EcEf;
    const n0 = Nc * ex(-EcEf / kT), p0 = Nv * ex(-EfEv / kT);
    const boltzOk = EcEf >= 3 * kT && EfEv >= 3 * kT;
    if (k === 'EcEf') {
      say('v', `T = ${S.T} K, E_c−E_F = ${EcEf.toFixed(2)} eV (E_F−E_v = ${EfEv.toFixed(2)} eV) → n₀ = ${sci(n0, 2)}, p₀ = ${sci(p0, 2)} cm⁻³.`);
      say('w', EcEf < 0.54 ? 'Loại N (P⁺): E_F nằm gần đáy dải dẫn E_c nên electron đa số áp đảo, lỗ trống sinh nhiệt bị tái hợp rất nhanh.'
        : EcEf > 0.60 ? 'Loại P (B⁻): E_F nằm gần đỉnh dải hóa trị E_v nên lỗ trống áp đảo, electron thiểu số bị triệt tiêu mạnh.'
        : 'Tinh thể gần như nội tại: E_F nằm sát mức E_Fi (gần giữa vùng cấm), n₀ ≈ p₀ ≈ nᵢ.');
      if (!boltzOk) say('i', 'Cảnh báo suy biến: E_F cách mép dải < 3kT, xấp xỉ Boltzmann không còn chính xác — phải dùng tích phân Fermi–Dirac.');
    } else if (k === 'T') {
      say('v', `T = ${S.T} K (kT = ${(kT * 1000).toFixed(2)} meV) → N_c = ${sci(Nc, 2)}, N_v = ${sci(Nv, 2)}, nᵢ = ${sci(NI(S.T), 2)} cm⁻³.`);
      say('w', 'Khi nhiệt độ T thay đổi, cả N_c(T), N_v(T) (tỉ lệ T^(3/2)) và năng lượng nhiệt kT đều đổi theo — đừng quên cập nhật cả hai khi giải bài tập!');
    }
  }
};

LD.bond = {
  intro: [
    ['i', 'Mạng tinh thể Silicon: Mỗi nguyên tử Si chia sẻ 4 electron hóa trị với 4 nguyên tử lân cận tạo nên các liên kết cộng hóa trị bền vững.'],
    ['w', 'Ở 0 K: Mọi liên kết đều đầy đủ 2 electron, các nút mạng đứng yên và không có hạt tải tự do → tinh thể cách điện hoàn toàn.'],
    ['w', 'Khi tăng nhiệt độ T: Các nguyên tử Si dao động nhiệt (phonon) làm đứt một số liên kết, giải phóng electron tự do (−) và để lại lỗ trống (+).'],
    ['w', 'Chú ý vệt nét đứt màu đỏ: Electron từ liên kết lân cận nhảy sang lấp lỗ trống cũ khiến lỗ trống dịch chuyển từng bước trong mạng (hole hopping).'],
    ['v', 'Bấm "Bắn Photon (hν > E_g)" để phóng trực tiếp một bó photon vào mạng làm đứt liên kết và quan sát quá trình tái hợp.']
  ],
  react(S, k, P, say) {
    if (k === 'play') {
      say('w', S.play ? 'Đã tiếp tục mô phỏng mạng tinh thể.' : 'Đã tạm dừng mô phỏng để quan sát cấu trúc liên kết.');
      return;
    }
    if (k === 'photon') {
      say('v', 'Đã phóng 1 bó photon năng lượng hν > 1.12 eV vào tinh thể → Bứt gãy 1 liên kết Si–Si, sinh cặp e⁻ và h⁺.');
      return;
    }
    const T = S.T;
    if (T === 0) say('i', 'T = 0 K: Dao động nhiệt ngừng hẳn, mọi cặp e⁻–h⁺ tái hợp kín vào liên kết → Silicon trở thành chất cách điện.');
    else say('v', `T = ${T} K (kT = ${(KB * T * 1000).toFixed(1)} meV) → nᵢ(Si) ≈ ${sci(NI(T), 1)} cm⁻³. Tốc độ sinh nhiệt và nhảy lỗ trống tăng rõ rệt.`);
  }
};

LD.ni = {
  intro: [
    ['i', 'Lò nhiệt thí nghiệm đặt song song 3 phiến tinh thể thực (Ge, Si, GaAs) ở cùng nhiệt độ T và cùng điện áp thử.'],
    ['w', 'Nồng độ nội tại nᵢ = √(N_c·N_v)·exp(−E_g/2kT) tăng cực mạnh theo T và giảm mạnh khi E_g lớn. Điện trở suất nội tại ρᵢ = 1/[e·nᵢ·(μ_n+μ_p)].'],
    ['w', 'Vị trí mức Fermi nội tại lệch so với tâm vùng cấm một đoạn ΔE_Fi = (3/4)·kT·ln(m_p*/m_n*): ở 300 K, Si lệch −12.8 meV còn GaAs lệch +38.2 meV!'],
    ['v', 'Bấm "250 K (Câu 2a)", "300 K (Phòng)" và "400 K (Câu 2b)" để đối chiếu trực tiếp Câu 2, Câu 3 và Câu 5 Buổi 5!']
  ],
  react(S, k, P, say) {
    const T = S.T;
    const nGe = niM(MAT.ge, T), nSi = niM(MAT.si, T), nGa = niM(MAT.ga, T);
    const rhoSi = 1 / (Q_EL * nSi * (MAT.si.mun + MAT.si.mup));
    const dSi = 0.75 * KB * T * Math.log(MAT.si.mp / MAT.si.mn) * 1000;
    const dGa = 0.75 * KB * T * Math.log(MAT.ga.mp / MAT.ga.mn) * 1000;
    say('v', `T = ${T} K: nᵢ(Ge) = ${sci(nGe, 2)} | nᵢ(Si) = ${sci(nSi, 2)} | nᵢ(GaAs) = ${sci(nGa, 2)} cm⁻³.`);
    say('v', `Si: ρᵢ ≈ ${sci(rhoSi, 1)} Ω·cm, ΔE_Fi = ${dSi.toFixed(1)} meV  |  GaAs: ΔE_Fi = +${dGa.toFixed(1)} meV.`);
    if (T <= 260) say('w', 'Nhiệt độ lạnh (250 K): nᵢ của Silicon tụt xuống cỡ 7×10⁷ cm⁻³, điện trở suất tăng vọt — tinh thể gần như cách điện.');
    else if (T >= 400) say('w', 'Nhiệt độ cao (≥400 K): nᵢ của Silicon vọt lên hơn 2.3×10¹² cm⁻³ (tăng hơn 30.000 lần so với 250 K!), còn GaAs vẫn giữ cách điện tốt nhờ E_g rộng.');
    else say('w', 'Ở 300 K: Silicon tinh khiết có điện trở suất rất lớn (~3×10⁵ Ω·cm) nên bắt buộc phải pha tạp để chế tạo linh kiện.');
  }
};

LD.bohr = {
  intro: [
    ['i', 'Mô hình Bohr mở rộng: Bán kính quỹ đạo r₁ = a₀·ε_r·(m₀/m*) và năng lượng ion hóa E_i = 13.58 eV·(m*/m₀)/ε_r².'],
    ['w', 'Trong Silicon (ε_r = 11.7, m* = 0.26 m₀): r₁ ≈ 23.8 Å (~4.4 ô mạng Si) và E_i ≈ 25.8 meV — ngang tầm kT = 25.9 meV ở 300 K!'],
    ['w', 'Trong GaAs (ε_r = 13.1, m* = 0.067 m₀): r₁ mở rộng tới ~103.6 Å và E_i chỉ còn 5.3 meV nên 100% donor ion hóa ở nhiệt độ phòng.'],
    ['v', 'Bấm "Si (Câu 4a)", "GaAs (Câu 4b)" hoặc kéo T xuống 20 K để quan sát hiện tượng đóng băng hạt tải (freeze-out).']
  ],
  react(S, k, P, say) {
    const aD = 0.529 * S.er / S.mn;
    const EiD = 13580 * S.mn / (S.er * S.er);
    const kT_meV = KB * S.T * 1000;
    if (k === 'T') {
      say('v', `T = ${S.T} K (kT = ${kT_meV.toFixed(1)} meV) so với E_i(D) = ${EiD.toFixed(1)} meV.`);
      say('w', kT_meV < EiD * 0.25
        ? 'Vùng đóng băng (Freeze-out): Nhiệt năng quá nhỏ, hạt tải bị giam chặt trong đám mây quanh lõi ion tạp chất.'
        : 'Vùng ngoại lai (Extrinsic): Nhiệt năng đủ bứt hạt tải thoát khỏi ion tạp chất để tham gia dẫn điện.');
    } else {
      say('v', `ε_r = ${S.er.toFixed(1)}, m*/m₀ = ${S.mn.toFixed(3)} → r₁ = ${aD.toFixed(1)} Å (${(aD / 5.43).toFixed(1)} ô Si), E_i = ${EiD >= 1000 ? (EiD / 1000).toFixed(2) + ' eV' : EiD.toFixed(1) + ' meV'}.`);
      say('w', aD > 10
        ? 'Đám mây trải rộng trên nhiều ô mạng tinh thể nên việc dùng hằng số điện môi vĩ mô ε_r là hoàn toàn hợp lý.'
        : 'Đám mây co chặt gần lõi nguyên tử, năng lượng ion hóa tăng vọt.');
    }
  }
};

LD.gaas = {
  intro: [
    ['i', 'Trong bán dẫn hợp chất III–V (GaAs): Mỗi nguyên tử Ga (Nhóm III, 3 e⁻) liên kết tứ diện với 4 nguyên tử As (Nhóm V, 5 e⁻).'],
    ['w', 'Quy tắc vàng Mục 3.2: Tạp chất có NHIỀU electron hóa trị hơn nút bị thay → đóng vai trò Donor (loại N); ÍT electron hóa trị hơn → Acceptor (loại P).'],
    ['w', 'Tạp chất lưỡng tính Nhóm IV (Si, Ge): Thực nghiệm cho thấy Si chủ yếu thế chỗ Ga (4 > 3 → Donor, loại N), còn Ge chủ yếu thế chỗ As (4 < 5 → Acceptor, loại P).'],
    ['v', 'Thử chọn Se (Nhóm VI) thế chỗ As, Zn (Nhóm II) thế chỗ Ga, hoặc đổi vị trí Si giữa Ga và As để quan sát trực tiếp sự giải phóng e⁻ hoặc sinh lỗ trống h⁺!']
  ],
  react(S, k, P, say) {
    const imp = GAAS_IMP[S.imp] || GAAS_IMP.si;
    const hostVal = S.site === 'ga' ? 3 : 5;
    const hostSym = S.site === 'ga' ? 'Ga (Nhóm III)' : 'As (Nhóm V)';
    const dZ = imp.val - hostVal;
    if (dZ > 0) {
      say('v', `${imp.name} (${imp.val} e⁻) thế chỗ ${hostSym} (${hostVal} e⁻) → Dư +${dZ} e⁻ → Donor (Loại N).`);
      say('w', 'Các liên kết tứ diện đã bão hòa, nên electron dư tách ra thành electron tự do (−) để lại ion dương cố định.');
    } else {
      say('v', `${imp.name} (${imp.val} e⁻) thế chỗ ${hostSym} (${hostVal} e⁻) → Thiếu ${Math.abs(dZ)} e⁻ → Acceptor (Loại P).`);
      say('w', 'Liên kết bị thiếu electron tạo thành lỗ trống (+) nhảy liên tục qua các liên kết Ga–As lân cận.');
    }
  }
};

LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (Tự chèn CSS + HTML popup, đồng bộ tuyệt đối với hệ thống)
   ========================================================================== */
const CSS = `
#lab5{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab5[hidden]{display:none}
#lab5 *{box-sizing:border-box}
.lb-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
.lb-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
.lb-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
.lb-ic{color:var(--main);display:flex}
.lb-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
.lb-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
.lb-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
.lb-tab:hover{color:var(--ink);background:var(--tint)}
.lb-tab.on{background:var(--main);color:var(--bg);font-weight:700}
.lb-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
.lb-x:hover{color:var(--err);background:var(--tint)}
.lb-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
.lb-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
.lb-p.glow{animation:lbglow 1.4s ease-out}
@keyframes lbglow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
.lb-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
.lb-cv{flex:1;min-height:0;position:relative}
.lb-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.lb-c{display:flex;flex-wrap:wrap;gap:6px 12px;padding:5px 10px 8px;flex:none;align-items:center}
.lb-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb-k input[type=range]{width:clamp(68px,7.5vw,112px);margin:0;accent-color:var(--main)}
.lb-k output{color:var(--ink);font-weight:700;min-width:3.2em}
.lb-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb-seg button,.lb-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer;transition:color .15s,background .15s}
.lb-btn{background:var(--tint);color:var(--ink)}
.lb-seg button:hover,.lb-btn:hover{color:var(--ink);background:var(--g)}
.lb-seg button.on{background:var(--main);color:var(--bg)}
.lb-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
.lb-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lbin .4s ease-out;overflow-wrap:anywhere}
.lb-ln::before{position:absolute;left:0;font-weight:700}
.lb-ln.i{color:var(--ink)}.lb-ln.i::before{content:'›';color:var(--c5)}
.lb-ln.w{color:var(--ink)}.lb-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
.lb-ln.v{color:var(--main)}.lb-ln.v::before{content:'=';color:var(--main)}
@keyframes lbin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab-m:hover,.lab-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb-win{width:100vw;height:100dvh;border-radius:0}.lb-b{overflow:auto;display:flex;flex-direction:column}.lb-p{min-height:280px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'nop';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab5'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 5');
  root.innerHTML = '<div class="lb-win"><div class="lb-h"><span class="lb-ic">' + FLASK + '</span><span class="lb-bd">Phòng thí nghiệm · Buổi 5</span><nav class="lb-tabs"></nav><button class="lb-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb-b'); tabsEl = root.querySelector('.lb-tabs');
  LABS.forEach(l => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lb-tab'; b.dataset.id = l.id;
    b.textContent = l.no + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b);
  });
  root.querySelector('.lb-x').onclick = close;
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
  const d = document.createElement('div'); d.className = 'lb-ln ' + kind; d.textContent = text;
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
    w.className = 'lb-btn'; w.textContent = c.btn; w.setAttribute('role', 'button'); w.tabIndex = 0;
    w.onclick = () => c.fn(p); return w;
  }
  if (c.seg) {
    w.className = 'lb-seg';
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
  w.className = 'lb-k';
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
    const el = document.createElement('div'); el.className = 'lb-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb-t"></div><div class="lb-cv"><canvas></canvas></div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) {
      const lg = document.createElement('div'); lg.className = 'lb-log'; lg.setAttribute('aria-live', 'polite');
      el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el);
      curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 220 + j * 850)));
      return;
    }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.ctrls && spec.ctrls.length) {
      const cb = document.createElement('div'); cb.className = 'lb-c';
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
  root.querySelector('.lb-x').focus({ preventScroll: true });
  const b = document.getElementById('tb-lab'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
}
function close() {
  if (!root || root.hidden) return;
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  const b = document.getElementById('tb-lab'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- Dấu hiệu bình thí nghiệm trong bài học Buổi 5 ---------- */
const H3MAP = [
  [/^1\.1/, 'nop', 0],
  [/^1\.2/, 'nop', 0],
  [/^1\.3/, 'nop', 0],
  [/^2\.1/, 'bond', 0],
  [/^2\.2/, 'ni', 0],
  [/^2\.3/, 'ni', 0],
  [/^3\.1/, 'bohr', 0],
  [/^3\.2/, 'gaas', 0],
  [/^3\.3/, 'bohr', 0]
];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab-m')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-m'; b.innerHTML = FLASK;
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
