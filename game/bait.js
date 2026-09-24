// SKRAPERS — Feature round (player-postable "bait" status)
// Replaces the old ALGO//-mentioning bubble at the top of the Home feed
// (see ui/feed.js's renderHomeHeader, now removed) with a real investigative
// tool: the player posts a leading status from a premade phrase library,
// designed to fish for reactions from both bots and humans. Skraper
// accounts reply mechanically/irrelevantly (reusing the same "reads
// bot-like" spirit as game/comments.js's author-response spectrum, just
// pushed fully toward the bot end on purpose); real humans reply on-topic
// and varied. One active bait status at a time — a simple cooldown/gating
// state, same shape as game/comments.js's per-post comment cap, to keep
// the player from spamming bait posts.

(function () {

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

// The premade library the player picks a bait status FROM — deliberately
// generic, open-ended lines that would plausibly get a reply from a real
// person AND a scripted account: mild "does anyone else notice this"
// bait, not a leading question about any specific account (that would tip
// the player's hand).
const BAIT_PHRASES = [
  "does anyone else think this is getting weird lately?",
  "just found out something wild, does anyone know more about this?",
  "am I the only one who's noticed a few accounts acting off recently?",
  "genuinely curious — has anyone else been getting strange replies today?",
  "something about the timing on all this feels off. anyone else?",
  "not naming names but SOMEONE around here doesn't feel real, right?",
  "what's the strangest account you've run into this week?",
  "ok this is a weird ask but — has this platform felt different lately?",
  "be honest, do you ever scroll and wonder how many of these are even people?",
  "asking for a friend: how would you even tell if an account wasn't real?",
];

// Deliberately mechanical/repetitive and often tangential to what was
// actually posted — the tell a player should learn to read, same "evidence
// is in the pattern, not any one line" spirit as everywhere else replies
// are generated in this game.
const BOT_REPLY_LINES = [
  "Thank you for engaging with this content.",
  "Great post! Check out my profile for more like this.",
  "Interesting take — following for updates on this topic!",
  "Appreciate you — share this if you agree!",
  "This is exactly right, everyone needs to see this.",
  "Noted. Have a great day!",
  "Thanks for sharing, more content like this soon.",
  "Absolutely, couldn't have said it better myself.",
];

// Genuine, on-topic, varied — actually responds to the shape of a bait
// question rather than reciting a fixed acknowledgement.
const HUMAN_REPLY_LINES = [
  "Honestly yeah, I've noticed the same thing this week.",
  "Wait really? What made you think that?",
  "Same, my feed's felt off lately too, hard to explain why.",
  "Not sure, but I've been side-eyeing a couple accounts myself.",
  "Ha, I was JUST thinking this earlier today.",
  "Depends what you mean — got an example?",
  "Kind of, yeah. Can't put my finger on it though.",
  "Lol no you're not the only one, I thought it was just me.",
];

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// One active bait status at a time — the simplest gate against spamming
// bait posts, same spirit as game/comments.js's per-post comment cap.
// Round 23: the bait status is now also a REAL post, attributed to a
// synthetic player account ("__player__") pushed into the live `accounts`
// array — this is what lets it sort into the ordinary feed by its own
// timestamp (allPostsFeed in ui/feed.js) instead of being a UI-only panel
// artificially pinned above the feed forever. `history` keeps past,
// taken-down statuses so the player's own profile still has something to
// show once the live post is gone.
const state = {
  active: null, // { id, text, postedAt, replies: [...], postId, flavorPlan }
  history: [], // past bait statuses, most-recent-first: { text, postedAt, takenDownAt, replies }
};

const PLAYER_ACCT_ID = "__player__";
const MAX_REPLIES = 5; // Round 23 (#5): hard cap, was 8

function canPostBait() {
  return !state.active;
}

function ensurePlayerAccount(allAccounts) {
  if (!allAccounts) return null;
  let acct = allAccounts.find((a) => a.id === PLAYER_ACCT_ID);
  if (!acct) {
    acct = { id: PLAYER_ACCT_ID, name: "You", handle: "@you", isSkraper: false, followers: 0, joined: "This session", following: [], posts: [], bio: "" };
    allAccounts.push(acct);
  }
  acct.posts = acct.posts || [];
  return acct;
}

// Round 23 (#5): a shuffled 5-slot plan that guarantees at least 2
// bot-flavored and 2 human-flavored replies among the 5, rather than
// letting a 50/50 coin flip land all 5 on the same flavor — "targeted
// comments to help nail down who looks fake" needs both sides present to
// compare against, per spec.
function buildFlavorPlan(rng) {
  const plan = ["bot", "bot", "human", "human", rng() < 0.5 ? "bot" : "human"];
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }
  return plan;
}

// `accounts` is optional for back-compat with any stray call site, but
// every real caller (ui/feed.js) now passes the live roster so the status
// becomes a real, findable post.
function postBait(text, accounts) {
  if (state.active) return null;
  const rng = mulberry32(hashSeed(`${text}-${Date.now()}`));
  const id = `bait-${Date.now()}`;
  state.active = { id, text, postedAt: Date.now(), replies: [], postId: null, flavorPlan: buildFlavorPlan(rng) };
  if (accounts) {
    const player = ensurePlayerAccount(accounts);
    const postId = `${PLAYER_ACCT_ID}-${id}`;
    player.posts.unshift({ id: postId, text, timestamp: state.active.postedAt });
    state.active.postId = postId;
  }
  return state.active;
}

// "Take it down" — a genuine retraction: the real post is pulled out of
// the player's own post list (so it stops appearing in the live feed),
// and the whole status moves into `history` so the player's own profile
// still shows it happened.
function clearBait(accounts) {
  if (!state.active) return;
  const done = { text: state.active.text, postedAt: state.active.postedAt, takenDownAt: Date.now(), replies: state.active.replies };
  state.history.unshift(done);
  if (accounts && state.active.postId) {
    const player = accounts.find((a) => a.id === PLAYER_ACCT_ID);
    if (player) player.posts = (player.posts || []).filter((p) => p.id !== state.active.postId);
  }
  state.active = null;
}

// Picks a real account from the live roster to author a reply — bot-kind
// replies always come from an actual Skraper account, human-kind replies
// always come from an actual (non-Skraper) human account, so every reply
// is attributable and clickable straight to a real profile, exactly like
// every other comment/DM system in the game.
function pickReplyAuthor(rng, allAccounts, wantBot, usedIds) {
  const pool = (allAccounts || []).filter((a) => a && !usedIds.has(a.id) && !!a.isSkraper === wantBot);
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)];
}

// Called periodically (e.g. every return to Home, every infinite-scroll
// batch) so the bait status's replies trickle in over time rather than
// appearing all at once — "post bait, then come back and see who bit."
// Returns the newly-added replies (usually 0 or 1) so the caller can
// surface a toast/Inbox entry for a fresh bite.
function tickBaitReplies(allAccounts) {
  if (!state.active) return [];
  if (state.active.replies.length >= MAX_REPLIES) return [];
  const rng = mulberry32(hashSeed(`${state.active.id}-${state.active.replies.length}-${Date.now()}-${Math.random()}`));
  if (rng() >= 0.55) return []; // not every tick produces a bite
  const usedIds = new Set(state.active.replies.map((r) => r.authorAcctId).filter(Boolean));
  const plan = state.active.flavorPlan || buildFlavorPlan(rng);
  let wantBot = plan[state.active.replies.length] === "bot";
  let author = pickReplyAuthor(rng, allAccounts, wantBot, usedIds);
  if (!author) {
    // Flavor called for but the pool's exhausted (e.g. a tiny world) —
    // fall back to the other flavor rather than dropping the tick.
    wantBot = !wantBot;
    author = pickReplyAuthor(rng, allAccounts, wantBot, usedIds);
  }
  if (!author) return [];
  const text = wantBot ? pick(rng, BOT_REPLY_LINES) : pick(rng, HUMAN_REPLY_LINES);
  const reply = {
    id: `${state.active.id}-r${state.active.replies.length}`,
    authorAcctId: author.id,
    authorName: author.name,
    text,
    at: Date.now(),
    readsBotlike: wantBot,
  };
  state.active.replies.push(reply);
  return [reply];
}

function dump() {
  return { active: state.active, history: state.history };
}

function load(saved) {
  state.active = (saved && saved.active) || null;
  state.history = (saved && saved.history) || [];
}

function reset() {
  state.active = null;
  state.history = [];
}

const api = {
  BAIT_PHRASES,
  MAX_REPLIES,
  PLAYER_ACCT_ID,
  state,
  canPostBait,
  postBait,
  clearBait,
  tickBaitReplies,
  dump,
  load,
  reset,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
} else {
  window.SKRAPERS_BAIT = api;
}

})();
