'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'

const sp = (delay = 0) => ({
  type: 'spring' as const,
  bounce: 0,
  duration: 0.65,
  delay,
})

export default function NotFound() {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <Navbar />

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(178,132,255,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <motion.section
        initial="hidden"
        animate="visible"
        variants={{
          hidden:   {},
          visible:  { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
        }}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          variants={{
            hidden:  { opacity: 0, y: 40, scale: 0.92 },
            visible: { opacity: 1, y: 0,  scale: 1    },
          }}
          transition={sp(0)}
          style={{ lineHeight: 1, marginBottom: 10, userSelect: 'none' }}
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(88px, 18vw, 160px)',
              fontWeight: 800,
              letterSpacing: '-0.05em',
              color: 'var(--text-primary)',
            }}
          >
            4
          </span>
          {/* Centre digit in purple — matches site accent */}
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(88px, 18vw, 160px)',
              fontWeight: 800,
              letterSpacing: '-0.05em',
              color: 'rgba(178,132,255,0.8)',
            }}
          >
            0
          </span>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(88px, 18vw, 160px)',
              fontWeight: 800,
              letterSpacing: '-0.05em',
              color: 'var(--text-primary)',
            }}
          >
            4
          </span>
        </motion.div>

        <motion.div
          variants={{
            hidden:  { scaleX: 0, opacity: 0 },
            visible: { scaleX: 1, opacity: 1  },
          }}
          transition={sp(0.05)}
          style={{
            width: 100,
            height: 1,
            background: 'rgba(255,255,255,0.1)',
            transformOrigin: 'center',
            marginBottom: 28,
          }}
        />

        {/* Badge */}
        <motion.div
          variants={{
            hidden:  { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0  },
          }}
          transition={sp(0.1)}
          style={{ marginBottom: 16 }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            Page not found
          </span>
        </motion.div>

        <motion.h1
          variants={{
            hidden:  { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0  },
          }}
          transition={sp(0.14)}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(24px, 4vw, 40px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: 14,
          }}
        >
          You wandered off the map.
        </motion.h1>

        <motion.p
          variants={{
            hidden:  { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0  },
          }}
          transition={sp(0.18)}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            maxWidth: 340,
            marginBottom: 36,
            letterSpacing: '0.01em',
          }}
        >
          This page was moved, removed or never existed.
          Head back to find what you need.
        </motion.p>

        <motion.div
          variants={{
            hidden:  { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0  },
          }}
          transition={sp(0.22)}
        >
          <motion.div
            whileTap={{ scale: 0.96, transition: { type: 'spring', bounce: 0, duration: 0.14 } }}
          >
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                padding: '11px 24px',
                backgroundColor: 'var(--bg-card)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
            >
              Go home
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>
    </main>
  )
}
