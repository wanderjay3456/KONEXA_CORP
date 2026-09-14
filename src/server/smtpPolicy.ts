export function smtpSecurity(port: number, configured?: string) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid SMTP port');
  // Standard submission ports have fixed TLS negotiation modes. A stale env
  // flag must not send an implicit TLS handshake to a STARTTLS endpoint.
  const secure = port === 465 ? true
    : [25, 587, 2587].includes(port) ? false
      : configured?.trim().toLowerCase() === 'true';
  return { secure, requireTLS: !secure };
}

export function existingSmtpDelivery(status: unknown) {
  if (status === 'sent') return 'sent';
  if (status === 'sending') return 'pending';
  return 'retry';
}
