// SKRAPERS — Stage 13
// In-fiction ALGO// messages to the player (doc sections 20, 39 — "ALGO//
// investigates the player back"). Stage 9 already tracked investigate/flag
// behavior mechanically (game/algo.js) but never surfaced it narratively;
// this is that surface — a notification feed the player can open, with
// messages that reference their OWN tracked stats, not generic flavor
// text. Bookkeeping (which thresholds have already fired) lives here so
// it survives a reload via persist().

(function () {

const state = {
  notified: {}, // milestone key -> true, so each one fires exactly once
  unread: 0,
};

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// Called after every investigate/flag update. Returns an array of newly
// triggered messages (usually 0 or 1) so the caller can append them to a
// persisted notification list and show a toast for the first one.
function checkTriggers({ investigations, correctFlags, wrongFlags, dominantSignal, accuracy, phase }) {
  const fired = [];

  function fire(key, text) {
    if (state.notified[key]) return;
    state.notified[key] = true;
    state.unread++;
    fired.push({ id: key, text, at: Date.now() });
  }

  if (investigations >= 4) {
    fire(
      "glance-4",
      dominantSignal
        ? `We've noticed you keep coming back to ${dominantSignal}. Most investigators specialize eventually. You're specializing early.`
        : `We've noticed you're opening a lot of profiles without a clear pattern yet. That's normal, early on.`
    );
  }
  if (investigations >= 10 && dominantSignal) {
    fire("glance-10", `You've looked into similar accounts ${investigations} times now, mostly the same way each time. We've adjusted what you'll see next accordingly.`);
  }
  if (correctFlags >= 3) {
    fire("catch-3", `Three correct flags. ALGO// is logging your accuracy — it affects what gets shown to you, and to others who look like you.`);
  }
  if (correctFlags >= 8) {
    fire("catch-8", `Eight. You're better at this than the baseline user by a wide margin. We're curious what that will mean for you.`);
  }
  if (wrongFlags >= 3) {
    fire("wrong-3", `A few of your recent flags didn't hold up on review. The accounts involved know it was you. We don't tell them that — but they can usually tell anyway.`);
  }
  if (typeof accuracy === "number" && accuracy >= 0.85 && correctFlags + wrongFlags >= 5) {
    fire("accuracy-high", `Your flag accuracy is well above the platform average. ALGO// is now treating your judgment as a signal in its own right.`);
  }
  if (phase >= 2) {
    fire("phase-2", `Something you should know: your own activity on this platform is being profiled, the same way you profile everyone else. You knew that. We're telling you anyway.`);
  }
  if (phase >= 4) {
    fire("phase-4", `You've been doing this long enough that the line between investigator and subject isn't really holding anymore. We think you've noticed too.`);
  }

  return fired;
}

// Round 27 (#3): the Home feed's persistent "current focus" line. Same
// voice as the milestone messages above — ALGO// noticing things out loud,
// deniable, never a verdict — but pointed outward at the feed instead of
// at the player. The caller (ui/feed.js's refreshFocusNudge) picks a real,
// still-unflagged Skraper in the live Home world and tells this function
// which of that account's OWN signals is actually loudest (`kind`), so the
// hint points at something genuinely there without ever saying "bot".
// `pairHandle` (optional) names a real neighbor in that account's follow/
// tag graph — usually a human — and switches to a "these two keep turning
// up together" phrasing that is true, useful, and deliberately does not
// say which of the two is the problem. `pick` is the caller's seeded RNG.
const FOCUS_LINES = {
  cadence: [
    "Something about the rhythm of {h}'s posts seems worth a second look.",
    "{h} posts on a schedule most people don't keep. Might be nothing.",
  ],
  activity: [
    "{h} keeps hours we don't usually see. We're only mentioning it.",
    "Something about when {h} is awake seems worth a second look.",
  ],
  linguistic: [
    "{h} sounds exactly the same every time. We noticed; you might want to.",
    "Something about the way {h} phrases things seems worth a second look.",
  ],
  network: [
    "Something about who {h} follows seems worth a second look.",
    "{h} has been quiet. Quiet accounts still follow people. Worth checking who.",
  ],
  pair: [
    "{h} and {p} keep turning up near each other. Probably nothing. Probably.",
    "You haven't looked at {h} or {p} yet. We've noticed you haven't.",
  ],
};

function focusNudgeText({ handle, kind, pairHandle }, pick) {
  const choose = pick || ((list) => list[Math.floor(Math.random() * list.length)]);
  const bank = pairHandle ? FOCUS_LINES.pair : FOCUS_LINES[kind] || FOCUS_LINES.network;
  return choose(bank).split("{h}").join(handle).split("{p}").join(pairHandle || "");
}

// ===========================================================================
// Round 29 (#6): ALGO// PRE-FLAGS — the platform calling one of its own
// accounts suspicious, unprompted, before the player has investigated it.
// Which account, and whether ALGO// is right, is planned per case in
// game/cases.js's secondOpinionsFor (rare: ~1 case in 4 from 003 on, and
// always Case 007). This is only ALGO//'s voice for it — the same clinical,
// deniable register as every other message in this file, never a peer's:
// it doesn't argue, it "assesses"; it doesn't apologise, it "notes". The
// outcome lines are distinct on purpose (ui/feed.js shows each one as its
// own notification/toast, never folded into the ordinary flag result), and
// OVERTURNED — the player proving the platform wrong — is the one ALGO//
// takes least gracefully, because in this game that's the point.
// ===========================================================================
const PREFLAG_LINES = [
  "ALGO// has pre-flagged {h} as a probable Skraper. No action is required from you. We thought you would want to know before you started.",
  "Our models have already assessed {h}: probable Skraper. You are welcome to review it. Most investigators simply agree.",
];

const PREFLAG_OUTCOME_LINES = {
  confirmed: "Your review of {h} matches our pre-flag. We appreciate the agreement. It has been noted that you agreed.",
  "followed-wrong": "{h} has appealed, and the appeal was upheld. Our pre-flag was an assessment, not an instruction. The formal flag was yours.",
  overturned: "Our pre-flag on {h} has been overturned on your evidence. {h} is a real person. This correction has been recorded — about the account, and about you.",
  "contest-failed": "You contested our pre-flag on {h}. Review confirms our original assessment. We did say.",
  stood: "Case closed. Our pre-flag on {h} was never contested and remains on their record. They will not be told why.",
};

function preflagText(handle, pick) {
  const choose = pick || ((list) => list[Math.floor(Math.random() * list.length)]);
  return choose(PREFLAG_LINES).split("{h}").join(handle);
}

function preflagOutcomeText(outcome, handle) {
  return (PREFLAG_OUTCOME_LINES[outcome] || "").split("{h}").join(handle);
}

function reset() {
  state.notified = {};
  state.unread = 0;
}

function markRead() {
  state.unread = 0;
}

function dump() {
  return { notified: { ...state.notified }, unread: state.unread };
}

function load(saved) {
  reset();
  if (!saved) return;
  Object.assign(state.notified, saved.notified || {});
  state.unread = saved.unread || 0;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { checkTriggers, focusNudgeText, preflagText, preflagOutcomeText, reset, markRead, dump, load, state };
} else {
  window.SKRAPERS_ALGOMSGS = { checkTriggers, focusNudgeText, preflagText, preflagOutcomeText, reset, markRead, dump, load, state };
}

})();
