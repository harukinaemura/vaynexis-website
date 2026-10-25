'use strict';
(() => {
  if (!document.documentElement.classList.contains('home-a')) return;
  let carousel = null;
  const track = document.getElementById('example-track');
  const cards = [...track.querySelectorAll('.example-card')];
  const previous = document.getElementById('prev-example');
  const next = document.getElementById('next-example');
  const count = document.getElementById('example-count');
  const examples = document.getElementById('examples');
  const autoButton = document.getElementById('auto-example');
  const autoStatus = document.getElementById('auto-status');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let direction = 1;
  function refresh() {
    index = cards.reduce((best, card, current) => Math.abs(card.offsetLeft - cards[0].offsetLeft - track.scrollLeft) < Math.abs(cards[best].offsetLeft - cards[0].offsetLeft - track.scrollLeft) ? current : best, 0);
    // The last card can align to the right edge instead of the start.
    if (track.scrollWidth - track.clientWidth - track.scrollLeft < 3) index = cards.length - 1;
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    count.textContent = `${String(index + 1).padStart(2, '0')} / 03`;
  }
  function go(delta, manual = true) {
    if (manual && carousel) carousel.pause();
    const target = Math.max(0, Math.min(cards.length - 1, index + delta));
    track.scrollTo({left: cards[target].offsetLeft - cards[0].offsetLeft, behavior: motionPreference.matches ? 'auto' : 'smooth'});
  }
  previous.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); go(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  let timer;
  track.addEventListener('scroll', () => {window.clearTimeout(timer); timer = window.setTimeout(refresh, 80);}, {passive:true});
  window.addEventListener('resize', refresh);
  if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(track);
  refresh();
  if (window.VaynexisMotion) {
    carousel = window.VaynexisMotion.createCarouselController({
      interval:7000,
      initial:{reduced:motionPreference.matches,hidden:document.hidden,conceptEnabled:true,supported:'IntersectionObserver' in window},
      onTick() {
        refresh();
        if (index === cards.length - 1) direction = -1;
        if (index === 0) direction = 1;
        go(direction, false);
      },
      onState(state) {
        const labels = {running:'7秒ごとに自動切替中',paused:'自動切替を停止中',hover:'カードにポインターがあるため一時停止',focus:'キーボード操作中のため一時停止',offscreen:'表示されたら7秒後に自動切替',hidden:'非表示タブのため一時停止',reduced:'動きを減らす設定：自動切替なし',concept:'手動切替',unsupported:'この環境では手動切替'};
        autoStatus.textContent = labels[state.reason];
        autoButton.disabled = state.reduced || !state.supported || !state.conceptEnabled;
        autoButton.textContent = state.wanted ? '自動切替を停止' : '自動切替を再開';
        count.setAttribute('aria-live', state.running ? 'off' : 'polite');
        examples.dataset.motionState = state.reason;
      }
    });
    document.getElementById('auto-controls').hidden = false;
    autoButton.addEventListener('click', () => {
      if (carousel.getState().wanted) carousel.pause();
      else {
        // The explicit resume command may start while its own button has focus.
        carousel.set({wanted:true,focused:false});
      }
    });
    track.addEventListener('mouseenter', () => carousel.set({hovered:true}));
    track.addEventListener('mouseleave', () => carousel.set({hovered:false}));
    examples.addEventListener('focusin', () => carousel.set({focused:true}));
    examples.addEventListener('focusout', event => {
      if (!examples.contains(event.relatedTarget)) carousel.set({focused:false});
    });
    // Swiping or direct interaction means "let me read" until explicit resume.
    track.addEventListener('pointerdown', () => carousel.pause(), {passive:true});
    track.addEventListener('wheel', event => {
      if (Math.abs(event.deltaX) > 0) carousel.pause();
    }, {passive:true});
    document.addEventListener('visibilitychange', () => carousel.set({hidden:document.hidden}));
    const preferenceChanged = event => carousel.set({reduced:event.matches});
    if (motionPreference.addEventListener) motionPreference.addEventListener('change', preferenceChanged);
    else if (motionPreference.addListener) motionPreference.addListener(preferenceChanged);
    if ('IntersectionObserver' in window) {
      const visibility = new IntersectionObserver(entries => entries.forEach(entry => {
        carousel.set({inView:entry.isIntersecting && entry.intersectionRatio >= .25});
      }), {threshold:[0,.25]});
      visibility.observe(track);
    }
    window.addEventListener('pagehide', () => carousel.set({hidden:true}));
    window.addEventListener('pageshow', () => carousel.set({hidden:document.hidden}));
  }
  if ('IntersectionObserver' in window && !motionPreference.matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-once');
        observer.unobserve(entry.target);
      }
    }), {threshold:.12});
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
  }
})();
