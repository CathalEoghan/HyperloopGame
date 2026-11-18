import { useEffect, useRef, useState } from 'react'
import './RankUpModal.css'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'
import { playClickSound2, playHoverSound } from '../utils/sound.js'

// choose: Lobbying Suavity lets the player pick the city, so the button says so.
// waiting: how many rank-ups are waiting. From 3 up, "Claim all" takes a random city for every one of them at once.
export const CLAIM_ALL_FROM = 3

// Escape does what the main button does - moves on to choosing the city - rather than closing the popup: this is the only
// way to claim the rank-up, so it can't simply be dismissed. A stray Escape is harmless: it only opens the city choice,
// which shows the cities and ignores Escape itself, so nothing is picked or paid for by it. (Never "Claim all".)
const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false } }
const CONFETTI_COLOURS = ['#f5a623', '#ffd27a', '#ffffff', '#ffefe0', '#e67e22']
const COUNT_UP_MS = 1000

// A short burst of paper from behind the rank number, drawn on one full-screen canvas that ignores the mouse and
// removes itself once everything has fallen away (or after four seconds, whichever is first).
function Confetti({ originRef }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reducedMotion()) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth, h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    const box = originRef.current?.getBoundingClientRect()
    const ox = box ? box.left + box.width / 2 : w / 2
    const oy = box ? box.top + box.height / 2 : h / 2
    const pieces = Array.from({ length: 70 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1   // mostly upwards, fanned out
      const speed = 5 + Math.random() * 9
      return {
        x: ox, y: oy,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        colour: CONFETTI_COLOURS[Math.floor(Math.random() * CONFETTI_COLOURS.length)],
      }
    })
    let frame = 0, raf = 0
    const tick = () => {
      frame++
      ctx.clearRect(0, 0, w, h)
      let alive = 0
      for (const p of pieces) {
        p.vy += 0.32            // gravity
        p.vx *= 0.99
        p.x += p.vx; p.y += p.vy; p.rot += p.vr
        if (p.y < h + 20) alive++
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.max(0, 1 - frame / 240)
        ctx.fillStyle = p.colour
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      if (alive > 0 && frame < 240) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, w, h)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [originRef])
  return <canvas ref={canvasRef} className="rankup-confetti" aria-hidden="true" />
}

// rank: the rank reached now. waiting: how many rank-ups are waiting, so the number counts up from the rank before them.
function RankUpModal({ rank = 0, onClaim, choose = false, waiting = 0, onClaimAll, onEnableAuto }) {
  useEscapeToClose(() => { playClickSound2(); onClaim() })
  const from = Math.max(1, rank - Math.max(1, waiting))
  const animate = rank > 0 && !reducedMotion()
  const [shown, setShown] = useState(animate ? from : rank)
  const stageRef = useRef(null)
  useEffect(() => {
    if (!animate) return
    const start = performance.now()
    let raf = 0
    const step = (now) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(from + (rank - from) * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [animate, from, rank])
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="reveal-heading rankup-heading">You've ranked up!</h2>
        {rank > 0 && (
          <div className="rankup-stage" ref={stageRef} role="img" aria-label={`Rank ${rank}`}>
            {animate && <><span className="rankup-ring" /><span className="rankup-ring rankup-ring-late" /></>}
            <span className="rankup-rank-label">RANK</span>
            <span className={`rankup-number ${shown === rank ? 'rankup-number-done' : ''}`}>{shown}</span>
          </div>
        )}
        <div className="rankup-actions">
          <button
            onMouseEnter={() => playHoverSound()}
            onClick={() => { playClickSound2(); onClaim(); }}
          >
            {choose ? 'Choose a City' : 'Claim City'}
          </button>
          {waiting >= CLAIM_ALL_FROM && onClaimAll && (
            <button
              onMouseEnter={() => playHoverSound()}
              onClick={() => { playClickSound2(); onClaimAll(); }}
            >
              Claim all cities, randomised ({waiting} waiting)
            </button>
          )}
        </div>
        {/* The way out for a player ranking up faster than they can click through: turns the Settings option on and
            claims everything waiting now. Never what Escape does. */}
        {onEnableAuto && (
          <>
            <button
              className="rankup-auto-btn"
              onMouseEnter={() => playHoverSound()}
              onClick={() => { playClickSound2(); onEnableAuto(); }}
            >
              Enable automatic random selection
            </button>
            <p className="rankup-auto-note">Claims every rank-up with a random city. Turn it off any time in Settings.</p>
          </>
        )}
      </div>
      {rank > 0 && <Confetti originRef={stageRef} />}
    </div>
  );
}

export default RankUpModal;
