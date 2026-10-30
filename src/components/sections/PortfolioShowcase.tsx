'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import usePortfolio from '@/hooks/usePortfolio'
import PortfolioCard from './PortfolioCard'
import TechStackIcon from './TechStackIcon'

const sp  = { type: 'spring' as const, bounce: 0,    duration: 0.5  }
const spB = { type: 'spring' as const, bounce: 0.12, duration: 0.42 }

const tabContentVariants = {
  initial: { opacity: 0, y: 25 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -15 },
}

const cardVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -20 },
}

const techContainer = {
  animate: { transition: { staggerChildren: 0.035 } },
}

const techItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0, duration: 0.4 } },
}

const seeMoreVariants = {
  initial: { opacity: 0, y: 8  },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -8 },
}

const ITEMS_PER_PAGE = 10

const TABS = ['projects', 'techstack'] as const
type Tab = typeof TABS[number]
const TAB_LABELS: Record<Tab, string> = { projects: 'Projects', techstack: 'Tech Stack' }

export default function PortfolioShowcase() {
  const { projects, techStacks, loading } = usePortfolio()
  const [activeTab, setActiveTab]             = useState<Tab>('projects')
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [hasHover, setHasHover]               = useState(false)
  const [techPage, setTechPage]               = useState(0)
  const [isDesktop, setIsDesktop]             = useState(false)

  useEffect(() => {
    setHasHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const onChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
      if (e.matches) setTechPage(0)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const displayedProjects = useMemo(
    () => (showAllProjects ? projects : projects.slice(0, 3)),
    [showAllProjects, projects]
  )

  const totalTechPages = Math.ceil(techStacks.length / ITEMS_PER_PAGE)

  const paginatedTechs = useMemo(
    () => isDesktop
      ? techStacks
      : techStacks.slice(techPage * ITEMS_PER_PAGE, (techPage + 1) * ITEMS_PER_PAGE),
    [techStacks, techPage, isDesktop]
  )

  const handleTabClick = useCallback((tab: Tab) => {
    setActiveTab(tab)
    if (tab !== 'projects') setShowAllProjects(false)
    if (tab !== 'techstack') setTechPage(0)
  }, [])

  const toggleShowAll = useCallback(() => setShowAllProjects(v => !v), [])

  return (
    <section
      id="portfolio"
      className="w-full max-w-[1450px] mx-auto px-8 md:px-12 lg:px-20 pt-24 pb-24 text-white"
    >
      <motion.div
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ ...sp, duration: 0.7 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-5xl font-bold mb-3">Portfolio Showcase</h1>
        <p className="text-white/55 max-w-xl mx-auto text-sm md:text-base">
          Explore my journey through projects and technical expertise.
        </p>
      </motion.div>

      <div className="flex justify-center mb-10">
        <div className="w-full max-w-3xl rounded-full border border-white/10 bg-white/[0.08] backdrop-blur-sm p-2 flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`flex-1 rounded-full py-3 text-sm transition-all duration-300 ${
                activeTab === tab ? 'bg-white/10 text-white' : 'text-white/50'
              }`}
              style={activeTab === tab ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' } : undefined}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="initial" animate="animate" exit="exit"
          transition={sp}
        >
          {activeTab === 'projects' && (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 px-1">
                <AnimatePresence mode="popLayout">
                  {!loading && displayedProjects.map((item, i) => (
                    <motion.div
                      key={item.id}
                      variants={cardVariants}
                      initial="initial" animate="animate" exit="exit"
                      transition={{ ...spB, delay: i * 0.04 }}
                    >
                      <PortfolioCard
                        title={item.title}
                        description={item.description}
                        image={item.image_url}
                        live_url={item.live_url}
                        id={item.id}
                        technologies={item.technologies}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {!loading && projects.length > 3 && (
                <div className="flex justify-center">
                  <motion.button
                    whileTap={{ scale: 0.97, transition: { type: 'spring', bounce: 0, duration: 0.14 } }}
                    whileHover={hasHover ? { scale: 1.03, transition: { type: 'spring', bounce: 0, duration: 0.2 } } : undefined}
                    onClick={toggleShowAll}
                    className="px-6 py-3 rounded-full border border-white/10 bg-white/[0.05] text-sm text-white/75 flex items-center gap-2"
                    style={{ minHeight: 44 }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={showAllProjects ? 'less' : 'more'}
                        variants={seeMoreVariants}
                        initial="initial" animate="animate" exit="exit"
                        transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                        className="flex items-center gap-2"
                      >
                        {showAllProjects
                          ? <><ChevronUp size={16} />See Less</>
                          : <><ChevronDown size={16} />See More</>}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'techstack' && (
            <div className="flex flex-col items-center gap-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={techPage}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={sp}
                  className="w-full"
                >
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 max-w-5xl w-full mx-auto"
                    variants={techContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {!loading && paginatedTechs.map((item) => (
                      <TechCard key={item.id} item={item} hasHover={hasHover} />
                    ))}
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {!isDesktop && totalTechPages > 1 && (
                <div className="flex items-center gap-4">
                  <motion.button
                    onClick={() => setTechPage(p => Math.max(0, p - 1))}
                    disabled={techPage === 0}
                    whileTap={techPage > 0 ? { scale: 0.95, transition: { type: 'spring', bounce: 0, duration: 0.14 } } : undefined}
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.05] flex items-center justify-center transition-opacity"
                    style={{ opacity: techPage === 0 ? 0.3 : 1 }}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </motion.button>

                  <span className="text-xs font-mono text-white/40 tracking-widest">
                    {techPage + 1} / {totalTechPages}
                  </span>

                  <motion.button
                    onClick={() => setTechPage(p => Math.min(totalTechPages - 1, p + 1))}
                    disabled={techPage === totalTechPages - 1}
                    whileTap={techPage < totalTechPages - 1 ? { scale: 0.95, transition: { type: 'spring', bounce: 0, duration: 0.14 } } : undefined}
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.05] flex items-center justify-center transition-opacity"
                    style={{ opacity: techPage === totalTechPages - 1 ? 0.3 : 1 }}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

function TechCard({
  item,
  hasHover,
}: {
  item: { id: string | number; name: string; logo_key?: string }
  hasHover: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      variants={techItem}
      whileHover={hasHover ? { y: -5, transition: { type: 'spring', bounce: 0.2, duration: 0.28 } } : undefined}
      whileTap={{ scale: 0.96, transition: { type: 'spring', bounce: 0, duration: 0.14 } }}
      onHoverStart={() => hasHover && setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group rounded-[24px] border border-white/10 bg-white/[0.07] flex flex-col items-center justify-center gap-3 h-[110px] sm:h-[125px] w-full max-w-[125px] mx-auto"
    >
      <div className="relative flex items-center justify-center [--tech-icon-bg:#080808]">
        {hovered && (
          <div className="absolute w-[56px] h-[56px] rounded-full bg-white/15 opacity-60" />
        )}
        <TechStackIcon
          name={item.logo_key || item.name}
          className="relative z-10 w-[52px] h-[52px] text-white"
          aria-label={item.name}
        />
      </div>
      <p className="text-[11px] text-white/80 text-center leading-tight px-2 line-clamp-1">
        {item.name}
      </p>
    </motion.div>
  )
}
