#!/usr/bin/env python3
"""Package only the public example for GitHub Pages."""
import argparse
import json
import shutil
from pathlib import Path


def build(output):
    repo = Path(__file__).resolve().parents[1]
    source = repo / "examples/mochen"
    output = output.resolve()
    if output.exists():
        raise ValueError("Output exists; choose a new directory: " + str(output))
    if output == source or source in output.parents or output in source.parents:
        raise ValueError("Output must be outside the source example")
    shutil.copytree(source, output, ignore=shutil.ignore_patterns(".DS_Store", "__pycache__", "*.pyc"))
    (output / ".nojekyll").write_text("", encoding="utf-8")
    files = [p for p in output.rglob("*") if p.is_file()]
    return {"output": str(output), "source": "examples/mochen", "files": len(files),
            "bytes": sum(p.stat().st_size for p in files)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(build(args.output), ensure_ascii=False, indent=2))
    except (OSError, ValueError) as exc:
        parser.exit(2, str(exc) + "\n")
