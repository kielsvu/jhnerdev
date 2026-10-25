"use client"

import { useEffect, useState, type ReactNode } from "react"

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
  const texts = Array.isArray(text) ? text : [text]
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const target = texts[index] ?? ""
    const finished = value === target
    const empty = value.length === 0
    const delay = finished ? pauseDuration : empty && deleting ? 300 : deleting ? deletingSpeed : typingSpeed

    const timer = setTimeout(() => {
      if (finished) {
        setDeleting(true)
      } else if (deleting) {
        const next = value.slice(0, -1)
        setValue(next)
        if (next.length === 0) {
          setDeleting(false)
          setIndex((current) => (current + 1) % texts.length)
        }
      } else {
        setValue(target.slice(0, value.length + 1))
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [deleting, index, pauseDuration, texts, typingSpeed, deletingSpeed, value])

  return (
    <>
      <span>{value}</span>
      {showCursor && <span className={cursorClassName}>{cursorCharacter}</span>}
    </>
  )
}
