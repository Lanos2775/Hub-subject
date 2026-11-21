/* figures.js — các hình vẽ SVG minh hoạ. Khoá (vd '1.1', 'TC.3', 'L.2') chính là id dùng
   trong nội dung bài học: [FIG: 1.1] chú thích. Mỗi hình là một hàm trả về chuỗi <svg>. */
// ---------- SVG FIGURES (key = id used by [FIG: id] in the lesson text) ----------
window.FIGS = (() => {
    const C1 = 'var(--c1)', C2 = 'var(--c2)', C3 = 'var(--c3)', C4 = 'var(--c4)', C5 = 'var(--c5)', MUT = 'var(--mut)';
    const f = n => Math.round(n * 10) / 10;
    const tx = (x, y, s, o = {}) => `<text x="${f(x)}" y="${f(y)}" text-anchor="${o.a || 'middle'}" style="fill:${o.c || 'var(--ink)'};font-size:${o.s || 15}px;font-weight:${o.w || 600}${o.i ? ';font-style:italic' : ''}">${s}</text>`;
    const ln = (x1, y1, x2, y2, o = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" style="stroke:${o.c || MUT};stroke-width:${o.w || 2};${o.d ? 'stroke-dasharray:' + o.d + ';' : ''}${o.op ? 'opacity:' + o.op + ';' : ''}"${o.m ? ` marker-end="url(#${o.m})"` : ''}/>`;
    const pa = (d, o = {}) => `<path d="${d}" style="fill:${o.f || 'none'};${o.fo != null ? 'fill-opacity:' + o.fo + ';' : ''}stroke:${o.c || 'none'};stroke-width:${o.w || 2.5};stroke-linejoin:round;stroke-linecap:round;${o.d ? 'stroke-dasharray:' + o.d + ';' : ''}${o.op ? 'opacity:' + o.op + ';' : ''}"${o.m ? ` marker-end="url(#${o.m})"` : ''}/>`;
    const pts = (a, close) => 'M' + a.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + (close ? 'Z' : '');
    const rc = (x, y, w, h, o = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${o.r == null ? 10 : o.r}" style="fill:${o.f || 'var(--card)'};stroke:${o.c || 'var(--g)'};stroke-width:${o.w || 2}"/>`;
    const ci = (x, y, r, o = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" style="fill:${o.f || 'var(--card)'};stroke:${o.c || MUT};stroke-width:${o.w || 2}"/>`;
    const bd = (x, y, w, s, c) => rc(x, y, w, 28, { r: 8, f: c, c: c }) + tx(x + w / 2, y + 19, s, { c: '#fff', s: 14, w: 700 });
    const SUBS = { '0': '₀', '1': '₁', '2': '₂', 's': 'ₛ' };
    const sb = (a, b) => [...b].every(ch => SUBS[ch]) ? a + [...b].map(ch => SUBS[ch]).join('') : `${a}<tspan dy="4" style="font-size:.72em">${b}</tspan>`;
    const sv = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" role="img">${body}</svg>`;
    const ax = (x1, x2, y) => ln(x1, y, x2, y, { m: 'ar' });
    const ay = (x, y1, y2) => ln(x, y1, x, y2, { m: 'ar' });
    const sample = (fn, a, b, n, X, Y) => { const r = []; for (let i = 0; i <= n; i++) { const u = a + (b - a) * i / n; r.push([X(u), Y(fn(u))]); } return r; };
    const tri = (X, Y, a, p, b, h) => [[X(a), Y(0)], [X(p), Y(h)], [X(b), Y(0)]];
    const solid = (arr, c) => pa(pts(arr, true), { c: c, f: c, fo: .25, w: 3 });
    const ghost = arr => pa(pts(arr, true), { c: MUT, d: '5 4', op: .75, w: 2 });
    const w0 = sb('ω', '0'), T0 = sb('T', '0'), N0 = sb('N', '0');

    return {
        // BÀI 11 — Laplace
        'L.1': () => {
            const X = u => 40 + u * 105, Y = v => 110 - v * 5.2;
            const e1 = sample(u => Math.exp(.45 * u), 0, 6.4, 60, X, Y), e2 = sample(u => -Math.exp(.45 * u), 0, 6.4, 60, X, Y);
            const cur = sample(u => Math.exp(.45 * u) * Math.sin(7 * u), 0, 6.4, 260, X, Y);
            return sv(760, 230, ax(30, 740, 110) + tx(735, 98, 't', { s: 15, c: MUT }) +
                pa(pts(e1), { c: C4, d: '5 4', op: .8, w: 2 }) + pa(pts(e2), { c: C4, d: '5 4', op: .8, w: 2 }) + pa(pts(cur), { c: C1, w: 2.5 }) +
                tx(300, 30, 'e^{σt}·sin(ωt), σ > 0: biên độ tăng theo hàm mũ', { s: 15, c: C4, w: 700 }) +
                tx(300, 215, 'e^{st} = e^{σt}·e^{jωt},  s = σ + jω', { s: 15, c: MUT, w: 600 }));
        },
        'L.2': () => {
            const X = (x, y) => ln(x - 6, y - 6, x + 6, y + 6, { c: C4, w: 3 }) + ln(x - 6, y + 6, x + 6, y - 6, { c: C4, w: 3 });
            const panel = (x0, title, right, lab) => {
                const p = x0 + 80, o = x0 + 130, xe = x0 + 250;
                const band = right ? pts([[p, 25], [xe, 25], [xe, 185], [p, 185]], true) : pts([[x0, 25], [p, 25], [p, 185], [x0, 185]], true);
                return pa(band, { c: 'none', f: C1, fo: .22 }) + ax(x0, xe, 105) + ay(o, 195, 12) + tx(xe - 8, 92, 'σ', { s: 15, c: MUT }) + tx(o + 12, 22, 'jω', { s: 15, c: MUT, a: 'start' }) +
                    ln(p, 25, p, 185, { c: C1, d: '5 4', w: 2 }) + X(p, 105) + tx(p, 126, '−a', { s: 14, c: C4, w: 700 }) +
                    tx(x0 + 125, 214, title, { s: 14, c: C1, w: 700 }) + tx(right ? p + 80 : p - 40, 60, lab, { s: 14, c: C2, w: 700 });
            };
            return sv(760, 230, panel(20, 'e^{−at}u(t): Re[s] > −a', true, 'ROC') + panel(390, '−e^{−at}u(−t): Re[s] < −a', false, 'ROC'));
        },
        'L.3': () => {
            const X = (x, y) => ln(x - 6, y - 6, x + 6, y + 6, { c: C4, w: 3 }) + ln(x - 6, y + 6, x + 6, y - 6, { c: C4, w: 3 });
            const S = s => 440 + s * 85, top = 20, bot = 190;
            const band = (a, b, c) => pa(pts([[a, top], [b, top], [b, bot], [a, bot]], true), { c: 'none', f: c, fo: .22 });
            return sv(760, 245, band(30, S(-2), C3) + band(S(-2), S(-1), C2) + band(S(-1), 730, C1) +
                ax(30, 735, 105) + ay(440, 195, 12) + tx(728, 92, 'σ', { s: 15, c: MUT }) + tx(452, 22, 'jω', { s: 15, c: MUT, a: 'start' }) +
                ln(S(-2), top, S(-2), bot, { c: MUT, d: '5 4', w: 1.5 }) + ln(S(-1), top, S(-1), bot, { c: MUT, d: '5 4', w: 1.5 }) +
                X(S(-2), 105) + X(S(-1), 105) + ci(S(1), 105, 6, { f: 'none', c: C5, w: 3 }) +
                tx(S(-2), 126, '−2', { s: 14, c: C4, w: 700 }) + tx(S(-1) + 4, 126, '−1', { s: 14, c: C4, w: 700 }) + tx(S(1), 126, '1', { s: 14, c: C5, w: 700 }) +
                tx((30 + S(-2)) / 2, 215, 'ROC 1', { s: 15, c: C3, w: 800 }) + tx((S(-2) + S(-1)) / 2, 215, 'ROC 2', { s: 15, c: C2, w: 800 }) + tx((S(-1) + 730) / 2 + 40, 215, 'ROC 3', { s: 15, c: C1, w: 800 }) +
                tx(130, 40, '× cực,  ○ không', { s: 14, c: MUT, w: 600, a: 'start' }));
        },

        // BÀI 5B — tích chập và đáp ứng xung
        'TC.1': () => {
            const X = u => 530 + u * 30, Y = v => 150 - v * 62;
            const cur = sample(u => Math.exp(-u / 1.3) * Math.cos(3.2 * u), 0, 6, 90, X, Y);
            return sv(760, 240,
                ln(55, 150, 135, 150) + ln(95, 150, 95, 38, { c: C1, w: 3.5, m: 'ar' }) + tx(95, 28, 'δ(t)', { s: 20, i: 1, c: C1, w: 800 }) + tx(95, 178, 'xung vào', { s: 14, c: MUT, w: 500 }) +
                ln(150, 95, 235, 95, { m: 'ar' }) + rc(245, 55, 170, 80, { c: C5, w: 2.5 }) + tx(330, 102, 'HỆ THỐNG LTI', { s: 17, c: C5, w: 800 }) + tx(330, 168, 'h(t)', { s: 20, i: 1, c: C5, w: 800 }) +
                ln(425, 95, 505, 95, { m: 'ar' }) +
                ay(530, 170, 36) + ax(520, 740, 150) + pa(pts(cur), { c: C2, w: 3 }) +
                tx(640, 28, 'h(t)', { s: 20, i: 1, c: C2, w: 800 }) + tx(640, 205, 'phản ứng ra', { s: 14, c: MUT, w: 500 }) +
                tx(380, 228, 'xung vào → phản ứng ra', { s: 14, c: MUT, w: 400 }));
        },
        'TC.2': () => {
            const v = [3, 2, 3, 5], cols = [C1, C2, C3, C4], lb = ['3δ[n]', '2δ[n−1]', '3δ[n−2]', '5δ[n−3]'];
            let s = tx(150, 28, 'x[n]', { s: 19, i: 1, c: C5, w: 800 }) + ax(45, 270, 245);
            v.forEach((a, n) => { const x = 85 + n * 48, y = 245 - a * 32; s += ln(x, 245, x, y, { c: cols[n], w: 3 }) + ci(x, y, 6, { f: cols[n], c: cols[n] }) + tx(x, y - 14, a, { s: 14, c: cols[n], w: 700 }) + tx(x, 266, n, { s: 13, c: MUT, w: 500 }); });
            s += tx(305, 165, '=', { s: 52, c: C4, w: 800 });
            v.forEach((a, r) => { const yb = 80 + r * 64, x = 385 + r * 48, y = yb - a * 11; s += ln(350, yb, 560, yb, { op: .6 }) + ln(x, yb, x, y, { c: cols[r], w: 3 }) + ci(x, y, 5, { f: cols[r], c: cols[r] }) + tx(575, yb + 5, (r ? '+ ' : '') + lb[r], { a: 'start', s: 16, c: cols[r], w: 800 }); });
            return sv(760, 290, s);
        },
        'TC.3': () => {
            const X = k => 125 + (k + 3) * 62;
            const pulse = (k1, k2, yb, h, c, o = {}) => pa(pts([[X(k1), yb], [X(k1), yb - h], [X(k2), yb - h], [X(k2), yb]], true), o.dash ? { c: c, d: '5 4', op: .85, w: 2 } : { c: c, f: c, fo: o.fo == null ? .28 : o.fo, w: 2.5 });
            const base = yb => ln(X(-3.4), yb, X(6.6), yb, { op: .6 });
            const L = (y, str, c, z) => tx(14, y, str, { a: 'start', s: z || 17, i: 1, c: c, w: 800 });
            let s = base(78) + pulse(1, 3, 78, 38, C1) + L(66, 'x[k]', C1);
            s += base(148) + pulse(0, 2, 148, 38, C5) + L(136, 'h[k]', C5);
            s += ln(X(0), 100, X(0), 226, { c: C3, d: '4 4' }) + ln(X(3.3), 158, X(3.3), 200, { c: C3, w: 2.5, m: 'ar' }) + tx(X(3.5), 184, 'lật qua k = 0', { a: 'start', s: 14, c: C3, w: 700 });
            s += base(218) + pulse(-2, 0, 218, 38, C4) + L(206, 'h[−k]', C4);
            s += tx(14, 272, 'h[n−k] tại vài giá trị n (nét đứt = x[k]; tô đậm = vùng chồng lấn):', { a: 'start', s: 14, c: MUT, w: 600 });
            [[0, 315, null], [2, 370, [1, 2]], [4, 425, [2, 3]]].forEach(([n, yb, ov]) => {
                s += base(yb) + pulse(1, 3, yb, 32, MUT, { dash: 1 });
                if (ov) s += pulse(ov[0], ov[1], yb, 32, C2, { fo: .55 });
                s += pulse(n - 2, n, yb, 32, C4) + ln(X(n), yb - 40, X(n), yb + 6, { c: C3, d: '4 4' }) + L(yb - 10, 'n = ' + n, C4, 15);
            });
            [-2, 0, 2, 4, 6].forEach(k => { s += tx(X(k), 452, k, { s: 13, c: MUT, w: 500 }); });
            return sv(760, 462, s);
        },
        'TC.4': () => {
            const base = 170;
            const P = (x0, t1, t2, h, c) => solid([[x0 + t1 * 40, base], [x0 + t1 * 40, base - h], [x0 + t2 * 40, base - h], [x0 + t2 * 40, base]], c);
            const panel = (x0, name, c) => ax(x0 - 10, x0 + 205, base) + ay(x0, base + 8, 40) + tx(x0 + 100, 30, name, { s: 19, i: 1, c: c, w: 800 });
            const tk = (x0, ts) => ts.map(t => ln(x0 + t * 40, base - 4, x0 + t * 40, base + 4, { c: MUT, w: 1.5 }) + tx(x0 + t * 40, base + 22, t, { s: 13, c: MUT, w: 500 })).join('');
            let s = panel(40, 'x(t)', C1) + P(40, 1, 3, 50, C1) + tk(40, [1, 3]);
            s += tx(262, 142, '*', { s: 52, c: C3, w: 800 });
            s += panel(290, 'h(t)', C5) + P(290, 0, 2, 50, C5) + tk(290, [2]);
            s += tx(517, 128, '=', { s: 40, c: C3, w: 800 });
            s += panel(540, 'y(t) = x * h', C4) + solid([[580, base], [660, base - 100], [740, base]], C4) +
                ln(660, base, 660, base - 100, { c: C4, d: '4 4', op: .8 }) + ln(540, base - 100, 660, base - 100, { c: C4, d: '4 4', op: .8 }) +
                tx(532, base - 95, '2', { a: 'end', s: 14, c: C4, w: 700 }) + tk(540, [1, 3, 5]);
            return sv(760, 215, s);
        },

        // BÀI 1 — mô hình hộp đen
        '1.1': () => sv(760, 205,
            tx(95, 77, 'x(t)', { s: 20, i: 1, c: C1, w: 800 }) + ln(150, 70, 290, 70, { m: 'ar' }) +
            rc(300, 35, 160, 70, { c: C5, w: 2.5 }) + tx(380, 77, 'HỆ THỐNG H', { s: 17, c: C5, w: 800 }) +
            tx(380, 128, 'h(t) / H(ω)', { s: 16, c: MUT }) +
            ln(470, 70, 610, 70, { m: 'ar' }) + tx(665, 77, 'y(t)', { s: 20, i: 1, c: C2, w: 800 }) +
            bd(135, 158, 150, 'Tuyến tính', C1) + bd(305, 158, 150, 'Bất biến', C5) + bd(475, 158, 150, 'Nhân quả', C2)),

        // BÀI 1 — tính xếp chồng
        '1.2': () => {
            const x1 = sb('x', '1'), x2 = sb('x', '2');
            let s = tx(40, 24, 'Cộng trước, rồi qua hệ thống', { a: 'start', s: 14, c: MUT, w: 400 });
            s += tx(40, 52, x1, { s: 19, i: 1, c: C1, w: 800 }) + tx(40, 112, x2, { s: 19, i: 1, c: C5, w: 800 });
            s += ln(62, 48, 141, 73, { c: C1 }) + ln(62, 108, 141, 87, { c: C5 });
            s += ci(160, 80, 20, { c: C3, w: 2.5 }) + tx(160, 89, 'Σ', { s: 22, c: C3, w: 800 });
            s += ln(180, 80, 235, 80, { m: 'ar' }) + rc(240, 50, 90, 60, { c: C5, w: 2.5 }) + tx(285, 90, 'H', { s: 26, c: C5, w: 800 });
            s += ln(330, 80, 425, 80, { m: 'ar' }) + tx(433, 87, 'T{' + x1 + ' + ' + x2 + '}', { a: 'start', s: 19, c: C4, w: 800 });
            s += tx(300, 168, '=', { s: 48, c: C4, w: 800 });
            s += tx(40, 186, 'Qua hệ thống trước, rồi cộng', { a: 'start', s: 14, c: MUT, w: 400 });
            s += tx(40, 222, x1, { s: 19, i: 1, c: C1, w: 800 }) + tx(40, 292, x2, { s: 19, i: 1, c: C5, w: 800 });
            s += ln(62, 218, 120, 218, { m: 'ar' }) + rc(125, 195, 70, 50, { c: C5, w: 2.5 }) + tx(160, 229, 'H', { s: 24, c: C5, w: 800 });
            s += ln(62, 288, 120, 288, { m: 'ar' }) + rc(125, 265, 70, 50, { c: C5, w: 2.5 }) + tx(160, 299, 'H', { s: 24, c: C5, w: 800 });
            s += ln(195, 220, 292, 250, { c: C1 }) + ln(195, 290, 292, 262, { c: C5 });
            s += ci(312, 256, 20, { c: C3, w: 2.5 }) + tx(312, 265, 'Σ', { s: 22, c: C3, w: 800 });
            s += ln(332, 256, 425, 256, { m: 'ar' }) + tx(433, 263, 'T{' + x1 + '} + T{' + x2 + '}', { a: 'start', s: 19, c: C4, w: 800 });
            return sv(760, 330, s);
        },

        // BÀI 2 — năng lượng vs công suất
        '2.1': () => {
            let s = rc(12, 12, 368, 276, { f: 'none', r: 14 }) + rc(390, 12, 358, 276, { f: 'none', r: 14 });
            const X = t => 45 + 100 * t, Y = v => 235 - 150 * v;
            const e = sample(t => Math.exp(-2 * t), 0, 3, 60, X, Y);
            s += pa(pts([[X(0), 235]].concat(e, [[X(3), 235]]), true), { f: C1, fo: .25, c: 'none' });
            s += pa(pts(e), { c: C1, w: 3.5 }) + ax(40, 362, 235) + ay(45, 240, 60) + tx(352, 256, 't', { i: 1, s: 15, c: MUT });
            s += ln(190, 208, 128, 224, { c: C1, w: 1.5, m: 'ar' }) + tx(196, 206, 'diện tích = E', { a: 'start', s: 15, c: C1 });
            s += tx(196, 42, 'Tín hiệu năng lượng', { s: 17, c: C1, w: 800 }) + tx(196, 276, '0 &lt; E &lt; ∞', { s: 17, c: C1 });
            const Yc = v => 185 - 55 * v, Xc = u => 410 + u;
            s += ax(405, 742, 185) + ay(410, 262, 95);
            s += pa(pts(sample(u => Math.cos(2 * Math.PI * u / 70) ** 2, 0, 310, 220, Xc, Yc)), { c: C4, w: 2 });
            s += pa(pts(sample(u => Math.cos(2 * Math.PI * u / 70), 0, 310, 220, Xc, Yc)), { c: C5, w: 3.5 });
            s += ln(410, Yc(.5), 725, Yc(.5), { c: C4, d: '6 5' }) + tx(731, Yc(.5) + 5, 'P', { a: 'start', s: 17, c: C4, w: 800 });
            s += ln(430, 72, 456, 72, { c: C5, w: 3.5 }) + tx(463, 77, 'x(t)', { a: 'start', s: 14 });
            s += ln(530, 72, 556, 72, { c: C4, w: 2 }) + tx(563, 77, '|x(t)|²', { a: 'start', s: 14 });
            s += tx(569, 42, 'Tín hiệu công suất', { s: 17, c: C5, w: 800 }) + tx(569, 276, 'E = ∞,  0 &lt; P &lt; ∞', { s: 17, c: C5 });
            return sv(760, 300, s);
        },

        // BÀI 3 — ba phép dịch
        '3.1': () => {
            const rows = [
                { yb: 125, c: C1, a: 0, p: 1, b: 2, t: 'x(t)', n: 'tín hiệu gốc' },
                { yb: 280, c: C2, a: 2, p: 3, b: 4, t: 'x(t − 2)', n: 'dịch phải 2 đơn vị (trễ)', ar: [1, 3, 'ar2', '+2'] },
                { yb: 435, c: C4, a: -1, p: 0, b: 1, t: 'x(t + 1)', n: 'dịch trái 1 đơn vị (tiến)', ar: [1, 0, 'ar4', '−1'] }
            ];
            let s = '';
            rows.forEach(r => {
                const X = t => 130 + 80 * t, Y = v => r.yb - 38 * v;
                s += ax(10, 556, r.yb) + ay(X(0), r.yb, r.yb - 100);
                for (let t = -1; t <= 5; t++) s += tx(X(t), r.yb + 18, t, { s: 12, c: MUT, w: 400 });
                if (r.ar) s += ghost(tri(X, Y, 0, 1, 2, 2));
                s += solid(tri(X, Y, r.a, r.p, r.b, 2), r.c);
                if (r.ar) {
                    const dir = r.ar[1] > r.ar[0] ? -5 : 5;
                    s += ln(X(r.ar[0]), r.yb - 94, X(r.ar[1]) + dir, r.yb - 94, { c: r.c, w: 2.5, m: r.ar[2] });
                    s += tx((X(r.ar[0]) + X(r.ar[1])) / 2, r.yb - 101, r.ar[3], { s: 14, c: r.c, w: 800 });
                }
                s += tx(570, r.yb - 34, r.t, { a: 'start', s: 19, c: r.c, w: 800 }) + tx(570, r.yb - 10, r.n, { a: 'start', s: 14, c: MUT, w: 400 });
            });
            return sv(760, 470, s);
        },

        // BÀI 3 — phép lật
        '3.2': () => {
            const Y = v => 200 - 38 * v, XL = t => 190 + 55 * t, XR = t => 570 + 55 * t;
            let s = ln(380, 14, 380, 246, { d: '6 6', op: .6 });
            s += ax(25, 365, 200) + ay(190, 200, 100) + ax(395, 748, 200) + ay(570, 200, 100);
            s += solid(tri(XL, Y, .5, 2.5, 3, 2), C1);
            s += ghost(tri(XR, Y, .5, 2.5, 3, 2)) + solid(tri(XR, Y, -3, -2.5, -.5, 2), C4);
            s += pa('M707 112 C650 44 490 44 436 106', { c: C4, w: 2.5, m: 'ar4' }) + tx(570, 48, 'lật qua trục tung', { s: 15, c: C4, w: 800 });
            s += tx(190, 26, 'x(t)', { s: 19, c: C1, w: 800 }) + tx(570, 26, 'x(−t)', { s: 19, c: C4, w: 800 });
            s += tx(190, 226, 'đồ thị gốc', { s: 14, c: MUT, w: 400 }) + tx(570, 226, 'nét đứt: gốc — nét liền: sau khi lật', { s: 14, c: MUT, w: 400 });
            return sv(760, 250, s);
        },

        // BÀI 3 — nén / giãn
        '3.3': () => {
            const defs = [
                { x0: 125, a: -1, p: 0, b: 1, t: 'x(t)', n: 'gốc', c: C1 },
                { x0: 380, a: -.5, p: 0, b: .5, t: 'x(2t)', n: 'nén — bề rộng còn 1/2', c: C2, g: 1 },
                { x0: 635, a: -2, p: 0, b: 2, t: 'x(t/2)', n: 'giãn — bề rộng gấp 2', c: C4, g: 1 }
            ];
            let s = '';
            defs.forEach(d => {
                const X = t => d.x0 + 60 * t, Y = v => 190 - 38 * v;
                s += ax(d.x0 - 118, d.x0 + 118, 190) + ay(d.x0, 190, 92);
                if (d.g) s += ghost(tri(X, Y, -1, 0, 1, 2));
                s += solid(tri(X, Y, d.a, d.p, d.b, 2), d.c);
                s += tx(d.x0, 40, d.t, { s: 19, c: d.c, w: 800 }) + tx(d.x0, 226, d.n, { s: 14, c: MUT, w: 400 });
            });
            return sv(760, 245, s);
        },

        // BÀI 3 — thứ tự ưu tiên
        '3.4': () => {
            const defs = [
                { a: 0, p: 1, b: 2, t: 'x(t)', k: 'Gốc', c: MUT },
                { a: 0, p: .5, b: 1, t: 'x(2t)', k: '1. Nén', c: C2 },
                { a: -1, p: -.5, b: 0, t: 'x(−2t)', k: '2. Lật', c: C4 },
                { a: 2, p: 2.5, b: 3, t: 'x(−2t + 6)', k: '3. Dịch', c: C5 }
            ];
            let s = '';
            defs.forEach((d, i) => {
                const bx = 20 + 190 * i, X = t => bx + 75 + 22 * (t - 1), Y = v => 170 - 22 * v;
                s += rc(bx, 10, 150, 205, { f: 'var(--card)' }) + bd(bx + 25, 22, 100, d.k, d.c);
                s += ax(bx + 8, bx + 144, 170) + ay(X(0), 170, 80) + tx(X(0), 188, '0', { s: 12, c: MUT, w: 400 });
                s += solid(tri(X, Y, d.a, d.p, d.b, 2), d.c === MUT ? C1 : d.c);
                s += tx(bx + 75, 243, d.t, { s: 17, c: d.c === MUT ? C1 : d.c, w: 800 });
                if (i < 3) s += ln(bx + 154, 110, bx + 186, 110, { m: 'ar', w: 2.5 });
            });
            return sv(760, 262, s);
        },

        // BÀI 4 — chu kỳ cơ sở
        '4.1': () => {
            const X = u => 50 + 250 * u, Y = v => 120 - 60 * v;
            let s = ax(40, 738, 120) + ay(50, 195, 45);
            s += ln(X(1), 48, X(1), 195, { c: C5, d: '6 5' }) + ln(X(2), 48, X(2), 195, { c: C5, d: '6 5', op: .45 });
            s += pa(pts(sample(u => Math.sin(2 * Math.PI * u), 0, 2.4, 240, X, Y)), { c: C1, w: 3.5 });
            s += tx(50, 38, '0', { s: 15, c: MUT }) + tx(X(1), 38, T0, { s: 17, c: C5, w: 800 }) + tx(X(2), 38, '2' + T0, { s: 17, c: C5, w: 800, });
            s += ln(175, 215, 54, 215, { c: C5, w: 2.5, m: 'ar5' }) + ln(175, 215, 296, 215, { c: C5, w: 2.5, m: 'ar5' });
            s += tx(175, 238, T0 + ' — chu kỳ cơ sở', { s: 16, c: C5, w: 800 });
            return sv(760, 250, s);
        },

        // BÀI 4 — rời rạc tuần hoàn vs không tuần hoàn
        '4.2': () => {
            const X = n => 60 + 39 * n;
            const stems = (base, fn, c) => {
                let s = '';
                for (let n = 0; n <= 16; n++) {
                    const y = base - 55 * fn(n);
                    s += ln(X(n), base, X(n), y, { c: c, w: 2.5 }) + ci(X(n), y, 4.5, { f: c, c: c });
                }
                return s;
            };
            let s = tx(50, 22, 'Tuần hoàn, ' + N0 + ' = 8', { a: 'start', s: 17, c: C1, w: 800 });
            s += ax(40, 745, 125) + stems(125, n => Math.cos(Math.PI * n / 4), C1);
            s += ln(X(0), 48, X(0), 190, { c: C5, d: '6 5' }) + ln(X(8), 48, X(8), 190, { c: C5, d: '6 5' });
            s += ln(X(0), 56, X(8), 56, { c: C5, w: 2.5 }) + tx((X(0) + X(8)) / 2, 46, N0 + ' = 8', { s: 17, c: C5, w: 800 });
            s += ln(30, 214, 735, 214, { op: .5, d: '3 6' });
            s += tx(50, 242, 'Không tuần hoàn', { a: 'start', s: 17, c: C4, w: 800 });
            s += ax(40, 745, 325) + stems(325, n => Math.cos(n), C4);
            s += tx(742, 118, 'n', { a: 'end', i: 1, s: 15, c: MUT }) + tx(742, 318, 'n', { a: 'end', i: 1, s: 15, c: MUT });
            return sv(760, 405, s);
        },

        // BÀI 5 — đáp ứng tổng
        '5.1': () => {
            const X = t => 60 + 100 * t;
            const panel = (yb, top, title, ys, extra) => {
                const Y = v => yb - 75 * v;
                const y0 = t => Math.exp(-2 * t);
                let s = rc(15, top, 730, 205, { f: 'none', r: 14 }) + ax(50, 738, yb) + ay(60, yb + 8, top + 18);
                s += tx(80, top + 28, title, { a: 'start', s: 17, w: 800 });
                s += pa(pts(sample(t => y0(t) + ys(t), 0, 6.5, 160, X, Y)), { c: C4, w: 4 });
                s += pa(pts(sample(y0, 0, 6.5, 160, X, Y)), { c: C1, w: 2.5 });
                s += pa(pts(sample(ys, 0, 6.5, 160, X, Y)), { c: C2, w: 2.5 });
                const lx = 470, ly = top + 28;
                s += ln(lx, ly, lx + 26, ly, { c: C1, w: 2.5 }) + tx(lx + 33, ly + 5, sb('y', '0') + ' (tự nhiên)', { a: 'start', s: 14 });
                s += ln(lx, ly + 22, lx + 26, ly + 22, { c: C2, w: 2.5 }) + tx(lx + 33, ly + 27, sb('y', 's') + ' (cưỡng bách)', { a: 'start', s: 14 });
                s += ln(lx, ly + 44, lx + 26, ly + 44, { c: C4, w: 4 }) + tx(lx + 33, ly + 49, 'y = ' + sb('y', '0') + ' + ' + sb('y', 's'), { a: 'start', s: 14 });
                s += tx(732, yb - 8, 't', { i: 1, s: 15, c: MUT, a: 'end' });
                return s + (extra || '');
            };
            let s = panel(185, 10, 'Không cộng hưởng', t => 0.8 * Math.exp(-0.6 * t));
            const hump = ln(262, 280, 234, 320, { c: C2, w: 1.8, m: 'ar2' }) + tx(255, 272, 'biên độ tăng do nhân tử t', { a: 'start', s: 14, c: C2, w: 800 });
            s += panel(405, 225, 'Cộng hưởng', t => 1.6 * t * Math.exp(-0.6 * t), hump);
            return sv(760, 440, s);
        },

        // BÀI 6 — xung vuông ↔ sinc
        '6.1': () => {
            let s = '';
            const X = t => 175 + 60 * t, Y = v => 190 - 100 * v;
            s += ax(30, 335, 190) + ay(175, 215, 55);
            s += pa(pts([[X(-1), 190], [X(-1), Y(1)], [X(1), Y(1)], [X(1), 190]]), { c: C1, w: 3.5 });
            s += pa(pts([[X(-1), 190], [X(-1), Y(1)], [X(1), Y(1)], [X(1), 190]], true), { f: C1, fo: .2, c: 'none' });
            s += tx(105, Y(1) + 5, '1', { a: 'end', s: 16, c: C1, w: 800 }) + ln(108, Y(1), X(-1), Y(1), { c: C1, d: '3 4', w: 1.5 });
            s += ln(X(-1), 212, X(1), 212, { c: C1, w: 2 }) + ln(X(-1), 206, X(-1), 218, { c: C1 }) + ln(X(1), 206, X(1), 218, { c: C1 });
            s += tx(175, 238, '2a', { s: 17, c: C1, w: 800 }) + tx(175, 30, 'Miền thời gian: xung vuông', { s: 16, c: C1, w: 800 });
            s += tx(328, 176, 't', { i: 1, s: 15, c: MUT, a: 'end' });
            const U = u => 585 + 45 * u, V = v => 190 - 110 * v;
            const sinc = u => Math.abs(u) < 1e-9 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
            s += ax(425, 745, 190) + ay(585, 225, 50);
            s += pa(pts(sample(sinc, -3.4, 3.4, 300, U, V)), { c: C5, w: 3.5 });
            s += tx(603, 70, 'đỉnh 2a', { a: 'start', s: 16, c: C5, w: 800 }) + tx(585, 30, 'Miền tần số: sinc', { s: 16, c: C5, w: 800 });
            s += tx(738, 176, 'ω', { i: 1, s: 15, c: MUT, a: 'end' });
            s += ln(345, 150, 415, 150, { c: C5, w: 3.5, m: 'ar5' }) + tx(380, 136, 'Fourier', { s: 15, c: C5, w: 800 });
            return sv(760, 262, s);
        },

        // BÀI 6 — phổ vạch
        '6.2': () => {
            const X = k => 380 + 75 * k, base = 215;
            const h = k => Math.abs(k) < 1e-9 ? 1 : Math.abs(Math.sin(Math.PI * k * .3) / (Math.PI * k * .3));
            let s = ax(40, 745, base);
            s += pa(pts(sample(h, -4.5, 4.5, 200, X, v => base - 150 * v)), { c: C3, d: '7 5', w: 2.5 });
            for (let k = -4; k <= 4; k++) {
                const y = base - 150 * h(k), c = k === 0 ? C4 : C1;
                s += ln(X(k), base, X(k), y, { c: c, w: k === 0 ? 5 : 3 }) + ci(X(k), y, k === 0 ? 6.5 : 5, { f: c, c: c });
                const lab = k === 0 ? '0' : (k < 0 ? '−' : '') + (Math.abs(k) === 1 ? '' : Math.abs(k)) + w0;
                s += tx(X(k), base + 24, lab, { s: 14, c: MUT });
            }
            s += tx(X(0), 44, 'thành phần DC (k = 0)', { s: 15, c: C4, w: 800 });
            s += tx(730, 70, 'đường nét đứt: đường bao dạng sinc', { a: 'end', s: 14, c: C3, w: 600 });
            s += tx(380, 285, 'phổ rời rạc — chỉ có vạch tại ω = k' + w0, { s: 16, c: MUT });
            return sv(760, 300, s);
        },

        // BÀI 8 — eigenfunction
        '8.1': () => {
            let s = tx(80, 76, 'A cos(' + w0 + 't + φ)', { s: 16, c: C1, w: 800 }) + ln(150, 70, 255, 70, { m: 'ar' });
            s += rc(262, 25, 150, 90, { c: C5, w: 2.5 }) + tx(337, 62, 'Hệ thống LTI', { s: 17, c: C5, w: 800 }) + tx(337, 94, 'H(ω)', { s: 21, c: C5, w: 800, i: 1 });
            s += ln(420, 70, 505, 70, { m: 'ar' });
            s += tx(632, 62, 'A·|H(' + w0 + ')|', { s: 15, c: C2, w: 800 }) + tx(632, 86, 'cos(' + w0 + 't + φ + ∠H(' + w0 + '))', { s: 13.5, c: C2, w: 800 });
            s += bd(172, 150, 165, 'Biên độ × |H|', C1) + bd(352, 150, 150, 'Pha + ∠H', C5);
            s += tx(337, 214, 'tần số ' + w0 + ' giữ nguyên', { s: 15, c: C3, w: 800 });
            return sv(760, 232, s);
        },

        // BÀI 8 — đáp ứng biên độ thông thấp
        '8.2': () => {
            const X = w => 80 + 220 * w, Y = v => 235 - 160 * v;
            const H = w => 1 / Math.sqrt(1 + Math.pow(w, 4));
            let s = rc(80, 55, 220, 180, { f: C2, c: 'none' }).replace('style="', 'style="fill-opacity:.13;') + rc(300, 55, 420, 180, { f: C4, c: 'none' }).replace('style="', 'style="fill-opacity:.1;');
            s += ax(70, 740, 235) + ay(80, 245, 45);
            s += ln(X(1), 235, X(1), 52, { c: C5, d: '6 5', w: 2 }) + ln(80, Y(1 / Math.SQRT2), X(1), Y(1 / Math.SQRT2), { c: C3, d: '6 5', w: 2 });
            s += pa(pts(sample(H, 0, 2.9, 200, X, Y)), { c: C1, w: 4 });
            s += tx(70, Y(1) + 5, '1', { a: 'end', s: 15, c: MUT }) + tx(90, Y(1 / Math.SQRT2) - 8, '1/√2 ≈ −3 dB', { a: 'start', s: 14, c: C3, w: 800 });
            s += tx(X(1), 258, sb('ω', 'c'), { s: 17, c: C5, w: 800 }) + tx(732, 256, 'ω', { a: 'end', i: 1, s: 15, c: MUT }) + tx(60, 54, '|H(ω)|', { a: 'end', s: 14, c: MUT });
            s += tx(190, 44, 'dải thông', { s: 16, c: C2, w: 800 }) + tx(510, 44, 'dải chặn', { s: 16, c: C4, w: 800 });
            return sv(760, 285, s);
        },

        // BÀI 9 — phổ biên độ và phổ pha
        '9.1': () => {
            const X = k => 380 + 130 * k, lab = ['−400π', '−200π', '0', '200π', '400π'];
            let s = tx(30, 30, '|X(ω)| — phổ biên độ (đối xứng chẵn)', { a: 'start', s: 17, c: C1, w: 800 });
            s += ax(40, 745, 195) + ln(X(0), 55, X(0), 195, { c: C5, d: '5 5', op: .5 });
            [[-2, 1, '1'], [-1, .75, '3/4'], [0, 1, '1'], [1, .75, '3/4'], [2, 1, '1']].forEach(a => {
                const y = 195 - 120 * a[1];
                s += ln(X(a[0]), 195, X(a[0]), y, { c: C1, w: 3.5 }) + ci(X(a[0]), y, 5.5, { f: C1, c: C1 }) + tx(X(a[0]) + 16, y - 6, a[2], { s: 16, c: C1, w: 800 });
            });
            for (let k = -2; k <= 2; k++) s += tx(X(k), 217, lab[k + 2], { s: 14, c: MUT });
            s += tx(30, 262, '∠X(ω) — phổ pha (đối xứng lẻ)', { a: 'start', s: 17, c: C4, w: 800 });
            s += ax(40, 745, 370) + ln(X(0), 285, X(0), 395, { c: C5, d: '5 5', op: .5 });
            const P = 70 / Math.PI;
            [[-2, Math.PI / 4, 'π/4'], [-1, 0, '0'], [0, Math.PI, 'π'], [1, 0, '0'], [2, -Math.PI / 4, '−π/4']].forEach(a => {
                const y = 370 - P * a[1];
                s += ln(X(a[0]), 370, X(a[0]), y, { c: C4, w: 3.5 }) + ci(X(a[0]), y, 5.5, { f: C4, c: C4 });
                s += tx(X(a[0]) + 16, a[1] < 0 ? y + 5 : y - 8, a[2], { s: 16, c: C4, w: 800 });
            });
            for (let k = -2; k <= 2; k++) s += tx(X(k), 418 + (k === 2 ? 0 : 0), lab[k + 2], { s: 14, c: MUT });
            s += tx(742, 190, 'ω', { a: 'end', i: 1, s: 15, c: MUT }) + tx(742, 365, 'ω', { a: 'end', i: 1, s: 15, c: MUT });
            return sv(760, 435, s);
        },

        // BÀI 9 — một cặp vạch ↔ một làn sóng cos
        '9.2': () => {
            const w1 = sb('ω', '1'), base = 150;
            let s = tx(30, 26, 'Phổ: một cặp vạch đối xứng', { a: 'start', s: 17, c: C1, w: 800 });
            s += ax(40, 745, base);
            [-1, 1].forEach(k => {
                const x = 380 + 150 * k, y = base - 90;
                s += ln(x, base, x, y, { c: C1, w: 4 }) + ci(x, y, 6, { f: C1, c: C1 }) + tx(x + 20, y - 4, '3/4', { s: 16, c: C1, w: 800 });
            });
            s += ln(380, 108, 238, 108, { m: 'ar', c: C4 }) + ln(380, 108, 522, 108, { m: 'ar', c: C4 }) + tx(380, 98, 'cặp vạch đối xứng', { s: 15, c: C4, w: 800 });
            s += tx(230, 174, '−' + w1, { s: 15, c: MUT }) + tx(380, 174, '0', { s: 15, c: MUT }) + tx(530, 174, w1, { s: 15, c: MUT });
            s += ln(380, 192, 380, 232, { c: C5, w: 3.5, m: 'ar5' }) + tx(398, 218, 'tương ứng', { a: 'start', s: 15, c: C5, w: 800 });
            s += tx(30, 262, 'Tín hiệu: một làn sóng cos', { a: 'start', s: 17, c: C2, w: 800 });
            const X = u => 60 + u, Y = v => 365 - 53.3 * v;
            s += ax(40, 745, 365) + ln(60, Y(1.5), 700, Y(1.5), { c: C3, d: '6 5' }) + ln(60, Y(-1.5), 700, Y(-1.5), { c: C3, d: '6 5' });
            s += pa(pts(sample(u => 1.5 * Math.cos(2 * Math.PI * u / 130 + .6), 0, 640, 300, X, Y)), { c: C2, w: 3.5 });
            s += tx(735, Y(1.5) - 6, 'biên độ = 2 · 3/4 = 3/2', { a: 'end', s: 14, c: C3, w: 800 });
            s += tx(380, 480, '2|X(' + w1 + ')| cos(' + w1 + 't + ∠X(' + w1 + '))', { s: 17, c: C2, w: 800 });
            return sv(760, 498, s);
        }
    };
})();
