"""Turn one daytime photo into the window view outside the little house.

    python3 tools/make-window.py photo.jpg

writes into src/assets/window/:
  day.webp, rain.webp, snow.webp, night.webp  the same view in four weathers
  depth.webp                                   white = near, for the 3D shift
  sky.webp                                     where the sky is (stars go there)

A landscape photo is cropped to a phone-shaped strip around its centre.
Works best with clear layers: something near (branches), something in the
middle, and open sky far away.

Needs `pip install onnxruntime numpy pillow` and the Depth Anything V2 small
ONNX model (Apache-2.0), downloaded once to tools/depth_anything_v2_vits.onnx:
https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/v2.0.0/depth_anything_v2_vits.onnx
"""
import random
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw, ImageFilter, ImageOps

HERE = Path(__file__).parent
OUT = HERE.parent / "src" / "assets" / "window"
PHONE = 0.56  # width / height of the strip we keep


def load(photo):
    im = ImageOps.exif_transpose(Image.open(photo)).convert("RGB")
    w, h = im.size
    if w / h > PHONE:
        cw = int(h * PHONE)
        im = im.crop(((w - cw) // 2, 0, (w - cw) // 2 + cw, h))
    im.thumbnail((1080, 2340))
    return im


def depth_of(im):
    sess = ort.InferenceSession(str(HERE / "depth_anything_v2_vits.onnx"))
    x = np.asarray(im.resize((518, 518), Image.BICUBIC), dtype=np.float32) / 255
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    d = sess.run(None, {sess.get_inputs()[0].name: x})[0][0]
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)
    depth = Image.fromarray((d * 255).astype(np.uint8)).resize(im.size, Image.BICUBIC)
    # soften outlines so the 3D shift bends around them instead of tearing
    return depth.filter(ImageFilter.GaussianBlur(max(2, im.width // 90)))


def weathers(im, depth_img, outdir):
    W, H = im.size
    a = np.asarray(im).astype(np.float32) / 255
    d = np.asarray(depth_img.resize((W, H), Image.BICUBIC)).astype(np.float32) / 255

    # sky: far away, bright and bluish
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    blue = np.clip((b - r) * 4, 0, 1)
    far = np.clip((0.25 - d) * 6, 0, 1)
    sky = np.clip(far * blue * 2.2, 0, 1)
    sky = np.asarray(Image.fromarray((sky * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(W / 200))).astype(np.float32)[..., None] / 255
    lum = (0.3 * r + 0.59 * g + 0.11 * b)[..., None]
    yy = np.linspace(0, 1, H)[:, None, None]

    def save(x, name):
        Image.fromarray((np.clip(x, 0, 1) * 255).astype(np.uint8)).save(f"{outdir}/{name}.webp", quality=80, method=6)

    # rain: grey, cool, flat, a bit of haze in the distance
    x = a * 0.55 + lum * 0.45
    x = x * [0.86, 0.9, 1.0] * 0.78 + 0.04
    overcast = (0.55 + 0.1 * (1 - yy)) * np.array([0.78, 0.82, 0.88])
    x = x * (1 - sky) + overcast * sky
    x = x * (1 - far[..., None] * 0.35) + np.array([0.6, 0.64, 0.7]) * far[..., None] * 0.35
    save(x, "rain")

    # snow: soft white light, low contrast, sky like snow cloud
    x = a * 0.6 + lum * 0.4
    x = x * 0.85 + 0.15
    x = x * (1 - sky) + np.array([0.86, 0.88, 0.92]) * sky
    x = x * (1 - far[..., None] * 0.3) + 0.9 * far[..., None] * 0.3
    save(x, "snow")

    # night: deep blue, moonlit snow on the mountain, sky to night gradient
    night_sky = (np.array([0.04, 0.06, 0.16]) * (1 - yy) + np.array([0.1, 0.13, 0.3]) * yy)
    x = (a * 0.4 + lum * 0.6) ** 1.5 * [0.35, 0.42, 0.7]
    x *= 1 - np.clip(d - 0.5, 0, 1)[..., None] * 0.9  # near blossoms sit in shadow
    x += np.clip(lum - 0.75, 0, 1)[..., :1] * [0.6, 0.7, 1.0] * far[..., None]  # moonlit snow
    x = x * (1 - sky) + night_sky * sky
    img = Image.fromarray((np.clip(x, 0, 1) * 255).astype(np.uint8))
    # warm windows in the town (near-ish, low, right side): a few soft dots
    random.seed(5)
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    for _ in range(36):
        px = random.uniform(0.55, 1.0) * W; py = random.uniform(0.72, 0.93) * H
        if d[int(py), int(min(px, W - 1))] > 0.6: continue  # hidden behind blossoms
        rr = random.uniform(2, 5) * W / 1000
        gd.ellipse((px - rr, py - rr, px + rr, py + rr), fill=(255, 200, 120, 220))
    glow = glow.filter(ImageFilter.GaussianBlur(W / 600))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    img.save(f"{outdir}/night.webp", quality=80, method=6)

    # where the sky is, so stars, moon and meteors stay behind the branches
    Image.fromarray((sky[..., 0] * 255).astype(np.uint8)).resize((W // 2, H // 2)).save(f"{outdir}/sky.webp", quality=85, method=6)


def main(photo):
    im = load(photo)
    depth = depth_of(im)
    im.save(OUT / "day.webp", quality=80, method=6)
    small = depth.copy()
    small.thumbnail((540, 1170))
    small.save(OUT / "depth.webp", quality=85, method=6)
    weathers(im, depth, OUT)
    print("wrote day, rain, snow, night, depth and sky into", OUT)


if __name__ == "__main__":
    main(sys.argv[1])
