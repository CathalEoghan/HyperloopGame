
import click_sound_2 from '../assets/click_sound_2.mp3'
import click_sound_3 from '../assets/click_sound_3.mp3'
import rankUpSound from '../assets/rankUpSound.mp3'
import leavingSound from '../assets/leavingSound.mp3'
import farewellAcceptSound from '../assets/farewellAccept.mp3'
import badNewsSound from '../assets/badNews.mp3'

export function playBadNewsSound() {
    const audio = new Audio(badNewsSound)
    audio.play()
}

export function playLeavingSound() {
    const audio = new Audio(leavingSound)
    audio.play()
}

export function playFarewellAcceptSound() {
    const audio = new Audio(farewellAcceptSound)
    audio.play()
}

export function playClickSound2() {

const audio = new Audio(click_sound_2)

audio.play()

}

export function playRankUpSound() {
    const audio = new Audio(rankUpSound)
    audio.play()
}

export function playClickSound3() {

const audio = new Audio(click_sound_3)

audio.play()

}