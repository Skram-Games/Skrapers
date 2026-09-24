// SKRAPERS — Stage 8, expanded Stages 10/12, realigned Stage 14
// M.A.I. case list: authored difficulty steps built on the SAME systems
// proven in Stages 0-7 — no new simulation logic, per the roadmap's own
// scope note for this stage. Difficulty is driven by systemic knobs
// (cadence jitter, scale, and — since Stage 12 — archetype mix) rather
// than per-case hand-tuned content.
//
// Stage 14: renumbered to close a gap the doc comparison flagged — the
// doc's own CASE 001-006 briefs (section 27) didn't literally match what
// had been built under those numbers. They now do, case by case, plus a
// capstone the doc gestures at but never names ("CASE 006+, increasingly
// systemic, eventually — investigate ALGO// itself").

(function () {

// Round 27 (#2's retry, and a real reproducibility fix): the project's
// mulberry32/hashSeed PRNG convention (simulation/worldgen.js), duplicated
// here rather than cross-file-coupled — same precedent as game/bait.js.
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

// Runs a case's build under a seeded Math.random, exactly the way
// generateWorld() already scopes its own (see that file's header for the
// honest note about why it's a scoped global patch). Cases 001, 004, 005
// and 006 are built by hand-authored builders that call Math.random
// directly (post text, timestamps, follower counts), and Case 003's event
// layer ran unseeded on top of its seeded world — so despite ui/feed.js's
// persistNow() comment that "a case world still rebuilds deterministically
// from its id", those five cases actually came back with different post
// text every rebuild: on every reload mid-case, on the Case Board reading
// a hot-swapped-away case, and — the reason it matters now — on a retry
// after a failed attempt, which is promised to replay identically.
// Nested use is safe: generateWorld() saves and restores whatever
// Math.random is when it's called, which here is this seeded one.
function seededBuild(seedStr, fn) {
  const original = Math.random;
  Math.random = mulberry32(hashSeed(seedStr));
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

const CASES = [
  {
    id: "case001",
    name: "Case 001",
    difficulty: "Easy",
    briefing: "One artificial account is active in this network. Most accounts are exactly what they look like. Find the one that isn't.",
    extendedBriefing: "A small, contained network — ten accounts, one of them scripted. This is the baseline case: no coordinated cluster to untangle, no buried follow-chain, just one account whose signals don't add up next to nine that do. Every later case builds on the habits you form here.",
    tips: [
      "Open Investigate on a few accounts before pinning anyone — you need something to compare the odd one out against.",
      "Posting cadence that's a little TOO regular (same interval, almost to the minute) is worth more suspicion than any single post's wording.",
      "A generic, low-detail bio isn't proof on its own, but it stacks with other signals.",
      "Pin your top 2-3 suspects to the Case Board before formally flagging — weighing them side by side beats trusting a first impression.",
    ],
    build: () => seededBuild("SKR-CASE001", () => window.SKRAPERS_BUILD_CASE001(0)),
  },
  {
    id: "case002",
    name: "Case 002",
    difficulty: "Medium",
    briefing: "Coordinated engagement: a small cluster is inflating each other's reach, and this time they're not posting on a perfectly mechanical schedule — the cadence signal alone won't be conclusive. Weigh it against the others.",
    extendedBriefing: "20 accounts this time, and the cluster behind the inflated engagement has learned from Case 001 — their posting times now wander on purpose, so the clockwork-interval tell that worked last time won't be conclusive by itself here. They're still coordinating; you just have to prove it a different way.",
    tips: [
      "Cadence signals will read murkier than usual — don't lean on posting interval alone this time.",
      "Check who follows whom: a cluster that inflates each other's reach usually follows each other too.",
      "Look for near-identical comment phrasing showing up under more than one account's posts.",
      "Weigh at least two independent signals together before pinning — that's the point of this case.",
    ],
    build: () => window.SKRAPERS_WORLDGEN.generateWorld("SKR-CASE002", 20, 15).accounts,
  },
  {
    id: "case003",
    name: "Case 003",
    difficulty: "Hard",
    briefing: "Something is spiking. Trace the topic back through the feed to whoever's actually behind it — not just who's talking about it loudest right now, but who started it moving.",
    extendedBriefing: "A public figure's tour cancellation is spreading fast through this 34-account network, and not all of that spread is organic — a handful of accounts are amplifying a 'the real story is being suppressed' angle, word for word, faster than any one person types. The loudest voice right now isn't necessarily the one that started it.",
    tips: [
      "Sort by timestamp, not by volume — the account that posted FIRST matters more than whoever's shouting loudest now.",
      "Watch for suspiciously identical phrasing repeated across different accounts' amplifying posts.",
      "The counter-argument replies sometimes call this out directly ('word for word') — read the comment threads, not just the posts.",
      "Once you find the origin post, check who follows its author before you flag anyone.",
    ],
    build: () =>
      seededBuild("SKR-CASE003", () => {
        const world = window.SKRAPERS_WORLDGEN.generateWorld("SKR-CASE003", 34, 22);
        window.SKRAPERS_EVENTS.triggerEvent(world.accounts, "tour-cancelled", { idSuffix: "case003" }); // fixed, not random — a stable, learnable difficulty step like every other numbered case
        return world.accounts;
      }),
  },
  {
    id: "case004",
    name: "Case 004",
    difficulty: "Hard",
    briefing: "A journalist is publicly claiming a story of hers is being artificially amplified. Some people believe her, some don't. Work out whether she's right — and if she is, find what she's actually found without knowing it.",
    extendedBriefing: "This one starts as a credibility question, not a technical one: a journalist says her story is being artificially pushed, and the replies split into believers and skeptics. She hasn't proven anything herself — she's noticed a pattern without being able to name it. Your job is to actually name it.",
    tips: [
      "Read the journalist's own posts closely — she's describing what she's noticed, even if she can't prove it yet.",
      "Investigate the accounts replying to or amplifying her story, not just the ones arguing with her.",
      "A believer being right and a skeptic being wrong aren't guaranteed — judge by signals, not by who sounds more confident.",
      "The thing she's 'found without knowing it' will show up as a pattern across several accounts, not one smoking-gun post.",
    ],
    build: () => seededBuild("SKR-CASE004", () => window.SKRAPERS_NARRATIVE.buildJournalistCase()),
  },
  {
    id: "case005",
    name: "Case 005",
    difficulty: "Very Hard",
    briefing: "Two clusters have gone quiet. No sensational posts, no amplification chain to follow — the signals that cracked Cases 001-004 won't be loud here either. Every account in both clusters shares exactly one connection. Find the controller behind them — in who follows whom, not in what anyone said.",
    extendedBriefing: "Two separate clusters have both gone dark — no sensational posts, no coordinated amplification burst, nothing that would trip the signals that worked on Cases 001-004. That's the point: whoever's running this has learned to stay quiet. The only thing tying the two clusters together is structural, not behavioral — one shared connection neither cluster is advertising.",
    tips: [
      "Content signals are close to useless here on purpose — don't waste time re-reading posts for tells.",
      "Go straight to each account's Connections panel and look for follow overlap between the two clusters.",
      "Use the Case Board's map view once you've pinned both clusters — a shared connection is easier to spot laid out visually.",
      "The controller is the one account both clusters connect to, even if it barely posts itself.",
    ],
    build: () => seededBuild("SKR-CASE005", () => window.SKRAPERS_NARRATIVE.buildOperationCase()),
  },
  {
    id: "case006",
    name: "Case 006",
    difficulty: "Very Hard",
    briefing: "Ten accounts, one artificial — just like Case 001. This one posts rarely, at ordinary hours, in an ordinary voice, and it even makes the odd typo. The content signals will read low across the board, honestly. Look at who it follows instead.",
    extendedBriefing: "This one is built to defeat everything Case 001 taught you: same size, same single impostor, but the artificial account here posts rarely, at ordinary hours, in an ordinary voice, with the occasional believable typo. If you go in relying on content signals alone, every account will read roughly the same. The tell was moved upstream, into the follow graph, on purpose.",
    tips: [
      "Trust the content signals less than usual here — a sleeper is specifically built to score low on all of them.",
      "Check who each account follows before you check what they post.",
      "A real human's mistakes tend to be inconsistent; a scripted 'flaw' tends to be the same kind of imperfection every time — compare closely.",
      "If nothing stands out from content alone, that itself is the signal to switch to the Connections panel.",
    ],
    build: () => seededBuild("SKR-CASE006", () => window.SKRAPERS_NARRATIVE.buildSleeperCase()),
  },
  {
    id: "case007",
    name: "Case 007",
    difficulty: "Operation",
    briefing: "There isn't one cluster to find this time. Cases 001-006 taught you to look for the accounts ALGO// wants flagged. This file asks what happens when you point the same tools at a network the platform itself has been curating — and at the platform's own judgment of it. Everything you've learned to look for is in here somewhere. So is ALGO//.",
    extendedBriefing: "50 accounts, no single pattern to lean on, and every trick from Cases 001-006 mixed together somewhere in the noise: a clockwork poster, a quiet ring, an account whose only mistake is who it follows. M.A.I. calls this the last of its training files. You can't read every profile cold at this size — budget your attention the way an actual investigator would.",
    tips: [
      "Use the search bar to narrow the roster before you start opening profiles one at a time.",
      "Pin candidates early, even before you're sure — the Case Board is built for comparing several suspects at once.",
      "Expect a mix of everything: a mechanical-cadence tell, a quiet amplification cluster, and at least one account whose real tell is in who it follows.",
      "Don't try to be exhaustive — work the strongest signal first, confirm with a second, then flag.",
      "ALGO// will have already flagged one account in this file before you open it. That's the platform's judgment, not evidence — check its work, and if it's wrong, say so from that account's profile.",
    ],
    build: () => window.SKRAPERS_WORLDGEN.generateWorld("SKR-CASE007-ALGO", 50, 30).accounts,
  },
];

// Round 28 (#3/#4): every case roster leaves its build with a deep-
// investigate record on every account (simulation/worldgen.js's
// attachDeepSignals). generateWorld() already attaches one to the accounts
// it makes; this pass covers everything it didn't — the hand-authored
// builders (Cases 001/004/005/006) and accounts added after generation (an
// event's announcer, Case 003) — seeded off the case id so each rebuild of
// the same case produces the same records. Idempotent, so running it over
// accounts generateWorld already covered changes nothing.
function withDeepSignals(caseId, accounts) {
  if (window.SKRAPERS_WORLDGEN && window.SKRAPERS_WORLDGEN.attachDeepSignals) window.SKRAPERS_WORLDGEN.attachDeepSignals(accounts, caseId);
  return accounts;
}
CASES.forEach((c) => {
  const rawBuild = c.build;
  c.build = () => withDeepSignals(c.id, rawBuild());
});

// ===========================================================================
// Round 28 (#5): "I'm stuck" hints. A hint costs one deep-investigate pull
// (ui/feed.js; the SAME resource as deep-investigating an account — see
// game/state.js's deepPullsUsed), so it's a real trade: a nudge about what
// KIND of evidence this file turns on, instead of the decisive records on
// one account. Hints never name or point at an account — they name a
// signal, a panel, a comparison to make.
//
// Which hints: by case SHAPE. Generated cases already carry theirs (the
// Round 27 rotation — cluster/viral/witness/controller/sleeper); the seven
// authored cases are mapped to the shape each one is the original of
// (002-006 literally are the templates for those five shapes), plus
// "cadence" for Case 001's single mechanical account and "mixed" for Case
// 007's everything-at-once capstone. Ordered broad -> specific.
// A metadata hint (timezone/photo/record — see simulation/worldgen.js) is
// woven in second, but ONLY if an account in the live file actually
// carries that tell (caller passes `facts.tellKinds`), so it's never a
// nudge toward evidence that isn't there.
// ===========================================================================
const MAX_HINTS_PER_ATTEMPT = 3;

const AUTHORED_HINT_SHAPES = {
  case001: "cadence",
  case002: "cluster",
  case003: "viral",
  case004: "witness",
  case005: "controller",
  case006: "sleeper",
  case007: "mixed",
};

const SHAPE_HINTS = {
  cadence: [
    "Line the accounts up by posting rhythm. A person's gaps between posts wander; something scheduled keeps almost exactly the same interval.",
    "Real people sleep. Check which account's activity ignores the clock entirely.",
    "A generic bio proves nothing alone — but check whether the account with the flattest bio is also the one with the flattest rhythm.",
  ],
  cluster: [
    "This file turns on the follow graph. Open Connections on a suspect: does it follow accounts that follow it straight back — and each other?",
    "Cadence is deliberately loosened here. Pin two suspects and see whether the Case Board draws a string between them before you trust any interval.",
    "Deep investigation's follow-reciprocity reading separates a closed loop from a real friendship group — but a loop reads 'mutual' too. Check who else is inside it.",
  ],
  viral: [
    "Order beats volume. Find who pushed the 'real story' angle FIRST, not who's loudest about it now.",
    "Search the event's exact wording. The same sentence turning up under different names is the thread to pull.",
    "Compare what the amplifiers post with what they engage with — deep investigation shows whether their reactions line up with their own posts.",
  ],
  witness: [
    "The person noticing the pattern is a person. Read their posts as testimony, not as a suspect's.",
    "Only one account in the amplifying group has a thread back to the witness. Check who follows the witness.",
    "Believers and skeptics are both mostly real. Weigh what the repliers engage with against what they say in public.",
  ],
  controller: [
    "Content won't crack this one. Open Connections on the quiet accounts and look for the one account they all follow.",
    "An account with no posts can still be followed. Pin the quiet ones and let the board's string show where they converge.",
    "The quiet accounts don't follow each other. Two suspects who follow each other are probably not both part of this.",
  ],
  sleeper: [
    "A sleeper reads clean on content by design. Check who each quiet account follows — and whether anyone follows it back.",
    "A sleeper posts mundane things. Its engagement history is where it slips: compare what it reacts to with what it posts.",
    "Real people are just as quiet here. Don't flag on silence — flag on a follow pattern you can actually point to.",
  ],
  // Round 29 (#4): the sixth shape — sequence is the tell.
  timeline: [
    "Switch the case feed to Timeline. Ignore how loud each post is — read the order, and the gaps between them.",
    "People react whenever they happen to look. Something scheduled reacts on a beat: look for the same gap, again and again.",
    "Quoting a line to mock it isn't the same as repeating it. Check who said those words first, and who only said them after the beat stopped.",
  ],
  mixed: [
    "Work one signal at a time: cadence first to find the loud accounts, then Connections for the quiet ones.",
    "At least one account's tell is in who it follows, not in anything it posts.",
    "Pin early and link your suspects on the Case Board with a reason — an argument you can see beats one you're holding in your head.",
  ],
};

const METADATA_HINTS = {
  timezone: "Check posting times against stated locations. A deep investigation shows when an account is actually active in the place it claims to live.",
  photo: "Profile photos aren't always what they seem. A deep investigation checks whether an account's image turns up on other, unrelated profiles.",
  record: `Every account has a server record. ALGO// launched in ${(window.SKRAPERS_INVESTIGATE && window.SKRAPERS_INVESTIGATE.ALGO_LAUNCH.label) || "Sep 2010"} — a deep investigation shows when an account's record was really created.`,
};
// When several tells are present, the most catchable one first.
const METADATA_HINT_ORDER = ["timezone", "record", "photo"];

function hintShapeFor(caseId) {
  const def = getCase(caseId);
  return def.shape || AUTHORED_HINT_SHAPES[def.id] || "mixed";
}

// The hint bought as this attempt's `index`-th (0-based) hint, or null
// once the file has none left to give. `facts.tellKinds`: the metadata
// tells carried by accounts in the live file that haven't been flagged yet.
function caseHint(caseId, index, facts) {
  const shape = hintShapeFor(caseId);
  const base = SHAPE_HINTS[shape] || SHAPE_HINTS.mixed;
  const kinds = (facts && facts.tellKinds) || [];
  const metaKind = METADATA_HINT_ORDER.find((k) => kinds.indexOf(k) !== -1);
  const seq = metaKind ? [base[0], METADATA_HINTS[metaKind], base[1], base[2]] : base.slice();
  if (index >= Math.min(MAX_HINTS_PER_ATTEMPT, seq.length)) return null;
  return { text: seq[index], shape, kind: seq[index] === METADATA_HINTS[metaKind] ? `metadata:${metaKind}` : "shape" };
}

// Items 12/13: "self-perpetuating" Case Load — once the player has cleared
// all 7 authored cases above, further cases (008, 009, 010, ...) are
// generated procedurally rather than the library simply running out. Each
// generated case number is deterministic/reproducible (same case number,
// same network, every session — every build runs under seededBuild, and
// generateWorld is itself seeded off the worldId).
//
// Round 27 (#5): generated cases used to be ONE shape (Case 002's
// coordinated cluster) with the numbers turned up — more accounts, looser
// jitter, an event every third case — so past 007 the ladder read as "the
// same case, but bigger" forever. The seven authored cases actually vary
// in KIND, and each generated case is now assigned one of those kinds,
// recombining the mechanisms those cases already proved rather than
// inventing new detection mechanics:
//   cluster    — Case 002: a coordinated cluster that follows itself; the
//                cadence tell is loosened with case number.
//   viral      — Case 003: a live event (game/events.js) spiking through
//                the feed; trace amplification back to its origin.
//   witness    — Case 004: a real person has noticed the reply pattern and
//                says so; believers and skeptics split; one amplifier
//                quietly follows them (game/narrative.js's
//                applyWitnessThread).
//   controller — Case 005: quiet accounts that follow ONLY one silent,
//                never-posting Controller and not each other; cadence
//                deliberately muddied — findable only in the follow graph.
//   sleeper    — Case 006: Skrapers with ordinary names, ordinary hours and
//                rare posts, whose only tell is who they follow.
// Rotation is deterministic and "shuffled deck" style: every consecutive
// run of five generated cases (008-012, 013-017, ...) deals each shape
// exactly once, in an order seeded per run (so it isn't the same fixed
// sequence forever), and a run never opens with the shape the previous run
// ended on (no back-to-back repeats across the seam). Difficulty still
// climbs with case number WITHIN each shape — per-shape knobs below.
const GENERATED_CASE_START = 8;

// Round 29 (#4): "timeline" joins the rotation as the sixth shape. Adding it
// widens every deck to six, so the order of generated shapes from 008 on
// is reshuffled relative to Round 27/28 (still deterministic per case
// number, still no back-to-back repeats) — an in-progress generated case
// from an older save rebuilds as whatever shape its number now deals, the
// same "fail open" rule restoreSession applies everywhere else.
const CASE_SHAPES = ["cluster", "viral", "witness", "controller", "sleeper", "timeline"];

// Round 30 (#7): the player never sees the word "shape" or any of these
// keys. `tag` is the short, in-fiction line under a case's name on Case
// Load; `pitch` opens its longer briefing — each one says what KIND of
// problem the file is through the writing itself, not through a label.
const SHAPE_INFO = {
  cluster: { tag: "Paid applause", pitch: "Somebody is paying for applause. A ring of accounts in this file keeps lifting each other up — the trick Case 002 caught, run bigger and quieter." },
  viral: { tag: "Something is spreading", pitch: "A story is catching fire faster than people can type. Case 003 taught you to find the spark, not the loudest flame; this fire is wider." },
  witness: { tag: "Someone noticed", pitch: "One real person has noticed something is off and won't stop saying so. Like the journalist in Case 004, they're right about more than they can prove." },
  controller: { tag: "The quiet ones", pitch: "Nobody in this file is saying anything interesting — that's the problem. Like Case 005, the quiet accounts all answer to someone who never posts." },
  sleeper: { tag: "Someone pretending to be boring", pitch: "Somebody here is working hard at being unremarkable. Like Case 006, it passes every content check; its mistake is in who it chose to follow." },
  timeline: { tag: "Out of order", pitch: "The story isn't in what was said, but in when. Put the spread back in order, and the beat gives them away." },
};

function shapeDeck(cycle) {
  const rng = mulberry32(hashSeed(`SKR-CASE-SHAPES-${cycle}`));
  const deck = [...CASE_SHAPES];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Shape for generated case number `n` (n >= GENERATED_CASE_START).
function shapeForCaseNumber(n) {
  const step = Math.max(0, n - GENERATED_CASE_START);
  const cycle = Math.floor(step / CASE_SHAPES.length);
  const deck = shapeDeck(cycle);
  if (cycle > 0) {
    // Only deck[0]/deck[1] ever get swapped, so the previous deck's LAST
    // entry is always its raw shuffle's last entry — no recursion needed.
    const prevLast = shapeDeck(cycle - 1)[CASE_SHAPES.length - 1];
    if (deck[0] === prevLast) [deck[0], deck[1]] = [deck[1], deck[0]];
  }
  return deck[step % CASE_SHAPES.length];
}

// Per-shape knobs and copy. `step` is 0 for case 008, 1 for 009, ...
// Numbers are tuned per shape rather than shared: a 140-account sleeper
// hunt would be a wall, not a case, so each shape scales along the axis
// that actually makes IT harder.
function shapePlan(shape, step, rng) {
  const plural = (n, one, many) => (n === 1 ? one : many);
  if (shape === "viral") {
    const accountCount = Math.min(120, 34 + step * 5);
    const jitter = Math.min(60, 12 + step * 3);
    const events = window.SKRAPERS_EVENTS.EVENTS;
    const event = events[Math.floor(rng() * events.length)];
    const shown = accountCount + 1; // + the event's announcer, added to the roster by triggerEvent
    return {
      accountCount,
      jitter,
      eventId: event.id,
      briefing: `Something is spiking: ${event.topic} is moving through this ${shown}-account network faster than people type. Trace it back to whoever started it moving — not whoever's loudest about it right now.`,
      detail: `${event.topic} running through ${shown} accounts, and the ones pushing it posting up to ${jitter} minutes off their usual rhythm`,
      tips: [
        "Order matters more than volume — the account that pushed the 'real story' angle FIRST is worth more than the loudest one now.",
        "Near-identical phrasing across different accounts' amplifying posts is the thread to pull.",
        "Real people are in this thread too, arguing both ways — reacting to an event isn't evidence on its own.",
        `${shown} accounts is too many to read cold — use the search bar on the event's own wording to narrow it.`,
      ],
    };
  }
  if (shape === "timeline") {
    // Round 29 (#4): a topic spreads through the network over several hours
    // (game/events.js's triggerTimelineEvent). Every Skraper takes part —
    // one moves the line first, the rest repeat it on a fixed beat — and
    // their own posting cadence is deliberately muddied, so the cadence
    // readout can't do the work: the order and spacing of the topic's
    // posts, read in the case feed's Timeline view, is the evidence.
    const accountCount = Math.min(90, 28 + step * 4);
    const jitter = Math.min(90, 50 + step * 3);
    const amplifiers = Math.min(6, 3 + Math.floor(step / 4));
    const events = window.SKRAPERS_EVENTS.EVENTS;
    const event = events[Math.floor(rng() * events.length)];
    const shown = accountCount + 1;
    return {
      accountCount,
      jitter,
      eventId: event.id,
      timeline: true,
      opts: { skraperTypes: ["amplifier", "echo", "propagator"], skraperCount: amplifiers + 1 },
      briefing: `${event.topic[0].toUpperCase()}${event.topic.slice(1)} broke a few hours ago and has been moving through this ${shown}-account network ever since. Somebody moved a "real story" angle first; ${amplifiers} more accounts have been repeating it since. Their posting rhythm has been scrambled, so cadence won't give them away. Open the Timeline and put the spread back in order — who moved first, and who has been copying, on a beat.`,
      detail: `${event.topic} spreading over several hours, one account moving it and ${amplifiers} more repeating it on a beat, their everyday posting scrambled so it gives nothing away`,
      tips: [
        "Use the case feed's Timeline view, not the Feed — it lays the topic out strictly by time, with the gap before each post.",
        "People react when they happen to look: uneven gaps. A scheduled network reacts on a beat: the same gap, over and over.",
        "Repeating a line and quoting it to mock it look alike in search. Read the posts, and check who said it before the beat started.",
        "Everyone who repeated the line on the beat is part of this. So is whoever said it first.",
      ],
    };
  }
  if (shape === "witness") {
    const accountCount = Math.min(100, 26 + step * 4);
    const jitter = Math.min(60, 18 + step * 3);
    return {
      accountCount,
      jitter,
      opts: { skraperTypes: ["amplifier", "propagator"] },
      witness: true,
      briefing: `Someone in this ${accountCount}-account network has noticed that the replies under their posts arrive on a schedule, and is saying so publicly. Some people believe them, some don't. Work out whether they're right — and find what they've found without knowing it.`,
      detail: `a real person who has half-noticed a ring of repliers, and a crowd split down the middle about whether to believe them`,
      tips: [
        "Read the witness's own posts closely — they're describing a pattern they can't prove yet.",
        "Believers aren't automatically right and skeptics aren't automatically wrong — judge the accounts, not the confidence.",
        "Only one account in the cluster has a thread back to the witness. Check who follows them.",
        "The witness is a real person. Formally flagging them would be exactly the kind of mistake this case is testing for.",
      ],
    };
  }
  if (shape === "controller") {
    const accountCount = Math.min(90, 24 + step * 4);
    const jitter = Math.min(80, 40 + step * 3);
    const clusterSize = Math.min(10, 4 + Math.floor(step / 3));
    const shown = accountCount + 1; // + the silent Controller generateWorld adds in "controller" mode
    return {
      accountCount,
      jitter,
      opts: { skraperFollowMode: "controller", skraperTypes: ["echo", "propagator", "amplifier"], skraperCount: clusterSize },
      briefing: `${clusterSize} accounts in this ${shown}-account network have gone quiet. No sensational posts, no amplification burst, and their posting cadence deliberately muddied. They don't follow each other. They share exactly one connection. Find the controller behind them — in who follows whom, not in what anyone said.`,
      detail: `${clusterSize} quiet accounts wired to one silent account, their posting so irregular that nothing they say will give them away`,
      tips: [
        "Content signals are close to useless here on purpose — don't burn time re-reading posts for tells.",
        "Open Connections on anything that reads even slightly odd, and look for one account they ALL follow.",
        "The controller has never posted. An account with no posts can't be caught by a posting signal — only by who follows it.",
        "Pin the quiet accounts first; the Case Board's red string will show you what they converge on.",
      ],
    };
  }
  if (shape === "sleeper") {
    const accountCount = Math.min(60, 14 + step * 3);
    const sleepers = Math.min(4, 1 + Math.floor(step / 5));
    return {
      accountCount,
      jitter: 0,
      opts: { skraperTypes: ["sleeper"], humanLikeSkrapers: true, skraperFollowMode: "popular", skraperCount: sleepers },
      briefing: `Somewhere in these ${accountCount} accounts ${plural(sleepers, "is one account", `are ${sleepers} accounts`)} built to read like an ordinary person: rare posts, ordinary hours, an ordinary name. The content signals will read low across the board, honestly. Look at who ${plural(sleepers, "it follows", "they follow")} instead.`,
      detail: `${sleepers} impostor${plural(sleepers, "", "s")} with ${plural(sleepers, "an ordinary name", "ordinary names")} hidden among ${accountCount - sleepers} real people, and no clockwork posting to catch`,
      tips: [
        "A sleeper is built to score low on every content signal — a quiet profile is not a clean one.",
        "Check who each suspect follows before you check what they post.",
        "Real people follow their friends and their niche. A sleeper follows whoever makes it look engaged — and nobody follows it back.",
        "Real people are just as quiet as a sleeper here. Every wrongful flag counts against this case.",
      ],
    };
  }
  // cluster (default)
  const accountCount = Math.min(140, 30 + step * 5);
  const jitter = Math.min(70, 15 + step * 4);
  return {
    accountCount,
    jitter,
    briefing: `Somebody is paying for applause. A ring inside this ${accountCount}-account network keeps inflating each other's reach, and its posting rhythm is rougher than Case 002's ever was. No headline event this time — just scale and subtlety working against you together.`,
    detail: `a ring that follows itself, hidden in ${accountCount} accounts, its posting rhythm roughened by up to ${jitter} minutes so the clockwork tell is faint`,
    tips: [
      `${accountCount} accounts is too many to read cold — lean on Investigate and the search bar to narrow candidates before you pin.`,
      "Posting rhythm is rougher here than in any of M.A.I.'s training files — don't treat posting interval as conclusive on its own.",
      "A cluster that inflates each other's reach usually follows each other too. Connections is your tiebreaker.",
      "Pin early and compare signals side by side on the Case Board rather than holding every profile in memory.",
    ],
  };
}

// Builds (deterministically) the definition for generated case number `n`
// (n >= GENERATED_CASE_START). Not cached in CASES — called fresh each
// time getCase()/isGeneratedCaseId() need it.
function buildGeneratedCase(n) {
  const idNum = String(n).padStart(3, "0");
  const id = `case${idNum}`;
  const step = n - GENERATED_CASE_START; // 0, 1, 2, ...
  const shape = shapeForCaseNumber(n);
  const info = SHAPE_INFO[shape];
  const worldId = `SKR-CASE${idNum}-GEN`;
  const rng = mulberry32(hashSeed(worldId));
  const plan = shapePlan(shape, step, rng);
  const difficultyLabel = step < 4 ? "Elevated" : step < 10 ? "Severe" : "Critical";

  const extendedBriefing =
    `${info.pitch} What's in the file: ${plan.detail}. ` +
    `The evidence is sealed — if this file is ever pulled from you, you'll be handed back exactly the same network to try again.`;

  return {
    id,
    name: `Case ${idNum}`,
    difficulty: `${difficultyLabel} · ${info.tag}`,
    briefing: plan.briefing,
    extendedBriefing,
    tips: plan.tips,
    generated: true,
    shape,
    timeline: !!plan.timeline,
    topicId: plan.eventId || null,
    build: () =>
      seededBuild(worldId, () => {
        const world = window.SKRAPERS_WORLDGEN.generateWorld(worldId, plan.accountCount, plan.jitter, plan.opts);
        if (plan.eventId) window.SKRAPERS_EVENTS.triggerEvent(world.accounts, plan.eventId, { idSuffix: id, timeline: !!plan.timeline });
        if (plan.witness) window.SKRAPERS_NARRATIVE.applyWitnessThread(world.accounts);
        return withDeepSignals(id, world.accounts);
      }),
  };
}

function isGeneratedCaseId(id) {
  const m = /^case(\d+)$/.exec(id || "");
  return !!m && parseInt(m[1], 10) >= GENERATED_CASE_START;
}

// The Case Load screen's "next case" order: the 7 authored cases in
// array order, then case008, case009, ... forever. `completedIds` is
// gameState.completedCases (an array of case ids the player has already
// cleared) — this never mutates CASES itself, it just tells the caller
// which case to build/show next.
function nextCaseId(completedIds) {
  const done = new Set(completedIds || []);
  const authored = CASES.find((c) => !done.has(c.id));
  if (authored) return authored.id;
  let n = GENERATED_CASE_START;
  while (done.has(`case${String(n).padStart(3, "0")}`)) n++;
  return `case${String(n).padStart(3, "0")}`;
}

function getCase(id) {
  const authored = CASES.find((c) => c.id === id);
  if (authored) return authored;
  if (isGeneratedCaseId(id)) {
    const n = parseInt(/^case(\d+)$/.exec(id)[1], 10);
    return buildGeneratedCase(n);
  }
  return CASES[0];
}

// ===========================================================================
// Round 29 (#5, #6): SECOND OPINIONS — two other voices that call a suspect
// before the player has necessarily reached a conclusion, planned here per
// case attempt so a retry (same deterministic roster) hears the same calls.
//
//   RIVAL (#5) — Wren Halloway, another M.A.I. field investigator working
//   the same file (game/narrative.js holds her voice). She reads the
//   SURFACE: her pick, right or wrong, is whichever account's free signals
//   (cadence / activity hours / wording) read loudest, and her public post
//   says which. She turns up in a little over half of the cases from 002
//   on (RIVAL_CASE_CHANCE), and is right RIVAL_ACCURACY (65%) of the time —
//   a peer worth listening to, not an oracle.
//
//   ALGO// PRE-FLAG (#6) — the platform flagging one of its own accounts,
//   unprompted, before the player has looked. Rare by design: roughly one
//   case in four from 003 on (PREFLAG_CASE_CHANCE), and ALWAYS in Case 007,
//   the file whose whole brief is pointing the tools at ALGO// itself. ALGO//
//   reads the DEEP records (it owns them): when it's wrong, it's wrong the
//   way a model trained on those records would be — it most often lands on
//   a red herring (simulation/worldgen.js), a real person whose server
//   records genuinely look like a Skraper's. Right PREFLAG_ACCURACY (60%) of
//   the time — trusting it blindly loses about two cases in five.
//
// Calibration note (judgment call): both sit in the 60-65% band the brief
// asked for — right more often than not, wrong often enough that following
// either without checking is a real mistake. The rival is a touch more
// reliable than ALGO// on purpose: she's a peer reading the evidence you
// can see; ALGO// is an interested party grading its own platform.
// Never the same target for both. Never an event announcer (a public figure
// who only posted one announcement), never the player.
// ===========================================================================
const RIVAL_CASE_CHANCE = 0.55;
const RIVAL_ACCURACY = 0.65;
const PREFLAG_CASE_CHANCE = 0.3;
const PREFLAG_ACCURACY = 0.6;
const PREFLAG_ALWAYS = ["case007"];
// Round 30 (#2, progressive unlocking): Case 001 is every player's first
// case — Case Load always serves it first (nextCaseId), and it's where the
// guided walkthrough runs — so neither second opinion ever plans there:
// both reward already understanding the basics. Halloway unlocks from 002,
// ALGO//'s pre-flag from 003, exactly as before. (These lists predate Round
// 30; it verified them rather than adding a parallel gate. Simplified Mode's
// hide-both switch lives at the display/fire layer in ui/feed.js, not here,
// so the per-attempt PLAN stays deterministic whichever way it's set.)
const RIVAL_NEVER = ["case001"];
const PREFLAG_NEVER = ["case001", "case002"];
const LEVEL_SCORE = { high: 2, medium: 1, low: 0 };
const SURFACE_KIND = { "Posting cadence": "cadence", "Activity-hour pattern": "activity", "Linguistic consistency": "linguistic" };

function surfaceRead(acct) {
  const INV = window.SKRAPERS_INVESTIGATE;
  let score = 0;
  let kind = null;
  let best = -1;
  INV.computeSignals(acct).forEach((s) => {
    const v = LEVEL_SCORE[s.level] || 0;
    score += v;
    if (v > best) {
      best = v;
      kind = SURFACE_KIND[s.label] || "cadence";
    }
  });
  return { score, kind: best > 0 ? kind : "cadence" };
}

function deepHighCount(acct, accounts) {
  const INV = window.SKRAPERS_INVESTIGATE;
  const followers = accounts.filter((o) => (o.following || []).indexOf(acct.id) !== -1).map((o) => o.id);
  return INV.computeDeepSignals(acct, followers).filter((s) => s.level === "high").length;
}

function secondOpinionsFor(caseId, accounts) {
  const rng = mulberry32(hashSeed(`${caseId}|second-opinions`));
  // Fixed draw shape, so a change to one decision never reshuffles another.
  const rollRival = rng();
  const rivalRight = rng() < RIVAL_ACCURACY;
  const rollFlag = rng();
  const flagRight = rng() < PREFLAG_ACCURACY;
  const pickA = rng();
  const pickB = rng();

  const live = (accounts || []).filter((a) => a && a.id !== "__player__" && !/^event-/.test(a.id) && (a.posts || []).length);
  const skrapers = live.filter((a) => a.isSkraper);
  const humans = live.filter((a) => !a.isSkraper);
  const at = (list, r) => (list.length ? list[Math.floor(r * list.length)] : null);
  const out = { rival: null, preflag: null };

  const rivalOn = RIVAL_NEVER.indexOf(caseId) === -1 && rollRival < RIVAL_CASE_CHANCE;
  if (rivalOn && skrapers.length && humans.length) {
    let target;
    if (rivalRight) {
      target = at(skrapers, pickA);
    } else {
      // Wrong the way a surface read goes wrong: the loudest-looking person.
      const ranked = humans.map((a) => ({ a, s: surfaceRead(a).score })).sort((x, y) => y.s - x.s || (x.a.id < y.a.id ? -1 : 1));
      target = at(ranked.slice(0, 3).map((r) => r.a), pickA);
    }
    if (target) out.rival = { acctId: target.id, correct: !!target.isSkraper, reasonKind: surfaceRead(target).kind };
  }

  const flagOn = PREFLAG_NEVER.indexOf(caseId) === -1 && (PREFLAG_ALWAYS.indexOf(caseId) !== -1 || rollFlag < PREFLAG_CASE_CHANCE);
  if (flagOn && skrapers.length && humans.length) {
    const taken = out.rival ? out.rival.acctId : null;
    let target;
    if (flagRight) {
      target = at(skrapers.filter((a) => a.id !== taken), pickB);
    } else {
      const herrings = humans.filter((a) => a.id !== taken && a.deep && a.deep.herring);
      if (herrings.length) target = at(herrings, pickB);
      else {
        const ranked = humans.filter((a) => a.id !== taken).map((a) => ({ a, s: deepHighCount(a, accounts) })).sort((x, y) => y.s - x.s || (x.a.id < y.a.id ? -1 : 1));
        target = at(ranked.slice(0, 3).map((r) => r.a), pickB);
      }
    }
    if (target) out.preflag = { acctId: target.id, correct: !!target.isSkraper };
  }
  return out;
}

window.SKRAPERS_CASES = { CASES, getCase, isGeneratedCaseId, nextCaseId, GENERATED_CASE_START, CASE_SHAPES, shapeForCaseNumber, hintShapeFor, caseHint, MAX_HINTS_PER_ATTEMPT, secondOpinionsFor, RIVAL_ACCURACY, PREFLAG_ACCURACY };

})();
