#!/usr/bin/env python3
"""Шапка и подвал сайта в одном месте.

Страницы — обычный статический HTML. Общие куски стоят между метками
<!-- chrome:head --> … <!-- /chrome:head --> и <!-- chrome:foot --> … <!-- /chrome:foot -->.
Скрипт переписывает их во всех страницах из PAGES, отмечая текущий раздел.
Запуск из корня репо: python3 _tools/sync_chrome.py
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BOT = "https://t.me/dolgovalex_welcome_bot"
EMAIL = "bonjour@dolgovalex.com"
ICONS = "/assets/ds/icons.svg"

# путь файла → (ключ раздела для меню, метка источника для бота)
PAGES = {
    "index.html": ("home", "site_home"),
    "obuchenie/index.html": ("obuchenie", "site_obuchenie"),
    "soprovozhdenie/index.html": ("soprovozhdenie", "site_soprovozhdenie"),
    "konsultacii/index.html": ("konsultacii", "site_konsultacii"),
    "mastermind/index.html": ("mastermind", "site_mastermind"),
}
NAV = [
    ("obuchenie", "/obuchenie/", "Обучение", "graduation-cap"),
    ("soprovozhdenie", "/soprovozhdenie/", "Сопровождение", "workflow"),
    ("konsultacii", "/konsultacii/", "Консультации", "message-square"),
    ("mastermind", "/mastermind/", "Мастермайнд", "users"),
    ("about", "/about/", "Обо мне", "user"),
]


def icon(name, cls="i"):
    return f'<svg class="{cls}" aria-hidden="true"><use href="{ICONS}#{name}"/></svg>'


def head(cur, src):
    links = "".join(
        f'<a href="{href}"{" aria-current=\"page\"" if key == cur else ""}>{label}</a>' for key, href, label, _ in NAV)
    panel = "".join(
        f'<a href="{href}"{" aria-current=\"page\"" if key == cur else ""}>{icon(ic)}{label}</a>' for key, href, label, ic in NAV)
    return f'''<header class="site-head">
  <div class="wrap in">
    <a class="brand" href="/" aria-label="Долгов, Эй Ай и партнеры, на главную"><b>Долгов,</b><small>Эй Ай и партнеры<sup>©</sup></small></a>
    <nav class="nav" aria-label="Разделы сайта">{links}</nav>
    <div class="head-cta">
      <a class="cmd" href="{BOT}?start={src}" target="_blank" rel="noopener">{icon("message-square")}<span>Опишите задачу</span><span class="kbd">Telegram</span></a>
      <a class="btn btn-primary" href="{BOT}?start={src}" target="_blank" rel="noopener">Обсудить задачу</a>
      <button class="btn btn-ghost btn-icon menu-btn" type="button" aria-label="Меню" aria-expanded="false">{icon("menu")}</button>
    </div>
  </div>
  <div class="wrap head-panel">{panel}<a class="btn btn-primary btn-lg" href="{BOT}?start={src}" target="_blank" rel="noopener">Обсудить задачу</a></div>
</header>'''


def foot(cur, src):
    prod = "".join(f'<a href="{href}">{label}</a>' for key, href, label, _ in NAV if key != "about")
    return f'''<footer class="site-foot">
  <div class="wrap cols">
    <div><a class="brand" href="/"><b>Долгов,</b><small>Эй Ай и партнеры<sup>©</sup></small></a><p>Обучаю команды работать с ИИ-агентами и ставлю контур, в котором они продолжают работать. Александр Долгов.</p></div>
    <div><p class="label">Продукты</p><nav aria-label="Продукты">{prod}</nav></div>
    <div><p class="label">Ещё</p><nav aria-label="Ещё"><a href="/about/">Обо мне</a><a href="/manifest/">Манифест</a><a href="/tips/">Хаки и типсы</a></nav></div>
    <div><p class="label">Связь</p><nav aria-label="Связь"><a href="{BOT}?start={src}" target="_blank" rel="noopener">Telegram</a><a href="mailto:{EMAIL}">{EMAIL}</a></nav></div>
  </div>
  <div class="wrap"><div class="legal"><span>ИП Долгов Александр <span class="todo" title="Реквизиты — после регистрации ИП">[отчество] · ИНН · ОГРНИП</span> · цены итоговые, НДС не облагается</span><span><span class="todo" title="Страница политики ещё не сделана">Политика обработки персональных данных</span> · © 2026 Долгов, Эй Ай и партнеры</span></div></div>
</footer>'''


def sync(path, cur, src):
    p = ROOT / path
    s = p.read_text(encoding="utf-8")
    for mark, html in (("head", head(cur, src)), ("foot", foot(cur, src))):
        pat = re.compile(rf"<!-- chrome:{mark} -->.*?<!-- /chrome:{mark} -->", re.S)
        if not pat.search(s):
            sys.exit(f"{path}: нет меток chrome:{mark}")
        s = pat.sub(f"<!-- chrome:{mark} -->\n{html}\n<!-- /chrome:{mark} -->", s)
    p.write_text(s, encoding="utf-8")
    print("ok", path)


if __name__ == "__main__":
    for path, (cur, src) in PAGES.items():
        if (ROOT / path).exists():
            sync(path, cur, src)
