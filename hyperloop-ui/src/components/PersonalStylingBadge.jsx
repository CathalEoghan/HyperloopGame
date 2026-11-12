import developmentThumbnails from '../data/developmentThumbnails.js'
import './FarewellModal.css'

// Says out loud that Personal Styling Retinue is what is multiplying this greet/farewell's Reputation (the first one each
// day), instead of the x3 being silently folded into the figure on the button. Renders nothing when it doesn't apply.
function PersonalStylingBadge({ mult }) {
    if (!mult) return null
    return (
        <div className="farewell-retinue" data-testid="personal-styling-retinue">
            <img className="farewell-retinue-icon" src={developmentThumbnails['Personal Styling Retinue']} alt="" />
            <span className="farewell-retinue-text">
                <strong>Personal Styling Retinue &times;{mult}</strong>
                <span>First of the day</span>
            </span>
        </div>
    )
}

export default PersonalStylingBadge
