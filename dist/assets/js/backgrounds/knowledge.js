function knowledgeBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.domElement.id = 'canvas-knowledge'

    document.getElementById('main').appendChild(renderer.domElement)

    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.z = 500

    var scene = new THREE.Scene()

    // Add Fog for Depth
    var bgColor = option_hero_background_knowledge_bg_color || '#111';
    scene.fog = new THREE.FogExp2(bgColor, 0.0025);

    // Particle System
    var particleCount = 4000
    var geometry = new THREE.BufferGeometry()
    var positions = new Float32Array(particleCount * 3)
    var colors = new Float32Array(particleCount * 3)
    var sizes = new Float32Array(particleCount)

    var color1 = new THREE.Color(option_hero_background_knowledge_color_1 || '#00ffff')
    var color2 = new THREE.Color(option_hero_background_knowledge_color_2 || '#ff00ff')

    for (var i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1000
        positions[i * 3 + 1] = (Math.random() - 0.5) * 1000
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1000

        var mixedColor = color1.clone().lerp(color2, Math.random())
        colors[i * 3] = mixedColor.r
        colors[i * 3 + 1] = mixedColor.g
        colors[i * 3 + 2] = mixedColor.b

        sizes[i] = Math.random() * 2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    // Create a soft circle texture for bokeh effect
    var canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    var context = canvas.getContext('2d');
    var gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    var texture = new THREE.CanvasTexture(canvas);

    // Custom Shader Material for better performance and look
    var material = new THREE.PointsMaterial({
        size: 4, // Increased size for bokeh effect
        map: texture, // Use soft texture
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false, // Fix transparency sorting issues
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    })

    var points = new THREE.Points(geometry, material)
    scene.add(points)

    // Mouse interaction
    var mouse = new THREE.Vector2()
    var target = new THREE.Vector2()
    var windowHalfX = window.innerWidth / 2
    var windowHalfY = window.innerHeight / 2

    function onDocumentMouseMove(event) {
        mouse.x = (event.clientX - windowHalfX) * 0.001
        mouse.y = (event.clientY - windowHalfY) * 0.001
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

    // Simplex Noise-like function (Pseudo-noise)
    function noise(x, y, z) {
        return Math.sin(x * 0.01) + Math.sin(y * 0.01) + Math.sin(z * 0.01)
    }

    var time = 0
    function animate() {
        requestAnimationFrame(animate)
        time += 0.005

        var positions = points.geometry.attributes.position.array

        for (var i = 0; i < particleCount; i++) {
            var x = positions[i * 3]
            var y = positions[i * 3 + 1]
            var z = positions[i * 3 + 2]

            // Flow Field Logic
            var angle = noise(x + time * 10, y + time * 10, z) * Math.PI * 2
            var speed = 0.5 + Math.random() * 0.5

            x += Math.cos(angle) * speed + (mouse.x * 10)
            y += Math.sin(angle) * speed + (mouse.y * 10)
            z += Math.sin(angle * 0.5) * speed

            // Boundary Wrap
            if (x > 500) x = -500
            if (x < -500) x = 500
            if (y > 500) y = -500
            if (y < -500) y = 500
            if (z > 500) z = -500
            if (z < -500) z = 500

            positions[i * 3] = x
            positions[i * 3 + 1] = y
            positions[i * 3 + 2] = z
        }

        points.geometry.attributes.position.needsUpdate = true

        // Gentle rotation
        scene.rotation.y += 0.001
        scene.rotation.z += 0.0005

        renderer.render(scene, camera)
    }

    animate()

    $('#canvas-knowledge').css('opacity', option_hero_background_knowledge_opacity || 0.6)
    $('body').append('<div class="bg-color" style="background-color:' + (option_hero_background_knowledge_bg_color || '#111') + '"></div>')
}
