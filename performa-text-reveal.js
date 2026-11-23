(() => {
  const text = document.querySelector('[data-text-reveal]');
  if (!text || !('IntersectionObserver' in window) || !matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

  const original = text.textContent.trim();
  text.setAttribute('aria-label', original);
  const fragment = document.createDocumentFragment();
  original.split(/\s+/).forEach((word, index) => {
    if (index) fragment.append(' ');
    const mask = document.createElement('span');
    mask.className = 'reveal-word';
    mask.setAttribute('aria-hidden', 'true');
    mask.style.setProperty('--word-index', index);
    const inner = document.createElement('span');
    inner.textContent = word;
    mask.append(inner);
    fragment.append(mask);
  });
  text.replaceChildren(fragment);
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      text.classList.add('is-revealed');
      observer.disconnect();
    }
  }, { threshold: 0.15 });
  observer.observe(text);
})();
