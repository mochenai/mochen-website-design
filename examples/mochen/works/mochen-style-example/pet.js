/* Site adapter around the original, unmodified Mr-xue/Gaze-Dog component. */
(function () {
  "use strict";
  var stage = document.getElementById("desktop-pet");
  var dog = document.getElementById("gaze-dog");
  var button = document.getElementById("motion-permission");
  var slot = document.getElementById("hero-pet-slot");
  if (!stage || stage.hidden || !dog || typeof window.GazeDog !== "function") return;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)");
  var fine = matchMedia("(pointer: fine)");
  var explicitReduce = new URLSearchParams(location.search).get("motion") === "reduce";
  var instance, observer, placement;

  function sensorState() {
    var enabled = button.classList.contains("on");
    button.setAttribute("aria-pressed", String(enabled));
    button.textContent = enabled ? "关闭体感" : "开启体感";
    document.dispatchEvent(new CustomEvent("mochen:pet-sensor", { detail: { enabled: enabled } }));
  }
  function placeDefault() {
    var inHero = innerWidth < 1100;
    var parent = inHero && slot ? slot : document.body;
    if (stage.parentElement !== parent) parent.appendChild(stage);
    stage.classList.toggle("is-in-hero", inHero);
  }
  function place() {
    if (placement) placement.update();
    else placeDefault();
  }
  function setup() {
    if (instance) instance.destroy();
    if (observer) observer.disconnect();
    instance = null;
    button.classList.remove("on");
    sensorState();
    var staticPet = reduced.matches || explicitReduce;
    stage.dataset.motion = staticPet ? "reduced" : "original";
    button.hidden = staticPet || fine.matches || typeof DeviceOrientationEvent === "undefined";
    if (staticPet) {
      dog.style.backgroundImage = 'url("assets/gaze-dog/dog-look-angle-atlas.webp")';
      dog.style.backgroundSize = "1600% 1500%";
      dog.style.backgroundPosition = "86.66666666666667% 64.28571428571429%";
    } else {
      instance = window.GazeDog(dog, {
        atlas: "assets/gaze-dog/dog-look-angle-atlas.webp",
        size: 150,
        restFrame: 157,
        follow: "window",
        response: 0.11,
        maxSpeed: 460,
        sensorButton: button
      });
      observer = new MutationObserver(sensorState);
      observer.observe(button, { attributes: true, attributeFilter: ["class"] });
    }
    place();
  }
  reduced.addEventListener("change", setup);
  fine.addEventListener("change", setup);
  window.addEventListener("resize", place, { passive: true });
  window.addEventListener("pagehide", function () {
    if (instance) instance.destroy();
    if (observer) observer.disconnect();
  });
  window.addEventListener("pageshow", function (event) { if (event.persisted) setup(); });
  if (window.MochenPetDrag) placement = window.MochenPetDrag.attach(stage, dog, { onDefaultPlace: placeDefault, storageKey: "mochen:pet-position:" + location.pathname });
  setup();
})();
