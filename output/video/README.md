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

### Spanish cut

`?lang=es` (and `--lang es` in the recorder, which adds `-es` to the file names) swaps every word on screen on the same clock, so the soundtrack still fits. The UI words are the app's own Spanish from `messages/es` (stages Nuevo → Reservado, Pega un lead, Extraer datos, Borrador IA · Danés, 2 de tus anuncios encajan…); Lars still writes in English and his reply is still Danish. The lines: "Toda venta empieza con un *hola.*", "Pega la consulta. *LeadWing rellena el resto.*", "Una respuesta en su idioma. *Tú la envías.*", "Mira cuáles de tus anuncios *encajan.*", "Agenda la visita. *Confírmala por WhatsApp.*", "Haz seguimiento *en caliente.*", "Del *hola* a [Reservado]", and the end card "El CRM para agentes inmobiliarios independientes. Gratis hasta 10 clientes. Sin tarjeta." It is Claude's translation; a native read is still pending.

```sh
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --film hello-to-reserved --lang es --blur 8 --audio output/video/hello-to-reserved.wav
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --film hello-to-reserved --lang es --format portrait --blur 8 --audio output/video/hello-to-reserved.wav
```

### Web cuts

The site plays small cuts from `public/video`, loaded only when the film is on screen (`src/components/marketing/film-player.tsx` picks the language and the shape): `leadwing-film[-es]-16x9.mp4` (1280 × 720) and `-4x5.mp4` (720 × 900), 30 fps, x264 slow/film at CRF 23 capped at 1.8 and 1.6 Mbit/s, AAC 128k, `+faststart`; the posters are the title frame at 25.2 s as WebP q80.

```sh
ffmpeg -i hello-to-reserved-es.mp4 -vf "fps=30,scale=1280:720:flags=lanczos" -c:v libx264 -preset slow -tune film -crf 23 -maxrate 1800k -bufsize 3600k -profile:v high -level 3.1 -pix_fmt yuv420p -colorspace bt709 -c:a aac -b:a 128k -movflags +faststart ../../public/video/leadwing-film-es-16x9.mp4
ffmpeg -ss 25.2 -i hello-to-reserved-es.mp4 -frames:v 1 -vf scale=1280:720:flags=lanczos /tmp/p.png && cwebp -q 80 -m 6 -sharp_yuv /tmp/p.png -o ../../public/video/leadwing-film-es-16x9.webp
```

The 4:5 cut is the same with `720:900` and `-maxrate 1600k -bufsize 3200k`.

# Film 03 · Voice note

A third 30-second film, made for the indigo brand and Sora (10 Nov 2026), about voice notes (plan 026). Straight after a viewing an agent holds the phone's + and talks; the note splits phrase by phrase into the review cards the app really shows; the agent saves; each part lands where it lives. It's in the app's dark mode with Sora headlines, an indigo glow, gradient avatars, and ends on the site's light card with the indigo wing.

- `voice-note.html` — the film, same engine and controls as films 01 and 02 (`?t=`, `?format=portrait`, `?lang=es`, `?debug`). There's no 9:16 cut.
- `voice-note-soundtrack.mjs` — its score, from film 02's instruments at 96 BPM in D: a chime when the + goes down, a soft syllable on every spoken word (the film's own word rhythm, re-run from the same seed, so each language gets its own WAV), a step up the scale for each phrase that lands, a resolve on Save, one ring per result, and the end card home on D. ≈ −15 LUFS, −1 dBTP.

| Time | Beat |
| --- | --- |
| 0–1.3 s | The tab bar rises; the + goes down under a fingertip; "● 0:00 Let go to finish". "Just talk. *Hold the + after the viewing.*" |
| 1.3–10 s | The note, word by word, with a waveform: "Lars Nielsen loved the villa in Nueva Andalucía. Second viewing Thursday at 11. Budget's now up to 1.4 million, move him to Viewing. And a new buyer, Anna Berg: two-bed in Marbella, up to 600k." The clock runs to 0:24 |
| 10–11.3 s | Let go: "Listening…", "Sorting it into your clients…"; "LeadWing sorts it *into your clients.*" |
| 11.3–15.85 s | The review: Lars Nielsen · Qualified (Viewing, Wishes, Move to Viewing, Appointment) and New client · Anna Berg (Wishes). Six phrases fly, on the beat, into the row they fill, each marked in the colour it lands in (teal for Lars, who moves to Viewing; indigo for Anna, who is New) |
| 15.85–18 s | "You check it. *Nothing's saved until you do.*" A tap on Save, "Saving…", "Saved for 2 clients." |
| 18–24.3 s | The board and the week: Lars lifts from Qualified into Viewing at €1.4M with his first viewing, the second viewing drops into Thursday 11:00, Anna lands in New. "✓ Lars updated. ✓ Viewing booked. ✓ Anna added." |
| 24.3–30 s | Into white; the wing, "Talk. *LeadWing does the typing.*", "The CRM for independent real‑estate agents." and leadwing.app |

What it shows is what the feature does: one card per person, rows only for what the agent said (a stage move only because he says "move him to Viewing"), the appointment saved as a meeting (so it's grey on the calendar, as the app draws it), the transcript under "What I heard", and nothing saved until Save. The words on screen while recording are the agent's speech, not an app screen: the app shows the red dot, the clock and "Let go to finish" while you hold the +. Spanish: `?lang=es` swaps every word on the same clock, UI from `messages/es` ("Suelta para terminar", "Ordenándolo por clientes…", "Lo que buscan", "Pasar a Visita", "Cita", "Guardado para 2 clientes.") and the note in Spain Spanish; lines "Solo habla.", "LeadWing lo ordena por clientes.", "Tú lo revisas. *Nada se guarda sin ti.*", "Lars, al día. Visita agendada. Anna, añadida.", "Habla. *LeadWing escribe por ti.*" It is Claude's translation; a native read is pending.

```sh
node output/video/voice-note-soundtrack.mjs
node output/video/voice-note-soundtrack.mjs --lang es
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --film voice-note --fps 30 --blur 4 --audio output/video/voice-note.wav
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --film voice-note --format portrait --fps 30 --blur 4 --audio output/video/voice-note.wav
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --film voice-note --lang es --fps 30 --blur 4 --audio output/video/voice-note-es.wav
PLAYWRIGHT_DIR=~/.cache/leadwing-video node output/video/record.mjs --film voice-note --lang es --format portrait --fps 30 --blur 4 --audio output/video/voice-note-es.wav
```

The masters are 30 fps (the site plays 30 fps; at 60 fps a cut takes about 15 minutes, at 30 about 8). The web cuts are made exactly like film 02's, named `voice-note[-es]-16x9.mp4` and `-4x5.mp4`, and the posters are the finished review at 15.78 s instead of a title frame.
