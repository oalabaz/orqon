function squareBackground() {
    // Tesseract (Hypercube) Implementation
    // Replaces the old 3D square background with a 4D rotating tesseract projection

    var container = document.getElementById('main');

    // Cleanup existing canvas if any
    var existingCanvas = document.getElementById('canvas-square');
    if (existingCanvas) {
        existingCanvas.parentNode.removeChild(existingCanvas);
    }

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.id = 'canvas-square';
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    // Use a dark, premium background color
    var bgColor = (typeof option_hero_background_square_bg !== 'undefined') ? option_hero_background_square_bg : '#050505';

    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);

    // --- Tesseract Geometry ---
    // A hypercube has 16 vertices.
    // Coordinates are (+-1, +-1, +-1, +-1)

    var vertices4D = [];
    for (var i = 0; i < 16; i++) {
        var x = (i & 1) ? 1 : -1;
        var y = (i & 2) ? 1 : -1;
        var z = (i & 4) ? 1 : -1;
        var w = (i & 8) ? 1 : -1;
        vertices4D.push(new THREE.Vector4(x, y, z, w));
    }

    // Edges connect vertices that differ by exactly 1 coordinate
    var edges = [];
    for (var i = 0; i < 16; i++) {
        for (var j = i + 1; j < 16; j++) {
            var diff = 0;
            if (vertices4D[i].x !== vertices4D[j].x) diff++;
            if (vertices4D[i].y !== vertices4D[j].y) diff++;
            if (vertices4D[i].z !== vertices4D[j].z) diff++;
            if (vertices4D[i].w !== vertices4D[j].w) diff++;
            if (diff === 1) {
                edges.push([i, j]);
            }
        }
    }

    // Create a LineSegments geometry
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(edges.length * 2 * 3); // 2 points per edge, 3 coords per point
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var material = new THREE.LineBasicMaterial({ color: 0x00aaff, opacity: 0.5, transparent: true });
    var tesseractLines = new THREE.LineSegments(geometry, material);
    scene.add(tesseractLines);

    // Inner "core" to make it look more complex and premium
    var coreGeometry = new THREE.IcosahedronGeometry(0.8, 0);
    var coreMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff, wireframe: true, transparent: true, opacity: 0.2 });
    var core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Add some particles for depth
    var particlesGeometry = new THREE.BufferGeometry();
    var particleCount = 200;
    var pPositions = new Float32Array(particleCount * 3);
    for (var i = 0; i < particleCount * 3; i++) {
        pPositions[i] = (Math.random() - 0.5) * 20;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    var particlesMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.3 });
    var particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);


    // --- Animation State ---
    var angle = 0;

    function animate() {
        requestAnimationFrame(animate);

        angle += 0.005;

        // Rotation matrices in 4D
        // Rotate around ZW plane
        var c = Math.cos(angle);
        var s = Math.sin(angle);

        // Rotate around XY plane
        var c2 = Math.cos(angle * 0.5);
        var s2 = Math.sin(angle * 0.5);

        var projectedVertices = [];

        for (var i = 0; i < vertices4D.length; i++) {
            var v = vertices4D[i].clone();

            // Apply ZW rotation
            var z = v.z * c - v.w * s;
            var w = v.z * s + v.w * c;
            v.z = z;
            v.w = w;

            // Apply XY rotation
            var x = v.x * c2 - v.y * s2;
            var y = v.x * s2 + v.y * c2;
            v.x = x;
            v.y = y;

            // Perspective projection 4D -> 3D
            var distance = 3;
            var wFactor = 1 / (distance - v.w);

            // Scale factor
            var scale = 2.5;

            projectedVertices.push(new THREE.Vector3(
                v.x * wFactor * scale,
                v.y * wFactor * scale,
                v.z * wFactor * scale
            ));
        }

        // Update line positions
        var positions = tesseractLines.geometry.attributes.position.array;
        var idx = 0;
        for (var i = 0; i < edges.length; i++) {
            var v1 = projectedVertices[edges[i][0]];
            var v2 = projectedVertices[edges[i][1]];

            positions[idx++] = v1.x;
            positions[idx++] = v1.y;
            positions[idx++] = v1.z;

            positions[idx++] = v2.x;
            positions[idx++] = v2.y;
            positions[idx++] = v2.z;
        }
        tesseractLines.geometry.attributes.position.needsUpdate = true;

        // Rotate the entire object in 3D space as well for more dynamism
        tesseractLines.rotation.y += 0.002;
        tesseractLines.rotation.x += 0.001;

        core.rotation.y -= 0.005;
        core.rotation.z += 0.003;

        particles.rotation.y = angle * 0.1;

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

    $('#canvas-square').css('opacity', 1);
}
