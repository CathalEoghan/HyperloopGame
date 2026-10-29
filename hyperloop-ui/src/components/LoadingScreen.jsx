import { useState, useEffect, useRef } from 'react'
import cityThumbnails from '../data/cityThumbnails.js'
import developmentThumbnails from '../data/developmentThumbnails.js'
import { getGlobeQuality } from '../utils/globeQuality.js'
import earthDay2k from '../assets/misc/2k_earth_daymap.jpg'
import earthNight2k from '../assets/misc/2k_earth_nightmap.jpg'
import earthDay8k from '../assets/misc/8k_earth_daymap.jpg'
import earthNight8k from '../assets/misc/8k_earth_nightmap.jpg'
import earthDay16k from '../assets/misc/16k_earth_daymap.jpg'
import earthNight16k from '../assets/misc/16k_earth_nightmap.jpg'
import cashIcon from '../assets/misc/cash.png'
import clockIcon from '../assets/misc/clock.png'
import reputationIcon from '../assets/misc/reputation.png'
import starIcon from '../assets/misc/star.png'
import departureBoardImg from '../assets/misc/DepartureBoard.jpg'
import click_sound_2 from '../assets/sounds/click_sound_2.mp3'
import click_sound_3 from '../assets/sounds/click_sound_3.mp3'
import rankUpSound from '../assets/sounds/rankUpSound.mp3'
import leavingSound from '../assets/sounds/leavingSound.mp3'
import farewellAcceptSound from '../assets/sounds/farewellAccept.mp3'
import constructionSound from '../assets/sounds/constructionSound.mp3'
import workClickSound from '../assets/sounds/workClickSound.mp3'
import hoverSound from '../assets/sounds/hoverSound.mp3'
import reputationWorkBonus from '../assets/sounds/reputationBonusWork.mp3'
import bottomNavbarHover from '../assets/sounds/bottomNavbarHover.mp3'
import openingAudio from '../assets/sounds/openingAudio.mp3'
import kittyOpening from '../assets/opening-intros/kitty.mp3'
import fairyOpening from '../assets/opening-intros/fairy.mp3'
import poltergeistOpening from '../assets/opening-intros/poltergeist.mp3'
import pirateOpening from '../assets/opening-intros/pirate.mp3'
import princessOpening from '../assets/opening-intros/princess.mp3'
import jazzOpening from '../assets/opening-intros/jazz.mp3'
import playroomOpening from '../assets/opening-intros/playtime.mp3'
import starlightOpening from '../assets/opening-intros/starlight.mp3'
import duckOpening from '../assets/opening-intros/duck.mp3'
import { playOpeningAudio, setEntered } from '../utils/sound.js'
import { preloadImages } from '../utils/imageCache.js'
import { MALE_PFPS, FEMALE_PFPS } from '../assets/hyperLinkAssets.js'
import developmentRevealThumbnails from '../data/developmentRevealThumbnails.js'
import officialLogo from '../assets/misc/officialLogo.png'
import { VERSION_LOG } from '../utils/versionLog.js'
import { THEME_PICS, THEME_PICS_BOARD } from '../data/shopCatalog.js'
import './LoadingScreen.css'

// Below, "Ready" means every one of those images has actually finished loading (or failed - a
// broken image shouldn't be able to hang the whole screen), not just that a fixed clock ran out.
const MIN_VISIBLE_MS = 500   // avoids a jarring instant flash past the status text when everything's already cached
const SAFETY_TIMEOUT_MS = 8000   // a genuinely bad connection shouldn't be able to strand the player here forever

const SOUNDS = [
    click_sound_2, click_sound_3, rankUpSound, leavingSound,
    farewellAcceptSound, constructionSound,
    workClickSound, hoverSound, reputationWorkBonus, bottomNavbarHover,
    // All the Opening audio options, not just the equipped one, so whichever one plays on Enter is already warm
    // regardless of what's equipped (this component doesn't know the equipped choice - playOpeningAudio() does).
    openingAudio, kittyOpening, fairyOpening, poltergeistOpening, pirateOpening, princessOpening, jazzOpening,
    playroomOpening, starlightOpening, duckOpening,
]

const TIPS = [
    "Connect more cities to increase your daily income.",
    "Rank up to unlock new cities to connect.",
    "Build developments to boost your revenue beyond city income.",
    "Re-roll your city choices for 15 reputation if none of them suit you.",
    "When a departure or arrival is announced, give a personal farewell or greeting to earn reputation.",
    "Upgrade your developments up to 10 times for up to a 450% income boost.",
    "Disconnecting a city costs half the connection fee and 20 reputation.",
    "Your terminal earns income while you're away, capped at 48 hours by default - certain upgrades extend that up to 7 days.",
    "Prestige upgrades are powerful modifiers that can significantly improve your runs.",
    "Tier 2 and 3 cities earn significantly more than Tier 1 cities, but cost more to connect and take longer to build.",
    "Work your terminal manually to earn extra cash.",
    "Compensating passengers after a loop delay costs money but keeps your reputation intact.",
    "Developments unlocked by a city stay built even if you disconnect it.",
    "Export your save in Settings to back up your progress.",
    "Some developments add flat income, while others are powerful modifiers that boost other parts of your network instead.",
    "Make sure to add or automate destinations to the departure board - automating costs reputation, so scheduling by hand is free.",
    "Your reputation or treasury can never go below zero.",
    "VIP passengers show up occasionally - farewell or greet them for 5x the usual reputation.",
    "Reach Rank 50 and buy Early Retirement to unlock Prestige, resetting your run for permanent bonuses that carry forward.",
    "Farewell windows open 5 minutes before each departure - extend them with upgrades to give yourself more time.",
    "Check Hyper-Link, the phone icon on the home screen, to see what passengers are saying about your terminal.",
    "Check the Progress page often! Newly connected cities and countries glow gold and reward you with cash or reputation.",
    "Check the credits modal in Settings for asset accreditations and a surprise!",
    "Check out the shop for cool cosmetics! Choose from a wide selection of themes, cursors, and even custom audio."
]

function LoadingScreen({ onComplete, globeReady = true }) {
    const [progress, setProgress] = useState(0)
    const [fading, setFading] = useState(false)
    const [statusText, setStatusText] = useState('Loading terminal systems...')
    const [ready, setReady] = useState(false)
    const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length))
    const [tipVisible, setTipVisible] = useState(true)
    const done = useRef(false)
    // "Ready" now waits on two independent things finishing: this screen's own image preload below, and - now
    // that App.jsx builds the real globe behind this screen instead of only after it - the globe itself having
    // decoded its texture and rendered. Whichever finishes last is what actually flips the bar to 100%, so
    // there's nothing left to build by the time this screen is clicked through.
    const imagesDoneRef = useRef(false)
    const globeReadyRef = useRef(globeReady)
    const markReadyRef = useRef(() => {})

    useEffect(() => {
        const quality = getGlobeQuality()
        const globeTextures = quality === '16k'
            ? [earthDay16k, earthNight16k]
            : quality === '8k'
                ? [earthDay8k, earthNight8k]
                : [earthDay2k, earthNight2k]

               const imageSrcs = [
            ...Object.values(cityThumbnails),
            ...Object.values(developmentThumbnails),
            ...Object.values(developmentRevealThumbnails),
            ...globeTextures,
            ...MALE_PFPS,
            ...FEMALE_PFPS,
            cashIcon, clockIcon, reputationIcon, starIcon, departureBoardImg,
            // Every Shop theme's preview photo, not just the equipped one - same reasoning as the Opening
            // audio options below: whichever theme gets equipped or browsed to shouldn't be the one thing
            // that wasn't warm yet. THEME_PICS_BOARD doubles as the "TERMINAL BOARD" banner background for
            // whatever General theme is equipped (see applyCosmetics in utils/cosmetics.js), so this also
            // covers that, not just the Shop's own previews.
            ...Object.values(THEME_PICS),
            ...Object.values(THEME_PICS_BOARD),
        ]
        const total = imageSrcs.length

        SOUNDS.forEach(src => {
            const audio = new Audio(src)
            audio.preload = 'auto'
        })

        const startTime = Date.now()
        let cancelled = false

        const markReady = () => {
            if (done.current || cancelled) return
            if (!imagesDoneRef.current || !globeReadyRef.current) return
            done.current = true
            setProgress(100)
            setStatusText('Ready.')
            setReady(true)
        }
        markReadyRef.current = markReady

        // Only what's shown straight away: the lists and reveals use the local thumbnails above.
        // The Cloudinary photos (city and development details) load when first opened.
        // Flags are inside the game's script itself (src/data/flagImages.js), so there is nothing to wait for.
        let lastPct = -1
        preloadImages(imageSrcs, (loaded) => {
            // Once the safety timeout has already forced us into the "ready" state, the still-downloading
            // images in the background (preloadImages keeps going regardless, per the comment below) must not
            // be allowed to overwrite the "Ready." status/100% bar with a stale "Loading..." message as they
            // keep trickling in - this previously left the bar visibly stuck below 100% with the enter prompt
            // already showing, which was confusing even though clicking through still worked.
            if (cancelled || done.current) return
            const pct = total ? loaded / total : 1
            // Only re-render on whole-percent changes - a setState per image (up to ~1,500 of them) is wasted work.
            const pctWhole = Math.floor(pct * 100)
            if (pctWhole === lastPct) return
            lastPct = pctWhole
            // Capped below 100 until the globe (tracked separately) is also done, so the bar doesn't sit at a
            // false 100% while still waiting on it.
            setProgress(Math.min(pct * 100, globeReadyRef.current ? 100 : 99))
            const count = `(${loaded.toLocaleString()}/${total.toLocaleString()})`
            if (pct < 0.20)      setStatusText(`Loading city thumbnails... ${count}`)
            else if (pct < 0.40) setStatusText(`Loading developments... ${count}`)
            else if (pct < 0.60) setStatusText(`Loading countries... ${count}`)
            else if (pct < 1)    setStatusText(`Loading globe textures... ${count}`)
        }).then(() => {
            if (cancelled) return
            imagesDoneRef.current = true
            // A near-instant load (everything already cached from last time) would otherwise skip straight past
            // the status text - hold for a small minimum so it reads as "finished", not as the screen glitching.
            const elapsed = Date.now() - startTime
            setTimeout(markReady, Math.max(0, MIN_VISIBLE_MS - elapsed))
        })

        // A genuinely bad connection (or a GPU taking its time with the globe) shouldn't be able to strand the
        // player on this screen forever - let them in once the cap is hit regardless, and let whatever's left
        // keep loading in the background (preloadImages doesn't depend on this component staying mounted - the
        // Image objects it created keep downloading regardless, and the globe keeps building behind this screen
        // either way since it's part of the real app now, not something this screen owns).
        const safetyTimer = setTimeout(() => {
            imagesDoneRef.current = true
            globeReadyRef.current = true
            markReady()
        }, SAFETY_TIMEOUT_MS)

        return () => { cancelled = true; clearTimeout(safetyTimer) }
    }, [])

    useEffect(() => {
        globeReadyRef.current = globeReady
        if (globeReady) markReadyRef.current()
    }, [globeReady])

    useEffect(() => {
        let fadeTimer = null
        const interval = setInterval(() => {
            setTipVisible(false)
            fadeTimer = setTimeout(() => {
                setTipIndex(i => (i + 1) % TIPS.length)
                setTipVisible(true)
            }, 600)
        }, 4000)
        return () => { clearInterval(interval); clearTimeout(fadeTimer) }
    }, [])

    // A double-click must not play the opening sound twice (bug #173)
    const enteredRef = useRef(false)
    const handleEnter = () => {
        if (!ready || enteredRef.current) return
        enteredRef.current = true
        // Unsilences sound.js right now, on the click itself - not 600ms from now when onComplete fires below,
        // once the fade-out finishes - so the very next line isn't blocked by the thing it's meant to allow.
        setEntered(true)
        playOpeningAudio()
        setFading(true)
        setTimeout(onComplete, 600)
    }

    return (
        <div
            className={`loading-screen ${fading ? 'loading-fading' : ''} ${ready ? 'loading-clickable' : ''}`}
            onClick={handleEnter}
        >
            <div className="loading-content">
                <img src={officialLogo} alt="Hyperloop Empire" className="loading-logo" />
                <p className="loading-tagline">The world's first hyperloop network</p>
                <div className="loading-bar-track">
                    <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="loading-status">{statusText}</p>
                {ready && (
                    <p className="loading-enter">Click anywhere to enter</p>
                )}
            </div>
            <div className={`loading-tip ${tipVisible ? 'tip-visible' : 'tip-hidden'}`}>
                <span className="loading-tip-label">TIP</span>
                <span className="loading-tip-text">{TIPS[tipIndex]}</span>
            </div>
            {/* Pulled from the same VERSION_LOG Settings' Update History reads, so this can't fall out of
                sync with it. Absolutely positioned (not a flow sibling) so it can't add to the content
                height that bug #185 already had to fix overflow for, and pointer-events: none so it can
                never swallow the "click anywhere to enter" tap. */}
            <span className="loading-version-tag">{VERSION_LOG[0].version}</span>
        </div>
    )
}

export default LoadingScreen