"""Cut the stickers off a drawn sheet that sits on a flat background.

    python3 tools/cut-stickers.py tools/raw/sheet.jpg out-prefix

Everything that matches the background colour and touches the edge of the
picture is cleared; each piece that is left becomes its own transparent webp
(out-prefix-0.webp, -1, ...), numbered top-to-bottom, left-to-right. The
stickers' own white borders stay, so they look peeled off the sheet.
"""

import sys

import numpy as np
from PIL import Image
from scipy import ndimage

TOLERANCE = 30  # how far from the background colour still counts as background
MIN_AREA = 2500  # smaller specks are dust, not stickers


def cut(path, prefix):
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    h, w, _ = rgb.shape
    edge = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(edge, axis=0)
    distance = np.linalg.norm(rgb - bg, axis=2)

    # background = background-coloured pixels reachable from the edge
    near = distance < TOLERANCE
    labels, _ = ndimage.label(near)
    edge_labels = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    background = np.isin(labels, edge_labels[edge_labels > 0])

    # soft alpha along the cut so the paper edge isn't jagged
    alpha = np.clip((distance - TOLERANCE * 0.5) / (TOLERANCE * 0.8), 0, 1)
    alpha = np.where(background, alpha, 1.0)
    alpha = ndimage.gaussian_filter(alpha, 0.6)

    pieces, count = ndimage.label(~background)
    boxes = []
    for index, box in enumerate(ndimage.find_objects(pieces), start=1):
        if box is None or (pieces[box] == index).sum() < MIN_AREA:
            continue
        boxes.append((index, box))
    boxes.sort(key=lambda item: (item[1][0].start // 60, item[1][1].start))

    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    for n, (index, (ys, xs)) in enumerate(boxes):
        y0, y1 = max(ys.start - 4, 0), min(ys.stop + 4, h)
        x0, x1 = max(xs.start - 4, 0), min(xs.stop + 4, w)
        piece = rgba[y0:y1, x0:x1].copy()
        # keep this piece (and its soft edge) only, not a neighbour poking in
        own = ndimage.binary_dilation(pieces[y0:y1, x0:x1] == index, iterations=3)
        piece[..., 3] = np.where(own, piece[..., 3], 0)
        out = f"{prefix}-{n}.webp"
        Image.fromarray(piece).save(out, "WEBP", quality=88, method=6)
        print(out, piece.shape[1], "x", piece.shape[0])


if __name__ == "__main__":
    cut(sys.argv[1], sys.argv[2])
