// SKRAPERS — Stage 13
// Subtle horror (doc section 33): impossible timestamps, a name that
// doesn't look quite right, a notification that knows more than it
// should. Deliberately cosmetic and reversible — a toast/label, never a
// change to real account data other systems depend on — so it reads as
// "did that just happen?" rather than corrupting the investigation. Scaled
// by atmosphere phase (game/atmosphere.js): silent at phase 0, rare at 1,
// increasingly frequent through phase 4.

(function () {

const CHANCE_BY_PHASE = [0, 0.08, 0.16, 0.28, 0.42];

const GLITCHES = [
  { type: "timestamp", text: "SYSTEM: a post in your feed is timestamped 4 hours from now. It's gone by the time you look again." },
  { type: "name", text: "SYSTEM: for a moment, one account's name wasn't the one you remembered. It is now." },
  { type: "notice", text: "SYSTEM: ALGO// surfaced a post it says matches \"topics you've been investigating.\" You didn't search for that." },
  { type: "vanish", text: "SYSTEM: a post you flagged earlier isn't in that account's timeline anymore. Neither is the appeal." },
  { type: "mirror", text: "SYSTEM: your own recent activity briefly appeared in someone else's \"suggested for you.\" It's not there now." },
];

function maybeGlitchEvent(phase) {
  const chance = CHANCE_BY_PHASE[Math.max(0, Math.min(4, phase))] || 0;
  if (Math.random() >= chance) return null;
  return GLITCHES[Math.floor(Math.random() * GLITCHES.length)];
}

// The CAPTCHA's own "kept getting it right" escalation (see ui/feed.js's
// renderCaptchaPass). Reuses this module's tone and mechanism — small,
// reversible unease, never a jump scare or a change to real state —
// instead of inventing a parallel glitch system. Escalates the longer a
// player keeps answering the CAPTCHA "correctly" (which, per the game's
// hook, is the dead end): attempt 1 reads completely normal; 2-3 read
// like an odd, unexplained repeat; 4+ start to sound like the system
// itself doesn't know what to do with someone who keeps passing.
const CAPTCHA_NORMAL = {
  title: "VERIFICATION COMPLETE",
  body: "Correct. Thank you — you may continue as normal.",
  note: "Nothing else happens. There is nothing else here.",
};
const CAPTCHA_UNEASY = [
  { title: "VERIFICATION COMPLETE", body: "Correct. Verifying again, just to be sure.", note: "That wasn't asked of you last time." },
  { title: "STILL VERIFYING", body: "One more time.", note: "It didn't say why." },
];
const CAPTCHA_GLITCH = [
  { title: "VERIFICATION C0MPLETE", body: "Correct. Again.", note: "SYSTEM: this account has now passed four consecutive challenges. No account has ever needed four.", glitch: true },
  { title: "VERIFICATION COMPLETE", body: "Correct. The timestamp on this reads three minutes before you opened the page.", note: "It corrects itself if you look again.", glitch: true },
  { title: "VERIFICATION COMPLETE", body: "Correct. It is starting to ask more slowly than it did the first time.", note: "You have not been asked to leave.", glitch: true },
];

function captchaEscalation(streak) {
  if (streak <= 1) return CAPTCHA_NORMAL;
  if (streak <= 3) return CAPTCHA_UNEASY[Math.floor(Math.random() * CAPTCHA_UNEASY.length)];
  return CAPTCHA_GLITCH[Math.floor(Math.random() * CAPTCHA_GLITCH.length)];
}

// ===========================================================================
// Round 27 (#4): THE SECOND GOTCHA — "unusual sign-in activity".
//
// The CAPTCHA -> Terms trick can only land once: it's the front door. This
// is its later-game sibling, and deliberately a different mechanism. The
// CAPTCHA asked "are you human?" and the Terms screen asked "did you
// read?". This asks the question the whole game has been training the
// player to ask about OTHER accounts — "which of this activity is really
// you?" — and turns it on them, under time pressure.
//
// A security modal lists four recent "sessions" on the player's account.
// Every one of them is built from the player's OWN tracked activity
// (investigations opened, the signal they lean on, a case they worked, an
// account they pinned), and every row carries the same session token —
// the one "issued at verification" (the CAPTCHA). All four are the
// player. The fine print says so, for anyone who reads it. The player is
// asked to confirm which sessions were them before a countdown signs the
// rest out. Disowning any of them — especially quickly — is the tell.
//
// This module owns the content and the judgment; ui/feed.js's
// renderSecurityGotcha owns the DOM and the timer, same split as
// captchaEscalation above and renderCaptchaPass.
// ===========================================================================

const SECURITY_COUNTDOWN_SECONDS = 40;
const SECURITY_READING_WPM = 220; // same reading-speed basis as ui/feed.js's TERMS_READING_WPM
const SECURITY_RUSHED_FACTOR = 0.4; // same "implausibly fast" ratio as the Terms gotcha
const SECURITY_TOKEN = "7F3A-C4PT";

const SECURITY_INTRO =
  "We noticed sign-ins to this account that don't match your usual pattern. Before you continue investigating, confirm which of the sessions below were you. Any session you don't confirm will be signed out, and its activity removed from your record.";

const SECURITY_FINE_PRINT =
  "Session records are compiled only from activity carried by this account's own session token, issued once, at verification. Tokens are never shared between accounts.";

// `ctx` is plain data the UI gathers from the player's real tracked state
// (game/algo.js's profile, gameState, the Case Board) — nothing here reads
// globals, so every line on the list is something the player genuinely did.
function buildSecuritySessions(ctx) {
  const c = ctx || {};
  const sessions = [
    {
      id: "s-current",
      current: true, // can't be signed out from itself — shown as already confirmed
      device: "This browser",
      where: "Current location",
      when: "Active now",
      activity: "Scrolling the Home feed.",
    },
    {
      id: "s-investigations",
      device: "Mobile web",
      where: "Location approximate",
      when: "Earlier today",
      activity: c.investigations
        ? `Opened ${c.investigations} investigation${c.investigations === 1 ? "" : "s"}${c.dominantSignal ? `, mostly checking ${c.dominantSignal}` : ""}.`
        : "Opened several account profiles without investigating any of them.",
    },
    {
      id: "s-case",
      device: "Unrecognised device",
      where: "Location unavailable",
      when: c.caseName ? `During ${c.caseName}` : "Yesterday, late",
      activity: c.formalFlags
        ? `Formally flagged ${c.formalFlags} account${c.formalFlags === 1 ? "" : "s"} as artificial.`
        : "Reviewed a case file and closed it without flagging anyone.",
    },
    {
      id: "s-night",
      device: "Unrecognised device",
      where: "Location unavailable",
      when: "03:14",
      activity: c.pinnedName ? `Viewed ${c.pinnedName}'s profile repeatedly, then pinned it.` : "Viewed the same profile repeatedly, then left without acting.",
    },
  ];
  return sessions.map((s) => ({ ...s, token: SECURITY_TOKEN }));
}

// Mirrors ui/feed.js's TERMS_EXPECTED_MIN_SECONDS: computed from the ACTUAL
// words on screen, not hand-counted, so it never drifts from the copy.
function securityExpectedSeconds(sessions) {
  const words = [SECURITY_INTRO, SECURITY_FINE_PRINT, ...sessions.map((s) => `${s.device} ${s.where} ${s.when} ${s.activity} ${s.token}`)]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return (words / SECURITY_READING_WPM) * 60;
}

// `disowned` = how many (all genuinely the player's) sessions were left
// unconfirmed and so signed out. Returns the reveal copy plus a short
// `trace` line for the Player Profile's paper trail.
function judgeSecurityResponse({ elapsedSeconds, disowned, total, timedOut, expectedSeconds }) {
  const secs = elapsedSeconds.toFixed(1);
  const plural = (n) => (n === 1 ? "" : "s");
  const rushedThreshold = (expectedSeconds || 0) * SECURITY_RUSHED_FACTOR;
  if (disowned === 0) {
    return {
      outcome: "recognised",
      title: "RE-VERIFIED",
      body: `Every session on that list was you — the same token on every row, ${total} different corners of your own week. You recognised all of them. Most accounts disown at least one: it's easier to believe someone else was in here than to remember doing it yourself. ALGO// has noted that you remember.`,
      trace: `Recognised all ${total} of your own sessions (${secs}s)`,
    };
  }
  if (timedOut) {
    return {
      outcome: "timed-out",
      title: "SESSIONS SIGNED OUT",
      body: `You let the clock decide. ${disowned} session${plural(disowned)} — all of them yours, same token, issued to you at the CAPTCHA — ${disowned === 1 ? "was" : "were"} signed out while you were still looking. ALGO// treats hesitation as an answer. It usually is one.`,
      trace: `Let the timer sign out ${disowned} of your own sessions`,
    };
  }
  if (elapsedSeconds < rushedThreshold) {
    return {
      outcome: "rushed",
      title: "SESSIONS SIGNED OUT",
      body: `You signed out ${disowned} session${plural(disowned)} in ${secs} seconds. Every one of them was you — look at the token on each row; it's the one you were issued the day you failed the CAPTCHA. You spend longer than that deciding whether a stranger is real. You decided about yourself without looking.`,
      trace: `Disowned ${disowned} of your own sessions in ${secs}s`,
    };
  }
  return {
    outcome: "disowned",
    title: "SESSIONS SIGNED OUT",
    body: `You took ${secs} seconds, read it through, and still signed out ${disowned} session${plural(disowned)} that ${disowned === 1 ? "was" : "were"} yours. Same token on every row. Sometimes the activity just doesn't look like something you'd do. ALGO// has a word for accounts like that. It's the word you use on the ones you flag.`,
    trace: `Read carefully, still disowned ${disowned} of your own sessions`,
  };
}

const SECURITY_GOTCHA = {
  COUNTDOWN_SECONDS: SECURITY_COUNTDOWN_SECONDS,
  RUSHED_FACTOR: SECURITY_RUSHED_FACTOR,
  INTRO: SECURITY_INTRO,
  FINE_PRINT: SECURITY_FINE_PRINT,
  buildSessions: buildSecuritySessions,
  expectedSeconds: securityExpectedSeconds,
  judge: judgeSecurityResponse,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { maybeGlitchEvent, GLITCHES, captchaEscalation, SECURITY_GOTCHA };
} else {
  window.SKRAPERS_HORROR = { maybeGlitchEvent, GLITCHES, captchaEscalation, SECURITY_GOTCHA };
}

})();
