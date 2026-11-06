# Talking short: render on your own computer

You need Node.js 22+ and ffmpeg (ffmpeg only for the last step).

1. Open a terminal in this folder.
2. `npm install`
3. `npm run setup`       (downloads Chromium for Playwright, one time)
4. `npm run stills`      (renders 9 half-size test frames into `stills/`; takes a minute or two)
   Look at them, or upload them to Claude to have them checked.
5. `npm run render`      (renders all 300 frames into `frames/`)
6. `npm run video`       (makes `out/short_silent.mp4`)

Options (set as environment variables):
- `WORKERS=4` renders with more browser tabs in parallel. Try the number of CPU cores divided by 2.
- `RESUME=1` skips frames that already exist, so you can stop and continue.
- `GPU=1` uses your graphics card instead of CPU WebGL, if you want it faster.
  Windows PowerShell: `$env:WORKERS=4; npm run render`   Mac/Linux: `WORKERS=4 npm run render`

Files: `web/story.js` (timing, camera, mouth, loaf), `web/main.js` (3D world), `web/baker.js` (character), `web/paint.js` (textures), `render.mjs`, `PLAN.md`, `script.txt`.
When you have a voiceover, send it with `script.txt` (or your changed text) and the timing, music and SFX get redone to match.
