/* course.js — đọc nội dung bài học từ #raw-course-content (trong tin-hieu.html)
   và biên dịch cú pháp [H2] / [BOX] / [FIG] / [FORMULA]... + Markdown thành HTML.
   Thêm bài mới: thêm "# BÀI n" vào tin-hieu.html và một dòng vào LESSON_META bên dưới. */

// Trạng thái ứng dụng
const state = {
    lessons: [],
    currentLessonIndex: 0,
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
    { id: 11, shortTitle: "Biến đổi Laplace" }
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

    // Dấu mở phòng thí nghiệm: [LAB:bài.tab] → nút biểu tượng bình thí nghiệm nhỏ
    const LAB_RE = /\s*\[LAB:(\d+)\.(\d+)\]/g;
    const LAB_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>';
    const formatInline = (str) => {
        let s = str.trim();
        s = s.replace(LAB_RE, (_, l, t) => `<button type="button" class="lab-hook" data-lab="${l}.${t}" title="Mở mô phỏng (phòng thí nghiệm)" aria-label="Mở mô phỏng">${LAB_SVG}</button>`);
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
                title: restoreMath(titleText.replace(LAB_RE, '')),
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
            const titleText = line.slice(3).trim();
            const anchorId = `part-${sectionType}-${tocCollector.length}`;
            tocCollector.push({
                id: anchorId,
                title: restoreMath(titleText.replace(LAB_RE, '')),
                level: 2,
                sectionType
            });
            openCard = 'part';
            html += `<section id="${anchorId}" class="card ${nextColor()}"><h2>${formatInline(titleText)}</h2>`;
            i++;
            continue;
        }

        // ### Sub-heading or [H3] Quiz Question Heading
        if (line.startsWith('### ') || line.startsWith('[H3]')) {
            const isH3Tag = line.startsWith('[H3]');
            const titleText = isH3Tag ? line.replace('[H3]', '').trim() : line.slice(4).trim();
            const anchorId = `sub-${sectionType}-${tocCollector.length}`;
            tocCollector.push({
                id: anchorId,
                title: restoreMath(titleText.replace(LAB_RE, '')),
                level: 3,
                sectionType
            });

            if (sectionType === 'exercises' && isH3Tag) {
                closeQuizCardIfNeeded();
                openCard = 'quiz';
                html += `<section id="${anchorId}" class="card quiz ${nextColor()}"><h3>${formatInline(titleText)}</h3>`;
            } else {
                if (openCard === 'quiz') closeQuizCardIfNeeded();
                html += `<h3 id="${anchorId}">${formatInline(titleText)}</h3>`;
            }
            i++;
            continue;
        }

        // [FIG: id] caption
        if (line.startsWith('[FIG:')) {
            const fm = line.match(/^\[FIG:\s*([\w.]+)\]\s*(.*)$/);
            if (fm && FIGS[fm[1]]) {
                const svgStr = FIGS[fm[1]](); const vb = svgStr.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/); const ratio = vb ? (vb[1] / vb[2]).toFixed(3) : 2;
                html += `<figure style="--r:${ratio}">${svgStr}<figcaption>${formatInline(fm[2])}</figcaption></figure>`;
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
