# CLAUDE.md — Virtual showroom "ruang-tamu"

Read this before changing anything in this repo. It explains how the project is laid out and how to change it safely.

## What this is

A first-person virtual exhibition: an Indonesian living room, styled like an IKEA showroom, that international buyers walk through to view local export products. It is a static site on GitHub Pages at https://pilihanbusan.github.io/ruang-tamu. There is no build step and no bundler. The only dependency is three.js r128, loaded from cdnjs as the global `THREE`, so do not use ES-module imports.

Two people maintain it, each through their own Claude account. Every change must leave the site working for buyers.

## Files

- `index.html`: the whole app, meaning the CSS, the 3D scene, the controls and the UI. The sections are marked with comments:
  - `/* ---- DATA ---- */`: UI strings in two languages (the `T` object, keys `en` and `id`).
  - `/* ---- PROCEDURAL TEXTURES ---- */`: canvas textures (floor, rattan weave, teak, batik, ikat, rug, packaging, signs, markers).
  - `/* ---- STATE ---- */`: `BOUNDS` (walkable area of the room), `EYE` (camera height of 1.6 m) and `OBST` (collision circles).
  - `/* ---- SCENE ---- */ build()`: lights, materials (`wallM`, `accentM`, and so on), the room, then each prop under a `// ---- N. Name ----` comment.
  - `/* ---- CAMERA / MOVE ---- */`, `/* ---- UI ---- */` and `/* ---- LOOP ---- */`: navigation, product panel, catalogue and render loop.
- `data/products.js`: product content (`window.CATS`, `window.PRODUCTS`). Keep content out of `index.html`.
- `data/catalog.js`: the real PPPB catalog (`window.CATALOG`) — 105 brands / 204 products from the 2025 (periods 1–3) and 2026 PDF catalogs, with contacts, FOB, MOQ, loadability and (for most 2026 brands) export markets. Photos are in `photos/catalog/<product-id>.jpg`. This is the source of truth for the showroom going forward; `data/products.js` is the old 9-product demo.
- `photos/<id>.jpg`: optional product photos. If a photo is missing, the product falls back to a placeholder.

## Scene conventions

- Units are metres. The y axis points up. The back wall is at z = -5 and the entrance is at z = +4.5. The left wall is at x = -6 and the right wall at x = +6. The ceiling is 3.2 m high.
- Every product has three parts:
  1. A `THREE.Group` that is tagged with `tag(group, '<id>')`. The tag is what makes it clickable.
  2. An entry in `prodById[id]` with these fields:
     - `marker:[x,y,z]` places the numbered marker.
     - `view:[camX, camZ, targetX, targetY, targetZ]` sets where the guided tour stands and what it looks at.
     - `surface:{mat, aspect}` is optional. Set it when the photo should also appear on the 3D object.
  3. An entry with the same `id` in `data/products.js`. The order of that array sets the marker numbers and the tour order.
- Every solid object that people should not walk through needs a collision circle: add `{x, z, r}` to `OBST`.
- Floor meshes need `userData.floor = true`, because that is what makes click-to-walk work on them.
- Keep the room compatible with mobile phones:
  - Shadows are cast only by furniture.
  - Keep geometry simple. Avoid large imported models unless they are compressed `.glb` files under about 3 MB in total.

## Adding a product

1. Add the prop and its tag in `build()`, along with `prodById` and `OBST` entries.
2. Add the data entry in `data/products.js`.
3. Optionally add `photos/<id>.jpg`.
4. Check that the marker is visible and that the tour view frames the object. Remember that the info panel covers the right 410 px on desktop and the bottom ~62% of the screen on mobile.

## Hard rules

- All UI text must be bilingual. Add every new string to both `T.en` and `T.id`. Buyers see English by default.
- The disclaimer "Sample data" must stay until the product data is verified.
- Do not use logos or brand names of real companies or government institutions unless the repo owners say so explicitly.
- Do not add analytics, trackers or external requests beyond cdnjs and Google Fonts.

## Testing before you push

Run `python3 -m http.server 8000` in the repo root and open http://localhost:8000. Check all of the following:

- The welcome screen, the guided tour from 1 to 9, the catalogue and the language toggle.
- Desktop controls: drag to look, WASD and click-to-walk.
- The layout at a mobile width of about 390 px, including the joystick and the bottom-sheet panel.
- The browser console shows no errors.

If headless Chrome or Playwright is available, take screenshots at both sizes. Note that software rendering is slow, so wait 10–15 s for tour animations to finish.

## Collaboration workflow

- Always pull first, with `git pull --rebase origin main`, because the other person may have pushed.
- For small fixes, commit directly to `main` with a clear message, for example "Change accent wall to sage green".
- For larger changes (a new room, a rework of the layout, new features), use a branch and open a pull request so the other owner can review it first.
- Keep each commit focused on one thing, so it is easy to revert.
- GitHub Pages redeploys about 1 minute after a push to `main`.
