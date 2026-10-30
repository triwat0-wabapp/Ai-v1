import React from 'react';
import { Film, Sparkles, Download, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: 'timeline' | 'color' | 'subtitles' | 'social';
  onTabChange: (tab: 'timeline' | 'color' | 'subtitles' | 'social') => void;
  onOpenExport: () => void;
  onOpenMediaPool: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenExport,
  onOpenMediaPool,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Film className="w-4 h-4" />
        </div>
        <a href="/" className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-1.5">
          <span>CineFlow</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950 font-extrabold uppercase tracking-wider">AI 4K</span>
        </a>
      </div>

      {/* Zone 2: 4 Clean Single-Line Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-400">
        <button
          onClick={() => onTabChange('timeline')}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'timeline' ? 'text-amber-400' : 'hover:text-neutral-200'
          }`}
        >
          ไทม์ไลน์ตัดต่อ
        </button>
        <button
          onClick={() => onTabChange('subtitles')}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'subtitles' ? 'text-amber-400' : 'hover:text-neutral-200'
          }`}
        >
          ซับไตเติ้ล AI
        </button>
        <button
          onClick={() => onTabChange('color')}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'color' ? 'text-amber-400' : 'hover:text-neutral-200'
          }`}
        >
          เกรดสีภาพยนตร์ & LUTs
        </button>
        <button
          onClick={() => onTabChange('social')}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'social' ? 'text-amber-400' : 'hover:text-neutral-200'
          }`}
        >
          แพ็กเกจโซเชียลมีเดีย
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMediaPool}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-neutral-400" />
          <span>คลังสื่อ</span>
        </button>

        <button
          onClick={onOpenExport}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm hover:shadow-amber-500/20 transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>เรนเดอร์ส่งออก 4K</span>
        </button>
      </div>
    </header>
  );
};
