function networkBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.domElement.id = 'canvas-network'

    document.getElementById('main').appendChild(renderer.domElement)

    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.z = 400

    var scene = new THREE.Scene()
    // scene.background = new THREE.Color(option_hero_background_network_bg_color || '#212121');

    var particles = []
    var particleCount = 100 // Adjust for density
    var connectionDistance = 100

    var geometry = new THREE.BufferGeometry()
    var positions = new Float32Array(particleCount * 3)
    var colors = new Float32Array(particleCount * 3)

    var material = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
    })

    // Create particles
    for (var i = 0; i < particleCount; i++) {
        var x = Math.random() * 800 - 400
        var y = Math.random() * 800 - 400
        var z = Math.random() * 800 - 400

        particles.push({
            x: x,
            y: y,
            z: z,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            vz: (Math.random() - 0.5) * 0.5,
        })

        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z

        // Color gradient or single color
        var color = new THREE.Color(option_hero_background_network_particle_color || '#ffffff')
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    var points = new THREE.Points(geometry, material)
    scene.add(points)

    // Lines
    var lineMaterial = new THREE.LineBasicMaterial({
        color: option_hero_background_network_line_color || '#ffffff',
        transparent: true,
        opacity: 0.2,
    })

    var linesGeometry = new THREE.BufferGeometry()
    var lines = new THREE.LineSegments(linesGeometry, lineMaterial)
    scene.add(lines)

    // Mouse interaction
    var mouse = new THREE.Vector2()
    var target = new THREE.Vector2()
    var windowHalfX = window.innerWidth / 2
    var windowHalfY = window.innerHeight / 2

    function onDocumentMouseMove(event) {
        mouse.x = (event.clientX - windowHalfX) * 0.05
        mouse.y = (event.clientY - windowHalfY) * 0.05
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

    function animate() {
        requestAnimationFrame(animate)

        target.x = (1 - mouse.x) * 0.002
        target.y = (1 - mouse.y) * 0.002

        // Update particles
        var positions = points.geometry.attributes.position.array
        var linePositions = []

        for (var i = 0; i < particleCount; i++) {
            var p = particles[i]

            p.x += p.vx
            p.y += p.vy
            p.z += p.vz

            // Bounce off boundaries (virtual box)
            if (p.x < -400 || p.x > 400) p.vx = -p.vx
            if (p.y < -400 || p.y > 400) p.vy = -p.vy
            if (p.z < -400 || p.z > 400) p.vz = -p.vz

            positions[i * 3] = p.x
            positions[i * 3 + 1] = p.y
            positions[i * 3 + 2] = p.z

            // Check connections
            for (var j = i + 1; j < particleCount; j++) {
                var p2 = particles[j]
                var dist = Math.sqrt(Math.pow(p.x - p2.x, 2) + Math.pow(p.y - p2.y, 2) + Math.pow(p.z - p2.z, 2))

                if (dist < connectionDistance) {
                    linePositions.push(p.x, p.y, p.z)
                    linePositions.push(p2.x, p2.y, p2.z)
                }
            }
        }

        points.geometry.attributes.position.needsUpdate = true

        // Update lines
        lines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))

        // Rotate scene slightly based on mouse
        scene.rotation.x += 0.001 + (mouse.y * 0.0001)
        scene.rotation.y += 0.001 + (mouse.x * 0.0001)

        renderer.render(scene, camera)
    }

    animate()

    $('#canvas-network').css('opacity', option_hero_background_network_opacity || 0.5)
    $('body').append('<div class="bg-color" style="background-color:' + (option_hero_background_network_bg_color || '#212121') + '"></div>')
}
