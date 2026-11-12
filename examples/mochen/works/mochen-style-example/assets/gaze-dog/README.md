# GazeDog 🐶 — 跟随光标/体感转头的小狗

一个**零依赖、自包含**的精灵组件：小狗会平滑转头盯着鼠标指针，停下即缓缓回正；移动端可用陀螺仪（体感）控制。

## 文件

```
dog-widget/
├── assets/dog-look-angle-atlas.webp   # 精灵图（16列×15行=240帧，每帧240×240）
├── dog-sprite.js                      # 组件（UMD，可 <script> 或 import）
├── dog-sprite.css                     # 可选外观（阴影等，不含核心逻辑）
├── index.html                         # 可直接打开的 Demo
└── README.md
```

## 快速使用（3 步）

```html
<link rel="stylesheet" href="dog-sprite.css" />   <!-- 可选 -->
<div class="gaze-dog" id="dog"></div>              <!-- 空容器即可 -->

<script src="dog-sprite.js"></script>
<script>
  GazeDog(document.getElementById('dog'), {
    atlas: 'assets/dog-look-angle-atlas.webp',     // 改成你的实际路径
    size: 180,
  });
</script>
```

> 容器**不需要**预设宽高/背景，`size` 与精灵图背景都由 JS 注入。

## 配置项

| 选项 | 默认 | 说明 |
|---|---|---|
| `atlas` | `assets/dog-look-angle-atlas.webp` | 精灵图路径 |
| `size` | `150` | 显示尺寸(px)，方形 |
| `restFrame` | `157` | 静止朝向帧（正对前方） |
| `follow` | `'window'` | `'window'` 全窗跟随；传入 `HTMLElement` 则仅在该元素范围内跟随，离开即回正 |
| `response` | `0.11` | 弹簧响应时间，越小越跟手 |
| `maxSpeed` | `460` | 弹簧最大角速度 |
| `sensorButton` | `null` | 传入按钮元素即可启用移动端「开启体感」（陀螺仪） |

### 仅在某区域内跟随（如英雄区）

```js
GazeDog(dogEl, { follow: document.querySelector('.hero') });
```

## API

```js
const dog = GazeDog(el, opts);
dog.lookTo(clientX, clientY); // 手动看向某屏幕坐标
dog.rest();                   // 立即回正
dog.destroy();                // 解绑事件并停止渲染循环
```

## 原理

- 精灵图是一圈 **240 帧的连续转头动画**，帧号本身就代表「朝向角度」（单位 = 240）。
- 组件把光标相对小狗中心的方位角 `atan2(dy,dx)` 映射进这 240 的角度空间，得到目标帧。
- 用**临界阻尼弹簧**（smoothDamp）让当前帧平滑逼近目标帧，因此转头自然、无跳变、越过即吸附。
- `background-size: 1600% 1500%` + `background-position` 逐帧定位（16 列 / 15 行）。

## 换成你自己的精灵图

只要是「水平一圈转头」的等分精灵图即可，按你的图调整：
`cols`、`rows`、`total`(=cols×rows) 与 `restFrame`（正对前方那一帧的序号）。

## 许可

精灵素材来自 oiloil.org，请自行确认版权后再用于生产环境；本组件代码可自由使用。
