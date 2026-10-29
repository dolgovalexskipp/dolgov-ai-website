#!/usr/bin/env python3
"""Сборка страниц сайта из index.html: у каждого раздела, программы и статьи свой адрес.

Главная (index.html) — источник. Скрипт кладёт рядом копии с открытым нужным разделом
и своими заголовком, описанием и адресом для поиска и превью в мессенджерах:
/komandam/, /komandam/pilot/, /pogruzhenie/, /stati/<статья>/ и т. д. Переходы между
ними на сайте идут без перезагрузки (assets/site/site.js), а без скриптов работают как
обычные страницы.

Запуск из корня репо после любой правки index.html:  python3 _tools/build_pages.py
Скрипт также обновляет sitemap.xml и переадресации со старых адресов."""
import html
import json
import pathlib
import re
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parents[1]
SITE = "https://dolgovalex.com"
BRAND = "Долгов, Эй Ай и партнеры"
TODAY = date.today().isoformat()

# путь: (раздел, экран, заголовок, описание); пустое описание берём из подзаголовка экрана
PAGES = {
    "/komandam/": ("komandam", "obzor", "Обучение команд работе с ИИ-агентами: программы и цены",
                   "Программы для команд и руководителей: Навык, Агент, Пилот, Система. Общая часть и практика на задачах вашей компании, от 120 000 ₽."),
    "/komandam/navyk/": ("komandam", "navyk", "Навык: 4 часа, первый навык ИИ-агента для команды", ""),
    "/komandam/agent/": ("komandam", "agent", "Агент: день обучения, ИИ-агент для каждого отдела", ""),
    "/komandam/pilot/": ("komandam", "pilot", "Пилот: ИИ-агенты на данных компании за полтора дня", ""),
    "/komandam/sistema/": ("komandam", "sistema", "Система: два дня для управленческой команды", ""),
    "/komandam/podgotovka/": ("komandam", "podgotovka", "Как компании подготовиться к обучению работе с ИИ-агентами",
                              "Что нужно от компании за три недели, две недели и накануне обучения: анкета, данные, рабочая среда, ключи к моделям."),
    "/pogruzhenie/": ("lichno", "pogruzhenie", "Погружение 28 ноября в Кибердоме: день работы с ИИ на своих задачах",
                      "Один день, после которого вы работаете с ИИ по-новому: своя рабочая среда, база знаний и агенты на ваших задачах. 28 ноября, Москва, до 10 человек."),
    "/konsultaciya/": ("lichno", "konsultaciya", "Консультация по ИИ-агентам один на один", ""),
    "/upravlenie-agentami/": ("harness", None, "Управление агентами: процессы компании на ИИ-агентах по подписке",
                              "Процессы компании один за другим переходят на ИИ-агентов: данные, правила, ответственные, отчёт раз в неделю. Тарифы от 120 000 ₽ в месяц."),
    "/metod/": ("metod", None, "Метод: как я учу работать с генеративным ИИ",
                "Учу работать с ИИ, как инструктор учит водить машину: сначала уверенно сами на своих задачах, потом вместе с командой. Шесть слоёв метода."),
    "/obo-mne/": ("bio", None, "Александр Долгов: основатель VEYRA, обучение работе с ИИ-агентами",
                  "Основатель VEYRA, голосовые ИИ-агенты для бизнеса. Учу команды и руководителей работать с ИИ-агентами, опыт преподавания с 2010 года."),
    "/stati/": ("stati", "spisok", "Статьи о работе с ИИ-агентами",
                "Короткие практические тексты: как копить контекст, писать правила для агентов и встраивать ИИ в ежедневную работу."),
}
# старые адреса сайта ведут на новые
REDIRECTS = {"obuchenie": ("/komandam/", "Программы для команд"), "soprovozhdenie": ("/upravlenie-agentami/", "Управление агентами"),
             "mastermind": ("/pogruzhenie/", "Погружение"), "konsultacii": ("/konsultaciya/", "Консультация"),
             "manifest": ("/metod/", "Метод"), "about": ("/obo-mne/", "Обо мне")}


def text(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def view_block(src: str, view: str):
    a = src.index(f'data-view="{view}"')
    a = src.rindex("<section", 0, a)
    b = src.index("\n      </section>", a) + len("\n      </section>")
    return a, b


def sub_block(block: str, sub: str) -> str:
    a = block.index(f'<div class="sub" data-sub="{sub}"')
    nxt = [i for i in (block.find('<div class="sub" data-sub="', a + 10), block.find('<p class="pane-end">', a)) if i > 0]
    return block[a:min(nxt)]


def describe(src: str, view: str, sub):
    a, b = view_block(src, view)
    part = sub_block(src[a:b], sub) if sub else src[a:b]
    m = re.search(r'<p class="lead-s">(.*?)</p>', part, re.S)
    d = text(m.group(1)) if m else ""
    return d if len(d) <= 160 else d[:157].rsplit(" ", 1)[0] + "…"


def article_pages(src: str):
    """Статьи: экраны раздела «Статьи» с data-t (заголовок) и data-d (описание)."""
    out = {}
    a, b = view_block(src, "stati")
    for m in re.finditer(r'<div class="sub" data-sub="([a-z0-9-]+)"[^>]*data-t="([^"]*)"[^>]*data-d="([^"]*)"', src[a:b]):
        slug, t, d = m.groups()
        out[f"/stati/{slug}/"] = ("stati", slug, html.unescape(t), html.unescape(d))
    return out


def set_meta(page: str, path: str, title: str, desc: str) -> str:
    url = SITE + path
    t, d = html.escape(title, quote=True), html.escape(desc, quote=True)
    page = re.sub(r"<title>.*?</title>", f"<title>{html.escape(title)}</title>", page, count=1, flags=re.S)
    page = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{d}">', page, count=1)
    page = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', page, count=1)
    page = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">', page, count=1)
    page = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{t}">', page, count=1)
    page = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{d}">', page, count=1)
    return page


def keep_event_only_where_relevant(page: str, path: str) -> str:
    """Разметку мероприятия оставляем на главной и на странице Погружения."""
    m = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', page, re.S)
    if not m or path in ("/", "/pogruzhenie/"):
        return page
    data = json.loads(m.group(2))
    data["@graph"] = [g for g in data["@graph"] if g.get("@type") != "Event"]
    return page[:m.start(2)] + "\n" + json.dumps(data, ensure_ascii=False, indent=1) + "\n" + page[m.end(2):]


def open_section(page: str, view: str, sub) -> str:
    """Статичная разметка с открытым разделом: так её видят поиск и браузер без скриптов."""
    page = page.replace('<section class="ap-view" data-view="home" aria-label="Главная">', '<section class="ap-view" data-view="home" aria-label="Главная" hidden>', 1)
    a, b = view_block(page, view)
    block = re.sub(r'(<section class="ap-view ap-win" data-view="%s" aria-label="[^"]*") hidden>' % view, r"\1>", page[a:b], count=1)
    if sub:
        block = re.sub(r'<div class="sub" data-sub="([a-z0-9-]+)"( hidden)?', lambda m: f'<div class="sub" data-sub="{m.group(1)}"' + ("" if m.group(1) == sub else " hidden"), block)
        block = re.sub(r'<button type="button" data-sub="%s"' % re.escape(sub), f'<button type="button" class="on" data-sub="{sub}"', block, count=1)
    page = page[:a] + block + page[b:]
    page = re.sub(r'(<a href="[^"]*" data-s="%s")' % view, r'\1 aria-current="page"', page)
    return page


def main():
    idx = ROOT / "index.html"
    src = idx.read_text()
    pages = {p: (v, s, t, d or describe(src, v, s)) for p, (v, s, t, d) in PAGES.items()}
    pages.update(article_pages(src))
    meta = {"/": {"t": re.search(r"<title>(.*?)</title>", src, re.S).group(1), "d": re.search(r'<meta name="description" content="([^"]*)">', src).group(1)}}
    for path, (_, _, t, d) in pages.items():
        meta[path] = {"t": f"{t} · {BRAND}", "d": d}
    routes = '<script id="routes" type="application/json">' + json.dumps(meta, ensure_ascii=False) + "</script>"
    src = re.sub(r'<script id="routes" type="application/json">.*?</script>\n?', "", src, flags=re.S)
    src = src.replace("</head>", routes + "\n</head>", 1)
    idx.write_text(src)

    for path, (view, sub, t, d) in pages.items():
        page = set_meta(src, path, f"{t} · {BRAND}", d)
        page = keep_event_only_where_relevant(page, path)
        page = open_section(page, view, sub)
        out = ROOT / path.strip("/") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page)

    for old, (new, name) in REDIRECTS.items():
        (ROOT / old / "index.html").write_text(redirect_page(new, name))
    if any(path.startswith("/stati/") and path != "/stati/" for path in pages):
        (ROOT / "tips" / "index.html").write_text(tips_redirect(src))

    urls = ["/"] + list(pages)
    prio = lambda u: "1.0" if u == "/" else ("0.9" if u in ("/pogruzhenie/", "/komandam/") else ("0.6" if u.startswith("/stati/") else "0.8"))  # noqa: E731
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                      + "".join(f"  <url><loc>{SITE}{u}</loc><lastmod>{TODAY}</lastmod><priority>{prio(u)}</priority></url>\n" for u in urls)
                                      + f"  <url><loc>{SITE}/partners/</loc><priority>0.3</priority></url>\n</urlset>\n")
    print(f"страниц: {len(pages)}, переадресаций: {len(REDIRECTS) + 1}")


def redirect_page(new: str, name: str) -> str:
    return f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} · {BRAND}</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="{SITE}{new}">
<meta http-equiv="refresh" content="0; url={new}">
<script>location.replace("{new}" + location.hash);</script>
</head>
<body>
<p>Раздел переехал: <a href="{new}">{name} на dolgovalex.com</a></p>
</body>
</html>
'''


def tips_redirect(src: str) -> str:
    """Старая страница статей: ведёт на /stati/, а старые якоря статей на их новые адреса."""
    olds = dict(re.findall(r'<div class="sub" data-sub="([a-z0-9-]+)"[^>]*data-old="([a-z0-9-]+)"', src))
    m = json.dumps({v: k for k, v in olds.items()}, ensure_ascii=False)
    return f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Статьи · {BRAND}</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="{SITE}/stati/">
<script>(function () {{ var m = {m}; var h = location.hash.slice(1); location.replace(m[h] ? "/stati/" + m[h] + "/" : "/stati/"); }})();</script>
<noscript><meta http-equiv="refresh" content="0; url=/stati/"></noscript>
</head>
<body>
<p>Статьи переехали: <a href="/stati/">dolgovalex.com/stati/</a></p>
</body>
</html>
'''


if __name__ == "__main__":
    main()
