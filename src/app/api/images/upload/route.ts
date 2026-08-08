import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

import { env } from '@/env';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_BUCKETS = new Set(['avatars', 'product-images']);

export const runtime = 'nodejs';

function pickFirstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

function getAwsRuntimeConfig() {
  const bucket = pickFirstNonEmpty(
    process.env.AWS_S3_BUCKET,
    process.env.AWS_BUCKET_NAME,
    process.env.S3_BUCKET_NAME,
    env.AWS_S3_BUCKET,
  );

  const region = pickFirstNonEmpty(
    process.env.AWS_REGION,
    process.env.AWS_DEFAULT_REGION,
    env.AWS_REGION,
  );

  const accessKeyId = pickFirstNonEmpty(process.env.AWS_ACCESS_KEY_ID, env.AWS_ACCESS_KEY_ID);
  const secretAccessKey = pickFirstNonEmpty(process.env.AWS_SECRET_ACCESS_KEY, env.AWS_SECRET_ACCESS_KEY);

  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
  };
}

function sanitizeFilename(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildPublicUrl(bucketName: string, region: string, key: string) {
  const customBaseUrl = env.AWS_S3_PUBLIC_BASE_URL?.trim();
  if (customBaseUrl) {
    return `${customBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

function getS3Client() {
  const { region, accessKeyId, secretAccessKey } = getAwsRuntimeConfig();

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('Λείπουν AWS credentials για upload εικόνων.');
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function POST(request: Request) {
  const awsConfig = getAwsRuntimeConfig();

  if (!awsConfig.bucket) {
    return NextResponse.json(
      { error: 'Δεν έχει ρυθμιστεί bucket για uploads. Χρησιμοποίησε AWS_S3_BUCKET (ή AWS_BUCKET_NAME / S3_BUCKET_NAME).' },
      { status: 500 },
    );
  }

  if (!awsConfig.region) {
    return NextResponse.json(
      { error: 'Δεν έχει ρυθμιστεί το AWS_REGION.' },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const bucket = formData.get('bucket');
  const userId = formData.get('userId');

  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Μη έγκυρο αρχείο εικόνας.' }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: 'Η εικόνα είναι πολύ μεγάλη. Μέγιστο μέγεθος 8MB.' },
      { status: 400 },
    );
  }

  if (typeof bucket !== 'string' || !ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Μη έγκυρο image bucket.' }, { status: 400 });
  }

  if (typeof userId !== 'string' || userId.trim().length === 0) {
    return NextResponse.json({ error: 'Μη έγκυρο user id.' }, { status: 400 });
  }

  const extension = file.name.includes('.') ? (file.name.split('.').pop() || 'webp') : 'webp';
  const fileBaseName = file.name.replace(/\.[^/.]+$/, '');
  const safeBaseName = sanitizeFilename(fileBaseName) || 'image';
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]+/g, '');

  if (!safeUserId) {
    return NextResponse.json({ error: 'Μη έγκυρο user id.' }, { status: 400 });
  }

  const objectKey = `${bucket}/${safeUserId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBaseName}.${extension}`;

  try {
    const s3Client = getS3Client();
    const body = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: awsConfig.bucket,
        Key: objectKey,
        Body: body,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return NextResponse.json({
      path: objectKey,
      publicUrl: buildPublicUrl(awsConfig.bucket, awsConfig.region, objectKey),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Αποτυχία upload εικόνας στο AWS.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
