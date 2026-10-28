'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import usePortfolio from '@/hooks/usePortfolio'
import PortfolioCard from './PortfolioCard'
import Folder from '@/components/ui/Folder'
import TechStackIcon from './TechStackIcon'
import type { LocalTechStack } from '@/lib/portfolioData'

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

const seeMoreVariants = {
  initial: { opacity: 0, y: 8  },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -8 },
}

const TECH_GROUPS = [
  {
    label: 'Frontend',
    color: '#3d8bff',
    ids: ['react', 'nextjs', 'tailwind', 'html', 'css', 'typescript'],
  },
  {
    label: 'Scripting',
    color: '#B284FF',
    ids: ['javascript', 'jsx', 'tsx', 'python', 'lua', 'php'],
  },
  {
    label: 'Compiled',
    color: '#fb923c',
    ids: ['java', 'kotlin', 'c', 'cpp', 'csharp', 'assembly'],
  },
  {
    label: 'Backend & Tools',
    color: '#4ade80',
    ids: ['node', 'sql', 'git', 'github'],
  },
]

const TABS = ['projects', 'techstack'] as const
type Tab = typeof TABS[number]
const TAB_LABELS: Record<Tab, string> = { projects: 'Projects', techstack: 'Tech Stack' }

function TechFolderItem({ item }: { item: LocalTechStack }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      background: '#141414',
    }}>
      <TechStackIcon
        name={item.logo_key}
        className="w-10 h-10"
        aria-label={item.name}
      />
      <span style={{
        fontSize: 10,
        fontFamily: "'DM Mono', monospace",
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        letterSpacing: '0.05em',
        lineHeight: 1.3,
      }}>
        {item.name}
      </span>
    </div>
  )
}

export default function PortfolioShowcase() {
  const { projects, techStacks, loading } = usePortfolio()
  const [activeTab, setActiveTab]             = useState<Tab>('projects')
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [hasHover, setHasHover]               = useState(false)

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

  const toggleShowAll = useCallback(() => setShowAllProjects(v => !v), [])

  const techGroups = useMemo(() => {
    return TECH_GROUPS.map(group => ({
      ...group,
      items: group.ids
        .map(id => techStacks.find(t => t.id === id))
        .filter((t): t is LocalTechStack => Boolean(t)),
    })).filter(g => g.items.length > 0)
  }, [techStacks])

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
            <div className="flex flex-col items-center gap-4">
              <p className="text-white/40 text-xs font-mono tracking-widest uppercase mb-2">
                Click a folder to explore
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center w-full">
                {!loading && techGroups.map((group, i) => (
                  <motion.div
                    key={group.label}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...spB, delay: i * 0.08 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <Folder
                      label={group.label}
                      color={group.color}
                      paperColor="#141414"
                      theme="dark"
                      size={0.8}
                      peek
                      draggable={false}
                      zoomOnClick={false}
                      bounce={0.3}
                      tilt={0.4}
                      items={group.items.map(item => ({
                        content: <TechFolderItem item={item} />,
                      }))}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
