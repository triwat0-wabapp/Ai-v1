import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SplitSquareVertical,
  Repeat,
  Smartphone,
  Tv,
  Square,
  Film,
} from 'lucide-react';
import { VideoClip, SubtitleCue, SubtitleStyle, ColorGrade, AspectRatioType } from '../types/editor';
import { ASPECT_RATIOS } from '../data/sampleMedia';
import { getCssFilterString } from '../utils/colorGrading';
import { formatTimecodeUI } from '../utils/subtitleUtils';

interface VideoPlayerProps {
  currentClip: VideoClip | null;
  videoClips: VideoClip[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  colorGrade: ColorGrade;
  subtitles: SubtitleCue[];
  subtitleStyle: SubtitleStyle;
  aspectRatio: AspectRatioType;
  onAspectRatioChange: (ar: AspectRatioType) => void;
  onTimeUpdate: (time: number) => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  currentClip,
  videoClips,
  currentTime,
  totalDuration,
  isPlaying,
  colorGrade,
  subtitles,
  subtitleStyle,
  aspectRatio,
  onAspectRatioChange,
  onTimeUpdate,
  onTogglePlay,
  onSeek,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const grainCanvasRef = useRef<HTMLCanvasElement>(null);

  const [volume, setVolume] = useState<number>(currentClip?.volume ?? 1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSplitCompare, setIsSplitCompare] = useState<boolean>(false);
  const [splitPos, setSplitPos] = useState<number>(50); // percentage
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Find active subtitle cue
  const activeSubtitle = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);

  // Sync video play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Sync video time when seeking or switching clips
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip) return;

    const targetClipTime = (currentTime - currentClip.startTime) * currentClip.speed + currentClip.trimStart;
    if (Math.abs(video.currentTime - targetClipTime) > 0.3) {
      video.currentTime = Math.max(currentClip.trimStart, Math.min(currentClip.trimEnd, targetClipTime));
    }
  }, [currentTime, currentClip]);

  // Handle native time update
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !currentClip) return;

    const clipRelative = (video.currentTime - currentClip.trimStart) / currentClip.speed;
    const timelineTime = currentClip.startTime + clipRelative;

    if (timelineTime >= currentClip.startTime + (currentClip.trimEnd - currentClip.trimStart) / currentClip.speed) {
      if (isLooping) {
        onSeek(0);
      } else {
        // Next clip or end
        const currentIndex = videoClips.findIndex(c => c.id === currentClip.id);
        if (currentIndex < videoClips.length - 1) {
          onSeek(videoClips[currentIndex + 1].startTime);
        } else {
          onTogglePlay();
          onSeek(0);
        }
      }
      return;
    }

    onTimeUpdate(timelineTime);
  };

  // Film Grain Canvas animation loop
  useEffect(() => {
    const canvas = grainCanvasRef.current;
    if (!canvas || colorGrade.grain <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const renderGrain = () => {
      canvas.width = 320;
      canvas.height = 180;
      const imgData = ctx.createImageData(canvas.width, canvas.height);
      const data = imgData.data;
      const strength = Math.min(255, (colorGrade.grain / 100) * 80);

      for (let i = 0; i < data.length; i += 4) {
        const val = (Math.random() * 255) | 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = strength;
      }
      ctx.putImageData(imgData, 0, 0);
      animId = requestAnimationFrame(renderGrain);
    };

    renderGrain();
    return () => cancelAnimationFrame(animId);
  }, [colorGrade.grain]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const selectedAspect = ASPECT_RATIOS.find(a => a.id === aspectRatio) || ASPECT_RATIOS[0];
  const cssFilter = getCssFilterString(colorGrade);

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl relative"
    >
      {/* Top Toolbar: Aspect Ratio & Comparison Mode */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800/80 bg-neutral-950/70 text-xs text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-neutral-400 mr-1">สัดส่วนภาพ:</span>
          {ASPECT_RATIOS.map(ar => (
            <button
              key={ar.id}
              onClick={() => onAspectRatioChange(ar.id)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                aspectRatio === ar.id
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800/70 text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
              title={ar.sublabel}
            >
              {ar.id === '9:16' && <Smartphone className="w-3 h-3" />}
              {ar.id === '16:9' && <Tv className="w-3 h-3" />}
              {ar.id === '1:1' && <Square className="w-3 h-3" />}
              {ar.id === '2.39:1' && <Film className="w-3 h-3" />}
              <span>{ar.id}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSplitCompare(!isSplitCompare)}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSplitCompare
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title="เปรียบเทียบก่อน-หลังเกรดสี"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ก่อน/หลังเกรดสี</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport Frame */}
      <div className="relative flex-1 flex items-center justify-center p-4 bg-neutral-950 min-h-[380px] max-h-[520px] select-none overflow-hidden">
        {/* Dynamic Aspect Ratio Wrapper */}
        <div
          className="relative overflow-hidden bg-black flex items-center justify-center shadow-2xl rounded-sm"
          style={{
            aspectRatio: `${selectedAspect.ratioValue}`,
            maxHeight: '100%',
            maxWidth: '100%',
            width: selectedAspect.ratioValue < 1 ? 'auto' : '100%',
            height: selectedAspect.ratioValue < 1 ? '100%' : 'auto',
          }}
        >
          {currentClip ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              {/* Primary Video Element */}
              <video
                ref={videoRef}
                src={currentClip.url}
                className="w-full h-full object-cover transition-all"
                style={{
                  filter: isSplitCompare ? undefined : cssFilter,
                }}
                onTimeUpdate={handleVideoTimeUpdate}
                playsInline
                preload="auto"
              />

              {/* Split Screen Before/After View */}
              {isSplitCompare && (
                <>
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                  >
                    <video
                      src={currentClip.url}
                      className="w-full h-full object-cover"
                      style={{ filter: cssFilter }}
                      muted
                      playsInline
                      ref={el => {
                        if (el && videoRef.current) {
                          el.currentTime = videoRef.current.currentTime;
                        }
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-neutral-950/80 px-2 py-0.5 rounded text-[10px] font-semibold text-amber-400 uppercase tracking-wider backdrop-blur-sm">
                      AI Color Graded
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 bg-neutral-950/80 px-2 py-0.5 rounded text-[10px] font-semibold text-neutral-400 uppercase tracking-wider backdrop-blur-sm pointer-events-none">
                    ต้นฉบับ Original
                  </div>

                  {/* Split Divider Handle */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 cursor-ew-resize z-20 flex items-center justify-center"
                    style={{ left: `${splitPos}%` }}
                    onMouseDown={(e) => {
                      const moveHandler = (moveEvent: MouseEvent) => {
                        const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                        if (!rect) return;
                        const pos = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                        setSplitPos(Math.max(5, Math.min(95, pos)));
                      };
                      const upHandler = () => {
                        window.removeEventListener('mousemove', moveHandler);
                        window.removeEventListener('mouseup', upHandler);
                      };
                      window.addEventListener('mousemove', moveHandler);
                      window.addEventListener('mouseup', upHandler);
                    }}
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-400 shadow-md flex items-center justify-center text-neutral-950 text-[10px] font-bold">
                      ↔
                    </div>
                  </div>
                </>
              )}

              {/* Vignette Overlay */}
              {colorGrade.vignette > 0 && !isSplitCompare && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${(colorGrade.vignette / 100) * 0.85}) 100%)`,
                  }}
                />
              )}

              {/* Film Grain Live Canvas */}
              {colorGrade.grain > 0 && !isSplitCompare && (
                <canvas
                  ref={grainCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay opacity-80"
                />
              )}

              {/* Anamorphic Bars (Cinemascope) */}
              {colorGrade.anamorphicBars && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-[8%] bg-black pointer-events-none z-10" />
                  <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-black pointer-events-none z-10" />
                </>
              )}

              {/* Subtitles Overlay */}
              {activeSubtitle && (
                <div
                  className={`absolute inset-x-4 pointer-events-none z-20 flex justify-center text-center transition-all ${
                    subtitleStyle.position === 'top'
                      ? 'top-8'
                      : subtitleStyle.position === 'center'
                      ? 'top-1/2 -translate-y-1/2'
                      : 'bottom-8'
                  }`}
                >
                  <div
                    className={`inline-block px-4 py-1.5 rounded-lg max-w-[90%] font-semibold tracking-wide transition-all ${
                      subtitleStyle.allCaps ? 'uppercase' : ''
                    }`}
                    style={{
                      fontSize: `${subtitleStyle.fontSize}px`,
                      color: subtitleStyle.color,
                      backgroundColor: subtitleStyle.bgColor,
                      fontFamily:
                        subtitleStyle.fontFamily === 'serif'
                          ? 'serif'
                          : subtitleStyle.fontFamily === 'mono'
                          ? 'monospace'
                          : 'inherit',
                      textShadow:
                        subtitleStyle.preset === 'neon'
                          ? `0 0 16px ${subtitleStyle.highlightColor}, 0 0 8px ${subtitleStyle.highlightColor}`
                          : '0 2px 8px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.9)',
                      WebkitTextStroke:
                        subtitleStyle.outline || subtitleStyle.preset === 'netflix' || subtitleStyle.preset === 'tiktok'
                          ? '1.5px black'
                          : 'none',
                    }}
                  >
                    {subtitleStyle.preset === 'tiktok' ? (
                      <span style={{ color: subtitleStyle.highlightColor }}>
                        {activeSubtitle.text}
                      </span>
                    ) : (
                      activeSubtitle.text
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 text-neutral-500">
              <Film className="w-12 h-12 mx-auto mb-2 opacity-40 text-neutral-400" />
              <p className="text-sm font-medium">ไม่มีคลิปวิดีโอในไทม์ไลน์</p>
              <p className="text-xs text-neutral-500 mt-1">เลือกคลิปตัวอย่างหรืออัปโหลดวิดีโอจากคลังสื่อ</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-950 border-t border-neutral-800 text-xs">
        {/* Left: Playback & Step Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 1))}
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="ย้อนหลัง 1 วินาที"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center transition-all shadow-md cursor-pointer"
            title={isPlaying ? 'หยุดชั่วคราว (Space)' : 'เล่นวิดีโอ (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isLooping ? 'text-amber-400 bg-amber-400/10' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title={isLooping ? 'วนซ้ำ (เปิดอยู่)' : 'วนซ้ำ (ปิดอยู่)'}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Timecode */}
          <div className="ml-3 font-mono text-xs tabular-nums text-neutral-300 flex items-center gap-1">
            <span className="text-amber-400 font-semibold">{formatTimecodeUI(currentTime)}</span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">{formatTimecodeUI(totalDuration)}</span>
          </div>
        </div>

        {/* Right: Audio Volume & Fullscreen */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              title="ระดับเสียง"
            />
          </div>

          <div className="h-4 w-px bg-neutral-800" />

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="เต็มจอ"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
