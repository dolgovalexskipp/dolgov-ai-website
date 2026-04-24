/* Sasha AI assistant widget — floating bubble linking to @dolgovalex_welcome_bot.
 * Self-contained: injects its own styles and DOM. Drop the script tag into any page.
 */
(function () {
  if (window.__sashaWidgetLoaded) return;
  window.__sashaWidgetLoaded = true;

  var BOT_URL = "https://t.me/dolgovalex_welcome_bot";
  var AVATAR = "/assets/sasha-ai-assistant.jpg";

  var css = ""
    + ".sasha-widget{position:fixed;right:24px;bottom:24px;z-index:9999;"
    +   "font-family:inherit;color:var(--ink,#10100f)}"
    + ".sasha-widget-btn{width:60px;height:60px;border-radius:50%;"
    +   "background:var(--green-900,#173a28);color:var(--paper-2,#fdfbf7);"
    +   "border:none;cursor:pointer;box-shadow:0 8px 24px rgba(17,40,29,.28);"
    +   "display:flex;align-items:center;justify-content:center;"
    +   "transition:transform .2s ease,box-shadow .2s ease;padding:0;overflow:hidden;"
    +   "background-image:url('" + AVATAR + "');background-size:cover;background-position:center}"
    + ".sasha-widget-btn:hover{transform:translateY(-2px);"
    +   "box-shadow:0 12px 32px rgba(17,40,29,.35)}"
    + ".sasha-widget-btn::after{content:'';position:absolute;bottom:4px;right:4px;"
    +   "width:14px;height:14px;border-radius:50%;background:#34d058;"
    +   "border:2px solid var(--paper,#f6f0e6)}"
    + ".sasha-widget-card{position:absolute;right:0;bottom:74px;width:320px;max-width:calc(100vw - 48px);"
    +   "background:var(--paper-2,#fdfbf7);border:1px solid rgba(58,117,77,.16);"
    +   "border-radius:20px;padding:20px;box-shadow:0 16px 48px rgba(17,40,29,.18);"
    +   "opacity:0;transform:translateY(8px);pointer-events:none;"
    +   "transition:opacity .22s ease,transform .22s ease}"
    + ".sasha-widget.open .sasha-widget-card{opacity:1;transform:translateY(0);pointer-events:auto}"
    + ".sasha-widget-close{position:absolute;top:10px;right:12px;width:28px;height:28px;"
    +   "border:none;background:transparent;font-size:20px;line-height:1;color:#888;"
    +   "cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center}"
    + ".sasha-widget-close:hover{background:rgba(0,0,0,.04);color:var(--ink,#10100f)}"
    + ".sasha-widget-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}"
    + ".sasha-widget-avatar{width:36px;height:36px;border-radius:50%;background-size:cover;background-position:center;"
    +   "background-image:url('" + AVATAR + "')}"
    + ".sasha-widget-name{font-weight:600;font-size:14px;line-height:1.2;color:var(--ink,#10100f)}"
    + ".sasha-widget-sub{font-size:12px;color:var(--green-700,#3a754d);line-height:1.3;margin-top:2px}"
    + ".sasha-widget-msg{font-size:14px;line-height:1.5;color:var(--ink,#10100f);"
    +   "margin:10px 0 16px;padding:10px 12px;background:var(--green-100,#e7efe8);border-radius:12px}"
    + ".sasha-widget-cta{display:flex;align-items:center;justify-content:center;gap:8px;"
    +   "width:100%;padding:12px 16px;border-radius:12px;"
    +   "background:var(--green-900,#173a28);color:var(--paper-2,#fdfbf7);"
    +   "text-decoration:none;font-weight:500;font-size:14px;"
    +   "transition:background .2s ease;box-sizing:border-box}"
    + ".sasha-widget-cta:hover{background:var(--green-950,#11281d)}"
    + ".sasha-widget-hint{font-size:11px;color:#888;text-align:center;margin-top:10px;line-height:1.4}"
    + "@media (max-width:480px){"
    +   ".sasha-widget{right:16px;bottom:16px}"
    +   ".sasha-widget-btn{width:56px;height:56px}"
    +   ".sasha-widget-card{bottom:70px;width:280px}"
    + "}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var root = document.createElement("div");
  root.className = "sasha-widget";
  root.innerHTML =
    '<div class="sasha-widget-card" role="dialog" aria-label="Чат с Сашей">'
    +   '<button class="sasha-widget-close" aria-label="Закрыть">×</button>'
    +   '<div class="sasha-widget-head">'
    +     '<div class="sasha-widget-avatar"></div>'
    +     '<div>'
    +       '<div class="sasha-widget-name">Саша</div>'
    +       '<div class="sasha-widget-sub">AI-ассистент Александра Долгова</div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="sasha-widget-msg">'
    +     'Привет! Если хотите разобраться с AI в работе — напишите, помогу понять, подойдёт ли формат, и соберу контекст для Александра.'
    +   '</div>'
    +   '<a class="sasha-widget-cta" href="' + BOT_URL + '" target="_blank" rel="noopener">'
    +     'Открыть чат в Telegram'
    +     '<span aria-hidden="true">→</span>'
    +   '</a>'
    +   '<div class="sasha-widget-hint">Ответ в Telegram — быстрее, чем форма</div>'
    + '</div>'
    + '<button class="sasha-widget-btn" aria-label="Чат с AI-ассистентом Саша"></button>';

  document.body.appendChild(root);

  var btn = root.querySelector(".sasha-widget-btn");
  var close = root.querySelector(".sasha-widget-close");

  function toggle(open) {
    if (open === undefined) open = !root.classList.contains("open");
    root.classList.toggle("open", !!open);
  }

  btn.addEventListener("click", function () { toggle(); });
  close.addEventListener("click", function (e) { e.stopPropagation(); toggle(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.classList.contains("open")) toggle(false);
  });
})();
