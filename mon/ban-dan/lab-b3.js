/* ==========================================================================
   lab-b3.js — PHÒNG THÍ NGHIỆM BUỔI 3 (popup 95% màn hình)
   - Tự chứa: tự chèn CSS + HTML popup, không phụ thuộc code bài học.
   - 5 tab = 5 mục của Buổi 3 (Cơ học lượng tử Phần 2):
       1. Hạt tự do (Free Electron) — sóng phẳng, E-k liên tục
       2. Giếng thế vô hạn (Infinite Well) — sóng dừng, lượng tử hóa Eₙ
       3. Bậc thế & Xuyên hầm (Step + Tunneling) — phản xạ, truyền qua, hệ số T
       4. Nguyên tử hydro (Hydrogen Atom) — orbital 1s/2s/2p, xác suất |ψ|²
       5. Bốn số lượng tử (Quantum Numbers) — n, l, m_l, m_s, nguyên lý Pauli
   - API: LabB3.open(tabId?, panelIndex?)  LabB3.close()  LabB3.mark(root)
   ========================================================================== */
(function () {
'use strict';

/* ---------- hằng vật lý ---------- */
const TAU2 = Math.PI * 2;
const HBAR = 1.055e-34;   // J·s
const ME   = 9.109e-31;   // kg
const EV   = 1.602e-19;   // J/eV
const FONT = '"Be Vietnam Pro",system-ui,sans-serif';

const C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ['bg','card','ink','mut','sub','main','err','c1','c2','c3','c4','c5','g','tint'].forEach(k => C[k] = cs.getPropertyValue('--' + k).trim() || '#888');
}

/* ---------- tiện ích vẽ ---------- */
function txt(ctx, s, x, y, col, size, al, wt) {
  ctx.font = (wt||500) + ' ' + (size||12) + 'px ' + FONT;
  ctx.fillStyle = col || C.ink; ctx.textAlign = al || 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}
function ln(ctx, x1, y1, x2, y2, col, w, dash) {
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
  ctx.strokeStyle = col; ctx.lineWidth = w||1; ctx.setLineDash(dash||[]); ctx.stroke(); ctx.setLineDash([]);
}
function arr(ctx, x1, y1, x2, y2, col, w) {
  const a = Math.atan2(y2-y1, x2-x1), h = 4 + (w||2)*1.6;
  ln(ctx, x1, y1, x2, y2, col, w||2);
  ctx.beginPath(); ctx.moveTo(x2,y2);
  ctx.lineTo(x2 - h*Math.cos(a-.45), y2 - h*Math.sin(a-.45));
  ctx.lineTo(x2 - h*Math.cos(a+.45), y2 - h*Math.sin(a+.45));
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
function dot(ctx, x, y, r, col) { ctx.beginPath(); ctx.arc(x,y,r,0,TAU2); ctx.fillStyle=col; ctx.fill(); }
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

/* ---------- vật lý lượng tử ---------- */
// Năng lượng mức n trong giếng vô hạn rộng a (eV), a tính bằng Angstrom
const E_well = (n, a_A) => {
  const a = a_A * 1e-10;
  return (n*n * Math.PI*Math.PI * HBAR*HBAR) / (2 * ME * a * a) / EV;
};
// k từ E (eV) và V0 (eV): k = sqrt(2m(E-V0))/hbar, trả về số phức (re=k_re, im=k_im)
const kOfE = (E_eV, V0_eV) => {
  const diff = (E_eV - V0_eV) * EV;
  if (diff >= 0) return { re: Math.sqrt(2*ME*diff)/HBAR, im: 0 };
  return { re: 0, im: Math.sqrt(-2*ME*diff)/HBAR };
};
// Hệ số truyền qua rào hữu hạn chiều dày d (nm), cao V0 (eV), năng lượng E (eV)
const tunnelT = (E_eV, V0_eV, d_nm) => {
  if (E_eV >= V0_eV) return 1; // trên rào: truyền qua hoàn toàn (đơn giản hóa)
  const kappa = kOfE(E_eV, V0_eV).im;
  const d = d_nm * 1e-9;
  const kd = kappa * d;
  // T ≈ e^{-2κd} (gần đúng WKB)
  return Math.exp(-2 * kd);
};
// Hệ số phản xạ từ bậc thế E < V0 (đơn giản)
const stepR = (E_eV, V0_eV) => {
  if (E_eV <= 0) return 1;
  if (E_eV >= V0_eV) {
    const k1 = Math.sqrt(2*ME*E_eV*EV)/HBAR;
    const k2 = Math.sqrt(2*ME*(E_eV-V0_eV)*EV)/HBAR;
    return Math.pow((k1-k2)/(k1+k2), 2);
  }
  return 1;
};

const LABS = [];

/* ==========================================================================
   TAB 1 — HẠT TỰ DO (Free Electron)
   ========================================================================== */
LABS.push({
  id: 'free', name: 'Hạt tự do', sec: 1,
  S: { k: 8, wt: 0.6 },
  cols: '1.5fr 1fr', rows: '1.5fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Sóng phẳng ψ(x) = A·e^(jkx)', area: 'a', anim: true,
      ctrls: [
        { k: 'k', l: 'k (×10⁸ m⁻¹)', min: -20, max: 20, step: 0.5, f: v => (v>0?'+':'')+v.toFixed(1) },
        { k: 'wt', l: 'ωt (pha)', min: 0, max: 6.28, step: 0.1, f: v => v.toFixed(2) + ' rad' }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, k = S.k, wt = t * 2 + S.wt; // pha tự động thêm theo thời gian
        const ox = 20, oy = H/2, aw = W-40;
        // Vẽ trục
        ln(ctx, ox, oy, ox+aw, oy, C.sub, 1.4);
        arr(ctx, ox+aw-2, oy, ox+aw+2, oy, C.sub, 1.4);
        txt(ctx, 'x', ox+aw+6, oy, C.mut, 12, 'left', 600);
        // Vẽ sóng thực Re[ψ] = A·cos(kx − ωt)
        const pts_re = [], pts_im = [];
        const sc = 0.38 * H;
        for (let i = 0; i <= 200; i++) {
          const x = ox + i/200 * aw;
          const phase = k * (i/200 * 8) - wt;
          pts_re.push([x, oy - sc * Math.cos(phase)]);
          pts_im.push([x, oy - sc * Math.sin(phase)]);
        }
        // Im
        ctx.beginPath(); pts_im.forEach((a,i) => i ? ctx.lineTo(a[0],a[1]) : ctx.moveTo(a[0],a[1]));
        ctx.strokeStyle = C.c3; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
        // Re
        ctx.beginPath(); pts_re.forEach((a,i) => i ? ctx.lineTo(a[0],a[1]) : ctx.moveTo(a[0],a[1]));
        ctx.strokeStyle = C.c5; ctx.lineWidth = 2.5; ctx.stroke();
        // Nhãn
        const lam = k !== 0 ? (TAU2 / Math.abs(k) * 1e8).toFixed(2) : '∞';
        const E_eV = k !== 0 ? (HBAR*HBAR * Math.pow(k*1e8,2) / (2*ME) / EV).toFixed(3) : '0';
        const p_ev = k !== 0 ? (HBAR * Math.abs(k)*1e8 / EV * 1e9 / 300).toFixed(3) : '0';
        txt(ctx, 'Re[ψ]', ox+6, oy - sc*0.7, C.c5, 11.5, 'left', 700);
        txt(ctx, 'Im[ψ]', ox+6, oy + sc*0.7, C.c3, 11.5, 'left', 600);
        txt(ctx, k>0 ? '→ chạy về +x' : k<0 ? '← chạy về −x' : 'k=0: đứng yên', W-14, 14, C.main, 13, 'right', 700);
        txt(ctx, 'λ = '+lam+' Å', W-14, 32, C.c5, 12, 'right', 600);
        txt(ctx, 'E = '+E_eV+' eV', W-14, 48, C.c1, 12, 'right', 600);
      }
    },
    { title: 'Giản đồ E(k) = ħ²k²/2m (liên tục)', area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const ox = 50, oy = H-28, aw = W-70, ah = H-50;
        // Trục
        arr(ctx, ox, oy, ox, oy-ah, C.mut, 1.5); txt(ctx, 'E', ox-16, oy-ah+6, C.mut, 12, 'left', 700);
        arr(ctx, ox, oy, ox+aw, oy, C.mut, 1.5); txt(ctx, 'k', ox+aw+4, oy, C.mut, 12, 'left', 700);
        // Vạch k=0
        ln(ctx, ox, oy, ox, oy, C.g, 1);
        // Parabola E = ħ²k²/2m
        const kmax = 20e8, Emax = (HBAR*HBAR*kmax*kmax/(2*ME))/EV;
        const toX = k => ox + (k/kmax + 1)/2 * aw;
        const toY = E => oy - E/Emax * ah;
        ctx.beginPath();
        for (let i = -200; i <= 200; i++) {
          const kv = i/200 * kmax;
          const Ev = (HBAR*HBAR*kv*kv/(2*ME))/EV;
          const x = toX(kv), y = toY(Ev);
          i===-200 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = C.c5; ctx.lineWidth = 2.5; ctx.stroke();
        // Điểm hiện tại
        const kc = S.k * 1e8;
        const Ec = (HBAR*HBAR*kc*kc/(2*ME))/EV;
        dot(ctx, toX(kc), toY(Ec), 6, C.main);
        txt(ctx, 'k='+S.k.toFixed(1)+'×10⁸', toX(kc)+8, toY(Ec)-6, C.main, 11, 'left', 700);
        // Nhãn trục
        txt(ctx, '0', ox-8, oy+2, C.mut, 11, 'right', 400);
        txt(ctx, 'E liên tục: mọi giá trị đều được', ox+aw/2, oy-ah*0.9, C.c5, 11.5, 'center', 600);
      }
    }
  ]
});

/* ==========================================================================
   TAB 2 — GIẾNG THẾ VÔ HẠN (Infinite Potential Well)
   ========================================================================== */
LABS.push({
  id: 'well', name: 'Giếng vô hạn', sec: 2,
  S: { n: 1, a: 75 },
  cols: '1.5fr 1fr', rows: '1.5fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Hàm sóng ψₙ(x) và mật độ xác suất |ψₙ|²', area: 'a',
      ctrls: [
        { k: 'n', l: 'mức n', min: 1, max: 4, step: 1, f: v => 'n = '+v+' ('+v+' bụng sóng)' },
        { k: 'a', l: 'a (Å)', min: 10, max: 100, step: 5, f: v => v+' Å' }
      ],
      draw(p, ctx, W, H) {
        const S = p.S, n = S.n;
        const ox = 20, bx = 44, bw = W-88, by = 28, bh = H-56;
        // Vách
        ctx.fillStyle = C.tint; ctx.fillRect(ox, by, bx-ox, bh); ctx.fillRect(ox+bx+bw-ox, by, bx-ox, bh);
        ln(ctx, bx, by, bx, by+bh, C.c4, 3); ln(ctx, bx+bw, by, bx+bw, by+bh, C.c4, 3);
        txt(ctx, 'V=∞', ox+4, by+14, C.c4, 10.5, 'left', 700); txt(ctx, 'V=∞', bx+bw+6, by+14, C.c4, 10.5, 'left', 700);
        txt(ctx, 'V=0', bx + bw/2, by+bh+14, C.mut, 11, 'center', 500);
        // ψₙ
        const amp = bh * 0.38, ymid = by + bh/2;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const x = bx + i/200 * bw;
          const psi = Math.sqrt(2/(S.a*1e-10)) * Math.sin(n * Math.PI * i/200) * 1e5; // normalized * scale
          const y = ymid - amp * Math.sin(n * Math.PI * i/200);
          i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = C.c2; ctx.lineWidth = 2.5; ctx.stroke();
        // |ψₙ|²
        const pCol = C.c4;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const x = bx + i/200 * bw;
          const psi2 = Math.pow(Math.sin(n * Math.PI * i/200), 2);
          const y = by + bh - amp * 0.85 * psi2;
          i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = pCol; ctx.lineWidth = 1.8; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, 'ψₙ(x)', bx+6, by+16, C.c2, 12, 'left', 700);
        txt(ctx, '|ψₙ|²', bx+6, by+30, C.c4, 11, 'left', 600);
        txt(ctx, 'x=0', bx, by+bh+14, C.mut, 10, 'center', 400);
        txt(ctx, 'x=a', bx+bw, by+bh+14, C.mut, 10, 'center', 400);
      }
    },
    { title: 'Mức năng lượng Eₙ ∝ n²', area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S;
        const E1 = E_well(1, S.a), ox = 44, oy = H-24, ah = H-44, aw = W-ox-20;
        const Emax = E_well(4, S.a) * 1.15;
        const toY = E => oy - E/Emax * ah;
        const cols = [C.c1, C.c2, C.c5, C.c4];
        // Trục E
        arr(ctx, ox, oy, ox, oy-ah, C.mut, 1.5); txt(ctx, 'E (eV)', ox-28, oy-ah+8, C.mut, 11, 'left', 700);
        for (let n = 1; n <= 4; n++) {
          const E = E_well(n, S.a);
          const y = toY(E);
          const on = n === S.n;
          ln(ctx, ox, y, ox+aw, y, cols[n-1], on?3:1.5, on?[]:[4,3]);
          txt(ctx, 'n='+n+': '+E.toFixed(2)+' eV', ox+aw+4, y+1, cols[n-1], 10.5, 'left', on?700:500);
          if (on) {
            dot(ctx, ox+aw/2, y, 6, C.main);
            rr(ctx, ox, y-10, aw, 20, 4); ctx.fillStyle = C.main; ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 1;
          }
        }
        txt(ctx, 'E_n = n²·E₁', ox+aw/2, oy-ah*0.92, C.c5, 12, 'center', 700);
        txt(ctx, 'E₁ = '+E1.toFixed(3)+' eV', ox+aw/2, oy-ah*0.82, C.mut, 11, 'center', 500);
      }
    }
  ]
});

/* ==========================================================================
   TAB 3 — BẬC THẾ & XUYÊN HẦM (Step Potential + Tunneling)
   ========================================================================== */
LABS.push({
  id: 'tunnel', name: 'Xuyên hầm', sec: 3,
  S: { E: 0.4, V0: 1.0, d: 1.0, mode: 'step' },
  cols: '1.5fr 1fr', rows: '1.5fr 1fr', areas: '"a l" "c l"',
  panels: [
    { title: 'Sóng tới, phản xạ và xuyên qua rào thế', area: 'a', anim: true,
      ctrls: [
        { k: 'E', l: 'E (eV)', min: 0.05, max: 2, step: 0.05, f: v => v.toFixed(2)+' eV' },
        { k: 'V0', l: 'V₀ (eV)', min: 0.2, max: 3, step: 0.1, f: v => v.toFixed(1)+' eV' },
        { k: 'd', l: 'Bề dày d (nm)', min: 0.2, max: 3, step: 0.1, f: v => v.toFixed(1)+' nm' }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S;
        const E = S.E, V0 = S.V0, d = S.d;
        const T = tunnelT(E, V0, d), R = 1 - T;
        const ox = 16, bx = W*0.35, bx2 = W*0.60, oy = H*0.5, sc = H*0.32;
        const aw = W-32;

        // Vùng và rào
        ctx.fillStyle = C.tint; ctx.globalAlpha = 0.35;
        ctx.fillRect(bx, 20, bx2-bx, H-40); ctx.globalAlpha = 1;
        ln(ctx, bx, 20, bx, H-20, C.c3, 2.5);
        ln(ctx, bx2, 20, bx2, H-20, C.c3, 2.5);
        const Vheight = Math.min((V0/3)*sc, sc*0.95);
        txt(ctx, 'V₀ = '+V0.toFixed(1)+' eV', (bx+bx2)/2, 30, C.c3, 12, 'center', 700);

        // Mức năng lượng E
        const eY = oy - (E/V0)*sc*0.6;
        ln(ctx, ox, eY, aw, eY, E<V0 ? C.c2 : C.c1, 1.8, [6,4]);
        txt(ctx, 'E = '+E.toFixed(2)+' eV', ox+4, eY-8, E<V0?C.c2:C.c1, 11, 'left', 700);

        // Sóng tới (trái)
        ctx.beginPath();
        for (let i=0; i<=100; i++) {
          const x = ox + i/100 * (bx-ox);
          const ph = i/100 * TAU2 * 4 - t*3;
          const y = eY - sc*0.3 * Math.sin(ph);
          i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = C.c5; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, '→ tới', ox+4, eY-sc*0.45, C.c5, 11, 'left', 600);

        // Sóng phản xạ
        if (R > 0.02) {
          ctx.beginPath();
          for (let i=0; i<=100; i++) {
            const x = ox + i/100 * (bx-ox);
            const ph = i/100 * TAU2 * 4 + t*3;
            const y = eY + sc*0.3*R * Math.sin(ph);
            i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
          }
          ctx.strokeStyle = C.c4; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
          txt(ctx, '← phản xạ R='+Math.round(R*100)+'%', ox+4, eY+sc*0.45*R+8, C.c4, 11, 'left', 600);
        }

        // Trong rào: sóng tắt dần (evanescent)
        if (E < V0) {
          const kappa = kOfE(E, V0).im;
          ctx.beginPath();
          for (let i=0; i<=60; i++) {
            const x = bx + i/60*(bx2-bx);
            const frac = i/60;
            const y = eY - sc*0.28 * Math.exp(-kappa*frac*d*1e-9*1e9) * Math.sin(frac*TAU2*2 - t*2);
            i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
          }
          ctx.strokeStyle = C.c3; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.65; ctx.stroke(); ctx.globalAlpha = 1;
        }

        // Sóng truyền qua (phải)
        if (T > 0.005) {
          ctx.beginPath();
          for (let i=0; i<=100; i++) {
            const x = bx2 + i/100*(aw-bx2+ox);
            const ph = i/100*TAU2*4 - t*3;
            const y = eY - sc*0.3*Math.sqrt(T) * Math.sin(ph);
            i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
          }
          ctx.strokeStyle = C.c1; ctx.lineWidth = 1.5+T*1.5; ctx.stroke();
          txt(ctx, '→ qua T='+Math.round(T*100)+'%', bx2+6, eY-sc*0.45, C.c1, 11, 'left', 700);
        }
        txt(ctx, E<V0?'E < V₀: Xuyên hầm (Tunneling!)':'E ≥ V₀: Truyền qua trên rào', W/2, H-14, E<V0?C.c3:C.c1, 12.5, 'center', 700);
      }
    },
    { title: 'T(E) và R(E) theo năng lượng', area: 'c',
      draw(p, ctx, W, H) {
        const S = p.S, V0 = S.V0, d = S.d;
        const ox = 44, oy = H-28, ah = H-50, aw = W-ox-16;
        // Trục
        arr(ctx, ox, oy, ox, oy-ah, C.mut, 1.5); txt(ctx, 'T, R', ox-28, oy-ah+8, C.mut, 11, 'left', 700);
        arr(ctx, ox, oy, ox+aw, oy, C.mut, 1.5); txt(ctx, 'E (eV)', ox+aw+2, oy+2, C.mut, 11, 'left', 700);
        // Đường V0
        const xV0 = ox + (V0/3) * aw/1.1;
        ln(ctx, xV0, oy, xV0, oy-ah, C.c3, 1.4, [4,3]);
        txt(ctx, 'V₀', xV0+2, oy-ah+10, C.c3, 11, 'left', 600);
        // Vẽ T(E) và R(E)
        ctx.beginPath();
        for (let i=1; i<=200; i++) {
          const E = i/200 * 3;
          const T = tunnelT(E, V0, d);
          const x = ox + E/3 * aw; const y = oy - T*ah;
          i===1 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = C.c1; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.beginPath();
        for (let i=1; i<=200; i++) {
          const E = i/200 * 3;
          const T = tunnelT(E, V0, d);
          const x = ox + E/3 * aw; const y = oy - (1-T)*ah;
          i===1 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = C.c4; ctx.lineWidth = 1.8; ctx.stroke();
        // Điểm hiện tại
        const Tc = tunnelT(S.E, V0, d);
        const xc = ox + S.E/3*aw;
        dot(ctx, xc, oy-Tc*ah, 5, C.c1);
        dot(ctx, xc, oy-(1-Tc)*ah, 5, C.c4);
        txt(ctx, 'T', ox+6, oy-ah*0.85, C.c1, 12, 'left', 700);
        txt(ctx, 'R', ox+6, oy-ah*0.15, C.c4, 12, 'left', 700);
        // 0 và 1 trên trục
        txt(ctx, '0', ox-8, oy, C.mut, 11, 'right', 400);
        txt(ctx, '1', ox-8, oy-ah, C.mut, 11, 'right', 400);
      }
    }
  ]
});

/* ==========================================================================
   TAB 4 — NGUYÊN TỬ HYDRO (Hydrogen Atom 1-electron)
   ========================================================================== */
const ORBITALS = {
  '1s': { n:1, l:0, ml:0, label:'1s', color:'c1' },
  '2s': { n:2, l:0, ml:0, label:'2s', color:'c2' },
  '2p': { n:2, l:1, ml:0, label:'2p₀', color:'c5' },
  '3s': { n:3, l:0, ml:0, label:'3s', color:'c3' },
  '3p': { n:3, l:1, ml:0, label:'3p₀', color:'c4' }
};
// |ψ|² xác suất tìm hạt tại r (đơn vị Bohr a₀), tích phân thành P(r) = r²|R(r)|²
// Chỉ dùng hàm sóng xuyên tâm đơn giản hóa
function psi2_1s(r) { return Math.exp(-2*r); }  // |ψ|² ~ e^{-2r}
function psi2_2s(r) { const f=(2-r)*Math.exp(-r); return f*f; }
function psi2_2p(r) { return r*r*Math.exp(-r); }
function psi2_3s(r) { const f=(27-18*r+2*r*r)*Math.exp(-2*r/3); return f*f/27; }
function psi2_3p(r) { const f=r*(6-r)*Math.exp(-r/3); return f*f/36; }
const ORB_FUNC = { '1s':psi2_1s, '2s':psi2_2s, '2p':psi2_2p, '3s':psi2_3s, '3p':psi2_3p };

LABS.push({
  id: 'atom', name: 'Nguyên tử H', sec: 4,
  S: { orb: '1s' },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [
    { title: 'Orbital và mật độ xác suất P(r) = 4πr²|ψ|²', area: 'a', anim: true,
      ctrls: [
        { k: 'orb', seg: [['1s','1s'],['2s','2s'],['2p','2p'],['3s','3s'],['3p','3p']] }
      ],
      draw(p, ctx, W, H, t) {
        const S = p.S, fn = ORB_FUNC[S.orb] || psi2_1s;
        const orb = ORBITALS[S.orb];
        const rmax = S.orb.startsWith('3') ? 36 : S.orb.startsWith('2') ? 24 : 12;
        const cx = W*0.42, cy = H*0.5, maxR = Math.min(cx-20, cy-20);

        // --- Vẽ đám mây xác suất (dots) ---
        const st = p.st;
        if (!st.cloud || st.orbKey !== S.orb) {
          st.orbKey = S.orb;
          st.cloud = [];
          for (let attempt=0; attempt<6000 && st.cloud.length<700; attempt++) {
            const r = Math.random() * rmax;
            const theta = Math.random() * Math.PI;
            const phi = Math.random() * TAU2;
            const prob = fn(r) * r * r;
            if (Math.random() < prob / (rmax * rmax)) {
              const xs = r * Math.sin(theta) * Math.cos(phi);
              const ys = r * Math.sin(theta) * Math.sin(phi);
              const rxy = Math.sqrt(xs*xs + ys*ys);
              const ang = Math.atan2(ys, xs);
              st.cloud.push([rxy, ang]);
            }
          }
        }
        const colKey = orb ? orb.color : 'c1';
        st.cloud.forEach(([rxy, ang]) => {
          const sc = maxR / rmax;
          const px = cx + rxy*sc * Math.cos(ang), py = cy + rxy*sc * Math.sin(ang);
          dot(ctx, px, py, 1.8, C[colKey]);
        });

        // Hạt nhân
        dot(ctx, cx, cy, 5, C.c4);
        txt(ctx, '+', cx, cy+0.5, C.bg, 10, 'center', 800);

        // --- Đường P(r) bên phải ---
        const gx = W*0.70, gy = H*0.88, gw = W*0.26, gh = H*0.72;
        ln(ctx, gx, gy-gh, gx, gy, C.sub, 1.2);
        arr(ctx, gx, gy, gx+gw, gy, C.sub, 1.2);
        txt(ctx, 'r (a₀)', gx+gw+2, gy+2, C.mut, 10, 'left', 500);
        txt(ctx, 'P(r)', gx-4, gy-gh+8, C.mut, 10, 'right', 600);
        // Tính max P(r) để chuẩn hóa
        let Pmax = 0;
        for (let i=0; i<=200; i++) { const r=i/200*rmax; const P=fn(r)*r*r; if(P>Pmax) Pmax=P; }
        ctx.beginPath();
        for (let i=0; i<=200; i++) {
          const r = i/200*rmax, P = fn(r)*r*r / Pmax;
          const x = gx + i/200*gw, y = gy - P*gh;
          i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = C[colKey]; ctx.lineWidth = 2.2; ctx.stroke();

        // Thông tin
        const E_n = -13.6 / (orb.n*orb.n);
        txt(ctx, 'Orbital: '+S.orb, 12, 16, C[colKey], 14, 'left', 700);
        txt(ctx, 'n='+orb.n+', l='+orb.l+', m_l='+orb.ml, 12, 34, C.ink, 12, 'left', 600);
        txt(ctx, 'Eₙ = −13.6/n² = '+E_n.toFixed(2)+' eV', 12, 50, C.c5, 12, 'left', 600);
      }
    }
  ]
});

/* ==========================================================================
   TAB 5 — BỐN SỐ LƯỢNG TỬ (Quantum Numbers)
   ========================================================================== */
LABS.push({
  id: 'qn', name: 'Số lượng tử', sec: 5,
  S: { n: 2, l: 1, ml: 0, ms: 1 },
  cols: '1.5fr 1fr', rows: '1fr', areas: '"a l"',
  panels: [
    { title: 'Quy tắc chọn n, l, m_l, m_s và nguyên lý Pauli', area: 'a',
      ctrls: [
        { k: 'n', l: 'n (lớp vỏ)', min: 1, max: 4, step: 1, f: v => 'n = '+v },
        { k: 'l', l: 'l (phân lớp)', min: 0, max: 3, step: 1, f: v => 'l = '+v+' ('+['s','p','d','f'][v]+')' },
        { k: 'ml', l: 'm_l', min: -3, max: 3, step: 1, f: v => 'm_l = '+(v>=0?'+':'')+v },
        { k: 'ms', l: 'm_s', min: -1, max: 1, step: 2, f: v => v>0?'m_s = +½ (↑)':'m_s = −½ (↓)' }
      ],
      draw(p, ctx, W, H) {
        const S = p.S;
        const n = Math.round(S.n), l = Math.round(S.l);
        const ml = Math.round(S.ml), ms = S.ms > 0 ? 0.5 : -0.5;
        // Kiểm tra quy tắc
        const ok_l = l >= 0 && l < n;
        const ok_ml = ml >= -l && ml <= l;
        const ok_ms = ms === 0.5 || ms === -0.5;
        const valid = ok_l && ok_ml && ok_ms;

        // Vẽ bảng mức năng lượng
        const cols4 = [C.c1, C.c2, C.c5, C.c4];
        const sublabels = ['s','p','d','f'];
        const ox = 20, oy = H*0.1, bh = (H*0.78)/4, bw = (W*0.55)/4;
        txt(ctx, 'Giản đồ mức năng lượng (n lên trên)', W*0.33, oy-10, C.mut, 11, 'center', 600);
        for (let ni=1; ni<=4; ni++) {
          for (let li=0; li<ni; li++) {
            const x = ox + li*bw + bw/2 - 24;
            const y = oy + (4-ni)*bh + bh*0.4;
            const on = ni===n && li===l;
            rr(ctx, x, y, 48, 24, 6);
            ctx.fillStyle = on ? C[cols4[li]] : C.tint; ctx.globalAlpha = on ? 1 : 0.4; ctx.fill(); ctx.globalAlpha = 1;
            txt(ctx, ni+''+sublabels[li], x+24, y+12, on?C.bg:C.mut, on?13:11, 'center', on?700:500);
          }
        }
        // Thông tin số lượng tử
        const ix = W*0.60, iy = H*0.08;
        rr(ctx, ix, iy, W-ix-10, H*0.84, 10);
        ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.g; ctx.lineWidth = 1; ctx.stroke();
        const rows = [
          ['n = '+n, 'Lớp vỏ chính (n = 1,2,3,…)', C.c1, true],
          ['l = '+l+' ('+sublabels[Math.min(l,3)]+')', ok_l ? '0 ≤ l < n ✓' : 'Vi phạm: l phải < '+n+' ✗', ok_l?C.c2:C.err, ok_l],
          ['m_l = '+(ml>=0?'+':'')+ml, ok_ml ? '−l ≤ m_l ≤ l ✓' : 'Vi phạm: m_l phải trong [−'+l+', +'+l+'] ✗', ok_ml?C.c5:C.err, ok_ml],
          ['m_s = '+(ms>0?'+½':'-½')+' ('+(ms>0?'↑':'↓')+')', 'Chỉ ±½ (spin electron) ✓', C.c3, true]
        ];
        rows.forEach(([label, note, col, ok], i) => {
          const ry = iy+22 + i*(H*0.84-30)/4;
          txt(ctx, label, ix+14, ry, col, 14, 'left', 700);
          txt(ctx, note, ix+14, ry+16, ok?C.mut:C.err, 11, 'left', 500);
        });
        // Trạng thái
        rr(ctx, ix+10, iy+H*0.72, W-ix-20, H*0.1, 8);
        ctx.fillStyle = valid ? C.c1 : C.err; ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 1;
        txt(ctx, valid ? '✓ Trạng thái hợp lệ!' : '✗ Vi phạm quy tắc số lượng tử!', ix + (W-ix)/2, iy+H*0.77, valid?C.c1:C.err, 13, 'center', 700);
        txt(ctx, valid ? 'Mỗi trạng thái (n,l,m_l,m_s) duy nhất (Pauli)' : 'Sửa l hoặc m_l cho đúng quy tắc.', ix+(W-ix)/2, iy+H*0.84, C.mut, 11, 'center', 500);
      }
    }
  ]
});

/* ==========================================================================
   NHẬT KÝ GIẢI THÍCH
   ========================================================================== */
const LD = {};
LD.free = {
  intro: [
    ['i', 'Hạt tự do (V=0): không có lực nào tác dụng. Phương trình Schrödinger cho nghiệm là sóng phẳng ψ = Ae^{jkx}.'],
    ['w', 'k > 0: sóng chạy về +x. k < 0: chạy về −x. Biên độ bằng nhau ở mọi điểm → không thể chuẩn hóa trong không gian vô hạn.'],
    ['i', 'Năng lượng E = ħ²k²/2m nhận mọi giá trị ≥ 0 (liên tục, không lượng tử hóa).'],
    ['w', 'Màu tím: phần thực Re[ψ] = cos(kx − ωt). Màu xanh lục nhạt: phần ảo Im[ψ] = sin(kx − ωt).'],
    ['v', 'Kéo k để thay đổi bước sóng và hướng truyền. Điểm sáng trên E(k) dịch theo.']
  ],
  react(S, k, P, say) {
    const kv = S.k * 1e8;
    const E = (HBAR*HBAR*kv*kv/(2*ME))/EV;
    const lam = kv !== 0 ? (TAU2/Math.abs(kv)*1e10).toFixed(2) : '∞';
    say('v', `k = ${S.k.toFixed(1)}×10⁸ m⁻¹ → λ = ${lam} Å, E = ${E.toFixed(3)} eV.`);
    say('w', S.k > 0 ? 'k > 0: sóng lan về chiều +x (pha kx tăng theo x).' : S.k < 0 ? 'k < 0: sóng lan về chiều −x (pha tắt theo x tăng).' : 'k = 0: hạt đứng yên, E = 0.');
  }
};
LD.well = {
  intro: [
    ['i', 'Nhốt electron giữa hai vách thế vô hạn tại x=0 và x=a: sóng phải triệt tiêu tại hai đầu, nên chỉ có sóng dừng.'],
    ['w', 'Điều kiện biên: ψ(0) = 0 → loại cos; ψ(a) = 0 → sin(ka) = 0 → k = nπ/a (n nguyên dương).'],
    ['i', 'Hàm sóng: ψₙ(x) = √(2/a)·sin(nπx/a). Mức năng lượng: Eₙ = n²π²ħ²/(2ma²) ∝ n².'],
    ['w', 'Màu xanh dương: ψₙ(x) có đúng n bụng sóng. Nét đứt cam: |ψₙ|² – xác suất tìm hạt.'],
    ['v', 'Kéo n từ 1-4: số bụng bằng n, Eₙ = n²E₁. Kéo a: giếng hẹp → Eₙ tăng (∝ 1/a²).']
  ],
  react(S, k, P, say) {
    const E1 = E_well(1, S.a), En = E_well(S.n, S.a);
    say('v', `n=${S.n}, a=${S.a} Å → E₁=${E1.toFixed(3)} eV, E_${S.n}=${En.toFixed(3)} eV = ${S.n}²×E₁.`);
    if (k==='n') say('w', `n=${S.n}: có ${S.n} bụng sóng. Khoảng nút = a/${S.n}. Năng lượng bằng ${S.n}² lần E₁.`);
    else say('w', `a=${S.a} Å: E₁ ∝ 1/a² → tăng a thì mức gần nhau hơn (semiconductor quantum well thực tế ~100 Å).`);
  }
};
LD.tunnel = {
  intro: [
    ['i', 'Rào thế V₀ hữu hạn: hạt với E < V₀ không bị chặn hoàn toàn. Hàm sóng thấm vào rào dưới dạng e^{−κx} rồi xuất hiện bên kia.'],
    ['w', 'Hệ số truyền qua: T ≈ e^{−2κd} với κ = √(2m(V₀−E))/ħ. T tăng khi d giảm hoặc E tăng gần V₀.'],
    ['i', 'Ứng dụng thực tế: dòng rò qua SiO₂ trong transistor MOSFET, bộ nhớ Flash, diode tunnel (Esaki).'],
    ['w', 'Sóng vàng = sóng tới. Sóng cam = sóng phản xạ. Sóng xanh = sóng truyền qua. Nét đứt trong rào = sóng tắt dần.'],
    ['v', 'Kéo E gần V₀ hoặc giảm d để tăng T. T rất nhạy với d (mỗi nm giảm → T tăng vài bậc 10).']
  ],
  react(S, k, P, say) {
    const T = tunnelT(S.E, S.V0, S.d);
    const kap = S.E < S.V0 ? kOfE(S.E, S.V0).im : 0;
    say('v', `E=${S.E.toFixed(2)}, V₀=${S.V0.toFixed(1)} eV, d=${S.d.toFixed(1)} nm → T=${(T*100).toFixed(2)}%, R=${((1-T)*100).toFixed(2)}%.`);
    say('w', S.E >= S.V0 ? 'E ≥ V₀: hạt trên rào, T ≈ 1 (gần như qua hết).' : `E < V₀: κ = ${(kap*1e-9).toFixed(2)}×10⁹ m⁻¹. T ≈ e^{−2κd} = e^{${(-2*kap*S.d*1e-9).toFixed(1)}} = ${T.toFixed(4)}.`);
  }
};
LD.atom = {
  intro: [
    ['i', 'Hydrogen (1 electron): bài toán 3D. Nghiệm là ψ(r,θ,φ) = R_nl(r)·Y_l^{m_l}(θ,φ). Năng lượng Eₙ = −13.6/n² eV.'],
    ['w', 'Đám chấm = mật độ xác suất |ψ|²: nơi chấm dày là nơi hạt hay "ở". Orbital 1s: hình cầu đặc. 2p: hình tạ.'],
    ['i', 'P(r) = 4πr²|ψ|² (đường bên phải): cho biết xác suất tìm hạt ở khoảng cách r. Đỉnh P(r) là bán kính hay gặp nhất.'],
    ['w', '1s: Eₙ = −13.6 eV, r̄ ≈ 0.5 Å. 2s/2p: E = −3.4 eV. 3s/3p: E = −1.5 eV.'],
    ['v', 'Chuyển orbital để xem hình dạng và P(r) thay đổi. Orbital s: đối xứng cầu, P(r) có 1 đỉnh chính. Orbital p: hướng tính.']
  ],
  react(S, k, P, say) {
    const orb = ORBITALS[S.orb];
    if (!orb) return;
    const E_n = -13.6/(orb.n*orb.n);
    say('v', `Orbital ${S.orb}: n=${orb.n}, l=${orb.l}, m_l=${orb.ml}, Eₙ = ${E_n.toFixed(2)} eV.`);
    say('i', orb.l===0 ? 'l=0 (s): đối xứng cầu, hàm sóng không phụ thuộc hướng.' : 'l>0 (p,d,f): có hướng, hình dạng phức tạp hơn — quan trọng cho liên kết hóa học và bán dẫn hướng.');
  }
};
LD.qn = {
  intro: [
    ['i', 'Bốn số lượng tử: n (lớp vỏ, n≥1), l (phân lớp, 0≤l<n), m_l (hướng, −l≤m_l≤l), m_s (spin, ±½).'],
    ['w', 'Nguyên lý loại trừ Pauli: không có hai electron nào trong cùng nguyên tử chia sẻ cùng bộ bốn số lượng tử.'],
    ['i', 'Mỗi phân lớp nl chứa tối đa 2(2l+1) electron: s→2, p→6, d→10, f→14.'],
    ['w', 'Giản đồ bên trái: ô sáng là phân lớp đang chọn, ô tối là các phân lớp hợp lệ khác cho n đó.'],
    ['v', 'Thử n=2, l=2: sẽ thấy vi phạm (l phải < n). Thử m_l = 3 khi l=1: cũng vi phạm.']
  ],
  react(S, k, P, say) {
    const n=Math.round(S.n), l=Math.round(S.l), ml=Math.round(S.ml), ms=S.ms>0?0.5:-0.5;
    const ok_l = l>=0 && l<n, ok_ml = ml>=-l && ml<=l;
    if (!ok_l) say('v', `l=${l} vi phạm: với n=${n} thì l phải thuộc [0, ${n-1}].`);
    else if (!ok_ml) say('v', `m_l=${ml} vi phạm: với l=${l} thì m_l phải thuộc [−${l}, +${l}].`);
    else {
      say('v', `(n,l,m_l,m_s) = (${n},${l},${ml>=0?'+':''+(ml)},${ms>0?'+½':'−½'}) — hợp lệ.`);
      const sublabels = ['s','p','d','f'];
      say('w', `Phân lớp ${n}${sublabels[l]}: chứa tối đa ${2*(2*l+1)} electron. Spin ${ms>0?'↑ chiều dương':'↓ chiều âm'}.`);
    }
  }
};
LABS.forEach(l => { l.log = LD[l.id]; });

/* ==========================================================================
   KHUNG POPUP (tái sử dụng CSS giống lab-b7)
   ========================================================================== */
const CSS = `
#lab3{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62)}
#lab3[hidden]{display:none}
#lab3 *{box-sizing:border-box}
.lb3-win{width:95vw;height:95vh;height:95dvh;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--g);border-radius:var(--r);box-shadow:0 18px 60px rgba(0,0,0,.6);overflow:hidden}
.lb3-h{display:flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;background:var(--bg);border-bottom:1px solid var(--g);flex:none}
.lb3-h svg{width:16px;height:16px;display:block;margin:0;background:none;border:0;border-radius:0}
.lb3-ic{color:var(--main);display:flex}
.lb3-bd{font:500 12px/1 var(--font-logo);background:var(--main);color:var(--bg);padding:5px 8px;border-radius:5px;flex:none}
.lb3-tabs{display:flex;gap:2px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;margin-left:6px}
.lb3-tab{appearance:none;border:0;background:transparent;color:var(--mut);font:500 12.5px/1 var(--font-ui);padding:8px 10px;border-radius:6px;cursor:pointer;white-space:nowrap;flex:none;transition:color .15s,background .15s}
.lb3-tab:hover{color:var(--ink);background:var(--tint)}
.lb3-tab.on{background:var(--main);color:var(--bg);font-weight:700}
.lb3-x{appearance:none;border:0;background:transparent;color:var(--mut);width:28px;height:28px;border-radius:6px;cursor:pointer;font:400 20px/1 var(--font-ui);flex:none}
.lb3-x:hover{color:var(--err);background:var(--tint)}
.lb3-b{flex:1;min-height:0;display:grid;gap:8px;padding:8px}
.lb3-p{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--bg);border:1px solid var(--g);border-radius:var(--r);overflow:hidden;position:relative}
.lb3-p.glow{animation:lb3glow 1.4s ease-out}
@keyframes lb3glow{0%,60%{border-color:var(--main);box-shadow:0 0 0 2px var(--main)}100%{border-color:var(--g);box-shadow:none}}
.lb3-t{font:600 12px/1.2 var(--font-ui);color:var(--mut);padding:7px 10px 0;flex:none}
.lb3-cv{flex:1;min-height:0;position:relative}
.lb3-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.lb3-c{display:flex;flex-wrap:wrap;gap:6px 14px;padding:4px 10px 8px;flex:none;align-items:center}
.lb3-k{display:flex;align-items:center;gap:6px;font:500 11.5px/1 var(--font-ui);color:var(--mut)}
.lb3-k input[type=range]{width:clamp(70px,8vw,120px);margin:0}
.lb3-k output{color:var(--ink);font-weight:700;min-width:3.2em}
.lb3-seg{display:inline-flex;background:var(--tint);border-radius:6px;padding:2px;gap:2px}
.lb3-seg button,.lb3-btn{appearance:none;border:0;border-radius:5px;background:transparent;color:var(--mut);font:600 11.5px/1 var(--font-ui);padding:6px 9px;cursor:pointer}
.lb3-btn{background:var(--tint)}
.lb3-seg button:hover,.lb3-btn:hover{color:var(--ink)}
.lb3-seg button.on{background:var(--main);color:var(--bg)}
.lb3-log{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 12px;font:13.5px/1.55 var(--font-body)}
.lb3-ln{margin:0 0 9px;padding-left:18px;position:relative;animation:lb3in .4s ease-out;overflow-wrap:anywhere}
.lb3-ln::before{position:absolute;left:0;font-weight:700}
.lb3-ln.i{color:var(--ink)}.lb3-ln.i::before{content:'›';color:var(--c5)}
.lb3-ln.w{color:var(--ink)}.lb3-ln.w::before{content:'◆';color:var(--c2);font-size:10px;top:2px}
.lb3-ln.v{color:var(--main)}.lb3-ln.v::before{content:'=';color:var(--main)}
@keyframes lb3in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lab3-m{appearance:none;border:0;background:transparent;color:var(--sub);cursor:pointer;padding:2px 3px;margin-left:6px;border-radius:5px;vertical-align:middle;opacity:.65;line-height:0;transition:color .15s,opacity .15s,transform .15s}
.lab3-m svg{width:.8em;height:.8em;min-width:14px;min-height:14px;display:inline-block;margin:0;background:none;border:0;border-radius:0;max-height:none}
.lab3-m:hover,.lab3-m:focus-visible{color:var(--main);opacity:1;transform:rotate(-12deg) scale(1.15)}
@media(max-width:900px){.lb3-win{width:100vw;height:100dvh;border-radius:0}.lb3-b{overflow:auto;display:flex;flex-direction:column}.lb3-p{min-height:260px;flex:none}}
`;
const FLASK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h4M6.8 2v4.2L3 12.6A1.2 1.2 0 0 0 4 14.4h8a1.2 1.2 0 0 0 1-1.8L9.200 6.200V2"/><path d="M4.600 10h6.800"/></svg>';

const sty = document.createElement('style'); sty.textContent = CSS; document.head.appendChild(sty);
let timers = [], logEl = null;
let root, bodyEl, tabsEl, cur = null, curPanels = [], raf = 0, last = 0, tAcc = 0, opener = null, lastTab = 'free';

function ensureDom() {
  if (root) return;
  root = document.createElement('div'); root.id = 'lab3'; root.hidden = true;
  root.setAttribute('role','dialog'); root.setAttribute('aria-modal','true'); root.setAttribute('aria-label','Phòng thí nghiệm Buổi 3');
  root.innerHTML = '<div class="lb3-win"><div class="lb3-h"><span class="lb3-ic">'+FLASK+'</span><span class="lb3-bd">Phòng thí nghiệm · Buổi 3</span><nav class="lb3-tabs"></nav><button class="lb3-x" type="button" aria-label="Đóng (Esc)" title="Đóng (Esc)">×</button></div><div class="lb3-b"></div></div>';
  document.body.appendChild(root);
  bodyEl = root.querySelector('.lb3-b'); tabsEl = root.querySelector('.lb3-tabs');
  LABS.forEach(l => {
    const b = document.createElement('button'); b.type='button'; b.className='lb3-tab'; b.dataset.id=l.id;
    b.textContent = l.sec + ' · ' + l.name; b.onclick = () => show(l.id); tabsEl.appendChild(b);
  });
  root.querySelector('.lb3-x').onclick = close;
  root.addEventListener('mousedown', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', e => {
    if (root.hidden) {
      const ty = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey && !ty &&
          window.LabB3 && document.getElementById('tb-lab') && !document.getElementById('tb-lab').hidden &&
          (document.getElementById('tb-badge')||{}).textContent === 'Buổi 3') {
        e.preventDefault(); open();
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
}

const say = (kind, text) => {
  if (!logEl) return;
  const d = document.createElement('div'); d.className = 'lb3-ln ' + kind; d.textContent = text;
  logEl.appendChild(d);
  while (logEl.children.length > 60) logEl.removeChild(logEl.firstChild);
  logEl.scrollTop = logEl.scrollHeight;
};
const rt = {};
function queueReact(tab, k) {
  if (!tab.log || !tab.log.react) return; clearTimeout(rt[k]);
  rt[k] = setTimeout(() => { if (cur !== tab || !logEl) return; const P = tab.prev || {}; tab.log.react(tab.S, k, P, say); tab.prev = Object.assign({}, tab.S); }, 350);
}
function clearTimers() { timers.forEach(clearTimeout); timers = []; Object.keys(rt).forEach(k => clearTimeout(rt[k])); }

function mkCtrl(tab, c, p) {
  const S = tab.S, w = document.createElement('div');
  const touch = () => { curPanels.forEach(q => q.dirty = true); queueReact(tab, c.k); };
  if (c.btn) { w.className = 'lb3-btn'; w.textContent = c.btn; w.setAttribute('role','button'); w.tabIndex=0; w.onclick = () => c.fn(p); return w; }
  if (c.seg) {
    w.className = 'lb3-seg';
    c.seg.forEach(o => {
      const b = document.createElement('button'); b.type='button'; b.textContent = o[1]; b.className = S[c.k]===o[0]?'on':'';
      b.onclick = () => { S[c.k] = o[0]; if(c.set&&c.set[o[0]]) Object.assign(S,c.set[o[0]]); curPanels.forEach(q=>q.syncCtrls&&q.syncCtrls()); touch(); };
      w.appendChild(b);
    });
    p.syncs.push(() => { [...w.children].forEach((b,i) => b.classList.toggle('on', S[c.k]===c.seg[i][0])); });
    return w;
  }
  w.className = 'lb3-k';
  const lab = document.createElement('span'); lab.textContent = c.l;
  const inp = document.createElement('input'); inp.type='range'; inp.min=c.min; inp.max=c.max; inp.step=c.step;
  const out = document.createElement('output'); w.append(lab, inp, out);
  const sync = () => { inp.value = c.log ? Math.log10(S[c.k]) : S[c.k]; out.textContent = c.f(S[c.k]); };
  inp.oninput = () => { S[c.k] = c.log ? Math.pow(10,+inp.value) : +inp.value; out.textContent = c.f(S[c.k]); touch(); };
  inp.setAttribute('aria-label', c.l); p.syncs.push(sync); sync();
  return w;
}

function show(id, panelIdx) {
  const tab = LABS.find(l => l.id === id) || LABS[0]; cur = tab; lastTab = tab.id;
  clearTimers(); logEl = null; bodyEl.innerHTML = ''; curPanels = [];
  [...tabsEl.children].forEach(b => b.classList.toggle('on', b.dataset.id === tab.id));
  const mob = innerWidth <= 900;
  if (!mob) { bodyEl.style.display='grid'; bodyEl.style.gridTemplateColumns=tab.cols; bodyEl.style.gridTemplateRows=tab.rows; bodyEl.style.gridTemplateAreas=tab.areas; }
  else { bodyEl.style.display=''; bodyEl.style.gridTemplate=''; }
  tab.prev = Object.assign({}, tab.S);
  tab.panels.concat([{ title:'Nhật ký thí nghiệm', area:'l', log:true }]).forEach((spec, i) => {
    const el = document.createElement('div'); el.className='lb3-p'; if (!mob) el.style.gridArea=spec.area;
    el.innerHTML = '<div class="lb3-t"></div><div class="lb3-cv"><canvas></canvas></div>';
    el.firstChild.textContent = spec.title;
    if (spec.log) {
      const lg = document.createElement('div'); lg.className='lb3-log'; lg.setAttribute('aria-live','polite');
      el.replaceChild(lg, el.lastChild); logEl = lg; bodyEl.appendChild(el);
      curPanels.push({ el, dirty:false, spec, syncs:[] });
      (tab.log ? tab.log.intro : []).forEach((ln_, j) => timers.push(setTimeout(() => say(ln_[0], ln_[1]), 250 + j*900)));
      return;
    }
    const cv = el.querySelector('canvas'), box = el.querySelector('.lb3-cv');
    const p = { el, cv, ctx: cv && cv.getContext('2d'), W:0, H:0, tab, S:tab.S, st:{}, dirty:true, spec, syncs:[] };
    p.syncCtrls = () => p.syncs.forEach(f => f());
    if (spec.ctrls && spec.ctrls.length) { const cb=document.createElement('div'); cb.className='lb3-c'; spec.ctrls.forEach(c => cb.appendChild(mkCtrl(tab,c,p))); el.appendChild(cb); }
    bodyEl.appendChild(el); curPanels.push(p);
    new ResizeObserver(() => {
      const r = box.getBoundingClientRect(), d = Math.min(devicePixelRatio||1, 2); p.W=Math.max(10,r.width); p.H=Math.max(10,r.height);
      cv.width=Math.round(p.W*d); cv.height=Math.round(p.H*d); p.ctx.setTransform(d,0,0,d,0,0); p.dirty=true;
    }).observe(box);
  });
  if (panelIdx!=null && curPanels[panelIdx]) { const e=curPanels[panelIdx].el; e.classList.add('glow'); setTimeout(()=>e.classList.remove('glow'),1500); }
}

function loop(ts) {
  if (root.hidden) { raf=0; return; }
  const dt = Math.min(.04, (ts-last)/1000); last=ts; tAcc+=dt;
  curPanels.forEach(p => {
    if (!p.ctx || !p.W || !(p.spec.anim || p.dirty)) return; p.dirty=false;
    const ctx=p.ctx; ctx.clearRect(0,0,p.W,p.H); ctx.fillStyle=C.bg; ctx.fillRect(0,0,p.W,p.H);
    ctx.save(); p.spec.draw(p, ctx, p.W, p.H, tAcc, dt); ctx.restore();
  });
  raf = requestAnimationFrame(loop);
}

function open(id, panelIdx) {
  ensureDom(); readColors(); opener = document.activeElement;
  root.hidden=false; show(id||lastTab, panelIdx);
  last=performance.now(); if (!raf) raf=requestAnimationFrame(loop);
  root.querySelector('.lb3-x').focus({ preventScroll:true });
  const b=document.getElementById('tb-lab'); if(b){b.classList.add('on');b.setAttribute('aria-pressed','true');}
}
function close() {
  if (!root || root.hidden) return;
  root.hidden=true; clearTimers(); logEl=null; bodyEl.innerHTML=''; curPanels=[];
  const b=document.getElementById('tb-lab'); if(b){b.classList.remove('on');b.setAttribute('aria-pressed','false');}
  if (opener && opener.focus) opener.focus({ preventScroll:true });
}

/* ---------- dấu hiệu trong bài ---------- */
const H3MAP = [
  [/^1\.2/, 'free', 0], [/^1\.1/, 'free', 1],
  [/^2\.2/, 'well', 0], [/^2\.1/, 'well', 1],
  [/^3\.[34]/, 'tunnel', 0], [/^3\.[12]/, 'tunnel', 1],
  [/^4\.[12]/, 'atom', 0],
  [/^5\.[12]/, 'qn', 0]
];
function addMark(h, id, pi, title) {
  if (h.querySelector('.lab3-m')) return;
  const b = document.createElement('button'); b.type='button'; b.className='lab3-m'; b.innerHTML=FLASK;
  b.setAttribute('aria-label','Xem thí nghiệm: '+title); b.title='Xem thí nghiệm';
  b.onclick = e => { e.preventDefault(); e.stopPropagation(); open(id, pi); }; h.appendChild(b);
}
function markLesson(rootEl) {
  if (!rootEl) return;
  rootEl.querySelectorAll('h2').forEach(h => { const m=/^\s*(\d)\./.exec(h.textContent); if(!m) return; const l=LABS.find(x=>x.sec===+m[1]); if(l) addMark(h,l.id,null,l.name); });
  rootEl.querySelectorAll('h3').forEach(h => { const t=h.textContent.trim(); const r=H3MAP.find(x=>x[0].test(t)); if(r) addMark(h,r[1],r[2],t); });
}

if (document.getElementById('tb-badge') && document.getElementById('tb-badge').textContent === 'Buổi 3')
  markLesson(document.getElementById('app-content'));

window.LabB3 = { open, close, mark: markLesson, tabs: () => LABS.map(l => l.id) };
})();
