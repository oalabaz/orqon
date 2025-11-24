function squareBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.id = 'canvas-square';
    document.getElementById('main').appendChild(renderer.domElement);

    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    var scene = new THREE.Scene();
    var bgColor = option_hero_background_square_bg || '#111111';
    scene.fog = new THREE.FogExp2(bgColor, 0.025);

    var ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(-10, 30, -10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    var pointLight = new THREE.PointLight(0x00aaff, 5, 60);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    var group = new THREE.Group();
    scene.add(group);

    // Voxel Grid
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.4,
        metalness: 0.8
    });

    var voxels = [];
    var gridSize = 16;
    var offset = (gridSize - 1) / 2;

    for (var x = 0; x < gridSize; x++) {
        for (var z = 0; z < gridSize; z++) {
            var voxel = new THREE.Mesh(geometry, material.clone());
            voxel.position.set(x - offset, 0, z - offset);
            voxel.castShadow = true;
            voxel.receiveShadow = true;
            group.add(voxel);
            voxels.push({ mesh: voxel, x: x, z: z });
        }
    }

    var clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        var time = clock.getElapsedTime();

        voxels.forEach(function (v) {
            var dist = Math.sqrt((v.x - gridSize / 2) ** 2 + (v.z - gridSize / 2) ** 2);
            var y = Math.sin(dist * 0.5 - time * 2) * 2;
            v.mesh.scale.y = Math.max(0.1, 3 + y);
            v.mesh.position.y = v.mesh.scale.y / 2;

            // Emissive glow for high bars
            if (y > 1) {
                v.mesh.material.emissive.setHex(0x00aaff);
                v.mesh.material.emissiveIntensity = (y - 1) * 0.5;
            } else {
                v.mesh.material.emissive.setHex(0x000000);
            }
        });

        renderer.render(scene, camera);
    }

    animate();

    $('#canvas-square').css('opacity', 1);
    $('body').append('<div class="bg-color" style="background-color:' + bgColor + '"></div>');
}
