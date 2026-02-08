function knowledgeCoreBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.domElement.id = 'canvas-knowledge-core'

    document.getElementById('main').appendChild(renderer.domElement)

    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.z = 400

    var scene = new THREE.Scene()

    // Particle System
    var particleCount = 7000
    var geometry = new THREE.BufferGeometry()
    var positions = new Float32Array(particleCount * 3)
    var colors = new Float32Array(particleCount * 3)
    var originalPositions = new Float32Array(particleCount * 3)

    var color1 = new THREE.Color(option_hero_background_knowledge_core_color_1 || '#ff0055')
    var color2 = new THREE.Color(option_hero_background_knowledge_core_color_2 || '#00aaff')

    var radius = 160

    for (var i = 0; i < particleCount; i++) {
        // Spherical distribution
        var theta = Math.random() * Math.PI * 2
        var phi = Math.acos(Math.random() * 2 - 1)

        var x = radius * Math.sin(phi) * Math.cos(theta)
        var y = radius * Math.sin(phi) * Math.sin(theta)
        var z = radius * Math.cos(phi)

        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z

        originalPositions[i * 3] = x
        originalPositions[i * 3 + 1] = y
        originalPositions[i * 3 + 2] = z

        colors[i * 3] = color1.r
        colors[i * 3 + 1] = color1.g
        colors[i * 3 + 2] = color1.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    var material = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
    })

    var sphere = new THREE.Points(geometry, material)
    scene.add(sphere)

    // Mouse interaction
    var mouse = new THREE.Vector2(0, 0)
    var windowHalfX = window.innerWidth / 2
    var windowHalfY = window.innerHeight / 2

    function onDocumentMouseMove(event) {
        mouse.x = (event.clientX - windowHalfX) * 0.5
        mouse.y = (event.clientY - windowHalfY) * 0.5
    }

    document.addEventListener('mousemove', onDocumentMouseMove, false)
    window.addEventListener('resize', onWindowResize, false)

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2
        windowHalfY = window.innerHeight / 2
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }

    var time = 0
    function animate() {
        requestAnimationFrame(animate)
        time += 0.015

        var positions = sphere.geometry.attributes.position.array
        var colors = sphere.geometry.attributes.color.array

        // Rotate the whole sphere
        sphere.rotation.y += 0.002
        sphere.rotation.z += 0.001

        for (var i = 0; i < particleCount; i++) {
            var ox = originalPositions[i * 3]
            var oy = originalPositions[i * 3 + 1]
            var oz = originalPositions[i * 3 + 2]

            // Organic Noise / Pulse
            var noise = Math.sin(ox * 0.02 + time) * Math.cos(oy * 0.02 + time) * Math.sin(oz * 0.02 + time)
            var scale = 1 + noise * 0.3

            positions[i * 3] = ox * scale
            positions[i * 3 + 1] = oy * scale
            positions[i * 3 + 2] = oz * scale

            // Color Shift based on displacement
            var lerpFactor = (scale - 0.7) / 0.6 // Normalize roughly
            if (lerpFactor < 0) lerpFactor = 0
            if (lerpFactor > 1) lerpFactor = 1

            var mixedColor = color1.clone().lerp(color2, lerpFactor)
            colors[i * 3] = mixedColor.r
            colors[i * 3 + 1] = mixedColor.g
            colors[i * 3 + 2] = mixedColor.b
        }

        sphere.geometry.attributes.position.needsUpdate = true
        sphere.geometry.attributes.color.needsUpdate = true

        // Mouse Parallax
        camera.position.x += (mouse.x - camera.position.x) * 0.05
        camera.position.y += (-mouse.y - camera.position.y) * 0.05
        camera.lookAt(scene.position)

        renderer.render(scene, camera)
    }

    animate()

    $('#canvas-knowledge-core').css('opacity', option_hero_background_knowledge_core_opacity || 1)
    $('body').append('<div class="bg-color" style="background-color:' + (option_hero_background_knowledge_core_bg_color || '#050505') + '"></div>')
}
