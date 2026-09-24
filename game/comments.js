// SKRAPERS — Stage 16 (feature round: comments, reposts, corkboard, nav IA)
// Comment library + per-post comment threads.
//
// Two separate things live here:
//   1. A premade comment "library" the PLAYER picks from (never free text)
//      to reply to any post — varied per post (seeded off the post id, the
//      same mulberry32-seeded-PRNG convention simulation/worldgen.js uses
//      for anything that needs to be reproducible), capped at 5 posts by
//      the player PER POST because ALGO// reads excessive interaction on
//      one thread as suspicious — tied into the player's own ALGO//
//      standing rather than a hard wall with no consequence.
//   2. NPC comment threads: each post gets a believable, varied comment
//      count (most low, some "viral") and a capped (<=20), personality-
//      flavored list of actual comment content — some of it deliberately
//      carrying evidentiary weight (echoed phrasing, templated cadence)
//      for Skraper-authored posts, per the doc's "no single signal is
//      conclusive, weigh them together" design principle applied to
//      comments too.

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

function rngFor(postId, salt) {
  return mulberry32(hashSeed(`${postId}::${salt || ""}`));
}

// The premade library the player picks from. Grouped by tone so the
// per-post subset (below) can pull a spread rather than 6 near-duplicates.
const PREMADE_COMMENTS = {
  agree: [
    "This is exactly right.",
    "Glad someone said it.",
    "Yep, matches what I've been seeing too.",
    "Couldn't agree more honestly.",
    "This tracks.",
    "Same energy, same thought.",
  ],
  skeptic: [
    "Not sure I buy this.",
    "Source? genuinely asking.",
    "This feels off but I can't say why yet.",
    "Feels like there's more to this story.",
    "Hm. Skeptical, but open to being wrong.",
    "Something about this doesn't add up.",
  ],
  joke: [
    "lol okay",
    "the way I gasped 😭",
    "not me reading this twice",
    "screenshotting this for later",
    "this is sending me",
    "why is this so real though",
  ],
  question: [
    "Wait, what happened before this?",
    "Anyone got more context?",
    "Is this still developing?",
    "When did this start?",
    "What am I missing here?",
    "Genuinely curious how this plays out.",
  ],
  support: [
    "Sending good thoughts your way.",
    "Take care of yourself.",
    "Rooting for you on this one.",
    "This needed to be said.",
    "Appreciate you posting this.",
    "Thanks for sharing, seriously.",
  ],
  short: [
    "Real.",
    "This.",
    "Huh.",
    "Noted.",
    "Wow.",
    "Interesting.",
  ],
};
const PREMADE_CATEGORIES = Object.keys(PREMADE_COMMENTS);

// Deterministic, per-post subset of the library — pulls a small spread
// across categories rather than the same 10 options everywhere, so it
// reads as real variety rather than a static global list.
function premadeOptionsForPost(post) {
  const rng = rngFor(post.id, "premade");
  const perCategory = 1 + Math.floor(rng() * 2); // 1-2 per category
  const options = [];
  PREMADE_CATEGORIES.forEach((cat) => {
    const pool = [...PREMADE_COMMENTS[cat]];
    for (let i = 0; i < perCategory && pool.length; i++) {
      const idx = Math.floor(rng() * pool.length);
      options.push(pool.splice(idx, 1)[0]);
    }
  });
  // shuffle the combined spread (still seeded, still reproducible per post)
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options.slice(0, 8);
}

// ---- NPC comment threads -------------------------------------------

const NPC_REACT_LINES = [
  "wait this is wild",
  "yeah I saw this too",
  "not surprised honestly",
  "this aged interesting",
  "okay but why is nobody talking about this more",
  "following for updates",
  "screenshotted",
  "hm.",
  "this is the third time I've seen this today",
  "can confirm, saw the same thing",
];

// Deliberately templated/echoed lines used for Skraper-authored posts —
// the comments themselves can carry evidentiary weight (repeated phrasing,
// content-free agreement, oddly uniform tone) the same way the account's
// own posts do.
const NPC_EVIDENCE_LINES = [
  "Agreed 100% — everyone needs to see this.",
  "This is exactly right, sharing now.",
  "Couldn't have said it better, this needs more attention.",
  "So true, more people need to know this.",
  "Exactly what I've been saying — share before it's gone.",
];

// Feature round (fake ads): astroturf-flavored comments — suspiciously
// enthusiastic, generic, "just ordered mine!" energy — used on posts
// tagged postType 'ad' (see simulation/worldgen.js) so an ad's comment
// thread is itself investigatable content, not decoration, per the design
// request. Deliberately generic/content-free in the same spirit as
// NPC_EVIDENCE_LINES above, just enthusiasm-flavored instead of
// agreement-flavored.
const NPC_ASTROTURF_LINES = [
  "Just ordered mine, can't wait!!",
  "This looks amazing, adding to cart right now",
  "Best purchase I've made all year, no cap",
  "Wait I need this immediately",
  "Been eyeing this for weeks, finally pulling the trigger",
  "10/10 recommend, changed my routine completely",
  "So glad I found this page honestly",
  "Ordered 2, one for me one for my sister",
  "This is exactly what I needed, thank you!!",
  "Already told all my friends about this one",
];

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// Stage 18 (bug-fix round, #2 "Top Contributors"): picks a real account
// from the live roster to "be" an NPC comment's author, instead of a bare
// name string with nothing behind it — this is what lets a comment link
// to an actual profile (item #1) AND lets a profile tally who comments on
// it most (item #2). Biased, not random-uniform, so the resulting pattern
// reads as organic rather than a flat tell either way: a Skraper post has
// a real (not guaranteed) chance of pulling its commenter from the same
// Skraper cluster — a genuine structural signal a player can notice via
// Top Contributors, feeding the existing "structural discovery" lead the
// Connections panel already opens (ui/feed.js's checkConnectionLead) —
// while a human post has a real chance of pulling a commenter who already
// follows/is followed by the account, which just looks like a normal
// mutual, not a giveaway. Neither bias is a hard rule, so it doesn't turn
// into an automatic tell in either direction. Falls back to a uniform pick
// across every other account when the roster is unavailable (e.g. a
// direct unit call with no `allAccounts`) or the biased pool is empty.
function pickCommenterAccount(rng, acct, allAccounts) {
  if (!allAccounts || !allAccounts.length) return null;
  const pool = allAccounts.filter((a) => a && a.id !== acct.id);
  if (!pool.length) return null;
  let candidate = null;
  if (acct.isSkraper && rng() < 0.4) {
    const peers = pool.filter((a) => a.isSkraper);
    if (peers.length) candidate = pick(rng, peers);
  }
  if (!candidate && !acct.isSkraper && rng() < 0.35) {
    const mutuals = pool.filter((a) => !a.isSkraper && ((acct.following || []).includes(a.id) || (a.following || []).includes(acct.id)));
    if (mutuals.length) candidate = pick(rng, mutuals);
  }
  if (!candidate) candidate = pick(rng, pool);
  return candidate;
}

// How many comments a post "has" — most posts stay small, a minority
// (especially Skraper-authored or event-amplified ones) read as viral
// with an inflated count, but the actual rendered content is always
// capped well below that.
function commentMeta(post, acct, isTrending) {
  if (post._cmMeta) return post._cmMeta;
  const rng = rngFor(post.id, "meta");
  const roll = rng();
  // Feature round: an astroturfed ad reads as more "popular" than an
  // organic post of similar reach — inflated engagement is part of the
  // tell, same soft-signal spirit as everything else here.
  let baseChance = post.postType === "ad" ? 0.5 : acct.isSkraper ? 0.32 : 0.07;
  if (isTrending) baseChance += 0.4;
  const viral = roll < baseChance;
  let displayCount, actualCount;
  if (viral) {
    displayCount = 900 + Math.floor(rng() * 4200); // "1.2K"-ish territory
    actualCount = Math.min(20, 11 + Math.floor(rng() * 10));
  } else {
    displayCount = Math.floor(rng() * (acct.isSkraper ? 7 : 5));
    actualCount = displayCount;
  }
  const meta = { viral, displayCount, actualCount };
  post._cmMeta = meta;
  return meta;
}

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return String(n);
}

// Generates the actual NPC comment list for a post, capped at `actualCount`
// (itself already capped at 20 by commentMeta). Deterministic per post so
// re-opening a thread shows the same NPC comments every time.
//
// `allAccounts` (Stage 18): when passed, each comment is attributed to a
// real account from the roster (see pickCommenterAccount above) instead of
// a bare name — this is what makes comment-thread avatars/names clickable
// (item #1) and lets a profile's Top Contributors panel (item #2) tally
// real repeat commenters. Falls back to the old bare-name pool when no
// roster is available (e.g. a plain unit call), so nothing that already
// calls this with 3 args breaks.
function npcCommentsForPost(post, acct, isTrending, allAccounts) {
  const meta = commentMeta(post, acct, isTrending);
  if (post._cmNpc) return post._cmNpc;
  const rng = rngFor(post.id, "npc");
  const fallbackNames = ["Robyn", "Denny", "Mia", "Priya", "Callum", "Grace", "Marcus", "Aisha", "Ben", "Elena", "Femi", "Iris", "Jamal", "Liam", "Nadia", "Oscar", "Quinn", "Sofia", "Theo", "Uma"];
  const list = [];
  const n = meta.actualCount;
  // A Skraper's comment section skews toward evidence-flavored, near-
  // identical agreement — a small, deliberate tell for players who open
  // the thread, not just the parent post's own signals.
  const evidenceShare = acct.isSkraper ? 0.55 : 0.08;
  // Feature round: an ad post's comment section skews toward astroturf-
  // flavored enthusiasm instead — investigatable content in its own right,
  // not decoration (see NPC_ASTROTURF_LINES above).
  const isAd = post.postType === "ad";
  const astroturfShare = isAd ? 0.6 : 0;
  for (let i = 0; i < n; i++) {
    const roll = rng();
    let text, useEvidence = false;
    if (isAd && roll < astroturfShare) {
      text = pick(rng, NPC_ASTROTURF_LINES);
    } else {
      useEvidence = rng() < evidenceShare;
      text = useEvidence ? pick(rng, NPC_EVIDENCE_LINES) : pick(rng, NPC_REACT_LINES);
    }
    const commenter = pickCommenterAccount(rng, acct, allAccounts);
    list.push({
      id: `${post.id}-c${i}`,
      author: commenter ? commenter.name : fallbackNames[Math.floor(rng() * fallbackNames.length)],
      authorAcctId: commenter ? commenter.id : null,
      authorHandle: commenter ? commenter.handle : null,
      text,
      minsAgo: Math.floor(rng() * 180) + 1,
      evidence: useEvidence,
    });
  }
  post._cmNpc = list;
  return list;
}

// Stage 18 (#2): tallies which accounts comment most often on THIS
// account's own posts — both NPC-authored (now attributed to real
// accounts, see npcCommentsForPost above) and player-authored. Ranked,
// top 5. Reuses the same generation path everything else uses (not a
// separate simulation layer), so calling this on a profile the player has
// never opened a thread on still produces real, deterministic data —
// exactly the "organic NPC-to-NPC commenting activity" the design note
// calls for, generated on demand rather than pre-baked.
function topContributorsFor(acct, allAccounts) {
  const tally = new Map();
  (acct.posts || []).forEach((post) => {
    const npc = npcCommentsForPost(post, acct, false, allAccounts);
    npc.forEach((c) => {
      if (!c.authorAcctId) return;
      const entry = tally.get(c.authorAcctId) || { acctId: c.authorAcctId, name: c.author, handle: c.authorHandle, count: 0 };
      entry.count += 1;
      tally.set(c.authorAcctId, entry);
    });
    const playerCount = playerCommentsFor(post.id).length;
    if (playerCount > 0) {
      const entry = tally.get("__player__") || { acctId: "__player__", name: "You", handle: "", count: 0 };
      entry.count += playerCount;
      tally.set("__player__", entry);
    }
  });
  return [...tally.values()].sort((a, b) => b.count - a.count).slice(0, 5);
}

// ---- Player-authored comments (state) --------------------------------

const state = {
  playerComments: {}, // postId -> [{ id, text, at, respondedAt }]
  responses: {}, // postId -> [{ id, forCommentId, author, text, at, bot }] — the post AUTHOR'S replies
};

const MAX_PLAYER_COMMENTS_PER_POST = 5;

function playerCommentsFor(postId) {
  return state.playerComments[postId] || [];
}

function responsesFor(postId) {
  return state.responses[postId] || [];
}

function remainingFor(postId) {
  return Math.max(0, MAX_PLAYER_COMMENTS_PER_POST - playerCommentsFor(postId).length);
}

// Stage 17 (#6): gates the player's 2nd/3rd/... comment on a given post —
// they can never fire off several in a row with no reply in between. The
// very first comment on a post is always free; every comment after that
// needs the post's author to have already responded to the player's most
// recent one there.
function canPostComment(postId) {
  const list = playerCommentsFor(postId);
  if (list.length === 0) return { allowed: true };
  if (list.length >= MAX_PLAYER_COMMENTS_PER_POST) return { allowed: false, reason: "cap" };
  const last = list[list.length - 1];
  if (!last.respondedAt) return { allowed: false, reason: "waiting" };
  return { allowed: true };
}

// Posts a premade comment on behalf of the player. Enforces the 5-per-post
// cap AND the gating above, and nudges the player's own suspicion/standing
// the same way over-investigating a real human does in game/trust.js —
// ALGO// reads repeated interaction on one thread as suspicious, not just
// a hard wall.
function postComment(post, acct, text) {
  const list = state.playerComments[post.id] || (state.playerComments[post.id] = []);
  const gate = canPostComment(post.id);
  if (!gate.allowed) {
    if (gate.reason === "waiting") {
      return {
        ok: false,
        blocked: true,
        waiting: true,
        message: `Waiting for @${(acct.handle || "").replace(/^@/, "")} to reply before you can comment again on this post.`,
      };
    }
    return {
      ok: false,
      blocked: true,
      message: "ALGO// has flagged repeated commenting on this post as suspicious. You can't comment here again.",
    };
  }
  const id = `${post.id}-pc${list.length}`;
  list.push({ id, text, at: Date.now(), respondedAt: null });
  const count = list.length;
  let suspicionNote = "";
  // The last one or two comments on a single thread are the ones that
  // actually read as excessive — small, escalating cost rather than a
  // wall with nothing behind it.
  if (count >= 4) {
    if (window.SKRAPERS_STATE) {
      window.SKRAPERS_STATE.state.credibility = Math.max(0, window.SKRAPERS_STATE.state.credibility - (count === 5 ? 4 : 2));
    }
    if (acct && !acct.isSkraper && window.SKRAPERS_TRUST) {
      window.SKRAPERS_TRUST.glance(acct.id);
    }
    suspicionNote = count === 5 ? " ALGO// noted the pattern — this is your last comment on this post." : " ALGO// is starting to notice how often you're commenting here.";
  }
  return { ok: true, commentId: id, remaining: MAX_PLAYER_COMMENTS_PER_POST - count, message: `Comment posted.${suspicionNote}` };
}

// ---- Post-author responses (Stage 17, #6) ----------------------------
// A believable, human-authored line for a real human replying to their
// own comments section — varied phrasing, genuinely reactive to a comment
// existing at all rather than to its specific content (this is a comment
// LIBRARY game, not free text, so the response can't literally parse what
// was said).
const HUMAN_RESPONSE_LINES = [
  "haha thank you, appreciate you saying that",
  "honestly yeah, that's fair",
  "oh good, wasn't sure anyone would read this one",
  "lol I know, was thinking the same thing",
  "appreciate you — been a weird week",
  "ha, exactly what I was going for",
  "thanks for reading all the way down here",
  "yeah I get that a lot actually",
  "not gonna lie that made me laugh",
  "wait thank you, genuinely",
];

// Deliberately mechanical/repetitive — the Skraper's reply reads like the
// same handful of near-identical acknowledgement lines regardless of who's
// talking to it, tying into the game's existing "evidence" convention
// (game/comments.js's NPC_EVIDENCE_LINES) rather than being pure flavor.
const BOT_RESPONSE_LINES = [
  "Thank you for engaging with this content.",
  "Appreciate your support — share if you agree.",
  "Glad this resonated with you.",
  "Thanks for the comment, more content like this soon.",
  "Appreciate you — everyone needs to see this.",
];

// A small number of Skraper responses "slip" and use a more human-sounding
// line anyway — the range the doc asks for isn't every reply reading
// identically robotic, it's a SPECTRUM the player has to actually notice.
function generateAuthorResponse(post, acct, commentId) {
  const rng = rngFor(post.id, `resp-${commentId}`);
  const isBot = !!acct.isSkraper;
  // 22% of a Skraper's replies pass as human-ish; 12% of a real human's
  // replies land oddly generic (people are inconsistent too) — the tell is
  // in the PATTERN across a whole thread, not any single line.
  const useHuman = isBot ? rng() < 0.22 : rng() >= 0.12;
  const text = useHuman ? pick(rng, HUMAN_RESPONSE_LINES) : pick(rng, BOT_RESPONSE_LINES);
  return {
    id: `${post.id}-r${responsesFor(post.id).length}`,
    forCommentId: commentId,
    author: acct.name,
    text,
    at: Date.now(),
    // "reads bot-like" is what the PLAYER can notice and use as evidence —
    // exposed on the object so the UI can hint at it without spelling out
    // ground truth, and so it's inspectable in tests.
    readsBotlike: !useHuman,
    trueBot: isBot,
  };
}

// Feature round (profile Message action): the account's one-shot DM reply.
// Reuses the exact same human/bot response-line banks and human-ish-slip
// odds as generateAuthorResponse above, seeded off the account id rather
// than a post+comment id (there's no post/comment here — a DM exchange is
// per-account, not per-thread) — same spectrum-not-a-tell spirit as
// everywhere else the game generates author voice.
function generateDMReply(acct) {
  const rng = rngFor(`dm-${acct.id}`, "reply");
  const isBot = !!acct.isSkraper;
  const useHuman = isBot ? rng() < 0.22 : rng() >= 0.12;
  const text = useHuman ? pick(rng, HUMAN_RESPONSE_LINES) : pick(rng, BOT_RESPONSE_LINES);
  return { text, readsBotlike: !useHuman, trueBot: isBot };
}

// ===========================================================================
// Round 29 (#1): INTERROGATION — the one-shot DM grown into a short,
// branching questioning. Still the premade-phrase convention (the player
// picks questions from a fixed library, never free text), but now:
//   - up to INTERROGATION_ROUNDS (3) questions per account, each round's
//     options depending on what's already been asked (a small tree);
//   - every question belongs to one FACT (where they are, how long they've
//     been here, their profile photo, what they're into), and each fact has
//     two framings — an opener and a CROSS-CHECK. Asking both is how you
//     test a story: "where are you posting from today?" then "what time is
//     it where you are?"
//   - a real person's answers are generated from ONE consistent profile
//     (their stated location, their join date, their own personality's
//     topics — plus, for a Round 29 red herring, the innocent REASON for
//     their suspicious trait, which they explain when asked). They never
//     contradict themselves.
//   - a Skraper runs a cover story, and a cover story has seams: on the
//     facts in its `slips` list, the two framings disagree. Slips are tied
//     to the SAME tells the deep records carry — a timezone tell always
//     slips on location (it answers with its operator's clock, not the
//     stated city's), a pre-launch record tell always slips on tenure (it
//     "remembers" a year before it joined, sometimes before ALGO// existed),
//     a stock-photo tell always slips on the photo, a mismatched engagement
//     history always slips on interests — and any Skraper can slip on any
//     fact by chance (sleepers, built to be careful, half as often). So a
//     player who catches a contradiction has usually caught the same thing
//     a deep pull would show, for the price of a few questions instead.
// All of it is deterministic per account (the same mulberry32 convention as
// everything else here); only the "what time is it" answer reads the real
// clock, because the conversation is happening now.
// ===========================================================================
const INTERROGATION_ROUNDS = 3;
const INTERROGATION_FACTS = {
  location: { label: "Where they are", a: "loc_a", b: "loc_b" },
  tenure: { label: "How long they've been on ALGO//", a: "ten_a", b: "ten_b" },
  photo: { label: "Their profile photo", a: "pho_a", b: "pho_b" },
  interest: { label: "What they're into", a: "int_a", b: "int_b" },
};
const INTERROGATION_QUESTIONS = {
  loc_a: { fact: "location", text: "Where are you posting from today?" },
  loc_b: { fact: "location", text: "What time is it where you are right now?", crossCheck: true },
  ten_a: { fact: "tenure", text: "How long have you been on ALGO//?" },
  ten_b: { fact: "tenure", text: "What do you remember about ALGO// from when you first joined?", crossCheck: true },
  pho_a: { fact: "photo", text: "Is that you in your profile picture?" },
  pho_b: { fact: "photo", text: "Who took that profile photo?", crossCheck: true },
  int_a: { fact: "interest", text: "What got you posting about {topic}?" },
  int_b: { fact: "interest", text: "What else have you been reading lately?", crossCheck: true },
};
const INTERROGATION_OPENERS = ["loc_a", "ten_a", "int_a", "pho_a"];
// Chance a Skraper's cover story slips on a fact it carries NO planted tell
// for — kept low, so a contradiction mostly points at the same things a
// deep pull would show. Measured over Cases 001-030: ~82% of Skrapers slip
// on at least one fact — but three questions can only cross-check one or
// two of the four, so picking WHICH story to test still decides it, and
// roughly one Skraper in five has no seam at all.
const SKRAPER_SLIP_CHANCE = { location: 0.15, tenure: 0.12, photo: 0.12, interest: 0.12 };
const PHOTO_TAKERS = ["my sister", "a friend", "my partner", "my brother", "my mum", "a mate from work"];
const PHOTO_PLACES = ["at a wedding", "on holiday", "at the beach", "in the garden", "at a birthday", "on a hike"];
const LAUNCH_YEAR = 2010;

function interrogationRng(acct, salt) {
  return rngFor(`interro-${acct.id}`, salt);
}

function personalityOf(acct) {
  const P = typeof window !== "undefined" && window.SKRAPERS_PERSONALITIES;
  if (!P) return {};
  return P.HUMAN_PERSONALITIES[acct.personalityKey] || P.SKRAPER_TYPES[acct.personalityKey] || {};
}

function joinYearOf(acct) {
  const m = /(\d{4})/.exec(acct.joined || "");
  return m ? parseInt(m[1], 10) : null;
}

// The ground truth a cover story carries — which facts this account's two
// framings disagree on, plus the fixed details its answers draw from.
// Recomputed on demand (cheap, deterministic) rather than cached on the
// account object, so it never rides along into a saved world.
function interrogationProfile(acct) {
  const rng = interrogationRng(acct, "profile");
  const deep = acct.deep || {};
  const tells = deep.tells || [];
  const p = personalityOf(acct);
  // The personality's own subject list (short noun phrases written in its
  // own first person, e.g. "my lineup") — turned round into second person
  // for the question itself (see questionText).
  const topics = (p.topics || p.topicPool || ["this"]).slice();
  const rL = rng(), rT = rng(), rP = rng(), rI = rng();
  const topic = topics[Math.floor(rng() * topics.length)];
  const topic2 = topics[Math.floor(rng() * topics.length)];
  const takerA = pick(rng, PHOTO_TAKERS);
  let takerB = pick(rng, PHOTO_TAKERS);
  if (takerB === takerA) takerB = PHOTO_TAKERS[(PHOTO_TAKERS.indexOf(takerA) + 1) % PHOTO_TAKERS.length];
  const placeA = pick(rng, PHOTO_PLACES);
  const placeB = pick(rng, PHOTO_PLACES);
  const shiftHours = (6 + Math.floor(rng() * 6)) * (rng() < 0.5 ? 1 : -1);
  const earlyBack = 3 + Math.floor(rng() * 4);
  const slips = [];
  if (acct.isSkraper && (acct.posts || []).length) {
    const f = acct.personalityKey === "sleeper" ? 0.5 : 1;
    if (tells.indexOf("timezone") !== -1 || rL < SKRAPER_SLIP_CHANCE.location * f) slips.push("location");
    if (tells.indexOf("record") !== -1 || rT < SKRAPER_SLIP_CHANCE.tenure * f) slips.push("tenure");
    if (tells.indexOf("photo") !== -1 || rP < SKRAPER_SLIP_CHANCE.photo * f) slips.push("photo");
    if (deep.engagementStyle === "mismatch" || rI < SKRAPER_SLIP_CHANCE.interest * f) slips.push("interest");
  }
  return { slips, topic, topic2, takerA, takerB, placeA, placeB, shiftHours, earlyBack, herring: deep.herring || null };
}

// Which facts this account's answers contradict on. Empty for every real
// person, always. Read by the closing report (ui/feed.js) to check whether
// a contradiction the player marked was a real one — never shown directly.
function interrogationSlips(acct) {
  return interrogationProfile(acct).slips.slice();
}

function secondPerson(t) {
  return String(t)
    .replace(/\bI'm\b/g, "you're")
    .replace(/\bI've\b/g, "you've")
    .replace(/\bI\b/g, "you")
    .replace(/\b[Mm]y\b/g, "your")
    .replace(/\bme\b/g, "you")
    .replace(/\bmine\b/g, "yours")
    .replace(/\bwe\b/g, "you")
    .replace(/\bour\b/g, "your")
    .replace(/\btheir\b/g, "your");
}

function questionText(acct, qid) {
  const q = INTERROGATION_QUESTIONS[qid];
  if (!q) return "";
  return q.text.split("{topic}").join(secondPerson(interrogationProfile(acct).topic));
}

// The next round's choices, given the question ids already asked (in
// order). Round 1 opens three facts; from round 2 on, any fact that's been
// opened but not cross-checked is offered first, then fresh openers. Three
// questions can never cross-check everything: open-and-check one fact and
// open a second, or open two and check one — which story to test is the
// player's call.
function interrogationOptions(askedIds) {
  const asked = askedIds || [];
  if (asked.length >= INTERROGATION_ROUNDS) return [];
  if (!asked.length) return ["loc_a", "ten_a", "int_a"];
  const pending = Object.values(INTERROGATION_FACTS)
    .filter((f) => asked.indexOf(f.a) !== -1 && asked.indexOf(f.b) === -1)
    .map((f) => f.b);
  const fresh = INTERROGATION_OPENERS.filter((q) => asked.indexOf(q) === -1);
  if (asked.length === 1) {
    // Round 2: the cross-check for what you just opened, the photo, and one
    // more fresh fact.
    const other = fresh.filter((q) => q !== "pho_a");
    return [...pending, ...(fresh.indexOf("pho_a") !== -1 ? ["pho_a"] : []), ...other.slice(0, 1)].slice(0, 3);
  }
  return [...pending, ...fresh].slice(0, 3);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function clockAt(utc, now) {
  const d = new Date(now + utc * 3600000);
  return { h: d.getUTCHours(), m: d.getUTCMinutes(), label: `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}` };
}

function partOfDay(h) {
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 14) return "lunchtime";
  if (h >= 14 && h < 18) return "afternoon";
  if (h >= 18 && h < 23) return "evening";
  return "the middle of the night";
}

// A real person's voice, from their own personality's style fields — the
// same caps/punctuation habits their posts already have (see
// simulation/generate.js), applied deterministically.
function inVoice(acct, text) {
  const p = personalityOf(acct);
  let out = text;
  if (!acct.isSkraper) {
    if (p.capsStyle === "lowercase-default") out = out.toLowerCase();
    else if (p.capsStyle === "lowercase-lean") out = out.charAt(0).toLowerCase() + out.slice(1);
    if (p.punctuation === "minimal" || p.punctuation === "sparse-expressive") out = out.replace(/[.]$/, "");
    const h = acct.deep && acct.deep.herring;
    if (h && h.kinds.indexOf("tone") !== -1) out = out.replace(/ — /g, ". ").replace(/,/g, ".").replace(/!+/g, ".");
  }
  return out;
}

// One answer, as { text, clock } — `clock` (only for the time question) is
// the stated city's real local time at the moment of asking, recorded with
// the answer so the player can compare the two later.
function interrogationAnswer(acct, qid, now) {
  now = typeof now === "number" ? now : Date.now();
  const q = INTERROGATION_QUESTIONS[qid];
  if (!q) return { text: "" };
  if (!(acct.posts || []).length) {
    return { text: "— no reply. This account has never posted, and it doesn't answer messages either. —", silent: true };
  }
  const prof = interrogationProfile(acct);
  const rng = interrogationRng(acct, `answer-${qid}`);
  const deep = acct.deep || {};
  const loc = deep.location || { city: "here", utc: 0 };
  const herring = prof.herring;
  const hk = (k) => !!(herring && herring.kinds.indexOf(k) !== -1);
  const slip = prof.slips.indexOf(q.fact) !== -1;
  const joined = acct.joined || "a while ago";
  const joinYear = joinYearOf(acct);
  const bot = acct.isSkraper;
  let text = "";
  let clock = null;

  if (qid === "loc_a") {
    if (bot) text = pick(rng, [`${loc.city}.`, `Posting from ${loc.city}, like always.`, `${loc.city}, same as ever.`]);
    else if (hk("timezone") && herring.reason.timezone === "travelling" && herring.travel) text = `I'm in ${herring.travel.city} this week for work, actually. Normally ${loc.city}.`;
    else if (hk("timezone") && herring.reason.timezone === "remote") text = `${loc.city} — but I work for a team on the other side of the world, so my hours are a mess.`;
    else if (hk("timezone") && herring.reason.timezone === "insomnia") text = `${loc.city}. Awake, as usual. I barely sleep.`;
    else if (hk("timezone") && herring.reason.timezone === "nightshift") text = `${loc.city}. Just off a night shift.`;
    else text = pick(rng, [`${loc.city}, same as always.`, `Home — ${loc.city}.`, `Just at home in ${loc.city}.`]);
    if (!bot && hk("tone") && herring.reason.tone === "esl") text += " Sorry if I write strange — English is my second language.";
  } else if (qid === "loc_b") {
    clock = { city: loc.city, label: clockAt(loc.utc, now).label };
    if (bot && slip) {
      const t = clockAt(loc.utc + prof.shiftHours, now);
      text = `About ${t.label} — it's ${partOfDay(t.h)} here.`;
    } else if (!bot && hk("timezone") && herring.reason.timezone === "travelling" && herring.travel) {
      const t = clockAt(herring.travel.utc, now);
      text = `${t.label} here in ${herring.travel.city} — so ${clock.label} back home. My body has no idea which one it's on.`;
    } else {
      const t = clockAt(loc.utc, now);
      text = bot ? `It's ${t.label} here.` : `${t.label} — ${partOfDay(t.h)}${hk("timezone") ? ", and yes, I'm still up" : ""}.`;
    }
  } else if (qid === "ten_a") {
    text = bot ? `Since ${joined}.` : pick(rng, [`Since ${joined}. Feels longer.`, `Joined ${joined}, I think. Something like that.`, `${joined}. Time flies.`]);
  } else if (qid === "ten_b") {
    if (bot && slip) {
      const rec = /(\d{4})/.exec(deep.recordCreated || "");
      const year = rec ? parseInt(rec[1], 10) : (joinYear || 2020) - prof.earlyBack;
      text = `I remember the early days — ${year}, before everyone else found it.${year < LAUNCH_YEAR ? " Hardly anyone was on it." : ""}`;
    } else if (!joinYear) {
      text = "Not much, honestly.";
    } else if (joinYear <= 2015) {
      text = `It was quieter back in ${joinYear}. Fewer ads, more actual people.`;
    } else if (joinYear <= 2020) {
      text = bot ? `In ${joinYear} it was simpler.` : `Back in ${joinYear} I mostly just lurked. Took me ages to post anything.`;
    } else {
      text = bot ? `${joinYear} wasn't long ago.` : `Not much — ${joinYear} wasn't that long ago. It was already busy by then.`;
    }
  } else if (qid === "pho_a") {
    if (bot) text = `Yes, that's me — ${prof.takerA} took it ${prof.placeA}.`;
    else if (hk("photo") && herring.reason.photo === "stock") text = "No — it's a stock photo. I don't put my face online.";
    else if (hk("photo") && herring.reason.photo === "portfolio") text = "It's me, yes. It's from my own photography portfolio — people lift it all the time.";
    else if ((deep.photoMatches || 0) > 0) text = "Yeah — well, me and my sister. We've used the same photo for years, long story.";
    else text = `Yeah, that's me — ${prof.takerA} took it ${prof.placeA}.`;
  } else if (qid === "pho_b") {
    if (bot && slip) text = pick(rng, ["A professional photographer, for work headshots.", `${prof.takerB[0].toUpperCase()}${prof.takerB.slice(1)} did, ${prof.placeB}.`]);
    else if (bot) text = `${prof.takerA[0].toUpperCase()}${prof.takerA.slice(1)}, ${prof.placeA}.`;
    else if (hk("photo") && herring.reason.photo === "stock") text = "Nobody I know — it's off a free stock site. That's the point.";
    else if (hk("photo") && herring.reason.photo === "portfolio") text = "I did, on a timer. It's a self-portrait — it's in my portfolio, which is why it's everywhere.";
    else if ((deep.photoMatches || 0) > 0) text = "My sister took the original, ages ago. We both still use it.";
    else text = `${prof.takerA[0].toUpperCase()}${prof.takerA.slice(1)} did, ${prof.placeA}.`;
  } else if (qid === "int_a") {
    if (bot && slip) text = "It's what I care about. Honestly it's all I really follow — nothing else.";
    else if (bot) text = "It matters. People should see it.";
    else if (hk("cadence")) text = `It's what I care about. I write everything on Sunday night and a scheduling app posts it every ${herring.interval || 90} minutes — I'm not actually online that much.`;
    else text = pick(rng, ["Honestly? It's just what my life looks like right now.", "It's what I actually care about. Always has been.", "Someone has to post about it. Might as well be me."]);
  } else if (qid === "int_b") {
    if (bot && slip) {
      // The same outrage/conspiracy material a mismatched engagement
      // history is full of (simulation/worldgen.js's INFLAMMATORY_*).
      text = pick(rng, [
        "Mostly the threads about what they're hiding from us. People need to wake up.",
        "Anything about who's really behind the council. That's where the real story is.",
        "The deleted-post reuploads, mostly. They don't want you to see them.",
      ]);
    } else if (bot) text = "More of the same, mostly.";
    else if (hk("engagement") && herring.reason.engagement === "hateread") text = "Too many outrage threads, if I'm honest. I hate-read them. Bad habit, I know.";
    else if (hk("engagement") && herring.reason.engagement === "research") text = "A lot of conspiracy threads — I'm writing something about how they spread. Looks awful out of context, I know.";
    else if (hk("engagement") && herring.reason.engagement === "guilty") text = "Reality show recaps and horoscopes, don't judge me. Guilty pleasure. And outrage threads, weirdly.";
    else text = pick(rng, [`More of the same — ${prof.topic2}, and whatever my friends send me.`, `Same as always, honestly. ${prof.topic2[0].toUpperCase()}${prof.topic2.slice(1)}, mostly.`]);
  }
  return { text: inVoice(acct, text), clock };
}

// Marks the player's most recent comment on a post as answered and
// records the author's reply. Called either immediately (a same-turn
// "instant" response) or later via a scheduled callback (see ui/feed.js).
function recordAuthorResponse(post, acct) {
  const list = state.playerComments[post.id] || [];
  const pending = [...list].reverse().find((c) => !c.respondedAt);
  if (!pending) return null;
  const response = generateAuthorResponse(post, acct, pending.id);
  pending.respondedAt = response.at;
  const arr = state.responses[post.id] || (state.responses[post.id] = []);
  arr.push(response);
  return response;
}

// Whether this post currently has a player comment waiting on a response
// — used to decide whether it's even worth scheduling one.
function hasPendingComment(postId) {
  return playerCommentsFor(postId).some((c) => !c.respondedAt);
}

// Stage 17 (flag rework, "over time new comments appear on posts that
// subtly signal changes"): called once per return to the feed against
// every currently red-flagged post. A small chance a new NPC comment
// appears on it — reusing the same NPC generation used everywhere else,
// so it's not a special-cased event — which is what the player is meant
// to notice and, if they choose, flag again.
function maybeGrowFlaggedPost(post, acct, allAccounts) {
  if (Math.random() >= 0.22) return false;
  const meta = commentMeta(post, acct, false);
  const list = npcCommentsForPost(post, acct, false, allAccounts);
  if (list.length >= 20) return false;
  const rng = rngFor(post.id, `grow-${list.length}`);
  const names = ["Robyn", "Denny", "Mia", "Priya", "Callum", "Grace", "Marcus", "Aisha", "Ben", "Elena"];
  const roll = rng();
  const isAd = post.postType === "ad";
  let growText, useEvidence = false;
  if (isAd && roll < 0.6) {
    growText = pick(rng, NPC_ASTROTURF_LINES);
  } else {
    useEvidence = rng() < (acct.isSkraper ? 0.55 : 0.08);
    growText = useEvidence ? pick(rng, NPC_EVIDENCE_LINES) : pick(rng, NPC_REACT_LINES);
  }
  const commenter = pickCommenterAccount(rng, acct, allAccounts);
  list.push({
    id: `${post.id}-c${list.length}`,
    author: commenter ? commenter.name : names[Math.floor(rng() * names.length)],
    authorAcctId: commenter ? commenter.id : null,
    authorHandle: commenter ? commenter.handle : null,
    text: growText,
    minsAgo: Math.floor(rng() * 20),
    evidence: useEvidence,
  });
  meta.actualCount = Math.min(20, meta.actualCount + 1);
  meta.displayCount += 1;
  return true;
}

function reset() {
  state.playerComments = {};
  state.responses = {};
}

function dump() {
  return { playerComments: state.playerComments, responses: state.responses };
}

function load(saved) {
  reset();
  if (!saved) return;
  state.playerComments = saved.playerComments || {};
  state.responses = saved.responses || {};
}

const api = {
  PREMADE_COMMENTS,
  premadeOptionsForPost,
  commentMeta,
  formatCount,
  npcCommentsForPost,
  topContributorsFor,
  playerCommentsFor,
  responsesFor,
  remainingFor,
  canPostComment,
  postComment,
  generateAuthorResponse,
  generateDMReply,
  INTERROGATION_ROUNDS,
  INTERROGATION_FACTS,
  INTERROGATION_QUESTIONS,
  interrogationOptions,
  interrogationAnswer,
  interrogationSlips,
  questionText,
  recordAuthorResponse,
  hasPendingComment,
  maybeGrowFlaggedPost,
  MAX_PLAYER_COMMENTS_PER_POST,
  reset,
  dump,
  load,
  state,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
} else {
  window.SKRAPERS_COMMENTS = api;
}

})();
