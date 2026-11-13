import { useState, useEffect, useRef } from 'react'
import './Emails.css'
import emailIcon from '../assets/misc/email.png'
import bellIcon from '../assets/misc/bell.png'
import BoostTooltip from './BoostTooltip.jsx'
import { playHoverSound, playClickSound2 } from '../utils/sound.js'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'
import { CHARACTERS, isOpen, progressLabel, timeLeft, formatLeft } from '../utils/emailEngine.js'

// Optional pictures: assets/email-avatars/<character id>.(jpg|png|webp). Without one, a coloured initial.
const AVATARS = Object.fromEntries(Object.entries(import.meta.glob('../assets/email-avatars/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' }))
    .map(([path, url]) => [path.split('/').pop().replace(/\.[^.]+$/, ''), url]))
function Avatar({ email, size = 34 }) {
    const picture = email.character ? AVATARS[email.character] : null
    const color = CHARACTERS[email.character]?.color || '#8a7a66'
    return picture
        ? <img src={picture} alt="" className="emails-avatar" style={{ width: size, height: size }} />
        : <span className="emails-avatar emails-avatar-initial" style={{ width: size, height: size, background: color, fontSize: size * 0.45 }}>{email.sender.name.charAt(0)}</span>
}

const MailIcon = ({ size = 34 }) => <img src={emailIcon} alt="" width={size} height={size} style={{ display: 'block', border: 'none', borderRadius: 0 }} />

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
        const id = setInterval(() => {
            const shown = Math.min(text.length, Math.floor((Date.now() - start) / 14))
            setN(shown)
            if (shown >= text.length) { clearInterval(id); doneRef.current?.() }
        }, 30)
        return () => clearInterval(id)
    }, [animate, text])
    return <>{text.slice(0, n)}{n < text.length && <span className="emails-caret">|</span>}</>
}

export default function EmailsModal({ emails, onRespond, onRead, onClose, cult = false, muted = false, onToggleMute }) {
    useEscapeToClose(() => { playClickSound2(); onClose() })
    const sorted = [...emails].sort((a, b) => b.createdAt - a.createdAt)
    const [selectedId, setSelectedId] = useState(() => (sorted.find(e => !e.read) || sorted[0])?.id || null)
    const [typingId, setTypingId] = useState(null)
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
    const selected = emails.find(e => e.id === selectedId) || null
    const threadRef = useRef(null)
    const [muteTip, setMuteTip] = useState(null)
    useEffect(() => { const el = threadRef.current; if (el) el.scrollTop = el.scrollHeight }, [selected?.state, selected?.reply])
    useEffect(() => { if (selected && !selected.read) onRead(selected.id) }, [selected, onRead])
    const unreadOthers = sorted.filter(e => !e.read).length

    const respond = (e, agree) => { playClickSound2(); setTypingId(e.id); onRespond(e.id, agree) }

    return (
        <div className="hyperlink-overlay emails-overlay" onClick={() => { playClickSound2(); onClose() }}>
            <div className="emails-window" onClick={ev => ev.stopPropagation()} role="dialog" aria-label="Emails">
                <div className="emails-head">
                    <span className="emails-title"><MailIcon size={20} /> Inbox{unreadOthers > 0 ? ` (${unreadOthers})` : ''}</span>
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
                    <button className="emails-close" onClick={() => { playClickSound2(); onClose() }} onMouseEnter={() => playHoverSound()} aria-label="Close">✕</button>
                    </span>
                </div>
                {muteTip && <BoostTooltip anchor={muteTip} lines={[muted ? 'New emails are muted. Click to turn the sound and bubble back on.' : 'New emails make a sound and show a bubble. Click to mute them.']} text />}
                <div className="emails-body">
                    <div className="emails-list">
                        {sorted.length === 0 && <div className="emails-empty">No emails yet. People write when they need something from the Manager.</div>}
                        {sorted.map(e => (
                            <button key={e.id} className={`emails-row${e.id === selectedId ? ' emails-row-active' : ''}${!e.read ? ' emails-row-unread' : ''}`}
                                onClick={() => { playClickSound2(); setSelectedId(e.id) }} onMouseEnter={() => playHoverSound()}>
                                <Avatar email={e} size={34} />
                                <span className="emails-row-main">
                                    <span className="emails-row-top"><span className="emails-row-from">{!e.read && <i className="emails-dot" />}{e.sender.name}</span><span className={`emails-tag emails-tag-${e.state}`}>{STATE_TEXT[e.state]}</span></span>
                                    <span className="emails-row-subject">{e.subject}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="emails-thread" ref={threadRef}>
                        {!selected && <div className="emails-empty">Select an email to read it.</div>}
                        {selected && (
                            <>
                                <div className="emails-msg">
                                    <div className="emails-msg-head"><span className="emails-from"><Avatar email={selected} size={40} /><span><b>{selected.sender.name}</b><br /><span>{selected.sender.role}</span></span></span></div>
                                    <div className="emails-subject">{selected.subject}</div>
                                    <div className="emails-text">{selected.body}</div>
                                </div>
                                {selected.reply && (
                                    <div className="emails-msg emails-msg-reply">
                                        <div className="emails-msg-head"><b>You</b><span>Reply</span></div>
                                        <div className="emails-text"><Typed text={selected.reply} animate={typingId === selected.id} onDone={() => setTypingId(null)} /></div>
                                    </div>
                                )}
                                {selected.state === 'new' && typingId !== selected.id && (
                                    <div className="emails-actions">
                                        <button className="emails-btn-agree" onClick={() => respond(selected, true)} onMouseEnter={() => playHoverSound()}>Agree <small>+{selected.agreeBonus} Rep now, +{selected.reward} if done, −{selected.penalty} if missed</small></button>
                                        <button className="emails-btn-refuse" onClick={() => respond(selected, false)} onMouseEnter={() => playHoverSound()}>Refuse <small>{cult ? 'No penalty' : `−${selected.refusePenalty} Rep`}</small></button>
                                    </div>
                                )}
                                {selected.state === 'new' && <div className="emails-note">No answer within {formatLeft(timeLeft(selected, now))} counts as a refusal.</div>}
                                {selected.state === 'agreed' && (
                                    <div className="emails-progress">
                                        <div className="emails-progress-row"><span>{progressLabel(selected)}</span><span>{formatLeft(timeLeft(selected, now))} left</span></div>
                                        <div className="emails-bar"><div style={{ width: `${Math.min(100, ((selected.progress || 0) / selected.target) * 100)}%` }} /></div>
                                        <div className="emails-note">Done in time: +{selected.reward} Reputation. Missed: −{selected.penalty}.</div>
                                    </div>
                                )}
                                {selected.outcome && (
                                    <div className={`emails-outcome emails-outcome-${selected.state}`}>
                                        {selected.outcome}
                                        {Number.isFinite(selected.repChange) && selected.repChange !== 0 && <b> {sign(selected.repChange)} Reputation</b>}
                                    </div>
                                )}
                                {isOpen(selected) ? null : <div className="emails-note">{selected.state === 'fulfilled' ? 'Request fulfilled.' : ''}</div>}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
