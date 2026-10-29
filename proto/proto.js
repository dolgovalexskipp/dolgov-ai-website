/* Прототип каркаса v3: пять разделов, программы по одной на экран, вход по ролям,
   ассистент с экспресс-диагностикой и подсказкой по разделу.
   Адреса в прототипе — #komandam, #agent и т. д.; в рабочей версии это отдельные
   статичные страницы (/komandam/agent/), чтобы их находил поиск. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SPRITE = ($("use")?.getAttribute("href") || "").split("#")[0];
  const icon = n => `<svg class="i" aria-hidden="true"><use href="${SPRITE}#${n}"/></svg>`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const overlay = () => matchMedia("(max-width: 1279px)").matches;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lc = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : "";

  /* ─── разделы, вкладки, экраны внутри раздела ─── */
  const TITLES = { home: "Главная", komandam: "Командам", harness: "Агентное управление", lichno: "Лично", metod: "Метод", bio: "Обо мне" };
  /* короткие адреса: раздел и экран внутри (имя экрана) или место на странице (#якорь) */
  const ALIAS = {
    programmy: ["komandam", "obzor"], navyk: ["komandam", "navyk"], agent: ["komandam", "agent"], pilot: ["komandam", "pilot"], sistema: ["komandam", "sistema"],
    pogruzhenie: ["lichno", "pogruzhenie"], konsultaciya: ["lichno", "konsultaciya"], mastermind: ["lichno", "pogruzhenie"],
    kontur: ["harness", "#hz-corp"], opyt: ["bio", "#bio-teach"], produkty: ["bio", "#bio-prod"], stati: ["bio", "#bio-stati"], sdelano: ["bio", "#bio-site"],
  };
  const SUBNAME = { navyk: "Навык", agent: "Агент", pilot: "Пилот", sistema: "Система", pogruzhenie: "Погружение", konsultaciya: "Консультация" };
  const app = $("#ap");
  let opened = [];
  let cur = "home";
  const seen = new Set();

  $$(".ap-nav a").forEach(a => { a.title = a.textContent.trim(); });

  function setSub(win, name) {
    const subs = $$(".sub", win);
    if (!subs.length) return;
    if (!subs.some(x => x.dataset.sub === name)) name = subs[0].dataset.sub;
    subs.forEach(x => { x.hidden = x.dataset.sub !== name; });
    $$(".win-nav [data-sub]", win).forEach(b => b.classList.toggle("on", b.dataset.sub === name));
    const pane = $(".win-pane", win);
    if (pane) pane.scrollTop = 0;
    if (SUBNAME[name]) seen.add(SUBNAME[name]);
  }
  $$(".win-nav [data-sub]").forEach(b => b.addEventListener("click", () => setSub(b.closest(".ap-view"), b.dataset.sub)));
  $$("tr[data-go]").forEach(tr => { tr.tabIndex = 0; tr.addEventListener("click", () => go(tr.dataset.go)); tr.addEventListener("keydown", e => { if (e.key === "Enter") go(tr.dataset.go); }); });

  function show(token) {
    let s = token, sub = null;
    if (ALIAS[s]) [s, sub] = ALIAS[s];
    if (!TITLES[s]) s = "home";
    cur = s;
    $$(".ap-view").forEach(v => { v.hidden = v.dataset.view !== s; });
    $$("[data-s]").forEach(a => a.dataset.s === s ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    if (s !== "home") { if (!opened.includes(s)) opened.push(s); seen.add(TITLES[s]); }
    app.classList.toggle("in-section", s !== "home");
    renderTabs();
    sheet(false);
    const view = $(`.ap-view[data-view="${s}"]`);
    if ($(".sub", view)) setSub(view, sub && !sub.startsWith("#") ? sub : ($(".win-nav [data-sub].on", view)?.dataset.sub || null));
    const pane = $(".win-pane", view);
    if (pane) {
      if (sub && sub.startsWith("#")) {
        const el = document.getElementById(sub.slice(1));
        pane.scrollTop = 0;
        if (el) pane.scrollTop = el.getBoundingClientRect().top - pane.getBoundingClientRect().top - 12;
      } else if (!$(".sub", view)) pane.scrollTop = 0;
      spy(pane);
    }
    context(s);
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

  /* оглавление длинного раздела: переход и подсветка при прокрутке */
  const spied = new WeakSet();
  function spy(pane) {
    const nav = pane.parentElement.querySelector(".win-nav");
    const btns = nav ? $$("button[data-to]", nav) : [];
    if (!btns.length) return;
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

  /* сетка темпа запусков агентного управления */
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
  const chat = $("#chat"), log = $("#chLog"), form = $("#chForm"), input = $("#chIn"), ctxBox = $("#chCtx");
  const L = {};
  let pending = null, busy = false, inForm = false;
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
  document.addEventListener("click", e => {
    const d = e.target.closest("[data-diag]");
    if (d) { openChat(false); restartWith("Экспресс-диагностика", diag); return; }
    const f = e.target.closest("[data-chat-focus]");
    if (f) { openChat(); if (f.dataset.topic) restartWith(f.dataset.topic, () => onTopic(f.dataset.topic)); }
  });
  /* вход по ролям: раздел открывается, ассистент знает, кто пришёл */
  $$("[data-role]").forEach(a => a.addEventListener("click", () => { L.role = a.dataset.role; }));

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
    t.setAttribute("aria-label", "Печатает");
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
  /* начать новую ветку разговора, не дожидаясь текущей */
  function restartWith(label, fn) {
    if (busy || inForm) return;
    clearChips(); pending = null;
    add("me", esc(label));
    fn();
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
  const lock = (on, hint) => { inForm = on; input.disabled = on; input.placeholder = on ? hint : "Опишите задачу своими словами"; context(cur); };
  const freeze = el => $$("button, input, select", el).forEach(x => { x.disabled = true; });

  /* подсказка по разделу над полем ввода */
  const CTX = {
    home: ["Какую работу отдать агентам первой?", diag],
    komandam: ["Какая программа подойдёт нам?", diag],
    harness: ["Какой тариф нам подойдёт?", diag],
    lichno: ["Записаться на Погружение", () => onTopic(T.solo)],
    metod: ["Как это выглядит на наших задачах?", diag],
    bio: ["Обсудить задачу", () => onTopic(T.learn)],
  };
  function context(s) {
    const c = CTX[s];
    if (!c || inForm) { ctxBox.hidden = true; return; }
    ctxBox.hidden = false;
    ctxBox.innerHTML = `<span>Вы в разделе «${TITLES[s]}»</span>`;
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = c[0];
    b.addEventListener("click", () => { openChat(false); restartWith(c[0], c[1]); });
    ctxBox.append(b);
  }

  const T = { diag: "Экспресс-диагностика, 3 минуты", learn: "Обучить команду работе с агентами", proc: "Перевести процесс компании на агентов", solo: "Хочу разобраться сам" };
  const ROLES = ["Собственник", "Руководитель отдела", "Отвечаю за обучение"];

  async function start() {
    log.innerHTML = "";
    const role = L.role;
    Object.keys(L).forEach(k => delete L[k]);
    if (role) L.role = role;
    pending = null; busy = false; lock(false);
    $("#tgDemo").hidden = true;
    add("sys", "Прототип: чат идёт по готовому сценарию. Нейросеть подключим следующим шагом.");
    await ask("Здравствуйте. Отвечу на вопросы о программах и агентном управлении. За три минуты могу разобрать, какую работу отдать агентам первой и с какой программы начать. Или сразу опишите задачу.", [T.diag, T.learn, T.proc, T.solo], onTopic);
  }
  async function onTopic(t) {
    if (t === T.diag) return diag();
    L.topic = t;
    if (t === T.learn) return ask("Сколько человек будет учиться и из каких отделов?", ["До 15 человек", "От 16 до 25", "Больше 25"], onDetail);
    if (t === T.proc) return ask("Какой процесс болит сильнее всего? Например, путь от заявки клиента до отправленного КП.", ["Продажи и КП", "Закупки и тендеры", "Отчётность", "Другой процесс"], onDetail);
    if (t === T.solo) return ask("Для себя есть Погружение: один день в Москве, 5–8 человек, своя рабочая среда и агенты на ваших задачах. Какие задачи хотите отдать агентам?", ["Почта и документы", "Продажи", "Аналитика и отчёты", "Расскажу сам"], onDetail);
    L.topic = "Своя задача"; L.detail = t;
    return askRole();
  }
  async function onDetail(d) { L.detail = d; await askRole(); }
  async function askRole() {
    if (L.role) { await suggest(); return askChannel(); }
    await ask("В какой компании вы работаете и какая у вас роль? Можно коротко, например «производство, собственник».", ROLES, async r => { L.role = r; await suggest(); await askChannel(); });
  }
  async function suggest() {
    let s, txt;
    if (L.topic === T.proc || L.role === "Агенты уже есть") { L.format = "Агентное управление"; s = "harness"; txt = "Это задача для агентного управления: запускаем процесс за две недели, два месяца внедряем на живых данных, дальше поддерживаем. Если агенты у вас уже есть, начинаем с корпоративного контура."; }
    else if (L.topic === T.solo || L.role === "Для себя") { L.format = "Погружение"; s = "pogruzhenie"; txt = "Подойдёт Погружение: за один день своя рабочая среда и агенты на двух или трёх ваших задачах. 80 000 ₽ с участника."; }
    else if (L.role === "Собственник") { L.format = "Пилот"; s = "pilot"; txt = "Подойдёт Пилот: агенты отделов начинают работать на ваших данных, а вечером первого дня собственники выбирают процессы, ответственных и бюджет."; }
    else { L.format = "Агент"; s = "agent"; txt = "Подойдёт программа «Агент»: за день каждый отдел собирает агента на своей задаче и проверяет его на своих примерах." + (/16|25/.test(L.detail || "") ? " Для группы больше 15 человек стоимость выше на 20%." : ""); }
    const name = SUBNAME[s] || TITLES[s];
    const d = await say(`${esc(txt)}<div class="mlink"><button type="button" class="btn btn-outline btn-sm">${icon("arrow-right")}Открыть «${name}»</button></div>`, 900);
    $("button", d).addEventListener("click", () => { go(s); if (overlay()) closeChat(); });
  }

  /* экспресс-диагностика: пять вопросов и короткий разбор */
  async function diag() {
    L.topic = "Экспресс-диагностика";
    await ask("Пять коротких вопросов. Сколько человек в компании?", ["До 20", "От 20 до 100", "От 100 до 500", "Больше 500"], async size => {
      L.size = size;
      await ask("Какая работа съедает больше всего часов руками?", ["Заявки и КП", "Документы и договоры", "Отчёты и сводки", "Ответы клиентам", "Другое"], async work => {
        L.work = work;
        await ask("Сколько часов в неделю на это уходит у отдела?", ["До 10", "От 10 до 40", "Больше 40"], async hours => {
          L.hours = hours;
          await ask("Сотрудники уже работают с ИИ?", ["Нет", "Пробуют сами", "Есть свои агенты"], async ai => {
            L.ai = ai;
            if (L.role) return report();
            await ask("И последний: кто вы в компании?", ROLES, async r => { L.role = r; await report(); });
          });
        });
      });
    });
  }
  async function report() {
    const month = { "До 10": "до 40 часов в месяц", "От 10 до 40": "от 40 до 160 часов в месяц", "Больше 40": "больше 160 часов в месяц" }[L.hours];
    const tariff = { "До 20": "Старт", "От 20 до 100": "Стандарт", "От 100 до 500": "Бизнес", "Больше 500": "Анлимит" }[L.size];
    let s, why;
    if (L.ai === "Есть свои агенты") { s = "harness"; L.format = "Агентное управление с корпоративным контуром"; why = "агенты уже есть, их нужно собрать в одно место с версиями и взять на поддержку"; }
    else if (L.role === "Собственник" && L.hours !== "До 10") { s = "pilot"; L.format = "Пилот"; why = "часов много, а собственнику нужно выбрать процессы и бюджет на живых данных"; }
    else if (L.ai === "Нет" && L.hours === "До 10") { s = "navyk"; L.format = "Навык"; why = "команда начинает с нуля, первый навык даст понятный результат за четыре часа"; }
    else { s = "agent"; L.format = "Агент"; why = "за день каждый отдел соберёт агента на этой работе и проверит его на своих примерах"; }
    L.detail = `${L.work}, ${lc(L.hours)} ч в неделю, компания ${lc(L.size)} человек, ИИ: ${lc(L.ai)}`;
    const rows = [["Отдать агентам первым", L.work], ["Сейчас уходит руками", month], ["С чего начать", `${L.format}: ${why}`], ["Дальше", `агентное управление, ориентир по размеру компании: тариф «${tariff}»`]];
    const d = await say(`<b>Разбор</b><dl class="sum rep">${rows.map(r => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl><div class="mlink"><button type="button" class="btn btn-outline btn-sm">${icon("arrow-right")}Открыть «${SUBNAME[s] || TITLES[s]}»</button></div>`, 1100);
    $("button", d).addEventListener("click", () => { go(s); if (overlay()) closeChat(); });
    await ask("Передать этот разбор Александру?", ["Созвониться", "Переписка в Telegram", "Письмом на почту", "Пока не надо"], async c => {
      if (c === "Пока не надо") { await say("Хорошо. Разбор останется здесь, вернуться к нему можно в любой момент."); chips([{ label: "Начать заново", action: start }]); return; }
      await onChannel(c);
    });
  }

  async function askChannel() { await ask("Как удобнее продолжить?", ["Созвониться", "Переписка в Telegram", "Письмом на почту"], onChannel); }
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
    const rows = [["Задача", L.topic], ["Подробности", L.detail], ["Роль", L.role], ["Предложил", L.format], ["Связь", how()], ["Контакт", `${L.name}, ${L.contact}`]];
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
    const rows = [["Имя", L.name], ["Контакт", L.contact], ["Задача", L.topic], ["Подробности", L.detail], ["Роль", L.role], ["Предложил", L.format], ["Связь", how()], ["Откуда", L.source], ["Смотрел", [...seen].join(", ") || "только главную"]];
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
