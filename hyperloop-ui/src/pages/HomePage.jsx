import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import cityCoordinates from '../data/cityCoordinates.js'
import countryFlags from '../data/countryFlags.js'
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
        camera.position.z = 2.5

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        mount.appendChild(renderer.domElement)

        const globeRadius = 1
        const geometry = new THREE.SphereGeometry(globeRadius, 64, 64)
        const textureLoader = new THREE.TextureLoader()
        const texture = textureLoader.load(
            'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
        )
        const material = new THREE.MeshPhongMaterial({ map: texture })
        const globe = new THREE.Mesh(geometry, material)
        scene.add(globe)

        const atmosGeometry = new THREE.SphereGeometry(globeRadius * 1.02, 64, 64)
        const atmosMaterial = new THREE.MeshPhongMaterial({
            color: 0x4488ff, transparent: true, opacity: 0.08, side: THREE.FrontSide
        })
        const atmosphere = new THREE.Mesh(atmosGeometry, atmosMaterial)
        scene.add(atmosphere)

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
        scene.add(ambientLight)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2)
        sunLight.position.set(5, 3, 5)
        scene.add(sunLight)

        const starGeometry = new THREE.BufferGeometry()
        const starPositions = new Float32Array(2000 * 3)
        for (let i = 0; i < 2000 * 3; i++) starPositions[i] = (Math.random() - 0.5) * 100
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
        scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 })))

        // City flag sprites — placed well above surface, visibility toggled per frame
        const cityGroup = new THREE.Group()
        scene.add(cityGroup)
        const sprites = []

        purchasedCities.forEach(city => {
            const coords = cityCoordinates[city.name]
            if (!coords) return
            const flagCode = countryFlags[city.country]
            if (!flagCode) return

            // Store the base surface normal so we can check facing each frame
            const surfacePos = latLngToVector3(coords.lat, coords.lng, 1)
            const spritePos = latLngToVector3(coords.lat, coords.lng, globeRadius + 0.035)

            const flagUrl = `https://flagcdn.com/w40/${flagCode}.png`
            const flagTexture = textureLoader.load(flagUrl)
            const spriteMat = new THREE.SpriteMaterial({
                map: flagTexture,
                transparent: true,
                depthTest: true,
                depthWrite: false,
            })
            const sprite = new THREE.Sprite(spriteMat)
            sprite.position.copy(spritePos)
            sprite.scale.set(0.02, 0.013, 1)
            sprite.userData = { city, surfacePos, spritePos }
            cityGroup.add(sprite)
            sprites.push(sprite)
        })

        // Raycaster
        const raycaster = new THREE.Raycaster()
        raycaster.params.Sprite = { threshold: 0.01 }
        const mouse = new THREE.Vector2()

        let isDragging = false
        let previousMousePosition = { x: 0, y: 0 }

        const onMouseDown = (e) => {
            isDragging = true
            previousMousePosition = { x: e.clientX, y: e.clientY }
        }
        const onMouseMove = (e) => {
            const rect = mount.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
            raycaster.setFromCamera(mouse, camera)
            const visibleSprites = sprites.filter(s => s.visible)
            const intersects = raycaster.intersectObjects(visibleSprites)
            setHoveredCity(intersects.length > 0 ? intersects[0].object.userData.city : null)

            if (!isDragging) return
            const delta = { x: e.clientX - previousMousePosition.x, y: e.clientY - previousMousePosition.y }
            globe.rotation.x += delta.y * 0.003
            globe.rotation.y += delta.x * 0.003
            atmosphere.rotation.copy(globe.rotation)
            cityGroup.rotation.copy(globe.rotation)
            previousMousePosition = { x: e.clientX, y: e.clientY }
        }
        const onMouseUp = () => { isDragging = false }
        const onWheel = (e) => {
            camera.position.z = Math.max(1.5, Math.min(5, camera.position.z + e.deltaY * 0.003))
        }

        mount.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        mount.addEventListener('wheel', onWheel)

        // Camera direction vector (reused each frame)
        const cameraDir = new THREE.Vector3()
        const worldSurfacePos = new THREE.Vector3()

        let animFrameId
        const animate = () => {
            animFrameId = requestAnimationFrame(animate)

            if (!isDragging) {
            }

            // Show/hide sprites based on whether they face the camera
            camera.getWorldDirection(cameraDir).negate()
            sprites.forEach(sprite => {
                // Transform the stored surface normal by the group's current rotation
                worldSurfacePos.copy(sprite.userData.surfacePos)
                    .applyEuler(cityGroup.rotation)
                // Dot product > 0 means facing camera
                sprite.visible = worldSurfacePos.dot(cameraDir) > 0.1
            })

            renderer.render(scene, camera)
        }
        animate()

        const onResize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }
        window.addEventListener('resize', onResize)

        return () => {
            cancelAnimationFrame(animFrameId)
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
                        <p className="tooltip-city">{hoveredCity.name}</p>
                        <p className="tooltip-detail">{hoveredCity.country} | {formatPopulation(hoveredCity.population)}</p>
                    </>
                ) : (
                    <>
                        <p className="tooltip-city">&nbsp;</p>
                        <p className="tooltip-detail">&nbsp;</p>
                    </>
                )}
            </div>
            <div ref={mountRef} className="globe-container" />
            <div className="globe-bottom-info">
                <p className="globe-hint">Drag to rotate · Scroll to zoom</p>
                <p className="globe-cities">{purchasedCitiesCount} cities connected</p>
            </div>
        </div>
    )
}

export default HomePage