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

export function formatGreekPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  const withoutCountryPrefix = digits.startsWith('30') ? digits.slice(2) : digits;
  const normalizedDigits = withoutCountryPrefix.slice(0, 10);

  if (!normalizedDigits) {
    return '';
  }

  if (normalizedDigits.length <= 2) {
    return `+30 ${normalizedDigits}`.trim();
  }

  return `+30 ${normalizedDigits.slice(0, 2)} ${normalizedDigits.slice(2)}`.trim();
}

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().replace(/\s+/g, '');
  if (!trimmed) {
    return null;
  }

  const cleaned = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  if (/^\+3069\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^3069\d{8}$/.test(trimmed)) {
    return `+${trimmed}`;
  }

  if (/^69\d{8}$/.test(trimmed)) {
    return `+30${trimmed}`;
  }

  return null;
}

export function isPhoneValid(value: unknown): boolean {
  const normalized = normalizePhone(value);
  return Boolean(normalized && /^\+3069\d{8}$/.test(normalized));
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
