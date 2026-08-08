import type { SupabaseClient } from '@supabase/supabase-js';

export interface UploadImageResult {
  path: string;
  publicUrl: string;
}

const MAX_WIDTH = 1400;
const MAX_HEIGHT = 1400;
const QUALITY = 0.82;

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
        : 'Δεν επιτρέπονται NSFW / γυμνές / πορνοειδείς εικόνες σε αυτό το site.';
      throw new Error(message);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Δεν επιτρέπονται NSFW / γυμνές / πορνοειδείς εικόνες σε αυτό το site.');
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
  _supabase: SupabaseClient,
  bucket: 'avatars' | 'product-images',
  userId: string,
  file: File
): Promise<UploadImageResult> {
  await ensureImageIsAllowed(file);
  const compressedFile = await compressAndNormalizeImage(file);

  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('bucket', bucket);
  formData.append('userId', userId);

  const response = await fetch('/api/images/upload', {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as {
    path?: string;
    publicUrl?: string;
    error?: string;
  } | null;

  if (!response.ok) {
    const message = typeof payload?.error === 'string'
      ? payload.error
      : 'Δεν ήταν δυνατή η αποστολή της εικόνας στο AWS.';
    throw new Error(message);
  }

  if (!payload?.path || !payload?.publicUrl) {
    throw new Error('Μη έγκυρη απόκριση από το AWS upload endpoint.');
  }

  return {
    path: payload.path,
    publicUrl: payload.publicUrl,
  };
}
