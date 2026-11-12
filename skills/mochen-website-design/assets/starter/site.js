/* Content changes; the Mochen interaction grammar stays. No remote APIs. */
(function () {
  "use strict";
  var data = window.MOCHEN_SITE, $ = function (selector) { return document.querySelector(selector); };
  if (!data || !data.sections || !data.sections.length) { $("#live-status").textContent = "内容未载入，请检查 site-data.js。"; return; }
  var sections = new Map(), items = new Map();
  data.sections.forEach(function (section) {
    sections.set(section.id, section);
    section.items.forEach(function (item) { items.set(item.id, { item: item, section: section.id }); });
  });
  var state = { section: data.sections[0].id, query: "", tag: "全部", reader: null, returnTo: null, fromList: false };
  var preference = matchMedia("(prefers-reduced-motion: reduce)");
  var explicitReduce = new URLSearchParams(location.search).get("motion") === "reduce";
  function reduced() { return preference.matches || explicitReduce; }
  function motionPreference() {
    document.documentElement.classList.toggle("reduced", reduced());
    if (reduced()) document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("seen"); });
  }
  preference.addEventListener("change", motionPreference);
  motionPreference();
  var reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add("seen"); reveal.unobserve(entry.target); } });
  }, { threshold: .04 });
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]; }); }
  function resources(item) {
    return item.links.map(function (link) {
      var external = /^https?:\/\//.test(link.url);
      return '<a href="' + esc(link.url) + '"' + (link.download ? ' download' : '') + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(link.label) + ' <span aria-hidden="true">' + (link.download ? '↓' : '↗') + '</span></a>';
    }).join("");
  }
  function preview(item) {
    if (item.cover) return '<img class="card-cover" src="' + esc(item.cover) + '" alt="' + esc(item.title) + '" loading="lazy">';
    var content = item.bullets.length ? '<div class="preview-steps">' + item.bullets.slice(0, 3).map(function (text, i) { return (i ? '<i aria-hidden="true">→</i>' : '') + '<span>' + esc(text) + '</span>'; }).join("") + '</div>' : '<div class="preview-lines"><i></i><i></i><i></i></div>';
    return '<div class="card-preview" aria-hidden="true"><span class="preview-tag">' + esc(item.tag || "MOCHEN / CONTENT") + '</span>' + content + '</div>';
  }
  function card(item, index, layout) {
    var link = '#item/' + encodeURIComponent(item.id);
    var inside;
    if (layout === "prose") {
      inside = '<article class="prose-item" data-item="' + esc(item.id) + '"><h3>' + esc(item.title) + '</h3><div class="prose">' + (item.body_html || '<p>' + esc(item.summary) + '</p>') + '</div><div class="resource-links">' + resources(item) + '</div></article>';
    } else {
      inside = '<article class="content-card" data-item="' + esc(item.id) + '">' + (layout === "cards" ? preview(item) : '') + '<div class="card-body"><div class="card-top"><h3><a href="' + link + '" data-read="' + esc(item.id) + '">' + esc(item.title) + '</a></h3><small>' + String(index + 1).padStart(2, "0") + '</small></div><p>' + esc(item.summary) + '</p><a class="card-reading" href="' + link + '" data-read="' + esc(item.id) + '">' + (item.body ? '阅读全文' : '查看详情') + '<span aria-hidden="true">↗</span></a></div></article>';
    }
    return '<div class="reveal" style="--delay:' + Math.min(index % 4, 3) * 70 + 'ms">' + inside + '</div>';
  }
  function marker() {
    var selected = $('#section-tabs a[aria-selected="true"]'), row = $("#section-tabs");
    if (!selected) return;
    row.style.setProperty("--marker-left", selected.offsetLeft + "px");
    row.style.setProperty("--marker-width", selected.offsetWidth + "px");
  }
  function chips() {
    var section = sections.get(state.section), tags = Array.from(new Set(section.items.map(function (item) { return item.tag; }).filter(Boolean)));
    $("#filters").innerHTML = tags.length > 1 ? ["全部"].concat(tags).map(function (tag) { return '<button class="filter" type="button" data-tag="' + esc(tag) + '" aria-pressed="' + (state.tag === tag) + '">' + esc(tag) + '</button>'; }).join("") : "";
  }
  function copyButtons(scope) {
    scope.querySelectorAll("pre").forEach(function (pre) {
      if (pre.querySelector(".copy-code")) return;
      var button = document.createElement("button");
      button.className = "copy-code"; button.type = "button"; button.textContent = "复制代码";
      button.addEventListener("click", function () {
        if (!navigator.clipboard) { button.textContent = "请选中代码复制"; return; }
        navigator.clipboard.writeText(pre.querySelector("code").textContent).then(function () { button.textContent = "已复制 ✓"; setTimeout(function () { button.textContent = "复制代码"; }, 1800); }).catch(function () { button.textContent = "请选中代码复制"; });
      });
      pre.prepend(button);
    });
  }
  function renderList() {
    var section = sections.get(state.section), query = state.query.trim().toLocaleLowerCase();
    var visible = section.items.filter(function (item) { return (state.tag === "全部" || item.tag === state.tag) && (!query || item.search_text.toLocaleLowerCase().includes(query)); });
    var host = $("#content-list");
    host.className = {cards:"content-grid",list:"content-list",steps:"step-list",prose:"prose-list"}[section.layout];
    host.setAttribute("aria-labelledby", "tab-" + section.id);
    host.innerHTML = visible.length ? visible.map(function (item, index) { return card(item, index, section.layout); }).join("") : '<div class="empty"><p>没有匹配的内容，换个关键词试试。</p><button type="button" data-clear>清空筛选</button></div>';
    $("#live-status").textContent = section.label + "：" + visible.length + " 条内容";
    host.querySelectorAll(".reveal").forEach(function (el) { if (reduced()) el.classList.add("seen"); else reveal.observe(el); });
    copyButtons(host);
  }
  function renderSection() {
    var section = sections.get(state.section);
    document.querySelectorAll("#section-tabs a").forEach(function (link) { link.setAttribute("aria-selected", String(link.dataset.section === section.id)); });
    $("#panel-index").textContent = String(data.sections.indexOf(section) + 1).padStart(2, "0") + " / " + String(section.items.length).padStart(2, "0");
    $("#panel-title").textContent = section.label;
    $("#panel-description").textContent = section.description;
    $("#search").value = state.query;
    chips(); renderList(); marker();
  }
  function enter(el) {
    el.classList.remove("route-enter");
    void el.offsetWidth;
    el.classList.add("route-enter");
  }
  function scrollToContent() { $("#content").scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }); }
  function route(initial) {
    var hash;
    try { hash = decodeURIComponent(location.hash.slice(1)); } catch (_) { hash = ""; }
    if (hash.startsWith("item/") && items.has(hash.slice(5))) {
      var found = items.get(hash.slice(5)), item = found.item;
      if (!state.reader && !initial && !state.returnTo) state.returnTo = { section: state.section, query: state.query, tag: state.tag, y: scrollY, item: item.id };
      state.fromList = !state.reader && !initial;
      state.reader = item.id;
      $("#home").hidden = true; $("#reader").hidden = false;
      document.body.classList.add("reader-mode");
      $("#reader-title").textContent = item.title;
      $("#reader-tag").textContent = item.tag || sections.get(found.section).label;
      $("#reader-summary").textContent = item.summary;
      $("#reader-summary").hidden = !item.summary;
      $("#reader-body").innerHTML = item.body_html || (item.bullets.length ? '<ul>' + item.bullets.map(function (text) { return '<li>' + esc(text) + '</li>'; }).join("") + '</ul>' : '<p>' + esc(item.summary) + '</p>');
      $("#reader-links").innerHTML = resources(item);
      $("#reader-back").textContent = "← 返回" + sections.get(state.returnTo ? state.returnTo.section : found.section).label;
      document.title = item.title + " · " + data.author;
      copyButtons($("#reader")); enter($("#reader")); window.scrollTo({ top: 0, behavior: "instant" });
      $("#reader-title").focus({ preventScroll: true });
      return;
    }
    var wasReader = !!state.reader, previousSection = state.section, returning = state.returnTo;
    state.reader = null; $("#home").hidden = false; $("#reader").hidden = true;
    document.body.classList.remove("reader-mode");
    state.section = sections.has(hash) ? hash : (wasReader && returning ? returning.section : state.section);
    if (wasReader && returning && state.section === returning.section) { state.query = returning.query; state.tag = returning.tag; }
    else if (state.section !== previousSection) { state.query = ""; state.tag = "全部"; }
    renderSection(); enter($("#content-list")); document.title = data.title + " · " + data.author;
    if (wasReader && returning && state.section === returning.section) {
      requestAnimationFrame(function () {
        window.scrollTo({ top: returning.y, behavior: "instant" });
        var origin = document.querySelector('[data-read="' + returning.item + '"]');
        if (origin) origin.focus({ preventScroll: true });
      });
      state.returnTo = null;
    } else if (hash === "top") window.scrollTo({ top: 0, behavior: reduced() ? "instant" : "smooth" });
    else if (hash === "content" || state.section !== previousSection || (initial && sections.has(hash))) requestAnimationFrame(scrollToContent);
  }
  $("#section-tabs").innerHTML = data.sections.map(function (section) { return '<a href="#' + esc(section.id) + '" id="tab-' + esc(section.id) + '" role="tab" aria-controls="content-list" aria-selected="false" data-section="' + esc(section.id) + '">' + esc(section.label) + '</a>'; }).join("") + '<span class="tab-marker" aria-hidden="true"></span>';
  $("#search").addEventListener("input", function (event) { state.query = event.target.value; renderList(); });
  $("#filters").addEventListener("click", function (event) { var button = event.target.closest("[data-tag]"); if (button) { state.tag = button.dataset.tag; chips(); renderList(); } });
  $("#content-list").addEventListener("click", function (event) {
    var read = event.target.closest("[data-read]");
    if (read) state.returnTo = { section: state.section, query: state.query, tag: state.tag, y: scrollY, item: read.dataset.read };
    if (event.target.closest("[data-clear]")) { state.query = ""; state.tag = "全部"; renderSection(); $("#search").focus(); }
  });
  $("#reader-back").addEventListener("click", function () {
    if (state.fromList && state.returnTo) history.back();
    else location.hash = "#" + (state.returnTo ? state.returnTo.section : items.get(state.reader).section);
  });
  window.addEventListener("hashchange", function () { route(false); });
  window.addEventListener("resize", marker, { passive: true });
  if (data.contact) $("#contact").textContent = data.contact.label + " · " + data.contact.value;
  var pupils = Array.from(document.querySelectorAll(".hero-pupil")), art = $(".hero-illustration");
  var pointerFrame = 0;
  window.addEventListener("pointermove", function (event) {
    if (reduced() || state.reader || event.pointerType === "touch") return;
    cancelAnimationFrame(pointerFrame);
    var x = event.clientX, y = event.clientY;
    pointerFrame = requestAnimationFrame(function () {
      var rect = art.getBoundingClientRect(), dx = Math.max(-3, Math.min(3, (x - rect.left - rect.width / 2) / 100)), dy = Math.max(-2, Math.min(2, (y - rect.top - rect.height / 2) / 150));
      pupils.forEach(function (pupil) { pupil.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; });
      art.style.setProperty("--art-tilt", (dx * .22) + "deg");
    });
  }, { passive: true });
  document.addEventListener("pointerleave", function () { pupils.forEach(function (pupil) { pupil.style.transform = ""; }); art.style.removeProperty("--art-tilt"); });
  window.addEventListener("scroll", function () { if (!reduced()) $(".hero-main").style.setProperty("--hero-offset", Math.min(28, scrollY * .025) + "px"); }, { passive: true });
  document.addEventListener("mochen:pet-sensor", function (event) {
    if (!event.detail.enabled) pupils.forEach(function (pupil) { pupil.style.transform = ""; });
  });
  window.addEventListener("deviceorientation", function (event) {
    if (reduced() || !$("#motion-permission").classList.contains("on")) return;
    var x = Math.max(-3, Math.min(3, Number(event.gamma || 0) / 12)), y = Math.max(-2, Math.min(2, Number(event.beta || 0) / 25));
    pupils.forEach(function (pupil) { pupil.style.transform = 'translate(' + x + 'px,' + y + 'px)'; });
  }, { passive: true });
  route(true);
  requestAnimationFrame(function () { document.documentElement.classList.add("is-ready"); });
})();
