# GW Rugby Match Stories

Instagram story creator for GW Men’s Rugby, with match day, kick-off, score update, half-time, try, and full-time layouts.

Live site: https://match-stories.gwmensrugby.com

## Use

Choose a layout and opponent, enter the match details, and download a 1080 × 1920 PNG. Inputs stay in local browser storage on the current device. Kick-off always displays 0–0.

## Hosting and updates

This is a static website with no dependencies or build step. GitHub Pages serves the main branch from the repository root. Keep CNAME and .nojekyll when updating the site.

Edit app.js, index.html, style.css, or opponents.js and commit to main to publish changes. Assets are in assets/.

Avenir Next Condensed uses locally installed fonts, with condensed fallbacks on devices without it. Headline SVGs are bundled. Club graphics and logos retain their respective owners’ rights.

## Local preview

Run `python3 -m http.server 8765` in this directory, then open http://localhost:8765.

## Saving on phones

Save / share story opens the native file share sheet when supported over HTTPS. Choose Save Image or a Photos destination if your phone offers it. Open image to save is the fallback: press and hold the full-resolution PNG to see browser save options. Download PNG remains available. Browsers cannot silently write to the Photos library.

The editor uses larger mobile controls, single-column detail fields, and quick links between editing and preview. Avenir font availability does not block image creation on other devices.
