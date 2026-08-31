import { useState } from 'react'
import './SettingsPage.css'

function SettingsPage({ terminalName, onTerminalNameChange }) {
    const [globeQuality, setGlobeQuality] = useState(
        localStorage.getItem('globeQuality') || '2k'
    )
    const [soundEnabled, setSoundEnabled] = useState(
        localStorage.getItem('soundEnabled') !== 'false'
    )
    const [nameInput, setNameInput] = useState(terminalName)
    const [nameSaved, setNameSaved] = useState(false)

    const handleQualityChange = (quality) => {
        setGlobeQuality(quality)
        localStorage.setItem('globeQuality', quality)
    }

    const handleSoundToggle = (enabled) => {
        setSoundEnabled(enabled)
        localStorage.setItem('soundEnabled', enabled)
    }

    const handleNameSave = () => {
        const trimmed = nameInput.trim()
        if (!trimmed) return
        onTerminalNameChange(trimmed)
        setNameSaved(true)
        setTimeout(() => setNameSaved(false), 2000)
    }

    return (
        <div className="settings-page">
            <h1 className="settings-title">Settings</h1>

            {/* Terminal */}
            <div className="settings-section">
                <h2 className="settings-section-title">Terminal</h2>
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">Terminal Name</span>
                        <span className="settings-label-desc">The name displayed in the top banner.</span>
                    </div>
                    <div className="settings-name-input-row">
                        <input
                            className="settings-name-input"
                            type="text"
                            value={nameInput}
                            maxLength={32}
                            onChange={e => { setNameInput(e.target.value); setNameSaved(false) }}
                            onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                        />
                        <button className="settings-save-btn" onClick={handleNameSave}>
                            {nameSaved ? '✓ Saved' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Audio */}
            <div className="settings-section">
                <h2 className="settings-section-title">Audio</h2>
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">Sounds</span>
                        <span className="settings-label-desc">Enable or disable all in-game sound effects.</span>
                    </div>
                    <div className="settings-options">
                        <button
                            className={`settings-option-btn ${soundEnabled ? 'settings-option-active' : ''}`}
                            onClick={() => handleSoundToggle(true)}
                        >
                            On
                        </button>
                        <button
                            className={`settings-option-btn ${!soundEnabled ? 'settings-option-active' : ''}`}
                            onClick={() => handleSoundToggle(false)}
                        >
                            Off
                        </button>
                    </div>
                </div>
            </div>

            {/* Graphics */}
            <div className="settings-section">
                <h2 className="settings-section-title">Graphics</h2>
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">Globe Texture Quality</span>
                        <span className="settings-label-desc">Higher quality requires more loading time. Changes take effect on next visit to the home screen.</span>
                    </div>
                    <div className="settings-options">
                        <button
                            className={`settings-option-btn ${globeQuality === '2k' ? 'settings-option-active' : ''}`}
                            onClick={() => handleQualityChange('2k')}
                        >
                            Standard (2K)
                        </button>
                        <button
                            className={`settings-option-btn ${globeQuality === '8k' ? 'settings-option-active' : ''}`}
                            onClick={() => handleQualityChange('8k')}
                        >
                            Ultra (8K)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SettingsPage