"""process.py <src.jpg> <x0,y0,x1,y1 page fractions> <out.webp> [options]
Crop a plant from an album page, keep only the plant (drop text/seals via connected
components), map paper -> #f6f3ee, soften colours, pad to a centred square, save 176px webp."""
import argparse, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

BG = np.array([0xf6, 0xf3, 0xee], dtype=np.float32)
ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("box"); ap.add_argument("out")
ap.add_argument("--sat", type=float, default=0.75)      # keep 75% saturation (-25%)
ap.add_argument("--gamma", type=float, default=0.92)    # <1 lightens
ap.add_argument("--pad", type=float, default=0.08)
ap.add_argument("--t0", type=float, default=0.06)       # paper/ink threshold
ap.add_argument("--dil", type=int, default=3)
ap.add_argument("--td", type=float, default=9)
ap.add_argument("--lt", type=float, default=0.22)
ap.add_argument("--nowhite", dest="white", action="store_false")
ap.add_argument("--wr", type=int, default=10)
ap.add_argument("--wt", type=float, default=1.03)
ap.add_argument("--open", type=int, default=3)
ap.add_argument("--ts", type=float, default=0.045)           # px dilation that joins plant parts
ap.add_argument("--keep", type=float, default=0.15)     # keep comps >= keep*largest
ap.add_argument("--ep", nargs="*", default=[], help="erase boxes, page fractions")
ap.add_argument("--epl", nargs="*", default=[], help="light-erase boxes (only pale pixels), page fractions")
ap.add_argument("--kp", nargs="*", default=[], help="force-keep boxes, page fractions")
ap.add_argument("--nocc", action="store_true")
ap.add_argument("--size", type=int, default=176)
ap.add_argument("--preview", default=None)
a = ap.parse_args()

im = Image.open(a.src).convert("RGB"); W, H = im.size
x0, y0, x1, y1 = [float(v) for v in a.box.split(",")]
X0, Y0, X1, Y1 = int(x0*W), int(y0*H), int(x1*W), int(y1*H)
arr = np.asarray(im.crop((X0, Y0, X1, Y1))).astype(np.float32); h, w, _ = arr.shape
def pbox(s):
    ex0, ey0, ex1, ey1 = [float(v) for v in s.split(",")]
    return (max(int(ex0*W)-X0, 0), max(int(ey0*H)-Y0, 0), min(int(ex1*W)-X0, w), min(int(ey1*H)-Y0, h))

bw = max(4, int(0.03 * min(h, w)))
band = np.concatenate([arr[:bw].reshape(-1, 3), arr[-bw:].reshape(-1, 3), arr[:, :bw].reshape(-1, 3), arr[:, -bw:].reshape(-1, 3)])
bl = band.mean(1)
paper = np.median(band[(bl >= np.percentile(bl, 35)) & (bl <= np.percentile(bl, 92))], axis=0)
for e in a.ep:
    bx0, by0, bx1, by1 = pbox(e)
    if bx1 > bx0 and by1 > by0: arr[by0:by1, bx0:bx1] = paper

n = np.clip(arr / paper, 0, 1.15)
d = 1 - np.clip(n, 0, 1).min(2)
sat = (n.max(2) - n.min(2))
ink = np.clip((np.maximum(d, sat * 1.2) - a.t0) / 0.10, 0, 1)   # 0 paper .. 1 ink
white = np.clip((n.mean(2) - a.wt) / 0.04, 0, 1) * (n.min(2) > 0.97)        # gofun white, brighter than paper
for e in a.epl:
    bx0, by0, bx1, by1 = pbox(e)
    if bx1 > bx0 and by1 > by0:
        sub = ink[by0:by1, bx0:bx1]; pale = (d[by0:by1, bx0:bx1] < a.lt) & (sat[by0:by1, bx0:bx1] < 0.12)
        sub[pale] = 0
# calligraphy: dark and nearly neutral -> not plant
if a.td < 1:
    text = np.clip((d - a.td) / 0.10, 0, 1) * np.clip((a.ts - sat) / 0.02, 0, 1)
    ink = ink * (1 - text)

if not a.nocc:
    m = ink > 0.5
    if a.open > 0:   # drop thin strokes (calligraphy), regrow plant parts attached to filled cores
        yy, xx = np.mgrid[-a.open:a.open+1, -a.open:a.open+1]
        disk = (xx**2 + yy**2) <= a.open**2
        core = ndi.binary_opening(m, structure=disk)
        m = ndi.binary_propagation(core, mask=ndi.binary_dilation(m, iterations=1)) & m
        for kbox in a.kp:   # force-keep thin parts inside these boxes
            bx0, by0, bx1, by1 = pbox(kbox); m[by0:by1, bx0:bx1] |= (ink[by0:by1, bx0:bx1] > 0.5)
    md = ndi.binary_dilation(m, iterations=a.dil)
    lab, nl = ndi.label(md)
    if nl:
        sizes = ndi.sum(m, lab, index=np.arange(1, nl + 1))
        keep = np.zeros(nl + 1, bool); keep[1:] = sizes >= a.keep * sizes.max()
        for kbox in a.kp:
            bx0, by0, bx1, by1 = pbox(kbox)
            ids = np.unique(lab[by0:by1, bx0:bx1]); keep[ids[ids > 0]] = True
        km = keep[lab] & m if a.open > 0 else keep[lab]
        km = ndi.binary_dilation(km, iterations=3)
        soft = np.asarray(Image.fromarray((km * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
        ink = ink * soft
        if a.white:   # gofun only where it belongs to the kept plant
            near = ndi.binary_fill_holes(ndi.binary_dilation(km, iterations=a.wr))
            white = white * near
if a.white: ink = np.maximum(ink, white)
k = ink[..., None]
base = np.clip(n, 0, 1) ** (1 / a.gamma)
if a.white:   # render gofun as pure white so it reads against the off-white ground
    wk = white[..., None]
    base = base * (1 - wk) + (255 / BG) * wk
n = base * k + (1 - k)
g = n.mean(2, keepdims=True); n = g + (n - g) * a.sat
out = np.clip(n * BG, 0, 255).astype(np.uint8)

# tight bbox of kept ink, then centre on square canvas
ys, xs = np.where(ink > 0.15)
if len(xs):
    bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    out = out[by0:by1, bx0:bx1]
h, w, _ = out.shape
side = int(max(h, w) * (1 + 2 * a.pad))
canvas = Image.new("RGB", (side, side), tuple(int(v) for v in BG))
canvas.paste(Image.fromarray(out), ((side - w) // 2, (side - h) // 2))
final = canvas.resize((a.size, a.size), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=0.6, percent=40, threshold=2))
final.save(a.out, "WEBP", lossless=True, method=6)
if os.path.getsize(a.out) > 40_000:
    for q in (100, 98, 95, 92, 88, 82, 76, 70, 62):
        final.save(a.out, "WEBP", quality=q, method=6)
        if os.path.getsize(a.out) <= 40_000: break
if a.preview: canvas.resize((528, 528), Image.LANCZOS).save(a.preview)
print(os.path.basename(a.out), os.path.getsize(a.out), "paper", paper.round(), "src", (W, H))
