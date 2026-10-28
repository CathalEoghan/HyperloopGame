import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getGlobeQuality } from '../utils/globeQuality.js'
import cityCoordinates from '../data/cityCoordinates.js'
import countryFlags from '../data/countryFlags.js'
import cityImages from '../data/cityImages.js'
import cityThumbnails from '../data/cityThumbnails.js'
import { playHoverSound, playClickSound2, playConstructionSound, playNotEnoughFundsSound, playFarewellAcceptSound } from '../utils/sound.js'
import { formatTime } from '../utils/time.js'
import { makeStarPositions } from '../utils/stars.js'
import { allCities } from '../../../CityManager/CityRegistry.js'
import cashIcon from '../assets/misc/cash.png'
import reputationIcon from '../assets/misc/reputation.png'
import './HomePage.css'
import { flagSrc } from '../utils/flagSrc.js'
import { getActiveLoops, formatClock, formatDuration, distanceMiles } from '../utils/loops.js'
import { formatDistance } from '../utils/units.js'
import { formatPerHour } from '../utils/income.js'
import { getArcColors, COSMETICS_EVENT } from '../utils/cosmetics.js'

// Departures are drawn in the game's gold, arrivals in blue
// Every route is white; the ones being pointed at (on the globe or in the list) light up: gold for a departure, blue for an arrival
const ARROW_COUNT = 5
const LOOP_WHITE = 0xffffff
// The route colours come from the equipped general theme in the Shop: gold for departures and blue for arrivals by default
// (the same blue as the arrival bar and the arrival rows in the list)
let arcColors = getArcColors()
if (typeof window !== 'undefined') window.addEventListener(COSMETICS_EVENT, () => { arcColors = getArcColors() })
const loopColor = (kind) => kind === 'arrival' ? arcColors.arrival : arcColors.departure
// How close (in pixels) the mouse must be to an arc to count as pointing at it
const ARC_HIT_PX = 10
const VIEW_KEY = 'globeView'
const PANEL_KEY = 'globeLoopsPanelOpen'

function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    )
}

// Points along the great circle between two cities, lifted into an arc. Longer routes arc higher.
function arcPoints(from, to, segments = 64) {
    const a = latLngToVector3(from.lat, from.lng, 1).normalize()
    const b = latLngToVector3(to.lat, to.lng, 1).normalize()
    const angle = a.angleTo(b)
    const height = 0.02 + 0.2 * (angle / Math.PI)
    const sinAngle = Math.sin(angle)
    const points = []
    for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const p = sinAngle < 1e-6
            ? a.clone().lerp(b, t).normalize()
            : a.clone().multiplyScalar(Math.sin((1 - t) * angle) / sinAngle).add(b.clone().multiplyScalar(Math.sin(t * angle) / sinAngle))
        points.push(p.multiplyScalar(1.006 + height * Math.sin(Math.PI * t)))
    }
    return points
}

function formatPopulation(pop) {
    if (pop >= 1000000000) return (pop / 1000000000).toFixed(1) + ' billion'
    if (pop >= 1000000) return Math.round(pop / 1000000) + ' million'
    if (pop >= 1000) return Math.round(pop / 1000) + 'k'
    return pop.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

// Every flag sprite on the globe is drawn through here (not THREE.TextureLoader directly), so it can get a thin
// black outline the same way the flag in the City Picker modal does (.citypicker-flag's box-shadow: 0 0 0 1px
// #000) - a flat colour swatch like a flag needs that edge to read clearly against the globe/ocean/space behind
// it. `grayscale: true` is the "locked, not yet reached" look (distinct from "unlocked but not bought", which
// stays full colour with a dark tint) - it needs to be a strong, fully-desaturated grey so the two states don't
// start to blur together. The browser's own `grayscale()` filter uses perceptual luma weights (roughly
// 0.21R + 0.72G + 0.07B), which barely count red at all - so colours that differ mostly in their red channel,
// like Morocco's red field next to its green star, can end up at almost the same brightness and collapse into
// a flat, featureless swatch. Converting with a plain average of the three channels instead keeps red and green
// properly distinct while still landing on a fully muted grey.
function toGrayscale(ctx, x, y, w, h) {
    const imageData = ctx.getImageData(x, y, w, h)
    const d = imageData.data
    for (let i = 0; i < d.length; i += 4) {
        const gray = (d[i] + d[i + 1] + d[i + 2]) / 3
        d[i] = d[i + 1] = d[i + 2] = gray
    }
    ctx.putImageData(imageData, x, y)
}

function loadFlagTexture(url, { grayscale = false } = {}, onLoad) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
        const w = img.naturalWidth || 40, h = img.naturalHeight || 28
        const outline = 2 // px, on the source image's own resolution - thin at any sprite scale
        const canvas = document.createElement('canvas')
        canvas.width = w + outline * 2
        canvas.height = h + outline * 2
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, outline, outline, w, h)
        if (grayscale) toGrayscale(ctx, outline, outline, w, h)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = outline
        ctx.strokeRect(outline, outline, w, h)
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

function HomePage({ purchasedCities, unlockedCities, purchasedCitiesCount, disabled, economyManager, balance, constructionManager, onConnectCity, active = true, onGlobeReady }) {
    const mountRef = useRef(null)
    // Whether this is the currently selected bottom-nav tab. The scene/renderer/textures below are built once and
    // kept alive for the whole session (App.jsx no longer unmounts this page on every tab switch - that used to
    // mean a full rebuild, including re-decoding the globe texture, every time the player came back to Home); this
    // ref lets the animation loop and the window-wide pointer listeners - both set up once, in a []-deps effect, so
    // they can't just read a fresh `active` prop - know to stand down while another tab is showing instead.
    const activeRef = useRef(active)
    useEffect(() => { activeRef.current = active }, [active])
    // Lets the quality-change listener below (Settings -> Globe Quality) reach the live globe material and swap
    // its day/night textures in place. Before the globe persisted across tab switches, changing this setting only
    // "worked" because leaving and returning to Home tore down and rebuilt the whole globe with the new quality
    // picked up fresh - now that it stays mounted, nothing re-reads the setting unless something tells it to.
    const globeMaterialRef = useRef(null)
    const textureLoaderRef = useRef(null)
    const [hoveredCity, setHoveredCity] = useState(null)
    const [showOwned, setShowOwned] = useState(() => {
        try { return localStorage.getItem('globeShowOwned') !== 'false' } catch { return true }
    })
    const [globeReady, setGlobeReady] = useState(false)
    const [selectedGlobeCity, setSelectedGlobeCity] = useState(null)
    const [selectedUnlockedCity, setSelectedUnlockedCity] = useState(null)
    // The city picture in the flag-click card can be enlarged, same as on the Cities page (bug: no way to do that here)
    const [enlargedImage, setEnlargedImage] = useState(null)
    const spritesRef = useRef([])
    const prevHoveredCity = useRef(null)
    const showOwnedRef = useRef(showOwned)
    const purchasedCitiesRef = useRef(purchasedCities)
    const unlockedCitiesRef = useRef(unlockedCities)
    const disabledRef = useRef(disabled)

    // Connections (every city's flag) or Active Loops (only the loops travelling now, with their routes)
    const [globeView, setGlobeView] = useState(() => {
        try { return localStorage.getItem(VIEW_KEY) === 'loops' ? 'loops' : 'connections' } catch { return 'connections' }
    })
    const globeViewRef = useRef(globeView)
    const [panelOpen, setPanelOpen] = useState(() => {
        try { return localStorage.getItem(PANEL_KEY) !== 'false' } catch { return true }
    })
    const [loops, setLoops] = useState([])
    const [nowMs, setNowMs] = useState(0)
    const loopsRef = useRef([])
    const loopCityNamesRef = useRef(new Set())
    // The loops being pointed at, nearest first. Several can be at once where routes overlap on the globe.
    const [hoveredLoopIds, setHoveredLoopIds] = useState([])
    const hoveredLoopsRef = useRef(new Set())
    const hoverSourceRef = useRef('panel') // 'globe' or 'panel': only the globe scrolls the list
    const loopsListRef = useRef(null)
    // Turns the globe to face a loop; set up with the scene
    const focusLoopRef = useRef(null)

    useEffect(() => {
        const update = () => {
            // No point reading the schedule and recomputing the loops list while another tab is showing - this
            // keeps the background cost at zero, same as when this page used to fully unmount (see activeRef above).
            if (!activeRef.current) return
            const list = getActiveLoops(purchasedCitiesRef.current)
            const home = purchasedCitiesRef.current[0]
            loopsRef.current = list
            loopCityNamesRef.current = new Set([...(home ? [home.name] : []), ...list.flatMap(l => [l.from, l.to])])
            setLoops(list)
            setNowMs(Date.now())
        }
        const first = setTimeout(update, 0)
        const interval = setInterval(update, 1000)
        return () => { clearTimeout(first); clearInterval(interval) }
    }, [])

    const chooseView = (view) => {
        if (view === globeViewRef.current) return
        playClickSound2()
        globeViewRef.current = view
        setGlobeView(view)
        setHoveredCity(null)
        hoverLoops([])
        try { localStorage.setItem(VIEW_KEY, view) } catch { /* storage blocked, ignore */ }
    }

    const hoverLoops = (ids, source = 'panel') => {
        const same = ids.length === hoveredLoopsRef.current.size && ids.every(id => hoveredLoopsRef.current.has(id))
        hoverSourceRef.current = source
        if (same) return
        hoveredLoopsRef.current = new Set(ids)
        setHoveredLoopIds(ids)
    }

    // Pointing at a route on the globe brings its row into view, but only when none of the lit rows is showing already,
    // and only after a short pause so sweeping across the globe doesn't make the list jump about.
    useEffect(() => {
        if (hoverSourceRef.current !== 'globe' || hoveredLoopIds.length === 0) return
        const timer = setTimeout(() => {
            const list = loopsListRef.current
            if (!list) return
            const rows = hoveredLoopIds.map(id => list.querySelector(`[data-loop-id="${id}"]`)).filter(Boolean)
            if (rows.length === 0) return
            const view = list.getBoundingClientRect()
            const showing = rows.some(r => { const b = r.getBoundingClientRect(); return b.top >= view.top - 1 && b.bottom <= view.bottom + 1 })
            if (showing) return
            // The arc nearest the cursor, centred in the list (measured on screen: offsetTop counts from the whole panel)
            const box = rows[0].getBoundingClientRect()
            list.scrollTo({ top: list.scrollTop + (box.top - view.top) - list.clientHeight / 2 + box.height / 2, behavior: 'smooth' })
        }, 250)
        return () => clearTimeout(timer)
    }, [hoveredLoopIds])

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

        sprites.forEach(sprite => {
            const { city } = sprite.userData
            const nowPurchased = purchasedNames.has(city.name)
            const nowUnlocked = unlockedNames.has(city.name)

            if (nowPurchased && !sprite.userData.isPurchased) {
                // Was unlocked/dimmed → full colour
                const flagCode = countryFlags[city.country]
                loadFlagTexture(flagSrc(flagCode), {}, (tex) => {
                    if (tex) { sprite.material.map = tex; sprite.material.needsUpdate = true }
                })
                sprite.material.color.set(1, 1, 1)
                sprite.material.needsUpdate = true
                sprite.userData.isPurchased = true
                sprite.userData.isUnlocked = true
            } else if (nowUnlocked && !sprite.userData.isUnlocked) {
                // Was grayscale → dimmed colour
                const flagCode = countryFlags[city.country]
                loadFlagTexture(flagSrc(flagCode), {}, (tex) => {
                    if (tex) { sprite.material.map = tex; sprite.material.needsUpdate = true }
                })
                sprite.material.color.set(0.1, 0.1, 0.1)
                sprite.material.needsUpdate = true
                sprite.userData.isUnlocked = true
            } else if (!nowPurchased && nowUnlocked && sprite.userData.isPurchased) {
                // Disconnected: it goes back to waiting on the Cities page, so it's dimmed again, hidden by the
                // Owned filter, and clicking it opens the unlocked-city card instead of the connected one
                sprite.material.color.set(0.1, 0.1, 0.1)
                sprite.material.needsUpdate = true
                sprite.userData.isPurchased = false
                sprite.userData.isUnlocked = true
            } else if (!nowPurchased && !nowUnlocked && !city.underConstruction && (sprite.userData.isUnlocked || sprite.userData.isPurchased)) {
                // No longer on offer (for example it was re-rolled away) → back to grayscale
                loadFlagTexture(flagSrc(countryFlags[city.country]), { grayscale: true }, (greyTex) => {
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

        // Globe zoom limits (globe radius = 1)
        const MIN_CAM_DIST = 1.25
        const MAX_CAM_DIST = 5

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
        const quality = getGlobeQuality()
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
            if (loadedCount === 2) {
                setGlobeReady(true)
                // Lets the Loading screen (now built behind, not after, it - see App.jsx) know the globe itself is
                // done, not just its own image preload, so "Ready" doesn't appear until there's truly nothing left
                // to build. The GPU upload on the very next animation frame is sub-16ms, well inside the Loading
                // screen's own minimum-visible buffer, so there's no need to wait on that frame specifically too.
                onGlobeReady?.()
            }
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
        globeMaterialRef.current = globeMaterial
        textureLoaderRef.current = textureLoader

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

        const starPositions = makeStarPositions()
        const starGeo = new THREE.BufferGeometry()
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
        scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 })))

        const sprites = []
        // Set when the globe closes, so a flag that finishes loading afterwards isn't attached to the disposed scene
        let disposed = false
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
            const flagUrl = flagSrc(flagCode)
            const spriteMat = new THREE.SpriteMaterial({
                map: null,
                transparent: true, depthTest: true, depthWrite: false,
            })
            if (isPurchased || isUnlocked) {
                loadFlagTexture(flagUrl, {}, (tex) => {
                    if (disposed) { tex?.dispose(); return }
                    if (tex) { spriteMat.map = tex; spriteMat.needsUpdate = true }
                })
            }
            if (!isPurchased && !isUnlocked) {
                loadFlagTexture(flagUrl, { grayscale: true }, (greyTex) => {
                    if (disposed) { greyTex?.dispose(); return }
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

        // ---- Active loops: an arc per route and a pod travelling along it ----
        const loopGroup = new THREE.Group()
        scene.add(loopGroup)
        const loopObjects = new Map()
        let syncedLoops = null
        const removeLoopObject = (id) => {
            const o = loopObjects.get(id)
            loopGroup.remove(o.group)
            o.group.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose() })
            loopObjects.delete(id)
        }
        const syncLoops = () => {
            const list = loopsRef.current
            const ids = new Set(list.map(l => l.id))
            ;[...loopObjects.keys()].forEach(id => { if (!ids.has(id)) removeLoopObject(id) })
            list.forEach(loop => {
                if (loopObjects.has(loop.id)) { loopObjects.get(loop.id).loop = loop; return }
                const from = cityCoordinates[loop.from], to = cityCoordinates[loop.to]
                if (!from || !to) return
                const points = arcPoints(from, to)
                const curve = new THREE.CatmullRomCurve3(points)
                const group = new THREE.Group()
                // A dark underlay keeps white readable over bright land and cloud; the halo only shows when highlighted
                const under = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.0034, 5, false), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }))
                const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.0019, 5, false), new THREE.MeshBasicMaterial({ color: LOOP_WHITE, transparent: true, opacity: 0.8, depthWrite: false }))
                const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.0065, 6, false), new THREE.MeshBasicMaterial({ color: loopColor(loop.kind), transparent: true, opacity: 0.3, depthWrite: false }))
                halo.visible = false
                // The shuttle: a small rounded-off box, turned along the route, with a dark outline
                const podGeo = new THREE.BoxGeometry(0.036, 0.012, 0.008)
                const pod = new THREE.Mesh(podGeo, new THREE.MeshBasicMaterial({ color: LOOP_WHITE }))
                pod.add(new THREE.LineSegments(new THREE.EdgesGeometry(podGeo), new THREE.LineBasicMaterial({ color: 0x000000 })))
                // Arrows showing the way the loop is going, only while highlighted
                const arrows = Array.from({ length: ARROW_COUNT }, () => {
                    const a = new THREE.Mesh(new THREE.ConeGeometry(0.0075, 0.02, 8), new THREE.MeshBasicMaterial({ color: loopColor(loop.kind) }))
                    a.visible = false
                    return a
                })
                group.add(under, line, halo, pod, ...arrows)
                loopGroup.add(group)
                loopObjects.set(loop.id, { group, under, line, halo, pod, arrows, points, curve, loop })
            })
            syncedLoops = list
        }
        const UP = new THREE.Vector3(0, 1, 0)
        const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3(), tmpS = new THREE.Vector3(), tmpM = new THREE.Matrix4()
        const placePods = () => {
            const now = Date.now()
            // Highlighted loops that have since arrived no longer dim the others
            const lit = new Set([...hoveredLoopsRef.current].filter(id => loopObjects.has(id)))
            const anyLit = lit.size > 0
            // Keeps the shuttles and arrows the same size on screen however far the globe is zoomed
            const zoom = camera.position.length() / 2.5
            loopObjects.forEach(o => {
                const { startTs, endTs } = o.loop
                const progress = Math.min(1, Math.max(0, (now - startTs) / Math.max(1, endTs - startTs)))
                const isLit = lit.has(o.loop.id)
                // Shuttle: on the arc, long side along the direction of travel, flat side to the globe
                o.curve.getPointAt(progress, tmpA)
                o.curve.getTangentAt(progress, tmpB)
                tmpC.copy(tmpA).normalize()                 // away from the globe
                tmpB.addScaledVector(tmpC, -tmpB.dot(tmpC)).normalize()
                tmpS.crossVectors(tmpB, tmpC).normalize()   // across the route
                tmpM.makeBasis(tmpB, tmpC, tmpS)
                o.pod.position.copy(tmpA)
                o.pod.quaternion.setFromRotationMatrix(tmpM)
                o.pod.scale.setScalar(zoom * (isLit ? 1.35 : 1))
                o.pod.material.color.setHex(isLit ? loopColor(o.loop.kind) : LOOP_WHITE)
                o.line.material.color.setHex(isLit ? loopColor(o.loop.kind) : LOOP_WHITE)
                o.line.material.opacity = anyLit ? (isLit ? 1 : 0.3) : 0.8
                o.under.material.opacity = anyLit && !isLit ? 0.12 : 0.35
                o.halo.visible = isLit
                o.group.renderOrder = isLit ? 2 : 1
                ;[o.under, o.line, o.halo, o.pod].forEach(m => { m.renderOrder = isLit ? 3 : 1 })
                o.arrows.forEach((a, k) => {
                    a.visible = isLit
                    if (!isLit) return
                    const t = ((k / ARROW_COUNT) + now / 9000) % 1   // drifts slowly the way the loop travels
                    o.curve.getPointAt(t, tmpA)
                    o.curve.getTangentAt(t, tmpB)
                    a.position.copy(tmpA)
                    a.quaternion.setFromUnitVectors(UP, tmpB)
                    a.scale.setScalar(zoom)
                })
            })
        }

        // Which routes the mouse is over: every arc within a few pixels, nearest first. Only the near side of the globe counts.
        const routesUnderMouse = (clientX, clientY, rect) => {
            const hits = []
            const cam = camera.position
            const px = new THREE.Vector3()
            loopObjects.forEach(o => {
                let best = Infinity, prevPt = null
                for (let i = 0; i < o.points.length; i++) {
                    const p = o.points[i]
                    if (p.dot(cam) < 1) { prevPt = null; continue }
                    px.copy(p).project(camera)
                    const pt = { x: (px.x + 1) / 2 * rect.width + rect.left, y: (1 - px.y) / 2 * rect.height + rect.top }
                    if (prevPt) {
                        const dx = pt.x - prevPt.x, dy = pt.y - prevPt.y
                        const len2 = dx * dx + dy * dy
                        const t = len2 ? Math.max(0, Math.min(1, ((clientX - prevPt.x) * dx + (clientY - prevPt.y) * dy) / len2)) : 0
                        best = Math.min(best, Math.hypot(clientX - (prevPt.x + t * dx), clientY - (prevPt.y + t * dy)))
                    } else {
                        best = Math.min(best, Math.hypot(clientX - pt.x, clientY - pt.y))
                    }
                    prevPt = pt
                }
                if (best <= ARC_HIT_PX) hits.push({ id: o.loop.id, d: best })
            })
            return hits.sort((a, b) => a.d - b.d).map(h => h.id)
        }

        // Turning to face a loop eases the camera round instead of jumping
        let camTarget = null
        focusLoopRef.current = (id) => {
            const o = loopObjects.get(id)
            if (!o) return
            const p = o.pod.position.clone().normalize()
            camTarget = { lon: THREE.MathUtils.radToDeg(Math.atan2(p.x, p.z)), lat: THREE.MathUtils.radToDeg(Math.asin(p.y)) }
        }
        const easeCamera = () => {
            if (!camTarget) return
            const dLon = ((camTarget.lon - camLon + 540) % 360) - 180
            const dLat = camTarget.lat - camLat
            if (Math.abs(dLon) < 0.05 && Math.abs(dLat) < 0.05) { camTarget = null; return }
            camLon += dLon * 0.12
            camLat = Math.max(-85, Math.min(85, camLat + dLat * 0.12))
            updateCamera()
        }

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
            camTarget = null // grabbing the globe stops it turning to a loop
            // A tap on a row (touch has no "leave") keeps its loop highlighted until the globe is touched
            if (hoveredLoopsRef.current.size) hoverLoops([])
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
            // This listens on the whole window (not just the globe), so the mouse moving over any other page
            // would otherwise still raycast against the hidden globe every frame for nothing - the pointerdown
            // that would set isDragging/pointers can only happen on the globe itself, which can't receive it
            // while hidden, so there's nothing here worth doing until this tab is showing again.
            if (!activeRef.current) return
            if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
            if (disabledRef.current) return
            if (pinching && pointers.size >= 2) {
                const d = pointerDistance() || 1
                camDist = THREE.MathUtils.clamp(
    camDist * (pinchDist / d),
    MIN_CAM_DIST,
    MAX_CAM_DIST
)
                pinchDist = d
                updateCamera()
                return
            }
            // Hover only means something with a mouse; a finger has no hover. Only over the globe itself: the panels
            // on top of it (the loops list, the view switch) must not light up flags hidden behind them.
            if (e.pointerType === 'mouse' && e.target !== renderer.domElement) {
                if (prevHoveredCity.current) { prevHoveredCity.current = null; setHoveredCity(null) }
                if (hoverSourceRef.current === 'globe' && hoveredLoopsRef.current.size) hoverLoops([], 'globe')
            } else if (e.pointerType === 'mouse') {
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
                // A flag under the mouse wins; otherwise any routes under it light up (not while dragging the globe)
                if (globeViewRef.current === 'loops' && !newHovered && !isDragging) {
                    const ids = routesUnderMouse(e.clientX, e.clientY, rect)
                    if (ids.length && !ids.some(id => hoveredLoopsRef.current.has(id))) playHoverSound()
                    hoverLoops(ids, 'globe')
                }
                else if (hoverSourceRef.current === 'globe') hoverLoops([], 'globe')
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

         camDist = THREE.MathUtils.clamp(
        camDist + e.deltaY * 0.003,
        MIN_CAM_DIST,
        MAX_CAM_DIST
    )

    updateCamera()
}

        // Leaving the globe (off the window, say) lets go of any routes the mouse was over
        const onPointerLeave = (e) => { if (e.pointerType === 'mouse' && hoverSourceRef.current === 'globe' && hoveredLoopsRef.current.size) hoverLoops([], 'globe') }
        mount.addEventListener('pointerdown', onPointerDown)
        mount.addEventListener('pointerleave', onPointerLeave)
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)
        window.addEventListener('pointercancel', onPointerCancel)
        mount.addEventListener('wheel', onWheel, { passive: false })

        // A soft round glow, drawn once and shared by every flag at the end of a highlighted route
        const glowTexture = (() => {
            const canvas = document.createElement('canvas')
            canvas.width = canvas.height = 64
            const ctx = canvas.getContext('2d')
            const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 32)
            g.addColorStop(0, 'rgba(255,255,255,0.9)')
            g.addColorStop(0.45, 'rgba(255,255,255,0.45)')
            g.addColorStop(1, 'rgba(255,255,255,0)')
            ctx.fillStyle = g
            ctx.fillRect(0, 0, 64, 64)
            return new THREE.CanvasTexture(canvas)
        })()
        const flagGlows = new Map()

        const camPos = new THREE.Vector3()
        let animFrameId
        const animate = () => {
            animFrameId = requestAnimationFrame(animate)
            // Paused while another tab is showing, rather than stopped: the loop keeps ticking (cheap - one
            // function call and a return) so it's instantly ready to resume, with nothing to reload, the moment
            // this tab is active again - that's the whole point of keeping this page mounted instead of rebuilding
            // the globe from scratch on every visit.
            if (!activeRef.current) return
            easeCamera()
            camPos.copy(camera.position).normalize()
            const loopsView = globeViewRef.current === 'loops'
            const loopCities = loopCityNamesRef.current
            // The two ends of every highlighted route glow gold
            // city -> glow colour: blue for an arrival's ends, gold if any lit departure touches the city too
            const litCities = new Map()
            if (loopsView) hoveredLoopsRef.current.forEach(id => {
                const o = loopObjects.get(id)
                if (!o) return
                const c = loopColor(o.loop.kind)
                ;[o.loop.from, o.loop.to].forEach(n => { if (litCities.get(n) !== arcColors.departure) litCities.set(n, c) })
            })
            sprites.forEach(sprite => {
                const facingCamera = sprite.userData.surfaceNormal.dot(camPos) > 0.1
                // Active Loops shows only the cities with a loop running (and home); Connections can hide unowned ones
                const shown = loopsView
                    ? loopCities.has(sprite.userData.city.name)
                    : showOwnedRef.current || sprite.userData.isPurchased
                sprite.visible = facingCamera && shown
                const glowHex = litCities.get(sprite.userData.city.name)
                const lit = sprite.visible && glowHex !== undefined
                sprite.scale.set(lit ? 0.027 : 0.02, lit ? 0.0175 : 0.013, 1)
                let glow = flagGlows.get(sprite)
                if (lit && !glow) {
                    glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: glowHex, transparent: true, depthTest: true, depthWrite: false }))
                    glow.position.copy(sprite.position).multiplyScalar(0.999)   // just behind the flag
                    glow.scale.set(0.055, 0.045, 1)
                    scene.add(glow)
                    flagGlows.set(sprite, glow)
                }
                if (glow) { glow.visible = lit; if (lit) glow.material.color.setHex(glowHex) }
            })
            loopGroup.visible = loopsView
            if (loopsView) {
                if (syncedLoops !== loopsRef.current) syncLoops()
                placePods()
            }
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
        // Entering/leaving fullscreen (the Settings -> Fullscreen toggle, or F11/Esc) doesn't reliably fire a
        // plain window 'resize' event in every browser, even though the container does resize via CSS (it's
        // sized with flex/vh, which the layout engine updates on its own) - without this, the canvas keeps
        // rendering at its pre-fullscreen resolution and aspect ratio, so the globe looks squashed/cut off
        // against its now-different box. 'fullscreenchange' always fires on this transition regardless, but the
        // layout isn't always settled by the time it does, so this re-checks once more a frame later too.
        const onFullscreenChange = () => { onResize(); requestAnimationFrame(onResize) }
        document.addEventListener('fullscreenchange', onFullscreenChange)

        return () => {
            cancelAnimationFrame(animFrameId)
            clearInterval(sunInterval)
            mount.removeEventListener('pointerdown', onPointerDown)
            mount.removeEventListener('pointerleave', onPointerLeave)
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerup', onPointerUp)
            window.removeEventListener('pointercancel', onPointerCancel)
            mount.removeEventListener('wheel', onWheel)
            window.removeEventListener('resize', onResize)
            document.removeEventListener('fullscreenchange', onFullscreenChange)
            if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
            // Dispose the scene as well as the renderer. Three.js gives every sprite (the flags) one shared shape, and each
            // renderer that draws it leaves a listener on that shape; disposing it removes those listeners. Without this,
            // every visit to Home kept the old globe's renderer in memory, about 100 KB each (bug #183).
            disposed = true
            focusLoopRef.current = null
            scene.traverse(obj => {
                obj.geometry?.dispose()
                const materials = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : []
                materials.forEach(m => { m.map?.dispose(); m.dispose() })
            })
            // Dispose whatever textures are live right now, not the ones this closure loaded at mount time - a
            // quality change (see the listener below) may have swapped them out for a different pair since.
            globeMaterial.uniforms.dayTexture.value.dispose()
            globeMaterial.uniforms.nightTexture.value.dispose()
            globeMaterialRef.current = null
            textureLoaderRef.current = null
            renderer.forceContextLoss()
            renderer.dispose()
        }
    }, [])

    // Settings -> Globe Quality writes straight to localStorage and dispatches this event rather than triggering a
    // remount (the globe stays mounted for the whole session now - see the comment by activeRef above), so this is
    // what actually applies a quality change: swap the day/night textures on the live material in place, in both
    // directions (dropping back down from Max works the same way as stepping up).
    useEffect(() => {
        const onQualityChange = () => {
            const material = globeMaterialRef.current
            const loader = textureLoaderRef.current
            if (!material || !loader) return
            const quality = getGlobeQuality()
            let dayUrl, nightUrl
            try {
                dayUrl = new URL(`../assets/misc/${quality}_earth_daymap.jpg`, import.meta.url).href
                nightUrl = new URL(`../assets/misc/${quality}_earth_nightmap.jpg`, import.meta.url).href
            } catch {
                dayUrl = 'https://unpkg.com/three-globe/example/img/earth-day.jpg'
                nightUrl = 'https://unpkg.com/three-globe/example/img/earth-night.jpg'
            }
            const oldDayTexture = material.uniforms.dayTexture.value
            const oldNightTexture = material.uniforms.nightTexture.value
            const anisotropy = oldDayTexture.anisotropy
            const newDayTexture = loader.load(dayUrl)
            const newNightTexture = loader.load(nightUrl)
            newDayTexture.anisotropy = anisotropy
            newNightTexture.anisotropy = anisotropy
            material.uniforms.dayTexture.value = newDayTexture
            material.uniforms.nightTexture.value = newNightTexture
            oldDayTexture.dispose()
            oldNightTexture.dispose()
        }
        window.addEventListener('globeQualityChange', onQualityChange)
        return () => window.removeEventListener('globeQualityChange', onQualityChange)
    }, [])

    // The trophy button is fixed to the bottom of the window, but the globe can sit lower than expected (a long
    // terminal name wraps onto more lines on a narrow window). Keep the controls column ending above the trophy.
    const rightControlsRef = useRef(null)
    useEffect(() => {
        const fit = () => {
            const el = rightControlsRef.current
            const box = el?.parentElement?.getBoundingClientRect()
            if (!box) return
            // Trophy: 110px up from the bottom of the window and about 78px tall, plus a little gap
            const trophyTop = window.innerHeight - 200
            const bottom = `${Math.max(168, Math.ceil(box.bottom - trophyTop))}px`
            if (el.style.bottom !== bottom) el.style.bottom = bottom
        }
        fit()
        // Re-checked every second too: the header can change height (an event banner, a renamed terminal) with no resize
        const id = setInterval(fit, 1000)
        window.addEventListener('resize', fit)
        return () => { clearInterval(id); window.removeEventListener('resize', fit) }
    }, [])

    return (
        <div className={`home-page${disabled ? ' home-page-disabled' : ''}`} style={{ pointerEvents: disabled ? 'none' : 'auto', display: active ? undefined : 'none' }}>
            <div className="globe-top-info">
                <p className="globe-hint">Drag to rotate · Scroll to zoom</p>
                <p className="globe-cities">{purchasedCitiesCount} {purchasedCitiesCount === 1 ? 'city' : 'cities'} connected</p>
            </div>
            <div className="globe-right-controls" ref={rightControlsRef}>
                <div className="globe-controls-row">
                {/* Always laid out, so the switch doesn't move when the view changes; hidden in Active Loops, where it has no effect */}
                <button
                        className={`globe-toggle-btn ${showOwned ? 'globe-toggle-active' : ''}`}
                        style={globeView === 'connections' ? undefined : { visibility: 'hidden' }}
                        tabIndex={globeView === 'connections' ? 0 : -1}
                        aria-hidden={globeView !== 'connections'}
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => {
                            playClickSound2()
                            setShowOwned(prev => {
                                showOwnedRef.current = !prev
                                try { localStorage.setItem('globeShowOwned', String(!prev)) } catch { /* storage blocked, ignore */ }
                                return !prev
                            })
                        }}
                    >
                        {showOwned ? '👁 All cities' : '👁 Owned only'}
                    </button>
                <div className="globe-view-switch" role="tablist" aria-label="Globe view">
                    <button
                        role="tab"
                        aria-selected={globeView === 'connections'}
                        className={`globe-view-btn ${globeView === 'connections' ? 'globe-view-btn-active' : ''}`}
                        onMouseEnter={() => { if (globeView !== 'connections') playHoverSound() }}
                        onClick={() => chooseView('connections')}
                    >Connections</button>
                    <button
                        role="tab"
                        aria-selected={globeView === 'loops'}
                        className={`globe-view-btn ${globeView === 'loops' ? 'globe-view-btn-active' : ''}`}
                        onMouseEnter={() => { if (globeView !== 'loops') playHoverSound() }}
                        onClick={() => chooseView('loops')}
                    >Active Loops{loops.length > 0 && <span className="globe-view-count">{loops.length}</span>}</button>
                </div>
                </div>
                {globeView === 'loops' && (
                    <div className="loops-panel">
                        <button
                            className="loops-panel-header"
                            aria-expanded={panelOpen}
                            onMouseEnter={() => playHoverSound()}
                            onClick={() => {
                                playClickSound2()
                                setPanelOpen(prev => {
                                    try { localStorage.setItem(PANEL_KEY, String(!prev)) } catch { /* storage blocked, ignore */ }
                                    return !prev
                                })
                            }}
                        >
                            <span className={`loops-live-dot ${loops.length > 0 ? 'loops-live-dot-on' : ''}`} />
                            <span className="loops-panel-title">
                                {loops.length === 0 ? 'No loops running' : `${loops.length} ${loops.length === 1 ? 'loop' : 'loops'} running`}
                                {loops.length > 0 && (
                                    <span className="loops-panel-next">Next in: {loops[0].kind === 'arrival' ? loops[0].from : loops[0].to}, {formatClock(loops[0].endTs)}</span>
                                )}
                            </span>
                            <span className="loops-panel-caret">{panelOpen ? '▾' : '▸'}</span>
                        </button>
                        {panelOpen && (
                            loops.length === 0 ? (
                                <p className="loops-empty">
                                    {purchasedCitiesCount <= 1
                                        ? 'Connect another city to start running loops.'
                                        : 'No loops are travelling right now. Check the Terminal Board for the next one.'}
                                </p>
                            ) : (
                                <ul className="loops-list" ref={loopsListRef} onMouseLeave={() => hoverLoops([])}>
                                    {loops.map(loop => {
                                        const progress = Math.min(100, Math.max(0, ((nowMs - loop.startTs) / Math.max(1, loop.endTs - loop.startTs)) * 100))
                                        const fromFlag = countryFlags[loop.fromCountry], toFlag = countryFlags[loop.toCountry]
                                        // Distance still to go: the route's length, less the share of the trip already travelled
                                        const routeMiles = distanceMiles(loop.from, loop.to)
                                        const milesLeft = routeMiles === null ? null : routeMiles * (1 - progress / 100)
                                        return (
                                            <li
                                                key={loop.id}
                                                data-loop-id={loop.id}
                                                className={`loop-row loop-row-${loop.kind} ${hoveredLoopIds.includes(loop.id) ? 'loop-row-hovered' : ''}`}
                                                onMouseEnter={() => hoverLoops([loop.id])}
                                                onClick={() => { playClickSound2(); hoverLoops([loop.id]); focusLoopRef.current?.(loop.id) }}
                                            >
                                                <div className="loop-route">
                                                    {fromFlag && <img src={flagSrc(fromFlag)} alt="" className="loop-flag" />}
                                                    <span className="loop-city">{loop.from}</span>
                                                    <span className="loop-arrow">→</span>
                                                    {toFlag && <img src={flagSrc(toFlag)} alt="" className="loop-flag" />}
                                                    <span className="loop-city">{loop.to}</span>
                                                    <span className="loop-tag">{loop.kind === 'arrival' ? 'ARR' : 'DEP'}</span>
                                                </div>
                                                <div className="loop-bar" style={{ '--p': progress / 100 }}><div className="loop-bar-fill" /><div className="loop-pod" /></div>
                                                <div className="loop-eta">
                                                    {loop.delayed && <span className="loop-delayed">DELAYED · </span>}
                                                    Expected {formatClock(loop.endTs)} · {formatDuration(loop.endTs - nowMs)} left
                                                </div>
                                                <div className="loop-pax">{loop.passengers.toLocaleString('en-GB')} {loop.passengers === 1 ? 'passenger' : 'passengers'} onboard{milesLeft !== null && <> · {formatDistance(milesLeft)} left</>}</div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )
                        )}
                    </div>
                )}
            </div>
            {!globeReady && (
                <div className="globe-loading">
                    <p>Loading globe...</p>
                </div>
            )}
            <div ref={mountRef} className="globe-container" />
            {selectedGlobeCity && (
                <div className="modal-overlay" onClick={() => setSelectedGlobeCity(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <img src={flagSrc(countryFlags[selectedGlobeCity.country])} alt={selectedGlobeCity.country} />
                        <h3>{selectedGlobeCity.name}</h3>
                        <hr />
                        <p><strong>Country</strong>: {selectedGlobeCity.country}</p>
                        <p><strong>Population</strong>: {selectedGlobeCity.population.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</p>
                        {economyManager && (() => {
                            const coords = cityCoordinates[selectedGlobeCity.name]
                            const coordsMap = coords ? { [selectedGlobeCity.name]: coords } : null
                            const income = economyManager.withFoundersHall(economyManager.calculateCityIncome(selectedGlobeCity, coordsMap))
                            const earning = economyManager.isCityEarning(selectedGlobeCity)
                            return (
                                <>
                                    <p>{earning ? 'Earning' : 'Would earn'} <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                        <img src={cashIcon} alt="£" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0', verticalAlign: 'middle' }} />
                                        {formatPerHour(income)}
                                    </strong> per hour</p>
                                    {!earning && <p style={{ color: '#c0392b', fontWeight: 'bold' }}>Not on the timetable: it earns nothing until it has a scheduled departure.</p>}
                                </>
                            )
                        })()}
                        <p><em>{selectedGlobeCity.fact}</em></p>
                        <img
                            // Falls back to the thumbnail for a city that hasn't made it to the Cloudinary host yet.
                            src={cityImages[selectedGlobeCity.name] || cityThumbnails[selectedGlobeCity.name]}
                            alt={selectedGlobeCity.name}
                            onClick={(e) => { e.stopPropagation(); setEnlargedImage(cityImages[selectedGlobeCity.name] || cityThumbnails[selectedGlobeCity.name]) }}
                            style={{ width: '160px', height: '160px', borderRadius: '10px', border: '3px solid black', objectFit: 'cover', marginTop: '8px', cursor: 'zoom-in' }}
                        />
                        <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setSelectedGlobeCity(null) }}>Close</button>
                    </div>
                </div>
            )}
            {enlargedImage && (
                <div className="modal-overlay" style={{ zIndex: 200 }} onClick={() => setEnlargedImage(null)}>
                    <img src={enlargedImage} alt="enlarged" style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: '12px', border: '3px solid black' }} />
                </div>
            )}
            {selectedUnlockedCity && !purchasedCities.some(c => c.name === selectedUnlockedCity.name) && (
                <div className="modal-overlay" onClick={() => setSelectedUnlockedCity(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        {constructionManager?.progressionManager?.citiesUnderConstruction?.some(c => c.name === selectedUnlockedCity.name) ? (
                            <>
                                <img src={flagSrc(countryFlags[selectedUnlockedCity.country])} alt={selectedUnlockedCity.country} />
                                <h3>{selectedUnlockedCity.name}</h3>
                                <hr />
                                <p>Under construction!</p>
                                {(() => {
                                    const uc = constructionManager.progressionManager.citiesUnderConstruction.find(c => c.name === selectedUnlockedCity.name)
                                    return uc ? <p><strong>{formatTime(constructionManager.timeManager.getTimeRemaining(uc.finishTime))}</strong> remaining</p> : null
                                })()}
                                {(() => {
                                    // The same "Build instantly" as the Cities page, so the globe's popup offers it too
                                    const uc = constructionManager.progressionManager.citiesUnderConstruction.find(c => c.name === selectedUnlockedCity.name)
                                    const skipCost = constructionManager.calculateSkipCost(uc)
                                    if (skipCost <= 0) return null
                                    const canSkip = constructionManager.progressionManager.reputation >= skipCost
                                    return (
                                        <button className="constructionButton" onMouseEnter={() => playHoverSound()} style={{ opacity: canSkip ? 1 : 0.5 }} onClick={() => {
                                            if (!constructionManager.skipConstruction(uc)) { playNotEnoughFundsSound(); return }
                                            playClickSound2(); playFarewellAcceptSound(); onConnectCity?.(); setSelectedUnlockedCity(null)
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                Build instantly (<img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none' }} />{skipCost})
                                            </span>
                                        </button>
                                    )
                                })()}
                                <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setSelectedUnlockedCity(null) }}>Close</button>
                            </>
                        ) : (
                            <>
                                <img src={flagSrc(countryFlags[selectedUnlockedCity.country])} alt={selectedUnlockedCity.country} />
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
                        alt={hoveredCity.isPurchased || hoveredCity.isUnlocked ? hoveredCity.city.name : 'Unknown city'}
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
                    <div className="city-hover-divider">
    <span>CITY FACT</span>
</div>
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