# Tín Hiệu & Hệ Thống — cấu trúc dự án

```
tin-hieu.html            Vỏ trang + TOÀN BỘ nội dung các bài (khối #raw-course-content)
css/base.css             Giao diện chung (theme, thanh trên, thẻ, bảng, menu…)
js/
  mathjax-config.js      Cấu hình MathJax
  icons.js               Biểu tượng SVG + đầu mũi tên dùng chung
  figures.js             Các hình vẽ SVG, gọi trong bài bằng [FIG: id]
  course.js              Đọc nội dung bài và biên dịch cú pháp [H2] / [BOX] / … thành HTML
  app.js                 Menu, chuyển bài, phím tắt, nạp lười quiz / công thức / lab
quiz/
  quiz-data.js           ← SỬA CÂU HỎI Ở ĐÂY (109 câu, lời giải viết bằng r`...`)
  quiz.js · quiz.css     Giao diện quiz
  img/*.webp             Ảnh đề (tên file = id câu hỏi, vd 1-1.webp)
formulas/
  formulas-data.js       ← SỬA BẢNG CÔNG THỨC Ở ĐÂY (mỗi dòng một hàng của bảng)
  formulas.js · .css     Dựng và hiển thị popup bảng tra
```

## Việc thường làm
- **Sửa nội dung bài**: sửa trong `tin-hieu.html`.
- **Thêm / sửa câu quiz**: thêm một khối `{ id, t, n, k, … }` vào `quiz/quiz-data.js`, đặt ảnh đề vào `quiz/img/`.
  Cú pháp từng trường được ghi ở đầu file.
- **Sửa công thức**: sửa một dòng trong `formulas/formulas-data.js`, ví dụ
  `Tuyến tính :: $a_1 x_1(t) + a_2 x_2(t)$ :: $a_1 X_1(\omega) + a_2 X_2(\omega)$`.
- **Phòng thí nghiệm**: `lab.js` / `lab.css` vẫn được nạp từ cùng thư mục với `tin-hieu.html` như trước.

Mở trực tiếp bằng file (double-click) hoặc qua web server đều chạy được; quiz và bảng công thức chỉ được tải khi bấm M / H lần đầu.
