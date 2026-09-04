import { useState, useRef } from 'react'
import CreditsModal from '../components/CreditsModal.jsx'
import GuideModal from '../components/GuideModal.jsx'
import './SettingsPage.css'

function SettingsPage({ terminalName, onTerminalNameChange, lastSaved, onDeleteSave, onExportSave, onImportSave, onManualSave }) {
    const [globeQuality, setGlobeQuality] = useState(localStorage.getItem('globeQuality') || '2k')
    const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('soundEnabled') !== 'false')
    const [nameInput, setNameInput] = useState(terminalName)
    const [nameSaved, setNameSaved] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [importError, setImportError] = useState(null)
    const [showCredits, setShowCredits] = useState(false)
    const [showGuide, setShowGuide] = useState(false)
    const [manualSaved, setManualSaved] = useState(false)
    const fileInputRef = useRef(null)

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

    const handleManualSave = () => {
        onManualSave()
        setManualSaved(true)
        setTimeout(() => setManualSaved(false), 2000)
    }

    const formatLastSaved = () => {
        if (!lastSaved) return 'Never'
        const diff = Math.floor((Date.now() - lastSaved) / 1000)
        if (diff < 10) return 'Just now'
        if (diff < 60) return `${diff} seconds ago`
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
        return new Date(lastSaved).toLocaleTimeString()
    }

    const handleImport = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        try {
            setImportError(null)
            await onImportSave(file)
        } catch {
            setImportError('Invalid save file. Please choose a valid Hyperloop save.')
        }
    }

    return (
        <div className="settings-page">
            {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}
            {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

            <h1 className="settings-title">Settings</h1>

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

            <div className="settings-section">
                <h2 className="settings-section-title">Audio</h2>
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">Sounds</span>
                        <span className="settings-label-desc">Enable or disable all in-game sound effects.</span>
                    </div>
                    <div className="settings-options">
                        <button className={`settings-option-btn ${soundEnabled ? 'settings-option-active' : ''}`} onClick={() => handleSoundToggle(true)}>On</button>
                        <button className={`settings-option-btn ${!soundEnabled ? 'settings-option-active' : ''}`} onClick={() => handleSoundToggle(false)}>Off</button>
                    </div>
                </div>
            </div>

            <div className="settings-section">
                <h2 className="settings-section-title">Graphics</h2>
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">Globe Texture Quality</span>
                        <span className="settings-label-desc">Higher quality requires more loading time. Changes take effect on next visit to the home screen.</span>
                    </div>
                    <div className="settings-options">
                        <button className={`settings-option-btn ${globeQuality === '2k' ? 'settings-option-active' : ''}`} onClick={() => handleQualityChange('2k')}>Standard (2K)</button>
                        <button className={`settings-option-btn ${globeQuality === '8k' ? 'settings-option-active' : ''}`} onClick={() => handleQualityChange('8k')}>Ultra (8K)</button>
                    </div>
                </div>
            </div>

            <div className="settings-section">
                <h2 className="settings-section-title">Save Data</h2>
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">Last saved</span>
                        <span className="settings-label-desc">{formatLastSaved()}</span>
                    </div>
                    <button className="settings-save-btn" onClick={handleManualSave}>
                        {manualSaved ? '✓ Saved' : 'Save now'}
                    </button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #eee' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Export save</span>
                        <span className="settings-label-desc">Download your save as a JSON file to back it up or move to another device.</span>
                    </div>
                    <button className="settings-save-btn" onClick={onExportSave}>Export</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #eee' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Import save</span>
                        <span className="settings-label-desc">Load a previously exported save file. This will overwrite your current save.</span>
                        {importError && <span className="settings-label-desc" style={{ color: '#c0392b' }}>{importError}</span>}
                    </div>
                    <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
                    <button className="settings-save-btn" onClick={() => fileInputRef.current.click()}>Import</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #eee' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Delete save</span>
                        <span className="settings-label-desc">Permanently delete your save and start a new game. This cannot be undone.</span>
                    </div>
                    {confirmDelete ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="settings-save-btn" style={{ background: '#c0392b' }} onClick={onDeleteSave}>Confirm Delete</button>
                            <button className="settings-save-btn" style={{ background: '#888' }} onClick={() => setConfirmDelete(false)}>Cancel</button>
                        </div>
                    ) : (
                        <button className="settings-save-btn" style={{ background: '#c0392b' }} onClick={() => setConfirmDelete(true)}>Delete</button>
                    )}
                </div>
            </div>

            <div className="settings-section">
                <h2 className="settings-section-title">Info</h2>
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">Game Guide</span>
                        <span className="settings-label-desc">Learn how to play Hyperloop Empire.</span>
                    </div>
                    <button className="settings-save-btn" onClick={() => setShowGuide(true)}>Guide</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #eee' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Credits</span>
                        <span className="settings-label-desc">Photo and sound attribution.</span>
                    </div>
                    <button className="settings-save-btn" onClick={() => setShowCredits(true)}>Credits</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #eee' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Report a Bug</span>
                        <span className="settings-label-desc">Found something broken? Let us know.</span>
                    </div>
                    <button className="settings-save-btn" onClick={() => window.open('https://github.com/CathalEoghan/HyperloopGame/issues/new', '_blank')}>Report</button>
                </div>
            </div>
        </div>
    )
}

export default SettingsPage