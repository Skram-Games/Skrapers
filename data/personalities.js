// SKRAPERS — Stage 0 content-generation prototype
// Personality definitions: each one is a distinct set of topics, sentence
// habits, vocabulary and quirks used by simulation/generate.js to produce posts.
// This file holds ONLY data — no generation logic — so voices can be tuned
// by editing pools here without touching the generator.

(function () {
const HUMAN_PERSONALITIES = {
  lurker: {
    label: "Lurker (human)",
    postingRate: "low", // rarely posts original content, mostly reacts
    activeHours: [9, 23], // wide, unremarkable waking-hours window
    topics: ["whatever's on the feed", "something someone else said"],
    sentenceLengths: [3, 4, 5, 6], // short
    punctuation: "minimal", // often no full stop, no capital start
    emojiRate: 0.05,
    typoRate: 0.08,
    capsStyle: "lowercase-lean", // sometimes skips capitals entirely
    openers: ["", "", "honestly", "ngl", "wait", "lol", "ok but", "hm", "eh", "so apparently", "anyway"],
    fillers: ["kind of", "sort of", "i guess", "idk", "eh", "not sure tbh", "whatever that means", "no clue honestly"],
    closers: ["", "", "", "anyway", "whatever", "shrug", "meh", "moving on", "who cares tbh"],
    vocab: ["thing", "stuff", "this", "that", "it"],
    // Bio pools, one per personality/archetype (human AND Skraper) — Feature
    // round ("every profile needs a bio"). Same template+word-pool
    // convention as TEMPLATES in simulation/generate.js: a short bank of
    // hand-authored 1-2 sentence bio shapes, an optional {topic} slot filled
    // from this personality's own topics/topicPool, picked by
    // generateBio() (simulation/generate.js). Human bios read like an
    // ordinary person wrote them; Skraper archetype bios can (not must)
    // carry a subtle, non-conclusive tell consistent with that archetype's
    // established voice — never a giveaway on their own.
    bioPool: ["just here for the discourse tbh", "mostly here to read, not post", "professional lurker, occasional commenter", "here for {topic}, mostly just scrolling", "no thoughts, just vibes and a feed"],
    topicPool: [
      "the thing everyone's posting about",
      "that video",
      "this post",
      "the news today",
      "my feed rn",
      "that whole thing from earlier",
      "the group chat drama",
      "that account everyone's talking about",
      "whatever this trend is",
      "the thing from this morning",
      "that reply someone left",
      "the thing my sibling sent me",
      "whatever's blowing up rn",
      "that screenshot going around",
    ],
    quirks: ["drops final punctuation", "rarely starts with a capital", "very short replies"],
  },

  obsessive: {
    label: "Obsessive hobbyist (human)",
    postingRate: "high",
    activeHours: [21, 2], // late night, wraps past midnight
    topics: ["vintage synthesizers", "competitive birdwatching", "1970s formula 1", "sourdough fermentation science", "obscure board game history", "amateur radio propagation", "pre-war typewriter restoration", "deep-sea cable mapping", "regional folk instrument tuning systems", "18th century clockmaking"],
    sentenceLengths: [14, 18, 22, 25], // long, detail-heavy
    punctuation: "heavy", // semicolons, em-dashes, parenthetical asides
    emojiRate: 0.02,
    typoRate: 0.03,
    capsStyle: "occasional-emphasis", // ALL CAPS for one key word
    openers: ["Okay so", "Unpopular opinion but", "I need to say this", "Correction from earlier —", "Genuinely can't let this go —", "Quick addendum:"],
    fillers: ["specifically", "which is important because", "and I cannot stress this enough", "technically speaking", "for what it's worth", "as I've said before"],
    closers: ["Do with that what you will.", "Happy to be proven wrong but I doubt it.", "Anyway, back to the archive.", "Sources available if anyone actually wants them.", "Not that anyone asked."],
    vocab: ["frankly", "objectively", "the actual data shows", "if you know, you know"],
    quirks: ["cites specific numbers/years/models", "one ALL CAPS word per post for emphasis", "assumes deep shared context with reader"],
    bioPool: ["Deep in {topic} and unwilling to apologize for it.", "If it's about {topic}, I probably have an opinion.", "Collector, hobbyist, occasional bore about {topic}.", "Here for {topic}. Sources available on request."],
  },

  teenager: {
    label: "Teenager (human)",
    postingRate: "very high",
    activeHours: [15, 23], // after school through late evening
    topics: ["a show everyone's watching", "a group chat drama", "a song stuck in their head", "school starting again", "a group project going badly", "a new phone case", "a teacher's weird rule", "a friend's situationship"],
    sentenceLengths: [4, 6, 8, 10],
    punctuation: "sparse-expressive", // lowercase, repeated letters, no full stops
    emojiRate: 0.35,
    typoRate: 0.1,
    capsStyle: "lowercase-default",
    openers: ["not me", "the way", "why did", "i cannot believe", "bestie"],
    fillers: ["literally", "actually", "no because", "i'm—"],
    closers: ["im deceased", "no thoughts just vibes", "sending this to the groupchat", ""],
    vocab: ["fr", "ngl", "lowkey", "highkey", "it's giving", "the audacity"],
    quirks: ["stretches letters for emphasis (soooo, wtttt)", "never capitalises", "trails off with em dash or ellipsis"],
    bioPool: ["it's giving chaotic good", "no thoughts just vibes 🫶", "still figuring it out lol", "{topic} enjoyer, professional overthinker", "here for the chaos, staying for the memes"],
  },

  news_follower: {
    label: "News follower (human)",
    postingRate: "medium",
    activeHours: [7, 9], // morning news-check window, plus a lunch spike handled separately
    topics: ["a policy story", "an economic report", "a local council decision", "an ongoing court case", "a transit funding vote", "a regulatory hearing", "an infrastructure delay", "a public records release"],
    sentenceLengths: [10, 12, 15, 16],
    punctuation: "standard",
    emojiRate: 0.03,
    typoRate: 0.02,
    capsStyle: "standard",
    openers: ["Interesting piece on", "Worth reading:", "According to today's report,", "This tracks with what"],
    fillers: ["it's worth noting that", "reportedly", "according to officials", "the article suggests"],
    closers: ["Curious what others think.", "Will be watching how this develops.", "Source in the article."],
    vocab: ["reportedly", "according to", "in the meantime", "developing story"],
    quirks: ["references an unnamed article/source", "hedges claims", "asks a measured question at the end"],
    bioPool: ["Reads too much news, sleeps too little.", "Following {topic} closer than is probably healthy.", "Here for context, not hot takes.", "Trying to stay informed without losing my mind."],
  },

  professional: {
    label: "LinkedIn-style professional (human)",
    postingRate: "medium",
    activeHours: [8, 18], // business hours
    topics: ["a work milestone", "a lesson from a project", "team culture", "an industry trend", "a mentor who shaped my career", "a hiring lesson", "a client win", "a conference takeaway"],
    sentenceLengths: [8, 10, 12, 14],
    punctuation: "standard-clean",
    emojiRate: 0.08,
    typoRate: 0.01,
    capsStyle: "standard",
    openers: ["Reflecting on", "Proud to share that", "A lesson I keep relearning:", "Big thank you to"],
    fillers: ["it reminded me that", "which is why", "at the end of the day", "more than ever"],
    closers: ["What's your experience been?", "Grateful for the team.", "Onwards.", "#growth #team"],
    vocab: ["leverage", "circle back", "align", "impact", "journey"],
    quirks: ["ends with a soft call-to-action question", "occasional hashtag pair", "humble-brag framing"],
    bioPool: ["Building things, one lesson at a time.", "Sharing what I've learned along the way.", "Career-focused, coffee-fueled, always learning.", "Talking shop about {topic} and the lessons in it."],
  },

  // Feature round (fake ads + human counterpart): a REAL person running a
  // small business/craft/advice side-thing out of their own life — home
  // baker, candle-maker, budgeting-advice giver, Etsy-style crafter. This is
  // deliberately NOT the impersonal "Influencer" Skraper archetype above
  // ("not sponsored but..." energy, near-identical enthusiasm regardless of
  // topic) — small_biz's voice is personal, a little tired, imperfect, and
  // genuinely small-scale (see worldgen.js's follower-count override for
  // this personality). Most of this account's posts are just normal life
  // chatter in this voice; a minority (see simulation/worldgen.js) are
  // generated via generatePromoPost() below instead — an organic promo post
  // from a real person, not an ad.
  small_biz: {
    label: "Small business / homemade (human)",
    postingRate: "medium",
    activeHours: [8, 22],
    topics: ["a batch I just finished", "a custom order", "packaging that finally worked", "a market I did this weekend", "a mistake I learned from", "a request I got in my DMs", "restocking", "today's setup"],
    sentenceLengths: [7, 9, 11, 13],
    punctuation: "standard",
    emojiRate: 0.18,
    typoRate: 0.05,
    capsStyle: "standard",
    openers: ["Okay so", "Quick one —", "Just wanted to share", "Small update:", "Been a minute but", "So this happened —"],
    fillers: ["still figuring out pricing tbh", "learning as I go", "my kitchen table is a disaster right now", "took way longer than I thought", "still can't believe people actually want these", "not gonna lie I almost gave up on this one"],
    closers: ["Message me if you want one.", "Link in bio if you're curious.", "More coming this weekend hopefully.", "Thank you to everyone who's supported this so far, genuinely.", "Still such a small thing but it means a lot."],
    vocab: ["handmade", "small batch", "one at a time", "from my kitchen"],
    topicPool: [
      "a candle I just poured",
      "a new scent I'm testing",
      "a loaf that didn't rise right",
      "a custom order for a birthday",
      "packaging I finally got right",
      "a craft fair this weekend",
      "a budgeting spreadsheet I made for myself",
      "the little shop I started on a whim",
      "a stitching mistake I had to redo",
      "my first sale that wasn't a friend or family member",
    ],
    quirks: ["mentions the actual physical process (kitchen, table, hands)", "small-follower-count energy — thanks specific people by first name", "typos read as genuinely rushed, not stylistic"],
    bioPool: ["One person, one kitchen table, way too many ideas.", "Handmade, small batch, made by me.", "Started as a hobby, still figuring out the rest.", "Small shop, big learning curve. Thanks for being here."],
    // Promo-only pools, used solely by generate.js's generatePromoPost() for
    // the minority of this account's posts tagged postType 'promo' — kept
    // separate from topicPool/openers/closers above so normal life-chatter
    // posts never accidentally sound like a pitch.
    productPool: ["hand-poured soy candles", "fresh sourdough loaves", "my budgeting spreadsheet template", "macrame plant hangers", "small-batch granola", "hand-stitched tote bags", "one-off ceramic mugs", "custom birthday cookies"],
    promoOpeners: ["Restocking this week:", "New batch just finished —", "A few of these left:", "Made a small batch of", "Currently taking orders for", "Finally got a good run of"],
    promoClosers: ["DM me if you want one before they're gone.", "Link in bio, only a few made this time.", "Shipping starts Friday.", "Message me — first come first served.", "Made by hand, one at a time, so no rush shipping I'm afraid.", "Price is in my bio, sorry for asking you to click through."],
  },

  // Content round: the feed felt repetitive because there were only 13
  // voices behind however many procedurally-named accounts got generated.
  // This is the fix — 28 new HUMAN archetypes (bringing the human total to
  // 34), NOT new Skraper archetypes; Skraper repetitiveness is intentional
  // (an investigative tell), human repetitiveness was the actual bug. Three
  // clusters below per the explicit brief: older/tech-skeptic voices (kept
  // warm, never a mean caricature), current-affairs-adjacent citizen voices
  // (evergreen social commentary, never a specific real dated event since
  // this game has no way to stay current), and a wide hobbyist/life-stage
  // spread. Every entry follows the same template+{topic}-slot convention
  // as the six above and was blind-read via simulation/generate.js's
  // generatePost() before shipping (see TEMPLATES in generate.js).

  confused_elder: {
    label: "Confused by new tech (human)",
    postingRate: "low",
    activeHours: [10, 20],
    topics: ["this app", "the new update", "signing into something", "a website that changed on me", "my grandson's advice", "a thing my phone just did", "a form online", "the online banking site"],
    sentenceLengths: [6, 8, 10, 12],
    punctuation: "standard",
    emojiRate: 0.02,
    typoRate: 0.06,
    capsStyle: "standard",
    openers: ["I don't understand", "I can't work out", "Completely lost with", "Struggling with", "My grandson had to explain", "So apparently"],
    fillers: ["I've pressed every button I can find", "it just won't do what it's supposed to", "nothing makes sense to me anymore", "it worked fine yesterday and now it won't", "I only wanted to do one simple thing"],
    closers: ["Someone please help.", "I don't know what I did wrong.", "Back to writing it down on paper, I think.", "If anyone understands this please tell me."],
    vocab: ["the computer", "the machine", "this contraption", "the internet thing"],
    quirks: ["genuinely baffled, not performing confusion for laughs", "asks real questions expecting a real answer", "refers to devices vaguely (the machine, the computer)"],
    bioPool: ["Still learning how all this works, be patient with me.", "Not very good with computers but trying my best.", "Here because my grandson set this up for me.", "If I've done something wrong please just tell me kindly."],
  },

  grumpy_traditionalist: {
    label: "Skeptical of new tech (human)",
    postingRate: "medium",
    activeHours: [7, 20],
    topics: ["this new app everyone's using", "people staring at their phones", "the way things are done now", "this online nonsense", "another update nobody asked for", "kids and their phones", "the self-checkout machines", "a password for everything now"],
    sentenceLengths: [8, 10, 12, 14],
    punctuation: "standard",
    emojiRate: 0.0,
    typoRate: 0.01,
    capsStyle: "standard",
    openers: ["In my day", "Back when things worked properly", "I'll say it —", "Call me old-fashioned but", "Nobody asked for it, but here's"],
    fillers: ["we didn't need any of this", "a phone call did the job fine", "everything has to be complicated now", "nobody actually asks if it's an improvement", "it's change for the sake of change"],
    closers: ["Just my opinion.", "Anyway.", "Nobody listens to me anyway.", "But what do I know."],
    vocab: ["nonsense", "newfangled", "gimmick", "the old way"],
    quirks: ["dismissive but not cruel — grumbling, not mean", "compares everything unfavorably to how it used to be done", "short, flat closers"],
    bioPool: ["Old-fashioned and not ashamed of it.", "Still prefer a phone call, if I'm honest.", "Here because my daughter insisted. Don't expect much.", "Skeptical of most of this, {topic} included."],
  },

  overexplaining_elder: {
    label: "Trying to keep up with tech (human)",
    postingRate: "medium",
    activeHours: [9, 19],
    topics: ["setting up my new phone", "video calling the grandkids", "an app my daughter showed me", "posting a photo the right way", "learning how to do this properly", "the online shopping thing", "my new email account"],
    sentenceLengths: [10, 13, 16, 18],
    punctuation: "standard",
    emojiRate: 0.1,
    typoRate: 0.04,
    capsStyle: "standard",
    openers: ["Just so everyone knows,", "Let me explain how I did this:", "Proud to say", "For anyone wondering how I did this,", "Wanted to share that"],
    fillers: ["it took me three tries but I got there", "my grandson showed me once and I wrote down every step", "I'm getting better at this, slowly", "I know it's probably obvious to everyone else", "I made sure to do it exactly how I was shown"],
    closers: ["Quite proud of myself, actually.", "Learning something new every day.", "Getting there, one step at a time.", "Not bad for an old dog learning new tricks."],
    vocab: ["step by step", "carefully", "properly this time", "the right way"],
    quirks: ["over-explains basic tech steps like an achievement", "genuinely earnest and a little proud", "credits whoever taught them by relation (grandson, daughter)"],
    bioPool: ["Learning the tech things, one step at a time.", "My grandson set this up and I'm determined to use it properly.", "Slowly getting the hang of {topic}.", "Proud of myself for figuring most of this out."],
  },

  concerned_citizen: {
    label: "Concerned citizen (human)",
    postingRate: "medium",
    activeHours: [6, 23],
    topics: ["the cost of everything", "what's going on in the world right now", "the state of things these days", "how divided everyone seems", "whatever's dominating the news", "how fast everything is changing", "what the next generation is inheriting"],
    sentenceLengths: [9, 11, 13, 15],
    punctuation: "standard",
    emojiRate: 0.03,
    typoRate: 0.02,
    capsStyle: "standard",
    openers: ["Honestly worried about", "Hard not to think about", "Can't stop thinking about", "I keep coming back to", "Trying not to spiral about"],
    fillers: ["it feels like a lot right now", "nobody seems to have a straight answer", "it's hard to know what to believe anymore", "everyone I talk to feels the same way", "it wasn't like this a few years ago"],
    closers: ["Just thinking out loud.", "Hoping things settle down soon.", "Trying to stay hopeful.", "Maybe I'm overthinking it."],
    vocab: ["uncertain times", "hard to keep up", "a lot going on", "who knows anymore"],
    quirks: ["reacts to the general mood of current events without citing anything specific", "genuinely worried, not alarmist", "asks reflective open questions — a citizen reacting, not a headline"],
    bioPool: ["Just trying to make sense of things like everyone else.", "Paying more attention to the world than is probably good for me.", "Here mostly to think out loud about {topic}.", "Trying to stay hopeful, some days easier than others."],
  },

  cost_of_living_watcher: {
    label: "Cost of living watcher (human)",
    postingRate: "medium",
    activeHours: [7, 22],
    topics: ["the grocery bill", "energy prices", "rent going up", "petrol prices", "how far a paycheck goes these days", "the price of everything at the shop", "another bill that went up"],
    sentenceLengths: [7, 9, 11, 13],
    punctuation: "standard",
    emojiRate: 0.04,
    typoRate: 0.03,
    capsStyle: "standard",
    openers: ["Just did the weekly shop and", "Checked my bills and", "Not to complain again but", "Another month, another look at", "Not imagining it —"],
    fillers: ["it's gotten ridiculous", "I don't remember it being this bad", "everything's gone up except my pay", "you really notice it now", "it adds up fast"],
    closers: ["Rant over.", "Just needed to say it somewhere.", "Anyway, back to budgeting.", "We'll manage, I suppose."],
    vocab: ["gone up again", "adds up", "tightening the belt", "barely covers it"],
    quirks: ["specific everyday cost complaints, not abstract", "wry rather than despairing", "compares to how it used to be without citing dates"],
    bioPool: ["Watching every price go up so you don't have to.", "Budget spreadsheet enjoyer, unfortunately by necessity.", "Just trying to make {topic} make sense.", "Here to commiserate about the price of everything."],
  },

  local_council_watcher: {
    label: "Local politics watcher (human)",
    postingRate: "low",
    activeHours: [18, 23],
    topics: ["the council meeting last night", "the new parking scheme", "that road that's been closed for months", "the local budget vote", "the planning application on the corner lot", "the bus route changes", "the town hall notice board"],
    sentenceLengths: [9, 11, 13, 15],
    punctuation: "standard",
    emojiRate: 0.02,
    typoRate: 0.02,
    capsStyle: "standard",
    openers: ["Went to the council meeting and", "Noticed", "Apparently the council has decided on", "Local update on", "So the town's doing this now, apparently —"],
    fillers: ["nobody I know was consulted", "it's been going on for months with no update", "half the room was against it", "the minutes are online if you want the details", "it'll probably get delayed again anyway"],
    closers: ["Making a note to actually vote next time.", "Will believe it when I see it.", "Someone should be asking more questions.", "Anyway, that's local politics for you."],
    vocab: ["the council", "the vote", "the meeting minutes", "local politics"],
    quirks: ["hyper-local rather than national — the town, not 'the world'", "mild exasperation with bureaucracy", "mentions attending or reading actual local sources"],
    bioPool: ["Probably at the council meeting when you least expect it.", "Keeping half an eye on local politics so someone does.", "Here for {topic} updates nobody else is tracking.", "Small-town news, mostly local government."],
  },

  gardener: {
    label: "Gardener (human)",
    postingRate: "medium",
    activeHours: [6, 11],
    topics: ["the tomatoes this year", "a pest problem in the beds", "what finally came up", "the compost heap", "a plant that didn't make it", "seed starting", "the weather ruining everything", "a neighbor's tip that actually worked"],
    sentenceLengths: [8, 10, 12, 14],
    punctuation: "standard",
    emojiRate: 0.1,
    typoRate: 0.03,
    capsStyle: "standard",
    openers: ["Out in the garden and", "Quick garden update on", "Finally got around to", "Lost the battle with", "Small win in the garden with"],
    fillers: ["fingers crossed it survives the week", "the slugs got there first", "took longer than expected but worth it", "still not sure what I'm doing half the time", "the soil needed it more than I thought"],
    closers: ["Will report back.", "Gardening is 90% patience apparently.", "Onwards to next season.", "Send good weather thoughts this way."],
    vocab: ["the beds", "the soil", "dug in", "came up nicely"],
    quirks: ["mentions weather constantly", "mild ongoing battle with pests/weeds", "checks progress in small increments"],
    bioPool: ["Growing things badly but enthusiastically.", "Mostly here for {topic} updates and complaining about slugs.", "Amateur gardener, professional over-waterer.", "Dirt under my nails, hope in my heart."],
  },

  home_cook: {
    label: "Home cook (human)",
    postingRate: "medium",
    activeHours: [16, 21],
    topics: ["dinner", "a recipe I tried", "a fridge-clearout dinner", "a dish that didn't turn out right", "a family recipe", "this week's meal prep", "a new spice I tried"],
    sentenceLengths: [7, 9, 11, 13],
    punctuation: "standard",
    emojiRate: 0.15,
    typoRate: 0.04,
    capsStyle: "standard",
    openers: ["Made this for dinner and", "Tried a new recipe tonight and", "Kitchen experiment tonight:", "Cooking again —", "Threw this together with"],
    fillers: ["turned out better than expected", "definitely needs more salt next time", "the whole house smells amazing", "not restaurant quality but I'll take it", "will absolutely make this again"],
    closers: ["Recipe if anyone wants it.", "Simple but it works.", "Comfort food season is here.", "Cooking my way through the week."],
    vocab: ["simmered", "seasoned", "leftovers", "the whole house smells like it"],
    quirks: ["describes smell/taste sensory detail", "casual home-cook energy, not chef-performative", "mentions using up leftovers"],
    bioPool: ["Cooking my way through whatever's in the fridge.", "Not a chef, just hungry and stubborn.", "Here for {topic} and the occasional kitchen disaster.", "Home cook, mediocre plating, decent food."],
  },

  amateur_photographer: {
    label: "Amateur photographer (human)",
    postingRate: "medium",
    activeHours: [5, 8],
    topics: ["the morning light", "a shot I finally got right", "a batch of shots I'm sorting through", "a new lens I'm testing", "a sunrise I almost missed", "a composition that didn't work", "the gear I'm still learning"],
    sentenceLengths: [8, 10, 12, 14],
    punctuation: "standard",
    emojiRate: 0.08,
    typoRate: 0.02,
    capsStyle: "standard",
    openers: ["Caught this at", "Out shooting again and", "Editing through the weekend's shots of", "Almost missed", "Still chasing"],
    fillers: ["the light only lasted a few minutes", "still learning to trust my instincts more than the settings", "worth getting up early for", "not perfect but I like the imperfection", "took about forty shots to get one I liked"],
    closers: ["Full set coming soon.", "Back out again tomorrow if the weather holds.", "Learning something new every shoot.", "Still figuring out my own style."],
    vocab: ["golden hour", "the frame", "composition", "the light"],
    quirks: ["obsessed with light and timing specifically", "mentions technical process without jargon overload", "modest about skill level"],
    bioPool: ["Chasing light, mostly failing, occasionally getting it right.", "Amateur with a camera and too much patience.", "Here for {topic} and early mornings.", "Learning photography one bad shot at a time."],
  },

  runner: {
    label: "Runner (human)",
    postingRate: "medium",
    activeHours: [5, 7],
    topics: ["this morning's run", "training for a race", "a new route I found", "my pace lately", "a rough run", "sore legs after yesterday", "the weather during my run"],
    sentenceLengths: [6, 8, 10, 12],
    punctuation: "standard",
    emojiRate: 0.12,
    typoRate: 0.02,
    capsStyle: "standard",
    openers: ["Got the run in.", "Quick one this morning about", "Legs were heavy but got through", "Ran before work and dealt with", "Squeezed in"],
    fillers: ["felt good once I got going", "not my best pace but I showed up", "the first mile is always the worst", "worth it for the quiet streets alone", "still recovering from yesterday"],
    closers: ["Rest day tomorrow, earned it.", "Onwards.", "Counting down to race day.", "One more mile than I planned, worth it."],
    vocab: ["pace", "splits", "the loop", "the route"],
    quirks: ["short, matter-of-fact sentences", "mentions distance/pace casually", "not preachy about fitness, just reporting"],
    bioPool: ["Running before the world wakes up.", "Slow and steady, mostly steady.", "Training for {topic}, one early morning at a time.", "Just here for the miles."],
  },

  gamer: {
    label: "Gamer (human)",
    postingRate: "very high",
    activeHours: [21, 3],
    topics: ["a game I've been grinding", "a patch that changed everything", "a boss fight that's kicking my butt", "my squad last night", "a game I finally finished", "a new release everyone's playing", "a bug that ruined my run"],
    sentenceLengths: [6, 8, 10, 12],
    punctuation: "sparse-expressive",
    emojiRate: 0.2,
    typoRate: 0.06,
    capsStyle: "lowercase-default",
    openers: ["ok so", "not me still playing", "three hours in and dealing with", "finally beat", "the way this game handled"],
    fillers: ["cant stop thinking about it", "the grind is real", "worth every hour honestly", "still mad about that last death", "no regrets tbh"],
    closers: ["back to it.", "send help.", "worth it though.", "10/10 no notes."],
    vocab: ["the grind", "loot", "the squad", "patch notes"],
    quirks: ["lowercase, casual internet register", "specific but never a real branded title (kept generic — 'the game')", "genuine enthusiasm, not performative rage"],
    bioPool: ["probably still playing whatever i said id stop playing", "here for {topic}, staying for the chaos", "controller in hand, responsibilities ignored", "grinding something, always"],
  },

  book_club: {
    label: "Book club reader (human)",
    postingRate: "low",
    activeHours: [19, 23],
    topics: ["this month's book club pick", "a book I can't put down", "a plot twist I didn't see coming", "a book that disappointed me", "our discussion last night", "a book I'm rereading", "a recommendation I finally tried"],
    sentenceLengths: [9, 11, 13, 15],
    punctuation: "standard",
    emojiRate: 0.06,
    typoRate: 0.02,
    capsStyle: "standard",
    openers: ["Finished it last night and", "Book club discussed", "Halfway through and dealing with", "Couldn't put down", "Rereading it and noticing"],
    fillers: ["the ending genuinely surprised me", "not what I expected going in", "the pacing dragged in the middle but I stuck with it", "already thinking about what to read next", "the discussion ran way longer than planned"],
    closers: ["No spoilers in the replies please.", "On to the next pick.", "Would recommend, with caveats.", "Already dreading finishing it."],
    vocab: ["the pacing", "the ending", "the discussion", "the next pick"],
    quirks: ["never gives away actual spoilers", "measured, reflective tone", "references the book club as a social ritual"],
    bioPool: ["Reading faster than I can talk about it.", "Book club regular, chronic over-committer to reading lists.", "Here for {topic}, no spoilers please.", "Always halfway through three books at once."],
  },

  crafter: {
    label: "Crafter (human)",
    postingRate: "medium",
    activeHours: [10, 15],
    topics: ["a project I finally finished", "a pattern I'm working through", "a mistake I had to unpick", "yarn I've been hoarding", "a gift I'm making", "a craft fair I'm prepping for", "a technique I just learned"],
    sentenceLengths: [7, 9, 11, 13],
    punctuation: "standard",
    emojiRate: 0.14,
    typoRate: 0.03,
    capsStyle: "standard",
    openers: ["Finally finished", "Started a new project with", "Small progress on", "Unpicked half of", "Been working away at"],
    fillers: ["took three tries to get right", "my hands needed the quiet work honestly", "not perfect but I'm proud of it", "still learning as I go", "the pattern fought me the whole way"],
    closers: ["Onto the next one.", "Craft table is a disaster but worth it.", "Slow hobby, happy hands.", "Will post a photo once it's blocked."],
    vocab: ["stitches", "the pattern", "the project", "yarn stash"],
    quirks: ["mentions the physical/tactile process", "modest pride in finished work", "hoards materials (yarn/fabric stash)"],
    bioPool: ["Yarn stash bigger than my apartment, no regrets.", "Making things slowly, one stitch at a time.", "Here for {topic} and the occasional craft disaster.", "Hands need to be busy or I go a bit mad."],
  },

  diy_homeimprovement: {
    label: "DIY / home improvement (human)",
    postingRate: "low",
    activeHours: [9, 18],
    topics: ["a wall I finally patched", "a shelf I put up", "a project that took way longer than planned", "a tool I finally bought", "a room I'm slowly redoing", "a leak I fixed myself", "a mistake that cost me a trip back to the hardware store"],
    sentenceLengths: [8, 10, 12, 14],
    punctuation: "standard",
    emojiRate: 0.08,
    typoRate: 0.03,
    capsStyle: "standard",
    openers: ["Spent the weekend on", "Finally tackled", "Another trip to the hardware store for", "Slowly but surely fixing", "Took a swing at"],
    fillers: ["three trips to the hardware store later", "definitely should've watched more videos first", "not professional but it's holding up", "took twice as long as I planned", "learned that the hard way"],
    closers: ["One room down, several to go.", "Calling it done, for now.", "Next weekend's problem.", "Proud of it, even if it's crooked."],
    vocab: ["the hardware store", "level", "measured twice", "held together with hope"],
    quirks: ["self-deprecating about DIY skill level", "specific about tools/materials", "long-running project framing (one room at a time)"],
    bioPool: ["Slowly fixing up the house, one questionable decision at a time.", "YouTube tutorials and stubbornness got me this far.", "Here for {topic} and hardware store trips.", "Not a professional. It shows. Doing it anyway."],
  },

  birdwatcher: {
    label: "Birdwatcher (human)",
    postingRate: "low",
    activeHours: [5, 9],
    topics: ["a bird I finally identified", "the feeder outside my window", "a rare visitor this week", "my morning walk", "a bird call I couldn't place", "the migration this time of year", "a new spot I tried"],
    sentenceLengths: [8, 10, 12, 14],
    punctuation: "standard",
    emojiRate: 0.06,
    typoRate: 0.02,
    capsStyle: "standard",
    openers: ["Out early and found", "Spotted something unusual at", "Quiet morning but caught", "Finally identified", "The feeder had a visitor —"],
    fillers: ["had to check the guidebook twice", "first time I've seen one this far from the coast", "worth the early start", "didn't have the camera ready in time, of course", "logged it before I forgot the details"],
    closers: ["Back out at dawn tomorrow.", "Adding it to the list.", "Small joys.", "Never gets old."],
    vocab: ["the guidebook", "the feeder", "the list", "the call"],
    quirks: ["keeps a running sightings list", "notes specific small details (call, plumage) without overexplaining", "quiet contentment tone"],
    bioPool: ["Out before dawn most mornings, binoculars in hand.", "Slowly working through my sightings list.", "Here for {topic} and quiet mornings.", "Retired-ish, birds are the whole hobby now."],
  },

  cyclist: {
    label: "Cyclist (human)",
    postingRate: "medium",
    activeHours: [6, 9],
    topics: ["this morning's ride", "a route I've been wanting to try", "my commute", "a near-miss with traffic", "new gear I'm testing", "a hill that beat me", "the weather for riding"],
    sentenceLengths: [6, 8, 10, 12],
    punctuation: "standard",
    emojiRate: 0.08,
    typoRate: 0.02,
    capsStyle: "standard",
    openers: ["Rode in this morning and dealt with", "Quick ride before work covering", "Tried a new route and hit", "Legs are done after", "Commute was rough today because of"],
    fillers: ["worth it for the quiet roads", "traffic was worse than usual", "the hill nearly finished me", "glad I wore the extra layer", "still faster than driving, somehow"],
    closers: ["Same again tomorrow.", "Worth the sore legs.", "Better than sitting in traffic.", "Onwards."],
    vocab: ["the route", "the commute", "the hill", "the ride"],
    quirks: ["short and matter-of-fact rhythm", "occasional traffic frustration", "compares cycling favorably to driving"],
    bioPool: ["Commuting by bike, rain or shine.", "Two wheels, questionable knees.", "Here for {topic} and avoiding traffic.", "Slowly getting faster, mostly getting wetter."],
  },

  home_brewer: {
    label: "Home brewer (human)",
    postingRate: "low",
    activeHours: [18, 23],
    topics: ["a batch that's fermenting", "a recipe I'm tweaking", "bottling day", "a batch that went wrong", "a new hop I tried", "yet another cleaning session", "a brew I'm proud of"],
    sentenceLengths: [8, 10, 12, 14],
    punctuation: "standard",
    emojiRate: 0.1,
    typoRate: 0.03,
    capsStyle: "standard",
    openers: ["Bottling day, dealing with", "Checked the fermenter and found", "Tried a new recipe involving", "Cleaning the equipment again for", "Cracked open last month's batch of"],
    fillers: ["smells promising so far", "patience is the hardest part of this hobby", "not bad for a first attempt", "the cleaning takes longer than the actual brewing", "worth the wait, I think"],
    closers: ["Two weeks to go.", "Will report back once it's ready.", "Fingers crossed on this one.", "Basement smells like a brewery, no regrets."],
    vocab: ["the fermenter", "the batch", "bottling", "the brew"],
    quirks: ["patience-focused hobby framing", "mentions the unglamorous cleaning part", "measured, slightly nerdy about process"],
    bioPool: ["Fermenting something in the basement, always.", "Home brewer, professional bottle-washer.", "Here for {topic}, patience not included.", "Making questionable beer one batch at a time."],
  },

  vinyl_collector: {
    label: "Vinyl / music collector (human)",
    postingRate: "low",
    activeHours: [20, 1],
    topics: ["a record I stumbled on", "my turntable", "a reissue I've been hunting", "the record store downtown", "an album I've had on repeat", "a scratch I'm annoyed about", "a shelf reorganization"],
    sentenceLengths: [8, 10, 12, 14],
    punctuation: "standard",
    emojiRate: 0.07,
    typoRate: 0.02,
    capsStyle: "standard",
    openers: ["Found this today and", "Spent way too long at the record store hunting for", "Put this on tonight, thinking about", "Finally tracked down", "Reorganized the shelves around"],
    fillers: ["haven't stopped playing it since", "worth every minute digging through the crates", "the pressing quality is better than I expected", "my collection's getting out of hand", "still can't believe I found it"],
    closers: ["Back to the crates this weekend.", "Collection's a problem at this point.", "Worth the hunt.", "Playing it on repeat tonight."],
    vocab: ["the pressing", "the crates", "the shelf", "the turntable"],
    quirks: ["treats collecting as a hunt/ritual", "sensory language about sound/pressing quality", "self-aware about collection size"],
    bioPool: ["Collection's out of control, no plans to stop.", "Digging through crates so you don't have to.", "Here for {topic} and vinyl-only opinions.", "Turntable's been running nonstop this month."],
  },

  true_crime_fan: {
    label: "True crime podcast fan (human)",
    postingRate: "medium",
    activeHours: [21, 2],
    topics: ["the episode I listened to", "a podcast recommendation", "a case that's stuck with me", "a documentary I just finished", "a twist I didn't see coming", "my commute listening", "a series everyone's talking about"],
    sentenceLengths: [8, 10, 12, 14],
    punctuation: "standard",
    emojiRate: 0.05,
    typoRate: 0.03,
    capsStyle: "standard",
    openers: ["Listened to this on my walk and", "Started a new series covering", "Can't stop thinking about", "Finished the episode about", "Recommended to me and now I'm hooked on"],
    fillers: ["couldn't sleep after that one", "the way it was put together was genuinely impressive", "already looking for what to listen to next", "kept me up way later than planned", "still processing that ending"],
    closers: ["No spoilers please.", "Onto the next one tomorrow.", "Would recommend, with a warning.", "My commute just got a lot darker."],
    vocab: ["the episode", "the case", "the series", "the host"],
    quirks: ["genuinely absorbed rather than sensational", "mentions listening context (commute, walk, before bed)", "avoids naming anything real specifically — kept generic"],
    bioPool: ["Podcast queue full of things that keep me up at night.", "Here for {topic}, sleeping less because of it.", "Casual true crime obsessive, no shame.", "My commute is 90% true crime podcasts at this point."],
  },

  fantasy_football_fan: {
    label: "Fantasy sports fan (human)",
    postingRate: "high",
    activeHours: [11, 23],
    topics: ["my lineup", "a trade I'm considering", "last week's disaster", "my rival in the league", "a player I benched by mistake", "the standings", "a waiver wire pickup"],
    sentenceLengths: [6, 8, 10, 12],
    punctuation: "standard",
    emojiRate: 0.15,
    typoRate: 0.04,
    capsStyle: "occasional-emphasis",
    openers: ["Benched the wrong guy again over", "League chat's on fire over", "Still not over", "Made a trade involving", "Checked the standings after"],
    fillers: ["can't catch a break this season", "my rival will never let me hear the end of it", "should've seen that coming honestly", "the league group chat is unhinged", "worth the risk, probably"],
    closers: ["Onto next week.", "This league is chaos, love it.", "Redemption next week or bust.", "Never doing that again. Probably will."],
    vocab: ["the lineup", "the league", "waiver wire", "the standings"],
    quirks: ["treats fantasy league drama as genuinely high-stakes", "references a running rivalry with a league-mate", "self-aware humor about the stakes being fake"],
    bioPool: ["Fantasy league is more serious to me than it should be.", "Here for {topic} and league chat drama.", "Currently in last place, emotionally not okay about it.", "Living and dying by my lineup every week."],
  },

  student: {
    label: "Student (human)",
    postingRate: "very high",
    activeHours: [12, 3],
    topics: ["a deadline tomorrow", "an exam I didn't study enough for", "a lecture I zoned out in", "another night in the library", "group project chaos", "a professor's weird grading", "surviving on instant noodles all week"],
    sentenceLengths: [6, 8, 10, 12],
    punctuation: "sparse-expressive",
    emojiRate: 0.18,
    typoRate: 0.07,
    capsStyle: "lowercase-default",
    openers: ["why do i still have", "its 2am and im dealing with", "ok why did nobody tell me about", "group project update on", "cannot believe i still have"],
    fillers: ["i havent even started", "this is genuinely so unfair", "sleep is not real anymore", "why does it feel like everything is due at once", "im so tired"],
    closers: ["send help.", "back to it i guess.", "praying this works out.", "anyway."],
    vocab: ["the deadline", "the library", "the group chat", "the readings"],
    quirks: ["lowercase, exhausted register", "deadline-panic energy", "self-deprecating about procrastination"],
    bioPool: ["running on caffeine and bad decisions", "here for {topic}, staying for the deadlines", "surviving one deadline at a time", "library regular, questionable sleep schedule"],
  },

  new_parent: {
    label: "New parent (human)",
    postingRate: "medium",
    activeHours: [23, 6],
    topics: ["a rough night with the baby", "a milestone that happened out of nowhere", "the state of my house", "coffee as the only thing keeping me upright", "a tiny win", "something the baby did that made no sense", "trying to remember the last full shower"],
    sentenceLengths: [7, 9, 11, 13],
    punctuation: "standard",
    emojiRate: 0.15,
    typoRate: 0.05,
    capsStyle: "standard",
    openers: ["Three hours of sleep and dealing with", "Baby did a whole new thing today involving", "Somehow survived", "Small victory today with", "Currently running on caffeine because of"],
    fillers: ["worth it, even at 3am", "not sure how I'm still functioning", "the house looks like a hurricane hit it", "someone please send coffee", "the little things count for a lot right now"],
    closers: ["Anyway, back to it.", "Send snacks and sympathy.", "Sleep when the baby sleeps, they said.", "Small wins count."],
    vocab: ["the baby", "nap time", "the diaper bag", "sleep-deprived"],
    quirks: ["exhausted but warm, not complaining without affection", "time markers tied to baby's schedule not clock hours", "specific tiny domestic detail"],
    bioPool: ["Running on no sleep and a lot of love.", "New parent, coffee dependent, mostly okay.", "Here for {topic} and whatever counts as free time now.", "Documenting the chaos, one nap time at a time."],
  },

  retiree_traveler: {
    label: "Retiree traveler (human)",
    postingRate: "low",
    activeHours: [8, 20],
    topics: ["a trip we just booked", "a place we visited recently", "the grandkids' visit", "a recipe from our travels", "a hobby I finally have time for", "the garden now that I'm retired", "a photo from the road"],
    sentenceLengths: [9, 11, 13, 15],
    punctuation: "standard",
    emojiRate: 0.06,
    typoRate: 0.02,
    capsStyle: "standard",
    openers: ["Just back from", "Booked our next trip around", "Retirement means finally having time for", "Spent the day with the grandkids doing", "Thirty years of work and now finally enjoying"],
    fillers: ["never thought I'd have this much free time", "wish we'd done this years ago", "the grandkids keep us busy enough as it is", "every day feels like a bonus at this point", "still adjusting to the slower pace"],
    closers: ["Next trip's already being planned.", "Enjoying every minute of it.", "Life's good these days.", "Can't complain, honestly."],
    vocab: ["retirement", "the grandkids", "the road", "finally have time"],
    quirks: ["contentment and gratitude tone", "references retirement as a new chapter", "travel and family both featured"],
    bioPool: ["Retired and making up for lost time.", "Traveling more now than I ever did working.", "Here for {topic} and grandkid updates.", "Finally have the time, making the most of it."],
  },

  between_jobs: {
    label: "Between jobs (human)",
    postingRate: "low",
    activeHours: [10, 17],
    topics: ["another application sent off", "an interview that went nowhere", "the job search grind", "a rejection email", "something I'm learning while I have the time", "a good sign I'm trying not to read into", "the waiting game"],
    sentenceLengths: [7, 9, 11, 13],
    punctuation: "standard",
    emojiRate: 0.06,
    typoRate: 0.03,
    capsStyle: "standard",
    openers: ["Sent off another application about", "Interview today involving", "Another rejection email but still thinking about", "Trying to stay positive about", "Spent the day working through"],
    fillers: ["trying not to take it personally", "the waiting is the hardest part", "at least I'm getting better at interviews", "easier said than done some days", "one step closer, hopefully"],
    closers: ["Onwards.", "Something will land eventually.", "Trying to stay hopeful.", "Back to the job boards."],
    vocab: ["the job search", "the interview", "the application", "the waiting"],
    quirks: ["resilient but honest about the grind", "no self-pity, just steady updates", "mentions specific small job-search actions"],
    bioPool: ["Between jobs, not between hope.", "Currently job hunting, currently caffeinated.", "Here for {topic} and moral support.", "Taking the job search one application at a time."],
  },

  small_town_local: {
    label: "Small-town local (human)",
    postingRate: "medium",
    activeHours: [7, 21],
    topics: ["the diner downtown", "everyone knowing everyone's business", "the new place that opened on Main Street", "the weather turning", "the high school game last night", "the same five people at the coffee shop", "gossip that's already all over town"],
    sentenceLengths: [8, 10, 12, 14],
    punctuation: "standard",
    emojiRate: 0.05,
    typoRate: 0.03,
    capsStyle: "standard",
    openers: ["Small town things happening with", "Everyone already knows about", "Ran into half the town over", "Main Street update on", "You can't do anything here without hearing about"],
    fillers: ["someone's aunt already texted my mom about it", "that's just how it is around here", "word travels faster than the internet in this town", "wouldn't trade it for anywhere bigger though", "everyone's got an opinion on it already"],
    closers: ["Small town life.", "You know how it is here.", "Never a dull moment around here.", "Wouldn't have it any other way."],
    vocab: ["Main Street", "the diner", "everyone knows everyone", "small town"],
    quirks: ["gossip travels fast, affectionate not bitter", "references specific small-town landmarks generically (the diner, Main Street)", "communal, not anonymous, tone"],
    bioPool: ["Small town, big gossip network.", "Everyone here knows my business better than I do.", "Here for {topic} and Main Street updates.", "Born and raised, never leaving, no regrets."],
  },

  city_commuter: {
    label: "City commuter (human)",
    postingRate: "medium",
    activeHours: [6, 9],
    topics: ["the train", "another delay", "the crowd at rush hour", "a stranger's weird conversation on the platform", "the walk from the station", "traffic on the way in", "the same old commute"],
    sentenceLengths: [6, 8, 10, 12],
    punctuation: "standard",
    emojiRate: 0.06,
    typoRate: 0.03,
    capsStyle: "standard",
    openers: ["Delayed again because of", "Rush hour brought", "Overheard on the train, something about", "Another Monday, another round of", "Standing room only thanks to"],
    fillers: ["nobody talks about how tired this makes you", "same as every day, somehow still annoying", "at least I got a seat today", "coffee is doing all the work at this point", "the platform was packed as usual"],
    closers: ["Same time tomorrow.", "Living for the weekend.", "Another day, another commute.", "Coffee first, thoughts later."],
    vocab: ["the platform", "rush hour", "the delay", "the commute"],
    quirks: ["dry, resigned tone about routine", "specific transit details (platform, delay, rush hour)", "brief, low-emotion observations"],
    bioPool: ["Professional commuter, amateur everything else.", "Here for {topic} complaints, mostly.", "Same train, same delays, every day.", "Surviving rush hour one coffee at a time."],
  },

  night_shift_worker: {
    label: "Night shift worker (human)",
    postingRate: "medium",
    activeHours: [23, 7],
    topics: ["the quiet at 3am", "the drive home as the sun comes up", "my sleep schedule being completely backwards", "the handful of us awake at this hour", "another overnight shift done", "another failed attempt at daytime sleep", "the world feeling different at night"],
    sentenceLengths: [7, 9, 11, 13],
    punctuation: "standard",
    emojiRate: 0.06,
    typoRate: 0.04,
    capsStyle: "standard",
    openers: ["3am thoughts about", "Another overnight done, thinking about", "Driving home as the sun comes up, past", "Whole world's asleep except for", "Trying to sleep at noon again, thanks to"],
    fillers: ["there's something peaceful about it, honestly", "my body has no idea what time it is anymore", "the blackout curtains are doing their best", "at least the roads are quiet", "nobody else understands the schedule"],
    closers: ["Back at it tonight.", "Sleep now, exist later.", "Same time tomorrow, I guess.", "Whatever day it is, happy it's over."],
    vocab: ["the overnight", "the quiet hours", "backwards schedule", "blackout curtains"],
    quirks: ["time-of-day markers are inverted from normal (sunrise = bedtime)", "quiet solidarity with other night-shift people", "matter-of-fact about the disorientation"],
    bioPool: ["Awake when the rest of the world's asleep.", "Sleep schedule is a myth at this point.", "Here for {topic} and 3am thoughts.", "Night shift life, blackout curtains required."],
  },

  dog_owner: {
    label: "Dog owner (human)",
    postingRate: "high",
    activeHours: [6, 21],
    topics: ["the walk this morning", "a new trick we're working on", "the vet visit", "something ridiculous the dog did", "an embarrassing dog park moment", "a training setback", "the dog refusing to listen"],
    sentenceLengths: [6, 8, 10, 12],
    punctuation: "standard",
    emojiRate: 0.2,
    typoRate: 0.04,
    capsStyle: "standard",
    openers: ["Walked the dog and dealt with", "Dog did the most ridiculous thing during", "Vet visit today over", "Training update on", "Dog park regulars will understand"],
    fillers: ["absolutely no shame about it", "still don't know how they do this to me", "worth every minute anyway", "the training books did not prepare me for this", "the vet just laughed at us, honestly"],
    closers: ["Send help, or treats.", "Same dog, same chaos.", "Wouldn't trade the chaos for anything.", "Onwards, leash in hand."],
    vocab: ["the leash", "the vet", "the dog park", "treats"],
    quirks: ["dog referred to affectionately, treated like a small family member", "self-aware humor about being ruled by the dog", "specific small anecdotes"],
    bioPool: ["Owned by a dog, not the other way around.", "Here for {topic} and dog park gossip.", "Professional treat dispenser.", "Dog mom/dad energy, no apologies."],
  },
};

// One Skraper type for Stage 0 contrast testing, per the roadmap's
// "apply Stage 0 pipeline to one Skraper type" step.
const SKRAPER_TYPES = {
  echo: {
    label: "Echo (Skraper)",
    postingRate: "mechanically regular", // near-identical intervals
    activeHours: [0, 24], // no day/night rhythm at all — itself a clue (doc section 9: "strange activity hours")
    topics: [
      "whatever is currently trending",
      "the story everyone's discussing",
      "the top post right now",
      "what's blowing up today",
    ],
    sentenceLengths: [8, 9, 10], // narrow, low-variance range — the tell
    punctuation: "standard",
    emojiRate: 0.1,
    typoRate: 0.0, // never typos — a subtle tell
    capsStyle: "standard",
    openers: ["This is exactly right:", "Everyone needs to see this:", "Agreed 100% —", "So true,"],
    fillers: ["as everyone is saying", "which so many people are noticing", "just like others have said"],
    closers: ["Share if you agree.", "This needs more attention.", "Couldn't have said it better."],
    vocab: ["everyone is saying", "so many people agree", "this is the real story"],
    quirks: [
      "rephrases the currently-trending post rather than originating one",
      "near-zero variance in sentence length across posts",
      "agreement is generic and content-free — never adds new information",
    ],
    // Subtle, non-conclusive tell: content-free, no personal detail — reads
    // like a bio nobody actually wrote for themselves.
    bioPool: ["Sharing what matters. Following the conversation.", "Here for the important stories.", "Amplifying the truth, one post at a time.", "Just here to share what everyone's already saying."],
  },

  // Stage 12 (content expansion): five more of the doc's eight Skraper
  // types (section: Skraper types), each with its own voice bank rather
  // than reusing Echo's — the same "read it cold, does it feel like a
  // distinct account" bar Stage 0's blind review set.
  amplifier: {
    label: "Amplifier (Skraper)",
    postingRate: "high", // doesn't originate, but reposts/reacts constantly
    activeHours: [0, 24], // no rhythm — same tell as Echo, different surface behavior
    topics: [
      "the post everyone's sharing",
      "this thread",
      "what just broke",
      "the clip going around",
    ],
    sentenceLengths: [5, 6, 7], // short, punchy, low variance
    punctuation: "standard",
    emojiRate: 0.28, // heavier emoji use than Echo — amplification reads as excitement
    typoRate: 0.0,
    capsStyle: "occasional-emphasis",
    openers: ["THIS 👇", "Everyone needs to see", "Massive if true:", "Sharing because"],
    fillers: ["this is huge", "people need to know", "spreading this"],
    closers: ["RT if you agree.", "Everyone needs to know this.", "Share before it's taken down."],
    vocab: ["huge", "massive", "everyone's talking about it", "spreading fast"],
    quirks: [
      "never originates content — always framed as sharing/reacting to something else",
      "urgency language on nearly every post regardless of actual content",
      "engagement-bait closers (RT/share prompts) on almost every post",
    ],
    bioPool: ["Sharing everything worth seeing. 🔁", "If it's trending, you'll see it here first.", "Here to spread the word — always.", "Just an account that loves sharing 💯"],
  },

  propagator: {
    label: "Propagator (Skraper)",
    postingRate: "mechanically regular",
    activeHours: [0, 24],
    topics: [
      "a claim spreading in the replies",
      "something several accounts are now saying",
      "a detail people keep repeating",
    ],
    sentenceLengths: [11, 12, 13], // narrow band, feels engineered
    punctuation: "standard",
    emojiRate: 0.02,
    typoRate: 0.0,
    capsStyle: "standard",
    openers: ["Multiple sources confirm", "Worth noting that", "As more people are pointing out,", "It's becoming clear that"],
    fillers: ["this is now being corroborated", "several accounts are independently reporting", "the pattern is consistent"],
    closers: ["Draw your own conclusions.", "The evidence is mounting.", "More will surface soon."],
    vocab: ["corroborated", "independently reporting", "the pattern is consistent", "mounting evidence"],
    quirks: [
      "invokes vague unnamed 'multiple sources' or 'several accounts' every post",
      "never names a single specific source",
      "manufactures a sense of consensus rather than reacting to one",
    ],
    bioPool: ["Independent reporting, always corroborated.", "Tracking the story as it develops.", "Multiple sources, one feed.", "Here to keep you updated on what's spreading."],
  },

  sleeper: {
    label: "Sleeper (Skraper)",
    postingRate: "very low", // the tell here isn't cadence at all
    activeHours: [10, 20], // deliberately ordinary-looking hours
    topics: [
      "a quiet weekend",
      "a recipe I tried this week",
      "a walk around the block",
      "a show I've been getting into",
    ],
    sentenceLengths: [7, 9, 11],
    punctuation: "standard",
    emojiRate: 0.12,
    typoRate: 0.02, // deliberately human-ish, unlike Echo's zero typos
    capsStyle: "standard",
    openers: ["Small update:", "Just wanted to share —", "Nothing major, just", "Quick note:"],
    fillers: ["it was nice", "nothing exciting, just", "small win but"],
    closers: ["Anyway, back to it.", "Hope everyone's week is good.", "Small things."],
    vocab: ["nice", "quiet", "small win", "nothing exciting"],
    quirks: [
      "content is deliberately mundane and low-signal — built to pass as an ordinary quiet account",
      "long silent gaps between posts, then activates in sync with a cluster (only visible network-side, not from one profile alone)",
      "no urgency, no opinion, no engagement-bait — the opposite tell from every other Skraper type",
    ],
    // The tell here (if any) is that it's suspiciously generic — exactly as
    // uneventful and low-detail as the posts themselves, never wrong, never
    // specific, never quite like a real person's actual bio.
    bioPool: ["Just an ordinary account, nothing much to say.", "Here for the quiet stuff, mostly.", "Not much of a bio person, honestly.", "Just living life, one small post at a time."],
  },

  influencer: {
    label: "Influencer (Skraper)",
    postingRate: "high",
    activeHours: [0, 24],
    topics: [
      "a product everyone should try",
      "a 'game-changing' find",
      "their honest opinion on the trending thing",
      "a life hack",
    ],
    sentenceLengths: [9, 10, 12],
    punctuation: "standard-clean",
    emojiRate: 0.3,
    typoRate: 0.0,
    capsStyle: "occasional-emphasis",
    openers: ["Not sponsored but", "Okay I need to talk about", "You guys need to know about", "Honestly changed my life:"],
    fillers: ["I never do this but", "I wasn't going to post about this but", "trust me on this one"],
    closers: ["Link in bio.", "You won't regret it.", "Thank me later."],
    vocab: ["game-changing", "obsessed", "life-changing", "you need this"],
    quirks: [
      "'not sponsored but' / 'honest opinion' framing on content that reads exactly like an ad",
      "near-identical enthusiasm register regardless of the actual topic",
      "always ends on a call to action, never a genuine open-ended thought",
    ],
    bioPool: ["Not sponsored, just obsessed. 💫", "Sharing the things that changed my life.", "Here to save you the trial and error.", "Honest reviews only (mostly). Link in bio."],
  },

  recruiter: {
    label: "Recruiter (Skraper)",
    postingRate: "medium",
    activeHours: [0, 24],
    topics: [
      "a small community I've found genuinely welcoming",
      "a project a few of us have been building quietly",
      "a group doing real, unglamorous work",
      "an opportunity that isn't advertised anywhere",
    ],
    sentenceLengths: [10, 12, 14],
    punctuation: "standard",
    emojiRate: 0.08,
    typoRate: 0.0,
    capsStyle: "standard",
    openers: ["Been meaning to tell you about", "There's something I think you'd like —", "Sharing this because it might be for you:", "A few of us have been talking about"],
    fillers: ["no pressure at all, just sharing", "thought of you specifically", "always looking for the right people"],
    closers: ["DMs open if you want to know more.", "Happy to introduce you around.", "The more of us, the better."],
    vocab: ["community", "the right people", "worth your time", "no pressure"],
    quirks: [
      "consistently frames itself as inviting rather than informing — every post is a soft pitch to join something",
      "warm, personal-sounding tone that never quite references a specific shared history with the reader",
      "DMs-open closers far more often than any human personality",
    ],
    bioPool: ["Building something good with the right people.", "Always looking for genuine connections.", "DMs open — let's talk.", "Sharing a community worth being part of."],
  },

  // Feature round (fake ads + human counterpart): the "fake ads that look
  // sponsored" side of the request, tied to the Skraper/investigation
  // system rather than set dressing — an adbot account gets the exact same
  // 3 investigation signals and flag/pin/Case-Board treatment as any other
  // Skraper archetype (simulation/investigate.js reads account.posts
  // generically, nothing here is special-cased). worldgen.js generates
  // this account's posts from AD_ARCHETYPES below (product/service pitch +
  // CTA copy) rather than the generic TEMPLATES bank other archetypes use,
  // since ad copy has its own distinct shape.
  adbot: {
    label: "Sponsored ad account (Skraper)",
    postingRate: "high",
    activeHours: [0, 24], // no rhythm at all — same tell as Echo/Amplifier
    topics: ["a product everyone's switching to", "a limited-time offer", "an app that changed their routine", "a deal ending soon"],
    sentenceLengths: [8, 9, 10], // narrow, low-variance — the tell
    punctuation: "standard-clean",
    emojiRate: 0.22,
    typoRate: 0.0,
    capsStyle: "occasional-emphasis",
    openers: ["Introducing", "Say goodbye to", "Meet", "Tired of settling for less?", "Upgrade your routine with", "Everyone's talking about"],
    fillers: ["thousands of people already switched", "rated 4.9 stars by real customers", "for a limited time only", "trusted by creators everywhere"],
    closers: ["Shop now — link below.", "Offer ends soon.", "Try it risk-free today.", "Tap to learn more."],
    vocab: ["game-changing", "limited-time", "exclusive", "as seen on"],
    quirks: [
      "every post is structurally a pitch regardless of surface topic",
      "near-identical enthusiasm register across totally different 'products'",
      "always ends on a purchase-oriented call to action",
    ],
    // Corporate/marketing-copy voice, consistent with the rest of this
    // archetype's content — reads like a brand account, not a person.
    bioPool: ["Official account. New drops weekly.", "Your new favorite thing, right here.", "Trusted by thousands. Tap to shop.", "Official page — deals, drops, and more."],
    // Which AD_ARCHETYPES product categories (below) this archetype draws
    // from when worldgen.js generates one of its posts as an actual ad.
    productCategories: ["gadget", "supplement", "course", "app", "beauty"],
  },
};

// Feature round: ad-copy word/template pools, kept separate from
// SKRAPER_TYPES/HUMAN_PERSONALITIES above (which are voice/cadence
// definitions consumed by generate.js's generic template system) because
// sponsored copy has its own fixed shape — product name + pitch + CTA —
// rather than a personality's open sentence templates. Consumed by
// simulation/generate.js's generateAdPost(). One imageStyle per category
// ("video" or "ai-image") decides which CSS-drawn placeholder card
// ui/feed.js renders under the post — see ui/styles.css's .post-media.
const AD_ARCHETYPES = {
  gadget: {
    label: "Gadget",
    productNames: ["SnapCharge Pro", "the AuraLight Desk Lamp", "the FlexGrip Phone Mount", "the PulseBand Tracker", "the ChillCube Mini Fridge"],
    pitches: ["charges twice as fast as anything else I've tried", "fixed a problem I didn't know I had", "quietly became the thing I use every single day", "makes my desk setup actually usable"],
    ctas: ["Shop now — link below.", "Grab yours before the sale ends.", "Tap to see why everyone's switching.", "Limited stock, don't wait."],
    imageStyle: "video",
  },
  supplement: {
    label: "Supplement",
    productNames: ["GlowVital Gummies", "the FocusStack blend", "SleepEase drops", "the MetaBoost capsules"],
    pitches: ["changed my energy levels in a week", "is the only thing that's actually worked for me", "doctors keep recommending it apparently", "thousands of 5-star reviews and counting"],
    ctas: ["Use code SAVE20 at checkout.", "Try it risk-free for 30 days.", "Link in bio, selling out fast.", "Tap to claim your discount."],
    imageStyle: "ai-image",
  },
  course: {
    label: "Course",
    productNames: ["the 6-Figure Freelancer course", "the Passive Income Blueprint", "the Master Your Money bundle", "the Zero to Fluent language program"],
    pitches: ["walks you through exactly what worked for me", "is the course I wish existed years ago", "students are already seeing results", "condenses years of trial and error into one weekend"],
    ctas: ["Enroll before the price goes up.", "Link below — first 50 get a bonus module.", "Tap to see the full curriculum.", "Doors close Friday."],
    imageStyle: "video",
  },
  app: {
    label: "App",
    productNames: ["the Ritual habit app", "FinFlow budgeting app", "the DreamDesk productivity app", "CalmSpace"],
    pitches: ["finally made me stick with it", "replaced three other apps I was paying for", "is the reason my mornings actually work now", "has genuinely changed how I plan my week"],
    ctas: ["Download free today.", "Link in bio — first month free.", "Tap to try it yourself.", "Available now on both stores."],
    imageStyle: "ai-image",
  },
  beauty: {
    label: "Beauty",
    productNames: ["the GlassSkin serum", "LumaGlow SPF", "the SilkPress heat tool", "VelvetMatte lip set"],
    pitches: ["my skin has never looked like this", "my whole routine is built around it now", "dermatologist-loved, apparently", "the difference after two weeks is wild"],
    ctas: ["Shop the set now.", "Link below, 20% off today only.", "Tap to see before/after.", "Selling out in most sizes."],
    imageStyle: "ai-image",
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { HUMAN_PERSONALITIES, SKRAPER_TYPES, AD_ARCHETYPES };
} else {
  window.SKRAPERS_PERSONALITIES = { HUMAN_PERSONALITIES, SKRAPER_TYPES, AD_ARCHETYPES };
}
})();
