import click_sound_2 from '../assets/sounds/click_sound_2.mp3'
import click_sound_3 from '../assets/sounds/click_sound_3.mp3'
import rankUpSound from '../assets/sounds/rankUpSound.mp3'
import leavingSound from '../assets/sounds/leavingSound.mp3'
import farewellAcceptSound from '../assets/sounds/farewellAccept.mp3'
import specialChime from '../assets/sounds/specialChime.mp3'
import constructionSound from '../assets/sounds/constructionSound.mp3'
import workClickSound from '../assets/sounds/workClickSound.mp3'
import hoverSound from '../assets/sounds/hoverSound.mp3'
import reputationWorkBonus from '../assets/sounds/reputationBonusWork.mp3'
import bottomNavbarHover from '../assets/sounds/bottomNavbarHover.mp3'
import openingAudio from '../assets/sounds/openingAudio.mp3'
import automatedScheduleSound from '../assets/sounds/automatedSchedule.mp3'
import developmentUnlocked from '../assets/sounds/developmentUnlocked.mp3'
import eventSound from '../assets/sounds/eventSound.mp3'
import diceRollSound from '../assets/sounds/diceRoll.mp3'
import tier3CitySound from '../assets/sounds/tier3City.mp3'
import dailyLoginSound from '../assets/sounds/dailyLogin.wav'
import notEnoughFundsSound from '../assets/sounds/notEnoughFunds.wav'
import departureBoardSound from '../assets/sounds/departureBoard.mp3'
import phoneNotificationSound from '../assets/sounds/phoneNotification.mp3'
import splitFlapLong from '../assets/sounds/splitFlapLong.wav'
import splitFlapShort from '../assets/sounds/splitFlapShort.wav'
import { getEquippedItem } from './cosmetics.js'

let audioUnlocked = false

const unlockAudio = () => {
    if (audioUnlocked) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ctx.resume().catch(() => {})
    audioUnlocked = true
}

document.addEventListener('touchstart', unlockAudio, { once: true })
document.addEventListener('click', unlockAudio, { once: true })

function canPlay() {
    return localStorage.getItem('soundEnabled') !== 'false'
}

// Every distinct sound in the game belongs to one of these categories, each with its own volume slider and mute
// switch in Settings, on top of the overall Master Sound slider/mute that scales all of them together. Order
// here is the order they're shown in Settings.
export const SOUND_CATEGORIES = [
    { key: 'master', label: 'Master Sound' },
    { key: 'opening', label: 'Opening Audio' },
    { key: 'workClicks', label: 'Work Clicks' },
    { key: 'hover', label: 'Hover Sound Effect' },
    { key: 'hyperlink', label: 'Hyper-Link Notification' },
    { key: 'departureBoard', label: 'Departure Board Flaps' },
    { key: 'event', label: 'Event Notification' },
    { key: 'dailyBonus', label: 'Daily Bonus Notification' },
    { key: 'progressClaim', label: 'Progress Claim' },
    { key: 'clickSounds', label: 'Click Sounds' },
    { key: 'construction', label: 'Construction Sound' },
    { key: 'saveSound', label: 'Save Sound' },
    { key: 'farewellGreeting', label: 'Farewell/Greeting Notification' },
]

const VOLUME_KEY = 'soundVolumes'
const MUTE_KEY = 'soundMuted'

function readMap(key) {
    try {
        const raw = localStorage.getItem(key)
        const parsed = raw ? JSON.parse(raw) : null
        return parsed && typeof parsed === 'object' ? parsed : {}
    } catch { return {} }
}

function writeMap(key, map) {
    try { localStorage.setItem(key, JSON.stringify(map)) } catch {}
}

export function getCategoryVolume(category) {
    const v = readMap(VOLUME_KEY)[category]
    return typeof v === 'number' && v >= 0 && v <= 1 ? v : 1
}

export function setCategoryVolume(category, volume) {
    const map = readMap(VOLUME_KEY)
    map[category] = Math.max(0, Math.min(1, volume))
    writeMap(VOLUME_KEY, map)
}

export function isCategoryMuted(category) {
    return readMap(MUTE_KEY)[category] === true
}

export function setCategoryMuted(category, muted) {
    const map = readMap(MUTE_KEY)
    map[category] = !!muted
    writeMap(MUTE_KEY, map)
}

// The volume a sound in `category` should actually play at: Master Sound's own slider/mute always applies, on
// top of that category's own slider/mute. A category of null (a Shop preview, where the player is deliberately
// testing a clip) only goes through Master, not any specific category.
function categoryMultiplier(category) {
    if (isCategoryMuted('master')) return 0
    const master = getCategoryVolume('master')
    if (!category) return master
    if (isCategoryMuted(category)) return 0
    return master * getCategoryVolume(category)
}

// The same sound asked for twice within a few milliseconds is one sound, not two on top of each other. Two copies at the same
// instant are twice as loud, and clip: React's StrictMode runs an effect twice in development, which made the development
// reveal sound piercing there (a production build was fine). Nothing ever wants a double play that close together, so the
// second request just gets the first one's audio back (some callers keep it to stop it later).
const SAME_SOUND_GAP_MS = 40
const lastPlayed = new Map()   // src -> { at, audio }

function play(src, category) {
    if (!canPlay()) return null
    const volume = categoryMultiplier(category)
    if (volume <= 0) return null
    const now = performance.now()
    const last = lastPlayed.get(src)
    if (last && now - last.at < SAME_SOUND_GAP_MS) return last.audio
    const audio = new Audio(src)
    audio.volume = volume
    audio.play().catch(() => {})
    lastPlayed.set(src, { at: now, audio })
    return audio
}

// The hover tick fires for every item the mouse crosses, so sweeping down a long list used to start dozens of
// overlapping copies of it: much louder (about +5 dB) and a rattling buzz instead of ticks. Now there is one shared
// sound that restarts, at most one tick per HOVER_MIN_GAP_MS, at a lower volume. Tweak the two numbers to taste.
const HOVER_MIN_GAP_MS = 90
const HOVER_VOLUME = 0.5
let hoverAudio = null
let hoverAudioSrc = null
let lastHoverAt = 0

// src lets a caller (the Terminal Board, with a custom board theme) use a different hover tick. The default
// hover sound is used when none is given, same as before.
function playHover(src = hoverSound) {
    if (!canPlay()) return
    const volume = categoryMultiplier('hover')
    if (volume <= 0) return
    const now = performance.now()
    if (now - lastHoverAt < HOVER_MIN_GAP_MS) return
    lastHoverAt = now
    if (!hoverAudio || hoverAudioSrc !== src) {
        hoverAudio = new Audio(src)
        hoverAudioSrc = src
    }
    hoverAudio.volume = HOVER_VOLUME * volume
    hoverAudio.currentTime = 0
    hoverAudio.play().catch(() => {})
}

export const playEventSound = () => play(eventSound, 'event')
export const playDiceRollSound = () => play(diceRollSound, 'clickSounds')
// Picks a random sample from a pool, excluding whichever one `lastRef` says played last time (unless the pool
// is down to one sample), plays it, and updates `lastRef`. Used for any click sound that's meant to be mashed
// fast - clicking fast enough for two picks to overlap is fine (that's normal, even desirable, variety) as long
// as it's never the exact same clip twice in a row: two overlapping copies of the same waveform a few hundred ms
// out of phase read as one harsh, piercing spike rather than two clicks.
function playRandomNoRepeat(pool, lastRef, category) {
    const choices = pool.length > 1 ? pool.filter(src => src !== lastRef.src) : pool
    const pick = choices[Math.floor(Math.random() * choices.length)]
    lastRef.src = pick
    return play(pick, category)
}

// Mashing the Work button fast enough starts a new copy on every single click, with nothing to stop them piling
// up - three or four different samples all ringing at once reads as one harsh overlapping screech rather than a
// flourish, most noticeable on samples with a longer sustain (Princess's harp glissandos ring much longer than,
// say, a quack). So at most MAX_CONCURRENT_WORK_CLICKS copies are ever sounding at once: once that cap is hit,
// the oldest one is faded out quickly (rather than cut off instantly, which itself clicks/pops) to make room for
// the new one. Normal, human-paced tapping never gets anywhere near the cap.
const MAX_CONCURRENT_WORK_CLICKS = 2
const WORK_CLICK_FADE_OUT_MS = 60
let activeWorkClickAudios = []

function fadeOutAndStop(audio) {
    const startVolume = audio.volume
    const start = performance.now()
    const step = () => {
        if (audio.paused) return
        const t = (performance.now() - start) / WORK_CLICK_FADE_OUT_MS
        if (t >= 1) { audio.pause(); return }
        audio.volume = startVolume * (1 - t)
        requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
}

// The Work button's sound is whichever one is equipped in the Shop (the classic click by default). A 'special'-tier
// work sound can equip several samples (srcs) instead of one.
const WORK_CLICK_MIN_GAP_MS = 70
const lastWorkClick = { src: null }
let lastWorkClickAt = 0
export function playWorkClickSound() {
    const now = performance.now()
    if (now - lastWorkClickAt < WORK_CLICK_MIN_GAP_MS) return
    lastWorkClickAt = now
    const item = getEquippedItem('workSound')
    activeWorkClickAudios = activeWorkClickAudios.filter(a => !a.ended && !a.paused)
    while (activeWorkClickAudios.length >= MAX_CONCURRENT_WORK_CLICKS) {
        fadeOutAndStop(activeWorkClickAudios.shift())
    }
    const audio = playRandomNoRepeat(item?.srcs?.length ? item.srcs : [item?.src ?? workClickSound], lastWorkClick, 'workClicks')
    if (audio) activeWorkClickAudios.push(audio)
}

// The Shop's Preview button for a Work sound: sounds the same as actually mashing the Work button (see
// playRandomNoRepeat above) rather than cutting itself off, since that's exactly the
// behaviour the player is trying to judge by previewing it.
const lastWorkPreview = { src: null }
let lastWorkPreviewAt = 0
let workPreviewAudio = null
export function playWorkSoundPreview(src) {
    if (!canPlay()) return
    const now = performance.now()
    if (now - lastWorkPreviewAt < WORK_CLICK_MIN_GAP_MS) return
    lastWorkPreviewAt = now
    workPreviewAudio = playRandomNoRepeat(Array.isArray(src) ? src : [src], lastWorkPreview, 'workClicks')
}

// The Shop's Preview button for anything else (Opening audios and the like) - a sound meant to play once, not
// be mashed, so only one preview ever plays at a time: clicking Preview again, on the same item or a different
// one, stops whatever preview is already going first rather than layering a new copy on top of it. A preview is
// a deliberate, explicit test of a clip, so it only follows Master Sound, not whichever category it belongs to.
let previewAudio = null
// Returns the Audio it started (or null if sound is off), so the Shop can show a playing/stopped state on its
// own Preview button and know when the clip finishes on its own (the 'ended' event).
export function playPreviewSound(src) {
    if (!canPlay()) return null
    const volume = categoryMultiplier(null)
    if (volume <= 0) return null
    if (previewAudio) { previewAudio.pause(); previewAudio.currentTime = 0 }
    previewAudio = new Audio(Array.isArray(src) ? src[Math.floor(Math.random() * src.length)] : src)
    previewAudio.volume = volume
    previewAudio.play().catch(() => {})
    return previewAudio
}
// Stops whichever Shop preview (Preview button sound, or a Work sound preview) is currently playing. Called when
// the Shop closes, so a preview doesn't keep playing on top of the game once the player has left it.
export function stopPreviewSound() {
    if (previewAudio) { previewAudio.pause(); previewAudio.currentTime = 0; previewAudio = null }
    if (workPreviewAudio) { workPreviewAudio.pause(); workPreviewAudio.currentTime = 0; workPreviewAudio = null }
}
// The Terminal Board's own buttons (schedule, automate, the board tabs, Farewell, Delay) use these instead of the
// generic click/hover, so an equipped board theme's own sounds (if it sets any) are heard there and nowhere else.
export function playBoardClickSound()           { play(getEquippedItem('boardTheme')?.clickSource ?? click_sound_2, 'departureBoard') }
export function playBoardHoverSound()           { playHover(getEquippedItem('boardTheme')?.hoverSound ?? hoverSound) }
export function playConstructionSound()         { play(constructionSound, 'construction') }
// The non-VIP sound for a Farewell/Greeting popup opening.
export function playLeavingSound()              { play(leavingSound, 'farewellGreeting') }
// The generic "confirmed" click heard across most of the game's confirm buttons (upgrades, purchases, skipping
// construction, and so on) - grouped under Click Sounds. Farewell/Greeting and Save have their own dedicated
// sounds below instead, even though they currently reuse the same clip.
export function playFarewellAcceptSound()       { play(farewellAcceptSound, 'clickSounds') }
// The Farewell/Greeting popup's own Accept button.
export function playFarewellConfirmSound()      { play(farewellAcceptSound, 'farewellGreeting') }
// The Settings page's manual Save button.
export function playSaveConfirmSound()          { play(farewellAcceptSound, 'saveSound') }
export function playSpecialChime()              { play(specialChime, 'progressClaim') }
// The VIP sound for a Farewell/Greeting popup opening.
export function playFarewellVipSound()          { play(specialChime, 'farewellGreeting') }
export function playClickSound2()               { play(click_sound_2, 'clickSounds') }
export function playClickSound3()               { play(click_sound_3, 'clickSounds') }
export function playRankUpSound()               { play(rankUpSound, 'progressClaim') }
export function playHoverSound()                { playHover() }
export function playReputationWorkBonusSound()  { play(reputationWorkBonus, 'progressClaim') }
export function playBottomNavbarHoverSound()    { play(bottomNavbarHover, 'hover') }
// The sound that plays the two times you "arrive": clicking through the loading screen, and finishing
// construction on your first city. Whichever one is equipped in the Shop's Opening audios (the classic chime
// by default).
export function playOpeningAudio() {
    const item = getEquippedItem('openingAudio')
    play(item?.src ?? openingAudio, 'opening')
}
export function playAutomatedScheduleSound()    { play(automatedScheduleSound, 'departureBoard') }
export function playDevelopmentUnlockedSound()  { play(developmentUnlocked, 'progressClaim') }
// Plays once when a city-choice roll includes a Tier 3 city, so pulling one feels like a moment.
export function playTier3CitySound()            { play(tier3CitySound, 'progressClaim') }
export function playDailyLoginSound()           { play(dailyLoginSound, 'dailyBonus') }
export function playNotEnoughFundsSound()       { play(notEnoughFundsSound, 'clickSounds') }
export function playSplitFlapLong()  { return play(splitFlapLong, 'departureBoard') }

// One shared clack, reused and restarted from the top on every call. Switching tabs on the Terminal Board fires
// this a lot in quick succession; a fresh Audio() each time used to leave the old copies playing underneath,
// which piled up into a buzzing drone instead of a single clean clack per switch.
let shortFlapAudio = null
export function playSplitFlapShort() {
    if (!canPlay()) return
    const volume = categoryMultiplier('departureBoard')
    if (volume <= 0) return
    if (!shortFlapAudio) shortFlapAudio = new Audio(splitFlapShort)
    shortFlapAudio.volume = volume
    shortFlapAudio.currentTime = 0
    shortFlapAudio.play().catch(() => {})
}
export function playPhoneNotificationSound() { play(phoneNotificationSound, 'hyperlink') }
export function playDepartureBoardSound() {
    if (!canPlay()) return null
    const volume = categoryMultiplier('departureBoard')
    if (volume <= 0) return null
    const audio = new Audio(departureBoardSound)
    audio.volume = volume
    audio.play().catch(() => {})
    return audio
}
