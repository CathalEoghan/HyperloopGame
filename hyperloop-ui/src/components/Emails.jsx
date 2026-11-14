import { useState, useEffect, useRef } from 'react'
import './Emails.css'
import emailIcon from '../assets/misc/email.png'
import bellIcon from '../assets/misc/bell.png'
import reputationIcon from '../assets/misc/reputation.png'
import clockIcon from '../assets/misc/clock.png'
import closeIcon from '../assets/misc/close.png'
import BoostTooltip from './BoostTooltip.jsx'
import { playHoverSound, playClickSound2, startTypingSound } from '../utils/sound.js'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'
import { CHARACTERS, isOpen, progressLabel, timeLeft, formatLeft, readMeta, MAX_PER_DAY } from '../utils/emailEngine.js'

// Optional pictures: assets/emailPictures/thumbs/<picture name>.(jpg|png|webp), small copies of the full-size ones in
// assets/emailPictures. A character's picture name is `picture` in CHARACTERS (utils/emailEngine.js). Without one, a coloured initial.
const AVATARS = Object.fromEntries(Object.entries(import.meta.glob('../assets/emailPictures/thumbs/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' }))
    .map(([path, url]) => [path.split('/').pop().replace(/\.[^.]+$/, ''), url]))
function Avatar({ email, size = 34 }) {
    const character = CHARACTERS[email.character]
    const picture = character ? AVATARS[character.picture || character.id] : null
    const color = character?.color || '#8a7a66'
    return picture
        ? <img src={picture} alt="" className="emails-avatar" style={{ width: size, height: size }} />
        : <span className="emails-avatar emails-avatar-initial" style={{ width: size, height: size, background: color, fontSize: size * 0.45 }}>{email.sender.name.charAt(0)}</span>
}

const MailIcon = ({ size = 34 }) => <img src={emailIcon} alt="" width={size} height={size} style={{ display: 'block', border: 'none', borderRadius: 0 }} />

const Rep = ({ n }) => <span className="emails-rep"><img src={reputationIcon} alt="" />{n}</span>

// Dates the way a mail client shows them: the time for today, the day and month otherwise
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad = (n) => String(n).padStart(2, '0')
const shortTime = (ts, now) => { const d = new Date(ts), n = new Date(now); return d.toDateString() === n.toDateString() ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : `${d.getDate()} ${MONTHS[d.getMonth()]}` }
const fullTime = (ts) => { const d = new Date(ts); return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}` }
// The first words of the body without "Dear ...,", for the grey preview in the list
const snippet = (body) => body.replace(/^Dear [^\n]*\n+/, '').replace(/\s+/g, ' ').trim().slice(0, 80)
// A sender's built-in reply is stored as `Name writes: "..."`; in a thread it is just the message
const plainOutcome = (text) => text.replace(/^[^:\n]{1,40} writes: "([\s\S]*)"$/, '$1')

// Under the list: how many of today's emails have come and when the next may
function TodayFooter({ now }) {
    const meta = readMeta()
    const today = new Date(now).toDateString()
    const sent = meta.day === today ? meta.sent : 0
    const waitMin = Math.max(1, Math.ceil((meta.wait || 0) / 60000))
    return (
        <div className="emails-today">
            <b>Today: {Math.min(sent, MAX_PER_DAY)} of {MAX_PER_DAY} emails</b>
            <span>{sent >= MAX_PER_DAY ? 'That is everyone for today. More arrive tomorrow.' : meta.day === today ? `Next one in about ${waitMin} min of play.` : 'The first one arrives a few minutes into play.'}</span>
        </div>
    )
}

const STATE_TEXT = { new: 'Waiting for you', agreed: 'In progress', fulfilled: 'Done', failed: 'Missed', refused: 'Declined', ignored: 'No reply' }
const sign = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`

// Types a reply out letter by letter the first time it is shown
function Typed({ text, animate, onDone }) {
    const [n, setN] = useState(animate ? 0 : text.length)
    const doneRef = useRef(onDone)
    useEffect(() => { doneRef.current = onDone }, [onDone])
    useEffect(() => {
        if (!animate) return
        const start = Date.now()
        const stopSound = startTypingSound()
        const id = setInterval(() => {
            const shown = Math.min(text.length, Math.floor((Date.now() - start) / 14))
            setN(shown)
            if (shown >= text.length) { clearInterval(id); stopSound(); doneRef.current?.() }
        }, 30)
        return () => { clearInterval(id); stopSound(true) }
    }, [animate, text])
    return <>{text.slice(0, n)}{n < text.length && <span className="emails-caret">|</span>}</>
}

// One message in a thread, like a mail client: avatar, who it is from and to, when, then the text
function Message({ avatar, name, role, to, date, children, reply = false }) {
    return (
        <div className={`emails-msg${reply ? ' emails-msg-reply' : ''}`}>
            <div className="emails-msg-head">
                {avatar}
                <span className="emails-msg-who">
                    <span className="emails-msg-name"><b>{name}</b>{role && <span className="emails-msg-role">&lt;{role}&gt;</span>}</span>
                    <span className="emails-msg-to">to {to}</span>
                </span>
                <span className="emails-msg-date">{date}</span>
            </div>
            <div className="emails-msg-body">{children}</div>
        </div>
    )
}

export default function EmailsModal({ emails, onRespond, onRead, onClose, cult = false, muted = false, onToggleMute }) {
    useEscapeToClose(() => { playClickSound2(); onClose() })
    const sorted = [...emails].sort((a, b) => b.createdAt - a.createdAt)
    // Inbox: anything still open or not yet read. Resolved: the rest, like an archive.
    const inInbox = (e) => isOpen(e) || !e.read
    const [tab, setTab] = useState('inbox')
    const [query, setQuery] = useState('')
    const q = query.trim().toLowerCase()
    const [selectedId, setSelectedId] = useState(() => (sorted.find(e => !e.read) || sorted[0])?.id || null)
    const [typingId, setTypingId] = useState(null)
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
    const selected = emails.find(e => e.id === selectedId) || null
    // The email being read stays in the list it was opened from, even once reading it has moved it out of the Inbox
    // A search looks through every email, in both tabs, by subject or sender
    const matches = (e) => e.subject.toLowerCase().includes(q) || e.sender.name.toLowerCase().includes(q)
    const shown = q
        ? sorted.filter(matches)
        : sorted.filter(e => (tab === 'inbox') === inInbox(e) || (e.id === selectedId && !(tab === 'resolved' && isOpen(e))))
    const threadRef = useRef(null)
    const [muteTip, setMuteTip] = useState(null)
    useEffect(() => { const el = threadRef.current; if (el) el.scrollTop = el.scrollHeight }, [selected?.state, selected?.reply, typingId])
    // Opening an email starts at its top; the thread only drops to the bottom when a reply or result is added to it
    useEffect(() => { const el = threadRef.current; if (el) el.scrollTop = 0 }, [selectedId])
    useEffect(() => { if (selected && !selected.read) onRead(selected.id) }, [selected, onRead])
    const unreadCount = sorted.filter(e => !e.read).length
    const openCount = sorted.filter(inInbox).length

    const requestCard = selected?.ask ? (
        <div className="emails-request">
            <span className="emails-request-label">The request</span>
            <span className="emails-request-text">{selected.ask.charAt(0).toUpperCase() + selected.ask.slice(1)}</span>
            {selected.state === 'new'
                ? <span className="emails-request-time"><img src={clockIcon} alt="" />Answer within <b>{formatLeft(timeLeft(selected, now))}</b> · then <b>{selected.hours} hours</b> to do it</span>
                : selected.deadline ? <span className="emails-request-time"><img src={clockIcon} alt="" />Done by {new Date(selected.deadline).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span> : null}
        </div>
    ) : null

    const respond = (e, agree) => { playClickSound2(); setTypingId(e.id); onRespond(e.id, agree) }
    const pickTab = (t) => { playClickSound2(); setTab(t); const first = sorted.find(e => (t === 'inbox') === inInbox(e)); if (first) setSelectedId(first.id) }
    const senderFirst = selected ? selected.sender.name.split(' ')[0] : ''
    const replyAt = selected ? (selected.state === 'refused' ? selected.resolvedAt : selected.agreedAt || selected.createdAt) : 0

    return (
        <div className="hyperlink-overlay emails-overlay" onClick={() => { playClickSound2(); onClose() }}>
            <div className="emails-window" onClick={ev => ev.stopPropagation()} role="dialog" aria-label="Emails">
                <div className="emails-head">
                    <span className="emails-title"><MailIcon size={22} /> Mail</span>
                    <span className="emails-head-actions">
                    {onToggleMute && (
                        <button
                            className={`emails-close emails-mute${muted ? ' emails-mute-off' : ' emails-mute-on'}`}
                            onMouseEnter={e => { playHoverSound(); setMuteTip(e.currentTarget) }}
                            onMouseLeave={() => setMuteTip(null)}
                            onClick={() => { playClickSound2(); onToggleMute() }}
                            aria-label={muted ? 'Unmute notifications' : 'Mute notifications'}
                            aria-pressed={muted}
                        ><img src={bellIcon} alt="" draggable={false} /></button>
                    )}
                    <button className="emails-close emails-mute emails-mute-on" onClick={() => { playClickSound2(); onClose() }} onMouseEnter={() => playHoverSound()} aria-label="Close"><img src={closeIcon} alt="" draggable={false} /></button>
                    </span>
                </div>
                {muteTip && <BoostTooltip anchor={muteTip} lines={[muted ? 'New emails are muted. Click to turn the sound and bubble back on.' : 'New emails make a sound and show a bubble. Click to mute them.']} text />}
                <div className="emails-body">
                    <div className="emails-list">
                      <div className="emails-search">
                        <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" /><line x1="12.7" y1="12.7" x2="17.5" y2="17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by subject or sender" aria-label="Search emails" spellCheck={false}
                            onKeyDown={e => { if (e.key === 'Escape' && query) { e.preventDefault(); e.stopPropagation(); setQuery('') } }} />
                        {query && <button className="emails-search-clear" onClick={() => { playClickSound2(); setQuery('') }} aria-label="Clear search">✕</button>}
                      </div>
                      <div className="emails-tabs" role="tablist">
                        <button role="tab" aria-selected={tab === 'inbox'} className={`emails-tab${tab === 'inbox' ? ' emails-tab-on' : ''}`} onClick={() => pickTab('inbox')} onMouseEnter={() => playHoverSound()}>Inbox{unreadCount > 0 && <span className="emails-tab-count">{unreadCount}</span>}</button>
                        <button role="tab" aria-selected={tab === 'resolved'} className={`emails-tab${tab === 'resolved' ? ' emails-tab-on' : ''}`} onClick={() => pickTab('resolved')} onMouseEnter={() => playHoverSound()}>Resolved{sorted.length - openCount > 0 && <span className="emails-tab-num">{sorted.length - openCount}</span>}</button>
                      </div>
                      <div className="emails-list-rows">
                        {q && shown.length > 0 && <div className="emails-results">{shown.length} {shown.length === 1 ? 'result' : 'results'}</div>}
                        {shown.length === 0 && <div className="emails-empty">{q ? `No emails match “${query.trim()}”.` : sorted.length === 0 ? 'No emails yet. People write when they need something from the Manager.' : tab === 'inbox' ? 'You are all caught up.' : 'Nothing resolved yet.'}</div>}
                        {shown.map(e => (
                            <button key={e.id} className={`emails-row${e.id === selectedId ? ' emails-row-active' : ''}${!e.read ? ' emails-row-unread' : ''}`}
                                onClick={() => { playClickSound2(); setSelectedId(e.id) }} onMouseEnter={() => playHoverSound()}>
                                <Avatar email={e} size={36} />
                                <span className="emails-row-main">
                                    <span className="emails-row-top"><span className="emails-row-from">{e.sender.name}</span><span className="emails-row-time">{shortTime(e.createdAt, now)}</span></span>
                                    <span className="emails-row-subject">{e.subject}</span>
                                    <span className="emails-row-preview"><span className={`emails-tag emails-tag-${e.state}${e.state === 'agreed' && timeLeft(e, now) < 3600000 ? ' emails-tag-urgent' : ''}`}>{e.state === 'agreed' ? `${formatLeft(timeLeft(e, now))} left` : STATE_TEXT[e.state]}</span>{snippet(e.body)}</span>
                                </span>
                                {!e.read && <i className="emails-dot" />}
                            </button>
                        ))}
                      </div>
                      <TodayFooter now={now} />
                    </div>
                    <div className="emails-thread" ref={threadRef}>
                        {!selected && <div className="emails-empty">Select an email to read it.</div>}
                        {selected && (
                            <>
                                <div className="emails-subject-row">
                                    <h2 className="emails-subject">{selected.subject}</h2>
                                    <span className="emails-label">Inbox</span>
                                    <span className={`emails-label emails-label-${selected.state}`}>{STATE_TEXT[selected.state]}</span>
                                </div>
                                <Message avatar={<Avatar email={selected} size={40} />} name={selected.sender.name} role={selected.sender.role} to="me" date={fullTime(selected.createdAt)}>
                                    <div className="emails-text">{selected.body}</div>
                                    {selected.state !== 'new' && requestCard}
                                </Message>
                                {selected.reply && (
                                    <Message reply avatar={<span className="emails-avatar emails-avatar-me">Me</span>} name="Me" to={senderFirst} date={fullTime(replyAt)}>
                                        <div className="emails-text"><Typed key={selected.id} text={selected.reply} animate={typingId === selected.id} onDone={() => setTypingId(null)} /></div>
                                    </Message>
                                )}
                                {selected.state === 'agreed' && (
                                    <div className="emails-progress">
                                        <div className="emails-progress-row"><span>{progressLabel(selected)}</span><span>{formatLeft(timeLeft(selected, now))} left</span></div>
                                        <div className="emails-bar"><div style={{ width: `${Math.min(100, ((selected.progress || 0) / selected.target) * 100)}%` }} /></div>
                                        <div className="emails-note">Done in time: +{selected.reward} Reputation. Missed: −{selected.penalty}.</div>
                                    </div>
                                )}
                                {selected.outcome && typingId !== selected.id && (
                                    <Message avatar={<Avatar email={selected} size={40} />} name={selected.sender.name} role={selected.sender.role} to="me" date={fullTime(selected.resolvedAt || selected.createdAt)}>
                                        <div className="emails-text">{plainOutcome(selected.outcome)}</div>
                                        {Number.isFinite(selected.repChange) && selected.repChange !== 0 && <span className={`emails-chip ${selected.repChange > 0 ? 'emails-chip-up' : 'emails-chip-down'}`}><Rep n={sign(selected.repChange)} /> Reputation</span>}
                                    </Message>
                                )}
                                {selected.state === 'new' && typingId !== selected.id && (
                                    <div className="emails-decision">
                                        {requestCard}
                                        <div className="emails-stakes">
                                            <span className="emails-stakes-group"><i>Agree</i><span className="emails-chip emails-chip-up"><Rep n={`+${selected.agreeBonus}`} /> now</span><span className="emails-chip emails-chip-up"><Rep n={`+${selected.reward}`} /> if done</span><span className="emails-chip emails-chip-down"><Rep n={`−${selected.penalty}`} /> if missed</span></span>
                                            <span className="emails-stakes-group"><i>Refuse</i>{cult ? <span className="emails-chip">No penalty</span> : <span className="emails-chip emails-chip-down"><Rep n={`−${selected.refusePenalty}`} /></span>}</span>
                                        </div>
                                        <div className="emails-actions">
                                            <button className="emails-btn-agree" onClick={() => respond(selected, true)} onMouseEnter={() => playHoverSound()}>Agree</button>
                                            <button className="emails-btn-refuse" onClick={() => respond(selected, false)} onMouseEnter={() => playHoverSound()}>Refuse</button>
                                        </div>
                                        <div className="emails-note">Not answering in time counts as a refusal.</div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
