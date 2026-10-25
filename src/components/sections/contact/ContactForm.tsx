'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, User, Mail, MessageSquare } from 'lucide-react'

const sp = { type: 'spring' as const, bounce: 0, duration: 0.55 }

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0, duration: 0.5 } },
}

export default function ContactForm() {
  const [hasHover, setHasHover] = useState(false)
  useEffect(() => {
    setHasHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={sp}
      viewport={{ once: true, amount: 0.15 }}
      className="rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 md:p-8 flex flex-col"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="flex flex-col gap-4"
      >
        <motion.div variants={fieldVariants}>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Contact Me</h2>
          <p className="text-sm text-white/50 mb-3">
            I'm always open to discussing new projects, collaboration opportunities and ideas.
            Feel free to get in touch.
          </p>
        </motion.div>

        <motion.div variants={fieldVariants} className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input
            placeholder="Your Name"
            aria-label="Your Name"
            className="w-full rounded-2xl border border-white/15 bg-black/20 pl-12 pr-4 py-4 outline-none transition duration-200 focus:border-white focus:ring-1 focus:ring-white/40"
          />
        </motion.div>

        <motion.div variants={fieldVariants} className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input
            type="email"
            placeholder="Your Email"
            aria-label="Your Email"
            className="w-full rounded-2xl border border-white/15 bg-black/20 pl-12 pr-4 py-4 outline-none transition duration-200 focus:border-white focus:ring-1 focus:ring-white/40"
          />
        </motion.div>

        <motion.div variants={fieldVariants} className="relative">
          <MessageSquare className="absolute left-4 top-5 text-white/40" size={16} />
          <textarea
            rows={5}
            placeholder="Your Message"
            aria-label="Your Message"
            className="w-full rounded-2xl border border-white/15 bg-black/20 pl-12 pr-4 py-4 outline-none resize-none transition duration-200 focus:border-white focus:ring-1 focus:ring-white/40"
          />
        </motion.div>

        <motion.div variants={fieldVariants}>
          <motion.button
            whileTap={{ scale: 0.97, transition: { type: 'spring', bounce: 0, duration: 0.14 } }}
            whileHover={hasHover ? { scale: 1.02, transition: { type: 'spring', bounce: 0, duration: 0.2 } } : undefined}
            className="w-full rounded-2xl py-4 bg-white/10 border border-white/10 flex items-center justify-center gap-2"
          >
            <Send size={16} />
            Send Message
          </motion.button>
        </motion.div>
      </motion.div>

      <div className="border-t border-white/10 pt-5 mt-6">
        <p className="text-sm text-white/55 mb-4">Connect With Me</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="mailto:jhnergarcia@gmail.com"
            className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm transition"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Email <span className="text-white/35">↗</span>
          </a>
        </div>
      </div>
    </motion.div>
  )
}
