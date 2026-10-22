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

// The same sound asked for twice within a few milliseconds is one sound, not two on top of each other. Two copies at the same
// instant are twice as loud, and clip: React's StrictMode runs an effect twice in development, which made the development
// reveal sound piercing there (a production build was fine). Nothing ever wants a double play that close together, so the
// second request just gets the first one's audio back (some callers keep it to stop it later).
const SAME_SOUND_GAP_MS = 40
const lastPlayed = new Map()   // src -> { at, audio }

function play(src) {
    if (!canPlay()) return null
    const now = performance.now()
    const last = lastPlayed.get(src)
    if (last && now - last.at < SAME_SOUND_GAP_MS) return last.audio
    const audio = new Audio(src)
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
    const now = performance.now()
    if (now - lastHoverAt < HOVER_MIN_GAP_MS) return
    lastHoverAt = now
    if (!hoverAudio || hoverAudioSrc !== src) {
        hoverAudio = new Audio(src)
        hoverAudio.volume = HOVER_VOLUME
        hoverAudioSrc = src
    }
    hoverAudio.currentTime = 0
    hoverAudio.play().catch(() => {})
}

export const playEventSound = () => play(eventSound)
export const playDiceRollSound = () => play(diceRollSound)
// Picks a random sample from a pool, excluding whichever one `lastRef` says played last time (unless the pool
// is down to one sample), plays it, and updates `lastRef`. Used for any click sound that's meant to be mashed
// fast - clicking fast enough for two picks to overlap is fine (that's normal, even desirable, variety) as long
// as it's never the exact same clip twice in a row: two overlapping copies of the same waveform a few hundred ms
// out of phase read as one harsh, piercing spike rather than two clicks.
function playRandomNoRepeat(pool, lastRef) {
    const choices = pool.length > 1 ? pool.filter(src => src !== lastRef.src) : pool
    const pick = choices[Math.floor(Math.random() * choices.length)]
    lastRef.src = pick
    return play(pick)
}

// The Work button's sound is whichever one is equipped in the Shop (the classic click by default). A 'special'-tier
// work sound can equip several samples (srcs) instead of one.
//
// playRandomNoRepeat's "different sample each time" already stops the exact same clip doubling up on itself,
// but mashing the button fast enough still starts a new copy on every single click with nothing to stop them
// piling up - three or four different samples all ringing at once reads as one harsh overlapping screech
// rather than a flourish, most noticeable on samples with a longer sustain (Princess's harp glissandos ring
// much longer than, say, a quack). A short minimum gap between plays caps how many copies can stack without
// affecting normal, human-paced tapping (it's well under even a fast double-tap).
const WORK_CLICK_MIN_GAP_MS = 70
const lastWorkClick = { src: null }
let lastWorkClickAt = 0
export function playWorkClickSound() {
    const now = performance.now()
    if (now - lastWorkClickAt < WORK_CLICK_MIN_GAP_MS) return
    lastWorkClickAt = now
    const item = getEquippedItem('workSound')
    playRandomNoRepeat(item?.srcs?.length ? item.srcs : [item?.src ?? workClickSound], lastWorkClick)
}

// The Shop's Preview button for a Work sound: sounds the same as actually mashing the Work button (see
// playRandomNoRepeat and WORK_CLICK_MIN_GAP_MS above) rather than cutting itself off, since that's exactly the
// behaviour the player is trying to judge by previewing it.
const lastWorkPreview = { src: null }
let lastWorkPreviewAt = 0
let workPreviewAudio = null
export function playWorkSoundPreview(src) {
    if (!canPlay()) return
    const now = performance.now()
    if (now - lastWorkPreviewAt < WORK_CLICK_MIN_GAP_MS) return
    lastWorkPreviewAt = now
    workPreviewAudio = playRandomNoRepeat(Array.isArray(src) ? src : [src], lastWorkPreview)
}

// The Shop's Preview button for anything else (Opening audios and the like) - a sound meant to play once, not
// be mashed, so only one preview ever plays at a time: clicking Preview again, on the same item or a different
// one, stops whatever preview is already going first rather than layering a new copy on top of it.
let previewAudio = null
// Returns the Audio it started (or null if sound is off), so the Shop can show a playing/stopped state on its
// own Preview button and know when the clip finishes on its own (the 'ended' event).
export function playPreviewSound(src) {
    if (!canPlay()) return null
    if (previewAudio) { previewAudio.pause(); previewAudio.currentTime = 0 }
    previewAudio = new Audio(Array.isArray(src) ? src[Math.floor(Math.random() * src.length)] : src)
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
export function playBoardClickSound()           { play(getEquippedItem('boardTheme')?.clickSource ?? click_sound_2) }
export function playBoardHoverSound()           { playHover(getEquippedItem('boardTheme')?.hoverSound ?? hoverSound) }
export function playConstructionSound()         { play(constructionSound) }
export function playLeavingSound()              { play(leavingSound) }
export function playFarewellAcceptSound()       { play(farewellAcceptSound) }
export function playSpecialChime()              { play(specialChime) }
export function playClickSound2()               { play(click_sound_2) }
export function playClickSound3()               { play(click_sound_3) }
export function playRankUpSound()               { play(rankUpSound) }
export function playHoverSound()                { playHover() }
export function playReputationWorkBonusSound()  { play(reputationWorkBonus) }
export function playBottomNavbarHoverSound()    { play(bottomNavbarHover) }
// The sound that plays the two times you "arrive": clicking through the loading screen, and finishing
// construction on your first city. Whichever one is equipped in the Shop's Opening audios (the classic chime
// by default).
export function playOpeningAudio() {
    const item = getEquippedItem('openingAudio')
    play(item?.src ?? openingAudio)
}
export function playAutomatedScheduleSound()    { play(automatedScheduleSound) }
export function playDevelopmentUnlockedSound()  { play(developmentUnlocked) }
export function playDailyLoginSound()           { play(dailyLoginSound) }
export function playNotEnoughFundsSound()       { play(notEnoughFundsSound) }
export function playSplitFlapLong()  { return play(splitFlapLong) }

// One shared clack, reused and restarted from the top on every call. Switching tabs on the Terminal Board fires
// this a lot in quick succession; a fresh Audio() each time used to leave the old copies playing underneath,
// which piled up into a buzzing drone instead of a single clean clack per switch.
let shortFlapAudio = null
export function playSplitFlapShort() {
    if (!canPlay()) return
    if (!shortFlapAudio) shortFlapAudio = new Audio(splitFlapShort)
    shortFlapAudio.currentTime = 0
    shortFlapAudio.play().catch(() => {})
}
export function playPhoneNotificationSound() { play(phoneNotificationSound) }
export function playDepartureBoardSound() {
    if (!canPlay()) return null
    const audio = new Audio(departureBoardSound)
    audio.play().catch(() => {})
    return audio
}