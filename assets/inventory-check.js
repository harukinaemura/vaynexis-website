/* Four preparation checks. No submission, storage or new analytics events. */
(function () {
  'use strict';
  var form = document.getElementById('inventory-check');
  if (!form) return;
  var fields = [{"key": "input", "action": "入力元と完成物を1組決める"}, {"key": "criteria", "action": "一致させる件数・金額・出典や必要項目を決める"}, {"key": "review", "action": "確認担当と、間違ったときに止める手順を決める"}, {"key": "permission", "action": "利用するAIと社内ルールで、入力できる情報の範囲を確認する"}];
  var result = document.getElementById('inventory-check-result');
  var title = document.getElementById('inventory-check-title');
  var summary = document.getElementById('inventory-check-summary');
  var list = document.getElementById('inventory-check-actions');
  function clearResult() { result.hidden = true; }
  form.addEventListener('change', clearResult);
  form.addEventListener('reset', clearResult);
  form.addEventListener('submit', function (event) { event.preventDefault(); });
  document.getElementById('inventory-check-run').addEventListener('click', function () {
    var pending = fields.filter(function (field) {
      return form.elements[field.key].value !== 'yes';
    });
    list.replaceChildren();
    if (pending.length) {
      title.textContent = '試す前に、' + pending.length + '項目を整理しましょう';
      summary.textContent = 'まだ準備していない点と、未確認の点を次に示します。分からないところを推測で埋めず、入力元・完成の条件・担当者と確認してください。';
      pending.forEach(function (field) {
        var item = document.createElement('li');
        item.textContent = field.action + (form.elements[field.key].value === 'unknown' ? '（未確認）' : '（これから準備）');
        list.appendChild(item);
      });
    } else {
      title.textContent = '少量で試す準備がそろった候補です';
      summary.textContent = '4項目の確認済みという回答をもとに、まず少量で試す段階です。AIが合うか、確認を含めて負担が減るかは、実際の結果で判断します。';
      ['元データを残し、戻せる範囲と対象件数を決める', '準備・操作・確認・修正の時間と、誤り・保留の件数を記録する', '金額の確定、承認、社外送信などは担当者が確認して行う'].forEach(function (text) {
        var item = document.createElement('li'); item.textContent = text; list.appendChild(item);
      });
    }
    result.hidden = false;
    result.focus();
  });
})();
