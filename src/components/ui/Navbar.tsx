'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const sp = { type: 'spring' as const, bounce: 0, duration: 0.65 }

export default function Navbar() {
  const [scrolled, setScrolled]           = useState(false)
  const [isMobile, setIsMobile]           = useState(false)
  const [open, setOpen]                   = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [mounted, setMounted]             = useState(false)
  const [showNavbar, setShowNavbar]       = useState(false)
  const [hasHover, setHasHover]           = useState(false)

  useEffect(() => {
    setMounted(true)
    setHasHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)

    const onResize = () => setIsMobile(window.innerWidth < 768)
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      const ids = ['home', 'about', 'portfolio', 'contact']
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        const { top, bottom } = el.getBoundingClientRect()
        if (top <= 140 && bottom >= 140) { setActiveSection(id); break }
      }
    }
    onResize(); onScroll()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    if (sessionStorage.getItem('navbarPlayed')) { setShowNavbar(true); return }
    const t = setTimeout(() => {
      setShowNavbar(true)
      sessionStorage.setItem('navbarPlayed', 'true')
    }, 3800)
    return () => clearTimeout(t)
  }, [])

  if (!mounted) return null

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const el = document.querySelector(targetId)
    if (!el) return
    const target = el.getBoundingClientRect().top + window.scrollY - 3
    const start  = window.scrollY
    const dist   = target - start
    if (Math.abs(dist) < 2) return
    const duration = 520
    let startTime: number | null = null
    const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    const step = (now: number) => {
      if (!startTime) startTime = now
      const p = Math.min((now - startTime) / duration, 1)
      window.scrollTo(0, start + dist * ease(p))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
    setOpen(false)
  }

  const navItems = [
    { label: 'Home',      id: 'home' },
    { label: 'About',     id: 'about' },
    { label: 'Portfolio', id: 'portfolio' },
    { label: 'Contact',   id: 'contact' },
  ]

  return (
    <motion.nav
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: showNavbar ? 1 : 0, y: showNavbar ? 0 : -40 }}
      transition={sp}
      style={{ position: 'fixed', top: 20, left: isMobile ? 20 : 60, right: isMobile ? 20 : 60, zIndex: 50 }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 24px', borderRadius: 999,
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        backgroundColor: scrolled ? 'rgba(13,13,13,0.85)' : 'rgba(13,13,13,0.5)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        border: '1px solid var(--border)',
        transition: 'background-color 0.3s ease',
      }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 600, color: '#ffffff', letterSpacing: '0.05em' }}>
          jhner.dev
        </span>

        {!isMobile && (
          <div style={{ display: 'flex', gap: 40 }}>
            {navItems.map(({ label, id }) => {
              const active = activeSection === id
              return (
                <a key={id} href={`#${id}`} onClick={(e) => scrollTo(e, `#${id}`)}
                  style={{
                    position: 'relative', fontFamily: "'DM Mono', monospace",
                    fontSize: 13, letterSpacing: '0.08em', textDecoration: 'none',
                    paddingBottom: 4, cursor: 'pointer',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {label}
                  <span style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
                    background: 'white',
                    transform: active ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.25s ease',
                  }} />
                </a>
              )
            })}
          </div>
        )}

        {isMobile && (
          <button
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'white',
              minWidth: 44, minHeight: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {open
                ? <motion.span key="x" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ type: 'spring', bounce: 0, duration: 0.22 }}><X size={18} /></motion.span>
                : <motion.span key="m" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ type: 'spring', bounce: 0, duration: 0.22 }}><Menu size={18} /></motion.span>
              }
            </AnimatePresence>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isMobile && open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.32 }}
            style={{
              marginTop: 10, borderRadius: 20,
              background: 'rgba(13,13,13,0.9)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              padding: '10px 8px', display: 'flex', flexDirection: 'column',
            }}
          >
            {navItems.map(({ label, id }, i) => (
              <motion.a
                key={id} href={`#${id}`} onClick={(e) => scrollTo(e, `#${id}`)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.28, delay: i * 0.04 }}
                style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 14,
                  color: activeSection === id ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  textDecoration: 'none',
                  padding: '13px 20px', borderRadius: 12,
                }}
              >
                {label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
