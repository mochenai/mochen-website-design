#!/usr/bin/env python3
"""Check generated content, offline asset integrity and safe, unique routes."""
import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.assets = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ("img", "script", "source") and attrs.get("src"):
            self.assets.append(attrs["src"])
        if tag == "link" and attrs.get("href"):
            self.assets.append(attrs["href"])
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])


def validate(root):
    problems, assets, links, ids = [], set(), [], set()
    try:
        data = json.loads((root / "content.json").read_text(encoding="utf-8"))
        encoded = (root / "site-data.js").read_text(encoding="utf-8")
        runtime = json.loads(encoded.removeprefix("window.MOCHEN_SITE = ").strip().removesuffix(";"))
        if runtime != data:
            problems.append("运行时内容与可编辑 JSON 不一致")
        for section in data["sections"]:
            for obj in [section, *section["items"]]:
                if obj["id"] in ids:
                    problems.append("重复路由 ID：" + obj["id"])
                ids.add(obj["id"])
            for item in section["items"]:
                refs = References()
                refs.feed(item["body_html"])
                assets.update(refs.assets)
                links.extend(refs.links)
                if item.get("cover"):
                    assets.add(item["cover"])
                links.extend(link["url"] for link in item["links"])
        refs = References()
        index = (root / "index.html").read_text(encoding="utf-8")
        refs.feed(index)
        assets.update(refs.assets)
        links.extend(refs.links)
        if re.search(r"\{\{[A-Z_]+\}\}", index):
            problems.append("模板仍有未替换字段")
        for file in root.glob("*.css"):
            assets.update(re.findall(r'url\([\x22\x27]?([^\)\x22\x27]+)', file.read_text(encoding="utf-8")))
        for file in ("assets/gaze-dog/dog-look-angle-atlas.webp", "assets/mochen-operator.svg", "pet-drag.js", "site.js"):
            assets.add(file)
        for value in assets:
            if urlsplit(value).scheme or value.startswith("//"):
                problems.append("外部资源使离线运行不完整：" + value)
            elif not (root / unquote(urlsplit(value).path)).is_file():
                problems.append("资源不存在：" + value)
        for value in links:
            scheme = urlsplit(value).scheme.lower()
            if scheme not in ("", "http", "https", "mailto"):
                problems.append("不安全链接协议：" + value[:80])
            if value.startswith("#"):
                route = value[1:].removeprefix("item/")
                if route not in ids and route not in ("", "top", "main", "content"):
                    problems.append("站内路由无目标：" + value)
            elif not scheme and not value.startswith("/") and value != data.get("return_url"):
                if not (root / unquote(urlsplit(value).path)).is_file():
                    problems.append("下载或页面入口不存在：" + value)
        if re.search(r"/(?:Users|home)/[^/\s]+/", json.dumps(data, ensure_ascii=False)):
            problems.append("公开内容包含本机用户路径，请确认并移除")
    except (OSError, KeyError, ValueError, TypeError) as error:
        problems.append(str(error))
        data = {"sections": []}
    return {"passed": not problems, "sections": len(data["sections"]),
            "items": sum(len(section["items"]) for section in data["sections"]),
            "asset_references_checked": len(assets), "browser_verified": False, "problems": problems}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site", type=Path)
    args = parser.parse_args()
    result = validate(args.site.resolve())
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result["passed"] else 1)


if __name__ == "__main__":
    main()
