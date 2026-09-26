const prioritizationMatrix = document.querySelector('[data-prioritization-chart]');

if (prioritizationMatrix) {
  const columns = [
    {
      id: 'less-complex', divider: '← Less complex',
      top: { id: 'build-first', label: 'Build first', color: 'blue', features: [['✓', 'Quest board'], ['✓', 'Lightweight onboarding'], ['✓', 'Scoring + ranks'], ['✓', 'Mobile PWA'], ['✓', 'Journal'], ['✓', 'Keepsake'], ['✓', 'Basic usage analytics']] },
      bottom: { id: 'non-essential', label: 'Non-essential', color: 'butter', features: [['×', 'Video support'], ['×', 'Activity suggestions']] },
    },
    {
      id: 'consider-later',
      top: { id: 'consider-later', label: 'Consider later', color: 'lilac', features: [['?', 'Expanded analytics'], ['?', 'Live leaderboard'], ['?', 'Accounts / login'], ['?', 'Cloud sync'], ['?', 'Messaging'], ['?', 'GPS verification'], ['?', 'Community board']] },
    },
  ];

  const element = (name, className, text = '') => {
    const node = document.createElement(name);
    node.className = className;
    node.textContent = text;
    return node;
  };

  const makeSection = (section, position) => {
    const panel = element('section', `mvp-prioritization-matrix__section mvp-prioritization-matrix__section--${position} mvp-prioritization-matrix__section--${section.id} mvp-prioritization-matrix__section--${section.color}`);
    const pills = element('div', 'mvp-prioritization-matrix__pills');
    section.features.forEach(([icon, name]) => {
      const pill = element('span', 'mvp-prioritization-matrix__pill');
      pill.append(element('span', 'mvp-prioritization-matrix__pill-icon', icon), element('span', 'mvp-prioritization-matrix__pill-text', name));
      pills.append(pill);
    });
    panel.append(element('h4', 'mvp-prioritization-matrix__section-label', section.label), pills);
    return panel;
  };

  const stacks = columns.map((column) => {
    const side = column.id === 'less-complex' ? 'left' : 'right';
    const stack = element('section', `mvp-prioritization-matrix__column mvp-prioritization-matrix__${side} mvp-prioritization-matrix__column--${column.id}`);
    stack.append(makeSection(column.top, 'top'));
    if (column.divider) stack.append(element('p', 'mvp-prioritization-matrix__divider', column.divider));
    if (column.bottom) stack.append(makeSection(column.bottom, 'bottom'));
    return stack;
  });

  const valueAxis = element('div', 'mvp-prioritization-matrix__value-axis');
  const valueAxisUnit = element('div', 'mvp-prioritization-matrix__value-axis-unit');
  const valueAxisTopArrow = element('span', 'mvp-prioritization-matrix__value-axis-arrow', '↑');
  const valueAxisLabel = element('span', 'mvp-prioritization-matrix__value-axis-label', 'Value to core experience');
  const valueAxisBottomArrow = element('span', 'mvp-prioritization-matrix__value-axis-arrow', '↓');
  valueAxisTopArrow.setAttribute('aria-hidden', 'true');
  valueAxisBottomArrow.setAttribute('aria-hidden', 'true');
  valueAxisUnit.append(valueAxisTopArrow, valueAxisLabel, valueAxisBottomArrow);
  valueAxis.append(valueAxisUnit);

  prioritizationMatrix.replaceChildren(stacks[0], valueAxis, stacks[1]);
}
