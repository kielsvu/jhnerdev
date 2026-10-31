'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Step = 'credentials' | 'pin'

export default function AdminLoginPage() {
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [trustDevice, setTrustDevice] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        return
      }

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
      const res = await fetch('/api/admin/auth/pin', {
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
    const updated = [...pin]
    updated[index] = value.slice(-1)
    setPin(updated)
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus()
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus()
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={{ width: '100%', maxWidth: '360px' }}
      >
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            jhner.dev
          </p>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {step === 'credentials' ? 'Sign in' : 'Verify identity'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {step === 'credentials'
              ? 'Access the admin dashboard'
              : 'Enter your 4-digit PIN to continue'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'credentials' ? (
            <motion.form
              key="credentials"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleLogin}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                  style={inputStyle}
                />
              </Field>

              <Field label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </Field>

              {error && <ErrorMsg message={error} />}

              <button type="submit" disabled={loading} style={buttonStyle(loading)}>
                {loading ? 'Signing in…' : 'Continue'}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="pin"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handlePin}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={pinRefs[i]}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={e => handlePinInput(i, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(i, e)}
                    maxLength={1}
                    autoFocus={i === 0}
                    style={{
                      width: '60px',
                      height: '64px',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      background: 'var(--bg-card)',
                      border: '1px solid',
                      borderColor: digit ? 'var(--text-secondary)' : 'var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      caretColor: 'white',
                      transition: 'border-color 0.15s',
                    }}
                  />
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={e => setTrustDevice(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--text-primary)' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Trust this device for 30 days
                </span>
              </label>

              {error && <ErrorMsg message={error} />}

              <button
                type="submit"
                disabled={loading || pin.join('').length < 4}
                style={buttonStyle(loading || pin.join('').length < 4)}
              >
                {loading ? 'Verifying…' : 'Verify'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('credentials'); setError(''); setPin(['', '', '', '']) }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  padding: '4px',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                Back to sign in
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <p style={{
      fontSize: '0.8125rem',
      color: '#f87171',
      padding: '10px 12px',
      background: 'rgba(248, 113, 113, 0.08)',
      border: '1px solid rgba(248, 113, 113, 0.2)',
      borderRadius: '6px',
    }}>
      {message}
    </p>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.9375rem',
  outline: 'none',
  transition: 'border-color 0.15s',
}

function buttonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '11px',
    background: disabled ? 'var(--bg-card)' : 'var(--text-primary)',
    color: disabled ? 'var(--text-muted)' : 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.15s, background 0.15s',
    opacity: disabled ? 0.5 : 1,
  }
}
