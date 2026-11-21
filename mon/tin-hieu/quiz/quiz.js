/* quiz.js — giao diện quiz: trang "Bài 0", popup nhanh (phím M), thanh danh sách câu.
   Dữ liệu câu hỏi nằm ở quiz/quiz-data.js, giao diện ở quiz/quiz.css.
   Tiến độ làm bài lưu trong localStorage (khoá 'nhch5'). */
window.QZ = (() => {
    const isOpen = () => { const p = g('qzPop'); return !!p && p.classList.contains('open'); };
    let D, T, IMG, S = {}, tmp = {}, cur = 0, flt = false, pi = -1, inited = false, pageOn = false, sel = null;
    let exOn = true; try { exOn = localStorage.getItem('nhch5ex') !== '0'; } catch (e) {}
    const wide = () => window.matchMedia ? matchMedia('(min-width:1100px)').matches : true;
    const K = 'nhch5', g = id => document.getElementById(id);
    const lab = q => q.t + '.' + q.n, byId = id => D.find(x => x.id == id);
    const save = () => { try { localStorage.setItem(K, JSON.stringify(S)); } catch (e) {} };
    function typeset(els) {
        if (window.MathJax && window.MathJax.typesetPromise) {
            const list = (Array.isArray(els) ? els : [els]).filter(Boolean);
            if (list.length) window.MathJax.typesetPromise(list).catch(() => {});
        }
    }
    function init() {
        if (inited) return; inited = true;
        const j = window.QUIZ_DATA;                     // quiz/quiz-data.js
        D = j.questions.map(x => ({ ...x, e: x.e.trim() })); T = j.topics; IMG = j.imgDir || 'quiz/img/';
        buildDom();
        try { S = JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) {}
    }
    function ctrl(q) {
        const s = S[q.id]; let h = '';
        if (q.k == 'mc' || q.k == 'yn') {
            const L = q.k == 'mc' ? Array.from({ length: q.c }, (_, i) => i + 1) : ['Có', 'Không'];
            L.forEach((x, i) => { const n = i + 1, c = s ? (n == q.a ? 'qok' : n == s.v ? 'qbad' : '') : ''; h += `<button class="qo ${c}" data-i="${n}" ${s ? 'disabled' : ''}>${x}</button>`; });
        } else if (q.k == 'multi') {
            q.l.forEach((x, i) => {
                let c = ''; if (s) { const A = q.a.includes(i), P = s.v.includes(i); c = A ? (P ? 'qok' : 'qmiss') : (P ? 'qbad' : ''); } else if ((tmp[q.id] || []).includes(i)) c = 'qon';
                h += `<button class="qo ${c}" data-i="${i}" ${s ? 'disabled' : ''}>${x}</button>`;
            });
            if (!s) h += `<button class="qgo" data-go>Kiểm tra</button>`;
        } else {
            h += `<input class="qnum" inputmode="decimal" placeholder="Nhập đáp số" value="${s ? s.v : ''}" ${s ? 'disabled' : ''}>`;
            if (!s) h += `<button class="qgo" data-go>Kiểm tra</button>`;
        }
        if (s && (q.k == 'num' || q.k == 'yn')) h += `<span class="qv ${s.ok ? 'qok' : 'qbad'}">${s.ok ? '✓ Đúng' : '✗ Đáp án: ' + q.d}</span>`;
        else if (s && q.k == 'multi') h += `<span class="qv ${s.ok ? 'qok' : 'qbad'}">${s.ok ? '✓ Đúng' : '✗ Sai'}</span>`;
        if (s) h += `<button class="qo qex ${exOn ? 'qon' : ''}" data-ex title="Bật/tắt giải thích">Giải thích</button>`;
        return h;
    }
    // Ảnh đề: có width/height để trình duyệt giữ chỗ trước khi ảnh tải (lazy-load không làm trang nhảy)
    const img = (u, q) => `<img src="${IMG}${u[0]}" ${u[2] ? `width="${u[1]}" height="${u[2]}" ` : ''}style="width:${u[1]}px" loading="lazy" decoding="async" alt="Câu ${lab(q)}">`;
    function art(q, mini) {
        const s = S[q.id];
        const tools = s ? '<button class="qrs" data-re title="Làm lại">↺</button>' : '';
        const inl = (mini || !wide()) && s && exOn;
        return `<article class="qz-q" id="${mini ? 'qp' : 'qz'}${q.id}" data-id="${q.id}"><div class="qh"><b>${lab(q)}</b><span>${tools}</span></div>${q.im.map(u => img(u, q)).join('')}<div class="qa">${ctrl(q)}</div>${inl ? `<div class="qzx qpx" id="qpx${q.id}">${q.e}</div>` : ''}</article>`;
    }
    function railHTML(L, act) {
        let h = '', gr = -1;
        L.forEach(q => {
            if (q.t != gr) { if (gr != -1) h += '</div>'; gr = q.t; h += `<div class="qrg">Chương ${gr}</div><div class="qr4">`; }
            const s = S[q.id];
            h += `<button class="qrb ${s ? (s.ok ? 'qok' : 'qbad') : ''}${q.id == act ? ' qcur' : ''}" data-r="${q.id}" title="Câu ${lab(q)}">${q.n}</button>`;
        });
        return h + '</div>';
    }
    function railsUpd() {
        const v = Object.values(S);
        if (pageOn) {
            const st = g('qzSt'); if (st) st.innerHTML = `<b>${v.filter(x => x.ok).length}</b>/${v.length} · ${D.length}`;
            g('qzRail').innerHTML = railHTML(D.filter(q => !cur || q.t == cur));
        }
        if (g('qzPop').classList.contains('open') && pi >= 0) g('qzpRail').innerHTML = railHTML(D, D[pi].id);
    }
    function afterChange(id) {
        const q = byId(id);
        [['qz', false], ['qp', true]].forEach(([p, m]) => {
            const e = g(p + id);
            if (e) {
                e.outerHTML = art(q, m);
                typeset(g(p + id));
            }
        });
        if (pageOn && wide()) { if (S[id]) { if (exOn) side(q); } else if (sel == id) side(null); }
        const x = g('qpx' + id);
        if (x && S[id]) {
            x.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            typeset(x);
        }
        railsUpd();
    }
    function side(q) {
        const el = g('qzSide'); if (!el) return;
        el.innerHTML = q ? `<h4><span>Câu ${lab(q)}</span></h4>${q.e}` : ''; sel = q ? q.id : null; el.scrollTop = 0;
        if (q) typeset(el);
    }
    const parse = x => { x = x.trim().replace(',', '.'); if (/^-?\d+(\.\d+)?\/\d+(\.\d+)?$/.test(x)) { const [a, b] = x.split('/'); return a / b; } return x === '' ? NaN : Number(x); };
    function check(q, el) {
        let v, ok;
        if (q.k == 'multi') { v = tmp[q.id] || []; ok = v.length == q.a.length && q.a.every(i => v.includes(i)); }
        else { const inp = el.querySelector('.qnum'), r = parse(inp.value); if (isNaN(r)) return; v = inp.value; ok = Math.abs(r - q.a) <= (q.a % 1 ? 0.011 : 1e-9); }
        S[q.id] = { v, ok }; save(); afterChange(q.id);
    }
    function toggleEx(q) {
        exOn = !exOn; try { localStorage.setItem('nhch5ex', exOn ? '1' : '0'); } catch (e) {}
        document.querySelectorAll('.qex').forEach(b => b.classList.toggle('qon', exOn));
        if (pageOn) { if (wide()) side(exOn && S[q.id] ? q : null); else pageRender(); }
        if (isOpen() && pi >= 0) popRender();
    }
    function act(e, mini) {
        const b = e.target.closest('button'); if (!b) return false;
        const a = b.closest('.qz-q'); if (!a) return false;
        const q = byId(a.dataset.id);
        if ('re' in b.dataset) { delete S[q.id]; delete tmp[q.id]; save(); afterChange(q.id); return true; }
        if ('ex' in b.dataset) { toggleEx(q); return true; }
        if ('go' in b.dataset) { check(q, a); return true; }
        if (b.dataset.i === undefined) return false;
        const i = +b.dataset.i;
        if (q.k == 'multi') { const t = tmp[q.id] = tmp[q.id] || [], p = t.indexOf(i); p < 0 ? t.push(i) : t.splice(p, 1); afterChange(q.id); }
        else { S[q.id] = { v: i, ok: i == q.a }; save(); afterChange(q.id); }
        return true;
    }
    // ----- trang Bài 10
    function pageRender() {
        const L = D.filter(q => (!cur || q.t == cur) && (!flt || !(S[q.id] && S[q.id].ok)));
        g('qzList').innerHTML = L.length ? L.map(q => art(q)).join('') : '<div class="qz-empty">Không còn câu nào ✓</div>';
        g('qzTabs').innerHTML = [{ id: 0, name: 'Tất cả' }].concat(T).map(t => `<button class="qtab ${t.id == cur ? 'on' : ''}" data-t="${t.id}" title="${t.name}">${t.id ? t.id + '. ' + t.name : t.name}</button>`).join('');
        g('qzFl').classList.toggle('on', flt); railsUpd();
        typeset(g('qzList'));
    }
    function mount(c) {
        init(); pageOn = true; sel = null;
        c.innerHTML = '<div class="qz-bar"><button class="qtab" id="qzRt" title="Danh sách câu">☷</button><span id="qzTabs"></span><span class="qz-st" id="qzSt"></span><button class="qtab" id="qzFl" title="Chỉ hiện câu chưa làm / làm sai">Chưa đúng</button><button class="qtab" id="qzRs" title="Xoá kết quả">↺ Xoá</button></div><div class="qz-wrap"><div id="qzList" class="qz-list"></div><aside id="qzSide" class="qz-side qzx"></aside></div>';
        c.onclick = e => {
            const b = e.target.closest('button'); if (!b) return;
            if (b.dataset.t !== undefined) { cur = +b.dataset.t; pageRender(); scrollTo(0, 0); return; }
            if (b.id == 'qzFl') { flt = !flt; pageRender(); return; }
            if (b.id == 'qzRt') { g('qzRail').classList.toggle('open'); return; }
            if (b.id == 'qzRs') { if (confirm('Xoá toàn bộ kết quả?')) { S = {}; tmp = {}; save(); pageRender(); if (pi >= 0 && g('qzPop').classList.contains('open')) popRender(); } return; }
            act(e, false);
        };
        c.onkeydown = e => { if (e.key == 'Enter' && e.target.classList.contains('qnum')) { const a = e.target.closest('.qz-q'); check(byId(a.dataset.id), a); } };
        pageRender();
    }
    function unmount() { pageOn = false; g('qzRail').classList.remove('open'); }
    function goto(id) {
        g('qzRail').classList.remove('open');
        if (!g('qz' + id)) { flt = false; const q = byId(id); if (cur && q.t != cur) cur = 0; pageRender(); }
        g('qz' + id).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // ----- popup rút gọn (phím M)
    function popRender() {
        const q = D[pi];
        g('qzpMain').innerHTML = art(q, true); g('qzpRail').innerHTML = railHTML(D, q.id);
        const c = g('qzpRail').querySelector('.qcur'); if (c) c.scrollIntoView({ block: 'nearest' });
        g('qzpMain').scrollTop = 0;
        typeset(g('qzpMain'));
    }
    function toggle(f) {
        const p = g('qzPop'), open = f === undefined ? !isOpen() : f;
        if (open) { init(); if (pi < 0) { pi = D.findIndex(q => !S[q.id]); if (pi < 0) pi = 0; } popRender(); }
        p.classList.toggle('open', open);
        p.setAttribute('aria-hidden', String(!open));
    }
    function key(e) {
        const q = D[pi];
        if (e.key == 'ArrowRight' || e.key == 'ArrowLeft') { pi = (pi + (e.key == 'ArrowRight' ? 1 : -1) + D.length) % D.length; popRender(); e.preventDefault(); return; }
        if (S[q.id]) return;
        if (/^[1-9]$/.test(e.key)) {
            const n = +e.key;
            if ((q.k == 'mc' && n <= q.c) || (q.k == 'yn' && n <= 2)) { S[q.id] = { v: n, ok: n == q.a }; save(); afterChange(q.id); }
            else if (q.k == 'multi' && n <= q.l.length) { const t = tmp[q.id] = tmp[q.id] || [], p = t.indexOf(n - 1); p < 0 ? t.push(n - 1) : t.splice(p, 1); afterChange(q.id); }
        } else if (e.key == 'Enter' && q.k == 'multi') check(q, g('qp' + q.id));
    }
    // Popup (phím M) và thanh danh sách câu được tạo ở đây, nên tin-hieu.html không cần chứa markup quiz
    function buildDom() {
        document.body.insertAdjacentHTML('beforeend', `
<div id="qzPop" aria-hidden="true">
  <div class="qzp-box">
    <button type="button" class="qzp-close" id="qzpClose" aria-label="Đóng quiz (Esc)">✕</button>
    <div class="qzp-rail" id="qzpRail"></div>
    <div class="qzp-main" id="qzpMain"></div>
  </div>
</div>
<div class="qz-rail" id="qzRail"></div>`);
        g('qzRail').onclick = e => { const b = e.target.closest('[data-r]'); if (b) goto(b.dataset.r); };
        g('qzPop').onclick = e => {
            if (e.target === g('qzPop') || e.target.closest('#qzpClose')) { toggle(false); return; }
            const r = e.target.closest('[data-r]'); if (r) { pi = D.findIndex(q => q.id == r.dataset.r); popRender(); return; }
            act(e, true);
        };
        g('qzPop').onkeydown = e => { if (e.key == 'Enter' && e.target.classList.contains('qnum')) { const a = e.target.closest('.qz-q'); check(byId(a.dataset.id), a); } };
    }
    return { mount, unmount, toggle, isOpen, key };
})();
