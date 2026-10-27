'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'

import BlackHole from '@/components/BlackHole'
import Navbar from '@/components/ui/Navbar'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import PortfolioShowcase from '@/components/sections/PortfolioShowcase'
import ContactSection from '@/components/sections/contact/ContactSection'
import WelcomeScreen from '@/components/WelcomeScreen'

import { hasPlayedIntro, setIntroPlayed } from '@/lib/introState'

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [showApp, setShowApp] = useState(true)
  const controls = useAnimation()
  const exitingRef = useRef(false)

  useEffect(() => {
    const currentHash = window.location.hash
    const pathname = window.location.pathname

    if (currentHash === '#portfolio') {
      setShowWelcome(false)
      setShowApp(true)
      return
    }

    const navEntries = performance.getEntriesByType('navigation')
    const navigationType =
      navEntries.length > 0
        ? (navEntries[0] as PerformanceNavigationTiming).type
        : null

    const isReload = navigationType === 'reload'

    if (isReload && pathname === '/') {
      sessionStorage.removeItem('introPlayed')
      sessionStorage.removeItem('heroPlayed')

      if (window.location.hash) {
        history.replaceState(null, '', '/')
      }

      window.scrollTo({ top: 0, behavior: 'instant' })
    }

    if (!hasPlayedIntro()) {
      setShowWelcome(true)
      setShowApp(false)

      const timer = setTimeout(async () => {
        if (exitingRef.current) return
        exitingRef.current = true

        setShowApp(true)

        await controls.start({
          y: '-100%',
          transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] },
        })

        setShowWelcome(false)
        setIntroPlayed()
      }, 2800)

      return () => clearTimeout(timer)
    } else {
      setShowWelcome(false)
      setShowApp(true)
    }
  }, [controls])

  return (
    <main style={{ position: 'relative', overflow: 'hidden' }}>
      <BlackHole
        particleCount={900}
        particleSize={3}
        colors={['#B284FF', '#D6BEFF', '#FFFFFF']}
        outerRadius={100}
        tilt={18}
        tiltSideway={160}
        trail={46}
        orbitSpeed={4}
        pullSpeed={0}
      />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <Navbar />
        <Hero showApp={showApp} />
        <About />
        <PortfolioShowcase />
        <ContactSection />
      </div>

      {showWelcome && (
        <motion.div
          animate={controls}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          <WelcomeScreen />
        </motion.div>
      )}
    </main>
  )
}
