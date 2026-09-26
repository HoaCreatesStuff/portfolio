(() => {
  const back = document.querySelector('[data-contact-back]');
  const heading = document.querySelector('#contact-heading');
  const surface = document.querySelector('.contact-page__surface');
  let returningToPortfolio = false;
  if (document.referrer) {
    const previous = new URL(document.referrer);
    returningToPortfolio = previous.origin === location.origin && previous.pathname !== location.pathname;
    if (returningToPortfolio) back.href = previous.href;
  }

  // Native history preserves the previous page's scroll and focused link.
  back.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (returningToPortfolio && history.length > 1) {
      event.preventDefault();
      history.back();
    }
  });
  document.addEventListener('keydown', (event) => {
    // Let the native select handle Escape while it has focus.
    if (event.key === 'Escape' && !event.defaultPrevented && event.target.tagName !== 'SELECT') back.click();
  });
  const focusHeading = () => {
    if (document.activeElement === document.body) heading.focus({ preventScroll:true });
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) focusHeading();
  else surface.addEventListener('animationend', focusHeading, { once:true });

  document.querySelector('.contact-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = `${data.get('message')}\n\nFrom: ${data.get('name')}\nEmail: ${data.get('email')}${data.get('company') ? `\nCompany: ${data.get('company')}` : ''}`;
    location.href = `mailto:hoa.p.nguyen@gmail.com?subject=${encodeURIComponent(data.get('subject'))}&body=${encodeURIComponent(body)}`;
  });
})();
