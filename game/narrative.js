// SKRAPERS — Stage 10 (narrative layer, part 1: the Controller case)
// Builds the "Operation" case: two Skraper clusters that DON'T behave like
// Case 001-003's clusters — no sensational posts, no visible amplification,
// nothing that trips the existing signals loudly. What ties them together
// is structural, not textual: every account in both clusters follows one
// silent account that has never posted anything at all. That's the doc's
// top escalation tier made concrete (ACCOUNT -> PATTERN -> CLUSTER ->
// NETWORK -> OPERATION, section 13) — a Controller isn't found by reading
// posts, it's found by reading the connections panel Stage 3 already built.
//
// Honest scope note: this is ONE hand-authored operation, not a generator
// (the doc's fuller "controller-network storyline" implies an ongoing
// narrative arc across many sessions — persistence, multiple operations,
// a name for the antagonist). That's a real content pipeline beyond this
// stage's budget; what ships is the mechanic the arc would be built from,
// proven once, honestly, rather than faked with placeholder lore.

(function () {

function buildOperationCase() {
  const { HUMAN_PERSONALITIES, SKRAPER_TYPES } = window.SKRAPERS_PERSONALITIES;
  const { generatePost } = window.SKRAPERS_GENERATE;
  const all = { ...HUMAN_PERSONALITIES, ...SKRAPER_TYPES };
  const now = Date.now();

  // Ten ordinary humans, reusing the same pickActiveMinsAgo logic Case 001
  // uses (duplicated here rather than imported, matching worldgen.js's own
  // "no load-order dependency" precedent).
  function pickActiveMinsAgo(activeHours, maxDaysBack) {
    const [start, end] = activeHours;
    const spanHours = end > start ? end - start : 24 - start + end;
    for (let attempt = 0; attempt < 20; attempt++) {
      const daysBack = Math.floor(Math.random() * maxDaysBack);
      const hourOffset = Math.random() * spanHours;
      const hourOfDay = (start + hourOffset) % 24;
      const nowDate = new Date();
      const candidate = new Date(nowDate);
      candidate.setDate(nowDate.getDate() - daysBack);
      candidate.setHours(Math.floor(hourOfDay), Math.floor(Math.random() * 60), 0, 0);
      const minsAgo = Math.round((nowDate - candidate) / 60000);
      if (minsAgo > 0) return minsAgo;
    }
    return Math.floor(Math.random() * maxDaysBack * 24 * 60);
  }

  // Feature round ("every profile needs a bio"): hand-authored, matching
  // each named character's own personalityKey.
  const humanDefs = [
    { name: "Iris Halvorsen", key: "professional", bio: "Reflecting on the job more than I probably should." },
    { name: "Sam Oduya", key: "news_follower", bio: "Reads the news so you don't have to (you still should)." },
    { name: "Lena Marchetti", key: "lurker", bio: "just here, mostly quiet" },
    { name: "jules :)", key: "teenager", bio: "not around much just vibing 🎧" },
    { name: "Piotr Zielinski", key: "obsessive", bio: "Deep in 18th century clockmaking, unwilling to apologize for it." },
    { name: "Ada Fontaine", key: "professional", bio: "Talking shop, one lesson learned at a time." },
    { name: "Reyes Castillo", key: "news_follower", bio: "Following the story until it actually makes sense." },
    { name: "Noor Siddiqui", key: "lurker", bio: "mostly lurking, occasionally has thoughts" },
    { name: "kit ✧", key: "teenager", bio: "no thoughts just vibes 🫶" },
    { name: "Milo Bergman", key: "obsessive", bio: "Collector of obscure board game history. No regrets." },
  ];
  const humans = humanDefs.map((h, i) => {
    const p = all[h.key];
    const postCount = 3 + Math.floor(Math.random() * 4);
    const posts = Array.from({ length: postCount }, (_, j) => ({
      id: `oh${i}-p${j}`,
      text: generatePost(h.key, p),
      timestamp: now - pickActiveMinsAgo(p.activeHours, 6) * 60000,
    })).sort((a, b) => b.timestamp - a.timestamp);
    return {
      id: `oh${i}`,
      name: h.name,
      handle: "@" + h.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12),
      personalityKey: h.key,
      personalityLabel: p.label,
      isSkraper: false,
      followers: 60 + Math.floor(Math.random() * 2400),
      joined: "2019-2023",
      following: [],
      bio: h.bio,
      posts,
    };
  });

  // Two clusters of 3 — each posts normally (Echo content, so the text
  // itself still reads suspicious under linguistic/cadence signals once
  // examined), but neither cluster amplifies the other or reacts to
  // anything loudly. What's different from Case 003 is the follow graph:
  // every cluster member follows the Controller, and follows nobody else
  // in their own cluster — so there's no obvious "these six all follow
  // each other" pattern to spot at a glance, only "these six all follow
  // this one quiet account," which only shows up in the Connections panel.
  const clusterNames = ["Northline Digest", "Fieldnote Weekly", "Harbor Signal", "Groundwire", "The Daily Cross", "Plainview Wire"];
  // Feature round: wire-service-style echo bios — same content-free, no-
  // personal-detail tell as personalities.js's own echo bioPool, just
  // hand-picked so each outlet-style name gets a distinct line rather than
  // all six repeating the exact same text.
  const clusterBios = [
    "Sharing what matters. Following the conversation.",
    "Here for the important stories.",
    "Amplifying the truth, one post at a time.",
    "Just here to share what everyone's already saying.",
    "Independent voice. Sharing what's relevant.",
    "Here to keep the conversation going.",
  ];
  const skrapers = clusterNames.map((name, i) => {
    const p = SKRAPER_TYPES.echo;
    const postCount = 4 + Math.floor(Math.random() * 3);
    const posts = Array.from({ length: postCount }, (_, j) => ({
      id: `os${i}-p${j}`,
      text: generatePost("echo", p),
      timestamp: now - (j * 51 + Math.round((Math.random() * 2 - 1) * 18)) * 60000,
    })).sort((a, b) => b.timestamp - a.timestamp);
    return {
      id: `os${i}`,
      name,
      handle: "@" + name.toLowerCase().replace(/\s+/g, "_"),
      personalityKey: "echo",
      personalityLabel: p.label,
      isSkraper: true,
      followers: 3000 + Math.floor(Math.random() * 9000),
      joined: "2025-2026",
      following: ["controller"],
      bio: clusterBios[i % clusterBios.length],
      posts,
    };
  });

  // The Controller: never posts, so none of the three post-based signals
  // apply to it at all (computeSignals still runs and honestly reports
  // "not enough posts to judge" across the board — it is NOT hardcoded to
  // read as suspicious). It's findable only structurally: six Skraper
  // accounts across two unrelated-looking clusters all follow it, and it
  // follows nobody back.
  const controller = {
    id: "controller",
    name: "Unnamed Account",
    handle: "@" + "x".repeat(3) + Math.floor(1000 + Math.random() * 9000),
    personalityKey: "echo",
    personalityLabel: "No posting history",
    isSkraper: true,
    followers: 4,
    joined: "unknown",
    following: [],
    posts: [],
    note: "Never posts. Followed by every account in both clusters below. Follows no one.",
    // Feature round ("every profile needs a bio"): deliberately blank — the
    // one account in this case that gives nothing away, matching its
    // own note above. renderProfile() shows a plain "No bio." for this
    // rather than inventing content that would contradict "never posts."
    bio: "",
  };

  return [...humans, ...skrapers, controller];
}

// Stage 12: a second hand-authored case, same Case-001-sized roster and
// format, but the Skraper is a Sleeper — the one archetype built
// specifically to defeat the cadence/activity signals that crack Case
// 001-003 (see personalities.js and the postCount branch in
// worldgen.js). Low, irregular posting, ordinary hours, even the
// occasional typo. The one thing it can't fake without extra engineering
// this stage doesn't have budget for: WHO it follows. Like Case 001's
// Echo, it follows only the single most-followed account in the roster,
// and nothing follows it back — same structural tell Stage 3 built,
// proven again against an archetype whose content gives away nothing.
function buildSleeperCase() {
  const { HUMAN_PERSONALITIES, SKRAPER_TYPES } = window.SKRAPERS_PERSONALITIES;
  const { generatePost } = window.SKRAPERS_GENERATE;
  const all = { ...HUMAN_PERSONALITIES, ...SKRAPER_TYPES };
  const now = Date.now();

  function pickActiveMinsAgo(activeHours, maxDaysBack) {
    const [start, end] = activeHours;
    const spanHours = end > start ? end - start : 24 - start + end;
    for (let attempt = 0; attempt < 20; attempt++) {
      const daysBack = Math.floor(Math.random() * maxDaysBack);
      const hourOffset = Math.random() * spanHours;
      const hourOfDay = (start + hourOffset) % 24;
      const nowDate = new Date();
      const candidate = new Date(nowDate);
      candidate.setDate(nowDate.getDate() - daysBack);
      candidate.setHours(Math.floor(hourOfDay), Math.floor(Math.random() * 60), 0, 0);
      const minsAgo = Math.round((nowDate - candidate) / 60000);
      if (minsAgo > 0) return minsAgo;
    }
    return Math.floor(Math.random() * maxDaysBack * 24 * 60);
  }

  // Feature round: same characters (and same hand-authored bios) as
  // data/accounts.js's original roster — this case reuses those exact
  // people under new ids, so their bios stay consistent with the ones
  // players may already know them by.
  const humanDefs = [
    { id: "sh1", name: "Robyn Castellano", handle: "@robync", key: "lurker", followers: 84, following: ["sh5"], bio: "Mostly here to read. Occasionally has opinions." },
    { id: "sh2", name: "Denny Okafor", handle: "@dennyo_racing", key: "obsessive", followers: 612, following: ["sh6"], bio: "1970s F1 obsessive. Will talk your ear off about tyre compounds if you let me." },
    { id: "sh3", name: "mia !!", handle: "@miaaa", key: "teenager", followers: 1204, following: ["sh7"], bio: "it's giving chaotic 🎀 lowkey just here for the vibes" },
    { id: "sh4", name: "Priya Nandakumar", handle: "@priya_reads", key: "news_follower", followers: 340, following: ["sh9"], bio: "Reads more news than is probably good for me. Here for context." },
    { id: "sh5", name: "Callum Rhys-Baker", handle: "@callumrb", key: "professional", followers: 2011, following: ["sh8"], bio: "Talking shop about team culture and the lessons that actually stuck." },
    { id: "sh6", name: "Tomasz Wieczorek", handle: "@tomaszw", key: "obsessive", followers: 233, following: ["sh2"], bio: "Amateur radio enthusiast. Ask me about propagation, I dare you." },
    { id: "sh7", name: "Second Breakfast Society", handle: "@2ndbreakfast", key: "teenager", followers: 5602, following: ["sh3"], bio: "unofficial society for the appreciation of a second breakfast. no further questions." },
    { id: "sh8", name: "Grace Ellender", handle: "@grace_ellender", key: "professional", followers: 890, following: ["sh5"], bio: "Reflecting on the job, the team, and everything in between." },
    { id: "sh9", name: "Marcus Doyle", handle: "@marcusdoyle", key: "news_follower", followers: 156, following: ["sh4"], bio: "Following the story until it actually makes sense." },
  ];
  const popular = humanDefs.reduce((a, b) => (b.followers > a.followers ? b : a));
  const humans = humanDefs.map((h) => {
    const p = all[h.key];
    const postCount = 4 + Math.floor(Math.random() * 3);
    const posts = Array.from({ length: postCount }, (_, j) => ({
      id: `${h.id}-p${j}`,
      text: generatePost(h.key, p),
      timestamp: now - pickActiveMinsAgo(p.activeHours, 6) * 60000,
    })).sort((a, b) => b.timestamp - a.timestamp);
    return { id: h.id, name: h.name, handle: h.handle, personalityKey: h.key, personalityLabel: p.label, isSkraper: false, followers: h.followers, joined: "2017-2023", following: h.following, bio: h.bio, posts };
  });

  const sp = SKRAPER_TYPES.sleeper;
  const sleeperPostCount = 2 + Math.floor(Math.random() * 2);
  const sleeperPosts = Array.from({ length: sleeperPostCount }, (_, j) => ({
    id: `sleeper-p${j}`,
    text: generatePost("sleeper", sp),
    timestamp: now - pickActiveMinsAgo(sp.activeHours, 6) * 60000,
  })).sort((a, b) => b.timestamp - a.timestamp);
  const sleeper = {
    id: "sleeper",
    name: "Nina Aldworth",
    handle: "@ninaaldworth",
    personalityKey: "sleeper",
    personalityLabel: sp.label,
    isSkraper: true,
    followers: 312,
    joined: "Feb 2024",
    following: [popular.id],
    // Feature round: deliberately mundane and generic — the same
    // "suspiciously ordinary" tell as the sleeper archetype's own bioPool
    // (data/personalities.js), consistent with this character's whole
    // design (built to defeat cadence/content signals, not bio-reading).
    bio: "Just an ordinary account. Nothing much to report.",
    posts: sleeperPosts,
  };

  return [...humans, sleeper];
}

// Stage 14: closes a gap flagged in the doc comparison — the doc's exact
// CASE 004 brief (section 27) is "investigate a journalist claiming
// artificial amplification," which had never been built (Case 004 had
// been used for the Controller/Operation case instead — see cases.js for
// where that moved). A journalist publicly claims a story of hers is
// being artificially amplified; some humans believe her, some don't;
// underneath, a real cluster of Amplifier/Propagator Skrapers IS doing
// exactly that, to a claim she never made. The tell isn't in her
// account at all — it's in the cluster, and in the fact that one of them
// is quietly following her specifically.
function buildJournalistCase() {
  const { HUMAN_PERSONALITIES, SKRAPER_TYPES } = window.SKRAPERS_PERSONALITIES;
  const { generatePost } = window.SKRAPERS_GENERATE;
  const all = { ...HUMAN_PERSONALITIES, ...SKRAPER_TYPES };
  const now = Date.now();

  function pickActiveMinsAgo(activeHours, maxDaysBack) {
    const [start, end] = activeHours;
    const spanHours = end > start ? end - start : 24 - start + end;
    for (let attempt = 0; attempt < 20; attempt++) {
      const daysBack = Math.floor(Math.random() * maxDaysBack);
      const hourOffset = Math.random() * spanHours;
      const hourOfDay = (start + hourOffset) % 24;
      const nowDate = new Date();
      const candidate = new Date(nowDate);
      candidate.setDate(nowDate.getDate() - daysBack);
      candidate.setHours(Math.floor(hourOfDay), Math.floor(Math.random() * 60), 0, 0);
      const minsAgo = Math.round((nowDate - candidate) / 60000);
      if (minsAgo > 0) return minsAgo;
    }
    return Math.floor(Math.random() * maxDaysBack * 24 * 60);
  }

  function makePost(id, text, minsAgo) {
    return { id, text, timestamp: now - minsAgo * 60000 };
  }

  // The journalist: a real, ordinary human — her signals should read
  // exactly as unremarkable as anyone else's, because she isn't the
  // account under investigation. Her own posts state her claim plainly.
  const journalist = {
    id: "journalist",
    name: "Dana Whitfield",
    handle: "@danawhitfield",
    personalityKey: "professional",
    personalityLabel: all.professional.label,
    isSkraper: false,
    followers: 18400,
    joined: "Sep 2016",
    following: [],
    // Feature round: hand-authored, matching her established voice above —
    // measured, evidence-driven, not sensational.
    bio: "Reporter. I check the numbers before I trust the headline.",
    posts: [
      makePost("journalist-p0", "Ran the numbers on yesterday's piece and the engagement doesn't add up — too many near-identical replies, too fast, from accounts with almost no history. Looking into it.", 40),
      makePost("journalist-p1", "To be clear: I'm not claiming a conspiracy. I'm claiming the metrics on this one post look artificial, and I'd like someone to explain why before people cite it as organic reach.", 25),
      makePost("journalist-p2", "Getting a lot of \"you're being paranoid\" replies, which is fine, but none of them explain the reply timing. Happy to be wrong. Still waiting on an explanation.", 10),
    ],
  };

  // A spread of ordinary humans reacting to her claim — genuinely split,
  // because the doc's own point (sections 10-11) is that suspicion has to
  // be allowed to be wrong just as often as it's right, even for the
  // player's in-fiction allies.
  const reactionDefs = [
    { key: "news_follower", text: "worth taking seriously, she's usually careful about this kind of claim" },
    { key: "lurker", text: "eh, people say \"bots\" about anything that gets more engagement than they think it deserves" },
    { key: "professional", text: "the reply-timing point is a fair one honestly, that's not normally how organic replies cluster" },
    { key: "obsessive", text: "I went and looked myself — she's right that the interval between replies is suspiciously tight. Can post the numbers if anyone wants them." },
    { key: "teenager", text: "not everything is a bot network lol sometimes a post is just popular" },
    { key: "news_follower", text: "either way glad someone's asking instead of just accepting the engagement numbers at face value" },
  ];
  // Feature round: hand-authored bios, one per reaction human, matching
  // both their name and their reaction's own tone above.
  const reactionBios = [
    "Reads the room and the sources both.",
    "here to scroll, rarely to post",
    "Talking shop, mostly about work.",
    "Will fact-check anything if you give me long enough.",
    "not everything is a conspiracy calm down",
    "Following this one more closely than usual.",
  ];
  const humans = reactionDefs.map((r, i) => {
    const p = all[r.key];
    return {
      id: `jh${i}`,
      name: ["Priya Kohli", "Owen Baptiste", "Selin Aydın", "Frank Delgado", "yaz", "Corinne Achebe"][i],
      handle: "@" + ["priyak", "owenb", "selina", "frankd", "yazyaz", "corinnea"][i],
      personalityKey: r.key,
      personalityLabel: p.label,
      isSkraper: false,
      followers: 40 + Math.floor(Math.random() * 3000),
      joined: "2018-2023",
      following: i === 0 ? ["journalist"] : [],
      bio: reactionBios[i],
      posts: [makePost(`jh${i}-p0`, r.text, 18 - i * 2), ...Array.from({ length: 2 + Math.floor(Math.random() * 2) }, (_, j) => makePost(`jh${i}-p${j + 1}`, generatePost(r.key, p), pickActiveMinsAgo(p.activeHours, 6)))],
    };
  });

  // The actual network: Amplifier and Propagator Skrapers, coordinated —
  // NOT reacting to the journalist at all, which is the point. They're
  // amplifying an unrelated sensational claim, on the exact schedule she
  // flagged. One of them (only one) follows her directly, quietly — the
  // single thread connecting her true, unremarkable claim to a real
  // network, findable only via Connections, not via anything anyone said.
  // Feature round: hand-picked per account, drawn from the same
  // amplifier/propagator bioPool voice as data/personalities.js so these
  // named outlets read consistently with any procedurally-generated
  // account of the same archetype.
  const clusterDefs = [
    { name: "PulseWire", key: "amplifier", bio: "Sharing everything worth seeing. 🔁" },
    { name: "ClearFeed", key: "amplifier", bio: "If it's trending, you'll see it here first." },
    { name: "OpenLine", key: "propagator", bio: "Independent reporting, always corroborated." },
    { name: "Daily Signal Network", key: "propagator", bio: "Tracking the story as it develops." },
    { name: "TrueTake", key: "amplifier", bio: "Here to spread the word — always." },
  ];
  const skrapers = clusterDefs.map((c, i) => {
    const p = SKRAPER_TYPES[c.key];
    const postCount = 4 + Math.floor(Math.random() * 3);
    const posts = Array.from({ length: postCount }, (_, j) =>
      makePost(`jc${i}-p${j}`, generatePost(c.key, p), j * 43 + Math.round((Math.random() * 2 - 1) * 12))
    );
    const others = clusterDefs.filter((_, k) => k !== i).map((_, k) => `jc${k}`);
    return {
      id: `jc${i}`,
      name: c.name,
      handle: "@" + c.name.toLowerCase().replace(/\s+/g, "_"),
      personalityKey: c.key,
      personalityLabel: p.label,
      isSkraper: true,
      followers: 3000 + Math.floor(Math.random() * 12000),
      joined: "Jan 2026",
      following: i === 0 ? [...others, "journalist"] : others, // only jc0 has the thread back to her
      bio: c.bio,
      posts,
    };
  });

  return [journalist, ...humans, ...skrapers];
}

// Round 27 (#5): Case 004's mechanic, generalized so the procedural case
// generator (game/cases.js's "witness" shape) can reuse it on any
// generated world rather than it only ever existing as one hand-authored
// cast. In every generateWorld() "cluster"-mode world, exactly one Skraper
// already quietly follows the single most popular human — Case 004's
// "only jc0 has the thread back to her", for free. This turns THAT human
// into the witness: someone who has noticed the cluster's reply pattern
// without being able to prove it, plus a genuinely split set of reactions
// from other real people (believers and skeptics both — being right isn't
// the same as sounding confident, same as Case 004). Mutates in place;
// returns the witness account (or null if the world has no such thread).
// Reaction/claim text is fixed and neutral on purpose — the witness is a
// real human with ordinary signals, and the evidence is in the cluster.
const WITNESS_CLAIMS = [
  "Is it just me, or did every reply under my last post arrive inside the same couple of minutes, from accounts I've never interacted with? Genuinely asking.",
  "Not accusing anyone. But the engagement on that post doesn't look like people. It looks like a schedule.",
  "Got told I'm being paranoid about the reply timing. Maybe. Nobody's actually explained it yet though.",
];
const WITNESS_BELIEVERS = [
  "the timing thing is a fair point, organic replies don't usually bunch up like that",
  "I went and checked — the gaps between those replies are suspiciously even. not saying what it means, just saying.",
];
const WITNESS_SKEPTICS = [
  "people say 'bots' about anything that gets more engagement than they expected",
  "sometimes a post is just popular, not everything is a network",
];

function applyWitnessThread(accounts) {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const threadSkraper = accounts.find((a) => a.isSkraper && (a.following || []).some((id) => byId.has(id) && !byId.get(id).isSkraper));
  if (!threadSkraper) return null;
  const witness = byId.get(threadSkraper.following.find((id) => byId.has(id) && !byId.get(id).isSkraper));
  const now = Date.now();
  witness.posts = witness.posts || [];
  WITNESS_CLAIMS.forEach((text, i) => {
    witness.posts.push({ id: `${witness.id}-witness-${i}`, text, timestamp: now - (40 - i * 14) * 60000 });
  });
  witness.posts.sort((a, b) => b.timestamp - a.timestamp);
  const others = accounts.filter((a) => !a.isSkraper && a.id !== witness.id);
  const reactions = [...WITNESS_BELIEVERS, ...WITNESS_SKEPTICS];
  reactions.forEach((text, i) => {
    if (!others.length) return;
    const acct = others.splice(Math.floor(Math.random() * others.length), 1)[0];
    acct.posts = acct.posts || [];
    acct.posts.unshift({ id: `${acct.id}-witness-reply-${i}`, text, timestamp: now - (18 - i * 3) * 60000 });
    acct.posts.sort((a, b) => b.timestamp - a.timestamp);
  });
  return witness;
}

// ===========================================================================
// Round 29 (#5): THE RIVAL — a second M.A.I. field investigator working the
// same files. Not ALGO// (the platform) and not the player: a peer, with a
// handle, who posts her calls in public before she (or you) can prove them.
// Which account she calls, and whether she's right, is planned per case in
// game/cases.js's secondOpinionsFor; this is only her voice. Her tone is a
// colleague's — quick, confident, a little competitive, capable of saying
// "I was wrong" — deliberately unlike ALGO//'s clinical, deniable platform
// voice (game/algomsgs.js), even though the two mechanics are similar.
// `reasonKind` is the free signal that reads loudest on her target, so she
// always cites something the player can go and look at themselves.
// ===========================================================================
const RIVAL = {
  id: "__rival__",
  name: "Wren Halloway",
  handle: "@halloway_mai",
  title: "M.A.I. field investigator",
};

const RIVAL_CALL_LINES = {
  cadence: [
    "Calling it early: {h}. Look at the gaps between those posts — that's a metronome, not a person. Fairly sure. Not certain. Fairly.",
    "Putting this on the record before anyone else does: {h} posts like it's on a timer. That's our account.",
  ],
  activity: [
    "{h} is awake at hours nobody keeps, every day, all week. I'd put money on it. Public call, so hold me to it.",
    "Going on record: {h}. Nobody's circadian rhythm looks like that. Someone disagree with me.",
  ],
  linguistic: [
    "Read {h}'s posts back to back. Same shape, every time. I think that's one of them — calling it now.",
    "My read on this file: {h}. The wording's too even to be a person having a day. Prove me wrong.",
  ],
};

const RIVAL_STANCE_LINES = {
  agree: "You backed my call on {h} in public. Appreciated. Let's hope we're right — people are watching both of us now.",
  contradict: "Noted — you said in public that I'm wrong about {h}. Fair enough. We'll see whose name ends up looking silly.",
};

// Resolution, from her side, once the review on her target is back.
const RIVAL_RESOLUTION_LINES = {
  right: {
    agree: "Review's back on {n}: Skraper. Good call backing me — and people noticed we agreed.",
    contradict: "Review's back on {n}: Skraper. You said otherwise, in public. No hard feelings. Some, maybe.",
    none: "Review's back on {n}: Skraper. Told you.",
  },
  wrong: {
    agree: "{n} came back a real person. I was wrong — and you backed me in public. That one's on both of us, and they've seen both our names.",
    contradict: "{n} came back a real person, and you said so when I didn't. Fair play. I owe them an apology and you a coffee.",
    none: "{n} came back a real person. I got that one wrong. Happens.",
  },
};

function rivalLine(bank, vars, pick) {
  const list = Array.isArray(bank) ? bank : [bank];
  const choose = pick || ((l) => l[Math.floor(Math.random() * l.length)]);
  return choose(list)
    .split("{h}")
    .join(vars.handle || "")
    .split("{n}")
    .join(vars.name || "");
}

function rivalCallText(reasonKind, handle, pick) {
  return rivalLine(RIVAL_CALL_LINES[reasonKind] || RIVAL_CALL_LINES.cadence, { handle }, pick);
}

function rivalStanceText(stance, handle) {
  return rivalLine(RIVAL_STANCE_LINES[stance] || RIVAL_STANCE_LINES.agree, { handle });
}

function rivalResolutionText(correct, stance, name) {
  const side = RIVAL_RESOLUTION_LINES[correct ? "right" : "wrong"];
  return rivalLine(side[stance] || side.none, { name });
}

window.SKRAPERS_NARRATIVE = { buildOperationCase, buildSleeperCase, buildJournalistCase, applyWitnessThread, RIVAL, rivalCallText, rivalStanceText, rivalResolutionText };

})();
