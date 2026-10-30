export type AspectRatioType = '16:9' | '9:16' | '1:1' | '4:5' | '2.39:1';

export interface AspectRatioOption {
  id: AspectRatioType;
  label: string;
  sublabel: string;
  width: number;
  height: number;
  ratioValue: number;
  badge: string;
}

export interface VideoClip {
  id: string;
  name: string;
  url: string;
  duration: number; // in seconds
  startTime: number; // timeline start in seconds
  trimStart: number; // internal offset
  trimEnd: number;
  speed: number;
  volume: number;
  muted: boolean;
  thumbnail?: string;
}

export interface AudioTrackItem {
  id: string;
  name: string;
  url: string;
  duration: number;
  startTime: number;
  volume: number;
  muted: boolean;
  category: 'music' | 'sfx' | 'voice';
}

export interface SubtitleCue {
  id: string;
  start: number; // seconds
  end: number; // seconds
  text: string;
  speaker?: string;
}

export type SubtitlePreset = 'tiktok' | 'cinema' | 'netflix' | 'neon' | 'classic';

export interface SubtitleStyle {
  preset: SubtitlePreset;
  fontSize: number; // 18 to 64
  color: string;
  highlightColor: string;
  bgColor: string;
  position: 'bottom' | 'center' | 'top';
  fontFamily: 'sans' | 'serif' | 'mono';
  allCaps: boolean;
  outline: boolean;
  glow: boolean;
}

export interface ColorGrade {
  presetName: string;
  temperature: number; // -50 to +50
  tint: number; // -50 to +50
  contrast: number; // 50 to 180 (100 normal)
  brightness: number; // 50 to 150 (100 normal)
  saturation: number; // 0 to 200 (100 normal)
  vignette: number; // 0 to 100
  grain: number; // 0 to 80
  highlightsTint?: string;
  shadowsTint?: string;
  anamorphicBars: boolean;
}

export interface ExportSettings {
  resolution: '4k' | '2k' | '1080p' | '720p';
  aspectRatio: AspectRatioType;
  fps: 24 | 30 | 60;
  bitrateMbps: 50 | 25 | 12;
  includeSubtitles: boolean;
  includeAudio: boolean;
  filename: string;
}
