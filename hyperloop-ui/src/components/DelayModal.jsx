import { useEffect } from 'react'
import './DelayModal.css'

function DelayModal({ delay, onCompensate, onDismiss }) {
    useEffect(() => {
        try {
            const audio = new Audio('/src/assets/badNews.mp3')
            audio.play()
        } catch(e) {}
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
                    <button className="delay-btn-compensate" onClick={onCompensate}>
                        Issue compensation (£{delay.compensation.toLocaleString()})
                    </button>
                    <button className="delay-btn-dismiss" onClick={onDismiss}>
                        Refuse compensation (-10 🏆)
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DelayModal