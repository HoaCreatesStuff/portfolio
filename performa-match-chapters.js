(() => {
  const figure = document.querySelector('.performa-extension-video');
  if (!figure) return;
  const video = figure.querySelector('video');
  const buttons = [...figure.querySelectorAll('[data-time]')];
  const sync = () => {
    let active = 0;
    buttons.forEach((button, index) => {
      if (video.currentTime >= Number(button.dataset.time)) active = index;
    });
    buttons.forEach((button, index) => {
      if (index === active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  };
  buttons.forEach(button => button.addEventListener('click', () => {
    video.currentTime = Number(button.dataset.time);
    sync();
    video.play().catch(() => {});
  }));
  video.addEventListener('timeupdate', sync);
  video.addEventListener('seeked', sync);
})();
