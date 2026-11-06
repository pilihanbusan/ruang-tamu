# CLAUDE.md — Virtual showroom "ruang-tamu"

Read this before changing anything in this repo. It explains how the project is laid out and how to change it safely.

## What this is

A first-person virtual exhibition: an Indonesian living room, styled like an IKEA showroom, that international buyers walk through to view local export products. It is a static site on GitHub Pages at https://pilihanbusan.github.io/ruang-tamu. There is no build step and no bundler. The only dependency is three.js r128, loaded from cdnjs as the global `THREE`, so do not use ES-module imports.

Two people maintain it, each through their own Claude account. Every change must leave the site working for buyers.

## Files

- `index.html`: the whole app, meaning the CSS, the 3D scene, the controls and the UI. The sections are marked with comments:
  - `/* ---- DATA ---- */`: section labels and UI strings in two languages (the `T` object, keys `en` and `id`).
  - `/* ---- HELPERS ---- */`: canvas textures (floor, rattan weave, teak, batik, ikat, rug, signs).
  - `/* ---- STATE ---- */`: `BOUNDS` (the room is 18 × 13 m), `EYE` (camera height of 1.6 m), `OBST` (collision circles) and `RECTS` (collision boxes for the shelving units).
  - `/* ---- SCENE ---- */ build()`: lights, room, the decorative living set, the shelving units, the brand tiles and the guided-tour `ZONES`.
  - `/* ---- CAMERA / MOVE ---- */`, `/* ---- UI ---- */` and `/* ---- LOOP ---- */`: navigation, the brand panel, the searchable catalogue, the hover tooltip and the render loop.
- `data/catalog.js`: the real PPPB catalogue (`window.CATALOG`). It holds 105 brands and 204 products from the 2025 (periods 1–3) and 2026 PDF catalogues. Each brand has `id`, `period`, `section` (`craft` or `food`), contacts, and `exportedTo`/`targetMarkets` for most 2026 brands. Each product has its name, description, specifications, FOB, MOQ, loadability and `photo`. **All content lives here, so edit this file to fix a price or a phone number.**
- `photos/catalog/<product-id>.jpg`: product photos, which the panel shows.
- `photos/catalog/thumb/<brand-id>.jpg`: 256 × 296 tiles shown on the 3D shelves (photo plus a brand name strip). If you change a brand name or its first photo, regenerate its tile with Python/PIL in the same style.

## Scene conventions

- Units are metres and the y axis points up. The room spans x −9…9 and z −7…6, with the entrance at z = +6. The ceiling is 3.2 m high.
- Brands sit on cube shelving units. Each unit is 4 × 3 cubes of 0.5 m.
  - Craft & Fashion: the island front (z ≈ 3.75, facing the entrance), then the left wall (4 units).
  - Food & Beverage: the right wall (4 units), then the island back.
  - Within each section, 2026 brands come first, then 2025 P1–P3.
  - Total capacity is 60 + 60 slots. If you add brands beyond that, add a unit to `units` in `build()`.
- Each brand tile is a plane with `userData.bid = brand.id`. That property is what makes it hoverable and clickable. `byId[id]` stores the tile, its material and the camera `view`.
- Deep links work: `…/ruang-tamu/#<brand-id>` opens the showroom straight at that brand.
- Solid objects need a collision circle in `OBST` or a box in `RECTS`. Floor meshes need `userData.floor = true` so that click-to-walk works on them.
- Keep it light for phones. Shelf tiles use 256 px thumbnails, and full photos load only inside the panel.

## Hard rules

- All UI text must be bilingual. Add every new string to both `T.en` and `T.id`. Buyers see English by default.
- Product content comes from the official PPPB catalogue. Keep the source note in the panel, which tells buyers to confirm prices and MOQ with the company.
- The repo owners approved showing the PPPB programme name and the real brands, contacts (including WhatsApp), prices, MOQ and export markets. Do not add other logos or government insignia unless the owners say so explicitly.
- Do not add analytics, trackers or external requests beyond cdnjs and Google Fonts.

## Testing before you push

Run `python3 -m http.server 8000` in the repo root and open http://localhost:8000. Check all of the following:

- The welcome screen, the zone tour (8 zones), the catalogue search and filters, a brand panel (WhatsApp, email and Instagram links) and the language toggle.
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
