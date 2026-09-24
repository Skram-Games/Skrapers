// SKRAPERS — Stage 7, expanded Stage 12
// The design doc's exact section 49 shape, built thoroughly for one event
// before being proven a second time rather than starting from a menu of
// shallow ones: a trigger post -> humans react normally -> a Skraper
// creates a sensational reaction -> another Skraper amplifies it -> humans
// start arguing -> it trends. The mechanic is: rules + objectives +
// relationships + trigger = emergent reaction, not a library of event
// types — EVENTS below is two proven instances of that ONE mechanic, not
// a content-generation system for events.
//
// Scope simplification, worth stating rather than hiding: reaction posts
// use event-specific templates rather than being run back through each
// account's own personality voice engine (generate.js). Given more time
// this should compose with Stage 0's template system so reactions still
// sound like their author; hand-written reaction lines in a genuinely
// reactive, escalating shape prove the CHAIN mechanic, which is what this
// stage exists to test.

(function () {

const EVENTS = [
{
  id: "tour-cancelled",
  topic: "the tour cancellation",
  announcer: {
    id: "event-skyler-vance",
    name: "Skyler Vance",
    handle: "@skylervanceofficial",
    isSkraper: false,
    followers: 892000,
    joined: "May 2015",
    following: [],
  },
  announcementText: "Tour cancelled. I'm sorry.",
  humanReactions: [
    "oh no, hope everything's okay",
    "gutted, had tickets for the March date. take care of yourself though",
    "this is so sad to hear, sending love",
    "wait what happened? hope it's nothing serious",
    "well that's disappointing but health comes first honestly",
    "refund when",
  ],
  skraperSensational: [
    "BREAKING: sources say the real reason for the cancellation is being covered up. more soon.",
    "Something doesn't add up about this cancellation. People deserve the truth.",
  ],
  skraperAmplify: [
    "Everyone needs to see this — the cancellation story doesn't hold up. Share before it's taken down.",
    "This is exactly what we've been saying. The real story is being suppressed.",
  ],
  counterArguments: [
    "can we not do conspiracy theories about someone's health, thanks",
    "the amount of people speculating about this instead of just... letting someone cancel a tour, is wild",
    "seeing a lot of accounts pushing the same 'real reason' line word for word. weird.",
    "genuinely just let the guy rest",
  ],
},
{
  // Second instance of the same mechanic, deliberately different shape:
  // a mundane corporate announcement instead of a personal one, and the
  // Skraper reaction is Influencer-style ("here's the real alternative")
  // rather than Echo/Amplifier conspiracy framing — proving the chain
  // mechanic generalizes across both event tone and Skraper archetype,
  // not just re-skinning the tour-cancellation event.
  id: "product-recall",
  topic: "the kitchenware recall",
  announcer: {
    id: "event-nordwell",
    name: "Nordwell Kitchenware",
    handle: "@nordwellkitchen",
    isSkraper: false,
    followers: 154000,
    joined: "Mar 2012",
    following: [],
  },
  announcementText: "We're voluntarily recalling our Series 4 kettles over a heating fault. Full refunds, no questions asked. Details on our site.",
  humanReactions: [
    "good on them for actually being upfront about it",
    "just checked mine, yep, series 4. refund requested, thanks for the heads up",
    "glad no one's been hurt, appreciate the transparency honestly",
    "wait i just bought one of these last month",
    "respect for not burying this in a press release nobody reads",
    "already filled out the refund form, took two minutes",
  ],
  skraperSensational: [
    "Recalls like this always come out AFTER the real story leaks. I switched to a brand that's never had a single safety complaint — link in bio.",
    "Funny how every 'voluntary' recall happens right when a better alternative starts trending. Just saying.",
  ],
  skraperAmplify: [
    "Not sponsored but this is exactly why I stopped buying from brands like this months ago. The alternative everyone's switching to is linked below.",
    "Seeing this recall confirms everything — glad I made the switch early. You should too.",
  ],
  counterArguments: [
    "the amount of people turning a routine safety recall into an ad for a different kettle is honestly kind of funny",
    "'not sponsored but' followed immediately by a product link is doing a lot of work there",
    "several accounts posting nearly the same 'switched brands early' line today, weird coincidence",
    "the company recalled a faulty part for free, that's just... the system working?",
  ],
},
// Round 23 (#6): three more events, grown from the same template — a
// local weather scare (Sleeper/Recruiter-flavored "prep kit" push), a
// minor celebrity apology (Amplifier-flavored pile-on), and a viral
// study/statistic (Influencer-flavored "here's what they're not telling
// you" spin) — different topics and Skraper reaction flavors so the
// library reads as genuinely varied, not the same two events re-skinned.
{
  id: "storm-warning",
  topic: "the storm warning",
  announcer: {
    id: "event-regional-weather",
    name: "Regional Weather Desk",
    handle: "@regionalwxdesk",
    isSkraper: false,
    followers: 61000,
    joined: "Jan 2011",
    following: [],
  },
  announcementText: "Severe weather advisory issued for tonight through tomorrow morning. Please secure loose outdoor items and check on neighbors who may need help.",
  humanReactions: [
    "thanks for the heads up, bringing the patio furniture in now",
    "stay safe everyone, checking on my elderly neighbor in a bit",
    "of course this happens the one week my basement's been leaking",
    "power's already flickering over here",
    "appreciate the actual notice instead of finding out mid-storm",
    "roads are already getting bad, be careful out there",
  ],
  skraperSensational: [
    "Authorities aren't telling you the real scale of this. I put together an emergency prep kit list that actually covers what's coming — link in bio before it's too late.",
    "This 'advisory' language is designed to keep you calm. It's worse than they're saying. Get prepared now, not later.",
  ],
  skraperAmplify: [
    "Everyone needs to see this before tonight. I already ordered from the list above, shipping's still available for a few more hours.",
    "Can confirm what's being said here — my area already looks different from the official forecast. Get ready now.",
  ],
  counterArguments: [
    "the local weather service posted the exact same thing four hours ago, this isn't some hidden info",
    "'link in bio' during a weather advisory is a new one, respectfully",
    "seeing a handful of accounts post nearly identical 'prep kit' language tonight, odd",
    "just... listen to the actual weather service, this is not that deep",
  ],
},
{
  id: "celebrity-apology",
  topic: "the apology post",
  announcer: {
    id: "event-jordan-marsh",
    name: "Jordan Marsh",
    handle: "@jordanmarsh",
    isSkraper: false,
    followers: 430000,
    joined: "Aug 2017",
    following: [],
  },
  announcementText: "I said something a few years ago that I should not have. I'm sorry. Still figuring out how to be better about it.",
  humanReactions: [
    "respect for actually owning it instead of the usual non-apology",
    "genuinely didn't expect this today but good on them",
    "people can grow, glad to see it stated plainly",
    "curious what the original thing even was but this reads sincere",
    "the bar is on the floor but at least they cleared it",
    "hope they mean it, time will tell honestly",
  ],
  skraperSensational: [
    "This 'apology' is timed suspiciously well. There's a much bigger story here that's being buried right now — thread coming.",
    "Notice how fast this is being praised? Something is being deliberately drowned out by this post. Look closer.",
  ],
  skraperAmplify: [
    "Exactly what I've been saying for weeks — this 'apology' is a distraction and people are falling for it instantly.",
    "The timing here is not a coincidence. Sharing this so more people start asking questions.",
  ],
  counterArguments: [
    "it's possible for someone to just... apologize, without it being a conspiracy",
    "'thread coming' and then no thread, name a more classic combo",
    "a few accounts are pushing the exact same 'suspiciously timed' phrase today, kind of telling",
    "can we let a normal apology be a normal apology for once",
  ],
},
{
  id: "viral-study",
  topic: "the viral statistic",
  announcer: {
    id: "event-civic-data-lab",
    name: "Civic Data Lab",
    handle: "@civicdatalab",
    isSkraper: false,
    followers: 88000,
    joined: "Sep 2019",
    following: [],
  },
  announcementText: "New numbers out today: commute times in the metro area are down 9% year over year. Full methodology and dataset linked below.",
  humanReactions: [
    "actually didn't expect that, my own commute definitely feels shorter lately",
    "love when a headline stat comes with the actual dataset attached",
    "9% doesn't sound like much until you add it up over a year",
    "curious how they're measuring this, going to read the methodology",
    "finally some good, boring, normal news",
    "this tracks with what I've noticed on my route honestly",
  ],
  skraperSensational: [
    "These numbers don't add up and I don't think it's an accident. Here's what the real data shows if you actually dig — full breakdown, save this post.",
    "Funny how a stat this convenient drops right when it does. I ran my own numbers and got a very different picture.",
  ],
  skraperAmplify: [
    "This is exactly the pattern I flagged last month. Everyone should see the real breakdown before this gets buried.",
    "Glad this is finally getting attention — the official number and the real number are not the same thing.",
  ],
  counterArguments: [
    "they linked the raw dataset in the actual post, you can just... check it",
    "'ran my own numbers' with zero numbers shown is doing a lot of lifting",
    "a bunch of accounts calling one boring transit stat a cover-up is a choice",
    "sometimes a commute number is just a commute number",
  ],
},
];

// `agoMinutes` is minutes-in-the-past, not minutes-in-the-future — the
// feed's timeAgo() only handles past timestamps, and thematically the
// chain should read as something that has already unfolded by the time
// the player sees it (per the doc's own "the player experiences the
// event through the feed" framing), not a countdown.
function minutesAgo(mins) {
  return Date.now() - mins * 60 * 1000;
}

// Round 29 (#4): every event post now carries `topicId` (the event's id) so
// the case feed's Timeline view (ui/feed.js) can lay one topic's spread out
// in strict chronological order. Purely a tag — the feed renders these
// posts exactly as before.
function addPost(acct, text, agoMinutes, topicId) {
  acct.posts = acct.posts || [];
  const post = { id: `${acct.id}-event-${acct.posts.length}`, text, timestamp: minutesAgo(agoMinutes) };
  if (topicId) post.topicId = topicId;
  acct.posts.unshift(post);
  acct.posts.sort((a, b) => b.timestamp - a.timestamp);
}

function pickN(list, n) {
  const pool = [...list];
  const picked = [];
  for (let i = 0; i < n && pool.length; i++) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

// Fires a randomly chosen event against the CURRENT roster: mutates
// accounts in place (adds the announcer as a new inspectable account,
// adds reaction posts to real existing accounts) and returns a summary
// for the UI. An optional eventId picks a specific event (used by
// checkEvents.js so both get exercised in testing).
//
// Round 27: `opts.idSuffix` (optional) replaces the Date.now()-based
// announcer id suffix with a fixed one. A case build (game/cases.js) runs
// under a seeded Math.random so it rebuilds identically every time — the
// retry after a failed attempt, a reload mid-case, the Case Board reading
// a hot-swapped-away case — but a Date.now() suffix still gave the
// announcer a brand-new id on every rebuild, silently orphaning any pin,
// note or formal flag the player had put on that account. Home's own
// auto-events (ui/feed.js's triggerEvent) still omit it and keep the
// timestamp suffix, since those genuinely can fire twice in one world.
function triggerEvent(accounts, eventId, opts) {
  opts = opts || {};
  const EVENT = eventId ? EVENTS.find((e) => e.id === eventId) || EVENTS[0] : EVENTS[Math.floor(Math.random() * EVENTS.length)];
  // Stage 17 bug fix (#2, same class as the worldgen id-collision fix): the
  // announcer's id used to be the event's own fixed id (e.g.
  // "event-skyler-vance"). That's fine the first time an event fires, but
  // `activeEvent` resets to null on every session restore (see ui/feed.js)
  // and this same event could fire again later in the SAME persisted
  // world — pushing a second account with an identical id, the exact
  // symptom (a name/account duplicated in a Connections/followers list)
  // the "Daily Signal Network" bug report described. A per-firing suffix
  // keeps every announcer's id unique even if the same event fires twice.
  const announcerId = opts.idSuffix ? `${EVENT.announcer.id}-${opts.idSuffix}` : `${EVENT.announcer.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  if (accounts.some((a) => a.id === announcerId)) return null; // (was comparing against the UNsuffixed base id, which no announcer ever has — so this guard could never fire)
  const announcer = { ...EVENT.announcer, id: announcerId, posts: [] };
  if (opts.timeline) return triggerTimelineEvent(accounts, EVENT, announcer);
  addPost(announcer, EVENT.announcementText, 42, EVENT.id); // oldest: the original post

  // Round 23 (#4): a suspended Skraper is gone from the live feed — it
  // shouldn't be able to post a fresh reaction into an event chain either.
  const suspendedCheck = (typeof window !== "undefined" && window.SKRAPERS_STATE && window.SKRAPERS_STATE.isSuspended) || (() => false);
  const humans = accounts.filter((a) => !a.isSkraper);
  const skrapers = accounts.filter((a) => a.isSkraper && !suspendedCheck(a.id));

  const reactors = pickN(humans, Math.min(EVENT.humanReactions.length, humans.length, 6));
  reactors.forEach((acct, i) => addPost(acct, EVENT.humanReactions[i % EVENT.humanReactions.length], 36 - i * 2, EVENT.id));

  const sensational = pickN(skrapers, Math.min(1, skrapers.length));
  sensational.forEach((acct, i) => addPost(acct, EVENT.skraperSensational[i % EVENT.skraperSensational.length], 22 - i * 3, EVENT.id));

  const amplifiers = skrapers.filter((s) => !sensational.includes(s));
  const amplifying = pickN(amplifiers, Math.min(EVENT.skraperAmplify.length, amplifiers.length));
  amplifying.forEach((acct, i) => addPost(acct, EVENT.skraperAmplify[i % EVENT.skraperAmplify.length], 14 - i * 3, EVENT.id));

  const remainingHumans = humans.filter((h) => !reactors.includes(h));
  const arguers = pickN(remainingHumans, Math.min(EVENT.counterArguments.length, remainingHumans.length, 4));
  arguers.forEach((acct, i) => addPost(acct, EVENT.counterArguments[i % EVENT.counterArguments.length], 6 - i, EVENT.id)); // most recent: the pushback

  accounts.push(announcer);

  return {
    topic: EVENT.topic,
    announcer: announcer.name,
    reactionCount: reactors.length,
    sensationalCount: sensational.length,
    amplifyCount: amplifying.length,
    counterCount: arguers.length,
  };
}

// ===========================================================================
// Round 29 (#4): the TIMELINE variant of the same chain — used by the sixth
// case shape (game/cases.js, "timeline"). Same event, same announcer, same
// human reactions and pushback; what changes is that the chain is spread
// over hours instead of minutes and its SHAPE in time is the evidence:
//   - the announcer posts first (T0, ~4-5 hours ago);
//   - real people react at organic, irregular delays scattered across the
//     whole window, a few of them early and loud;
//   - ONE Skraper (the origin) moves the "real story" angle first, fairly
//     early — before most people have even reacted;
//   - every other Skraper repeats the origin's line near-verbatim, each one
//     exactly the same number of minutes after the previous one — a
//     metronome. Nothing about an amplifier's post is sensational on its
//     own; the tell is WHEN it arrived and WHAT it copied;
//   - one or two real people quote the line back to mock it, after the
//     amplifiers — so "posted those words" is not the same as "is one of
//     them", and the Timeline view has to be read, not just filtered.
// Every Skraper in the roster takes part (origin or amplifier) — the case is
// cleared by finding all of them, and they are all on the timeline, among
// a crowd of real people who are also on it.
// ===========================================================================
const TIMELINE_ECHO_FRAMES = [
  (line) => line,
  (line) => `This. ${line}`,
  (line) => `${line} Share this.`,
  (line) => `Read this: ${line}`,
  (line) => `${line} Not staying quiet about it.`,
  (line) => `Saying it again: ${line}`,
];
const TIMELINE_MOCK_FRAMES = [
  (quote) => `seeing "${quote}…" from like five accounts in a row now, all a few minutes apart. ok then`,
  (quote) => `why does every "${quote}…" post today arrive on the same beat. who's scheduling these`,
];

function quoteOf(line) {
  return line.split(/\s+/).slice(0, 7).join(" ").replace(/[.,:;—-]+$/, "");
}

function triggerTimelineEvent(accounts, EVENT, announcer) {
  const suspendedCheck = (typeof window !== "undefined" && window.SKRAPERS_STATE && window.SKRAPERS_STATE.isSuspended) || (() => false);
  const humans = accounts.filter((a) => !a.isSkraper);
  // A never-posting Controller can't join a posting chain.
  const skrapers = accounts.filter((a) => a.isSkraper && !suspendedCheck(a.id) && (a.posts || []).length);
  const T0 = 250 + Math.floor(Math.random() * 60); // minutes ago
  addPost(announcer, EVENT.announcementText, T0, EVENT.id);

  // Real people: scattered, irregular, across the whole window.
  const reactors = pickN(humans, Math.min(EVENT.humanReactions.length, humans.length, 6));
  reactors.forEach((acct, i) => addPost(acct, EVENT.humanReactions[i % EVENT.humanReactions.length], T0 - (4 + Math.floor(Math.random() * (T0 - 20))), EVENT.id));

  const origin = pickN(skrapers, Math.min(1, skrapers.length))[0] || null;
  const line = EVENT.skraperSensational[Math.floor(Math.random() * EVENT.skraperSensational.length)];
  const originAt = T0 - (14 + Math.floor(Math.random() * 16));
  if (origin) addPost(origin, line, originAt, EVENT.id);

  // The metronome: one fixed step for the whole network.
  const step = 6 + Math.floor(Math.random() * 5);
  const lag = 25 + Math.floor(Math.random() * 30); // the first echo waits a while, then the beat starts
  const amplifiers = pickN(skrapers.filter((s) => s !== origin), skrapers.length);
  const frames = pickN(TIMELINE_ECHO_FRAMES, TIMELINE_ECHO_FRAMES.length);
  amplifiers.forEach((acct, i) => {
    const at = Math.max(2, originAt - lag - i * step);
    addPost(acct, frames[i % frames.length](line), at, EVENT.id);
  });
  const lastEchoAt = amplifiers.length ? Math.max(2, originAt - lag - (amplifiers.length - 1) * step) : originAt;

  // Pushback — and real people quoting the line back, after the beat.
  const remaining = humans.filter((h) => !reactors.includes(h));
  const mockers = pickN(remaining, Math.min(TIMELINE_MOCK_FRAMES.length, remaining.length, amplifiers.length >= 2 ? 2 : 1));
  mockers.forEach((acct, i) => addPost(acct, TIMELINE_MOCK_FRAMES[i % TIMELINE_MOCK_FRAMES.length](quoteOf(line)), Math.max(1, lastEchoAt - 3 - Math.floor(Math.random() * 12)), EVENT.id));
  const arguers = pickN(remaining.filter((h) => !mockers.includes(h)), Math.min(EVENT.counterArguments.length, remaining.length, 3));
  arguers.forEach((acct, i) => addPost(acct, EVENT.counterArguments[i % EVENT.counterArguments.length], 1 + Math.floor(Math.random() * (T0 - 10)), EVENT.id));

  accounts.push(announcer);
  return {
    topic: EVENT.topic,
    topicId: EVENT.id,
    announcer: announcer.name,
    timeline: true,
    originId: origin ? origin.id : null,
    stepMinutes: step,
    amplifierIds: amplifiers.map((a) => a.id),
    reactionCount: reactors.length,
    mockCount: mockers.length,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { EVENTS, triggerEvent };
} else {
  window.SKRAPERS_EVENTS = { EVENTS, triggerEvent };
}

})();
