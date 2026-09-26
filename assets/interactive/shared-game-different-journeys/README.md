# Shared game, different journeys

This standalone prototype now uses the original opened-state Summer Quest board as its base.

- The board structure follows `index.html`'s `#questGrid`; the tile markup and title wrapping come from `data/app.js`'s `renderGrid()` and `renderQuestTitle()`.
- The prototype loads the same `data/quests.js` and `data/boardConfig.js` files used by `index.html` for quest titles, order, category colors, and illustration mappings. `data.js` also retains an exact source snapshot solely as a fallback for restricted local previews that block `/data/` scripts. `styles.css` reuses the production opened-state board rules from `style.css`.
- Replace the entries in each player `path` (and the optional `states` maps) when audited event-level journey data is available.
- `script.js` keeps all analytical treatment in `#journey-overlay`; when a player is selected, their matching tiles use the production completed-state treatment while all other tiles remain opened.
- The board uses completed tiles, quiet sequence labels, and limited social markers. `All players` uses density counts rather than layered routes.
