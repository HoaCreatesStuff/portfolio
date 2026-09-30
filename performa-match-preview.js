// Temporary paper-strip chapter preview shared by unfinished case studies.
(() => {
  const section = document.querySelector('.chapter-preview-page .chapter-preview');
  if (!section || !CSS.supports('position', 'sticky')) return;

  const stage = section.querySelector('.chapter-preview__stage');
  const stack = section.querySelector('.chapter-preview__list');
  const chapters = [...stack.querySelectorAll('.chapter-preview__item')];
  const footer = document.querySelector('.case-study-footer');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let step = 0;
  let travel = 1;
  let lastTouchY = 0;
  let virtualOffset = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const enhanced = () => section.classList.contains('is-enhanced');

  function render() {
    frame = 0;
    if (!enhanced()) return;

    const position = (virtualOffset / travel) * (chapters.length - 1);
    const focusCenter = stage.offsetHeight / 2;

    // One transform moves the entire physical stack through the center of the mask.
    stack.style.setProperty('--preview-stack-y', `${(focusCenter - step * (position + .5)).toFixed(1)}px`);

    chapters.forEach((chapter, index) => {
      const distanceFromFocus = Math.abs((index - position) * step);
      const distance = distanceFromFocus / step;
      const opacity = distance <= 1 ? 1 - .64 * distance : Math.max(.1, .36 - .14 * (distance - 1));
      chapter.style.setProperty('--preview-opacity', opacity.toFixed(3));
      chapter.style.setProperty('--preview-blur', `${Math.min(distance * 5, 12).toFixed(1)}px`);
      chapter.style.setProperty('--preview-scale', (1 - Math.min(distance * .03, .06)).toFixed(3));
    });
  }

  function requestRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  const atBottom = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

  function onScroll() {
    // Native navigation (including the scrollbar and Home key) always works.
    if (!atBottom()) {
      virtualOffset = 0;
      requestRender();
    }
  }

  function rotateBy(delta, event) {
    if (!enhanced() || !atBottom() || !delta) return;
    // Release upward scrolling after returning to the first chapter.
    if (delta < 0 && virtualOffset <= 0) return;
    event.preventDefault();
    virtualOffset = clamp(virtualOffset + delta, 0, travel);
    requestRender();
  }

  function measure() {
    if (reducedMotion.matches) {
      section.classList.remove('is-enhanced');
      return;
    }

    const tallest = Math.max(...chapters.map(chapter => chapter.offsetHeight));
    const windowHeight = Math.ceil(tallest * 2.2);
    if (windowHeight > window.innerHeight * .85) {
      section.classList.remove('is-enhanced');
      return;
    }

    const mobile = window.matchMedia('(max-width: 640px)').matches;
    const tablet = window.matchMedia('(max-width: 1023px)').matches;
    step = Math.ceil(tallest * (mobile ? 1.18 : tablet ? 1.12 : 1.05));
    const progress = virtualOffset / travel;
    travel = Math.ceil(Math.max(
      step * (chapters.length - 1),
      window.innerHeight * (mobile ? 1.4 : tablet ? 2 : 3)
    ));
    section.style.setProperty('--preview-window-height', `${windowHeight}px`);
    section.style.setProperty('--preview-step', `${step}px`);
    virtualOffset = progress * travel;
    section.classList.add('is-enhanced');
    if (footer) {
      // The first chapter is centered in the mask. Account for the empty half
      // of the mask and the footer height so the visible gap is --space-160.
      const emptyHalf = (windowHeight - chapters[0].offsetHeight) / 2;
      section.style.setProperty('--preview-footer-adjustment', `${footer.offsetHeight - emptyHalf}px`);
      section.style.setProperty('--preview-footer-height', `${footer.offsetHeight}px`);
    }
    requestRender();
  }

  reducedMotion.addEventListener('change', measure);
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    rotateBy(event.deltaY * unit, event);
  }, { passive:false });
  window.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest('a, button, input, select, textarea, [contenteditable]')) return;
    const page = window.innerHeight * .7;
    const deltas = { ArrowDown:80, ArrowUp:-80, PageDown:page, PageUp:-page, ' ':event.shiftKey ? -page : page, End:travel - virtualOffset };
    if (event.key in deltas) rotateBy(deltas[event.key], event);
  });
  window.addEventListener('touchstart', event => {
    if (event.touches.length === 1) lastTouchY = event.touches[0].clientY;
  }, { passive:true });
  window.addEventListener('touchmove', event => {
    if (event.touches.length !== 1) return;
    const y = event.touches[0].clientY;
    rotateBy(lastTouchY - y, event);
    lastTouchY = y;
  }, { passive:false });
  window.addEventListener('resize', measure, { passive:true });
  document.fonts?.ready.then(measure);
  measure();
})();
