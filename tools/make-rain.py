"""Make the rain view from its own picture (flowers at the glass, a rainy
city beyond), separate from the photo the other weathers share.

    python3 tools/make-rain.py picture.png

writes into src/assets/window/:
  rain.webp        the view, phone-shaped
  rain-depth.webp  white = near, for the 3D shift (flowers move more)

The picture should show clean glass: no drops, streaks or rain lines.
Those are drawn live on top, so baked-in ones would look frozen.
Uses the same Depth Anything model as make-window.py.
"""
import importlib.util
import sys
from pathlib import Path

from PIL import ImageEnhance, ImageFilter

HERE = Path(__file__).parent
spec = importlib.util.spec_from_file_location("make_window", HERE / "make-window.py")
mw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mw)


def main(picture):
    im = mw.load(picture)
    # a touch of softness and a cooler, quieter tone: it's raining out there
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    im = ImageEnhance.Color(im).enhance(0.92)
    depth = mw.depth_of(im)
    im.save(mw.OUT / "rain.webp", quality=86, method=6)
    depth.convert("L").save(mw.OUT / "rain-depth.webp", quality=80, method=6)
    print("rain view", im.size, "->", mw.OUT)


if __name__ == "__main__":
    main(sys.argv[1])
