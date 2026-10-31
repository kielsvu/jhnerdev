import { getAdminClient } from './supabase/admin'

type Severity = 'low' | 'medium' | 'high' | 'critical'

interface SecurityEventPayload {
  event_type: string
  severity: Severity
  admin_id?: string
  ip_address?: string
  user_agent?: string
  description: string
  metadata?: Record<string, unknown>
}

export async function logSecurityEvent(payload: SecurityEventPayload): Promise<void> {
  try {
    const db = getAdminClient()
    await db.from('security_events').insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Never throw — security logging must not break request flow
  }
}

export const SEC = {
  LOGIN_SUCCESS:      'login_success',
  LOGIN_FAILED:       'login_failed',
  LOGIN_BLOCKED:      'login_blocked',
  PIN_SUCCESS:        'pin_success',
  PIN_FAILED:         'pin_failed',
  NEW_DEVICE:         'new_device',
  DEVICE_TRUSTED:     'device_trusted',
  DEVICE_REVOKED:     'device_revoked',
  SESSION_CREATED:    'session_created',
  SESSION_EXPIRED:    'session_expired',
  SESSION_REVOKED:    'session_revoked',
  LOGOUT:             'logout',
  LOGOUT_ALL:         'logout_all',
  CONTACT_SPAM:       'contact_spam',
  API_ABUSE:          'api_abuse',
  SUSPICIOUS_IP:      'suspicious_ip',
  RATE_LIMITED:       'rate_limited',
  MESSAGE_DELETED:    'message_deleted',
  SETTINGS_CHANGED:   'settings_changed',
} as const
