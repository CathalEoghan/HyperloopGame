
import click_sound_2 from '../assets/click_sound_2.mp3'
import click_sound_3 from '../assets/click_sound_3.mp3'
import rankUpSound from '../assets/rankUpSound.mp3'

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