/* formulas.js — popup "Bảng tra công thức Fourier" (phím H / nút Σ).
   Đọc nội dung từ formulas/formulas-data.js (cú pháp ghi ở đầu file đó) rồi dựng HTML,
   nên chỉnh bảng chỉ cần sửa file dữ liệu, không đụng tới HTML hay JS. */
window.FORMULAS = (() => {
    let el = null, typeset = false;

    // Thoát ký tự HTML (để gõ < > & thoải mái trong LaTeX); chỉ giữ lại thẻ <br>
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/&lt;br\s*\/?&gt;/gi, '<br>');
    const cells = s => s.split(' :: ').map(x => x.trim());

    // Văn bản dữ liệu -> [{ title, cards: [{ title, sub, eqs, widths, head, rows }] }]
    function parse(src) {
        const cols = [];
        let col = null, card = null;
        const needCol = () => col || (col = { title: '', cards: [] }, cols.push(col), col);
        const needCard = () => card || (card = { title: '', sub: '', eqs: [], widths: [], head: [], rows: [] }, needCol().cards.push(card), card);

        src.split('\n').forEach(raw => {
            const line = raw.trim();
            if (!line || line.startsWith('//')) return;
            if (line.startsWith('## ')) {
                const [title, ...sub] = line.slice(3).split(' :: ');
                card = null; needCard();
                card.title = title.trim(); card.sub = sub.join(' :: ').trim();
            } else if (line.startsWith('# ')) {
                col = { title: line.slice(2).trim(), cards: [] }; cols.push(col); card = null;
            } else if (line.startsWith('= ')) {
                needCard().eqs.push(line.slice(2).trim());
            } else if (line.startsWith('widths:')) {
                needCard().widths = line.slice(7).trim().split(/\s+/);
            } else if (line.startsWith('head:')) {
                needCard().head = cells(line.slice(5));
            } else {
                needCard().rows.push(cells(line));
            }
        });
        return cols;
    }

    function cardHTML(k) {
        const table = k.head.length ? `<table class="fpop-tbl"><thead><tr>${
            k.head.map((h, i) => `<th${k.widths[i] ? ` style="width:${k.widths[i]}"` : ''}>${esc(h)}</th>`).join('')
        }</tr></thead><tbody>${
            k.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')
        }</tbody></table>` : '';
        return `<div class="fpop-card"><div class="fpop-header"><span class="fpop-title">${esc(k.title)}</span>${
            k.sub ? `<span class="fpop-sub">${esc(k.sub)}</span>` : ''
        }</div>${k.eqs.map(e => `<div class="fpop-eq">${esc(e)}</div>`).join('')}${table}</div>`;
    }

    function build() {
        const cols = parse(window.FORMULA_SHEET || '');
        document.body.insertAdjacentHTML('beforeend', `
<div id="fPop" role="dialog" aria-modal="true" aria-label="Bảng tra công thức Fourier">
  <div class="fpop-box">
    <button type="button" class="fpop-close" id="fpopClose" aria-label="Đóng bảng tra (Esc)">✕</button>
    <div class="fpop-body"><div class="fpop-grid">${
        cols.map(c => `<div class="fpop-col"><div class="fpop-col-title">${esc(c.title)}</div>${c.cards.map(cardHTML).join('')}</div>`).join('')
    }</div></div>
  </div>
</div>`);
        el = document.getElementById('fPop');
        el.onclick = e => { if (e.target === el || e.target.closest('#fpopClose')) toggle(false); };
    }

    const isOpen = () => !!el && el.classList.contains('open');

    function toggle(open) {
        if (!el) build();
        const willOpen = open === undefined ? !isOpen() : !!open;
        el.classList.toggle('open', willOpen);
        if (willOpen && !typeset) {          // MathJax chỉ dàn chữ công thức một lần, lần mở đầu tiên
            typeset = true;
            if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([el]).catch(() => {});
        }
    }

    return { toggle, isOpen };
})();
