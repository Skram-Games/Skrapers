// SKRAPERS — Stage 1 (feed) + Stage 3 (investigation tools)
// Feed, profile, connections and the confidence-not-certainty investigate
// panel. Signals are computed live from account data by
// simulation/investigate.js — nothing here reads acct.isSkraper.

const app = document.getElementById("app");
const accounts = window.SKRAPERS_ACCOUNTS; // mutated in place by loadWorld(), never reassigned
const { computeSignals, computeDeepSignals } = window.SKRAPERS_INVESTIGATE;
const {
  state: gameState,
  flagAccount,
  isSuspended,
  isFalselyFlagged,
  tickWorld,
  resetState,
  resetWorldState,
  isCaseCompleted,
  markCaseCompleted,
  wrongFlagLimitFor,
  FIRST_CASE_ID,
  wrongfulFlagCount,
  recordCaseFailure,
  caseFailureCount,
  deepPullLimitFor,
  deepPullsUsed,
  isDeepInvestigated,
  spendDeepPull,
  spendHintPull,
  toggleRedFlag,
  toggleGreenFlag,
  isRedFlagged,
  isGreenFlagged,
  redFlagCount,
  flaggedPostIds,
  toggleFollow,
  isFollowing,
  toggleAccountTrust,
  isAccountTrusted,
  dmFor,
  toggleSetting,
  isTutorialTipSeen,
  retireTutorialTip,
  skipTutorial,
  recordCaseAction,
  caseActionCount,
  dismissCaseNudge,
  interrogationFor,
  recordInterrogation,
  markCrossCheck,
  recordClosingReport,
  closingReportFor,
  summarizeReports,
  recordCaseRecord,
  recordSecondOpinion,
  dumpWorldExtras,
  loadWorldExtras,
} = window.SKRAPERS_STATE;
const LEADS = window.SKRAPERS_LEADS;
const COMMENTS = window.SKRAPERS_COMMENTS;
const BAIT = window.SKRAPERS_BAIT;

// Item 11: a small, reusable inline-SVG icon set — replaces literal emoji
// used as UI CHROME (buttons, badges, nav) with clean stroke-based icons
// in the "modern social app, currentColor-friendly" spirit, same
// CSS/SVG-drawn-placeholder convention already established by
// CAPTCHA_ICONS below and the ad post-media play-icon svg. Deliberately
// does NOT touch emoji that are in-fiction CONTENT (CAPTCHA_GLYPHS, any
// generated bio/post/comment text) — those stay exactly as authored.
// Every glyph is a 16x16 viewBox, 1.7px stroke, no fill unless the shape
// needs one, sized/colored by the caller via CSS (font-size/color or an
// explicit width/height on the wrapping element).
function svgIcon(inner, extra) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra || ""}>${inner}</svg>`;
}
const ICON = {
  comment: svgIcon(`<path d="M4 5h16v11H8l-4 4V5z"/>`),
  // Item 5: green flag, distinct shape from the red "report" flag below —
  // a checkmark folded into the flag's pennant so it still reads as
  // "authentic" at a glance, not just "flag but green".
  authentic: svgIcon(`<path d="M6 3v18"/><path d="M6 4.5h11l-2.6 3.5L17 11.5H6z"/><path d="M8.3 6.6l1.3 1.4 2.4-2.6" stroke-width="1.5"/>`),
  // Item 4: the red "Report Bot" flag — a plain pennant, kept visually
  // distinct from the green one above by shape as well as color.
  reportBot: svgIcon(`<path d="M6 3v18"/><path d="M6 4.5h12l-3 3.5 3 3.5H6z"/>`),
  search: svgIcon(`<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>`),
  menu: svgIcon(`<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>`),
  close: svgIcon(`<path d="M5 5l14 14"/><path d="M19 5L5 19"/>`),
  pin: svgIcon(`<path d="M12 2c-3 0-5.5 2.3-5.5 5.5 0 3.8 5.5 10.5 5.5 10.5s5.5-6.7 5.5-10.5C17.5 4.3 15 2 12 2z"/><circle cx="12" cy="7.5" r="2"/>`),
  pinOff: svgIcon(`<path d="M12 2c-3 0-5.5 2.3-5.5 5.5 0 3.8 5.5 10.5 5.5 10.5s5.5-6.7 5.5-10.5C17.5 4.3 15 2 12 2z"/><circle cx="12" cy="7.5" r="2"/><path d="M3 3l18 18" stroke="var(--red)"/>`),
  home: svgIcon(`<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>`),
  bell: svgIcon(`<path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z"/><path d="M10 19a2 2 0 0 0 4 0"/>`),
  inbox: svgIcon(`<path d="M4 12h4l1.5 3h5L16 12h4"/><path d="M4 12l1.6-6.5A2 2 0 0 1 7.5 4h9a2 2 0 0 1 1.9 1.5L20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6z"/>`),
  brain: svgIcon(`<path d="M9 4.5a2.6 2.6 0 0 0-2.6 2.6c0 .3 0 .6.1.9A2.6 2.6 0 0 0 5 10.4a2.6 2.6 0 0 0 1.4 2.3 2.8 2.8 0 0 0-.4 1.5A2.8 2.8 0 0 0 8.8 17H9V4.5z"/><path d="M15 4.5a2.6 2.6 0 0 1 2.6 2.6c0 .3 0 .6-.1.9A2.6 2.6 0 0 1 19 10.4a2.6 2.6 0 0 1-1.4 2.3c.3.4.4 1 .4 1.5A2.8 2.8 0 0 1 15.2 17H15V4.5z"/><path d="M9 17v3a1.6 1.6 0 0 0 3.2 0V17"/><path d="M15 17v3a1.6 1.6 0 0 1-3.2 0"/>`),
  shield: svgIcon(`<path d="M12 3l7 3v5.5c0 4.6-3 7.9-7 9-4-1.1-7-4.4-7-9V6z"/><path d="M9 12l2 2 4-4.2"/>`),
  warning: svgIcon(`<path d="M12 4l9 15.5H3L12 4z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none"/>`),
  banned: svgIcon(`<circle cx="12" cy="12" r="8.5"/><path d="M6.5 6.5l11 11"/>`),
  book: svgIcon(`<path d="M4 5.5A2 2 0 0 1 6 4h6v16H6a2 2 0 0 1-2-2z"/><path d="M20 5.5A2 2 0 0 0 18 4h-6v16h6a2 2 0 0 0 2-2z"/>`),
  lock: svgIcon(`<rect x="5.5" y="10.5" width="13" height="9" rx="1.6"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>`),
  lockOpen: svgIcon(`<rect x="5.5" y="10.5" width="13" height="9" rx="1.6"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 6.7-1.4"/>`),
  mail: svgIcon(`<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 6.5l8 6.5 8-6.5"/>`),
  refresh: svgIcon(`<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 20v-4.5h4.5"/>`),
  moon: svgIcon(`<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>`),
  contrast: svgIcon(`<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none"/>`),
  door: svgIcon(`<path d="M14 3.5H7a1.2 1.2 0 0 0-1.2 1.2v14.6A1.2 1.2 0 0 0 7 20.5h7"/><path d="M14 2.5l5 1.8v15.4l-5 1.8z"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none"/>`),
  pen: svgIcon(`<path d="M4 20l1-4.2L15.5 5.3a1.8 1.8 0 0 1 2.5 0l0.7.7a1.8 1.8 0 0 1 0 2.5L8.2 19 4 20z"/>`),
  fire: svgIcon(`<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-3 2-4.8 2.6-7.8C9 9 10 9.8 10.3 8c.6-3 3-4.5 3-4.5-.6 2.4.6 4 2 6 1.2 1.6 2.2 3 2.2 5.5 0 3.4-2.5 6-5.5 6z"/>`),
  chart: svgIcon(`<path d="M4 20V10"/><path d="M11 20V4"/><path d="M18 20v-7"/>`),
  fishingRod: svgIcon(`<path d="M3 21l7-7"/><path d="M8 4l12 5-5 3-3-3z"/><path d="M12 9c1 2 1 5-1 8"/>`),
  chevronLeft: svgIcon(`<path d="M14.5 5L8 12l6.5 7"/>`),
  check: svgIcon(`<path d="M5 12.5l4.5 4.5L19 7"/>`),
  link: svgIcon(`<path d="M9 15l6-6"/><path d="M8 12l-2.5 2.5a3.5 3.5 0 0 0 5 5L13 17"/><path d="M16 12l2.5-2.5a3.5 3.5 0 0 0-5-5L11 7"/>`),
  // Round 27 (#7): the inline "this author's tag network is busy" badge on
  // a post — three linked nodes, same stroke/viewBox convention as above.
  network: svgIcon(`<circle cx="6" cy="17" r="2.4"/><circle cx="18" cy="17" r="2.4"/><circle cx="12" cy="6" r="2.4"/><path d="M10.8 8.1L7.2 14.9"/><path d="M13.2 8.1l3.6 6.8"/><path d="M8.4 17h7.2"/>`),
  // Round 27 (#3): ALGO//'s "current focus" line on Home.
  eye: svgIcon(`<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>`),
  // Round 27 (#6): investigator's notes on a pin.
  note: svgIcon(`<path d="M6 3.5h9l3.5 3.5V20.5H6z"/><path d="M15 3.5V7h3.5"/><path d="M9 11.5h6"/><path d="M9 15h6"/>`),
  // Round 28 (#2): deep investigate — a magnifier with a plus, "look closer".
  scan: svgIcon(`<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/><path d="M10.5 7.8v5.4"/><path d="M7.8 10.5h5.4"/>`),
  // Round 28 (#5): the "I'm stuck" hint.
  bulb: svgIcon(`<path d="M9.5 18h5"/><path d="M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"/>`),
  // Round 28 (#3): engagement history, and the player's recent searches.
  activity: svgIcon(`<path d="M3 12h4l2.5-6 5 12 2.5-6H21"/>`),
  clock: svgIcon(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`),
  // Round 28 (#4): an account's stated location.
  globe: svgIcon(`<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.6 2.6 2.6 14.4 0 17"/><path d="M12 3.5c-2.6 2.6-2.6 14.4 0 17"/>`),
};

// Feature round ("every profile needs a bio"): optional polish — the
// player is a real character too (the CAPTCHA-recruited undercover
// detective the game's own framing is built around), so this gives their
// own profile a short flavor line consistent with that fiction rather than
// leaving it the one profile in the game with nothing.
const PLAYER_BIO = "Passed the test by failing it. Undercover, allegedly.";

// Round 29 (#1): the old one-shot DM phrase bank (DM_PREMADE_MESSAGES) is
// gone — the Message action is now an interrogation whose premade questions
// live beside their answers in game/comments.js (INTERROGATION_QUESTIONS).
// An old save's one-shot exchange (game/state.js's `dms`) still shows,
// read-only, at the top of the panel.

let currentWorld = { kind: "case", caseId: "case001", label: "CASE 001", difficulty: "Easy", accountCount: accounts.length, skraperCount: 1 };
// Feature round (Case Board tabs): the Case Board's pins used to be one
// single Set, cleared every time loadWorld() ran (loadCase -> loadWorld on
// every "start a mission") — so pinning something on Home and then opening
// a Story case silently wiped it. Pins are now kept in separate Sets, one
// per "pin key" — "home" for the endless-scroll world, "case:<id>" for
// each curated case — so switching worlds only switches WHICH set is
// active; nothing is ever cleared by a normal world switch. `pinnedIds`
// stays a plain Set reference for every existing call site (`.has`/`.add`/
// `.delete`) — it's just repointed at the right Set by setActivePinSet()
// instead of being reassigned to a fresh empty one.
let pinSets = { home: new Set() };
let pinnedIds = pinSets.home; // Stage 8 case board — the player's own picks, not an auto-generated list
// Remembers the most recently played case's pin key/label so the Case
// Board can still offer a "Mission" tab after the player has left that
// case and gone back to Home — see renderCaseBoard.
let lastCaseKey = null;
let lastCaseLabel = null;
// Round 27 (#6): the investigator's own free-text note on a pin, keyed the
// same way pin sets are — pinNotes[pinKey][acctId] = "plain string" — so a
// note belongs to that pin in that case (or Home) and nowhere else. Kept
// at module level beside pinSets rather than inside a world snapshot, for
// the same reason pins are: a normal world switch/hot-swap must never
// touch them. unpinAccount() is the one place a pin is removed, and it
// takes the note with it.
let pinNotes = {};
const PIN_NOTE_MAX = 200;
// Round 28 (#1): the player's own evidence links between two pins, with a
// reason — pinLinks[pinKey] = [{ a, b, reason, custom, at }], `a < b` so a
// pair is stored once whichever end it was drawn from. Same ownership model
// as pinNotes above: keyed by pin set, never touched by a world switch or
// hot-swap, removed with either pin by unpinAccount(), and taken with the
// board when a failed case is pulled (failActiveCase).
let pinLinks = {};
const LINK_REASONS = [
  "Same posting-time pattern",
  "Mutual tag",
  "Follows the same account",
  "Near-identical wording",
  "Same metadata tell",
];
const LINK_CUSTOM_MAX = 40;
// Round 28 (#3): the player's own recent search terms, most recent first —
// so they can see their own investigative pattern. A player habit, not
// world state: survives world switches, cleared by a "New investigation".
let recentSearches = [];
const RECENT_SEARCH_MAX = 6;
// Which pin set the Case Board screen is currently showing — independent
// of `pinnedIds`/currentWorld, since the player can open the board and
// flip between Home's and the current mission's pins without switching
// which world is actually loaded.
let boardActiveKey = null;
let currentView = "feed"; // Stage 12: tracked for the Android hardware/gesture back button

// Bug fix (real navigation history): every "Back" button used to hardcode
// one fixed destination (renderFeed(true), or goHome() for renderStory())
// instead of returning to whatever screen the player actually came from —
// so opening a profile from, say, the Case Board or Notifications and then
// hitting Back landed on the raw Feed (or, via renderStory()'s old
// goHome(), silently abandoned an active case) instead of the screen the
// player was actually just on. This is a real back-stack: every
// screen-level render function calls trackScreen() first, recording a
// thunk that can replay it; goBack() pops that stack and replays whatever
// was previously showing, however many screens deep. `navBackInProgress`
// stops that replay from re-pushing the screen it's leaving (which is
// already correctly on the stack, one level up) back onto itself.
let navStack = [];
let activeScreen = null; // { run, key } — the screen currently on-screen
let navBackInProgress = false;

// Called first by every screen-level render function (profile, case board,
// player profile, story, notifications, inbox, bait analytics, epilogue,
// feed). `key` identifies the screen AND, where it matters, which world/
// account it's showing (e.g. "profile:acct42", "feed:case:case001") — an
// in-place refresh of the exact same screen (toggling Follow and
// re-rendering the same profile, switching Case Board tabs, etc.) reuses
// the same key and so is never pushed as a new history entry, only a
// genuine navigation to a different screen is.
//
// Round 27 (bug fix, world-aware history): an entry also remembers WHICH
// world it belongs to when the screen only makes sense inside that world —
// an account profile (its account only exists in one world's roster), a
// world's feed, bait analytics (Home's repliers). Before this, replaying
// such an entry after the player had hot-swapped worlds (Main Feed / Case
// Load / the Home tab) ran it against whichever world happened to be live:
// renderProfile() on an account id the live roster doesn't contain threw
// outright ("Cannot read properties of undefined"), reachable today via the
// Android hardware back button from Home's feed, and — once a failed case
// discards its world (see failActiveCase) — reachable for every player.
// goBack() now hot-swaps back into that entry's world first (the same
// snapshot/restore path Main Feed <-> Case Load already use), or skips the
// entry if that world no longer exists at all.
function worldKeyForScreen(key) {
  return /^(profile:|feed:|bait-analytics|casefile)/.test(key) ? pinKeyFor(currentWorld) : null;
}

function trackScreen(run, key) {
  if (!navBackInProgress && activeScreen && activeScreen.key !== key) {
    navStack.push(activeScreen);
  }
  activeScreen = { run, key, worldKey: worldKeyForScreen(key) };
}

// Makes `worldKey` the live world again for a Back step, without rendering
// anything (the history entry itself does that next). False if that world
// can't be brought back — e.g. a failed case's discarded attempt.
function switchWorldForBack(worldKey) {
  if (worldKey === pinKeyFor(currentWorld)) return true;
  if (!worldSnapshots[worldKey]) return false;
  snapshotCurrentWorld();
  restoreWorldSnapshot(worldKey);
  persistNow();
  return true;
}

// The one shared "Back" action every back-style button calls now, instead
// of a fixed destination. Falls back to Home only when history is empty —
// the very first screen visited this session, or right after a hard reset.
function goBack() {
  navBackInProgress = true;
  try {
    while (navStack.length) {
      const prev = navStack.pop();
      // Going "back" to the exact screen already showing would look like a
      // dead button — possible once forgetWorldHistory() has removed the
      // entries that used to sit between two visits to the same screen
      // (e.g. Case Load -> [discarded case screens] -> Case Load).
      if (activeScreen && prev.key === activeScreen.key && prev.worldKey === activeScreen.worldKey) continue;
      if (prev.worldKey && !switchWorldForBack(prev.worldKey)) continue; // that world is gone — skip past it
      prev.run();
      return;
    }
    goHome();
  } finally {
    navBackInProgress = false;
  }
}

// Drops every history entry tied to a world that has just been discarded
// (a failed case attempt) so it can't be replayed, and so the Android back
// button's "history empty -> exit" check stays honest.
function forgetWorldHistory(worldKey) {
  navStack = navStack.filter((e) => e.worldKey !== worldKey);
  if (activeScreen && activeScreen.worldKey === worldKey) activeScreen = null;
}

// A hard reset ("New investigation"/"Log out") must not leak the previous
// playthrough's back-trail into the fresh one.
function clearNavHistory() {
  navStack = [];
  activeScreen = null;
}

// Stage 13 systemic layers — module-level session state.
let notifications = []; // ALGO//-originated messages ONLY (game/algomsgs.js, epilogue unlock) — the Notifications tab
let inboxMessages = []; // Stage 17: person/account reactions to the player — Trust confrontations, comment-author responses — the Inbox tab
let epilogueUnlocked = false;
let pendingConfrontations = []; // queued Trust "confronted" events awaiting a RESPOND/IGNORE/EXPLAIN choice
let pendingResponseTimers = []; // setTimeout ids for scheduled comment-author responses, so a world switch can clear them

// Stage 15 (navigation/gameplay IA redesign), generalized in the hot-swap
// fix: only one `accounts` array is ever live at a time, so navigating away
// from a world snapshots its entire accumulated state here so it can be
// restored byte-for-byte later instead of being wiped by loadWorld()'s
// resetWorldState(). Originally Home-only (a single `homeSnapshot`); now
// keyed by pinKeyFor(world) — "home" or "case:<id>" — the same key already
// used for pin sets, so ANY world (Home or a curated case) can be left and
// resumed with its flags/visits/pins intact, not just Home. See
// snapshotCurrentWorld()/restoreWorldSnapshot() below.
let worldSnapshots = {};
let homeLoadedCount = 0; // how many of Home's posts are currently rendered (infinite scroll)
let homeBatchCounter = 0; // bumped each time loadMoreIntoFeed() generates another batch of accounts
const HOME_INITIAL_POSTS = 18;
const HOME_BATCH_SIZE = 8;
let homeScrollHandler = null; // the currently-attached infinite-scroll listener, so re-renders don't stack duplicates

// Feature round (Home topbar search): the player's current filter, and
// whether it's active. While active, Home's infinite scroll stops being
// infinite — see renderFeed/loadMoreIntoFeed/updateHomeFeedList below.
// `homeRenderedPosts` is the exact ordered list of posts that have
// actually been appended to the Home feed DOM so far (the initial batch
// plus every loadMoreIntoFeed batch) — search filters THIS, rather than
// recomputing allPostsFeed() (which reshuffles every call), so the
// on-screen order never jumps around while the player types.
let homeSearchQuery = "";
let homeSearchActive = false;
let homeRenderedPosts = [];

// Bug fix (scroll-scoping): the infinite-scroll listener above is bound to
// `window`, so it has to be explicitly detached the instant the player
// navigates to ANY screen other than Home — otherwise it stays live in the
// background, and an ordinary scroll on Notifications/Inbox/Board/Profile/
// Story fires it just the same. Since currentWorld.kind doesn't change on a
// same-world view navigation (only loadWorld() changes it), a leftover
// handler would still pass loadMoreIntoFeed()'s "are we on Home" guard and
// run for real — mutating the live world and, whenever its own auto-event
// roll happened to fire, calling renderFeed() itself, which is exactly the
// "scrolling anywhere jumps back to Home" bug. Every non-Home render
// function below calls this first so the handler can only ever be alive
// while Home is actually the screen on screen.
function detachHomeScrollHandler() {
  if (homeScrollHandler) {
    window.removeEventListener("scroll", homeScrollHandler);
    homeScrollHandler = null;
  }
}

// Stage 12: gathers everything needed to rebuild the current session
// (which world, player progress, pins, the adaptive algo's profile) and
// writes it via game/persist.js. Cheap enough to call after every
// meaningful action rather than batching or debouncing.
function persistNow() {
  const algo = window.SKRAPERS_ALGO;
  // Stage 15: a case world still rebuilds deterministically from its id
  // (curated cases don't accumulate the kind of organic drift Home does).
  // Procedural (Home) and daily worlds now snapshot their FULL, mutated
  // `accounts` array directly — replaying generateWorld(seed) on reload
  // was silently discarding tickWorld growth posts, Trust "noticed"
  // posts and triggered-event posts, none of which were ever actually
  // being persisted.
  const worldSave =
    currentWorld.kind === "case"
      ? { kind: "case", caseId: currentWorld.caseId }
      : {
          kind: currentWorld.kind,
          meta: { ...currentWorld },
          accounts,
          homeLoadedCount: currentWorld.kind === "procedural" ? homeLoadedCount : undefined,
          homeBatchCounter: currentWorld.kind === "procedural" ? homeBatchCounter : undefined,
        };
  window.SKRAPERS_PERSIST.save({
    seenCaptcha: true,
    world: worldSave,
    // Hot-swap fix: every world currently hot-swapped away (Home, or a case
    // left via the Main Feed / Case Load buttons), not just Home — so
    // reloading mid-hot-swap doesn't silently lose whichever side isn't
    // the active world right now. See worldSnapshots/snapshotCurrentWorld.
    worldSnapshots: Object.fromEntries(
      Object.entries(worldSnapshots).map(([k, snap]) => [
        k,
        {
          kind: snap.kind,
          accounts: snap.accounts,
          meta: snap.meta,
          flagged: snap.flagged,
          postFlags: snap.postFlags,
          visits: snap.visits,
          loadedCount: snap.loadedCount,
          batchCounter: snap.batchCounter,
          deepInvestigated: snap.deepInvestigated,
          caseHints: snap.caseHints,
          extras: snap.extras,
        },
      ])
    ),
    credibility: gameState.credibility,
    flagged: gameState.flagged,
    // Round 28 (#2/#5): the live world's spent deep-investigate pulls and
    // bought hints — saved beside `flagged`, and for the same reason: a
    // case world rebuilds from its id on reload, but what the player spent
    // in it has to come back with it.
    deepInvestigated: gameState.deepInvestigated,
    caseHints: gameState.caseHints,
    // Round 29: the live world's interrogations, closing reports, rival
    // call, ALGO// pre-flag and timeline flag — one bundle, saved beside
    // `flagged` for the same reason (game/state.js's WORLD_EXTRA_KEYS).
    worldExtras: dumpWorldExtras(),
    caseRecords: gameState.caseRecords,
    secondOpinionHistory: gameState.secondOpinionHistory,
    visits: gameState.visits,
    completedCases: gameState.completedCases,
    postFlags: gameState.postFlags,
    removedBots: gameState.removedBots,
    following: gameState.following,
    trustedAccounts: gameState.trustedAccounts,
    dms: gameState.dms,
    termsRushed: gameState.termsRushed,
    failedCaseAttempts: gameState.failedCaseAttempts,
    securityGotcha: gameState.securityGotcha,
    settings: gameState.settings,
    tutorial: gameState.tutorial,
    // Feature round: every pin set, not just one shared list — see the
    // pinSets comment near the top of this file.
    pinSets: Object.fromEntries(Object.entries(pinSets).map(([k, v]) => [k, [...v]])),
    pinNotes,
    pinLinks,
    recentSearches,
    focusNudge,
    lastCaseKey,
    lastCaseLabel,
    algo: {
      investigations: algo.profile.investigations,
      correctFlags: algo.profile.correctFlags,
      wrongFlags: algo.profile.wrongFlags,
      signalGlances: { ...algo.profile.signalGlances },
      archetypeCatches: { ...algo.profile.archetypeCatches },
      cleanCatches: algo.profile.cleanCatches,
      luckyCatches: algo.profile.luckyCatches,
    },
    reputation: { ...window.SKRAPERS_REPUTATION.rep },
    trust: window.SKRAPERS_TRUST.dump(),
    algomsgs: window.SKRAPERS_ALGOMSGS.dump(),
    leads: LEADS.dump(),
    comments: COMMENTS.dump(),
    bait: BAIT.dump(),
    notifications,
    inboxMessages,
    epilogueUnlocked,
    lastSeen: Date.now(),
  });
}

// Feature round (Case Board tabs): "home" for the endless-scroll world,
// "case:<id>" for a curated case — see the pinSets comment above.
function pinKeyFor(world) {
  if (world && world.kind === "case") return `case:${world.caseId}`;
  return "home";
}

function ensurePinSet(key) {
  if (!pinSets[key]) pinSets[key] = new Set();
  return pinSets[key];
}

function setActivePinSet(key) {
  pinnedIds = ensurePinSet(key);
}

// Feature round ("mark as trusted removes from the pin board"): a one-way
// action — turning account-level trust ON strips that account out of
// EVERY pin set it currently appears in (Home's and any mission's — see
// the pinSets comment near the top of this file), not just whichever one
// is active right now. Un-trusting later does NOT re-pin it; this is
// deliberately one-directional ("trusting someone takes them off your
// suspect board"), not a toggle-linked pair.
function removeAccountFromAllPinSets(acctId) {
  let removedFromActive = false;
  Object.entries(pinSets).forEach(([key, set]) => {
    if (set.has(acctId)) {
      unpinAccount(key, acctId);
      if (pinnedIds === set) removedFromActive = true;
    }
  });
  return removedFromActive;
}

// Round 27 (#6): the ONE place a pin is removed — from any pin set, from
// any screen (profile quick-pin, Investigate panel, Case Board, Mark as
// Trusted) — so its board position and its investigator's note always
// leave with it, instead of each call site remembering to clean up (the
// old call sites each deleted pinPositions by hand; one forgot).
function unpinAccount(key, acctId) {
  ensurePinSet(key).delete(acctId);
  delete pinPositions[acctId];
  if (pinNotes[key]) {
    delete pinNotes[key][acctId];
    if (!Object.keys(pinNotes[key]).length) delete pinNotes[key];
  }
  // Round 28 (#1): a link needs both ends on the board.
  if (pinLinks[key]) {
    pinLinks[key] = pinLinks[key].filter((l) => l.a !== acctId && l.b !== acctId);
    if (!pinLinks[key].length) delete pinLinks[key];
  }
}

// Round 28 (#1): evidence links between two pins of the same board.
function linksFor(key) {
  return pinLinks[key] || [];
}

function linkPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

// Adds (or re-labels, if the pair is already linked) a link. Both ends must
// be pinned in that board, the ends must differ, and the reason must be
// non-empty — a preset from LINK_REASONS or the player's own short text.
function addPinLink(key, idA, idB, reason, custom) {
  const set = ensurePinSet(key);
  if (!idA || !idB || idA === idB || !set.has(idA) || !set.has(idB)) return false;
  const clean = String(reason || "").trim().slice(0, custom ? LINK_CUSTOM_MAX : 80);
  if (!clean) return false;
  const [a, b] = linkPair(idA, idB);
  const list = (pinLinks[key] = pinLinks[key] || []);
  const existing = list.find((l) => l.a === a && l.b === b);
  if (existing) {
    existing.reason = clean;
    existing.custom = !!custom;
  } else {
    list.push({ a, b, reason: clean, custom: !!custom, at: Date.now() });
  }
  return true;
}

function removePinLink(key, idA, idB) {
  const [a, b] = linkPair(idA, idB);
  if (!pinLinks[key]) return false;
  const before = pinLinks[key].length;
  pinLinks[key] = pinLinks[key].filter((l) => !(l.a === a && l.b === b));
  if (!pinLinks[key].length) delete pinLinks[key];
  return before !== (pinLinks[key] ? pinLinks[key].length : 0);
}

function pinNoteFor(key, acctId) {
  return (pinNotes[key] && pinNotes[key][acctId]) || "";
}

// Plain string, trimmed, capped at PIN_NOTE_MAX; empty clears it. Only a
// currently-pinned account can carry a note.
function setPinNote(key, acctId, text) {
  if (!ensurePinSet(key).has(acctId)) return false;
  const clean = String(text || "").trim().slice(0, PIN_NOTE_MAX);
  if (!clean) {
    if (pinNotes[key]) delete pinNotes[key][acctId];
    return true;
  }
  pinNotes[key] = pinNotes[key] || {};
  pinNotes[key][acctId] = clean;
  return true;
}

// The account list to draw a given pin key's pins FROM. For the world
// that's actually live right now this is just `accounts`; for any other
// pin key it's rebuilt/recalled without touching the live world — a
// hot-swapped-away world (Home or a case) falls back to its own snapshot
// (see worldSnapshots/snapshotCurrentWorld) if one exists, and a case with
// no snapshot yet rebuilds deterministically from its id.
function accountsForPinKey(key) {
  if (key === pinKeyFor(currentWorld)) return accounts;
  if (worldSnapshots[key]) return worldSnapshots[key].accounts;
  if (key === "home") return [];
  if (key.indexOf("case:") === 0) {
    try {
      const def = window.SKRAPERS_CASES.getCase(key.slice(5));
      return def.build();
    } catch (e) {
      return [];
    }
  }
  return [];
}

function pinLabelFor(key) {
  if (key === "home") return `${ICON.home} Home`;
  if (key === pinKeyFor(currentWorld)) return `${ICON.pin} ${currentWorld.label}`;
  if (key === lastCaseKey && lastCaseLabel) return `${ICON.pin} ${lastCaseLabel}`;
  return `${ICON.pin} Mission`;
}

// Stage 6: swap the entire account roster for a new one (curated case or
// a freshly generated procedural world), in place — `accounts` is a
// const binding to one array, so every other function that captured that
// reference keeps working without restructuring.
function loadWorld(newAccounts, meta) {
  accounts.length = 0;
  accounts.push(...newAccounts);
  // Stage 15: credibility/reputation are now persistent player stats that
  // survive navigating between worlds — only the per-world flagged/visits
  // state resets here. Full resetState() (which also zeroes credibility)
  // is reserved for a deliberate "New investigation" (resetSession).
  resetWorldState();
  currentWorld = meta;
  activeEvent = null;
  // Feature round: switch WHICH pin set is active rather than clearing it —
  // a case's own pins (and Home's) now survive normal world switches. See
  // the pinSets comment near the top of this file.
  setActivePinSet(pinKeyFor(meta));
  // A genuine world switch defaults the Case Board back to whichever pin
  // set belongs to the world just entered, the next time it's opened —
  // but see renderCaseBoard's own tab clicks/view-mode toggles, which
  // don't go through loadWorld and so leave this alone (sticky within one
  // board session).
  boardActiveKey = null;
  if (meta.kind === "case") {
    lastCaseKey = pinKeyFor(meta);
    lastCaseLabel = meta.label;
  }
  if (meta.kind !== "procedural") {
    homeLoadedCount = 0;
    homeBatchCounter = 0;
  }
  renderFeed(false);
  persistNow();
}

// Hot-swap fix: snapshots whichever world is CURRENTLY active (Home or a
// case), keyed the same way pin sets already are (pinKeyFor), so it can be
// restored byte-for-byte later — scroll depth/generated batches, red/green
// post flags, formal flags, visit count — instead of being wiped by
// loadWorld()'s resetWorldState() the moment the player switches away.
// Generalizes the old Home-only homeSnapshot/snapshotHomeIfActive: this is
// now the ONE snapshot mechanism both Home and every case share, so
// "Main Feed" <-> "Case Load" hot-swapping preserves both sides, not just
// Home. Deliberately does NOT touch pin sets — those already survive a
// normal world switch on their own (see the pinSets comment near the top
// of this file) and are never cleared by loadWorld().
function snapshotCurrentWorld() {
  const key = pinKeyFor(currentWorld);
  worldSnapshots[key] = {
    kind: currentWorld.kind,
    accounts: accounts.map((a) => ({ ...a, posts: a.posts.map((p) => ({ ...p })) })),
    meta: { ...currentWorld },
    flagged: { ...gameState.flagged },
    // Bug fix: the original homeSnapshot never carried postFlags, so even
    // Home's own hot-swap silently dropped every red/green post flag —
    // included here so hot-swapping preserves them for every world.
    postFlags: Object.fromEntries(Object.entries(gameState.postFlags || {}).map(([id, e]) => [id, { ...e, red: [...e.red] }])),
    visits: gameState.visits,
    loadedCount: homeLoadedCount,
    batchCounter: homeBatchCounter,
    // Round 28 (#2/#5): pulls spent and hints bought travel with the world,
    // like its flags — hot-swapping out and back never refunds or loses one.
    deepInvestigated: { ...(gameState.deepInvestigated || {}) },
    caseHints: (gameState.caseHints || []).map((h) => ({ ...h })),
    // Round 29: interrogations, closing reports, the rival's call, ALGO//'s
    // pre-flag — all per-world, all carried the same way.
    extras: dumpWorldExtras(),
  };
  return worldSnapshots[key];
}

// The other half of the hot-swap: restores a previously-snapshotted world
// (by pin key) as the live world, in place — no loadWorld()/def.build(),
// so nothing gets reset. Returns false (no-op) if that key has no snapshot,
// e.g. a world that's never been left before.
function restoreWorldSnapshot(key) {
  const snap = worldSnapshots[key];
  if (!snap) return false;
  accounts.length = 0;
  accounts.push(...snap.accounts);
  currentWorld = snap.meta;
  setActivePinSet(key);
  boardActiveKey = null; // default the board back to the world just entered, next time it's opened
  gameState.flagged = { ...snap.flagged };
  gameState.postFlags = { ...(snap.postFlags || {}) };
  gameState.deepInvestigated = { ...(snap.deepInvestigated || {}) };
  gameState.caseHints = (snap.caseHints || []).map((h) => ({ ...h }));
  loadWorldExtras(snap.extras);
  gameState.visits = snap.visits;
  homeLoadedCount = snap.loadedCount || 0;
  homeBatchCounter = snap.batchCounter || 0;
  delete worldSnapshots[key]; // this world is live again; re-snapshotted next time it's left
  activeEvent = null;
  if (snap.kind === "case") {
    lastCaseKey = key;
    lastCaseLabel = snap.meta.label;
  }
  return true;
}

// Opens a case: resumes it from its snapshot (progress intact) if one
// exists — this is now the ONE code path for both "Open case" (a case
// that's never been played reaches here with no snapshot and falls
// through to a fresh def.build()) and "Continue"/hot-swapping back into an
// already-in-progress case (which DOES have a snapshot, and so resumes it
// rather than losing flags/visits to a fresh rebuild) — see renderStory().
function loadCase(caseId) {
  const key = `case:${caseId}`;
  snapshotCurrentWorld(); // preserve whatever world is being left, whichever one it is
  if (restoreWorldSnapshot(key)) {
    renderFeed(true);
    persistNow();
    return;
  }
  const def = window.SKRAPERS_CASES.getCase(caseId);
  const caseAccounts = def.build();
  const skraperCount = caseAccounts.filter((a) => a.isSkraper).length;
  loadWorld(caseAccounts, { kind: "case", caseId: def.id, label: def.name, difficulty: def.difficulty, briefing: def.briefing, accountCount: caseAccounts.length, skraperCount });
}

// Stage 15: Home IS the endless-scroll world now — there's no separate
// "Endless Internet" menu selection. A fresh call here discards any
// existing Home snapshot (a genuinely new world), used for the very first
// session and for "New investigation" — normal Home/Case Load navigation
// goes through goHome()/snapshotCurrentWorld() instead.
function loadProceduralWorld() {
  const seed = window.SKRAPERS_WORLDGEN.randomWorldId();
  const accountCount = 30 + Math.floor(Math.random() * 21); // 30-50, per Stage 6 target
  // Stage 9: Home worlds calibrate to the player's own track record — see
  // game/algo.js. Cases 001-003 stay fixed on purpose.
  const jitter = window.SKRAPERS_ALGO.adaptiveJitter();
  const world = window.SKRAPERS_WORLDGEN.generateWorld(seed, accountCount, jitter);
  delete worldSnapshots.home;
  loadWorld(world.accounts, { kind: "procedural", label: `HOME — ${seed}`, accountCount: world.accountCount, skraperCount: world.skraperCount, seed, jitter });
}

// Stage 15: the Home bottom-nav tab, generalized for hot-swapping. Resumes
// Home's snapshot if it was previously left mid-scroll (preserving
// whichever world is being left behind, e.g. an in-progress case, by
// snapshotting it first); re-renders in place if Home is already the
// active world; otherwise (first-ever visit) starts a fresh world.
function goHome() {
  if (currentWorld.kind === "procedural") {
    renderFeed(true);
    return;
  }
  snapshotCurrentWorld(); // preserve the case being left behind
  if (restoreWorldSnapshot("home")) {
    renderFeed(true);
    persistNow();
  } else {
    loadProceduralWorld();
  }
}

// Item 9: reached only via the "Case Load" button under Home's composer
// now (moved off the profile menu entirely) — Cases/Story is still
// deliberately not one of the 5 bottom-nav tabs.
function goStory() {
  snapshotCurrentWorld(); // preserve whichever world is active (Home or a case) before showing the case picker
  renderStory();
}

// Stage 15: true infinite scroll for Home — appends another small,
// freshly generated batch of accounts (and their posts) to the live
// `accounts` array, then appends just the new posts to the DOM rather
// than re-rendering the whole feed.
function loadMoreIntoFeed() {
  if (currentWorld.kind !== "procedural") return;
  homeBatchCounter += 1;
  const seed = `${currentWorld.seed}-B${homeBatchCounter}`;
  const batchSize = HOME_BATCH_SIZE + Math.floor(Math.random() * 5);
  const jitter = currentWorld.jitter || 0;
  const world = window.SKRAPERS_WORLDGEN.generateWorld(seed, batchSize, jitter);
  accounts.push(...world.accounts);
  currentWorld.accountCount += world.accountCount;
  currentWorld.skraperCount += world.skraperCount;

  const newPosts = [];
  world.accounts.forEach((acct) => acct.posts.forEach((post) => newPosts.push({ ...post, acct })));
  newPosts.sort((a, b) => b.timestamp - a.timestamp);
  homeLoadedCount += newPosts.length;

  // Stage 17 (#8): an automatic event roll on this batch load. If one
  // fires, the announcer + reaction posts it adds land across the whole
  // roster (some already-rendered accounts, some brand new), so a full
  // re-render is simpler and more honest than trying to hand-patch the
  // DOM — this is also exactly the moment the doc wants the feed to
  // visibly "repopulate" on its own.
  if (maybeAutoTriggerEvent()) {
    renderFeed(false);
    return;
  }

  // Feature round (Home topbar search): only reached while search is
  // inactive — the scroll listener that calls this is detached whenever
  // homeSearchActive is true (see renderFeed), which is the simplest way
  // to make the infinite scroll genuinely stop being infinite while a
  // filter is on, per spec. `homeRenderedPosts` still gets the new batch
  // appended so a search started AFTER this point has the full, correct
  // "already loaded" list to filter.
  homeRenderedPosts.push(...newPosts);
  const feedEl = document.querySelector(".feed");
  if (feedEl) newPosts.forEach((post) => feedEl.appendChild(renderPost(post, post.acct)));

  // Feature round (bait status): the active bait status keeps accruing
  // replies as the player keeps scrolling Home, not just on a full return
  // to the feed — refresh the on-screen card in place if it grew.
  if (BAIT.tickBaitReplies(accounts).length) refreshBaitCard();

  persistNow();
}

// Stage 12: wipes saved progress and the adaptive algo's read on the
// player, then drops back to Case 001 — a genuine fresh start, not just a
// visual reset (loadCase -> loadWorld already resets credibility/flags/
// pins; this additionally clears the algo profile and localStorage so
// nothing carries over into the "new" session). Stage 13: also resets the
// newer systemic layers.
function resetSession() {
  window.SKRAPERS_PERSIST.clear();
  window.SKRAPERS_ALGO.reset();
  window.SKRAPERS_REPUTATION.reset();
  window.SKRAPERS_TRUST.reset();
  window.SKRAPERS_ALGOMSGS.reset();
  window.SKRAPERS_LEADS.reset();
  COMMENTS.reset();
  BAIT.reset();
  homeSearchQuery = "";
  homeSearchActive = false;
  homeRenderedPosts = [];
  notifications = [];
  inboxMessages = [];
  epilogueUnlocked = false;
  pendingConfrontations = [];
  pendingResponseTimers.forEach((t) => clearTimeout(t));
  pendingResponseTimers = [];
  worldSnapshots = {};
  homeLoadedCount = 0;
  homeBatchCounter = 0;
  // Feature round: a genuine "New investigation" wipes every board too —
  // both Home's and any mission's pins.
  pinSets = { home: new Set() };
  pinnedIds = pinSets.home;
  pinNotes = {};
  pinLinks = {};
  recentSearches = [];
  focusNudge = null;
  lastCaseKey = null;
  lastCaseLabel = null;
  boardActiveKey = null;
  // Bug fix (nav history): a fresh session must not inherit the previous
  // playthrough's back-trail.
  clearNavHistory();
  // Round 27 (bug fix): this never called game/state.js's resetState() —
  // only zeroed credibility by hand — so completedCases, removedBots,
  // following, trustedAccounts, dms and termsRushed all survived a "Log out
  // and erase everything" in memory, and the very next persistNow() wrote
  // them straight back into the freshly-cleared save. resetState() is the
  // one function that knows every player-progress field (including this
  // round's failedCaseAttempts/securityGotcha); display settings are
  // deliberately outside it and survive, as its own comment intends.
  const keepSettings = { ...gameState.settings };
  // Round 30 (#1): the walkthrough's record is knowledge about the player,
  // not progress in this playthrough — kept like settings (game/state.js).
  const keepTutorial = JSON.parse(JSON.stringify(gameState.tutorial || { seen: {}, skipped: false }));
  resetState();
  gameState.settings = keepSettings;
  gameState.tutorial = keepTutorial;
  // Round 27 (bug fix): the Log out confirmation says this is "a full
  // factory reset — back to the CAPTCHA screen", and game/state.js's
  // termsRushed comment says the same ("a fresh CAPTCHA/Terms pass is
  // exactly what a new investigation replays"), but it actually dropped
  // the player straight onto a fresh Home. The save is already cleared
  // above, so the CAPTCHA -> Terms -> reveal flow (which ends in
  // loadProceduralWorld(), exactly as on a first visit) now runs for real.
  captchaPassStreak = 0;
  renderCaptchaIntro();
}

// Stage 7, reworked Stage 17 (#8): fires at most once per world, now
// automatically rather than from a player-clicked button. Mutates the
// live accounts array (adds the announcer, adds reaction posts to real
// existing accounts) so the whole chain is investigable exactly like
// organic content. `silent` skips the full re-render (used when called
// from loadMoreIntoFeed, which appends its own new posts afterward).
let activeEvent = null;
function triggerEvent(silent) {
  if (activeEvent) return;
  activeEvent = window.SKRAPERS_EVENTS.triggerEvent(accounts);
  if (!silent) renderFeed(false);
  persistNow();
}

// Stage 17 (#8): rolled periodically as Home loads more of the feed —
// replaces the old player-clicked "Trigger event" button. Only fires once
// an event isn't already active, and only in the procedural Home world
// (curated cases roll their own events explicitly, e.g. Case 003).
function maybeAutoTriggerEvent() {
  if (activeEvent || currentWorld.kind !== "procedural") return false;
  if (Math.random() >= 0.35) return false;
  triggerEvent(true);
  return true;
}

// Stage 13: the single linear credibility % became one of THREE
// independently-moving dimensions the doc calls for (follow-up brainstorm
// point 3) — ALGO// STANDING (the old credibility, relabeled, not
// duplicated — see game/state.js), COMMUNITY TRUST (game/reputation.js),
// and ACCURACY (game/algo.js). They can and do diverge: a player who
// stays convincingly undercover with Trust's EXPLAIN choice can raise
// standing while quietly losing trust. Clicking the badge opens the full
// breakdown (renderPlayerProfile).
function reputationBadge() {
  const span = document.createElement("span");
  span.className = "reputation-badge";
  span.style.fontFamily = '"Space Grotesk", monospace';
  span.style.fontSize = "10.5px";
  span.style.letterSpacing = "0.03em";
  span.style.cursor = "pointer";
  span.style.textAlign = "right";
  span.style.lineHeight = "1.5";
  span.addEventListener("click", () => renderPlayerProfile());
  refreshReputationBadge(span);
  return span;
}

function toneFor(value) {
  return value < 60 ? "var(--red)" : value < 85 ? "var(--amber)" : "var(--blue)";
}

function refreshReputationBadge(span) {
  const standing = gameState.credibility;
  const trust = window.SKRAPERS_REPUTATION.rep.communityTrust;
  const acc = window.SKRAPERS_ALGO.accuracy();
  span.innerHTML = `<span style="color:${toneFor(standing)}">STANDING ${standing}%</span> · <span style="color:${toneFor(trust)}">TRUST ${trust}%</span>${acc !== null ? ` · <span style="color:${toneFor(Math.round(acc * 100))}">ACC ${Math.round(acc * 100)}%</span>` : ""}`;
}

// Every flag/trust-choice click changes these dimensions; every badge
// currently on screen (there's normally exactly one) needs to reflect
// that immediately — this is the whole point of Stage 4, so it can't lag
// until the next full re-render.
function refreshAllCredibilityBadges() {
  document.querySelectorAll(".reputation-badge").forEach(refreshReputationBadge);
}

// Stage 15: the old topbar bell is gone — Notifications is now its own
// bottom-nav tab, and its "unread" indicator moved to a small dot on that
// tab's icon (see renderBottomNav) instead of a separate bell widget.
function renderBottomNav(activeKey) {
  const nav = document.createElement("div");
  nav.className = "bottom-nav";
  const unread = window.SKRAPERS_ALGOMSGS.state.unread;
  const unreadInbox = inboxMessages.filter((m) => !m.read).length;
  // Stage 17: Inbox is now a separate 5th tab from Notifications —
  // Notifications stays ALGO//-originated only (game/algomsgs.js, the
  // epilogue unlock); Inbox is "a person/account in the world reacting to
  // you" (Trust confrontations, comment-author responses).
  const items = [
    { key: "home", icon: ICON.home, label: "Home", action: goHome },
    { key: "notifications", icon: ICON.bell, label: "Notifications", action: renderNotifications, badge: unread > 0 },
    { key: "inbox", icon: ICON.inbox, label: "Inbox", action: renderInbox, badge: unreadInbox > 0 },
    { key: "board", icon: ICON.pin, label: "Board", action: renderCaseBoard },
    { key: "profile", icon: ICON.brain, label: "Profile", action: renderPlayerProfile },
  ];
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "bottom-nav-item" + (activeKey === item.key ? " active" : "");
    btn.setAttribute("data-nav-key", item.key);
    btn.innerHTML = `<span class="bottom-nav-icon">${item.icon}${item.badge ? '<span class="bottom-nav-dot"></span>' : ""}</span><span class="bottom-nav-label">${item.label}</span>`;
    btn.addEventListener("click", item.action);
    nav.appendChild(btn);
  });
  return nav;
}

// Stage 13: atmosphere phase (game/atmosphere.js) — computed fresh from
// current standing/trust/catches rather than cached, so it's always
// consistent with whatever just changed.
function currentPhase() {
  return window.SKRAPERS_ATMOSPHERE.computePhase({
    correctFlags: window.SKRAPERS_ALGO.profile.correctFlags,
    communityTrust: window.SKRAPERS_REPUTATION.rep.communityTrust,
  });
}

// Round 23 (#3): dark mode / high contrast are plain CSS-class toggles on
// #app — classList survives every render's `app.innerHTML = ""` (that only
// clears children, not the element's own classes/attributes), so this only
// ever needs to run once at boot/restore and again on each toggle, not on
// every render.
function applyDisplaySettings() {
  app.classList.toggle("dark-mode", !!gameState.settings.darkMode);
  app.classList.toggle("high-contrast", !!gameState.settings.highContrast);
}

function applyPhaseClass() {
  const phase = currentPhase();
  for (let i = 0; i <= 4; i++) app.classList.remove(`phase-${i}`);
  app.classList.add(`phase-${phase}`);
  return phase;
}

// Stage 13: runs the ALGO// messaging triggers against the player's
// current tracked stats, appends any newly-fired messages to the
// persisted notification list, and toasts the first one so it's not
// silent — the bell icon covers the rest.
function checkAlgoMessages() {
  const algo = window.SKRAPERS_ALGO;
  const fired = window.SKRAPERS_ALGOMSGS.checkTriggers({
    investigations: algo.profile.investigations,
    correctFlags: algo.profile.correctFlags,
    wrongFlags: algo.profile.wrongFlags,
    dominantSignal: algo.dominantSignal(),
    accuracy: algo.accuracy(),
    phase: currentPhase(),
  });
  if (fired.length) {
    notifications = [...fired, ...notifications];
    showToast(`ALGO//: ${fired[0].text}`, "bad");
  }
  maybeUnlockEpilogue();
  return fired;
}

// Stage 13: the doc's Potential Major Twist (section 40) — an unlockable
// reveal once the investigation has gone deep enough AND cost enough
// (phase 4 = compromised atmosphere, meaning community trust has taken
// real damage along the way, not just a high catch count in isolation).
// Once true it stays true — the twist doesn't un-happen if standing
// recovers afterward.
function maybeUnlockEpilogue() {
  if (epilogueUnlocked) return;
  const algo = window.SKRAPERS_ALGO;
  if (currentPhase() >= 4 && algo.profile.correctFlags >= 8) {
    epilogueUnlocked = true;
    notifications = [{ id: "epilogue-unlock", text: "Something in ALGO// just changed. A new message is waiting — one that isn't about an account.", at: Date.now(), target: { type: "epilogue" } }, ...notifications];
    showToast("A new ALGO// message is waiting.", "bad");
  }
}

// Stage 13: Trust system reactions (game/trust.js), run once per return
// to the feed against every real human currently in the world. "noticed"
// reactions are quiet — a post appended to their own timeline, exactly
// like tickWorld's organic growth posts. "confronted" reactions need a
// player choice, so they're queued and handled one at a time via
// renderTrustModal.
function processTrustReactions() {
  const events = window.SKRAPERS_TRUST.checkReactions(accounts.filter((a) => !a.isSkraper));
  events.forEach((ev) => {
    if (ev.stage === "noticed") {
      ev.acct.posts = ev.acct.posts || [];
      ev.acct.posts.unshift({ id: `${ev.acct.id}-trust-${ev.acct.posts.length}`, text: window.SKRAPERS_TRUST.noticedPostText(), timestamp: Date.now() });
      showToast(`${ev.acct.name} seems to have noticed something. Check their profile.`, "bad");
      // Stage 17: Trust reactions are a person reacting to the player, not
      // ALGO// — they belong in the Inbox now, not Notifications.
      inboxMessages = [{ id: `trust-noticed-${ev.acct.id}`, text: `${ev.acct.name} posted something that reads like they've noticed you looking into them.`, at: Date.now(), target: { type: "profile", acctId: ev.acct.id }, read: false }, ...inboxMessages];
    } else if (ev.stage === "confronted") {
      pendingConfrontations.push(ev.acct);
      inboxMessages = [{ id: `trust-confronted-${ev.acct.id}`, text: `${ev.acct.name} messaged you directly about the investigation.`, at: Date.now(), target: { type: "profile", acctId: ev.acct.id }, read: false }, ...inboxMessages];
    }
  });
  if (pendingConfrontations.length) {
    const next = pendingConfrontations.shift();
    renderTrustModal(next);
  }
}

// Round 27 (bug fix): toasts used to be inserted into the first `.feed`
// element on the page — and silently dropped when there wasn't one, which
// is every screen except a feed or a profile timeline. So on the Case
// Board, Player Profile, Case Load and Notifications, every toast vanished:
// formally flagging from the Case Board never told the player whether they
// were right, and "Case cleared — head to Case Load" never appeared there
// at all. Worse, a toast raised just before a re-render (flag, then
// renderProfile) was wiped with the old DOM a moment later. Toasts now live
// in one fixed host inside #app (so they inherit the theme/phase CSS
// variables) that is re-attached after every render, and auto-dismiss.
let toastTimer = null;
let activeToastEl = null;

function reattachToast() {
  if (activeToastEl && !app.contains(activeToastEl)) app.appendChild(activeToastEl);
}

function showToast(message, tone) {
  if (activeToastEl) activeToastEl.remove();
  if (toastTimer) clearTimeout(toastTimer);
  const toast = document.createElement("div");
  toast.className = `skrapers-toast ${tone === "good" ? "good" : "bad"}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  toast.addEventListener("click", () => {
    toast.remove();
    if (activeToastEl === toast) activeToastEl = null;
  });
  activeToastEl = toast;
  app.appendChild(toast);
  toastTimer = setTimeout(() => {
    toast.remove();
    if (activeToastEl === toast) activeToastEl = null;
  }, 6000);
}

function dismissToast() {
  if (toastTimer) clearTimeout(toastTimer);
  if (activeToastEl) activeToastEl.remove();
  activeToastEl = null;
}

// Every screen render clears #app with innerHTML = "", which would take the
// toast host with it. A MutationObserver on #app's direct children puts it
// back after any render — one hook instead of editing every render
// function, and it can't be forgotten by a future screen.
new MutationObserver(() => reattachToast()).observe(app, { childList: true });

function accountById(id) {
  return accounts.find((a) => a.id === id);
}

function findPostById(postId) {
  for (const acct of accounts) {
    const post = (acct.posts || []).find((p) => p.id === postId);
    if (post) return { post, acct };
  }
  return null;
}

// Stage 17 (flag rework): once per return to the feed, every currently
// red-flagged post gets a small chance of growing a new comment — the
// "subtle signal change" the doc calls for. Purely informational: it
// doesn't auto-flag anything again, it just surfaces that there's
// something new to notice, via the Inbox, so the player can choose to
// flag it a second time themselves.
function processCommentGrowth() {
  gameState.postFlags = gameState.postFlags || {};
  Object.keys(gameState.postFlags).forEach((postId) => {
    if (!isRedFlagged(postId)) return;
    const found = findPostById(postId);
    if (!found) return;
    if (COMMENTS.maybeGrowFlaggedPost(found.post, found.acct, accounts)) {
      inboxMessages = [
        {
          id: `growth-${postId}-${Date.now()}`,
          text: `A post you flagged from ${found.acct.name} just picked up new comment activity. Worth another look.`,
          at: Date.now(),
          target: { type: "postThread", acctId: found.acct.id, postId },
          read: false,
        },
        ...inboxMessages,
      ];
    }
  });
}

// Round 23 (#9): "if the player reaches 0% [community trust] their feed
// begins discussing them and targeting them, until they do something to
// regain trust — or log out." Extends game/trust.js's existing "noticed"
// mechanic to the WHOLE community rather than one suspicious human —
// reuses its tone/lines, adds no new system. Gated purely on
// communityTrust <= 0 right now (not a one-shot), so it naturally starts
// surfacing content the moment trust bottoms out and naturally STOPS the
// moment trust rises above 0 through any of the game's existing repair
// paths (Trust's RESPOND choice, etc.) — nothing here needs to know how
// trust went up, only whether it's currently at the floor.
function maybeInjectHostileFeedContent() {
  const rep = window.SKRAPERS_REPUTATION.rep;
  if (rep.communityTrust > 0) return;
  if (Math.random() >= 0.3) return; // periodic, not every single tick
  const humans = accounts.filter((a) => !a.isSkraper && a.id !== BAIT.PLAYER_ACCT_ID);
  if (!humans.length) return;
  const acct = humans[Math.floor(Math.random() * humans.length)];
  acct.posts = acct.posts || [];
  acct.posts.unshift({ id: `${acct.id}-hostile-${acct.posts.length}`, text: window.SKRAPERS_TRUST.hostilePostText(), timestamp: Date.now() });
}

function followersOf(acctId) {
  return accounts.filter((a) => a.following && a.following.includes(acctId));
}

function timeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

// Stage 17 (#3): deterministic, per-account avatar color — a hue picked
// from a fixed, curated spread rather than randomly per render, using the
// project's own mulberry32-seeded-PRNG convention (simulation/worldgen.js,
// game/comments.js) hashed off the account id, so the same account always
// lands on the same hue across renders, reloads and screens. The palette
// is a spread of hues at one consistent saturation/lightness (handled in
// CSS via --avatar-hue) so it reads as "this app's palette", not neon.
const AVATAR_HUES = [201, 261, 9, 152, 32, 291, 172, 350, 48, 221, 128, 12];
function avatarHashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}
function avatarColorFor(acctId) {
  const seed = avatarHashSeed(String(acctId));
  return AVATAR_HUES[seed % AVATAR_HUES.length];
}
function avatarStyleAttr(acctId) {
  return `style="--avatar-hue:${avatarColorFor(acctId)}"`;
}

// Feature round ("every profile needs a bio"): bios are otherwise plain
// text (hand-authored or picked/filled from a template pool), but this is
// cheap insurance against any of them ever containing HTML-special
// characters (an ampersand in a hand-written bio, say) rendering as markup
// instead of text.
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function initials(name) {
  return name
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Stage 16 fix: a pure global-recency sort let a small handful of
// mechanically-regular Skraper accounts (near-constant ~47-minute posting
// intervals) occupy almost the entire top of the feed, since their posts
// are always more recent than most humans' (whose posts land anywhere in
// a multi-day window). The old "avoid the same author twice in a row"
// interleave didn't fix this — it just ping-ponged between whichever 2
// accounts had the most recent posts. Home is meant to read as a shuffled
// mix drawn from up to 50 accounts, not 2-3 repeating names, so this now
// groups posts by account, shuffles the account order, and round-robins
// one post per account per pass — every account in the shuffled, capped
// pool appears once before any account's second post shows up.
function allPostsFeed() {
  const byAccount = new Map();
  accounts.forEach((acct) => {
    // Round 23 (#4): a correctly-suspended account is removed from the
    // live feed entirely — it still shows up in "Bots Removed" on the
    // player's profile (game/state.js's removedBots, untouched here) and
    // its own profile page still works exactly as before (see
    // renderProfile, which reads directly from `accounts`, not this list).
    if (isSuspended(acct.id)) return;
    const list = [...acct.posts].sort((a, b) => b.timestamp - a.timestamp);
    if (list.length) byAccount.set(acct.id, list.map((post) => ({ ...post, acct })));
  });

  let acctIds = [...byAccount.keys()];
  for (let i = acctIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [acctIds[i], acctIds[j]] = [acctIds[j], acctIds[i]];
  }
  acctIds = acctIds.slice(0, 50); // cap: up to 50 concurrent/recently-loaded accounts

  const interleaved = [];
  for (let round = 0; ; round++) {
    let addedAny = false;
    for (const id of acctIds) {
      const list = byAccount.get(id);
      if (list[round]) {
        interleaved.push(list[round]);
        addedAny = true;
      }
    }
    if (!addedAny) break;
  }
  return interleaved;
}

// Feature round (Home topbar search): a real, working filter over the
// endless scroll — matches post text, the account's name/handle/bio, and
// its archetype (personality key + label), so searching an archetype name
// ("amplifier") or a signal-flavored term surfaces the accounts/posts that
// actually fit it, per spec ("help direct to possible bots").
function archetypeLabelFor(acct) {
  const P = window.SKRAPERS_PERSONALITIES;
  if (!P || !acct.personalityKey) return "";
  const def = P.SKRAPER_TYPES[acct.personalityKey] || P.HUMAN_PERSONALITIES[acct.personalityKey];
  return def ? def.label : "";
}

function matchesSearch(post, acct, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return true;
  const haystack = [post.text, acct.name, acct.handle, acct.bio || "", acct.personalityKey || "", archetypeLabelFor(acct)]
    .join(" ")
    .toLowerCase();
  return haystack.indexOf(q) !== -1;
}

// The "premade library of useful terms" — a static, investigation-flavored
// base (signal names, Skraper archetypes) mixed with terms drawn from the
// player's own recent activity, so the suggestions genuinely "change
// according to the player's actions" per spec: handles from red-flagged
// posts, from accounts on open leads, and from formal accusations. Capped
// small so it reads as a curated shortcut list, not a second feed.
const STATIC_SEARCH_TERMS = [
  "cadence",
  "activity hours",
  "linguistic consistency",
  "echo",
  "amplifier",
  "propagator",
  "sleeper",
  "influencer",
  "recruiter",
  "sponsored ad account",
  "templated",
];

function dynamicSearchTerms() {
  const terms = [];
  // Handles/keywords from posts the player has red-flagged this world.
  flaggedPostIds("red")
    .slice(0, 3)
    .forEach((postId) => {
      const found = findPostById(postId);
      if (found) terms.push(found.acct.handle);
    });
  // Accounts named in the player's own open leads (game/leads.js).
  (LEADS.state.leads || [])
    .filter((l) => !l.pursued && !l.dismissed)
    .slice(0, 3)
    .forEach((lead) => {
      (lead.accountIds || []).forEach((id) => {
        const a = accountById(id);
        if (a) terms.push(a.handle);
      });
    });
  // Accounts the player has formally accused (Case Board's real accusation).
  Object.keys(gameState.flagged || {})
    .slice(0, 3)
    .forEach((id) => {
      const a = accountById(id);
      if (a) terms.push(a.handle);
    });
  return [...new Set(terms)].filter(Boolean).slice(0, 5);
}

function suggestedSearchTerms() {
  const dynamic = dynamicSearchTerms();
  const staticPool = STATIC_SEARCH_TERMS.filter((t) => !dynamic.includes(t));
  const slotsLeft = Math.max(0, 8 - dynamic.length);
  return [...dynamic, ...staticPool.slice(0, slotsLeft)];
}

function statusTag(acct) {
  if (isSuspended(acct.id)) return `<span style="color:var(--red); font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.04em;">· SUSPENDED</span>`;
  if (isFalselyFlagged(acct.id)) return `<span style="color:var(--grey); font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.04em;">· FLAG APPEALED</span>`;
  // Round 29 (#6): ALGO//'s own pre-flag is visible wherever the account
  // is — until the player settles it one way or the other.
  const pf = activePreflag();
  if (pf && pf.acctId === acct.id) {
    if (pf.outcome === "overturned") return `<span class="preflag-tag cleared" data-testid="preflag-tag">· ALGO// FLAG OVERTURNED</span>`;
    if (!pf.outcome) return `<span class="preflag-tag" data-testid="preflag-tag">· ALGO// PRE-FLAGGED</span>`;
  }
  return "";
}

// Stage 16: comment icon label — the "illusion of real interaction". Most
// posts show a small, believable number; a minority (Skraper-authored, or
// riding an active trending event) read as viral with an inflated count.
// The number shown is never a promise about how many actually render —
// npcCommentsForPost/commentMeta already cap the real list at 20.
function commentButtonLabel(post, acct) {
  const isTrending = !!(activeEvent && (acct.isSkraper || post.text === activeEvent.announcementText));
  const meta = COMMENTS.commentMeta(post, acct, isTrending);
  const shown = meta.displayCount + COMMENTS.playerCommentsFor(post.id).length + COMMENTS.responsesFor(post.id).length;
  return shown > 0 ? `${ICON.comment} ${COMMENTS.formatCount(shown)}` : ICON.comment;
}

// Feature round (fake ads + human small-business counterpart): CSS-only
// "media" placeholder for a post — no external image loading, fully
// self-contained per the project's offline-capable build requirement (see
// ui/styles.css's .post-media rules for the actual visuals). Three
// variants: a plain video-thumbnail look (ad posts, imageStyle "video"), a
// deliberately-too-perfect/oversaturated "AI image" look (ad posts,
// imageStyle "ai-image" — the discoverable, non-conclusive uncanny tell),
// and a warmer, imperfect "phone photo on a kitchen table" look (human
// small-biz promo posts) — visually distinct from both ad styles on
// purpose, per spec.
function postMediaHtml(post) {
  if (post.postType === "ad") {
    if (post.imageStyle === "video") {
      return `<div class="post-media video"><div class="play-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5v14l11-7z" fill="#1D9BF0"/></svg></div></div>`;
    }
    return `<div class="post-media ai-image"><span class="ai-badge">AI</span></div>`;
  }
  if (post.postType === "promo") {
    return `<div class="post-media photo"></div>`;
  }
  return "";
}

// A small "Sponsored" label near the header — the same subtlety a real
// platform uses, never on a human small-biz promo post (that's the whole
// point of building the two side by side, per spec: a good player tells
// them apart by substance, not just a label).
function sponsoredLabelHtml(post) {
  return post.postType === "ad" ? `<div class="sponsored-label">Sponsored</div>` : "";
}

// Item 8: renders a post's text with its @handle mention (if any, see
// simulation/worldgen.js's mention pass) wrapped as a clickable span —
// clicking it navigates straight to the mentioned account's profile, the
// same click-through every other identity reference in the game already
// uses (comment authors, connections rows, etc).
function postTextHtml(post) {
  if (!post.mentionsAcctId) return post.text;
  const target = accountById(post.mentionsAcctId);
  if (!target || post.text.indexOf(target.handle) === -1) return post.text;
  return post.text.replace(target.handle, `<span class="mention" data-mention-id="${target.id}">${target.handle}</span>`);
}

// Round 27 (#7): the inline tag-network badge — see networkBadgeInfo().
// Opens straight into that author's Connections view (tags section) so the
// signal is noticeable while scrolling, not only after already deciding to
// open a profile and think to press Investigate.
function networkBadgeHtml(acct) {
  if (acct.id === BAIT.PLAYER_ACCT_ID) return "";
  const info = networkBadgeInfo(acct.id);
  if (!info) return "";
  const title = `Tag network: tags ${info.tags}, tagged by ${info.taggedBy}${info.reciprocal ? `, ${info.reciprocal} mutual` : ""} — open Connections`;
  return `<button class="post-network-badge${info.reciprocal ? " mutual" : ""}" title="${title}" aria-label="${title}">${ICON.network}<span>${info.linked}</span></button>`;
}

function renderPost(post, acct) {
  const div = document.createElement("div");
  div.className = "post";
  if (isSuspended(acct.id)) div.style.opacity = "0.45";
  div.setAttribute("data-post-id", post.id);
  div.innerHTML = `
    <div class="avatar" ${avatarStyleAttr(acct.id)}>${initials(acct.name)}</div>
    <div class="post-body">
      <div class="post-head">
        <span class="post-name">${acct.name}</span>
        <span class="post-handle">${acct.handle}</span>
        <span class="post-time">${timeAgo(post.timestamp)}</span>
        ${statusTag(acct)}
        ${networkBadgeHtml(acct)}
      </div>
      ${sponsoredLabelHtml(post)}
      <div class="post-text">${postTextHtml(post)}</div>
      ${postMediaHtml(post)}
      <div class="post-actions">
        <button class="comment-toggle">${commentButtonLabel(post, acct)}</button>
        <button class="flag-red${isRedFlagged(post.id) ? " active" : ""}" title="Report as bot">${ICON.reportBot} ${isRedFlagged(post.id) ? `Reported${redFlagCount(post.id) > 1 ? ` ×${redFlagCount(post.id)}` : ""}` : "Report Bot"}</button>
        <button class="flag-green${isGreenFlagged(post.id, acct.id) ? " active" : ""}" title="Mark authentic">${ICON.authentic} ${isGreenFlagged(post.id, acct.id) ? "Authentic" : "Authentic?"}</button>
      </div>
      <div class="post-thread" style="display:none;"></div>
    </div>
  `;
  div.querySelector(".comment-toggle").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleCommentThread(div, post, acct);
  });
  // Stage 17 (flag rework): the lightweight red/green pair — free,
  // togglable, zero credibility/reputation consequence. This REPLACES the
  // old single "Flag" button that called game/state.js's flagAccount()
  // directly; that real accusation now only happens from the Case Board's
  // "Formally flag as Skraper" action (see renderInvestigatePanel /
  // renderCaseBoardList) once an account is actually pinned there.
  div.querySelector(".flag-red").addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const result = toggleRedFlag(post, acct);
    btn.classList.toggle("active", result.active);
    btn.innerHTML = `${ICON.reportBot} ${result.active ? `Reported${result.count > 1 ? ` ×${result.count}` : ""}` : "Report Bot"}`;
    if (result.active) showToast("Reported — see it first on your profile, or pin the account and pursue it from the Case Board.", "bad");
    persistNow();
  });
  div.querySelector(".flag-green").addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const result = toggleGreenFlag(post, acct);
    btn.classList.toggle("active", result.active);
    btn.innerHTML = `${ICON.authentic} ${result.active ? "Authentic" : "Authentic?"}`;
    persistNow();
  });
  const netBadge = div.querySelector(".post-network-badge");
  if (netBadge) {
    netBadge.addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentWorld.kind === "case" && recordCaseAction("connections", acct.id)) persistNow();
      renderProfile(acct.id, { focus: "connections" });
    });
  }
  const mentionEl = div.querySelector(".mention");
  if (mentionEl) {
    mentionEl.addEventListener("click", (e) => {
      e.stopPropagation();
      renderProfile(mentionEl.getAttribute("data-mention-id"));
    });
  }
  div.addEventListener("click", (e) => {
    if (e.target.closest(".post-actions") || e.target.closest(".post-thread") || e.target.closest(".mention") || e.target.closest(".post-network-badge")) return; // don't navigate on action/thread/mention/badge taps
    // Round 23 (#2): the player's own bait-status post (acct.id
    // "__player__") has no real profile to navigate to — route to the
    // player's actual profile screen instead.
    if (acct.id === BAIT.PLAYER_ACCT_ID) renderPlayerProfile();
    else renderProfile(acct.id);
  });
  return div;
}

// Stage 16: expandable comment thread for #6 — NPC comments (capped at
// ~20, some carrying evidentiary weight for Skraper posts) plus the
// player's own premade comments (#1), with a picker to post more (capped
// at 5/post, varying per post per game/comments.js).
function toggleCommentThread(postDiv, post, acct) {
  const thread = postDiv.querySelector(".post-thread");
  if (thread.style.display !== "none") {
    thread.style.display = "none";
    thread.innerHTML = "";
    return;
  }
  thread.style.display = "block";
  renderCommentThread(thread, post, acct);
}

// Stage 17 (#6): schedules the post AUTHOR's reply to the player's most
// recent comment there — sometimes "instant" (resolves right away, still
// through the same generation path so it's not a special case), sometimes
// genuinely delayed via setTimeout so it doesn't read as a guaranteed
// vending-machine response. Either way it fires a real Inbox notification
// (this is a person/account reacting to the player, not ALGO//) that
// routes to this exact post's thread.
function scheduleAuthorResponse(post, acct) {
  const fire = () => {
    if (!COMMENTS.hasPendingComment(post.id)) return; // player may have left/changed state since
    const response = COMMENTS.recordAuthorResponse(post, acct);
    if (!response) return;
    inboxMessages = [
      {
        id: `resp-${response.id}`,
        text: `${acct.name} replied to your comment${response.readsBotlike ? "." : " — reads like an actual person."}`,
        at: Date.now(),
        target: { type: "postThread", acctId: acct.id, postId: post.id },
        read: false,
      },
      ...inboxMessages,
    ];
    showToast(`${acct.name} replied to your comment on their post.`, "good");
    // If this exact thread is still open on screen, refresh it in place
    // rather than leaving it stale until the player re-opens it.
    const openThread = document.querySelector(`.post[data-post-id="${post.id}"] .post-thread`);
    if (openThread && openThread.style.display !== "none") {
      renderCommentThread(openThread, post, acct);
      const btnEl = postDivCommentButton(openThread);
      if (btnEl) btnEl.textContent = commentButtonLabel(post, acct);
    }
    persistNow();
  };
  if (Math.random() < 0.4) {
    fire(); // an "instant" reply — still real, just no delay
  } else {
    const t = setTimeout(fire, 3500 + Math.random() * 6000);
    pendingResponseTimers.push(t);
  }
}

function renderCommentThread(thread, post, acct) {
  const isTrending = !!(activeEvent && (acct.isSkraper || post.text === activeEvent.announcementText));
  const meta = COMMENTS.commentMeta(post, acct, isTrending);
  const playerComments = COMMENTS.playerCommentsFor(post.id);
  const responses = COMMENTS.responsesFor(post.id);
  const npcSlots = Math.max(0, Math.min(20, meta.actualCount) - playerComments.length);
  // Stage 18 (#2): pass the live roster so each NPC comment is attributed
  // to a real, clickable account instead of a bare name — see
  // game/comments.js's npcCommentsForPost/pickCommenterAccount.
  const npc = COMMENTS.npcCommentsForPost(post, acct, isTrending, accounts).slice(0, npcSlots);

  const merged = [
    ...npc.map((c) => ({ kind: "npc", author: c.author, authorAcctId: c.authorAcctId, text: c.text, minsAgo: c.minsAgo, evidence: c.evidence })),
    ...playerComments.map((c) => ({ kind: "player", author: "You", text: c.text, minsAgo: Math.round((Date.now() - c.at) / 60000) })),
    ...responses.map((r) => ({ kind: "author", author: `${acct.name} (author)`, authorAcctId: acct.id, text: r.text, minsAgo: Math.round((Date.now() - r.at) / 60000), readsBotlike: r.readsBotlike })),
  ].sort((a, b) => a.minsAgo - b.minsAgo);

  const remaining = COMMENTS.remainingFor(post.id);
  const totalShown = meta.displayCount + playerComments.length + responses.length;

  // Item 2: any thread with enough real interaction gets a collapse/expand
  // toggle so a heavily-commented post (bait statuses can grow up to
  // game/bait.js's MAX_REPLIES, and a viral/trending post's comment list
  // can run long too) doesn't keep the feed unwieldy — collapsed by
  // default past the threshold, the composer below stays visible either
  // way so replying never requires expanding first.
  const COLLAPSE_THRESHOLD = 3;
  const collapsible = merged.length >= COLLAPSE_THRESHOLD;
  const startCollapsed = collapsible;

  thread.innerHTML = `
    <div style="border-top:1px solid rgba(83,100,113,0.12); margin-top:10px; padding-top:10px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;">
        <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.04em; color:var(--grey);">
          ${totalShown > 0 ? `${COMMENTS.formatCount(totalShown)} comments${meta.viral ? " · trending" : ""} — showing ${merged.length}` : "No comments yet — be the first."}
        </div>
        ${collapsible ? `<button class="thread-collapse-toggle" data-collapsed="${startCollapsed ? "1" : "0"}" style="font-size:11px; color:var(--blue); background:none; border:none; cursor:pointer; display:flex; align-items:center; gap:4px; white-space:nowrap;">${startCollapsed ? `Show ${merged.length}` : "Hide"} ${ICON.chevronLeft}</button>` : ""}
      </div>
      <div class="thread-list" style="display:${startCollapsed ? "none" : "flex"}; flex-direction:column; gap:8px; margin-bottom:10px;"></div>
      <div class="thread-composer"></div>
    </div>
  `;
  const toggleBtn = thread.querySelector(".thread-collapse-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const listEl = thread.querySelector(".thread-list");
      const collapsedNow = toggleBtn.getAttribute("data-collapsed") === "1";
      listEl.style.display = collapsedNow ? "flex" : "none";
      toggleBtn.setAttribute("data-collapsed", collapsedNow ? "0" : "1");
      toggleBtn.innerHTML = `${collapsedNow ? "Hide" : `Show ${merged.length}`} ${ICON.chevronLeft}`;
    });
  }
  const list = thread.querySelector(".thread-list");
  merged.forEach((c) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex; gap:8px; font-size:13px; line-height:1.4;";
    const color = c.kind === "player" ? "var(--blue)" : c.kind === "author" ? "var(--amber)" : "var(--white)";
    // Stage 18 (#1): every commenter that's a real, resolvable account
    // (NPC comments now carry authorAcctId — see game/comments.js — and
    // an author reply is always the post's own account) gets a small
    // clickable avatar + a clickable name, exactly like everywhere else
    // an account's identity shows up. "You" (the player's own comment)
    // has no profile to link to, so it stays plain.
    const clickable = c.kind !== "player" && !!c.authorAcctId;
    const avatarHtml = c.authorAcctId
      ? `<div class="avatar" data-comment-avatar style="width:24px; height:24px; font-size:10px; flex-shrink:0; margin-top:1px; ${clickable ? "cursor:pointer;" : ""} --avatar-hue:${avatarColorFor(c.authorAcctId)}">${initials(c.author.replace(" (author)", ""))}</div>`
      : `<div style="width:24px; flex-shrink:0;"></div>`;
    // The bot-like/human-like tell is deliberately NOT spelled out in the
    // UI ("EVIDENCE" style labels elsewhere are for signals the player
    // has to weigh, not free answers) — the response text itself is the
    // evidence; a small dot just marks that this row is an author reply
    // worth reading closely, consistent with the doc's own convention.
    row.innerHTML = `${avatarHtml}<div style="flex:1; min-width:0;"><span data-comment-name style="font-weight:600; color:${color}; ${clickable ? "cursor:pointer;" : ""}">${c.author}${c.kind === "author" ? ` ${ICON.pen}` : ""}</span> <span style="color:var(--grey); font-size:11px;">· ${c.minsAgo}m</span><div>${c.text}</div></div>`;
    if (clickable) {
      const goToCommenter = (e) => {
        e.stopPropagation();
        renderProfile(c.authorAcctId);
      };
      row.querySelector("[data-comment-avatar]").addEventListener("click", goToCommenter);
      row.querySelector("[data-comment-name]").addEventListener("click", goToCommenter);
    }
    list.appendChild(row);
  });

  const composer = thread.querySelector(".thread-composer");
  if (remaining <= 0) {
    composer.innerHTML = `<div style="font-size:12px; color:var(--red); font-family:'Space Grotesk',monospace;">ALGO// has flagged repeated commenting here as suspicious — you can't comment on this post again.</div>`;
    return;
  }
  const gate = COMMENTS.canPostComment(post.id);
  if (!gate.allowed && gate.reason === "waiting") {
    const note = document.createElement("div");
    note.className = "comment-waiting-note";
    note.textContent = `Waiting for ${acct.name} to reply before you can comment here again.`;
    composer.appendChild(note);
    return;
  }
  const options = COMMENTS.premadeOptionsForPost(post);
  const picker = document.createElement("div");
  picker.style.cssText = "display:flex; flex-wrap:wrap; gap:6px;";
  options.forEach((text) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.style.cssText = "font-size:12px; padding:6px 10px; border-radius:999px; border:1px solid rgba(29,155,240,0.3); background:transparent; color:var(--blue); cursor:pointer;";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const result = COMMENTS.postComment(post, acct, text);
      showToast(result.message, result.ok ? (result.remaining <= 1 ? "bad" : "good") : "bad");
      if (result.ok) scheduleAuthorResponse(post, acct);
      persistNow();
      renderCommentThread(thread, post, acct); // refresh in place — count, list, remaining slots
      const btnEl = postDivCommentButton(thread);
      if (btnEl) btnEl.textContent = commentButtonLabel(post, acct);
    });
    picker.appendChild(btn);
  });
  const remainingNote = document.createElement("div");
  remainingNote.style.cssText = "font-size:11px; color:var(--grey); margin-top:6px;";
  remainingNote.textContent = `${remaining} comment${remaining === 1 ? "" : "s"} left on this post before ALGO// flags it.`;
  composer.appendChild(picker);
  composer.appendChild(remainingNote);
}

function postDivCommentButton(threadEl) {
  const postDiv = threadEl.closest(".post");
  return postDiv ? postDiv.querySelector(".comment-toggle") : null;
}

// Feature round (bait status): replaces the old ALGO//-mentioning bubble
// that used to sit here (renderHomeHeader — the "ALGO// — HOME" /
// "ALGO// IS WATCHING" panel) with a real investigative tool: a "Post a
// status" composer when nothing's active, or the player's currently active
// bait status + whatever replies it's picked up so far. See game/bait.js.
function renderStatusComposer() {
  const panel = document.createElement("div");
  panel.className = "investigate-panel bait-status-panel";
  panel.style.margin = "12px 18px";
  fillStatusComposer(panel);
  return panel;
}

// Split out so loadMoreIntoFeed/renderFeed can refresh the card in place
// (new replies arriving) without a full feed re-render.
function fillStatusComposer(panel) {
  const active = BAIT.state.active;
  if (!active) {
    // Item 1: the entry point restyled to look like a normal post-composer
    // row — the player's own avatar bubble (same .avatar styling every
    // other account gets, not a distinct bubble) with prompt text next to
    // it, same "what's on your mind" composer shape everywhere else on the
    // web uses. Clicking anywhere in the row opens the existing bait-
    // phrase-picker flow below, unchanged.
    panel.classList.add("bait-composer-idle");
    panel.innerHTML = `
      <div class="bait-composer-row" data-action="open-bait-picker" style="display:flex; align-items:center; gap:12px; cursor:pointer;">
        <div class="avatar" style="--avatar-hue:201;">${initials("You")}</div>
        <div class="bait-composer-prompt" style="flex:1; font-size:14.5px; color:var(--grey);">Create click bait post</div>
        ${ICON.fishingRod}
      </div>
      <div class="bait-picker" style="display:none; flex-wrap:wrap; gap:6px; margin-top:10px;"></div>
    `;
    const openBtn = panel.querySelector('[data-action="open-bait-picker"]');
    const picker = panel.querySelector(".bait-picker");
    openBtn.addEventListener("click", () => {
      if (picker.style.display !== "none") {
        picker.style.display = "none";
        return;
      }
      picker.style.display = "flex";
      picker.innerHTML = "";
      BAIT.BAIT_PHRASES.forEach((text) => {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.style.cssText = "font-size:12px; padding:6px 10px; border-radius:999px; border:1px solid rgba(29,155,240,0.3); background:transparent; color:var(--blue); cursor:pointer; text-align:left;";
        btn.addEventListener("click", () => {
          BAIT.postBait(text, accounts);
          persistNow();
          fillStatusComposer(panel);
          showToast("Status posted — check back to see who engages.", "good");
        });
        picker.appendChild(btn);
      });
    });
    return;
  }

  panel.classList.remove("bait-composer-idle");
  const repliesHtml = active.replies.length
    ? active.replies
        .map((r) => {
          const tone = r.readsBotlike ? "var(--grey)" : "var(--blue)";
          return `
        <div class="bait-reply-row" data-acct-id="${r.authorAcctId}" style="display:flex; gap:8px; font-size:13px; line-height:1.4; padding:6px 0; border-top:1px solid rgba(83,100,113,0.1); cursor:pointer;">
          <div class="avatar" style="width:24px; height:24px; font-size:10px; flex-shrink:0; margin-top:1px; --avatar-hue:${avatarColorFor(r.authorAcctId)}">${initials(r.authorName)}</div>
          <div style="flex:1; min-width:0;"><span style="font-weight:600; color:${tone};">${r.authorName}</span> <span style="color:var(--grey); font-size:11px;">· ${timeAgo(r.at)}</span><div>${escapeHtml(r.text)}</div></div>
        </div>`;
        })
        .join("")
    : `<div style="font-size:12px; color:var(--grey); padding-top:8px;">No replies yet — check back after scrolling a while.</div>`;

  // Round 23 (#5): the cap is now 5, shown here so the player can see how
  // much room is left. Round 23 (#7): once 2+ replies are in, an
  // Analytics button opens the mutual-connections view.
  const capNote = `<div style="font-size:11px; color:var(--grey); margin-top:6px;">${active.replies.length}/${BAIT.MAX_REPLIES} responses</div>`;
  panel.innerHTML = `
    <h4>${ICON.fishingRod} Your status is live</h4>
    <div style="display:flex; gap:8px; margin-bottom:2px;">
      <div class="avatar" style="width:32px; height:32px; font-size:12px; flex-shrink:0; --avatar-hue:201;">${initials("You")}</div>
      <div style="flex:1; min-width:0; font-size:14px; line-height:1.4;"><span style="font-weight:600;">You</span><div>${escapeHtml(active.text)}</div></div>
    </div>
    <div class="bait-replies">${repliesHtml}</div>
    ${capNote}
    <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
      ${active.replies.length >= 2 ? `<button class="investigate-btn secondary-btn" data-action="analytics" style="margin-top:0; font-size:12px; padding:6px 10px;">${ICON.chart} Analytics</button>` : ""}
      <button class="investigate-btn secondary-btn" data-action="clear-bait" style="margin-top:0; background:transparent; color:var(--grey); border:1px solid var(--grey); font-size:12px; padding:6px 10px;">Take it down</button>
    </div>
  `;
  panel.querySelectorAll(".bait-reply-row").forEach((row) => {
    const id = row.getAttribute("data-acct-id");
    if (id && id !== "null") row.addEventListener("click", () => renderProfile(id));
  });
  const analyticsBtn = panel.querySelector('[data-action="analytics"]');
  if (analyticsBtn) analyticsBtn.addEventListener("click", () => renderBaitAnalytics(active));
  panel.querySelector('[data-action="clear-bait"]').addEventListener("click", () => {
    BAIT.clearBait(accounts);
    persistNow();
    fillStatusComposer(panel);
  });
}

// Round 23 (#7): "the commenters with mutual connections are highlighted —
// some are genuine friends, some are skrapers." Reuses the same
// follow/followed-by data renderConnectionsPanel already derives, just
// checked pairwise across the repliers rather than against one profile.
// Two repliers are "mutually connected" if either follows the other, or
// they share at least one account they both follow/are followed by.
function neighborSetFor(acctId) {
  const acct = accountById(acctId);
  if (!acct) return new Set();
  const set = new Set(acct.following || []);
  followersOf(acctId).forEach((a) => set.add(a.id));
  return set;
}

function findMutualPairs(replyAuthorIds) {
  const ids = [...new Set(replyAuthorIds)];
  const neighbors = new Map(ids.map((id) => [id, neighborSetFor(id)]));
  const pairs = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      const direct = neighbors.get(a).has(b) || neighbors.get(b).has(a);
      let shared = false;
      if (!direct) {
        for (const n of neighbors.get(a)) {
          if (neighbors.get(b).has(n)) { shared = true; break; }
        }
      }
      if (direct || shared) pairs.push([a, b]);
    }
  }
  return pairs;
}

function renderBaitAnalytics(active) {
  currentView = "bait-analytics";
  trackScreen(() => renderBaitAnalytics(active), "bait-analytics");
  detachHomeScrollHandler();
  app.innerHTML = "";
  applyPhaseClass();
  // Bug fix (real Back button): used to hardcode renderPlayerProfile() —
  // see renderProfile's comment above.
  const topbar = renderTopbarStack(`<button class="back-btn">${ICON.chevronLeft} Back</button>`, false);
  topbar.querySelector(".back-btn").addEventListener("click", () => goBack());
  app.appendChild(topbar);

  const replyAuthorIds = active.replies.map((r) => r.authorAcctId).filter(Boolean);
  const pairs = findMutualPairs(replyAuthorIds);
  const connectedIds = new Set(pairs.flat());

  const header = document.createElement("div");
  header.className = "investigate-panel";
  header.style.margin = "12px 18px";
  header.innerHTML = `
    <h4>${ICON.chart} Status Analytics</h4>
    <div style="font-size:13px; line-height:1.5;">Everyone who replied to your status, cross-checked against the follow graph. Highlighted accounts share a mutual connection with at least one other commenter here — sometimes that's just two friends replying to the same post, sometimes it's a cluster of the same Skraper network.</div>
  `;
  app.appendChild(header);

  const list = document.createElement("div");
  list.className = "investigate-panel";
  list.style.margin = "0 18px 12px";
  list.innerHTML = `<h4>COMMENTERS (${replyAuthorIds.length})</h4>`;
  [...new Set(replyAuthorIds)].forEach((id) => {
    const acct = accountById(id);
    const reply = active.replies.find((r) => r.authorAcctId === id);
    const row = document.createElement("div");
    row.className = "signal-row" + (connectedIds.has(id) ? " analytics-mutual" : "");
    row.style.cursor = acct ? "pointer" : "default";
    row.innerHTML = `<span>${reply ? reply.authorName : id}${connectedIds.has(id) ? `<span class="analytics-badge">MUTUAL</span>` : ""}</span><span style="color:var(--grey); font-weight:400;">${acct && acct.isSkraper ? "" : ""}${acct ? "view →" : ""}</span>`;
    if (acct) row.addEventListener("click", () => renderProfile(id));
    list.appendChild(row);
  });
  app.appendChild(list);

  if (pairs.length) {
    const pairsPanel = document.createElement("div");
    pairsPanel.className = "investigate-panel";
    pairsPanel.style.margin = "0 18px 12px";
    pairsPanel.innerHTML = `<h4>MUTUAL PAIRS (${pairs.length})</h4>`;
    pairs.forEach(([a, b]) => {
      const acctA = accountById(a), acctB = accountById(b);
      if (!acctA || !acctB) return;
      const row = document.createElement("div");
      row.className = "signal-row";
      row.innerHTML = `<span>${acctA.name} ↔ ${acctB.name}</span><span style="color:var(--grey); font-weight:400;">connected</span>`;
      pairsPanel.appendChild(row);
    });
    app.appendChild(pairsPanel);
  } else {
    const none = document.createElement("div");
    none.className = "empty-state";
    none.textContent = "No mutual connections found among these repliers — they don't appear linked to each other.";
    app.appendChild(none);
  }
  app.appendChild(renderBottomNav("profile"));
}

function refreshBaitCard() {
  const panel = document.querySelector(".bait-status-panel");
  if (panel) fillStatusComposer(panel);
}

// Round 23 (#2a): the player-profile version of the same card — reuses
// fillStatusComposer's markup logic 1:1 (so "post a status" / "status is
// live" / Analytics all work identically here) rather than a parallel
// renderer, plus a short history list of past, taken-down statuses.
function renderPlayerStatusPanel() {
  const panel = document.createElement("div");
  panel.className = "investigate-panel bait-status-panel";
  panel.style.margin = "12px 18px";
  fillStatusComposer(panel);

  const wrap = document.createElement("div");
  wrap.appendChild(panel);

  if (BAIT.state.history && BAIT.state.history.length) {
    const hist = document.createElement("div");
    hist.className = "investigate-panel";
    hist.style.margin = "0 18px 12px";
    hist.innerHTML = `<h4>PAST STATUSES (${BAIT.state.history.length})</h4>`;
    BAIT.state.history.slice(0, 5).forEach((h) => {
      const row = document.createElement("div");
      row.className = "signal-row";
      row.innerHTML = `<span>${escapeHtml(h.text)}</span><span style="color:var(--grey); font-weight:400;">${h.replies.length} replies</span>`;
      hist.appendChild(row);
    });
    wrap.appendChild(hist);
  }
  return wrap;
}

function renderCaseBrief() {
  const brief = document.createElement("div");
  brief.className = "investigate-panel";
  brief.style.margin = "12px 18px";

  const isCase = currentWorld.kind === "case";
  const bodyText = isCase
    ? currentWorld.briefing || `One artificial account is active in this network. ${currentWorld.accountCount} accounts are visible below.`
    : `A network of ${currentWorld.accountCount} accounts. Somewhere in it is a small cluster of ${currentWorld.skraperCount} artificial accounts. They follow each other, and exactly one of them has a thread into the real social graph.`;

  brief.innerHTML = `
    <h4>M.A.I. — ${currentWorld.label}</h4>
    <div style="font-size:11px; letter-spacing:0.04em; color:var(--grey); font-family:'Space Grotesk',monospace; margin:-6px 0 10px;">MALICIOUS ARTIFICIAL INFLUENCERS — INVESTIGATION UNIT</div>
    <div style="font-size:14px; line-height:1.5;">${bodyText}</div>
    ${
      isCase
        ? `<div class="case-review-limit" data-testid="case-brief-limit">${ICON.shield} This file is pulled for review after ${wrongFlagLimitFor(currentWorld.accountCount, currentWorld.caseId)} wrongful formal flags in one attempt.${currentWorld.caseId === FIRST_CASE_ID ? " Your first case allows a little extra room while you learn." : ""}</div>
    <div class="case-review-limit" data-testid="case-brief-pulls">${ICON.scan} M.A.I. grants ${deepPullLimit()} deep-investigate pulls for this attempt — spend them on the accounts (or the hints) that matter. Everything else is free.</div>
    ${tutorialActive() ? `<div class="case-review-limit" data-testid="case-brief-walkthrough">${ICON.bulb} Your first case: ALGO// will point things out as you reach them, one at a time. You can skip the walkthrough whenever you like.</div>` : ""}`
        : ""
    }
  `;
  return brief;
}

// Round 23 (#6): renderTrendingBanner (the "🔥 Currently Trending" passive
// text bubble) is removed — dynamic events still fire automatically in the
// background (triggerEvent/maybeAutoTriggerEvent, untouched), there's just
// no visible indicator about it anymore, per spec. Replaced below with a
// horizontal-scrolling promo banner that appears periodically instead.

// Round 23 (#6): shows the promo banner "periodically" — same
// interval/probability spirit as maybeAutoTriggerEvent's own 0.35 roll,
// re-rolled each time Home fully re-renders, rather than a permanent
// fixture under the search bar.
let promoBannerVisible = false;
function maybeRollPromoBanner() {
  promoBannerVisible = Math.random() < 0.4;
}

// Bias toward accounts that are ACTUALLY Skrapers running an ad-style post
// (the adbot archetype) — "a legitimate, fair investigative shortcut to a
// likely target, not random flavor," per spec — with small-biz promo
// accounts filling out the rest so the banner doesn't read as a pure
// gotcha list.
function promoBannerCandidates() {
  const withAdPost = (acct) => (acct.posts || []).some((p) => p.postType === "ad" || p.postType === "promo");
  const adbots = accounts.filter((a) => a.isSkraper && a.personalityKey === "adbot" && withAdPost(a) && !isSuspended(a.id));
  const smallBiz = accounts.filter((a) => !a.isSkraper && a.personalityKey === "small_biz" && withAdPost(a));
  const picks = [];
  const pool = [...adbots, ...adbots, ...smallBiz]; // adbot weighted 2x
  const seen = new Set();
  while (pool.length && picks.length < 4) {
    const idx = Math.floor(Math.random() * pool.length);
    const acct = pool.splice(idx, 1)[0];
    if (seen.has(acct.id)) continue;
    seen.add(acct.id);
    const adPost = acct.posts.find((p) => p.postType === "ad" || p.postType === "promo");
    picks.push({ acct, adPost });
  }
  return picks;
}

// Round 27 (#1): the promo banner is now a genuine one-line news ticker —
// a thin full-width strip (no card, no bubble, no rounded box) whose
// promo/ad sentences flow continuously right-to-left, rather than one card
// at a time sliding out and a new one sliding in on an 8-12s timer. Same
// data and the same adbot-weighted bias (promoBannerCandidates above), same
// click-through-to-that-account behavior; only the presentation changed.
// The whole candidate list rides the strip at once, so "rotation" is now
// the scroll itself — every candidate passes by in turn, forever.
//
// Seamless looping: the track holds the item sequence TWICE, back to back,
// and a CSS @keyframes animation translates it from 0 to -50% — at -50%
// the second copy sits exactly where the first started, so the loop point
// is invisible. Duration is set from the measured width of one copy so the
// reading speed stays constant however long the sentences are.
// prefers-reduced-motion: the animation is switched off in CSS and the
// strip becomes a manually scrollable single line (see ui/styles.css) —
// the duplicate copy is hidden from assistive tech either way.
const PROMO_TICKER_PX_PER_SECOND = 42;

function promoTickerSentence(item) {
  const tag = item.acct.isSkraper ? "Sponsored" : "Local";
  const raw = item.adPost ? item.adPost.text : item.acct.name;
  // Drop a trailing @mention (worldgen's mention pass appends one) — the
  // ticker already names the account, and a stray handle mid-sentence reads
  // like a second advertiser.
  const text = raw.replace(/\s@\S+$/, "");
  return `<span class="promo-ticker-tag">${tag}</span><span class="promo-ticker-name">${escapeHtml(item.acct.name)}</span><span class="promo-ticker-text">${escapeHtml(text)}</span>`;
}

function renderPromoBanner() {
  const items = promoBannerCandidates();
  if (!items.length) return null;
  const banner = document.createElement("div");
  banner.className = "promo-ticker";
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Promoted posts");
  const itemsHtml = (hidden) =>
    items
      .map(
        (item) =>
          `<button class="promo-ticker-item" data-acct-id="${item.acct.id}"${hidden ? ' tabindex="-1" aria-hidden="true"' : ""}>${promoTickerSentence(item)}</button><span class="promo-ticker-sep" aria-hidden="true">◆</span>`
      )
      .join("");
  banner.innerHTML = `
    <div class="promo-ticker-label" aria-hidden="true">PROMOTED</div>
    <div class="promo-ticker-window">
      <div class="promo-ticker-track">
        <div class="promo-ticker-run">${itemsHtml(false)}</div>
        <div class="promo-ticker-run" aria-hidden="true">${itemsHtml(true)}</div>
      </div>
 
