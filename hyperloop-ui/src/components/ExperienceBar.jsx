import './ExperienceBar.css'

function ExperienceBar({current, max, nextRank, activeEvent}) {

    const percent = (current / max ) * 100;
    const xpRemaining = max - current;
    const fillColour = activeEvent?.type === 'positive' ? '#27ae60' : activeEvent?.type === 'negative' ? '#e74c3c' : '#f5a623';

return (

<div className="ExperienceBar">

    <div className="fill" style={{ width: `${percent}%`, backgroundColor: fillColour, transition: 'width 0.8s ease-out, background-color 0.5s ease' }}></div>
    <div className="text">
        {xpRemaining.toFixed(0)} XP to Rank {nextRank}
    </div>

    </div>

)

}

export default ExperienceBar