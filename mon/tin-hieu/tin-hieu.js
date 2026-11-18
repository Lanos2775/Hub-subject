        // Application State
        const state = {
            lessons: [],
            currentLessonIndex: 0,
            sectionFilter: 'all', // 'all' | 'overview' | 'exercises' | 'summary'
            tocItems: [],
            cardN: 0
        };

        const LESSON_META = [
            { id: 1, shortTitle: "Hệ thống và 5 tính chất" },
            { id: 2, shortTitle: "Năng lượng và công suất tín hiệu" },
            { id: 3, shortTitle: "Phép toán trên tín hiệu" },
            { id: 4, shortTitle: "Tín hiệu tuần hoàn" },
            { id: 5, shortTitle: "Phương trình vi phân / sai phân" },
            { id: 6, shortTitle: "Tích chập và đáp ứng xung" },
            { id: 7, shortTitle: "Chuỗi Fourier và Biến đổi Fourier" },
            { id: 8, shortTitle: "Biến đổi Fourier ngược" },
            { id: 9, shortTitle: "Đáp ứng tần số của hệ thống LTI" },
            { id: 10, shortTitle: "Đồ thị phổ của tín hiệu" },
            { id: 11, shortTitle: "Biến đổi Laplace", hasLab: true }
        ];

        // Parse Raw Verbatim Content into Structured Lessons
        function parseCourseContent() {
            const rawEl = document.getElementById('raw-course-content');
            if (!rawEl) return;

            // Remove invisible zero-width spaces that might affect list parsing
            const rawText = rawEl.textContent.replace(/\u200b/g, '').trim();

            // Split by "# BÀI X" headers
            const lessonChunks = rawText.split(/^# BÀI \d+[^\n]*$/m).map(c => c.trim()).filter(Boolean);

            state.lessons = lessonChunks.map((chunk, idx) => {
                const meta = LESSON_META[idx] || {
                    id: idx + 1,
                    shortTitle: `Bài ${idx + 1}`
                };

                // Extract sections: [SECTION: baiX-overview], [SECTION: baiX-exercises], [SECTION: baiX-summary]
                const sectionRegex = /\[SECTION:\s*bai[\w-]*?-(overview|exercises|summary)\]/g;
                const sections = { overview: '', exercises: '', summary: '' };
                let match;
                const matches = [];

                while ((match = sectionRegex.exec(chunk)) !== null) {
                    matches.push({ type: match[1], startIndex: match.index, contentStart: sectionRegex.lastIndex });
                }

                for (let i = 0; i < matches.length; i++) {
                    const current = matches[i];
                    const end = (i + 1 < matches.length) ? matches[i + 1].startIndex : chunk.length;
                    sections[current.type] = chunk.slice(current.contentStart, end).trim();
                }

                return {
                    index: idx,
                    number: meta.id,
                    shortTitle: meta.shortTitle,
                    hasLab: !!meta.hasLab,
                    sections
                };
            });
        }

        // Convert custom DSL & Markdown into spacious semantic HTML while protecting LaTeX Math
        function compileSectionHTML(rawSectionText, sectionType, tocCollector) {
            if (!rawSectionText) return '';

            // 1. Protect LaTeX math expressions so markdown formatting never corrupts math symbols
            const mathStore = [];
            let text = rawSectionText;

            // Display math $$...$$
            text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
                const id = mathStore.length;
                mathStore.push({ display: true, math: math.replace(/\\\|/g, '|') });
                return `@@MATH_${id}@@`;
            });

            // Inline math $...$
            text = text.replace(/\$([^$\n]+?)\$/g, (_, math) => {
                const id = mathStore.length;
                mathStore.push({ display: false, math: math.replace(/\\\|/g, '|') });
                return `@@MATH_${id}@@`;
            });

            // Remove explicit [TABLE] and [/TABLE] wrappers (markdown table parser handles the pipe rows)
            text = text.replace(/\[\/?TABLE\]/g, '');

            // 2. Process multi-line [FORMULA...] ... [/FORMULA]
            text = text.replace(/\[FORMULA(:\s*key)?\]([\s\S]*?)\[\/FORMULA\]/g, (_, k, inner) => {
                return `\n${k ? '@@BLOCK_KEY_START@@' : '@@BLOCK_FORMULA_START@@'}\n${inner.trim()}\n@@BLOCK_FORMULA_END@@\n`;
            });

            // 3. Process multi-line [STEPS] ... [/STEPS]
            text = text.replace(/\[STEPS\]([\s\S]*?)\[\/STEPS\]/g, (_, inner) => {
                return `\n@@BLOCK_STEPS_START@@\n${inner.trim()}\n@@BLOCK_STEPS_END@@\n`;
            });

            const lines = text.split('\n');
            let html = '';
            let i = 0;
            let openCard = null; // 'part' | 'quiz'

            const closeQuizCardIfNeeded = () => {
                if (openCard) {
                    html += `</section>`;
                    openCard = null;
                }
            };
            const nextColor = () => `c${state.cardN++ % 5}`;

            const extractLabTag = (str) => {
                const m = str.match(/\s*\[LAB:\s*([^\]]+)\]\s*$/);
                return m ? { clean: str.slice(0, m.index).trim(), lab: m[1].trim() } : { clean: str, lab: '' };
            };
            const labCueHTML = (spec) => spec
                ? `<span class="lab-cue" role="link" tabindex="0" data-lab="${spec}" title="Mở mô phỏng trực quan phần này"><i class="lab-dot"></i><svg class="lab-wv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2.5l2.2-5.5 3.6 11 3.4-9 2.3 3.5H22"/></svg><span class="lab-cue-lbl">mô phỏng ↗</span></span>`
                : '';

            const formatInline = (str) => {
                let s = str.trim();
                // Bold **...**
                s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                // Italic *...*
                s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
                // Inline code `...`
                s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
                s = s.replace(/✓/g, '<span class="ok">✓</span>').replace(/✗/g, '<span class="no">✗</span>');
                return s;
            };

            const restoreMath = (str) => {
                return str.replace(/@@MATH_(\d+)@@/g, (_, idx) => {
                    const item = mathStore[Number(idx)];
                    if (!item) return '';
                    return item.display ? `$$${item.math}$$` : `$${item.math}$`;
                });
            };

            const isStructuralBoundary = (line) => {
                const t = line.trim();
                return (
                    t.startsWith('[P]') ||
                    t.startsWith('[H2]') ||
                    t.startsWith('[H3]') ||
                    t.startsWith('## ') ||
                    t.startsWith('### ') ||
                    t === '---' ||
                    t.startsWith('[BOX') ||
                    t.startsWith('[FIG') ||
                    t.startsWith('[BRIDGE]') ||
                    t.startsWith('[ANS]') ||
                    t === '@@BLOCK_FORMULA_START@@' ||
                    t === '@@BLOCK_KEY_START@@' ||
                    t === '@@BLOCK_STEPS_START@@'
                );
            };

            // Helper to render inner lines (paragraphs, lists, tables) inside boxes or steps
            const renderInnerChunk = (chunkLines, numbered) => {
                let out = '';
                let j = 0;
                while (j < chunkLines.length) {
                    const l = chunkLines[j].trim();
                    if (!l) {
                        j++;
                        continue;
                    }
                    // Table detection
                    if (l.startsWith('|') && l.endsWith('|')) {
                        const tableLines = [];
                        while (j < chunkLines.length && chunkLines[j].trim().startsWith('|')) {
                            tableLines.push(chunkLines[j].trim());
                            j++;
                        }
                        out += buildTableHTML(tableLines, formatInline);
                        continue;
                    }
                    // Unordered list
                    if (l.startsWith('- ')) {
                        out += `<ul>`;
                        while (j < chunkLines.length && chunkLines[j].trim().startsWith('- ')) {
                            out += `<li>${formatInline(chunkLines[j].trim().slice(2))}</li>`;
                            j++;
                        }
                        out += `</ul>`;
                        continue;
                    }
                    // Ordered list
                    if (/^\d+\.\s+/.test(l)) {
                        out += `<ol${numbered ? ' class="steps"' : ''}>`;
                        while (j < chunkLines.length && /^\d+\.\s+/.test(chunkLines[j].trim())) {
                            const itemText = chunkLines[j].trim().replace(/^\d+\.\s+/, '');
                            j++;
                            const subLines = [];
                            while (
                                j < chunkLines.length &&
                                chunkLines[j].trim() !== '' &&
                                !/^\d+\.\s+/.test(chunkLines[j].trim()) &&
                                !chunkLines[j].trim().startsWith('|')
                            ) {
                                subLines.push(chunkLines[j].trim());
                                j++;
                            }
                            let subHtml = '';
                            if (subLines.length > 0) {
                                subHtml = `<div class="li-sub">` + subLines.map(sl => {
                                    if (sl.startsWith('- ')) return `<div class="sb">• ${formatInline(sl.slice(2))}</div>`;
                                    return `<div>${formatInline(sl)}</div>`;
                                }).join('') + `</div>`;
                            }
                            out += `<li><div>${formatInline(itemText)}</div>${subHtml}</li>`;
                            while (j < chunkLines.length && chunkLines[j].trim() === '') j++;
                        }
                        out += `</ol>`;
                        continue;
                    }
                    // Regular paragraph inside block
                    out += `<p>${formatInline(l)}</p>`;
                    j++;
                }
                return out;
            };

            while (i < lines.length) {
                const rawLine = lines[i];
                const line = rawLine.trim();

                if (!line) {
                    i++;
                    continue;
                }

                // Horizontal Rule
                if (line === '---') {
                    i++;
                    continue;
                }

                // [H2] Main Section Title
                if (line.startsWith('[H2]')) {
                    closeQuizCardIfNeeded();
                    const titleText = line.replace('[H2]', '').trim();
                    const anchorId = `sec-${sectionType}-${tocCollector.length}`;
                    tocCollector.push({
                        id: anchorId,
                        title: restoreMath(titleText),
                        level: 1,
                        sectionType
                    });
                    html += `<h2 id="${anchorId}" class="sec-title">${formatInline(titleText)}</h2>`;
                    i++;
                    continue;
                }

                // ## Major Part Heading
                if (line.startsWith('## ')) {
                    closeQuizCardIfNeeded();
                    const { clean: titleText, lab } = extractLabTag(line.slice(3).trim());
                    const anchorId = `part-${sectionType}-${tocCollector.length}`;
                    tocCollector.push({
                        id: anchorId,
                        title: restoreMath(titleText),
                        level: 2,
                        sectionType
                    });
                    openCard = 'part';
                    html += `<section id="${anchorId}" class="card ${nextColor()}"><h2>${formatInline(titleText)}${labCueHTML(lab)}</h2>`;
                    i++;
                    continue;
                }

                // ### Sub-heading or [H3] Quiz Question Heading
                if (line.startsWith('### ') || line.startsWith('[H3]')) {
                    const isH3Tag = line.startsWith('[H3]');
                    const rawTitle = isH3Tag ? line.replace('[H3]', '').trim() : line.slice(4).trim();
                    const { clean: titleText, lab } = extractLabTag(rawTitle);
                    const anchorId = `sub-${sectionType}-${tocCollector.length}`;
                    tocCollector.push({
                        id: anchorId,
                        title: restoreMath(titleText),
                        level: 3,
                        sectionType
                    });

                    if (sectionType === 'exercises' && isH3Tag) {
                        closeQuizCardIfNeeded();
                        openCard = 'quiz';
                        html += `<section id="${anchorId}" class="card quiz ${nextColor()}"><h3>${formatInline(titleText)}${labCueHTML(lab)}</h3>`;
                    } else {
                        if (openCard === 'quiz') closeQuizCardIfNeeded();
                        html += `<h3 id="${anchorId}">${formatInline(titleText)}${labCueHTML(lab)}</h3>`;
                    }
                    i++;
                    continue;
                }

                // [FIG: id] hoặc [FIG: id | tab:preset] caption
                if (line.startsWith('[FIG:')) {
                    const fm = line.match(/^\[FIG:\s*([\w.]+)(?:\s*\|\s*([^\]]+))?\]\s*(.*)$/);
                    if (fm && FIGS[fm[1]]) {
                        const svgStr = FIGS[fm[1]](); const vb = svgStr.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/); const ratio = vb ? (vb[1] / vb[2]).toFixed(3) : 2;
                        const labSpec = fm[2] ? fm[2].trim() : '';
                        if (labSpec) {
                            html += `<figure class="lab-fig" style="--r:${ratio}" data-lab="${labSpec}" tabindex="0" role="button" aria-label="Mở mô phỏng trực quan cho hình vẽ"><div class="lab-fig-frame">${svgStr}</div><figcaption>${formatInline(fm[3])}<span class="lab-fig-whisper">· tương tác ↗</span></figcaption></figure>`;
                        } else {
                            html += `<figure style="--r:${ratio}">${svgStr}<figcaption>${formatInline(fm[3])}</figcaption></figure>`;
                        }
                    }
                    i++;
                    continue;
                }

                // [BRIDGE]
                if (line.startsWith('[BRIDGE]')) {
                    const content = line.replace('[BRIDGE]', '').trim();
                    html += `<div class="bridge">${formatInline(content)}</div>`;
                    i++;
                    continue;
                }

                // [ANS]
                if (line.startsWith('[ANS]')) {
                    const content = line.replace('[ANS]', '').trim();
                    const ansLines = [content];
                    i++;
                    while (i < lines.length && lines[i].trim() !== '' && !isStructuralBoundary(lines[i])) {
                        ansLines.push(lines[i].trim());
                        i++;
                    }
                    html += `<div class="ans">${renderInnerChunk(ansLines)}</div>`;
                    continue;
                }

                // [BOX: analogy], [BOX: warn], [BOX]
                if (line.startsWith('[BOX')) {
                    let boxClass = 'box';
                    if (line.startsWith('[BOX: analogy]')) boxClass = 'box analogy';
                    else if (line.startsWith('[BOX: warn]')) boxClass = 'box warn';

                    const firstLine = line.replace(/^\[BOX(?::\s*\w+)?\]/, '').trim();
                    const boxLines = firstLine ? [firstLine] : [];
                    i++;

                    while (i < lines.length && !isStructuralBoundary(lines[i])) {
                        boxLines.push(lines[i]);
                        i++;
                    }

                    html += `<div class="${boxClass}">${renderInnerChunk(boxLines)}</div>`;
                    continue;
                }

                // @@BLOCK_FORMULA_START@@
                if (line === '@@BLOCK_FORMULA_START@@' || line === '@@BLOCK_KEY_START@@') {
                    const isKey = line === '@@BLOCK_KEY_START@@';
                    i++;
                    const fLines = [];
                    while (i < lines.length && lines[i].trim() !== '@@BLOCK_FORMULA_END@@') {
                        fLines.push(lines[i]);
                        i++;
                    }
                    i++; // skip END
                    html += `<div class="f${isKey ? ' key' : ''}">${renderInnerChunk(fLines)}</div>`;
                    continue;
                }

                // @@BLOCK_STEPS_START@@
                if (line === '@@BLOCK_STEPS_START@@') {
                    i++;
                    const sLines = [];
                    while (i < lines.length && lines[i].trim() !== '@@BLOCK_STEPS_END@@') {
                        sLines.push(lines[i]);
                        i++;
                    }
                    i++; // skip END
                    html += `<div class="stepsbox">${renderInnerChunk(sLines, true)}</div>`;
                    continue;
                }

                // Markdown Table outside boxes
                if (line.startsWith('|') && line.endsWith('|')) {
                    const tableLines = [];
                    while (i < lines.length && lines[i].trim().startsWith('|')) {
                        tableLines.push(lines[i].trim());
                        i++;
                    }
                    html += buildTableHTML(tableLines, formatInline);
                    continue;
                }

                // Unordered list outside boxes
                if (line.startsWith('- ')) {
                    html += `<ul class="space-y-2 my-4">`;
                    while (i < lines.length && lines[i].trim().startsWith('- ')) {
                        html += `<li>${formatInline(lines[i].trim().slice(2))}</li>`;
                        i++;
                    }
                    html += `</ul>`;
                    continue;
                }

                // Ordered list outside boxes
                if (/^\d+\.\s+/.test(line)) {
                    const olLines = [];
                    while (i < lines.length && (lines[i].trim() === '' || /^\d+\.\s+/.test(lines[i].trim()) || (!isStructuralBoundary(lines[i]) && !lines[i].trim().startsWith('- ')))) {
                        if (lines[i].trim() === '' && i + 1 < lines.length && !/^\d+\.\s+/.test(lines[i + 1].trim())) {
                            break;
                        }
                        olLines.push(lines[i]);
                        i++;
                    }
                    html += renderInnerChunk(olLines);
                    continue;
                }

                // [P] or regular paragraph
                const cleanPara = line.startsWith('[P]') ? line.replace('[P]', '').trim() : line;
                html += `<p>${formatInline(cleanPara)}</p>`;
                i++;
            }

            closeQuizCardIfNeeded();
            return restoreMath(html);
        }

        function buildTableHTML(tableLines, formatInline) {
            if (tableLines.length === 0) return '';
            const parseRow = (r) => r.slice(1, -1).split('|').map(c => c.trim());
            const headers = parseRow(tableLines[0]);
            let bodyStartIndex = 1;
            if (tableLines.length > 1 && /^[\s|:-]+$/.test(tableLines[1])) {
                bodyStartIndex = 2;
            }

            let out = `<div class="tw"><table><thead><tr>`;
            headers.forEach(h => {
                out += `<th>${formatInline(h)}</th>`;
            });
            out += `</tr></thead><tbody>`;

            for (let r = bodyStartIndex; r < tableLines.length; r++) {
                const cells = parseRow(tableLines[r]);
                out += `<tr>`;
                cells.forEach(c => {
                    out += `<td>${formatInline(c)}</td>`;
                });
                out += `</tr>`;
            }
            out += `</tbody></table></div>`;
            return out;
        }

        // ---------- SVG FIGURES (key = id used by [FIG: id] in the lesson text) ----------
        const FIGS = (() => {
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


        // ---------- Quiz (Bài 10 + popup M) ----------
        const QZ = (() => {
            const isOpen = () => g('qzPop').classList.contains('open');
            let D, T, S = {}, tmp = {}, cur = 0, flt = false, pi = -1, inited = false, pageOn = false, sel = null;
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
                const j = JSON.parse(g('qz-data').textContent); D = j.q; T = j.t;
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
            function art(q, mini) {
                const s = S[q.id];
                const tools = s ? '<button class="qrs" data-re title="Làm lại">↺</button>' : '';
                const inl = (mini || !wide()) && s && exOn;
                return `<article class="qz-q" id="${mini ? 'qp' : 'qz'}${q.id}" data-id="${q.id}"><div class="qh"><b>${lab(q)}</b><span>${tools}</span></div>${q.im.map(u => `<img src="${u[0]}" style="width:${u[1]}px" alt="Câu ${lab(q)}">`).join('')}<div class="qa">${ctrl(q)}</div>${inl ? `<div class="qzx qpx" id="qpx${q.id}">${q.e}</div>` : ''}</article>`;
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
            document.addEventListener('DOMContentLoaded', () => {
                g('qzRail').onclick = e => { const b = e.target.closest('[data-r]'); if (b) goto(b.dataset.r); };
                g('qzPop').onclick = e => {
                    if (e.target === g('qzPop') || e.target.closest('#qzpClose')) { toggle(false); return; }
                    const r = e.target.closest('[data-r]'); if (r) { pi = D.findIndex(q => q.id == r.dataset.r); popRender(); return; }
                    act(e, true);
                };
                g('qzPop').onkeydown = e => { if (e.key == 'Enter' && e.target.classList.contains('qnum')) { const a = e.target.closest('.qz-q'); check(byId(a.dataset.id), a); } };
            });
            return { mount, unmount, toggle, isOpen, key };
        })();

        // ---------- UI ----------
        const $ = id => document.getElementById(id);
        const mb = $('mb'), mn = $('mn'), toc = $('toc');

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
            const lesson = state.lessons[state.currentLessonIndex];
            if (!lesson) return;

            $('lesson-chip').textContent = `Bài ${lesson.number}`;
            $('lesson-title').textContent = lesson.shortTitle;

            state.tocItems = [];
            state.cardN = 0;
            const keys = ['overview', 'exercises', 'summary'];
            let html = '';
            keys.forEach(k => {
                if (lesson.sections[k]) {
                    html += `<div class="lesson-sec" data-section="${k}">${compileSectionHTML(lesson.sections[k], k, state.tocItems)}</div>`;
                }
            });
            const container = $('lesson-container');
            document.body.classList.toggle('qz-on', !!lesson.quiz);
            const tabsEl = $('tabs');
            if (tabsEl) tabsEl.style.display = lesson.quiz ? 'none' : '';
            if (lesson.quiz) { container.innerHTML = ''; QZ.mount(container); }
            else { QZ.unmount(); container.innerHTML = html; }

            const prev = state.lessons[state.currentLessonIndex - 1];
            const next = state.lessons[state.currentLessonIndex + 1];
            const pb = $('btn-prev'), nb = $('btn-next');
            pb.disabled = !prev;
            pb.textContent = prev ? `← Bài ${prev.number}: ${prev.shortTitle}` : '';
            nb.disabled = !next;
            nb.textContent = next ? `Bài ${next.number}: ${next.shortTitle} →` : '';

            const bLab = $('btn-lab');
            if (bLab) bLab.classList.toggle('has-lab', !!lesson.hasLab);

            $('ls').innerHTML = state.lessons.map((l, i) =>
                `<button type="button" data-i="${i}" title="${l.shortTitle}${l.hasLab ? ' · Có phòng thí nghiệm' : ''}" aria-label="Bài ${l.number}: ${l.shortTitle}" class="${i === state.currentLessonIndex ? 'on' : ''}${l.hasLab ? ' has-lab' : ''}">${l.number}</button>`
            ).join('');
            renderTOCList();

            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([container]).catch(() => {});
            }
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
            state.sectionFilter = 'all';
            renderCurrentLesson();
            window.scrollTo({ top: 0 });
        }

        mb.onclick = () => openMenu(mn.hidden);
        mn.addEventListener('click', e => {
            const b = e.target.closest('#ls button');
            if (b) { selectLesson(+b.dataset.i); return; }
            if (e.target.closest('#toc a')) openMenu(false);
        });
        const tabsEl = $('tabs');
        if (tabsEl) {
            tabsEl.addEventListener('click', e => {
                const b = e.target.closest('.tab');
                if (!b) return;
                state.sectionFilter = b.dataset.filter;
                renderCurrentLesson();
            });
        }
        const btnQuiz = $('btn-quiz-pop');
        if (btnQuiz) {
            btnQuiz.onclick = () => {
                openMenu(false);
                if (isFPopOpen()) toggleFPop(false);
                QZ.toggle();
            };
        }
        const btnFpop = $('btn-fpop');
        if (btnFpop) {
            btnFpop.onclick = () => {
                openMenu(false);
                if (QZ.isOpen()) QZ.toggle(false);
                toggleFPop();
            };
        }
        // Phòng thí nghiệm (tải lười từ phong-thi-nghiem.js/.css)
        let labP = null;
        const isLabOpen = () => !!(window.LAB && window.LAB.isOpen());
        function loadLab() {
            if (window.LAB) return Promise.resolve(window.LAB);
            if (labP) return labP;
            labP = new Promise((res, rej) => {
                const l = document.createElement('link');
                l.rel = 'stylesheet'; l.href = 'phong-thi-nghiem.css';
                document.head.appendChild(l);
                const s = document.createElement('script');
                s.src = 'phong-thi-nghiem.js';
                s.onload = () => res(window.LAB);
                s.onerror = () => { labP = null; rej(new Error('lab load failed')); };
                document.head.appendChild(s);
            });
            return labP;
        }
        function toggleLab(open, opts) {
            openMenu(false);
            if (QZ.isOpen()) QZ.toggle(false);
            if (isFPopOpen()) toggleFPop(false);
            loadLab().then(L => {
                const cur = state.lessons[state.currentLessonIndex];
                L.toggle(cur ? cur.number : 0, open, opts);
            }).catch(() => {});
        }
        const btnLab = $('btn-lab');
        if (btnLab) btnLab.onclick = () => toggleLab();
        const lessonWrap = $('lesson-container');
        if (lessonWrap) {
            lessonWrap.addEventListener('click', e => {
                const trg = e.target.closest('[data-lab]');
                if (!trg) return;
                e.preventDefault();
                toggleLab(true, trg.dataset.lab);
            });
            lessonWrap.addEventListener('keydown', e => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const trg = e.target.closest('[data-lab]');
                if (!trg) return;
                e.preventDefault();
                toggleLab(true, trg.dataset.lab);
            });
        }
        $('btn-prev').onclick = () => selectLesson(state.currentLessonIndex - 1);
        $('btn-next').onclick = () => selectLesson(state.currentLessonIndex + 1);

        document.addEventListener('click', e => {
            if (!mn.hidden && !mn.contains(e.target) && !mb.contains(e.target)) openMenu(false);
        });
        // Formula sheet popup (phím H)
        let fPopTypeset = false;
        const isFPopOpen = () => { const p = document.getElementById('fPop'); return p && p.classList.contains('open'); };
        function toggleFPop(open) {
            const p = document.getElementById('fPop');
            if (!p) return;
            const willOpen = open === undefined ? !isFPopOpen() : !!open;
            p.classList.toggle('open', willOpen);
            if (willOpen && !fPopTypeset) {
                fPopTypeset = true;
                if (window.MathJax && window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise([p]).catch(() => {});
                }
            }
        }
        document.addEventListener('DOMContentLoaded', () => {
            const fp = document.getElementById('fPop');
            if (fp) {
                fp.onclick = e => { if (e.target === fp || e.target.closest('#fpopClose')) toggleFPop(false); };
            }
        });

        document.addEventListener('keydown', e => {
            if (isLabOpen()) return; // phòng thí nghiệm tự xử lý phím
            if (e.key === 'Escape') {
                if (isFPopOpen()) { toggleFPop(false); return; }
                if (QZ.isOpen()) { QZ.toggle(false); return; }
                openMenu(false);
                return;
            }
            const t = e.target;
            if (t && t.matches && t.matches('input,textarea,select')) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key === 'h' || e.key === 'H') {
                e.preventDefault();
                openMenu(false);
                if (QZ.isOpen()) QZ.toggle(false);
                toggleFPop();
                return;
            }
            if (e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                toggleLab();
                return;
            }
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                openMenu(false);
                if (isFPopOpen()) toggleFPop(false);
                QZ.toggle();
                return;
            }
            else if (QZ.isOpen()) QZ.key(e);
        });
        addEventListener('scroll', () => {
            if (!ticking && !mn.hidden) { ticking = true; requestAnimationFrame(markActive); }
        }, { passive: true });

        window.addEventListener('DOMContentLoaded', () => {
            parseCourseContent();
            state.lessons.unshift({ index: 0, number: 0, shortTitle: 'Quiz trắc nghiệm 109 câu', sections: {}, quiz: true });
            state.lessons.forEach((l, i) => { l.index = i; });
            const sp = new URLSearchParams(location.search);
            const initBai = +(sp.get('bai') || 0);
            const found = initBai ? state.lessons.findIndex(l => l.number === initBai) : -1;
            state.currentLessonIndex = found >= 0 ? found : 1;
            renderCurrentLesson();
            const initLab = sp.get('lab');
            if (initLab) toggleLab(true, initLab === '1' ? undefined : initLab);
        });

