# Contributing to SKRAPERS

This is a solo Skram-Games project, currently built almost entirely
through an iterative, AI-assisted development process. It's public
mainly for transparency and portfolio purposes. That said, issues and
pull requests are genuinely welcome — bug reports especially.

## Project layout

```
data/          Static content: human & Skraper personality archetypes, hand-authored roster accounts
simulation/    Procedural generation: worlds, posts, bios, investigation signals
game/          Game logic/state: flags, reputation, trust, cases, events, persistence
ui/            Rendering: ui/feed.js (almost everything) + ui/styles.css
index.html     Dev entry point — loads every module as a separate <script> tag
www/           Mirror of the above, packaged as the Capacitor Android app's web root
artifact/      Mirror of the above, bundled for the Claude Artifacts preview
dist/          The single-file standalone build (skrapers.html) — what most players actually download
brand/         Logo source (SVG) and generated icon/social assets
```

**Important:** the game exists in three parallel copies — the repo root
(`index.html` + `data/`/`simulation/`/`game/`/`ui/`), `www/`, and
`artifact/`. This isn't an accident; it's how the game ships to three
different places (a plain browser, a packaged Android app, and Claude's
own Artifacts preview) without a bundler. **Any change to a source file
must be copied into all three locations**, and `ui/styles.css` has a
fourth copy: the inline `<style>` block inside `artifact/index.html`,
which isn't a separate file and has to be pasted in by hand.

`dist/skrapers.html` is a fourth, fully self-contained build — every
module concatenated into one file with the CSS inlined — produced by a
small Node build script (not currently checked into the repo; see
below). This is the file most players actually download and run.

## Making a change

1. Edit the canonical source under the repo root (`data/`, `simulation/`,
   `game/`, `ui/`).
2. Copy the same change into `www/` and `artifact/js/` (and, for CSS,
   into `artifact/index.html`'s inline `<style>` block).
3. Rebuild `dist/skrapers.html` from the canonical source (concatenate
   the modules listed in `index.html`'s `<script>` order, inline
   `ui/styles.css`, done — see `CHANGELOG.md`'s packaging note if you're
   setting this up as a proper npm script; it's currently a standalone
   build script rather than a repo `npm run build`, worth turning into
   one).
4. Verify all copies stay byte-identical (`diff` the source against each
   mirror) before committing.
5. Sanity-check in a real browser — there's no CI wired up yet (see
   `ANDROID.md` and the roadmap doc for the project's honest gaps list).

## Design principles worth knowing before changing gameplay code

- **No single signal is ever conclusive.** Every investigative tell —
  cadence, metadata, engagement history, interrogation — is a soft
  signal that correlates, never a certainty. A minority of real, innocent
  humans deliberately trip some of these signals ("red herrings") so
  that acting on any one signal alone stays a real risk.
- **Three independent reputation axes, not one meter.** ALGO// Standing,
  Community Trust, and Investigation Accuracy can and should move in
  different, sometimes opposite, directions. Collapsing this back into a
  single "good/bad" number is exactly the failure mode the project's
  design doc warned against early on — please don't reintroduce it.
- **Root causes, not symptom patches.** When you find a bug, look for
  what's actually wrong rather than papering over the symptom. The
  project's roadmap doc calls this out explicitly at nearly every stage.
