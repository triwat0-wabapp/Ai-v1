import React, { useState } from 'react';
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  Loader2,
  Hash,
  Flame,
  MessageSquare,
  Smartphone,
} from 'lucide-react';

interface SocialGrowthModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
}

export const SocialGrowthModal: React.FC<SocialGrowthModalProps> = ({
  isOpen,
  onClose,
  videoTitle,
}) => {
  const [platform, setPlatform] = useState<'TikTok' | 'Instagram Reels' | 'YouTube Shorts'>('TikTok');
  const [topic, setTopic] = useState('ภาพยนตร์สั้น ระทึกขวัญ');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [hooks, setHooks] = useState<string[]>([
    'ดูให้จบ แล้วคุณจะมองเรื่องนี้ไม่เหมือนเดิมอีกต่อไป! 🎬',
    'เบื้องหลังฉากที่ทุกคนพูดถึงมากที่สุดในตอนนี้...',
    'ถ้าคุณชอบหนังแนวสืบสวนระทึกขวัญ ห้ามเลื่อนผ่านคลิปนี้!',
  ]);
  const [hashtags, setHashtags] = useState<string[]>([
    '#หนังน่าดู',
    '#รีวิวหนัง',
    '#ตัดต่อวิดีโอ',
    '#CineFlow4K',
    '#TikTokUni',
  ]);
  const [caption, setCaption] = useState(
    'ซีนเด็ดที่คุณไม่ควรพลาด! ปรับแต่งสีและใส่เสียงด้วย CineFlow AI ระดับ 4K 🎥✨ เล่าเรื่องด้วยภาพคมชัดทุกอารมณ์'
  );

  if (!isOpen) return null;

  const handleGenerateAI = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/social-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: videoTitle || 'ภาพยนตร์สั้นระดับ 4K',
          topic,
          platform,
        }),
      });

      const data = await res.json();
      if (data.hooks && Array.isArray(data.hooks)) setHooks(data.hooks);
      if (data.hashtags && Array.isArray(data.hashtags)) setHashtags(data.hashtags);
      if (data.caption) setCaption(data.caption);
    } catch (err) {
      console.error('Failed to generate social hooks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-neutral-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>แพ็กเกจไวรัลสำหรับโซเชียลมีเดีย (AI Social Kit)</span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                ฮุคดึงดูดผู้ชม แท็กยอดนิยม และแคปชันสำหรับโพสต์คลิปทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-neutral-800 cursor-pointer"
          >
            ปิด
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Prompt Setup */}
          <div className="space-y-3 p-3.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <div className="flex items-center gap-2">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-700 rounded-md text-neutral-200"
              >
                <option value="TikTok">TikTok</option>
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="YouTube Shorts">YouTube Shorts</option>
              </select>

              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="ระบุแนวคลิป เช่น แอ็คชั่นระทึกขวัญ, ท่องเที่ยวสไตล์ภาพยนตร์..."
                className="flex-1 px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-700 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />

              <button
                onClick={handleGenerateAI}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-md transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>สร้างด้วย AI</span>
              </button>
            </div>
          </div>

          {/* 1. Viral Opening Hooks */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              ข้อความเปิดหัวฮุคดึงดูดสายตา 3 วินาทีแรก (Viral Hooks)
            </label>
            <div className="space-y-1.5">
              {hooks.map((hook, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-xs text-neutral-200 hover:border-neutral-700 transition-colors"
                >
                  <span className="flex-1 mr-2">{hook}</span>
                  <button
                    onClick={() => copyToClipboard(hook, `hook-${idx}`)}
                    className="p-1 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                    title="คัดลอกฮุคนี้"
                  >
                    {copiedKey === `hook-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Caption */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                แคปชันโพสต์วิดีโอ (Post Caption)
              </label>
              <button
                onClick={() => copyToClipboard(caption, 'caption')}
                className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'caption' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>คัดลอกแคปชัน</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-2.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
            />
          </div>

          {/* 3. Hashtags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                แฮชแท็กติดเทรนด์ (Trending Hashtags)
              </label>
              <button
                onClick={() => copyToClipboard(hashtags.join(' '), 'hashtags')}
                className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'hashtags' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>คัดลอกแท็กทั้งหมด</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-xs text-amber-400 font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={() => {
              const fullText = `${hooks[0]}\n\n${caption}\n\n${hashtags.join(' ')}`;
              copyToClipboard(fullText, 'full');
            }}
            className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            {copiedKey === 'full' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>คัดลอกทั้งแพ็กเกจ (ฮุค + แคปชัน + แท็ก)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
