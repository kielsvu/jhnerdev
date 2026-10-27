"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

type TextTypeProps = {
  text: string | string[]
  typingSpeed?: number
  pauseDuration?: number
  deletingSpeed?: number
  showCursor?: boolean
  cursorCharacter?: ReactNode
  cursorClassName?: string
}

export default function TextType({
  text,
  typingSpeed = 75,
  pauseDuration = 1500,
  deletingSpeed = 50,
  showCursor = true,
  cursorCharacter = "_",
  cursorClassName = "",
}: TextTypeProps) {
  const textsRef = useRef<string[]>([])
  textsRef.current = Array.isArray(text) ? text : [text]

  const [index, setIndex] = useState(0)
  const [value, setValue] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const texts = textsRef.current
    const target = texts[index] ?? ""
    const finished = value === target
    const empty = value.length === 0

    // Check deleting FIRST — otherwise finished+deleting loops forever at pauseDuration
    const delay = deleting
      ? empty ? 300 : deletingSpeed
      : finished ? pauseDuration : typingSpeed

    const timer = setTimeout(() => {
      const current = textsRef.current
      if (deleting) {
        const next = value.slice(0, -1)
        setValue(next)
        if (next.length === 0) {
          setDeleting(false)
          setIndex((i) => (i + 1) % current.length)
        }
      } else if (finished) {
        setDeleting(true)
      } else {
        setValue(target.slice(0, value.length + 1))
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [deleting, index, pauseDuration, typingSpeed, deletingSpeed, value])

  return (
    <>
      <span>{value}</span>
      {showCursor && <span className={cursorClassName}>{cursorCharacter}</span>}
    </>
  )
}
