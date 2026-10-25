"use client"

import { useRef, useEffect, useCallback, useState } from "react"

const PERSPECTIVE = 1300

const DEFAULTS = {
  particleCount: 900,
  particleSize: 3,
  colors: ["#B284FF", "#D6BEFF", "#FFFFFF"],
  outerRadius: 100,
  tilt: 20,
  tiltSideway: 160,
  trail: 50,
  orbitSpeed: 1,
  pullSpeed: 0,
}

export default function BlackHole(props) {
  const {
    particleCount = DEFAULTS.particleCount,
    particleSize: particleSizeRaw = DEFAULTS.particleSize,
    colors = DEFAULTS.colors,
    outerRadius = DEFAULTS.outerRadius,
    tilt = DEFAULTS.tilt,
    tiltSideway = DEFAULTS.tiltSideway,
    trail: trailRaw = DEFAULTS.trail,
    orbitSpeed = DEFAULTS.orbitSpeed,
    pullSpeed: pullSpeedRaw = DEFAULTS.pullSpeed,
    style,
  } = props

  const perspective = PERSPECTIVE
  const particleSize = 0.5 + (Math.max(1, Math.min(50, particleSizeRaw ?? 20)) - 1) * (4 / 49)
  const pullSpeed = Math.max(0, pullSpeedRaw ?? 1) / 2
  const trailAlpha = Math.max(0.02, 1 - (Math.max(0, trailRaw ?? 40) / 50) * 0.98)
  const voidRadius = 8

  const outerRadFromSize = useCallback(
    (w, h) => {
      const isMobile = w < 768
      const base = isMobile ? Math.sqrt(w * w + h * h) * 0.52 : w / 2
      const pct = Math.max(0, Math.min(100, outerRadius)) / 100
      return voidRadius + pct * (base - voidRadius)
    },
    [outerRadius]
  )

  const resolveCenter = useCallback((w, h) => {
    return { cx: w * 0.5, cy: h * 0.5 }
  }, [])

  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const particlesRef = useRef([])
  const animRef = useRef(0)
  const sizeRef = useRef({ w: 0, h: 0 })
  const colorsRef = useRef(colors)
  const [sizeVersion, setSizeVersion] = useState(0)

  // Keep colorsRef in sync without triggering loop restarts
  useEffect(() => {
    colorsRef.current = colors
  }, [colors])

  const initParticles = useCallback((count, horizonRad, outerRad, colorsLength) => {
    const pts = new Array(count)
    for (let i = 0; i < count; i++) {
      pts[i] = {
        angle: Math.random() * Math.PI * 2,
        radius: horizonRad + Math.pow(Math.random(), 2) * (outerRad - horizonRad),
        height: (Math.random() - 0.5) * 16,
        speedOffset: 0.75 + Math.random() * 0.5,
        colorIdx: Math.floor(Math.random() * colorsLength),
      }
    }
    particlesRef.current = pts
  }, [])

  useEffect(() => {
    const { w, h } = sizeRef.current
    if (w === 0 || h === 0) return
    initParticles(particleCount, voidRadius, outerRadFromSize(w, h), colors.length)
  }, [particleCount, voidRadius, colors.length, initParticles, outerRadFromSize, sizeVersion])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width === 0 || height === 0) continue
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        const prev = sizeRef.current
        sizeRef.current = { w: width, h: height }
        if (prev.w !== width || prev.h !== height) {
          setSizeVersion((v) => v + 1)
        }
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // willReadFrequently:false avoids readback overhead; desynchronized reduces input latency
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true })
    if (!ctx) return

    let lastTime = performance.now()
    let raf = 0

    // Pre-allocate scratch buffers — avoid GC every frame
    const MAX = particleCount
    // Each slot: [px, py, size, alpha, z, colorIdx]
    const bgBuf = new Array(MAX)
    const fgBuf = new Array(MAX)
    let bgLen = 0
    let fgLen = 0

    const draw = (now) => {
      const dt = Math.min((now - lastTime) / 16.667, 3)
      lastTime = now

      const { w, h } = sizeRef.current
      if (w === 0 || h === 0) {
        raf = requestAnimationFrame(draw)
        return
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      ctx.globalAlpha = trailAlpha
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, w, h)

      const outerRad = outerRadFromSize(w, h)
      const { cx: voidCx, cy: voidCy } = resolveCenter(w, h)
      const pts = particlesRef.current
      const colorsArr = colorsRef.current

      if (pts.length === 0) {
        raf = requestAnimationFrame(draw)
        return
      }

      // Cache trig — identical each frame for given tilt values
      const tiltRad = (tilt * Math.PI) / 180
      const tiltSidewayRad = (tiltSideway * Math.PI) / 180
      const cosTilt = Math.cos(tiltRad)
      const sinTilt = Math.sin(tiltRad)
      const cosSide = Math.cos(tiltSidewayRad)
      const sinSide = Math.sin(tiltSidewayRad)

      bgLen = 0
      fgLen = 0

      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i]
        const speedFactor = Math.sqrt(voidRadius / Math.max(pt.radius, 10))
        pt.angle += orbitSpeed * speedFactor * pt.speedOffset * 0.012 * dt
        pt.radius -= pullSpeed * speedFactor * pt.speedOffset * dt

        if (pt.radius < voidRadius) {
          pt.radius = voidRadius + 0.7 * (outerRad - voidRadius) + Math.random() * 0.3 * (outerRad - voidRadius)
          pt.angle = Math.random() * Math.PI * 2
          pt.height = (Math.random() - 0.5) * 16
          continue
        }

        const x_base = pt.radius * Math.cos(pt.angle)
        const y_base = pt.height
        const z_base = pt.radius * Math.sin(pt.angle)

        const y1 = y_base * cosTilt + z_base * sinTilt
        const z1 = -y_base * sinTilt + z_base * cosTilt

        const x3d = x_base * cosSide - y1 * sinSide
        const y3d = x_base * sinSide + y1 * cosSide
        const z3d = z1

        const scale = perspective / (perspective + z3d)
        const px = voidCx + x3d * scale
        const py = voidCy + y3d * scale

        if (px < -50 || px > w + 50 || py < -50 || py > h + 50) continue

        const size = Math.max(0.3, particleSize * scale)
        const alpha = Math.max(0.35, 1 - ((z3d + outerRad) / (2 * outerRad)) * 0.45)

        if (z3d >= 0) {
          bgBuf[bgLen++] = { x: px, y: py, size, alpha, z: z3d, colorIdx: pt.colorIdx }
        } else {
          fgBuf[fgLen++] = { x: px, y: py, size, alpha, z: z3d, colorIdx: pt.colorIdx }
        }
      }

      // Sort only the filled slice (avoids sorting full pre-allocated array)
      if (bgLen > 1) bgBuf.length = bgLen, bgBuf.sort((a, b) => b.z - a.z)
      if (fgLen > 1) fgBuf.length = fgLen, fgBuf.sort((a, b) => b.z - a.z)

      // Batch draws by color to minimize fillStyle/globalAlpha state changes
      const drawBatch = (buf, len) => {
        // Group by colorIdx
        // For 1–few colors this is very fast
        const groups = {}
        for (let i = 0; i < len; i++) {
          const p = buf[i]
          const key = p.colorIdx
          if (!groups[key]) groups[key] = []
          groups[key].push(p)
        }
        for (const key in groups) {
          const color = colorsArr[key % colorsArr.length]
          ctx.fillStyle = color
          const group = groups[key]
          for (let j = 0; j < group.length; j++) {
            const p = group[j]
            ctx.globalAlpha = p.alpha
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      drawBatch(bgBuf, bgLen)
      drawBatch(fgBuf, fgLen)

      ctx.globalAlpha = 1.0
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [
    voidRadius,
    particleCount,
    particleSize,
    outerRadFromSize,
    resolveCenter,
    tilt,
    tiltSideway,
    trailAlpha,
    orbitSpeed,
    pullSpeed,
    perspective,
  ])

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "transparent",
        pointerEvents: "none",
        zIndex: 0,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  )
}
