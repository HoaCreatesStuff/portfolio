(() => {
  const MIN_FONT_SIZE = 12;
  const MAX_FONT_SIZE = 160;
  const PRECISION = 0.25;
  const notes = [...document.querySelectorAll('[data-auto-fit-note]')];

  const fits = (note, width, height) =>
    note.scrollWidth <= width + 0.5 && note.scrollHeight <= height + 0.5;

  const fitNote = (note) => {
    const { clientWidth: width, clientHeight: height } = note;
    if (!width || !height) return;

    let low = MIN_FONT_SIZE;
    let high = MAX_FONT_SIZE;
    let best = MIN_FONT_SIZE;

    while (high - low > PRECISION) {
      const candidate = (low + high) / 2;
      note.style.fontSize = `${candidate}px`;

      if (fits(note, width, height)) {
        best = candidate;
        low = candidate;
      } else {
        high = candidate;
      }
    }

    const scale = Number.parseFloat(note.dataset.autoFitScale || '1');
    note.style.fontSize = `${best * (Number.isFinite(scale) ? scale : 1)}px`;
  };

  const fitAll = () => notes.forEach(fitNote);
  const scheduleFit = () => requestAnimationFrame(fitAll);
  const observer = new ResizeObserver(scheduleFit);

  notes.forEach((note) => observer.observe(note));
  window.addEventListener('resize', scheduleFit, { passive: true });
  window.addEventListener('debugfontchange', (event) => {
    if (event.detail?.role === 'accent') scheduleFit();
  });
  document.fonts.ready.then(scheduleFit);
  document.fonts.addEventListener('loadingdone', scheduleFit);
  scheduleFit();
})();
