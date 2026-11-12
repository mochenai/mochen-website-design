/* Local, operable illustrations of the projects. No external requests. */
(function () {
  "use strict";
  var controllers = [], mounted = new WeakSet();
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; }); }
  function tabs(items, action) {
    return '<div class="demo-tabs" role="group">' + items.map(function (name, i) {
      return '<button type="button" class="demo-tab" data-demo-action="' + action + '" data-value="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(name) + '</button>';
    }).join("") + '</div>';
  }
  function visual(kind, p) {
    var content = "", badge = "", label = "";
    if (kind === "workflow") {
      label = "任务工作台"; badge = "70 SKILLS";
      content = tabs(["内容创作","数据分析","市场调研"], "task") +
        '<div class="mini-flow"><b class="mini-node active">任务</b><span>→</span><b class="mini-node">Skill</b><span>→</span><b class="mini-node">确认</b><span>→</span><b class="mini-node">交付</b></div>' +
        '<div class="demo-output"><span class="demo-line"><i>✓</i><span>整理素材</span></span><span class="demo-line"><i>✓</i><span>形成观点骨架</span></span><span class="demo-line"><i>✓</i><span>生成可编辑结果</span></span></div>' +
        '<div class="demo-bottom"><button class="demo-button" type="button" data-demo-action="run">开始处理 →</button><button class="demo-button alt" type="button" data-demo-action="confirm" hidden>确认交付 ✓</button><span class="demo-status">选择任务，开始处理</span></div>';
    } else if (kind === "geo") {
      label = "GEO 评测"; badge = "4 PLATFORMS";
      content = '<label class="mini-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="GEO 演示搜索" placeholder="输入一个词根…" autocomplete="off"></label>' +
        tabs(["豆包","元宝","千问","DeepSeek"], "platform").replace('class="demo-tabs"','class="demo-tabs geo-platforms"') +
        '<div class="geo-results"><div class="geo-row" data-key="提及 AI 搜索"><span>品牌提及</span><strong>待检查</strong></div><div class="geo-row" data-key="推荐 AI 搜索"><span>主动推荐</span><strong>待检查</strong></div><div class="geo-row" data-key="位置 AI 搜索"><span>推荐位置</span><strong>待复核</strong></div></div>' +
        '<div class="demo-bottom"><span class="demo-status">提及 ≠ 推荐</span><button class="demo-button alt" data-demo-action="rerun" type="button">重跑 ↻</button></div><p class="demo-mini-note">五项口径 · 结果为功能示意</p>';
    } else if (kind === "growth") {
      label = "广告 Agent"; badge = "OPERATIONS";
      content = tabs(["Meta","TikTok","Google"], "channel") +
        '<div class="ads-kpis"><span><b>82%</b>KA 客户使用率</span><span><b>75%</b>建议采纳落地率</span></div>' +
        '<div class="ads-track"><span>接入</span><span>创意</span><span>策略</span><span>诊断</span></div>' +
        '<div class="ads-advice"><div><p>建议示例：先检查转化回传，再调整创意与策略。</p></div></div>' +
        '<div class="demo-bottom"><button class="demo-button alt" data-demo-action="advice" type="button" aria-expanded="false">查看建议 →</button><button class="demo-button" data-demo-action="adopt" type="button" hidden>采纳建议 ✓</button><span class="demo-status">Meta · 经营诊断</span></div>';
    } else if (kind === "writing") {
      label = "写作 Skill"; badge = "HUMAN IN THE LOOP";
      content = tabs(["主观点","AI 扩写","人工确认"], "writing-step") +
        '<div class="writing-sheet"><p class="sheet-label">AUTHOR / 陌晨</p><p class="writing-copy">AI 做手，<br>人保留判断。</p><span class="writing-stamp">作者已确认 ✓</span></div>' +
        '<div class="demo-bottom"><button type="button" class="demo-button alt" data-demo-action="polish">去 AI 味 →</button><button type="button" class="demo-button" data-demo-action="approve" hidden>确认观点 ✓</button><span class="demo-status">从观点骨架开始</span></div>';
    } else if (kind === "website") {
      label = "个人网站设计skill"; badge = "MOCHEN DESIGN";
      content = tabs(["文章专题", "作品集", "产品介绍"], "website-type") +
        '<div class="website-sheet" data-website-layout="0"><p class="sheet-label">MOCHEN / WEBSITE</p><p class="website-title">读一点，想一点。</p><p class="website-nav">主题 · 全文 · 检索</p><div class="website-blocks" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>' +
        '<div class="demo-bottom"><a class="demo-button alt" href="' + esc(p.href || "works/website-design-skill/index.html") + '">打开使用说明 ↗</a><span class="demo-status">文章专题 · 阅读、搜索与筛选</span></div><p class="demo-mini-note">点击切换页面结构示意</p>';
    } else {
      label = "场景 Agent"; badge = "25 AGENTS";
      var names = ["设计素材","内容创作","学习助理","科研问答","知识检索","Prompt 助手"];
      var icons = ["◇","✎","⌘","✧","⌕","↗"];
      content = '<label class="mini-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Agent 演示搜索" placeholder="搜索场景…" autocomplete="off"></label>' +
        '<div class="agent-options">' + names.map(function (name, i) {
          return '<button type="button" class="agent-option" data-demo-action="agent" data-value="' + i + '" data-name="' + esc(name) + '" aria-pressed="false"><span aria-hidden="true">' + icons[i] + '</span>' + esc(name) + '</button>';
        }).join("") + '</div><p class="demo-no-results" hidden>没有匹配的场景，试试「知识」。</p>' +
        '<div class="agent-answer"><strong>Prompt + 知识库</strong><span>选择一个场景，查看处理过程。</span></div>';
    }
    return '<div class="demo" id="demo-' + esc(p.id) + '" data-demo="' + esc(kind) + '" data-demo-active="false" data-demo-mode="auto" data-phase="idle" aria-label="' + esc(p.title) + '交互演示">' +
      '<span class="demo-badge" aria-hidden="true">' + badge + '</span><div class="demo-window"><div class="demo-bar"><span class="demo-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>' + label + '</span><button type="button" class="demo-replay" data-demo-action="replay" aria-label="重播' + esc(p.title) + '演示">↻</button></div><div class="demo-content">' + content + '</div></div><i class="demo-pointer" aria-hidden="true"></i></div>';
  }

  function Demo(el) {
    this.el = el; this.kind = el.dataset.demo; this.auto = true; this.visible = false;
    this.timers = new Set(); this.task = 0; this.platform = 0; this.channel = 0;
    var self = this;
    el.addEventListener("click", function (event) {
      var button = event.target.closest("[data-demo-action]");
      if (!button) return;
      var action = button.dataset.demoAction, value = Number(button.dataset.value || 0);
      if (action === "replay") { self.auto = true; el.dataset.demoMode = "auto"; self.start(); return; }
      self.manual();
      if (action === "task") { self.task = value; self.resetWorkflow(); }
      if (action === "run") self.runWorkflow(false);
      if (action === "confirm") self.finishWorkflow();
      if (action === "platform") { self.platform = value; self.select("platform", value); self.runGeo(); }
      if (action === "rerun") self.runGeo();
      if (action === "channel") { self.channel = value; self.select("channel", value); self.runAds(false); }
      if (action === "advice") self.advice(!self.find(".ads-advice").classList.contains("on"));
      if (action === "adopt") self.adopt();
      if (action === "writing-step") self.writingStep(value);
      if (action === "polish") self.runWriting(false);
      if (action === "approve") self.writingStep(2);
      if (action === "agent") self.chooseAgent(value);
      if (action === "website-type") self.websiteType(value);
    });
    el.addEventListener("focusin", function (event) { if (event.target.matches("input")) self.manual(); });
    var input = el.querySelector("input");
    if (input) input.addEventListener("input", function () { self.manual(); self.filter(); });
    if (this.kind === "website") this.websiteType(0);
  }
  Demo.prototype.find = function (selector) { return this.el.querySelector(selector); };
  Demo.prototype.all = function (selector) { return Array.from(this.el.querySelectorAll(selector)); };
  Demo.prototype.clear = function () { this.timers.forEach(clearTimeout); this.timers.clear(); };
  Demo.prototype.after = function (ms, fn) {
    var self = this;
    if (window.MochenMotion.isReduced()) { fn.call(self); return; }
    var timer = setTimeout(function () { self.timers.delete(timer); fn.call(self); }, ms);
    this.timers.add(timer);
  };
  Demo.prototype.manual = function () { this.auto = false; this.clear(); this.el.dataset.demoMode = "manual"; };
  Demo.prototype.select = function (action, value) {
    this.all('[data-demo-action="' + action + '"]').forEach(function (button) { button.setAttribute("aria-pressed", String(Number(button.dataset.value) === value)); });
  };
  Demo.prototype.status = function (text) { var el = this.find(".demo-status"); if (el) el.textContent = text; };
  Demo.prototype.phase = function (phase) { this.el.dataset.phase = phase; };
  Demo.prototype.start = function () {
    this.clear();
    if (!this.visible || !this.auto || document.hidden || window.MochenMotion.isReduced()) return;
    this.el.dataset.demoMode = "auto";
    var self = this;
    if (this.kind === "workflow") { this.resetWorkflow(); this.after(800, function () { this.runWorkflow(true); }); }
    if (this.kind === "geo") {
      this.platform = (this.platform + 1) % 4; this.select("platform", this.platform);
      this.type(this.find("input"), "AI 搜索", 130, function () { self.runGeo(); });
    }
    if (this.kind === "growth") { this.channel = (this.channel + 1) % 3; this.select("channel", this.channel); this.runAds(true); }
    if (this.kind === "writing") this.runWriting(true);
    if (this.kind === "agents") this.type(this.find("input"), "知识", 220, function () { self.chooseAgent(4); });
    if (this.kind === "website") { this.websitePage = ((this.websitePage || 0) + 1) % 3; this.websiteType(this.websitePage); }
    this.after(8500, function () { this.start(); });
  };
  Demo.prototype.type = function (input, text, speed, done) {
    var self = this, i = 0;
    input.value = ""; this.filter(); this.phase("running");
    function next() {
      if (i >= text.length) { if (done) done(); return; }
      input.value = text.slice(0, ++i); self.filter();
      self.after(speed, next);
    }
    this.after(600, next);
  };
  Demo.prototype.websiteType = function (value) {
    this.websitePage = value;
    this.select("website-type", value);
    this.find(".website-sheet").dataset.websiteLayout = String(value);
    this.find(".website-title").textContent = ["读一点，想一点。", "把做过的，摆出来。", "让功能，说清楚。"][value];
    this.find(".website-nav").textContent = ["主题 · 全文 · 检索", "作品 · 案例 · 关于", "能力 · 流程 · 使用"][value];
    this.status(["文章专题 · 阅读、搜索与筛选", "作品集 · 案例展示与详情", "产品介绍 · 功能、流程与用法"][value]);
  };
  Demo.prototype.resetWorkflow = function () {
    var labels = [
      ["整理素材","形成观点骨架","生成可编辑结果"],
      ["核对数据口径","完成分析过程","导出可复核结果"],
      ["收集公开材料","交叉核对来源","形成研究记录"]
    ][this.task];
    this.select("task", this.task); this.phase("idle");
    this.all(".mini-node").forEach(function (node, i) { node.classList.toggle("active", i === 0); node.classList.remove("done"); });
    this.all(".demo-line").forEach(function (line, i) { line.classList.remove("done"); line.querySelector("span").textContent = labels[i]; });
    this.find('[data-demo-action="run"]').hidden = false;
    this.find('[data-demo-action="run"]').textContent = "开始处理 →";
    this.find('[data-demo-action="confirm"]').hidden = true;
    this.status("选择任务，开始处理");
  };
  Demo.prototype.runWorkflow = function (autoConfirm) {
    this.resetWorkflow(); this.phase("running"); this.status("Skill 正在处理");
    var self = this, nodes = this.all(".mini-node"), lines = this.all(".demo-line");
    nodes[0].classList.remove("active"); nodes[0].classList.add("done"); nodes[1].classList.add("active");
    this.after(450, function () { lines[0].classList.add("done"); });
    this.after(1000, function () { lines[1].classList.add("done"); });
    this.after(1600, function () {
      nodes[1].classList.remove("active"); nodes[1].classList.add("done"); nodes[2].classList.add("active");
      self.phase("review"); self.status("等待人工确认");
      self.find('[data-demo-action="run"]').hidden = true;
      self.find('[data-demo-action="confirm"]').hidden = false;
    });
    if (autoConfirm) this.after(3400, function () { this.finishWorkflow(); });
  };
  Demo.prototype.finishWorkflow = function () {
    this.phase("done"); this.status("交付已就绪 ✓");
    this.all(".mini-node").forEach(function (node, i) { node.classList.toggle("active", i === 3); node.classList.toggle("done", i < 3); });
    this.all(".demo-line").forEach(function (line) { line.classList.add("done"); });
    this.find('[data-demo-action="confirm"]').hidden = true;
    var run = this.find('[data-demo-action="run"]'); run.hidden = false; run.textContent = "再处理一次 ↻";
  };
  Demo.prototype.filter = function () {
    var input = this.find("input"); if (!input) return;
    var query = input.value.trim().toLowerCase(), count = 0;
    if (this.kind === "agents") {
      this.all(".agent-option").forEach(function (button) {
        button.hidden = query && button.dataset.name.toLowerCase().indexOf(query) === -1;
        if (!button.hidden) count++;
      });
      this.find(".demo-no-results").hidden = count > 0;
    } else {
      this.status(query ? "词根：" + input.value.trim() : "提及 ≠ 推荐");
    }
  };
  Demo.prototype.runGeo = function () {
    var rows = this.all(".geo-row"), self = this;
    this.phase("running");
    rows.forEach(function (row) { row.classList.add("pending"); row.classList.remove("completed"); row.querySelector("strong").textContent = "检查中…"; });
    ["已提及 ✓","已推荐 ✓","TOP2 · 示例"].forEach(function (text, i) {
      self.after(450 + i * 550, function () {
        rows[i].classList.remove("pending"); rows[i].classList.add("completed"); rows[i].querySelector("strong").textContent = text;
        if (i === 2) { self.phase("done"); self.status(["豆包","元宝","千问","DeepSeek"][self.platform] + " · 等待复核"); }
      });
    });
  };
  Demo.prototype.advice = function (open) {
    this.find(".ads-advice").classList.toggle("on", open);
    this.find('[data-demo-action="advice"]').setAttribute("aria-expanded", String(open));
    this.find('[data-demo-action="adopt"]').hidden = !open;
    this.phase(open ? "review" : "idle");
  };
  Demo.prototype.adopt = function () {
    this.find(".ads-advice p").textContent = "已加入任务：检查回传 → 调整创意 → 复核效果。";
    this.find('[data-demo-action="adopt"]').textContent = "已采纳 ✓";
    this.status("任务已记录"); this.phase("done");
  };
  Demo.prototype.runAds = function (auto) {
    this.advice(false); this.phase("running");
    this.find(".ads-advice p").textContent = "建议示例：先检查转化回传，再调整创意与策略。";
    this.find('[data-demo-action="adopt"]').textContent = "采纳建议 ✓";
    this.status(["Meta","TikTok","Google"][this.channel] + " · 经营诊断");
    var track = this.all(".ads-track span"), self = this;
    track.forEach(function (node) { node.classList.remove("active"); });
    track.forEach(function (node, i) { self.after(i * 450, function () { node.classList.add("active"); }); });
    if (auto) { this.after(2300, function () { this.advice(true); }); this.after(4300, function () { this.adopt(); }); }
  };
  Demo.prototype.writingStep = function (value) {
    this.select("writing-step", value);
    var copy = this.find(".writing-copy"), stamp = this.find(".writing-stamp");
    if (value === 0) copy.innerHTML = "AI 做手，<br>人保留判断。";
    if (value === 1) copy.innerHTML = "以 AI <del>赋能全链路</del>，<br>让内容更高效地被交付。";
    if (value === 2) copy.innerHTML = "<mark>把 AI 用在具体的事上。</mark><br>最后的判断，留给人。";
    stamp.classList.toggle("on", value === 2);
    this.find('[data-demo-action="approve"]').hidden = value !== 1;
    this.find('[data-demo-action="polish"]').hidden = value === 1;
    this.status(["从观点骨架开始","删套话，保留观点","作者已确认 ✓"][value]);
    this.phase(["idle","review","done"][value]);
  };
  Demo.prototype.runWriting = function (auto) {
    this.writingStep(0);
    this.after(900, function () { this.writingStep(1); });
    this.after(1900, function () { this.find(".writing-copy").innerHTML = "<mark>把 AI 用在具体的事上。</mark><br>最后的判断，留给人。"; });
    if (auto) this.after(3600, function () { this.writingStep(2); });
  };
  Demo.prototype.chooseAgent = function (value) {
    var options = this.all(".agent-option"), name = options[value].dataset.name;
    options.forEach(function (button, i) { button.setAttribute("aria-pressed", String(i === value)); });
    this.find(".agent-answer strong").textContent = name + " · Prompt + 知识库";
    this.find(".agent-answer span").textContent = "正在检索知识库…";
    this.phase("running");
    this.after(700, function () {
      this.find(".agent-answer span").textContent = "先检索知识库，再形成回答。保留来源，便于复核。";
      this.phase("done");
    });
  };
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var controller = entry.target.mochenDemo;
      if (!controller) return;
      controller.visible = entry.isIntersecting;
      entry.target.dataset.demoActive = String(entry.isIntersecting);
      if (entry.isIntersecting) controller.start(); else controller.clear();
    });
  }, { rootMargin: "80px 0px", threshold: .05 });
  function mount(scope) {
    scope.querySelectorAll("[data-demo]").forEach(function (el) {
      if (mounted.has(el)) return;
      mounted.add(el);
      var controller = new Demo(el); el.mochenDemo = controller; controllers.push(controller);
      observer.observe(el);
    });
  }
  document.addEventListener("visibilitychange", function () { controllers.forEach(function (c) { if (document.hidden) c.clear(); else c.start(); }); });
  document.addEventListener("mochen:motion-preference", function () { controllers.forEach(function (c) { c.start(); }); });
  window.MochenDemos = { visual: visual, mount: mount };
})();
