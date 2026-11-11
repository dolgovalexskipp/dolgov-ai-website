# dolgov-ai-website
Create and publish dolgov.ai website

## Главная и страницы разделов

Сайт — одна страница-приложение (`index.html`, `assets/site/site.css`, `assets/site/site.js`) с окнами разделов.
У каждого раздела, программы и статьи свой адрес (`/komandam/pilot/`, `/pogruzhenie/`, `/stati/<статья>/`):
это копии `index.html` с открытым разделом и своими заголовком и описанием для поиска. После любой правки
`index.html` пересобрать их, обновится и `sitemap.xml`:

    python3 _tools/build_pages.py

Анонсы двух разных событий находятся на `/vibecoding/` (совместно с Hakku) и `/pogruzhenie/` (офлайн-встреча в декабре). Пока даты и условия не утверждены,
не добавлять разметку Event и сценарий записи на конкретный день. Карточка спикера для клиентов — `/spiker/`.
