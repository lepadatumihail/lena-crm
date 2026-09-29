#!/usr/bin/env python3
"""Render the week-1 X thread cards.

Inlines the Geist fonts from assets/fonts into cards.src.html (Chrome will not
load fonts across file:// URLs), then screenshots each card with headless
Chrome at 2x: 1080x1350 CSS px -> 2160x2700 PNG.

    python3 output/x/2026-09-28-week-1/render.py
"""
import base64
import pathlib
import subprocess
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
NAMES = ["01-hook", "02-placements", "03-audience", "04-agent-said-no", "05-outreach"]

fonts = ""
for weight, file in [(400, "Geist-Regular.ttf"), (500, "Geist-Medium.ttf"), (700, "Geist-Bold.ttf")]:
    data = base64.b64encode((ROOT / "assets/fonts" / file).read_bytes()).decode()
    fonts += f"@font-face{{font-family:Geist;font-weight:{weight};src:url(data:font/ttf;base64,{data}) format('truetype');}}\n"

build = pathlib.Path(tempfile.mkdtemp()) / "cards.html"
build.write_text((HERE / "cards.src.html").read_text().replace("/*FONTS*/", fonts))

for i, name in enumerate(NAMES, start=1):
    out = HERE / f"{name}.png"
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
