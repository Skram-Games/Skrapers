// SKRAPERS — Stage 0 content-generation prototype
// Generates sample posts per personality so we can read them cold and judge:
// (1) does a personality's posts feel like one person, (2) do different
// personalities feel like different people. See output/sample_posts.md.
//
// This is deliberately template-based, not a generic Madlib — each
// personality has several hand-authored SENTENCE STRUCTURES in its own
// voice, with slots filled from small word/topic pools. The structures
// themselves carry most of the "voice"; the slots just vary content so
// five posts from one personality aren't identical.

(function () {
let SKRAPERS_PERSONALITY_DATA;
if (typeof module !== "undefined" && module.exports) {
  SKRAPERS_PERSONALITY_DATA = require("../data/personalities");
} else {
  SKRAPERS_PERSONALITY_DATA = window.SKRAPERS_PERSONALITIES;
}
const HUMAN_PERSONALITIES = SKRAPERS_PERSONALITY_DATA.HUMAN_PERSONALITIES;
const SKRAPER_TYPES = SKRAPERS_PERSONALITY_DATA.SKRAPER_TYPES;
const AD_ARCHETYPES = SKRAPERS_PERSONALITY_DATA.AD_ARCHETYPES;
// NOTE: this file and data/personalities.js are both wrapped top-to-bottom
// in an IIFE (see the closing lines) specifically so their top-level
// const/let declarations don't collide in the shared global lexical scope
// that sibling <script> tags share in a browser.

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybe(prob) {
  return Math.random() < prob;
}

// Per-personality template banks. {topic}, {opener}, {filler}, {closer},
// {vocab} pull from the personality's own pools in personalities.js.
const TEMPLATES = {
  lurker: [
    "{opener} {topic} again",
    "{topic}... {filler}",
    "not gonna lie {topic} is kind of getting old",
    "{topic} {closer}",
    "saw {topic}. {filler}, dont care",
    "{opener} everyone's on about {topic}",
    "{topic}. {closer}",
    "still thinking about {topic} {filler}",
    "{filler}, {topic} isnt even that deep",
    "everyone in my replies is talking about {topic}. {filler}",
    "{topic} but make it {filler}",
    "not reading all that about {topic}. {closer}",
    "{opener} {topic} showed up on my feed like four times today",
  ],
  obsessive: [
    "{opener} {topic} — {filler}, and most people online get the basics wrong. {closer}",
    "Been thinking about {topic} again. {vocab}, the details everyone skips are the ones that matter. {closer}",
    "{opener} everyone talking about {topic} has clearly never looked past the surface. {filler} the real story is buried three sources deep. {closer}",
    "Small correction on {topic}: {filler} the commonly cited version is wrong. I've checked. {closer}",
    "Nobody asked but here's my actual take on {topic}: {filler}, and I will die on this hill. {closer}",
    "{opener} — spent way too long today on {topic} again. {vocab}. {closer}",
    "The thing about {topic} that never gets discussed properly is {filler}. {closer}",
    "Revisiting {topic} for probably the hundredth time. {filler}, still holds up. {closer}",
  ],
  teenager: [
    "{opener} {topic} 😭 {filler} i can't",
    "{topic}?? {filler} the audacity ngl",
    "{opener} {topic} and now its all i think about lol {closer}",
    "ok but {topic} {filler} {closer}",
    "{topic} living in my head rent free {filler}",
    "why is nobody talking about {topic} like {filler}",
    "{opener} {topic} was NOT on my bingo card today {closer}",
    "me explaining {topic} to my mom for the third time {filler}",
    "{topic} {filler} sorry i dont make the rules",
  ],
  news_follower: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} — {filler}, though the full picture is still unclear. {closer}",
    "Seeing a lot of reaction to {topic}. {filler}. {closer}",
    "Still trying to get a straight answer on {topic}. {filler}. {closer}",
    "For anyone who missed it: {topic}. {filler}. {closer}",
    "A quieter follow-up on {topic} that's getting less attention than it should. {filler}. {closer}",
    "Not sure {topic} is being covered fairly. {filler}. {closer}",
  ],
  professional: [
    "{opener} {topic}. {filler} — proud of what the team pulled together. {closer}",
    "{opener} {topic} this quarter. {filler}. {closer}",
    "A short thought on {topic}: {filler}. {closer}",
    "Some reflections after {topic}. {filler}. {closer}",
    "{opener} {topic} — {filler}. Excited for what's next. {closer}",
    "Wanted to share a quick update on {topic}. {filler}. {closer}",
    "Learned a lot this week from {topic}. {filler}. {closer}",
  ],
  echo: [
    "{opener} {topic}. {filler}. {closer}",
    "{opener} regarding {topic} — {filler}. {closer}",
    "{opener} {topic}. {filler}, everyone should see this. {closer}",
    "On {topic}: {filler}. {closer}",
  ],
  amplifier: [
    "{opener} {topic}. {filler}. {closer}",
    "{opener} — {topic}! {closer}",
    "{topic}. {filler}. {closer}",
    "Can we talk about {topic}?? {filler}. {closer}",
    "{opener} {topic} right now. {filler}. {closer}",
  ],
  propagator: [
    "{opener} {topic}. {filler}. {closer}",
    "{opener} {topic} — {filler}. {closer}",
    "Update on {topic}: {filler}. {closer}",
    "{opener} — more on {topic}. {filler}. {closer}",
  ],
  sleeper: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} today. {filler}. {closer}",
    "{opener} {topic} — {filler}.",
    "{filler}. {topic}, nothing more to say really.",
    "{opener} {topic}, {filler}.",
  ],
  influencer: [
    "{opener} {topic}. {filler}. {closer}",
    "{opener} {topic} — {filler}, {closer}",
    "{opener} {topic}?? {filler}. {closer}",
    "Ok storytime about {topic}. {filler}. {closer}",
  ],
  recruiter: [
    "{opener} {topic}, {filler}. {closer}",
    "{opener} {topic}. {filler}. {closer}",
    "{opener} {topic} — {filler}. {closer}",
    "Thinking a lot about {topic} lately. {filler}. {closer}",
  ],
  // Feature round: small_biz's normal life-chatter posts use this bank,
  // same as every other human personality — its promo posts (a minority,
  // see generatePromoPost below) are generated separately.
  small_biz: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic}. {filler}. {closer}",
    "{opener} {topic}. {closer}",
  ],
  // Feature round: adbot's non-ad-tagged posts (see simulation/worldgen.js
  // — not literally every post of an adbot account is a rendered ad) fall
  // back to this generic bank so the account still has SOME texture beyond
  // pure ad copy, in the archetype's own pitch-y voice.
  adbot: [
    "{opener} {topic}. {filler}. {closer}",
    "{opener} {topic} — {filler}. {closer}",
    "{topic}. {filler}. {closer}",
  ],

  // Content round (28 new HUMAN archetypes, see data/personalities.js):
  // every template below uses only the "safe" compositions already proven
  // out by the personalities above — {opener}+{topic} as one clause ending
  // in its own period, {topic} standing alone, or {topic} followed only by
  // a bare time adverb ("today"/"again"/"tonight") — never an opener fused
  // directly against a hardcoded predicate that assumes a specific verb
  // agreement, which is what caused the "Had a nice [noun phrase]"-style
  // breakage caught in an earlier round. Blind-read via generatePost() in
  // this round before shipping.
  confused_elder: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} again. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "Tried to sort out {topic} for an hour today. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
  ],
  grumpy_traditionalist: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic}. {filler}. {closer}",
    "Not sure I'll ever get used to {topic}. {filler}. {closer}",
    "{topic} again. {filler}.",
    "{opener} {topic}, {filler}. {closer}",
  ],
  overexplaining_elder: [
    "{opener} {topic}. {filler}. {closer}",
    "{filler} with {topic} today. {closer}",
    "Finally worked out {topic}. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
  ],
  concerned_citizen: [
    "{opener} {topic}? {filler}. {closer}",
    "{topic} lately. {filler}. {closer}",
    "Been thinking a lot about {topic}. {filler}. {closer}",
    "{opener} {topic}. {filler}. {closer}",
    "Hard to switch off from {topic}. {filler}. {closer}",
  ],
  cost_of_living_watcher: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "Can we talk about {topic}? {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} again. {filler}. {closer}",
  ],
  local_council_watcher: [
    "{opener} {topic}. {filler}. {closer}",
    "Update on {topic}: {filler}. {closer}",
    "Anyone else following {topic}? {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "Still no news on {topic}. {filler}. {closer}",
  ],
  gardener: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "Small update on {topic}: {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} today. {filler}. {closer}",
    "Not gonna lie, {topic} again. {filler}. {closer}",
  ],
  home_cook: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} tonight. {filler}. {closer}",
    "Cooking update: {topic}. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} — {filler}. {closer}",
  ],
  amateur_photographer: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} this morning. {filler}. {closer}",
    "Finally got a shot of {topic}. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "Editing {topic} from the weekend. {filler}. {closer}",
  ],
  runner: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic}. {filler}. {closer}",
    "{topic} again. {filler}. {closer}",
    "Logged {topic} today. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
  ],
  gamer: [
    "{opener} {topic}. {filler}",
    "{topic} again. {filler}. {closer}",
    "three hours into {topic} and {filler}",
    "{opener} {topic}. {closer}",
    "{topic} is all i can think about rn. {filler}",
    "finally cleared {topic}. {filler}. {closer}",
  ],
  book_club: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "Book club talked about {topic} tonight. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "Still thinking about {topic}. {filler}. {closer}",
  ],
  crafter: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "Small update on {topic}: {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} tonight. {filler}. {closer}",
  ],
  diy_homeimprovement: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "Finally finished {topic}. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} this weekend. {filler}. {closer}",
  ],
  birdwatcher: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} this morning. {filler}. {closer}",
    "Spotted {topic} today. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} — {filler}. {closer}",
  ],
  cyclist: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic}. {filler}. {closer}",
    "Rode {topic} today. {filler}. {closer}",
    "{topic} again. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
  ],
  home_brewer: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "Update on {topic}: {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} today. {filler}. {closer}",
  ],
  vinyl_collector: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} tonight. {filler}. {closer}",
    "Found {topic} today. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} — {filler}. {closer}",
  ],
  true_crime_fan: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} tonight. {filler}. {closer}",
    "Can't stop thinking about {topic}. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} — {filler}. {closer}",
  ],
  fantasy_football_fan: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} this week. {filler}. {closer}",
    "League chat is losing it over {topic}. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} — {filler}. {closer}",
  ],
  student: [
    "{opener} {topic}. {filler}",
    "{topic}. {filler}. {closer}",
    "{topic} again. {filler}",
    "{topic} at 2am. {filler}. {closer}",
    "why is {topic} like this. {filler}",
  ],
  new_parent: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} today. {filler}. {closer}",
    "Small update: {topic}. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} — {filler}. {closer}",
  ],
  retiree_traveler: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "Just got back from {topic}. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} this week. {filler}. {closer}",
  ],
  between_jobs: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} today. {filler}. {closer}",
    "Update: {topic}. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} — {filler}. {closer}",
  ],
  small_town_local: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "You'll never guess what happened at {topic}. {filler}. {closer}",
    "{opener} {topic}, {filler}. {closer}",
    "{topic} today. {filler}. {closer}",
  ],
  city_commuter: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} again. {filler}. {closer}",
    "{topic}. {filler}. {closer}",
    "{topic} this morning. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
  ],
  night_shift_worker: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} again. {filler}. {closer}",
    "{topic}. {filler}. {closer}",
    "{topic} tonight. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
  ],
  dog_owner: [
    "{opener} {topic}. {filler}. {closer}",
    "{topic} today. {filler}. {closer}",
    "{topic} again. {filler}. {closer}",
    "{topic} — {filler}. {closer}",
    "Dog update: {topic}. {filler}. {closer}",
  ],
};

function fillTemplate(tpl, p) {
  return tpl
    .replace("{opener}", pick(p.openers))
    .replace("{topic}", pick(p.topicPool || p.topics))
    .replace("{filler}", pick(p.fillers))
    .replace("{closer}", pick(p.closers))
    .replace("{vocab}", pick(p.vocab))
    .replace(/\s+/g, " ")
    .trim();
}

function applyCapsStyle(text, p) {
  if (p.capsStyle === "lowercase-lean" && maybe(0.7)) {
    text = text.charAt(0).toLowerCase() + text.slice(1);
  }
  if (p.capsStyle === "lowercase-default") {
    text = text.toLowerCase();
  }
  if (p.capsStyle === "occasional-emphasis" && maybe(0.4)) {
    const words = text.split(" ");
    const idx = Math.floor(Math.random() * words.length);
    words[idx] = words[idx].toUpperCase();
    text = words.join(" ");
  }
  return text;
}

function applyPunctuation(text, p) {
  if (p.punctuation === "minimal" && maybe(0.6)) {
    text = text.replace(/[.!?]+$/, "");
  }
  if (p.punctuation === "sparse-expressive") {
    text = text.replace(/[.!?]+$/, maybe(0.5) ? "" : "...");
    if (maybe(0.3)) {
      text = text.replace(/\b(so|no|wait)\b/i, (m) => m + m.slice(-1).repeat(2));
    }
  }
  return text;
}

function applyEmoji(text, p) {
  const emojis = ["😭", "💀", "🔥", "😂", "👀", "✨", "🙄"];
  if (maybe(p.emojiRate)) {
    text = `${text} ${pick(emojis)}`;
  }
  return text;
}

function applyTypo(text, p) {
  if (maybe(p.typoRate)) {
    const words = text.split(" ");
    const idx = Math.floor(Math.random() * words.length);
    const w = words[idx];
    if (w.length > 3) {
      const pos = Math.floor(Math.random() * (w.length - 1)) + 1;
      words[idx] = w.slice(0, pos - 1) + w.slice(pos, pos + 1) + w.slice(pos - 1, pos) + w.slice(pos + 1);
    }
    text = words.join(" ");
  }
  return text;
}

function generatePost(key, p) {
  const bank = TEMPLATES[key];
  let text = fillTemplate(pick(bank), p);
  text = applyCapsStyle(text, p);
  text = applyPunctuation(text, p);
  text = applyEmoji(text, p);
  text = applyTypo(text, p);
  return text;
}

// Feature round: a real human's organic small-business promo post — built
// from small_biz's OWN promoOpeners/productPool/promoClosers pools (see
// data/personalities.js), not AD_ARCHETYPES, so it stays in this specific
// account's personal voice rather than reading like ad copy. Distinct from
// generateAdPost below on purpose: this is the human counterpart the
// design explicitly asked for, not a variant of the ad system.
function generatePromoPost(p) {
  const opener = pick(p.promoOpeners || p.openers);
  const product = pick(p.productPool || p.topicPool || p.topics);
  const closer = pick(p.promoClosers || p.closers);
  let text = `${opener} ${product}. ${closer}`.replace(/\s+/g, " ").trim();
  text = applyEmoji(text, p);
  text = applyTypo(text, p);
  return text;
}

// Feature round: sponsored ad copy for the adbot Skraper archetype — pulls
// from AD_ARCHETYPES (data/personalities.js) rather than the generic
// TEMPLATES bank, since a product pitch + CTA has its own fixed shape.
// Returns the generated text plus which CSS-drawn placeholder card
// (ui/feed.js/ui/styles.css) this ad should render as.
function generateAdPost(categoryKey, p) {
  const categoryKeys = Object.keys(AD_ARCHETYPES);
  const cat = AD_ARCHETYPES[categoryKey] || AD_ARCHETYPES[pick(categoryKeys)];
  const opener = p ? pick(p.openers) : "Introducing";
  const product = pick(cat.productNames);
  const pitch = pick(cat.pitches);
  const cta = pick(cat.ctas);
  let text = `${opener} ${product} — ${pitch}. ${cta}`.replace(/\s+/g, " ").trim();
  if (p) text = applyEmoji(text, p);
  return { text, imageStyle: cat.imageStyle, category: cat.label };
}

// Feature round ("every profile needs a bio"): a short 1-2 sentence bio for
// a procedurally-generated account, drawn from that personality/archetype's
// own bioPool (data/personalities.js) — same template+word-pool convention
// as generatePost above, just a single {topic} slot rather than a full
// sentence structure. Falls back to a plain line for any personality that
// doesn't define bioPool (shouldn't happen, but keeps this from ever
// rendering "undefined").
function generateBio(key, p) {
  const bank = (p && p.bioPool) || ["No bio yet."];
  const tpl = pick(bank);
  return tpl
    .replace("{topic}", pick(p.topicPool || p.topics || [""]))
    .replace(/\s+/g, " ")
    .trim();
}

function generateSample(count = 10) {
  const all = { ...HUMAN_PERSONALITIES, ...SKRAPER_TYPES };
  const results = {};
  for (const [key, p] of Object.entries(all)) {
    results[key] = {
      label: p.label,
      posts: Array.from({ length: count }, () => generatePost(key, p)),
    };
  }
  return results;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { generatePost, generateSample, generatePromoPost, generateAdPost, generateBio };
  if (require.main === module) {
    const sample = generateSample(10);
    console.log(JSON.stringify(sample, null, 2));
  }
} else {
  window.SKRAPERS_GENERATE = { generatePost, generateSample, generatePromoPost, generateAdPost, generateBio };
}
})();
