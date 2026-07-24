const REMEMBER_LOGIN_KEY = 'agro_remember_login';
const ACTIVE_SESSION_KEY = 'agro_active_session';

export function saveLoginPreference(rememberLogin: boolean): void {
  if (typeof window === 'undefined') return;

  if (rememberLogin) {
    window.localStorage.setItem(REMEMBER_LOGIN_KEY, '1');
  } else {
    window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
  }

  window.sessionStorage.setItem(ACTIVE_SESSION_KEY, '1');
}

export function ensureLoginPreferenceInitialized(): void {
  if (typeof window === 'undefined') return;

  const hasRememberSetting = window.localStorage.getItem(REMEMBER_LOGIN_KEY) !== null;
  const hasActiveSession = window.sessionStorage.getItem(ACTIVE_SESSION_KEY) !== null;

  // Keep existing users logged in after rollout by defaulting old sessions to remembered.
  if (!hasRememberSetting && !hasActiveSession) {
    window.localStorage.setItem(REMEMBER_LOGIN_KEY, '1');
    window.sessionStorage.setItem(ACTIVE_SESSION_KEY, '1');
  }
}

export function shouldLogoutOnAppClose(): boolean {
  if (typeof window === 'undefined') return false;

  const remembered = window.localStorage.getItem(REMEMBER_LOGIN_KEY) === '1';
  const activeInThisSession = window.sessionStorage.getItem(ACTIVE_SESSION_KEY) === '1';

  return !remembered && !activeInThisSession;
}

export function clearLoginPreference(): void {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
  window.sessionStorage.removeItem(ACTIVE_SESSION_KEY);
}
