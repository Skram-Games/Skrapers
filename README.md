<p align="center">
  <img src="brand/icons/icon-master-1024.png" width="120" alt="SKRAPERS — A// mark" />
</p>

<h1 align="center">SKRAPERS</h1>
<p align="center"><strong>A browser-based detective game about telling real people from AI-generated accounts.</strong></p>

---

You're a new recruit for M.A.I. — Malicious Artificial Influencers,
Investigation Unit — undercover inside ALGO//, a simulated social
network. Some of the accounts in your feed are real people. Some are
"Skrapers": AI-generated accounts built to look human, spread influence,
and blend in. Nobody tells you which is which. You work it out from
behavior — posting rhythm, activity hours, linguistic consistency, who
follows and tags whom, whether someone's answers hold up under
questioning — and act on your judgment, knowing you can be wrong in
either direction, and that being wrong carelessly enough costs you the
case.

**[Read the full game manual →](dist/README.md)** — mechanics, every
system, and honest notes on what's still missing.
**[Android packaging notes →](ANDROID.md)**
**[Changelog →](CHANGELOG.md)**

## Play it

Open [`dist/skrapers.html`](dist/skrapers.html) in any modern browser.
That's it — no server, no build step, no install. Progress autosaves to
your browser's local storage.

## Repository layout

This game ships to three places from one shared source — a plain
browser page, a Capacitor-packaged Android app, and Claude's Artifacts
preview — so the source exists in parallel copies rather than behind a
bundler. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full layout
and what has to stay in sync when you change something.

```
data/ simulation/ game/ ui/   Canonical source
index.html                    Dev entry point (plain browser)
www/                          Mirror — Capacitor Android web root
artifact/                     Mirror — Claude Artifacts preview
dist/                         Single-file standalone build (what players download)
brand/                        Logo source + generated icon/social assets
```

## Brand assets

The mark is **A//** — a geometric black "A" with two blue forward
slashes, echoing the in-game ALGO// wordmark — on a white tile. Vector
source and every generated size (favicons, PWA icons, Android adaptive
icon layers, App/Play Store icons, an Open Graph social banner) are in
[`brand/`](brand/); see [`brand/README.md`](brand/README.md) for the
full asset manifest and where each file is already wired in.

## License

© Skram-Games. All rights reserved — see [`LICENSE`](LICENSE). This
repository is public for portfolio/demonstration purposes only; no
reproduction, redistribution, or reuse of the code, design, or assets is
permitted without written permission.
