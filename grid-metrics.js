// Public grid measurement. Load immediately before debug-toolbar.js.
const updateGridMetrics = () => {
  const grid = document.querySelector('.page-grid');
  if (!grid) return null;
  const styles = getComputedStyle(grid);
  const columns = Number.parseInt(styles.getPropertyValue('--grid-columns'), 10) || 1;
  const bounds = grid.getBoundingClientRect();
  const gutter = Number.parseFloat(getComputedStyle(grid).columnGap) || 0;
  const track = (bounds.width - (columns - 1) * gutter) / columns;
  const pitch = track + gutter;
  if (track <= 0 || pitch <= 0) return null;

  document.documentElement.style.setProperty('--grid-track-size', `${track}px`);
  return { columns, gutter, track, pitch };
};

window.addEventListener('resize', updateGridMetrics);

updateGridMetrics();
