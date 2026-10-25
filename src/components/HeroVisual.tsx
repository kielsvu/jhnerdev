"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export default function HeroVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <motion.div
        className="absolute right-[8%] top-[18%] h-56 w-56 rounded-full overflow-hidden border border-white/10 bg-white/[0.025] blur-[1px]"
        animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/assets/PP.png"
          alt="Jhner Torres"
          fill
          priority
          sizes="224px"
          className="object-cover"
        />
      </motion.div>

      <motion.div
        className="absolute right-[15%] top-[30%] h-32 w-32 rounded-full border border-white/10"
        animate={{ y: [0, 22, 0], x: [0, -12, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute right-[4%] bottom-[16%] h-72 w-72 rounded-full bg-white/[0.025] blur-[90px]" />
    </div>
  )
}
