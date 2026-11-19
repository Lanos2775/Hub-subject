/* ==========================================================================
   lab-b1.js — PHÒNG THÍ NGHIỆM CẤU TRÚC TINH THỂ BUỔI 1 (Mô phỏng 3D Thực tế)
   - Tự chứa hoàn toàn: tự chèn CSS + HTML popup, đồng bộ 100% bảng màu & font trang.
   - TUYỆT ĐỐI KHÔNG BIỂU ĐỒ, KHÔNG SƠ ĐỒ TRỪU TƯỢNG, KHÔNG Ô HUD THỪA.
   - 5 tab mô phỏng trực tiếp cấu trúc chất rắn sát bài học & bài tập Buổi 1:
       1. Đơn / Đa / Vô định hình: So sánh trực quan trật tự tầm xa, biên hạt & hỗn loạn
       2. Ô cơ sở SC / BCC / FCC: Mô hình 3D xoay bằng chuột, cầu chạm nhau, APF & N_eff
       3. Kim cương (Si) & GaAs: Mô hình 3D 4 liên kết tứ diện (109.5°), APF 34%
       4. Mặt phẳng Miller (hkl): Cắt mặt (hkl) 3D, hướng [hkl], mật độ nguyên tử mặt
       5. Khuyết tật & Pha tạp: Biến dạng đàn hồi nút trống, xen kẽ, thế chỗ P & B
   - API: LabB1.open(tabId?, panelIndex?)  LabB1.close()  LabB1.mark(root)  LabB1.tabs()
   ========================================================================== */
(function () {
'use strict';

/* ---------- Hằng số & tiện ích toán học ---------- */
const TAU = Math.PI * 2;
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

/* ---------- Tiện ích vẽ Canvas & 3D ---------- */
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
function sphere3D(ctx, x, y, r, baseCol, alpha = 1) {
  if (r < 0.8) return;
  const g = ctx.createRadialGradient(x - r * 0.34, y - r * 0.34, r * 0.08, x, y, r);
  g.addColorStop(0, hexA('#ffffff', 0.85 * alpha));
  g.addColorStop(0.28, hexA(baseCol, 0.95 * alpha));
  g.addColorStop(1, hexA('#0b0c0e', 0.85 * alpha));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = hexA(baseCol, 0.45 * alpha);
  ctx.lineWidth = 0.8;
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
  ctx.strokeStyle = hexA(C.g, 0.35);
  ctx.lineWidth = 1;
  for (let gx = x + 36; gx < x + w; gx += 36) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
  }
  for (let gy = y + 36; gy < y + h; gy += 36) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
  }
  ctx.restore();
}

/* Gắn tương tác kéo chuột xoay 3D cho một panel */
function bindDrag3D(p, initRotY = 0.55, initRotX = 0.36) {
  const st = p.st;
  if (st.dragBound || !p.cv) return;
  st.dragBound = true;
  st.rotY = initRotY;
  st.rotX = initRotX;
  st.dragging = false;
  p.cv.style.cursor = 'grab';
  p.cv.addEventListener('pointerdown', e => {
    st.dragging = true;
    st.lx = e.clientX;
    st.ly = e.clientY;
    p.cv.style.cursor = 'grabbing';
  });
  window.addEventListener('pointermove', e => {
    if (!st.dragging) return;
    st.rotY += (e.clientX - st.lx) * 0.0085;
    st.rotX = clamp(st.rotX + (e.clientY - st.ly) * 0.0085, -1.45, 1.45);
    st.lx = e.clientX;
    st.ly = e.clientY;
    p.dirty = true;
  });
  window.addEventListener('pointerup', () => {
    st.dragging = false;
    if (p.cv) p.cv.style.cursor = 'grab';
  });
}

/* Chiếu 3D tọa độ (x, y, z) trong [-0.5, 0.5]³ với phối cảnh */
function makeProj(rotY, rotX, cx, cy, scale) {
  const cY = Math.cos(rotY), sY = Math.sin(rotY);
  const cX = Math.cos(rotX), sX = Math.sin(rotX);
  return (x, y, z) => {
    // Trục y3D hướng lên trên, x sang phải, z hướng ra người xem
    const x1 = x * cY - z * sY;
    const z1 = x * sY + z * cY;
    const y2 = y * cX - z1 * sX;
    const z2 = y * sX + z1 * cX;
    const persp = 3.2 / (3.2 - z2 * 0.72);
    return { sx: cx + x1 * scale * persp, sy: cy - y2 * scale * persp, z: z2, s: persp };
  };
}

/* Các cạnh của khối lập phương đơn vị [-0.5, 0.5]³ */
const CUBE_VERTS = [
  [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
  [-0.5, -0.5,  0.5], [0.5, -0.5,  0.5], [0.5, 0.5,  0.5], [-0.5, 0.5,  0.5]
];
const CUBE_EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7]
];

function drawUnitCubeWire(ctx, proj, col, alpha = 0.55) {
  const pv = CUBE_VERTS.map(v => proj(v[0], v[1], v[2]));
  CUBE_EDGES.forEach(([i, j]) => {
    const a = pv[i], b = pv[j];
    const back = (a.z + b.z) * 0.5 < -0.15;
    ln(ctx, a.sx, a.sy, b.sx, b.sy, hexA(col || C.mut, back ? alpha * 0.45 : alpha), back ? 1 : 1.35, back ? [3, 3] : []);
  });
  return pv;
}

const LABS = [];

/* ==========================================================================
   TAB 1 — PHÂN LOẠI CHẤT RẮN: ĐƠN TINH THỂ · ĐA TINH THỂ · VÔ ĐỊNH HÌNH
   Kính hiển vi nguyên tử so sánh 3 cấu trúc rắn thực tế + chùm electron truyền qua
   để thấy vì sao đơn tinh thể dẫn điện đều đặn còn biên hạt & hỗn loạn gây tán xạ!
   ========================================================================== */
LABS.push({
  id: 'solid', name: 'Đơn / Đa / Vô định hình', no: '1', secs: [1],
  S: { type: 'single', beam: true },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Kính hiển vi nguyên tử — So sánh Đơn tinh thể, Đa tinh thể và Vô định hình',
    area: 'a', anim: true,
    ctrls: [
      { k: 'type', seg: [['single', 'Đơn tinh thể'], ['poly', 'Đa tinh thể'], ['amorph', 'Vô định hình']] },
      { btn: 'Bật / Tắt chùm e⁻', fn: p => { p.S.beam = !p.S.beam; queueReact(p.tab, 'beam'); } }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 34;

      // Xây dựng 3 mẫu nguyên tử cố định trong tọa độ chuẩn hóa [0,1]×[0,1]
      if (!st.models) {
        st.models = {};

        // 1. Đơn tinh thể: lưới vuông đều tăm tắp, trật tự tầm xa hoàn hảo
        const single = [];
        const sc = 13, sr = 8;
        for (let r = 0; r < sr; r++) {
          for (let c = 0; c < sc; c++) {
            single.push({ x: 0.07 + c * (0.86 / (sc - 1)), y: 0.14 + r * (0.74 / (sr - 1)), g: 0, ph: rnd(0, TAU) });
          }
        }
        st.models.single = { atoms: single, grains: [] };

        // 2. Đa tinh thể: 4 hạt tinh thể (Voronoi seeds) mỗi hạt xoay 1 góc riêng
        const seeds = [
          { x: 0.25, y: 0.30, ang: 0.12, col: 'c2' },
          { x: 0.74, y: 0.28, ang: 0.62, col: 'c1' },
          { x: 0.30, y: 0.76, ang: -0.45, col: 'c5' },
          { x: 0.76, y: 0.74, ang: 0.32, col: 'c3' }
        ];
        const poly = [];
        seeds.forEach((sd, gi) => {
          const ca = Math.cos(sd.ang), sa = Math.sin(sd.ang);
          const sp = 0.068;
          for (let ix = -9; ix <= 9; ix++) {
            for (let iy = -9; iy <= 9; iy++) {
              const px = sd.x + (ix * ca - iy * sa) * sp;
              const py = sd.y + (ix * sa + iy * ca) * sp;
              if (px < 0.05 || px > 0.95 || py < 0.11 || py > 0.90) continue;
              // Kiểm tra có thuộc vùng Voronoi của seed này không
              let best = gi, bestD = (px - sd.x) ** 2 + (py - sd.y) ** 2;
              for (let j = 0; j < seeds.length; j++) {
                const d2 = (px - seeds[j].x) ** 2 + (py - seeds[j].y) ** 2;
                if (d2 < bestD) { bestD = d2; best = j; }
              }
              if (best === gi) poly.push({ x: px, y: py, g: gi, col: sd.col, ph: rnd(0, TAU) });
            }
          }
        });
        st.models.poly = { atoms: poly, grains: seeds };

        // 3. Vô định hình: giữ khoảng cách lân cận gần (không chồng nhau) nhưng mất trật tự tầm xa
        const amorph = [];
        let seed = 42;
        const prng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
        let tries = 0;
        while (amorph.length < 96 && tries < 9000) {
          tries++;
          const px = 0.06 + prng() * 0.88;
          const py = 0.13 + prng() * 0.76;
          let ok = true;
          for (let i = 0; i < amorph.length; i++) {
            if (Math.hypot(px - amorph[i].x, py - amorph[i].y) < 0.062) { ok = false; break; }
          }
          if (ok) amorph.push({ x: px, y: py, g: 0, ph: prng() * TAU });
        }
        st.models.amorph = { atoms: amorph, grains: [] };

        // Các electron thử nghiệm bay ngang từ trái sang phải
        st.electrons = Array.from({ length: 12 }, (_, i) => ({
          x: rnd(0.02, 0.95), y: 0.22 + (i % 6) * 0.115,
          vx: 0.28, vy: 0, scatters: 0
        }));
        st.sparks = [];
      }

      drawChamber(ctx, chX, chY, chW, chH, 10);

      const mod = st.models[S.type];
      const atoms = mod.atoms;
      const toPx = (nx, ny) => ({ x: chX + nx * chW, y: chY + ny * chH });

      // 1. Vẽ liên kết giữa các nguyên tử lân cận gần nhất
      const maxBond = S.type === 'amorph' ? 0.095 : 0.088;
      for (let i = 0; i < atoms.length; i++) {
        const a = atoms[i], pa = toPx(a.x, a.y);
        for (let j = i + 1; j < atoms.length; j++) {
          const b = atoms[j];
          if (S.type === 'poly' && a.g !== b.g) continue;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxBond) {
            const pb = toPx(b.x, b.y);
            const bondCol = S.type === 'poly' ? hexA(C[a.col], 0.32) : hexA(C.g, 0.9);
            ln(ctx, pa.x, pa.y, pb.x, pb.y, bondCol, 1.4);
          }
        }
      }

      // Nếu là đa tinh thể: vẽ đường biên hạt (grain boundary) mờ giữa các vùng
      if (S.type === 'poly') {
        const midX = chX + chW * 0.50, midY = chY + chH * 0.52;
        ln(ctx, midX, chY + 26, midX, chY + chH - 12, hexA(C.err, 0.55), 1.6, [5, 4]);
        ln(ctx, chX + 14, midY, chX + chW - 14, midY, hexA(C.err, 0.55), 1.6, [5, 4]);
        txt(ctx, 'Biên hạt (Grain boundary)', midX + 8, chY + 34, C.err, 9.5, 'left', 700, MONO);
      }

      // 2. Vẽ các nguyên tử (dao động nhiệt nhẹ tại chỗ)
      atoms.forEach(a => {
        const pt = toPx(a.x, a.y);
        const ox = Math.sin(t * 7 + a.ph) * 1.1;
        const oy = Math.cos(t * 7.5 + a.ph) * 1.1;
        const col = S.type === 'single' ? C.c2 : S.type === 'poly' ? C[a.col] : C.c4;
        dot(ctx, pt.x + ox, pt.y + oy, 6.2, C.bg);
        ctx.beginPath(); ctx.arc(pt.x + ox, pt.y + oy, 6.2, 0, TAU);
        ctx.strokeStyle = hexA(col, 0.85); ctx.lineWidth = 1.6; ctx.stroke();
        dot(ctx, pt.x + ox, pt.y + oy, 2.2, col);
      });

      // 3. Chùm electron thử nghiệm bay qua mạng tinh thể (minh họa độ linh động thực tế)
      if (S.beam) {
        st.electrons.forEach(e => {
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          // Trở về hướng ngang từ từ do điện trường kéo nhẹ
          e.vx += (0.28 - e.vx) * dt * 1.8;
          e.vy *= Math.max(0, 1 - dt * 2.2);

          // Tán xạ tại biên hạt (Đa tinh thể) hoặc bất kỳ chỗ hỗn loạn (Vô định hình)
          let hit = false;
          if (S.type === 'poly' && (Math.abs(e.x - 0.50) < 0.015 || Math.abs(e.y - 0.52) < 0.015)) {
            if (Math.random() < dt * 12) hit = true;
          } else if (S.type === 'amorph') {
            if (Math.random() < dt * 6.5) hit = true;
          }
          if (hit) {
            const ang = rnd(-1.3, 1.3);
            e.vx = Math.cos(ang) * 0.20;
            e.vy = Math.sin(ang) * 0.24;
            st.sparks.push({ x: e.x, y: e.y, life: 1.0 });
          }

          if (e.x > 0.96) { e.x = 0.03; e.y = rnd(0.18, 0.84); e.vx = 0.28; e.vy = 0; }
          if (e.y < 0.12 || e.y > 0.88) { e.vy *= -1; e.y = clamp(e.y, 0.12, 0.88); }

          const pe = toPx(e.x, e.y);
          glowDot(ctx, pe.x, pe.y, 3.8, C.ink, hexA(C.main, 0.9));
          dot(ctx, pe.x, pe.y, 3.2, C.main);
        });

        st.sparks.forEach(sp => {
          sp.life -= dt * 2.4;
          if (sp.life <= 0) return;
          const ps = toPx(sp.x, sp.y);
          ctx.beginPath(); ctx.arc(ps.x, ps.y, 4 + (1 - sp.life) * 14, 0, TAU);
          ctx.strokeStyle = hexA(C.err, sp.life * 0.85); ctx.lineWidth = 1.5; ctx.stroke();
        });
        st.sparks = st.sparks.filter(sp => sp.life > 0);
      }

      // Thông số gọn gàng ở mép trên & dưới
      const info = {
        single: ['ĐƠN TINH THỂ (Single Crystal)', 'Trật tự tầm xa hoàn hảo · Dùng chế tạo chip CPU/IC', C.c2],
        poly: ['ĐA TINH THỂ (Polycrystalline)', 'Nhiều hạt nhỏ ghép lại · Biên hạt gây tán xạ e⁻', C.c1],
        amorph: ['VÔ ĐỊNH HÌNH (Amorphous)', 'Chỉ có trật tự tầm gần · Electron tán xạ liên tục', C.c4]
      }[S.type];
      txt(ctx, info[0], chX + 14, chY + 16, info[2], 11, 'left', 700, MONO);
      txt(ctx, info[1], chX + chW - 14, chY + 16, C.ink, 10.2, 'right', 600);
      txt(ctx, 'Chấm vàng: electron thử nghiệm bay qua mạng tinh thể · Quan sát sự tán xạ ở biên hạt và vùng hỗn loạn',
        W / 2, H - 12, C.mut, 10.3, 'center', 500);
    }
  }]
});

/* ==========================================================================
   TAB 2 — CÁC MẠNG LẬP PHƯƠNG CƠ BẢN 3D: SC · BCC · FCC & TỶ LỆ LẤP ĐẦY APF
   Mô hình ô cơ sở 3D xoay bằng chuột:
   - SC: 8 góc (1/8) → N = 1, R = a/2, APF = 52%
   - BCC: 8 góc + 1 tâm khối → N = 2, R = √3·a/4, APF = 68%
   - FCC: 8 góc + 6 tâm mặt (1/2) → N = 4, R = √2·a/4, APF = 74%
   ========================================================================== */
const CUBIC_DATA = {
  sc: {
    name: 'Lập phương đơn giản (SC)', N: 1, rFactor: 0.5, apf: 52.4, coord: 6,
    atoms: [
      [-0.5,-0.5,-0.5,'c'],[0.5,-0.5,-0.5,'c'],[0.5,0.5,-0.5,'c'],[-0.5,0.5,-0.5,'c'],
      [-0.5,-0.5, 0.5,'c'],[0.5,-0.5, 0.5,'c'],[0.5,0.5, 0.5,'c'],[-0.5,0.5, 0.5,'c']
    ],
    formulaR: 'R = a / 2', eqN: '8×(1/8) = 1'
  },
  bcc: {
    name: 'Lập phương tâm khối (BCC)', N: 2, rFactor: Math.sqrt(3) / 4, apf: 68.0, coord: 8,
    atoms: [
      [-0.5,-0.5,-0.5,'c'],[0.5,-0.5,-0.5,'c'],[0.5,0.5,-0.5,'c'],[-0.5,0.5,-0.5,'c'],
      [-0.5,-0.5, 0.5,'c'],[0.5,-0.5, 0.5,'c'],[0.5,0.5, 0.5,'c'],[-0.5,0.5, 0.5,'c'],
      [0, 0, 0, 'b']
    ],
    formulaR: 'R = √3·a / 4', eqN: '8×(1/8) + 1 = 2'
  },
  fcc: {
    name: 'Lập phương tâm mặt (FCC)', N: 4, rFactor: Math.sqrt(2) / 4, apf: 74.0, coord: 12,
    atoms: [
      [-0.5,-0.5,-0.5,'c'],[0.5,-0.5,-0.5,'c'],[0.5,0.5,-0.5,'c'],[-0.5,0.5,-0.5,'c'],
      [-0.5,-0.5, 0.5,'c'],[0.5,-0.5, 0.5,'c'],[0.5,0.5, 0.5,'c'],[-0.5,0.5, 0.5,'c'],
      [0, 0, -0.5, 'f'],[0, 0, 0.5, 'f'],[0, -0.5, 0, 'f'],[0, 0.5, 0, 'f'],[-0.5, 0, 0, 'f'],[0.5, 0, 0, 'f']
    ],
    formulaR: 'R = √2·a / 4', eqN: '8×(1/8) + 6×(1/2) = 4'
  }
};

LABS.push({
  id: 'cubic', name: 'Mạng SC / BCC / FCC', no: '2', secs: [2],
  S: { lat: 'fcc', view: 'ball', a: 4.0 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Ô cơ sở lập phương 3D — Kéo chuột xoay & So sánh độ chặt khít APF',
    area: 'a', anim: true,
    ctrls: [
      { k: 'lat', seg: [['sc', 'SC (N=1)'], ['bcc', 'BCC (N=2)'], ['fcc', 'FCC (N=4)']] },
      { k: 'view', seg: [['ball', 'Khung bi'], ['touch', 'Cầu chạm nhau (APF)']] },
      { k: 'a', l: 'Hằng số a', min: 2.5, max: 6.5, step: 0.1, f: v => v.toFixed(1) + ' Å' }
    ],
    draw(p, ctx, W, H, t, dt) {
      bindDrag3D(p, 0.58, 0.34);
      const S = p.S, st = p.st;
      if (!st.dragging) st.rotY += dt * 0.32;

      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 34;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      const d = CUBIC_DATA[S.lat];
      const cx = chX + chW * 0.5, cy = chY + chH * 0.53;
      const scale = Math.min(chW, chH) * 0.48;
      const proj = makeProj(st.rotY, st.rotX, cx, cy, scale);

      // 1. Khung ô cơ sở lập phương
      drawUnitCubeWire(ctx, proj, C.mut, 0.65);

      // Đường chéo chạm nhau đặc trưng cho từng loại mạng
      if (S.lat === 'sc') {
        const p1 = proj(-0.5, -0.5, 0.5), p2 = proj(0.5, -0.5, 0.5);
        ln(ctx, p1.sx, p1.sy, p2.sx, p2.sy, C.main, 2.2);
      } else if (S.lat === 'bcc') {
        const p1 = proj(-0.5, -0.5, -0.5), p2 = proj(0.5, 0.5, 0.5);
        ln(ctx, p1.sx, p1.sy, p2.sx, p2.sy, C.main, 2.2, [5, 3]);
      } else if (S.lat === 'fcc') {
        const p1 = proj(-0.5, -0.5, 0.5), p2 = proj(0.5, 0.5, 0.5);
        ln(ctx, p1.sx, p1.sy, p2.sx, p2.sy, C.main, 2.2, [5, 3]);
      }

      // 2. Sắp xếp các nguyên tử theo chiều sâu z (painter's algorithm)
      const list = d.atoms.map(at => {
        const q = proj(at[0], at[1], at[2]);
        return { x: at[0], y: at[1], z: at[2], kind: at[3], q };
      }).sort((a, b) => a.q.z - b.q.z);

      const rUnit = S.view === 'touch' ? d.rFactor : 0.14;
      list.forEach(item => {
        const col = item.kind === 'b' ? C.main : item.kind === 'f' ? C.c1 : C.c2;
        const rad = rUnit * scale * item.q.s;
        const alpha = S.view === 'touch' ? 0.86 : 0.96;
        sphere3D(ctx, item.q.sx, item.q.sy, rad, col, alpha);
        if (S.view === 'ball') {
          const lb = item.kind === 'b' ? '1' : item.kind === 'f' ? '½' : '⅛';
          txt(ctx, lb, item.q.sx, item.q.sy + 0.5, C.bg, clamp(rad * 0.72, 8, 12), 'center', 800, MONO);
        }
      });

      // Thông số tính toán chuẩn xác theo hằng số mạng a
      const R_A = d.rFactor * S.a;
      const vol_cm3 = Math.pow(S.a * 1e-8, 3);
      const dens = d.N / vol_cm3;

      txt(ctx, d.name + ' · ' + d.eqN + ' nt/ô', chX + 14, chY + 16, C.ink, 11, 'left', 700, MONO);
      txt(ctx, d.formulaR + ' = ' + R_A.toFixed(2) + ' Å  |  APF = ' + d.apf.toFixed(1) + '%',
        chX + chW - 14, chY + 16, C.main, 10.5, 'right', 700, MONO);

      txt(ctx, 'Mật độ thể tích n = N/a³ = ' + sci(dens, 2) + ' nt/cm³ · Số phối trí = ' + d.coord + ' · Kéo chuột để xoay 3D',
        W / 2, H - 12, C.mut, 10.3, 'center', 500);
    }
  }]
});

/* ==========================================================================
   TAB 3 — CẤU TRÚC KIM CƯƠNG (SILICON) & ZINCBLENDE (GaAs) 3D
   Ô cơ sở 8 nguyên tử hiệu dụng: FCC (8 góc + 6 tâm mặt) + 4 nguyên tử nội tâm
   tạo nên 4 liên kết tứ diện (109.5°).
   ========================================================================== */
const DIAMOND_FCC = [
  [-0.5,-0.5,-0.5],[0.5,-0.5,-0.5],[0.5,0.5,-0.5],[-0.5,0.5,-0.5],
  [-0.5,-0.5, 0.5],[0.5,-0.5, 0.5],[0.5,0.5, 0.5],[-0.5,0.5, 0.5],
  [0, 0,-0.5],[0, 0, 0.5],[0,-0.5, 0],[0, 0.5, 0],[-0.5, 0, 0],[0.5, 0, 0]
];
const DIAMOND_INNER = [
  [-0.25, -0.25, -0.25],
  [ 0.25,  0.25, -0.25],
  [ 0.25, -0.25,  0.25],
  [-0.25,  0.25,  0.25]
];
// Các liên kết tứ diện nối mỗi nguyên tử nội tâm với 4 hàng xóm FCC gần nhất (d = √3/4)
const DIAMOND_BONDS = [];
DIAMOND_INNER.forEach((inn, ii) => {
  DIAMOND_FCC.forEach((fc, fi) => {
    const dist = Math.hypot(inn[0] - fc[0], inn[1] - fc[1], inn[2] - fc[2]);
    if (Math.abs(dist - Math.sqrt(3) / 4) < 0.02) {
      DIAMOND_BONDS.push([ii, fi]);
    }
  });
});

LABS.push({
  id: 'diamond', name: 'Kim cương & GaAs', no: '3', secs: [3],
  S: { mat: 'si', view: 'tetra', rScale: 0.42 },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Cấu trúc Kim cương (Si) & Zincblende (GaAs) 3D — Liên kết tứ diện 109.5°',
    area: 'a', anim: true,
    ctrls: [
      { k: 'mat', seg: [['si', 'Silicon (Kim cương)'], ['gaas', 'GaAs (Zincblende)']] },
      { k: 'view', seg: [['tetra', 'Nổi tứ diện'], ['all', 'Toàn ô 8 nt']] },
      { k: 'rScale', l: 'Bán kính cầu', min: 0.28, max: 1.0, step: 0.04, f: v => v >= 0.98 ? 'Chạm nhau' : Math.round(v * 100) + '%' }
    ],
    draw(p, ctx, W, H, t, dt) {
      bindDrag3D(p, 0.65, 0.30);
      const S = p.S, st = p.st;
      if (!st.dragging) st.rotY += dt * 0.28;

      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 34;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      const isGaAs = S.mat === 'gaas';
      const a_A = isGaAs ? 5.65 : 5.43;
      const cx = chX + chW * 0.5, cy = chY + chH * 0.53;
      const scale = Math.min(chW, chH) * 0.50;
      const proj = makeProj(st.rotY, st.rotX, cx, cy, scale);

      drawUnitCubeWire(ctx, proj, C.mut, 0.52);

      // Chuẩn bị toàn bộ danh sách nút & chiếu 3D
      const fccP = DIAMOND_FCC.map(v => proj(v[0], v[1], v[2]));
      const innP = DIAMOND_INNER.map(v => proj(v[0], v[1], v[2]));

      // Nếu bật "Nổi tứ diện", làm nổi bật khối tứ diện đầu tiên (nút nội tâm 0)
      const hiInner = S.view === 'tetra' ? 0 : -1;

      // Vẽ các thanh liên kết cộng hóa trị tứ diện
      DIAMOND_BONDS.forEach(([ii, fi]) => {
        const a = innP[ii], b = fccP[fi];
        const isHi = hiInner === -1 || ii === hiInner;
        ln(ctx, a.sx, a.sy, b.sx, b.sy,
          isHi ? hexA(C.main, 0.85) : hexA(C.g, 0.45),
          isHi ? 2.4 : 1.1);
      });

      // Nếu đang nổi tứ diện 0, vẽ khung mặt tứ diện nối 4 đỉnh FCC của nó
      if (hiInner === 0) {
        const verts = DIAMOND_BONDS.filter(b => b[0] === 0).map(b => fccP[b[1]]);
        for (let i = 0; i < verts.length; i++) {
          for (let j = i + 1; j < verts.length; j++) {
            ln(ctx, verts[i].sx, verts[i].sy, verts[j].sx, verts[j].sy, hexA(C.c1, 0.42), 1.2, [4, 3]);
          }
        }
      }

      // Gộp các nguyên tử để vẽ theo độ sâu z
      const touchR = Math.sqrt(3) / 8; // Bán kính chạm nhau = √3·a / 8
      const rUnit = touchR * S.rScale;
      const allAtoms = [];
      DIAMOND_FCC.forEach((v, i) => {
        const belongsHi = hiInner === -1 || DIAMOND_BONDS.some(b => b[0] === hiInner && b[1] === i);
        allAtoms.push({
          q: fccP[i],
          col: isGaAs ? C.c5 : C.c2,
          lbl: isGaAs ? 'Ga' : 'Si',
          alpha: belongsHi ? 0.94 : 0.30
        });
      });
      DIAMOND_INNER.forEach((v, i) => {
        const belongsHi = hiInner === -1 || i === hiInner;
        allAtoms.push({
          q: innP[i],
          col: isGaAs ? C.c3 : C.c1,
          lbl: isGaAs ? 'As' : 'Si',
          alpha: belongsHi ? 0.98 : 0.30
        });
      });
      allAtoms.sort((a, b) => a.q.z - b.q.z);

      allAtoms.forEach(item => {
        const rad = rUnit * scale * item.q.s;
        sphere3D(ctx, item.q.sx, item.q.sy, rad, item.col, item.alpha);
        if (S.rScale < 0.72 && item.alpha > 0.5) {
          txt(ctx, item.lbl, item.q.sx, item.q.sy + 0.5, C.bg, clamp(rad * 0.75, 8, 11), 'center', 800, MONO);
        }
      });

      const dNN = (Math.sqrt(3) / 4) * a_A;
      const dens = 8 / Math.pow(a_A * 1e-8, 3);
      txt(ctx, (isGaAs ? 'GaAs (Zincblende: 4 Ga + 4 As)' : 'Silicon (Kim cương: 8 Si/ô)') + ' · a = ' + a_A.toFixed(2) + ' Å',
        chX + 14, chY + 16, C.ink, 11, 'left', 700, MONO);
      txt(ctx, 'd_min = ' + dNN.toFixed(2) + ' Å  |  APF = 34.0%  |  n = ' + sci(dens, 2) + ' cm⁻³',
        chX + chW - 14, chY + 16, C.main, 10.2, 'right', 700, MONO);

      txt(ctx, '4 nguyên tử nội tâm tại (¼,¼,¼)... tạo liên kết tứ diện 109.5° · Kéo bán kính lên 100% để thấy độ rỗng 66% (APF = 34%)',
        W / 2, H - 12, C.mut, 10.2, 'center', 500);
    }
  }]
});

/* ==========================================================================
   TAB 4 — CHỈ SỐ MILLER: MẶT PHẲNG TINH THỂ (hkl) & HƯỚNG [hkl] 3D
   Cắt chính xác mặt phẳng hx + ky + lz = 1 với khối lập phương đơn vị [0,1]³:
   - Làm sáng các nguyên tử nằm ngay trên mặt phẳng (hkl)
   - Vẽ vector pháp tuyến [hkl] vuông góc với mặt phẳng
   - Tính mật độ nguyên tử mặt (atoms/cm²) chuẩn cho Silicon (a = 5.43 Å)
   ========================================================================== */
function clipMillerPlane(h, k, l) {
  if (h === 0 && k === 0 && l === 0) return [];
  // Giao điểm của hx + ky + lz = 1 với 12 cạnh của hình lập phương [0,1]³
  const pts = [];
  const edges = [
    [[0,0,0],[1,0,0]], [[0,1,0],[1,1,0]], [[0,0,1],[1,0,1]], [[0,1,1],[1,1,1]],
    [[0,0,0],[0,1,0]], [[1,0,0],[1,1,0]], [[0,0,1],[0,1,1]], [[1,0,1],[1,1,1]],
    [[0,0,0],[0,0,1]], [[1,0,0],[1,0,1]], [[0,1,0],[0,1,1]], [[1,1,0],[1,1,1]]
  ];
  edges.forEach(([a, b]) => {
    const fa = h * a[0] + k * a[1] + l * a[2] - 1;
    const fb = h * b[0] + k * b[1] + l * b[2] - 1;
    if (Math.abs(fa) < 1e-6) pts.push(a);
    if (Math.abs(fb) < 1e-6) pts.push(b);
    if (fa * fb < 0) {
      const u = -fa / (fb - fa);
      pts.push([a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1]), a[2] + u * (b[2] - a[2])]);
    }
  });
  // Lọc trùng lặp
  const uniq = [];
  pts.forEach(p => {
    if (!uniq.some(q => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-4)) uniq.push(p);
  });
  if (uniq.length < 3) return uniq;

  // Sắp xếp đỉnh đa giác lồi theo góc quanh tâm trên mặt phẳng
  const cx = uniq.reduce((s, p) => s + p[0], 0) / uniq.length;
  const cy = uniq.reduce((s, p) => s + p[1], 0) / uniq.length;
  const cz = uniq.reduce((s, p) => s + p[2], 0) / uniq.length;
  const nl = Math.hypot(h, k, l);
  const nx = h / nl, ny = k / nl, nz = l / nl;
  // Hai vector cơ sở trực chuẩn trên mặt phẳng
  let ux = Math.abs(nx) < 0.8 ? 1 : 0, uy = Math.abs(nx) < 0.8 ? 0 : 1, uz = 0;
  const dotN = ux * nx + uy * ny + uz * nz;
  ux -= dotN * nx; uy -= dotN * ny; uz -= dotN * nz;
  const ul = Math.hypot(ux, uy, uz) || 1;
  ux /= ul; uy /= ul; uz /= ul;
  const vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux;

  uniq.sort((p, q) => {
    const ap = Math.atan2((p[0] - cx) * vx + (p[1] - cy) * vy + (p[2] - cz) * vz,
                          (p[0] - cx) * ux + (p[1] - cy) * uy + (p[2] - cz) * uz);
    const aq = Math.atan2((q[0] - cx) * vx + (q[1] - cy) * vy + (q[2] - cz) * vz,
                          (q[0] - cx) * ux + (q[1] - cy) * uy + (q[2] - cz) * uz);
    return ap - aq;
  });
  return uniq;
}

LABS.push({
  id: 'miller', name: 'Mặt Miller (hkl)', no: '4', secs: [4],
  S: { h: 1, k: 1, l: 1, lat: 'fcc' },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Mặt phẳng tinh thể Miller (hkl) & Hướng pháp tuyến [hkl] 3D',
    area: 'a', anim: true,
    ctrls: [
      { k: 'h', l: 'h', min: 0, max: 2, step: 1, f: v => v },
      { k: 'k', l: 'k', min: 0, max: 2, step: 1, f: v => v },
      { k: 'l', l: 'l', min: 0, max: 2, step: 1, f: v => v },
      { btn: '(100)', fn: p => { Object.assign(p.S, { h: 1, k: 0, l: 0 }); p.syncCtrls(); queueReact(p.tab, 'h'); } },
      { btn: '(110)', fn: p => { Object.assign(p.S, { h: 1, k: 1, l: 0 }); p.syncCtrls(); queueReact(p.tab, 'h'); } },
      { btn: '(111)', fn: p => { Object.assign(p.S, { h: 1, k: 1, l: 1 }); p.syncCtrls(); queueReact(p.tab, 'h'); } },
      { k: 'lat', seg: [['sc', 'SC'], ['bcc', 'BCC'], ['fcc', 'FCC']] }
    ],
    draw(p, ctx, W, H, t, dt) {
      bindDrag3D(p, 0.72, 0.36);
      const S = p.S, st = p.st;
      if (!st.dragging) st.rotY += dt * 0.22;

      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 34;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      const h = Math.round(S.h), k = Math.round(S.k), l = Math.round(S.l);
      const cx = chX + chW * 0.5, cy = chY + chH * 0.54;
      const scale = Math.min(chW, chH) * 0.46;
      const proj = makeProj(st.rotY, st.rotX, cx, cy, scale);
      // Chuyển hệ tọa độ tinh thể [0,1]³ (x ra trước, y sang phải, z lên trên) sang tâm [-0.5,0.5]³
      const pCrys = (x, y, z) => proj(y - 0.5, z - 0.5, x - 0.5);

      // 1. Vẽ trục tinh thể gốc O(0,0,0) → x, y, z
      const o0 = pCrys(0, 0, 0);
      [['x', 1.25, 0, 0, C.c4], ['y', 0, 1.25, 0, C.c1], ['z', 0, 0, 1.25, C.c2]].forEach(([lb, ax, ay, az, col]) => {
        const pt = pCrys(ax, ay, az);
        ln(ctx, o0.sx, o0.sy, pt.sx, pt.sy, hexA(col, 0.7), 1.6);
        txt(ctx, lb, pt.sx + 7, pt.sy, col, 10.5, 'left', 700, MONO);
      });

      // 2. Vẽ khung lập phương
      drawUnitCubeWire(ctx, proj, C.mut, 0.55);

      // 3. Vẽ mặt phẳng Miller (hkl) bán trong suốt
      const poly = clipMillerPlane(h, k, l);
      if (poly.length >= 3) {
        ctx.beginPath();
        poly.forEach((pt, idx) => {
          const q = pCrys(pt[0], pt[1], pt[2]);
          idx === 0 ? ctx.moveTo(q.sx, q.sy) : ctx.lineTo(q.sx, q.sy);
        });
        ctx.closePath();
        ctx.fillStyle = hexA(C.main, 0.28);
        ctx.fill();
        ctx.strokeStyle = C.main;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Vector pháp tuyến [hkl] xuất phát từ tâm mặt phẳng
        const mcx = poly.reduce((s, q) => s + q[0], 0) / poly.length;
        const mcy = poly.reduce((s, q) => s + q[1], 0) / poly.length;
        const mcz = poly.reduce((s, q) => s + q[2], 0) / poly.length;
        const nl = Math.hypot(h, k, l) || 1;
        const nStart = pCrys(mcx, mcy, mcz);
        const nEnd = pCrys(mcx + (h / nl) * 0.45, mcy + (k / nl) * 0.45, mcz + (l / nl) * 0.45);
        ln(ctx, nStart.sx, nStart.sy, nEnd.sx, nEnd.sy, C.c4, 2.4);
        dot(ctx, nEnd.sx, nEnd.sy, 3.8, C.c4);
        txt(ctx, '[' + h + k + l + ']', nEnd.sx + 8, nEnd.sy, C.c4, 10.5, 'left', 800, MONO);
      }

      // 4. Vẽ các nguyên tử của ô cơ sở (làm sáng những nguyên tử nằm ngay trên mặt phẳng!)
      const d = CUBIC_DATA[S.lat];
      const atoms = d.atoms.map(at => {
        const ax = at[0] + 0.5, ay = at[1] + 0.5, az = at[2] + 0.5;
        const onPlane = (h !== 0 || k !== 0 || l !== 0) && Math.abs(h * ax + k * ay + l * az - 1) < 1e-4;
        return { q: pCrys(ax, ay, az), onPlane };
      }).sort((a, b) => a.q.z - b.q.z);

      let onCount = 0;
      atoms.forEach(item => {
        if (item.onPlane) onCount++;
        const rad = (item.onPlane ? 0.085 : 0.052) * scale * item.q.s;
        sphere3D(ctx, item.q.sx, item.q.sy, rad, item.onPlane ? C.main : C.c2, item.onPlane ? 0.98 : 0.45);
      });

      // Tính mật độ mặt chuẩn cho Si (a = 5.43 Å) ở các mặt kinh điển (100), (110), (111)
      const aCm = 5.43e-8;
      let surfStr = 'Giao trục: ' + (h ? '1/' + h : '∞') + ', ' + (k ? '1/' + k : '∞') + ', ' + (l ? '1/' + l : '∞');
      const sorted = [h, k, l].sort().join('');
      if (S.lat === 'fcc') {
        if (sorted === '001') surfStr = 'Mật độ mặt (100) FCC: 2/a² = ' + sci(2 / (aCm * aCm), 2) + ' cm⁻²';
        else if (sorted === '011') surfStr = 'Mật độ mặt (110) FCC: √2/a² = ' + sci(Math.SQRT2 / (aCm * aCm), 2) + ' cm⁻²';
        else if (sorted === '111') surfStr = 'Mật độ mặt (111) FCC: 4/(√3·a²) = ' + sci(4 / (Math.sqrt(3) * aCm * aCm), 2) + ' cm⁻²';
      }

      txt(ctx, 'Mặt phẳng (' + h + k + l + ') · Hướng pháp tuyến [' + h + k + l + '] · Trên mặt: ' + onCount + ' nút',
        chX + 14, chY + 16, C.ink, 10.8, 'left', 700, MONO);
      txt(ctx, surfStr, chX + chW - 14, chY + 16, C.main, 10.2, 'right', 700, MONO);
      txt(ctx, 'Trong hệ lập phương, hướng [' + h + k + l + '] luôn vuông góc với mặt phẳng (' + h + k + l + ') · Kéo chuột xoay 3D',
        W / 2, H - 12, C.mut, 10.2, 'center', 500);
    }
  }]
});

/* ==========================================================================
   TAB 5 — KHUYẾT TẬT ĐIỂM & PHA TẠP TRONG MẠNG SILICON
   Kính hiển vi mạng tinh thể đàn hồi:
   - Mạng hoàn hảo · Nút trống (Vacancy) · Nguyên tử xen kẽ (Interstitial)
   - Thế chỗ Donor P (Nhóm V → thừa e⁻ tự do) · Thế chỗ Acceptor B (Nhóm III → lỗ trống h⁺)
   ========================================================================== */
LABS.push({
  id: 'defect', name: 'Khuyết tật & Pha tạp', no: '5', secs: [5],
  S: { kind: 'vacancy' },
  cols: '1.65fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [{
    title: 'Kính hiển vi mạng tinh thể Silicon — Khuyết tật điểm & Pha tạp thế chỗ',
    area: 'a', anim: true,
    ctrls: [
      { k: 'kind', seg: [
        ['perfect', 'Hoàn hảo'],
        ['vacancy', 'Nút trống'],
        ['inter', 'Xen kẽ'],
        ['donor', 'Donor P (N)'],
        ['acceptor', 'Acceptor B (P)']
      ] }
    ],
    draw(p, ctx, W, H, t, dt) {
      const S = p.S, st = p.st;
      const pad = 12, chX = pad, chY = 8, chW = W - pad * 2, chH = H - 34;
      drawChamber(ctx, chX, chY, chW, chH, 10);

      const cols = 5, rows = 4;
      const gridW = chW * 0.78, gridH = chH * 0.72;
      const gx0 = chX + (chW - gridW) / 2, gy0 = chY + (chH - gridH) / 2 + 10;
      const dx = gridW / (cols - 1), dy = gridH / (rows - 1);

      // Tọa độ trung tâm khuyết tật
      const targetC = 2, targetR = 1;
      const interX = gx0 + 2.5 * dx, interY = gy0 + 1.5 * dy;

      // Tính vị trí từng nguyên tử có xét biến dạng đàn hồi của mạng tinh thể
      const atoms = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let x = gx0 + c * dx, y = gy0 + r * dy;
          const isTarget = c === targetC && r === targetR;

          if (S.kind === 'vacancy' && !isTarget) {
            // Các nguyên tử lân cận hơi co vào phía nút trống
            const ux = (gx0 + targetC * dx) - x, uy = (gy0 + targetR * dy) - y;
            const dist = Math.hypot(ux, uy) || 1;
            const pull = dist < dx * 1.45 ? 7.5 : 1.5;
            x += (ux / dist) * pull; y += (uy / dist) * pull;
          } else if (S.kind === 'inter') {
            // Nguyên tử xen kẽ đẩy mạnh 4 nguyên tử xung quanh ra ngoài (ứng suất nén)
            const ux = x - interX, uy = y - interY;
            const dist = Math.hypot(ux, uy) || 1;
            if (dist < dx * 1.3) {
              const push = 12 * (1 - dist / (dx * 1.5));
              x += (ux / dist) * push; y += (uy / dist) * push;
            }
          }

          x += Math.sin(t * 7 + c * 2 + r) * 1.3;
          y += Math.cos(t * 7.5 + r * 2.5 + c) * 1.3;
          atoms.push({ c, r, x, y, isTarget });
        }
      }

      const getA = (c, r) => atoms[r * cols + c];

      // 1. Vẽ liên kết cộng hóa trị giữa các nguyên tử
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = getA(c, r);
          if (S.kind === 'vacancy' && a.isTarget) continue;
          [[c + 1, r], [c, r + 1]].forEach(([nc, nr]) => {
            if (nc >= cols || nr >= rows) return;
            const b = getA(nc, nr);
            if (S.kind === 'vacancy' && b.isTarget) return;
            const ang = Math.atan2(b.y - a.y, b.x - a.x);
            const nx = -Math.sin(ang) * 4, ny = Math.cos(ang) * 4;
            const isMissingBond = S.kind === 'acceptor' && a.isTarget && nc === c + 1 && nr === r;
            ln(ctx, a.x + nx, a.y + ny, b.x + nx, b.y + ny, hexA(C.g, 0.9), 1.5);
            if (isMissingBond) {
              ln(ctx, a.x - nx, a.y - ny, b.x - nx, b.y - ny, hexA(C.c4, 0.55), 1.3, [3, 3]);
              // Lỗ trống (+) tại liên kết bị thiếu của Acceptor B
              const hx = (a.x + b.x) * 0.5 - nx, hy = (a.y + b.y) * 0.5 - ny;
              glowDot(ctx, hx, hy, 6, hexA(C.c4, 0.25), hexA(C.c4, 0.55));
              ctx.beginPath(); ctx.arc(hx, hy, 6, 0, TAU);
              ctx.strokeStyle = C.c4; ctx.lineWidth = 2; ctx.stroke();
              txt(ctx, '+', hx, hy + 0.5, C.c4, 9.5, 'center', 800, MONO);
            } else {
              ln(ctx, a.x - nx, a.y - ny, b.x - nx, b.y - ny, hexA(C.g, 0.9), 1.5);
            }
          });
        }
      }

      // 2. Vẽ các nguyên tử
      atoms.forEach(a => {
        if (S.kind === 'vacancy' && a.isTarget) {
          // Vòng nét đứt đánh dấu nút trống (Vacancy)
          ctx.beginPath(); ctx.arc(a.x, a.y, 14, 0, TAU);
          ctx.strokeStyle = C.err; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
          txt(ctx, 'Trống', a.x, a.y, C.err, 8.8, 'center', 700, MONO);
          return;
        }
        if (a.isTarget && (S.kind === 'donor' || S.kind === 'acceptor')) {
          const isD = S.kind === 'donor';
          const col = isD ? C.c2 : C.c4;
          glowDot(ctx, a.x, a.y, 16, hexA(col, 0.22), hexA(col, 0.45));
          dot(ctx, a.x, a.y, 16, C.bg);
          ctx.beginPath(); ctx.arc(a.x, a.y, 16, 0, TAU);
          ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.stroke();
          txt(ctx, isD ? 'P⁺' : 'B⁻', a.x, a.y + 0.5, col, 11.5, 'center', 800, MONO);
          return;
        }
        dot(ctx, a.x, a.y, 13.5, C.bg);
        ctx.beginPath(); ctx.arc(a.x, a.y, 13.5, 0, TAU);
        ctx.strokeStyle = C.sub; ctx.lineWidth = 1.6; ctx.stroke();
        txt(ctx, 'Si', a.x, a.y + 0.5, C.ink, 10.5, 'center', 700, MONO);
      });

      // 3. Nguyên tử xen kẽ (Interstitial) chui vào khe giữa 4 nguyên tử Si
      if (S.kind === 'inter') {
        const ix = interX + Math.sin(t * 14) * 1.6, iy = interY + Math.cos(t * 13) * 1.6;
        glowDot(ctx, ix, iy, 12, C.ink, hexA(C.main, 0.75));
        dot(ctx, ix, iy, 11.5, C.main);
        txt(ctx, 'Si*', ix, iy + 0.5, C.bg, 9.5, 'center', 800, MONO);
      }

      // 4. Electron thứ 5 tự do bay quanh Donor P
      if (S.kind === 'donor') {
        if (!st.freeE) st.freeE = { x: 0.55, y: 0.35, vx: 0.22, vy: 0.16 };
        const e = st.freeE;
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.x < 0.08 || e.x > 0.92) { e.vx *= -1; e.x = clamp(e.x, 0.08, 0.92); }
        if (e.y < 0.16 || e.y > 0.88) { e.vy *= -1; e.y = clamp(e.y, 0.16, 0.88); }
        if (Math.random() < dt * 1.5) {
          const a = rnd(0, TAU); e.vx = Math.cos(a) * 0.25; e.vy = Math.sin(a) * 0.25;
        }
        const ex_ = chX + e.x * chW, ey_ = chY + e.y * chH;
        glowDot(ctx, ex_, ey_, 5.5, C.ink, hexA(C.c2, 0.9));
        dot(ctx, ex_, ey_, 4.6, C.c2);
        txt(ctx, '−', ex_, ey_ + 0.5, C.bg, 9.5, 'center', 800, MONO);
      }

      const meta = {
        perfect: ['MẠNG SILICON HOÀN HẢO', 'Không có khuyết tật · Mọi liên kết cộng hóa trị đều bão hòa', C.c1],
        vacancy: ['KHUYẾT TẬT NÚT TRỐNG (Vacancy)', 'Thiếu 1 nguyên tử Si · Các nút xung quanh hơi co về tâm', C.err],
        inter: ['NGUYÊN TỬ XEN KẼ (Interstitial)', 'Nguyên tử chui vào khe mạng · Gây ứng suất đẩy mạnh xung quanh', C.main],
        donor: ['PHA TẠP THẾ CHỖ DONOR (P · Nhóm V)', 'Thừa 1 e⁻ hóa trị → Tách thành electron tự do (Bán dẫn loại N)', C.c2],
        acceptor: ['PHA TẠP THẾ CHỖ ACCEPTOR (B · Nhóm III)', 'Thiếu 1 e⁻ liên kết → Tạo lỗ trống (+) tự do (Bán dẫn loại P)', C.c4]
      }[S.kind];

      txt(ctx, meta[0], chX + 14, chY + 16, meta[2], 10.8, 'left', 700, MONO);
      txt(ctx, meta[1], chX + chW - 14, chY + 16, C.ink, 10, 'right', 600);
      txt(ctx, 'Khuyết tật điểm làm biến dạng mạng cục bộ; pha tạp thế chỗ có kiểm soát là nền tảng để tạo bán dẫn loại N và P',
        W / 2, H - 12, C.mut, 10.2, 'center', 500);
    }
  }]
});

/* ==========================================================================
   NHẬT KÝ THÍ NGHIỆM (Log intro + react cho 5 tab Buổi 1)
   ========================================================================== */
const LD = {};

LD.solid = {
  intro: [
    ['i', 'Chất rắn chia thành 3 loại chính dựa trên trật tự sắp xếp nguyên tử: Đơn tinh thể, Đa tinh thể và Vô định hình.'],
    ['w', 'Đơn tinh thể (Single Crystal): Nguyên tử xếp đều đặn tuần hoàn trên toàn bộ mẫu (trật tự tầm xa) — chùm electron đi xuyên mượt mà.'],
    ['w', 'Đa tinh thể (Polycrystalline): Gồm nhiều miền đơn tinh thể nhỏ ghép lại; các đường biên hạt (nét đứt đỏ) gây tán xạ electron mạnh.'],
    ['v', 'Chuyển đổi giữa 3 cấu trúc để quan sát sự khác biệt về trật tự lưới và mức độ tán xạ của chùm electron thử nghiệm!']
  ],
  react(S, k, P, say) {
    if (k === 'beam') {
      say('w', S.beam ? 'Đã bật chùm electron thử nghiệm để quan sát tán xạ.' : 'Đã tắt chùm electron để quan sát rõ cấu trúc lưới.');
      return;
    }
    if (S.type === 'single') say('v', 'Đơn tinh thể: Không có biên hạt, tính chất điện đồng đều — bắt buộc dùng làm tấm wafer Silicon chế tạo vi mạch.');
    else if (S.type === 'poly') say('v', 'Đa tinh thể: Các hạt tinh thể có hướng mạng khác nhau; biên hạt làm giảm độ linh động hạt tải (dùng làm cực cổng Poly-Si, pin mặt trời giá rẻ).');
    else say('v', 'Vô định hình: Mất hoàn toàn trật tự tầm xa (như thủy tinh, a-Si trong màn hình LCD) — electron bị tán xạ liên tục.');
  }
};

LD.cubic = {
  intro: [
    ['i', 'Ba kiểu mạng lập phương cơ bản: SC (N=1), BCC (N=2) và FCC (N=4). Kéo chuột trực tiếp để xoay ô cơ sở 3D!'],
    ['w', 'Quy tắc đếm nguyên tử hiệu dụng trong 1 ô cơ sở: 1 nút ở góc tính 1/8, 1 nút ở tâm mặt tính 1/2, 1 nút ở tâm khối tính trọn 1.'],
    ['w', 'Tỷ lệ lấp đầy (APF) cho biết phần trăm thể tích thực sự bị chiếm bởi nguyên tử: SC = 52.4% < BCC = 68.0% < FCC = 74.0% (chặt nhất).'],
    ['v', 'Chuyển sang chế độ "Cầu chạm nhau (APF)" để thấy rõ hướng các nguyên tử tiếp xúc trực tiếp với nhau (cạnh, đường chéo khối, đường chéo mặt).']
  ],
  react(S, k, P, say) {
    const d = CUBIC_DATA[S.lat];
    const R = d.rFactor * S.a;
    const dens = d.N / Math.pow(S.a * 1e-8, 3);
    say('v', `${d.name}: N_eff = ${d.N} (${d.eqN}), ${d.formulaR} = ${R.toFixed(2)} Å, APF = ${d.apf.toFixed(1)}%, n = ${sci(dens, 2)} nt/cm³.`);
    if (k === 'lat') {
      say('w', S.lat === 'sc' ? 'SC tiếp xúc dọc cạnh lập phương (2R = a), rất rỗng nên hiếm gặp trong tự nhiên (chỉ có Polonium).'
        : S.lat === 'bcc' ? 'BCC tiếp xúc dọc đường chéo khối (4R = √3·a), gặp ở Fe-α, Cr, W.'
        : 'FCC tiếp xúc dọc đường chéo mặt (4R = √2·a), đạt độ chặt tối đa 74% (Al, Cu, Au, Ag).');
    }
  }
};

LD.diamond = {
  intro: [
    ['i', 'Silicon (Si) và Germanium (Ge) kết tinh theo mạng Kim cương: gồm mạng FCC cộng thêm 4 nguyên tử nội tâm tại (¼,¼,¼), (¾,¾,¼), (¾,¼,¾), (¼,¾,¾).'],
    ['w', 'Tổng số nguyên tử trong 1 ô cơ sở: N_eff = 8×(1/8) + 6×(1/2) + 4 = 8 nguyên tử. Với Si (a = 5.43 Å) → mật độ n ≈ 5.0×10²² nguyên tử/cm³.'],
    ['w', 'Mỗi nguyên tử liên kết cộng hóa trị với đúng 4 hàng xóm gần nhất tạo khối tứ diện đều (góc 109.5°), nên cấu trúc rất rỗng (APF chỉ 34%!).'],
    ['v', 'Chuyển sang "GaAs (Zincblende)" để thấy mạng FCC gồm các nguyên tử Ga (Nhóm III) và 4 nút nội tâm là As (Nhóm V) xen kẽ nhau.']
  ],
  react(S, k, P, say) {
    const isGaAs = S.mat === 'gaas';
    const a_A = isGaAs ? 5.65 : 5.43;
    if (k === 'mat') {
      say('v', isGaAs
        ? 'GaAs (Zincblende, a = 5.65 Å): Mỗi ô cơ sở chứa 4 nguyên tử Ga (FCC) và 4 nguyên tử As (nội tâm) liên kết tứ diện.'
        : 'Silicon (Kim cương, a = 5.43 Å): Cả 8 nguyên tử trong ô cơ sở đều là Si, khoảng cách gần nhất d = √3·a/4 ≈ 2.35 Å.');
    } else if (k === 'rScale') {
      say('w', S.rScale >= 0.96
        ? 'Trạng thái cầu chạm nhau (R = √3·a/8): Nhận thấy vẫn còn tới 66% khoảng không gian trống — lý do nguyên tử tạp chất dễ khuếch tán vào Si!'
        : `Đang hiển thị bán kính cầu ở mức ${Math.round(S.rScale * 100)}% để dễ quan sát liên kết tứ diện.`);
    } else if (k === 'view') {
      say('i', S.view === 'tetra' ? 'Đang làm nổi bật 1 khối tứ diện (1 nút nội tâm nối với 4 đỉnh FCC lân cận).' : 'Đang hiển thị đầy đủ cả 4 khối tứ diện trong ô cơ sở.');
    }
  }
};

LD.miller = {
  intro: [
    ['i', 'Chỉ số Miller (hkl) xác định họ mặt phẳng tinh thể: tìm giao điểm với 3 trục (x, y, z), lấy nghịch đảo rồi quy đồng về bộ số nguyên tối giản.'],
    ['w', 'Hướng tinh thể [hkl] là vector xuất phát từ gốc O. Đặc biệt trong hệ lập phương, hướng [hkl] LUÔN vuông góc với mặt phẳng (hkl).'],
    ['w', 'Mặt cắt tinh thể quyết định trực tiếp tốc độ oxy hóa và mật độ trạng thái bề mặt của transistor (wafer Si công nghiệp chủ yếu cắt theo mặt (100) hoặc (111)).'],
    ['v', 'Bấm nhanh các nút (100), (110), (111) hoặc chỉnh h, k, l và xoay khối 3D để quan sát mật độ nút trên từng mặt phẳng!']
  ],
  react(S, k, P, say) {
    const h = Math.round(S.h), kk = Math.round(S.k), l = Math.round(S.l);
    if (h === 0 && kk === 0 && l === 0) {
      say('w', 'Bộ chỉ số (000) không xác định được mặt phẳng — hãy chọn ít nhất một chỉ số khác 0.');
      return;
    }
    const ix = h ? '1/' + h : '∞', iy = kk ? '1/' + kk : '∞', iz = l ? '1/' + l : '∞';
    say('v', `Mặt phẳng (${h}${kk}${l}): Cắt các trục (x, y, z) tại (${ix}, ${iy}, ${iz}) · Pháp tuyến là hướng [${h}${kk}${l}].`);
    if (h === 1 && kk === 0 && l === 0) say('w', 'Mặt (100) là mặt chuẩn để chế tạo MOSFET Silicon vì có mật độ liên kết đứt bề mặt thấp nhất.');
    else if (h === 1 && kk === 1 && l === 1) say('w', 'Mặt (111) có mật độ nguyên tử dày đặc nhất trong mạng FCC (cắt 3 trục tại 1, 1, 1 tạo tam giác đều).');
  }
};

LD.defect = {
  intro: [
    ['i', 'Tinh thể thực tế luôn có các khuyết tật điểm (Point defects) làm phá vỡ tính tuần hoàn cục bộ của mạng nguyên tử.'],
    ['w', 'Nút trống (Vacancy) và nguyên tử xen kẽ (Interstitial) tạo ứng suất đàn hồi kéo hoặc đẩy các nguyên tử Si xung quanh.'],
    ['w', 'Pha tạp thế chỗ (Substitutional doping) là khuyết tật CHỦ ĐỘNG: thay Si (4e⁻) bằng P (5e⁻) tạo Donor loại N; thay bằng B (3e⁻) tạo Acceptor loại P.'],
    ['v', 'Chọn từng loại khuyết tật bên dưới để quan sát biến dạng mạng tinh thể và sự xuất hiện của hạt tải tự do!']
  ],
  react(S, k, P, say) {
    const msgs = {
      perfect: ['i', 'Mạng Silicon hoàn hảo: Không có ứng suất cơ học, mọi liên kết đều đủ 2 electron.'],
      vacancy: ['w', 'Nút trống (Vacancy): Một nguyên tử Si rời khỏi nút mạng, các nguyên tử lân cận hơi dịch vào phía chỗ trống.'],
      inter: ['w', 'Xen kẽ (Interstitial): Một nguyên tử bị ép vào khe giữa các nút mạng, đẩy mạnh 4 nguyên tử lân cận ra xa.'],
      donor: ['v', 'Pha tạp Donor P (Nhóm V): 4 electron của P nối đủ với 4 Si hàng xóm; electron thứ 5 tự do chuyển động trong tinh thể (Loại N).'],
      acceptor: ['v', 'Pha tạp Acceptor B (Nhóm III): Thiếu 1 electron ở liên kết thứ 4 → tạo lỗ trống (+) sẵn sàng nhận electron từ liên kết kề (Loại P).']
    };
    const m = msgs[S.kind];
    if (m) say(m[0], m[1]);
  }
};

LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (Tự chèn CSS + HTML popup, tách biệt hoàn toàn #lab1 / .lb1-*)
   ========================================================================== */
const CSS = `
#lab1{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab1[hidden]{display:none}
#lab1 *{box-sizing:border-box}
.lb1-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
.lb1-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
.lb1-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
.lb1-ic{color:var(--main);display:flex}
.lb1-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
.lb1-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
.lb1-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
.lb1-tab:hover{color:var(--ink);background:var(--tint)}
.lb1-tab.on{background:var(--main);color:var(--bg);font-weight:700}
.lb1-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
.lb1-x:hover{color:var(--err);background:var(--tint)}
.lb1-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
.lb1-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
.lb1-p.glow{animation:lb1glow 1.4s ease-out}
@keyframes lb1glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
.lb1-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
.lb1-cv{flex:1;min-height:0;position:relative}
.lb1-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.lb1-c{display:flex;flex-wrap:wrap;gap:6px 12px;padding:5px 10px 8px;flex:none;align-items:center}
.lb1-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb1-k input[type=range]{width:clamp(68px,7.5vw,112px);margin:0;accent-color:var(--main)}
.lb1-k output{color:var(--ink);font-weight:700;min-width:2.4em}
.lb1-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb1-seg button,.lb1-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer;transition:color .15s,background .15s}
.lb1-btn{background:var(--tint);color:var(--ink)}
.lb1-seg button:hover,.lb1-btn:hover{color:var(--ink);background:var(--g)}
.lb1-seg button.on{background:var(--main);color:var(--bg)}
.lb1-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
.lb1-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb1in .4s ease-out;overflow-wrap:anywhere}
.lb1-ln::before{position:absolute;left:0;font-weight:700}
.lb1-ln.i{color:var(--ink)}.lb1-ln.i::before{content:'›';color:var(--c5)}
.lb1-ln.w{color:var(--ink)}.lb1-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
.lb1-ln.v{color:var(--main)}.lb1-ln.v::before{content:'=';color:var(--main)}
@keyframes lb1in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab1-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab1-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab1-m:hover,.lab1-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb1-win{width:100vw;height:100dvh;border-radius:0}.lb1-b{overflow:auto;display:flex;flex-direction:column}.lb1-p{min-height:280px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.2 6.2V2"/><path d="M4.6 10h6.8"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'solid';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab1'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 1');
  root.innerHTML = '<div class="lb1-win"><div class="lb1-h"><span class="lb1-ic">' + FLASK + '</span><span class="lb1-bd">Phòng thí nghiệm · Buổi 1</span><nav class="lb1-tabs"></nav><button class="lb1-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb1-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb1-b'); tabsEl = root.querySelector('.lb1-tabs');
  LABS.forEach(l => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lb1-tab'; b.dataset.id = l.id;
    b.textContent = l.no + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b);
  });
  root.querySelector('.lb1-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) {
      const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty &&
          window.LabB1 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden &&
          (document.getElementById('tb-badge') || {}).textContent === 'Buổi 1') {
        e.preventDefault(); open();
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
}

const say = (kind, text) => {
  if (!logEl) return;
  const d = document.createElement('div'); d.className = 'lb1-ln ' + kind; d.textContent = text;
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
    w.className = 'lb1-btn'; w.textContent = c.btn; w.setAttribute('role', 'button'); w.tabIndex = 0;
    w.onclick = () => c.fn(p); return w;
  }
  if (c.seg) {
    w.className = 'lb1-seg';
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
  w.className = 'lb1-k';
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
    const el = document.createElement('div'); el.className = 'lb1-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb1-t"></div><div class="lb1-cv"><canvas></canvas></div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) {
      const lg = document.createElement('div'); lg.className = 'lb1-log'; lg.setAttribute('aria-live', 'polite');
      el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el);
      curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 220 + j * 850)));
      return;
    }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb1-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.ctrls && spec.ctrls.length) {
      const cb = document.createElement('div'); cb.className = 'lb1-c';
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
    catch (err) { console.error('LabB1 render error:', err); }
    ctx.restore();
  });
  raf = requestAnimationFrame(loop);
}

function open(id, panelIdx) {
  ensureDom(); readColors(); opener = document.activeElement;
  root.hidden = false; show(id || lastTab, panelIdx);
  last = performance.now(); if (!raf) raf = requestAnimationFrame(loop);
  root.querySelector('.lb1-x').focus({ preventScroll: true });
  const b = document.getElementById('tb-lab'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
}
function close() {
  if (!root || root.hidden) return;
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  const b = document.getElementById('tb-lab'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- Dấu hiệu bình thí nghiệm trong bài học Buổi 1 ---------- */
const H3MAP = [
  [/^1\.1/, 'solid', 0], [/^1\.2/, 'solid', 0],
  [/^2\.1/, 'cubic', 0], [/^2\.2/, 'cubic', 0], [/^2\.3/, 'cubic', 0],
  [/^3\.1/, 'diamond', 0], [/^3\.2/, 'diamond', 0],
  [/^4\.1/, 'miller', 0], [/^4\.2/, 'miller', 0],
  [/^5\.1/, 'defect', 0], [/^5\.2/, 'defect', 0]
];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab1-m')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab1-m'; b.innerHTML = FLASK;
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

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 1') {
  markLesson(document.getElementById('app-content'));
}

window.LabB1 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
