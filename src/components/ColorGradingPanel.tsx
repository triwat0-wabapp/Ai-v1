import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  RotateCcw,
  Palette,
  Film,
  Sun,
  Activity,
  Check,
  Loader2,
} from 'lucide-react';
import { ColorGrade } from '../types/editor';
import { COLOR_GRADE_PRESETS } from '../data/sampleMedia';

interface ColorGradingPanelProps {
  colorGrade: ColorGrade;
  onChangeColorGrade: (grade: ColorGrade) => void;
  onResetColorGrade: () => void;
}

export const ColorGradingPanel: React.FC<ColorGradingPanelProps> = ({
  colorGrade,
  onChangeColorGrade,
  onResetColorGrade,
}) => {
  const [aiScenePrompt, setAiScenePrompt] = useState('');
  const [aiGenre, setAiGenre] = useState('Cinematic Action');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  const handleSliderChange = (field: keyof ColorGrade, value: number | boolean) => {
    onChangeColorGrade({
      ...colorGrade,
      [field]: value,
      presetName: 'Custom Customization',
    });
  };

  const handleApplyPreset = (preset: ColorGrade) => {
    onChangeColorGrade({ ...preset });
    setAiRationale(null);
  };

  const handleAiAutoGrade = async () => {
    setIsAiLoading(true);
    setAiRationale(null);
    try {
      const res = await fetch('/api/ai/color-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneDescription: aiScenePrompt || 'Cinematic movie scene with dramatic characters and rich lighting',
          genre: aiGenre,
          desiredMood: 'High Impact Cinematic',
        }),
      });

      const data = await res.json();
      if (data.grade) {
        onChangeColorGrade({
          presetName: `✨ ${data.grade.presetName}`,
          temperature: data.grade.temperature ?? colorGrade.temperature,
          tint: data.grade.tint ?? colorGrade.tint,
          contrast: data.grade.contrast ?? colorGrade.contrast,
          brightness: data.grade.brightness ?? colorGrade.brightness,
          saturation: data.grade.saturation ?? colorGrade.saturation,
          vignette: data.grade.vignette ?? colorGrade.vignette,
          grain: data.grade.grain ?? colorGrade.grain,
          highlightsTint: data.grade.highlightsTint,
          shadowsTint: data.grade.shadowsTint,
          anamorphicBars: true,
        });
        if (data.grade.rationale) {
          setAiRationale(data.grade.rationale);
        }
      }
    } catch (err) {
      console.error('AI color grade error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl text-neutral-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/80">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold tracking-tight text-white uppercase">
            ปรับโทนสี & เกรดภาพยนตร์ (Color Grade)
          </h2>
        </div>
        <button
          onClick={onResetColorGrade}
          className="text-[11px] font-medium text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          title="รีเซ็ตค่าสีทั้งหมดเป็นค่าเริ่มต้น"
        >
          <RotateCcw className="w-3 h-3" />
          <span>รีเซ็ต</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* AI Smart Color Grading Card */}
        <div className="p-3.5 rounded-lg bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              AI วิเคราะห์และเกรดสีอัตโนมัติ
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono">Gemini 3.8 Flash</span>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="ระบุบรรยากาศซีน เช่น คาเฟ่โทนอุ่น, แอ็คชั่นกลางคืน, ไซเบอร์พังก์..."
              value={aiScenePrompt}
              onChange={(e) => setAiScenePrompt(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />

            <div className="flex items-center gap-2">
              <select
                value={aiGenre}
                onChange={(e) => setAiGenre(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-neutral-300 focus:outline-none focus:border-amber-400"
              >
                <option value="Cinematic Action">ภาพยนตร์แอ็กชันฮอลลีวูด</option>
                <option value="Cyberpunk & Sci-Fi">ไซไฟ & นีออนอนาคต</option>
                <option value="Vintage 70s Drama">ดราม่าฟิล์มคลาสสิก 70s</option>
                <option value="Romance & Sunset">โรแมนติกแสงอาทิตย์ตก</option>
                <option value="Moody Thriller / Noir">ระทึกขวัญฟิล์มนัวร์</option>
                <option value="Minimal Social Vlog">วิดีโอโซเชียลมีเดียมินิมอล</option>
              </select>

              <button
                onClick={handleAiAutoGrade}
                disabled={isAiLoading}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>กำลังประมวลผล...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>เกรดสีด้วย AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {aiRationale && (
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
              <span className="font-semibold text-amber-300">ผลการวิเคราะห์สี: </span>
              {aiRationale}
            </div>
          )}
        </div>

        {/* 1-Click Cinematic Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            พรีเซ็ตสีภาพยนตร์ยอดนิยม (LUT Presets)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {COLOR_GRADE_PRESETS.map((preset) => {
              const isSelected = colorGrade.presetName === preset.presetName;
              return (
                <button
                  key={preset.presetName}
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-2.5 py-2 rounded-lg text-left text-xs font-medium border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400/10 border-amber-400/60 text-amber-300 font-semibold shadow-sm'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <span className="truncate">{preset.presetName}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Precision Sliders */}
        <div className="space-y-3 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-300 uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              ปรับจูนค่าสีแบบละเอียด (Manual Grading)
            </span>
          </div>

          {/* Temperature (Warm / Cool) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">อุณหภูมิสี (Temperature)</span>
              <span className="font-mono text-[11px] tabular-nums text-neutral-300">
                {colorGrade.temperature > 0 ? `+${colorGrade.temperature}` : colorGrade.temperature}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={colorGrade.temperature}
              onChange={(e) => handleSliderChange('temperature', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gradient-to-r from-blue-500 via-neutral-700 to-amber-500 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
              <span>ฟ้าเย็น (Cool Blue)</span>
              <span>ส้มอุ่น (Warm Amber)</span>
            </div>
          </div>

          {/* Tint (Green / Magenta) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">ทินท์สี (Tint Balance)</span>
              <span className="font-mono text-[11px] tabular-nums text-neutral-300">
                {colorGrade.tint > 0 ? `+${colorGrade.tint}` : colorGrade.tint}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={colorGrade.tint}
              onChange={(e) => handleSliderChange('tint', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gradient-to-r from-emerald-500 via-neutral-700 to-pink-500 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
              <span>เขียว (Green)</span>
              <span>ม่วงแดง (Magenta)</span>
            </div>
          </div>

          {/* Contrast */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">คอนทราสต์ (Contrast)</span>
              <span className="font-mono text-[11px] tabular-nums text-neutral-300">{colorGrade.contrast}%</span>
            </div>
            <input
              type="range"
              min="60"
              max="160"
              value={colorGrade.contrast}
              onChange={(e) => handleSliderChange('contrast', parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">ความสว่าง (Brightness)</span>
              <span className="font-mono text-[11px] tabular-nums text-neutral-300">{colorGrade.brightness}%</span>
            </div>
            <input
              type="range"
              min="60"
              max="150"
              value={colorGrade.brightness}
              onChange={(e) => handleSliderChange('brightness', parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">ความสดของสี (Saturation)</span>
              <span className="font-mono text-[11px] tabular-nums text-neutral-300">{colorGrade.saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={colorGrade.saturation}
              onChange={(e) => handleSliderChange('saturation', parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Vignette */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">ขอบมืดภาพยนตร์ (Vignette)</span>
              <span className="font-mono text-[11px] tabular-nums text-neutral-300">{colorGrade.vignette}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={colorGrade.vignette}
              onChange={(e) => handleSliderChange('vignette', parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Film Grain 35mm */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">เกรนฟิล์ม 35mm (Film Grain)</span>
              <span className="font-mono text-[11px] tabular-nums text-neutral-300">{colorGrade.grain}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="70"
              value={colorGrade.grain}
              onChange={(e) => handleSliderChange('grain', parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Anamorphic Bars Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={colorGrade.anamorphicBars}
                onChange={(e) => handleSliderChange('anamorphicBars', e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-neutral-300">
                แถบขอบดำโรงภาพยนตร์ (Cinemascope Letterbox Bars)
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
