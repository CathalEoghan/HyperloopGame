import click_sound_2 from '../assets/sounds/click_sound_2.mp3'
import click_sound_3 from '../assets/sounds/click_sound_3.mp3'
import rankUpSound from '../assets/sounds/rankUpSound.mp3'
import leavingSound from '../assets/sounds/leavingSound.mp3'
import farewellAcceptSound from '../assets/sounds/farewellAccept.mp3'
import badNewsSound from '../assets/sounds/badNews.mp3'
import constructionSound from '../assets/sounds/constructionSound.mp3'
import workClickSound from '../assets/sounds/workClickSound.mp3'
import hoverSound from '../assets/sounds/hoverSound.mp3'

function canPlay() {
    return localStorage.getItem('soundEnabled') !== 'false'
}

function play(src) {
    if (!canPlay()) return
    new Audio(src).play()
}

export function playWorkClickSound()     { play(workClickSound) }
export function playConstructionSound()  { play(constructionSound) }
export function playBadNewsSound()       { play(badNewsSound) }
export function playLeavingSound()       { play(leavingSound) }
export function playFarewellAcceptSound(){ play(farewellAcceptSound) }
export function playClickSound2()        { play(click_sound_2) }
export function playClickSound3()        { play(click_sound_3) }
export function playRankUpSound()        { play(rankUpSound) }
export function playHoverSound() { play(hoverSound) }