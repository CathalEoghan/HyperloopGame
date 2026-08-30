import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import cityCoordinates from '../data/cityCoordinates.js'
import countryFlags from '../data/countryFlags.js'
import cityImages from '../data/cityImages.js'
import { allCities } from '../../../CityManager/CityRegistry.js'
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
    return pop.toLocaleString()
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

function HomePage({ purchasedCities, purchasedCitiesCount }) {
    const mountRef = useRef(null)
    const [hoveredCity, setHoveredCity] = useState(null)

    useEffect(() => {
        const mount = mountRef.current
        const width = mount.clientWidth
        const height = mount.clientHeight

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0a0a1a)

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
        let camLon = 0
        let camLat = 0
        let camDist = 2.5

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
        renderer.setPixelRatio(window.devicePixelRatio)
        mount.appendChild(renderer.domElement)

        const globeRadius = 1
        const textureLoader = new THREE.TextureLoader()

        // Try local textures, fall back to CDN
        let dayUrl, nightUrl
        try {
            dayUrl = new URL('../assets/misc/8k_earth_daymap.jpg', import.meta.url).href
            nightUrl = new URL('../assets/misc/8k_earth_nightmap.jpg', import.meta.url).href
        } catch {
            dayUrl = 'https://unpkg.com/three-globe/example/img/earth-day.jpg'
            nightUrl = 'https://unpkg.com/three-globe/example/img/earth-night.jpg'
        }

        const dayTexture = textureLoader.load(dayUrl)
        const nightTexture = textureLoader.load(nightUrl)
        const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
        dayTexture.anisotropy = maxAnisotropy
        nightTexture.anisotropy = maxAnisotropy

        // GLOBE — day/night shader
        const globeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                dayTexture: { value: dayTexture },
                nightTexture: { value: nightTexture },
                sunDirection: { value: getSunWorldPosition().normalize() },
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
                varying vec2 vUv;
                varying vec3 vNormal;
                void main() {
                    vec4 dayColor = texture2D(dayTexture, vUv);
                    vec4 nightColor = texture2D(nightTexture, vUv) * 1.8;
                    float cosAngle = dot(vNormal, sunDirection);
                    float blend = smoothstep(-0.1, 0.2, cosAngle);
                    gl_FragColor = mix(nightColor, dayColor, blend);
                }
            `,
        })

        const globe = new THREE.Mesh(
            new THREE.SphereGeometry(globeRadius, 128, 128),
            globeMaterial
        )
        scene.add(globe)

        // ATMOSPHERE — separate mesh with limb glow shader
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

        const atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(globeRadius * 1.1, 64, 64),
            atmosMaterial
        )
        scene.add(atmosphere)

        // Update sun every 60s
        const sunInterval = setInterval(() => {
            globeMaterial.uniforms.sunDirection.value.copy(getSunWorldPosition().normalize())
        }, 60000)

        // Stars
        const starPositions = new Float32Array(2000 * 3)
        for (let i = 0; i < 2000 * 3; i++) starPositions[i] = (Math.random() - 0.5) * 100
        const starGeo = new THREE.BufferGeometry()
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
        scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 })))

        // City sprites
        const sprites = []
        const purchasedNames = new Set(purchasedCities.map(c => c.name))

        allCities.forEach(city => {
            const coords = cityCoordinates[city.name]
            if (!coords) return
            const flagCode = countryFlags[city.country]
            if (!flagCode) return
            const isPurchased = purchasedNames.has(city.name)
            const spritePos = latLngToVector3(coords.lat, coords.lng, globeRadius + 0.035)
            const surfaceNormal = latLngToVector3(coords.lat, coords.lng, 1)
            const flagTexture = textureLoader.load(`https://flagcdn.com/w40/${flagCode}.png`)
            const spriteMat = new THREE.SpriteMaterial({
                map: flagTexture, transparent: true, depthTest: true, depthWrite: false,
            })
            if (!isPurchased) spriteMat.color = new THREE.Color(0.3, 0.3, 0.3)
            const sprite = new THREE.Sprite(spriteMat)
            sprite.position.copy(spritePos)
            sprite.scale.set(0.02, 0.013, 1)
            sprite.userData = { city, surfaceNormal, isPurchased }
            scene.add(sprite)
            sprites.push(sprite)
        })

        const raycaster = new THREE.Raycaster()
        raycaster.params.Sprite = { threshold: 0.01 }
        const mouse = new THREE.Vector2()
        let isDragging = false
        let prev = { x: 0, y: 0 }

        const onMouseDown = (e) => { isDragging = true; prev = { x: e.clientX, y: e.clientY } }
        const onMouseMove = (e) => {
            const rect = mount.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)
            const visibleSprites = sprites.filter(s => s.visible)
            const hits = raycaster.intersectObjects(visibleSprites)
            setHoveredCity(hits.length > 0 ? hits[0].object.userData : null)
            if (!isDragging) return
            camLon -= (e.clientX - prev.x) * 0.3
            camLat = Math.max(-85, Math.min(85, camLat + (e.clientY - prev.y) * 0.3))
            prev = { x: e.clientX, y: e.clientY }
            updateCamera()
        }
        const onMouseUp = () => { isDragging = false }
        const onWheel = (e) => {
            camDist = Math.max(1.5, Math.min(5, camDist + e.deltaY * 0.003))
            updateCamera()
        }

        mount.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        mount.addEventListener('wheel', onWheel)

        const camPos = new THREE.Vector3()
        let animFrameId
        const animate = () => {
            animFrameId = requestAnimationFrame(animate)
            camPos.copy(camera.position).normalize()
            sprites.forEach(sprite => {
                sprite.visible = sprite.userData.surfaceNormal.dot(camPos) > 0.1
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
            mount.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            mount.removeEventListener('wheel', onWheel)
            window.removeEventListener('resize', onResize)
            mount.removeChild(renderer.domElement)
            renderer.dispose()
        }
    }, [purchasedCities])

    return (
        <div className="home-page">
            <div className="globe-top-info">
                {hoveredCity ? (
                    <>
                        <p className="tooltip-city">{hoveredCity.isPurchased ? hoveredCity.city.name : '?'}</p>
                        <p className="tooltip-detail">{hoveredCity.city.country} | {formatPopulation(hoveredCity.city.population)}</p>
                    </>
                ) : (
                    <>
                        <p className="tooltip-city">&nbsp;</p>
                        <p className="tooltip-detail">&nbsp;</p>
                    </>
                )}
            </div>
            <div ref={mountRef} className="globe-container" />
            {hoveredCity && (
                <div className="city-hover-panel">
                    <img
                        className="city-hover-image"
                        src={cityImages[hoveredCity.city.name]}
                        alt={hoveredCity.city.name}
                        style={!hoveredCity.isPurchased ? { filter: 'grayscale(100%)' } : {}}
                    />
                    <div className="city-hover-divider">── CITY FACT ──</div>
                    <p className="city-hover-fact">
                        {hoveredCity.isPurchased
                            ? hoveredCity.city.fact
                            : <em>Unlock this city to reveal its secret!</em>
                        }
                    </p>
                </div>
            )}
            <div className="globe-bottom-info">
                <p className="globe-hint">Drag to rotate · Scroll to zoom</p>
                <p className="globe-cities">{purchasedCitiesCount} cities connected</p>
            </div>
        </div>
    )
}

export default HomePage