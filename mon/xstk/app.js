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
  $('ols-r-val').textContent = (r >= 0 ? '+' : '') + r.toFixed(2);
  const r2 = (r * r * 100).toFixed(2);
  $('ols-r2-val').textContent = r2 + '%';

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
  svg.innerHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>`;

  basePoints.forEach(([dx, dy]) => {
    const px = cx + dx;
    const pyTrue = cy - (r * dy + (1 - Math.abs(r)) * dx * 0.4);
    const pyPred = cy - slope * dx;

    svg.innerHTML += `<line x1="${px}" y1="${pyTrue}" x2="${px}" y2="${pyPred}" stroke="#ec4899" stroke-width="1" stroke-dasharray="2,2"/>`;
    svg.innerHTML += `<circle cx="${px}" cy="${pyTrue}" r="3.5" fill="#38bdf8"/>`;
  });

  $('ols-desc').innerHTML = 'Đường hồi quy $\\hat{y} = b_0 + b_1 x$ (màu xanh dương) luôn cắt qua điểm trung tâm $(\\bar{x}, \\bar{y})$ (chấm vàng). Các đoạn nét đứt màu hồng là phần dư $e_i$. Tổng $\\sum e_i = 0$!';
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([$('ols-desc')]).catch(() => {});
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

  $('by-prev-val').textContent = (prev * 100).toFixed(1) + '%';
  $('by-sens-val').textContent = (sens * 100).toFixed(1) + '%';
  $('by-spec-val').textContent = (spec * 100).toFixed(1) + '%';

  const pPosGivenSick = sens;
  const pPosGivenHealthy = 1 - spec;
  const pTotalPos = (prev * pPosGivenSick) + ((1 - prev) * pPosGivenHealthy);
  const postProb = (prev * pPosGivenSick) / pTotalPos;

  $('by-result').textContent = (postProb * 100).toFixed(1) + '%';
  const out100kSickPos = Math.round(100000 * prev * sens);
  const out100kFalsePos = Math.round(100000 * (1 - prev) * (1 - spec));
  $('by-explain').innerHTML = `Trong 100.000 người, có <b>${out100kSickPos}</b> ca dương tính thật và <b>${out100kFalsePos}</b> ca dương tính giả!`;
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

  $('norm-z-val').textContent = 'Z = ' + (z >= 0 ? '+' : '') + z.toFixed(2);
  $('norm-p-val').textContent = 'P(X ≤ x) = ' + (pVal * 100).toFixed(2) + '%';
  $('norm-tail-val').textContent = 'P(X > x) = ' + ((1 - pVal) * 100).toFixed(2) + '%';

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

  svg.innerHTML += `<path d="${areaD}" fill="rgba(56,189,248,0.35)"/>`;
  svg.innerHTML += `<path d="${pathD}" fill="none" stroke="#38bdf8" stroke-width="2.5"/>`;
  svg.innerHTML += `<line x1="${cutPx}" y1="${baseline}" x2="${cutPx}" y2="${30}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,3"/>`;
  svg.innerHTML += `<circle cx="${cutPx}" cy="${baseline}" r="4" fill="#f59e0b"/>`;
  svg.innerHTML += `<text x="${cutPx}" y="${baseline + 18}" fill="#f59e0b" font-size="11" font-weight="bold" text-anchor="middle">x=${x}</text>`;
  svg.innerHTML += `<text x="250" y="${baseline + 18}" fill="rgba(255,255,255,0.7)" font-size="11" text-anchor="middle">μ=${mu}</text>`;
}
window.updateNormSim = updateNormSim;

/* ==========================================================================
   RENDER THANH CHỌN BÀI (#ls) & NẠP TEMPLATE BÀI HỌC
   ========================================================================== */
function renderLS(activeId) {
  const lsEl = $('ls');
  if (!lsEl) return;
  let html = '';
  for (let i = 1; i <= 7; i++) {
    const act = String(i) === String(activeId) ? 'class="on"' : '';
    html += `<button type="button" data-id="${i}" ${act} aria-label="Tuần ${i}">${i}</button>`;
  }
  lsEl.innerHTML = html;

  /* Thanh chọn tuần của giao diện Monkeytype (ẩn ở các giao diện khác) */
  const mtEl = $('mt-weeks');
  if (mtEl) {
    let chips = '';
    for (let i = 1; i <= 7; i++) {
      const on = String(i) === String(activeId) ? ' active' : '';
      chips += `<button type="button" class="mt-chip${on}" data-id="${i}">tuần ${i}</button>`;
    }
    mtEl.innerHTML = chips;
  }
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
    const card = h.closest('.card');
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
  const mainEl = $('app-content');
  const tpl = $('tpl-buoi-' + lessonId);
  if (tpl) {
    mainEl.innerHTML = tpl.innerHTML;
    if (lessonId === '4') updateOLSSim();
    else if (lessonId === '5') updateBayesSim();
    else if (lessonId === '7') updateNormSim();
  }

  const sel = $('lesson-select');
  if (sel) sel.value = String(lessonId);
  renderLS(lessonId);
  buildTOC();

  const mtTitle = $('mt-lesson-title');
  if (mtTitle && sel) {
    const opt = sel.options[sel.selectedIndex];
    if (opt) mtTitle.textContent = opt.textContent.toLowerCase();
  }

  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([mainEl]);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.loadLesson = loadLesson;

/* Khởi chạy ứng dụng & cài đặt đóng/mở menu góc trái */
(function initApp() {
  const btn = $('mb'), nav = $('mn');
  const setOpen = open => {
    nav.hidden = !open;
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu chọn bài và mục lục');
  };
  btn.onclick = () => setOpen(nav.hidden);
  nav.onclick = e => {
    const b = e.target.closest('#ls button');
    if (b) {
      loadLesson(b.dataset.id);
      return;
    }
    if (e.target.closest('a')) setOpen(false);
  };
  document.addEventListener('click', e => {
    /* Nút mở menu ở thanh trên của giao diện Monkeytype */
    if (e.target.closest('[data-menu-toggle]')) {
      setOpen(nav.hidden);
      return;
    }
    /* Chip chọn tuần của giao diện Monkeytype */
    const chip = e.target.closest('#mt-weeks .mt-chip');
    if (chip) {
      loadLesson(chip.dataset.id);
      return;
    }
    if (!nav.hidden && !nav.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !nav.hidden) {
      setOpen(false);
      btn.focus();
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

  $('lesson-select').value = '1';
  loadLesson('1');
})();

/* ==========================================================================
   QUẢN LÝ GIAO DIỆN (THEME MANAGER): DRACULA, LIQUID GLASS & MONKEYTYPE
   ========================================================================== */
(function themeManager() {
  const root = document.documentElement;
  const body = document.body;
  const st = (k, v) => { try { return v !== undefined ? localStorage.setItem(k, typeof v === 'object' ? JSON.stringify(v) : v) : localStorage.getItem(k); } catch (e) { return null; } };

  const KEY_THEME = 'xstk-theme';
  const KEY_BG = 'xstk-lg-bg';
  const KEY_BLUR = 'xstk-lg-blur';
  const KEY_FILL = 'xstk-lg-fill';
  const KEY_SAT = 'xstk-lg-sat';
  const KEY_ORB_BLUR = 'xstk-lg-orb-blur';
  const KEY_GLOW = 'xstk-lg-glow';
  const KEY_REFRACT = 'xstk-lg-refract';

  const THEMES = ['default', 'liquid-glass', 'monkeytype'];
  let currentTheme = st(KEY_THEME) || 'liquid-glass';
  if (THEMES.indexOf(currentTheme) === -1) currentTheme = 'liquid-glass';
  let currentBg = st(KEY_BG) || 'ios';

  const modalOverlay = $('theme-modal-overlay');
  const btnOpenModal = $('btn-theme-settings');
  const btnCloseModal = $('theme-modal-close');
  const optDefault = $('thm-opt-default');
  const optLiquid = $('thm-opt-liquid');
  const optMonkey = $('thm-opt-monkeytype');
  const lgSettingsPanel = $('lg-settings-panel');
  const defaultNotice = $('default-theme-notice');

  const rBlur = $('r-lg-blur'), oBlur = $('o-lg-blur');
  const rFill = $('r-lg-fill'), oFill = $('o-lg-fill');
  const rSat = $('r-lg-sat'), oSat = $('o-lg-sat');
  const rOrbBlur = $('r-lg-orb-blur'), oOrbBlur = $('o-lg-orb-blur');
  const bGlow = $('b-lg-glow');
  const bRefract = $('b-lg-refract');
  const bReset = $('b-lg-reset');
  const oBgLabel = $('o-lg-bg');
  const btnBgAurora = $('btn-bg-aurora');
  const btnBgIos = $('btn-bg-ios');


  function openModal(open) {
    modalOverlay.hidden = !open;
    if (open) {
      syncUI();
      btnCloseModal.focus();
    }
  }

  if (btnOpenModal) btnOpenModal.onclick = () => openModal(true);
  /* Nút cài đặt ở thanh trên và chân trang của giao diện Monkeytype */
  ['mt-settings-btn', 'mt-theme-btn'].forEach(id => {
    const el = $(id);
    if (el) el.onclick = () => openModal(true);
  });
  if (btnCloseModal) btnCloseModal.onclick = () => openModal(false);
  if (modalOverlay) {
    modalOverlay.onclick = e => {
      if (e.target === modalOverlay) openModal(false);
    };
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modalOverlay.hidden) openModal(false);
  });

  function setLgBg(bgKey) {
    currentBg = (bgKey === 'aurora') ? 'aurora' : 'ios';
    st(KEY_BG, currentBg);
    body.setAttribute('data-lg-bg', currentBg);
    if (btnBgAurora) {
      btnBgAurora.classList.toggle('active', currentBg === 'aurora');
      btnBgAurora.setAttribute('aria-checked', currentBg === 'aurora' ? 'true' : 'false');
    }
    if (btnBgIos) {
      btnBgIos.classList.toggle('active', currentBg === 'ios');
      btnBgIos.setAttribute('aria-checked', currentBg === 'ios' ? 'true' : 'false');
    }
    if (oBgLabel) oBgLabel.textContent = (currentBg === 'aurora') ? 'Aurora' : 'iOS';
  }

  if (btnBgAurora) btnBgAurora.onclick = () => setLgBg('aurora');
  if (btnBgIos) btnBgIos.onclick = () => setLgBg('ios');


  const NOTICES = {
    'default': 'Đang sử dụng giao diện <b>Dracula</b>. Chuyển sang <b>Liquid Glass</b> để thay đổi trải nghiệm đọc và bật các tuỳ chỉnh chi tiết.',
    'monkeytype': 'Đang sử dụng giao diện <b>Monkeytype</b> (Serika Dark): nền phẳng, font mono, màu nhấn vàng. Chuyển sang <b>Liquid Glass</b> để bật các tuỳ chỉnh kính.'
  };

  function setTheme(t) {
    if (THEMES.indexOf(t) === -1) t = 'liquid-glass';
    currentTheme = t;
    st(KEY_THEME, t);
    const isLg = t === 'liquid-glass';
    const isMt = t === 'monkeytype';

    optDefault.classList.toggle('active', t === 'default');
    optLiquid.classList.toggle('active', isLg);
    if (optMonkey) optMonkey.classList.toggle('active', isMt);

    body.classList.toggle('lg-theme', isLg);
    body.classList.toggle('mt-theme', isMt);

    if (isLg) {
      lgSettingsPanel.style.display = '';
      defaultNotice.style.display = 'none';
      setLgBg(currentBg);
    } else {
      body.removeAttribute('data-lg-bg');
      lgSettingsPanel.style.display = 'none';
      defaultNotice.innerHTML = NOTICES[t];
      defaultNotice.style.display = '';
    }
  }

function applyTokens() {
    const blur = st(KEY_BLUR) || '16';
    const fill = st(KEY_FILL) || '0.14';
    const sat = st(KEY_SAT) || '200';
    const orbBlur = st(KEY_ORB_BLUR) || '16';
    const glow = st(KEY_GLOW) === 'true';
    const refract = st(KEY_REFRACT) === 'true';

    root.style.setProperty('--lg-blur', blur + 'px');
    root.style.setProperty('--lg-fill', fill);
    root.style.setProperty('--lg-tint', (parseFloat(fill) * 1.15).toFixed(2));
    root.style.setProperty('--lg-sat', sat + '%');

    const orbs = $('lg-orbs');
    const iosBg = $('lg-bg-ios');
    const obNum = parseInt(orbBlur, 10);
    if (obNum === 0) {
      if (orbs) orbs.classList.add('lg-orbs-hidden');
      if (iosBg) iosBg.classList.add('lg-orbs-hidden');
    } else {
      if (orbs) {
        orbs.classList.remove('lg-orbs-hidden');
        orbs.style.filter = `blur(${obNum}px)`;
      }
      if (iosBg) {
        iosBg.classList.remove('lg-orbs-hidden');
        iosBg.style.filter = `blur(${obNum}px)`;
      }
    }

    body.classList.toggle('lg-glow-on', glow);
    root.classList.toggle('lg-refract', refract);

    if (rBlur) { rBlur.value = blur; oBlur.textContent = blur + 'px'; }
    if (rFill) { rFill.value = fill; oFill.textContent = fill; }
    if (rSat) { rSat.value = sat; oSat.textContent = sat + '%'; }
    if (rOrbBlur) { rOrbBlur.value = orbBlur; oOrbBlur.textContent = obNum === 0 ? 'Ẩn' : orbBlur + 'px'; }
    if (bGlow) {
      bGlow.setAttribute('aria-pressed', glow);
      bGlow.textContent = 'Vệt sáng chuột: ' + (glow ? 'Bật' : 'Tắt');
      bGlow.classList.toggle('active', glow);
    }
    if (bRefract) {
      bRefract.setAttribute('aria-pressed', refract);
      bRefract.textContent = 'Khúc xạ (Chrome): ' + (refract ? 'Bật' : 'Tắt');
      bRefract.classList.toggle('active', refract);
    }
  }

  function syncUI() {
    applyTokens();
    setLgBg(currentBg);
  }

  if (optDefault) optDefault.onclick = () => setTheme('default');
  if (optLiquid) optLiquid.onclick = () => setTheme('liquid-glass');
  if (optMonkey) optMonkey.onclick = () => setTheme('monkeytype');

  if (rBlur) rBlur.oninput = () => { st(KEY_BLUR, rBlur.value); applyTokens(); };
  if (rFill) rFill.oninput = () => { st(KEY_FILL, rFill.value); applyTokens(); };
  if (rSat) rSat.oninput = () => { st(KEY_SAT, rSat.value); applyTokens(); };
  if (rOrbBlur) rOrbBlur.oninput = () => { st(KEY_ORB_BLUR, rOrbBlur.value); applyTokens(); };

  if (bGlow) bGlow.onclick = () => {
    const cur = st(KEY_GLOW) === 'true';
    st(KEY_GLOW, !cur);
    applyTokens();
  };

  if (bRefract) bRefract.onclick = () => {
    const cur = st(KEY_REFRACT) === 'true';
    st(KEY_REFRACT, !cur);
    applyTokens();
  };

  if (bReset) bReset.onclick = () => {
    [KEY_BLUR, KEY_FILL, KEY_SAT, KEY_ORB_BLUR, KEY_GLOW, KEY_REFRACT].forEach(k => localStorage.removeItem(k));
    applyTokens();
  };

  // Khởi tạo theme ban đầu
  setTheme(currentTheme);
  applyTokens();

  // Vệt sáng chuột
  window.addEventListener('pointermove', e => {
    if (!body.classList.contains('lg-glow-on')) return;
    const el = e.target.closest && e.target.closest('.card, #mn, .theme-modal-box');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
})();
