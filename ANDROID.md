# SKRAPERS — Android packaging (Stage 11)

## Honest status

This stage is **prepared but not built or run** — same "risk being knowingly
accepted, not skipped silently" standard as Stage 5's playtest gap. Here's
exactly why, so it isn't quietly assumed to work:

This development sandbox's network egress allowlist blocks
`registry.npmjs.org` outright (`curl` to it returns `403 Host not in
allowlist`), so `npm install` cannot fetch `@capacitor/core`,
`@capacitor/cli`, or `@capacitor/android` from here. Without those packages,
`npx cap add android` can't generate the native Android project, which
means there is no Gradle project in this repo to build, and no way to
produce or test an actual `.apk` from inside this session. This is an
environment limitation, not a design problem — the web app itself needs no
changes to run inside Capacitor's WebView (see below).

## What's actually ready

- **`www/`** — the entire game (`index.html`, `data/`, `simulation/`,
  `game/`, `ui/`), copied out of the repo root with its folder structure
  intact and test-only scripts (`simulation/check*.js`) stripped out. This
  is the exact same script-load order and relative-path structure that
  already works in a browser (index.html) and in the Claude artifact
  (artifact/index.html) — Capacitor's WebView is Chromium-based on Android,
  so nothing here needed rewriting for mobile.
- **`capacitor.config.json`** — `appId: com.skrapers.mai`, `appName:
  SKRAPERS`, `webDir: www`, background color matched to the doc's Deep
  Midnight Navy (`#10141D`) so there's no white flash on cold start.
- **`package.json`** — declares the three Capacitor packages as
  dependencies so `npm install` (once it can reach the registry) pulls
  everything needed in one step.

## What you'll need to run, on a machine with normal network access

```bash
cd skrapers
npm install
npx cap add android      # generates the android/ Gradle project from capacitor.config.json + www/
npx cap sync android      # copies www/ into the native project (re-run after any web change)
npx cap open android      # opens the project in Android Studio
```

From Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)** for a
debug build, or use **Generate Signed Bundle/APK** for a release build. You
will need the Android SDK installed (Android Studio installs and manages
this for you on first run).

## Addressed since the first pass (still unverified on a real device)

Code-level fixes for three of the four gaps below are now in `www/` — but
"the code accounts for this" and "confirmed on a real device" are different
claims, and only the first one is true from inside this sandbox:

- **Touch targets.** `.post-actions button` (Reply/Repost/Flag) now carries
  10px/6px padding with a matching negative margin, so the tap target grows
  without changing the visual row density — a real fix, not just a note,
  but never measured against Android's 48dp guidance on an actual screen.
- **Safe-area / status bar.** The topbar's padding now adds
  `env(safe-area-inset-top, 0px)` (via `viewport-fit=cover` in the page's
  viewport meta), so it should clear a notch/status-bar instead of running
  under it. Unverified — `env()` support and the actual inset value are
  device-reported, nothing this sandbox can produce.
- **Back button.** `ui/feed.js` now registers a `backButton` listener
  through `window.Capacitor.Plugins.App` (a no-op outside the native shell,
  so it's safe in every other context this game runs in — a browser tab,
  the Claude artifact): from the feed it exits the app, from anywhere else
  (a profile, the case board) it returns to the feed instead of falling
  through to Capacitor's default exit-app behavior. Logic only — never
  fired against real Android back-gesture input.

## App icon (ready to use)

`brand/icons/icon-master-1024.png` and the two adaptive-icon layer files
(`brand/icons/android-adaptive-foreground-1024.png` /
`-background-1024.png`) are the sources to hand `@capacitor/assets` once
`npx cap add android` has actually generated the native project (see
`brand/README.md` for the exact command). Until then, per-density PNGs
are already sitting in `brand/icons/android-mipmap-*.png` and
`android-playstore-512.png` if you need something to drop in by hand
before wiring up the asset-generation tool.

`capacitor.config.json`'s `backgroundColor` was still set to the
project's original dark navy palette from before the Stage 15 light
redesign — fixed to `#FFFFFF` so a native cold start doesn't flash dark
before the (now light) UI paints over it. Worth a real-device check once
you can build, the same way the fixes below are.

## Still genuinely open

- **Google Fonts over `https://fonts.googleapis.com`.** This sandbox's
  network policy blocks that host at the shell level, and its `WebFetch`
  tool returns markdown, not binary — so vendoring the actual `.woff2`
  files into `www/` (the right call for an installed app regardless, so it
  never depends on network access just to render text) isn't something
  this session can produce either, not just test. On a real device with
  normal internet the CSS `<link>` should simply work; if you want it
  offline-proof, download Inter + Space Grotesk's woff2 files yourself and
  swap the Google Fonts `<link>` in `www/index.html` for local `@font-face`
  rules.
