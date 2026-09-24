# Changelog

All notable changes to SKRAPERS, by build stage. The full, detailed
stage-by-stage record (design rationale, bugs found and fixed, test
results) lives in the project's Claude Docs roadmap; this file is the
condensed version for the repo.

Dates aren't tracked per stage — this was built in one continuous,
iterative session-by-session process rather than on a calendar schedule.

## Unreleased / packaging

- Repository packaging pass: app icon and favicon set (the A// mark —
  black "A", blue forward-slashes, white tile), PWA manifest, LICENSE,
  `.gitignore`, this changelog, and repo-root documentation, in
  preparation for a public GitHub repo.
- Fixed a stale `capacitor.config.json` background color still set to the
  pre-Stage-15 dark navy palette — would have flashed dark on a native
  cold start before the (now light) UI painted.
- `LICENSE` set to an all-rights-reserved Skram-Games proprietary notice
  (public for portfolio/demonstration purposes only — no reproduction or
  reuse permitted), replacing an initial MIT placeholder.

## Stage 29 — Onboarding and approachability

A contextual, dismissible walkthrough on the player's actual first case;
a genuinely more forgiving wrongful-flag threshold on that same first
case; a reactive "what next" nudge inside case investigations; a
consolidated Case File panel; a "Simplified Mode" settings toggle that
hides the newer narrative/social-stakes systems for players who want the
original core loop; and a copy audit that removed developer-facing
language that had leaked into player-visible case text.

## Stage 28 — Eleven systems: investigation as an argument, not a guess

The biggest content stage: a limited "deep-investigate pull" economy
gating the most decisive signal on any account; a corkboard where pinned
accounts can be linked with a labeled reason; costed hints; a real
minority of innocent humans who trip the same suspicion signals a
Skraper would (red herrings); branching interrogation that can catch a
Skraper contradicting itself; a closing report that scores the player's
*reasoning*, not just whether the flag was correct; a sixth case
"shape" (Timeline) where the tell is sequence, not content; a rival
investigator (Wren Halloway) who publicly stakes her own suspicions
mid-case; and ALGO// occasionally pre-flagging its own suspects, right
or wrong, tying directly into Case 007's "investigate the platform
itself" theme.

## Stage 27 — Real stakes and atmosphere

Wrongful flags can now fail and pull a case entirely (with a real
reputation cost and a clean retry); a persistent, honestly-earned ALGO//
"focus nudge" on Home; a second, later, genuinely different onboarding
"gotcha" moment (recorded in a new Paper Trail profile panel); five
generated case "shapes" past the 7 authored cases, rotating rather than
just scaling numerically; investigator's notes on pinned accounts; a
network/mention badge surfaced directly on posts; and the promo banner
rebuilt as a genuine single-line, right-to-left scrolling ticker.

## Stage 26 — Real navigation

Replaced every hardcoded "Back" destination with a genuine navigation
history stack, and generalized Home's snapshot/restore mechanism to
every world — so Main Feed and an in-progress case can be hot-swapped
between freely without losing either side's state.

## Stage 25 — Workflow and interface polish

Removed the repost feature; relabeled the flag pair to Report Bot /
Authentic; fixed the Investigate → Pin workflow into two independent
one-click actions; post @mentions and a network signal; Case Load
restructured to one case at a time with a self-perpetuating difficulty
ladder past the 7 authored cases; a proper icon set replacing emoji UI
chrome.

## Stages 14–24 — The social-platform redesign

A full UI/UX and information-architecture rebuild: a modern light social
-media palette (keeping the ALGO// black/blue wordmark), bottom-nav
sub-screens, an endless-scroll Home feed with an organic leads system,
a comment library, a corkboard case board, a CAPTCHA library with an
escalating "you keep getting this right, are you human?" tell, a
scroll-gated Terms & Conditions "speed trap" that doubles as a tutorial,
a real Home search with filtering, click-bait player statuses, fake
ads/promoted posts, suspended-account visibility, Follow/Trust/Message
profile actions, and the human personality library grown from 6 to 34
archetypes.

## Stages 0–13 — Foundation

The core investigative loop: procedurally generated worlds of human and
"Skraper" accounts, the flag/credibility consequence system, trending
events, a curated 7-case Story mode, and a multi-dimensional reputation
model (ALGO// standing, Community Trust, and Investigation Accuracy as
three genuinely independent axes, deliberately not one linear morality
meter) — plus the first pass at Android packaging via Capacitor.
