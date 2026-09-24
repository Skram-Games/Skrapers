// SKRAPERS — Stage 6
// Seeded procedural world generation: same world ID -> same accounts,
// personalities, relationships and posts, every time (doc section 17-18).
//
// Determinism approach, worth being honest about: rather than threading a
// seeded RNG through every function in generate.js and accounts.js's
// timing logic, this scopes a deterministic PRNG onto Math.random for the
// duration of generation, then restores the original. That's a pragmatic
// shortcut for a prototype stage, not how the real thing should work
// long-term (a global patch is fragile if generation ever runs
// concurrently with anything else reading Math.random) — flagged here
// rather than hidden, per the roadmap's own execution notes about not
// letting shortcuts go unrecorded.

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

function randomWorldId(rngSource) {
  const digits = "0123456789";
  let s = "SKR-";
  for (let i = 0; i < 6; i++) s += digits[Math.floor((rngSource || Math.random)() * 10)];
  return s;
}

const FIRST_NAMES = [
  "Robyn", "Denny", "Mia", "Priya", "Callum", "Tomasz", "Grace", "Marcus", "Aisha", "Ben",
  "Charlotte", "Dev", "Elena", "Femi", "Greta", "Hassan", "Iris", "Jamal", "Keiko", "Liam",
  "Nadia", "Oscar", "Petra", "Quinn", "Ravi", "Sofia", "Theo", "Uma", "Viktor", "Willa",
];
const LAST_NAMES = [
  "Castellano", "Okafor", "Nandakumar", "Rhys-Baker", "Wieczorek", "Ellender", "Doyle", "Karimi",
  "Sørensen", "Adeyemi", "Fontaine", "Novak", "Osei", "Petrov", "Quintero", "Reyes", "Sato",
  "Thorne", "Ueda", "Voss", "Walcott", "Xu", "Yilmaz", "Zabala", "Ashworth", "Brennan",
];
// Content round (28 new HUMAN archetypes, data/personalities.js): this was
// a hardcoded list, NOT Object.keys(HUMAN_PERSONALITIES) — confirmed by
// reading this file before adding new personalities, per the round's own
// instruction not to assume. small_biz is intentionally left out of this
// list; it's selected separately below (SMALL_BIZ_CHANCE / forcedSmallBizIdx)
// because it has its own follower-count override and promo-post behavior.
const HUMAN_KEYS = [
  "lurker", "obsessive", "teenager", "news_follower", "professional",
  "confused_elder", "grumpy_traditionalist", "overexplaining_elder",
  "concerned_citizen", "cost_of_living_watcher", "local_council_watcher",
  "gardener", "home_cook", "amateur_photographer", "runner", "gamer",
  "book_club", "crafter", "diy_homeimprovement", "birdwatcher", "cyclist",
  "home_brewer", "vinyl_collector", "true_crime_fan", "fantasy_football_fan",
  "student", "new_parent", "retiree_traveler", "between_jobs",
  "small_town_local", "city_commuter", "night_shift_worker", "dog_owner",
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Same logic as accounts.js's pickActiveMinsAgo — duplicated rather than
// cross-file-coupled, so this generator has no load-order dependency on
// accounts.js.
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
  return Math.floor(Math.random() * maxDaysBack * 24 * 60);
}

// Round 27 (#5, case SHAPE rotation — see game/cases.js's
// buildGeneratedCase): optional `opts` let a caller build a world whose
// Skraper network has a different SHAPE, reusing the exact mechanisms the
// hand-authored cases already proved rather than new detection mechanics.
// Every knob is opt-in; with no `opts` the RNG is consumed in exactly the
// same order as before, so every existing seed (Case 002, Case 007, every
// Home world and Home batch) generates byte-for-byte what it always has.
//   skraperCount        — override the default ~7% cluster size.
//   skraperTypes        — restrict which archetypes the cluster draws from
//                         (e.g. ["sleeper"] for a Case 006-style case).
//   humanLikeSkrapers   — give Skrapers ordinary person names/handles/join
//                         dates instead of the "_official" outlet names
//                         (Case 006's Nina Aldworth, generalized).
//   skraperFollowMode   — "cluster" (default: they all follow each other,
//                         one also follows the most popular human),
//                         "controller" (Case 005: they follow ONLY a silent
//                         Controller account that never posts, and not each
//                         other), or "popular" (Case 006: each follows only
//                         the most popular human; nothing follows back).
function generateWorld(worldId, accountCount, jitterMinutes, opts) {
  accountCount = accountCount || 36;
  jitterMinutes = jitterMinutes || 0; // Stage 8 difficulty knob — see accounts.js for the rationale
  opts = opts || {};
  const followMode = opts.skraperFollowMode || "cluster";
  const rng = mulberry32(hashSeed(worldId));
  const originalRandom = Math.random;
  Math.random = rng; // see file header

  try {
    const { HUMAN_PERSONALITIES, SKRAPER_TYPES } = window.SKRAPERS_PERSONALITIES;
    const { generatePost, generateAdPost, generatePromoPost, generateBio } = window.SKRAPERS_GENERATE;
    const all = { ...HUMAN_PERSONALITIES, ...SKRAPER_TYPES };
    const now = Date.now();

    // A small discoverable cluster, not one isolated account — per the
    // doc's ACCOUNT → PATTERN → CLUSTER → NETWORK structure (section 13).
    const skraperCount = typeof opts.skraperCount === "number" ? Math.max(1, Math.min(accountCount - 2, Math.round(opts.skraperCount))) : Math.max(2, Math.round(accountCount * 0.07));
    const humanCount = accountCount - skraperCount;

    const usedNames = new Set();
    function uniqueName() {
      let name, tries = 0;
      do {
        name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
        tries++;
      } while (usedNames.has(name) && tries < 50);
      usedNames.add(name);
      return name;
    }
    function handleFor(name) {
      const base = name.toLowerCase().replace(/[^a-z]/g, "");
      const suffix = Math.floor(Math.random() * 900 + 100);
      return "@" + base.slice(0, 12) + (Math.random() < 0.4 ? suffix : "");
    }

    // Stage 17 bug fix (#2): ids used to be scoped only to THIS call
    // ("w0", "ws1", ...), which was fine for a one-shot case build but
    // collided across Home's infinite-scroll batches — loadMoreIntoFeed()
    // calls generateWorld() again for every new batch, each restarting its
    // own numbering from 0, so "ws1" from batch 3 was a genuinely
    // different account object than "ws1" from batch 7, yet shared an id
    // (and, since skraperNames[1] is always "Daily Signal Network"
    // regardless of seed, often the same NAME too). That made the same
    // account id resolve to multiple different objects at once —
    // surfacing as the same name appearing twice in a Connections list
    // (followersOf() legitimately matches every account whose `following`
    // includes that id, and there were now two of them). Prefixing every
    // id with this call's own worldId (already unique per batch) makes
    // ids globally unique again without touching anything downstream that
    // just treats ids as opaque strings.
    const idPrefix = `${worldId}-`;
    const roster = [];
    // Feature round (fake ads + human small-business counterpart): ~12% of
    // human slots become the small_biz personality (a real person running
    // a small business/homemade/advice thing out of their own life — see
    // data/personalities.js), plus one FORCED small_biz account per world/
    // batch so a promo post is always reliably reachable, not left to
    // chance on a small batch. Small-biz humans get a genuinely small
    // follower count (a handful, not thousands) per the design's own
    // "reads as authentically human, small-scale" requirement.
    const forcedSmallBizIdx = humanCount > 0 ? Math.floor(Math.random() * humanCount) : -1;
    const SMALL_BIZ_CHANCE = 0.12;
    for (let i = 0; i < humanCount; i++) {
      const isSmallBiz = i === forcedSmallBizIdx || Math.random() < SMALL_BIZ_CHANCE;
      const key = isSmallBiz ? "small_biz" : HUMAN_KEYS[Math.floor(Math.random() * HUMAN_KEYS.length)];
      const name = uniqueName();
      roster.push({
        id: `${idPrefix}w${i}`,
        name,
        handle: handleFor(name),
        personalityKey: key,
        isSkraper: false,
        isSmallBiz,
        followers: isSmallBiz ? Math.floor(Math.random() * 180) + 15 : Math.floor(Math.random() * 3000) + 20,
        joined: `${MONTHS[Math.floor(Math.random() * 12)]} ${2017 + Math.floor(Math.random() * 8)}`,
      });
    }
    // Stage 12: draw from every Skraper archetype defined in
    // personalities.js, not just Echo — a procedural world now mixes
    // whichever ones exist there, so this generator automatically picks
    // up new archetypes without needing its own edit each time one is
    // added.
    const skraperNames = ["Verified Voice", "Daily Signal Network", "TrueTake", "PulseWire", "ClearFeed", "OpenLine"];
    const restrictedTypes = Array.isArray(opts.skraperTypes) ? opts.skraperTypes.filter((k) => SKRAPER_TYPES[k]) : [];
    const skraperTypeKeys = restrictedTypes.length ? restrictedTypes : Object.keys(SKRAPER_TYPES);
    // Feature round (fake ads): one skraper slot per world/batch is FORCED
    // to the adbot archetype, same reliability reasoning as small_biz above
    // — a sponsored post should be a dependable thing a player (and a test)
    // can find, not a rare roll, while every other skraper slot still draws
    // normally from the full archetype pool.
    const forcedAdbotIdx = skraperTypeKeys.includes("adbot") && skraperCount > 0 ? Math.floor(Math.random() * skraperCount) : -1;
    for (let i = 0; i < skraperCount; i++) {
      const personalityKey = i === forcedAdbotIdx ? "adbot" : skraperTypeKeys[Math.floor(Math.random() * skraperTypeKeys.length)];
      if (opts.humanLikeSkrapers) {
        // Round 27: a Skraper built to pass as a person — same name/handle
        // generator and the same modest follower/join-date ranges real
        // humans in this world get, so nothing about the account's surface
        // separates it from the crowd (the Case 006 design, generalized).
        const personName = uniqueName();
        roster.push({
          id: `${idPrefix}ws${i}`,
          name: personName,
          handle: handleFor(personName),
          personalityKey,
          isSkraper: true,
          isAdAccount: personalityKey === "adbot",
          followers: Math.floor(Math.random() * 900) + 60,
          joined: `${MONTHS[Math.floor(Math.random() * 12)]} ${2021 + Math.floor(Math.random() * 4)}`,
        });
        continue;
      }
      const name = skraperNames[i % skraperNames.length] + (i >= skraperNames.length ? ` ${i}` : "");
      roster.push({
        id: `${idPrefix}ws${i}`,
        name,
        handle: "@" + name.toLowerCase().replace(/\s+/g, "_") + "_official",
        personalityKey,
        isSkraper: true,
        isAdAccount: personalityKey === "adbot",
        followers: Math.floor(Math.random() * 40000) + 5000,
        joined: "Jan 2026",
      });
    }

    // Relationships: humans follow 1-3 peers, biased toward their own
    // personality type first (a community), falling back to anyone.
    roster.forEach((acct) => {
      if (acct.isSkraper) return;
      const samePersonality = roster.filter((a) => !a.isSkraper && a.personalityKey === acct.personalityKey && a.id !== acct.id);
      const pool = samePersonality.length ? [...samePersonality] : roster.filter((a) => a.id !== acct.id && !a.isSkraper);
      const n = 1 + Math.floor(Math.random() * 3);
      const following = [];
      for (let k = 0; k < n && pool.length; k++) {
        const idx = Math.floor(Math.random() * pool.length);
        following.push(pool.splice(idx, 1)[0].id);
      }
      acct.following = following;
    });

    // The Skraper cluster follows each other (the "pattern" a player
    // finds first), and exactly one of them also follows the single most
    // popular human account — the thread that pulls the investigation
    // out of the cluster and into the real social graph.
    const skraperAccts = roster.filter((a) => a.isSkraper);
    const popularHuman = roster.filter((a) => !a.isSkraper).sort((a, b) => b.followers - a.followers)[0];
    const controllerId = `${idPrefix}ctrl`;
    skraperAccts.forEach((s, idx) => {
      if (followMode === "controller") {
        s.following = [controllerId]; // Case 005: no cluster links at all — only the shared silent account
        return;
      }
      if (followMode === "popular") {
        s.following = popularHuman ? [popularHuman.id] : []; // Case 006: one opportunistic out-link, nothing reciprocal
        return;
      }
      const others = skraperAccts.filter((o) => o.id !== s.id).map((o) => o.id);
      s.following = idx === 0 && popularHuman ? [...others, popularHuman.id] : others;
    });

    roster.forEach((acct) => {
      const p = all[acct.personalityKey];
      // Sleeper is the one Skraper archetype built to defeat cadence
      // itself (see personalities.js) — mechanically-regular posting
      // would undercut its whole design, so it gets a low, irregular post
      // count like a real quiet human rather than the other archetypes'
      // clockwork interval.
      const isSleeper = acct.personalityKey === "sleeper";
      // Stage 13: archetypes the player has repeatedly caught get extra
      // jitter on top of the case/world's own difficulty knob — see
      // game/algo.js's counterPlayJitter(). window.SKRAPERS_ALGO may not
      // exist yet in a pure Node test context, so this degrades to 0 there.
      const counterJitter =
        acct.isSkraper && window.SKRAPERS_ALGO ? window.SKRAPERS_ALGO.counterPlayJitter(acct.personalityKey) : 0;
      const effectiveJitter = (jitterMinutes || 0) + counterJitter;
      const postCount = acct.isSkraper ? (isSleeper ? 2 + Math.floor(Math.random() * 2) : 5 + Math.floor(Math.random() * 3)) : 3 + Math.floor(Math.random() * 4);
      const posts = [];
      // Feature round: which of this account's posts (if any) become a
      // sponsored ad or an organic small-biz promo post. Kept to a minority
      // of an eligible account's own posts (not literally every post) so
      // an ad/promo account's feed still reads like a real timeline rather
      // than a wall of pitches — the density target across the WHOLE feed
      // (roughly 1 in 8-15 posts, tunable here) comes from combining a
      // guaranteed-present account (forcedAdbotIdx/forcedSmallBizIdx above)
      // with a moderate per-post chance, not from every post of that
      // account being tagged.
      const isAdbot = acct.personalityKey === "adbot";
      const isSmallBiz = acct.personalityKey === "small_biz";
      for (let i = 0; i < postCount; i++) {
        const minsAgo =
          acct.isSkraper && !isSleeper
            ? Math.max(0, i * 47 + (effectiveJitter ? Math.round((Math.random() * 2 - 1) * effectiveJitter) : 0))
            : pickActiveMinsAgo(p.activeHours, 6);
        let text;
        const extra = {};
        // The account's very FIRST post is always the special one (when
        // eligible) so a guaranteed-present ad/small-biz account reliably
        // surfaces a sponsored/promo post rather than leaving it to chance
        // on accounts with few posts; later posts roll independently.
        if (isAdbot && (i === 0 || Math.random() < 0.55)) {
          const categories = p.productCategories || ["gadget"];
          const ad = generateAdPost(categories[Math.floor(Math.random() * categories.length)], p);
          text = ad.text;
          extra.postType = "ad";
          extra.imageStyle = ad.imageStyle;
          extra.adCategory = ad.category;
          extra.sponsorAcctId = acct.id;
        } else if (isSmallBiz && (i === 0 || Math.random() < 0.35)) {
          text = generatePromoPost(p);
          extra.postType = "promo";
          extra.imageStyle = "photo";
        } else {
          text = generatePost(acct.personalityKey, p);
        }
        posts.push({ id: `${acct.id}-p${i}`, text, timestamp: now - minsAgo * 60000, ...extra });
      }
      posts.sort((a, b) => b.timestamp - a.timestamp);
      acct.personalityLabel = p.label;
      acct.posts = posts;
      // Feature round ("every profile needs a bio"): deterministic per the
      // world's own seeded RNG (Math.random is scoped to `rng` for this
      // whole generateWorld call — see file header), so the same world ID
      // always produces the same bio for the same account.
      acct.bio = generateBio(acct.personalityKey, p);
    });

    // Item 8: people tagging others in their posts — a modest fraction of
    // posts (not every one, so it stays a discoverable signal rather than
    // noise) get an "@handle" mention of another account in this same
    // world appended to the text. `post.mentionsAcctId` is what makes the
    // mention clickable and discoverable in ui/feed.js (renderPost's
    // mention span, renderConnectionsPanel's tag list) — it "sheds light
    // on their network" the same honest way follow relationships already
    // do, just from post content instead of the follow graph.
    const MENTION_CHANCE = 0.2;
    if (roster.length > 1) {
      roster.forEach((acct) => {
        acct.posts.forEach((post) => {
          if (Math.random() >= MENTION_CHANCE) return;
          const candidates = roster.filter((a) => a.id !== acct.id);
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          post.text = `${post.text} ${target.handle}`;
          post.mentionsAcctId = target.id;
        });
      });
    }

    // Round 27: the Controller itself (Case 005's "Unnamed Account",
    // generalized) — added after the post and mention passes on purpose,
    // so it has no posts, is never @-tagged, and never tags anyone: the
    // only thing that can find it is the follow graph.
    if (followMode === "controller") {
      roster.push({
        id: controllerId,
        name: "Unnamed Account",
        handle: "@" + "x".repeat(3) + Math.floor(1000 + Math.random() * 9000),
        personalityKey: "echo",
        personalityLabel: "No posting history",
        isSkraper: true,
        followers: 2 + Math.floor(Math.random() * 6),
        joined: "unknown",
        following: [],
        posts: [],
        bio: "",
      });
    }

    // Round 29 (#2): red herrings — a deliberate minority of REAL people who
    // trip the same signals a Skraper does, for mundane reasons. Selected and
    // (for the post-level traits) applied here, BEFORE the deep records are
    // built, so every deep record's quoted snippets see the final post text;
    // the deep-level traits (timezone/photo/engagement) are applied by
    // attachDeepSignals itself from the plan this leaves on each account.
    // Own per-account PRNG, like the deep records — the world RNG stream is
    // untouched.
    applyRedHerrings(roster, "");

    // Round 28: every account's deep-investigate record (location, session
    // log, image matches, server record, engagement history). Runs on its
    // OWN per-account PRNG, after everything above, so the world RNG stream
    // above is consumed exactly as before — every existing seed still
    // generates the same accounts, posts and graph byte-for-byte.
    attachDeepSignals(roster, "");

    const totalSkrapers = roster.filter((a) => a.isSkraper).length;
    return { worldId, accountCount: roster.length, skraperCount: totalSkrapers, accounts: roster };
  } finally {
    Math.random = originalRandom;
  }
}

// ===========================================================================
// Round 28 (#3 engagement history, #4 metadata tells): the per-account DEEP
// record — an extension of the existing per-account signal system, read by
// simulation/investigate.js's computeDeepSignals and unlocked in play by a
// deep-investigate pull (ui/feed.js). `acct.deep`:
//   location      { city, utc } — the account's stated location (public;
//                 shown on its profile).
//   activityPeak  hour of peak session activity, in the STATED location's
//                 local time (the server-side session log).
//   photoMatches  how many unrelated profiles share its profile image.
//   recordCreated "Mon YYYY" server-record date, or null when it simply
//                 matches the displayed join date.
//   engagement    [{ kind, minsAgo, tone, query?|snippet?, acctId?, postId? }]
//   tells         the metadata tells planted on this account — generator
//                 bookkeeping for tests and hint targeting only; the readout
//                 never reads it (see investigate.js).
//
// Deterministic: each account's record is drawn from its own mulberry32
// stream seeded off `seedPrefix|acct.id`, never Math.random, so it's the
// same on every rebuild regardless of generation order. Idempotent: an
// account that already has a record keeps it — which is what lets
// game/cases.js run this over a whole case roster after the fact (to cover
// hand-authored builders and event announcers) without disturbing records
// generateWorld already attached.
//
// Fractions (per Skraper, independently, so a Skraper can carry 0-3):
//   timezone mismatch   35%   (sleepers: half — they're built to be careful)
//   stock-photo match   30%   (sleepers: half)
//   pre-launch record   20%   (sleepers: half)
// ~64% of ordinary Skrapers carry at least one; ~36% carry none, and a
// Controller (no posts, findable only through the follow graph by design)
// never carries any. Real people carry none (bar Round 29's deliberate red
// herrings — see applyRedHerrings below) — but night-shift/student hours
// genuinely peak at 2-4am and ~4% of people share a photo with a relative,
// so the readouts still misfire on real people the way every signal should.
// ===========================================================================
const DEEP_LOCATIONS = [
  { city: "London", utc: 0 }, { city: "Manchester", utc: 0 }, { city: "Dublin", utc: 0 }, { city: "Lisbon", utc: 0 },
  { city: "Berlin", utc: 1 }, { city: "Madrid", utc: 1 }, { city: "Warsaw", utc: 1 }, { city: "Lagos", utc: 1 },
  { city: "Athens", utc: 2 }, { city: "Nairobi", utc: 3 }, { city: "Mumbai", utc: 5.5 }, { city: "Singapore", utc: 8 },
  { city: "Tokyo", utc: 9 }, { city: "Sydney", utc: 10 }, { city: "São Paulo", utc: -3 }, { city: "Toronto", utc: -5 },
  { city: "New York", utc: -5 }, { city: "Chicago", utc: -6 }, { city: "Denver", utc: -7 }, { city: "Los Angeles", utc: -8 },
];
const DEEP_TELL_RATES = { timezone: 0.35, photo: 0.3, record: 0.2 };
const SLEEPER_TELL_FACTOR = 0.5;
const HUMAN_SHARED_PHOTO_RATE = 0.04;
const HUMAN_DOOMSCROLL_RATE = 0.06;
// People who follow the news, the council, the cost of living or true crime
// genuinely doomscroll more — the engagement readout's built-in false
// positives, same spirit as night-shift workers peaking at 3am.
const ANXIOUS_PERSONALITIES = ["news_follower", "concerned_citizen", "cost_of_living_watcher", "local_council_watcher", "true_crime_fan", "grumpy_traditionalist"];
const ANXIOUS_DOOMSCROLL_RATE = 0.3;
const ENGAGEMENT_ITEMS = 6;
// Off-network content an account engaged with — outrage/conspiracy bait
// (searches and reactions), and ordinary unrelated browsing.
const INFLAMMATORY_SEARCHES = [
  "the real story they're hiding", "proof the numbers are fake", "who is really behind the council",
  "deleted post reupload", "they don't want you to see this", "exposed thread full", "boycott list",
  "why is nobody reporting this",
];
const INFLAMMATORY_REACTIONS = [
  "a thread claiming last week's outage was deliberate", "a reupload of a deleted 'exposé' video",
  "a post calling the local council 'traitors'", "a pile-on reply thread against a journalist",
  "an 'anonymous insider' screenshot with no source", "a post insisting the tour story is a cover-up",
  "a 'share before it's taken down' clip", "a thread naming 'the accounts that are lying to you'",
];
const OFFTOPIC_SEARCHES = ["weather this weekend", "train times", "best cheap headphones", "trending", "top posts today", "funny dog videos", "recipe ideas"];

function deepRng(seedPrefix, acctId) {
  return mulberry32(hashSeed(`${seedPrefix}|deep|${acctId}`));
}

function peakFromActiveHours(activeHours, rng) {
  const [start, end] = activeHours || [9, 21];
  const span = end > start ? end - start : 24 - start + end;
  const mid = start + span / 2 + (rng() * 2 - 1);
  return Math.round(((mid % 24) + 24) % 24);
}

function snippetOf(text) {
  const t = String(text || "").replace(/\s@\S+$/, "");
  return t.length > 72 ? `${t.slice(0, 69)}…` : t;
}

function attachDeepSignals(roster, seedPrefix) {
  const P = typeof window !== "undefined" && window.SKRAPERS_PERSONALITIES;
  const INV = typeof window !== "undefined" && window.SKRAPERS_INVESTIGATE;
  const launchYear = INV && INV.ALGO_LAUNCH ? INV.ALGO_LAUNCH.year : 2010;
  const all = P ? { ...P.HUMAN_PERSONALITIES, ...P.SKRAPER_TYPES } : {};
  const byId = new Map(roster.map((a) => [a.id, a]));
  const postsOf = (a) => (a && a.posts) || [];
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

  roster.forEach((acct) => {
    if (!acct || acct.deep || acct.id === "__player__") return;
    const rng = deepRng(seedPrefix || "", acct.id);
    const p = all[acct.personalityKey] || {};
    const isController = acct.isSkraper && !postsOf(acct).length;
    const isSleeper = acct.personalityKey === "sleeper";
    const deep = { location: pick(rng, DEEP_LOCATIONS), activityPeak: null, photoMatches: 0, recordCreated: null, engagement: [], tells: [] };

    // --- metadata ---
    const f = acct.isSkraper && isSleeper ? SLEEPER_TELL_FACTOR : 1;
    const rTz = rng(), rPhoto = rng(), rRec = rng(); // always drawn, so every account's stream has the same shape
    if (acct.isSkraper && !isController) {
      if (rTz < DEEP_TELL_RATES.timezone * f) {
        deep.tells.push("timezone");
        deep.activityPeak = 2 + Math.floor(rng() * 3); // 02:00-04:00 where it claims to live
      } else {
        deep.activityPeak = 11 + Math.floor(rng() * 8); // scheduled to look like an ordinary day
      }
      if (rPhoto < DEEP_TELL_RATES.photo * f) {
        deep.tells.push("photo");
        deep.photoMatches = 7 + Math.floor(rng() * 42);
      }
      if (rRec < DEEP_TELL_RATES.record * f) {
        deep.tells.push("record");
        deep.recordCreated = `${MONTHS[Math.floor(rng() * 12)]} ${launchYear - 5 + Math.floor(rng() * 5)}`;
      }
    } else if (!acct.isSkraper) {
      deep.activityPeak = peakFromActiveHours(p.activeHours, rng);
      if (rPhoto < HUMAN_SHARED_PHOTO_RATE) deep.photoMatches = 1 + Math.floor(rng() * 2);
    }
    // Round 29 (#2): a red herring's deep-level traits override the ordinary
    // human record here — AFTER every draw above, so the record's stream is
    // consumed exactly as for any other person, and from the herring's own
    // plan values, not this rng.
    const herring = !acct.isSkraper && acct.herringPlan ? acct.herringPlan : null;
    if (herring) {
      if (herring.kinds.indexOf("timezone") !== -1) deep.activityPeak = herring.peak;
      if (herring.kinds.indexOf("photo") !== -1) deep.photoMatches = herring.photoMatches;
    }

    // --- engagement history ---
    const ownTopics = (p.topicPool || p.topics || []).slice();
    const followingSet = new Set(acct.following || []);
    const networkPosts = [];
    roster.forEach((o) => {
      if (o.id === acct.id) return;
      const near = followingSet.has(o.id) || (!acct.isSkraper && !o.isSkraper && o.personalityKey === acct.personalityKey);
      if (near) postsOf(o).forEach((post) => networkPosts.push({ o, post }));
    });
    const skraperPosts = [];
    roster.forEach((o) => {
      if (o.id !== acct.id && o.isSkraper) postsOf(o).forEach((post) => skraperPosts.push({ o, post }));
    });
    const popular = roster.filter((o) => o.id !== acct.id && postsOf(o).length).sort((a, b) => (b.followers || 0) - (a.followers || 0)).slice(0, 4);
    const popularPosts = [];
    popular.forEach((o) => postsOf(o).slice(0, 2).forEach((post) => popularPosts.push({ o, post })));

    const react = (entry, tone, minsAgo) => ({
      kind: pick(rng, ["liked", "liked", "reposted", "replied to"]),
      minsAgo,
      tone,
      acctId: entry.o.id,
      postId: entry.post.id,
      snippet: snippetOf(entry.post.text),
    });
    const search = (query, tone, minsAgo) => ({ kind: "searched", minsAgo, tone, query });
    const external = (tone, minsAgo) => ({ kind: pick(rng, ["liked", "reposted"]), minsAgo, tone, snippet: pick(rng, INFLAMMATORY_REACTIONS) });
    const spreadMins = () => 5 + Math.floor(rng() * 4000);
    const items = [];

    if (!acct.isSkraper) {
      // A real person mostly engages with their own interests and their
      // own people; a small minority doomscroll outrage too.
      const doom = rng() < (ANXIOUS_PERSONALITIES.indexOf(acct.personalityKey) !== -1 ? ANXIOUS_DOOMSCROLL_RATE : HUMAN_DOOMSCROLL_RATE);
      const doomCount = 2 + Math.floor(rng() * 2);
      for (let i = 0; i < ENGAGEMENT_ITEMS; i++) {
        const r = rng();
        if (doom && i < doomCount) items.push(i % 2 === 0 ? search(pick(rng, INFLAMMATORY_SEARCHES), "inflammatory", spreadMins()) : external("inflammatory", spreadMins()));
        else if (r < 0.4 && ownTopics.length) items.push(search(pick(rng, ownTopics), "aligned", spreadMins()));
        else if (r < 0.85 && networkPosts.length) items.push(react(pick(rng, networkPosts), "aligned", spreadMins()));
        else if (ownTopics.length && r < 0.9) items.push(search(pick(rng, ownTopics), "aligned", spreadMins()));
        else items.push(search(pick(rng, OFFTOPIC_SEARCHES), "offtopic", spreadMins()));
      }
    } else {
      const key = acct.personalityKey;
      const r = rng();
      let style;
      if (isController) style = "cluster";
      else if (isSleeper) style = r < 0.55 ? "mismatch" : "hollow";
      else if (key === "influencer" || key === "adbot" || key === "recruiter") style = r < 0.4 ? "cluster" : r < 0.55 ? "mismatch" : "hollow";
      else style = r < 0.35 ? "mismatch" : r < 0.65 ? "cluster" : "hollow";
      deep.engagementStyle = style;
      if (style === "cluster" && skraperPosts.length >= 2) {
        // Reactions to the rest of the network's posts, fired in a burst.
        const burstAt = 3 + Math.floor(rng() * 600);
        const burstSize = Math.min(skraperPosts.length, 3 + Math.floor(rng() * 3));
        const pool = skraperPosts.slice();
        for (let i = 0; i < burstSize; i++) items.push(react(pool.splice(Math.floor(rng() * pool.length), 1)[0], "cluster", burstAt));
        while (items.length < ENGAGEMENT_ITEMS) items.push(search(pick(rng, OFFTOPIC_SEARCHES), "offtopic", spreadMins()));
      } else if (style === "mismatch" || (style === "cluster" && skraperPosts.length < 2)) {
        // Posts one thing in public, engages with something else entirely.
        const alignedCount = 1 + Math.floor(rng() * 2);
        for (let i = 0; i < ENGAGEMENT_ITEMS; i++) {
          if (i < alignedCount && ownTopics.length) items.push(search(pick(rng, ownTopics), "aligned", spreadMins()));
          else if (rng() < 0.5) items.push(search(pick(rng, INFLAMMATORY_SEARCHES), "inflammatory", spreadMins()));
          else items.push(external("inflammatory", spreadMins()));
        }
      } else {
        // Hollow: engages with whatever's popular, not with anything it
        // actually cares about — moderate, not damning.
        for (let i = 0; i < ENGAGEMENT_ITEMS; i++) {
          const rr = rng();
          if (rr < 0.5 && ownTopics.length) items.push(search(pick(rng, ownTopics), "aligned", spreadMins()));
          else if (rr < 0.8 && popularPosts.length) items.push(react(pick(rng, popularPosts), "offtopic", spreadMins()));
          else items.push(search(pick(rng, OFFTOPIC_SEARCHES), "offtopic", spreadMins()));
        }
      }
    }
    // Round 29 (#2): an engagement red herring — a real person whose history
    // really does mostly NOT match what they post (hate-reading, research, a
    // guilty-pleasure niche). Rebuilt from the herring's own stream so the
    // readout crosses into HIGH exactly the way a Skraper's mismatch does.
    if (herring && herring.kinds.indexOf("engagement") !== -1) {
      const hr = mulberry32(hashSeed(`${seedPrefix || ""}|herring-eng|${acct.id}`));
      const hp = (arr) => arr[Math.floor(hr() * arr.length)];
      const rebuilt = [];
      for (let i = 0; i < ENGAGEMENT_ITEMS; i++) {
        const when = 5 + Math.floor(hr() * 4000);
        if (i === 0 && ownTopics.length) rebuilt.push({ kind: "searched", minsAgo: when, tone: "aligned", query: hp(ownTopics) });
        else if (herring.reason.engagement === "guilty" && i % 2 === 1) rebuilt.push({ kind: "searched", minsAgo: when, tone: "offtopic", query: hp(HERRING_GUILTY_SEARCHES) });
        else if (i % 2 === 0) rebuilt.push({ kind: "searched", minsAgo: when, tone: "inflammatory", query: hp(INFLAMMATORY_SEARCHES) });
        else rebuilt.push({ kind: hp(["liked", "reposted"]), minsAgo: when, tone: "inflammatory", snippet: hp(INFLAMMATORY_REACTIONS) });
      }
      items.length = 0;
      items.push(...rebuilt);
    }
    items.sort((a, b) => a.minsAgo - b.minsAgo);
    deep.engagement = items;
    if (herring) {
      // A travelling herring is somewhere whose daytime really is the stated
      // city's small hours — chosen here, now the stated location exists.
      let travel = null;
      if (herring.reason.timezone === "travelling") {
        const far = DEEP_LOCATIONS.filter((l) => Math.abs(l.utc - deep.location.utc) >= 7);
        const tr = mulberry32(hashSeed(`${seedPrefix || ""}|herring-travel|${acct.id}`));
        travel = far.length ? far[Math.floor(tr() * far.length)] : null;
      }
      deep.herring = { kinds: herring.kinds.slice(), reason: { ...herring.reason }, travel, interval: herring.interval || null };
      delete acct.herringPlan;
    }
    acct.deep = deep;
  });
  return roster;
}

// ===========================================================================
// Round 29 (#2): RED HERRINGS — innocent people who look suspicious.
// Before this round every suspicion signal leaned one way: a timezone
// mismatch, a stock-photo match, a hollow engagement history or a
// clockwork posting rhythm was (almost) only ever a Skraper. The existing
// false positives were soft (night-shift peaks read MEDIUM-to-HIGH, ~4% of
// people share a photo with a relative, some doomscroll). This adds a
// genuine minority of real people who carry one — sometimes two — of the
// SAME tells a Skraper carries, at the SAME strength, for a mundane reason:
//   timezone    sessions peak at 2-4am where they say they live — they're
//               travelling for work, work remotely on another continent's
//               hours, or just don't sleep.
//   photo       profile image on 7-26 unrelated profiles — it's a stock
//               landscape (they keep their face offline) or a portrait from
//               their own photography portfolio that gets lifted constantly.
//   engagement  history mostly outrage/off-topic — hate-reading, research
//               for something they're writing, or a guilty-pleasure niche.
//   cadence     posts on a near-perfect interval — a scheduling app.
//   tone        flat, uniform, slightly stilted sentences — writing in a
//               second language, or just terse.
// Every herring carries a REASON, and that reason is what they say when
// interrogated (game/comments.js) — their answers stay consistent and
// explain the trait, which is how a careful player clears them. The deep
// readout (simulation/investigate.js) never reads any of this: a herring's
// signal simply reads HIGH, exactly like a Skraper's.
//
// Fraction (judgment call, tuned against game/state.js's wrongful-flag
// limit of 3/4/5/6 by roster size): each real person independently rolls
// HERRING_RATE (7%), capped at 10% of the people in the world, and any
// world with 10+ people is guaranteed at least one. A 30-account case
// therefore holds ~2 herrings beside ~2 Skrapers — enough that "flag
// everything that reads HIGH" burns two of the three strikes on its own,
// not so many that the strike budget is unwinnable for a careful player
// (herrings clear themselves under interrogation, and a deep pull shows
// that a herring's OTHER records are clean). Case 001/004/005/006 are
// hand-authored rosters with their own designed red herrings and don't go
// through generateWorld, so they're untouched.
// Deterministic per account id (own mulberry32 stream), never Math.random.
// ===========================================================================
const HERRING_RATE = 0.07;
const HERRING_MAX_SHARE = 0.1;
const HERRING_GUARANTEE_MIN_HUMANS = 10;
const HERRING_SECOND_TRAIT_CHANCE = 0.3;
const HERRING_KIND_WEIGHTS = [
  ["timezone", 0.3],
  ["engagement", 0.25],
  ["cadence", 0.2],
  ["photo", 0.15],
  ["tone", 0.1],
];
const HERRING_REASONS = {
  timezone: ["travelling", "remote", "insomnia"],
  photo: ["stock", "portfolio"],
  engagement: ["hateread", "research", "guilty"],
  cadence: ["scheduler"],
  tone: ["esl", "terse"],
};
const HERRING_GUILTY_SEARCHES = ["reality show recap", "celebrity feud timeline", "that dating show finale", "wrestling results", "horoscope this week"];
// Flat, uniform, slightly stilted — every line within a few characters of
// the others, so the linguistic-consistency readout flattens the way a
// templated account's does.
const HERRING_FLAT_POSTS = [
  "Today was a normal day. Work was fine.",
  "The weather is good today. I am happy.",
  "I went to the shop today. It was busy.",
  "Weekend is soon. I will rest at home.",
  "I made dinner tonight. It was simple.",
  "Long day at work today. Now I relax.",
  "I read the news today. It is a lot.",
  "My train was late today. Not so good.",
];

function herringRng(seedPrefix, acctId) {
  return mulberry32(hashSeed(`${seedPrefix}|herring|${acctId}`));
}

function pickWeightedKind(r, exclude) {
  const pool = HERRING_KIND_WEIGHTS.filter(([k]) => k !== exclude);
  const total = pool.reduce((n, [, w]) => n + w, 0);
  let acc = 0;
  for (const [k, w] of pool) {
    acc += w / total;
    if (r < acc) return k;
  }
  return pool[pool.length - 1][0];
}

function applyRedHerrings(roster, seedPrefix) {
  const prefix = seedPrefix || "";
  const humans = roster.filter((a) => a && !a.isSkraper && a.id !== "__player__" && !a.herringChecked && (a.posts || []).length);
  if (!humans.length) return roster;
  // One roll per person, drawn first from each person's own stream, so the
  // cap and the guarantee below can rank people without extra draws.
  const rolls = humans.map((a) => {
    const rng = herringRng(prefix, a.id);
    return { acct: a, rng, roll: rng() };
  });
  let chosen = rolls.filter((r) => r.roll < HERRING_RATE);
  const cap = Math.max(1, Math.floor(humans.length * HERRING_MAX_SHARE));
  if (chosen.length > cap) chosen = chosen.sort((a, b) => a.roll - b.roll).slice(0, cap);
  if (!chosen.length && humans.length >= HERRING_GUARANTEE_MIN_HUMANS) chosen = [rolls.slice().sort((a, b) => a.roll - b.roll)[0]];
  const byId = new Map(roster.map((a) => [a.id, a]));

  humans.forEach((a) => (a.herringChecked = true));
  chosen.forEach(({ acct, rng }) => {
    const pick = (arr) => arr[Math.floor(rng() * arr.length)];
    const first = pickWeightedKind(rng());
    const kinds = [first];
    if (rng() < HERRING_SECOND_TRAIT_CHANCE) kinds.push(pickWeightedKind(rng(), first));
    const plan = { kinds, reason: {} };
    kinds.forEach((k) => (plan.reason[k] = pick(HERRING_REASONS[k])));
    if (acct.personalityKey === "night_shift_worker" && plan.reason.timezone) plan.reason.timezone = "nightshift";

    if (kinds.indexOf("timezone") !== -1) {
      plan.peak = 2 + Math.floor(rng() * 3);
      // A "travelling" herring's destination is chosen in attachDeepSignals,
      // once the stated location it has to be far from actually exists.
    }
    if (kinds.indexOf("photo") !== -1) plan.photoMatches = 7 + Math.floor(rng() * 20);

    // Post-level traits are applied right here, before any deep record
    // quotes these posts.
    if (kinds.indexOf("cadence") !== -1) {
      const interval = pick([60, 90, 120]);
      const start = 20 + Math.floor(rng() * 240);
      const sorted = acct.posts.slice().sort((x, y) => y.timestamp - x.timestamp);
      const now = Date.now();
      sorted.forEach((post, i) => {
        post.timestamp = now - (start + i * interval + Math.round((rng() * 2 - 1) * 2)) * 60000;
      });
      acct.posts = sorted;
      plan.interval = interval;
    }
    if (kinds.indexOf("tone") !== -1) {
      acct.posts.forEach((post) => {
        if (post.postType) return; // a promo post stays the account's own
        let text = pick(HERRING_FLAT_POSTS);
        const target = post.mentionsAcctId ? byId.get(post.mentionsAcctId) : null;
        if (target) text = `${text} ${target.handle}`;
        post.text = text;
      });
    }
    acct.herringPlan = plan;
  });
  return roster;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { generateWorld, mulberry32, hashSeed, randomWorldId, attachDeepSignals, applyRedHerrings, DEEP_LOCATIONS };
} else {
  window.SKRAPERS_WORLDGEN = { generateWorld, randomWorldId, attachDeepSignals, applyRedHerrings, DEEP_LOCATIONS };
}

})();
