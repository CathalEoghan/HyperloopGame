
import './ExperienceBar.css'

function ExperienceBar({current, max}) {

    const percent = (current / max ) * 100;

return (

<div className="ExperienceBar">

    <div className="fill" style={{ width: `${percent}%` }}></div>

    </div>

)

}

export default ExperienceBar