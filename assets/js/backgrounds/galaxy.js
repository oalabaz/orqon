function galaxyBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = 'canvas-galaxy';
    document.getElementById('main').appendChild(renderer.domElement);

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 150;
    camera.position.y = 20;
    camera.lookAt(0, 0, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    // --- GALAXY PARAMETERS ---
    var parameters = {
        count: 50000,
        size: 0.05,
        radius: 40,
        branches: 3,
        spin: 1,
        randomness: 0.2,
        randomnessPower: 3,
        insideColor: '#ff6030',
        outsideColor: '#1b3984'
    };

    var geometry = null;
    var material = null;
    var points = null;

    function generateGalaxy() {
        if (points !== null) {
            geometry.dispose();
            material.dispose();
            scene.remove(points);
        }

        geometry = new THREE.BufferGeometry();
        var positions = new Float32Array(parameters.count * 3);
        var colors = new Float32Array(parameters.count * 3);

        var colorInside = new THREE.Color(parameters.insideColor);
        var colorOutside = new THREE.Color(parameters.outsideColor);

        for (var i = 0; i < parameters.count; i++) {
            var i3 = i * 3;

            // Position
            var radius = Math.random() * parameters.radius;
            var spinAngle = radius * parameters.spin;
            var branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;

            var randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
            var randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
            var randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

            positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            // Color
            var mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, radius / parameters.radius);

            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Create a soft circle texture for particles
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

        material = new THREE.PointsMaterial({
            size: parameters.size,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            map: texture,
            transparent: true
        });

        points = new THREE.Points(geometry, material);
        scene.add(points);
    }

    generateGalaxy();

    // --- STARS BACKGROUND ---
    var starGeometry = new THREE.BufferGeometry();
    var starCount = 2000;
    var starPositions = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 300;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 300;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 300;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    var starMaterial = new THREE.PointsMaterial({
        size: 0.2,
        color: 0xffffff,
        transparent: true,
        opacity: 0.5
    });
    var stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);


    // --- MOUSE INTERACTION ---
    var mouse = new THREE.Vector2();
    var targetRotation = new THREE.Vector2();

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener('mousemove', onMouseMove, false);

    // --- RESIZE ---
    window.addEventListener('resize', onWindowResize, false);
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // --- ANIMATION ---
    var clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        var elapsedTime = clock.getElapsedTime();

        // Rotate galaxy
        points.rotation.y = elapsedTime * 0.05;
        stars.rotation.y = elapsedTime * 0.01;

        // Mouse interaction
        targetRotation.x = mouse.y * 0.2;
        targetRotation.y = mouse.x * 0.2;

        scene.rotation.x += (targetRotation.x - scene.rotation.x) * 0.05;
        scene.rotation.y += (targetRotation.y - scene.rotation.y) * 0.05;

        renderer.render(scene, camera);
    }

    animate();

    $('#canvas-galaxy').css('opacity', 1);
    $('body').append('<div class="bg-color" style="background-color:#000000"></div>');
}
