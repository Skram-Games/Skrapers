// SKRAPERS — Stage 32 (Marketplace)
// Local listings, generated from the live world's own accounts. Every seller
// IS an account already in the network (acct.id), never a parallel seller
// record — so Investigate, pins, deep pulls and formal flags all work on a
// seller exactly the way they work on anyone reached from a post.
//
// This file is data + generation + small state helpers only; rendering lives
// in ui/feed.js (renderMarketplace / renderMarketListing). The save-game
// shape it operates on is game/state.js's `state.marketplace`:
//   worlds    { [worldKey]: WorldMarket } — one market per world ("home",
//             "case:<id>"), the same keys pin sets use. WorldMarket:
//               sig            which exact world the listings were built from
//                              ("home:<seed>" / "case:<id>") — a fresh Home
//                              world (new seed) under the same key rebuilds.
//               cycle          the rolling refresh number (0, 1, 2, ...).
//               lastRefreshAt  wall-clock time of the last full rebuild. The
//                              whole set rebuilds once 24h have passed — the
//                              player only ever sees "This week".
//               lastVisitAt    when the player last ARRIVED on the grid.
//               visits         arrivals within this cycle — seeds churn.
//               gen            how many replacement listings have been made
//                              this cycle — seeds each replacement.
//               listings       the 100 live listings, in slot order.
//               archive        recently sold/replaced listings (capped), so
//                              an open listing screen or a message about one
//                              still resolves after it has gone.
//               viewed         listing ids the player has opened.
//   messages  [ Message ] — "Is this still available?" exchanges, one per
//             listing: { id, worldKey, listingId, sellerId, sellerName,
//             title, iconId, sentAt, respondAt, replyText, readsScam,
//             delivered }. The reply is chosen when the message is sent and
//             held until `respondAt` — a real wall-clock delay that is
//             checked whenever the Inbox (or the listing) next renders, never
//             a live timer, so it survives a reload.
//
// Determinism: every roll — the listing set, which listings sell on a
// return visit, what replaces them, which reply a seller sends and how long
// it takes — comes from the project's mulberry32/hashSeed convention
// (simulation/worldgen.js), seeded off the world signature plus a cycle,
// visit or listing number. Nothing here calls Math.random.
//
// Suspicion signals (`listing.tells`) are generator bookkeeping, exactly
// like worldgen's `deep.tells`: nothing player-visible reads them as a
// verdict. They exist so a closing report (ui/feed.js's
// gatheredEvidenceFor) or a future Marketplace case can tell a real tell
// from a coincidence. Kinds:
//   image-mismatch  the thumbnail is a different category of item from the
//                   title — deliberately NOT highlighted anywhere in the UI.
//   price-high      wildly too expensive for what it is.
//   price-cheap     too good to be real (an expensive item for pocket money).
//   price-precise   an oddly exact figure (£43.17 for a toaster).
//   free-with-fee   "FREE" in the title, but a fee still attached.

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

function rngFor(str) {
  return mulberry32(hashSeed(str));
}

// The 27-item category icon set, from brand/marketplace/items.json (the
// hand-drawn source of brand/marketplace/items/*.svg): each item's stroke
// shapes in a 100x100 box centred on 0,0.
const ITEMS = [
  {"id":"armchair","name":"Armchair","cat":"Furniture","bg":"#F4D9C6","paths":["M-30,-35 L-30,10 L30,10 L30,-35","M-30,10 L-30,45","M30,10 L30,45","M-30,-10 L30,-10"]},
  {"id":"sofa","name":"Sofa","cat":"Furniture","bg":"#FCD5CE","paths":["M-34,20 L-34,-4 Q-34,-14 -24,-14 L24,-14 Q34,-14 34,-4 L34,20","M-34,20 L34,20","M-42,4 L-34,4 L-34,22 L-42,22 Z","M42,4 L34,4 L34,22 L42,22 Z"]},
  {"id":"lamp","name":"Desk Lamp","cat":"Home","bg":"#FDE68A","paths":["M-8,45 L8,45","M0,45 L0,15","M-18,15 L18,15 L10,-15 L-10,-15 Z","M0,-15 L0,-38","M-14,-38 L14,-38"]},
  {"id":"mirror","name":"Wall Mirror","cat":"Home","bg":"#CDEAC0","paths":["M0,22 L0,34","M-14,34 L14,34"],"ellipses":[{"cx":0,"cy":-6,"rx":20,"ry":28}]},
  {"id":"rug","name":"Area Rug","cat":"Home","bg":"#E4D9F7","paths":["M-34,-18 L34,-18 L34,18 L-34,18 Z","M-26,-10 L26,-10 L26,10 L-26,10 Z","M-18,-2 L18,-2"]},
  {"id":"bicycle","name":"Bicycle","cat":"Transport","bg":"#BEE3DB","paths":["M-24,22 L-6,-10 L24,22","M-6,-10 L4,-10 L14,10","M-6,-10 L-14,-18 L-22,-18","M4,-10 L4,-18 L12,-18"],"circles":[{"cx":-24,"cy":22,"r":16},{"cx":24,"cy":22,"r":16}]},
  {"id":"phone","name":"Smartphone","cat":"Electronics","bg":"#C7D2FE","paths":["M-8,32 L8,32"],"rects":[{"x":-19,"y":-38,"w":38,"h":76,"rx":8}]},
  {"id":"laptop","name":"Laptop","cat":"Electronics","bg":"#B8E0D2","paths":["M-32,4 L32,4 L38,16 L-38,16 Z"],"rects":[{"x":-26,"y":-30,"w":52,"h":34,"rx":3}]},
  {"id":"headphones","name":"Headphones","cat":"Electronics","bg":"#FBCFE8","paths":["M-28,5 A28,28 0 0,1 28,5"],"rects":[{"x":-32,"y":0,"w":14,"h":26,"rx":6},{"x":18,"y":0,"w":14,"h":26,"rx":6}]},
  {"id":"camera","name":"Camera","cat":"Electronics","bg":"#F6DFEB","rects":[{"x":-28,"y":-10,"w":56,"h":36,"rx":6},{"x":-10,"y":-22,"w":20,"h":10,"rx":2}],"circles":[{"cx":0,"cy":8,"r":14}]},
  {"id":"hoodie","name":"Hoodie","cat":"Clothing","bg":"#A7D8F0","paths":["M-14,-30 L-30,-20 L-24,-4 L-16,-10 L-16,36 L16,36 L16,-10 L24,-4 L30,-20 L14,-30 C14,-24 -14,-24 -14,-30 Z"]},
  {"id":"trainers","name":"Trainers","cat":"Clothing","bg":"#FFE5B4","paths":["M-32,14 L-32,2 Q-32,-8 -22,-12 L-4,-20 Q2,-23 8,-19 L16,-13 Q22,-9 30,-9 Q36,-9 36,-2 L36,14 Z","M-32,14 L36,14","M-22,-12 L-16,-4","M-10,-15 L-4,-6","M2,-19 L8,-9"]},
  {"id":"watch","name":"Wristwatch","cat":"Accessories","bg":"#FECACA","paths":["M-8,-38 L8,-38 L8,-26 L-8,-26 Z","M-8,38 L8,38 L8,26 L-8,26 Z","M0,-14 L0,0 L10,8"],"circles":[{"cx":0,"cy":0,"r":26}]},
  {"id":"sunglasses","name":"Sunglasses","cat":"Accessories","bg":"#D0E1F9","paths":["M-4,0 L4,0","M-32,-6 L-40,-2","M32,-6 L40,-2"],"circles":[{"cx":-18,"cy":0,"r":14},{"cx":18,"cy":0,"r":14}]},
  {"id":"handbag","name":"Handbag","cat":"Accessories","bg":"#EAC7DE","paths":["M-24,-6 L24,-6 L20,28 L-20,28 Z","M-12,-6 Q-12,-24 0,-24 Q12,-24 12,-6"]},
  {"id":"plant","name":"Potted Plant","cat":"Garden","bg":"#BBF7D0","paths":["M-16,40 L-11,10 L11,10 L16,40 Z","M0,10 C0,-6 -18,-10 -22,-28 C-2,-28 0,-10 0,10","M0,10 C0,-2 14,-8 18,-22 C2,-20 0,-6 0,10"]},
  {"id":"tent","name":"Camping Tent","cat":"Outdoor","bg":"#C1E1C1","paths":["M-30,26 L0,-26 L30,26 Z","M0,-26 L0,26","M-10,26 L0,4 L10,26"]},
  {"id":"grill","name":"BBQ Grill","cat":"Outdoor","bg":"#F7C59F","paths":["M-26,4 A26,20 0 0 1 26,4","M-26,4 L26,4","M-18,4 L-24,30","M18,4 L24,30","M-4,4 L-8,30","M4,4 L8,30"]},
  {"id":"books","name":"Book Bundle","cat":"Media","bg":"#FDBA74","paths":["M-14,-26 L-14,-10","M14,-26 L14,-10","M-14,-26 L14,-26"],"rects":[{"x":-30,"y":18,"w":60,"h":12,"rx":2},{"x":-26,"y":4,"w":52,"h":12,"rx":2},{"x":-30,"y":-10,"w":60,"h":12,"rx":2}]},
  {"id":"vinyl","name":"Vinyl Records","cat":"Media","bg":"#B5D8EB","circles":[{"cx":0,"cy":0,"r":30},{"cx":0,"cy":0,"r":16},{"cx":0,"cy":0,"r":3}]},
  {"id":"boardgame","name":"Board Game","cat":"Media","bg":"#F6E6B4","paths":["M-28,0 L28,0","M0,-20 L0,20"],"rects":[{"x":-28,"y":-20,"w":56,"h":40,"rx":4}]},
  {"id":"blender","name":"Blender","cat":"Kitchen","bg":"#DDD6FE","paths":["M-18,-32 L18,-32 L12,28 L-12,28 Z","M-12,28 L-16,40 L16,40 L12,28","M-10,-18 L10,6","M10,-18 L-10,6"]},
  {"id":"toaster","name":"Toaster","cat":"Kitchen","bg":"#F1C0C0","paths":["M-26,14 L-26,-6 Q-26,-16 -16,-16 L16,-16 Q26,-16 26,-6 L26,14 Z","M-26,14 L26,14","M-10,-10 L-10,-2","M10,-10 L10,-2"]},
  {"id":"teddybear","name":"Teddy Bear","cat":"Kids & Toys","bg":"#E8D5C4","paths":["M-4,-3 Q0,1 4,-3"],"circles":[{"cx":-13,"cy":-24,"r":7},{"cx":13,"cy":-24,"r":7},{"cx":0,"cy":-10,"r":15},{"cx":-6,"cy":-9,"r":1.6},{"cx":6,"cy":-9,"r":1.6}],"ellipses":[{"cx":0,"cy":20,"rx":19,"ry":18},{"cx":-22,"cy":16,"rx":7,"ry":10},{"cx":22,"cy":16,"rx":7,"ry":10}]},
  {"id":"dumbbell","name":"Dumbbell","cat":"Sports","bg":"#C9C9FF","paths":["M-30,0 L30,0"],"rects":[{"x":-38,"y":-10,"w":12,"h":20,"rx":3},{"x":26,"y":-10,"w":12,"h":20,"rx":3}]},
  {"id":"drill","name":"Power Drill","cat":"Tools","bg":"#D9D9D9","paths":["M-6,-4 L-24,-4","M0,6 L-8,26 L4,26 Z"],"rects":[{"x":-6,"y":-10,"w":34,"h":16,"rx":4}]},
  {"id":"dogbed","name":"Dog Bed","cat":"Pets","bg":"#E3C9A6","paths":["M-32,4 Q-32,-10 0,-10 Q32,-10 32,4"],"ellipses":[{"cx":0,"cy":4,"rx":32,"ry":16}]},
];
const ITEM_BY_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

// What each thing plausibly sells for second-hand, in pounds.
const PRICE_RANGES = {
  armchair: [40, 180], sofa: [80, 450], lamp: [5, 30], mirror: [10, 60], rug: [15, 90],
  bicycle: [60, 350], phone: [60, 400], laptop: [120, 650], headphones: [15, 120], camera: [60, 450],
  hoodie: [5, 30], trainers: [15, 70], watch: [20, 180], sunglasses: [5, 60], handbag: [10, 90],
  plant: [3, 20], tent: [20, 120], grill: [25, 150], books: [5, 25], vinyl: [8, 60],
  boardgame: [5, 30], blender: [10, 50], toaster: [5, 25], teddybear: [3, 15], dumbbell: [10, 60],
  drill: [15, 70], dogbed: [8, 40],
};

// Same shape as ui/feed.js's svgIcon(): one helper, one stroke convention,
// sized by the caller's CSS. `currentColor` so the tile decides the ink.
function marketSvgIcon(item) {
  const parts = [];
  (item.paths || []).forEach((d) => parts.push(`<path d="${d}"/>`));
  (item.rects || []).forEach((r) => parts.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"${r.rx ? ` rx="${r.rx}"` : ""}/>`));
  (item.circles || []).forEach((c) => parts.push(`<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}"/>`));
  (item.ellipses || []).forEach((e) => parts.push(`<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}"/>`));
  return `<svg class="market-icon" viewBox="-50 -50 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${parts.join("")}</svg>`;
}

const MARKET_ICON = Object.fromEntries(ITEMS.map((it) => [it.id, marketSvgIcon(it)]));

const LISTING_COUNT = 100;
const DAY_MS = 24 * 60 * 60 * 1000;
const SOLD_CHANCE = 0.15; // per unsold listing, per return visit
const ARCHIVE_MAX = 30;
const REPLY_DELAY_MIN_S = 120; // "a few minutes" of real time
const REPLY_DELAY_MAX_S = 300;
const OUTBOUND_MESSAGE = "Hi! Is this still available?";

// Weighting (the rest of the game's tell philosophy: signal is a minority).
// Skrapers list a lot — scam volume is the business — so they're weighted
// up as sellers, and most of what carries a tell is theirs. Real people
// occasionally price oddly too (a £1 "just want it gone"), which is exactly
// why a single odd listing is never proof.
const SELLER_WEIGHT = { skraper: 3, smallBiz: 2, human: 1 };
const SPONSORED_RATE = { adbot: 0.6, skraper: 0.3, smallBiz: 0.2, human: 0.04 };
const TELL_RATE = { skraper: 0.55, human: 0.05 };
const SPONSORED_TELL_BONUS = 0.2;
const SECOND_TELL_CHANCE = 0.25;
const GENUINE_FREE_RATE = 0.04;

const TITLES_HUMAN = [
  "{Name}, barely used",
  "{Name} — good condition",
  "Selling my {name}, works fine",
  "{Name}, collection only",
  "{Name} - moving house, need gone",
  "Used {name}, a few marks but fine",
  "{Name}, hardly touched tbh",
  "{Name} (open to offers)",
  "{Name}, kids have outgrown it",
  "Old {name}, still going strong",
];
const TITLES_SKRAPER = [
  "{Name} — brand new, 100% genuine",
  "{Name} LIMITED STOCK",
  "Premium {name} — best price guaranteed",
  "{Name} ✓ fast delivery ✓ genuine",
  "HOT DEAL: {name}",
  "{Name}, like new — quick sale!",
  "{Name} — barely used, must go",
  "{Name}, excellent condition",
];
const TITLES_FREE_FEE = [
  "FREE {name} — must go today!",
  "FREE: {name}, first to message",
  "{Name} FREE — just cover delivery",
  "FREE {name}, like new",
];
const TITLES_FREE_GENUINE = [
  "Free to a good home: {name}",
  "{Name} — free, just collect",
];
const TITLE_CHEAP_HUMAN = "{Name}, £1 — just want it gone";

// Replies to "Is this still available?". A Skraper's are pattern-shaped and
// slightly off, in the same register as the rest of the game's Skraper
// dialogue; a person's are casual and imperfect (data/personalities.js).
const SCAM_REPLIES = [
  "Seller no longer exists.",
  "Yes, please use my link in bio.",
  "LIMITED TIME ONLY — message now before it's gone!",
  "Hello dear, item is available. Kindly share your email for the secure payment link.",
  "Yes available. 3 other buyers interested. Deposit secures it today.",
];
const HUMAN_REPLIES = [
  "Sorry! Just got collected!",
  "Still waiting on collection, want it?",
  "No sorry it's not.",
  "Yeah still here, when do you want to collect?",
  "yep! can do tomorrow after 6 if that works",
  "someone's meant to be coming for it tonight but i'll let you know if they flake",
];

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function fillTitle(tpl, item) {
  const name = item.name.toLowerCase();
  return tpl.replace("{Name}", cap(name)).replace("{name}", name);
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function roundPrice(n) {
  if (n >= 100) return Math.round(n / 10) * 10;
  if (n >= 20) return Math.round(n / 5) * 5;
  return Math.max(1, Math.round(n));
}

function sellerKind(acct) {
  if (acct.isSkraper) return "skraper";
  if (acct.personalityKey === "small_biz" || acct.isSmallBiz) return "smallBiz";
  return "human";
}

// Who can sell: anyone in the live roster except the player, an event's
// public-figure announcer, an account that has never posted (Case 005's
// silent Controller would otherwise be handed straight to the player) and
// an account already suspended.
function eligibleSellers(accounts, isSuspended) {
  return (accounts || []).filter(
    (a) => a && a.id !== "__player__" && !/^event-/.test(a.id) && (a.posts || []).length && !(isSuspended && isSuspended(a.id))
  );
}

function pickSeller(rng, sellers) {
  const total = sellers.reduce((n, a) => n + SELLER_WEIGHT[sellerKind(a)], 0);
  let r = rng() * total;
  for (const a of sellers) {
    r -= SELLER_WEIGHT[sellerKind(a)];
    if (r < 0) return a;
  }
  return sellers[sellers.length - 1];
}

// A seller's rough distance is theirs, not the listing's — the same account
// is always the same distance away, whatever it's selling.
function distanceFor(sig, acctId) {
  const r = rngFor(`${sig}|market-distance|${acctId}`);
  const miles = 0.2 + r() * r() * 14;
  return `${miles.toFixed(1)}mi`;
}

function pickTells(rng, count, isSkraper) {
  // A person's odd listing is almost always just an odd price.
  const pool = isSkraper ? ["image-mismatch", "price", "free-with-fee"] : ["price"];
  const weights = isSkraper ? [0.35, 0.35, 0.3] : [1];
  const out = [];
  for (let k = 0; k < count && out.length < pool.length; k++) {
    let r = rng();
    let chosen = pool[pool.length - 1];
    let acc = 0;
    const total = pool.reduce((n, p, i) => n + (out.indexOf(p) === -1 ? weights[i] : 0), 0);
    for (let i = 0; i < pool.length; i++) {
      if (out.indexOf(pool[i]) !== -1) continue;
      acc += weights[i] / total;
      if (r < acc) {
        chosen = pool[i];
        break;
      }
    }
    if (out.indexOf(chosen) === -1) out.push(chosen);
  }
  return out;
}

// One listing. `seedStr` makes it reproducible; `forced` (the case hook)
// pins the seller and makes the listing sponsored and suspicious.
function generateListing(seedStr, sig, sellers, forced) {
  const rng = rngFor(seedStr);
  const seller = forced ? forced.seller : pickSeller(rng, sellers);
  const kind = sellerKind(seller);
  const isSk = !!seller.isSkraper;
  const sponsored = forced ? true : rng() < (seller.personalityKey === "adbot" ? SPONSORED_RATE.adbot : SPONSORED_RATE[kind]);
  const item = pick(rng, ITEMS);
  const rTell = rng();
  const rCount = rng();
  let tells = [];
  if (forced) tells = ["image-mismatch", "price"];
  else if (rTell < (isSk ? TELL_RATE.skraper + (sponsored ? SPONSORED_TELL_BONUS : 0) : TELL_RATE.human)) {
    tells = pickTells(rng, rCount < SECOND_TELL_CHANCE && isSk ? 2 : 1, isSk);
    // A "FREE" listing has no price to be absurd — keep the fee tell.
    if (tells.indexOf("free-with-fee") !== -1) tells = tells.filter((t) => t !== "price");
  }

  // Thumbnail: the item itself, or — the quiet tell — something from a
  // different category altogether.
  let iconId = item.id;
  if (tells.indexOf("image-mismatch") !== -1) {
    const others = ITEMS.filter((it) => it.cat !== item.cat);
    iconId = pick(rng, others).id;
  }

  const [lo, hi] = PRICE_RANGES[item.id] || [5, 50];
  let price = roundPrice(lo + rng() * (hi - lo));
  let priceText = null;
  let title = fillTitle(pick(rng, isSk ? TITLES_SKRAPER : TITLES_HUMAN), item);
  let free = false;
  let fee = null;
  const finalTells = [];
  tells.forEach((t) => {
    if (t === "price") {
      if (!isSk) {
        // People give away cheap things for a quid; nobody does that with a
        // laptop. On anything pricier the odd price just doesn't happen.
        if (hi > 60) return;
        price = 1;
        title = fillTitle(TITLE_CHEAP_HUMAN, item);
        finalTells.push("price-cheap");
        return;
      }
      const mode = hi >= 120 ? pick(rng, ["high", "cheap", "precise"]) : pick(rng, ["high", "precise"]);
      if (mode === "high") price = roundPrice(hi * (8 + rng() * 7));
      else if (mode === "cheap") price = Math.max(3, Math.round(hi * (0.04 + rng() * 0.06)));
      else {
        const pence = 1 + Math.floor(rng() * 98);
        price = Math.floor(lo + rng() * (hi - lo) * 1.6) + (pence === 50 ? 51 : pence) / 100;
        priceText = `£${price.toFixed(2)}`;
      }
      finalTells.push(`price-${mode}`);
    } else if (t === "free-with-fee") {
      free = true;
      fee = roundPrice(4 + rng() * 26) + (rng() < 0.5 ? 0.99 : 0);
      title = fillTitle(pick(rng, TITLES_FREE_FEE), item);
      finalTells.push("free-with-fee");
    } else {
      finalTells.push(t);
    }
  });
  if (!finalTells.length && !isSk && rng() < GENUINE_FREE_RATE) {
    free = true;
    title = fillTitle(pick(rng, TITLES_FREE_GENUINE), item);
  }
  const feeKind = fee !== null ? pick(rng, ["collection", "P&P", "delivery"]) : null;
  return {
    id: `mk-${hashSeed(seedStr).toString(36)}`,
    itemId: item.id,
    iconId,
    title,
    price: free ? null : price,
    priceText: free ? "FREE" : priceText || `£${price}`,
    feeText: fee !== null ? `£${fee % 1 ? fee.toFixed(2) : fee} ${feeKind} fee applies` : null,
    free,
    sellerId: seller.id,
    distance: distanceFor(sig, seller.id),
    sponsored,
    tells: finalTells,
    hook: !!forced,
  };
}

function worldEntry(mstate, worldKey) {
  mstate.worlds = mstate.worlds || {};
  return mstate.worlds[worldKey] || null;
}

// The case hook: which live seller a case points at, if any.
function hookSeller(hook, sellers) {
  if (!hook || !hook.sellerId) return null;
  return sellers.find((a) => a.id === hook.sellerId) || null;
}
const HOOK_SLOT = 5; // high enough to be on the first screen, low enough not to be the very first card

function buildFullSet(sig, cycle, sellers, hook) {
  const listings = [];
  const hooked = hookSeller(hook, sellers);
  for (let slot = 0; slot < LISTING_COUNT; slot++) {
    const forced = hooked && slot === HOOK_SLOT ? { seller: hooked } : null;
    listings.push({ ...generateListing(`${sig}|market|c${cycle}|s${slot}`, sig, sellers, forced), slot });
  }
  return listings;
}

// Called when the player ARRIVES on the Marketplace grid. Rebuilds the full
// set if this world has never had one, the world itself is a different one
// (a fresh Home), or 24 wall-clock hours have passed since the last rebuild.
// Returns { rebuilt }.
function refreshIfDue(mstate, worldKey, sig, accounts, opts) {
  opts = opts || {};
  const now = typeof opts.now === "number" ? opts.now : Date.now();
  const sellers = eligibleSellers(accounts, opts.isSuspended);
  let entry = worldEntry(mstate, worldKey);
  const sameWorld = !!entry && entry.sig === sig;
  if (sameWorld && now - (entry.lastRefreshAt || 0) < DAY_MS && Array.isArray(entry.listings) && entry.listings.length) {
    return { rebuilt: false, entry };
  }
  if (!sellers.length) return { rebuilt: false, entry: null };
  const elapsedDays = sameWorld ? Math.max(1, Math.floor((now - (entry.lastRefreshAt || 0)) / DAY_MS)) : 0;
  const cycle = sameWorld ? (entry.cycle || 0) + elapsedDays : 0;
  entry = {
    sig,
    cycle,
    lastRefreshAt: now,
    lastVisitAt: null,
    visits: 0,
    gen: 0,
    listings: buildFullSet(sig, cycle, sellers, opts.hook),
    archive: [],
    viewed: sameWorld ? (entry.viewed || []).slice(-40) : [],
  };
  mstate.worlds[worldKey] = entry;
  return { rebuilt: true, entry };
}

// Sold/replace churn — only ever on a RETURN to the grid, never while the
// player is looking at it (the caller decides what counts as a return).
// Each unsold listing independently has SOLD_CHANCE to go; a listing whose
// seller has since been suspended always goes. The case hook's listing
// stays put while its case is live (`opts.keepHook`). Returns the number
// replaced.
function churnOnReturn(mstate, worldKey, accounts, opts) {
  opts = opts || {};
  const entry = worldEntry(mstate, worldKey);
  if (!entry || !Array.isArray(entry.listings)) return 0;
  const now = typeof opts.now === "number" ? opts.now : Date.now();
  const sellers = eligibleSellers(accounts, opts.isSuspended);
  const firstArrival = !entry.lastVisitAt;
  entry.visits = (entry.visits || 0) + 1;
  entry.lastVisitAt = now;
  if (firstArrival || !sellers.length) return 0;
  const sellerIds = new Set(sellers.map((a) => a.id));
  const rng = rngFor(`${entry.sig}|market|c${entry.cycle}|v${entry.visits}`);
  let replaced = 0;
  entry.listings = entry.listings.map((listing, slot) => {
    const r = rng(); // always drawn, so one listing's fate never reshuffles another's
    const sellerGone = !sellerIds.has(listing.sellerId);
    if (listing.hook && opts.keepHook && !sellerGone) return listing;
    if (!sellerGone && r >= SOLD_CHANCE) return listing;
    entry.gen = (entry.gen || 0) + 1;
    entry.archive = [{ ...listing, sold: true, soldAt: now }, ...(entry.archive || [])].slice(0, ARCHIVE_MAX);
    replaced++;
    return { ...generateListing(`${entry.sig}|market|c${entry.cycle}|g${entry.gen}`, entry.sig, sellers, null), slot };
  });
  return replaced;
}

// Keeps the save small: a world's market is ~100 listings, so markets are
// only kept for worlds the player can actually still be in (Home, the live
// world, the case they were last in, any hot-swapped-away world). A market
// that's dropped is simply rebuilt — deterministically, from the same seed
// — if its world is ever entered again. Messages are tiny and always kept.
function pruneWorlds(mstate, keepKeys) {
  const keep = new Set(keepKeys.filter(Boolean));
  Object.keys(mstate.worlds || {}).forEach((k) => {
    if (!keep.has(k)) delete mstate.worlds[k];
  });
}

function findListing(mstate, worldKey, listingId) {
  const entry = worldEntry(mstate, worldKey);
  if (!entry) return null;
  return (entry.listings || []).find((l) => l.id === listingId) || (entry.archive || []).find((l) => l.id === listingId) || null;
}

function markViewed(mstate, worldKey, listingId) {
  const entry = worldEntry(mstate, worldKey);
  if (!entry) return false;
  entry.viewed = entry.viewed || [];
  if (entry.viewed.indexOf(listingId) !== -1) return false;
  entry.viewed.push(listingId);
  if (entry.viewed.length > 60) entry.viewed = entry.viewed.slice(-60);
  return true;
}

// Every listing by `sellerId` the player has actually opened in this world
// (live or since sold) — what a closing report can offer as evidence.
function viewedListingsBy(mstate, worldKey, sellerId) {
  const entry = worldEntry(mstate, worldKey);
  if (!entry) return [];
  return (entry.viewed || []).map((id) => findListing(mstate, worldKey, id)).filter((l) => l && l.sellerId === sellerId);
}

function messageFor(mstate, worldKey, listingId) {
  return (mstate.messages || []).find((m) => m.worldKey === worldKey && m.listingId === listingId) || null;
}

// The seller's answer, fixed at the moment of asking.
function replyFor(sig, listing, seller) {
  const rng = rngFor(`${sig}|market-reply|${listing.id}`);
  const scam = !!seller.isSkraper;
  return {
    text: pick(rng, scam ? SCAM_REPLIES : HUMAN_REPLIES),
    delayMs: Math.round((REPLY_DELAY_MIN_S + rng() * (REPLY_DELAY_MAX_S - REPLY_DELAY_MIN_S)) * 1000),
    readsScam: scam,
  };
}

// One message per listing, ever. Returns the new message, or null if the
// player has already asked about this listing.
function sendAvailabilityMessage(mstate, worldKey, sig, listing, seller, now) {
  now = typeof now === "number" ? now : Date.now();
  if (messageFor(mstate, worldKey, listing.id)) return null;
  const reply = replyFor(sig, listing, seller);
  const msg = {
    id: `mkmsg-${listing.id}`,
    worldKey,
    listingId: listing.id,
    sellerId: seller.id,
    sellerName: seller.name,
    title: listing.title,
    iconId: listing.iconId,
    sentText: OUTBOUND_MESSAGE,
    sentAt: now,
    respondAt: now + reply.delayMs,
    replyText: reply.text,
    readsScam: reply.readsScam,
    delivered: false,
  };
  mstate.messages = mstate.messages || [];
  mstate.messages.push(msg);
  return msg;
}

// Replies whose time has come and that haven't reached the Inbox yet.
// Marks them delivered — the caller turns each into an Inbox entry.
function takeDueReplies(mstate, now) {
  now = typeof now === "number" ? now : Date.now();
  const due = (mstate.messages || []).filter((m) => !m.delivered && m.respondAt <= now);
  due.forEach((m) => (m.delivered = true));
  return due;
}

function defaultState() {
  return { worlds: {}, messages: [] };
}

// Fail-open restore of a saved `state.marketplace`, same spirit as every
// other restore path: anything malformed is dropped, not trusted.
function normalizeState(saved) {
  const out = defaultState();
  if (!saved || typeof saved !== "object") return out;
  if (saved.worlds && typeof saved.worlds === "object") {
    Object.entries(saved.worlds).forEach(([k, e]) => {
      if (e && typeof e === "object" && typeof e.sig === "string" && Array.isArray(e.listings)) {
        out.worlds[k] = {
          sig: e.sig,
          cycle: e.cycle || 0,
          lastRefreshAt: typeof e.lastRefreshAt === "number" ? e.lastRefreshAt : 0,
          lastVisitAt: typeof e.lastVisitAt === "number" ? e.lastVisitAt : null,
          visits: e.visits || 0,
          gen: e.gen || 0,
          listings: e.listings.filter((l) => l && typeof l.id === "string" && ITEM_BY_ID[l.iconId]),
          archive: Array.isArray(e.archive) ? e.archive.filter((l) => l && typeof l.id === "string" && ITEM_BY_ID[l.iconId]) : [],
          viewed: Array.isArray(e.viewed) ? e.viewed.filter((x) => typeof x === "string") : [],
        };
      }
    });
  }
  if (Array.isArray(saved.messages)) {
    out.messages = saved.messages.filter((m) => m && typeof m.listingId === "string" && typeof m.respondAt === "number" && typeof m.replyText === "string");
  }
  return out;
}

const api = {
  ITEMS,
  ITEM_BY_ID,
  MARKET_ICON,
  PRICE_RANGES,
  LISTING_COUNT,
  DAY_MS,
  SOLD_CHANCE,
  OUTBOUND_MESSAGE,
  SCAM_REPLIES,
  HUMAN_REPLIES,
  eligibleSellers,
  generateListing,
  refreshIfDue,
  churnOnReturn,
  pruneWorlds,
  findListing,
  markViewed,
  viewedListingsBy,
  messageFor,
  sendAvailabilityMessage,
  takeDueReplies,
  defaultState,
  normalizeState,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
} else {
  window.SKRAPERS_MARKET = api;
}

})();
