from pathlib import Path
from rembg import new_session, remove
from PIL import Image

SRC = Path(r"C:\Users\samsung\.cursor\projects\c-Lemichu-main\assets")
OUT = Path(r"c:\Lemichu-main\public\category-images")
SCALE = 0.72


def cut_one(src: Image.Image, session) -> Image.Image:
    try:
        cut = remove(
            src,
            session=session,
            post_process_mask=True,
            alpha_matting=True,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=8,
        )
    except Exception:
        cut = remove(src, session=session, post_process_mask=True)

    if not isinstance(cut, Image.Image):
        cut = Image.open(cut)
    cut = cut.convert("RGBA")
    bbox = cut.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    return cut


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    session = new_session("isnet-general-use")
    files = sorted([*SRC.glob("cat-*.png"), *SRC.glob("feat-*.png")])
    print(f"files={len(files)}")

    for index, path in enumerate(files, 1):
        src = Image.open(path).convert("RGBA")
        cut = cut_one(src, session)
        canvas = Image.new("RGBA", src.size, (0, 0, 0, 0))
        fitted = cut.copy()
        fitted.thumbnail(
            (int(src.size[0] * SCALE), int(src.size[1] * SCALE)),
            Image.Resampling.LANCZOS,
        )
        x = (src.size[0] - fitted.size[0]) // 2
        y = (src.size[1] - fitted.size[1]) // 2
        canvas.paste(fitted, (x, y), fitted)
        dest = OUT / f"{path.stem}-cut.png"
        canvas.save(dest, "PNG")
        print(f"[{index}/{len(files)}] {dest.name} alpha={canvas.mode} size={fitted.size}")


if __name__ == "__main__":
    main()
