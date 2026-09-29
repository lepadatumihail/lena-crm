#!/usr/bin/env python3
"""Render the cards for one X post.

    python3 output/x/render.py output/x/<post-folder>

Reads <post-folder>/cards.src.html, inlines the Geist fonts from assets/fonts
(Chrome will not load fonts across file:// URLs), then screenshots every
<section class="card" data-name="..."> with headless Chrome at 2x:
1080x1350 CSS px -> <post-folder>/<name>.png at 2160x2700. The page shows
only card n when opened with ?n=<n>.
"""
import base64
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

folder = pathlib.Path(sys.argv[1]).resolve()
src = (folder / "cards.src.html").read_text()
names = re.findall(r'<section class="card" data-name="([^"]+)"', src)
if not names:
    sys.exit('no <section class="card" data-name="..."> found')

fonts = ""
for weight, file in [(400, "Geist-Regular.ttf"), (500, "Geist-Medium.ttf"), (700, "Geist-Bold.ttf")]:
    data = base64.b64encode((ROOT / "assets/fonts" / file).read_bytes()).decode()
    fonts += f"@font-face{{font-family:Geist;font-weight:{weight};src:url(data:font/ttf;base64,{data}) format('truetype');}}\n"

build = pathlib.Path(tempfile.mkdtemp()) / "cards.html"
build.write_text(src.replace("/*FONTS*/", fonts))

for i, name in enumerate(names, start=1):
    out = folder / f"{name}.png"
    subprocess.run(
        [
            CHROME,
            "--headless=new",
            "--hide-scrollbars",
            "--force-device-scale-factor=2",
            "--window-size=1080,1350",
            "--virtual-time-budget=4000",
            f"--screenshot={out}",
            f"file://{build}?n={i}",
        ],
        check=True,
        timeout=90,
        capture_output=True,
    )
    print(out.relative_to(ROOT))
