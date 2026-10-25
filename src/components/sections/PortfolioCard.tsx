'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

type Props = {
  title: string
  description: string
  id?: string
  image?: string
  live_url?: string
  technologies?: string
}

export default function PortfolioCard({ title, description, id, image, live_url, technologies }: Props) {
  const [hasHover, setHasHover] = useState(false)
  useEffect(() => {
    setHasHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  const techs = technologies
    ? technologies.split(',').map(t => t.trim()).filter(Boolean)
    : []

  return (
    <motion.div
      whileHover={hasHover ? { y: -4, transition: { type: 'spring', bounce: 0.2, duration: 0.28 } } : undefined}
      whileTap={{ scale: 0.985, transition: { type: 'spring', bounce: 0, duration: 0.15 } }}
      className="group relative rounded-[26px] border border-white/10 bg-white/[0.07] p-4 flex flex-col min-h-[270px]"
    >
      <div className="w-full h-36 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] mb-3">
        {image ? (
          <img
            src={image}
            alt={`${title} preview`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full bg-white/[0.03]" />
        )}
      </div>

      <h3 className="text-[17px] font-semibold mb-2 leading-tight">{title}</h3>

      <p className="text-[13px] text-white/60 leading-relaxed line-clamp-2 min-h-[38px]">
        {description}
      </p>

      {techs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {techs.map(tech => (
            <span
              key={tech}
              className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 bg-white/[0.06] text-white/60"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between">
        {live_url ? (
          <a
            href={live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] text-white/70 hover:text-white transition-all"
          >
            Live Demo
            <ArrowUpRight size={14} />
          </a>
        ) : (
          <div className="text-[13px] text-white/35">No Link</div>
        )}
      </div>
    </motion.div>
  )
}
