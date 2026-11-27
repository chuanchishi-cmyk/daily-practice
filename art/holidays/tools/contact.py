import sys, os
from PIL import Image, ImageDraw, ImageFont
d = sys.argv[1]; out = sys.argv[2]
items = [l.split("|") for l in open(sys.argv[3], encoding="utf-8").read().strip().splitlines()]
font = ImageFont.truetype(sys.argv[4], 20) if len(sys.argv) > 4 else ImageFont.load_default()
cw, ch = 210, 250
cols = 5; rows = (len(items) + cols - 1) // cols
sheet = Image.new("RGB", (cw*cols+20, ch*rows+20), (255, 255, 255)); dr = ImageDraw.Draw(sheet)
for i, (py, jq, pl) in enumerate(items):
    x, y = 10 + (i % cols)*cw, 10 + (i//cols)*ch
    im = Image.open(os.path.join(d, py + ".webp")).convert("RGB")
    sheet.paste(im, (x + (cw-176)//2, y + 8))
    t = f"{jq}・{pl}"; w = dr.textlength(t, font=font)
    dr.text((x + (cw-w)/2, y + 196), t, fill=(60, 60, 60), font=font)
    t2 = py; w2 = dr.textlength(t2, font=font)
    dr.text((x + (cw-w2)/2, y + 220), t2, fill=(150, 150, 150), font=font)
sheet.save(out)
