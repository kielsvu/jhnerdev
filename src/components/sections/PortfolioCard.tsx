'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

type Props = {
  title: string
  description: string
  id?: string
  image?: string
  live_url?: string
}

export default function PortfolioCard({
  title,
  description,
  id,
  image,
  live_url,
}: Props) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative rounded-[26px] border border-white/10 bg-white/[0.07] p-4 flex flex-col min-h-[270px]"
    >
      <div className="w-full h-36 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] mb-3">
        {image ? (
          <img
            src={image}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full bg-white/[0.03]" />
        )}
      </div>

      <h3 className="text-[17px] font-semibold mb-2 leading-tight">
        {title}
      </h3>

      <p className="text-[13px] text-white/60 leading-relaxed line-clamp-2 min-h-[38px]">
        {description}
      </p>

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
          <div className="text-[13px] text-white/35">
            No Link
          </div>
        )}


      </div>
    </motion.div>
  )
}