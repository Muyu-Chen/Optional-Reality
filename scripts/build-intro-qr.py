#!/usr/bin/env python3
"""Create the introduction QR and print/share artwork. Requires OpenCV and Pillow."""
from pathlib import Path
from html import escape
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'site/assets/intro-20261025'
URL = 'https://optionalreality.site/intro'
INK, BLUE, BG = '#244d3b', '#477b91', '#e9f1e8'

def font(size, bold=False):
    name = 'Arial Rounded Bold.ttf' if bold else 'Arial.ttf'
    return ImageFont.truetype('/System/Library/Fonts/Supplemental/' + name, size)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    params = cv2.QRCodeEncoder_Params()
    params.correction_level = cv2.QRCodeEncoder_CORRECT_LEVEL_H
    code = cv2.QRCodeEncoder_create(params).encode(URL)
    # OpenCV supplies two quiet modules; add four more on every edge.
    code = cv2.copyMakeBorder(code, 4, 4, 4, 4, cv2.BORDER_CONSTANT, value=255)
    count = code.shape[0]
    rgb = Image.new('RGB', (count, count), 'white')
    pixels = rgb.load()
    path = []
    for y, x in zip(*np.where(code == 0)):
        pixels[int(x), int(y)] = (36, 77, 59)
        path.append(f'M{x} {y}h1v1h-1z')
    size = count * 20
    qr = rgb.resize((size, size), Image.Resampling.NEAREST)
    qr.save(OUT / 'intro-qr.png', optimize=True)
    modules = ''.join(path)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {count} {count}" role="img" aria-label="Scan to open Optional Reality introduction"><title>{escape(URL)}</title><rect width="{count}" height="{count}" fill="white"/><path d="{modules}" fill="{INK}" shape-rendering="crispEdges"/></svg>\n'
    (OUT / 'intro-qr.svg').write_text(svg)

    poster = Image.new('RGB', (1440, 1920), BG)
    d = ImageDraw.Draw(poster)
    d.rounded_rectangle((90, 90, 1350, 1830), 46, fill='#fffdf3', outline='#cfdbcb', width=3)
    d.rounded_rectangle((144, 154, 224, 234), 23, fill=INK)
    d.text((159, 165), 'or', font=font(44, True), fill='#fffdf3')
    d.text((252, 171), 'OPTIONAL REALITY', font=font(34, True), fill=INK)
    d.text((144, 310), 'Reality is', font=font(116, True), fill=INK)
    d.text((144, 440), 'optional.', font=font(116, True), fill=BLUE)
    d.text((149, 597), 'One message. A different world.', font=font(40, True), fill=INK)
    d.text((149, 668), 'Scan to watch the demo', font=font(32), fill='#587366')
    d.text((149, 713), 'and meet all 21 levels.', font=font(32), fill='#587366')
    poster.paste(qr, (270, 800))
    d.text((720, 1723), 'optionalreality.site/intro', anchor='mt', font=font(35, True), fill=INK)
    d.text((720, 1780), 'Mobile introduction  /  Desktop gameplay', anchor='mt', font=font(25), fill='#587366')
    poster.save(OUT / 'scan-card.png', optimize=True)
    poster_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1920" viewBox="0 0 1440 1920">
<title>Optional Reality — scan to open the introduction</title>
<rect width="1440" height="1920" fill="{BG}"/><rect x="90" y="90" width="1260" height="1740" rx="46" fill="#fffdf3" stroke="#cfdbcb" stroke-width="3"/>
<g font-family="Arial Rounded MT Bold,Arial,sans-serif" fill="{INK}" font-weight="700">
<rect x="144" y="154" width="80" height="80" rx="23"/><text x="157" y="215" fill="#fffdf3" font-size="48">or</text><text x="252" y="205" font-size="34">OPTIONAL REALITY</text>
<text x="144" y="420" font-size="116">Reality is</text><text x="144" y="550" fill="{BLUE}" font-size="116">optional.</text>
<text x="149" y="635" font-size="40">One message. A different world.</text></g>
<g font-family="Arial,sans-serif" fill="#587366" font-size="32"><text x="149" y="700">Scan to watch the demo</text><text x="149" y="745">and meet all 21 levels.</text></g>
<g transform="translate(270 800) scale(20)"><rect width="{count}" height="{count}" fill="white"/><path d="{modules}" fill="{INK}" shape-rendering="crispEdges"/></g>
<text x="720" y="1760" text-anchor="middle" font-family="Arial,sans-serif" fill="{INK}" font-size="35" font-weight="700">optionalreality.site/intro</text><text x="720" y="1808" text-anchor="middle" font-family="Arial,sans-serif" fill="#587366" font-size="25">Mobile introduction / Desktop gameplay</text></svg>\n'''
    (OUT / 'scan-card.svg').write_text(poster_svg)

    social = Image.new('RGB', (1200, 630), '#e4eff0')
    s = ImageDraw.Draw(social)
    s.text((70, 65), 'OPTIONAL REALITY', font=font(25, True), fill=INK)
    s.text((68, 152), 'Reality is', font=font(83, True), fill=INK)
    s.text((68, 246), 'optional.', font=font(83, True), fill=BLUE)
    s.text((73, 385), 'Scan to watch the demo.', font=font(30, True), fill=INK)
    s.text((73, 443), '21 levels. A world of possibility.', font=font(24), fill='#587366')
    s.text((73, 526), 'optionalreality.site/intro', font=font(23), fill=INK)
    social.paste(qr.resize((360, 360), Image.Resampling.NEAREST), (770, 132))
    s.text((950, 521), 'SCAN TO EXPLORE', font=font(16, True), fill=INK, anchor='mt')
    social.save(OUT / 'social-card.png', optimize=True)

    results = []
    for name in ['intro-qr.png', 'scan-card.png', 'social-card.png']:
        image = cv2.imread(str(OUT / name))
        decoded = cv2.QRCodeDetector().detectAndDecode(image)[0]
        assert decoded == URL, (name, decoded)
        results.append({'file': name, 'decoded': decoded, 'width': image.shape[1], 'height': image.shape[0]})
    for width in [180, 225, 300]:
        small = cv2.resize(cv2.imread(str(OUT / 'intro-qr.png')), (width, width), interpolation=cv2.INTER_AREA)
        assert cv2.QRCodeDetector().detectAndDecode(small)[0] == URL, width
    (OUT / 'qr-manifest.json').write_text(json.dumps({'url': URL, 'errorCorrection': 'H', 'quietZoneModules': 6, 'verified': results, 'smallSizesVerified': [180, 225, 300]}, indent=2) + '\n')
    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    main()
