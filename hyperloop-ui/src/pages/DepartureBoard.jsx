import { useState, useEffect } from "react"
import './DepartureBoard.css'

function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function FlapText({ text }) {
    return (
        <span className="flap-text">
            {text.split('').map((char, i) =>
                char === ' '
                    ? <span key={i} className="flap-space"> </span>
                    : <span key={i} className="flap-char">{char}</span>
            )}
        </span>
    )
}

function DepartureBoard({ purchasedCities, homeCity }) {
    const [schedule, setSchedule] = useState([])
    const [, setTick] = useState(0)

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

    function getStatus(hour, minute, delayed) {
        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const diff = (hour * 60 + minute) - currentMinutes
        if (diff <= 0)  return { label: 'DEPARTED',    color: '#666' }
        if (diff <= 5)  return { label: 'GATE CLOSED', color: '#e74c3c' }
        if (diff <= 10) return { label: 'FINAL CALL',  color: 'red' }
        if (diff <= 30) return { label: 'BOARDING',    color: 'limegreen' }
        if (diff <= 45) return { label: 'GO TO GATE',  color: '#f5a623' }
        if (delayed)    return { label: 'DELAYED',      color: '#e74c3c' }
        return              { label: 'SCHEDULED',    color: '#aaa' }
    }

    const currentCityNames = new Set(purchasedCities.map(c => c.name))

    useEffect(() => {
        if (!purchasedCities || purchasedCities.length === 0) return

        const today = new Date().toDateString()
        const key = `departures_${today}`
        const saved = localStorage.getItem(key)

        if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed.length > 0 && parsed[0].gate !== undefined) {
                // Filter to only currently connected cities
                const filtered = parsed.filter(e => currentCityNames.has(e.name))
                if (filtered.length > 0) {
                    setSchedule(filtered)
                    return
                }
            }
        }

        const generated = generateSchedule(purchasedCities)
        if (generated.length > 0) {
            localStorage.setItem(key, JSON.stringify(generated))
            setSchedule(generated)
        }
    }, [purchasedCities])

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1)
            const today = new Date().toDateString()
            const saved = localStorage.getItem(`departures_${today}`)
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed.length > 0) {
                    // Always filter to current cities on reload
                    const filtered = parsed.filter(e => currentCityNames.has(e.name))
                    setSchedule(filtered)
                }
            }
        }, 30000)
        return () => clearInterval(interval)
    }, [purchasedCities])

    const now = new Date()
    const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' })
    const day = getOrdinal(now.getDate())
    const month = now.toLocaleDateString('en-GB', { month: 'long' })
    const year = now.getFullYear()
    const today = `for ${weekday}, ${day} ${month} ${year}`
    const half = Math.ceil(schedule.length / 2)
    const left = schedule.slice(0, half)
    const right = schedule.slice(half)
    const pairs = Array.from({ length: half }, (_, i) => [left[i], right[i]])

    const renderCells = (entry) => {
        if (!entry) return <><td/><td/><td/><td/></>
        const status = getStatus(entry.hour, entry.minute, entry.delayed)
        const isGone = status.label === 'DEPARTED'
        const showGate = status.label !== 'SCHEDULED' && status.label !== 'DELAYED'
        return (
            <>
                <td style={{ opacity: isGone ? 0.4 : 1 }}><FlapText text={entry.name.toUpperCase()} /></td>
                <td style={{ opacity: isGone ? 0.4 : 1 }}><FlapText text={entry.time} /></td>
                <td style={{ opacity: isGone ? 0.4 : 1 }}><FlapText text={showGate ? String(entry.gate) : '--'} /></td>
                <td className="flip-cell" style={{ opacity: isGone ? 0.4 : 1 }}>
                    <div className="flip-card" key={status.label}>
                        <FlapText text={status.label} />
                    </div>
                </td>
            </>
        )
    }

    return (
        <div className="departure-board">
            <h2 className="board-title">Departures {today}</h2>
            {schedule.length === 0 ? (
                <p style={{ color: '#f5a623', fontFamily: 'Courier New' }}>Loading departures...</p>
            ) : (
                <table className="board-table">
                    <thead>
                        <tr>
                            <td className="board-header">DESTINATION</td>
                            <td className="board-header">DEPARTS</td>
                            <td className="board-header">GATE</td>
                            <td className="board-header">STATUS</td>
                            <td className="board-col-divider board-header"></td>
                            <td className="board-header">DESTINATION</td>
                            <td className="board-header">DEPARTS</td>
                            <td className="board-header">GATE</td>
                            <td className="board-header">STATUS</td>
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

export default DepartureBoard