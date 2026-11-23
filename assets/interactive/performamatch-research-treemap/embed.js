(() => {
  document.querySelectorAll('iframe[data-research-treemap]').forEach(frame => {
    let observer;
    function connect() {
      const content = frame.contentDocument?.querySelector('.research');
      if (!content) return;
      observer?.disconnect();
      const resize = () => {
        const height = Math.ceil(content.getBoundingClientRect().height);
        if (height > 0) frame.style.height = `${height}px`;
      };
      observer = new ResizeObserver(resize);
      observer.observe(content);
      resize();
    }
    frame.addEventListener('load', connect);
    connect();
  });
})();

// Match the framework frame to its responsive content, including stacked layouts.
document.querySelectorAll('iframe[title="Interactive PerformaMatch problem-framing layers and research questions"]').forEach(frame => {
  let observer;
  const connect = () => {
    const content = frame.contentDocument?.querySelector('.framing');
    if (!content) return;
    observer?.disconnect();
    const resize = () => { frame.style.height = `${Math.ceil(content.getBoundingClientRect().height)}px`; };
    observer = new ResizeObserver(resize);
    observer.observe(content);
    resize();
  };
  frame.addEventListener('load', connect);
  connect();
});
window.addEventListener('message', event => {
  const frame = document.querySelector('iframe[title="Interactive PerformaMatch problem-framing layers and research questions"]');
  if (!frame || event.source !== frame.contentWindow || event.data?.type !== 'performamatch-framework-height') return;
  const height = Number(event.data.height);
  if (Number.isFinite(height) && height > 0 && height < 10000) frame.style.height = `${height}px`;
});
