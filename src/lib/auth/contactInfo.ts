import { sanitizeRedirectUrl } from './roleRouting';

type ContactUser = {
  email?: string | null;
  user_metadata?: {
    phone?: unknown;
    contact_email?: unknown;
  } | null;
};

export function normalizeContactEmail(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return null;
  }

  return normalized;
}

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized;
}

export function isPhoneValid(value: unknown): boolean {
  const normalized = normalizePhone(value);
  if (!normalized) {
    return false;
  }

  const compactPhone = normalized.replace(/\s/g, '');
  return compactPhone.length >= 7 && compactPhone.length <= 20;
}

export function hasRequiredContactInfo(user: ContactUser): boolean {
  const email = normalizeContactEmail(user.user_metadata?.contact_email) ?? normalizeContactEmail(user.email);
  const phone = normalizePhone(user.user_metadata?.phone);

  return Boolean(email && isPhoneValid(phone));
}

export function buildCompleteProfileRedirect(redirectUrl: string | null | undefined): string {
  const safeRedirectUrl = sanitizeRedirectUrl(redirectUrl);
  if (!safeRedirectUrl) {
    return '/auth/complete-profile';
  }

  return `/auth/complete-profile?redirectUrl=${encodeURIComponent(safeRedirectUrl)}`;
}
