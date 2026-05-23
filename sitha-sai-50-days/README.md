# Sitha Sai 50 Days Challenge

A personal 50-day journey tracker — built as an installable Progressive Web App (PWA). Works offline, lives on your iPhone home screen like a real app, no App Store needed.

## What's inside

- 50-day journey with progress ring, streaks, and overview grid
- Default daily routine you asked for:
  - **Home exercise** — 45 mins
  - **Meditation** — 10 mins
  - **Bhakti Pooja** — 20 mins
  - **MSc Diabetes revision** (with topic + hours field)
  - **Gym session**
  - **Social activity**
- Add/remove your own custom tasks per day
- Daily reflection notes + mood tracker
- All data stored locally on your phone (private, no account, no server)
- Export / import your data as JSON
- Works fully offline once installed

## Files

```
sitha-sai-50-days/
├── index.html              # main app
├── app.css                 # styles
├── app.js                  # app logic
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # service worker (offline support)
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
└── README.md
```

## Run it locally (terminal)

You need any static file server. Python is easiest:

```bash
cd sitha-sai-50-days
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Deploy free with GitHub Pages

1. Push these files to a GitHub repo (instructions below).
2. On GitHub: **Settings → Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Pick the branch (e.g. `main`) and folder `/sitha-sai-50-days` (or root if you put it at root).
5. Save. Your app will be live at:
   `https://<your-username>.github.io/<repo-name>/sitha-sai-50-days/`

## Install on iPhone (no App Store needed)

1. Open the live URL in **Safari** (must be Safari, not Chrome).
2. Tap the **Share** button (square with arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name (default: "Sitha 50d") and tap **Add**.
5. The app icon appears on your home screen — tap it and it opens full-screen, just like a native app.
6. Works offline after the first open.

## Install on Android

Open in Chrome → tap menu (⋮) → **Install app** / **Add to Home Screen**.

## Versioning

Version: **v1.0.0**

To ship a new version:
1. Update `app.js` / `app.css` / `index.html` etc.
2. Bump the cache name in `sw.js` (e.g. `sitha-50d-v2`) so the service worker fetches fresh assets.
3. Update the version label in `index.html` footer.
4. Commit and push — GitHub Pages updates automatically.

## License

Personal / private use.
