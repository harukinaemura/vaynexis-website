'use strict';
(() => {
  const menu = document.getElementById('page-menu');
  if (!menu || !document.documentElement.classList.contains('renewal-a')) return;
  const toggle = document.getElementById('page-menu-toggle');
  const closeButton = menu.querySelector('.page-menu-close');
  const panel = document.getElementById('page-menu-panel');
  const update = () => toggle.setAttribute('aria-expanded', String(menu.open));
  function close(restoreFocus) {
    if (!menu.open) return;
    menu.open = false;
    update();
    if (restoreFocus) toggle.focus();
  }
  closeButton.hidden = false;
  update();
  menu.addEventListener('toggle', update);
  closeButton.addEventListener('click', () => close(true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      event.preventDefault();
      close(true);
    }
  });
  document.addEventListener('click', event => {
    if (!menu.contains(event.target)) close(false);
  });
  document.addEventListener('focusin', event => {
    if (!menu.contains(event.target)) close(false);
  });
  panel.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    close(false);
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const target = document.getElementById(href.slice(1));
      if (target) requestAnimationFrame(() => {
        const addedTabIndex = !target.hasAttribute('tabindex');
        if (addedTabIndex) target.setAttribute('tabindex', '-1');
        target.focus({preventScroll:true});
        if (addedTabIndex) target.addEventListener('blur', () => target.removeAttribute('tabindex'), {once:true});
      });
    }
  });
  window.addEventListener('pagehide', () => close(false));
  window.addEventListener('pageshow', update);
})();
