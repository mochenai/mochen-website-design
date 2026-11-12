#!/usr/bin/env python3
"""Package the reusable Skill, preserving its license and required notices."""
import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path


def package(output):
    repo = Path(__file__).resolve().parents[1]
    source = repo / "skills/mochen-website-design"
    output = output.resolve()
    if output.is_relative_to(source):
        raise ValueError("The package output must be outside the Skill directory")
    for name in ("SKILL.md", "LICENSE", "NOTICE", "THIRD_PARTY_NOTICES.md", "assets/starter/LICENSE", "assets/starter/NOTICE", "assets/starter/THIRD_PARTY_NOTICES.md"):
        if not (source / name).is_file():
            raise ValueError("Missing required package file: " + name)
    for name in ("LICENSE", "NOTICE", "THIRD_PARTY_NOTICES.md"):
        expected = (repo / name).read_bytes()
        if (source / name).read_bytes() != expected or (source / "assets/starter" / name).read_bytes() != expected:
            raise ValueError("License or notice copies differ: " + name)
    entry = (source / "SKILL.md").read_text(encoding="utf-8")
    match = re.search(r'^\s*version:\s*"([0-9]+\.[0-9]+\.[0-9]+)"\s*$', entry, re.MULTILINE)
    if not match:
        raise ValueError("Missing Skill version")
    files = sorted(p for p in source.rglob("*") if p.is_file()
                   and not set(p.relative_to(source).parts).intersection({".git", "__pycache__"})
                   and p.name != ".DS_Store" and p.suffix not in (".pyc", ".pyo"))
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, "mochen-website-design/" + path.relative_to(source).as_posix())
    return {"version": match.group(1), "files": len(files), "bytes": output.stat().st_size,
            "sha256": hashlib.sha256(output.read_bytes()).hexdigest()}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(package(args.output), ensure_ascii=False, indent=2))
    except (OSError, ValueError) as exc:
        parser.exit(2, str(exc) + "\n")
