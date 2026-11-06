# Indonesian Export Showcase — Virtual Living Room

A first-person virtual showroom. Buyers walk around a living room and look at Indonesian export products. It runs as a single static page, hosted on GitHub Pages.

## Folder structure

| Path | What it holds | Who edits it |
|---|---|---|
| `data/products.js` | Product names, origin, MOQ, lead time, HS code, certification, and EN/ID descriptions | The content team |
| `photos/` | Product photos, one file per product | The content team |
| `index.html` | The 3D room, controls and UI | Only for layout or feature changes |

## Updating a product photo

1. Name the photo after the product `id`, for example `coffee.jpg`.
2. Upload it into `photos/`. On GitHub, open the folder, then choose **Add file → Upload files**.
3. The live site picks up the new photo about a minute after the commit.

Product ids: `ikat`, `rattan`, `teak`, `ceramics`, `batik`, `basket`, `coffee`, `chocolate`, `spice`.

Photos of batik, ikat and the coffee, chocolate and spice packs also appear on the 3D objects. They are cropped to fit, so keep the main subject centred. Photos up to about 1,500 px on the long side load quickly.

## Updating product data

Open `data/products.js` and click the pencil icon. Edit the text between the quotes, then commit the change.

- Do not change the `id` values, because they link each entry to an object in the room.
- `den` holds the English description and `did` holds the Indonesian one.
- All current data is **sample data** and must be replaced with verified exporter details.

## Working together

- Keep commits small, one product or one feature per commit, so changes are easy to review and revert.
- For larger changes, create a branch and open a pull request.
- Preview locally with `python3 -m http.server`, then open `http://localhost:8000`.

## Turning on GitHub Pages

Go to **Settings → Pages → Build and deployment**. Set the source to `Deploy from a branch`, choose the branch `main` and the folder `/ (root)`.
