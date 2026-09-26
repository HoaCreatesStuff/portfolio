/*
 * This is the board source used by index.html itself: data/quests.js supplies
 * quest content/assets and data/boardConfig.js supplies the fixed board order.
 * Keep player metadata and state maps below separate from the shared game board.
 */
const BOARD_SNAPSHOT = [
  ["ny-eats", "NY Eats", "experience", "icons/ny-eats.png"], ["bodega-cat", "Bodega Cat", "community", "icons/bodega-cat.png"], ["subway-romance", "Subway Romance", "challenges", "icons/subway-romance.png"], ["water-wonders", "Water Wonders", "experience", "icons/waterfront-wonders.png"], ["city-freebies", "City Freebies", "community", "icons/city-freebies.png"],
  ["animal-statue", "Animal Statue", "challenges", "icons/animal-statue.png"], ["time-capsule", "Time Capsule", "experience", "icons/time-capsule.png"], ["park-picnic", "Park Picnic", "community", "icons/park-picnic.png"], ["pup-arazzi", "Pup-arazzi", "challenges", "icons/pup-arazzi.png"], ["hidden-gems", "Hidden Gems", "experience", "icons/hidden-gems.png"],
  ["showtime", "SHOWTIME!", "community", "icons/showtime.png"], ["get-sweaty", "Get Sweaty", "challenges", "icons/get-sweaty.png"], ["golden-hour", "Golden Hour", "experience", "icons/golden-hour.png"], ["art-walk", "Art Walk", "community", "icons/favorite-art.png"], ["street-style", "Street Style", "challenges", "icons/street-fashion.png"],
  ["street-mural", "Street Mural", "experience", "icons/street-mural.png"], ["random-kindness", "Random Kindness", "community", "icons/random-kindness.png"], ["diy-craft", "DIY Craft", "challenges", "icons/diy-craft.png"], ["open-market", "Open Market", "experience", "icons/open-market.png"], ["live-events", "Live Events", "community", "icons/live-events.png"],
  ["off-the-map", "Off the Map", "challenges", "icons/off-the-map.png"], ["cinema-moment", "Cinema Moment", "experience", "icons/cinema-moment.png"], ["nyc-spirit", "NYC Spirit", "community", "icons/nyc-spirit.png"], ["human-pyramid", "Human Pyramid", "challenges", "icons/human-pyramid.png"], ["party-time", "Party Time", "final", "icons/celebrate-together.png"]
];

const BOARD = window.BOARD_ORDER && window.QUESTS
  ? window.BOARD_ORDER.map((id, index) => {
      const quest = window.QUESTS[id];
      return [id, quest.title, window.BOARD_COLORS[index], window.QUEST_ILLUSTRATIONS[id]];
    })
  : BOARD_SNAPSHOT;

const idForTitle = Object.fromEntries(BOARD.map(([id, title]) => [title, id]));

const toPath = (titles) => titles.map((title) => idForTitle[title]);

/* Exact order supplied for the five representative installation IDs. */
const PLAYERS = [
  {
    installationId: "SQ-6F274925", label: "High participation",
    questsCompleted: 23, friendsJoined: 41, color: "#3D3A66",
    descriptor: "Nearly filled the board through sustained participation.",
    path: toPath(["NY Eats", "Art Walk", "Water Wonders", "Golden Hour", "DIY Craft", "Street Mural", "Bodega Cat", "City Freebies", "Animal Statue", "Hidden Gems", "NYC Spirit", "Open Market", "Off the Map", "SHOWTIME!", "Random Kindness", "Get Sweaty", "Park Picnic", "Live Events", "Subway Romance", "Party Time", "Street Style", "Human Pyramid", "Pup-arazzi"]),
    states: {},
    /* Submitted quest-level participation records. */
    questDetails: {
      "ny-eats": { adventureDate: "2026-07-25", friends: 1 }, "art-walk": { adventureDate: "2026-07-25", friends: 1 }, "water-wonders": { adventureDate: "2026-07-25", friends: 1, backfilled: true }, "golden-hour": { adventureDate: "2026-07-26", friends: 5 }, "diy-craft": { adventureDate: "2026-07-27", friends: 1 }, "street-mural": { adventureDate: "2026-07-30", friends: 0 }, "bodega-cat": { adventureDate: "2026-07-31", friends: 1, backfilled: true }, "city-freebies": { adventureDate: "2026-08-01", friends: 2, backfilled: true }, "animal-statue": { adventureDate: "2026-08-04", friends: 1 }, "hidden-gems": { adventureDate: "2026-08-04", friends: 1 }, "nyc-spirit": { adventureDate: "2026-08-08", friends: 1 }, "open-market": { adventureDate: "2026-08-08", friends: 1 }, "off-the-map": { adventureDate: "2026-08-08", friends: 1 }, "showtime": { adventureDate: "2026-08-12", friends: 1 }, "random-kindness": { adventureDate: "2026-08-12", friends: 5 }, "get-sweaty": { adventureDate: "2026-08-14", friends: 0, backfilled: true }, "park-picnic": { adventureDate: "2026-08-16", friends: 5 }, "live-events": { adventureDate: "2026-08-16", friends: 2 }, "subway-romance": { adventureDate: "2026-08-16", friends: 1 }, "party-time": { adventureDate: "2026-08-16", friends: 0 }, "street-style": { adventureDate: "2026-08-16", friends: 5 }, "human-pyramid": { adventureDate: "2026-08-16", friends: 5 }, "pup-arazzi": { adventureDate: "2026-08-16", friends: 0 }
    }
  },
  {
    installationId: "SQ-9A89A48E", label: "Mostly solo",
    questsCompleted: 19, friendsJoined: 15, color: "#648E92",
    descriptor: "Completed many quests, mostly on her own.",
    path: toPath(["Live Events", "Open Market", "Off the Map", "NY Eats", "Art Walk", "Golden Hour", "Pup-arazzi", "City Freebies", "Street Mural", "Street Style", "Hidden Gems", "Water Wonders", "Subway Romance", "Park Picnic", "DIY Craft", "Party Time", "Animal Statue", "Time Capsule", "NYC Spirit"]),
    states: {},
    questDetails: {
      "live-events": { adventureDate: "2026-07-18", friends: 1, backfilled: true }, "open-market": { adventureDate: "2026-07-25", friends: 0, backfilled: true }, "off-the-map": { adventureDate: "2026-07-28", friends: 0 }, "ny-eats": { adventureDate: "2026-07-28", friends: 0 }, "art-walk": { adventureDate: "2026-07-30", friends: 2, backfilled: true }, "golden-hour": { adventureDate: "2026-07-30", friends: 2, backfilled: true }, "pup-arazzi": { adventureDate: "2026-07-30", friends: 0, backfilled: true }, "city-freebies": { adventureDate: "2026-07-31", friends: 1 }, "street-mural": { adventureDate: "2026-07-31", friends: 0, backfilled: true }, "street-style": { adventureDate: "2026-08-08", friends: 2, backfilled: true }, "hidden-gems": { adventureDate: "2026-08-08", friends: 2, backfilled: true }, "water-wonders": { adventureDate: "2026-08-11", friends: 0 }, "subway-romance": { adventureDate: "2026-08-12", friends: 0 }, "park-picnic": { adventureDate: "2026-08-13", friends: 0, backfilled: true }, "diy-craft": { adventureDate: "2026-08-16", friends: 5 }, "party-time": { adventureDate: "2026-08-16", friends: 0 }, "animal-statue": { adventureDate: "2026-08-21", friends: 0, postFinale: true, backfilled: true }, "time-capsule": { adventureDate: "2026-08-21", friends: 0, postFinale: true, backfilled: true }, "nyc-spirit": { adventureDate: "2026-08-22", friends: 0, postFinale: true }
    }
  },
  {
    installationId: "SQ-32345619", label: "Joined late",
    questsCompleted: 14, friendsJoined: 12, color: "#A13F68",
    descriptor: "Joined later and still built meaningful momentum.",
    path: toPath(["Time Capsule", "Get Sweaty", "Live Events", "SHOWTIME!", "Off the Map", "Water Wonders", "NY Eats", "Animal Statue", "Art Walk", "Golden Hour", "Subway Romance", "Street Mural", "Human Pyramid", "Hidden Gems"]),
    states: {},
    questDetails: {
      "time-capsule": { adventureDate: "2026-06-20", friends: 1, backfilled: true }, "get-sweaty": { adventureDate: "2026-07-10", friends: 1, backfilled: true }, "live-events": { adventureDate: "2026-07-19", friends: 2, backfilled: true }, "showtime": { adventureDate: "2026-07-22", friends: 1, backfilled: true }, "off-the-map": { adventureDate: "2026-07-24", friends: 0, backfilled: true }, "water-wonders": { adventureDate: "2026-07-26", friends: 0, backfilled: true }, "ny-eats": { adventureDate: "2026-07-26", friends: 0, backfilled: true }, "animal-statue": { adventureDate: "2026-08-06", friends: 1, backfilled: true }, "art-walk": { adventureDate: "2026-08-08", friends: 1, backfilled: true }, "golden-hour": { adventureDate: "2026-08-09", friends: 1, backfilled: true }, "subway-romance": { adventureDate: "2026-08-15", friends: 0, backfilled: true }, "street-mural": { adventureDate: "2026-08-15", friends: 0, backfilled: true }, "human-pyramid": { adventureDate: "2026-08-22", friends: 3, postFinale: true, backfilled: true }, "hidden-gems": { adventureDate: "2026-08-22", friends: 1, postFinale: true, backfilled: true }
    }
  },
  {
    installationId: "SQ-DA92FDD7", label: "Frequently social",
    questsCompleted: 15, friendsJoined: 36, color: "#8C6018",
    descriptor: "Often turned quests into shared outings.",
    path: toPath(["NYC Spirit", "Park Picnic", "Time Capsule", "Hidden Gems", "Off the Map", "Water Wonders", "Get Sweaty", "Art Walk", "Golden Hour", "Street Style", "Bodega Cat", "City Freebies", "NY Eats", "DIY Craft", "Live Events"]),
    states: {},
    questDetails: {
      "nyc-spirit": { adventureDate: "2026-06-13", friends: 5, backfilled: true }, "park-picnic": { adventureDate: "2026-06-19", friends: 5, backfilled: true }, "time-capsule": { adventureDate: "2026-06-27", friends: 4, backfilled: true }, "hidden-gems": { adventureDate: "2026-07-07", friends: 2, backfilled: true }, "off-the-map": { adventureDate: "2026-07-18", friends: 3, backfilled: true }, "water-wonders": { adventureDate: "2026-07-19", friends: 5, backfilled: true }, "get-sweaty": { adventureDate: "2026-07-19", friends: 3, backfilled: true }, "art-walk": { adventureDate: "2026-07-19", friends: 0, backfilled: true }, "golden-hour": { adventureDate: "2026-07-26", friends: 3, backfilled: true }, "street-style": { adventureDate: "2026-07-26", friends: 0, backfilled: true }, "bodega-cat": { adventureDate: "2026-07-29", friends: 0, backfilled: true }, "city-freebies": { adventureDate: "2026-08-08", friends: 3, backfilled: true }, "ny-eats": { adventureDate: "2026-08-12", friends: 3, backfilled: true }, "diy-craft": { adventureDate: "2026-08-13", friends: 0 }, "live-events": { adventureDate: "2026-08-13", friends: 0 }
    }
  },
  {
    installationId: "SQ-2AD2B054", label: "Post-finale surge",
    questsCompleted: 25, friendsJoined: 27, color: "#B5666D",
    descriptor: "Became much more active after the finale.",
    path: toPath(["Party Time", "Live Events", "Golden Hour", "Art Walk", "Street Style", "Get Sweaty", "Park Picnic", "Street Mural", "City Freebies", "NYC Spirit", "Bodega Cat", "Hidden Gems", "DIY Craft", "Random Kindness", "Off the Map", "Water Wonders", "Cinema Moment", "Open Market", "Time Capsule", "Human Pyramid", "Animal Statue", "NY Eats", "SHOWTIME!", "Pup-arazzi", "Subway Romance"]),
    states: {
      "party-time": "postFinale", "live-events": "postFinale", "golden-hour": "postFinale", "art-walk": "postFinale", "street-style": "postFinale", "get-sweaty": "postFinale", "park-picnic": "postFinale", "street-mural": "postFinale", "city-freebies": "postFinale", "nyc-spirit": "postFinale", "bodega-cat": "postFinale", "hidden-gems": "postFinale", "diy-craft": "postFinale", "random-kindness": "postFinale", "off-the-map": "postFinale", "water-wonders": "postFinale", "cinema-moment": "postFinale", "open-market": "postFinale", "time-capsule": "postFinale", "human-pyramid": "postFinale", "animal-statue": "postFinale", "ny-eats": "postFinale", "showtime": "postFinale", "pup-arazzi": "postFinale", "subway-romance": "postFinale"
    },
    /* Audited post-finale quest metadata supplied for Aug. 31. */
    questDetails: {
      "party-time": { adventureDate: "2026-08-31", friends: 0, postFinale: true }, "live-events": { adventureDate: "2026-08-31", friends: 3, postFinale: true }, "golden-hour": { adventureDate: "2026-08-31", friends: 2, postFinale: true }, "art-walk": { adventureDate: "2026-08-31", friends: 1, postFinale: true }, "street-style": { adventureDate: "2026-08-31", friends: 1, postFinale: true }, "get-sweaty": { adventureDate: "2026-08-31", friends: 1, postFinale: true }, "park-picnic": { adventureDate: "2026-08-31", friends: 3, postFinale: true }, "street-mural": { adventureDate: "2026-08-31", friends: 1, postFinale: true }, "city-freebies": { adventureDate: "2026-08-31", friends: 1, postFinale: true }, "nyc-spirit": { adventureDate: "2026-08-31", friends: 0, postFinale: true }, "bodega-cat": { adventureDate: "2026-08-31", friends: 0, postFinale: true }, "hidden-gems": { adventureDate: "2026-08-31", friends: 0, postFinale: true }, "diy-craft": { adventureDate: "2026-08-31", friends: 1, postFinale: true }, "random-kindness": { adventureDate: "2026-08-31", friends: 0, postFinale: true }, "off-the-map": { adventureDate: "2026-08-31", friends: 1, postFinale: true }, "water-wonders": { adventureDate: "2026-08-31", friends: 0, postFinale: true }, "cinema-moment": { adventureDate: "2026-08-31", friends: 0, postFinale: true }, "open-market": { adventureDate: "2026-08-31", friends: 0, postFinale: true }, "time-capsule": { adventureDate: "2026-08-31", friends: 1, postFinale: true }, "human-pyramid": { adventureDate: "2026-08-31", friends: 3, postFinale: true }, "animal-statue": { adventureDate: "2026-08-31", friends: 3, postFinale: true }, "ny-eats": { adventureDate: "2026-08-31", friends: 1, postFinale: true }, "showtime": { adventureDate: "2026-08-31", friends: 1, postFinale: true }, "pup-arazzi": { adventureDate: "2026-08-31", friends: 2, postFinale: true }, "subway-romance": { adventureDate: "2026-08-31", friends: 1, postFinale: true }
    }
  }
];
