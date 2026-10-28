/* Прототип каркаса: разделы как вкладки, оглавление раздела, ассистент по готовому сценарию.
   Адреса разделов в прототипе — #programmy, #harness и т. д.; в рабочей версии это будут
   отдельные статичные страницы (/programmy/, /harness/), чтобы их находил поиск. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SPRITE = ($("use")?.getAttribute("href") || "").split("#")[0];
  const icon = n => `<svg class="i" aria-hidden="true"><use href="${SPRITE}#${n}"/></svg>`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const overlay = () => matchMedia("(max-width: 1279px)").matches;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lc = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : "";

  /* ─── разделы и вкладки ─── */
  const TITLES = { home: "Главная", programmy: "Программы", mastermind: "Мастермайнд", harness: "Company Harness", metod: "Метод", produkty: "Продукты", stati: "Статьи", bio: "Био" };
  /* короткие адреса, которые открывают раздел сразу на нужном месте */
  const ALIAS = { opyt: ["bio", "bio-teach"] };
  const app = $("#ap");
  let opened = [];
  let cur = "home";
  const seen = new Set();

  $$(".ap-nav a").forEach(a => { const t = a.textContent.trim(); a.title = t; });

  function show(s) {
    let anchor = null;
    if (ALIAS[s]) [s, anchor] = ALIAS[s];
    if (!TITLES[s]) s = "home";
    cur = s;
    $$(".ap-view").forEach(v => { v.hidden = v.dataset.view !== s; });
    $$("[data-s]").forEach(a => a.dataset.s === s ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    if (s !== "home") { if (!opened.includes(s)) opened.push(s); seen.add(TITLES[s]); }
    app.classList.toggle("in-section", s !== "home");
    renderTabs();
    sheet(false);
    const pane = $(`.ap-view[data-view="${s}"] .win-pane`);
    if (pane) {
      pane.scrollTop = 0;
      if (anchor) { const el = document.getElementById(anchor); if (el) pane.scrollTop = el.getBoundingClientRect().top - pane.getBoundingClientRect().top - 12; }
      spy(pane);
    }
  }
  function go(s) { if (location.hash.slice(1) !== s) location.hash = s; else show(s); }
  window.addEventListener("hashchange", () => show(location.hash.slice(1) || "home"));

  function renderTabs() {
    const box = $("#tabs");
    box.innerHTML = "";
    const tab = (s, closable) => {
      const t = document.createElement("div");
      t.className = "ap-tab" + (closable ? " closable" : "");
      t.setAttribute("role", "tab");
      t.setAttribute("aria-selected", String(s === cur));
      t.tabIndex = 0;
      t.innerHTML = `<span>${TITLES[s]}</span>` + (closable ? `<button class="x" type="button" aria-label="Закрыть вкладку ${TITLES[s]}">${icon("x")}</button>` : "");
      t.addEventListener("click", e => { if (e.target.closest(".x")) { e.stopPropagation(); closeTab(s); } else go(s); });
      t.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(s); } });
      box.append(t);
    };
    tab("home", false);
    opened.forEach(s => tab(s, true));
    if (!opened.length) {
      const h = document.createElement("span");
      h.className = "ap-tabs-hint";
      h.textContent = "Разделы открываются вкладками";
      box.append(h);
    }
  }
  function closeTab(s) {
    opened = opened.filter(x => x !== s);
    if (cur === s) go(opened[opened.length - 1] || "home"); else renderTabs();
  }

  /* оглавление раздела: переход и подсветка при прокрутке */
  const spied = new WeakSet();
  function spy(pane) {
    const nav = pane.parentElement.querySelector(".win-nav");
    if (!nav) return;
    const btns = $$("button[data-to]", nav);
    const update = () => {
      const top = pane.getBoundingClientRect().top;
      let on = btns[0];
      for (const b of btns) {
        const el = document.getElementById(b.dataset.to);
        if (el && el.getBoundingClientRect().top - top < 120) on = b;
      }
      if (pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 4) on = btns[btns.length - 1];
      btns.forEach(b => b.classList.toggle("on", b === on));
    };
    if (!spied.has(pane)) {
      spied.add(pane);
      pane.addEventListener("scroll", update, { passive: true });
      btns.forEach(b => b.addEventListener("click", () => {
        document.getElementById(b.dataset.to)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }));
    }
    update();
  }

  /* сетка темпа запусков: точка — месяц, когда берём новый процесс */
  $$(".pace-r").forEach(r => {
    const n = +r.dataset.every;
    for (let m = 1; m <= 12; m++) {
      const i = document.createElement("i");
      if ((m - 1) % n === 0) { i.className = "on"; i.title = `месяц ${m}: новый процесс`; }
      r.append(i);
    }
  });

  /* «Ещё» на телефоне */
  const moreBtn = $("#moreBtn"), moreSheet = $("#moreSheet");
  function sheet(open) { moreSheet.hidden = !open; moreBtn.setAttribute("aria-expanded", String(open)); }
  moreBtn.addEventListener("click", () => sheet(moreSheet.hidden));
  document.addEventListener("click", e => { if (!moreSheet.hidden && !e.target.closest("#moreSheet, #moreBtn")) sheet(false); });

  /* тост для заглушек */
  let toastT;
  function toast(text) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.append(t); }
    t.textContent = text; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800);
  }
  document.addEventListener("click", e => {
    if (e.target.closest("[data-policy]")) { e.preventDefault(); toast("Политика обработки данных и cookie: страница в работе, появится до запуска"); }
  });

  /* ─── ассистент ─── */
  const chat = $("#chat"), log = $("#chLog"), form = $("#chForm"), input = $("#chIn");
  const L = {};
  let pending = null, busy = false;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const scrollEnd = () => { log.scrollTop = log.scrollHeight; };

  function openChat(focus = true) {
    if (overlay()) chat.classList.add("open");
    else { chat.classList.remove("flash"); void chat.offsetWidth; chat.classList.add("flash"); setTimeout(() => chat.classList.remove("flash"), 700); }
    if (focus && !input.disabled) setTimeout(() => input.focus({ preventScroll: true }), overlay() ? 260 : 0);
  }
  function closeChat() { chat.classList.remove("open"); }
  $$("[data-chat-open]").forEach(b => b.addEventListener("click", () => openChat()));
  $$("[data-chat-close]").forEach(b => b.addEventListener("click", closeChat));
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeChat(); sheet(false); } });
  $$("[data-chat-focus]").forEach(b => b.addEventListener("click", () => {
    openChat();
    const topic = b.dataset.topic;
    if (topic && pending === onTopic) answer(topic);
  }));

  function add(cls, html) {
    const d = document.createElement("div");
    d.className = "msg " + cls;
    d.innerHTML = html;
    log.append(d);
    scrollEnd();
    return d;
  }
  async function say(html, ms = 650) {
    busy = true;
    const t = add("bot typing", "<i></i><i></i><i></i>");
    t.setAttribute("aria-label", "Ассистент печатает");
    await wait(ms);
    t.remove();
    const d = add("bot", html);
    busy = false;
    return d;
  }
  function chips(list) {
    const w = document.createElement("div");
    w.className = "chips";
    list.forEach(c => {
      const o = typeof c === "string" ? { label: c } : c;
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = o.label;
      b.addEventListener("click", () => { if (o.action) o.action(); else answer(o.label); });
      w.append(b);
    });
    log.append(w);
    scrollEnd();
  }
  const clearChips = () => $$(".chips", log).forEach(c => c.remove());
  async function ask(html, list, fn) {
    await say(html);
    if (list && list.length) chips(list);
    pending = fn;
  }
  function answer(text) {
    if (busy) return;
    if (!pending) { add("me", esc(text)); say("Записал, добавлю к заявке."); return; }
    clearChips();
    add("me", esc(text));
    const fn = pending; pending = null;
    fn(text);
  }
  function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; }
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v || input.disabled) return;
    input.value = ""; autosize();
    answer(v);
  });
  const lock = (on, hint) => { input.disabled = on; input.placeholder = on ? hint : "Опишите задачу своими словами"; };
  const freeze = el => $$("button, input, select", el).forEach(x => { x.disabled = true; });

  const T = { learn: "Обучить команду работе с агентами", proc: "Перевести процесс компании на агентов", mm: "Попасть на мастермайнд", look: "Пока изучаю" };
  const ROLES = ["Собственник", "Руководитель отдела", "HR или обучение"];

  async function start() {
    log.innerHTML = "";
    Object.keys(L).forEach(k => delete L[k]);
    pending = null; busy = false; lock(false);
    $("#tgDemo").hidden = true;
    add("sys", "Прототип: ассистент идёт по готовому сценарию. Нейросеть подключим следующим шагом.");
    await ask("Здравствуйте. Я ИИ-ассистент Александра Долгова. Помогу сформулировать задачу и передам её Александру. С чем пришли?", [T.learn, T.proc, T.mm, T.look], onTopic);
  }
  async function onTopic(t) {
    L.topic = t;
    if (t === T.look) {
      await say("Тогда начните с раздела «Метод» или со статей. Когда появится задача, напишите сюда.");
      chips([
        { label: "Открыть «Метод»", action: () => { go("metod"); if (overlay()) closeChat(); } },
        { label: "Есть задача", action: async () => { clearChips(); add("me", "Есть задача"); await ask("С чем пришли?", [T.learn, T.proc, T.mm], onTopic); } },
      ]);
      return;
    }
    if (t === T.learn) return ask("Сколько человек будет учиться и из каких отделов?", ["До 15 человек", "От 16 до 25", "Больше 25"], onDetail);
    if (t === T.proc) return ask("Какой процесс болит сильнее всего? Например, путь от заявки клиента до отправленного КП.", ["Продажи и КП", "Закупки и тендеры", "Отчётность", "Другой процесс"], onDetail);
    if (t === T.mm) return ask("Мастермайнд собирает 5–8 человек: очный день в Москве и два онлайн-разбора. Какие задачи хотите отдать агентам?", ["Почта и документы", "Продажи", "Аналитика и отчёты", "Расскажу сам"], onDetail);
    L.topic = "Своя задача"; L.detail = t;
    return ask("Понял. В какой компании вы работаете и какая у вас роль?", ROLES, onRole);
  }
  async function onDetail(d) {
    L.detail = d;
    await ask("В какой компании вы работаете и какая у вас роль? Можно коротко, например «производство, собственник».", ROLES, onRole);
  }
  async function onRole(r) {
    L.role = r;
    await suggest();
    await ask("Как удобнее продолжить?", ["Созвониться", "Переписка в Telegram", "Письмом на почту"], onChannel);
  }
  async function suggest() {
    let s = "programmy", txt;
    if (L.topic === T.proc) { L.format = "Company Harness"; s = "harness"; txt = "Это задача для Company Harness: запускаем процесс за две недели, два месяца внедряем на живых данных, дальше поддерживаем. Тариф зависит от того, как часто брать новые процессы."; }
    else if (L.topic === T.mm) { L.format = "Мастермайнд «ИИ на практике»"; s = "mastermind"; txt = "Подойдёт мастермайнд: за месяц у вас будет личная рабочая среда и три агента на ваших задачах. 80 000 ₽ с участника."; }
    else if (/16|25/.test(L.detail || "")) { L.format = "Программа «Два дня»"; txt = "Для такой группы подойдёт программа «Два дня»: разбор ваших данных, агенты под задачи отделов и защита проектов."; }
    else { L.format = "Тренинг-хакатон «День»"; txt = "Подойдёт тренинг-хакатон «День»: за 8 часов каждый отдел собирает агента на своей задаче и уходит с планом на 30 дней."; }
    const d = await say(`${esc(txt)}<div class="mlink"><button type="button" class="btn btn-outline btn-sm">${icon("arrow-right")}Открыть «${TITLES[s]}»</button></div>`, 900);
    d.querySelector("button").addEventListener("click", () => { go(s); if (overlay()) closeChat(); });
  }
  async function onChannel(c) {
    L.channel = c;
    if (c === "Созвониться") {
      return ask("Когда вам удобно созвониться?", ["Завтра до обеда", "Завтра после обеда", "В течение недели"], async t => {
        L.time = t;
        await ask("Где удобнее говорить?", ["Звонок в Telegram", "Телемост или Zoom", "По телефону"], async w => { L.where = w; await contact(); });
      });
    }
    await contact();
  }
  async function contact() {
    const kind = L.channel === "Письмом на почту" ? "email" : (L.where === "По телефону" ? "phone" : "tg");
    const lbl = { email: "Почта", phone: "Телефон", tg: "Telegram или телефон" }[kind];
    const mode = { email: "email", phone: "tel", tg: "text" }[kind];
    const d = await say(`Как к вам обращаться и куда ответить?
      <form class="mform" novalidate>
        <label>Имя<input name="name" autocomplete="given-name" value="${esc(L.name || "")}"></label>
        <label>${lbl}<input name="contact" inputmode="${mode}" value="${esc(L.contact || "")}"></label>
        <label>Откуда вы о нас узнали<select name="source"><option value="">Выберите</option><option>Школа клуба «Команда»</option><option>ИИ-модуль в Казани</option><option>Рекомендация</option><option>Поиск в интернете</option><option>Telegram-канал</option><option>Другое</option></select></label>
        <label class="ck"><input type="checkbox" name="ok"><span>Согласен на обработку персональных данных по <a href="#" data-policy>политике</a></span></label>
        <p class="err" hidden></p>
        <button class="btn btn-primary btn-sm" type="submit">Дальше</button>
      </form>`, 700);
    lock(true, "Заполните форму выше");
    const f = $("form", d);
    f.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(f), err = $(".err", f);
      const name = String(fd.get("name") || "").trim(), ct = String(fd.get("contact") || "").trim();
      if (!name || !ct) { err.textContent = "Укажите имя и контакт, чтобы Александр мог ответить."; err.hidden = false; return; }
      if (!fd.get("ok")) { err.textContent = "Без согласия на обработку данных передать заявку нельзя."; err.hidden = false; return; }
      L.name = name; L.contact = ct; L.source = String(fd.get("source") || "") || "не указано";
      freeze(f); lock(false);
      summary();
    });
    setTimeout(() => $("input", f)?.focus({ preventScroll: true }), 50);
  }
  const how = () => L.channel === "Созвониться" ? `созвон: ${lc(L.time)}, ${lc(L.where)}` : (L.channel === "Письмом на почту" ? "письмо на почту" : "переписка в Telegram");
  async function summary() {
    const rows = [["Задача", L.topic], ["Подробности", L.detail], ["Компания и роль", L.role], ["Предложил", L.format], ["Связь", how()], ["Контакт", `${L.name}, ${L.contact}`]];
    const d = await say(`Вот что я передам Александру:<dl class="sum">${rows.filter(r => r[1]).map(r => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl><div class="row"><button class="btn btn-primary btn-sm" type="button" data-send>Отправить</button><button class="btn btn-ghost btn-sm" type="button" data-fix>Исправить</button></div>`, 800);
    $("[data-send]", d).addEventListener("click", () => { freeze(d); send(); });
    $("[data-fix]", d).addEventListener("click", () => { freeze(d); add("me", "Исправить"); contact(); });
  }
  async function send() {
    add("me", "Отправить");
    const next = L.channel === "Созвониться"
      ? `Александр или его ассистент напишет вам, чтобы подтвердить звонок: ${lc(L.time)}, ${lc(L.where)}.`
      : (L.channel === "Письмом на почту" ? "Александр или его ассистент ответит вам на почту." : "Александр или его ассистент напишет вам в Telegram.");
    await say(`Передал. ${esc(next)} Если вопрос срочный, напишите напрямую: @dolgovalex.`, 900);
    tg();
    pending = null;
    chips([{ label: "Начать заново", action: start }]);
  }
  function tg() {
    const rows = [["Имя", L.name], ["Контакт", L.contact], ["Задача", L.topic], ["Подробности", L.detail], ["Компания и роль", L.role], ["Предложил", L.format], ["Связь", how()], ["Откуда", L.source], ["Смотрел", [...seen].join(", ") || "только главную"]];
    const flag = L.source === "ИИ-модуль в Казани" ? `<p class="flag">Участник модуля IT-Парка: по договору продажа с их согласия, 10% организатору и сводка раз в неделю.</p>` : "";
    $("#tgMsg").innerHTML = `<p class="bot-n">Долгов, Эй Ай · заявки</p><p><b>Новая заявка с сайта</b></p><dl>${rows.filter(r => r[1]).map(r => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl>${flag}<div class="btns"><span>Взять в работу</span><span>Открыть переписку</span></div>`;
    $("#tgDemo").hidden = false;
  }
  $("#tgClose").addEventListener("click", () => { $("#tgDemo").hidden = true; });
  $("#chReset").addEventListener("click", start);

  /* старт */
  show(location.hash.slice(1) || "home");
  start();
})();
