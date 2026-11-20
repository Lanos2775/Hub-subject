const $ = id => document.getElementById(id);

/* Đóng/mở khung giải thích bài tập */
function togglePanel(id) {
  const el = $(id);
  if (el) el.classList.toggle('open');
}
window.togglePanel = togglePanel;

/* ==========================================================================
   WIDGET MÔ PHỎNG TUẦN 4: HỒI QUY TUYẾN TÍNH OLS & PHẦN DƯ
   ========================================================================== */
function updateOLSSim() {
  const rEl = $('ols-r-slider');
  if (!rEl) return;
  const r = parseFloat(rEl.value);
  if ($('ols-r-val')) $('ols-r-val').textContent = (r >= 0 ? '+' : '') + r.toFixed(2);
  const r2 = (r * r * 100).toFixed(2);
  if ($('ols-r2-val')) $('ols-r2-val').textContent = r2 + '%';

  const svg = $('ols-svg');
  if (!svg) return;
  svg.innerHTML = '';

  const cx = 250, cy = 150;
  svg.innerHTML += '<line x1="40" y1="260" x2="460" y2="260" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>';
  svg.innerHTML += '<line x1="40" y1="40" x2="40" y2="260" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>';
  svg.innerHTML += `<circle cx="${cx}" cy="${cy}" r="5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5"/>`;
  svg.innerHTML += `<text x="${cx + 8}" y="${cy - 6}" fill="#f59e0b" font-size="12" font-weight="bold">(x̄, ȳ)</text>`;

  const basePoints = [
    [-140, -100], [-110, -70], [-80, -90], [-50, -40],
    [-20, -10], [10, 20], [40, 10], [70, 60],
    [90, 80], [120, 70], [140, 110], [-60, -20]
  ];

  let slope = r * 0.7;
  const x1 = 60, y1 = cy - slope * (x1 - cx);
  const x2 = 440, y2 = cy - slope * (x2 - cx);
  svg.innerHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e2b714" stroke-width="2.5" stroke-linecap="round"/>`;

  basePoints.forEach(([dx, dy]) => {
    const px = cx + dx;
    const pyTrue = cy - (r * dy + (1 - Math.abs(r)) * dx * 0.4);
    const pyPred = cy - slope * dx;

    svg.innerHTML += `<line x1="${px}" y1="${pyTrue}" x2="${px}" y2="${pyPred}" stroke="#e0707c" stroke-width="1" stroke-dasharray="2,2"/>`;
    svg.innerHTML += `<circle cx="${px}" cy="${pyTrue}" r="3.5" fill="#7fc29b"/>`;
  });

  if ($('ols-desc')) {
    $('ols-desc').innerHTML = 'Đường hồi quy $\\hat{y} = b_0 + b_1 x$ (màu vàng) luôn cắt qua điểm trung tâm $(\\bar{x}, \\bar{y})$ (chấm cam). Các đoạn nét đứt màu đỏ là phần dư $e_i$. Tổng $\\sum e_i = 0$!';
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([$('ols-desc')]).catch(() => {});
  }
}
window.updateOLSSim = updateOLSSim;

/* ==========================================================================
   WIDGET MÔ PHỎNG TUẦN 5: ĐỊNH LÝ BAYES & XÉT NGHIỆM Y TẾ
   ========================================================================== */
function updateBayesSim() {
  const prevEl = $('by-prev');
  if (!prevEl) return;
  const prev = parseFloat(prevEl.value);
  const sens = parseFloat($('by-sens').value);
  const spec = parseFloat($('by-spec').value);

  if ($('by-prev-val')) $('by-prev-val').textContent = (prev * 100).toFixed(1) + '%';
  if ($('by-sens-val')) $('by-sens-val').textContent = (sens * 100).toFixed(1) + '%';
  if ($('by-spec-val')) $('by-spec-val').textContent = (spec * 100).toFixed(1) + '%';

  const pPosGivenSick = sens;
  const pPosGivenHealthy = 1 - spec;
  const pTotalPos = (prev * pPosGivenSick) + ((1 - prev) * pPosGivenHealthy);
  const postProb = (prev * pPosGivenSick) / pTotalPos;

  if ($('by-result')) $('by-result').textContent = (postProb * 100).toFixed(1) + '%';
  const out100kSickPos = Math.round(100000 * prev * sens);
  const out100kFalsePos = Math.round(100000 * (1 - prev) * (1 - spec));
  if ($('by-explain')) {
    $('by-explain').innerHTML = `Trong 100.000 người, có <b>${out100kSickPos}</b> ca dương tính thật và <b>${out100kFalsePos}</b> ca dương tính giả!`;
  }
}
window.updateBayesSim = updateBayesSim;

/* ==========================================================================
   WIDGET MÔ PHỎNG TUẦN 7: PHÂN PHỐI CHUẨN GAUSS & TRA Z-SCORE
   ========================================================================== */
function normalCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  let p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  if (z > 0) p = 1 - p;
  return p;
}

function updateNormSim() {
  const muEl = $('norm-mu');
  if (!muEl) return;
  const mu = parseFloat(muEl.value) || 100;
  const sigma = Math.max(0.1, parseFloat($('norm-sigma').value) || 15);
  const x = parseFloat($('norm-x').value) || 115;

  const z = (x - mu) / sigma;
  const pVal = normalCdf(z);

  if ($('norm-z-val')) $('norm-z-val').textContent = 'Z = ' + (z >= 0 ? '+' : '') + z.toFixed(2);
  if ($('norm-p-val')) $('norm-p-val').textContent = 'P(X ≤ x) = ' + (pVal * 100).toFixed(2) + '%';
  if ($('norm-tail-val')) $('norm-tail-val').textContent = 'P(X > x) = ' + ((1 - pVal) * 100).toFixed(2) + '%';

  const svg = $('norm-svg');
  if (!svg) return;
  svg.innerHTML = '';

  const w = 500, h = 240, baseline = 200;
  svg.innerHTML += `<line x1="30" y1="${baseline}" x2="470" y2="${baseline}" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>`;

  let pathD = '', areaD = `M 30 ${baseline} `;
  const zMax = 3.5, zCut = Math.max(-zMax, Math.min(zMax, z));

  for (let px = 30; px <= 470; px += 2) {
    const currZ = -zMax + (px - 30) / (440) * (2 * zMax);
    const pdf = Math.exp(-currZ * currZ / 2);
    const py = baseline - pdf * 150;
    if (px === 30) pathD += `M ${px} ${py} `;
    else pathD += `L ${px} ${py} `;

    if (currZ <= zCut) {
      areaD += `L ${px} ${py} `;
    }
  }
  const cutPx = 30 + ((zCut + zMax) / (2 * zMax)) * 440;
  areaD += `L ${cutPx} ${baseline} Z`;

  svg.innerHTML += `<path d="${areaD}" fill="rgba(226,183,20,0.3)"/>`;
  svg.innerHTML += `<path d="${pathD}" fill="none" stroke="#e2b714" stroke-width="2.5"/>`;
  svg.innerHTML += `<line x1="${cutPx}" y1="${baseline}" x2="${cutPx}" y2="${30}" stroke="#7fc29b" stroke-width="2" stroke-dasharray="3,3"/>`;
  svg.innerHTML += `<circle cx="${cutPx}" cy="${baseline}" r="4" fill="#7fc29b"/>`;
  svg.innerHTML += `<text x="${cutPx}" y="${baseline + 18}" fill="#7fc29b" font-size="11" font-weight="bold" text-anchor="middle">x=${x}</text>`;
  svg.innerHTML += `<text x="250" y="${baseline + 18}" fill="rgba(255,255,255,0.7)" font-size="11" text-anchor="middle">μ=${mu}</text>`;
}
window.updateNormSim = updateNormSim;

/* ==========================================================================
   DANH SÁCH BÀI HỌC XSTK & ĐIỀU HƯỚNG
   ========================================================================== */
const XSTK_LESSONS = [
  { id: '1', title: 'Tuần 1: Câu hỏi & Dữ liệu' },
  { id: '2', title: 'Tuần 2: Tóm tắt dữ liệu 1 biến' },
  { id: '3', title: 'Tuần 3: Tóm tắt 2 biến & Đồ họa' },
  { id: '4', title: 'Tuần 4: Tương quan & Hồi quy OLS' },
  { id: '5', title: 'Tuần 5: Nền tảng Xác suất & Bayes' },
  { id: '6', title: 'Tuần 6: Biến ngẫu nhiên & Phân phối' },
  { id: '7', title: 'Tuần 7: Kỳ vọng, Phương sai & CLT' }
];

let currentLessonId = '1';

/* ==========================================================================
   TRÌNH CHIẾU VIDEO BÀI GIẢNG (CHIẾM 96% MÀN HÌNH - TAB RA NGOÀI ĐỂ TẮT)
   ========================================================================== */
function openVideo(id) {
  const lid = id || currentLessonId;
  const overlay = $('video-modal-overlay');
  const frame = $('video-frame');
  const btn = $('tb-video');
  if (!overlay || !frame) return;

  const targetUrl = 'video/w' + lid + '.html';
  if (!frame.src.endsWith(targetUrl)) {
    frame.src = targetUrl;
  }
  overlay.hidden = false;
  if (btn) {
    btn.classList.add('on');
    btn.setAttribute('aria-pressed', 'true');
  }
}

function closeVideo() {
  const overlay = $('video-modal-overlay');
  const frame = $('video-frame');
  const btn = $('tb-video');
  if (!overlay || overlay.hidden) return;

  overlay.hidden = true;
  if (frame) frame.src = 'about:blank';
  if (btn) {
    btn.classList.remove('on');
    btn.setAttribute('aria-pressed', 'false');
  }
}

function toggleVideo() {
  const overlay = $('video-modal-overlay');
  if (overlay && !overlay.hidden) {
    closeVideo();
  } else {
    openVideo(currentLessonId);
  }
}
window.openVideo = openVideo;
window.closeVideo = closeVideo;
window.toggleVideo = toggleVideo;

/* ==========================================================================
   RENDER THANH CHỌN BÀI (#ls) & NẠP TEMPLATE BÀI HỌC
   ========================================================================== */
function renderLS(curId) {
  const lsEl = $('ls');
  if (!lsEl) return;
  lsEl.innerHTML = XSTK_LESSONS.map(l =>
    `<button type="button" data-id="${l.id}" title="${l.title}" aria-label="${l.title}" class="${String(l.id) === String(curId) ? 'on' : ''}">${l.id}</button>`
  ).join('');
  if (window.updateTaskbar) window.updateTaskbar(curId);
}

/* LỌC BỎ HOÀN TOÀN CÔNG THỨC TOÁN CHO TIÊU ĐỀ MỤC LỤC TRÁNH LỖI FORMAT */
function cleanTitleForTOC(raw) {
  return raw
    .replace(/\$[^\$]*\$/g, '')
    .replace(/\\\(.*?\\\)/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[\\_{}^]/g, '')
    .replace(/^[0-9.]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildTOC() {
  const linksEl = $('toc-links');
  if (!linksEl) return;
  linksEl.innerHTML = '';
  const headers = document.querySelectorAll('#app-content h2');
  headers.forEach((h, idx) => {
    const card = h.closest('.card, section');
    let id = card ? card.id : '';
    if (!id) {
      id = 'sec-hdr-' + idx;
      h.id = id;
    }
    const a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = cleanTitleForTOC(h.textContent);
    linksEl.appendChild(a);
  });
}

function loadLesson(lessonId) {
  currentLessonId = String(lessonId);
  const mainEl = $('app-content');
  const tpl = $('tpl-buoi-' + lessonId);
  if (tpl && mainEl) {
    mainEl.innerHTML = tpl.innerHTML;
    if (lessonId === '4') updateOLSSim();
    else if (lessonId === '5') updateBayesSim();
    else if (lessonId === '7') updateNormSim();
  }

  // Nếu modal video đang mở, cập nhật video tuần tương ứng
  const videoOverlay = $('video-modal-overlay');
  if (videoOverlay && !videoOverlay.hidden) {
    const frame = $('video-frame');
    if (frame) frame.src = 'video/w' + currentLessonId + '.html';
  }

  renderLS(lessonId);
  buildTOC();

  if (window.MathJax && MathJax.typesetPromise && mainEl) {
    MathJax.typesetPromise([mainEl]).catch(() => {});
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.loadLesson = loadLesson;

/* ==========================================================================
   KHỞI CHẠY MENU GIAO DIỆN & THANH TASKBAR
   ========================================================================== */
(function initApp() {
  const btn = $('mb'), nav = $('mn');
  const setOpen = open => {
    nav.hidden = !open;
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu và mục lục');
  };
  btn.onclick = () => setOpen(nav.hidden);
  nav.onclick = e => {
    const b = e.target.closest('#ls button');
    if (b) {
      const id = b.dataset.id;
      loadLesson(id);
      renderLS(id);
      return;
    }
    if (e.target.closest('a')) setOpen(false);
  };
  document.addEventListener('click', e => {
    if (!nav.hidden && !nav.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const videoOverlay = $('video-modal-overlay');
      if (videoOverlay && !videoOverlay.hidden) {
        closeVideo();
        return;
      }
      if (!nav.hidden) {
        setOpen(false);
        btn.focus();
      }
    }
  });

  // Modal Video: Tab/Click ra ngoài màn hình để tắt
  const videoOverlay = $('video-modal-overlay');
  if (videoOverlay) {
    videoOverlay.addEventListener('click', e => {
      if (e.target === videoOverlay) {
        closeVideo();
      }
    });
  }
  const videoCloseBtn = $('video-modal-close');
  if (videoCloseBtn) {
    videoCloseBtn.onclick = closeVideo;
  }
  const tbVideoBtn = $('tb-video');
  if (tbVideoBtn) {
    tbVideoBtn.onclick = toggleVideo;
  }

  // Phím tắt 'v' / 'V' để mở/đóng video trình chiếu
  document.addEventListener('keydown', e => {
    const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if ((e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey && (e.altKey || !typing)) {
      e.preventDefault();
      toggleVideo();
    }
  });

  addEventListener('scroll', () => {
    let cur = null;
    document.querySelectorAll('#toc-links a').forEach(a => {
      const t = document.getElementById(a.getAttribute('href').slice(1));
      if (t && t.getBoundingClientRect().top <= 120) cur = a;
      a.classList.remove('on');
    });
    if (cur) cur.classList.add('on');
  }, { passive: true });

  loadLesson('1');
})();

/* ==========================================================================
   THANH TASKBAR: NHÃN BÀI, CHUYỂN TUẦN, LÊN ĐẦU TRANG
   ========================================================================== */
(function taskbar() {
  const $ = id => document.getElementById(id);
  let cur = '1';
  const idx = () => XSTK_LESSONS.findIndex(l => String(l.id) === String(cur));
  window.updateTaskbar = id => {
    cur = String(id);
    const i = idx(), l = XSTK_LESSONS[i];
    if (!l) return;
    if ($('tb-badge')) $('tb-badge').textContent = 'Tuần ' + l.id;
    if ($('tb-title')) $('tb-title').textContent = l.title.replace(/^Tuần\s*\d+\s*:\s*/, '');
    if ($('tb-prev')) $('tb-prev').disabled = i <= 0;
    if ($('tb-next')) $('tb-next').disabled = i >= XSTK_LESSONS.length - 1;
  };
  const go = d => {
    const l = XSTK_LESSONS[idx() + d];
    if (!l) return;
    loadLesson(l.id);
    renderLS(l.id);
    window.scrollTo(0, 0);
  };
  if ($('tb-prev')) $('tb-prev').onclick = () => go(-1);
  if ($('tb-next')) $('tb-next').onclick = () => go(1);
  if ($('tb-top')) $('tb-top').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
})();

/* ==========================================================================
   GHIM CÔNG THỨC (PHÍM T)
   ========================================================================== */
(function formulaPinInit(){
  const LS = 'xstk-fp';
  const $ = id => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(LS + k); } catch (e) {} }
  };

  let rows = [], lastAdded = null, tabs = [], cur = 0;
  let picking = false, hl = null;

  function place(h) {
    const c = { h }, r = rows.find(r => r.includes(lastAdded)) || rows[rows.length - 1];
    r ? r.push(c) : rows.push([c]);
    return c;
  }

  const save = () => {
    if (tabs[cur]) tabs[cur].rows = rows;
    store.set('tabs', tabs.map(t => ({ n: t.n, rows: t.rows.map(r => r.map(c => c.h)) })));
    store.set('cur', cur);
  };

  {
    const tData = store.get('tabs', null);
    if (tData && tData.length) {
      tabs = tData.map(t => ({ n: t.n, rows: t.rows.map(a => a.map(h => ({ h }))) }));
    } else {
      tabs = [{ n: 'Tab 1', rows: [] }];
    }
    cur = Math.min(store.get('cur', 0), tabs.length - 1);
    rows = tabs[cur].rows;
  }

  const ready = () => window.MathJax && MathJax.startup && MathJax.startup.promise
    ? MathJax.startup.promise.then(() => MathJax.typesetPromise && MathJax.typesetPromise([$('fp-list')])).catch(() => {})
    : Promise.resolve();

  function renderTabs() {
    const T = $('fp-tabs');
    if (!T) return;
    T.classList.toggle('on', tabs.length > 1);
    T.innerHTML = '';
    tabs.forEach((t, i) => {
      const b = document.createElement('div');
      b.className = 'fp-tb' + (i === cur ? ' on' : '');
      b.textContent = t.n;
      if (tabs.length > 1) {
        const x = document.createElement('i');
        x.textContent = '✕';
        x.onclick = ev => { ev.stopPropagation(); closeTab(i); };
        b.appendChild(x);
      }
      b.onclick = () => switchTab(i);
      b.ondblclick = () => {
        const n = prompt('Tên tab', t.n);
        if (n && n.trim()) { t.n = n.trim().slice(0, 16); save(); renderTabs(); }
      };
      T.appendChild(b);
    });
  }

  function switchTab(i) {
    if (i === cur) return;
    tabs[cur].rows = rows;
    cur = i;
    rows = tabs[i].rows;
    lastAdded = null;
    save();
    renderTabs();
    render();
  }

  function closeTab(i) {
    if (tabs.length <= 1) return;
    tabs.splice(i, 1);
    cur = Math.max(0, Math.min(cur, tabs.length - 1));
    rows = tabs[cur].rows;
    save();
    renderTabs();
    render();
  }

  const fp = document.createElement('div');
  fp.id = 'fp';
  fp.setAttribute('role', 'dialog');
  fp.setAttribute('aria-label', 'Công thức ghim');
  fp.innerHTML = `
    <div class="fp-h" id="fp-h">
      <button class="fp-b fp-x" id="fp-x" type="button" aria-label="Đóng" title="Đóng">✕</button>
      <button class="fp-b" id="fp-add" type="button" aria-label="Thêm công thức (H)" title="Thêm công thức (H)">＋</button>
      <button class="fp-b" id="fp-tab" type="button" aria-label="Thêm tab" title="Thêm tab">❐</button>
      <div class="fp-t" id="fp-tabs"></div>
    </div>
    <div class="fp-l" id="fp-list"></div>
  `;
  document.body.appendChild(fp);

  $('fp-x').onclick = () => setOpen(false);
  $('fp-add').onclick = () => setPick(!picking);
  $('fp-tab').onclick = () => {
    tabs.push({ n: 'Tab ' + (tabs.length + 1), rows: [] });
    switchTab(tabs.length - 1);
  };

  const tbFp = $('tb-fp');
  if (tbFp) tbFp.onclick = () => toggle();

  function setOpen(on) {
    fp.classList.toggle('on', on);
    store.set('open', on);
    if (tbFp) {
      tbFp.classList.toggle('on', on);
      tbFp.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (on) { renderTabs(); render(); }
  }

  function setPick(on) {
    picking = on;
    document.body.classList.toggle('fp-pick', on);
    if ($('fp-add')) $('fp-add').classList.toggle('on', on);
  }

  function render() {
    const L = $('fp-list');
    if (!L) return;
    L.innerHTML = '';
    rows.forEach(r => {
      const d = document.createElement('div');
      d.className = 'fp-r';
      r.forEach(c => {
        const e = document.createElement('div');
        e.className = 'fp-f';
        e.innerHTML = c.h;
        e.addEventListener('contextmenu', ev => {
          ev.preventDefault();
          ev.stopPropagation();
          delCell(c);
        }, true);
        d.appendChild(e);
      });
      L.appendChild(d);
    });
    ready();
  }

  function delCell(c) {
    rows.forEach(r => {
      const i = r.indexOf(c);
      if (i > -1) r.splice(i, 1);
    });
    rows = rows.filter(r => r.length);
    if (lastAdded === c) lastAdded = null;
    save();
    render();
  }

  function findFormula(el, y) {
    const m = el && el.closest && el.closest('mjx-container, .f');
    if (!m) return null;
    return m;
  }

  function extract(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('small, .fp-hl, mjx-assistive-mml').forEach(n => { if (n.tagName === 'SMALL') n.remove(); });
    const orig = el.matches && el.matches('mjx-container') ? [el] : [...el.querySelectorAll('mjx-container')];
    const copy = clone.matches && clone.matches('mjx-container') ? [clone] : [...clone.querySelectorAll('mjx-container')];
    let items = [];
    try { if (window.MathJax && MathJax.startup && MathJax.startup.document) items = [...MathJax.startup.document.math]; } catch (e) {}
    let box = clone;
    copy.forEach((c, i) => {
      const it = items.find(m => m.typesetRoot === orig[i]);
      if (!it) return;
      const tex = it.display ? '$$' + it.math + '$$' : '$' + it.math + '$';
      if (c === clone) { box = document.createElement('div'); box.textContent = tex; }
      else c.replaceWith(document.createTextNode(tex));
    });
    box.classList && box.classList.remove('fp-hl');
    return box.innerHTML.trim();
  }

  function addPin(el) {
    const h = extract(el);
    if (!h) return false;
    if (!rows.some(r => r.some(c => c.h === h))) {
      lastAdded = place(h);
      save();
    }
    render();
    return true;
  }

  document.addEventListener('mousemove', e => {
    if (!picking) return;
    const f = findFormula(e.target, e.clientY);
    if (f === hl) return;
    if (hl) hl.classList.remove('fp-hl');
    hl = f;
    if (hl) hl.classList.add('fp-hl');
  }, true);

  document.addEventListener('click', e => {
    if (!picking || e.target.closest('#fp')) return;
    e.preventDefault();
    e.stopPropagation();
    const f = findFormula(e.target, e.clientY);
    if (f && addPin(f)) setPick(false);
  }, true);

  const toggle = () => setOpen(!fp.classList.contains('on'));

  document.addEventListener('keydown', e => {
    const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    const k = e.key;
    if ((k === 't' || k === 'T') && !e.ctrlKey && !e.metaKey && (e.altKey || !typing)) {
      e.preventDefault();
      toggle();
      return;
    }
    if ((k === 'h' || k === 'H') && !e.ctrlKey && !e.metaKey && (e.altKey || !typing)) {
      e.preventDefault();
      if (!fp.classList.contains('on')) setOpen(true);
      setPick(!picking);
      return;
    }
    if (k === 'Escape' && picking) setPick(false);
  }, true);

  window.formulaPin = { toggle, open: () => setOpen(true), close: () => setOpen(false) };
  if (store.get('open', false)) setOpen(true);
})();
