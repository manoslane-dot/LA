import { NextResponse } from 'next/server';
import sharp from 'sharp';

import { env } from '@/env';

const SKIN_EXPOSURE_BLOCK_THRESHOLD = 0.78;
const STRONG_SKIN_COVERAGE_THRESHOLD = 0.88;
const MIN_PIXEL_ALPHA = 20;
const MIN_LARGE_CLUSTER_SIZE = 5000;
const MIN_SKIN_PIXELS_FOR_BLOCK = 12000;
const MIN_DENSE_CLUSTER_SKIN_PIXELS = 10000;

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
    return 'Δεν επιτρέπονται NSFW / γυμνές / πορνοειδείς εικόνες σε αυτό το site.';
  }

  const candidate = payload as { reason?: unknown; error?: unknown };
  if (typeof candidate.reason === 'string' && candidate.reason.trim()) {
    return candidate.reason;
  }
  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error;
  }

  return 'Δεν επιτρέπονται NSFW / γυμνές / πορνοειδείς εικόνες σε αυτό το site.';
}

async function moderateWithHeuristic(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const image = sharp(bytes);
  const { data, info } = await image.resize(180, 180, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true });

  let visiblePixels = 0;
  let skinLikePixels = 0;
  const channels = info.channels;
  const width = info.width;
  const height = info.height;
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  let largestClusterSize = 0;

  const getIndex = (x: number, y: number) => y * width + x;
  const isSkinTone = (r: number, g: number, b: number, a: number) => {
    if (a < MIN_PIXEL_ALPHA) {
      return false;
    }

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;

    return (
      r > 95 &&
      g > 40 &&
      b > 20 &&
      r > g &&
      r > b &&
      chroma > 15 &&
      Math.abs(r - g) > 15
    );
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = getIndex(x, y);
      const pixelOffset = index * channels;
      const r = data[pixelOffset] ?? 0;
      const g = data[pixelOffset + 1] ?? 0;
      const b = data[pixelOffset + 2] ?? 0;
      const a = channels > 3 ? (data[pixelOffset + 3] ?? 0) : 255;

      if (!isSkinTone(r, g, b, a)) {
        continue;
      }

      skinLikePixels += 1;
      if (visited[index]) {
        continue;
      }

      const stack = [index];
      visited[index] = 1;
      let clusterSize = 0;

      while (stack.length > 0) {
        const current = stack.pop();
        if (current === undefined) {
          continue;
        }

        clusterSize += 1;
        const currentX = current % width;
        const currentY = Math.floor(current / width);

        const neighbors = [
          [currentX - 1, currentY],
          [currentX + 1, currentY],
          [currentX, currentY - 1],
          [currentX, currentY + 1],
        ];

        for (const [nextX, nextY] of neighbors) {
          if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
            continue;
          }

          const nextIndex = getIndex(nextX, nextY);
          if (visited[nextIndex]) {
            continue;
          }

          const nextOffset = nextIndex * channels;
          const nextR = data[nextOffset] ?? 0;
          const nextG = data[nextOffset + 1] ?? 0;
          const nextB = data[nextOffset + 2] ?? 0;
          const nextA = channels > 3 ? (data[nextOffset + 3] ?? 0) : 255;

          if (!isSkinTone(nextR, nextG, nextB, nextA)) {
            continue;
          }

          visited[nextIndex] = 1;
          stack.push(nextIndex);
        }
      }

      if (clusterSize > largestClusterSize) {
        largestClusterSize = clusterSize;
      }
    }
  }

  visiblePixels = totalPixels;
  const skinExposureRatio = visiblePixels === 0 ? 0 : skinLikePixels / visiblePixels;
  const hasLargeSkinCluster = largestClusterSize >= MIN_LARGE_CLUSTER_SIZE;
  const hasStrongSkinCoverage = skinExposureRatio >= STRONG_SKIN_COVERAGE_THRESHOLD;
  const hasTooManySkinPixels = skinLikePixels >= MIN_SKIN_PIXELS_FOR_BLOCK;
  const hasDenseSkinCluster = skinLikePixels >= MIN_DENSE_CLUSTER_SKIN_PIXELS && largestClusterSize >= MIN_LARGE_CLUSTER_SIZE;
  const hasExtremeSkinExposure = skinExposureRatio >= SKIN_EXPOSURE_BLOCK_THRESHOLD && hasLargeSkinCluster;
  const allowed = !(hasStrongSkinCoverage || hasTooManySkinPixels || hasDenseSkinCluster || hasExtremeSkinExposure);

  return {
    allowed,
    reason: allowed ? 'safe' : 'Δεν επιτρέπονται NSFW / γυμνές / πορνοειδή εικόνες σε αυτό το site.',
    confidence: allowed ? 0.65 : 0.98,
    labels: allowed ? ['safe'] : ['unsafe-nudity', 'nsfw'],
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
    const heuristicResult = await moderateWithHeuristic(file);

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

    if (moderationResult && moderationResult.allowed === true) {
      return NextResponse.json({ allowed: true, source: 'gemini' });
    }

    return NextResponse.json({ allowed: true, source: 'heuristic' });
  } catch {
    return NextResponse.json(
      {
        allowed: false,
        error: 'Δεν επιτρέπονται NSFW / γυμνές / πορνοειδείς εικόνες σε αυτό το site.',
      },
      { status: 400 }
    );
  }
}
