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
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createSupabaseBrowserClient()

  // Session fetch
  useEffect(() => {
    fetch('/api/admin/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) window.location.href = '/dev.email/login'
        else setSessionInfo(d)
      })
      .catch(() => { window.location.href = '/dev.email/login' })
  }, [])

  // Inactivity lock
  const resetInactivity = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => setLocked(true), INACTIVITY_TIMEOUT)
  }, [])

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll']
    events.forEach(e => window.addEventListener(e, resetInactivity, { passive: true }))
    resetInactivity()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivity))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [resetInactivity])

  // Supabase Realtime for new messages
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

    // Keep unread count fresh
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

  if (locked) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '280px' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Session locked due to inactivity.
          </p>
          <button
            onClick={() => window.location.href = '/dev.email/login'}
            style={{ ...fullButtonStyle, maxWidth: '200px', margin: '0 auto' }}
          >
            Sign in again
          </button>
        </div>
      </div>
    )
  }

  const navItems: { id: Section; label: string }[] = [
    { id: 'inbox', label: 'Inbox' },
    { id: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { id: 'archived', label: 'Archived' },
    { id: 'security', label: 'Security log' },
    { id: 'devices', label: 'Devices' },
    { id: 'sessions', label: 'Sessions' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '220px',
          minWidth: '220px',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 0',
          position: 'sticky',
          top: 0,
          height: '100vh',
          background: 'var(--bg-primary)',
        }}
      >
        <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            jhner.dev
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Admin
          </p>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: section === item.id ? 'var(--bg-card)' : 'transparent',
                color: section === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button onClick={() => logout(false)} style={ghostButtonStyle}>
            Sign out
          </button>
          <button onClick={() => logout(true)} style={{ ...ghostButtonStyle, color: '#f87171' }}>
            Sign out everywhere
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, flex: 1, textTransform: 'capitalize' }}>
            {section.replace('-', ' ')}
          </h2>

          {(section === 'inbox' || section === 'unread' || section === 'archived') && (
            <div style={{ position: 'relative' }}>
              <input
                type="search"
                placeholder="Search messages…"
                value={search}
                onChange={e => { setSearch(e.target.value); fetchMessages(section, e.target.value) }}
                style={{
                  ...inputStyle,
                  width: '220px',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          )}

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {totalMessages > 0 && (section === 'inbox' || section === 'unread' || section === 'archived')
              ? `${totalMessages} total`
              : null}
          </p>
        </header>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Message list pane */}
          {(section === 'inbox' || section === 'unread' || section === 'archived') && (
            <>
              <div style={{
                width: selected ? '340px' : '100%',
                minWidth: '240px',
                borderRight: selected ? '1px solid var(--border)' : 'none',
                overflowY: 'auto',
              }}>
                {loading && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Loading…
                  </div>
                )}
                {!loading && messages.length === 0 && (
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No messages
                  </div>
                )}
                {messages.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => openMessage(msg)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '1rem 1.25rem',
                      background: selected?.id === msg.id ? 'var(--bg-card)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    } as React.CSSProperties}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {msg.status === 'unread' && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '0.875rem', fontWeight: msg.status === 'unread' ? 600 : 400, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.subject}
                    </p>
                  </button>
                ))}
              </div>

              {/* Message detail pane */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}
                  >
                    <div style={{ maxWidth: '640px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '4px' }}>
                            {selected.subject}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {selected.name} &middot; <a href={`mailto:${selected.email}`} style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px' }}>{selected.email}</a>
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {new Date(selected.created_at).toLocaleString()}
                            {selected.risk_level !== 'low' && (
                              <span style={{ marginLeft: '8px', padding: '2px 6px', borderRadius: '4px', background: riskBg(selected.risk_level), color: riskColor(selected.risk_level), fontSize: '11px' }}>
                                {selected.risk_level} risk
                              </span>
                            )}
                          </p>
                        </div>
                        <button onClick={() => setSelected(null)} style={ghostButtonStyle}>Close</button>
                      </div>

                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '1.25rem 1.5rem',
                        fontSize: '0.9375rem',
                        lineHeight: 1.7,
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        marginBottom: '1rem',
                      }}>
                        {selected.message}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {selected.status !== 'archived' && (
                          <button onClick={() => updateStatus(selected.id, 'archived')} style={actionButtonStyle}>
                            Archive
                          </button>
                        )}
                        {selected.status === 'archived' && (
                          <button onClick={() => updateStatus(selected.id, 'read')} style={actionButtonStyle}>
                            Unarchive
                          </button>
                        )}
                        {selected.status !== 'unread' && (
                          <button onClick={() => updateStatus(selected.id, 'unread')} style={actionButtonStyle}>
                            Mark unread
                          </button>
                        )}
                        <button
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

          {/* Security events */}
          {section === 'security' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading && <LoadingState />}
              {!loading && events.length === 0 && <EmptyState label="No security events" />}
              {events.map(ev => (
                <div key={ev.id} style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  opacity: ev.reviewed ? 0.5 : 1,
                }}>
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: riskBg(ev.severity),
                    color: riskColor(ev.severity),
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    {ev.severity}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '3px' }}>
                      {ev.description}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ev.event_type} &middot; {ev.ip_address} &middot; {formatDate(ev.created_at)}
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
                      style={ghostButtonStyle}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Trusted devices */}
          {section === 'devices' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {loading && <LoadingState />}
              {!loading && devices.length === 0 && <EmptyState label="No trusted devices" />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '560px' }}>
                {devices.map(dev => (
                  <div key={dev.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '3px' }}>{dev.label}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Trusted {formatDate(dev.trusted_at)} &middot; expires {formatDate(dev.expires_at)}
                      </p>
                    </div>
                    <button onClick={() => revokeDevice(dev.id)} style={{ ...ghostButtonStyle, color: '#f87171' }}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active sessions */}
          {section === 'sessions' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {loading && <LoadingState />}
              {!loading && sessions.length === 0 && <EmptyState label="No active sessions" />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '560px' }}>
                {sessions.map(sess => (
                  <div key={sess.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sess.user_agent.slice(0, 60)}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {sess.ip_address} &middot; active {formatDate(sess.last_active)}
                      </p>
                    </div>
                    <button onClick={() => revokeSession(sess.id)} style={{ ...ghostButtonStyle, color: '#f87171' }}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      Loading…
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      {label}
    </div>
  )
}

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
  padding: '4px 6px',
  borderRadius: '4px',
  transition: 'color 0.15s',
  whiteSpace: 'nowrap',
}

const actionButtonStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '0.8125rem',
  color: 'var(--text-secondary)',
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'border-color 0.15s, color 0.15s',
}

const fullButtonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '11px',
  background: 'var(--text-primary)',
  color: 'var(--bg-primary)',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.9375rem',
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
}
