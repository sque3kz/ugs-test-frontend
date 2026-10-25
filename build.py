#!/usr/bin/env python3
"""Builds the frontend-only test copy of the Universal Gym website for GitHub Pages.

Copies the public pages (homepage + trainer pages) from ../universalgym and strips
everything that talks to the backend: no login, no account menu, no API calls.
The homepage plans are baked in from PLANS below instead of loaded from the server.
Links to registration, login and the member portal show a short notice instead.

Run again after changing the real site:  python3 build.py
"""
import json
import re
import shutil
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / 'universalgym'
OUT = Path(__file__).resolve().parent / 'docs'

PAGES = ['index.html', 'zdudasova.html', 'mbarczi.html', 'rjuracka.html',
         'orotschein.html', 'ebielikova.html', 'afazekas.html']

# Copied as they are (only files the pages above use)
ASSETS = ['assets/css/home.css', 'assets/css/trainer.css',
          'assets/locales/sk.js', 'assets/locales/en.js', 'assets/locales/hu.js',
          'assets/js/i18n.js', 'assets/js/site-header.js', 'assets/js/home.js',
          'assets/js/demo-qr.js', 'assets/vendor/qrcode-generator-1.4.4.js']

# The plans shown on the homepage (from GET /api/v1/member/homepage-plans/ on 2026-10-25)
PLANS = [
    {'name': 'JEDNORAZOVÝ', 'description': 'Jednorazový vstup', 'price': '5.00',
     'duration_days': None, 'entries': 1, 'homepage_position': 1},
    {'name': 'MESAČNÁ', 'description': 'Mesačná permanentka', 'price': '50.00',
     'duration_days': 30, 'entries': None, 'homepage_position': 2},
    {'name': '10 VSTUPOV', 'description': '10 Vstupová permanentka', 'price': '45.00',
     'duration_days': None, 'entries': 10, 'homepage_position': 3},
]

BACKEND_SCRIPTS = ['assets/js/member-api.js', 'assets/js/site-account.js']
BACKEND_LINK = re.compile(r'href="(?:register|login)\.html"|href="member/[^"]*"')


def page(html):
    for script in BACKEND_SCRIPTS:
        html = re.sub(rf'\s*<script src="{re.escape(script)}[^"]*"[^>]*></script>', '', html)
    html = re.sub(r'<script src="assets/js/home-plans\.js[^"]*"', '<script src="assets/js/home-plans.js"', html)
    html = BACKEND_LINK.sub('href="#test-off" data-test-off', html)
    # Not for search engines, plus the test notice
    html = html.replace('<meta charset="utf-8" />',
                        '<meta charset="utf-8" />\n\t\t<meta name="robots" content="noindex, nofollow" />', 1)
    html = html.replace('</head>', '\t<script src="assets/js/test-mode.js" defer></script>\n\t</head>', 1)
    return html


def plans_script():
    # The real home-plans.js with the fetch replaced by the baked-in plans
    js = (SRC / 'assets/js/home-plans.js').read_text()
    js = re.sub(r'async function load\(\) \{.*?\n  \}\n', 'function load() {\n    plans = PLANS;\n    render();\n  }\n', js, flags=re.S)
    js = js.replace("  const URL = `http://${location.hostname}:8000/api/v1/member/homepage-plans/`;\n",
                    f'  const PLANS = {json.dumps([dict(p, id=i + 1, online=True) for i, p in enumerate(PLANS)], ensure_ascii=False)};\n')
    js = js.replace("button.href = loggedIn() ? `member/checkout.html?plan=${plan.id}` : 'register.html';",
                    "button.href = '#test-off';\n    button.dataset.testOff = '';")
    assert 'fetch(' not in js and ':8000' not in js, 'home-plans.js changed: update plans_script()'
    return '// TEST COPY, built by build.py: the plans are baked in, nothing is loaded from the server.\n' + js


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / 'assets/js').mkdir(parents=True)
    for path in ASSETS:
        (OUT / path).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(SRC / path, OUT / path)
    (OUT / 'assets/js/home-plans.js').write_text(plans_script())
    shutil.copy2(Path(__file__).parent / 'test-mode.js', OUT / 'assets/js/test-mode.js')
    images = set()
    for name in PAGES:
        html = page((SRC / name).read_text())
        assert ':8000' not in html and 'member-api' not in html
        images |= set(re.findall(r'src="(assets/img/[^"?]+)', html))
        (OUT / name).write_text(html)
    for path in sorted(images):
        (OUT / path).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(SRC / path, OUT / path)
    (OUT / '.nojekyll').touch()  # GitHub Pages: serve the files as they are
    print(f'{len(PAGES)} pages, {len(images)} images -> {OUT}')


main()
