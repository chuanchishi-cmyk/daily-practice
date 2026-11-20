import sys, os
from PIL import Image, ImageDraw, ImageFont
d = sys.argv[1]; out = sys.argv[2]
items = [l.split("|") for l in open(sys.argv[3], encoding="utf-8").read().strip().splitlines()]
font = ImageFont.truetype(sys.argv[4], 20) if len(sys.argv) > 4 else ImageFont.load_default()
cw, ch = 210, 250
sheet = Image.new("RGB", (cw*6+20, ch*4+20), (255, 255, 255)); dr = ImageDraw.Draw(sheet)
for i, (py, jq, pl) in enumerate(items):
    x, y = 10 + (i % 6)*cw, 10 + (i//6)*ch
    im = Image.open(os.path.join(d, py + ".webp")).convert("RGB")
    sheet.paste(im, (x + (cw-176)//2, y + 8))
    t = f"{jq}・{pl}"; w = dr.textlength(t, font=font)
    dr.text((x + (cw-w)/2, y + 196), t, fill=(60, 60, 60), font=font)
    t2 = py; w2 = dr.textlength(t2, font=font)
    dr.text((x + (cw-w2)/2, y + 220), t2, fill=(150, 150, 150), font=font)
sheet.save(out)
