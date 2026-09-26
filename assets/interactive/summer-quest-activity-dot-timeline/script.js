// App and journal events begin when reliable collection started on August 5.
const activityData = [
  { date: '2026-07-24', completions: 1, opens: null, journalOpens: null }, { date: '2026-07-25', completions: 5, opens: null, journalOpens: null }, { date: '2026-07-26', completions: 0, opens: null, journalOpens: null }, { date: '2026-07-27', completions: 4, opens: null, journalOpens: null }, { date: '2026-07-28', completions: 4, opens: null, journalOpens: null }, { date: '2026-07-29', completions: 0, opens: null, journalOpens: null }, { date: '2026-07-30', completions: 1, opens: null, journalOpens: null }, { date: '2026-07-31', completions: 4, opens: null, journalOpens: null },
  { date: '2026-08-01', completions: 5, opens: null, journalOpens: null }, { date: '2026-08-02', completions: 1, opens: null, journalOpens: null }, { date: '2026-08-03', completions: 1, opens: null, journalOpens: null }, { date: '2026-08-04', completions: 11, opens: null, journalOpens: null }, { date: '2026-08-05', completions: 1, opens: 6, journalOpens: 0 }, { date: '2026-08-06', completions: 0, opens: 15, journalOpens: 0 }, { date: '2026-08-07', completions: 1, opens: 8, journalOpens: 1 }, { date: '2026-08-08', completions: 4, opens: 13, journalOpens: 1 }, { date: '2026-08-09', completions: 12, opens: 10, journalOpens: 0 }, { date: '2026-08-10', completions: 5, opens: 14, journalOpens: 0 }, { date: '2026-08-11', completions: 13, opens: 11, journalOpens: 4 }, { date: '2026-08-12', completions: 3, opens: 10, journalOpens: 4 }, { date: '2026-08-13', completions: 13, opens: 7, journalOpens: 1 }, { date: '2026-08-14', completions: 6, opens: 10, journalOpens: 2 }, { date: '2026-08-15', completions: 2, opens: 7, journalOpens: 3 }, { date: '2026-08-16', completions: 25, opens: 20, journalOpens: 5 }, { date: '2026-08-17', completions: 0, opens: 4, journalOpens: 0 }, { date: '2026-08-18', completions: 0, opens: 6, journalOpens: 0 }, { date: '2026-08-19', completions: 0, opens: 6, journalOpens: 1 }, { date: '2026-08-20', completions: 0, opens: 5, journalOpens: 0 }, { date: '2026-08-21', completions: 0, opens: 0, journalOpens: 0 }, { date: '2026-08-22', completions: 5, opens: 4, journalOpens: 1 }, { date: '2026-08-23', completions: 1, opens: 4, journalOpens: 0 }, { date: '2026-08-24', completions: 1, opens: 11, journalOpens: 0 }, { date: '2026-08-25', completions: 0, opens: 2, journalOpens: 0 }, { date: '2026-08-26', completions: 0, opens: 6, journalOpens: 0 }, { date: '2026-08-27', completions: 0, opens: 0, journalOpens: 0 }, { date: '2026-08-28', completions: 0, opens: 1, journalOpens: 0 }, { date: '2026-08-29', completions: 0, opens: 0, journalOpens: 0 }, { date: '2026-08-30', completions: 4, opens: 3, journalOpens: 1 }, { date: '2026-08-31', completions: 25, opens: 3, journalOpens: 0 }
];

const plot = document.querySelector('#activityPlot');
const table = document.querySelector('#activityTable');
const formatDate = (date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
const dots = (count, kind) => Array.from({ length: count }, () => `<span class="sq-activity-timeline__dot sq-activity-timeline__dot--${kind}" aria-hidden="true"></span>`).join('');
const dayNumber = (date) => date.slice(-2).replace(/^0/, '');
const isWeekend = (date) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

plot.innerHTML = `
  <div class="sq-activity-timeline__finale-field" style="grid-column:24; grid-row:1 / -1" aria-hidden="true"></div>
  ${activityData.map((day, index) => {
    const isFinale = day.date === '2026-08-16';
    const isFinaleWeekendContinuation = day.date === '2026-08-17';
    const isAugust = day.date === '2026-08-01';
    return `<div class="sq-activity-timeline__day" style="grid-column:${index + 1}" aria-hidden="true">
      <div class="sq-activity-timeline__stack sq-activity-timeline__completion-stack">${dots(day.completions, 'completion')}</div>
      <span class="sq-activity-timeline__date${isAugust ? ' sq-activity-timeline__date--month-start' : ''}${isWeekend(day.date) ? ' sq-activity-timeline__date--weekend' : ''}${isFinaleWeekendContinuation ? ' sq-activity-timeline__date--finale-continuation' : ''}${isFinale ? ' sq-activity-timeline__date--finale' : ''}" data-date="${day.date}">${dayNumber(day.date)}</span>
      <div class="sq-activity-timeline__stack sq-activity-timeline__open-stack">${day.opens === null ? '' : `${dots(day.opens, 'app')}${dots(day.journalOpens ?? 0, 'journal')}`}</div>
    </div>`;
  }).join('')}
  <div class="sq-activity-timeline__annotation sq-activity-timeline__annotation--tracking" style="left:calc((100% / 39) * 12.5)"><span class="sq-activity-timeline__annotation-date">Aug 5</span><p>Data tracking began</p></div>
  <div class="sq-activity-timeline__annotation sq-activity-timeline__annotation--finale" style="left:calc((100% / 39) * 23.5)"><span class="sq-activity-timeline__annotation-date">Aug 16</span><p>Finale</p></div>
  <div class="sq-activity-timeline__annotation sq-activity-timeline__annotation--aug22" style="left:calc((100% / 39) * 29.5)"><span class="sq-activity-timeline__annotation-date">Aug 22</span><p>5 completions<br />4 app opens<br />1 journal review</p></div>
  <div class="sq-activity-timeline__annotation sq-activity-timeline__annotation--end" style="left:calc((100% / 39) * 38.5)"><span class="sq-activity-timeline__annotation-date">Aug 31</span><p>25 completions<br /><span>Mostly one<br />installation</span></p></div>`;

table.innerHTML = `<table><caption>Summer Quest activity by date</caption><thead><tr><th>Date</th><th>Quest completions</th><th>App opens</th><th>Journal reviews</th></tr></thead><tbody>${activityData.map(({ date, completions, opens, journalOpens }) => `<tr><th>${formatDate(date)}</th><td>${completions}</td><td>${opens === null ? 'Not collected' : opens}</td><td>${journalOpens === null ? 'Not collected' : journalOpens}</td></tr>`).join('')}</tbody></table>`;

const reportEmbeddedHeight = () => {
  if (window.parent === window) return;
  window.parent.postMessage({ type: 'summer-quest-activity-timeline-height', height: document.body.scrollHeight }, '*');
};

window.addEventListener('load', reportEmbeddedHeight);
window.addEventListener('resize', reportEmbeddedHeight);
new ResizeObserver(reportEmbeddedHeight).observe(document.body);

const centerFinaleInMobileViewport = () => {
  const scrollContainer = document.querySelector('.sq-activity-timeline__scroll');
  const finaleDate = plot.querySelector('[data-date="2026-08-16"]');
  if (!scrollContainer || !finaleDate || scrollContainer.dataset.initialPositioned === 'true') return;
  if (window.matchMedia('(min-width: 768px)').matches || scrollContainer.scrollWidth <= scrollContainer.clientWidth) return;

  const scrollBounds = scrollContainer.getBoundingClientRect();
  const finaleBounds = finaleDate.getBoundingClientRect();
  const finaleCenter = scrollContainer.scrollLeft + (finaleBounds.left - scrollBounds.left) + (finaleBounds.width / 2);
  const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
  scrollContainer.scrollLeft = Math.min(Math.max(finaleCenter - (scrollContainer.clientWidth / 2), 0), maxScrollLeft);
  scrollContainer.dataset.initialPositioned = 'true';
};

window.addEventListener('load', () => requestAnimationFrame(centerFinaleInMobileViewport), { once: true });
