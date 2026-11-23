(() => {
  'use strict';
  // All editorial content, counts, palette, and grouping live here.
  const RESEARCH = {
    name: 'FOUNDATIONAL RESEARCH',
    headline: 'Research scope · {total} inputs',
    interaction: 'Directional sample, not statistically representative. Hover, focus, or tap a method to explore.',
    children: [
      {
        id: 'secondary', name: 'SECONDARY RESEARCH SOURCES', count: 28, unit: '', color: '#C5B8D6', layoutOrder: 2,
        children: [
          { name: 'Casting-side workflows', count: 8, unit: 'sources' },
          { name: 'Access, inequity + barriers', count: 7, unit: 'sources' },
          { name: 'Discovery + application behavior', count: 6, unit: 'sources' },
          { name: 'AI trust + agency', count: 4, unit: 'sources' },
          { name: 'Pricing + value', count: 3, unit: 'sources' }
        ]
      },
      {
        id: 'survey', name: 'PERFORMER SURVEY RESPONSES', count: 22, unit: '', color: '#B4C7D9', layoutOrder: 0,
        children: [
          { name: 'Early career', count: 11, unit: 'responses' },
          { name: 'Working artist', count: 6, unit: 'responses' },
          { name: 'Established', count: 3, unit: 'responses' },
          { name: 'On pause / in transition', count: 2, unit: 'responses' }
        ]
      },
      {
        id: 'competitors', name: 'COMPETITOR REVIEWS', count: 12, unit: '', color: '#DDB9C5', layoutOrder: 1,
        children: [
          { name: 'Casting platforms', count: 6 },
          { name: 'Adjacent casting models', count: 4 },
          { name: 'Discovery channels', count: 2 }
        ]
      },
      {
        id: 'interviews', name: 'TARGET PERFORMER INTERVIEWS', count: 4, unit: 'interviews', color: '#EBD9A4', layoutOrder: 3,
        compact: true,
        children: [
          { name: 'Early career', count: 2, unit: 'interviews' },
          { name: 'Working artist', count: 1, unit: 'interview' },
          { name: 'Established', count: 1, unit: 'interview' }
        ]
      },
      {
        id: 'supplemental', name: 'CASTING-SIDE INPUTS', count: 3, unit: 'inputs', color: '#F2B07F', layoutOrder: 4,
        compact: true,
        children: [
          { name: 'Casting-side survey', count: 2, unit: 'responses' },
          { name: 'Artist turned director / casting interview', count: 1, unit: 'interview' }
        ]
      }
    ]
  };

  const isEmbedded = new URLSearchParams(location.search).get('embed') === '1';
  document.documentElement.classList.toggle('is-embedded', isEmbedded);
  const map = document.querySelector('.treemap');
  const overview = document.querySelector('.mobile-overview');
  const announcement = document.querySelector('#announcement');
  const mobile = matchMedia('(max-width: 760px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Optional local review URL; the operating-system setting works independently.
  const forceReduced = new URLSearchParams(location.search).get('motion') === 'reduce';
  const total = RESEARCH.children.reduce((sum, method) => sum + method.count, 0);
  const elements = new Map();
  let active = null;
  let inputMode = 'pointer';
  let lastWidth = -1;

  for (const [id, text] of Object.entries({
    'research-title': RESEARCH.headline.replace('{total}', total),
    'interaction-note': isEmbedded ? 'Directional sample, not statistically representative. Tap or hover to explore.' : RESEARCH.interaction
  })) document.getElementById(id).textContent = text;

  function tone(hex, index) {
    // Stay in the parent family: alternate small light/dark shifts, never white.
    const shift = [0.045, -0.035, 0.085, -0.065, 0.015][index % 5];
    const rgb = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16));
    return `rgb(${rgb.map(value => Math.round(shift >= 0 ? value + (255 - value) * shift : value * (1 + shift))).join(' ')})`;
  }

  const valueOf = children => children.reduce((sum, child) => sum + child.count, 0);
  const displayName = child => child.name === 'Artist turned director / casting interview'
    ? 'Artist → director / casting' : child.name;
  const levelTwoLabel = child => `${displayName(child)} (${child.count})`;
  function row(x, y, width, height, children) {
    const total = valueOf(children);
    let offset = x;
    return children.map(child => {
      const childWidth = width * child.count / total;
      const rect = { x: offset, y, width: childWidth, height };
      offset += childWidth;
      return rect;
    });
  }
  function stack(x, y, width, height, children) {
    const total = valueOf(children);
    let offset = y;
    return children.map(child => {
      const childHeight = height * child.count / total;
      const rect = { x, y: offset, width, height: childHeight };
      offset += childHeight;
      return rect;
    });
  }
  function layoutSurveyThreeBands(x, y, width, height, children) {
    const bottom = children.slice(2);
    const total = valueOf(children);
    const topHeight = height * children[0].count / total;
    const middleHeight = height * children[1].count / total;
    return [
      { x, y, width, height: topHeight },
      { x, y: y + topHeight, width, height: middleHeight },
      ...row(x, y + topHeight + middleHeight, width,
        height - topHeight - middleHeight, bottom)
    ];
  }
  function layoutThreeBands(x, y, width, height, children) {
    const top = [children[0], children[2]];
    const middle = children[1];
    const bottom = children.slice(3);
    const total = valueOf(children);
    const topHeight = height * valueOf(top) / total;
    const middleHeight = height * middle.count / total;
    const topRects = row(x, y, width, topHeight, top);
    const bottomRects = row(x, y + topHeight + middleHeight, width,
      height - topHeight - middleHeight, bottom);
    return [topRects[0], { x, y: y + topHeight, width, height: middleHeight },
      topRects[1], ...bottomRects];
  }
  function layoutMajorPlusBottomRow(x, y, width, height, children) {
    const topHeight = height * children[0].count / valueOf(children);
    return [{ x, y, width, height: topHeight },
      ...row(x, y + topHeight, width, height - topHeight, children.slice(1))];
  }
  function layoutSecondLevel(method, x, y, width, height) {
    const children = method.children;
    switch (method.id) {
      case 'survey': return layoutSurveyThreeBands(x, y, width, height, children);
      case 'secondary': return layoutThreeBands(x, y, width, height, children);
      case 'competitors': return layoutMajorPlusBottomRow(x, y, width, height, children);
      case 'interviews': return stack(x, y, width, height, children);
      case 'supplemental': return stack(x, y, width, height, children);
      default: return row(x, y, width, height, children);
    }
  }

  if (isEmbedded) {
    const labelBreaks = {
      secondary: 'SECONDARY RESEARCH SOURCES',
      survey: 'PERFORMER SURVEY RESPONSES',
      competitors: 'COMPETITOR REVIEWS',
      interviews: 'TARGET PERFORMER INTERVIEWS',
      supplemental: 'CASTING-SIDE INPUTS'
    };
    const tiles = new Map();
    let activeId = null;
    function setEmbeddedActive(id) {
      if (activeId === id) return;
      activeId = id;
      for (const [key, entry] of tiles) {
        const open = key === id;
        entry.tile.classList.toggle('is-active', open);
        entry.toggle.setAttribute('aria-expanded', String(open));
        entry.details.setAttribute('aria-hidden', String(!open));
      }
      const method = RESEARCH.children.find(item => item.id === id);
      announcement.textContent = method
        ? `${method.name}. ${method.children.map(child => `${child.name}: ${child.count}${child.unit ? ` ${child.unit}` : ''}`).join('. ')}.`
        : '';
    }
    RESEARCH.children.forEach(method => {
      const tile = document.createElement('section');
      tile.className = `research-tile${method.compact ? ' research-tile--compact' : ''}`;
      tile.style.setProperty('--family', method.color);
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'research-tile__toggle';
      toggle.setAttribute('aria-label', `${method.name}, ${method.count}. Show research breakdown`);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', `${method.id}-embedded-details`);
      const count = document.createElement('span');
      count.className = 'research-tile__count';
      count.textContent = method.count;
      const name = document.createElement('span');
      name.className = 'research-tile__name';
      name.textContent = labelBreaks[method.id] || method.name;
      toggle.append(count, name);
      const details = document.createElement('div');
      details.className = 'research-tile__details';
      details.id = `${method.id}-embedded-details`;
      details.setAttribute('aria-hidden', 'true');
      const childCells = method.children.map((child, index) => {
        const cell = document.createElement('div');
        cell.className = 'research-tile__child';
        if (method.id === 'supplemental') cell.classList.add('research-tile__child--casting');
        cell.style.setProperty('--tone', tone(method.color, index));
        const childName = document.createElement('span');
        childName.className = 'research-tile__child-name';
        childName.textContent = levelTwoLabel(child);
        cell.append(childName);
        details.append(cell);
        return cell;
      });
      tile.append(toggle, details);
      map.append(tile);
      tiles.set(method.id, { tile, toggle, details, childCells });
      tile.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'touch') setEmbeddedActive(method.id);
      });
      tile.addEventListener('pointerleave', event => {
        if (event.pointerType !== 'touch' && activeId === method.id) setEmbeddedActive(null);
      });
      let touchDown = false;
      toggle.addEventListener('pointerdown', event => { touchDown = event.pointerType === 'touch'; });
      toggle.addEventListener('focus', () => {
        if (!touchDown) setEmbeddedActive(method.id);
      });
      toggle.addEventListener('click', event => {
        if (touchDown || event.pointerType === 'touch') setEmbeddedActive(activeId === method.id ? null : method.id);
        else setEmbeddedActive(method.id);
        touchDown = false;
      });
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') setEmbeddedActive(null);
    });

    // Give the smallest categories enough space for their labels while keeping
    // their areas closer to their actual counts.
    const root = d3.hierarchy({ children: RESEARCH.children }, data => data.children === RESEARCH.children ? data.children : null)
      .sum(data => data.count ? Math.max(data.count, 8) : 0).sort((a, b) => a.data.layoutOrder - b.data.layoutOrder);
    let previousWidth = -1;
    let previousHeight = -1;
    function layoutEmbedded(width, height) {
      if (width < 1 || height < 1 || (Math.abs(width - previousWidth) < 0.5 && Math.abs(height - previousHeight) < 0.5)) return;
      previousWidth = width;
      previousHeight = height;
      d3.treemap().size([width, height]).paddingInner(4)(root);
      root.children.forEach((node, index) => {
        // At narrow widths, two equal columns provide room for whole labels.
        if (width < 400) {
          const gap = 4, column = (width - gap) / 2, rowHeight = (height - 2 * gap) / 3;
          node.x0 = (index % 2) * (column + gap); node.x1 = node.x0 + column;
          node.y0 = Math.floor(index / 2) * (rowHeight + gap); node.y1 = node.y0 + rowHeight;
          if (index === 4) { node.x0 = 0; node.x1 = width; }
        }
        const entry = tiles.get(node.data.id);
        const tileWidth = node.x1 - node.x0;
        const tileHeight = node.y1 - node.y0;
        entry.tile.style.setProperty('--tile-x', `${node.x0}px`);
        entry.tile.style.setProperty('--tile-y', `${node.y0}px`);
        entry.tile.style.setProperty('--map-width', `${width}px`);
        entry.tile.style.setProperty('--map-height', `${height}px`);
        Object.assign(entry.tile.style, {
          left: `${node.x0}px`, top: `${node.y0}px`,
          width: `${tileWidth}px`, height: `${tileHeight}px`
        });
        layoutSecondLevel(node.data, 0, 0, tileWidth, tileHeight).forEach((child, index) => {
          Object.assign(entry.childCells[index].style, {
            left: `${child.x}px`, top: `${child.y}px`,
            width: `${child.width}px`, height: `${child.height}px`
          });
        });
      });
    }
    new ResizeObserver(([entry]) => layoutEmbedded(entry.contentRect.width, entry.contentRect.height)).observe(map);
    document.fonts?.ready.then(() => layoutEmbedded(map.clientWidth, map.clientHeight));
    layoutEmbedded(map.clientWidth, map.clientHeight);
    return;
  }

  // Calculate the parent composition once in a fixed coordinate system. D3
  // chooses every rectangle; interaction never invokes this layout again.
  // Layout order keeps the supplemental branch compact enough to read.
  const top = d3.hierarchy({ children: RESEARCH.children }, d => d.children === RESEARCH.children ? d.children : null)
    .sum(d => d.count || 0).sort((a, b) => a.data.layoutOrder - b.data.layoutOrder);
  d3.treemap().size([1200, 720]).paddingInner(0)(top);
  const geometry = new Map(top.children.map(node => [node.data.id, node]));

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function setActive(id) {
    if (active === id) return;
    active = id;
    for (const [key, entry] of elements) {
      const open = key === id;
      entry.wrapper.classList.toggle('is-active', open);
      entry.button.setAttribute('aria-expanded', String(open));
      entry.details.setAttribute('aria-hidden', String(!open));
    }
    const method = RESEARCH.children.find(item => item.id === id);
    announcement.textContent = method ? `${method.name}. ${method.children.map(child => `${child.name}${child.count === null ? '' : `: ${child.count}${child.unit ? ` ${child.unit}` : ''}`}`).join('. ')}.${method.provisional ? ` ${method.note}` : ''}` : '';
  }

  RESEARCH.children.forEach(method => {
    const wrapper = element('section', `method${method.compact ? ' compact' : ''}${method.small ? ' small' : ''}`);
    wrapper.dataset.method = method.id;
    wrapper.style.setProperty('--family', method.color);
    const button = element('button', 'method-toggle');
    button.type = 'button';
    button.setAttribute('aria-label', `${method.name}, ${method.count}${method.unit ? ` ${method.unit}` : ''}`);
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `${method.id}-details`);
    const summary = element('span', 'summary');
    summary.setAttribute('aria-hidden', 'true');
    summary.append(element('span', 'count', method.count));
    const words = element('span', 'method-words');
    words.append(element('span', 'method-name', method.name));
    if (method.unit) words.append(element('span', 'method-unit', method.unit));
    summary.append(words);
    button.append(summary);
    const details = element('div', 'details');
    details.id = `${method.id}-details`;
    details.setAttribute('aria-hidden', 'true');
    const childMap = element('ul', 'child-map');
    method.children.forEach((child, index) => {
      const cell = element('li', 'child-cell');
      cell.style.setProperty('--tone', tone(method.color, index));
      cell.append(element('span', 'child-name', levelTwoLabel(child)));
      childMap.append(cell);
    });
    details.append(childMap);
    if (method.provisional) details.append(element('p', 'branch-note', method.note));
    wrapper.append(button, details);
    map.append(wrapper);
    const overviewCell = element('div', `overview-cell${method.small ? ' small' : ''}`, method.count);
    overviewCell.style.setProperty('--family', method.color);
    overview.append(overviewCell);
    elements.set(method.id, { wrapper, button, details, childMap, overviewCell });

    wrapper.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      inputMode = 'pointer';
      setActive(method.id);
    });
    wrapper.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'touch' && inputMode === 'pointer' && active === method.id) setActive(null);
    });
    button.addEventListener('focus', () => {
      if (inputMode === 'keyboard') setActive(method.id);
    });
    button.addEventListener('blur', () => {
      if (inputMode === 'keyboard' && active === method.id) setActive(null);
    });
    button.addEventListener('click', event => {
      // Mouse hover is already open. Touch and keyboard can toggle directly.
      if (inputMode === 'touch' || event.detail === 0) setActive(active === method.id ? null : method.id);
      else setActive(method.id);
    });
  });

  function place(node, rect, width, height) {
    // Half of the 8px divider on each internal edge, independent of scale.
    const left = rect.x0 > 0 ? 4 : 0;
    const right = rect.x1 < 1200 ? 4 : 0;
    const top = rect.y0 > 0 ? 4 : 0;
    const bottom = rect.y1 < 720 ? 4 : 0;
    node.style.left = `${rect.x0 / 1200 * width + left}px`;
    node.style.top = `${rect.y0 / 720 * height + top}px`;
    node.style.width = `${(rect.x1 - rect.x0) / 1200 * width - left - right}px`;
    node.style.height = `${(rect.y1 - rect.y0) / 720 * height - top - bottom}px`;
  }

  function layout() {
    const width = map.clientWidth;
    const height = map.clientHeight;
    for (const method of RESEARCH.children) {
      const entry = elements.get(method.id);
      const rect = geometry.get(method.id);
      if (!mobile.matches) place(entry.wrapper, rect, width, height);
      place(entry.overviewCell, rect, overview.clientWidth, overview.clientHeight);
      const innerWidth = entry.wrapper.clientWidth;
      const innerHeight = entry.wrapper.clientHeight;
      const topInset = 0;
      const bottomInset = method.provisional ? 39 : 0;
      const children = layoutSecondLevel(method, 0, topInset, innerWidth,
        Math.max(1, innerHeight - topInset - bottomInset));
      [...entry.childMap.children].forEach((cell, index) => {
        const child = children[index];
        Object.assign(cell.style, {
          left: `${child.x}px`, top: `${child.y}px`,
          width: `${child.width}px`, height: `${child.height}px`
        });
      });
    }
  }

  document.addEventListener('pointerdown', event => {
    inputMode = event.pointerType === 'touch' ? 'touch' : 'pointer';
    if (!event.target.closest('.method')) setActive(null);
  }, { capture: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' || event.key.startsWith('Arrow')) inputMode = 'keyboard';
    if (event.key === 'Escape') setActive(null);
  });
  document.addEventListener('focusin', event => {
    if (!event.target.closest('.method')) setActive(null);
  });
  function applyMotion() { document.documentElement.classList.toggle('is-reduced', reduced.matches || forceReduced); }
  reduced.addEventListener('change', applyMotion);
  applyMotion();
  mobile.addEventListener('change', () => { lastWidth = -1; layout(); });
  new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    if (Math.abs(width - lastWidth) < 0.5) return;
    lastWidth = width;
    layout();
  }).observe(map);
  layout();
})();
