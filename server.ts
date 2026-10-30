import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Google Gemini SDK
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. AI Auto Subtitles Generator
app.post('/api/ai/subtitles', async (req, res) => {
  try {
    const { context, duration = 15, language = 'th', style = 'dialogue' } = req.body;

    if (!ai) {
      // High-quality smart fallback subtitles when API key is pending
      const mockCues = generateSmartFallbackSubtitles(duration, language, style);
      return res.json({ subtitles: mockCues, source: 'fallback' });
    }

    const prompt = `You are a professional film and social media video editor subtitle assistant.
Generate timed subtitles for a video clip of ${duration} seconds duration.
Target Language: ${language} (if 'th' use natural conversational Thai, if 'en' use English, etc.).
Context / Scene Info: "${context || 'Cinematic movie scene or social media vlog'}"
Subtitle Style: ${style} (e.g. dialogue, dramatic narration, fast viral hooks).

Rules:
1. Divide the time between 0.0s and ${duration}s into 3 to 7 subtitle cues.
2. Ensure each cue has a start time (number in seconds), end time (number in seconds), and text.
3. Keep individual cue text concise, punchy, and readable in under 2.5 - 4 seconds.
4. Do not exceed ${duration}s. End time of each cue must be greater than start time.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.NUMBER, description: 'Start time in seconds' },
              end: { type: Type.NUMBER, description: 'End time in seconds' },
              text: { type: Type.STRING, description: 'Subtitle text line' },
              speaker: { type: Type.STRING, description: 'Optional speaker name or role' },
            },
            required: ['start', 'end', 'text'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    const formatted = parsed.map((item: any, idx: number) => ({
      id: `sub-${Date.now()}-${idx}`,
      start: Math.max(0, Number(item.start) || 0),
      end: Math.min(duration, Number(item.end) || duration),
      text: String(item.text || ''),
      speaker: item.speaker || '',
    }));

    return res.json({ subtitles: formatted, source: 'gemini' });
  } catch (error: any) {
    console.error('Error generating subtitles:', error);
    const duration = req.body?.duration || 15;
    const fallback = generateSmartFallbackSubtitles(duration, req.body?.language || 'th', req.body?.style || 'dialogue');
    return res.json({ subtitles: fallback, source: 'fallback-error', error: error.message });
  }
});

// 2. AI Subtitle Translation
app.post('/api/ai/translate-subtitles', async (req, res) => {
  try {
    const { subtitles = [], targetLanguage = 'en' } = req.body;

    if (!subtitles.length) {
      return res.json({ subtitles: [] });
    }

    if (!ai) {
      return res.json({
        subtitles: subtitles.map((s: any) => ({
          ...s,
          text: targetLanguage === 'en' ? `[EN] ${s.text}` : `[${targetLanguage}] ${s.text}`,
        })),
      });
    }

    const prompt = `Translate the text of the following video subtitle cues into ${targetLanguage}.
Keep the exact same timing (start, end) and cue IDs, only translate the text naturally for film/social subtitles.
Cues: ${JSON.stringify(subtitles)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              start: { type: Type.NUMBER },
              end: { type: Type.NUMBER },
              text: { type: Type.STRING },
            },
            required: ['id', 'start', 'end', 'text'],
          },
        },
      },
    });

    const translated = JSON.parse(response.text || '[]');
    return res.json({ subtitles: translated });
  } catch (err: any) {
    console.error('Error translating subtitles:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. AI Smart Color Grading & Film Tone Presets
app.post('/api/ai/color-grade', async (req, res) => {
  try {
    const { sceneDescription, genre = 'Cinematic', desiredMood = 'Dramatic' } = req.body;

    if (!ai) {
      return res.json({
        grade: {
          presetName: 'Cinematic Teal & Orange',
          temperature: 15,
          tint: -8,
          contrast: 118,
          brightness: 102,
          saturation: 112,
          vignette: 35,
          grain: 18,
          highlightsTint: '#ffbf80',
          shadowsTint: '#0d2b38',
          rationale: 'สร้างมิติภาพยนตร์ฮอลลีวูดด้วยการขับสีผิวโทนอุ่น และผลักเงามืดเป็นโทนน้ำทะเลลึก',
        },
      });
    }

    const prompt = `You are a world-class Hollywood digital colorist (DaVinci Resolve Color Grading expert).
Analyze this scene and mood:
Scene: "${sceneDescription || 'City night skyline with neon reflections and dramatic character close-up'}"
Genre: "${genre}"
Desired Mood: "${desiredMood}"

Recommend the optimal color grading parameters for this scene.
Values expected:
- presetName: descriptive creative title (e.g., 'Neo-Tokyo Teal & Amber', 'Moody 70s Kodak 2383', 'Bleach Bypass War Film')
- temperature: -50 to +50 (negative = cool blue, positive = warm golden)
- tint: -50 to +50 (negative = green, positive = magenta)
- contrast: 80 to 140 (100 is normal)
- brightness: 80 to 130 (100 is normal)
- saturation: 50 to 160 (100 is normal)
- vignette: 0 to 80 (edge darkening percentage)
- grain: 0 to 60 (film grain texture strength)
- highlightsTint: hex color code for highlights
- shadowsTint: hex color code for shadows
- rationale: 1-2 sentence explanation in Thai explaining why this color grading elevates the scene.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            presetName: { type: Type.STRING },
            temperature: { type: Type.NUMBER },
            tint: { type: Type.NUMBER },
            contrast: { type: Type.NUMBER },
            brightness: { type: Type.NUMBER },
            saturation: { type: Type.NUMBER },
            vignette: { type: Type.NUMBER },
            grain: { type: Type.NUMBER },
            highlightsTint: { type: Type.STRING },
            shadowsTint: { type: Type.STRING },
            rationale: { type: Type.STRING },
          },
          required: ['presetName', 'temperature', 'tint', 'contrast', 'brightness', 'saturation', 'vignette', 'grain', 'rationale'],
        },
      },
    });

    const grade = JSON.parse(response.text || '{}');
    return res.json({ grade });
  } catch (err: any) {
    console.error('Error with AI color grade:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. AI Social Media Hook & Description Generator
app.post('/api/ai/social-package', async (req, res) => {
  try {
    const { videoTitle, topic = 'ภาพยนตร์สั้น', platform = 'TikTok' } = req.body;

    if (!ai) {
      return res.json({
        hooks: [
          'ดูให้จบ แล้วคุณจะมองเรื่องนี้ไม่เหมือนเดิมอีกต่อไป! 🎬',
          'เบื้องหลังฉากที่ทุกคนพูดถึงมากที่สุดในตอนนี้...',
          'ถ้าคุณชอบหนังแนวสืบสวนระทึกขวัญ ห้ามเลื่อนผ่านคลิปนี้!',
        ],
        hashtags: ['#หนังน่าดู', '#รีวิวหนัง', '#ตัดต่อวิดีโอ', '#CineFlow4K', '#TikTokUni'],
        caption: `ซีนเด็ดที่คุณไม่ควรพลาด! ปรับแต่งสีและใส่เสียงด้วย CineFlow AI ระดับ 4K 🎥✨`,
      });
    }

    const prompt = `You are a top viral social media growth manager for TikTok, Reels, and YouTube Shorts.
Generate 3 viral opening hook options, 5 trending hashtags, and a captivating post caption in Thai for this video:
Title: "${videoTitle || 'ภาพยนตร์สั้น'}"
Topic: "${topic}"
Target Platform: "${platform}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hooks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            caption: { type: Type.STRING },
          },
          required: ['hooks', 'hashtags', 'caption'],
        },
      },
    });

    const packageData = JSON.parse(response.text || '{}');
    return res.json(packageData);
  } catch (err: any) {
    console.error('Error generating social package:', err);
    return res.status(500).json({ error: err.message });
  }
});

function generateSmartFallbackSubtitles(duration: number, language: string, style: string) {
  const isThai = language === 'th';
  const step = Math.max(2, duration / 4);

  if (isThai) {
    return [
      { id: 'sub-1', start: 0.2, end: Math.min(duration, Number((step * 0.9).toFixed(1))), text: 'ในค่ำคืนที่ทุกอย่างกำลังจะเปลี่ยนไป...', speaker: 'ผู้บรรยาย' },
      { id: 'sub-2', start: Number(step.toFixed(1)), end: Math.min(duration, Number((step * 1.9).toFixed(1))), text: 'เราค้นพบบางสิ่งที่ไม่มีใครเคยบอก', speaker: 'ตัวละครหลัก' },
      { id: 'sub-3', start: Number((step * 2).toFixed(1)), end: Math.min(duration, Number((step * 2.9).toFixed(1))), text: 'นี่คือจุดเริ่มต้นของการเดินทางครั้งใหม่', speaker: 'ตัวละครหลัก' },
      { id: 'sub-4', start: Number((step * 3).toFixed(1)), end: Math.min(duration, Number((step * 3.8).toFixed(1))), text: 'และคุณจะไม่สามารถย้อนเวลากลับไปได้อีก', speaker: 'ผู้บรรยาย' },
    ].filter(s => s.start < duration);
  } else {
    return [
      { id: 'sub-1', start: 0.2, end: Math.min(duration, Number((step * 0.9).toFixed(1))), text: 'In a world where everything changed in an instant...', speaker: 'Narrator' },
      { id: 'sub-2', start: Number(step.toFixed(1)), end: Math.min(duration, Number((step * 1.9).toFixed(1))), text: 'We discovered secrets that remained hidden for years.', speaker: 'Lead' },
      { id: 'sub-3', start: Number((step * 2).toFixed(1)), end: Math.min(duration, Number((step * 2.9).toFixed(1))), text: 'This is not just another story.', speaker: 'Lead' },
      { id: 'sub-4', start: Number((step * 3).toFixed(1)), end: Math.min(duration, Number((step * 3.8).toFixed(1))), text: 'This is where our destiny truly begins.', speaker: 'Narrator' },
    ].filter(s => s.start < duration);
  }
}

// Start Express server and attach Vite middlewares in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`CineFlow AI Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
