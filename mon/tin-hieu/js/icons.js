/* icons.js — bộ biểu tượng SVG (sprite) và đầu mũi tên dùng chung cho mọi hình vẽ.
   Thêm biểu tượng mới: thêm <symbol id="i-..."> rồi gọi <svg><use href="#i-..."/></svg>. */
document.body.insertAdjacentHTML('afterbegin', `
<svg width="0" height="0" style="position:absolute;margin:0;border:0;background:none" aria-hidden="true">
  <defs>
    <marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0L8,4L0,8z" style="fill:var(--mut)"/></marker>
    <marker id="ar2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0L8,4L0,8z" style="fill:var(--c2)"/></marker>
    <marker id="ar4" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0L8,4L0,8z" style="fill:var(--c4)"/></marker>
    <marker id="ar5" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0L8,4L0,8z" style="fill:var(--c5)"/></marker>
    <symbol id="i-quiz" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></g></symbol>
    <symbol id="i-sigma" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2"/></g></symbol><symbol id="i-lab" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></g></symbol>
    <symbol id="i-keyboard" viewBox="0 0 24 24"><path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM6 8h2v2H6V8zm0 4h2v2H6v-2zm3 0h2v2H9v-2zm0-4h2v2H9V8zm3 0h2v2h-2V8zm0 4h2v2h-2v-2zm3-4h2v2h-2V8zm0 4h2v2h-2v-2zm3-4h2v2h-2V8zm0 4h2v2h-2v-2zM7 16h10v1.5H7V16z"/></symbol>
  </defs>
</svg>
`);
