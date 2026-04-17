/*
  Analytics loader for dolgovalex.com
  Как подключить:
    1. Зарегистрировать счётчики:
       - Яндекс.Метрика: https://metrika.yandex.ru/ → Добавить счётчик → получить YM_ID
       - Google Analytics 4: https://analytics.google.com/ → Admin → Create property → получить GA_MEASUREMENT_ID
    2. Подставить YM_ID и GA_MEASUREMENT_ID ниже и раскомментировать нужные блоки.
    3. Проверить работу в Real-time обоих панелей.
*/

(function () {
  // ---------- Яндекс.Метрика ----------
  // var YM_ID = null; // подставить номер счётчика (цифры, без кавычек)
  // if (YM_ID) {
  //   (function (m, e, t, r, i, k, a) {
  //     m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
  //     m[i].l = 1 * new Date();
  //     k = e.createElement(t); a = e.getElementsByTagName(t)[0];
  //     k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  //   })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  //   ym(YM_ID, 'init', {
  //     clickmap: true,
  //     trackLinks: true,
  //     accurateTrackBounce: true,
  //     webvisor: true
  //   });
  // }

  // ---------- Google Analytics 4 ----------
  // var GA_ID = null; // подставить 'G-XXXXXXX'
  // if (GA_ID) {
  //   var s = document.createElement('script');
  //   s.async = true;
  //   s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  //   document.head.appendChild(s);
  //   window.dataLayer = window.dataLayer || [];
  //   function gtag() { dataLayer.push(arguments); }
  //   window.gtag = gtag;
  //   gtag('js', new Date());
  //   gtag('config', GA_ID);
  // }
})();
