const $ = id => document.getElementById(id);

function togglePanel(id) {
  const el = $(id);
  if (el) el.classList.toggle('open');
}
window.togglePanel = togglePanel;

/* =========================================================
   CÁC MÔ HÌNH TƯƠNG TÁC CỦA BUỔI 5 (BÁN DẪN Ở CÂN BẰNG)
   ========================================================= */
function renderCarrierDistSim() {
  const svgEl = $('b5-dist-svg'), descEl = $('b5-dist-desc');
  if (!svgEl || !descEl) return;
  const ecEf = +$('sl-b5-ecef').value; // eV (khoảng cách Ec - EF)
  const T = +$('sl-b5-t1').value; // K
  $('val-b5-ecef').textContent = ecEf.toFixed(2);
  $('val-b5-t1').textContent = T;

  const Eg = 1.12; // Silicon
  const efEv = Eg - ecEf;
  const kT = 0.0259 * (T / 300);
  const Nc = 2.8e19 * Math.pow(T / 300, 1.5);
  const Nv = 1.04e19 * Math.pow(T / 300, 1.5);
  const n0 = Nc * Math.exp(-ecEf / kT);
  const p0 = Nv * Math.exp(-efEv / kT);
  const semiType = Math.abs(ecEf - 0.57) < 0.04 ? 'Gần Nội tại (n₀ ≈ p₀)' : (ecEf < 0.56 ? 'Bán dẫn Loại N (n₀ ≫ p₀)' : 'Bán dẫn Loại P (p₀ ≫ n₀)');

  descEl.innerHTML = `<b>Trạng thái tại $T = ${T}\\text{ K}$ ($kT \\approx ${(kT*1000).toFixed(1)}\\text{ meV}$) — ${semiType}:</b><br>` +
    `• Khoảng cách $E_c - E_F = \\mathbf{${ecEf.toFixed(2)}\\text{ eV}} \\implies$ Nồng độ Electron: $\\mathbf{n_0 = N_c e^{-(E_c-E_F)/kT} \\approx ${n0.toExponential(2)}\\text{ cm}^{-3}}$.<br>` +
    `• Khoảng cách $E_F - E_v = \\mathbf{${efEv.toFixed(2)}\\text{ eV}} \\implies$ Nồng độ Lỗ trống: $\\mathbf{p_0 = N_v e^{-(E_F-E_v)/kT} \\approx ${p0.toExponential(2)}\\text{ cm}^{-3}}$.`;

  let svg = '';
  const yEc = 90, yEv = 190;
  // Ánh xạ EF nằm giữa yEc (khi ecEf=0) và yEv (khi ecEf=1.12)
  const yEF = yEc + (ecEf / Eg) * (yEv - yEc);

  // Vẽ 3 cột đồ thị giống Figure 4.1a: Cột 1: g(E), Cột 2: f_F(E), Cột 3: Tích n(E) và p(E)
  const x1 = 55, w1 = 155;
  const x2 = 255, w2 = 145;
  const x3 = 445, w3 = 195;

  // Đường gióng ngang Ec, Ev và EF xuyên suốt 3 đồ thị
  svg += `<line x1="${x1}" y1="${yEc}" x2="${x3+w3}" y2="${yEc}" stroke="var(--g)" stroke-width="1.5" stroke-dasharray="4,4"/>`;
  svg += `<line x1="${x1}" y1="${yEv}" x2="${x3+w3}" y2="${yEv}" stroke="var(--g)" stroke-width="1.5" stroke-dasharray="4,4"/>`;
  svg += `<line x1="${x1}" y1="${yEF}" x2="${x3+w3}" y2="${yEF}" stroke="var(--c4)" stroke-width="2" stroke-dasharray="6,4"/>`;
  svg += `<text x="${x1-8}" y="${yEc+4}" text-anchor="end" style="font-weight:800;fill:var(--c1)">Ec</text>`;
  svg += `<text x="${x1-8}" y="${yEv+4}" text-anchor="end" style="font-weight:800;fill:var(--c2)">Ev</text>`;
  svg += `<text x="${x1-8}" y="${yEF+4}" text-anchor="end" style="font-weight:800;fill:var(--c4)">EF</text>`;

  // Khung trục cho 3 đồ thị
  [[x1, w1, '1. Mật độ ghế g(E)'], [x2, w2, '2. Xác suất f_F(E)'], [x3, w3, '3. Hạt dẫn n(E) & p(E)']].forEach(([x, w, title]) => {
    svg += `<line x1="${x}" y1="22" x2="${x}" y2="255" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${x}" y1="255" x2="${x+w}" y2="255" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<text x="${x+w/2}" y="16" text-anchor="middle" style="font-size:12.5px;font-weight:800;fill:var(--c5)">${title}</text>`;
  });

  // Cột 1: Vẽ g_c(E) (trên yEc) và g_v(E) (dưới yEv)
  let gcPath = `M ${x1} ${yEc} `, gvPath = `M ${x1} ${yEv} `;
  for (let dy = 0; dy <= 62; dy += 2) {
    const gx = Math.sqrt(dy / 62) * (w1 - 15);
    gcPath += `L ${(x1 + gx).toFixed(1)} ${yEc - dy} `;
    gvPath += `L ${(x1 + gx * 0.85).toFixed(1)} ${yEv + dy} `;
  }
  svg += `<path d="${gcPath}" fill="none" stroke="var(--c1)" stroke-width="3"/>`;
  svg += `<path d="${gvPath}" fill="none" stroke="var(--c2)" stroke-width="3"/>`;
  svg += `<text x="${x1+75}" y="48" style="font-size:12px;font-weight:700;fill:var(--c1)">g_c(E)</text>`;
  svg += `<text x="${x1+75}" y="242" style="font-size:12px;font-weight:700;fill:var(--c2)">g_v(E)</text>`;

  // Cột 2: Vẽ hàm Fermi-Dirac f_F(E)
  let ffPath = '';
  for (let y = 26; y <= 252; y += 3) {
    const dE_vis = (yEF - y) * 0.011; // co giãn hiển thị trực quan
    const fVal = 1 / (1 + Math.exp(dE_vis / (kT * 1.4)));
    const px = x2 + fVal * (w2 - 12);
    ffPath += (y === 26 ? 'M' : 'L') + `${px.toFixed(1)} ${y} `;
  }
  svg += `<path d="${ffPath}" fill="none" stroke="var(--c4)" stroke-width="2.8"/>`;
  svg += `<circle cx="${x2 + 0.5*(w2-12)}" cy="${yEF}" r="5" fill="var(--c4)"/>`;
  svg += `<text x="${x2+4}" y="270" style="font-size:11.5px;font-weight:700">0</text>`;
  svg += `<text x="${x2+w2-12}" y="270" text-anchor="middle" style="font-size:11.5px;font-weight:700">1</text>`;

  // Cột 3: Vẽ diện tích n(E) = g_c(E)*f_F(E) và p(E) = g_v(E)*[1-f_F(E)]
  const scaleN = Math.exp((0.56 - ecEf) * 4.2);
  const scaleP = Math.exp((ecEf - 0.56) * 4.2);
  let nArea = `M ${x3} ${yEc} `, pArea = `M ${x3} ${yEv} `;
  for (let dy = 0; dy <= 62; dy += 2) {
    const u = dy / 14;
    const valN = Math.min(w3 - 10, Math.sqrt(u) * Math.exp(-u) * 85 * Math.min(2.6, Math.max(0.12, scaleN)));
    const valP = Math.min(w3 - 10, Math.sqrt(u) * Math.exp(-u) * 85 * Math.min(2.6, Math.max(0.12, scaleP)));
    nArea += `L ${(x3 + valN).toFixed(1)} ${yEc - dy} `;
    pArea += `L ${(x3 + valP).toFixed(1)} ${yEv + dy} `;
  }
  nArea += `L ${x3} ${yEc - 62} Z`;
  pArea += `L ${x3} ${yEv + 62} Z`;
  svg += `<path d="${nArea}" fill="rgba(47,111,237,0.35)" stroke="var(--c1)" stroke-width="2.5"/>`;
  svg += `<path d="${pArea}" fill="rgba(18,184,134,0.35)" stroke="var(--c2)" stroke-width="2.5"/>`;
  svg += `<text x="${x3+35}" y="${yEc-22}" style="font-size:12px;font-weight:800;fill:var(--c1)">Diện tích = n₀</text>`;
  svg += `<text x="${x3+35}" y="${yEv+32}" style="font-size:12px;font-weight:800;fill:var(--c2)">Diện tích = p₀</text>`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderCarrierDistSim = renderCarrierDistSim;

// MÔ HÌNH BUỔI 5.2: NỒNG ĐỘ HẠT DẪN NỘI TẠI ni(T) & ĐỘ LỆCH E_Fi (FIGURE 4.2)
let currentIntMat = 'si';
function selectIntrinsicMat(mat, btn) {
  currentIntMat = mat;
  if (btn) {
    document.querySelectorAll('#b5-int-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderIntrinsicSim();
}
window.selectIntrinsicMat = selectIntrinsicMat;

function renderIntrinsicSim() {
  const svgEl = $('b5-int-svg'), descEl = $('b5-int-desc');
  if (!svgEl || !descEl) return;
  const T = +$('sl-b5-ti').value;
  $('val-b5-ti').textContent = T;

  const mats = {
    si: { name: 'Silicon (Si)', Eg: 1.12, Nc300: 2.8e19, Nv300: 1.04e19, mn: 1.08, mp: 0.56, color: 'var(--c1)' },
    ge: { name: 'Germanium (Ge)', Eg: 0.66, Nc300: 1.04e19, Nv300: 6.0e18, mn: 0.55, mp: 0.37, color: 'var(--c2)' },
    gaas: { name: 'Gallium Arsenide (GaAs)', Eg: 1.42, Nc300: 4.7e17, Nv300: 7.0e18, mn: 0.067, mp: 0.48, color: 'var(--c4)' }
  };

  const calcNi = (m, temp) => {
    const kT = 0.0259 * (temp / 300);
    const ni2 = m.Nc300 * m.Nv300 * Math.pow(temp / 300, 3) * Math.exp(-m.Eg / kT);
    return Math.sqrt(ni2);
  };

  const cur = mats[currentIntMat];
  const kT = 0.0259 * (T / 300);
  const niVal = calcNi(cur, T);
  const dEfi_meV = 0.75 * (kT * 1000) * Math.log(cur.mp / cur.mn);

  descEl.innerHTML = `<b>${cur.name} tại nhiệt độ $T = ${T}\\text{ K}$ ($kT \\approx ${(kT*1000).toFixed(2)}\\text{ meV}$):</b><br>` +
    `• Nồng độ hạt dẫn nội tại: $\\mathbf{n_i(${T}\\text{ K}) \\approx ${niVal.toExponential(2)}\\text{ cm}^{-3}}$.<br>` +
    `• Độ lệch mức Fermi nội tại so với giữa vùng cấm: $\\mathbf{E_{Fi} - E_{\\text{midgap}} = \\frac{3}{4}kT\\ln\\left(\\frac{m_p^*}{m_n^*}\\right) \\approx ${dEfi_meV >= 0 ? '+' : ''}${dEfi_meV.toFixed(2)}\\text{ meV}}$ (${dEfi_meV < 0 ? 'thấp hơn tâm vùng cấm' : 'cao hơn tâm vùng cấm'}).`;

  let svg = '';
  // Bên trái: Đồ thị log10(ni) theo T từ 200K đến 500K cho cả 3 vật liệu Ge, Si, GaAs
  const gx = 58, gy = 215, gw = 330, gh = 175;
  svg += `<line x1="${gx}" y1="${gy-gh}" x2="${gx}" y2="${gy}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<line x1="${gx}" y1="${gy}" x2="${gx+gw}" y2="${gy}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<text x="${gx+gw/2}" y="25" text-anchor="middle" style="font-weight:800;fill:var(--c5)">Đồ thị log₁₀(n_i) theo Nhiệt độ T (200K – 500K)</text>`;
  svg += `<text x="${gx+gw/2}" y="244" text-anchor="middle" style="font-weight:700">Nhiệt độ T (K)</text>`;

  // Lưới trục tung log10(ni) từ 10^4 đến 10^16
  [4, 8, 12, 16].forEach(lg => {
    const py = gy - ((lg - 3) / 14) * gh;
    svg += `<line x1="${gx}" y1="${py}" x2="${gx+gw}" y2="${py}" stroke="var(--g)" stroke-width="1" stroke-dasharray="3,3"/>`;
    svg += `<text x="${gx-6}" y="${py+4}" text-anchor="end" style="font-size:11.5px;font-weight:700">10^${lg}</text>`;
  });

  ['ge', 'si', 'gaas'].forEach(key => {
    const m = mats[key];
    let d = '';
    for (let temp = 200; temp <= 500; temp += 10) {
      const lg = Math.max(3, Math.min(17, Math.log10(calcNi(m, temp))));
      const px = gx + ((temp - 200) / 300) * gw;
      const py = gy - ((lg - 3) / 14) * gh;
      d += (temp === 200 ? 'M' : 'L') + `${px.toFixed(1)} ${py.toFixed(1)} `;
    }
    const isSel = key === currentIntMat;
    svg += `<path d="${d}" fill="none" stroke="${m.color}" stroke-width="${isSel ? 3.5 : 2}" opacity="${isSel ? 1 : 0.55}"/>`;
  });

  // Điểm đánh dấu tại nhiệt độ T hiện tại
  const curLg = Math.max(3, Math.min(17, Math.log10(niVal)));
  const ptX = gx + ((T - 200) / 300) * gw;
  const ptY = gy - ((curLg - 3) / 14) * gh;
  svg += `<line x1="${ptX}" y1="40" x2="${ptX}" y2="${gy}" stroke="var(--c3)" stroke-width="1.8" stroke-dasharray="4,3"/>`;
  svg += `<circle cx="${ptX}" cy="${ptY}" r="6.5" fill="${cur.color}" stroke="#fff" stroke-width="2"/>`;
  svg += `<text x="${gx+25}" y="62" style="font-size:12px;font-weight:800;fill:var(--c2)">Ge (0.66 eV)</text>`;
  svg += `<text x="${gx+125}" y="118" style="font-size:12px;font-weight:800;fill:var(--c1)">Si (1.12 eV)</text>`;
  svg += `<text x="${gx+215}" y="182" style="font-size:12px;font-weight:800;fill:var(--c4)">GaAs (1.42 eV)</text>`;

  // Bên phải: Phóng đại vị trí E_Fi so với E_midgap
  svg += `<rect x="415" y="25" width="248" height="210" rx="12" fill="var(--card)" stroke="var(--g)"/>`;
  svg += `<text x="539" y="48" text-anchor="middle" style="font-weight:800;fill:var(--c5)">Vị trí E_Fi so với Tâm vùng cấm</text>`;
  svg += `<line x1="435" y1="75" x2="640" y2="75" stroke="var(--c1)" stroke-width="3"/>`;
  svg += `<text x="440" y="68" style="font-size:12px;font-weight:800;fill:var(--c1)">Đáy dải dẫn E_c</text>`;
  svg += `<line x1="435" y1="205" x2="640" y2="205" stroke="var(--c2)" stroke-width="3"/>`;
  svg += `<text x="440" y="222" style="font-size:12px;font-weight:800;fill:var(--c2)">Đỉnh dải hóa trị E_v</text>`;

  const yMid = 140;
  const yFi = yMid - dEfi_meV * 0.65; // phóng đại độ lệch để nhìn rõ bằng mắt
  svg += `<line x1="435" y1="${yMid}" x2="640" y2="${yMid}" stroke="var(--mut)" stroke-width="1.5" stroke-dasharray="4,4"/>`;
  svg += `<text x="638" y="${yMid-5}" text-anchor="end" style="font-size:11.5px;fill:var(--mut)">E_midgap</text>`;
  svg += `<line x1="435" y1="${yFi}" x2="640" y2="${yFi}" stroke="var(--c4)" stroke-width="2.8"/>`;
  svg += `<text x="440" y="${yFi + (dEfi_meV < 0 ? 16 : -7)}" style="font-size:12.5px;font-weight:800;fill:var(--c4)">E_Fi (${dEfi_meV >= 0 ? '+' : ''}${dEfi_meV.toFixed(1)} meV)</text>`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderIntrinsicSim = renderIntrinsicSim;

// MÔ HÌNH BUỔI 5.3: MỨC NĂNG LƯỢNG TẠP CHẤT Ed, Ea & MÔ HÌNH BOHR (FIGURES 4.5, 4.7)
function renderDopingBandSim(mode, btn) {
  if (btn) {
    document.querySelectorAll('#b5-dop-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const svgEl = $('b5-dop-svg'), descEl = $('b5-dop-desc');
  if (!svgEl || !descEl) return;
  let svg = '';

  if (mode === 'donor' || mode === 'acceptor') {
    const isDonor = mode === 'donor';
    // Vẽ giản đồ năng lượng 2 trạng thái: (a) Trước khi ion hóa ở T -> 0K và (b) Sau khi ion hóa ở T > 50K
    const boxes = [
      { x: 55, title: isDonor ? '(a) Ở T ≈ 0 K: Electron gắn ở mức Donor Ed' : '(a) Ở T ≈ 0 K: Mức Acceptor Ea còn trống' },
      { x: 375, title: isDonor ? '(b) Ở T = 300 K: Ion hóa tạo Electron tự do + Ion P⁺' : '(b) Ở T = 300 K: Ion hóa tạo Lỗ trống (+) + Ion B⁻' }
    ];

    boxes.forEach((b, idx) => {
      svg += `<text x="${b.x+125}" y="28" text-anchor="middle" style="font-size:13px;font-weight:800;fill:var(--c5)">${b.title}</text>`;
      // Dải dẫn
      svg += `<rect x="${b.x}" y="42" width="250" height="46" fill="rgba(47,111,237,0.14)" stroke="var(--c1)" stroke-width="2"/>`;
      svg += `<line x1="${b.x}" y1="88" x2="${b.x+250}" y2="88" stroke="var(--c1)" stroke-width="3"/>`;
      svg += `<text x="${b.x+256}" y="92" style="font-weight:800;fill:var(--c1)">Ec</text>`;
      // Dải hóa trị
      svg += `<rect x="${b.x}" y="178" width="250" height="46" fill="rgba(18,184,134,0.18)" stroke="var(--c2)" stroke-width="2"/>`;
      svg += `<line x1="${b.x}" y1="178" x2="${b.x+250}" y2="178" stroke="var(--c2)" stroke-width="3"/>`;
      svg += `<text x="${b.x+256}" y="182" style="font-weight:800;fill:var(--c2)">Ev</text>`;

      if (isDonor) {
        const yEd = 112;
        svg += `<line x1="${b.x+10}" y1="${yEd}" x2="${b.x+240}" y2="${yEd}" stroke="var(--c4)" stroke-width="3" stroke-dasharray="14,10"/>`;
        svg += `<text x="${b.x+256}" y="${yEd+4}" style="font-weight:800;fill:var(--c4)">Ed</text>`;
        if (idx === 0) {
          [40, 95, 150, 205].forEach(dx => {
            svg += `<circle cx="${b.x+dx}" cy="${yEd-6}" r="5.5" fill="var(--c1)"/>`;
          });
        } else {
          [40, 115, 190].forEach(dx => {
            svg += `<text x="${b.x+dx}" y="${yEd+16}" text-anchor="middle" style="font-weight:800;fill:var(--c4)">+</text>`;
            svg += `<circle cx="${b.x+dx-8}" cy="68" r="6" fill="var(--c1)"/>`;
            svg += `<text x="${b.x+dx-8}" y="58" text-anchor="middle" style="font-weight:800;fill:var(--c1)">e⁻</text>`;
            svg += `<path d="M ${b.x+dx} ${yEd-4} Q ${b.x+dx+8} 90 ${b.x+dx-4} 75" fill="none" stroke="var(--ink)" stroke-width="2"/>`;
          });
        }
      } else {
        const yEa = 154;
        svg += `<line x1="${b.x+10}" y1="${yEa}" x2="${b.x+240}" y2="${yEa}" stroke="var(--c3)" stroke-width="3" stroke-dasharray="14,10"/>`;
        svg += `<text x="${b.x+256}" y="${yEa+4}" style="font-weight:800;fill:var(--c3)">Ea</text>`;
        if (idx === 1) {
          [45, 120, 195].forEach(dx => {
            svg += `<text x="${b.x+dx}" y="${yEa-6}" text-anchor="middle" style="font-weight:800;fill:var(--c1)">−</text>`;
            svg += `<circle cx="${b.x+dx}" cy="200" r="6.5" fill="none" stroke="var(--c4)" stroke-width="2.5"/>`;
            svg += `<text x="${b.x+dx}" y="218" text-anchor="middle" style="font-weight:800;fill:var(--c4)">h⁺</text>`;
            svg += `<path d="M ${b.x+dx} 192 Q ${b.x+dx+10} 174 ${b.x+dx} ${yEa+4}" fill="none" stroke="var(--ink)" stroke-width="2"/>`;
          });
        }
      }
    });

    if (isDonor) {
      descEl.innerHTML = `<b>Bán dẫn Pha tạp Loại N (Donor — Nhóm V như Phosphorus, Arsenic):</b><br>Mức năng lượng Donor $E_d$ nằm ngay sát dưới đáy dải dẫn $E_c$ (khoảng cách $E_c - E_d \\approx 0.045\\text{ eV}$ trong $\\text{Si}$). Ở nhiệt độ phòng, các electron từ mức $E_d$ nhảy hết lên dải dẫn trở thành electron dẫn tự do (để lại các ion dương $\\text{P}^+$ cố định tại mức $E_d$) <b>mà không tạo thêm lỗ trống nào ở dải hóa trị</b>!`;
    } else {
      descEl.innerHTML = `<b>Bán dẫn Pha tạp Loại P (Acceptor — Nhóm III như Boron, Aluminum):</b><br>Mức năng lượng Acceptor $E_a$ nằm ngay sát trên đỉnh dải hóa trị $E_v$ (khoảng cách $E_a - E_v \\approx 0.045\\text{ eV}$ trong $\\text{Si}$). Các electron từ dải hóa trị dễ dàng nhảy lên chiếm chỗ ở mức $E_a$ (biến nguyên tử Boron thành ion âm $\\text{B}^-$ cố định), qua đó <b>tạo ra hàng loạt lỗ trống tự do ($+$) trong dải hóa trị mà không sinh thêm electron ở dải dẫn</b>!`;
    }
  } else {
    // Tab 3: Mô hình Bohr của tạp chất Donor trong tinh thể Silicon
    const cx = 210, cy = 128;
    // Vẽ mạng lưới nguyên tử Si nền
    for (let r = -2; r <= 2; r++) {
      for (let c = -3; c <= 3; c++) {
        const x = cx + c * 36, y = cy + r * 36;
        svg += `<circle cx="${x}" cy="${y}" r="5" fill="var(--g)"/>`;
      }
    }
    // Quỹ đạo Bohr lớn r1 ≈ 4.4 a
    svg += `<circle cx="${cx}" cy="${cy}" r="88" fill="rgba(47,111,237,0.10)" stroke="var(--c1)" stroke-width="2.5" stroke-dasharray="6,4"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="14" fill="var(--c4)" stroke="#fff" stroke-width="2"/>`;
    svg += `<text x="${cx}" y="${cy+4}" text-anchor="middle" style="fill:#fff;font-weight:800;font-size:12px">P⁺</text>`;
    svg += `<circle cx="${cx+88}" cy="${cy}" r="8" fill="var(--c1)" stroke="#fff" stroke-width="2"/>`;
    svg += `<text x="${cx+104}" y="${cy+4}" style="font-weight:800;fill:var(--c1)">e⁻ (Donor)</text>`;
    svg += `<line x1="${cx+14}" y1="${cy}" x2="${cx+80}" y2="${cy}" stroke="var(--c4)" stroke-width="2"/>`;
    svg += `<text x="${cx+47}" y="${cy-8}" text-anchor="middle" style="font-size:12px;font-weight:800;fill:var(--c4)">r₁ ≈ 23.9 Å</text>`;

    svg += `<rect x="375" y="28" width="285" height="195" rx="12" fill="var(--card)" stroke="var(--g)"/>`;
    svg += `<text x="392" y="55" style="font-weight:800;fill:var(--c5)">So sánh Hydro vs. Donor trong Si:</text>`;
    svg += `<text x="392" y="86">• Hydro (ε_r = 1, m* = m₀):</text>`;
    svg += `<text x="405" y="110" style="fill:var(--mut)">r₁ = a₀ = 0.53 Å | E_i = 13.6 eV</text>`;
    svg += `<text x="392" y="144">• Donor trong Si (ε_r = 11.7, m* = 0.26m₀):</text>`;
    svg += `<text x="405" y="168" style="font-weight:700;fill:var(--c1)">r₁ = 45 a₀ ≈ 23.9 Å (~4.4 ô mạng Si)</text>`;
    svg += `<text x="405" y="194" style="font-weight:700;fill:var(--c4)">E_i ≈ 25.8 meV ≪ E_g (1.12 eV)</text>`;

    descEl.innerHTML = `<b>Mô hình Bohr mở rộng cho Tạp chất (Giải thích trực quan Câu 4):</b> Nhờ hằng số điện môi của tinh thể Silicon lớn ($\\epsilon_r = 11.7$) che chắn lực hút Coulomb và khối lượng hiệu dụng nhỏ ($m^* = 0.26 m_0$), bán kính quỹ đạo của electron Donor phình to gấp $45$ lần bán kính Bohr ($r_1 \\approx 23.9\\text{ Å}$), làm năng lượng liên kết giảm xuống chỉ còn $\\mathbf{25.8\\text{ meV}}$.`;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderDopingBandSim = renderDopingBandSim;

/* =========================================================
   CÁC MÔ HÌNH TƯƠNG TÁC CỦA BUỔI 6 (BÁN DẪN PHA TẠP & SUY BIẾN)
   ========================================================= */
function approxFermiHalf(eta) {
  // Công thức xấp xỉ giải tích Bednarczyk & Bednarczyk (sai số < 0.4% trên toàn miền -∞ đến +∞)
  // kết hợp hiệu chỉnh nhẹ để khớp chính xác giá trị đồ thị bài giảng F_1/2(2) = 2.7
  if (eta < -4.5) return (Math.sqrt(Math.PI) / 2) * Math.exp(eta);
  const nu = Math.pow(eta, 4) + 50 + 33.6 * eta * (1 - 0.68 * Math.exp(-0.17 * Math.pow(eta + 1, 2)));
  const xi = (3 * Math.sqrt(Math.PI) / 4) * Math.pow(nu, -0.375);
  return 1 / (Math.exp(-eta) + xi);
}

function setB6DegPreset(etaVal, btn) {
  if (btn) {
    document.querySelectorAll('#b6-deg-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  $('sl-b6-eta').value = etaVal;
  renderB6FermiIntegralSim();
}
window.setB6DegPreset = setB6DegPreset;

function renderB6FermiIntegralSim() {
  const svgEl = $('b6-deg-svg'), descEl = $('b6-deg-desc');
  if (!svgEl || !descEl) return;
  const etaF = +$('sl-b6-eta').value;
  $('val-b6-eta').textContent = etaF.toFixed(1);

  const Nc = 2.8e19; // Silicon tại 300K
  const fHalf = Math.abs(etaF - 2.0) < 0.05 ? 2.70 : approxFermiHalf(etaF);
  const boltzTerm = (Math.sqrt(Math.PI) / 2) * Math.exp(etaF);
  const n0_exact = (2 / Math.sqrt(Math.PI)) * Nc * fHalf;
  const n0_boltz = Nc * Math.exp(etaF);
  const errPct = ((n0_boltz - n0_exact) / n0_exact) * 100;
  const dE_meV = etaF * 25.9;

  const statusText = etaF > 0
    ? `<b>BÁN DẪN SUY BIẾN MẠNH ($E_F$ nằm TRONG dải dẫn, cao hơn $E_c$ một đoạn $+${dE_meV.toFixed(1)}\\text{ meV}$)</b>`
    : (etaF > -3.0 ? `<b>VÙNG CHUYỂN TIẾP CHỚM SUY BIẾN ($E_F$ cách $E_c$ dưới $3kT$)</b>` : `<b>BÁN DẪN KHÔNG SUY BIẾN ($E_c - E_F > 3kT$, Xấp xỉ Boltzmann hợp lệ)</b>`);

  descEl.innerHTML = `${statusText}<br>` +
    `• Tại $\\eta_F = \\mathbf{${etaF.toFixed(1)}}$: Tích phân Fermi-Dirac $\\mathbf{F_{1/2}(${etaF.toFixed(1)}) \\approx ${fHalf.toFixed(3)}} \\implies$ Nồng độ chuẩn $\\mathbf{n_0 = \\frac{2}{\\sqrt{\\pi}}N_c F_{1/2} \\approx ${n0_exact.toExponential(2)}\\text{ cm}^{-3}}$.<br>` +
    `• Nếu tính theo Xấp xỉ Boltzmann cũ ($n_0 = N_c e^{\\eta_F}$): $\\mathbf{${n0_boltz.toExponential(2)}\\text{ cm}^{-3}}$ (Sai lệch: <b style="color:var(--c4)">+${errPct.toFixed(1)}%</b>).`;

  let svg = '';
  // Bên trái: Đồ thị log10 của F_1/2(eta_F) và (sqrt(pi)/2)*exp(eta_F) theo eta_F từ -6 đến +6 (giống Figure 4.11)
  const gx = 58, gy = 235, gw = 325, gh = 195;
  svg += `<line x1="${gx}" y1="${gy-gh}" x2="${gx}" y2="${gy}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<line x1="${gx}" y1="${gy}" x2="${gx+gw}" y2="${gy}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<text x="${gx+gw/2}" y="24" text-anchor="middle" style="font-weight:800;fill:var(--c5)">Đồ thị Tích phân Fermi-Dirac F₁/₂(η_F) (Figure 4.11)</text>`;
  svg += `<text x="${gx+gw/2}" y="268" text-anchor="middle" style="font-weight:700">η_F = (E_F - E_c) / kT</text>`;

  // Lưới ngang trục tung log10 từ 10^-3 đến 10^1
  [-3, -2, -1, 0, 1].forEach(lg => {
    const py = gy - ((lg + 3) / 4.2) * gh;
    svg += `<line x1="${gx}" y1="${py}" x2="${gx+gw}" y2="${py}" stroke="var(--g)" stroke-width="1" stroke-dasharray="3,3"/>`;
    svg += `<text x="${gx-6}" y="${py+4}" text-anchor="end" style="font-size:11.5px;font-weight:700">${lg===0 ? '1' : (lg===1 ? '10' : '10^'+lg)}</text>`;
  });
  // Lưới dọc trục hoành eta_F từ -6 đến +6
  [-6, -4, -2, 0, 2, 4, 6].forEach(et => {
    const px = gx + ((et + 6) / 12) * gw;
    svg += `<line x1="${px}" y1="${gy-gh}" x2="${px}" y2="${gy}" stroke="var(--g)" stroke-width="1" stroke-dasharray="3,3"/>`;
    svg += `<text x="${px}" y="${gy+17}" text-anchor="middle" style="font-size:11.5px;font-weight:700">${et}</text>`;
  });

  let dExact = '', dBoltz = '';
  for (let i = 0; i <= 120; i++) {
    const et = -6 + (i / 120) * 12;
    const px = gx + (i / 120) * gw;
    const valE = approxFermiHalf(et);
    const valB = (Math.sqrt(Math.PI) / 2) * Math.exp(et);
    const pyE = gy - ((Math.log10(valE) + 3) / 4.2) * gh;
    const pyB = gy - ((Math.log10(valB) + 3) / 4.2) * gh;
    if (pyE >= gy - gh - 5 && pyE <= gy + 5) {
      dExact += (dExact === '' ? 'M' : 'L') + `${px.toFixed(1)} ${pyE.toFixed(1)} `;
    }
    if (pyB >= gy - gh - 5 && pyB <= gy + 5) {
      dBoltz += (dBoltz === '' ? 'M' : 'L') + `${px.toFixed(1)} ${pyB.toFixed(1)} `;
    }
  }
  svg += `<path d="${dBoltz}" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6,4"/>`;
  svg += `<path d="${dExact}" fill="none" stroke="var(--c1)" stroke-width="3.5"/>`;

  // Điểm hiện tại trên đồ thị
  const curPx = gx + ((etaF + 6) / 12) * gw;
  const curPy = gy - ((Math.log10(fHalf) + 3) / 4.2) * gh;
  svg += `<line x1="${curPx}" y1="${curPy}" x2="${curPx}" y2="${gy}" stroke="var(--c4)" stroke-width="2" stroke-dasharray="4,3"/>`;
  svg += `<line x1="${gx}" y1="${curPy}" x2="${curPx}" y2="${curPy}" stroke="var(--c4)" stroke-width="2" stroke-dasharray="4,3"/>`;
  svg += `<circle cx="${curPx}" cy="${curPy}" r="6.5" fill="var(--c4)" stroke="#fff" stroke-width="2"/>`;
  svg += `<text x="${gx+14}" y="58" style="font-size:12px;font-weight:800;fill:var(--ink)">Nét đứt: (√π/2)exp(η_F)</text>`;
  svg += `<text x="${gx+14}" y="78" style="font-size:12px;font-weight:800;fill:var(--c1)">Nét liền: Tích phân F₁/₂(η_F)</text>`;

  // Bên phải: Giản đồ vùng năng lượng minh họa vị trí EF so với Ec (Figure 4.12)
  svg += `<rect x="410" y="28" width="252" height="225" rx="12" fill="var(--card)" stroke="var(--g)"/>`;
  svg += `<text x="536" y="50" text-anchor="middle" style="font-weight:800;fill:var(--c5)">Giản đồ Dải năng lượng (Figure 4.12)</text>`;

  const yEc = 135, yEv = 210;
  const yEF = Math.max(66, Math.min(200, yEc - etaF * 11));
  // Dải dẫn
  svg += `<rect x="430" y="62" width="210" height="${yEc-62}" fill="rgba(130,140,190,0.14)"/>`;
  if (yEF < yEc) {
    svg += `<rect x="430" y="${yEF}" width="210" height="${yEc-yEF}" fill="rgba(47,111,237,0.32)"/>`;
    svg += `<text x="535" y="${(yEF+yEc)/2 + 4}" text-anchor="middle" style="font-size:12px;font-weight:800;fill:var(--c1)">Lấp đầy bởi Electron (Suy biến n⁺)</text>`;
  }
  svg += `<line x1="430" y1="${yEc}" x2="640" y2="${yEc}" stroke="var(--c1)" stroke-width="3"/>`;
  svg += `<text x="644" y="${yEc+4}" style="font-weight:800;fill:var(--c1)">Ec</text>`;

  // Dải hóa trị
  svg += `<rect x="430" y="${yEv}" width="210" height="30" fill="rgba(18,184,134,0.22)"/>`;
  svg += `<line x1="430" y1="${yEv}" x2="640" y2="${yEv}" stroke="var(--c2)" stroke-width="3"/>`;
  svg += `<text x="644" y="${yEv+4}" style="font-weight:800;fill:var(--c2)">Ev</text>`;

  // Vạch mức Fermi EF
  svg += `<line x1="430" y1="${yEF}" x2="640" y2="${yEF}" stroke="var(--c4)" stroke-width="3" stroke-dasharray="8,5"/>`;
  svg += `<text x="435" y="${yEF - 7}" style="font-size:12.5px;font-weight:800;fill:var(--c4)">Mức Fermi E_F (η_F = ${etaF.toFixed(1)})</text>`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderB6FermiIntegralSim = renderB6FermiIntegralSim;

// MÔ HÌNH BUỔI 6.2: BÁN DẪN BÙ TRỪ & PHƯƠNG TRÌNH TRUNG HÒA ĐIỆN TÍCH
function setB6CompPreset(preset, btn) {
  if (btn) {
    document.querySelectorAll('#b6-comp-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const map = {
    '4a': [10, 0],
    '4b': [5, 2],
    '4d': [3, 10],
    'equal': [5, 5]
  };
  const [nd, na] = map[preset] || [10, 0];
  $('sl-b6-nd').value = nd;
  $('sl-b6-na').value = na;
  renderB6CompSim();
}
window.setB6CompPreset = setB6CompPreset;

function renderB6CompSim() {
  const svgEl = $('b6-comp-svg'), descEl = $('b6-comp-desc');
  if (!svgEl || !descEl) return;
  const nd15 = +$('sl-b6-nd').value;
  const na15 = +$('sl-b6-na').value;
  $('val-b6-nd').textContent = nd15.toFixed(1);
  $('val-b6-na').textContent = na15.toFixed(1);

  const Nd = nd15 * 1e15;
  const Na = na15 * 1e15;
  const ni = 1.5e10; // Silicon ở 300K
  const kT = 0.0259;

  let n0 = ni, p0 = ni, typeLabel = 'Bù trừ hoàn toàn (Trở về Bán dẫn Nội tại: N_d = N_a)';
  if (Nd > Na) {
    const netD = Nd - Na;
    n0 = netD / 2 + Math.sqrt(Math.pow(netD / 2, 2) + ni * ni);
    p0 = (ni * ni) / n0;
    typeLabel = Na > 0 ? `Bán dẫn Bù trừ Loại N (N_d - N_a = ${(netD/1e15).toFixed(1)}×10¹⁵ cm⁻³)` : `Bán dẫn Loại N thuần (N_d = ${(Nd/1e15).toFixed(1)}×10¹⁵ cm⁻³)`;
  } else if (Na > Nd) {
    const netA = Na - Nd;
    p0 = netA / 2 + Math.sqrt(Math.pow(netA / 2, 2) + ni * ni);
    n0 = (ni * ni) / p0;
    typeLabel = Nd > 0 ? `Bán dẫn Bù trừ Loại P (N_a - N_d = ${(netA/1e15).toFixed(1)}×10¹⁵ cm⁻³)` : `Bán dẫn Loại P thuần (N_a = ${(Na/1e15).toFixed(1)}×10¹⁵ cm⁻³)`;
  }

  const dEf_eV = kT * Math.log(n0 / ni); // EF - EFi

  descEl.innerHTML = `<b>Kết quả giải Phương trình Trung hòa điện tích ($n_0 + N_a = p_0 + N_d$) — ${typeLabel}:</b><br>` +
    `• Nồng độ Electron cân bằng: $\\mathbf{n_0 \\approx ${n0.toExponential(2)}\\text{ cm}^{-3}}$ | Nồng độ Lỗ trống cân bằng: $\\mathbf{p_0 \\approx ${p0.toExponential(2)}\\text{ cm}^{-3}}$.<br>` +
    `• Vị trí mức Fermi so với mức nội tại $E_{Fi}$: $\\mathbf{E_F - E_{Fi} = kT\\ln(n_0/n_i) \\approx ${dEf_eV >= 0 ? '+' : ''}${dEf_eV.toFixed(3)}\\text{ eV}}$ (${dEf_eV > 0.001 ? 'Nằm trên E_Fi' : (dEf_eV < -0.001 ? 'Nằm dưới E_Fi' : 'Trùng khít E_Fi')}).`;

  let svg = '';
  // Bên trái: Biểu đồ cột so sánh N_d, N_a và Hiệu số tạp chất |N_d - N_a|
  const bx = 65, by = 210, bh = 155;
  svg += `<line x1="${bx}" y1="35" x2="${bx}" y2="${by}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<line x1="${bx}" y1="${by}" x2="365" y2="${by}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<text x="215" y="25" text-anchor="middle" style="font-weight:800;fill:var(--c5)">Cân bằng Tạp chất Bù trừ (×10¹⁵ cm⁻³)</text>`;

  const hNd = (nd15 / 15) * bh;
  const hNa = (na15 / 15) * bh;
  const netVal = Math.abs(nd15 - na15);
  const hNet = (netVal / 15) * bh;

  svg += `<rect x="95" y="${by-hNd}" width="55" height="${hNd}" rx="6" fill="var(--c1)"/>`;
  svg += `<text x="122.5" y="${by-hNd-8}" text-anchor="middle" style="font-weight:800;fill:var(--c1)">${nd15.toFixed(1)}</text>`;
  svg += `<text x="122.5" y="${by+20}" text-anchor="middle" style="font-weight:700">Donor N_d</text>`;

  svg += `<rect x="185" y="${by-hNa}" width="55" height="${hNa}" rx="6" fill="var(--c3)"/>`;
  svg += `<text x="212.5" y="${by-hNa-8}" text-anchor="middle" style="font-weight:800;fill:var(--c3)">${na15.toFixed(1)}</text>`;
  svg += `<text x="212.5" y="${by+20}" text-anchor="middle" style="font-weight:700">Acceptor N_a</text>`;

  const netCol = Nd >= Na ? 'var(--c2)' : 'var(--c4)';
  svg += `<rect x="275" y="${by-hNet}" width="60" height="${hNet}" rx="6" fill="${netCol}"/>`;
  svg += `<text x="305" y="${by-hNet-8}" text-anchor="middle" style="font-weight:800;fill:${netCol}">${netVal.toFixed(1)}</text>`;
  svg += `<text x="305" y="${by+20}" text-anchor="middle" style="font-weight:700">${Nd>=Na ? 'Dư N_d - N_a' : 'Dư N_a - N_d'}</text>`;

  // Bên phải: Giản đồ vùng năng lượng với E_c, E_d, E_Fi, E_a, E_v và vạch E_F di chuyển
  svg += `<rect x="395" y="22" width="265" height="220" rx="12" fill="var(--card)" stroke="var(--g)"/>`;
  svg += `<text x="527" y="44" text-anchor="middle" style="font-weight:800;fill:var(--c5)">Vị trí Mức Fermi E_F trong Vùng cấm</text>`;
  const yEc = 70, yEv = 206, yFi = 138;
  svg += `<line x1="415" y1="${yEc}" x2="635" y2="${yEc}" stroke="var(--c1)" stroke-width="3"/>`;
  svg += `<text x="640" y="${yEc+4}" style="font-weight:800;fill:var(--c1)">Ec</text>`;
  svg += `<line x1="415" y1="${yEv}" x2="635" y2="${yEv}" stroke="var(--c2)" stroke-width="3"/>`;
  svg += `<text x="640" y="${yEv+4}" style="font-weight:800;fill:var(--c2)">Ev</text>`;
  svg += `<line x1="415" y1="${yFi}" x2="635" y2="${yFi}" stroke="var(--mut)" stroke-width="1.8" stroke-dasharray="4,4"/>`;
  svg += `<text x="638" y="${yFi+4}" style="font-size:12px;font-weight:700;fill:var(--mut)">EFi</text>`;

  const yEF = yFi - (dEf_eV / 0.56) * 62;
  svg += `<line x1="415" y1="${yEF}" x2="635" y2="${yEF}" stroke="var(--c4)" stroke-width="3" stroke-dasharray="8,4"/>`;
  svg += `<text x="422" y="${yEF - 7}" style="font-size:12.5px;font-weight:800;fill:var(--c4)">E_F (${dEf_eV>=0?'+':''}${dEf_eV.toFixed(2)} eV so với E_Fi)</text>`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderB6CompSim = renderB6CompSim;

// MÔ HÌNH BUỔI 6.3: 3 VÙNG NHIỆT ĐỘ CỦA n0(T) VÀ E_F(T) (FIGURES 4.16 & 4.19)
function renderB6TempRegimesSim() {
  const svgEl = $('b6-temp-svg'), descEl = $('b6-temp-desc');
  if (!svgEl || !descEl) return;
  const T = +$('sl-b6-temp').value;
  const logNd = $('sel-b6-dop') ? +$('sel-b6-dop').value : 15;
  $('val-b6-temp').textContent = T;
  $('val-b6-dop').innerHTML = `10<sup>${logNd}</sup>`;

  const Nd = Math.pow(10, logNd);
  const calcStateAtT = (temp) => {
    const kT = Math.max(0.0015, 0.0259 * (temp / 300));
    const Nc = 2.8e19 * Math.pow(temp / 300, 1.5);
    const Nv = 1.04e19 * Math.pow(temp / 300, 1.5);
    const ni = Math.sqrt(Nc * Nv) * Math.exp(-1.12 / (2 * kT));
    // Tỷ lệ ion hóa ở nhiệt độ thấp (Freeze-out model)
    const xIon = (Nc / (2 * Nd)) * Math.exp(-0.045 / kT);
    const fracIon = (-xIon + Math.sqrt(xIon * xIon + 4 * xIon)) / 2;
    const Nd_plus = Nd * Math.min(1, Math.max(0.001, fracIon));
    const n0 = Nd_plus / 2 + Math.sqrt(Math.pow(Nd_plus / 2, 2) + ni * ni);
    const dEf = Math.min(0.56, kT * Math.log(Math.max(1, n0 / Math.max(1e-30, ni))));
    return { n0, ni, dEf, fracIon };
  };

  const cur = calcStateAtT(T);
  let regimeName = 'Vùng 2: Vùng Ngoại lai / Pha tạp (Extrinsic Region — Ion hóa hoàn toàn, n₀ ≈ N_d không đổi)';
  if (T < 110) regimeName = 'Vùng 1: Vùng Đóng băng / Ion hóa một phần (Freeze-Out / Partial Ionization — T quá thấp)';
  else if (cur.ni > 0.25 * Nd) regimeName = 'Vùng 3: Vùng Nội tại Nhiệt độ cao (Intrinsic Region — n_i(T) tăng vọt lấn át N_d!)';

  descEl.innerHTML = `<b>Trạng thái tại $T = ${T}\\text{ K}$ — ${regimeName}:</b><br>` +
    `• Nồng độ electron: $\\mathbf{n_0(${T}\\text{ K}) \\approx ${cur.n0.toExponential(2)}\\text{ cm}^{-3}}$ (trong khi $n_i(${T}\\text{ K}) \\approx ${cur.ni.toExponential(2)}\\text{ cm}^{-3}$).<br>` +
    `• Độ lệch mức Fermi: $\\mathbf{E_F - E_{Fi} \\approx +${cur.dEf.toFixed(3)}\\text{ eV}}$ (Khi $T$ tăng cao, $E_F$ kéo dần về $E_{Fi} = 0$).`;

  let svg = '';
  // Đồ thị Trái: n0(T) theo T từ 20K đến 700K (Figure 4.16)
  const x1 = 52, y1 = 220, w1 = 265, h1 = 180;
  svg += `<line x1="${x1}" y1="${y1-h1}" x2="${x1}" y2="${y1}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<line x1="${x1}" y1="${y1}" x2="${x1+w1}" y2="${y1}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<text x="${x1+w1/2}" y="24" text-anchor="middle" style="font-size:12.5px;font-weight:800;fill:var(--c1)">1. Đồ thị n₀(T): 3 Vùng Nhiệt Độ (Fig 4.16)</text>`;
  svg += `<text x="${x1+w1/2}" y="248" text-anchor="middle" style="font-size:12px;font-weight:700">Nhiệt độ T (K)</text>`;

  // Đồ thị Phải: E_F - E_Fi theo T từ 20K đến 700K (Figure 4.19)
  const x2 = 385, y2 = 220, w2 = 265, h2 = 180, y2Mid = y2 - h2 / 2;
  svg += `<line x1="${x2}" y1="${y2-h2}" x2="${x2}" y2="${y2}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<line x1="${x2}" y1="${y2Mid}" x2="${x2+w2}" y2="${y2Mid}" stroke="var(--mut)" stroke-width="1.5" stroke-dasharray="4,4"/>`;
  svg += `<line x1="${x2}" y1="${y2}" x2="${x2+w2}" y2="${y2}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<text x="${x2+w2/2}" y="24" text-anchor="middle" style="font-size:12.5px;font-weight:800;fill:var(--c5)">2. Vị trí E_F - E_Fi theo T (Fig 4.19)</text>`;
  svg += `<text x="${x2+w2/2}" y="248" text-anchor="middle" style="font-size:12px;font-weight:700">Nhiệt độ T (K)</text>`;
  svg += `<text x="${x2-6}" y="${y2Mid+4}" text-anchor="end" style="font-size:11px;font-weight:700;fill:var(--mut)">E_Fi</text>`;
  svg += `<text x="${x2-6}" y="${y2-h2+14}" text-anchor="end" style="font-size:11px;font-weight:700;fill:var(--c1)">E_c</text>`;
  svg += `<text x="${x2-6}" y="${y2-4}" text-anchor="end" style="font-size:11px;font-weight:700;fill:var(--c2)">E_v</text>`;

  let pathN0 = '', pathNi = '', pathEfN = '', pathEfP = '';
  for (let temp = 25; temp <= 700; temp += 15) {
    const st = calcStateAtT(temp);
    const px1 = x1 + ((temp - 20) / 680) * w1;
    const lgN0 = Math.max(12, Math.min(17.2, Math.log10(st.n0)));
    const py1 = y1 - ((lgN0 - 12) / 5.2) * h1;
    pathN0 += (temp === 25 ? 'M' : 'L') + `${px1.toFixed(1)} ${py1.toFixed(1)} `;

    if (temp >= 360) {
      const lgNi = Math.max(12, Math.min(17.2, Math.log10(st.ni)));
      const pyNi = y1 - ((lgNi - 12) / 5.2) * h1;
      pathNi += (pathNi === '' ? 'M' : 'L') + `${px1.toFixed(1)} ${pyNi.toFixed(1)} `;
    }

    const px2 = x2 + ((temp - 20) / 680) * w2;
    const pyEfN = y2Mid - (st.dEf / 0.62) * (h2 / 2);
    const pyEfP = y2Mid + (st.dEf / 0.62) * (h2 / 2);
    pathEfN += (temp === 25 ? 'M' : 'L') + `${px2.toFixed(1)} ${pyEfN.toFixed(1)} `;
    pathEfP += (temp === 25 ? 'M' : 'L') + `${px2.toFixed(1)} ${pyEfP.toFixed(1)} `;
  }
  svg += `<path d="${pathNi}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="5,4"/>`;
  svg += `<path d="${pathN0}" fill="none" stroke="var(--c1)" stroke-width="3.5"/>`;
  svg += `<path d="${pathEfP}" fill="none" stroke="var(--c2)" stroke-width="2.5" stroke-dasharray="4,3"/>`;
  svg += `<path d="${pathEfN}" fill="none" stroke="var(--c5)" stroke-width="3.2"/>`;

  // Điểm đánh dấu tại nhiệt độ T đang chọn
  const curPx1 = x1 + ((T - 20) / 680) * w1;
  const curPy1 = y1 - ((Math.max(12, Math.min(17.2, Math.log10(cur.n0))) - 12) / 5.2) * h1;
  svg += `<circle cx="${curPx1}" cy="${curPy1}" r="6.5" fill="var(--c4)" stroke="#fff" stroke-width="2"/>`;

  const curPx2 = x2 + ((T - 20) / 680) * w2;
  const curPy2 = y2Mid - (cur.dEf / 0.62) * (h2 / 2);
  svg += `<circle cx="${curPx2}" cy="${curPy2}" r="6.5" fill="var(--c4)" stroke="#fff" stroke-width="2"/>`;

  svg += `<text x="${x1+20}" y="195" style="font-size:11px;font-weight:800;fill:var(--c4)">1. Đóng băng</text>`;
  svg += `<text x="${x1+95}" y="110" style="font-size:11px;font-weight:800;fill:var(--c2)">2. Ngoại lai (n₀=Nd)</text>`;
  svg += `<text x="${x1+195}" y="66" style="font-size:11px;font-weight:800;fill:var(--c1)">3. Nội tại</text>`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderB6TempRegimesSim = renderB6TempRegimesSim;

// MÔ HÌNH BUỔI 6.4: SỰ SAN BẰNG MỨC FERMI KHI HAI VẬT LIỆU TIẾP XÚC (FIGURE 4.20)
function renderB6ContactSim(stage, btn) {
  if (btn) {
    document.querySelectorAll('#b6-contact-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const svgEl = $('b6-contact-svg'), descEl = $('b6-contact-desc');
  if (!svgEl || !descEl) return;
  let svg = '';

  const drawStack = (x, yTop, yFermi, label, fLabel) => {
    for (let i = 0; i < 10; i++) {
      const y = yTop + i * 14;
      const isFilled = y >= yFermi;
      svg += `<rect x="${x}" y="${y}" width="150" height="14" fill="${isFilled ? 'rgba(47,111,237,0.28)' : 'rgba(130,140,190,0.10)'}" stroke="var(--g)" stroke-width="1"/>`;
      if (isFilled) {
        svg += `<circle cx="${x+75}" cy="${y+7}" r="3.5" fill="var(--c1)"/>`;
      }
    }
    svg += `<line x1="${x-25}" y1="${yFermi}" x2="${x+175}" y2="${yFermi}" stroke="var(--c4)" stroke-width="3" stroke-dasharray="7,4"/>`;
    svg += `<text x="${x-30}" y="${yFermi+4}" text-anchor="end" style="font-weight:800;fill:var(--c4)">${fLabel}</text>`;
    svg += `<text x="${x+75}" y="${yTop+162}" text-anchor="middle" style="font-weight:800;fill:var(--ink)">${label}</text>`;
  };

  if (stage === 'before') {
    drawStack(120, 35, 77, 'Vật liệu A (Mức E_FA cao)', 'E_FA');
    drawStack(420, 35, 119, 'Vật liệu B (Mức E_FB thấp)', 'E_FB');
    descEl.innerHTML = `<b>1. Trước khi tiếp xúc (Figure 4.20a, b):</b> Vật liệu A và Vật liệu B đứng tách rời nhau. Ở Vật liệu A, các trạng thái dưới $E_{FA}$ đầy electron; ở Vật liệu B, các trạng thái dưới $E_{FB}$ đầy electron ($E_{FA} > E_{FB}$).`;
  } else if (stage === 'instant') {
    drawStack(120, 35, 77, 'Vật liệu A (Nhường bớt e⁻)', 'E_FA');
    drawStack(420, 35, 119, 'Vật liệu B (Nhận thêm e⁻)', 'E_FB');
    svg += `<path d="M 280 85 Q 345 55 410 105" fill="none" stroke="var(--c1)" stroke-width="4"/>`;
    svg += `<polygon points="412,107 398,104 405,94" fill="var(--c1)"/>`;
    svg += `<text x="345" y="62" text-anchor="middle" style="font-weight:800;fill:var(--c1)">Electron chảy từ A sang B</text>`;
    descEl.innerHTML = `<b>2. Khoảnh khắc vừa đặt tiếp xúc (Figure 4.20c):</b> Vì các electron ở đỉnh Vật liệu A có mức năng lượng cao hơn các chỗ trống ở Vật liệu B, electron lập tức chảy từ Vật liệu A sang điền vào các trạng thái trống thấp hơn của Vật liệu B!`;
  } else {
    drawStack(120, 35, 105, 'Vật liệu A (Ở cân bằng nhiệt)', 'E_F');
    drawStack(420, 35, 105, 'Vật liệu B (Ở cân bằng nhiệt)', 'E_F');
    svg += `<line x1="270" y1="105" x2="420" y2="105" stroke="var(--c4)" stroke-width="3" stroke-dasharray="7,4"/>`;
    svg += `<text x="345" y="95" text-anchor="middle" style="font-weight:800;fill:var(--c2)">E_FA = E_FB = E_F (San bằng!)</text>`;
    descEl.innerHTML = `<b>3. Khi đã đạt Trạng thái Cân bằng Nhiệt (Figure 4.20d):</b> Dòng dịch chuyển hạt dừng lại khi <b>Mức năng lượng Fermi ở cả hai vật liệu san bằng ngang nhau trên một đường thẳng duy nhất ($\\mathbf{E_{FA} = E_{FB} = E_F}$)</b>. Đây là định lý nền tảng nhất để vẽ giản đồ vùng năng lượng của Diode P-N và Transistor!`;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderB6ContactSim = renderB6ContactSim;

/* =========================================================
   HỆ THỐNG TẢI BÀI HỌC THEO YÊU CẦU (ON-DEMAND LOADER) & MỤC LỤC
   ========================================================= */
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

function arrangeSims(root){}
function loadLesson(lessonId) {
  const mainEl = $('app-content');
  if (lessonId === '1') {
    mainEl.innerHTML = $('tpl-buoi-1').innerHTML;
    if (window.LabB1) LabB1.mark(mainEl);
  } else if (lessonId === '2') {
    mainEl.innerHTML = $('tpl-buoi-2').innerHTML;
    if (window.LabB2) LabB2.mark(mainEl);
  } else if (lessonId === '3') {
    mainEl.innerHTML = $('tpl-buoi-3').innerHTML;
    if (window.LabB3) LabB3.mark(mainEl);
  } else if (lessonId === '4') {
    mainEl.innerHTML = $('tpl-buoi-4').innerHTML;
    if (window.LabB4) LabB4.mark(mainEl);
  } else if (lessonId === '5') {
    const tpl = $('tpl-buoi-5');
    mainEl.innerHTML = tpl.innerHTML;
    if (window.LabB5) LabB5.mark(mainEl);
  } else if (lessonId === '6') {
    const tpl = $('tpl-buoi-6');
    mainEl.innerHTML = tpl.innerHTML;
    // Khởi tạo toàn bộ 4 mô hình tương tác của Buổi 6
    renderB6FermiIntegralSim();
    renderB6CompSim();
    renderB6TempRegimesSim();
    renderB6ContactSim('before');
    if (window.LabB6) LabB6.mark(mainEl);
  } else if (lessonId === '7') {
    const tpl = $('tpl-buoi-7');
    mainEl.innerHTML = tpl.innerHTML;
    if (window.LabB7) LabB7.mark(mainEl);
  } else if (lessonId === '8') {
    mainEl.innerHTML = $('tpl-buoi-8').innerHTML;
    if (window.LabB8) LabB8.mark(mainEl);
  } else if (lessonId === '9') {
    mainEl.innerHTML = $('tpl-buoi-9').innerHTML;
    if (window.LabB9) LabB9.mark(mainEl);
  } else if (lessonId === '9.5') {
    mainEl.innerHTML = $('tpl-buoi-9-5').innerHTML;
    if (window.LabB95) LabB95.mark(mainEl);
  } else if (lessonId === '10') {
    mainEl.innerHTML = $('tpl-buoi-10').innerHTML;
    if (window.LabB10) LabB10.mark(mainEl);
  } else if (lessonId === '11') {
    mainEl.innerHTML = $('tpl-buoi-11').innerHTML;
    if (window.LabB11) LabB11.mark(mainEl);
  } else if (lessonId === '12') {
    mainEl.innerHTML = $('tpl-buoi-12').innerHTML;
    if (window.LabB12) LabB12.mark(mainEl);
  } else {
    const tpl = $('tpl-buoi-pending');
    mainEl.innerHTML = tpl.innerHTML;
    const titles = {
      '6': 'Buổi 6: Bán Dẫn Pha Tạp & Bán Dẫn Suy Biến'
    };
    $('pending-badge').textContent = 'HỌC PHẦN ENP2209 · BUỔI ' + lessonId;
    $('pending-title').textContent = titles[lessonId] || ('Buổi ' + lessonId);
  }

  upgradeCustomSelects(document);
  arrangeSims(mainEl);
  buildTOC();
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([mainEl]);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.loadLesson = loadLesson;

const BAN_DAN_LESSONS = [
  { id: '1', title: 'Buổi 1: Cấu trúc tinh thể chất rắn' },
  { id: '2', title: 'Buổi 2: Nhập môn Cơ học lượng tử (Phần 1)' },
  { id: '3', title: 'Buổi 3: Nhập môn Cơ học lượng tử (Phần 2)' },
  { id: '4', title: 'Buổi 4: Lý thuyết lượng tử chất rắn' },
  { id: '5', title: 'Buổi 5: Bán dẫn ở trạng thái cân bằng' },
  { id: '6', title: 'Buổi 6: Bán dẫn pha tạp & Bán dẫn suy biến' },
  { id: '7', title: 'Buổi 7: Vận chuyển hạt tải (Trôi & Khuếch tán)' },
  { id: '8', title: 'Buổi 8: Hạt tải dư (Sinh, tái hợp & vận chuyển lưỡng cực)' },
  { id: '9', title: 'Buổi 9: Tiếp giáp p-n' },
  { id: '9.5', title: 'Buổi 9.5: Điốt tiếp giáp p-n' },
  { id: '10', title: 'Buổi 10: Tiếp xúc kim loại–bán dẫn & Dị tiếp giáp' },
  { id: '11', title: 'Buổi 11: Transistor hiệu ứng trường MOSFET' },
  { id: '12', title: 'Buổi 12: Transistor lưỡng cực BJT' }
];
function renderLS(curId) {
  const lsEl = $('ls');
  if (!lsEl) return;
  lsEl.innerHTML = BAN_DAN_LESSONS.map(l =>
    `<button type="button" data-id="${l.id}" title="${l.title}" aria-label="${l.title}" class="${String(l.id) === String(curId) ? 'on' : ''}">${l.id}</button>`
  ).join('');
  if (window.updateTaskbar) window.updateTaskbar(curId);
}

// Khởi chạy menu 3 gạch góc trên bên trái và nạp Buổi 7
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
    if (e.key === 'Escape' && !nav.hidden) {
      setOpen(false);
      btn.focus();
    }
  });

  loadLesson('7');
  renderLS('7');
})();


/* ===== Ghim công thức (phím T) ===== */
(function(){
  const LS='ban-dan-fp';
  const $=id=>document.getElementById(id);
  const store={get(k,d){try{const v=localStorage.getItem(LS+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(LS+k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(LS+k)}catch(e){}}};

  let rows=[],lastAdded=null,tabs=[],cur=0;
  let picking=false,hl=null;
  function place(h){const c={h},r=rows.find(r=>r.includes(lastAdded))||rows[rows.length-1];r?r.push(c):rows.push([c]);return c}
  const save=()=>{tabs[cur].rows=rows;store.set('tabs4',tabs.map(t=>({n:t.n,rows:t.rows.map(r=>r.map(c=>c.h))})));store.set('cur',cur)};
  {const t4=store.get('tabs4',null);
   if(t4&&t4.length)tabs=t4.map(t=>({n:t.n,rows:t.rows.map(a=>a.map(h=>({h})))}));
   else{const r3=store.get('rows3',null);tabs=[{n:'Tab 1',rows:r3?r3.map(a=>a.map(h=>({h}))):store.get('pins2',[]).filter(x=>typeof x==='string'&&x.trim()).map(h=>[{h}])}]}
   cur=Math.min(store.get('cur',0),tabs.length-1);rows=tabs[cur].rows}
  const LIM=()=>Math.max(260,Math.min(innerWidth-110,700));
  const ready=()=>window.MathJax&&MathJax.startup&&MathJax.startup.promise?MathJax.startup.promise.then(()=>MathJax.typesetPromise&&MathJax.typesetPromise([$('fp-list')])).catch(()=>{}):Promise.resolve();
  function fitNew(){
    const r=rows.find(r=>r.includes(lastAdded)),e=cells().find(e=>e._c===lastAdded);if(!r||!e||r.length<2)return;
    let w=0;[...e.parentNode.children].forEach(x=>w+=x.getBoundingClientRect().width+3);
    if(w>LIM()){r.splice(r.indexOf(lastAdded),1);rows.splice(rows.indexOf(r)+1,0,[lastAdded]);save();render()}
  }
  function delCell(c){rows.forEach(r=>{const i=r.indexOf(c);if(i>-1)r.splice(i,1)});rows=rows.filter(r=>r.length);if(lastAdded===c)lastAdded=null;save();render()}
  function renderTabs(){
    const T=$('fp-tabs');T.classList.toggle('on',tabs.length>1);T.innerHTML='';
    tabs.forEach((t,i)=>{const b=document.createElement('div');b.className='fp-tb'+(i===cur?' on':'');b.textContent=t.n;
      if(tabs.length>1){const x=document.createElement('i');x.textContent='✕';x.onclick=ev=>{ev.stopPropagation();closeTab(i)};b.appendChild(x)}
      b.onclick=()=>switchTab(i);b.onpointerdown=e=>tabDragStart(e,t);b.onauxclick=ev=>{if(ev.button===1)closeTab(i)};
      b.ondblclick=()=>{const n=prompt('Tên tab',t.n);if(n&&n.trim()){t.n=n.trim().slice(0,16);save();renderTabs()}};
      T.appendChild(b)});
  }
  function switchTab(i){if(i===cur)return;tabs[cur].rows=rows;cur=i;rows=tabs[i].rows;lastAdded=null;save();renderTabs();render()}
  function closeTab(i){if(tabs.length<2)return;tabs[cur].rows=rows;tabs.splice(i,1);if(cur>i)cur--;else if(cur===i)cur=Math.min(i,tabs.length-1);rows=tabs[cur].rows;lastAdded=null;save();renderTabs();render()}
  function newTab(){tabs[cur].rows=rows;tabs.push({n:'Tab '+(tabs.length+1),rows:[]});cur=tabs.length-1;rows=tabs[cur].rows;lastAdded=null;setCol(false);save();renderTabs();render()}

  /* ----- dựng popup ----- */
  const ICON_ADD='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 3H4l3 5-3 5h5"/><path d="M11.5 9.5v4M9.5 11.5h4"/></svg>';
  const ICON_TAB='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6h12M8 8v3.5M6.25 9.75h3.5"/></svg>';
  const fp=document.createElement('div');fp.id='fp';fp.setAttribute('role','dialog');fp.setAttribute('aria-label','Công thức ghim');
  fp.innerHTML=`<div class="fp-h" id="fp-h"><button class="fp-b fp-x" id="fp-x" type="button" aria-label="Đóng" title="Đóng">✕</button><button class="fp-b" id="fp-add" type="button" aria-label="Thêm công thức (H)" title="Thêm công thức (H)">${ICON_ADD}</button><button class="fp-b" id="fp-tab" type="button" aria-label="Thêm tab" title="Thêm tab">${ICON_TAB}</button><div class="fp-t" id="fp-tabs"></div></div><div class="fp-l" id="fp-list"></div>`;
  document.body.appendChild(fp);

  /* ----- vẽ danh sách ghim ----- */
  function typeset(n){
    if(window.MathJax&&MathJax.typesetPromise){
      const run=()=>MathJax.typesetPromise([n]).catch(()=>{});
      (MathJax.startup&&MathJax.startup.promise?MathJax.startup.promise.then(run):run());
    }
  }
  function render(){
    const L=$('fp-list');L.innerHTML='';
    rows.forEach(r=>{const d=document.createElement('div');d.className='fp-r';r.forEach(c=>{const e=document.createElement('div');e.className='fp-f';e.innerHTML=c.h;e._c=c;e.addEventListener('pointerdown',dragStart);e.addEventListener('contextmenu',ev=>{ev.preventDefault();ev.stopPropagation();delCell(c)},true);d.appendChild(e)});L.appendChild(d)});
    typeset(L);
  }
  const cells=()=>[...$('fp-list').querySelectorAll('.fp-f')];
  function findDrop(px,py,c){
    let best=null,bd=1e9;
    cells().forEach(el=>{if(el._c===c)return;const r=el.getBoundingClientRect(),d=Math.hypot(Math.max(r.left-px,0,px-r.right),Math.max(r.top-py,0,py-r.bottom));if(d<bd){bd=d;best=el}});
    if(!best||bd>36)return null;
    const r=best.getBoundingClientRect(),nx=(px-(r.left+r.right)/2)/(r.width/2),ny=(py-(r.top+r.bottom)/2)/(r.height/2);
    return{t:best._c,side:Math.abs(nx)>Math.abs(ny)?(nx<0?'left':'right'):(ny<0?'top':'bottom')};
  }
  function showInd(d,ind){
    if(!d){ind.style.display='none';return}
    const el=cells().find(x=>x._c===d.t),v=d.side==='left'||d.side==='right',r=(v?el:el.parentNode).getBoundingClientRect(),F=fp.getBoundingClientRect();
    const x=d.side==='left'?r.left:d.side==='right'?r.right:r.left,y=d.side==='top'?r.top:d.side==='bottom'?r.bottom:r.top;
    ind.style.cssText=`display:block;left:${x-F.left-(v?2:0)}px;top:${y-F.top-(v?0:2)}px;width:${v?3:r.width}px;height:${v?r.height:3}px`;
  }
  function doDrop(c,d){
    rows.forEach(r=>{const i=r.indexOf(c);if(i>-1)r.splice(i,1)});
    const ri=rows.findIndex(r=>r.includes(d.t)),r=rows[ri];
    if(d.side==='left')r.splice(r.indexOf(d.t),0,c);
    else if(d.side==='right')r.splice(r.indexOf(d.t)+1,0,c);
    else rows.splice(d.side==='top'?ri:ri+1,0,[c]);
    rows=rows.filter(r=>r.length);save();
  }
  function toTab(c,i){rows.forEach(r=>{const k=r.indexOf(c);if(k>-1)r.splice(k,1)});rows=rows.filter(r=>r.length);tabs[i].rows.push([c]);if(lastAdded===c)lastAdded=null;save()}
  function tabDragStart(e,t){
    if(e.button>0||e.target.closest('i'))return;
    const sx=e.clientX;let moved=false;
    const mv=ev=>{
      if(!moved){if(Math.abs(ev.clientX-sx)<5)return;moved=true;switchTab(tabs.indexOf(t))}
      const j=[...$('fp-tabs').children].findIndex(el=>{const r=el.getBoundingClientRect();return ev.clientX>=r.left&&ev.clientX<r.right}),i=tabs.indexOf(t);
      if(j<0||j===i)return;
      const ct=tabs[cur];tabs.splice(i,1);tabs.splice(j,0,t);cur=tabs.indexOf(ct);save();renderTabs();
    };
    const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up)};
    addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);
  }
  function dragStart(e){
    if(e.button>0)return;
    const cell=e.currentTarget,c=cell._c,sx=e.clientX,sy=e.clientY,ind=document.createElement('div');ind.className='fp-ind';
    let g=null,drop=null,moved=false,th=null;
    const mv=ev=>{
      if(!moved){
        if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<5)return;
        moved=true;const r=cell.getBoundingClientRect();
        g=cell.cloneNode(true);g.className='fp-g';g.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;pointer-events:none;z-index:70`;
        document.body.appendChild(g);cell.classList.add('fp-d');fp.appendChild(ind);
      }
      g.style.transform=`translate(${ev.clientX-sx}px,${ev.clientY-sy}px)`;
      const te=document.elementFromPoint(ev.clientX,ev.clientY),tb=te&&te.closest&&te.closest('.fp-tb'),tbs=[...$('fp-tabs').children];
      th=tb&&tbs.indexOf(tb)!==cur?tbs.indexOf(tb):null;tbs.forEach((x,k)=>x.classList.toggle('fp-td',k===th));
      drop=th!=null?null:findDrop(ev.clientX,ev.clientY,c);showInd(drop,ind);
    };
    const up=()=>{
      removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);
      if(!moved)return;g.remove();ind.remove();[...$('fp-tabs').children].forEach(x=>x.classList.remove('fp-td'));if(th!=null)toTab(c,th);else if(drop)doDrop(c,drop);render();
    };
    addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);
  }

  /* ----- vị trí: mặc định góc trên bên phải (CSS), kéo thì chuyển sang left/top ----- */
  function applyPos(p){
    if(!p){fp.style.left='';fp.style.top='';fp.style.right='';fp.style.maxWidth='';return}
    const r=fp.getBoundingClientRect();
    const x=Math.max(0,Math.min(p.x,innerWidth-Math.min(r.width,80))),y=Math.max(($('tb')?$('tb').offsetHeight:46)+8,Math.min(p.y,innerHeight-24));
    fp.style.right='auto';fp.style.left=x+'px';fp.style.top=y+'px';fp.style.maxWidth=Math.max(150,innerWidth-x-4)+'px';
  }
  addEventListener('resize',()=>{if(fp.classList.contains('on'))applyPos(store.get('pos',null))});
  $('fp-h').addEventListener('pointerdown',e=>{
    if(e.button>0||e.target.closest('button,.fp-t'))return;e.preventDefault();
    const r=fp.getBoundingClientRect(),sx=e.clientX,sy=e.clientY,x0=r.left,y0=r.top;let p=null,moved=false;
    const mv=ev=>{if(!moved&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<4)return;moved=true;p={x:x0+ev.clientX-sx,y:y0+ev.clientY-sy};applyPos(p)};
    const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);if(moved&&p)store.set('pos',p);else setCol(!fp.classList.contains('col'))};
    addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);
  });
  function setCol(on){fp.classList.toggle('col',on);store.set('col',on)}
  if(store.get('col',false))fp.classList.add('col');

  /* ----- mở / đóng ----- */
  function setOpen(on){
    fp.classList.toggle('on',on);store.set('open',on);
    if(on){applyPos(store.get('pos',null));renderTabs();render();const mb=$('mb');if(mb&&mb.getAttribute('aria-expanded')==='true')mb.click()}
    else setPick(false);
  }
  const toggle=()=>fp.classList.contains('on')?setCol(!fp.classList.contains('col')):setOpen(true);
  $('fp-x').onclick=()=>setOpen(false);

  /* ----- xóa ghim ----- */
  $('fp-tab').onclick=newTab;

  /* ----- thêm ghim: bấm nút rồi chọn vùng có công thức ----- */
  function setPick(on){
    picking=on;document.body.classList.toggle('fp-pick',on);$('fp-add').classList.toggle('on',on);
    if(!on&&hl){hl.classList.remove('fp-hl');hl=null}
  }
  $('fp-add').onclick=()=>setPick(!picking);

  /* tìm phần tử công thức tại điểm bấm */
  function findFormula(t,y){
    if(!t||!t.closest||t.closest('#fp'))return null;
    let el=t.closest('.f');if(el)return el;
    el=t.closest('mjx-container');if(el)return el;
    const card=t.closest('.formula-card');
    if(card){
      let best=null,bd=1e9;
      card.querySelectorAll('.f').forEach(f=>{const r=f.getBoundingClientRect(),d=y<r.top?r.top-y:y>r.bottom?y-r.bottom:0;if(d<bd){bd=d;best=f}});
      return best;
    }
    return null;
  }
  /* lấy đúng công thức (TeX gốc), bỏ chú thích/giải thích */
  function extract(el){
    const clone=el.cloneNode(true);
    clone.querySelectorAll('small,.fp-hl,mjx-assistive-mml').forEach(n=>{if(n.tagName==='SMALL')n.remove()});
    const orig=el.matches&&el.matches('mjx-container')?[el]:[...el.querySelectorAll('mjx-container')];
    const copy=clone.matches&&clone.matches('mjx-container')?[clone]:[...clone.querySelectorAll('mjx-container')];
    let items=[];
    try{if(window.MathJax&&MathJax.startup&&MathJax.startup.document)items=[...MathJax.startup.document.math]}catch(e){}
    let box=clone;
    copy.forEach((c,i)=>{
      const it=items.find(m=>m.typesetRoot===orig[i]);
      if(!it)return;
      const tex=it.display?'$$'+it.math+'$$':'$'+it.math+'$';
      if(c===clone){box=document.createElement('div');box.textContent=tex}
      else c.replaceWith(document.createTextNode(tex));
    });
    box.classList&&box.classList.remove('fp-hl');
    return box.innerHTML.trim();
  }
  function addPin(el){
    const h=extract(el);
    if(!h)return false;
    if(!rows.some(r=>r.some(c=>c.h===h))){lastAdded=place(h);save()}
    setCol(false);render();ready().then(()=>{fitNew();const L=$('fp-list');L.scrollTop=L.scrollHeight});
    return true;
  }
  document.addEventListener('mousemove',e=>{
    if(!picking)return;
    const f=findFormula(e.target,e.clientY);
    if(f===hl)return;
    if(hl)hl.classList.remove('fp-hl');
    hl=f;if(hl)hl.classList.add('fp-hl');
  },true);
  document.addEventListener('click',e=>{
    if(!picking||e.target.closest('#fp'))return;
    e.preventDefault();e.stopPropagation();
    const f=findFormula(e.target,e.clientY);
    if(f&&addPin(f))setPick(false);
  },true);

  /* ----- phím tắt ----- */
  document.addEventListener('keydown',e=>{
    const t=e.target,typing=t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable);
    const k=e.key;
    if((k==='t'||k==='T')&&!e.ctrlKey&&!e.metaKey&&(e.altKey||!typing)){e.preventDefault();toggle();return}
    if((k==='h'||k==='H')&&!e.ctrlKey&&!e.metaKey&&(e.altKey||!typing)){e.preventDefault();if(!fp.classList.contains('on'))setOpen(true);setPick(!picking);return}
    if(k==='Escape'&&picking)setPick(false);
  },true);

  window.formulaPin={toggle,open:()=>setOpen(true),close:()=>setOpen(false),pins:()=>rows.flat().map(c=>c.h)};
  if(store.get('open',false))setOpen(true);
})();


/* ===== Thanh taskbar: nhãn bài, ghim công thức, chuyển buổi, lên đầu ===== */
(function taskbar() {
  const $ = id => document.getElementById(id);
  let cur = '7';
  const idx = () => BAN_DAN_LESSONS.findIndex(l => String(l.id) === String(cur));
  window.updateTaskbar = id => {
    cur = String(id);
    const i = idx(), l = BAN_DAN_LESSONS[i];
    if (!l) return;
    $('tb-badge').textContent = 'Buổi ' + l.id;
    $('tb-title').textContent = l.title.replace(/^Buổi\s*\d+(?:\.\d+)?\s*:\s*/, '');
    $('tb-prev').disabled = i <= 0;
    $('tb-next').disabled = i >= BAN_DAN_LESSONS.length - 1;
    $('tb-lab').hidden = !(['1', '2', '3', '4', '5', '6', '7', '8'].includes(String(id)) || (String(id) === '9' && !!window.LabB9) || (String(id) === '9.5' && !!window.LabB95) || (String(id) === '10' && !!window.LabB10) || (String(id) === '11' && !!window.LabB11) || (String(id) === '12' && !!window.LabB12));
    if (String(id) !== '1' && window.LabB1) LabB1.close();
    if (String(id) !== '2' && window.LabB2) LabB2.close();
    if (String(id) !== '3' && window.LabB3) LabB3.close();
    if (String(id) !== '4' && window.LabB4) LabB4.close();
    if (String(id) !== '5' && window.LabB5) LabB5.close();
    if (String(id) !== '6' && window.LabB6) LabB6.close();
    if (String(id) !== '7' && window.LabB7) LabB7.close();
    if (String(id) !== '8' && window.LabB8) LabB8.close();
    if (String(id) !== '9' && window.LabB9) LabB9.close();
    if (String(id) !== '9.5' && window.LabB95) LabB95.close();
    if (String(id) !== '10' && window.LabB10) LabB10.close();
    if (String(id) !== '11' && window.LabB11) LabB11.close();
    if (String(id) !== '12' && window.LabB12) LabB12.close();
  };
  const go = d => {
    const l = BAN_DAN_LESSONS[idx() + d];
    if (!l) return;
    loadLesson(l.id);
    renderLS(l.id);
    window.scrollTo(0, 0);
  };
  $('tb-prev').onclick = () => go(-1);
  $('tb-next').onclick = () => go(1);
  $('tb-lab').onclick = () => {
    const bd = $('tb-badge').textContent;
    const L = bd === 'Buổi 1' ? window.LabB1
            : bd === 'Buổi 2' ? window.LabB2
            : bd === 'Buổi 3' ? window.LabB3
            : bd === 'Buổi 4' ? window.LabB4
            : bd === 'Buổi 8' ? window.LabB8
            : bd === 'Buổi 9' ? window.LabB9
            : bd === 'Buổi 9.5' ? window.LabB95
            : bd === 'Buổi 10' ? window.LabB10
            : bd === 'Buổi 11' ? window.LabB11
            : bd === 'Buổi 12' ? window.LabB12
            : bd === 'Buổi 5' ? window.LabB5
            : bd === 'Buổi 6' ? window.LabB6
            : window.LabB7;
    if (!L) return;
    const r = document.getElementById(
      L === window.LabB1 ? 'lab1'
      : L === window.LabB2 ? 'lab2'
      : L === window.LabB3 ? 'lab3'
      : L === window.LabB4 ? 'lab4'
      : L === window.LabB8 ? 'lab8'
      : L === window.LabB9 ? 'lab9'
      : L === window.LabB95 ? 'lab95'
      : L === window.LabB10 ? 'lab10'
      : L === window.LabB11 ? 'lab11'
      : L === window.LabB12 ? 'lab12'
      : L === window.LabB5 ? 'lab5'
      : L === window.LabB6 ? 'lab6'
      : 'lab'
    );
    r && !r.hidden ? L.close() : L.open();
  };
  $('tb-top').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const fp = $('fp'), bf = $('tb-fp');
  bf.onclick = () => {
    if (!window.formulaPin) return;
    fp.classList.contains('on') ? window.formulaPin.close() : window.formulaPin.open();
  };
  if (fp) {
    const sync = () => {
      const on = fp.classList.contains('on');
      bf.classList.toggle('on', on);
      bf.setAttribute('aria-pressed', on);
    };
    new MutationObserver(sync).observe(fp, { attributes: true, attributeFilter: ['class'] });
    sync();
  }
  const i0 = BAN_DAN_LESSONS.find(l => $('ls') && $('ls').querySelector('button.on') && String(l.id) === $('ls').querySelector('button.on').dataset.id);
  window.updateTaskbar(i0 ? i0.id : '7');
})();
