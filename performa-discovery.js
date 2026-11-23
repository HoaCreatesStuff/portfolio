(() => {
  const figure = document.querySelector('.performa-discovery');
  if (!figure) return;

  const svg = figure.querySelector('svg');
  const ns = 'http://www.w3.org/2000/svg';
  const curve = document.createElementNS(ns, 'path');
  const text = document.createElementNS(ns, 'text');
  const textPath = document.createElementNS(ns, 'textPath');
  curve.id = 'discovery-count-curve';
  curve.setAttribute('fill', 'none');
  text.setAttribute('class', 'performa-discovery__curve-count');
  text.setAttribute('aria-hidden', 'true');
  textPath.setAttribute('href', '#discovery-count-curve');
  textPath.setAttribute('startOffset', '50%');
  text.append(textPath);
  svg.append(curve, text);
  const highlightClip = document.createElementNS(ns, 'clipPath');
  highlightClip.id = 'discovery-highlight-clip';
  svg.querySelector('defs').append(highlightClip);
  const highlight = document.createElementNS(ns, 'g');
  highlight.setAttribute('clip-path', 'url(#discovery-highlight-clip)');
  highlight.setAttribute('aria-hidden', 'true');
  highlight.style.pointerEvents = 'none';
  const primaryCircles = [...svg.querySelectorAll('.performa-discovery__primary')];
  primaryCircles.forEach(circle => {
    const copy = circle.cloneNode();
    copy.classList.remove('performa-discovery__primary');
    copy.setAttribute('fill-opacity', '.7');
    highlight.append(copy);
  });
  svg.insertBefore(highlight, svg.querySelector('.performa-discovery__region'));
  let hovered = null;
  let focused = null;
  let pinned = null;
  let current = null;

  const details = figure.querySelector('.performa-discovery__details');
  const detailTitle = details.querySelector('strong');
  const detailText = details.querySelector('span');
  const arcs = [
    'M 113 108 A 97 97 0 0 1 307 108',
    'M 76.377 146.452 A 93.09545 93.09545 0 0 0 148.886 285.741',
    'M 240.914 275.425 A 85.33265 85.33265 0 0 0 323.339 132.661'
  ];
  const channelCounts = ['21 of 22 respondents', '18 of 22 respondents', '15 of 22 respondents'];
  const satelliteCounts = ['7 of 22', '6 of 22', '2 of 22'];

  function show() {
    current?.target.removeAttribute('data-current');
    current = hovered || pinned || focused;
    text.style.display = 'none';
    details.hidden = true;
    figure.toggleAttribute('data-discovery-active', Boolean(current));
    const center = svg.querySelector('.performa-discovery__center');
    center.style.display = !current || current.target.id === 'discovery-region-7' ? '' : 'none';
    svg.querySelector('.performa-discovery__center-count').style.display = current?.target.id === 'discovery-region-7' ? '' : 'none';
    highlightClip.replaceChildren();
    if (!current) return;
    const target = current.target;
    target.setAttribute('data-current', '');
    const channels = [...figure.querySelectorAll('.performa-discovery__channel')];
    let index = channels.indexOf(target);
    if (target.id === 'discovery-region-1') index = 0;
    if (target.id === 'discovery-region-2') index = 1;
    if (target.id === 'discovery-region-4') index = 2;
    const mask = index >= 0 && index < 3 ? 1 << index :
      target.classList.contains('performa-discovery__region') ? Number(target.id.split('-').pop()) : 0;
    [...highlight.children].forEach((circle, circleIndex) => {
      circle.style.display = mask & (1 << circleIndex) ? '' : 'none';
      if (mask & (1 << circleIndex)) highlightClip.append(primaryCircles[circleIndex].cloneNode());
    });
    if (index >= 0 && index < 3) {
      text.classList.remove('performa-discovery__curve-count--satellite');
      curve.setAttribute('d', arcs[index]);
      text.classList.toggle('performa-discovery__curve-count--lower', index > 0);
      textPath.textContent = channelCounts[index];
      text.style.display = '';
      return;
    }
    if (index >= 3) {
      const circle = target.querySelector('circle');
      const x = Number(circle.getAttribute('cx'));
      const y = Number(circle.getAttribute('cy'));
      const radius = Number(circle.getAttribute('r'));
      curve.setAttribute('d', index === 5
        ? `M ${x - radius} ${y} A ${radius} ${radius} 0 0 0 ${x + radius} ${y}`
        : `M ${x - radius} ${y} A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`);
      text.classList.toggle('performa-discovery__curve-count--lower', index === 5);
      text.classList.add('performa-discovery__curve-count--satellite');
      textPath.textContent = satelliteCounts[index - 3];
      text.style.display = '';
      return;
    }
    if (target.classList.contains('performa-discovery__region')) return;
    detailTitle.textContent = target.dataset.title;
    detailText.textContent = target.dataset.detail;
    details.hidden = false;
    const bounds = target.getBoundingClientRect();
    const anchor = current.point || { x: (bounds.left + bounds.right) / 2, top: bounds.top, bottom: bounds.bottom };
    const box = details.getBoundingClientRect();
    const gap = 12;
    const left = Math.max(gap, Math.min(anchor.x - box.width / 2, document.documentElement.clientWidth - box.width - gap));
    const top = anchor.bottom + gap + box.height <= document.documentElement.clientHeight - gap ? anchor.bottom + gap : anchor.top - box.height - gap;
    details.style.transform = 'translate(' + left + 'px, ' + Math.max(gap, top) + 'px)';
  }

  show();

  function atPointer(event) {
    return { x: event.clientX, top: event.clientY, bottom: event.clientY };
  }

  function dismiss() {
    hovered = focused = pinned = null;
    show();
  }

  for (const target of figure.querySelectorAll('[data-discovery-target]')) {
    target.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      hovered = { target, point: atPointer(event) };
      show();
    });
    target.addEventListener('pointerleave', () => {
      if (hovered?.target !== target) return;
      hovered = null;
      show();
    });
    target.addEventListener('focus', () => {
      if (!target.matches(':focus-visible')) return;
      hovered = pinned = null;
      focused = { target };
      show();
    });
    target.addEventListener('blur', () => {
      if (focused?.target !== target) return;
      focused = null;
      show();
    });
    target.addEventListener('click', event => {
      hovered = focused = null;
      pinned = { target, point: event.detail ? atPointer(event) : null };
      show();
    });
    target.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      hovered = null;
      pinned = null;
      focused = { target };
      show();
    });
  }

  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.performa-discovery [data-discovery-target]')) dismiss();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && current) dismiss();
  });
  window.addEventListener('resize', dismiss);
  window.addEventListener('scroll', () => {
    hovered = pinned = null;
    show();
  }, { passive: true });
})();

// Keep SVG text aligned with the site's type sizes as the diagram scales.
document.querySelectorAll('.performa-discovery svg').forEach(svg => {
  const resize = () => {
    const width = svg.getBoundingClientRect().width;
    const bodySize = parseFloat(getComputedStyle(svg).getPropertyValue('--type-body')) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (width && bodySize) svg.style.setProperty('--discovery-label-size', `${bodySize * svg.viewBox.baseVal.width / width}px`);
    const labelSize = parseFloat(getComputedStyle(svg).getPropertyValue('--type-label')) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (width && labelSize) svg.style.setProperty('--discovery-channel-size', `${labelSize * svg.viewBox.baseVal.width / width}px`);
    const metadataSize = parseFloat(getComputedStyle(svg).getPropertyValue('--type-metadata')) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (width && metadataSize) svg.style.setProperty('--discovery-metadata-size', `${metadataSize * svg.viewBox.baseVal.width / width}px`);
  };
  new ResizeObserver(resize).observe(svg);
  resize();
});
