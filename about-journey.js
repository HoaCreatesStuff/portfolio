(() => {
  const accordion = document.querySelector('[data-journey-accordion]');
  if (!accordion) return;

  const items = [...accordion.querySelectorAll('.journey__item')];

  const setOpen = (item, open) => {
    const trigger = item.querySelector('.journey__trigger');
    const panel = item.querySelector('.journey__panel');
    item.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
  };

  items.forEach((item) => {
    item.querySelector('.journey__trigger').addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      items.forEach((candidate) => setOpen(candidate, candidate === item ? !isOpen : false));
    });
  });
})();
