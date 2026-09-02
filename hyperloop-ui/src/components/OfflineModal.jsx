import './OfflineModal.css'

function formatDuration(seconds) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m`
    return 'a moment'
}

function OfflineModal({ offlineSeconds, offlineIncome, onCollect }) {
    return (
        <div className="modal-overlay">
            <div className="modal offline-modal">
                <div className="offline-icon">🌙</div>
                <h2 className="offline-title">Welcome back!</h2>
                <p className="offline-subtitle">
                    You were away for <strong>{formatDuration(offlineSeconds)}</strong>
                </p>
                <div className="offline-earnings-box">
                    <span className="offline-earnings-label">Offline earnings</span>
                    <span className="offline-earnings-amount">£{Math.floor(offlineIncome).toLocaleString()}</span>
                    <span className="offline-earnings-note">Capped at 48 hours</span>
                </div>
                <button className="closeButton" style={{ marginTop: '16px' }} onClick={onCollect}>
                    Collect & Continue
                </button>
            </div>
        </div>
    )
}

export default OfflineModal