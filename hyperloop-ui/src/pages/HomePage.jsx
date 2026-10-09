import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import cityCoordinates from '../data/cityCoordinates.js'
import countryFlags from '../data/countryFlags.js'
import cityImages from '../data/cityImages.js'
import cityThumbnails from '../data/cityThumbnails.js'
import { playHoverSound, playClickSound2, playConstructionSound, playNotEnoughFundsSound } from '../utils/sound.js'
import { formatTime } from '../utils/time.js'
import { allCities } from '../../../CityManager/CityRegistry.js'
import cashIcon from '../assets/misc/cash.png'
import './HomePage.css'

function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    )
}

function formatPopulation(pop) {
    if (pop >= 1000000000) return (pop / 1000000000).toFixed(1) + ' billion'
    if (pop >= 1000000) return Math.round(pop / 1000000) + ' million'
    if (pop >= 1000) return Math.round(pop / 1000) + 'k'
    return pop.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

function loadGrayscaleTexture(url, onLoad) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || 40
        canvas.height = img.naturalHeight || 28
        const ctx = canvas.getContext('2d')
        ctx.filter = 'grayscale(100%)'
        ctx.drawImage(img, 0, 0)
        onLoad(new THREE.CanvasTexture(canvas))
    }
    img.onerror = () => onLoad(null)
    img.src = url
}

function getSunWorldPosition() {
    const now = new Date()
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600
    const sunLng = (12 - utcHours) * 15
    const start = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now - start) / 86400000)
    const sunLat = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81))
    return latLngToVector3(sunLat, sunLng, 10)
}

function HomePage({ purchasedCities, unlockedCities, purchasedCitiesCount, disabled, economyManager, balance, constructionManager, onConnectCity }) {
    const mountRef = useRef(null)
    const [hoveredCity, setHoveredCity] = useState(null)
    const [showOwned, setShowOwned] = useState(() => {
        try { return localStorage.getItem('globeShowOwned') !== 'false' } catch { return true }
    })
    const [globeReady, setGlobeReady] = useState(false)
    const [selectedGlobeCity, setSelectedGlobeCity] = useState(null)
    const [selectedUnlockedCity, setSelectedUnlockedCity] = useState(null)
    const spritesRef = useRef([])
    const prevHoveredCity = useRef(null)
    const showOwnedRef = useRef(showOwned)
    const purchasedCitiesRef = useRef(purchasedCities)
    const unlockedCitiesRef = useRef(unlockedCities)
    const disabledRef = useRef(disabled)

    useEffect(() => {
        purchasedCitiesRef.current = purchasedCities
        unlockedCitiesRef.current = unlockedCities
    }, [purchasedCities, unlockedCities, purchasedCities.length, unlockedCities?.length])

    useEffect(() => {
        disabledRef.current = disabled
        // A popup opening over the globe clears the hover panel (bug #80)
        if (disabled) { setHoveredCity(null); prevHoveredCity.current = null }
    }, [disabled])

    // HomePage.jsx — add this useEffect after the disabledRef sync effect (around line 79)

    useEffect(() => {
        const sprites = spritesRef.current
        if (!sprites.length) return
        const purchasedNames = new Set(purchasedCities.map(c => c.name))
        const unlockedNames = new Set((unlockedCities || []).map(c => c.name))
        const textureLoader = new THREE.TextureLoader()

        sprites.forEach(sprite => {
            const { city } = sprite.userData
            const nowPurchased = purchasedNames.has(city.name)
            const nowUnlocked = unlockedNames.has(city.name)

            if (nowPurchased && !sprite.userData.isPurchased) {
                // Was unlocked/dimmed → full colour
                const flagCode = countryFlags[city.country]
                sprite.material.map = textureLoader.load(`https://flagcdn.com/w40/${flagCode}.png`)
                sprite.material.color.set(1, 1, 1)
                sprite.material.needsUpdate = true
                sprite.userData.isPurchased = true
                sprite.userData.isUnlocked = true
            } else if (nowUnlocked && !sprite.userData.isUnlocked) {
                // Was grayscale → dimmed colour
                const flagCode = countryFlags[city.country]
                sprite.material.map = textureLoader.load(`https://flagcdn.com/w40/${flagCode}.png`)
                sprite.material.color.set(0.1, 0.1, 0.1)
                sprite.material.needsUpdate = true
                sprite.userData.isUnlocked = true
            } else if (!nowPurchased && !nowUnlocked && !city.underConstruction && (sprite.userData.isUnlocked || sprite.userData.isPurchased)) {
                // No longer on offer (for example it was re-rolled away) → back to grayscale
                loadGrayscaleTexture(`https://flagcdn.com/w40/${countryFlags[city.country]}.png`, (greyTex) => {
                    if (greyTex) { sprite.material.map = greyTex; sprite.material.needsUpdate = true }
                })
                sprite.material.color.set(1, 1, 1)
                sprite.userData.isUnlocked = false
                sprite.userData.isPurchased = false
            }
        })
    }, [purchasedCities, unlockedCities, purchasedCities.length, unlockedCities?.length])

    useEffect(() => {
        const mount = mountRef.current
        const width = mount.clientWidth
        const height = mount.clientHeight
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0a0a1a)
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
        let camLon = 0, camLat = 0, camDist = 2.5

        function updateCamera() {
            const lon = THREE.MathUtils.degToRad(camLon)
            const lat = THREE.MathUtils.degToRad(camLat)
            camera.position.set(
                camDist * Math.cos(lat) * Math.sin(lon),
                camDist * Math.sin(lat),
                camDist * Math.cos(lat) * Math.cos(lon)
            )
            camera.lookAt(0, 0, 0)
        }
        updateCamera()

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        mount.appendChild(renderer.domElement)

        const globeRadius = 1
        const textureLoader = new THREE.TextureLoader()
        const quality = localStorage.getItem('globeQuality') || '8k'
        let dayUrl, nightUrl
        try {
            dayUrl = new URL(`../assets/misc/${quality}_earth_daymap.jpg`, import.meta.url).href
            nightUrl = new URL(`../assets/misc/${quality}_earth_nightmap.jpg`, import.meta.url).href
        } catch {
            dayUrl = 'https://unpkg.com/three-globe/example/img/earth-day.jpg'
            nightUrl = 'https://unpkg.com/three-globe/example/img/earth-night.jpg'
        }

        let loadedCount = 0
        const onTextureLoad = () => {
            loadedCount++
            if (loadedCount === 2) setGlobeReady(true)
        }

        const dayTexture = textureLoader.load(dayUrl, onTextureLoad)
        const nightTexture = textureLoader.load(nightUrl, onTextureLoad)
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
        dayTexture.anisotropy = maxAnisotropy
        nightTexture.anisotropy = maxAnisotropy

        const nightMode = localStorage.getItem('globeNightMode') !== 'false'
        const globeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                dayTexture: { value: dayTexture },
                nightTexture: { value: nightTexture },
                sunDirection: { value: getSunWorldPosition().normalize() },
                nightMode: { value: nightMode ? 1.0 : 0.0 },
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                void main() {
                    vUv = uv;
                    vNormal = normalize(normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D dayTexture;
                uniform sampler2D nightTexture;
                uniform vec3 sunDirection;
                uniform float nightMode;
                varying vec2 vUv;
                varying vec3 vNormal;
                void main() {
                    vec4 dayColor = texture2D(dayTexture, vUv);
                    vec4 nightColor = texture2D(nightTexture, vUv) * 1.8;
                    float cosAngle = dot(vNormal, sunDirection);
                    float blend = nightMode > 0.5 ? smoothstep(-0.1, 0.2, cosAngle) : 1.0;
                    gl_FragColor = mix(nightColor, dayColor, blend);
                }
            `,
        })

        const globe = new THREE.Mesh(
            new THREE.SphereGeometry(globeRadius, 64, 64),
            globeMaterial
        )
        scene.add(globe)

        const atmosMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    intensity = clamp(intensity, 0.0, 1.0);
                    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
        })
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(globeRadius * 1.1, 48, 48), atmosMaterial))

        const sunInterval = setInterval(() => {
            globeMaterial.uniforms.sunDirection.value.copy(getSunWorldPosition().normalize())
        }, 60000)

        const starPositions = new Float32Array(2000 * 3)
        for (let i = 0; i < 2000 * 3; i++) starPositions[i] = (Math.random() - 0.5) * 100
        const starGeo = new THREE.BufferGeometry()
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
        scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 })))

        const sprites = []
        const purchasedNames = new Set(purchasedCitiesRef.current.map(c => c.name))
        const unlockedNames = new Set((unlockedCitiesRef.current || []).map(c => c.name))

        allCities.forEach(city => {
            if (city.continent === 'Antarctica' && !purchasedCitiesRef.current.some(c => c.name === city.name)) return;
            const coords = cityCoordinates[city.name]
            if (!coords) return
            const flagCode = countryFlags[city.country]
            if (!flagCode) return
            const isPurchased = purchasedNames.has(city.name)
            const isUnlocked = unlockedNames.has(city.name)
            const spritePos = latLngToVector3(coords.lat, coords.lng, globeRadius + 0.035)
            const surfaceNormal = latLngToVector3(coords.lat, coords.lng, 1)
            const flagUrl = `https://flagcdn.com/w40/${flagCode}.png`
            const spriteMat = new THREE.SpriteMaterial({
                map: (isPurchased || isUnlocked) ? textureLoader.load(flagUrl) : null,
                transparent: true, depthTest: true, depthWrite: false,
            })
            if (!isPurchased && !isUnlocked) {
                loadGrayscaleTexture(flagUrl, (greyTex) => {
                    if (greyTex) { spriteMat.map = greyTex; spriteMat.needsUpdate = true }
                })
            } else if (!isPurchased && isUnlocked) {
                spriteMat.color = new THREE.Color(0.1, 0.1, 0.1)
            }
            const sprite = new THREE.Sprite(spriteMat)
            sprite.position.copy(spritePos)
            sprite.scale.set(0.02, 0.013, 1)
            sprite.userData = { city, surfaceNormal, isPurchased, isUnlocked }
            scene.add(sprite)
            sprites.push(sprite)
        })
        spritesRef.current = sprites

        const raycaster = new THREE.Raycaster()
        raycaster.params.Sprite = { threshold: 0.05 }
        const mouse = new THREE.Vector2()
        let isDragging = false
        let prev = { x: 0, y: 0 }

        let mouseDownPos = { x: 0, y: 0 }
        // Mouse, touch and pen all arrive as pointer events (bug #80). Every finger or button currently
        // down is kept here so two fingers can pinch to zoom.
        const pointers = new Map()
        let pinchDist = 0
        let pinching = false
        let ignoreUntilAllUp = false // after a pinch, lifting the fingers must not count as a tap
        const pointerDistance = () => {
            const [a, b] = [...pointers.values()]
            return Math.hypot(a.x - b.x, a.y - b.y)
        }
        const onPointerDown = (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
            if (pointers.size === 1) {
                isDragging = true
                prev = { x: e.clientX, y: e.clientY }
                mouseDownPos = { x: e.clientX, y: e.clientY }
            } else if (pointers.size === 2) {
                isDragging = false
                pinching = true
                ignoreUntilAllUp = true
                pinchDist = pointerDistance() || 1
            }
        }
        const onPointerMove = (e) => {
            if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
            if (disabledRef.current) return
            if (pinching && pointers.size >= 2) {
                const d = pointerDistance() || 1
                camDist = Math.max(1.5, Math.min(5, camDist * (pinchDist / d)))
                pinchDist = d
                updateCamera()
                return
            }
            // Hover only means something with a mouse; a finger has no hover
            if (e.pointerType === 'mouse') {
                const rect = mount.getBoundingClientRect()
                mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
                mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
                raycaster.setFromCamera(mouse, camera)
                const visibleSprites = sprites.filter(s => s.visible)
                const hits = raycaster.intersectObjects(visibleSprites)
                const newHovered = hits.length > 0 ? hits[0].object.userData : null
                if (newHovered !== prevHoveredCity.current) {
                    if (newHovered) playHoverSound()
                    prevHoveredCity.current = newHovered
                }
                setHoveredCity(newHovered)
            }
            if (!isDragging) return
            camLon -= (e.clientX - prev.x) * 0.3
            camLat = Math.max(-85, Math.min(85, camLat + (e.clientY - prev.y) * 0.3))
            prev = { x: e.clientX, y: e.clientY }
            updateCamera()
        }
        const onPointerUp = (e) => {
            const startedOnGlobe = isDragging
            pointers.delete(e.pointerId)
            if (pointers.size < 2) pinching = false
            isDragging = false
            if (pointers.size === 0) {
                const wasPinch = ignoreUntilAllUp
                ignoreUntilAllUp = false
                if (wasPinch) return
            } else {
                return
            }
            if (!startedOnGlobe) return // the press began somewhere else (a button or popup), not on the globe
            if (disabledRef.current) return // don't let a click reach the globe while an overlay/modal has it disabled
            const dx = e.clientX - mouseDownPos.x
            const dy = e.clientY - mouseDownPos.y
            if (Math.sqrt(dx * dx + dy * dy) > (e.pointerType === 'mouse' ? 5 : 12)) return // was a drag
            const rect = mount.getBoundingClientRect()
            const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1
            const my = -((e.clientY - rect.top) / rect.height) * 2 + 1
            raycaster.setFromCamera(new THREE.Vector2(mx, my), camera)
            const visibleSprites = sprites.filter(s => s.visible)
            const hits = raycaster.intersectObjects(visibleSprites)
            if (hits.length > 0) {
                const { city, isPurchased, isUnlocked } = hits[0].object.userData
                if (isPurchased) {
                    setSelectedGlobeCity(city)
                } else if (isUnlocked) {
                    setSelectedUnlockedCity(city)
                }
            }
        }
        const onPointerCancel = (e) => {
            pointers.delete(e.pointerId)
            if (pointers.size < 2) pinching = false
            if (pointers.size === 0) { isDragging = false; ignoreUntilAllUp = false }
        }
        const onWheel = (e) => {
            e.preventDefault()
            camDist = Math.max(1.5, Math.min(5, camDist + e.deltaY * 0.003))
            updateCamera()
        }

        mount.addEventListener('pointerdown', onPointerDown)
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)
        window.addEventListener('pointercancel', onPointerCancel)
        mount.addEventListener('wheel', onWheel, { passive: false })

        const camPos = new THREE.Vector3()
        let animFrameId
        const animate = () => {
            animFrameId = requestAnimationFrame(animate)
            camPos.copy(camera.position).normalize()
            sprites.forEach(sprite => {
                const facingCamera = sprite.userData.surfaceNormal.dot(camPos) > 0.1
                const hiddenByToggle = !showOwnedRef.current && !sprite.userData.isPurchased
                sprite.visible = facingCamera && !hiddenByToggle
            })
            renderer.render(scene, camera)
        }
        animate()

        const onResize = () => {
            const w = mount.clientWidth, h = mount.clientHeight
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }
        window.addEventListener('resize', onResize)

        return () => {
            cancelAnimationFrame(animFrameId)
            clearInterval(sunInterval)
            mount.removeEventListener('pointerdown', onPointerDown)
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerup', onPointerUp)
            window.removeEventListener('pointercancel', onPointerCancel)
            mount.removeEventListener('wheel', onWheel)
            window.removeEventListener('resize', onResize)
            if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
            renderer.forceContextLoss()
            renderer.dispose()
        }
    }, [])

    return (
        <div className="home-page" style={{ pointerEvents: disabled ? 'none' : 'auto' }}>
            <div className="globe-top-info">
                <p className="globe-hint">Drag to rotate · Scroll to zoom</p>
                <p className="globe-cities">{purchasedCitiesCount} {purchasedCitiesCount === 1 ? 'city' : 'cities'} connected</p>
            </div>
            <button
                className={`globe-toggle-btn ${showOwned ? 'globe-toggle-active' : ''}`}
                onMouseEnter={() => playHoverSound()}
                onClick={() => {
                    setShowOwned(prev => {
                        showOwnedRef.current = !prev
                        try { localStorage.setItem('globeShowOwned', String(!prev)) } catch { /* storage blocked, ignore */ }
                        return !prev
                    })
                }}
            >
                {showOwned ? '👁 All cities' : '👁 Owned only'}
            </button>
            {!globeReady && (
                <div className="globe-loading">
                    <p>Loading globe...</p>
                </div>
            )}
            <div ref={mountRef} className="globe-container" />
            {selectedGlobeCity && (
                <div className="modal-overlay" onClick={() => setSelectedGlobeCity(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <img src={`https://flagcdn.com/w40/${countryFlags[selectedGlobeCity.country]}.png`} alt={selectedGlobeCity.country} />
                        <h3>{selectedGlobeCity.name}</h3>
                        <hr />
                        <p><strong>Country</strong>: {selectedGlobeCity.country}</p>
                        <p><strong>Population</strong>: {selectedGlobeCity.population.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</p>
                        {economyManager && (() => {
                            const coords = cityCoordinates[selectedGlobeCity.name]
                            const coordsMap = coords ? { [selectedGlobeCity.name]: coords } : null
                            const income = economyManager.withFoundersHall(economyManager.calculateCityIncome(selectedGlobeCity, coordsMap))
                            return (
                                <p>Earning <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    <img src={cashIcon} alt="£" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0', verticalAlign: 'middle' }} />
                                    {income.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                </strong> per day</p>
                            )
                        })()}
                        <p><em>{selectedGlobeCity.fact}</em></p>
                        <img
                            src={cityImages[selectedGlobeCity.name]}
                            alt={selectedGlobeCity.name}
                            style={{ width: '160px', height: '160px', borderRadius: '10px', border: '3px solid black', objectFit: 'cover', marginTop: '8px' }}
                        />
                        <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setSelectedGlobeCity(null) }}>Close</button>
                    </div>
                </div>
            )}
            {selectedUnlockedCity && !purchasedCities.some(c => c.name === selectedUnlockedCity.name) && (
                <div className="modal-overlay" onClick={() => setSelectedUnlockedCity(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        {constructionManager?.progressionManager?.citiesUnderConstruction?.some(c => c.name === selectedUnlockedCity.name) ? (
                            <>
                                <img src={`https://flagcdn.com/w40/${countryFlags[selectedUnlockedCity.country]}.png`} alt={selectedUnlockedCity.country} />
                                <h3>{selectedUnlockedCity.name}</h3>
                                <hr />
                                <p>Under construction!</p>
                                {(() => {
                                    const uc = constructionManager.progressionManager.citiesUnderConstruction.find(c => c.name === selectedUnlockedCity.name)
                                    return uc ? <p><strong>{formatTime(constructionManager.timeManager.getTimeRemaining(uc.finishTime))}</strong> remaining</p> : null
                                })()}
                                <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setSelectedUnlockedCity(null) }}>Close</button>
                            </>
                        ) : (
                            <>
                                <img src={`https://flagcdn.com/w40/${countryFlags[selectedUnlockedCity.country]}.png`} alt={selectedUnlockedCity.country} />
                                <h3>Connect {selectedUnlockedCity.name}?</h3>
                                <hr />
                                <p><strong>Country</strong>: {selectedUnlockedCity.country}</p>
                                <p><strong>Population</strong>: {selectedUnlockedCity.population.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</p>
                                {constructionManager && (() => {
                                    const cost = constructionManager.calculateTierConnectionCost(selectedUnlockedCity)
                                    const canAfford = balance >= cost
                                    return (
                                        <>
                                            <button
                                                className="constructionButton"
                                                style={!canAfford ? { opacity: 0.5 } : {}}
                                                onMouseEnter={() => playHoverSound()}
                                                onClick={() => {
                                                    playClickSound2()
                                                    // The balance shown on screen refreshes once a second, so check the real one (bug #122)
                                                    if (!canAfford || constructionManager.progressionManager.balance < cost) { playNotEnoughFundsSound(); return }
                                                    constructionManager.startStationConstruction(selectedUnlockedCity)
                                                    if (constructionManager.progressionManager.citiesUnderConstruction.includes(selectedUnlockedCity)) {
                                                        playConstructionSound()
                                                        onConnectCity?.()
                                                    }
                                                    setSelectedUnlockedCity(null)
                                                }}
                                            >
                                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                    Connect (<img src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{cost.toLocaleString('en-GB', { maximumFractionDigits: 0 })})
                                                </span>
                                                {!canAfford && <span style={{ fontSize: '0.75rem', color: '#c00', fontWeight: 'normal' }}>Not enough funds</span>}
                                            </button>
                                        </>
                                    )
                                })()}
                                <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setSelectedUnlockedCity(null) }}>Close</button>
                            </>
                        )}
                    </div>
                </div>
            )}
            {hoveredCity && (
                <div className="city-hover-panel">
                    <img
                        className="city-hover-image"
                        src={cityThumbnails[hoveredCity.city.name] || cityImages[hoveredCity.city.name]}
                        alt={hoveredCity.city.name}
                        style={!hoveredCity.isPurchased ? { filter: 'grayscale(100%)' } : {}}
                    />
                    <div className="city-hover-name">
                        {hoveredCity.isPurchased ? hoveredCity.city.name : hoveredCity.isUnlocked ? hoveredCity.city.name : '?'}
                    </div>
                    <div className="city-hover-detail">
                        {hoveredCity.isPurchased || hoveredCity.isUnlocked
                            ? `${hoveredCity.city.country} · ${formatPopulation(hoveredCity.city.population)}`
                            : 'Unknown location'
                        }
                    </div>
                    <div className="city-hover-divider">── CITY FACT ──</div>
                    <p className="city-hover-fact">
                        {hoveredCity.isPurchased
                            ? hoveredCity.city.fact
                            : hoveredCity.isUnlocked
                                ? <em>Connect this city to reveal its secret!</em>
                                : <em>Unlock this city to reveal its secret!</em>
                        }
                    </p>
                </div>
            )}
        </div>
    )
}

export default HomePage