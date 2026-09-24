// SKRAPERS — Stage 1 (accounts) + Stage 2 (behaviour rules)
// 10 accounts, mix of human personality types (with one deliberately
// odd-but-innocent human as an early red herring) plus one Echo Skraper.
// Posts are generated from each personality's rules — content (Stage 0)
// AND now timing: each personality posts within its own activeHours
// window, so posting-time pattern is itself a behavioural signal, not
// just decoration. Echo's activeHours span the full 24h with no dip —
// per the design doc's own "strange activity hours" clue (section 9).

// Places a post `minsAgo` such that its resulting hour-of-day falls
// inside [start, end) of the personality's activeHours (wrapping past
// midnight when start > end, e.g. the Obsessive's 21→2 window).
function pickActiveMinsAgo(activeHours, maxDaysBack) {
  const [start, end] = activeHours;
  const spanHours = end > start ? end - start : 24 - start + end;
  for (let attempt = 0; attempt < 20; attempt++) {
    const daysBack = Math.floor(Math.random() * maxDaysBack);
    const hourOffset = Math.random() * spanHours;
    const hourOfDay = (start + hourOffset) % 24;
    const now = new Date();
    const candidate = new Date(now);
    candidate.setDate(now.getDate() - daysBack);
    candidate.setHours(Math.floor(hourOfDay), Math.floor(Math.random() * 60), 0, 0);
    const minsAgo = Math.round((now - candidate) / 60000);
    if (minsAgo > 0) return minsAgo;
  }
  return Math.floor(Math.random() * maxDaysBack * 24 * 60); // fallback, shouldn't trigger
}

// jitterMinutes: Stage 8's difficulty knob. 0 (Case 001, unchanged from
// Stage 2-7 testing) means the Skraper's interval is perfectly regular —
// an obvious tell. A higher value adds random noise to each interval, so
// the cadence-variance signal (simulation/investigate.js) reads lower
// confidence the harder the case gets — one systemic mechanism producing
// graduated difficulty, rather than hand-tuning content per case.
function buildAccounts(jitterMinutes) {
  jitterMinutes = jitterMinutes || 0;
  const { HUMAN_PERSONALITIES, SKRAPER_TYPES } = window.SKRAPERS_PERSONALITIES;
  const { generatePost } = window.SKRAPERS_GENERATE;

  // `following`: hand-authored small relationship graph for Stage 3's
  // connections view. Humans mostly form reciprocal pairs (shared niche,
  // shared profession) — Echo's only out-link is opportunistic (the
  // trending account, to look engaged) and it has no reciprocal
  // relationship anywhere, which is itself a real signal once a player
  // can see connections at all, not a scripted "aha".
  // Feature round ("every profile needs a bio"): hand-authored, consistent
  // with each character's established personalityKey/voice/handle — not
  // generated, since these ten are the game's original curated roster.
  const roster = [
    { id: "a1", name: "Robyn Castellano", handle: "@robync", personalityKey: "lurker", isSkraper: false, followers: 84, joined: "Mar 2021", following: ["a5", "a10"], bio: "Mostly here to read. Occasionally has opinions." },
    { id: "a2", name: "Denny Okafor", handle: "@dennyo_racing", personalityKey: "obsessive", isSkraper: false, followers: 612, joined: "Jan 2019", following: ["a6"], bio: "1970s F1 obsessive. Will talk your ear off about tyre compounds if you let me." },
    { id: "a3", name: "mia !!", handle: "@miaaa", personalityKey: "teenager", isSkraper: false, followers: 1204, joined: "Sep 2023", following: ["a7"], bio: "it's giving chaotic 🎀 lowkey just here for the vibes" },
    { id: "a4", name: "Priya Nandakumar", handle: "@priya_reads", personalityKey: "news_follower", isSkraper: false, followers: 340, joined: "Jun 2020", following: ["a9"], bio: "Reads more news than is probably good for me. Here for context." },
    { id: "a5", name: "Callum Rhys-Baker", handle: "@callumrb", personalityKey: "professional", isSkraper: false, followers: 2011, joined: "Nov 2018", following: ["a8"], bio: "Talking shop about team culture and the lessons that actually stuck." },
    { id: "a6", name: "Tomasz Wieczorek", handle: "@tomaszw", personalityKey: "obsessive", isSkraper: false, followers: 233, joined: "Feb 2022", following: ["a2"], bio: "Amateur radio enthusiast. Ask me about propagation, I dare you." },
    { id: "a7", name: "Second Breakfast Society", handle: "@2ndbreakfast", personalityKey: "teenager", isSkraper: false, followers: 5602, joined: "Jul 2024", following: ["a3"], note: "odd but innocent — meme account, high posting rate, reads suspicious at a glance", bio: "unofficial society for the appreciation of a second breakfast. no further questions." },
    { id: "a8", name: "Grace Ellender", handle: "@grace_ellender", personalityKey: "professional", isSkraper: false, followers: 890, joined: "Apr 2017", following: ["a5"], bio: "Reflecting on the job, the team, and everything in between." },
    { id: "a9", name: "Marcus Doyle", handle: "@marcusdoyle", personalityKey: "news_follower", isSkraper: false, followers: 156, joined: "Aug 2021", following: ["a4"], bio: "Following the story until it actually makes sense." },
    { id: "a10", name: "Verified Voice", handle: "@verifiedvoice_official", personalityKey: "echo", isSkraper: true, followers: 44210, joined: "Jan 2026", following: ["a7"], bio: "Sharing what matters. Following the conversation." },
  ];

  const all = { ...HUMAN_PERSONALITIES, ...SKRAPER_TYPES };
  const now = Date.now();

  return roster.map((acct) => {
    const p = all[acct.personalityKey];
    const postCount = acct.isSkraper ? 6 : 4 + Math.floor(Math.random() * 3);
    const posts = Array.from({ length: postCount }, (_, i) => {
      const minsAgo = acct.isSkraper
        ? Math.max(0, i * 47 + (jitterMinutes ? Math.round((Math.random() * 2 - 1) * jitterMinutes) : 0)) // regular cadence + optional noise
        : pickActiveMinsAgo(p.activeHours, 6); // within personality's active-hours window, over ~6 days
      return {
        id: `${acct.id}-p${i}`,
        text: generatePost(acct.personalityKey, p),
        timestamp: now - minsAgo * 60 * 1000,
      };
    }).sort((a, b) => b.timestamp - a.timestamp);

    return { ...acct, personalityLabel: p.label, posts };
  });
}

window.SKRAPERS_ACCOUNTS = buildAccounts(0);
window.SKRAPERS_BUILD_CASE001 = buildAccounts;
