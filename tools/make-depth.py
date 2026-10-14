"""Make a window photo for the home page: a resized photo plus its depth map.

    python3 tools/make-depth.py photo.jpg rain

writes src/assets/window/rain.webp and rain-depth.webp (white = near).

Needs `pip install onnxruntime numpy pillow` and the Depth Anything V2 small
ONNX model (Apache-2.0), downloaded once to tools/depth_anything_v2_vits.onnx:
https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/v2.0.0/depth_anything_v2_vits.onnx
"""
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter, ImageOps

HERE = Path(__file__).parent
OUT = HERE.parent / "src" / "assets" / "window"


def main(photo, name):
    im = ImageOps.exif_transpose(Image.open(photo)).convert("RGB")
    im.thumbnail((1080, 2340))  # plenty for a phone background

    sess = ort.InferenceSession(str(HERE / "depth_anything_v2_vits.onnx"))
    x = np.asarray(im.resize((518, 518), Image.BICUBIC), dtype=np.float32) / 255
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    d = sess.run(None, {sess.get_inputs()[0].name: x})[0][0]
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)

    depth = Image.fromarray((d * 255).astype(np.uint8)).resize(im.size, Image.BICUBIC)
    # soften outlines a touch so the 3D shift doesn't tear around them
    depth = depth.filter(ImageFilter.GaussianBlur(max(1, im.width // 300)))
    depth.thumbnail((540, 1170))  # depth can be coarser than the photo

    im.save(OUT / f"{name}.webp", quality=80, method=6)
    depth.save(OUT / f"{name}-depth.webp", quality=85, method=6)
    print(f"wrote {name}.webp and {name}-depth.webp")


if __name__ == "__main__":
    main(*sys.argv[1:3])
