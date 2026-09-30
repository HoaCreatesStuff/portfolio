const debugEnabled = new URLSearchParams(window.location.search).get('debug') === 'true';

const updateMasterGridOverlay = () => {
  const metrics = updateGridMetrics();
  const overlay = document.querySelector('.master-grid-debug');
  if (!metrics || !overlay || !document.body.classList.contains('grid-debug-enabled')) return;
  const homepageScene = document.body.classList.contains('homepage-v2') && window.matchMedia('(min-width: 1024px)').matches;
  const scene = homepageScene ? document.querySelector('.home-grid') : null;
  const sceneHeight = scene?.getBoundingClientRect().height;
  const rowTrack = homepageScene && sceneHeight ? sceneHeight / 8 : metrics.pitch;
  const rowCount = homepageScene ? 8 : null;
  const { pitch } = metrics;
  const bounds = overlay.getBoundingClientRect();

  overlay.style.setProperty('--debug-grid-track', `${rowTrack}px`);
  overlay.style.setProperty('--debug-grid-pitch', `${rowTrack}px`);

  let rows = overlay.querySelector('.master-grid-debug__rows');
  if (!rows) {
    rows = document.createElement('div');
    rows.className = 'master-grid-debug__rows';
    rows.setAttribute('aria-hidden', 'true');
    overlay.append(rows);
  }

  const count = rowCount || Math.ceil(bounds.height / pitch) + 1;
  const labels = document.createDocumentFragment();
  for (let index = 0; index < count; index += 1) {
    const label = document.createElement('span');
    label.className = 'master-grid-debug__row-label';
    label.textContent = `R${index + 1}`;
    label.style.top = `${index * rowTrack + 4}px`;
    labels.append(label);
  }
  rows.replaceChildren(labels);
};

window.addEventListener('resize', () => {
  if (debugEnabled) updateMasterGridOverlay();
});

// Controls and saved experiments are gated; grid-metrics.js owns public measurement.
if (debugEnabled) {
  document.body.classList.add('debug-enabled');

  document.querySelectorAll('[data-debug-toggle]').forEach((control) => {
    const stateClass = `${control.dataset.debugToggle}-debug-enabled`;
    const updateControl = () => control.setAttribute('aria-pressed', String(document.body.classList.contains(stateClass)));

    control.addEventListener('click', () => {
      document.body.classList.toggle(stateClass);
      updateControl();
      if (control.dataset.debugToggle === 'grid') updateMasterGridOverlay();
    });

    updateControl();
  });

  document.querySelectorAll('[data-debug-hide]').forEach((control) => {
    control.addEventListener('click', () => {
      control.closest('.debug-toolbar')?.setAttribute('hidden', '');
    });
  });

  const DEBUG_FONT_STORAGE = {
    display: 'portfolio-debug-display-font',
    accent: 'portfolio-debug-accent-font',
  };

  const debugFontOptions = window.DEBUG_FONT_OPTIONS || { display: [], accent: [] };

  const registerDebugFontOptions = (role) => {
    const attribute = role === 'display' ? 'data-display-font' : 'data-accent-font';
    document.querySelectorAll(`select[${attribute}]`).forEach((control) => {
      debugFontOptions[role].forEach((font) => {
        if (control.querySelector(`option[value="${CSS.escape(font.value)}"]`)) return;
        const option = new Option(font.label, font.value);
        option.dataset.debugFontFamily = font.family;
        control.add(option);
      });
    });
  };

  const notifyFontChange = (role, value) => {
    const font = debugFontOptions[role].find((option) => option.value === value);
    const family = font?.family;
    const complete = () => requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('debugfontchange', { detail: { role, value } })));
    if (!family || !document.fonts?.load) return complete();
    document.fonts.load(`${font?.weight || 400} 1em "${family}"`).then(complete, complete);
  };

  const initializeFontSelector = (role, fallback) => {
    const attribute = role === 'display' ? 'data-display-font' : 'data-accent-font';
    registerDebugFontOptions(role);
    document.querySelectorAll(`select[${attribute}]`).forEach((control) => {
      const stored = localStorage.getItem(DEBUG_FONT_STORAGE[role]);
      const initial = [...control.options].some((option) => option.value === stored)
        ? stored
        : document.body.dataset[`${role}Font`] || fallback;
      const update = () => {
        document.body.dataset[`${role}Font`] = control.value;
        localStorage.setItem(DEBUG_FONT_STORAGE[role], control.value);
        notifyFontChange(role, control.value);
      };

      control.value = initial;
      control.addEventListener('change', update);
      update();
    });
  };

  initializeFontSelector('display', 'salute');
  initializeFontSelector('accent', 'debug-accent-missele');

  document.querySelectorAll('select[data-hero-image]').forEach((control) => {
    const image = document.querySelector(control.dataset.heroImageTarget);
    if (!image) return;

    const updateHeroImage = () => {
      const selectedOption = control.selectedOptions[0];
      image.src = selectedOption.dataset.imageSrc;
      document.body.dataset.aboutHeroOption = control.value;
    };

    control.addEventListener('change', updateHeroImage);
    updateHeroImage();
  });

}
