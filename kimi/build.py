#!/usr/bin/env python3
"""Build the self-contained Kimi lesson from its reviewed slide source."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
SLIDES = json.loads((ROOT / 'slides.json').read_text())
E = lambda x: html.escape(str(x), quote=True)


def inline(value):
    text = E(value)
    text = re.sub(r'\[([^\]]+)\]\((https://[^\s)]+)\)', r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>', text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    return text


def paragraphs(value):
    return ''.join('<p>' + inline(p).replace('\n', '<br>') + '</p>' for p in str(value).split('\n\n') if p.strip())


def notes(value):
    parts, code, buf = [], False, []
    for line in value.splitlines():
        if line.startswith(('```', '~~~')):
            if code:
                parts.append('<pre><code>' + E('\n'.join(buf)) + '</code></pre>')
            else:
                parts.append(paragraphs('\n'.join(buf)))
            code, buf = not code, []
        else:
            buf.append(line)
    if buf:
        parts.append('<pre><code>' + E('\n'.join(buf)) + '</code></pre>' if code else paragraphs('\n'.join(buf)))
    return ''.join(parts)


def content(d):
    kind = d['type']
    if kind in ('columns', 'flow'):
        cells = ''.join('<div class="unit"><h2>' + inline(a['heading']) + '</h2>' + paragraphs(a['body']) + '</div>' for a in d['items'])
        return '<div class="' + kind + ' cols-' + str(len(d['items'])) + '">' + cells + '</div>'
    if kind == 'metrics':
        return '<div class="metrics cols-' + str(len(d['items'])) + '">' + ''.join('<div><div class="value">' + E(a['value']) + '</div><h2>' + inline(a['heading']) + '</h2>' + paragraphs(a['body']) + '</div>' for a in d['items']) + '</div>'
    if kind == 'table':
        rows = d['rows']
        head = '<thead><tr>' + ''.join('<th scope="col">' + inline(c) + '</th>' for c in rows[0]) + '</tr></thead>'
        body = '<tbody>' + ''.join('<tr>' + ''.join('<td>' + inline(c).replace('\n', '<br>') + '</td>' for c in r) + '</tr>' for r in rows[1:]) + '</tbody>'
        return '<div><div class="table-scroll" tabindex="0" aria-label="Таблица, можно прокручивать"><table>' + head + body + '</table></div><p class="table-hint">Таблицу можно листать вправо →</p></div>'
    if kind == 'formula':
        formula = '<div class="formula" tabindex="0">' + E(d['formula']) + '</div>'
        return formula + (content({**d, 'type': 'columns'}) if d.get('items') else paragraphs(d.get('text', '')))
    if kind == 'code':
        block = '<div class="code-wrap"><button class="copy" type="button">Копировать</button><pre><code>' + E(d['code']) + '</code></pre></div>'
        return '<div class="code-split">' + block + '<div class="code-side">' + paragraphs(d['side']) + '</div></div>' if d.get('side') else block
    if kind == 'image':
        image = '<figure><a href="kimi-linear-architecture.png" target="_blank" rel="noopener"><img src="kimi-linear-architecture.png" alt="' + E(d.get('alt', d['title'])) + '"></a><figcaption><a href="kimi-linear-architecture.png" target="_blank" rel="noopener">Открыть схему в полном размере</a></figcaption></figure>'
        return '<div class="image-split">' + image + '<div>' + paragraphs(d.get('side', '')) + '</div></div>'
    if kind == 'moe':
        return '''<div class="moe-diagram" aria-label="Router выбирает 16 из 896 экспертов. Два общих эксперта работают всегда. Выходы объединяются.">
        <div class="moe-input">Вектор текущего токена</div>
        <div class="moe-branches"><div><h2>Router</h2><p>16 из 896 routed experts</p><div class="expert-strip"><span>e₁</span><span>e₂</span><span>…</span><span>e₁₆</span></div></div><div><h2>Общие эксперты</h2><p>2 shared experts для каждого токена</p><div class="expert-strip"><span>s₁</span><span>s₂</span></div></div></div>
        <div class="moe-output">Взвешенная сумма выходов</div></div>'''
    if kind == 'section':
        return paragraphs(d.get('text', ''))
    return ('<p class="big-lead">' + inline(d['lead']) + '</p>' if d.get('lead') else '') + '<div class="prose">' + paragraphs(d.get('text', '')) + '</div>'


css = r'''
*{box-sizing:border-box}html,body{margin:0;height:100%;font-family:var(--sans);color:var(--primary);background:var(--page)}button,a{touch-action:manipulation}button{font:inherit;cursor:pointer}a{color:var(--accent);text-underline-offset:4px}button:focus-visible,a:focus-visible,[tabindex]:focus-visible{outline:3px solid var(--accent);outline-offset:3px}button:disabled{opacity:.32;cursor:default}button{border:1px solid var(--border);background:var(--card);color:var(--primary);border-radius:999px;padding:10px 16px;min-height:44px}button:hover{background:var(--card-2)}
.top{height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 3vw;font-size:12px;font-weight:650;gap:16px}.brand{text-decoration:none;color:var(--primary)}.brand span{color:var(--accent);font-weight:500;margin-left:8px}.edition{color:var(--muted)}.shell{height:calc(100dvh - 124px);padding:0 2vw}.slide{display:none;height:100%;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#a1b7ab transparent;background:var(--card);border:1px solid var(--border);border-radius:20px;padding:clamp(24px,3.5vw,56px);flex-direction:column;position:relative}.slide.active{display:flex}.kicker{font-family:var(--mono);font-size:clamp(11px,.88vw,13px);color:var(--accent);font-weight:550;letter-spacing:.08em;margin-bottom:16px}.slide h1{font-size:clamp(30px,3.45vw,55px);line-height:1.08;letter-spacing:-.035em;font-weight:650;margin:0;max-width:30ch;text-wrap:balance}.subtitle{font-size:clamp(16px,1.45vw,23px);line-height:1.4;color:var(--muted);max-width:84ch;margin:18px 0 0}.body{flex:1;min-height:min-content;display:flex;flex-direction:column;justify-content:center;padding:clamp(28px,3vw,46px) 0;gap:24px}.body p{font-size:clamp(17px,1.55vw,24px);line-height:1.5;margin:0 0 18px;white-space:normal;overflow-wrap:break-word}.body p:last-child{margin-bottom:0}.body h2{font-size:clamp(22px,2vw,30px);font-weight:600;line-height:1.2;letter-spacing:-.015em;margin:0 0 18px;color:var(--accent)}.columns,.flow,.metrics{display:grid;gap:clamp(24px,4vw,64px)}.cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}.unit{min-width:0}.flow .unit{position:relative;padding-top:24px;border-top:1px solid var(--accent-line)}.flow .unit:not(:last-child):after{content:'→';position:absolute;top:-16px;right:-42px;color:var(--accent);font-size:26px;background:var(--card);padding:0 8px}.metrics .value{font-size:clamp(48px,6vw,92px);line-height:1.05;letter-spacing:-.06em;font-weight:600;color:var(--accent);margin-bottom:24px}.metrics h2{color:var(--primary);font-size:clamp(22px,1.9vw,28px)}.metrics p{color:var(--muted)}.formula{font-family:var(--mono);font-size:clamp(20px,2.2vw,34px);font-weight:500;line-height:1.5;overflow-x:auto;padding:16px 0 30px;color:var(--accent);white-space:pre-wrap;overflow-wrap:anywhere}.big-lead{font-size:clamp(24px,2.5vw,38px)!important;max-width:45ch;font-weight:550;letter-spacing:-.02em;color:var(--accent)}.prose{max-width:75ch}.table-scroll{overflow-x:auto;width:100%}.table-hint{display:none}table{border-collapse:collapse;table-layout:auto;width:100%;font-size:clamp(16px,1.4vw,22px);line-height:1.4}th,td{text-align:left;padding:18px 18px;border-bottom:1px solid var(--border);vertical-align:top}th{font-weight:600;color:var(--accent);background:var(--card-2)}td:first-child{font-weight:550}td{overflow-wrap:anywhere}.code-wrap{position:relative;min-width:0;background:#f5f7f6;border:1px solid #e3e9e5;border-radius:12px;overflow:hidden}.code-wrap pre{margin:0;padding:50px 26px 26px;overflow-x:auto;font-family:var(--mono);font-size:clamp(13px,1.18vw,19px);line-height:1.55;tab-size:2;white-space:pre}.code-wrap code{font:inherit}.copy{position:absolute;right:12px;top:8px;min-height:32px;font-size:12px;padding:5px 12px;background:var(--card)}.code-split{display:grid;grid-template-columns:minmax(0,2.3fr) minmax(200px,1fr);gap:32px;align-items:center}.code-side p{font-size:clamp(16px,1.3vw,21px)}.image-split{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:48px;align-items:center}.image-split figure{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}.image-split figcaption{font-size:13px}.image-split img{display:block;max-width:100%;width:auto;max-height:52vh;object-fit:contain}.takeaway{margin-top:auto;font-weight:550;font-size:clamp(16px,1.35vw,21px);line-height:1.4;color:var(--accent);max-width:82ch;padding-top:22px;border-top:1px solid var(--accent-line)}.slide-foot{display:flex;justify-content:space-between;gap:20px;font-size:11px;color:var(--faint);margin-top:22px;font-family:var(--mono)}
.cover{justify-content:center}.cover .kicker{margin-bottom:50px}.cover h1{max-width:15ch;font-size:clamp(44px,6.2vw,94px);line-height:1.02}.cover .subtitle{max-width:42ch;font-size:clamp(21px,2vw,30px);margin-top:30px}.cover .body{flex:0;padding:40px 0 0}.cover .cover-stamp{font-family:var(--mono);font-size:15px;color:var(--accent);margin-top:36px}.cover .slide-foot{position:absolute;bottom:34px;right:3vw;left:3vw}.moe-diagram{max-width:950px;margin:0 auto;width:100%;text-align:center}.moe-input,.moe-output{font-size:24px;font-weight:550;padding:20px;background:var(--accent-tint);border:1px solid var(--accent-line);max-width:460px;margin:auto}.moe-branches{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:70px;padding:50px 0}.moe-branches>div{border-top:1px solid var(--accent-line);border-bottom:1px solid var(--accent-line);padding:22px 0}.expert-strip{display:flex;gap:12px;justify-content:center;margin-top:24px}.expert-strip span{padding:12px 17px;border:1px solid var(--accent-line);font-family:var(--mono)}
.controls{height:70px;display:flex;justify-content:center;align-items:center;gap:12px;padding:0 16px}.counter{min-width:72px;text-align:center;font-size:13px;color:var(--muted);font-family:var(--mono)}.controls .text-btn{font-size:13px}.controls .icon-btn{font-size:20px;padding:5px 17px}.progress{position:fixed;bottom:0;left:0;height:3px;background:var(--accent);width:0;transition:width .15s ease}.scroll-hint{position:fixed;bottom:77px;right:4vw;font-size:12px;background:var(--card);border:1px solid var(--border);padding:5px 10px;border-radius:999px;color:var(--muted);pointer-events:none}.scroll-hint[hidden]{display:none}
.notes-panel{position:fixed;top:54px;bottom:70px;right:2vw;width:min(660px,94vw);background:var(--card);border:1px solid var(--border);border-radius:18px;z-index:5;box-shadow:0 18px 70px #0002;display:flex;flex-direction:column}.notes-panel[hidden]{display:none}.panel-head{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:16px 24px;border-bottom:1px solid var(--border)}.panel-head h2{margin:0;font-size:18px;font-weight:550}.notes-content{padding:24px;overflow:auto;font-size:16px;line-height:1.65}.notes-content p{margin:0 0 18px}.notes-content pre{background:var(--card-2);padding:20px;border-radius:10px;overflow:auto;font:13px/1.6 var(--mono);white-space:pre}.notes-content code{font-family:var(--mono);font-size:.86em;overflow-wrap:anywhere}.notes-content pre code{font:inherit;overflow-wrap:normal}.sources{margin-top:28px;border-top:1px solid var(--border);padding-top:20px}.sources h3{font-size:14px;color:var(--accent)}.sources ul{padding-left:20px}.sources li{margin-bottom:12px;overflow-wrap:anywhere;font-size:14px}.notes-for-slide{display:none}.notes-for-slide.active{display:block}
dialog{width:min(900px,94vw);max-height:84vh;border:1px solid var(--border);border-radius:20px;padding:0;background:var(--card);color:var(--primary)}dialog::backdrop{background:#1117}.toc-body{padding:12px 24px 24px;overflow:auto;max-height:66vh}.toc-body a{display:flex;gap:20px;padding:14px 8px;border-bottom:1px solid var(--border);color:var(--primary);text-decoration:none;font-size:16px}.toc-body a:hover{background:var(--card-2)}.toc-body a span{font-family:var(--mono);font-size:12px;color:var(--accent);min-width:26px}.reader .shell{height:auto;max-width:1320px;margin:auto}.reader .slide{display:flex;height:auto;min-height:720px;margin-bottom:28px}.reader .slide-foot{position:static}.reader .body{flex:none}.reader .controls{position:sticky;bottom:0;background:var(--page);z-index:3}.reader .cover{min-height:75vh}.reader .progress,.reader .scroll-hint{display:none}
@media(max-width:1000px){.cols-4{grid-template-columns:repeat(2,minmax(0,1fr))}.cols-3{gap:24px}.body p{font-size:19px}.code-split{grid-template-columns:1fr}.code-side{max-width:70ch}.code-side p{font-size:17px}.slide h1{font-size:36px}.flow .unit:not(:last-child):after{right:-25px}.code-wrap pre{font-size:15px}}
@media(max-width:700px){.body .table-hint{display:block;font-size:12px;color:var(--muted);margin-top:12px}.top{height:48px;padding:0 16px;font-size:10px}.brand span{display:none}.edition{font-size:10px}.shell{padding:0 8px;height:calc(100dvh - 116px)}.slide{padding:24px 20px;border-radius:14px}.slide h1{font-size:clamp(27px,7.4vw,36px);max-width:100%}.subtitle{font-size:16px}.body{padding:32px 0;flex:none;margin:auto 0;gap:24px}.body p{font-size:18px;line-height:1.5}.body h2{font-size:23px;margin-bottom:12px}.columns,.flow,.metrics,.image-split{grid-template-columns:1fr;gap:30px}.flow .unit:not(:last-child):after{content:'↓';right:0;top:auto;bottom:-32px;padding:0 12px}.flow .unit{padding-top:18px}.metrics .value{font-size:58px;margin-bottom:12px}.metrics h2{font-size:22px}.metrics p{font-size:17px}.formula{font-size:20px;padding:0 0 24px}.big-lead{font-size:27px!important}.table-scroll{margin-right:-20px;width:calc(100% + 20px);padding-right:12px}table{font-size:15px;min-width:580px}th,td{padding:14px 12px}.code-wrap{margin:0 -8px}.code-wrap pre{font-size:12px;padding:48px 16px 20px}.code-side p{font-size:17px}.image-split img{max-height:65vh}.takeaway{font-size:17px;padding-top:20px}.slide-foot{font-size:9px;margin-top:28px}.cover h1{font-size:clamp(43px,11vw,66px)}.cover .kicker{margin-bottom:32px}.cover .subtitle{font-size:20px}.cover .cover-stamp{font-size:13px}.cover .slide-foot{left:20px;right:20px;bottom:26px}.controls{height:68px;gap:8px;padding:0 8px}.controls .text-btn{font-size:11px;padding:8px 11px}.controls .icon-btn{padding:7px 13px}.counter{min-width:54px;font-size:11px}.notes-panel{top:48px;bottom:68px;right:8px;border-radius:14px}.notes-content{padding:20px}.panel-head{padding:12px 20px}.moe-input,.moe-output{font-size:18px}.moe-branches{gap:20px;padding:30px 0}.moe-branches h2{font-size:20px}.moe-branches p{font-size:15px}.expert-strip{gap:5px}.expert-strip span{padding:8px;font-size:12px}.reader .slide{min-height:0}.reader .cover{min-height:80vh}.reader .cover .slide-foot{position:static;margin-top:50px}.reader .body{margin:0}.scroll-hint{bottom:74px;font-size:10px}}
@media(max-width:480px){.controls{height:108px;max-width:340px;width:100%;margin:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 8px;align-content:center;justify-items:stretch}.controls .counter{align-self:center}.shell{height:calc(100dvh - 156px)}.notes-panel{bottom:108px}.scroll-hint{bottom:114px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
@media print{@page{size:A4 landscape;margin:12mm}html,body{height:auto;background:white}.top,.controls,.progress,.scroll-hint,.notes-panel,dialog,.copy,.table-hint{display:none!important}.shell{height:auto!important;padding:0!important;max-width:none!important}.slide,.slide.active,.reader .slide{display:flex!important;break-after:page;min-height:175mm;height:auto;overflow:visible;padding:10mm;border:0;border-radius:0}.slide h1{font-size:30px}.body{padding:25px 0;flex:none}.body p{font-size:16px}.body h2{font-size:21px}.columns.cols-2,.flow.cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.columns.cols-3,.flow.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.takeaway{font-size:16px}.code-wrap pre{font-size:11px;white-space:pre-wrap;overflow-wrap:anywhere}.table-scroll{overflow:visible}table{min-width:0;font-size:14px}.cover{justify-content:center}.cover h1{font-size:62px}.cover .slide-foot{position:static;margin-top:30mm}.image-split img{max-height:135mm}.formula{font-size:23px}}
'''

cover = '''<section class="slide cover active" id="slide-1" aria-label="Слайд 1"><div class="kicker">KIMI K3.1 PRO · 5 НОЯБРЯ 2026</div><h1>Как устроена Kimi</h1><p class="subtitle">Подробный разбор модели и практический путь к собственному серверу</p><div class="body"><div class="cover-stamp">Архитектура / Память / Оборудование / Развёртывание</div></div><div class="slide-foot"><span>ДОЛГОВ, ЭЙ АЙ И ПАРТНЕРЫ</span><span>01 / TOTAL</span></div></section>'''
total = len(SLIDES) + 1
sections = [cover.replace('TOTAL', str(total))]
note_sections = ['<div class="notes-for-slide active"><p>Презентация объясняет, как работает Kimi и что нужно для собственного inference-сервера. Основная версия: открытый checkpoint Kimi K3.1 Pro. Срез первичных источников: 5 ноября 2026. Команды запуска соответствуют документации. На физическом GPU-сервере их здесь не запускали.</p><p>Кнопка «Пояснение» открывает подробный текст к каждому слайду. В слайдах о развёртывании здесь находятся полные команды. Через «Оглавление» можно перейти к нужной теме. Кнопка «Читать» показывает все слайды одной лентой.</p></div>']
toc = ['<a href="#1"><span>01</span>Как устроена Kimi</a>']
for number, d in enumerate(SLIDES, 2):
    chapter = 'УСТРОЙСТВО МОДЕЛИ' if number < 20 else 'ПАМЯТЬ И СЕРВЕР' if number < 28 else 'РАЗВЁРТЫВАНИЕ И ЭКСПЛУАТАЦИЯ'
    label = d.get('label', chapter)
    markup = '<section class="slide" id="slide-' + str(number) + '" aria-label="Слайд ' + str(number) + '"><div class="kicker">' + E(label) + '</div><h1>' + E(d['title']) + '</h1>'
    if d.get('subtitle'):
        markup += '<p class="subtitle">' + inline(d['subtitle']) + '</p>'
    markup += '<div class="body">' + content(d) + '</div>'
    if d.get('takeaway'):
        markup += '<div class="takeaway">' + inline(d['takeaway']) + '</div>'
    markup += '<div class="slide-foot"><span>KIMI K3.1 PRO</span><span>' + str(number).zfill(2) + ' / ' + str(total) + '</span></div></section>'
    sections.append(markup)
    sources = '<div class="sources"><h3>Первичные источники</h3><ul>' + ''.join('<li><a href="' + E(u) + '" target="_blank" rel="noopener noreferrer">' + E(u) + '</a></li>' for u in d.get('sources', [])) + '</ul></div>' if d.get('sources') else ''
    note_sections.append('<div class="notes-for-slide">' + notes(d.get('notes', '')) + sources + '</div>')
    toc.append('<a href="#' + str(number) + '"><span>' + str(number).zfill(2) + '</span>' + E(d['title']) + '</a>')

script = r'''
const slides=[...document.querySelectorAll('.slide')],notes=[...document.querySelectorAll('.notes-for-slide')],counter=document.getElementById('counter'),panel=document.getElementById('notes-panel'),toc=document.getElementById('toc'),hint=document.getElementById('scroll-hint'),reader=document.getElementById('reader'),notesToggle=document.getElementById('notes-toggle');let i=0,readMode=false;
function scrollHint(){const s=slides[i];hint.hidden=readMode||!(s.scrollHeight>s.clientHeight+6&&s.scrollTop+s.clientHeight<s.scrollHeight-6)}
function show(n,hash=true){i=Math.max(0,Math.min(slides.length-1,n));slides.forEach((s,j)=>{s.classList.toggle('active',j===i);s.setAttribute('aria-hidden',!readMode&&j!==i)});notes.forEach((s,j)=>s.classList.toggle('active',j===i));counter.textContent=`${i+1} / ${slides.length}`;document.title=`${i+1}. ${slides[i].querySelector('h1').textContent} — Kimi`;document.getElementById('prev').disabled=i===0;document.getElementById('next').disabled=i===slides.length-1;document.getElementById('progress').style.width=`${(i+1)/slides.length*100}%`;if(hash)history.replaceState(null,'','#'+(i+1));slides[i].scrollTop=0;document.querySelector('.notes-content').scrollTop=0;if(readMode&&hash)slides[i].scrollIntoView({block:'start'});requestAnimationFrame(scrollHint)}
function toggleNotes(force){const open=force===undefined?panel.hidden:force;panel.hidden=!open;notesToggle.setAttribute('aria-expanded',String(open));if(open)document.getElementById('close-notes').focus();else notesToggle.focus()}
document.getElementById('prev').onclick=()=>show(i-1);document.getElementById('next').onclick=()=>show(i+1);notesToggle.onclick=()=>toggleNotes();document.getElementById('close-notes').onclick=()=>toggleNotes(false);document.getElementById('toc-toggle').onclick=()=>toc.showModal();document.getElementById('close-toc').onclick=()=>toc.close();toc.addEventListener('click',e=>{const a=e.target.closest('a');if(a){e.preventDefault();show(Number(a.hash.slice(1))-1);toc.close()}});reader.onclick=()=>{readMode=!readMode;document.body.classList.toggle('reader',readMode);reader.textContent=readMode?'Слайды':'Читать';reader.setAttribute('aria-pressed',String(readMode));show(i,false);if(readMode)slides[i].scrollIntoView({block:'start'})};
window.addEventListener('hashchange',()=>show((parseInt(location.hash.slice(1),10)||1)-1,false));window.addEventListener('resize',scrollHint);slides.forEach(s=>s.addEventListener('scroll',scrollHint,{passive:true}));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){toggleNotes(false);return}if(toc.open||['INPUT','TEXTAREA','BUTTON','A'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable)return;if(e.key.toLowerCase()==='n'){toggleNotes();return}if(readMode)return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(i+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(i-1)}if(e.key==='Home'){e.preventDefault();show(0)}if(e.key==='End'){e.preventDefault();show(slides.length-1)}});
const readingObserver=new IntersectionObserver(entries=>{if(!readMode)return;for(const entry of entries){if(entry.isIntersecting){const nextIndex=slides.indexOf(entry.target);if(nextIndex!==i)show(nextIndex,false)}}},{rootMargin:'-12% 0px -65% 0px',threshold:0});slides.forEach(s=>readingObserver.observe(s));
document.querySelectorAll('.code-wrap .copy').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.parentElement.querySelector('code').textContent);b.textContent='Скопировано';setTimeout(()=>b.textContent='Копировать',1600)}catch{b.textContent='Выделите текст'}});show((parseInt(location.hash.slice(1),10)||1)-1,false);
'''

page = '''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="Как работает Kimi K3.1 Pro: KDA, DSA, MoE, память, выбор сервера и пошаговое развёртывание собственного API."><title>Как устроена Kimi и как развернуть её на сервере</title><link rel="canonical" href="https://dolgovalex.com/kimi/"><link rel="preload" href="/assets/ds/fonts/geist-cyrillic.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/ds/tokens.css"><style>''' + css + '''</style></head><body>
<header class="top"><a class="brand" href="/">ДОЛГОВ,<span>Эй Ай и партнеры ©</span></a><span class="edition">KIMI · АРХИТЕКТУРА И СВОЙ СЕРВЕР</span></header>
<main class="shell">''' + '\n'.join(sections) + '''</main>
<aside class="notes-panel" id="notes-panel" hidden aria-label="Подробное пояснение"><div class="panel-head"><h2>Подробное пояснение</h2><button id="close-notes" type="button" aria-label="Закрыть пояснение">Закрыть</button></div><div class="notes-content">''' + ''.join(note_sections) + '''</div></aside>
<dialog id="toc" aria-label="Оглавление"><div class="panel-head"><h2>Оглавление</h2><button id="close-toc" type="button">Закрыть</button></div><div class="toc-body">''' + ''.join(toc) + '''</div></dialog>
<span class="scroll-hint" id="scroll-hint" hidden>Ниже есть продолжение ↓</span>
<nav class="controls" aria-label="Навигация по презентации"><button class="icon-btn" id="prev" type="button" aria-label="Предыдущий слайд">←</button><span class="counter" id="counter" aria-live="polite"></span><button class="icon-btn" id="next" type="button" aria-label="Следующий слайд">→</button><button class="text-btn" id="toc-toggle" type="button">Оглавление</button><button class="text-btn" id="notes-toggle" type="button" aria-expanded="false" aria-controls="notes-panel">Пояснение</button><button class="text-btn" id="reader" type="button" aria-pressed="false">Читать</button></nav><div class="progress" id="progress"></div>
<script>''' + script + '''</script></body></html>'''
(ROOT / 'index.html').write_text(page)
print(json.dumps({'slides': total, 'bytes': len(page.encode()), 'output': str(ROOT / 'index.html')}, ensure_ascii=False))
