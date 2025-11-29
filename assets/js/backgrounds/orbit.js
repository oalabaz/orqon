function orbitBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.id = 'canvas-orbit';
    document.getElementById('main').appendChild(renderer.domElement);

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.z = 350;
    camera.position.y = 200;
    camera.position.x = 100;
    camera.lookAt(0, 0, 0);

    var scene = new THREE.Scene();

    // --- SCALE PARAMETERS ---
    var AU_TO_PIXELS = 45;
    var SUN_MASS = 1.989e30;
    var JUPITER_MASS = 1.898e27;
    
    // --- 3I/ATLAS Post-Perihelion - Heading to Jupiter's Hill Radius ---
    var cometData = {
        name: '3I/ATLAS',
        perihelionDate: new Date('2025-10-29T11:44:00Z'),
        perihelionDistance: 1.3564,
        vInfinity: 58,
        color: 0x00ffff,
        tailColor: 0x44ddff
    };
    
    // Jupiter data
    var jupiterData = {
        semiMajorAxis: 5.2,
        mass: JUPITER_MASS,
        color: 0xffaa44,
        currentAngle: Math.PI * 0.3
    };

    // Calculate Jupiter's Hill Radius
    var jupiterHillRadius = jupiterData.semiMajorAxis * Math.pow(JUPITER_MASS / (3 * SUN_MASS), 1/3);
    var jupiterHillRadiusPixels = jupiterHillRadius * AU_TO_PIXELS;

    // Animation progress (0 = perihelion, 1 = at Jupiter Hill radius)
    var animationProgress = 0;
    var animationSpeed = 0.0008;
    var totalJourneyDays = 180;

    // --- ENHANCED STARFIELD ---
    function createStarfield() {
        var starGeometry = new THREE.BufferGeometry();
        var starCount = 8000;
        var positions = new Float32Array(starCount * 3);
        var colors = new Float32Array(starCount * 3);
        
        for (var i = 0; i < starCount; i++) {
            var radius = 1500 + Math.random() * 4000;
            var theta = Math.random() * Math.PI * 2;
            var phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            var colorChoice = Math.random();
            if (colorChoice < 0.7) {
                colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
            } else if (colorChoice < 0.85) {
                colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1;
            } else {
                colors[i * 3] = 1; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.8;
            }
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        var starMaterial = new THREE.PointsMaterial({
            size: 1.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });
        
        return new THREE.Points(starGeometry, starMaterial);
    }
    scene.add(createStarfield());

    // --- MILKY WAY BAND ---
    function createMilkyWay() {
        var geometry = new THREE.BufferGeometry();
        var count = 15000;
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var radius = 2000 + Math.random() * 2500;
            var thickness = (Math.random() - 0.5) * 300;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = thickness + (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            var brightness = 0.3 + Math.random() * 0.4;
            colors[i * 3] = brightness * 0.9;
            colors[i * 3 + 1] = brightness * 0.85;
            colors[i * 3 + 2] = brightness;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        var material = new THREE.PointsMaterial({
            size: 0.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.4
        });
        
        var milkyWay = new THREE.Points(geometry, material);
        milkyWay.rotation.x = Math.PI * 0.15;
        milkyWay.rotation.z = Math.PI * 0.1;
        return milkyWay;
    }
    scene.add(createMilkyWay());

    // --- GLOWING SUN ---
    var sunGroup = new THREE.Group();
    
    var sunGeometry = new THREE.SphereGeometry(10, 64, 64);
    var sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffee00 });
    var sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sunMesh);
    
    // Sun corona layers
    for (var i = 1; i <= 4; i++) {
        var glowGeometry = new THREE.SphereGeometry(10 + i * 4, 32, 32);
        var glowMaterial = new THREE.MeshBasicMaterial({
            color: i < 3 ? 0xffaa00 : 0xff6600,
            transparent: true,
            opacity: 0.15 / i,
            side: THREE.BackSide
        });
        sunGroup.add(new THREE.Mesh(glowGeometry, glowMaterial));
    }
    
    // Sun light rays
    var rayCount = 12;
    for (var i = 0; i < rayCount; i++) {
        var rayGeometry = new THREE.PlaneGeometry(3, 60);
        var rayMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        var ray = new THREE.Mesh(rayGeometry, rayMaterial);
        ray.rotation.z = (i / rayCount) * Math.PI * 2;
        ray.position.z = 0;
        sunGroup.add(ray);
    }
    scene.add(sunGroup);

    // --- PLANETARY ORBITS with gradient effect ---
    function createGlowingOrbit(radius, color, glowColor) {
        var group = new THREE.Group();
        var segments = 256;
        
        var points = [];
        for (var i = 0; i <= segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
        var curve = new THREE.CatmullRomCurve3(points, true);
        var geometry = new THREE.TubeGeometry(curve, segments, 0.3, 8, true);
        var material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6
        });
        group.add(new THREE.Mesh(geometry, material));
        
        var glowGeometry = new THREE.TubeGeometry(curve, segments, 1.5, 8, true);
        var glowMaterial = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.1
        });
        group.add(new THREE.Mesh(glowGeometry, glowMaterial));
        
        return group;
    }

    scene.add(createGlowingOrbit(1 * AU_TO_PIXELS, 0x4488ff, 0x2266cc));
    scene.add(createGlowingOrbit(1.52 * AU_TO_PIXELS, 0xff6644, 0xcc4422));
    scene.add(createGlowingOrbit(5.2 * AU_TO_PIXELS, 0xffaa44, 0xcc8822));

    // --- EARTH ---
    var earthGeometry = new THREE.SphereGeometry(3, 32, 32);
    var earthMaterial = new THREE.MeshBasicMaterial({ color: 0x4488ff });
    var earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    var earthAngle = Math.PI * 1.2;
    earthMesh.position.set(Math.cos(earthAngle) * AU_TO_PIXELS, 0, Math.sin(earthAngle) * AU_TO_PIXELS);
    scene.add(earthMesh);

    // --- MARS ---
    var marsGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    var marsMaterial = new THREE.MeshBasicMaterial({ color: 0xff6644 });
    var marsMesh = new THREE.Mesh(marsGeometry, marsMaterial);
    var marsAngle = Math.PI * 0.8;
    marsMesh.position.set(Math.cos(marsAngle) * 1.52 * AU_TO_PIXELS, 0, Math.sin(marsAngle) * 1.52 * AU_TO_PIXELS);
    scene.add(marsMesh);

    // --- JUPITER with atmosphere bands ---
    var jupiterGroup = new THREE.Group();
    
    var jupiterGeometry = new THREE.SphereGeometry(8, 64, 64);
    var jupiterMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa44 });
    var jupiterMesh = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
    jupiterGroup.add(jupiterMesh);
    
    for (var i = 0; i < 5; i++) {
        var bandGeometry = new THREE.TorusGeometry(8.2, 0.3, 8, 64);
        var bandMaterial = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0xdd8833 : 0xeebb66,
            transparent: true,
            opacity: 0.6
        });
        var band = new THREE.Mesh(bandGeometry, bandMaterial);
        band.rotation.x = Math.PI / 2;
        band.position.y = -4 + i * 2;
        band.scale.set(1, 1, 0.3);
        jupiterGroup.add(band);
    }
    
    var spotGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    var spotMaterial = new THREE.MeshBasicMaterial({ color: 0xcc4422 });
    var spotMesh = new THREE.Mesh(spotGeometry, spotMaterial);
    spotMesh.position.set(7.5, -1, 2);
    spotMesh.scale.set(1.5, 1, 0.3);
    jupiterGroup.add(spotMesh);
    
    jupiterGroup.position.set(
        Math.cos(jupiterData.currentAngle) * 5.2 * AU_TO_PIXELS,
        0,
        Math.sin(jupiterData.currentAngle) * 5.2 * AU_TO_PIXELS
    );
    scene.add(jupiterGroup);

    // --- JUPITER'S HILL RADIUS SPHERE ---
    var hillGroup = new THREE.Group();
    
    var hillGlowGeometry = new THREE.SphereGeometry(jupiterHillRadiusPixels * 1.1, 64, 32);
    var hillGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.03,
        side: THREE.BackSide
    });
    hillGroup.add(new THREE.Mesh(hillGlowGeometry, hillGlowMaterial));
    
    var hillWireGeometry = new THREE.SphereGeometry(jupiterHillRadiusPixels, 32, 16);
    var hillWireMaterial = new THREE.MeshBasicMaterial({
        color: 0xff44ff,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });
    hillGroup.add(new THREE.Mesh(hillWireGeometry, hillWireMaterial));
    
    var hillRingGeometry = new THREE.TorusGeometry(jupiterHillRadiusPixels, 0.5, 8, 128);
    var hillRingMaterial = new THREE.MeshBasicMaterial({
        color: 0xff66ff,
        transparent: true,
        opacity: 0.7
    });
    var hillRing = new THREE.Mesh(hillRingGeometry, hillRingMaterial);
    hillRing.rotation.x = Math.PI / 2;
    hillGroup.add(hillRing);
    
    for (var i = 0; i < 3; i++) {
        var vRing = new THREE.Mesh(hillRingGeometry.clone(), hillRingMaterial.clone());
        vRing.material.opacity = 0.3;
        vRing.rotation.y = (i / 3) * Math.PI;
        hillGroup.add(vRing);
    }
    
    jupiterGroup.add(hillGroup);

    // --- COMET with particle tail ---
    var cometGroup = new THREE.Group();
    
    var nucleusGeometry = new THREE.SphereGeometry(3, 32, 32);
    var nucleusMaterial = new THREE.MeshBasicMaterial({ color: 0x88ddff });
    var nucleusMesh = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    cometGroup.add(nucleusMesh);
    
    var comaGeometry = new THREE.SphereGeometry(6, 32, 32);
    var comaMaterial = new THREE.MeshBasicMaterial({
        color: 0x44ffff,
        transparent: true,
        opacity: 0.4
    });
    var comaMesh = new THREE.Mesh(comaGeometry, comaMaterial);
    cometGroup.add(comaMesh);
    
    var outerComaGeometry = new THREE.SphereGeometry(10, 32, 32);
    var outerComaMaterial = new THREE.MeshBasicMaterial({
        color: 0x22aaff,
        transparent: true,
        opacity: 0.15
    });
    cometGroup.add(new THREE.Mesh(outerComaGeometry, outerComaMaterial));
    
    scene.add(cometGroup);

    // --- COMET DUST TAIL ---
    var tailParticleCount = 2000;
    var tailGeometry = new THREE.BufferGeometry();
    var tailPositions = new Float32Array(tailParticleCount * 3);
    var tailColors = new Float32Array(tailParticleCount * 3);
    var tailSizes = new Float32Array(tailParticleCount);
    
    tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeometry.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
    tailGeometry.setAttribute('size', new THREE.BufferAttribute(tailSizes, 1));
    
    var tailMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    var tailParticles = new THREE.Points(tailGeometry, tailMaterial);
    scene.add(tailParticles);

    // --- ION TAIL ---
    var ionTailGeometry = new THREE.BufferGeometry();
    var ionTailMaterial = new THREE.LineBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.6
    });
    var ionTail = new THREE.Line(ionTailGeometry, ionTailMaterial);
    scene.add(ionTail);

    // --- TRAJECTORY PATH ---
    var trajectoryGroup = new THREE.Group();
    
    var perihelionPos = new THREE.Vector3(cometData.perihelionDistance * AU_TO_PIXELS, 0, 0);
    var jupiterPos = jupiterGroup.position.clone();
    var hillEdgePos = jupiterPos.clone().sub(jupiterPos.clone().normalize().multiplyScalar(jupiterHillRadiusPixels * 0.9));
    
    var controlPoint1 = new THREE.Vector3(
        perihelionPos.x + 50,
        40,
        perihelionPos.z + 80
    );
    var controlPoint2 = new THREE.Vector3(
        (perihelionPos.x + hillEdgePos.x) / 2,
        30,
        (perihelionPos.z + hillEdgePos.z) / 2 + 60
    );
    
    var trajectoryCurve = new THREE.CatmullRomCurve3([
        perihelionPos,
        controlPoint1,
        controlPoint2,
        hillEdgePos
    ]);
    
    var trajectoryTubeGeometry = new THREE.TubeGeometry(trajectoryCurve, 200, 0.8, 8, false);
    var trajectoryTubeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7
    });
    trajectoryGroup.add(new THREE.Mesh(trajectoryTubeGeometry, trajectoryTubeMaterial));
    
    var trajectoryGlowGeometry = new THREE.TubeGeometry(trajectoryCurve, 200, 2, 8, false);
    var trajectoryGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        transparent: true,
        opacity: 0.2
    });
    trajectoryGroup.add(new THREE.Mesh(trajectoryGlowGeometry, trajectoryGlowMaterial));
    
    var perihelionMarkerGeometry = new THREE.SphereGeometry(2, 16, 16);
    var perihelionMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    var perihelionMarker = new THREE.Mesh(perihelionMarkerGeometry, perihelionMarkerMaterial);
    perihelionMarker.position.copy(perihelionPos);
    trajectoryGroup.add(perihelionMarker);
    
    var targetMarkerGeometry = new THREE.TorusGeometry(4, 0.5, 8, 32);
    var targetMarkerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.8
    });
    var targetMarker = new THREE.Mesh(targetMarkerGeometry, targetMarkerMaterial);
    targetMarker.position.copy(hillEdgePos);
    targetMarker.lookAt(jupiterGroup.position);
    trajectoryGroup.add(targetMarker);
    
    scene.add(trajectoryGroup);

    // --- INFO HUD ---
    var infoDiv = document.createElement('div');
    infoDiv.id = 'orbit-info';
    infoDiv.style.cssText = 'position:absolute;top:20px;left:20px;color:#00ffff;font-family:Courier New,monospace;font-size:12px;pointer-events:none;text-shadow:0 0 15px rgba(0,255,255,0.9),0 0 30px rgba(0,255,255,0.5);line-height:1.6;z-index:100;max-width:340px;background:linear-gradient(135deg,rgba(0,10,30,0.85) 0%,rgba(0,5,20,0.9) 100%);padding:18px;border-radius:12px;border:1px solid rgba(0,255,255,0.4);box-shadow:0 0 30px rgba(0,255,255,0.2),inset 0 0 20px rgba(0,255,255,0.05);';
    document.body.appendChild(infoDiv);

    // --- MOUSE INTERACTION ---
    var mouse = new THREE.Vector2();
    var targetRotation = new THREE.Vector2();
    
    window.addEventListener('mousemove', function(e) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // --- RESIZE ---
    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- ANIMATION ---
    var clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        var time = clock.getElapsedTime();

        animationProgress += animationSpeed;
        if (animationProgress > 1) animationProgress = 0;
        
        var cometPos = trajectoryCurve.getPoint(animationProgress);
        cometGroup.position.copy(cometPos);
        
        var distFromSun = cometPos.length() / AU_TO_PIXELS;
        var distToJupiter = cometPos.distanceTo(jupiterGroup.position) / AU_TO_PIXELS;
        var distToHillEdge = cometPos.distanceTo(hillEdgePos) / AU_TO_PIXELS;
        
        var sunDir = cometPos.clone().normalize();
        var tailLength = Math.max(30, 120 / Math.max(0.5, distFromSun));
        
        var positions = tailParticles.geometry.attributes.position.array;
        var colors = tailParticles.geometry.attributes.color.array;
        var sizes = tailParticles.geometry.attributes.size.array;
        
        for (var i = 0; i < tailParticleCount; i++) {
            var t = i / tailParticleCount;
            var spread = t * 20;
            var length = t * tailLength;
            
            positions[i * 3] = cometPos.x + sunDir.x * length + (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = cometPos.y + sunDir.y * length + (Math.random() - 0.5) * spread * 0.5;
            positions[i * 3 + 2] = cometPos.z + sunDir.z * length + (Math.random() - 0.5) * spread;
            
            var fade = 1 - t;
            colors[i * 3] = 0.5 + fade * 0.5;
            colors[i * 3 + 1] = 0.8 + fade * 0.2;
            colors[i * 3 + 2] = 1;
            
            sizes[i] = (1 - t * 0.7) * 3;
        }
        tailParticles.geometry.attributes.position.needsUpdate = true;
        tailParticles.geometry.attributes.color.needsUpdate = true;
        tailParticles.geometry.attributes.size.needsUpdate = true;

        var ionPoints = [];
        var ionLength = tailLength * 1.5;
        for (var i = 0; i <= 20; i++) {
            var t = i / 20;
            ionPoints.push(
                cometPos.x + sunDir.x * t * ionLength,
                cometPos.y + sunDir.y * t * ionLength,
                cometPos.z + sunDir.z * t * ionLength
            );
        }
        ionTailGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ionPoints), 3));

        comaMesh.scale.setScalar(1 + Math.sin(time * 3) * 0.15);
        
        sunGroup.children.forEach(function(child, i) {
            if (i > 5) {
                child.rotation.z += 0.001;
                child.material.opacity = 0.08 + Math.sin(time * 2 + i) * 0.04;
            }
        });

        jupiterGroup.rotation.y += 0.002;
        
        hillGroup.children[0].material.opacity = 0.02 + Math.sin(time * 1.5) * 0.015;
        hillGroup.children[1].material.opacity = 0.12 + Math.sin(time * 2) * 0.05;
        hillRing.material.opacity = 0.5 + Math.sin(time * 2.5) * 0.2;

        targetMarker.rotation.z = time * 2;
        targetMarker.material.opacity = 0.5 + Math.sin(time * 4) * 0.3;

        targetRotation.x = mouse.y * 0.15;
        targetRotation.y = mouse.x * 0.25;
        
        scene.rotation.x += (targetRotation.x - scene.rotation.x) * 0.02;
        scene.rotation.y += (targetRotation.y - scene.rotation.y) * 0.02;
        scene.rotation.y += 0.0003;

        var now = new Date();
        var daysSincePerihelion = Math.round((now - cometData.perihelionDate) / (1000 * 60 * 60 * 24));
        var simulatedDay = Math.round(animationProgress * totalJourneyDays);
        
        var inHillSphere = distToJupiter < jupiterHillRadius;
        var approachingHill = distToHillEdge < 0.5;

        infoDiv.innerHTML = 
            '<div style="font-size:16px;font-weight:bold;margin-bottom:10px;color:#00ffff;text-shadow:0 0 20px #00ffff;">☄️ 3I/ATLAS — INTERSTELLAR VISITOR</div>' +
            '<div style="color:#888;font-size:10px;margin-bottom:12px;">Third interstellar object detected • Post-perihelion trajectory</div>' +
            '<div style="border-top:1px solid rgba(0,255,255,0.3);padding-top:10px;">' +
            '<span style="color:#ffdd00;">◉ Distance from Sun:</span> <span style="color:#fff;">' + distFromSun.toFixed(2) + ' AU</span><br>' +
            '<span style="color:#ffdd00;">◉ Days since perihelion:</span> <span style="color:#fff;">+' + daysSincePerihelion + ' days</span><br>' +
            '<span style="color:#ffdd00;">◉ Simulation day:</span> <span style="color:#fff;">+' + simulatedDay + ' days</span><br>' +
            '<span style="color:#ff6666;">◉ V∞:</span> <span style="color:#fff;">' + cometData.vInfinity + ' km/s</span></div>' +
            '<div style="border-top:1px solid rgba(255,100,255,0.3);margin-top:10px;padding-top:10px;">' +
            '<span style="color:#ff66ff;">◎ Jupiter Hill Radius:</span> <span style="color:#fff;">' + jupiterHillRadius.toFixed(3) + ' AU</span><br>' +
            '<span style="color:#ff66ff;">◎ Distance to Jupiter:</span> <span style="color:#fff;">' + distToJupiter.toFixed(2) + ' AU</span><br>' +
            '<span style="color:#ff66ff;">◎ To Hill boundary:</span> <span style="color:#fff;">' + distToHillEdge.toFixed(3) + ' AU</span></div>' +
            (inHillSphere ? '<div style="color:#ff00ff;font-size:14px;margin-top:12px;animation:pulse 1s infinite;">⚠️ INSIDE JUPITER HILL SPHERE!</div>' : '') +
            (approachingHill && !inHillSphere ? '<div style="color:#ffaa00;font-size:12px;margin-top:12px;">⚡ Approaching gravitational capture zone...</div>' : '') +
            '<div style="margin-top:15px;font-size:9px;opacity:0.7;">' +
            '<span style="color:#4488ff;">●</span> Earth <span style="color:#ff6644;">●</span> Mars <span style="color:#ffaa44;">●</span> Jupiter<br>' +
            '<span style="color:#00ffff;">━</span> Trajectory <span style="color:#ff66ff;">◯</span> Hill Sphere</div>';

        renderer.render(scene, camera);
    }

    var style = document.createElement('style');
    style.textContent = '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }';
    document.head.appendChild(style);

    animate();

    $('#canvas-orbit').css('opacity', 1);
    $('body').append('<div class="bg-color" style="background-color:#000005"></div>');
}
