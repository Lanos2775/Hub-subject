const $ = id => document.getElementById(id);

/* 1. Hàm đóng/mở khung Gợi ý & Lời giải chi tiết */
function togglePanel(id) {
  const el = $(id);
  if (el) el.classList.toggle('open');
}
window.togglePanel = togglePanel;

/* ==========================================================================
   MÔ HÌNH TƯƠNG TÁC BÀI 5: MẠCH LOGIC & TIỂU HẠNG (MINTERM)
   ========================================================================== */
let currentBoolMode = 'vote';

function selectBoolMode(mode, btn) {
  currentBoolMode = mode;
  if (btn) {
    document.querySelectorAll('#bool-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderBoolSim();
}
window.selectBoolMode = selectBoolMode;

function renderBoolSim() {
  const svgEl = $('bool-svg'), descEl = $('bool-desc');
  if (!svgEl || !descEl) return;

  const x = +$('sl-bx').value;
  const y = +$('sl-by').value;
  const z = +$('sl-bz').value;

  $('val-bx').textContent = x;
  $('val-by').textContent = y;
  $('val-bz').textContent = z;

  const mintermLatex = `${x ? 'x' : '\\overline{x}'}${y ? 'y' : '\\overline{y}'}${z ? 'z' : '\\overline{z}'}`;
  let outVal = 0, out2Val = 0, exprText = '', circuitTitle = '';

  if (currentBoolMode === 'vote') {
    outVal = (x && y) || (x && z) || (y && z) ? 1 : 0;
    circuitTitle = 'Mạch Biểu Quyết Đa Số (3 người $x, y, z$)';
    exprText = `Đầu ra $F(x,y,z) = xy + xz + yz = ${x}\\cdot${y} + ${x}\\cdot${z} + ${y}\\cdot${z} = \\mathbf{${outVal}}$ (${outVal ? 'Đề xuất ĐƯỢC THÔNG QUA' : 'Đề xuất BỊ TỪ CHỐI'}).`;
  } else if (currentBoolMode === 'adder') {
    outVal = (x ^ y); // Sum
    out2Val = (x & y); // Carry
    circuitTitle = 'Bộ Bán Cộng Nhị Phân (Half Adder — dùng 2 bit $x, y$)';
    exprText = `Bit Tổng $\\text{Sum} = (x+y)\\overline{(xy)} = \\mathbf{${outVal}}$ | Bit Nhớ $\\text{Carry} = xy = \\mathbf{${out2Val}}$ (Kết quả nhị phân: $x+y = ${out2Val}${outVal}_2$).`;
  } else {
    outVal = (x ^ y ^ z);
    circuitTitle = 'Mạch Điều Khiển Đèn Cầu Thang 3 Công Tắc ($x, y, z$)';
    exprText = `Đầu ra $F = xyz + x\\overline{y}\\overline{z} + \\overline{x}y\\overline{z} + \\overline{x}\\overline{y}z = \\mathbf{${outVal}}$ (${outVal ? 'ĐÈN ĐANG SÁNG' : 'ĐÈN ĐANG TẮT'}).`;
  }

  descEl.innerHTML = `<b>${circuitTitle}:</b> Bộ đầu vào hiện tại là $(x=${x}, y=${y}, z=${z})$ ứng với tiểu hạng $\\mathbf{${mintermLatex} = 1}$.<br>${exprText}`;

  const cOn = 'var(--c2)', cOff = 'var(--mut)';
  const colX = x ? cOn : cOff;
  const colY = y ? cOn : cOff;
  const colZ = z ? cOn : cOff;
  const colOut = outVal ? 'var(--c4)' : cOff;

  let svg = '';
  // Vẽ 3 nút đầu vào bên trái
  const drawNode = (cx, cy, label, val, col) => `
    <rect x="${cx-36}" y="${cy-18}" width="72" height="36" rx="10" fill="var(--card)" stroke="${col}" stroke-width="2.5"/>
    <text x="${cx}" y="${cy+5}" text-anchor="middle" style="font-weight:800;fill:${col}">${label} = ${val}</text>
  `;

  svg += drawNode(65, 50, 'x', x, colX);
  svg += drawNode(65, 115, 'y', y, colY);
  if (currentBoolMode !== 'adder') {
    svg += drawNode(65, 180, 'z', z, colZ);
  }

  // Vẽ khối xử lý trung tâm & đường dây
  if (currentBoolMode === 'adder') {
    const colCarry = out2Val ? 'var(--c1)' : cOff;
    svg += `<line x1="101" y1="50" x2="250" y2="70" stroke="${colX}" stroke-width="3"/>`;
    svg += `<line x1="101" y1="115" x2="250" y2="90" stroke="${colY}" stroke-width="3"/>`;
    svg += `<line x1="101" y1="50" x2="250" y2="155" stroke="${colX}" stroke-width="3"/>`;
    svg += `<line x1="101" y1="115" x2="250" y2="175" stroke="${colY}" stroke-width="3"/>`;

    svg += `<rect x="250" y="50" width="170" height="55" rx="14" fill="var(--card)" stroke="var(--c5)" stroke-width="2.5"/>`;
    svg += `<text x="335" y="83" text-anchor="middle" style="font-weight:700">Cổng XOR: (x+y)(xy)'</text>`;

    svg += `<rect x="250" y="138" width="170" height="55" rx="14" fill="var(--card)" stroke="var(--c1)" stroke-width="2.5"/>`;
    svg += `<text x="335" y="171" text-anchor="middle" style="font-weight:700">Cổng AND: x · y</text>`;

    svg += `<line x1="420" y1="78" x2="520" y2="78" stroke="${colOut}" stroke-width="3.5"/>`;
    svg += `<line x1="420" y1="165" x2="520" y2="165" stroke="${colCarry}" stroke-width="3.5"/>`;

    svg += `<rect x="520" y="53" width="135" height="50" rx="14" fill="var(--card)" stroke="${colOut}" stroke-width="3"/>`;
    svg += `<text x="587" y="83" text-anchor="middle" style="font-weight:800;fill:${colOut}">Sum = ${outVal}</text>`;

    svg += `<rect x="520" y="140" width="135" height="50" rx="14" fill="var(--card)" stroke="${colCarry}" stroke-width="3"/>`;
    svg += `<text x="587" y="170" text-anchor="middle" style="font-weight:800;fill:${colCarry}">Carry = ${out2Val}</text>`;
  } else {
    svg += `<line x1="101" y1="50" x2="230" y2="95" stroke="${colX}" stroke-width="3"/>`;
    svg += `<line x1="101" y1="115" x2="230" y2="115" stroke="${colY}" stroke-width="3"/>`;
    svg += `<line x1="101" y1="180" x2="230" y2="135" stroke="${colZ}" stroke-width="3"/>`;

    svg += `<rect x="230" y="65" width="220" height="100" rx="18" fill="var(--card)" stroke="var(--c5)" stroke-width="2.5"/>`;
    svg += `<text x="340" y="105" text-anchor="middle" style="font-weight:800;fill:var(--c5)">${currentBoolMode === 'vote' ? 'MẠCH TỔ HỢP AND-OR' : 'MẠCH ĐÈN 3 CÔNG TẮC'}</text>`;
    svg += `<text x="340" y="132" text-anchor="middle" style="font-size:12.5px;fill:var(--mut)">${currentBoolMode === 'vote' ? 'F = xy + xz + yz' : 'Bật khi số bit 1 là số lẻ'}</text>`;

    svg += `<line x1="450" y1="115" x2="525" y2="115" stroke="${colOut}" stroke-width="4"/>`;
    svg += `<rect x="525" y="82" width="135" height="66" rx="16" fill="var(--card)" stroke="${colOut}" stroke-width="3.5"/>`;
    svg += `<text x="592" y="112" text-anchor="middle" style="font-weight:800;fill:${colOut}">ĐẦU RA F = ${outVal}</text>`;
    svg += `<text x="592" y="133" text-anchor="middle" style="font-size:12px;font-weight:700;fill:${colOut}">${outVal ? '● CÓ ĐIỆN (1)' : '○ NGẮT ĐIỆN (0)'}</text>`;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderBoolSim = renderBoolSim;

/* ==========================================================================
   MÔ HÌNH TƯƠNG TÁC BÀI 6: MẬT MÃ RSA, DIFFIE-HELLMAN & CAESAR
   ========================================================================== */
let currentCryptoMode = 'rsa';

// Hàm lũy thừa mô-đu-lô nhanh chuẩn xác
function modPow(base, exp, mod) {
  let res = 1n;
  let b = BigInt(base) % BigInt(mod);
  let e = BigInt(exp);
  const m = BigInt(mod);
  while (e > 0n) {
    if (e % 2n === 1n) res = (res * b) % m;
    b = (b * b) % m;
    e /= 2n;
  }
  return Number(res);
}

function selectCryptoMode(mode, btn) {
  currentCryptoMode = mode;
  if (btn) {
    document.querySelectorAll('#crypto-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderCryptoSim();
}
window.selectCryptoMode = selectCryptoMode;

function renderCryptoSim() {
  const svgEl = $('crypto-svg'), descEl = $('crypto-desc');
  if (!svgEl || !descEl) return;

  const pairIdx = $('sel-cr-pair') ? +$('sel-cr-pair').value : 0;
  const mVal = +$('sl-cr-m').value;
  const kVal = +$('sl-cr-k').value;

  $('val-cr-m').textContent = mVal;
  $('val-cr-k').textContent = kVal;

  const rsaConfigs = [
    { p: 43, q: 59, n: 2537, phi: 2436, e: 13, d: 937 },
    { p: 11, q: 13, n: 143,  phi: 120,  e: 7,  d: 103 },
    { p: 17, q: 23, n: 391,  phi: 352,  e: 3,  d: 235 }
  ];
  const cfg = rsaConfigs[pairIdx] || rsaConfigs[0];

  let svg = '';

  if (currentCryptoMode === 'rsa') {
    const C = modPow(mVal, cfg.e, cfg.n);
    const M_dec = modPow(C, cfg.d, cfg.n);
    const binE = cfg.e.toString(2);

    descEl.innerHTML = `<b>Trạng thái Hệ mật mã RSA:</b> Khóa công khai $(n = ${cfg.p}\\times${cfg.q} = \\mathbf{${cfg.n}},\\ e = \\mathbf{${cfg.e}})$ | $\\varphi(n) = (p-1)(q-1) = \\mathbf{${cfg.phi}}$ | Khóa giải mã bí mật $\\mathbf{d = ${cfg.d}}$ (vì $${cfg.e}\\times${cfg.d} \\equiv 1 \\pmod{${cfg.phi}}$).<br>
    • <b>Bước Mã hóa:</b> Bản rõ $M = \\mathbf{${mVal}} \\xrightarrow{e=${cfg.e}=(${binE})_2} C = ${mVal}^{${cfg.e}} \\bmod ${cfg.n} = \\mathbf{${C}}$.<br>
    • <b>Bước Giải mã:</b> Bản mã $C = \\mathbf{${C}} \\xrightarrow{d=${cfg.d}} M = ${C}^{${cfg.d}} \\bmod ${cfg.n} = \\mathbf{${M_dec}}$ (Khôi phục chính xác 100%!).`;

    // Vẽ sơ đồ luồng RSA 3 bước
    svg += `
      <rect x="24" y="55" width="165" height="140" rx="16" fill="var(--card)" stroke="var(--c2)" stroke-width="3"/>
      <text x="106" y="88" text-anchor="middle" style="font-weight:800;fill:var(--c2)">1. BẢN RÕ GỐC (M)</text>
      <text x="106" y="130" text-anchor="middle" style="font-size:26px;font-weight:800;fill:var(--ink)">M = ${mVal}</text>
      <text x="106" y="168" text-anchor="middle" style="font-size:12px;fill:var(--mut)">Chưa mã hóa</text>

      <line x1="189" y1="125" x2="255" y2="125" stroke="var(--c1)" stroke-width="3.5"/>
      <text x="222" y="112" text-anchor="middle" style="font-size:12px;font-weight:700;fill:var(--c1)">M^${cfg.e} mod ${cfg.n}</text>

      <rect x="255" y="45" width="170" height="160" rx="16" fill="var(--card)" stroke="var(--c4)" stroke-width="3"/>
      <text x="340" y="78" text-anchor="middle" style="font-weight:800;fill:var(--c4)">2. BẢN MÃ (C)</text>
      <text x="340" y="125" text-anchor="middle" style="font-size:26px;font-weight:800;fill:var(--c4)">C = ${C}</text>
      <text x="340" y="158" text-anchor="middle" style="font-size:12px;fill:var(--mut)">Truyền qua Internet</text>
      <text x="340" y="180" text-anchor="middle" style="font-size:11.5px;font-weight:700;fill:var(--c5)">Khóa công khai (${cfg.n}, ${cfg.e})</text>

      <line x1="425" y1="125" x2="491" y2="125" stroke="var(--c5)" stroke-width="3.5"/>
      <text x="458" y="112" text-anchor="middle" style="font-size:12px;font-weight:700;fill:var(--c5)">C^${cfg.d} mod ${cfg.n}</text>

      <rect x="491" y="55" width="165" height="140" rx="16" fill="var(--card)" stroke="var(--c2)" stroke-width="3"/>
      <text x="573" y="88" text-anchor="middle" style="font-weight:800;fill:var(--c2)">3. GIẢI MÃ (M)</text>
      <text x="573" y="130" text-anchor="middle" style="font-size:26px;font-weight:800;fill:var(--c2)">M = ${M_dec}</text>
      <text x="573" y="168" text-anchor="middle" style="font-size:12px;font-weight:700;fill:var(--c5)">Dùng khóa bí mật d = ${cfg.d}</text>
    `;
  } else if (currentCryptoMode === 'dh') {
    const p = 23, a = 5;
    const k1 = mVal, k2 = kVal;
    const YA = modPow(a, k1, p);
    const YB = modPow(a, k2, p);
    const KA = modPow(YB, k1, p);
    const KB = modPow(YA, k2, p);

    descEl.innerHTML = `<b>Giao thức Trao đổi khóa Diffie-Hellman:</b> Tham số công khai $p = \\mathbf{23}$, căn nguyên thủy $a = \\mathbf{5}$.<br>
    • <b>Alice</b> chọn số bí mật $k_1 = \\mathbf{${k1}}$, tính $Y_A = 5^{${k1}} \\bmod 23 = \\mathbf{${YA}}$ gửi cho Bob.<br>
    • <b>Bob</b> chọn số bí mật $k_2 = \\mathbf{${k2}}$, tính $Y_B = 5^{${k2}} \\bmod 23 = \\mathbf{${YB}}$ gửi cho Alice.<br>
    • <b>Khóa bí mật chung thiết lập được:</b> Alice tính $(Y_B)^{k_1} \\bmod 23 = ${YB}^{${k1}} \\bmod 23 = \\mathbf{${KA}}$ | Bob tính $(Y_A)^{k_2} \\bmod 23 = ${YA}^{${k2}} \\bmod 23 = \\mathbf{${KB}}$.`;

    svg += `
      <rect x="28" y="35" width="195" height="180" rx="16" fill="var(--card)" stroke="var(--c1)" stroke-width="3"/>
      <text x="125" y="66" text-anchor="middle" style="font-weight:800;fill:var(--c1)">ALICE (Bí mật k₁ = ${k1})</text>
      <text x="125" y="102" text-anchor="middle" style="font-size:13.5px">Tính công khai:</text>
      <text x="125" y="128" text-anchor="middle" style="font-weight:800;fill:var(--ink)">Y_A = 5^${k1} mod 23 = ${YA}</text>
      <text x="125" y="170" text-anchor="middle" style="font-weight:800;fill:var(--c2)">Khóa chung K = ${KA}</text>

      <line x1="223" y1="95" x2="457" y2="95" stroke="var(--c3)" stroke-width="3" stroke-dasharray="6,4"/>
      <text x="340" y="84" text-anchor="middle" style="font-weight:700;fill:var(--ink)">Gửi công khai Y_A = ${YA} →</text>

      <line x1="457" y1="145" x2="223" y2="145" stroke="var(--c4)" stroke-width="3" stroke-dasharray="6,4"/>
      <text x="340" y="134" text-anchor="middle" style="font-weight:700;fill:var(--ink)">← Gửi công khai Y_B = ${YB}</text>

      <rect x="457" y="35" width="195" height="180" rx="16" fill="var(--card)" stroke="var(--c5)" stroke-width="3"/>
      <text x="554" y="66" text-anchor="middle" style="font-weight:800;fill:var(--c5)">BOB (Bí mật k₂ = ${k2})</text>
      <text x="554" y="102" text-anchor="middle" style="font-size:13.5px">Tính công khai:</text>
      <text x="554" y="128" text-anchor="middle" style="font-weight:800;fill:var(--ink)">Y_B = 5^${k2} mod 23 = ${YB}</text>
      <text x="554" y="170" text-anchor="middle" style="font-weight:800;fill:var(--c2)">Khóa chung K = ${KB}</text>
    `;
  } else {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const pIdx = mVal % 26;
    const cIdx = (pIdx + kVal) % 26;
    const pChar = alphabet[pIdx];
    const cChar = alphabet[cIdx];

    descEl.innerHTML = `<b>Mật mã dịch chuyển Caesar (Modulo 26):</b> Đang chọn chữ cái gốc <b>'${pChar}'</b> (số thứ tự $p = \\mathbf{${pIdx}}$) và khóa dịch chuyển $k = \\mathbf{${kVal}}$ vị trí.<br>
    • <b>Hàm mã hóa:</b> $f(${pIdx}) = (${pIdx} + ${kVal}) \\bmod 26 = \\mathbf{${cIdx}}$ $\\rightarrow$ Chữ cái mã hóa là <b>'${cChar}'</b>.<br>
    • <b>Hàm giải mã:</b> $f^{-1}(${cIdx}) = (${cIdx} - ${kVal}) \\bmod 26 = \\mathbf{${pIdx}}$ $\\rightarrow$ Trở về chữ cái gốc <b>'${pChar}'</b>.`;

    svg += `
      <rect x="45" y="55" width="180" height="140" rx="18" fill="var(--card)" stroke="var(--c2)" stroke-width="3"/>
      <text x="135" y="88" text-anchor="middle" style="font-weight:800;fill:var(--c2)">CHỮ CÁI RÕ (p)</text>
      <text x="135" y="138" text-anchor="middle" style="font-size:34px;font-weight:800">'${pChar}' (${pIdx < 10 ? '0'+pIdx : pIdx})</text>

      <line x1="225" y1="105" x2="455" y2="105" stroke="var(--c1)" stroke-width="3.5"/>
      <text x="340" y="92" text-anchor="middle" style="font-weight:800;fill:var(--c1)">Mã hóa: (p + ${kVal}) mod 26 →</text>

      <line x1="455" y1="150" x2="225" y2="150" stroke="var(--c5)" stroke-width="3.5" stroke-dasharray="5,5"/>
      <text x="340" y="175" text-anchor="middle" style="font-weight:800;fill:var(--c5)">← Giải mã: (c - ${kVal}) mod 26</text>

      <rect x="455" y="55" width="180" height="140" rx="18" fill="var(--card)" stroke="var(--c4)" stroke-width="3"/>
      <text x="545" y="88" text-anchor="middle" style="font-weight:800;fill:var(--c4)">CHỮ CÁI MÃ (c)</text>
      <text x="545" y="138" text-anchor="middle" style="font-size:34px;font-weight:800;fill:var(--c4)">'${cChar}' (${cIdx < 10 ? '0'+cIdx : cIdx})</text>
    `;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderCryptoSim = renderCryptoSim;

/* ==========================================================================
   MÔ HÌNH TƯƠNG TÁC PHẦN 5: QUY NẠP TOÁN HỌC, FIBONACCI & ĐỆ QUY LŨY THỪA
   ========================================================================== */
let currentIndMode = 'odd';

function selectIndMode(mode, btn) {
  currentIndMode = mode;
  if (btn) {
    document.querySelectorAll('#ind-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderIndSim();
}
window.selectIndMode = selectIndMode;

function renderIndSim() {
  const svgEl = $('ind-svg'), descEl = $('ind-desc');
  if (!svgEl || !descEl) return;

  const n = +$('sl-ind-n').value;
  const a = +$('sl-ind-a').value;
  $('val-ind-n').textContent = n;
  $('val-ind-a').textContent = a;

  const colors = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];
  let svg = '';

  if (currentIndMode === 'odd') {
    const terms = [];
    for (let i = 1; i <= n; i++) terms.push(2 * i - 1);
    const lastOdd = 2 * n - 1;
    descEl.innerHTML = `<b>Chứng minh hình học Tổng $n = ${n}$ số lẻ đầu tiên:</b> Mỗi bước quy nạp từ $k-1 \\to k$ chính là ghép thêm một đường viền chữ L gồm $\\mathbf{2k-1}$ ô vuông vào hình vuông cũ!<br>
    $$${terms.join(' + ')} = \\mathbf{${n}^2 = ${n * n}}$$
    Lớp ngoài cùng vừa ghép thêm (bậc $n=${n}$) có đúng $2(${n})-1 = \\mathbf{${lastOdd}}$ ô vuông.`;

    const cellSize = Math.min(18, Math.floor(185 / n));
    const startX = 75, startY = 30;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const layer = Math.max(r, c);
        const col = colors[layer % colors.length];
        const isOuter = (layer === n - 1);
        svg += `<rect x="${startX + c * cellSize}" y="${startY + r * cellSize}" width="${cellSize - 2}" height="${cellSize - 2}" rx="3" fill="${col}" opacity="${isOuter ? '1' : '0.45'}"/>`;
      }
    }

    svg += `<rect x="315" y="38" width="335" height="172" rx="16" fill="var(--card)" stroke="var(--c5)" stroke-width="2.5"/>`;
    svg += `<text x="482" y="72" text-anchor="middle" style="font-weight:800;fill:var(--c5)">BƯỚC QUY NẠP P(${n - 1}) → P(${n})</text>`;
    svg += `<text x="482" y="108" text-anchor="middle" style="font-size:14px">Hình vuông cũ P(${n - 1}): ${(n - 1)}² = ${(n - 1) * (n - 1)} ô</text>`;
    svg += `<text x="482" y="138" text-anchor="middle" style="font-size:14px;font-weight:700;fill:var(--c4)">+ Viền chữ L mới (2·${n} - 1): + ${lastOdd} ô</text>`;
    svg += `<text x="482" y="176" text-anchor="middle" style="font-size:18px;font-weight:800;fill:var(--c2)">Tổng P(${n}) = ${n}² = ${n * n} ô vuông</text>`;

  } else if (currentIndMode === 'fib') {
    const fib = [0, 1];
    for (let i = 2; i <= 12; i++) fib[i] = fib[i - 1] + fib[i - 2];
    const alpha = (1 + Math.sqrt(5)) / 2;
    const fn = fib[n];
    const bound = Math.pow(alpha, n - 2);

    descEl.innerHTML = `<b>Dãy Đệ quy Fibonacci & Cận dưới Tỷ lệ vàng (Ví dụ 6 Mục 3.3):</b> Tại $n = \\mathbf{${n}}$, ta có:<br>
    • Công thức đệ quy: $f_{${n}} = ${n >= 2 ? `f_{${n - 1}} + f_{${n - 2}} = ${fib[n - 1]} + ${fib[n - 2]} = ` : ''}\\mathbf{${fn}}$.<br>
    • So sánh với $\\alpha^{n-2}$ (với $\\alpha = \\frac{1+\\sqrt{5}}{2} \\approx 1.618$): $f_{${n}} = \\mathbf{${fn}}$ ${n >= 3 ? `> \\alpha^{${n - 2}} \\approx \\mathbf{${bound.toFixed(2)}}` : '(Bất đẳng thức xét từ $n \\ge 3$)'}.`;

    const ox = 55, oy = 205, gw = 580, gh = 165;
    svg += `<line x1="${ox}" y1="25" x2="${ox}" y2="${oy}" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${ox}" y1="${oy}" x2="${ox + gw}" y2="${oy}" stroke="var(--ink)" stroke-width="2"/>`;

    const maxF = fib[Math.max(n, 6)];
    for (let i = 1; i <= n; i++) {
      const cx = ox + (i / (n + 0.6)) * gw;
      const barH = (fib[i] / maxF) * (gh - 15);
      const bH = i >= 3 ? (Math.pow(alpha, i - 2) / maxF) * (gh - 15) : 0;

      svg += `<rect x="${cx - 16}" y="${oy - barH}" width="32" height="${barH}" rx="6" fill="var(--c1)" opacity="${i === n ? '1' : '0.65'}"/>`;
      svg += `<text x="${cx}" y="${oy - barH - 7}" text-anchor="middle" style="font-size:12px;font-weight:800;fill:var(--c1)">f_${i}=${fib[i]}</text>`;
      svg += `<text x="${cx}" y="${oy + 20}" text-anchor="middle" style="font-size:12px;fill:var(--mut)">n=${i}</text>`;

      if (i >= 3) {
        svg += `<circle cx="${cx}" cy="${oy - bH}" r="5.5" fill="var(--c4)"/>`;
      }
    }
    svg += `<text x="345" y="242" text-anchor="middle" style="font-size:12.5px;font-weight:700;fill:var(--c4)">● Chấm hồng: Giá trị cận dưới α^(n-2) luôn nằm thấp hơn cột f_n với mọi n ≥ 3</text>`;

  } else {
    // So sánh số phép nhân giữa Thuật toán 1 và Bài 16, Bài 18*
    const exp2n = Math.pow(2, n);
    let fastMults = 0;
    let tempN = n;
    while (tempN > 0) {
      fastMults += (tempN % 2 === 1) ? 2 : 1;
      tempN = Math.floor(tempN / 2);
    }
    if (n > 0) fastMults -= 1; // Bước cơ sở đến n=1 không tốn phép nhân thừa

    descEl.innerHTML = `<b>So sánh Thuật toán Đệ quy Lũy thừa (Bài 16 - 19* Mục 3.4) với cơ số $a = ${a}, n = ${n}$:</b><br>
    • <b>Bài toán 1 (Tính $a^{2^n} = ${a}^{${exp2n}}$):</b> Thuật toán 1 tốn $\\mathbf{2^{${n}} = ${exp2n}}$ phép nhân, trong khi Thuật toán Đệ quy Bài 16 chỉ tốn đúng $\\mathbf{${n}}$ <b>phép nhân</b>!<br>
    • <b>Bài toán 2 (Tính $a^n = ${a}^{${n}} = ${Math.pow(a, n)}$):</b> Thuật toán 1 tốn $\\mathbf{${n}}$ phép nhân, còn Đệ quy Chia để trị Bài 18* ($n = (${n.toString(2)})_2$) chỉ tốn $\\mathbf{${fastMults}}$ <b>phép nhân</b>!`;

    svg += `
      <rect x="28" y="38" width="295" height="175" rx="16" fill="var(--card)" stroke="var(--c4)" stroke-width="2.5"/>
      <text x="175" y="70" text-anchor="middle" style="font-weight:800;fill:var(--c4)">SO SÁNH TÍNH a^(2^n) = ${a}^${exp2n}</text>
      <text x="175" y="108" text-anchor="middle" style="font-size:14px">Thuật toán 1 (Cổ điển): <tspan style="font-weight:800;fill:var(--c4)">${exp2n} phép nhân</tspan></text>
      <text x="175" y="142" text-anchor="middle" style="font-size:14px">Bài tập 16 (Bình phương): <tspan style="font-weight:800;fill:var(--c2)">${n} phép nhân</tspan></text>
      <text x="175" y="182" text-anchor="middle" style="font-size:13px;font-weight:700;fill:var(--mut)">Tiết kiệm: ${exp2n - n} phép nhân!</text>

      <rect x="355" y="38" width="295" height="175" rx="16" fill="var(--card)" stroke="var(--c2)" stroke-width="2.5"/>
      <text x="502" y="70" text-anchor="middle" style="font-weight:800;fill:var(--c2)">SO SÁNH TÍNH a^n = ${a}^${n} = ${Math.pow(a, n)}</text>
      <text x="502" y="108" text-anchor="middle" style="font-size:14px">Thuật toán 1 (a · a^(n-1)): <tspan style="font-weight:800;fill:var(--c4)">${n} phép nhân</tspan></text>
      <text x="502" y="142" text-anchor="middle" style="font-size:14px">Bài tập 18* (Chia đôi mũ): <tspan style="font-weight:800;fill:var(--c2)">${fastMults} phép nhân</tspan></text>
      <text x="502" y="182" text-anchor="middle" style="font-size:13px;font-weight:700;fill:var(--c5)">Nhị phân của n: (${n.toString(2)})₂</text>
    `;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderIndSim = renderIndSim;

/* ==========================================================================
   HỆ THỐNG LÕI TỰ ĐỘNG: TOC, CUSTOM DROPDOWN & ON-DEMAND LOADER
   ========================================================================== */
function buildTOC() {
  const tocContainer = $('toc-links');
  if (!tocContainer) return;
  let html = '', idx = 0;
  document.querySelectorAll('#app-content h2, #app-content h3').forEach(el => {
    const title = el.textContent.trim();
    const isSub = el.tagName === 'H3';
    const target = isSub ? el : (el.closest('section') || el);
    if (!target.id) target.id = 'sec-' + (idx++);
    html += `<a href="#${target.id}" class="${isSub ? 'sub' : 'grp'}">${title}</a>`;
  });
  tocContainer.innerHTML = html;
}

function upgradeCustomSelects(root = document) {
  root.querySelectorAll('select').forEach(sel => {
    if (sel.id === 'lesson-select' || sel.style.display === 'none') return;
    if (sel.dataset.customized === 'true') {
      if (sel._syncCustomUI) sel._syncCustomUI();
      return;
    }
    sel.dataset.customized = 'true';
    sel.classList.add('native-select-hidden');

    const wrap = document.createElement('div');
    wrap.className = 'csel-wrap';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'csel-trigger';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'csel-label';

    const arrowBox = document.createElement('span');
    arrowBox.className = 'csel-arrow';

    trigger.appendChild(labelSpan);
    trigger.appendChild(arrowBox);

    const menu = document.createElement('div');
    menu.className = 'csel-menu';

    const syncUI = () => {
      const selectedOpt = sel.options[sel.selectedIndex] || sel.options[0];
      labelSpan.textContent = selectedOpt ? selectedOpt.textContent : '';
      menu.querySelectorAll('.csel-opt').forEach((item, idx) => {
        item.classList.toggle('selected', idx === sel.selectedIndex);
      });
    };
    sel._syncCustomUI = syncUI;

    Array.from(sel.options).forEach((opt, idx) => {
      const item = document.createElement('div');
      item.className = 'csel-opt' + (idx === sel.selectedIndex ? ' selected' : '');
      item.textContent = opt.textContent;
      item.onclick = (e) => {
        e.stopPropagation();
        sel.selectedIndex = idx;
        sel.value = opt.value;
        syncUI();
        wrap.classList.remove('open');
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      };
      menu.appendChild(item);
    });

    syncUI();

    trigger.onclick = (e) => {
      e.stopPropagation();
      const isOpen = wrap.classList.contains('open');
      document.querySelectorAll('.csel-wrap.open').forEach(w => w.classList.remove('open'));
      if (!isOpen) wrap.classList.add('open');
    };

    wrap.appendChild(trigger);
    wrap.appendChild(menu);
    sel.insertAdjacentElement('afterend', wrap);
  });
}

document.addEventListener('click', () => {
  document.querySelectorAll('.csel-wrap.open').forEach(w => w.classList.remove('open'));
});

const TRR_LESSONS = [
  { id: '1', title: 'Phần 1: Mệnh đề, Vị từ & Lượng từ' },
  { id: '2', title: 'Phần 2: Lượng từ lồng nhau & Suy luận' },
  { id: '3', title: 'Phần 3: Đại số Bool, Big-O & Euclid' },
  { id: '4', title: 'Phần 4: Lý thuyết số & Mật mã RSA' },
  { id: '5', title: 'Phần 5: Quy nạp Toán học & Đệ quy' },
  { id: '6', title: 'Phần 6: Phép đếm & Dirichlet' },
  { id: '7', title: 'Phần 7: Hoán vị, Tổ hợp & Nhị thức' },
  { id: '8', title: 'Phần 8: Đếm nâng cao, Truy hồi & Hàm sinh' },
  { id: '9', title: 'Phần 9: Đồ thị, Bậc, Euler & Hamilton' },
  { id: '10', title: 'Phần 10: Đường đi ngắn nhất, Đồ thị phẳng & Tô màu' },
  { id: '11', title: 'Phần 11: Cây, Huffman, Duyệt cây & Cây khung' }
];

function renderLS(curId) {
  const lsEl = $('ls');
  if (!lsEl) return;
  lsEl.innerHTML = TRR_LESSONS.map(l =>
    `<button type="button" data-id="${l.id}" title="${l.title}" aria-label="${l.title}" class="${String(l.id) === String(curId) ? 'on' : ''}">${l.id}</button>`
  ).join('');
}

function loadLesson(lessonId) {
  const mainEl = $('app-content');
  const tpl = $('tpl-buoi-' + lessonId);

  if (tpl) {
    mainEl.innerHTML = tpl.innerHTML;
    if (lessonId === '3') {
      renderBoolSim();
    } else if (lessonId === '4') {
      renderCryptoSim();
    } else if (lessonId === '5') {
      renderIndSim();
    }
  }

  const sel = $('lesson-select');
  if (sel) sel.value = String(lessonId);
  renderLS(lessonId);

  // Cập nhật tiêu đề bài trên thanh topbar
  const curLesson = TRR_LESSONS.find(l => String(l.id) === String(lessonId));
  if (curLesson) {
    const chip = $('lesson-chip');
    const title = $('lesson-title');
    if (chip) chip.textContent = 'Phần ' + curLesson.id;
    if (title) {
      const cleanTitle = curLesson.title.replace(/^Phần\s+\d+:\s*/, '');
      title.textContent = cleanTitle;
    }
  }

  upgradeCustomSelects(document);
  buildTOC();
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
    if (!nav.hidden && !nav.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !nav.hidden) {
      setOpen(false);
      btn.focus();
    }
  });

  /* Tô sáng mục đang xem trong mục lục */
  addEventListener('scroll', () => {
    let cur = null;
    document.querySelectorAll('#toc-links a').forEach(a => {
      const t = document.getElementById(a.getAttribute('href').slice(1));
      if (t && t.getBoundingClientRect().top <= 120) cur = a;
      a.classList.remove('on');
    });
    if (cur) cur.classList.add('on');
  }, { passive: true });

  $('lesson-select').value = '8';
  loadLesson('8');
})();
