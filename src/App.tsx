/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { Timeline } from './components/Timeline';
import { ColorGradingPanel } from './components/ColorGradingPanel';
import { SubtitlePanel } from './components/SubtitlePanel';
import { ExportModal } from './components/ExportModal';
import { MediaPoolModal } from './components/MediaPoolModal';
import { SocialGrowthModal } from './components/SocialGrowthModal';
import {
  VideoClip,
  SubtitleCue,
  SubtitleStyle,
  ColorGrade,
  AspectRatioType,
} from './types/editor';
import { SAMPLE_VIDEOS, COLOR_GRADE_PRESETS } from './data/sampleMedia';
import {
  Palette,
  Subtitles,
  Flame,
  Film,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';

export default function App() {
  // 1. Clips in the Timeline
  const [videoClips, setVideoClips] = useState<VideoClip[]>([
    { ...SAMPLE_VIDEOS[0], startTime: 0 },
    { ...SAMPLE_VIDEOS[1], startTime: SAMPLE_VIDEOS[0].duration },
  ]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(SAMPLE_VIDEOS[0].id);

  // 2. Subtitle Cues
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([
    {
      id: 'sub-1',
      start: 0.5,
      end: 4.2,
      text: 'ในค่ำคืนที่เมืองทั้งเมืองเต็มไปด้วยความเงียบ...',
      speaker: 'Agent 01',
    },
    {
      id: 'sub-2',
      start: 4.8,
      end: 8.5,
      text: 'ทุกสัญญาณภาพและเสียงถูกบันทึกด้วยความคมชัดระดับ 4K',
      speaker: 'Narrator',
    },
    {
      id: 'sub-3',
      start: 9.0,
      end: 14.2,
      text: 'ปรับแต่งโทนสีภาพยนตร์และใส่ซับไตเติ้ลได้ทันทีด้วย CineFlow AI',
      speaker: 'Narrator',
    },
    {
      id: 'sub-4',
      start: 14.8,
      end: 18.0,
      text: 'พร้อมนำไปเผยแพร่ต่อบนทุกโซเชียลมีเดียได้อย่างสมบูรณ์แบบ',
      speaker: 'Agent 01',
    },
  ]);

  // 3. Subtitle Styling
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    preset: 'tiktok',
    fontSize: 28,
    color: '#ffffff',
    highlightColor: '#facc15',
    bgColor: 'rgba(0, 0, 0, 0.75)',
    position: 'bottom',
    fontFamily: 'sans',
    allCaps: false,
    outline: true,
    glow: false,
  });

  // 4. Color Grading
  const [colorGrade, setColorGrade] = useState<ColorGrade>({
    ...COLOR_GRADE_PRESETS[1], // 🎬 Teal & Orange (Hollywood)
  });

  // 5. Playback & Timeline State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('16:9');

  // 6. Navigation Tabs & Modals
  const [activeTab, setActiveTab] = useState<'timeline' | 'color' | 'subtitles' | 'social'>('color');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isMediaPoolOpen, setIsMediaPoolOpen] = useState<boolean>(false);
  const [isSocialKitOpen, setIsSocialKitOpen] = useState<boolean>(false);

  // Calculate total timeline duration
  const totalDuration = videoClips.reduce((max, clip) => {
    const end = clip.startTime + (clip.trimEnd - clip.trimStart) / clip.speed;
    return Math.max(max, end);
  }, 0) || 10;

  // Find currently active clip under the playhead
  const currentClip = videoClips.find((clip) => {
    const clipDur = (clip.trimEnd - clip.trimStart) / clip.speed;
    return currentTime >= clip.startTime && currentTime <= clip.startTime + clipDur;
  }) || videoClips[0] || null;

  // Selected clip for inspector
  const selectedClip = videoClips.find((c) => c.id === selectedClipId);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Keyboard shortcut listener (Spacebar for Play/Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't intercept typing in inputs
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay]);

  // Split Clip at Playhead
  const handleSplitClip = () => {
    if (!currentClip) return;

    const relativeTime = (currentTime - currentClip.startTime) * currentClip.speed + currentClip.trimStart;
    if (relativeTime <= currentClip.trimStart + 0.5 || relativeTime >= currentClip.trimEnd - 0.5) {
      // Too close to edges
      return;
    }

    const firstHalf: VideoClip = {
      ...currentClip,
      trimEnd: relativeTime,
    };

    const secondHalfDuration = (currentClip.trimEnd - relativeTime) / currentClip.speed;
    const secondHalf: VideoClip = {
      ...currentClip,
      id: `clip-split-${Date.now()}`,
      startTime: currentTime,
      trimStart: relativeTime,
      trimEnd: currentClip.trimEnd,
    };

    // Reconstruct list
    const updated = videoClips.flatMap((c) => {
      if (c.id === currentClip.id) return [firstHalf, secondHalf];
      if (c.startTime > currentTime) {
        return {
          ...c,
          startTime: c.startTime, // remains continuous
        };
      }
      return c;
    });

    setVideoClips(updated);
    setSelectedClipId(secondHalf.id);
  };

  // Delete Clip
  const handleDeleteClip = (id: string) => {
    if (videoClips.length <= 1) return;
    const remaining = videoClips.filter((c) => c.id !== id);
    // Recalibrate timeline continuous start times
    let currentStart = 0;
    const recalibrated = remaining.map((clip) => {
      const dur = (clip.trimEnd - clip.trimStart) / clip.speed;
      const c = { ...clip, startTime: currentStart };
      currentStart += dur;
      return c;
    });

    setVideoClips(recalibrated);
    setSelectedClipId(recalibrated[0]?.id || null);
    if (currentTime > currentStart) {
      setCurrentTime(0);
    }
  };

  // Duplicate Clip
  const handleDuplicateClip = (id: string) => {
    const target = videoClips.find((c) => c.id === id);
    if (!target) return;

    const lastClip = videoClips[videoClips.length - 1];
    const newStart = lastClip.startTime + (lastClip.trimEnd - lastClip.trimStart) / lastClip.speed;

    const clone: VideoClip = {
      ...target,
      id: `clip-dup-${Date.now()}`,
      name: `${target.name} (สำเนา)`,
      startTime: newStart,
    };

    setVideoClips([...videoClips, clone]);
    setSelectedClipId(clone.id);
  };

  // Change Speed
  const handleChangeSpeed = (id: string, speed: number) => {
    const updated = videoClips.map((clip) => {
      if (clip.id === id) {
        return { ...clip, speed };
      }
      return clip;
    });

    // Recalculate start times
    let currentStart = 0;
    const recalibrated = updated.map((clip) => {
      const dur = (clip.trimEnd - clip.trimStart) / clip.speed;
      const c = { ...clip, startTime: currentStart };
      currentStart += dur;
      return c;
    });

    setVideoClips(recalibrated);
  };

  // Add new clip to timeline
  const handleAddClip = (newClip: VideoClip) => {
    setVideoClips([...videoClips, newClip]);
    setSelectedClipId(newClip.id);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none">
      {/* 1. Header (Top Bar Contract) */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'social') setIsSocialKitOpen(true);
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenMediaPool={() => setIsMediaPoolOpen(true)}
      />

      {/* 2. Main Studio Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden max-w-[1800px] w-full mx-auto">
        {/* Left / Center Viewport Column */}
        <section className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Main Video Stage Player */}
          <VideoPlayer
            currentClip={currentClip}
            videoClips={videoClips}
            currentTime={currentTime}
            totalDuration={totalDuration}
            isPlaying={isPlaying}
            colorGrade={colorGrade}
            subtitles={subtitles}
            subtitleStyle={subtitleStyle}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            onTimeUpdate={setCurrentTime}
            onTogglePlay={handleTogglePlay}
            onSeek={setCurrentTime}
          />

          {/* Full Multi-Track Timeline */}
          <Timeline
            videoClips={videoClips}
            subtitles={subtitles}
            currentTime={currentTime}
            totalDuration={totalDuration}
            selectedClipId={selectedClipId}
            onSelectClip={setSelectedClipId}
            onSeek={setCurrentTime}
            onSplitClip={handleSplitClip}
            onDeleteClip={handleDeleteClip}
            onDuplicateClip={handleDuplicateClip}
            onChangeSpeed={handleChangeSpeed}
          />
        </section>

        {/* Right Tooling Dock Sidebar */}
        <aside className="w-full lg:w-[420px] shrink-0 flex flex-col gap-3 min-h-[450px]">
          {/* Dock Tabs Header */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('color')}
              className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'color'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>เกรดสี & LUTs</span>
            </button>

            <button
              onClick={() => setActiveTab('subtitles')}
              className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'subtitles'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>ซับไตเติ้ล AI</span>
            </button>

            <button
              onClick={() => setIsSocialKitOpen(true)}
              className="py-2 px-3 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
              title="แพ็กเกจไวรัลสำหรับโซเชียลมีเดีย"
            >
              <Flame className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">โซเชียล</span>
            </button>
          </div>

          {/* Active Tab Content Panel */}
          <div className="flex-1 min-h-0">
            {activeTab === 'color' && (
              <ColorGradingPanel
                colorGrade={colorGrade}
                onChangeColorGrade={setColorGrade}
                onResetColorGrade={() => setColorGrade({ ...COLOR_GRADE_PRESETS[0] })}
              />
            )}

            {activeTab === 'subtitles' && (
              <SubtitlePanel
                subtitles={subtitles}
                subtitleStyle={subtitleStyle}
                currentTime={currentTime}
                totalDuration={totalDuration}
                onUpdateSubtitles={setSubtitles}
                onUpdateStyle={setSubtitleStyle}
                onSeekToCue={setCurrentTime}
              />
            )}

            {activeTab === 'timeline' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Film className="w-4 h-4" />
                  <span>ข้อมูลคลิปที่เลือกในไทม์ไลน์</span>
                </div>
                {selectedClip ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1.5">
                      <p className="font-semibold text-white">{selectedClip.name}</p>
                      <div className="flex justify-between text-neutral-400 font-mono text-[11px]">
                        <span>ความยาว: {((selectedClip.trimEnd - selectedClip.trimStart) / selectedClip.speed).toFixed(1)}s</span>
                        <span>ความเร็ว: {selectedClip.speed}x</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleSplitClip}
                        className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium cursor-pointer"
                      >
                        ตัดคลิปตรงนี้ (Split)
                      </button>
                      <button
                        onClick={() => handleDuplicateClip(selectedClip.id)}
                        className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium cursor-pointer"
                      >
                        ทำซ้ำคลิป
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-500">คลิกเลือกคลิปในไทม์ไลน์เพื่อดูรายละเอียด</p>
                )}
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* 3. Modals */}
      {/* 4K Ultra HD Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        videoClips={videoClips}
        subtitles={subtitles}
        subtitleStyle={subtitleStyle}
        colorGrade={colorGrade}
        currentAspectRatio={aspectRatio}
      />

      {/* Media Pool & File Upload Modal */}
      <MediaPoolModal
        isOpen={isMediaPoolOpen}
        onClose={() => setIsMediaPoolOpen(false)}
        videoClips={videoClips}
        onAddClip={handleAddClip}
      />

      {/* Social Media Growth Package Modal */}
      <SocialGrowthModal
        isOpen={isSocialKitOpen}
        onClose={() => setIsSocialKitOpen(false)}
        videoTitle={videoClips[0]?.name || 'ภาพยนตร์สั้นระดับ 4K'}
      />
    </div>
  );
}
