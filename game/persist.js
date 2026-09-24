// SKRAPERS — Stage 12 (persistence)
// A thin localStorage wrapper so the game survives a reload: credibility,
// flagged accounts, which case/world is loaded, pinned case-board ids,
// the adaptive algo's profile, and whether the CAPTCHA intro has been
// seen. Every read and write is wrapped per the artifact platform's own
// storage guidance (browser storage can come back empty or throw — a
// private window, cleared site data, a first load) — the game must
// render correctly either way, so persistence is treated as a bonus
// layer, never a requirement.
//
// Deliberately NOT persisting the full generated account roster/posts —
// only enough to REBUILD the right world (the case id, or the procedural
// seed + account count) via the exact same generators Stage 6 already
// made deterministic. Storing the whole roster would work too, but would
// desync from any future change to a case's own definition; rebuilding
// from the seed is the same reproducibility principle Stage 6 already
// established ("NO TWO INTERNETS ARE THE SAME" — but the SAME internet,
// same seed, always comes back the same).

(function () {

const KEY = "skrapers.save.v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null; // corrupted, blocked, or unavailable storage — fall back to a fresh session
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false; // private window, quota, or storage disabled — game keeps working in-memory
  }
}

function clear() {
  try {
    localStorage.removeItem(KEY);
    return true;
  } catch (e) {
    return false;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { load, save, clear, KEY };
} else {
  window.SKRAPERS_PERSIST = { load, save, clear, KEY };
}

})();
