import React, { useState } from 'react';
import {
  X,
  Download,
  Film,
  Sparkles,
  Check,
  Loader2,
  Tv,
  Smartphone,
  Square,
  Play,
  Share2,
} from 'lucide-react';
import {
  VideoClip,
  SubtitleCue,
  SubtitleStyle,
  ColorGrade,
  ExportSettings,
  AspectRatioType,
} from '../types/editor';
import { ASPECT_RATIOS } from '../data/sampleMedia';
import { renderAndExportVideo, RenderProgress } from '../utils/exportEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoClips: VideoClip[];
  subtitles: SubtitleCue[];
  subtitleStyle: SubtitleStyle;
  colorGrade: ColorGrade;
  currentAspectRatio: AspectRatioType;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoClips,
  subtitles,
  subtitleStyle,
  colorGrade,
  currentAspectRatio,
}) => {
  const [resolution, setResolution] = useState<'4k' | '2k' | '1080p' | '720p'>('4k');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>(currentAspectRatio);
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [bitrateMbps, setBitrateMbps] = useState<50 | 25 | 12>(50);
  const [includeSubtitles, setIncludeSubtitles] = useState<boolean>(true);
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);

  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const [exportedResult, setExportedResult] = useState<{
    blob: Blob;
    url: string;
    filename: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsRendering(true);
    setProgress({
      percent: 1,
      currentSecond: 0,
      totalSeconds: 0,
      statusText: 'กำลังเริ่มต้นเอนจิ้นเรนเดอร์...',
    });

    try {
      const settings: ExportSettings = {
        resolution,
        aspectRatio,
        fps,
        bitrateMbps,
        includeSubtitles,
        includeAudio,
        filename: `CineFlow_${resolution.toUpperCase()}_Export`,
      };

      const result = await renderAndExportVideo(
        videoClips,
        subtitles,
        subtitleStyle,
        colorGrade,
        settings,
        (p) => setProgress(p)
      );

      setExportedResult(result);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert('เกิดข้อผิดพลาดในการเรนเดอร์: ' + (err.message || 'โปรดลองใหม่อีกครั้ง'));
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownloadFile = () => {
    if (!exportedResult) return;
    const a = document.createElement('a');
    a.href = exportedResult.url;
    a.download = exportedResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const selectedAspectInfo = ASPECT_RATIOS.find((a) => a.id === aspectRatio) || ASPECT_RATIOS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-neutral-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>เรนเดอร์ส่งออกวิดีโอระดับภาพยนตร์</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-neutral-950 font-extrabold uppercase">
                  4K Ultra HD
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                ปรับขนาดอัตโนมัติพร้อมใช้งานบน TikTok, Reels, Shorts และ YouTube
              </p>
            </div>
          </div>
          {!isRendering && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Active Exporting State */}
          {isRendering && progress && (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-amber-400 animate-spin" />
                <span className="absolute font-mono text-xs font-bold text-white tabular-nums">
                  {progress.percent}%
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">กำลังประมวลผลเรนเดอร์ระดับ 4K</h3>
                <p className="text-xs text-neutral-400 mt-1">{progress.statusText}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                <span>ความละเอียด: {resolution.toUpperCase()}</span>
                <span>เฟรมเรต: {fps} FPS</span>
                <span>บิตเรต: {bitrateMbps} Mbps</span>
              </div>
            </div>
          )}

          {/* Export Complete State */}
          {!isRendering && exportedResult && (
            <div className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">เรนเดอร์ไฟล์เสร็จสมบูรณ์!</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  ไฟล์ความละเอียดระดับ {resolution.toUpperCase()} พร้อมดาวน์โหลดและนำไปโพสต์ต่อบนโซเชียลมีเดีย
                </p>
              </div>

              {/* Video Preview */}
              <div className="max-w-xs mx-auto rounded-lg overflow-hidden border border-neutral-800 bg-black aspect-video flex items-center justify-center shadow-lg">
                <video
                  src={exportedResult.url}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleDownloadFile}
                  className="px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์วิดีโอ ({exportedResult.filename})</span>
                </button>
              </div>
            </div>
          )}

          {/* Config Form (when not rendering and not complete) */}
          {!isRendering && !exportedResult && (
            <>
              {/* 1. Resolution Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
                  ความละเอียดวิดีโอ (Output Resolution)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '4k' as const, name: '4K Ultra HD (2160p)', desc: '3840×2160 · คมชัดสูงสุด Master' },
                    { id: '2k' as const, name: '2K Quad HD (1440p)', desc: '2560×1440 · มาตรฐานสตูดิโอ' },
                    { id: '1080p' as const, name: 'Full HD (1080p)', desc: '1920×1080 · นิยมสำหรับโซเชียล' },
                    { id: '720p' as const, name: 'HD (720p)', desc: '1280×720 · เรนเดอร์เร็ว ขนาดเล็ก' },
                  ].map((res) => {
                    const isSelected = resolution === res.id;
                    return (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => setResolution(res.id)}
                        className={`p-3 rounded-lg text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-sm'
                            : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{res.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{res.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Aspect Ratio / Platform Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
                  สัดส่วนแพลตฟอร์มโซเชียลมีเดีย (Aspect Ratio)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ar) => {
                    const isSelected = aspectRatio === ar.id;
                    return (
                      <button
                        key={ar.id}
                        type="button"
                        onClick={() => setAspectRatio(ar.id)}
                        className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-sm'
                            : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          {ar.id === '9:16' && <Smartphone className="w-3 h-3 text-amber-400" />}
                          {ar.id === '16:9' && <Tv className="w-3 h-3 text-amber-400" />}
                          {ar.id === '1:1' && <Square className="w-3 h-3 text-amber-400" />}
                          {ar.id === '2.39:1' && <Film className="w-3 h-3 text-amber-400" />}
                          <span>{ar.id}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1 truncate">{ar.badge}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Framerate & Bitrate */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-400">อัตราเฟรมภาพ (FPS)</label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value) as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value={24}>24 FPS (Cinematic สไตล์ฟิล์ม)</option>
                    <option value={30}>30 FPS (มาตรฐานโทรทัศน์ & เว็บ)</option>
                    <option value={60}>60 FPS (ลื่นไหลพิเศษ Action)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-400">บิตเรตคุณภาพ (Bitrate)</label>
                  <select
                    value={bitrateMbps}
                    onChange={(e) => setBitrateMbps(parseInt(e.target.value) as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value={50}>50 Mbps (Master คุณภาพสูงสุด)</option>
                    <option value={25}>25 Mbps (แนะนำสำหรับ TikTok/Reels)</option>
                    <option value={12}>12 Mbps (Standard โหลดไว)</option>
                  </select>
                </div>
              </div>

              {/* 4. Options: Subtitle Burn-in & Audio */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSubtitles}
                    onChange={(e) => setIncludeSubtitles(e.target.checked)}
                    className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-300">
                    ฝังซับไตเติ้ลสไตล์กราฟิกลงในวิดีโอ (Burn-in Subtitles)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeAudio}
                    onChange={(e) => setIncludeAudio(e.target.checked)}
                    className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-300">
                    มิกซ์เสียงออดิโอต้นฉบับและเสียงดนตรีประกอบ
                  </span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            {selectedAspectInfo.label} · {resolution.toUpperCase()}
          </span>

          <div className="flex items-center gap-2">
            {!isRendering && !exportedResult && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleStartExport}
                  className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>เริ่มเรนเดอร์ 4K ทันที</span>
                </button>
              </>
            )}

            {exportedResult && (
              <button
                onClick={() => {
                  setExportedResult(null);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                เสร็จสิ้น & ปิดหน้าต่าง
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
