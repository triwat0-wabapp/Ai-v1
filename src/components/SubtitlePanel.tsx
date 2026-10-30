import React, { useState } from 'react';
import {
  Sparkles,
  Subtitles,
  Download,
  Plus,
  Trash2,
  Languages,
  Clock,
  Palette,
  Check,
  Loader2,
  FileText,
} from 'lucide-react';
import { SubtitleCue, SubtitleStyle, SubtitlePreset } from '../types/editor';
import { exportToSRT, exportToVTT, downloadTextFile, formatTimecodeUI } from '../utils/subtitleUtils';

interface SubtitlePanelProps {
  subtitles: SubtitleCue[];
  subtitleStyle: SubtitleStyle;
  currentTime: number;
  totalDuration: number;
  onUpdateSubtitles: (cues: SubtitleCue[]) => void;
  onUpdateStyle: (style: SubtitleStyle) => void;
  onSeekToCue: (time: number) => void;
}

export const SubtitlePanel: React.FC<SubtitlePanelProps> = ({
  subtitles,
  subtitleStyle,
  currentTime,
  totalDuration,
  onUpdateSubtitles,
  onUpdateStyle,
  onSeekToCue,
}) => {
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [aiLang, setAiLang] = useState('th');
  const [targetLang, setTargetLang] = useState('en');

  // Handle AI Auto Subtitles
  const handleGenerateSubtitles = async () => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/ai/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: aiContext || 'บทสนทนาภาพยนตร์และเรื่องราวระทึกขวัญที่ชวนติดตาม',
          duration: Math.max(5, totalDuration || 15),
          language: aiLang,
          style: 'dialogue',
        }),
      });

      const data = await res.json();
      if (data.subtitles && Array.isArray(data.subtitles)) {
        onUpdateSubtitles(data.subtitles);
      }
    } catch (err) {
      console.error('Failed to generate subtitles:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handle Subtitle Translation
  const handleTranslateSubtitles = async () => {
    if (!subtitles.length) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/ai/translate-subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtitles,
          targetLanguage: targetLang,
        }),
      });

      const data = await res.json();
      if (data.subtitles && Array.isArray(data.subtitles)) {
        onUpdateSubtitles(data.subtitles);
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Add a new subtitle cue
  const handleAddCue = () => {
    const start = Number(currentTime.toFixed(1));
    const end = Math.min(totalDuration, Number((start + 2.5).toFixed(1)));
    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}`,
      start,
      end,
      text: 'ข้อความซับไตเติ้ลใหม่...',
    };
    onUpdateSubtitles([...subtitles, newCue].sort((a, b) => a.start - b.start));
  };

  // Update specific cue
  const handleEditCue = (id: string, updates: Partial<SubtitleCue>) => {
    onUpdateSubtitles(
      subtitles.map((cue) => (cue.id === id ? { ...cue, ...updates } : cue))
    );
  };

  // Delete cue
  const handleDeleteCue = (id: string) => {
    onUpdateSubtitles(subtitles.filter((cue) => cue.id !== id));
  };

  // Apply Subtitle Preset
  const handlePresetSelect = (preset: SubtitlePreset) => {
    if (preset === 'tiktok') {
      onUpdateStyle({
        ...subtitleStyle,
        preset: 'tiktok',
        fontSize: 32,
        color: '#ffffff',
        highlightColor: '#facc15',
        bgColor: 'rgba(0, 0, 0, 0.75)',
        position: 'bottom',
        fontFamily: 'sans',
        allCaps: true,
        outline: true,
        glow: false,
      });
    } else if (preset === 'cinema') {
      onUpdateStyle({
        ...subtitleStyle,
        preset: 'cinema',
        fontSize: 26,
        color: '#ffffff',
        highlightColor: '#ffb272',
        bgColor: 'transparent',
        position: 'bottom',
        fontFamily: 'sans',
        allCaps: false,
        outline: false,
        glow: false,
      });
    } else if (preset === 'netflix') {
      onUpdateStyle({
        ...subtitleStyle,
        preset: 'netflix',
        fontSize: 28,
        color: '#ffffff',
        highlightColor: '#f59e0b',
        bgColor: 'transparent',
        position: 'bottom',
        fontFamily: 'sans',
        allCaps: false,
        outline: true,
        glow: false,
      });
    } else if (preset === 'neon') {
      onUpdateStyle({
        ...subtitleStyle,
        preset: 'neon',
        fontSize: 30,
        color: '#ffffff',
        highlightColor: '#00f2fe',
        bgColor: 'rgba(15, 23, 42, 0.85)',
        position: 'bottom',
        fontFamily: 'sans',
        allCaps: true,
        outline: false,
        glow: true,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl text-neutral-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/80">
        <div className="flex items-center gap-2">
          <Subtitles className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold tracking-tight text-white uppercase">
            ใส่ซับไตเติ้ลอัตโนมัติด้วย AI (Auto Subtitles)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const srt = exportToSRT(subtitles);
              downloadTextFile('subtitles.srt', srt, 'text/plain');
            }}
            disabled={!subtitles.length}
            className="text-[11px] font-medium text-neutral-400 hover:text-white disabled:opacity-40 flex items-center gap-1 transition-colors cursor-pointer"
            title="ดาวน์โหลดไฟล์ .SRT สำหรับโซเชียลมีเดีย"
          >
            <Download className="w-3 h-3" />
            <span>.SRT</span>
          </button>
          <button
            onClick={() => {
              const vtt = exportToVTT(subtitles);
              downloadTextFile('subtitles.vtt', vtt, 'text/vtt');
            }}
            disabled={!subtitles.length}
            className="text-[11px] font-medium text-neutral-400 hover:text-white disabled:opacity-40 flex items-center gap-1 transition-colors cursor-pointer"
            title="ดาวน์โหลดไฟล์ .VTT"
          >
            <FileText className="w-3 h-3" />
            <span>.VTT</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* AI Auto Caption Generator Card */}
        <div className="p-3.5 rounded-lg bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              สร้างซับไตเติ้ลพร้อมไทม์โค้ดอัตโนมัติ
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono">Gemini 3.8 Flash</span>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="หัวข้อหรือบริบทซีน (เช่น บทสนทนาสายลับ, วิดีโอรีวิวเที่ยว, ไวรัลชวนติดตาม)..."
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />

            <div className="flex items-center gap-2">
              <select
                value={aiLang}
                onChange={(e) => setAiLang(e.target.value)}
                className="px-2 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-neutral-300 focus:outline-none focus:border-amber-400"
              >
                <option value="th">ภาษาไทย (Thai)</option>
                <option value="en">English (US)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="zh">中文 (Chinese)</option>
              </select>

              <button
                onClick={handleGenerateSubtitles}
                disabled={isAiGenerating}
                className="flex-1 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>กำลังสร้างซับไตเติ้ล...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>สร้างซับไตเติ้ลด้วย AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* AI Translation Bar */}
        {subtitles.length > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Languages className="w-3.5 h-3.5 text-neutral-300" />
              <span>แปลภาษาซับไตเติ้ลด้วย AI:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="px-2 py-1 text-xs bg-neutral-900 border border-neutral-700 rounded text-neutral-200"
              >
                <option value="en">English</option>
                <option value="th">ภาษาไทย</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
                <option value="es">Español</option>
              </select>
              <button
                onClick={handleTranslateSubtitles}
                disabled={isTranslating}
                className="px-2.5 py-1 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'แปลทันที'}
              </button>
            </div>
          </div>
        )}

        {/* Subtitle Visual Style Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            รูปแบบกราฟิกซับไตเติ้ล (Subtitle Styling)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'tiktok' as const, name: '⚡ TikTok / Reels Pop', desc: 'ไฮไลท์คำสีเหลือง กรอบดำ' },
              { id: 'cinema' as const, name: '🎬 Cinema Classic', desc: 'ซับภาพยนตร์ เงาตกกระทบ' },
              { id: 'netflix' as const, name: '📺 Netflix Modern', desc: 'ขอบดำหนา คมชัดทุกพื้นผิว' },
              { id: 'neon' as const, name: '🌆 Cyberpunk Neon', desc: 'เรืองแสงสีฟ้านีออน' },
            ].map((p) => {
              const isSelected = subtitleStyle.preset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400/10 border-amber-400/60 text-amber-300 shadow-sm'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{p.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{p.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Quick Style Controls */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
            <div>
              <span className="text-[11px] text-neutral-400 block mb-1">ขนาดฟอนต์</span>
              <input
                type="range"
                min="18"
                max="48"
                value={subtitleStyle.fontSize}
                onChange={(e) => onUpdateStyle({ ...subtitleStyle, fontSize: parseInt(e.target.value) })}
                className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-400"
              />
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block mb-1">ตำแหน่ง</span>
              <select
                value={subtitleStyle.position}
                onChange={(e) => onUpdateStyle({ ...subtitleStyle, position: e.target.value as any })}
                className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-300"
              >
                <option value="bottom">ล่าง (Bottom)</option>
                <option value="center">กลาง (Center)</option>
                <option value="top">บน (Top)</option>
              </select>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block mb-1">ตัวพิมพ์</span>
              <button
                onClick={() => onUpdateStyle({ ...subtitleStyle, allCaps: !subtitleStyle.allCaps })}
                className={`w-full px-2 py-1 rounded text-xs border transition-colors cursor-pointer ${
                  subtitleStyle.allCaps
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                {subtitleStyle.allCaps ? 'พิมพ์ใหญ่ทั้งหมด' : 'ปกติ'}
              </button>
            </div>
          </div>
        </div>

        {/* Subtitles Cue List */}
        <div className="space-y-2 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              รายการไทม์โค้ดซับไตเติ้ล ({subtitles.length} ประโยค)
            </span>
            <button
              onClick={handleAddCue}
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>เพิ่มซับใหม่</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {subtitles.length === 0 ? (
              <div className="text-center py-6 text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
                <Subtitles className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-neutral-400" />
                <p className="text-xs">ยังไม่มีซับไตเติ้ลในคลิปนี้</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">กด "สร้างซับไตเติ้ลด้วย AI" ด้านบนได้ทันที</p>
              </div>
            ) : (
              subtitles.map((cue, index) => {
                const isActive = currentTime >= cue.start && currentTime <= cue.end;
                return (
                  <div
                    key={cue.id}
                    className={`p-2.5 rounded-lg border transition-all text-xs space-y-1.5 ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/40 text-white'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-neutral-400">
                      <button
                        onClick={() => onSeekToCue(cue.start)}
                        className="hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                        title="กระโดดไปยังเวลานี้"
                      >
                        <span className="text-amber-400/90 font-bold">#{index + 1}</span>
                        <span>{formatTimecodeUI(cue.start)} → {formatTimecodeUI(cue.end)}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteCue(cue.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                          title="ลบซับไตเติ้ลนี้"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={cue.text}
                      onChange={(e) => handleEditCue(cue.id, { text: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-neutral-900 border border-neutral-800 rounded text-neutral-100 focus:outline-none focus:border-amber-400 resize-none"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
