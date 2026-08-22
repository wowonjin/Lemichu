"""Remove near-white backgrounds from generated product photos."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SRC = Path(r"C:\Users\samsung\.cursor\projects\c-Lemichu-main\assets")
OUT = ROOT / "scripts" / "generated-products"


def cutout(src: Path, dest: Path) -> None:
    image = Image.open(src).convert("RGBA")
    arr = np.asarray(image).copy()
    rgb = arr[:, :, :3].astype(np.int16)
    brightness = rgb.mean(axis=2)
    max_delta = np.ptp(rgb, axis=2)

    full = (brightness >= 248) & (max_delta <= 18)
    fade = (brightness >= 238) & (max_delta <= 12) & ~full
    soft = (brightness >= 228) & (max_delta <= 10) & ~full & ~fade

    alpha = arr[:, :, 3]
    alpha[full] = 0
    alpha[fade] = (alpha[fade] * 0.15).astype(np.uint8)
    alpha[soft] = (alpha[soft] * 0.45).astype(np.uint8)
    arr[:, :, 3] = alpha

    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(arr, "RGBA").save(dest, "PNG")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted(SRC.glob("lp-*.png"))
    if not files:
        raise SystemExit(f"No source images found in {SRC}")

    for src in files:
        dest = OUT / src.name
        cutout(src, dest)
        print(f"cutout {src.name} -> {dest}")


if __name__ == "__main__":
    main()
