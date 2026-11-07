// The Work button's sounds (and the Shop's Work previews) let each click ring out instead of cutting the one before
// it off. Cutting the old click short is what made fast tapping feel stilted. Left completely alone, though, long
// samples stack into one harsh screech. So every new click quietens the ones already sounding, a step each: the
// newest plays at full volume, the one before at DUCK, the one before that at DUCK squared, and so on. The tails
// are still there, but they fall away beneath the new click instead of adding to it. Past MAX_VOICES the oldest is
// faded out (it is nearly silent by then, so nobody hears it go).
//
// Volumes change smoothly (a short ramp, never a jump) because an instant change of volume clicks and pops.

const MAX_VOICES = 4
const DUCK = 0.5
const DUCK_TIME_MS = 45      // how quickly an older click settles to its quieter level
const LEAVE_TIME_MS = 60     // how quickly a click past MAX_VOICES, or a stopped preview, fades away
const SILENT = 0.02

export function createVoiceManager({ now = () => performance.now(), raf = cb => requestAnimationFrame(cb) } = {}) {
    let voices = []   // oldest first: { audio, base, gain, target, leaving, preview }
    let running = false
    let last = 0

    function retarget() {
        let rank = 0
        for (let i = voices.length - 1; i >= 0; i--) {
            const v = voices[i]
            if (v.leaving) continue
            if (rank >= MAX_VOICES) { v.leaving = true; v.target = 0 } else v.target = DUCK ** rank
            rank++
        }
    }

    function frame() {
        const t = now()
        const dt = Math.max(0, t - last)
        last = t
        let moving = false
        for (const v of voices) {
            if (v.audio.paused || v.audio.ended) continue
            const k = 1 - Math.exp(-dt / (v.leaving ? LEAVE_TIME_MS : DUCK_TIME_MS))
            v.gain += (v.target - v.gain) * k
            if (v.leaving && v.gain < SILENT) { v.audio.pause(); continue }
            v.audio.volume = Math.min(1, Math.max(0, v.base * v.gain))
            if (Math.abs(v.target - v.gain) > 0.003) moving = true
        }
        voices = voices.filter(v => !v.audio.paused && !v.audio.ended)
        if (moving) raf(frame)
        else running = false
    }

    function kick() {
        if (running) return
        running = true
        last = now()
        raf(frame)
    }

    return {
        // Adds a click that has just started playing (at full volume) and quietens the ones before it
        add(audio, { preview = false } = {}) {
            if (!audio || voices.some(v => v.audio === audio)) return
            voices = voices.filter(v => !v.audio.paused && !v.audio.ended)
            voices.push({ audio, base: audio.volume, gain: 1, target: 1, leaving: false, preview })
            retarget()
            kick()
        },
        // Fades out Shop previews (the Shop has closed, or moved to another category). Real Work clicks are left alone.
        stopPreviews() {
            let any = false
            for (const v of voices) if (v.preview && !v.leaving) { v.leaving = true; v.target = 0; any = true }
            if (any) kick()
        },
        count: () => voices.length,
    }
}
