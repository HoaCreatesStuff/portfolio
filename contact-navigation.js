(() => {
  const links = [...document.querySelectorAll('a[href="contact.html"]')];
  const key = 'portfolio-contact-return';
  links.forEach((link, index) => link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    try {
      sessionStorage.setItem(key, JSON.stringify({ url:location.href, index }));
    } catch { /* Navigation still works when storage is unavailable. */ }
  }));
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted && performance.getEntriesByType('navigation')[0]?.type !== 'back_forward') return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(key));
      if (saved?.url === location.href) {
        links[saved.index]?.focus({ preventScroll:true });
        sessionStorage.removeItem(key);
      }
    } catch { /* Keep native history behavior as the fallback. */ }
  });
})();
