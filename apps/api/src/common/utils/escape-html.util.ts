const CHARS: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => CHARS[ch] ?? ch);
}

/** Allows only http/https URLs; returns '#' for anything else. */
export function sanitizeUrl(url: unknown): string {
  const s = String(url ?? '');
  return /^https?:\/\//i.test(s) ? s : '#';
}
