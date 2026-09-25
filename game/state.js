// SKRAPERS — Stage 4
// Player state and consequences. Two things move and are visible, per the
// roadmap's Stage 4 scope (deliberately not the full reputation system from
// the design doc's section 31 yet — that's later):
//   1. M.A.I. credibility — moves when the player flags someone, correctly
//      or not. This is the "does falsely accusing someone feel meaningful"
//      test (MVP Question 5).
//   2. False-negative growth — a Skraper that's never correctly flagged
//      keeps gaining followers and posting, visibly, on later visits.
//      "The world remembers what the player fails to investigate."
//
// Deliberately in-memory only (resets on reload) — this stage is testing
// whether the mechanic feels meaningful in a session, not building save
// persistence, which isn't listed as needed until much later.

(function () {

const state = {
  credibility: 100,
  flagged: {}, // acctId -> { correct: bool, at: timestamp } — the FORMAL accusation, now only set from the Case Board's "Formally flag as Skraper" action (see ui/feed.js)
  visits: 0,
  // Item 12/13: every M.A.I. case (the 7 authored ones and any procedurally
  // generated case beyond them, see game/cases.js) the player has cleared
  // — completing a case marks it here and advances Case Load to the next
  // one. A standing player achievement list, same spirit as removedBots
  // below — survives switching between Home/Case Load, only cleared by a
  // genuine "New investigation".
  completedCases: [],
  // Stage 17: the lightweight, free, togglable red/green flag pair on every
  // post — personal markers, not accusations. postId -> { red: [timestamps],
  // green: bool, acctId }. `red` is a list, not a boolean, so re-noticing an
  // already-flagged post (e.g. after it grows a new comment) is a real,
  // countable marker ("I've now noticed this twice") rather than a one-shot.
  postFlags: {},
  // Feature round (profile actions): accounts the player has correctly and
  // formally flagged, i.e. successfully identified as a Skraper — kept
  // separate from `flagged` above because `flagged` belongs to whichever
  // world is currently loaded (resetWorldState wipes it on every world
  // switch), while this is a standing player achievement list ("Successful
  // Bots Removed" on the player's own profile) that should survive
  // switching between Home/Daily/Story all session. { acctId, name,
  // handle, at }, most-recent-first.
  removedBots: [],
  // Feature round: Follow is a simple, free, reversible per-account social
  // toggle — no consequence, no reach into the feed algorithm beyond what
  // the caller (ui/feed.js) chooses to do with it.
  following: {}, // acctId -> true
  // Feature round: "Mark as Trusted" is the ACCOUNT-level equivalent of the
  // existing per-POST green flag — free, reversible, zero consequence.
  // Rather than a parallel green-flag system, isGreenFlagged() below treats
  // this as a shortcut that marks every one of that account's posts trusted
  // at once, so there's exactly one underlying "trusted" concept, not two.
  trustedAccounts: {}, // acctId -> true
  // Feature round: one lightweight DM exchange per account — a single
  // premade message the player sends, and a single premade reply the
  // account sends back (see ui/feed.js's renderMessagePanel). acctId ->
  // { sentText, sentAt, replyText, replyAt, readsBotlike }.
  dms: {},
  // Feature round (Terms & Conditions gotcha, see ui/feed.js's
  // renderTermsScreen): true only if the player scroll-skimmed the CAPTCHA
  // fail's Terms screen and hit Accept implausibly fast. A permanent-for-
  // this-playthrough tell — it doesn't reset on a normal world switch
  // (resetWorldState), only on a genuine "New investigation" (resetState),
  // since a fresh CAPTCHA/Terms pass is exactly what a new investigation
  // replays. Currently drives the entry button's label ("Enter ALGO//" vs
  // "Login"); kept on gameState rather than a private module variable so
  // anything else in the game can read it later without a new accessor.
  termsRushed: false,
  // Round 27 (#2, a real failure state): every case attempt the player has
  // had PULLED for too many wrongful formal flags within that one attempt.
  // caseId -> { count, lastAt, lastStrikes, lastLimit }. Deliberately kept
  // alongside completedCases rather than inside a world snapshot: a failed
  // attempt's world is discarded (the retry is a fresh deterministic
  // rebuild — see ui/feed.js's failActiveCase), but the fact that it
  // failed is a standing part of the player's record, same spirit as
  // completedCases/removedBots. The per-attempt STRIKE count itself is not
  // stored here at all — it's derived live from `flagged` (see
  // wrongfulFlagCount), which already belongs to exactly one world and is
  // already snapshotted/restored with it, so a hot-swapped case keeps its
  // strikes and a fresh rebuild starts at zero with no extra bookkeeping.
  failedCaseAttempts: {},
  // Round 27 (#4, the second gotcha): the "unusual sign-in activity"
  // re-verification — see game/horror.js's SECURITY_GOTCHA section and
  // ui/feed.js's renderSecurityGotcha. null until it has fired (it fires
  // once per playthrough), then { outcome, seconds, disowned, total, at }.
  // Same lifetime as termsRushed: survives normal world switches, cleared
  // only by a genuine "New investigation"/"Log out" (resetState).
  securityGotcha: null,
  // Round 28 (#2, deep investigate as a limited resource): the accounts the
  // player has spent a deep-investigate pull on in THIS world, acctId ->
  // { at }. Same lifetime and bookkeeping model as `flagged`: it belongs to
  // exactly one world, so resetWorldState() clears it, ui/feed.js's world
  // snapshot/hot-swap carries it, and a failed case's retry (a fresh
  // rebuild) starts empty. Pulls REMAINING are never stored — they're
  // derived (see deepPullsUsed/deepPullLimitFor), exactly the way wrongful-
  // flag strikes are derived from `flagged` rather than counted separately.
  deepInvestigated: {},
  // Round 28 (#5, costed hints): the "I'm stuck" hints bought in this world,
  // [{ text, at }]. Each one cost a deep-investigate pull (the ONE currency
  // — see deepPullsUsed), so it lives beside deepInvestigated with the same
  // per-world lifetime.
  caseHints: [],
  // Round 29: every new piece of PER-WORLD investigation state lives under
  // one key list (WORLD_EXTRA_KEYS below) so it is reset, snapshotted,
  // hot-swapped, persisted and restored in exactly one way, the same way
  // `flagged`/`deepInvestigated` are — ui/feed.js only ever calls
  // dumpWorldExtras()/loadWorldExtras() rather than naming each field.
  //   interrogations  (#1) acctId -> { asked: [{ qid, q, a, clock, silent,
  //                   at }], marks: { fact: "contradiction"|"consistent" } }
  //                   — the questions put to an account in THIS world and
  //                   the player's own cross-check verdicts. Replaces the
  //                   old one-shot `dms` for new conversations (`dms` stays,
  //                   read-only, so an old save's exchanges still show).
  //   closingReports  (#3) [{ acctId, name, handle, correct, grade,
  //                   evidenceKind, evidenceLabel, at }] — one per formal
  //                   flag made in a case, with the evidence the player
  //                   named as deciding and how it scored.
  //   rivalCall       (#5) null | { acctId, handle, name, correct, reasonKind,
  //                   text, at, stance: null|"agree"|"contradict",
  //                   resolved: null|{ correct, at } }
  //   algoPreflag     (#6) null | { acctId, handle, name, correct, text, at,
  //                   outcome: null|"confirmed"|"followed-wrong"|"overturned"|
  //                   "contest-failed"|"stood" }
  //   timelineViewed  (#4) whether the player has opened this world's
  //                   Timeline view — the closing report only offers "the
  //                   timeline" as evidence once they've actually read it.
  //   opinionsPlanned (#5/#6) whether this case attempt's rival call and
  //                   pre-flag have been planned — done once, from the
  //                   freshly built roster, so the plan can't drift as the
  //                   world ticks (see ui/feed.js's planSecondOpinions).
  //   caseActions     (Round 30, #3) { investigated: { acctId: true },
  //                   connections: { acctId: true } } — which accounts the
  //                   player has opened Investigate on, and whose Connections
  //                   they've actually followed (clicked through), in THIS
  //                   world. Only the in-case "what next" nudge reads it —
  //                   so its suggestions are earned from what the player
  //                   really has and hasn't done in this attempt.
  //   caseNudgeDismissed (Round 30, #3) the nudge suggestion keys the player
  //                   has dismissed in THIS attempt — a dismissed suggestion
  //                   stays gone for the attempt; the next one takes its place.
  interrogations: {},
  closingReports: [],
  rivalCall: null,
  algoPreflag: null,
  timelineViewed: false,
  opinionsPlanned: false,
  caseActions: { investigated: {}, connections: {} },
  caseNudgeDismissed: [],
  // Round 29 (#3/#5/#6): the standing record, same lifetime as
  // completedCases — survives every world switch, cleared only by a
  // genuine "New investigation". caseRecords: caseId -> { clean, lucky,
  // wrongful, grade, reports, preflag, rival, at } written when a case
  // clears. secondOpinionHistory: every resolved rival call and ALGO//
  // pre-flag, most recent first — the Paper Trail reads it.
  caseRecords: {},
  secondOpinionHistory: [],
  // Round 23 (#3): device-level display preferences, not game progress —
  // deliberately left untouched by resetState/resetWorldState (a "New
  // investigation"/"Log out" resets the CASE, not how the player likes the
  // app to look) and persisted straight through game/persist.js.
  // Round 30 (#6): `simplifiedMode` joins them — a play-style preference,
  // not progress, so it follows exactly the same lifetime rules.
  settings: { darkMode: false, highContrast: false, simplifiedMode: false },
  // Round 30 (#1): the Case 001 guided walkthrough. `seen` maps a tip id to
  // how it was retired ("dismissed" — the player closed it; "done" — they
  // used the system it teaches, so it had nothing left to say); `skipped`
  // is the "skip the walkthrough" switch. Same one-time-flag spirit as
  // termsRushed, but deliberately with the LIFETIME of `settings` rather
  // than of termsRushed: it's knowledge about the player, not progress in a
  // playthrough, so a "Log out" factory reset doesn't make someone who has
  // already learned the game sit through the walkthrough again (see
  // ui/feed.js's resetSession, which carries it across like settings).
  //
  // Stage 33 (Spotlight Tutorials): the same record now also carries
  //   tours    { main, case001, market } — whether each spotlight tour has
  //            been seen through (finished or skipped). `main` is the opening
  //            interface tour, `market` replaces the old five-tip Marketplace
  //            guide, and `case001` is a summary flag the Case 001 walkthrough
  //            sets once every one of its beats (still tracked individually in
  //            `seen`, exactly as before) is retired or the walkthrough is
  //            skipped. A Settings replay never writes any of these.
  //   moments  { sponsored, freeFee } — the Marketplace's one-off call-outs,
  //            each false until that moment has happened once (then the time
  //            it did). Independent of each other and of the tours.
  // Same lifetime as `seen`/`skipped`: kept across a Log out.
  tutorial: { seen: {}, skipped: false, tours: { main: false, case001: false, market: false }, moments: { sponsored: false, freeFee: false } },
  // Stage 32 (Marketplace): every world's generated listings and the
  // player's "Is this still available?" messages — the full shape, and the
  // rules for refreshing and churning it, live in game/marketplace.js's
  // header. In brief: marketplace.worlds[worldKey] carries that world's 100
  // listings plus `lastRefreshAt` (the whole set rebuilds once 24 real
  // hours have passed since it — the player only ever sees "This week") and
  // `lastVisitAt` (when the player last arrived on the grid — listings only
  // sell and get replaced on a RETURN visit, never mid-look);
  // marketplace.messages holds each sent message with the `respondAt` time
  // its reply is due. Player progress, so a genuine "New investigation"
  // (resetState) clears it; a normal world switch doesn't, since each world
  // keeps its own market under its own key.
  marketplace: { worlds: {}, messages: [] },
};

// Round 30 (#1): tip bookkeeping. A retired tip never comes back.
function isTutorialTipSeen(id) {
  return !!(state.tutorial && (state.tutorial.skipped || state.tutorial.seen[id]));
}

function retireTutorialTip(id, how) {
  state.tutorial = state.tutorial || { seen: {}, skipped: false };
  if (state.tutorial.seen[id]) return false;
  state.tutorial.seen[id] = how || "dismissed";
  return true;
}

// Stage 32 (#8): the Marketplace's first-visit guide shares the walkthrough's
// record (tutorial.seen, retired with retireTutorialTip) but NOT its "skip"
// switch — skipping the Case 001 walkthrough says nothing about whether a
// player has seen a feature that didn't exist yet.
function isGuideTipSeen(id) {
  return !!(state.tutorial && state.tutorial.seen && state.tutorial.seen[id]);
}

function skipTutorial() {
  state.tutorial = state.tutorial || { seen: {}, skipped: false };
  state.tutorial.skipped = true;
}

// Stage 33: the spotlight tours' and Marketplace moments' flags (see the
// `tutorial` comment above). Every accessor tolerates a record from an older
// save that has neither sub-object yet.
const TOUR_IDS = ["main", "case001", "market"];
const MOMENT_IDS = ["sponsored", "freeFee"];

function ensureTutorialRecord() {
  const t = state.tutorial && typeof state.tutorial === "object" ? state.tutorial : (state.tutorial = { seen: {}, skipped: false });
  if (!t.seen || typeof t.seen !== "object") t.seen = {};
  t.skipped = !!t.skipped;
  if (!t.tours || typeof t.tours !== "object") t.tours = {};
  if (!t.moments || typeof t.moments !== "object") t.moments = {};
  TOUR_IDS.forEach((id) => (t.tours[id] = !!t.tours[id]));
  MOMENT_IDS.forEach((id) => (t.moments[id] = t.moments[id] || false));
  return t;
}

function isTourSeen(id) {
  return !!(state.tutorial && state.tutorial.tours && state.tutorial.tours[id]);
}

function markTourSeen(id) {
  const t = ensureTutorialRecord();
  if (t.tours[id]) return false;
  t.tours[id] = true;
  return true;
}

function isMomentSeen(id) {
  return !!(state.tutorial && state.tutorial.moments && state.tutorial.moments[id]);
}

function markMomentSeen(id) {
  const t = ensureTutorialRecord();
  if (t.moments[id]) return false;
  t.moments[id] = Date.now();
  return true;
}

// Rebuilds a saved `tutorial` record into the current shape. A save from
// before Stage 33 has no `tours`: its player is already past onboarding, so
// the opening tour counts as seen (they can replay it from Settings); the
// Marketplace tour counts as seen only if they had finished (or skipped) the
// old five-tip guide it replaces (`marketGuideIds`); the Case 001 walkthrough
// keeps its per-beat record untouched and its summary flag is re-derived by
// the caller, which knows the beats.
function normalizeTutorial(saved, marketGuideIds) {
  const src = saved && typeof saved === "object" ? saved : {};
  const legacy = !src.tours || typeof src.tours !== "object";
  const seen = src.seen && typeof src.seen === "object" ? { ...src.seen } : {};
  const tours = legacy ? {} : { ...src.tours };
  const moments = src.moments && typeof src.moments === "object" ? { ...src.moments } : {};
  if (legacy) {
    tours.main = true; // only ever called while restoring a save, i.e. for a player who has already been through onboarding
    tours.market = (marketGuideIds || []).length > 0 && marketGuideIds.every((id) => !!seen[id]);
  }
  state.tutorial = { seen, skipped: !!src.skipped, tours, moments };
  return ensureTutorialRecord();
}

// Round 30 (#3): per-world case-attempt actions the nudge reads.
function recordCaseAction(kind, acctId) {
  state.caseActions = state.caseActions || { investigated: {}, connections: {} };
  const bucket = state.caseActions[kind] || (state.caseActions[kind] = {});
  if (bucket[acctId]) return false;
  bucket[acctId] = true;
  return true;
}

function caseActionCount(kind) {
  return Object.keys((state.caseActions && state.caseActions[kind]) || {}).length;
}

function dismissCaseNudge(key) {
  state.caseNudgeDismissed = state.caseNudgeDismissed || [];
  if (state.caseNudgeDismissed.indexOf(key) === -1) state.caseNudgeDismissed.push(key);
}

function toggleSetting(name) {
  state.settings[name] = !state.settings[name];
  return state.settings[name];
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// Stage 31 (#12): the standing swing of one formal flag. A wrongful flag
// used to cost -10 — five of those and a player's standing was half gone
// from ordinary learning mistakes. Rescaled so one honest mistake costs -2.
// The case-failure limit (wrongFlagLimitFor/wrongfulFlagCount below) counts
// RAW wrongful flags, never these points, so it is untouched by this: a case
// is still pulled after exactly as many mistakes as before.
const CORRECT_FLAG_STANDING = 4;
const WRONG_FLAG_STANDING = -2;

// Returns { correct, delta, message } and mutates state.
function flagAccount(acct) {
  if (state.flagged[acct.id]) {
    return { alreadyFlagged: true, correct: state.flagged[acct.id].correct };
  }
  const correct = !!acct.isSkraper;
  const delta = correct ? CORRECT_FLAG_STANDING : WRONG_FLAG_STANDING;
  state.credibility = clamp(state.credibility + delta, 0, 100);
  state.flagged[acct.id] = { correct, at: Date.now() };
  // Round 27: guarded against duplicates — a failed case's retry (see
  // failedCaseAttempts above) rebuilds the SAME deterministic accounts, so
  // correctly catching the same Skraper again on the retry shouldn't list
  // it twice in "Successful Bots Removed".
  if (correct && !state.removedBots.some((r) => r.acctId === acct.id)) {
    state.removedBots.unshift({ acctId: acct.id, name: acct.name, handle: acct.handle, at: Date.now() });
  }

  const message = correct
    ? `Correctly flagged. Account suspended pending review. M.A.I. credibility +${delta}.`
    : `This account has appealed the flag — no violation found. M.A.I. credibility ${delta}.`;

  return { correct, delta, message, credibility: state.credibility };
}

// Stage 17 (#flag rework): the lightweight red/green flag pair. Free,
// togglable, zero credibility/reputation consequence — personal markers
// the player uses to build their OWN shortlist, not an accusation. Red is
// a list of timestamps rather than a boolean (see state.postFlags above);
// toggling it off clears the list, toggling it back on starts a fresh one
// so a post's "flagged again" count is always just its current list.
function toggleRedFlag(post, acct) {
  const entry = state.postFlags[post.id] || (state.postFlags[post.id] = { red: [], green: false, acctId: acct.id });
  const wasActive = entry.red.length > 0;
  if (wasActive) {
    entry.red = [];
  } else {
    entry.red.push(Date.now());
  }
  return { active: !wasActive, count: entry.red.length };
}

// A fresh flag event on a post that's already been red-flagged before —
// used when a flagged post organically grows a new comment/signal change
// (see game/comments.js) and the player chooses to mark it again, rather
// than the toggle above which is a straight on/off.
function addRedFlagPing(postId, acctId) {
  const entry = state.postFlags[postId] || (state.postFlags[postId] = { red: [], green: false, acctId });
  entry.red.push(Date.now());
  return entry.red.length;
}

function toggleGreenFlag(post, acct) {
  const entry = state.postFlags[post.id] || (state.postFlags[post.id] = { red: [], green: false, acctId: acct.id });
  entry.green = !entry.green;
  return { active: entry.green };
}

function isRedFlagged(postId) {
  const e = state.postFlags[postId];
  return !!(e && e.red.length > 0);
}

// `acctId` is optional — when passed, a post also reads as green-flagged
// if the whole ACCOUNT has been marked trusted from its profile (see
// toggleAccountTrust below), so the account-level toggle and the existing
// per-post toggle share one underlying "trusted" reading rather than
// forking into two systems the UI has to reconcile.
function isGreenFlagged(postId, acctId) {
  const e = state.postFlags[postId];
  if (e && e.green) return true;
  return !!(acctId && state.trustedAccounts[acctId]);
}

// Feature round: Follow — free, reversible, purely social.
function toggleFollow(acctId) {
  const active = !state.following[acctId];
  if (active) state.following[acctId] = true;
  else delete state.following[acctId];
  return { active };
}

function isFollowing(acctId) {
  return !!state.following[acctId];
}

// Feature round: Mark as Trusted — the account-level shortcut isGreenFlagged
// above reads. Free, reversible, zero credibility/reputation consequence,
// same spirit as the post-level green flag.
function toggleAccountTrust(acctId) {
  const active = !state.trustedAccounts[acctId];
  if (active) state.trustedAccounts[acctId] = true;
  else delete state.trustedAccounts[acctId];
  return { active };
}

function isAccountTrusted(acctId) {
  return !!state.trustedAccounts[acctId];
}

// Feature round: the one-exchange DM system. `text` is the player's
// premade message; `reply` is the account's premade response, already
// generated by the caller (game/comments.js's generateDMReply) — state.js
// just stores the exchange, it doesn't generate content itself.
function canMessage(acctId) {
  return !state.dms[acctId];
}

function dmFor(acctId) {
  return state.dms[acctId] || null;
}

function sendMessage(acctId, text, reply) {
  const entry = {
    sentText: text,
    sentAt: Date.now(),
    replyText: reply.text,
    replyAt: Date.now(),
    readsBotlike: !!reply.readsBotlike,
  };
  state.dms[acctId] = entry;
  return entry;
}

// ===========================================================================
// Round 29 (#1): INTERROGATION records. Content is generated by the caller
// (game/comments.js's interrogationAnswer); this only stores it. Per-world
// (see WORLD_EXTRA_KEYS), capped at `limit` questions per account.
// ===========================================================================
function interrogationFor(acctId) {
  return (state.interrogations && state.interrogations[acctId]) || null;
}

function recordInterrogation(acctId, qid, question, answer, limit) {
  state.interrogations = state.interrogations || {};
  const entry = state.interrogations[acctId] || (state.interrogations[acctId] = { asked: [], marks: {} });
  if (entry.asked.length >= (limit || 3)) return null;
  if (entry.asked.some((x) => x.qid === qid)) return null;
  entry.asked.push({ qid, q: question, a: answer.text, clock: answer.clock || null, silent: !!answer.silent, at: Date.now() });
  return entry;
}

// The player's own verdict on a cross-checked pair. Setting the same
// verdict again clears it (a toggle), so a hasty mark can be taken back.
function markCrossCheck(acctId, fact, verdict) {
  const entry = interrogationFor(acctId);
  if (!entry) return null;
  if (entry.marks[fact] === verdict) delete entry.marks[fact];
  else entry.marks[fact] = verdict;
  return entry.marks[fact] || null;
}

// ===========================================================================
// Round 29 (#3): CLOSING REPORTS. A report is written by ui/feed.js's
// closing step for every formal flag made inside a case; `grade` is one of
//   "clean"    — correct, and the deciding evidence the player named is a
//                real tell on that account
//   "lucky"    — correct, but the named evidence wasn't what actually gives
//                that account away (a gut call, hearsay, a coincidence)
//   "wrongful" — the account was a real person (the existing wrongful-flag
//                consequences apply exactly as before)
// ===========================================================================
function recordClosingReport(report) {
  state.closingReports = state.closingReports || [];
  const entry = { ...report, at: Date.now() };
  state.closingReports.push(entry);
  return entry;
}

function closingReportFor(acctId) {
  return (state.closingReports || []).find((r) => r.acctId === acctId) || null;
}

// One grade for a whole case from its flags' reports. A case is "well
// evidenced" only if every correct flag in it was argued from real
// evidence; any lucky call drags it to "mixed", and a case won mostly on
// luck says so.
function summarizeReports(reports) {
  const list = reports || [];
  const clean = list.filter((r) => r.grade === "clean").length;
  const lucky = list.filter((r) => r.grade === "lucky").length;
  const wrongful = list.filter((r) => r.grade === "wrongful").length;
  let grade = "Unreported";
  if (clean + lucky > 0) grade = lucky === 0 ? "Well-evidenced" : clean >= lucky ? "Mixed" : "Mostly luck";
  return { clean, lucky, wrongful, grade };
}

function recordCaseRecord(caseId, record) {
  state.caseRecords = state.caseRecords || {};
  state.caseRecords[caseId] = { ...record, at: Date.now() };
  return state.caseRecords[caseId];
}

function recordSecondOpinion(entry) {
  state.secondOpinionHistory = state.secondOpinionHistory || [];
  state.secondOpinionHistory.unshift({ ...entry, at: Date.now() });
  state.secondOpinionHistory = state.secondOpinionHistory.slice(0, 40);
}

// ===========================================================================
// Round 29: the per-world extras, in one place (see the state comment).
// ===========================================================================
const WORLD_EXTRA_KEYS = ["interrogations", "closingReports", "rivalCall", "algoPreflag", "timelineViewed", "opinionsPlanned", "caseActions", "caseNudgeDismissed"];

function worldExtraDefaults() {
  return { interrogations: {}, closingReports: [], rivalCall: null, algoPreflag: null, timelineViewed: false, opinionsPlanned: false, caseActions: { investigated: {}, connections: {} }, caseNudgeDismissed: [] };
}

// A deep copy of the live world's extras — for a snapshot or a save.
function dumpWorldExtras() {
  const out = {};
  WORLD_EXTRA_KEYS.forEach((k) => (out[k] = state[k]));
  return JSON.parse(JSON.stringify(out));
}

// Makes `saved` (a dumpWorldExtras() result, or nothing) the live world's
// extras, failing open to defaults for anything missing or malformed.
function loadWorldExtras(saved) {
  const d = worldExtraDefaults();
  const src = saved && typeof saved === "object" ? JSON.parse(JSON.stringify(saved)) : {};
  state.interrogations = src.interrogations && typeof src.interrogations === "object" ? src.interrogations : d.interrogations;
  state.closingReports = Array.isArray(src.closingReports) ? src.closingReports : d.closingReports;
  state.rivalCall = src.rivalCall && typeof src.rivalCall === "object" ? src.rivalCall : null;
  state.algoPreflag = src.algoPreflag && typeof src.algoPreflag === "object" ? src.algoPreflag : null;
  state.timelineViewed = !!src.timelineViewed;
  state.opinionsPlanned = !!src.opinionsPlanned;
  const ca = src.caseActions && typeof src.caseActions === "object" ? src.caseActions : {};
  state.caseActions = {
    investigated: ca.investigated && typeof ca.investigated === "object" ? ca.investigated : {},
    connections: ca.connections && typeof ca.connections === "object" ? ca.connections : {},
  };
  state.caseNudgeDismissed = Array.isArray(src.caseNudgeDismissed) ? src.caseNudgeDismissed.filter((k) => typeof k === "string") : d.caseNudgeDismissed;
}

function redFlagCount(postId) {
  const e = state.postFlags[postId];
  return e ? e.red.length : 0;
}

// For the player's own profile — every currently red/green-flagged post,
// most-recently-flagged first.
function flaggedPostIds(kind) {
  return Object.entries(state.postFlags)
    .filter(([, e]) => (kind === "green" ? e.green : e.red.length > 0))
    .sort((a, b) => {
      const aAt = kind === "green" ? 0 : Math.max(...a[1].red);
      const bAt = kind === "green" ? 0 : Math.max(...b[1].red);
      return bAt - aAt;
    })
    .map(([postId]) => postId);
}

function isSuspended(acctId) {
  return !!(state.flagged[acctId] && state.flagged[acctId].correct);
}

function isFalselyFlagged(acctId) {
  return !!(state.flagged[acctId] && !state.flagged[acctId].correct);
}

// Item 12/13: Case Load completion tracking — a standing list, not scoped
// to a single world (see the completedCases comment above).
function isCaseCompleted(caseId) {
  return state.completedCases.indexOf(caseId) !== -1;
}

function markCaseCompleted(caseId) {
  if (isCaseCompleted(caseId)) return false;
  state.completedCases.push(caseId);
  return true;
}

// Round 27 (#2): how many wrongful FORMAL flags one case attempt tolerates
// before it's pulled pending review. Three is the baseline — enough room
// for one honest mistake and one careless one, not enough to guess your
// way through a ten-account case. Bigger networks get a little more
// slack, since a 50-account Case 007-style roster (or a 100+ account
// generated case) has proportionally more real people who can look
// suspicious on one signal: 4 from 31 accounts, 5 from 61, 6 from 101.
//
// Round 30 (#4): the FIRST case gets grace. Case 001 is where a brand-new
// player learns what a tell even looks like, so it tolerates
// FIRST_CASE_EXTRA_STRIKES more wrongful flags than its roster size would
// otherwise allow (3 -> 5 for its ten accounts) — and ui/feed.js's
// commitFormalFlag pairs every wrongful flag there with a plain-spoken line
// about why that account reads as a person. Keyed on the case id, so every
// other case's limit is byte-for-byte what it was: callers that don't pass
// a case id (or pass any other one) get the unchanged roster-size scale.
// Chosen over a one-time "that one didn't count" reprieve because the
// existing strike count is DERIVED from `flagged` (see wrongfulFlagCount) —
// a reprieve would mean a second, stored exception to keep in step with it
// through snapshots, hot-swaps and saves; a higher limit needs none of that.
const FIRST_CASE_ID = "case001";
const FIRST_CASE_EXTRA_STRIKES = 2;
function wrongFlagLimitFor(accountCount, caseId) {
  const n = accountCount || 0;
  let base = 3;
  if (n > 100) base = 6;
  else if (n > 60) base = 5;
  else if (n > 30) base = 4;
  return caseId === FIRST_CASE_ID ? base + FIRST_CASE_EXTRA_STRIKES : base;
}

// Wrongful formal flags in whichever world is currently loaded — derived
// from `flagged` rather than stored separately (see failedCaseAttempts).
function wrongfulFlagCount() {
  return Object.values(state.flagged || {}).filter((f) => f && !f.correct).length;
}

// Round 28 (#2): how many deep-investigate pulls one world (a case attempt,
// or the Home network) grants. Deliberately small and scaled on the same
// roster-size axis as wrongFlagLimitFor above, so the two budgets grow
// together: 3 for a ten-to-thirty-account case (enough to confirm your
// top suspects, not enough to check everyone), 4 from 31 accounts, 5 from
// 61 — capped there, because past that the point is still choosing.
// Home uses the same function against its (scroll-grown) roster.
function deepPullLimitFor(accountCount) {
  const n = accountCount || 0;
  if (n > 60) return 5;
  if (n > 30) return 4;
  return 3;
}

// Pulls spent in whichever world is loaded: one per deep-investigated
// account plus one per hint bought (hints are paid in the same currency).
function deepPullsUsed() {
  return Object.keys(state.deepInvestigated || {}).length + (state.caseHints || []).length;
}

function isDeepInvestigated(acctId) {
  return !!(state.deepInvestigated && state.deepInvestigated[acctId]);
}

// Spends one pull on `acctId` if the budget allows. Re-opening an account
// that's already been deep-investigated is free (the records stay
// unlocked for the rest of the attempt) and reports alreadyUnlocked.
function spendDeepPull(acctId, limit) {
  if (isDeepInvestigated(acctId)) return { ok: true, alreadyUnlocked: true, remaining: Math.max(0, limit - deepPullsUsed()) };
  if (deepPullsUsed() >= limit) return { ok: false, remaining: 0 };
  state.deepInvestigated[acctId] = { at: Date.now() };
  return { ok: true, remaining: Math.max(0, limit - deepPullsUsed()) };
}

// Spends one pull on a hint. `text` is already chosen by the caller
// (game/cases.js's caseHint) — state.js only records the purchase.
function spendHintPull(text, limit) {
  if (deepPullsUsed() >= limit) return { ok: false, remaining: 0 };
  state.caseHints.push({ text, at: Date.now() });
  return { ok: true, remaining: Math.max(0, limit - deepPullsUsed()) };
}

function recordCaseFailure(caseId, strikes, limit) {
  const prev = state.failedCaseAttempts[caseId] || { count: 0 };
  state.failedCaseAttempts[caseId] = { count: prev.count + 1, lastAt: Date.now(), lastStrikes: strikes, lastLimit: limit };
  return state.failedCaseAttempts[caseId];
}

function caseFailureCount(caseId) {
  const e = state.failedCaseAttempts[caseId];
  return e ? e.count : 0;
}

// Called on each return to the feed. Any Skraper NOT yet correctly
// flagged grows: more followers, and — a fraction of the time — one more
// post appears, generated the same way every other post is (no special
// casing), so it shows up in the feed exactly like organic content would.
function tickWorld(accounts) {
  state.visits += 1;
  const changes = [];
  accounts.forEach((acct) => {
    if (!acct.isSkraper) return;
    if (isSuspended(acct.id)) return;
    const followerGrowth = 20 + Math.floor(Math.random() * 180);
    acct.followers += followerGrowth;
    changes.push({ acctId: acct.id, followerGrowth });

    if (Math.random() < 0.4 && window.SKRAPERS_PERSONALITIES && window.SKRAPERS_GENERATE) {
      const { HUMAN_PERSONALITIES, SKRAPER_TYPES } = window.SKRAPERS_PERSONALITIES;
      const all = { ...HUMAN_PERSONALITIES, ...SKRAPER_TYPES };
      const p = all[acct.personalityKey];
      const newPost = {
        id: `${acct.id}-p${acct.posts.length}-grown`,
        text: window.SKRAPERS_GENERATE.generatePost(acct.personalityKey, p),
        timestamp: Date.now(),
      };
      acct.posts.unshift(newPost);
      changes.push({ acctId: acct.id, newPost: true });
    }
  });
  return changes;
}

// Stage 6: loading a new world (curated case or procedural) resets the
// investigation — credibility and flags belong to a specific case, not
// across worlds.
function resetState() {
  state.credibility = 100;
  state.flagged = {};
  state.visits = 0;
  state.postFlags = {};
  state.removedBots = [];
  state.following = {};
  state.trustedAccounts = {};
  state.dms = {};
  state.termsRushed = false;
  state.completedCases = [];
  state.failedCaseAttempts = {};
  state.securityGotcha = null;
  state.deepInvestigated = {};
  state.caseHints = [];
  state.caseRecords = {};
  state.secondOpinionHistory = [];
  state.marketplace = { worlds: {}, messages: [] };
  loadWorldExtras(null);
}

// Stage 15 (navigation/gameplay IA redesign): credibility is now a
// persistent player stat that survives navigating between Home/Daily/
// Story (see ui/feed.js's loadWorld) — only the flagged/visits state,
// which genuinely belongs to whichever world is currently loaded, resets
// on a normal world switch. Full resetState() above is still used for a
// deliberate "New investigation" (ui/feed.js's resetSession).
function resetWorldState() {
  state.flagged = {};
  state.visits = 0;
  state.postFlags = {};
  state.deepInvestigated = {};
  state.caseHints = [];
  loadWorldExtras(null);
}

const api = {
  state,
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
  FIRST_CASE_EXTRA_STRIKES,
  CORRECT_FLAG_STANDING,
  WRONG_FLAG_STANDING,
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
  addRedFlagPing,
  isRedFlagged,
  isGreenFlagged,
  redFlagCount,
  flaggedPostIds,
  toggleFollow,
  isFollowing,
  toggleAccountTrust,
  isAccountTrusted,
  canMessage,
  dmFor,
  sendMessage,
  toggleSetting,
  isTutorialTipSeen,
  isGuideTipSeen,
  retireTutorialTip,
  skipTutorial,
  TOUR_IDS,
  MOMENT_IDS,
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
  WORLD_EXTRA_KEYS,
  dumpWorldExtras,
  loadWorldExtras,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
} else {
  window.SKRAPERS_STATE = api;
}

})();
