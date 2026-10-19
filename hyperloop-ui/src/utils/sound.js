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
let lastHoverAt = 0

function playHover() {
    if (!canPlay()) return
    const now = performance.now()
    if (now - lastHoverAt < HOVER_MIN_GAP_MS) return
    lastHoverAt = now
    if (!hoverAudio) {
        hoverAudio = new Audio(hoverSound)
        hoverAudio.volume = HOVER_VOLUME
    }
    hoverAudio.currentTime = 0
    hoverAudio.play().catch(() => {})
}

export const playEventSound = () => play(eventSound)
export const playDiceRollSound = () => play(diceRollSound)
// The Work button's sound is whichever one is equipped in the Shop (the classic click by default)
export function playWorkClickSound()            { play(getEquippedItem('workSound')?.src ?? workClickSound) }
// Plays any sound file once (the Shop's Preview button)
export function playPreviewSound(src)           { play(src) }
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
export function playOpeningAudio()              { play(openingAudio) }
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