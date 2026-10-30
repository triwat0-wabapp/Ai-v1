import React, { useRef, useState } from 'react';
import {
  Scissors,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Gauge,
  Film,
  Subtitles,
  Volume2,
  Layers,
} from 'lucide-react';
import { VideoClip, SubtitleCue } from '../types/editor';
import { formatTimecodeUI } from '../utils/subtitleUtils';

interface TimelineProps {
  videoClips: VideoClip[];
  subtitles: SubtitleCue[];
  currentTime: number;
  totalDuration: number;
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onSeek: (time: number) => void;
  onSplitClip: () => void;
  onDeleteClip: (id: string) => void;
  onDuplicateClip: (id: string) => void;
  onChangeSpeed: (id: string, speed: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  videoClips,
  subtitles,
  currentTime,
  totalDuration,
  selectedClipId,
  onSelectClip,
  onSeek,
  onSplitClip,
  onDeleteClip,
  onDuplicateClip,
  onChangeSpeed,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(30); // pixels per second
  const timelineTracksRef = useRef<HTMLDivElement>(null);

  // Compute timeline total width
  const timelineWidth = Math.max(1200, Math.ceil((totalDuration + 5) * zoomLevel));

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineTracksRef.current) return;
    const rect = timelineTracksRef.current.getBoundingClientRect();
    const scrollLeft = timelineTracksRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const targetTime = Math.max(0, Math.min(totalDuration, clickX / zoomLevel));
    onSeek(targetTime);
  };

  const selectedClip = videoClips.find(c => c.id === selectedClipId);

  // Generate ruler ticks (every 1 second small tick, every 5 seconds labeled)
  const rulerTicks = [];
  const tickCount = Math.ceil(totalDuration + 5);
  for (let s = 0; s <= tickCount; s++) {
    rulerTicks.push(s);
  }

  return (
    <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl select-none">
      {/* Top Timeline Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-950/70 text-xs">
        {/* Editing Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSplitClip}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            title="ตัดคลิป ณ ตำแหน่งหัวอ่าน (Split Tool)"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>ตัดคลิป (Split)</span>
          </button>

          <button
            onClick={() => selectedClipId && onDuplicateClip(selectedClipId)}
            disabled={!selectedClipId}
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="ทำซ้ำคลิปที่เลือก"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => selectedClipId && onDeleteClip(selectedClipId)}
            disabled={!selectedClipId || videoClips.length <= 1}
            className="p-1.5 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="ลบคลิปที่เลือก"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          {selectedClip && (
            <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-neutral-800">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-neutral-400">ความเร็ว:</span>
              {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => onChangeSpeed(selectedClip.id, speed)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums transition-colors cursor-pointer ${
                    selectedClip.speed === speed
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white bg-neutral-800'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Zoom controls & Current Timecode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-neutral-400">
            <button
              onClick={() => setZoomLevel(Math.max(15, zoomLevel - 5))}
              className="p-1 hover:text-white transition-colors cursor-pointer"
              title="ซูมออกไทม์ไลน์"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono tabular-nums w-10 text-center">{zoomLevel}px/s</span>
            <button
              onClick={() => setZoomLevel(Math.min(80, zoomLevel + 5))}
              className="p-1 hover:text-white transition-colors cursor-pointer"
              title="ซูมเข้าไทม์ไลน์"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="font-mono text-xs tabular-nums text-amber-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            {formatTimecodeUI(currentTime)}
          </div>
        </div>
      </div>

      {/* Main Track Workspace with Sticky Headers */}
      <div className="flex flex-1 min-h-[160px] max-h-[220px] overflow-hidden">
        {/* Track Label Column */}
        <div className="w-28 shrink-0 bg-neutral-950 border-r border-neutral-800 flex flex-col z-20 text-[11px] text-neutral-400">
          <div className="h-7 border-b border-neutral-800 flex items-center px-3 font-semibold text-neutral-500">
            แทร็กมีเดีย
          </div>
          <div className="h-14 border-b border-neutral-800 flex items-center px-3 gap-1.5 text-neutral-300 font-medium">
            <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>วิดีโอ 1</span>
          </div>
          <div className="h-10 border-b border-neutral-800 flex items-center px-3 gap-1.5 text-neutral-300 font-medium">
            <Subtitles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>ซับไตเติ้ล</span>
          </div>
          <div className="h-10 flex items-center px-3 gap-1.5 text-neutral-300 font-medium">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>เสียงออดิโอ</span>
          </div>
        </div>

        {/* Scrollable Tracks Area */}
        <div
          ref={timelineTracksRef}
          onClick={handleTimelineClick}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-neutral-900 cursor-pointer scrollbar-thin"
        >
          <div className="relative" style={{ width: `${timelineWidth}px`, height: '100%' }}>
            {/* Time Ruler */}
            <div className="h-7 border-b border-neutral-800 bg-neutral-950/90 relative flex items-end">
              {rulerTicks.map(sec => {
                const isMajor = sec % 5 === 0;
                return (
                  <div
                    key={sec}
                    className="absolute bottom-0 flex flex-col items-center"
                    style={{ left: `${sec * zoomLevel}px` }}
                  >
                    {isMajor && (
                      <span className="text-[9px] font-mono text-neutral-400 mb-1 -translate-x-1/2 select-none">
                        {sec}s
                      </span>
                    )}
                    <div
                      className={`w-px ${isMajor ? 'h-3 bg-neutral-600' : 'h-1.5 bg-neutral-800'}`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Red / Amber Scrubbing Playhead Needle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 pointer-events-none flex flex-col items-center"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              <div className="w-3 h-3 bg-amber-400 rotate-45 -mt-1 shadow-md shadow-amber-500/50" />
              <div className="w-0.5 flex-1 bg-amber-400 shadow-sm" />
            </div>

            {/* Track 1: Video Clips */}
            <div className="h-14 border-b border-neutral-800/80 relative p-1">
              {videoClips.map((clip) => {
                const clipDuration = (clip.trimEnd - clip.trimStart) / clip.speed;
                const widthPx = clipDuration * zoomLevel;
                const leftPx = clip.startTime * zoomLevel;
                const isSelected = selectedClipId === clip.id;

                return (
                  <div
                    key={clip.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClip(clip.id);
                    }}
                    className={`absolute top-1 bottom-1 rounded-md overflow-hidden border transition-all flex items-center px-2 cursor-pointer shadow-sm ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/25 ring-2 ring-amber-400/40 text-white z-10'
                        : 'border-neutral-700 bg-neutral-800/90 text-neutral-200 hover:border-neutral-600'
                    }`}
                    style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Film className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-[11px] font-medium truncate">{clip.name}</span>
                      <span className="text-[9px] font-mono text-neutral-400">
                        {clipDuration.toFixed(1)}s
                      </span>
                    </div>

                    {/* Clip Trim Handles indicator */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/60 rounded-l" />
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-400/60 rounded-r" />
                  </div>
                );
              })}
            </div>

            {/* Track 2: Subtitle Track */}
            <div className="h-10 border-b border-neutral-800/80 relative p-1 bg-neutral-950/30">
              {subtitles.map((cue) => {
                const cueDuration = Math.max(0.2, cue.end - cue.start);
                const widthPx = cueDuration * zoomLevel;
                const leftPx = cue.start * zoomLevel;
                const isCurrent = currentTime >= cue.start && currentTime <= cue.end;

                return (
                  <div
                    key={cue.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(cue.start);
                    }}
                    className={`absolute top-1 bottom-1 rounded border px-1.5 flex items-center overflow-hidden cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300 hover:border-cyan-600'
                    }`}
                    style={{ left: `${leftPx}px`, width: `${Math.max(20, widthPx)}px` }}
                    title={`${cue.text} (${cue.start.toFixed(1)}s - ${cue.end.toFixed(1)}s)`}
                  >
                    <span className="text-[10px] truncate font-medium">{cue.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Track 3: Audio Track */}
            <div className="h-10 relative p-1 bg-neutral-950/50">
              {videoClips.map((clip) => {
                const clipDuration = (clip.trimEnd - clip.trimStart) / clip.speed;
                const widthPx = clipDuration * zoomLevel;
                const leftPx = clip.startTime * zoomLevel;

                return (
                  <div
                    key={`audio-${clip.id}`}
                    className="absolute top-1 bottom-1 rounded border border-emerald-800/50 bg-emerald-950/30 flex items-center px-2 overflow-hidden pointer-events-none"
                    style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                  >
                    {/* Simulated Audio Waveform Bar */}
                    <div className="flex items-center gap-0.5 w-full opacity-60">
                      {Array.from({ length: Math.min(60, Math.floor(widthPx / 4)) }).map((_, i) => {
                        const h = 20 + Math.sin(i * 0.8) * 40 + Math.random() * 30;
                        return (
                          <div
                            key={i}
                            className="w-0.5 bg-emerald-400 rounded-full"
                            style={{ height: `${Math.min(100, Math.max(15, h))}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
