/* Общий движок навигации слайдов школы «Команда».
   Каждый дек: <link rel=stylesheet href=/workshop-komanda/slides/deck.css> + .deck со .slide + этот скрипт.
   Чрому (прогресс, точки, счётчик, стрелки, кнопка «все блоки») рисует сам. */
(function(){
  function el(t,c,txt){ var e=document.createElement(t); if(c)e.className=c; if(txt!=null)e.textContent=txt; return e; }
  var deck = document.querySelector('.deck');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  if(!slides.length) return;
  var n = slides.length, i = 0;

  var prog = el('div','bar-progress'); document.body.appendChild(prog);
  var dotsWrap = el('div','dots'); document.body.appendChild(dotsWrap);
  var counter = el('div','counter','1 / '+n); document.body.appendChild(counter);
  var hint = el('div','hint','← → листать · F — фуллскрин'); document.body.appendChild(hint);
  var home = document.createElement('a'); home.className='deckhome'; home.href='/workshop-komanda/slides/'; home.textContent='▦ все блоки'; document.body.appendChild(home);
  var prev = el('button','navbtn prev','‹'); var next = el('button','navbtn next','›');
  prev.setAttribute('aria-label','Назад'); next.setAttribute('aria-label','Вперёд');
  document.body.appendChild(prev); document.body.appendChild(next);

  var dots = slides.map(function(_,k){ var d=el('div','dot'+(k===0?' on':'')); d.onclick=function(){go(k);}; dotsWrap.appendChild(d); return d; });

  function go(x){
    i = Math.max(0, Math.min(n-1, x));
    slides.forEach(function(s,k){ s.classList.toggle('active', k===i); });
    dots.forEach(function(d,k){ d.classList.toggle('on', k===i); });
    prog.style.width = (n>1 ? (i/(n-1)*100) : 100)+'%';
    counter.textContent = (i+1)+' / '+n;
    document.body.style.background = slides[i].classList.contains('dark') ? '#11281d' : '#f6f0e6';
    if(('#'+(i+1))!==location.hash) history.replaceState(null,'','#'+(i+1));
  }
  function nx(){ go(i+1); } function pv(){ go(i-1); }
  next.onclick = nx; prev.onclick = pv;
  document.addEventListener('keydown', function(e){
    if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' ') { nx(); e.preventDefault(); }
    else if(e.key==='ArrowLeft'||e.key==='PageUp') { pv(); e.preventDefault(); }
    else if(e.key==='Home') go(0);
    else if(e.key==='End') go(n-1);
    else if(e.key.toLowerCase()==='f'){ if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
  });
  var sx=0; document.addEventListener('touchstart',function(e){ sx=e.touches[0].clientX; },{passive:true});
  document.addEventListener('touchend',function(e){ var dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>50){ dx<0?nx():pv(); } },{passive:true});
  var start = parseInt((location.hash||'').replace('#',''),10); go(isNaN(start)?0:start-1);
})();
