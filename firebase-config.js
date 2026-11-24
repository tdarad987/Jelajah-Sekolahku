export const firebaseConfig = {
  apiKey: "ISI_apiKey",
  authDomain: "ISI_authDomain",
  projectId: "ISI_projectId",
  storageBucket: "ISI_storageBucket",
  messagingSenderId: "ISI_messagingSenderId",
  appId: "ISI_appId"
};

// Nilai yang wajib benar agar Firestore bisa dipakai.
const REQUIRED_FIELDS = ['apiKey', 'authDomain', 'projectId', 'appId'];

// Penanda umum pada contoh/placeholder yang tidak boleh dianggap konfigurasi asli.
const PLACEHOLDER_MARKERS = ['ISI_', 'contoh', 'nama-proyek', 'abcdef', '123456789012', '://', 'xxxx'];

const FIELD_PATTERNS = {
  apiKey: /^AIza[0-9A-Za-z_-]{30,}$/,
  authDomain: /^[a-z0-9-]+\.(firebaseapp\.com|web\.app)$/i,
  projectId: /^[a-z0-9][a-z0-9-]{2,28}[a-z0-9]$/,
  appId: /^1:\d{6,}:(web|android|ios):[0-9a-f]+$/i
};

function hasPlaceholderMarker(value) {
  const lower = value.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker.toLowerCase()));
}

/**
 * Mengecek apakah sebuah nilai konfigurasi masih placeholder atau formatnya tidak valid.
 * @param {string} field nama field pada firebaseConfig
 * @returns {boolean}
 */
function isPlaceholderValue(field, value) {
  if (typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (hasPlaceholderMarker(trimmed)) return true;
  const pattern = FIELD_PATTERNS[field];
  return pattern ? !pattern.test(trimmed) : false;
}

/**
 * True hanya jika semua field wajib berisi nilai Firebase yang asli.
 * @returns {boolean}
 */
export function isFirebaseConfigured() {
  return REQUIRED_FIELDS.every((field) => !isPlaceholderValue(field, firebaseConfig[field]));
}

/**
 * Daftar field yang belum diisi dengan benar, dipakai untuk pesan bantuan.
 * @returns {string[]}
 */
export function getMissingConfigFields() {
  return REQUIRED_FIELDS.filter((field) => isPlaceholderValue(field, firebaseConfig[field]));
}
