# LeadWing launch film

A 30-second, 60 fps launch film in three cuts: 16:9 (1920 × 1080, X/LinkedIn/website), 4:5 (1080 × 1350, feed posts and ads) and 9:16 (1080 × 1920, Reels and Stories). No video model and no animation library: the film is one HTML page driven by a single clock, recorded frame by frame with Playwright and encoded with ffmpeg. The soundtrack is synthesized in plain JavaScript from the same cue list.

- `leadwing-film.html` — the film. Open it in a browser to watch it live: space pauses, ← → step one frame (shift: one second), and the bar scrubs. `?t=12.5` opens paused on a frame; `?format=portrait` (4:5) or `?format=story` (9:16) switches the cut. The two vertical cuts share one 1080 × 1350 layout; in 9:16 it sits inside the Reels safe zone (top 230 px, bottom 340 px left for Instagram/Facebook's own overlays), and only camera moves spill into those bands. Fonts load from Google Fonts (Instrument Serif, Geist, Geist Mono, the site's own faces). Logo paths come from `src/lib/brand-mark.ts` and icons from `lucide-react`, both inlined.
- `record.mjs` — steps `window.__film.seek(t)` for every frame, captures it over CDP and pipes PNGs into ffmpeg (H.264 High, bt709, `+faststart`). `--blur 8` averages 8 subframes a frame across a 180° shutter for motion blur. `--sheet` and `--stills` write review frames with the time stamped on them.
- `soundtrack.mjs` — kick, clap, hats, bass, detuned-saw pads, FM bells, whooshes and impacts, placed on the film's cues at 120 BPM, then a Freeverb-style reverb and a soft limiter (≈ −15 LUFS, −1 dBTP). Its cue times mirror the scene timings in the HTML: retime one, retime the other.

## Story

| Time | Chapter | Beat |
| --- | --- | --- |
| 0–3 s | 01 The lead | Sofia finds the agent on Idealista, gets a reply, starts typing, then *No reply for 14d 06h 12m* |
| 3–5 s | 02 The quiet | "Most leads don't say no. They go *quiet.*" and the letters fade out one by one |
| 5–10 s | 03 The month | "While you're busy, leads go quiet." 96 leads over 30 days; 38 go quiet. "*Not anymore.*" A sweep turns them into drafted follow-ups, then the camera dives into Sofia's cell |
| 10–12.5 s | 04 The follow-up | The real Home screen → Needs attention → Sofia → AI draft in German |
| 12.5–15.5 s | | "Already written. *In their language.*" The draft cycles through eight languages, then *Open in WhatsApp*: "You read it. You tweak it. You send it." |
| 15.5–18.5 s | 05 One place | Notes, Calendar, Reminders, Drive and WhatsApp fly into Sofia's client view: "Five apps for one client." becomes "*One place.*" |
| 18.5–21.5 s | 06 The wing | *under your wing*, defined; the wing draws itself |
| 21.5–23.5 s | 07 The promise | "Know who needs a follow-up. *Know what to say.*" (the hero line) |
| 23.5–30 s | 08 LeadWing | Logo, "The CRM for independent real-estate agents.", then "Free for your first 10 clients" and the CTA |

Every claim matches the live site: follow-ups drafted in the client's language, one place per client, nothing sent without the agent, and Free for 10 clients with no card. It follows the Facebook playbook too: the word "card" only ever means a credit card, and nothing implies WhatsApp integration or automatic portal capture.

## Render

playwright-core isn't a repo dependency, so install it anywhere and point `PLAYWRIGHT_DIR` at that folder (the same pattern as `SHARP_DIR` in `output/facebook/posts`). The recorder uses the newest cached Playwright headless shell, or `CHROME_PATH`. It also needs ffmpeg with libx264 (Homebrew's build has it).

```sh
npm i --prefix ~/.cache/leadwing-video playwright-core
node output/video/soundtrack.mjs /tmp/leadwing-film.wav
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --blur 8 --audio /tmp/leadwing-film.wav
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --format portrait --blur 8 --audio /tmp/leadwing-film.wav
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --format story --blur 8 --audio /tmp/leadwing-film.wav
```

They write `leadwing-film.mp4`, `leadwing-film-4x5.mp4` and `leadwing-film-9x16.mp4` next to this file; the three can run side by side.

Without `--blur` the film renders in about a minute; `--blur 8` takes about ten. The final grain layer on the logo band is deliberate: it dithers the soft gradient so 8-bit video doesn't band it into steps.

# Film 02 · From hello to Reserved

A second 30-second film, made for the mono redesign (26 Sep 2026). It is not a recut of the first: one buyer, Lars Nielsen, goes from his first message to a reserved villa, one stage at a time. The film is black and white, in the app's dark mode, and colour arrives only with a stage (New blue, Viewing violet, Reserved green), the way it does in the app. The last stage's pill flies out of Lars's row into the title line, then opens up white into the site's light end card.

- `hello-to-reserved.html` — the film, same engine and controls as film 01 (`?t=`, `?format=portrait|story`, `?debug`).
- `hello-to-reserved-soundtrack.mjs` — its score: felt piano, plucked strings, pads and a soft kit at 96 BPM, D major. Each stage rings a bell one step higher (D, E, F#, A) and Reserved resolves home on D. ≈ −15.7 LUFS, −1 dBTP. The typing ticks use the film's own rhythm, so they land on the letters.

| Time | Chapter | Beat |
| --- | --- | --- |
| 0–2.5 s | Hello | Lars's enquiry arrives: "Every sale starts with a *hello.*" |
| 2.5–7.5 s | New | The message flies into Paste a lead; AI fills name, language, villa, area, budget; Save buyer; the row lands with a blue New pill on 5.625 s |
| 7.5–12.5 s | Contacted | A first reply types itself in Danish; Open in WhatsApp; "A reply in their language. *You send it.*" |
| 12.5–16.25 s | Qualified | Criteria, two matching listings: "See which of your listings *fit.*" |
| 16.25–20 s | Viewing | The viewing drops into Saturday 12:00; the confirmation opens in WhatsApp: "Book the viewing. *Confirm it on WhatsApp.*" |
| 20–23.75 s | Reserved | The follow-up task is ticked, an offer is accepted, the row turns green on 22.5 s |
| 23.75–26.25 s | Title | The Reserved pill flies into "From *hello* to [Reserved]" |
| 26.25–30 s | LeadWing | The pill opens white into the logo, "The CRM for independent real-estate agents.", "Free for up to 10 clients. No card required." and leadwing.app |

Claims follow the Facebook playbook: the enquiry is pasted (no automatic portal capture), WhatsApp only ever opens with the draft (no integration), reminders stay in the app, and "card" only means a credit card.

```sh
node output/video/hello-to-reserved-soundtrack.mjs output/video/hello-to-reserved.wav
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --film hello-to-reserved --blur 8 --audio output/video/hello-to-reserved.wav
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --film hello-to-reserved --format portrait --blur 8 --audio output/video/hello-to-reserved.wav
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --film hello-to-reserved --format story --blur 8 --audio output/video/hello-to-reserved.wav
```

`--film <name>` picks the HTML in this folder and names the outputs after it (`hello-to-reserved.mp4`, `-4x5.mp4`, `-9x16.mp4`); without it the recorder renders film 01 as before.
