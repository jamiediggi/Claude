# Wolfie Run

An unofficial rugby league endless runner. Wolfie auto-runs down a floodlit pitch; tap or press Space to jump (hold for a higher leap). Score is distance in metres, with a try every 100 m.

## Hosting on Cloudflare Pages

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `sh wolfie-run/build.sh` |
| Build output directory | `wolfie-run/dist` |
| Root directory | (blank) |

`build.sh` wraps `index.html` in a full HTML document and writes `dist/index.html`.
