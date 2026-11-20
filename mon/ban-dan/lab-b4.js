/* ==========================================================================
   lab-b4.js — PHÒNG THÍ NGHIỆM BUỔI 4 (popup 95% màn hình)
   - Tự chứa, cùng khung với lab-b7.js. 8 tab ứng với các mục của Buổi 4.
   - API: LabB4.open(tabId?, panelIndex?)  LabB4.close()  LabB4.mark(root)
   ========================================================================== */
(function () {
'use strict';

/* ---------- tiện ích ---------- */
const TAU2 = Math.PI * 2, Q = 1.602e-19, KB = 8.617e-5;
const rnd = (a, b) => a + Math.random() * (b - a);
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU2 * v); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => SUP[d]).join('');
const p10 = n => '10' + sup(n);
const sci = (x, d = 1) => { if (!x) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); return (x / Math.pow(10, e)).toFixed(d) + '×10' + sup(e); };
const lin = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
const FONT = '"Be Vietnam Pro",system-ui,sans-serif';
const C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ['bg', 'card', 'ink', 'mut', 'sub', 'main', 'err', 'c1', 'c2', 'c3', 'c4', 'c5', 'g', 'tint'].forEach(k => C[k] = cs.getPropertyValue('--' + k).trim() || '#888');
}

/* ---------- vẽ ---------- */
function txt(ctx, s, x, y, col, size, al, wt) {
  ctx.font = (wt || 500) + ' ' + (size || 12) + 'px ' + FONT; ctx.fillStyle = col || C.ink;
  ctx.textAlign = al || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}
function ln(ctx, x1, y1, x2, y2, col, w, dash) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = col; ctx.lineWidth = w || 1; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
}
function arr(ctx, x1, y1, x2, y2, col, w) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 4 + (w || 2) * 1.6;
  ln(ctx, x1, y1, x2, y2, col, w || 2);
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - h * Math.cos(a - .45), y2 - h * Math.sin(a - .45));
  ctx.lineTo(x2 - h * Math.cos(a + .45), y2 - h * Math.sin(a + .45)); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
function dot(ctx, x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU2); ctx.fillStyle = col; ctx.fill(); }
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
/* ---------- vật lý dùng chung ---------- */
const MU = { n: { mn: 92, mx: 1350, N0: 1.3e17, a: 0.91 }, p: { mn: 49, mx: 480, N0: 6.3e16, a: 0.76 } };
const ct = (N, t) => { const m = MU[t]; return m.mn + (m.mx - m.mn) / (1 + Math.pow(N / m.N0, m.a)); };
const muL = T => 1400 * Math.pow(T / 300, -1.5);
const muI = (T, N) => 1.7e20 * Math.pow(T / 300, 1.5) / N;
const muT = (T, N) => 1 / (1 / muL(T) + 1 / muI(T, N));
const VT = T => KB * T;
const rho = (N, t) => 1 / (Q * N * ct(N, t));
const vdE = (E, mu0, vs, n) => mu0 * E / Math.pow(1 + Math.pow(mu0 * E / vs, n), 1 / n);
const fmtR = r => r >= 1e6 ? (r / 1e6).toPrecision(3) + ' MΩ' : r >= 1e3 ? (r / 1e3).toPrecision(3) + ' kΩ' : r.toPrecision(3) + ' Ω';

const LABS = [];
/* ---------- tiện ích SVG: lấy hình gốc từ chính bài học đang mở rồi điều khiển trực tiếp ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, at, par) => { const e = document.createElementNS(SVGNS, tag); Object.keys(at || {}).forEach(k => e.setAttribute(k, at[k])); if (par) par.appendChild(e); return e; };
const figOf = key => [...document.querySelectorAll('#app-content svg')].find(s => s.textContent.includes(key));
function cloneFig(box, key) {
  const src = figOf(key);
  if (!src) { box.innerHTML = '<div style="padding:16px;color:var(--mut);font:13px var(--font-ui)">Mở bài Buổi 4 để xem hình minh họa.</div>'; return null; }
  const s = src.cloneNode(true); s.removeAttribute('role'); s.removeAttribute('id');
  s.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;display:block;margin:0;background:none;border:0;border-radius:0;max-height:none');
  box.appendChild(s); return s;
}
function hostLoop(box, fn) {
  let last = performance.now(), t = 0;
  const f = ts => { if (!box.isConnected || root.hidden) return; const dt = clamp((ts - last) / 1000, 0, .04); last = ts; t += dt; fn(t, dt); requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function yOnPath(path, x) {                 // đọc tung độ của một đường cong trong SVG tại hoành độ x
  let lo = 0, hi = path.getTotalLength(); for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; path.getPointAtLength(m).x < x ? lo = m : hi = m; } return path.getPointAtLength((lo + hi) / 2).y;
}
function interp(xs, ys, x) { if (x <= xs[0]) return ys[0]; for (let i = 1; i < xs.length; i++) if (x <= xs[i]) { const u = (x - xs[i - 1]) / (xs[i] - xs[i - 1] || 1); return ys[i - 1] + u * (ys[i] - ys[i - 1]); } return ys[ys.length - 1]; }
const T = (par, x, y, sz, col, wt, anchor) => sv('text', { x, y, 'text-anchor': anchor || 'middle', style: `fill:${col};font:${wt} ${sz}px "Be Vietnam Pro",sans-serif` }, par);
const lg = v => Math.log10(Math.max(v, 1e-30));


const ease = x => x * x * (3 - 2 * x);
const flip = (a, b, v) => v === a ? b : a;

/* ==========================================================================
   TAB 1 — CHUỖI 8 NGUYÊN TỬ: mỗi trạng thái dao động theo tần số riêng (Mục 1.1)
   Animation chạy thẳng trên các vòng tròn của SVG: bán kính ∝ |ψ|·|cos ωt|, đổi màu khi ψ đổi dấu
   ========================================================================== */
LABS.push({
  id: 'chain', name: 'Chuỗi 8 nguyên tử', no: '1', secs: [1],
  S: { sel: 0, sp: 1, play: true },
  cols: '1.6fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [
    { title: 'Mỗi hàng là một trạng thái của chuỗi: tất cả cùng dao động, hàng cao dao động nhanh hơn', area: 'a', host: true,
      ctrls: [{ k: 'sel', l: 'Chọn hàng', min: 0, max: 8, step: 1, f: v => v ? 'n = ' + (v - 1) : 'tất cả' }, { k: 'sp', l: 'Tốc độ', min: .2, max: 3, step: .1, f: v => v.toFixed(1) + '×' }, { btn: 'Phát / dừng', fn: p => { p.S.play = !p.S.play; queueReact(p.tab, 'play'); } }],
      mount(p, box) {
        const svg = cloneFig(box, 'Chuỗi 8 nguyên tử'); if (!svg) return;
        { const vb = svg.getAttribute('viewBox').split(' ').map(Number); svg.setAttribute('viewBox', `0 0 410 ${vb[3]}`); [...svg.children].forEach(e => { if (e.tagName === 'defs') return; const xs = ['cx', 'x', 'x1', 'x2'].map(a => e.getAttribute(a)).filter(v => v != null).map(Number); if (xs.length && Math.max(...xs) > 372) e.remove(); }); }
        const cs = [...svg.querySelectorAll(':scope > circle')].filter(c => +c.getAttribute('cx') < 340 && +c.getAttribute('cy') > 100 && +c.getAttribute('cy') < 262), rows = {};
        cs.forEach(c => { const k = (+c.getAttribute('cy')).toFixed(1); (rows[k] = rows[k] || []).push(c); });
        const keys = Object.keys(rows).sort((a, b) => b - a), fills = [...new Set(cs.map(c => c.getAttribute('fill')))];
        const R = keys.map((k, n) => rows[k].sort((a, b) => a.getAttribute('cx') - b.getAttribute('cx')).map(c => ({ c, r0: +c.getAttribute('r'), f0: c.getAttribute('fill') })));
        const texts = [...svg.querySelectorAll(':scope > text')].filter(t => +t.getAttribute('x') === 350);
        let tm = 0;
        hostLoop(box, (t, dt) => {
          const S = p.S; if (S.play) tm += dt * S.sp;
          R.forEach((row, n) => { const w = .8 + 3.6 * (1 - Math.cos(Math.PI * (n + 1) / 9)), cs_ = Math.cos(w * tm), on = !S.sel || S.sel - 1 === n;
            row.forEach(o => { const a = Math.abs(cs_), neg = cs_ < 0; o.c.setAttribute('r', (.8 + (o.r0 - .8) * a).toFixed(2)); o.c.setAttribute('fill', neg ? flip(o.f0, fills.find(f => f !== o.f0) || o.f0, o.f0) : o.f0); o.c.style.opacity = on ? 1 : .15; }); });
          texts.forEach((tx, n) => tx.style.opacity = (!p.S.sel || p.S.sel - 1 === n) ? 1 : .25);
        });
      } }
  ]
});

/* ==========================================================================
   TAB 2 — MẠNG Si THẬT: electron thoát khỏi liên kết, lỗ trống đi bằng cách láng giềng nhảy vào (Mục 2.3)
   Animation chạy thẳng trên các vòng tròn liên kết của hình ② và ③
   ========================================================================== */
LABS.push({
  id: 'si', name: 'Mạng Si: lỗ trống dịch chuyển', no: '2', secs: [],
  S: { sp: 1, play: true },
  cols: '1.7fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [
    { title: 'Electron bứt khỏi liên kết (②); láng giềng nhảy vào chỗ trống nên lỗ trống chạy (③)', area: 'a', host: true,
      ctrls: [{ k: 'sp', l: 'Tốc độ', min: .2, max: 3, step: .1, f: v => v.toFixed(1) + '×' }, { btn: 'Phát / dừng', fn: p => { p.S.play = !p.S.play; queueReact(p.tab, 'play'); } }],
      mount(p, box) {
        const svg = cloneFig(box, 'Nhìn vào mạng Si thật'); if (!svg) return;
        { const vb = svg.getAttribute('viewBox').split(' ').map(Number); svg.setAttribute('viewBox', `0 0 ${vb[2]} ${vb[3] + 24}`); }
        const all = [...svg.querySelectorAll(':scope > circle')], at = (cx, cy, r) => all.find(c => Math.abs(+c.getAttribute('cx') - cx) < .06 && Math.abs(+c.getAttribute('cy') - cy) < .06 && Math.abs(+c.getAttribute('r') - r) < .05);
        const pair = (x, y) => ({ h: at(x, y, 8.16), c: at(x, y, 3.4) }), setP = (o, x, y) => { [o.h, o.c].forEach(e => { e.setAttribute('cx', x); e.setAttribute('cy', y); }); };
        // hình ③: đường đi của lỗ trống qua các khe liên kết
        const SL = [[491.3, 98], [476.7, 98], [462, 112.7], [462, 127.3], [476.7, 142]], E = [null, ...SL.slice(1).map(s => pair(s[0], s[1]))];
        const ring3 = at(491.3, 98, 13.2), core3 = at(491.3, 98, 5.5), arrow3 = svg.querySelector(':scope > path[marker-end="url(#fb)"]');
        const VX = [558, 537, 516, 495, 474], vbE = [null, ...VX.slice(1).map(x => at(x, 255.5, 4.5))], vbR = at(558, 255.5, 10.8), vbC = [...all].filter(c => Math.abs(+c.getAttribute('cx') - 558) < .1 && Math.abs(+c.getAttribute('cy') - 255.5) < .1 && c.getAttribute('r') === '4.5')[0];
        const g3 = (k, d) => SL[k][d];
        // hình ②: electron tự do rời chỗ trống theo đường cong
        const ring2 = at(313, 98, 13.2), core2 = at(313, 98, 5.5), fe2 = at(399, 40, 13.2), fc2 = at(399, 40, 5.5), path2 = [...svg.querySelectorAll(':scope > path')].find(q => (q.getAttribute('d') || '').startsWith('M313.0 92'));
        const fe3 = at(612, 68, 13.2), fc3 = at(612, 68, 5.5), L2 = path2 ? path2.getTotalLength() : 0;
        const lab = T(svg, 320, 286, 11, 'var(--main)', 800); let tm = 0;
        hostLoop(box, (t, dt) => {
          const S = p.S; if (S.play) tm += dt * S.sp;
          // ③: h chạy 0→4→0 (tam giác), mỗi bước nghỉ một chút
          const cyc = tm / 1.1 % 8, tri = cyc < 4 ? cyc : 8 - cyc, h = Math.floor(tri) + ease(tri - Math.floor(tri));
          for (let k = 1; k <= 4; k++) { const u = ease(clamp(h - (k - 1), 0, 1)), a = SL[k], b = SL[k - 1]; setP(E[k], a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u); const v = vbE[k]; v.setAttribute('cx', VX[k] + (VX[k - 1] - VX[k]) * u); }
          const hi = clamp(Math.floor(h), 0, 4), f = clamp(h - hi, 0, 1), a = SL[hi], b = SL[Math.min(4, hi + 1)], hx = a[0] + (b[0] - a[0]) * f, hy = a[1] + (b[1] - a[1]) * f;
          [ring3, core3].forEach(e => { e.setAttribute('cx', hx); e.setAttribute('cy', hy); }); const vx = VX[hi] + (VX[Math.min(4, hi + 1)] - VX[hi]) * f; [vbR, vbC].forEach(e => e && e.setAttribute('cx', vx));
          if (arrow3) arrow3.style.opacity = 0; lab.textContent = 'lỗ trống đang ở khe số ' + (Math.round(h) + 1) + ' · electron nhảy ' + (cyc < 4 ? 'sang phải' : 'sang trái');
          // ②: electron rời liên kết
          const u2 = clamp((tm % 4.5) / 2.6, 0, 1), pt = path2 ? path2.getPointAtLength(L2 * ease(u2)) : { x: 399, y: 40 }; [fe2, fc2].forEach(e => { e.setAttribute('cx', pt.x); e.setAttribute('cy', pt.y); }); ring2.setAttribute('r', 13.2 + 2.4 * Math.sin(tm * 5)); if (core2) core2.style.opacity = 1;
          [fe3, fc3].forEach(e => e.setAttribute('cy', 68 + 4 * Math.sin(tm * 3)));
        });
      } }
  ]
});

/* ==========================================================================
   TAB 3 — KIM LOẠI / CÁCH ĐIỆN / BÁN DẪN: electron nhảy giữa các "ghế" (Mục 2.5)
   Mô phỏng chạy trên chính các vòng tròn của SVG: ghế trống, electron, nhiệt độ, điện trường
   ========================================================================== */
LABS.push({
  id: 'fill', name: 'Kim loại – cách điện – bán dẫn', no: '2', secs: [],
  S: { E: .5, T: 600 },
  cols: '1.8fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [
    { title: 'Electron chỉ nhích được khi có ghế trống ngay bên cạnh', area: 'a', host: true,
      ctrls: [{ k: 'E', l: 'Điện trường', min: 0, max: 1, step: .05, f: v => v ? v.toFixed(2) : 'tắt' }, { k: 'T', l: 'T (bán dẫn phải)', min: 0, max: 1200, step: 20, f: v => v + ' K' }],
      mount(p, box) {
        const svg = cloneFig(box, 'Bán dẫn / điện môi, 0 K'); if (!svg) return; svg.setAttribute('viewBox', '0 0 660 280');
        const all = [...svg.querySelectorAll(':scope > circle')], seats0 = all.filter(c => c.getAttribute('r') === '6'), halos = all.filter(c => c.getAttribute('r') === '13.44'), cores = all.filter(c => c.getAttribute('r') === '5.6');
        const proto = seats0[0], g = sv('g', {}, svg);
        const defs = [{ x0: 40, w: 140, bands: [[36, 146]], dyn: false, sx: 110 }, { x0: 255, w: 140, bands: [[36, 95], [144, 203]], T0: 0, sx: 325 }, { x0: 470, w: 140, bands: [[36, 95], [144, 203]], useT: true, sx: 540 }];
        const P = defs.map(d => {
          const bands = d.bands.map(([y0, y1]) => { const inB = c => +c.getAttribute('cx') > d.x0 && +c.getAttribute('cx') < d.x0 + d.w && +c.getAttribute('cy') > y0 && +c.getAttribute('cy') < y1;
            const el = halos.filter(inB).map(h => ({ h, c: cores.find(c => c.getAttribute('cx') === h.getAttribute('cx') && c.getAttribute('cy') === h.getAttribute('cy')) })), sd = seats0.filter(inB);
            const xs = [...new Set([...el.map(e => +e.h.getAttribute('cx')), ...sd.map(s => +s.getAttribute('cx'))].map(v => Math.round(v * 2) / 2))].sort((a, b) => a - b), ys = [...new Set([...el.map(e => +e.h.getAttribute('cy')), ...sd.map(s => +s.getAttribute('cy'))].map(v => Math.round(v * 2) / 2))].sort((a, b) => a - b);
            const cell = Array.from({ length: ys.length }, () => Array(xs.length).fill(null)), seat = Array.from({ length: ys.length }, () => Array(xs.length).fill(null));
            const idx = (arr, v) => arr.findIndex(a => Math.abs(a - v) < .6);
            el.forEach(e => { const r = idx(ys, +e.h.getAttribute('cy')), c = idx(xs, +e.h.getAttribute('cx')); if (r >= 0 && c >= 0) { e.ri = r; e.ci = c; e.px = xs[c]; e.py = ys[r]; cell[r][c] = e; } });
            for (let r = 0; r < ys.length; r++) for (let c = 0; c < xs.length; c++) { const s = proto.cloneNode(false); s.setAttribute('cx', xs[c]); s.setAttribute('cy', ys[r]); g.appendChild(s); seat[r][c] = s; }
            sd.forEach(s => s.remove()); el.forEach(e => { e.h.parentNode.appendChild(e.h); e.c && e.h.parentNode.appendChild(e.c); });
            return { xs, ys, cell, seat, el, y0, y1 }; });
          return Object.assign({}, d, { bands, drift: 0, win: [] });
        });
        const txts = P.map(d => T(svg, d.sx, 270, 11, 'var(--main)', 800)), bandsAll = P.flatMap(d => d.bands.map(b => b));
        const move = (b, e, r, c, speedy) => { b.cell[e.ri][e.ci] = null; e.ri = r; e.ci = c; b.cell[r][c] = e; e.px = b.xs[c]; e.py = b.ys[r]; };
        let acc = 0;
        const tick = () => {
          const S = p.S;
          P.forEach((d, pi) => {
            d.bands.forEach(b => { for (let n = 0; n < 6; n++) { const e = b.el[Math.floor(Math.random() * b.el.length)]; if (!e || e.ri == null) continue; const bias = S.E * 2.5, w = [1 + bias, Math.max(.05, 1 - bias * .45), 1, 1], s = w[0] + w[1] + w[2] + w[3]; let u = Math.random() * s, dir = 0; while (u > w[dir] && dir < 3) { u -= w[dir]; dir++; }
              const dr = [0, 0, -1, 1][dir], dc = [1, -1, 0, 0][dir], r = e.ri + dr, c = e.ci + dc; if (r < 0 || r >= b.ys.length || c < 0 || c >= b.xs.length || b.cell[r][c]) continue; move(b, e, r, c); if (dc) d.drift += dc; } });
            if (pi > 0) { const T = pi === 1 ? 0 : S.T, vb = d.bands[1], cb = d.bands[0];
              if (T > 0 && Math.random() < 3 * Math.exp(-.45 / (2 * 8.617e-5 * T))) { const top = vb.el.filter(e => e.ri === 0); const em = cb.cell.flat().map((v, i) => v ? -1 : i).filter(i => i >= 0); if (top.length && em.length) { const e = top[Math.floor(Math.random() * top.length)], k = em[Math.floor(Math.random() * em.length)], rr = Math.floor(k / cb.xs.length), cc = k % cb.xs.length; vb.cell[e.ri][e.ci] = null; vb.el.splice(vb.el.indexOf(e), 1); cb.el.push(e); e.ri = rr; e.ci = cc; cb.cell[rr][cc] = e; e.px = cb.xs[cc]; e.py = cb.ys[rr]; } }
              if (cb.el.length) for (let n = 0; n < cb.el.length; n++) if (Math.random() < .035 * Math.min(1, (cb.el.length / 3))) { const e = cb.el[n], em = vb.cell.flat().map((v, i) => v ? -1 : i).filter(i => i >= 0); if (em.length) { const k = em[Math.floor(Math.random() * em.length)], rr = Math.floor(k / vb.xs.length), cc = k % vb.xs.length; cb.cell[e.ri][e.ci] = null; cb.el.splice(n, 1); vb.el.push(e); e.ri = rr; e.ci = cc; vb.cell[rr][cc] = e; e.px = vb.xs[cc]; e.py = vb.ys[rr]; break; } } }
          });
        };
        hostLoop(box, (t, dt) => {
          acc += dt; while (acc > .09) { acc -= .09; tick(); }
          P.forEach((d, i) => { d.bands.forEach(b => { b.el.forEach(e => { const cx = +e.h.getAttribute('cx') || e.px, cy = +e.h.getAttribute('cy') || e.py, nx = cx + (e.px - cx) * .3, ny = cy + (e.py - cy) * .3; [e.h, e.c].forEach(q => { if (q) { q.setAttribute('cx', nx); q.setAttribute('cy', ny); } }); });
            b.seat.forEach((row, r) => row.forEach((s, c) => s.style.opacity = b.cell[r][c] ? 0 : 1)); });
            d.win.push(d.drift); d.drift = 0; if (d.win.length > 25) d.win.shift(); const flow = d.win.reduce((a, b) => a + b, 0);
            txts[i].textContent = i === 0 ? 'dòng chạy: ' + (flow > 0 ? '→ ' + flow : flow < 0 ? '← ' + -flow : '0') : 'e⁻ ở dải dẫn: ' + d.bands[0].el.length + ' · dòng ' + (flow > 0 ? '→ ' + flow : flow < 0 ? '← ' + -flow : '0'); });
        });
      } }
  ]
});

/* ==========================================================================
   TAB 4 — MÔ HÌNH CÓ SẴN HOẠT HÌNH: lỗ trống, gói sóng Bloch, 14 electron trôi (Mục 2.2–2.3)
   Điều khiển đồng hồ SMIL của chính các hình gốc (tua, dừng, đổi tốc độ)
   ========================================================================== */
const SMIL = [{ id: 'hole', key: 'Chuỗi 48 nguyên tử', dur: 12, n: 'Lỗ trống trên chuỗi 48 nguyên tử' }, { id: 'pack', key: 'Gói sóng electron dưới', dur: 9, n: 'Gói sóng dao động Bloch' }, { id: 'walk', key: '14 electron mẫu', dur: 9, n: '14 electron trôi trong điện trường' }];
LABS.push({
  id: 'smil', name: 'Gói sóng & chuỗi lỗ trống', no: '2', secs: [],
  S: { fig: 'hole', t: 0, sp: 1, play: true },
  cols: '1.6fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [
    { title: 'Ba mô hình có sẵn hoạt hình: tua, dừng, đổi tốc độ', area: 'a', host: true,
      ctrls: [{ k: 'fig', seg: [['hole', 'Lỗ trống'], ['pack', 'Gói sóng Bloch'], ['walk', '14 electron']] }, { k: 't', l: 'Thời gian', min: 0, max: 12, step: .05, f: v => v.toFixed(1) + ' s' }, { k: 'sp', l: 'Tốc độ', min: .2, max: 3, step: .1, f: v => v.toFixed(1) + '×' }, { btn: 'Phát / dừng', fn: p => { p.S.play = !p.S.play; queueReact(p.tab, 'play'); } }],
      mount(p, box) {
        const figs = SMIL.map(s => { const wrap = document.createElement('div'); wrap.style.cssText = 'position:absolute;inset:0'; box.appendChild(wrap); return { s, svg: cloneFig(wrap, s.key), wrap }; });
        hostLoop(box, (t, dt) => {
          const S = p.S, cur = figs.find(f => f.s.id === S.fig) || figs[0]; figs.forEach(f => f.wrap.style.display = f === cur ? '' : 'none');
          if (S.play) { S.t += dt * S.sp; if (S.t > cur.s.dur) S.t -= cur.s.dur; p.syncCtrls(); } S.t = Math.min(S.t, cur.s.dur);
          try { if (cur.svg) { cur.svg.pauseAnimations(); cur.svg.setCurrentTime(S.t); } } catch (e) {}
        });
      } }
  ]
});

/* ==========================================================================
   NHẬT KÝ GIẢI THÍCH. Loại dòng: i = nguyên lý · w = cơ chế · v = số liệu
   ========================================================================== */
const LD = {};
LD.chain = {
  intro: [
    ['i', 'Chuỗi N nguyên tử giống nhau có đúng N trạng thái, là các sóng đứng: trạng thái thứ n có n nút.'],
    ['w', 'Hình đang cho thấy hiệu ứng thời gian của từng trạng thái: vòng cam và xanh đổi dấu liên tục, biên độ lên xuống như cos(ωt). Hàng càng cao (nhiều nút hơn) năng lượng càng lớn nên dao động càng nhanh.'],
    ['v', 'Chọn một hàng để đứng riêng nó: đếm nút trên hàng, rồi so tốc độ giữa hàng dưới cùng và hàng trên cùng.']
  ],
  react(S, k, P, say) {
    if (k === 'sel') say('w', S.sel ? `Hàng n = ${S.sel - 1}: ${S.sel - 1} nút, các nút là chỗ vòng luôn rất nhỏ.` : 'Xem cả 8 trạng thái cùng lúc.');
    else if (k === 'play') say('w', S.play ? 'Hoạt hình chạy.' : 'Đã dừng ở một khoảnh khắc.');
    else say('v', `Tốc độ ${S.sp.toFixed(1)}×: tần số các hàng giữ nguyên tỉ lệ với nhau.`);
  }
};
LD.si = {
  intro: [
    ['i', 'Mỗi liên kết Si–Si giữ 2 electron. Khi một electron thoát đi (hình ②), nó để lại một liên kết thiếu: lỗ trống.'],
    ['w', 'Ở hình ③ electron láng giềng nhảy vào chỗ thiếu, và chỗ thiếu dịch về nơi nó vừa rời. Mỗi bước hop, hạt thật sự chuyển động là electron, nhưng chỗ trống đi ngược lại như một hạt dương.'],
    ['w', 'Hàng VB dưới cùng làm cùng việc trong ngôn ngữ dải năng lượng: vòng hồng là ghế trống đang chạy qua các electron xanh.'],
    ['v', 'Xem hình ②: electron bứt ra theo đường cong, còn vòng ở chỗ cũ nhịp nhịp.']
  ],
  react(S, k, P, say) { say('w', k === 'play' ? (S.play ? 'Chạy tiếp.' : 'Đã dừng.') : `Tốc độ ${S.sp.toFixed(1)}×.`); }
};
LD.fill = {
  intro: [
    ['i', 'Electron chỉ đổi trạng thái được khi có trạng thái trống đúng sát bên. Đây là cả câu chuyện kim loại, cách điện và bán dẫn.'],
    ['w', 'Kim loại: dải đầy một nửa nên luôn có ghế trống kề bên. Bật điện trường thì electron nghiêng về một phía, hiện ở "dòng chạy".'],
    ['w', 'Cách điện / bán dẫn ở 0 K: dải hóa trị đầy kín, bật điện trường vẫn chẳng ai nhích được. Bán dẫn ở T > 0: electron bị nhiệt đẩy lên dải dẫn rồi lại rơi về, và để lại lỗ trống trong dải hóa trị.'],
    ['v', 'Kéo T (bán dẫn bên phải) lên, bật điện trường, rồi so ba ô.']
  ],
  react(S, k, P, say) {
    if (k === 'E') say('w', S.E ? 'Điện trường bật: electron hop thiên về bên phải.' : 'Điện trường tắt: hop ngẫu nhiên, không có dòng nào.');
    else say('v', `T = ${S.T} K: ${S.T < 200 ? 'gần như không electron nào lên nổi dải dẫn.' : S.T < 700 ? 'vài electron lên dải dẫn, mỗi cái để lại một lỗ trống.' : 'nhiều electron lên dải dẫn, bán dẫn dẫn điện khá hơn.'}`);
  }
};
LD.smil = {
  intro: [
    ['i', 'Ba hình mô hình sẵn có hoạt hình, nay có thể tua tay: lỗ trống đi cùng chiều điện trường trên chuỗi, gói sóng electron dao động Bloch, và 14 electron trôi trong điện trường.'],
    ['w', 'Gói sóng: electron không chạy mãi theo F, mà đi tới biên vùng Brillouin rồi bị phản xạ nên đảo chiều: đó là dao động Bloch.'],
    ['w', '14 electron: bị tán xạ liên tục nhưng tổng thể vẫn trôi theo hướng lực, đường nét đứt là vận tốc trôi.'],
    ['v', 'Chọn từng mô hình, kéo thanh Thời gian để dừng ở khoảnh khắc em muốn quan sát.']
  ],
  react(S, k, P, say) { if (k === 'fig') say('w', SMIL.find(s => s.id === S.fig).n + '.'); else say('w', k === 'play' ? (S.play ? 'Chạy tiếp.' : 'Đã dừng.') : 'Đang tua.'); }
};
LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP
   ========================================================================== */
const CSS = `
#lab4{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab4[hidden]{display:none}
#lab4 *{box-sizing:border-box}
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
.lb-c{display:flex;flex-wrap:wrap;gap:6px 14px;padding:4px 10px 8px;flex:none;align-items:center}
.lb-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb-k input[type=range]{width:clamp(70px,8vw,120px);margin:0}
.lb-k output{color:var(--ink);font-weight:700;min-width:3.2em}
.lb-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb-seg button,.lb-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer}
.lb-btn{background:var(--tint)}
.lb-seg button:hover,.lb-btn:hover{color:var(--ink)}
.lb-seg button.on{background:var(--main);color:var(--bg)}
.lb-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
.lb-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lbin .4s ease-out;overflow-wrap:anywhere}
.lb-ln::before{position:absolute;left:0;font-weight:700}
.lb-ln.i{color:var(--ink)}.lb-ln.i::before{content:'›';color:var(--c5)}
.lb-ln.w{color:var(--ink)}.lb-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
.lb-ln.v{color:var(--main)}.lb-ln.v::before{content:'=';color:var(--main)}
@keyframes lbin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lb-hall{display:flex;flex-direction:column;background:var(--bg)}
.lb-hall canvas{position:static!important;flex:1;min-height:0;width:100%;height:100%;object-fit:contain}
.lab-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab-m:hover,.lab-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb-win{width:100vw;height:100dvh;border-radius:0}.lb-b{overflow:auto;display:flex;flex-direction:column}.lb-p{min-height:260px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.200 6.200V2"/><path d="M4.600 10h6.800"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'chain';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab4'; root.hidden = true; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Phòng thí nghiệm Buổi 4');
  root.innerHTML = '<div class="lb-win"><div class="lb-h"><span class="lb-ic">' + FLASK + '</span><span class="lb-bd">Phòng thí nghiệm · Buổi 4</span><nav class="lb-tabs"></nav><button class="lb-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb-b'); tabsEl = root.querySelector('.lb-tabs');
  LABS.forEach(l => { const b = document.createElement('button'); b.type = 'button'; b.className = 'lb-tab'; b.dataset.id = l.id; b.textContent = l.no + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b); });
  root.querySelector('.lb-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) { const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName); if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty && window.LabB4 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden && (document.getElementById('tb-badge')||{}).textContent === 'Buổi 4') { e.preventDefault(); open(); } return; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
}

const say = (kind, text) => {
  if (!logEl) return; const d = document.createElement('div'); d.className = 'lb-ln ' + kind; d.textContent = text; logEl.appendChild(d);
  while (logEl.children.length > 60) logEl.removeChild(logEl.firstChild); logEl.scrollTop = logEl.scrollHeight;
};
const rt = {};
function queueReact(tab, k) {
  if (!tab.log || !tab.log.react) return; clearTimeout(rt[k]);
  rt[k] = setTimeout(() => { if (cur !== tab || !logEl) return; const P = tab.prev || {}; tab.log.react(tab.S, k, P, say); tab.prev = Object.assign({}, tab.S); tab.M = {}; }, 350);
}
function clearTimers() { timers.forEach(clearTimeout); timers = []; Object.keys(rt).forEach(k => clearTimeout(rt[k])); }
function mkCtrl(tab, c, p) {
  const S = tab.S, w = document.createElement('div');
  const touch = () => { curPanels.forEach(q => q.dirty = true); queueReact(tab, c.k); };
  if (c.btn) { w.className = 'lb-btn'; w.textContent = c.btn; w.setAttribute('role', 'button'); w.tabIndex = 0; w.onclick = () => c.fn(p); return w; }
  if (c.seg) {
    w.className = 'lb-seg';
    c.seg.forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.textContent = o[1]; b.className = S[c.k] === o[0] ? 'on' : '';
      b.onclick = () => { S[c.k] = o[0]; if (c.set && c.set[o[0]]) Object.assign(S, c.set[o[0]]); curPanels.forEach(q => q.syncCtrls && q.syncCtrls()); touch(); }; w.appendChild(b); });
    p.syncs.push(() => { [...w.children].forEach((b, i) => b.classList.toggle('on', S[c.k] === c.seg[i][0])); });
    return w;
  }
  w.className = 'lb-k';
  const lab = document.createElement('span'); lab.textContent = c.l; const inp = document.createElement('input'); inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step;
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
  if (!mob) { bodyEl.style.display = 'grid'; bodyEl.style.gridTemplateColumns = tab.cols; bodyEl.style.gridTemplateRows = tab.rows; bodyEl.style.gridTemplateAreas = tab.areas; }
  else { bodyEl.style.display = ''; bodyEl.style.gridTemplate = ''; }
  tab.prev = Object.assign({}, tab.S); tab.M = {};
  tab.panels.concat([{ title: 'Nhật ký thí nghiệm', area: 'l', log: true }]).forEach((spec, i) => {
    const el = document.createElement('div'); el.className = 'lb-p'; if (!mob) el.style.gridArea = spec.area;
    el.innerHTML = '<div class="lb-t"></div><div class="lb-cv">' + (spec.host ? '' : '<canvas></canvas>') + '</div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) { const lg = document.createElement('div'); lg.className = 'lb-log'; lg.setAttribute('aria-live', 'polite'); el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el); curPanels.push({ el, dirty: false, spec, syncs: [] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 250 + j * 900))); return; }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W: 0, H: 0, tab, S: tab.S, st: {}, dirty: true, spec, syncs: [] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.ctrls && spec.ctrls.length) { const cb = document.createElement('div'); cb.className = 'lb-c'; spec.ctrls.forEach(c => cb.appendChild(mkCtrl(tab, c, p))); el.appendChild(cb); }
    bodyEl.appendChild(el); curPanels.push(p);
    if (spec.host) spec.mount(p, box);
    else new ResizeObserver(() => {
      const r = box.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); p.W = Math.max(10, r.width); p.H = Math.max(10, r.height);
      cv.width = Math.round(p.W * d); cv.height = Math.round(p.H * d); p.ctx.setTransform(d, 0, 0, d, 0, 0); p.dirty = true;
    }).observe(box);
  });
  if (panelIdx != null && curPanels[panelIdx]) { const e = curPanels[panelIdx].el; e.classList.add('glow'); setTimeout(() => e.classList.remove('glow'), 1500); }
}

function loop(ts) {
  if (root.hidden) { raf = 0; return; }
  const dt = Math.min(.04, (ts - last) / 1000); last = ts; tAcc += dt;
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
  root.querySelector('.lb-x').focus({ preventScroll: true });
  const b = document.getElementById('tb-lab'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
}
function close() {
  if (!root || root.hidden) return;
  root.hidden = true; clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
    const b = document.getElementById('tb-lab'); if (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
}

/* ---------- dấu hiệu tinh tế trong bài: biểu tượng bình thí nghiệm nhỏ cạnh tiêu đề ---------- */
const H3MAP = [[/^1\.1/, 'chain', 0], [/^2\.2/, 'smil', 0], [/^2\.3/, 'si', 0], [/^2\.5/, 'fill', 0]];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab-m')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-m'; b.innerHTML = FLASK;
  b.setAttribute('aria-label', 'Xem thí nghiệm: ' + title); b.title = 'Xem thí nghiệm';
  b.onclick = e => { e.preventDefault(); e.stopPropagation(); open(id, pi); }; h.appendChild(b);
}
function markLesson(rootEl) {
  if (!rootEl) return;
  rootEl.querySelectorAll('h2').forEach(h => { const m = /^\s*(\d+)\./.exec(h.textContent); if (!m) return; const l = LABS.find(x => x.secs.includes(+m[1])); if (l) addMark(h, l.id, null, l.name); });
  rootEl.querySelectorAll('h3').forEach(h => { const t = h.textContent.trim(); const r = H3MAP.find(x => x[0].test(t)); if (r) addMark(h, r[1], r[2], t); });
}

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 4') markLesson(document.getElementById('app-content'));
window.LabB4 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
