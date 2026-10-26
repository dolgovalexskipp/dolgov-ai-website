/* Dolgov AI · дизайн-система · поведение: тема и мобильное меню.
   Тема: без выбора — как в системе; выбор кнопкой хранится в localStorage "da_theme".
   Ранний вызов (без мигания) — инлайн в <head>:
   <script>try{var t=localStorage.getItem("da_theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script> */
(function () {
  var root = document.documentElement;
  var KEY = "da_theme";

  function current() {
    return root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function paint() {
    var t = current();
    document.querySelectorAll(".theme button[data-theme-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.themeSet === t));
    });
  }
  function setTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem(KEY, t); } catch (e) {}
    paint();
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest(".theme button[data-theme-set]");
    if (b) { setTheme(b.dataset.themeSet); return; }
    var m = e.target.closest(".bar .menu");
    if (m) {
      var bar = m.closest(".bar");
      var open = bar.classList.toggle("open");
      m.setAttribute("aria-expanded", String(open));
      return;
    }
    if (e.target.closest(".bar-panel a")) {
      var bar2 = e.target.closest(".bar");
      bar2.classList.remove("open");
      var mb = bar2.querySelector(".menu");
      if (mb) mb.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".bar.open").forEach(function (bar) {
      bar.classList.remove("open");
      var mb = bar.querySelector(".menu");
      if (mb) { mb.setAttribute("aria-expanded", "false"); mb.focus(); }
    });
  });
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paint); } catch (e) {}
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint); else paint();
})();
