#!/usr/bin/env python3
"""
RDKit SVG structural formula generator.

Reads structural-formula-registry.json and generates SVG images.

Usage:
    source .venv/bin/activate
    python scripts/generate-structure-svgs.py [--id struct-caffeine] [--dry-run]
"""

import json
import sys
from pathlib import Path

try:
    from rdkit import Chem
    from rdkit.Chem import Draw, AllChem, rdCoordGen
except ImportError:
    print("ERROR: RDKit not installed. Run: source .venv/bin/activate")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
REGISTRY_PATH = PROJECT_ROOT / "src" / "data" / "structural-formula-registry.json"
OUTPUT_DIR = PROJECT_ROOT / "public" / "images" / "structures"

SVG_WIDTH = 400
SVG_HEIGHT = 300


def generate_svg(smiles: str, output_path: Path) -> bool:
    """Generate SVG from SMILES. Returns True on success."""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        print(f"  ERROR: Invalid SMILES: {smiles}")
        return False

    # Use CoordGen for better multi-ring layout
    rdCoordGen.AddCoords(mol)

    drawer = Draw.MolDraw2DSVG(SVG_WIDTH, SVG_HEIGHT)
    opts = drawer.drawOptions()
    opts.clearBackground = True
    opts.bondLineWidth = 2.0

    drawer.DrawMolecule(mol)
    drawer.FinishDrawing()
    svg_text = drawer.GetDrawingText()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_text)

    return True


def main():
    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    id_filter = None
    if "--id" in args:
        idx = args.index("--id")
        id_filter = args[idx + 1] if idx + 1 < len(args) else None

    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        registry = json.load(f)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    generated = 0
    skipped = 0
    failed = 0

    for entry in registry["entries"]:
        entry_id = entry["id"]
        smiles = entry.get("smiles")

        if id_filter and entry_id != id_filter:
            continue

        if not smiles:
            print(f"[{entry_id}] No SMILES — skipping")
            skipped += 1
            continue

        svg_name = entry_id.replace("struct-", "") + ".svg"
        output_path = OUTPUT_DIR / svg_name

        print(f"[{entry_id}] Generating {svg_name}...")

        if dry_run:
            print(f"  [DRY RUN] Would write {output_path}")
            continue

        if generate_svg(smiles, output_path):
            generated += 1
        else:
            failed += 1

    print(f"\nDone: {generated} generated, {skipped} skipped, {failed} failed")


if __name__ == "__main__":
    main()
