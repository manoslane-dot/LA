export type AppUserRole = 'consumer' | 'farmer';

export function normalizeUserRole(value: unknown): AppUserRole | null {
  if (value === 'consumer' || value === 'farmer') {
    return value;
  }

  return null;
}

export function getDashboardForRole(role: AppUserRole): string {
  return role === 'farmer' ? '/farmer/dashboard' : '/consumer/dashboard';
}

export function sanitizeRedirectUrl(redirectUrl: string | null | undefined): string | null {
  if (!redirectUrl) {
    return null;
  }

  if (!redirectUrl.startsWith('/') || redirectUrl.startsWith('//')) {
    return null;
  }

  return redirectUrl;
}

export function inferRoleFromRedirectUrl(redirectUrl: string | null | undefined): AppUserRole | null {
  const safeRedirectUrl = sanitizeRedirectUrl(redirectUrl);
  if (!safeRedirectUrl) {
    return null;
  }

  if (safeRedirectUrl.startsWith('/farmer')) {
    return 'farmer';
  }

  if (safeRedirectUrl.startsWith('/consumer')) {
    return 'consumer';
  }

  return null;
}

export function resolveRoleFromIntent(
  roleParam: string | null | undefined,
  redirectUrl: string | null | undefined,
): AppUserRole | null {
  return normalizeUserRole(roleParam) ?? inferRoleFromRedirectUrl(redirectUrl);
}

export function resolvePostLoginRedirect(options: {
  requestedRedirectUrl: string | null | undefined;
  userRole: unknown;
  fallbackRole?: AppUserRole;
}): string {
  const safeRequestedRedirect = sanitizeRedirectUrl(options.requestedRedirectUrl);
  const normalizedUserRole = normalizeUserRole(options.userRole);
  const requestedRole = inferRoleFromRedirectUrl(safeRequestedRedirect);

  if (normalizedUserRole && requestedRole && normalizedUserRole !== requestedRole) {
    return getDashboardForRole(normalizedUserRole);
  }

  if (safeRequestedRedirect) {
    return safeRequestedRedirect;
  }

  if (normalizedUserRole) {
    return getDashboardForRole(normalizedUserRole);
  }

  return getDashboardForRole(options.fallbackRole ?? 'consumer');
}
