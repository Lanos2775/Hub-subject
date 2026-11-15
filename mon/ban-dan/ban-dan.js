const $ = id => document.getElementById(id);

function togglePanel(id) {
  const el = $(id);
  if (el) el.classList.toggle('open');
}
window.togglePanel = togglePanel;

/* =========================================================
   MÔ HÌNH 1: BA LOẠI CHẤT RẮN (AMORPHOUS, POLY, SINGLE)
   ========================================================= */
function renderSolidModel(type, btn) {
  if (btn) {
    document.querySelectorAll('#solid-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const descEl = $('solid-desc');
  const svgEl = $('solid-svg');
  if (!descEl || !svgEl) return;

  let svg = '';
  if (type === 'amorphous') {
    descEl.innerHTML = '<b>1. Chất rắn Vô định hình (Amorphous - ví dụ: Thủy tinh, Silic vô định hình a-Si):</b><br>Các nguyên tử không có quy luật sắp xếp tuần hoàn ở phạm vi rộng. Khoảng cách và góc liên kết bị bẻ cong ngẫu nhiên khiến các hạt dẫn điện rất khó di chuyển.';
    const pts = [
      [85,60],[135,45],[190,65],[240,50],[305,70],[360,48],[425,68],[490,52],[545,75],[600,55],
      [70,115],[125,105],[175,125],[235,100],[285,130],[345,110],[405,135],[465,105],[520,125],[585,115],
      [95,175],[155,165],[210,180],[265,160],[325,185],[380,165],[445,180],[505,170],[565,180]
    ];
    const links = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[0,10],[1,11],[2,12],[3,13],[4,14],[5,15],[6,16],[7,17],[8,18],[9,19],[10,11],[11,12],[13,14],[14,15],[16,17],[17,18],[10,20],[11,21],[12,22],[13,23],[14,24],[15,25],[16,26],[17,27],[18,28],[20,21],[21,22],[22,23],[24,25],[26,27],[27,28]];
    links.forEach(([i,j]) => {
      svg += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" stroke="var(--g)" stroke-width="2" stroke-dasharray="4,3"/>`;
    });
    pts.forEach(([x,y]) => {
      svg += `<circle cx="${x}" cy="${y}" r="8" fill="var(--c4)" stroke="#fff" stroke-width="2"/>`;
    });
  } else if (type === 'poly') {
    descEl.innerHTML = '<b>2. Chất rắn Đa tinh thể (Polycrystalline - ví dụ: Polysilicon):</b><br>Vật liệu chia thành nhiều vùng nhỏ gọi là <b>Hạt (Grains)</b>. Trong mỗi hạt, nguyên tử xếp thẳng hàng, nhưng giữa các hạt lại bị lệch góc và ngăn cách bởi <b>Ranh giới hạt (Grain boundaries - đường nét đứt màu hồng)</b> làm cản trở dòng điện.';
    // Ranh giới hạt
    svg += `<path d="M 245 15 L 210 125 L 265 215" fill="none" stroke="var(--c4)" stroke-width="3.5" stroke-dasharray="6,4"/>`;
    svg += `<path d="M 210 125 L 455 115 L 495 15" fill="none" stroke="var(--c4)" stroke-width="3.5" stroke-dasharray="6,4"/>`;
    svg += `<path d="M 455 115 L 485 215" fill="none" stroke="var(--c4)" stroke-width="3.5" stroke-dasharray="6,4"/>`;
    svg += `<text x="275" y="110" style="fill:var(--c4);font-weight:800">Ranh giới hạt (Grain boundary)</text>`;
    // Hạt 1 (nghiêng +18 độ)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const x = 45 + c*40 + r*12, y = 45 + r*40 - c*12;
        if (x < 215) svg += `<circle cx="${x}" cy="${y}" r="7.5" fill="var(--c1)" stroke="#fff" stroke-width="1.5"/>`;
      }
    }
    // Hạt 2 (nghiêng -15 độ)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 5; c++) {
        const x = 265 + c*40 - r*10, y = 35 + r*38 + c*8;
        if (x < 470 && y < 105) svg += `<circle cx="${x}" cy="${y}" r="7.5" fill="var(--c2)" stroke="#fff" stroke-width="1.5"/>`;
      }
    }
    // Hạt 3 (thẳng góc dưới)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 5; c++) {
        const x = 275 + c*42, y = 148 + r*42;
        svg += `<circle cx="${x}" cy="${y}" r="7.5" fill="var(--c5)" stroke="#fff" stroke-width="1.5"/>`;
      }
    }
    // Hạt 4 (bên phải)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const x = 520 + c*42 + (r%2)*14, y = 42 + r*44;
        svg += `<circle cx="${x}" cy="${y}" r="7.5" fill="var(--c3)" stroke="#fff" stroke-width="1.5"/>`;
      }
    }
  } else {
    descEl.innerHTML = '<b>3. Chất rắn Đơn tinh thể (Single Crystal - Vật liệu làm tấm Wafer sản xuất Chip):</b><br>Toàn bộ các nguyên tử sắp xếp tuần hoàn hoàn hảo theo một quy luật hình học xuyên suốt từ đầu đến cuối khối vật liệu. <b>Không có ranh giới hạt</b>, giúp dòng điện chạy ổn định và đồng nhất.';
    for (let r = 0; r < 4; r++) {
      svg += `<line x1="75" y1="${42 + r*48}" x2="605" y2="${42 + r*48}" stroke="var(--g)" stroke-width="1.5"/>`;
    }
    for (let c = 0; c < 11; c++) {
      svg += `<line x1="${75 + c*53}" y1="42" x2="${75 + c*53}" y2="186" stroke="var(--g)" stroke-width="1.5"/>`;
    }
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 11; c++) {
        svg += `<circle cx="${75 + c*53}" cy="${42 + r*48}" r="8" fill="var(--c2)" stroke="#fff" stroke-width="2"/>`;
      }
    }
  }
  svgEl.innerHTML = svg;
}
window.renderSolidModel = renderSolidModel;

/* =========================================================
   MÔ HÌNH 2: MẠNG 2D, VECTOR TỊNH TIẾN & CÁC Ô ĐƠN VỊ
   ========================================================= */
function renderLattice2D() {
  const svgEl = $('lattice2d-svg');
  if (!svgEl) return;
  const p = +$('sl-p').value;
  const q = +$('sl-q').value;
  $('val-p').textContent = p;
  $('val-q').textContent = q;

  const ax = 85, ay = 0;   // vector a
  const bx = 28, by = -54; // vector b
  const ox = 85, oy = 205; // gốc tọa độ (0,0)

  let svg = '';

  // Vẽ ô đơn vị nguyên thủy C tại gốc và một ô đơn vị lớn A ở góc trên
  const c0 = [ox, oy], c1 = [ox+ax, oy+ay], c2 = [ox+ax+bx, oy+ay+by], c3 = [ox+bx, oy+by];
  svg += `<polygon points="${c0.join(',')} ${c1.join(',')} ${c2.join(',')} ${c3.join(',')}" fill="rgba(18,184,134,0.22)" stroke="var(--c2)" stroke-width="2"/>`;
  svg += `<text x="${ox+36}" y="${oy-18}" style="fill:var(--c2);font-weight:700">Ô đơn vị C</text>`;

  // Ô đơn vị B rộng gấp đôi
  const b0 = [ox+3*ax+bx, oy+by], b1 = [ox+4*ax+bx, oy+by], b2 = [ox+4*ax+3*bx, oy+3*by], b3 = [ox+3*ax+3*bx, oy+3*by];
  svg += `<polygon points="${b0.join(',')} ${b1.join(',')} ${b2.join(',')} ${b3.join(',')}" fill="rgba(112,72,232,0.18)" stroke="var(--c5)" stroke-width="2" stroke-dasharray="5,3"/>`;
  svg += `<text x="${b0[0]+22}" y="${b0[1]-45}" style="fill:var(--c5);font-weight:700">Ô đơn vị B</text>`;

  // Vẽ lưới điểm mạng
  for (let row = 0; row <= 3; row++) {
    for (let col = 0; col <= 5; col++) {
      const x = ox + col*ax + row*bx;
      const y = oy + col*ay + row*by;
      svg += `<circle cx="${x}" cy="${y}" r="6.5" fill="var(--ink)" opacity="0.75"/>`;
    }
  }

  // Vẽ đường đi của vector r = p*a + q*b
  const midX = ox + p*ax, midY = oy + p*ay;
  const endX = midX + q*bx, endY = midY + q*by;

  if (p > 0) {
    svg += `<line x1="${ox}" y1="${oy}" x2="${midX}" y2="${midY}" stroke="var(--c1)" stroke-width="4"/>`;
    svg += `<text x="${(ox+midX)/2 - 15}" y="${oy+24}" style="fill:var(--c1);font-weight:800">${p}a</text>`;
  }
  if (q > 0) {
    svg += `<line x1="${midX}" y1="${midY}" x2="${endX}" y2="${endY}" stroke="var(--c3)" stroke-width="4"/>`;
    svg += `<text x="${(midX+endX)/2 + 12}" y="${(midY+endY)/2 + 5}" style="fill:var(--c3);font-weight:800">${q}b</text>`;
  }
  svg += `<line x1="${ox}" y1="${oy}" x2="${endX}" y2="${endY}" stroke="var(--c4)" stroke-width="3" stroke-dasharray="6,4"/>`;
  svg += `<circle cx="${ox}" cy="${oy}" r="9" fill="var(--c1)" stroke="#fff" stroke-width="2"/>`;
  svg += `<circle cx="${endX}" cy="${endY}" r="10" fill="var(--c4)" stroke="#fff" stroke-width="2.5"/>`;
  svg += `<text x="${endX+14}" y="${endY-8}" style="fill:var(--c4);font-weight:800">Điểm mạng r = ${p}a + ${q}b</text>`;
  svg += `<text x="${ox-28}" y="${oy+22}" style="font-weight:700">Gốc (0,0)</text>`;

  svgEl.innerHTML = svg;
}
window.renderLattice2D = renderLattice2D;

/* =========================================================
   MÔ HÌNH 3: 5 CẤU TRÚC LẬP PHƯƠNG 3D XOAY ĐƯỢC
   ========================================================= */
let currentCrystal = 'sc';
const crystalCatalog = {
  sc: {
    title: "1. Mạng Lập phương Đơn giản (Simple Cubic - SC)",
    desc: "• <b>Vị trí nguyên tử:</b> Chỉ có 8 nguyên tử nằm tại 8 đỉnh góc của hình lập phương.<br>• <b>Đếm số nguyên tử trong 1 ô:</b> $n_{\\text{cell}} = 8 \\text{ góc} \\times \\frac{1}{8} = \\mathbf{1\\text{ nguyên tử}}$.<br>• <b>Hướng tiếp xúc:</b> Các quả cầu chạm nhau dọc theo cạnh hình lập phương $\\implies \\mathbf{a = 2r}$.",
    atoms: [[0,0,0,'c1'],[1,0,0,'c1'],[0,1,0,'c1'],[1,1,0,'c1'],[0,0,1,'c1'],[1,0,1,'c1'],[0,1,1,'c1'],[1,1,1,'c1']],
    bonds: [[[0,0,1],[1,0,1]]]
  },
  bcc: {
    title: "2. Mạng Lập phương Tâm khối (Body-Centered Cubic - BCC)",
    desc: "• <b>Vị trí nguyên tử:</b> 8 nguyên tử ở 8 góc + <b>1 nguyên tử nằm tại tâm khối hộp</b>.<br>• <b>Đếm số nguyên tử trong 1 ô:</b> $n_{\\text{cell}} = \\left(8 \\times \\frac{1}{8}\\right) + (1 \\times 1) = \\mathbf{2\\text{ nguyên tử}}$.<br>• <b>Hướng tiếp xúc:</b> Chạm nhau dọc theo đường chéo chính xuyên tâm khối $\\implies \\mathbf{a\\sqrt{3} = 4r}$.",
    atoms: [[0,0,0,'c1'],[1,0,0,'c1'],[0,1,0,'c1'],[1,1,0,'c1'],[0,0,1,'c1'],[1,0,1,'c1'],[0,1,1,'c1'],[1,1,1,'c1'],[0.5,0.5,0.5,'c4']],
    bonds: [[[0,0,0],[1,1,1]],[[1,0,0],[0,1,1]],[[0,1,0],[1,0,1]],[[0,0,1],[1,1,0]]]
  },
  fcc: {
    title: "3. Mạng Lập phương Tâm mặt (Face-Centered Cubic - FCC)",
    desc: "• <b>Vị trí nguyên tử:</b> 8 nguyên tử ở 8 góc + <b>6 nguyên tử nằm tại tâm của 6 mặt hình vuông</b>.<br>• <b>Đếm số nguyên tử trong 1 ô:</b> $n_{\\text{cell}} = \\left(8 \\times \\frac{1}{8}\\right) + \\left(6 \\times \\frac{1}{2}\\right) = 1 + 3 = \\mathbf{4\\text{ nguyên tử}}$.<br>• <b>Hướng tiếp xúc:</b> Chạm nhau dọc theo đường chéo mặt $\\implies \\mathbf{a\\sqrt{2} = 4r}$.",
    atoms: [[0,0,0,'c1'],[1,0,0,'c1'],[0,1,0,'c1'],[1,1,0,'c1'],[0,0,1,'c1'],[1,0,1,'c1'],[0,1,1,'c1'],[1,1,1,'c1'],
            [0.5,0.5,0,'c2'],[0.5,0.5,1,'c2'],[0.5,0,0.5,'c2'],[0.5,1,0.5,'c2'],[0,0.5,0.5,'c2'],[1,0.5,0.5,'c2']],
    bonds: [[[0,0,1],[1,1,1]],[[1,0,1],[0,1,1]]]
  },
  diamond: {
    title: "4. Cấu trúc Kim cương (Diamond - Cấu trúc của Silicon & Germanium)",
    desc: "• <b>Vị trí nguyên tử:</b> Gồm khung mạng FCC (8 góc + 6 tâm mặt) cộng thêm <b>4 nguyên tử nằm hẳn trong ruột</b> (tại tâm của 4 trong 8 ô lập phương con cạnh $a/2$). Mỗi nguyên tử liên kết tứ diện đều với 4 hàng xóm.<br>• <b>Đếm số nguyên tử trong 1 ô:</b> $n_{\\text{cell}} = \\left(8 \\times \\frac{1}{8}\\right) + \\left(6 \\times \\frac{1}{2}\\right) + (4 \\times 1) = \\mathbf{8\\text{ nguyên tử}}$.<br>• <b>Khoảng cách gần nhất:</b> Bằng $\\frac{1}{4}$ đường chéo khối $\\implies \\mathbf{d_{\\text{min}} = \\frac{a\\sqrt{3}}{4}}$.",
    atoms: [[0,0,0,'c1'],[1,0,0,'c1'],[0,1,0,'c1'],[1,1,0,'c1'],[0,0,1,'c1'],[1,0,1,'c1'],[0,1,1,'c1'],[1,1,1,'c1'],
            [0.5,0.5,0,'c2'],[0.5,0.5,1,'c2'],[0.5,0,0.5,'c2'],[0.5,1,0.5,'c2'],[0,0.5,0.5,'c2'],[1,0.5,0.5,'c2'],
            [0.25,0.25,0.25,'c3'],[0.75,0.75,0.25,'c3'],[0.75,0.25,0.75,'c3'],[0.25,0.75,0.75,'c3']],
    bonds: [
      [[0.25,0.25,0.25],[0,0,0]],[[0.25,0.25,0.25],[0.5,0.5,0]],[[0.25,0.25,0.25],[0.5,0,0.5]],[[0.25,0.25,0.25],[0,0.5,0.5]],
      [[0.75,0.25,0.75],[1,0,1]],[[0.75,0.25,0.75],[0.5,0.5,1]],[[0.75,0.25,0.75],[0.5,0,0.5]],[[0.75,0.25,0.75],[1,0.5,0.5]]
    ]
  },
  zinc: {
    title: "5. Cấu trúc Zincblende (Sphalerite - Cấu trúc của hợp chất GaAs)",
    desc: "• <b>Vị trí nguyên tử:</b> Giống hệt cấu trúc Kim cương về mặt hình học, nhưng gồm <b>2 loại nguyên tử khác nhau</b>: Nguyên tử $\\text{Ga}$ (Nhóm III) chiếm các vị trí FCC (8 góc + 6 tâm mặt $\\rightarrow 4$ nguyên tử $\\text{Ga}$), còn nguyên tử $\\text{As}$ (Nhóm V) chiếm 4 vị trí tứ diện bên trong ruột ($\\rightarrow 4$ nguyên tử $\\text{As}$).<br>• <b>Tổng cộng:</b> $4\\text{ Ga} + 4\\text{ As} = \\mathbf{8\\text{ nguyên tử/ô đơn vị}}$.",
    atoms: [[0,0,0,'c1'],[1,0,0,'c1'],[0,1,0,'c1'],[1,1,0,'c1'],[0,0,1,'c1'],[1,0,1,'c1'],[0,1,1,'c1'],[1,1,1,'c1'],
            [0.5,0.5,0,'c1'],[0.5,0.5,1,'c1'],[0.5,0,0.5,'c1'],[0.5,1,0.5,'c1'],[0,0.5,0.5,'c1'],[1,0.5,0.5,'c1'],
            [0.25,0.25,0.25,'c4'],[0.75,0.75,0.25,'c4'],[0.75,0.25,0.75,'c4'],[0.25,0.75,0.75,'c4']],
    bonds: [
      [[0.25,0.25,0.25],[0,0,0]],[[0.25,0.25,0.25],[0.5,0.5,0]],[[0.25,0.25,0.25],[0.5,0,0.5]],[[0.25,0.25,0.25],[0,0.5,0.5]],
      [[0.75,0.25,0.75],[1,0,1]],[[0.75,0.25,0.75],[0.5,0.5,1]],[[0.75,0.25,0.75],[0.5,0,0.5]],[[0.75,0.25,0.75],[1,0.5,0.5]]
    ]
  }
};

function project3D(x, y, z, rotDeg, tiltDeg, cx = 230, cy = 165, scale = 155) {
  const radY = rotDeg * Math.PI / 180;
  const radX = tiltDeg * Math.PI / 180;
  const xc = x - 0.5, yc = y - 0.5, zc = z - 0.5;
  // Xoay quanh trục đứng Y
  const x1 = xc * Math.cos(radY) + zc * Math.sin(radY);
  const z1 = -xc * Math.sin(radY) + zc * Math.cos(radY);
  // Xoay nghiêng trục X
  const y2 = yc * Math.cos(radX) - z1 * Math.sin(radX);
  const z2 = yc * Math.sin(radX) + z1 * Math.cos(radX);
  return [cx + x1 * scale, cy - y2 * scale, z2];
}

function selectCrystal(type, btn) {
  currentCrystal = type;
  if (btn) {
    document.querySelectorAll('#crystal-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const d = crystalCatalog[type];
  $('crystal-info').innerHTML = `<b>${d.title}</b><br>${d.desc}`;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([$('crystal-info')]);
  renderCrystal3D();
}
window.selectCrystal = selectCrystal;

function renderCrystal3D() {
  const svgEl = $('crystal-svg');
  if (!svgEl) return;
  const rot = +$('sl-rot').value;
  const tilt = +$('sl-tilt').value;
  $('val-rot').textContent = rot;
  $('val-tilt').textContent = tilt;

  const d = crystalCatalog[currentCrystal];
  const edges = [
    [[0,0,0],[1,0,0]],[[0,1,0],[1,1,0]],[[0,0,0],[0,1,0]],[[1,0,0],[1,1,0]],
    [[0,0,1],[1,0,1]],[[0,1,1],[1,1,1]],[[0,0,1],[0,1,1]],[[1,0,1],[1,1,1]],
    [[0,0,0],[0,0,1]],[[1,0,0],[1,0,1]],[[0,1,0],[0,1,1]],[[1,1,0],[1,1,1]]
  ];

  let svg = '';
  // Nếu là kim cương hoặc zincblende, vẽ thêm khung lập phương con 1/8 cạnh a/2 để thấy rõ cấu trúc tứ diện
  if (currentCrystal === 'diamond' || currentCrystal === 'zinc') {
    const subEdges = [
      [[0,0,0],[0.5,0,0]],[[0,0.5,0],[0.5,0.5,0]],[[0,0,0],[0,0.5,0]],[[0.5,0,0],[0.5,0.5,0]],
      [[0,0,0.5],[0.5,0,0.5]],[[0,0.5,0.5],[0.5,0.5,0.5]],[[0,0,0.5],[0,0.5,0.5]],[[0.5,0,0.5],[0.5,0.5,0.5]],
      [[0,0,0],[0,0,0.5]],[[0.5,0,0],[0.5,0,0.5]],[[0,0.5,0],[0,0.5,0.5]],[[0.5,0.5,0],[0.5,0.5,0.5]]
    ];
    subEdges.forEach(e => {
      const [x1,y1] = project3D(...e[0], rot, tilt);
      const [x2,y2] = project3D(...e[1], rot, tilt);
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--c3)" stroke-width="1.5" stroke-dasharray="3,3"/>`;
    });
  }

  edges.forEach(e => {
    const [x1,y1,z1] = project3D(...e[0], rot, tilt);
    const [x2,y2,z2] = project3D(...e[1], rot, tilt);
    const isBack = (z1 + z2) / 2 < -0.15;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink)" stroke-opacity="${isBack?0.35:0.75}" stroke-width="${isBack?1.5:2.2}" ${isBack?'stroke-dasharray="5,4"':''}/>`;
  });

  d.bonds.forEach(e => {
    const [x1,y1] = project3D(...e[0], rot, tilt);
    const [x2,y2] = project3D(...e[1], rot, tilt);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--c4)" stroke-width="3" stroke-dasharray="5,3"/>`;
  });

  // Sắp xếp nguyên tử theo chiều sâu z2 để vẽ nguyên tử ở xa trước, ở gần sau
  const sortedAtoms = d.atoms.map(a => {
    const [px, py, pz] = project3D(a[0], a[1], a[2], rot, tilt);
    return { px, py, pz, color: a[3] };
  }).sort((a, b) => a.pz - b.pz);

  sortedAtoms.forEach(a => {
    const r = a.color === 'c1' ? 9.5 : (a.color === 'c2' ? 11 : 13);
    svg += `<circle cx="${a.px}" cy="${a.py}" r="${r}" fill="var(--${a.color})" stroke="#fff" stroke-width="2"/>`;
  });

  // Chú giải bên phải
  svg += `<rect x="430" y="30" width="230" height="260" rx="12" fill="var(--card)" stroke="var(--g)"/>`;
  svg += `<text x="446" y="58" style="font-weight:800;fill:var(--c5)">Chú giải thành phần ô mạng:</text>`;
  svg += `<circle cx="456" cy="88" r="8" fill="var(--c1)"/><text x="472" y="93" style="font-weight:600">Đỉnh góc: 8 × (1/8) = 1 hạt</text>`;
  if (currentCrystal === 'bcc') {
    svg += `<circle cx="456" cy="122" r="10" fill="var(--c4)"/><text x="472" y="127" style="font-weight:600">Tâm khối: 1 × 1 = 1 hạt</text>`;
    svg += `<text x="446" y="165" style="font-weight:800;fill:var(--c4)">Đường đứt nét: Chạm nhau</text>`;
    svg += `<text x="446" y="186" style="font-size:13.5px">trên đường chéo khối a√3 = 4r</text>`;
  } else if (currentCrystal === 'fcc') {
    svg += `<circle cx="456" cy="122" r="9" fill="var(--c2)"/><text x="472" y="127" style="font-weight:600">Tâm mặt: 6 × (1/2) = 3 hạt</text>`;
    svg += `<text x="446" y="165" style="font-weight:800;fill:var(--c4)">Đường đứt nét: Chạm nhau</text>`;
    svg += `<text x="446" y="186" style="font-size:13.5px">trên đường chéo mặt a√2 = 4r</text>`;
  } else if (currentCrystal === 'diamond') {
    svg += `<circle cx="456" cy="122" r="9" fill="var(--c2)"/><text x="472" y="127" style="font-weight:600">Tâm mặt: 6 × (1/2) = 3 hạt</text>`;
    svg += `<circle cx="456" cy="156" r="10" fill="var(--c3)"/><text x="472" y="161" style="font-weight:600">Trong ruột: 4 × 1 = 4 hạt</text>`;
    svg += `<text x="446" y="198" style="font-weight:800;fill:var(--c4)">Liên kết tứ diện (4 cánh tay):</text>`;
    svg += `<text x="446" y="218" style="font-size:13.5px">Khoảng cách d = a√3 / 4</text>`;
  } else if (currentCrystal === 'zinc') {
    svg += `<circle cx="456" cy="122" r="9" fill="var(--c1)"/><text x="472" y="127" style="font-weight:600">Ga (góc + mặt): 1 + 3 = 4 hạt</text>`;
    svg += `<circle cx="456" cy="156" r="10" fill="var(--c4)"/><text x="472" y="161" style="font-weight:600">As (trong ruột): 4 × 1 = 4 hạt</text>`;
    svg += `<text x="446" y="198" style="font-weight:700;fill:var(--mut)">Mỗi hạt Ga nối với 4 hạt As</text>`;
  } else {
    svg += `<text x="446" y="130" style="font-weight:800;fill:var(--c4)">Chạm nhau trên cạnh hộp:</text>`;
    svg += `<text x="446" y="152" style="font-size:13.5px">Độ dài cạnh a = 2r</text>`;
  }
  svgEl.innerHTML = svg;
}
window.renderCrystal3D = renderCrystal3D;

/* =========================================================
   MÔ HÌNH 4: CHỈ SỐ MILLER (3D PLANE + 2D CROSS-SECTION)
   ========================================================= */
let currentMillerPlane = '100';
function projMiller(x, y, z) {
  // x: trục a (tiến về phía trước-trái), y: trục b (sang phải), z: trục c (lên trên)
  const ox = 140, oy = 185, s = 115;
  const px = ox - 0.52 * x * s + 0.92 * y * s;
  const py = oy + 0.36 * x * s - 0.92 * z * s;
  return [px, py];
}

function renderMiller(plane, btn) {
  currentMillerPlane = plane;
  if (btn) {
    document.querySelectorAll('#miller-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const latType = $('miller-lat-type') ? $('miller-lat-type').value : 'fcc';
  const descEl = $('miller-desc');
  const svgEl = $('miller-svg');
  if (!descEl || !svgEl) return;

  let svg = '';
  // Vẽ 3 trục tọa độ a, b, c bên trái
  const [ox, oy] = projMiller(0,0,0);
  const [ax, ay] = projMiller(1.45,0,0);
  const [bx, by] = projMiller(0,1.45,0);
  const [cx, cy] = projMiller(0,0,1.45);
  svg += `<line x1="${ox}" y1="${oy}" x2="${ax}" y2="${ay}" stroke="var(--mut)" stroke-width="2"/>`;
  svg += `<line x1="${ox}" y1="${oy}" x2="${bx}" y2="${by}" stroke="var(--mut)" stroke-width="2"/>`;
  svg += `<line x1="${ox}" y1="${oy}" x2="${cx}" y2="${cy}" stroke="var(--mut)" stroke-width="2"/>`;
  svg += `<text x="${ax-18}" y="${ay+14}" style="font-weight:800">Trục x (a)</text>`;
  svg += `<text x="${bx+6}" y="${by+5}" style="font-weight:800">Trục y (b)</text>`;
  svg += `<text x="${cx-10}" y="${cy-8}" style="font-weight:800">Trục z (c)</text>`;

  // Vẽ khung lập phương đơn vị
  const cubeEdges = [
    [[0,0,0],[1,0,0]],[[0,1,0],[1,1,0]],[[0,0,0],[0,1,0]],[[1,0,0],[1,1,0]],
    [[0,0,1],[1,0,1]],[[0,1,1],[1,1,1]],[[0,0,1],[0,1,1]],[[1,0,1],[1,1,1]],
    [[0,0,0],[0,0,1]],[[1,0,0],[1,0,1]],[[0,1,0],[0,1,1]],[[1,1,0],[1,1,1]]
  ];
  cubeEdges.forEach(e => {
    const [x1,y1] = projMiller(...e[0]), [x2,y2] = projMiller(...e[1]);
    const isBack = (e[0][0]===0 && e[1][0]===0);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink)" stroke-opacity="${isBack?0.35:0.75}" stroke-width="1.8" ${isBack?'stroke-dasharray="4,4"':''}/>`;
  });

  // Vùng bên phải: Thiết diện mặt cắt 2D
  svg += `<rect x="355" y="18" width="308" height="244" rx="12" fill="var(--card)" stroke="var(--g)"/>`;

  if (plane === '100') {
    const p1 = projMiller(1,0,0), p2 = projMiller(1,1,0), p3 = projMiller(1,1,1), p4 = projMiller(1,0,1);
    svg += `<polygon points="${p1.join(',')} ${p2.join(',')} ${p3.join(',')} ${p4.join(',')}" fill="rgba(47,111,237,0.32)" stroke="var(--c1)" stroke-width="3"/>`;
    // Vector pháp tuyến [100]
    const n1 = projMiller(1,0.5,0.5), n2 = projMiller(1.5,0.5,0.5);
    svg += `<line x1="${n1[0]}" y1="${n1[1]}" x2="${n2[0]}" y2="${n2[1]}" stroke="var(--c4)" stroke-width="3.5"/>`;
    svg += `<text x="${n2[0]-15}" y="${n2[1]+20}" style="fill:var(--c4);font-weight:800">Hướng [100]</text>`;

    // Thiết diện 2D bên phải (Hình vuông cạnh a)
    svg += `<text x="375" y="44" style="font-weight:800;fill:var(--c1)">Thiết diện 2D mặt (100): Hình vuông cạnh a</text>`;
    svg += `<rect x="445" y="75" width="130" height="130" fill="rgba(47,111,237,0.12)" stroke="var(--c1)" stroke-width="2.5"/>`;
    [[445,75],[575,75],[445,205],[575,205]].forEach(([cx,cy]) => {
      svg += `<circle cx="${cx}" cy="${cy}" r="18" fill="var(--c1)" fill-opacity="0.35" stroke="var(--c1)" stroke-width="2"/>`;
    });
    let countText = `4 góc vuông × (1/4) = 1 nguyên tử`;
    if (latType === 'fcc') {
      svg += `<circle cx="510" cy="140" r="20" fill="var(--c2)" fill-opacity="0.6" stroke="var(--c2)" stroke-width="2.5"/>`;
      countText = `4 góc × (1/4) + 1 tâm mặt = 2 nguyên tử`;
    }
    svg += `<text x="380" y="238" style="font-weight:700;fill:var(--ink)">Số hạt trên mặt: ${countText}</text>`;
    descEl.innerHTML = `<b>Mặt phẳng $(100)$:</b> Cắt trục $x$ tại $p=1$, song song trục $y$ ($q=\\infty$) và trục $z$ ($s=\\infty$). Nghịch đảo: $\\left(\\frac{1}{1}, \\frac{1}{\\infty}, \\frac{1}{\\infty}\\right) = \\mathbf{(100)}$. Diện tích mặt cắt là hình vuông $S_{(100)} = a^2$.`;

  } else if (plane === '110') {
    const p1 = projMiller(1,0,0), p2 = projMiller(0,1,0), p3 = projMiller(0,1,1), p4 = projMiller(1,0,1);
    svg += `<polygon points="${p1.join(',')} ${p2.join(',')} ${p3.join(',')} ${p4.join(',')}" fill="rgba(18,184,134,0.32)" stroke="var(--c2)" stroke-width="3"/>`;
    const n1 = projMiller(0.5,0.5,0.5), n2 = projMiller(0.95,0.95,0.5);
    svg += `<line x1="${n1[0]}" y1="${n1[1]}" x2="${n2[0]}" y2="${n2[1]}" stroke="var(--c4)" stroke-width="3.5"/>`;
    svg += `<text x="${n2[0]+6}" y="${n2[1]+6}" style="fill:var(--c4);font-weight:800">Hướng [110]</text>`;

    // Thiết diện 2D bên phải (Hình chữ nhật a x a√2)
    svg += `<text x="372" y="44" style="font-weight:800;fill:var(--c2)">Thiết diện 2D mặt (110): Chữ nhật a × a√2</text>`;
    svg += `<rect x="415" y="78" width="184" height="125" fill="rgba(18,184,134,0.12)" stroke="var(--c2)" stroke-width="2.5"/>`;
    [[415,78],[599,78],[415,203],[599,203]].forEach(([cx,cy]) => {
      svg += `<circle cx="${cx}" cy="${cy}" r="18" fill="var(--c1)" fill-opacity="0.35" stroke="var(--c1)" stroke-width="2"/>`;
    });
    let countText = `4 góc × (1/4) = 1 nguyên tử`;
    if (latType === 'fcc') {
      svg += `<circle cx="507" cy="78" r="18" fill="var(--c2)" fill-opacity="0.55" stroke="var(--c2)" stroke-width="2"/>`;
      svg += `<circle cx="507" cy="203" r="18" fill="var(--c2)" fill-opacity="0.55" stroke="var(--c2)" stroke-width="2"/>`;
      countText = `4 góc×(1/4) + 2 cạnh×(1/2) = 2 nguyên tử`;
    } else if (latType === 'bcc') {
      svg += `<circle cx="507" cy="140.5" r="22" fill="var(--c4)" fill-opacity="0.6" stroke="var(--c4)" stroke-width="2.5"/>`;
      countText = `4 góc×(1/4) + 1 tâm khối = 2 nguyên tử`;
    }
    svg += `<text x="375" y="238" style="font-weight:700;fill:var(--ink)">Số hạt: ${countText}</text>`;
    descEl.innerHTML = `<b>Mặt phẳng $(110)$ (Áp dụng trực tiếp cho Câu 3b, 3c):</b> Cắt trục $x$ tại $p=1$, trục $y$ tại $q=1$, song song trục $z$ ($s=\\infty$). Nghịch đảo: $\\left(\\frac{1}{1}, \\frac{1}{1}, \\frac{1}{\\infty}\\right) = \\mathbf{(110)}$. Diện tích hình chữ nhật là $S_{(110)} = a \\times a\\sqrt{2} = a^2\\sqrt{2}$.`;

  } else if (plane === '111') {
    const p1 = projMiller(1,0,0), p2 = projMiller(0,1,0), p3 = projMiller(0,0,1);
    svg += `<polygon points="${p1.join(',')} ${p2.join(',')} ${p3.join(',')}" fill="rgba(112,72,232,0.34)" stroke="var(--c5)" stroke-width="3"/>`;
    const n1 = projMiller(0.33,0.33,0.33), n2 = projMiller(0.85,0.85,0.85);
    svg += `<line x1="${n1[0]}" y1="${n1[1]}" x2="${n2[0]}" y2="${n2[1]}" stroke="var(--c4)" stroke-width="3.5"/>`;
    svg += `<text x="${n2[0]+6}" y="${n2[1]}" style="fill:var(--c4);font-weight:800">Hướng [111]</text>`;

    // Thiết diện 2D bên phải (Tam giác đều cạnh a√2)
    svg += `<text x="372" y="44" style="font-weight:800;fill:var(--c5)">Thiết diện 2D mặt (111): Tam giác đều cạnh a√2</text>`;
    const t1 = [507, 68], t2 = [425, 204], t3 = [589, 204];
    svg += `<polygon points="${t1.join(',')} ${t2.join(',')} ${t3.join(',')}" fill="rgba(112,72,232,0.14)" stroke="var(--c5)" stroke-width="2.5"/>`;
    [t1, t2, t3].forEach(([cx,cy]) => {
      svg += `<circle cx="${cx}" cy="${cy}" r="18" fill="var(--c1)" fill-opacity="0.35" stroke="var(--c1)" stroke-width="2"/>`;
    });
    let countText = `3 góc 60° × (1/6) = 1/2 nguyên tử`;
    if (latType === 'fcc') {
      [[466,136],[548,136],[507,204]].forEach(([cx,cy]) => {
        svg += `<circle cx="${cx}" cy="${cy}" r="18" fill="var(--c2)" fill-opacity="0.55" stroke="var(--c2)" stroke-width="2"/>`;
      });
      countText = `3 góc×(1/6) + 3 cạnh×(1/2) = 2 nguyên tử`;
    }
    svg += `<text x="372" y="238" style="font-weight:700;fill:var(--ink)">Số hạt: ${countText}</text>`;
    descEl.innerHTML = `<b>Mặt phẳng $(111)$ (Áp dụng trực tiếp cho Câu 3d):</b> Cắt cả 3 trục tại $p=1, q=1, s=1 \\implies \\mathbf{(111)}$. Thiết diện là tam giác đều có cạnh là đường chéo mặt $L = a\\sqrt{2}$, diện tích $S_{(111)} = \\frac{\\sqrt{3}}{4}L^2 = \\frac{\\sqrt{3}}{2}a^2$.`;

  } else if (plane === '634') {
    const p1 = projMiller(0.5,0,0), p2 = projMiller(0,1,0), p3 = projMiller(0,0,0.75);
    svg += `<polygon points="${p1.join(',')} ${p2.join(',')} ${p3.join(',')}" fill="rgba(245,159,0,0.38)" stroke="var(--c3)" stroke-width="3"/>`;
    svg += `<text x="375" y="55" style="font-weight:800;fill:var(--c3)">Tóm tắt thuật toán giải Câu 2:</text>`;
    svg += `<text x="375" y="90">1. Giao điểm theo a: p = 2, q = 4, s = 3</text>`;
    svg += `<text x="375" y="125">2. Lấy nghịch đảo: (1/2 , 1/4 , 1/3)</text>`;
    svg += `<text x="375" y="160">3. Nhân mẫu chung 12: (6 , 3 , 4)</text>`;
    svg += `<text x="375" y="195" style="font-weight:800;fill:var(--c4)">4. Kết luận mặt phẳng: (634)</text>`;
    descEl.innerHTML = `<b>Minh họa mặt phẳng $(634)$ trong Câu 2:</b> Cắt 3 trục tại $2a, 4a, 3a$ (trên hình thu tỷ lệ $1/4$ thành $0.5a, 1.0a, 0.75a$ để nằm gọn trong 1 ô).`;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderMiller = renderMiller;

/* =========================================================
   MÔ HÌNH 5, 6, 7 CỦA BUỔI 1 (LIÊN KẾT, KHUYẾT TẬT, CZOCHRALSKI)
   ========================================================= */
function renderBonding(mode, btn) {
  if (btn) {
    document.querySelectorAll('#doping-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const descEl = $('doping-desc'), svgEl = $('doping-svg');
  if (!descEl || !svgEl) return;

  let svg = '';
  const cx = 340, cy = 130;
  const neighbors = [[cx, 38], [cx, 222], [cx - 140, cy], [cx + 140, cy]];

  neighbors.forEach(([nx, ny]) => {
    const isVert = nx === cx;
    if (isVert) {
      svg += `<line x1="${cx-7}" y1="${cy}" x2="${nx-7}" y2="${ny}" stroke="var(--c1)" stroke-width="2.5"/>`;
      svg += `<line x1="${cx+7}" y1="${cy}" x2="${nx+7}" y2="${ny}" stroke="var(--c1)" stroke-width="2.5"/>`;
      const my = (cy + ny) / 2;
      svg += `<circle cx="${cx-7}" cy="${my}" r="4.5" fill="var(--c1)"/>`;
      svg += `<circle cx="${cx+7}" cy="${my}" r="4.5" fill="var(--c1)"/>`;
    } else {
      svg += `<line x1="${cx}" y1="${cy-7}" x2="${nx}" y2="${ny-7}" stroke="var(--c1)" stroke-width="2.5"/>`;
      svg += `<line x1="${cx}" y1="${cy+7}" x2="${nx}" y2="${ny+7}" stroke="var(--c1)" stroke-width="2.5"/>`;
      const mx = (cx + nx) / 2;
      svg += `<circle cx="${mx}" cy="${cy-7}" r="4.5" fill="var(--c1)"/>`;
      if (!(mode === 'ptype' && nx > cx)) {
        svg += `<circle cx="${mx}" cy="${cy+7}" r="4.5" fill="var(--c1)"/>`;
      } else {
        svg += `<circle cx="${mx}" cy="${cy+7}" r="5.5" fill="none" stroke="var(--c4)" stroke-width="2.2" stroke-dasharray="2,2"/>`;
        svg += `<text x="${mx+12}" y="${cy+28}" style="fill:var(--c4);font-weight:800">Lỗ trống (Thiếu 1 e-)</text>`;
      }
    }
    svg += `<circle cx="${nx}" cy="${ny}" r="22" fill="var(--card)" stroke="var(--c1)" stroke-width="3"/>`;
    svg += `<text x="${nx}" y="${ny+5}" text-anchor="middle" style="font-weight:800;fill:var(--ink)">Si</text>`;
  });

  if (mode === 'pure') {
    svg += `<circle cx="${cx}" cy="${cy}" r="25" fill="var(--c1)" stroke="#fff" stroke-width="2.5"/>`;
    svg += `<text x="${cx}" y="${cy+5}" text-anchor="middle" style="font-weight:800;fill:#fff">Si</text>`;
    descEl.innerHTML = '<b>1. Silicon tinh khiết (Intrinsic Si):</b> Nguyên tử $\\text{Si}$ ở giữa có $4$ electron hóa trị, góp chung với $4$ nguyên tử $\\text{Si}$ xung quanh tạo thành $4$ cặp liên kết cộng hóa trị bền vững (đủ $8$ electron lớp ngoài cùng). Ở $T=0\\text{ K}$ không có electron tự do dẫn điện.';
  } else if (mode === 'ntype') {
    svg += `<circle cx="${cx}" cy="${cy}" r="25" fill="var(--c2)" stroke="#fff" stroke-width="2.5"/>`;
    svg += `<text x="${cx}" y="${cy+5}" text-anchor="middle" style="font-weight:800;fill:#fff">P+</text>`;
    svg += `<path d="M ${cx+18} ${cy-18} Q ${cx+75} ${cy-70} ${cx+115} ${cy-55}" fill="none" stroke="var(--c4)" stroke-width="2" stroke-dasharray="4,3"/>`;
    svg += `<circle cx="${cx+120}" cy="${cy-55}" r="7" fill="var(--c4)"/>`;
    svg += `<text x="${cx+134}" y="${cy-50}" style="fill:var(--c4);font-weight:800">Electron thứ 5 tự do (Dẫn điện loại N)</text>`;
    descEl.innerHTML = '<b>2. Pha tạp Phosphorus (Nhóm V — Tạp chất Cho / Donor):</b> Nguyên tử $\\text{P}$ có $5$ electron hóa trị. Sau khi dùng $4$ electron để liên kết với $4$ nguyên tử $\\text{Si}$, còn <b>dư ra electron thứ 5</b> rất dễ bứt ra trở thành hạt dẫn điện tự do (tạo bán dẫn loại N).';
  } else {
    svg += `<circle cx="${cx}" cy="${cy}" r="25" fill="var(--c4)" stroke="#fff" stroke-width="2.5"/>`;
    svg += `<text x="${cx}" y="${cy+5}" text-anchor="middle" style="font-weight:800;fill:#fff">B-</text>`;
    descEl.innerHTML = '<b>3. Pha tạp Boron (Nhóm III — Tạp chất Nhận / Acceptor):</b> Nguyên tử $\\text{B}$ chỉ có $3$ electron hóa trị nên bị <b>thiếu hụt 1 electron</b> ở nhánh liên kết bên phải, tạo ra một <b>Lỗ trống (Hole mang điện dương $+e$)</b> dễ dàng nhận electron nhảy tới (tạo bán dẫn loại P).';
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderBonding = renderBonding;

function renderDefects() {
  const svgEl = $('defect-svg');
  if (!svgEl) return;
  let svg = '';
  // Chia 3 khung: (1) Nút khuyết Vacancy, (2) Nguyên tử xen kẽ Interstitial, (3) Lệch mạng đường Line Dislocation
  const titles = [
    [115, '1. Nút khuyết (Vacancy)'],
    [340, '2. Xen kẽ (Interstitial)'],
    [565, '3. Lệch mạng đường (Dislocation)']
  ];
  titles.forEach(([tx, text]) => {
    svg += `<text x="${tx}" y="26" text-anchor="middle" style="font-weight:800;fill:var(--c5)">${text}</text>`;
  });

  // Khung 1: Vacancy
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = 48 + c * 44, y = 55 + r * 44;
      if (r === 1 && c === 2) {
        svg += `<rect x="${x-9}" y="${y-9}" width="18" height="18" rx="4" fill="none" stroke="var(--c4)" stroke-width="2.5" stroke-dasharray="3,2"/>`;
        svg += `<text x="${x}" y="${y+26}" text-anchor="middle" style="font-size:11.5px;fill:var(--c4);font-weight:800">Trống</text>`;
      } else {
        svg += `<circle cx="${x}" cy="${y}" r="8" fill="var(--c1)"/>`;
      }
    }
  }

  // Khung 2: Interstitial
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = 274 + c * 44, y = 55 + r * 44;
      svg += `<circle cx="${x}" cy="${y}" r="8" fill="var(--c1)"/>`;
    }
  }
  svg += `<circle cx="340" cy="121" r="9.5" fill="var(--c4)" stroke="#fff" stroke-width="2"/>`;
  svg += `<text x="340" y="148" text-anchor="middle" style="font-size:11.5px;fill:var(--c4);font-weight:800">Hạt chèn giữa</text>`;

  // Khung 3: Line Dislocation
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      if (r >= 2 && c === 2) continue; // thiếu nửa hàng giữa
      let x = 485 + c * 40;
      if (r >= 2 && c > 2) x -= 20;
      if (r >= 2 && c < 2) x += 10;
      const y = 55 + r * 44;
      svg += `<circle cx="${x}" cy="${y}" r="7.5" fill="${c===2 ? 'var(--c3)' : 'var(--c2)'}"/>`;
    }
  }
  svg += `<text x="565" y="216" text-anchor="middle" style="font-size:12px;fill:var(--mut);font-weight:700">Thiếu 1 nửa hàng nguyên tử giữa</text>`;
  svgEl.innerHTML = svg;
}
window.renderDefects = renderDefects;

function renderCzochralski() {
  const svgEl = $('cz-svg');
  if (!svgEl) return;
  const pct = +$('sl-cz').value;
  $('val-cz').textContent = pct;

  const pullH = 25 + pct * 0.95; // chiều dài thỏi Si đã kéo lên
  const topY = 148 - pullH;
  let svg = '';

  // Nồi nung Crucible và Silicon nóng chảy
  svg += `<path d="M 210 135 L 210 215 Q 210 235 235 235 L 445 235 Q 470 235 470 215 L 470 135" fill="none" stroke="var(--ink)" stroke-width="5"/>`;
  svg += `<rect x="214" y="150" width="252" height="82" rx="14" fill="rgba(245,159,0,0.35)"/>`;
  svg += `<line x1="214" y1="150" x2="466" y2="150" stroke="var(--c3)" stroke-width="3"/>`;
  svg += `<text x="340" y="205" text-anchor="middle" style="font-weight:800;fill:var(--ink)">Silicon nóng chảy (Melt ~ 1420°C)</text>`;

  // Các vòng gia nhiệt Heaters hai bên
  [148, 175, 202].forEach(hy => {
    svg += `<circle cx="190" cy="${hy}" r="8" fill="var(--c4)"/>`;
    svg += `<circle cx="490" cy="${hy}" r="8" fill="var(--c4)"/>`;
  });

  // Trục kéo và hạt mầm (Seed) + Thỏi đơn tinh thể (Crystal boule)
  svg += `<line x1="340" y1="10" x2="340" y2="${topY}" stroke="var(--mut)" stroke-width="5"/>`;
  svg += `<rect x="333" y="${topY}" width="14" height="14" fill="var(--c5)"/>`;
  svg += `<rect x="295" y="${topY+14}" width="90" height="${Math.max(12, 150 - (topY+14))}" rx="12" fill="var(--c1)" stroke="#fff" stroke-width="2"/>`;
  svg += `<text x="340" y="${topY + 42}" text-anchor="middle" style="fill:#fff;font-weight:800;font-size:13px">Thỏi Đơn tinh thể Si</text>`;
  svg += `<text x="515" y="75" style="font-weight:800;fill:var(--c1)">Vừa xoay vừa kéo chậm lên</text>`;
  svg += `<text x="515" y="100" style="font-size:13px;fill:var(--mut)">Hạt mầm (Seed) định hướng mạng</text>`;

  svgEl.innerHTML = svg;
}
window.renderCzochralski = renderCzochralski;

/* =========================================================
   CÁC MÔ HÌNH TƯƠNG TÁC CỦA BUỔI 2 (CƠ HỌC LƯỢNG TỬ PHẦN 1)
   ========================================================= */
function renderPhotoelectric() {
  const svgEl = $('pe-svg'), descEl = $('pe-desc');
  if (!svgEl || !descEl) return;
  const hv = +$('sl-pe-hv').value;
  const inten = +$('sl-pe-int').value;
  $('val-pe-hv').textContent = hv.toFixed(1);
  $('val-pe-int').textContent = inten;

  const phi = 2.3; // Công thoát của Natri (eV)
  const tmax = Math.max(0, hv - phi);
  const emitted = hv >= phi;

  descEl.innerHTML = emitted
    ? `<b>Trạng thái: CÓ QUANG ELECTRON BẬT RA!</b> ($h\\nu = ${hv.toFixed(1)}\\text{ eV} \\ge \\Phi = 2.3\\text{ eV}$)<br>• Động năng cực đại của mỗi electron thoát ra: $\\mathbf{T_{\\max} = h\\nu - \\Phi = ${hv.toFixed(1)} - 2.3 = ${tmax.toFixed(1)}\\text{ eV}}$.<br>• Khi tăng cường độ sáng (${inten} tia photon), số lượng electron bật ra tăng lên (${inten} hạt), nhưng động năng $T_{\\max}$ của mỗi hạt vẫn giữ nguyên!`
    : `<b>Trạng thái: KHÔNG CÓ ELECTRON NÀO THOÁT RA!</b> ($h\\nu = ${hv.toFixed(1)}\\text{ eV} < \\Phi = 2.3\\text{ eV}$)<br>• Năng lượng của từng hạt photon chưa đủ trả "phí công thoát" $\\Phi = 2.3\\text{ eV}$. Dù em tăng cường độ sáng lên ${inten} tia thì vẫn không có hạt electron nào bứt ra được!`;

  let svg = '';
  // Bên trái: Tấm kim loại và các tia photon bắn vào
  svg += `<rect x="45" y="175" width="230" height="45" rx="8" fill="var(--c5)" opacity="0.85"/>`;
  svg += `<text x="160" y="203" text-anchor="middle" style="fill:#fff;font-weight:800">Bề mặt Kim loại Natri (Φ = 2.3 eV)</text>`;

  for (let i = 0; i < inten; i++) {
    const px = 75 + i * 34;
    svg += `<line x1="${px-35}" y1="45" x2="${px}" y2="172" stroke="var(--c3)" stroke-width="3" stroke-dasharray="5,3"/>`;
    svg += `<circle cx="${px}" cy="172" r="4.5" fill="var(--c3)"/>`;
    if (emitted) {
      const ex = px + 28, ey = 155 - tmax * 36;
      svg += `<line x1="${px}" y1="170" x2="${ex}" y2="${ey}" stroke="var(--c2)" stroke-width="2.5"/>`;
      svg += `<circle cx="${ex}" cy="${ey}" r="6.5" fill="var(--c2)" stroke="#fff" stroke-width="1.5"/>`;
    }
  }

  // Bên phải: Đồ thị động năng cực đại T_max theo tần số/năng lượng photon
  const gx = 365, gy = 195, gw = 275, gh = 150;
  svg += `<line x1="${gx}" y1="30" x2="${gx}" y2="235" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<line x1="${gx}" y1="${gy}" x2="${gx+gw}" y2="${gy}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<text x="${gx+gw/2}" y="22" text-anchor="middle" style="font-weight:800;fill:var(--c1)">Đồ thị Millikan: T_max = hν - Φ</text>`;
  svg += `<text x="${gx+gw-5}" y="${gy+20}" text-anchor="end" style="font-size:12px;font-weight:700">hν (eV)</text>`;

  const x0 = gx + (2.3 / 5.2) * gw;
  const xMax = gx + (5.0 / 5.2) * gw;
  const yMax = gy - ((5.0 - 2.3) / 3.0) * gh;
  svg += `<line x1="${gx}" y1="${gy + (2.3/3.0)*gh*0.4}" x2="${x0}" y2="${gy}" stroke="var(--mut)" stroke-width="2" stroke-dasharray="4,4"/>`;
  svg += `<line x1="${x0}" y1="${gy}" x2="${xMax}" y2="${yMax}" stroke="var(--c1)" stroke-width="3.5"/>`;
  svg += `<text x="${x0}" y="${gy+18}" text-anchor="middle" style="font-weight:800;fill:var(--c4)">Φ=2.3eV</text>`;

  const curX = gx + (hv / 5.2) * gw;
  const curY = emitted ? (gy - (tmax / 3.0) * gh) : gy;
  svg += `<circle cx="${curX}" cy="${curY}" r="7.5" fill="${emitted ? 'var(--c2)' : 'var(--c4)'}" stroke="#fff" stroke-width="2"/>`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderPhotoelectric = renderPhotoelectric;

let currentDualityTab = 'debroglie';
function selectDualityTab(tab, btn) {
  currentDualityTab = tab;
  if (btn) {
    document.querySelectorAll('#duality-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  if ($('duality-ctrl-db')) $('duality-ctrl-db').style.display = tab === 'debroglie' ? 'grid' : 'none';
  if ($('duality-ctrl-comp')) $('duality-ctrl-comp').style.display = tab === 'compton' ? 'grid' : 'none';
  renderDuality();
}
window.selectDualityTab = selectDualityTab;

function renderDuality() {
  const svgEl = $('duality-svg'), descEl = $('duality-desc');
  if (!svgEl || !descEl) return;
  let svg = '';

  if (currentDualityTab === 'debroglie') {
    const V = +$('sl-db-v').value;
    $('val-db-v').textContent = V;
    const lamA = 12.27 / Math.sqrt(V); // Bước sóng de Broglie tính theo Angstrom
    descEl.innerHTML = `<b>Gia tốc Electron qua hiệu điện thế $V = ${V}\\text{ V}$:</b><br>• Động năng electron thu được: $E = eV = ${V}\\text{ eV}$.<br>• Bước sóng vật chất de Broglie: $\\mathbf{\\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2m_0 eV}} \\approx ${lamA.toFixed(2)}\\text{ Å}}$ (Điện áp $V$ càng lớn, động lượng $p$ càng lớn nên bước sóng $\\lambda$ càng co ngắn lại!).`;

    let path = '';
    const freq = Math.sqrt(V) * 0.45;
    for (let x = 50; x <= 630; x += 3) {
      const y = 125 - 55 * Math.sin((x - 50) * freq * 0.04);
      path += (x === 50 ? 'M' : 'L') + `${x} ${y.toFixed(1)} `;
    }
    svg += `<path d="${path}" fill="none" stroke="var(--c1)" stroke-width="3.5"/>`;
    svg += `<text x="340" y="38" text-anchor="middle" style="font-weight:800;fill:var(--c1)">Sóng vật chất de Broglie của Electron (λ ≈ ${lamA.toFixed(2)} Å)</text>`;
  } else {
    const ang = +$('sl-comp-ang').value;
    $('val-comp-ang').textContent = ang;
    const rad = ang * Math.PI / 180;
    const dLam = 0.02426 * (1 - Math.cos(rad)); // Độ lệch bước sóng Compton (Å)
    descEl.innerHTML = `<b>Hiệu ứng Tán xạ Compton ở góc lệch $\\theta = ${ang}^\\circ$:</b><br>• Photon tia X va chạm đàn hồi với electron đứng yên như hai viên bi-a, truyền bớt năng lượng cho electron.<br>• Bước sóng tia X sau va chạm dài thêm một đoạn: $\\mathbf{\\Delta\\lambda = \\lambda_f - \\lambda_i = \\frac{h}{m_0 c}(1 - \\cos\\theta) \\approx ${dLam.toFixed(4)}\\text{ Å}}$.`;

    const cx = 290, cy = 130;
    svg += `<line x1="70" y1="${cy}" x2="${cx}" y2="${cy}" stroke="var(--c1)" stroke-width="4"/>`;
    svg += `<text x="170" y="${cy-12}" text-anchor="middle" style="font-weight:800;fill:var(--c1)">Tia X tới (λ_i)</text>`;
    const px = cx + 190 * Math.cos(rad), py = cy - 120 * Math.sin(rad);
    svg += `<line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="var(--c4)" stroke-width="4"/>`;
    svg += `<text x="${px+10}" y="${py}" style="font-weight:800;fill:var(--c4)">Tia X tán xạ (λ_f > λ_i)</text>`;
    const ex = cx + 160 * Math.cos(-rad * 0.6), ey = cy - 110 * Math.sin(-rad * 0.6);
    svg += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="var(--c2)" stroke-width="3" stroke-dasharray="5,3"/>`;
    svg += `<circle cx="${ex}" cy="${ey}" r="9" fill="var(--c2)"/>`;
    svg += `<text x="${ex+12}" y="${ey+5}" style="font-weight:800;fill:var(--c2)">Electron bật ra</text>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="11" fill="var(--c3)" stroke="#fff" stroke-width="2"/>`;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderDuality = renderDuality;

function renderUncertainty() {
  const svgEl = $('unc-svg'), descEl = $('unc-desc');
  if (!svgEl || !descEl) return;
  const dx = +$('sl-unc-dx').value;
  $('val-unc-dx').textContent = dx.toFixed(2);
  const dp = 1.054e-34 / (dx * 1e-6);

  descEl.innerHTML = `<b>Nguyên lý Bất định Heisenberg ($\\Delta x \\cdot \\Delta p \\ge \\hbar$):</b><br>• Khi độ bất định vị trí là $\\Delta x = \\mathbf{${dx.toFixed(2)}\\text{ }\\mu\\text{m}} = ${dx.toFixed(2)}\\times 10^{-6}\\text{ m}$:<br>• Độ bất định động lượng tối thiểu là: $\\mathbf{\\Delta p \\ge \\frac{\\hbar}{\\Delta x} \\approx ${dp.toExponential(3)}\\text{ kg}\\cdot\\text{m/s}}$ (Khi $\\Delta x = 1.00\\text{ }\\mu\\text{m}$ trùng khít đáp án <b>Câu 2</b>!).`;

  let svg = '';
  // Bên trái: Bó sóng trong không gian vị trí x (bề rộng tỉ lệ với dx)
  let pathX = '', pathP = '';
  const sigX = dx * 45;
  const sigP = (1 / dx) * 45;
  for (let i = -130; i <= 130; i += 2) {
    const envX = Math.exp(-(i * i) / (2 * sigX * sigX));
    const yX = 125 - envX * Math.cos(i * 0.35) * 75;
    pathX += (i === -130 ? 'M' : 'L') + `${175 + i} ${yX.toFixed(1)} `;

    const envP = Math.exp(-(i * i) / (2 * sigP * sigP));
    const yP = 185 - envP * 125;
    pathP += (i === -130 ? 'M' : 'L') + `${505 + i} ${yP.toFixed(1)} `;
  }
  svg += `<text x="175" y="28" text-anchor="middle" style="font-weight:800;fill:var(--c1)">Bó sóng Không gian Vị trí (Δx)</text>`;
  svg += `<path d="${pathX}" fill="none" stroke="var(--c1)" stroke-width="2.8"/>`;
  svg += `<text x="505" y="28" text-anchor="middle" style="font-weight:800;fill:var(--c4)">Phổ Độ bất định Động lượng (Δp ∝ 1/Δx)</text>`;
  svg += `<path d="${pathP}" fill="rgba(230,73,128,0.18)" stroke="var(--c4)" stroke-width="3"/>`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderUncertainty = renderUncertainty;

function renderWellBoundary(mode, btn) {
  if (btn) {
    document.querySelectorAll('#well-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const svgEl = $('well-svg'), descEl = $('well-desc');
  if (!svgEl || !descEl) return;

  let svg = '';
  const xL = 200, xR = 480, yBot = 205, yTop = 55;
  svg += `<line x1="60" y1="${yBot}" x2="620" y2="${yBot}" stroke="var(--g)" stroke-width="1.5"/>`;
  svg += `<polyline points="80,${yTop} ${xL},${yTop} ${xL},${yBot} ${xR},${yBot} ${xR},${yTop} 600,${yTop}" fill="none" stroke="var(--c1)" stroke-width="3.5"/>`;
  svg += `<text x="${xL}" y="228" text-anchor="middle" style="font-weight:800">x = 0</text>`;
  svg += `<text x="${xR}" y="228" text-anchor="middle" style="font-weight:800">x = a</text>`;

  if (mode === 'finite') {
    descEl.innerHTML = `<b>1. Giếng thế Hữu hạn ($V(x) = V_0$ hữu hạn ở hai vách):</b><br>Vì thế năng hữu hạn ở mọi nơi, cả <b>hàm sóng $\\psi(x)$ lẫn đạo hàm $\\frac{d\\psi}{dx}$ đều liên tục</b> tại $x=0$ và $x=a$. Đuôi hàm sóng thấm nhẹ vào vùng vách hai bên theo hàm mũ suy giảm.`;
    let d = '';
    for (let x = 90; x <= 590; x += 4) {
      let val = 0;
      if (x < xL) val = 0.35 * Math.exp((x - xL) / 32);
      else if (x <= xR) val = 0.35 + 0.65 * Math.sin(Math.PI * (x - xL) / (xR - xL));
      else val = 0.35 * Math.exp(-(x - xR) / 32);
      d += (x === 90 ? 'M' : 'L') + `${x} ${(yBot - val * 115).toFixed(1)} `;
    }
    svg += `<path d="${d}" fill="none" stroke="var(--c4)" stroke-width="3.5"/>`;
    svg += `<text x="130" y="45" style="font-weight:800;fill:var(--c1)">V(x) = V₀</text>`;
    svg += `<text x="520" y="45" style="font-weight:800;fill:var(--c1)">V(x) = V₀</text>`;
  } else {
    descEl.innerHTML = `<b>2. Giếng thế Vô hạn ($V(x) = \\infty$ ở ngoài giếng):</b><br>Hàm sóng <b>bắt buộc bằng $0$ ở ngoài giếng và tại hai vách</b> ($\\psi(0) = \\psi(a) = 0$). Lưu ý: Hàm sóng $\\psi(x)$ liên tục tại biên, nhưng đạo hàm bậc nhất $\\frac{d\\psi}{dx}$ bị gãy khúc (không liên tục) tại vách vô hạn!`;
    let d = `M 90 ${yBot} L ${xL} ${yBot} `;
    for (let x = xL; x <= xR; x += 4) {
      const val = Math.sin(Math.PI * (x - xL) / (xR - xL));
      d += `L ${x} ${(yBot - val * 120).toFixed(1)} `;
    }
    d += `L 590 ${yBot}`;
    svg += `<path d="${d}" fill="none" stroke="var(--c2)" stroke-width="3.5"/>`;
    svg += `<text x="130" y="45" style="font-weight:800;fill:var(--c4)">V(x) = ∞</text>`;
    svg += `<text x="520" y="45" style="font-weight:800;fill:var(--c4)">V(x) = ∞</text>`;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderWellBoundary = renderWellBoundary;

let currentProbTab = 'q5';
function selectProbTab(tab, btn) {
  currentProbTab = tab;
  if (btn) {
    document.querySelectorAll('#prob-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  if ($('prob-ctrl-q5')) $('prob-ctrl-q5').style.display = tab === 'q5' ? 'grid' : 'none';
  if ($('prob-ctrl-q4')) $('prob-ctrl-q4').style.display = tab === 'q4' ? 'grid' : 'none';
  renderProbSim();
}
window.selectProbTab = selectProbTab;

function renderProbSim() {
  const svgEl = $('prob-svg'), descEl = $('prob-desc');
  if (!svgEl || !descEl) return;
  let svg = '';
  const ox = 85, oy = 205, gw = 520, gh = 155;
  svg += `<line x1="${ox}" y1="30" x2="${ox}" y2="${oy}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<line x1="${ox}" y1="${oy}" x2="${ox+gw}" y2="${oy}" stroke="var(--ink)" stroke-width="2"/>`;

  if (currentProbTab === 'q5') {
    const rangeKey = $('sel-q5-range') ? $('sel-q5-range').value : 'a';
    const ranges = {
      a: [0, 0.25, '39.35%', 'P = 1 - e^{-0.5} \\approx 0.3935'],
      b: [0.25, 0.50, '23.86%', 'P = e^{-0.5} - e^{-1} \\approx 0.2386'],
      c: [0, 1.00, '86.47%', 'P = 1 - e^{-2} \\approx 0.8647']
    };
    const [u1, u2, pctStr, mathStr] = ranges[rangeKey];
    descEl.innerHTML = `<b>Minh họa tích phân xác suất Câu 5 trên đoạn $[${u1}a_0, ${u2}a_0]$:</b><br>• Diện tích phần tô màu dưới đường cong $|\\psi(x)|^2 = \\frac{2}{a_0}e^{-2x/a_0}$ chính là xác suất tìm thấy hạt: $\\mathbf{${mathStr}\\ (${pctStr})}$.`;

    let curve = '', area = `M ${ox + (u1/2)*gw} ${oy} `;
    for (let i = 0; i <= 200; i++) {
      const u = (i / 200) * 2.0; // x/a0 từ 0 đến 2.0
      const px = ox + (u / 2.0) * gw;
      const py = oy - Math.exp(-2 * u) * gh;
      curve += (i === 0 ? 'M' : 'L') + `${px.toFixed(1)} ${py.toFixed(1)} `;
      if (u >= u1 && u <= u2) area += `L ${px.toFixed(1)} ${py.toFixed(1)} `;
    }
    area += `L ${ox + (u2/2)*gw} ${oy} Z`;
    svg += `<path d="${area}" fill="rgba(18,184,134,0.35)"/>`;
    svg += `<path d="${curve}" fill="none" stroke="var(--c2)" stroke-width="3.5"/>`;
    [0, 0.25, 0.5, 1.0, 2.0].forEach(u => {
      const px = ox + (u / 2.0) * gw;
      svg += `<text x="${px}" y="${oy+20}" text-anchor="middle" style="font-size:12px;font-weight:700">${u}a₀</text>`;
    });
  } else {
    const n = +$('sl-q4-n').value;
    $('val-q4-n').textContent = n;
    descEl.innerHTML = `<b>Minh họa chuẩn hóa hàm sóng Câu 4 với $n = ${n}$:</b><br>• Mật độ xác suất $|\\Psi(x,t)|^2 = A^2\\cos^2(${n}\\pi x)$ trên miền $[-1/2, +1/2]$ luôn có diện tích trung bình bằng một nửa hình chữ nhật bao ngoài, nên $\\frac{A^2}{2} = 1 \\implies \\mathbf{A = \\sqrt{2}}$ với mọi số nguyên $n \\ne 0$.`;

    let area = `M ${ox} ${oy} `;
    for (let i = 0; i <= 240; i++) {
      const x = -0.5 + (i / 240);
      const px = ox + (i / 240) * gw;
      const val = Math.pow(Math.cos(n * Math.PI * x), 2);
      const py = oy - val * gh;
      area += `L ${px.toFixed(1)} ${py.toFixed(1)} `;
    }
    area += `L ${ox+gw} ${oy} Z`;
    svg += `<path d="${area}" fill="rgba(112,72,232,0.28)" stroke="var(--c5)" stroke-width="3"/>`;
    svg += `<text x="${ox}" y="${oy+20}" text-anchor="middle" style="font-weight:700">x = -1/2</text>`;
    svg += `<text x="${ox+gw/2}" y="${oy+20}" text-anchor="middle" style="font-weight:700">x = 0</text>`;
    svg += `<text x="${ox+gw}" y="${oy+20}" text-anchor="middle" style="font-weight:700">x = +1/2</text>`;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderProbSim = renderProbSim;

/* =========================================================
   CÁC MÔ HÌNH TƯƠNG TÁC CỦA BUỔI 3 (CƠ HỌC LƯỢNG TỬ PHẦN 2)
   ========================================================= */
function setFreePreset(preset, btn) {
  if (btn) {
    document.querySelectorAll('#free-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  $('sl-free-k').value = preset === 'a' ? 8 : -15;
  renderFreeWave();
}
window.setFreePreset = setFreePreset;

function renderFreeWave() {
  const svgEl = $('free-svg'), descEl = $('free-desc');
  if (!svgEl || !descEl) return;
  let k8 = +$('sl-free-k').value;
  if (Math.abs(k8) < 0.5) k8 = 0.5;
  const wt = +$('sl-free-t').value;
  $('val-free-k').textContent = k8.toFixed(1);

  const k = k8 * 1e8;
  const lamA = (2 * Math.PI / Math.abs(k)) * 1e10;
  const p = 1.054e-34 * k;
  const E_eV = (p * p) / (2 * 9.11e-31 * 1.6e-19);
  const dirText = k > 0 ? 'Chiều dương trục x (+x, sang phải)' : 'Chiều âm trục x (-x, sang trái)';

  descEl.innerHTML = `<b>Thông số sóng phẳng với $k = ${k8.toFixed(1)} \\times 10^8\\text{ m}^{-1}$:</b><br>• Hướng truyền sóng: <b>${dirText}</b> | Bước sóng: $\\mathbf{\\lambda = \\frac{2\\pi}{|k|} \\approx ${lamA.toFixed(2)}\\text{ Å}}$.<br>• Động lượng: $\\mathbf{p = \\hbar k \\approx ${p.toExponential(3)}\\text{ kg}\\cdot\\text{m/s}}$ | Động năng: $\\mathbf{E = \\frac{p^2}{2m_0} \\approx ${(E_eV*1000).toFixed(1)}\\text{ meV}}$.`;

  let svg = '';
  let dRe = '', dIm = '';
  for (let x = 40; x <= 640; x += 3) {
    const phase = (x - 340) * (k8 * 0.012) - wt;
    const yRe = 115 - 65 * Math.cos(phase);
    const yIm = 115 - 65 * Math.sin(phase);
    dRe += (x === 40 ? 'M' : 'L') + `${x} ${yRe.toFixed(1)} `;
    dIm += (x === 40 ? 'M' : 'L') + `${x} ${yIm.toFixed(1)} `;
  }
  svg += `<line x1="30" y1="115" x2="650" y2="115" stroke="var(--g)" stroke-width="1.5"/>`;
  svg += `<path d="${dIm}" fill="none" stroke="var(--c5)" stroke-width="2" stroke-dasharray="4,4"/>`;
  svg += `<path d="${dRe}" fill="none" stroke="var(--c1)" stroke-width="3.5"/>`;
  svg += `<text x="340" y="28" text-anchor="middle" style="font-weight:800;fill:var(--c1)">Phần thực Re[Ψ(x,t)] = A·cos(kx - ωt) (${dirText})</text>`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderFreeWave = renderFreeWave;

function renderInfiniteWell() {
  const svgEl = $('infwell-svg'), descEl = $('infwell-desc');
  if (!svgEl || !descEl) return;
  const n = +$('sl-well-n').value;
  const aA = +$('sl-well-a').value;
  $('val-well-n').textContent = n;
  $('val-well-a').textContent = aA;

  const a_m = aA * 1e-10;
  const E1_J = (Math.PI * Math.PI * Math.pow(1.054e-34, 2)) / (2 * 9.11e-31 * a_m * a_m);
  const E1_eV = E1_J / 1.6e-19;
  const En_eV = n * n * E1_eV;

  descEl.innerHTML = `<b>Giếng thế vô hạn bề rộng $a = ${aA}\\text{ Å}$ ở mức lượng tử $n = ${n}$:</b><br>• Mức cơ bản ($n=1$): $E_1 \\approx \\mathbf{${(E1_eV*1000).toFixed(2)}\\text{ meV}}$ ($${E1_eV.toExponential(3)}\\text{ eV}$).<br>• Mức đang chọn ($n=${n}$): $\\mathbf{E_${n} = ${n}^2 E_1 \\approx ${(En_eV*1000).toFixed(2)}\\text{ meV}}$ ($${En_eV.toExponential(3)}\\text{ eV}$) — Có đúng <b>${n} bụng sóng</b> xác suất!`;

  let svg = '';
  const x1 = 90, x2 = 340, x3 = 400, x4 = 640, yBot = 225;
  // Khung trái: Hàm sóng psi_n(x); Khung phải: Mật độ xác suất |psi_n(x)|^2
  svg += `<line x1="${x1}" y1="35" x2="${x1}" y2="${yBot}" stroke="var(--ink)" stroke-width="3"/>`;
  svg += `<line x1="${x2}" y1="35" x2="${x2}" y2="${yBot}" stroke="var(--ink)" stroke-width="3"/>`;
  svg += `<line x1="${x1}" y1="${yBot}" x2="${x2}" y2="${yBot}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<text x="${(x1+x2)/2}" y="25" text-anchor="middle" style="font-weight:800;fill:var(--c1)">Hàm sóng ψ_${n}(x) và Vạch E_n</text>`;

  for (let lv = 1; lv <= 4; lv++) {
    const yLv = yBot - (lv * lv / 16) * 165;
    svg += `<line x1="${x1}" y1="${yLv}" x2="${x2}" y2="${yLv}" stroke="${lv===n ? 'var(--c4)' : 'var(--g)'}" stroke-width="${lv===n ? 2 : 1.2}" stroke-dasharray="4,3"/>`;
    svg += `<text x="${x1-8}" y="${yLv+4}" text-anchor="end" style="font-size:11.5px;font-weight:700">n=${lv}</text>`;
  }

  const yBase = yBot - (n * n / 16) * 165;
  let dPsi = '', dProb = `M ${x3} ${yBot} `;
  for (let i = 0; i <= 120; i++) {
    const u = i / 120;
    const sVal = Math.sin(n * Math.PI * u);
    const px1 = x1 + u * (x2 - x1);
    const py1 = yBase - sVal * 32;
    dPsi += (i === 0 ? 'M' : 'L') + `${px1.toFixed(1)} ${py1.toFixed(1)} `;

    const px2 = x3 + u * (x4 - x3);
    const py2 = yBot - (sVal * sVal) * 160;
    dProb += `L ${px2.toFixed(1)} ${py2.toFixed(1)} `;
  }
  dProb += `L ${x4} ${yBot} Z`;
  svg += `<path d="${dPsi}" fill="none" stroke="var(--c1)" stroke-width="3.2"/>`;

  svg += `<line x1="${x3}" y1="35" x2="${x3}" y2="${yBot}" stroke="var(--ink)" stroke-width="3"/>`;
  svg += `<line x1="${x4}" y1="35" x2="${x4}" y2="${yBot}" stroke="var(--ink)" stroke-width="3"/>`;
  svg += `<path d="${dProb}" fill="rgba(18,184,134,0.32)" stroke="var(--c2)" stroke-width="3"/>`;
  svg += `<text x="${(x3+x4)/2}" y="25" text-anchor="middle" style="font-weight:800;fill:var(--c2)">Mật độ xác suất |ψ_${n}(x)|² (${n} đỉnh)</text>`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderInfiniteWell = renderInfiniteWell;

function renderStepPotential() {
  const svgEl = $('step-svg'), descEl = $('step-desc');
  if (!svgEl || !descEl) return;
  const xA = +$('sl-step-x').value;
  const V0 = +$('sl-step-v0').value;
  $('val-step-x').textContent = xA;
  $('val-step-v0').textContent = V0.toFixed(1);

  const E = 2.8;
  const k2 = Math.sqrt(2 * 9.11e-31 * (V0 - E) * 1.6e-19) / 1.054e-34;
  const relProb = Math.exp(-2 * k2 * (xA * 1e-10));

  descEl.innerHTML = `<b>Đâm xuyên hàm mũ vào Bậc thế năng ($E = 2.8\\text{ eV} < V_0 = ${V0.toFixed(1)}\\text{ eV}$):</b><br>• Hệ số suy giảm trong vùng biên: $\\mathbf{k_2 = \\frac{\\sqrt{2m_0(V_0-E)}}{\\hbar} \\approx ${k2.toExponential(3)}\\text{ m}^{-1}}$.<br>• Tại độ sâu $x = \\mathbf{${xA}\\text{ Å}}$, tỷ số mật độ xác suất so với tại mép biên ($x=0$) là: $\\mathbf{\\frac{|\\psi_2(${xA}\\text{ Å})|^2}{|\\psi_2(0)|^2} = e^{-2k_2 x} \\approx ${relProb.toExponential(3)}}$.`;

  let svg = '';
  const xStep = 280, yBot = 210, yTop = 55;
  svg += `<line x1="50" y1="${yBot}" x2="630" y2="${yBot}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<polyline points="50,${yBot} ${xStep},${yBot} ${xStep},${yTop} 630,${yTop}" fill="rgba(245,159,0,0.12)" stroke="var(--c3)" stroke-width="3.5"/>`;
  svg += `<text x="${xStep}" y="232" text-anchor="middle" style="font-weight:800">Mép biên x = 0</text>`;

  // Sóng dừng ở vùng I (x < 0) và hàm mũ suy giảm ở vùng II (x >= 0)
  let dWave = '';
  for (let x = 50; x <= xStep; x += 3) {
    const y = 135 - 55 * Math.cos((x - xStep) * 0.14);
    dWave += (x === 50 ? 'M' : 'L') + `${x} ${y.toFixed(1)} `;
  }
  for (let x = xStep; x <= 620; x += 3) {
    const uA = (x - xStep) / 7.0; // mỗi 7px = 1 Angstrom
    const y = 190 - 110 * Math.exp(-uA * 0.12);
    dWave += `L ${x} ${y.toFixed(1)} `;
  }
  svg += `<path d="${dWave}" fill="none" stroke="var(--c1)" stroke-width="3.2"/>`;

  const px = xStep + xA * 7.0;
  const py = 190 - 110 * Math.exp(-xA * 0.12);
  svg += `<line x1="${px}" y1="${yTop}" x2="${px}" y2="${yBot}" stroke="var(--c4)" stroke-width="2" stroke-dasharray="4,3"/>`;
  svg += `<circle cx="${px}" cy="${py}" r="7" fill="var(--c4)" stroke="#fff" stroke-width="2"/>`;
  svg += `<text x="${px}" y="${yTop-10}" text-anchor="middle" style="font-weight:800;fill:var(--c4)">x = ${xA} Å</text>`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderStepPotential = renderStepPotential;

let currentTunnelTab = 'gaas';
function selectTunnelTab(tab, btn) {
  currentTunnelTab = tab;
  if (btn) {
    document.querySelectorAll('#tunnel-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderTunnelSim();
}
window.selectTunnelTab = selectTunnelTab;

function renderTunnelSim() {
  const svgEl = $('tunnel-svg'), descEl = $('tunnel-desc');
  if (!svgEl || !descEl) return;
  let svg = '';
  const xL = 250, xR = 410, yBot = 210, yTop = 55;

  if (currentTunnelTab === 'gaas' || currentTunnelTab === 'si') {
    const isGaAs = currentTunnelTab === 'gaas';
    svg += `<rect x="${xL}" y="${yTop}" width="${xR-xL}" height="${yBot-yTop}" fill="rgba(112,72,232,0.16)" stroke="var(--c5)" stroke-width="3"/>`;
    svg += `<line x1="40" y1="${yBot}" x2="640" y2="${yBot}" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<text x="${(xL+xR)/2}" y="42" text-anchor="middle" style="font-weight:800;fill:var(--c5)">Rào thế V₀ = 0.8 eV, a = 15 Å</text>`;

    let d = '';
    for (let x = 50; x <= 630; x += 3) {
      let y = 135;
      if (x < xL) {
        y = 135 - 55 * Math.cos((x - xL) * 0.15);
      } else if (x <= xR) {
        const u = (x - xL) / (xR - xL);
        const decay = isGaAs ? 1.54 : 3.8;
        y = 190 - 110 * Math.exp(-decay * u);
      } else {
        const amp = isGaAs ? 24 : 2.5;
        y = 165 - amp * Math.cos((x - xR) * 0.15);
      }
      d += (x === 50 ? 'M' : 'L') + `${x} ${y.toFixed(1)} `;
    }
    svg += `<path d="${d}" fill="none" stroke="${isGaAs ? 'var(--c2)' : 'var(--c4)'}" stroke-width="3.5"/>`;

    descEl.innerHTML = isGaAs
      ? `<b>Câu 4a — Xuyên hầm trong $\\text{GaAs}$ ($m^* = 0.067 m_0$):</b> Nhờ khối lượng hiệu dụng rất nhẹ, hệ số suy giảm nhỏ ($k_2 \\approx 1.027 \\times 10^9\\text{ m}^{-1}$), nên sóng thoát qua rào $15\\text{ Å}$ sang Vùng III với biên độ lớn ($\\mathbf{T \\approx 13.8\\%}$ theo xấp xỉ chuẩn).`
      : `<b>Câu 4b — Xuyên hầm trong Silicon ($m^* = 1.08 m_0$):</b> Khối lượng hiệu dụng nặng gấp 16 lần trong $\\text{GaAs}$ làm $k_2$ tăng lên $4.124 \\times 10^9\\text{ m}^{-1}$. Hàm sóng gần như tắt lịm trong rào ($\\mathbf{T \\approx 1.27 \\times 10^{-5}}$)!`;
  } else {
    // Câu 5: Giếng thế bất đối xứng (Figure P2.40)
    svg += `<polyline points="60,85 ${xL},85 ${xL},${yBot} ${xR},${yBot} ${xR},30 600,30" fill="none" stroke="var(--c1)" stroke-width="3.5"/>`;
    svg += `<text x="145" y="75" text-anchor="middle" style="font-weight:800;fill:var(--c1)">Vùng I: V(x) = V₀</text>`;
    svg += `<text x="${(xL+xR)/2}" y="232" text-anchor="middle" style="font-weight:800;fill:var(--c2)">Vùng II: V = 0 (0 &lt; x &lt; a)</text>`;
    svg += `<text x="515" y="75" text-anchor="middle" style="font-weight:800;fill:var(--c4)">Vùng III: V(x) = ∞ (ψ₃ = 0)</text>`;

    let d = '';
    for (let x = 70; x <= xR; x += 3) {
      let y = yBot;
      if (x < xL) y = yBot - 45 * Math.exp((x - xL) / 38);
      else y = yBot - 95 * Math.sin(Math.PI * (x - xL) / (xR - xL) * 0.85 + 0.48);
      d += (x === 70 ? 'M' : 'L') + `${x} ${y.toFixed(1)} `;
    }
    d += `L 590 ${yBot}`;
    svg += `<path d="${d}" fill="none" stroke="var(--c4)" stroke-width="3.2"/>`;
    descEl.innerHTML = `<b>Câu 5 (Figure P2.40) — Giếng thế bất đối xứng:</b> Ở Vùng I ($x<0$), $\\psi_1(x) = A_1 e^{k_1 x}$ suy giảm về $0$ khi $x \\to -\\infty$; ở Vùng II ($0<x<a$), $\\psi_2(x) = A_2\\sin(k_2 x) + B_2\\cos(k_2 x)$; ở Vùng III ($x>a$), $\\psi_3(x) = 0$ do tường thế cao vô tận.`;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderTunnelSim = renderTunnelSim;

function renderAtomSim(mode, btn) {
  if (btn) {
    document.querySelectorAll('#atom-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const svgEl = $('atom-svg'), descEl = $('atom-desc');
  if (!svgEl || !descEl) return;
  let svg = '';
  const ox = 85, oy = 205, gw = 520, gh = 155;

  if (mode === '1s' || mode === '2s') {
    svg += `<line x1="${ox}" y1="30" x2="${ox}" y2="${oy}" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="${ox}" y1="${oy}" x2="${ox+gw}" y2="${oy}" stroke="var(--ink)" stroke-width="2"/>`;
    let d = `M ${ox} ${oy} `;
    for (let i = 0; i <= 240; i++) {
      const u = (i / 240) * 10; // r/a0 từ 0 đến 10
      const pVal = mode === '1s'
        ? 4 * u * u * Math.exp(-2 * u) / 0.541
        : 0.5 * u * u * Math.pow(1 - 0.5 * u, 2) * Math.exp(-u) / 0.191;
      const px = ox + (u / 10) * gw;
      const py = oy - pVal * gh;
      d += `L ${px.toFixed(1)} ${py.toFixed(1)} `;
    }
    d += `L ${ox+gw} ${oy} Z`;
    svg += `<path d="${d}" fill="rgba(47,111,237,0.28)" stroke="var(--c1)" stroke-width="3.2"/>`;
    const peakU = mode === '1s' ? 1.0 : 5.236;
    const peakX = ox + (peakU / 10) * gw;
    svg += `<line x1="${peakX}" y1="45" x2="${peakX}" y2="${oy}" stroke="var(--c4)" stroke-width="2" stroke-dasharray="4,3"/>`;
    svg += `<text x="${peakX}" y="38" text-anchor="middle" style="font-weight:800;fill:var(--c4)">Đỉnh tại r ≈ ${peakU.toFixed(1)} a₀</text>`;

    descEl.innerHTML = mode === '1s'
      ? `<b>Trạng thái cơ bản $1s$ ($n=1, l=0, m=0$):</b> Mật độ xác suất xuyên tâm $P_{10}(r) = 4\\pi r^2 |\\psi_{100}|^2$ đạt cực đại đúng tại <b>Bán kính Bohr $r = a_0 = 0.529\\text{ Å}$</b> với năng lượng $E_1 = -13.58\\text{ eV}$.`
      : `<b>Trạng thái kích thích $2s$ ($n=2, l=0, m=0$):</b> Có một đỉnh phụ nhỏ ở gần hạt nhân và đỉnh chính nằm xa hơn tại $r \\approx 5.2\\,a_0$, ứng với mức năng lượng $E_2 = -\\frac{13.58}{2^2} = -3.395\\text{ eV}$.`;
  } else {
    // Tab 3: Cấu hình electron của Silicon (Z = 14: 1s2 2s2 2p6 3s2 3p2)
    const shells = [
      [140, 'Lớp K (n=1): 1s² (Đầy 2e)', 2, 'var(--c1)'],
      [340, 'Lớp L (n=2): 2s² 2p⁶ (Đầy 8e)', 8, 'var(--c2)'],
      [540, 'Lớp ngoài M (n=3): 3s² 3p² (4e hóa trị)', 4, 'var(--c4)']
    ];
    shells.forEach(([cx, label, count, col]) => {
      svg += `<circle cx="${cx}" cy="115" r="56" fill="none" stroke="${col}" stroke-width="2.5" stroke-dasharray="5,3"/>`;
      svg += `<circle cx="${cx}" cy="115" r="16" fill="var(--ink)"/>`;
      svg += `<text x="${cx}" y="120" text-anchor="middle" style="fill:#fff;font-size:11px;font-weight:800">+14</text>`;
      for (let k = 0; k < count; k++) {
        const a = (k / count) * 2 * Math.PI - Math.PI / 2;
        svg += `<circle cx="${cx + 56*Math.cos(a)}" cy="${115 + 56*Math.sin(a)}" r="7" fill="${col}" stroke="#fff" stroke-width="1.5"/>`;
      }
      svg += `<text x="${cx}" y="205" text-anchor="middle" style="font-size:12px;font-weight:800;fill:${col}">${label}</text>`;
    });
    descEl.innerHTML = `<b>Nguyên lý loại trừ Pauli & Nguyên tử Silicon ($Z = 14$):</b> Cấu hình $1s^2 2s^2 2p^6 \\mathbf{3s^2 3p^2}$. Hai lớp trong ($n=1, 2$) đã đóng kín, còn lớp ngoài cùng ($n=3$) có <b>$4$ electron hóa trị</b> quyết định toàn bộ tính chất bán dẫn của Silicon!`;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderAtomSim = renderAtomSim;

function renderQNSim() {
  const svgEl = $('qn-svg'), descEl = $('qn-desc');
  if (!svgEl || !descEl) return;
  const n = +$('sl-qn-n').value;
  const slL = $('sl-qn-l'); slL.max = n - 1; if (+slL.value > n - 1) slL.value = n - 1;
  const l = +slL.value;
  const slM = $('sl-qn-m'); slM.min = -l; slM.max = l;
  if (+slM.value > l) slM.value = l; if (+slM.value < -l) slM.value = -l;
  const m = +slM.value, sp = +$('sl-qn-s').value;
  const spTxt = sp === 0 ? '+½ ↑' : '−½ ↓';
  $('val-qn-n').textContent = n; $('val-qn-l').textContent = l; $('val-qn-m').textContent = m; $('val-qn-s').textContent = spTxt;
  const letter = 'spdf'[l], Lm = Math.sqrt(l * (l + 1)), E = -13.6 / (n * n);
  const k = 24, cx = 318, cy = 118;
  let svg = `<defs><marker id="qa" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" refX="9" refY="5.5" orient="auto"><path d="M0,0L11,5.5L0,11z" style="fill:var(--c3)"/></marker><marker id="qb" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" refX="9" refY="5.5" orient="auto"><path d="M0,0L11,5.5L0,11z" style="fill:var(--c4)"/></marker></defs>`;
  svg += `<use href="#o${n}${l}${Math.abs(m)}" x="14" y="14" width="190" height="190"/><rect x="14" y="14" width="190" height="190" style="fill:none;stroke:var(--g);stroke-width:1"/>`;
  svg += `<text x="109" y="224" text-anchor="middle" style="fill:var(--ink);font-size:13.5px;font-weight:700">${n}${letter}: (n,l,m) = (${n},${l},${m})</text>`;
  svg += `<text x="109" y="241" text-anchor="middle" style="fill:var(--mut);font-size:11.5px">mặt cắt |ψ|² (m và −m cùng hình)</text>`;
  svg += `<line x1="${cx}" y1="${cy+100}" x2="${cx}" y2="${cy-104}" style="stroke:var(--ink);stroke-width:2" marker-end="url(#qa)"/><text x="${cx+8}" y="${cy-96}" style="fill:var(--mut);font-size:12.5px">z</text>`;
  if (l === 0) {
    svg += `<circle cx="${cx}" cy="${cy}" r="5" style="fill:var(--c3)"/><text x="${cx}" y="${cy+30}" text-anchor="middle" style="fill:var(--c3);font-size:12.5px;font-weight:700">L = 0: không có hướng</text>`;
  } else {
    svg += `<circle cx="${cx}" cy="${cy}" r="${Lm*k}" style="fill:none;stroke:var(--g);stroke-width:1.5;stroke-dasharray:5 4"/>`;
    for (let q = -l; q <= l; q++) {
      const y = cy - q * k, dx = k * Math.sqrt(Lm * Lm - q * q);
      svg += `<line x1="${cx}" y1="${y}" x2="${cx+dx}" y2="${y}" style="stroke:var(--g);stroke-width:1;stroke-dasharray:3 3"/>`;
    }
    const ex = cx + k * Math.sqrt(Lm * Lm - m * m), ey = cy - m * k;
    svg += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" style="stroke:var(--c3);stroke-width:3.5" marker-end="url(#qa)"/>`;
    svg += `<text x="${ex+8}" y="${ey+(m>0?-4:14)}" style="fill:var(--c3);font-size:13px;font-weight:700">L</text>`;
  }
  svg += `<text x="318" y="241" text-anchor="middle" style="fill:var(--mut);font-size:11.5px">mô hình vectơ của L</text>`;
  const xa = 16, xb = 222, y0 = 274, dy = 25;
  const row = (x, i, col, txt, wt) => `<text x="${x}" y="${y0 + i*dy}" style="fill:${col};font-size:13.5px;font-weight:${wt||400}">${txt}</text>`;
  svg += row(xa,0,'var(--c1)',`E = −13.6/${n}² = ${E.toFixed(2)} eV`,700);
  svg += row(xa,1,'var(--c1)',`kích thước ~ n²a₀ = ${n*n} a₀`);
  svg += row(xa,2,'var(--c2)',`|L| = √(${l}·${l+1}) ħ = ${Lm.toFixed(2)} ħ`,700);
  svg += row(xa,3,'var(--c3)',`L_z = ${m>0?'+':''}${m} ħ`,700);
  svg += row(xb,0,'var(--ink)',`nút xuyên tâm: ${n-l-1}`);
  svg += row(xb,1,'var(--ink)',`nút góc: ${l}`);
  svg += row(xb,2,'var(--c5)',`lớp: ${n*n} orbital · phân lớp: ${2*l+1}`);
  svg += row(xb,3,'var(--c4)',`S_z = ${sp===0?'+':'−'}ħ/2`,700);
  const sy = sp === 0 ? -1 : 1;
  svg += `<line x1="330" y1="${y0+3*dy-6}" x2="330" y2="${y0+3*dy-6+sy*18}" style="stroke:var(--c4);stroke-width:3.5" marker-end="url(#qb)"/>`;
  svgEl.innerHTML = svg;
  descEl.innerHTML = `<b>Bộ số $(n,l,m,s)=(${n},${l},${m},${sp===0?'+':'-'}\\tfrac12)$:</b> electron ở orbital <b>${n}${letter}</b> (lớp ${'KLMN'[n-1]}). Lớp này có $n^2=${n*n}$ orbital, phân lớp $${letter}$ có $2l+1=${2*l+1}$ orbital, mỗi orbital chứa tối đa 2 electron. Thử kéo $n$ xuống $1$: thanh $l$ bị khóa ở $0$ vì $l\\le n-1$.`;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderQNSim = renderQNSim;

/* =========================================================
   CÁC MÔ HÌNH TƯƠNG TÁC CỦA BUỔI 4 (LÝ THUYẾT LƯỢNG TỬ CHẤT RẮN)
   ========================================================= */
function setKPPreset(pVal, btn) {
  if (btn) {
    document.querySelectorAll('#kp-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  $('sl-kp-p').value = pVal;
  renderKronigPenney();
}
window.setKPPreset = setKPPreset;

function renderKronigPenney() {
  const svgEl = $('kp-svg'), descEl = $('kp-desc');
  if (!svgEl || !descEl) return;
  const P = +$('sl-kp-p').value;
  $('val-kp-p').textContent = P;

  const ox = 55, oy = 175, gw = 585, maxU = 4 * Math.PI;
  const scaleY = 38; // 1 đơn vị = 38px

  let svg = '';
  const yPlus1 = oy - scaleY, yMinus1 = oy + scaleY;
  svg += `<rect x="${ox}" y="${yPlus1}" width="${gw}" height="${2*scaleY}" fill="rgba(18,184,134,0.08)"/>`;
  svg += `<line x1="${ox}" y1="${yPlus1}" x2="${ox+gw}" y2="${yPlus1}" stroke="var(--c2)" stroke-width="1.8" stroke-dasharray="5,4"/>`;
  svg += `<line x1="${ox}" y1="${yMinus1}" x2="${ox+gw}" y2="${yMinus1}" stroke="var(--c2)" stroke-width="1.8" stroke-dasharray="5,4"/>`;
  svg += `<line x1="${ox}" y1="20" x2="${ox}" y2="275" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<line x1="${ox}" y1="${oy}" x2="${ox+gw}" y2="${oy}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<text x="${ox-8}" y="${yPlus1+4}" text-anchor="end" style="font-weight:800;fill:var(--c2)">+1</text>`;
  svg += `<text x="${ox-8}" y="${yMinus1+4}" text-anchor="end" style="font-weight:800;fill:var(--c2)">-1</text>`;

  let path = '';
  for (let i = 1; i <= 360; i++) {
    const u = (i / 360) * maxU;
    const fVal = P * (Math.sin(u) / u) + Math.cos(u);
    const px = ox + (u / maxU) * gw;
    const py = Math.max(18, Math.min(275, oy - fVal * scaleY));
    path += (i === 1 ? 'M' : 'L') + `${px.toFixed(1)} ${py.toFixed(1)} `;
    if (Math.abs(fVal) <= 1.0) {
      svg += `<line x1="${px.toFixed(1)}" y1="${yPlus1}" x2="${px.toFixed(1)}" y2="${yMinus1}" stroke="rgba(47,111,237,0.22)" stroke-width="2.5"/>`;
    }
  }
  svg += `<path d="${path}" fill="none" stroke="var(--c1)" stroke-width="3"/>`;

  [1, 2, 3, 4].forEach(m => {
    const px = ox + (m / 4) * gw;
    svg += `<line x1="${px}" y1="${oy-5}" x2="${px}" y2="${oy+5}" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<text x="${px}" y="${oy+22}" text-anchor="middle" style="font-weight:800">${m}π</text>`;
  });

  descEl.innerHTML = `<b>Đồ thị hàm Kronig-Penney $f(\\alpha a) = ${P}\\frac{\\sin(\\alpha a)}{\\alpha a} + \\cos(\\alpha a)$:</b><br>• Các dải cột tô màu xanh dương là vùng thỏa mãn $\\mathbf{-1 \\le f(\\alpha a) \\le +1}$ $\\implies$ Tạo thành <b>Dải năng lượng cho phép (Allowed Bands)</b>.<br>• Khi $P' = 12$ (đúng đề bài <b>Câu 1 & Câu 2</b>): Dải 1 từ $2.628 \\to \\pi$; Dải 2 từ $5.307 \\to 2\\pi$; Dải 3 từ $8.067 \\to 3\\pi$; Dải 4 từ $10.909 \\to 4\\pi$.`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderKronigPenney = renderKronigPenney;

let currentEKTab = 'q4';
function selectEKTab(tab, btn) {
  currentEKTab = tab;
  if (btn) {
    document.querySelectorAll('#ek-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  if ($('ek-ctrl-q4')) $('ek-ctrl-q4').style.display = tab === 'q4' ? 'grid' : 'none';
  renderEKSim();
}
window.selectEKTab = selectEKTab;

function renderEKSim() {
  const svgEl = $('ek-svg'), descEl = $('ek-desc');
  if (!svgEl || !descEl) return;
  let svg = '';
  const cx = 340, yBot = 215, yTop = 35;
  svg += `<line x1="${cx}" y1="${yTop}" x2="${cx}" y2="235" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<line x1="70" y1="${yBot}" x2="610" y2="${yBot}" stroke="var(--ink)" stroke-width="2"/>`;

  if (currentEKTab === 'q4') {
    const pt = $('sel-ek-pt') ? $('sel-ek-pt').value : 'A';
    let d = '';
    for (let x = 100; x <= 580; x += 4) {
      const u = ((x - cx) / 240) * Math.PI;
      const y = 130 + 68 * Math.cos(u);
      d += (x === 100 ? 'M' : 'L') + `${x} ${y.toFixed(1)} `;
    }
    svg += `<path d="${d}" fill="none" stroke="var(--c1)" stroke-width="3.5"/>`;

    const pts = {
      A: [-0.82 * Math.PI, 'Âm (m* < 0 — Bát úp)', 'Chiều âm -x (v < 0 — Dốc xuống)'],
      B: [-0.22 * Math.PI, 'Dương (m* > 0 — Bát ngửa)', 'Chiều âm -x (v < 0 — Dốc xuống)'],
      C: [0.22 * Math.PI, 'Dương (m* > 0 — Bát ngửa)', 'Chiều dương +x (v > 0 — Dốc lên)'],
      D: [0.82 * Math.PI, 'Âm (m* < 0 — Bát úp)', 'Chiều dương +x (v > 0 — Dốc lên)']
    };
    Object.entries(pts).forEach(([kName, [uVal]]) => {
      const px = cx + (uVal / Math.PI) * 240;
      const py = 130 + 68 * Math.cos(uVal);
      const isSel = kName === pt;
      svg += `<circle cx="${px}" cy="${py}" r="${isSel ? 8.5 : 5.5}" fill="${isSel ? 'var(--c4)' : 'var(--c1)'}" stroke="#fff" stroke-width="2"/>`;
      svg += `<text x="${px}" y="${py-12}" text-anchor="middle" style="font-weight:800;fill:${isSel ? 'var(--c4)' : 'var(--ink)'}">${kName}</text>`;
    });
    const info = pts[pt];
    descEl.innerHTML = `<b>Phân tích Điểm ${pt} trên Giản đồ $E$-$k$ (Figure P3.15 — Câu 4):</b><br>• Chiều vận tốc hạt dẫn ($v = \\frac{1}{\\hbar}\\frac{dE}{dk}$): <b>${info[2]}</b>.<br>• Dấu khối lượng hiệu dụng ($\\frac{1}{m^*} = \\frac{1}{\\hbar^2}\\frac{d^2E}{dk^2}$): <b>${info[1]}</b>.`;
  } else {
    let dA = '', dB = '';
    for (let dk = -180; dk <= 180; dk += 4) {
      const yA = yBot - (dk * dk) * 0.011;
      const yB = yBot - (dk * dk) * 0.0045;
      if (yA >= yTop) dA += (dA === '' ? 'M' : 'L') + `${cx + dk} ${yA.toFixed(1)} `;
      if (yB >= yTop) dB += (dB === '' ? 'M' : 'L') + `${cx + dk} ${yB.toFixed(1)} `;
    }
    svg += `<path d="${dA}" fill="none" stroke="var(--c1)" stroke-width="3.5"/>`;
    svg += `<path d="${dB}" fill="none" stroke="var(--c4)" stroke-width="3.5" stroke-dasharray="6,4"/>`;
    svg += `<text x="${cx+115}" y="65" style="font-weight:800;fill:var(--c1)">Dải A (Cong gắt → m_A* nhỏ)</text>`;
    svg += `<text x="${cx+175}" y="95" style="font-weight:800;fill:var(--c4)">Dải B (Mở rộng → m_B* LỚN HƠN)</text>`;
    descEl.innerHTML = `<b>Minh họa Câu 3 (Figure P3.13):</b> Vì $m^* = \\hbar^2 / \\left(\\frac{d^2E}{dk^2}\\right)$ tỉ lệ nghịch với độ cong của Parabol, nên <b>Dải B (nét đứt, mở rộng thoải hơn) có khối lượng hiệu dụng LỚN HƠN Dải A ($m_B^* > m_A^*$)</b>.`;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderEKSim = renderEKSim;

function renderBandgapSim(mode, btn) {
  if (btn) {
    document.querySelectorAll('#bg-tabs .sim-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const svgEl = $('bg-svg'), descEl = $('bg-desc');
  if (!svgEl || !descEl) return;
  let svg = '';

  if (mode === 'gaas' || mode === 'si') {
    const isDirect = mode === 'gaas';
    const cx = 240, kShift = isDirect ? 0 : 120;
    svg += `<line x1="${cx}" y1="25" x2="${cx}" y2="235" stroke="var(--ink)" stroke-width="2"/>`;
    svg += `<line x1="80" y1="215" x2="580" y2="215" stroke="var(--ink)" stroke-width="2"/>`;

    let dVal = '', dCond = '';
    for (let dk = -110; dk <= 110; dk += 4) {
      dVal += (dk === -110 ? 'M' : 'L') + `${cx + dk} ${(165 + dk*dk*0.0045).toFixed(1)} `;
      dCond += (dk === -110 ? 'M' : 'L') + `${cx + kShift + dk} ${(95 - dk*dk*0.005).toFixed(1)} `;
    }
    svg += `<path d="${dVal}" fill="none" stroke="var(--c2)" stroke-width="3.5"/>`;
    svg += `<path d="${dCond}" fill="none" stroke="var(--c1)" stroke-width="3.5"/>`;
    svg += `<line x1="${cx}" y1="165" x2="${cx+kShift}" y2="95" stroke="var(--c4)" stroke-width="3" stroke-dasharray="5,3"/>`;
    svg += `<text x="${cx+kShift+15}" y="132" style="font-weight:800;fill:var(--c4)">${isDirect ? 'Chỉ cần Photon (hν ≥ 1.42 eV)' : 'Cần Photon (ΔE) + Phonon (Δk)'}</text>`;

    descEl.innerHTML = isDirect
      ? `<b>1. Gallium Arsenide ($\\text{GaAs}$ — Vùng cấm thẳng $E_g = 1.42\\text{ eV}$, Câu 5):</b> Đáy dải dẫn và đỉnh dải hóa trị nằm cùng tại $k=0$. Tần số tối thiểu $\\mathbf{\\nu_{\\min} \\approx 3.43 \\times 10^{14}\\text{ Hz}}$, bước sóng tối đa $\\mathbf{\\lambda_{\\max} \\approx 0.875\\text{ }\\mu\\text{m}}$.`
      : `<b>2. Silicon ($\\text{Si}$ — Vùng cấm xiên $E_g = 1.12\\text{ eV}$, Câu 5):</b> Đáy dải dẫn lệch vị trí $k$ so với đỉnh dải hóa trị. Tần số tối thiểu $\\mathbf{\\nu_{\\min} \\approx 2.705 \\times 10^{14}\\text{ Hz}}$, bước sóng tối đa $\\mathbf{\\lambda_{\\max} \\approx 1.11\\text{ }\\mu\\text{m}}$.`;
  } else {
    // So sánh Kim loại - Bán dẫn - Cách điện
    const items = [
      [90, 'Kim loại (Dải chồng lấn / Đầy 1 nửa)', 115, 130],
      [290, 'Bán dẫn (Eg ≈ 1.0 eV hẹp)', 95, 150],
      [490, 'Chất cách điện (Eg ≈ 5.0 eV rất lớn)', 65, 180]
    ];
    items.forEach(([x, label, yC, yV]) => {
      svg += `<rect x="${x}" y="35" width="120" height="${yC-35}" fill="rgba(47,111,237,0.18)" stroke="var(--c1)" stroke-width="2"/>`;
      svg += `<rect x="${x}" y="${yV}" width="120" height="${215-yV}" fill="rgba(18,184,134,0.32)" stroke="var(--c2)" stroke-width="2"/>`;
      svg += `<text x="${x+60}" y="236" text-anchor="middle" style="font-size:11.5px;font-weight:800">${label}</text>`;
    });
    descEl.innerHTML = `<b>So sánh Cấu trúc Dải năng lượng:</b> Kim loại không có vùng cấm; Bán dẫn có vùng cấm hẹp ($E_g \\approx 1\\text{ eV}$) nên dẫn điện tốt khi được kích thích nhiệt/quang; Chất cách điện có vùng cấm quá lớn ($3.5 - 6\\text{ eV}$).`;
  }

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderBandgapSim = renderBandgapSim;

function renderFermiDirac() {
  const svgEl = $('fd-svg'), descEl = $('fd-desc');
  if (!svgEl || !descEl) return;
  const T = +$('sl-fd-t').value;
  const mode = $('sel-fd-mode') ? $('sel-fd-mode').value : 'both';
  const kT_meV = 25.9 * (T / 300);
  $('val-fd-t').textContent = T;
  $('val-fd-kt').textContent = kT_meV.toFixed(1);

  const ox = 75, oy = 205, gw = 540, gh = 160;
  const xEF = ox + gw / 2;
  let svg = '';
  svg += `<line x1="${ox}" y1="30" x2="${ox}" y2="${oy}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<line x1="${ox}" y1="${oy}" x2="${ox+gw}" y2="${oy}" stroke="var(--ink)" stroke-width="2"/>`;
  svg += `<line x1="${xEF}" y1="30" x2="${xEF}" y2="${oy}" stroke="var(--g)" stroke-width="1.8" stroke-dasharray="4,4"/>`;
  svg += `<text x="${xEF}" y="${oy+22}" text-anchor="middle" style="font-weight:800;fill:var(--c5)">E = E_F (f_F = 0.5)</text>`;

  let dF = '', dHole = '', dBoltz = '';
  for (let i = 0; i <= 240; i++) {
    const dE = ((i / 240) - 0.5) * 0.40; // từ -0.20 eV đến +0.20 eV quanh EF
    const kT = Math.max(0.002, kT_meV / 1000);
    const fVal = T === 0 ? (dE < 0 ? 1 : (dE > 0 ? 0 : 0.5)) : 1 / (1 + Math.exp(dE / kT));
    const px = ox + (i / 240) * gw;
    const pyF = oy - fVal * gh;
    const pyH = oy - (1 - fVal) * gh;
    dF += (i === 0 ? 'M' : 'L') + `${px.toFixed(1)} ${pyF.toFixed(1)} `;
    dHole += (i === 0 ? 'M' : 'L') + `${px.toFixed(1)} ${pyH.toFixed(1)} `;

    if (dE >= 0 && T > 0) {
      const bVal = Math.min(1.1, Math.exp(-dE / kT));
      const pyB = oy - bVal * gh;
      dBoltz += (dBoltz === '' ? 'M' : 'L') + `${px.toFixed(1)} ${pyB.toFixed(1)} `;
    }
  }
  if (mode === 'both' || mode === 'sym') {
    svg += `<path d="${dHole}" fill="none" stroke="var(--c2)" stroke-width="2.5" stroke-dasharray="5,4"/>`;
  }
  if ((mode === 'both' || mode === 'boltz') && T > 0) {
    svg += `<path d="${dBoltz}" fill="none" stroke="var(--c4)" stroke-width="2.8" stroke-dasharray="4,3"/>`;
  }
  svg += `<path d="${dF}" fill="none" stroke="var(--c1)" stroke-width="3.5"/>`;
  svg += `<circle cx="${xEF}" cy="${oy - 0.5*gh}" r="6" fill="var(--c5)" stroke="#fff" stroke-width="2"/>`;

  descEl.innerHTML = `<b>Hàm phân bố Fermi-Dirac $f_F(E)$ tại $T = ${T}\\text{ K}$ ($kT \\approx ${kT_meV.toFixed(1)}\\text{ meV}$):</b><br>• Đường liền nét xanh dương là xác suất có electron $f_F(E)$; đường đứt nét xanh lá là xác suất trống $1 - f_F(E)$ (đối xứng gương qua $E_F$).<br>• Đường đứt nét màu hồng là <b>Xấp xỉ hàm mũ Boltzmann</b> $\\exp\\left(-\\frac{E-E_F}{kT}\\right)$, khớp sát với $f_F(E)$ khi $E - E_F \\ge 3kT$.`;

  svgEl.innerHTML = svg;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([descEl]);
}
window.renderFermiDirac = renderFermiDirac;

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
/* =====================================================
   BUỔI 7: MÔ PHỎNG ĐỘNG HIỆU ỨNG HALL (tự chạy, không có thông số chỉnh tay)
   ===================================================== */
function initB7HallSim() {
  const host = document.getElementById('b7-hall-sim');
  if (!host) return;
  const cv = host.querySelector('canvas');
  if (!cv) return;
  if (window.__b7HallRAF) { cancelAnimationFrame(window.__b7HallRAF); window.__b7HallRAF = null; }
  const capEl = host.querySelector('.hall-cap');
  const chips = Array.from(host.querySelectorAll('.hall-chip'));
  const ctx = cv.getContext('2d');
  const CW = 800, CH = 480;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = CW * dpr; cv.height = CH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  /* ---------- hình học 3D -> 2D (chiếu xiên) ---------- */
  const L = 330, WD = 120, D = 46;
  const OX = 190, OY = 320;
  const P = (x, y, z) => [OX + x + 0.55 * y, OY - z - 0.30 * y];

  /* ---------- kịch bản tự động (giây) ---------- */
  const CYCLE = 44;
  const STAGES = [
    [0, 'Bước 1 · Mẫu loại P, chưa có từ trường: dòng điện chạy dọc thanh, lỗ trống trôi cùng chiều dòng. Vôn kế chỉ 0.'],
    [4, 'Bước 2 · Đưa nam châm lại gần: từ trường B hướng từ cực N (dưới) lên cực S (trên), xuyên qua thanh.'],
    [7, 'Bước 3 · Lực từ q·v×B đẩy lỗ trống về mặt trước. Lỗ trống dồn lại, mặt trước tích điện dương, mặt sau thừa điện tích âm. Điện áp Hall tăng dần.'],
    [12, 'Bước 4 · Cân bằng: điện trường Hall đẩy ngược lại đúng bằng lực từ nên hạt lại chạy thẳng. Vôn kế ổn định ở V_H > 0 ⇒ loại P.'],
    [17, 'Bước 5 · Rút nam châm: lực từ biến mất, điện tích tích tụ tản đi, V_H về 0.'],
    [20, 'Bước 6 · Đổi sang mẫu loại N (electron). Dòng điện vẫn theo chiều cũ, nhưng electron chạy NGƯỢC chiều dòng.'],
    [23, 'Bước 7 · Đưa nam châm vào lần nữa, cùng chiều từ trường như trước.'],
    [26, 'Bước 8 · Electron cũng bị đẩy về MẶT TRƯỚC (đổi dấu điện tích và đổi chiều chạy triệt tiêu nhau). Mặt trước giờ tích điện âm.'],
    [32, 'Bước 9 · Cân bằng: V_H < 0 ⇒ loại N. Cùng một phía nhưng điện tích trái dấu nên điện áp Hall trái dấu.'],
    [38, 'Bước 10 · Rút nam châm: V_H về 0. Vòng thí nghiệm lặp lại từ đầu.']
  ];
  const stageOf = t => { let s = 0; for (let i = 0; i < STAGES.length; i++) if (t >= STAGES[i][0]) s = i; return s; };
  const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  function magnetP(t) {
    if (t < 4) return 0;
    if (t < 7) return smooth((t - 4) / 3);
    if (t < 17) return 1;
    if (t < 20) return 1 - smooth((t - 17) / 3);
    if (t < 23) return 0;
    if (t < 26) return smooth((t - 23) / 3);
    if (t < 38) return 1;
    if (t < 41) return 1 - smooth((t - 38) / 3);
    return 0;
  }
  const isN = t => t >= 20;

  /* ---------- hạt tải ---------- */
  const N = 60;
  const TH = 46;          // tốc độ nhiệt (px/s)
  const AE = 280;         // gia tốc do điện trường dọc thanh
  const W0 = 1.6;         // tần số cyclotron khi có nam châm
  const KH = 3.0;         // hệ số đẩy lại của điện trường Hall (trường trung bình)
  const TAU = 0.25;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const ps = [];
  for (let i = 0; i < N; i++) {
    ps.push({ x: rnd(0, L), y: rnd(8, WD - 8), z: rnd(8, D - 8), vx: gauss() * TH, vy: gauss() * TH, tn: rnd(0, TAU * 2), trail: [] });
  }
  let nType = false;        // false = P, true = N
  let ybar = WD / 2, ybarS = WD / 2;
  let vH = 0, needle = 0;
  let sim = 0, lastTs = null, paused = false, lastStage = -1;

  function step(dt, mp) {
    const s = nType ? -1 : 1;
    const dirx = nType ? -1 : 1;
    const om = W0 * mp;
    let sy = 0;
    for (const p of ps) {
      const ax = dirx * AE + s * om * p.vy;
      const ay = -s * om * p.vx - KH * (ybar - WD / 2);
      p.vx += ax * dt; p.vy += ay * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.tn -= dt;
      if (p.tn <= 0) {
        p.vx = gauss() * TH; p.vy = gauss() * TH;
        p.tn = -Math.log(1 - Math.random()) * TAU;
      }
      if (p.y < 4) { p.y = 4; p.vy = Math.abs(p.vy) * 0.4; }
      if (p.y > WD - 4) { p.y = WD - 4; p.vy = -Math.abs(p.vy) * 0.4; }
      if (p.x > L) p.x -= L;
      if (p.x < 0) p.x += L;
      sy += p.y;
    }
    ybar = sy / N;
    const k = 1 - Math.exp(-dt / 0.6);
    ybarS += (ybar - ybarS) * k;
    let shift = WD / 2 - ybarS;
    const dz = 3.5; shift = Math.sign(shift) * Math.max(0, Math.abs(shift) - dz) * (24 / (24 - dz));
    const target = (nType ? -1 : 1) * 0.052 * shift;
    vH += (target - vH) * (1 - Math.exp(-dt / 0.15));
    needle += ((Math.max(-1, Math.min(1, vH / 1.6))) - needle) * (1 - Math.exp(-dt / 0.12));
    const tr = ps[0];
    tr.trail.push(P(tr.x, tr.y, tr.z));
    if (tr.trail.length > 46) tr.trail.shift();
    if (Math.abs(tr.vx) > 0 && tr.trail.length > 1) {
      const a = tr.trail[tr.trail.length - 1], b = tr.trail[tr.trail.length - 2];
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 40) tr.trail.length = 0;
    }
  }

  /* ---------- tiện ích vẽ ---------- */
  function poly(pts, fill, stroke, lw) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.2; ctx.stroke(); }
  }
  function box(x0, x1, y0, y1, z0, z1, cFront, cTop, cRight, label, labelCol) {
    // mặt phải
    poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], cRight, 'rgba(255,255,255,.35)', 1);
    // mặt trên
    poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], cTop, 'rgba(255,255,255,.35)', 1);
    // mặt trước
    poly([P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], cFront, 'rgba(255,255,255,.45)', 1.2);
    if (label) {
      const c = P((x0 + x1) / 2, y0, (z0 + z1) / 2);
      ctx.fillStyle = labelCol || '#fff'; ctx.font = '700 26px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, c[0], c[1] + 1);
    }
  }
  function line(pts, col, lw, dash) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); ctx.setLineDash([]);
  }
  function arrow(x1, y1, x2, y2, col, lw, head) {
    const a = Math.atan2(y2 - y1, x2 - x1); head = head || 9;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45));
    ctx.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45)); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  function text(s, x, y, col, size, weight, align) {
    ctx.fillStyle = col; ctx.font = (weight || 600) + ' ' + (size || 13) + 'px Arial'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }
  function carrier(x, y, r, isHole, ring) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832);
    if (isHole) { ctx.fillStyle = '#ff7fb0'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - r * .5, y); ctx.lineTo(x + r * .5, y); ctx.moveTo(x, y - r * .5); ctx.lineTo(x, y + r * .5); ctx.stroke(); }
    else { ctx.fillStyle = '#5b9bff'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - r * .5, y); ctx.lineTo(x + r * .5, y); ctx.stroke(); }
    if (ring) { ctx.beginPath(); ctx.arc(x, y, r + 4, 0, 6.2832); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.stroke(); }
  }

  /* ---------- dây điện ---------- */
  const pl = P(0, WD / 2, D / 2), pr = P(L, WD / 2, D / 2);
  const cf = P(L / 2, 0, D / 2), cb = P(L / 2, WD, D / 2);
  const wireIn = [[50, 330], [50, pl[1]], [pl[0] - 6, pl[1]]];
  const wireOut = [[pr[0] + 6, pr[1]], [600, pr[1]], [600, 450], [50, 450], [50, 346]];
  const pathPts = wireIn.concat([]);
  function pointsAlong(pts, d) {
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const sl = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (d <= acc + sl) { const u = (d - acc) / sl; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]; }
      acc += sl;
    }
    return pts[pts.length - 1];
  }
  const lenOf = pts => { let a = 0; for (let i = 1; i < pts.length; i++) a += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return a; };
  const lenIn = lenOf(wireIn), lenOut = lenOf(wireOut);

  function draw(t, mp) {
    const stg = stageOf(t);
    // nền
    const g = ctx.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, '#0e1430'); g.addColorStop(1, '#1d2650');
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
    // bóng dưới sàn
    ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(OX + L / 2 + 40, OY + 18, L / 2 + 40, 20, 0, 0, 6.2832); ctx.fill(); ctx.restore();

    const s = nType ? -1 : 1;
    const gapTop = 34 + 130 * (1 - mp);
    const zTb = D + gapTop, zTt = zTb + 50;
    const zBt = -26 - 130 * (1 - mp), zBb = zBt - 50;

    // nam châm dưới (N)
    box(24, L - 24, -10, WD + 10, zBb, zBt, '#d9444f', '#ee6a73', '#a8303a', 'N', '#fff');

    // dây vôn kế phía sau (nối mặt sau)
    ctx.save();
    line([[cb[0], cb[1]], [632, cb[1]], [640, 262]], '#cfd6ee', 2.6);
    ctx.restore();
    circ(cb[0], cb[1], 5, '#cfd6ee', '#fff');

    // mặt sau / trên / phải của thanh bán dẫn (thể tích)
    const gBack = ctx.createLinearGradient(0, OY - D, 0, OY);
    poly([P(0, WD, 0), P(L, WD, 0), P(L, WD, D), P(0, WD, D)], 'rgba(120,140,190,.20)', 'rgba(200,215,255,.45)', 1);
    poly([P(0, 0, D), P(L, 0, D), P(L, WD, D), P(0, WD, D)], 'rgba(170,190,235,.26)', 'rgba(220,230,255,.7)', 1.3);
    poly([P(L, 0, 0), P(L, WD, 0), P(L, WD, D), P(L, 0, D)], 'rgba(100,120,170,.30)', 'rgba(210,222,255,.65)', 1.3);

    // điện tích mặt sau (nhìn xuyên)
    let shift = WD / 2 - ybarS; shift = Math.sign(shift) * Math.max(0, Math.abs(shift) - 3.5) * (24 / 20.5);
    const amt = Math.max(0, Math.min(1, Math.abs(shift) / 24));
    const nSym = Math.round(amt * 8);
    for (let i = 0; i < nSym; i++) {
      const q = P(34 + i * (L - 68) / 7, WD - 1, D * 0.55);
      ctx.globalAlpha = .55; symbol(q[0], q[1], nType ? '+' : '−', nType ? '#ff7fb0' : '#6aa7ff'); ctx.globalAlpha = 1;
    }

    // đường sức từ (xuyên qua thanh)
    if (mp > 0.02) {
      ctx.save(); ctx.globalAlpha = 0.55 * mp;
      for (let ix = 0; ix < 4; ix++) for (let iy = 0; iy < 3; iy++) {
        const x = 55 + ix * 74, y = 22 + iy * 38;
        const a = P(x, y, zBt), b = P(x, y, zTb);
        ctx.setLineDash([5, 5]); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
        const mid = P(x, y, (zBt + zTb) / 2 + 20);
        arrow(mid[0], mid[1] + 8, mid[0], mid[1] - 6, '#ffd166', 1.6, 7);
      }
      ctx.restore();
    }

    // hạt tải (xa -> gần)
    const order = ps.slice().sort((a, b) => b.y - a.y);
    for (const p of order) {
      const q = P(p.x, p.y, p.z);
      if (p === ps[0] && p.trail.length > 2) {
        ctx.beginPath(); ctx.moveTo(p.trail[0][0], p.trail[0][1]);
        for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i][0], p.trail[i][1]);
        ctx.strokeStyle = 'rgba(255,209,102,.85)'; ctx.lineWidth = 1.8; ctx.stroke();
      }
      carrier(q[0], q[1], 5.2, !nType, p === ps[0]);
    }
    // lực từ lên hạt theo dõi
    if (mp > 0.2) {
      const tr = ps[0], q = P(tr.x, tr.y, tr.z);
      const dx = -0.55 * 34 * mp, dy = 0.30 * 34 * mp;     // hướng -y (về phía người xem)
      arrow(q[0], q[1], q[0] + dx, q[1] + dy, '#ffa94d', 3, 9);
      text('F = q·v×B', q[0] + dx - 6, q[1] + dy + 14, '#ffa94d', 12, 700, 'right');
    }

    // mặt trước của thanh (phủ lên hạt)
    const gf = ctx.createLinearGradient(0, OY - D, 0, OY);
    gf.addColorStop(0, 'rgba(190,205,245,.30)'); gf.addColorStop(1, 'rgba(90,105,160,.30)');
    poly([P(0, 0, 0), P(L, 0, 0), P(L, 0, D), P(0, 0, D)], gf, 'rgba(235,242,255,.85)', 1.6);
    // điện cực hai đầu
    poly([P(-7, 0, 0), P(0, 0, 0), P(0, 0, D), P(-7, 0, D)], '#d08a4b', 'rgba(255,255,255,.6)', 1);
    poly([P(L, 0, 0), P(L + 7, 0, 0), P(L + 7, 0, D), P(L, 0, D)], '#d08a4b', 'rgba(255,255,255,.6)', 1);
    text('mẫu bán dẫn ' + (nType ? 'loại N' : 'loại P'), P(L / 2, 0, D * 0.2)[0], P(L / 2, 0, D * 0.2)[1], 'rgba(255,255,255,.85)', 11, 600);

    // điện tích mặt trước
    for (let i = 0; i < nSym; i++) {
      const q = P(34 + i * (L - 68) / 7, 0, D * 0.62);
      symbol(q[0], q[1], nType ? '−' : '+', nType ? '#6aa7ff' : '#ff7fb0', true);
    }
    // điện trường Hall
    if (amt > 0.05) {
      const a = nType ? P(L * 0.62, WD - 10, D / 2) : P(L * 0.62, 10, D / 2);
      const b = nType ? P(L * 0.62, 10, D / 2) : P(L * 0.62, WD - 10, D / 2);
      ctx.save(); ctx.globalAlpha = Math.min(1, amt * 1.2);
      arrow(a[0], a[1], b[0], b[1], '#ffd166', 3.6, 11);
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      text('E_H', m[0] + 18, m[1] - 8, '#ffd166', 13, 700);
      ctx.restore();
    }
    // kích thước
    text('d', P(-14, 0, D / 2)[0] - 4, P(-14, 0, D / 2)[1], 'rgba(255,255,255,.55)', 12, 600);
    text('W', P(L + 8, WD / 2, 0)[0] + 12, P(L + 8, WD / 2, 0)[1] + 4, 'rgba(255,255,255,.55)', 12, 600);

    // nam châm trên (S)
    box(24, L - 24, -10, WD + 10, zTb, zTt, '#3f73d6', '#6a98ec', '#2c56a8', 'S', '#fff');
    if (mp > 0.5) text('B ↑', P(L - 10, WD + 6, zTb + 62)[0] + 18, P(L - 10, WD + 6, zTb + 62)[1], '#ffd166', 14, 700, 'left');

    // pin + dây dòng điện
    line(wireIn, '#ffd166', 3); line(wireOut, '#ffd166', 3);
    ctx.fillStyle = '#d08a4b'; ctx.fillRect(pl[0] - 10, pl[1] - 2, 5, 4); ctx.fillRect(pr[0] + 5, pr[1] - 2, 5, 4);
    // pin
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(30, 330); ctx.lineTo(70, 330); ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(40, 346); ctx.lineTo(60, 346); ctx.stroke();
    text('+', 84, 328, '#ff9aa8', 16, 700); text('−', 84, 348, '#9ec5ff', 18, 700); text('pin', 22, 338, '#aab3d6', 12, 600, 'right');
    // chấm dòng điện quy ước chạy dọc dây
    const sp = 90, gap = 30, tt = (t * sp) % gap;
    for (let d = tt; d < lenIn; d += gap) { const q = pointsAlong(wireIn, d); circ(q[0], q[1], 3, '#fff6c7'); }
    for (let d = tt; d < lenOut; d += gap) { const q = pointsAlong(wireOut, d); circ(q[0], q[1], 3, '#fff6c7'); }
    text('I', 120, pl[1] - 12, '#ffd166', 14, 700);
    arrow(98, pl[1] - 0, 136, pl[1] - 0, 'rgba(255,209,102,.0)', 1, 1);

    // dây vôn kế phía trước (nối mặt trước) có "cầu" bắc qua dây pin
    line([[cf[0], cf[1]], [cf[0], 408], [594, 408]], '#ff6b81', 2.6);
    ctx.beginPath(); ctx.arc(600, 408, 6, Math.PI, 0); ctx.strokeStyle = '#ff6b81'; ctx.lineWidth = 2.6; ctx.stroke();
    line([[606, 408], [630, 408], [630, 300], [640, 300]], '#ff6b81', 2.6);
    circ(cf[0], cf[1], 5, '#ff6b81', '#fff');

    // vôn kế
    const bx = 640, by = 232, bw = 130, bh = 108;
    const gm = ctx.createLinearGradient(0, by, 0, by + bh);
    gm.addColorStop(0, '#2a3366'); gm.addColorStop(1, '#161c40');
    ctx.fillStyle = gm; roundRect(bx, by, bw, bh, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.6; roundRect(bx, by, bw, bh, 10); ctx.stroke();
    // mặt đồng hồ
    ctx.fillStyle = '#f3efe0'; roundRect(bx + 10, by + 24, bw - 20, 64, 8); ctx.fill();
    const pvx = bx + bw / 2 + 4, pvy = by + 84;
    ctx.strokeStyle = '#6b6f86'; ctx.lineWidth = 1.5;
    for (let k = -4; k <= 4; k++) {
      const an = (-90 + k * 14.5) * Math.PI / 180;
      const r1 = 46, r2 = k % 2 === 0 ? 40 : 43;
      ctx.beginPath(); ctx.moveTo(pvx + r1 * Math.cos(an), pvy + r1 * Math.sin(an)); ctx.lineTo(pvx + r2 * Math.cos(an), pvy + r2 * Math.sin(an)); ctx.stroke();
    }
    text('−', pvx - 40, by + 44, '#4a4e66', 13, 700); text('0', pvx, by + 40, '#4a4e66', 11, 700); text('+', pvx + 40, by + 44, '#4a4e66', 13, 700);
    const ang = (-90 + needle * 58) * Math.PI / 180;
    ctx.strokeStyle = '#d6303f'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(pvx, pvy); ctx.lineTo(pvx + 42 * Math.cos(ang), pvy + 42 * Math.sin(ang)); ctx.stroke();
    circ(pvx, pvy, 4.5, '#333', '#999');
    const vs = (vH >= 0 ? '+' : '−') + Math.abs(vH).toFixed(2) + ' mV';
    const colV = Math.abs(vH) < 0.03 ? '#ffffff' : (vH > 0 ? '#ff9ec0' : '#8cb8ff');
    text('V_H = ' + vs, bx + bw / 2, by + 13, colV, 14, 700);
    // cực
    circ(bx, 300, 6, '#ff6b81', '#fff'); circ(bx, 262, 6, '#cfd6ee', '#fff');
    text('+', bx + 14, 300, '#ff9aa8', 14, 700); text('−', bx + 14, 262, '#cfd6ee', 15, 700);
    text('vôn kế', bx + bw / 2, by + bh + 14, '#aab3d6', 12, 600);

    // nhãn mẫu
    ctx.save();
    ctx.fillStyle = nType ? 'rgba(91,155,255,.22)' : 'rgba(255,127,176,.22)';
    roundRect(24, 20, 220, 50, 10); ctx.fill();
    ctx.strokeStyle = nType ? '#5b9bff' : '#ff7fb0'; ctx.lineWidth = 1.6; roundRect(24, 20, 220, 50, 10); ctx.stroke();
    carrier(46, 45, 6.5, !nType, false);
    text(nType ? 'Loại N: electron (−)' : 'Loại P: lỗ trống (+)', 60, 36, '#fff', 14, 700, 'left');
    text(nType ? 'chạy NGƯỢC chiều dòng điện' : 'chạy CÙNG chiều dòng điện', 60, 56, 'rgba(255,255,255,.8)', 12, 600, 'left');
    ctx.restore();
    text('mặt trước (y = 0)', P(L / 2, 0, 0)[0], P(L / 2, 0, 0)[1] + 16, 'rgba(255,255,255,.5)', 11, 600);
    text('mặt sau', P(L * 0.85, WD, 0)[0] + 8, P(L * 0.85, WD, 0)[1] + 12, 'rgba(255,255,255,.4)', 11, 600);

    // phụ đề
    if (stg !== lastStage) {
      lastStage = stg;
      if (capEl) capEl.textContent = STAGES[stg][1];
      chips.forEach((c, i) => c.classList.toggle('on', i === stg));
    }
    if (paused) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, CW, CH); text('Đã tạm dừng · nhấn vào hình để chạy tiếp', CW / 2, CH / 2, '#fff', 20, 700); }
  }
  function circ(x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke(); }
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function symbol(x, y, ch, col, glow) {
    if (glow) { ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.2832); ctx.fillStyle = col; ctx.globalAlpha *= .28; ctx.fill(); ctx.globalAlpha /= .28; }
    text(ch, x, y, col, 20, 800);
  }

  cv.style.cursor = 'pointer';
  cv.onclick = () => { paused = !paused; };

  /* ---------- vòng lặp ---------- */
  function frame(ts) {
    if (!cv.isConnected) { window.__b7HallRAF = null; return; }
    if (lastTs === null) lastTs = ts;
    let dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;
    if (!paused) {
      sim += dt;
      if (sim >= CYCLE) { sim -= CYCLE; }
      const wantN = isN(sim);
      if (wantN !== nType) {
        nType = wantN;
        for (const p of ps) { p.vx = gauss() * TH; p.vy = gauss() * TH; }
        ybarS = ybar = WD / 2 - (WD / 2 - ybarS) * 0; ps.forEach(p => { p.y = rnd(10, WD - 10); });
        ybar = ybarS = WD / 2; ps[0].trail.length = 0;
      }
      step(dt, magnetP(sim));
    }
    draw(sim, magnetP(sim));
    window.__b7HallRAF = requestAnimationFrame(frame);
  }
  window.__b7HallRAF = requestAnimationFrame(frame);
  window.__b7HallDbg = () => ({ t: sim, vH, ybarS });
}

function loadLesson(lessonId) {
  const mainEl = $('app-content');
  if (lessonId === '1') {
    const tpl = $('tpl-buoi-1');
    mainEl.innerHTML = tpl.innerHTML;
    // Khởi tạo toàn bộ 7 mô hình tương tác của Buổi 1
    renderSolidModel('amorphous');
    renderLattice2D();
    selectCrystal('sc');
    renderMiller('100');
    renderBonding('pure');
    renderDefects();
    renderCzochralski();
  } else if (lessonId === '2') {
    const tpl = $('tpl-buoi-2');
    mainEl.innerHTML = tpl.innerHTML;
    // Khởi tạo toàn bộ các mô hình tương tác của Buổi 2
    renderPhotoelectric();
    selectDualityTab('debroglie');
    renderUncertainty();
    renderWellBoundary('finite');
    selectProbTab('q5');
  } else if (lessonId === '3') {
    const tpl = $('tpl-buoi-3');
    mainEl.innerHTML = tpl.innerHTML;
    // Khởi tạo toàn bộ 5 mô hình tương tác của Buổi 3
    renderFreeWave();
    renderInfiniteWell();
    renderStepPotential();
    renderTunnelSim();
    renderAtomSim('1s');
    renderQNSim();
  } else if (lessonId === '4') {
    const tpl = $('tpl-buoi-4');
    mainEl.innerHTML = tpl.innerHTML;
    // Khởi tạo toàn bộ các mô hình tương tác của Buổi 4
    renderKronigPenney();
    selectEKTab('q4');
    renderBandgapSim('gaas');
    renderFermiDirac();
  } else if (lessonId === '5') {
    const tpl = $('tpl-buoi-5');
    mainEl.innerHTML = tpl.innerHTML;
    // Khởi tạo toàn bộ các mô hình tương tác của Buổi 5
    renderCarrierDistSim();
    renderIntrinsicSim();
    renderDopingBandSim('donor');
  } else if (lessonId === '6') {
    const tpl = $('tpl-buoi-6');
    mainEl.innerHTML = tpl.innerHTML;
    // Khởi tạo toàn bộ 4 mô hình tương tác của Buổi 6
    renderB6FermiIntegralSim();
    renderB6CompSim();
    renderB6TempRegimesSim();
    renderB6ContactSim('before');
  } else if (lessonId === '7') {
    const tpl = $('tpl-buoi-7');
    mainEl.innerHTML = tpl.innerHTML;
    initB7HallSim();
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
  { id: '7', title: 'Buổi 7: Vận chuyển hạt tải (Trôi & Khuếch tán)' }
];
function renderLS(curId) {
  const lsEl = $('ls');
  if (!lsEl) return;
  lsEl.innerHTML = BAN_DAN_LESSONS.map(l =>
    `<button type="button" data-id="${l.id}" title="${l.title}" aria-label="${l.title}" class="${String(l.id) === String(curId) ? 'on' : ''}">${l.id}</button>`
  ).join('');
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

(function themeManager() {
  const root = document.documentElement;
  const body = document.body;
  const st = (k, v) => {
    try {
      if (typeof v !== 'undefined') localStorage.setItem(k, JSON.stringify(v));
      const val = localStorage.getItem(k);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      return null;
    }
  };

  const DEF_LG = { blur: 14, fill: 12, tint: 16, sat: 200, orbBlur: 16, refract: false, glow: false, bg: 'ios' };
  let currentTheme = st('ban-dan-theme') || 'liquid-glass';
  let lgConfig = Object.assign({}, DEF_LG, st('ban-dan-lg-settings') || {});
  if (!lgConfig.bg) lgConfig.bg = 'ios';

  const modalOverlay = document.getElementById('theme-modal-overlay');
  const btnSettings = document.getElementById('btn-theme-settings');
  const btnCloseModal = document.getElementById('theme-modal-close');
  const optDefault = document.getElementById('thm-opt-default');
  const optLiquid = document.getElementById('thm-opt-liquid');
  const lgSettingsPanel = document.getElementById('lg-settings-panel');
  const defaultNotice = document.getElementById('default-theme-notice');
  const orbsEl = document.getElementById('lg-orbs');
  const bgIosEl = document.getElementById('lg-bg-ios');
  const btnBgAurora = document.getElementById('btn-bg-aurora');
  const btnBgIos = document.getElementById('btn-bg-ios');
  const oBg = document.getElementById('o-lg-bg');

  const rBlur = document.getElementById('r-lg-blur');
  const oBlur = document.getElementById('o-lg-blur');
  const rFill = document.getElementById('r-lg-fill');
  const oFill = document.getElementById('o-lg-fill');
  const rTint = document.getElementById('r-lg-tint');
  const oTint = document.getElementById('o-lg-tint');
  const rSat = document.getElementById('r-lg-sat');
  const oSat = document.getElementById('o-lg-sat');
  const rOrbBlur = document.getElementById('r-lg-orb-blur');
  const oOrbBlur = document.getElementById('o-lg-orb-blur');
  const bGlow = document.getElementById('b-lg-glow');
  const bRefract = document.getElementById('b-lg-refract');
  const bReset = document.getElementById('b-lg-reset');

  const canRefract = () => /Chrom(e|ium)\//.test(navigator.userAgent) && window.CSS && CSS.supports && CSS.supports('backdrop-filter', 'blur(1px)');

  function applyLgTokens() {
    const s = root.style;
    s.setProperty('--lg-blur', lgConfig.blur + 'px');
    s.setProperty('--lg-fill', (lgConfig.fill / 100).toFixed(2));
    s.setProperty('--lg-tint', (lgConfig.tint / 100).toFixed(2));
    s.setProperty('--lg-sat', lgConfig.sat + '%');

    // Quản lý nền (iOS Silk Wave hoặc Aurora Orbs)
    const bg = lgConfig.bg || 'ios';
    body.setAttribute('data-lg-bg', bg);
    if (bg === 'ios') {
      if (orbsEl) orbsEl.classList.add('lg-orbs-hidden');
      if (bgIosEl) {
        if (lgConfig.orbBlur === 0) {
          bgIosEl.classList.add('lg-orbs-hidden');
        } else {
          bgIosEl.classList.remove('lg-orbs-hidden');
          bgIosEl.style.filter = 'blur(' + (lgConfig.orbBlur * 0.4) + 'px)';
        }
      }
    } else {
      if (bgIosEl) bgIosEl.classList.add('lg-orbs-hidden');
      if (lgConfig.orbBlur === 0) {
        if (orbsEl) orbsEl.classList.add('lg-orbs-hidden');
        s.setProperty('--lg-orb-blur', '0px');
      } else {
        if (orbsEl) {
          orbsEl.classList.remove('lg-orbs-hidden');
          orbsEl.style.filter = 'blur(' + lgConfig.orbBlur + 'px)';
        }
        s.setProperty('--lg-orb-blur', lgConfig.orbBlur + 'px');
      }
    }

    // Vệt sáng chuột
    body.classList.toggle('lg-glow-on', !!lgConfig.glow);
    if (bGlow) {
      bGlow.classList.toggle('active', !!lgConfig.glow);
      bGlow.setAttribute('aria-pressed', !!lgConfig.glow);
      bGlow.textContent = 'Vệt sáng chuột: ' + (lgConfig.glow ? 'Bật' : 'Tắt');
    }

    // Refraction
    root.classList.toggle('lg-refract', !!lgConfig.refract);
    if (bRefract) {
      bRefract.classList.toggle('active', !!lgConfig.refract);
      bRefract.setAttribute('aria-pressed', !!lgConfig.refract);
      if (!canRefract()) {
        bRefract.disabled = true;
        bRefract.textContent = 'Khúc xạ: cần Chrome / Edge';
      } else {
        bRefract.textContent = 'Khúc xạ (Chrome): ' + (lgConfig.refract ? 'Bật' : 'Tắt');
      }
    }
  }

  function syncControlUI() {
    const bg = lgConfig.bg || 'ios';
    if (btnBgAurora) {
      btnBgAurora.classList.toggle('active', bg === 'aurora');
      btnBgAurora.setAttribute('aria-checked', bg === 'aurora' ? 'true' : 'false');
    }
    if (btnBgIos) {
      btnBgIos.classList.toggle('active', bg === 'ios');
      btnBgIos.setAttribute('aria-checked', bg === 'ios' ? 'true' : 'false');
    }
    if (oBg) oBg.textContent = bg === 'ios' ? 'iOS' : 'Aurora';

    if (rBlur) { rBlur.value = lgConfig.blur; oBlur.textContent = lgConfig.blur + 'px'; }
    if (rFill) { rFill.value = lgConfig.fill; oFill.textContent = (lgConfig.fill / 100).toFixed(2); }
    if (rTint) { rTint.value = lgConfig.tint; oTint.textContent = (lgConfig.tint / 100).toFixed(2); }
    if (rSat) { rSat.value = lgConfig.sat; oSat.textContent = lgConfig.sat + '%'; }
    if (rOrbBlur) {
      rOrbBlur.value = lgConfig.orbBlur;
      oOrbBlur.textContent = lgConfig.orbBlur === 0 ? 'Ẩn vòng tròn' : lgConfig.orbBlur + 'px';
    }
    if (bGlow) {
      bGlow.classList.toggle('active', !!lgConfig.glow);
      bGlow.setAttribute('aria-pressed', !!lgConfig.glow);
      bGlow.textContent = 'Vệt sáng chuột: ' + (lgConfig.glow ? 'Bật' : 'Tắt');
    }
  }

  function setTheme(t) {
    currentTheme = t;
    st('ban-dan-theme', t);
    const isLg = t === 'liquid-glass';

    body.classList.toggle('lg-theme', isLg);
    if (optDefault) optDefault.classList.toggle('active', !isLg);
    if (optLiquid) optLiquid.classList.toggle('active', isLg);

    if (lgSettingsPanel) lgSettingsPanel.style.display = isLg ? 'flex' : 'none';
    if (defaultNotice) defaultNotice.style.display = isLg ? 'none' : 'block';

    if (isLg) {
      applyLgTokens();
    } else {
      if (orbsEl) orbsEl.classList.add('lg-orbs-hidden');
      if (bgIosEl) bgIosEl.classList.add('lg-orbs-hidden');
      body.removeAttribute('data-lg-bg');
      root.classList.remove('lg-refract');
    }
  }

  // Open / Close modal
  function openModal() {
    if (modalOverlay) {
      modalOverlay.hidden = false;
      syncControlUI();
    }
  }
  function closeModal() {
    if (modalOverlay) modalOverlay.hidden = true;
  }

  if (btnSettings) {
    btnSettings.onclick = (e) => {
      e.stopPropagation();
      const nav = document.getElementById('mn');
      const mb = document.getElementById('mb');
      if (nav) nav.hidden = true;
      if (mb) {
        mb.setAttribute('aria-expanded', 'false');
        mb.setAttribute('aria-label', 'Mở menu chọn bài và mục lục');
      }
      openModal();
    };
  }
  if (btnCloseModal) btnCloseModal.onclick = closeModal;
  if (modalOverlay) {
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) closeModal();
    };
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && !modalOverlay.hidden) {
      e.stopPropagation();
      closeModal();
    }
  }, true);

  if (optDefault) optDefault.onclick = () => setTheme('default');
  if (optLiquid) optLiquid.onclick = () => setTheme('liquid-glass');

  function setBg(bgKey) {
    lgConfig.bg = bgKey;
    st('ban-dan-lg-settings', lgConfig);
    syncControlUI();
    applyLgTokens();
  }
  if (btnBgAurora) btnBgAurora.onclick = () => setBg('aurora');
  if (btnBgIos) btnBgIos.onclick = () => setBg('ios');

  // Sliders
  function bindSlider(slider, output, key, transformOut, onApply) {
    if (!slider || !output) return;
    slider.oninput = () => {
      const v = +slider.value;
      lgConfig[key] = v;
      output.textContent = transformOut(v);
      onApply(v);
      st('ban-dan-lg-settings', lgConfig);
    };
  }

  bindSlider(rBlur, oBlur, 'blur', v => v + 'px', v => root.style.setProperty('--lg-blur', v + 'px'));
  bindSlider(rFill, oFill, 'fill', v => (v / 100).toFixed(2), v => root.style.setProperty('--lg-fill', (v / 100).toFixed(2)));
  bindSlider(rTint, oTint, 'tint', v => (v / 100).toFixed(2), v => root.style.setProperty('--lg-tint', (v / 100).toFixed(2)));
  bindSlider(rSat, oSat, 'sat', v => v + '%', v => root.style.setProperty('--lg-sat', v + '%'));
  bindSlider(rOrbBlur, oOrbBlur, 'orbBlur', v => v === 0 ? 'Ẩn vòng tròn' : v + 'px', v => {
    if (v === 0) {
      if (orbsEl) orbsEl.classList.add('lg-orbs-hidden');
    } else {
      if (orbsEl) {
        orbsEl.classList.remove('lg-orbs-hidden');
        orbsEl.style.filter = 'blur(' + v + 'px)';
      }
    }
    root.style.setProperty('--lg-orb-blur', v + 'px');
  });

  if (bGlow) {
    bGlow.onclick = () => {
      lgConfig.glow = !lgConfig.glow;
      body.classList.toggle('lg-glow-on', lgConfig.glow);
      bGlow.classList.toggle('active', lgConfig.glow);
      bGlow.setAttribute('aria-pressed', lgConfig.glow);
      bGlow.textContent = 'Vệt sáng chuột: ' + (lgConfig.glow ? 'Bật' : 'Tắt');
      st('ban-dan-lg-settings', lgConfig);
    };
  }

  if (bRefract) {
    bRefract.onclick = () => {
      if (!canRefract()) return;
      lgConfig.refract = !lgConfig.refract;
      root.classList.toggle('lg-refract', lgConfig.refract);
      bRefract.classList.toggle('active', lgConfig.refract);
      bRefract.setAttribute('aria-pressed', lgConfig.refract);
      bRefract.textContent = 'Khúc xạ (Chrome): ' + (lgConfig.refract ? 'Bật' : 'Tắt');
      st('ban-dan-lg-settings', lgConfig);
    };
  }

  if (bReset) {
    bReset.onclick = () => {
      lgConfig = Object.assign({}, DEF_LG);
      st('ban-dan-lg-settings', lgConfig);
      syncControlUI();
      applyLgTokens();
    };
  }

  // Pointer light tracking in liquid glass mode (chỉ chạy khi bật vệt sáng chuột)
  if (window.matchMedia && matchMedia('(pointer:fine)').matches) {
    document.addEventListener('pointermove', (e) => {
      if (!body.classList.contains('lg-theme') || !lgConfig.glow) return;
      const el = e.target.closest && e.target.closest('section, .sim-card, .formula-card, #mn, .theme-modal-box');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  // Init
  syncControlUI();
  setTheme(currentTheme);
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
    const x=Math.max(0,Math.min(p.x,innerWidth-Math.min(r.width,80))),y=Math.max(0,Math.min(p.y,innerHeight-24));
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
