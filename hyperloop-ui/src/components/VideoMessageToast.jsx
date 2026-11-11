import { useEffect } from 'react'
import { playFarewellVipSound, playLeavingSound, playFarewellAcceptSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import cameraIcon from '../assets/misc/camera.png'
import countryFlags from '../data/countryFlags.js'
import { flagSrc } from '../utils/flagSrc.js'
import './FarewellModal.css'

// Video Message auto-accepts every farewell and greeting the instant it fires (App.jsx credits the Reputation
// straight away, so a popup that's already open - the daily bonus overnight, say - can never make the window
// expire and cost the player the Reputation). This toast is purely cosmetic: the entry it's showing has ALREADY
// been paid out, so there's nothing to accept and nothing that can be missed - it just gives the upgrade something
// to see, for the same 2.5s the real send takes, then dismisses itself. It only renders once nothing more important
// is already on screen (see the render site in App.jsx), so it never competes with a real popup for attention.
function VideoMessageToast({ entry, onDone }) {
    const isArrival = entry.kind === 'arrival'
    const flagCode = countryFlags[entry.country]

    useEffect(() => {
        // The arrival/departure chime plays now, when the toast appears, but the Reputation confirm sound is
        // held until the send animation actually finishes (matching the real FarewellModal, where it plays on
        // acceptance, not the moment the popup appears) - it should land on "sent", not "sending".
        if (entry.vip) playFarewellVipSound(); else playLeavingSound()
        const t = setTimeout(() => { playFarewellAcceptSound(); onDone() }, 2500)
        return () => clearTimeout(t)
    }, [])

    return (
        <div className="farewell-overlay">
            <div className="farewell-modal" data-vip={entry.vip ? 'true' : undefined}>
                <p className="farewell-attention">{entry.vip ? (isArrival ? 'VIP ARRIVAL' : 'VIP PASSENGER') : (isArrival ? 'NOW ARRIVED' : 'DEPARTED')}</p>
                <div className="farewell-divider">━━━━━━━━━━━━━━━━━━━━</div>
                <div className="farewell-destination">
                    {flagCode && (
                        <img
                            src={flagSrc(flagCode)}
                            alt={entry.country}
                            className="farewell-flag"
                        />
                    )}
                    <span className="farewell-city-name">{entry.name}</span>
                </div>
                <div className="farewell-sending">
                    <p className="farewell-message farewell-sending-text" data-testid="video-message">
                        <span className="farewell-sending-dot" aria-hidden="true" />
                        <img src={cameraIcon} alt="" style={{ width: '15px', height: '15px', verticalAlign: 'middle', marginRight: '4px', border: 'none' }} />
                        Sending your video {isArrival ? 'welcome' : 'message'}
                        <span className="farewell-sending-ellipsis" aria-hidden="true">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                        {' '}(+<img src={reputationIcon} alt="reputation" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />{entry.repGain})
                    </p>
                    <div className="farewell-sending-bar"><div className="farewell-sending-bar-fill" /></div>
                </div>
            </div>
        </div>
    )
}

export default VideoMessageToast
