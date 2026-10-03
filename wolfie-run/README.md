# Wolfie Run

An unofficial rugby league endless runner. Wolfie auto-runs down a floodlit pitch; tap or press Space to jump (hold for a higher leap). Score is distance in metres plus bonuses.

- **Rugby balls** float mid-air: +10 each.
- **Golden Boot**: six seconds of invincibility; Wolfie smashes through obstacles and runs over the mud.
- **Fend-off**: shrugs off the next hit.
- **Set of six**: clear six hazards in a row for +60.
- **Tries**: every 100 m, +40.
- **Rain**: at 500 m the night match turns into a muddy, rain-soaked one with more waterlogged patches.
- **Sound**: short synthesised effects (no audio files, no background loops); `M` or the speaker button mutes.
- **Share score**: copies a message with the link (or opens the phone's share sheet).

## Hosting on Cloudflare Pages

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `sh wolfie-run/build.sh` |
| Build output directory | `wolfie-run/dist` |
| Root directory | (blank) |

`build.sh` wraps `index.html` in a full HTML document and writes `dist/index.html`.

## Custom domain

In the Pages project: Custom domains → Set up a custom domain → `wolfie.jamieclarke.online`.
