/**
 * Builds the public voting URL encoded inside QR codes.
 */
export function buildVotingUrl(token: string): string {
  const configuredBase = import.meta.env.VITE_PUBLIC_APP_URL?.trim();

  const base = configuredBase && configuredBase.length > 0
    ? configuredBase
    : window.location.origin;

  const normalizedBase = base.replace(/\/+$/, '');
  return `${normalizedBase}/vote/${token}`;
}
