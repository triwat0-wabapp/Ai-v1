import { VideoClip, SubtitleCue, SubtitleStyle, ColorGrade, ExportSettings, AspectRatioType } from '../types/editor';
import { ASPECT_RATIOS } from '../data/sampleMedia';
import { applyCanvasColorGrade, getCssFilterString } from './colorGrading';
import { renderSubtitleOnCanvas } from './subtitleUtils';

export interface RenderProgress {
  percent: number;
  currentSecond: number;
  totalSeconds: number;
  statusText: string;
}

/**
 * High-performance 4K & Social Media Video Render Engine
 */
export async function renderAndExportVideo(
  videoClips: VideoClip[],
  subtitles: SubtitleCue[],
  subtitleStyle: SubtitleStyle,
  colorGrade: ColorGrade,
  settings: ExportSettings,
  onProgress: (p: RenderProgress) => void
): Promise<{ blob: Blob; url: string; filename: string }> {
  // Determine output resolution based on settings.resolution and aspect ratio
  const aspectConfig = ASPECT_RATIOS.find(a => a.id === settings.aspectRatio) || ASPECT_RATIOS[0];
  
  let targetWidth = 3840;
  let targetHeight = 2160;

  if (settings.resolution === '4k') {
    targetWidth = aspectConfig.width;
    targetHeight = aspectConfig.height;
  } else if (settings.resolution === '2k') {
    targetWidth = Math.round(aspectConfig.width * 0.666);
    targetHeight = Math.round(aspectConfig.height * 0.666);
  } else if (settings.resolution === '1080p') {
    targetWidth = Math.round(aspectConfig.width * 0.5);
    targetHeight = Math.round(aspectConfig.height * 0.5);
  } else {
    // 720p
    targetWidth = Math.round(aspectConfig.width * 0.333);
    targetHeight = Math.round(aspectConfig.height * 0.333);
  }

  // Ensure dimensions are even numbers (required by video encoders)
  targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
  targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;

  // Compute total timeline duration
  const totalDuration = videoClips.reduce((max, clip) => {
    const end = clip.startTime + (clip.trimEnd - clip.trimStart) / clip.speed;
    return Math.max(max, end);
  }, 0) || 5;

  onProgress({
    percent: 2,
    currentSecond: 0,
    totalSeconds: totalDuration,
    statusText: `กำลังเตรียมแคนวาสความละเอียด ${targetWidth}x${targetHeight} (${settings.resolution.toUpperCase()})...`,
  });

  // Setup offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) throw new Error('Cannot acquire canvas context');

  // Pre-load video elements
  const videoElements: { clip: VideoClip; el: HTMLVideoElement }[] = [];
  for (const clip of videoClips) {
    const el = document.createElement('video');
    el.crossOrigin = 'anonymous';
    el.src = clip.url;
    el.muted = true;
    el.playsInline = true;
    el.preload = 'auto';
    await new Promise<void>((resolve) => {
      el.onloadeddata = () => resolve();
      el.onerror = () => resolve(); // fallback gracefully
      el.load();
    });
    videoElements.push({ clip, el });
  }

  // Setup MediaRecorder
  const fps = settings.fps || 30;
  const stream = canvas.captureStream(fps);

  // Setup high-fidelity audio mix if available
  let audioContext: AudioContext | null = null;
  let audioDest: MediaStreamAudioDestinationNode | null = null;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx && settings.includeAudio) {
      audioContext = new AudioCtx();
      audioDest = audioContext.createMediaStreamDestination();
      
      // Connect sound tracks to destination
      videoElements.forEach(({ clip, el }) => {
        try {
          if (!clip.muted && audioContext && audioDest) {
            const source = audioContext.createMediaElementSource(el);
            const gain = audioContext.createGain();
            gain.gain.value = clip.volume;
            source.connect(gain);
            gain.connect(audioDest);
          }
        } catch {
          // Audio source may be cross-origin or restricted
        }
      });

      if (audioDest.stream.getAudioTracks().length > 0) {
        stream.addTrack(audioDest.stream.getAudioTracks()[0]);
      }
    }
  } catch (e) {
    console.warn('Audio mixer initialization notice:', e);
  }

  // Determine mimeType supported by browser
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
  }

  const bitrate = (settings.bitrateMbps || 25) * 1000 * 1000;
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    videoBitsPerSecond: bitrate,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(100);

  // Start playback sequence and render frame-by-frame
  const frameIntervalMs = 1000 / fps;
  let currentTime = 0;
  const filterString = getCssFilterString(colorGrade);

  return new Promise((resolve, reject) => {
    recorder.onerror = (err) => reject(err);

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const cleanName = settings.filename.replace(/\.[^/.]+$/, '');
      const finalFilename = `${cleanName}_${settings.resolution}_${settings.aspectRatio.replace(':', 'x')}.${ext}`;
      
      if (audioContext) {
        audioContext.close().catch(() => {});
      }

      resolve({ blob, url, filename: finalFilename });
    };

    const renderStep = async () => {
      if (currentTime >= totalDuration) {
        onProgress({
          percent: 100,
          currentSecond: totalDuration,
          totalSeconds: totalDuration,
          statusText: 'เรนเดอร์เสร็จสิ้น กำลังประกอบไฟล์วิดีโอ 4K...',
        });
        recorder.stop();
        return;
      }

      // Find active clip for current time
      const activeItem = videoElements.find(({ clip }) => {
        const clipDur = (clip.trimEnd - clip.trimStart) / clip.speed;
        return currentTime >= clip.startTime && currentTime < clip.startTime + clipDur;
      });

      // Clear Canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      if (activeItem) {
        const { clip, el } = activeItem;
        const relativeTimeInClip = (currentTime - clip.startTime) * clip.speed + clip.trimStart;

        // Seek video element
        if (Math.abs(el.currentTime - relativeTimeInClip) > 0.08) {
          el.currentTime = relativeTimeInClip;
        }

        // Calculate aspect fill or fit
        ctx.save();
        ctx.filter = filterString;

        const videoRatio = el.videoWidth / (el.videoHeight || 1) || 16 / 9;
        const targetRatio = targetWidth / targetHeight;

        let drawW = targetWidth;
        let drawH = targetHeight;
        let drawX = 0;
        let drawY = 0;

        if (videoRatio > targetRatio) {
          // Video is wider, crop horizontal or scale
          drawW = targetHeight * videoRatio;
          drawX = (targetWidth - drawW) / 2;
        } else {
          // Video is taller, crop vertical or scale
          drawH = targetWidth / videoRatio;
          drawY = (targetHeight - drawH) / 2;
        }

        ctx.drawImage(el, drawX, drawY, drawW, drawH);
        ctx.restore();
      } else {
        // Black screen between clips or background
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Apply Canvas color grading overlay (vignette, film grain, tint, bars)
      applyCanvasColorGrade(ctx, targetWidth, targetHeight, colorGrade);

      // Render Subtitles (if enabled)
      if (settings.includeSubtitles) {
        const activeCue = subtitles.find(s => currentTime >= s.start && currentTime <= s.end) || null;
        renderSubtitleOnCanvas(ctx, targetWidth, targetHeight, activeCue, subtitleStyle, currentTime);
      }

      // Update progress
      const percent = Math.min(99, Math.round((currentTime / totalDuration) * 98));
      onProgress({
        percent,
        currentSecond: Number(currentTime.toFixed(1)),
        totalSeconds: Number(totalDuration.toFixed(1)),
        statusText: `กำลังเรนเดอร์เฟรมที่ความละเอียด ${targetWidth}x${targetHeight}... (${currentTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s)`,
      });

      currentTime += frameIntervalMs / 1000;
      setTimeout(renderStep, 10);
    };

    renderStep();
  });
}
