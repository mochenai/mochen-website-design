# GitHub Pages 发布与更新

本仓库将 `examples/mochen/` 作为可访问的示例网站，Skill 源码和原始资料不进入网站构建产物。

## 在自己的账号中复用

1. Fork 仓库，并把 `examples/mochen/` 换成自己的静态网站；或先用 Skill 生成，再复制生成目录的内容进去。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 在 **Actions → Deploy website example to GitHub Pages** 运行 workflow；以后推送 `main` 自动更新。
4. 部署成功后，在 Pages 设置或部署记录查看公开网址。

文件和链接使用相对路径，可部署到 `https://<账号>.github.io/<仓库>/`。Hash 栏目和文章路由共用入口，无需服务器重写。跨页面跳转保留相对路径，不能把 `/works/…` 当作项目 Pages 的根目录。

## 陌晨网站在哪里修改

- 首页标题、布局：`examples/mochen/index.html`。
- 简介、作品、工作经历、公众号名称：`examples/mochen/data/profile.json`。
- 文章目录：`examples/mochen/data/articles.json`；全文 JSON、Markdown 和媒体在相邻目录。
- 视觉与动效：`styles.css`、`motion.css`、`motion.js`。
- 小狗拖拽：`pet-drag.js`；保留上游 Gaze-Dog 文件。
- Skill 使用页：`examples/mochen/works/website-design-skill/`。

保存后提交并推送，等待 GitHub Actions 的 build 和 deploy 都成功再打开线上网页。可在浏览器强制刷新查看最新版本。

## 本机先验证

```bash
python3 scripts/check_site.py examples/mochen
python3 scripts/build_pages.py --output work/pages-v1
python3 -m http.server 8787 --bind 127.0.0.1 --directory work/pages-v1
```

输出目录必须不存在，避免覆盖旧版本。`build_pages.py` 仅复制网站示例并添加 `.nojekyll`，不使用付费服务。
