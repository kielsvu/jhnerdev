'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Spring config (Apple-style: critically damped, no overshoot) ─────────────
const spring = { type: 'spring', bounce: 0, duration: 0.32 } as const
const springFast = { type: 'spring', bounce: 0, duration: 0.2 } as const

// ─── Icons (inline SVG, no extra dep) ────────────────────────────────────────

function IconInbox({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 10h3.5l1 2h5l1-2H15" /><rect x="1" y="2" width="14" height="12" rx="2" />
    </svg>
  )
}

function IconUnread({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l6 5 6-5" /><rect x="1" y="3" width="14" height="10" rx="1.5" />
    </svg>
  )
}

function IconArchive({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="14" height="3" rx="1" /><path d="M2 5v8a1 1 0 001 1h10a1 1 0 001-1V5" /><path d="M6 9h4" />
    </svg>
  )
}

function IconShield({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2L3 4v4c0 3 2.5 5.5 5 6 2.5-.5 5-3 5-6V4L8 2z" />
    </svg>
  )
}

function IconDevice({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="9" height="11" rx="1.5" /><path d="M5 14h3" /><rect x="11" y="6" width="3" height="5" rx="1" />
    </svg>
  )
}

function IconSessions({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  )
}

function IconClose({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

function IconMenu({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5h12M3 9h12M3 13h12" />
    </svg>
  )
}

function IconBack({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4L6 8l4 4" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function riskBg(level: string) {
  if (level === 'critical') return 'rgba(239,68,68,0.15)'
  if (level === 'high') return 'rgba(249,115,22,0.15)'
  if (level === 'medium') return 'rgba(234,179,8,0.12)'
  return 'rgba(148,163,184,0.1)'
}

function riskColor(level: string) {
  if (level === 'critical') return '#f87171'
  if (level === 'high') return '#fb923c'
  if (level === 'medium') return '#facc15'
  return '#94a3b8'
}

// ─── Style tokens (matches design system output) ──────────────────────────────
// Dark glassmorphism, Fira Sans, dense dashboard layout

const t = {
  bg: '#0F172A',
  bgCard: '#1B2336',
  bgGlass: 'rgba(30,41,59,0.7)',
  border: 'rgba(71,85,105,0.5)',
  borderGlass: 'rgba(255,255,255,0.06)',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  accent: '#22C55E',
  accentDim: 'rgba(34,197,94,0.12)',
  destructive: '#f87171',
  destructiveDim: 'rgba(248,113,113,0.12)',
  fontSans: "'Fira Sans', system-ui, sans-serif",
  fontMono: "'Fira Code', 'Fira Mono', monospace",
} as const

// ─── Shared small components ──────────────────────────────────────────────────

function Badge({ level }: { level: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 7px',
      borderRadius: '5px',
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
      background: riskBg(level),
      color: riskColor(level),
      border: `1px solid ${riskColor(level)}22`,
      fontFamily: t.fontMono,
    }}>
      {level}
    </span>
  )
}

function UnreadDot() {
  return (
    <span style={{
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: t.accent,
      flexShrink: 0,
      boxShadow: `0 0 6px ${t.accent}`,
    }} />
  )
}

function LoadingState() {
  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: t.textMuted, fontSize: '0.8125rem', fontFamily: t.fontMono }}>
      loading…
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: t.textMuted, fontSize: '0.8125rem', fontFamily: t.fontMono }}>
      {label}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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
  const [locked, setLocked] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createSupabaseBrowserClient()

  // Session check
  useEffect(() => {
    fetch('/api/admin/auth/session')
      .then(r => r.json())
      .then(d => { if (!d.authenticated) window.location.href = '/dev.email/login' })
      .catch(() => { window.location.href = '/dev.email/login' })
  }, [])

  // Inactivity lock
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

  // Realtime
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

  const fetchMessages = useCallback(async (activeSection: Section, q = '') => {
    const statusMap: Partial<Record<Section, string>> = { unread: 'unread', archived: 'archived' }
    const params = new URLSearchParams({ limit: '30' })
    if (statusMap[activeSection]) params.set('status', statusMap[activeSection]!)
    if (q) params.set('q', q)
    setLoading(true)
    const [res, unreadRes] = await Promise.all([
      fetch(`/api/admin/messages?${params}`),
      fetch('/api/admin/messages?status=unread&limit=1'),
    ])
    const [data, unreadData] = await Promise.all([res.json(), unreadRes.json()])
    setMessages(data.messages ?? [])
    setTotalMessages(data.total ?? 0)
    setUnreadCount(unreadData.total ?? 0)
    setLoading(false)
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
    if (['inbox', 'unread', 'archived'].includes(section)) {
      fetchMessages(section as Section, search)
    } else if (section === 'security') fetchEvents()
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

  function changeSection(s: Section) {
    setSection(s)
    setSidebarOpen(false)
  }

  // ── Locked screen ──────────────────────────────────────────────────────────

  if (locked) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: t.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: t.fontSans,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: t.bgCard, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <IconShield size={20} />
          </div>
          <p style={{ fontSize: '0.875rem', color: t.textSecondary, marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Session locked due to inactivity.
          </p>
          <button
            onClick={() => (window.location.href = '/dev.email/login')}
            style={fullBtn}
          >
            Sign in again
          </button>
        </div>
      </div>
    )
  }

  // ── Nav items ──────────────────────────────────────────────────────────────

  const navItems: { id: Section; label: string; icon: React.ReactNode; shortLabel: string }[] = [
    { id: 'inbox',    label: 'Inbox',        shortLabel: 'Inbox',    icon: <IconInbox /> },
    { id: 'unread',   label: unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread', shortLabel: 'Unread', icon: <IconUnread /> },
    { id: 'archived', label: 'Archived',     shortLabel: 'Archive',  icon: <IconArchive /> },
    { id: 'security', label: 'Security log', shortLabel: 'Security', icon: <IconShield /> },
    { id: 'devices',  label: 'Devices',      shortLabel: 'Devices',  icon: <IconDevice /> },
    { id: 'sessions', label: 'Sessions',     shortLabel: 'Sessions', icon: <IconSessions /> },
  ]

  const isMessageSection = ['inbox', 'unread', 'archived'].includes(section)

  return (
    <div style={{ minHeight: '100dvh', background: t.bg, display: 'flex', fontFamily: t.fontSans, position: 'relative' }}>

      {/* ── Mobile sidebar overlay ─────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springFast}
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)', zIndex: 40,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={spring}
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 220, zIndex: 50,
          background: t.bgGlass,
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRight: `1px solid ${t.borderGlass}`,
          display: 'flex', flexDirection: 'column',
          padding: '1.25rem 0',
        }}
        // desktop: always show
        className="sidebar-aside"
      >
        <div style={{ padding: '0 1.25rem 1.25rem', borderBottom: `1px solid ${t.borderGlass}` }}>
          <p style={{ fontSize: 10, letterSpacing: '0.14em', color: t.textMuted, textTransform: 'uppercase', fontFamily: t.fontMono }}>
            jhner.dev
          </p>
          <p style={{ fontSize: '0.8125rem', color: t.textSecondary, marginTop: 3 }}>
            Admin
          </p>
        </div>

        <nav style={{ flex: 1, padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => changeSection(item.id)}
              style={{
                ...navBtn,
                background: section === item.id ? 'rgba(34,197,94,0.1)' : 'transparent',
                color: section === item.id ? t.accent : t.textSecondary,
                borderLeft: section === item.id ? `2px solid ${t.accent}` : '2px solid transparent',
              }}
            >
              <span style={{ opacity: section === item.id ? 1 : 0.7 }}>{item.icon}</span>
              <span style={{ fontSize: '0.8125rem' }}>{item.label}</span>
              {item.id === 'unread' && unreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto', background: t.accent, color: t.bg,
                  borderRadius: 99, fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', fontFamily: t.fontMono,
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '0.75rem 0.625rem', borderTop: `1px solid ${t.borderGlass}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onClick={() => logout(false)} style={ghostBtn}>Sign out</button>
          <button onClick={() => logout(true)} style={{ ...ghostBtn, color: t.destructive }}>Sign out everywhere</button>
        </div>
      </motion.aside>

      {/* ── Desktop sidebar (always visible ≥768px) ────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @media (min-width: 768px) {
          .sidebar-aside { position: sticky !important; top: 0 !important; height: 100vh !important; transform: none !important; }
          .mobile-menu-btn { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
          .main-content { margin-left: 0 !important; }
        }
        @media (max-width: 767px) {
          .sidebar-aside { display: flex !important; }
          .detail-mobile-back { display: flex !important; }
        }
        button:focus-visible { outline: 2px solid #22C55E; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100dvh' }}>

        {/* Header */}
        <header style={{
          padding: '0 1.25rem',
          height: 52,
          borderBottom: `1px solid ${t.borderGlass}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: t.bgGlass,
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}>
          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(v => !v)}
            style={{ ...iconBtn, display: 'flex' }}
            aria-label="Open menu"
          >
            <IconMenu />
          </button>

          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, flex: 1, color: t.textPrimary, letterSpacing: '0.01em', textTransform: 'capitalize' }}>
            {section.replace('-', ' ')}
          </h2>

          {isMessageSection && (
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={e => { setSearch(e.target.value); fetchMessages(section, e.target.value) }}
              style={searchInput}
              aria-label="Search messages"
            />
          )}

          {isMessageSection && totalMessages > 0 && (
            <span style={{ fontSize: '0.75rem', color: t.textMuted, fontFamily: t.fontMono, whiteSpace: 'nowrap' }}>
              {totalMessages}
            </span>
          )}
        </header>

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

          {/* ── Message list ──────────────────────────────────────────────── */}
          {isMessageSection && (
            <>
              <AnimatePresence initial={false}>
                <motion.div
                  key="list"
                  // On mobile: hide list when message is selected
                  animate={{ x: selected ? '-100%' : '0%', opacity: selected ? 0 : 1 }}
                  transition={spring}
                  style={{
                    position: 'absolute', inset: 0,
                    overflowY: 'auto',
                    // desktop: side-by-side
                  }}
                  className="message-list-pane"
                >
                  <style>{`
                    @media (min-width: 768px) {
                      .message-list-pane {
                        position: static !important;
                        width: ${selected ? '320px' : '100%'} !important;
                        min-width: 240px !important;
                        border-right: ${selected ? `1px solid ${t.borderGlass}` : 'none'} !important;
                        opacity: 1 !important;
                        transform: none !important;
                        overflow-y: auto !important;
                        flex-shrink: 0;
                      }
                      .message-detail-pane { display: flex !important; }
                      .detail-mobile-back { display: none !important; }
                    }
                    @media (min-width: 768px) {
                      .msg-area { display: flex !important; overflow: hidden !important; position: static !important; }
                    }
                  `}</style>
                  {loading && <LoadingState />}
                  {!loading && messages.length === 0 && <EmptyState label="No messages" />}
                  {messages.map((msg, i) => (
                    <motion.button
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring, delay: Math.min(i * 0.03, 0.18) }}
                      onClick={() => openMessage(msg)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.875rem 1.125rem',
                        background: selected?.id === msg.id ? 'rgba(34,197,94,0.05)' : 'transparent',
                        border: 'none',
                        borderBottom: `1px solid ${t.borderGlass}`,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        display: 'block',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        {msg.status === 'unread' && <UnreadDot />}
                        <span style={{
                          fontSize: '0.8125rem',
                          fontWeight: msg.status === 'unread' ? 600 : 400,
                          color: t.textPrimary,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {msg.name}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: t.textMuted, fontFamily: t.fontMono, whiteSpace: 'nowrap' }}>
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.subject}
                      </p>
                    </motion.button>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* ── Message detail ──────────────────────────────────────── */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    key="detail"
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: '0%', opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={spring}
                    className="message-detail-pane"
                    style={{
                      position: 'absolute', inset: 0,
                      overflowY: 'auto',
                      padding: '1.5rem 1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ maxWidth: 620 }}>
                      {/* Mobile back button */}
                      <button
                        className="detail-mobile-back"
                        onClick={() => setSelected(null)}
                        style={{ ...ghostBtn, display: 'none', alignItems: 'center', gap: 4, marginBottom: '1rem', padding: '6px 0' }}
                      >
                        <IconBack /> Back
                      </button>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '1.25rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4, color: t.textPrimary, lineHeight: 1.4 }}>
                            {selected.subject}
                          </h3>
                          <p style={{ fontSize: '0.8125rem', color: t.textSecondary }}>
                            {selected.name}{' '}
                            <a href={`mailto:${selected.email}`} style={{ color: t.textMuted, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                              {selected.email}
                            </a>
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.6875rem', color: t.textMuted, fontFamily: t.fontMono }}>
                              {new Date(selected.created_at).toLocaleString()}
                            </span>
                            {selected.risk_level !== 'low' && <Badge level={selected.risk_level} />}
                          </div>
                        </div>
                        {/* Close on desktop */}
                        <button
                          onClick={() => setSelected(null)}
                          style={{ ...iconBtn, flexShrink: 0 }}
                          aria-label="Close"
                          className="detail-close-desktop"
                        >
                          <IconClose />
                        </button>
                      </div>

                      <div style={{
                        background: t.bgCard,
                        border: `1px solid ${t.borderGlass}`,
                        borderRadius: 10,
                        padding: '1rem 1.25rem',
                        fontSize: '0.875rem',
                        lineHeight: 1.75,
                        color: t.textPrimary,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        marginBottom: '1rem',
                      }}>
                        {selected.message}
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {selected.status !== 'archived' && (
                          <button onClick={() => updateStatus(selected.id, 'archived')} style={actionBtn}>Archive</button>
                        )}
                        {selected.status === 'archived' && (
                          <button onClick={() => updateStatus(selected.id, 'read')} style={actionBtn}>Unarchive</button>
                        )}
                        {selected.status !== 'unread' && (
                          <button onClick={() => updateStatus(selected.id, 'unread')} style={actionBtn}>Mark unread</button>
                        )}
                        <button
                          onClick={() => { if (confirm('Delete this message permanently?')) deleteMessage(selected.id) }}
                          style={{ ...actionBtn, color: t.destructive, borderColor: 'rgba(248,113,113,0.2)' }}
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

          {/* ── Security events ───────────────────────────────────────────── */}
          {section === 'security' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading && <LoadingState />}
              {!loading && events.length === 0 && <EmptyState label="No security events" />}
              {events.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: ev.reviewed ? 0.45 : 1, y: 0 }}
                  transition={{ ...spring, delay: Math.min(i * 0.025, 0.15) }}
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderBottom: `1px solid ${t.borderGlass}`,
                    display: 'flex',
                    gap: '0.875rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <Badge level={ev.severity} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', color: t.textPrimary, marginBottom: 3, lineHeight: 1.5 }}>
                      {ev.description}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: t.textMuted, fontFamily: t.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.event_type} · {ev.ip_address} · {formatDate(ev.created_at)}
                    </p>
                  </div>
                  {!ev.reviewed && (
                    <button
                      onClick={async () => {
                        await fetch('/api/admin/security-events', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: ev.id }),
                        })
                        setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, reviewed: true } : e))
                      }}
                      style={ghostBtn}
                    >
                      Dismiss
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* ── Devices ───────────────────────────────────────────────────── */}
          {section === 'devices' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              {loading && <LoadingState />}
              {!loading && devices.length === 0 && <EmptyState label="No trusted devices" />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560 }}>
                {devices.map((dev, i) => (
                  <motion.div
                    key={dev.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: Math.min(i * 0.04, 0.16) }}
                    style={card}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 500, marginBottom: 3, color: t.textPrimary }}>{dev.label}</p>
                      <p style={{ fontSize: '0.6875rem', color: t.textMuted, fontFamily: t.fontMono }}>
                        trusted {formatDate(dev.trusted_at)} · expires {formatDate(dev.expires_at)}
                      </p>
                    </div>
                    <button onClick={() => revokeDevice(dev.id)} style={{ ...ghostBtn, color: t.destructive }}>Revoke</button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sessions ──────────────────────────────────────────────────── */}
          {section === 'sessions' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              {loading && <LoadingState />}
              {!loading && sessions.length === 0 && <EmptyState label="No active sessions" />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560 }}>
                {sessions.map((sess, i) => (
                  <motion.div
                    key={sess.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: Math.min(i * 0.04, 0.16) }}
                    style={card}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8125rem', color: t.textSecondary, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sess.user_agent.slice(0, 60)}
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: t.textMuted, fontFamily: t.fontMono }}>
                        {sess.ip_address} · active {formatDate(sess.last_active)}
                      </p>
                    </div>
                    <button onClick={() => revokeSession(sess.id)} style={{ ...ghostBtn, color: t.destructive }}>Revoke</button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
        <nav
          className="mobile-bottom-nav"
          style={{
            display: 'flex',
            borderTop: `1px solid ${t.borderGlass}`,
            background: t.bgGlass,
            backdropFilter: 'blur(20px)',
            position: 'sticky',
            bottom: 0,
            zIndex: 20,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => changeSection(item.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '10px 4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: section === item.id ? t.accent : t.textMuted,
                fontFamily: t.fontSans,
                position: 'relative',
              }}
              aria-label={item.label}
            >
              {section === item.id && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  style={{
                    position: 'absolute', top: 0, left: '15%', right: '15%',
                    height: 2, borderRadius: 1, background: t.accent,
                  }}
                  transition={spring}
                />
              )}
              {item.icon}
              <span style={{ fontSize: 9, fontWeight: section === item.id ? 600 : 400, letterSpacing: '0.02em' }}>
                {item.shortLabel}
              </span>
              {item.id === 'unread' && unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: '18%',
                  background: t.accent, color: t.bg,
                  borderRadius: 99, fontSize: 8, fontWeight: 700,
                  padding: '1px 4px', fontFamily: t.fontMono, lineHeight: 1.4,
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </main>
    </div>
  )
}

// ─── Style objects ────────────────────────────────────────────────────────────

const navBtn: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '7px 10px',
  borderRadius: 7,
  border: 'none',
  cursor: 'pointer',
  fontFamily: "'Fira Sans', system-ui, sans-serif",
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
}

const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.75rem',
  color: '#94a3b8',
  fontFamily: "'Fira Sans', system-ui, sans-serif",
  padding: '4px 8px',
  borderRadius: 5,
  transition: 'color 0.15s',
  whiteSpace: 'nowrap',
}

const actionBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid rgba(71,85,105,0.5)',
  borderRadius: 6,
  padding: '5px 12px',
  fontSize: '0.75rem',
  color: '#CBD5E1',
  fontFamily: "'Fira Sans', system-ui, sans-serif",
  cursor: 'pointer',
  transition: 'border-color 0.15s, color 0.15s',
}

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#94a3b8',
  padding: 6,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.15s',
}

const searchInput: React.CSSProperties = {
  background: 'rgba(30,41,59,0.8)',
  border: '1px solid rgba(71,85,105,0.4)',
  borderRadius: 7,
  color: '#F8FAFC',
  outline: 'none',
  fontFamily: "'Fira Sans', system-ui, sans-serif",
  padding: '5px 10px',
  fontSize: '0.8125rem',
  width: 180,
  maxWidth: '40vw',
}

const fullBtn: React.CSSProperties = {
  display: 'block',
  width: '100%',
  maxWidth: 200,
  margin: '0 auto',
  padding: '10px',
  background: '#22C55E',
  color: '#0F172A',
  border: 'none',
  borderRadius: 8,
  fontSize: '0.875rem',
  fontWeight: 600,
  fontFamily: "'Fira Sans', system-ui, sans-serif",
  cursor: 'pointer',
}

const card: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.875rem',
  padding: '0.875rem 1rem',
  background: 'rgba(27,35,54,0.8)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  backdropFilter: 'blur(10px)',
}
