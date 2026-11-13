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
