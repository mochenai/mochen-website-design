# 内容 JSON 与运行方法

最小输入只需 `title` 和至少一个有内容的 `sections`。字符串作为纯文本展示，`body` 支持 Markdown。原始 Markdown/TXT 可直接输入，一级标题作为首页标题，二级标题作为栏目，三级标题作为条目；正文、列表、引用、表格、代码与本地图片保留。

```json
{
  "title": "我的知识专题",
  "brand": "MOCHEN",
  "author": "陌晨",
  "hero": {
    "eyebrow": "NOTES / MOCHEN",
    "title": "把笔记\n变成作品。",
    "summary": "来自实际材料的介绍，不编造数字。"
  },
  "pet": true,
  "sections": [
    {
      "id": "notes",
      "label": "专题",
      "description": "按内容主题组织。",
      "layout": "cards",
      "items": [
        {
          "id": "first-note",
          "title": "第一篇内容",
          "summary": "这篇内容能解决什么问题。",
          "tag": "方法",
          "body": "## 正文\n\n保留作者判断与材料事实。",
          "bullets": ["关键点一", "关键点二"],
          "cover": "images/cover.png",
          "links": [{"label": "参考来源", "url": "https://example.org/"}]
        }
      ]
    }
  ]
}
```

`layout` 支持 `cards`（双列作品/功能）、`list`（文章列表）、`steps`（流程）、`prose`（直接阅读全文）。没有 cover 就省略图片；没有 body 就用 summary 和 bullets，不能写假全文。

`hero.title` 可用换行或字符串数组控制标题行。`site` 内的指标和联系方式没有默认填充。可选 `contact` 为 `{ "label": "公众号", "value": "用户确认的公众号名称" }`。可选 `return_url` 与 `return_label` 用于把页面接回现有网站，由接入工程提供真实路径。

栏目 ID 与条目 ID 使用英文字母、数字、下划线、连字符，全站唯一；遗漏时生成稳定编号。阅读路由为 `#item/<id>`，栏目路由为 `#<section-id>`。

本地图片和下载文件路径相对输入 JSON 所在目录，先把授权素材放在该目录之下；生成器复制实际引用到的文件并按内容 hash 命名，不整包复制资料目录。图片必须使用本地文件。链接允许 HTTP/HTTPS、用户提供的 mailto 和站内 hash；不允许 JavaScript、data、file 协议。

## 测一次不同内容

```bash
python3 "<skill-dir>/scripts/build_site.py" --input "<skill-dir>/assets/example-content.json" --output "/path/to/output/product-example"
python3 "<skill-dir>/scripts/validate_site.py" "/path/to/output/product-example"
```

静态校验检查路由唯一性、资源引用、遗漏内容和不安全协议。真正的交互与视觉还需在本机 HTTP 服务中浏览器验证。站点同样可以双击 `index.html` 阅读，HTTP 预览适合开发、跨页跳转和浏览器检查。

已有网站的跨页入口可以使用 `{"label": "查看示例", "url": "../example/index.html", "site_link": true}`。生成器保留这个相对路径；应在目标页面已放入相邻目录后运行校验。普通相对下载和图片仍按输入目录读取并复制。品牌和署名用 `brand` 与 `author` 配置，不必采用陌晨的姓名或经历。
