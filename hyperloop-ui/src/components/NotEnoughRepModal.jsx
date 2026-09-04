import { playClickSound2 } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'

function NotEnoughRepModal({ onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                <img src={reputationIcon} alt="reputation" style={{ width: '48px', height: '48px', margin: '0 auto 12px', display: 'block' }} />
                <h3 style={{ margin: '0 0 12px', fontFamily: 'Inter, sans-serif' }}>Not enough Reputation!</h3>
                <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: 1.6, margin: '0 0 16px' }}>
                    You need more Reputation to do this. Here's how to earn it:
                </p>
                <div style={{ textAlign: 'left', background: '#f8f8f8', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#111' }}>✈️ Give personal farewells</p>
                    <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#555' }}>When a departure is approaching, a farewell window opens on your screen. Give a personal farewell to earn +5 Reputation.</p>
                    <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#111' }}>💼 Work your terminal</p>
                    <p style={{ margin: '0', fontSize: '0.82rem', color: '#555' }}>There is a small chance of earning +5 Reputation each time you tap the Work button. Certain upgrades increase this chance.</p>
                </div>
                <button className="closeButton" onClick={() => { playClickSound2(); onClose() }}>Got it</button>
            </div>
        </div>
    )
}

export default NotEnoughRepModal