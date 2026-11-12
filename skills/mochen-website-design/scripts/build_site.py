#!/usr/bin/env python3
"""Build an offline Mochen website from curated JSON, Markdown or plain text."""
import argparse
import datetime
import hashlib
import html
import json
import re
import shutil
from pathlib import Path
from urllib.parse import unquote, urlsplit


def href(value):
    value = str(value).strip()
    if not value or any(ord(char) < 32 for char in value):
        raise ValueError("链接为空或含控制字符")
    parsed = urlsplit(value)
    if parsed.scheme.lower() not in ("", "http", "https", "mailto") or value.startswith("//"):
        raise ValueError("不支持的链接协议：" + value[:80])
    return value


def summary(text):
    for line in text.splitlines():
        if line.strip() and not re.match(r"^\s*(#|[-*]|\d+\.|```|\||>)", line):
            plain = re.sub(r"[*_`]", "", line.strip())
            return plain if len(plain) <= 160 else plain[:157] + "…"
    return ""


def from_markdown(text, source):
    lines = text.splitlines()
    if lines and lines[0].strip() == "---":
        end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
        if end is not None:
            lines = lines[end + 1:]
    title = source.stem
    for i, line in enumerate(lines):
        if re.match(r"^#\s+", line):
            title = re.sub(r"^#\s+", "", line).strip()
            lines.pop(i)
            break
    groups, current, label, in_fence = [], [], "正文", False
    for line in lines:
        if re.match(r"^\s*(`{3,}|~{3,})", line):
            in_fence = not in_fence
        if not in_fence and re.match(r"^##\s+", line):
            if "\n".join(current).strip():
                groups.append((label, "\n".join(current).strip()))
            label, current = re.sub(r"^##\s+", "", line).strip(), []
        else:
            current.append(line)
    if "\n".join(current).strip():
        groups.append((label, "\n".join(current).strip()))
    sections = []
    for number, (label, body) in enumerate(groups, 1):
        chunks = re.split(r"(?m)^###\s+(.+)\n", body)
        items = []
        if chunks[0].strip():
            items.append({"title": label, "summary": summary(chunks[0]), "body": chunks[0].strip()})
        for i in range(1, len(chunks), 2):
            part = chunks[i + 1].strip() if i + 1 < len(chunks) else ""
            items.append({"title": chunks[i].strip(), "summary": summary(part), "body": part})
        sections.append({"id": "section-" + str(number), "label": label,
                         "layout": "cards" if len(items) > 1 else "prose", "items": items})
    return {"title": title, "hero": {"title": title, "summary": summary("\n".join(lines))}, "sections": sections}


class Builder:
    def __init__(self, source, output):
        self.source = source
        self.output = output
        self.media = {}

    def local_file(self, value, image=False):
        value = href(value)
        if urlsplit(value).scheme or value.startswith("#") or value.startswith("/"):
            if image:
                raise ValueError("图片需使用相对输入文件的本地素材：" + value[:80])
            return value
        parsed = urlsplit(value)
        path = (self.source.parent / unquote(parsed.path)).resolve()
        try:
            path.relative_to(self.source.parent.resolve())
        except ValueError as exc:
            raise ValueError("下载文件和图片请先放入输入文件所在目录：" + value) from exc
        if not path.is_file():
            raise ValueError("引用文件不存在：" + value)
        if path not in self.media:
            digest = hashlib.sha256(path.read_bytes()).hexdigest()[:16]
            target = self.output / "assets/content" / (digest + path.suffix.lower())
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
            self.media[path] = target.relative_to(self.output).as_posix()
        return self.media[path]

    def inline(self, text):
        pattern = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*(.+?)\*\*|(?<!\*)\*([^*]+)\*(?!\*)")
        result, offset = [], 0
        for match in pattern.finditer(text):
            result.append(html.escape(text[offset:match.start()]))
            a, b, c, d, e, f, g = match.groups()
            if a is not None:
                url = self.local_file(b, image=True)
                result.append('<img src="' + html.escape(url, quote=True) + '" alt="' + html.escape(a, quote=True) + '" loading="lazy">')
            elif c is not None:
                url = href(d)
                if not urlsplit(url).scheme and not url.startswith(("#", "/")):
                    url = self.local_file(url)
                attrs = ' target="_blank" rel="noopener noreferrer"' if url.startswith(("http://", "https://")) else ""
                result.append('<a href="' + html.escape(url, quote=True) + '"' + attrs + '>' + html.escape(c) + '</a>')
            elif e is not None:
                result.append("<code>" + html.escape(e) + "</code>")
            elif f is not None:
                result.append("<strong>" + html.escape(f) + "</strong>")
            else:
                result.append("<em>" + html.escape(g) + "</em>")
            offset = match.end()
        result.append(html.escape(text[offset:]))
        return "".join(result)

    def markdown(self, text):
        lines, result, i = text.splitlines(), [], 0
        while i < len(lines):
            line = lines[i]
            if not line.strip():
                i += 1
                continue
            fence = re.match(r"^\s*(`{3,}|~{3,})(.*)$", line)
            if fence:
                marker, language, code = fence.group(1), fence.group(2).strip(), []
                i += 1
                while i < len(lines) and not re.match(r"^\s*" + re.escape(marker[0]) + "{" + str(len(marker)) + r",}\s*$", lines[i]):
                    code.append(lines[i])
                    i += 1
                result.append('<pre><code data-language="' + html.escape(language, quote=True) + '">' + html.escape("\n".join(code)) + '</code></pre>')
                i += 1
                continue
            heading = re.match(r"^(#{1,6})\s+(.+)$", line)
            if heading:
                level = min(4, max(2, len(heading.group(1))))
                result.append(f"<h{level}>" + self.inline(heading.group(2)) + f"</h{level}>")
                i += 1
                continue
            if re.match(r"^\s*([-*_])(?:\s*\1){2,}\s*$", line):
                result.append("<hr>")
                i += 1
                continue
            if i + 1 < len(lines) and "|" in line and re.match(r"^\s*\|?\s*:?-{3,}:?\s*\|", lines[i + 1]):
                split = lambda row: [cell.strip() for cell in row.strip().strip("|").split("|")]
                headers, rows = split(line), []
                i += 2
                while i < len(lines) and "|" in lines[i] and lines[i].strip():
                    rows.append(split(lines[i]))
                    i += 1
                result.append('<div class="table-wrap"><table><thead><tr>' + "".join("<th>" + self.inline(cell) + "</th>" for cell in headers) + "</tr></thead><tbody>" + "".join("<tr>" + "".join("<td>" + self.inline(cell) + "</td>" for cell in row) + "</tr>" for row in rows) + "</tbody></table></div>")
                continue
            bullet = re.match(r"^\s*(?:[-*+]\s+|\d+[.)]\s+)(.+)$", line)
            if bullet:
                ordered = bool(re.match(r"^\s*\d+[.)]", line))
                tag, items = ("ol" if ordered else "ul"), []
                while i < len(lines):
                    match = re.match(r"^\s*(?:\d+[.)]\s+|[-*+]\s+)(.+)$", lines[i])
                    if not match or bool(re.match(r"^\s*\d+[.)]", lines[i])) != ordered:
                        break
                    items.append("<li>" + self.inline(match.group(1)) + "</li>")
                    i += 1
                result.append(f"<{tag}>" + "".join(items) + f"</{tag}>")
                continue
            if re.match(r"^\s*>", line):
                quote = []
                while i < len(lines) and re.match(r"^\s*>", lines[i]):
                    quote.append(re.sub(r"^\s*>\s?", "", lines[i]))
                    i += 1
                result.append("<blockquote><p>" + self.inline(" ".join(quote)) + "</p></blockquote>")
                continue
            paragraph = [line.strip()]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(r"^\s*(?:#|>|[-*+]\s|\d+[.)]\s|`{3,}|~{3,})", lines[i]):
                if i + 1 < len(lines) and "|" in lines[i] and re.match(r"^\s*\|?\s*:?-{3,}", lines[i + 1]):
                    break
                paragraph.append(lines[i].strip())
                i += 1
            result.append("<p>" + self.inline(" ".join(paragraph)) + "</p>")
        return "\n".join(result)

    def normalize(self, raw):
        if not isinstance(raw, dict):
            raise ValueError("内容 JSON 顶层必须是对象")
        title = str(raw.get("title", self.source.stem)).strip()
        hero = raw.get("hero") or {}
        headline = hero.get("title", title)
        if isinstance(headline, list):
            headline = "\n".join(map(str, headline))
        result = {"title": title, "brand": str(raw.get("brand", "MOCHEN")),
                  "author": str(raw.get("author", "陌晨")), "pet": raw.get("pet", True) is not False,
                  "hero": {"title": str(headline), "eyebrow": str(hero.get("eyebrow", "CONTENT / MOCHEN")),
                           "summary": str(hero.get("summary", raw.get("summary", "")))}, "sections": []}
        if raw.get("contact"):
            contact = raw["contact"]
            result["contact"] = {"label": str(contact.get("label", "")), "value": str(contact.get("value", ""))}
        if raw.get("return_url"):
            result["return_url"] = href(raw["return_url"])
            result["return_label"] = str(raw.get("return_label", "返回"))
        sections = raw.get("sections")
        if not isinstance(sections, list) or not sections:
            raise ValueError("至少需要一个有内容的 sections 栏目")
        ids = set()
        for index, source_section in enumerate(sections, 1):
            sid = str(source_section.get("id", "section-" + str(index)))
            self.register(sid, ids)
            layout = source_section.get("layout", "cards")
            if layout not in ("cards", "list", "steps", "prose"):
                raise ValueError("未知栏目布局：" + str(layout))
            section = {"id": sid, "label": str(source_section.get("label", "栏目 " + str(index))),
                       "description": str(source_section.get("description", "")), "layout": layout, "items": []}
            items = source_section.get("items")
            if not isinstance(items, list) or not items:
                raise ValueError("栏目没有实际内容：" + sid)
            for number, source_item in enumerate(items, 1):
                iid = str(source_item.get("id", sid + "-item-" + str(number)))
                self.register(iid, ids)
                body = source_item.get("body", "")
                if not isinstance(body, str):
                    raise ValueError("body 必须是 Markdown 字符串：" + iid)
                item = {"id": iid, "title": str(source_item.get("title", "")),
                        "summary": str(source_item.get("summary", summary(body))),
                        "tag": str(source_item.get("tag", "")), "body": body,
                        "body_html": self.markdown(body), "bullets": [str(value) for value in source_item.get("bullets", [])],
                        "links": [], "search_text": str(source_item.get("title", "")) + " " + body + " " + str(source_item.get("summary", "")) + " " + " ".join(map(str, source_item.get("bullets", [])))}
                if not item["title"] or not (body.strip() or item["summary"].strip() or item["bullets"]):
                    raise ValueError("条目需有标题和正文、摘要或关键点：" + iid)
                if source_item.get("cover"):
                    item["cover"] = self.local_file(source_item["cover"], image=True)
                for link in source_item.get("links", []):
                    url = href(link["url"])
                    if not urlsplit(url).scheme and not url.startswith(("#", "/")) and not link.get("site_link"):
                        url = self.local_file(url)
                    item["links"].append({"label": str(link.get("label", "查看")), "url": url,
                                          "download": bool(link.get("download", False))})
                section["items"].append(item)
            result["sections"].append(section)
        return result

    @staticmethod
    def register(value, ids):
        if not re.fullmatch(r"[A-Za-z0-9_-]+", value) or value in ids or value in ("top", "content", "main", "item"):
            raise ValueError("ID 重复、保留或含不支持字符：" + value)
        ids.add(value)


def build(source, output):
    source, output = source.resolve(), output.resolve()
    if output.exists():
        raise ValueError("输出目录已存在，请使用新的版本目录：" + str(output))
    if not source.is_file():
        raise ValueError("输入文件不存在：" + str(source))
    text = source.read_text(encoding="utf-8-sig")
    if source.suffix.lower() == ".json":
        raw = json.loads(text)
    elif source.suffix.lower() in (".md", ".markdown", ".txt"):
        raw = from_markdown(text, source)
    else:
        raise ValueError("PDF、图片和 DOCX 请先提取内容并整理为 JSON/Markdown")
    starter = Path(__file__).resolve().parents[1] / "assets/starter"
    shutil.copytree(starter, output)
    builder = Builder(source, output)
    data = builder.normalize(raw)
    encoded = json.dumps(data, ensure_ascii=False, indent=2)
    (output / "content.json").write_text(encoded + "\n", encoding="utf-8")
    (output / "site-data.js").write_text("window.MOCHEN_SITE = " + encoded.replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029") + ";\n", encoding="utf-8")
    template = (output / "index.html").read_text(encoding="utf-8")
    art = (output / "assets/mochen-operator.svg").read_text(encoding="utf-8").replace("<svg ", '<svg class="hero-art" ', 1)
    headline = data["hero"]["title"]
    lines = '<br>'.join('<span class="line-' + str(i) + '">' + html.escape(line) + '</span>' for i, line in enumerate(headline.splitlines(), 1))
    replacements = {"{{TITLE}}": html.escape(data["title"], quote=True), "{{BRAND}}": html.escape(data["brand"]),
                    "{{AUTHOR}}": html.escape(data["author"]), "{{HERO_LINES}}": lines,
                    "{{HERO_CLASS}}": "is-cjk" if re.search(r"[\u3400-\u9fff]", headline) else "",
                    "{{EYEBROW}}": html.escape(data["hero"]["eyebrow"]),
                    "{{SUMMARY}}": html.escape(data["hero"]["summary"]), "{{ART}}": art,
                    "{{YEAR}}": str(datetime.date.today().year), "{{PET_HIDDEN}}": "" if data["pet"] else "hidden",
                    "{{RETURN}}": '<a class="return-link" href="' + html.escape(data["return_url"], quote=True) + '">← ' + html.escape(data["return_label"]) + '</a>' if data.get("return_url") else ""}
    for token, value in replacements.items():
        template = template.replace(token, value)
    (output / "index.html").write_text(template, encoding="utf-8")
    receipt = {"schema_version": 1, "generated_at": datetime.datetime.now().astimezone().isoformat(),
               "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "sections": len(data["sections"]),
               "items": sum(len(section["items"]) for section in data["sections"]), "copied_content_assets": len(builder.media),
               "network_required": False, "browser_verified": False}
    (output / "build-receipt.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        receipt = build(args.input, args.output)
    except (ValueError, OSError, KeyError, TypeError, json.JSONDecodeError) as error:
        parser.exit(2, "生成失败：" + str(error) + "\n")
    print(json.dumps({"output": str(args.output.resolve()), **receipt}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
