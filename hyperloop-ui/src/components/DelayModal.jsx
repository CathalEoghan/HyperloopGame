import { useEffect } from 'react'
import { playClickSound2, playHoverSound, playEventSound } from '../utils/sound.js'
import cashIcon from '../assets/misc/cash.png'
import reputationIcon from '../assets/misc/reputation.png'
import './DelayModal.css'

function DelayModal({ delay, onCompensate, onDismiss, economyManager }) {
    const adjustedCompensation = economyManager
        ? economyManager.calculateDelayCompensation(delay.compensation)
        : delay.compensation
    const adjustedRepCost = economyManager
        ? economyManager.calculateDelayRepCost(10)
        : 10

    useEffect(() => {
        playEventSound()
    }, [])

    return (
        <div className="delay-overlay">
            <div className="delay-modal">
                <p className="delay-header">⚠ LOOP DELAYED</p>
                <div className="delay-divider">━━━━━━━━━━━━━━━━━━━━</div>
                <p className="delay-message">
                    The <strong>{delay.originalTime}</strong> loop to <strong>{delay.name}</strong> has been delayed due to unforeseen circumstances.
                </p>
                <p className="delay-newtime">
                    New departure time: <strong>{delay.newTime}</strong>
                </p>
                <p className="delay-subtext">
                    Passengers are angry and some are demanding compensation.
                </p>
                <div className="delay-buttons">
                    <button className="delay-btn-compensate"
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => { playClickSound2(); onCompensate(adjustedCompensation) }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                            Issue compensation (<img src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{adjustedCompensation.toLocaleString()})
                        </span>
                    </button>
                    <button className="delay-btn-dismiss"
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => { playClickSound2(); onDismiss(adjustedRepCost) }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            Refuse compensation (-{adjustedRepCost} <img src={reputationIcon} alt="rep" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />)
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DelayModal