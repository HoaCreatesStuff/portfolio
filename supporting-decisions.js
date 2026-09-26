const supportingDecisions = document.querySelector('.supporting-decisions');
const supportingDecisionsToggle = supportingDecisions?.querySelector('.supporting-decisions-toggle');
const supportingDecisionPanels = supportingDecisions?.querySelectorAll('.supporting-decision-panel');
const supportingDecisionRows = supportingDecisions?.querySelectorAll('.supporting-decision-row');

if (supportingDecisions && supportingDecisionsToggle && supportingDecisionPanels && supportingDecisionRows) {
  const toggleSupportingDecisions = () => {
    const expanded = supportingDecisionsToggle.getAttribute('aria-expanded') === 'true';
    supportingDecisionsToggle.setAttribute('aria-expanded', String(!expanded));
    supportingDecisions.dataset.expanded = String(!expanded);
    supportingDecisionPanels.forEach((panel) => { panel.hidden = expanded; });
  };

  supportingDecisionsToggle.addEventListener('click', toggleSupportingDecisions);
  supportingDecisionRows.forEach((row) => row.addEventListener('click', toggleSupportingDecisions));
}
