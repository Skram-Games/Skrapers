// SKRAPERS — Stage 13
// Narrative/visual progression (doc sections 32-34): the platform is
// supposed to feel like it's shifting under the player as the
// investigation deepens — MODERN toward OPPRESSIVE, clean blue/white/navy
// toward an amber "M.A.I. influence" look. This computes ONE shared phase
// number (0-4) that ui/feed.js applies as a CSS class on #app (see
// ui/styles.css's .phase-0 .. .phase-4 rules) and that game/horror.js
// scales its glitch frequency against — one driver, two consumers, so the
// visual shift and the horror beats always agree with each other.
//
// Driven by how deep the player is into the investigation (correct
// flags) tempered by how badly it's going for the people around them
// (community trust) — a player who's caught a lot of Skrapers but wrecked
// community trust doing it slides into the oppressive end faster than one
// who's catching just as many cleanly. Deliberately NOT driven by ALGO//
// standing alone — per the doc, staying in ALGO//'s good graces is not
// supposed to read as "things are fine."

(function () {

function computePhase({ correctFlags, communityTrust }) {
  correctFlags = correctFlags || 0;
  communityTrust = typeof communityTrust === "number" ? communityTrust : 100;
  let phase = Math.floor(correctFlags / 3); // one step every 3 clean catches
  if (communityTrust < 70) phase += 1; // the community noticing you costs you a step
  if (communityTrust < 40) phase += 1; // and losing it outright costs another
  return Math.max(0, Math.min(4, phase));
}

const PHASE_LABELS = [
  "ordinary",
  "attentive",
  "watchful",
  "strained",
  "compromised",
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { computePhase, PHASE_LABELS };
} else {
  window.SKRAPERS_ATMOSPHERE = { computePhase, PHASE_LABELS };
}

})();
