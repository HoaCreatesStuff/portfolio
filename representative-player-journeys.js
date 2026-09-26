(() => {
  const visual = document.querySelector("[data-representative-journeys]");
  const list = visual?.querySelector(".journey-evidence__list");
  if (!visual || !list || typeof PLAYERS === "undefined" || typeof BOARD === "undefined") return;

  const palette = ["blue", "lilac", "butter", "apricot", "pink"];
  const cellsFor = (player) => BOARD.map(([id]) => {
    const social = (player.states[id] === "social") || (player.questDetails?.[id]?.friends || 0) > 0;
    return `<span class="journey-evidence__cell${player.path.includes(id) ? " is-complete" : ""}${social ? " is-social" : ""}"></span>`;
  }).join("");

  list.innerHTML = PLAYERS.map((player, index) => {
    return `<article class="journey-evidence__row journey-evidence__row--${palette[index]}">
      <div class="journey-evidence__copy">
        <h4>${player.label} player</h4>
        <p>${player.descriptor}</p>
      </div>
      <div class="journey-evidence__board" role="img" aria-label="${player.label} player completed ${player.questsCompleted} of 25 quests">${cellsFor(player)}</div>
    </article>`;
  }).join("");

  const syncSharedBoardSize = () => {
    const tallestCopy = Math.max(...[...list.querySelectorAll(".journey-evidence__copy")].map((copy) => copy.offsetHeight));
    list.style.setProperty("--journey-board-size", `${tallestCopy}px`);
  };
  const resizeObserver = new ResizeObserver(syncSharedBoardSize);
  resizeObserver.observe(list);
  syncSharedBoardSize();
})();
