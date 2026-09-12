# images/

Drop photos in here and they show up behind your name on the home page. With
two or more, each slides off to the left as the next comes in from the right.

## Adding a slide

1. Upload the photo to this folder (GitHub: **Add file → Upload files**).
   Name it something simple with no spaces, like `hero-1.jpg`.
2. Open `index.html` and find the block that says `HERO SLIDESHOW`.
3. Copy one of the `<img class="slide" ...>` lines and change the
   filename to yours.

That's it. Your name sits in white over the middle of the photo, which is
dimmed a little. The footer at the bottom of the home page shows the first
photo, held still.

## What works best

- **Landscape, not vertical.** The slide fills the full width of the screen,
  so a tall phone photo gets cropped to a thin strip.
- **At least 1600px wide**, or it looks soft on big monitors.
- **Keep it under ~200KB each** so the page stays fast — export as JPG at
  75 to 80% quality; higher only adds weight. The ones here are 140–190KB.
- **Export, don't copy.** A photo straight from a phone carries the GPS
  location where it was taken, and camera files carry the body's serial
  number. Exporting from Photos/Lightroom without metadata removes both; the
  photos here have had it stripped.
- **Nothing important across the middle third**, since your name runs
  through it.
- Frames from your own footage work well. Avoid ones with text already burned
  in — the page adds its own.

## Also in here

- `hao.png` — the cut-out of Hao in About; transparent background. Its
  431:520 proportions are written into `index.html` and `styles.css`; see
  the README's "Change the About photo".
- `world.png` — the map in Places: Wikimedia's public-domain Robinson world
  (centred on 10°E), recoloured and cropped above Antarctica. If you swap
  it for a taller or shorter cut of the same map, update the `width` and
  `height` on its `<img>` in `index.html` (the pins follow) and the `2.29`
  in `.atlas-canvas` in `styles.css` (width ÷ height). Public-domain base map from
  Wikimedia Commons, recoloured. Nothing to edit.
- `places/<place>/` — photos of a place that has a pin on the About map;
  they show in Travel too.
- `travel/` — photos in Travel that have no pin. Around 1200px on the long
  side; all of them are listed in `index.html`.
