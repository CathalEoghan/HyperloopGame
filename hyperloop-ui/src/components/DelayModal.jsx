import { useEffect } from 'react'
import { playBoardClickSound as playClickSound2, playBoardHoverSound as playHoverSound, playEventSound, playNotEnoughFundsSound } from '../utils/sound.js'
import cashIcon from '../assets/misc/cash.png'
import reputationIcon from '../assets/misc/reputation.png'
import AbbreviatedNumber from './AbbreviatedNumber.jsx'
import './DelayModal.css'

// Base reputation cost for refusing compensation outright, before any delayRepCostReduction upgrade.
const BASE_DELAY_REP_COST = 20

function DelayModal({ delay, onCompensate, onDismiss, economyManager, balance }) {
    const adjustedCompensation = economyManager
        ? economyManager.calculateDelayCompensation(delay.compensation)
        : delay.compensation
    const adjustedRepCost = economyManager
        ? economyManager.calculateDelayRepCost(BASE_DELAY_REP_COST)
        : BASE_DELAY_REP_COST

    // What owned upgrades have taken off, so the buttons can say so: a percentage off the compensation (Quiet Room, Prayer
    // Room...), and a flat amount off the Reputation lost for refusing (Service Delivery Training)
    const compensationCutPct = Math.round((economyManager?.getDelayCompensationReduction?.() ?? 0) * 100)
    const repCostCut = BASE_DELAY_REP_COST - adjustedRepCost

    const canAffordCompensation = balance >= adjustedCompensation

    useEffect(() => {
        playEventSound()
    }, [])

    return (
        <div className="delay-overlay">
            <div className="delay-modal">
                <p className="delay-header">LOOP DELAYED</p>
                <div className="delay-divider">━━━━━━━━━━━━━━━━━━━━</div>
                <p className="delay-message">
                    {delay.kind === 'arrival'
                        ? <>The <strong>{delay.originalTime}</strong> loop from <strong>{delay.name}</strong> is running late due to unforeseen circumstances.</>
                        : <>The <strong>{delay.originalTime}</strong> loop to <strong>{delay.name}</strong> has been delayed due to unforeseen circumstances.</>}
                </p>
                <p className="delay-newtime">
                    {delay.kind === 'arrival' ? 'New arrival time' : 'New departure time'}: <strong>{delay.newTime}</strong>
                </p>
                <p className="delay-subtext">
                    Passengers are angry and some are demanding compensation.
                </p>
                <div className="delay-buttons">
                    <button className="delay-btn-compensate"
                        onMouseEnter={() => playHoverSound()}
                        style={{ opacity: canAffordCompensation ? 1 : 0.5 }}
                        onClick={() => {
                            if (!canAffordCompensation) { playNotEnoughFundsSound(); return; }
                            playClickSound2();
                            onCompensate(adjustedCompensation);
                        }}>
                        <span className="delay-btn-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                            Issue compensation (<AbbreviatedNumber value={adjustedCompensation} icon={cashIcon} iconAlt="£" iconSize={14} />)
                        </span>
                        {compensationCutPct > 0 && <span className="delay-btn-note">-{compensationCutPct}% reduced cost</span>}
                    </button>
                    <button className="delay-btn-dismiss"
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => { playClickSound2(); onDismiss(adjustedRepCost) }}>
                        <span className="delay-btn-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            Refuse compensation (-<img src={reputationIcon} alt="rep" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{adjustedRepCost})
                        </span>
                        {repCostCut > 0 && <span className="delay-btn-note">-{repCostCut} reduced cost</span>}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DelayModal