// お問い合わせフォーム：頁を開いた時刻を入れる（3秒未満の送信を機械として捨てるため）。送信中はボタンを押せなくする。
// 2026-11-14：ボット対策を足した。
// ・h＝キー入力・貼り付け・音声入力など、ブラウザが本物と認める入力（isTrusted）の回数。道具が欄に文字を直接書き込むと 0 のまま。
//   入力の中身は数えるだけで、どこにも送らない。
// ・Turnstile（Cloudflare の確認）の札がまだ無いうちに送信が押されたら、送らずに「数秒お待ちください」と出す。
//   Turnstile の部品が読み込めない環境では止めない（Worker がエラーの頁へ回し、メール・電話の案内を出す）。
(function () {
  var f = document.querySelector("form.cform");
  if (!f) return;
  var b = f.querySelector("button[type=submit]");
  var label = b ? b.textContent : "";
  f.elements.t.value = String(Date.now());

  var h = f.elements.h;
  if (!h) {
    h = document.createElement("input");
    h.type = "hidden";
    h.name = "h";
    f.appendChild(h);
  }
  var n = 0;
  h.value = "0";
  // 文字の欄だけを数える（チェック欄・選択肢はスクリプトの click() でも動くため数えない）
  f.addEventListener("input", function (e) {
    var el = e.target;
    if (e.isTrusted && el && (el.tagName === "TEXTAREA" || /^(text|email|tel)$/.test(el.type))) { n += 1; h.value = String(n); }
  }, true);

  var msg = document.createElement("p");
  msg.className = "fine cform__wait";
  msg.setAttribute("role", "status");
  msg.hidden = true;
  msg.textContent = "送信の前の確認（Cloudflare）が終わっていません。数秒待ってから、もう一度「送信する」を押してください。";
  if (b) b.parentNode.insertBefore(msg, b);

  f.addEventListener("submit", function (e) {
    var tk = f.querySelector('[name="cf-turnstile-response"]');
    if (tk && !tk.value) {
      e.preventDefault();
      msg.hidden = false;
      return;
    }
    msg.hidden = true;
    if (b) { b.disabled = true; b.textContent = "送信しています…"; }
  });
  // 「戻る」で頁が復元されたときは、もう一度押せるようにする。Turnstile の札は1回しか使えないので取り直す
  window.addEventListener("pageshow", function (e) {
    if (b) { b.disabled = false; b.textContent = label; }
    if (e.persisted && window.turnstile) { try { window.turnstile.reset(); } catch (_) {} }
  });
})();
