// お問い合わせフォーム：頁を開いた時刻を入れる（3秒未満の送信を機械として捨てるため）。送信中はボタンを押せなくする。
(function () {
  var f = document.querySelector("form.cform");
  if (!f) return;
  var b = f.querySelector("button[type=submit]");
  var label = b ? b.textContent : "";
  f.elements.t.value = String(Date.now());
  f.addEventListener("submit", function () {
    if (b) { b.disabled = true; b.textContent = "送信しています…"; }
  });
  // 「戻る」で頁が復元されたときは、もう一度押せるようにする
  window.addEventListener("pageshow", function () {
    if (b) { b.disabled = false; b.textContent = label; }
  });
})();
