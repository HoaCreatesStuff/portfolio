/* The board beneath this overlay remains the product's opened state at all times. */
const boardElement = document.querySelector("#questGrid");
const boardFrame = document.querySelector("#board-frame");
const journeyOverlay = document.querySelector("#journey-overlay");
const playerList = document.querySelector("#player-list");
const selectionCount = document.querySelector("#selection-count");
const boardNote = document.querySelector("#board-note");
const allButton = document.querySelector("#all-button");

let selectedPlayerId = null;
let showAllPlayers = false;

const playerForId = (id) => PLAYERS.find((player) => player.installationId === id);
const getQuestCell = (questId) => boardElement.querySelector(`[data-quest-id="${questId}"]`);

// Mirrors data/app.js so the board title treatment is the production one.
function renderQuestTitle(title) {
  const titleLines = { "SHOWTIME!": ["SHOW", "TIME!"], "Pup-arazzi": ["Pup-", "arazzi"], "Off the Map": ["Off", "the Map"] };
  return (titleLines[title] || title.split(/\s+/)).map((line) => `<span class="quest-title-word">${line}</span>`).join("");
}

function buildBoard() {
  BOARD.forEach(([id, title, boardColor, illustration]) => {
    const tile = document.createElement("div");
    tile.className = `quest-card board-square--${boardColor}${boardColor === "final" ? " final-quest-card" : ""}`;
    tile.dataset.questId = id;
    tile.setAttribute("aria-label", title);
    tile.innerHTML = `<span class="quest-card__visual is-open"><span class="quest-card-content"><img class="quest-illustration" src="./${illustration}" alt="" aria-hidden="true" /><span class="quest-title">${renderQuestTitle(title)}</span></span></span>`;
    boardElement.appendChild(tile);
  });
}

function miniBoard(player) {
  return BOARD.map(([id]) => {
    const state = player.states[id];
    const social = state === "social" || (player.questDetails?.[id]?.friends || 0) > 0;
    return `<span class="mini-cell${player.path.includes(id) ? " complete" : ""}${social ? " social" : ""}"></span>`;
  }).join("");
}

function buildPlayerCards() {
  PLAYERS.forEach((player) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "player-card";
    card.dataset.playerId = player.installationId;
    card.style.setProperty("--player-color", player.color);
    const friends = player.friendsJoined === null ? "not reported" : `${player.friendsJoined} friends`;
    card.setAttribute("aria-label", `Show ${player.label.toLowerCase()} player journey`);
    card.innerHTML = `<span><span class="player-meta"><span class="player-name">${player.label} player</span></span><span class="descriptor">${player.descriptor}</span><span class="stats"><span><strong>${player.questsCompleted}</strong> quests</span><span><strong>${friends}</strong></span></span></span><span class="mini-board" aria-hidden="true">${miniBoard(player)}</span>`;
    card.addEventListener("click", () => selectPlayer(player.installationId));
    card.addEventListener("mouseenter", () => selectPlayer(player.installationId, false));
    playerList.appendChild(card);
  });
}

function syncOverlayBounds() {
  const gridRect = boardElement.getBoundingClientRect();
  const frameRect = boardFrame.getBoundingClientRect();
  Object.assign(journeyOverlay.style, { left: `${gridRect.left - frameRect.left}px`, top: `${gridRect.top - frameRect.top}px`, width: `${gridRect.width}px`, height: `${gridRect.height}px` });
}

function clearOverlay() {
  journeyOverlay.replaceChildren();
  boardElement.querySelectorAll(".quest-card").forEach((tile) => {
    tile.classList.remove("is-filtered-complete");
    tile.querySelector(".quest-card__visual")?.classList.replace("is-completed", "is-open");
  });
}

function setCompletedStates(player) {
  player.path.forEach((questId) => {
    const tile = getQuestCell(questId);
    tile.classList.add("is-filtered-complete");
    tile.querySelector(".quest-card__visual")?.classList.replace("is-open", "is-completed");
  });
}

function addQuestOverlay(player, questId, sequence) {
  const cell = getQuestCell(questId);
  const grid = boardElement.getBoundingClientRect();
  const rect = cell.getBoundingClientRect();
  const state = player.states[questId];
  const social = state === "social" || (player.questDetails?.[questId]?.friends || 0) > 0;
  const marker = document.createElement("span");
  marker.className = `quest-overlay${state ? ` status-${state}` : ""}`;
  marker.style.setProperty("--player-color", player.color);
  Object.assign(marker.style, { left: `${rect.left - grid.left}px`, top: `${rect.top - grid.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  const status = social
    ? `<span class="status-marker social" title="Social participation"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5.4" cy="5" r="2.1"/><circle cx="10.8" cy="5.7" r="1.7"/><path d="M1.8 13c.2-2.5 1.5-3.8 3.7-3.8s3.5 1.3 3.7 3.8M8.7 13c.15-1.8 1.1-2.8 2.8-2.8 1.5 0 2.4.9 2.6 2.8"/></svg></span>`
    : "";
  marker.innerHTML = `<span class="sequence">${sequence}</span>${status}`;
  journeyOverlay.appendChild(marker);
}

function addAllDensity() {
  BOARD.forEach(([questId]) => {
    const count = PLAYERS.filter((player) => player.path.includes(questId)).length;
    if (!count) return;
    const cell = getQuestCell(questId);
    const grid = boardElement.getBoundingClientRect();
    const rect = cell.getBoundingClientRect();
    const marker = document.createElement("span");
    marker.className = "quest-density";
    marker.textContent = count;
    Object.assign(marker.style, { left: `${rect.left - grid.left + 5}px`, top: `${rect.top - grid.top + 5}px` });
    journeyOverlay.appendChild(marker);
  });
}

function render() {
  syncOverlayBounds(); clearOverlay();
  const player = selectedPlayerId ? playerForId(selectedPlayerId) : null;
  boardFrame.classList.toggle("journey-selected", Boolean(player));
  if (player) {
    setCompletedStates(player);
    player.path.forEach((questId, index) => addQuestOverlay(player, questId, index + 1));
    selectionCount.textContent = `${player.questsCompleted} / 25 logged`;
    boardNote.textContent = player.label === "Post-finale surge" ? "Post-finale activity is shown as a distinct timing pattern across the same shared board." : "Each path uses the same 25-quest board. The overlay highlights one player’s recorded participation pattern.";
  } else if (showAllPlayers) {
    addAllDensity();
    selectionCount.textContent = "Five patterns in view";
    boardNote.textContent = "A light count shows how many of the five recorded paths reached each shared quest.";
  } else {
    selectionCount.textContent = "Select a journey";
    boardNote.textContent = "Select a player to add a temporary analytical layer to the original board.";
  }
  document.querySelectorAll(".player-card").forEach((card) => card.classList.toggle("selected", card.dataset.playerId === selectedPlayerId));
  allButton.classList.toggle("active", showAllPlayers);
  allButton.setAttribute("aria-pressed", String(showAllPlayers));
}

function selectPlayer(id, animate = true) {
  selectedPlayerId = id; showAllPlayers = false; render();
}

allButton.addEventListener("click", () => { selectedPlayerId = null; showAllPlayers = !showAllPlayers; render(); });

new ResizeObserver(render).observe(boardFrame);
buildBoard(); buildPlayerCards(); render();
