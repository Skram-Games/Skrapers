// SKRAPERS — Stage 9
// Adaptive ALGO// — the doc's own point (the recommendation system that
// feeds the player is the same kind of optimizing system the Skrapers
// exploit) made mechanical rather than just narrative flavor text. This
// tracks two things the player actually does — which investigate signals
// they look at, and how accurate their flags turn out to be — and feeds
// both back into how hard a freshly generated Endless Internet world is.
//
// Deliberately NOT stage-gated behind cases: Cases 001-003 stay
// hand-authored and fixed (a difficulty ladder needs stable steps to be
// learnable), so adaptation only touches procedurally generated worlds.
// Honest scope note: this is one adaptive knob (jitter, reused from Stage
// 8) driven by one signal (flag accuracy), not the doc's full
// personalized-manipulation vision (per-player content targeting) — that
// would mean generating per-player post text, which is a real content
// pipeline change, not a Stage 9 budget item.

(function () {

const profile = {
  investigations: 0,
  correctFlags: 0,
  wrongFlags: 0,
  signalGlances: { cadence: 0, activity: 0, linguistic: 0 },
  // Stage 13: per-archetype correct-catch counts — the doc's "Skrapers
  // learn from the player" idea (follow-up brainstorm point F), made
  // mechanical below via counterPlayJitter() rather than left as flavor
  // text. Keyed by personalityKey (e.g. "amplifier", "propagator").
  archetypeCatches: {},
  // Round 29 (#3): how well-argued the player's correct CASE flags were —
  // counted from the closing report (ui/feed.js) the player files with
  // every formal flag inside a case. A "clean" catch named real evidence
  // that account actually carries; a "lucky" one got the right account for
  // a reason that isn't what gives it away. Home flags file no report and
  // count in neither.
  cleanCatches: 0,
  luckyCatches: 0,
};

// Called every time the player opens an Investigate panel — signals is
// the array computeSignals() returned for whatever account they looked at.
function recordInvestigate(signals) {
  profile.investigations++;
  signals.forEach((s) => {
    if (/cadence/i.test(s.label)) profile.signalGlances.cadence++;
    else if (/activity/i.test(s.label)) profile.signalGlances.activity++;
    else if (/linguistic/i.test(s.label)) profile.signalGlances.linguistic++;
  });
}

// `acct` is optional (existing call sites that only pass `correct` keep
// working) — when present and the flag was correct, the archetype gets
// credited so counterPlayJitter() below can start compensating for it.
function recordFlag(correct, acct) {
  if (correct) {
    profile.correctFlags++;
    if (acct && acct.personalityKey) {
      profile.archetypeCatches[acct.personalityKey] = (profile.archetypeCatches[acct.personalityKey] || 0) + 1;
    }
  } else {
    profile.wrongFlags++;
  }
}

// Stage 13 arms race: a personality the player has repeatedly caught gets
// extra cadence jitter on FUTURE instances of that same archetype only —
// specifically weakening the signal that's been working against it,
// rather than a blanket difficulty bump across every Skraper. Caps at
// +40 minutes after 4+ catches so it stays a real counter-pressure, not
// an eventual wall.
function counterPlayJitter(personalityKey) {
  const catches = profile.archetypeCatches[personalityKey] || 0;
  return Math.min(catches * 10, 40);
}

// Round 29 (#3): "Investigation accuracy" is the game's third reputation
// axis — "how good you actually are, regardless of how either audience
// feels about you" (game/reputation.js's header). Right-for-the-wrong-reason
// is not the same as good, so a lucky catch now counts HALF a correct flag
// here: still better than a wrong flag, visibly worse than a clean one.
// Chosen over inventing a fourth stat because this is exactly the question
// that axis already exists to answer — and because it's the number
// adaptiveJitter() below scales future worlds by, so a player who wins on
// luck isn't rewarded with harder worlds as if they'd earned them.
const LUCKY_CATCH_WEIGHT = 0.5;
function accuracy() {
  const total = profile.correctFlags + profile.wrongFlags;
  if (total === 0) return null;
  const lucky = Math.min(profile.luckyCatches || 0, profile.correctFlags);
  return Math.max(0, profile.correctFlags - lucky * (1 - LUCKY_CATCH_WEIGHT)) / total;
}

function recordReport(grade) {
  if (grade === "clean") profile.cleanCatches++;
  else if (grade === "lucky") profile.luckyCatches++;
}

// The adaptive knob itself. No data yet -> the same baseline jitter Stage
// 8's Medium case already ships, so a brand-new player isn't punished for
// having no track record. Better-than-even accuracy -> harder worlds,
// same logic Stage 8 already proved (checkJitter.js) shifts the cadence
// signal from a clean HIGH down to MEDIUM.
function adaptiveJitter() {
  const acc = accuracy();
  if (acc === null) return 12;
  if (acc >= 0.8) return 30;
  if (acc >= 0.5) return 20;
  return 10;
}

function dominantSignal() {
  const { cadence, activity, linguistic } = profile.signalGlances;
  if (cadence === 0 && activity === 0 && linguistic === 0) return null;
  const max = Math.max(cadence, activity, linguistic);
  if (max === cadence) return "posting cadence";
  if (max === activity) return "activity-hour pattern";
  return "linguistic consistency";
}

// Deliberately NOT called on every case/world load — the whole point is
// that the algo's read on the player persists across the session, the
// same way a real feed's model of you doesn't reset when you open a new
// tab. Exposed for a possible future "new player" reset action only.
function reset() {
  profile.investigations = 0;
  profile.correctFlags = 0;
  profile.wrongFlags = 0;
  profile.signalGlances = { cadence: 0, activity: 0, linguistic: 0 };
  profile.archetypeCatches = {};
  profile.cleanCatches = 0;
  profile.luckyCatches = 0;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { profile, recordInvestigate, recordFlag, recordReport, accuracy, adaptiveJitter, dominantSignal, counterPlayJitter, reset, LUCKY_CATCH_WEIGHT };
} else {
  window.SKRAPERS_ALGO = { profile, recordInvestigate, recordFlag, recordReport, accuracy, adaptiveJitter, dominantSignal, counterPlayJitter, reset, LUCKY_CATCH_WEIGHT };
}

})();
