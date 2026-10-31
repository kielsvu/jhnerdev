'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

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
const sp = { type: 'spring' as const, bounce: 0, duration: 0.42 }
const spFast = { type: 'spring' as const, bounce: 0, duration: 0.28 }

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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Session check
  useEffect(() => {
    fetch('/api/admin/auth/session')
      .then(r => r.json())
      .then(d => { if (!d.authenticated) window.location.href = '/dev.email/login'; else setSessionInfo(d) })
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

  // Realtime new messages
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
    setDrawerOpen(false)
  }

  if (locked) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '280px' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Session locked
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            Locked due to inactivity.
          </p>
          <button onClick={() => { window.location.href = '/dev.email/login' }} style={primaryBtn}>
            Sign in again
          </button>
        </div>
      </div>
    )
  }

  const navItems: { id: Section; label: string; short: string }[] = [
    { id: 'inbox',    label: 'Inbox',        short: 'Inbox' },
    { id: 'unread',   label: unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread', short: 'Unread' },
    { id: 'archived', label: 'Archived',     short: 'Archive' },
    { id: 'security', label: 'Security log', short: 'Security' },
    { id: 'devices',  label: 'Devices',      short: 'Devices' },
    { id: 'sessions', label: 'Sessions',     short: 'Sessions' },
  ]

  const isMessageSection = section === 'inbox' || section === 'unread' || section === 'archived'

  return (
    <div style={{ height: '100dvh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Mobile drawer backdrop */}
      <AnimatePresence>
        {isMobile && drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spFast}
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop sticky, mobile drawer */}
      <AnimatePresence>
        {(!isMobile || drawerOpen) && (
          <motion.aside
            key="sidebar"
            initial={isMobile ? { x: -280 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -280 } : undefined}
            transition={sp}
            style={{
              position: isMobile ? 'fixed' : 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: isMobile ? 260 : 220,
              zIndex: isMobile ? 50 : 'auto',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(13,13,13,0.85)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRight: '1px solid var(--border)',
              boxShadow: isMobile ? '0 0 0 1px rgba(255,255,255,0.04), 20px 0 60px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            <div style={{ padding: '1.5rem 1.25rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#ffffff', letterSpacing: '0.06em' }}>
                jhner.dev
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '3px' }}>
                Admin
              </p>
            </div>

            <nav style={{ flex: 1, padding: '0.875rem 0.625rem', overflowY: 'auto' }}>
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => changeSection(item.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: section === item.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                    boxShadow: section === item.id ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
                    color: section === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontFamily: "'Syne', sans-serif",
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    marginBottom: '2px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {item.label}
                  {item.id === 'unread' && unreadCount > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: '#3b82f6',
                      color: '#fff',
                      fontSize: '10px',
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '999px',
                      minWidth: '20px',
                      textAlign: 'center',
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div style={{ padding: '0.875rem 0.625rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button onClick={() => logout(false)} style={ghostBtn}>Sign out</button>
              <button onClick={() => logout(true)} style={{ ...ghostBtn, color: '#f87171' }}>Sign out everywhere</button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main shell */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: isMobile ? 0 : '220px',
        overflow: 'hidden',
        height: '100dvh',
      }}>

        {/* Header */}
        <header style={{
          padding: isMobile ? '0 1rem' : '0 1.5rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          background: 'rgba(13,13,13,0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.04)',
        }}>
          {isMobile && (
            <button
              onClick={() => setDrawerOpen(v => !v)}
              aria-label="Open menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '-8px' }}
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <rect width="18" height="1.5" rx="0.75" fill="currentColor"/>
                <rect y="6.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
                <rect y="12.5" width="18" height="1.5" rx="0.75" fill="currentColor"/>
              </svg>
            </button>
          )}

          <h1 style={{ fontSize: '0.9375rem', fontWeight: 600, flex: 1, textTransform: 'capitalize', letterSpacing: '-0.01em' }}>
            {section.replace('-', ' ')}
          </h1>

          {isMessageSection && !isMobile && (
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={e => { setSearch(e.target.value); fetchMessages(section, e.target.value) }}
              style={{ ...inputStyle, width: '200px', padding: '7px 12px', fontSize: '0.875rem' }}
            />
          )}

          {isMessageSection && totalMessages > 0 && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {totalMessages}
            </span>
          )}
        </header>

        {/* Search bar on mobile for message sections */}
        {isMessageSection && isMobile && (
          <div style={{ padding: '8px 1rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <input
              type="search"
              placeholder="Search messages…"
              value={search}
              onChange={e => { setSearch(e.target.value); fetchMessages(section, e.target.value) }}
              style={{ ...inputStyle, width: '100%', padding: '9px 12px', fontSize: '0.9rem' }}
            />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

          {/* Message list */}
          {isMessageSection && (
            <div
              className="custom-scroll"
              style={{
                width: (!isMobile && selected) ? '340px' : '100%',
                minWidth: (!isMobile && selected) ? '240px' : undefined,
                borderRight: (!isMobile && selected) ? '1px solid var(--border)' : 'none',
                overflowY: 'auto',
                flexShrink: 0,
              }}
            >
              {loading && <LoadingState />}
              {!loading && messages.length === 0 && <EmptyState label="No messages" />}
              {messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 1.25rem',
                    background: (!isMobile && selected?.id === msg.id) ? 'rgba(255,255,255,0.04)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                    minHeight: '44px',
                  } as React.CSSProperties}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    {msg.status === 'unread' && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: msg.status === 'unread' ? 600 : 400,
                      color: 'var(--text-primary)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.01em',
                    }}>
                      {msg.name}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.subject}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Message detail — full-screen on mobile, split pane on desktop */}
          <AnimatePresence>
            {selected && isMessageSection && (
              <motion.div
                key={selected.id}
                initial={isMobile ? { x: '100%' } : { opacity: 0 }}
                animate={isMobile ? { x: 0 } : { opacity: 1 }}
                exit={isMobile ? { x: '100%' } : { opacity: 0 }}
                transition={isMobile ? sp : spFast}
                className="custom-scroll"
                style={{
                  position: isMobile ? 'absolute' : 'relative',
                  inset: isMobile ? 0 : undefined,
                  zIndex: isMobile ? 10 : undefined,
                  flex: 1,
                  overflowY: 'auto',
                  padding: isMobile ? '1.25rem 1rem 2rem' : '1.75rem 2rem',
                  background: 'var(--bg-primary)',
                }}
              >
                <div style={{ maxWidth: '640px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <button
                      onClick={() => setSelected(null)}
                      aria-label="Back"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px 10px', fontFamily: "'DM Mono', monospace", fontSize: '11px', whiteSpace: 'nowrap', minHeight: '36px' }}
                    >
                      ← Back
                    </button>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {selected.status !== 'archived' && (
                        <button onClick={() => updateStatus(selected.id, 'archived')} style={chipBtn}>Archive</button>
                      )}
                      {selected.status === 'archived' && (
                        <button onClick={() => updateStatus(selected.id, 'read')} style={chipBtn}>Unarchive</button>
                      )}
                      {selected.status !== 'unread' && (
                        <button onClick={() => updateStatus(selected.id, 'unread')} style={chipBtn}>Mark unread</button>
                      )}
                      <button
                        onClick={() => { if (confirm('Delete this message permanently?')) deleteMessage(selected.id) }}
                        style={{ ...chipBtn, color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <h2 style={{ fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: 600, marginBottom: '6px', letterSpacing: '-0.02em', lineHeight: 1.4 }}>
                    {selected.subject}
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {selected.name}{' '}
                    <a href={`mailto:${selected.email}`} style={{ color: 'var(--text-muted)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                      {selected.email}
                    </a>
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(selected.created_at).toLocaleString()}
                    </span>
                    {selected.risk_level !== 'low' && (
                      <span style={{ padding: '2px 7px', borderRadius: '5px', background: riskBg(selected.risk_level), color: riskColor(selected.risk_level), fontFamily: "'DM Mono', monospace", fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {selected.risk_level}
                      </span>
                    )}
                  </div>

                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    fontSize: '0.9375rem',
                    lineHeight: 1.75,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {selected.message}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security events */}
          {section === 'security' && (
            <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto' }}>
              {loading && <LoadingState />}
              {!loading && events.length === 0 && <EmptyState label="No security events" />}
              {events.map(ev => (
                <div key={ev.id} style={{
                  padding: '14px 1.25rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  opacity: ev.reviewed ? 0.45 : 1,
                  transition: 'opacity 0.2s',
                }}>
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '5px',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: riskBg(ev.severity),
                    color: riskColor(ev.severity),
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    {ev.severity}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                      {ev.description}
                    </p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                      style={{ ...ghostBtn, flexShrink: 0, minHeight: '44px' }}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Devices */}
          {section === 'devices' && (
            <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              {loading && <LoadingState />}
              {!loading && devices.length === 0 && <EmptyState label="No trusted devices" />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '560px' }}>
                {devices.map(dev => (
                  <div key={dev.id} style={card}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '4px', letterSpacing: '-0.01em' }}>{dev.label}</p>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
                        Trusted {formatDate(dev.trusted_at)} · expires {formatDate(dev.expires_at)}
                      </p>
                    </div>
                    <button onClick={() => revokeDevice(dev.id)} style={{ ...ghostBtn, color: '#f87171', flexShrink: 0 }}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sessions */}
          {section === 'sessions' && (
            <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              {loading && <LoadingState />}
              {!loading && sessions.length === 0 && <EmptyState label="No active sessions" />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '560px' }}>
                {sessions.map(sess => (
                  <div key={sess.id} style={card}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                        {sess.user_agent.slice(0, 60)}
                      </p>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
                        {sess.ip_address} · active {formatDate(sess.last_active)}
                      </p>
                    </div>
                    <button onClick={() => revokeSession(sess.id)} style={{ ...ghostBtn, color: '#f87171', flexShrink: 0 }}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'rgba(13,13,13,0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid var(--border)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'stretch',
          zIndex: 30,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {(['inbox', 'unread', 'archived', 'security', 'devices'] as Section[]).map(id => {
            const item = navItems.find(n => n.id === id)!
            const active = section === id || (id === 'devices' && section === 'sessions')
            return (
              <button
                key={id}
                onClick={() => changeSection(id)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'color 0.15s',
                  position: 'relative',
                  minHeight: '44px',
                }}
              >
                {id === 'unread' && unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: 'calc(50% - 16px)',
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: '9px',
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 700,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <TabIcon id={id} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {item.short}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TabIcon({ id }: { id: Section }) {
  const s = { width: 18, height: 18, strokeWidth: 1.5, fill: 'none', stroke: 'currentColor' }
  if (id === 'inbox') return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (id === 'unread') return (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/>
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (id === 'archived') return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (id === 'security') return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function LoadingState() {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '0.06em' }}>
      Loading…
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

function formatDate(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return d.toLocaleDateString()
}

function riskBg(level: string) {
  if (level === 'critical') return 'rgba(239,68,68,0.12)'
  if (level === 'high') return 'rgba(249,115,22,0.12)'
  if (level === 'medium') return 'rgba(234,179,8,0.1)'
  return 'rgba(100,100,100,0.1)'
}

function riskColor(level: string) {
  if (level === 'critical') return '#f87171'
  if (level === 'high') return '#fb923c'
  if (level === 'medium') return '#facc15'
  return 'var(--text-muted)'
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: "'Syne', sans-serif",
  fontSize: '0.9375rem',
}

const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.8125rem',
  color: 'var(--text-secondary)',
  fontFamily: "'Syne', sans-serif",
  padding: '8px 10px',
  borderRadius: '8px',
  transition: 'color 0.15s',
  whiteSpace: 'nowrap',
}

const chipBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '6px 12px',
  fontSize: '0.8125rem',
  color: 'var(--text-secondary)',
  fontFamily: "'Syne', sans-serif",
  cursor: 'pointer',
  transition: 'border-color 0.15s, color 0.15s',
  whiteSpace: 'nowrap',
}

const primaryBtn: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px',
  background: 'var(--text-primary)',
  color: 'var(--bg-primary)',
  border: 'none',
  borderRadius: '10px',
  fontSize: '0.9375rem',
  fontWeight: 600,
  fontFamily: "'Syne', sans-serif",
  cursor: 'pointer',
  letterSpacing: '-0.01em',
}

const card: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem 1.25rem',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  borderRadius: '12px',
}
