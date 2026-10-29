import { useState, useRef, useEffect } from 'react'
import { getDistanceUnit, setDistanceUnit } from '../utils/units.js'
import { fullscreenSupported, isFullscreen, setFullscreen, onFullscreenChange } from '../utils/display.js'
import { playHoverSound, playClickSound2, playSaveConfirmSound, SOUND_CATEGORIES, getCategoryVolume, setCategoryVolume, isCategoryMuted, setCategoryMuted } from '../utils/sound.js'
import CreditsModal from '../components/CreditsModal.jsx'
import GuideModal from '../components/GuideModal.jsx'
import { GLOBE_QUALITY_KEY, savedGlobeQuality, autoGlobeQuality } from '../utils/globeQuality.js'
import { VERSION_LOG } from '../utils/versionLog.js'
import './SettingsPage.css'

const OptionBtn = ({ active, onClick, children }) => {
    const [hovered, setHovered] = useState(false)
    const bg = active
        ? (hovered ? 'color-mix(in srgb, var(--ui-accent, #f5a623) 85%, black)' : 'var(--ui-accent, #f5a623)')
        : (hovered ? 'var(--ui-accent, #f5a623)' : '')
    const color = active || hovered ? 'white' : ''
    const border = active || hovered ? 'var(--ui-accent, #f5a623)' : ''
    return (
        <button
            className={`settings-option-btn ${active ? 'settings-option-active' : ''}`}
            onMouseEnter={() => { playHoverSound(); setHovered(true) }}
            onMouseLeave={() => setHovered(false)}
            style={{ background: bg || undefined, color: color || undefined, borderColor: border || undefined }}
            onClick={() => { playClickSound2(); onClick(); }}
        >
            {children}
        </button>
    )
}

function LegalModal({ onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="credits-modal" onClick={e => e.stopPropagation()}>
                <p className="credits-heading">⚖️ LEGAL & PRIVACY</p>
                <div className="credits-body">
                    <p className="credits-section">PRIVACY</p>
                    <p className="credits-line">All save data is stored locally on your device using localStorage.</p>
                    <p className="credits-line">There is no account, and your save and game data are never sent to any server.</p>
                    <p className="credits-line">To keep the game small, city and development photos are loaded from Cloudinary. Like any website, it receives your IP address when it sends an image. Nothing else about you or your game is sent to them.</p>
                    <p className="credits-line">No analytics, tracking or third-party cookies are used.</p>
                    <p className="credits-line">Deleting your save removes all locally stored game data.</p>
                    <p className="credits-section">CONTENT</p>
                    <p className="credits-line">City and development images are sourced from Pexels and Wikimedia Commons under their respective licences.</p>
                    <p className="credits-line">Sound effects are sourced from Freesound and Pixabay under their respective licences.</p>
                    <p className="credits-line">Globe textures courtesy of NASA Visible Earth.</p>
                    <p className="credits-line">Country flags come from the flag-icons project (MIT licence).</p>
                    <p className="credits-section">DISCLAIMER</p>
                    <p className="credits-line">Hyperloop Empire is a fictional idle game provided for entertainment purposes only. All city names, facts and figures are used in a fictional context.</p>
                    <p className="credits-line">The game is provided as-is with no warranties expressed or implied.</p>
                </div>
                <button
                    className="closeButton"
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onClose() }}
                >
                    Close
                </button>
            </div>
        </div>
    )
}

function SettingsPage({ terminalName, onTerminalNameChange, lastSaved, onDeleteSave, onExportSave, onImportSave, onManualSave, onReputationBonus, onSurprise, topOffset = 113 }) {
    const [logOpen, setLogOpen] = useState(false)
    const [globeQuality, setGlobeQuality] = useState(savedGlobeQuality() || 'auto')
    const [globeNightMode, setGlobeNightMode] = useState(localStorage.getItem('globeNightMode') !== 'false')
    const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('soundEnabled') !== 'false')
    const [soundVolOpen, setSoundVolOpen] = useState(false)
    const [soundVolumes, setSoundVolumes] = useState(() => Object.fromEntries(SOUND_CATEGORIES.map(c => [c.key, getCategoryVolume(c.key)])))
    const [soundMutes, setSoundMutes] = useState(() => Object.fromEntries(SOUND_CATEGORIES.map(c => [c.key, isCategoryMuted(c.key)])))
    const [eventTint, setEventTint] = useState(localStorage.getItem('hyperloop_event_tint') !== 'false')
    const [distanceUnit, setDistanceUnitState] = useState(getDistanceUnit())
    const [fullscreen, setFullscreenState] = useState(isFullscreen())
    useEffect(() => onFullscreenChange(setFullscreenState), [])
    const [splitFlap, setSplitFlap] = useState(localStorage.getItem('splitFlap') !== 'false')
    const [nameInput, setNameInput] = useState(terminalName)
    // useState above only reads terminalName once, on mount - if it ever changes while this page stays mounted
    // (the Settings tab currently unmounts/remounts it on every visit, so a change elsewhere is picked up next
    // time it's opened either way, but that's incidental, not something this component should rely on), the
    // input would keep showing the old name instead of following the prop like the rest of the game does.
    useEffect(() => { setNameInput(terminalName) }, [terminalName])
    const [nameSaved, setNameSaved] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [importError, setImportError] = useState(null)
    const [showCredits, setShowCredits] = useState(false)
    const [showGuide, setShowGuide] = useState(false)
    const [showLegal, setShowLegal] = useState(false)
    const [manualSaved, setManualSaved] = useState(false)
    const [deleteHover, setDeleteHover] = useState(false)
    const [confirmDeleteHover, setConfirmDeleteHover] = useState(false)
    const [cancelHover, setCancelHover] = useState(false)
    const fileInputRef = useRef(null)

    const handleQualityChange = (quality) => {
        setGlobeQuality(quality)
        if (quality === 'auto') localStorage.removeItem(GLOBE_QUALITY_KEY)
        else localStorage.setItem(GLOBE_QUALITY_KEY, quality)
        // The globe now stays mounted for the whole session instead of rebuilding itself every time you
        // revisit Home, so nothing else would notice this change - this is what tells it to swap textures.
        window.dispatchEvent(new Event('globeQualityChange'))
    }

    const handleNightModeChange = (enabled) => {
        setGlobeNightMode(enabled)
        localStorage.setItem('globeNightMode', enabled)
        // Same reason handleQualityChange dispatches globeQualityChange above: the globe stays mounted for
        // the whole session now, so writing to localStorage alone doesn't reach its already-live material.
        window.dispatchEvent(new Event('globeNightModeChange'))
    }

    const handleSoundToggle = (enabled) => {
        setSoundEnabled(enabled)
        localStorage.setItem('soundEnabled', enabled)
    }

    const handleCategoryVolume = (key, value) => {
        setCategoryVolume(key, value)
        setSoundVolumes(v => ({ ...v, [key]: value }))
    }

    const handleCategoryMute = (key, muted) => {
        setCategoryMuted(key, muted)
        setSoundMutes(m => ({ ...m, [key]: muted }))
    }

    const handleEventTintToggle = (enabled) => {
        setEventTint(enabled)
        localStorage.setItem('hyperloop_event_tint', enabled)
    }

    const handleSplitFlapToggle = (enabled) => {
        setSplitFlap(enabled)
        localStorage.setItem('splitFlap', enabled)
    }

    const handleDistanceUnit = (unit) => {
        setDistanceUnitState(unit)
        setDistanceUnit(unit)
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
        if (diff < 3600) { const mins = Math.floor(diff / 60); return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago` }
        return new Date(lastSaved).toLocaleTimeString()
    }

    const handleImport = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        try {
            setImportError(null)
            await onImportSave(file)
            } catch (err) {
            setImportError(err?.message === 'Could not read file'
                ? 'Could not read that file. Please try again.'
                : 'Invalid save file. Please choose a valid Hyperloop save.')
        } finally {
            e.target.value = ''
        }
    }
    return (
        <div className="settings-page" style={{ height: `calc(100vh - ${topOffset + 141}px)`, overflowY: "auto" }}>
            {showCredits && <CreditsModal onClose={() => setShowCredits(false)} onReputationBonus={onReputationBonus} onSurprise={onSurprise} />}
            {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
            {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}

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
                        <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); handleNameSave(); }}>
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

                <button
                    className={`version-log-toggle sound-volumes-toggle ${soundVolOpen ? 'version-log-toggle-open sound-volumes-toggle-open' : ''}`}
                    aria-expanded={soundVolOpen}
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); setSoundVolOpen(o => !o) }}
                >
                    <span className="version-log-toggle-title">Sound Volumes</span>
                    <span className="sound-volumes-toggle-badge">
                        <span className="sound-volumes-toggle-arrow">▾</span>
                    </span>
                </button>
                <div className={`version-log-drop ${soundVolOpen ? 'version-log-drop-open' : ''}`}>
                <div className="version-log-drop-inner">
                <div className="sound-volumes-list">
                    {SOUND_CATEGORIES.map(({ key, label }) => (
                        <div className="sound-volume-row" key={key}>
                            <span className="sound-volume-label">{label}</span>
                            <input
                                className="sound-volume-slider"
                                type="range"
                                min={0}
                                max={100}
                                value={Math.round((soundVolumes[key] ?? 1) * 100)}
                                disabled={soundMutes[key]}
                                onChange={e => handleCategoryVolume(key, Number(e.target.value) / 100)}
                            />
                            <label className="sound-volume-mute">
                                <input
                                    type="checkbox"
                                    checked={!!soundMutes[key]}
                                    onChange={e => { playClickSound2(); handleCategoryMute(key, e.target.checked) }}
                                />
                                Mute
                            </label>
                        </div>
                    ))}
                </div>
                </div>
                </div>
            </div>

            <div className="settings-section">
                <h2 className="settings-section-title">Units</h2>
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">Distance</span>
                        <span className="settings-label-desc">Show distances in miles or kilometres, such as the Longest route and Total distance travelled on the Progress page.</span>
                    </div>
                    <div className="settings-options">
                        <OptionBtn active={distanceUnit === 'mi'} onClick={() => handleDistanceUnit('mi')}>Miles</OptionBtn>
                        <OptionBtn active={distanceUnit === 'km'} onClick={() => handleDistanceUnit('km')}>Kilometres</OptionBtn>
                    </div>
                </div>
            </div>

            {fullscreenSupported() && (
                <div className="settings-section">
                    <h2 className="settings-section-title">Display</h2>
                    <div className="settings-row">
                        <div className="settings-label">
                            <span className="settings-label-title">Fullscreen</span>
                            <span className="settings-label-desc">Fill the whole screen. Press Esc to leave fullscreen at any time. To make everything bigger or smaller, zoom the page with Ctrl and + or -.</span>
                        </div>
                        <div className="settings-options">
                            <OptionBtn active={fullscreen} onClick={() => setFullscreen(true)}>On</OptionBtn>
                            <OptionBtn active={!fullscreen} onClick={() => setFullscreen(false)}>Off</OptionBtn>
                        </div>
                    </div>
                </div>
            )}

            <div className="settings-section">
                <h2 className="settings-section-title">Graphics</h2>
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">Globe Texture Quality</span>
                        <span className="settings-label-desc">Higher quality requires more loading time. Auto picks for your device: Max on the most capable computers, Ultra on other capable ones, Standard on slower ones. Changes take effect on next visit to the home screen.</span>
                    </div>
                    <div className="settings-options">
                        <OptionBtn active={globeQuality === 'auto'} onClick={() => handleQualityChange('auto')}>Auto ({{ '2k': 'Standard', '8k': 'Ultra', '16k': 'Max' }[autoGlobeQuality()]})</OptionBtn>
                        <OptionBtn active={globeQuality === '2k'} onClick={() => handleQualityChange('2k')}>Standard (2K)</OptionBtn>
                        <OptionBtn active={globeQuality === '8k'} onClick={() => handleQualityChange('8k')}>Ultra (8K)</OptionBtn>
                        <OptionBtn active={globeQuality === '16k'} onClick={() => handleQualityChange('16k')}>Max (16K)</OptionBtn>
                    </div>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Globe Night Mode</span>
                        <span className="settings-label-desc">Show day/night shading on the globe. Disable for a consistently bright globe.</span>
                    </div>
                    <div className="settings-options">
                        <OptionBtn active={globeNightMode} onClick={() => handleNightModeChange(true)}>On</OptionBtn>
                        <OptionBtn active={!globeNightMode} onClick={() => handleNightModeChange(false)}>Off</OptionBtn>
                    </div>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Event Screen Tint</span>
                        <span className="settings-label-desc">Subtle gold or red tint when a positive or negative event is active.</span>
                    </div>
                    <div className="settings-options">
                        <OptionBtn active={eventTint} onClick={() => handleEventTintToggle(true)}>On</OptionBtn>
                        <OptionBtn active={!eventTint} onClick={() => handleEventTintToggle(false)}>Off</OptionBtn>
                    </div>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Split-Flap Animation</span>
                        <span className="settings-label-desc">Animated flip tiles and mechanical sound on the Terminal Board.</span>
                    </div>
                    <div className="settings-options">
                        <OptionBtn active={splitFlap} onClick={() => handleSplitFlapToggle(true)}>On</OptionBtn>
                        <OptionBtn active={!splitFlap} onClick={() => handleSplitFlapToggle(false)}>Off</OptionBtn>
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
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playSaveConfirmSound(); handleManualSave(); }}>
                        {manualSaved ? '✓ Saved' : 'Save now'}
                    </button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Export Save</span>
                        <span className="settings-label-desc">Download your save as a JSON file to back it up or move to another device.</span>
                    </div>
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onExportSave(); }}>Export</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Import Save</span>
                        <span className="settings-label-desc">Load a previously exported save file. This will overwrite your current save.</span>
                        {importError && <span className="settings-label-desc" style={{ color: '#c0392b' }}>{importError}</span>}
                    </div>
                    <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); fileInputRef.current.click(); }}>Import</button>
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
                                onClick={() => { playClickSound2(); onDeleteSave(); }}
                            >
                                Confirm Delete
                            </button>
                            <button
                                className="settings-save-btn"
                                onMouseEnter={() => { playHoverSound(); setCancelHover(true) }}
                                onMouseLeave={() => setCancelHover(false)}
                                style={{ background: cancelHover ? '#666' : '#888' }}
                                onClick={() => { playClickSound2(); setConfirmDelete(false); }}
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
                            onClick={() => { playClickSound2(); setConfirmDelete(true); }}
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
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowGuide(true); }}>Guide</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Credits</span>
                        <span className="settings-label-desc">Photo and sound attribution.</span>
                    </div>
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowCredits(true); }}>Credits</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Legal & Privacy</span>
                        <span className="settings-label-desc">Data storage, content licencing and disclaimer.</span>
                    </div>
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowLegal(true); }}>View</button>
                </div>
                <div className="settings-row" style={{ borderTop: '1px solid #e8d8c8' }}>
                    <div className="settings-label">
                        <span className="settings-label-title">Report a Bug</span>
                        <span className="settings-label-desc">Found something broken? Let us know.</span>
                    </div>
                    <button className="settings-save-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); window.open('https://github.com/CathalEoghan/HyperloopGame/issues/new', '_blank'); }}>Report</button>
                </div>
            </div>

            <div className="settings-section">
                <button
                    className={`version-log-toggle ${logOpen ? 'version-log-toggle-open' : ''}`}
                    aria-expanded={logOpen}
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); setLogOpen(o => !o) }}
                >
                    <span className="version-log-toggle-title">Update History</span>
                    <span className="version-log-toggle-current">{VERSION_LOG[0].version}</span>
                    <span className="version-log-toggle-arrow">▾</span>
                </button>
                <div className={`version-log-drop ${logOpen ? 'version-log-drop-open' : ''}`}>
                <div className="version-log-drop-inner">
                {VERSION_LOG.map(entry => (
                    <div key={entry.version} className="version-log-entry">
                        <div className="version-log-header">
                            <span className="version-log-tag">{entry.version}</span>
                            {entry.major && <span className="version-log-major-badge">MAJOR UPDATE</span>}
                            <span className="version-log-label">{entry.label}</span>
                            <span className="version-log-date">{entry.date}</span>
                        </div>
                        <ul className="version-log-notes">
                            {entry.notes.map((note, i) => (
                                <li key={i}>{note}</li>
                            ))}
                        </ul>
                    </div>
                ))}
                </div>
                </div>
            </div>
        </div>
    )
}

export default SettingsPage