# ТЗ на иллюстрации — dolgovalex.com

> Обновлено 2026-04-21. Концепт 3 (комикс-векторный ретро-футуризм), адаптированный под бренд.
> Старая версия (soft rounded) — в git history.

---

## Стиль

**Основа — концепт 3:** плоская векторная геометрия + комикс-эстетика + ретро-футуризм 70-80х.

**Приёмы:**
- Плоские геометрические формы: круги, треугольники, прямоугольники, минимум деталей
- Толстые контуры (2-3px) или без контура — консистентно по всем 5 иллюстрациям
- Flat colors: без градиентов, без теней
- Halftone texture (пунктир/точки) — только как акцент, не везде
- Комикс-элементы: speech bubbles, стрелки, звуковые слова
- Ретро-постер: горизонтальные линии, симметричные композиции, геометрическая сетка

**НЕ использовать:**
- Роботов, мозги, чипы, матрицу, neon glow
- Розовый, голубой, жёлто-лайм (это из PDF-примеров, не наш бренд)
- Градиенты, тени, фотореализм
- Японские иероглифы / катакану (даже если стиль от них)

## Палитра

| Роль | HEX | CSS var | Использование |
|---|---|---|---|
| Бумага | `#f6f0e6` | `--paper` | Фон иллюстрации |
| Тёмно-зелёный | `#173a28` | `--green-900` | Primary фигуры, контур |
| Зелёный | `#3a754d` | `--green-700` | Вторичные фигуры, акценты |
| Серо-коричневый | `#67635d` | `--muted` | Текст, тонкие линии |
| **Кирпичный (акцент)** | `#b85a3a` | `--brick` | Комикс-слова, ключевые акценты, 1-2 элемента на иллюстрацию |

**Правило акцента:** кирпичный — это «восклицание». Не красьте им всё подряд. На одной иллюстрации ~10-15% площади максимум.

## Комикс-слова (AI thinking words)

Вдохновлено тем, что выдают AI-модели, когда думают. Ставятся в speech bubbles или как «sound effects» в комиксах.

**Приоритет — английский** (лучше ложится на «AI думает»):
- `CRYSTALLIZING…`
- `CARAMELISING…`
- `PERCOLATING…`
- `SIMMERING…`
- `UNTANGLING…`
- `WEAVING…`
- `DISTILLING…`
- `COMPOSTING…`
- `STEEPING…`
- `SHIPPING!`
- `SHIPPED.`

**Русские варианты** (опционально, если английский перегрузит):
- `СОБИРАЮ…`, `СВЯЗЫВАЮ…`, `ВЫРАЩИВАЮ…`, `БАМ!`, `ГОТОВО.`

Одно слово на иллюстрацию. Форма речевого облака или «explosion burst» (комикс-звезда).

## Технические требования

- **Формат:** SVG (для web) + PNG @2x fallback (1080w min)
- **Размер:** адаптивный. Hero ~480x440, scenarios ~360x300, faq вертикальный ~280x360
- **Контраст:** AA+ на `#f6f0e6` фоне
- **Файлы:** `/assets/illus/<slot>.svg` + `/assets/illus/<slot>@2x.png`
- **Консистентность:** все 5 иллюстраций — один стиль, одна толщина линий, одна палитра. Critical.

---

## 5 слотов

### Slot 1 — Hero

- **Где:** `index.html:698` (`.illus-hero-art`), replaces текущую SVG-орбиту
- **Секция:** «AI уже есть у всех. Система — у единиц»
- **Размер:** ~480×440, квадратный вариант тоже ок
- **Метафора:** дирижёр / оркестратор. Один человек в центре собирает вокруг себя команду AI-агентов
- **Композиция:** центральная фигура (упрощённая, геометрическая — круг-голова, треугольник-тело), вокруг неё — 4-6 разных геометрических форм («агенты»: квадраты, круги, треугольники, с лицами-глазами). Между ними — тонкие линии связи. Над центральной фигурой — speech bubble
- **Комикс-слово:** `CRYSTALLIZING…` или `SIMMERING…`
- **Ключевые акценты:** один из агентов — кирпичного цвета (как «активный сейчас»)

**Prompt (Recraft / Nanobanana):**
```
Flat geometric vector illustration, 1970s retro poster aesthetic, modernist minimalism.
One central figure (stylized, simple geometric shapes: circle head, triangle torso)
conducting a team of 5 abstract geometric agents around them (small triangles, circles,
squares, each with simple eyes). Thin connecting lines between figures.
Speech bubble above center figure saying "CRYSTALLIZING..." in all caps, bold sans-serif.
Warm beige paper background #f6f0e6.
Palette: dark green #173a28, medium green #3a754d, muted brown-gray #67635d,
one accent figure in warm brick #b85a3a.
Thick black outlines (2-3px). No gradients, no shadows, flat colors only.
Subtle halftone dot texture on one background element. Comic book style.
Balanced symmetric composition, centered.
```

### Slot 2 — Сценарий 1: Агент-секретарь (Sales / CRM)

- **Где:** `index.html:832` (`.sr-slot` в первом сценарии)
- **Секция:** «Агент-секретарь после встреч» (задачи команде, следующие шаги клиентам, фиксация в трекер)
- **Размер:** ~360×300
- **Метафора:** после разговора → автоматически задачи и действия
- **Композиция:** слева — стилизованная ретро-трубка или микрофон (символ разговора), от неё волны → справа список задач с галочками (ретро-стиль, чек-боксы толстые квадраты). Стрелка или линия между ними
- **Комикс-слово:** `PERCOLATING…` в speech bubble рядом с трубкой
- **Ключевой акцент:** кирпичная галочка на последнем пункте (== готово)

**Prompt:**
```
Flat geometric vector illustration, retro 70s poster style.
Left: stylized vintage phone handset or microphone in dark green #173a28.
Sound waves in medium green #3a754d emanating from it.
Right: vertical checklist with 3-4 items, thick square checkboxes.
Last checkbox checked with a warm brick #b85a3a checkmark.
Small speech bubble near the handset with "PERCOLATING..." in bold caps.
Warm beige paper background #f6f0e6.
Thick black outlines 2-3px, flat colors, no shadows, no gradients.
Halftone dots as subtle texture. Comic book meets modernist poster.
```

### Slot 3 — Сценарий 2: КП за 30 секунд

- **Где:** `index.html:898` (`.sr-slot` во втором сценарии)
- **Секция:** «Коммерческое под клиента за 30 секунд»
- **Размер:** ~360×300
- **Метафора:** три разрозненных куска → один документ
- **Композиция:** слева — 3 хаотичные фигуры (квадрат с линиями-текста, круг-логотип, треугольник-цена), стрелка вправо → справа — собранный лист КП с аккуратной структурой
- **Комикс-слово:** `CARAMELISING…` над процессом сборки
- **Ключевой акцент:** кирпичная молния или искра в месте «превращения»

**Prompt:**
```
Flat geometric vector illustration, retro modernist poster style.
Left side: three chaotic shapes — a dark green #173a28 square with horizontal lines
(representing text), a medium green #3a754d circle (logo), a muted #67635d triangle
(price tag). They are scattered, loose.
Center: warm brick #b85a3a lightning bolt or starburst.
Right side: a neatly organized document/paper with clean lines and structure, dark green.
Speech bubble above center saying "CARAMELISING..." in bold caps.
Warm beige paper background #f6f0e6.
Thick outlines 2-3px, flat colors, no shadows, no gradients.
Subtle halftone on one element. Comic book meets Swiss design.
```

### Slot 4 — Сценарий 3: Non-tech founder → dev

- **Где:** `index.html:965` (`.sr-slot` в третьем сценарии)
- **Секция:** «Non-tech фаундер ведёт разработку без CTO»
- **Размер:** ~360×300
- **Метафора:** тикет → команда агентов → билд
- **Композиция:** сверху — прямоугольник «Linear ticket» (с заголовком и строчками-текстом), стрелка вниз, в центре — 3 геометрические фигуры (архитектор, dev, reviewer — все разные формы с глазами), стрелка вниз, внизу — «deploy» символ (ракетка / version tag / коробка с галочкой)
- **Комикс-слово:** `SHIPPING!` или `SHIPPED.`
- **Ключевой акцент:** кирпичный rocket или кирпичная подпись SHIPPED

**Prompt:**
```
Flat geometric vector illustration, retro comic book + Swiss design.
Vertical composition: top — rectangular "ticket" card with lines of text and checkboxes.
Arrow down. Middle — 3 different geometric agent figures (triangle, circle, square)
with simple eyes, small, collaborating. Arrow down. Bottom — warm brick #b85a3a
rocket or "SHIPPED" tag in a starburst.
Comic-style explosion burst with "SHIPPING!" in bold caps near the bottom.
Warm beige paper #f6f0e6, dark green #173a28, medium green #3a754d, muted #67635d.
Brick #b85a3a only on the rocket/tag.
Thick outlines 2-3px, flat, no gradients, no shadows. Subtle halftone texture.
```

### Slot 5 — FAQ

- **Где:** `index.html:1333` (`.faq-door`), replaces текущую door SVG
- **Секция:** FAQ блок
- **Размер:** ~280×360, вертикальный
- **Метафора:** открытая дверь → приглашение внутрь системы
- **Композиция:** стилизованная ретро-дверь, приоткрыта, из неё — свет (лучи плоскими треугольниками), вокруг — вопросительные знаки и маленькие геометрические фигуры
- **Комикс-слово:** `UNSPOOLING…` или `STEEPING…` в speech bubble сбоку
- **Ключевой акцент:** кирпичная дверная ручка

**Prompt:**
```
Flat geometric vector illustration, vertical format, retro 70s poster.
Partially open door in dark green #173a28 with medium green #3a754d frame.
Warm brick #b85a3a door handle.
Light rays (flat triangles in medium green) streaming out from opening.
Small geometric question marks and shapes floating around the door
in muted #67635d and dark green.
Speech bubble on the side with "UNSPOOLING..." in bold caps.
Warm beige paper background #f6f0e6.
Thick outlines 2-3px, flat colors, no gradients, no shadows.
Symmetric, inviting, warm. Comic book meets modernist poster.
```

---

## Порядок генерации

1. **Сначала Slot 1 (Hero)** — 3-5 вариаций, выбираем финал. Это наш style anchor.
2. В Recraft: сохраняем выбранный вариант как **Style Reference** (или тренируем свой стиль на нём)
3. **Slots 2-5** — генерируем с этим Style Reference, получаем консистентность
4. После approval всех 5 — экспорт SVG + @2x PNG, в `/assets/illus/`

## Output naming

```
/assets/illus/hero.svg
/assets/illus/hero@2x.png
/assets/illus/scenario-secretary.svg
/assets/illus/scenario-secretary@2x.png
/assets/illus/scenario-commercial.svg
/assets/illus/scenario-commercial@2x.png
/assets/illus/scenario-dev.svg
/assets/illus/scenario-dev@2x.png
/assets/illus/faq-door.svg
/assets/illus/faq-door@2x.png
```

## Что делать, если нейронка промахивается

**Типичные проблемы:**
- Рисует шейды / градиенты → добавь `strictly flat colors, absolutely no shading or gradients`
- Слишком много деталей → `minimalism, under 10 distinct shapes total`
- Ломает палитру → перечисли hex-коды с `ONLY use these exact colors`
- Контур тонкий / отсутствует → `bold 3px black outline on every shape`
- Хочет реалистичные лица → `stylized simple faces, just two dots for eyes and a small line for mouth`

## Acceptance criteria (для финального approval)

- [ ] Один стиль между всеми 5 иллюстрациями (контур, палитра, вес линий)
- [ ] На каждой — ровно один кирпичный акцент
- [ ] На каждой — одно AI-word в комикс-облаке
- [ ] SVG чистые (editable paths, не конвертированный растр)
- [ ] Читаются на мобильном 320px width
- [ ] Соответствуют бренду сайта (paper background, не выделяются как чужеродное)
