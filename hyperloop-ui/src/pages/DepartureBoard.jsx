import React, { useState, useEffect, useRef } from "react"
import './DepartureBoard.css'
import { playSplitFlapLong, playSplitFlapShort } from '../utils/sound.js'

function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const STATUS_WIDTH = 11
const GATE_WIDTH = 3

function padText(text, width, padChar = '-') {
    return text.length >= width ? text : text + padChar.repeat(width - text.length)
}

function getStatus(hour, minute, delayed, lag = 0) {
    const laggedNow = new Date(Date.now() - lag * 1000)
    const currentMinutes = laggedNow.getHours() * 60 + laggedNow.getMinutes()
    const diff = (hour * 60 + minute) - currentMinutes
    if (diff <= 0)  return { label: 'DEPARTED',    color: '#666' }
    if (diff <= 5)  return { label: 'GATE CLOSED', color: '#e74c3c' }
    if (diff <= 10) return { label: 'FINAL CALL',  color: 'red' }
    if (diff <= 30) return { label: 'BOARDING',    color: 'limegreen' }
    if (diff <= 45) return { label: 'GO TO GATE',  color: '#f5a623' }
    if (delayed)    return { label: 'DELAYED',      color: '#e74c3c' }
    return              { label: 'SCHEDULED',    color: '#aaa' }
}

const StaticText = React.memo(function StaticText({ text }) {
    return (
        <span className="flap-text">
            {text.split('').map((char, i) => (
                <span
                    key={i}
                    className={`flap-char flap-char-static${char === ' ' ? ' flap-char-space' : ''}`}
                    data-char={char === ' ' ? '' : char}
                />
            ))}
        </span>
    )
})

const FlapText = React.memo(function FlapText({ text, maxDelay = 800 }) {
    const [delays] = useState(() => text.split('').map(() => Math.floor(Math.random() * maxDelay)))
    return (
        <span className="flap-text">
            {text.split('').map((char, i) => (
                <span
                    key={i}
                    className={`flap-char${char === ' ' ? ' flap-char-space' : ''}`}
                    data-char={char === ' ' ? '' : char}
                    style={{ '--delay': `${(delays[i] ?? 0)}ms` }}
                />
            ))}
        </span>
    )
})

function DepartureBoard({ purchasedCities, homeCity, onClose }) {
    const [schedule, setSchedule] = useState([])
    const [renderTick, setRenderTick] = useState(0)
    const [lagMap, setLagMap] = useState({})
    const prevStatusRef = useRef({})
    const hasPlayedLongRef = useRef(false)
    const lagMapRef = useRef({})
    const [boardInitialized, setBoardInitialized] = useState(false)

    const splitFlapEnabled = () => localStorage.getItem('splitFlap') !== 'false'

    function generateSchedule(cities) {
        const departureCities = cities.filter(c => !homeCity || c.name !== homeCity.name)
        const shuffled = [...departureCities].sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, Math.min(100, shuffled.length))
        const totalMinutes = 24 * 60
        const minGap = 10
        const numGates = 30
        const minGateGap = 30
        const slotSize = Math.floor(totalMinutes / selected.length)
        const gateLastUsed = new Array(numGates + 1).fill(-Infinity)
        const departures = []
        selected.forEach((city, i) => {
            const slotStart = i * slotSize
            const slotEnd = Math.min(slotStart + slotSize, totalMinutes - 1)
            let minuteOfDay = slotStart + Math.floor(Math.random() * (slotEnd - slotStart))
            minuteOfDay = Math.floor(minuteOfDay / 5) * 5
            if (departures.length > 0) {
                const lastTime = departures[departures.length - 1].minuteOfDay
                if (minuteOfDay - lastTime < minGap) minuteOfDay = Math.ceil((lastTime + minGap) / 5) * 5
            }
            const availableGates = []
            for (let g = 1; g <= numGates; g++) {
                if (minuteOfDay - gateLastUsed[g] >= minGateGap) availableGates.push(g)
            }
            let gate
            if (availableGates.length > 0) {
                gate = availableGates[Math.floor(Math.random() * availableGates.length)]
            } else {
                let earliest = Infinity
                for (let g = 1; g <= numGates; g++) {
                    if (gateLastUsed[g] < earliest) { earliest = gateLastUsed[g]; gate = g }
                }
            }
            gateLastUsed[gate] = minuteOfDay
            const hour = Math.floor(minuteOfDay / 60)
            const minute = minuteOfDay % 60
            const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
            departures.push({ name: city.name, country: city.country, time: timeString, hour, minute, minuteOfDay, gate })
        })
        return departures.sort((a, b) => a.minuteOfDay - b.minuteOfDay)
    }

    const currentCityNames = new Set(purchasedCities.map(c => c.name))

    useEffect(() => {
        if (schedule.length === 0) return
        const lags = schedule.map(() => 2 + Math.random() * 3.9)
        const maxIdx = Math.floor(Math.random() * schedule.length)
        lags[maxIdx] = 6
        const newMap = {}
        schedule.forEach((entry, i) => { newMap[entry.name] = lags[i] })
        lagMapRef.current = newMap
        setLagMap(newMap)
    }, [schedule.length])

    useEffect(() => {
        if (schedule.length > 0 && !hasPlayedLongRef.current) {
            hasPlayedLongRef.current = true
            if (splitFlapEnabled()) playSplitFlapLong()
            setTimeout(() => setBoardInitialized(true), 6500)
        }
    }, [schedule.length])

    useEffect(() => {
        if (!purchasedCities || purchasedCities.length === 0) return
        const today = new Date().toDateString()
        const key = `departures_${today}`
        const saved = localStorage.getItem(key)
        if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed.length > 0 && parsed[0].gate !== undefined) {
                const filtered = parsed.filter(e => currentCityNames.has(e.name))
                if (filtered.length > 0) { setSchedule(filtered); return }
            }
        }
        let generated = generateSchedule(purchasedCities)
        const pending = JSON.parse(localStorage.getItem('hyperloop_pending_injections') || '[]')
        if (pending.length > 0) {
            const now = new Date()
            const currentMins = now.getHours() * 60 + now.getMinutes()
            const maxMins = 23 * 60 + 30
            pending.forEach(cityName => {
                if (generated.some(e => e.name === cityName)) return
                const city = purchasedCities.find(c => c.name === cityName)
                if (!city) return
                let newMinutes = Math.ceil((currentMins + 30 + Math.floor(Math.random() * 30)) / 5) * 5
                let attempts = 0
                while (attempts < 24) {
                    const clash = generated.some(e => Math.abs((e.hour * 60 + e.minute) - newMinutes) < 10)
                    if (!clash && newMinutes <= maxMins) break
                    newMinutes += 5; attempts++
                }
                if (newMinutes > maxMins) return
                const usedGates = new Set(generated.map(e => e.gate))
                let gate = Math.floor(Math.random() * 30) + 1
                for (let g = 1; g <= 30; g++) { if (!usedGates.has(g)) { gate = g; break } }
                const hour = Math.floor(newMinutes / 60)
                const minute = newMinutes % 60
                const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
                generated.push({ name: city.name, country: city.country, time: timeString, hour, minute, minuteOfDay: newMinutes, gate })
            })
            generated = generated.sort((a, b) => a.minuteOfDay - b.minuteOfDay)
            localStorage.removeItem('hyperloop_pending_injections')
        }
        if (generated.length > 0) { localStorage.setItem(key, JSON.stringify(generated)); setSchedule(generated) }
    }, [purchasedCities])

    useEffect(() => {
        const interval = setInterval(() => {
            const today = new Date().toDateString()
            const saved = localStorage.getItem(`departures_${today}`)
            if (!saved) return
            const parsed = JSON.parse(saved)
            if (!parsed.length) return
            const filtered = parsed.filter(e => currentCityNames.has(e.name))
            const lm = lagMapRef.current
            let anyChanged = false
            filtered.forEach(entry => {
                const lag = lm[entry.name] || 0
                const currentStatus = getStatus(entry.hour, entry.minute, entry.delayed, lag).label
                const prevStatus = prevStatusRef.current[entry.name]
                if (prevStatus !== undefined && prevStatus !== currentStatus) {
                    anyChanged = true
                    if (splitFlapEnabled()) playSplitFlapShort()
                }
                prevStatusRef.current[entry.name] = currentStatus
            })
            if (anyChanged) setRenderTick(t => t + 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [purchasedCities])

    const now = new Date()
    const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' })
    const day = getOrdinal(now.getDate())
    const month = now.toLocaleDateString('en-GB', { month: 'long' })
    const year = now.getFullYear()
    const today = `for ${weekday}, ${day} ${month} ${year}`

    const { pairs, destWidth } = React.useMemo(() => {
        const half = Math.ceil(schedule.length / 2)
        const left = schedule.slice(0, half)
        const right = schedule.slice(half)
        const pairs = Array.from({ length: half }, (_, i) => [left[i], right[i]])
        const destWidth = Math.max(...(schedule.length > 0 ? schedule.map(e => e.name.length) : [8]), 8)
        return { pairs, destWidth }
    }, [schedule, renderTick])

    const renderCells = (entry) => {
        const enabled = splitFlapEnabled()
        if (!entry) return (
            <>
                <td className="flip-cell"><div className="flip-card"><StaticText text={'-'.repeat(destWidth)} /></div></td>
                <td className="flip-cell board-col-inner"><div className="flip-card"><StaticText text={'-----'} /></div></td>
                <td className="flip-cell board-col-inner"><div className="flip-card"><StaticText text={'---'} /></div></td>
                <td className="flip-cell board-col-inner"><div className="flip-card"><StaticText text={'-'.repeat(STATUS_WIDTH)} /></div></td>
            </>
        )
        const lag = lagMap[entry.name] || 0
        const status = getStatus(entry.hour, entry.minute, entry.delayed, lag)
        const isGone = status.label === 'DEPARTED'
        const showGate = status.label !== 'SCHEDULED' && status.label !== 'DELAYED'
        const gateText = padText(showGate ? `-${String(entry.gate).padStart(2, '0')}` : '---', GATE_WIDTH)
        return (
            <>
                <td className="flip-cell" style={{ opacity: isGone ? 0.4 : 1 }}>
                    <div className="flip-card">
                        <StaticText text={padText(entry.name.toUpperCase(), destWidth)} />
                    </div>
                </td>
                <td className="flip-cell board-col-inner" style={{ opacity: isGone ? 0.4 : 1 }}>
                    <div className="flip-card"><StaticText text={entry.time} /></div>
                </td>
                <td className="flip-cell board-col-inner" style={{ opacity: isGone ? 0.4 : 1 }}>
                    <div className="flip-card" key={showGate ? `gate-${entry.gate}` : 'gate-hidden'}>
                        {enabled
                            ? <FlapText text={gateText} maxDelay={boardInitialized ? 800 : 5500} />
                            : <StaticText text={gateText} />}
                    </div>
                </td>
                <td className="flip-cell board-col-inner" style={{ opacity: isGone ? 0.4 : 1 }}>
                    <div className="flip-card" key={status.label}>
                        {enabled
                            ? <FlapText text={padText(status.label, STATUS_WIDTH)} maxDelay={boardInitialized ? 800 : 5500} />
                            : <StaticText text={padText(status.label, STATUS_WIDTH)} />}
                    </div>
                </td>
            </>
        )
    }

    return (
        <div className="departure-board">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 className="board-title" style={{ margin: 0 }}>Departures {today}</h2>
                {onClose && (
                    <button onClick={onClose} style={{
                        background: 'none', border: '1px solid #444', color: '#888',
                        fontFamily: 'Courier New, monospace', fontSize: '0.75rem',
                        padding: '4px 12px', borderRadius: '4px', cursor: 'pointer',
                        letterSpacing: '1px', transition: 'color 0.2s, border-color 0.2s'
                    }}
                    onMouseEnter={e => { e.target.style.color = '#f5a623'; e.target.style.borderColor = '#f5a623' }}
                    onMouseLeave={e => { e.target.style.color = '#888'; e.target.style.borderColor = '#444' }}
                    >✕ CLOSE</button>
                )}
            </div>
            {schedule.length === 0 ? (
                purchasedCities.length <= 1 ? (
                    <p style={{ color: '#f5a623', fontFamily: 'Courier New', marginTop: '24px' }}>
                        Connect more cities to unlock departures!
                    </p>
                ) : (
                    <p style={{ color: '#f5a623', fontFamily: 'Courier New' }}>Loading departures...</p>
                )
            ) : (
                <table className="board-table">
                    <thead>
                        <tr>
                            <td className="board-header">DESTINATION</td>
                            <td className="board-header board-col-inner">DEPARTS</td>
                            <td className="board-header board-col-inner">GATE</td>
                            <td className="board-header board-col-inner">STATUS</td>
                            <td className="board-col-divider board-header"></td>
                            <td className="board-header">DESTINATION</td>
                            <td className="board-header board-col-inner">DEPARTS</td>
                            <td className="board-header board-col-inner">GATE</td>
                            <td className="board-header board-col-inner">STATUS</td>
                        </tr>
                    </thead>
                    <tbody>
                        {pairs.map(([l, r], i) => (
                            <tr key={i}>
                                {renderCells(l)}
                                <td className="board-col-divider"></td>
                                {renderCells(r)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default React.memo(DepartureBoard)