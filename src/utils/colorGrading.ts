import { ColorGrade } from '../types/editor';

/**
 * Builds CSS filter string from ColorGrade object for high-performance GPU playback
 */
export function getCssFilterString(grade: ColorGrade): string {
  const contrast = grade.contrast / 100;
  const brightness = grade.brightness / 100;
  const saturation = grade.saturation / 100;
  const sepia = Math.max(0, grade.temperature) / 100 * 0.4;
  const hueRotate = grade.tint * 0.6; // degrees

  return `contrast(${contrast}) brightness(${brightness}) saturate(${saturation}) sepia(${sepia}) hue-rotate(${hueRotate}deg)`;
}

/**
 * Applies color grading, vignette, and film grain to an HTML Canvas 2D context
 */
export function applyCanvasColorGrade(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  grade: ColorGrade
) {
  // 1. Color tint layer (Temperature warm/cool)
  if (grade.temperature !== 0) {
    ctx.save();
    if (grade.temperature > 0) {
      // Warm amber / orange
      ctx.fillStyle = `rgba(255, 140, 20, ${(grade.temperature / 100) * 0.18})`;
    } else {
      // Cool cyan / deep blue
      ctx.fillStyle = `rgba(30, 140, 255, ${(Math.abs(grade.temperature) / 100) * 0.22})`;
    }
    ctx.globalCompositeOperation = 'color';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 2. Tint layer (Green vs Magenta)
  if (grade.tint !== 0) {
    ctx.save();
    if (grade.tint > 0) {
      // Magenta
      ctx.fillStyle = `rgba(236, 72, 153, ${(grade.tint / 100) * 0.14})`;
    } else {
      // Green
      ctx.fillStyle = `rgba(34, 197, 94, ${(Math.abs(grade.tint) / 100) * 0.14})`;
    }
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 3. Vignette
  if (grade.vignette > 0) {
    ctx.save();
    const radius = Math.max(width, height) * 0.75;
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      radius * 0.3,
      width / 2,
      height / 2,
      radius
    );
    const alpha = (grade.vignette / 100) * 0.9;
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.6, `rgba(0, 0, 0, ${alpha * 0.4})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);

    ctx.fillStyle = gradient;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 4. Film Grain Simulation
  if (grade.grain > 0) {
    renderFilmGrain(ctx, width, height, grade.grain);
  }

  // 5. Cinematic Letterbox Anamorphic Bars (if enabled)
  if (grade.anamorphicBars) {
    ctx.save();
    ctx.fillStyle = '#000000';
    const barHeight = Math.round(height * 0.1);
    ctx.fillRect(0, 0, width, barHeight);
    ctx.fillRect(0, height - barHeight, width, barHeight);
    ctx.restore();
  }
}

/**
 * Fast procedural film grain generator onto canvas
 */
function renderFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number
) {
  // Use a small grain pattern tiled for performance
  const patternSize = 128;
  const offscreen = document.createElement('canvas');
  offscreen.width = patternSize;
  offscreen.height = patternSize;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  const imgData = offCtx.createImageData(patternSize, patternSize);
  const data = imgData.data;
  const grainAlpha = Math.min(255, Math.round((strength / 100) * 55));

  for (let i = 0; i < data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = grainAlpha;
  }
  offCtx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(offscreen, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

/**
 * Computes live RGB histogram stats from an image or video element
 */
export function computeRGBHistogram(
  source: HTMLVideoElement | HTMLCanvasElement
): { r: number[]; g: number[]; b: number[] } {
  const r = new Array(64).fill(0);
  const g = new Array(64).fill(0);
  const b = new Array(64).fill(0);

  try {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 120;
    sampleCanvas.height = 70;
    const ctx = sampleCanvas.getContext('2d');
    if (!ctx) return { r, g, b };

    ctx.drawImage(source, 0, 0, 120, 70);
    const imgData = ctx.getImageData(0, 0, 120, 70);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const red = Math.floor(data[i] / 4);
      const green = Math.floor(data[i + 1] / 4);
      const blue = Math.floor(data[i + 2] / 4);

      if (r[red] !== undefined) r[red]++;
      if (g[green] !== undefined) g[green]++;
      if (b[blue] !== undefined) b[blue]++;
    }

    // Normalize
    const maxVal = Math.max(...r, ...g, ...b, 1);
    return {
      r: r.map(v => v / maxVal),
      g: g.map(v => v / maxVal),
      b: b.map(v => v / maxVal),
    };
  } catch {
    return { r, g, b };
  }
}
