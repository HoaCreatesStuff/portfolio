window.addEventListener('message', (event) => {
  const { data } = event;
  if (!data || data.type !== 'summer-quest-activity-timeline-height' || !Number.isFinite(data.height)) return;

  const iframe = document.querySelector('.outcomes-activity-timeline iframe');
  if (!iframe || event.source !== iframe.contentWindow) return;

  iframe.style.height = `${Math.ceil(data.height)}px`;
});
