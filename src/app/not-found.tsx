'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'

const ease = [0.22, 1, 0.36, 1] as const

export default function NotFound() {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <Navbar />

      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease }}
          style={{ marginBottom: 16 }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(96px, 20vw, 180px)',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.05em',
              color: 'var(--text-primary)',
              opacity: 0.06,
              display: 'block',
              userSelect: 'none',
            }}
          >
            404
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease }}
          style={{ marginTop: -40, marginBottom: 16 }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}
          >
            Page not found
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease }}
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          This page doesn't exist
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease }}
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            maxWidth: 380,
            marginBottom: 36,
          }}
        >
          The page you're looking for was moved, removed, or never existed.
          Head back to find what you need.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '10px 22px',
              backgroundColor: 'var(--bg-card)',
              textDecoration: 'none',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
          >
            ← Go home
          </Link>
        </motion.div>
      </section>
    </main>
  )
}
