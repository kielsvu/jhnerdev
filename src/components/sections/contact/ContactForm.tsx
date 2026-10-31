'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, User, Mail, MessageSquare, CheckCircle, AlertCircle, Loader, FileText } from 'lucide-react'

const sp = { type: 'spring' as const, bounce: 0, duration: 0.55 }

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const fieldVariants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0,  transition: { type: 'spring' as const, bounce: 0, duration: 0.5 } },
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactForm() {
  const [hasHover, setHasHover] = useState(false)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [subject, setSubject]   = useState('')
  const [message, setMessage]   = useState('')
  const [status, setStatus]     = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const honeypotRef             = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHasHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, _hp: honeypotRef.current?.value ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error ?? 'Something went wrong.'); setStatus('error'); return }
      setStatus('sent')
      setName(''); setEmail(''); setSubject(''); setMessage('')
    } catch {
      setErrorMsg('Network error. Check your connection.')
      setStatus('error')
    }
  }

  const inputClass = 'w-full rounded-2xl border border-white/15 bg-black/20 pl-12 pr-4 py-4 outline-none transition duration-200 focus:border-white focus:ring-1 focus:ring-white/40 disabled:opacity-50'
  const disabled = status === 'sending' || status === 'sent'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={sp}
      viewport={{ once: true, amount: 0.15 }}
      className="rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 md:p-8 flex flex-col"
    >
      <form onSubmit={handleSubmit} noValidate>
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
              I&apos;m always open to discussing new projects, collaboration opportunities and ideas.
              Feel free to get in touch.
            </p>
          </motion.div>

          <input ref={honeypotRef} type="text" name="_hp" tabIndex={-1} aria-hidden="true" autoComplete="off" style={{ display: 'none' }} />

          <motion.div variants={fieldVariants} className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" aria-label="Your Name" required disabled={disabled} className={inputClass} />
          </motion.div>

          <motion.div variants={fieldVariants} className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your Email" aria-label="Your Email" required disabled={disabled} className={inputClass} />
          </motion.div>

          <motion.div variants={fieldVariants} className="relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" aria-label="Subject" required disabled={disabled} className={inputClass} />
          </motion.div>

          <motion.div variants={fieldVariants} className="relative">
            <MessageSquare className="absolute left-4 top-5 text-white/40" size={16} />
            <textarea rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Your Message" aria-label="Your Message" required disabled={disabled} className={`${inputClass} resize-none`} />
          </motion.div>

          <AnimatePresence mode="wait">
            {status === 'sent' && (
              <motion.p key="sent" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', bounce: 0, duration: 0.3 }} className="flex items-center gap-2 text-sm text-green-400/90 px-1">
                <CheckCircle size={15} /> Message sent! I&apos;ll get back to you soon.
              </motion.p>
            )}
            {status === 'error' && (
              <motion.p key="error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', bounce: 0, duration: 0.3 }} className="flex items-center gap-2 text-sm text-red-400/90 px-1">
                <AlertCircle size={15} /> {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div variants={fieldVariants}>
            <motion.button
              type="submit" disabled={disabled}
              whileTap={!disabled ? { scale: 0.97, transition: { type: 'spring', bounce: 0, duration: 0.14 } } : undefined}
              whileHover={hasHover && !disabled ? { scale: 1.02, transition: { type: 'spring', bounce: 0, duration: 0.2 } } : undefined}
              className="w-full rounded-2xl py-4 bg-white/10 border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? <><Loader size={16} className="animate-spin" /> Sending…</>
               : status === 'sent'  ? <><CheckCircle size={16} /> Sent</>
               :                      <><Send size={16} /> Send Message</>}
            </motion.button>
          </motion.div>
        </motion.div>
      </form>

      <div className="border-t border-white/10 pt-5 mt-6">
        <p className="text-sm text-white/55 mb-4">Connect With Me</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="mailto:hello@jhner.dev" className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm transition" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Email <span className="text-white/35">↗</span>
          </a>
        </div>
      </div>
    </motion.div>
  )
}
