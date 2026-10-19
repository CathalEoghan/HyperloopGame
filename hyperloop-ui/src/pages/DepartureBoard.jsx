import React, { useState, useEffect, useRef } from "react"
import { createPortal } from 'react-dom'
import './DepartureBoard.css'
import { playSplitFlapLong, playSplitFlapShort, playClickSound2, playHoverSound, playAutomatedScheduleSound, playNotEnoughFundsSound } from '../utils/sound.js'
import { minutesUntilDeparture } from '../utils/time.js'
import ScheduleModal from '../components/ScheduleModal.jsx'
import { ensureDepartures, readTimetable, unscheduledCities, automateTimetable } from '../utils/timetable.js'
import { ensureSchedules, departuresKey, arrivalsKey, readSchedule, getArrivalStatus, farewellWindowMinutes } from '../utils/loops.js'

const TAB_KEY = 'terminalBoardTab'

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
    const diff = minutesUntilDeparture({ hour, minute }, Date.now() - lag * 1000)
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

function DepartureBoard({ purchasedCities, homeCity, purchasedUpgrades, openScheduleOnMount = false, onAutomated = () => {}, onClose }) {
    // How long an arrival stays lit as ARRIVED on the board — matches how long its greeting window actually
    // stays open, rather than assuming every farewell-window upgrade is owned (bug #183)
    const litMinutes = farewellWindowMinutes(purchasedUpgrades)
    const [schedule, setSchedule] = useState([])
    const [arrivals, setArrivals] = useState([])
    // Arrivals or Departures, remembered for next time
    const [tab, setTab] = useState(() => {
        try { return localStorage.getItem(TAB_KEY) === 'arrivals' ? 'arrivals' : 'departures' } catch { return 'departures' }
    })
    const tabRef = useRef(tab)
    const [renderTick, setRenderTick] = useState(0)
    const [lagMap, setLagMap] = useState({})
    const prevStatusRef = useRef({})
    const hasPlayedLongRef = useRef(false)
    const longFlapRef = useRef(null)
    const lagMapRef = useRef({})
    const [boardInitialized, setBoardInitialized] = useState(false)
    // The Schedule loop screen, how many connected cities are on the departure timetable, and the last Automate result
    const [showSchedule, setShowSchedule] = useState(openScheduleOnMount)
    const [scheduledCount, setScheduledCount] = useState(0)
    const [notice, setNotice] = useState('')

    const splitFlapEnabled = () => localStorage.getItem('splitFlap') !== 'false'
    const homeName = homeCity?.name

    const chooseTab = (next) => {
        if (next === tab) return
        playClickSound2()
        // Nothing to flip to: a board with no rows (e.g. only one city connected) just shows its empty message
        const nextHasRows = (next === 'arrivals' ? arrivals : schedule).length > 0
        if (nextHasRows && splitFlapEnabled()) playSplitFlapShort()
        setTab(next)
        tabRef.current = next
        try { localStorage.setItem(TAB_KEY, next) } catch { /* storage blocked, ignore */ }
    }

    // Each row flips a moment after the others, like a real board. Keyed by list as well as city: a city can be on both.
    const rowCount = schedule.length + arrivals.length
    useEffect(() => {
        if (rowCount === 0) return
        const keys = [...schedule.map(e => `dep|${e.name}`), ...arrivals.map(e => `arr|${e.name}`)]
        const lags = keys.map(() => 2 + Math.random() * 3.9)
        lags[Math.floor(Math.random() * lags.length)] = 6
        const newMap = {}
        keys.forEach((k, i) => { newMap[k] = lags[i] })
        lagMapRef.current = newMap
        setLagMap(newMap)
    }, [rowCount])

    useEffect(() => {
        if (rowCount > 0 && !hasPlayedLongRef.current) {
            hasPlayedLongRef.current = true
            if (splitFlapEnabled()) longFlapRef.current = playSplitFlapLong()
            setTimeout(() => setBoardInitialized(true), 6500)
        }
    }, [rowCount])

    // Closing the board stops the long flap sound, so opening it again can't layer a second one over it (bug #135)
    useEffect(() => () => {
        const audio = longFlapRef.current
        if (audio) { audio.pause(); audio.currentTime = 0 }
        longFlapRef.current = null
        hasPlayedLongRef.current = false
    }, [])

    // Today's lists, for the cities still connected, in time order
    const readLists = () => {
        const names = new Set(purchasedCities.map(c => c.name))
        const byTime = (a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute)
        return {
            deps: readSchedule(departuresKey()).filter(e => names.has(e.name)).sort(byTime),
            arrs: readSchedule(arrivalsKey()).filter(e => names.has(e.name)).sort(byTime),
        }
    }

    const countScheduled = () => {
        const names = new Set(purchasedCities.map(c => c.name))
        return readTimetable().filter(e => names.has(e.name) && e.name !== homeName).length
    }

    useEffect(() => {
        if (!purchasedCities || purchasedCities.length === 0) return
        ensureSchedules(purchasedCities)
        ensureDepartures(purchasedCities)
        const { deps, arrs } = readLists()
        setSchedule(deps)
        setArrivals(arrs)
        setScheduledCount(countScheduled())
    }, [purchasedCities])

    // After the timetable changes, today's departures are redrawn at once
    const afterScheduleChange = () => {
        setSchedule(readLists().deps)
        setScheduledCount(countScheduled())
    }

    const automate = () => {
        // Nothing to automate: the button is greyed out, and says so with the "not enough" sound
        if (purchasedCities.length > 1 && scheduledCount >= purchasedCities.length - 1) { playNotEnoughFundsSound(); return }
        playAutomatedScheduleSound()
        const waiting = unscheduledCities(purchasedCities).length
        const { added, skipped } = automateTimetable(purchasedCities)
        afterScheduleChange()
        if (added.length > 0) onAutomated()
        if (waiting === 0) setNotice('Every city already has a departure.')
        else if (added.length === 0) setNotice('There was no room left on the timetable.')
        else setNotice(`Scheduled ${added.length} loop${added.length === 1 ? '' : 's'}.${skipped > 0 ? ` ${skipped} could not be fitted in.` : ''}`)
    }

    useEffect(() => {
        const sameList = (next, prev) => next.length === prev.length && next.every((e, i) =>
            e.name === prev[i].name && e.time === prev[i].time && !!e.delayed === !!prev[i].delayed)
        const interval = setInterval(() => {
            // Read the names now: the cities list is added to in place, so a set made when the board opened would
            // leave out a city connected since (bug #166)
            const { deps, arrs } = readLists()
            const lm = lagMapRef.current
            // A change on the tab being shown flips (and clacks); one on the other tab only redraws
            let anyChanged = false, shownChanged = false
            const note = (key, state, shown) => {
                const prevStatus = prevStatusRef.current[key]
                if (prevStatus !== undefined && prevStatus !== state) { anyChanged = true; if (shown) shownChanged = true }
                prevStatusRef.current[key] = state
            }
            const onArrivals = tabRef.current === 'arrivals'
            deps.forEach(e => note(`dep|${e.name}`, getStatus(e.hour, e.minute, e.delayed, lm[`dep|${e.name}`] || 0).label, !onArrivals))
            arrs.forEach(e => {
                // Fading out counts as a change too, though the label stays ARRIVED
                const st = getArrivalStatus(e, homeName, Date.now(), lm[`arr|${e.name}`] || 0, litMinutes)
                note(`arr|${e.name}`, st.label + (st.gone ? '|gone' : ''), onArrivals)
            })
            if (shownChanged && splitFlapEnabled()) playSplitFlapShort()
            // The stored schedule is the truth: a delay, a city connected or disconnected, or a new day all show straight away (bug #166)
            setSchedule(prev => sameList(deps, prev) ? prev : deps)
            setArrivals(prev => sameList(arrs, prev) ? prev : arrs)
            setScheduledCount(countScheduled())
            if (anyChanged) setRenderTick(t => t + 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [purchasedCities, litMinutes])

    const now = new Date()
    const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' })
    const day = getOrdinal(now.getDate())
    const month = now.toLocaleDateString('en-GB', { month: 'long' })
    const year = now.getFullYear()
    const today = `for ${weekday}, ${day} ${month} ${year}`
    const isArrivals = tab === 'arrivals'
    const totalCities = Math.max(0, purchasedCities.length - 1)
    const canSchedule = totalCities > 0
    const nothingScheduled = canSchedule && scheduledCount === 0
    const everyCityScheduled = canSchedule && scheduledCount >= totalCities
    const list = isArrivals ? arrivals : schedule

    const { pairs, destWidth } = React.useMemo(() => {
        const half = Math.ceil(list.length / 2)
        const left = list.slice(0, half)
        const right = list.slice(half)
        const pairs = Array.from({ length: half }, (_, i) => [left[i], right[i]])
        // The same width on both tabs, so switching doesn't make the board jump
        const all = [...schedule, ...arrivals]
        const destWidth = Math.max(...(all.length > 0 ? all.map(e => e.name.length) : [8]), 8)
        return { pairs, destWidth }
    }, [list, schedule, arrivals, renderTick])

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
        const lag = lagMap[`${isArrivals ? 'arr' : 'dep'}|${entry.name}`] || 0
        const status = isArrivals
            ? getArrivalStatus(entry, homeName, undefined, lag, litMinutes)
            : getStatus(entry.hour, entry.minute, entry.delayed, lag)
        const isGone = isArrivals ? !!status.gone : status.label === 'DEPARTED'
        // An arrival's gate goes up as it gets close, like a departure's when it's time to go to the gate
        const showGate = isArrivals
            ? status.label === 'ARRIVING' || status.label === 'ARRIVED'
            : status.label !== 'SCHEDULED' && status.label !== 'DELAYED'
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <div className="board-heading">
                  <div className="board-tabrow">
                    <div className="board-tabs" role="tablist" aria-label="Terminal Board">
                        {[['arrivals', 'ARRIVALS'], ['departures', 'DEPARTURES']].map(([id, label]) => (
                            <button
                                key={id}
                                role="tab"
                                aria-selected={tab === id}
                                className={`board-tab${tab === id ? ' board-tab-active' : ''}`}
                                onMouseEnter={() => { if (tab !== id) playHoverSound() }}
                                onClick={() => chooseTab(id)}
                            >{label}{id === 'departures' && nothingScheduled && <span className="board-tab-dot" title="Nothing is scheduled for departure" />}</button>
                        ))}
                    </div>
                    {canSchedule && !isArrivals && (
                        <div className="board-actions">
                            <button className="board-action" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowSchedule(true) }}>SCHEDULE LOOP</button>
                            <button
                                className="board-action"
                                aria-disabled={everyCityScheduled}
                                title={everyCityScheduled ? 'Every city already has a departure' : undefined}
                                onMouseEnter={() => { if (!everyCityScheduled) playHoverSound() }}
                                onClick={automate}
                            >AUTOMATE SCHEDULE</button>
                        </div>
                    )}
                  </div>
                    {canSchedule && (isArrivals ? (
                        <div className="board-sched-status">Arrival times are handled by other terminals automatically</div>
                    ) : (
                        <div className={`board-sched-status${scheduledCount < totalCities ? ' board-sched-status-low' : ''}`}>
                            {scheduledCount} of {totalCities} {totalCities === 1 ? 'city' : 'cities'} scheduled for departure{notice ? ` · ${notice}` : ''}
                        </div>
                    ))}
                    <h2 className="board-title" style={{ margin: 0 }}>{isArrivals ? 'Arrivals' : 'Departures'} {today}</h2>
                </div>
                {onClose && (
                    <button onClick={() => { playClickSound2(); onClose() }} style={{
                        background: 'none', border: '1px solid #444', color: '#888',
                        fontFamily: 'Courier New, monospace', fontSize: '0.75rem',
                        padding: '4px 12px', borderRadius: '4px', cursor: 'var(--cursor-pointer, pointer)',
                        letterSpacing: '1px', transition: 'color 0.2s, border-color 0.2s'
                    }}
                    onMouseEnter={e => { playHoverSound(); e.target.style.color = '#f5a623'; e.target.style.borderColor = '#f5a623' }}
                    onMouseLeave={e => { e.target.style.color = '#888'; e.target.style.borderColor = '#444' }}
                    >✕ CLOSE</button>
                )}
            </div>
            {list.length === 0 ? (
                purchasedCities.length <= 1 ? (
                    <p style={{ color: '#f5a623', fontFamily: 'Courier New', marginTop: '24px' }}>
                        Connect more cities to unlock {isArrivals ? 'arrivals' : 'departures'}!
                    </p>
                ) : (
                    <p style={{ color: '#f5a623', fontFamily: 'Courier New' }}>
                        {isArrivals
                            ? 'No arrivals today. New loops will arrive tomorrow.'
                            : nothingScheduled
                                ? 'No departures are scheduled, so no loops will leave. Use Schedule loop or Automate schedule to start serving passengers.'
                                : 'No departures left today. Your timetable runs again tomorrow.'}
                    </p>
                )
            ) : (
                <table className="board-table" key={tab}>
                    <thead>
                        <tr>
                            <td className="board-header">{isArrivals ? 'FROM' : 'DESTINATION'}</td>
                            <td className="board-header board-col-inner">{isArrivals ? 'ARRIVES' : 'DEPARTS'}</td>
                            <td className="board-header board-col-inner">GATE</td>
                            <td className="board-header board-col-inner">STATUS</td>
                            <td className="board-col-divider board-header"></td>
                            <td className="board-header">{isArrivals ? 'FROM' : 'DESTINATION'}</td>
                            <td className="board-header board-col-inner">{isArrivals ? 'ARRIVES' : 'DEPARTS'}</td>
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
            {/* In the page itself, not the board: the board's pop-in animation would otherwise pin a fixed overlay to it */}
            {showSchedule && createPortal(
                <ScheduleModal
                    purchasedCities={purchasedCities}
                    onChange={afterScheduleChange}
                    onClose={() => setShowSchedule(false)}
                />,
                document.body
            )}
        </div>
    )
}

export default React.memo(DepartureBoard)