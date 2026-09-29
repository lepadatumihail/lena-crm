# LeadWing Facebook artwork

- `leadwing-cover-film.png`: cover in the launch film's look (`output/video`), 3280 × 1848 (a 1640 × 924, 16:9 canvas at 2×). The line is "Know who needs a follow-up. *Know what to say.*", and it shows the real drafted-message panel for Sofia. Phones show the whole image; desktop crops it to a ~2.7:1 band, so everything that matters sits between y 158 and 766 of the canvas, and the bottom-left stays empty for the profile picture. The source is `leadwing-cover-film.html`; re-render by screenshotting `#cover` with Playwright at deviceScaleFactor 2 (fonts come from Google Fonts, and the logo paths are copied from `src/lib/brand-mark.ts`).

- `leadwing-cover-orange.png` — new cover, 2059 × 764, sculpted orange ribbons with the ivory logo and leadwing.app. Created using Imagegen; see `orange-cover-prompt.md` for the exact prompt. Keep it centered when positioning it.
- `leadwing-profile.png` — 1024 × 1024, ivory wing on charcoal, with space for a circular profile crop.
- `leadwing-cover.png` — earlier ivory cover, 1702 × 630, preserved as an alternative.

The profile and earlier ivory cover are rendered from the same outlined SVG paths used in the app. The orange cover uses that ivory cover as its brand reference. The approved logo reference is `output/logo-concepts/wing-refinements/1a-balanced.png`. The reusable SVGs are in `public/brand/`; the canonical paths are in `src/lib/brand-mark.ts`.

Regenerate the profile, earlier ivory cover and app assets from the project root using Node 24 (the orange cover is preserved):

```sh
node scripts/generate-brand-assets.ts
```

The script also regenerates the browser favicon, Apple touch icon and installed-app icons. It uses the project's installed Sharp renderer and local Geist font. Imagegen is used only for the orange cover.

Facebook recommends a profile image of at least 320 × 320 pixels; this export exceeds that size. See [Facebook's profile-picture help](https://www.facebook.com/help/163248423739693?locale=es_LA). The cover uses a 2× version of the common 851 × 315 canvas, with the key artwork kept centrally to allow for display cropping. See [the cover-size reference](https://socialmagnum.com/blog/facebook-cover-photo-size).

Files are ready to upload; nothing has been posted to Facebook.
