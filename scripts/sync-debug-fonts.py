#!/usr/bin/env python3
"""Sync temporary local typography-test assets into the portfolio project.

The source folders are read only: this script never renames, modifies, or
deletes files in Downloads. Re-run it after adding candidate .otf or .ttf
files to either source folder.
"""

from __future__ import annotations

import json
import re
import shutil
import unicodedata
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
GROUPS = (
    ("display", Path("/Users/hoanguyen/Downloads/Fonts/test font"), Path("assets/fonts/debug/display")),
    ("accent", Path("/Users/hoanguyen/Downloads/Fonts/test font/accent"), Path("assets/fonts/debug/accent")),
)
# The toolbar deliberately retains one desktop format for each candidate:
# prefer OTF, fall back to TTF. Webfont variations are excluded from this
# temporary local-font comparison tool.
FORMATS = {".otf": "opentype", ".ttf": "truetype"}
FORMAT_PRIORITY = {".otf": 0, ".ttf": 1}
# Curated temporary testing set. Esthentic DEMO is the permanent accent option
# in the toolbar, so only the selected local accent candidates are registered.
DISPLAY_EXCLUDED_STEMS = {
    "gingerbrand-bf66d211de77177",
    "rishionapersonaluse-regular",
    "bigale",
    "cratch-bold",
    "megant-personal-use",
    "ss-magnificent",
    "bonky-sansakerta",
    "bonky-free-personal-use",
    "catchy-mager-regular",
    "cratch-thin",
    "cratch-light",
    "gafta-regular",
    "nigella",
}
ACCENT_INCLUDED_STEMS = {"bongkyregular"}
EXTRA_ACCENT_FONTS = (
    (PROJECT_ROOT / "assets/fonts/SimpleCakes-lxq5w.ttf", "Simple Cakes"),
    (PROJECT_ROOT / "assets/fonts/Misselle-FreeDemo-BF6a71b09248b40.otf", "Missele"),
)


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value)).lower()


def label_for(filename: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[_.-]+", " ", Path(filename).stem)).strip()


def css_string(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


registry: dict[str, list[dict[str, str]]] = {"display": [], "accent": []}
used_values: set[str] = set()
for group, source, destination_relative in GROUPS:
    destination = PROJECT_ROOT / destination_relative
    destination.mkdir(parents=True, exist_ok=True)
    candidates = (
        entry for entry in source.rglob("*")
        if entry.is_file()
        and entry.suffix.lower() in FORMATS
        # The display source contains the accent source; process that child
        # only as the separate accent group.
        and not (group == "display" and entry.relative_to(source).parts[0] == "accent")
    )
    selected_by_stem: dict[str, Path] = {}
    for source_font in candidates:
        key = source_font.stem.casefold()
        current = selected_by_stem.get(key)
        if current is None or (
            FORMAT_PRIORITY[source_font.suffix.lower()], len(source_font.relative_to(source).parts), source_font.relative_to(source).as_posix().casefold()
        ) < (
            FORMAT_PRIORITY[current.suffix.lower()], len(current.relative_to(source).parts), current.relative_to(source).as_posix().casefold()
        ):
            selected_by_stem[key] = source_font
    files = sorted(
        (
            source_font for source_font in selected_by_stem.values()
            if (group == "display" and slugify(source_font.stem) not in DISPLAY_EXCLUDED_STEMS)
            or (group == "accent" and slugify(source_font.stem) in ACCENT_INCLUDED_STEMS)
        ),
        key=lambda entry: entry.relative_to(source).as_posix().casefold(),
    )
    for source_font in files:
        source_relative = source_font.relative_to(source)
        target_font = destination / source_relative
        target_font.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_font, target_font)
        source_slug = slugify(source_font.stem)
        base_slug = "bongky" if source_slug == "bongkyregular" else source_slug or "font"
        slug = base_slug
        suffix = 2
        while f"debug-{group}-{slug}" in used_values:
            slug = f"{base_slug}-{suffix}"
            suffix += 1
        used_values.add(f"debug-{group}-{slug}")
        registry[group].append({
            "value": f"debug-{group}-{slug}",
            "label": "Bongky" if source_slug == "bongkyregular" else label_for(source_font.name),
            "family": f"Debug {group.title()} {slug}",
            "path": (destination_relative / source_relative).as_posix(),
            "format": FORMATS[source_font.suffix.lower()],
        })

for source_font, label in EXTRA_ACCENT_FONTS:
    if not source_font.is_file():
        continue
    # Canonical fonts are shared by production and debug; never generate copies.
    base_slug = slugify(label) or "font"
    slug = base_slug
    suffix = 2
    while f"debug-accent-{slug}" in used_values:
        slug = f"{base_slug}-{suffix}"
        suffix += 1
    used_values.add(f"debug-accent-{slug}")
    registry["accent"].append({
        "value": f"debug-accent-{slug}",
        "label": label,
        "family": f"Debug Accent {slug}",
        "path": source_font.relative_to(PROJECT_ROOT).as_posix(),
        "format": FORMATS[source_font.suffix.lower()],
    })

# Google Fonts: Playfair Display, Black (900). Loaded only when selected.
registry["display"].append({'value': 'debug-display-playfair-display-black', 'label': 'Playfair Display Black', 'family': 'Playfair Display', 'path': 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKfsukDQ.ttf', 'format': 'truetype', 'weight': 900})

font_faces = "\n\n".join(
    "@font-face {\n"
    f"  font-family: \"{css_string(font['family'])}\";\n"
    f"  src: url(\"{css_string(font['path'])}\") format(\"{font['format']}\");\n"
    "  font-style: normal;\n"
    f"  font-weight: {font.get('weight', 400)};\n"
    "  font-display: swap;\n"
    "}"
    for fonts in registry.values() for font in fonts
    # This existing family is now declared once in canonical display-font.css.
    if font["value"] != "debug-accent-missele"
)
states = "\n\n".join(
    f"body.debug-enabled[data-display-font=\"{font['value']}\"] {{\n"
    f"  --font-heading: \"{css_string(font['family'])}\", Georgia, serif;\n"
    f"  --font-display: \"{css_string(font['family'])}\", Georgia, serif;\n"
    "}"
    for font in registry["display"]
) + "\n\n" + "\n\n".join(
    f"body.debug-enabled[data-accent-font=\"{font['value']}\"] {{\n"
    f"  --font-accent: \"{css_string(font['family'])}\", cursive;\n"
    "}"
    for font in registry["accent"]
)

(PROJECT_ROOT / "debug-fonts.css").write_text(
    "/* GENERATED by scripts/sync-debug-fonts.py. Temporary debug/testing infrastructure. */\n"
    "/* Do not edit by hand; re-run the sync after changing either candidate-font folder. */\n\n"
    + font_faces + "\n\n" + states + "\n",
    encoding="utf-8",
)
(PROJECT_ROOT / "debug-font-registry.js").write_text(
    "/* GENERATED by scripts/sync-debug-fonts.py. Temporary debug/testing infrastructure. */\n"
    f"window.DEBUG_FONT_OPTIONS = {json.dumps(registry, indent=2, ensure_ascii=False)};\n",
    encoding="utf-8",
)
print(f"Synced {len(registry['display'])} display and {len(registry['accent'])} accent debug fonts.")
