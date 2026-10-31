'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// ── Types (unchanged) ─────────────────────────────────────────────────────────

type Message = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'archived'
  risk_level: string
  created_at: string
}

type SecurityEvent = {
  id: string
  event_type: string
  severity: string
  ip_address: string
  description: string
  created_at: string
  reviewed: boolean
}

type TrustedDevice = {
  id: string
  label: string
  trusted_at: string
  expires_at: string
}

type ActiveSession = {
  id: string
  ip_address: string
  user_agent: string
  created_at: string
  last_active: string
  expires_at: string
}

type Section = 'inbox' | 'unread' | 'archived' | 'security' | 'devices' | 'sessions'

const INACTIVITY_TIMEOUT = 10 * 60 * 1000

// ── Spring configs ────────────────────────────────────────────────────────────

const springDefault = { type: 'spring' as const, damping: 24, stiffness: 280, mass: 0.8 }
const springDrawer  = { type: 'spring' as const, damping: 28, stiffness: 320, mass: 0.7 }

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IconInbox({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 6h12v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      <path d="M2 6 5.5 3h5L14 6" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      <path d="M2 9.5h3.5a2.5 2.5 0 0 0 5 0H14" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
    </svg>
  )
}

function IconMail({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M1.5 5.5 8 9l6.5-3.5" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
    </svg>
  )
}

function IconArchive({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M2.5 5.5h11v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V5.5Z" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M6 9.5h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  )
}

function IconShield({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5 2.5 3.5V8c0 3 2.5 5.5 5.5 6 3-.5 5.5-3 5.5-6V3.5L8 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
    </svg>
  )
}

function IconDevice({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M1 7.5h10" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M4 13h8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      <rect x="12" y="6" width="3" height="4.5" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
    </svg>
  )
}

function IconActivity({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M1 8h2.5L5.5 4l3 8 2-4H15" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconLogout({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M6 2.5H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      <path d="M10.5 5 14 8l-3.5 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 8H6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  )
}

function IconMenu({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconX({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M4 4 14 14M14 4 4 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function IconChevronLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconLock({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <rect x="5" y="13" width="20" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M9.5 13V9a5.5 5.5 0 0 1 11 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="15" cy="20.5" r="1.8" fill="currentColor"/>
    </svg>
  )
}

// ── Initials avatar ───────────────────────────────────────────────────────────

function Initials({ name }: { name: string }) {
  const letters = name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase()
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue}, 40%, 18%)`,
      border: `1px solid hsl(${hue}, 35%, 30%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '10px', fontWeight: 600,
      color: `hsl(${hue}, 55%, 72%)`,
      letterSpacing: '0.03em',
    }}>
      {letters}
    </div>
  )
}

// ── Sidebar content ───────────────────────────────────────────────────────────

type NavItem = { id: Section; label: string; icon: React.ReactNode; count?: number }

function SidebarContent({
  navItems,
  section,
  onSection,
  onLogout,
}: {
  navItems: NavItem[]
  section: Section
  onSection: (s: Section) => void
  onLogout: (all?: boolean) => void
}) {
  return (
    <>
      <div style={{ padding: '0 1.125rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <p style={{
          fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--text-muted)', fontWeight: 600,
        }}>
          jhner.dev
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Admin
        </p>
      </div>

      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {navItems.map(item => {
          const active = section === item.id
          return (
            <button
              key={item.id}
              className="dash-nav-btn"
              onClick={() => onSection(item.id)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '7px 10px', borderRadius: '7px',
                border: 'none',
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.875rem', fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '9px',
                letterSpacing: '-0.005em',
              }}
            >
              <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0, display: 'flex' }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span style={{
                  fontSize: '10px', fontWeight: 600,
                  background: '#3b82f6', color: '#fff',
                  borderRadius: '10px', padding: '1px 6px',
                  minWidth: '18px', textAlign: 'center', letterSpacing: 0,
                }}>
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <button
          className="dash-ghost-btn"
          onClick={() => onLogout(false)}
          style={{
            ...ghostButtonStyle,
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 10px', borderRadius: '7px',
            width: '100%', textAlign: 'left',
          }}
        >
          <IconLogout size={14} />
          Sign out
        </button>
        <button
          className="dash-ghost-btn"
          onClick={() => onLogout(true)}
          style={{
            ...ghostButtonStyle,
            color: '#f87171',
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 10px', borderRadius: '7px',
            width: '100%', textAlign: 'left',
          }}
        >
          <IconLogout size={14} />
          Sign out everywhere
        </button>
      </div>
    </>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [section, setSection] = useState<Section>('inbox')
  const [messages, setMessages] = useState<Message[]>([])
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [devices, setDevices] = useState<TrustedDevice[]>([])
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [totalMessages, setTotalMessages] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [sessionInfo, setSessionInfo] = useState<{ last_active?: string; expires_at?: string } | null>(null)
  const [locked, setLocked] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createSupabaseBrowserClient()

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
      if (!e.matches) setSidebarOpen(false)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleSectionChange = useCallback((s: Section) => {
    setSection(s)
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  // Session fetch (unchanged)
  useEffect(() => {
    fetch('/api/admin/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) window.location.href = '/dev.email/login'
        else setSessionInfo(d)
      })
      .catch(() => { window.location.href = '/dev.email/login' })
  }, [])

  // Inactivity lock (unchanged)
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

  // Realtime (unchanged)
  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, () => {
        setUnreadCount(c => c + 1)
        if (section === 'inbox' || section === 'unread') fetchMessages(section)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [section]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetchers (unchanged)
  const fetchMessages = useCallback(async (activeSection: Section, q = '') => {
    const statusMap: Partial<Record<Section, string>> = {
      unread: 'unread',
      archived: 'archived',
    }
    const statusParam = statusMap[activeSection]
    const params = new URLSearchParams({ limit: '30' })
    if (statusParam) params.set('status', statusParam)
    if (q) params.set('q', q)

    setLoading(true)
    const res = await fetch(`/api/admin/messages?${params}`)
    const data = await res.json()
    setMessages(data.messages ?? [])
    setTotalMessages(data.total ?? 0)
    setLoading(false)

    const unreadRes = await fetch('/api/admin/messages?status=unread&limit=1')
    const unreadData = await unreadRes.json()
    setUnreadCount(unreadData.total ?? 0)
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
    if (section === 'inbox' || section === 'unread' || section === 'archived') {
      fetchMessages(section, search)
    } else if (section === 'security') {
      fetchEvents()
    } else if (section === 'devices') {
      fetchDevices()
    } else if (section === 'sessions') {
      fetchSessions()
    }
  }, [section]) // eslint-disable-line react-hooks/exhaustive-deps

  // Actions (unchanged)
  async function openMessage(msg: Message) {
    setSelected(msg)
    if (msg.status !== 'unread') return
    await fetch(`/api/admin/messages/${msg.id}`)
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  async function updateStatus(id: string, status: Message['status']) {
    await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all }),
    })
    window.location.href = '/dev.email/login'
  }

  // ── Locked screen ─────────────────────────────────────────────────────────

  if (locked) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={springDefault}
          style={{
            textAlign: 'center', maxWidth: '300px', width: '100%',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '2.5rem 2rem',
          }}
        >
          <div style={{ color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <IconLock size={30} />
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.55 }}>
            Session locked due to inactivity.
          </p>
          <button
            className="dash-primary-btn"
            onClick={() => window.location.href = '/dev.email/login'}
            style={{ ...fullButtonStyle, maxWidth: '200px', margin: '0 auto' }}
          >
            Sign in again
          </button>
        </motion.div>
      </div>
    )
  }

  const navItems: NavItem[] = [
    { id: 'inbox',    label: 'Inbox',        icon: <IconInbox /> },
    { id: 'unread',   label: 'Unread',       icon: <IconMail />,     count: unreadCount > 0 ? unreadCount : undefined },
    { id: 'archived', label: 'Archived',     icon: <IconArchive /> },
    { id: 'security', label: 'Security log', icon: <IconShield /> },
    { id: 'devices',  label: 'Devices',      icon: <IconDevice /> },
    { id: 'sessions', label: 'Sessions',     icon: <IconActivity /> },
  ]

  const sectionLabel    = navItems.find(n => n.id === section)?.label ?? section
  const isMessages      = section === 'inbox' || section === 'unread' || section === 'archived'
  const mobileDetailMode = isMobile && selected !== null

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        @keyframes dash-spin { to { transform: rotate(360deg); } }

        @media (hover: hover) {
          .dash-nav-btn:hover    { background: rgba(255,255,255,0.07) !important; color: var(--text-primary) !important; }
          .dash-msg-row:hover    { background: rgba(255,255,255,0.04) !important; }
          .dash-action-btn:hover { border-color: rgba(255,255,255,0.22) !important; color: var(--text-primary) !important; }
          .dash-ghost-btn:hover  { background: rgba(255,255,255,0.06) !important; color: var(--text-primary) !important; }
          .dash-revoke-btn:hover { color: #fca5a5 !important; }
          .dash-icon-btn:hover   { background: rgba(255,255,255,0.09) !important; }
          .dash-primary-btn:hover { opacity: 0.85 !important; }
        }

        .dash-nav-btn:active     { transform: scale(0.97); }
        .dash-action-btn:active  { transform: scale(0.97); }
        .dash-ghost-btn:active   { transform: scale(0.96); }
        .dash-icon-btn:active    { transform: scale(0.91); }
        .dash-primary-btn:active { transform: scale(0.98); opacity: 0.88; }
        .dash-msg-row:active     { transform: scale(0.99); }

        .dash-nav-btn     { transition: background 0.14s, color 0.14s, transform 0.1s; }
        .dash-action-btn  { transition: border-color 0.14s, color 0.14s, transform 0.1s; }
        .dash-ghost-btn   { transition: color 0.14s, background 0.14s, transform 0.1s; }
        .dash-icon-btn    { transition: background 0.14s, transform 0.1s; }
        .dash-primary-btn { transition: opacity 0.14s, transform 0.1s; }
        .dash-msg-row     { transition: background 0.1s, transform 0.1s; }
        .dash-revoke-btn  { transition: color 0.14s; }

        .dash-search::placeholder           { color: var(--text-muted); }
        .dash-search:focus                  { outline: none; border-color: rgba(255,255,255,0.2) !important; }
        .dash-search::-webkit-search-cancel-button { display: none; }

        .dash-hamburger { display: none !important; }
        @media (max-width: 767px) {
          .dash-hamburger        { display: flex !important; }
          .dash-sidebar-desktop  { display: none !important; }
          .dash-search           { width: 130px !important; font-size: 0.8125rem !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          .dash-nav-btn, .dash-action-btn, .dash-ghost-btn,
          .dash-icon-btn, .dash-primary-btn, .dash-msg-row,
          .dash-revoke-btn { transition: none !important; }
        }
      `}</style>

      <div style={{
        minHeight: '100vh', background: 'var(--bg-primary)',
        display: 'flex', position: 'relative', overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      }}>

        {/* ── Mobile backdrop ── */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
              }}
            />
          )}
        </AnimatePresence>

        {/* ── Desktop sidebar ── */}
        <aside
          className="dash-sidebar-desktop"
          style={{
            width: '220px', minWidth: '220px',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            padding: '1.5rem 0',
            position: 'sticky', top: 0, height: '100vh',
            background: 'var(--bg-primary)',
          }}
        >
          <SidebarContent
            navItems={navItems}
            section={section}
            onSection={handleSectionChange}
            onLogout={logout}
          />
        </aside>

        {/* ── Mobile sidebar ── */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={springDrawer}
              style={{
                position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50,
                width: '256px',
                borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                padding: '1.5rem 0',
                background: 'rgba(12, 12, 16, 0.92)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              }}
            >
              <SidebarContent
                navItems={navItems}
                section={section}
                onSection={handleSectionChange}
                onLogout={logout}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <header style={{
            padding: '0 1.125rem', height: '50px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            position: 'sticky', top: 0, zIndex: 30,
            background: 'var(--bg-primary)', flexShrink: 0,
          }}>
            {mobileDetailMode ? (
              <button
                className="dash-ghost-btn"
                onClick={() => setSelected(null)}
                style={{
                  ...ghostButtonStyle,
                  display: 'flex', alignItems: 'center', gap: '3px',
                  padding: '5px 8px 5px 4px', marginLeft: '-4px',
                }}
              >
                <IconChevronLeft size={16} />
                <span style={{ fontSize: '0.875rem' }}>Back</span>
              </button>
            ) : (
              <button
                className="dash-icon-btn dash-hamburger"
                onClick={() => setSidebarOpen(v => !v)}
                aria-label="Toggle navigation"
                style={{
                  display: 'none',
                  alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: '7px',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-secondary)', padding: 0,
                }}
              >
                {sidebarOpen ? <IconX size={18} /> : <IconMenu size={18} />}
              </button>
            )}

            <h2 style={{
              fontSize: '0.9375rem', fontWeight: 600, flex: 1,
              letterSpacing: '-0.012em', color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {mobileDetailMode && selected ? selected.subject : sectionLabel}
            </h2>

            {isMessages && !mobileDetailMode && (
              <input
                type="search"
                placeholder="Search…"
                value={search}
                onChange={e => { setSearch(e.target.value); fetchMessages(section, e.target.value) }}
                className="dash-search"
                style={{
                  ...inputStyle,
                  width: '200px', padding: '6px 11px',
                  fontSize: '0.875rem', borderRadius: '8px',
                }}
              />
            )}

            {totalMessages > 0 && isMessages && !mobileDetailMode && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {totalMessages}
              </span>
            )}
          </header>

          {/* Content */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.12, ease: 'easeIn' } }}
                transition={springDefault}
                style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}
              >

                {/* ── Messages ── */}
                {isMessages && (
                  <>
                    {/* List pane */}
                    <div style={{
                      width: selected && !isMobile ? '320px' : '100%',
                      minWidth: selected && !isMobile ? '240px' : undefined,
                      borderRight: selected && !isMobile ? '1px solid var(--border)' : 'none',
                      overflowY: 'auto', flexShrink: 0,
                      display: mobileDetailMode ? 'none' : 'block',
                    }}>
                      {loading && <LoadingState />}
                      {!loading && messages.length === 0 && <EmptyState label="No messages" />}
                      {messages.map(msg => (
                        <button
                          key={msg.id}
                          className="dash-msg-row"
                          onClick={() => openMessage(msg)}
                          style={{
                            width: '100%', textAlign: 'left',
                            padding: '0.875rem 1rem',
                            background: selected?.id === msg.id ? 'var(--bg-card)' : 'transparent',
                            border: 'none', borderBottom: '1px solid var(--border)',
                            cursor: 'pointer', display: 'block',
                          } as React.CSSProperties}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Initials name={msg.name} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                {msg.status === 'unread' && (
                                  <span style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: '#3b82f6', flexShrink: 0,
                                  }} />
                                )}
                                <span style={{
                                  fontSize: '0.875rem',
                                  fontWeight: msg.status === 'unread' ? 600 : 400,
                                  color: 'var(--text-primary)', flex: 1,
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  letterSpacing: '-0.005em',
                                }}>
                                  {msg.name}
                                </span>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                  {formatDate(msg.created_at)}
                                </span>
                              </div>
                              <p style={{
                                fontSize: '0.8125rem', color: 'var(--text-secondary)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                lineHeight: 1.4, margin: 0,
                              }}>
                                {msg.subject}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Detail pane */}
                    <AnimatePresence>
                      {selected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.16 }}
                          style={{
                            flex: 1, overflowY: 'auto',
                            padding: isMobile ? '1.25rem 1rem 2rem' : '1.75rem 2rem',
                            display: mobileDetailMode || !isMobile ? 'block' : 'none',
                          }}
                        >
                          <div style={{ maxWidth: '640px' }}>
                            {!isMobile && (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ flex: 1 }}>
                                  <h3 style={{
                                    fontSize: '1.0625rem', fontWeight: 600,
                                    marginBottom: '5px', letterSpacing: '-0.015em',
                                    color: 'var(--text-primary)', lineHeight: 1.3,
                                  }}>
                                    {selected.subject}
                                  </h3>
                                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                                    {selected.name} &middot;{' '}
                                    <a href={`mailto:${selected.email}`} style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                                      {selected.email}
                                    </a>
                                  </p>
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {new Date(selected.created_at).toLocaleString()}
                                    {selected.risk_level !== 'low' && (
                                      <span style={{
                                        marginLeft: '8px', padding: '2px 6px', borderRadius: '4px',
                                        background: riskBg(selected.risk_level),
                                        color: riskColor(selected.risk_level), fontSize: '11px',
                                      }}>
                                        {selected.risk_level} risk
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <button className="dash-ghost-btn" onClick={() => setSelected(null)} style={ghostButtonStyle}>
                                  Close
                                </button>
                              </div>
                            )}

                            {isMobile && (
                              <div style={{ marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '3px' }}>
                                  {selected.name} &middot;{' '}
                                  <a href={`mailto:${selected.email}`} style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                                    {selected.email}
                                  </a>
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {new Date(selected.created_at).toLocaleString()}
                                  {selected.risk_level !== 'low' && (
                                    <span style={{
                                      marginLeft: '8px', padding: '2px 6px', borderRadius: '4px',
                                      background: riskBg(selected.risk_level),
                                      color: riskColor(selected.risk_level), fontSize: '11px',
                                    }}>
                                      {selected.risk_level} risk
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}

                            <div style={{
                              background: 'var(--bg-card)', border: '1px solid var(--border)',
                              borderRadius: '10px', padding: '1.25rem 1.5rem',
                              fontSize: '0.9375rem', lineHeight: 1.7,
                              color: 'var(--text-primary)',
                              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                              marginBottom: '1rem',
                            }}>
                              {selected.message}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {selected.status !== 'archived' && (
                                <button
                                  className="dash-action-btn"
                                  onClick={() => updateStatus(selected.id, 'archived')}
                                  style={actionButtonStyle}
                                >
                                  Archive
                                </button>
                              )}
                              {selected.status === 'archived' && (
                                <button
                                  className="dash-action-btn"
                                  onClick={() => updateStatus(selected.id, 'read')}
                                  style={actionButtonStyle}
                                >
                                  Unarchive
                                </button>
                              )}
                              {selected.status !== 'unread' && (
                                <button
                                  className="dash-action-btn"
                                  onClick={() => updateStatus(selected.id, 'unread')}
                                  style={actionButtonStyle}
                                >
                                  Mark unread
                                </button>
                              )}
                              <button
                                className="dash-action-btn"
                                onClick={() => {
                                  if (confirm('Delete this message permanently?')) deleteMessage(selected.id)
                                }}
                                style={{ ...actionButtonStyle, color: '#f87171', borderColor: 'rgba(248,113,113,0.25)' }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* ── Security events ── */}
                {section === 'security' && (
                  <div style={{ flex: 1, overflowY: 'auto', width: '100%' }}>
                    {loading && <LoadingState />}
                    {!loading && events.length === 0 && <EmptyState label="No security events" />}
                    {events.map(ev => (
                      <div key={ev.id} style={{
                        padding: '0.875rem 1.125rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
                        opacity: ev.reviewed ? 0.4 : 1,
                      }}>
                        <span style={{
                          padding: '2px 7px', borderRadius: '4px',
                          fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
                          textTransform: 'uppercase' as const,
                          background: riskBg(ev.severity), color: riskColor(ev.severity),
                          flexShrink: 0, marginTop: '2px',
                        }}>
                          {ev.severity}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '3px', lineHeight: 1.45 }}>
                            {ev.description}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {ev.event_type} &middot; {ev.ip_address} &middot; {formatDate(ev.created_at)}
                          </p>
                        </div>
                        {!ev.reviewed && (
                          <button
                            className="dash-ghost-btn"
                            onClick={async () => {
                              await fetch('/api/admin/security-events', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: ev.id }),
                              })
                              setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, reviewed: true } : e))
                            }}
                            style={ghostButtonStyle}
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Trusted devices ── */}
                {section === 'devices' && (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.125rem', width: '100%' }}>
                    {loading && <LoadingState />}
                    {!loading && devices.length === 0 && <EmptyState label="No trusted devices" />}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxWidth: '560px' }}>
                      {devices.map(dev => (
                        <div key={dev.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.875rem',
                          padding: '0.875rem 1rem',
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: '10px',
                        }}>
                          <span style={{ color: 'var(--text-muted)', flexShrink: 0, display: 'flex' }}>
                            <IconDevice size={15} />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '3px', letterSpacing: '-0.005em' }}>
                              {dev.label}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Trusted {formatDate(dev.trusted_at)} &middot; expires {formatDate(dev.expires_at)}
                            </p>
                          </div>
                          <button
                            className="dash-ghost-btn dash-revoke-btn"
                            onClick={() => revokeDevice(dev.id)}
                            style={{ ...ghostButtonStyle, color: '#f87171' }}
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Active sessions ── */}
                {section === 'sessions' && (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.125rem', width: '100%' }}>
                    {loading && <LoadingState />}
                    {!loading && sessions.length === 0 && <EmptyState label="No active sessions" />}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxWidth: '560px' }}>
                      {sessions.map(sess => (
                        <div key={sess.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.875rem',
                          padding: '0.875rem 1rem',
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: '10px',
                        }}>
                          <span style={{ color: 'var(--text-muted)', flexShrink: 0, display: 'flex' }}>
                            <IconActivity size={15} />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '3px',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {sess.user_agent.slice(0, 60)}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {sess.ip_address} &middot; active {formatDate(sess.last_active)}
                            </p>
                          </div>
                          <button
                            className="dash-ghost-btn dash-revoke-btn"
                            onClick={() => revokeSession(sess.id)}
                            style={{ ...ghostButtonStyle, color: '#f87171' }}
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </>
  )
}

// ── Utility components ────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%',
        border: '1.5px solid var(--border)', borderTopColor: 'var(--text-muted)',
        margin: '0 auto 10px',
        animation: 'dash-spin 0.75s linear infinite',
      }} />
      Loading
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      {label}
    </div>
  )
}

// ── Helpers (unchanged) ───────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return d.toLocaleDateString()
}

function riskBg(level: string) {
  if (level === 'critical') return 'rgba(239,68,68,0.12)'
  if (level === 'high')     return 'rgba(249,115,22,0.12)'
  if (level === 'medium')   return 'rgba(234,179,8,0.1)'
  return 'rgba(100,100,100,0.1)'
}

function riskColor(level: string) {
  if (level === 'critical') return '#f87171'
  if (level === 'high')     return '#fb923c'
  if (level === 'medium')   return '#facc15'
  return 'var(--text-muted)'
}

// ── Style objects ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'inherit',
  padding: '10px 12px',
  fontSize: '0.9375rem',
}

const ghostButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.8125rem',
  color: 'var(--text-secondary)',
  fontFamily: 'inherit',
  padding: '4px 8px',
  borderRadius: '6px',
  whiteSpace: 'nowrap',
}

const actionButtonStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '7px',
  padding: '6px 12px',
  fontSize: '0.8125rem',
  color: 'var(--text-secondary)',
  fontFamily: 'inherit',
  cursor: 'pointer',
}

const fullButtonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '11px',
  background: 'var(--text-primary)',
  color: 'var(--bg-primary)',
  border: 'none',
  borderRadius: '9px',
  fontSize: '0.9375rem',
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
}
