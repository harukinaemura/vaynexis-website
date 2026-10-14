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
