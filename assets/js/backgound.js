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
		case 'lines':
			linesBackground()
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
			alert(error_msg)
			console.log(error_msg)
			break
	}
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
	$('body').append('<div class="bg-color" style="background-color:' + option_hero_background_square_bg + '"></div>')
	$('#main').append(
		'<ul class="bg-bubbles ' + option_hero_background_square_mode + '"><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>'
	)
}

/** 4. ASTERIODS BACKGROUND
 *******************************************************************/

function asteroidsBackground() {
	var renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.shadowMap.enabled = false
	renderer.shadowMap.type = THREE.PCFSoftShadowMap
	renderer.shadowMap.needsUpdate = true
	renderer.domElement.id = 'canvas-asteroids'

	document.getElementById('main').appendChild(renderer.domElement)
	window.addEventListener('resize', onWindowResize, false)

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
	}

	var camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 500)
	var scene = new THREE.Scene()
	var cameraRange = 3

	scene.fog = new THREE.Fog(option_hero_background_asteroids_bg_color, 2.5, 3.5)

	//-------------------------------------------------------------- SCENE

	var sceneGruop = new THREE.Object3D()
	var particularGruop = new THREE.Object3D()
	var modularGruop = new THREE.Object3D()

	function generateParticle(num) {
		var amp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2

		var gmaterial = new THREE.MeshStandardMaterial({
			color: option_hero_background_asteroids_particle_color,
			side: THREE.DoubleSide,
		})

		var gparticular = new THREE.CircleGeometry(0.2, 5)

		for (var i = 1; i < num; i++) {
			var pscale = 0.001 + Math.abs(mathRandom(0.03))
			var particular = new THREE.Mesh(gparticular, gmaterial)
			particular.position.set(mathRandom(amp), mathRandom(amp), mathRandom(amp))
			particular.rotation.set(mathRandom(), mathRandom(), mathRandom())
			particular.scale.set(pscale, pscale, pscale)
			particular.speedValue = mathRandom(1)
			particularGruop.add(particular)
		}
	}
	generateParticle(200, 2)

	sceneGruop.add(particularGruop)
	scene.add(modularGruop)
	scene.add(sceneGruop)

	function mathRandom() {
		var num = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1
		var setNumber = -Math.random() * num + Math.random() * num

		return setNumber
	}

	//------------------------------------------------------------- INIT

	function init() {
		for (var i = 0; i < 30; i++) {
			var geometry = new THREE.IcosahedronGeometry(1)
			var material = new THREE.MeshStandardMaterial({
				flatShading: THREE.FlatShading,
				color: option_hero_background_asteroids_cube_color,
				transparent: false,
				opacity: 1,
				wireframe: false,
			})
			var cube = new THREE.Mesh(geometry, material)
			cube.speedRotation = Math.random() * 0.1
			cube.positionX = mathRandom()
			cube.positionY = mathRandom()
			cube.positionZ = mathRandom()
			cube.castShadow = true
			cube.receiveShadow = true

			var newScaleValue = mathRandom(0.3)

			cube.scale.set(newScaleValue, newScaleValue, newScaleValue)

			cube.rotation.x = mathRandom((180 * Math.PI) / 180)
			cube.rotation.y = mathRandom((180 * Math.PI) / 180)
			cube.rotation.z = mathRandom((180 * Math.PI) / 180)

			cube.position.set(cube.positionX, cube.positionY, cube.positionZ)
			modularGruop.add(cube)
		}
	}

	//------------------------------------------------------------- CAMERA

	camera.position.set(0, 0, cameraRange)

	//------------------------------------------------------------- SCENE

	var light = new THREE.SpotLight(option_hero_background_asteroids_spotlight_color, option_hero_background_asteroids_spotlight_intensity)
	light.position.set(5, 5, 2)
	light.castShadow = true
	light.shadow.mapSize.width = 10000
	light.shadow.mapSize.height = light.shadow.mapSize.width
	light.penumbra = 0.5

	var lightBack = new THREE.PointLight(option_hero_background_asteroids_pointlight_color, option_hero_background_asteroids_pointlight_intensity)
	lightBack.position.set(0, -3, -1)

	var rectLight = new THREE.RectAreaLight(option_hero_background_asteroids_rectarealight_color, option_hero_background_asteroids_rectarealight_intensity, 2, 2)
	rectLight.position.set(0, 0, 1)
	rectLight.lookAt(0, 0, 0)

	scene.add(light)
	scene.add(lightBack)
	scene.add(rectLight)

	//------------------------------------------------------------- MOUSE

	var mouse = new THREE.Vector2()

	function onMouseMove(event) {
		event.preventDefault()
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
	}
	window.addEventListener('mousemove', onMouseMove, false)

	//------------------------------------------------------------- ANIMATING

	var uSpeed = 0.01

	function animate() {
		var time = performance.now() * 0.0003
		requestAnimationFrame(animate)

		for (var i = 0, l = particularGruop.children.length; i < l; i++) {
			var newObject = particularGruop.children[i]
			newObject.rotation.x += newObject.speedValue / 10
			newObject.rotation.y += newObject.speedValue / 10
			newObject.rotation.z += newObject.speedValue / 10
		}

		for (var i = 0, l = modularGruop.children.length; i < l; i++) {
			var newCubes = modularGruop.children[i]
			newCubes.rotation.x += 0.008
			newCubes.rotation.y += 0.005
			newCubes.rotation.z += 0.003

			newCubes.position.x = Math.sin(time * newCubes.positionZ) * newCubes.positionY
			newCubes.position.y = Math.cos(time * newCubes.positionX) * newCubes.positionZ
			newCubes.position.z = Math.sin(time * newCubes.positionY) * newCubes.positionX
		}

		particularGruop.rotation.y += 0.005
		modularGruop.rotation.y -= (mouse.x * 4 + modularGruop.rotation.y) * uSpeed
		modularGruop.rotation.x -= (-mouse.y * 4 + modularGruop.rotation.x) * uSpeed
		camera.lookAt(scene.position)
		renderer.render(scene, camera)
	}

	animate()
	init()

	$('#canvas-asteroids').css('opacity', option_hero_background_asteroids_scene_opacity)
	$('body').append('<div class="bg-color" style="background-color:' + option_hero_background_asteroids_bg_color + '"></div>')
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
	var canvas = document.getElementById('main').appendChild(document.createElement('canvas')),
		context = canvas.getContext('2d'),
		width = window.innerWidth,
		height = window.innerHeight,
		radius = Math.min(window.innerWidth, window.innerHeight) * 1,
		// Number of layers
		quality = radius > 300 ? 180 : 90,
		// Layer instances
		layers = [],
		// Width/height of layers
		layerSize = radius * 0.3,
		// Layers that overlap to create the infinity illusion
		layerOverlap = Math.round(quality * 0.1)

	canvas.setAttribute('id', 'canvas-twisted')

	$('#canvas-twisted').css('opacity', option_hero_background_twisted_scene_opacity)
	$('#canvas-twisted').css('transform', 'translateX(' + option_hero_background_twisted_x_offset + ')')
	$('body').append('<div class="bg-color" style="background-color:' + option_hero_background_twisted_bg_color + '"></div>')

	function initialize() {
		resize()
		update()
	}

	function resize() {
		width = window.innerWidth
		height = window.innerHeight

		canvas.width = width
		canvas.height = height

		radius = Math.min(window.innerWidth, window.innerHeight) * 1
		layerSize = radius * 0.3

		layerOverlap = Math.round(quality * 0.1)

		layers = []

		for (var i = 0; i < quality; i++) {
			layers.push({
				x: window.innerWidth / 1 + Math.sin((i / quality) * 2 * Math.PI) * (radius - layerSize),
				y: window.innerHeight / 2 + Math.cos((i / quality) * 2 * Math.PI) * (radius - layerSize),
				r: (i / quality) * Math.PI,
			})
		}
	}
	window.addEventListener('resize', resize)

	function update() {
		requestAnimationFrame(update)

		step()
		clear()
		paint()
	}

	// Takes a step in the simulation
	function step() {
		for (var i = 0, len = layers.length; i < len; i++) {
			layers[i].r += option_hero_background_twisted_speed
		}
	}

	// Clears the painting
	function clear() {
		context.clearRect(0, 0, canvas.width, canvas.height)
	}

	// Paints the current state
	function paint() {
		// Number of layers in total
		var layersLength = layers.length

		// Draw the overlap layers
		for (var i = layersLength - layerOverlap, len = layersLength; i < len; i++) {
			context.save()
			context.globalCompositeOperation = 'destination-over'
			paintLayer(layers[i])
			context.restore()
		}

		// Cut out the overflow layers using the first layer as a mask
		context.save()
		context.globalCompositeOperation = 'destination-in'
		paintLayer(layers[0], true)
		context.restore()

		// // Draw the normal layers underneath the overlap
		for (var i = 0, len = layersLength; i < len; i++) {
			context.save()
			context.globalCompositeOperation = 'destination-over'
			paintLayer(layers[i])
			context.restore()
		}
	}

	// Pains one layer
	function paintLayer(layer, mask) {
		size = layerSize + (mask ? 10 : 0)
		size2 = size / 2

		context.translate(layer.x, layer.y)
		context.rotate(layer.r)

		// No stroke if this is a mask
		if (!mask) {
			context.strokeStyle = option_hero_background_twisted_line_color
			context.lineWidth = 1
			context.strokeRect(-size2, -size2, size, size)
		}

		context.fillStyle = option_hero_background_twisted_fill_color
		context.fillRect(-size2, -size2, size, size)
	}

	/* Polyfill */
	; (function () {
		var lastTime = 0
		var vendors = ['ms', 'moz', 'webkit', 'o']
		for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame']
			window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame']
		}

		if (!window.requestAnimationFrame)
			window.requestAnimationFrame = function (callback, element) {
				var currTime = new Date().getTime()
				var timeToCall = Math.max(0, 16 - (currTime - lastTime))
				var id = window.setTimeout(function () {
					callback(currTime + timeToCall)
				}, timeToCall)
				lastTime = currTime + timeToCall
				return id
			}

		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = function (id) {
				clearTimeout(id)
			}
	})()

	initialize()
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
