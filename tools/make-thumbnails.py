#!/usr/bin/env python3
"""
Regenerates the city and development thumbnails from the full-size originals.

    pip install pillow
    python tools/make-thumbnails.py

Run it from the repo root. For every image in hyperloop-ui/src/assets/cities and /developments it writes a
same-named JPEG into cities-thumb / developments-thumb, replacing the old one. File names do not change, so
src/data/cityThumbnails.js and developmentThumbnails.js need no edits. An image with no original is left alone.

Sizes (the cards show these at 180 CSS px, so this is ~2x for sharp results on high-DPI screens and browser zoom):
    developments  360 x 360   (originals are square)
    cities        520 x 390   (centre-cropped to 4:3, as the old thumbnails were; the card crops it to a square)

Options:  --dev-size 360   --city-width 520   --quality 78
"""
import argparse
import os
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image, ImageFilter

ASSETS = Path("hyperloop-ui/src/assets")


def make_one(job):
    src, dst, size, quality = job
    with Image.open(src) as im:
        # JPEG decodes at a reduced scale when asked, which makes 4000px originals quick to process.
        im.draft("RGB", (size[0] * 2, size[1] * 2))
        im = im.convert("RGB")
        # "Cover" crop from the centre, then a high-quality downscale.
        w, h = im.size
        scale = max(size[0] / w, size[1] / h)
        nw, nh = max(size[0], round(w * scale)), max(size[1], round(h * scale))
        im = im.resize((nw, nh), Image.LANCZOS)
        left, top = (nw - size[0]) // 2, (nh - size[1]) // 2
        im = im.crop((left, top, left + size[0], top + size[1]))
        # A light sharpen puts back the crispness a downscale takes off.
        im = im.filter(ImageFilter.UnsharpMask(radius=0.6, percent=45, threshold=2))
        im.save(dst, "JPEG", quality=quality, optimize=True, progressive=True, subsampling=0 if quality >= 90 else 2)
    return os.path.getsize(dst)


def jobs_for(kind, size, quality):
    # Matched ignoring case, because Windows and macOS do (e.g. original "rideShareKiosks.jpg" for thumb "RideShareKiosks.jpg")
    originals = {p.stem.casefold(): p for p in (ASSETS / kind).iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")}
    out_dir = ASSETS / f"{kind}-thumb"
    for thumb in sorted(out_dir.glob("*.jpg")):
        if thumb.stem.casefold() in originals:
            yield (originals[thumb.stem.casefold()], thumb, size, quality)
        else:
            print(f"  skipped {kind}/{thumb.stem}: no original found, keeping its current thumbnail")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dev-size", type=int, default=360)
    ap.add_argument("--city-width", type=int, default=520)
    ap.add_argument("--quality", type=int, default=78)
    a = ap.parse_args()
    if not ASSETS.exists():
        raise SystemExit("Run this from the repo root (the folder that contains hyperloop-ui/).")
    work = list(jobs_for("developments", (a.dev_size, a.dev_size), a.quality))
    work += list(jobs_for("cities", (a.city_width, a.city_width * 3 // 4), a.quality))
    with ProcessPoolExecutor() as pool:
        sizes = list(pool.map(make_one, work, chunksize=8))
    print(f"Wrote {len(work)} thumbnails, {sum(sizes) / 1e6:.1f} MB total.")


if __name__ == "__main__":
    main()
