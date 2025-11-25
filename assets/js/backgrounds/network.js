function networkBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.domElement.id = 'canvas-network'

    document.getElementById('main').appendChild(renderer.domElement)

    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.z = 400

    var scene = new THREE.Scene()

    var particles = []
    var particleCount = 180 // Increased for better density
    var connectionDistance = 110

    var geometry = new THREE.BufferGeometry()
    var positions = new Float32Array(particleCount * 3)
    var colors = new Float32Array(particleCount * 3)

    // Create a soft glow texture programmatically
    function getTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        var context = canvas.getContext('2d');
        var gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    var material = new THREE.PointsMaterial({
        size: 5,
        map: getTexture(),
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    })

    // Palette for a more "amazing" look
    var palette = [
        new THREE.Color('#ffffff'), // White
        new THREE.Color('#00ffff'), // Cyan
        new THREE.Color('#aaaaaa')  // Grey
    ];

    // Check if user provided a specific color, if so, mix it in
    if (typeof option_hero_background_network_particle_color !== 'undefined' && option_hero_background_network_particle_color) {
        palette.push(new THREE.Color(option_hero_background_network_particle_color));
    }

    for (var i = 0; i < particleCount; i++) {
        var x = Math.random() * 800 - 400
        var y = Math.random() * 800 - 400
        var z = Math.random() * 800 - 400

        particles.push({
            x: x,
            y: y,
            z: z,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            vz: (Math.random() - 0.5) * 0.6,
        })

        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z

        // Assign random color from palette
        var color = palette[Math.floor(Math.random() * palette.length)];
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
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    })

    var linesGeometry = new THREE.BufferGeometry()
    var lines = new THREE.LineSegments(linesGeometry, lineMaterial)
    scene.add(lines)

    // Mouse interaction
    var mouse = new THREE.Vector2()
    var windowHalfX = window.innerWidth / 2
    var windowHalfY = window.innerHeight / 2

    function onDocumentMouseMove(event) {
        mouse.x = (event.clientX - windowHalfX)
        mouse.y = (event.clientY - windowHalfY)
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

        // Update particles
        var positions = points.geometry.attributes.position.array
        var linePositions = []

        for (var i = 0; i < particleCount; i++) {
            var p = particles[i]

            p.x += p.vx
            p.y += p.vy
            p.z += p.vz

            // Bounce off boundaries
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

        // Rotate scene constantly
        scene.rotation.y += 0.001
        scene.rotation.x += 0.0005

        // Mouse influence on camera position for parallax effect
        camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.05
        camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.05
        camera.lookAt(scene.position)

        renderer.render(scene, camera)
    }

    animate()

    $('#canvas-network').css('opacity', option_hero_background_network_opacity || 0.8)

    // Check if background color div exists, if not create it
    if ($('.bg-color').length === 0) {
        $('body').append('<div class="bg-color" style="background-color:' + (option_hero_background_network_bg_color || '#1a1a1a') + '"></div>')
    } else {
        $('.bg-color').css('background-color', option_hero_background_network_bg_color || '#1a1a1a')
    }
}
