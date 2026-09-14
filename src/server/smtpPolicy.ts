export function smtpSecurity(port: number, configured?: string) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid SMTP port');
  // Standard submission ports have fixed TLS negotiation modes. A stale env
  // flag must not send an implicit TLS handshake to a STARTTLS endpoint.
  const secure = [465, 2465].includes(port) ? true
    : [25, 587, 2587].includes(port) ? false
      : configured?.trim().toLowerCase() === 'true';
  return { secure, requireTLS: !secure };
}

export function smtpAuthentication(host: string, user: string, pass: string) {
  // Resend uses a fixed protocol username, never the dashboard login email.
  // Use the existing key for the existing host; do not change destinations.
  if (host.trim().toLowerCase() === 'smtp.resend.com') {
    if (!pass.trim().startsWith('re_')) throw new Error('Resend SMTP requires a Resend API key in SMTP_PASSWORD, not an account password');
    return { user: 'resend', pass: pass.trim() };
  }
  return { user: user.trim(), pass };
}

export function existingSmtpDelivery(status: unknown) {
  if (status === 'sent') return 'sent';
  if (status === 'sending') return 'pending';
  return 'retry';
}
