'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

type Message = {
  id: string; name: string; email: string; subject: string
  message: string; status: 'unread' | 'read' | 'archived'
  risk_level: string; created_at: string
}
type SecurityEvent = {
  id: string; event_type: string; severity: string; ip_address: string
  description: string; created_at: string; reviewed: boolean
}
type TrustedDevice = {
  id: string; label: string; trusted_at: string; expires_at: string
}
type ActiveSession = {
  id: string; ip_address: string; user_agent: string
  created_at: string; last_active: string; expires_at: string
}
type Section = 'inbox' | 'unread' | 'archived' | 'security' | 'devices' | 'sessions'

const INACTIVITY_TIMEOUT = 10 * 60 * 1000

// ── Tokens (portfolio design system) ─────────────────────────────────────────

const T = {
  bg:        '#0d0d0d',
  card:      '#1a1a1a',
  nav:       '#141414',
  navActive: '#242424',
  border:    '#2a2a2a',
  borderSub: 'rgba(42,42,42,0.7)',
  text:      '#f0f0f0',
  text2:     '#888888',
  text3:     '#555555',
  blue:      '#60a5fa',
  red:       '#f87171',
  orange:    '#fb923c',
  yellow:    '#facc15',
  green:     '#4ade80',
} as const

const sp = {
  default: { type: 'spring' as const, damping: 26, stiffness: 300 },
  tap:     { type: 'spring' as const, damping: 30, stiffness: 420 },
  nav:     { type: 'spring' as const, damping: 24, stiffness: 320 },
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function Svg({ size, vb = '0 0 16 16', children }: {
  size: number; vb?: string; children: React.ReactNode
}) {
  return (
    <svg width={size} height={size} viewBox={vb} fill="none">
      {children}
    </svg>
  )
}

const IconArrow   = ({ s = 14 }: { s?: number }) => (
  <Svg size={s} vb="0 0 14 14">
    <path d="M3 11 11 3M11 3H5.5M11 3v5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
)
const IconBack    = ({ s = 16 }: { s?: number }) => (
  <Svg size={s}><path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>
)
const IconSearch  = ({ s = 15 }: { s?: number }) => (
  <Svg size={s}><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></Svg>
)
const IconX       = ({ s = 14 }: { s?: number }) => (
  <Svg size={s}><path d="M3 3 11 11M11 3 3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></Svg>
)
const IconLock    = ({ s = 28 }: { s?: number }) => (
  <Svg size={s} vb="0 0 28 28">
    <rect x="5" y="12" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M9.5 12V9a4.5 4.5 0 0 1 9 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="14" cy="19.5" r="1.7" fill="currentColor"/>
  </Svg>
)
const IconHome    = ({ s = 16 }: { s?: number }) => (
  <Svg size={s}><path d="M2 7 8 2l6 5v7a1 1 0 0 1-1 1H9.5V11h-3v4H3a1 1 0 0 1-1-1V7Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></Svg>
)
const IconMail    = ({ s = 16 }: { s?: number }) => (
  <Svg size={s}><rect x="1.5" y="3.5" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1.25"/><path d="M1.5 5.5 8 9l6.5-3.5" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></Svg>
)
const IconArchive = ({ s = 16 }: { s?: number }) => (
  <Svg size={s}><rect x="1.5" y="2.5" width="13" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.25"/><path d="M2.5 5.5h11v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V5.5Z" stroke="currentColor" strokeWidth="1.25"/><path d="M6 9.5h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></Svg>
)
const IconShield  = ({ s = 16 }: { s?: number }) => (
  <Svg size={s}><path d="M8 1.5 2.5 3.5V8c0 3 2.5 5.5 5.5 6 3-.5 5.5-3 5.5-6V3.5L8 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/></Svg>
)
const IconDevice  = ({ s = 16 }: { s?: number }) => (
  <Svg size={s}><rect x="1" y="3" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.25"/><path d="M1 7.5h10M4 13h8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/><rect x="12" y="6" width="3" height="4.5" rx="0.5" stroke="currentColor" strokeWidth="1.25"/></Svg>
)
const IconActivity= ({ s = 16 }: { s?: number }) => (
  <Svg size={s}><path d="M1 8h2.5L5.5 4l3 8 2-4H15" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></Svg>
)
const IconLogout  = ({ s = 14 }: { s?: number }) => (
  <Svg size={s}><path d="M6 2.5H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h3M10.5 5 14 8l-3.5 3M14 8H6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/></Svg>
)

// ── Feed card ─────────────────────────────────────────────────────────────────

function FeedCard({
  title, description, category, time, badge,
  onClick, unread = false, action,
}: {
  title: string; description: string; category: string; time: string
  badge?: { label: string; color: string }
  onClick?: () => void; unread?: boolean; action?: React.ReactNode
}) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.975 } : undefined}
      transition={sp.tap}
      onClick={onClick}
      style={{
        background: T.card,
        borderRadius: 12,
        padding: '15px 17px',
        border: `1px solid ${T.border}`,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          {unread && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.blue, flexShrink: 0 }} />
          )}
          <span style={{
            fontSize: 14.5, fontWeight: unread ? 700 : 600, color: T.text,
            letterSpacing: '-0.015em', lineHeight: 1.3,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            fontFamily: "'Syne', -apple-system, sans-serif",
          }}>
            {title}
          </span>
        </div>
        {onClick && (
          <span style={{ color: T.text3, flexShrink: 0, marginTop: 2 }}>
            <IconArrow s={13} />
          </span>
        )}
      </div>

      <p style={{
        fontSize: 13, color: T.text2, lineHeight: 1.55, marginBottom: 11,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        fontFamily: "'Syne', -apple-system, sans-serif",
      }}>
        {description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: T.text3, fontFamily: "'DM Mono', monospace" }}>
          {badge ? (
            <span style={{
              fontSize: 10.5, fontWeight: 500, padding: '2px 7px', borderRadius: 5,
              background: badge.color + '18', color: badge.color,
              fontFamily: "'DM Mono', monospace",
            }}>
              {badge.label}
            </span>
          ) : (
            <span>{category}</span>
          )}
          <span>{time}</span>
        </div>
        {action}
      </div>
    </motion.div>
  )
}

// ── Bottom nav ────────────────────────────────────────────────────────────────

type NavItem = { id: Section; icon: React.ReactNode; dot?: boolean }

function BottomNav({ items, active, onSelect }: {
  items: NavItem[]; active: Section; onSelect: (s: Section) => void
}) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', justifyContent: 'center',
      paddingBottom: `calc(18px + env(safe-area-inset-bottom, 0px))`,
      background: `linear-gradient(to top, ${T.bg} 55%, transparent)`,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', gap: 2, padding: '6px 8px',
        background: T.nav,
        borderRadius: 22,
        border: `1px solid ${T.border}`,
        pointerEvents: 'auto',
      }}>
        {items.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                position: 'relative', width: 46, height: 42,
                borderRadius: 14, border: 'none',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isActive ? T.text : T.text3,
                transition: 'color 0.15s',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  transition={sp.nav}
                  style={{
                    position: 'absolute', inset: 0,
                    background: T.navActive,
                    borderRadius: 14, zIndex: 0,
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
                {item.icon}
              </span>
              {item.dot && !isActive && (
                <span style={{
                  position: 'absolute', top: 7, right: 9,
                  width: 5, height: 5, borderRadius: '50%',
                  background: T.blue, zIndex: 2,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Inline action button ──────────────────────────────────────────────────────

function InlineBtn({ label, danger = false, onClick }: {
  label: string; danger?: boolean; onClick: (e: React.MouseEvent) => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      transition={sp.tap}
      onClick={e => { e.stopPropagation(); onClick(e) }}
      style={{
        padding: '4px 11px', borderRadius: 8, border: 'none',
        background: danger ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.05)',
        color: danger ? T.red : T.text3,
        fontSize: 11.5, fontWeight: 500,
        fontFamily: "'DM Mono', monospace",
        cursor: 'pointer',
      }}
    >
      {label}
    </motion.button>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [section, setSection]           = useState<Section>('inbox')
  const [messages, setMessages]         = useState<Message[]>([])
  const [events, setEvents]             = useState<SecurityEvent[]>([])
  const [devices, setDevices]           = useState<TrustedDevice[]>([])
  const [sessions, setSessions]         = useState<ActiveSession[]>([])
  const [selected, setSelected]         = useState<Message | null>(null)
  const [loading, setLoading]           = useState(false)
  const [search, setSearch]             = useState('')
  const [totalMessages, setTotalMessages] = useState(0)
  const [unreadCount, setUnreadCount]   = useState(0)
  const [sessionInfo, setSessionInfo]   = useState<{ last_active?: string; expires_at?: string } | null>(null)
  const [locked, setLocked]             = useState(false)
  const [showSearch, setShowSearch]     = useState(false)
  const [showLogout, setShowLogout]     = useState(false)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createSupabaseBrowserClient()

  const handleSection = useCallback((s: Section) => {
    setSection(s)
    setSelected(null)
    setShowSearch(false)
    setSearch('')
    setShowLogout(false)
  }, [])

  useEffect(() => {
    fetch('/api/admin/auth/session').then(r => r.json())
      .then(d => { if (!d.authenticated) window.location.href = '/dev.email/login'; else setSessionInfo(d) })
      .catch(() => { window.location.href = '/dev.email/login' })
  }, [])

  const resetInactivity = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => setLocked(true), INACTIVITY_TIMEOUT)
  }, [])

  useEffect(() => {
    const evts = ['mousemove', 'keydown', 'pointerdown', 'scroll']
    evts.forEach(e => window.addEventListener(e, resetInactivity, { passive: true }))
    resetInactivity()
    return () => {
      evts.forEach(e => window.removeEventListener(e, resetInactivity))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [resetInactivity])

  useEffect(() => {
    const channel = supabase.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, () => {
        setUnreadCount(c => c + 1)
        if (section === 'inbox' || section === 'unread') fetchMessages(section)
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [section]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMessages = useCallback(async (activeSection: Section, q = '') => {
    const statusMap: Partial<Record<Section, string>> = { unread: 'unread', archived: 'archived' }
    const params = new URLSearchParams({ limit: '30' })
    const s = statusMap[activeSection]
    if (s) params.set('status', s)
    if (q) params.set('q', q)
    setLoading(true)
    const res = await fetch(`/api/admin/messages?${params}`)
    const data = await res.json()
    setMessages(data.messages ?? [])
    setTotalMessages(data.total ?? 0)
    setLoading(false)
    const ur = await fetch('/api/admin/messages?status=unread&limit=1')
    const ud = await ur.json()
    setUnreadCount(ud.total ?? 0)
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/security-events?limit=50')
    const data = await res.json()
    setEvents(data.events ?? [])
    setLoading(false)
  }, [])

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/trusted-devices')
    const data = await res.json()
    setDevices(data.devices ?? [])
    setLoading(false)
  }, [])

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/sessions')
    const data = await res.json()
    setSessions(data.sessions ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    setSelected(null)
    if (section === 'inbox' || section === 'unread' || section === 'archived') fetchMessages(section, search)
    else if (section === 'security') fetchEvents()
    else if (section === 'devices') fetchDevices()
    else if (section === 'sessions') fetchSessions()
  }, [section]) // eslint-disable-line react-hooks/exhaustive-deps

  async function openMessage(msg: Message) {
    setSelected(msg)
    if (msg.status !== 'unread') return
    await fetch(`/api/admin/messages/${msg.id}`)
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  async function updateStatus(id: string, status: Message['status']) {
    await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  async function deleteMessage(id: string) {
    await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
    setMessages(prev => prev.filter(m => m.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function revokeDevice(id: string) {
    await fetch(`/api/admin/trusted-devices?id=${id}`, { method: 'DELETE' })
    setDevices(prev => prev.filter(d => d.id !== id))
  }

  async function revokeSession(id: string) {
    await fetch(`/api/admin/sessions?id=${id}`, { method: 'DELETE' })
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  async function logout(all = false) {
    await fetch('/api/admin/auth/logout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all }),
    })
    window.location.href = '/dev.email/login'
  }

  async function dismissEvent(id: string) {
    await fetch('/api/admin/security-events', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setEvents(prev => prev.map(e => e.id === id ? { ...e, reviewed: true } : e))
  }

  // ── Locked ──────────────────────────────────────────────────────────────────

  if (locked) {
    return (
      <div style={{
        minHeight: '100vh', background: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        fontFamily: "'Syne', -apple-system, sans-serif",
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={sp.default}
          style={{
            background: 'rgba(26,26,26,0.82)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: `1px solid ${T.border}`,
            borderRadius: 18, padding: '36px 28px',
            maxWidth: 300, width: '100%', textAlign: 'center',
          }}>
          <div style={{ color: T.text3, marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <IconLock s={28} />
          </div>
          <p style={{ fontSize: 13.5, color: T.text2, lineHeight: 1.6, marginBottom: 24 }}>
            Session locked due to inactivity.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }} transition={sp.tap}
            onClick={() => window.location.href = '/dev.email/login'}
            style={{
              width: '100%', padding: 12,
              background: T.text, color: T.bg,
              border: 'none', borderRadius: 11,
              fontSize: 13.5, fontWeight: 600,
              fontFamily: "'Syne', -apple-system, sans-serif",
              letterSpacing: '-0.01em',
              cursor: 'pointer',
            }}>
            Sign in again
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── Nav + labels ─────────────────────────────────────────────────────────────

  const sectionLabels: Record<Section, string> = {
    inbox: 'Inbox', unread: 'Unread', archived: 'Archived',
    security: 'Security', devices: 'Devices', sessions: 'Sessions',
  }

  const navItems: NavItem[] = [
    { id: 'inbox',    icon: <IconHome s={16} /> },
    { id: 'unread',   icon: <IconMail s={16} />,    dot: unreadCount > 0 },
    { id: 'archived', icon: <IconArchive s={16} /> },
    { id: 'security', icon: <IconShield s={16} /> },
    { id: 'devices',  icon: <IconDevice s={16} /> },
    { id: 'sessions', icon: <IconActivity s={16} /> },
  ]

  const isMsg = section === 'inbox' || section === 'unread' || section === 'archived'
  const label = sectionLabels[section]

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        body { background: ${T.bg}; }

        .jh-search::placeholder { color: ${T.text3}; }
        .jh-search:focus { outline: none; border-color: rgba(42,42,42,0.9) !important; }
        .jh-search::-webkit-search-cancel-button { display: none; }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <div style={{
        minHeight: '100vh', background: T.bg,
        fontFamily: "'Syne', -apple-system, sans-serif",
        paddingBottom: 100,
        WebkitFontSmoothing: 'antialiased',
      }}>

        {/* Logout dropdown backdrop */}
        {showLogout && (
          <div onClick={() => setShowLogout(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
        )}

        {/* Logout dropdown */}
        <AnimatePresence>
          {showLogout && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -6 }}
              transition={sp.tap}
              style={{
                position: 'fixed', top: 66, right: 20, zIndex: 99,
                background: 'rgba(26,26,26,0.92)',
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                border: `1px solid ${T.border}`,
                borderRadius: 13, overflow: 'hidden', minWidth: 190,
              }}
            >
              {[
                { label: 'Sign out',            fn: () => logout(false), danger: false },
                { label: 'Sign out everywhere', fn: () => logout(true),  danger: true  },
              ].map(item => (
                <motion.button key={item.label}
                  whileTap={{ opacity: 0.6 }} transition={sp.tap}
                  onClick={() => { setShowLogout(false); item.fn() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '12px 16px',
                    background: 'transparent', border: 'none',
                    borderBottom: item.danger ? 'none' : `1px solid ${T.border}`,
                    color: item.danger ? T.red : T.text2,
                    fontSize: 13, fontFamily: "'Syne', -apple-system, sans-serif",
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                  <IconLogout s={13} />
                  {item.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 20px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 20,
          background: T.bg,
          paddingTop: `calc(20px + env(safe-area-inset-top, 0px))`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {selected ? (
              <motion.button
                whileTap={{ scale: 0.9 }} transition={sp.tap}
                onClick={() => setSelected(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: T.text2, fontSize: 14,
                  fontFamily: "'Syne', -apple-system, sans-serif",
                  padding: 0,
                }}>
                <IconBack s={15} />
                {label}
              </motion.button>
            ) : (
              <h1 style={{
                fontSize: 21, fontWeight: 700, color: T.text,
                letterSpacing: '-0.022em',
                fontFamily: "'Syne', -apple-system, sans-serif",
              }}>
                {label}
              </h1>
            )}
            {isMsg && !selected && unreadCount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: T.blue, color: '#fff',
                borderRadius: 10, padding: '2px 7px',
                fontFamily: "'DM Mono', monospace",
              }}>
                {unreadCount}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMsg && !selected && (
              <motion.button
                whileTap={{ scale: 0.88 }} transition={sp.tap}
                onClick={() => { setShowSearch(v => !v); setShowLogout(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 34, height: 34, borderRadius: '50%',
                  background: showSearch ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: showSearch ? T.text : T.text3,
                  transition: 'background 0.15s, color 0.15s',
                }}>
                {showSearch ? <IconX s={13} /> : <IconSearch s={14} />}
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.88 }} transition={sp.tap}
              onClick={() => { setShowLogout(v => !v); setShowSearch(false) }}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: T.card,
                border: `1px solid ${T.border}`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: T.text2,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.02em',
              }}>
              JH
            </motion.button>
          </div>
        </div>

        {/* ── Search bar ── */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 52 }}
              exit={{ opacity: 0, height: 0 }}
              transition={sp.default}
              style={{ overflow: 'hidden', padding: '0 20px' }}
            >
              <input
                type="search"
                autoFocus
                placeholder="Search messages…"
                value={search}
                onChange={e => { setSearch(e.target.value); fetchMessages(section, e.target.value) }}
                className="jh-search"
                style={{
                  width: '100%', marginTop: 12,
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 10, color: T.text,
                  fontSize: 13.5, padding: '10px 14px',
                  fontFamily: "'Syne', -apple-system, sans-serif",
                  outline: 'none',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content ── */}
        <div style={{ padding: '16px 20px 0' }}>
          <AnimatePresence mode="wait">

            {/* ── Message detail ── */}
            {selected && (
              <motion.div key={`detail-${selected.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                transition={sp.default}
              >
                <div style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 14, padding: '18px',
                  marginBottom: 10,
                }}>
                  <p style={{
                    fontSize: 17, fontWeight: 700, color: T.text,
                    letterSpacing: '-0.018em', marginBottom: 6, lineHeight: 1.3,
                    fontFamily: "'Syne', -apple-system, sans-serif",
                  }}>
                    {selected.subject}
                  </p>
                  <p style={{ fontSize: 13, color: T.text3, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>
                    {selected.name}
                  </p>
                  <a href={`mailto:${selected.email}`}
                    style={{
                      fontSize: 12.5, color: T.text2,
                      textDecoration: 'underline', textUnderlineOffset: 3,
                      fontFamily: "'DM Mono', monospace",
                    }}>
                    {selected.email}
                  </a>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: T.text3, fontFamily: "'DM Mono', monospace" }}>
                      {new Date(selected.created_at).toLocaleString()}
                    </span>
                    {selected.risk_level !== 'low' && (
                      <span style={{
                        fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 5,
                        background: riskColor(selected.risk_level) + '18',
                        color: riskColor(selected.risk_level),
                        fontFamily: "'DM Mono', monospace",
                      }}>
                        {selected.risk_level} risk
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 14, padding: '18px',
                  fontSize: 14, lineHeight: 1.75, color: T.text,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  marginBottom: 12,
                  fontFamily: "'Syne', -apple-system, sans-serif",
                }}>
                  {selected.message}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {([
                    selected.status !== 'archived' && { label: 'Archive',      fn: () => updateStatus(selected.id, 'archived'), danger: false },
                    selected.status === 'archived' && { label: 'Unarchive',    fn: () => updateStatus(selected.id, 'read'),     danger: false },
                    selected.status !== 'unread'   && { label: 'Mark unread',  fn: () => updateStatus(selected.id, 'unread'),   danger: false },
                    { label: 'Delete', danger: true, fn: () => { if (confirm('Delete permanently?')) deleteMessage(selected.id) } },
                  ] as const).filter(Boolean).map((b: any) => (
                    <motion.button key={b.label} whileTap={{ scale: 0.96 }} transition={sp.tap}
                      onClick={b.fn}
                      style={{
                        padding: '8px 15px', borderRadius: 10,
                        border: `1px solid ${b.danger ? 'rgba(248,113,113,0.2)' : T.border}`,
                        background: 'transparent',
                        color: b.danger ? T.red : T.text2,
                        fontSize: 13, fontFamily: "'Syne', -apple-system, sans-serif",
                        cursor: 'pointer',
                      }}>
                      {b.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Section lists ── */}
            {!selected && (
              <motion.div key={section}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                transition={sp.default}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {loading && <Spinner />}

                {/* Inbox / Unread / Archived */}
                {!loading && isMsg && (
                  <>
                    {messages.length === 0 && <Empty text="No messages" />}
                    {messages.map(msg => (
                      <FeedCard
                        key={msg.id}
                        title={msg.name}
                        description={msg.subject}
                        category={msg.status}
                        time={formatDate(msg.created_at)}
                        unread={msg.status === 'unread'}
                        onClick={() => openMessage(msg)}
                      />
                    ))}
                  </>
                )}

                {/* Security */}
                {!loading && section === 'security' && (
                  <>
                    {events.length === 0 && <Empty text="No security events" />}
                    {events.map(ev => (
                      <div key={ev.id} style={{ opacity: ev.reviewed ? 0.4 : 1, transition: 'opacity 0.3s' }}>
                        <FeedCard
                          title={ev.description}
                          description={`${ev.ip_address}  ·  ${ev.event_type}`}
                          category=""
                          time={formatDate(ev.created_at)}
                          badge={{ label: ev.severity, color: riskColor(ev.severity) }}
                          action={
                            !ev.reviewed
                              ? <InlineBtn label="Dismiss" onClick={() => dismissEvent(ev.id)} />
                              : undefined
                          }
                        />
                      </div>
                    ))}
                  </>
                )}

                {/* Devices */}
                {!loading && section === 'devices' && (
                  <>
                    {devices.length === 0 && <Empty text="No trusted devices" />}
                    {devices.map(dev => (
                      <FeedCard
                        key={dev.id}
                        title={dev.label}
                        description={`Expires ${formatDate(dev.expires_at)}`}
                        category="Device"
                        time={`trusted ${formatDate(dev.trusted_at)}`}
                        action={<InlineBtn label="Revoke" danger onClick={() => revokeDevice(dev.id)} />}
                      />
                    ))}
                  </>
                )}

                {/* Sessions */}
                {!loading && section === 'sessions' && (
                  <>
                    {sessions.length === 0 && <Empty text="No active sessions" />}
                    {sessions.map(sess => (
                      <FeedCard
                        key={sess.id}
                        title={sess.ip_address}
                        description={sess.user_agent.slice(0, 72)}
                        category="Session"
                        time={`active ${formatDate(sess.last_active)}`}
                        action={<InlineBtn label="Revoke" danger onClick={() => revokeSession(sess.id)} />}
                      />
                    ))}
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Bottom nav ── */}
        <BottomNav items={navItems} active={section} onSelect={handleSection} />
      </div>
    </>
  )
}

// ── Utility ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        border: `1.6px solid ${T.border}`,
        borderTopColor: 'rgba(240,240,240,0.3)',
        animation: 'jh-spin 0.75s linear infinite',
      }} />
      <style>{`@keyframes jh-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{
      padding: '48px 0', textAlign: 'center',
      fontSize: 13, color: T.text3,
      fontFamily: "'DM Mono', monospace",
    }}>
      {text}
    </div>
  )
}

function formatDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000)     return 'just now'
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(iso).toLocaleDateString()
}

function riskColor(level: string) {
  if (level === 'critical') return '#f87171'
  if (level === 'high')     return '#fb923c'
  if (level === 'medium')   return '#facc15'
  return 'rgba(240,240,240,0.4)'
}
