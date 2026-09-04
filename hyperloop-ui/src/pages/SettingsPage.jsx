import { useState, useRef } from 'react'
import { playHoverSound } from '../utils/sound.js'
import CreditsModal from '../components/CreditsModal.jsx'
import GuideModal from '../components/GuideModal.jsx'
import './SettingsPage.css'

const OptionBtn = ({ active, onClick, children }) => {
    const [hovered, setHovered] = useState(false)
    const bg = active
        ? (hovered ? '#e8890a' : '#f5a623')
        : (hovered ? '#f5a623' : '')
    const color = active || hovered ? 'white' : ''
    const border = active || hovered ? '#f5a623' : ''
    return (
        <button
            className={`settings-option-btn ${active ? 'settings-option-active' : ''}`}
            onMouseEnter={() => { playHoverSound(); setHovered(true) }}
            onMouseLeave={() => setHovered(false)}
            style={{ background: bg || undefined, color: color || undefined, borderColor: border || undefined }}
            onClick={onClick}
        >
            {children}
        </button>
    )
}

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
    const [deleteHover, setDeleteHover] = useState(false)
    const [confirmDeleteHover, setConfirmDeleteHover] = useState(false)
    const [cancelHover, setCancelHover] = useState(false)
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
                        <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={handleNameSave}>
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
                        <OptionBtn active={soundEnabled} onClick={() => handleSoundToggle(true)}>On</OptionBtn>
                        <OptionBtn active={!soundEnabled} onClick={() => handleSoundToggle(false)}>Off</OptionBtn>
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
                        <OptionBtn active={globeQuality === '2k'} onClick={() => handleQualityChange('2k')}>Standard (2K)</OptionBtn>
                        <OptionBtn active={globeQuality === '8k'} onClick={() => handleQualityChange('8k')}>Ultra (8K)</OptionBtn>
                    </div>
                </div>
            </div>

            <div className="settings-section">
                <h2 className="settings-section-title">Save Data</h2>
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">Last Saved</span>
                        <span className="settings-label-desc">{formatLastSaved()}</span>
                    </div>
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={handleManualSave}>
                        {manualSaved ? '✓ Saved' : 'Save now'}
                    </button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Export Save</span>
                        <span className="settings-label-desc">Download your save as a JSON file to back it up or move to another device.</span>
                    </div>
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={onExportSave}>Export</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Import Save</span>
                        <span className="settings-label-desc">Load a previously exported save file. This will overwrite your current save.</span>
                        {importError && <span className="settings-label-desc" style={{ color: '#c0392b' }}>{importError}</span>}
                    </div>
                    <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => fileInputRef.current.click()}>Import</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Delete Save</span>
                        <span className="settings-label-desc">Permanently delete your save and start a new game. This cannot be undone.</span>
                    </div>
                    {confirmDelete ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="settings-save-btn"
                                onMouseEnter={() => { playHoverSound(); setConfirmDeleteHover(true) }}
                                onMouseLeave={() => setConfirmDeleteHover(false)}
                                style={{ background: confirmDeleteHover ? '#a93226' : '#c0392b' }}
                                onClick={onDeleteSave}
                            >
                                Confirm Delete
                            </button>
                            <button
                                className="settings-save-btn"
                                onMouseEnter={() => { playHoverSound(); setCancelHover(true) }}
                                onMouseLeave={() => setCancelHover(false)}
                                style={{ background: cancelHover ? '#666' : '#888' }}
                                onClick={() => setConfirmDelete(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            className="settings-save-btn"
                            onMouseEnter={() => { playHoverSound(); setDeleteHover(true) }}
                            onMouseLeave={() => setDeleteHover(false)}
                            style={{ background: deleteHover ? '#a93226' : '#c0392b' }}
                            onClick={() => setConfirmDelete(true)}
                        >
                            Delete
                        </button>
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
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => setShowGuide(true)}>Guide</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Credits</span>
                        <span className="settings-label-desc">Photo and sound attribution.</span>
                    </div>
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => setShowCredits(true)}>Credits</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Report a Bug</span>
                        <span className="settings-label-desc">Found something broken? Let us know.</span>
                    </div>
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => window.open('https://github.com/CathalEoghan/HyperloopGame/issues/new', '_blank')}>Report</button>
                </div>
            </div>
        </div>
    )
}

export default SettingsPage