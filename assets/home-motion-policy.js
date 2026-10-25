/* Small, independently testable policy for optional carousel motion. */
(function (scope) {
  'use strict';
  function createCarouselController(options) {
    const schedule = options.setTimeout || setTimeout;
    const cancel = options.clearTimeout || clearTimeout;
    const state = Object.assign({wanted:true,reduced:false,inView:false,hidden:false,hovered:false,focused:false,conceptEnabled:true,supported:true}, options.initial || {});
    let timer = null;
    let destroyed = false;
    function reason() {
      if (!state.supported) return 'unsupported';
      if (state.reduced) return 'reduced';
      if (!state.conceptEnabled) return 'concept';
      if (!state.wanted) return 'paused';
      if (state.hidden) return 'hidden';
      if (!state.inView) return 'offscreen';
      if (state.hovered) return 'hover';
      if (state.focused) return 'focus';
      return 'running';
    }
    function snapshot() { return Object.assign({}, state, {reason:reason(), running:!destroyed && reason()==='running'}); }
    function update() {
      if (timer !== null) { cancel(timer); timer = null; }
      if (destroyed) return;
      const current = snapshot();
      if (options.onState) options.onState(current);
      if (!current.running) return;
      timer = schedule(function () {
        timer = null;
        if (destroyed || reason() !== 'running') return;
        options.onTick();
        update();
      }, options.interval || 7000);
    }
    update();
    return {
      set(patch) { Object.assign(state, patch); update(); },
      pause() { state.wanted = false; update(); },
      resume() { state.wanted = true; update(); },
      getState: snapshot,
      destroy() { destroyed = true; if (timer !== null) cancel(timer); timer = null; }
    };
  }
  if (typeof module === 'object' && module.exports) module.exports = {createCarouselController};
  else scope.VaynexisMotion = {createCarouselController};
})(typeof window !== 'undefined' ? window : this);
