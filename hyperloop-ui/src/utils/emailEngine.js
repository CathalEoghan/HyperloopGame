// Emails: now and then someone asks the Manager (the player) for something. The player Agrees or Refuses, and a reply is
// written in their name. After agreeing there is a deadline; meeting it pays Reputation, missing it costs Reputation.
//
// Everything here is plain data in and out so it can be tested without the game. App.jsx owns the state: it keeps the
// list in localStorage (EMAILS_KEY), feeds `snapshot()` numbers in once a second, and applies the Reputation changes.
// Base amounts (before scaling): refuse -5, agree +5, fulfil +25, fail -25. `scaleFor` grows them with the terminal.
import { DEVELOPMENT_MILESTONES } from '../data/developmentMilestones.js'
import { FIRST_NAMES_MALE, FIRST_NAMES_FEMALE, SURNAMES } from '../data/hyperLinkData.js'

export const EMAILS_KEY = 'hyperloop_emails'
export const EMAIL_META_KEY = 'hyperloop_email_meta'
export const PLAYER_NAME_KEY = 'hyperloop_player_name'
// The recurring senders: their names (chosen once, kept for good) and how the player last answered each
export const CAST_KEY = 'hyperloop_email_cast'

// Like daily quests: up to 3 a day, reset at midnight (the player's own clock). The first comes 5-10 minutes into the day's play,
// the second and third 10-15 minutes after the one before. These timers only run while the game is open.
export const MAX_PER_DAY = 3
const MIN = 60000
export const MAX_OPEN = 3
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
export const formatCash = (n) => {
    if (n >= 1e9) return `£${(n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1)}B`
    if (n >= 1e6) return `£${(n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1)}M`
    if (n >= 1e3) return `£${(n / 1e3).toFixed(n % 1e3 === 0 ? 0 : 1)}K`
    return `£${formatCount(n)}`
}

// ---- recurring characters ---------------------------------------------------------------------------------------
// Each has a voice (how requests are worded, how replies and results are answered) and the kinds of request they tend to
// send. `last` (how the player treated their previous request) is remembered in the cast and mentioned in the next email.
// Their pictures are optional files in assets/email-avatars/<id>.(jpg|png|webp); without one a coloured initial is shown.
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1)
export const CHARACTERS = {
    stakeholder: {
        id: 'stakeholder', gender: 'm', role: 'Major Stakeholder', color: '#6b4f3a',
        affinity: ['build', 'cash', 'connectCities', 'connectContinent', 'rankUp', 'upgradeCity'],
        intros: [
            (ask) => `I will be brief. I expect you to ${ask}.`,
            (ask) => `I have a great deal invested in this terminal and I expect results. ${cap(ask)}.`,
            (ask) => `Frankly, I am not impressed with the pace of things. ${cap(ask)}.`,
        ],
        deadline: (t) => `I want it done within ${t} of you agreeing.`,
        outros: ['Do not make me ask twice.', 'I expect an answer today.', 'I trust I have made myself clear.'],
        signoff: 'Regards,',
        after: { fulfilled: 'Good work last time. Let us see if you can keep it up.', failed: 'Last time you let me down. Do not do it again.', refused: 'You turned me down last time. I remember these things.', ignored: 'You never even replied last time.' },
        outcome: { fulfilled: 'Acceptable.', failed: 'This is unacceptable. I expected better.', refused: 'Noted. I am not happy about it.', ignored: 'No reply at all. Very professional.' },
    },
    inspector: {
        id: 'inspector', gender: 'f', role: 'Health Inspector', color: '#2f8f6b',
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
        id: 'complainer', gender: 'f', role: 'Frequent Traveller', color: '#a0306a',
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
        id: 'fan', gender: 'any', role: 'Biggest Fan', color: '#d4552f',
        affinity: ['like', 'greet', 'farewell', 'shop', 'work', 'rename'],
        intros: [
            (ask) => `I CANNOT STOP THINKING ABOUT THIS TERMINAL!!! Please, please, PLEASE ${ask}!!!`,
            (ask) => `I have your timetable on my wall and I have named my goldfish after your first city. Could you ${ask}?? It would make my entire year!!`,
            (ask) => `You do not know me but I have followed everything you have ever done (in a normal way!!). Would you ${ask}?!`,
        ],
        deadline: (t) => `I will be refreshing my inbox every few seconds for ${t}!!!`,
        outros: ['I LOVE YOU (the terminal!!)', 'Please say yes, I am vibrating!!', 'I have made you a banner!!'],
        signoff: 'Forever yours,',
        after: { fulfilled: 'I screamed with joy last time and I will scream again!!', failed: 'I cried a little last time but I forgive you completely!!', refused: 'I was devastated when you said no, but I am BACK!!', ignored: 'I checked my inbox 400 times and nothing came, but I still believe!!' },
        outcome: { fulfilled: 'I AM SCREAMING!!! THANK YOU!!!', failed: 'It is fine!! I am fine!! I am so fine!!', refused: 'That is OK!! I still love you!!', ignored: 'No reply, but I will wait forever!!' },
    },
    assistant: {
        id: 'assistant', gender: 'any', role: 'Your Assistant', color: '#4a7a9b',
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
        id: 'security', gender: 'm', role: 'Head of Security', color: '#3b4a45',
        affinity: ['build', 'connectCities', 'upgradeCity', 'schedule', 'rankUp', 'connectContinent'],
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
    journalist: {
        id: 'journalist', gender: 'f', role: 'Journalist', color: '#6a4fa0',
        affinity: ['rep', 'cash', 'connectContinent', 'like', 'rankUp', 'greet'],
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
    politician: {
        id: 'politician', gender: 'm', role: 'Local Councillor', color: '#8a6d2f',
        affinity: ['build', 'connectCities', 'connectContinent', 'rankUp', 'cash'],
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
    engineer: {
        id: 'engineer', gender: 'any', role: 'Head Engineer', color: '#2f6f8f',
        affinity: ['upgradeDev', 'upgradeCity', 'build', 'schedule'],
        intros: [
            (ask) => `Following a comprehensive optimisation analysis, the logical course of action is to ${ask}.`,
            (ask) => `The empirical evidence is unambiguous: we should ${ask}. Anything else is statistically indefensible.`,
            (ask) => `By my calculations, the most efficient allocation of resources necessitates that you ${ask}.`,
        ],
        deadline: (t) => `The optimal implementation window is ${t} subsequent to your affirmation.`,
        outros: ['The conclusion is therefore self-evident.', 'I remain available for any methodological clarification.', 'Please advise accordingly.'],
        signoff: 'Rigorously,',
        after: { fulfilled: 'The previous intervention yielded satisfactory results.', failed: 'The previous intervention failed to materialise within the specified parameters.', refused: 'Your prior rejection was, regrettably, suboptimal.', ignored: 'My previous communication elicited no discernible response.' },
        outcome: { fulfilled: 'The outcome is entirely satisfactory.', failed: 'The deadline was not met. The data is regrettably conclusive.', refused: 'A suboptimal decision, but your prerogative.', ignored: 'The absence of a response is, in itself, a data point.' },
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

const addressee = (name) => (name && name.trim()) || 'Manager'
const firstName = (sender) => sender.name.split(' ')[0]

// What each request measures. `metric` reads one number out of the snapshot; progress is how far it has risen since the
// player agreed. `label` is the short line shown beside the progress bar.
const METRICS = {
    build: (s, e) => s.built?.[e.extra.category] || 0,
    greet: (s) => s.greetings || 0,
    farewell: (s) => s.farewells || 0,
    schedule: (s) => s.timetable || 0,
    cash: (s) => s.cash || 0,
    rep: (s) => s.repEarned || 0,
    connectContinent: (s, e) => s.continentCities?.[e.extra.continent] || 0,
    connectCities: (s) => s.cities || 0,
    rankUp: (s) => s.rank || 0,
    upgradeDev: (s) => s.devUpgrades || 0,
    upgradeCity: (s) => s.cityUpgrades || 0,
    shop: (s) => s.shopOwned || 0,
    work: (s) => s.work || 0,
    rename: (s) => s.renames || 0,
    like: (s) => s.likes || 0,
}

export const metricOf = (email, snap) => (METRICS[email.type] ? METRICS[email.type](snap, email) : 0)
export const progressOf = (email, snap) => Math.max(email.progress || 0, metricOf(email, snap) - (email.baseline || 0))

export const progressLabel = (email) => {
    const cash = email.type === 'cash'
    const have = Math.min(email.progress || 0, email.target)
    return cash ? `${formatCash(have)} of ${formatCash(email.target)}` : `${formatCount(Math.floor(have))} of ${formatCount(email.target)}`
}

const plural = (n, one, many) => (n === 1 ? one : many)

// ---- request generators ------------------------------------------------------------------------------------------
// Each returns null when the request could not be done right now (so the player is never asked for the impossible), or
// { type, target, extra, subject, ask, hours }. `ask` is the sentence the body is built around. ctx comes from App.jsx:
// { snap, incomePerHour, available: { categories: [..], continents: { Europe: 2, .. }, citiesTotal }, shopCheapest,
//   unrenamed, devsWithUpgrade, rankUpsPossible }
const GENERATORS = {
    build: (ctx, rnd) => {
        const cats = ctx.available?.categories || []
        if (cats.length === 0) return null
        const category = pick(cats, rnd)
        return { type: 'build', target: 1, extra: { category }, subject: `New ${category} development`, ask: `build a ${category} development at the terminal`, hours: between(36, 48, rnd) }
    },
    greet: (ctx, rnd) => {
        const target = between(2, 5, rnd)
        return { type: 'greet', target, extra: {}, subject: 'Welcoming our passengers', ask: `greet the passengers arriving at the terminal ${target} ${plural(target, 'time', 'times')}`, hours: between(24, 36, rnd) }
    },
    farewell: (ctx, rnd) => {
        const target = between(2, 5, rnd)
        return { type: 'farewell', target, extra: {}, subject: 'Seeing passengers off', ask: `say farewell to departing passengers ${target} ${plural(target, 'time', 'times')}`, hours: between(24, 36, rnd) }
    },
    schedule: (ctx, rnd) => {
        if ((ctx.snap.cities || 0) < 2) return null
        const target = between(1, 3, rnd)
        return { type: 'schedule', target, extra: {}, subject: 'Timetable additions', ask: `schedule ${target} more ${plural(target, 'loop', 'loops')} in the timetable`, hours: between(24, 48, rnd) }
    },
    cash: (ctx, rnd) => {
        const perHour = ctx.incomePerHour || 0
        if (perHour <= 0) return null
        const target = niceRound(perHour * between(3, 8, rnd))
        return { type: 'cash', target, extra: {}, subject: 'Quarterly figures', ask: `earn ${formatCash(target)} for the terminal`, hours: between(24, 48, rnd) }
    },
    rep: (ctx, rnd) => {
        const f = scaleFor(ctx.snap.reputation)
        const target = niceRound(Math.max(10, Math.round(15 * f)))
        return { type: 'rep', target, extra: {}, subject: 'Our public image', ask: `earn ${formatCount(target)} Reputation for the terminal`, hours: between(24, 48, rnd) }
    },
    connectContinent: (ctx, rnd) => {
        const options = Object.entries(ctx.available?.continents || {}).filter(([, n]) => n > 0)
        if (options.length === 0) return null
        const [continent] = pick(options, rnd)
        return { type: 'connectContinent', target: 1, extra: { continent }, subject: `Expanding into ${continent}`, ask: `connect a new city in ${continent}`, hours: between(36, 48, rnd) }
    },
    connectCities: (ctx, rnd) => {
        const room = ctx.available?.citiesTotal || 0
        if (room < 1) return null
        const target = Math.min(room, between(1, 3, rnd))
        return { type: 'connectCities', target, extra: {}, subject: 'Network growth', ask: `connect ${target} new ${plural(target, 'city', 'cities')} to the network`, hours: between(36, 48, rnd) }
    },
    rankUp: () => {
        return { type: 'rankUp', target: 1, extra: {}, subject: 'Moving up', ask: 'take the terminal up a rank', hours: 48 }
    },
    upgradeDev: (ctx, rnd) => {
        if ((ctx.devsWithUpgrade || 0) < 1) return null
        const target = between(1, 2, rnd)
        return { type: 'upgradeDev', target, extra: {}, subject: 'Development upgrades', ask: `upgrade a development ${target} ${plural(target, 'time', 'times')}`, hours: between(24, 48, rnd) }
    },
    upgradeCity: (ctx, rnd) => {
        if ((ctx.snap.cities || 0) < 2) return null
        const target = between(1, 2, rnd)
        return { type: 'upgradeCity', target, extra: {}, subject: 'Line upgrades', ask: `upgrade a city's line ${target} ${plural(target, 'time', 'times')}`, hours: between(24, 48, rnd) }
    },
    shop: (ctx, rnd) => {
        if (!(ctx.shopCheapest > 0) || ctx.shopCheapest > 25) return null
        return { type: 'shop', target: 1, extra: {}, subject: 'A little something for the office', ask: 'buy something from the Shop', hours: between(24, 48, rnd) }
    },
    work: (ctx, rnd) => {
        const target = between(4, 12, rnd) * 25
        return { type: 'work', target, extra: {}, subject: 'Rolling up our sleeves', ask: `click Work ${target} times`, hours: between(24, 36, rnd) }
    },
    rename: (ctx, rnd) => {
        if ((ctx.unrenamed || 0) < 1) return null
        const target = Math.min(ctx.unrenamed, between(1, 2, rnd))
        return { type: 'rename', target, extra: {}, subject: 'A fresh look', ask: `give ${target} ${plural(target, 'development', 'developments')} a new name`, hours: between(24, 48, rnd) }
    },
    like: (ctx, rnd) => {
        const target = between(3, 8, rnd)
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

// Make one email, or null if nothing fits. `types` lets a test force a type.
export function generateEmail(ctx, { rnd = Math.random, now = Date.now(), playerName = '', types = null, cast = null } = {}) {
    const order = [...(types || EMAIL_TYPES)].sort(() => rnd() - 0.5)
    for (const type of order) {
        const req = GENERATORS[type](ctx, rnd)
        if (!req) continue
        // Mostly one of the recurring characters whose usual requests include this one
        const people = cast ? CHARACTER_IDS.filter(id => CHARACTERS[id].affinity.includes(type) && cast[id]?.name) : []
        const character = people.length > 0 && rnd() < 0.75 ? CHARACTERS[pick(people, rnd)] : null
        const sender = character ? { name: cast[character.id].name, role: character.role } : { name: `${pick(rnd() < 0.5 ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE, rnd)} ${pick(SURNAMES, rnd)}`, role: 'Member of the Public' }
        const amounts = amountsFor(ctx.snap.reputation)
        // The Stakeholder gives less time
        const hours = character?.id === 'stakeholder' ? Math.min(req.hours, 36) : req.hours
        const within = hours >= 48 ? '2 days' : hours > 24 ? `${hours} hours` : 'a day'
        let text, referredBack = false
        if (character) {
            const last = now - (cast[character.id].lastAt || 0) <= MEMORY_MS ? cast[character.id].last : null
            const memory = last && character.after[last] ? `${character.after[last]}\n\n` : ''
            referredBack = memory !== ''
            text = `${memory}${pick(character.intros, rnd)(req.ask)}\n\n${character.deadline(within)}\n${pick(character.outros, rnd)}\n\n${character.signoff}\n${sender.name}\n${sender.role}`
        } else {
            text = `${pick(INTROS, rnd)(req.ask)}\n\nI need this done within ${within} of you agreeing.\n${pick(OUTROS, rnd)}\n\nKind regards,\n${sender.name}\n${sender.role}`
        }
        return {
            id: `em_${now}_${Math.floor(rnd() * 1e6)}`, referredBack,
            type: req.type, extra: req.extra, target: req.target, sender, character: character?.id || null,
            subject: req.subject, body: `Dear ${addressee(playerName).split(' ')[0]},\n\n${text}`,
            createdAt: now, state: 'new', read: false, hours,
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
const outcomeLine = (state, e) => `${firstName(e.sender)} writes: "${(CHARACTERS[e.character]?.outcome || DEFAULT_OUTCOME)[state]}"`
export const OUTCOME_TEXT = {
    fulfilled: (e) => outcomeLine('fulfilled', e),
    failed: (e) => outcomeLine('failed', e),
    refused: (e) => outcomeLine('refused', e),
    ignored: (e) => outcomeLine('ignored', e),
}

// ---- state changes (each returns a new email; the caller applies the Reputation) -----------------------------------------
// `cult` is true with Cult of Celebrity: refusing costs nothing.
export function agree(email, snap, playerName, now = Date.now()) {
    return {
        ...email, state: 'agreed', agreedAt: now, deadline: now + email.hours * HOUR,
        baseline: metricOf(email, snap), progress: 0, reply: replyFor(email, true, playerName), read: true,
        repChange: email.agreeBonus,
    }
}

export function refuse(email, playerName, cult, now = Date.now(), ignored = false) {
    const change = cult ? 0 : -email.refusePenalty
    return {
        ...email, state: ignored ? 'ignored' : 'refused', resolvedAt: now,
        reply: ignored ? null : replyFor(email, false, playerName), read: ignored ? false : true,
        outcome: OUTCOME_TEXT[ignored ? 'ignored' : 'refused'](email), repChange: change,
    }
}

// Checks one agreed email against the game. Returns the same email when nothing happened.
export function updateAgreed(email, snap, now = Date.now()) {
    if (email.state !== 'agreed') return email
    const progress = progressOf(email, snap)
    if (progress >= email.target) {
        return { ...email, progress: email.target, state: 'fulfilled', resolvedAt: now, read: false, outcome: OUTCOME_TEXT.fulfilled(email), repChange: email.reward }
    }
    if (now >= email.deadline) {
        return { ...email, progress, state: 'failed', resolvedAt: now, read: false, outcome: OUTCOME_TEXT.failed(email), repChange: -email.penalty }
    }
    return progress === (email.progress || 0) ? email : { ...email, progress }
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
    const done = list.filter(e => !isOpen(e)).slice(-KEEP_RESOLVED)
    const kept = list.filter(e => open.includes(e) || done.includes(e))
    try { localStorage.setItem(EMAILS_KEY, JSON.stringify(kept)) } catch { /* storage full */ }
    return kept
}
// Where today's schedule is: which day, how many have been sent, and how long (ms of play) until the next one
export function readMeta() {
    try {
        const m = JSON.parse(localStorage.getItem(EMAIL_META_KEY))
        if (m && typeof m === 'object' && !Array.isArray(m)) return { day: typeof m.day === 'string' ? m.day : '', sent: Number(m.sent) || 0, wait: Number.isFinite(m.wait) ? m.wait : 0 }
    } catch { /* none yet */ }
    return { day: '', sent: 0, wait: 0 }
}
export function writeMeta(meta) { try { localStorage.setItem(EMAIL_META_KEY, JSON.stringify(meta)) } catch { /* storage full */ } }

export const openCount = (emails) => emails.filter(isOpen).length

// One step of the schedule: a new day starts a fresh allowance with the first email 5-10 minutes away; otherwise `elapsed`
// ms of play are taken off the wait. `due` is true when the next email may go out now.
export function stepMeta(meta, elapsed, now = Date.now(), rnd = Math.random) {
    const today = new Date(now).toDateString()
    let m = meta
    if (m.day !== today) m = { day: today, sent: 0, wait: between(5 * 60, 10 * 60, rnd) * 1000 }
    else if (m.sent < MAX_PER_DAY) m = { ...m, wait: Math.max(0, m.wait - Math.max(0, elapsed)) }
    return { meta: m, due: m.sent < MAX_PER_DAY && m.wait <= 0 }
}
// An email went out: the next one is 10-15 minutes of play away (none left today after the third)
export const afterArrival = (meta, rnd = Math.random) => ({ ...meta, sent: meta.sent + 1, wait: between(10 * 60, 15 * 60, rnd) * 1000 })
// Nothing was possible to ask for (or three are already open): look again in 5 minutes
export const retryLater = (meta) => ({ ...meta, wait: 5 * MIN })

// Used by tests and the milestone list: the categories a build request may name
export const BUILD_CATEGORIES = Object.keys(DEVELOPMENT_MILESTONES)
