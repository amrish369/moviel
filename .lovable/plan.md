# Verify flow: 3 ad-supported steps

Turn the single verification page into a 3-step journey. Each step is its own screen with its own ads, bold instructions, a 10-second hold, and a button at the bottom that only unlocks after scrolling down.

## How it works for the visitor

```text
Step 1 of 3  ->  Step 2 of 3  ->  Step 3 of 3  ->  Unlocked
open sponsor     open offer       final check      back to @Cinedbot
10s hold         10s hold         10s hold         "Get File" button
scroll to end    scroll to end    scroll to end
```

On every step:
- A bold, short instruction block at the top: what to do, in plain words.
- Ads placed above, in the middle and below the content (banner, 160x300 iframe, native banner).
- A 10-second countdown that starts when the step opens.
- The "Verify & continue" button at the very bottom, disabled until both the countdown finishes and the visitor has scrolled to the bottom of the page.
- Progress indicator "Step X of 3".

Step 3, after success:
- Clear confirmation that verification is complete.
- Bold instruction: return to the bot and tap **Get File**.
- A large direct button to https://t.me/Cinedbot.
- Keeps the existing "Explore CineRadar" links and FAQ below.

## Behaviour details

- The unlock code from the link (`?t=...`) is carried across all 3 steps; nothing is lost on step change.
- The backend `verify` call is made only once, when step 3's button is pressed. Steps 1 and 2 are client-side only.
- Step position is kept in the address (`?t=...&s=2`) so a refresh does not send the visitor back to step 1, and steps cannot be skipped by editing the number.
- Missing or expired code shows the existing friendly message with a link back to the bot.

## Technical notes

- Rewrite `src/pages/Verify.tsx` as a single route rendering one of three step views from a `step` state synced to the `s` search param; no new routes.
- Small internal components: `StepShell` (progress + bold guide + ads + gated footer button), `useHold(seconds)` for the countdown, and a scroll-bottom listener (`window.scrollY + innerHeight >= body.scrollHeight - 40`).
- Ads reuse existing `AdSlot`, `AdsterraIframe`, `AdsterraBanner` with distinct `AD_SLOTS` keys per placement.
- Step 1 opens `ADSTERRA.directLink`; step 2 opens the same direct link in a new tab (only sponsor link available today) — swap in a second link later by adding it to `src/config/ads.ts`.
- `usePageMeta` title/description updated per step; the page stays indexable as one URL.
- Edge function `unlock` is unchanged.

## Note on ad policy

Requiring a sponsor visit plus a timer is what is built here. Do not word anything as "click the ad" — Adsterra and AdSense both ban forced ad clicks and can close the account.
