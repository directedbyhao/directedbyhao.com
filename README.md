# directedbyhao.com

The source for **[directedbyhao.com](https://directedbyhao.com)** — Hao Bui's film director portfolio.

It's a plain static website (HTML + CSS, no build step) hosted for free on
**GitHub Pages**. Push to the `main` branch and the live site updates
automatically within a minute or two.

---

## Files

| Path | What it is |
| ---- | ---------- |
| `index.html` | The whole site: landing, Films, Travel, Places (the map), About (with the résumé pop-up), Contact. |
| `404.html` | What GitHub shows for a missing address. |
| `assets/css/site.css` | All the styling (colors, fonts, layout). |
| `assets/js/site.js` | The motion: load-in, photo slides, the cycling frames, the map, the timeline, the header, the contact form. |
| `assets/images/` | One folder per section: `hero/`, `travel/`, `places/` (the map and a folder per pinned city), `about/` (the cut-out and `timeline/`). A photo that appears in two sections is in both folders. |
| `assets/resume/` | `hao-bui.pdf`. Replace the file to update the Résumé pop-up. |
| `assets/video/` | The Work section's films: H.264 MP4s under about 30 MB each, downloaded only when played. |
| `robots.txt` | Lets search engines index everything. |
| `CNAME` | Tells GitHub the custom domain is `directedbyhao.com`. **Do not delete or edit this.** |
| `.nojekyll` | Tells GitHub to serve the files as they are. Leave it. |
| `.github/workflows/check.yml` | Checks every change on GitHub: the HTML validates and every image, stylesheet, script and PDF path resolves. `.htmlvalidate.json` holds its rules. |
| `.editorconfig` | Editor settings so every edit uses the same indentation and line endings. |

---

## How to edit

### The easy way (in your browser)
1. Go to the file on GitHub (e.g. `index.html`).
2. Click the **pencil ✏️** icon (top right).
3. Make your change.
4. Scroll down, click **Commit changes**.
5. Wait ~1 minute — the live site updates on its own.

Look for the `EDIT ME` comments inside `index.html`; they mark the text
you'll most likely want to change.

### The full way (on your computer)
```bash
# get the code
git clone https://github.com/directedbyhao/directedbyhao.com.git
cd directedbyhao.com

# open index.html in your browser to preview (just double-click it),
# then after editing:
git add .
git commit -m "Describe what you changed"
git push
```

---

## Common tasks

**Add a project to Work** — In the `WORK` section copy a whole
`<article class="piece">`: `piece--wide` for a landscape film, `piece--tall`
for a portrait one, newest first. The pieces sit on a rail that scrolls
sideways: swipe on a trackpad or phone, or use the arrows; each piece is one
screen wide, so a new one adds one more stop. The MP4 goes in `assets/video/`
as H.264, 720p or 1080p, under about 30 MB (GitHub refuses a file over 100 MB,
and a visitor downloads the whole thing when they press play); compress it on a
computer with HandBrake or similar, the GitHub site cannot. Its poster goes in
`assets/images/work/` as a 1200px JPEG. Then the title, the client · kind ·
date line, the credits, and a short note if there is one. The players hide the
browser's download button and ignore right-click, which deters casual saving;
the file itself is still public at its address, like every file on this site.

**Add a vlog to Films** — In `index.html`, find the `FILMS` section and copy one
whole `<li>` inside `<ul class="reel-items">`. Change the YouTube ID (the part
after `watch?v=`; it appears twice), then the lines under it: the title, the
date and place, and an optional `<p class="reel-line">`. They show under the
video when it is in the middle. The carousel runs through the list in order,
so put new ones at the top — and take the oldest off the bottom: ten is the
number that keeps the carousel quick. Older videos stay one click away behind
"All videos →", and a vlog about a place can still live under that place's
pin in the `PLACES` list.

**Add a photo to Travel** — Same kind of list in the `TRAVEL` section: an
`<li>` with an `<img>` (keep the `width` and `height` — the carousel lays out
from them before the file loads), then the title and the date and place. Dated
photos run oldest to newest, so a new one goes at the bottom and the oldest
comes off the top. The file goes in `assets/images/travel/`, named for what it shows
with the city first when there is one (`kyoto-temple-terrace.jpg`), about
1200px on the long side. If the same photo also sits under a pin or on the
About timeline, put a copy in that folder too: every section's pictures live
in its own folder, and a duplicate is cheaper than a wrong path.

**Add a place to the map** — In the `PLACES` section, copy one whole
`<li class="place"> … </li>` block. Set `data-lat` and `data-lon` (decimal
degrees; south and west are negative — Boston is `42.36`, `-71.06`), the name,
and the photos or clips inside it — each is an `<li>` like the ones in Films
and Travel, with the same text lines. A pin can be a city or a whole region
(the map is the whole world, so cities an hour apart share a dot); each
item's date-and-place line names the city. Photos go in
`assets/images/places/<city>/` at about 1200px on the long side, a copy if they are
also in Travel. The pin draws
itself, and the "All places" button under the title swaps the map for a grid
of cards, one per place with its first picture and count; a pin or a card
opens everything under it full screen.

**Change the tabs** — The header bar in `index.html` has one link per section;
each points at the section's `id`.

**Change your name or the footer headline** — The name is the `<h1>` in the
hero; the footer headline is the `<h2>` in the footer. Both shrink to fit.

**Change the hero photos** — See `assets/images/README.md`. The footer reuses the
first one automatically.

**Update the résumé** — Replace `assets/resume/hao-bui.pdf` with the new file, same
name; its address is `directedbyhao.com/assets/resume/hao-bui.pdf`. The Résumé button in About opens it in a pop-up with a download link.

**The timeline under About** is its own list of photos laid out as an edit,
oldest first, with the ruler labelled by month: the `<ul class="timeline-clips">`
inside the `ABOUT` section, hidden until the script builds the track. Each
`<li>` has the same shape as a Travel item, and a photo can be in both lists
or just one; its file lives in `assets/images/about/timeline/`. Ten keeps the track
readable. A photo with no date lands at the end.

**Change the About photo** — `assets/images/about/hao.png` is a cut-out of Hao on a
transparent background (the iMessage-sticker kind: Photos → long-press the
subject → Copy, or Preview → Remove Background). It stands on the timeline
at the right of the About screen, as tall as the room between the title and
the track, so head and shoulders is the framing that works; the copy runs
right up to its edge. It is drawn as tall as the screen allows, about 760px
on a 1080p display, so export it at least 1500px tall to stay sharp on
Retina screens. Its shape is written in two places: the `width`/`height` on the
`<img>` in `index.html` and the `431 / 520` on `.about` in `assets/css/site.css`;
change both if the new cut-out has different proportions.

**Change the accent colour** — Edit `--accent` at the top of `assets/css/site.css`.

**Change the fonts** — The page fonts are named in two places that must agree:
the Google Fonts `<link>` in `index.html` and `--display`, `--font`, `--mono`
at the top of `assets/css/site.css`. The extra faces the name flickers through are
listed once, in `assets/js/site.js` (`FLICKER_FACES`).

**Remove an effect** — Open `assets/js/site.js`. Each effect is one function, started
from the short list at the bottom of the first block. Delete the line that
starts it: `revealHero` (curtain and the name's flicker), `slidePhotos`,
`buildReels` (the Films and Travel frames), `buildAtlas` (the map),
`buildTimeline` (the About timeline), `buildWorkRail` (the Work arrows and the
players' download guard; the rail still swipes without it), `openResumeOnClick` (the résumé
pop-up), `driftMapWithPointer`, `driftAboutOnScroll` (Hao sitting behind the
About text), `revealOnArrival`, `underlineCurrentSection`, `dimHeaderOnScroll`.

**Contact form** — "Send a message" opens a pop-up form. Messages are relayed
by [Formspree](https://formspree.io), so **the address they get delivered to is
changed on the Formspree account, not in this repo.** In `index.html` you can
change the kinds of work listed in the "What's it for?" dropdown, and the
`ENDPOINT` line near the bottom if the form is ever rebuilt on a new Formspree
account. The free plan allows 50 messages a month.

---

## Collaborating

Working with others? To avoid overwriting each other:

1. Always `git pull` before you start editing.
2. Make your changes, then `git commit` and `git push`.
3. For bigger changes, create a branch and open a Pull Request so someone can review before it goes live.

---

## Security

The page tells the browser exactly what it may load, in the
`Content-Security-Policy` line near the top of `index.html`: scripts only from
this site, styles and fonts from this site and Google Fonts, images from this
site and YouTube's thumbnail server, network only to Formspree, and the résumé
PDF as the only embedded document. Anything else is refused. Two consequences:

- **Adding an image, font, or script from a new website** needs that site
  added to the matching part of the policy line (`img-src`, `font-src`,
  `script-src`, …) or the browser will silently not load it. Files inside
  this repo need nothing.
- **The one-line `<script>` in `<head>` is pinned by its hash.** Editing that
  line without updating the hash disables it — the page then shows its
  no-script layout (everything visible, no motion). Leave it alone.

Photos should be exported without metadata (see `assets/images/README.md`).

Settings that keep the hosting itself safe, all in the owner's hands:

- GitHub → Settings → Pages: **Enforce HTTPS** on (it is) and the custom
  domain **verified**, so nobody can claim `directedbyhao.com` on Pages if
  this repo is ever renamed or deleted.
- GitHub → Settings → Branches: protect `main` (require a pull request, block
  force pushes). Settings → Code security: secret scanning and private
  vulnerability reporting on. Two-factor authentication on every account
  with write access.
- Formspree dashboard: reCAPTCHA on, and restrict the form to
  `directedbyhao.com`. The form already carries a hidden honeypot field.
- Domain registrar: transfer lock on, DNSSEC if offered, and a CAA record
  `0 issue "letsencrypt.org"` (GitHub Pages certificates come from Let's
  Encrypt).

## Hosting notes

- Host: **GitHub Pages**, serving the `main` branch.
- Domain: **directedbyhao.com** (DNS via Namecheap → GitHub).
- HTTPS is handled automatically by GitHub — no certificates to manage.
