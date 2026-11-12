/* ============================================================
   GazeDog — 跟随光标/体感转头的小狗精灵组件
   零依赖 · 自包含 · 可移植
   精灵图：16 列 × 15 行 = 240 帧，每帧为一个连续的转头角度
   ------------------------------------------------------------
   用法：
     const dog = GazeDog(document.querySelector('#dog'), {
       atlas: 'assets/dog-look-angle-atlas.webp', // 精灵图路径
       size: 150,          // 显示尺寸(px)，方形
       restFrame: 157,     // 静止朝向帧(正对前方)
       follow: 'window',   // 'window' 全窗跟随 | HTMLElement 仅该元素内跟随
       sensorButton: null, // 传入按钮元素即可支持「开启体感」(移动端陀螺仪)
     });
     dog.destroy(); // 需要时销毁
   ============================================================ */
(function (global) {
  "use strict";

  function GazeDog(el, options) {
    if (!el) throw new Error("[GazeDog] 需要传入一个容器元素");
    const opt = Object.assign({
      atlas: "assets/dog-look-angle-atlas.webp",
      size: 150,
      cols: 16,
      rows: 15,
      total: 240,
      restFrame: 157,
      response: 0.11,   // 弹簧响应时间(越小越跟手)
      maxSpeed: 460,    // 弹簧最大角速度
      follow: "window",
      sensorButton: null,
    }, options || {});

    const { cols, rows, total, restFrame: REST } = opt;
    const TAU = Math.PI * 2;
    const OFFSET = -3 * Math.PI / 4;           // 角度基准偏移

    // —— 数学工具 ——
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const clamp01 = (v) => clamp(v, 0, 1);
    const smoothstep = (e) => e * e * (3 - 2 * e);
    const wrap = (e) => ((e % total) + total) % total;               // 归入 [0,total)
    // 两角在环形空间内的最短有向差
    const delta = (a, b) => {
      let n = wrap(b) - wrap(a);
      const half = total / 2;
      if (n > half) n -= total;
      else if (n < -half) n += total;
      return n;
    };

    // —— 精灵样式初始化 ——
    el.style.width = opt.size + "px";
    el.style.height = opt.size + "px";
    el.style.backgroundImage = `url("${opt.atlas}")`;
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;       // 16×15 → 1600% 1500%
    el.style.backgroundPosition = "0% 0%";

    // —— 运行状态 ——
    let cur = REST, target = REST, vel = 0;    // 当前角 / 目标角 / 角速度
    let active = false, sensor = false;
    let sensorX = 0, sensorY = 0;
    let lastT = 0, lastFrame = -1, raf = 0;

    // 朝向指针方向设定目标角
    const lookAt = (dx, dy, intensity = 1) => {
      const ang = ((Math.atan2(dy, dx) - OFFSET + TAU) % TAU) / TAU * total;
      const aim = REST + delta(REST, ang) * clamp01(intensity);
      target = cur + delta(cur, aim);
    };
    const rest = () => { target = cur + delta(cur, REST); };

    // 临界阻尼弹簧(smoothDamp)
    const spring = (pos, tgt, v, response, maxSpeed, dt) => {
      const a = Math.max(1e-4, response);
      const i = 2 / a;
      const s = i * dt;
      const c = 1 / (1 + s + 0.48 * s * s + 0.235 * s * s * s);
      const d = maxSpeed * a;
      const u = clamp(pos - tgt, -d, d);
      const h = (v + i * u) * dt;
      let nv = (v - i * h) * c;
      let np = pos - u + (u + h) * c;
      if ((tgt - pos > 0) === (np > tgt)) { np = tgt; nv = 0; }
      return [np, nv];
    };

    // 依当前角切换精灵帧
    const setFrame = () => {
      const e = wrap(Math.round(cur));
      if (e === lastFrame) return;
      lastFrame = e;
      const col = e % cols, row = Math.floor(e / cols);
      el.style.backgroundPosition = `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`;
    };

    // —— 指针跟随 ——
    const inFollowRegion = (ev) => {
      if (opt.follow === "window") return true;
      const r = opt.follow.getBoundingClientRect();
      return ev.clientY >= r.top && ev.clientY <= r.bottom &&
             ev.clientX >= r.left && ev.clientX <= r.right;
    };
    const onMove = (ev) => {
      if (sensor) return;
      active = inFollowRegion(ev);
      if (!active) return;
      const d = el.getBoundingClientRect();
      lookAt(ev.clientX - (d.left + d.width / 2), ev.clientY - (d.top + d.height / 2));
    };
    const onLeave = () => { active = false; };

    // —— 主循环 ——
    const loop = (t) => {
      const dt = lastT ? Math.min((t - lastT) / 1000, 1 / 30) : 1 / 60;
      lastT = t;
      if (sensor) {
        const mag = Math.hypot(sensorX, sensorY);
        if (mag < 0.002) rest();
        else lookAt(sensorX, sensorY, smoothstep(clamp01(mag / 0.52)));
      } else if (!active) {
        rest();
      }
      [cur, vel] = spring(cur, target, vel, opt.response, opt.maxSpeed, dt);
      setFrame();
      raf = requestAnimationFrame(loop);
    };

    // —— 体感(陀螺仪) ——
    const onOrient = (e) => {
      if (!sensor) return;
      sensorX = clamp((e.gamma || 0) / 45, -1, 1);
      sensorY = clamp((e.beta || 0) / 90 - 0.5, -1, 1);
    };
    const toggleSensor = async () => {
      const DOE = window.DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === "function") {
        try { if ((await DOE.requestPermission()) !== "granted") return; } catch { return; }
      }
      sensor = !sensor;
      if (opt.sensorButton) opt.sensorButton.classList.toggle("on", sensor);
      if (sensor) window.addEventListener("deviceorientation", onOrient);
      else window.removeEventListener("deviceorientation", onOrient);
    };

    // —— 绑定 & 启动 ——
    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    if (opt.sensorButton) opt.sensorButton.addEventListener("click", toggleSensor);
    raf = requestAnimationFrame(loop);

    // —— 对外 API ——
    return {
      /** 手动指向某个屏幕坐标 */
      lookTo(clientX, clientY) {
        const d = el.getBoundingClientRect();
        lookAt(clientX - (d.left + d.width / 2), clientY - (d.top + d.height / 2));
      },
      /** 回正 */
      rest,
      /** 销毁：解绑事件并停止循环 */
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("mousemove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
        window.removeEventListener("deviceorientation", onOrient);
        if (opt.sensorButton) opt.sensorButton.removeEventListener("click", toggleSensor);
      },
    };
  }

  // UMD 式导出
  if (typeof module !== "undefined" && module.exports) module.exports = GazeDog;
  else global.GazeDog = GazeDog;
})(typeof window !== "undefined" ? window : this);
