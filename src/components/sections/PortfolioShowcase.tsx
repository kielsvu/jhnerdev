'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import usePortfolio from '@/hooks/usePortfolio'
import PortfolioCard from './PortfolioCard'
import TechStackIcon from './TechStackIcon'

const sp  = { type: 'spring' as const, bounce: 0,    duration: 0.5  }
const spB = { type: 'spring' as const, bounce: 0.12, duration: 0.42 }

const tabContentVariants = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -12 },
}
const cardVariants = {
  initial: { opacity: 0, y: 36 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -16 },
}
const techContainer = {
  animate: { transition: { staggerChildren: 0.035 } },
}
const techItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0, duration: 0.4 } },
}
const seeMoreVariants = {
  initial: { opacity: 0, y: 6  },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -6 },
}

const TABS = ['projects', 'techstack'] as const
type Tab = typeof TABS[number]
const TAB_LABELS: Record<Tab, string> = { projects: 'Projects', techstack: 'Tech Stack' }

export default function PortfolioShowcase() {
  const { projects, techStacks, loading } = usePortfolio()
  const [activeTab, setActiveTab]         = useState<Tab>('projects')
  const [previewOpen, setPreviewOpen]     = useState(false)
  const [previewImage, setPreviewImage]   = useState('')
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [hasHover, setHasHover]           = useState(false)

  useEffect(() => {
    setHasHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  const displayedProjects = useMemo(
    () => (showAllProjects ? projects : projects.slice(0, 3)),
    [showAllProjects, projects]
  )
  const handleTabClick = useCallback((tab: Tab) => {
    setActiveTab(tab)
    if (tab !== 'projects') setShowAllProjects(false)
  }, [])
  const closePreview  = useCallback(() => setPreviewOpen(false), [])
  const toggleShowAll = useCallback(() => setShowAllProjects(v => !v), [])

  return (
    <>
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={sp}
            className="fixed inset-0 z-[999] bg-black/92 flex items-center justify-center px-6"
          >
            <button
              onClick={closePreview}
              aria-label="Close preview"
              className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center transition"
            >
              <X size={18} />
            </button>
            <motion.img
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }} transition={{ ...sp, duration: 0.32 }}
              src={previewImage} alt="Project preview"
              decoding="async" loading="lazy"
              className="max-w-[88vw] max-h-[88vh] rounded-3xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <section
        id="portfolio"
        className="w-full max-w-[1450px] mx-auto px-8 md:px-12 lg:px-20 pt-24 pb-24 text-white"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
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
              <div className="min-h-[360px] flex justify-center">
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 max-w-5xl w-full"
                  variants={techContainer}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true, amount: 0.1 }}
                >
                  {!loading && techStacks?.map((item, index) => (
                    <TechCard key={item.id} item={item} index={index} hasHover={hasHover} />
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  )
}

function TechCard({
  item,
  index,
  hasHover,
}: {
  item: { id: string | number; name: string; logo_key?: string }
  index: number
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
