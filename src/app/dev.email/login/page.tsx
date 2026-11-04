'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Step = 'credentials' | 'pin'

function IconEye({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

function IconEyeOff({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.3 4.4C2.8 5.5 1.8 7 1.8 7s2.2 4.7 6.2 4.7c1.1 0 2-.3 2.8-.7M7 3.4C7.3 3.3 7.7 3.3 8 3.3c4 0 6.2 4.7 6.2 4.7s-.5 1-1.4 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconCheck({ s = 11, color = '#0d0d0d' }: { s?: number; color?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 11 11" fill="none">
      <path d="M1.5 5.5 4.5 8.5 9.5 2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const sp = {
  enter:  { type: 'spring' as const, damping: 24, stiffness: 280 },
  tap:    { type: 'spring' as const, damping: 28, stiffness: 400 },
  bounce: { type: 'spring' as const, damping: 18, stiffness: 320 },
}

// Portfolio design tokens — exact match to globals.css
const bg     = '#0d0d0d'
const card   = '#1a1a1a'
const input  = '#141414'
const border = '#2a2a2a'
const text   = '#f0f0f0'
const text2  = '#888888'
const text3  = '#555555'
const purple = '#B284FF'
const red    = '#f87171'

export default function AdminLoginPage() {
  const [step, setStep]               = useState<Step>('credentials')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pin, setPin]                 = useState(['', '', '', ''])
  const [trustDevice, setTrustDevice] = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Login failed'); return }
      setStep('pin')
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePin(e: React.FormEvent) {
    e.preventDefault()
    const code = pin.join('')
    if (code.length < 4) return
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code, trust: trustDevice }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Incorrect PIN')
        setPin(['', '', '', ''])
        pinRefs[0].current?.focus()
        return
      }
      window.location.href = '/dev.email/dashboard'
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handlePinInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...pin]
    next[index] = value.slice(-1)
    setPin(next)
    if (value && index < 3) pinRefs[index + 1].current?.focus()
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus()
    }
  }

  const pinComplete = pin.join('').length === 4

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

        .jh-input {
          width: 100%; padding: 12px 14px;
          background: ${input};
          border: 1px solid ${border};
          border-radius: 10px;
          color: ${text};
          font-size: 15px;
          font-family: 'Syne', -apple-system, sans-serif;
          outline: none;
          transition: border-color 0.15s;
        }
        .jh-input::placeholder { color: ${text3}; }
        .jh-input:focus { border-color: rgba(255,255,255,0.18); }

        .jh-pin {
          width: 64px; height: 68px;
          text-align: center;
          font-size: 24px; font-weight: 700;
          background: ${input};
          border: 1px solid ${border};
          border-radius: 13px;
          color: ${text};
          font-family: 'Syne', -apple-system, sans-serif;
          outline: none;
          caret-color: ${text};
          transition: border-color 0.15s;
        }
        .jh-pin:focus { border-color: rgba(255,255,255,0.3); }

        .jh-eye:hover  { color: rgba(255,255,255,0.7) !important; }
        .jh-back:hover { color: rgba(255,255,255,0.6) !important; }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Syne', -apple-system, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        fontOpticalSizing: 'auto',
      }}>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sp.enter}
          style={{
            width: '100%', maxWidth: 380,
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 18,
            padding: '32px 28px',
            // Apple top-edge light catch
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 48px rgba(0,0,0,0.45)',
          }}
        >
          {/* Logo + heading */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            {/* JH mark — purple accent matches portfolio BlackHole */}
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: `rgba(178,132,255,0.08)`,
              border: `1px solid rgba(178,132,255,0.22)`,
              boxShadow: `inset 0 1px 0 rgba(178,132,255,0.15)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 22,
              fontSize: 13, fontWeight: 700,
              color: purple,
              letterSpacing: '0.04em',
              fontFamily: "'DM Mono', monospace",
            }}>
              JH
            </div>

            <h1 style={{
              fontSize: 22, fontWeight: 800, color: text,
              letterSpacing: '-0.03em', marginBottom: 7, textAlign: 'center',
              lineHeight: 1.1,
              fontFamily: "'Syne', -apple-system, sans-serif",
            }}>
              {step === 'credentials' ? 'Sign in' : 'Verify identity'}
            </h1>
            <p style={{
              fontSize: 14, color: text2, textAlign: 'center', lineHeight: 1.45,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: '0.01em',
            }}>
              {step === 'credentials'
                ? 'Continue to the jhner.dev workspace.'
                : 'Enter your 4-digit PIN to continue.'}
            </p>
          </div>

          <AnimatePresence mode="wait">

            {/* Credentials */}
            {step === 'credentials' && (
              <motion.form
                key="credentials"
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18, transition: { duration: 0.1 } }}
                transition={sp.enter}
                onSubmit={handleLogin}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Email or username</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@jhner.dev"
                    className="jh-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="jh-input"
                      style={{ paddingRight: 44 }}
                    />
                    <motion.button
                      type="button"
                      className="jh-eye"
                      whileTap={{ scale: 0.82 }}
                      transition={sp.tap}
                      onClick={() => setShowPassword(v => !v)}
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        cursor: 'pointer', padding: 4,
                        color: text3, display: 'flex', alignItems: 'center',
                        transition: 'color 0.13s',
                      }}
                    >
                      {showPassword ? <IconEyeOff s={16} /> : <IconEye s={16} />}
                    </motion.button>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 2 }}>
                  <motion.div
                    whileTap={{ scale: 0.88 }}
                    transition={sp.tap}
                    onClick={() => setTrustDevice(v => !v)}
                    style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      background: trustDevice ? text : 'transparent',
                      border: `1.5px solid ${trustDevice ? text : 'rgba(255,255,255,0.18)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <AnimatePresence>
                      {trustDevice && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={sp.bounce}
                          style={{ display: 'flex' }}
                        >
                          <IconCheck s={10} color={bg} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <span style={{
                    fontSize: 13, color: text2, userSelect: 'none',
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    Keep me signed in for 30 days
                  </span>
                </label>

                <AnimatePresence>
                  {error && <ErrorMsg key={error} message={error} />}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={!loading ? { scale: 0.97 } : undefined}
                  transition={sp.tap}
                  style={{
                    width: '100%', padding: '13px',
                    background: loading ? 'rgba(255,255,255,0.07)' : text,
                    color: loading ? 'rgba(255,255,255,0.25)' : bg,
                    border: 'none', borderRadius: 11,
                    fontSize: 15, fontWeight: 700,
                    fontFamily: "'Syne', -apple-system, sans-serif",
                    letterSpacing: '-0.01em',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: 4,
                    transition: 'background 0.18s, color 0.18s',
                  }}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </motion.button>
              </motion.form>
            )}

            {/* PIN */}
            {step === 'pin' && (
              <motion.form
                key="pin"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18, transition: { duration: 0.1 } }}
                transition={sp.enter}
                onSubmit={handlePin}
                style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'center' }}
              >
                <div style={{ display: 'flex', gap: 10 }}>
                  {pin.map((digit, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: digit ? 1.05 : 1 }}
                      transition={sp.bounce}
                    >
                      <input
                        ref={pinRefs[i]}
                        type="text"
                        inputMode="numeric"
                        value={digit}
                        onChange={e => handlePinInput(i, e.target.value)}
                        onKeyDown={e => handlePinKeyDown(i, e)}
                        maxLength={1}
                        autoFocus={i === 0}
                        className="jh-pin"
                        style={{
                          borderColor: digit
                            ? `rgba(178,132,255,0.45)`
                            : border,
                        }}
                      />
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                  {error && <ErrorMsg key={error} message={error} />}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={loading || !pinComplete}
                  whileTap={!loading && pinComplete ? { scale: 0.97 } : undefined}
                  transition={sp.tap}
                  style={{
                    width: '100%', padding: '13px',
                    background: loading || !pinComplete
                      ? 'rgba(255,255,255,0.07)'
                      : text,
                    color: loading || !pinComplete
                      ? 'rgba(255,255,255,0.25)'
                      : bg,
                    border: 'none', borderRadius: 11,
                    fontSize: 15, fontWeight: 700,
                    fontFamily: "'Syne', -apple-system, sans-serif",
                    letterSpacing: '-0.01em',
                    cursor: loading || !pinComplete ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  {loading ? 'Verifying…' : 'Verify'}
                </motion.button>

                <motion.button
                  type="button"
                  className="jh-back"
                  whileTap={{ scale: 0.94 }}
                  transition={sp.tap}
                  onClick={() => { setStep('credentials'); setError(''); setPin(['', '', '', '']) }}
                  style={{
                    background: 'none', border: 'none',
                    color: text3, fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: '0.01em',
                    transition: 'color 0.13s', marginTop: -8,
                  }}
                >
                  ← Back to sign in
                </motion.button>
              </motion.form>
            )}

          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{
            marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.16)',
            textAlign: 'center',
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.1em',
          }}
        >
          jhner.dev · admin access only
        </motion.p>

      </div>
    </>
  )
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      style={{
        width: '100%', fontSize: 13, color: red,
        padding: '10px 14px', textAlign: 'center',
        background: 'rgba(248,113,113,0.07)',
        border: '1px solid rgba(248,113,113,0.14)',
        borderRadius: 9, lineHeight: 1.45,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {message}
    </motion.p>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#888888',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  fontFamily: "'DM Mono', monospace",
}
