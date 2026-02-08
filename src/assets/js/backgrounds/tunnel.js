function tunnelBackground() {
    // 3D Tunnel "Thingy" Implementation - Enhanced "Cyberpunk" Version
    // Creates a mesmerizing, infinite tunnel effect with neon aesthetics, glow, and interaction

    var container = document.getElementById('main');

    // Cleanup existing canvas if any
    var existingCanvas = document.getElementById('canvas-tunnel');
    if (existingCanvas) {
        existingCanvas.parentNode.removeChild(existingCanvas);
    }
    // Also remove other background canvases if they exist
    var otherCanvases = document.querySelectorAll('canvas[id^="canvas-"]');
    otherCanvases.forEach(function (canvas) {
        if (canvas.id !== 'canvas-tunnel') {
            canvas.parentNode.removeChild(canvas);
        }
    });

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.id = 'canvas-tunnel';
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();

    // Deep, dark fog for the tunnel end - darker and denser for more depth
    var fogColor = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(fogColor, 0.04);

    // Background color
    var bgColor = (typeof option_hero_background_tunnel_bg !== 'undefined') ? option_hero_background_tunnel_bg : '#000000';

    var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 0;

    // --- Tunnel Geometry ---
    var tunnelGroup = new THREE.Group();
    scene.add(tunnelGroup);

    var numRings = 80; // Increased rings for deeper tunnel
    var ringSpacing = 1.0;
    var rings = [];

    // Create an Octagon shape for a more sci-fi look
    var shape = new THREE.Shape();
    var r = 2.5; // Outer radius (slightly larger)

    function createOctagonPath(radius, path) {
        for (var i = 0; i < 8; i++) {
            var a = (i / 8) * Math.PI * 2 + (Math.PI / 8);
            var x = Math.cos(a) * radius;
            var y = Math.sin(a) * radius;
            if (i === 0) path.moveTo(x, y);
            else path.lineTo(x, y);
        }
        path.lineTo(Math.cos(Math.PI / 8) * radius, Math.sin(Math.PI / 8) * radius);
    }

    createOctagonPath(r, shape);

    // Create the hole (Inner octagon)
    var holePath = new THREE.Path();
    var rInner = 2.3; // Inner radius (thin ring)
    createOctagonPath(rInner, holePath);
    shape.holes.push(holePath);

    var extrudeSettings = {
        steps: 1,
        depth: 0.1, // Slightly thicker for presence
        bevelEnabled: false, // Disable bevel to keep edges clean and avoid extra geometry lines
        curveSegments: 1 // Low poly look
    };

    var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Material - Solid transparent fill (Glassy look) instead of wireframe
    // This removes the "X" cross in the middle caused by face triangulation
    var material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: false, // Disabled wireframe to remove internal lines
        transparent: true,
        opacity: 0.05, // Very subtle fill
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    });

    // Edge material for the neon outline
    var edgeMaterial = new THREE.LineBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.8, // Brighter edges
        blending: THREE.AdditiveBlending
    });

    for (var i = 0; i < numRings; i++) {
        var mesh = new THREE.Mesh(geometry, material);

        // Add edges - thresholdAngle ensures we only see the outline, not flat face diagonals
        var edges = new THREE.EdgesGeometry(geometry, 15);
        var line = new THREE.LineSegments(edges, edgeMaterial);
        mesh.add(line);

        mesh.position.z = -i * ringSpacing;
        // Alternate rotation for a "woven" look
        mesh.rotation.z = (i % 2 === 0) ? 0 : Math.PI / 8;

        tunnelGroup.add(mesh);
        rings.push(mesh);
    }

    // --- Particles (Stars/Debris) ---
    var particlesGeometry = new THREE.BufferGeometry(); // Fixed: Defined variable
    var particleCount = 800;
    var pPositions = new Float32Array(particleCount * 3);
    var pVelocities = [];

    for (var i = 0; i < particleCount; i++) {
        var px = (Math.random() - 0.5) * 15;
        var py = (Math.random() - 0.5) * 15;
        var pz = -Math.random() * 60;

        pPositions[i * 3] = px;
        pPositions[i * 3 + 1] = py;
        pPositions[i * 3 + 2] = pz;

        pVelocities.push({
            z: Math.random() * 0.1 + 0.05, // Slower particles
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02
        });
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    var particlesMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.03,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    var particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // --- Mouse Interaction ---
    var mouseX = 0;
    var mouseY = 0;
    var targetRotationX = 0;
    var targetRotationY = 0;

    document.addEventListener('mousemove', function (event) {
        mouseX = (event.clientX - window.innerWidth / 2) * 0.001;
        mouseY = (event.clientY - window.innerHeight / 2) * 0.001;
    });

    // --- Animation State ---
    var speed = 0.02; // Much slower
    var time = 0;

    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        // Smooth camera movement based on mouse
        targetRotationX += (mouseX - targetRotationX) * 0.05;
        targetRotationY += (mouseY - targetRotationY) * 0.05;

        camera.rotation.x = -targetRotationY;
        camera.rotation.y = -targetRotationX;

        // Add a subtle barrel roll to the camera
        camera.rotation.z = Math.sin(time * 0.2) * 0.05; // Reduced roll

        // Move rings
        for (var i = 0; i < rings.length; i++) {
            var ring = rings[i];
            ring.position.z += speed * 2;

            // Subtle individual ring rotation
            ring.rotation.z += (i % 2 === 0 ? 0.002 : -0.002);

            // Reset ring logic - infinite loop
            // When ring passes camera (z > 2), move it to the back
            // We subtract the total length to keep the spacing perfectly consistent
            if (ring.position.z > 2) {
                ring.position.z -= numRings * ringSpacing;
            }

            // Dynamic Opacity & Color
            var dist = Math.abs(ring.position.z);

            // 1. Fade out in the distance (fog effect)
            // Starts fading at 40, completely gone by 70
            var opacity = 1;
            if (dist > 40) {
                opacity = 1 - ((dist - 40) / 30);
            }

            // 2. Fade out as it approaches the camera (The "Widest Circle" effect)
            // Starts fading out at z = -3, completely invisible by z = 1
            if (ring.position.z > -3) {
                // Map range [-3, 1] to opacity [1, 0]
                var fadeOut = 1 - ((ring.position.z + 3) / 4);
                if (fadeOut < opacity) opacity = fadeOut;
            }

            if (opacity < 0) opacity = 0;

            // Pulse opacity
            var pulse = Math.sin(time * 2 + i * 0.2) * 0.2 + 0.8;

            ring.material.opacity = opacity * 0.15 * pulse;
            ring.children[0].material.opacity = opacity * 0.6 * pulse;

            // Cyberpunk Color Palette: Cyan <-> Magenta <-> Purple
            // Hue cycling
            var hue = (time * 0.05 + i * 0.01) % 1;
            // Constrain hue to cool colors (approx 0.5 to 0.9)
            var constrainedHue = 0.5 + (Math.sin(hue * Math.PI * 2) * 0.2 + 0.2);

            ring.material.color.setHSL(constrainedHue, 1, 0.5);
            ring.children[0].material.color.setHSL((constrainedHue + 0.1) % 1, 1, 0.6);
        }

        // Move particles
        var pPos = particles.geometry.attributes.position.array;
        for (var i = 0; i < particleCount; i++) {
            pPos[i * 3 + 2] += pVelocities[i].z;
            pPos[i * 3] += pVelocities[i].x; // Drift X
            pPos[i * 3 + 1] += pVelocities[i].y; // Drift Y

            // Reset particles
            if (pPos[i * 3 + 2] > 2) {
                pPos[i * 3 + 2] = -60;
                pPos[i * 3] = (Math.random() - 0.5) * 15;
                pPos[i * 3 + 1] = (Math.random() - 0.5) * 15;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    // --- Resize Handler ---
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Background color div
    if ($('.bg-color').length === 0) {
        $('body').append('<div class="bg-color" style="background-color:' + bgColor + '"></div>');
    } else {
        $('.bg-color').css('background-color', bgColor);
    }

    $('#canvas-tunnel').css('opacity', 1);
}
