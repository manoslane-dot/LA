const USERNAME_ALLOWED_REGEX = /^[\p{L}\p{N}]+$/u;
const PASSWORD_SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>\[\]\\/`~;'+\-_=]/;
const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  'qwerty123',
  'admin123',
  'welcome123',
  'iloveyou',
  'letmein',
]);

export function normalizeUsername(value: string): string {
  return value.trim();
}

export function validateUsername(value: string): string | null {
  const username = normalizeUsername(value);

  if (!username) {
    return 'Συμπληρώστε username.';
  }

  if (username.length < 3 || username.length > 30) {
    return 'Το username πρέπει να έχει 3 έως 30 χαρακτήρες.';
  }

  if (username.includes('_') || username.includes('.')) {
    return 'Το username δεν επιτρέπεται να περιέχει κάτω παύλα (_) ή τελεία (.).';
  }

  if (!USERNAME_ALLOWED_REGEX.test(username)) {
    return 'Το username επιτρέπεται να περιέχει μόνο γράμματα και αριθμούς (χωρίς κενά ή ειδικούς χαρακτήρες).';
  }

  return null;
}

function containsLikelyDate(password: string): boolean {
  return /(?:19|20)\d{2}|\b\d{1,2}[\/.-]\d{1,2}([\/.-]\d{2,4})?\b/.test(password);
}

type PasswordContext = {
  username?: string;
  email?: string;
};

export function validateStrongPassword(value: string, context?: PasswordContext): string | null {
  const password = value;
  const normalizedPassword = password.toLowerCase();

  if (password.length < 8 || password.length > 12) {
    return 'Ο κωδικός πρέπει να έχει 8 έως 12 χαρακτήρες.';
  }

  if (!/[a-z]/.test(password)) {
    return 'Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα πεζό γράμμα.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα κεφαλαίο γράμμα.';
  }

  if (!/\d/.test(password)) {
    return 'Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν αριθμό.';
  }

  if (!PASSWORD_SPECIAL_CHAR_REGEX.test(password)) {
    return 'Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν ειδικό χαρακτήρα (π.χ. !, @, #, $, %).';
  }

  if (COMMON_WEAK_PASSWORDS.has(normalizedPassword)) {
    return 'Επιλέξτε πιο ισχυρό κωδικό. Αποφύγετε εύκολους ή συνηθισμένους κωδικούς.';
  }

  if (containsLikelyDate(password)) {
    return 'Αποφύγετε προσωπικές πληροφορίες όπως ημερομηνίες στον κωδικό.';
  }

  const normalizedUsername = context?.username?.trim().toLowerCase();
  if (normalizedUsername && normalizedUsername.length >= 3 && normalizedPassword.includes(normalizedUsername)) {
    return 'Ο κωδικός δεν πρέπει να περιέχει το username.';
  }

  const emailLocalPart = context?.email?.split('@')[0]?.trim().toLowerCase();
  if (emailLocalPart && emailLocalPart.length >= 3 && normalizedPassword.includes(emailLocalPart)) {
    return 'Ο κωδικός δεν πρέπει να περιέχει μέρος του email σας.';
  }

  return null;
}
