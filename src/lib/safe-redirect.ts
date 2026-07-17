// Matches candidates that decode to a protocol-relative or backslash
// payload some browsers still treat as protocol-relative.
const PROTOCOL_RELATIVE_PATTERN = /^\/\s*\\|^\/\/|^\/\s*\//;
// Matches any other URL scheme (e.g. "javascript:", "data:").
const URL_SCHEME_PATTERN = /^[a-z]+:/i;

/**
 * Validates a user-supplied redirect target (e.g. `?redirectTo=`) before
 * it's ever passed to `redirect()`.
 *
 * Without this check, a value like `redirectTo=https://evil.example.com`
 * or `redirectTo=//evil.example.com` would be accepted and, after a
 * legitimate sign-in, silently send the user off-site — a classic open
 * redirect used in phishing. Only same-origin, relative paths are allowed.
 *
 * Use this on every user-supplied redirect target (query params, form
 * fields) before calling `redirect()` in a Server Action or Route Handler.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback: string
): string {
  if (!candidate) {
    return fallback;
  }

  // Must start with a single "/" — rejects absolute URLs
  // ("https://evil.com"), protocol-relative URLs ("//evil.com"), and
  // scheme-relative payloads ("/\evil.com", "/%09/evil.com" after
  // decoding) that some browsers still treat as protocol-relative.
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  if (candidate.trim() !== candidate) {
    return fallback;
  }

  // Reject anything that decodes to a protocol-relative or absolute URL,
  // e.g. "/%2F%2Fevil.com" or "/\t/evil.com".
  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return fallback;
  }
  if (
    PROTOCOL_RELATIVE_PATTERN.test(decoded) ||
    URL_SCHEME_PATTERN.test(decoded)
  ) {
    return fallback;
  }

  return candidate;
}
