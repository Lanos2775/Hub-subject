/* ============================================================
   BẢNG TRA CÔNG THỨC FOURIER — file này là nơi duy nhất cần sửa khi chỉnh bảng.
   (Mở bằng phím H hoặc nút Σ trên thanh trên cùng.)

   Cú pháp (mỗi dòng một mục, gõ LaTeX bình thường, không cần nhân đôi dấu \):
     # Tiêu đề cột             bắt đầu một cột mới
     ## Tên thẻ :: phụ đề     bắt đầu một thẻ (phụ đề có thể bỏ trống)
     = công thức               khung công thức nổi bật; dùng <br> để xuống dòng
     widths: 28% 34%           độ rộng các cột đầu của bảng (cột cuối tự giãn) — tuỳ chọn
     head: Cột 1 :: Cột 2      dòng tiêu đề bảng; các ô cách nhau bằng dấu  ::
     ô 1 :: ô 2 :: ô 3         mỗi dòng còn lại là một hàng của bảng
     // ghi chú                dòng bị bỏ qua
   ============================================================ */
window.FORMULA_SHEET = String.raw`
# FOURIER LIÊN TỤC: FT & FS

## FT / TÍNH CHẤT :: $\omega = 2\pi f$
= $X(\omega) = \int_{-\infty}^{\infty} x(t)e^{-j\omega t}dt \qquad x(t) = \frac{1}{2\pi}\int_{-\infty}^{\infty} X(\omega)e^{j\omega t}d\omega$
widths: 28% 34%
head: Quy tắc :: Tín hiệu $x(t)$ :: Biến đổi $X(\omega)$
Tuyến tính :: $a_1 x_1(t) + a_2 x_2(t)$ :: $a_1 X_1(\omega) + a_2 X_2(\omega)$
Dịch thời gian :: $x(t - t_0)$ :: $e^{-j\omega t_0}X(\omega)$
Dịch tần số :: $e^{j\omega_0 t}x(t)$ :: $X(\omega - \omega_0)$
Co giãn :: $x(at), \ a \neq 0$ :: $\frac{1}{|a|}X(\omega/a)$
Đảo thời gian :: $x(-t)$ :: $X(-\omega)$
Liên hợp :: $x^*(t)$ :: $X^*(-\omega)$
Đối ngẫu :: $X(t)$ :: $2\pi x(-\omega)$
Đạo hàm :: $x^{(m)}(t)$ :: $(j\omega)^m X(\omega)$
Nhân với $t^m$ :: $t^m x(t)$ :: $j^m \frac{d^m X(\omega)}{d\omega^m}$
Tích phân :: $\int_{-\infty}^t x(\tau)d\tau$ :: $\text{PV}\frac{X(\omega)}{j\omega} + \pi X(0)\delta(\omega)$
Tích chập :: $x_1(t) * x_2(t)$ :: $X_1(\omega)X_2(\omega)$
Nhân tín hiệu :: $x_1(t)x_2(t)$ :: $\frac{1}{2\pi}(X_1 * X_2)(\omega)$
Tín hiệu thực :: $x(t) \in \mathbb{R}$ :: $X(-\omega) = X^*(\omega)$
Chẵn / lẻ :: $x_e(t) \ / \ x_o(t)$ :: $\text{Re}X(\omega) \ / \ j\text{Im}X(\omega)$
Parseval :: $\int_{-\infty}^{\infty} |x(t)|^2 dt$ :: $\frac{1}{2\pi}\int_{-\infty}^{\infty} |X(\omega)|^2 d\omega$

## FT / CẶP BIẾN ĐỔI :: $u$: bước đơn vị; $\delta$: Dirac
widths: 45%
head: Tín hiệu $x(t)$ :: Biến đổi $X(\omega)$
$\delta(t)$ :: $1$
$\delta(t - t_0)$ :: $e^{-j\omega t_0}$
$1$ :: $2\pi\delta(\omega)$
$e^{j\omega_0 t}$ :: $2\pi\delta(\omega - \omega_0)$
$\cos(\omega_0 t)$ :: $\pi[\delta(\omega - \omega_0) + \delta(\omega + \omega_0)]$
$\sin(\omega_0 t)$ :: $\frac{\pi}{j}[\delta(\omega - \omega_0) - \delta(\omega + \omega_0)]$
$u(t)$ :: $\pi\delta(\omega) + \text{PV}\frac{1}{j\omega}$
$e^{-at}u(t), \ a > 0$ :: $\frac{1}{a + j\omega}$
$te^{-at}u(t), \ a > 0$ :: $\frac{1}{(a + j\omega)^2}$
$e^{-a|t|}, \ a > 0$ :: $\frac{2a}{a^2 + \omega^2}$
$e^{-at^2}, \ a > 0$ :: $\sqrt{\frac{\pi}{a}}e^{-\omega^2/(4a)}$
$1_{|t| < a}$ :: $\frac{2\sin(a\omega)}{\omega}$
$\sin(at)/(\pi t)$ :: $1_{|\omega| < a}$

## FS / TÍN HIỆU TUẦN HOÀN :: $\omega_0 = 2\pi / T_0$
= $x(t) = \sum_{k=-\infty}^{\infty} c_k e^{jk\omega_0 t} \qquad c_k = \frac{1}{T_0}\int_{T_0} x(t)e^{-jk\omega_0 t}dt$
widths: 30%
head: Nội dung :: Công thức
Dạng lượng giác :: $x(t) = \frac{a_0}{2} + \sum_{k \ge 1}[a_k \cos(k\omega_0 t) + b_k \sin(k\omega_0 t)]$
Hệ số $a_0$ :: $a_0 = \frac{2}{T_0}\int_{T_0} x(t)dt$
Hệ số $a_k, \ b_k$ :: $a_k = \frac{2}{T_0}\int_{T_0} x(t)\cos(k\omega_0 t)dt; \quad b_k = \frac{2}{T_0}\int_{T_0} x(t)\sin(k\omega_0 t)dt$
Quan hệ hệ số :: $c_0 = a_0/2; \quad c_{\pm k} = (a_k \mp jb_k)/2$
Dịch thời gian :: $x(t - t_0) \longleftrightarrow c_k e^{-jk\omega_0 t_0}$
Thực / chẵn / lẻ :: $c_{-k} = c_k^*; \quad \text{chẵn: } b_k = 0; \quad \text{lẻ: } a_0 = a_k = 0$
Parseval :: $\frac{1}{T_0}\int_{T_0} |x(t)|^2 dt = \sum_k |c_k|^2$

# FOURIER RỜI RẠC & HỆ LTI: DTFT & DTFS

## DTFT / TÍNH CHẤT :: $\Omega$ [rad/mẫu], chu kỳ $2\pi$
= $X(\Omega) = \sum_{n=-\infty}^{\infty} x[n]e^{-j\Omega n} \qquad x[n] = \frac{1}{2\pi}\int_{-\pi}^{\pi} X(\Omega)e^{j\Omega n}d\Omega$
widths: 28% 34%
head: Quy tắc :: Tín hiệu $x[n]$ :: DTFT $X(\Omega)$
Tuyến tính :: $a_1 x_1[n] + a_2 x_2[n]$ :: $a_1 X_1(\Omega) + a_2 X_2(\Omega)$
Phổ tuần hoàn :: $x[n]$ :: $X(\Omega + 2\pi) = X(\Omega)$
Dịch thời gian :: $x[n - n_0]$ :: $e^{-j\Omega n_0}X(\Omega)$
Dịch tần số :: $e^{j\Omega_0 n}x[n]$ :: $X(\Omega - \Omega_0)$
Đảo thời gian :: $x[-n]$ :: $X(-\Omega)$
Liên hợp :: $x^*[n]$ :: $X^*(-\Omega)$
Chèn số 0 :: $y[mn] = x[n]$ (còn lại $0$) :: $Y(\Omega) = X(m\Omega)$
Nhân với $n^m$ :: $n^m x[n]$ :: $j^m \frac{d^m X(\Omega)}{d\Omega^m}$
Sai phân :: $x[n] - x[n-1]$ :: $(1 - e^{-j\Omega})X(\Omega)$
Tích chập :: $x_1[n] * x_2[n]$ :: $X_1(\Omega)X_2(\Omega)$
Nhân tín hiệu :: $x_1[n]x_2[n]$ :: $\frac{1}{2\pi}\int_{-\pi}^{\pi} X_1(\theta)X_2(\Omega - \theta)d\theta$
Tín hiệu thực :: $x[n] \in \mathbb{R}$ :: $X(-\Omega) = X^*(\Omega)$
Chẵn / lẻ :: $x_e[n] \ / \ x_o[n]$ :: $\text{Re}X(\Omega) \ / \ j\text{Im}X(\Omega)$
Parseval :: $\sum_n |x[n]|^2$ :: $\frac{1}{2\pi}\int_{-\pi}^{\pi} |X(\Omega)|^2 d\Omega$

## DTFT / CẶP BIẾN ĐỔI :: $D(\Omega) = \sum_k \delta(\Omega - 2\pi k)$
widths: 45%
head: Tín hiệu $x[n]$ :: Biến đổi $X(\Omega)$
$\delta[n]$ :: $1$
$\delta[n - n_0]$ :: $e^{-j\Omega n_0}$
$1$ :: $2\pi D(\Omega)$
$e^{j\Omega_0 n}$ :: $2\pi D(\Omega - \Omega_0)$
$\cos(\Omega_0 n)$ :: $\pi[D(\Omega - \Omega_0) + D(\Omega + \Omega_0)]$
$\sin(\Omega_0 n)$ :: $\frac{\pi}{j}[D(\Omega - \Omega_0) - D(\Omega + \Omega_0)]$
$u[n]$ :: $\text{PV}\frac{1}{1 - e^{-j\Omega}} + \pi D(\Omega)$
$a^n u[n], \ |a| < 1$ :: $\frac{1}{1 - ae^{-j\Omega}}$
$-a^n u[-n-1], \ |a| > 1$ :: $\frac{1}{1 - ae^{-j\Omega}}$
$(n+1)a^n u[n]$ :: $\frac{1}{(1 - ae^{-j\Omega})^2}$
$a^{|n|}, \ |a| < 1$ :: $\frac{1 - a^2}{1 - 2a\cos\Omega + a^2}$
$1_{|n| \le M}$ :: $\frac{\sin[(M + 1/2)\Omega]}{\sin(\Omega/2)}$
$\sin(Wn)/(\pi n), \ x[0]=W/\pi$ :: $1_{|\Omega| < W}, \ 0 < W < \pi$

## DTFS / CHUỖI TUẦN HOÀN :: $\Omega_0 = 2\pi / N_0$
= $x[n] = \sum_{k=0}^{N_0-1} c_k e^{jk\Omega_0 n} \qquad c_k = \frac{1}{N_0}\sum_{n=0}^{N_0-1} x[n]e^{-jk\Omega_0 n}$
widths: 30%
head: Nội dung :: Công thức
Tuần hoàn :: $x[n + N_0] = x[n], \quad c_{k+N_0} = c_k$
Giá trị trung bình :: $c_0 = \frac{1}{N_0}\sum_{n=0}^{N_0-1} x[n]$
Chuỗi thực :: $c_{-k} = c_{N_0-k} = c_k^*$
Chẵn / lẻ :: $x_e[n] \longleftrightarrow \text{Re}c_k; \quad x_o[n] \longleftrightarrow j\text{Im}c_k$
Đối ngẫu :: $c_n \longleftrightarrow \frac{1}{N_0}x[-k]$
Dịch thời gian :: $x[n - n_0] \longleftrightarrow c_k e^{-jk\Omega_0 n_0}$
Parseval :: $\frac{1}{N_0}\sum_{n=0}^{N_0-1} |x[n]|^2 = \sum_{k=0}^{N_0-1} |c_k|^2$

## HỆ LTI / TẦN SỐ :: $H$ là biến đổi Fourier của $h$
= $y(t) = x(t)*h(t) \iff Y(\omega) = X(\omega)H(\omega)$ <br> $y[n] = x[n]*h[n] \iff Y(\Omega) = X(\Omega)H(\Omega)$
= $H(\Omega) = \dfrac{\sum_{m=0}^M b_m e^{-jm\Omega}}{\sum_{r=0}^R a_r e^{-jr\Omega}} \quad \text{nếu} \quad \sum_{r=0}^R a_r y[n-r] = \sum_{m=0}^M b_m x[n-m]$
`;
