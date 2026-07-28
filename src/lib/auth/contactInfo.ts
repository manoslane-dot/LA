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

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (!digitsOnly) {
    return null;
  }

  if (digitsOnly.startsWith('30')) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.startsWith('69')) {
    return `+30${digitsOnly}`;
  }

  return null;
}

export function isPhoneValid(value: unknown): boolean {
  const normalized = normalizePhone(value);
  if (!normalized) {
    return false;
  }

  const digitsOnly = normalized.replace(/\+/g, '').replace(/\D/g, '');
  return digitsOnly === `30${digitsOnly.slice(2)}` && digitsOnly.length === 12 && digitsOnly.startsWith('3069');
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
