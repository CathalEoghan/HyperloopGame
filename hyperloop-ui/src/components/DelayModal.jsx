import { useEffect } from 'react'
import { playClickSound2 } from '../utils/sound.js'
import './DelayModal.css'

function DelayModal({ delay, onCompensate, onDismiss, economyManager }) {
    const adjustedCompensation = economyManager
        ? economyManager.calculateDelayCompensation(delay.compensation)
        : delay.compensation

    const adjustedRepCost = economyManager
        ? economyManager.calculateDelayRepCost(10)
        : 10

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
                    <button className="delay-btn-compensate" onClick={() => { playClickSound2(); onCompensate(adjustedCompensation) }}>
                        Issue compensation (£{adjustedCompensation.toLocaleString()})
                    </button>
                    <button className="delay-btn-dismiss" onClick={() => { playClickSound2(); onDismiss(adjustedRepCost) }}>
                        Refuse compensation (-{adjustedRepCost} 🏆)
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DelayModal