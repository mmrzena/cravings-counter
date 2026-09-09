'use client'

import { useEffect, useRef } from 'react'

export default function Celebration({ count }: { count: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!count || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const ratio = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    canvas.width = width * ratio
    canvas.height = height * ratio
    context.scale(ratio, ratio)
    const colors = ['#3b7753', '#edaaad', '#eab94b', '#91b6d0', '#a696c7']
    const particles = Array.from({ length: 65 }, (_, i) => ({
      x: width / 2,
      y: height * 0.52,
      vx: (Math.random() - 0.5) * 13,
      vy: -5 - Math.random() * 10,
      color: colors[i % colors.length],
      rotation: Math.random() * Math.PI,
    }))
    let frame = 0
    const start = performance.now()
    const draw = (now: number) => {
      const elapsed = (now - start) / 16.67
      context.clearRect(0, 0, width, height)
      context.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - 32) / 35)
      for (const p of particles) {
        context.save()
        context.translate(p.x + p.vx * elapsed, p.y + p.vy * elapsed + 0.15 * elapsed ** 2)
        context.rotate(p.rotation + elapsed * 0.09)
        context.fillStyle = p.color
        context.fillRect(-3, -5, 6, 10)
        context.restore()
      }
      if (elapsed < 68) frame = requestAnimationFrame(draw)
      else context.clearRect(0, 0, width, height)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      context.clearRect(0, 0, width, height)
    }
  }, [count])
  return <canvas className="confetti" ref={canvasRef} aria-hidden="true" />
}
