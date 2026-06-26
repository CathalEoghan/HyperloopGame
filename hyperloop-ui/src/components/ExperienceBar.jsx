
import './ExperienceBar.css'

function ExperienceBar({current, max, nextRank}) {

    const percent = (current / max ) * 100;
    const xpRemaining = max - current;

return (

<div className="ExperienceBar">

    <div className="fill" style={{ width: `${percent}%` }}></div>
    <div className="text">
        {xpRemaining.toFixed(0)} XP to Level {nextRank}
    </div>

    </div>

)

}

export default ExperienceBar