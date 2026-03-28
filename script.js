
function makePRNG(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPerm(seed) {
  const rng = makePRNG(seed ^ 0xDEADBEEF);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
}

const GX = [ 1, -1,  1, -1,  0,  0,  1, -1];
const GY = [ 0,  0,  1, -1,  1, -1, -1,  1];
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const lerp  = (a, b, t) => a + t * (b - a);

function grad(h, x, y) {
  const i = h & 7;
  return GX[i] * x + GY[i] * y;
}

function perlin2d(x, y, p) {
  const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x),   yf = y - Math.floor(y);
  const u  = fade(xf), v = fade(yf);
  const aa = p[p[xi]     + yi],     ab = p[p[xi]     + yi + 1];
  const ba = p[p[xi + 1] + yi],     bb = p[p[xi + 1] + yi + 1];
  return lerp(
    lerp(grad(aa, xf,     yf    ), grad(ba, xf - 1, yf    ), u),
    lerp(grad(ab, xf,     yf - 1), grad(bb, xf - 1, yf - 1), u),
    v
  );
}

function generateNoiseMap({ width, height, seed, scale, octaves, persistence, lacunarity }) {
  scale = scale <= 0 ? 0.0001 : scale;
  const rng = makePRNG(seed >>> 0);
  const octOffsets = Array.from({ length: octaves }, () => ({
    x: rng() * 200000 - 100000,
    y: rng() * 200000 - 100000,
  }));
  const perm  = buildPerm(seed >>> 0);
  const halfW = width * 0.5, halfH = height * 0.5;
  const data  = new Float32Array(width * height);
  let minH = Infinity, maxH = -Infinity;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let amp = 1, freq = 1, noiseH = 0;
      for (let i = 0; i < octaves; i++) {
        const sx = (x - halfW) / scale * freq + octOffsets[i].x;
        const sy = (y - halfH) / scale * freq + octOffsets[i].y;
        noiseH += perlin2d(sx, sy, perm) * amp;
        amp *= persistence; freq *= lacunarity;
      }
      data[y * width + x] = noiseH;
      if (noiseH > maxH) maxH = noiseH;
      if (noiseH < minH) minH = noiseH;
    }
  }
  const range = (maxH - minH) > 1e-8 ? (maxH - minH) : 1e-8;
  for (let i = 0; i < data.length; i++) data[i] = (data[i] - minH) / range;
  return data;
}



let TILES = [
  { name: 'Deep water', max: 0.25, r:   5, g:  25, b:  80 },
  { name: 'Water',      max: 0.40, r:  20, g:  80, b: 180 },
  { name: 'Shallows',   max: 0.44, r:  40, g: 130, b: 200 },
  { name: 'Sand',       max: 0.48, r: 220, g: 200, b: 140 },
  { name: 'Grass',      max: 0.62, r:  60, g: 140, b:  50 },
  { name: 'Forest',     max: 0.75, r:  25, g:  85, b:  30 },
  { name: 'Highland',   max: 0.84, r: 100, g: 110, b:  80 },
  { name: 'Mountain',   max: 0.91, r: 130, g: 125, b: 120 },
  { name: 'Snow',       max: Infinity, r: 235, g: 240, b: 250 },
];

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function buildTileList() {
  const el = document.getElementById('tileList');
  el.innerHTML = '';
  TILES.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'tile-row';
    const isLast = t.max === Infinity;
    row.innerHTML = `
      <div class="swatch" id="sw${i}" style="background:rgb(${t.r},${t.g},${t.b})"></div>
      <input type="color" id="col${i}" value="${rgbToHex(t.r, t.g, t.b)}" title="Pick colour">
      <span class="tile-name">${t.name}</span>
      ${isLast
        ? `<span style="font-size:10px;color:#bbb">≥0.91</span>`
        : `<input type="number" class="threshold" id="mx${i}" value="${t.max}" min="0" max="1" step="0.01">`
      }
    `;
    el.appendChild(row);

    document.getElementById('col' + i).addEventListener('input', e => {
      const rgb = hexToRgb(e.target.value);
      TILES[i].r = rgb.r; TILES[i].g = rgb.g; TILES[i].b = rgb.b;
      document.getElementById('sw' + i).style.background = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
      if (lastData) redraw();
    });

    if (!isLast) {
      document.getElementById('mx' + i).addEventListener('change', e => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) { TILES[i].max = v; if (lastData) redraw(); }
      });
    }
  });
}


let lastData = null, lastW = 0;

function redraw() {
  const width    = lastW;
  const TILE_PX  = Math.max(1, Math.floor(512 / width));
  const imgW     = width * TILE_PX, imgH = width * TILE_PX;
  const coloured = document.getElementById('colourMode').checked;

  document.getElementById('regionsPanel').style.display = coloured ? '' : 'none';

  const canvas  = document.getElementById('mapCanvas');
  canvas.width  = imgW; canvas.height = imgH;
  const ctx     = canvas.getContext('2d');
  const imgData = ctx.createImageData(imgW, imgH);
  const px      = imgData.data;
  const counts  = new Array(TILES.length).fill(0);

  for (let ty = 0; ty < width; ty++) {
    for (let tx = 0; tx < width; tx++) {
      const v = lastData[ty * width + tx];
      let r, g, b;

      if (coloured) {
        const ti   = TILES.findIndex(t => v < t.max);
        const idx  = ti < 0 ? TILES.length - 1 : ti;
        const tile = TILES[idx];
        counts[idx]++;
        const bright = 0.85 + v * 0.3;
        r = Math.min(255, tile.r * bright) | 0;
        g = Math.min(255, tile.g * bright) | 0;
        b = Math.min(255, tile.b * bright) | 0;
      } else {
        const c = (v * 255) | 0;
        r = g = b = c;
      }

      for (let dy = 0; dy < TILE_PX; dy++) {
        for (let dx = 0; dx < TILE_PX; dx++) {
          const i = ((ty * TILE_PX + dy) * imgW + (tx * TILE_PX + dx)) * 4;
          px[i] = r; px[i+1] = g; px[i+2] = b; px[i+3] = 255;
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const total = width * width;
  document.getElementById('statsBar').innerHTML = coloured
    ? counts.map((c, i) => c > 0
        ? `<span>${TILES[i].name} <span class="stat-val">${(c / total * 100).toFixed(1)}%</span></span>`
        : '').join('')
    : '<span>Greyscale noise map</span>';
}



function generate() {
  const t0    = performance.now();
  const width = +document.getElementById('mapSize').value;
  lastW    = width;
  lastData = generateNoiseMap({
    width, height: width,
    seed:        +document.getElementById('seed').value,
    scale:       +document.getElementById('scale').value,
    octaves:     +document.getElementById('octaves').value,
    persistence: +document.getElementById('persistence').value,
    lacunarity:  +document.getElementById('lacunarity').value,
  });
  redraw();
  const elapsed = (performance.now() - t0).toFixed(1);
  document.getElementById('canvasMeta').textContent =
    `${width}×${width} · seed: ${document.getElementById('seed').value} · ${elapsed}ms`;
}

function updateLabels() {
  document.getElementById('seedVal').textContent    = document.getElementById('seed').value;
  const sz = +document.getElementById('mapSize').value;
  document.getElementById('sizeVal').textContent    = `${sz} × ${sz}`;
  document.getElementById('scaleVal').textContent   = document.getElementById('scale').value;
  document.getElementById('octavesVal').textContent = document.getElementById('octaves').value;
  document.getElementById('persistVal').textContent = (+document.getElementById('persistence').value).toFixed(2);
  document.getElementById('lacuVal').textContent    = (+document.getElementById('lacunarity').value).toFixed(2);
}

function randomSeed() {
  document.getElementById('seed').value = Math.floor(Math.random() * 999999);
  updateLabels();
}

function exportPNG() {
  const seed = document.getElementById('seed').value;
  const a    = document.createElement('a');
  a.download = `terrain_seed${seed}.png`;
  a.href     = document.getElementById('mapCanvas').toDataURL('image/png');
  a.click();
}

buildTileList();
updateLabels();
generate();
document.getElementById('seed').addEventListener('input', updateLabels);