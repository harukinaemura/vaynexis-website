(function () {
  'use strict';
  function calculate(input) {
    var values = input.before.concat(input.after);
    if (input.before.length !== 4 || input.after.length !== 4 ||
        !values.every(function (n) { return Number.isFinite(n) && n >= 0; }) ||
        !Number.isSafeInteger(input.count) || input.count < 1 ||
        ['measured', 'estimate'].indexOf(input.basis) < 0 ||
        (input.monthly !== null && (!Number.isSafeInteger(input.monthly) || input.monthly < 1))) {
      throw new Error('比較条件と時間を確認してください。');
    }
    var before = input.before.reduce(function (a, b) { return a + b; }, 0);
    var after = input.after.reduce(function (a, b) { return a + b; }, 0);
    var difference = before - after;
    return { before: before, after: after, difference: difference,
      perItem: difference / input.count,
      percent: before === 0 ? null : difference / before * 100,
      monthly: input.monthly === null ? null : difference / input.count * input.monthly };
  }
  function csvCell(value) {
    var text = String(value === null ? '' : value);
    if (typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculate: calculate, csvCell: csvCell };
  }
  if (typeof document === 'undefined') return;
  var tool = document.getElementById('measure-calculator');
  if (!tool) return;
  var result = document.getElementById('measure-result');
  var exportButton = document.getElementById('measure-export');
  var current = null;
  function format(n) { return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 }).format(n); }
  function invalidate() { current = null; result.hidden = true; exportButton.disabled = true; }
  tool.addEventListener('input', invalidate);
  tool.addEventListener('change', invalidate);
  document.getElementById('measure-run').addEventListener('click', function () {
    invalidate();
    var controls = Array.from(tool.querySelectorAll('input, select'));
    if (!controls.every(function (field) { return field.reportValidity(); })) return;
    var number = function (id) { return Number(document.getElementById(id).value); };
    var input = {
      task: document.getElementById('measure-task').value.trim(),
      count: number('measure-count'), basis: document.getElementById('measure-basis').value,
      before: ['prepare', 'work', 'check', 'repair'].map(function (key) { return number('before-' + key); }),
      after: ['prepare', 'work', 'check', 'repair'].map(function (key) { return number('after-' + key); }),
      monthly: document.getElementById('measure-monthly').value === '' ? null : number('measure-monthly'),
      quality: document.getElementById('measure-quality').checked
    };
    var totals;
    try { totals = calculate(input); } catch (error) {
      document.getElementById('measure-status').textContent = error.message;
      return;
    }
    document.getElementById('measure-status').textContent = '';
    var direction = totals.difference >= 0 ? '短縮' : '増加';
    document.getElementById('measure-totals').textContent =
      input.count + '件の合計：導入前 ' + format(totals.before) + '分 → 試した後 ' + format(totals.after) + '分。' +
      Math.abs(totals.difference).toLocaleString('ja-JP', {maximumFractionDigits: 2}) + '分の' + direction +
      '（1件あたり ' + format(Math.abs(totals.perItem)) + '分）。';
    document.getElementById('measure-percent').textContent = totals.percent === null ?
      '導入前が0分のため、短縮率は算出しません。' :
      '合計時間の' + direction + '率：' + format(Math.abs(totals.percent)) + '％。';
    document.getElementById('measure-monthly-result').textContent = totals.monthly === null ?
      '月間件数が未入力のため、月間の換算はしていません。' :
      '同じ条件が続くと仮定した月間換算：' + format(Math.abs(totals.monthly)) + '分（' +
      format(Math.abs(totals.monthly) / 60) + '時間）の' + direction + '。月間の実測値ではありません。';
    document.getElementById('measure-caution').textContent =
      (input.basis === 'estimate' ? 'これは概算です。測定後の実績として扱わないでください。' : '入力した実測時間の比較です。') +
      (input.quality ? '時間以外の品質・例外・運用費も合わせて判断してください。' :
        '完成条件・品質が同じか未確認のため、時間差だけで改善できたとは判断できません。');
    current = { input: input, totals: totals };
    exportButton.disabled = false;
    result.hidden = false;
    result.focus();
  });
  document.getElementById('measure-clear').addEventListener('click', function () {
    tool.querySelectorAll('input').forEach(function (field) {
      if (field.type === 'checkbox') field.checked = false; else field.value = '';
    });
    document.getElementById('measure-basis').value = '';
    document.getElementById('measure-status').textContent = '';
    invalidate();
  });
  exportButton.addEventListener('click', function () {
    if (!current) return;
    var input = current.input, totals = current.totals;
    var rows = [['項目', '値'], ['業務名', input.task],
      ['測定区分', input.basis === 'measured' ? '実測' : '概算'], ['比較した件数', input.count],
      ['完成条件・品質の同等性', input.quality ? '確認済み' : '未確認']];
    ['準備', '作業・操作', '確認', '修正'].forEach(function (label, i) {
      rows.push(['導入前・' + label + '（分）', input.before[i]], ['試した後・' + label + '（分）', input.after[i]]);
    });
    rows.push(['導入前の合計（分）', totals.before], ['試した後の合計（分）', totals.after],
      ['短縮時間（分・負数は増加）', totals.difference], ['月間件数', input.monthly],
      ['月間換算（分・実測実績ではない）', totals.monthly],
      ['注意', '時間差を人件費削減額や実際の改善実績と同一視しない。品質・例外・費用も確認。']);
    var csv = '\ufeff' + rows.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
    var url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    var link = document.createElement('a');
    link.href = url; link.download = 'ai-work-measurement.csv'; link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
}());
