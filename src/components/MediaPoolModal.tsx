import React, { useRef } from 'react';
import {
  Upload,
  Film,
  X,
  Plus,
  Play,
  Check,
  Music,
} from 'lucide-react';
import { VideoClip } from '../types/editor';
import { SAMPLE_VIDEOS } from '../data/sampleMedia';

interface MediaPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoClips: VideoClip[];
  onAddClip: (clip: VideoClip) => void;
}

export const MediaPoolModal: React.FC<MediaPoolModalProps> = ({
  isOpen,
  onClose,
  videoClips,
  onAddClip,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = url;

    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration || 10;
      const lastClip = videoClips[videoClips.length - 1];
      const startTime = lastClip
        ? lastClip.startTime + (lastClip.trimEnd - lastClip.trimStart) / lastClip.speed
        : 0;

      const newClip: VideoClip = {
        id: `user-clip-${Date.now()}`,
        name: file.name,
        url,
        duration,
        startTime,
        trimStart: 0,
        trimEnd: duration,
        speed: 1,
        volume: 1,
        muted: false,
      };

      onAddClip(newClip);
      onClose();
    };
  };

  const handleAddSample = (sample: VideoClip) => {
    const lastClip = videoClips[videoClips.length - 1];
    const startTime = lastClip
      ? lastClip.startTime + (lastClip.trimEnd - lastClip.trimStart) / lastClip.speed
      : 0;

    const newClip: VideoClip = {
      ...sample,
      id: `clip-${Date.now()}`,
      startTime,
    };

    onAddClip(newClip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-neutral-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">คลังไฟล์มีเดีย & อัปโหลดวิดีโอ (Media Pool)</h2>
              <p className="text-[11px] text-neutral-400">
                เลือกคลิปตัวอย่างภาพยนตร์ระดับ 4K หรืออัปโหลดวิดีโอของคุณเอง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-6 border-2 border-dashed border-neutral-700 hover:border-amber-400/80 bg-neutral-950/50 hover:bg-neutral-950 rounded-xl text-center cursor-pointer transition-all group"
          >
            <Upload className="w-8 h-8 mx-auto text-neutral-400 group-hover:text-amber-400 mb-2 transition-colors" />
            <h3 className="text-xs font-bold text-neutral-200 group-hover:text-amber-300">
              คลิกเพื่ออัปโหลดไฟล์วิดีโอจากคอมพิวเตอร์ของคุณ
            </h3>
            <p className="text-[11px] text-neutral-500 mt-1">
              รองรับไฟล์ MP4, WebM, QuickTime MOV (ความละเอียดสูงสุดถึง 4K 60fps)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/mov,audio/mp3,audio/wav"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Sample Footage Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
              คลิปตัวอย่างภาพยนตร์คมชัดสูง (Sample 4K Cinema Footage)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_VIDEOS.map((sample) => {
                const isAlreadyInTimeline = videoClips.some((c) => c.name === sample.name);
                return (
                  <div
                    key={sample.id}
                    className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 flex flex-col justify-between space-y-2 group transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          {sample.name}
                        </h4>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          ความยาว {(sample.trimEnd - sample.trimStart).toFixed(0)} วินาที · 4K UHD
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddSample(sample)}
                      className="w-full py-1.5 px-3 rounded bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAlreadyInTimeline ? 'เพิ่มอีกหนึ่งคลิป' : 'เพิ่มลงในไทม์ไลน์'}</span>
                    </button>
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
