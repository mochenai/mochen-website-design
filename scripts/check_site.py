#!/usr/bin/env python3
"""Validate the public site's article, asset and cross-page references."""
import argparse
import json
import re
import zipfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.values = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        key = "src" if tag in ("img", "script", "source") else "href" if tag in ("link", "a") else None
        if key and attrs.get(key):
            self.values.append(attrs[key])


def check(root):
    root = root.resolve()
    problems, checked = [], set()

    def ref(value, parent, label):
        parsed = urlsplit(value)
        if parsed.scheme in ("http", "https", "mailto") or value.startswith(("#", "//")):
            return
        if parsed.scheme:
            if parsed.scheme != "data":
                problems.append(label + ": unsupported protocol")
            return
        if not parsed.path:
            return
        if value.startswith("/"):
            problems.append(label + ": root path breaks project Pages: " + value)
            return
        path = (parent / unquote(parsed.path)).resolve()
        if not path.is_relative_to(root):
            problems.append(label + ": reference leaves public site: " + value)
            return
        checked.add(path)
        if not path.is_file() and not (path.is_dir() and (path / "index.html").is_file()):
            problems.append(label + ": missing " + value)

    def html_refs(text, parent, label):
        parser = References()
        parser.feed(text)
        for value in parser.values:
            ref(value, parent, label)

    files = [p for p in root.rglob("*") if p.is_file()]
    for p in files:
        rel = p.relative_to(root).as_posix()
        if p.suffix == ".html":
            html_refs(p.read_text(encoding="utf-8"), p.parent, rel)
        elif p.suffix == ".css":
            for value in re.findall(r'url\([\x22\x27]?([^\)\x22\x27]+)', p.read_text(encoding="utf-8")):
                ref(value, p.parent, rel)
        if p.suffix in (".html", ".js", ".css", ".json", ".md", ".svg", ".txt"):
            text = p.read_text(encoding="utf-8")
            if re.search(r"/Users/|file://|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY", text):
                problems.append(rel + ": local path or credential found")
        if p.suffix.lower() in (".pdf", ".docx", ".env", ".jsonl", ".log"):
            problems.append(rel + ": unexpected source or private file")
        if p.stat().st_size >= 100 * 1024 * 1024:
            problems.append(rel + ": exceeds GitHub file limit")
        if p.suffix == ".zip":
            with zipfile.ZipFile(p) as archive:
                if archive.testzip() is not None:
                    problems.append(rel + ": archive CRC failure")

    profile = json.loads((root / "data/profile.json").read_text(encoding="utf-8"))
    articles = json.loads((root / "data/articles.json").read_text(encoding="utf-8"))
    ids = set()
    for article in articles:
        aid = article["id"]
        if aid in ids:
            problems.append("duplicate article id: " + aid)
        ids.add(aid)
        p = root / "data/articles" / (aid + ".json")
        if not p.is_file():
            problems.append("missing article: " + aid)
            continue
        full = json.loads(p.read_text(encoding="utf-8"))
        if full.get("id") != aid or full.get("title") != article.get("title"):
            problems.append("article catalog mismatch: " + aid)
        html_refs(full.get("html", ""), root / "data", "article/" + aid)
        if article.get("cover"):
            ref(article["cover"], root / "data", "cover/" + aid)
        ref("data/markdown/" + aid + ".md", root, "markdown/" + aid)
    for project in profile["projects"]:
        for key in ("href", "download"):
            if project.get(key):
                ref(project[key], root, "project/" + project["id"])
    for folder in (root / "works").iterdir():
        if not folder.is_dir() or not (folder / "content.json").is_file():
            continue
        data = json.loads((folder / "content.json").read_text(encoding="utf-8"))
        runtime = json.loads((folder / "site-data.js").read_text(encoding="utf-8").removeprefix("window.MOCHEN_SITE = ").strip().removesuffix(";"))
        if runtime != data:
            problems.append(str(folder.relative_to(root)) + ": data mirrors differ")
        for section in data["sections"]:
            for item in section["items"]:
                html_refs(item["body_html"], folder, item["id"])
                if item.get("cover"):
                    ref(item["cover"], folder, item["id"])
                for link in item["links"]:
                    ref(link["url"], folder, item["id"])
        if data.get("return_url"):
            ref(data["return_url"], folder, "return")
    for item in ("assets/gaze-dog/dog-sprite.js", "assets/gaze-dog/dog-sprite.css", "assets/gaze-dog/dog-look-angle-atlas.webp", "assets/gaze-dog/README.md", "pet-drag.js"):
        ref(item, root, "pet")
    return {"passed": not problems, "projects": len(profile["projects"]), "articles": len(articles),
            "experiences": len(profile["experience"]), "media_files": len(list((root / "data/media").glob("*"))),
            "files": len(files), "checked_local_references": len(checked), "problems": problems,
            "browser_verified": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", type=Path)
    args = parser.parse_args()
    try:
        result = check(args.site)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        raise SystemExit(0 if result["passed"] else 1)
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(2, str(exc) + "\n")
