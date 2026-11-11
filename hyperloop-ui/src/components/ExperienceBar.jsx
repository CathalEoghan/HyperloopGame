import AbbreviatedNumber from './AbbreviatedNumber.jsx'
import './ExperienceBar.css'

function ExperienceBar({current, max, nextRank, activeEvent}) {

    const atMaxRank = !Number.isFinite(max);
    // Rank-ups can wait behind a popup, so for a moment the XP can be past the target: never show a negative amount or an overfull bar
    const percent = atMaxRank ? 100 : Math.min(100, Math.max(0, (current / max) * 100));
    const xpRemaining = Math.max(0, max - current);
    const fillColour = activeEvent?.type === 'positive' ? '#27ae60' : activeEvent?.type === 'negative' ? '#e74c3c' : 'var(--ui-accent, #f5a623)';

return (

<div className="ExperienceBar">

    <div className="fill" style={{ width: `${percent}%`, backgroundColor: fillColour, transition: 'width 0.8s ease-out, background-color 0.5s ease' }}></div>
    <div className="text">
            {atMaxRank ? 'Max rank reached' : xpRemaining <= 0 ? `Rank ${nextRank} reached` : (
                <>
                    {/* .text above switches off pointer-events for the whole bar (so clicks pass through); this
                        number is the one part of it that needs hovering to reveal the exact XP, so it turns
                        them back on just for itself. */}
                    <AbbreviatedNumber value={xpRemaining} suffix=" XP" style={{ pointerEvents: 'auto' }} /> to Rank {nextRank}
                </>
            )}
    </div>

    </div>

)

}

export default ExperienceBar