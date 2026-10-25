'use client'

import { motion } from 'framer-motion'
import ContactForm from './ContactForm'

const smoothEase: [number, number, number, number] = [
  0.22,
  1,
  0.36,
  1,
]

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="w-full max-w-[1500px] mx-auto 
      px-5 sm:px-6 md:px-10 lg:px-20
      pt-20 sm:pt-24 lg:pt-28 
      pb-24 sm:pb-28 lg:pb-36 
      text-white"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: smoothEase,
        }}
        viewport={{ once: false, amount: 0.3 }}
        className="text-center mb-12 sm:mb-14 lg:mb-16"
      >
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: smoothEase,
          }}
          viewport={{ once: false }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4"
        >
          Contact Me
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: smoothEase,
          }}
          viewport={{ once: false }}
          className="text-white/60 text-sm sm:text-base max-w-xl sm:max-w-2xl mx-auto leading-relaxed"
        >
          Have something in mind? Send a message and let's connect.
        </motion.p>
      </motion.div>

      
      <div className="max-w-[700px] mx-auto w-full">
        <ContactForm />
      </div>

      <div className="mt-20 text-center text-xs text-white/35">
        © 2025 Jhner Torres — All rights reserved.
      </div>
    </section>
  )
}
