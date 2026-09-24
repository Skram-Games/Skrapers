// SKRAPERS — Stage 13
// Multi-dimensional reputation. The doc explicitly warns against this
// "simply becoming a linear morality meter" (follow-up brainstorm point 3)
// — which is exactly what a single credibility % is. This adds a second,
// genuinely independent axis that can move the OPPOSITE direction from
// ALGO// standing (game/state.js's existing `credibility`, relabeled in
// the UI as "ALGO// STANDING" rather than duplicated here) — a wrongly
// suspended real person costs the community far more than it costs your
// standing with ALGO//, and staying convincingly undercover (the Trust
// system's EXPLAIN choice) can raise ALGO// standing while quietly
// bleeding community trust. Investigation accuracy (game/algo.js) is the
// third, independent axis: how good you actually are, regardless of how
// either audience currently feels about you.

(function () {

const rep = {
  communityTrust: 100,
};

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// A correct flag barely moves community trust (removing a real Skraper
// helps the community, but indirectly — they never see the mechanism). A
// wrong flag against a real human costs it heavily: someone's account
// just got suspended over nothing.
function applyFlagOutcome(correct) {
  rep.communityTrust = clamp(rep.communityTrust + (correct ? 1 : -14), 0, 100);
}

function applyDelta(amount) {
  rep.communityTrust = clamp(rep.communityTrust + amount, 0, 100);
}

function reset() {
  rep.communityTrust = 100;
}

function load(saved) {
  if (saved && typeof saved.communityTrust === "number") rep.communityTrust = saved.communityTrust;
  else rep.communityTrust = 100;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { rep, applyFlagOutcome, applyDelta, reset, load };
} else {
  window.SKRAPERS_REPUTATION = { rep, applyFlagOutcome, applyDelta, reset, load };
}

})();
