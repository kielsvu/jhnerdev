// Common disposable/temporary email domains
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamailblock.com', 'spam4.me', 'trashmail.com', 'trashmail.me',
  'trashmail.net', 'trashmail.at', 'trashmail.io', 'trashmail.org',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'fakeinbox.com',
  'maildrop.cc', 'throwam.com', 'throwaway.email', 'yopmail.com',
  'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc',
  'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf',
  'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf', 'sharklasers.com',
  'guerrillamailblock.com', 'grr.la', 'guerrillamail.info', 'spam4.me',
  'dispostable.com', 'mailnull.com', 'spamgourmet.com', 'spamgourmet.net',
  'spamgourmet.org', 'spamgourmet.com', 'mailexpire.com', 'mailscrap.com',
  'spamfree24.org', 'spamfree24.de', 'spamfree24.eu', 'spamfree24.info',
  'spamfree24.net', 'spamfree24.com', 'tempr.email', 'discard.email',
  'discardmail.com', 'discardmail.de', 'spamspot.com', 'spamstack.net',
  'emailondeck.com', 'mailnesia.com', 'tempinbox.com', 'spamgourmet.com',
  'mytrashmail.com', '10minutemail.com', '10minutemail.net', '20minutemail.com',
  'filzmail.com', 'throwam.com', 'spamevader.com', 'mailinator2.com',
  'sogetthis.com', 'spamgob.com', 'trashmail.at', 'wegwerfemail.de',
  'spambog.com', 'spambog.ru', 'spambog.de', 'spamoff.de',
])

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return DISPOSABLE_DOMAINS.has(domain)
}
