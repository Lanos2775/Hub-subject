/* Cấu hình MathJax — phải nạp TRƯỚC script MathJax trong tin-hieu.html */
window.MathJax = {
    tex: { inlineMath: [['$', '$'], ['\\(', '\\)']], displayMath: [['$$', '$$'], ['\\[', '\\]']], processEscapes: true },
    options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] },
    chtml: { scale: .96 }
};
