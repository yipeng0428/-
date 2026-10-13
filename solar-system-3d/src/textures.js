/**
 * 程序化纹理生成
 * ---------------------------------------------------------------
 * 全部纹理在运行时用 Canvas 生成，项目因此不依赖任何外部贴图文件
 * （离线可用、无版权问题、体积为零）。代价是外观为"示意级"，
 * 不是真实探测器影像。
 *
 * 关键技巧：经纬度贴图在 u 方向必须无缝。做法是把 u 映射到圆柱面
 * (cos θ, sin θ)，用 3D 值噪声采样，经度方向天然闭合。
 */
(function (global) {
  'use strict';

  const SS = (global.SolarSystem = global.SolarSystem || {});
  const TAU = Math.PI * 2;

  /** 整数哈希 → [0,1)，比 sin(dot) 快且无平台差异 */
  function hash3(xi, yi, zi, seed) {
    let h = Math.imul(xi, 374761393) ^ Math.imul(yi, 668265263) ^ Math.imul(zi, 1274126177) ^ Math.imul(seed, 2147483647);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  function smooth(t) { return t * t * (3 - 2 * t); }

  /** 三线性插值的 3D 值噪声 */
  function valueNoise3(x, y, z, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = smooth(xf), v = smooth(yf), w = smooth(zf);

    const c000 = hash3(xi, yi, zi, seed);
    const c100 = hash3(xi + 1, yi, zi, seed);
    const c010 = hash3(xi, yi + 1, zi, seed);
    const c110 = hash3(xi + 1, yi + 1, zi, seed);
    const c001 = hash3(xi, yi, zi + 1, seed);
    const c101 = hash3(xi + 1, yi, zi + 1, seed);
    const c011 = hash3(xi, yi + 1, zi + 1, seed);
    const c111 = hash3(xi + 1, yi + 1, zi + 1, seed);

    const x00 = c000 + (c100 - c000) * u;
    const x10 = c010 + (c110 - c010) * u;
    const x01 = c001 + (c101 - c001) * u;
    const x11 = c011 + (c111 - c011) * u;
    const y0 = x00 + (x10 - x00) * v;
    const y1 = x01 + (x11 - x01) * v;
    return y0 + (y1 - y0) * w;
  }

  /** 分形叠加噪声（fBm） */
  function fbm(x, y, z, seed, octaves, lacunarity, gain) {
    let amp = 0.5, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i += 1) {
      sum += amp * valueNoise3(x * freq, y * freq, z * freq, seed + i * 101);
      norm += amp;
      freq *= lacunarity || 2;
      amp *= gain || 0.5;
    }
    return sum / norm;
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  /** 把 [0,1] 映射到调色板上的渐变色 */
  function ramp(palette, t) {
    const stops = palette.length - 1;
    const p = Math.min(0.9999, Math.max(0, t)) * stops;
    const i = Math.floor(p);
    const f = p - i;
    const a = hexToRgb(palette[i]);
    const b = hexToRgb(palette[i + 1]);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  /**
   * 逐像素生成经纬度纹理。
   * shade(u, v, nx, ny, nz) → [r,g,b]，其中 (nx,ny,nz) 为圆柱采样坐标。
   */
  function renderEquirect(width, height, shade) {
    const canvas = makeCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(width, height);
    const data = img.data;
    for (let y = 0; y < height; y += 1) {
      const v = (y + 0.5) / height;          // 0 = 北极, 1 = 南极
      const lat = (0.5 - v) * Math.PI;       // [-π/2, π/2]
      const cosLat = Math.cos(lat);
      for (let x = 0; x < width; x += 1) {
        const u = (x + 0.5) / width;
        const theta = u * TAU;
        // 圆柱采样：经度闭合；乘 cosLat 让极区收敛，避免极点处纹理拉伸撕裂
        const nx = Math.cos(theta) * cosLat;
        const ny = Math.sin(theta) * cosLat;
        const nz = Math.sin(lat);
        const rgb = shade(u, v, nx, ny, nz, lat);
        const i = (y * width + x) * 4;
        data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2]; data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  const SEEDS = { mercury: 11, venus: 29, earth: 47, mars: 73, jupiter: 101, saturn: 131, uranus: 167, neptune: 199, pluto: 233, sun: 307 };

  /** 岩质行星：噪声混色 + 稀疏"撞击坑"亮环 */
  function rockyTexture(body, size) {
    const seed = SEEDS[body.key] || 7;
    const pal = body.palette || ['#3a3a3a', '#7a7a7a', '#aaaaaa', '#dddddd'];
    const S = 4.2;
    return renderEquirect(size, size / 2, (u, v, nx, ny, nz) => {
      const base = fbm(nx * S, ny * S, nz * S, seed, 5, 2.1, 0.55);
      const detail = fbm(nx * S * 7, ny * S * 7, nz * S * 7, seed + 17, 3, 2.3, 0.5);
      let t = base * 0.78 + detail * 0.22;
      // 坑洞：取高频噪声的脊线
      const crater = Math.abs(valueNoise3(nx * 22, ny * 22, nz * 22, seed + 61) - 0.5) * 2;
      t += (1 - crater) > 0.86 ? 0.14 : 0;
      const c = ramp(pal, t);
      const shade = 0.92 + detail * 0.16;
      return [c[0] * shade, c[1] * shade, c[2] * shade];
    });
  }

  /** 火星：岩质 + 极冠 */
  function marsTexture(body, size) {
    const seed = SEEDS.mars;
    const pal = body.palette;
    const S = 3.6;
    return renderEquirect(size, size / 2, (u, v, nx, ny, nz, lat) => {
      const base = fbm(nx * S, ny * S, nz * S, seed, 5, 2.1, 0.55);
      const detail = fbm(nx * S * 6, ny * S * 6, nz * S * 6, seed + 23, 3, 2.2, 0.5);
      let t = base * 0.75 + detail * 0.25;
      const c = ramp(pal, t);
      // 极冠：纬度 > 72° 渐变为白，边缘用噪声打碎
      const latAbs = Math.abs(lat) / (Math.PI / 2);
      const capEdge = 0.80 - detail * 0.10;
      let r = c[0], g = c[1], b = c[2];
      if (latAbs > capEdge) {
        const k = Math.min(1, (latAbs - capEdge) / 0.14);
        r += (248 - r) * k; g += (250 - g) * k; b += (255 - b) * k;
      }
      return [r, g, b];
    });
  }

  /** 地球：海陆 + 极冠 + 云层（云直接烘进漫反射贴图，省一层网格） */
  function earthTexture(size) {
    const seed = SEEDS.earth;
    const ocean = ['#06264f', '#0b3f7a', '#1267a8', '#2e8fc4'];
    const land = ['#1d4a24', '#3d6b2a', '#6d7f3a', '#8d7a52', '#b8a882'];
    const S = 2.9;
    return renderEquirect(size, size / 2, (u, v, nx, ny, nz, lat) => {
      const cont = fbm(nx * S, ny * S, nz * S, seed, 6, 2.05, 0.55);
      const detail = fbm(nx * S * 6, ny * S * 6, nz * S * 6, seed + 31, 3, 2.2, 0.5);
      const h = cont * 0.82 + detail * 0.18;
      let r, g, b;
      if (h > 0.515) {
        const e = Math.min(1, (h - 0.515) / 0.30);
        const c = ramp(land, e);
        r = c[0]; g = c[1]; b = c[2];
      } else {
        const d = Math.min(1, (0.515 - h) / 0.26);
        const c = ramp(ocean, 1 - d);
        r = c[0]; g = c[1]; b = c[2];
      }
      // 极冠
      const latAbs = Math.abs(lat) / (Math.PI / 2);
      const capEdge = 0.80 - detail * 0.12;
      if (latAbs > capEdge) {
        const k = Math.min(1, (latAbs - capEdge) / 0.16);
        r += (246 - r) * k; g += (249 - g) * k; b += (255 - b) * k;
      }
      // 云：另一套噪声，带纬向拉伸
      const cl = fbm(nx * 3.4, ny * 3.4, nz * 6.5, seed + 77, 5, 2.2, 0.55);
      const cloud = Math.max(0, (cl - 0.52) / 0.30);
      const k = Math.min(0.88, cloud);
      return [r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k];
    });
  }

  /** 金星：致密云层涡旋（domain warp） */
  function venusTexture(body, size) {
    const seed = SEEDS.venus;
    const pal = body.palette;
    return renderEquirect(size, size / 2, (u, v, nx, ny, nz, lat) => {
      const warp = fbm(nx * 2.2, ny * 2.2, nz * 2.2, seed + 5, 4, 2.1, 0.5);
      const swirl = fbm(nx * 3.0 + warp * 2.4, ny * 3.0, nz * 7.0 + warp * 1.2, seed, 5, 2.1, 0.55);
      const banded = swirl * 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(lat * 9 + warp * 5));
      const c = ramp(pal, banded);
      return c;
    });
  }

  /** 气态巨行星：纬向条带 + 湍流扰动 +（木星）大红斑 */
  function gasTexture(body, size) {
    const seed = SEEDS[body.key] || 97;
    const pal = body.palette;
    const bands = body.bands || 10;
    const spot = !!body.spot;
    return renderEquirect(size, size / 2, (u, v, nx, ny, nz, lat) => {
      // 湍流让条带边界起伏，而不是笔直的线
      const turb = fbm(nx * 2.4, ny * 2.4, nz * 5.5, seed, 5, 2.15, 0.55) - 0.5;
      const latB = lat * bands + turb * 2.6;
      let t = 0.5 + 0.5 * Math.sin(latB);
      t = Math.pow(t, 0.85);
      t = t * 0.78 + fbm(nx * 6, ny * 6, nz * 14, seed + 41, 3, 2.2, 0.5) * 0.22;
      const c = ramp(pal, t);
      let r = c[0], g = c[1], b = c[2];
      if (spot) {
        // 大红斑：椭圆形，经度 0.78 / 南纬 22°
        const du = Math.min(Math.abs(u - 0.78), 1 - Math.abs(u - 0.78)) / 0.085;
        const dv = (lat + 0.38) / 0.10;
        const d = Math.sqrt(du * du + dv * dv);
        if (d < 1) {
          const k = Math.pow(1 - d, 0.6) * 0.92;
          r += (198 - r) * k; g += (84 - g) * k; b += (52 - b) * k;
        }
      }
      return [r, g, b];
    });
  }

  /**
   * 月球：高反照率高地 + 低反照率月海 + 撞击坑。
   * 月海集中在"近地面"（纹理 u≈0.5 一侧），因为潮汐锁定后我们只看得到那一面，
   * 而真实月海确实几乎全部分布在近地面——这个不对称是月球外观最醒目的特征。
   */
  function moonTexture(body, size) {
    const seed = 911;
    const pal = body.palette;
    return renderEquirect(size, size / 2, (u, v, nx, ny, nz, lat) => {
      const base = fbm(nx * 5.0, ny * 5.0, nz * 5.0, seed, 5, 2.1, 0.55);
      const fine = fbm(nx * 18, ny * 18, nz * 18, seed + 29, 3, 2.3, 0.5);
      let t = 0.46 + base * 0.34 + fine * 0.20;

      // 月海：低频噪声取阈值，并按"离近地面中心的远近"加权
      const toNear = Math.cos((u - 0.5) * TAU) * Math.cos(lat); // 近地面 ≈ +1
      const maria = fbm(nx * 2.0, ny * 2.0, nz * 2.0, seed + 71, 3, 2.0, 0.5);
      const mariaMask = (maria - 0.46) * 3.2 + (toNear - 0.35) * 1.1;
      if (mariaMask > 0) t -= Math.min(0.34, mariaMask * 0.42);

      // 撞击坑：高频脊线，高地一侧更密
      const crater = Math.abs(valueNoise3(nx * 26, ny * 26, nz * 26, seed + 13) - 0.5) * 2;
      if (crater > 0.90) t += 0.10;
      if (crater < 0.045) t -= 0.06;

      const c = ramp(pal, Math.max(0, Math.min(1, t)));
      return c;
    });
  }

  /** 太阳：米粒组织 + 亮斑 */
  function sunTexture(size) {
    const seed = SEEDS.sun;
    return renderEquirect(size, size / 2, (u, v, nx, ny, nz) => {
      const gran = fbm(nx * 14, ny * 14, nz * 14, seed, 4, 2.2, 0.5);
      const macro = fbm(nx * 3.5, ny * 3.5, nz * 3.5, seed + 13, 3, 2.1, 0.5);
      const t = gran * 0.55 + macro * 0.45;
      const c = ramp(['#ff8a1e', '#ffb43c', '#ffdc7a', '#fff6d2'], t);
      return c;
    });
  }

  /** 土星环：沿半径方向的亮度/透明度剖面（含卡西尼环缝） */
  function ringTexture() {
    const w = 1024, h = 8;
    const canvas = makeCanvas(w, h);
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const data = img.data;
    // 以 inner=1.24 Rs, outer=2.27 Rs 为参考，标注主要环缝的归一化位置
    const gaps = [
      [0.00, 0.03, 0.15], // 内缘渐隐
      [0.26, 0.30, 0.45], // C/B 过渡
      [0.62, 0.68, 0.08], // 卡西尼环缝
      [0.95, 1.00, 0.20], // 外缘渐隐
    ];
    for (let x = 0; x < w; x += 1) {
      const t = x / (w - 1);
      let alpha = 0.92;
      let bright = 0.72 + 0.28 * Math.sin(t * 46) * 0.5 + 0.18 * Math.sin(t * 13.7);
      gaps.forEach(([a, b, mul]) => {
        if (t >= a && t <= b) {
          const mid = (a + b) / 2, half = (b - a) / 2;
          const k = 1 - Math.abs(t - mid) / half;
          alpha *= 1 - (1 - mul) * k;
        }
      });
      // 细密环纹
      alpha *= 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(t * 180));
      bright = Math.max(0.25, Math.min(1.1, bright));
      const r = 238 * bright, g = 226 * bright, b2 = 198 * bright;
      for (let y = 0; y < h; y += 1) {
        const i = (y * w + x) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b2; data[i + 3] = Math.round(alpha * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  /** 径向渐变精灵：太阳光晕、拾取高亮 */
  function glowTexture(size, inner, outer, power) {
    const canvas = makeCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    const data = img.data;
    const c = (size - 1) / 2;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const d = Math.sqrt((x - c) * (x - c) + (y - c) * (y - c)) / c;
        const a = Math.max(0, 1 - d);
        const k = Math.pow(a, power || 3);
        const i = (y * size + x) * 4;
        data[i] = inner[0] + (outer[0] - inner[0]) * (1 - k);
        data[i + 1] = inner[1] + (outer[1] - inner[1]) * (1 - k);
        data[i + 2] = inner[2] + (outer[2] - inner[2]) * (1 - k);
        data[i + 3] = Math.round(k * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  /**
   * 空心圆环精灵：真实尺寸下行星会缩成亚像素点，用固定像素大小的
   * "定位标记"把它们重新变得可见、可点。标记不是天体本身的大小。
   */
  function ringSpriteTexture(size, thickness) {
    const canvas = makeCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    const data = img.data;
    const c = (size - 1) / 2;
    const th = thickness || 0.14;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const d = Math.sqrt((x - c) * (x - c) + (y - c) * (y - c)) / c;
        // 以 r≈0.78 为中心的环带，内外侧各留一段柔化
        const band = 1 - Math.min(1, Math.abs(d - 0.78) / th);
        const a = Math.pow(Math.max(0, band), 1.4) * (d <= 1 ? 1 : 0);
        const i = (y * size + x) * 4;
        data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
        data[i + 3] = Math.round(a * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  /** 恒星点精灵（圆形、边缘柔化） */
  function starSpriteTexture(size) {
    return glowTexture(size || 32, [255, 255, 255], [255, 255, 255], 2.2);
  }

  function surfaceCanvasFor(body, size) {
    switch (body.texture) {
      case 'sun': return sunTexture(size);
      case 'moon': return moonTexture(body, size);
      case 'earth': return earthTexture(size);
      case 'mars': return marsTexture(body, size);
      case 'venus': return venusTexture(body, size);
      case 'gas': return gasTexture(body, size);
      case 'rocky':
      default: return rockyTexture(body, size);
    }
  }

  SS.Textures = {
    valueNoise3, fbm, renderEquirect, surfaceCanvasFor, moonTexture,
    ringTexture, glowTexture, starSpriteTexture, ringSpriteTexture,
  };
})(typeof window !== 'undefined' ? window : globalThis);
