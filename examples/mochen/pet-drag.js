/* Reusable pointer/keyboard placement; keeps the original Gaze-Dog untouched. */
(function () {
  "use strict";
  function attach(stage, handle, options) {
    options = options || {};
    var key = options.storageKey || "mochen:pet-position:v1";
    var position = null, drag = null;
    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    try {
      var saved = JSON.parse(localStorage.getItem(key));
      if (saved && saved.v === 1 && [saved.x, saved.y, saved.size].every(Number.isFinite)) {
        position = { v: 1, x: clamp(saved.x, 0, 1), y: clamp(saved.y, 0, 1), size: clamp(saved.size, 64, 180) };
      }
    } catch (_) { /* Placement remains usable when browser storage is disabled. */ }
    function viewport() {
      var view = window.visualViewport;
      return { x: view ? view.offsetLeft : 0, y: view ? view.offsetTop : 0,
        width: view ? view.width : innerWidth, height: view ? view.height : innerHeight };
    }
    function float(size) {
      if (stage.parentElement !== document.body) document.body.appendChild(stage);
      stage.classList.remove("is-in-hero");
      stage.classList.add("is-floating");
      stage.dataset.placement = "floating";
      var view = viewport();
      stage.style.setProperty("--pet-size", Math.max(48, Math.min(size, view.width - 16, view.height - 48)) + "px");
      stage.style.right = "auto";
      stage.style.bottom = "auto";
    }
    function bounds() {
      var view = viewport(), rect = stage.getBoundingClientRect(), gap = 8;
      return { left: view.x + gap, top: view.y + gap,
        dx: Math.max(0, view.width - rect.width - gap * 2),
        dy: Math.max(0, view.height - rect.height - gap * 2) };
    }
    function move(left, top) {
      var box = bounds();
      left = clamp(left, box.left, box.left + box.dx);
      top = clamp(top, box.top, box.top + box.dy);
      stage.style.left = left + "px";
      stage.style.top = top + "px";
      position.x = box.dx ? (left - box.left) / box.dx : 0;
      position.y = box.dy ? (top - box.top) / box.dy : 0;
    }
    function update() {
      if (!position) {
        stage.dataset.placement = "default";
        if (options.onDefaultPlace) options.onDefaultPlace();
        return;
      }
      float(position.size);
      var box = bounds();
      stage.style.left = (box.left + position.x * box.dx) + "px";
      stage.style.top = (box.top + position.y * box.dy) + "px";
    }
    function save() {
      try { if (position) localStorage.setItem(key, JSON.stringify(position)); } catch (_) {}
    }
    function finish(event) {
      if (!drag || (event && event.pointerId !== undefined && event.pointerId !== drag.id)) return;
      var id = drag.id;
      drag = null;
      stage.classList.remove("is-dragging");
      try { if (handle.hasPointerCapture(id)) handle.releasePointerCapture(id); } catch (_) {}
      save();
    }
    function reset() {
      finish();
      position = null;
      try { localStorage.removeItem(key); } catch (_) {}
      stage.classList.remove("is-floating");
      ["left", "top", "right", "bottom", "--pet-size"].forEach(function (name) { stage.style.removeProperty(name); });
      update();
    }
    function down(event) {
      if (!event.isPrimary || event.button !== 0 || drag) return;
      var rect = stage.getBoundingClientRect();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY,
        offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, rect: rect, started: false };
      try { handle.setPointerCapture(event.pointerId); } catch (_) {}
      handle.focus({ preventScroll: true });
      event.preventDefault();
    }
    function dragging(event) {
      if (!drag || event.pointerId !== drag.id) return;
      if (!drag.started) {
        if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4) return;
        position = position || { v: 1, x: 0, y: 0, size: Math.round(drag.rect.width) };
        float(position.size);
        drag.started = true;
        stage.classList.add("is-dragging");
        // Reparenting from the hero can release capture; restore it afterwards.
        try { handle.setPointerCapture(event.pointerId); } catch (_) {}
      }
      move(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
      event.preventDefault();
    }
    function keyboard(event) {
      if (event.key === "Home" || event.key === "Enter") { event.preventDefault(); reset(); return; }
      var directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      var direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      var rect = stage.getBoundingClientRect();
      position = position || { v: 1, x: 0, y: 0, size: Math.round(rect.width) };
      float(position.size);
      var step = event.shiftKey ? 32 : 12;
      move(rect.left + direction[0] * step, rect.top + direction[1] * step);
      save();
    }
    handle.addEventListener("pointerdown", down);
    handle.addEventListener("dblclick", reset);
    handle.addEventListener("keydown", keyboard);
    window.addEventListener("pointermove", dragging, { passive: false });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("blur", function () { finish(); });
    window.addEventListener("pagehide", function () { finish(); });
    if (window.visualViewport) window.visualViewport.addEventListener("resize", update, { passive: true });
    return { update: update, reset: reset };
  }
  window.MochenPetDrag = { attach: attach };
})();
