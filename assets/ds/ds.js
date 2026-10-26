/* Dolgov AI · дизайн-система · поведение: меню сайта на телефоне и планшете (≤900 px).
   Кнопка .menu-btn раскрывает .head-panel под шапкой; закрывают повторное нажатие, Esc и переход по пункту. */
(function () {
  function head() { return document.querySelector(".site-head"); }
  function setOpen(open) {
    var h = head(); if (!h) return;
    h.classList.toggle("open", open);
    var b = h.querySelector(".menu-btn");
    if (b) b.setAttribute("aria-expanded", String(open));
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest(".menu-btn")) { setOpen(!head().classList.contains("open")); return; }
    if (e.target.closest(".head-panel a")) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    var h = head();
    if (e.key === "Escape" && h && h.classList.contains("open")) {
      setOpen(false);
      var b = h.querySelector(".menu-btn"); if (b) b.focus();
    }
  });
})();
