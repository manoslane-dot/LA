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

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    path,
    publicUrl: publicData.publicUrl,
  };
}
