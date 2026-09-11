/* vaynexis.jp v3 — ナビの開閉／トップの背景／検査コンソール（架空の例） */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- nav toggle ---- */
  var nav = document.getElementById('nav');
  var toggle = nav && nav.querySelector('.nav__toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('nav--open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '閉じる' : 'メニュー';
    });
  }

  /* ---- hero background: light, floating glass panes, perspective floor ---- */
  var c = document.getElementById('floor');
  if (c && c.getContext) {
    var ctx = c.getContext('2d');
    var w = 0, h = 0, off = 0, t = 0, raf = 0;
    var panes = [];
    var size = function () {
      var r = c.parentElement.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(r.width)); h = Math.max(1, Math.floor(r.height));
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    var seed = function () {
      panes.length = 0;
      var spots = [[0.50, 0.12], [0.93, 0.18], [0.62, 0.62], [0.97, 0.70], [0.78, 0.92], [0.42, 0.88]];
      for (var i = 0; i < spots.length; i++) {
        panes.push({ x: spots[i][0], y: spots[i][1], s: 110 + Math.random() * 150, r: (Math.random() - 0.5) * 0.5, v: 0.00035 + Math.random() * 0.0003, ph: Math.random() * Math.PI * 2 });
      }
    };
    var pane = function (px, py, s, r) {
      ctx.save(); ctx.translate(px, py); ctx.rotate(r);
      var k = s * 0.12;
      ctx.beginPath(); ctx.moveTo(-s / 2, -s / 2); ctx.lineTo(s / 2 - k, -s / 2); ctx.lineTo(s / 2, -s / 2 + k); ctx.lineTo(s / 2, s / 2); ctx.lineTo(-s / 2 + k, s / 2); ctx.lineTo(-s / 2, s / 2 - k); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.fill();
      ctx.strokeStyle = 'rgba(27,42,65,0.10)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = 'rgba(176,141,87,0.40)'; ctx.beginPath(); ctx.moveTo(-s / 2, -s / 2); ctx.lineTo(s / 2 - k, -s / 2); ctx.stroke();
      ctx.restore();
    };
    var draw = function () {
      ctx.clearRect(0, 0, w, h);
      var horizon = h * 0.42, vx = w * 0.68, R = Math.max(w, h);
      var b1 = ctx.createRadialGradient(w * (0.74 + 0.03 * Math.sin(t * 0.0004)), h * (0.34 + 0.04 * Math.cos(t * 0.0003)), 0, w * 0.74, h * 0.34, R * 0.48);
      b1.addColorStop(0, 'rgba(43,143,214,0.16)'); b1.addColorStop(1, 'rgba(43,143,214,0)');
      ctx.fillStyle = b1; ctx.fillRect(0, 0, w, h);
      var b2 = ctx.createRadialGradient(w * (0.12 + 0.03 * Math.cos(t * 0.00035)), h * 0.9, 0, w * 0.12, h * 0.9, R * 0.42);
      b2.addColorStop(0, 'rgba(176,141,87,0.12)'); b2.addColorStop(1, 'rgba(176,141,87,0)');
      ctx.fillStyle = b2; ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (var i = -14; i <= 14; i++) {
        var x = vx + i * (w / 9);
        var g = ctx.createLinearGradient(0, horizon, 0, h);
        g.addColorStop(0, 'rgba(43,143,214,0)'); g.addColorStop(0.35, 'rgba(43,143,214,0.18)'); g.addColorStop(1, 'rgba(43,143,214,0.03)');
        ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(vx, horizon); ctx.lineTo(x, h + 40); ctx.stroke();
      }
      for (var k = 0; k < 18; k++) {
        var tt = ((k + off) % 18) / 18;
        var y = horizon + Math.pow(tt, 2.2) * (h - horizon);
        var a = 0.04 + tt * 0.22;
        ctx.strokeStyle = 'rgba(176,141,87,' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke();
      }
      var hg = ctx.createLinearGradient(0, horizon - 40, 0, horizon + 60);
      hg.addColorStop(0, 'rgba(43,143,214,0)'); hg.addColorStop(0.5, 'rgba(43,143,214,0.10)'); hg.addColorStop(1, 'rgba(43,143,214,0)');
      ctx.fillStyle = hg; ctx.fillRect(0, horizon - 40, w, 100);
      for (var j = 0; j < panes.length; j++) {
        var p = panes[j];
        var px = w * p.x + Math.sin(t * p.v + p.ph) * 14;
        var py = h * p.y + Math.cos(t * p.v * 0.8 + p.ph) * 10;
        pane(px, py, p.s, p.r + Math.sin(t * p.v * 0.5 + p.ph) * 0.04);
      }
      if (!reduce) { off += 0.012; t += 16; raf = requestAnimationFrame(draw); }
    };
    var start = function () { cancelAnimationFrame(raf); size(); seed(); draw(); };
    start();
    var to; window.addEventListener('resize', function () { clearTimeout(to); to = setTimeout(start, 150); });
  }

  /* ---- audit console: fictional demo rows ---- */
  var log = document.getElementById('log');
  if (log) {
    var okEl = document.getElementById('cnt-ok'), ngEl = document.getElementById('cnt-ng');
    var jobs = ['請求書の作成', '経費の仕分け', '在庫の突合', '見積書の下書き', '問い合わせの一次返信', '議事録の下書き', '納品書の照合', '入金の消込'];
    var ok = 0, ng = 0, seq = 418, hh = 9, mm = 12;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var row = function (force) {
      var fail = force === 'ng' || (force !== 'ok' && Math.random() < 0.14);
      var job = jobs[Math.floor(Math.random() * jobs.length)];
      var n = 2 + Math.floor(Math.random() * 3);
      var m = fail ? n - 1 : n;
      mm += 1 + Math.floor(Math.random() * 7); if (mm >= 60) { mm -= 60; hh += 1; }
      seq += 1; if (fail) ng += 1; else ok += 1;
      var li = document.createElement('li');
      li.innerHTML = '<span class="t">' + pad(hh) + ':' + pad(mm) + '</span><span class="id">#' + seq + '</span><span>' + job + '</span>'
        + '<span class="' + (fail ? 'ng' : 'ok') + '">' + (fail ? '差し戻し' : '合格') + '</span><span class="m t">' + m + '/' + n + '</span>';
      log.appendChild(li);
      while (log.children.length > 7) log.removeChild(log.firstChild);
      okEl.textContent = ok; ngEl.textContent = ng;
    };
    row('ok'); row('ok'); row('ng'); row('ok'); row('ok'); row('ok'); row('ok');
    if (!reduce) setInterval(row, 1900);
  }
})();
