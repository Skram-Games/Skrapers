// SKRAPERS — Stage 13
// Trust: humans noticing they're being investigated and reacting to it —
// the doc's follow-up brainstorm point 2, never built until now. Skrapers
// don't get a suspicion score; this is specifically about the cost of
// surveilling REAL people, which is the doc's whole point in raising it
// ("the player is both investigator and subject" cuts both ways — the
// people being watched are subjects too, not inert data).

(function () {

const suspicion = {}; // acctId -> 0-20
const reacted = {};   // acctId -> "noticed" | "confronted" (highest stage already shown, so it never repeats)

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// Opening the Investigate panel on a real human is a small, repeatable
// nudge; pinning them to the Case Board (an explicit, deliberate act of
// building a case against a specific person) costs more.
function glance(acctId) {
  suspicion[acctId] = clamp((suspicion[acctId] || 0) + 2, 0, 20);
}
function pin(acctId) {
  suspicion[acctId] = clamp((suspicion[acctId] || 0) + 3, 0, 20);
}
function level(acctId) {
  return suspicion[acctId] || 0;
}

// Called once per return to the feed, against every real human currently
// in the world. Returns the accounts that crossed a NEW threshold this
// tick — "noticed" first (a quiet in-feed reaction, no player choice
// needed), then "confronted" once suspicion climbs further (a direct
// message needing a RESPOND / IGNORE / EXPLAIN choice — see ui/feed.js's
// renderTrustModal). Each account reacts at most once per stage, ever.
function checkReactions(accounts) {
  const events = [];
  accounts.forEach((acct) => {
    if (acct.isSkraper) return;
    const s = suspicion[acct.id] || 0;
    const already = reacted[acct.id];
    if (s >= 12 && already !== "confronted") {
      reacted[acct.id] = "confronted";
      events.push({ acct, stage: "confronted" });
    } else if (s >= 6 && !already) {
      reacted[acct.id] = "noticed";
      events.push({ acct, stage: "noticed" });
    }
  });
  return events;
}

const NOTICED_LINES = [
  "anyone else feel like they're being watched on here lately? weird week.",
  "keep getting this itch that someone's been going through my old posts. probably nothing.",
  "small thing but — noticed the same account keeps turning up on my profile this week. is that even something you can tell? feels like it though.",
  "ok this is going to sound paranoid but has anyone else felt like their feed is being read a bit too closely lately",
];

function noticedPostText() {
  return NOTICED_LINES[Math.floor(Math.random() * NOTICED_LINES.length)];
}

const CONFRONT_LINES = [
  "Hey — this is going to sound strange, but have you been looking into my account? Genuinely just want to know if I'm imagining it.",
  "Weird question, but did you flag me or something? I got a review notice and then noticed you'd been on my profile a lot. Just want to understand what's going on.",
  "Sorry to message out of nowhere. I think you've been looking into me — I don't know why, I haven't done anything. Can you just tell me what's happening?",
];

function confrontMessage() {
  return CONFRONT_LINES[Math.floor(Math.random() * CONFRONT_LINES.length)];
}

// Round 23 (#9): "if the player reaches 0% [community trust] their feed
// begins discussing them and targeting them." Reuses this module's
// existing tone (the "noticed" lines above are the same idea at a lower
// intensity) rather than a third, unrelated system — these read as the
// SAME phenomenon escalated all the way, once the whole community (not
// just one suspicious human) has soured on the player.
const HOSTILE_LINES = [
  "ok has anyone else's account gotten flagged out of nowhere this week? feels targeted honestly",
  "there's someone going through people's profiles digging up nothing, be careful who you engage with",
  "not going to say the account name but you'll know it if it's happened to you too",
  "getting real tired of whoever this is that keeps reporting normal people, hope they see this",
  "my cousin's account got suspended over literally nothing right after this one specific person was on their page",
  "starting a list of everyone this account has gone after, DM me if it happened to you",
];

function hostilePostText() {
  return HOSTILE_LINES[Math.floor(Math.random() * HOSTILE_LINES.length)];
}

function reset() {
  Object.keys(suspicion).forEach((k) => delete suspicion[k]);
  Object.keys(reacted).forEach((k) => delete reacted[k]);
}

function dump() {
  return { suspicion: { ...suspicion }, reacted: { ...reacted } };
}

function load(saved) {
  reset();
  if (!saved) return;
  Object.assign(suspicion, saved.suspicion || {});
  Object.assign(reacted, saved.reacted || {});
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { glance, pin, level, checkReactions, noticedPostText, confrontMessage, hostilePostText, reset, dump, load };
} else {
  window.SKRAPERS_TRUST = { glance, pin, level, checkReactions, noticedPostText, confrontMessage, hostilePostText, reset, dump, load };
}

})();
