# dolgov-ai-website
Create and publish dolgov.ai website

## Главная и страницы разделов

Сайт — одна страница-приложение (`index.html`, `assets/site/site.css`, `assets/site/site.js`) с окнами разделов.
У каждого раздела, программы и статьи свой адрес (`/komandam/pilot/`, `/pogruzhenie/`, `/stati/<статья>/`):
это копии `index.html` с открытым разделом и своими заголовком и описанием для поиска. После любой правки
`index.html` пересобрать их, обновится и `sitemap.xml`:

    python3 _tools/build_pages.py

Число свободных мест на Погружении обновляется руками: плитка на главной, страница Погружения, разметка Event
в шапке `index.html` и база чата (vault, `06_assistant/assistant_kb_core_v1.md`, раздел 11).
