'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'

const springUI    = { type: 'spring' as const, bounce: 0, duration: 0.45 }
const springPress = { type: 'spring' as const, bounce: 0, duration: 0.1  }

export default function NotFound() {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <Navbar />

      <motion.section
        initial="hidden"
        animate="visible"
        variants={{
          hidden:   {},
          visible:  { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
        }}
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
          variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
          transition={springUI}
          style={{ marginBottom: 20 }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-muted)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'rgba(178,132,255,0.6)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            Error 404
          </span>
        </motion.div>

        <motion.h1
          variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } }}
          transition={springUI}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(32px, 6vw, 52px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: 16,
            maxWidth: 480,
            fontOpticalSizing: 'auto',
          }}
        >
          This page doesn't exist.
        </motion.h1>

        <motion.p
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          transition={springUI}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.9,
            maxWidth: 320,
            marginBottom: 40,
            letterSpacing: '0.01em',
          }}
        >
          The page you're looking for was moved,<br />
          removed, or never existed.
        </motion.p>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12, scale: 0.96 }, visible: { opacity: 1, y: 0, scale: 1 } }}
          transition={springUI}
          style={{ marginBottom: 16 }}
        >
          <motion.div
            whileTap={{ scale: 0.97 }}
            transition={springPress}
            style={{ display: 'inline-block' }}
          >
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: "'Syne', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: 'var(--bg-primary)',
                background: 'var(--text-primary)',
                borderRadius: 999,
                padding: '12px 28px',
                textDecoration: 'none',
                transition: 'opacity 0.1s ease',
              }}
            >
              Return to jhner.dev
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          transition={{ ...springUI, delay: 0.08 }}
        >
          <motion.button
            onClick={() => window.history.back()}
            whileTap={{ scale: 0.97 }}
            transition={springPress}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: 'var(--text-muted)',
              letterSpacing: '0.02em',
              padding: '8px 16px',
              borderRadius: 8,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Go back
          </motion.button>
        </motion.div>
      </motion.section>
    </main>
  )
}
