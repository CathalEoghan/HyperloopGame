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
            {atMaxRank ? 'Max rank reached' : xpRemaining <= 0 ? `Rank ${nextRank} reached` : `${xpRemaining.toLocaleString('en-GB', { maximumFractionDigits: 0 })} XP to Rank ${nextRank}`}
    </div>

    </div>

)

}

export default ExperienceBar