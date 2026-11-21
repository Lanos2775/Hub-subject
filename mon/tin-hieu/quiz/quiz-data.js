/* ============================================================
   DỮ LIỆU QUIZ — file này là nơi duy nhất cần sửa khi thêm / bớt / chỉnh câu hỏi.

   Mỗi câu hỏi:
     id   : 'chương-số câu' (duy nhất, cũng là tên file ảnh)
     t    : số chương (khớp với topics bên dưới)      n : số thứ tự trong chương
     k    : loại câu  'mc' (chọn 1) | 'multi' (chọn nhiều) | 'num' (nhập số) | 'yn' (Có/Không)
     c    : (mc) số phương án            l : (multi) danh sách phương án
     a    : đáp án — mc/yn: số thứ tự từ 1; multi: mảng chỉ số từ 0; num: số
     d    : (num, yn) đáp án dạng chữ để hiển thị khi làm sai
     im   : ảnh đề [['tên-file', rộng-hiển-thị, cao-hiển-thị], ...] — file nằm trong imgDir
     e    : lời giải (HTML + LaTeX). Dùng r`...` nên gõ \frac, \int... bình thường,
            không cần nhân đôi dấu gạch chéo.
   ============================================================ */
(() => {
  const r = String.raw;
  window.QUIZ_DATA = {
  imgDir: 'quiz/img/',   // thư mục ảnh, tính từ tin-hieu.html
  topics: [
    { id: 1, name: "Định nghĩa hệ thống" },
    { id: 2, name: "Năng lượng và công suất" },
    { id: 3, name: "Phép toán trên tín hiệu" },
    { id: 4, name: "Tín hiệu tuần hoàn" },
    { id: 5, name: "Phương trình vi phân / sai phân" },
    { id: 6, name: "Biến đổi và chuỗi Fourier" },
    { id: 7, name: "Biến đổi Fourier ngược" },
    { id: 8, name: "Đáp ứng tần số" },
    { id: 9, name: "Đồ thị phổ tín hiệu" }
  ],
  questions: [
    {
      id: '1-1', t: 1, n: 1, k: 'mc', c: 4, a: 1,
      im: [['1-1.webp', 447, 256]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1 — $y(t) + y'(t) = x(t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Muốn chọn một hệ đồng thời tuyến tính, bất biến theo thời gian và nhân quả, phải kiểm tra CẢ BA điều kiện, không chỉ nhận ra “phương trình vi phân”. Tuyến tính cần điều kiện đầu bằng 0 (trạng thái nghỉ); bất biến đòi hỏi dịch đầu vào τ thì đầu ra dịch τ; nhân quả đòi hỏi $y(t_{0})$ không phụ thuộc $x$ ở thời điểm $>t_{0}$.</p>
<p>Phương án 1: $y'(t)+y(t)=x(t)$. Với hai cặp $(x_{1},y_{1})$, $(x_{2},y_{2})$, đặt $z=ay_{1}+by_{2}$ thì $z'+z=a(y_{1}'+y_{1})+b(y_{2}'+y_{2})=ax_{1}+bx_{2}$. Điều đó chứng minh chồng chất, tức tuyến tính.</p>
<p>Kiểm tra bất biến PA1: đặt $\tilde{x}(t)=x(t-\tau )$, $\tilde{y}(t)=y(t-\tau )$. Khi đó $\tilde{y}'(t)+\tilde{y}(t)=y'(t-\tau )+y(t-\tau )=x(t-\tau )=\tilde{x}(t)$; cùng một phương trình, nên bất biến (khi trạng thái đầu được dịch nhất quán).</p>
<p>Kiểm tra nhân quả PA1: với trạng thái nghỉ, $y(t)=\int_{-\infty}^t e^{-(t-s)}x(s)ds$. Cận trên là $t$, nên giá trị $y(t)$ chỉ cần $x(s)$ với $s\le t$; không cần $x(t+\varepsilon )$. Kết luận PA1 thỏa cả ba.</p>
<p>Phương án 2: $y[n]+y[n-1]=x[n]+x[n+1]$. Phương trình có hệ số hằng, phép cộng tuyến tính → tuyến tính và bất biến khi quy ước đáp ứng trạng thái nghỉ. Nhưng vế phải xuất hiện $x[n+1]$. Chọn hai đầu vào giống nhau đến $n$ nhưng khác tại n+1: giá trị $y[n]$ thay đổi → KHÔNG nhân quả.</p>
<p>Phương án 3: $y[n]+y[n-1]=x[n]^{2}$. Lấy $x_{1}[n]=x_{2}[n]=\delta [n]$. Hai tín hiệu riêng đều sinh vế phải $\delta [n]$, tổng đầu vào $2\delta [n]$ lại sinh $(2\delta [n])^{2}=4\delta [n]$, không bằng $2\delta [n]$. Vi phạm tính cộng → KHÔNG tuyến tính, dù cấu trúc có hệ số hằng và chỉ dùng hiện tại.</p>
<p>Phương án 4: $y'(t)+y(t)=t\cdot x(t)$. Nếu dời đầu vào τ, vế phải là $t x(t-\tau )$; còn dời lời giải cũ thì vế phải $(t-\tau )x(t-\tau )$. Hai giá trị khác nhau khi $\tau \neq 0$. Vậy tuyến tính và nhân quả (với trạng thái nghỉ), nhưng KHÔNG bất biến.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $y'+y=x$</b> — Chồng chất được chứng minh bằng đạo hàm tuyến tính; dịch cả vào/ra không đổi hệ số; công thức tích phân $y(t)$ chỉ dùng $s\le t$.</li>
<li><span class="vd qbad">SAI</span><b>2. $y[n]+y[n-1]=x[n]+x[n+1]$</b> — Tuyến tính, bất biến nhưng đọc mẫu tương lai $x[n+1]$ để tạo $y[n]$; vì thế không nhân quả.</li>
<li><span class="vd qbad">SAI</span><b>3. $y[n]+y[n-1]=x[n]^{2}$</b> — Bình phương phá tính chồng chất: $H\{2x\}$ không bằng $2H\{x\}$.</li>
<li><span class="vd qbad">SAI</span><b>4. $y'+y=t\cdot x$</b> — Hệ số $t$ làm mất tính bất biến thời gian, dù toán tử vẫn tuyến tính.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Thử “phản ví dụ nhanh”: lấy $x(t)=1$ và dịch $\tau =1$ cho PA4 → 2 vế có nhân tử $t$ và t−1; lấy $x_{1}=x_{2}=\delta$ cho PA3 → 4 khác 2. Chỉ PA1 không mắc lỗi nào.</div>
<div class="qcheck" style="border-left-color:var(--c4)"><b>Lưu ý quan trọng:</b> Với phương trình có trạng thái đầu không bằng 0 và giữ cố định khi đổi đầu vào, tính tuyến tính/ bất biến có thể thay đổi. Ở quiz, ta dùng quy ước xét hệ ở trạng thái nghỉ (zero state).</div>
`
    },
    {
      id: '1-2', t: 1, n: 2, k: 'multi', a: [0, 3, 4],
      l: ["Nhân quả", "Không cần bộ nhớ", "Tuyến tính", "Ổn định", "Bất biến"],
      im: [['1-2.webp', 802, 309]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Chọn: Nhân quả, Ổn định, Bất biến.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y(t)=|x(t-1)|$. Trước tiên ghi rõ hệ đọc mẫu ở thời điểm t−1 (trễ 1), sau đó xét từng thuộc tính.</p>
<p>Không nhớ? Không: để tìm $y(5)$ phải biết $x(4)$, không chỉ $x(5)$. Có thể chọn $x_{1}(5)=x_{2}(5)=0$ nhưng $x_{1}(4)=1$, $x_{2}(4)=2 \to y_{1}(5)\neq y_{2}(5)$.</p>
<p>Nhân quả? Có: $t-1\le t$ với mọi $t$. Nếu hai đầu vào trùng nhau trước hoặc đúng thời điểm $t$, chúng có cùng $x(t-1)$, nên cùng $y(t)$.</p>
<p>Tuyến tính? Không. Lấy $x(t)=1$: $H\{x\}=1$ nhưng $H\{-x\}=1\neq -1=-H\{x\}$; tính thuần nhất đã sai.</p>
<p>BIBO? Có: nếu mọi $t$, $|x(t)|\le M$ thì $|y(t)|=||x(t-1)||=|x(t-1)|\le M$. Đã tìm được một cận hữu hạn cho đầu ra.</p>
<p>Bất biến? Có: $H\{x(t-\tau )\}=|x(t-1-\tau )|$; trong khi $y(t-\tau )=|x((t-\tau )-1)|$, hai biểu thức bằng nhau.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Nhân quả</b> — Chỉ phụ thuộc quá khứ t−1.</li>
<li><span class="vd qbad">KHÔNG</span><b>Không cần bộ nhớ</b> — Cần giá trị $x(t-1)$, không chỉ $x(t)$.</li>
<li><span class="vd qbad">KHÔNG</span><b>Tuyến tính</b> — $|-x|=|x|$ nhưng −|x| khác |x| nếu $x\neq 0$.</li>
<li><span class="vd qok">CHỌN</span><b>Ổn định</b> — $|x|\le M$ kéo theo $|y|\le M$.</li>
<li><span class="vd qok">CHỌN</span><b>Bất biến</b> — Hai biểu thức sau dịch đều bằng $|x(t-\tau -1)|$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Nhớ: hàm trị tuyệt đối làm phi tuyến nhưng KHÔNG tự động làm hệ mất nhân quả, bất biến hoặc ổn định.</div>
`
    },
    {
      id: '1-3', t: 1, n: 3, k: 'multi', a: [0, 1],
      l: ["Nhân quả", "Tuyến tính", "Không cần bộ nhớ", "Bất biến", "Ổn định"],
      im: [['1-3.webp', 825, 80], ['1-3b.webp', 825, 220]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Chọn: Nhân quả, Tuyến tính.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]=2^{-n}x[n-1]$. Hệ nhân đầu vào quá khứ với trọng số phụ thuộc chính $n$.</p>
<p>Tuyến tính: $H\{ax_{1}+bx_{2}\}[n]=2^{-n}(ax_{1}[n-1]+bx_{2}[n-1])=aH\{x_{1}\}[n]+bH\{x_{2}\}[n]$.</p>
<p>Nhân quả: $n-1\le n$. Không cần $x[n+1]$ hay mẫu tương lai.</p>
<p>Không nhớ? Sai vì $y[n]$ phụ thuộc $x[n-1]$. Cho hai đầu vào cùng $x[n]$ nhưng khác $x[n-1]$ thì $y[n]$ khác.</p>
<p>Bất biến? Lấy $x\tau [n]=x[n-m]$. Khi đó $H\{x\tau \}[n]=2^{-n}x[n-m-1]$, còn $y[n-m]=2^{-n+m}x[n-m-1]$. Với $m=1$, $2^{-n}\neq 2^{-n+1}$.</p>
<p>Ổn định? Chọn $x[n]=1$ (bị chặn $M=1)$. Khi $n=-k\to -\infty$ thì $y[-k]=2^{k}\to \infty$. Do đó có đầu vào bị chặn cho đầu ra không bị chặn → không BIBO.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Nhân quả</b> — Đọc $x[n-1]$ ở quá khứ.</li>
<li><span class="vd qok">CHỌN</span><b>Tuyến tính</b> — Hệ số $2^{-n}$ nhân phân phối theo a,b.</li>
<li><span class="vd qbad">KHÔNG</span><b>Không cần bộ nhớ</b> — Có độ trễ 1 mẫu.</li>
<li><span class="vd qbad">KHÔNG</span><b>Bất biến</b> — Dịch 1 mẫu làm hệ số đổi từ $2^{-n}$ sang $2^{-n+1}$.</li>
<li><span class="vd qbad">KHÔNG</span><b>Ổn định</b> — $x[n]=1 \implies y[n]=2^{-n}$ không bị chặn khi $n\to -\infty$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Nếu chỉ xét $n\ge 0$ có thể đưa ra kết luận BIBO khác; trong bài phân loại hệ hai phía $n\in \mathbb{Z}$ nên phải kiểm tra toàn trục.</div>
`
    },
    {
      id: '1-4', t: 1, n: 4, k: 'multi', a: [0, 1, 2],
      l: ["Nhân quả", "Tuyến tính", "Ổn định", "Không cần bộ nhớ", "Bất biến"],
      im: [['1-4.webp', 782, 309]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Chọn: Nhân quả, Tuyến tính, Ổn định.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]=x[-|n|]$. Để hiểu chỉ số khó, tách $-|n|=n$ nếu n&lt;0, và $-|n|=-n$ nếu $n\ge 0$.</p>
<p>Nhân quả: nếu n&lt;0, đọc đúng $x[n]$; nếu $n\ge 0$, đọc $x[-n]$ với $-n\le n$. Vậy không lúc nào đòi mẫu tương lai.</p>
<p>Không nhớ? Sai: tại $n=2$, $y[2]=x[-2]$, không nhất thiết bằng $x[2]$.</p>
<p>Tuyến tính: $y$ của $ax_{1}+bx_{2}$ là $ax_{1}[-|n|]+bx_{2}[-|n|]$, bằng $aH\{x_{1}\}+bH\{x_{2}\}$.</p>
<p>Ổn định: giả sử $|x[k]|\le M$ ở mọi $k$, do −|n| chỉ là một chỉ số nguyên nên $|y[n]|=|x[-|n|]|\le M$.</p>
<p>Bất biến? Phản ví dụ chọn $x[n]=\delta [n]$, đầu ra $y[n]=\delta [-|n|]=\delta [n]$. Dịch đầu vào 1 mẫu thành $\delta [n-1]$, hệ mới cho $\delta [-|n|-1]=0$ với mọi $n$, trong khi dịch đầu ra cũ phải là $\delta [n-1]\neq 0$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Nhân quả</b> — $-|n|\le n$ cho mọi $n$.</li>
<li><span class="vd qok">CHỌN</span><b>Tuyến tính</b> — Chọn lại vị trí mẫu không làm mất tính chồng chất.</li>
<li><span class="vd qok">CHỌN</span><b>Ổn định</b> — $|y[n]|\le sup_{k}|x[k]|$.</li>
<li><span class="vd qbad">KHÔNG</span><b>Không cần bộ nhớ</b> — $n=2$ cần mẫu −2.</li>
<li><span class="vd qbad">KHÔNG</span><b>Bất biến</b> — Đầu vào $\delta [n-1]$ tạo đầu ra 0, không phải $\delta [n-1]$.</li>
</ul>
`
    },
    {
      id: '1-5', t: 1, n: 5, k: 'multi', a: [0, 1, 2],
      l: ["Nhân quả", "Bất biến", "Ổn định", "Không cần bộ nhớ", "Tuyến tính"],
      im: [['1-5.webp', 774, 316]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Chọn: Nhân quả, Bất biến, Ổn định.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]=2^{x[n-1]}$. Trước hết nhìn chỉ số n−1, sau đó phân biệt phép biến đổi giá trị đầu vào (hàm mũ) với phép dịch trục thời gian.</p>
<p>Nhân quả: chỉ đọc $x[n-1]$, nên có. Không nhớ: không, vì $n-1\neq n$.</p>
<p>Tuyến tính: chọn $x[n]=0$ với mọi $n. H\{0\}=2^{0}=1\neq 0$, vi phạm điều kiện cần của tuyến tính. Không cần thử tổng phức tạp.</p>
<p>Bất biến: $H\{x[n-m]\}=2^{x[n-m-1]}$, còn $y[n-m]=2^{x[(n-m)-1]}$; hai biểu thức đúng bằng nhau.</p>
<p>Ổn định BIBO: nếu $|x[n]|\le M$, suy ra $-M\le x[n-1]\le M$ (giả sử tín hiệu thực); hàm mũ $2^{z}$ tăng theo $z$, nên $2^{-M}\le y[n]\le 2^{M}$. Đầu ra có cận hữu hạn $2^{M}$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Nhân quả</b> — Cần một mẫu quá khứ.</li>
<li><span class="vd qok">CHỌN</span><b>Bất biến</b> — Dịch đầu vào bao nhiêu thì n−1 dịch đúng bấy nhiêu.</li>
<li><span class="vd qok">CHỌN</span><b>Ổn định</b> — Đầu vào bị chặn bởi $M \implies 0<y\le 2^{M}$.</li>
<li><span class="vd qbad">KHÔNG</span><b>Không cần bộ nhớ</b> — Lệ thuộc $x[n-1]$.</li>
<li><span class="vd qbad">KHÔNG</span><b>Tuyến tính</b> — $H\{0\}=1$ nên không tuyến tính.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Nếu đề cho tín hiệu phức, cần xét định nghĩa hệ số mũ phức riêng; ở đây áp dụng tín hiệu thực như trong học phần.</div>
`
    },
    {
      id: '1-6', t: 1, n: 6, k: 'multi', a: [0, 1],
      l: ["Tuyến tính", "Ổn định", "Không cần bộ nhớ", "Nhân quả", "Bất biến"],
      im: [['1-6.webp', 790, 30], ['1-6b.webp', 790, 274]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Chọn: Tuyến tính, Ổn định.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y(t)=x(1-t)$. Đây là phép đảo thời gian rồi dịch, không phải phép nhân âm biên độ.</p>
<p>Tuyến tính: $H\{ax_{1}+bx_{2}\}(t)=(ax_{1}+bx_{2})(1-t)=ax_{1}(1-t)+bx_{2}(1-t)$.</p>
<p>Ổn định: nếu $|x(s)|\le M$ với mọi $s$ thì $|x(1-t)|\le M$ với mọi $t$; hệ không làm tăng biên độ.</p>
<p>Nhân quả? Lấy $t=0$: $y(0)=x(1)$, trong đó $x(1)$ nằm ở tương lai so với $t=0 \implies$ không nhân quả.</p>
<p>Không nhớ? Lấy $t=0$: $y(0)=x(1)$, khác $x(0)$, nên có nhớ.</p>
<p>Bất biến? Với tín hiệu dịch τ: $H\{x(t-\tau )\}=x(1-t-\tau )$, nhưng $y(t-\tau )=x(1-t+\tau )$. Chọn $\tau =1$ và $x(t)=t$ thì hai giá trị khác nhau ⇒ không bất biến.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Tuyến tính</b> — Có đẳng thức chồng chất.</li>
<li><span class="vd qok">CHỌN</span><b>Ổn định</b> — Đổi trục thời gian không đổi cận biên độ.</li>
<li><span class="vd qbad">KHÔNG</span><b>Không cần bộ nhớ</b> — $y(0)$ cần $x(1)$.</li>
<li><span class="vd qbad">KHÔNG</span><b>Nhân quả</b> — $y(0)$ dùng $x$ tương lai tại 1.</li>
<li><span class="vd qbad">KHÔNG</span><b>Bất biến</b> — Dịch $x$ gây đối số 1−t−τ, khác 1−t+τ.</li>
</ul>
`
    },
    {
      id: '1-7', t: 1, n: 7, k: 'multi', a: [0, 1, 2],
      l: ["Không cần bộ nhớ", "Nhân quả", "Bất biến", "Tuyến tính", "Ổn định"],
      im: [['1-7.webp', 814, 311]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Chọn: Không cần bộ nhớ, Nhân quả, Bất biến.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y(t)=log_{10}|x(t)|$. Miền xác định chỉ gồm $x(t)\neq 0$; khi $x=0$ hàm log không xác định, cần nói rõ vấn đề này.</p>
<p>Không nhớ: tại thời điểm $t$, chỉ đọc $x(t)$. Nhân quả: vì không cần giá trị sau $t$ nên cũng có.</p>
<p>Bất biến: $H\{x(t-\tau )\}=log_{10}|x(t-\tau )|=y(t-\tau )$; không có $t$ riêng ở biểu thức.</p>
<p>Tuyến tính? Chọn $x(t)=1$: $y(t)=0$, nhưng đầu vào 10 cho $y=1$, không bằng 10·0; vì thế không thuần nhất.</p>
<p>Ổn định BIBO? Xét $x(t)=1/(1+t^{2})$, dương và $\le 1$ ở mọi $t$. Khi đó $y(t)=-log_{10}(1+t^{2})\to -\infty$ khi $|t|\to \infty$. Có đầu vào bị chặn cho đầu ra không bị chặn, nên không ổn định.</p>
<p>Ngoài ra ngay cả đầu vào $x(t)=0$ cũng thuộc lớp tín hiệu bị chặn nhưng hệ không được định nghĩa. Điều này củng cố cảnh báo về miền xác định, không được tự ý kết luận BIBO.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Không cần bộ nhớ</b> — Chỉ dùng $x(t)$.</li>
<li><span class="vd qok">CHỌN</span><b>Nhân quả</b> — Không cần tương lai.</li>
<li><span class="vd qok">CHỌN</span><b>Bất biến</b> — Dịch thời gian đi qua log đúng như nhau.</li>
<li><span class="vd qbad">KHÔNG</span><b>Tuyến tính</b> — $log_{10}(10\cdot 1)=1 \neq 10\cdot log_{10}(1)=0$.</li>
<li><span class="vd qbad">KHÔNG</span><b>Ổn định</b> — $x=1/(1+t^{2})$ bị chặn còn $y\to -\infty$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Miền xác định $x(t)\neq 0$ cần được nêu khi trình bày đáp án: nếu yêu cầu hệ trên tất cả đầu vào, chính đề thiếu điều kiện.</div>
`
    },
    {
      id: '1-8', t: 1, n: 8, k: 'multi', a: [0, 1, 2],
      l: ["Không cần bộ nhớ", "Nhân quả", "Ổn định", "Tuyến tính", "Bất biến"],
      im: [['1-8.webp', 850, 308]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Chọn: Không cần bộ nhớ, Nhân quả, Ổn định.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y(t)=\sin (x(t))u(-t)$. Nhận biết $u(-t)=1$ khi t&lt;0 và bằng 0 khi t&gt;0, tức là có “công tắc” gắn mốc $t=0$.</p>
<p>Không nhớ: tại $t$ chỉ cần $x(t)$ và biết mốc $t$ hiện tại, không cần $x$ ở thời điểm khác. Nhân quả: tất nhiên không cần tương lai.</p>
<p>Ổn định: $|\sin (x(t))|\le 1$ với $x$ thực, $|u(-t)|\le 1$, vậy $|y(t)|\le 1$ dù $x$ có bị chặn hay không.</p>
<p>Tuyến tính: với $x(t)=\frac{\pi }{2}$, $H\{x\}=u(-t)$; với $2x(t)=\pi$, $H\{2x\}=0$ nhưng $2H\{x\}=2u(-t)$. Không bằng nhau.</p>
<p>Bất biến: $x(t)=\frac{\pi }{2}$ hằng, $y(t)=u(-t)$. Dời đầu vào 1 đơn vị vẫn là cùng hằng nên đầu ra vẫn $u(-t)$; dời đầu ra cũ 1 đơn vị lại là $u(1-t)$. Hai hàm khác nhau.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Không cần bộ nhớ</b> — Tại $t$ chỉ đọc $x(t)$.</li>
<li><span class="vd qok">CHỌN</span><b>Nhân quả</b> — Không có $x(t+\varepsilon )$.</li>
<li><span class="vd qok">CHỌN</span><b>Ổn định</b> — $|y(t)|\le 1$.</li>
<li><span class="vd qbad">KHÔNG</span><b>Tuyến tính</b> — $\sin (2z)\neq 2\sin z$ nói chung.</li>
<li><span class="vd qbad">KHÔNG</span><b>Bất biến</b> — Hệ số $u(-t)$ cố định không dịch theo đầu vào.</li>
</ul>
`
    },
    {
      id: '1-9', t: 1, n: 9, k: 'multi', a: [0, 1, 2],
      l: ["Không cần bộ nhớ", "Nhân quả", "Tuyến tính", "Bất biến", "Ổn định"],
      im: [['1-9.webp', 760, 311]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Chọn: Không cần bộ nhớ, Nhân quả, Tuyến tính.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y(t)=t\cdot x(t)$. Hệ có nhân tử phụ thuộc thời gian $t$, không đồng nghĩa với phi tuyến.</p>
<p>Không nhớ: $y(t)$ chỉ dùng $x(t)$, không $x(t-\tau )$. Nhân quả: không dùng tương lai.</p>
<p>Tuyến tính: $H\{ax_{1}+bx_{2}\}=t(ax_{1}+bx_{2})=atx_{1}+btx_{2}=aH\{x_{1}\}+bH\{x_{2}\}$.</p>
<p>Bất biến? $H\{x(t-\tau )\}=t x(t-\tau )$; $y(t-\tau )=(t-\tau )x(t-\tau )$. Chọn $x=1$ và $\tau =1$ thì $t\neq t-1 \to$ không bất biến.</p>
<p>Ổn định? Đầu vào $x(t)=1$ có cận 1; đầu ra $y(t)=t$ không có cận trên trên toàn ℝ → không BIBO.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Không cần bộ nhớ</b> — Chỉ dùng $x(t)$.</li>
<li><span class="vd qok">CHỌN</span><b>Nhân quả</b> — Không cần $x$ tương lai.</li>
<li><span class="vd qok">CHỌN</span><b>Tuyến tính</b> — Nhân $t$ phân phối với tổ hợp tuyến tính.</li>
<li><span class="vd qbad">KHÔNG</span><b>Bất biến</b> — Hệ số $t$ và t−τ khác nhau.</li>
<li><span class="vd qbad">KHÔNG</span><b>Ổn định</b> — $x=1 \implies y=t$ không bị chặn.</li>
</ul>
`
    },
    {
      id: '1-10', t: 1, n: 10, k: 'multi', a: [0, 1],
      l: ["Tuyến tính", "Ổn định", "Không cần bộ nhớ", "Nhân quả", "Bất biến"],
      im: [['1-10.webp', 808, 312]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Chọn: Tuyến tính, Ổn định.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y(t)=e^{-|t|}x(-t)$. Có hai thao tác: đảo thời gian $x(-t)$, rồi nhân cửa sổ giảm $e^{-|t|}$.</p>
<p>Tuyến tính: $H\{ax_{1}+bx_{2}\}=e^{-|t|}[ax_{1}(-t)+bx_{2}(-t)]=aH\{x_{1}\}+bH\{x_{2}\}$.</p>
<p>Ổn định: $0<e^{-|t|}\le 1$. Với $|x(s)|\le M$, ta có $|y(t)|\le 1\cdot M=M$.</p>
<p>Nhân quả? Chọn $t=-1$: $y(-1)=e^{-1}x(1)$, dùng đầu vào tại 1 &gt; −1 ⇒ không nhân quả.</p>
<p>Không nhớ: $y(-1)$ cần $x(1)$ khác $x(-1)$, nên không nhớ là sai.</p>
<p>Bất biến: $H\{x(t-\tau )\}=e^{-|t|}x(-t-\tau )$ trong khi $y(t-\tau )=e^{-|t-\tau |}x(-t+\tau )$, nói chung hai vế khác nhau.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Tuyến tính</b> — Chồng chất giữ nguyên dưới phép lật và nhân hệ số.</li>
<li><span class="vd qok">CHỌN</span><b>Ổn định</b> — Hàm nhân không vượt 1.</li>
<li><span class="vd qbad">KHÔNG</span><b>Không cần bộ nhớ</b> — $x(-t)$ thường không bằng $x(t)$.</li>
<li><span class="vd qbad">KHÔNG</span><b>Nhân quả</b> — Tại $t=-1$ cần $x(1)$ trong tương lai.</li>
<li><span class="vd qbad">KHÔNG</span><b>Bất biến</b> — Lật thời gian và hệ số $e^{-|t|}$ không giao hoán phép dịch.</li>
</ul>
`
    },
    {
      id: '1-11', t: 1, n: 11, k: 'multi', a: [0, 1, 2, 4],
      l: ["Không cần bộ nhớ", "Nhân quả", "Bất biến", "Tuyến tính", "Ổn định"],
      im: [['1-11.webp', 804, 343]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Nếu quy ước $\sin (z)/z$ tại $z=0$ bằng 1: chọn Không cần bộ nhớ, Nhân quả, Bất biến, Ổn định. Nếu không có quy ước này, hệ không xác định cho $x=0$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y(t)=\sin (x(t))/x(t)$. Nếu $x(t)=0$, biểu thức gốc là 0/0; để coi là hệ xác định cho mọi đầu vào, phải bổ sung $y=1$ tại $x=0$ theo giới hạn.</p>
<p>Không nhớ: với $x\neq 0$, $y(t)$ chỉ phụ thuộc $x(t)$. Nhân quả: không cần bất cứ $x(s)$ nào với s&gt;t.</p>
<p>Bất biến: $H\{x(t-\tau )\}=\sin (x(t-\tau ))/x(t-\tau )=y(t-\tau )$, nếu miền xác định/giá trị nối liên tục được giữ nhất quán.</p>
<p>Tuyến tính? Với $x(t)=\pi$ là hằng số, $y(t)=0$; với $x(t)=\frac{\pi }{2}$, $y(t)=\frac{2}{\pi }\neq 0$. Dạng tỉ số sin $z / z$ không tuân phép nhân vô hướng; cũng $H\{0\}=1\neq 0$ nếu nối liên tục.</p>
<p>Ổn định: với mọi $z$ thực khác 0, |sin $z|\le |z| \implies$ |sin $z/z|\le 1$. Tại $z=0$ theo giới hạn bằng 1. Do đó đầu ra có cận 1 độc lập với đầu vào.</p>
<p>Nếu không có quy ước tại 0, chưa thể khẳng định một hệ xác định trên tất cả tín hiệu; phải ghi điều kiện “giả sử nối liên tục tại 0” khi chọn ổn định.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Không cần bộ nhớ</b> — Hàm điểm theo $x(t)$.</li>
<li><span class="vd qok">CHỌN</span><b>Nhân quả</b> — Không cần quá khứ/tương lai khác $t$.</li>
<li><span class="vd qok">CHỌN</span><b>Bất biến</b> — Không xuất hiện $t$ riêng.</li>
<li><span class="vd qbad">KHÔNG</span><b>Tuyến tính</b> — $H\{0\}=1$ nếu nối liên tục, trái với tính tuyến tính.</li>
<li><span class="vd qok">CHỌN CÓ ĐIỀU KIỆN</span><b>Ổn định</b> — |sin $z/z|\le 1$, sau khi định nghĩa tại $z=0$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Vì 0/0 không xác định, lời giải phải nói rõ giả định bổ sung; đây không phải tính chất suy ra trực tiếp từ biểu thức chưa hoàn chỉnh.</div>
<div class="qcheck" style="border-left-color:var(--c4)"><b>Lưu ý bổ sung:</b> Điểm cần lưu ý: nếu không cho phép bổ sung giá trị tại $x=0$ thì biểu thức gốc chưa định nghĩa một hệ trên mọi tín hiệu.</div>
`
    },
    {
      id: '1-12', t: 1, n: 12, k: 'multi', a: [0, 1],
      l: ["Nhân quả", "Tuyến tính", "Không cần bộ nhớ", "Bất biến", "Ổn định"],
      im: [['1-12.webp', 820, 313]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Chọn: Nhân quả, Tuyến tính.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]=\sum _{k=-1}^{n} x[k]$. Tổng chạy từ cận cố định −1 đến $n$; với n&lt;−1, quy ước tổng rỗng là 0.</p>
<p>Tuyến tính: $\sum (a x_{1}[k]+b x_{2}[k])=a\sum x_{1}[k]+b\sum x_{2}[k]$, nên tính chồng chất đúng.</p>
<p>Nhân quả: mọi $k$ được cộng đều không vượt $n \to$ không dùng $x[n+1]$.</p>
<p>Không nhớ: tại $n=0$, $y[0]=x[-1]+x[0]$, phải biết $x[-1] \to$ có nhớ.</p>
<p>Bất biến? Chọn $x[n]=\delta [n+1]$, có $x[-1]=1. H\{x\}[n]=u[n+1] (n\ge -1)$. Dịch $x$ sang phải 1 mẫu thành $\delta [n]$; $H\{\delta [n]\}=u[n]$, còn $y[n-1]=u[n]$ cũng bằng? Phản ví dụ này chưa phân biệt được vì cả hai xung đều nằm trong cận. Hãy chọn $x[n]=\delta [n+2]$ (xung $n=-2) \to H\{x\}=0$ cho mọi $n\ge -1$, dịch phải 1 thành $\delta [n+1]$ (xung −1) → $H\{x_\{\text\{dịch\}\}\}=u[n+1]$ khác 0. Vậy không bất biến.</p>
<p>Ổn định? Đầu vào $x[n]=1$ cho $n\ge -1$ (và 0 trước đó) bị chặn bởi 1, nhưng $y[n]=n+2$ với $n\ge -1$, tăng đến vô hạn.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Nhân quả</b> — Mọi chỉ số $k$ trong tổng $\le n$.</li>
<li><span class="vd qok">CHỌN</span><b>Tuyến tính</b> — Tổng phân phối phép cộng/nhân vô hướng.</li>
<li><span class="vd qbad">KHÔNG</span><b>Không cần bộ nhớ</b> — $n=0$ cần $x[-1]$ cùng $x[0]$.</li>
<li><span class="vd qbad">KHÔNG</span><b>Bất biến</b> — Cận dưới cố định −1; xung trước cận dịch qua cận làm đầu ra thay đổi.</li>
<li><span class="vd qbad">KHÔNG</span><b>Ổn định</b> — $x=1$ từ $n=-1 \implies y[n]=n+2$ không bị chặn.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cẩn thận: không thể chỉ nói “cận cố định” mà không đưa phản ví dụ dịch vì còn cần chứng minh. Hai xung $\delta [n+2]$ và $\delta [n+1]$ cho phản ví dụ rõ ràng.</div>
`
    },
    {
      id: '1-13', t: 1, n: 13, k: 'multi', a: [0, 1, 2],
      l: ["Tuyến tính", "Bất biến", "Ổn định", "Không cần bộ nhớ", "Nhân quả"],
      im: [['1-13.webp', 829, 318]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Chọn: Tuyến tính, Bất biến, Ổn định.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Tuyến tính: $H\{a\cdot x_{1}+b\cdot x_{2}\}=a\cdot H\{x_{1}\}+b\cdot H\{x_{2}\}$. Bất biến: $H\{x(t-t_{0})\}=y(t-t_{0})$. BIBO: $|x|\le M \implies |y|\le K$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]=\sum _{k=n-4}^{n+4}x[k]$. Có đúng 9 mẫu: n−4, n−3, …, n+4.</p>
<p>Tuyến tính: nếu $x=ax_{1}+bx_{2}$ thì $\sum x=\sum (ax_{1}+bx_{2})=a\sum x_{1}+b\sum x_{2}$.</p>
<p>Bất biến: đặt $x_{m}[n]=x[n-m]. H\{x_{m}\}[n]=\sum _{k=n-4}^{n+4}x[k-m]$. Đổi biến $r=k-m$ thì $r$ chạy từ (n−m)−4 đến (n−m)+4, bằng $y[n-m]$.</p>
<p>Ổn định: nếu $|x[k]|\le M$ thì $|y[n]|\le \sum _{k=n-4}^{n+4}|x[k]|\le 9M$.</p>
<p>Không nhớ: tại $n=0$ phải biết $x[-4]…x[4]$, không chỉ $x[0]$.</p>
<p>Nhân quả? Tại $n=0$, $y[0]$ có $x[1]$, $x[2]$, $x[3]$, $x[4]$; đây đều là tương lai của $t=0$. Chọn hai đầu vào giống nhau đến 0, khác tại 1 $\to y[0]$ khác → không nhân quả.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">CHỌN</span><b>Tuyến tính</b> — Tổng hữu hạn cho phép phân phối hệ số.</li>
<li><span class="vd qok">CHỌN</span><b>Bất biến</b> — Đổi biến $r=k-m$ chứng minh $H\{x_\{\text\{dịch\}\}\}=y$ dịch.</li>
<li><span class="vd qok">CHỌN</span><b>Ổn định</b> — Tổng 9 số bị chặn bởi 9M.</li>
<li><span class="vd qbad">KHÔNG</span><b>Không cần bộ nhớ</b> — Cần tối đa 9 mẫu, nhiều mẫu khác $n$.</li>
<li><span class="vd qbad">KHÔNG</span><b>Nhân quả</b> — Có $x[n+1]…x[n+4]$ từ tương lai.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Đổi biến tổng là phép chứng minh bất biến đúng hơn việc chỉ nhận xét “không thấy hệ số $n$ riêng”.</div>
`
    },
    {
      id: '2-1', t: 2, n: 1, k: 'num', a: 6, d: "6,00",
      im: [['2-1.webp', 515, 49]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$E =$ 6,00.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Tín hiệu trong đề: $x(t)=2\cos \frac{\pi t}{3}[u(t)-u(t-3)]$. Quy ước $u(t)=1$ với $t\ge 0$. Hiệu hai bước bằng 1 khi $0\le t<3$, và bằng 0 ngoài khoảng.</p>
<p>Năng lượng liên tục được định nghĩa $E=\int_{-\infty}^{\infty} |x(t)|^{2}dt$. Thay miền khác 0: $E=\int_0^3 |2\cos \frac{\pi t}{3}|^{2}dt=4\int_0^3 \cos ^{2}\frac{\pi t}{3}dt$.</p>
<p>Dùng công thức nhân đôi $\cos ^{2}z=(1+\cos 2z)/2 \implies E=2\int_0^3 [1+\cos \frac{2\pi t}{3}]dt$.</p>
<p>Nguyên hàm: $E=2[t+(3/(2\pi ))\sin \frac{2\pi t}{3}]$ từ $t=0$ tới $t=3$.</p>
<p>$\sin (2\pi )=\sin (0)=0$ nên $E=2(3-0)=6$. Kết quả theo định dạng đề là 6,00.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm nhanh: trên trọn một chu kỳ của $\cos ^{2}$ là độ dài 3, giá trị trung bình của $\cos ^{2}$ bằng 1/2; biên độ bình phương là 4. Vậy $E=4\cdot \frac{1}{2}\cdot 3=6$. Không được tính công suất bằng 6/3 nếu đề đang hỏi năng lượng.</div>
`
    },
    {
      id: '2-2', t: 2, n: 2, k: 'num', a: 10, d: "10,00",
      im: [['2-2.webp', 817, 72]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$E =$ 10,00.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x[n]=2\sin \frac{\pi n}{4}[u[n+1]-u[n-5]]$. Hiệu hai hàm bước là 1 khi $n\ge -1$ nhưng n&lt;5, tức $n\in \{-1,0,1,2,3,4\}$.</p>
<p>Định nghĩa năng lượng dãy: $E=\sum _{n=-\infty }^{\infty }|x[n]|^{2}$. Vì chỉ có sáu mẫu nên $E=4\sum _{n=-1}^{4}\sin ^{2}\frac{\pi n}{4}$.</p>
<p>Liệt kê lần lượt $n=-1,0,1,2,3,4$. Giá trị $\sin \frac{\pi n}{4}$ là $-\frac{\sqrt{2}}{2}$, 0, $\frac{\sqrt{2}}{2}$, 1, $\frac{\sqrt{2}}{2}$, 0.</p>
<p>Bình phương từng mẫu rồi nhân 4: $|x[n]|^{2} =$ 2,0,2,4,2,0.</p>
<p>Cộng các năng lượng mẫu: $E=2+0+2+4+2+0=10$. Viết 10,00.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm biên: $u[n-5]=0$ ở $n=4$ và bằng 1 ở $n=5$; vì thế $n=4$ tính, $n=5$ không tính. Nếu cộng cả $n=5$ dễ sai.</div>
`
    },
    {
      id: '2-3', t: 2, n: 3, k: 'num', a: 85.25, d: "85,25",
      im: [['2-3.webp', 832, 55]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$E =$ 85,25.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x[n]=2^{n}[u[n+1]-u[n-4]]$. Cửa sổ hoạt động tại $-1\le n\le 3$ (n nguyên).</p>
<p>Năng lượng là $\sum |x[n]|^{2}$; với $x[n]=2^{n}$ thì bình phương bằng 4ⁿ, không phải 2ⁿ.</p>
<p>Liệt kê cụ thể: $n=-1:4^{-1}=\frac{1}{4}$; $n=0:1$; $n=1:4$; $n=2:16$; $n=3:64$.</p>
<p>$E=\frac{1}{4}+1+4+16+64=0,25+85=85,25$.</p>
<p>Không có $n=4$ vì $u[n-4]$ đã chuyển thành 1, làm hiệu hai bước bằng 0.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Đếm đúng 5 mẫu (−1,0,1,2,3). Tổng lớn nhất là 64 và các số còn lại 21,25 nên 85,25 là hợp lý.</div>
`
    },
    {
      id: '2-4', t: 2, n: 4, k: 'num', a: 48, d: "48,00",
      im: [['2-4.webp', 847, 56]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$E =$ 48,00.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x[n]=3\cdot 2^{-n}u[n+1]$. Vì $u[n+1]$ chỉ bật từ $n=-1$, ta có $x[n]=0$ khi n&lt;−1.</p>
<p>Bình phương biên độ: $|3\cdot 2^{-n}|^{2}=9\cdot 2^{-2n}=9\cdot 4^{-n}$. Vậy $E=9\sum _{n=-1}^\infty 4^{-n}$.</p>
<p>Tại $n=-1$, năng lượng mẫu đầu là $9\cdot 4^{1}=36$. Các mẫu tiếp theo $n=0,1,2,…$ có năng lượng 9, 9/4, 9/16,…</p>
<p>Đây là cấp số nhân $a=36$, $r=\frac{1}{4}$. Do |r|&lt;1 nên tổng hữu hạn $E=a/(1-r)=36/\frac{3}{4}=48$.</p>
<p>Làm tròn/định dạng: 48,00. Công suất trung bình bằng 0 vì năng lượng hữu hạn trên toàn trục.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm $E$ phải lớn hơn số hạng đầu 36, nhưng không lớn quá $36+12=48$; thực tế tổng là đúng 48.</div>
`
    },
    {
      id: '2-5', t: 2, n: 5, k: 'num', a: 3, d: "3,00",
      im: [['2-5.webp', 854, 58]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$E =$ 3,00.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x[n]=3\cdot 2^{1-n}u[n-2]$, khác 0 khi $n\ge 2$. Tính sai cận bắt đầu sẽ làm năng lượng lệch nhiều lần.</p>
<p>Bình phương: $|x[n]|^{2}=9\cdot 2^{2-2n}=9\cdot 4^{1-n}$. Suy ra $E=\sum _{n=2}^\infty 9\cdot 4^{1-n}$.</p>
<p>Thay $n=2$ ta được $a=9\cdot 4^{-1}=\frac{9}{4}=2,25$. Tỉ số mẫu sau/mẫu trước là $r=\frac{1}{4}$.</p>
<p>Tổng cấp số nhân hội tụ: $E=\frac{9}{4}/(1-\frac{1}{4})=\frac{9}{4}/\frac{3}{4}=3$.</p>
<p>Kết quả 3,00.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm bằng cộng vài số đầu: 2,25+0,5625+0,140625+… tiến dần tới 3; nếu ra 12 thì đã quên cận $n=2$.</div>
`
    },
    {
      id: '2-6', t: 2, n: 6, k: 'num', a: 4, d: "4,00",
      im: [['2-6.webp', 476, 35]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$E =$ 4,00.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Tín hiệu $x(t)=2e^{j\pi t/3}[u(t)-u(t-1)]$; chỉ có trên $0\le t<1$.</p>
<p>Năng lượng của tín hiệu PHỨC luôn là $\int |x(t)|^{2}dt$, không phải $\int x(t)^{2}dt$; môđun $|e^{j\theta }|=1$ vì $\cos ^{2}\theta +\sin ^{2}\theta =1$.</p>
<p>Do đó $|x(t)|=2\cdot 1=2$ trên khoảng [0,1), và $|x(t)|^{2}=4$.</p>
<p>$E=\int_0^1 4dt=[4t]_{0}^{1}=4$. Không có thành phần phụ thuộc $\pi$ vì pha không ảnh hưởng năng lượng.</p>
<p>Theo yêu cầu số thập phân: 4,00.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Dù pha $e^{j\pi t/3}$ quay theo $t$, véc-tơ phức có bán kính 2 không đổi; năng lượng vẫn là $2^2 \times \text{độ}$ dài khoảng.</div>
`
    },
    {
      id: '2-7', t: 2, n: 7, k: 'num', a: 1, d: "1,00",
      im: [['2-7.webp', 521, 51]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$E =$ 1,00.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x[n]=\cos \frac{\pi n}{2}[u[n]-u[n-2]]$. Cửa sổ hoạt động khi $0\le n<2$; chỉ có hai chỉ số 0,1.</p>
<p>Tại $n=0$: $x[0]=\cos 0=1$. Tại $n=1$: $x[1]=\cos \frac{\pi }{2}=0$.</p>
<p>$E=\sum |x[n]|^{2}=|x[0]|^{2}+|x[1]|^{2}=1^{2}+0^{2}=1$.</p>
<p>Ngoài hai vị trí đó $x[n]=0$ theo cửa sổ, dù cos theo bản thân là tín hiệu tuần hoàn kéo dài vô hạn.</p>
<p>Kết quả 1,00; đây là tín hiệu năng lượng vì $0<E<\infty$.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Không dùng công suất $\cos ^{2}$ trung bình 1/2 cho câu này; cửa sổ đã cắt tín hiệu thành đúng 2 mẫu.</div>
`
    },
    {
      id: '2-8', t: 2, n: 8, k: 'num', a: 1.1666666666666667, d: "1,17 (7/6)",
      im: [['2-8.webp', 842, 59]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$P =$ 1,17 (chính xác 7/6).</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Tín hiệu $x[n]$ là tổng hai đoàn xung: $A[n]=\sum_k \delta [n-2k]$ (xung ở $n$ chẵn) và $B[n]=\sum_k \delta [n-3k+1]$ (xung ở n≡2 mod 3). Cả hai có biên độ 1.</p>
<p>Chu kỳ của $A$ là 2, của $B$ là 3. Chu kỳ chung nhỏ nhất là $N=\text{BCNN}(2,3)=6$, nên $P=\frac{1}{6}\sum _{n=0}^{5}|x[n]|^{2}$.</p>
<p>Xét $n=0,1,2,3,4,5$: $A=[1,0,1,0,1,0]$ và $B=[0,0,1,0,0,1]$. Vậy $x=A+B=[1,0,2,0,1,1]$.</p>
<p>Bình phương các mẫu: $|x|^{2}=[1,0,4,0,1,1]$. Tại $n=2$, hai xung trùng nên biên độ là 2 và năng lượng mẫu là $2^{2}=4$.</p>
<p>Tổng trên một chu kỳ: $1+0+4+0+1+1=7 \implies P=\frac{7}{6}\approx 1,166666…$</p>
<p>Làm tròn hai chữ số: 1,17.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cách thứ hai dùng $A^{2}+B^{2}+2AB$: mật độ $A=\frac{1}{2}$, $B=\frac{1}{3}$, $\text{giao}=\frac{1}{6} \implies P=\frac{1}{2}+\frac{1}{3}+2\cdot \frac{1}{6}=\frac{7}{6}$. Cả hai cách trùng nhau.</div>
`
    },
    {
      id: '2-9', t: 2, n: 9, k: 'yn', a: 1, d: "Có (E = 2)",
      im: [['2-9.webp', 484, 35]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Có; năng lượng $E =$ 2.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề là sóng phức $x[n]=e^{j\pi n/2}[u[n]-u[n-2]]$; hiệu hàm bước giữ đúng $n=0,1$.</p>
<p>Định nghĩa năng lượng dãy phức: $E=\sum x[n]\cdot x*[n] = \sum |x[n]|^{2}$, trong đó * là liên hợp.</p>
<p>Mọi $n$ nguyên đều có $|e^{j\pi n/2}|=1$; vì thế tại $n=0,1$ ta nhận $|x[0]|^{2}=|x[1]|^{2}=1$.</p>
<p>Cộng: $E=1+1=2$. Nó có năng lượng hữu hạn, khác 0, nên là tín hiệu năng lượng.</p>
<p>Công suất trung bình trên toàn ℤ là 0 vì chỉ có hai mẫu khác 0.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Đừng lấy bình phương đại số $e^{j\pi n}$ rồi cộng; năng lượng yêu cầu bình phương môđun, không phải bình phương số phức.</div>
`
    },
    {
      id: '2-10', t: 2, n: 10, k: 'num', a: 0.5, d: "0,50",
      im: [['2-10.webp', 855, 59]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$P =$ 0,50.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x[n]=\sum \delta [n-2k-1] - \sum \delta [n-3k+1]$ (hai đoàn xung đối dấu). Đoàn $A$ có xung ở $n$ lẻ; đoàn $B$ có xung ở n≡2 mod3.</p>
<p>Chu kỳ chung $N=\text{BCNN}(2,3)=6$. Trong một chu kỳ $n=0..5$, $A=[0,1,0,1,0,1]$; $B=[0,0,1,0,0,1]$.</p>
<p>Trừ từng mẫu: $x=A-B=[0,1,-1,1,0,0]$. Đặc biệt ở $n=5$, $1-1=0$ chứ không phải 2.</p>
<p>Bình phương môđun $x$: [0,1,1,1,0,0]; tổng bằng 3.</p>
<p>$P=\frac{1}{6}\cdot 3=\frac{1}{2}=0,50$.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cách kiểm bằng mật độ: $\frac{1}{2}+\frac{1}{3}-2\frac{1}{6}=\frac{1}{2}$. Dấu trừ khiến hai đoàn xung triệt tiêu ở giao nhau.</div>
`
    },
    {
      id: '2-11', t: 2, n: 11, k: 'num', a: 0.5, d: "0,50",
      im: [['2-11.webp', 841, 60]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$P =$ 0,50.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề là đoàn xung chữ nhật bằng 1 trong mỗi khoảng dài 1 và lặp theo chu kỳ $T=2$. Trong một chu kỳ điển hình [0,2), $x(t)=1$ nếu $0\le t<1$ và 0 nếu $1\le t<2$.</p>
<p>Định nghĩa công suất trung bình của tín hiệu tuần hoàn: $P=\frac{1}{T}\int _{t_{0}}^{t_{0}+T}|x(t)|^{2}dt$. Chọn $t_{0}=0$ giúp tính đơn giản.</p>
<p>Thay $T=2$: $P=\frac{1}{2}[\int_0^1 1^{2}dt+\int_1^2 0^{2}dt]$.</p>
<p>Tích phân thứ nhất bằng 1; thứ hai bằng 0 $\implies P=\frac{1}{2}(1+0)=\frac{1}{2}$.</p>
<p>Viết kết quả 0,50.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Đoàn xung tồn tại vô hạn nên tổng năng lượng $E=\infty$; câu hỏi yêu cầu CÔNG SUẤT trung bình (mật độ năng lượng theo thời gian), không phải $E$.</div>
`
    },
    {
      id: '2-12', t: 2, n: 12, k: 'num', a: 1.47, d: "1,47",
      im: [['2-12.webp', 822, 64]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$E \approx$ 1,47.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x(t)=\sin (2t)[u(t+1)-u(t-2)]$, vì vậy chỉ khác 0 khi $-1\le t<2$.</p>
<p>$E=\int_{-1}^2 |\sin (2t)|^{2}dt=\int_{-1}^2 \sin ^{2}(2t)dt$.</p>
<p>Dùng $\sin ^{2}(2t)=[1-\cos (4t)]/2$. Khi đó $E=\frac{1}{2}\int_{-1}^2 [1-\cos (4t)]dt$.</p>
<p>Lấy nguyên hàm $E=[t/2-\sin (4t)/8]$ từ −1 tới 2.</p>
<p>Thay cận: $E=(1-\sin 8/8)-(-\frac{1}{2}+\sin 4/8)=\frac{3}{2}-(\sin 8+\sin 4)/8$.</p>
<p>Với góc tính bằng radian: $\sin 8\approx 0,989358$; $\sin 4\approx -0,756802$. Suy ra $E\approx 1,4709305 \to$ 1,47.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Dùng radian, không dùng chế độ độ (degrees). Kiểm nhanh: khoảng dài 3, $\sin ^{2}$ dao động 0…1 nên $0\le E\le 3$; kết quả 1,47 hợp lý.</div>
`
    },
    {
      id: '2-13', t: 2, n: 13, k: 'num', a: 13.65, d: "13,65",
      im: [['2-13.webp', 830, 57]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$E \approx$ 13,65.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Tín hiệu $x(t)=e^{2t}[u(t+2)-u(t-1)]$ chỉ được giữ khi $-2\le t<1$.</p>
<p>Vì $e^{2t}$ là số thực dương, $|x(t)|^{2}=(e^{2t})^{2}=e^{4t}$.</p>
<p>$E=\int_{-2}^1 e^{4t}dt$. Nguyên hàm của $e^{4t}$ là $e^{4t}/4$ vì đạo hàm $e^{4t}/4$ bằng $e^{4t}$.</p>
<p>Thay cận: $E=(e^{4}-e^{-8})/4$.</p>
<p>$e^{4}\approx 54,598150$; $e^{-8}\approx 0,00033546$ nên $E\approx (54,597814)/4\approx 13,6494537$.</p>
<p>Theo yêu cầu đến hai chữ số sau dấu phẩy: 13,65.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Giá trị tại cận điểm −2 và 1 không ảnh hưởng tích phân liên tục; quan trọng là lấy đúng hai cận.</div>
`
    },
    {
      id: '2-14', t: 2, n: 14, k: 'num', a: 745.24, d: "745,24",
      im: [['2-14.webp', 847, 58]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$E \approx$ 745,24.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$E = \int_{-\infty}^{\infty} |x(t)|^{2}dt$ hoặc $\sum_n |x[n]|^{2}$. Tín hiệu tuần hoàn: $P = \frac{1}{T}\int_0^T |x(t)|^{2}dt$ hoặc $\frac{1}{N}\sum_{n=0}^{N-1} |x[n]|^{2}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Tín hiệu $x(t)=e^{-2t}u(t+2)$ khác 0 với $t\ge -2$ và bằng 0 trước thời điểm đó.</p>
<p>Năng lượng $E=\int_{-2}^{\infty} |e^{-2t}|^{2}dt=\int_{-2}^{\infty} e^{-4t}dt$.</p>
<p>Tính tích phân vô hạn qua giới hạn: $E=lim_{b\to \infty }\int_{-2}^b e^{-4t}dt=lim_{b\to \infty }[-e^{-4t}/4]_{-2}^{b}$.</p>
<p>Tại $b\to \infty$, $e^{-4b}\to 0$. Tại −2, $e^{-4(-2)}=e^{8}$. Do đó $E=0-(-e^{8}/4)=e^{8}/4$.</p>
<p>$e^{8}\approx 2980,957987 \implies E\approx 745,239497 \implies$ 745,24.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Năng lượng lớn vì đoạn từ $t=-2$ đến gần 0 có biên độ $e^{-2t}$ rất lớn (tại −2 là $e^{4})$, không phải lỗi tính toán.</div>
`
    },
    {
      id: '3-1', t: 3, n: 1, k: 'mc', c: 4, a: 1,
      im: [['3-1.webp', 819, 640]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x_{1}(t)=2x(3t+9)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Gọi $s$ là đối số trong $x(s)$. Tìm $x_{1}(t)=A\cdot x(at+b)$. Đồ thị $x$ gốc tồn tại từ $s=0$ đến $s=3$ và có đỉnh tại $s=1$, giá trị đỉnh 2.</p>
<p>Đồ thị $x_{1}$ mới tồn tại từ $t=-3$ đến $t=-2$; quan sát dốc bên trái đi lên, bên phải đi xuống như $x$ gốc nên không cần đảo thời gian (a&gt;0).</p>
<p>Ghép hai đầu mút: $a(-3)+b=0$ và $a(-2)+b=3$. Trừ hai phương trình: $a=3$, rồi $b=9$.</p>
<p>Vậy đối số cần là $s=3t+9$. Kiểm đỉnh: $s=1 \implies 3t+9=1 \implies t=-\frac{8}{3}$, đúng vị trí đỉnh mới.</p>
<p>Đỉnh mới cao 4, đỉnh cũ cao 2 $\implies A=\frac{4}{2}=2$. Kết quả $x_{1}(t)=2x(3t+9)$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>$x_{1}(t)=2x(3t+9)$</b> — Ánh xạ −3↦0 và −2↦3; biên độ 2↦4.</li>
<li><span class="vd qbad">SAI</span><b>Các dạng có hệ số −3</b> — $a$ âm sẽ đảo trái/phải, trái chiều dốc của đồ thị mới.</li>
<li><span class="vd qbad">SAI</span><b>Các dạng dịch không phải +9</b> — Không thỏa đồng thời hai điều kiện biên.</li>
<li><span class="vd qbad">SAI</span><b>Dạng không nhân 2</b> — Không đổi được đỉnh 2 thành 4.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Chỉ cần ghép hai biên và đỉnh, sau đó kiểm chiều của đồ thị; tránh đoán qua hình thức $x(3t+...)$</div>
`
    },
    {
      id: '3-2', t: 3, n: 2, k: 'mc', c: 4, a: 1,
      im: [['3-2.webp', 827, 55], ['3-2b.webp', 827, 222]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x_{2}[n]=u[n+1]-u[n-3]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Tín hiệu gốc $x_{1}[m]=u[m+2]-u[m-5]$. Với $u[m]$ quy ước bằng 1 khi $m\ge 0$, nó chỉ khác 0 khi $-2\le m<5$, tức $-2\le m\le 4$ (m nguyên).</p>
<p>Đề cho $x_{2}[n]=x_{1}[-2n+2]$. Đặt $m=-2n+2$ rồi thế vào điều kiện hỗ trợ: $-2\le -2n+2\le 4$.</p>
<p>Trừ 2: $-4\le -2n\le 2$. Chia −2 phải ĐỔI chiều cả hai bất đẳng thức: $2\ge n\ge -1$, hay $-1\le n\le 2$.</p>
<p>Vậy $x_{2}[n]=1$ đúng tại $n=-1,0,1,2$; ngoài khoảng này $x_{2}[n]=0$.</p>
<p>Dạng cửa sổ $u[n-a]-u[n-b]$ giữ $a\le n<b$. Với $a=-1$, $b=3$ ta được $x_{2}[n]=u[n+1]-u[n-3]$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>$u[n+1]-u[n-3]$</b> — Bật tại $n=-1$, tắt từ $n=3$, đúng bốn mẫu −1..2.</li>
<li><span class="vd qbad">SAI</span><b>Cửa sổ kết thúc ở $n=2$</b> — $u[n-2]$ sẽ tắt ngay tại $n=2$, làm mất mẫu $x_{2}[2]=x_{1}[-2]=1$.</li>
<li><span class="vd qbad">SAI</span><b>Cửa sổ bắt đầu $n=0$</b> — Bỏ mất $n=-1$, trong khi $m=4$ vẫn nằm trong hỗ trợ.</li>
<li><span class="vd qbad">SAI</span><b>Cửa sổ dài khác 4 mẫu</b> — Điều kiện được giải chính xác có 4 số nguyên.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Thế trực tiếp $n=-1$ vào $-2n+2=4$, $n=2$ vào $=-2$ và $n=3$ vào $=-4$: hai đầu trong, mẫu kế ngoài.</div>
`
    },
    {
      id: '3-3', t: 3, n: 3, k: 'mc', c: 4, a: 4,
      im: [['3-3.webp', 841, 284]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 4: $x_{2}[n]=u[n+3]-u[n-1]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Giữ nguyên cửa sổ gốc: $x_{1}[m]=1$ khi $-2\le m\le 4$, 0 ở nơi khác.</p>
<p>Thay $m=-2n-2$ từ $x_{2}[n]=x_{1}[-2n-2]$: $-2\le -2n-2\le 4$.</p>
<p>Cộng 2: $0\le -2n\le 6$. Chia −2 đổi chiều: $0\ge n\ge -3$, tức $-3\le n\le 0$.</p>
<p>Các mẫu khác 0 là $n=-3,-2,-1,0$ (4 mẫu).</p>
<p>Viết bằng bước: $u[n+3]$ bật tại −3; $u[n-1]$ bật tại +1 để tắt cửa sổ. Vì thế $x_{2}[n]=u[n+3]-u[n-1]$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>$u[n+3]-u[n-1]$</b> — Giữ đúng các mẫu −3,−2,−1,0.</li>
<li><span class="vd qbad">SAI</span><b>$u[n+1]-u[n-3]$</b> — Chỉ giữ −1..2, lệch sang phải.</li>
<li><span class="vd qbad">SAI</span><b>$u[n+4]-u[n-9]$</b> — Có quá nhiều mẫu và điểm đầu không đúng.</li>
<li><span class="vd qbad">SAI</span><b>$u[n+3]-u[n]$</b> — Tắt ở $n=0$, nhưng $x_{2}[0]=x_{1}[-2]=1$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm $n=-3 \implies m=4$; $n=0 \implies m=-2$; $n=1 \implies m=-4$ (đã ngoài).</div>
`
    },
    {
      id: '3-4', t: 3, n: 4, k: 'mc', c: 4, a: 1,
      im: [['3-4.webp', 827, 284]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x_{2}[n]=u[n+1]-u[n-2]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>$x_{1}[m]$ khác 0 khi $-2\le m\le 4$; đặt $m=-2n+1$.</p>
<p>$-2\le -2n+1\le 4 \implies -3\le -2n\le 3 \implies -\frac{3}{2}\le n\le \frac{3}{2}$ (sau khi đảo chiều chia số âm).</p>
<p>$n$ buộc là số NGUYÊN nên chỉ có $n=-1,0,1$. Đây là chỗ cần làm tròn biên đúng, không lấy cả $n=-2$ hoặc $n=2$.</p>
<p>Cửa sổ bật từ −1, tắt từ 2: $u[n+1]-u[n-2]$.</p>
<p>Kiểm ba mẫu: $n=-1\to m=3$, $n=0\to m=1$, $n=1\to m=-1$; cả ba thuộc [−2,4]. $n=2\to m=-3$ nên $x_{2}[2]=0$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>$u[n+1]-u[n-2]$</b> — Bật đúng −1,0,1 và tắt ở 2.</li>
<li><span class="vd qbad">SAI</span><b>$u[n+1]-u[n-3]$</b> — Chứa thêm $n=2$ nhưng $n=2$ cho $m=-3$ ngoài miền.</li>
<li><span class="vd qbad">SAI</span><b>$u[n+2]-u[n-1]$</b> — Chứa $n=-2$, thiếu $n=1$.</li>
<li><span class="vd qbad">SAI</span><b>$u[n+3]-u[n-1]$</b> — Miền bắt đầu sai và thiếu mẫu $n=1$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Điểm kỹ thuật: với phép đổi chỉ số −2n+1, cận liên tục $\pm 1,5$ phải giao với tập ℤ.</div>
`
    },
    {
      id: '3-5', t: 3, n: 5, k: 'mc', c: 4, a: 2,
      im: [['3-5.webp', 827, 108], ['3-5b.webp', 827, 163]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 2: $x_{2}[n]=u[n+2]-u[n-1]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Miền khác 0 của $x_{1}[m]$ là $-2\le m\le 4$. Phép biến đổi dùng $m=-2n-1$.</p>
<p>Giải $-2\le -2n-1\le 4$. Cộng 1: $-1\le -2n\le 5$.</p>
<p>Chia cho −2 và đổi chiều: $\frac{1}{2}\ge n\ge -\frac{5}{2}$. Với $n$ nguyên, ta có $n=-2,-1,0$.</p>
<p>Vì $x_{2}[n]$ bằng 1 trên ba mẫu đó, viết $x_{2}[n]=u[n+2]-u[n-1]$.</p>
<p>Kiểm tại $n=-2$: $m=3$; $n=0$: $m=-1$, đều hợp lệ; $n=1$: $m=-3$ ngoài miền.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>$u[n+2]-u[n-1]$</b> — Ba mẫu −2,−1,0.</li>
<li><span class="vd qbad">SAI</span><b>$u[n+1]-u[n-2]$</b> — Lệch 1 mẫu sang phải.</li>
<li><span class="vd qbad">SAI</span><b>$u[n+3]-u[n-1]$</b> — Chứa thêm $n=-3$, dù $m=5$ ngoài miền.</li>
<li><span class="vd qbad">SAI</span><b>$u[n]-u[n-4]$</b> — Bắt đầu từ $n=0$; mất hai mẫu âm.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Quy tắc hình dung: dấu “−2n” lật miền, nhưng phải giải bất đẳng thức rồi mới chọn đầu mút số nguyên.</div>
`
    },
    {
      id: '3-6', t: 3, n: 6, k: 'mc', c: 4, a: 1,
      im: [['3-6.webp', 824, 299]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x_{2}[n]=\delta [n+2]+\delta [n]+\delta [n-2]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x_{1}[m]=u[m]-u[m-3]$, bằng 1 với $m=0,1,2$ và bằng 0 ở các vị trí nguyên khác.</p>
<p>Biến đổi $x_{2}[n]=x_{1}[1-n/2]$. Để đối số thuộc các chỉ số được nêu rõ, giải $1-n/2=0,1,2$.</p>
<p>Với $m=0$ ta có $n=2$; với $m=1$ ta có $n=0$; với $m=2$ ta có $n=-2$.</p>
<p>Theo quy ước co giãn/chèn mẫu của bài trắc nghiệm, $x_{2}[n]$ có ba xung tại $n=-2,0,2$. Viết $x_{2}[n]=\delta [n+2]+\delta [n]+\delta [n-2]$.</p>
<p>Cần phân biệt: nếu $n$ lẻ, 1−n/2 là nửa nguyên (chẳng hạn $n=1$ cho 1/2), trong khi $x_{1}$ được định nghĩa là dãy tại $m$ nguyên. Phép thế chưa xác định tại đó nếu không quy ước chèn 0 hoặc nội suy.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG THEO QUY ƯỚC</span><b>$\delta [n+2]+\delta [n]+\delta [n-2]$</b> — Có các xung $n=-2,0,2$.</li>
<li><span class="vd qbad">SAI</span><b>Bất kỳ đáp án có xung tại $n=\pm 1$</b> — $n=1$ hay −1 tạo đối số bán nguyên, không thuộc ba vị trí $m=0,1,2$.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án chỉ có hai xung</b> — Bỏ sót một trong ba mốc $m=0,1,2$.</li>
<li><span class="vd qbad">SAI</span><b>Dãy bước liên tiếp</b> — Co giãn rời rạc kiểu này tạo các xung cách nhau 2, không lấp đầy các mẫu giữa.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Đây là quy ước ngầm của đề. Theo lý thuyết dãy rời rạc, $x_{1}[1-n/2]$ cần được định nghĩa thêm tại $n$ lẻ; không thể coi phép thế là tự động hợp lệ ở mọi $n$.</div>
<div class="qcheck" style="border-left-color:var(--c4)"><b>Lưu ý bổ sung:</b> Đáp án này dùng quy ước lấy mẫu tại các vị trí nguyên của dãy khi co giãn; với $n$ lẻ, đối số −n/2+1 không nguyên, cần quy ước nội suy nếu định nghĩa chặt chẽ.</div>
`
    },
    {
      id: '3-7', t: 3, n: 7, k: 'mc', c: 4, a: 1,
      im: [['3-7.webp', 824, 299]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x_{2}[n]=\delta [n+6]+\delta [n+4]+\delta [n+2]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Giữ $x_{1}[m]=1$ tại $m=0,1,2$. Đề cho $x_{2}[n]=x_{1}[-n/2-1]$.</p>
<p>Giải $-n/2-1=0 \implies n=-2$; $=1 \implies n=-4$; $=2 \implies n=-6$.</p>
<p>Do vậy ba xung có biên độ 1 nằm tại −6,−4,−2; không ở $n$ lẻ.</p>
<p>Cách viết bằng xung đơn vị: $x_{2}[n]=\delta [n+6]+\delta [n+4]+\delta [n+2]$.</p>
<p>Đối chiếu: tại $n=-6$, đối số là 2; tại −4 là 1; tại −2 là 0. Mọi vị trí đó đều cho $x_{1}$ bằng 1.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG THEO QUY ƯỚC</span><b>$\delta [n+6]+\delta [n+4]+\delta [n+2]$</b> — Ba xung cách nhau 2 và ở $n$ âm.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án gồm $n=+2,+4,+6$</b> — Quên dấu trừ trong −n/2.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án gồm $n=-3,-2,-1$</b> — Quên hệ số 1/2 làm khoảng cách mẫu thành 2.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án chỉ có một hoặc hai xung</b> — Bỏ một trong ba mẫu $m=0,1,2$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Nếu $n$ lẻ, đối số −n/2−1 bán nguyên; phép biến đổi dãy rời rạc cần quy ước chèn 0/nội suy như câu 3.6.</div>
<div class="qcheck" style="border-left-color:var(--c4)"><b>Lưu ý bổ sung:</b> Tương tự câu 6, phép đổi trục chỉ số rời rạc với đối số bán nguyên cần quy ước lấy mẫu/nội suy.</div>
`
    },
    {
      id: '3-8', t: 3, n: 8, k: 'mc', c: 4, a: 4,
      im: [['3-8.webp', 601, 30], ['3-8b.webp', 601, 975], ['3-8c.webp', 601, 50]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 4: $x_{1}(t)=\frac{1}{2}x(-t/2-\frac{1}{2})$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Mô tả hai đồ thị để tránh đoán: $x$ gốc [0,3], đỉnh cao 2 tại $s=1$; $x_{1}$ mới [−7,−1], đỉnh cao 1. Đặt công thức tổng quát $x_{1}(t)=A\cdot x(s)$ với $s=at+b$.</p>
<p>Ghép cặp hai biên hỗ trợ sao cho đúng hình dáng: tại $t=-7$ phải có $s=3$; tại $t=-1$ phải có $s=0$. Đây là hai phương trình $a\cdot (-7)+b=3$, $a\cdot (-1)+b=0$.</p>
<p>Trừ hai phương trình: $a=(0-(3))/(-1-(-7))=-\frac{1}{2}$. Thay vào một phương trình tìm $b=-\frac{1}{2}$. Do đó $s=-1/2t+-\frac{1}{2}$.</p>
<p>Đảo thời gian vì đầu mới −7 ứng với $s=3$, đầu cuối −1 ứng với $s=0$.</p>
<p>So độ cao đỉnh/hình dạng tương ứng: hệ số nhân biên độ $A=\frac{1}{2}$. Công thức cuối là $x_{1}(t)=\frac{1}{2}\cdot x(-1/2t+-\frac{1}{2})$.</p>
<p>Thử ngược hai biên sau khi tính: nếu một biên mới không quay về đúng biên cũ, công thức loại ngay, dù đỉnh nhìn có vẻ đúng.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Dạng có $s=-1/2t+-\frac{1}{2}$</b> — Đúng cả hai biên và chiều đồ thị; sau đó hệ số biên độ $A=\frac{1}{2}$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức cho $a$ trái dấu</b> — Sẽ đảo chiều so với chuyển động đồ thị quan sát được.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $b$ khác −1/2</b> — Khi thay $t=-7$ không ra $s=3$ đồng thời $t=-1$ không ra $s=0$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $A$ khác 1/2</b> — Không khớp độ cao các điểm đặc trưng của $x_{1}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cách tự kiểm mạnh nhất: thay cả hai đầu mút, các điểm gãy ở giữa và đỉnh; phải khớp vị trí LẪN giá trị biên độ.</div>
`
    },
    {
      id: '3-9', t: 3, n: 9, k: 'mc', c: 4, a: 1,
      im: [['3-9.webp', 829, 595]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x_{1}(t)=2x(-t+1)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Mô tả hai đồ thị để tránh đoán: $x$ gốc [0,3], đỉnh cao 2 tại $s=1$; $x_{1}$ mới [−2,1], đỉnh cao 4. Đặt công thức tổng quát $x_{1}(t)=A\cdot x(s)$ với $s=at+b$.</p>
<p>Ghép cặp hai biên hỗ trợ sao cho đúng hình dáng: tại $t=-2$ phải có $s=3$; tại $t=1$ phải có $s=0$. Đây là hai phương trình $a\cdot (-2)+b=3$, $a\cdot (1)+b=0$.</p>
<p>Trừ hai phương trình: $a=(0-(3))/(1-(-2))=-1$. Thay vào một phương trình tìm $b=1$. Do đó $s=-1t+1$.</p>
<p>Đảo chiều: đầu mới −2 tương ứng mép phải $s=3$.</p>
<p>So độ cao đỉnh/hình dạng tương ứng: hệ số nhân biên độ $A=2$. Công thức cuối là $x_{1}(t)=2\cdot x(-1t+1)$.</p>
<p>Thử ngược hai biên sau khi tính: nếu một biên mới không quay về đúng biên cũ, công thức loại ngay, dù đỉnh nhìn có vẻ đúng.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Dạng có $s=-1t+1$</b> — Đúng cả hai biên và chiều đồ thị; sau đó hệ số biên độ $A=2$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức cho $a$ trái dấu</b> — Sẽ đảo chiều so với chuyển động đồ thị quan sát được.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $b$ khác 1</b> — Khi thay $t=-2$ không ra $s=3$ đồng thời $t=1$ không ra $s=0$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $A$ khác 2</b> — Không khớp độ cao các điểm đặc trưng của $x_{1}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cách tự kiểm mạnh nhất: thay cả hai đầu mút, các điểm gãy ở giữa và đỉnh; phải khớp vị trí LẪN giá trị biên độ.</div>
`
    },
    {
      id: '3-10', t: 3, n: 10, k: 'mc', c: 4, a: 1,
      im: [['3-10.webp', 833, 30], ['3-10b.webp', 833, 601]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x_{1}(t)=2x(-3t+6)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Mô tả hai đồ thị để tránh đoán: $x$ gốc [0,3], đỉnh cao 2; $x_{1}$ mới [1,2], đỉnh cao 4. Đặt công thức tổng quát $x_{1}(t)=A\cdot x(s)$ với $s=at+b$.</p>
<p>Ghép cặp hai biên hỗ trợ sao cho đúng hình dáng: tại $t=1$ phải có $s=3$; tại $t=2$ phải có $s=0$. Đây là hai phương trình $a\cdot (1)+b=3$, $a\cdot (2)+b=0$.</p>
<p>Trừ hai phương trình: $a=(0-(3))/(2-(1))=-3$. Thay vào một phương trình tìm $b=6$. Do đó $s=-3t+6$.</p>
<p>Khoảng hỗ trợ 3 biến thành 1 ⇒ nén 3 lần; thứ tự bị đảo.</p>
<p>So độ cao đỉnh/hình dạng tương ứng: hệ số nhân biên độ $A=2$. Công thức cuối là $x_{1}(t)=2\cdot x(-3t+6)$.</p>
<p>Thử ngược hai biên sau khi tính: nếu một biên mới không quay về đúng biên cũ, công thức loại ngay, dù đỉnh nhìn có vẻ đúng.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Dạng có $s=-3t+6$</b> — Đúng cả hai biên và chiều đồ thị; sau đó hệ số biên độ $A=2$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức cho $a$ trái dấu</b> — Sẽ đảo chiều so với chuyển động đồ thị quan sát được.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $b$ khác 6</b> — Khi thay $t=1$ không ra $s=3$ đồng thời $t=2$ không ra $s=0$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $A$ khác 2</b> — Không khớp độ cao các điểm đặc trưng của $x_{1}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cách tự kiểm mạnh nhất: thay cả hai đầu mút, các điểm gãy ở giữa và đỉnh; phải khớp vị trí LẪN giá trị biên độ.</div>
`
    },
    {
      id: '3-11', t: 3, n: 11, k: 'mc', c: 4, a: 1,
      im: [['3-11.webp', 832, 338], ['3-11b.webp', 832, 280]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x_{1}(t)=2x(2t-1)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Mô tả hai đồ thị để tránh đoán: $x$ gốc [0,3], đỉnh 2; $x_{1}$ mới [1/2,2], đỉnh 4. Đặt công thức tổng quát $x_{1}(t)=A\cdot x(s)$ với $s=at+b$.</p>
<p>Ghép cặp hai biên hỗ trợ sao cho đúng hình dáng: tại $t=\frac{1}{2}$ phải có $s=0$; tại $t=2$ phải có $s=3$. Đây là hai phương trình $a\cdot \frac{1}{2}+b=0$, $a\cdot (2)+b=3$.</p>
<p>Trừ hai phương trình: $a=(3-(0))/(2-\frac{1}{2})=2$. Thay vào một phương trình tìm $b=-1$. Do đó $s=2t+-1$.</p>
<p>Giữ chiều, độ dài mới 3/2 nên nén 2 lần.</p>
<p>So độ cao đỉnh/hình dạng tương ứng: hệ số nhân biên độ $A=2$. Công thức cuối là $x_{1}(t)=2\cdot x(2t+-1)$.</p>
<p>Thử ngược hai biên sau khi tính: nếu một biên mới không quay về đúng biên cũ, công thức loại ngay, dù đỉnh nhìn có vẻ đúng.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Dạng có $s=2t+-1$</b> — Đúng cả hai biên và chiều đồ thị; sau đó hệ số biên độ $A=2$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức cho $a$ trái dấu</b> — Sẽ đảo chiều so với chuyển động đồ thị quan sát được.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $b$ khác −1</b> — Khi thay $t=\frac{1}{2}$ không ra $s=0$ đồng thời $t=2$ không ra $s=3$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $A$ khác 2</b> — Không khớp độ cao các điểm đặc trưng của $x_{1}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cách tự kiểm mạnh nhất: thay cả hai đầu mút, các điểm gãy ở giữa và đỉnh; phải khớp vị trí LẪN giá trị biên độ.</div>
`
    },
    {
      id: '3-12', t: 3, n: 12, k: 'mc', c: 4, a: 1,
      im: [['3-12.webp', 835, 637]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x_{1}(t)=2x(t/2+\frac{3}{2})$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Mô tả hai đồ thị để tránh đoán: $x$ gốc [0,3], đỉnh 2; $x_{1}$ mới [−3,3], đỉnh 4. Đặt công thức tổng quát $x_{1}(t)=A\cdot x(s)$ với $s=at+b$.</p>
<p>Ghép cặp hai biên hỗ trợ sao cho đúng hình dáng: tại $t=-3$ phải có $s=0$; tại $t=3$ phải có $s=3$. Đây là hai phương trình $a\cdot (-3)+b=0$, $a\cdot (3)+b=3$.</p>
<p>Trừ hai phương trình: $a=(3-(0))/(3-(-3))=\frac{1}{2}$. Thay vào một phương trình tìm $b=\frac{3}{2}$. Do đó $s=1/2t+\frac{3}{2}$.</p>
<p>Giữ chiều, miền mới dài 6 gấp đôi miền gốc 3 ⇒ giãn 2 lần.</p>
<p>So độ cao đỉnh/hình dạng tương ứng: hệ số nhân biên độ $A=2$. Công thức cuối là $x_{1}(t)=2\cdot x(1/2t+\frac{3}{2})$.</p>
<p>Thử ngược hai biên sau khi tính: nếu một biên mới không quay về đúng biên cũ, công thức loại ngay, dù đỉnh nhìn có vẻ đúng.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Dạng có $s=1/2t+\frac{3}{2}$</b> — Đúng cả hai biên và chiều đồ thị; sau đó hệ số biên độ $A=2$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức cho $a$ trái dấu</b> — Sẽ đảo chiều so với chuyển động đồ thị quan sát được.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $b$ khác 3/2</b> — Khi thay $t=-3$ không ra $s=0$ đồng thời $t=3$ không ra $s=3$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $A$ khác 2</b> — Không khớp độ cao các điểm đặc trưng của $x_{1}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cách tự kiểm mạnh nhất: thay cả hai đầu mút, các điểm gãy ở giữa và đỉnh; phải khớp vị trí LẪN giá trị biên độ.</div>
`
    },
    {
      id: '3-13', t: 3, n: 13, k: 'mc', c: 4, a: 1,
      im: [['3-13.webp', 796, 639]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x_{1}(t)=x(-2t+4)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Mô tả hai đồ thị để tránh đoán: $x$ gốc [0,3], đỉnh 2; $x_{1}$ mới [1/2,2], đỉnh 2. Đặt công thức tổng quát $x_{1}(t)=A\cdot x(s)$ với $s=at+b$.</p>
<p>Ghép cặp hai biên hỗ trợ sao cho đúng hình dáng: tại $t=\frac{1}{2}$ phải có $s=3$; tại $t=2$ phải có $s=0$. Đây là hai phương trình $a\cdot \frac{1}{2}+b=3$, $a\cdot (2)+b=0$.</p>
<p>Trừ hai phương trình: $a=(0-(3))/(2-\frac{1}{2})=-2$. Thay vào một phương trình tìm $b=4$. Do đó $s=-2t+4$.</p>
<p>Miền bị nén 2 lần và đảo chiều, nhưng biên độ giữ nguyên.</p>
<p>So độ cao đỉnh/hình dạng tương ứng: hệ số nhân biên độ $A=1$. Công thức cuối là $x_{1}(t)=1\cdot x(-2t+4)$.</p>
<p>Thử ngược hai biên sau khi tính: nếu một biên mới không quay về đúng biên cũ, công thức loại ngay, dù đỉnh nhìn có vẻ đúng.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Dạng có $s=-2t+4$</b> — Đúng cả hai biên và chiều đồ thị; sau đó hệ số biên độ $A=1$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức cho $a$ trái dấu</b> — Sẽ đảo chiều so với chuyển động đồ thị quan sát được.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $b$ khác 4</b> — Khi thay $t=\frac{1}{2}$ không ra $s=3$ đồng thời $t=2$ không ra $s=0$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $A$ khác 1</b> — Không khớp độ cao các điểm đặc trưng của $x_{1}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cách tự kiểm mạnh nhất: thay cả hai đầu mút, các điểm gãy ở giữa và đỉnh; phải khớp vị trí LẪN giá trị biên độ.</div>
`
    },
    {
      id: '3-14', t: 3, n: 14, k: 'mc', c: 4, a: 2,
      im: [['3-14.webp', 706, 30], ['3-14b.webp', 706, 1006], ['3-14c.webp', 706, 105]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 2: $x_{1}(t)=x(2t+3)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Mô tả hai đồ thị để tránh đoán: $x$ gốc có mốc $s=-3,0,2,4$; $x_{1}$ có mốc $t=-3,-\frac{3}{2},-\frac{1}{2},\frac{1}{2}$. Đặt công thức tổng quát $x_{1}(t)=A\cdot x(s)$ với $s=at+b$.</p>
<p>Ghép cặp hai biên hỗ trợ sao cho đúng hình dáng: tại $t=-3$ phải có $s=-3$; tại $t=\frac{1}{2}$ phải có $s=4$. Đây là hai phương trình $a\cdot (-3)+b=-3$, $a\cdot \frac{1}{2}+b=4$.</p>
<p>Trừ hai phương trình: $a=(4-(-3))/(\frac{1}{2}-(-3))=2$. Thay vào một phương trình tìm $b=3$. Do đó $s=2t+3$.</p>
<p>Giữ chiều; ngoài hai đầu mút còn phải kiểm mốc $s=0\longleftrightarrow t=-\frac{3}{2}$ và $s=2\longleftrightarrow t=-\frac{1}{2}$.</p>
<p>So độ cao đỉnh/hình dạng tương ứng: hệ số nhân biên độ $A=1$. Công thức cuối là $x_{1}(t)=1\cdot x(2t+3)$.</p>
<p>Thử ngược hai biên sau khi tính: nếu một biên mới không quay về đúng biên cũ, công thức loại ngay, dù đỉnh nhìn có vẻ đúng.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Dạng có $s=2t+3$</b> — Đúng cả hai biên và chiều đồ thị; sau đó hệ số biên độ $A=1$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức cho $a$ trái dấu</b> — Sẽ đảo chiều so với chuyển động đồ thị quan sát được.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $b$ khác 3</b> — Khi thay $t=-3$ không ra $s=-3$ đồng thời $t=\frac{1}{2}$ không ra $s=4$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $A$ khác 1</b> — Không khớp độ cao các điểm đặc trưng của $x_{1}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cách tự kiểm mạnh nhất: thay cả hai đầu mút, các điểm gãy ở giữa và đỉnh; phải khớp vị trí LẪN giá trị biên độ.</div>
`
    },
    {
      id: '3-15', t: 3, n: 15, k: 'mc', c: 4, a: 2,
      im: [['3-15.webp', 767, 733], ['3-15b.webp', 767, 222]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 2: $x_{1}(t)=x(-2t+3)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Mô tả hai đồ thị để tránh đoán: $x$ gốc có mốc $s=-3,0,2,4$; $x_{1}$ đảo chiều với các mốc $t=-\frac{1}{2},\frac{1}{2},\frac{3}{2},3$. Đặt công thức tổng quát $x_{1}(t)=A\cdot x(s)$ với $s=at+b$.</p>
<p>Ghép cặp hai biên hỗ trợ sao cho đúng hình dáng: tại $t=-\frac{1}{2}$ phải có $s=4$; tại $t=3$ phải có $s=-3$. Đây là hai phương trình $a\cdot (-\frac{1}{2})+b=4$, $a\cdot (3)+b=-3$.</p>
<p>Trừ hai phương trình: $a=(-3-(4))/(3-(-\frac{1}{2}))=-2$. Thay vào một phương trình tìm $b=3$. Do đó $s=-2t+3$.</p>
<p>Đảo chiều nên a&lt;0; kiểm thêm $t=\frac{1}{2}\longleftrightarrow s=2$ và $t=\frac{3}{2}\longleftrightarrow s=0$.</p>
<p>So độ cao đỉnh/hình dạng tương ứng: hệ số nhân biên độ $A=1$. Công thức cuối là $x_{1}(t)=1\cdot x(-2t+3)$.</p>
<p>Thử ngược hai biên sau khi tính: nếu một biên mới không quay về đúng biên cũ, công thức loại ngay, dù đỉnh nhìn có vẻ đúng.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Dạng có $s=-2t+3$</b> — Đúng cả hai biên và chiều đồ thị; sau đó hệ số biên độ $A=1$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức cho $a$ trái dấu</b> — Sẽ đảo chiều so với chuyển động đồ thị quan sát được.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $b$ khác 3</b> — Khi thay $t=-\frac{1}{2}$ không ra $s=4$ đồng thời $t=3$ không ra $s=-3$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $A$ khác 1</b> — Không khớp độ cao các điểm đặc trưng của $x_{1}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cách tự kiểm mạnh nhất: thay cả hai đầu mút, các điểm gãy ở giữa và đỉnh; phải khớp vị trí LẪN giá trị biên độ.</div>
`
    },
    {
      id: '3-16', t: 3, n: 16, k: 'mc', c: 4, a: 2,
      im: [['3-16.webp', 767, 30], ['3-16b.webp', 767, 1076], ['3-16c.webp', 767, 105]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 2: $x_{1}(t)=x(-2t-3)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Mô tả hai đồ thị để tránh đoán: $x$ gốc hỗ trợ $s\in [-6,1]$; $x_{1}$ hỗ trợ $t\in [-2,\frac{3}{2}]$. Đặt công thức tổng quát $x_{1}(t)=A\cdot x(s)$ với $s=at+b$.</p>
<p>Ghép cặp hai biên hỗ trợ sao cho đúng hình dáng: tại $t=-2$ phải có $s=1$; tại $t=\frac{3}{2}$ phải có $s=-6$. Đây là hai phương trình $a\cdot (-2)+b=1$, $a\cdot \frac{3}{2}+b=-6$.</p>
<p>Trừ hai phương trình: $a=(-6-(1))/(\frac{3}{2}-(-2))=-2$. Thay vào một phương trình tìm $b=-3$. Do đó $s=-2t+-3$.</p>
<p>Đảo chiều và nén 2 lần; mốc gốc −1 đối ứng $t=-1$, mốc −3 đối ứng $t=0$.</p>
<p>So độ cao đỉnh/hình dạng tương ứng: hệ số nhân biên độ $A=1$. Công thức cuối là $x_{1}(t)=1\cdot x(-2t+-3)$.</p>
<p>Thử ngược hai biên sau khi tính: nếu một biên mới không quay về đúng biên cũ, công thức loại ngay, dù đỉnh nhìn có vẻ đúng.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Dạng có $s=-2t+-3$</b> — Đúng cả hai biên và chiều đồ thị; sau đó hệ số biên độ $A=1$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức cho $a$ trái dấu</b> — Sẽ đảo chiều so với chuyển động đồ thị quan sát được.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $b$ khác −3</b> — Khi thay $t=-2$ không ra $s=1$ đồng thời $t=\frac{3}{2}$ không ra $s=-6$.</li>
<li><span class="vd qbad">SAI</span><b>Công thức có $A$ khác 1</b> — Không khớp độ cao các điểm đặc trưng của $x_{1}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Cách tự kiểm mạnh nhất: thay cả hai đầu mút, các điểm gãy ở giữa và đỉnh; phải khớp vị trí LẪN giá trị biên độ.</div>
`
    },
    {
      id: '3-17', t: 3, n: 17, k: 'num', a: 1, d: "1",
      im: [['3-17.webp', 851, 85]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Giá trị cần điền: 1.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề cho $x(t)=t^{2}$. Các phép làm theo THỨ TỰ: dịch sang phải 2, rồi giãn thời gian tỉ lệ 2 quanh gốc $t=0$; cuối cùng lấy giá trị tại $t=2$.</p>
<p>Dịch phải 2 đơn vị: đối số $t$ đổi thành t−2; $z(t)=x(t-2)=(t-2)^{2}$. Kiểm: đỉnh ban đầu $t=0$ chuyển sang $t=2$.</p>
<p>Giãn 2 lần quanh gốc: thay $t$ bằng t/2 trong tín hiệu đang có, không phải thay ngay trong $x$ gốc: $y(t)=z\frac{t}{2}$.</p>
<p>Vậy $y(t)=(t/2-2)^{2}$. Tại thời điểm yêu cầu $t=2$, đối số trong ngoặc bằng $\frac{2}{2}-2=-1$.</p>
<p>$y(2)=(-1)^{2}=1$.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Chọn mốc đỉnh: sau dịch đỉnh ở 2, sau giãn nó ở 4; với hàm parabol mở lên, tại $t=2$ cách đỉnh 2 đơn vị, chiều cao $\frac{2}{2}^{2}=1$. Khác câu sau vì phép giãn và dịch KHÔNG giao hoán.</div>
`
    },
    {
      id: '3-18', t: 3, n: 18, k: 'num', a: 4, d: "4",
      im: [['3-18.webp', 818, 84]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Giá trị cần điền: 4.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề cho $x(t)=t^{2}$ nhưng thứ tự bây giờ đảo: GIÃN trước, rồi DỊCH TRÁI 2.</p>
<p>Giãn thời gian gấp 2 quanh 0: $z(t)=x\frac{t}{2}=\frac{t}{2}^{2}=t^{2}/4$.</p>
<p>Dịch sang trái 2 đơn vị nghĩa là thay $t$ bằng t+2 trong $z$: $y(t)=z(t+2)=((t+2)/2)^{2}$.</p>
<p>Thế $t=2$: $(2+2)/2=2$, bình phương được $y(2)=4$.</p>
<p>Đối chiếu câu 3.17: câu kia cho $(t/2-2)^{2}$ và được 1; ở đây $((t+2)/2)^{2}$ và được 4. Không thể đổi thứ tự phép toán.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm bằng điểm cố định: đỉnh $x$ ở $t=0$; sau giãn vẫn ở 0; sau dịch trái 2 ở $t=-2$. Tại $t=2$ cách đỉnh 4 đơn vị, ở trục thời gian gốc là 2 → chiều cao $2^{2}=4$.</div>
`
    },
    {
      id: '3-19', t: 3, n: 19, k: 'num', a: 16, d: "16",
      im: [['3-19.webp', 852, 85]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Giá trị cần điền: 16.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$y(t)=x(a\cdot t+b)$: mốc $s$ của $x$ chuyển sang $t=(s-b)/a$. Nếu a&lt;0: có lật thời gian; |a|&gt;1: nén; 0&lt;|a|&lt;1: giãn.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x(t)=(t-2)^{2}$. Lần lượt giãn 2, lật qua trục tung $t=0$, rồi dịch sang trái 2; cần giữ nguyên thứ tự từng thao tác.</p>
<p>Bước 1 — giãn 2: $z(t)=x\frac{t}{2}=(\frac{t}{2}-2)^{2}$.</p>
<p>Bước 2 — lật thời gian: $w(t)=z(-t)=((-t/2)-2)^{2}$. Đây là lật TRỤC THỜI GIAN (đối số $t\to -t)$, không nhân giá trị tín hiệu với −1.</p>
<p>Bước 3 — dịch trái 2: $y(t)=w(t+2)=[-(t+2)/2-2]^{2}$.</p>
<p>Tính tại $t=2$: $-(2+2)/2-2=-2-2=-4$; bình phương $(-4)^{2}=16$.</p>
<p>Có thể kiểm bằng việc truy ngược đối số từ thời điểm cuối: $t=2 \to t+2=4 \to$ lật thành −4 → giãn lấy −2 → thay vào $x(-2)=(-2-2)^{2}=16$.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Thứ tự truy ngược đối số giúp không nhầm: 2 → 4 → −4 → −2 $\to x(-2)=16$.</div>
`
    },
    {
      id: '4-1', t: 4, n: 1, k: 'num', a: 0, d: "0 (không tuần hoàn)",
      im: [['4-1.webp', 820, 97]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">0 — Không tuần hoàn.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Liên tục: $T_{i}=2\pi /|\omega _{i}|$ và $T$ chung nếu tỉ số các tần số hữu tỉ. Rời rạc: $\Omega \cdot N=2\pi \cdot k$ với N,k nguyên, N&gt;0; $\Omega _{0}=2\pi /N_{0}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x(t)=2\cos (t)-\sin (5\pi t)$. Hai thành phần là sinusoids liên tục, có tần số góc $\omega _{1}=1$ và $\omega _{2}=5\pi$.</p>
<p>Tính chu kỳ riêng: $T_{1}=2\pi /|\omega _{1}|=2\pi$; $T_{2}=2\pi /(5\pi )=\frac{2}{5}$.</p>
<p>Để tổng có chu kỳ $T$, cần $T$ là bội nguyên dương đồng thời của cả $T_{1}$ và $T_{2}$: $T=m\cdot 2\pi =n\cdot \frac{2}{5}$, $m,n\in \mathbb{N}*$.</p>
<p>Rút gọn $m\cdot 2\pi =n\cdot \frac{2}{5} \implies 5\pi =n/m$. Vế phải hữu tỉ (tỉ số hai số nguyên), vế trái vô tỉ; không thể xảy ra.</p>
<p>Do đó $x(t)$ không tuần hoàn. Đề yêu cầu ghi 0 nếu không tuần hoàn ⇒ đáp số 0.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Điểm quan trọng: không được thay $\pi =3,14$ ngay ở bước kiểm tính tuần hoàn. 3,14 là xấp xỉ hữu tỉ, sẽ tạo chu kỳ giả không có ở tín hiệu thật.</div>
`
    },
    {
      id: '4-2', t: 4, n: 2, k: 'num', a: 0, d: "0 (không tuần hoàn)",
      im: [['4-2.webp', 820, 97]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">0 — Không tuần hoàn.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Liên tục: $T_{i}=2\pi /|\omega _{i}|$ và $T$ chung nếu tỉ số các tần số hữu tỉ. Rời rạc: $\Omega \cdot N=2\pi \cdot k$ với N,k nguyên, N&gt;0; $\Omega _{0}=2\pi /N_{0}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x[n]=\cos (\pi n)-\cos (2n+\frac{\pi }{3})$. Khác tín hiệu liên tục, một sinusoids RỜI RẠC chỉ tuần hoàn nếu có $N$ nguyên dương với $\Omega N=2\pi m$ (m nguyên).</p>
<p>Thành phần thứ nhất $\cos (\pi n)=(-1)^{n}$; $N_{1}=2$ là chu kỳ nhỏ nhất.</p>
<p>Với $\cos (2n+\frac{\pi }{3})$, nếu chu kỳ $N$ tồn tại thì $2N=2\pi m \implies N=\pi m$. Vì $\pi$ vô tỉ nên không có $N$ nguyên dương khác 0 thỏa.</p>
<p>Một thành phần không tuần hoàn không được triệt tiêu bởi thành phần $\cos (\pi n)$ có tần số khác; tổng không thể có $N$ chung.</p>
<p>Nhập 0 theo quy ước của bài.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Đừng nhầm điều kiện cos có giai đoạn lặp theo pha với “N thực”: trong thời gian rời rạc $N$ bắt buộc là số nguyên mẫu.</div>
`
    },
    {
      id: '4-3', t: 4, n: 3, k: 'num', a: 12, d: "12",
      im: [['4-3.webp', 825, 49]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$T =$ 12.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Liên tục: $T_{i}=2\pi /|\omega _{i}|$ và $T$ chung nếu tỉ số các tần số hữu tỉ. Rời rạc: $\Omega \cdot N=2\pi \cdot k$ với N,k nguyên, N&gt;0; $\Omega _{0}=2\pi /N_{0}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x(t)=\cos \frac{\pi t}{2}\cdot \sum _{k=-\infty }^\infty \delta (t-3k)$. Quy tắc lấy mẫu bằng xung Dirac: $f(t)\delta (t-a)=f(a)\delta (t-a)$.</p>
<p>Do đó $x(t)=\sum_k \cos [\frac{\pi }{2}\cdot 3k]\delta (t-3k)=\sum_k \cos \frac{3\pi k}{2}\delta (t-3k)$.</p>
<p>Liệt kê trọng số tại các xung $k=0,1,2,3,4$: 1,0,−1,0,1. Mẫu trọng số lặp sau 4 lần $k$.</p>
<p>Các xung có vị trí cách nhau 3 đơn vị thời gian. Để lặp cả vị trí lẫn trọng số, dịch $4\cdot 3=12$ đơn vị.</p>
<p>Vì dịch 3 hay 6 chỉ đổi trọng số 1 thành 0 hoặc −1, không thể là chu kỳ cơ sở. Vậy $T_{0}=12$.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Phân biệt chu kỳ của cos riêng $T_{\\cos }=4$ với khoảng xung $T_{\text\{imp\}}=3$: không lấy $\text{BCNN}(4,3)$ một cách máy móc khi phần cos chỉ được lấy mẫu tại $t=3k$; ở đây vẫn được 12 nhờ kiểm dãy trọng số.</div>
`
    },
    {
      id: '4-4', t: 4, n: 4, k: 'num', a: 0, d: "0 (không tuần hoàn)",
      im: [['4-4.webp', 831, 87]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">0 — Không tuần hoàn.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Liên tục: $T_{i}=2\pi /|\omega _{i}|$ và $T$ chung nếu tỉ số các tần số hữu tỉ. Rời rạc: $\Omega \cdot N=2\pi \cdot k$ với N,k nguyên, N&gt;0; $\Omega _{0}=2\pi /N_{0}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x[n]=\sin \frac{n}{2}+\cos \frac{n}{3}$, với hai tần số góc rời rạc $\Omega _{1}=\frac{1}{2}$ và $\Omega _{2}=\frac{1}{3}$ rad/mẫu.</p>
<p>Điều kiện chu kỳ của một hàm mũ/sin rời rạc: tồn tại $N\in \mathbb{N}*$ sao cho $e^{j\Omega N}=1$, tương đương $\Omega N=2\pi m$.</p>
<p>Với $\Omega _{1}=\frac{1}{2}$, $N/2=2\pi m \implies N=4\pi m$. Vì $\pi$ vô tỉ, $N$ không thể là số nguyên dương.</p>
<p>Tương tự $\Omega _{2}=\frac{1}{3} \implies N=6\pi m$, cũng không nguyên dương. Không có một $N$ làm lặp các thành phần.</p>
<p>Tín hiệu không tuần hoàn; theo đề, tần số góc cơ sở ghi 0.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Tỉ số $\frac{1}{2}/\frac{1}{3}=\frac{3}{2}$ là hữu tỉ KHÔNG đủ để hai tín hiệu rời rạc tuần hoàn: từng tần số còn phải là bội hữu tỉ của $2\pi$.</div>
`
    },
    {
      id: '4-5', t: 4, n: 5, k: 'num', a: 0.52, d: "0,52 (π/6)",
      im: [['4-5.webp', 822, 147]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$\Omega _{0} = \frac{\pi }{6} \approx$ 0,52 rad/mẫu.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Liên tục: $T_{i}=2\pi /|\omega _{i}|$ và $T$ chung nếu tỉ số các tần số hữu tỉ. Rời rạc: $\Omega \cdot N=2\pi \cdot k$ với N,k nguyên, N&gt;0; $\Omega _{0}=2\pi /N_{0}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Tín hiệu là tổ hợp $\sin \frac{\pi n}{2}$ và $\cos \frac{\pi n}{3}$. Hai tần số đã chứa $\pi$, vì thế điều kiện $\Omega N/(2\pi )$ nguyên có thể thỏa.</p>
<p>Thành phần sin: $\frac{\pi }{2}N=2\pi m \implies N=4m$, chu kỳ riêng nhỏ nhất 4.</p>
<p>Thành phần cos: $\frac{\pi }{3}N=2\pi m \implies N=6m$, chu kỳ riêng nhỏ nhất 6.</p>
<p>Chu kỳ tổng phải chia hết cho cả 4 và 6. $\text{BCNN}(4,6)=12 \implies N_{0}=12$ mẫu.</p>
<p>Tần số góc cơ sở $\Omega _{0}=2\pi /N_{0}=2\pi /12=\frac{\pi }{6}\approx 0,5235988$ rad/mẫu.</p>
<p>Làm tròn hai chữ số sau dấu phẩy là 0,52.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm $\Omega _{0}$: các thành phần có bậc $3\Omega _{0}=\frac{\pi }{2}$ và $2\Omega _{0}=\frac{\pi }{3}$, đúng các tần số gốc.</div>
`
    },
    {
      id: '4-6', t: 4, n: 6, k: 'num', a: 1.05, d: "1,05 (π/3)",
      im: [['4-6.webp', 853, 104]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$\omega _{0} = \frac{\pi }{3} \approx$ 1,05 rad/s.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Liên tục: $T_{i}=2\pi /|\omega _{i}|$ và $T$ chung nếu tỉ số các tần số hữu tỉ. Rời rạc: $\Omega \cdot N=2\pi \cdot k$ với N,k nguyên, N&gt;0; $\Omega _{0}=2\pi /N_{0}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề gồm hai đoàn xung tuần hoàn có khoảng lặp riêng $T_{1}=\frac{3}{4}$ giây và $T_{2}=2$ giây. Do xung có khoảng cách cố định, chu kỳ chung $T$ phải là bội số nguyên của cả hai khoảng.</p>
<p>Đặt $T=m\frac{3}{4}=n\cdot 2$ với m,n nguyên dương. Nhân 4: $3m=8n$.</p>
<p>Để $m$ và $n$ nhỏ nhất, chọn $m=8$ và $n=3$ vì $3\cdot 8=8\cdot 3=24$.</p>
<p>Suy ra $T_{0}=8\cdot \frac{3}{4}=6 s =3\cdot 2. T=6$ là chu kỳ chung nhỏ nhất.</p>
<p>Tần số góc cơ sở $\omega _{0}=2\pi /T_{0}=2\pi /6=\frac{\pi }{3}\approx 1,0471976$ rad/s ⇒ 1,05.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Phương pháp chung với chu kỳ phân số: quy về phương trình $mT_{1}=nT_{2}$, giải tỉ số nguyên; không trực tiếp bấm BCNN trên máy tính cho số thập phân.</div>
`
    },
    {
      id: '4-7', t: 4, n: 7, k: 'num', a: 0, d: "0 (không tuần hoàn)",
      im: [['4-7.webp', 843, 61]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">0 — Không tuần hoàn.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Liên tục: $T_{i}=2\pi /|\omega _{i}|$ và $T$ chung nếu tỉ số các tần số hữu tỉ. Rời rạc: $\Omega \cdot N=2\pi \cdot k$ với N,k nguyên, N&gt;0; $\Omega _{0}=2\pi /N_{0}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Tín hiệu $x(t)=\cos (2t)\sum_k \delta (t-k)$. Nhân với đoàn xung cho $x(t)=\sum_k \cos (2k)\delta (t-k)$.</p>
<p>Vì các xung đặt tại mọi số nguyên, mọi chu kỳ $T$ phải dịch tập các vị trí nguyên sang chính nó; vì vậy $T=N$ nguyên dương.</p>
<p>Trọng số cũng phải trùng: $\cos [2(k+N)]=\cos (2k)$ với mọi $k$. Điều kiện phù hợp là $2N=2\pi m (m\in \mathbb{Z})$.</p>
<p>Rút ra $N=\pi m. \pi$ vô tỉ nên không có $N$ nguyên dương như vậy.</p>
<p>Tín hiệu không tuần hoàn; điền 0 theo yêu cầu đề.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Có thể $\cos (2t)$ liên tục tuần hoàn với $T=\pi$, nhưng đoàn xung chỉ bất biến khi dịch nguyên số giây. Hai chu kỳ không tương thích.</div>
`
    },
    {
      id: '4-8', t: 4, n: 8, k: 'num', a: 0, d: "0",
      im: [['4-8.webp', 841, 59]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đề không định nghĩa một tín hiệu hữu hạn: tổng xung phân kỳ tại $n=\pm 1$. Nếu quiz buộc nhập 0, đó chỉ là quy ước làm bài, không phải một kết luận toán học được chứng minh.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Liên tục: $T_{i}=2\pi /|\omega _{i}|$ và $T$ chung nếu tỉ số các tần số hữu tỉ. Rời rạc: $\Omega \cdot N=2\pi \cdot k$ với N,k nguyên, N&gt;0; $\Omega _{0}=2\pi /N_{0}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề có hai tổng xung. Tổng thứ nhất $\sum_k \delta [n-2k]$ là dãy chỉ có xung tại $n$ chẵn, chu kỳ $N=2$; bản thân tổng này hoàn toàn hợp lệ.</p>
<p>Tổng thứ hai có dạng $\sum _{k=-\infty }^\infty \delta [n+(-1)^{k}]$. Khi $k$ chẵn, $(-1)^{k}=1$, nên mọi số hạng chẵn đều là $\delta [n+1]$ (đều đóng vào vị trí $n=-1)$.</p>
<p>Khi $k$ lẻ, $(-1)^{k}=-1$, nên mọi số hạng lẻ đều là $\delta [n-1]$ (đều đóng vào $n=+1)$.</p>
<p>Có vô hạn $k$ chẵn và vô hạn $k$ lẻ: tại $n=-1$ và $n=1$, tổng chứa 1+1+1+… không hội tụ; không có giá trị biên độ hữu hạn.</p>
<p>Một biểu thức không xác định dãy có giá trị hữu hạn thì không thể bàn chu kỳ cơ sở theo định nghĩa chuẩn $x[n+N]=x[n]$.</p>
<p>Nếu hệ thống trắc nghiệm chỉ cho nhập số và quy ước 0 cho “không tuần hoàn”, 0 là cách điền khả dĩ; nhưng về toán học kết luận nghiêm ngặt phải là “tín hiệu không được định nghĩa hợp lệ”, không phải chứng minh không tuần hoàn.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm tại $n=1$: $\delta [1-1]=\delta [0]=1$ cho MỌI $k$ lẻ → tổng phân kỳ. Việc này quan trọng hơn mọi phép tính BCNN.</div>
<div class="qcheck" style="border-left-color:var(--c4)"><b>Lưu ý quan trọng:</b> Đây là đề thiếu chặt chẽ/nhầm chỉ số: không nên coi 0 là đáp án toán học đã được chứng minh.</div>
<div class="qcheck" style="border-left-color:var(--c4)"><b>Lưu ý bổ sung:</b> Câu hỏi trong PDF có vấn đề định nghĩa tổng vô hạn, không thể kết luận một chu kỳ cơ sở hữu hạn theo nghĩa toán học thông thường.</div>
`
    },
    {
      id: '4-9', t: 4, n: 9, k: 'num', a: 4, d: "4",
      im: [['4-9.webp', 829, 83]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">$N =$ 4 mẫu.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Liên tục: $T_{i}=2\pi /|\omega _{i}|$ và $T$ chung nếu tỉ số các tần số hữu tỉ. Rời rạc: $\Omega \cdot N=2\pi \cdot k$ với N,k nguyên, N&gt;0; $\Omega _{0}=2\pi /N_{0}$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Tín hiệu rời rạc $x[n]=j^{3n}$. Viết $j=e^{j\pi /2}$ nên $x[n]=(e^{j\pi /2})^{3n}=e^{j\frac{3\pi }{2}n}$.</p>
<p>Điều kiện chu kỳ $N$ nguyên dương: $x[n+N]=x[n] \iff e^{j\frac{3\pi }{2}N}=1$.</p>
<p>Vì $e^{j\theta }=1$ khi $\theta =2\pi m$, ta được $\frac{3\pi }{2}N=2\pi m \implies 3N=4m$.</p>
<p>Các số nguyên nhỏ nhất thỏa là $N=4$, $m=3$ (vì 3 và 4 nguyên tố cùng nhau).</p>
<p>Thử trực tiếp $x[n+4]/x[n]=j^{3\cdot 4}=j^{12}=(j^{4})^{3}=1$; $N=1,2,3$ không cho 1. Vậy $N_{0}=4$ mẫu.</p>
</div>
<div class="qsec-title">3. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Công thức chung: nếu $\Omega /(2\pi )=p/q$ đã tối giản thì chu kỳ cơ sở của $e^{j\Omega n}$ là $q$; ở đây 3/4 nên $N_{0}=4$.</div>
`
    },
    {
      id: '5-1', t: 5, n: 1, k: 'mc', c: 4, a: 4,
      im: [['5-1.webp', 1131, 284]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 4 là phát biểu KHÔNG ĐÚNG: $2^{n}u[n]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $4y[n]-y[n-2]=2^{-n}u[n]$. Để biết đáp ứng cưỡng bách (zero-state) có thể chứa các mốt nào, trước hết xét phương trình thuần nhất $4y[n]-y[n-2]=0$.</p>
<p>Thử $y[n]=r^{n} (r\neq 0)$: $4r^{n}-r^{n-2}=r^{n-2}(4r^{2}-1)=0 \implies 4r^{2}-1=0 \implies r=+\frac{1}{2}$ hoặc $r=-\frac{1}{2}$.</p>
<p>Vì đầu vào có cơ số 1/2 trùng một nghiệm, nghiệm riêng không thể chỉ có $C\frac{1}{2}^{n}$; phải thử $C\cdot n\frac{1}{2}^{n}$ (cộng hưởng). Các mốt $2^{-n}$, $(-\frac{1}{2})^{n}$ và $n2^{-n}$ đều có thể xuất hiện.</p>
<p>Chứng minh bằng đáp ứng zero-state: viết $y[n]=\frac{1}{4}x[n]+\frac{1}{4}y[n-2]$ rồi lặp $m$ lần: $y[n]=\sum _{m=0}^{\lfloor n/2\rfloor }\frac{1}{4}^{m+1}\cdot 2^{-(n-2m)}=(\lfloor n/2\rfloor +1)\cdot 2^{-n}/4$, $n\ge 0$.</p>
<p>Tách phần chẵn/lẻ với $\lfloor n/2\rfloor =n/2-\frac{1}{4}+(-1)^{n}/4$. Từ đó $y[n]=[\frac{n}{8}+\frac{3}{16}+(-1)^{n}/16]\cdot 2^{-n}u[n]$.</p>
<p>Hạng thứ nhất $n2^{-n}$, thứ hai $2^{-n}$, thứ ba $(-1)^{n2}^{-n}$ đều có mặt. Không hề có $2^{n}$ vì $r=2$ không phải cực của hệ hoặc mốt của đầu vào.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $2^{-n}u[n]$</b> — Trong biểu thức tách có hệ số $\frac{3}{16}2^{-n}$.</li>
<li><span class="vd qok">ĐÚNG THEO CÁCH HIỂU MỐT</span><b>2. Mốt có dấu âm/cơ số −1/2</b> — Trong biểu thức có $\frac{1}{16}(-\frac{1}{2})^{n}$. Nếu đáp án PDF viết $\text{“}-2^{-n}\text{”}$ như phép đổi dấu toàn bộ thì đó chỉ là bội của $2^{-n}$, vẫn thuộc cùng dạng mốt.</li>
<li><span class="vd qok">ĐÚNG</span><b>3. $n2^{-n}u[n]$</b> — Hệ số n/8 xuất hiện do cộng hưởng nghiệm $r=\frac{1}{2}$.</li>
<li><span class="vd qok">SAI — CHỌN</span><b>4. $2^{n} u[n]$</b> — Không có $r=2$; đưa $2^{n}$ vào thuần nhất cho $(4\cdot 4-1)2^{n-2}\neq 0$ và không thể trùng dạng đầu vào.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm trực tiếp $n=0$: $y[0]=(0+1)/4=\frac{1}{4}$, đúng $4y[0]=x[0]=1. n=1$: $y[1]=(0+1)\cdot \frac{1}{2}/4=\frac{1}{8}$, đúng $4y[1]=x[1]=\frac{1}{2}$.</div>
<div class="qcheck" style="border-left-color:var(--c4)"><b>Lưu ý quan trọng:</b> Một số câu mô tả “thành phần đáp ứng cưỡng bách” theo tập các mốt có thể xuất hiện, không nhất thiết từng mốt phải có đúng hệ số $\pm 1$ như cách lựa chọn viết.</div>
`
    },
    {
      id: '5-2', t: 5, n: 2, k: 'mc', c: 4, a: 3,
      im: [['5-2.webp', 1086, 169], ['5-2b.webp', 1086, 107]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 3 là phát biểu KHÔNG ĐÚNG: $n\cdot 2^{-n}u[n]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]-4y[n-2]=2^{-n}u[n]$. Phương trình thuần nhất có phương trình đặc trưng $r^{2}-4=0$.</p>
<p>Giải nghiệm đặc trưng: $r=+2$ và $r=-2 \implies$ hai mốt tự nhiên $2^{n}$ và $(-2)^{n}$.</p>
<p>Đầu vào có cơ số 1/2 không trùng $\pm 2$. Vì thế nghiệm riêng có dạng $C\frac{1}{2}^{n}$, KHÔNG cần nhân thêm $n$.</p>
<p>Để kiểm thật chắc, dùng đầu kiện nghỉ $y[-1]=y[-2]=0$: $y[0]=1$; $y[1]=\frac{1}{2}$; $y[2]=4y[0]+\frac{1}{4}=\frac{17}{4}$.</p>
<p>Giả sử $y[n]=A2^{n}+B(-2)^{n}+C\frac{1}{2}^{n}$ và thế $n=0,1,2$: $A+B+C=1$; $2A-2B+C/2=\frac{1}{2}$; $4A+4B+C/4=\frac{17}{4}$.</p>
<p>Giải hệ: $A=\frac{2}{3}$, $B=\frac{2}{5}$, $C=-\frac{1}{15}$. Thật vậy $y[n]=[\frac{2}{3}2^{n}+\frac{2}{5}(-2)^{n}-\frac{1}{15}2^{-n}]u[n]$. Không có $n2^{-n}$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $2^{-n}u[n]$</b> — Có hệ số $C=-\frac{1}{15}$ đi cùng $2^{-n}$.</li>
<li><span class="vd qok">ĐÚNG</span><b>2. $(-2)^{n} u[n]$</b> — Có hệ số $B=\frac{2}{5}$ đi cùng $(-2)^{n}$.</li>
<li><span class="vd qok">SAI — CHỌN</span><b>3. $n2^{-n}u[n]$</b> — Cộng hưởng chỉ xảy ra khi 1/2 là nghiệm đặc trưng, nhưng nghiệm là $\pm 2$.</li>
<li><span class="vd qok">ĐÚNG</span><b>4. $2^{n} u[n]$</b> — Có hệ số $A=\frac{2}{3}$ đi cùng $2^{n}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm bằng ba mẫu $n=0,1,2$ khớp 1; 1/2; 17/4. Câu này cũng cho thấy chỉ thuộc lòng nghiệm riêng là chưa đủ: các mốt tự nhiên vẫn xuất hiện trong đáp ứng trạng thái nghỉ.</div>
`
    },
    {
      id: '5-3', t: 5, n: 3, k: 'mc', c: 4, a: 1,
      im: [['5-3.webp', 1103, 292]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1 là phát biểu KHÔNG ĐÚNG: $t\cdot e^{t}u(t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y'''+y''-y'-y=e^{-t}u(t)$. Với hệ nhân quả ở trạng thái nghỉ, dùng biến đổi Laplace để xác định rõ tất cả các số hạng.</p>
<p>Đa thức đặc trưng $P(s)=s^{3}+s^{2}-s-1=(s+1)(s^{2}-1)=(s+1)^{2}(s-1)$. Vậy nghiệm −1 có bội 2; nghiệm +1 bội 1.</p>
<p>Đầu vào $e^{-t}u(t)$ có $X(s)=1/(s+1)$; $H(s)=1/P(s)$. Từ $Y(s)=H(s)X(s)=1/[(s+1)^{3}(s-1)]$.</p>
<p>Phân tích phân thức: $Y(s)=1/[8(s-1)]-1/[8(s+1)]-1/[4(s+1)^{2}]-1/[2(s+1)^{3}]$.</p>
<p>Biến đổi Laplace ngược: $y(t)=[\frac{1}{8}e^{t}-\frac{1}{8}e^{-t}-\frac{1}{4}t e^{-t}-\frac{1}{4}t^{2}e^{-t}]u(t)$.</p>
<p>Như vậy có $e^{-t}$, $t e^{-t}$, $t^{2} e^{-t}$ và $e^{t}$. KHÔNG có $t e^{t}$ vì tại $s=1$ chỉ có cực bậc một.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">SAI — CHỌN</span><b>1. $t e^{t}u(t)$</b> — Cần cực bậc hai tại $s=1$ để sinh $t e^{t}$; ở đây $s=1$ chỉ bậc một.</li>
<li><span class="vd qok">ĐÚNG</span><b>2. $t e^{-t}u(t)$</b> — Có hạng −(1/4)t $e^{-t}$ từ $1/(s+1)^{2}$.</li>
<li><span class="vd qok">ĐÚNG</span><b>3. $t^{2}e^{-t}u(t)$</b> — Có hạng $-\frac{1}{4}t^{2}e^{-t}$ từ $1/(s+1)^{3}$.</li>
<li><span class="vd qok">ĐÚNG</span><b>4. $e^{-t}u(t)$</b> — Có hạng $-\frac{1}{8}e^{-t}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Quy tắc cực lặp: $1/(s-p)^{m}$ ↔ $t^{m-1}e^{pt}/(m-1)!$. Hạng $t e^{t}$ chỉ có khi $p=1$ là cực bậc $\ge 2$.</div>
`
    },
    {
      id: '5-4', t: 5, n: 4, k: 'mc', c: 4, a: 3,
      im: [['5-4.webp', 1091, 293]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 3 là phát biểu KHÔNG ĐÚNG: $t^{2}e^{t}u(t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề cùng hệ $y'''+y''-y'-y=x(t)$ nhưng $x(t)=e^{t}u(t)$. Đa thức hệ $P(s)=(s+1)^{2}(s-1)$.</p>
<p>Đầu vào có $X(s)=1/(s-1)$. Vì $H(s)=1/[(s+1)^{2}(s-1)]$, ta có $Y(s)=1/[(s+1)^{2}(s-1)^{2}]$.</p>
<p>Tại $s=1$ tổng số cực là 2 (một cực hệ + một cực đầu vào), nên đáp ứng chứa $e^{t}$ và $t e^{t}$ nhưng không $t^{2}e^{t}$.</p>
<p>Phân tích cụ thể: $Y(s)=1/[4(s+1)]+1/[4(s+1)^{2}]-1/[4(s-1)]+1/[4(s-1)^{2}]$.</p>
<p>Lấy ngược: $y(t)=[\frac{1}{4}e^{-t}+\frac{1}{4}t e^{-t}-\frac{1}{4}e^{t}+\frac{1}{4}t e^{t}]u(t)$.</p>
<p>So từng dạng trong đáp án: $t e^{t}$ có; $t e^{-t}$ có; $t^{2}e^{t}$ KHÔNG; $e^{-t}$ có.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $t e^{t}u(t)$</b> — Hệ có cực bậc hai $s=1$ sau nhân đầu vào; hệ số +1/4.</li>
<li><span class="vd qok">ĐÚNG</span><b>2. $t e^{-t}u(t)$</b> — Từ cực bậc hai $s=-1$; hệ số +1/4.</li>
<li><span class="vd qok">SAI — CHỌN</span><b>3. $t^{2}e^{t}u(t)$</b> — Cần cực bậc ba $s=1$ để có $t^{2}$; biểu thức $Y(s)$ chỉ có $(s-1)^{2}$.</li>
<li><span class="vd qok">ĐÚNG</span><b>4. $e^{-t}u(t)$</b> — Từ cực đơn $s=-1$ trong phân tích; hệ số +1/4.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm: tổng các hệ số ở $t=0$ là $\frac{1}{4}-\frac{1}{4}=0$ như điều kiện đầu trạng thái nghỉ.</div>
`
    },
    {
      id: '5-5', t: 5, n: 5, k: 'mc', c: 4, a: 1,
      im: [['5-5.webp', 1091, 289]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y_{s}(t)=[1-3e^{-2t}+2e^{-3t}]u(t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y''+5y'+6y=6u(t)$, hệ nhân quả trạng thái nghỉ. Trước hết đưa về miền Laplace, các điều kiện ban đầu bằng 0.</p>
<p>$L\{y''\}=s^{2}Y$, $L\{y'\}=sY$, $L\{u\}=1/s$. Do đó $(s^{2}+5s+6)Y=6/s \implies Y(s)=6/[s(s+2)(s+3)]$.</p>
<p>Tách phân thức A/s+B/(s+2)+C/(s+3). Lấy $s=0 \implies A=1$; lấy $s=-2 \implies B=-3$; lấy $s=-3 \implies C=2$.</p>
<p>$Y(s)=1/s-3/(s+2)+2/(s+3)$. Tra cặp $L^{-1}$: $1/s\longleftrightarrow u(t)$, $1/(s+a)\longleftrightarrow e^{-at}u(t)$.</p>
<p>$y_{s}(t)=[1-3e^{-2t}+2e^{-3t}]u(t)$.</p>
<p>Kiểm $t=0^{+}$: $1-3+2=0$, nên $y$ không nhảy từ trạng thái nghỉ; đạo hàm tại $0^{+}$ là $+6-6=0$, đúng với bộ lọc bậc hai tác động bởi bước.</p>
<p>Loại phương án khác: hệ có cực $s=-2,-3$, không có cực $s=-5$ hoặc +2,+3; giá trị cuối phải bằng $\frac{6}{6}=1$ (thế $y$ hằng vào $6y=6)$, giúp loại đáp án thiếu hằng 1 hoặc tăng vô hạn.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $1-3e^{-2t}+2e^{-3t}$</b> — Khớp các cực, giá trị đầu và giá trị cuối.</li>
<li><span class="vd qbad">SAI</span><b>2. $-e^{-2t}+3e^{-5t}$</b> — Chứa cực −5 không thuộc mẫu (s+2)(s+3), và cuối về 0 thay vì 1.</li>
<li><span class="vd qbad">SAI</span><b>3. $1+2e^{-2t}-e^{-3t}$</b> — Tại $t=0$ cho $1+2-1=2$, trái điều kiện zero-state $y(0^{+})=0$.</li>
<li><span class="vd qbad">SAI</span><b>4. $5e^{2t}-4e^{3t}$</b> — Có mốt tăng $e^{2t},e^{3t}$ không phải nghiệm đặc trưng −2,−3.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Dùng cả kiểm $t=0$ và $t\to \infty$ giúp loại phương án rất nhanh trước khi tính Laplace chi tiết.</div>
`
    },
    {
      id: '5-6', t: 5, n: 6, k: 'mc', c: 4, a: 1,
      im: [['5-6.webp', 1015, 322]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y_{s}[n]=\frac{2}{5}[2^{-n}-(-2)^{n}]u[n]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]+2y[n-1]=x[n-1]$, $x[n]=2^{-n}u[n]$. Với trạng thái đầu bằng 0, $x[n-1]=0$ ở $n\le 0$ nên $y[0]=0$.</p>
<p>Phần thuần nhất: thử $y=r^{n} \implies r+2=0 \implies r=-2$. Phần kích thích có cơ số 1/2 ⇒ nghiệm tổng quát $n\ge 0$ là $y[n]=A(-2)^{n}+B\frac{1}{2}^{n}$.</p>
<p>Lấy $n=0$ từ phương trình: $y[0]+2y[-1]=x[-1]=0 \implies y[0]=0 \implies A+B=0$.</p>
<p>Lấy $n=1$: $y[1]+2y[0]=x[0]=1 \implies y[1]=1 \implies -2A+\frac{1}{2}B=1$.</p>
<p>Giải $A=-\frac{2}{5}$, $B=+\frac{2}{5}$. Vậy $y_{s}[n]=\frac{2}{5}[\frac{1}{2}^{n}-(-2)^{n}]u[n]$.</p>
<p>Thế kiểm $n=0$: $\frac{2}{5}(1-1)=0$; $n=1$: $\frac{2}{5}(\frac{1}{2}+2)=1$. Với $n=2$: $y[2]=x[1]-2y[1]=\frac{1}{2}-2=-\frac{3}{2}$ và công thức cũng cho −3/2.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\frac{2}{5}[2^{-n}-(-2)^{n}]u[n]$</b> — Đúng hệ số 2/5 và đúng điểm bắt đầu $n=0$.</li>
<li><span class="vd qbad">SAI</span><b>2. $[2^{-n}-(-2)^{n}]u[n]$</b> — Thiếu hệ số 2/5: tại $n=1$ cho 5/2 chứ không phải 1.</li>
<li><span class="vd qbad">SAI</span><b>3. $[(-2)^{n}+2^{-n}]u[n-1]$</b> — Sai dấu: tại $n=1$ cho −3/2, không bằng $y[1]=1$.</li>
<li><span class="vd qbad">SAI</span><b>4. $\frac{2}{5}[(-2)^{n}-2^{-n}]u[n-1]$</b> — Đảo dấu; tại $n=1$ cho −1.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Chỉ cần lập $y[0]=0$, $y[1]=1$ là đủ tìm hai hệ số. Trực tiếp thế $n=1$ vào từng lựa chọn là cách loại đáp án rất hiệu quả.</div>
`
    },
    {
      id: '5-7', t: 5, n: 7, k: 'mc', c: 4, a: 1,
      im: [['5-7.webp', 1015, 322]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y_{s}[n]=\frac{2}{3}[2^{n}-2^{-n}]u[n]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]-2y[n-1]=x[n-1]$, $x[n]=2^{-n}u[n]$. Ở trạng thái nghỉ, $y[0]=0$ và $y[1]=x[0]=1$.</p>
<p>Giải thuần nhất: $r-2=0 \implies r=2$. Với đầu vào tỉ lệ $\frac{1}{2}^{n}$, nghiệm tổng quát $n\ge 0$ là $y[n]=A2^{n}+B\frac{1}{2}^{n}$.</p>
<p>Điều kiện $y[0]=0 \implies A+B=0$. Điều kiện $y[1]=1 \implies 2A+\frac{1}{2}B=1$.</p>
<p>Thế $B=-A$, suy ra $\frac{3}{2}A=1 \implies A=\frac{2}{3}$, $B=-\frac{2}{3}$.</p>
<p>Vậy $y_{s}[n]=\frac{2}{3}[2^{n}-2^{-n}]u[n]$.</p>
<p>Kiểm $n=2$: từ hệ $y[2]=2y[1]+x[1]=2+\frac{1}{2}=\frac{5}{2}$. Công thức cho $\frac{2}{3}(4-\frac{1}{4})=\frac{2}{3}\frac{15}{4}=\frac{5}{2}$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\frac{2}{3}(2^{n}-2^{-n})u[n]$</b> — Khớp $y[0]=0$, $y[1]=1$, $y[2]=\frac{5}{2}$.</li>
<li><span class="vd qbad">SAI</span><b>2. $(2^{n}-2^{-n})u[n]$</b> — Thiếu 2/3; $y[1]=2-\frac{1}{2}=\frac{3}{2}$ khác 1.</li>
<li><span class="vd qbad">SAI</span><b>3. $(2^{n}-2^{-n})u[n-1]$</b> — Vẫn thiếu 2/3; bước $u[n-1]$ không sửa được hệ số sai ở $n=1$.</li>
<li><span class="vd qbad">SAI</span><b>4. $\frac{2}{3}(-2^{n}+2^{-n})u[n-1]$</b> — Sai dấu: tại $n=1$ cho −1 thay vì +1.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm một vài mẫu bằng truy hồi sẽ đáng tin hơn việc chỉ “nhìn giống” nghiệm tổng quát.</div>
`
    },
    {
      id: '5-8', t: 5, n: 8, k: 'mc', c: 4, a: 1,
      im: [['5-8.webp', 960, 284]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1 là phát biểu KHÔNG ĐÚNG: $e^{-t}u(t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y''-3y'+2y=x'$ với $x(t)=\sin (2t)u(t)$. Trong Laplace trạng thái nghỉ, $X(s)=2/(s^{2}+4)$ và $X'(s)=sX(s)=2s/(s^{2}+4)$ do $x(0^{-})=0$.</p>
<p>Đa thức hệ $P(s)=s^{2}-3s+2=(s-1)(s-2)$. Hai nghiệm tự nhiên $s=1,2 \implies$ các mốt $e^{t}$ và $e^{2t}$; không có nghiệm $s=-1$.</p>
<p>$Y(s)=2s/[(s^{2}+4)(s-1)(s-2)]$. Tách phân thức: $Y(s)=-(s+6)/[10(s^{2}+4)]-2/[5(s-1)]+1/[2(s-2)]$.</p>
<p>Đổi ngược: $y(t)=[-\frac{1}{10}\cos (2t)-\frac{3}{10}\sin (2t)-\frac{2}{5}e^{t}+\frac{1}{2}e^{2t}]u(t)$.</p>
<p>Vì thế các dạng $e^{t}$, $\sin (2t)$, $\cos (2t)$ có hệ số khác 0. $e^{-t}$ tuyệt đối không xuất hiện trong kết quả.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">SAI — CHỌN</span><b>1. $e^{-t}u(t)$</b> — Không có cực −1 trong $Y(s)$; phương trình đặc trưng có +1,+2.</li>
<li><span class="vd qok">ĐÚNG</span><b>2. $e^{t}u(t)$</b> — Có hệ số −2/5 nhân $e^{t}$.</li>
<li><span class="vd qok">ĐÚNG</span><b>3. $\sin (2t)u(t)$</b> — Có hệ số −3/10 nhân $\sin (2t)$.</li>
<li><span class="vd qok">ĐÚNG</span><b>4. $\cos (2t)u(t)$</b> — Có hệ số −1/10 nhân $\cos (2t)$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm tại $t=0$: $-\frac{1}{10}-\frac{2}{5}+\frac{1}{2}=0$, phù hợp trạng thái nghỉ. Các hạng lượng giác không tự xuất hiện ngẫu nhiên: sinh ra từ cặp cực $\pm 2j$ của đầu vào.</div>
`
    },
    {
      id: '5-9', t: 5, n: 9, k: 'mc', c: 4, a: 2,
      im: [['5-9.webp', 1017, 56], ['5-9b.webp', 1017, 228]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 2 là phát biểu KHÔNG ĐÚNG: $e^{t}u(t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y''+3y'+2y=x'$, $x(t)=\sin (2t)u(t)$; với trạng thái nghỉ $X'(s)=2s/(s^{2}+4)$.</p>
<p>Đa thức đặc trưng $P(s)=s^{2}+3s+2=(s+1)(s+2)$. Hệ có các mốt tự nhiên $e^{-t}$ và $e^{-2t}$, không có $e^{t}$.</p>
<p>$Y(s)=2s/[(s^{2}+4)(s+1)(s+2)]$. Tách phân thức: $Y(s)=-(s-6)/[10(s^{2}+4)]-2/[5(s+1)]+1/[2(s+2)]$.</p>
<p>Lấy ngược: $y(t)=[-\frac{1}{10}\cos (2t)+\frac{3}{10}\sin (2t)-\frac{2}{5}e^{-t}+\frac{1}{2}e^{-2t}]u(t)$.</p>
<p>So với các lựa chọn: $e^{-t}$ có, sin2t có, cos2t có, còn $e^{t}$ không có trong danh sách cực.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $e^{-t}u(t)$</b> — Hạng $-\frac{2}{5}e^{-t}$ có thật.</li>
<li><span class="vd qok">SAI — CHỌN</span><b>2. $e^{t}u(t)$</b> — Không có nghiệm đặc trưng +1 và không được kích thích bởi $e^{t}$.</li>
<li><span class="vd qok">ĐÚNG</span><b>3. $\sin (2t)u(t)$</b> — Hạng $+\frac{3}{10}\sin (2t)$.</li>
<li><span class="vd qok">ĐÚNG</span><b>4. $\cos (2t)u(t)$</b> — Hạng $-\frac{1}{10}\cos (2t)$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Hai câu 5.8/5.9 khác nhau ở dấu của hệ số $y'$, làm đổi nghiệm $\pm 1,\pm 2$; dễ nhìn nhầm $e^{t}$ với $e^{-t}$.</div>
`
    },
    {
      id: '5-10', t: 5, n: 10, k: 'mc', c: 4, a: 1,
      im: [['5-10.webp', 1120, 290]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y_{0}(t)=[5e^{-2t}-4e^{-3t}]u(t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề hỏi ĐÁP ỨNG TỰ NHIÊN của $y''+5y'+6y=x'+6x$, kèm $y(0^{-})=1$, $y'(0^{-})=2$. Đáp ứng tự nhiên được xác định từ phương trình thuần nhất, đặt vế phải bằng 0.</p>
<p>Phương trình đặc trưng: $r^{2}+5r+6=(r+2)(r+3)=0 \implies$ hai nghiệm $r=-2$ và $r=-3$.</p>
<p>Đặt $y_{0}(t)=Ae^{-2t}+Be^{-3t}$ cho $t\ge 0$. Thế $y_{0}(0)=1 \implies A+B=1$.</p>
<p>Đạo hàm $y_{0}'(t)=-2Ae^{-2t}-3Be^{-3t}$. Thế $y_{0}'(0)=2 \implies -2A-3B=2$.</p>
<p>Lấy phương trình thứ hai cộng $2(A+B)=2 \implies -B=4 \implies B=-4$; do đó $A=5$.</p>
<p>Kết quả $y_{0}(t)=[5e^{-2t}-4e^{-3t}]u(t)$. Thử lại: tại 0 cho $5-4=1$; đạo hàm tại 0 cho $-10+12=2$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $5e^{-2t}-4e^{-3t}$</b> — Hai cực −2,−3; đúng cả hai điều kiện đầu.</li>
<li><span class="vd qbad">SAI</span><b>2. $-e^{-2t}+3e^{-5t}$</b> — Xuất hiện −5 không phải nghiệm đặc trưng và tại 0 cho $2\neq 1$.</li>
<li><span class="vd qbad">SAI</span><b>3. $-5e^{-2t}+4e^{-3t}$</b> — Tại 0 cho $-1\neq 1$; đạo hàm tại 0 cho $-2\neq 2$.</li>
<li><span class="vd qbad">SAI</span><b>4. $5e^{2t}-4e^{3t}$</b> — Dùng nghiệm dương trong khi đa thức có −2,−3.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Vì đề yêu cầu tự nhiên, $x'+6x$ ở vế phải không tham gia bước tìm A,B (chỉ còn khi tính đáp ứng cưỡng bách).</div>
`
    },
    {
      id: '5-11', t: 5, n: 11, k: 'mc', c: 4, a: 1,
      im: [['5-11.webp', 1118, 169], ['5-11b.webp', 1118, 107]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y_{0}(t)=[\cos$ t+sin $t]u(t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y''+y=x'+x$; điều kiện $y(0^{-})=1$, $y'(0^{-})=1$. Chỉ tính thành phần tự nhiên nên giải $y''+y=0$.</p>
<p>Phương trình đặc trưng $r^{2}+1=0 \implies r=\pm j$, tương ứng dạng thực $y_{0}(t)=Acos$ t+Bsin $t$.</p>
<p>Tại $t=0$: $y_{0}(0)=Acos0+Bsin0=A=1$.</p>
<p>Lấy đạo hàm: $y_{0}'(t)=-A$ sin t+B cos $t$. Tại $t=0$: $y_{0}'(0)=B=1$.</p>
<p>Suy ra $y_{0}(t)=(\cos$ t+sin $t)u(t)$.</p>
<p>Kiểm $y_{0}''(t)=-\cos$ t−sin $t$ nên $y_{0}''+y_{0}=0$ đúng mọi t&gt;0.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. (sin t+cos $t)u(t)$</b> — $A=B=1$ từ điều kiện đầu.</li>
<li><span class="vd qbad">SAI</span><b>2. $2\cos (t)u(t)$</b> — Tại 0 bằng $2\neq 1$; đạo hàm tại 0 bằng $0\neq 1$.</li>
<li><span class="vd qbad">SAI</span><b>3. $2\sin (t)u(t)$</b> — Tại 0 bằng $0\neq 1$.</li>
<li><span class="vd qbad">SAI</span><b>4. (cos t−sin $t)u(t)$</b> — Đạo hàm tại 0 bằng $-1\neq +1$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Dùng hai điều kiện xung quanh 0 là đủ loại toàn bộ phương án; không cần tính tích phân.</div>
`
    },
    {
      id: '5-12', t: 5, n: 12, k: 'mc', c: 4, a: 1,
      im: [['5-12.webp', 1116, 290]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y_{0}(t)=[e^{-2t}+4te^{-2t}]u(t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y''+4y'+4y=x'$, $y(0^{-})=1$ và $y'(0^{-})=2$. Đáp ứng tự nhiên: $y''+4y'+4y=0$.</p>
<p>Phương trình đặc trưng $r^{2}+4r+4=(r+2)^{2}=0$ có nghiệm $r=-2$ BỘI HAI.</p>
<p>Vì nghiệm kép, không thể đặt chỉ $Ae^{-2t}$; phải đặt $y_{0}(t)=(A+Bt)e^{-2t}$.</p>
<p>Tại $t=0$, $y_{0}(0)=A=1$.</p>
<p>Đạo hàm theo quy tắc tích: $y_{0}'(t)=[B-2(A+Bt)]e^{-2t}$. Tại 0: $B-2A=2 \implies B=4$.</p>
<p>Vậy $y_{0}(t)=[e^{-2t}+4t e^{-2t}]u(t)$. Thử $t=0$: $y=1$; $y'=4-2=2$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $(e^{-2t}+4t e^{-2t})u(t)$</b> — Nghiệm kép; $A=1$, $B=4$.</li>
<li><span class="vd qbad">SAI</span><b>2. $e^{-2t}u(t)$</b> — $B=0$ làm $y'(0)=-2$, không phải 2.</li>
<li><span class="vd qbad">SAI</span><b>3. $(e^{-2t}-4t e^{-2t})u(t)$</b> — $B=-4$ làm $y'(0)=-6$.</li>
<li><span class="vd qbad">SAI</span><b>4. $(e^{-2t}-2t e^{-2t})u(t)$</b> — $B=-2$ làm $y'(0)=-4$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm đạo hàm tại 0 là cách phân biệt các lựa chọn chỉ khác dấu/hệ số trước $te^{-2t}$.</div>
`
    },
    {
      id: '5-13', t: 5, n: 13, k: 'mc', c: 4, a: 1,
      im: [['5-13.webp', 1118, 278], ['5-13b.webp', 1118, 62]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y_{0}[n]=[\frac{1}{2}-\frac{1}{2}(-3)^{n+2}]u[n]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]+2y[n-1]-3y[n-2]=x[n-1]$, với $y[-1]=2$, $y[-2]=0$. Đáp ứng TỰ NHIÊN nghĩa là đặt $x=0$ và giải truy hồi thuần nhất.</p>
<p>Thử $y[n]=r^{n}$: $r^{2}+2r-3=(r-1)(r+3)=0 \implies r=1$ hoặc $r=-3$. Hai nghiệm phân biệt nên $y_{0}[n]=A\cdot 1^{n}+B(-3)^{n}=A+B(-3)^{n}$.</p>
<p>Thế $n=-1$: $A+B(-3)^{-1}=A-B/3=2$. Đây là phương trình (I).</p>
<p>Thế $n=-2$: $A+B(-3)^{-2}=A+B/9=0$. Đây là phương trình (II).</p>
<p>Từ (II)−(I): $B/9+B/3=0-(2) \implies \frac{4}{9}B=-2 \implies B=-\frac{9}{2}$; rồi $A=\frac{1}{2}$.</p>
<p>Vậy $y_{0}[n]=[\frac{1}{2}-\frac{1}{2}(-3)^{n+2}]u[n]$. Thử $n=-1,-2$ bằng dạng $A+B(-3)^{n}$ phải quay lại đúng điều kiện gốc.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Phương án 1 — $[\frac{1}{2}-\frac{1}{2}(-3)^{n+2}]u[n]$</b> — Có $A=\frac{1}{2}$, $B=-\frac{9}{2}$; khớp cả $y[-1]=2$ và $y[-2]=0$.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án chứa cơ số $3^{n}$ không có dấu âm</b> — Nghiệm thứ hai của đa thức là −3, không phải +3; $(-3)^{n}$ đổi dấu theo chẵn lẻ.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án có hệ số hằng $A$ khác 1/2</b> — Thế $y[-1]$, $y[-2]$ không đồng thời thỏa hai điều kiện.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án có hệ số $B$ hoặc số mũ n+2/n+3 khác</b> — Quy đổi $B(-3)^{n}$ về cùng cơ số: $B(-3)^{n}$ phải cho đúng $-\frac{9}{2}\cdot (-3)^{n}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm độc lập bằng phương trình truy hồi tại $n=0$: $y_{0}[0]=-2y[-1]+3y[-2]=-4$. Thế biểu thức chọn tại $n=0$ phải cho cùng số này.</div>
`
    },
    {
      id: '5-14', t: 5, n: 14, k: 'mc', c: 4, a: 2,
      im: [['5-14.webp', 991, 366]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 2: $y_{0}[n]=[-\frac{1}{2}+\frac{1}{2}(-3)^{n+2}]u[n]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]+2y[n-1]-3y[n-2]=x[n-1]$, với $y[-1]=-2$, $y[-2]=0$. Đáp ứng TỰ NHIÊN nghĩa là đặt $x=0$ và giải truy hồi thuần nhất.</p>
<p>Thử $y[n]=r^{n}$: $r^{2}+2r-3=(r-1)(r+3)=0 \implies r=1$ hoặc $r=-3$. Hai nghiệm phân biệt nên $y_{0}[n]=A\cdot 1^{n}+B(-3)^{n}=A+B(-3)^{n}$.</p>
<p>Thế $n=-1$: $A+B(-3)^{-1}=A-B/3=-2$. Đây là phương trình (I).</p>
<p>Thế $n=-2$: $A+B(-3)^{-2}=A+B/9=0$. Đây là phương trình (II).</p>
<p>Từ (II)−(I): $B/9+B/3=0-(-2) \implies \frac{4}{9}B=2 \implies B=\frac{9}{2}$; rồi $A=-\frac{1}{2}$.</p>
<p>Vậy $y_{0}[n]=[(-\frac{1}{2})+\frac{1}{2}(-3)^{n+2}]u[n]$. Thử $n=-1,-2$ bằng dạng $A+B(-3)^{n}$ phải quay lại đúng điều kiện gốc.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Phương án 2 — $[(-\frac{1}{2})+\frac{1}{2}(-3)^{n+2}]u[n]$</b> — Có $A=-\frac{1}{2}$, $B=\frac{9}{2}$; khớp cả $y[-1]=-2$ và $y[-2]=0$.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án chứa cơ số $3^{n}$ không có dấu âm</b> — Nghiệm thứ hai của đa thức là −3, không phải +3; $(-3)^{n}$ đổi dấu theo chẵn lẻ.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án có hệ số hằng $A$ khác −1/2</b> — Thế $y[-1]$, $y[-2]$ không đồng thời thỏa hai điều kiện.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án có hệ số $B$ hoặc số mũ n+2/n+3 khác</b> — Quy đổi $B(-3)^{n}$ về cùng cơ số: $B(-3)^{n}$ phải cho đúng $\frac{9}{2}\cdot (-3)^{n}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm độc lập bằng phương trình truy hồi tại $n=0$: $y_{0}[0]=-2y[-1]+3y[-2]=4$. Thế biểu thức chọn tại $n=0$ phải cho cùng số này.</div>
`
    },
    {
      id: '5-15', t: 5, n: 15, k: 'mc', c: 4, a: 1,
      im: [['5-15.webp', 991, 244], ['5-15b.webp', 991, 148]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y_{0}[n]=[-\frac{1}{2}-\frac{1}{2}(-3)^{n+2}]u[n]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]+2y[n-1]-3y[n-2]=x[n-1]$, với $y[-1]=1$, $y[-2]=-1$. Đáp ứng TỰ NHIÊN nghĩa là đặt $x=0$ và giải truy hồi thuần nhất.</p>
<p>Thử $y[n]=r^{n}$: $r^{2}+2r-3=(r-1)(r+3)=0 \implies r=1$ hoặc $r=-3$. Hai nghiệm phân biệt nên $y_{0}[n]=A\cdot 1^{n}+B(-3)^{n}=A+B(-3)^{n}$.</p>
<p>Thế $n=-1$: $A+B(-3)^{-1}=A-B/3=1$. Đây là phương trình (I).</p>
<p>Thế $n=-2$: $A+B(-3)^{-2}=A+B/9=-1$. Đây là phương trình (II).</p>
<p>Từ (II)−(I): $B/9+B/3=-1-(1) \implies \frac{4}{9}B=-2 \implies B=-\frac{9}{2}$; rồi $A=-\frac{1}{2}$.</p>
<p>Vậy $y_{0}[n]=[(-\frac{1}{2})-\frac{1}{2}(-3)^{n+2}]u[n]$. Thử $n=-1,-2$ bằng dạng $A+B(-3)^{n}$ phải quay lại đúng điều kiện gốc.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Phương án 1 — $[(-\frac{1}{2})-\frac{1}{2}(-3)^{n+2}]u[n]$</b> — Có $A=-\frac{1}{2}$, $B=-\frac{9}{2}$; khớp cả $y[-1]=1$ và $y[-2]=-1$.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án chứa cơ số $3^{n}$ không có dấu âm</b> — Nghiệm thứ hai của đa thức là −3, không phải +3; $(-3)^{n}$ đổi dấu theo chẵn lẻ.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án có hệ số hằng $A$ khác −1/2</b> — Thế $y[-1]$, $y[-2]$ không đồng thời thỏa hai điều kiện.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án có hệ số $B$ hoặc số mũ n+2/n+3 khác</b> — Quy đổi $B(-3)^{n}$ về cùng cơ số: $B(-3)^{n}$ phải cho đúng $-\frac{9}{2}\cdot (-3)^{n}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm độc lập bằng phương trình truy hồi tại $n=0$: $y_{0}[0]=-2y[-1]+3y[-2]=-5$. Thế biểu thức chọn tại $n=0$ phải cho cùng số này.</div>
`
    },
    {
      id: '5-16', t: 5, n: 16, k: 'mc', c: 4, a: 1,
      im: [['5-16.webp', 1104, 293]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y_{0}(t)=e^{2t}u(t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y''-4y'+4y=x'$, $y(0^{-})=1$, $y'(0^{-})=2$. Tìm đáp ứng tự nhiên, nên đặt $x'=0$.</p>
<p>Đa thức đặc trưng $r^{2}-4r+4=(r-2)^{2} \implies$ nghiệm $r=2$ bội hai.</p>
<p>Dạng đầy đủ: $y_{0}(t)=(A+Bt)e^{2t}$. Tại $t=0$: $A=1$.</p>
<p>Đạo hàm: $y_{0}'(t)=[B+2(A+Bt)]e^{2t}$. Thế tại 0: $B+2A=2 \implies B+2=2 \implies B=0$.</p>
<p>Vì $B=0$, $y_{0}(t)=e^{2t}u(t)$. Việc nghiệm kép không bắt buộc hệ số $te^{2t}$ khác 0; chính điều kiện đầu khiến nó biến mất.</p>
<p>Thử lại: $y(0)=1$, $y'(0)=2$, và $y''-4y'+4y=(4-8+4)e^{2t}=0$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $e^{2t}u(t)$</b> — $A=1$, $B=0$ và cả hai điều kiện đầu thỏa.</li>
<li><span class="vd qbad">SAI</span><b>2. $(e^{2t}+4te^{2t})u(t)$</b> — $B=4 \implies y'(0)=6$ khác 2.</li>
<li><span class="vd qbad">SAI</span><b>3. $(e^{2t}-4te^{2t})u(t)$</b> — $B=-4 \implies y'(0)=-2$.</li>
<li><span class="vd qbad">SAI</span><b>4. $(e^{2t}-2te^{2t})u(t)$</b> — $B=-2 \implies y'(0)=0$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Hệ có nghiệm +2 nên đáp ứng tăng $e^{2t}$, không được tự ý đổi thành $e^{-2t}$ chỉ vì nghĩ “hệ vật lý phải ổn định”.</div>
`
    },
    {
      id: '5-17', t: 5, n: 17, k: 'mc', c: 4, a: 2,
      im: [['5-17.webp', 986, 209], ['5-17b.webp', 986, 148]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 2: $y_{0}[n]=[\frac{9}{4}-\frac{1}{4}(-3)^{n+3}]u[n]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">Vi phân: thử $y=e^{s\cdot t}$. Sai phân: thử $y=r^{n}$. Nghiệm bội $m \implies$ thêm $t$, $t^{2},…$ hoặc $n$, $n^{2},…$ đến bậc m−1.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $y[n]+2y[n-1]-3y[n-2]=x[n-1]$, với $y[-1]=0$, $y[-2]=3$. Đáp ứng TỰ NHIÊN nghĩa là đặt $x=0$ và giải truy hồi thuần nhất.</p>
<p>Thử $y[n]=r^{n}$: $r^{2}+2r-3=(r-1)(r+3)=0 \implies r=1$ hoặc $r=-3$. Hai nghiệm phân biệt nên $y_{0}[n]=A\cdot 1^{n}+B(-3)^{n}=A+B(-3)^{n}$.</p>
<p>Thế $n=-1$: $A+B(-3)^{-1}=A-B/3=0$. Đây là phương trình (I).</p>
<p>Thế $n=-2$: $A+B(-3)^{-2}=A+B/9=3$. Đây là phương trình (II).</p>
<p>Từ (II)−(I): $B/9+B/3=3-(0) \implies \frac{4}{9}B=3 \implies B=\frac{27}{4}$; rồi $A=\frac{9}{4}$.</p>
<p>Vậy $y_{0}[n]=[\frac{9}{4}-\frac{1}{4}(-3)^{n+3}]u[n]$. Thử $n=-1,-2$ bằng dạng $A+B(-3)^{n}$ phải quay lại đúng điều kiện gốc.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>Phương án 2 — $[\frac{9}{4}-\frac{1}{4}(-3)^{n+3}]u[n]$</b> — Có $A=\frac{9}{4}$, $B=\frac{27}{4}$; khớp cả $y[-1]=0$ và $y[-2]=3$.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án chứa cơ số $3^{n}$ không có dấu âm</b> — Nghiệm thứ hai của đa thức là −3, không phải +3; $(-3)^{n}$ đổi dấu theo chẵn lẻ.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án có hệ số hằng $A$ khác 9/4</b> — Thế $y[-1]$, $y[-2]$ không đồng thời thỏa hai điều kiện.</li>
<li><span class="vd qbad">SAI</span><b>Đáp án có hệ số $B$ hoặc số mũ n+2/n+3 khác</b> — Quy đổi $B(-3)^{n}$ về cùng cơ số: $B(-3)^{n}$ phải cho đúng $\frac{27}{4}\cdot (-3)^{n}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm độc lập bằng phương trình truy hồi tại $n=0$: $y_{0}[0]=-2y[-1]+3y[-2]=9$. Thế biểu thức chọn tại $n=0$ phải cho cùng số này.</div>
`
    },
    {
      id: '6-1', t: 6, n: 1, k: 'mc', c: 4, a: 1,
      im: [['6-1.webp', 410, 353]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X(\omega) = \dfrac{2e^{-j\omega}}{1+\omega^2}$</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Cặp biến đổi Fourier cơ bản:</b> $e^{-a|t|}  \longleftrightarrow \dfrac{2a}{a^2 + \omega^2}$ &nbsp; (với $a > 0$).</li>
<li><b>Tính chất dịch thời gian:</b> Nếu $g(t) \longleftrightarrow G(\omega)$ thì $g(t - t_0) \longleftrightarrow e^{-j\omega t_0} G(\omega)$.</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Nhận dạng tín hiệu &amp; quan hệ dịch thời gian:</b><br>Xét tín hiệu đối xứng gốc $g(t) = e^{-|t|}$ (với $a=1$). Tín hiệu đề bài cho là $x(t) = e^{-|t-1|} = g(t - 1)$, tức là tín hiệu $g(t)$ bị dịch sang phải $t_0 = 1$ đơn vị thời gian.</p>
<p><b>Tìm biến đổi Fourier của tín hiệu gốc $g(t)$:</b><br>Theo công thức tích phân định nghĩa Fourier:$$G(\omega) = \int_{-\infty}^{\infty} e^{-|t|} e^{-j\omega t} dt = \int_{-\infty}^{0} e^{t(1-j\omega)} dt + \int_{0}^{\infty} e^{-t(1+j\omega)} dt$$Tính hai tích phân từng nhánh:$$G(\omega) = \left[ \frac{e^{t(1-j\omega)}}{1-j\omega} \right]_{-\infty}^{0} + \left[ \frac{e^{-t(1+j\omega)}}{-(1+j\omega)} \right]_{0}^{\infty} = \frac{1}{1-j\omega} + \frac{1}{1+j\omega}$$Quy đồng mẫu số:$$G(\omega) = \frac{(1+j\omega) + (1-j\omega)}{(1-j\omega)(1+j\omega)} = \frac{2}{1 - (j\omega)^2} = \frac{2}{1+\omega^2}$$</p>
<p><b>Áp dụng tính chất dịch thời gian với $t_0 = 1$:</b>$$X(\omega) = \mathcal{F}[g(t-1)] = e^{-j\omega t_0} \cdot G(\omega) = e^{-j\omega} \cdot \frac{2}{1+\omega^2} = \frac{2e^{-j\omega}}{1+\omega^2}$$</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\dfrac{2e^{-j\omega}}{1+\omega^2}$</b> — Đúng cặp biến đổi hai phía và nhân tử dịch phải $e^{-j\omega}$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng mẫu $1+j\omega$</b> — Bẫy nhầm với tín hiệu 1 phía $e^{-t}u(t)$, bỏ quên nhánh $t < 0$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng số mũ $e^{+j\omega}$</b> — Bẫy nhầm dấu: $e^{+j\omega}$ là dịch TRÁI $(t+1)$, đề bài là dịch PHẢI $(t-1)$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng mẫu $1+\omega$ (không có bình phương)</b> — Sai phép nhân số phức liên hợp ở mẫu.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Thử tại $\omega = 0$: Giá trị DC $X(0) = \int_{-\infty}^{\infty} x(t) dt = \int_{-\infty}^{\infty} e^{-|t-1|} dt = 2$. Thay $\omega = 0$ vào công thức: $\dfrac{2e^0}{1+0} = 2$ (hoàn toàn chính xác).</div>
`
    },
    {
      id: '6-2', t: 6, n: 2, k: 'mc', c: 4, a: 1,
      im: [['6-2.webp', 529, 354]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X(\omega) = \dfrac{e^{2-j\omega} - 1}{2 - j\omega}$</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Định nghĩa biến đổi Fourier liên tục:</b> $X(\omega) = \int_{-\infty}^{\infty} x(t) e^{-j\omega t} dt$.</li>
<li><b>Hàm cửa sổ chữ nhật:</b> $u(t) - u(t-1) = \begin{cases} 1, & 0 \le t < 1 \\ 0, & \text{ngoài khoảng này} \end{cases}$.</li>
<li><b>Quy tắc tích phân hàm mũ:</b> $\int e^{at} dt = \dfrac{e^{at}}{a} + C$ &nbsp; (với $a \neq 0$).</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Xác định khoảng tồn tại của tín hiệu:</b><br>Tín hiệu $x(t) = e^{2t}[u(t) - u(t-1)]$ chỉ khác 0 trên đoạn $t \in [0, 1)$, khi đó $x(t) = e^{2t}$.</p>
<p><b>Thiết lập tích phân Fourier theo định nghĩa:</b>$$X(\omega) = \int_{0}^{1} e^{2t} \cdot e^{-j\omega t} dt = \int_{0}^{1} e^{(2-j\omega)t} dt$$</p>
<p><b>Tính nguyên hàm và thay cận $[0, 1]$:</b><br>Đặt hằng số phức $a = 2 - j\omega$ (với $\omega \in \mathbb{R}$, $a \neq 0$). Nguyên hàm là $\dfrac{e^{at}}{a}$:$$X(\omega) = \left[ \frac{e^{(2-j\omega)t}}{2 - j\omega} \right]_{0}^{1} = \frac{e^{(2-j\omega)\cdot 1} - e^{(2-j\omega)\cdot 0}}{2 - j\omega} = \frac{e^{2-j\omega} - 1}{2 - j\omega}$$</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\dfrac{e^{2-j\omega} - 1}{2 - j\omega}$</b> — Khai triển nguyên hàm chuẩn xác khi thế cận trên 1 và cận dưới 0.</li>
<li><span class="vd qbad">SAI</span><b>Dạng có số hạng $e^{j2\omega}$</b> — Bẫy nhầm lẫn giữa số mũ thực $2t$ và số mũ phức $-j\omega t$. Lưu ý $e^{2-j\omega} = e^2 \cdot e^{-j\omega}$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng thiếu $-1$ ở tử số</b> — Bẫy quên thay cận dưới $t=0$, vì $e^0 = 1$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng đổi dấu mẫu số thành $2+j\omega$</b> — Sai dấu số mũ tích phân Fourier $e^{-j\omega t}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Thử tại $\omega = 0$: $X(0) = \int_{0}^{1} e^{2t} dt = \left[ \dfrac{e^{2t}}{2} \right]_0^1 = \dfrac{e^2 - 1}{2}$. Thay $\omega = 0$ vào công thức kết quả: $\dfrac{e^2 - 1}{2 - 0} = \dfrac{e^2 - 1}{2}$ (khớp 100%).</div>
`
    },
    {
      id: '6-3', t: 6, n: 3, k: 'mc', c: 4, a: 1,
      im: [['6-3.webp', 462, 365]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X(\Omega) = \dfrac{e^{-j\Omega}}{2 - e^{-j\Omega}}$</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Cặp biến đổi DTFT cơ bản:</b> $a^n u[n]  \longleftrightarrow \dfrac{1}{1 - a e^{-j\Omega}}$ &nbsp; (với $|a| < 1$).</li>
<li><b>Tính chất dịch thời gian rời rạc:</b> $x[n - n_0]  \longleftrightarrow e^{-j\Omega n_0} X(\Omega)$.</li>
<li><b>Tổng cấp số nhân lùi vô hạn:</b> $\sum_{n=1}^{\infty} q^n = \dfrac{q}{1 - q}$ &nbsp; (với $|q| < 1$).</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Cách 1 — Dùng tính chất dịch thời gian:</b><br>Biến đổi tín hiệu về dạng hàm mũ cơ sở chuẩn bị dịch:$$x[n] = 2^{-n} u[n-1] = 2^{-1} \cdot 2^{-(n-1)} u[n-1] = \frac{1}{2} \left(\frac{1}{2}\right)^{n-1} u[n-1]$$Đặt $g[n] = \left(\frac{1}{2}\right)^n u[n] \implies x[n] = \frac{1}{2} g[n-1]$. Áp dụng tính chất dịch với $n_0 = 1$:$$G(\Omega) = \frac{1}{1 - \frac{1}{2}e^{-j\Omega}} \implies X(\Omega) = \frac{1}{2} \cdot e^{-j\Omega} G(\Omega) = \frac{\frac{1}{2}e^{-j\Omega}}{1 - \frac{1}{2}e^{-j\Omega}} = \frac{e^{-j\Omega}}{2 - e^{-j\Omega}}$$</p>
<p><b>Cách 2 — Tính trực tiếp từ chuỗi DTFT:</b><br>Vì $u[n-1] = 1$ khi $n \ge 1$, ta tính trực tiếp chuỗi DTFT:$$X(\Omega) = \sum_{n=1}^{\infty} 2^{-n} e^{-j\Omega n} = \sum_{n=1}^{\infty} \left( \frac{1}{2}e^{-j\Omega} \right)^n$$Áp dụng công thức tổng cấp số nhân với số hạng đầu $u_1 = \frac{1}{2}e^{-j\Omega}$ và công bội $q = \frac{1}{2}e^{-j\Omega}$:$$X(\Omega) = \frac{u_1}{1 - q} = \frac{\frac{1}{2}e^{-j\Omega}}{1 - \frac{1}{2}e^{-j\Omega}} = \frac{e^{-j\Omega}}{2 - e^{-j\Omega}}$$</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\dfrac{e^{-j\Omega}}{2 - e^{-j\Omega}}$</b> — Đúng hệ số và đã chuẩn hóa nhân 2 cho cả tử và mẫu.</li>
<li><span class="vd qbad">SAI</span><b>Dạng $\dfrac{1}{1 - 0.5e^{-j\Omega}}$</b> — Bẫy nhầm cận tổng chạy từ $n=0$ (thừa số hạng $n=0$ có giá trị bằng 1).</li>
<li><span class="vd qbad">SAI</span><b>Dạng $\dfrac{1}{2 - e^{-j\Omega}}$</b> — Bẫy quên nhân tử dịch $e^{-j\Omega}$ ở tử số khi tổng bắt đầu từ $n=1$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Thử tại $\Omega = 0$: $X(0) = \sum_{n=1}^{\infty} 2^{-n} = \frac{1}{2} + \frac{1}{4} + \dots = 1$. Thay $\Omega = 0$ vào đáp án: $\dfrac{1}{2 - 1} = 1$ (chính xác tuyệt đối).</div>
`
    },
    {
      id: '6-4', t: 6, n: 4, k: 'mc', c: 4, a: 1,
      im: [['6-4.webp', 534, 323]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X(\Omega) = 1 + 2e^{-j\Omega}$</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Định nghĩa biến đổi DTFT:</b> $X(\Omega) = \sum_{n=-\infty}^{\infty} x[n] e^{-j\Omega n}$.</li>
<li><b>Khoảng hỗ trợ của hàm cửa sổ:</b> $u[n] - u[n-N]$ chỉ nhận giá trị bằng 1 trên tập hữu hạn $n \in \{0, 1, \dots, N-1\}$.</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Xác định các mẫu giá trị khác 0 của tín hiệu:</b><br>Biểu thức $u[n] - u[n-2]$ chỉ khác 0 tại hai chỉ số nguyên $n=0$ và $n=1$:<ul><li>Tại $n=0$: $x[0] = 2^0 = 1$.</p>
<p>Tại $n=1$: $x[1] = 2^1 = 2$.</p>
<p>Tại mọi $n \ge 2$ và $n < 0$: $x[n] = 0$.</p>
</ul>
</li>
<p><b>Thay các mẫu vào công thức định nghĩa DTFT:</b>$$X(\Omega) = \sum_{n=0}^{1} x[n] e^{-j\Omega n} = x[0]e^{-j\Omega \cdot 0} + x[1]e^{-j\Omega \cdot 1} = 1 \cdot 1 + 2 \cdot e^{-j\Omega} = 1 + 2e^{-j\Omega}$$</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $1 + 2e^{-j\Omega}$</b> — Tính đúng chính xác 2 mẫu xung $n=0$ và $n=1$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng có thêm $4e^{-j2\Omega}$</b> — Bẫy nhầm lẫn cận: lầm tưởng $u[n] - u[n-2]$ lấy đến $n=2$. Thực tế tại $n=2$: $u[2] - u[0] = 1 - 1 = 0$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng phân thức</b> — Tín hiệu có chiều dài hữu hạn thì khai triển trực tiếp đa thức mũ, không biểu diễn dưới dạng phân thức hữu tỉ vô hạn.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Thử tại $\Omega = 0$: $X(0) = \sum x[n] = x[0] + x[1] = 1 + 2 = 3$. Thay $\Omega = 0$ vào công thức: $1 + 2(1) = 3$ (khớp hoàn toàn).</div>
`
    },
    {
      id: '6-5', t: 6, n: 5, k: 'mc', c: 4, a: 1,
      im: [['6-5.webp', 625, 271]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X(\Omega) = -2j\sin\Omega$</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Định nghĩa biến đổi DTFT:</b> $X(\Omega) = \sum_{n=-\infty}^{\infty} x[n] e^{-j\Omega n}$.</li>
<li><b>Công thức Euler cho hàm sin:</b> $\sin\theta = \dfrac{e^{j\theta} - e^{-j\theta}}{2j} \implies e^{-j\theta} - e^{j\theta} = -2j\sin\theta$.</li>
<li><b>Tính chất đối xứng:</b> Tín hiệu thực và lẻ ($x[-n] = -x[n]$) thì phổ DTFT là hàm <b>thuần ảo và lẻ</b>.</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Xác định khoảng tồn tại và các mẫu giá trị của $x[n]$:</b><br>Hàm cửa sổ $u[n+1] - u[n-2] = 1$ với $n \in \{-1, 0, 1\}$. Tính giá trị hàm tại 3 điểm này:<ul><li>$n = -1 \implies x[-1] = \sin\left(-\frac{\pi}{2}\right) = -1$.</p>
<p>$n = 0 \implies x[0] = \sin(0) = 0$.</p>
<p>$n = 1 \implies x[1] = \sin\left(\frac{\pi}{2}\right) = 1$.</p>
</ul>Nhận xét: $x[-1] = -x[1]$ và $x[0] = 0$, vậy $x[n]$ là tín hiệu thực và lẻ.</li>
<p><b>Áp dụng định nghĩa DTFT:</b>$$X(\Omega) = \sum_{n=-1}^{1} x[n] e^{-j\Omega n} = x[-1]e^{j\Omega} + x[0]e^0 + x[1]e^{-j\Omega}$$Thay các giá trị mẫu đã tính:$$X(\Omega) = (-1)e^{j\Omega} + 0 + 1 \cdot e^{-j\Omega} = e^{-j\Omega} - e^{j\Omega}$$</p>
<p><b>Đưa về hàm lượng giác theo công thức Euler:</b>$$X(\Omega) = -(e^{j\Omega} - e^{-j\Omega}) = -2j \left( \frac{e^{j\Omega} - e^{-j\Omega}}{2j} \right) = -2j\sin\Omega$$</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $-2j\sin\Omega$</b> — Chuẩn xác dấu âm từ hiệu $e^{-j\Omega} - e^{j\Omega}$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng $+2j\sin\Omega$</b> — Bẫy nhầm dấu trong công thức Euler: $e^{j\Omega} - e^{-j\Omega} = 2j\sin\Omega$, trong khi ở đây là $e^{-j\Omega} - e^{j\Omega}$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng có cosin ($2\cos\Omega$)</b> — Sai bản chất toán học: Tín hiệu lẻ không thể sinh ra hàm phổ thực chẵn $\cos\Omega$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Tín hiệu thực và lẻ luôn có $X(0) = \sum x[n] = (-1) + 0 + 1 = 0$, và phổ phải thuần ảo. Thay $\Omega=0$ vào $-2j\sin(0) = 0$ (hoàn toàn thỏa mãn).</div>
`
    },
    {
      id: '6-6', t: 6, n: 6, k: 'mc', c: 4, a: 1,
      im: [['6-6.webp', 627, 333]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X[k] = \dfrac{1}{3}e^{-j\frac{2\pi}{3}k}$</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Công thức hệ số DTFS:</b> $X[k] = \dfrac{1}{N} \sum_{n=\langle N \rangle} x[n] e^{-jk\Omega_0 n}$, trong đó tần số góc cơ sở $\Omega_0 = \dfrac{2\pi}{N}$.</li>
<li><b>Đặc tính chuỗi xung tuần hoàn:</b> $\sum_{m=-\infty}^{\infty} \delta[n - mN - n_0]$ là tín hiệu tuần hoàn với chu kỳ $N$.</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Xác định chu kỳ cơ sở $N$:</b><br>Tín hiệu $x[n] = \sum_{m=-\infty}^{\infty} \delta[n - 3m - 1]$ là dãy xung cách đều nhau $3$ mẫu. Do đó chu kỳ cơ sở là $N = 3$, tần số góc $\Omega_0 = \dfrac{2\pi}{3}$.</p>
<p><b>Xác định vị trí xung trong một chu kỳ chuẩn:</b><br>Chọn chu kỳ quan sát $n \in \{0, 1, 2\}$. Xung xuất hiện khi:$$n - 3m - 1 = 0 \implies n = 3m + 1$$Với $m = 0$, ta có $n = 1 \in \{0, 1, 2\}$.<br>Do đó trong chu kỳ này, chỉ có mẫu $x[1] = 1$, còn $x[0] = x[2] = 0$.</p>
<p><b>Tính hệ số DTFS theo định nghĩa:</b>$$X[k] = \frac{1}{3} \sum_{n=0}^{2} x[n] e^{-jk\frac{2\pi}{3}n} = \frac{1}{3} \cdot x[1] e^{-jk\frac{2\pi}{3}(1)} = \frac{1}{3}e^{-j\frac{2\pi}{3}k}$$</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\dfrac{1}{3}e^{-j\frac{2\pi}{3}k}$</b> — Đúng hệ số chu kỳ $1/N = 1/3$ và pha dịch tương ứng với vị trí xung $n=1$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng thiếu $1/3$</b> — Bẫy quên hệ số tỉ lệ $1/N$ của chuỗi Fourier rời rạc.</li>
<li><span class="vd qbad">SAI</span><b>Dạng số mũ dương $e^{+j\frac{2\pi}{3}k}$</b> — Bẫy nhầm dấu số mũ phân tích: công thức DTFS luôn mang dấu trừ $e^{-j\Omega_0 k n}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Hệ số một chiều DC tại $k = 0$: $X[0] = \dfrac{1}{3} \sum_{n=0}^{2} x[n] = \dfrac{1}{3} (1) = \dfrac{1}{3}$. Thay $k=0$ vào đáp án thu được đúng $\dfrac{1}{3}$.</div>
`
    },
    {
      id: '6-7', t: 6, n: 7, k: 'mc', c: 4, a: 1,
      im: [['6-7.webp', 589, 332]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X[k] = \dfrac{1}{3}$</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Công thức hệ số DTFS:</b> $X[k] = \dfrac{1}{N} \sum_{n=\langle N \rangle} x[n] e^{-j\frac{2\pi}{N}kn}$.</li>
<li><b>Đặc tính chuỗi xung gốc:</b> Chuỗi xung tuần hoàn tại gốc có phổ vạch đồng đều (phổ phẳng).</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Xác định chu kỳ cơ sở $N$:</b><br>Đề bài cho $x[n] = \sum_m \delta[n - 3m]$. Các xung cách nhau 3 đơn vị $\implies N = 3$.</p>
<p><b>Xác định xung trong một chu kỳ:</b><br>Xét chu kỳ cơ sở $n \in \{0, 1, 2\}$. Xung xảy ra khi $n = 3m$, trong khoảng đang xét ứng với $m = 0 \implies n = 0$.<br>Do đó trong một chu kỳ: $x[0] = 1$, các giá trị khác bằng $0$.</p>
<p><b>Tính hệ số DTFS:</b>$$X[k] = \frac{1}{3} \sum_{n=0}^{2} x[n] e^{-j\frac{2\pi}{3}kn} = \frac{1}{3} \cdot 1 \cdot e^{-j\frac{2\pi}{3}k \cdot 0} = \frac{1}{3}$$Kết quả là một hằng số độc lập với $k$, nghĩa là tất cả các sóng hài đều có biên độ bằng nhau.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\dfrac{1}{3}$</b> — Xung nằm ngay tại $n=0$ nên pha bằng 0 ($e^0 = 1$), hệ số bằng $1/N = 1/3$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng chứa pha phụ thuộc $k$</b> — Bẫy nhầm với bài toán xung bị dịch lệch gốc tọa độ.</li>
<li><span class="vd qbad">SAI</span><b>Dạng có giá trị 1</b> — Quên hệ số tỉ lệ $1/N$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Hệ số $X[0]$ luôn bằng giá trị trung bình của tín hiệu trên một chu kỳ: $\bar{x} = \frac{1}{3}(1 + 0 + 0) = \frac{1}{3}$. Vì mọi thành phần điều hòa đều có xung tại $0$, $X[k] = 1/3$ với mọi $k$.</div>
`
    },
    {
      id: '6-8', t: 6, n: 8, k: 'mc', c: 4, a: 1,
      im: [['6-8.webp', 627, 257], ['6-8b.webp', 627, 65]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X[k] = \dfrac{1}{3}e^{j\frac{2\pi}{3}k}$</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Tính chất dịch thời gian của DTFS:</b> Nếu $x_0[n] \ \longleftrightarrow\ X_0[k]$ thì $x_0[n - n_0] \ \longleftrightarrow\ e^{-j\frac{2\pi}{N}k n_0} X_0[k]$.</li>
<li><b>Tính tuần hoàn của hàm mũ phức:</b> $e^{-j2\pi k} = 1$ với mọi số nguyên $k$.</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Cách 1 — Dùng tính chất dịch thời gian:</b><br>Nhận xét rằng $x[n] = \sum_m \delta[n - 3m + 1] = x_0[n + 1]$, trong đó $x_0[n] = \sum_m \delta[n - 3m]$ là chuỗi xung gốc ở Câu 7 (dịch trái $n_0 = -1$).<br>Từ Câu 7 ta đã có $X_0[k] = \dfrac{1}{3}$. Áp dụng tính chất dịch:$$X[k] = e^{-j\frac{2\pi}{3}k(-1)} X_0[k] = \frac{1}{3}e^{j\frac{2\pi}{3}k}$$</p>
<p><b>Cách 2 — Tính theo định nghĩa trong chu kỳ:</b><br>Xét chu kỳ $n \in \{0, 1, 2\}$. Xung xảy ra tại $n = 3m - 1$. Với $m = 1 \implies n = 2 \in \{0, 1, 2\}$.<br>Tính tích phân Fourier rời rạc:$$X[k] = \frac{1}{3} \cdot 1 \cdot e^{-j\frac{2\pi}{3}k \cdot 2} = \frac{1}{3}e^{-j\frac{4\pi}{3}k}$$Vì $e^{-j2\pi k} = 1$, ta biến đổi số mũ:$$e^{-j\frac{4\pi}{3}k} = e^{-j2\pi k} \cdot e^{j\frac{2\pi}{3}k} = 1 \cdot e^{j\frac{2\pi}{3}k} \implies X[k] = \frac{1}{3}e^{j\frac{2\pi}{3}k}$$</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\dfrac{1}{3}e^{j\frac{2\pi}{3}k}$</b> — Dịch trái 1 đơn vị ($n+1$) ứng với pha dương $+j\frac{2\pi}{3}k$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng có pha âm $e^{-j\frac{2\pi}{3}k}$</b> — Bẫy nhầm giữa dịch trái $+1$ và dịch phải $-1$ (đây là đáp án của Câu 6).</li>
<li><span class="vd qbad">SAI</span><b>Dạng $e^{-j\frac{4\pi}{3}k}$ chưa rút gọn</b> — Về mặt toán học hai dạng này bằng nhau, nhưng đề thi trắc nghiệm thường chuẩn hóa số mũ về khoảng $(-\pi, \pi]$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm tra tính liên hợp phức: Do $x[n]$ là tín hiệu thực nên hệ số phổ phải thỏa mãn $X[-k] = X^*[k]$. Ta có $X^*[k] = \frac{1}{3}e^{-j\frac{2\pi}{3}k} = X[-k]$ (hoàn toàn thỏa mãn).</div>
`
    },
    {
      id: '6-9', t: 6, n: 9, k: 'mc', c: 4, a: 1,
      im: [['6-9.webp', 690, 346]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X[k] = -\dfrac{1}{2}\delta[k-2] - \dfrac{1}{2}\delta[k+2] + \delta[k-3] + \delta[k+3]$</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Dạng mũ phức của chuỗi Fourier liên tục (FS):</b> $x(t) = \sum_{k=-\infty}^{\infty} X[k] e^{jk\omega_0 t}$.</li>
<li><b>Công thức Euler và lượng giác:</b> $\cos\theta = \dfrac{e^{j\theta} + e^{-j\theta}}{2}$ &nbsp;và&nbsp; $\sin\left(\theta - \dfrac{\pi}{2}\right) = -\cos\theta$.</li>
<li><b>Tần số góc cơ sở $\omega_0$:</b> Là ước chung lớn nhất của các tần số góc thành phần.</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Xác định tần số góc cơ sở $\omega_0$:</b><br>Tín hiệu gồm hai thành phần tuần hoàn với tần số góc: $\omega_1 = \dfrac{\pi}{3}$ và $\omega_2 = \dfrac{\pi}{2}$.<br>Tỉ số $\dfrac{\omega_1}{\omega_2} = \dfrac{2}{3} \in \mathbb{Q}$ nên tín hiệu tuần hoàn. Tần số góc cơ sở là:$$\omega_0 = \text{ƯCLN}\left(\frac{\pi}{3}, \frac{\pi}{2}\right) = \frac{\pi}{6} \implies \omega_1 = 2\omega_0, \quad \omega_2 = 3\omega_0$$</p>
<p><b>Phân tích thành phần thứ nhất theo Euler:</b>$$\sin\left(\frac{\pi}{3}t - \frac{\pi}{2}\right) = -\cos\left(\frac{\pi}{3}t\right) = -\cos(2\omega_0 t) = -\frac{1}{2}e^{j2\omega_0 t} - \frac{1}{2}e^{-j2\omega_0 t}$$Thành phần này đóng góp cho hệ số tại các chỉ số $k = 2$ và $k = -2$:$$X[2] = -\frac{1}{2}, \quad X[-2] = -\frac{1}{2}$$</p>
<p><b>Phân tích thành phần thứ hai theo Euler:</b>$$2\cos\left(\frac{\pi}{2}t\right) = 2\cos(3\omega_0 t) = 2 \cdot \frac{e^{j3\omega_0 t} + e^{-j3\omega_0 t}}{2} = 1 \cdot e^{j3\omega_0 t} + 1 \cdot e^{-j3\omega_0 t}$$Thành phần này đóng góp cho hệ số tại các chỉ số $k = 3$ và $k = -3$:$$X[3] = 1, \quad X[-3] = 1$$</p>
<p><b>Tổng hợp biểu thức hệ số phổ $X[k]$:</b><br>Biểu diễn qua hàm delta Kronecker:$$X[k] = -\frac{1}{2}\delta[k-2] - \frac{1}{2}\delta[k+2] + \delta[k-3] + \delta[k+3]$$</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $-\dfrac{1}{2}\delta[k\mp 2] + \delta[k\mp 3]$</b> — Đúng chỉ số hài $k=\pm 2, \pm 3$ và chuẩn xác dấu âm từ $-\cos$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng có dấu dương $+1/2$ tại $k=\pm 2$</b> — Bẫy quên dấu trừ khi đổi từ $\sin(\theta - \pi/2)$ sang $-\cos\theta$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng sai chỉ số $k$ (ví dụ $k=\pm 1, \pm 2$)</b> — Bẫy tìm sai tần số cơ sở $\omega_0$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Tín hiệu $x(t)$ là hàm chẵn và thực vì $-\cos(2\omega_0 t)$ và $2\cos(3\omega_0 t)$ đều là hàm chẵn. Do đó phổ FS $X[k]$ phải là hàm <b>thực và chẵn</b>: $X[-k] = X[k] \in \mathbb{R}$. Rõ ràng $X[-2]=X[2]=-1/2$ và $X[-3]=X[3]=1$ thỏa mãn hoàn hảo.</div>
`
    },
    {
      id: '6-10', t: 6, n: 10, k: 'mc', c: 4, a: 1,
      im: [['6-10.webp', 591, 491]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X[1] = \dfrac{3}{2}e^{j\pi/4}, \quad X[-1] = \dfrac{3}{2}e^{-j\pi/4}$ &nbsp; (các $X[k]$ khác $= 0$)</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Khai triển Euler cho hàm cosin có pha:</b>$$A\cos(\omega_0 t + \varphi) = \frac{A}{2}e^{j\varphi} e^{j\omega_0 t} + \frac{A}{2}e^{-j\varphi} e^{-j\omega_0 t}$$</li>
<li><b>Đồng nhất với chuỗi Fourier liên tục:</b> $x(t) = \sum_{k=-\infty}^{\infty} X[k] e^{jk\omega_0 t}$.</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Xác định tần số góc cơ sở $\omega_0$:</b><br>Tín hiệu đề bài là một dao động điều hòa đơn tần số: $x(t) = 3\cos\left(\frac{\pi}{2}t + \frac{\pi}{4}\right)$. Do đó tần số góc cơ sở chính là $\omega_0 = \dfrac{\pi}{2}$.</p>
<p><b>Khai triển Euler đưa về tổng các hàm mũ phức:</b>$$x(t) = 3 \cdot \frac{e^{j(\frac{\pi}{2}t + \frac{\pi}{4})} + e^{-j(\frac{\pi}{2}t + \frac{\pi}{4})}}{2} = \frac{3}{2}e^{j\pi/4} e^{j\frac{\pi}{2}t} + \frac{3}{2}e^{-j\pi/4} e^{-j\frac{\pi}{2}t}$$</p>
<p><b>Đồng nhất hệ số với chuỗi Fourier:</b><br>Viết dưới dạng $x(t) = X[1]e^{j\omega_0 t} + X[-1]e^{-j\omega_0 t}$, ta rút ra trực tiếp:<ul><li>Tại sóng hài cơ bản dương ($k = 1$): $X[1] = \dfrac{3}{2}e^{j\pi/4}$.</p>
<p>Tại sóng hài cơ bản âm ($k = -1$): $X[-1] = \dfrac{3}{2}e^{-j\pi/4}$.</p>
<p>Mọi sóng hài bậc khác ($|k| \neq 1$): $X[k] = 0$.</p>
</ul>
</li>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $X[1] = \dfrac{3}{2}e^{j\pi/4},\ X[-1] = \dfrac{3}{2}e^{-j\pi/4}$</b> — Đúng biên độ $A/2 = 3/2$ và cặp pha liên hợp phức $\pm \pi/4$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng có cùng pha dương $+j\pi/4$ ở cả hai hệ số</b> — Bẫy quên tính liên hợp: $X[-k] = X^*[k]$ với mọi tín hiệu thực.</li>
<li><span class="vd qbad">SAI</span><b>Dạng giữ nguyên biên độ 3</b> — Quên chia đôi biên độ $A/2$ khi khai triển hàm cos theo công thức Euler.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Thử tính $x(0)$: $x(0) = 3\cos(\pi/4) = \dfrac{3\sqrt{2}}{2}$. Tổng các hệ số: $X[1] + X[-1] = \dfrac{3}{2}(e^{j\pi/4} + e^{-j\pi/4}) = \dfrac{3}{2} \cdot 2\cos(\pi/4) = \dfrac{3\sqrt{2}}{2}$ (khớp chính xác).</div>
`
    },
    {
      id: '6-11', t: 6, n: 11, k: 'mc', c: 4, a: 1,
      im: [['6-11.webp', 685, 26], ['6-11b.webp', 685, 299]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X[k] = \delta[k] - \dfrac{j}{2}\delta[k-2] + \dfrac{j}{2}\delta[k+2] - \dfrac{e^j}{2}\delta[k-3] - \dfrac{e^{-j}}{2}\delta[k+3]$</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Khai triển Euler hàm sin và cos:</b>$$\sin(\omega t) = \frac{e^{j\omega t} - e^{-j\omega t}}{2j} = -\frac{j}{2}e^{j\omega t} + \frac{j}{2}e^{-j\omega t}, \qquad \cos(\omega t + \varphi) = \frac{e^{j\varphi}e^{j\omega t} + e^{-j\varphi}e^{-j\omega t}}{2}$$</li>
<li><b>Thành phần DC (hằng số):</b> Số hạng hằng số $C$ tương ứng với hệ số $X[0] = C$ (tức $C \cdot \delta[k]$).</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Xác định tần số góc cơ sở $\omega_0$:</b><br>Tín hiệu có hai tần số góc $\omega_1 = 2$ và $\omega_2 = 3$. Tần số cơ sở $\omega_0 = \text{ƯCLN}(2, 3) = 1$ rad/s. Như vậy $\omega_1 = 2\omega_0$ (ứng với $k = \pm 2$) và $\omega_2 = 3\omega_0$ (ứng với $k = \pm 3$).</p>
<p><b>Khai triển từng số hạng của $x(t)$:</b><ul><li><b>Số hạng 1:</b> $\sin(2t) = \dfrac{e^{j2t} - e^{-j2t}}{2j} = -\dfrac{j}{2}e^{j2t} + \dfrac{j}{2}e^{-j2t}$.<br>Đóng góp: $-\dfrac{j}{2}\delta[k-2] + \dfrac{j}{2}\delta[k+2]$.</p>
<p><b>Số hạng 2:</b> $-\cos(3t+1) = -\dfrac{e^{j(3t+1)} + e^{-j(3t+1)}}{2} = -\dfrac{e^j}{2}e^{j3t} - \dfrac{e^{-j}}{2}e^{-j3t}$.<br>Đóng góp: $-\dfrac{e^j}{2}\delta[k-3] - \dfrac{e^{-j}}{2}\delta[k+3]$.</p>
<p><b>Số hạng 3:</b> $+1 = 1 \cdot e^{j0 \cdot t} \implies$ Đóng góp: $+1 \cdot \delta[k]$.</p>
</ul>
</li>
<p><b>Tổng hợp tất cả các hệ số phổ FS:</b>$$X[k] = \delta[k] - \frac{j}{2}\delta[k-2] + \frac{j}{2}\delta[k+2] - \frac{e^j}{2}\delta[k-3] - \frac{e^{-j}}{2}\delta[k+3]$$</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\delta[k] - \dfrac{j}{2}\delta[k-2] + \dots$</b> — Chuẩn xác dấu âm $-j/2$ ở $k=2$ và $+j/2$ ở $k=-2$ do nhân nghịch đảo $1/j = -j$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng nhầm dấu thành $+j/2$ tại $k=2$</b> — Bẫy kinh điển khi chia cho $j$: Quên rằng $\frac{1}{2j} = -\frac{j}{2}$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng mất thành phần hằng số $\delta[k]$</b> — Quên thành phần một chiều $X[0] = 1$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm tra tính liên hợp: Vì $x(t)$ thực nên $X[-k] = X^*[k]$.<br>Ta có $X[2] = -j/2 \implies X[-2] = (X[2])^* = j/2$ (đúng).<br>Ta có $X[3] = -e^j/2 \implies X[-3] = (-e^j/2)^* = -e^{-j}/2$ (đúng).</div>
`
    },
    {
      id: '6-12', t: 6, n: 12, k: 'mc', c: 4, a: 1,
      im: [['6-12.webp', 834, 410]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: Với $k \neq 0$: $X[k] = \dfrac{1 - e^{-jk\pi}}{j2k\pi}$; &nbsp; Với $k = 0$: $X[0] = \dfrac{1}{2}$</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm"><ul><li><b>Tần số góc cơ sở:</b> $\omega_0 = \dfrac{2\pi}{T}$.</li>
<li><b>Công thức hệ số Fourier liên tục trên 1 chu kỳ $[0, T)$:</b>$$X[k] = \frac{1}{T} \int_{0}^{T} x(t) e^{-jk\omega_0 t} dt$$</li>
<li><b>Lưu ý quan trọng:</b> Thành phần DC ($k = 0$) luôn phải tính riêng để tránh dạng vô định $\frac{0}{0}$.</li>
</ul>
</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p><b>Xác định chu kỳ và tần số góc:</b><br>Tín hiệu có chu kỳ $T = 2$ giây $\implies \omega_0 = \dfrac{2\pi}{2} = \pi$ rad/s. Trong chu kỳ $[0, 2)$:$$x(t) = \begin{cases} 1, & 0 \le t < 1 \\ 0, & 1 \le t < 2 \end{cases}$$</p>
<p><b>Tính hệ số $X[k]$ với $k \neq 0$:</b><br>Tích phân chỉ lấy trên khoảng $[0, 1)$ nơi $x(t) = 1$:$$X[k] = \frac{1}{2} \int_{0}^{1} 1 \cdot e^{-jk\pi t} dt = \frac{1}{2} \left[ \frac{e^{-jk\pi t}}{-jk\pi} \right]_{0}^{1} = \frac{1}{2} \cdot \frac{e^{-jk\pi} - e^0}{-jk\pi} = \frac{1 - e^{-jk\pi}}{j2k\pi}$$</p>
<p><b>Tính riêng thành phần một chiều $X[0]$ ($k = 0$):</b><br>Thay trực tiếp $k = 0$ vào tích phân ban đầu (không thay vào biểu thức chứa $k$ ở mẫu):$$X[0] = \frac{1}{2} \int_{0}^{1} 1 \cdot dt = \frac{1}{2} [t]_0^1 = \frac{1}{2}$$</p>
<p><b>Kết luận dạng tường minh:</b>$$X[k] = \begin{cases} \dfrac{1 - e^{-jk\pi}}{j2k\pi}, & k \neq 0 \\[8pt] \dfrac{1}{2}, & k = 0 \end{cases}$$Vì $e^{-jk\pi} = (-1)^k$: Nếu $k$ chẵn ($k \neq 0$) thì $X[k] = 0$; Nếu $k$ lẻ thì $X[k] = \dfrac{1}{jk\pi}$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\dfrac{1-e^{-jk\pi}}{j2k\pi}$ ($k \neq 0$) và $X[0] = 1/2$</b> — Tính đúng tích phân và tách biệt riêng trường hợp $k=0$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng thiếu hệ số $1/2$</b> — Quên nhân $1/T = 1/2$ phía trước tích phân chuỗi Fourier.</li>
<li><span class="vd qbad">SAI</span><b>Dạng gộp $k=0$ vào công thức chung</b> — Sai phạm toán học vì mẫu số bị triệt tiêu bằng 0.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Giá trị $X[0]$ chính là diện tích xung trong 1 chu kỳ chia cho chu kỳ: $\text{Diện tích} = 1 \times 1 = 1 \implies X[0] = \frac{1}{2}$. Kết quả $1/2$ khớp hoàn toàn về mặt ý nghĩa vật lý.</div>
`
    },
    {
      id: '7-1', t: 7, n: 1, k: 'mc', c: 4, a: 1,
      im: [['7-1.webp', 854, 406]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $X[k]=\frac{1}{10}(1-e^{\frac{j2\pi k}{5}})$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">DTFS ngược: $x[n]=\sum_{k=0}^{N-1} X[k]e^{\frac{j2\pi kn}{N}}$. DTFT: $\delta [n-n_{0}]$ ↔ $e^{-j\Omega n_{0}}$. Hai hệ số đối xứng $\pm k$ ghép thành sin/cos.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x[n]$ tuần hoàn $N=10$, trong một chu kỳ $x[0]=1$, $x[8]=-1$, và $x[n]=0$ tại các mẫu khác.</p>
<p>Đây là phép tính hệ số DTFS (không phải phép Fourier ngược): $X[k]=\frac{1}{N}\sum _{n=0}^{N-1}x[n]e^{-j\frac{2\pi }{N}kn}$.</p>
<p>Thế $N=10$ và chỉ giữ hai mẫu khác 0: $X[k]=\frac{1}{10}[1\cdot e^{0}+(-1)\cdot e^{-j\frac{2\pi }{10}k\cdot 8}]$.</p>
<p>Suy ra $X[k]=\frac{1}{10}(1-e^{-j8\pi k/5})$. Vì $k$ nguyên, trừ thêm $2\pi k$ không đổi mũ phức: $-8\pi k/5=+2\pi k/5-2\pi k$.</p>
<p>Do $e^{-j2\pi k}=1$, ta có $X[k]=\frac{1}{10}(1-e^{+j2\pi k/5})$. Đây là dạng trong đáp án 1.</p>
<p>Hai dạng pha $e^{-j8\pi k/5}$ và $e^{+j2\pi k/5}$ HOÀN TOÀN tương đương cho $k\in \mathbb{Z}$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\frac{1}{10}(1-e^{+j2\pi k/5})$</b> — Tương đương công thức trực tiếp với xung $n=8$.</li>
<li><span class="vd qbad">SAI</span><b>2. $\frac{1}{10}(1-e^{-j2\pi k/5})$</b> — Đổi dấu pha như thể xung ở $n=2$ thay vì $n=8\equiv -2$.</li>
<li><span class="vd qbad">SAI</span><b>3. $\frac{1}{10}e^{-j2\pi k/5}$</b> — Không có số hạng +1 của xung $n=0$ và dấu − của xung $n=8$.</li>
<li><span class="vd qbad">SAI</span><b>4. $\frac{1}{10}e^{+j2\pi k/5}$</b> — Cũng bỏ mất xung $n=0$; kết quả chỉ một hàm mũ.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm $k=0$: tổng tín hiệu trong chu kỳ là $1+(-1)=0 \implies X[0]=0$; đáp án 1 cho 0, các đáp án chỉ một mũ cho 1/10 (sai).</div>
`
    },
    {
      id: '7-2', t: 7, n: 2, k: 'mc', c: 4, a: 1,
      im: [['7-2.webp', 846, 334]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y[n]=\frac{1}{2}[x[n+2]+x[n-2]]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">DTFS ngược: $x[n]=\sum_{k=0}^{N-1} X[k]e^{\frac{j2\pi kn}{N}}$. DTFT: $\delta [n-n_{0}]$ ↔ $e^{-j\Omega n_{0}}$. Hai hệ số đối xứng $\pm k$ ghép thành sin/cos.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $x[n]$, $y[n]$ cùng chu kỳ $N=20$, với $Y[k]=\cos \frac{\pi k}{5}X[k]$. Tần số góc cơ sở $\Omega _{0}=2\pi /20=\frac{\pi }{10}$.</p>
<p>Đổi $\pi k/5$ thành $2\Omega _{0}k$ vì $2\cdot \frac{\pi }{10}k=\pi k/5$.</p>
<p>Dùng Euler $\cos (2\Omega _{0}k)=(e^{j2\Omega _{0}k}+e^{-j2\Omega _{0}k})/2$.</p>
<p>Vậy $Y[k]=\frac{1}{2} e^{j2\Omega _{0}k}X[k]+\frac{1}{2} e^{-j2\Omega _{0}k}X[k]$.</p>
<p>Từ định nghĩa DTFS: $x[n-n_{0}]$ ↔ $e^{-jk\Omega _{0}n_{0}}X[k]$; do đó $e^{+j2k\Omega _{0}}X[k]$ ↔ $x[n+2]$ và $e^{-j2k\Omega _{0}}X[k]$ ↔ $x[n-2]$.</p>
<p>Cộng hai phần: $y[n]=\frac{1}{2}[x[n+2]+x[n-2]]$.</p>
<p>Không được nhầm $k$ ở miền hệ số Fourier với $n$ ở miền thời gian; nhân hệ số bởi cos tương ứng tổng hai bản DỊCH tín hiệu.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\frac{1}{2}(x[n+2]+x[n-2])$</b> — Dịch hai phía 2 mẫu đúng $\cos \frac{\pi k}{5}$.</li>
<li><span class="vd qbad">SAI</span><b>2. $\frac{1}{2}(x[n+4]+x[n-4])$</b> — Dịch 4 mẫu sinh $\cos (4\Omega _{0}k)=\cos \frac{2\pi k}{5}$, gấp đôi pha yêu cầu.</li>
<li><span class="vd qbad">SAI</span><b>3. $x[n+2]$</b> — Chỉ giữ mũ $e^{+j2\Omega _{0}k}$, thiếu nửa còn lại.</li>
<li><span class="vd qbad">SAI</span><b>4. $x[n+4]$</b> — Chỉ một dịch +4, vừa thiếu trung bình hai dịch, vừa sai độ lớn dịch.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Thử một tín hiệu bất kỳ $x[n]=\delta [n]$ tuần hoàn $N=20$: $y$ có hai xung tại $n=\pm 2$ mỗi xung 1/2. Đó chính là kết quả của nhân phổ bởi $\cos \frac{\pi k}{5}$.</div>
`
    },
    {
      id: '7-3', t: 7, n: 3, k: 'mc', c: 4, a: 1,
      im: [['7-3.webp', 849, 339]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Theo các lựa chọn của quiz: phương án 1 về vị trí và dấu. TUY NHIÊN theo công thức DTFS chuẩn trong slide $(X[k]=1/N\cdot \sum x[n]e^{-jk\Omega _{0}n})$ thì các biên độ xung của phương án 1 còn phải nhân 11; không có phương án hoàn toàn đúng.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">DTFS ngược: $x[n]=\sum_{k=0}^{N-1} X[k]e^{\frac{j2\pi kn}{N}}$. DTFT: $\delta [n-n_{0}]$ ↔ $e^{-j\Omega n_{0}}$. Hai hệ số đối xứng $\pm k$ ghép thành sin/cos.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $X[k]=\cos (\frac{4\pi }{11}k)+2j \sin (\frac{6\pi }{11}k)$, tín hiệu có chu kỳ $N=11$ (đề nêu một chu kỳ $-5\le n\le 5)$. Chúng ta phải phân biệt QUY ƯỚC hệ số Fourier.</p>
<p>Đặt $\Omega _{0}=2\pi /11$. Dùng Euler: $\cos (2\Omega _{0}k)=[e^{j2\Omega _{0}k}+e^{-j2\Omega _{0}k}]/2$.</p>
<p>Cũng có 2j $\sin (3\Omega _{0}k)=e^{j3\Omega _{0}k}-e^{-j3\Omega _{0}k}$. Vậy $X[k]=\frac{1}{2}e^{j2\Omega _{0}k}+\frac{1}{2}e^{-j2\Omega _{0}k}+e^{j3\Omega _{0}k}-e^{-j3\Omega _{0}k}$.</p>
<p>Nếu coi mỗi $e^{-jk\Omega _{0}m}$ là phổ của một xung $\delta [n-m]$ KHÔNG CHIA CHU KỲ, ta đọc được hai xung ½ ở $n=\pm 2$ và hai xung $\pm 1$ ở $n=\mp 3$: $x_{\text\{pattern\}}[n]=\frac{1}{2}\delta [n-2]+\frac{1}{2}\delta [n+2]-\delta [n-3]+\delta [n+3]$. Đây là PHƯƠNG ÁN 1 được đề gợi ý.</p>
<p>TUY NHIÊN, theo định nghĩa DTFS chuẩn trong slide: $X[k]=\frac{1}{N}\sum _{n=0}^{N-1}x[n]e^{-jk\Omega _{0}n}$ và $x[n]=\sum _{k=0}^{N-1}X[k]e^{jk\Omega _{0}n}$. Theo chuẩn này, $x[n]=N\cdot x_{\text\{pattern\}}[n]=11\cdot x_{\text\{pattern\}}[n]$, không phải $x_{\text\{pattern\}}[n]$.</p>
<p>Vì thế nếu làm chặt chẽ theo slide, các lựa chọn đều thiếu nhân tử 11; ta không nên ghi “PA1 đã được chứng minh hoàn toàn đúng” nếu đề không thông báo dùng chuẩn hóa khác.</p>
<p>Dấu các xung vẫn kiểm được rõ: $e^{+j3\Omega _{0}k}$ là xung $n=-3$, $e^{-j3\Omega _{0}k}$ là $n=+3$ nhưng dấu âm nên hệ số tại +3 là âm.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qmid">KHỚP DẤU/VỊ TRÍ</span><b>1. $\frac{1}{2}\delta [n-2]+\frac{1}{2}\delta [n+2]-\delta [n-3]+\delta [n+3]$</b> — Đúng dạng tương đối như các phương án trắc nghiệm, nhưng theo DTFS chuẩn hóa của slide còn thiếu nhân tử 11.</li>
<li><span class="vd qbad">SAI DẤU</span><b>2. $\frac{1}{2}\delta [n-2]+\frac{1}{2}\delta [n+2]+\delta [n-3]-\delta [n+3]$</b> — Hoán đổi dấu hai xung $n=+3$ và $n=-3$.</li>
<li><span class="vd qbad">SAI HỆ SỐ</span><b>3. $\delta [n-2]+\delta [n+2]-2\delta [n-3]+2\delta [n+3]$</b> — Gấp đôi tất cả hệ số so với dạng đề gợi ý, vẫn không khắc phục chuẩn hóa 11.</li>
<li><span class="vd qbad">SAI DẤU/HỆ SỐ</span><b>4. $\delta [n-2]+\delta [n+2]+2\delta [n-3]-2\delta [n+3]$</b> — Vừa gấp đôi biên độ, vừa đổi dấu hai xung $\pm 3$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm công thức chuẩn bằng tổng $\sum _{k=0}^{10}e^{j2\pi km/11}=11$ nếu m≡0 mod11, ngược lại 0. Vì thế Fourier ngược của $e^{-j2\pi k\cdot \frac{2}{11}}$ cho $11\delta [n-2]$ trên một chu kỳ.</div>
<div class="qcheck" style="border-left-color:var(--c4)"><b>Lưu ý quan trọng:</b> Câu này có lỗi chuẩn hóa: đáp án trắc nghiệm 1 dùng mô hình “xung ↔ mũ” thiếu 1/N. Theo công thức DTFS trong slide, phải nhân toàn bộ biên độ xung với $N=11$. Mình hiển thị cả đáp án dự kiến lẫn kết luận toán học.</div>
<div class="qcheck" style="border-left-color:var(--c4)"><b>Lưu ý bổ sung:</b> Phát hiện khác biệt chuẩn hóa Fourier của đề: $X[k]$ đã cho không tương ứng với biên độ xung trong bốn lựa chọn nếu dùng định nghĩa DTFS của slide. Lời giải giải thích chi tiết.</div>
`
    },
    {
      id: '7-4', t: 7, n: 4, k: 'mc', c: 4, a: 1,
      im: [['7-4.webp', 517, 309]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x[n]=\frac{1}{2}\delta [n+2]+\frac{1}{2}\delta [n-2]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">DTFS ngược: $x[n]=\sum_{k=0}^{N-1} X[k]e^{\frac{j2\pi kn}{N}}$. DTFT: $\delta [n-n_{0}]$ ↔ $e^{-j\Omega n_{0}}$. Hai hệ số đối xứng $\pm k$ ghép thành sin/cos.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $X(\Omega )=\sin (2\Omega +\frac{\pi }{2})$. Dùng công thức lượng giác $\sin (\theta +\frac{\pi }{2})=\cos \theta$, nên $X(\Omega )=\cos (2\Omega )$.</p>
<p>Viết Euler: $\cos (2\Omega )=[e^{+j2\Omega }+e^{-j2\Omega }]/2$.</p>
<p>Cặp DTFT cơ bản: $\delta [n-n_{0}]$ ↔ $e^{-j\Omega n_{0}}$. Vì thế $e^{-j2\Omega }$ ứng với $\delta [n-2]$.</p>
<p>Ngược lại $e^{+j2\Omega }=e^{-j\Omega (-2)}$ ứng với $\delta [n+2]$.</p>
<p>Tổng hai vạch cho $x[n]=\frac{1}{2}\delta [n-2]+\frac{1}{2}\delta [n+2]$. Đây là dãy thực chẵn, phù hợp phổ cos thực chẵn.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\frac{1}{2}(\delta [n+2]+\delta [n-2])$</b> — Hai mũ có hệ số 1/2, vị trí $\pm 2$.</li>
<li><span class="vd qbad">SAI</span><b>2. $\frac{j}{2}(\delta [n+2]-\delta [n-2])$</b> — Là kiểu tổ hợp tạo sin, không tạo $\cos (2\Omega )$.</li>
<li><span class="vd qbad">SAI</span><b>3. $\delta [n+1]+\delta [n-1]$</b> — Vị trí $\pm 1$ tương ứng $\cos \Omega$, không $\cos 2\Omega$; hệ số còn thiếu 1/2.</li>
<li><span class="vd qbad">SAI</span><b>4. $j(\delta [n+1]-\delta [n-1])$</b> — Sai cả vị trí xung và dạng lẻ/pha $j$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm $X(0)=\cos 0=1$; $x[-2]+x[2]=\frac{1}{2}+\frac{1}{2}=1$, khớp. Tín hiệu $x[n]$ phải là dãy chẵn và thực.</div>
`
    },
    {
      id: '7-5', t: 7, n: 5, k: 'mc', c: 4, a: 1,
      im: [['7-5.webp', 845, 280], ['7-5b.webp', 845, 47]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x[n]=2\cos \frac{2\pi n}{3}-2\cos (\pi n)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">DTFS ngược: $x[n]=\sum_{k=0}^{N-1} X[k]e^{\frac{j2\pi kn}{N}}$. DTFT: $\delta [n-n_{0}]$ ↔ $e^{-j\Omega n_{0}}$. Hai hệ số đối xứng $\pm k$ ghép thành sin/cos.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $N=6$, hệ số Fourier khác 0 tại $k=2$ (bằng 1), $k=3$ (bằng −2), $k=4$ (bằng 1). Tất cả $k=0,1,5$ bằng 0.</p>
<p>Nghịch biến đổi DTFS: $x[n]=\sum _{k=0}^{5}X[k]e^{j\frac{2\pi }{6}kn}=e^{j2\pi n/3}-2e^{j\pi n}+e^{j4\pi n/3}$.</p>
<p>Vì $n$ nguyên, $e^{j4\pi n/3}=e^{-j2\pi n/3}e^{j2\pi n}=e^{-j2\pi n/3}$.</p>
<p>Ghép hai số hạng biên $k=2,4$: $e^{j2\pi n/3}+e^{-j2\pi n/3}=2\cos \frac{2\pi n}{3}$.</p>
<p>Số hạng giữa: $-2e^{j\pi n}=-2(-1)^{n}=-2\cos (\pi n)$ vì $\sin (\pi n)=0$ với $n$ nguyên.</p>
<p>Kết luận $x[n]=2\cos \frac{2\pi n}{3}-2\cos (\pi n)$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $2\cos \frac{2\pi n}{3}-2\cos (\pi n)$</b> — Khớp nhóm hệ số $k=2,4$ và $k=3$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng có $-4\cos (\pi n)$</b> — Hệ số $X[3]=-2$ nằm ở điểm Nyquist tự liên hợp, chỉ sinh $-2(-1)^{n}$, không nhân đôi thêm.</li>
<li><span class="vd qbad">SAI</span><b>Dạng dấu $+2\cos (\pi n)$</b> — Quên dấu − của $X[3]$.</li>
<li><span class="vd qbad">SAI</span><b>Dạng thiếu một cos bậc 2</b> — Bỏ mất một trong hai hệ số $X[2]=X[4]=1$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm $n=0$: $x[0]=1-2+1=0$ từ chuỗi ngược, công thức cos cho $2-2=0. n=1$: $2\cos \frac{2\pi }{3}-2\cos \pi =-1+2=1$.</div>
`
    },
    {
      id: '7-6', t: 7, n: 6, k: 'mc', c: 4, a: 1,
      im: [['7-6.webp', 844, 283]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x(t)=2\sin (2\pi t)+4\cos (3\pi t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">DTFS ngược: $x[n]=\sum_{k=0}^{N-1} X[k]e^{\frac{j2\pi kn}{N}}$. DTFT: $\delta [n-n_{0}]$ ↔ $e^{-j\Omega n_{0}}$. Hai hệ số đối xứng $\pm k$ ghép thành sin/cos.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề cho chuỗi Fourier liên tục với $\omega _{0}=\pi$ (tương ứng $T=2)$ và một số hệ số khác 0, gồm $X[2]=-j$, $X[-2]=+j$, $X[3]=X[-3]=2$.</p>
<p>Công thức nghịch Fourier series: $x(t)=\sum _{k=-\infty }^{\infty }X[k]e^{jk\omega _{0}t}$. Chỉ giữ $k=\pm 2,\pm 3$.</p>
<p>Cặp $k=\pm 2$: $-je^{j2\pi t}+je^{-j2\pi t}=j(e^{-j2\pi t}-e^{j2\pi t})=j(-2j \sin 2\pi t)=2\sin (2\pi t)$.</p>
<p>Cặp $k=\pm 3$: $2e^{j3\pi t}+2e^{-j3\pi t}=2\cdot 2\cos (3\pi t)=4\cos (3\pi t)$.</p>
<p>Cộng hai cặp: $x(t)=2\sin (2\pi t)+4\cos (3\pi t)$.</p>
<p>Đối với sin, hai hệ số $k=\pm 2$ là số thuần ảo đối dấu; đối với cos, hai hệ số $k=\pm 3$ là số thực bằng nhau.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $2\sin (2\pi t)+4\cos (3\pi t)$</b> — Dấu của $\pm j$ và biên độ cặp cos cho đúng.</li>
<li><span class="vd qbad">SAI</span><b>Các dạng dấu $-\sin (2\pi t)$</b> — $-je^{j\theta }+je^{-j\theta }=+2\sin \theta$.</li>
<li><span class="vd qbad">SAI</span><b>Các dạng chỉ $2\cos (3\pi t)$</b> — Mỗi hệ số cos bằng 2, ghép hai nhánh thành biên độ 4.</li>
<li><span class="vd qbad">SAI</span><b>Các dạng sin/cos hoán đổi</b> — Hệ số thuần ảo đối dấu ở $\pm 2$ biểu thị sin, còn hệ số thực đối xứng ở $\pm 3$ biểu thị cos.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm tại $t=0$: tổng tất cả hệ số $=-j+j+2+2=4$; công thức thời gian cho $0+4=4$.</div>
`
    },
    {
      id: '7-7', t: 7, n: 7, k: 'mc', c: 4, a: 1,
      im: [['7-7.webp', 828, 319]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x(t)=2\cos \frac{2\pi t}{3}+4\sin (\pi t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">DTFS ngược: $x[n]=\sum_{k=0}^{N-1} X[k]e^{\frac{j2\pi kn}{N}}$. DTFT: $\delta [n-n_{0}]$ ↔ $e^{-j\Omega n_{0}}$. Hai hệ số đối xứng $\pm k$ ghép thành sin/cos.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: tín hiệu tuần hoàn $T=6 \implies \omega _{0}=2\pi /6=\frac{\pi }{3}$. Hệ số khác 0: $X[\pm 2]=1$; $X[3]=-2j$, $X[-3]=+2j$.</p>
<p>Chuỗi ngược: $x(t)=e^{j2\omega _{0}t}+e^{-j2\omega _{0}t}-2je^{j3\omega _{0}t}+2je^{-j3\omega _{0}t}$.</p>
<p>Hai nhánh $\pm 2$: $e^{j2\omega _{0}t}+e^{-j2\omega _{0}t}=2\cos (2\omega _{0}t)=2\cos \frac{2\pi t}{3}$.</p>
<p>Hai nhánh $\pm 3$: $-2je^{j3\omega _{0}t}+2je^{-j3\omega _{0}t}=2j(e^{-j\theta }-e^{j\theta })=2j(-2j \sin \theta )=4\sin \theta$ với $\theta =3\omega _{0}t=\pi t$.</p>
<p>Vậy $x(t)=2\cos \frac{2\pi t}{3}+4\sin (\pi t)$.</p>
<p>Pha sin có dấu dương vì $X[3]=-2j$, $X[-3]=+2j$ (đúng cấu hình của +sin).</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $2\cos \frac{2\pi t}{3}+4\sin (\pi t)$</b> — Hệ số $\pm 2$ cho cos biên độ 2; $\pm 3$ cho sin biên độ 4.</li>
<li><span class="vd qbad">SAI</span><b>Các dạng có dấu $-4\sin (\pi t)$</b> — Đảo dấu $j$ giữa hai hệ số $\pm 3$.</li>
<li><span class="vd qbad">SAI</span><b>Các dạng chỉ $2\sin (\pi t)$</b> — Ghép hai hệ số có độ lớn 2 tạo biên độ 4.</li>
<li><span class="vd qbad">SAI</span><b>Các dạng $\cos (\pi t)$ thay sin</b> — Hệ số $\pm 3$ là thuần ảo đối dấu, không phải cùng số thực.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm $t=0$: $x(0)=2$; tổng các hệ số là $1+1-2j+2j=2$, trùng.</div>
`
    },
    {
      id: '8-1', t: 8, n: 1, k: 'mc', c: 4, a: 1,
      im: [['8-1.webp', 836, 445]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x[n]=\delta [n]-\frac{1}{2}\delta [n-1]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$Y=H\cdot X$. Nếu $x=\cos (\omega t+\varphi )$: $y=|H(\omega )|\cos (\omega t+\varphi +\arg H(\omega ))$. Nếu $H(\omega )=a+jb$: $\text{Re}\{He^{j\omega t}\}=a \cos (\omega t)-b \sin (\omega t)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $H(\Omega )=1/[1-\frac{1}{2}e^{-j\Omega }]$, đầu ra $y[n]=\frac{1}{2}^{n}[u[n]-u[n-1]]$. Cần tìm đầu vào $x[n]$.</p>
<p>Nhận diện $u[n]-u[n-1]=\delta [n]$. Vì $\delta [n]$ chỉ khác 0 tại $n=0$, ta có $\frac{1}{2}^{n}\delta [n]=\frac{1}{2}^{0}\delta [n]=\delta [n]$. Vậy $y[n]=\delta [n]$.</p>
<p>DTFT của $\delta [n]$ là $Y(\Omega )=\sum \delta [n]e^{-j\Omega n}=1$.</p>
<p>Với hệ LTI trong miền Fourier: $Y(\Omega )=H(\Omega )X(\Omega ) \implies X(\Omega )=Y(\Omega )/H(\Omega )=1-\frac{1}{2}e^{-j\Omega }$.</p>
<p>Dùng cặp $\delta [n-m]$ ↔ $e^{-j\Omega m}$: $1\longleftrightarrow \delta [n]$, $e^{-j\Omega }\longleftrightarrow \delta [n-1]$.</p>
<p>Suy ra $x[n]=\delta [n]-\frac{1}{2}\delta [n-1]$.</p>
<p>Kiểm bằng phương trình sai phân tương đương $y[n]-\frac{1}{2}y[n-1]=x[n]$. Với $y[n]=\delta [n]$, vế trái đúng $\delta [n]-\frac{1}{2}\delta [n-1]$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\delta [n]-\frac{1}{2}\delta [n-1]$</b> — Trùng $X(\Omega )=1-\frac{1}{2}e^{-j\Omega }$.</li>
<li><span class="vd qbad">SAI</span><b>2. $\delta [n]+5/2\delta [n-1]+\delta [n-2]$</b> — Thêm xung ở $n=2$ và dấu/hệ số không trùng phép nhân 1/H.</li>
<li><span class="vd qbad">SAI</span><b>3. $\delta [n]+\frac{1}{2}\delta [n-1]-\frac{1}{2}\delta [n-2]$</b> — Sai dấu xung trễ 1 và thừa $n=2$.</li>
<li><span class="vd qbad">SAI</span><b>4. $\delta [n]-\frac{1}{2}\delta [n-1]+\frac{1}{4}\delta [n-2]$</b> — Thừa xung $n=2$; thế vào $X(\Omega )$ sẽ có thêm $\frac{1}{4}e^{-j2\Omega }$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm trực tiếp $n=0,1,2$: yêu cầu $x[0]=1$, $x[1]=-\frac{1}{2}$, $x[2]=0$. Chỉ phương án 1 thỏa cả ba.</div>
`
    },
    {
      id: '8-2', t: 8, n: 2, k: 'mc', c: 4, a: 1,
      im: [['8-2.webp', 760, 259], ['8-2b.webp', 760, 154]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y(t)=[\sin \frac{\pi t}{2}+\frac{\pi }{2}\cos \frac{\pi t}{2}]/[1+\pi ^{2}/4]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$Y=H\cdot X$. Nếu $x=\cos (\omega t+\varphi )$: $y=|H(\omega )|\cos (\omega t+\varphi +\arg H(\omega ))$. Nếu $H(\omega )=a+jb$: $\text{Re}\{He^{j\omega t}\}=a \cos (\omega t)-b \sin (\omega t)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $H(\omega )=1/(1-j\omega )$, $x(t)=\sin (\frac{\pi }{2}t)$. Gọi $a=\frac{\pi }{2}$ để tránh viết công thức quá dài.</p>
<p>Hệ LTI tác động lên sinusoids: $\sin (at)=\text{Im}(e^{jat})$; đầu ra tương ứng là $\text{Im}(H(a)e^{jat})$.</p>
<p>Thay tần số vào đáp ứng: $H(a)=1/(1-ja)$. Nhân liên hợp (1+ja)/(1+ja): $H(a)=(1+ja)/(1+a^{2})$.</p>
<p>Nhân (1+ja)(cos at+j sin $at)=(\cos$ at−a sin at)+j(sin at+a cos at). Lấy phần ảo: sin at+a cos at.</p>
<p>Do đó $y(t)=[\sin (at)+a \cos (at)]/(1+a^{2})$. Thay $a=\frac{\pi }{2}$: $y(t)=[\sin \frac{\pi t}{2}+\frac{\pi }{2}\cos \frac{\pi t}{2}]/[1+\pi ^{2}/4]$.</p>
<p>Dấu + trước cos đến từ phần ảo j·a·cos; mẫu phải cộng $1+a^{2}$ vì $(1-ja)(1+ja)=1+a^{2}$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $[\sin (at)+a \cos (at)]/(1+a^{2})$</b> — Đúng phần ảo của $H(a)e^{jat}$.</li>
<li><span class="vd qbad">SAI</span><b>2. $[\cos (at)+a \sin (at)]/(1+a^{2})$</b> — Hoán đổi sin với cos; không đúng thao tác lấy phần ảo.</li>
<li><span class="vd qbad">SAI</span><b>3. $[\sin (at)-a \cos (at)]/(1-a^{2})$</b> — Cả dấu trước cos và mẫu đều sai do nhân liên hợp.</li>
<li><span class="vd qbad">SAI</span><b>4. $[\cos (at)-a \sin (at)]/(1-a^{2})$</b> — Hoán đổi sin/cos và mẫu sai.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm bằng $t=0$: $x(0)=0$ nhưng đầu ra có thể khác 0 vì hệ có lệch pha; công thức đúng cho $y(0)=a/(1+a^{2})$, tương ứng $\text{Im}(H(a))$.</div>
`
    },
    {
      id: '8-3', t: 8, n: 3, k: 'mc', c: 4, a: 1,
      im: [['8-3.webp', 760, 390]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y(t)=1+[\cos (2t)-2\sin (2t)]/5$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$Y=H\cdot X$. Nếu $x=\cos (\omega t+\varphi )$: $y=|H(\omega )|\cos (\omega t+\varphi +\arg H(\omega ))$. Nếu $H(\omega )=a+jb$: $\text{Re}\{He^{j\omega t}\}=a \cos (\omega t)-b \sin (\omega t)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $H(\omega )=1/(1-j\omega )$, $x(t)=\cos (2t)+1$. Do hệ tuyến tính, xử lý $\cos (2t)$ và thành phần DC 1 riêng rồi cộng kết quả.</p>
<p>Với cos, công thức đầu ra $y_{\\cos }(t)=\text{Re}[H(2)e^{j2t}]$. Tính $H(2)=1/(1-2j)=(1+2j)/(1+4)=(1+2j)/5$.</p>
<p>Nhân (1+2j)(cos2t+j sin2t) có phần thực cos2t−2sin2t. Vậy $y_{\\cos }=(\cos 2t-2\sin 2t)/5$.</p>
<p>Thành phần hằng 1 ứng với $\omega =0. H(0)=1/(1-0)=1$, nên $y_{DC}=1\cdot 1=1$.</p>
<p>Cộng hai thành phần: $y(t)=1+[\cos (2t)-2\sin (2t)]/5$.</p>
<p>Lựa chọn nào có DC bằng −1 đều sai vì $H(0)=+1$; lựa chọn nào dùng sin2t ở vị trí cos đầu sẽ sai vì lấy phần thực chứ không phải phần ảo.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. 1+(cos2t−2sin2t)/5</b> — Đúng cả đáp ứng điều hòa và DC.</li>
<li><span class="vd qbad">SAI</span><b>2. 1+(sin2t−2cos2t)/5</b> — Hoán đổi vai trò sin/cos, không phải phần thực của $(1+2j)e^{j2t}$.</li>
<li><span class="vd qbad">SAI</span><b>3. −1+(2cos2t+sin2t)/3</b> — $H(0)$ phải 1 chứ không −1; mẫu 3 cũng sai.</li>
<li><span class="vd qbad">SAI</span><b>4. −1+(2sin2t+cos2t)/3</b> — Sai phần hằng, mẫu và pha.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm $t=0$: $y(0)=1+\frac{1}{5}=\frac{6}{5}$. Đây cũng là Re $H(2)+H(0)=\frac{1}{5}+1$.</div>
`
    },
    {
      id: '8-4', t: 8, n: 4, k: 'mc', c: 4, a: 1,
      im: [['8-4.webp', 824, 371], ['8-4b.webp', 824, 69]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y[n]=\frac{4}{5}\sin \frac{\pi n}{2}+\frac{2}{5}\cos \frac{\pi n}{2}+\frac{2}{3}$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$Y=H\cdot X$. Nếu $x=\cos (\omega t+\varphi )$: $y=|H(\omega )|\cos (\omega t+\varphi +\arg H(\omega ))$. Nếu $H(\omega )=a+jb$: $\text{Re}\{He^{j\omega t}\}=a \cos (\omega t)-b \sin (\omega t)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $H(\Omega )=1/[1+\frac{1}{2}e^{-j\Omega }]$, $x[n]=\sin \frac{\pi n}{2}+1$. Tách $y=y_{\\sin }+y_{DC}$.</p>
<p>Tại tần số sin $\Omega =\frac{\pi }{2}$, $e^{-j\Omega }=e^{-j\pi /2}=-j$. Do đó $H\frac{\pi }{2}=1/(1-j/2)$.</p>
<p>Nhân liên hợp: $H=(1+j/2)/(1+\frac{1}{4})=(1+j/2)/\frac{5}{4}=\frac{4}{5}+\frac{2}{5}j$.</p>
<p>Với $\sin (\Omega n)$, lấy phần ảo [H $e^{j\Omega n}]$. Cho $H=a+jb$, phần ảo là $a \sin (\Omega n)+b \cos (\Omega n)$. Do đó $y_{\\sin }=\frac{4}{5}\sin \frac{\pi n}{2}+\frac{2}{5}\cos \frac{\pi n}{2}$.</p>
<p>Thành phần DC vào bằng 1. $H(0)=1/[1+\frac{1}{2}\cdot 1]=\frac{2}{3}$, suy ra $y_{DC}=\frac{2}{3}$.</p>
<p>Cộng lại: $y[n]=\frac{4}{5}\sin \frac{\pi n}{2}+\frac{2}{5}\cos \frac{\pi n}{2}+\frac{2}{3}$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. (4/5)sin+(2/5)cos+2/3</b> — Khớp ReH, ImH và $H(0)$.</li>
<li><span class="vd qbad">SAI</span><b>2. sin+(1/2)cos+1</b> — Bỏ hệ số mẫu 5/4 khi lấy nghịch đảo; $H(0)$ không bằng 1.</li>
<li><span class="vd qbad">SAI</span><b>3. sin+(1/2)cos+3/2</b> — Sai cả phần điều hòa và $DC=\frac{2}{3}$.</li>
<li><span class="vd qbad">SAI</span><b>4. (4/3)sin+(2/3)cos+2/3</b> — Sai mẫu điều hòa: $1/(1+\frac{1}{4})=\frac{4}{5}$ chứ không 4/3.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm bằng quy tắc: khi $H=a+jb$ và $x=\sin \theta \implies y=a$ sinθ+b cosθ; khi $x=\cos \theta \implies y=a$ cosθ−b sinθ. Dùng đúng phép lấy phần ảo/ thực.</div>
`
    },
    {
      id: '8-5', t: 8, n: 5, k: 'mc', c: 4, a: 1,
      im: [['8-5.webp', 838, 450]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y[n]=\frac{4}{5}\cos \frac{\pi n}{4}-\frac{2}{5}\sin \frac{\pi n}{4}+\frac{2}{3}$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$Y=H\cdot X$. Nếu $x=\cos (\omega t+\varphi )$: $y=|H(\omega )|\cos (\omega t+\varphi +\arg H(\omega ))$. Nếu $H(\omega )=a+jb$: $\text{Re}\{He^{j\omega t}\}=a \cos (\omega t)-b \sin (\omega t)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $H(\Omega )=1/[1+\frac{1}{2}e^{-j2\Omega }]$, $x[n]=\cos \frac{\pi n}{4}+1$. Tách đáp ứng của cos và hằng.</p>
<p>Thay $\Omega =\frac{\pi }{4}$: $e^{-j2\Omega }=e^{-j\pi /2}=-j$, nên $H\frac{\pi }{4}=1/(1-j/2)=\frac{4}{5}+\frac{2}{5}j$.</p>
<p>Với đầu vào $\cos (\Omega n)=\text{Re} e^{j\Omega n}$, đầu ra là $\text{Re}[(a+jb)e^{j\Omega n}]=a \cos (\Omega n)-b \sin (\Omega n)$.</p>
<p>Do đó $y_{\\cos }[n]=\frac{4}{5}\cos \frac{\pi n}{4}-\frac{2}{5}\sin \frac{\pi n}{4}$. Dấu TRỪ trước sin xuất hiện từ $j\cdot j=-1$ khi nhân.</p>
<p>Tại DC, $e^{-j2\cdot 0}=1$ nên $H(0)=1/(1+\frac{1}{2})=\frac{2}{3}$.</p>
<p>$y[n]=\frac{4}{5}\cos \frac{\pi n}{4}-\frac{2}{5}\sin \frac{\pi n}{4}+\frac{2}{3}$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. (4/5)cos−(2/5)sin+2/3</b> — Đúng $H$ tại $\Omega =\frac{\pi }{4}$ và tại $\Omega =0$.</li>
<li><span class="vd qbad">SAI</span><b>2. (4/3)cos−(2/3)sin+2/3</b> — Mẫu tính đáp ứng cos phải $1+\frac{1}{2}^{2}=\frac{5}{4}$, không phải 3/4.</li>
<li><span class="vd qbad">SAI</span><b>3. cos−(1/2)sin+3/2</b> — Chưa chia cho 5/4 và phần DC sai.</li>
<li><span class="vd qbad">SAI</span><b>4. cos−(1/2)sin+1</b> — Chưa xử lý chính xác mẫu và $H(0)$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm nhanh: $H\frac{\pi }{4}$ có môđun $\sqrt{\frac{4}{5}^{2}+\frac{2}{5}^{2}}=2/\sqrt{5}\approx 0,894<1$; các đáp án có biên độ (4/3,2/3) lại &gt;1, không phù hợp $H$ đã tính.</div>
`
    },
    {
      id: '8-6', t: 8, n: 6, k: 'mc', c: 4, a: 1,
      im: [['8-6.webp', 824, 344]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y[n]=\delta [n]-3\cdot 2^{-n}u[n-1]$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$Y=H\cdot X$. Nếu $x=\cos (\omega t+\varphi )$: $y=|H(\omega )|\cos (\omega t+\varphi +\arg H(\omega ))$. Nếu $H(\omega )=a+jb$: $\text{Re}\{He^{j\omega t}\}=a \cos (\omega t)-b \sin (\omega t)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $H(\Omega )=1/[1-\frac{1}{2}e^{-j\Omega }]$, $x[n]=\delta [n]-2\delta [n-1]$. Tìm $y[n]$.</p>
<p>Đổi $H$ sang đáp ứng xung: $1/(1-re^{-j\Omega })$ ↔ $r^{n}u[n]$ nếu |r|&lt;1. Ở đây $r=\frac{1}{2}$, vậy $h[n]=2^{-n}u[n]$.</p>
<p>Hệ LTI $y=x*h$; tích chập với xung dịch rất nhanh: $\delta [n]*h[n]=h[n]$, $\delta [n-1]*h[n]=h[n-1]$.</p>
<p>Do đó $y[n]=h[n]-2h[n-1]=2^{-n}u[n]-2\cdot 2^{-(n-1)}u[n-1]$.</p>
<p>Xét n&lt;0: hai bước bằng 0 $\implies y=0$. Xét $n=0$: $u[0]=1,u[-1]=0 \implies y[0]=1$.</p>
<p>Xét $n\ge 1$: cả hai bước bằng 1, $y[n]=2^{-n}-2\cdot 2^{1-n}=2^{-n}-4\cdot 2^{-n}=-3\cdot 2^{-n}$.</p>
<p>Gộp: $y[n]=\delta [n]-3\cdot 2^{-n}u[n-1]$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\delta [n]-3\cdot 2^{-n}u[n-1]$</b> — Đúng tại $n=0$ và mọi $n\ge 1$.</li>
<li><span class="vd qbad">SAI</span><b>2. $\delta [n]-2^{-n+1}u[n-1]$</b> — Ở $n=1$ cho −1, trong khi thật $y[1]=\frac{1}{2}-2=-\frac{3}{2}$.</li>
<li><span class="vd qbad">SAI</span><b>3. $2^{-n}u[n]-2^{-n+1}u[n-1]$</b> — Thiếu hệ số 2 của xung $-2\delta [n-1]$, cho sai $y[1]$.</li>
<li><span class="vd qbad">SAI</span><b>4. $2^{-n}u[n]-3\cdot 2^{-n}u[n-1]$</b> — Với $n\ge 1$ cho $-2\cdot 2^{-n}$, không bằng $-3\cdot 2^{-n}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm trực tiếp bằng truy hồi $y[n]-\frac{1}{2}y[n-1]=x[n]$: $n=0\to y0=1$; $n=1\to y1-\frac{1}{2}=-2 \implies y1=-\frac{3}{2}$. Khớp kết quả.</div>
`
    },
    {
      id: '8-7', t: 8, n: 7, k: 'mc', c: 4, a: 1,
      im: [['8-7.webp', 741, 387]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y[n]=6+\frac{2}{3}\cos (\pi n+\frac{\pi }{3})$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$Y=H\cdot X$. Nếu $x=\cos (\omega t+\varphi )$: $y=|H(\omega )|\cos (\omega t+\varphi +\arg H(\omega ))$. Nếu $H(\omega )=a+jb$: $\text{Re}\{He^{j\omega t}\}=a \cos (\omega t)-b \sin (\omega t)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $h[n]=2^{-n}u[n]$, $x[n]=3+\cos (\pi n+\frac{\pi }{3})$. Với hệ LTI, sinusoids và DC là các hàm riêng: xử lý mỗi tần số riêng.</p>
<p>Từ $h[n]$, $H(\Omega )=\sum _{n=0}\infty \frac{1}{2}^{n} e^{-j\Omega n}=1/[1-\frac{1}{2}e^{-j\Omega }]$.</p>
<p>Ở DC $\Omega =0$: $H(0)=1/(1-\frac{1}{2})=2$. Vì đầu vào DC bằng 3, đáp ứng DC là $3\cdot 2=6$.</p>
<p>Ở $\Omega =\pi$: $e^{-j\pi }=-1$. Do đó $H(\pi )=1/(1+\frac{1}{2})=\frac{2}{3}$ là số thực dương.</p>
<p>Đầu vào $\cos (\pi n+\frac{\pi }{3})$ được nhân biên độ 2/3, không đổi pha: $y_{\\cos }[n]=\frac{2}{3}\cos (\pi n+\frac{\pi }{3})$.</p>
<p>Tổng $y[n]=6+\frac{2}{3}\cos (\pi n+\frac{\pi }{3})$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $6+\frac{2}{3}\cos (\pi n+\frac{\pi }{3})$</b> — DC nhân 2; cos nhân 2/3.</li>
<li><span class="vd qbad">SAI</span><b>2. 6+cosθ+2sinθ</b> — $H(\pi )$ thuần thực nên không sinh hạng sin và biên độ cos phải 2/3.</li>
<li><span class="vd qbad">SAI</span><b>3. 3+(2/3)cosθ</b> — Quên khuếch đại DC: $3H(0)=6$, không phải 3.</li>
<li><span class="vd qbad">SAI</span><b>4. 3+cosθ+2sinθ</b> — Cả DC và phần điều hòa đều sai.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm với $h$: đáp ứng của tín hiệu hằng 3 là $3\sum _{n=0}\infty \frac{1}{2}^{n}=3\cdot 2=6$. Đây là xác minh độc lập không qua miền tần số.</div>
`
    },
    {
      id: '8-8', t: 8, n: 8, k: 'mc', c: 4, a: 1,
      im: [['8-8.webp', 849, 367]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y(t)=[\cos (2t)+2\sin (2t)]/5$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$Y=H\cdot X$. Nếu $x=\cos (\omega t+\varphi )$: $y=|H(\omega )|\cos (\omega t+\varphi +\arg H(\omega ))$. Nếu $H(\omega )=a+jb$: $\text{Re}\{He^{j\omega t}\}=a \cos (\omega t)-b \sin (\omega t)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $h(t)=e^{-t}u(t)$, $x(t)=\cos (2t)$. Tìm $y=x*h$ của hệ LTI.</p>
<p>Biến đổi Fourier của $h$: $H(\omega )=\int_0^{\infty} e^{-t}e^{-j\omega t}dt=\int_0^{\infty} e^{-(1+j\omega )t}dt=1/(1+j\omega )$.</p>
<p>Thế $\omega =2$: $H(2)=1/(1+2j)=(1-2j)/(1+4)=(1-2j)/5$.</p>
<p>Cos tương ứng phần thực của $e^{j2t}$, nên $y(t)=\text{Re}[H(2)e^{j2t}]$.</p>
<p>Nhân: (1−2j)(cos2t+j $\sin 2t)=(\cos 2t+2\sin 2t)+j(\sin 2t-2\cos 2t)$.</p>
<p>Lấy phần thực: $y(t)=[\cos (2t)+2\sin (2t)]/5$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. (cos2t+2sin2t)/5</b> — Là $\text{Re}[(1-2j)e^{j2t}]/5$.</li>
<li><span class="vd qbad">SAI</span><b>2. (sin2t+2cos2t)/5</b> — Nhầm phần thực với phần ảo / hệ số sin–cos.</li>
<li><span class="vd qbad">SAI</span><b>3. (2cos2t−sin2t)/3</b> — Sai cả hệ số lẫn mẫu: $|1+2j|^{2}=5$, không 3.</li>
<li><span class="vd qbad">SAI</span><b>4. (2sin2t−cos2t)/3</b> — Sai dấu, hệ số và mẫu.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm bằng ODE $y'+y=\cos 2t$ (vì $h=e^{-t}u)$. Lấy $y=(\cos 2t+2\sin 2t)/5$ thì $y'=(-2\sin 2t+4\cos 2t)/5$, nên $y'+y=\cos 2t$. Đây là chứng minh độc lập.</div>
`
    },
    {
      id: '8-9', t: 8, n: 9, k: 'mc', c: 4, a: 1,
      im: [['8-9.webp', 846, 230], ['8-9b.webp', 846, 205]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $y(t)=[\cos (2t)+\sin (2t)+2]/4$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$Y=H\cdot X$. Nếu $x=\cos (\omega t+\varphi )$: $y=|H(\omega )|\cos (\omega t+\varphi +\arg H(\omega ))$. Nếu $H(\omega )=a+jb$: $\text{Re}\{He^{j\omega t}\}=a \cos (\omega t)-b \sin (\omega t)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Đề: $H(\omega )=1/(2+j\omega )$, $x(t)=\cos (2t)+1$. Như các câu tương tự, xử lý thành phần tần số $\omega =2$ và DC $\omega =0$ riêng.</p>
<p>Tại $\omega =2$: $H(2)=1/(2+2j)$. Nhân liên hợp: $(2-2j)/(4+4)=(1-j)/4$.</p>
<p>Với cos2t lấy phần thực: $\text{Re}[((1-j)/4)(\cos 2t+j \sin 2t)]=(\cos 2t+\sin 2t)/4$.</p>
<p>Tại $\omega =0$: $H(0)=\frac{1}{2}$, nên đầu vào hằng 1 tạo ra $DC=\frac{1}{2}=\frac{2}{4}$.</p>
<p>Cộng: $y(t)=(\cos 2t+\sin 2t+2)/4$.</p>
<p>Dấu + trước sin được quyết định bởi $H(2)$ có phần ảo âm: $\text{Re}[(a+jb)e^{j\theta }]=a$ cosθ−b sinθ, với $b=-\frac{1}{4}$.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. (cos2t+sin2t+2)/4</b> — $H(2)=(1-j)/4$ và $H(0)=\frac{1}{2}$.</li>
<li><span class="vd qbad">SAI</span><b>2. (cos2t−sin2t+2)/4</b> — Sai dấu sin: phần ảo $H(2)=-\frac{1}{4}$ nên phải cộng sin.</li>
<li><span class="vd qbad">SAI</span><b>3. (cos2t−sin2t+2)/2</b> — Sai cả dấu và nhân biên độ 2 lần.</li>
<li><span class="vd qbad">SAI</span><b>4. (cos2t+sin2t+2)/2</b> — Tần số 2 phải có hệ số 1/4, không phải 1/2; DC cũng bị nhân đôi.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm tại $t=0$: $y(0)=\frac{3}{4}$. Từ miền tần số: $\text{\text{Re}}\,H(2)+H(0)=\frac{1}{4}+\frac{1}{2}=\frac{3}{4}$, khớp.</div>
`
    },
    {
      id: '9-1', t: 9, n: 1, k: 'mc', c: 4, a: 1,
      im: [['9-1.webp', 762, 729], ['9-1b.webp', 762, 69]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x(t)=-1+2\cos (400\pi t-\frac{\pi }{4})+\frac{3}{2}\cos (200\pi t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$A \cos (\omega _{0}t+\varphi )$ ↔ các hệ số $\frac{A}{2}e^{+j\varphi }$ ở $+\omega _{0}$ và $\frac{A}{2}e^{-j\varphi }$ ở $-\omega _{0}$. DC $= X(0)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Cách đọc đồ thị: với tín hiệu THỰC, hai vạch phổ ở $\pm \omega$ phải là liên hợp: nếu vạch $+\omega$ có độ lớn $a$, pha φ thì hai vạch hợp thành $a\cdot e^{j\varphi }e^{j\omega t}+a\cdot e^{-j\varphi }e^{-j\omega t}=2a \cos (\omega t+\varphi )$. Không được quên hệ số 2.</p>
<p>Nhìn vạch tại $\omega =0$: đó là hệ số một chiều (DC). Biên độ DC là giá trị của chính vạch, KHÔNG nhân đôi; pha 0 cho DC dương, pha $\pi$ cho DC âm. Ở câu này $DC=-1$.</p>
<p>Tại $+400\pi$: mỗi vạch có độ lớn 1 vì biên độ cos trong thời gian là 2. Đọc pha ở phía DƯƠNG: $\varphi _{400}=-\frac{\pi }{4}$. Số hạng thời gian là $2\cos (400\pi t-\frac{\pi }{4})$.</p>
<p>Tại $+200\pi$: độ lớn mỗi vạch $|X(+200\pi )|=0.75$ nên biên độ cos là 1.5. Pha tại $+200\pi$ bằng 0; số hạng là $1.5\cos (200\pi t)$.</p>
<p>Cộng lần lượt DC, hai cặp $\pm 400\pi$ và $\pm 200\pi$. Đề có ba nhóm tần số khác nhau; không được đưa pha của vạch âm vào cos phía tần số dương.</p>
<p>Kiểm: lấy biến đổi Fourier series của từng cos theo Euler, tại $\omega =+400\pi$ và $+200\pi$ phải thu lại đúng biên độ MỘT NỬA và pha đã đọc; tại $\omega =0$ phải thu lại đúng DC.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $-1+2\cos (400\pi t-\frac{\pi }{4})+\frac{3}{2}\cos (200\pi t)$</b> — DC −1 do pha $\pi$; tại $+400\pi$ pha $-\frac{\pi }{4}$; tại $\pm 200\pi$ pha 0, độ lớn mỗi vạch 3/4.</li>
<li><span class="vd qbad">SAI</span><b>2. $+1+2\cos (400\pi t-\frac{\pi }{4})+\frac{3}{2}\cos (200\pi t)$</b> — Pha DC trên hình là $\pi$, nên $X(0)=-1$, không phải +1.</li>
<li><span class="vd qbad">SAI</span><b>3. $-1+2\cos (400\pi t+\frac{\pi }{4})+\frac{3}{2}\cos (200\pi t)$</b> — Đảo dấu pha $400\pi$: hình cho $\varphi (+400\pi )=-\frac{\pi }{4}$ chứ không $+\frac{\pi }{4}$.</li>
<li><span class="vd qbad">SAI</span><b>4. $+1+2\cos (400\pi t+\frac{\pi }{4})+\frac{3}{2}\cos (200\pi t)$</b> — Sai cả pha DC lẫn dấu pha tại $+400\pi$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm từng nhóm: $X(0)=-1$; hệ số $+400\pi =e^{-j\pi /4}$; hệ số $+200\pi =\frac{3}{4}$. Chỉ PA1 khớp cả 3.</div>
`
    },
    {
      id: '9-2', t: 9, n: 2, k: 'mc', c: 4, a: 1,
      im: [['9-2.webp', 752, 830]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x(t)=1+2\cos (400\pi t-\frac{\pi }{4})+\frac{3}{2}\cos (200\pi t+\frac{\pi }{4})$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$A \cos (\omega _{0}t+\varphi )$ ↔ các hệ số $\frac{A}{2}e^{+j\varphi }$ ở $+\omega _{0}$ và $\frac{A}{2}e^{-j\varphi }$ ở $-\omega _{0}$. DC $= X(0)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Cách đọc đồ thị: với tín hiệu THỰC, hai vạch phổ ở $\pm \omega$ phải là liên hợp: nếu vạch $+\omega$ có độ lớn $a$, pha φ thì hai vạch hợp thành $a\cdot e^{j\varphi }e^{j\omega t}+a\cdot e^{-j\varphi }e^{-j\omega t}=2a \cos (\omega t+\varphi )$. Không được quên hệ số 2.</p>
<p>Nhìn vạch tại $\omega =0$: đó là hệ số một chiều (DC). Biên độ DC là giá trị của chính vạch, KHÔNG nhân đôi; pha 0 cho DC dương, pha $\pi$ cho DC âm. Ở câu này $DC=1$.</p>
<p>Tại $+400\pi$: mỗi vạch có độ lớn 1 vì biên độ cos trong thời gian là 2. Đọc pha ở phía DƯƠNG: $\varphi _{400}=-\frac{\pi }{4}$. Số hạng thời gian là $2\cos (400\pi t-\frac{\pi }{4})$.</p>
<p>Tại $+200\pi$: độ lớn mỗi vạch $|X(+200\pi )|=0.75$ nên biên độ cos là 1.5. Pha tại $+200\pi$ bằng $+\frac{\pi }{4}$; số hạng là $1.5\cos (200\pi t++\frac{\pi }{4})$.</p>
<p>Cộng lần lượt DC, hai cặp $\pm 400\pi$ và $\pm 200\pi$. Đề có ba nhóm tần số khác nhau; không được đưa pha của vạch âm vào cos phía tần số dương.</p>
<p>Kiểm: lấy biến đổi Fourier series của từng cos theo Euler, tại $\omega =+400\pi$ và $+200\pi$ phải thu lại đúng biên độ MỘT NỬA và pha đã đọc; tại $\omega =0$ phải thu lại đúng DC.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $1+2\cos (400\pi t-\frac{\pi }{4})+\frac{3}{2}\cos (200\pi t+\frac{\pi }{4})$</b> — Đọc đúng $\varphi 400=-\frac{\pi }{4}$, $\varphi 200=+\frac{\pi }{4}$ và $DC=+1$.</li>
<li><span class="vd qbad">SAI</span><b>2. $1+2\cos (400\pi t+\frac{\pi }{4})+\frac{3}{2}\sin (200\pi t-\frac{\pi }{4})$</b> — Pha $400\pi$ bị đảo; hơn nữa $\sin (\theta -\frac{\pi }{4})=-\cos (\theta +\frac{\pi }{4})$, nên dấu của thành phần $200\pi$ cũng sai.</li>
<li><span class="vd qbad">SAI</span><b>3. $1+2\cos (400\pi t+\frac{\pi }{4})+\frac{3}{2}\sin (200\pi t-\frac{\pi }{4})$</b> — Cùng lỗi đổi pha $400\pi$; dạng sin nêu ra có hệ số phổ $+200\pi$ khác dấu so với hình.</li>
<li><span class="vd qbad">SAI</span><b>4. $1+2\cos (400\pi t-\frac{\pi }{4})+\frac{3}{2}\cos (200\pi t-\frac{\pi }{4})$</b> — Tần số $400\pi$ đúng, nhưng pha $+200\pi$ trên hình là $+\frac{\pi }{4}$, không phải $-\frac{\pi }{4}$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm riêng vạch pha $+200\pi$ trên hình (hướng lên) ghi $+\frac{\pi }{4}$; vạch $-200\pi$ là $-\frac{\pi }{4}$. Không hoán đổi hai vạch khi đi vào cos.</div>
`
    },
    {
      id: '9-3', t: 9, n: 3, k: 'mc', c: 4, a: 1,
      im: [['9-3.webp', 658, 817]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x(t)=1+2\cos (400\pi t)+\frac{3}{2}\cos (200\pi t+\frac{\pi }{4})$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$A \cos (\omega _{0}t+\varphi )$ ↔ các hệ số $\frac{A}{2}e^{+j\varphi }$ ở $+\omega _{0}$ và $\frac{A}{2}e^{-j\varphi }$ ở $-\omega _{0}$. DC $= X(0)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Cách đọc đồ thị: với tín hiệu THỰC, hai vạch phổ ở $\pm \omega$ phải là liên hợp: nếu vạch $+\omega$ có độ lớn $a$, pha φ thì hai vạch hợp thành $a\cdot e^{j\varphi }e^{j\omega t}+a\cdot e^{-j\varphi }e^{-j\omega t}=2a \cos (\omega t+\varphi )$. Không được quên hệ số 2.</p>
<p>Nhìn vạch tại $\omega =0$: đó là hệ số một chiều (DC). Biên độ DC là giá trị của chính vạch, KHÔNG nhân đôi; pha 0 cho DC dương, pha $\pi$ cho DC âm. Ở câu này $DC=1$.</p>
<p>Tại $+400\pi$: mỗi vạch có độ lớn 1 vì biên độ cos trong thời gian là 2. Đọc pha ở phía DƯƠNG: $\varphi _{400}=0$. Số hạng thời gian là $2\cos (400\pi t)$.</p>
<p>Tại $+200\pi$: độ lớn mỗi vạch $|X(+200\pi )|=0.75$ nên biên độ cos là 1.5. Pha tại $+200\pi$ bằng $+\frac{\pi }{4}$; số hạng là $1.5\cos (200\pi t++\frac{\pi }{4})$.</p>
<p>Cộng lần lượt DC, hai cặp $\pm 400\pi$ và $\pm 200\pi$. Đề có ba nhóm tần số khác nhau; không được đưa pha của vạch âm vào cos phía tần số dương.</p>
<p>Kiểm: lấy biến đổi Fourier series của từng cos theo Euler, tại $\omega =+400\pi$ và $+200\pi$ phải thu lại đúng biên độ MỘT NỬA và pha đã đọc; tại $\omega =0$ phải thu lại đúng DC.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $1+2\cos (400\pi t)+\frac{3}{2}\cos (200\pi t+\frac{\pi }{4})$</b> — Pha $400\pi$ bằng 0, pha $+200\pi$ bằng $+\frac{\pi }{4}$, DC +1.</li>
<li><span class="vd qbad">SAI</span><b>2. $1+2\cos (400\pi t)+\frac{3}{2}\cos (200\pi t-\frac{\pi }{4})$</b> — Đảo dấu pha $200\pi$, trong khi pha ở tần số dương là $+\frac{\pi }{4}$.</li>
<li><span class="vd qbad">SAI</span><b>3. $1+2\cos (400\pi t+\frac{\pi }{4})+\frac{3}{2}\cos (200\pi t)$</b> — Gán nhầm pha $+\frac{\pi }{4}$ sang $400\pi$, bỏ pha ở $200\pi$.</li>
<li><span class="vd qbad">SAI</span><b>4. $1+2\cos (400\pi t)+\frac{3}{2}\sin (200\pi t-\frac{\pi }{4})$</b> — $\sin (\theta -\frac{\pi }{4})=-\cos (\theta +\frac{\pi }{4})$, làm dấu nhánh $200\pi$ sai.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Vì phần $400\pi$ pha 0, nó phải là $\cos (400\pi t)$ không lệch pha; phần $200\pi$ mới mang $+\frac{\pi }{4}$.</div>
`
    },
    {
      id: '9-4', t: 9, n: 4, k: 'mc', c: 4, a: 1,
      im: [['9-4.webp', 692, 30], ['9-4b.webp', 692, 779]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x(t)=-1+2\cos (400\pi t)+\frac{3}{2}\cos (200\pi t+\frac{\pi }{4})$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$A \cos (\omega _{0}t+\varphi )$ ↔ các hệ số $\frac{A}{2}e^{+j\varphi }$ ở $+\omega _{0}$ và $\frac{A}{2}e^{-j\varphi }$ ở $-\omega _{0}$. DC $= X(0)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Cách đọc đồ thị: với tín hiệu THỰC, hai vạch phổ ở $\pm \omega$ phải là liên hợp: nếu vạch $+\omega$ có độ lớn $a$, pha φ thì hai vạch hợp thành $a\cdot e^{j\varphi }e^{j\omega t}+a\cdot e^{-j\varphi }e^{-j\omega t}=2a \cos (\omega t+\varphi )$. Không được quên hệ số 2.</p>
<p>Nhìn vạch tại $\omega =0$: đó là hệ số một chiều (DC). Biên độ DC là giá trị của chính vạch, KHÔNG nhân đôi; pha 0 cho DC dương, pha $\pi$ cho DC âm. Ở câu này $DC=-1$.</p>
<p>Tại $+400\pi$: mỗi vạch có độ lớn 1 vì biên độ cos trong thời gian là 2. Đọc pha ở phía DƯƠNG: $\varphi _{400}=0$. Số hạng thời gian là $2\cos (400\pi t)$.</p>
<p>Tại $+200\pi$: độ lớn mỗi vạch $|X(+200\pi )|=0.75$ nên biên độ cos là 1.5. Pha tại $+200\pi$ bằng $+\frac{\pi }{4}$; số hạng là $1.5\cos (200\pi t++\frac{\pi }{4})$.</p>
<p>Cộng lần lượt DC, hai cặp $\pm 400\pi$ và $\pm 200\pi$. Đề có ba nhóm tần số khác nhau; không được đưa pha của vạch âm vào cos phía tần số dương.</p>
<p>Kiểm: lấy biến đổi Fourier series của từng cos theo Euler, tại $\omega =+400\pi$ và $+200\pi$ phải thu lại đúng biên độ MỘT NỬA và pha đã đọc; tại $\omega =0$ phải thu lại đúng DC.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $-1+2\cos (400\pi t)+\frac{3}{2}\cos (200\pi t+\frac{\pi }{4})$</b> — DC âm; tần số $400\pi$ pha 0; $200\pi$ pha $+\frac{\pi }{4}$.</li>
<li><span class="vd qbad">SAI</span><b>2. $+1+2\cos (400\pi t)+\frac{3}{2}\cos (200\pi t+\frac{\pi }{4})$</b> — Chỉ khác dấu DC; hình ghi pha DC $\pi$ nên phải −1.</li>
<li><span class="vd qbad">SAI</span><b>3. $-1+2\cos (400\pi t)+\frac{3}{2}\cos (200\pi t-\frac{\pi }{4})$</b> — DC đúng nhưng pha $200\pi$ đảo dấu.</li>
<li><span class="vd qbad">SAI</span><b>4. $+1+2\cos (400\pi t)+\frac{3}{2}\cos (200\pi t-\frac{\pi }{4})$</b> — Sai cả DC và pha $200\pi$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">So sánh cặp câu 9.3/9.4: chỉ đổi pha DC từ 0 thành $\pi$; nếu mọi nhánh tần số khác giữ nguyên, hằng số phải đổi $+1\to -1$.</div>
`
    },
    {
      id: '9-5', t: 9, n: 5, k: 'mc', c: 4, a: 1,
      im: [['9-5.webp', 670, 30], ['9-5b.webp', 670, 773]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x(t)=\frac{3}{4}+2\cos (400\pi t)+\cos (200\pi t-\frac{\pi }{4})$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$A \cos (\omega _{0}t+\varphi )$ ↔ các hệ số $\frac{A}{2}e^{+j\varphi }$ ở $+\omega _{0}$ và $\frac{A}{2}e^{-j\varphi }$ ở $-\omega _{0}$. DC $= X(0)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Cách đọc đồ thị: với tín hiệu THỰC, hai vạch phổ ở $\pm \omega$ phải là liên hợp: nếu vạch $+\omega$ có độ lớn $a$, pha φ thì hai vạch hợp thành $a\cdot e^{j\varphi }e^{j\omega t}+a\cdot e^{-j\varphi }e^{-j\omega t}=2a \cos (\omega t+\varphi )$. Không được quên hệ số 2.</p>
<p>Nhìn vạch tại $\omega =0$: đó là hệ số một chiều (DC). Biên độ DC là giá trị của chính vạch, KHÔNG nhân đôi; pha 0 cho DC dương, pha $\pi$ cho DC âm. Ở câu này $DC=0.75$.</p>
<p>Tại $+400\pi$: mỗi vạch có độ lớn 1 vì biên độ cos trong thời gian là 2. Đọc pha ở phía DƯƠNG: $\varphi _{400}=0$. Số hạng thời gian là $2\cos (400\pi t)$.</p>
<p>Tại $+200\pi$: độ lớn mỗi vạch $|X(+200\pi )|=0.5$ nên biên độ cos là 1. Pha tại $+200\pi$ bằng $-\frac{\pi }{4}$; số hạng là $1\cos (200\pi t-\frac{\pi }{4})$.</p>
<p>Cộng lần lượt DC, hai cặp $\pm 400\pi$ và $\pm 200\pi$. Đề có ba nhóm tần số khác nhau; không được đưa pha của vạch âm vào cos phía tần số dương.</p>
<p>Kiểm: lấy biến đổi Fourier series của từng cos theo Euler, tại $\omega =+400\pi$ và $+200\pi$ phải thu lại đúng biên độ MỘT NỬA và pha đã đọc; tại $\omega =0$ phải thu lại đúng DC.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $+\frac{3}{4}+2\cos (400\pi t)+\cos (200\pi t-\frac{\pi }{4})$</b> — Vạch DC +3/4; vạch $400\pi$ mỗi bên 1; vạch $200\pi$ mỗi bên 1/2 pha $-\frac{\pi }{4}$.</li>
<li><span class="vd qbad">SAI</span><b>2. $+\frac{3}{4}+2\cos (400\pi t)+\cos (200\pi t+\frac{\pi }{4})$</b> — Đảo pha $200\pi$; vạch $+200\pi$ dưới trục pha nên φ âm.</li>
<li><span class="vd qbad">SAI</span><b>3. $-\frac{3}{4}+2\cos (400\pi t)+\cos (200\pi t-\frac{\pi }{4})$</b> — Pha DC là 0, nên không được đặt −3/4.</li>
<li><span class="vd qbad">SAI</span><b>4. $-\frac{3}{4}+2\cos (400\pi t)+\cos (200\pi t+\frac{\pi }{4})$</b> — Sai cả dấu DC và dấu pha $200\pi$.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Không nhầm vạch $200\pi$ độ lớn 1/2 thành hệ số thời gian 1/2: cặp +/− ghép thành cos biên độ 1.</div>
`
    },
    {
      id: '9-6', t: 9, n: 6, k: 'mc', c: 4, a: 1,
      im: [['9-6.webp', 737, 30], ['9-6b.webp', 737, 752]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x(t)=2\cos (400\pi t+\frac{\pi }{4})+\cos (200\pi t-\frac{\pi }{4})+\frac{3}{4}$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$A \cos (\omega _{0}t+\varphi )$ ↔ các hệ số $\frac{A}{2}e^{+j\varphi }$ ở $+\omega _{0}$ và $\frac{A}{2}e^{-j\varphi }$ ở $-\omega _{0}$. DC $= X(0)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Cách đọc đồ thị: với tín hiệu THỰC, hai vạch phổ ở $\pm \omega$ phải là liên hợp: nếu vạch $+\omega$ có độ lớn $a$, pha φ thì hai vạch hợp thành $a\cdot e^{j\varphi }e^{j\omega t}+a\cdot e^{-j\varphi }e^{-j\omega t}=2a \cos (\omega t+\varphi )$. Không được quên hệ số 2.</p>
<p>Nhìn vạch tại $\omega =0$: đó là hệ số một chiều (DC). Biên độ DC là giá trị của chính vạch, KHÔNG nhân đôi; pha 0 cho DC dương, pha $\pi$ cho DC âm. Ở câu này $DC=0.75$.</p>
<p>Tại $+400\pi$: mỗi vạch có độ lớn 1 vì biên độ cos trong thời gian là 2. Đọc pha ở phía DƯƠNG: $\varphi _{400}=+\frac{\pi }{4}$. Số hạng thời gian là $2\cos (400\pi t++\frac{\pi }{4})$.</p>
<p>Tại $+200\pi$: độ lớn mỗi vạch $|X(+200\pi )|=0.5$ nên biên độ cos là 1. Pha tại $+200\pi$ bằng $-\frac{\pi }{4}$; số hạng là $1\cos (200\pi t-\frac{\pi }{4})$.</p>
<p>Cộng lần lượt DC, hai cặp $\pm 400\pi$ và $\pm 200\pi$. Đề có ba nhóm tần số khác nhau; không được đưa pha của vạch âm vào cos phía tần số dương.</p>
<p>Kiểm: lấy biến đổi Fourier series của từng cos theo Euler, tại $\omega =+400\pi$ và $+200\pi$ phải thu lại đúng biên độ MỘT NỬA và pha đã đọc; tại $\omega =0$ phải thu lại đúng DC.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\frac{3}{4}+2\cos (400\pi t+\frac{\pi }{4})+\cos (200\pi t-\frac{\pi }{4})$</b> — Biên độ $400\pi =2$, $200\pi =1$; pha trái dấu tại các tần số dương; $DC=\frac{3}{4}$.</li>
<li><span class="vd qbad">SAI</span><b>2. $\frac{3}{4}+2\cos (400\pi t-\frac{\pi }{4})+\cos (200\pi t+\frac{\pi }{4})$</b> — Đảo dấu pha của CẢ HAI cặp so với phổ.</li>
<li><span class="vd qbad">SAI</span><b>3. $\frac{3}{4}+\cos (400\pi t-\frac{\pi }{4})+2\cos (200\pi t+\frac{\pi }{4})$</b> — Hoán đổi biên độ cặp $400\pi$ và $200\pi$, đồng thời sai pha.</li>
<li><span class="vd qbad">SAI</span><b>4. $\frac{3}{4}+\cos (400\pi t+\frac{\pi }{4})+2\cos (200\pi t-\frac{\pi }{4})$</b> — Pha đúng nhưng biên độ bị đảo: vạch $400\pi$ bằng 1 → cos biên độ 2, vạch $200\pi$ bằng 1/2 → cos biên độ 1.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Mẹo khi có nhiều cặp: lập bảng ba cột $\omega$, $2|X(\omega )|$, $\angle X(+\omega )$ rồi mới điền đáp án; ngăn hoán đổi biên độ giữa $400\pi$ và $200\pi$.</div>
`
    },
    {
      id: '9-7', t: 9, n: 7, k: 'mc', c: 4, a: 1,
      im: [['9-7.webp', 665, 30], ['9-7b.webp', 665, 756]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x(t)=2\cos (400\pi t+\frac{\pi }{4})+\cos (200\pi t)+\frac{3}{4}$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$A \cos (\omega _{0}t+\varphi )$ ↔ các hệ số $\frac{A}{2}e^{+j\varphi }$ ở $+\omega _{0}$ và $\frac{A}{2}e^{-j\varphi }$ ở $-\omega _{0}$. DC $= X(0)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Cách đọc đồ thị: với tín hiệu THỰC, hai vạch phổ ở $\pm \omega$ phải là liên hợp: nếu vạch $+\omega$ có độ lớn $a$, pha φ thì hai vạch hợp thành $a\cdot e^{j\varphi }e^{j\omega t}+a\cdot e^{-j\varphi }e^{-j\omega t}=2a \cos (\omega t+\varphi )$. Không được quên hệ số 2.</p>
<p>Nhìn vạch tại $\omega =0$: đó là hệ số một chiều (DC). Biên độ DC là giá trị của chính vạch, KHÔNG nhân đôi; pha 0 cho DC dương, pha $\pi$ cho DC âm. Ở câu này $DC=0.75$.</p>
<p>Tại $+400\pi$: mỗi vạch có độ lớn 1 vì biên độ cos trong thời gian là 2. Đọc pha ở phía DƯƠNG: $\varphi _{400}=+\frac{\pi }{4}$. Số hạng thời gian là $2\cos (400\pi t++\frac{\pi }{4})$.</p>
<p>Tại $+200\pi$: độ lớn mỗi vạch $|X(+200\pi )|=0.5$ nên biên độ cos là 1. Pha tại $+200\pi$ bằng 0; số hạng là $1\cos (200\pi t)$.</p>
<p>Cộng lần lượt DC, hai cặp $\pm 400\pi$ và $\pm 200\pi$. Đề có ba nhóm tần số khác nhau; không được đưa pha của vạch âm vào cos phía tần số dương.</p>
<p>Kiểm: lấy biến đổi Fourier series của từng cos theo Euler, tại $\omega =+400\pi$ và $+200\pi$ phải thu lại đúng biên độ MỘT NỬA và pha đã đọc; tại $\omega =0$ phải thu lại đúng DC.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $\frac{3}{4}+2\cos (400\pi t+\frac{\pi }{4})+\cos (200\pi t)$</b> — Đúng pha $+\frac{\pi }{4}$ ở $400\pi$, pha 0 ở $200\pi$, DC +3/4.</li>
<li><span class="vd qbad">SAI</span><b>2. $\frac{3}{4}+2\cos (400\pi t-\frac{\pi }{4})+\cos (200\pi t)$</b> — Pha $400\pi$ ngược dấu.</li>
<li><span class="vd qbad">SAI</span><b>3. $\frac{3}{4}+\cos (400\pi t-\frac{\pi }{4})+2\cos (200\pi t)$</b> — Hoán đổi biên độ hai cặp và pha $400\pi$ sai.</li>
<li><span class="vd qbad">SAI</span><b>4. $\frac{3}{4}+\cos (400\pi t+\frac{\pi }{4})+2\cos (200\pi t)$</b> — Pha $400\pi$ đúng nhưng hoán đổi biên độ 2 và 1.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Điểm khác so với câu 9.6: pha $200\pi$ trở về 0, vì vậy nhánh $\cos (200\pi t)$ không còn $\pm \frac{\pi }{4}$.</div>
`
    },
    {
      id: '9-8', t: 9, n: 8, k: 'mc', c: 4, a: 1,
      im: [['9-8.webp', 577, 30], ['9-8b.webp', 577, 755]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x(t)=2\cos (400\pi t+\frac{\pi }{4})+\cos (200\pi t)$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$A \cos (\omega _{0}t+\varphi )$ ↔ các hệ số $\frac{A}{2}e^{+j\varphi }$ ở $+\omega _{0}$ và $\frac{A}{2}e^{-j\varphi }$ ở $-\omega _{0}$. DC $= X(0)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Cách đọc đồ thị: với tín hiệu THỰC, hai vạch phổ ở $\pm \omega$ phải là liên hợp: nếu vạch $+\omega$ có độ lớn $a$, pha φ thì hai vạch hợp thành $a\cdot e^{j\varphi }e^{j\omega t}+a\cdot e^{-j\varphi }e^{-j\omega t}=2a \cos (\omega t+\varphi )$. Không được quên hệ số 2.</p>
<p>Nhìn vạch tại $\omega =0$: đó là hệ số một chiều (DC). Biên độ DC là giá trị của chính vạch, KHÔNG nhân đôi; pha 0 cho DC dương, pha $\pi$ cho DC âm. Ở câu này $DC=0$.</p>
<p>Tại $+400\pi$: mỗi vạch có độ lớn 1 vì biên độ cos trong thời gian là 2. Đọc pha ở phía DƯƠNG: $\varphi _{400}=+\frac{\pi }{4}$. Số hạng thời gian là $2\cos (400\pi t++\frac{\pi }{4})$.</p>
<p>Tại $+200\pi$: độ lớn mỗi vạch $|X(+200\pi )|=0.5$ nên biên độ cos là 1. Pha tại $+200\pi$ bằng 0; số hạng là $1\cos (200\pi t)$.</p>
<p>Cộng lần lượt DC, hai cặp $\pm 400\pi$ và $\pm 200\pi$. Đề có ba nhóm tần số khác nhau; không được đưa pha của vạch âm vào cos phía tần số dương.</p>
<p>Kiểm: lấy biến đổi Fourier series của từng cos theo Euler, tại $\omega =+400\pi$ và $+200\pi$ phải thu lại đúng biên độ MỘT NỬA và pha đã đọc; tại $\omega =0$ phải thu lại đúng DC.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $2\cos (400\pi t+\frac{\pi }{4})+\cos (200\pi t)$</b> — Không có DC, pha $400\pi =+\frac{\pi }{4}$, $200\pi =0$.</li>
<li><span class="vd qbad">SAI</span><b>2. $2\cos (400\pi t-\frac{\pi }{4})+\cos (200\pi t)$</b> — Đảo dấu pha $400\pi$.</li>
<li><span class="vd qbad">SAI</span><b>3. $\cos (400\pi t-\frac{\pi }{4})+2\cos (200\pi t)$</b> — Hoán đổi biên độ lẫn dấu pha.</li>
<li><span class="vd qbad">SAI</span><b>4. $\cos (400\pi t+\frac{\pi }{4})+2\cos (200\pi t)$</b> — Hoán đổi biên độ: $400\pi$ phải 2, $200\pi$ phải 1.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Vạch DC vắng mặt ở $\omega =0$, nên đáp án không được có số hạng hằng. Câu này còn là kiểm tra “biên độ x2” khi ghép cặp.</div>
`
    },
    {
      id: '9-9', t: 9, n: 9, k: 'mc', c: 4, a: 1,
      im: [['9-9.webp', 829, 30], ['9-9b.webp', 829, 827]],
      e: r`
<div class="qans"><div class="qans-badge">Kết quả chính xác</div>
<div class="qans-main">Đáp án 1: $x(t)=2\cos (400\pi t+\frac{\pi }{4})+\cos (200\pi t-\frac{\pi }{4})$.</div>
</div>
<div class="qsec-title">1. Cơ sở lý thuyết &amp; Công thức áp dụng</div>
<div class="fm">$A \cos (\omega _{0}t+\varphi )$ ↔ các hệ số $\frac{A}{2}e^{+j\varphi }$ ở $+\omega _{0}$ và $\frac{A}{2}e^{-j\varphi }$ ở $-\omega _{0}$. DC $= X(0)$.</div>
<div class="qsec-title">2. Các bước giải chi tiết</div>
<div class="qsteps"><p>Cách đọc đồ thị: với tín hiệu THỰC, hai vạch phổ ở $\pm \omega$ phải là liên hợp: nếu vạch $+\omega$ có độ lớn $a$, pha φ thì hai vạch hợp thành $a\cdot e^{j\varphi }e^{j\omega t}+a\cdot e^{-j\varphi }e^{-j\omega t}=2a \cos (\omega t+\varphi )$. Không được quên hệ số 2.</p>
<p>Nhìn vạch tại $\omega =0$: đó là hệ số một chiều (DC). Biên độ DC là giá trị của chính vạch, KHÔNG nhân đôi; pha 0 cho DC dương, pha $\pi$ cho DC âm. Ở câu này $DC=0$.</p>
<p>Tại $+400\pi$: mỗi vạch có độ lớn 1 vì biên độ cos trong thời gian là 2. Đọc pha ở phía DƯƠNG: $\varphi _{400}=+\frac{\pi }{4}$. Số hạng thời gian là $2\cos (400\pi t++\frac{\pi }{4})$.</p>
<p>Tại $+200\pi$: độ lớn mỗi vạch $|X(+200\pi )|=0.5$ nên biên độ cos là 1. Pha tại $+200\pi$ bằng $-\frac{\pi }{4}$; số hạng là $1\cos (200\pi t-\frac{\pi }{4})$.</p>
<p>Cộng lần lượt DC, hai cặp $\pm 400\pi$ và $\pm 200\pi$. Đề có ba nhóm tần số khác nhau; không được đưa pha của vạch âm vào cos phía tần số dương.</p>
<p>Kiểm: lấy biến đổi Fourier series của từng cos theo Euler, tại $\omega =+400\pi$ và $+200\pi$ phải thu lại đúng biên độ MỘT NỬA và pha đã đọc; tại $\omega =0$ phải thu lại đúng DC.</p>
</div>
<div class="qsec-title">3. Phân tích phương án &amp; Bẫy trắc nghiệm</div>
<ul class="ch"><li><span class="vd qok">ĐÚNG</span><b>1. $2\cos (400\pi t+\frac{\pi }{4})+\cos (200\pi t-\frac{\pi }{4})$</b> — Pha $400\pi$ dương, pha $200\pi$ âm, biên độ lần lượt 2 và 1.</li>
<li><span class="vd qbad">SAI</span><b>2. $2\cos (400\pi t-\frac{\pi }{4})+\cos (200\pi t+\frac{\pi }{4})$</b> — Đảo dấu pha cả hai thành phần.</li>
<li><span class="vd qbad">SAI</span><b>3. $\cos (400\pi t-\frac{\pi }{4})+2\cos (200\pi t+\frac{\pi }{4})$</b> — Hoán đổi biên độ $400\pi \longleftrightarrow 200\pi$, pha cũng đảo.</li>
<li><span class="vd qbad">SAI</span><b>4. $\cos (400\pi t+\frac{\pi }{4})+2\cos (200\pi t-\frac{\pi }{4})$</b> — Hai pha đúng nhưng hai hệ số biên độ bị hoán đổi.</li>
</ul>
<div class="qsec-title">4. Mẹo kiểm tra nhanh (Sanity Check)</div>
<div class="qcheck">Kiểm tính liên hợp: pha tại $-400\pi$ phải $-\frac{\pi }{4}$, tại $-200\pi$ phải $+\frac{\pi }{4}$. Cách dựng cos từ pha tại tần số DƯƠNG tuân điều kiện đó.</div>
`
    }
  ]
  };
})();
