/* Dolgov AI · дизайн-система · поведение: меню слева на телефоне и планшете (≤960 px).
   Кнопка .menu-btn открывает .side поверх страницы, закрывают подложка .scrim, Esc и переход по пункту. */
(function () {
  function shell() { return document.querySelector(".shell"); }
  function setOpen(open) {
    var s = shell(); if (!s) return;
    s.classList.toggle("nav-open", open);
    var b = s.querySelector(".menu-btn");
    if (b) b.setAttribute("aria-expanded", String(open));
    if (open) { var first = s.querySelector(".side a"); if (first) first.focus(); }
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest(".menu-btn")) { setOpen(!shell().classList.contains("nav-open")); return; }
    if (e.target.closest(".scrim")) { setOpen(false); return; }
    if (e.target.closest(".side a") && matchMedia("(max-width: 960px)").matches) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && shell() && shell().classList.contains("nav-open")) {
      setOpen(false);
      var b = shell().querySelector(".menu-btn"); if (b) b.focus();
    }
  });
})();
