function twistedBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.id = 'canvas-twisted'
    document.getElementById('main').appendChild(renderer.domElement)

    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 50

    var scene = new THREE.Scene()
    var bgColor = option_hero_background_twisted_bg_color || '#212121'
    scene.fog = new THREE.FogExp2(bgColor, 0.02)

    // Create a twisted torus knot
    // Radius, Tube, TubularSegments, RadialSegments, p, q
    var geometry = new THREE.TorusKnotGeometry(10, 3, 300, 20, 2, 3)

    // 1. Wireframe Mesh
    var materialWire = new THREE.MeshBasicMaterial({
        color: option_hero_background_twisted_line_color || '#ffffff',
        wireframe: true,
        transparent: true,
        opacity: 0.15
    })
    var mesh = new THREE.Mesh(geometry, materialWire)
    scene.add(mesh)

    // 2. Particles along the surface
    // We clone the position attribute to create points at the vertices
    var particleGeo = new THREE.BufferGeometry()
    var posAttribute = geometry.getAttribute('position')
    particleGeo.setAttribute('position', posAttribute)

    var materialPoints = new THREE.PointsMaterial({
        color: option_hero_background_twisted_fill_color || '#00aaff',
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    })
    var particles = new THREE.Points(particleGeo, materialPoints)
    scene.add(particles)

    // Mouse interaction
    var mouse = new THREE.Vector2()
    var targetRotation = new THREE.Vector2()

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMouseMove, false)

    window.addEventListener('resize', onWindowResize, false)
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }

    function animate() {
        requestAnimationFrame(animate)

        var time = performance.now() * 0.001
        var speed = option_hero_background_twisted_speed || 0.005

        // Smooth rotation based on mouse
        targetRotation.x = mouse.y * 0.5
        targetRotation.y = mouse.x * 0.5

        mesh.rotation.x += (targetRotation.x - mesh.rotation.x) * 0.05
        mesh.rotation.y += (targetRotation.y - mesh.rotation.y) * 0.05
        particles.rotation.x = mesh.rotation.x
        particles.rotation.y = mesh.rotation.y

        // Constant twist rotation
        mesh.rotation.z += speed
        particles.rotation.z += speed

        // Pulse effect
        var scale = 1 + Math.sin(time) * 0.05
        mesh.scale.set(scale, scale, scale)
        particles.scale.set(scale, scale, scale)

        renderer.render(scene, camera)
    }

    animate()

    // Use a slightly higher opacity for the 3D scene to be visible
    var opacity = option_hero_background_twisted_scene_opacity
    if (opacity < 0.2) opacity = 0.8 // Override if too low for 3D

    $('#canvas-twisted').css('opacity', opacity)
    $('body').append('<div class="bg-color" style="background-color:' + bgColor + '"></div>')
}
