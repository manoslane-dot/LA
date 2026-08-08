import { NextResponse } from 'next/server';
import sharp from 'sharp';

import { env } from '@/env';

const SKIN_EXPOSURE_BLOCK_THRESHOLD = 0.68;
const MIN_PIXEL_ALPHA = 20;

function buildModerationPrompt() {
  return [
    'You are an image safety classifier for an e-commerce platform.',
    'Determine whether the image contains nudity, explicit sexual content, pornography, fetish content, graphic violence, gore, or other unsafe content.',
    'Return ONLY valid JSON with this exact shape: {"allowed": true/false, "reason": "short reason", "confidence": 0-1, "labels": ["label1", "label2"]}.',
    'If the image is safe, return allowed: true. If it contains any of the unsafe categories above, return allowed: false.',
  ].join(' ');
}

function extractReason(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) {
    return 'Η εικόνα απορρίφθηκε: εντοπίστηκε πιθανό ακατάλληλο περιεχόμενο.';
  }

  const candidate = payload as { reason?: unknown; error?: unknown };
  if (typeof candidate.reason === 'string' && candidate.reason.trim()) {
    return candidate.reason;
  }
  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error;
  }

  return 'Η εικόνα απορρίφθηκε: εντοπίστηκε πιθανό ακατάλληλο περιεχόμενο.';
}

async function moderateWithHeuristic(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const image = sharp(bytes);
  const { data, info } = await image.resize(180, 180, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true });

  let visiblePixels = 0;
  let skinLikePixels = 0;

  const channels = info.channels;
  for (let index = 0; index < data.length; index += channels) {
    const r = data[index] ?? 0;
    const g = data[index + 1] ?? 0;
    const b = data[index + 2] ?? 0;
    const a = channels > 3 ? (data[index + 3] ?? 0) : 255;

    if (a < MIN_PIXEL_ALPHA) {
      continue;
    }

    visiblePixels += 1;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;

    const isSkinTone = (
      r > 95 &&
      g > 40 &&
      b > 20 &&
      r > g &&
      r > b &&
      chroma > 15 &&
      Math.abs(r - g) > 15
    );

    if (isSkinTone) {
      skinLikePixels += 1;
    }
  }

  const skinExposureRatio = visiblePixels === 0 ? 0 : skinLikePixels / visiblePixels;
  const allowed = skinExposureRatio < SKIN_EXPOSURE_BLOCK_THRESHOLD;

  return {
    allowed,
    reason: allowed ? 'safe' : 'Η εικόνα απορρίφθηκε: εντοπίστηκε πιθανό ακατάλληλο περιεχόμενο.',
    confidence: allowed ? 0.65 : 0.9,
    labels: allowed ? ['safe'] : ['unsafe-skin-tone'],
  };
}

async function moderateWithGemini(file: File) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString('base64');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: buildModerationPrompt() },
              {
                inlineData: {
                  mimeType: file.type || 'image/jpeg',
                  data: base64,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Το AI moderation δεν είναι διαθέσιμο αυτήν τη στιγμή.');
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const jsonText = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}';

  try {
    const parsed = JSON.parse(jsonText) as { allowed?: boolean; reason?: string; labels?: string[]; confidence?: number };
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    return NextResponse.json(
      { allowed: false, error: 'Μη έγκυρο αρχείο εικόνας.' },
      { status: 400 }
    );
  }

  try {
    const moderationResult = await moderateWithGemini(file);

    if (moderationResult && moderationResult.allowed === false) {
      return NextResponse.json(
        {
          allowed: false,
          error: extractReason(moderationResult),
          labels: moderationResult.labels ?? [],
          confidence: moderationResult.confidence ?? 0,
        },
        { status: 400 }
      );
    }

    if (moderationResult && moderationResult.allowed === true) {
      return NextResponse.json({ allowed: true, source: 'gemini' });
    }

    const heuristicResult = await moderateWithHeuristic(file);
    if (heuristicResult.allowed === false) {
      return NextResponse.json(
        {
          allowed: false,
          error: extractReason(heuristicResult),
          labels: heuristicResult.labels ?? [],
          confidence: heuristicResult.confidence ?? 0,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ allowed: true, source: 'heuristic' });
  } catch {
    return NextResponse.json(
      {
        allowed: false,
        error: 'Η εικόνα απορρίφθηκε: δεν ήταν δυνατή η ασφαλής επεξεργασία της.',
      },
      { status: 400 }
    );
  }
}
