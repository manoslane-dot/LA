import type { SupabaseClient } from '@supabase/supabase-js';

export interface UploadImageResult {
  path: string;
  publicUrl: string;
}

const MAX_WIDTH = 1400;
const MAX_HEIGHT = 1400;
const QUALITY = 0.82;
const SKIN_EXPOSURE_BLOCK_THRESHOLD = 0.68;
const MIN_PIXEL_ALPHA = 20;

function sanitizeFilename(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function ensureImageIsAllowed(file: File) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/moderation/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      const message = typeof errorPayload?.error === 'string'
        ? errorPayload.error
        : 'Η εικόνα απορρίφθηκε: εντοπίστηκε πιθανό ακατάλληλο περιεχόμενο. Επιλέξτε άλλη εικόνα.';
      throw new Error(message);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('απορρίφθηκε')) {
      throw error;
    }
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = 180;
  canvas.height = 180;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return;
  }

  ctx.drawImage(bitmap, 0, 0, 180, 180);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let visiblePixels = 0;
  let skinLikePixels = 0;

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index] ?? 0;
    const g = data[index + 1] ?? 0;
    const b = data[index + 2] ?? 0;
    const a = data[index + 3] ?? 0;

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

  if (visiblePixels === 0) {
    return;
  }

  const skinExposureRatio = skinLikePixels / visiblePixels;
  if (skinExposureRatio >= SKIN_EXPOSURE_BLOCK_THRESHOLD) {
    throw new Error('Η εικόνα απορρίφθηκε: εντοπίστηκε πιθανό ακατάλληλο περιεχόμενο. Επιλέξτε άλλη εικόνα.');
  }
}

export async function compressAndNormalizeImage(file: File): Promise<File> {
  if (typeof window === 'undefined') {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const scale = Math.min(1, Math.min(MAX_WIDTH / width, MAX_HEIGHT / height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Σφάλμα συμπίεσης εικόνας'));
        }
      },
      'image/webp',
      QUALITY
    );
  });

  const safeName = sanitizeFilename(file.name) || `image-${Date.now()}`;
  return new File([blob], `${safeName}.webp`, { type: 'image/webp' });
}

export async function uploadImageToSupabase(
  supabase: SupabaseClient,
  bucket: 'avatars' | 'product-images',
  userId: string,
  file: File
): Promise<UploadImageResult> {
  await ensureImageIsAllowed(file);
  const compressedFile = await compressAndNormalizeImage(file);

  const extension = compressedFile.name.split('.').pop() || 'webp';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { data, error } = await supabase.storage.from(bucket).upload(path, compressedFile, {
    cacheControl: '3600',
    upsert: false,
    contentType: compressedFile.type,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Δεν δημιουργήθηκε αρχείο στο Supabase Storage');
  }

  let publicUrl = path;

  try {
    const { data: signedData, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7);
    if (!signedError && signedData?.signedUrl) {
      publicUrl = signedData.signedUrl;
    } else {
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
      publicUrl = publicData.publicUrl;
    }
  } catch {
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
    publicUrl = publicData.publicUrl;
  }

  return {
    path,
    publicUrl,
  };
}
