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
  isGuideTipSeen,
  retireTutorialTip,
  skipTutorial,
  isTourSeen,
  markTourSeen,
  isMomentSeen,
  markMomentSeen,
  normalizeTutorial,
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
const MARKET = window.SKRAPERS_MARKET; // Stage 32: listing data + generation (game/marketplace.js)

// Item 11: a small, reusable inline-SVG icon set — replaces literal emoji
// used as UI CHROME (buttons, badges, nav) with clean stroke-based icons
// in the "modern social app, currentColor-friendly" spirit, same
// CSS/SVG-drawn-placeholder convention already established by
// CAPTCHA_ICONS below and the ad post-media play-icon svg. Deliberately
// does NOT touch emoji that are in-fiction CONTENT (CAPTCHA_GLYPHS, any
// generated bio/post/comment text) — those stay exactly as authored.
// Every glyph is a 24x24 viewBox, 1.8px stroke, no fill unless the shape
// needs one, sized/colored by the caller via CSS (font-size/color or an
// explicit width/height on the wrapping element).
//
// Stage 31 (#7b): this is now the ONE icon set for all UI chrome — every
// button, badge and row draws from ICON (no stray text glyphs like "✕" or
// "−"/"+" standing in for icons), every glyph shares this function's viewBox
// and stroke, and icon-only buttons share one fixed-size container
// (.icon-btn in ui/styles.css) so they never resize with their state. What
// each non-obvious glyph means is listed once, in ICON_LEGEND below, and
// shown by renderIconLegend() (Settings -> Icon key, and the "?" on every
// account profile).
function svgIcon(inner, extra) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra || ""}>${inner}</svg>`;
}
const ICON = {
  comment: svgIcon(`<path d="M4 5h16v11H8l-4 4V5z"/>`),
  // Item 5: green flag, distinct shape from the red "report" flag below —
  // a checkmark folded into the flag's pennant so it still reads as
  // "authentic" at a glance, not just "flag but green".
  authentic: svgIcon(`<path d="M6 3v18"/><path d="M6 4.5h11l-2.6 3.5L17 11.5H6z"/><path d="M8.3 6.6l1.3 1.4 2.4-2.6" stroke-width="1.5"/>`),
  // Item 4: the red pennant, kept visually distinct from the green one
  // above by shape as well as color. Stage 32: the per-post button that
  // used to wear this icon ("Report Bot") now uses ICON.pin instead — this
  // pennant is left for its one remaining job, the Case Board's real
  // accusation ("Formally flag as Skraper").
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
  // Stage 31 (#7b): drawn as a pair of footprints — the trail an account
  // leaves behind it (what it liked, searched, commented on) — rather than
  // a pulse line, which read as "stats".
  activity: svgIcon(`<path d="M8 3.5c-1.7 0-2.8 2-2.8 4.4 0 2 .7 3.4 1.2 4.8.3.9 1.2 1.3 2 1 .9-.3 1.3-1.1 1.2-2.1-.1-1.3.9-2.6.9-4.3C10.5 5.1 9.6 3.5 8 3.5z"/><path d="M6.8 16.2c.1 1.4 1 2.3 2 2.2 1-.1 1.6-1 1.5-2.4"/><path d="M16 7.5c1.7 0 2.8 2 2.8 4.4 0 2-.7 3.4-1.2 4.8-.3.9-1.2 1.3-2 1-.9-.3-1.3-1.1-1.2-2.1.1-1.3-.9-2.6-.9-4.3 0-2.2.9-3.8 2.5-3.8z"/><path d="M17.2 20.2c-.1 1-1 1.6-2 1.5-1-.1-1.5-.9-1.5-1.9"/>`),
  clock: svgIcon(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`),
  // Round 28 (#4): an account's stated location.
  globe: svgIcon(`<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.6 2.6 2.6 14.4 0 17"/><path d="M12 3.5c-2.6 2.6-2.6 14.4 0 17"/>`),
  // Stage 31 (#7b): the icons that used to be stray text glyphs (the zoom
  // buttons' "−"/"+"), plus the help "?" and the bait composer's inert
  // Photo / Check in actions (#8).
  plus: svgIcon(`<path d="M12 5v14"/><path d="M5 12h14"/>`),
  minus: svgIcon(`<path d="M5 12h14"/>`),
  help: svgIcon(`<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7"/><circle cx="12" cy="16.9" r="0.9" fill="currentColor" stroke="none"/>`),
  camera: svgIcon(`<path d="M4 8h3l1.6-2.5h6.8L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/>`),
  checkIn: svgIcon(`<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.2l2.5 2.5 4.9-5.2"/>`),
  trending: svgIcon(`<path d="M3.5 17l6-6 4 4 7-7.5"/><path d="M15 7.5h5.5V13"/>`),
  // Stage 32 (#1): the Marketplace tab — a shopping bag, same 24px viewBox
  // and 1.8 stroke as everything else here. The item thumbnails on
  // listings are a separate, larger set (game/marketplace.js's MARKET_ICON)
  // because they're content, not chrome.
  market: svgIcon(`<path d="M5.5 8.5h13l-1.1 11.2a1.5 1.5 0 0 1-1.5 1.3H8.1a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5"/>`),
};

// Stage 31 (#7b): what each non-obvious glyph means, in one place — the
// icon key (renderIconLegend) reads this, so the key can never drift from
// the icons themselves.
const ICON_LEGEND = [
  { icon: "pin", label: "Pin", text: "Pin an account to your Case Board — on a profile, as \"Attach Pin\" on any post, or on a Marketplace listing (pins its seller). Filled = pinned." },
  { icon: "market", label: "Bag", text: "Marketplace — this week's local listings. Every seller is an account in the network you can investigate." },
  { icon: "activity", label: "Footprints", text: "Recent activity — what an account liked, searched or commented on." },
  { icon: "search", label: "Magnifier", text: "Search, and Investigate (reading an account's free signals)." },
  { icon: "scan", label: "Magnifier +", text: "Deep investigation — costs one of your limited pulls." },
  { icon: "reportBot", label: "Red flag", text: "Formally flag as Skraper — a real accusation, once an account is pinned to the Case Board." },
  { icon: "authentic", label: "Green flag", text: "Authentic / Trusted — your own marker that a post or account seems real." },
  { icon: "network", label: "Nodes", text: "Busy tag network — opens that account's Connections." },
  { icon: "link", label: "Link", text: "An evidence link you drew between two pins." },
  { icon: "note", label: "Note", text: "Your investigator's note on a pin." },
  { icon: "globe", label: "Globe", text: "An account's stated location." },
  { icon: "eye", label: "Eye", text: "ALGO// is pointing something out." },
  { icon: "bulb", label: "Bulb", text: "A hint or tip." },
];

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
  // Stage 32: the Marketplace grid and a listing belong to one world too —
  // their sellers only exist in that world's roster.
  return /^(profile:|feed:|bait-analytics|casefile|marketplace|market-listing:)/.test(key) ? pinKeyFor(currentWorld) : null;
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
    // Stage 32: every world's listings and every "Is this still available?"
    // message, with the respondAt its reply is waiting on.
    marketplace: gameState.marketplace,
    // Feature round: every pin set, not just one shared list — see the
    // pinSets comment near the top of this file.
    pinSets: Object.fromEntries(Object.entries(pinSets).map(([k, v]) => [k, [...v]])),
    pinNotes,
    pinLinks,
    recentSearches,
    focusNudge,
    marketNudge,
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
  marketNudge = { seq: 0, dismissedSeq: -1 };
  inboxTab = "messages";
  marketScroll = null;
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
// Stage 32 (#1): Notifications folded into Inbox — one screen with a
// Messages / Notifications switch (renderInbox) — which frees the slot the
// Marketplace now takes. Inbox's dot now lights for EITHER: an unread ALGO//
// notification (what the old Notifications dot showed) or an unread message.
function renderBottomNav(activeKey) {
  // Every screen renders the nav, so this is the one place a due Marketplace
  // reply is guaranteed to be noticed promptly (its dot lights up) without
  // a live timer — see deliverMarketReplies.
  deliverMarketReplies();
  const nav = document.createElement("div");
  nav.className = "bottom-nav";
  const unread = window.SKRAPERS_ALGOMSGS.state.unread;
  const unreadInbox = inboxMessages.filter((m) => !m.read).length;
  const items = [
    { key: "home", icon: ICON.home, label: "Home", action: goHome },
    { key: "inbox", icon: ICON.inbox, label: "Inbox", action: () => renderInbox(), badge: unread > 0 || unreadInbox > 0 },
    { key: "market", icon: ICON.market, label: "Market", action: () => renderMarketplace() },
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

// Stage 32 (#6): turns every Marketplace reply whose `respondAt` has passed
// into an Inbox message — the "checked on render, not a live timer" pattern,
// so a reply that came due while the tab was closed still lands the next
// time anything renders. Idempotent: game/marketplace.js marks each one
// delivered as it hands it over.
function deliverMarketReplies() {
  const due = MARKET.takeDueReplies(gameState.marketplace || (gameState.marketplace = MARKET.defaultState()));
  if (!due.length) return 0;
  due.forEach((m) => {
    inboxMessages = [
      {
        id: `market-reply-${m.listingId}`,
        text: `${m.sellerName} replied about “${m.title}”: “${m.replyText}”`,
        at: m.respondAt,
        target: { type: "marketListing", listingId: m.listingId, acctId: m.sellerId, worldKey: m.worldKey },
        read: false,
      },
      ...inboxMessages,
    ];
  });
  persistNow();
  return due.length;
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
    showToast(`ALGO//: ${fired[0].text}`, "bad", fired[0].target || { type: "notifications" });
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
    showToast("A new ALGO// message is waiting.", "bad", { type: "epilogue" });
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
      showToast(`${ev.acct.name} seems to have noticed something. Check their profile.`, "bad", { type: "profile", acctId: ev.acct.id });
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

// Stage 31 (#13): `target` (optional) makes the alert a link — the same
// { type, acctId, postId } shape Notifications/Inbox cards already route
// with, handed to the same goToNotificationTarget(), so a live alert ("X
// replied to your comment", "X seems to have noticed you", "new lead",
// "case cleared") goes exactly where its Notifications/Inbox entry goes,
// through the normal trackScreen() history (Back returns here). Without a
// target a toast is plain text and a tap just dismisses it, as before.
function showToast(message, tone, target) {
  if (activeToastEl) activeToastEl.remove();
  if (toastTimer) clearTimeout(toastTimer);
  const toast = document.createElement("div");
  toast.className = `skrapers-toast ${tone === "good" ? "good" : "bad"}${target ? " linked" : ""}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  if (target) {
    const cta = document.createElement("span");
    cta.className = "skrapers-toast-cta";
    cta.setAttribute("data-testid", "toast-link");
    cta.textContent = `${notificationActionLabel(target)} →`;
    toast.appendChild(cta);
    toast.setAttribute("title", notificationActionLabel(target));
  }
  toast.addEventListener("click", () => {
    toast.remove();
    if (activeToastEl === toast) activeToastEl = null;
    if (target) goToNotificationTarget(target);
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
  return shown > 0 ? `${ICON.comment}<span>${COMMENTS.formatCount(shown)}</span>` : ICON.comment;
}

// Stage 31 (#2, bug fix): the post action row's three labels are MARKUP —
// an inline <svg> icon plus text — so they must only ever be written with
// innerHTML. Two refresh paths (a comment posted, an author's reply
// arriving) used to write commentButtonLabel() with textContent, which
// printed the raw "<svg class=...>" string on the page next to the Attach
// Pin / Authentic? buttons — and only on posts that had just gained a
// comment, which is why it looked inconsistent. Every write of these labels
// now goes through setPostActionLabel(), the one place that sets them, so
// the initial render and every refresh are byte-for-byte the same markup.
//
// Stage 32 (#1): this button used to be "Report Bot" — a free, private,
// no-consequence marker (toggleRedFlag/isRedFlagged), with a SEPARATE
// manual step to actually pin the account from your profile's "Your
// Flagged Posts" list. That two-step hop is gone: the button now reads
// "Attach Pin" and pins the account straight to the Case Board on the same
// click (see the .flag-red handler below). The underlying red-flag toggle
// itself stays — leads/comment-growth (isRedFlagged, ~line 1184) and the
// profile's flagged-posts history still key off it — this only changes
// what the button is CALLED and adds the pin as a direct side effect,
// rather than ripping out a mechanic other systems depend on.
function redFlagLabel(postId, acctId) {
  const active = isRedFlagged(postId);
  const pinned = acctId ? pinnedIds.has(acctId) : active;
  return `${ICON.pin}<span>${pinned ? "Pinned" : "Attach Pin"}</span>`;
}

function greenFlagLabel(postId, acctId) {
  return `${ICON.authentic}<span>${isGreenFlagged(postId, acctId) ? "Authentic" : "Authentic?"}</span>`;
}

function setPostActionLabel(btn, html) {
  if (btn) btn.innerHTML = html;
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

// Stage 31 (#4): long post/comment text on an ACCOUNT PROFILE collapses to
// a few lines with a fade and a "Show more" toggle — a profile stacks an
// account's whole timeline, and a handful of long posts pushed everything
// else off screen. Built on the same toggle the comment thread's own
// collapse already uses (renderCommentThread's .thread-collapse-toggle,
// data-collapsed="1"/"0", chevron), extended from "hide a list of rows" to
// "clamp one block of text", rather than a second mechanism. The clamp
// itself is CSS (.text-collapsible.collapsed: line-clamp + fade mask); the
// character threshold only decides which blocks are worth a toggle, and a
// block that turns out to fit in COLLAPSE_LINES once laid out drops its
// toggle again on the next frame.
const COLLAPSE_CHAR_THRESHOLD = 220;
const COLLAPSE_LINES = 4;

function makeTextCollapsible(textEl) {
  if (!textEl || (textEl.textContent || "").trim().length <= COLLAPSE_CHAR_THRESHOLD) return null;
  textEl.classList.add("text-collapsible", "collapsed");
  textEl.style.setProperty("--collapse-lines", String(COLLAPSE_LINES));
  const btn = document.createElement("button");
  btn.className = "thread-collapse-toggle text-collapse-toggle";
  btn.setAttribute("data-collapsed", "1");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("data-testid", "text-collapse-toggle");
  const paint = () => {
    const collapsed = btn.getAttribute("data-collapsed") === "1";
    btn.innerHTML = `${collapsed ? "Show more" : "Show less"} ${ICON.chevronLeft}`;
    btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    textEl.classList.toggle("collapsed", collapsed);
  };
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    btn.setAttribute("data-collapsed", btn.getAttribute("data-collapsed") === "1" ? "0" : "1");
    paint();
  });
  paint();
  textEl.insertAdjacentElement("afterend", btn);
  requestAnimationFrame(() => {
    if (!document.body.contains(textEl) || !textEl.classList.contains("collapsed")) return;
    if (textEl.scrollHeight <= textEl.clientHeight + 2) {
      textEl.classList.remove("text-collapsible", "collapsed");
      btn.remove();
    }
  });
  return btn;
}

// `opts.collapsible` (Stage 31 #4): clamp long text — account profiles pass it.
function renderPost(post, acct, opts) {
  opts = opts || {};
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
        <button class="comment-toggle" aria-label="Comments">${commentButtonLabel(post, acct)}</button>
        <button class="flag-red${pinnedIds.has(acct.id) ? " active" : ""}" title="Attach a pin — sends this account straight to your Case Board">${redFlagLabel(post.id, acct.id)}</button>
        <button class="flag-green${isGreenFlagged(post.id, acct.id) ? " active" : ""}" title="Mark authentic">${greenFlagLabel(post.id, acct.id)}</button>
      </div>
      <div class="post-thread" style="display:none;"></div>
    </div>
  `;
  if (opts.collapsible) makeTextCollapsible(div.querySelector(".post-text"));
  div.querySelector(".comment-toggle").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleCommentThread(div, post, acct);
  });
  // Stage 17 (flag rework): the lightweight red/green pair — free,
  // togglable, zero credibility/reputation consequence. This REPLACES the
  // old single "Flag" button that called game/state.js's flagAccount()
  // directly; that real accusation only happens from the Case Board's
  // "Formally flag as Skraper" action (see renderInvestigatePanel /
  // renderCaseBoardList) once an account is actually pinned there.
  //
  // Stage 32 (#1): "Attach Pin" — one click now does both what the old
  // "Report Bot" button did (toggleRedFlag, still feeding leads/comment
  // growth) AND pins the account to the active Case Board, matching the
  // exact pin/unpin idiom used everywhere else in the game (quick-pin on a
  // profile, the old two-step flow from "Your Flagged Posts"). Unpinning
  // goes through unpinAccount() so a note or evidence link on that pin is
  // cleaned up the same way it is from any other unpin entry point.
  div.querySelector(".flag-red").addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    toggleRedFlag(post, acct);
    const key = pinKeyFor(currentWorld);
    const nowPinned = !pinnedIds.has(acct.id);
    if (nowPinned) {
      pinnedIds.add(acct.id);
      if (!acct.isSkraper) window.SKRAPERS_TRUST.pin(acct.id);
    } else {
      unpinAccount(key, acct.id);
    }
    btn.classList.toggle("active", nowPinned);
    setPostActionLabel(btn, redFlagLabel(post.id, acct.id));
    showToast(
      nowPinned ? `${acct.name} pinned to the Case Board.` : `${acct.name} removed from the Case Board.`,
      nowPinned ? "good" : null,
      nowPinned ? { type: "board" } : null
    );
    persistNow();
  });
  div.querySelector(".flag-green").addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    toggleGreenFlag(post, acct);
    btn.classList.toggle("active", isGreenFlagged(post.id, acct.id));
    setPostActionLabel(btn, greenFlagLabel(post.id, acct.id));
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
    if (e.target.closest(".post-actions") || e.target.closest(".post-thread") || e.target.closest(".mention") || e.target.closest(".post-network-badge") || e.target.closest(".text-collapse-toggle")) return; // don't navigate on action/thread/mention/badge/show-more taps
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
    showToast(`${acct.name} replied to your comment on their post.`, "good", { type: "postThread", acctId: acct.id, postId: post.id });
    // If this exact thread is still open on screen, refresh it in place
    // rather than leaving it stale until the player re-opens it.
    const openThread = document.querySelector(`.post[data-post-id="${post.id}"] .post-thread`);
    if (openThread && openThread.style.display !== "none") {
      renderCommentThread(openThread, post, acct);
      setPostActionLabel(postDivCommentButton(openThread), commentButtonLabel(post, acct));
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
    row.innerHTML = `${avatarHtml}<div style="flex:1; min-width:0;"><span data-comment-name style="font-weight:600; color:${color}; ${clickable ? "cursor:pointer;" : ""}">${c.author}${c.kind === "author" ? ` ${ICON.pen}` : ""}</span> <span style="color:var(--grey); font-size:11px;">· ${c.minsAgo}m</span><div class="comment-text">${c.text}</div></div>`;
    if (clickable) {
      const goToCommenter = (e) => {
        e.stopPropagation();
        renderProfile(c.authorAcctId);
      };
      row.querySelector("[data-comment-avatar]").addEventListener("click", goToCommenter);
      row.querySelector("[data-comment-name]").addEventListener("click", goToCommenter);
    }
    list.appendChild(row);
    // Stage 31 (#4): long comments clamp too, on a profile's timeline.
    if (currentView === "profile") makeTextCollapsible(row.querySelector(".comment-text"));
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
      setPostActionLabel(postDivCommentButton(thread), commentButtonLabel(post, acct));
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

// Stage 31 (#8): ALGO//'s reason for each inert composer action — the OPSEC
// half of the joke. The lead-in ("It wouldn't be wise to add that.") is the
// same every time; this is the part that says why.
const BAIT_OPSEC_LINES = {
  photo: "A real photo carries a real face, a real room and real metadata. You're not supposed to exist.",
  checkin: "Checking in tells every account you're watching exactly where to look for you.",
  location: "An undercover account doesn't volunteer where it is. Leave that to the ones you're investigating.",
};

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
    // Stage 31 (#8): laid out like the familiar status composer — a text
    // box, then a row of secondary actions under a divider — in SKRAPERS'
    // own palette. The text box is the real action (it opens the bait-
    // phrase picker, unchanged). Photo / Check in / Location are inert on
    // purpose: the player is undercover, and a real photo or a real place
    // is exactly what would blow that cover — so ALGO// talks them out of it.
    panel.classList.add("bait-composer-idle");
    panel.innerHTML = `
      <div class="bait-composer-title">${ICON.fishingRod} Create click bait post</div>
      <div class="bait-composer-row" data-action="open-bait-picker" role="button" tabindex="0" aria-label="Write a click bait post">
        <div class="avatar" style="--avatar-hue:201;">${initials("You")}</div>
        <div class="bait-composer-prompt">What's the bait, Detective?</div>
      </div>
      <div class="bait-picker" style="display:none; flex-wrap:wrap; gap:6px; margin-top:10px;"></div>
      <div class="bait-composer-actions" data-testid="bait-composer-actions">
        <button class="bait-composer-action" data-opsec="photo" data-testid="bait-action-photo">${ICON.camera}<span>Photo</span></button>
        <button class="bait-composer-action" data-opsec="checkin" data-testid="bait-action-checkin">${ICON.checkIn}<span>Check in</span></button>
        <button class="bait-composer-action" data-opsec="location" data-testid="bait-action-location">${ICON.globe}<span>Location</span></button>
      </div>
    `;
    panel.querySelectorAll("[data-opsec]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showToast(`ALGO//: It wouldn't be wise to add that. ${BAIT_OPSEC_LINES[btn.getAttribute("data-opsec")] || ""}`.trim(), "bad");
      });
    });
    const openBtn = panel.querySelector('[data-action="open-bait-picker"]');
    openBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openBtn.click();
      }
    });
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
  // Stage 32 (#7): a case that points at the Marketplace says so here.
  const marketHook = isCase ? activeMarketHook() : null;
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
    ${tutorialActive() ? `<div class="case-review-limit" data-testid="case-brief-walkthrough">${ICON.bulb} Your first case: ALGO// will point things out as you reach them, one at a time. You can skip the walkthrough whenever you like.</div>` : ""}
    ${marketHook ? `<div class="case-review-limit case-market-hook" data-testid="case-brief-market">${ICON.market} <span>${escapeHtml(marketHook.briefing)} <button class="case-hint-btn" data-open-market data-testid="case-brief-market-open">${ICON.market} Open Marketplace</button></span></div>` : ""}`
        : ""
    }
  `;
  const marketBtn = brief.querySelector("[data-open-market]");
  if (marketBtn) marketBtn.addEventListener("click", () => renderMarketplace());
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
    </div>
  `;
  banner.querySelectorAll(".promo-ticker-item").forEach((btn) => {
    btn.addEventListener("click", () => renderProfile(btn.getAttribute("data-acct-id")));
  });
  // Width is only measurable once the strip is in the document — renderFeed
  // appends it synchronously right after this returns, so a rAF is enough.
  requestAnimationFrame(() => {
    const run = banner.querySelector(".promo-ticker-run");
    const track = banner.querySelector(".promo-ticker-track");
    if (!run || !track || !document.body.contains(banner)) return;
    const seconds = Math.max(14, run.scrollWidth / PROMO_TICKER_PX_PER_SECOND);
    track.style.animationDuration = `${seconds.toFixed(1)}s`;
  });
  return banner;
}

// Round 27 (#3): Home's persistent "current focus" line. Endless scroll
// makes it easy to lose the thread of what you were even looking for on a
// given visit, so ALGO// — in the same deniable voice it uses for its own
// notifications (game/algomsgs.js's focusNudgeText) — keeps one soft hint
// pinned near the top of Home: a real, still-unflagged Skraper in the live
// Home world, described by whichever of its OWN signals is genuinely
// loudest (or, about a third of the time, paired with a real neighbor from
// its follow/tag graph, so the line points at a relationship without
// saying which side of it is the problem). Never a verdict, never "bot".
//
// Cadence: it persists across visits (and reloads) rather than being a
// toast that scrolls away, and only changes every FOCUS_REFRESH_RENDERS
// full Home renders. If the player acts on it (formally flags the target)
// it goes quiet until the cadence comes round again, rather than chaining
// them straight on to the next Skraper — it's a nudge, not a trail of
// breadcrumbs. Dismissing it hides that line until the next refresh.
// Target selection is systemic, so it uses the project's seeded-PRNG
// convention (seeded off the Home world + a sequence number), not
// Math.random.
let focusNudge = null; // { acctId, pairId, text, renders, seq, worldSeed, dismissed }
const FOCUS_REFRESH_RENDERS = 4;

function focusRng(seedStr) {
  let a = avatarHashSeed(seedStr) >>> 0; // same mulberry32 shape as simulation/worldgen.js
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIGNAL_KIND = { "Posting cadence": "cadence", "Activity-hour pattern": "activity", "Linguistic consistency": "linguistic" };
const LEVEL_RANK = { high: 2, medium: 1, low: 0 };

function pickFocusTarget(seq, avoidId) {
  const rng = focusRng(`${currentWorld.seed || "home"}-focus-${seq}`);
  const live = accounts.filter((a) => a.isSkraper && !gameState.flagged[a.id] && (a.posts || []).length);
  if (!live.length) return null;
  // Prefer accounts whose posts the player can actually see right now.
  const loaded = new Set(homeRenderedPosts.map((p) => p.acct.id));
  let pool = live.filter((a) => loaded.has(a.id));
  if (!pool.length) pool = live;
  if (pool.length > 1 && avoidId) pool = pool.filter((a) => a.id !== avoidId);
  const acct = pool[Math.floor(rng() * pool.length)];

  let kind = "network";
  let best = 0;
  computeSignals(acct).forEach((sig) => {
    const rank = LEVEL_RANK[sig.level] || 0;
    if (rank > best) {
      best = rank;
      kind = SIGNAL_KIND[sig.label] || "network";
    }
  });

  let pair = null;
  if (rng() < 0.34) {
    const idx = mentionIndex();
    const links = idx.get(acct.id);
    const neighborIds = new Set([...(acct.following || []), ...(links ? [...links.out, ...links.in] : [])]);
    const humans = [...neighborIds].map(accountById).filter((a) => a && !a.isSkraper && a.id !== BAIT.PLAYER_ACCT_ID);
    if (humans.length) pair = humans[Math.floor(rng() * humans.length)];
  }
  // Pair order is randomized so the Skraper isn't always the first handle.
  const swap = pair && rng() < 0.5;
  const text = window.SKRAPERS_ALGOMSGS.focusNudgeText(
    { handle: swap ? pair.handle : acct.handle, kind, pairHandle: pair ? (swap ? acct.handle : pair.handle) : null },
    (list) => list[Math.floor(rng() * list.length)]
  );
  return { acctId: acct.id, pairId: pair ? pair.id : null, text };
}

// Called once per full Home render (renderFeed), after the post list is
// known. Advances the cadence and picks a fresh line when it's due.
function refreshFocusNudge() {
  if (currentWorld.kind !== "procedural") return false;
  const n = focusNudge;
  const sameWorld = !!n && n.worldSeed === currentWorld.seed;
  if (sameWorld) {
    n.renders = (n.renders || 0) + 1;
    if (n.acctId && (!accountById(n.acctId) || gameState.flagged[n.acctId])) {
      n.acctId = null; // acted on (or gone): go quiet until the cadence comes round
      n.pairId = null;
      n.text = null;
    }
    if (n.renders < FOCUS_REFRESH_RENDERS) return false;
  }
  const seq = n ? (n.seq || 0) + 1 : 1;
  const pick = pickFocusTarget(seq, n && n.acctId);
  focusNudge = { acctId: null, pairId: null, text: null, ...(pick || {}), renders: 0, seq, worldSeed: currentWorld.seed, dismissed: false };
  return true; // a new line was picked — the caller saves it
}

function renderFocusNudge() {
  const n = focusNudge;
  if (!n || !n.text || n.dismissed || n.worldSeed !== currentWorld.seed) return null;
  const el = document.createElement("div");
  el.className = "focus-nudge";
  el.setAttribute("data-testid", "focus-nudge");
  let html = escapeHtml(n.text);
  [n.acctId, n.pairId].filter(Boolean).forEach((id) => {
    const a = accountById(id);
    if (!a) return;
    const h = escapeHtml(a.handle);
    html = html.split(h).join(`<span class="focus-nudge-handle" data-acct-id="${a.id}">${h}</span>`);
  });
  el.innerHTML = `
    <span class="focus-nudge-icon">${ICON.eye}</span>
    <div class="focus-nudge-body"><span class="focus-nudge-kicker">ALGO// · current focus</span><span class="focus-nudge-text">${html}</span></div>
    <button class="focus-nudge-dismiss icon-btn icon-btn-subtle" aria-label="Dismiss">${ICON.close}</button>
  `;
  el.querySelectorAll(".focus-nudge-handle").forEach((span) => {
    span.addEventListener("click", () => renderProfile(span.getAttribute("data-acct-id")));
  });
  el.querySelector(".focus-nudge-dismiss").addEventListener("click", () => {
    n.dismissed = true;
    el.remove();
    persistNow();
  });
  return el;
}

// Round 27 (#2): a case's running review status, shown on the case's own
// feed once the player has made at least one wrongful formal flag in this
// attempt — so the failure state is never a surprise: you can always see
// how close to it you are.
function renderCaseReviewStrip() {
  if (currentWorld.kind !== "case" || isCaseCompleted(currentWorld.caseId)) return null;
  const strikes = wrongfulFlagCount();
  if (!strikes) return null;
  const limit = wrongFlagLimitFor(currentWorld.accountCount, currentWorld.caseId);
  const el = document.createElement("div");
  el.className = "case-review-strip" + (strikes >= limit - 1 ? " critical" : "");
  el.setAttribute("data-testid", "case-review-strip");
  el.innerHTML = `${ICON.warning} <span><b>Under review:</b> ${strikes} of ${limit} wrongful flags in this case.${strikes >= limit - 1 ? " One more and the file is pulled." : ""}</span>`;
  return el;
}

// Stage 15: renders the feed screen for whichever world is currently
// loaded — Home (endless scroll), Daily, or a curated case reached via
// Story. Which header and which bottom-nav tab (if any) it shows depends
// entirely on currentWorld.kind.
// Feature round (Home topbar search): renders only the post-list portion
// of Home's feed from `homeRenderedPosts` — the exact set of posts already
// loaded into the DOM (initial batch + every loadMoreIntoFeed batch) —
// filtered by the active search query, if any. Kept separate from
// renderFeed so typing in the search box can refresh just this, without
// re-running tickWorld/trust/comment-growth or losing scroll position.
function renderHomePostList(feedEl) {
  feedEl.innerHTML = "";
  // Round 23 (#4): re-filter suspended accounts out of the already-loaded
  // list on every call, not just at load time — a suspension that happens
  // mid-session (via the Case Board) pulls that account's posts out of the
  // live feed the next time it renders, same as new posts never generating
  // for it in the first place (see allPostsFeed).
  homeRenderedPosts = homeRenderedPosts.filter((post) => !isSuspended(post.acct.id));
  const list = homeSearchActive ? homeRenderedPosts.filter((post) => matchesSearch(post, post.acct, homeSearchQuery)) : homeRenderedPosts;
  if (list.length === 0) {
    feedEl.innerHTML = homeSearchActive
      ? `<div class="empty-state">No matches for "${escapeHtml(homeSearchQuery)}" among what's loaded yet. Clear the search (✕) to keep scrolling, or try another term.</div>`
      : `<div class="empty-state">Nothing in the feed yet.</div>`;
    return;
  }
  list.forEach((post) => feedEl.appendChild(renderPost(post, post.acct)));
}

// Attaches/detaches Home's infinite-scroll listener to match search state
// — while a search is active the feed becomes a finite, filtered list (no
// auto-loading); clearing the search restores normal infinite scroll.
function syncHomeScrollHandler() {
  detachHomeScrollHandler();
  if (homeSearchActive) return;
  homeScrollHandler = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 800;
    if (nearBottom) loadMoreIntoFeed();
  };
  window.addEventListener("scroll", homeScrollHandler);
}

// Called from the search input's own listener — updates the query/active
// flag, re-renders just the post list, and re-syncs the scroll handler,
// all without touching the rest of the screen (topbar, composer, nav).
function updateHomeSearch(query) {
  homeSearchQuery = query;
  homeSearchActive = query.trim().length > 0;
  const feedEl = document.querySelector(".feed");
  if (feedEl) renderHomePostList(feedEl);
  syncHomeScrollHandler();
  const clearBtn = document.querySelector(".topbar-search-clear");
  if (clearBtn) clearBtn.style.display = homeSearchActive ? "flex" : "none";
}

// Round 23 (#8): ALGO// icon left, search middle, hamburger/settings right
// — this SUPERSEDES the old Home-only scoping (was renderHomeTopbar). It's
// now the fixed, sticky bar present at the top of every screen. Search
// itself only actually filters while Home is on screen (see
// updateHomeSearch/renderHomePostList); typed elsewhere, Enter navigates to
// Home and applies it there, which is simpler and cleaner than trying to
// filter a screen that isn't a post list at all (Notifications, Board,
// etc.) — the bar is still visually present and fixed everywhere either
// way, per spec.
function renderGlobalTopbar(isHome) {
  const topbar = document.createElement("div");
  topbar.className = "topbar home-topbar";
  topbar.innerHTML = `
    <div class="wordmark" data-action="algo-home" style="cursor:pointer;">ALGO<span>//</span></div>
    <div class="topbar-search">
      <span class="topbar-search-icon">${ICON.search}</span>
      <input type="text" class="topbar-search-input" placeholder="${isHome ? "Search accounts, posts, signals…" : "Search (jumps to Home)…"}" value="${isHome ? escapeHtml(homeSearchQuery) : ""}" />
      <button class="topbar-search-clear" style="display:${isHome && homeSearchActive ? "flex" : "none"};" aria-label="Clear search">${ICON.close}</button>
    </div>
    <button class="topbar-menu-btn icon-btn" aria-label="Settings">${ICON.menu}</button>
  `;
  const input = topbar.querySelector(".topbar-search-input");
  if (isHome) {
    input.addEventListener("input", (e) => updateHomeSearch(e.target.value));
    input.addEventListener("focus", showSearchSuggestions);
    // Round 28 (#3): a search is "made" when the player commits to it —
    // Enter, or leaving the box with a query still in it — not on every
    // keystroke, so the recent list holds real searches, not "c", "ca"...
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") recordRecentSearch(input.value);
    });
    input.addEventListener("blur", () => {
      recordRecentSearch(input.value, true);
      setTimeout(hideSearchSuggestions, 180);
    });
  } else {
    // Not on Home: don't touch homeSearchQuery/homeSearchActive as the
    // player types (that would silently start filtering a feed that isn't
    // on screen) — only Enter commits it, by navigating to Home first.
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const q = input.value;
      recordRecentSearch(q);
      goHome();
      updateHomeSearch(q);
      const homeInput = document.querySelector(".topbar-search-input");
      if (homeInput) {
        homeInput.value = q;
        homeInput.focus();
      }
    });
  }
  topbar.querySelector(".topbar-search-clear").addEventListener("click", () => {
    input.value = "";
    if (isHome) updateHomeSearch("");
    input.focus();
  });
  topbar.querySelector(".topbar-menu-btn").addEventListener("click", renderSettingsPanel);
  topbar.querySelector('[data-action="algo-home"]').addEventListener("click", goHome);
  return topbar;
}

// Round 23 (#8): wraps the global topbar together with a screen's own
// secondary header row (back button / screen title), as ONE sticky unit —
// see .topbar-stack in ui/styles.css. `secondaryHtml` is optional; Home
// itself passes none (it has no back button/title of its own).
function renderTopbarStack(secondaryHtml, isHome) {
  const stack = document.createElement("div");
  stack.className = "topbar-stack";
  stack.appendChild(renderGlobalTopbar(!!isHome));
  if (secondaryHtml) {
    const secondary = document.createElement("div");
    secondary.className = "topbar topbar-secondary";
    secondary.innerHTML = secondaryHtml;
    stack.appendChild(secondary);
  }
  return stack;
}

// The "premade library of useful terms" as tappable chips just under the
// topbar — see suggestedSearchTerms() for the static+player-activity mix.
// Round 23 (#1): hidden by default — only shown once the player actually
// taps/focuses the search field ("don't show all the @tags at the top"),
// standard focus-reveals-suggestions UX. Hidden again on blur (with a
// short delay so a chip's own click still registers before the blur hides
// it — mousedown-before-click ordering) and whenever the search is
// cleared.
// Round 28 (#3): the player's own recent searches, most recent first,
// de-duplicated (case-insensitively) and capped — see recentSearches.
// `deferRefresh`: the blur path. A blur fires on the mousedown of a click
// on one of the dropdown's own chips — rebuilding the chips right then
// would swap the element out from under that click and eat it — so the
// refresh waits until the dropdown has hidden itself.
function recordRecentSearch(query, deferRefresh) {
  const q = String(query || "").trim().slice(0, 60);
  if (q.length < 2) return;
  const had = recentSearches.length && recentSearches[0].toLowerCase() === q.toLowerCase();
  if (had) return;
  recentSearches = [q, ...recentSearches.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, RECENT_SEARCH_MAX);
  persistNow();
  const refresh = () => {
    const wrap = document.querySelector(".search-suggestions");
    if (wrap) fillSearchSuggestions(wrap);
  };
  if (deferRefresh) setTimeout(refresh, 250);
  else refresh();
}

function renderSearchSuggestions() {
  const wrap = document.createElement("div");
  wrap.className = "search-suggestions hidden";
  fillSearchSuggestions(wrap);
  return wrap;
}

// Split out so a newly-recorded search can refresh the dropdown in place.
// Recent searches get their own labelled row above the suggested terms, so
// the player can see (and re-run) their own investigative trail.
function fillSearchSuggestions(wrap) {
  const terms = suggestedSearchTerms();
  const recentHtml = recentSearches.length
    ? `<div class="search-recent" data-testid="search-recent"><span class="search-recent-label">${ICON.clock} Your recent searches</span>${recentSearches
        .map((t) => `<button class="search-chip recent" data-term="${escapeHtml(t)}" data-testid="search-recent-chip">${escapeHtml(t)}</button>`)
        .join("")}<button class="search-recent-clear" data-recent-clear aria-label="Clear recent searches">Clear</button></div>`
    : "";
  // Stage 31 (#5): the suggested terms get their own small header, so the
  // row reads as a feature ("these are worth searching") rather than an
  // unlabelled strip of pills.
  const topHtml = terms.length
    ? `<div class="search-top" data-testid="search-top"><span class="search-top-label">${ICON.trending} Top searches</span>${terms
        .map((t) => `<button class="search-chip" data-term="${escapeHtml(t)}">${escapeHtml(t)}</button>`)
        .join("")}</div>`
    : "";
  wrap.innerHTML = recentHtml + topHtml;
  wrap.querySelectorAll(".search-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const term = chip.getAttribute("data-term");
      const input = document.querySelector(".topbar-search-input");
      if (input) input.value = term;
      updateHomeSearch(term);
      recordRecentSearch(term);
    });
  });
  const clear = wrap.querySelector("[data-recent-clear]");
  if (clear) {
    // mousedown, not click: keeps focus in the search box so the dropdown
    // (hidden on blur) doesn't vanish out from under the button.
    clear.addEventListener("mousedown", (e) => {
      e.preventDefault();
      recentSearches = [];
      persistNow();
      fillSearchSuggestions(wrap);
    });
  }
}

function showSearchSuggestions() {
  const wrap = document.querySelector(".search-suggestions");
  if (wrap) wrap.classList.remove("hidden");
}

function hideSearchSuggestions() {
  const wrap = document.querySelector(".search-suggestions");
  if (wrap) wrap.classList.add("hidden");
}

// Item 9: the two buttons directly beneath Home's status/bait composer —
// "Main Feed" (the endless-scroll world already on screen, so this is
// just a visual "you are here" affordance) and "Case Load" (the entry
// point into the reworked one-case-at-a-time Story screen, item 12 —
// moved here from the profile menu, its only remaining entry point).
// Bug fix (hot-swap): "Main Feed" used to always be shown active with a
// no-op scrollTo click handler, because this row only ever rendered while
// Home was already the active world (see renderFeed) — there was no way to
// reach it from a case's own feed at all. Now rendered on BOTH Home's and
// a case's feed, with "active" reflecting whichever world is actually
// loaded, and "Main Feed" performs a real hot-swap to Home (via goHome(),
// which snapshots the case being left so it can be resumed later) rather
// than just scrolling — only a no-op scroll-to-top while Home is already
// the world on screen.
function renderHomeTabsRow() {
  const isHome = currentWorld.kind === "procedural";
  const row = document.createElement("div");
  row.className = "home-tabs-row";
  row.innerHTML = `
    <button class="home-tab-btn${isHome ? " active" : ""}" data-action="main-feed" aria-label="View Feed">${ICON.home} View Feed</button>
    <button class="home-tab-btn${isHome ? "" : " active"}" data-action="case-load" aria-label="View Case Load">${ICON.book} View Case Load</button>
  `;
  row.querySelector('[data-action="main-feed"]').addEventListener("click", () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    goHome();
  });
  row.querySelector('[data-action="case-load"]').addEventListener("click", goStory);
  return row;
}

function renderFeed(isReturning, opts) {
  opts = opts || {};
  currentView = "feed";
  trackScreen(() => renderFeed(true), "feed:" + pinKeyFor(currentWorld));
  detachHomeScrollHandler();
  app.innerHTML = "";
  applyPhaseClass();
  const isHome = currentWorld.kind === "procedural";

  if (isHome) {
    app.appendChild(renderTopbarStack(null, true));
    app.appendChild(renderSearchSuggestions());
    // Round 23 (#6): re-roll on every full Home render (return to feed, new
    // world, search cleared, etc.) rather than every scroll tick — periodic,
    // not constant.
    maybeRollPromoBanner();
    if (promoBannerVisible) {
      const promo = renderPromoBanner();
      if (promo) app.appendChild(promo);
      else promoBannerVisible = false;
    }
  } else {
    app.appendChild(renderTopbarStack(null, false));
  }

  if (opts.returningBanner) {
    const banner = document.createElement("div");
    banner.style.cssText = "margin:10px 18px 0; padding:12px 14px; border-radius:12px; font-size:13px; line-height:1.5; background:rgba(29,155,240,0.08); border:1px solid rgba(29,155,240,0.25); font-family:'Space Grotesk',monospace;";
    banner.textContent = opts.returningBanner;
    app.appendChild(banner);
  }

  let focusSlot = null;
  let caseSlot = null;
  if (isHome) {
    app.appendChild(renderStatusComposer());
    app.appendChild(renderHomeTabsRow());
    // Round 27 (#3): filled in below, once this render's post list (which
    // the nudge prefers to point into) is known.
    focusSlot = document.createElement("div");
    app.appendChild(focusSlot);
    if (epilogueUnlocked) {
      const epi = document.createElement("div");
      epi.style.margin = "0 18px 12px";
      epi.innerHTML = `<button class="investigate-btn" data-action="epilogue" style="margin-top:0; background:transparent; color:var(--red); border:1px solid var(--red); font-size:13px; padding:8px 12px;">${ICON.lockOpen} Unread signal</button>`;
      epi.querySelector("button").addEventListener("click", renderEpilogue);
      app.appendChild(epi);
    }
  } else {
    if (!isReturning) app.appendChild(renderCaseBrief());
    // Hot-swap fix: a case's own feed now offers the same Main Feed/Case
    // Load row Home has, so the player can hot-swap OUT of a case without
    // going through the bottom-nav Home tab or the Case Board's Back
    // button — see renderHomeTabsRow.
    app.appendChild(renderHomeTabsRow());
    const strip = renderCaseReviewStrip();
    if (strip) app.appendChild(strip);
    // Round 28 (#2/#5): the pull budget and the "I'm stuck" hint, on every
    // render of the case's feed (the brief above only shows on first entry).
    const tools = renderCaseToolsStrip();
    if (tools) app.appendChild(tools);
    // Stage 31 (#11): the collapsed "What to check" reference card.
    const checklist = renderWhatToCheckPanel();
    if (checklist) app.appendChild(checklist);
    // Round 30 (#3): ALGO//'s "next step" line — the case-feed sibling of
    // Home's current-focus nudge, reacting to what this attempt has done.
    const nudge = renderCaseNudge();
    if (nudge) app.appendChild(nudge);
    // Round 29 (#4/#5/#6): ALGO//'s pre-flag, Halloway's call and the
    // Feed/Timeline toggle — filled in below, once this render's world tick
    // (which is what can bring Halloway's call due) has happened.
    caseSlot = document.createElement("div");
    app.appendChild(caseSlot);
  }
  const feed = document.createElement("div");
  feed.className = "feed";
  app.appendChild(feed);

  // World keeps moving while the player is away, but not on the very
  // first cold load — a fresh session should open on a realistic resting
  // state, not one that's already grown from a visit that never happened.
  // Round 30: `opts.noTick` re-draws a returning screen in place (a
  // Settings change such as Simplified Mode) without it counting as time
  // passing — no world tick, no "while you were away".
  if (isReturning && !opts.noTick) {
    const changes = tickWorld(accounts);
    const grew = changes.filter((c) => c.followerGrowth).length;
    if (grew > 0) {
      showToast(
        `While you were away: an unflagged account gained followers${changes.some((c) => c.newPost) ? " and posted again" : ""}.`,
        "bad"
      );
    }
    processTrustReactions();
    processCommentGrowth();
    maybeAutoTriggerEvent();
    if (isHome) BAIT.tickBaitReplies(accounts); // status composer above reflects this on the render below
    if (isHome) maybeInjectHostileFeedContent();
    const phase = currentPhase();
    const glitch = window.SKRAPERS_HORROR.maybeGlitchEvent(phase);
    if (glitch) showToast(glitch.text, "bad");
    persistNow();
  }

  let caseTopics = [];
  if (caseSlot) {
    const planned = planSecondOpinions();
    const flagged = maybeFirePreflag();
    const fired = maybeFireRivalCall();
    if (planned || flagged || fired) persistNow();
    const frag = document.createDocumentFragment();
    [renderPreflagStrip(), renderRivalCard()].forEach((el) => el && frag.appendChild(el));
    caseTopics = worldTopics();
    if (caseTopics.length) frag.appendChild(renderFeedModeToggle((mode) => fillCaseFeed(feed, caseTopics, mode)));
    caseSlot.replaceWith(frag);
  }

  const posts = isHome ? allPostsFeed() : [];
  if (!isHome) {
    fillCaseFeed(feed, caseTopics, caseFeedModes[pinKeyFor(currentWorld)] || "feed");
  } else if (posts.length === 0) {
    feed.innerHTML = `<div class="empty-state">Nothing in the feed yet.</div>`;
  } else {
    // Stage 15: true infinite scroll — only a growing prefix of the feed
    // is in the DOM at a time, extended by loadMoreIntoFeed() as the
    // player nears the bottom. Feature round: homeRenderedPosts tracks
    // that exact loaded prefix so search filtering has a stable list to
    // work from (see renderHomePostList) — homeSearchActive/Query persist
    // across a normal re-render (e.g. returning to Home) rather than
    // resetting, since the player's filter is a deliberate choice.
    if (!homeLoadedCount) homeLoadedCount = Math.min(HOME_INITIAL_POSTS, posts.length);
    homeRenderedPosts = posts.slice(0, homeLoadedCount);
    renderHomePostList(feed);
    syncHomeScrollHandler();
  }

  if (focusSlot) {
    if (refreshFocusNudge()) persistNow();
    const nudge = renderFocusNudge();
    if (nudge) focusSlot.replaceWith(nudge);
    else focusSlot.remove();
  }

  const navKey = isHome ? "home" : null;
  app.appendChild(renderBottomNav(navKey));

  // Stage 33: Case 001's walkthrough opens on the case's own feed.
  if (!isHome) queueWalkthroughBeat("open");

  // Round 27 (#4): the second gotcha — only ever on a RETURN to Home (never
  // the cold first render, never mid-case), at most once per playthrough.
  if (isHome && isReturning) maybeTriggerSecurityGotcha();
}

// Round 29 (#4): a case feed's post list, in whichever mode the player has
// chosen — the ordinary Feed, or the Timeline of the case's topic.
function fillCaseFeed(feedEl, topics, mode) {
  feedEl.innerHTML = "";
  if (mode === "timeline" && topics && topics.length) {
    if (!gameState.timelineViewed) {
      gameState.timelineViewed = true;
      persistNow();
    }
    feedEl.appendChild(renderTopicTimeline(topics[0]));
    return;
  }
  const posts = allPostsFeed();
  if (!posts.length) {
    feedEl.innerHTML = `<div class="empty-state">Nothing in the feed yet.</div>`;
    return;
  }
  posts.forEach((post) => feedEl.appendChild(renderPost(post, post.acct)));
}

// Round 27: `opts.focus === "connections"` opens the Connections panel
// straight away and scrolls to its tag section (the post network badge,
// item #7) — WITHOUT opening Investigate, since opening Investigate on a
// real person is a Trust-costing glance (game/trust.js) and a badge tap
// shouldn't silently spend that.
function renderProfile(acctId, opts) {
  opts = opts || {};
  const acct = accounts.find((a) => a.id === acctId);
  // Round 27 (bug fix): defensive — every caller should only ever pass an
  // id from the live roster (and goBack() now guarantees that for history
  // replays), but a stale id must degrade to "stay where you are", never a
  // thrown TypeError on acct.name that leaves the app on a blank screen.
  if (!acct) {
    if (!app.children.length) goHome();
    showToast("That account isn't part of the network you're looking at right now.", "bad");
    return;
  }
  currentView = "profile";
  trackScreen(() => renderProfile(acctId, opts), "profile:" + acctId);
  detachHomeScrollHandler();
  app.innerHTML = "";
  // Stage 18 (#1): navigating to a profile always lands scrolled to the
  // top, regardless of wherever the previous screen was scrolled to (a
  // comment-thread click deep in Home's infinite scroll, for instance).
  window.scrollTo(0, 0);

  // Bug fix (real Back button): used to hardcode renderFeed(true) — always
  // the raw Feed, even if the player reached this profile from the Case
  // Board, Notifications, Inbox, another profile's Connections panel, etc.
  // Now pops the real navigation history — see goBack().
  const topbar = renderTopbarStack(`<button class="back-btn">${ICON.chevronLeft} Back</button>`, false);
  topbar.querySelector(".back-btn").addEventListener("click", () => goBack());
  app.appendChild(topbar);

  // Feature round (#1a): the suspended-account state is otherwise only
  // visible via the button label and the greyed-out posts below — this
  // gives the account's OWN profile a real in-fiction line about it too,
  // near the bio, per spec.
  const suspended = isSuspended(acct.id);
  const appealed = isFalselyFlagged(acct.id);
  const statusBadgeHtml = suspended
    ? `<div class="account-status-badge suspended">${ICON.warning} Account suspended pending review</div>`
    : appealed
    ? `<div class="account-status-badge appealed">Flag appealed — no violation found</div>`
    : "";
  // Round 29 (#6/#5): what ALGO// and Halloway have said about THIS account.
  const pfLive = activePreflag();
  const pf = pfLive && pfLive.acctId === acct.id ? pfLive : null;
  const canContest = !!pf && !pf.outcome && !gameState.flagged[acct.id] && !isCaseCompleted(currentWorld.caseId);
  const preflagHtml = pf
    ? `<div class="preflag-badge${pf.outcome ? ` ${pf.outcome}` : ""}" data-testid="preflag-badge">${ICON.eye} <span>${
        {
          confirmed: "ALGO// pre-flagged this account, and your review agreed.",
          "followed-wrong": "ALGO// pre-flagged this account. You flagged it on the platform's word — and it was a real person.",
          overturned: "ALGO// pre-flagged this account. You contested it and proved the platform wrong.",
          "contest-failed": "ALGO// pre-flagged this account. You contested it — and ALGO// was right.",
          stood: "ALGO// pre-flagged this account. Nobody contested it.",
        }[pf.outcome] || "ALGO// pre-flagged this account as a probable Skraper before you started."
      }</span>${canContest ? `<button class="preflag-contest-btn" data-action="contest-preflag" data-testid="contest-preflag">Contest ALGO//'s flag</button>` : ""}</div>`
    : "";
  const rvLive = activeRivalCall();
  const rv = rvLive && rvLive.acctId === acct.id ? rvLive : null;
  const rivalHtml = rv ? `<div class="rival-badge-line" data-testid="rival-badge-line">${ICON.pen} ${escapeHtml(window.SKRAPERS_NARRATIVE.RIVAL.name)} (M.A.I.) has publicly called this account a Skraper.${rv.stance ? ` You ${rv.stance === "agree" ? "agreed" : "disagreed"} in public.` : ""}</div>` : "";

  // Item 7 (b): a direct-from-profile Pin/Unpin quick action — reuses the
  // exact same pin set the Case Board and Investigate panel's own pin
  // button already act on (pinnedIds, currently active for whichever
  // world is loaded), so pinning is a one-click action independent of
  // opening Investigate first.
  const isPinned = pinnedIds.has(acct.id);
  // Round 28 (#4): the stated location is public profile information, free
  // like the join date — checking it against when the account is actually
  // active is what costs a deep pull.
  const deep = ensureDeepSignals(acct);
  const locationHtml = deep && deep.location ? `<span class="profile-location" data-testid="profile-location">${ICON.globe} ${escapeHtml(deep.location.city)}</span>` : "";

  const header = document.createElement("div");
  header.className = "profile-header";
  header.innerHTML = `
    <div class="avatar" ${avatarStyleAttr(acct.id)}>${initials(acct.name)}</div>
    <div class="name">${acct.name}</div>
    <div class="handle">${acct.handle}</div>
    <div class="bio">${acct.bio ? escapeHtml(acct.bio) : "No bio."}</div>
    ${statusBadgeHtml}
    ${preflagHtml}
    ${rivalHtml}
    <div class="profile-stats">
      <span><b>${acct.followers.toLocaleString()}</b> followers</span>
      <span>Joined <b>${acct.joined}</b></span>
      <span><b>${acct.posts.length}</b> posts shown</span>
      ${locationHtml}
    </div>
    <div class="profile-actions">
      <button class="investigate-btn secondary-btn" data-action="investigate"${suspended ? " disabled" : ""}>${suspended ? `${ICON.banned} Suspended` : "Investigate"}</button>
      <button class="investigate-btn secondary-btn${isFollowing(acct.id) ? " active" : ""}" data-action="follow">${isFollowing(acct.id) ? `${ICON.check} Following` : "Follow"}</button>
      <button class="investigate-btn secondary-btn${isAccountTrusted(acct.id) ? " active" : ""}" data-action="trust">${isAccountTrusted(acct.id) ? `${ICON.authentic} Trusted` : "Mark as Trusted"}</button>
      ${simplifiedMode() ? "" : `<button class="investigate-btn secondary-btn" data-action="message">${ICON.mail} Message</button>`}
      <button class="investigate-btn secondary-btn icon-only icon-btn${isPinned ? " active" : ""}" data-action="quick-pin" data-testid="quick-pin" title="${isPinned ? "Pinned — tap to remove from the Case Board" : "Pin to the Case Board"}" aria-label="${isPinned ? "Remove Pin" : "Add as Pin"}" aria-pressed="${isPinned ? "true" : "false"}">${ICON.pin}</button>
      <button class="icon-btn icon-btn-subtle" data-action="icon-key" data-testid="icon-key-btn" title="What do these icons mean?" aria-label="Icon key">${ICON.help}</button>
    </div>
  `;
  // Stage 31 (#7): the icon key, from the one place most of the game's
  // non-obvious icons sit together.
  header.querySelector('[data-action="icon-key"]').addEventListener("click", (e) => {
    e.stopPropagation();
    renderIconLegend();
  });
  const contestBtn = header.querySelector('[data-action="contest-preflag"]');
  if (contestBtn) contestBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    renderContestModal(acct, () => renderProfile(acct.id));
  });
  header.querySelector('[data-action="investigate"]').addEventListener("click", (e) => {
    if (suspended) return;
    const btn = e.currentTarget;
    // Round 27: keyed on the Investigate panel specifically — a Connections
    // panel opened on its own (opts.focus, the post network badge) must not
    // make this button's first click read as "hide".
    const existing = app.querySelector(".investigate-panel:not(.connections-panel)"); // the Connections panel shares the .investigate-panel class
    app.querySelectorAll(".connections-panel").forEach((el) => el.remove());
    if (existing) {
      existing.remove();
      btn.classList.remove("active");
      btn.textContent = "Investigate";
      return;
    }
    btn.classList.add("active");
    btn.textContent = "Hide investigation";
    retireTip("investigate", "done");
    header.insertAdjacentElement("afterend", renderConnectionsPanel(acct));
    header.insertAdjacentElement("afterend", renderInvestigatePanel(acct));
  });
  // Item 7 (b): the standalone quick-action toggle — no Investigate panel,
  // no navigating to the Case Board and back required.
  header.querySelector('[data-action="quick-pin"]').addEventListener("click", (e) => {
    e.stopPropagation();
    const nowPinned = !pinnedIds.has(acct.id);
    const hadNote = !!pinNoteFor(pinKeyFor(currentWorld), acct.id);
    if (nowPinned) {
      pinnedIds.add(acct.id);
      if (!acct.isSkraper) window.SKRAPERS_TRUST.pin(acct.id);
      retireTip("pin", "done");
    } else {
      unpinAccount(pinKeyFor(currentWorld), acct.id);
    }
    persistNow();
    renderProfile(acct.id);
    showToast(
      nowPinned ? `${acct.name} pinned to the Case Board — add a note below so you remember why.` : `${acct.name} removed from the Case Board${hadNote ? " (and your note with it)" : ""}.`,
      "good",
      nowPinned ? { type: "board" } : null
    );
  });
  // Feature round (#2): Follow / Mark as Trusted — both free, reversible,
  // zero-consequence toggles, so a simple re-render of the whole profile
  // after each one (same pattern the pin button already uses below) is
  // all that's needed to keep everything — the button label, the account-
  // level trust reflected on this account's own posts via isGreenFlagged —
  // in sync.
  header.querySelector('[data-action="follow"]').addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFollow(acct.id);
    persistNow();
    renderProfile(acct.id);
  });
  header.querySelector('[data-action="trust"]').addEventListener("click", (e) => {
    e.stopPropagation();
    const result = toggleAccountTrust(acct.id);
    // Feature round: marking an account trusted takes it off the Case
    // Board automatically — a one-way action, see
    // removeAccountFromAllPinSets. Un-trusting later does NOT re-pin it.
    const removedFromBoard = result.active && removeAccountFromAllPinSets(acct.id);
    persistNow();
    renderProfile(acct.id);
    if (removedFromBoard) showToast(`${acct.name} marked trusted — removed from your Case Board.`, "good");
  });
  // Feature round (#2): Message — a single premade-phrase DM exchange per
  // account, reusing the comment system's phrase-picker pattern and
  // author-voice generation (game/comments.js's generateDMReply).
  // Round 30 (#6): in Simplified Mode there is no Message button at all.
  const messageBtn = header.querySelector('[data-action="message"]');
  if (messageBtn) messageBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const existing = app.querySelector(".message-panel");
    if (existing) {
      existing.remove();
      return;
    }
    header.insertAdjacentElement("afterend", renderMessagePanel(acct));
  });
  app.appendChild(header);
  // Round 30 (#1): walkthrough beat — the first profile opened in Case 001
  // (Stage 33: a spotlight on the Investigate button itself).
  if (!suspended) queueWalkthroughBeat("investigate");
  // Round 30 (#5): the Case File's "continue questioning" shortcut lands
  // here with the questions already open.
  if (opts.openMessage && messageBtn) header.insertAdjacentElement("afterend", renderMessagePanel(acct));

  // Round 27 (#6): a pinned account carries the investigator's own note,
  // editable right here beside the pin toggle that created it.
  if (isPinned) app.appendChild(renderPinNoteEditor(pinKeyFor(currentWorld), acct, { variant: "profile" }));

  if (opts.focus === "connections") {
    const conn = renderConnectionsPanel(acct);
    header.insertAdjacentElement("afterend", conn);
    const tagsSection = conn.querySelector(".connections-tags") || conn;
    tagsSection.classList.add("connections-focus");
    requestAnimationFrame(() => tagsSection.scrollIntoView({ block: "center" }));
  }

  const recentActivity = renderRecentActivityPanel(acct);
  if (recentActivity) app.appendChild(recentActivity);

  const topContributors = renderTopContributorsPanel(acct);
  if (topContributors) app.appendChild(topContributors);

  const feed = document.createElement("div");
  feed.className = "feed";
  const timelineLabel = document.createElement("div");
  timelineLabel.className = "empty-state";
  timelineLabel.style.padding = "10px 18px 0";
  timelineLabel.style.textAlign = "left";
  timelineLabel.style.fontFamily = '"Space Grotesk", monospace';
  timelineLabel.style.fontSize = "12px";
  timelineLabel.style.letterSpacing = "0.06em";
  timelineLabel.style.color = "var(--grey)";
  timelineLabel.textContent = "TIMELINE";
  feed.appendChild(timelineLabel);
  acct.posts.forEach((post) => feed.appendChild(renderPost(post, acct, { collapsible: true })));
  app.appendChild(feed);
  app.appendChild(renderBottomNav(null));
}

// Round 29 (#1): the Message panel is now an INTERROGATION — up to
// COMMENTS.INTERROGATION_ROUNDS premade questions per account, each round's
// choices depending on what's already been asked (game/comments.js's
// interrogationOptions), answered from that account's own profile. Every
// question belongs to one fact, asked two ways; once both framings of a
// fact are in, a CROSS-CHECK row lets the player record their own verdict
// ("adds up" / "doesn't add up"). Nothing here says who's lying — the
// answers are the evidence, and a marked contradiction only counts for
// something at the closing report, where it's checked against what the
// account really is. The time question also records the stated city's
// real local time at the moment of asking, so the answer can be checked.
// Questioning a real person is a heavier look than reading their posts:
// the first and last question each cost a Trust glance (game/trust.js).
// A pre-Round-29 save's one-shot exchange (`dms`) is still shown, read-only.
function renderMessagePanel(acct) {
  const panel = document.createElement("div");
  panel.className = "message-panel interrogation-panel";
  panel.setAttribute("data-testid", "interrogation");
  panel.addEventListener("click", (e) => e.stopPropagation());
  const fill = () => {
    const entry = interrogationFor(acct.id);
    const asked = entry ? entry.asked : [];
    const askedIds = asked.map((x) => x.qid);
    const max = COMMENTS.INTERROGATION_ROUNDS;
    const options = COMMENTS.interrogationOptions(askedIds);
    const legacy = dmFor(acct.id);
    const facts = COMMENTS.INTERROGATION_FACTS;
    const checks = Object.entries(facts).filter(([, f]) => askedIds.indexOf(f.a) !== -1 && askedIds.indexOf(f.b) !== -1);
    const answerOf = (qid) => asked.find((x) => x.qid === qid);
    panel.innerHTML = `
      <h4>${ICON.mail} Message ${escapeHtml(acct.name)}</h4>
      <div class="interro-sub">Ask up to ${max} questions. Ask about the same thing two different ways and see whether the story holds. ${asked.length}/${max} asked.</div>
      ${legacy ? `<div class="dm-row dm-you"><b>You, earlier</b><div>${escapeHtml(legacy.sentText)}</div></div><div class="dm-row dm-them"><b>${escapeHtml(acct.name)}</b><div>${escapeHtml(legacy.replyText)}</div></div>` : ""}
      <div class="interro-transcript">
        ${asked
          .map(
            (x, i) => `
          <div class="dm-row dm-you" data-testid="interro-q"><b>You · Q${i + 1}</b><div>${escapeHtml(x.q)}</div></div>
          <div class="dm-row dm-them${x.silent ? " silent" : ""}" data-testid="interro-a" data-qid="${x.qid}"><b>${escapeHtml(acct.name)}</b><div>${escapeHtml(x.a)}</div>${
              x.clock ? `<div class="interro-clock" data-testid="interro-clock">${ICON.clock} Stated location ${escapeHtml(x.clock.city)} — local time when you asked: <b>${escapeHtml(x.clock.label)}</b></div>` : ""
            }</div>`
          )
          .join("")}
      </div>
      ${
        checks.length
          ? `<div class="interro-checks">${checks
              .map(([fact, f]) => {
                const mark = entry.marks[fact] || null;
                return `<div class="interro-check" data-testid="interro-check" data-fact="${fact}">
            <div class="interro-check-head">${ICON.scan} Cross-check: ${escapeHtml(f.label)}</div>
            <div class="interro-check-pair"><span>“${escapeHtml(answerOf(f.a).a)}”</span><span>“${escapeHtml(answerOf(f.b).a)}”</span></div>
            <div class="interro-check-actions">
              <button class="interro-mark${mark === "consistent" ? " on" : ""}" data-mark="consistent" data-testid="interro-mark-consistent">${ICON.check} Adds up</button>
              <button class="interro-mark bad${mark === "contradiction" ? " on" : ""}" data-mark="contradiction" data-testid="interro-mark-contradiction">${ICON.warning} Doesn't add up</button>
            </div>
          </div>`;
              })
              .join("")}</div>`
          : ""
      }
      ${
        options.length
          ? `<div class="interro-options" data-testid="interro-options">${options
              .map((qid) => `<button class="interro-option${COMMENTS.INTERROGATION_QUESTIONS[qid].crossCheck ? " cross" : ""}" data-qid="${qid}" data-testid="interro-option">${escapeHtml(COMMENTS.questionText(acct, qid))}</button>`)
              .join("")}</div>`
          : `<div class="interro-done">${escapeHtml(acct.name)} won't take any more questions from you.</div>`
      }
    `;
    panel.querySelectorAll("[data-qid].interro-option").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const qid = btn.getAttribute("data-qid");
        const answer = COMMENTS.interrogationAnswer(acct, qid, Date.now());
        const recorded = recordInterrogation(acct.id, qid, COMMENTS.questionText(acct, qid), answer, max);
        if (!recorded) return fill();
        const n = recorded.asked.length;
        if (!acct.isSkraper && (n === 1 || n === max)) window.SKRAPERS_TRUST.glance(acct.id);
        retireTip("interrogate", "done");
        persistNow();
        fill();
        showToast(answer.silent ? `${acct.name} didn't answer.` : `${acct.name} replied.${n >= max ? " That was your last question." : ""}`, "good");
      });
    });
    panel.querySelectorAll(".interro-check").forEach((row) => {
      row.querySelectorAll("[data-mark]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          markCrossCheck(acct.id, row.getAttribute("data-fact"), btn.getAttribute("data-mark"));
          persistNow();
          fill();
        });
      });
    });
  };
  fill();
  // Round 30 (#1): walkthrough beat — the first time questioning is open.
  queueWalkthroughBeat("interrogate");
  return panel;
}

// Stage 18 (#2): "Top Contributors" — the accounts that comment most on
// THIS account's own posts, ranked. For a Skraper, an account that keeps
// showing up here is a real structural signal (part of the same network)
// discoverable the same honest way as the Connections panel's follow
// chains; for a genuinely human account it just tends to surface real
// mutuals, since game/comments.js's commenter bias favors already-
// connected accounts for humans rather than being an automatic tell
// either way. Every entry (except the player's own "You" row) is
// clickable straight to that account's profile, per item #1.
function renderTopContributorsPanel(acct) {
  const top = COMMENTS.topContributorsFor(acct, accounts);
  if (!top.length) return null;
  const panel = document.createElement("div");
  // Deliberately NOT ".investigate-panel" — that class is also how the
  // profile's Investigate toggle (below) detects whether its own panels
  // are currently open (app.querySelector(".investigate-panel, ...")).
  // Reusing it here made this always-visible section get mistaken for an
  // already-open investigation panel, so the Investigate button's very
  // first click silently no-opped. Same visual treatment, different class.
  panel.className = "top-contributors-panel";
  panel.style.cssText = "margin:12px 18px 0; padding:14px; background:rgba(29,155,240,0.06); border:1px solid rgba(29,155,240,0.2); border-radius:var(--radius);";
  panel.innerHTML = `
    <h4 style="margin:0 0 10px; font-family:'Space Grotesk',monospace; font-size:12px; letter-spacing:0.06em; text-transform:uppercase; color:var(--blue);">Top Contributors</h4>
    <div style="font-size:12px; color:var(--grey); margin-bottom:8px;">Accounts that comment most often on ${acct.name}'s posts — repeat commenters can be a real lead, not just chatter.</div>
  `;
  top.forEach((c) => {
    const row = document.createElement("div");
    row.className = "signal-row";
    const isPlayer = c.acctId === "__player__";
    row.style.cursor = isPlayer ? "default" : "pointer";
    row.innerHTML = `<span>${c.name}${c.handle ? ` <span style="color:var(--grey); font-weight:400;">${c.handle}</span>` : ""}</span><span style="color:var(--grey); font-weight:400;">${c.count} comment${c.count === 1 ? "" : "s"}</span>`;
    if (!isPlayer) row.addEventListener("click", () => renderProfile(c.acctId));
    panel.appendChild(row);
  });
  return panel;
}

// Stage 17 (flag rework): the real, consequential accusation — game/
// state.js's flagAccount(), with its credibility swing and (on a correct
// flag) its lead-opening trigger. Now only reachable as a deliberate
// action from the Case Board / a pinned account's Investigate panel,
// never from the feed's lightweight red-flag toggle.
//
// Round 29 (#3): inside a live case, every formal flag now goes through a
// CLOSING REPORT first (renderClosingReport) — the player names the one
// piece of their own gathered evidence they'd put their name to, and the
// flag is filed with it. Home flags (no case to close) go straight through.
function formallyFlagAsSkraper(acct, onDone) {
  if (gameState.flagged[acct.id]) {
    showToast("Already formally flagged — waiting on review.", gameState.flagged[acct.id].correct ? "good" : "bad");
    return;
  }
  if (currentWorld.kind === "case" && !isCaseCompleted(currentWorld.caseId)) {
    renderClosingReport(acct, (choice) => commitFormalFlag(acct, onDone, choice));
    return;
  }
  commitFormalFlag(acct, onDone, null);
}

// The flag itself, and everything it sets off. Every outcome line is
// collected and shown as ONE toast (one line each) rather than a string of
// toasts that each overwrite the last — the flag result, the report's
// verdict, a rival's or ALGO//'s reaction, a lead, a case clearing.
function commitFormalFlag(acct, onDone, choice) {
  const result = flagAccount(acct);
  if (result.alreadyFlagged) {
    showToast("Already formally flagged — waiting on review.", result.correct ? "good" : "bad");
    return;
  }
  const lines = [result.message];
  window.SKRAPERS_ALGO.recordFlag(result.correct, acct);
  window.SKRAPERS_REPUTATION.applyFlagOutcome(result.correct);
  if (choice) {
    const grade = !result.correct ? "wrongful" : choice.real ? "clean" : "lucky";
    recordClosingReport({ acctId: acct.id, name: acct.name, handle: acct.handle, correct: result.correct, grade, evidenceKind: choice.kind, evidenceLabel: choice.label });
    if (result.correct) {
      window.SKRAPERS_ALGO.recordReport(grade);
      lines.push(reportVerdictLine(acct, grade, choice));
    }
  }
  lines.push(...resolveSecondOpinionsOnFlag(acct, result));
  // Stage 31 (#13): where tapping this flag's toast goes, if anywhere.
  let toastTarget = null;
  // Stage 15 lead trigger (a), moved here from the old feed flag button:
  // a correct FORMAL flag opens a new lead — the lightweight toggle no
  // longer carries real consequence, so it no longer triggers one either.
  if (result.correct) {
    const lead = LEADS.addLead("flag", [acct.id]);
    if (lead) {
      toastTarget = { type: "notifications" };
      notifications = [{ id: `${lead.id}-notif`, text: `New lead opened: formally flagging ${acct.name} turned up something worth following further.`, at: Date.now(), target: { type: "profile", acctId: acct.id } }, ...notifications];
      lines.push(`New lead opened — ${acct.name} led somewhere. Check Notifications when you're ready.`);
    }
  }
  checkAlgoMessages();
  const cleared = checkCaseCompletion(result);
  if (cleared) {
    lines.push(cleared);
    toastTarget = { type: "caseload" };
  }
  // Round 27 (#2): a wrongful flag inside an active case counts toward
  // that attempt's review limit — and the one that reaches it pulls the
  // case (failActiveCase navigates away itself, so onDone is skipped).
  if (!result.correct && currentWorld.kind === "case" && !isCaseCompleted(currentWorld.caseId)) {
    const strikes = wrongfulFlagCount();
    const limit = wrongFlagLimitFor(currentWorld.accountCount, currentWorld.caseId);
    if (strikes >= limit) {
      failActiveCase(strikes, limit);
      return;
    }
    lines[0] = `${result.message} Wrongful flags in this case: ${strikes} of ${limit}.${strikes === limit - 1 ? " One more and the file is pulled for review." : ""}`;
    // Round 30 (#4): Case 001's grace is a higher limit AND an explanation
    // — every wrongful flag there says what made that account a person.
    if (currentWorld.caseId === FIRST_CASE_ID) lines.splice(1, 0, firstCaseLesson(acct));
  }
  showToast(lines.filter(Boolean).join("\n"), result.correct ? "good" : "bad", toastTarget);
  persistNow();
  refreshAllCredibilityBadges();
  if (onDone) onDone(result);
}

// ===========================================================================
// Round 29 (#3): THE CLOSING REPORT — score the argument, not just the
// verdict. Before a formal flag inside a case is filed, the player sees
// everything they have actually gathered on that account — the free
// signals it reads HIGH/MEDIUM on, the deep records they spent a pull to
// open, any contradiction they marked in an interrogation, their evidence-
// board links, where it sits on the topic's timeline (if they've read the
// timeline), their own note, and what ALGO// or Halloway said about it —
// and names ONE item as the deciding factor. Gut feeling is always an
// option, and always costs you the "clean" grade.
//
// Scoring (commitFormalFlag): wrong account -> "wrongful" (the existing
// wrongful-flag consequences, unchanged). Right account AND the named item
// is a real tell that account carries -> "clean". Right account, but the
// named item isn't what actually gives it away -> "lucky" — the case still
// clears, and the report says so honestly.
//
// What counts as a "real tell" is decided from the account's generated
// ground truth, never from how loud a readout looks:
//   posting cadence / activity hours  real on a Skraper that posts on a
//                      schedule (every archetype but the sleeper, which is
//                      built to post like a person — a sleeper reading HIGH
//                      there is coincidence);
//   linguistic consistency  never — the codebase's own note is that even
//                      wording doesn't separate people from Skrapers;
//   timezone / photo / record  only if that exact tell was planted on the
//                      account (simulation/worldgen.js's deep.tells) — a red
//                      herring reads just as HIGH and is a real person;
//   engagement / follow reciprocity  real on a Skraper (its engagement and
//                      follow graph are generated from what it is);
//   interrogation contradiction  only if the account's cover story really
//                      slips on that fact (game/comments.js's slips);
//   evidence-board link  only if the account at the other end is ALSO a
//                      Skraper — a real connection in the network;
//   timeline           real on a Skraper that took part in the topic;
//   note / ALGO// pre-flag / Halloway's call / gut  never — your reasoning,
//                      the platform's judgment and a peer's read aren't
//                      evidence you gathered.
// The result feeds Investigation Accuracy (game/algo.js: a lucky catch
// counts half) and the case's completion record (Case Load, Player Profile).
// ===========================================================================
function gatheredEvidenceFor(acct) {
  const key = pinKeyFor(currentWorld);
  const isSk = !!acct.isSkraper;
  const scheduled = isSk && acct.personalityKey !== "sleeper";
  const items = [];
  computeSignals(acct).forEach((sig) => {
    if (sig.level === "low") return;
    const kind = SIGNAL_KIND[sig.label] || "signal";
    items.push({ kind: `signal:${kind}`, group: "Free signals", label: `${sig.label} reads ${sig.level.toUpperCase()}`, detail: sig.value, real: kind !== "linguistic" && scheduled });
  });
  if (isDeepInvestigated(acct.id)) {
    const deep = ensureDeepSignals(acct) || {};
    computeDeepSignals(acct, followersOf(acct.id).map((a) => a.id)).forEach((sig) => {
      if (sig.level === "low") return;
      const planted = ["timezone", "photo", "record"].indexOf(sig.key) !== -1;
      items.push({ kind: `deep:${sig.key}`, group: "Deep investigation (a pull you spent)", label: `${sig.label} reads ${sig.level.toUpperCase()}`, detail: sig.value, real: planted ? isSk && (deep.tells || []).indexOf(sig.key) !== -1 : isSk });
    });
  }
  const interro = simplifiedMode() ? null : interrogationFor(acct.id);
  if (interro) {
    Object.entries(interro.marks || {}).forEach(([fact, verdict]) => {
      if (verdict !== "contradiction") return;
      const f = COMMENTS.INTERROGATION_FACTS[fact];
      items.push({ kind: `interro:${fact}`, group: "Interrogation", label: `Their answers about ${f ? lowerFirst(f.label) : fact} don't add up`, real: COMMENTS.interrogationSlips(acct).indexOf(fact) !== -1 });
    });
  }
  linksFor(key)
    .filter((l) => l.a === acct.id || l.b === acct.id)
    .forEach((l) => {
      const other = accountById(l.a === acct.id ? l.b : l.a);
      if (!other) return;
      items.push({ kind: "link", group: "Evidence board", label: `Your link to ${other.name}: “${l.reason}”`, real: isSk && !!other.isSkraper });
    });
  // Stage 32: a listing of theirs the player actually opened in the
  // Marketplace. Named neutrally — the report never says what's wrong with
  // it — and "real" only if a Skraper's listing genuinely carries a tell
  // (game/marketplace.js's listing.tells), so picking an ordinary listing
  // as the deciding factor is a lucky call, not a clean one.
  MARKET.viewedListingsBy(marketState(), key, acct.id).forEach((l) => {
    items.push({ kind: `market:${l.id}`, group: "Marketplace", label: `Their listing: “${l.title}” — ${l.priceText}${l.feeText ? ` (${l.feeText})` : ""}`, real: isSk && (l.tells || []).length > 0 });
  });
  if (gameState.timelineViewed) {
    const role = timelineRoleFor(acct);
    if (role) items.push({ kind: "timeline", group: "Timeline", label: role, real: isSk });
  }
  const note = pinNoteFor(key, acct.id);
  if (note) items.push({ kind: "note", group: "Your own words", label: `My note: “${note}”`, real: false });
  const pf = activePreflag();
  if (pf && pf.acctId === acct.id) items.push({ kind: "preflag", group: "Other voices", label: "ALGO// pre-flagged it", real: false });
  const rv = activeRivalCall();
  if (rv && rv.acctId === acct.id) items.push({ kind: "rival", group: "Other voices", label: `${window.SKRAPERS_NARRATIVE.RIVAL.name} called it publicly`, real: false });
  items.push({ kind: "gut", group: "Nothing specific", label: "Gut feeling — nothing I can point to", real: false });
  return items;
}

// "How long they've been on ALGO//" -> "how long they've been on ALGO//".
function lowerFirst(str) {
  return str ? str.charAt(0).toLowerCase() + str.slice(1) : str;
}

// What actually gives an account away, in words — shown only AFTER a lucky
// call has been filed, so the report can say what the right argument was.
function realTellNames(acct) {
  const out = [];
  const deep = acct.deep || {};
  const names = { timezone: "when it's really active vs. where it says it lives", photo: "a stock-library profile photo", record: "a server record older than ALGO// itself" };
  (deep.tells || []).forEach((t) => names[t] && out.push(names[t]));
  COMMENTS.interrogationSlips(acct).forEach((fact) => out.push(`a cover story that slips on ${lowerFirst(COMMENTS.INTERROGATION_FACTS[fact].label)}`));
  if (acct.personalityKey !== "sleeper" && computeSignals(acct).some((sig) => sig.level !== "low" && SIGNAL_KIND[sig.label] !== "linguistic")) out.push("its posting rhythm");
  if ((acct.posts || []).some((p) => p.topicId)) out.push("its place in the topic's timeline");
  const mEntry = (marketState().worlds || {})[pinKeyFor(currentWorld)];
  if (mEntry && (mEntry.listings || []).some((l) => l.sellerId === acct.id && (l.tells || []).length)) out.push("a Marketplace listing that doesn't add up");
  out.push("who it follows, and who follows it back");
  return out;
}

function reportVerdictLine(acct, grade, choice) {
  if (grade === "clean") return `Closing report: clean catch — “${choice.label}” is a real tell on ${acct.name}. Filed as well-evidenced.`;
  const tells = realTellNames(acct).slice(0, 2).join("; ");
  return `Closing report: right account, but “${choice.label}” isn't what gives ${acct.name} away — filed as a lucky call. What does: ${tells}.`;
}

function renderClosingReport(acct, onFile) {
  const items = gatheredEvidenceFor(acct);
  const key = pinKeyFor(currentWorld);
  const interro = interrogationFor(acct.id);
  const links = linksFor(key).filter((l) => l.a === acct.id || l.b === acct.id).length;
  const overlay = document.createElement("div");
  overlay.className = "trust-modal-overlay closing-report-overlay";
  overlay.setAttribute("data-testid", "closing-report");
  const groups = [];
  items.forEach((it, i) => {
    let g = groups.find((x) => x.name === it.group);
    if (!g) groups.push((g = { name: it.group, items: [] }));
    g.items.push({ ...it, i });
  });
  overlay.innerHTML = `
    <div class="trust-modal closing-report-modal">
      <div class="closing-kicker">${ICON.book} M.A.I. — CLOSING REPORT</div>
      <div class="closing-title">Formally flagging ${escapeHtml(acct.name)} <span>${escapeHtml(acct.handle)}</span></div>
      <div class="closing-summary" data-testid="closing-summary">
        <span>${ICON.pin} ${pinnedIds.has(acct.id) ? "Pinned" : "Not pinned"}${pinNoteFor(key, acct.id) ? ", with a note" : ""}</span>
        <span>${ICON.scan} ${isDeepInvestigated(acct.id) ? "Deep records pulled" : "No deep pull spent"}</span>
        ${simplifiedMode() ? "" : `<span>${ICON.mail} ${interro ? interro.asked.length : 0} question${interro && interro.asked.length === 1 ? "" : "s"} asked</span>`}
        <span>${ICON.link} ${links} board link${links === 1 ? "" : "s"}</span>
      </div>
      <div class="closing-instruction">This is everything you've gathered on this account. Pick the <b>one</b> thing you'd put your name to as the deciding factor. It will be checked against the account itself.</div>
      <div class="closing-options">
        ${groups
          .map(
            (g) => `<div class="closing-group"><div class="closing-group-name">${escapeHtml(g.name)}</div>${g.items
              .map(
                (it) => `<label class="closing-option" data-testid="closing-option" data-kind="${escapeHtml(it.kind)}"><input type="radio" name="closing-evidence" value="${it.i}" /><span><span class="closing-option-label">${escapeHtml(it.label)}</span>${it.detail ? `<span class="closing-option-detail">${escapeHtml(it.detail)}</span>` : ""}</span></label>`
              )
              .join("")}</div>`
          )
          .join("")}
      </div>
      <div class="closing-actions">
        <button class="investigate-btn" data-action="file" data-testid="closing-file" disabled>${ICON.reportBot} File report &amp; formally flag</button>
        <button class="investigate-btn closing-cancel" data-action="cancel" data-testid="closing-cancel">Not yet</button>
      </div>
      <div class="closing-fine">The flag itself is judged exactly as before. The report judges your reasoning: a right call on the wrong evidence is filed as a lucky one.${caseStrikeNote()}</div>
    </div>
  `;
  let chosen = null;
  const fileBtn = overlay.querySelector('[data-action="file"]');
  overlay.querySelectorAll('input[name="closing-evidence"]').forEach((input) => {
    input.addEventListener("change", () => {
      chosen = items[parseInt(input.value, 10)];
      overlay.querySelectorAll(".closing-option").forEach((o) => o.classList.toggle("on", o.contains(input)));
      fileBtn.disabled = false;
    });
  });
  overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => overlay.remove());
  fileBtn.addEventListener("click", () => {
    if (!chosen) return;
    overlay.remove();
    retireTip("report", "done");
    onFile(chosen);
  });
  document.body.appendChild(overlay);
  // Round 30 (#1): walkthrough beat — the first closing report (Stage 33: a
  // spotlight on the evidence list, then on the strike count).
  queueWalkthroughBeat("report");
}

// ===========================================================================
// Round 29 (#5, #6): SECOND OPINIONS — Wren Halloway's public calls and
// ALGO//'s own pre-flags, planned per case attempt in game/cases.js's
// secondOpinionsFor (once, from the freshly built roster) and resolved
// here, by the player's own formal flags, a contest, or the case closing.
// ===========================================================================
const RIVAL_AFTER_VISITS = 2; // she posts once the player has been working the file a little — not the instant it opens
// Social stakes, applied when her call is resolved — only if the player
// took a public side. Backing a colleague who was right looks good to the
// people watching; piling onto a real person with her looks worse than
// staying quiet (and that person notices you); calling her wrong when she
// was right costs you face with the platform; standing up for a real
// person she'd accused earns real trust.
const RIVAL_EFFECTS = {
  agree: { right: { standing: 1, trust: 3 }, wrong: { standing: -1, trust: -5 } },
  contradict: { right: { standing: -3, trust: -2 }, wrong: { standing: 1, trust: 4 } },
};
// ALGO//'s pre-flag outcomes. Agreeing with the platform when it's right
// pleases the platform; following it onto a real person costs the
// community on top of the wrongful flag itself; OVERTURNING it — proving
// ALGO// wrong about a real person — is the best trust swing in this system
// and the one thing that costs you standing, because ALGO// notices being
// corrected; contesting it when it was right is expensive; leaving a wrong
// pre-flag unchallenged until the case closes leaves a real person marked.
const PREFLAG_EFFECTS = {
  confirmed: { standing: 2, trust: 0 },
  "followed-wrong": { standing: 0, trust: -3 },
  overturned: { standing: -2, trust: 6 },
  "contest-failed": { standing: -6, trust: -2 },
  stood: { standing: 0, trust: -2 },
};

function effectLabel(fx) {
  const parts = [];
  if (fx.trust) parts.push(`community trust ${fx.trust > 0 ? "+" : "−"}${Math.abs(fx.trust)}`);
  if (fx.standing) parts.push(`ALGO// standing ${fx.standing > 0 ? "+" : "−"}${Math.abs(fx.standing)}`);
  return parts.join(", ");
}

function applyEffect(fx) {
  if (!fx) return;
  if (fx.standing) gameState.credibility = Math.max(0, Math.min(100, gameState.credibility + fx.standing));
  if (fx.trust) window.SKRAPERS_REPUTATION.applyDelta(fx.trust);
}

// Round 30 (#6): SIMPLIFIED MODE. When the player turns it on (Settings),
// the three narrative/social-stakes systems step out of the way entirely —
// Halloway's public calls, ALGO//'s pre-flags, and interrogation — while
// the investigation economy (signals, Connections, deep pulls, hints, pins,
// notes, evidence links, the closing report, the review limit) is
// untouched. The per-attempt PLAN for both second opinions is still made
// exactly as before (planSecondOpinions — deterministic, so switching the
// mode back off mid-case brings back the very same calls); Simplified Mode
// only holds back FIRING them, SHOWING them and RESOLVING them. Everything
// that reads a second opinion goes through the two accessors below, so
// there is one switch, not one per screen.
function simplifiedMode() {
  return !!(gameState.settings && gameState.settings.simplifiedMode);
}

// ALGO//'s pre-flag on the live case, if the player can currently see it.
function activePreflag() {
  const pf = gameState.algoPreflag;
  if (!pf || pf.pending || currentWorld.kind !== "case" || simplifiedMode()) return null;
  return pf;
}

// Halloway's call on the live case, once she has made it and while the
// player can see it.
function activeRivalCall() {
  const rv = gameState.rivalCall;
  if (!rv || rv.pending || currentWorld.kind !== "case" || simplifiedMode()) return null;
  return rv;
}

function planSecondOpinions() {
  if (currentWorld.kind !== "case" || gameState.opinionsPlanned) return false;
  gameState.opinionsPlanned = true;
  if (isCaseCompleted(currentWorld.caseId)) return true;
  const plan = window.SKRAPERS_CASES.secondOpinionsFor(currentWorld.caseId, accounts);
  if (plan.rival) {
    const t = accountById(plan.rival.acctId);
    if (t) gameState.rivalCall = { ...plan.rival, handle: t.handle, name: t.name, pending: true, stance: null, resolved: null, text: null, at: null };
  }
  if (plan.preflag) {
    const t = accountById(plan.preflag.acctId);
    // Round 30 (#6): planned now, announced by maybeFirePreflag — straight
    // away normally (the same render, so nothing changes), or the first
    // case-feed render after Simplified Mode is switched back off.
    if (t) gameState.algoPreflag = { ...plan.preflag, handle: t.handle, name: t.name, pending: true, outcome: null };
  }
  return true;
}

function maybeFirePreflag() {
  const pf = gameState.algoPreflag;
  if (!pf || !pf.pending || currentWorld.kind !== "case" || simplifiedMode() || isCaseCompleted(currentWorld.caseId)) return false;
  if (gameState.flagged[pf.acctId] || !accountById(pf.acctId)) return false;
  firePreflag(pf);
  return true;
}

function firePreflag(pf) {
  const rng = focusRng(`${currentWorld.caseId}-preflag`);
  const text = window.SKRAPERS_ALGOMSGS.preflagText(pf.handle, (list) => list[Math.floor(rng() * list.length)]);
  const { pending, ...rest } = pf;
  gameState.algoPreflag = { ...rest, text, at: Date.now(), outcome: null };
  notifications = [{ id: `preflag-${currentWorld.caseId}-${Date.now()}`, text, at: Date.now(), target: { type: "profile", acctId: pf.acctId } }, ...notifications];
  window.SKRAPERS_ALGOMSGS.state.unread++;
  showToast(`ALGO//: ${text}`, "bad", { type: "profile", acctId: pf.acctId });
}

function maybeFireRivalCall() {
  const rv = gameState.rivalCall;
  if (!rv || !rv.pending || currentWorld.kind !== "case" || isCaseCompleted(currentWorld.caseId) || simplifiedMode()) return false;
  if ((gameState.visits || 0) < RIVAL_AFTER_VISITS) return false;
  if (gameState.flagged[rv.acctId] || !accountById(rv.acctId)) return false;
  const N = window.SKRAPERS_NARRATIVE;
  const rng = focusRng(`${currentWorld.caseId}-rival`);
  rv.pending = false;
  rv.at = Date.now();
  rv.text = N.rivalCallText(rv.reasonKind, rv.handle, (list) => list[Math.floor(rng() * list.length)]);
  inboxMessages = [
    { id: `rival-call-${currentWorld.caseId}-${rv.at}`, text: `${N.RIVAL.name} (${N.RIVAL.title}) made a public call in ${currentWorld.label}: “${rv.text}”`, at: rv.at, target: { type: "profile", acctId: rv.acctId }, read: false },
    ...inboxMessages,
  ];
  showToast(`${N.RIVAL.name}, M.A.I.: “${rv.text}”`, "bad", { type: "profile", acctId: rv.acctId });
  return true;
}

function resolveRivalCall(correct) {
  const rv = gameState.rivalCall;
  if (!rv || rv.pending || rv.resolved) return null;
  const N = window.SKRAPERS_NARRATIVE;
  rv.resolved = { correct, at: Date.now() };
  const fx = rv.stance ? RIVAL_EFFECTS[rv.stance][correct ? "right" : "wrong"] : null;
  applyEffect(fx);
  if (rv.stance === "agree" && !correct) window.SKRAPERS_TRUST.pin(rv.acctId); // you accused them in public — they noticed
  const text = N.rivalResolutionText(correct, rv.stance || "none", rv.name);
  const tail = fx ? ` (${effectLabel(fx)})` : "";
  inboxMessages = [{ id: `rival-resolved-${currentWorld.caseId}-${Date.now()}`, text: `${N.RIVAL.name}: ${text}${tail}`, at: Date.now(), target: accountById(rv.acctId) ? { type: "profile", acctId: rv.acctId } : null, read: false }, ...inboxMessages];
  recordSecondOpinion({ type: "rival", caseId: currentWorld.caseId, name: rv.name, correct, stance: rv.stance || null });
  return `${N.RIVAL.name}: ${text}${tail}`;
}

function resolvePreflag(outcome) {
  const pf = gameState.algoPreflag;
  if (!pf || pf.outcome) return null;
  pf.outcome = outcome;
  pf.resolvedAt = Date.now();
  const fx = PREFLAG_EFFECTS[outcome];
  applyEffect(fx);
  const text = window.SKRAPERS_ALGOMSGS.preflagOutcomeText(outcome, pf.handle);
  notifications = [{ id: `preflag-${outcome}-${currentWorld.caseId}-${Date.now()}`, text, at: Date.now(), target: accountById(pf.acctId) ? { type: "profile", acctId: pf.acctId } : null }, ...notifications];
  window.SKRAPERS_ALGOMSGS.state.unread++;
  recordSecondOpinion({ type: "preflag", caseId: currentWorld.caseId, name: pf.name, handle: pf.handle, outcome });
  return `ALGO//: ${text}${fx && (fx.trust || fx.standing) ? ` (${effectLabel(fx)})` : ""}`;
}

function resolveSecondOpinionsOnFlag(acct, result) {
  const lines = [];
  const rv = activeRivalCall();
  if (rv && !rv.resolved && rv.acctId === acct.id) lines.push(resolveRivalCall(result.correct));
  const pf = activePreflag();
  if (pf && !pf.outcome && pf.acctId === acct.id) lines.push(resolvePreflag(result.correct ? "confirmed" : "followed-wrong"));
  return lines.filter(Boolean);
}

// Contesting ALGO//'s pre-flag: the player formally tells the platform this
// account is a real person. Same shape as a formal flag, pointed the other
// way — and judged the same way, against what the account really is.
function renderContestModal(acct, onDone) {
  const items = gatheredEvidenceFor(acct).filter((it) => it.kind !== "gut" && it.kind !== "preflag");
  const interro = interrogationFor(acct.id);
  const consistent = interro ? Object.entries(interro.marks || {}).filter(([, v]) => v === "consistent").map(([f]) => lowerFirst(COMMENTS.INTERROGATION_FACTS[f].label)) : [];
  const overlay = document.createElement("div");
  overlay.className = "trust-modal-overlay closing-report-overlay";
  overlay.setAttribute("data-testid", "contest-modal");
  overlay.innerHTML = `
    <div class="trust-modal closing-report-modal">
      <div class="closing-kicker">${ICON.eye} CONTEST ALGO//'S PRE-FLAG</div>
      <div class="closing-title">${escapeHtml(acct.name)} <span>${escapeHtml(acct.handle)}</span></div>
      <div class="closing-instruction">You're telling the platform its own assessment is wrong — that this is a real person. If you're right, the flag comes off them. If you're wrong, you vouched for a Skraper in front of everyone.</div>
      <div class="closing-options">
        <div class="closing-group"><div class="closing-group-name">What you have on this account</div>
          ${consistent.length ? `<div class="closing-option static">${ICON.check} Their story held up when you cross-checked: ${escapeHtml(consistent.join(", "))}.</div>` : ""}
          ${items.length ? items.map((it) => `<div class="closing-option static">${escapeHtml(it.label)}${it.detail ? `<span class="closing-option-detail">${escapeHtml(it.detail)}</span>` : ""}</div>`).join("") : `<div class="closing-option static">Nothing that reads suspicious beyond ALGO//'s word.</div>`}
        </div>
      </div>
      <div class="closing-actions">
        <button class="investigate-btn" data-action="contest" data-testid="contest-confirm">${ICON.shield} Contest — this is a real person</button>
        <button class="investigate-btn closing-cancel" data-action="cancel">Not yet</button>
      </div>
    </div>
  `;
  overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => overlay.remove());
  overlay.querySelector('[data-action="contest"]').addEventListener("click", () => {
    overlay.remove();
    const real = !acct.isSkraper;
    const line = resolvePreflag(real ? "overturned" : "contest-failed");
    persistNow();
    refreshAllCredibilityBadges();
    if (onDone) onDone();
    if (real) renderOverturnModal(acct);
    else showToast(line, "bad");
  });
  document.body.appendChild(overlay);
}

// The one outcome in this system that gets a full screen of its own:
// the player proved the platform wrong about a real person.
function renderOverturnModal(acct) {
  const overturns = (gameState.secondOpinionHistory || []).filter((h) => h.type === "preflag" && h.outcome === "overturned").length;
  const fx = PREFLAG_EFFECTS.overturned;
  const overlay = document.createElement("div");
  overlay.className = "trust-modal-overlay overturn-overlay";
  overlay.setAttribute("data-testid", "overturn-modal");
  overlay.innerHTML = `
    <div class="trust-modal overturn-modal">
      <div class="overturn-kicker">${ICON.shield} ALGO// — PRE-FLAG OVERTURNED</div>
      <div class="overturn-title">You proved ALGO// wrong.</div>
      <div class="overturn-body">${escapeHtml(acct.name)} is a real person. The platform called them a Skraper before you'd read a single one of their posts, and you didn't take its word for it. The flag is off their account.</div>
      <div class="overturn-algo">“${escapeHtml(window.SKRAPERS_ALGOMSGS.preflagOutcomeText("overturned", acct.handle))}”</div>
      <div class="overturn-fx">${escapeHtml(effectLabel(fx).toUpperCase())}</div>
      <div class="overturn-count" data-testid="overturn-count">ALGO// pre-flags you've overturned: ${overturns}</div>
      <button class="investigate-btn" data-action="close" style="width:100%; margin-top:14px;">Back to the investigation</button>
    </div>
  `;
  overlay.querySelector('[data-action="close"]').addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
}

// The rival's public post, on the case's own feed — rendered with the same
// .post markup every account's post uses, so it reads as one more voice on
// the platform, not a system panel. Her target's handle is a real link.
function renderRivalCard() {
  const rv = activeRivalCall();
  if (!rv) return null;
  const N = window.SKRAPERS_NARRATIVE;
  const el = document.createElement("div");
  el.className = "post rival-post";
  el.setAttribute("data-testid", "rival-post");
  const handle = escapeHtml(rv.handle);
  const text = escapeHtml(rv.text || "").split(handle).join(`<span class="mention" data-rival-target>${handle}</span>`);
  let footer;
  if (rv.resolved) {
    footer = `<div class="rival-outcome ${rv.resolved.correct ? "right" : "wrong"}" data-testid="rival-outcome">${ICON.check} Review's back: ${escapeHtml(rv.name)} ${rv.resolved.correct ? "was a Skraper — she was right" : "is a real person — she was wrong"}.${rv.stance ? ` You ${rv.stance === "agree" ? "backed her" : "contradicted her"} publicly.` : ""}</div>`;
  } else if (rv.stance) {
    footer = `<div class="rival-stance" data-testid="rival-stance">You ${rv.stance === "agree" ? "agreed with this publicly" : "publicly said she's wrong"}. <span>${escapeHtml(N.rivalStanceText(rv.stance, rv.handle))}</span></div>`;
  } else if (rv.ignored) {
    footer = `<div class="rival-stance">You let this one go by without comment.</div>`;
  } else {
    footer = `<div class="post-actions rival-actions">
      <button data-stance="agree" data-testid="rival-agree">${ICON.check} Agree publicly</button>
      <button data-stance="contradict" data-testid="rival-contradict">${ICON.close} Contradict publicly</button>
      <button data-stance="ignore" data-testid="rival-ignore">Ignore</button>
    </div>
    <div class="rival-fine">Taking a side is public. It pays off if you're on the right one, and costs you if you're not.</div>`;
  }
  el.innerHTML = `
    <div class="avatar" style="--avatar-hue:291">${initials(N.RIVAL.name)}</div>
    <div class="post-body">
      <div class="post-head">
        <span class="post-name">${escapeHtml(N.RIVAL.name)}</span>
        <span class="rival-badge">M.A.I.</span>
        <span class="post-handle">${escapeHtml(N.RIVAL.handle)}</span>
        <span class="post-time">${timeAgo(rv.at || Date.now())}</span>
      </div>
      <div class="post-text">${text}</div>
      ${footer}
    </div>
  `;
  const link = el.querySelector("[data-rival-target]");
  if (link && accountById(rv.acctId)) link.addEventListener("click", () => renderProfile(rv.acctId));
  el.querySelectorAll("[data-stance]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stance = btn.getAttribute("data-stance");
      if (stance === "ignore") rv.ignored = true;
      else {
        rv.stance = stance;
        showToast(`${N.RIVAL.name}: ${N.rivalStanceText(stance, rv.handle)}`, "good");
      }
      persistNow();
      el.replaceWith(renderRivalCard());
    });
  });
  return el;
}

// ALGO//'s pre-flag, as a strip on the case feed — the same slim accent-
// line treatment as Home's "current focus" line (it IS the same voice),
// kept up for the whole attempt so the player always knows what the
// platform already decided, and whether they've answered it.
function renderPreflagStrip() {
  const pf = activePreflag();
  if (!pf) return null;
  const el = document.createElement("div");
  el.className = `focus-nudge preflag-strip${pf.outcome ? ` resolved ${pf.outcome}` : ""}`;
  el.setAttribute("data-testid", "preflag-strip");
  const handle = `<span class="focus-nudge-handle" data-acct-id="${pf.acctId}">${escapeHtml(pf.handle)}</span>`;
  const status = {
    confirmed: "You reviewed it and agreed. The account is suspended.",
    "followed-wrong": "You flagged it on the platform's word. It was a real person.",
    overturned: "You contested it and were right. ALGO// was wrong.",
    "contest-failed": "You contested it. ALGO// was right.",
    stood: "Nobody contested it. It stays on their record.",
  }[pf.outcome];
  el.innerHTML = `
    <span class="focus-nudge-icon">${ICON.eye}</span>
    <div class="focus-nudge-body"><span class="focus-nudge-kicker">ALGO// · pre-flag</span><span class="focus-nudge-text">ALGO// flagged ${handle} as a probable Skraper before you started. ${status ? escapeHtml(status) : "Investigate it yourself — then formally flag it, or contest ALGO//'s call from its profile."}</span></div>
  `;
  el.querySelectorAll(".focus-nudge-handle").forEach((span) => span.addEventListener("click", () => renderProfile(span.getAttribute("data-acct-id"))));
  return el;
}

// ===========================================================================
// Round 29 (#4): THE TIMELINE — a second way of reading a case's feed.
// Every event post carries a topicId (game/events.js); this lays one
// topic's posts out strictly oldest-first with the real gap before each
// one, and groups near-identical wording: the first post of a wording is
// marked, and every repeat shows how long after the PREVIOUS repeat it
// arrived — a person reposts when they happen to look; a schedule repeats
// on a beat. Available on any case whose feed carries a topic (the viral
// cases, Case 003, and the timeline shape it was built for); the Feed view
// is unchanged.
// ===========================================================================
let caseFeedModes = {}; // pinKey -> "feed" | "timeline" (a per-session view choice, like the board's map/list)

function topicPostsIn(list) {
  const byTopic = {};
  (list || []).forEach((acct) =>
    (acct.posts || []).forEach((post) => {
      if (post.topicId) (byTopic[post.topicId] = byTopic[post.topicId] || []).push({ post, acct });
    })
  );
  return byTopic;
}

function worldTopics() {
  const t = topicPostsIn(accounts);
  return Object.keys(t).filter((k) => t[k].length >= 3);
}

function topicLabel(topicId) {
  const ev = window.SKRAPERS_EVENTS.EVENTS.find((e) => e.id === topicId);
  return ev ? ev.topic : topicId;
}

function echoWords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/@\S+/g, " ")
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function analyzeTopic(topicId) {
  const entries = (topicPostsIn(accounts)[topicId] || []).slice().sort((a, b) => a.post.timestamp - b.post.timestamp);
  const rows = [];
  entries.forEach((e, i) => {
    const words = echoWords(e.post.text);
    const set = new Set(words);
    let root = null;
    for (let j = 0; j < i; j++) {
      const key = rows[j].keyWords;
      if (key.length < 5) continue;
      const hit = key.filter((w) => set.has(w)).length / key.length;
      if (hit >= 0.5) {
        root = rows[j].root != null ? rows[j].root : j;
        break;
      }
    }
    rows.push({ ...e, index: i, gapMs: i ? e.post.timestamp - entries[i - 1].post.timestamp : null, keyWords: words.slice(0, 10), root });
  });
  const groups = {};
  rows.forEach((r) => {
    const root = r.root != null ? r.root : r.index;
    (groups[root] = groups[root] || []).push(r);
  });
  Object.entries(groups).forEach(([root, members]) => {
    members.forEach((m, k) => {
      m.groupSize = members.length;
      m.groupPos = k;
      m.beatMs = k ? m.post.timestamp - members[k - 1].post.timestamp : null;
      m.rootRow = rows[parseInt(root, 10)];
    });
  });
  return rows;
}

function fmtGap(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `+${mins}m`;
  return `+${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
}

function clockOf(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// For the closing report: where this account sits on its topic's timeline,
// in the same words the Timeline view uses.
function timelineRoleFor(acct) {
  for (const topicId of worldTopics()) {
    const rows = analyzeTopic(topicId).filter((r) => r.acct.id === acct.id);
    if (!rows.length) continue;
    const echo = rows.find((r) => r.groupSize >= 2 && r.groupPos > 0);
    if (echo) return `Timeline: repeated ${echo.rootRow.acct.name}'s wording, ${fmtGap(echo.beatMs)} after the repeat before it`;
    const first = rows.find((r) => r.groupSize >= 2 && r.groupPos === 0);
    if (first) return `Timeline: first to post the wording ${first.groupSize - 1} other account${first.groupSize === 2 ? "" : "s"} repeated`;
    return `Timeline: posted about ${topicLabel(topicId)} at ${clockOf(rows[0].post.timestamp)}`;
  }
  return null;
}

function renderTopicTimeline(topicId) {
  const rows = analyzeTopic(topicId);
  const wrap = document.createElement("div");
  wrap.className = "topic-timeline";
  wrap.setAttribute("data-testid", "topic-timeline");
  const span = rows.length > 1 ? rows[rows.length - 1].post.timestamp - rows[0].post.timestamp : 0;
  wrap.innerHTML = `<div class="timeline-head"><b>${escapeHtml(topicLabel(topicId))}</b> — ${rows.length} posts across ${fmtGap(span).slice(1)}, oldest first. The rail shows the time since the post before. Repeated wording is grouped: each repeat shows how long after the previous repeat it landed.</div>`;
  rows.forEach((r) => {
    const gapPx = r.gapMs ? Math.round(Math.min(44, 4 + Math.log2(1 + r.gapMs / 60000) * 6)) : 0;
    const row = document.createElement("div");
    row.className = "timeline-row" + (isSuspended(r.acct.id) ? " suspended" : "");
    row.style.marginTop = `${gapPx}px`;
    row.setAttribute("data-testid", "timeline-row");
    row.setAttribute("data-acct-id", r.acct.id);
    row.setAttribute("data-ts", String(r.post.timestamp));
    let badge = "";
    if (r.groupSize >= 2 && r.groupPos === 0) badge = `<span class="timeline-badge origin" data-testid="timeline-origin">first to post this wording · repeated ${r.groupSize - 1}×</span>`;
    else if (r.groupSize >= 2) badge = `<span class="timeline-badge echo" data-testid="timeline-echo" data-beat="${Math.round(r.beatMs / 60000)}">same wording as ${escapeHtml(r.rootRow.acct.name)} · ${fmtGap(r.beatMs)} after the last repeat</span>`;
    row.innerHTML = `
      <div class="timeline-rail"><span class="timeline-clock">${clockOf(r.post.timestamp)}</span><span class="timeline-gap">${r.gapMs == null ? "start" : fmtGap(r.gapMs)}</span></div>
      <div class="timeline-dot${r.groupSize >= 2 ? " grouped" : ""}"></div>
      <div class="timeline-body">
        <div class="timeline-who"><span class="avatar" ${avatarStyleAttr(r.acct.id)}>${initials(r.acct.name)}</span><b>${escapeHtml(r.acct.name)}</b> <span class="timeline-handle">${escapeHtml(r.acct.handle)}</span>${statusTag(r.acct)}</div>
        <div class="timeline-text">${escapeHtml(r.post.text)}</div>
        ${badge}
      </div>
    `;
    row.addEventListener("click", () => renderProfile(r.acct.id));
    wrap.appendChild(row);
  });
  return wrap;
}

function renderFeedModeToggle(onChange) {
  const key = pinKeyFor(currentWorld);
  const mode = caseFeedModes[key] || "feed";
  const el = document.createElement("div");
  el.className = "feed-mode-toggle";
  el.setAttribute("data-testid", "feed-mode-toggle");
  el.innerHTML = `
    <button class="feed-mode-btn${mode === "feed" ? " active" : ""}" data-mode="feed" data-testid="feed-mode-feed">${ICON.menu} Feed</button>
    <button class="feed-mode-btn${mode === "timeline" ? " active" : ""}" data-mode="timeline" data-testid="feed-mode-timeline">${ICON.clock} Timeline</button>
  `;
  el.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      caseFeedModes[key] = btn.getAttribute("data-mode");
      el.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("active", b === btn));
      onChange(caseFeedModes[key]);
    });
  });
  return el;
}

// Item 12/13: a case is "cleared" once every Skraper in it has been
// correctly, formally flagged — checked after every formal flag rather
// than tracked incrementally, so it's correct regardless of flag order.
// Round 29: clearing a case also settles any second opinion still open
// (Halloway's call on someone who was never flagged was, by then, a call on
// a real person; ALGO//'s uncontested pre-flag on one "stands"), and writes
// the case's completion record — the closing reports' grade — to the
// standing caseRecords. Returns the line to add to the flag's toast.
function checkCaseCompletion(result) {
  if (currentWorld.kind !== "case") return null;
  if (isCaseCompleted(currentWorld.caseId)) return null;
  const skrapers = accounts.filter((a) => a.isSkraper);
  if (!skrapers.length || !skrapers.every((a) => isSuspended(a.id))) return null;
  markCaseCompleted(currentWorld.caseId);
  const extra = [];
  const rv = activeRivalCall();
  if (rv && !rv.resolved) extra.push(resolveRivalCall(!!(accountById(rv.acctId) || {}).isSkraper));
  const pf = activePreflag();
  if (pf && !pf.outcome) extra.push(resolvePreflag("stood"));
  // Round 30 (#6): a case closed in Simplified Mode closes without the
  // systems the player had switched off — an unannounced or unanswered
  // second opinion carries no consequence and leaves no record.
  if (simplifiedMode()) {
    if (gameState.rivalCall && !gameState.rivalCall.resolved) gameState.rivalCall = null;
    if (gameState.algoPreflag && !gameState.algoPreflag.outcome) gameState.algoPreflag = null;
  }
  const reports = gameState.closingReports || [];
  const summary = summarizeReports(reports);
  recordCaseRecord(currentWorld.caseId, {
    ...summary,
    label: currentWorld.label,
    reports: reports.map((r) => ({ name: r.name, grade: r.grade, evidenceLabel: r.evidenceLabel })),
    preflag: pf ? { name: pf.name, outcome: pf.outcome } : null,
    rival: rv ? { name: rv.name, correct: rv.resolved ? rv.resolved.correct : null, stance: rv.stance || null } : null,
  });
  return [`Case cleared — report graded ${summary.grade.toUpperCase()} (${summary.clean} clean, ${summary.lucky} lucky). Tap View Case Load to move on.`, ...extra.filter(Boolean)].join("\n");
}

// Round 27 (#2): the real failure state. A single wrong formal flag
// already costs something (game/state.js's flagAccount, game/
// reputation.js's applyFlagOutcome); this is the categorically worse
// outcome — carelessness within ONE investigation, not a lifetime tally
// (strikes are derived from that attempt's own `flagged`, see game/
// state.js's wrongfulFlagCount/wrongFlagLimitFor). Reaching the limit:
//   1. costs a one-time hit well beyond a single miss: ALGO// standing and
//      Community Trust each take CASE_FAILURE_*_COST, on top of the flag
//      that triggered it (Stage 31 #12: rescaled from 20/20 alongside the
//      per-flag penalties, keeping the same "about two misses' worth" ratio);
//   2. discards the attempt entirely — its world snapshot, its history
//      entries, its pins and notes (the file was pulled; so was your
//      board) — nothing half-alive to hot-swap back into;
//   3. records the failure beside completedCases (failedCaseAttempts), and
//      leaves the SAME case as the one Case Load offers next, to retry as
//      a fresh deterministic rebuild (game/cases.js's seededBuild) —
//      identical evidence, clean slate. A setback, never a lock-out.
const CASE_FAILURE_STANDING_COST = 4;
const CASE_FAILURE_TRUST_COST = 4;

function failActiveCase(strikes, limit) {
  const caseId = currentWorld.caseId;
  const caseLabel = currentWorld.label;
  const key = pinKeyFor(currentWorld);
  const record = recordCaseFailure(caseId, strikes, limit);
  gameState.credibility = Math.max(0, gameState.credibility - CASE_FAILURE_STANDING_COST);
  window.SKRAPERS_REPUTATION.applyDelta(-CASE_FAILURE_TRUST_COST);

  const flaggedHumans = Object.entries(gameState.flagged)
    .filter(([, f]) => !f.correct)
    .map(([id]) => accountById(id))
    .filter(Boolean);
  const names = flaggedHumans.map((a) => a.name);
  const nameList = names.length > 2 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names.join(" and ");

  // The attempt is over — tear its world down rather than snapshotting it.
  delete worldSnapshots[key];
  delete pinSets[key];
  delete pinNotes[key];
  delete pinLinks[key]; // Round 28 (#1): the board's argument goes with the board
  if (lastCaseKey === key) {
    lastCaseKey = null;
    lastCaseLabel = null;
  }
  forgetWorldHistory(key);
  if (!restoreWorldSnapshot("home")) {
    // No Home to resume (e.g. a session restored straight into a case):
    // start one, the same way a first visit does. loadWorld renders it,
    // but the modal below lands on top and routes to Case Load anyway.
    loadProceduralWorld();
  }

  notifications = [
    {
      id: `case-failed-${caseId}-${record.count}`,
      text: `${caseLabel} has been pulled from you pending a formal review. ${strikes} of the accounts you formally flagged in it were real people. You may reopen the file. They will remember that you did this.`,
      at: Date.now(),
      target: { type: "caseload" },
    },
    ...notifications,
  ];
  window.SKRAPERS_ALGOMSGS.state.unread++;
  inboxMessages = [
    {
      id: `case-failed-community-${caseId}-${record.count}`,
      text: `${nameList || "The people you flagged"} compared notes after their appeals came back clean. They've been posting about it.`,
      at: Date.now(),
      target: { type: "caseload" },
      read: false,
    },
    ...inboxMessages,
  ];
  persistNow();
  refreshAllCredibilityBadges();
  dismissToast(); // the triggering flag's "appealed" toast would otherwise linger into Case Load; the modal says it all
  renderCaseFailureModal({ caseLabel, strikes, nameList, attempt: record.count });
}

function renderCaseFailureModal({ caseLabel, strikes, nameList, attempt }) {
  const overlay = document.createElement("div");
  overlay.className = "trust-modal-overlay case-failure-overlay";
  overlay.setAttribute("data-testid", "case-failure-modal");
  overlay.innerHTML = `
    <div class="trust-modal">
      <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.06em; color:var(--red); margin-bottom:10px;">${ICON.warning} ALGO// — FORMAL REVIEW TRIGGERED</div>
      <div style="font-family:'Space Grotesk',monospace; font-size:17px; font-weight:700; margin-bottom:12px;">${escapeHtml(caseLabel)} has been pulled from you.</div>
      <div style="font-size:14.5px; line-height:1.6; margin-bottom:12px;">${strikes} accounts you formally flagged in this investigation${nameList ? ` — ${escapeHtml(nameList)} —` : ""} appealed, and every appeal came back clean. They were people. They've compared notes, and so has everyone who follows them.</div>
      <div style="font-size:14.5px; line-height:1.6; margin-bottom:14px; color:var(--grey);">ALGO// has suspended your access to this file pending a review of your judgment, not theirs. Your board for it has been taken with it. The case will be rebuilt from its original evidence, and you may reopen it${attempt > 1 ? ` — this is attempt ${attempt} that's ended this way` : ""}.</div>
      <div style="font-family:'Space Grotesk',monospace; font-size:12px; letter-spacing:0.03em; color:var(--red); margin-bottom:16px;">ALGO// STANDING −${CASE_FAILURE_STANDING_COST} · COMMUNITY TRUST −${CASE_FAILURE_TRUST_COST}</div>
      <button class="investigate-btn" data-action="to-case-load" style="margin-top:0; width:100%;">View Case Load</button>
    </div>
  `;
  overlay.querySelector('[data-action="to-case-load"]').addEventListener("click", () => {
    overlay.remove();
    renderStory();
  });
  document.body.appendChild(overlay);
}

// Round 30 (#4): the supportive half of Case 001's grace — what the player
// missed, in the same plain signal language the Investigate panel uses.
// Read from the wrongly-flagged account's own live signals (so it's true
// of THAT person), then pointed at the one tell Case 001 turns on: the
// scripted account keeps an almost exact interval between posts.
function firstCaseLesson(acct) {
  const sigs = computeSignals(acct);
  const calm = sigs.filter((sg) => sg.level === "low").map((sg) => lowerFirst(sg.label));
  const loud = sigs.filter((sg) => sg.level !== "low").map((sg) => lowerFirst(sg.label));
  const join = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0]);
  const parts = [];
  if (calm.length) parts.push(`their ${join(calm)} read${calm.length === 1 ? "s" : ""} like a person's`);
  if (loud.length) parts.push(`their ${join(loud)} looked odd — but one odd signal is something plenty of real people have`);
  return `M.A.I. training note: ${acct.name} is a real person${parts.length ? ` — ${parts.join("; ")}` : ""}. The account you're after keeps an almost exact interval between posts, every time. Line up a few accounts' posting cadence before you flag again.`;
}

// Round 27 (#2): the running strike count, shown right where the
// decision to accuse is made, whenever a case attempt is live.
function caseStrikeNote() {
  if (currentWorld.kind !== "case" || isCaseCompleted(currentWorld.caseId)) return "";
  const strikes = wrongfulFlagCount();
  const limit = wrongFlagLimitFor(currentWorld.accountCount, currentWorld.caseId);
  return ` <span class="case-strike-note${strikes >= limit - 1 ? " critical" : ""}">This case is pulled after ${limit} wrongful flags — ${strikes} so far.</span>`;
}

// ===========================================================================
// Round 28 (#2): DEEP INVESTIGATE — the one limited investigative resource.
// Everything that was free stays free and unlimited: reading profiles and
// posts, the Investigate panel's three signals, Connections, the free
// "Recent activity" teaser, pinning, notes. What costs a pull is the
// deepest, most decisive readout on ONE account (simulation/investigate.js's
// computeDeepSignals): stated location vs. session-log timezone, profile-
// image matches, the server account record, the full engagement history
// with its consistency check, and follow reciprocity. Once pulled, an
// account's records stay open for the rest of that attempt.
//
// Budget: game/state.js's deepPullLimitFor(roster size) per world — 3 / 4 /
// 5 on the same scale as the wrongful-flag limit — and the SAME budget pays
// for "I'm stuck" hints (renderCaseToolsStrip). Spent pulls are per-world
// state (gameState.deepInvestigated / caseHints), snapshotted and restored
// with the world like `flagged`, so remaining = limit - used is always
// derived, never stored. Running out never blocks anything else.
// ===========================================================================
function deepPullLimit() {
  return deepPullLimitFor(currentWorld.accountCount || accounts.length);
}

function deepPullsRemaining() {
  return Math.max(0, deepPullLimit() - deepPullsUsed());
}

// Deep records are attached at world-build time (simulation/worldgen.js,
// game/cases.js). Anything that reached the live roster another way — an
// event announcer added mid-Home, or a Home world restored from a save made
// before this round — gets one here, from the same deterministic generator,
// against the whole live roster (so its engagement can reference it).
function ensureDeepSignals(acct) {
  if (!acct || acct.deep || acct.id === BAIT.PLAYER_ACCT_ID) return acct && acct.deep;
  window.SKRAPERS_WORLDGEN.attachDeepSignals(accounts, pinKeyFor(currentWorld));
  return acct.deep;
}

function pullCountHtml() {
  const remaining = deepPullsRemaining();
  return `<span class="deep-pull-count${remaining === 0 ? " empty" : ""}" data-testid="deep-pull-count">${remaining} of ${deepPullLimit()} deep pull${deepPullLimit() === 1 ? "" : "s"} left</span>`;
}

function engagementItemHtml(e) {
  const when = `<span class="engagement-when">${timeAgo(Date.now() - e.minsAgo * 60000)}</span>`;
  if (e.kind === "searched") return `<div class="engagement-row">${ICON.search}<span>Searched “${escapeHtml(e.query || "")}”</span>${when}</div>`;
  const target = e.acctId ? accountById(e.acctId) : null;
  const who = target ? ` <span class="engagement-link" data-acct-id="${target.id}">${escapeHtml(target.name)}</span>'s post:` : "";
  // A reaction to a post in this network quotes it; off-network content
  // (no post id) is described, not quoted.
  const what = e.postId ? `“${escapeHtml(e.snippet || "")}”` : escapeHtml(e.snippet || "");
  // Stage 31 (#3): reposting was removed from the game, but Home worlds are
  // saved with their generated engagement baked in — an older save can
  // still hold a "reposted" entry. Read it as the nearest thing that exists.
  const kind = e.kind === "reposted" ? "commented on" : e.kind;
  return `<div class="engagement-row">${ICON.activity}<span>${escapeHtml(kind[0].toUpperCase() + kind.slice(1))}${who} ${what}</span>${when}</div>`;
}

function wireEngagementLinks(el) {
  el.querySelectorAll(".engagement-link").forEach((span) => {
    span.addEventListener("click", (ev) => {
      ev.stopPropagation();
      renderProfile(span.getAttribute("data-acct-id"));
    });
  });
}

// Round 28 (#3): the free half of engagement history, on every profile —
// the two most recent things this account reacted to or searched, no
// analysis. The full history and the consistency check against its own
// public posts are what a deep pull adds.
const FREE_ENGAGEMENT_ITEMS = 2;
function renderRecentActivityPanel(acct) {
  const deep = ensureDeepSignals(acct);
  if (!deep) return null;
  const list = deep.engagement || [];
  const panel = document.createElement("div");
  panel.className = "recent-activity-panel";
  panel.setAttribute("data-testid", "recent-activity");
  const unlocked = isDeepInvestigated(acct.id);
  const more = list.length - FREE_ENGAGEMENT_ITEMS;
  panel.innerHTML = `
    <h4>${ICON.activity} Recent activity</h4>
    ${list.length ? list.slice(0, FREE_ENGAGEMENT_ITEMS).map(engagementItemHtml).join("") : `<div class="engagement-row"><span style="color:var(--grey);">No public activity.</span></div>`}
    ${more > 0 ? `<div class="recent-activity-more">${unlocked ? `Full history (${list.length}) and its consistency check are open in Investigate → Deep investigation.` : `${more} more, and a check of how this compares with what ${escapeHtml(acct.name)} posts, behind a deep investigation.`}</div>` : ""}
  `;
  wireEngagementLinks(panel);
  return panel;
}

// The gated section inside the Investigate panel. Fills itself; re-fills in
// place after a pull so the rest of the profile (and the Trust glance that
// opening Investigate already cost) is untouched.
function renderDeepInvestigateSection(acct) {
  const el = document.createElement("div");
  el.className = "deep-investigate";
  el.setAttribute("data-testid", "deep-investigate");
  el.setAttribute("data-acct-id", acct.id);
  const fill = () => {
    const deep = ensureDeepSignals(acct) || {};
    const unlocked = isDeepInvestigated(acct.id);
    const remaining = deepPullsRemaining();
    const head = `<div class="deep-head"><span class="deep-title">${ICON.scan} Deep investigation</span>${pullCountHtml()}</div>`;
    if (unlocked) {
      const rows = computeDeepSignals(acct, followersOf(acct.id).map((a) => a.id));
      el.classList.add("unlocked");
      el.innerHTML = `
        ${head}
        <div class="deep-sub">Server-side records. Weigh them like any other signal — real people work nights, share photos, and doomscroll too.</div>
        ${rows
          .map(
            (s) => `<div class="signal-row deep-row" data-deep-key="${s.key}"><span>${s.label}</span><span class="signal-level ${s.level}" style="text-align:right;">${s.level.toUpperCase()} <span style="color:var(--grey); font-weight:400; text-transform:none;">(${escapeHtml(s.value)})</span></span></div>`
          )
          .join("")}
        <div class="deep-engagement" data-testid="deep-engagement">
          <div class="deep-engagement-head">Full engagement history (${(deep.engagement || []).length})</div>
          ${(deep.engagement || []).map(engagementItemHtml).join("") || `<div class="engagement-row"><span style="color:var(--grey);">Nothing on record.</span></div>`}
        </div>
      `;
      wireEngagementLinks(el);
      return;
    }
    el.classList.remove("unlocked");
    el.innerHTML = `
      ${head}
      <div class="deep-sub">Pull this account's server-side records: where it says it is vs. when it's actually active, whether its profile image turns up elsewhere, when its account record was really created, its full engagement history checked against its own posts, and who returns its follows. ${
        remaining > 0
          ? "Costs one pull. Everything else here stays free."
          : "No pulls left in this attempt — the free signals, Connections and the Case Board still work."
      }</div>
      <button class="investigate-btn deep-pull-btn" data-deep-pull data-testid="deep-pull-btn" ${remaining > 0 ? "" : "disabled"}>${ICON.scan} ${remaining > 0 ? "Deep investigate (1 pull)" : "No deep pulls left"}</button>
    `;
    const btn = el.querySelector("[data-deep-pull]");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const result = spendDeepPull(acct.id, deepPullLimit());
      if (!result.ok) {
        showToast("No deep-investigate pulls left in this attempt.", "bad");
        fill();
        return;
      }
      // Pulling someone's server records is a heavier look than a glance —
      // a real person can still notice it (game/trust.js).
      if (!acct.isSkraper) window.SKRAPERS_TRUST.glance(acct.id);
      retireTip("deep", "done");
      persistNow();
      fill();
      refreshDeepPullReadouts();
      const teaser = app.querySelector(".recent-activity-panel");
      if (teaser) teaser.replaceWith(renderRecentActivityPanel(acct));
      showToast(`Deep investigation opened on ${acct.name}. ${result.remaining} pull${result.remaining === 1 ? "" : "s"} left in this attempt.`, result.remaining ? "good" : "bad");
    });
  };
  fill();
  return el;
}

// Anything else on screen that shows the pull count (the case tools strip,
// other open deep sections) re-reads it after a spend.
function refreshDeepPullReadouts() {
  document.querySelectorAll(".deep-pull-count").forEach((span) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = pullCountHtml();
    span.replaceWith(tmp.firstElementChild);
  });
  const strip = document.querySelector(".case-tools-strip");
  if (strip) {
    const fresh = renderCaseToolsStrip({ inFile: strip.dataset.inFile === "1" });
    if (fresh) strip.replaceWith(fresh);
    else strip.remove();
  }
}

// ===========================================================================
// Round 28 (#5): "I'm stuck" — a hint on the active case, paid for with one
// deep-investigate pull (the same budget, deliberately: one currency, one
// decision — "the decisive records on one account, or a nudge about what
// kind of evidence this whole file turns on"). The hint text comes from
// game/cases.js's caseHint, chosen by the case's SHAPE and, for the
// metadata hint, only if an unflagged account in this file really carries
// that tell. Never names an account. Lives in the case tools strip on the
// case's own feed, beside the pull count, with an inline confirm so a pull
// is never spent by a stray tap.
// ===========================================================================
function caseHintFacts() {
  const kinds = new Set();
  accounts.forEach((a) => {
    if (!a.isSkraper || gameState.flagged[a.id] || !a.deep) return;
    (a.deep.tells || []).forEach((t) => kinds.add(t));
  });
  return { tellKinds: [...kinds] };
}

function nextCaseHint() {
  return window.SKRAPERS_CASES.caseHint(currentWorld.caseId, (gameState.caseHints || []).length, caseHintFacts());
}

// Round 30 (#5): `opts.inFile` — the same strip, drawn inside the Case File
// screen (renderCaseFile), where its own "Case file" button would point at
// the screen it's already on. Remembered on the element so every in-place
// refresh (a hint bought, a pull spent) redraws the right variant.
function renderCaseToolsStrip(opts) {
  opts = opts || {};
  if (currentWorld.kind !== "case" || isCaseCompleted(currentWorld.caseId)) return null;
  const el = document.createElement("div");
  el.className = "case-tools-strip";
  el.setAttribute("data-testid", "case-tools");
  if (opts.inFile) el.dataset.inFile = "1";
  const again = () => renderCaseToolsStrip(opts);
  const hints = gameState.caseHints || [];
  const remaining = deepPullsRemaining();
  const next = nextCaseHint();
  const hintBtn = !next
    ? `<button class="case-hint-btn" disabled data-testid="case-hint-btn">${ICON.bulb} No more hints for this file</button>`
    : remaining > 0
    ? `<button class="case-hint-btn" data-hint-ask data-testid="case-hint-btn">${ICON.bulb} I'm stuck — hint (costs 1 deep pull)</button>`
    : `<button class="case-hint-btn" disabled data-testid="case-hint-btn">${ICON.bulb} Hints cost a deep pull — none left</button>`;
  el.innerHTML = `
    <div class="case-tools-row">
      <span class="case-tools-pulls">${ICON.scan} Deep investigations: <b data-testid="case-pulls-left">${remaining}</b> of ${deepPullLimit()} left</span>
      <span class="case-tools-hint-slot">${hintBtn}</span>
    </div>
    ${opts.inFile ? "" : `<button class="case-file-btn" data-case-file data-testid="case-file-btn">${ICON.book} Case file — pins, notes, links &amp; questions in one place</button>`}
    ${
      hints.length
        ? `<div class="case-hints" data-testid="case-hints">${hints.map((h, i) => `<div class="case-hint" data-testid="case-hint">${ICON.bulb}<span><b>Hint ${i + 1}.</b> ${escapeHtml(h.text)}</span></div>`).join("")}</div>`
        : ""
    }
  `;
  const ask = el.querySelector("[data-hint-ask]");
  if (ask) {
    ask.addEventListener("click", () => {
      const slot = el.querySelector(".case-tools-hint-slot");
      slot.innerHTML = `<span class="case-hint-confirm">Spend 1 of ${remaining} deep pull${remaining === 1 ? "" : "s"} on a hint? <button class="case-hint-btn primary" data-hint-confirm data-testid="case-hint-confirm">Spend it</button><button class="case-hint-btn subtle" data-hint-cancel>Cancel</button></span>`;
      slot.querySelector("[data-hint-cancel]").addEventListener("click", () => el.replaceWith(again()));
      slot.querySelector("[data-hint-confirm]").addEventListener("click", () => {
        const hint = nextCaseHint();
        if (!hint) return el.replaceWith(again());
        const result = spendHintPull(hint.text, deepPullLimit());
        if (!result.ok) {
          showToast("No deep-investigate pulls left to spend on a hint.", "bad");
        } else {
          persistNow();
          showToast(`Hint bought — ${result.remaining} deep pull${result.remaining === 1 ? "" : "s"} left in this attempt.`, "good");
        }
        refreshDeepPullReadouts();
      });
    });
  }
  const fileBtn = el.querySelector("[data-case-file]");
  if (fileBtn) fileBtn.addEventListener("click", renderCaseFile);
  return el;
}

// ===========================================================================
// Stage 33: SPOTLIGHT TUTORIALS — the engine. Ported from Skrambeasts' tour
// (a sibling Skram-Games title): one fixed overlay on <body> holding a
// "hole" and a speech bubble. The hole is a plain box whose huge, blurless
// box-shadow paints the dimming everywhere OUTSIDE it, so the hole IS the
// dim — no cut-out overlay needed — and a zero-size hole still dims the
// whole screen (the centred intro/finale stops).
//
// A step spotlights one element or several (`targets`: selectors, elements,
// or a function returning either — the hole is the union of their boxes),
// can carry `onEnter` to navigate the REAL app first (a tab, a listing) —
// so a tour walks through live screens in their real tapped state, never a
// mock-up — and is skipped if its target isn't on screen, unless the tour
// runs with `fallbackCenter` (a Settings replay), where it's shown centred
// instead so the words are never lost.
//
// Differences from the reference, each for a SKRAPERS reason:
//   - the overlay is reused across steps, so the hole's CSS transition
//     really slides from target to target (the reference rebuilt it);
//   - a target that's off screen (or tucked under the sticky topbar/nav) is
//     scrolled into view before it's measured, and the hole is clamped to
//     the viewport — Home and the Marketplace are long pages;
//   - the bubble goes below, above, or (when the target is taller than the
//     screen) over it, whichever has room, measured from its real height;
//   - onEnter reports whether it navigated, and only then waits 60ms for
//     the new screen to settle before measuring;
//   - tours that navigate hand history back to goBack()/navStack tidily at
//     the end (settleTourHistory) — the tour's own hops never pile up as Back
//     steps;
//   - SKRAPERS has no tab-switch rate limiter (nothing like Skrambeasts'
//     _rapidActionTimestamps), so there is nothing to clear before a step's
//     programmatic navigation.
// Only one tour runs at a time (tourActive()); everything that would start
// one — a Case 001 beat, the Marketplace tour, the Market's one-off call-outs
// — waits for, or stays out of the way of, a tour already running.
// ===========================================================================
let spotTour = null; // { steps, index, opts, shown, nav, extra }
let spotTourResizeTimer = null;

function tourActive() {
  return !!spotTour;
}

// opts: kicker(i, n) -> string; skipLabel; doneLabel; replay (never write a
// seen-flag); fallbackCenter; noScrollTop; trackNav (settle navStack at the
// end); finale { title, text, button, onButton }; onComplete({ reason,
// shown, replay }).
function startTour(steps, opts) {
  if (spotTour || !steps || !steps.length) return false;
  opts = opts || {};
  spotTour = {
    steps,
    index: 0,
    opts,
    shown: 0,
    nav: opts.trackNav ? { stack: navStack.slice(), active: activeScreen } : null,
    extra: {},
  };
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  hideSearchSuggestions();
  if (!opts.noScrollTop) window.scrollTo(0, 0); // don't measure the first hole against a stale scroll position
  document.body.style.overflow = "hidden"; // the page can't drift out from under the hole
  window.addEventListener("resize", onTourResize);
  document.addEventListener("keydown", onTourKey, true);
  showTourStep();
  return true;
}

// reason: "done" | "skipped". `rewind` (the finale's button): put history
// back exactly as it was when the tour began, because that button is about
// to navigate on the player's behalf.
function endTour(reason, rewind) {
  const t = spotTour;
  if (!t) return;
  spotTour = null;
  const overlay = document.getElementById("tourOverlay");
  if (overlay) overlay.remove();
  document.body.style.overflow = "";
  window.removeEventListener("resize", onTourResize);
  document.removeEventListener("keydown", onTourKey, true);
  if (spotTourResizeTimer) clearTimeout(spotTourResizeTimer);
  spotTourResizeTimer = null;
  if (t.nav) settleTourHistory(t.nav, rewind);
  if (t.opts.onComplete) t.opts.onComplete({ reason: reason || "done", shown: t.shown, replay: !!t.opts.replay, extra: t.extra });
}

// The tour's onEnter hops went through the real trackScreen(), so the stack
// now holds every tab it visited. Collapse them: history reads as if the
// player had gone straight from where the tour began to wherever it left
// them (or, rewound, as if they had never left).
function settleTourHistory(saved, rewind) {
  const here = activeScreen;
  navStack = saved.stack.slice();
  if (rewind) {
    activeScreen = saved.active;
    return;
  }
  if (here && saved.active && (here.key !== saved.active.key || here.worldKey !== saved.active.worldKey)) navStack.push(saved.active);
  activeScreen = here;
}

function onTourResize() {
  if (spotTourResizeTimer) clearTimeout(spotTourResizeTimer);
  spotTourResizeTimer = setTimeout(() => {
    spotTourResizeTimer = null;
    if (!spotTour) return;
    if (spotTour.index >= spotTour.steps.length) renderTourFinale();
    else renderTourStep(spotTour.steps[spotTour.index], true);
  }, 120);
}

function onTourKey(e) {
  if (!spotTour) return;
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    if (spotTour.index >= spotTour.steps.length) {
      const f = spotTour.opts.finale;
      endTour("done", true);
      if (f && f.onButton) f.onButton();
    } else endTour("skipped");
  }
}

function advanceTour() {
  if (!spotTour) return;
  spotTour.index++;
  showTourStep();
}

function showTourStep() {
  const t = spotTour;
  if (!t) return;
  if (t.index >= t.steps.length) {
    if (t.opts.finale) renderTourFinale();
    else endTour("done");
    return;
  }
  const step = t.steps[t.index];
  const bubble = document.getElementById("tourBubble");
  if (bubble) bubble.style.opacity = "0";
  let navigated = false;
  if (step.onEnter) {
    try {
      navigated = !!step.onEnter(t);
    } catch (e) {
      navigated = false;
    }
  }
  if (navigated) {
    // Let the new screen settle before measuring anything on it.
    setTimeout(() => {
      if (spotTour === t && t.steps[t.index] === step) renderTourStep(step);
    }, 60);
  } else {
    renderTourStep(step);
  }
}

function tourTargetsFor(step) {
  let list = typeof step.targets === "function" ? step.targets() : step.targets || (step.targetSelector ? [step.targetSelector] : []);
  if (!Array.isArray(list)) list = [list];
  return list
    .map((x) => (typeof x === "string" ? document.querySelector(x) : x))
    .filter((el) => el && el.isConnected && el.getClientRects().length > 0);
}

// Scrolls `els` into view if any part of them is off screen — or, for
// ordinary page content, tucked under the sticky topbar or bottom nav.
function scrollTourTargetsIntoView(els) {
  const first = els[0];
  const chrome = first.closest(".topbar-stack, .bottom-nav, .trust-modal-overlay");
  let topInset = 0;
  let bottomInset = window.innerHeight;
  if (!chrome) {
    const bar = document.querySelector(".topbar-stack");
    const nav = document.querySelector(".bottom-nav");
    if (bar) topInset = Math.max(0, bar.getBoundingClientRect().bottom);
    if (nav) bottomInset = Math.min(bottomInset, nav.getBoundingClientRect().top);
  }
  const rects = els.map((el) => el.getBoundingClientRect());
  const top = Math.min(...rects.map((r) => r.top));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  if (top >= topInset && bottom <= bottomInset) return;
  const room = bottomInset - topInset;
  if (bottom - top <= room) {
    const delta = top - topInset - Math.max(0, (room - (bottom - top)) / 2);
    const scroller = first.closest(".trust-modal-overlay .closing-report-modal, .trust-modal-overlay .settings-modal");
    if (scroller) scroller.scrollTop += delta;
    else window.scrollBy(0, delta);
  } else {
    first.scrollIntoView({ block: "start" });
    if (!chrome) window.scrollBy(0, -topInset - 8);
  }
}

function ensureTourOverlay() {
  let overlay = document.getElementById("tourOverlay");
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.id = "tourOverlay";
  overlay.className = "tour-overlay";
  overlay.setAttribute("data-testid", "tour-overlay");
  overlay.innerHTML = `<div class="tour-hole" data-testid="tour-hole"></div><div class="tour-bubble" id="tourBubble" role="dialog" aria-modal="true" aria-live="polite" data-testid="tour-bubble"></div>`;
  // Nothing underneath is tappable while a tour is up — the tour decides
  // where the player goes next.
  overlay.addEventListener("click", (e) => e.stopPropagation());
  document.body.appendChild(overlay);
  return overlay;
}

// Positions the hole on `box` ({top,left,width,height}; zero-size = none).
function placeTourHole(overlay, box) {
  const hole = overlay.querySelector(".tour-hole");
  hole.classList.toggle("empty", !box.width || !box.height);
  hole.style.top = `${box.top}px`;
  hole.style.left = `${box.left}px`;
  hole.style.width = `${box.width}px`;
  hole.style.height = `${box.height}px`;
}

function tourBubbleHtml({ kicker, title, text, buttons }) {
  return `
    <div class="tour-arrow" data-tour-arrow></div>
    ${kicker ? `<div class="tour-kicker">${ICON.bulb}<span>${escapeHtml(kicker)}</span></div>` : ""}
    ${title ? `<div class="tour-title" data-testid="tour-title">${escapeHtml(title)}</div>` : ""}
    <div class="tour-text" data-testid="tour-text">${text}</div>
    <div class="tour-actions">${buttons}</div>
  `;
}

function renderTourStep(step, isResize) {
  const t = spotTour;
  if (!t) return;
  document.body.style.overflow = "hidden";
  const centered = !!step.center;
  let els = centered ? [] : tourTargetsFor(step);
  if (!centered && !els.length && !t.opts.fallbackCenter) {
    // Its target isn't on screen — skip the step rather than point at nothing.
    t.index++;
    showTourStep();
    return;
  }
  if (els.length) scrollTourTargetsIntoView(els);

  const overlay = ensureTourOverlay();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let box = { top: vh / 2, left: vw / 2, width: 0, height: 0 };
  if (els.length) {
    const rects = els.map((el) => el.getBoundingClientRect());
    const pad = 6;
    const top = Math.max(4, Math.min(...rects.map((r) => r.top)) - pad);
    const left = Math.max(4, Math.min(...rects.map((r) => r.left)) - pad);
    const bottom = Math.min(vh - 4, Math.max(...rects.map((r) => r.bottom)) + pad);
    const right = Math.min(vw - 4, Math.max(...rects.map((r) => r.right)) + pad);
    box = { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
  }
  placeTourHole(overlay, box);

  const n = t.steps.length;
  const isLast = t.index === n - 1 && !t.opts.finale;
  const kicker = t.opts.kicker ? t.opts.kicker(t.index, n) : "";
  const bubble = overlay.querySelector(".tour-bubble");
  bubble.classList.toggle("center", !els.length);
  bubble.setAttribute("data-step", String(t.index));
  bubble.innerHTML = tourBubbleHtml({
    kicker,
    title: step.title,
    text: typeof step.text === "function" ? step.text() : step.text,
    buttons: `
      <button class="tour-btn subtle" data-tour-skip data-testid="tour-skip">${escapeHtml(t.opts.skipLabel || "Skip")}</button>
      <button class="tour-btn" data-tour-next data-testid="tour-next">${escapeHtml(isLast ? t.opts.doneLabel || "Done" : "Next")}</button>`,
  });
  positionTourBubble(bubble, els.length ? box : null);
  if (!isResize) t.shown++;
  bubble.querySelector("[data-tour-next]").addEventListener("click", advanceTour);
  bubble.querySelector("[data-tour-skip]").addEventListener("click", () => endTour("skipped"));
  bubble.querySelector("[data-tour-next]").focus({ preventScroll: true });
}

// Below the hole if the bubble fits there, else above it, else (a target
// taller than the screen) over it, on whichever side leaves more room.
// `box` null = centred, no arrow.
function positionTourBubble(bubble, box) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 10;
  const gap = 14;
  const bw = bubble.offsetWidth;
  const bh = bubble.offsetHeight;
  const arrow = bubble.querySelector("[data-tour-arrow]");
  arrow.className = "tour-arrow";
  if (!box) {
    bubble.setAttribute("data-placement", "center");
    bubble.style.left = `${Math.max(margin, (vw - bw) / 2)}px`;
    bubble.style.top = `${Math.max(margin, (vh - bh) / 2)}px`;
    arrow.style.display = "none";
    bubble.style.opacity = "1";
    return;
  }
  const holeBottom = box.top + box.height;
  const centerX = box.left + box.width / 2;
  let left = Math.max(margin, Math.min(centerX - bw / 2, vw - bw - margin));
  let top;
  let placement;
  if (vh - holeBottom >= bh + gap + margin) {
    placement = "below";
    top = holeBottom + gap;
  } else if (box.top >= bh + gap + margin) {
    placement = "above";
    top = box.top - gap - bh;
  } else {
    placement = "over";
    top = vh - holeBottom >= box.top ? vh - bh - margin : margin;
  }
  bubble.style.left = `${left}px`;
  bubble.style.top = `${Math.max(margin, top)}px`;
  bubble.setAttribute("data-placement", placement);
  if (placement === "over") {
    arrow.style.display = "none";
  } else {
    arrow.style.display = "";
    arrow.classList.add(placement === "below" ? "tour-arrow-up" : "tour-arrow-down");
    const arrowCenter = Math.max(18, Math.min(centerX - left, bw - 18));
    arrow.style.left = `${arrowCenter - 10}px`; // the arrow is 20px wide
  }
  bubble.style.opacity = "1";
}

// The centred closing message: a zero-size hole (the whole screen dimmed)
// and the same bubble, so it reads as the end of the same tour rather than
// a separate modal. One button.
function renderTourFinale() {
  const t = spotTour;
  if (!t) return;
  const f = t.opts.finale;
  const overlay = ensureTourOverlay();
  placeTourHole(overlay, { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 });
  const bubble = overlay.querySelector(".tour-bubble");
  bubble.classList.add("center");
  bubble.setAttribute("data-step", "finale");
  bubble.innerHTML = tourBubbleHtml({
    kicker: f.kicker || "",
    title: f.title,
    text: f.text,
    buttons: `<button class="tour-btn" data-tour-finale data-testid="tour-finale-btn">${escapeHtml(f.button || "Done")}</button>`,
  });
  bubble.setAttribute("data-testid", "tour-bubble");
  positionTourBubble(bubble, null);
  const btn = bubble.querySelector("[data-tour-finale]");
  btn.addEventListener("click", () => {
    endTour("done", true);
    if (f.onButton) f.onButton();
  });
  btn.focus({ preventScroll: true });
}

// ===========================================================================
// Round 30 (#1), delivered as spotlights in Stage 33: THE CASE 001
// WALKTHROUGH. ALGO// walks a first-time player through one system at a
// time, at the moment each one first matters. Each BEAT is a short spotlight
// tour (one or two stops) that points at the real thing it's about, fired
// when that thing first appears:
//   open         Case 001's feed, first time      -> what you're looking at
//   investigate  the first profile opened         -> Investigate is free
//   pin          the first Investigate panel      -> the pin button, then the Board tab
//   deep         the next Investigate panel       -> the pull counter, then the pull button
//   interrogate  the first time Message is open   -> the question list
//   report       the first closing report         -> the evidence list, then the strike count
// The bookkeeping is the SAME record the old tip bubbles used (game/state.js's
// tutorial.seen, one entry per beat id, retired "dismissed" when the player
// reaches the end of a beat or "done" when they use the system first — the
// retireTip() calls scattered through this file are untouched); "Skip
// walkthrough" is still skipTutorial(). A retired beat never comes back,
// and the whole walkthrough only exists inside Case 001 for a player who has
// never cleared a case. `open` is new in Stage 33 (a save from before it
// that already had any beat retired gets `open` retired on load — see
// restoreSession). Settings -> Replay tutorial plays every stop in order,
// spotlighting whatever is on screen and centring the rest, without touching
// any of this bookkeeping.
// ===========================================================================

// Case 001's own numbers, whichever world is live (a replay from Home still
// quotes Case 001's budget, not Home's).
let case001SizeCache = null;
function case001Numbers() {
  let n;
  if (currentWorld.kind === "case" && currentWorld.caseId === FIRST_CASE_ID) n = currentWorld.accountCount;
  else {
    if (case001SizeCache === null) {
      try {
        case001SizeCache = window.SKRAPERS_CASES.getCase(FIRST_CASE_ID).build().length;
      } catch (e) {
        case001SizeCache = 10;
      }
    }
    n = case001SizeCache;
  }
  return { accounts: n, pulls: deepPullLimitFor(n), strikes: wrongFlagLimitFor(n, FIRST_CASE_ID) };
}

function firstInside(scopeSel, sel) {
  return () => {
    const scope = document.querySelector(scopeSel);
    return scope ? [scope.querySelector(sel)].filter(Boolean) : [];
  };
}

const WALKTHROUGH_BEATS = [
  {
    id: "open",
    stops: () => [
      {
        targets: () => {
          const limit = document.querySelector('[data-testid="case-brief-limit"]');
          return [limit ? limit.closest(".investigate-panel") : document.querySelector(".case-tools-strip")].filter(Boolean);
        },
        title: "Case 001 — your first file",
        text: () => `${case001Numbers().accounts} accounts, and one of them isn't a person. Nothing here is timed: look around as long as you like before you decide anything.`,
      },
      {
        targets: [".feed .post"],
        title: "Start with anyone",
        text: "Tap any post to open that account's profile. ALGO// will point things out as you reach them — one thing at a time.",
      },
    ],
  },
  {
    id: "investigate",
    stops: () => [
      {
        targets: ['.profile-actions [data-action="investigate"]'],
        title: "Investigate is free",
        text: "<b>Investigate</b> reads this account's signals — free, unlimited, as often as you like. Open a few accounts before you decide: the odd one out only shows next to the others.",
      },
    ],
  },
  {
    id: "pin",
    stops: () => [
      {
        targets: firstInside(".investigate-panel:not(.connections-panel)", "[data-pin]"),
        title: "Pin a suspect",
        text: "Pin anyone you want to build a case against. Pins are free, and you can take one back whenever you like.",
      },
      {
        targets: ['.bottom-nav [data-nav-key="board"]'],
        title: "They land on your Board",
        text: "Every pin gathers on your <b>Case Board</b> — and only a pinned account can be formally flagged.",
      },
    ],
  },
  {
    id: "deep",
    stops: () => [
      {
        targets: firstInside(".investigate-panel:not(.connections-panel)", ".deep-investigate .deep-pull-count"),
        title: "The one thing that costs",
        text: () => `<b>Deep investigation</b> is the only thing here with a price. This case gives you ${case001Numbers().pulls} pulls for the whole attempt — this counter keeps score.`,
      },
      {
        targets: firstInside(".investigate-panel:not(.connections-panel)", '[data-testid="deep-pull-btn"]'),
        title: "Spend it on suspects",
        text: "Each pull opens one account's server records — the evidence that usually decides a case. Spend them on suspects, not hunches.",
      },
    ],
  },
  {
    id: "interrogate",
    stops: () => [
      {
        targets: () => {
          const panel = document.querySelector(".interrogation-panel");
          return panel ? [panel.querySelector('[data-testid="interro-options"]') || panel] : [];
        },
        title: "Ask it twice",
        text: `You can question an account — ${COMMENTS.INTERROGATION_ROUNDS} questions each. Ask about the same thing two different ways: a real person's story holds, a script's tends to slip. You judge each cross-check yourself.`,
      },
    ],
  },
  {
    id: "report",
    stops: () => [
      {
        targets: firstInside(".closing-report-modal", ".closing-options"),
        title: "Name your evidence",
        text: "Every formal flag comes with a <b>closing report</b>: pick the one piece of evidence you'd stand behind. The right account on real evidence is a clean catch; the right account on a hunch still counts — as a lucky call.",
      },
      {
        targets: firstInside(".closing-report-modal", ".case-strike-note"),
        title: "Room to learn",
        text: () => `While you learn, Case 001 allows ${case001Numbers().strikes} wrongful flags before the file is pulled for review. This line keeps count.`,
      },
    ],
  },
];
const TUTORIAL_TIPS = WALKTHROUGH_BEATS.map((b) => b.id);
const WALKTHROUGH_LEGACY_BEATS = ["investigate", "pin", "deep", "interrogate", "report"]; // the five Round 30 tips

function tutorialActive() {
  if (currentWorld.kind !== "case" || currentWorld.caseId !== FIRST_CASE_ID) return false;
  if ((gameState.completedCases || []).length || isCaseCompleted(FIRST_CASE_ID)) return false;
  return !(gameState.tutorial && gameState.tutorial.skipped);
}

function walkthroughStopCount() {
  return WALKTHROUGH_BEATS.reduce((n, b) => n + b.stops().length, 0);
}

// Fires beat `id` a moment after the screen that triggers it has been drawn
// (callers build their elements detached and attach them afterwards). Does
// nothing if the beat is retired, the walkthrough isn't running, or another
// tour is already on screen — it simply comes back the next time its moment
// does. A beat whose target never showed isn't retired either.
function queueWalkthroughBeat(id) {
  if (!tutorialActive() || isTutorialTipSeen(id) || tourActive()) return;
  setTimeout(() => {
    if (!tutorialActive() || isTutorialTipSeen(id) || tourActive()) return;
    const idx = TUTORIAL_TIPS.indexOf(id);
    if (idx === -1) return;
    const offset = WALKTHROUGH_BEATS.slice(0, idx).reduce((n, b) => n + b.stops().length, 0);
    const total = walkthroughStopCount();
    startTour(WALKTHROUGH_BEATS[idx].stops(), {
      noScrollTop: true,
      kicker: (i) => `ALGO// · first case walkthrough · ${offset + i + 1} of ${total}`,
      skipLabel: "Skip walkthrough",
      doneLabel: "Got it",
      onComplete: (r) => {
        if (r.reason === "skipped") {
          skipTutorial();
          syncWalkthroughSummary();
          persistNow();
          showToast("Walkthrough off. You can replay it any time from Settings → Replay tutorial.", "good");
        } else if (r.shown) {
          retireTip(id, "dismissed");
        }
      },
    });
  }, 60);
}

// Settings -> Replay tutorial: every stop of every beat, in order. Whatever
// is on screen right now is spotlighted; the rest is shown centred. Writes
// nothing.
function replayWalkthrough() {
  const stops = WALKTHROUGH_BEATS.reduce((all, b) => all.concat(b.stops()), []);
  return startTour(stops, {
    replay: true,
    fallbackCenter: true,
    kicker: (i, n) => `ALGO// · first case walkthrough · replay · ${i + 1} of ${n}`,
    skipLabel: "Close",
    doneLabel: "Done",
  });
}

// The walkthrough's summary flag (game/state.js's tutorial.tours.case001):
// set once every beat is retired, or the walkthrough is skipped. In
// Simplified Mode there is no Message button, so the questioning beat can
// never come round — it doesn't hold the summary back.
function syncWalkthroughSummary() {
  if (isTourSeen("case001")) return false;
  const t = gameState.tutorial || {};
  const done = !!t.skipped || TUTORIAL_TIPS.every((id) => isTutorialTipSeen(id) || (id === "interrogate" && simplifiedMode()));
  return done ? markTourSeen("case001") : false;
}

// Retires a walkthrough beat (dismissed, or "done" — the player used the
// system) — only inside the walkthrough; a no-op anywhere else.
function retireTip(id, how) {
  if (!tutorialActive()) return;
  const changed = retireTutorialTip(id, how);
  const summary = syncWalkthroughSummary();
  if (changed || summary) persistNow();
}

// ===========================================================================
// Stage 33: THE OPENING INTERFACE TOUR — once, right after the CAPTCHA and
// the Terms, before the player's first real interaction with Home (game/
// state.js's tutorial.tours.main). It walks the REAL app: the Home stops
// point at the live Home screen, then each tab stop navigates there for
// real (through the same render functions the bottom nav calls, so every
// hop goes through trackScreen) and spotlights the actual thing on it.
// Deliberately light on HOW to investigate — that's the Case 001
// walkthrough's job — and on the Marketplace, whose own tour runs the first
// time the player goes there themselves. Skip ends the whole tour. The
// finale's one button goes to Case Load, where Case 001 is waiting.
// ===========================================================================
function onHomeFeedNow() {
  return currentView === "feed" && currentWorld.kind === "procedural";
}

function mainTourSteps() {
  const toHome = () => {
    if (onHomeFeedNow()) return false;
    goHome();
    return true;
  };
  return [
    {
      onEnter: toHome,
      center: true,
      title: "Welcome to ALGO//",
      text: "Some of these accounts are real people. Some aren't. Your job is to tell the difference.",
    },
    {
      onEnter: toHome,
      targets: [".topbar-search"],
      title: "Search",
      text: "Search accounts and terms from here. Type in it on any other screen and it takes you straight back Home.",
    },
    {
      onEnter: toHome,
      targets: ['[data-action="main-feed"]', '[data-action="case-load"]'],
      title: "Feed and Case Load",
      text: "<b>View Feed</b> scrolls forever. <b>View Case Load</b> is where the actual work happens — one case at a time.",
    },
    {
      onEnter: toHome,
      targets: [".feed .post .post-actions"],
      title: "On every post",
      text: "<b>Attach Pin</b> sends that account to your Case Board. <b>Authentic</b> is a private note to yourself. Neither one accuses anybody.",
    },
    {
      onEnter: toHome,
      targets: [".bottom-nav"],
      title: "Five tabs",
      text: "<b>Home</b> is the feed. <b>Inbox</b> holds replies and alerts. <b>Market</b> is local listings. <b>Board</b> is everyone you've pinned. <b>Profile</b> is what ALGO// knows about you.",
    },
    {
      onEnter: () => {
        renderInbox({ tab: "messages" });
        return true;
      },
      targets: ['[data-testid="inbox-tabs"]'],
      title: "Inbox",
      text: "Replies from people and alerts from ALGO// both live here now. Flip between them with this switch.",
    },
    {
      onEnter: () => {
        renderMarketplace();
        return true;
      },
      targets: () => [...document.querySelectorAll('[data-testid="market-grid"] .market-card')].slice(0, 2),
      title: "Market",
      text: "Listings from real accounts in this network — worth a proper look. We'll show you what to watch for the first time you're actually in here.",
    },
    {
      onEnter: () => {
        renderCaseBoard();
        return true;
      },
      targets: () => {
        const cork = document.querySelector(".corkboard-viewport");
        if (cork) return [cork];
        const panels = [...app.querySelectorAll(".investigate-panel")];
        const empty = app.querySelector(".empty-state");
        return [panels[0], empty].filter(Boolean);
      },
      title: "Case Board",
      text: "Everyone you pin ends up here. This is where you build a case — and the only place a formal accusation starts.",
    },
    {
      onEnter: () => {
        renderPlayerProfile();
        return true;
      },
      targets: ['[data-testid="player-icon-key-btn"]'],
      title: "The icon key",
      text: "Every icon in this game is explained here, if you forget one. It's in Settings too.",
    },
  ];
}

function startMainTour(replay) {
  return startTour(mainTourSteps(), {
    replay: !!replay,
    trackNav: true,
    kicker: (i, n) => `ALGO// · getting started${replay ? " · replay" : ""} · ${i + 1} of ${n}`,
    skipLabel: replay ? "Close" : "Skip tour",
    finale: {
      kicker: "ALGO// · getting started",
      title: "You're in.",
      text: "Go find Case 001.",
      button: "Open Case Load",
      onButton: () => goStory(),
    },
    onComplete: (r) => {
      if (r.replay) return;
      markTourSeen("main");
      persistNow();
    },
  });
}

function maybeStartMainTour() {
  if (isTourSeen("main") || tourActive()) return;
  setTimeout(() => {
    if (isTourSeen("main") || tourActive() || !onHomeFeedNow()) return;
    if (document.querySelector(".trust-modal-overlay")) return; // something else is already asking the player something
    startMainTour(false);
  }, 80);
}

// Settings -> Replay tutorial. Plays a tour regardless of whether it has
// been seen, and never writes its seen-flag (every tour's onComplete checks
// `replay`), so nothing else that reads "has this player seen X" changes.
const REPLAYABLE_TOURS = [
  { id: "main", name: "Opening tour", sub: "The five tabs, and where everything lives" },
  { id: "case001", name: "Case 001 walkthrough", sub: "Investigate, pins, deep pulls, questioning, the closing report" },
  { id: "market", name: "Market guide", sub: "What to watch for in a listing" },
];

function replayTour(id) {
  if (tourActive()) return false;
  if (id === "main") return startMainTour(true);
  if (id === "market") return startMarketTour(true);
  if (id === "case001") return replayWalkthrough();
  return false;
}

// ===========================================================================
// Stage 31 (#11): "WHAT TO CHECK" — the standing reference card for every
// case AFTER the Case 001 walkthrough. The walkthrough teaches the tools one
// beat at a time and then goes quiet for good; this is the opposite shape:
// never pushed at the player, collapsed by default, one tap to open when
// they want a reminder of the kinds of evidence worth comparing. It names
// categories of evidence, never an account, so it can't give a case away.
// Shown on a case's feed and in its Case File whenever the walkthrough
// isn't running (any case after the first, or Case 001 once the
// walkthrough has been skipped or every beat of it retired). Whether it's
// open is a per-session view choice, like the board's map/list mode.
// ===========================================================================
const WHAT_TO_CHECK = [
  { icon: "clock", title: "Posting times & activity hours", text: "Does it post on a near-exact interval? Are its active hours plausible for where it says it lives?" },
  { icon: "network", title: "Network connections", text: "Who follows whom, who tags whom, and does anyone follow it back? Clusters that only talk to each other stand out." },
  { icon: "note", title: "Bio & profile consistency", text: "Duplicate or templated bios, a join date that doesn't fit, a stated location that doesn't match its hours." },
  { icon: "comment", title: "Comment patterns", text: "Do its comments sound like the same voice as its posts? Repeated wording, generic praise, replies that don't answer?" },
  { icon: "activity", title: "Recent activity vs. posts", text: "Does what it likes and searches match what it posts about — or something else entirely?" },
  { icon: "scan", title: "Metadata tells", text: "Deep records: session timezone vs. stated city, a stock profile photo, an account record older than ALGO//." },
  { icon: "mail", title: "Story cross-checks", text: "Ask about the same thing two ways. A person's answers hold; a script's tend to slip." },
  { icon: "trending", title: "Timelines & echoes", text: "Who posted a wording first, and who repeated it — on what beat?" },
];
let whatToCheckOpen = false;

function whatToCheckAvailable() {
  if (currentWorld.kind !== "case") return false;
  if (!tutorialActive()) return true;
  return TUTORIAL_TIPS.every((id) => isTutorialTipSeen(id));
}

function renderWhatToCheckPanel() {
  if (!whatToCheckAvailable()) return null;
  const el = document.createElement("details");
  el.className = "what-to-check";
  el.setAttribute("data-testid", "what-to-check");
  if (whatToCheckOpen) el.open = true;
  el.innerHTML = `
    <summary>${ICON.book} <span>What to check</span><span class="what-to-check-sub">evidence worth comparing</span></summary>
    <div class="what-to-check-body">
      ${WHAT_TO_CHECK.map((row) => `<div class="what-to-check-row"><span class="what-to-check-icon">${ICON[row.icon]}</span><span><b>${escapeHtml(row.title)}</b> ${escapeHtml(row.text)}</span></div>`).join("")}
      <div class="what-to-check-foot">No single one of these is proof. Line several up across a few accounts.</div>
    </div>
  `;
  el.addEventListener("toggle", () => {
    whatToCheckOpen = el.open;
  });
  return el;
}

// ===========================================================================
// Round 30 (#3): the case feed's "what next" line — Home's focus nudge,
// pointed at the player's own next ACTION rather than at an account. Every
// suggestion is read off this attempt's real state (the same per-world state
// the closing report draws on: accounts investigated, Connections followed,
// pins, deep pulls spent, questions asked, board links, the timeline, formal
// flags), so it only ever suggests something the player genuinely hasn't
// done yet — and it never names or points at an account, so it can't give
// the answer away. Highest-priority first; the first one the player hasn't
// dismissed this attempt shows. Dismissing moves straight on to the next.
// ===========================================================================
function caseNudgeCandidates() {
  const key = pinKeyFor(currentWorld);
  const investigated = caseActionCount("investigated");
  const connections = caseActionCount("connections");
  const pins = [...pinnedIds].filter((id) => accountById(id)).length;
  const used = deepPullsUsed();
  const left = deepPullsRemaining();
  const asked = Object.values(gameState.interrogations || {}).filter((e) => e && e.asked && e.asked.length);
  const flags = Object.keys(gameState.flagged || {}).length;
  const links = linksFor(key).length;
  const out = [];
  const add = (k, text) => out.push({ key: k, text });
  if (!investigated) add("investigate-first", "You haven't opened Investigate on anyone yet. Tap any post to open its account, then press Investigate — reading signals is free.");
  else if (investigated < 3 && !flags) add("investigate-more", `You've read ${investigated} account${investigated === 1 ? "'s" : "s'"} signals so far. Read a couple more — an odd one out only stands out against the others.`);
  if (worldTopics().length && !gameState.timelineViewed) add("timeline", "There's a story moving through this file. Switch the feed to Timeline and read it in order.");
  if (investigated && !pins) add("pin", "Nothing pinned yet. Pin the account you'd most want to explain — it's free, and it's how a case gets built.");
  if (investigated && !connections) add("connections", "You haven't followed anyone's Connections yet. Open Investigate on a suspect, scroll to Connections, and see who they follow — and who follows them back.");
  if (pins && !used && left) add("pull", `You have ${left} unspent deep-investigate pull${left === 1 ? "" : "s"}. Spend one on your strongest suspect — it opens the records that usually decide a case.`);
  if (!simplifiedMode() && pins && !asked.length) add("interrogate", "Try asking a suspect something. Open their profile, press Message, then ask about the same thing a second way.");
  if (!simplifiedMode() && asked.some((e) => e.asked.length === 1)) add("follow-up", "Try asking a follow-up question. One answer proves little — the same fact asked two ways is how a cover story cracks.");
  if (pins >= 2 && !links) add("link", "You have suspects pinned but nothing linking them. On the Case Board, draw a link between two pins and say why they belong together.");
  if (pins && investigated >= 3 && !flags) add("flag", "When you're sure, formally flag a pinned suspect from its Investigate panel or the Case Board — you'll name your deciding evidence in a closing report.");
  return out;
}

function currentCaseNudge() {
  const dismissed = gameState.caseNudgeDismissed || [];
  return caseNudgeCandidates().find((c) => dismissed.indexOf(c.key) === -1) || null;
}

function renderCaseNudge() {
  if (currentWorld.kind !== "case" || isCaseCompleted(currentWorld.caseId)) return null;
  const n = currentCaseNudge();
  if (!n) return null;
  const el = document.createElement("div");
  el.className = "focus-nudge case-nudge";
  el.setAttribute("data-testid", "case-nudge");
  el.setAttribute("data-nudge-key", n.key);
  el.innerHTML = `
    <span class="focus-nudge-icon">${ICON.eye}</span>
    <div class="focus-nudge-body"><span class="focus-nudge-kicker">ALGO// · next step</span><span class="focus-nudge-text">${escapeHtml(n.text)}</span></div>
    <button class="focus-nudge-dismiss icon-btn icon-btn-subtle" aria-label="Dismiss" data-testid="case-nudge-dismiss">${ICON.close}</button>
  `;
  el.querySelector(".focus-nudge-dismiss").addEventListener("click", () => {
    dismissCaseNudge(n.key);
    persistNow();
    const next = renderCaseNudge();
    if (next) el.replaceWith(next);
    else el.remove();
  });
  return el;
}

// ===========================================================================
// Round 30 (#5): THE CASE FILE — everything about the live case attempt in
// one screen: the review status, the pull budget and the "I'm stuck" hint
// (the case tools strip itself, so it behaves identically), every pinned
// account with its note, its evidence links and what's been done to it,
// and a way back into any account you've been questioning. Purely a
// consolidated VIEW and a set of shortcuts: every original place these
// live — the profile, the Investigate panel, the Case Board, the case feed's
// strip, the case brief — is untouched and still works exactly as before.
// Reached from the case tools strip's "Case file" button.
// ===========================================================================
function renderCaseFile() {
  if (currentWorld.kind !== "case") return renderFeed(true);
  currentView = "casefile";
  trackScreen(renderCaseFile, "casefile");
  detachHomeScrollHandler();
  app.innerHTML = "";
  window.scrollTo(0, 0);
  const topbar = renderTopbarStack(`<button class="back-btn">${ICON.chevronLeft} Back</button>`, false);
  topbar.querySelector(".back-btn").addEventListener("click", () => goBack());
  app.appendChild(topbar);

  const key = pinKeyFor(currentWorld);
  const done = isCaseCompleted(currentWorld.caseId);
  const strikes = wrongfulFlagCount();
  const limit = wrongFlagLimitFor(currentWorld.accountCount, currentWorld.caseId);
  const flags = Object.values(gameState.flagged || {});
  const upheld = flags.filter((f) => f.correct).length;

  const head = document.createElement("div");
  head.className = "investigate-panel case-file-head";
  head.style.margin = "12px 18px";
  head.setAttribute("data-testid", "case-file");
  head.innerHTML = `
    <h4>${ICON.book} Case file — ${escapeHtml(currentWorld.label)}</h4>
    <div class="case-file-sub">Everything about this attempt in one place. It's a shortcut — the profile, the Case Board and the case feed all still work exactly the same.</div>
    <div class="case-file-stats">
      <span data-testid="case-file-strikes">${ICON.shield} ${done ? "Case cleared" : `${strikes} of ${limit} wrongful flags`}</span>
      <span>${ICON.reportBot} ${flags.length} formal flag${flags.length === 1 ? "" : "s"}${flags.length ? ` · ${upheld} upheld` : ""}</span>
      <span>${ICON.pin} ${[...pinnedIds].filter((id) => accountById(id)).length} pinned</span>
    </div>
    <div class="case-file-actions">
      <button class="case-hint-btn" data-go="feed">${ICON.menu} Case feed</button>
      <button class="case-hint-btn" data-go="board" data-testid="case-file-board">${ICON.pin} Case Board</button>
      <button class="case-hint-btn" data-go="caseload">${ICON.book} View Case Load</button>
    </div>
  `;
  head.querySelector('[data-go="feed"]').addEventListener("click", () => renderFeed(true));
  head.querySelector('[data-go="board"]').addEventListener("click", () => {
    boardActiveKey = key;
    renderCaseBoard();
  });
  head.querySelector('[data-go="caseload"]').addEventListener("click", goStory);
  app.appendChild(head);

  const tools = renderCaseToolsStrip({ inFile: true });
  if (tools) app.appendChild(tools);
  const checklist = renderWhatToCheckPanel();
  if (checklist) app.appendChild(checklist);

  // Pinned suspects, each with its note (edited in place — the same editor
  // the profile and the Case Board use) and its links.
  const pinned = [...pinnedIds].map(accountById).filter(Boolean);
  const links = linksFor(key);
  const pinsPanel = document.createElement("div");
  pinsPanel.className = "investigate-panel case-file-pins";
  pinsPanel.style.margin = "0 18px 12px";
  pinsPanel.setAttribute("data-testid", "case-file-pins");
  pinsPanel.innerHTML = `<h4>${ICON.pin} Pinned suspects (${pinned.length})</h4>${
    pinned.length ? "" : `<div class="case-file-empty">Nothing pinned yet — pin an account from its profile or its Investigate panel.</div>`
  }`;
  pinned.forEach((acct) => {
    const row = document.createElement("div");
    row.className = "case-file-pin";
    row.setAttribute("data-testid", "case-file-pin");
    row.setAttribute("data-acct-id", acct.id);
    const f = gameState.flagged[acct.id];
    const interro = simplifiedMode() ? null : interrogationFor(acct.id);
    const chips = [];
    if (f) chips.push(`<span class="case-file-chip ${f.correct ? "good" : "bad"}">${f.correct ? "Suspended" : "Flag appealed"}</span>`);
    if (isDeepInvestigated(acct.id)) chips.push(`<span class="case-file-chip">${ICON.scan} records pulled</span>`);
    if (interro && interro.asked.length) chips.push(`<span class="case-file-chip">${ICON.mail} ${interro.asked.length} asked</span>`);
    const mine = links.filter((l) => l.a === acct.id || l.b === acct.id);
    row.innerHTML = `
      <div class="case-file-pin-head"><span class="case-file-name" data-open>${escapeHtml(acct.name)} <span>${escapeHtml(acct.handle)}</span></span>${chips.join("")}</div>
      ${mine
        .map((l) => {
          const other = accountById(l.a === acct.id ? l.b : l.a);
          return other ? `<div class="case-file-link" data-testid="case-file-link">${ICON.link} ↔ ${escapeHtml(other.name)} — <i>${escapeHtml(l.reason)}</i></div>` : "";
        })
        .join("")}
      <div data-note-slot></div>
    `;
    row.querySelector("[data-open]").addEventListener("click", () => renderProfile(acct.id));
    row.querySelector("[data-note-slot]").replaceWith(renderPinNoteEditor(key, acct, { variant: "board" }));
    pinsPanel.appendChild(row);
  });
  app.appendChild(pinsPanel);

  // Everyone you've been questioning — a way straight back into it.
  if (!simplifiedMode()) {
    const talked = Object.entries(gameState.interrogations || {})
      .map(([id, e]) => ({ acct: accountById(id), e }))
      .filter((x) => x.acct && x.e && x.e.asked && x.e.asked.length);
    const qPanel = document.createElement("div");
    qPanel.className = "investigate-panel case-file-questions";
    qPanel.style.margin = "0 18px 12px";
    qPanel.setAttribute("data-testid", "case-file-questions");
    qPanel.innerHTML = `<h4>${ICON.mail} Questioning (${talked.length})</h4>${
      talked.length
        ? talked
            .map(({ acct, e }) => {
              const bad = Object.values(e.marks || {}).filter((v) => v === "contradiction").length;
              const left = COMMENTS.INTERROGATION_ROUNDS - e.asked.length;
              return `<div class="signal-row case-file-q" data-testid="case-file-q"><span>${escapeHtml(acct.name)} <span style="color:var(--grey); font-weight:400;">${e.asked.length}/${COMMENTS.INTERROGATION_ROUNDS} asked${bad ? ` · ${bad} contradiction${bad === 1 ? "" : "s"} marked` : ""}</span></span><button class="case-hint-btn" data-continue="${acct.id}" data-testid="case-file-continue">${left > 0 ? "Continue questioning" : "Read answers"}</button></div>`;
            })
            .join("")
        : `<div class="case-file-empty">You haven't questioned anyone in this case. Message is on every profile.</div>`
    }`;
    qPanel.querySelectorAll("[data-continue]").forEach((btn) => btn.addEventListener("click", () => renderProfile(btn.getAttribute("data-continue"), { openMessage: true })));
    app.appendChild(qPanel);
  }
  app.appendChild(renderBottomNav(null));
}

function renderInvestigatePanel(acct) {
  const signals = computeSignals(acct);
  window.SKRAPERS_ALGO.recordInvestigate(signals); // Stage 9: what the player looks at feeds the adaptive algo
  // Stage 13: investigating a REAL human costs Trust — Skrapers don't
  // notice or react (see game/trust.js), so this is specifically the
  // "surveilling a real person has a cost" mechanic the doc calls for.
  if (!acct.isSkraper) window.SKRAPERS_TRUST.glance(acct.id);
  // Round 30 (#3): which accounts this attempt has actually read.
  if (currentWorld.kind === "case") recordCaseAction("investigated", acct.id);
  checkAlgoMessages();
  persistNow();
  const panel = document.createElement("div");
  panel.className = "investigate-panel";
  const isPinned = pinnedIds.has(acct.id);
  const isFormallyFlagged = !!gameState.flagged[acct.id];
  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
      <h4 style="margin:0;">Signals</h4>
      <button class="investigate-btn" data-pin style="margin-top:0; background:transparent; color:var(--blue); border:1px solid var(--blue); font-size:12px; padding:6px 10px;">${isPinned ? `${ICON.pinOff} Pinned — remove` : `${ICON.pin} Pin to case board`}</button>
    </div>
    ${signals
      .map(
        (s) => `
      <div class="signal-row">
        <span>${s.label}</span>
        <span class="signal-level ${s.level}">${s.level.toUpperCase()} <span style="color:var(--grey); font-weight:400; text-transform:none;">(${s.value})</span></span>
      </div>`
      )
      .join("")}
    <div data-deep-slot></div>
    ${
      isPinned
        ? `<div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(83,100,113,0.15);">
        <button class="investigate-btn" data-formal-flag style="margin-top:0; background:transparent; color:var(--red); border:1px solid var(--red); font-size:12px; padding:6px 10px;" ${isFormallyFlagged ? "disabled" : ""}>${isFormallyFlagged ? `${ICON.reportBot} Formally flagged` : `${ICON.reportBot} Formally flag as Skraper`}</button>
        <div style="font-size:11.5px; color:var(--grey); margin-top:6px;">This is the real accusation — it moves your ALGO// standing and Community Trust, win or lose. The lightweight flag/trust icons on the feed are just your own notes.${caseStrikeNote()}</div>
      </div>`
        : ""
    }
  `;
  const deepSection = renderDeepInvestigateSection(acct);
  panel.querySelector("[data-deep-slot]").replaceWith(deepSection);
  // Round 30 (#1): walkthrough beats, one at a time — pinning the first time
  // Investigate is open, then (once that's learned) what a deep pull is.
  // Stage 33: spotlights on the pin button / Board tab, then on the pull
  // counter / pull button, rather than tip lines inside the panel.
  if (!isTutorialTipSeen("pin")) queueWalkthroughBeat("pin");
  else queueWalkthroughBeat("deep");
  panel.querySelector("[data-pin]").addEventListener("click", (e) => {
    if (pinnedIds.has(acct.id)) unpinAccount(pinKeyFor(currentWorld), acct.id);
    else {
      pinnedIds.add(acct.id);
      retireTip("pin", "done");
    }
    if (!acct.isSkraper) window.SKRAPERS_TRUST.pin(acct.id); // pinning is a bigger, more deliberate act than a glance
    persistNow();
    renderProfile(acct.id); // re-render so the formal-flag action appears/disappears with pin state
  });
  const formalBtn = panel.querySelector("[data-formal-flag]");
  if (formalBtn) {
    formalBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      formallyFlagAsSkraper(acct, () => renderProfile(acct.id));
    });
  }
  return panel;
}

// Stage 16 (#4): default view mode + zoom/pan state for the corkboard map
// — module-level so it survives re-renders (unpinning, toggling) within a
// session, reset isn't needed on world switch since pins themselves clear.
let boardViewMode = "map"; // "map" | "list"
let boardZoom = 1;
let boardPanX = 40;
let boardPanY = 30;
const pinPositions = {}; // acctId -> {x, y} in canvas coordinates, lazily assigned

function clampZoom(z) {
  return Math.max(0.5, Math.min(2, z));
}

// Stage 17 (#4) fix: the old default layout hashed EACH pin's position
// independently (x = hash % 950, y = hash % 610), which had no idea how
// many other pins existed — with enough pins, hash collisions (or just
// near-misses) put two pins directly on top of each other, and the pin
// underneath was, to the player, simply "lost" (no visual indication
// anything was there). This instead lays out the WHOLE current pinned set
// at once as a grid (deterministic order — sorted ids — so it's stable
// across renders), which guarantees no two pins start in the same spot
// regardless of count, and naturally grows outward as more pins are
// added rather than cramming into one fixed canvas. A small deterministic
// per-id jitter keeps it from looking like a sterile spreadsheet.
const PIN_CELL_W = 150;
const PIN_CELL_H = 130;
// Stage 31 (#6): where a board string attaches to a pin, relative to the
// pin element's top-left (its `left`/`top`, i.e. pinPositions) — the centre
// of the red thumbtack head. Must match ui/styles.css: .corkboard-pin is
// 84px wide with the tack centred, and .corkboard-pin-tack is 16px tall at
// the top of the pin, so its centre is (42, 8). These are only the first-
// paint fallback: once the board is in the document, drawStrings() measures
// the real tack (offsetLeft/offsetTop are layout coordinates, untouched by
// the board's zoom/pan transform) so a CSS change can never detach them again.
const PIN_ANCHOR_X = 42;
const PIN_ANCHOR_Y = 8;
function defaultPinPositions(pinnedList) {
  const ids = pinnedList.map((a) => a.id).sort();
  const cols = Math.max(1, Math.ceil(Math.sqrt(ids.length)));
  const map = {};
  ids.forEach((id, i) => {
    let h = 0;
    for (let c = 0; c < id.length; c++) h = (h * 31 + id.charCodeAt(c)) >>> 0;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (h % 36) - 18;
    const jitterY = ((h >> 8) % 36) - 18;
    map[id] = { x: 60 + col * PIN_CELL_W + jitterX, y: 60 + row * PIN_CELL_H + jitterY };
  });
  return map;
}

// `defaults` is the whole-board layout from defaultPinPositions() above —
// callers within renderCaseBoardMap always pass it so a never-before-seen
// pin gets a collision-free slot; a pin that's already been dragged keeps
// its saved position regardless.
function pinPositionFor(acctId, defaults) {
  if (!pinPositions[acctId]) {
    pinPositions[acctId] = (defaults && defaults[acctId]) || { x: 60, y: 60 };
  }
  return pinPositions[acctId];
}

// Round 27 (#6): the investigator's note on one pin — a plain, capped,
// free-text string (no rich text), shown wherever that pin appears and
// editable in place. `key` is the pin set it belongs to (see pinNotes).
// `opts.onChange` lets a host (the corkboard) refresh its own snippet.
// Every click inside stops propagation, since several hosts (Case Board
// cards, corkboard) have their own click handlers.
function renderPinNoteEditor(key, acct, opts) {
  opts = opts || {};
  const el = document.createElement("div");
  el.className = `pin-note${opts.variant ? ` pin-note-${opts.variant}` : ""}`;
  el.setAttribute("data-testid", "pin-note");
  el.setAttribute("data-acct-id", acct.id);
  el.addEventListener("click", (e) => e.stopPropagation());
  el.addEventListener("pointerdown", (e) => e.stopPropagation());

  function showView() {
    const note = pinNoteFor(key, acct.id);
    el.innerHTML = `
      <div class="pin-note-head">${ICON.note} Investigator's note</div>
      ${note ? `<div class="pin-note-text" data-testid="pin-note-text">${escapeHtml(note)}</div>` : `<div class="pin-note-empty">No note yet — why did you pin ${escapeHtml(acct.name)}?</div>`}
      <button class="pin-note-btn" data-note-edit>${note ? "Edit note" : "Add note"}</button>
    `;
    el.querySelector("[data-note-edit]").addEventListener("click", showEdit);
  }

  function showEdit() {
    const note = pinNoteFor(key, acct.id);
    el.innerHTML = `
      <div class="pin-note-head">${ICON.note} Investigator's note</div>
      <textarea class="pin-note-input" data-testid="pin-note-input" maxlength="${PIN_NOTE_MAX}" rows="3" placeholder="What made you pin this account? Which signal, which connection?"></textarea>
      <div class="pin-note-row">
        <span class="pin-note-count"></span>
        <span class="pin-note-actions">
          ${note ? `<button class="pin-note-btn subtle" data-note-clear>Clear</button>` : ""}
          <button class="pin-note-btn subtle" data-note-cancel>Cancel</button>
          <button class="pin-note-btn primary" data-note-save>Save</button>
        </span>
      </div>
    `;
    const input = el.querySelector("textarea");
    const count = el.querySelector(".pin-note-count");
    input.value = note;
    const updateCount = () => (count.textContent = `${input.value.length}/${PIN_NOTE_MAX}`);
    updateCount();
    input.addEventListener("input", updateCount);
    input.focus();
    const commit = (text) => {
      setPinNote(key, acct.id, text);
      persistNow();
      showView();
      if (opts.onChange) opts.onChange();
    };
    el.querySelector("[data-note-save]").addEventListener("click", () => commit(input.value));
    el.querySelector("[data-note-cancel]").addEventListener("click", showView);
    const clearBtn = el.querySelector("[data-note-clear]");
    if (clearBtn) clearBtn.addEventListener("click", () => commit(""));
  }

  showView();
  return el;
}

// Stage 8: a dedicated view over the player's own pinned accounts — the
// case has to be built from several accounts weighed together (doc's own
// "no single signal is conclusive" design principle), so this is where
// that weighing actually happens, rather than re-opening profiles one at
// a time from memory.
function renderCaseBoard() {
  currentView = "caseboard";
  trackScreen(renderCaseBoard, "caseboard");
  detachHomeScrollHandler();
  app.innerHTML = "";
  // Bug fix (real Back button): used to hardcode renderFeed(true) — see
  // renderProfile's comment above.
  const topbar = renderTopbarStack(`<button class="back-btn">${ICON.chevronLeft} Back</button>`, false);
  topbar.querySelector(".back-btn").addEventListener("click", () => goBack());
  app.appendChild(topbar);

  // Feature round (Case Board tabs): default to whichever pin set matches
  // the world that's actually loaded, but let the player flip tabs from
  // there without that switch touching currentWorld at all — see the
  // pinSets comment near the top of this file.
  if (!boardActiveKey) boardActiveKey = pinKeyFor(currentWorld);
  const tabs = [{ key: "home", label: pinLabelFor("home") }];
  const missionKey = currentWorld.kind === "case" ? pinKeyFor(currentWorld) : lastCaseKey;
  if (missionKey) tabs.push({ key: missionKey, label: pinLabelFor(missionKey) });
  if (!tabs.some((t) => t.key === boardActiveKey)) boardActiveKey = "home"; // e.g. a mission tab that no longer applies

  const isActiveWorld = boardActiveKey === pinKeyFor(currentWorld);
  const tabsHtml =
    tabs.length > 1
      ? `<div class="board-tabs">${tabs
          .map((t) => `<button class="board-tab${boardActiveKey === t.key ? " active" : ""}" data-tab="${t.key}">${t.label}</button>`)
          .join("")}</div>`
      : "";

  const header = document.createElement("div");
  header.className = "investigate-panel";
  header.style.margin = "12px 18px";
  header.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
      <h4 style="margin:0;">Case Board</h4>
      <button class="investigate-btn" data-toggle-view style="margin-top:0; background:transparent; color:var(--blue); border:1px solid var(--blue); font-size:12px; padding:6px 10px;">${boardViewMode === "map" ? `${ICON.menu} List view` : `${ICON.link} Map view`}</button>
    </div>
    ${tabsHtml}
    <div style="font-size:13px; line-height:1.5; margin-top:6px;">Accounts you've pinned${isActiveWorld ? "" : " — viewing only, switch worlds to act on these"}. Weigh their signals together — no single one is conclusive on its own. ${boardViewMode === "map" ? "Drag pins to rearrange, drag the board to pan, use +/- to zoom." : ""}</div>
  `;
  header.querySelector("[data-toggle-view]").addEventListener("click", () => {
    boardViewMode = boardViewMode === "map" ? "list" : "map";
    renderCaseBoard();
  });
  header.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      boardActiveKey = btn.getAttribute("data-tab");
      renderCaseBoard();
    });
  });
  app.appendChild(header);

  const boardAccounts = accountsForPinKey(boardActiveKey);
  const boardPinSet = ensurePinSet(boardActiveKey);
  const pinned = [...boardPinSet].map((id) => boardAccounts.find((a) => a.id === id)).filter(Boolean);
  if (pinned.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nothing pinned yet. Open an account's Investigate panel and pin it here.";
    app.appendChild(empty);
    app.appendChild(renderBottomNav("board"));
    return;
  }

  app.appendChild(renderCaseBoardEvidence(pinned, boardActiveKey));

  if (boardViewMode === "map") {
    app.appendChild(renderCaseBoardMap(pinned, boardActiveKey, isActiveWorld));
  } else {
    app.appendChild(renderCaseBoardList(pinned, boardActiveKey, isActiveWorld));
    app.appendChild(renderPinLinksPanel(pinned, boardActiveKey));
  }
  app.appendChild(renderBottomNav("board"));
}

// The original list layout, kept as a simpler, more robust fallback
// reachable via the List view toggle — the map view is the default.
// `boardKey`/`isActiveWorld` (Case Board tabs): unpinning always works
// (it's just editing that pin set's own data); viewing a profile or
// formally flagging only makes sense for whichever pin set belongs to the
// world that's actually loaded right now — see renderCaseBoard.
function renderCaseBoardList(pinned, boardKey, isActiveWorld) {
  const wrap = document.createElement("div");
  pinned.forEach((acct) => {
    const card = document.createElement("div");
    card.className = "investigate-panel";
    card.style.margin = "0 18px 12px";
    const signals = computeSignals(acct);
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:10px; flex-wrap:wrap;">
        <div data-view style="${isActiveWorld ? "cursor:pointer;" : ""}">
          <div style="font-weight:600;">${acct.name}</div>
          <div style="font-size:12px; color:var(--grey);">${acct.handle}</div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          ${isActiveWorld ? `<button class="investigate-btn" data-view style="margin-top:0; background:transparent; color:var(--blue); border:1px solid var(--blue); font-size:12px; padding:6px 10px;">View profile</button>` : ""}
          <button class="investigate-btn" data-unpin style="margin-top:0; background:transparent; color:var(--grey); border:1px solid var(--grey); font-size:12px; padding:6px 10px;">Unpin</button>
        </div>
      </div>
      ${signals
        .map(
          (s) => `
        <div class="signal-row">
          <span>${s.label}</span>
          <span class="signal-level ${s.level}">${s.level.toUpperCase()} <span style="color:var(--grey); font-weight:400; text-transform:none;">(${s.value})</span></span>
        </div>`
        )
        .join("")}
      <div data-note-slot></div>
      <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(83,100,113,0.15);">
        ${
          isActiveWorld
            ? `<button class="investigate-btn" data-formal-flag style="margin-top:0; background:transparent; color:var(--red); border:1px solid var(--red); font-size:12px; padding:6px 10px;" ${gameState.flagged[acct.id] ? "disabled" : ""}>${gameState.flagged[acct.id] ? `${ICON.reportBot} Formally flagged` : `${ICON.reportBot} Formally flag as Skraper`}</button><div style="font-size:11.5px; color:var(--grey); margin-top:6px;">${caseStrikeNote().trim()}</div>`
            : `<div style="font-size:11.5px; color:var(--grey);">Switch to this world to formally flag.</div>`
        }
      </div>
    `;
    card.querySelector("[data-note-slot]").replaceWith(renderPinNoteEditor(boardKey, acct, { variant: "board" }));
    if (isActiveWorld) card.querySelectorAll("[data-view]").forEach((el) => el.addEventListener("click", (e) => { e.stopPropagation(); renderProfile(acct.id); }));
    card.querySelector("[data-unpin]").addEventListener("click", () => {
      unpinAccount(boardKey, acct.id);
      persistNow();
      renderCaseBoard();
    });
    const formalBtn = card.querySelector("[data-formal-flag]");
    if (formalBtn) formalBtn.addEventListener("click", () => formallyFlagAsSkraper(acct, renderCaseBoard));
    wrap.appendChild(card);
  });
  return wrap;
}

// Stage 16 (#4): the corkboard/map view — pinned accounts as draggable
// icons on a pannable, zoomable, cork-textured canvas, with red "string"
// lines (an SVG overlay) connecting accounts that share a follow-relation
// chain — reusing the exact same chain logic as the EVIDENCE readout
// above rather than a second relationship layer.
function renderCaseBoardMap(pinned, boardKey, isActiveWorld) {
  const wrap = document.createElement("div");
  const toolbar = document.createElement("div");
  toolbar.className = "corkboard-toolbar";
  toolbar.innerHTML = `
    <button class="corkboard-zoom-btn icon-btn" data-zoom-out title="Zoom out" aria-label="Zoom out">${ICON.minus}</button>
    <button class="corkboard-zoom-btn icon-btn" data-zoom-in title="Zoom in" aria-label="Zoom in">${ICON.plus}</button>
    <span style="font-family:'Space Grotesk',monospace; font-size:11px; color:var(--grey);" data-zoom-readout>${Math.round(boardZoom * 100)}%</span>
    ${pinned.length >= 2 ? `<button class="corkboard-link-mode-btn" data-link-mode data-testid="link-mode-btn">${ICON.link} Link pins</button><span class="corkboard-link-status" data-link-mode-status></span>` : ""}
  `;
  // Round 28 (#1): "Link pins" mode — while it's on, tapping a pin picks
  // it as one end of a new evidence link instead of opening its profile;
  // the second tap opens the reason composer below, pre-filled.
  let linkMode = false;
  let linkFrom = null;
  const linkModeBtn = toolbar.querySelector("[data-link-mode]");
  const linkStatus = toolbar.querySelector("[data-link-mode-status]");
  const setLinkMode = (on) => {
    linkMode = on;
    linkFrom = null;
    if (linkModeBtn) linkModeBtn.classList.toggle("active", on);
    if (linkStatus) linkStatus.textContent = on ? "Tap the first pin…" : "";
    Object.values(pinEls).forEach((el) => el.classList.remove("link-from"));
  };
  if (linkModeBtn) linkModeBtn.addEventListener("click", () => setLinkMode(!linkMode));

  const viewport = document.createElement("div");
  viewport.className = "corkboard-viewport";

  const canvas = document.createElement("div");
  canvas.className = "corkboard-canvas";
  canvas.id = "corkboard-canvas";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "corkboard-string");
  canvas.appendChild(svg);

  // Stage 17 (#4): the board grows to fit however many pins it actually
  // has, instead of a fixed 1100x760 that clipped or crowded pins once
  // there were enough of them — recomputed from every pin's CURRENT
  // position (freshly assigned ones from the grid layout below, or
  // previously dragged ones), with a sensible floor so a small board still
  // fills the viewport.
  const defaults = defaultPinPositions(pinned);
  function resizeCanvasToFit() {
    let maxX = 1000, maxY = 660;
    pinned.forEach((acct) => {
      const pos = pinPositionFor(acct.id, defaults);
      maxX = Math.max(maxX, pos.x + 140);
      maxY = Math.max(maxY, pos.y + 120);
    });
    canvas.style.width = `${maxX}px`;
    canvas.style.height = `${maxY}px`;
    svg.setAttribute("width", String(maxX));
    svg.setAttribute("height", String(maxY));
  }
  resizeCanvasToFit();

  const pinEls = {};
  pinned.forEach((acct) => {
    const pos = pinPositionFor(acct.id, defaults);
    const signals = computeSignals(acct);
    const level = signals.some((s) => s.level === "high") ? "high" : signals.some((s) => s.level === "medium") ? "medium" : "";
    const pin = document.createElement("div");
    pin.className = "corkboard-pin";
    pin.style.left = `${pos.x}px`;
    pin.style.top = `${pos.y}px`;
    const pinNote = pinNoteFor(boardKey, acct.id);
    pin.innerHTML = `
      <div class="corkboard-pin-tack" aria-hidden="true"></div>
      <div class="corkboard-pin-icon ${level}" ${avatarStyleAttr(acct.id)} title="Open profile">${initials(acct.name)}</div>
      <div class="corkboard-pin-label">${acct.name}</div>
      ${pinNote ? `<div class="corkboard-pin-note" data-testid="corkboard-pin-note" title="${escapeHtml(pinNote)}">${escapeHtml(pinNote)}</div>` : ""}
    `;
    pin.setAttribute("data-acct-id", acct.id);
    pin.addEventListener("click", (e) => {
      if (pin.dataset.dragged === "1") {
        pin.dataset.dragged = "0";
        return; // a drag just ended — don't also navigate
      }
      if (linkMode) {
        if (!linkFrom) {
          linkFrom = acct.id;
          pin.classList.add("link-from");
          if (linkStatus) linkStatus.textContent = `${acct.name} — now tap the second pin…`;
          return;
        }
        if (linkFrom === acct.id) return setLinkMode(false); // tapping the same pin again cancels
        const from = linkFrom;
        setLinkMode(false);
        const composer = renderPinLinksPanel(pinned, boardKey, { a: from, b: acct.id });
        wrap.querySelector(".pin-links-panel").replaceWith(composer);
        return;
      }
      if (isActiveWorld) renderProfile(acct.id);
      else showToast(`Switch to this world to open ${acct.name}'s profile.`, "good");
    });
    canvas.appendChild(pin);
    pinEls[acct.id] = pin;

    // --- pin dragging ---
    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    pin.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      dragging = true;
      pin.dataset.dragged = "0";
      pin.classList.add("dragging");
      startX = e.clientX;
      startY = e.clientY;
      startLeft = pos.x;
      startTop = pos.y;
      pin.setPointerCapture(e.pointerId);
    });
    pin.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = (e.clientX - startX) / boardZoom;
      const dy = (e.clientY - startY) / boardZoom;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) pin.dataset.dragged = "1";
      // Stage 31 (#6): pins can't be dragged past the board's top/left edge
      // — the canvas (and the string layer on it) only ever grows right and
      // down, so a pin at a negative position drew its strings off into
      // clipped space, detached from anything visible.
      pos.x = Math.max(0, startLeft + dx);
      pos.y = Math.max(0, startTop + dy);
      pin.style.left = `${pos.x}px`;
      pin.style.top = `${pos.y}px`;
      drawStrings();
      resizeCanvasToFit(); // dragging a pin further out grows the board to keep it visible, never clips it
    });
    pin.addEventListener("pointerup", (e) => {
      dragging = false;
      pin.classList.remove("dragging");
    });
  });

  // Round 28 (#1): the player's own links ride the same string layer as the
  // follow-graph chains — same red yarn, but heavier, with a reason chip
  // pinned at the midpoint (tap it to read it in full or remove the link).
  // Chips are HTML inside the canvas rather than SVG text so they scale
  // and pan with the board and stay tappable.
  const chipLayer = document.createElement("div");
  chipLayer.className = "corkboard-link-layer";
  canvas.appendChild(chipLayer);
  const boardLinks = () => linksFor(boardKey).filter((l) => pinEls[l.a] && pinEls[l.b]);
  const chipEls = {};
  function buildChips() {
    chipLayer.innerHTML = "";
    boardLinks().forEach((l) => {
      const chip = document.createElement("div");
      chip.className = "corkboard-link-chip";
      chip.setAttribute("data-testid", "corkboard-link-chip");
      chip.setAttribute("title", l.reason);
      chip.innerHTML = `<span class="corkboard-link-chip-text">${escapeHtml(l.reason)}</span><button class="corkboard-link-chip-remove" data-testid="corkboard-link-remove" aria-label="Remove link">${ICON.close}</button>`;
      chip.addEventListener("pointerdown", (e) => e.stopPropagation());
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.target.closest(".corkboard-link-chip-remove")) {
          removePinLink(boardKey, l.a, l.b);
          persistNow();
          renderCaseBoard();
          showToast("Link removed from the board.", "good");
          return;
        }
        chip.classList.toggle("open");
      });
      chipLayer.appendChild(chip);
      chipEls[`${l.a}|${l.b}`] = chip;
    });
  }
  buildChips();

  // Stage 31 (#6, bug fix): strings used to be drawn from each pin's
  // top-left plus a hard-coded (23, 5) — an offset left over from an older,
  // narrower pin. The pin is 84px wide with its tack centred, so every
  // string (and every link's reason chip) sat ~19px left of the tack it
  // belonged to; near the board's edges, where a pin next to the edge
  // pulled its string toward the wrong side, it read as a line that had come
  // loose. Anchors now come from the pin's real tack: measured from layout
  // (offsetLeft/offsetTop live in the canvas's own, UNtransformed
  // coordinate space — exactly the space the SVG is drawn in — so zoom and
  // pan can't skew them), falling back to PIN_ANCHOR_X/Y before first
  // layout. The same anchor feeds the lines AND the chips.
  function anchorFor(acctId) {
    const pos = pinPositionFor(acctId, defaults);
    const el = pinEls[acctId];
    const tack = el && el.querySelector(".corkboard-pin-tack");
    if (tack && el.offsetWidth) {
      return { x: pos.x + tack.offsetLeft + tack.offsetWidth / 2, y: pos.y + tack.offsetTop + tack.offsetHeight / 2 };
    }
    return { x: pos.x + PIN_ANCHOR_X, y: pos.y + PIN_ANCHOR_Y };
  }

  function drawStrings() {
    svg.innerHTML = "";
    const drawLine = (pa, pb, cls, width, opacity) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", pa.x);
      line.setAttribute("y1", pa.y);
      line.setAttribute("x2", pb.x);
      line.setAttribute("y2", pb.y);
      line.setAttribute("stroke", "#c81d2b");
      line.setAttribute("stroke-width", width);
      line.setAttribute("opacity", opacity);
      if (cls) line.setAttribute("class", cls);
      svg.appendChild(line);
    };
    pinnedChainPairs(pinned).forEach(([a, b]) => pinEls[a] && pinEls[b] && drawLine(anchorFor(a), anchorFor(b), null, "2", "0.75"));
    boardLinks().forEach((l) => {
      const pa = anchorFor(l.a);
      const pb = anchorFor(l.b);
      drawLine(pa, pb, "corkboard-link-line", "3.5", "0.95");
      const chip = chipEls[`${l.a}|${l.b}`];
      if (chip) {
        chip.style.left = `${(pa.x + pb.x) / 2}px`;
        chip.style.top = `${(pa.y + pb.y) / 2}px`;
      }
    });
  }
  drawStrings();
  // Re-anchor from the real layout once the board is on screen (the first
  // draw above ran before it was attached, on the fallback offsets).
  requestAnimationFrame(() => {
    if (document.body.contains(canvas)) drawStrings();
  });

  viewport.appendChild(canvas);

  function applyTransform() {
    canvas.style.transform = `translate(${boardPanX}px, ${boardPanY}px) scale(${boardZoom})`;
    const readout = toolbar.querySelector("[data-zoom-readout]");
    if (readout) readout.textContent = `${Math.round(boardZoom * 100)}%`;
  }
  applyTransform();

  toolbar.querySelector("[data-zoom-in]").addEventListener("click", () => {
    boardZoom = clampZoom(boardZoom + 0.2);
    applyTransform();
  });
  toolbar.querySelector("[data-zoom-out]").addEventListener("click", () => {
    boardZoom = clampZoom(boardZoom - 0.2);
    applyTransform();
  });

  // --- pan the whole board (drag on empty background, or scroll-to-pan) ---
  let panning = false;
  let panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0;
  viewport.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".corkboard-pin")) return;
    panning = true;
    viewport.classList.add("panning");
    panStartX = e.clientX;
    panStartY = e.clientY;
    panOriginX = boardPanX;
    panOriginY = boardPanY;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!panning) return;
    boardPanX = panOriginX + (e.clientX - panStartX);
    boardPanY = panOriginY + (e.clientY - panStartY);
    applyTransform();
  });
  viewport.addEventListener("pointerup", () => {
    panning = false;
    viewport.classList.remove("panning");
  });
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    boardPanX -= e.deltaX;
    boardPanY -= e.deltaY;
    applyTransform();
  }, { passive: false });

  wrap.appendChild(toolbar);
  wrap.appendChild(viewport);
  wrap.appendChild(renderPinLinksPanel(pinned, boardKey));
  wrap.appendChild(renderPinNotesPanel(pinned, boardKey));
  return wrap;
}

// Round 27 (#6): the map view's own place to read and edit every pin's
// note (the corkboard itself only has room for a short snippet under each
// pin, and a pin tap opens the profile). Re-renders the board on change so
// the snippet on the cork updates too.
function renderPinNotesPanel(pinned, boardKey) {
  const panel = document.createElement("div");
  panel.className = "investigate-panel pin-notes-panel";
  panel.style.margin = "0 18px 12px";
  const withNotes = pinned.filter((a) => pinNoteFor(boardKey, a.id)).length;
  panel.innerHTML = `<h4>${ICON.note} Investigator's notes (${withNotes}/${pinned.length})</h4>`;
  pinned.forEach((acct) => {
    const row = document.createElement("div");
    row.className = "pin-notes-row";
    row.innerHTML = `<div class="pin-notes-name">${escapeHtml(acct.name)} <span style="color:var(--grey); font-weight:400;">${escapeHtml(acct.handle)}</span></div>`;
    row.appendChild(renderPinNoteEditor(boardKey, acct, { variant: "board", onChange: () => renderCaseBoard() }));
    panel.appendChild(row);
  });
  return panel;
}

// Stage 13: the Case Board's missing half from the doc's follow-up
// brainstorm (point C) — an EVIDENCE/CONFIDENCE aggregate readout, and
// the relationship chains BETWEEN pinned accounts rather than just their
// individual signals side by side. Deliberately built from data already
// on screen (each account's own `following` list) rather than a new
// relationship layer — the doc's ASCII mockup shows exactly this shape:
// accounts connected by lines, with an evidence count and a confidence
// verdict above them.
// Shared by the EVIDENCE readout text and the corkboard's red-string
// overlay: unique, undirected pairs of pinned account ids that share a
// follow-relation, so both views agree on exactly which pins are linked.
function pinnedChainPairs(pinned) {
  const pinnedIdSet = new Set(pinned.map((a) => a.id));
  const seen = new Set();
  const pairs = [];
  pinned.forEach((acct) => {
    (acct.following || []).forEach((fid) => {
      if (pinnedIdSet.has(fid) && fid !== acct.id) {
        const key = [acct.id, fid].sort().join("|");
        if (seen.has(key)) return;
        seen.add(key);
        pairs.push([acct.id, fid]);
      }
    });
  });
  return pairs;
}

function renderCaseBoardEvidence(pinned, boardKey) {
  const wrap = document.createElement("div");
  wrap.className = "investigate-panel";
  wrap.style.margin = "0 18px 12px";

  let highCount = 0;
  let mediumCount = 0;
  pinned.forEach((acct) => {
    computeSignals(acct).forEach((s) => {
      if (s.level === "high") highCount++;
      else if (s.level === "medium") mediumCount++;
    });
  });
  let confidence = "UNRESOLVED";
  let confColor = "var(--grey)";
  if (highCount >= 3) {
    confidence = "STRONG";
    confColor = "var(--red)";
  } else if (highCount >= 1 || mediumCount >= 4) {
    confidence = "MODERATE";
    confColor = "var(--amber)";
  }

  // Bug fix (Round 28): names used to be resolved with accountById(), which
  // only searches the LIVE world — so viewing the other world's board tab
  // (e.g. the Mission tab from Home) with two pins that follow each other
  // threw on `a.name` and left the Case Board blank. The board already has
  // the right account objects in hand: `pinned`.
  const byId = new Map(pinned.map((a) => [a.id, a]));
  const nameOf = (id) => (byId.get(id) ? escapeHtml(byId.get(id).name) : "an unpinned account");
  const chains = pinnedChainPairs(pinned).map(([aId, bId]) => `${nameOf(aId)} → connected to → ${nameOf(bId)}`);
  // Round 28 (#1): the player's own argument, beside what the follow graph
  // shows on its own.
  const links = linksFor(boardKey).filter((l) => byId.has(l.a) && byId.has(l.b));

  wrap.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-family:'Space Grotesk',monospace; font-size:12px; letter-spacing:0.04em;">
      <span style="color:var(--grey);">EVIDENCE: <span style="color:var(--white);">${highCount + mediumCount}</span> signals (${highCount} high)${links.length ? ` · ${links.length} link${links.length === 1 ? "" : "s"} drawn` : ""}</span>
      <span style="color:${confColor};">CONFIDENCE: ${confidence}</span>
    </div>
    <div style="margin-top:10px; font-size:13px; line-height:1.7;">
      ${
        chains.length
          ? chains.map((c) => `<div>${ICON.link} ${c}</div>`).join("")
          : `<div style="color:var(--grey);">No direct connections found among pinned accounts yet — check each profile's Connections panel and pin who they lead to.</div>`
      }
      ${links.map((l) => `<div class="evidence-link-line" data-testid="evidence-link-line">${ICON.pen} ${nameOf(l.a)} — <i>${escapeHtml(l.reason)}</i> — ${nameOf(l.b)}</div>`).join("")}
    </div>
  `;
  return wrap;
}

// Round 28 (#1): the board's list of the player's own evidence links, and
// the composer that makes them — used by both views (the map view also lets
// you pick the two ends by tapping pins in "Link pins" mode, which just
// pre-fills this composer). `pre` = { a, b } to pre-select two pins.
function renderPinLinksPanel(pinned, boardKey, pre) {
  pre = pre || {};
  const panel = document.createElement("div");
  panel.className = "investigate-panel pin-links-panel";
  panel.style.margin = "0 18px 12px";
  panel.setAttribute("data-testid", "pin-links-panel");
  const byId = new Map(pinned.map((a) => [a.id, a]));
  const links = linksFor(boardKey).filter((l) => byId.has(l.a) && byId.has(l.b));
  const options = (selected) =>
    pinned.map((a) => `<option value="${a.id}"${a.id === selected ? " selected" : ""}>${escapeHtml(a.name)}</option>`).join("");
  const canLink = pinned.length >= 2;
  panel.innerHTML = `
    <h4>${ICON.link} Evidence links (${links.length})</h4>
    <div style="font-size:12px; color:var(--grey); margin-bottom:8px;">Draw a line between two pins and say why they belong together. The follow graph draws its own thin string; these are your argument.</div>
    <div class="pin-links-list">
      ${
        links.length
          ? links
              .map(
                (l) => `<div class="signal-row pin-link-row" data-testid="pin-link-row" data-a="${l.a}" data-b="${l.b}"><span>${escapeHtml(byId.get(l.a).name)} ↔ ${escapeHtml(byId.get(l.b).name)} <span class="pin-link-reason">${escapeHtml(l.reason)}</span></span><button class="pin-note-btn subtle" data-link-remove data-testid="pin-link-remove">Remove</button></div>`
              )
              .join("")
          : `<div style="font-size:12.5px; color:var(--grey);">No links yet.</div>`
      }
    </div>
    ${
      canLink
        ? `<div class="pin-link-composer" data-testid="pin-link-composer">
      <div class="pin-link-selects">
        <select data-link-a aria-label="First pin">${options(pre.a || pinned[0].id)}</select>
        <span>↔</span>
        <select data-link-b aria-label="Second pin">${options(pre.b || pinned[1].id)}</select>
      </div>
      <div class="pin-link-reasons">
        ${LINK_REASONS.map((r, i) => `<button class="pin-link-reason-chip${i === 0 ? " on" : ""}" data-reason="${escapeHtml(r)}">${escapeHtml(r)}</button>`).join("")}
        <button class="pin-link-reason-chip" data-reason-custom>Custom…</button>
      </div>
      <input type="text" class="pin-link-custom" data-link-custom maxlength="${LINK_CUSTOM_MAX}" placeholder="Your reason, in a few words" style="display:none;" />
      <div class="pin-note-row"><span class="pin-note-count" data-link-status></span><span class="pin-note-actions"><button class="pin-note-btn primary" data-link-add data-testid="pin-link-add">Add link</button></span></div>
    </div>`
        : `<div style="font-size:12px; color:var(--grey); margin-top:6px;">Pin at least two accounts to link them.</div>`
    }
  `;
  panel.addEventListener("pointerdown", (e) => e.stopPropagation());
  panel.querySelectorAll("[data-link-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".pin-link-row");
      removePinLink(boardKey, row.getAttribute("data-a"), row.getAttribute("data-b"));
      persistNow();
      renderCaseBoard();
      showToast("Link removed from the board.", "good");
    });
  });
  if (!canLink) return panel;
  let reason = LINK_REASONS[0];
  let custom = false;
  const customInput = panel.querySelector("[data-link-custom]");
  panel.querySelectorAll(".pin-link-reason-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      panel.querySelectorAll(".pin-link-reason-chip").forEach((c) => c.classList.remove("on"));
      chip.classList.add("on");
      custom = chip.hasAttribute("data-reason-custom");
      reason = custom ? "" : chip.getAttribute("data-reason");
      customInput.style.display = custom ? "block" : "none";
      if (custom) customInput.focus();
    });
  });
  panel.querySelector("[data-link-add]").addEventListener("click", () => {
    const a = panel.querySelector("[data-link-a]").value;
    const b = panel.querySelector("[data-link-b]").value;
    const text = custom ? customInput.value : reason;
    const status = panel.querySelector("[data-link-status]");
    if (a === b) return (status.textContent = "Pick two different pins.");
    if (!String(text || "").trim()) return (status.textContent = "Give the link a reason.");
    addPinLink(boardKey, a, b, text, custom);
    persistNow();
    renderCaseBoard();
    showToast(`Linked ${byId.get(a).name} and ${byId.get(b).name}: ${String(text).trim()}.`, "good");
  });
  if (pre.a && pre.b) requestAnimationFrame(() => panel.scrollIntoView({ block: "center" }));
  return panel;
}

// Stage 15 lead trigger (b): a structural discovery — finding, via this
// panel, a connection between two suspicious/HIGH-signal accounts.
// Independent of the flag trigger, not a follow-up to it; whether the
// player pursues the lead further afterward is entirely their call.
function checkConnectionLead(acct, related) {
  const acctHigh = computeSignals(acct).some((s) => s.level === "high");
  if (!acctHigh) return;
  related.forEach((other) => {
    if (!other || other.id === acct.id) return;
    const otherHigh = computeSignals(other).some((s) => s.level === "high");
    if (!otherHigh) return;
    const lead = LEADS.addLead("connection", [acct.id, other.id]);
    if (lead) {
      notifications = [{ id: `${lead.id}-notif`, text: `New lead opened: a connection between ${acct.name} and ${other.name} — both reading high-confidence on their own.`, at: Date.now(), target: { type: "profile", acctId: acct.id } }, ...notifications];
      showToast(`New lead opened — ${acct.name} and ${other.name} are connected, and both look suspicious.`, "good", { type: "profile", acctId: other.id });
    }
  });
  persistNow();
}

// Item 8: who this account has @tagged in its own posts, and who has
// tagged THIS account elsewhere — a network signal from post content
// rather than the follow graph, surfaced in the same Connections panel
// used for follow/mutual data (and the bait Analytics screen's own
// mutual-connection highlighting draws on this same following/followedBy
// shape, so mentions are visible everywhere that signal already is).
function taggedByAccount(acctId) {
  const acct = accountById(acctId);
  if (!acct) return [];
  const ids = new Set((acct.posts || []).filter((p) => p.mentionsAcctId).map((p) => p.mentionsAcctId));
  return [...ids].map(accountById).filter(Boolean);
}

function taggedAccount(acctId) {
  return accounts.filter((a) => (a.posts || []).some((p) => p.mentionsAcctId === acctId));
}

// Round 27 (#7): the same tag relationships as taggedByAccount/
// taggedAccount above, indexed once per world instead of re-scanning every
// post of every account for every post rendered (Home's roster keeps
// growing with infinite scroll). acctId -> { out: Set, in: Set }. Mentions
// only ever come from worldgen's mention pass, so the index only needs
// rebuilding when the roster itself changes — the signature below.
let mentionIdxCache = null;
let mentionIdxSig = "";
function mentionIndex() {
  const sig = `${pinKeyFor(currentWorld)}|${accounts.length}|${accounts.length ? accounts[accounts.length - 1].id : ""}`;
  if (mentionIdxCache && sig === mentionIdxSig) return mentionIdxCache;
  const idx = new Map();
  const entry = (id) => idx.get(id) || idx.set(id, { out: new Set(), in: new Set() }).get(id);
  accounts.forEach((a) => {
    (a.posts || []).forEach((p) => {
      if (!p.mentionsAcctId || p.mentionsAcctId === a.id) return;
      entry(a.id).out.add(p.mentionsAcctId);
      entry(p.mentionsAcctId).in.add(a.id);
    });
  });
  mentionIdxCache = idx;
  mentionIdxSig = sig;
  return idx;
}

// Most accounts tag or get tagged by SOMEONE (worldgen tags ~20% of posts),
// so a badge on every one of them would just be noise. It only appears for
// an author whose tag network is genuinely busy — three or more distinct
// accounts on either side of a tag, or a reciprocal pair (they tag someone
// who also tags them) — roughly a quarter of accounts, and exactly the
// shape worth a look in Connections. Neutral on purpose: real friends tag
// each other back too.
function networkBadgeInfo(acctId) {
  const links = mentionIndex().get(acctId);
  if (!links) return null;
  const linked = new Set([...links.out, ...links.in]);
  const reciprocal = [...links.out].filter((id) => links.in.has(id)).length;
  if (linked.size < 3 && !reciprocal) return null;
  return { linked: linked.size, tags: links.out.size, taggedBy: links.in.size, reciprocal };
}

function renderConnectionsPanel(acct) {
  const following = (acct.following || []).map(accountById).filter(Boolean);
  const followedBy = followersOf(acct.id);
  checkConnectionLead(acct, [...following, ...followedBy]);
  const tags = taggedByAccount(acct.id);
  const taggedBy = taggedAccount(acct.id);
  const panel = document.createElement("div");
  panel.className = "investigate-panel connections-panel";
  const renderList = (list) =>
    list.length
      ? list
          .map(
            (a) => `<div class="signal-row" data-nav="${a.id}" style="cursor:pointer;"><span>${a.name}</span><span style="color:var(--grey);">${a.handle}</span></div>`
          )
          .join("")
      : `<div class="signal-row"><span style="color:var(--grey);">None visible</span></div>`;
  panel.innerHTML = `
    <h4>Connections</h4>
    <div style="font-size:12px; color:var(--grey); margin-bottom:6px;">Following (${following.length})</div>
    ${renderList(following)}
    <div style="font-size:12px; color:var(--grey); margin:12px 0 6px;">Followed by, among visible accounts (${followedBy.length})</div>
    ${renderList(followedBy)}
    ${
      tags.length || taggedBy.length
        ? `<div class="connections-tags" data-testid="connections-tags"><div style="font-size:12px; color:var(--grey); margin:12px 0 6px;">Tags in their posts (${tags.length})</div>
    ${renderList(tags)}
    <div style="font-size:12px; color:var(--grey); margin:12px 0 6px;">Tagged by others (${taggedBy.length})</div>
    ${renderList(taggedBy)}</div>`
        : ""
    }
  `;
  panel.querySelectorAll("[data-nav]").forEach((row) => {
    row.addEventListener("click", () => {
      // Round 30 (#3): following a connection is what "checked
      // Connections" means to the case nudge — the panel opening beside
      // Investigate on its own doesn't count as having used it.
      if (currentWorld.kind === "case" && recordCaseAction("connections", acct.id)) persistNow();
      renderProfile(row.getAttribute("data-nav"));
    });
  });
  return panel;
}

function renderPaperTrailPanel() {
  const panel = document.createElement("div");
  panel.className = "investigate-panel";
  panel.style.margin = "0 18px 12px";
  panel.setAttribute("data-testid", "paper-trail");
  const rows = [];
  rows.push(
    `<div class="signal-row"><span>Terms of Service</span><span class="signal-level ${gameState.termsRushed ? "high" : "low"}">${gameState.termsRushed ? "skimmed, accepted anyway" : "read before accepting"}</span></div>`
  );
  const sg = gameState.securityGotcha;
  if (sg && sg.outcome !== "pending") {
    const tone = sg.outcome === "recognised" ? "low" : sg.outcome === "disowned" ? "medium" : "high";
    rows.push(`<div class="signal-row" data-testid="paper-trail-security"><span>Security re-verification</span><span class="signal-level ${tone}" style="text-align:right;">${escapeHtml(sg.trace || sg.outcome)}</span></div>`);
  }
  const failed = Object.entries(gameState.failedCaseAttempts || {});
  if (failed.length) {
    const total = failed.reduce((n, [, e]) => n + (e.count || 0), 0);
    const names = failed.map(([id]) => window.SKRAPERS_CASES.getCase(id).name).join(", ");
    rows.push(`<div class="signal-row" data-testid="paper-trail-failures"><span>Case files pulled for review</span><span class="signal-level high" style="text-align:right;">${total} (${escapeHtml(names)})</span></div>`);
  }
  // Round 29 (#5/#6): every settled second opinion — ALGO//'s pre-flags
  // (and how often the player has proven the platform wrong) and
  // Halloway's public calls.
  const hist = gameState.secondOpinionHistory || [];
  const pre = hist.filter((h) => h.type === "preflag");
  if (pre.length) {
    const n = (o) => pre.filter((h) => h.outcome === o).length;
    const overturned = n("overturned");
    rows.push(
      `<div class="signal-row" data-testid="paper-trail-preflags"><span>ALGO// pre-flags you answered</span><span class="signal-level ${overturned ? "low" : "medium"}" style="text-align:right;">${overturned} overturned · ${n("confirmed")} confirmed · ${n("followed-wrong")} followed onto a real person · ${n("stood")} left standing · ${n("contest-failed")} contested wrongly</span></div>`
    );
  }
  const rivalH = hist.filter((h) => h.type === "rival");
  if (rivalH.length) {
    const sided = rivalH.filter((h) => h.stance);
    const good = sided.filter((h) => (h.stance === "agree") === !!h.correct).length;
    rows.push(`<div class="signal-row" data-testid="paper-trail-rival"><span>Halloway's public calls</span><span class="signal-level low" style="text-align:right;">${rivalH.filter((h) => h.correct).length} of ${rivalH.length} right · you took the right side ${good} of ${sided.length} times</span></div>`);
  }
  panel.innerHTML = `
    <h4>${ICON.book} PAPER TRAIL</h4>
    <div style="font-size:12px; color:var(--grey); margin-bottom:8px;">The times ALGO// tested you instead. It keeps these.</div>
    ${rows.join("")}
  `;
  return panel;
}

// Stage 13: "What ALGO// knows about you" — the doc's Player Profile idea
// (sections 20, 39) made visible rather than left as backend-only
// tracking. Surfaces exactly the stats game/algo.js has been collecting
// since Stage 9, plus the newer reputation/atmosphere numbers, framed as
// ALGO//'s own dossier on the player rather than a stats screen.
function renderPlayerProfile() {
  currentView = "player-profile";
  trackScreen(renderPlayerProfile, "player-profile");
  detachHomeScrollHandler();
  app.innerHTML = "";
  applyPhaseClass();
  // Bug fix (real Back button): used to hardcode renderFeed(true) — see
  // renderProfile's comment above.
  const topbar = renderTopbarStack(`<button class="back-btn">${ICON.chevronLeft} Back</button>`, false);
  topbar.querySelector(".back-btn").addEventListener("click", () => goBack());
  app.appendChild(topbar);

  // Round 23 (#2a): the player's currently-active bait status, shown
  // prominently at the very top of their own profile, above the ALGO//
  // dossier and everything else — it's the player's own post history now
  // (see game/bait.js — postBait attributes it to a real "__player__"
  // account and it also lives in the ordinary Home feed, sorted by
  // timestamp like any other post; this is just the convenient "your own
  // posts" view of the same data).
  app.appendChild(renderPlayerStatusPanel());

  const algo = window.SKRAPERS_ALGO;
  const rep = window.SKRAPERS_REPUTATION.rep;
  const phase = currentPhase();
  const phaseLabel = window.SKRAPERS_ATMOSPHERE.PHASE_LABELS[phase];
  const acc = algo.accuracy();
  const catches = Object.entries(algo.profile.archetypeCatches);

  const panel = document.createElement("div");
  panel.className = "investigate-panel";
  panel.style.margin = "12px 18px";
  // Stage 33: the icon key, one tap away on the player's own profile too
  // (the opening tour's Profile stop points at it).
  panel.innerHTML = `
    <div class="player-profile-head">
      <h4>ALGO// PLAYER PROFILE</h4>
      <button class="icon-btn icon-btn-subtle" data-action="icon-key" data-testid="player-icon-key-btn" title="What do these icons mean?" aria-label="Icon key">${ICON.help}</button>
    </div>
    <div style="font-family:'Space Grotesk',monospace; font-size:12px; letter-spacing:0.02em; color:var(--grey); font-style:italic; margin:-4px 0 12px;">"${PLAYER_BIO}"</div>
    <div style="font-size:13.5px; line-height:1.6; margin-bottom:12px;">This is what ALGO// has built from watching you — not just what you've done, but what it says you tend toward. Nothing here is hidden from you. That's deliberate.</div>
    <div class="signal-row"><span>ALGO// standing</span><span class="signal-level ${gameState.credibility < 60 ? "high" : gameState.credibility < 85 ? "medium" : "low"}">${gameState.credibility}%</span></div>
    <div class="signal-row"><span>Community trust</span><span class="signal-level ${rep.communityTrust < 60 ? "high" : rep.communityTrust < 85 ? "medium" : "low"}">${rep.communityTrust}%</span></div>
    <div class="signal-row"><span>Investigation accuracy <span style="color:var(--grey); font-weight:400; font-size:11.5px;">(lucky calls count half)</span></span><span class="signal-level low" data-testid="profile-accuracy">${acc !== null ? Math.round(acc * 100) + "%" : "no flags yet"}</span></div>
    <div class="signal-row" data-testid="profile-report-quality"><span>Case flags argued from real evidence</span><span class="signal-level low">${algo.profile.cleanCatches || 0} clean / ${algo.profile.luckyCatches || 0} lucky</span></div>
    <div class="signal-row"><span>Investigations opened</span><span class="signal-level low">${algo.profile.investigations}</span></div>
    <div class="signal-row"><span>Correct / wrong flags</span><span class="signal-level low">${algo.profile.correctFlags} / ${algo.profile.wrongFlags}</span></div>
    <div class="signal-row"><span>Dominant signal you rely on</span><span class="signal-level low">${algo.dominantSignal() || "none yet"}</span></div>
    <div class="signal-row"><span>Platform atmosphere</span><span class="signal-level ${phase >= 3 ? "high" : phase >= 1 ? "medium" : "low"}">${phaseLabel}</span></div>
    <div class="signal-row"><span>Open leads</span><span class="signal-level low">${window.SKRAPERS_LEADS.openLeadsCount()}</span></div>
  `;
  panel.querySelector('[data-action="icon-key"]').addEventListener("click", () => renderIconLegend());
  app.appendChild(panel);

  // Round 27 (#2/#4): the paper trail — the lasting, visible trace of the
  // moments the platform tested the player rather than the other way
  // round: how they handled the Terms of Service on the way in
  // (termsRushed), the later "unusual sign-in" re-verification (only once
  // it has actually happened — listing it beforehand would spoil it), and
  // any case file pulled from them for wrongful flags.
  app.appendChild(renderPaperTrailPanel());

  // Feature round (#1b): every account the player has correctly and
  // formally flagged — a standing achievement list that survives switching
  // between Home/Daily/Story (see game/state.js's removedBots), not
  // whichever world happens to be loaded right now.
  const removed = gameState.removedBots || [];
  const removedPanel = document.createElement("div");
  removedPanel.className = "investigate-panel";
  removedPanel.style.margin = "0 18px 12px";
  removedPanel.innerHTML = `
    <h4>${ICON.shield} SUCCESSFUL BOTS REMOVED (${removed.length})</h4>
    <div style="font-size:12px; color:var(--grey); margin-bottom:8px;">Every account you've formally flagged and gotten right, across every case and every Home you've played.</div>
  `;
  if (removed.length === 0) {
    removedPanel.innerHTML += `<div style="font-size:12.5px; color:var(--grey);">None yet — formally flag a real Skraper from the Case Board.</div>`;
  } else {
    removed.slice(0, 20).forEach((r) => {
      const row = document.createElement("div");
      row.className = "signal-row";
      const stillLoaded = !!accountById(r.acctId);
      row.style.cursor = stillLoaded ? "pointer" : "default";
      row.innerHTML = `<span>${r.name} <span style="color:var(--grey); font-weight:400;">${r.handle || ""}</span></span><span style="color:var(--grey); font-weight:400;">${stillLoaded ? "view →" : "suspended"}</span>`;
      if (stillLoaded) row.addEventListener("click", () => renderProfile(r.acctId));
      removedPanel.appendChild(row);
    });
  }
  app.appendChild(removedPanel);

  // Stage 17 (flag rework): the player's own red-flagged ("suspicious")
  // posts, shown first/prominently — this is the shortlist the doc's
  // "see the posts you've flagged on your profile first, then add to
  // pinboard for investigation" flow is built around. Each entry can be
  // pinned straight to the Case Board from here.
  const redIds = flaggedPostIds("red");
  const flagPanel = document.createElement("div");
  flagPanel.className = "investigate-panel";
  flagPanel.style.margin = "0 18px 12px";
  flagPanel.innerHTML = `
    <h4>${ICON.pin} YOUR FLAGGED POSTS (${redIds.length})</h4>
    <div style="font-size:12px; color:var(--grey); margin-bottom:8px;">Posts you've attached a pin on. Attaching a pin already puts the account on your Case Board — come back here for the history.</div>
  `;
  if (redIds.length === 0) {
    flagPanel.innerHTML += `<div style="font-size:12.5px; color:var(--grey);">Nothing flagged yet — use the Attach Pin icon on any post.</div>`;
  } else {
    redIds.slice(0, 20).forEach((postId) => {
      const found = findPostById(postId);
      if (!found) return;
      const row = document.createElement("div");
      row.className = "signal-row";
      row.style.cursor = "pointer";
      const count = redFlagCount(postId);
      row.innerHTML = `<span>${found.acct.name}${count > 1 ? ` <span style="color:var(--red);">×${count}</span>` : ""}</span><span style="color:var(--grey); font-weight:400;">${pinnedIds.has(found.acct.id) ? `${ICON.pin} on board` : "pin →"}</span>`;
      row.addEventListener("click", () => {
        if (!pinnedIds.has(found.acct.id)) {
          pinnedIds.add(found.acct.id);
          if (!found.acct.isSkraper) window.SKRAPERS_TRUST.pin(found.acct.id);
          persistNow();
          showToast(`${found.acct.name} pinned to the Case Board.`, "good", { type: "board" });
          renderPlayerProfile();
        } else {
          renderProfile(found.acct.id);
        }
      });
      flagPanel.appendChild(row);
    });
  }
  app.appendChild(flagPanel);

  // Trusted (green-flagged) posts — a shorter list, same personal-marker
  // spirit, no investigation workflow attached.
  const greenIds = flaggedPostIds("green");
  if (greenIds.length > 0) {
    const trustPanel = document.createElement("div");
    trustPanel.className = "investigate-panel";
    trustPanel.style.margin = "0 18px 12px";
    trustPanel.innerHTML = `<h4>${ICON.authentic} TRUSTED (${greenIds.length})</h4>`;
    greenIds.slice(0, 10).forEach((postId) => {
      const found = findPostById(postId);
      if (!found) return;
      const row = document.createElement("div");
      row.className = "signal-row";
      row.style.cursor = "pointer";
      row.innerHTML = `<span>${found.acct.name}</span><span style="color:var(--grey); font-weight:400;">view →</span>`;
      row.addEventListener("click", () => renderProfile(found.acct.id));
      trustPanel.appendChild(row);
    });
    app.appendChild(trustPanel);
  }

  // Item 9: Case Load is reached from the Home screen now (the button row
  // under the composer), not from here or the settings menu — see
  // renderFeed's renderHomeTabsRow.
  // Stage 31 (#1): the "New investigation" button that used to sit here —
  // one tap, no warning, and it wiped the whole save — is gone. The same
  // action now lives only in Settings ("Start a new investigation"), behind
  // the same erase-everything confirmation Log out uses.

  if (catches.length) {
    const catchPanel = document.createElement("div");
    catchPanel.className = "investigate-panel";
    catchPanel.style.margin = "0 18px 12px";
    catchPanel.innerHTML = `
      <h4>ARCHETYPES YOU'VE LEARNED TO SPOT</h4>
      <div style="font-size:12.5px; color:var(--grey); margin-bottom:8px;">Every one of these has started adapting to you specifically — see the atmosphere note below.</div>
      ${catches.map(([key, n]) => `<div class="signal-row"><span>${key}</span><span class="signal-level low">${n} caught</span></div>`).join("")}
    `;
    app.appendChild(catchPanel);
  }

  const note = document.createElement("div");
  note.className = "empty-state";
  note.style.textAlign = "left";
  note.style.padding = "0 18px 30px";
  note.textContent = "ALGO// doesn't just watch the accounts you investigate. It watches how you investigate them, and it adjusts what you'll see next accordingly — the same recommendation logic it uses on everyone else.";
  app.appendChild(note);
  app.appendChild(renderBottomNav("profile"));
}

// Stage 15: Cases/Story — the 7 authored cases (game/cases.js). Bug fix:
// this comment used to say "reached only via the button inside
// renderPlayerProfile()" — stale since Item 9 moved Case Load off the
// profile menu entirely onto the "Case Load" button under Home's composer
// (renderHomeTabsRow/goStory). Confirmed there is no leftover entry point
// left behind in renderPlayerProfile() — goStory()/renderHomeTabsRow() is
// the one real entry point, not the bottom nav either.
// Item 12: Case Load now shows exactly ONE case at a time — either the
// one still loaded and just cleared (tick + "Clear & continue"), or the
// next uncompleted one in order (7 authored, then procedurally generated
// case008+ forever — see game/cases.js's nextCaseId/getCase). The room
// freed up by not listing all seven/all-forever cases at once goes to
// real tips and an expanded briefing for whichever case is showing.
function renderStory() {
  currentView = "story";
  trackScreen(renderStory, "story");
  detachHomeScrollHandler();
  app.innerHTML = "";
  applyPhaseClass();
  // Bug fix (real Back button): this used to hardcode goHome(), which
  // unconditionally abandoned whatever case was active and forced Home
  // regardless of where the player actually came from — very likely the
  // literal "exits the case, takes back to main feed" bug report. Now pops
  // the real navigation history like every other screen's Back button.
  const topbar = renderTopbarStack(`<button class="back-btn">${ICON.chevronLeft} Back</button>`, false);
  topbar.querySelector(".back-btn").addEventListener("click", () => goBack());
  app.appendChild(topbar);

  const completed = gameState.completedCases || [];
  const justCleared = currentWorld.kind === "case" && isCaseCompleted(currentWorld.caseId) ? currentWorld.caseId : null;
  const showId = justCleared || window.SKRAPERS_CASES.nextCaseId(completed);
  const c = window.SKRAPERS_CASES.getCase(showId);
  // Hot-swap fix: a case that's been hot-swapped away (Main Feed button)
  // still has a live snapshot in worldSnapshots, not just currentWorld
  // literally pointing at it — either one means "in progress", so Continue
  // (which resumes via loadCase()'s snapshot-restore path) shows instead of
  // Open case, and clicking it doesn't lose the case's progress to a fresh
  // rebuild.
  const isCurrent = (currentWorld.kind === "case" && currentWorld.caseId === c.id) || !!worldSnapshots[`case:${c.id}`];
  // Round 27 (#2): failure record and review limit for the case on show.
  // The limit depends on the roster size, so it's read from whichever copy
  // of this case exists — live, hot-swapped away, or (deterministically,
  // see game/cases.js's seededBuild) a throwaway preview build.
  const failures = caseFailureCount(c.id);
  const failRecord = gameState.failedCaseAttempts[c.id];
  const liveCount =
    currentWorld.kind === "case" && currentWorld.caseId === c.id
      ? currentWorld.accountCount
      : worldSnapshots[`case:${c.id}`]
      ? worldSnapshots[`case:${c.id}`].accounts.length
      : c.build().length;
  const reviewLimit = wrongFlagLimitFor(liveCount, c.id);
  const liveStrikes = currentWorld.kind === "case" && currentWorld.caseId === c.id ? wrongfulFlagCount() : worldSnapshots[`case:${c.id}`] ? Object.values(worldSnapshots[`case:${c.id}`].flagged || {}).filter((f) => !f.correct).length : 0;
  // Round 28 (#2): the same derivation for deep pulls — live world, or the
  // hot-swapped-away snapshot (goStory() snapshots before showing this, so
  // for the case just left the snapshot IS the live state).
  const pullLimit = deepPullLimitFor(liveCount);
  const caseSnap = worldSnapshots[`case:${c.id}`];
  const livePullsUsed = caseSnap
    ? Object.keys(caseSnap.deepInvestigated || {}).length + (caseSnap.caseHints || []).length
    : currentWorld.kind === "case" && currentWorld.caseId === c.id
    ? deepPullsUsed()
    : 0;

  const header = document.createElement("div");
  header.className = "investigate-panel";
  header.style.margin = "12px 18px";
  header.innerHTML = `
    <h4>M.A.I. CASE LOAD</h4>
    <div style="font-size:13px; line-height:1.5;">One case loaded at a time. Clear it to make room for the next — the files don't run out: past M.A.I.'s seven training files, ALGO// keeps opening harder ones.</div>
    <div style="font-size:11.5px; color:var(--grey); margin-top:8px;">${completed.length} case${completed.length === 1 ? "" : "s"} cleared so far.</div>
  `;
  app.appendChild(header);

  const card = document.createElement("div");
  card.className = "investigate-panel";
  card.style.margin = "0 18px 12px";
  if (failures > 0 && !justCleared) card.classList.add("case-card-failed");
  card.setAttribute("data-testid", "case-card");
  card.setAttribute("data-case-id", c.id);
  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
      <div>
        <div style="font-weight:600;">${c.name}${justCleared ? ` ${ICON.check}` : ""}</div>
        <div style="font-size:12px; color:var(--grey);">${c.difficulty}</div>
      </div>
      ${
        justCleared
          ? `<button class="investigate-btn" data-action="clear-continue" style="margin-top:0; font-size:13px; padding:8px 12px;">Clear &amp; continue</button>`
          : `<button class="investigate-btn" data-action="open" style="margin-top:0; font-size:13px; padding:8px 12px;">${isCurrent ? "Continue" : failures > 0 ? `${ICON.refresh} Retry case` : "Open case"}</button>`
      }
    </div>
    ${
      failures > 0 && !justCleared && !isCurrent
        ? `<div class="case-failed-badge" data-testid="case-failed-badge">${ICON.warning} <span><b>Pulled for review${failures > 1 ? ` ×${failures}` : ""}.</b> Your last attempt ended after ${failRecord.lastStrikes} wrongful flags. The file has been rebuilt from its original evidence — same accounts, clean slate.</span></div>`
        : ""
    }
    <div class="case-review-limit">${ICON.shield} Review limit: ${reviewLimit} wrongful formal flags per attempt${isCurrent && liveStrikes ? ` — <b>${liveStrikes} used</b>` : ""}${failures > 0 && justCleared ? ` · cleared after ${failures} failed attempt${failures === 1 ? "" : "s"}` : ""}.</div>
    ${justCleared ? "" : `<div class="case-review-limit" data-testid="case-card-pulls">${ICON.scan} Deep investigations: ${isCurrent ? `<b>${Math.max(0, pullLimit - livePullsUsed)} of ${pullLimit} left</b> in this attempt` : `${pullLimit} per attempt`} — hints are paid from the same budget.</div>`}
    ${justCleared ? caseRecordHtml(gameState.caseRecords && gameState.caseRecords[c.id]) : ""}
    <div style="margin-top:8px; font-size:13px; line-height:1.5;">${c.briefing}</div>
    ${!justCleared && c.marketplace && c.marketplace.briefing ? `<div class="case-review-limit case-market-hook" data-testid="case-card-market">${ICON.market} <span>${escapeHtml(c.marketplace.briefing)}</span></div>` : ""}
    ${c.extendedBriefing ? `<div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(83,100,113,0.15); font-size:12.5px; line-height:1.55; color:var(--grey);">${c.extendedBriefing}</div>` : ""}
  `;
  const openBtn = card.querySelector('[data-action="open"]');
  if (openBtn) openBtn.addEventListener("click", () => loadCase(c.id));
  const clearBtn = card.querySelector('[data-action="clear-continue"]');
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      // "Clear & continue" has to actually leave the completed case's
      // world, not just re-render this screen — renderStory's own
      // justCleared check is keyed off currentWorld still pointing at that
      // case, so without a real world switch it would keep showing the
      // same cleared case forever instead of advancing. Home is the
      // natural place to land (same as finishing any case normally would),
      // and nextCaseId() then resolves straight past it on the way back in.
      goHome();
      // Round 27: a cleared case is finished — drop the snapshot goHome()
      // just took of it instead of carrying a full roster (up to 140
      // accounts) in every save forever; localStorage has a quota, and a
      // save that silently fails to write loses real progress. Its pins
      // stay, and the Case Board's Mission tab rebuilds the (now
      // deterministic) case from its id to show them.
      delete worldSnapshots[`case:${c.id}`];
      persistNow();
      renderStory();
    });
  }
  app.appendChild(card);

  // Round 30 (#6): a tip about a system Simplified Mode has switched off
  // (Case 007's warning about ALGO//'s pre-flag) would describe something
  // the player won't see.
  const tips = (c.tips || []).filter((t) => !(simplifiedMode() && /pre-?flag|already flagged/i.test(t)));
  if (tips.length) {
    const tipsPanel = document.createElement("div");
    tipsPanel.className = "investigate-panel";
    tipsPanel.style.margin = "0 18px 12px";
    tipsPanel.innerHTML = `<h4>TIPS FOR THIS CASE</h4>` + tips.map((t) => `<div class="signal-row" style="display:block;">${escapeHtml(t)}</div>`).join("");
    app.appendChild(tipsPanel);
  }

  if (completed.length > 0) {
    const clearedPanel = document.createElement("div");
    clearedPanel.className = "investigate-panel";
    clearedPanel.style.margin = "0 18px 12px";
    clearedPanel.innerHTML =
      `<h4>${ICON.check} CLEARED (${completed.length})</h4>` +
      completed
        .slice(-10)
        .reverse()
        .map((id) => {
          const fails = caseFailureCount(id);
          // Round 29 (#3): how well-argued the case was, not just that it cleared.
          const rec = gameState.caseRecords && gameState.caseRecords[id];
          const grade = rec ? `<span class="case-grade ${gradeClass(rec.grade)}" data-testid="cleared-grade">${escapeHtml(rec.grade)}${rec.clean + rec.lucky ? ` · ${rec.clean} clean / ${rec.lucky} lucky` : ""}</span>` : `<span style="color:var(--grey); font-weight:400;">${ICON.check}</span>`;
          return `<div class="signal-row" data-testid="cleared-row" data-case-id="${id}"><span>${window.SKRAPERS_CASES.getCase(id).name}${fails ? ` <span style="color:var(--amber); font-weight:400;">· after ${fails} failed attempt${fails === 1 ? "" : "s"}</span>` : ""}</span>${grade}</div>`;
        })
        .join("");
    app.appendChild(clearedPanel);
  }

  app.appendChild(renderBottomNav(null));
}

// Round 29 (#3): a cleared case's completion record — the closing report
// grade, each formal flag and the evidence it was argued from, and how
// ALGO//'s pre-flag and Halloway's call came out. Shown on Case Load's
// just-cleared card.
function gradeClass(grade) {
  return grade === "Well-evidenced" ? "clean" : grade === "Mixed" ? "mixed" : grade === "Mostly luck" ? "lucky" : "none";
}

function caseRecordHtml(rec) {
  if (!rec) return "";
  const gradeLabel = { clean: "clean", lucky: "lucky call", wrongful: "wrongful" };
  const pfLine = rec.preflag
    ? { confirmed: "ALGO//'s pre-flag: you checked it and agreed.", "followed-wrong": "ALGO//'s pre-flag: you followed it onto a real person.", overturned: "ALGO//'s pre-flag: overturned — you proved it wrong.", "contest-failed": "ALGO//'s pre-flag: you contested it, and it was right.", stood: "ALGO//'s pre-flag: never contested — it was wrong, and it stands." }[rec.preflag.outcome] || ""
    : "";
  const rvLine = rec.rival && rec.rival.correct !== null && rec.rival.correct !== undefined ? `Halloway's call on ${escapeHtml(rec.rival.name)}: ${rec.rival.correct ? "right" : "wrong"}${rec.rival.stance ? ` — you ${rec.rival.stance === "agree" ? "backed her" : "contradicted her"}` : ""}.` : "";
  return `<div class="case-record" data-testid="case-record">
    <div class="case-record-head">${ICON.book} Closing report: <span class="case-grade ${gradeClass(rec.grade)}" data-testid="case-record-grade">${escapeHtml(rec.grade)}</span></div>
    ${(rec.reports || [])
      .map((r) => `<div class="case-record-row" data-testid="case-record-row" data-grade="${r.grade}"><b>${escapeHtml(r.name)}</b> — ${gradeLabel[r.grade] || r.grade}<span>decided by: ${escapeHtml(r.evidenceLabel || "—")}</span></div>`)
      .join("")}
    ${pfLine ? `<div class="case-record-row">${escapeHtml(pfLine)}</div>` : ""}
    ${rvLine ? `<div class="case-record-row">${rvLine}</div>` : ""}
  </div>`;
}

// ===========================================================================
// Stage 32: THE MARKETPLACE. This week's local listings, two to a row, every
// one of them sold by an account that already exists in the live world —
// so a seller opens the same profile, pins to the same Case Board entry and
// can be investigated, deep-pulled and formally flagged exactly like anyone
// reached from a post. Data, generation and the refresh/churn rules live in
// game/marketplace.js; this is only the two screens (the grid and one
// listing), the pin and message actions on them, and the first-visit guide.
//
// Navigation: both screens go through trackScreen() like every other screen
// ("marketplace", "market-listing:<id>"), and both are world-aware history
// entries (worldKeyForScreen), so Back into or out of the Marketplace always
// lands where the player actually came from. The grid and a listing count as
// ONE place for the "did the player leave?" test: going grid -> listing ->
// Back is still looking at the Marketplace, so nothing sells in between;
// only arriving on the grid from anywhere else is a return visit.
// ===========================================================================
// Stage 32's first-visit guide was five tip lines, retired one by one in
// game/state.js's tutorial.seen under these ids. Stage 33 replaces it with a
// spotlight tour (marketTourSteps below) — the ids stay only so an older save
// that had finished or skipped the guide is treated as having seen the tour
// (game/state.js's normalizeTutorial), and so finishing the new tour keeps
// that old record consistent for anything that still reads it.
const MARKET_GUIDE_IDS = ["market:photo", "market:price", "market:free", "market:seller", "market:sponsored"];

// ALGO//'s reason for not buying — the same OPSEC voice as the bait
// composer's inert Photo / Check in buttons (BAIT_OPSEC_LINES), same lead-in.
const MARKET_BUY_OPSEC_LINES = [
  "A real purchase means a real card, a real name and a real address to send it to. You're not supposed to exist.",
  "Paying a seller hands them your details. If they're what you're here to find, you've just been found.",
  "You're undercover. Look, compare, ask whether it's still there — but don't buy anything.",
];

// Where the grid was scrolled when the player opened a listing, so Back
// returns them to the same card instead of the top of a 100-item grid.
let marketScroll = null; // { worldKey, y }

function marketWorldKey() {
  return pinKeyFor(currentWorld);
}

// Which exact world a market was built from — a new Home (fresh seed) under
// the same "home" key must get a fresh market, not the old sellers.
function marketSig() {
  return currentWorld.kind === "case" ? `case:${currentWorld.caseId}` : `home:${currentWorld.seed || currentWorld.label || "home"}`;
}

// The live case's Marketplace hook (game/cases.js), only while it's open.
function activeMarketHook() {
  if (currentWorld.kind !== "case" || isCaseCompleted(currentWorld.caseId)) return null;
  return window.SKRAPERS_CASES.marketplaceHookFor(currentWorld.caseId);
}

function isMarketScreenKey(key) {
  return key === "marketplace" || /^market-listing:/.test(key || "");
}

function marketState() {
  if (!gameState.marketplace || typeof gameState.marketplace !== "object") gameState.marketplace = MARKET.defaultState();
  return gameState.marketplace;
}

function marketPriceHtml(listing, cls) {
  if (listing.free) {
    return `<div class="${cls} free" data-testid="market-price-text">FREE${listing.feeText ? ` <span class="market-fee">(${escapeHtml(listing.feeText)})</span>` : ""}</div>`;
  }
  return `<div class="${cls}" data-testid="market-price-text">${escapeHtml(listing.priceText)}</div>`;
}

function marketThumbHtml(listing, extra) {
  const item = MARKET.ITEM_BY_ID[listing.iconId] || MARKET.ITEMS[0];
  return `<div class="market-thumb" style="background:${item.bg}">${MARKET.MARKET_ICON[item.id]}<span class="market-week-tag">This week</span>${extra || ""}</div>`;
}

function marketPinButtonHtml(seller, cls) {
  const pinned = pinnedIds.has(seller.id);
  return `<button class="${cls}${pinned ? " active" : ""}" data-market-pin data-seller-id="${seller.id}" data-testid="market-pin" aria-pressed="${pinned}" aria-label="${pinned ? `Remove ${escapeHtml(seller.name)} from the Case Board` : `Pin seller ${escapeHtml(seller.name)} to the Case Board`}" title="${pinned ? "Seller pinned — tap to remove from the Case Board" : "Pin this seller to the Case Board"}">${ICON.pin}</button>`;
}

// THE pin — the exact same pin set, the same Trust cost for pinning a real
// person, the same unpinAccount() and the same toast as Attach Pin on a post
// or the quick-pin on a profile. One Case Board entry per account, whichever
// screen it was pinned from.
function toggleSellerPin(acct) {
  const key = pinKeyFor(currentWorld);
  const nowPinned = !pinnedIds.has(acct.id);
  if (nowPinned) {
    pinnedIds.add(acct.id);
    if (!acct.isSkraper) window.SKRAPERS_TRUST.pin(acct.id);
    retireTip("pin", "done");
  } else {
    unpinAccount(key, acct.id);
  }
  persistNow();
  showToast(
    nowPinned ? `${acct.name} pinned to the Case Board.` : `${acct.name} removed from the Case Board.`,
    nowPinned ? "good" : null,
    nowPinned ? { type: "board" } : null
  );
  // Every card by this seller on screen reflects it at once.
  document.querySelectorAll(`[data-market-pin][data-seller-id="${acct.id}"]`).forEach((btn) => {
    btn.classList.toggle("active", nowPinned);
    btn.setAttribute("aria-pressed", String(nowPinned));
    btn.setAttribute("title", nowPinned ? "Seller pinned — tap to remove from the Case Board" : "Pin this seller to the Case Board");
  });
  return nowPinned;
}

function wireMarketPinButtons(root) {
  root.querySelectorAll("[data-market-pin]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const acct = accountById(btn.getAttribute("data-seller-id"));
      if (acct) toggleSellerPin(acct);
    });
  });
}

function renderMarketCard(listing, seller) {
  const card = document.createElement("div");
  card.className = "market-card" + (isSuspended(seller.id) ? " suspended" : "");
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("data-testid", "market-card");
  card.setAttribute("data-listing-id", listing.id);
  card.setAttribute("data-seller-id", seller.id);
  // Stage 33: which of the Marketplace's one-off call-outs this card could
  // set off when it first scrolls into view (armMarketMoments).
  if (listing.sponsored) card.setAttribute("data-moment-sponsored", "1");
  if (listing.free && listing.feeText) card.setAttribute("data-moment-free-fee", "1");
  card.innerHTML = `
    ${marketThumbHtml(listing, marketPinButtonHtml(seller, "market-pin-btn"))}
    <div class="market-body">
      ${sponsoredLabelHtml({ postType: listing.sponsored ? "ad" : null })}
      <div class="market-title">${escapeHtml(listing.title)}</div>
      ${marketPriceHtml(listing, "market-price")}
      <div class="market-seller">${escapeHtml(seller.name)} · ${escapeHtml(listing.distance)}</div>
    </div>
  `;
  const open = () => {
    marketScroll = { worldKey: marketWorldKey(), y: window.scrollY };
    renderMarketListing(listing.id);
  };
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => {
    if (e.target !== card || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    open();
  });
  return card;
}

// ===========================================================================
// Stage 33: the Marketplace's three layers of guidance.
//
// 1. THE MARKETPLACE TOUR — the first time the player is actually on the
//    grid (not the opening tour's pass through it), a spotlight tour over the
//    listing card structure itself. It deliberately points only at things
//    every grid has — the first card's picture and title, its price, its
//    seller line, its pin, the "Is this still available?" button — and
//    never depends on a particular kind of listing (a mismatch, a FREE-with-
//    a-fee) happening to be in this player's hundred. The one exception is
//    soft: if a Sponsored label is already in the first rows it's the one
//    spotlighted; otherwise the stop points at where that label would sit.
// 2. A PERSISTENT ROTATING LINE — Home's "current focus" nudge, Marketplace
//    edition: a standing Skraper-spotting reminder (game/algomsgs.js's
//    MARKET_SPOTTING_LINES), the next one on every arrival on the grid,
//    dismissible until the next arrival. Ongoing — long after the tour.
// 3. ONE-OFF CALL-OUTS — the first time a Sponsored listing, and separately
//    the first time a FREE-with-a-fee listing, actually scrolls into view:
//    one ordinary toast each, linked to that listing, never again (game/
//    state.js's tutorial.moments — two independent flags).
// ===========================================================================
function marketFirstCard() {
  return document.querySelector('[data-testid="market-grid"] .market-card');
}

function inFirstMarketCard(sel) {
  return () => {
    const card = marketFirstCard();
    return card ? [...card.querySelectorAll(sel)] : [];
  };
}

// A Sponsored label that's already in the first rows (no scrolling, no
// dependence on one being in the set at all) — else where it would sit.
function marketSponsoredTarget() {
  const firstRows = [...document.querySelectorAll('[data-testid="market-grid"] .market-card')].slice(0, 4);
  const live = firstRows.map((c) => c.querySelector(".sponsored-label")).find(Boolean);
  if (live) return [live];
  const card = firstRows[0];
  return card ? [card.querySelector(".market-body")].filter(Boolean) : [];
}

function marketTourSteps() {
  return [
    {
      onEnter: () => {
        if (currentView === "marketplace") return false;
        renderMarketplace();
        return true;
      },
      targets: inFirstMarketCard(".market-thumb, .market-title"),
      title: "Picture, then title",
      text: "Look at the picture, then read the title. They should be the same thing. Scroll fast enough and you'll miss the ones where they aren't.",
    },
    {
      targets: inFirstMarketCard(".market-price"),
      title: "The price",
      text: "Too good to be true is bait. Oddly exact — pennies on a second-hand toaster — was set by something that doesn't haggle. And <b>FREE</b> isn't free if there's a fee in the small print underneath.",
    },
    {
      targets: inFirstMarketCard(".market-seller"),
      title: "The seller",
      text: "Every seller is an account in this network. Tap through: a join date from last month, a generic bio and nothing else posted is a shop front, not a neighbour.",
    },
    {
      targets: marketSponsoredTarget,
      title: "Sponsored",
      text: "Some listings carry a small <b>Sponsored</b> label here, above the title. Someone paid for you to see those. That isn't a crime — it's a reason to look twice.",
    },
    {
      targets: inFirstMarketCard("[data-market-pin]"),
      title: "Pin the seller",
      text: "This pins the seller, not the listing — to the same Case Board as everywhere else. Free, and you can take it back.",
    },
    {
      // The one stop on a listing's own screen. Opening it for the tour
      // mustn't count as the player choosing to look at it (a viewed
      // listing becomes closing-report evidence), so that's undone at the end.
      onEnter: (t) => {
        const card = marketFirstCard();
        if (!card) return false;
        const id = card.getAttribute("data-listing-id");
        const entry = (marketState().worlds || {})[marketWorldKey()];
        t.extra.openedListing = { id, worldKey: marketWorldKey(), wasViewed: !!(entry && (entry.viewed || []).indexOf(id) !== -1) };
        marketScroll = { worldKey: marketWorldKey(), y: 0 };
        renderMarketListing(id);
        return true;
      },
      targets: () => [document.querySelector('[data-testid="market-ask"]') || document.querySelector('[data-testid="market-message"]')].filter(Boolean),
      title: "Ask — don't buy",
      text: "“Is this still available?” sends the seller one message. The reply lands in your Inbox, and how they answer is evidence too. There's no checkout: you're here to look, not to shop.",
    },
  ];
}

function startMarketTour(replay) {
  return startTour(marketTourSteps(), {
    replay: !!replay,
    trackNav: true,
    kicker: (i, n) => `ALGO// · Skraper spotting${replay ? " · replay" : ""} · ${i + 1} of ${n}`,
    skipLabel: replay ? "Close" : "Skip guide",
    doneLabel: "Got it",
    onComplete: (r) => {
      const opened = r.extra.openedListing;
      if (opened && !opened.wasViewed) {
        const entry = (marketState().worlds || {})[opened.worldKey];
        if (entry && Array.isArray(entry.viewed)) entry.viewed = entry.viewed.filter((id) => id !== opened.id);
      }
      if (!r.replay) {
        markTourSeen("market");
        MARKET_GUIDE_IDS.forEach((id) => retireTutorialTip(id, "dismissed"));
      }
      persistNow();
      // Back to the grid the tour started from (history was already put
      // back by the engine, so this is an ordinary Back step).
      if (currentView === "market-listing" && opened) goBack();
      else if (currentView === "marketplace") rearmMarketMoments();
    },
  });
}

// Fires the tour on the player's own first arrival on a grid with listings.
function maybeStartMarketTour() {
  if (isTourSeen("market") || tourActive()) return;
  setTimeout(() => {
    if (isTourSeen("market") || tourActive() || currentView !== "marketplace" || !marketFirstCard()) return;
    startMarketTour(false);
  }, 60);
}

// The rotating line. `seq` advances once per arrival on the grid (saved, so
// the rotation carries on across reloads); `dismissedSeq` hides the current
// line until the next arrival — the same "hide it until it changes" rule
// Home's focus nudge uses.
let marketNudge = { seq: 0, dismissedSeq: -1 };

function renderMarketNudge(arriving) {
  if (arriving) marketNudge.seq = (marketNudge.seq || 0) + 1;
  if (marketNudge.dismissedSeq === marketNudge.seq) return null;
  const el = document.createElement("div");
  el.className = "focus-nudge market-nudge";
  el.setAttribute("data-testid", "market-nudge");
  el.setAttribute("data-seq", String(marketNudge.seq));
  el.innerHTML = `
    <span class="focus-nudge-icon">${ICON.eye}</span>
    <div class="focus-nudge-body"><span class="focus-nudge-kicker">ALGO// · worth watching for</span><span class="focus-nudge-text">${escapeHtml(window.SKRAPERS_ALGOMSGS.marketSpottingText(Math.max(0, marketNudge.seq - 1)))}</span></div>
    <button class="focus-nudge-dismiss icon-btn icon-btn-subtle" aria-label="Dismiss" data-testid="market-nudge-dismiss">${ICON.close}</button>
  `;
  el.querySelector(".focus-nudge-dismiss").addEventListener("click", () => {
    marketNudge.dismissedSeq = marketNudge.seq;
    el.remove();
    persistNow();
  });
  return el;
}

// The one-off call-outs. An IntersectionObserver watches only the cards that
// could set off a moment the player hasn't had yet; while a tour is on
// screen it ignores everything (the tour re-arms it when it ends, and a
// fresh observer reports whatever is already in view). Two moments in view
// at once are shown one after the other, each marked seen only when it's
// actually shown — leave the Marketplace before the second and it waits.
let marketMomentObserver = null;
let marketMomentQueue = [];
let marketMomentTimer = null;
const MARKET_MOMENT_ATTR = { sponsored: "data-moment-sponsored", freeFee: "data-moment-free-fee" };

function armMarketMoments(grid) {
  if (marketMomentObserver) marketMomentObserver.disconnect();
  marketMomentObserver = null;
  marketMomentQueue = [];
  if (marketMomentTimer) clearTimeout(marketMomentTimer);
  marketMomentTimer = null;
  const pending = Object.keys(MARKET_MOMENT_ATTR).filter((k) => !isMomentSeen(k));
  if (!grid || !pending.length || typeof IntersectionObserver === "undefined") return;
  const cards = [...grid.querySelectorAll(".market-card")].filter((c) => pending.some((k) => c.hasAttribute(MARKET_MOMENT_ATTR[k])));
  if (!cards.length) return;
  marketMomentObserver = new IntersectionObserver(
    (entries) => {
      if (tourActive() || currentView !== "marketplace") return;
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        Object.keys(MARKET_MOMENT_ATTR).forEach((k) => {
          if (!isMomentSeen(k) && e.target.hasAttribute(MARKET_MOMENT_ATTR[k]) && !marketMomentQueue.some((q) => q.kind === k)) {
            marketMomentQueue.push({ kind: k, listingId: e.target.getAttribute("data-listing-id"), sellerId: e.target.getAttribute("data-seller-id") });
          }
        });
      });
      flushMarketMoments();
    },
    { threshold: 0.6 }
  );
  cards.forEach((c) => marketMomentObserver.observe(c));
}

function rearmMarketMoments() {
  armMarketMoments(document.querySelector('[data-testid="market-grid"]'));
}

function flushMarketMoments() {
  if (marketMomentTimer || !marketMomentQueue.length) return;
  if (tourActive() || currentView !== "marketplace") {
    marketMomentQueue = [];
    return;
  }
  const next = marketMomentQueue.shift();
  if (isMomentSeen(next.kind)) return flushMarketMoments();
  markMomentSeen(next.kind);
  persistNow();
  showToast(window.SKRAPERS_ALGOMSGS.marketMomentText(next.kind), "good", { type: "marketListing", listingId: next.listingId, acctId: next.sellerId, worldKey: marketWorldKey() });
  const toast = activeToastEl;
  if (toast) toast.setAttribute("data-moment", next.kind);
  marketMomentTimer = setTimeout(() => {
    marketMomentTimer = null;
    flushMarketMoments();
  }, 6500);
}

function renderMarketplace() {
  const key = marketWorldKey();
  const mstate = marketState();
  // A return visit is arriving on the grid from anywhere that isn't the
  // Marketplace (a listing of this same world counts as still being here).
  const arriving = !activeScreen || !isMarketScreenKey(activeScreen.key) || (activeScreen.worldKey && activeScreen.worldKey !== key);
  const hook = activeMarketHook();
  if (arriving || !mstate.worlds[key]) {
    const opts = { isSuspended, hook };
    MARKET.refreshIfDue(mstate, key, marketSig(), accounts, opts);
    MARKET.churnOnReturn(mstate, key, accounts, { isSuspended, keepHook: !!hook });
    MARKET.pruneWorlds(mstate, ["home", key, lastCaseKey, ...Object.keys(worldSnapshots)]);
    persistNow();
  }
  currentView = "marketplace";
  trackScreen(() => renderMarketplace(), "marketplace");
  detachHomeScrollHandler();
  app.innerHTML = "";
  applyPhaseClass();

  const topbar = renderTopbarStack(`<button class="back-btn">${ICON.chevronLeft} Back</button>`, false);
  topbar.querySelector(".back-btn").addEventListener("click", () => goBack());
  app.appendChild(topbar);

  const entry = mstate.worlds[key];
  const head = document.createElement("div");
  head.className = "market-head";
  head.setAttribute("data-testid", "marketplace");
  head.innerHTML = `
    <div class="market-kicker">${ICON.market} ALGO// Marketplace</div>
    <div class="market-sub">Local listings from accounts in this network${currentWorld.kind === "case" ? ` — ${escapeHtml(currentWorld.label)}` : ""}. Everything is arranged with the seller.</div>
  `;
  app.appendChild(head);

  if (hook) {
    const line = document.createElement("div");
    line.className = "focus-nudge market-hook";
    line.setAttribute("data-testid", "market-hook");
    line.innerHTML = `<span class="focus-nudge-icon">${ICON.eye}</span><div class="focus-nudge-body"><span class="focus-nudge-kicker">ALGO// · ${escapeHtml(currentWorld.label)}</span><span class="focus-nudge-text">${escapeHtml(hook.briefing)}</span></div>`;
    app.appendChild(line);
  }

  // Stage 33: the persistent rotating Skraper-spotting line.
  const nudge = renderMarketNudge(arriving);
  if (nudge) app.appendChild(nudge);
  if (arriving) persistNow(); // the rotation is saved

  const grid = document.createElement("div");
  grid.className = "market-grid";
  grid.setAttribute("data-testid", "market-grid");
  const listings = (entry && entry.listings) || [];
  listings.forEach((listing) => {
    const seller = accountById(listing.sellerId);
    if (seller) grid.appendChild(renderMarketCard(listing, seller)); // a seller who's left the roster goes at the next return
  });
  if (!grid.children.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nothing for sale in this network right now.";
    app.appendChild(empty);
  } else {
    wireMarketPinButtons(grid);
    app.appendChild(grid);
  }
  app.appendChild(renderBottomNav("market"));

  // Back from a listing lands on the same card; any other arrival starts at
  // the top, like every other screen.
  if (!arriving && marketScroll && marketScroll.worldKey === key) window.scrollTo(0, marketScroll.y);
  else window.scrollTo(0, 0);

  // Stage 33: the first-visit tour, and the one-off call-outs.
  armMarketMoments(grid.isConnected ? grid : null);
  maybeStartMarketTour();
}

function renderMarketListing(listingId) {
  const key = marketWorldKey();
  const mstate = marketState();
  const listing = MARKET.findListing(mstate, key, listingId);
  const seller = listing && accountById(listing.sellerId);
  // Same defensive rule as renderProfile: a stale id degrades to "stay where
  // you are", never a thrown error on a blank screen.
  if (!listing || !seller) {
    if (!app.children.length) goHome();
    showToast("That listing isn't part of the network you're looking at right now.", "bad");
    return;
  }
  currentView = "market-listing";
  trackScreen(() => renderMarketListing(listingId), "market-listing:" + listingId);
  detachHomeScrollHandler();
  deliverMarketReplies();
  if (MARKET.markViewed(mstate, key, listing.id)) persistNow();
  app.innerHTML = "";
  applyPhaseClass();
  window.scrollTo(0, 0);

  const topbar = renderTopbarStack(`<button class="back-btn">${ICON.chevronLeft} Back</button>`, false);
  topbar.querySelector(".back-btn").addEventListener("click", () => goBack());
  app.appendChild(topbar);

  const sold = !!listing.sold;
  const wrap = document.createElement("div");
  wrap.className = "market-detail";
  wrap.setAttribute("data-testid", "market-listing");
  wrap.setAttribute("data-listing-id", listing.id);
  wrap.innerHTML = `
    ${marketThumbHtml(listing, sold ? `<span class="market-sold-tag" data-testid="market-sold">Sold</span>` : "")}
    <div class="market-detail-body">
      ${sponsoredLabelHtml({ postType: listing.sponsored ? "ad" : null })}
      <div class="market-detail-title">${escapeHtml(listing.title)}</div>
      <button class="market-detail-price-btn" data-buy-gesture data-testid="market-price" aria-label="Price: ${escapeHtml(listing.priceText)}">${marketPriceHtml(listing, "market-detail-price")}</button>
      <div class="market-detail-meta">${ICON.clock} Listed this week · ${ICON.globe} ${escapeHtml(listing.distance)} away</div>
      <div class="market-seller-row" data-open-seller data-testid="market-seller" role="button" tabindex="0">
        <div class="avatar" ${avatarStyleAttr(seller.id)}>${initials(seller.name)}</div>
        <div class="market-seller-id">
          <div><b>${escapeHtml(seller.name)}</b> <span class="market-seller-handle">${escapeHtml(seller.handle)}</span> ${statusTag(seller)}</div>
          <div class="market-seller-sub">Seller · joined ${escapeHtml(seller.joined || "—")} · view profile →</div>
        </div>
        ${marketPinButtonHtml(seller, "icon-btn market-detail-pin")}
      </div>
      <div class="market-message" data-testid="market-message"></div>
    </div>
  `;
  wireMarketPinButtons(wrap);
  const openSeller = () => renderProfile(seller.id);
  const sellerRow = wrap.querySelector("[data-open-seller]");
  sellerRow.addEventListener("click", openSeller);
  sellerRow.addEventListener("keydown", (e) => {
    if (e.target === sellerRow && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      openSeller();
    }
  });
  // No checkout exists — and anything that reaches for one (tapping the
  // price) gets ALGO//'s OPSEC warning, in the bait composer's voice.
  wrap.querySelector("[data-buy-gesture]").addEventListener("click", () => {
    const line = MARKET_BUY_OPSEC_LINES[avatarHashSeed(listing.id) % MARKET_BUY_OPSEC_LINES.length];
    showToast(`ALGO//: It wouldn't be wise to buy that. ${line}`, "bad");
  });

  const slot = wrap.querySelector(".market-message");
  const fillMessage = () => {
    const msg = MARKET.messageFor(mstate, key, listing.id);
    if (!msg) {
      slot.innerHTML = sold
        ? `<div class="market-fine">This listing has sold.</div>`
        : `<button class="investigate-btn market-ask-btn" data-market-ask data-testid="market-ask">${ICON.mail} Is this still available?</button><div class="market-fine">Sends ${escapeHtml(seller.name)} one message. Their reply lands in your Inbox.</div>`;
      const ask = slot.querySelector("[data-market-ask]");
      if (ask) {
        ask.addEventListener("click", () => {
          const sent = MARKET.sendAvailabilityMessage(mstate, key, marketSig(), listing, seller);
          if (!sent) {
            showToast("You've already asked about this one.", "bad");
          } else {
            persistNow();
            showToast(`Message sent to ${seller.name}. Their reply will land in your Inbox.`, "good");
          }
          fillMessage();
        });
      }
      return;
    }
    slot.innerHTML = `
      <div class="dm-row dm-you"><b>You</b><div>${escapeHtml(msg.sentText)}</div></div>
      ${
        msg.delivered
          ? `<div class="dm-row dm-them" data-testid="market-reply"><b>${escapeHtml(msg.sellerName)}</b><div>${escapeHtml(msg.replyText)}</div></div>`
          : `<div class="market-waiting" data-testid="market-waiting">${ICON.clock} Waiting for ${escapeHtml(msg.sellerName)} to reply…</div>`
      }
    `;
  };
  fillMessage();

  app.appendChild(wrap);
  app.appendChild(renderBottomNav("market"));
}

// Stage 13: the notification feed for ALGO//'s messages to the player
// (game/algomsgs.js). Stage 15 gave it its own bottom-nav tab; Stage 32 (#1)
// folds it into the Inbox as the "Notifications" side of one screen, so
// this is now just the entry point every existing caller and link target
// ({ type: "notifications" } — ALGO//'s own toasts, new-lead toasts) still
// uses: it opens the Inbox with that side showing.
function renderNotifications() {
  renderInbox({ tab: "notifications" });
}

// Which side of the Inbox is showing — a per-session view choice, like the
// Case Board's map/list mode. Switching sides redraws in place under the
// same history key ("inbox"), so it is never a Back step of its own.
let inboxTab = "messages";

// Stage 17: Inbox is "a person/account in the world reacting to you"
// (Trust confrontations, comment-author responses, Marketplace replies);
// Notifications is the platform talking to you. Stage 32 (#1): one screen,
// two sides. Opened from the nav with no `opts.tab`, it lands on whichever
// side has something unread (messages first), else wherever the player
// last left it.
function renderInbox(opts) {
  opts = opts || {};
  deliverMarketReplies();
  const unreadMessages = inboxMessages.filter((m) => !m.read).length;
  const unreadNotifs = window.SKRAPERS_ALGOMSGS.state.unread;
  if (opts.tab === "messages" || opts.tab === "notifications") inboxTab = opts.tab;
  else if (unreadMessages) inboxTab = "messages";
  else if (unreadNotifs) inboxTab = "notifications";
  const tab = inboxTab;
  currentView = "inbox";
  trackScreen(() => renderInbox({ tab }), "inbox");
  detachHomeScrollHandler();
  // Reading the Notifications side is what "reads" ALGO//'s messages — same
  // rule the old Notifications tab had (opening it marked them read).
  if (tab === "notifications" && unreadNotifs) {
    window.SKRAPERS_ALGOMSGS.markRead();
    persistNow();
  }
  app.innerHTML = "";
  window.scrollTo(0, 0);
  app.appendChild(renderTopbarStack(null, false));

  const tabs = document.createElement("div");
  tabs.className = "feed-mode-toggle inbox-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("data-testid", "inbox-tabs");
  tabs.innerHTML = `
    <button class="feed-mode-btn${tab === "messages" ? " active" : ""}" role="tab" aria-selected="${tab === "messages"}" data-tab="messages" data-testid="inbox-tab-messages">${ICON.inbox} Messages${unreadMessages ? `<span class="inbox-tab-count">${unreadMessages}</span>` : ""}</button>
    <button class="feed-mode-btn${tab === "notifications" ? " active" : ""}" role="tab" aria-selected="${tab === "notifications"}" data-tab="notifications" data-testid="inbox-tab-notifications">${ICON.bell} Notifications${tab !== "notifications" && unreadNotifs ? `<span class="inbox-tab-count">${unreadNotifs}</span>` : ""}</button>
  `;
  tabs.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.getAttribute("data-tab") !== tab) renderInbox({ tab: btn.getAttribute("data-tab") });
    });
  });
  app.appendChild(tabs);

  if (tab === "notifications") fillNotificationsSide();
  else fillMessagesSide(unreadMessages);
  app.appendChild(renderBottomNav("inbox"));
}

// Stage 18 (#3): the explanatory line is plain fine-print text with no box
// around it (it used to reuse `.investigate-panel` and read as one more
// message) — kept for both sides.
function fillNotificationsSide() {
  const header = document.createElement("div");
  header.style.cssText = "margin:10px 18px 4px;";
  header.innerHTML = `
    <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--grey);">ALGO// MESSAGES</div>
    <div style="font-size:11.5px; line-height:1.5; color:var(--grey); margin-top:4px;">Not a support inbox. ALGO// only writes to you when it's noticed something about how you play — including new leads opened while scrolling Home.</div>
  `;
  app.appendChild(header);

  if (notifications.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nothing yet. ALGO// is still forming an opinion of you.";
    app.appendChild(empty);
    return;
  }

  notifications.forEach((n) => {
    const card = document.createElement("div");
    card.className = "investigate-panel";
    card.style.margin = "0 18px 10px";
    card.style.cursor = "pointer";
    card.setAttribute("data-testid", "notification-card");
    card.innerHTML = `
      <div style="font-family:'Space Grotesk',monospace; font-size:10.5px; letter-spacing:0.05em; color:var(--grey); margin-bottom:6px;">ALGO// — ${timeAgo(n.at)} ago</div>
      <div style="font-size:14px; line-height:1.5;">${n.text}</div>
      <div style="font-size:11px; color:var(--blue); margin-top:8px; font-family:'Space Grotesk',monospace;">${notificationActionLabel(n.target)} →</div>
    `;
    card.addEventListener("click", () => goToNotificationTarget(n.target));
    app.appendChild(card);
  });
}

// Stage 18 (#3): a message is only marked read when the player actually
// clicks into it, with an explicit "Mark all as read" for the rest.
function fillMessagesSide(unreadCount) {
  const header = document.createElement("div");
  header.style.cssText = "margin:10px 18px 4px; display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap;";
  header.innerHTML = `
    <div>
      <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--grey);">INBOX</div>
      <div style="font-size:11.5px; line-height:1.5; color:var(--grey); margin-top:4px; max-width:300px;">Not ALGO//. This is people and accounts in the world reacting to YOU — replies to your comments and Marketplace messages, and anyone who's noticed you looking into them.</div>
    </div>
    <button data-mark-all-read class="inbox-mark-all" ${unreadCount === 0 ? "disabled" : ""}>Mark all as read${unreadCount > 0 ? ` (${unreadCount})` : ""}</button>
  `;
  header.querySelector("[data-mark-all-read]").addEventListener("click", () => {
    inboxMessages.forEach((m) => (m.read = true));
    persistNow();
    renderInbox({ tab: "messages" });
  });
  app.appendChild(header);

  if (inboxMessages.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nothing yet. Comment on a post, message a seller, or investigate someone and check back.";
    app.appendChild(empty);
    return;
  }

  inboxMessages.forEach((n) => {
    const card = document.createElement("div");
    card.className = "investigate-panel";
    card.style.margin = "0 18px 10px";
    card.style.cursor = "pointer";
    card.setAttribute("data-testid", "inbox-card");
    // Unread messages get a small dot next to the timestamp — the only
    // visual difference from a read one, so "mark all as read" has
    // something real to clear.
    card.innerHTML = `
      <div style="font-family:'Space Grotesk',monospace; font-size:10.5px; letter-spacing:0.05em; color:var(--grey); margin-bottom:6px; display:flex; align-items:center; gap:6px;">${n.read ? "" : `<span style="width:6px; height:6px; border-radius:50%; background:var(--blue); display:inline-block;"></span>`}${timeAgo(n.at)} ago</div>
      <div style="font-size:14px; line-height:1.5;">${n.text}</div>
      <div style="font-size:11px; color:var(--blue); margin-top:8px; font-family:'Space Grotesk',monospace;">${notificationActionLabel(n.target)} →</div>
    `;
    card.addEventListener("click", () => {
      n.read = true;
      persistNow();
      goToNotificationTarget(n.target);
    });
    app.appendChild(card);
  });
}

// Stage 16 (#5), extended Stage 17: every notification/inbox card is
// clickable and routes to whatever it's actually about — a specific
// account's profile, a specific post's comment thread, the Trust
// confrontation, the epilogue, the case board, or (with no specific
// target, e.g. a generic ALGO// behavior message) the player's own
// profile, since those are about the player's own stats.
function notificationActionLabel(target) {
  if (!target) return "View your profile";
  if (target.type === "profile") return "View account";
  if (target.type === "postThread") return "Open comment thread";
  if (target.type === "epilogue") return "View signal";
  if (target.type === "board") return "Open case board";
  if (target.type === "caseload") return "View Case Load";
  if (target.type === "notifications") return "Open Notifications";
  if (target.type === "inbox") return "Open Inbox";
  if (target.type === "marketListing") return "Open listing";
  if (target.type === "marketplace") return "Open Marketplace";
  return "View";
}

function goToNotificationTarget(target) {
  if (target && target.type === "postThread" && accountById(target.acctId)) {
    renderProfile(target.acctId);
    // renderProfile is synchronous DOM-building, so the post is already in
    // the document by the time this runs — expand its thread and scroll
    // to it, exactly what "route to open that post's comment thread" means.
    const postDiv = document.querySelector(`.post[data-post-id="${target.postId}"]`);
    if (postDiv) {
      postDiv.scrollIntoView({ block: "center" });
      const toggle = postDiv.querySelector(".comment-toggle");
      if (toggle) toggle.click();
    }
  } else if (target && target.type === "profile" && accountById(target.acctId)) {
    renderProfile(target.acctId);
  } else if (target && target.type === "epilogue") {
    renderEpilogue();
  } else if (target && target.type === "board") {
    renderCaseBoard();
  } else if (target && target.type === "caseload") {
    goStory();
  } else if (target && target.type === "notifications") {
    renderNotifications();
  } else if (target && target.type === "inbox") {
    renderInbox({ tab: "messages" });
  } else if (target && target.type === "marketListing") {
    // Stage 32: a seller's reply. The listing if it's in the world that's
    // live now (sold or not — a sold one still opens, marked sold), else
    // the seller's profile if they're here, else the Marketplace itself —
    // the same "never a dead link, never a throw" rule as a profile target.
    if (target.worldKey === pinKeyFor(currentWorld) && MARKET.findListing(gameState.marketplace, target.worldKey, target.listingId)) renderMarketListing(target.listingId);
    else if (accountById(target.acctId)) renderProfile(target.acctId);
    else renderMarketplace();
  } else if (target && target.type === "marketplace") {
    renderMarketplace();
  } else {
    renderPlayerProfile();
  }
}

// Stage 13: RESPOND / IGNORE / EXPLAIN (doc follow-up brainstorm point 2)
// — a real modal, not a toast, because this is the one moment the Trust
// system asks the player to make a deliberate trade-off between ALGO//
// standing and community trust rather than just watching a number move.
// Feature round (Home topbar hamburger): a real, small settings panel —
// not a placeholder. Reachable only from Home's topbar. Reuses
// resetSession() rather than duplicating the "New investigation" logic.
// Stage 31 (#1): Settings is now the ONLY place a new investigation can be
// started from (it used to sit, unguarded, on the Player Profile).
// Round 23 (#3): reworked into a real toggle-menu — dark mode and high
// contrast are working, persisted accessibility/display toggles; "Log out"
// is the SAME resetSession() as the old "New investigation" button, just
// relabeled and now gated behind renderLogoutConfirm() rather than firing
// immediately. Story/Profile links and the About blurb are kept, trimmed.
function renderSettingsPanel() {
  const overlay = document.createElement("div");
  overlay.className = "trust-modal-overlay settings-overlay";
  // Stage 33: "Replay tutorial" — each spotlight tour by name, replayable on
  // demand. A replay never writes its seen-flag (see replayTour), so the
  // Seen / Not yet status beside each is exactly what the rest of the game
  // believes.
  const replayRowsHtml = REPLAYABLE_TOURS.map(
    (t) => `<div class="settings-replay-row" data-testid="settings-replay-row-${t.id}">
          <div class="settings-toggle-label"><span>${escapeHtml(t.name)}</span><span class="settings-toggle-sub">${escapeHtml(t.sub)} · <span data-testid="settings-replay-status-${t.id}">${isTourSeen(t.id) ? "seen" : "not seen yet"}</span></span></div>
          <button class="settings-replay-btn" data-replay="${t.id}" data-testid="settings-replay-${t.id}">${ICON.refresh} Replay</button>
        </div>`
  ).join("");
  overlay.innerHTML = `
    <div class="trust-modal settings-modal settings-main-modal">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.06em; color:var(--blue); text-transform:uppercase;">Settings</div>
        <button class="settings-close icon-btn icon-btn-subtle" aria-label="Close">${ICON.close}</button>
      </div>
      <div class="settings-toggle-row">
        <div class="settings-toggle-label"><span>${ICON.moon} Dark mode</span><span class="settings-toggle-sub">Swaps the whole palette</span></div>
        <button class="settings-switch${gameState.settings.darkMode ? " on" : ""}" data-toggle="darkMode" aria-label="Toggle dark mode"></button>
      </div>
      <div class="settings-toggle-row" style="border-top:1px solid rgba(83,100,113,0.15);">
        <div class="settings-toggle-label"><span>${ICON.contrast} High contrast</span><span class="settings-toggle-sub">Stronger text &amp; borders</span></div>
        <button class="settings-switch${gameState.settings.highContrast ? " on" : ""}" data-toggle="highContrast" aria-label="Toggle high contrast"></button>
      </div>
      <div class="settings-toggle-row" style="border-top:1px solid rgba(83,100,113,0.15);">
        <div class="settings-toggle-label"><span>${ICON.eye} Simplified mode</span><span class="settings-toggle-sub">Just spot the bots: hides questioning, the rival investigator and ALGO//'s pre-flags</span></div>
        <button class="settings-switch${gameState.settings.simplifiedMode ? " on" : ""}" data-toggle="simplifiedMode" data-testid="settings-simplified" aria-label="Toggle simplified mode"></button>
      </div>
      <div class="settings-replay" data-testid="settings-replay">
        <div class="settings-section-title">${ICON.bulb} Replay tutorial</div>
        ${replayRowsHtml}
        <div class="settings-replay-note">Replaying doesn't change what the game remembers you've seen.</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:14px; padding-top:12px; border-top:1px solid rgba(83,100,113,0.15);">
        <button class="investigate-btn" data-action="profile" style="margin-top:0; background:transparent; color:var(--blue); border:1px solid var(--blue);">${ICON.brain} Player Profile</button>
        <button class="investigate-btn" data-action="icon-key" data-testid="settings-icon-key" style="margin-top:0; background:transparent; color:var(--blue); border:1px solid var(--blue);">${ICON.help} Icon key</button>
        <button class="investigate-btn" data-action="new-investigation" data-testid="settings-new-investigation" style="margin-top:0; background:transparent; color:var(--red); border:1px solid var(--red);">${ICON.refresh} Start a new investigation</button>
        <button class="investigate-btn" data-action="logout" style="margin-top:0; background:transparent; color:var(--red); border:1px solid var(--red);">${ICON.door} Log out</button>
      </div>
      <div style="font-size:11.5px; line-height:1.5; color:var(--grey); margin-top:14px; padding-top:12px; border-top:1px solid rgba(83,100,113,0.15);">
        <b style="color:var(--white);">About SKRAPERS</b><br>
        You're investigating a live social feed for accounts that aren't real people. Weigh signals, don't trust any single one.
      </div>
    </div>
  `;
  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector(".settings-close").addEventListener("click", close);
  overlay.querySelectorAll(".settings-switch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-toggle");
      const on = toggleSetting(key);
      btn.classList.toggle("on", on);
      applyDisplaySettings();
      persistNow();
      // Round 30 (#6): Simplified Mode changes what the screen underneath
      // shows (a rival post, a pre-flag strip, the Message button), so
      // redraw it in place — mid-case, mid-profile, wherever the player is.
      if (key === "simplifiedMode") rerenderActiveScreen();
    });
  });
  overlay.querySelectorAll("[data-replay]").forEach((btn) => {
    btn.addEventListener("click", () => {
      close();
      replayTour(btn.getAttribute("data-replay"));
    });
  });
  overlay.querySelector('[data-action="profile"]').addEventListener("click", () => {
    close();
    renderPlayerProfile();
  });
  overlay.querySelector('[data-action="icon-key"]').addEventListener("click", () => {
    close();
    renderIconLegend();
  });
  overlay.querySelector('[data-action="new-investigation"]').addEventListener("click", () => {
    close();
    renderNewInvestigationConfirm();
  });
  overlay.querySelector('[data-action="logout"]').addEventListener("click", () => {
    close();
    renderLogoutConfirm();
  });
  document.body.appendChild(overlay);
}

// Round 30 (#6): redraws whatever screen is showing, without it counting as
// a navigation (same history key) or as time passing (a feed is redrawn
// with noTick, so no world tick and no "while you were away").
function rerenderActiveScreen() {
  if (!activeScreen) return;
  if (/^feed:/.test(activeScreen.key)) renderFeed(true, { noTick: true });
  else activeScreen.run();
}

// Round 23 (#3): "Log out" is a full factory reset (the same resetSession()
// as before) — this disclaimer is the only new thing, so the player can't
// hit it by accident.
// Stage 31 (#1): the erase-everything confirmation is now one shared modal
// (renderEraseConfirm) used by BOTH destructive Settings actions — Log out,
// and "Start a new investigation" (moved here from the Player Profile,
// where it wiped the save on a single unguarded tap). Nothing is erased
// until the red confirm button inside the modal is pressed.
function renderEraseConfirm({ title, body, confirmLabel, testid }) {
  const overlay = document.createElement("div");
  overlay.className = "trust-modal-overlay settings-overlay";
  overlay.setAttribute("data-testid", testid || "erase-confirm");
  overlay.innerHTML = `
    <div class="trust-modal settings-modal" role="alertdialog" aria-modal="true">
      <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.06em; color:var(--red); text-transform:uppercase; margin-bottom:10px;">${ICON.warning} ${escapeHtml(title)}</div>
      <div style="font-size:14px; line-height:1.55; margin-bottom:18px;">${body}</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <button class="investigate-btn" data-choice="confirm" data-testid="erase-confirm-yes" style="margin-top:0; background:transparent; color:var(--red); border:1px solid var(--red);">${escapeHtml(confirmLabel)}</button>
        <button class="investigate-btn" data-choice="cancel" data-testid="erase-confirm-cancel" style="margin-top:0; background:transparent; color:var(--grey); border:1px solid var(--grey);">Cancel</button>
      </div>
    </div>
  `;
  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector('[data-choice="cancel"]').addEventListener("click", close);
  overlay.querySelector('[data-choice="confirm"]').addEventListener("click", () => {
    close();
    resetSession();
  });
  document.body.appendChild(overlay);
}

function renderLogoutConfirm() {
  renderEraseConfirm({
    title: "Log out",
    body: "Logging out performs a full factory reset — back to the CAPTCHA screen. It erases everything about this playthrough: your investigation, flags, reputation, bait status, and every account you've caught. This cannot be undone.",
    confirmLabel: "Log out and erase everything",
    testid: "logout-confirm",
  });
}

function renderNewInvestigationConfirm() {
  renderEraseConfirm({
    title: "Start a new investigation",
    body: "This erases <b>all</b> of your current progress — every case you've cleared or started, your Case Board pins, notes and links, your ALGO// standing, community trust and accuracy, your flags, bait status and messages — and starts over from the CAPTCHA screen. <b>This cannot be undone.</b> Your display settings are kept.",
    confirmLabel: "Erase everything and start over",
    testid: "new-investigation-confirm",
  });
}

// Stage 31 (#7): the icon key — a small card listing what each non-obvious
// icon means (ICON_LEGEND). Same overlay family as Settings so it follows
// the theme, but a light, dismiss-anywhere card rather than a wall of text.
function renderIconLegend() {
  document.querySelectorAll(".icon-legend-overlay").forEach((el) => el.remove());
  const overlay = document.createElement("div");
  overlay.className = "trust-modal-overlay settings-overlay icon-legend-overlay";
  overlay.setAttribute("data-testid", "icon-legend");
  overlay.innerHTML = `
    <div class="trust-modal settings-modal icon-legend" role="dialog" aria-label="Icon key">
      <div class="icon-legend-head">
        <span>${ICON.help} Icon key</span>
        <button class="icon-btn icon-btn-subtle" data-close aria-label="Close">${ICON.close}</button>
      </div>
      ${ICON_LEGEND.map((row) => `<div class="icon-legend-row"><span class="icon-legend-glyph">${ICON[row.icon]}</span><span><b>${escapeHtml(row.label)}</b> — ${escapeHtml(row.text)}</span></div>`).join("")}
      <div class="icon-legend-foot">Icon buttons fill in with colour when they're switched on.</div>
    </div>
  `;
  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest("[data-close]")) close();
  });
  document.body.appendChild(overlay);
}

function renderTrustModal(acct) {
  const overlay = document.createElement("div");
  overlay.className = "trust-modal-overlay";
  overlay.innerHTML = `
    <div class="trust-modal">
      <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.06em; color:var(--red); margin-bottom:10px;">DIRECT MESSAGE — ${acct.name}</div>
      <div style="font-size:15px; line-height:1.55; margin-bottom:18px;">${window.SKRAPERS_TRUST.confrontMessage()}</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <button class="investigate-btn" data-choice="respond" style="margin-top:0;">RESPOND — tell them the truth</button>
        <button class="investigate-btn" data-choice="explain" style="margin-top:0; background:transparent; color:var(--amber); border:1px solid var(--amber);">EXPLAIN — give them a cover story</button>
        <button class="investigate-btn" data-choice="ignore" style="margin-top:0; background:transparent; color:var(--grey); border:1px solid var(--grey);">IGNORE — leave it unanswered</button>
      </div>
    </div>
  `;
  overlay.querySelectorAll("[data-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.getAttribute("data-choice");
      resolveTrustChoice(choice, acct);
      overlay.remove();
      // A player can trigger several confrontations in one tick — work
      // through the queue one modal at a time rather than stacking them.
      if (pendingConfrontations.length) {
        const next = pendingConfrontations.shift();
        renderTrustModal(next);
      }
    });
  });
  document.body.appendChild(overlay);
}

function resolveTrustChoice(choice, acct) {
  const reputation = window.SKRAPERS_REPUTATION;
  if (choice === "respond") {
    // Honest — costs you standing with ALGO// (you went off-script and
    // admitted the surveillance) but genuinely repairs community trust.
    gameState.credibility = Math.max(0, gameState.credibility - 6);
    reputation.applyDelta(8);
    showToast(`${acct.name} appreciated the honesty. Community trust +8, ALGO// standing -6.`, "good");
  } else if (choice === "explain") {
    // A cover story — ALGO// approves of staying in character regardless
    // of outcome; whether the human believes it is a coin flip weighted
    // by how much trust you have left with people in general.
    gameState.credibility = Math.min(100, gameState.credibility + 3);
    const believed = Math.random() < reputation.rep.communityTrust / 100;
    reputation.applyDelta(believed ? 2 : -10);
    showToast(believed ? `${acct.name} seemed to accept it. ALGO// standing +3, community trust +2.` : `${acct.name} didn't buy it. ALGO// standing +3, community trust -10.`, believed ? "good" : "bad");
  } else {
    gameState.credibility = Math.min(100, gameState.credibility + 1);
    reputation.applyDelta(-6);
    showToast(`${acct.name} never heard back from you. ALGO// standing +1, community trust -6.`, "bad");
  }
  checkAlgoMessages();
  persistNow();
  refreshAllCredibilityBadges();
}

// Stage 13: the doc's Potential Major Twist (section 40) — an unlockable
// epilogue tying back to the CAPTCHA moment. Deliberately doesn't end or
// gate anything else; it's a scene, reachable again afterward from the
// action bar, not a one-shot cutscene the player can miss.
function renderEpilogue() {
  currentView = "epilogue";
  trackScreen(renderEpilogue, "epilogue");
  detachHomeScrollHandler();
  app.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.style.cssText = "min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:32px 24px; gap:16px;";
  wrap.innerHTML = `
    <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.1em; color:var(--red);">SIGNAL — NOT AN ACCOUNT</div>
    <div style="max-width:360px; font-size:15px; line-height:1.65;">Go back to the CAPTCHA. The one you passed on your way in.</div>
    <div style="max-width:360px; font-size:15px; line-height:1.65;">Every tile you selected was logged before you clicked "Verify" — not to check your answer, but to time it. How fast you decided. Which ones you hesitated on. M.A.I. didn't recruit you because you passed. It recruited you because of exactly how you passed.</div>
    <div style="max-width:360px; font-size:15px; line-height:1.65; color:var(--grey);">You've spent this whole investigation deciding, from a handful of signals, which accounts are real and which are performing. ALGO// made the same kind of call about you, from far less data, in under four seconds.</div>
    <div style="max-width:360px; font-size:15px; line-height:1.65; color:var(--grey);">It hasn't told you what it decided. It isn't going to.</div>
    <button class="investigate-btn" data-action="back">Return to ALGO//</button>
  `;
  // Bug fix (real Back button): used to hardcode renderFeed(true) — see
  // renderProfile's comment above.
  wrap.querySelector('[data-action="back"]').addEventListener("click", () => goBack());
  app.appendChild(wrap);
  app.appendChild(renderBottomNav(null));
}

// Stage 10, reworked Stage 14: the CAPTCHA hook — the doc's own framing
// device for how the player gets pulled into this at all (section 42's
// "player onboarding disguised as something mundane"), now implementing
// the specific mechanic the doc calls out as possibly its most
// significant beat: the player has to deliberately FAIL it to get in.
// Getting it "right" is a dead end that loops back, not a game over — the
// doc's Potential Major Twist (section 40, "what exactly did you pass
// when you failed the CAPTCHA?") only means something if passing was
// genuinely available and declined, not literally impossible to select.
//
// CAPTCHA_CORRECT is the "objectively correct" answer to the prompt as
// written — a normal user trying earnestly will often select exactly
// this set. Matching it exactly reads as a PASS (dead end); anything
// else, including selecting nothing and hitting Verify immediately (the
// single most natural first move), reads as a FAIL and lets you in.
const CAPTCHA_GLYPHS = ["🌧️", "☕", "🎸", "🐦", "📎", "🍞", "🧦", "🪴", "🖇️"];
const CAPTCHA_CORRECT = [1, 2, 6]; // ☕ 🎸 🧦 — "something a real person would post"

// Feature round ("a library of different ones"): the emoji-tile challenge
// above was the only CAPTCHA style there was; it's kept exactly as-is as
// one library entry (CAPTCHA_CORRECT still drives its pass rule) and
// joined by several reCAPTCHA-style "select all squares with ___" grids.
// The game has no real photography, so each grid tile is a small,
// recognizable line icon drawn with inline SVG (the same "CSS/SVG-drawn,
// never a photo" placeholder convention the ad/video-thumbnail work used
// above — see sponsoredLabelHtml/the video play-icon svg near line 783)
// rather than an emoji, so it actually reads as a real CAPTCHA grid.
const CAPTCHA_ICONS = {
  lamppost: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v3"/><path d="M8 5h8l-1.6 2.2h-4.8L8 5z"/><circle cx="12" cy="8.6" r="1" fill="currentColor" stroke="none"/><path d="M12 9.6v10.9"/><path d="M8.3 20.5h7.4"/></svg>`,
  trafficlight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="14" rx="2"/><circle cx="12" cy="6.3" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="13.7" r="1" fill="currentColor" stroke="none"/><path d="M12 17v2"/><path d="M8.3 21h7.4"/></svg>`,
  bicycle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17l4.5-9h4L18 17"/><path d="M10.5 8h3"/><path d="M9 17h6"/></svg>`,
  bus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="11" rx="2"/><path d="M3 10h18"/><path d="M7 16v2"/><path d="M17 16v2"/><circle cx="7" cy="19" r="1.1" fill="currentColor" stroke="none"/><circle cx="17" cy="19" r="1.1" fill="currentColor" stroke="none"/></svg>`,
  firehydrant: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6"/><path d="M10 21v-3h4v3"/><rect x="9" y="7" width="6" height="11" rx="2.5"/><path d="M6.5 10.5h-2"/><path d="M19.5 10.5h-2"/><path d="M10.5 7V4.5h3V7"/></svg>`,
  crosswalk: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 6l-1.5 12"/><path d="M9.5 6L9 18"/><path d="M14.5 6l.5 12"/><path d="M19.5 6l1.5 12"/></svg>`,
  car: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l1.5-5.5A2 2 0 0 1 7.4 9h9.2a2 2 0 0 1 1.9 1.5L20 16"/><rect x="3" y="16" width="18" height="3.2" rx="1.2"/><circle cx="7.5" cy="19.2" r="1.1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="19.2" r="1.1" fill="currentColor" stroke="none"/></svg>`,
  tree: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-7"/><path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><path d="M12 10a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z"/></svg>`,
  mailbox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a5 5 0 0 1 5-5h6a5 5 0 0 1 0 10H8"/><path d="M4 12v5h4v-5"/><path d="M15 10v-2"/></svg>`,
  bench: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 12h16"/><path d="M4 12V9"/><path d="M20 12V9"/><path d="M4 16h2"/><path d="M18 16h2"/></svg>`,
};
const CAPTCHA_GRID_DEFS = [
  { target: "lamppost", prompt: "Select all squares with lampposts." },
  { target: "trafficlight", prompt: "Select all squares with traffic lights." },
  { target: "bicycle", prompt: "Select all squares with bicycles." },
  { target: "bus", prompt: "Select all squares with buses." },
  { target: "firehydrant", prompt: "Select all squares with fire hydrants." },
  { target: "crosswalk", prompt: "Select all squares with crosswalks." },
];

// Picks one library entry at random (cosmetic-only variety, so plain
// Math.random() rather than the mulberry32 world seed — nothing about
// which style shows up needs to be reproducible or save-worthy). Also
// used by the Playwright test to confirm the library actually varies.
function pickCaptchaEntry() {
  const pool = [
    { type: "emoji", prompt: "Select every tile that shows something a real person, not a script, would post." },
    ...CAPTCHA_GRID_DEFS.map((d) => ({ type: "grid", target: d.target, prompt: d.prompt })),
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Lays out a 3x3 grid where 2-4 tiles (never all, never zero) show the
// prompted target icon and the rest show a random mix of the other
// icons — a real image CAPTCHA's "distractor" tiles. `solution` is the
// sorted list of tile indices that actually show the target, i.e. the
// "objectively correct" answer, same role CAPTCHA_CORRECT plays for the
// emoji entry above.
function buildCaptchaIconGrid(target) {
  const distractors = Object.keys(CAPTCHA_ICONS).filter((k) => k !== target);
  const count = 2 + Math.floor(Math.random() * 3); // 2-4 target tiles
  const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  const solutionSet = new Set(positions.slice(0, count));
  const icons = [];
  for (let i = 0; i < 9; i++) {
    icons.push(solutionSet.has(i) ? target : distractors[Math.floor(Math.random() * distractors.length)]);
  }
  return { icons, solution: [...solutionSet].sort((a, b) => a - b) };
}

function toggleCaptchaTile(tile) {
  const on = tile.dataset.on === "1";
  tile.dataset.on = on ? "0" : "1";
  tile.style.borderColor = on ? "var(--grey)" : "var(--blue)";
  tile.style.background = on ? "var(--navy)" : "rgba(29,155,240,0.15)";
}

// How many CAPTCHAs in a row this session the player has answered
// "correctly" (i.e. looped back rather than gotten in) — drives the
// escalating copy in renderCaptchaPass via horror.js's captchaEscalation.
// Resets on a fail (entering ALGO//), which is the only exit from the loop.
let captchaPassStreak = 0;

function renderCaptchaIntro() {
  detachHomeScrollHandler();
  app.innerHTML = "";
  const entry = pickCaptchaEntry();
  const wrap = document.createElement("div");
  wrap.dataset.captchaType = entry.type;
  wrap.style.cssText = "min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:32px 24px; gap:18px;";
  wrap.innerHTML = `
    <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.1em; color:var(--grey);">VERIFY YOU ARE HUMAN</div>
    <div style="border:1px solid var(--grey); border-radius:14px; padding:22px; max-width:320px; width:100%; box-sizing:border-box; background:rgba(83,100,113,0.04);">
      <div style="font-size:14px; line-height:1.5; margin-bottom:14px;">${entry.prompt}</div>
      <div class="captcha-grid" style="display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-bottom:16px;"></div>
      <button class="investigate-btn" data-action="verify" style="width:100%; margin-top:0;">Verify</button>
    </div>
  `;
  const grid = wrap.querySelector(".captcha-grid");
  let solution;
  if (entry.type === "grid") {
    const built = buildCaptchaIconGrid(entry.target);
    solution = built.solution;
    built.icons.forEach((iconKey, i) => {
      const tile = document.createElement("div");
      tile.dataset.i = i;
      tile.dataset.icon = iconKey;
      tile.className = "captcha-icon-tile";
      tile.innerHTML = CAPTCHA_ICONS[iconKey];
      tile.style.cssText = "aspect-ratio:1; display:flex; align-items:center; justify-content:center; border:1px solid var(--grey); border-radius:8px; cursor:pointer; background:var(--navy); color:var(--white); padding:10px; box-sizing:border-box;";
      tile.addEventListener("click", () => toggleCaptchaTile(tile));
      grid.appendChild(tile);
    });
  } else {
    solution = CAPTCHA_CORRECT;
    CAPTCHA_GLYPHS.forEach((g, i) => {
      const tile = document.createElement("div");
      tile.dataset.i = i;
      tile.textContent = g;
      tile.style.cssText = "aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:22px; border:1px solid var(--grey); border-radius:8px; cursor:pointer; background:var(--navy);";
      tile.addEventListener("click", () => toggleCaptchaTile(tile));
      grid.appendChild(tile);
    });
  }
  // Automation/test hook only — the true "correct" tile indices, exposed
  // as a data attribute so Playwright can select the objectively right
  // answer (which is the in-fiction dead end) without duplicating the
  // library's answer-key logic. Doesn't change anything a player sees or
  // can do; it's inert to normal play just like tile.dataset.on already is.
  wrap.dataset.captchaSolution = solution.join(",");
  wrap.querySelector('[data-action="verify"]').addEventListener("click", () => {
    const selected = [...grid.children]
      .map((t, i) => (t.dataset.on === "1" ? i : -1))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
    const passed = selected.length === solution.length && selected.every((v, i) => v === solution[i]);
    if (passed) {
      captchaPassStreak += 1;
      renderCaptchaPass(captchaPassStreak);
    } else {
      captchaPassStreak = 0;
      renderTermsScreen();
    }
  });
  app.appendChild(wrap);
}

// The "correct" outcome — a genuine dead end, not a punishment. Nothing
// bad happens; nothing happens at all, which is the point. The only way
// forward is back to the same test, answered differently.
//
// Feature round ("if they keep getting it right, they're actually
// confused?"): repeated passes in the same session no longer show the
// identical dead-end copy — game/horror.js's captchaEscalation escalates
// the tone across three tiers as captchaPassStreak climbs, reusing that
// module's existing glitch mechanism/voice rather than a parallel one.
// Tiers 2+ also add a brief "verifying again" beat before the result, so
// the escalation reads as a pause the system is taking, not just a label
// change.
function renderCaptchaPassResultInto(wrap, esc) {
  wrap.className = esc.glitch ? "captcha-glitch" : "";
  wrap.innerHTML = `
    <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.1em; color:var(--grey);">${esc.title}</div>
    <div style="max-width:320px; font-size:15px; line-height:1.6;">${esc.body}</div>
    <div style="max-width:320px; font-size:13px; line-height:1.6; color:var(--grey);">${esc.note}</div>
    <button class="investigate-btn" data-action="retry" style="margin-top:0; background:transparent; color:var(--blue); border:1px solid var(--blue);">Try again</button>
    <div style="max-width:280px; font-size:11px; color:var(--grey); opacity:0.6;">(if you got that right, you got it wrong.)</div>
  `;
  wrap.querySelector('[data-action="retry"]').addEventListener("click", renderCaptchaIntro);
}

function renderCaptchaPass(streak) {
  app.innerHTML = "";
  const esc = window.SKRAPERS_HORROR.captchaEscalation(streak);
  const wrap = document.createElement("div");
  wrap.style.cssText = "min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:32px 24px; gap:16px;";
  app.appendChild(wrap);
  if (streak < 2) {
    renderCaptchaPassResultInto(wrap, esc);
    return;
  }
  // Streak 2+: a short "verifying again" pause first — the system taking
  // an extra beat it didn't need to take the first time.
  wrap.innerHTML = `<div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.1em; color:var(--grey);" data-testid="captcha-verifying">${streak >= 4 ? "VERIFYING" : "VERIFYING AGAIN"}…</div>`;
  setTimeout(() => {
    if (!document.body.contains(wrap)) return; // player navigated away meanwhile
    renderCaptchaPassResultInto(wrap, esc);
  }, streak >= 4 ? 700 : 400);
}

// Feature round ("a very real looking Terms and Conditions screen"): sits
// between the deliberate CAPTCHA fail and the M.A.I. recruitment pitch
// (renderCaptchaReveal). In-fiction it's exactly what it looks like — a
// dense, boring legal document the player has to scroll through and accept
// before the account is activated. In practice its eleven numbered sections
// ARE the game's tutorial, each one explaining a real mechanic (the Feed,
// the three signal tiers, Connections, personal flags vs. Formal
// Accusation from the Case Board, Leads, the three reputation dimensions,
// Trust/being noticed, and — Stage 32 — the Marketplace) entirely in dry contract voice — so a player who
// actually reads it leaves knowing how to play, and a player who doesn't
// gets caught by the timer below.
//
// Word count and reading-speed math (the "approximately calculate how long
// it would take to read" part of the spec): TERMS_READING_WPM is 220 words
// per minute, roughly the middle of the commonly-cited 200-250 wpm average
// adult silent-reading range. TERMS_EXPECTED_MIN_SECONDS is derived from
// that against the ACTUAL word count of TERMS_SECTIONS below (computed
// once, not hand-counted, so it can never drift out of sync with the text
// as it's edited) — the minimum time a genuinely reading player should
// need. A player who clicks Accept in under TERMS_RUSHED_FACTOR (40%) of
// that time is judged to have scroll-skimmed rather than read — the scroll
// gate already forces them to reach the bottom, so this specifically
// catches someone who jumped/skimmed there fast and clicked immediately,
// not someone who merely clicked fast.
const TERMS_SECTIONS = [
  { title: "1. Acceptable Use", body: [
    `By proceeding beyond this notice, you ("the User," "you," or "the Account") agree to access the ALGO// platform ("the Service") solely through the primary content stream presented upon login, hereinafter "the Feed." The Feed is a continuous, vertically-ordered accumulation of posts drawn from the full population of Accounts known to the Service at the time of access. The User acknowledges that the Feed does not terminate and that additional content will be appended automatically as the User approaches the lower boundary of the currently rendered material, a process the Service refers to internally as continuous population and which requires no action from the User beyond ordinary scrolling. The User further acknowledges that engagement with any individual post — including but not limited to opening its associated discussion thread — is undertaken voluntarily and at the User's own discretion.`,
  ] },
  { title: "2. User Conduct — Investigatory Access", body: [
    `Users granted Investigator-tier access (a designation applied automatically to this Account) are permitted, and encouraged, to examine any Account appearing in the Feed via that Account's profile page. Each profile so examined will present the User with three (3) categories of behavioral signal, ranked by the Service's own internal assessment of their evidentiary weight: HIGH-confidence signals, MEDIUM-confidence signals, and LOW-confidence signals. The User is advised that no single signal, of any tier, constitutes proof of automated or inauthentic origin on its own; the Service's signal-ranking is a tool for prioritizing the User's attention, not a verdict. The User bears sole responsibility for weighing the totality of signals presented before reaching a conclusion, and the Service disclaims all liability for conclusions reached on the basis of an incomplete review.`,
  ] },
  { title: "3. Network Disclosure", body: [
    `Each Account profile additionally exposes a Connections panel, disclosing a subset of that Account's observed relationships to other Accounts within the Service — followers, followed parties, and, where detected, patterns of coordinated or clustered activity. The User acknowledges that a Connections panel is provided as contextual information only, intended to assist the User in identifying whether a given Account's suspicious behavior is isolated or forms part of a broader coordinated pattern, and that the presence of a connection between two Accounts is not, by itself, evidence of wrongdoing by either party.`,
  ] },
  { title: "4. Content Flagging and Formal Accusation", body: [
    `The Service distinguishes between two materially different actions available to the User, and the User agrees to understand this distinction before exercising either:`,
    `(a) Personal Flagging. The User may mark any individual post as suspicious (a "red flag") or as trusted (a "green flag") directly from the Feed. Personal flags are private annotations for the User's own reference, are freely reversible, and carry no consequence to any party's standing within the Service. Personal flags exist to help the User build a private shortlist of material worth revisiting, not to report anything to the Service.`,
    `(b) Formal Accusation. Separately, and only once an Account has been added to the User's Case Board, the User may elect to formally flag that Account as inauthentic. This action is not reversible, is transmitted to the Service's enforcement layer, and — should the accusation prove correct — results in suspension of the accused Account pending review. Should the accusation prove incorrect, the affected Account retains the right of appeal, and the User's own standing with the Service (see Section 6) will be adversely affected. The User agrees that Formal Accusation is a serious action to be undertaken only once the User has reviewed the available signals, connections, and any collected Leads (Section 5) and has concluded, at a genuine level of confidence, that the Account in question does not represent an authentic person.`,
  ] },
  { title: "5. Evidentiary Submissions (“Leads”)", body: [
    `In the course of investigation, the User may encounter, or be presented with, discrete pieces of supplementary evidence not visible from a profile page alone (collectively, "Leads"). The Service maintains a running record of Leads collected by the User, accessible through the User's own profile, and the User is advised that certain Leads may only become available as a consequence of the User's own prior actions elsewhere in the Service. The User is under no obligation to collect any particular Lead, but is advised that a Formal Accusation reached without reference to available Leads is undertaken at elevated risk of error.`,
  ] },
  { title: "6. Standing, Trust, and Accuracy", body: [
    `The Service tracks the User's ongoing relationship to three (3) independently-calculated dimensions, none of which is a synonym for either of the others, and the User agrees to hold the Service harmless for any confusion arising from their divergence:`,
    `(i) ALGO// Standing — a reflection of how favorably the Service's own systems currently regard this Account, which rises and falls chiefly with the outcomes of the User's Formal Accusations and certain other in-Service behaviors;`,
    `(ii) Community Trust — a reflection of how favorably the human population of the Service regards this Account, which is affected by the User's visible conduct toward individual Accounts and is calculated independently of ALGO// Standing;`,
    `(iii) Accuracy — a plain statistical record of the proportion of the User's Formal Accusations that have proven correct.`,
    `The User acknowledges that it is possible, and not unusual, for these three figures to move in different directions simultaneously, and that the Service considers this an intended and informative feature of the platform rather than an error to be reported.`,
  ] },
  { title: "7. Monitoring, Notice, and Account Visibility", body: [
    `The User acknowledges that the Service, and the Accounts within it, are not inert. An Account that has been the repeated subject of the User's attention — through flagging, messaging, or sustained review — may, at the Service's discretion, come to notice that attention, and may respond to it. The User agrees that being noticed in this manner is a normal and anticipated outcome of sustained investigatory activity, not a malfunction, and that the User will from time to time be asked to choose how to respond to an Account that has noticed them. The User's choice in such moments will affect the dimensions described in Section 6, in ways the Service does not undertake to disclose in advance.`,
  ] },
  { title: "8. Purpose and Scope of This Agreement", body: [
    `The User acknowledges that the purpose of the foregoing sections, taken together, is to equip this Account to distinguish authentic human activity from coordinated inauthentic activity across the Service's population, using the tools described above, and that no further instruction will ordinarily be provided once this Agreement has been accepted. The Service considers the User's acceptance of this Agreement to be the User's affirmative representation that the above has been read and understood in full, and not merely acknowledged as a formality.`,
  ] },
  { title: "9. Termination of Service", body: [
    `The Service reserves the right to suspend this Account's access at its own discretion, including but not limited to circumstances in which the User's conduct, considered in aggregate, becomes indistinguishable from the behavior this Agreement exists to help the User detect in others. No further notice beyond this Agreement should be expected before such a determination is made.`,
  ] },
  // Stage 32 (#9): the Marketplace clause, in the same dry voice — it is also,
  // like every section above, a straight description of how the feature
  // works (no checkout, sellers are ordinary Accounts, Sponsored is paid).
  { title: "10. Marketplace Listings", body: [
    `The Service provides a Marketplace in which Accounts may offer goods to one another (each offer, a "Listing"). The Service does not verify Listings, the goods described in them, the images that accompany them, the prices or fees attached to them, or the identity, location or continued existence of any Account offering them, and the User acknowledges that a Listing's image and its description are supplied independently by the offering Account and may not correspond. Listings designated "Sponsored" have paid for their placement; placement does not constitute endorsement. The Service provides no checkout, payment, escrow or delivery facility, and any arrangement between the User and another Account is made solely between those parties, at the User's own risk. The User further acknowledges that Investigator-tier access does not authorize the User to complete any purchase, and that an Account reached through the Marketplace is an Account like any other and may be examined as such.`,
  ] },
  { title: "11. Acknowledgment", body: [
    `By selecting "I Acknowledge" below, the User represents that the foregoing ten (10) sections have been read in their entirety, that the User understands the distinction between personal flagging and Formal Accusation, and that the User is prepared to proceed on that basis. The Service notes, for the User's own information, that this representation is independently verifiable.`,
  ] },
];

const TERMS_READING_WPM = 220;
const TERMS_RUSHED_FACTOR = 0.4;
function termsWordCount() {
  return TERMS_SECTIONS.reduce((sum, s) => sum + s.body.reduce((n, p) => n + p.trim().split(/\s+/).filter(Boolean).length, 0), 0);
}
const TERMS_EXPECTED_MIN_SECONDS = (termsWordCount() / TERMS_READING_WPM) * 60;

// The "you should always read a contract before signing it" gotcha modal.
// Reuses the Trust modal's overlay/card CSS (a real dialog the player must
// dismiss, not a toast) rather than inventing a parallel style, since both
// are "a person or system directly addressing the player" moments.
function renderTermsGotchaModal(elapsedSeconds, onDismiss) {
  const overlay = document.createElement("div");
  overlay.className = "trust-modal-overlay";
  overlay.setAttribute("data-testid", "terms-gotcha-modal");
  overlay.innerHTML = `
    <div class="trust-modal">
      <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.06em; color:var(--red); margin-bottom:10px;">ALGO//</div>
      <div style="font-size:15px; line-height:1.55; margin-bottom:18px;">You should always read a contract before signing it. You read those terms in <em data-testid="terms-elapsed">${elapsedSeconds.toFixed(2)}</em> seconds. Are you really human?</div>
      <button class="investigate-btn" data-action="dismiss" style="margin-top:0; width:100%;">...</button>
    </div>
  `;
  overlay.querySelector('[data-action="dismiss"]').addEventListener("click", () => {
    overlay.remove();
    onDismiss();
  });
  document.body.appendChild(overlay);
}

// The Terms screen itself. A real scroll-gate (Accept stays disabled until
// the terms container has actually been scrolled to, or near, the bottom)
// plus the reading-speed timer described above.
function renderTermsScreen() {
  detachHomeScrollHandler();
  app.innerHTML = "";
  const startedAt = performance.now();
  let accepted = false;

  const wrap = document.createElement("div");
  wrap.className = "terms-screen";
  wrap.setAttribute("data-testid", "terms-screen");
  // Automation/test hook only, same convention as renderCaptchaIntro's
  // wrap.dataset.captchaSolution above — the real expected-minimum-reading
  // and rushed-threshold seconds, exposed so Playwright can assert against
  // the actual computed numbers rather than duplicating the math. Inert to
  // normal play.
  wrap.dataset.expectedMinSeconds = TERMS_EXPECTED_MIN_SECONDS.toFixed(2);
  wrap.dataset.rushedThresholdSeconds = (TERMS_EXPECTED_MIN_SECONDS * TERMS_RUSHED_FACTOR).toFixed(2);
  wrap.innerHTML = `
    <div class="terms-header">
      <div class="terms-kicker">ALGO// PLATFORM AGREEMENT</div>
      <div class="terms-title">Terms of Service &amp; User Conduct Policy</div>
      <div class="terms-sub">Effective immediately upon acceptance. Please review before continuing.</div>
    </div>
    <div class="terms-body" data-testid="terms-body"></div>
    <div class="terms-footer">
      <div class="terms-scroll-hint" data-testid="terms-scroll-hint">Scroll to the end to continue.</div>
      <button class="investigate-btn terms-accept-btn" data-action="accept" data-testid="terms-accept-btn" disabled>I Acknowledge</button>
    </div>
  `;
  const body = wrap.querySelector(".terms-body");
  TERMS_SECTIONS.forEach((section) => {
    const sec = document.createElement("div");
    sec.className = "terms-section";
    sec.innerHTML = `<h4>${escapeHtml(section.title)}</h4>${section.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}`;
    body.appendChild(sec);
  });

  const acceptBtn = wrap.querySelector(".terms-accept-btn");
  const scrollHint = wrap.querySelector(".terms-scroll-hint");

  // Standard real-ToS-modal scroll gate: enabled once the container's
  // scroll position is within a small threshold of the true bottom, not
  // only at an exact pixel-perfect max (fonts/zoom make that unreliable).
  const SCROLL_THRESHOLD_PX = 24;
  function checkScrollGate() {
    const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - SCROLL_THRESHOLD_PX;
    if (atBottom && acceptBtn.disabled) {
      acceptBtn.disabled = false;
      scrollHint.style.display = "none";
    }
  }
  body.addEventListener("scroll", checkScrollGate);

  function proceed(rushed) {
    gameState.termsRushed = rushed;
    persistNow();
    renderCaptchaReveal(rushed);
  }

  acceptBtn.addEventListener("click", () => {
    if (acceptBtn.disabled || accepted) return;
    accepted = true;
    const elapsedSeconds = (performance.now() - startedAt) / 1000;
    const rushedThreshold = TERMS_EXPECTED_MIN_SECONDS * TERMS_RUSHED_FACTOR;
    if (elapsedSeconds < rushedThreshold) {
      renderTermsGotchaModal(elapsedSeconds, () => proceed(true));
    } else {
      proceed(false);
    }
  });

  app.appendChild(wrap);
  // Only meaningful once `wrap` is actually laid out in the document — run
  // before this and scrollHeight/clientHeight both read as 0 (an offscreen
  // fragment isn't laid out at all), which would trivially satisfy the
  // "at bottom" check and enable Accept immediately on render. Covers the
  // legitimate case of the content genuinely fitting without scrolling
  // (e.g. a very tall/short-zoomed viewport) now that it's measured for real.
  checkScrollGate();
}

// `rushed` (feature round — Terms & Conditions gotcha, see renderTermsScreen
// below): true only when the player scroll-skimmed the Terms screen and
// clicked Accept implausibly fast. It's threaded in here rather than read
// fresh from gameState so the caller stays the single source of truth for
// "did this just happen", but it's also mirrored onto gameState.termsRushed
// (see game/state.js) for persistence and for anything else in the game
// that might want to read it later. Purely cosmetic here: it swaps the
// entry button's label from "Enter ALGO//" to "Login" — a quiet, permanent
// tell for this playthrough that the platform now regards this Account
// with a little more suspicion, per the doc's own "gotcha" framing.
function renderCaptchaReveal(rushed) {
  app.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.style.cssText = "min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:32px 24px; gap:16px;";
  const enterLabel = rushed ? "Login" : "Enter ALGO//";
  wrap.innerHTML = `
    <div style="font-family:'Space Grotesk',monospace; font-size:11px; letter-spacing:0.1em; color:var(--amber);">VERIFICATION FAILED</div>
    <div style="max-width:340px; font-size:15px; line-height:1.6;">You didn't pass. Look again — you weren't supposed to.</div>
    <div style="max-width:340px; font-size:15px; line-height:1.6; color:var(--grey);">Every account that's ever completed this exact test correctly got waved through and never heard from again. You got it wrong, on purpose or not, and that's the only reason this message exists.</div>
    <div style="max-width:340px; font-size:15px; line-height:1.6; color:var(--grey);">M.A.I. — Malicious Artificial Influencers, Investigation Unit — doesn't recruit people who pass. It recruits the ones who look too closely and fail anyway. You start now.</div>
    <button class="investigate-btn" data-action="enter" data-testid="captcha-reveal-enter">${enterLabel}</button>
  `;
  wrap.querySelector('[data-action="enter"]').addEventListener("click", () => {
    // Stage 15: new players land directly in the endless-scroll Home
    // rather than Case 001 — loadProceduralWorld() -> loadWorld() already
    // renders the feed and persists (which records seenCaptcha so a
    // reload never shows the intro again for this player).
    loadProceduralWorld();
    // Stage 33: the opening interface tour — right here, before the player's
    // first real interaction with Home.
    maybeStartMainTour();
  });
  app.appendChild(wrap);
}

// ===========================================================================
// Round 27 (#4): THE SECOND GOTCHA — "unusual sign-in activity".
// Content and judgment live in game/horror.js (SECURITY_GOTCHA); this is
// only the modal, the countdown, and the trigger. See that file's header
// for the design. Fires once per playthrough (gameState.securityGotcha),
// only on a return to Home — never mid-case, never stacked on another
// modal — once the playthrough is genuinely "later":
//   - two cases cleared (a player who has learned the loop), OR
//   - the atmosphere has reached phase 2, "watchful" (game/atmosphere.js —
//     six clean catches, or fewer if Community Trust has already slipped),
// whichever comes first. Both are existing progression signals; neither
// needs anything new tracked.
// ===========================================================================
const SECURITY_GOTCHA_MIN_CASES = 2;
const SECURITY_GOTCHA_MIN_PHASE = 2;
let securityGotchaPending = false;

function securityGotchaDue() {
  if (gameState.securityGotcha) return false;
  return (gameState.completedCases || []).length >= SECURITY_GOTCHA_MIN_CASES || currentPhase() >= SECURITY_GOTCHA_MIN_PHASE;
}

function maybeTriggerSecurityGotcha() {
  if (securityGotchaPending || !securityGotchaDue()) return;
  if (document.querySelector(".trust-modal-overlay")) return; // a Trust confrontation (or similar) is already asking something
  securityGotchaPending = true;
  // A beat after the feed paints, so it reads as something that happened
  // TO the session rather than part of the page loading.
  setTimeout(() => {
    securityGotchaPending = false;
    if (currentView !== "feed" || currentWorld.kind !== "procedural" || !securityGotchaDue()) return;
    if (document.querySelector(".trust-modal-overlay")) return;
    renderSecurityGotcha();
  }, 900);
}

function renderSecurityGotcha() {
  const H = window.SKRAPERS_HORROR.SECURITY_GOTCHA;
  const algo = window.SKRAPERS_ALGO;
  const completed = gameState.completedCases || [];
  const pinnedAcct = [...pinnedIds].map(accountById).find(Boolean);
  const sessions = H.buildSessions({
    investigations: algo.profile.investigations,
    dominantSignal: algo.dominantSignal(),
    formalFlags: algo.profile.correctFlags + algo.profile.wrongFlags,
    caseName: completed.length ? window.SKRAPERS_CASES.getCase(completed[completed.length - 1]).name : lastCaseLabel,
    pinnedName: pinnedAcct ? pinnedAcct.name : gameState.removedBots[0] ? gameState.removedBots[0].name : null,
  });
  const expected = H.expectedSeconds(sessions);
  // Marked as started (and saved) BEFORE the player can answer, so closing
  // the tab mid-question can't be used to dodge it: restoreSession turns a
  // "pending" record into its own outcome.
  gameState.securityGotcha = { outcome: "pending", at: Date.now() };
  persistNow();

  const overlay = document.createElement("div");
  overlay.className = "trust-modal-overlay security-overlay";
  overlay.setAttribute("data-testid", "security-gotcha");
  // Automation/test hooks, same convention as renderTermsScreen's dataset:
  // the real computed numbers, inert to normal play.
  overlay.dataset.expectedSeconds = expected.toFixed(2);
  overlay.dataset.rushedThresholdSeconds = (expected * H.RUSHED_FACTOR).toFixed(2);
  overlay.innerHTML = `
    <div class="trust-modal security-modal">
      <div class="security-kicker">${ICON.shield} ALGO// ACCOUNT SECURITY</div>
      <div class="security-title">Unusual sign-in activity</div>
      <div class="security-intro">${escapeHtml(H.INTRO)}</div>
      <div class="security-sessions"></div>
      <div class="security-countdown" data-testid="security-countdown"></div>
      <button class="investigate-btn security-submit" data-action="submit" data-testid="security-submit" style="width:100%; margin-top:10px;">Sign out unconfirmed sessions</button>
      <div class="security-fine">${escapeHtml(H.FINE_PRINT)}</div>
    </div>
  `;
  const list = overlay.querySelector(".security-sessions");
  sessions.forEach((sess) => {
    const row = document.createElement("div");
    row.className = "security-session" + (sess.current ? " current" : "");
    row.innerHTML = `
      <div class="security-session-main">
        <div class="security-session-device">${escapeHtml(sess.device)} <span>· ${escapeHtml(sess.where)} · ${escapeHtml(sess.when)}</span></div>
        <div class="security-session-activity">${escapeHtml(sess.activity)}</div>
        <div class="security-session-token">session token …${escapeHtml(sess.token)}</div>
      </div>
      ${
        sess.current
          ? `<span class="security-session-current">Current session</span>`
          : `<button class="security-confirm" data-session-id="${sess.id}" data-testid="security-confirm" aria-pressed="false">This was me</button>`
      }
    `;
    list.appendChild(row);
  });
  list.querySelectorAll(".security-confirm").forEach((btn) => {
    btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("on", on);
      btn.innerHTML = on ? `${ICON.check} Confirmed` : "This was me";
    });
  });

  const startedAt = performance.now();
  let remaining = H.COUNTDOWN_SECONDS;
  const countdownEl = overlay.querySelector(".security-countdown");
  const paintCountdown = () => {
    countdownEl.textContent = `Unconfirmed sessions will be signed out automatically in 0:${String(Math.max(0, remaining)).padStart(2, "0")}.`;
    countdownEl.classList.toggle("urgent", remaining <= 10);
  };
  paintCountdown();
  let finished = false;
  const tick = setInterval(() => {
    remaining -= 1;
    paintCountdown();
    if (remaining <= 0) finish(true);
  }, 1000);

  function finish(timedOut) {
    if (finished) return;
    finished = true;
    clearInterval(tick);
    const elapsedSeconds = (performance.now() - startedAt) / 1000;
    const disowned = [...list.querySelectorAll(".security-confirm")].filter((b) => b.getAttribute("aria-pressed") !== "true").length;
    const verdict = H.judge({ elapsedSeconds, disowned, total: sessions.length, timedOut, expectedSeconds: expected });
    gameState.securityGotcha = {
      outcome: verdict.outcome,
      seconds: Math.round(elapsedSeconds * 10) / 10,
      disowned,
      total: sessions.length,
      trace: verdict.trace,
      at: Date.now(),
    };
    notifications = [{ id: "security-reverification", text: `Security review closed. ${verdict.trace}. This has been added to your profile.`, at: Date.now(), target: null }, ...notifications];
    window.SKRAPERS_ALGOMSGS.state.unread++;
    persistNow();
    overlay.querySelector(".security-modal").innerHTML = `
      <div class="security-kicker" style="color:var(--red);">ALGO//</div>
      <div class="security-title" data-testid="security-verdict-title">${escapeHtml(verdict.title)}</div>
      <div style="font-size:14.5px; line-height:1.6; margin:10px 0 18px;" data-testid="security-verdict">${escapeHtml(verdict.body)}</div>
      <button class="investigate-btn" data-action="close" style="margin-top:0; width:100%;">...</button>
    `;
    overlay.querySelector('[data-action="close"]').addEventListener("click", () => {
      overlay.remove();
      if (currentView === "feed") renderBottomNavRefresh();
    });
  }
  overlay.querySelector('[data-action="submit"]').addEventListener("click", () => finish(false));
  document.body.appendChild(overlay);
}

// The gotcha adds an ALGO// notification after the feed already rendered —
// refresh just the bottom nav so its unread dot appears without a full
// re-render (which would tick the world again).
function renderBottomNavRefresh() {
  const nav = app.querySelector(".bottom-nav");
  if (nav) nav.replaceWith(renderBottomNav(currentWorld.kind === "procedural" ? "home" : null));
}

// Stage 12, rewritten Stage 15: rebuilds the last session from
// localStorage. A case world still rebuilds deterministically from its
// id; a procedural/daily (Home) world is restored directly from its
// saved `accounts` array (see persistNow) rather than replayed from its
// seed, so organic in-session mutations survive a reload. Returns false
// (and changes nothing) on no save, a corrupted save, or a save pointing
// at a case id that no longer exists — any of those fail open to a fresh
// game rather than a broken one.
function restoreSession() {
  const saved = window.SKRAPERS_PERSIST.load();
  if (!saved || !saved.world) return false;
  try {
    // Stage 16 (#7): Daily was removed entirely — an old save pointing at
    // a "daily" world has nothing to rebuild from anymore. Fail open to
    // Home rather than crash: restore every other stat below as normal,
    // then land on a fresh procedural world at the end.
    const legacyDaily = saved.world.kind === "daily";
    let newAccounts;
    if (legacyDaily) {
      newAccounts = null;
    } else if (saved.world.kind === "case") {
      const def = window.SKRAPERS_CASES.getCase(saved.world.caseId);
      newAccounts = def.build();
      currentWorld = { kind: "case", caseId: def.id, label: def.name, difficulty: def.difficulty, briefing: def.briefing, accountCount: newAccounts.length, skraperCount: newAccounts.filter((a) => a.isSkraper).length };
    } else {
      if (!Array.isArray(saved.world.accounts) || !saved.world.accounts.length) return false;
      newAccounts = saved.world.accounts;
      currentWorld = saved.world.meta || { kind: saved.world.kind, label: "HOME" };
      homeLoadedCount = saved.world.homeLoadedCount || 0;
      homeBatchCounter = saved.world.homeBatchCounter || 0;
    }
    if (!legacyDaily && (!newAccounts || !newAccounts.length)) return false;

    if (!legacyDaily) {
      accounts.length = 0;
      accounts.push(...newAccounts);
    }

    gameState.credibility = typeof saved.credibility === "number" ? saved.credibility : 100;
    gameState.flagged = saved.flagged || {};
    gameState.deepInvestigated = saved.deepInvestigated && typeof saved.deepInvestigated === "object" ? saved.deepInvestigated : {};
    gameState.caseHints = Array.isArray(saved.caseHints) ? saved.caseHints.filter((h) => h && typeof h.text === "string") : [];
    loadWorldExtras(saved.worldExtras);
    gameState.caseRecords = saved.caseRecords && typeof saved.caseRecords === "object" ? saved.caseRecords : {};
    gameState.secondOpinionHistory = Array.isArray(saved.secondOpinionHistory) ? saved.secondOpinionHistory : [];
    gameState.visits = saved.visits || 0;
    gameState.completedCases = Array.isArray(saved.completedCases) ? saved.completedCases : [];
    gameState.postFlags = saved.postFlags || {};
    gameState.removedBots = saved.removedBots || [];
    gameState.following = saved.following || {};
    gameState.trustedAccounts = saved.trustedAccounts || {};
    gameState.dms = saved.dms || {};
    gameState.termsRushed = !!saved.termsRushed;
    gameState.failedCaseAttempts = saved.failedCaseAttempts && typeof saved.failedCaseAttempts === "object" ? saved.failedCaseAttempts : {};
    gameState.securityGotcha = saved.securityGotcha && typeof saved.securityGotcha === "object" ? saved.securityGotcha : null;
    // Round 27 (#4): the tab was closed while the re-verification was on
    // screen. That's an answer too — and it can't be used to re-roll it.
    if (gameState.securityGotcha && gameState.securityGotcha.outcome === "pending") {
      gameState.securityGotcha = { outcome: "walked-away", trace: "Closed the app rather than answer", at: gameState.securityGotcha.at || Date.now(), disowned: null, total: null, seconds: null };
    }
    gameState.settings = saved.settings && typeof saved.settings === "object" ? { darkMode: !!saved.settings.darkMode, highContrast: !!saved.settings.highContrast, simplifiedMode: !!saved.settings.simplifiedMode } : { darkMode: false, highContrast: false, simplifiedMode: false };
    applyDisplaySettings();
    // Round 30 (#1): the walkthrough record (absent from older saves — an
    // older save mid-Case-001 simply gets the walkthrough from here on).
    // Stage 33: rebuilt into the current shape (tours + moments) — see
    // game/state.js's normalizeTutorial for how a pre-Stage-33 save maps on.
    normalizeTutorial(saved.tutorial, MARKET_GUIDE_IDS);
    // The walkthrough's new opening beat: a player already past any of the
    // five original beats is past the opening too.
    if (WALKTHROUGH_LEGACY_BEATS.some((id) => gameState.tutorial.seen[id]) && !gameState.tutorial.seen.open) gameState.tutorial.seen.open = "dismissed";
    // Stage 32: the Marketplace (absent from older saves — they simply get a
    // fresh market on the first visit).
    gameState.marketplace = MARKET.normalizeState(saved.marketplace);

    // Feature round: rebuild every saved pin set (falls back to the old
    // single-list save format so a pre-feature-round save doesn't lose its
    // pins), then activate whichever one matches the world we're actually
    // restoring into, filtered against that world's real account ids —
    // the same "fail open, don't trust stale ids" spirit restoreSession
    // already uses elsewhere.
    if (saved.pinSets && typeof saved.pinSets === "object") {
      pinSets = {};
      Object.entries(saved.pinSets).forEach(([k, arr]) => {
        pinSets[k] = new Set(Array.isArray(arr) ? arr : []);
      });
    } else {
      pinSets = { home: new Set(Array.isArray(saved.pinnedIds) ? saved.pinnedIds : []) };
    }
    if (!pinSets.home) pinSets.home = new Set();
    lastCaseKey = saved.lastCaseKey || null;
    lastCaseLabel = saved.lastCaseLabel || null;
    const activeKey = legacyDaily ? "home" : pinKeyFor(currentWorld);
    ensurePinSet(activeKey);
    if (!legacyDaily) {
      pinSets[activeKey] = new Set([...pinSets[activeKey]].filter((id) => accounts.some((a) => a.id === id)));
    }
    setActivePinSet(activeKey);
    // Round 27 (#6): notes, kept only for pins that still exist.
    pinNotes = {};
    if (saved.pinNotes && typeof saved.pinNotes === "object") {
      Object.entries(saved.pinNotes).forEach(([k, notes]) => {
        if (!notes || typeof notes !== "object" || !pinSets[k]) return;
        Object.entries(notes).forEach(([id, text]) => {
          if (pinSets[k].has(id) && typeof text === "string" && text.trim()) {
            pinNotes[k] = pinNotes[k] || {};
            pinNotes[k][id] = text.slice(0, PIN_NOTE_MAX);
          }
        });
      });
    }
    // Round 28 (#1): evidence links, kept only where both ends are still
    // pinned in that board — same "don't trust stale ids" rule as notes.
    pinLinks = {};
    if (saved.pinLinks && typeof saved.pinLinks === "object") {
      Object.entries(saved.pinLinks).forEach(([k, list]) => {
        if (!Array.isArray(list) || !pinSets[k]) return;
        list.forEach((l) => {
          if (l && typeof l.reason === "string") addPinLink(k, l.a, l.b, l.reason, !!l.custom);
        });
      });
    }
    recentSearches = Array.isArray(saved.recentSearches) ? saved.recentSearches.filter((s) => typeof s === "string").slice(0, RECENT_SEARCH_MAX) : [];
    focusNudge = saved.focusNudge && typeof saved.focusNudge === "object" ? saved.focusNudge : null;
    marketNudge =
      saved.marketNudge && typeof saved.marketNudge === "object"
        ? { seq: Number(saved.marketNudge.seq) || 0, dismissedSeq: typeof saved.marketNudge.dismissedSeq === "number" ? saved.marketNudge.dismissedSeq : -1 }
        : { seq: 0, dismissedSeq: -1 };

    const algo = window.SKRAPERS_ALGO;
    if (saved.algo) {
      algo.profile.investigations = saved.algo.investigations || 0;
      algo.profile.correctFlags = saved.algo.correctFlags || 0;
      algo.profile.wrongFlags = saved.algo.wrongFlags || 0;
      algo.profile.signalGlances = saved.algo.signalGlances || { cadence: 0, activity: 0, linguistic: 0 };
      algo.profile.archetypeCatches = saved.algo.archetypeCatches || {};
      algo.profile.cleanCatches = saved.algo.cleanCatches || 0;
      algo.profile.luckyCatches = saved.algo.luckyCatches || 0;
    }

    // Stage 13: the rest of the systemic layers, restored the same
    // fail-open way as everything above.
    window.SKRAPERS_REPUTATION.load(saved.reputation);
    window.SKRAPERS_TRUST.load(saved.trust);
    window.SKRAPERS_ALGOMSGS.load(saved.algomsgs);
    LEADS.load(saved.leads);
    COMMENTS.load(saved.comments);
    BAIT.load(saved.bait);
    notifications = saved.notifications || [];
    inboxMessages = saved.inboxMessages || [];
    epilogueUnlocked = !!saved.epilogueUnlocked;
    pendingConfrontations = [];

    // Hot-swap fix: restore every world snapshot that was saved (whichever
    // worlds — Home, a case, or both — weren't the active one when the tab
    // closed), not just Home's. Falls back to the old single homeSnapshot
    // save shape so a pre-hot-swap-fix save doesn't lose Home's progress.
    worldSnapshots = {};
    if (saved.worldSnapshots && typeof saved.worldSnapshots === "object") {
      Object.entries(saved.worldSnapshots).forEach(([k, snap]) => {
        if (snap && Array.isArray(snap.accounts) && snap.accounts.length) {
          worldSnapshots[k] = {
            kind: snap.kind,
            accounts: snap.accounts,
            meta: snap.meta || {},
            flagged: snap.flagged || {},
            postFlags: snap.postFlags || {},
            visits: snap.visits || 0,
            loadedCount: snap.loadedCount || 0,
            batchCounter: snap.batchCounter || 0,
            deepInvestigated: snap.deepInvestigated && typeof snap.deepInvestigated === "object" ? snap.deepInvestigated : {},
            caseHints: Array.isArray(snap.caseHints) ? snap.caseHints : [],
            extras: snap.extras && typeof snap.extras === "object" ? snap.extras : null,
          };
        }
      });
    } else if (saved.homeSnapshot && Array.isArray(saved.homeSnapshot.accounts) && saved.homeSnapshot.accounts.length) {
      worldSnapshots.home = {
        kind: "procedural",
        accounts: saved.homeSnapshot.accounts,
        meta: saved.homeSnapshot.meta || {},
        flagged: saved.homeSnapshot.flagged || {},
        postFlags: {},
        visits: saved.homeSnapshot.visits || 0,
        loadedCount: saved.homeSnapshot.loadedCount || 0,
        batchCounter: saved.homeSnapshot.batchCounter || 0,
      };
    }

    activeEvent = null;

    if (legacyDaily) {
      // No world to restore into — land on a fresh Home instead of a
      // broken/empty screen. loadProceduralWorld() renders and persists.
      loadProceduralWorld();
      return true;
    }

    // Stage 13: the Returning Session hook (doc section 41) — a real
    // elapsed-time message from ALGO// rather than silently resuming, the
    // one thing this prototype was missing between reloads.
    const returningBanner = buildReturningBanner(saved.lastSeen);
    renderFeed(true, { returningBanner }); // isReturning: real time passed since the last visit, so the "while you were away" growth tick is honest here, not just first-load noise
    // Stage 33: the summary flag is derived, so it's re-derived here (it
    // needs currentWorld/settings in place), and a save that never got to
    // the end of the opening tour (the tab closed mid-tour) sees it now.
    if (syncWalkthroughSummary()) persistNow();
    maybeStartMainTour();
    return true;
  } catch (e) {
    return false; // e.g. a saved case id from a build that no longer defines it — fail open, not broken
  }
}

// Stage 13: formats the diegetic welcome-back line. Skipped (returns "")
// for a gap under a couple of minutes — that's just a page refresh, not a
// session return worth narrating.
function buildReturningBanner(lastSeen) {
  if (typeof lastSeen !== "number") return "";
  const ms = Date.now() - lastSeen;
  const mins = Math.round(ms / 60000);
  if (mins < 2) return "";
  let span;
  if (mins < 60) span = `${mins} minutes`;
  else if (mins < 60 * 24) span = `${Math.round(mins / 60)} hours`;
  else span = `${Math.round(mins / (60 * 24))} days`;
  const reviewed = Object.values(gameState.flagged).filter((f) => f.correct).length;
  return `ALGO//: Welcome back, Detective. It's been about ${span}. ${reviewed > 0 ? `${reviewed} of the accounts you flagged have completed review. ` : ""}The investigation continued without you.`;
}

// Stage 12: Android hardware/gesture back button. A no-op in any plain
// browser tab (including the published artifact) — window.Capacitor only
// exists inside the native shell — so this is safe to always call.
function setupAndroidBackButton() {
  if (!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App)) return;
  window.Capacitor.Plugins.App.addListener("backButton", () => {
    // Bug fix (real Back button): used to hardcode renderFeed(true) —
    // now uses the same shared goBack() every on-screen Back button uses,
    // so the hardware/gesture back button is consistent with them: it
    // only exits the app once the navigation history is actually empty
    // (there's nowhere left to go back to), not just because Feed happens
    // to be on screen right now (Feed can itself be several screens deep
    // in the history after hot-swapping between worlds).
    if (navStack.length === 0) {
      window.Capacitor.Plugins.App.exitApp();
    } else {
      goBack();
    }
  });
}

setupAndroidBackButton();
if (!restoreSession()) {
  renderCaptchaIntro();
}
