(() => {
  const accordion = document.querySelector('[data-assumptions]');
  if (!accordion) return;
  const items = [...accordion.querySelectorAll('.performa-assumptions__item')];
  const setOpen = (item, shouldOpen) => {
    items.forEach(candidate => {
      const open = candidate === item && shouldOpen;
      candidate.dataset.open = String(open);
      candidate.querySelector('button').setAttribute('aria-expanded', String(open));
      candidate.querySelector('.performa-assumptions__panel').setAttribute('aria-hidden', String(!open));
    });
  };
  items.forEach(item => {
    item.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') setOpen(item, true);
    });
    item.querySelector('button').addEventListener('click', () => setOpen(item, item.dataset.open !== 'true'));
  });
})();
