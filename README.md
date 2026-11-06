# Pilihan BuSan — Virtual Showroom

A first-person virtual showroom for the **Product Placement Pilihan BuSan (PPPB) 2025–2026** brands: 105 brands and 204 products. Buyers walk around an Indonesian living room, hover over or tap any product, and contact the makers directly by WhatsApp, email or Instagram. It runs as a static page on GitHub Pages.

Live site: https://pilihanbusan.github.io/ruang-tamu
Link to a single brand: `https://pilihanbusan.github.io/ruang-tamu/#<brand-id>`, for example `#2026-halba`

## Folder structure

| Path | What it holds | Who edits it |
|---|---|---|
| `data/catalog.js` | All brands and products: contacts, descriptions, FOB, MOQ, loadability, export markets | The content team |
| `photos/catalog/` | Product photos (`<product-id>.jpg`) | The content team |
| `photos/catalog/thumb/` | Tiles shown on the 3D shelves (`<brand-id>.jpg`) | Regenerate when a brand changes |
| `index.html` | The 3D room, controls and UI | Only for layout or feature changes |

## Fixing data (price, phone number, description)

1. Open `data/catalog.js` on GitHub and click the pencil icon.
2. Press Ctrl+F and search for the brand name.
3. Edit the text between the quotes, then click **Commit changes**.

The live site updates about a minute after the commit.

## Replacing a product photo

Upload a new file with the same name, for example `2026-halba-1.jpg`, into `photos/catalog/`.

## Working together

- Keep commits small, one brand or one feature per commit.
- For larger changes, create a branch and open a pull request.
- Preview locally with `python3 -m http.server`, then open `http://localhost:8000`.
- See `CLAUDE.md` for the technical guide.
