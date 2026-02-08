function asteroidsBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.id = 'canvas-asteroids'

    document.getElementById('main').appendChild(renderer.domElement)

    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 40

    var scene = new THREE.Scene()

    // Handle potential invalid color from config
    var bgColor = option_hero_background_asteroids_bg_color
    if (bgColor === '#orange' || !bgColor) bgColor = '#050505'

    scene.fog = new THREE.FogExp2(bgColor, 0.015)

    // Groups
    var asteroidGroup = new THREE.Group()
    var starGroup = new THREE.Group()
    scene.add(asteroidGroup)
    scene.add(starGroup)

    // --- LIGHTS ---
    var ambientLight = new THREE.AmbientLight(0x222222) // Darker ambient
    scene.add(ambientLight)

    // Main directional light (Sun-like)
    var dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
    dirLight.position.set(20, 20, 20)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    scene.add(dirLight)

    // Blue rim light for "sci-fi" feel
    var rimLight = new THREE.SpotLight(0x0077ff, 5)
    rimLight.position.set(-20, 10, -10)
    rimLight.lookAt(0, 0, 0)
    scene.add(rimLight)

    // Moving point light
    var pointLight = new THREE.PointLight(0xffaa00, 2, 50)
    pointLight.position.set(0, 0, 10)
    scene.add(pointLight)

    // --- ASTEROIDS ---
    // Use Icosahedron with detail 0 for low-poly look
    var geometry = new THREE.IcosahedronGeometry(1, 0)

    // 1. Solid Material (Standard)
    var materialSolid = new THREE.MeshStandardMaterial({
        color: option_hero_background_asteroids_cube_color || '#333',
        roughness: 0.6,
        metalness: 0.3,
        flatShading: true
    })

    // 2. Wireframe Material (Tech/Holographic look)
    var materialWireframe = new THREE.MeshBasicMaterial({
        color: 0x00aaff, // Cyan
        wireframe: true,
        transparent: true,
        opacity: 0.3
    })

    var asteroidCount = 150
    for (var i = 0; i < asteroidCount; i++) {
        var asteroid;
        var rand = Math.random();

        if (rand > 0.85) {
            // 15% Wireframe
            asteroid = new THREE.Mesh(geometry, materialWireframe);
        } else {
            // 85% Solid
            asteroid = new THREE.Mesh(geometry, materialSolid);
            asteroid.castShadow = true;
            asteroid.receiveShadow = true;
        }

        // Random position spread (donut shapeish or cloud)
        var theta = Math.random() * Math.PI * 2
        var phi = Math.acos(2 * Math.random() - 1)
        var radius = 10 + Math.random() * 40

        asteroid.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi) * 0.5 // Flattened on Z slightly
        )

        // Random scale
        var scale = Math.random() * 1.2 + 0.3
        asteroid.scale.set(scale, scale, scale)

        // Random rotation
        asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)

        // Custom properties for animation
        asteroid.userData = {
            rotSpeed: {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            },
            orbitSpeed: (Math.random() * 0.002) + 0.001,
            initialAngle: Math.atan2(asteroid.position.z, asteroid.position.x),
            orbitRadius: Math.sqrt(asteroid.position.x * asteroid.position.x + asteroid.position.z * asteroid.position.z)
        }

        asteroidGroup.add(asteroid)
    }

    // --- BOKEH STARS ---
    var starGeometry = new THREE.BufferGeometry()
    var starCount = 2000
    var starPositions = new Float32Array(starCount * 3)
    var starSizes = new Float32Array(starCount)
    var starColors = new Float32Array(starCount * 3)

    var color1 = new THREE.Color(0x00aaff); // Cyan
    var color2 = new THREE.Color(0xff0055); // Pink/Red

    for (var i = 0; i < starCount; i++) {
        var x = (Math.random() - 0.5) * 400
        var y = (Math.random() - 0.5) * 400
        var z = (Math.random() - 0.5) * 400

        starPositions[i * 3] = x
        starPositions[i * 3 + 1] = y
        starPositions[i * 3 + 2] = z

        // Bokeh size variation
        starSizes[i] = Math.random() * 4 + 1

        // Mix colors
        var mixedColor = color1.clone().lerp(color2, Math.random())
        starColors[i * 3] = mixedColor.r
        starColors[i * 3 + 1] = mixedColor.g
        starColors[i * 3 + 2] = mixedColor.b
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1))
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3))

    // Create a soft circle texture for bokeh
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

    var starMaterial = new THREE.PointsMaterial({
        size: 2,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    })

    var stars = new THREE.Points(starGeometry, starMaterial)
    starGroup.add(stars)

    // --- MOUSE INTERACTION ---
    var mouse = new THREE.Vector2()
    var targetRotation = new THREE.Vector2()

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMouseMove, false)

    // --- RESIZE ---
    window.addEventListener('resize', onWindowResize, false)
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }

    // --- ANIMATION ---
    var clock = new THREE.Clock()

    function animate() {
        requestAnimationFrame(animate)

        var time = clock.getElapsedTime()

        // Smooth mouse follow
        targetRotation.x = mouse.y * 0.5
        targetRotation.y = mouse.x * 0.5

        asteroidGroup.rotation.x += (targetRotation.x - asteroidGroup.rotation.x) * 0.02
        asteroidGroup.rotation.y += (targetRotation.y - asteroidGroup.rotation.y) * 0.02

        starGroup.rotation.x += (targetRotation.x * 0.1 - starGroup.rotation.x) * 0.02
        starGroup.rotation.y += (targetRotation.y * 0.1 - starGroup.rotation.y) * 0.02

        // Animate individual asteroids
        asteroidGroup.children.forEach(function (asteroid) {
            asteroid.rotation.x += asteroid.userData.rotSpeed.x
            asteroid.rotation.y += asteroid.userData.rotSpeed.y
            asteroid.rotation.z += asteroid.userData.rotSpeed.z
        })

        // Rotate the whole asteroid field slowly
        asteroidGroup.rotation.z = time * 0.05

        // Move light
        pointLight.position.x = Math.sin(time * 0.5) * 30
        pointLight.position.z = Math.cos(time * 0.5) * 30

        renderer.render(scene, camera)
    }

    animate()

    // Force opacity to be visible, ignoring potentially low config value
    $('#canvas-asteroids').css('opacity', 1)
    $('body').append('<div class="bg-color" style="background-color:' + bgColor + '"></div>')
}
