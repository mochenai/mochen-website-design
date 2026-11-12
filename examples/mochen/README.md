# 陌晨个人网站 · Skill 完整示例

[在线访问](https://mochenai.github.io/mochen-website-design/) · [返回 Skill 源码](../../README.md)

六个作品、118 篇文章、六段无日期工作经历；联系区仅展示公众号「Agent 陌晨」。首页为 Makes Things.，配有陌晨操作员与可拖动的 Gaze-Dog。

```bash
python3 -m http.server 8787 --bind 127.0.0.1 --directory examples/mochen
```

在仓库根目录运行后打开 http://127.0.0.1:8787/ 。本例需要通过 HTTP 读取文章数据。

修改资料从 `data/profile.json` 开始；文章从 `data/articles.json` 和 `data/articles/` 开始。复用结构时换成自己的内容，保留第三方来源说明。
