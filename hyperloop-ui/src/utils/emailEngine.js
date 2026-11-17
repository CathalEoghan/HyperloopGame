// Emails: now and then someone asks the Manager (the player) for something. The player Agrees or Refuses, and a reply is
// written in their name. After agreeing there is a deadline; meeting it pays Reputation, missing it costs Reputation.
//
// Everything here is plain data in and out so it can be tested without the game. App.jsx owns the state: it keeps the
// list in localStorage (EMAILS_KEY), feeds `snapshot()` numbers in once a second, and applies the Reputation changes.
// Base amounts (before scaling): refuse -5, agree +5, fulfil +25, fail -25. `scaleFor` grows them with the terminal.
import { DEVELOPMENT_MILESTONES } from '../data/developmentMilestones.js'
import { EMAILS, ONLY_WRITTEN } from '../data/emailText.js'
import { FIRST_NAMES_MALE, FIRST_NAMES_FEMALE, SURNAMES } from '../data/hyperLinkData.js'
import { BIG_NUMBER_TIERS, scaleToTier } from './bigNumbers.js'

export const EMAILS_KEY = 'hyperloop_emails'
export const EMAIL_META_KEY = 'hyperloop_email_meta'
export const PLAYER_NAME_KEY = 'hyperloop_player_name'
export const PLAYER_TITLE_KEY = 'hyperloop_player_title'
export const PLAYER_TITLES = ['Mr.', 'Mrs.', 'Miss', 'Master', 'Mx.', 'Dr.']
// The recurring senders: their names (chosen once, kept for good) and how the player last answered each
export const CAST_KEY = 'hyperloop_email_cast'

// Like daily quests: up to 3 a day, reset at midnight (the player's own clock). The first comes 5-10 minutes into the day's play,
// the second and third 10-15 minutes after the one before. These timers only run while the game is open.
export const MAX_PER_DAY = 3
const MIN = 60000
// A request nobody answers counts as a refusal after this long
export const IGNORE_AFTER_MS = 24 * 3600000
const HOUR = 3600000
const KEEP_RESOLVED = 25

export const BASE = { refuse: 5, agree: 5, fulfil: 25, fail: 25 }

// Scale the base amounts to the terminal: about 2% of current Reputation, never below the base amounts, never above 20x
export const scaleFor = (reputation) => Math.min(20, Math.max(1, (Number(reputation) || 0) * 0.02 / 25))
const roundAmount = (n) => n >= 100 ? Math.round(n / 5) * 5 : Math.round(n)
export const amountsFor = (reputation) => {
    const f = scaleFor(reputation)
    return { refuse: roundAmount(BASE.refuse * f), agree: roundAmount(BASE.agree * f), fulfil: roundAmount(BASE.fulfil * f), fail: roundAmount(BASE.fail * f) }
}

const pick = (list, rnd = Math.random) => list[Math.floor(rnd() * list.length)]
const between = (lo, hi, rnd = Math.random) => lo + Math.floor(rnd() * (hi - lo + 1))
// Round a big number to something people would write
const niceRound = (n) => {
    if (n < 100) return Math.max(1, Math.round(n))
    const mag = Math.pow(10, Math.floor(Math.log10(n)) - 1)
    return Math.max(mag, Math.round(n / mag) * mag)
}
export const formatCount = (n) => Number(n).toLocaleString('en-GB')
// Money in the words the top bar uses: £8,200, then £1.5 million, £2 billion, £3.4 trillion ... (bigNumbers.js), with one
// decimal place at most and none when it is a round number. A size with no name is written in scientific notation.
export const formatCash = (n) => {
    const v = Number(n) || 0
    if (v < 1e6) return `£${formatCount(Math.round(v))}`
    const { tier, scaled } = scaleToTier(v, 1)
    const name = BIG_NUMBER_TIERS[tier]?.[0]
    if (!name) return `£${v.toExponential(1)}`
    return `£${Number(scaled.toFixed(1)).toLocaleString('en-GB', { maximumFractionDigits: 1 })} ${name}`
}

// ---- recurring characters ---------------------------------------------------------------------------------------
// Each has a voice (how requests are worded, how replies and results are answered) and the kinds of request they tend to
// send. `last` (how the player treated their previous request) is remembered in the cast and mentioned in the next email.
// Their pictures are optional files in assets/emailPictures/thumbs/<picture>.(jpg|png|webp) (see Emails.jsx); without one a coloured initial is shown.
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1)
export const CHARACTERS = {
    inspector: {
        id: 'inspector', picture: 'healthInspector', gender: 'f', role: 'Health & Safety Inspector', color: '#ff9edf',
        affinity: ['greet', 'farewell', 'rename', 'upgradeDev', 'schedule'],
        intros: [
            (ask) => `Hello hello! I hope your day is going brilliantly! Could you ${ask}? Pretty please!`,
            (ask) => `Quick favour! Would you be able to ${ask}? That would be fantastic!`,
            (ask) => `Hi there! Me again! I was just thinking it would be lovely if you could ${ask}!`,
        ],
        deadline: (t) => `Could it be done within ${t} of you saying yes? Thank you!`,
        outros: ['Thank you so much!!', 'You are a star!', 'Have the most wonderful day!'],
        signoff: 'Warmest wishes,',
        after: { fulfilled: 'You were wonderful last time!', failed: 'No worries about last time, we all have off days!', refused: 'I was a teeny bit sad when you said no last time, but I am back!', ignored: 'I did not hear back last time, but I am sure you were busy!' },
        outcome: { fulfilled: 'Amazing!! You are a star!', failed: 'Oh dear, that did not happen in time! Never mind!', refused: 'No worries at all! Maybe next time!', ignored: 'I did not hear back, but that is totally OK!' },
    },
    complainer: {
        id: 'complainer', picture: 'dissatisfiedCustomer', gender: 'f', role: 'Dissatisfied Customer', color: '#a0306a',
        affinity: ['like', 'work', 'rep', 'shop', 'greet', 'farewell'],
        intros: [
            (ask) => `I have to say, this is not the first time I have had to write. Could you ${ask}?`,
            (ask) => `I am sure I am not the only one who thinks so. Please ${ask}.`,
            (ask) => `I would like to speak to whoever is in charge. That is you, so please ${ask}.`,
        ],
        deadline: (t) => `I expect it within ${t} of you agreeing, not a minute later.`,
        outros: ['I will be keeping an eye on this.', 'I really should not have to ask.', 'I hope this is taken seriously.'],
        signoff: 'Disappointed regards,',
        after: { fulfilled: 'Thank you for listening last time. For once.', failed: 'Last time nothing happened, as usual.', refused: 'You brushed me off last time. I noticed.', ignored: 'You did not even reply last time.' },
        outcome: { fulfilled: 'Well. That is an improvement.', failed: 'Typical. Just typical.', refused: 'Of course. Of course you will not.', ignored: 'No reply. Typical.' },
    },
    fan: {
        id: 'fan', gender: 'any', role: 'Fan Club Chair', color: '#d4552f',
        affinity: ['work', 'payUpfront', 'upgradeDevCategory', 'connectCountries', 'rename', 'build', 'milestone', 'claimRewards'],
        intros: [
            (ask) => `I have been keeping a record of everything you do, in a normal way, and I think it is time you ${ask}.`,
            (ask) => `The club voted on it, and it was unanimous. I was the only one voting. Could you ${ask}?`,
            (ask) => `I do not want to alarm you, but I know you have been thinking about this. Would you ${ask}?`,
        ],
        deadline: (t) => `I will be waiting by the inbox for ${t}. I have brought a flask.`,
        outros: ['I am always nearby.', 'I have made you a banner.', 'I would never tell anyone you said yes.'],
        signoff: 'Your biggest fan,',
        after: { fulfilled: 'I have framed what you did last time. It is on the wall, beside the others.', failed: 'It did not happen last time. I am not upset. I have simply stopped sleeping.', refused: 'You said no last time. I read it eleven times, and the answer did not change.', ignored: 'I checked my inbox 400 times for you last time. The flask is empty now.' },
        outcome: { fulfilled: 'I have told the club. We are all crying, in a happy way.', failed: 'It is fine. I am fine. I am so fine, and I am still here.', refused: 'That is perfectly all right. I will simply ask again, differently.', ignored: 'No reply, but I will wait. I am very good at waiting.' },
    },
    assistant: {
        id: 'assistant', gender: 'any', role: 'Personal Assistant', color: '#4a7a9b',
        affinity: ['schedule', 'upgradeCity', 'upgradeDev', 'work', 'rename', 'rep', 'cash'],
        intros: [
            (ask) => `Just a note from your desk: it would be helpful if you could ${ask}.`,
            (ask) => `I have gone through your list for today. One item is to ${ask}.`,
            (ask) => `A reminder from me: please ${ask} when you have a moment.`,
        ],
        deadline: (t) => `Suggested time frame: ${t} after you confirm.`,
        outros: ['Let me know and I will make a note of it.', 'I will keep track of it for you.', 'That is all from me for now.'],
        signoff: 'Best,',
        after: { fulfilled: 'That went well last time, thank you.', failed: 'Last item did not get done, so I have carried it over.', refused: 'I have crossed the last one off, as requested.', ignored: 'The last one is still unanswered, so I have closed it.' },
        outcome: { fulfilled: 'Done and noted. Thank you.', failed: 'Not completed in time. I have noted it.', refused: 'Understood. I have removed it from your list.', ignored: 'No reply, so I have closed it.' },
    },
    security: {
        id: 'security', gender: 'any', role: 'Head of Security', color: '#3b4a45',
        affinity: ['build', 'connectCities', 'upgradeCity', 'schedule', 'rankUp', 'connectContinent', 'upgradeDevCategory', 'work', 'refuseDelay', 'negativeEvents', 'payUpfront'],
        intros: [
            (ask) => `I cannot say much, the line may not be secure. But I need you to ${ask}. Ask no questions.`,
            (ask) => `Somebody is behind this, and I will find out who. In the meantime, ${ask}. It is all connected.`,
            (ask) => `Coincidence? I think not. Do what I say and ${ask}, before THEY notice.`,
        ],
        deadline: (t) => `You have ${t} from the moment you agree. After that it may be too late.`,
        outros: ['Delete this email after reading.', 'Trust no one. Except me.', 'Do not mention this to anyone.'],
        signoff: 'Eyes open,',
        after: { fulfilled: 'You came through last time. Either you are on our side, or you are very good.', failed: 'Last time it did not get done. Suspicious, is it not?', refused: 'You refused last time. I have noted that. I note everything.', ignored: 'No reply last time. Somebody got to you, did they not?' },
        outcome: { fulfilled: 'It is done. But who benefits? I will be watching.', failed: 'Too late. This is exactly what THEY wanted.', refused: 'Refused. Interesting. Very interesting.', ignored: 'Silence. That says more than words.' },
    },
    marketing: {
        id: 'marketing', gender: 'any', role: 'Head of Marketing', color: '#e0457b',
        affinity: ['like', 'greet', 'farewell', 'rep', 'shop', 'rename', 'work', 'connectTier3'],
        intros: [
            (ask) => `Big news, and I want us to move the needle on this: let us ${ask}. Think of the buzz!`,
            (ask) => `Circling back with a quick win for the brand. Can you ${ask}? It would really elevate us.`,
            (ask) => `The vision is clear and the audience is ready. All we need is for you to ${ask}!`,
        ],
        deadline: (t) => `Let us land this within ${t} of you giving the green light.`,
        outros: ['Let us make some noise!', 'This is going to be huge.', 'Synergy, people!'],
        signoff: 'Onwards and upwards,',
        after: { fulfilled: 'The last campaign absolutely smashed it, thank you!', failed: 'The last one did not land, but we will pivot!', refused: 'Last time you passed on our idea, but I am not giving up on the vision!', ignored: 'I did not hear back on the last one, but I am sure it is in the pipeline!' },
        outcome: { fulfilled: 'Smashed it! That is going straight into the deck!', failed: 'We missed the window. Let us regroup and pivot!', refused: 'No problem, we will circle back to this!', ignored: 'No reply, so we will park it for now!' },
    },
    cfo: {
        id: 'cfo', gender: 'm', role: 'Chief Financial Officer', color: '#4a6b4f',
        affinity: ['cash', 'rep', 'work', 'shop', 'schedule', 'upgradeDev'],
        intros: [
            (ask) => `I have been through the figures. The numbers are clear: you should ${ask}.`,
            (ask) => `Looking at the quarter, the sensible course is to ${ask}. The alternative does not add up.`,
            (ask) => `I will keep this short, as time is money: ${ask}.`,
        ],
        deadline: (t) => `The window for this closes ${t} after you confirm.`,
        outros: ['I will be reviewing the results.', 'Every figure counts.', 'Please keep the receipts.'],
        signoff: 'Regards,',
        after: { fulfilled: 'Last time the numbers came in as projected. Good.', failed: 'Last time the numbers fell short. I noted it.', refused: 'You declined last time. The ledger remembers.', ignored: 'My last request went unanswered. That is a variance I do not like.' },
        outcome: { fulfilled: 'The figures are satisfactory.', failed: 'The target was missed. That will show in the accounts.', refused: 'Noted. I will adjust my forecast.', ignored: 'No reply. I have written it off.' },
    },
    lawyer: {
        id: 'lawyer', gender: 'm', role: 'Legal Executive', color: '#3a3f55',
        affinity: ['rankUp', 'upgradeCity', 'upgradeDev', 'schedule', 'connectCities', 'connectTier3', 'holdRep', 'holdCash', 'clearInbox', 'build'],
        intros: [
            (ask) => `I will be direct, as it saves us both time: I would like you to ${ask}.`,
            (ask) => `To be upfront about it, the sensible course here is to ${ask}. I would rather say so now than later.`,
            (ask) => `I will get straight to the point. Please ${ask}. I would be grateful.`,
        ],
        deadline: (t) => `I would need this done within ${t} of your agreeing.`,
        outros: ['Thank you for your time, as always.', 'I appreciate you hearing me out.', 'Please do tell me if there is any difficulty.'],
        signoff: 'Kind regards,',
        after: { fulfilled: 'Thank you for sorting it out last time. I noticed, and I am grateful.', failed: 'Last time it did not get done. I will not dwell on it, but I did make a note.', refused: 'You declined last time, which is entirely your right. I am asking again, politely.', ignored: 'I did not hear back last time. No harm done, but I would appreciate a reply.' },
        outcome: { fulfilled: 'That is done. Thank you.', failed: 'That did not get done in time. I have noted it.', refused: 'Understood, and thank you for being clear.', ignored: 'No reply, so I will take it as a no.' },
    },
    journalist: {
        id: 'journalist', gender: 'f', role: 'Journalist', color: '#6a4fa0',
        affinity: ['rep', 'cash', 'connectContinent', 'like', 'rankUp', 'greet', 'connectCities', 'upgradeDevCategory', 'negativeEvents', 'positiveEvents', 'compensateDelay'],
        intros: [
            (ask) => `Quick question: would you be willing to ${ask}? And, if I may ask, why not sooner?`,
            (ask) => `I am putting a piece together. Could you ${ask}? What would that say about the terminal? Who else would notice?`,
            (ask) => `Can I ask you something? Will you ${ask}? What is stopping you? Who decides?`,
        ],
        deadline: (t) => `And how soon could that be? Would ${t} from your answer be realistic?`,
        outros: ['Do you have a comment?', 'Can I quote you on that?', 'Is that a yes?'],
        signoff: 'Looking forward to hearing from you,',
        after: { fulfilled: 'You delivered last time. Was that luck, or planning?', failed: 'Last time it did not happen. Care to explain why?', refused: 'You said no last time. Would you say that again?', ignored: 'I did not hear back last time. Were you busy, or avoiding me?' },
        outcome: { fulfilled: 'Excellent. Is that how it always goes?', failed: 'It was not done. Why not? What happened?', refused: 'A no. Any reason you would like on the record?', ignored: 'No answer. Is that a comment in itself?' },
    },
    passenger: {
        id: 'passenger', gender: 'f', role: 'First-Class Passenger', color: '#7a4a5e',
        affinity: ['build', 'upgradeDevCategory', 'upgradeCity', 'connectCountries', 'payUpfront', 'rename'],
        intros: [
            (ask) => `I should be glad if you would ${ask}. I do not doubt that you can.`,
            (ask) => `It seems to me that the place would be the better for it if you were to ${ask}.`,
            (ask) => `I raise it without any feeling on the subject. You might ${ask}.`,
        ],
        deadline: (t) => `I should think ${t} would be ample.`,
        outros: ['I leave it with you.', 'I expect it will be noticed.', 'I am, as ever, observing.'],
        signoff: 'Yours, with reserve,',
        after: { fulfilled: 'You managed what I asked last time. I noted it.', failed: 'What I asked last time was not done. I draw no conclusion from it, and I am sure it is perfectly clear.', refused: 'You declined me last time. I did not take it ill.', ignored: 'My last letter went unanswered. I assume it never reached you.' },
        outcome: { fulfilled: 'That is done, and well enough.', failed: 'It was not done. I had rather expected as much.', refused: 'You decline. It is a reasonable thing to do, if one has no ambition.', ignored: 'No reply. I shall take it as an answer.' },
    },
    politician: {
        id: 'politician', gender: 'm', role: 'Local Politician', color: '#8a6d2f',
        affinity: ['build', 'connectCities', 'connectContinent', 'rankUp', 'cash', 'payUpfront', 'farewell', 'upgradeDevCategory', 'compensateDelay', 'negativeEvents', 'connectCountries'],
        intros: [
            (ask) => `I am sure you are doing your best, and it is lovely to see. Now, would you be a good fellow and ${ask}?`,
            (ask) => `Let me put this in simple terms, as I know these things can be complicated. ${cap(ask)}.`,
            (ask) => `Well done on getting this far, truly. For the benefit of the community, I would suggest you ${ask}.`,
        ],
        deadline: (t) => `I would not take longer than ${t}, if I were you.`,
        outros: ['I do hope that helps, my friend.', 'Do keep up the good work.', 'I am always happy to offer guidance.'],
        signoff: 'With every confidence in myself,',
        after: { fulfilled: 'You managed it last time. Well done, I am sure it was a team effort.', failed: 'Never mind about last time. These things are difficult.', refused: 'You declined last time. Perhaps you did not quite grasp the benefit.', ignored: 'I did not hear back last time. I assume it got lost in the post.' },
        outcome: { fulfilled: 'Very good. I will mention you at the next meeting.', failed: 'Oh dear. I did rather expect that.', refused: 'Of course, you must do what you think is best.', ignored: 'No reply. How very busy you must be.' },
    },
}
const CHARACTER_IDS = Object.keys(CHARACTERS)

export function readCast() {
    try {
        const c = JSON.parse(localStorage.getItem(CAST_KEY))
        if (c && typeof c === 'object' && !Array.isArray(c)) return c
    } catch { /* none yet */ }
    return {}
}
export function writeCast(cast) { try { localStorage.setItem(CAST_KEY, JSON.stringify(cast)) } catch { /* storage full */ } }
// Gives every character a name from the Hyper-Link name lists the first time it is needed, and keeps it
export function ensureCast(cast, rnd = Math.random) {
    const next = { ...cast }
    CHARACTER_IDS.forEach(id => {
        if (next[id] && typeof next[id].name === 'string' && next[id].name) return
        const c = CHARACTERS[id]
        const gender = c.gender === 'any' ? (rnd() < 0.5 ? 'm' : 'f') : c.gender
        const first = pick(gender === 'm' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE, rnd)
        next[id] = { name: `${first} ${pick(SURNAMES, rnd)}`, last: null }
    })
    return next
}
// A character only refers back to their previous request once, and only if it was settled recently (so "last time" is true)
const MEMORY_MS = 3 * 24 * HOUR
export const noteOutcome = (cast, characterId, state, now = Date.now()) => (cast[characterId] ? { ...cast, [characterId]: { ...cast[characterId], last: state, lastAt: now } } : cast)
export const forgetOutcome = (cast, characterId) => (cast[characterId] ? { ...cast, [characterId]: { ...cast[characterId], last: null, lastAt: 0 } } : cast)

// ---- hand-written emails (data/emailText.js) ---------------------------------------------------------------------
// {word} is swapped for a value; {one|many} picks by whether the number asked for is 1.
export function fillTemplate(text, vars) {
    if (typeof text !== 'string') return ''
    return text
        .replace(/\{([^{}|]+)\|([^{}]+)\}/g, (_, one, many) => (Number(vars.count) === 1 ? one : many))
        .replace(/\{(\w+)\}/g, (m, key) => (key in vars ? String(vars[key]) : m))
}
const templateKey = (who, type, t, i) => `${who}.${type}.${t.id || i}`
// One written email for this sender and request type, preferring ones not used yet; null if none were written
export function pickAuthored(who, type, used = [], rnd = Math.random) {
    const list = EMAILS[who]?.[type]
    if (!Array.isArray(list) || list.length === 0) return null
    const keys = list.map((t, i) => templateKey(who, type, t, i))
    const fresh = list.map((_, i) => i).filter(i => !used.includes(keys[i]))
    const i = pick(fresh.length > 0 ? fresh : list.map((_, j) => j), rnd)
    return { template: list[i], key: keys[i], group: keys }
}
// Every written email for this sender and type in the order to try them: unused ones first, each group shuffled. The game takes the
// first one that can actually be asked for right now (asking for Food when every Food development is built, say, is skipped)
export function authoredOptions(who, type, used = [], rnd = Math.random) {
    const list = EMAILS[who]?.[type]
    if (!Array.isArray(list) || list.length === 0) return []
    const keys = list.map((t, i) => templateKey(who, type, t, i))
    const shuffle = (a) => a.map(x => [rnd(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1])
    const idx = list.map((_, i) => i)
    return [...shuffle(idx.filter(i => !used.includes(keys[i]))), ...shuffle(idx.filter(i => used.includes(keys[i])))]
        .map(i => ({ template: list[i], key: keys[i], group: keys }))
}
// Remember a written email as used; once every one for that sender and type has been, start the set over
export function markUsed(used, key, group) {
    const base = group && group.every(k => used.includes(k)) ? used.filter(k => !group.includes(k)) : used
    return base.includes(key) ? base : [...base, key]
}
export const USED_KEY = 'hyperloop_email_used'
export function readUsed() {
    try { const l = JSON.parse(localStorage.getItem(USED_KEY)); return Array.isArray(l) ? l.filter(k => typeof k === 'string') : [] } catch { return [] }
}
export function writeUsed(list) { try { localStorage.setItem(USED_KEY, JSON.stringify(list.slice(-300))) } catch { /* storage full */ } }

const addressee = (name) => (name && name.trim()) || 'Manager'
// How a sender greets the player: "Dr. Smith" with a title, the first name without one, and "Manager" only as a last resort
// (no name set at all). A title goes before a surname, so with only one name given ("Cathal") it is just that name: "Mr. Cathal"
// read like a mistake.
export function formalAddress(name, title = '') {
    const n = (name || '').trim().replace(/\s+/g, ' ')
    if (!n) return 'Manager'
    const parts = n.split(' ')
    return PLAYER_TITLES.includes(title) && parts.length > 1 ? `${title} ${parts[parts.length - 1]}` : parts[0]
}
const firstName = (sender) => sender.name.split(' ')[0]

// The timetable windows the schedule requests ask for (minutes of the day, the player's own clock)
const atNight = (m) => Number.isFinite(m) && (m >= 20 * 60 || m < 2 * 60)
const inMorning = (m) => Number.isFinite(m) && m >= 6 * 60 && m < 10 * 60
const newTimetableEntries = (s, e) => (s.timetableEntries || []).filter(t => !e.extra.baseNames.includes(t.name))
export const SCHEDULE_TYPES = ['schedule', 'scheduleNight', 'scheduleMorning']
// How many new loops could be put on the timetable: cities connected but not on it yet, plus cities that can still be connected
const scheduleRoom = (ctx) => (Number.isFinite(ctx.snap.unscheduled) ? ctx.snap.unscheduled : Math.max(0, (ctx.snap.cities || 0) - 1 - (ctx.snap.timetable || 0))) + (ctx.available?.citiesTotal || 0)

// The connected cities that weren't connected when the player agreed
const newCities = (s, e) => (s.cityList || []).filter(c => !e.extra.baseCities.includes(c.name))
// Upgrade levels gained since agreeing, summed over every development (or city line); one that has gone counts nothing.
// One built or connected since agreeing is counted from the level it opened at (`start`: 1 with Colour Theory, which hands
// that level over for free), so building something new isn't an upgrade.
const levelsGained = (now, base, start = 0) => Object.entries(now || {}).reduce((n, [name, level]) => n + Math.max(0, (Number(level) || 0) - (base && name in base ? (Number(base[name]) || 0) : start)), 0)
const CITY_TYPES = ['connectCities', 'connectContinent', 'connectTier3', 'connectCountryCity']

// What each request measures. `metric` reads one number out of the snapshot; progress is how far it has risen since the
// player agreed. `label` is the short line shown beside the progress bar.
const METRICS = {
    // Builds and connections count what is new since agreeing (extra.base..., see agree()), so removing a development or
    // disconnecting a city that was already there doesn't set the player back, and removing and rebuilding the same one
    // doesn't count twice. Requests agreed before this existed have no base lists and keep counting the totals.
    // (a development removed earlier this run and built again isn't new either)
    build: (s, e) => (e.extra.baseBuilt ? (s.builtNames?.[e.extra.category] || []).filter(n => !e.extra.baseBuilt.includes(n) && !(s.removedDevs || []).includes(n)).length : (s.built?.[e.extra.category] || 0)),
    greet: (s) => s.greetings || 0,
    farewell: (s) => s.farewells || 0,
    // The schedule requests count NEW loops: timetable entries for cities that weren't on it when the player agreed (extra.baseNames).
    // Moving a loop that was already there, into the window or within it, doesn't count. Emails agreed before this existed
    // have no baseNames and keep counting the whole timetable as they did.
    schedule: (s, e) => (e.extra?.baseNames ? newTimetableEntries(s, e).length : (s.timetable || 0)),
    cash: (s) => s.cash || 0,
    rep: (s) => s.repEarned || 0,
    connectContinent: (s, e) => (e.extra.baseCities ? newCities(s, e).filter(c => c.continent === e.extra.continent).length : (s.continentCities?.[e.extra.continent] || 0)),
    connectTier3: (s, e) => (e.extra.baseCities ? newCities(s, e).filter(c => c.tier === 3).length : (s.tier3Cities || 0)),
    // Timetable departures that leave at night (8pm to 2am)
    scheduleNight: (s, e) => (e.extra?.baseNames ? newTimetableEntries(s, e).filter(t => atNight(t.minuteOfDay)).length : (s.nightLoops || 0)),
    // Cities connected in the countries a written email names (`countries` in data/emailText.js)
    connectCountryCity: (s, e) => (e.extra.baseCities ? newCities(s, e).filter(c => (e.extra.countries || []).includes(c.country)).length : (e.extra.countries || []).reduce((n, c) => n + (s.countryCities?.[c] || 0), 0)),
    // Timetable departures that leave in the morning (6am to 10am)
    scheduleMorning: (s, e) => (e.extra?.baseNames ? newTimetableEntries(s, e).filter(t => inMorning(t.minuteOfDay)).length : (s.morningLoops || 0)),
    // Continents with at least one connected city
    newContinent: (s, e) => (e.extra.baseContinents ? new Set((s.cityList || []).map(c => c.continent).filter(c => c && !e.extra.baseContinents.includes(c))).size : (s.continentsConnected || 0)),
    // Milestones reached so far (development counts, city counts, continents, rank gifts)
    milestone: (s) => s.milestones || 0,
    // Rewards claimed on the Progress page
    claimRewards: (s) => s.rewardsClaimed || 0,
    // Different countries among the connected cities
    connectCountries: (s, e) => (e.extra.baseCountries ? new Set((s.cityList || []).map(c => c.country).filter(c => c && !e.extra.baseCountries.includes(c))).size : (s.countries || 0)),
    // Delayed loops the player has paid compensation for
    compensateDelay: (s) => s.delaysCompensated || 0,
    // Delayed loops the player has dismissed without paying
    refuseDelay: (s) => s.delaysRefused || 0,
    // Positive events (the good ones) that have happened to the terminal
    positiveEvents: (s) => s.positiveEvents || 0,
    // Negative events (the bad ones) that have happened to the terminal
    negativeEvents: (s) => s.negativeEvents || 0,
    // Emails answered (agreed to or refused) since agreeing to this one, whichever they are, so new arrivals count too; one left
    // to go unanswered doesn't. Requests from before that named the emails they meant count those (waitingIds).
    clearInbox: (s, e) => (e.extra.countsAnswers ? (s.answered || 0) : Array.isArray(e.extra.waitingIds)
        ? e.extra.waitingIds.filter(id => !(s.waitingIds || []).includes(id) && !(s.ignoredIds || []).includes(id)).length
        : (s.answered || 0)),
    connectCities: (s, e) => (e.extra.baseCities ? newCities(s, e).length : (s.cities || 0)),
    rankUp: (s) => s.rank || 0,
    // Levels gained since agreeing, per development and per city line (a removed development or disconnected city loses its
    // levels, which no longer counts against the player)
    upgradeDev: (s, e) => (e.extra.baseDevUpgrades ? levelsGained(s.devUpgradeLevels, e.extra.baseDevUpgrades, s.devStartLevel || 0) : (s.devUpgrades || 0)),
    // How many different developments of one category have been upgraded since the player agreed
    // The level of the one development a written email names (picked by the game from those that can be upgraded)
    upgradeSpecific: (s, e) => s.devLevels?.[e.extra.category]?.[e.extra.development] || 0,
    upgradeDevCategory: (s, e) => Object.entries(s.devLevels?.[e.extra.category] || {}).filter(([name, level]) => level > (e.extra.baseLevels && name in e.extra.baseLevels ? (e.extra.baseLevels[name] || 0) : (s.devStartLevel || 0))).length,
    upgradeCity: (s, e) => (e.extra.baseCityLevels ? levelsGained(s.cityLevels, e.extra.baseCityLevels, s.cityStartLevel || 0) : (s.cityUpgrades || 0)),
    shop: (s) => s.shopOwned || 0,
    work: (s) => s.work || 0,
    // Renames since agreeing (a counter, so renaming a development that already has a custom name counts too). Emails agreed
    // before the counter existed have no countsRenames and keep counting custom names as they did.
    rename: (s, e) => (e.extra?.countsRenames ? (s.renamesDone || 0) : (s.renames || 0)),
    like: (s) => s.likes || 0,
}

// The requests that are about keeping a number above a target until the deadline, and where that number comes from
const HOLD_READS = { holdRep: (s) => s.reputation || 0, holdCash: (s) => s.balance || 0 }

// The requests that count new things (cities, countries, continents, developments, loops) also remember each one they have
// counted (extra.seen, kept by updateAgreed), so one that is disconnected, removed or taken off the timetable again still
// counts: "connect 2 new cities" is done by connecting two, even if one is disconnected in between. The same one coming back
// isn't counted twice. Each returns what is new right now, as names, or null for a request agreed before the base lists existed.
const NEW_ITEMS = {
    build: (s, e) => (e.extra.baseBuilt ? (s.builtNames?.[e.extra.category] || []).filter(n => !e.extra.baseBuilt.includes(n) && !(s.removedDevs || []).includes(n)) : null),
    connectCities: (s, e) => (e.extra.baseCities ? newCities(s, e).map(c => c.name) : null),
    connectContinent: (s, e) => (e.extra.baseCities ? newCities(s, e).filter(c => c.continent === e.extra.continent).map(c => c.name) : null),
    connectTier3: (s, e) => (e.extra.baseCities ? newCities(s, e).filter(c => c.tier === 3).map(c => c.name) : null),
    connectCountryCity: (s, e) => (e.extra.baseCities ? newCities(s, e).filter(c => (e.extra.countries || []).includes(c.country)).map(c => c.name) : null),
    connectCountries: (s, e) => (e.extra.baseCountries ? [...new Set((s.cityList || []).map(c => c.country).filter(c => c && !e.extra.baseCountries.includes(c)))] : null),
    newContinent: (s, e) => (e.extra.baseContinents ? [...new Set((s.cityList || []).map(c => c.continent).filter(c => c && !e.extra.baseContinents.includes(c)))] : null),
    schedule: (s, e) => (e.extra?.baseNames ? newTimetableEntries(s, e).map(t => t.name) : null),
    scheduleNight: (s, e) => (e.extra?.baseNames ? newTimetableEntries(s, e).filter(t => atNight(t.minuteOfDay)).map(t => t.name) : null),
    scheduleMorning: (s, e) => (e.extra?.baseNames ? newTimetableEntries(s, e).filter(t => inMorning(t.minuteOfDay)).map(t => t.name) : null),
}
// What is new right now plus what was counted before (null: not one of these requests, or an older one)
const seenItems = (email, snap) => {
    const now = NEW_ITEMS[email.type]?.(snap, email)
    if (!now) return null
    const seen = Array.isArray(email.extra?.seen) ? email.extra.seen : []
    return [...seen, ...now.filter(n => !seen.includes(n))]
}

export const metricOf = (email, snap) => {
    const items = seenItems(email, snap)
    if (items) return items.length
    return METRICS[email.type] ? METRICS[email.type](snap, email) : 0
}
export const progressOf = (email, snap) => Math.max(email.progress || 0, metricOf(email, snap) - (email.baseline || 0))

export const progressLabel = (email) => {
    if (email.askCustom) return ''
    if (email.type === 'holdRep') return `Keep Reputation above ${formatCount(email.target)}`
    if (email.type === 'holdCash') return `Keep your balance above ${formatCash(email.target)}`
    const cash = email.type === 'cash'
    const have = Math.min(email.progress || 0, email.target)
    return cash ? `${formatCash(have)} of ${formatCash(email.target)}` : `${formatCount(Math.floor(have))} of ${formatCount(email.target)}`
}

const plural = (n, one, many) => (n === 1 ? one : many)

// Greetings and farewells can only be given in the few minutes a loop is in, so they are only asked for while there are plenty of
// them: at least LOOPS_PER_ASK a day for each one asked for (24 a day for 3, 40 for 5), so an hour or two of play over the
// deadline sees enough of them. Left out by older callers, which keeps the old behaviour.
export const LOOPS_PER_ASK = 8
const enoughLoops = (perDay, target) => perDay === undefined || perDay >= target * LOOPS_PER_ASK
// A loop can only be delayed while it is 1-2 hours from leaving, so with only a few loops a day a delay may never come up
// before the deadline. Asked for from this many departures a day (left out by older callers: the old behaviour).
export const DELAY_MIN_LOOPS = 12
const enoughForDelays = (ctx) => ctx.departuresPerDay === undefined || ctx.departuresPerDay >= DELAY_MIN_LOOPS

// ---- request generators ------------------------------------------------------------------------------------------
// Each returns null when the request could not be done right now (so the player is never asked for the impossible), or
// { type, target, extra, subject, ask, hours }. `ask` is the sentence the body is built around. ctx comes from App.jsx:
// { snap, incomePerHour, available: { categories: [..], continents: { Europe: 2, .. }, citiesTotal }, shopCheapest,
//   unrenamed, devsWithUpgrade, rankUpsPossible }
const GENERATORS = {
    build: (ctx, rnd) => {
        // How many of each category can still be built right now; ctx.available.categories is the older, simpler version of this
        const room = ctx.buildableByCategory || Object.fromEntries((ctx.available?.categories || []).map(c => [c, 1]))
        // A written email may ask for more than one (`target` in data/emailText.js)
        const target = ctx.fixed && ctx.fixed > 1 ? ctx.fixed : 1
        const options = Object.keys(room).filter(c => room[c] >= target)
        // A written email may name the category it is about (`category` in data/emailText.js); skip it unless that many can still be built
        if (ctx.fixedCategory && !options.includes(ctx.fixedCategory)) return null
        const category = ctx.fixedCategory || pick(options, rnd)
        if (!category) return null
        // The Enterprise category is called a business venture in the game's own words
        const noun = category === 'Enterprise' ? 'business venture' : `${category} development`
        const ask = target > 1 ? `build ${target} ${noun}s at the terminal` : `build ${/^[AEIOU]/i.test(noun) ? 'an' : 'a'} ${noun} at the terminal`
        return { type: 'build', target, extra: { category }, subject: `New ${noun}`, ask, hours: between(36, 48, rnd) }
    },
    greet: (ctx, rnd) => {
        const target = ctx.fixed ?? between(2, 5, rnd)
        if (!enoughLoops(ctx.arrivalsPerDay, target)) return null
        return { type: 'greet', target, extra: {}, subject: 'Welcoming our passengers', ask: `greet the passengers arriving at the terminal ${target} ${plural(target, 'time', 'times')}`, hours: between(24, 36, rnd) }
    },
    farewell: (ctx, rnd) => {
        const target = ctx.fixed ?? between(2, 5, rnd)
        if (!enoughLoops(ctx.departuresPerDay, target)) return null
        return { type: 'farewell', target, extra: {}, subject: 'Seeing passengers off', ask: `say farewell to departing passengers ${target} ${plural(target, 'time', 'times')}`, hours: between(24, 36, rnd) }
    },
    schedule: (ctx, rnd) => {
        if ((ctx.snap.cities || 0) < 2) return null
        const target = ctx.fixed ?? between(1, 3, rnd)
        if (scheduleRoom(ctx) < target) return null
        return { type: 'schedule', target, extra: {}, subject: 'Timetable additions', ask: `schedule ${target} new ${plural(target, 'loop', 'loops')} in the timetable`, hours: between(24, 48, rnd) }
    },
    cash: (ctx, rnd) => {
        const perHour = ctx.incomePerHour || 0
        if (perHour <= 0) return null
        // Lump sums count too (Progress rewards, cash events, the daily bonus), so the sum asked for is 8-20 hours of income
        const target = ctx.fixed ?? niceRound(perHour * between(8, 20, rnd))
        return { type: 'cash', target, extra: {}, subject: 'Quarterly figures', ask: `earn ${formatCash(target)} for the terminal`, hours: between(24, 48, rnd) }
    },
    rep: (ctx, rnd) => {
        const f = scaleFor(ctx.snap.reputation)
        const target = ctx.fixed ?? niceRound(Math.max(10, Math.round(15 * f)))
        return { type: 'rep', target, extra: {}, subject: 'Our public image', ask: `earn ${formatCount(target)} Reputation for the terminal`, hours: between(24, 48, rnd) }
    },
    connectContinent: (ctx, rnd) => {
        const options = Object.entries(ctx.available?.continents || {}).filter(([, n]) => n > 0)
        if (options.length === 0) return null
        const [continent] = pick(options, rnd)
        return { type: 'connectContinent', target: 1, extra: { continent }, subject: `Expanding into ${continent}`, ask: `connect a new city in ${continent}`, hours: between(36, 48, rnd) }
    },
    // Cities in countries the terminal is not connected to yet (ctx.newCountriesAvailable counts those countries)
    connectCountries: (ctx, rnd) => {
        const target = ctx.fixed ?? 3
        if ((ctx.newCountriesAvailable || 0) < target) return null
        return { type: 'connectCountries', target, extra: {}, subject: 'New countries', ask: target === 1 ? 'connect a new country' : `connect ${target} new countries`, hours: between(44, 48, rnd) }
    },
    // Needs a milestone within reach of the player (ctx.milestoneNear)
    milestone: (ctx, rnd) => {
        if (!ctx.milestoneNear) return null
        return { type: 'milestone', target: 1, extra: {}, subject: 'A milestone', ask: 'reach a new milestone', hours: between(44, 48, rnd) }
    },
    // Needs that many rewards waiting on the Progress page (ctx.rewardsWaiting)
    claimRewards: (ctx, rnd) => {
        const target = ctx.fixed ?? 3
        if ((ctx.rewardsWaiting || 0) < target) return null
        return { type: 'claimRewards', target, extra: {}, subject: 'Progress rewards', ask: target === 1 ? 'claim a reward on the Progress page' : `claim ${target} rewards on the Progress page`, hours: between(36, 48, rnd) }
    },
    // Departures leaving between 8pm and 2am; needs at least that many cities to put in the timetable
    scheduleNight: (ctx, rnd) => {
        const target = ctx.fixed ?? 3
        if ((ctx.snap.cities || 0) < 2 || scheduleRoom(ctx) < target) return null
        return { type: 'scheduleNight', target, extra: {}, subject: 'Night loops', ask: `schedule ${target} new ${plural(target, 'loop', 'loops')} to leave at night, between 8pm and 2am`, hours: between(36, 48, rnd) }
    },
    // A continent the terminal has no city in yet, with a city still waiting to be connected there
    newContinent: (ctx, rnd) => {
        const options = Object.entries(ctx.available?.continents || {}).filter(([c, n]) => n > 0 && !(ctx.snap.continentCities?.[c] > 0))
        if (options.length === 0) return null
        return { type: 'newContinent', target: 1, extra: {}, subject: 'A new continent', ask: 'connect a city in a new continent', hours: between(44, 48, rnd) }
    },
    // A city in one of the countries a written email names (`countries`); `onlyIfNone` keeps it for a terminal with no city in any of them yet
    connectCountryCity: (ctx, rnd) => {
        const list = ctx.fixedCountries
        if (!Array.isArray(list) || list.length === 0) return null
        const open = list.filter((c) => (ctx.available?.countries?.[c] || 0) > 0)
        if (open.length === 0) return null
        if (ctx.fixedNone && list.some((c) => (ctx.snap.countryCities?.[c] || 0) > 0)) return null
        // Never asked of a terminal whose home city is in one of those countries
        if (ctx.snap.homeCountry && list.includes(ctx.snap.homeCountry)) return null
        const named = list.map((c) => (c === 'United States of America' ? 'the United States' : c))
        const where = named.length > 1 ? `${named.slice(0, -1).join(', ')} or ${named[named.length - 1]}` : named[0]
        return { type: 'connectCountryCity', target: 1, extra: { countries: list }, subject: 'A new city abroad', ask: `connect a new city in ${where}`, hours: between(44, 48, rnd) }
    },
    // Departures leaving between 6am and 10am
    scheduleMorning: (ctx, rnd) => {
        const target = ctx.fixed ?? 3
        if ((ctx.snap.cities || 0) < 2 || scheduleRoom(ctx) < target) return null
        return { type: 'scheduleMorning', target, extra: {}, subject: 'Morning loops', ask: `schedule ${target} new ${plural(target, 'loop', 'loops')} to leave in the morning, between 6am and 10am`, hours: between(36, 48, rnd) }
    },
    connectCities: (ctx, rnd) => {
        const room = ctx.available?.citiesTotal || 0
        if (room < 1) return null
        if (ctx.fixed && ctx.fixed > room) return null
        const target = ctx.fixed ?? Math.min(room, between(1, 3, rnd))
        return { type: 'connectCities', target, extra: {}, subject: 'Network growth', ask: `connect ${target} new ${plural(target, 'city', 'cities')} to the network`, hours: between(36, 48, rnd) }
    },
    // Connect a city of the top tier (Tier 3); only while that many are still waiting to be connected
    // Not a task to do but one to avoid: Reputation must stay above the target until the deadline. Only asked while the player has
    // a little to spare (the target is about 85% of their Reputation now), so it can always be kept
    holdRep: (ctx, rnd) => {
        const rep = ctx.snap.reputation || 0
        if (rep < 100) return null
        const target = niceRound(rep * 0.85)
        if (target >= rep) return null
        return { type: 'holdRep', target, extra: {}, subject: 'Our reputation', ask: `keep the terminal's Reputation above ${formatCount(target)}`, hours: between(24, 36, rnd) }
    },
    // Not something the player does, but something they live through: bad events happen at random every few minutes, so it is only
    // asked while they can still happen (not switched off by a perk or held back by upgrades) and the deadline is long
    negativeEvents: (ctx, rnd) => {
        if (!((ctx.negativeEventChance || 0) >= 0.05)) return null
        const target = ctx.fixed ?? 2
        return { type: 'negativeEvents', target, extra: {}, subject: 'When things go wrong', ask: `experience ${target} negative ${plural(target, 'event', 'events')}`, hours: between(44, 48, rnd) }
    },
    // A delayed loop comes up at random while the game runs (and never with Bulletproof Planning), so the deadline is long
    compensateDelay: (ctx, rnd) => {
        if (!ctx.delaysPossible || !enoughForDelays(ctx)) return null
        const target = ctx.fixed ?? 1
        return { type: 'compensateDelay', target, extra: {}, subject: 'A delayed loop', ask: target === 1 ? 'compensate the passengers of a delayed loop' : `compensate the passengers of ${target} delayed loops`, hours: between(44, 48, rnd) }
    },
    // Delayed loops the player turns down compensating (the opposite of compensateDelay)
    refuseDelay: (ctx, rnd) => {
        if (!ctx.delaysPossible || !enoughForDelays(ctx)) return null
        const target = ctx.fixed ?? 1
        return { type: 'refuseDelay', target, extra: {}, subject: 'A delayed loop', ask: target === 1 ? 'refuse to compensate the passengers of a delayed loop' : `refuse to compensate the passengers of ${target} delayed loops`, hours: between(44, 48, rnd) }
    },
    // Paid the moment the player agrees (see agree() and respondToEmail), so it is only asked of a player who can afford it
    payUpfront: (ctx, rnd) => {
        const bal = ctx.snap.balance || 0
        if (bal < 1000) return null
        const target = niceRound(bal * (0.15 + rnd() * 0.15))
        if (target <= 0 || target >= bal) return null
        return { type: 'payUpfront', target, extra: {}, subject: 'Money up front', ask: `pay ${formatCash(target)} upfront`, hours: 24 }
    },
    // The good-news twin of negativeEvents: random good events, asked for while they can happen
    positiveEvents: (ctx, rnd) => {
        if (!((ctx.positiveEventChance || 0) >= 0.05)) return null
        const target = ctx.fixed ?? 2
        return { type: 'positiveEvents', target, extra: {}, subject: 'Good news', ask: `experience ${target} positive ${plural(target, 'event', 'events')}`, hours: between(44, 48, rnd) }
    },
    // Like holdRep, for the cash balance (spending on builds and upgrades is what could break it)
    holdCash: (ctx, rnd) => {
        const bal = ctx.snap.balance || 0
        if (bal < 1000) return null
        const target = niceRound(bal * 0.6)
        if (target >= bal) return null
        return { type: 'holdCash', target, extra: {}, subject: 'A cash reserve', ask: `keep at least ${formatCash(target)} in the bank`, hours: between(24, 36, rnd) }
    },
    // Answer a few emails: as many as are waiting when this one arrives (at most 5), but any emails count, new ones included,
    // so the goal never looks odd when more arrive
    clearInbox: (ctx, rnd) => {
        const ids = Array.isArray(ctx.waitingIds) ? ctx.waitingIds : []
        if (ids.length < 1) return null
        const target = Math.min(ids.length, 5)
        return { type: 'clearInbox', target, extra: { countsAnswers: true }, subject: 'Your inbox', ask: target === 1 ? 'reply to one of the unanswered emails in your inbox' : `reply to at least ${target} of the unanswered emails in your inbox`, hours: between(24, 36, rnd) }
    },
    connectTier3: (ctx, rnd) => {
        const room = ctx.tier3Available || 0
        if (room < 1) return null
        if (ctx.fixed && ctx.fixed > room) return null
        const target = ctx.fixed ?? 1
        return { type: 'connectTier3', target, extra: {}, subject: 'A Tier 3 city', ask: target === 1 ? 'connect a new Tier 3 city to the network' : `connect ${target} new Tier 3 cities to the network`, hours: between(36, 48, rnd) }
    },
    rankUp: (ctx) => {
        // A written email may ask for more than one rank (`target`). Only while those ranks are left to reach, and only if the cash
        // they take is within about two days of the current income (ctx.rankXpToNext is Infinity at the top rank; left out by
        // older callers, which keeps the old behaviour). incomePerHour is the terminal's usual income (see App.jsx emailContext)
        const target = ctx.fixed && ctx.fixed > 1 ? ctx.fixed : 1
        if (ctx.rankXpToNext !== undefined) {
            const need = target === 1 ? ctx.rankXpToNext : ctx.rankXpToRanks?.[target - 1]
            if (!(need > 0) || !Number.isFinite(need)) return null
            // Within a day of income: the deadline is 2 days, and nobody earns every hour of both (offline pay only lands on Collect)
            if (!(ctx.incomePerHour > 0) || need > ctx.incomePerHour * 24) return null
        }
        return { type: 'rankUp', target, extra: {}, subject: 'Moving up', ask: target === 1 ? 'take the terminal up a rank' : `take the terminal up ${target} ranks`, hours: 48 }
    },
    upgradeDev: (ctx, rnd) => {
        // Levels still to be bought across the developments (each goes up to 10); older callers give only how many earn money
        const room = ctx.devLevelsLeft ?? ctx.devsWithUpgrade ?? 0
        if (room < 1 || (ctx.fixed && ctx.fixed > room)) return null
        const target = ctx.fixed ?? Math.min(room, between(1, 2, rnd))
        return { type: 'upgradeDev', target, extra: {}, subject: 'Development upgrades', ask: `upgrade a development ${target} ${plural(target, 'time', 'times')}`, hours: between(24, 48, rnd) }
    },
    // One development the player owns that can still be upgraded, named in the email as {development}
    upgradeSpecific: (ctx, rnd) => {
        // A written email may say which category it is (`category`), e.g. a Food development
        const options = (ctx.upgradableDevs || []).filter(d => !ctx.fixedCategory || d.category === ctx.fixedCategory)
        if (options.length === 0) return null
        const dev = pick(options, rnd)
        // What the email calls it: the player's own name for it as it is ("Crumbs"), or its own name with "the" ("the Bakery").
        // The request itself follows the development by its own name, so renaming it afterwards changes nothing.
        const label = dev.customName || `the ${dev.name}`
        return { type: 'upgradeSpecific', target: 1, extra: { development: dev.name, category: dev.category, label }, subject: 'A development upgrade', ask: `upgrade ${label}`, hours: between(36, 48, rnd) }
    },
    upgradeDevCategory: (ctx, rnd) => {
        const room = ctx.upgradableByCategory || {}
        const options = Object.keys(room).filter(c => room[c] >= 1)
        const category = ctx.fixedCategory && room[ctx.fixedCategory] >= 1 ? ctx.fixedCategory : (ctx.fixedCategory ? null : pick(options, rnd))
        if (!category) return null
        if (ctx.fixed && ctx.fixed > room[category]) return null
        const target = ctx.fixed ?? Math.min(room[category], between(1, 3, rnd))
        return { type: 'upgradeDevCategory', target, extra: { category }, subject: `${category} upgrades`, ask: target === 1 ? `upgrade ${/^[AEIOU]/i.test(category) ? 'an' : 'a'} ${category} development` : `upgrade ${target} different ${category} developments`, hours: between(24, 48, rnd) }
    },
    upgradeCity: (ctx, rnd) => {
        if ((ctx.snap.cities || 0) < 2) return null
        // Levels still to be bought on the lines that can be upgraded (not the home city's, each up to 10), when the game says
        const room = ctx.cityLevelsLeft ?? Infinity
        if (room < 1 || (ctx.fixed && ctx.fixed > room)) return null
        const target = ctx.fixed ?? Math.min(room, between(1, 2, rnd))
        return { type: 'upgradeCity', target, extra: {}, subject: 'Line upgrades', ask: `upgrade a city's line ${target} ${plural(target, 'time', 'times')}`, hours: between(24, 48, rnd) }
    },
    shop: (ctx, rnd) => {
        if (!(ctx.shopCheapest > 0) || ctx.shopCheapest > 25) return null
        return { type: 'shop', target: 1, extra: {}, subject: 'A little something for the office', ask: 'buy something from the Shop', hours: between(24, 48, rnd) }
    },
    work: (ctx, rnd) => {
        const target = ctx.fixed ?? between(4, 12, rnd) * 25
        return { type: 'work', target, extra: {}, subject: 'Rolling up our sleeves', ask: `click Work ${target} times yourself`, hours: between(24, 36, rnd) }
    },
    rename: (ctx, rnd) => {
        const room = ctx.renamable ?? ctx.unrenamed ?? 0
        if (room < 1) return null
        const target = ctx.fixed ?? between(1, 2, rnd)
        return { type: 'rename', target, extra: { countsRenames: true }, subject: 'A fresh look', ask: `give ${target} ${plural(target, 'development', 'developments')} a new name`, hours: between(24, 48, rnd) }
    },
    like: (ctx, rnd) => {
        const target = ctx.fixed ?? between(3, 8, rnd)
        return { type: 'like', target, extra: {}, subject: 'Engaging online', ask: `like ${target} Hyper-Link ${plural(target, 'post', 'posts')}`, hours: between(24, 36, rnd) }
    },
}

// A few ways to open and close each request, so two emails in a row don't read the same
const INTROS = [
    (ask) => `Hello! I use the terminal now and then and I had an idea. Could you ${ask}?`,
    (ask) => `I hope you do not mind me writing. I think it would be great if you could ${ask}.`,
    (ask) => `Hi there. A few of us have been talking about it, and we would love it if you would ${ask}.`,
    (ask) => `Sorry to bother you, but could you ${ask}? Thank you!`,
]
const OUTROS = [
    'It would mean a lot to us.',
    'I would be grateful for your help with this.',
    'Let me know what you decide.',
    'Thanks for reading!',
]

export const EMAIL_TYPES = Object.keys(GENERATORS)

// A day's mix: at least this many recurring characters and at least this many members of the public (3 emails a day:
// two characters and one member of the public). `today` lists who has already written today ('public' or a character id).
export const MIN_CHARACTERS_PER_DAY = 2
export const MIN_PUBLIC_PER_DAY = 1
export function wantsPublic(today = [], rnd = Math.random) {
    const publics = today.filter(who => who === 'public').length
    const needPublic = Math.max(0, MIN_PUBLIC_PER_DAY - publics)
    const needCharacters = Math.max(0, MIN_CHARACTERS_PER_DAY - (today.length - publics))
    if (needPublic > 0 && needCharacters === 0) return true
    if (needCharacters > 0 && needPublic === 0) return false
    if (needPublic > 0 && needCharacters > 0) return rnd() < needPublic / (needPublic + needCharacters)
    return rnd() < 0.25
}

// The settings a written email gives its request (`target`, `category`, `countries`, `onlyIfNone` in data/emailText.js)
const templateCtx = (ctx, t) => ({
    ...ctx,
    fixed: Number.isFinite(t.target) && t.target > 0 ? Math.floor(t.target) : null,
    fixedCategory: typeof t.category === 'string' ? t.category : null,
    fixedCountries: Array.isArray(t.countries) && t.countries.length ? t.countries : null,
    fixedNone: t.onlyIfNone === true,
})
// How the next written email is chosen: every written email that can be done right now is a candidate, from a sender who hasn't
// written today (a character at most once a day, and the public count as one sender, so at most one of them a day). One that has
// been sent before isn't picked again until every candidate has been sent; then the list starts over. Picked at random.
// `open`: the written emails still in the inbox (waiting for an answer, or in progress), which are never sent a second time
// alongside themselves.
// Returns null when there is nothing to send right now: either nothing can be asked for at all, or the only emails not sent
// yet are from people who have already written today (they wait for tomorrow, rather than the list starting over early).
export function pickWritten(ctx, { rnd = Math.random, cast = null, used = [], today = [], types = null, open = [] } = {}) {
    const candidates = []
    for (const who of ['public', ...CHARACTER_IDS]) {
        if (who !== 'public' && !cast?.[who]?.name) continue
        for (const [type, list] of Object.entries(EMAILS[who] || {})) {
            if (!GENERATORS[type] || !Array.isArray(list) || (types && !types.includes(type))) continue
            const keys = list.map((t, i) => templateKey(who, type, t, i))
            list.forEach((t, i) => {
                const req = GENERATORS[type](templateCtx(ctx, t), rnd)
                if (req) candidates.push({ who, type, req, option: { template: t, key: keys[i], group: keys } })
            })
        }
    }
    const allowed = candidates.filter(c => !today.includes(c.who) && !open.includes(c.option.key))
    const fresh = allowed.filter(c => !used.includes(c.option.key))
    if (fresh.length) return { ...pick(fresh, rnd), restart: false }
    // Someone who has already written today still has emails that haven't been sent: wait for those
    if (candidates.some(c => !used.includes(c.option.key))) return null
    // Every email that can be done has been sent: the list starts again
    return allowed.length ? { ...pick(allowed, rnd), restart: true } : null
}

// Make one email, or null if nothing fits. `types` lets a test force a type.
export function generateEmail(ctx, { rnd = Math.random, now = Date.now(), playerName = '', playerTitle = '', types = null, cast = null, used = [], today = [], open = [] } = {}) {
    // Only written emails: drawn at random from every written email that can be done right now (see pickWritten)
    const chosen = ONLY_WRITTEN ? pickWritten(ctx, { rnd, cast, used, today, types, open }) : null
    if (ONLY_WRITTEN && !chosen) return null
    const order = chosen ? [chosen.type] : [...(types || EMAIL_TYPES)].sort(() => rnd() - 0.5)
    // The rest is for when built-in emails are in use too (ONLY_WRITTEN off): a day's mix of characters and the public
    const publicWritten = !ONLY_WRITTEN || Object.values(EMAILS.public || {}).some(l => Array.isArray(l) && l.length > 0)
    const wantPublic = publicWritten && wantsPublic(today, rnd)
    for (const type of order) {
        // Who sends it. A character can write at most once a day, and a day always has at least MIN_CHARACTERS_PER_DAY
        // characters and MIN_PUBLIC_PER_DAY member of the public (decided above, from who has already written today).
        let character = null, authored = null, req = null
        if (chosen) {
            character = chosen.who === 'public' ? null : CHARACTERS[chosen.who]
            authored = chosen.option
            req = chosen.req
        } else {
            const written = (id) => Array.isArray(EMAILS[id]?.[type]) && EMAILS[id][type].length > 0
            character = null
            if (wantPublic) {
                if (ONLY_WRITTEN && !written('public')) continue
            } else {
                const people = CHARACTER_IDS.filter(id => cast?.[id]?.name && !today.includes(id)
                    && (ONLY_WRITTEN ? written(id) : (CHARACTERS[id].affinity.includes(type) || written(id))))
                if (people.length === 0) continue
                character = CHARACTERS[pick(people, rnd)]
            }
            // A written email may fix how many times the player is asked to do something ("target" in data/emailText.js) or which
            // category it is about. Try the written emails one by one and use the first that is possible right now.
            const options = authoredOptions(character?.id || 'public', type, used, rnd)
            authored = null; req = null
            if (options.length === 0) {
                req = GENERATORS[type]({ ...ctx, fixed: null, fixedCategory: null }, rnd)
            } else {
                for (const option of options) {
                    const t = option.template
                    const fixed = Number.isFinite(t.target) && t.target > 0 ? Math.floor(t.target) : null
                    const fixedCategory = typeof t.category === 'string' ? t.category : null
                    const fixedCountries = Array.isArray(t.countries) && t.countries.length ? t.countries : null
                    req = GENERATORS[type]({ ...ctx, fixed, fixedCategory, fixedCountries, fixedNone: t.onlyIfNone === true }, rnd)
                    if (req) { authored = option; break }
                }
            }
        }
        if (!req) continue
        let sender = character ? { name: cast[character.id].name, role: character.role } : { name: `${pick(rnd() < 0.5 ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE, rnd)} ${pick(SURNAMES, rnd)}`, role: 'Member of the Public' }
        const amounts = amountsFor(ctx.snap.reputation)
        const hours = req.hours
        const within = hours >= 48 ? '2 days' : hours > 24 ? `${hours} hours` : 'a day'
        const nameForPlayer = addressee(playerName)
        const formal = formalAddress(playerName, playerTitle)
        let text, referredBack = false, subject = req.subject, texts = null
        if (authored) {
            const t = authored.template
            // A written email may word the request shown under it differently (`ask` in data/emailText.js)
            if (typeof t.ask === 'string' && t.ask.trim()) req = { ...req, ask: t.ask.trim() }
            // A member of the public may have a title of their own (`role` in data/emailText.js), e.g. a terminal worker
            if (!character && typeof t.role === 'string' && t.role.trim()) sender = { ...sender, role: t.role.trim() }
            const vars = {
                name: nameForPlayer.split(' ')[0], formal, FORMAL: formal.toUpperCase(), title: PLAYER_TITLES.includes(playerTitle) ? playerTitle : '', fullName: nameForPlayer, from: sender.name.split(' ')[0], fromFull: sender.name, role: sender.role,
                n: type === 'cash' || type === 'holdCash' || type === 'payUpfront' ? formatCash(req.target) : formatCount(req.target), count: req.target,
                category: req.extra.category || '', development: req.extra.label || (req.extra.development ? `the ${req.extra.development}` : ''), Development: cap(req.extra.label || (req.extra.development ? `the ${req.extra.development}` : '')), continent: req.extra.continent || '', time: within, hours, ask: req.ask,
            }
            const f = (x) => (typeof x === 'string' && x ? fillTemplate(x, vars) : null)
            subject = f(t.subject) || req.subject
            text = f(t.body) || ''
            texts = { agree: f(t.agree), refuse: f(t.refuse), fulfilled: f(t.fulfilled), failed: f(t.failed), refused: f(t.refused), ignored: f(t.ignored) }
        } else if (character) {
            const last = now - (cast[character.id].lastAt || 0) <= MEMORY_MS ? cast[character.id].last : null
            const memory = last && character.after[last] ? `${character.after[last]}\n\n` : ''
            referredBack = memory !== ''
            text = `${memory}${pick(character.intros, rnd)(req.ask)}\n\n${character.deadline(within)}\n\n${pick(character.outros, rnd)}\n\n${character.signoff}\n${sender.name}\n${sender.role}`
        } else {
            text = `${pick(INTROS, rnd)(req.ask)}\n\nI need this done within ${within} of you agreeing.\n${pick(OUTROS, rnd)}\n\nKind regards,\n${sender.name}\n${sender.role}`
        }
        return {
            id: `em_${now}_${Math.floor(rnd() * 1e6)}`, referredBack,
            type: req.type, extra: req.extra, target: req.target, sender, character: character?.id || null,
            subject, body: authored ? text : `Dear ${formal},\n\n${text}`, texts,
            templateKey: authored?.key || null, templateGroup: chosen ? null : (authored?.group || null),
            // Every written email that could be done had been sent: the used list starts again from this one
            usedRestart: !!chosen?.restart,
            // A written email that words its own request keeps the numbers out of sight, so the progress count is hidden too
            askCustom: !!(authored && typeof authored.template.ask === 'string' && authored.template.ask.trim()),
            ask: req.ask, createdAt: now, state: 'new', read: false, hours,
            reward: amounts.fulfil, penalty: amounts.fail, agreeBonus: amounts.agree, refusePenalty: amounts.refuse,
            baseline: 0, progress: 0, deadline: null, agreedAt: null, resolvedAt: null, reply: null, outcome: null,
        }
    }
    return null
}

const AGREE_REPLIES = [
    (n, s) => `Dear ${firstName(s)},\n\nThank you for getting in touch. Consider it done. You will have what you asked for within the time you gave me.\n\nKind regards,\n${n}`,
    (n, s) => `Dear ${firstName(s)},\n\nYes, I can do that. I will make it a priority and let you know when it is finished.\n\nBest wishes,\n${n}`,
    (n, s) => `Dear ${firstName(s)},\n\nHappy to help. I will get on it straight away.\n\nKind regards,\n${n}`,
]
const REFUSE_REPLIES = [
    (n, s) => `Dear ${firstName(s)},\n\nI'm sorry, but this is not feasible for us right now. I hope you understand.\n\nKind regards,\n${n}`,
    (n, s) => `Dear ${firstName(s)},\n\nThank you for thinking of me, but I will have to decline. We have other priorities at the moment.\n\nBest wishes,\n${n}`,
    (n, s) => `Dear ${firstName(s)},\n\nUnfortunately I cannot take this on. I am sorry to let you down.\n\nKind regards,\n${n}`,
]

export function replyFor(email, agree, playerName, rnd = Math.random) {
    const written = email.texts?.[agree ? 'agree' : 'refuse']
    if (written) return written
    const n = addressee(playerName)
    return pick(agree ? AGREE_REPLIES : REFUSE_REPLIES, rnd)(n, email.sender)
}

// What the sender writes back when the deadline is met or missed (shown under the thread)
const DEFAULT_OUTCOME = {
    fulfilled: 'Wonderful, exactly what we needed. Thank you!',
    failed: 'I am disappointed that this was not done in time.',
    refused: 'A shame, but I understand.',
    ignored: 'I never heard back, so I will take that as a no.',
}
const outcomeLine = (state, e) => e.texts?.[state] || `${firstName(e.sender)} writes: "${(CHARACTERS[e.character]?.outcome || DEFAULT_OUTCOME)[state]}"`
export const OUTCOME_TEXT = {
    fulfilled: (e) => outcomeLine('fulfilled', e),
    failed: (e) => outcomeLine('failed', e),
    refused: (e) => outcomeLine('refused', e),
    ignored: (e) => outcomeLine('ignored', e),
}

// ---- the sender's reply takes a while ---------------------------------------------------------------------------
// When a request is answered, finished or missed, the sender's reply to it arrives 5-10 minutes later, like a real inbox. Until then
// the email is marked read (no badge); when the time comes the reply appears and the email is unread again. The Reputation it
// carries (`repPending`) is only paid when the player opens that reply.
export const REPLY_MIN_MS = 5 * MIN
export const REPLY_MAX_MS = 10 * MIN
export const replyDelay = (now, rnd = Math.random) => ({ outcomeAt: now + REPLY_MIN_MS + Math.floor(rnd() * (REPLY_MAX_MS - REPLY_MIN_MS)), outcomeNotified: false })
// Emails from before this existed have no outcomeAt, and show their reply straight away
export const outcomeShown = (email, now = Date.now()) => !email.outcomeAt || now >= email.outcomeAt
// Brings in any reply that is now due: returns the same email unless one just arrived
export function deliverOutcome(email, now = Date.now()) {
    if (!email.outcomeAt || email.outcomeNotified || now < email.outcomeAt) return email
    return { ...email, outcomeNotified: true, read: false }
}

// ---- state changes (each returns a new email; the caller applies the Reputation) -----------------------------------------
// `cult` is true with Cult of Celebrity: refusing costs nothing.
export function agree(email, snap, playerName, now = Date.now()) {
    // "Different developments of a category" is counted against the levels they had at this moment
    let started = email.type === 'upgradeDevCategory' ? { ...email, extra: { ...email.extra, baseLevels: { ...(snap.devLevels?.[email.extra.category] || {}) } } } : email
    // "Answer the waiting emails" is counted against those still waiting now (this one is still unanswered in the snapshot); with none
    // left to answer, the inbox is already clear
    // (one from before the request named the emails it means is counted the old way: against those still waiting now)
    const inbox = email.type === 'clearInbox' && !email.extra?.countsAnswers && !Array.isArray(email.extra?.waitingIds)
    const waiting = inbox ? Math.max(0, (snap.waitingEmails || 0) - 1) : 0
    if (inbox) started = { ...started, target: Math.max(1, Math.min(email.target, waiting)) }
    // The schedule requests count loops for cities that aren't on the timetable now (see METRICS)
    if (SCHEDULE_TYPES.includes(email.type)) started = { ...started, extra: { ...started.extra, baseNames: (snap.timetableEntries || []).map(t => t.name) } }
    // Renames are counted from now on with the rename counter (see METRICS), also for a request that arrived before it existed
    if (email.type === 'rename') started = { ...started, extra: { ...started.extra, countsRenames: true } }
    // Builds, connections and upgrades are counted from what the player has now (see METRICS), when the game says what that is
    const base = {}
    if (email.type === 'build' && snap.builtNames) base.baseBuilt = [...(snap.builtNames[email.extra.category] || [])]
    if (snap.cityList) {
        if (CITY_TYPES.includes(email.type)) base.baseCities = snap.cityList.map(c => c.name)
        if (email.type === 'connectCountries') base.baseCountries = [...new Set(snap.cityList.map(c => c.country).filter(Boolean))]
        if (email.type === 'newContinent') base.baseContinents = [...new Set(snap.cityList.map(c => c.continent).filter(Boolean))]
    }
    if (email.type === 'upgradeDev' && snap.devUpgradeLevels) base.baseDevUpgrades = { ...snap.devUpgradeLevels }
    if (email.type === 'upgradeCity' && snap.cityLevels) base.baseCityLevels = { ...snap.cityLevels }
    if (Object.keys(base).length) started = { ...started, extra: { ...started.extra, ...base } }
    return {
        ...started, state: 'agreed', agreedAt: now, deadline: now + email.hours * HOUR,
        // (the Reputation for agreeing is paid just after this, and isn't part of an "earn N Reputation" request)
        baseline: email.type === 'clearInbox' && !email.extra?.countsAnswers && Array.isArray(email.extra?.waitingIds) ? 0 : metricOf(started, snap) + (email.type === 'rep' ? (Number(email.agreeBonus) || 0) : 0), progress: (inbox && waiting === 0) || email.type === 'payUpfront' ? started.target : 0, reply: replyFor(email, true, playerName), read: true,
        repChange: email.agreeBonus,
    }
}

export function refuse(email, playerName, cult, now = Date.now(), ignored = false) {
    const change = cult ? 0 : -email.refusePenalty
    return {
        ...email, state: ignored ? 'ignored' : 'refused', resolvedAt: now,
        reply: ignored ? null : replyFor(email, false, playerName), read: true, ...replyDelay(now), repPending: change !== 0,
        outcome: OUTCOME_TEXT[ignored ? 'ignored' : 'refused'](email), repChange: change,
    }
}

// Checks one agreed email against the game. Returns the same email when nothing happened.
export function updateAgreed(email, snap, now = Date.now()) {
    if (email.state !== 'agreed') return email
    if (HOLD_READS[email.type]) {
        // Fails the moment the number is below the target; succeeds when the deadline arrives with it still above
        if (HOLD_READS[email.type](snap) < email.target) return { ...email, state: 'failed', resolvedAt: now, read: true, ...replyDelay(now), repPending: true, outcome: OUTCOME_TEXT.failed(email), repChange: -email.penalty }
        if (now >= email.deadline) return { ...email, progress: email.target, state: 'fulfilled', resolvedAt: now, read: true, ...replyDelay(now), repPending: true, outcome: OUTCOME_TEXT.fulfilled(email), repChange: email.reward }
        const span = Math.max(1, email.deadline - (email.agreedAt || now))
        const shown = Math.max(0, Math.min(email.target, Math.round(email.target * ((now - (email.agreedAt || now)) / span))))
        return shown === (email.progress || 0) ? email : { ...email, progress: shown }
    }
    // Remembers each new thing counted, so it still counts if it goes again (see NEW_ITEMS)
    const items = seenItems(email, snap)
    const before = email
    if (items && items.length > (email.extra?.seen?.length || 0)) email = { ...email, extra: { ...email.extra, seen: items } }
    const progress = progressOf(email, snap)
    if (progress >= email.target) {
        return { ...email, progress: email.target, state: 'fulfilled', resolvedAt: now, read: true, ...replyDelay(now), repPending: true, outcome: OUTCOME_TEXT.fulfilled(email), repChange: email.reward }
    }
    if (now >= email.deadline) {
        return { ...email, progress, state: 'failed', resolvedAt: now, read: true, ...replyDelay(now), repPending: true, outcome: OUTCOME_TEXT.failed(email), repChange: -email.penalty }
    }
    return progress === (email.progress || 0) && email === before ? email : { ...email, progress }
}

export const isOpen = (e) => e.state === 'new' || e.state === 'agreed'
export const timeLeft = (email, now = Date.now()) => {
    const end = email.state === 'new' ? email.createdAt + IGNORE_AFTER_MS : email.deadline
    return Math.max(0, (end || 0) - now)
}
export function formatLeft(ms) {
    const mins = Math.ceil(ms / 60000)
    if (mins >= 120) return `${Math.floor(mins / 60)}h ${mins % 60}m`
    if (mins >= 60) return `1h ${mins - 60}m`
    return `${Math.max(1, mins)}m`
}

// ---- storage ---------------------------------------------------------------------------------------------------
const validEmail = (e) => e && typeof e === 'object' && typeof e.id === 'string' && typeof e.type === 'string' && typeof e.state === 'string'
    && Number.isFinite(e.target) && Number.isFinite(e.createdAt) && e.sender && typeof e.sender.name === 'string' && typeof e.body === 'string'
export function readEmails() {
    try {
        const list = JSON.parse(localStorage.getItem(EMAILS_KEY))
        return Array.isArray(list) ? list.filter(validEmail) : []
    } catch { return [] }
}
export function writeEmails(list) {
    const open = list.filter(isOpen)
    // A finished email whose reply hasn't been opened yet still carries Reputation (repPending), so it is kept however old it is
    const done = [...list.filter(e => !isOpen(e) && e.repPending), ...list.filter(e => !isOpen(e) && !e.repPending).slice(-KEEP_RESOLVED)]
    const kept = list.filter(e => open.includes(e) || done.includes(e))
    try { localStorage.setItem(EMAILS_KEY, JSON.stringify(kept)) } catch { /* storage full */ }
    return kept
}
// Where today's schedule is: which day, how many have been sent, and how long (ms of play) until the next one
export function readMeta() {
    try {
        const m = JSON.parse(localStorage.getItem(EMAIL_META_KEY))
        if (m && typeof m === 'object' && !Array.isArray(m)) return { day: typeof m.day === 'string' ? m.day : '', sent: Number(m.sent) || 0, wait: Number.isFinite(m.wait) ? m.wait : 0, senders: Array.isArray(m.senders) ? m.senders.filter(x => typeof x === 'string') : [], idle: m.idle === true }
    } catch { /* none yet */ }
    return { day: '', sent: 0, wait: 0, senders: [] }
}
export function writeMeta(meta) { try { localStorage.setItem(EMAIL_META_KEY, JSON.stringify(meta)) } catch { /* storage full */ } }

export const openCount = (emails) => emails.filter(isOpen).length

// The most wait one check of the schedule may take off. A hidden tab is slowed by the browser to about one tick a minute, so the
// check (every fifth tick) can be five minutes apart and should still count in full; a laptop that slept counts for only this much
export const MAX_STEP_MS = 10 * MIN
// One step of the schedule: a new day starts a fresh allowance with the first email 5-10 minutes away; otherwise `elapsed`
// ms of play are taken off the wait. `due` is true when the next email may go out now.
export function stepMeta(meta, elapsed, now = Date.now(), rnd = Math.random) {
    const today = new Date(now).toDateString()
    let m = meta
    if (m.day !== today) m = { day: today, sent: 0, senders: [], wait: between(5 * 60, 10 * 60, rnd) * 1000 }
    else if (m.sent < MAX_PER_DAY) m = { ...m, wait: Math.max(0, m.wait - Math.max(0, elapsed)) }
    return { meta: m, due: m.sent < MAX_PER_DAY && m.wait <= 0 }
}
// An email went out: the next one is 10-15 minutes of play away (none left today after the third)
export const afterArrival = (meta, who = 'public', rnd = Math.random) => ({ ...meta, sent: meta.sent + 1, senders: [...(meta.senders || []), who], wait: between(10 * 60, 15 * 60, rnd) * 1000, idle: false })
// Nobody had anything to ask for: look again in 5 minutes (things change as the terminal grows). `idle` tells the inbox
// footer not to promise an email in 5 minutes that may not come.
export const retryLater = (meta) => ({ ...meta, wait: 5 * MIN, idle: true })

// Used by tests and the milestone list: the categories a build request may name
export const BUILD_CATEGORIES = Object.keys(DEVELOPMENT_MILESTONES)
