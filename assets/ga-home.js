// Google アナリティクス（GA4）。build.py が GA_ID から生成する。直すのは build.py。
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-YKV90SZNQV');
// 問い合わせの手前の行動（電話・メール・LINE のリンクを押した）をイベントとして送る。
// 送るのは手段だけで、電話番号やメールアドレスは送らない。
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
  if (!a) return;
  var h = a.getAttribute('href') || '';
  var m = h.indexOf('tel:') === 0 ? 'tel'
        : h.indexOf('mailto:') === 0 ? 'mail'
        : /^https:\/\/(lin\.ee|line\.me)\//.test(h) ? 'line' : '';
  if (m) gtag('event', 'contact_' + m, { method: m });
}, true);

/* Homepage: retain the existing GA queue and contact events immediately,
   but let first-party content paint before downloading the external library.
   A real interaction or backgrounding starts it early; no UA/benchmark checks. */
(function () {
  var started = false;
  var fallback;
  var start = function () {
    if (started) return;
    started = true;
    window.clearTimeout(fallback);
    var script = document.createElement('script');
    script.id = 'vaynexis-google-tag';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-YKV90SZNQV';
    document.head.appendChild(script);
  };
  var idle = function () {
    if (document.visibilityState === 'hidden') { start(); return; }
    if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 1500 });
    else window.setTimeout(start, 0);
  };
  var painted = function () {
    if (document.visibilityState === 'hidden') { start(); return; }
    window.requestAnimationFrame(function () { window.requestAnimationFrame(idle); });
  };
  // Never leave the existing queued page view waiting indefinitely on a slow subresource.
  fallback = window.setTimeout(start, 5000);
  if (document.readyState === 'complete') painted();
  else window.addEventListener('load', painted, { once: true });
  document.addEventListener('pointerdown', start, { once: true, passive: true, capture: true });
  document.addEventListener('keydown', start, { once: true, capture: true });
  document.addEventListener('click', start, { once: true, capture: true });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') start();
  });
})();
