import { SubtitleCue, SubtitleStyle } from '../types/editor';

/**
 * Format seconds into SRT timecode: 00:01:23,456
 */
export function formatTimecodeSRT(seconds: number): string {
  const pad = (n: number, z = 2) => ('00' + n).slice(-z);
  const ms = Math.floor((seconds % 1) * 1000);
  const totalSeconds = Math.floor(seconds);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/**
 * Format seconds into UI timecode: 00:01:23.4
 */
export function formatTimecodeUI(seconds: number): string {
  const pad = (n: number) => ('00' + n).slice(-2);
  const ms = Math.floor((seconds % 1) * 10);
  const totalSeconds = Math.floor(seconds);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${ms}`;
}

/**
 * Generates .SRT format string from subtitle cues
 */
export function exportToSRT(cues: SubtitleCue[]): string {
  const sorted = [...cues].sort((a, b) => a.start - b.start);
  return sorted
    .map((cue, index) => {
      return `${index + 1}\n${formatTimecodeSRT(cue.start)} --> ${formatTimecodeSRT(cue.end)}\n${cue.text}\n`;
    })
    .join('\n');
}

/**
 * Generates .VTT format string
 */
export function exportToVTT(cues: SubtitleCue[]): string {
  const sorted = [...cues].sort((a, b) => a.start - b.start);
  const body = sorted
    .map((cue, index) => {
      const startVTT = formatTimecodeSRT(cue.start).replace(',', '.');
      const endVTT = formatTimecodeSRT(cue.end).replace(',', '.');
      return `${index + 1}\n${startVTT} --> ${endVTT}\n${cue.text}\n`;
    })
    .join('\n');
  return `WEBVTT\n\n${body}`;
}

/**
 * Downloads a text content as a file in browser
 */
export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Renders active subtitle onto an export or preview canvas
 */
export function renderSubtitleOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  activeCue: SubtitleCue | null,
  style: SubtitleStyle,
  currentTime: number
) {
  if (!activeCue || !activeCue.text.trim()) return;

  ctx.save();

  // Dynamic scale factor relative to standard 1080p
  const scale = width / 1920;
  const baseFontSize = Math.round(style.fontSize * scale);
  const fontFamily =
    style.fontFamily === 'serif'
      ? "'Playfair Display', Georgia, serif"
      : style.fontFamily === 'mono'
      ? "'JetBrains Mono', monospace"
      : "'Plus Jakarta Sans', system-ui, sans-serif";

  const fontStyle = style.preset === 'tiktok' ? '800' : '700';
  ctx.font = `${fontStyle} ${baseFontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = style.allCaps ? activeCue.text.toUpperCase() : activeCue.text;

  // Compute vertical position
  let posY = height * 0.88; // Default bottom
  if (style.position === 'center') posY = height * 0.5;
  if (style.position === 'top') posY = height * 0.14;

  const posX = width / 2;
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = baseFontSize * 1.3;

  // Background Box (if styled or preset)
  if (style.preset === 'tiktok' || style.bgColor !== 'transparent') {
    const padX = baseFontSize * 0.8;
    const padY = baseFontSize * 0.35;
    const boxX = posX - textWidth / 2 - padX;
    const boxY = posY - textHeight / 2 - padY;
    const boxW = textWidth + padX * 2;
    const boxH = textHeight + padY * 2;
    const radius = Math.round(12 * scale);

    ctx.fillStyle = style.preset === 'tiktok' ? 'rgba(0, 0, 0, 0.78)' : style.bgColor;
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, radius);
  }

  // Outline / Stroke
  if (style.outline || style.preset === 'netflix' || style.preset === 'tiktok') {
    ctx.lineWidth = Math.max(3, Math.round(6 * scale));
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, posX, posY);
  }

  // Glow effect (Neon)
  if (style.preset === 'neon' || style.glow) {
    ctx.shadowColor = style.highlightColor || '#00f2fe';
    ctx.shadowBlur = Math.round(18 * scale);
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = Math.round(4 * scale);
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;
  }

  // Word-by-word active highlight for TikTok style
  if (style.preset === 'tiktok') {
    // Fill with punchy yellow or custom highlight
    ctx.fillStyle = style.highlightColor || '#facc15';
    ctx.fillText(text, posX, posY);
  } else {
    ctx.fillStyle = style.color || '#ffffff';
    ctx.fillText(text, posX, posY);
  }

  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
