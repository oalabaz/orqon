/******************************************************************



	------------------------
	-- TABLE OF CONTENTS --
	------------------------
	
	--  1. Init Background
	--  2. Color Background
	--  3. Square Background
	--  4. Asteroids Background
	--  5. Circle Background
	--  6. Lines Background
	--  7. Twisted Background
 
 
 ******************************************************************/

/** 1. BACKGROUND INIT
 *******************************************************************/

function init_backgrounds() {
	var error_msg = 'Error! No background is set or something went wrong'

	if (is_mobile_device == true && option_hero_background_mode_mobile != 'match') {
		option_hero_background_mode = option_hero_background_mode_mobile
	}

	function url_var_handling() {
		if (!$('.options-panel').length) return
		let searchParams = new URLSearchParams(window.location.search)
		if (searchParams.has('bg')) option_hero_background_mode = searchParams.get('bg')
	}
	url_var_handling()

	switch (option_hero_background_mode) {
		case 'color':
			colorBackground()
			break
		case 'square':
			squareBackground()
			break
		case 'twisted':
			twistedBackground()
			break
		case 'asteroids':
			asteroidsBackground()
			break
		case 'circle':
			circleBackground()
			break
		case 'network':
			networkBackground()
			break
		case 'knowledge':
			knowledgeBackground()
			break
		case 'knowledge_core':
			knowledgeCoreBackground()
			break
		default:
			asteroidsBackground()
			break
	}

	// Display current background name
	var bgDisplayName = option_hero_background_mode.replace(/_/g, ' ').toUpperCase();
	var $bubble = $('<div id="bg-selector-bubble" style="position: fixed; bottom: 30px; left: 30px; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: rgba(255, 255, 255, 0.9); padding: 8px 16px; border-radius: 30px; font-family: sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; z-index: 9999; pointer-events: auto; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: all 0.3s ease;" title="Click to change background">' + bgDisplayName + '</div>');

	$bubble.hover(
		function () { $(this).css({ 'background': 'rgba(255, 255, 255, 0.1)', 'transform': 'scale(1.05)' }); },
		function () { $(this).css({ 'background': 'rgba(0, 0, 0, 0.6)', 'transform': 'scale(1)' }); }
	);

	$bubble.on('click', function () {
		// Reload to pick a new random background
		location.reload();
	});

	$('body').append($bubble);
}
init_backgrounds()

/** 2. COLOR BACKGROUND
 *******************************************************************/

function colorBackground() {
	$('body').append('<div class="bg-color" style="background-color:' + option_hero_background_color_bg + '"></div>')
}

/** 3. SQUARE BACKGROUND
 *******************************************************************/

function squareBackground() {
	var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.domElement.id = 'canvas-square'
	document.getElementById('main').appendChild(renderer.domElement)

	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
	camera.position.z = 60

	var scene = new THREE.Scene()
	var bgColor = option_hero_background_square_bg || '#212121'
	scene.fog = new THREE.FogExp2(bgColor, 0.015)

	var group = new THREE.Group()
	scene.add(group)

	// Determine colors based on mode
	var mainColor = 0xffffff;
	if (typeof option_hero_background_square_mode !== 'undefined' && option_hero_background_square_mode === 'black') {
		mainColor = 0x111111;
	}

	// Geometry
	var geometry = new THREE.BoxGeometry(1, 1, 1)

	// Create Cubes
	var cubeCount = 300
	for (var i = 0; i < cubeCount; i++) {
		var isWireframe = Math.random() > 0.7
		var material = new THREE.MeshBasicMaterial({
			color: mainColor,
			transparent: true,
			opacity: Math.random() * 0.4 + 0.1,
			wireframe: isWireframe
		})

		var mesh = new THREE.Mesh(geometry, material)

		// Spread them out
		mesh.position.x = (Math.random() - 0.5) * 120
		mesh.position.y = (Math.random() - 0.5) * 120
		mesh.position.z = (Math.random() - 0.5) * 120

		// Random rotation
		mesh.rotation.x = Math.random() * 2 * Math.PI
		mesh.rotation.y = Math.random() * 2 * Math.PI

		// Random scale
		var scale = Math.random() * 3 + 0.5
		mesh.scale.set(scale, scale, scale)

		// Animation data
		mesh.userData = {
			velocity: new THREE.Vector3(
				(Math.random() - 0.5) * 0.02,
				(Math.random() - 0.5) * 0.02,
				(Math.random() - 0.5) * 0.02
			),
			rotSpeed: new THREE.Vector3(
				(Math.random() - 0.5) * 0.01,
				(Math.random() - 0.5) * 0.01,
				0
			)
		}

		group.add(mesh)
	}

	// Mouse interaction
	var mouse = new THREE.Vector2()
	var targetRotation = new THREE.Vector2()

	function onMouseMove(event) {
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
	}
	window.addEventListener('mousemove', onMouseMove, false)

	// Resize
	window.addEventListener('resize', onWindowResize, false)
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
	}

	// Animation
	function animate() {
		requestAnimationFrame(animate)

		// Smooth rotation based on mouse
		targetRotation.x = mouse.y * 0.3
		targetRotation.y = mouse.x * 0.3

		group.rotation.x += (targetRotation.x - group.rotation.x) * 0.03
		group.rotation.y += (targetRotation.y - group.rotation.y) * 0.03

		// Animate cubes
		group.children.forEach(function (cube) {
			cube.rotation.x += cube.userData.rotSpeed.x
			cube.rotation.y += cube.userData.rotSpeed.y

			cube.position.add(cube.userData.velocity)

			// Wrap around
			if (cube.position.x > 60) cube.position.x = -60
			if (cube.position.x < -60) cube.position.x = 60
			if (cube.position.y > 60) cube.position.y = -60
			if (cube.position.y < -60) cube.position.y = 60
			if (cube.position.z > 60) cube.position.z = -60
			if (cube.position.z < -60) cube.position.z = 60
		})

		renderer.render(scene, camera)
	}

	animate()

	$('#canvas-square').css('opacity', 1)
	$('body').append('<div class="bg-color" style="background-color:' + bgColor + '"></div>')
}

/** 4. ASTERIODS BACKGROUND
 *******************************************************************/

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

/** 5. CIRCLE BACKGROUND
 *******************************************************************/

function circleBackground() {
	var canvas = document.getElementById('main').appendChild(document.createElement('canvas'))
	var context = canvas.getContext('2d')

	var time = 0,
		velocity = 0.1,
		velocityTarget = option_hero_background_circle_speed,
		width,
		height,
		lastX,
		lastY

	var MAX_OFFSET = 400
	var SPACING = 6
	var POINTS = MAX_OFFSET / SPACING
	var PEAK = MAX_OFFSET * 0.25
	var POINTS_PER_LAP = 6
	var SHADOW_STRENGTH = 6

	canvas.setAttribute('id', 'canvas-circle')
	setup()

	$('#canvas-circle').css('opacity', option_hero_background_circle_scene_opacity)
	$('body').append('<div class="bg-color" style="background-color:' + option_hero_background_circle_bg_color + '"></div>')

	function setup() {
		resize()
		step()
		window.addEventListener('resize', resize)
	}

	function resize() {
		width = canvas.width = window.innerWidth
		height = canvas.height = window.innerHeight
	}

	function step() {
		time += velocity
		velocity += (velocityTarget - velocity) * 0.3

		clear()
		render()

		requestAnimationFrame(step)
	}

	function clear() {
		context.clearRect(0, 0, width, height)
	}

	function render() {
		var x,
			y,
			cx = width / 2,
			cy = height / 2

		context.globalCompositeOperation = 'lighter'
		context.strokeStyle = option_hero_background_circle_line_color
		context.shadowColor = option_hero_background_circle_line_color
		context.lineWidth = 2
		context.beginPath()

		for (var i = POINTS; i > 0; i--) {
			var value = i * SPACING + (time % SPACING)

			var ax = Math.sin(value / POINTS_PER_LAP) * Math.PI,
				ay = Math.cos(value / POINTS_PER_LAP) * Math.PI

				; (x = ax * value), (y = ay * value * 0.35)

			var o = 1 - Math.min(value, PEAK) / PEAK

			y -= Math.pow(o, 2) * 200
			y += (200 * value) / MAX_OFFSET
			y += (x / cx) * width * 0.1

			context.globalAlpha = 1 - value / MAX_OFFSET
			context.shadowBlur = SHADOW_STRENGTH * o

			context.lineTo(cx + x, cy + y)
			context.stroke()

			context.beginPath()
			context.moveTo(cx + x, cy + y)
		}

		context.lineTo(cx, cy - 200)
		context.lineTo(cx, 0)
		context.stroke()
	}
}

/** 6. LINES BACKGROUND
 *******************************************************************/

function linesBackground() {
	const canvas = document.getElementById('main').appendChild(document.createElement('canvas'))
	const context = canvas.getContext('2d')

	const lines = []

	var step = 0,
		width = 0,
		height = 0

	window.onresize = setup

	canvas.setAttribute('id', 'canvas-lines')

	setup()
	update()

	$('#canvas-lines').css({
		opacity: option_hero_background_lines_scene_opacity,
		transform: 'translate(-50%, -50%) rotate(45deg)',
		left: '50%',
		top: '50%',
	})
	$('body').append('<div class="bg-color" style="background-color:' + option_hero_background_lines_bg_color + '"></div>')

	function setup() {
		width = height = Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2))

		lines.length = 0

		let lineCount = height / 26
		let pointCount = 14
		let spacingH = width / pointCount
		let spacingV = height / lineCount

		for (let v = 0; v < lineCount; v++) {
			let line = { points: [], ran: 0.2 + Math.random() * 0.7 }

			for (let h = 0; h < pointCount; h++) {
				line.points.push({
					nx: h * spacingH,
					ny: v * spacingV,
				})
			}

			line.points.push({
				nx: width + spacingH,
				ny: v * spacingV,
			})

			lines.push(line)
		}
	}

	function update() {
		step += 0.8

		canvas.width = width
		canvas.height = height

		context.clearRect(0, 0, width, height)

		context.lineWidth = 2
		context.strokeStyle = option_hero_background_lines_line_color
		context.fillStyle = option_hero_background_lines_bg_color

		lines.forEach(function (line, v) {
			context.beginPath()

			line.points.forEach(function (point, h) {
				; (point.x = point.nx), (point.y = point.ny + Math.sin((point.x * line.ran + (step + point.ny)) / 40) * (6 + (point.ny / height) * 34))
			})

			line.points.forEach(function (point, h) {
				var nextPoint = line.points[h + 1]

				if (h === 0) {
					context.moveTo(point.x, point.y)
				} else if (nextPoint) {
					var cpx = point.x + (nextPoint.x - point.x) / 2
					var cpy = point.y + (nextPoint.y - point.y) / 2
					context.quadraticCurveTo(point.x, point.y, cpx, cpy)
				}
			})

			context.stroke()
			context.lineTo(width, height)
			context.lineTo(0, height)
			context.closePath()
			context.fill()
		})

		requestAnimationFrame(update)
	}
}

/** 7. TWISTED BACKGROUND
 *******************************************************************/

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

/** 8. NETWORK BACKGROUND
 *******************************************************************/

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

/** 9. KNOWLEDGE BACKGROUND (FLOW FIELD)
 *******************************************************************/

function knowledgeBackground() {
	var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.domElement.id = 'canvas-knowledge'

	document.getElementById('main').appendChild(renderer.domElement)

	var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)
	camera.position.z = 500

	var scene = new THREE.Scene()

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

	// Custom Shader Material for better performance and look
	var material = new THREE.PointsMaterial({
		size: 2,
		vertexColors: true,
		transparent: true,
		opacity: 0.8,
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

/** 10. KNOWLEDGE CORE BACKGROUND (LIVING SPHERE)
 *******************************************************************/

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
