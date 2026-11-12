/* 陌晨 · MOCHEN — 个人网站
   数据驱动：data/profile.json + data/articles.json + data/articles/<id>.json
   路由：#work #skills #articles #about #connect / #article/<id>
*/
(function () {
  "use strict";

  var root = document.documentElement.getAttribute("data-root") || "";
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.MochenMotion ? window.MochenMotion.isReduced() : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.addEventListener("mochen:motion-preference", function (e) { reduceMotion = e.detail.reduced; });

  var state = {
    profile: null,
    articles: [],
    byId: {},
    order: [],
    categories: [],
    filter: "全部",
    query: "",
    sort: "default",
    shown: 12,
    page: 24,
    tab: "work",
    activeArticle: null,
    fullArticle: null,
    listScroll: 0,
    listHash: "#articles",
    returnId: null,
    returnArea: "article-feature"
  };

  var TAB_HASH = { work: "#work", skills: "#skills", articles: "#articles", about: "#about", connect: "#connect" };
  var HASH_TAB = { "#work": "work", "#skills": "skills", "#articles": "articles", "#about": "about", "#connect": "connect" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(d) {
    if (!d) return "";
    var parts = String(d).split("-");
    if (parts.length < 3) return d;
    return parts[0] + "." + parts[1] + "." + parts[2];
  }
  function fmtNumber(n) { return String(n); }

  /* ---------------- 数据 ---------------- */

  function loadJSON(path) {
    return fetch(root + path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(path + " " + r.status);
      return r.json();
    });
  }

  Promise.all([loadJSON("data/profile.json"), loadJSON("data/articles.json")])
    .then(function (res) {
      state.profile = res[0];
      state.articles = res[1];
      state.byId = {};
      state.articles.forEach(function (a) { state.byId[a.id] = a; });
      state.order = state.articles.slice();
      state.categories = (state.profile && state.profile.categories) || [];
      renderProjects();
      renderSkills();
      renderArticles();
      renderAbout();
      renderConnect();
      Promise.resolve(route(true)).finally(function () { if (window.MochenMotion) window.MochenMotion.ready(); });
    })
    .catch(function (err) {
      console.error(err);
      var list = $("#article-list");
      if (list) list.innerHTML = '<p class="empty">内容暂时无法载入。请确认通过本地 HTTP 服务器打开本站（例如 <code>python3 -m http.server</code>），而不是直接双击 HTML 文件。</p>';
      if (window.MochenMotion) window.MochenMotion.ready();
    });

  /* ---------------- 作品 ---------------- */

  function projectVisual(kind, project) {
    if (window.MochenDemos) return window.MochenDemos.visual(kind, project);
    var line = 'stroke="#1a1a1a" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';
    var soft = 'stroke="#dcd8cb" stroke-width="1.4" fill="none" stroke-linecap="round"';
    var accent = "#ffe28a";
    switch (kind) {
      case "workflow":
        return '<svg viewBox="0 0 300 130" aria-hidden="true">' +
          '<rect x="12" y="46" width="52" height="30" rx="7" fill="#fff" ' + soft + ' />' +
          '<rect x="88" y="18" width="56" height="28" rx="7" fill="' + accent + '" stroke="#e0c164" stroke-width="1.4"/>' +
          '<rect x="88" y="76" width="56" height="28" rx="7" fill="#fff" ' + soft + ' />' +
          '<rect x="168" y="46" width="58" height="30" rx="7" fill="#fff" ' + soft + ' />' +
          '<rect x="248" y="46" width="42" height="30" rx="15" fill="#1a1a1a"/>' +
          '<path d="M64 61h20M144 32c16 0 12 26 24 26M144 90c16 0 12-26 24-26M226 61h18" ' + line + ' />' +
          '<circle cx="73" cy="61" r="2.4" fill="#1a1a1a"/><circle cx="238" cy="61" r="2.4" fill="#1a1a1a"/>' +
          '<path d="M264 61h8M268 57l4 4-4 4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
          '<text x="19" y="65" font-family="SF Mono, monospace" font-size="8" fill="#8d8d8d">SOP</text>' +
          '<text x="98" y="36" font-family="SF Mono, monospace" font-size="8" fill="#7a6318">Skill</text>' +
          '<text x="100" y="94" font-family="SF Mono, monospace" font-size="8" fill="#8d8d8d">Review</text>' +
          '<text x="178" y="65" font-family="SF Mono, monospace" font-size="8" fill="#8d8d8d">Agent</text>' +
          '<text x="168" y="14" font-family="SF Mono, monospace" font-size="8" fill="#b3ac97">70 skills · local</text>' +
          '</svg>';
      case "geo":
        return '<svg viewBox="0 0 300 130" aria-hidden="true">' +
          '<line x1="24" y1="106" x2="278" y2="106" ' + soft + ' />' +
          [[44, 46, "豆包"], [104, 64, "元宝"], [164, 40, "千问"], [224, 78, "DeepSeek"]].map(function (b, i) {
            var h = b[1];
            return '<rect x="' + b[0] + '" y="' + (106 - h) + '" width="30" height="' + h + '" rx="3" fill="' + (i === 3 ? accent : "#f0eee6") + '" stroke="' + (i === 3 ? "#e0c164" : "#e2dfd4") + '" stroke-width="1"/>' +
              '<text x="' + (b[0] + 15) + '" y="121" text-anchor="middle" font-family="SF Mono, monospace" font-size="7.5" fill="#969696">' + b[2] + '</text>';
          }).join("") +
          '<path d="M59 92C110 84 150 70 223 52" stroke="#1a1a1a" stroke-width="1.3" fill="none" stroke-dasharray="3 4" stroke-linecap="round"/>' +
          '<circle cx="223" cy="52" r="3.2" fill="#1a1a1a"/>' +
          '<text x="24" y="24" font-family="SF Mono, monospace" font-size="8.5" fill="#8d8d8d">mentions / recommendation</text>' +
          '<text x="214" y="34" font-family="SF Mono, monospace" font-size="8.5" fill="#7a6318">TOP2</text>' +
          '</svg>';
      case "growth":
        return '<svg viewBox="0 0 300 130" aria-hidden="true">' +
          '<line x1="20" y1="104" x2="282" y2="104" ' + soft + ' />' +
          '<path d="M24 92L70 78 112 84 154 58 198 46 242 34 274 20" stroke="#1a1a1a" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
          '<path d="M24 92L70 78 112 84 154 58 198 46 242 34 274 20V104H24Z" fill="' + accent + '" opacity="0.32"/>' +
          '<circle cx="274" cy="20" r="3.4" fill="#1a1a1a"/>' +
          '<rect x="22" y="20" width="82" height="22" rx="4" fill="#fff" stroke="#e2dfd4" stroke-width="1"/>' +
          '<text x="30" y="35" font-family="SF Mono, monospace" font-size="8" fill="#8d8d8d">KA usage</text>' +
          '<text x="82" y="35" font-family="SF Mono, monospace" font-size="9" fill="#1a1a1a">82%</text>' +
          '<text x="238" y="118" font-family="SF Mono, monospace" font-size="7.5" fill="#b3ac97">daily / weekly</text>' +
          '</svg>';
      case "writing":
        var steps = ["选", "材", "纲", "稿", "味", "图", "排", "发"];
        return '<svg viewBox="0 0 300 130" aria-hidden="true">' +
          steps.map(function (s, i) {
            var x = 18 + i * 34;
            var gate = (i === 3 || i === 6 || i === 7);
            return '<rect x="' + x + '" y="' + (gate ? 40 : 50) + '" width="24" height="24" rx="5" fill="' + (gate ? accent : "#fff") + '" stroke="' + (gate ? "#e0c164" : "#e2dfd4") + '" stroke-width="1"/>' +
              '<text x="' + (x + 12) + '" y="' + (gate ? 56 : 66) + '" text-anchor="middle" font-family="PingFang SC, sans-serif" font-size="9" fill="#4a4a4a">' + s + '</text>';
          }).join("") +
          '<path d="M42 62h10M76 62h10M110 52h-4v20h4M144 52h-4v20h4M178 52h-4v20h4M212 52h-4v20h4M246 62h10" ' + soft + ' />' +
          '<text x="18" y="22" font-family="SF Mono, monospace" font-size="8.5" fill="#8d8d8d">核心环节 · human gate</text>' +
          '<text x="18" y="100" font-family="SF Mono, monospace" font-size="8" fill="#b3ac97">写主观点骨架 → AI 扩写润色 → 人工确认</text>' +
          '</svg>';
      case "agents":
      default:
        var cells = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        return '<svg viewBox="0 0 300 130" aria-hidden="true">' +
          cells.map(function (i) {
            var x = 22 + (i % 5) * 52;
            var y = 26 + Math.floor(i / 5) * 50;
            var hot = (i === 1 || i === 6);
            return '<rect x="' + x + '" y="' + y + '" width="42" height="34" rx="6" fill="' + (hot ? accent : "#fff") + '" stroke="' + (hot ? "#e0c164" : "#e2dfd4") + '" stroke-width="1"/>' +
              '<circle cx="' + (x + 12) + '" cy="' + (y + 12) + '" r="3" fill="' + (hot ? "#7a6318" : "#c9c4b3") + '"/>' +
              '<path d="M' + (x + 8) + ' ' + (y + 23) + 'h26M' + (x + 8) + ' ' + (y + 28) + 'h16" stroke="#dcd8cb" stroke-width="1.4" stroke-linecap="round"/>';
          }).join("") +
          '<text x="282" y="118" text-anchor="end" font-family="SF Mono, monospace" font-size="8" fill="#b3ac97">25 agents</text>' +
          '</svg>';
    }
  }

  function renderProjects() {
    var grid = $("#project-grid");
    if (!grid || !state.profile) return;
    var count = $("#panel-work .panel-note");
    if (count) count.textContent = "Selected work / " + String(state.profile.projects.length).padStart(2, "0");
    grid.innerHTML = state.profile.projects.map(function (p, i) {
      var id = "project-details-" + p.id;
      var related = { workbench: "71e81e75630ff431", geo: "f4623f543f2f675f", ads: "c150d4c854a7414a", writing: "372de27030bf5edf", agents: "5a346bc1066fdd75" }[p.id];
      var reading = p.href ? root + p.href : (state.byId[related] ? '#article/' + related : '#articles');
      return '<div class="motion-card motion-roll"><div class="card-hitbox rev stagger" style="--stagger-delay:' + (50 + Math.min(i, 4) * 80) + 'ms"><article class="project" data-project="' + esc(p.id) + '">' +
        '<span class="project-number" aria-hidden="true">0' + (i + 1) + '</span>' +
        '<div class="project-visual">' + projectVisual(p.visual, p) + '</div>' +
        '<div class="project-body">' +
          '<p class="project-diagram-caption">功能与流程示意 · 点一下试试</p>' +
          '<div class="project-top">' +
            '<a class="project-link" href="' + reading + '"><h3 class="project-title">' + esc(p.title) + '</h3></a>' +
            '<span class="metric" title="关键指标">' + esc(p.metric) + '</span>' +
          '</div>' +
          '<span class="project-kind">' + esc(p.kind) + '</span>' +
          '<p class="project-sub">' + esc(p.subtitle) + '</p>' +
          '<p class="project-desc">' + esc(p.description) + '</p>' +
          '<button class="project-toggle" type="button" aria-expanded="false" aria-controls="' + id + '">' +
            '<span>查看详情</span><span class="chev" aria-hidden="true">▾</span>' +
          '</button>' +
          '<div class="project-details" id="' + id + '" aria-hidden="true"><div><ul>' +
            p.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") +
          '</ul></div></div>' +
          '<div class="project-resources"><a class="project-reading-link" href="' + esc(reading) + '">' + esc(p.link_label || "阅读相关实践") + ' <span aria-hidden="true">↗</span></a>' +
          (p.download ? '<a class="project-reading-link" href="' + esc(root + p.download) + '" download>下载 Skill <span aria-hidden="true">↓</span></a>' : '') + '</div>' +
        '</div>' +
      '</article></div></div>';
    }).join("");

    $$(".project-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        var panel = document.getElementById(btn.getAttribute("aria-controls"));
        if (panel) { panel.classList.toggle("is-open", !open); panel.setAttribute("aria-hidden", String(open)); }
        btn.querySelector("span").textContent = open ? "查看详情" : "收起详情";
      });
    });
  }

  /* ---------------- Skills ---------------- */

  var SKILL_GROUPS = [
    {
      title: "Agent 与 Skill",
      index: "01",
      items: ["Agent 搭建", "Skill 封装", "RAG 知识库", "向量检索", "Coze"],
      note: "把场景知识库、工具调用与验收标准封进同一个 Agent。"
    },
    {
      title: "工具与工作台",
      index: "02",
      items: ["Claude Code", "Codex", "Obsidian 工作台", "Vibe Coding"],
      note: "本地工作台维护 70 个可复用 Skill，任务从拆解到交付可复核。"
    },
    {
      title: "Prompt 与评测",
      index: "03",
      items: ["Prompt 工程", "评测体系", "GEO 搜索增长"],
      note: "先定评测口径，再改 Prompt；提及、推荐与语境分开看。"
    },
    {
      title: "增长与商业化",
      index: "04",
      items: ["PLG 运营", "Meta / TikTok Ads", "SEM / 内容营销", "内容创作"],
      note: "从冷启动到对客交付，指标落到使用率与采纳率。"
    }
  ];

  var FLOWS = [
    {
      name: "内容工作台流水线",
      tag: "Obsidian + Codex · 核心流程",
      steps: ["选题", "素材", "大纲", "初稿", "去 AI 味", "配图", "排版", "上传", "发布"],
      note: "人写主观点骨架，AI 扩写润色；配图、排版、上传、发布四处设 <strong>人工确认关卡</strong>。"
    },
    {
      name: "GEO 监测与评测",
      tag: "Chrome 扩展 · 四平台",
      steps: ["词根", "5 条长尾", "问题包", "批量搜索", "语义蒸馏", "五项口径", "复核"],
      note: "区分 <strong>提及 / 推荐 / 推荐位置 / 语境准确 / 同名误判</strong>；12 类词根进入头部 TOP2。"
    },
    {
      name: "出海广告交付",
      tag: "Meta / TikTok / Google API",
      steps: ["接入 API", "pixel 安装", "创意生成", "投放策略", "日 / 周报诊断", "建议采纳"],
      note: "让建议真的进入业务动作，KA 客户使用率约 <strong>82%</strong>，建议采纳落地率约 75%。"
    }
  ];

  function renderSkills() {
    var groups = $("#skill-groups");
    if (!groups) return;
    groups.innerHTML = SKILL_GROUPS.map(function (g) {
      return '<div class="skill-group reveal">' +
        '<h3><span class="skill-index">' + g.index + '</span>' + esc(g.title) + '</h3>' +
        '<div><div class="skill-chips">' +
          g.items.map(function (i) { return '<span class="chip">' + esc(i) + '</span>'; }).join("") +
        '</div><p class="skill-footnote" style="margin-top:10px">' + esc(g.note) + '</p></div>' +
      '</div>';
    }).join("");

    var flows = $("#flow-list");
    flows.innerHTML = FLOWS.map(function (f, i) {
      var id = "flow-" + i;
      return '<div class="flow reveal">' +
        '<button class="flow-head" type="button" aria-expanded="false" aria-controls="' + id + '">' +
          '<span class="flow-num">' + ("0" + (i + 1)).slice(-2) + '</span>' +
          '<span class="flow-name">' + esc(f.name) + '</span>' +
          '<span class="flow-tag">' + esc(f.tag) + '</span>' +
          '<span class="chev" aria-hidden="true">▾</span>' +
        '</button>' +
        '<div class="flow-body" id="' + id + '"><div>' +
          '<ol class="flow-steps">' + f.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + '</ol>' +
          '<p class="flow-note">' + f.note + '</p>' +
        '</div></div>' +
      '</div>';
    }).join("");

    $$(".flow-head").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        var body = document.getElementById(btn.getAttribute("aria-controls"));
        if (body) body.classList.toggle("is-open", !open);
      });
    });
  }

  /* ---------------- 文章 ---------------- */

  function sortedArticles() {
    if (state.sort === "date") {
      var withDate = state.articles.filter(function (a) { return a.date; })
        .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      var without = state.articles.filter(function (a) { return !a.date; });
      return withDate.concat(without);
    }
    return state.articles.slice();
  }

  function excerptOf(a) {
    var e = String(a.excerpt || "").replace(/\s+/g, " ").trim();
    return e.replace(/^[，,。.\s]+/, "");
  }

  var coverNumber = 0;
  function coverMarkup(a, reader) {
    var content;
    if (a.cover) {
      content = '<img src="' + esc(mediaSrc(a.cover)) + '" alt="' + esc(a.title) + '的封面" loading="' + (reader ? "eager" : "lazy") + '" decoding="async">';
    } else {
      var labels = {
        "Agent 与工作流": ["Agent","工作流与判断"],
        "工具与实践": ["Tools","工具与实践"],
        "增长与商业": ["GEO","增长与商业"],
        "写作与思考": ["Writing","写作与思考"]
      }[a.category] || ["Notes",a.category || "思考与记录"];
      var chars = Array.from(a.title), pattern = "paper-cover-" + (++coverNumber);
      content = '<svg viewBox="0 0 640 360" role="img" aria-label="' + esc(a.title) + '的文字封面">' +
        '<defs><pattern id="' + pattern + '" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#ded8c7" stroke-opacity=".3"/></pattern></defs>' +
        '<rect width="640" height="360" fill="#fcf9ed"/><rect width="640" height="360" fill="url(#' + pattern + ')"/>' +
        '<circle cx="527" cy="146" r="114" fill="#ffe28a" opacity=".66"/><path d="M446 97h101v82H446zM463 118h66M463 135h42M463 152h56" fill="#fffaf0" stroke="#333" stroke-width="2"/>' +
        '<path d="M482 203h72M533 183l23 20-23 20" fill="none" stroke="#333" stroke-width="2.2"/><circle cx="456" cy="202" r="10" fill="#fff" stroke="#333" stroke-width="2"/>' +
        '<text x="36" y="38" fill="#a49a7a" font-family="monospace" font-size="12" letter-spacing="3">MOCHEN · WRITING</text>' +
        '<text x="36" y="124" fill="#1a1a1a" font-family="Helvetica Neue,sans-serif" font-weight="800" font-size="64" letter-spacing="-3">' + esc(labels[0]) + '</text>' +
        '<text x="40" y="163" fill="#7d7049" font-family="PingFang SC,sans-serif" font-size="17" letter-spacing="3">' + esc(labels[1]) + '</text>' +
        '<text x="40" y="276" fill="#444" font-family="PingFang SC,sans-serif" font-size="19">' + esc(chars.slice(0, 23).join("")) + '</text>' +
        '<text x="40" y="307" fill="#444" font-family="PingFang SC,sans-serif" font-size="19">' + esc(chars.slice(23, 46).join("")) + '</text>' +
        '</svg>';
    }
    return '<div class="' + (reader ? "reader-cover" : "article-cover") + '" data-article-cover="' + esc(a.id) + '">' + content + '</div>';
  }
  function articleCard(a, featured) {
    var meta = [];
    if (a.date) meta.push('<span>' + fmtDate(a.date) + '</span>');
    if (a.category) meta.push('<span class="cat">' + esc(a.category) + "</span>");
    meta.push('<span>' + a.minutes + ' 分钟</span>');
    return '<div class="motion-card motion-roll"><div class="card-hitbox rev stagger"><a class="article-card" href="#article/' + encodeURIComponent(a.id) + '" data-article="' + esc(a.id) + '">' +
      coverMarkup(a, false) + '<span class="article-card-copy">' +
      '<span class="article-meta">' + meta.join("<span aria-hidden=\"true\">·</span>") + '</span>' +
      '<span class="article-title">' + esc(a.title) + '</span>' +
      '<span class="article-excerpt">' + esc(excerptOf(a)) + '</span>' +
      '<span class="article-card-arrow" aria-hidden="true">↗</span></span>' +
    '</a></div></div>';
  }

  function deriveCategories() {
    var seen = [];
    state.articles.forEach(function (a) {
      if (a.category && seen.indexOf(a.category) === -1) seen.push(a.category);
    });
    return seen.sort(function (a, b) {
      return state.articles.filter(function (x) { return x.category === b; }).length -
             state.articles.filter(function (x) { return x.category === a; }).length;
    });
  }

  var LIST_KEY = "mochen.list.v1";

  function saveListState() {
    try {
      sessionStorage.setItem(LIST_KEY, JSON.stringify({
        filter: state.filter, query: state.query, sort: state.sort, shown: state.shown,
        listScroll: state.listScroll, listHash: state.listHash, returnId: state.returnId, returnArea: state.returnArea
      }));
    } catch (e) {}
  }

  function restoreListState() {
    try {
      var raw = sessionStorage.getItem(LIST_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && typeof s === "object") {
        if (s.filter) state.filter = s.filter;
        if (typeof s.query === "string") state.query = s.query;
        if (s.sort === "date" || s.sort === "default") state.sort = s.sort;
        if (typeof s.shown === "number" && s.shown >= 12) state.shown = Math.min(s.shown, 480);
        if (typeof s.listScroll === "number") state.listScroll = Math.max(0, s.listScroll);
        if (typeof s.listHash === "string" && s.listHash.indexOf("#articles") === 0) state.listHash = s.listHash;
        if (typeof s.returnId === "string") state.returnId = s.returnId;
        if (s.returnArea === "article-list" || s.returnArea === "article-feature") state.returnArea = s.returnArea;
      }
    } catch (e) {}
  }

  function syncListControls() {
    renderFiltersPressed();
    var sortBtn = $("#filters [data-sort]");
    if (sortBtn) {
      sortBtn.setAttribute("aria-pressed", String(state.sort === "date"));
      sortBtn.textContent = state.sort === "date" ? "按时间 ✓" : "按时间";
    }
    var input = $("#article-search");
    var clear = $("#search-clear");
    if (input && input.value !== state.query) input.value = state.query;
    if (clear) clear.hidden = !state.query;
  }

  function renderArticles() {
    var feature = $("#article-feature");
    if (!feature) return;
    restoreListState();
    state.categories = deriveCategories();
    if (state.filter !== "全部" && state.categories.indexOf(state.filter) === -1) {
      state.filter = "全部";
    }
    var sorted = sortedArticles();
    state.order = sorted;
    var featured = sorted.slice(0, 6);
    feature.innerHTML = featured.map(function (a) { return articleCard(a, true); }).join("") +
      '<a class="article-more" href="#articles" id="all-link">全部文章 · ' + state.articles.length + ' 篇 →</a>';

    var cats = ["全部"].concat(state.categories);
    var filters = $("#filters");
    filters.innerHTML = cats.map(function (c) {
      var isOn = (state.filter || "全部") === c;
      return '<button type="button" class="filter" data-cat="' + esc(c) + '" aria-pressed="' + isOn + '">' + esc(c) + '</button>';
    }).join("") +
      '<button type="button" class="filter filter-sort" data-sort="1" aria-pressed="' + (state.sort === "date") + '">按时间</button>';

    filters.addEventListener("click", function (e) {
      var catBtn = e.target.closest("[data-cat]");
      if (catBtn) {
        state.filter = catBtn.getAttribute("data-cat");
        state.shown = 12;
        renderFiltersPressed();
        renderList();
        saveListState();
        updateArticlesHash();
        return;
      }
      var sortBtn = e.target.closest("[data-sort]");
      if (sortBtn) {
        state.sort = state.sort === "date" ? "default" : "date";
        state.shown = 12;
        state.order = sortedArticles();
        sortBtn.setAttribute("aria-pressed", String(state.sort === "date"));
        sortBtn.textContent = state.sort === "date" ? "按时间 ✓" : "按时间";
        renderList();
        saveListState();
      }
    });

    var input = $("#article-search");
    var clear = $("#search-clear");
    var timer;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.query = input.value.trim();
        state.shown = 12;
        clear.hidden = !state.query;
        renderList();
        saveListState();
        updateArticlesHash();
      }, 140);
    });
    clear.addEventListener("click", function () {
      input.value = "";
      state.query = "";
      state.shown = 12;
      clear.hidden = true;
      renderList();
      saveListState();
      updateArticlesHash();
      input.focus();
    });

    $("#load-more").addEventListener("click", function () {
      state.shown += state.page;
      renderList();
      saveListState();
    });

    syncListControls();
    renderList();
  }

  function renderFiltersPressed() {
    $$("#filters .filter[data-cat]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-cat") === state.filter));
    });
  }

  function filteredArticles() {
    var q = state.query.toLowerCase();
    return state.order.filter(function (a) {
      if (state.filter !== "全部" && a.category !== state.filter) return false;
      if (!q) return true;
      return (a.title + " " + excerptOf(a) + " " + (a.category || "")).toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderList() {
    var list = $("#article-list");
    var count = $("#all-count");
    var wrap = $("#load-more-wrap");
    if (!list) return;
    var items = filteredArticles();
    if (count) count.textContent = items.length + " 篇" + (state.filter !== "全部" ? " · " + state.filter : "") + (state.query ? " · 搜索「" + state.query + "」" : "");
    var slice = items.slice(0, state.shown);
    if (!items.length) {
      list.innerHTML = '<p class="empty">没有找到匹配的文章。试试更短的关键词，或切换到「全部」。</p>';
    } else {
      list.innerHTML = slice.map(function (a) { return articleCard(a); }).join("");
    }
    wrap.hidden = items.length <= state.shown;
    $("#load-more").textContent = "继续加载 · 还有 " + Math.max(0, items.length - state.shown) + " 篇";
    $$(".stagger", list).forEach(function (el, i) { el.style.setProperty("--stagger-delay", (50 + Math.min(i, 4) * 80) + "ms"); });
    if (window.MochenMotion) window.MochenMotion.scan();
  }

  function updateArticlesHash() {
    if (state.activeArticle) return;
    var params = [];
    if (state.filter && state.filter !== "全部") params.push("cat=" + encodeURIComponent(state.filter));
    if (state.query) params.push("q=" + encodeURIComponent(state.query));
    var h = "#articles" + (params.length ? "?" + params.join("&") : "");
    if (location.hash !== h) history.replaceState({ kind: "tab", tab: "articles" }, "", h);
  }

  /* ---------------- 关于 ---------------- */

  function renderAbout() {
    var box = $("#about-body");
    if (!box || !state.profile) return;
    var p = state.profile;
    var m = p.metrics || [];
    var jobs = p.experience || [];
    box.innerHTML =
      '<div class="about-intro">' +
        '<p class="about-lead">' + esc(p.headline) + '</p>' +
        '<p class="about-text">' + esc(p.intro) + '</p>' +
        '<div class="metrics">' + m.map(function (x) {
          return '<div class="metric-item"><div class="metric-value">' + esc(x.value) + '</div><div class="metric-label">' + esc(x.label) + '</div></div>';
        }).join("") + '</div>' +
      '</div>' +

      '<div class="block-head"><h3>工作经历</h3><span class="rule"></span><span class="idx">Experience / ' + jobs.length + '</span></div>' +
      '<div class="experience-list">' + jobs.map(function (j) {
        return '<article class="job">' +
          '<div>' +
            '<div class="job-company">' + esc(j.company) + '</div>' +
            '<div class="job-role">' + esc(j.role) + '</div>' +
            '<p class="job-summary">' + esc(j.summary) + '</p>' +
            (j.details && j.details.length ? '<ul class="job-details">' + j.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + '</ul>' : '') +
          '</div>' +
        '</article>';
      }).join("") + '</div>' +

      '<div class="block-head"><h3>写作与兴趣</h3><span class="rule"></span><span class="idx">Personal</span></div>' +
      '<div class="info-grid">' +
        '<div class="info-block"><h4>内容与影响</h4><p>' + (p.influence || []).map(esc).join("<br>") + '</p></div>' +
        '<div class="info-block"><h4>兴趣</h4><div class="inline-tags">' + (p.interests || []).map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join("") + '</div></div>' +
      '</div>';
  }

  /* ---------------- 交流 ---------------- */

  function renderConnect() {
    var box = $("#connect-body");
    if (!box || !state.profile) return;
    var name = state.profile.wechat || "Agent 陌晨";
    box.innerHTML =
      '<div class="wechat-card reveal">' +
        '<div class="wechat-copy">' +
          '<div class="wechat-kicker">WECHAT OFFICIAL ACCOUNT</div>' +
          '<div class="wechat-name" id="wechat-name">' + esc(name) + '</div>' +
          '<p class="wechat-note">在公众号「' + esc(name) + '」，继续聊 AI、写作和做事。</p>' +
        '</div>' +
        '<button class="copy-btn" type="button" id="copy-wechat" aria-describedby="copy-status">' +
          '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="5.2" y="5.2" width="8.6" height="8.6" rx="2"/><path d="M10.8 5.2V3.6a1.6 1.6 0 0 0-1.6-1.6H3.6A1.6 1.6 0 0 0 2 3.6v5.6a1.6 1.6 0 0 0 1.6 1.6h1.6"/></svg>' +
          '复制公众号名称' +
        '</button>' +
        '<p class="copy-status" id="copy-status" role="status" aria-live="polite"></p>' +
      '</div>' +
      '<div class="connect-lines">' +
        '<div class="connect-line"><span class="n">01</span><span><strong>公众号</strong> · 更新频率最高</span><span class="val">' + esc(name) + '</span></div>' +
        '<div class="connect-line"><span class="n">02</span><span><strong>写作</strong> · 已收录 ' + state.articles.length + ' 篇</span><span class="val">本站</span></div>' +
        '<div class="connect-line"><span class="n">03</span><span><strong>内容影响</strong> · 人人都是产品经理 / 虎嗅签约作者</span><span class="val">署名</span></div>' +
        '<div class="connect-line"><span class="n">04</span><span><strong>社区</strong> · WaytoAGI 共创者</span><span class="val">共创</span></div>' +
      '</div>';

    var btn = $("#copy-wechat");
    var status = $("#copy-status");
    var t;
    function show(msg) {
      status.textContent = msg;
      status.classList.add("is-visible");
      clearTimeout(t);
      t = setTimeout(function () { status.classList.remove("is-visible"); }, 2600);
    }
    btn.addEventListener("click", function () {
      function done() { show("已复制「" + name + "」，去微信搜索就能找到。"); }
      function fallback() {
        try {
          var ta = document.createElement("textarea");
          ta.value = name;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          done();
        } catch (e) {
          show("请手动复制：" + name);
        }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(name).then(done).catch(fallback);
      } else fallback();
    });
  }

  /* ---------------- 全文 ---------------- */

  function mediaSrc(src) {
    if (!src) return src;
    if (/^media\//.test(src)) return root + "data/" + src;
    return src;
  }

  function hydrateBody(container) {
    $$("img", container).forEach(function (img) {
      img.loading = "lazy";
      img.decoding = "async";
      var raw = img.getAttribute("src") || "";
      var fixed = mediaSrc(raw);
      if (fixed !== raw) img.setAttribute("src", fixed);
      if (!img.getAttribute("alt")) img.setAttribute("alt", "文章配图");
      img.addEventListener("error", function () {
        if (img.dataset.failed) return;
        img.dataset.failed = "1";
        var note = document.createElement("span");
        note.className = "img-fallback";
        var host = "";
        try { host = new URL(img.src, location.href).hostname; } catch (e) {}
        note.innerHTML = "图：" + esc(img.getAttribute("alt") || "文章配图") + "（暂时无法加载）" + (host ? '<span>' + esc(host) + "</span>" : "");
        if (img.parentNode) img.parentNode.replaceChild(note, img);
      });
    });
    $$("a", container).forEach(function (a) {
      var h = a.getAttribute("href") || "";
      if (/^https?:/.test(h)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    });
    $$("script, iframe", container).forEach(function (n) { n.remove(); });
    // 全文只保留一个语义 h1：正文里的 h1 降级为 h2
    $$("h1", container).forEach(function (h) {
      var h2 = document.createElement("h2");
      h2.innerHTML = h.innerHTML;
      Array.prototype.slice.call(h.attributes).forEach(function (a) { h2.setAttribute(a.name, a.value); });
      h.parentNode.replaceChild(h2, h);
    });
  }

  // 保留原文图片；只去除与阅读页标题重复的开头标题及空段落。
  function stripBodyLead(body, meta) {
    var norm = function (s) { return String(s || "").replace(/\s+/g, "").trim(); };
    var limit = 6;
    var node = body.firstElementChild;
    while (node && limit-- > 0) {
      var next = node.nextElementSibling;
      var tag = node.tagName;
      var txt = norm(node.textContent);
      if ((tag === "H1" || tag === "H2") && txt === norm(meta.title)) {
        node.remove();                       // 与页面标题重复的小标题
      } else if (txt === "" && node.children.length === 0 && (tag === "DIV" || tag === "P")) {
        node.remove();                       // 空段落
      } else {
        break;
      }
      node = next;
    }
  }

  var articleCache = {}, navigationToken = 0;
  function loadArticle(id) {
    if (!articleCache[id]) {
      articleCache[id] = loadJSON("data/articles/" + id + ".json").catch(function (error) {
        delete articleCache[id];
        throw error;
      });
    }
    return articleCache[id];
  }
  function articleHash() {
    var params = [];
    if (state.filter !== "全部") params.push("cat=" + encodeURIComponent(state.filter));
    if (state.query) params.push("q=" + encodeURIComponent(state.query));
    return "#articles" + (params.length ? "?" + params.join("&") : "");
  }
  function jumpTo(y) { window.scrollTo({ top: Math.max(0, y), behavior: "instant" }); }
  function workTop() { return $("#work").getBoundingClientRect().top + scrollY - 24; }
  function rememberList(id, source) {
    state.returnId = id;
    state.listHash = articleHash();
    state.listScroll = state.tab === "articles" ? scrollY : Math.max(0, workTop());
    state.returnArea = source && source.closest("#article-list") ? "article-list" : "article-feature";
    saveListState();
    history.replaceState({ kind: "tab", tab: state.tab, y: scrollY, returnId: id }, "", location.href);
  }
  function promoteCover(body, meta) {
    if (!meta.cover) return;
    var first = $("img", body);
    if (!first) return;
    var expected = new URL(mediaSrc(meta.cover), location.href).href;
    if (new URL(first.getAttribute("src"), location.href).href !== expected) return;
    var parent = first.parentElement;
    first.remove();
    // The original first image is now above the body. Keep any original caption.
    if (parent !== body && !parent.textContent.trim() && !parent.querySelector("img,video,svg")) parent.remove();
  }
  function transition(update, opts) {
    if (window.MochenMotion) return window.MochenMotion.pageTransition(update, opts);
    update();
    return Promise.resolve();
  }
  function openArticle(id, push, source) {
    var meta = state.byId[id];
    if (!meta) return switchTab("articles", { scroll: true });
    if (state.activeArticle === id) return Promise.resolve();
    var ticket = ++navigationToken;
    if (state.activeArticle && push !== false) history.replaceState({ kind: "article", article: state.activeArticle, y: scrollY }, "", location.href);
    if (!state.activeArticle && push !== false) rememberList(id, source);
    if (!state.returnId) { state.returnId = id; state.listScroll = Math.max(0, workTop()); }
    if (source) source.setAttribute("aria-busy", "true");
    return loadArticle(id).catch(function () {
      return { html: "<p>正文暂时无法载入，请刷新重试。</p>" };
    }).then(function (full) {
      if (ticket !== navigationToken) return;
      var from = state.activeArticle ? $(".reader-cover") : source && $(".article-cover", source);
      return transition(function () {
        if (ticket !== navigationToken) return;
        state.activeArticle = id;
        state.fullArticle = full;
        document.body.classList.add("reader-mode");
        $("#reader").hidden = false;
        $("#reader-title").textContent = meta.title;
        $("#reader-date").textContent = meta.date ? fmtDate(meta.date) : "未标注日期";
        $("#reader-tag").textContent = meta.category || "文章";
        $("#reader-minutes").textContent = meta.minutes + " 分钟阅读";
        $("#reader-cover-slot").innerHTML = coverMarkup(meta, true);
        $("#copy-article").textContent = "复制 Markdown";
        $("#copy-article").removeAttribute("data-status");
        document.title = meta.title + " | 陌晨";
        $("#reader-content").innerHTML = '<div class="article-body" id="article-body"></div>' +
          '<div class="reader-source"><span>来源：公众号「Agent 陌晨」</span></div>' +
          '<div class="reader-foot" id="reader-foot"></div>';
        var body = $("#article-body");
        body.innerHTML = (full.html || "<p>这篇文章暂时没有正文。</p>").split('src="media/').join('src="' + root + 'data/media/');
        hydrateBody(body);
        stripBodyLead(body, meta);
        promoteCover(body, meta);
        renderReaderFoot(meta);
        if (push !== false && location.hash !== "#article/" + id) {
          history.pushState({ kind: "article", article: id }, "", "#article/" + id);
        }
        jumpTo(push === false && history.state && history.state.kind === "article" && typeof history.state.y === "number" ? history.state.y : 0);
      }, { fromCover: from, toCover: function () { return $(".reader-cover"); } });
    }).finally(function () {
      if (source) source.removeAttribute("aria-busy");
    });
  }

  function renderReaderFoot(meta) {
    var order = state.order.length ? state.order : sortedArticles();
    var idx = order.findIndex(function (a) { return a.id === meta.id; });
    var prev = idx > 0 ? order[idx - 1] : null;
    var next = idx > -1 && idx < order.length - 1 ? order[idx + 1] : null;
    var related = order.filter(function (a) { return a.id !== meta.id && a.category === meta.category; }).slice(0, 3);
    var foot = $("#reader-foot");
    foot.innerHTML =
      '<div class="prevnext">' +
        (prev ? '<a class="pn" href="#article/' + encodeURIComponent(prev.id) + '"><span class="dir">← 上一篇</span><span class="ttl">' + esc(prev.title) + '</span></a>'
              : '<span class="pn is-empty"><span class="dir">← 上一篇</span><span class="ttl">已经是第一篇</span></span>') +
        (next ? '<a class="pn is-next" href="#article/' + encodeURIComponent(next.id) + '"><span class="dir">下一篇 →</span><span class="ttl">' + esc(next.title) + '</span></a>'
              : '<span class="pn is-next is-empty"><span class="dir">下一篇 →</span><span class="ttl">已经是最新一篇</span></span>') +
      '</div>' +
      (related.length ? '<div class="block-head" style="margin:22px 0 6px"><h3>同类文章</h3><span class="rule"></span><span class="idx">' + esc(meta.category) + '</span></div>' +
        related.map(function (a) {
          return '<a class="article-card" href="#article/' + encodeURIComponent(a.id) + '" style="border-top-color:#f3f1ea">' +
            '<span class="article-meta"><span>' + (a.date ? fmtDate(a.date) : "未标注日期") + '</span><span>' + a.minutes + ' 分钟</span></span>' +
            '<span class="article-title" style="font-size:15px">' + esc(a.title) + '</span></a>';
        }).join("") : '') +
      '<div class="reader-back-row" style="margin-top:18px"><a href="#articles" class="back-link">← 返回全部文章</a><a href="index.html" style="color:#999">回到首页</a></div>';
  }

  function closeReader() {
    state.activeArticle = null;
    state.fullArticle = null;
    document.body.classList.remove("reader-mode");
    $("#reader").hidden = true;
    document.title = "陌晨 — Makes Things. · MOCHEN";
  }

  /* ---------------- 标签页 ---------------- */

  var tabs = [];
  function activateTab(name, animate) {
    state.tab = name;
    tabs.forEach(function (t) {
      var on = t.id === "tab-" + name;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) {
        panel.hidden = !on;
        if (on) {
          panel.classList.remove("panel-enter");
          void panel.offsetWidth;
          panel.classList.add("is-in");
          if (animate !== false) panel.classList.add("panel-enter");
          var number = $(".reel-number", panel);
          if (number && animate !== false) {
            number.classList.remove("on");
            void number.offsetWidth;
          }
        }
      }
    });
    $$("[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    if (window.MochenMotion) window.MochenMotion.refresh();
  }
  function scrollTab(opts) {
    if (opts.restore) { jumpTo(state.listScroll || Math.max(0, workTop())); return; }
    if (typeof opts.y === "number") { jumpTo(opts.y); return; }
    if (opts.scroll) window.scrollTo({ top: typeof opts.top === "number" ? opts.top : workTop(), behavior: reduceMotion ? "instant" : "smooth" });
  }
  function switchTab(name, opts) {
    opts = opts || {};
    if (!TAB_HASH[name]) name = "work";
    navigationToken++;
    var fromReader = !!state.activeArticle;
    if (fromReader && opts.push) history.replaceState({ kind: "article", article: state.activeArticle, y: scrollY }, "", location.href);
    var id = state.returnId;
    var hash = name === "articles" ? articleHash() : TAB_HASH[name];
    function updateHash() {
      if (opts.hash === false) return;
      if (opts.push && location.hash !== hash) history.pushState({ kind: "tab", tab: name, y: scrollY }, "", hash);
      else history.replaceState({ kind: "tab", tab: name, y: scrollY }, "", hash);
    }
    if (fromReader) {
      return transition(function () {
        closeReader();
        activateTab(name, false);
        scrollTab(opts);
        updateHash();
      }, {
        fromCover: name === "articles" ? $(".reader-cover") : null,
        toCover: function () {
          if (name !== "articles" || !id) return null;
          return $('#' + state.returnArea + ' [data-article-cover="' + id + '"]') || $('#panel-articles [data-article-cover="' + id + '"]');
        }
      });
    }
    var unchanged = state.tab === name && $("#panel-" + name).classList.contains("is-in");
    if (!unchanged || opts.force) activateTab(name, opts.animate);
    updateHash();
    scrollTab(opts);
    return Promise.resolve();
  }

  function initTabs() {
    tabs = $$(".tab");
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { switchTab(tab.id.replace("tab-", "")); });
      tab.addEventListener("keydown", function (e) {
        var k = e.key;
        var next = -1;
        if (k === "ArrowRight" || k === "ArrowDown") next = (i + 1) % tabs.length;
        if (k === "ArrowLeft" || k === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
        if (k === "Home") next = 0;
        if (k === "End") next = tabs.length - 1;
        if (next >= 0) {
          e.preventDefault();
          tabs[next].focus();
          switchTab(tabs[next].id.replace("tab-", ""));
        }
      });
    });
  }

  /* ---------------- 路由 ---------------- */

  function parseHash() {
    var h = location.hash || "";
    var qIndex = h.indexOf("?");
    var qs = "";
    if (qIndex > -1) { qs = h.slice(qIndex + 1); h = h.slice(0, qIndex); }
    var params = new URLSearchParams(qs);
    if (h.indexOf("#article/") === 0) {
      return { kind: "article", id: decodeURIComponent(h.slice("#article/".length)), params: params };
    }
    if (HASH_TAB[h]) return { kind: "tab", tab: HASH_TAB[h], params: params };
    return { kind: "tab", tab: "work", params: params };
  }

  function route(first) {
    if (!state.profile) return;
    var r = parseHash();
    if (r.kind === "article") {
      if (state.byId[r.id]) {
        return openArticle(r.id, false);
      } else {
        history.replaceState(null, "", "#articles");
        return switchTab("articles", { hash: false, scroll: true });
      }
    }
    var returning = !!state.activeArticle;
    if (r.tab === "articles") {
      if (r.params.has("cat") || r.params.has("q")) {
        var c = r.params.get("cat");
        state.filter = c && state.categories.indexOf(c) !== -1 ? c : "全部";
        state.query = r.params.get("q") || "";
        saveListState();
      } else {
        restoreListState();
        if (state.filter !== "全部" && state.categories.indexOf(state.filter) === -1) state.filter = "全部";
      }
      syncListControls();
      renderList();
    }
    var saved = history.state;
    return switchTab(r.tab, {
      hash: false,
      restore: returning && r.tab === "articles",
      y: !first && !(returning && r.tab === "articles") && saved && typeof saved.y === "number" ? saved.y : undefined,
      scroll: first && !!location.hash && r.tab !== "work"
    });
  }

  function initRouter() {
    history.scrollRestoration = "manual";
    var routeQueued = false;
    function scheduleRoute() {
      if (routeQueued) return;
      routeQueued = true;
      queueMicrotask(function () { routeQueued = false; route(false); });
    }
    window.addEventListener("hashchange", scheduleRoute);
    window.addEventListener("popstate", scheduleRoute);
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest("a");
      if (!a || a.closest(".article-body")) return;
      var href = a.getAttribute("href");
      if (href && href.indexOf("#article/") === 0) {
        e.preventDefault();
        openArticle(decodeURIComponent(href.slice(9)), true, a);
        return;
      }
      if (href === "index.html") {
        e.preventDefault(); switchTab("work", { top: 0, scroll: true }); return;
      }
      if (href === "#work" && a.classList.contains("scroll-hint")) {
        e.preventDefault();
        window.scrollTo({ top: workTop(), behavior: reduceMotion ? "instant" : "smooth" });
        return;
      }
      if (HASH_TAB[href]) {
        e.preventDefault();
        if (href === "#articles" && a.classList.contains("back-link")) {
          switchTab("articles", { restore: true, push: true });
        } else if (a.id === "all-link") {
          switchTab("articles", { scroll: false });
          var target = $("#articles");
          window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - 24, behavior: reduceMotion ? "instant" : "smooth" });
        } else {
          switchTab(HASH_TAB[href], { scroll: true });
        }
        return;
      }
      if (href === "#") e.preventDefault();
    });
    // Warm only local article JSON so a click can transition the complete page.
    document.addEventListener("pointerover", function (e) {
      var a = e.target.closest('a[href^="#article/"]');
      if (a) loadArticle(a.getAttribute("href").slice(9)).catch(function () {});
    }, { passive: true });
    $("#copy-article").addEventListener("click", function () {
      if (!state.fullArticle) return;
      var button = this, id = state.activeArticle;
      function copied() {
        button.textContent = "已复制 ✓"; button.dataset.status = "copied";
        setTimeout(function () { button.textContent = "复制 Markdown"; button.removeAttribute("data-status"); }, 2600);
      }
      function fallback(text) {
        var ta = document.createElement("textarea"); ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select();
        var ok = document.execCommand("copy"); ta.remove();
        if (ok) copied(); else button.textContent = "请手动复制正文";
      }
      button.setAttribute("aria-busy", "true");
      fetch(root + "data/markdown/" + id + ".md").then(function (response) {
        if (!response.ok) throw new Error("Markdown unavailable");
        return response.text();
      }).then(function (text) {
        if (navigator.clipboard) return navigator.clipboard.writeText(text).then(copied).catch(function () { fallback(text); });
        fallback(text);
      }).catch(function () { button.textContent = "复制失败，请重试"; })
        .finally(function () { button.removeAttribute("aria-busy"); });
    });
  }


  /* ---------------- 启动 ---------------- */

  function boot() {
    initTabs();
    initRouter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
