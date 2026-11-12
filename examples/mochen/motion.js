/* Motion controller. Dynamic content is observed without touching article data. */
(function () {
  "use strict";
  var html = document.documentElement;
  var media = matchMedia("(prefers-reduced-motion: reduce)");
  var fine = matchMedia("(pointer: fine)");
  var explicitReduce = new URLSearchParams(location.search).get("motion") === "reduce";
  var reduced = media.matches || explicitReduce;
  var active = new Set(), watched = new WeakSet(), revealed = new WeakSet();
  var cursor = document.querySelector(".cursor-fx");
  var field = document.querySelector(".field"), bar = document.getElementById("bar");
  var progress = document.querySelector(".progress-number");
  var hero = document.querySelector(".hero"), art = document.querySelector(".hero-art");
  var targetY = scrollY, smoothY = targetY, lastY = targetY, velocity = 0, inertia = 0;
  var mouseX = 0, mouseY = 0, pointerInside = false, eyeX = 0, eyeY = 0;
  var frameId = 0, layoutDirty = true, lastPercent = "", lastFlip = -Infinity, flipAnimation;
  var height = innerHeight, maxScroll = 1, currentTransition, bootFinished = false;
  var tiltX = 0, tiltY = 0, tiltAnchor = null, orientationListening = false;
  html.dataset.motionVersion = "3";

  function clamp(n, min, max) { return Math.min(max == null ? 1 : max, Math.max(min || 0, n)); }
  function smoothstep(n) { return n * n * (3 - 2 * n); }
  function requestFrame() { if (!frameId && !document.hidden) frameId = requestAnimationFrame(frame); }
  function measure() {
    height = innerHeight;
    maxScroll = Math.max(1, html.scrollHeight - height);
    targetY = scrollY;
    layoutDirty = true;
    requestFrame();
  }
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && html.classList.contains("is-loaded")) {
        entry.target.classList.add("on");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .15 });
  var rollObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        active.add(entry.target);
        entry.target.classList.add("is-scroll-active");
      } else {
        active.delete(entry.target);
        entry.target.classList.remove("is-scroll-active");
      }
    });
    measure();
  }, { rootMargin: "100% 0px 100% 0px" });

  function scan(scope) {
    scope = scope || document;
    scope.querySelectorAll(".reveal,.panel-head,.skill-group,.flow,.job,.info-block,.connect-line,.wechat-card,.about-intro,.block-head")
      .forEach(function (el) {
        if (el.closest("#reader")) return;
        el.classList.add("rev");
        if (!el.classList.contains("panel-head")) el.classList.add("motion-roll");
      });
    scope.querySelectorAll(".panel-num").forEach(function (el) {
      if (el.classList.contains("reel-number")) return;
      var number = el.textContent.trim();
      el.textContent = "";
      el.classList.add("reel-number");
      Array.from(number).forEach(function (digit) {
        var mask = document.createElement("span"), child = document.createElement("span");
        mask.className = "reel-digit";
        child.textContent = digit;
        mask.appendChild(child);
        el.appendChild(mask);
      });
    });
    scope.querySelectorAll(".motion-roll").forEach(function (el) {
      if (watched.has(el)) return;
      watched.add(el);
      el.classList.add("roll-band");
      rollObserver.observe(el);
    });
    scope.querySelectorAll(".rev,.reel-number").forEach(function (el) {
      if (revealed.has(el)) return;
      revealed.add(el);
      if (reduced) el.classList.add("on");
      else revealObserver.observe(el);
    });
    scope.querySelectorAll(".card-hitbox > .project,.card-hitbox > .article-card").forEach(function (card) {
      if (card.querySelector(":scope > .card-spotlight")) return;
      var spot = document.createElement("i");
      spot.className = "card-spotlight";
      spot.setAttribute("aria-hidden", "true");
      card.prepend(spot);
    });
    if (window.MochenDemos) window.MochenDemos.mount(scope);
    measure();
  }
  function refresh(opts) {
    scan();
    if (html.classList.contains("is-loaded") || (opts && opts.immediate)) {
      document.querySelectorAll(".rev,.reel-number").forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (!el.closest("[hidden]") && rect.bottom > 0 && rect.top < innerHeight * .95) {
          el.classList.add("on");
          revealObserver.unobserve(el);
        }
      });
    }
    measure();
    if (opts && opts.immediate) frame(performance.now());
  }
  function frame(now) {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    smoothY += (targetY - smoothY) * (reduced ? 1 : .09);
    velocity *= .9;
    inertia = innerWidth > 760 && !reduced ? inertia + (velocity - inertia) * .08 : 0;
    var tx = 0, ty = 0;
    if (!reduced && pointerInside && art && hero && active.has(hero)) {
      var rect = art.getBoundingClientRect();
      if (rect.width > 0) {
        tx = (clamp((mouseX - rect.left) / rect.width) * 2 - 1) * 1.8;
        ty = (clamp((mouseY - rect.top) / rect.height) * 2 - 1) * 1.3;
      }
    }
    if (!reduced && !fine.matches && tiltAnchor && hero && active.has(hero)) {
      tx = tiltX * 1.8; ty = tiltY * 1.3;
    }
    eyeX += (tx - eyeX) * .14;
    eyeY += (ty - eyeY) * .14;
    html.style.setProperty("--eye-x", eyeX.toFixed(2) + "px");
    html.style.setProperty("--eye-y", eyeY.toFixed(2) + "px");
    var pct = clamp(smoothY / maxScroll);
    if (bar) bar.style.transform = "scaleY(" + pct.toFixed(4) + ")";
    var value = String(Math.round(pct * 100)).padStart(2, "0");
    if (progress && value !== lastPercent) {
      progress.textContent = value;
      if (!reduced && now - lastFlip >= 110) {
        if (flipAnimation) flipAnimation.cancel();
        flipAnimation = progress.animate([
          { opacity: .28, transform: "translate3d(0,55%,0) rotateX(-32deg)" },
          { opacity: 1, transform: "translate3d(0,0,0) rotateX(0deg)" }
        ], { duration: 240, easing: "cubic-bezier(.19,1,.22,1)", fill: "both" });
        lastFlip = now;
      }
      lastPercent = value;
    }
    if (field) field.style.transform = reduced ? "" : "translate3d(0," + clamp(inertia * .35, -28, 28).toFixed(1) + "px,0)";
    if (layoutDirty && !reduced) {
      active.forEach(function (el) {
        if (!el.isConnected || el.closest("[hidden]")) { active.delete(el); return; }
        var r = el.getBoundingClientRect();
        var local = clamp((height - r.top) / Math.max(1, height + r.height));
        var enter = smoothstep(clamp((.3 - local) / .3));
        var exit = smoothstep(clamp((local - .7) / .3));
        el.style.setProperty("--roll-origin-y", enter > 0 ? "4%" : exit > 0 ? "96%" : "50%");
        el.style.setProperty("--roll-angle", (-14 * enter + 28 * exit).toFixed(2) + "deg");
        el.style.setProperty("--roll-angle-mobile", (-9 * enter + 18 * exit).toFixed(2) + "deg");
        el.style.setProperty("--roll-y", (6 * enter - 10 * exit).toFixed(1) + "px");
        el.style.setProperty("--roll-opacity", (1 - .1 * enter - .14 * exit).toFixed(3));
      });
    }
    layoutDirty = false;
    if (Math.abs(targetY - smoothY) > .2 || Math.abs(velocity) > .05 || Math.abs(inertia) > .05 ||
        Math.abs(tx - eyeX) > .03 || Math.abs(ty - eyeY) > .03) requestFrame();
  }
  function pointerMove(e) {
    if (e.pointerType === "touch" || !fine.matches || reduced) return;
    mouseX = e.clientX; mouseY = e.clientY; pointerInside = true;
    if (cursor) {
      html.classList.add("has-cursor-fx");
      cursor.classList.add("on");
      cursor.style.transform = "translate3d(" + mouseX + "px," + mouseY + "px,0)";
      var text = !!e.target.closest("input,textarea,[contenteditable='true']");
      cursor.classList.toggle("is-text", text);
      cursor.classList.toggle("is-link", !text && !!e.target.closest("a,button,[role='button'],select,label,summary"));
    }
    var card = e.target.closest(".project,.article-card,.wechat-card");
    if (card) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", clamp(mouseX - r.left, 0, r.width).toFixed(1) + "px");
      card.style.setProperty("--spot-y", clamp(mouseY - r.top, 0, r.height).toFixed(1) + "px");
    }
    requestFrame();
  }
  function setPreference() {
    reduced = media.matches || explicitReduce;
    html.classList.toggle("motion-reduced", reduced);
    if (reduced || !fine.matches) {
      html.classList.remove("has-cursor-fx");
      if (cursor) cursor.classList.remove("on");
    }
    refresh({ immediate: true });
    document.dispatchEvent(new CustomEvent("mochen:motion-preference", { detail: { reduced: reduced } }));
  }
  function orientation(event) {
    if (reduced || event.beta == null || event.gamma == null) return;
    var angle = screen.orientation ? screen.orientation.angle : 0;
    if (!tiltAnchor || tiltAnchor.angle !== angle) {
      tiltAnchor = { beta: event.beta, gamma: event.gamma, angle: angle };
      return;
    }
    function delta(a, b) { var d = a - b; return d > 180 ? d - 360 : d < -180 ? d + 360 : d; }
    var x = delta(event.gamma, tiltAnchor.gamma), y = delta(event.beta, tiltAnchor.beta);
    if (angle === 90) { var swap = x; x = y; y = -swap; }
    if (angle === 270 || angle === -90) { var swap2 = x; x = -y; y = swap2; }
    if (angle === 180) { x = -x; y = -y; }
    tiltX = Math.abs(x) < .2 ? 0 : clamp(x / 24, -1, 1);
    tiltY = Math.abs(y) < .2 ? 0 : clamp(y / 20, -1, 1);
    requestFrame();
  }
  function listenOrientation() {
    if (orientationListening) return;
    orientationListening = true;
    window.addEventListener("deviceorientation", orientation, { passive: true });
  }
  function setupOrientation() {
    // GazeDog owns the user's sensor gesture; the illustration shares it.
    document.addEventListener("mochen:pet-sensor", function (event) {
      if (event.detail.enabled && !reduced) { listenOrientation(); return; }
      window.removeEventListener("deviceorientation", orientation);
      orientationListening = false;
      tiltAnchor = null;
      tiltX = 0; tiltY = 0;
      requestFrame();
    });
  }

  function clearCovers() {
    document.querySelectorAll("[data-article-cover],.reader-cover").forEach(function (el) {
      el.style.viewTransitionName = "";
    });
  }
  function pageTransition(update, opts) {
    opts = opts || {};
    if (currentTransition) currentTransition.skipTransition();
    clearCovers();
    var source = opts.fromCover;
    if (source && source.isConnected && !source.closest("[hidden]")) source.style.viewTransitionName = "article-cover";
    var applied = false;
    function apply() {
      if (applied) return;
      applied = true;
      clearCovers();
      update();
      var target = opts.toCover && opts.toCover();
      if (target) target.style.viewTransitionName = "article-cover";
      refresh({ immediate: true });
    }
    if (!reduced && document.startViewTransition) {
      html.dataset.lastTransition = "view-transition";
      var transition = document.startViewTransition(apply);
      currentTransition = transition;
      return transition.finished.catch(function () { apply(); }).finally(function () {
        if (currentTransition === transition) { currentTransition = null; clearCovers(); }
      });
    }
    html.dataset.lastTransition = reduced ? "reduced" : "fade";
    apply();
    clearCovers();
    if (!reduced) {
      var main = document.getElementById("main");
      main.classList.remove("route-in");
      void main.offsetWidth;
      main.classList.add("route-in");
    }
    return Promise.resolve();
  }
  function ready() {
    if (bootFinished) return;
    bootFinished = true;
    var elapsed = performance.now() - (window.mochenBootStarted || 0);
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise(function (resolve) { setTimeout(resolve, Math.max(0, 520 - elapsed)); })
    ]).then(function () {
      html.classList.remove("is-booting");
      html.classList.add("is-loaded");
      var loader = document.getElementById("site-loader");
      if (loader) {
        loader.classList.add("is-exiting");
        setTimeout(function () { loader.remove(); }, reduced ? 0 : 620);
      }
      refresh();
    });
  }

  window.MochenMotion = { scan: scan, refresh: refresh, ready: ready, pageTransition: pageTransition, isReduced: function () { return reduced; } };
  window.addEventListener("scroll", function () {
    targetY = scrollY; velocity += (targetY - lastY) * .08; lastY = targetY;
    layoutDirty = true; requestFrame();
  }, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("pointermove", pointerMove, { passive: true });
  window.addEventListener("pointerover", pointerMove, { passive: true });
  html.addEventListener("mouseleave", function () {
    pointerInside = false;
    if (cursor) cursor.classList.remove("on","is-link","is-text");
    requestFrame();
  });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) measure(); });
  media.addEventListener("change", setPreference);
  fine.addEventListener("change", setPreference);
  var resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(document.body);
  var scanPending = false;
  new MutationObserver(function (records) {
    if (scanPending || !records.some(function (r) { return Array.from(r.addedNodes).some(function (n) { return n.nodeType === 1 && (n.matches(".motion-roll,.rev,.panel-num,[data-demo]") || n.querySelector(".motion-roll,.rev,.panel-num,[data-demo]")); }); })) return;
    scanPending = true;
    queueMicrotask(function () { scanPending = false; scan(); });
  }).observe(document.getElementById("main"), { childList: true, subtree: true });
  setPreference();
  setupOrientation();
  scan();
  setTimeout(ready, 6000);
})();
