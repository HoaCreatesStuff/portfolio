(() => {
  const chart = document.querySelector('.performa-priorities');
  if (!chart) return;
  const rows = [...chart.querySelectorAll('.performa-priorities__row')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reveal() {
    chart.classList.add('is-visible');
    if (reduced.matches) return;
    const start = performance.now();
    function frame(now) {
      let complete = true;
      rows.forEach((row, index) => {
        const progress = Math.max(0, Math.min(1, (now - start - index * 45) / 600));
        row.querySelector('.performa-priorities__value').textContent = Math.round(Number(row.dataset.value) * progress) + '% (' + row.dataset.count + '/22)';
        if (progress < 1) complete = false;
      });
      if (!complete) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); reveal(); }
    }, { threshold: 0.15 });
    observer.observe(chart);
  } else reveal();
})();
