/* app.js — khung giao diện: menu mục lục, chuyển bài, phím tắt (H / M / L / Esc)
   và nạp "lười" các phần nặng (quiz, bảng công thức, phòng thí nghiệm) khi người dùng mở lần đầu. */

const $ = id => document.getElementById(id);
const mb = $('mb'), mn = $('mn'), toc = $('toc');

// ---------- Nạp lười CSS/JS ----------
const Assets = (() => {
    const cache = {};
    const once = (key, make) => cache[key] || (cache[key] = make().catch(e => { delete cache[key]; throw e; }));
    return {
        css: href => once(href, () => new Promise((ok, fail) => {
            const l = document.createElement('link');
            l.rel = 'stylesheet'; l.href = href;
            l.onload = ok;
            l.onerror = () => { l.remove(); fail(new Error('Không tải được ' + href)); };
            document.head.appendChild(l);
        })),
        js: src => once(src, () => new Promise((ok, fail) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = ok;
            s.onerror = () => { s.remove(); fail(new Error('Không tải được ' + src)); };
            document.head.appendChild(s);
        }))
    };
})();

// Mỗi tính năng = danh sách file + đối tượng toàn cục nó tạo ra
const lazy = (files, get) => {
    let p = null;
    return () => p || (p = Promise.all(files.map(f => f.endsWith('.css') ? Assets.css(f) : Assets.js(f)))
        .then(get).catch(e => { p = null; throw e; }));
};
const loadQuiz = lazy(['quiz/quiz.css', 'quiz/quiz-data.js', 'quiz/quiz.js'], () => window.QZ);
const loadFormulas = lazy(['formulas/formulas.css', 'formulas/formulas-data.js', 'formulas/formulas.js'], () => window.FORMULAS);
const loadLab = lazy(['lab.css', 'lab.js'], () => window.LAB);
const onFail = e => console.error(e);

const quizOpen = () => !!(window.QZ && QZ.isOpen());
const formulasOpen = () => !!(window.FORMULAS && FORMULAS.isOpen());
const labOpen = () => !!(window.LAB && window.LAB.isOpen());

// ---------- Menu / bài học ----------
function openMenu(o) {
    mn.hidden = !o;
    mb.setAttribute('aria-expanded', o);
    if (o) {
        markActive();
        const a = toc.querySelector('a.on');
        if (a) mn.scrollTop = Math.max(0, a.offsetTop - mn.clientHeight / 3);
    }
}

function renderCurrentLesson() {
    const idx = state.currentLessonIndex;
    const lesson = state.lessons[idx];
    if (!lesson) return;

    $('lesson-chip').textContent = `Bài ${lesson.number}`;
    $('lesson-title').textContent = lesson.shortTitle;

    state.tocItems = [];
    state.cardN = 0;
    const container = $('lesson-container');
    document.body.classList.toggle('qz-on', !!lesson.quiz);

    if (lesson.quiz) {
        container.innerHTML = '<div class="qz-empty">Đang tải quiz…</div>';
        loadQuiz().then(Q => {
            if (state.currentLessonIndex !== idx) return;     // người dùng đã chuyển bài trong lúc tải
            container.innerHTML = '';
            Q.mount(container);
        }).catch(e => {
            onFail(e);
            if (state.currentLessonIndex === idx) container.innerHTML = '<div class="qz-empty">Không tải được quiz (thư mục quiz/).</div>';
        });
    } else {
        if (window.QZ) QZ.unmount();
        let html = '';
        ['overview', 'exercises', 'summary'].forEach(k => {
            if (lesson.sections[k]) {
                html += `<div class="lesson-sec" data-section="${k}">${compileSectionHTML(lesson.sections[k], k, state.tocItems)}</div>`;
            }
        });
        container.innerHTML = html;
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([container]).catch(() => {});
        }
    }

    const prev = state.lessons[idx - 1];
    const next = state.lessons[idx + 1];
    const pb = $('btn-prev'), nb = $('btn-next');
    pb.disabled = !prev;
    pb.textContent = prev ? `← Bài ${prev.number}: ${prev.shortTitle}` : '';
    nb.disabled = !next;
    nb.textContent = next ? `Bài ${next.number}: ${next.shortTitle} →` : '';

    $('ls').innerHTML = state.lessons.map((l, i) =>
        `<button type="button" data-i="${i}" title="${l.shortTitle}" aria-label="Bài ${l.number}: ${l.shortTitle}" class="${i === idx ? 'on' : ''}">${l.number}</button>`
    ).join('');
    renderTOCList();
}

function renderTOCList() {
    toc.innerHTML = state.tocItems.map(it => {
        const cls = it.level === 1 ? 'l1' : it.level === 3 ? 'sub' : '';
        return `<a href="#${it.id}" class="${cls}">${it.title.replace(/\*\*/g, '').replace(/`/g, '')}</a>`;
    }).join('');
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([toc]).catch(() => {});
    }
    markActive();
}

let ticking = false;
function markActive() {
    ticking = false;
    if (mn.hidden) return;
    let cur = null;
    toc.querySelectorAll('a').forEach(a => {
        const t = document.getElementById(a.getAttribute('href').slice(1));
        a.classList.remove('on');
        if (t && t.getBoundingClientRect().top <= 120) cur = a;
    });
    if (cur) cur.classList.add('on');
}

function selectLesson(i) {
    state.currentLessonIndex = i;
    renderCurrentLesson();
    window.scrollTo({ top: 0 });
}

// ---------- Popup: quiz (M), bảng công thức (H), phòng thí nghiệm (L) ----------
function toggleQuiz() {
    openMenu(false);
    if (formulasOpen()) FORMULAS.toggle(false);
    loadQuiz().then(Q => Q.toggle()).catch(onFail);
}
function toggleFormulas() {
    openMenu(false);
    if (quizOpen()) QZ.toggle(false);
    loadFormulas().then(F => F.toggle()).catch(onFail);
}
function toggleLab(open, num, tab) {
    openMenu(false);
    if (quizOpen()) QZ.toggle(false);
    if (formulasOpen()) FORMULAS.toggle(false);
    loadLab().then(L => {
        const cur = state.lessons[state.currentLessonIndex];
        L.toggle(num != null ? num : (cur ? cur.number : 0), open, tab);
    }).catch(onFail);
}

// ---------- Sự kiện ----------
mb.onclick = () => openMenu(mn.hidden);
mn.addEventListener('click', e => {
    const b = e.target.closest('#ls button');
    if (b) { selectLesson(+b.dataset.i); return; }
    if (e.target.closest('#toc a')) openMenu(false);
});
$('btn-quiz-pop').onclick = toggleQuiz;
$('btn-fpop').onclick = toggleFormulas;
$('btn-lab').onclick = () => toggleLab();
$('btn-prev').onclick = () => selectLesson(state.currentLessonIndex - 1);
$('btn-next').onclick = () => selectLesson(state.currentLessonIndex + 1);

// Bấm dấu bình thí nghiệm trong bài → mở thẳng lab của phần đó
document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.lab-hook');
    if (!b) return;
    e.preventDefault();
    const [l, t] = b.dataset.lab.split('.').map(Number);
    toggleLab(true, l, t - 1);
});
document.addEventListener('click', e => {
    if (!mn.hidden && !mn.contains(e.target) && !mb.contains(e.target)) openMenu(false);
});

document.addEventListener('keydown', e => {
    if (labOpen()) return; // phòng thí nghiệm tự xử lý phím
    if (e.key === 'Escape') {
        if (formulasOpen()) { FORMULAS.toggle(false); return; }
        if (quizOpen()) { QZ.toggle(false); return; }
        openMenu(false);
        return;
    }
    const t = e.target;
    if (t && t.matches && t.matches('input,textarea,select')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'h' || e.key === 'H') { e.preventDefault(); toggleFormulas(); return; }
    if (e.key === 'l' || e.key === 'L') { e.preventDefault(); toggleLab(); return; }
    if (e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleQuiz(); return; }
    if (quizOpen()) QZ.key(e);
});
addEventListener('scroll', () => {
    if (!ticking && !mn.hidden) { ticking = true; requestAnimationFrame(markActive); }
}, { passive: true });

// ---------- Khởi động ----------
window.addEventListener('DOMContentLoaded', () => {
    parseCourseContent();
    // "Bài 0" = trang quiz (dữ liệu nạp lười từ quiz/)
    state.lessons.unshift({ index: 0, number: 0, shortTitle: 'Quiz trắc nghiệm', sections: {}, quiz: true });
    state.lessons.forEach((l, i) => { l.index = i; });
    state.currentLessonIndex = 1;
    renderCurrentLesson();
});
