import { useState } from 'react'
import cityThumbnails from '../data/cityThumbnails.js'
import countryFlags from '../data/countryFlags.js'
import reputationIcon from '../assets/misc/reputation.png'
import { flagSrc } from '../utils/flagSrc.js'
import { CLAIM_ALL_FROM } from './RankUpModal.jsx'
import { playClickSound2, playHoverSound, playDiceRollSound, playNotEnoughFundsSound } from '../utils/sound.js'
import './CityChoiceModal.css'

// A rank-up offers a few random cities to choose from (3, or more with Skilled Negotiation Teams; fewer when
// few cities are left). Choosing is a two-step (pick, then confirm) because the choice is final.
// onReroll is left out when there is nothing else to offer. rerollCost is what the game will actually charge:
// 0 with a free re-roll, less with the re-roll discount.
function CityChoiceModal({ hidden = false, cities, waiting = 0, reputation, rerollCost = 15, onPick, onReroll, onClaimAll }) {
    const [selected, setSelected] = useState(null)
    // A re-roll replaces the cities, so a selection that is no longer on offer is dropped
    const chosen = cities.includes(selected) ? selected : null
    const canReroll = reputation >= rerollCost

    return (
        <div className="citychoice-overlay" style={hidden ? { display: 'none' } : undefined}>
            <div className="citychoice-panel" role="dialog" aria-label="Choose a city">
                <h2 className="citychoice-title">Choose a city to unlock</h2>
                <p className="citychoice-sub">
                    {cities.length === 1 ? 'Only one city is left to unlock.' : `Pick one of ${cities.length} cities. Your choice is final.`}
                </p>
                <div className="citychoice-cards">
                    {cities.map(city => (
                        <button
                            key={city.name}
                            className={`citychoice-card${chosen === city ? ' citychoice-card-on' : ''}`}
                            onMouseEnter={() => playHoverSound()}
                            onClick={() => { playClickSound2(); setSelected(city) }}
                        >
                            <img className="citychoice-image" src={cityThumbnails[city.name]} alt={city.name} />
                            <span className="citychoice-name">{city.name}</span>
                            <span className="citychoice-meta">
                                {countryFlags[city.country] && <img className="citychoice-flag" src={flagSrc(countryFlags[city.country])} alt="" />}
                                {city.country}
                            </span>
                            <span className="citychoice-tier">Tier {city.tier}</span>
                        </button>
                    ))}
                </div>
                {onReroll && (
                    <button
                        className="citychoice-reroll"
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => {
                            if (canReroll) { playClickSound2(); playDiceRollSound(); onReroll() }
                            else playNotEnoughFundsSound()
                        }}
                        style={{ opacity: canReroll ? 1 : 0.5, cursor: canReroll ? 'var(--cursor-pointer, pointer)' : 'not-allowed' }}
                    >
                        {rerollCost === 0
                            ? <span>Free re-roll</span>
                            : <span>{canReroll ? 'Re-roll choices' : 'Need'} (<img className="citychoice-rep" src={reputationIcon} alt="rep" />{rerollCost}){!canReroll && ` to re-roll (you have ${reputation})`}</span>}
                    </button>
                )}
                <div className="citychoice-actions">
                    {waiting >= CLAIM_ALL_FROM && onClaimAll && (
                        <button className="citychoice-back" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClaimAll() }}>
                            Claim all, randomised ({waiting} waiting)
                        </button>
                    )}
                    <button
                        className="citychoice-confirm"
                        disabled={!chosen}
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => { if (chosen) { playClickSound2(); onPick(chosen) } }}
                    >
                        {chosen ? `Unlock ${chosen.name}` : 'Select a city'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CityChoiceModal
