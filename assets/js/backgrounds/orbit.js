function orbitBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.id = 'canvas-orbit';
    document.getElementById('main').appendChild(renderer.domElement);

    var camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.z = 220;
    camera.position.y = 180;
    camera.position.x = -80;
    camera.lookAt(0, 0, 0);
    
    // Focus mode camera state
    var focusModeActive = false;
    var baseCameraZ = 220;
    var focusCameraZ = -20; // Zoomed in position (inside the scene)
    var targetCameraZ = baseCameraZ;

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000002, 0.0008);

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
    // Real Hill radius is ~0.355 AU, but we scale it up for visibility
    var jupiterHillRadius = jupiterData.semiMajorAxis * Math.pow(JUPITER_MASS / (3 * SUN_MASS), 1/3);
    // Scale up the visual Hill radius to be more visible (about 5x larger than reality)
    var hillRadiusVisualScale = 5.0;
    var jupiterHillRadiusPixels = jupiterHillRadius * AU_TO_PIXELS * hillRadiusVisualScale;

    // Animation progress (0 = perihelion, 1 = at Jupiter Hill radius)
    var animationProgress = 0;
    var animationSpeed = 0.0008;
    var totalJourneyDays = 180;
    var parallaxStarLayers = [];
    var dottedTrajectoryMaterial = null;
    
    // Real orbit data from NASA JPL Horizons API
    var realOrbitPoints = [];
    var orbitDataLoaded = false;
    
    // Fetch real ephemeris from NASA JPL Horizons
    function fetchRealOrbit() {
        // For the Jupiter Hill sphere flyby visualization, we use a smooth artistic trajectory
        // The real comet C/2024 G3 doesn't actually pass through Jupiter's Hill sphere
        // So we use the fallback orbit which provides a visually appealing flyby path
        console.log('Using smooth flyby trajectory for Hill sphere visualization');
        generateFallbackOrbit();
    }
    
    function parseHorizonsData(result) {
        var lines = result.split('\n');
        var inData = false;
        var points = [];
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            
            if (line.indexOf('$$SOE') !== -1) {
                inData = true;
                continue;
            }
            if (line.indexOf('$$EOE') !== -1) {
                inData = false;
                break;
            }
            
            if (inData && line.length > 0) {
                // CSV format: JDTDB, Calendar Date, X, Y, Z, VX, VY, VZ
                var parts = line.split(',');
                if (parts.length >= 5) {
                    var x = parseFloat(parts[2]);
                    var y = parseFloat(parts[3]);
                    var z = parseFloat(parts[4]);
                    
                    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                        // Convert from AU to pixels, rotate to our coordinate system
                        points.push(new THREE.Vector3(
                            x * AU_TO_PIXELS,
                            z * AU_TO_PIXELS * 0.3,  // Y is vertical in our scene
                            y * AU_TO_PIXELS
                        ));
                    }
                }
            }
        }
        
        if (points.length > 10) {
            console.log('Loaded ' + points.length + ' orbit points from NASA');
            realOrbitPoints = points;
            orbitDataLoaded = true;
            updateTrajectoryWithRealData();
        } else {
            console.warn('Insufficient orbit points, using fallback');
            generateFallbackOrbit();
        }
    }
    
    function generateFallbackOrbit() {
        // Generate hyperbolic trajectory that passes through Jupiter's Hill sphere
        // Modified trajectory to create a close approach for visual effect
        var e = 1.00001; // Slightly hyperbolic
        var q = cometData.perihelionDistance;
        var inclination = Math.PI * 0.25; // 45 degrees
        
        // Jupiter's position
        var jupiterX = Math.cos(jupiterData.currentAngle) * jupiterData.semiMajorAxis;
        var jupiterZ = Math.sin(jupiterData.currentAngle) * jupiterData.semiMajorAxis;
        
        var points = [];
        var numPoints = 400;
        
        // First half: perihelion approach
        for (var i = 0; i < numPoints / 2; i++) {
            var t = i / (numPoints / 2);
            // Start from far away, curve toward perihelion
            var nuDeg = -160 + t * 160;
            var nu = nuDeg * Math.PI / 180;
            
            var r = q * (1 + e) / (1 + e * Math.cos(nu));
            if (r > 50) continue;
            
            var xOrbit = r * Math.cos(nu);
            var yOrbit = r * Math.sin(nu);
            
            var x = xOrbit;
            var y = yOrbit * Math.sin(inclination);
            var z = yOrbit * Math.cos(inclination);
            
            points.push(new THREE.Vector3(
                x * AU_TO_PIXELS,
                y * AU_TO_PIXELS * 0.3,
                z * AU_TO_PIXELS
            ));
        }
        
        // Get perihelion position
        var perihelionPoint = points[points.length - 1] || new THREE.Vector3(q * AU_TO_PIXELS, 0, 0);
        
        // Smooth flyby of Jupiter's Hill sphere using cubic bezier
        var jupiterPos = new THREE.Vector3(
            jupiterX * AU_TO_PIXELS,
            0,
            jupiterZ * AU_TO_PIXELS
        );
        
        // Calculate smooth flyby waypoints
        var hillRadiusAU = jupiterHillRadius * hillRadiusVisualScale;
        var hillRadiusPx = hillRadiusAU * AU_TO_PIXELS;
        
        // More control points around Jupiter for smoother curve
        // Approach points leading to Hill sphere
        var approachPoint1 = jupiterPos.clone().add(new THREE.Vector3(-hillRadiusPx * 1.8, -5, -hillRadiusPx * 1.2));
        var approachPoint2 = jupiterPos.clone().add(new THREE.Vector3(-hillRadiusPx * 1.3, -2, -hillRadiusPx * 0.9));
        
        // Entry into Hill sphere - gradual curve
        var entryPoint1 = jupiterPos.clone().add(new THREE.Vector3(-hillRadiusPx * 0.95, 0, -hillRadiusPx * 0.6));
        var entryPoint2 = jupiterPos.clone().add(new THREE.Vector3(-hillRadiusPx * 0.7, 2, -hillRadiusPx * 0.3));
        
        // Inside Hill sphere - smooth arc through closest approach
        var insidePoint1 = jupiterPos.clone().add(new THREE.Vector3(-hillRadiusPx * 0.4, 4, hillRadiusPx * 0.05));
        var closestPoint = jupiterPos.clone().add(new THREE.Vector3(-hillRadiusPx * 0.15, 6, hillRadiusPx * 0.35));
        var insidePoint2 = jupiterPos.clone().add(new THREE.Vector3(hillRadiusPx * 0.15, 7, hillRadiusPx * 0.55));
        
        // Exit from Hill sphere - gradual departure
        var exitPoint1 = jupiterPos.clone().add(new THREE.Vector3(hillRadiusPx * 0.45, 9, hillRadiusPx * 0.7));
        var exitPoint2 = jupiterPos.clone().add(new THREE.Vector3(hillRadiusPx * 0.75, 11, hillRadiusPx * 0.85));
        var exitPoint3 = jupiterPos.clone().add(new THREE.Vector3(hillRadiusPx * 1.0, 14, hillRadiusPx * 1.0));
        
        // Extended escape trajectory - continue well beyond Hill sphere
        var escapePoint1 = jupiterPos.clone().add(new THREE.Vector3(hillRadiusPx * 1.5, 20, hillRadiusPx * 1.3));
        var escapePoint2 = jupiterPos.clone().add(new THREE.Vector3(hillRadiusPx * 2.5, 35, hillRadiusPx * 2.0));
        var escapePoint3 = jupiterPos.clone().add(new THREE.Vector3(hillRadiusPx * 4.0, 50, hillRadiusPx * 3.0));
        var escapeEnd = jupiterPos.clone().add(new THREE.Vector3(hillRadiusPx * 6.0, 70, hillRadiusPx * 4.5));
        
        // Smooth approach from perihelion to Jupiter approach zone
        var numApproach = Math.floor(numPoints * 0.25);
        for (var j = 0; j < numApproach; j++) {
            var t2 = j / numApproach;
            // Smooth cubic interpolation
            var smoothT = t2 * t2 * (3 - 2 * t2);
            var pt = new THREE.Vector3(
                perihelionPoint.x + (approachPoint1.x - perihelionPoint.x) * smoothT,
                perihelionPoint.y + (approachPoint1.y - perihelionPoint.y) * smoothT + Math.sin(smoothT * Math.PI) * 15,
                perihelionPoint.z + (approachPoint1.z - perihelionPoint.z) * smoothT
            );
            points.push(pt);
        }
        
        // Smooth flyby through Hill sphere with many control points for smooth curve
        var flybyPoints = [
            approachPoint1, approachPoint2,
            entryPoint1, entryPoint2,
            insidePoint1, closestPoint, insidePoint2,
            exitPoint1, exitPoint2, exitPoint3,
            escapePoint1, escapePoint2, escapePoint3, escapeEnd
        ];
        var numFlyby = Math.floor(numPoints * 0.55);
        
        // Use Catmull-Rom spline with lower tension for very smooth curve
        var flybyCurve = new THREE.CatmullRomCurve3(flybyPoints, false, 'catmullrom', 0.3);
        for (var k = 0; k < numFlyby; k++) {
            var t3 = k / (numFlyby - 1);
            var pt = flybyCurve.getPoint(t3);
            points.push(pt);
        }
        
        console.log('Generated fallback orbit with ' + points.length + ' points (smooth flyby through Hill sphere)');
        realOrbitPoints = points;
        orbitDataLoaded = true;
        updateTrajectoryWithRealData();
    }
    
    function updateTrajectoryWithRealData() {
        if (!orbitDataLoaded || realOrbitPoints.length < 2) return;
        
        // Update the full path geometry with real data
        var positions = new Float32Array(realOrbitPoints.length * 3);
        for (var i = 0; i < realOrbitPoints.length; i++) {
            positions[i * 3] = realOrbitPoints[i].x;
            positions[i * 3 + 1] = realOrbitPoints[i].y;
            positions[i * 3 + 2] = realOrbitPoints[i].z;
        }
        
        var pathDots = window._orbitFullPathDots;
        if (pathDots && pathDots.geometry) {
            // Create new geometry with real orbit points
            pathDots.geometry.dispose();
            var newGeometry = new THREE.BufferGeometry();
            newGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            pathDots.geometry = newGeometry;
        }
        
        // Update trajectory curve for comet animation
        if (realOrbitPoints.length > 10) {
            trajectoryCurve = new THREE.CatmullRomCurve3(realOrbitPoints, false, 'catmullrom', 0.3);
            var tData = window._orbitTrajectoryData;
            if (tData) {
                tData.curve = trajectoryCurve;
            }
            
            // Calculate journey days based on actual timespan
            totalJourneyDays = realOrbitPoints.length * 10; // 10 days per point
        }
        
        console.log('Trajectory updated with real orbital data spanning ' + totalJourneyDays + ' days');
    }
    
    // Start fetching real orbit data
    fetchRealOrbit();

    // --- ENHANCED STARFIELD ---
    function createStarfield() {
        var starGeometry = new THREE.BufferGeometry();
        var starCount = 1500;
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
            if (colorChoice < 0.85) {
                colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 0.65;
            } else {
                colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 0.75;
            }
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        var starMaterial = new THREE.PointsMaterial({
            size: 0.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            sizeAttenuation: true
        });
        
        return new THREE.Points(starGeometry, starMaterial);
    }
    scene.add(createStarfield());

    // --- MILKY WAY BAND ---
    function createMilkyWay() {
        var geometry = new THREE.BufferGeometry();
        var count = 6000;
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var radius = 2000 + Math.random() * 2500;
            var thickness = (Math.random() - 0.5) * 300;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = thickness + (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            var brightness = 0.15 + Math.random() * 0.2;
            colors[i * 3] = brightness * 0.7;
            colors[i * 3 + 1] = brightness * 0.65;
            colors[i * 3 + 2] = brightness * 0.7;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        var material = new THREE.PointsMaterial({
            size: 0.6,
            vertexColors: true,
            transparent: true,
            opacity: 0.25
        });
        
        var milkyWay = new THREE.Points(geometry, material);
        milkyWay.rotation.x = Math.PI * 0.15;
        milkyWay.rotation.z = Math.PI * 0.1;
        return milkyWay;
    }
    scene.add(createMilkyWay());

    // --- COSMIC VEIL & PARALLAX STARS ---
    function createDeepSpaceVeil() {
        var geometry = new THREE.BufferGeometry();
        var count = 1200;
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        for (var i = 0; i < count; i++) {
            var radius = 2600 + Math.random() * 2200;
            var angle = Math.random() * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            var tint = 0.2 + Math.random() * 0.3;
            colors[i * 3] = tint * 0.6;
            colors[i * 3 + 1] = tint * 0.7;
            colors[i * 3 + 2] = tint;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        var material = new THREE.PointsMaterial({
            size: 6,
            transparent: true,
            opacity: 0.12,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        var veil = new THREE.Points(geometry, material);
        veil.rotation.x = Math.PI * 0.25;
        return veil;
    }
    scene.add(createDeepSpaceVeil());

    function createParallaxStars(depthFactor, count) {
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        for (var i = 0; i < count; i++) {
            var spread = 3500 + depthFactor * 2000;
            positions[i * 3] = (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6;
            positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
            var hue = 0.45 + Math.random() * 0.35;
            colors[i * 3] = hue * (0.6 + depthFactor * 0.2);
            colors[i * 3 + 1] = hue * (0.6 + depthFactor * 0.1);
            colors[i * 3 + 2] = hue;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        var material = new THREE.PointsMaterial({
            size: 1.2 + depthFactor * 1.6,
            transparent: true,
            opacity: 0.35 + depthFactor * 0.25,
            vertexColors: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        return new THREE.Points(geometry, material);
    }
    [0.3, 0.7].forEach(function(depth, idx) {
        var layer = createParallaxStars(depth, 400 + idx * 200);
        parallaxStarLayers.push({ mesh: layer, depth: depth });
        scene.add(layer);
    });

    // --- GLOWING SUN ---
    var sunGroup = new THREE.Group();
    
    var sunGeometry = new THREE.SphereGeometry(10, 64, 64);
    var sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc88 });
    var sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sunMesh);
    
    // Sun corona layers
    for (var i = 1; i <= 3; i++) {
        var glowGeometry = new THREE.SphereGeometry(10 + i * 3.5, 32, 32);
        var glowMaterial = new THREE.MeshBasicMaterial({
            color: i < 2 ? 0xffaa66 : 0xff9955,
            transparent: true,
            opacity: 0.08 / i,
            side: THREE.BackSide
        });
        sunGroup.add(new THREE.Mesh(glowGeometry, glowMaterial));
    }
    
    scene.add(sunGroup);
    
    // --- PLANET LABEL HELPER ---
    function createTextSprite(text, color) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        // Clear with transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'bold 48px Consolas, Monaco, monospace';
        context.fillStyle = color || '#aabbcc';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 256, 64);
        
        var texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        var spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            depthTest: false,
            sizeAttenuation: true
        });
        
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(60, 15, 1);
        sprite.renderOrder = 999; // Render on top
        return sprite;
    }
    
    // Sun label
    var sunLabel = createTextSprite('SUN', '#ffcc88');
    sunLabel.position.set(0, -35, 0);
    sunGroup.add(sunLabel);

    // --- PLANETARY ORBITS with dotted line effect ---
    function createDottedOrbit(radius, color, dotSize) {
        var group = new THREE.Group();
        var segments = 200;
        dotSize = dotSize || 1.2;
        
        var positions = new Float32Array(segments * 3);
        for (var i = 0; i < segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
        
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        var material = new THREE.PointsMaterial({
            color: color,
            size: dotSize,
            transparent: true,
            opacity: 0.5,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });
        
        group.add(new THREE.Points(geometry, material));
        
        // Add subtle glow ring
        var glowMaterial = new THREE.PointsMaterial({
            color: color,
            size: dotSize * 2.5,
            transparent: true,
            opacity: 0.1,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });
        group.add(new THREE.Points(geometry.clone(), glowMaterial));
        
        return group;
    }

    // Venus orbit (0.72 AU) - yellowish
    scene.add(createDottedOrbit(0.72 * AU_TO_PIXELS, 0xccaa66, 1.0));
    // Earth orbit (1 AU) - blue
    scene.add(createDottedOrbit(1 * AU_TO_PIXELS, 0x6688cc, 1.0));
    // Mars orbit (1.52 AU) - reddish-orange
    scene.add(createDottedOrbit(1.52 * AU_TO_PIXELS, 0xcc6644, 1.0));
    // Jupiter orbit (5.2 AU) - cyan/teal
    scene.add(createDottedOrbit(5.2 * AU_TO_PIXELS, 0x55aaaa, 1.0));

    // --- VENUS ---
    var venusGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    var venusMaterial = new THREE.MeshBasicMaterial({ color: 0xddcc88 });
    var venusMesh = new THREE.Mesh(venusGeometry, venusMaterial);
    var venusAngle = Math.PI * 1.6;
    venusMesh.position.set(Math.cos(venusAngle) * 0.72 * AU_TO_PIXELS, 0, Math.sin(venusAngle) * 0.72 * AU_TO_PIXELS);
    scene.add(venusMesh);
    
    // Venus glow
    var venusGlowGeometry = new THREE.SphereGeometry(3.5, 16, 16);
    var venusGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xddcc88,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    venusMesh.add(new THREE.Mesh(venusGlowGeometry, venusGlowMaterial));
    
    // Venus label
    var venusLabel = createTextSprite('VENUS', '#ddcc88');
    venusLabel.position.set(0, -16, 0);
    venusMesh.add(venusLabel);

    // --- EARTH ---
    var earthGeometry = new THREE.SphereGeometry(3, 32, 32);
    var earthMaterial = new THREE.MeshBasicMaterial({ color: 0x6688cc });
    var earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    var earthAngle = Math.PI * 1.2;
    earthMesh.position.set(Math.cos(earthAngle) * AU_TO_PIXELS, 0, Math.sin(earthAngle) * AU_TO_PIXELS);
    scene.add(earthMesh);
    
    // Earth glow
    var earthGlowGeometry = new THREE.SphereGeometry(4, 16, 16);
    var earthGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6688cc,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    earthMesh.add(new THREE.Mesh(earthGlowGeometry, earthGlowMaterial));
    
    // Earth label
    var earthLabel = createTextSprite('EARTH', '#88aacc');
    earthLabel.position.set(0, -18, 0);
    earthMesh.add(earthLabel);

    // --- MARS ---
    var marsGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    var marsMaterial = new THREE.MeshBasicMaterial({ color: 0xcc6644 });
    var marsMesh = new THREE.Mesh(marsGeometry, marsMaterial);
    var marsAngle = Math.PI * 0.8;
    marsMesh.position.set(Math.cos(marsAngle) * 1.52 * AU_TO_PIXELS, 0, Math.sin(marsAngle) * 1.52 * AU_TO_PIXELS);
    scene.add(marsMesh);
    
    // Mars glow
    var marsGlowGeometry = new THREE.SphereGeometry(3.5, 16, 16);
    var marsGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xcc6644,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    marsMesh.add(new THREE.Mesh(marsGlowGeometry, marsGlowMaterial));
    
    // Mars label
    var marsLabel = createTextSprite('MARS', '#cc8866');
    marsLabel.position.set(0, -16, 0);
    marsMesh.add(marsLabel);

    // --- JUPITER (HUD wireframe style) ---
    var jupiterGroup = new THREE.Group();
    
    // Simple circle outline for Jupiter - HUD style
    var jupiterRadius = 60;
    var jupiterSegments = 64;
    var jupiterOutlinePositions = new Float32Array(jupiterSegments * 3);
    for (var ji = 0; ji < jupiterSegments; ji++) {
        var jAngle = (ji / jupiterSegments) * Math.PI * 2;
        jupiterOutlinePositions[ji * 3] = Math.cos(jAngle) * jupiterRadius;
        jupiterOutlinePositions[ji * 3 + 1] = 0;
        jupiterOutlinePositions[ji * 3 + 2] = Math.sin(jAngle) * jupiterRadius;
    }
    var jupiterOutlineGeometry = new THREE.BufferGeometry();
    jupiterOutlineGeometry.setAttribute('position', new THREE.BufferAttribute(jupiterOutlinePositions, 3));
    var jupiterOutlineMaterial = new THREE.PointsMaterial({
        color: 0xddaa66,
        size: 1.5,
        transparent: true,
        opacity: 0.8
    });
    var jupiterOutline = new THREE.Points(jupiterOutlineGeometry, jupiterOutlineMaterial);
    jupiterGroup.add(jupiterOutline);
    
    // Cross-hairs through center
    var crosshairGeometry = new THREE.BufferGeometry();
    var crosshairPositions = new Float32Array([
        -jupiterRadius * 0.3, 0, 0,
        jupiterRadius * 0.3, 0, 0,
        0, 0, -jupiterRadius * 0.3,
        0, 0, jupiterRadius * 0.3
    ]);
    crosshairGeometry.setAttribute('position', new THREE.BufferAttribute(crosshairPositions, 3));
    var crosshairMaterial = new THREE.LineBasicMaterial({
        color: 0xddaa66,
        transparent: true,
        opacity: 0.3
    });
    var crosshair = new THREE.LineSegments(crosshairGeometry, crosshairMaterial);
    jupiterGroup.add(crosshair);
    
    // Center dot
    var centerDotGeometry = new THREE.BufferGeometry();
    centerDotGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
    var centerDotMaterial = new THREE.PointsMaterial({
        color: 0xffcc77,
        size: 3,
        transparent: true,
        opacity: 0.6
    });
    jupiterGroup.add(new THREE.Points(centerDotGeometry, centerDotMaterial));
    
    // Jupiter label
    var jupiterLabel = createTextSprite('JUPITER', '#ddaa66');
    jupiterLabel.position.set(0, -90, 0);
    jupiterLabel.scale.set(80, 20, 1);
    jupiterGroup.add(jupiterLabel);
    
    jupiterGroup.position.set(
        Math.cos(jupiterData.currentAngle) * 5.2 * AU_TO_PIXELS,
        0,
        Math.sin(jupiterData.currentAngle) * 5.2 * AU_TO_PIXELS
    );
    scene.add(jupiterGroup);

    // --- JUPITER'S HILL RADIUS SPHERE ---
    var hillGroup = new THREE.Group();
    
    // --- HILL RADIUS VISUALIZATION --- //
    // Simple dotted ring to show Hill radius boundary
    var hillRingSegments = 150;
    var hillRingPositions = new Float32Array(hillRingSegments * 3);
    for (var hri = 0; hri < hillRingSegments; hri++) {
        var hrAngle = (hri / hillRingSegments) * Math.PI * 2;
        hillRingPositions[hri * 3] = Math.cos(hrAngle) * jupiterHillRadiusPixels;
        hillRingPositions[hri * 3 + 1] = 0;
        hillRingPositions[hri * 3 + 2] = Math.sin(hrAngle) * jupiterHillRadiusPixels;
    }
    var hillRingGeometry = new THREE.BufferGeometry();
    hillRingGeometry.setAttribute('position', new THREE.BufferAttribute(hillRingPositions, 3));
    var hillRingMaterial = new THREE.PointsMaterial({
        color: 0x88ddff,
        size: 1.5,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });
    var hillRingDots = new THREE.Points(hillRingGeometry, hillRingMaterial);
    hillGroup.add(hillRingDots);
    // --- /HILL RADIUS VISUALIZATION --- //
    
    // Hill radius label - positioned on the side where comet approaches
    // Comet approaches from negative X/Z direction, so place label there
    var hillLabel = createTextSprite('HILL SPHERE', '#88ccff');
    hillLabel.position.set(-jupiterHillRadiusPixels * 0.7, 0, -jupiterHillRadiusPixels * 0.7);
    hillLabel.scale.set(80, 20, 1);
    hillGroup.add(hillLabel);
    
    // Add entry/exit markers on the Hill sphere
    // Entry marker (where comet enters)
    var hillEntryMarkerGroup = new THREE.Group();
    var hillEntryGeometry = new THREE.SphereGeometry(3, 16, 16);
    var hillEntryMaterial = new THREE.MeshBasicMaterial({ color: 0x66ff66 });
    var hillEntryCore = new THREE.Mesh(hillEntryGeometry, hillEntryMaterial);
    hillEntryMarkerGroup.add(hillEntryCore);
    
    var hillEntryGlowGeometry = new THREE.SphereGeometry(5, 16, 16);
    var hillEntryGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x66ff66,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
    });
    var hillEntryGlow = new THREE.Mesh(hillEntryGlowGeometry, hillEntryGlowMaterial);
    hillEntryMarkerGroup.add(hillEntryGlow);
    
    // Outer glow layer for entry
    var hillEntryOuterGlowGeometry = new THREE.SphereGeometry(8, 16, 16);
    var hillEntryOuterGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x44dd44,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    var hillEntryOuterGlow = new THREE.Mesh(hillEntryOuterGlowGeometry, hillEntryOuterGlowMaterial);
    hillEntryMarkerGroup.add(hillEntryOuterGlow);
    
    // Ring around entry point
    var hillEntryRingGeometry = new THREE.TorusGeometry(6, 0.3, 8, 32);
    var hillEntryRingMaterial = new THREE.MeshBasicMaterial({
        color: 0x66ff66,
        transparent: true,
        opacity: 0.5
    });
    var hillEntryRing = new THREE.Mesh(hillEntryRingGeometry, hillEntryRingMaterial);
    hillEntryRing.rotation.x = Math.PI / 2;
    hillEntryMarkerGroup.add(hillEntryRing);
    
    var hillEntryLabel = createTextSprite('ENTRY', '#66ff66');
    hillEntryLabel.position.set(0, -15, 0);
    hillEntryLabel.scale.set(40, 10, 1);
    hillEntryMarkerGroup.add(hillEntryLabel);
    
    // Position at Hill sphere surface on approach side
    hillEntryMarkerGroup.position.set(-jupiterHillRadiusPixels * 0.7, 0, -jupiterHillRadiusPixels * 0.7);
    hillGroup.add(hillEntryMarkerGroup);
    
    // Exit marker (where comet exits)
    var hillExitMarkerGroup = new THREE.Group();
    var hillExitGeometry = new THREE.SphereGeometry(3, 16, 16);
    var hillExitMaterial = new THREE.MeshBasicMaterial({ color: 0xff6666 });
    var hillExitCore = new THREE.Mesh(hillExitGeometry, hillExitMaterial);
    hillExitMarkerGroup.add(hillExitCore);
    
    var hillExitGlowGeometry = new THREE.SphereGeometry(5, 16, 16);
    var hillExitGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6666,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
    });
    var hillExitGlow = new THREE.Mesh(hillExitGlowGeometry, hillExitGlowMaterial);
    hillExitMarkerGroup.add(hillExitGlow);
    
    // Outer glow layer for exit
    var hillExitOuterGlowGeometry = new THREE.SphereGeometry(8, 16, 16);
    var hillExitOuterGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xdd4444,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    var hillExitOuterGlow = new THREE.Mesh(hillExitOuterGlowGeometry, hillExitOuterGlowMaterial);
    hillExitMarkerGroup.add(hillExitOuterGlow);
    
    // Ring around exit point
    var hillExitRingGeometry = new THREE.TorusGeometry(6, 0.3, 8, 32);
    var hillExitRingMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6666,
        transparent: true,
        opacity: 0.5
    });
    var hillExitRing = new THREE.Mesh(hillExitRingGeometry, hillExitRingMaterial);
    hillExitRing.rotation.x = Math.PI / 2;
    hillExitMarkerGroup.add(hillExitRing);
    
    var hillExitLabel = createTextSprite('EXIT', '#ff6666');
    hillExitLabel.position.set(0, -15, 0);
    hillExitLabel.scale.set(40, 10, 1);
    hillExitMarkerGroup.add(hillExitLabel);
    
    // Position at Hill sphere surface on exit side
    hillExitMarkerGroup.position.set(jupiterHillRadiusPixels * 0.7, 0, jupiterHillRadiusPixels * 0.7);
    hillGroup.add(hillExitMarkerGroup);
    // --- /HILL RADIUS BUBBLE --- //
    
    jupiterGroup.add(hillGroup);

    // --- COMET with particle tail ---
    var cometGroup = new THREE.Group();
    
    var nucleusGeometry = new THREE.SphereGeometry(3, 32, 32);
    var nucleusMaterial = new THREE.MeshBasicMaterial({ color: 0xaabbcc });
    var nucleusMesh = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    cometGroup.add(nucleusMesh);
    
    var comaGeometry = new THREE.SphereGeometry(6, 32, 32);
    var comaMaterial = new THREE.MeshBasicMaterial({
        color: 0x778899,
        transparent: true,
        opacity: 0.2
    });
    var comaMesh = new THREE.Mesh(comaGeometry, comaMaterial);
    cometGroup.add(comaMesh);
    
    var outerComaGeometry = new THREE.SphereGeometry(9, 32, 32);
    var outerComaMaterial = new THREE.MeshBasicMaterial({
        color: 0x556677,
        transparent: true,
        opacity: 0.1
    });
    cometGroup.add(new THREE.Mesh(outerComaGeometry, outerComaMaterial));
    
    // Comet label
    var cometLabel = createTextSprite('3I/ATLAS', '#aaddff');
    cometLabel.position.set(0, -35, 0);
    cometLabel.scale.set(80, 20, 1);
    cometGroup.add(cometLabel);
    
    // Comet date/time label (dynamic, updated each frame)
    var cometDateCanvas = document.createElement('canvas');
    var cometDateContext = cometDateCanvas.getContext('2d');
    cometDateCanvas.width = 2048;
    cometDateCanvas.height = 256;
    
    var cometDateTexture = new THREE.CanvasTexture(cometDateCanvas);
    cometDateTexture.minFilter = THREE.LinearFilter;
    cometDateTexture.magFilter = THREE.LinearFilter;
    
    var cometDateMaterial = new THREE.SpriteMaterial({
        map: cometDateTexture,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        depthTest: false
    });
    var cometDateSprite = new THREE.Sprite(cometDateMaterial);
    cometDateSprite.position.set(0, -65, 0);
    cometDateSprite.scale.set(160, 20, 1);
    cometDateSprite.renderOrder = 999;
    cometGroup.add(cometDateSprite);
    
    // Function to update date label
    function updateCometDateLabel(progress) {
        // Calculate simulated date based on animation progress
        // Start from perihelion date (Oct 29, 2025) and span 10 years
        var perihelionDate = new Date('2025-10-29');
        var journeyDays = 3650; // ~10 years
        var dayOffset = Math.floor(progress * journeyDays);
        
        var simulatedDate = new Date(perihelionDate);
        simulatedDate.setDate(simulatedDate.getDate() + dayOffset);
        
        // Format: "25'NOV 15 14:32:08"
        var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        var year = String(simulatedDate.getFullYear()).slice(-2); // Last 2 digits
        var month = months[simulatedDate.getMonth()];
        var day = String(simulatedDate.getDate()).padStart(2, '0');
        
        // Add ticking time based on fractional day
        var fracDay = (progress * journeyDays) % 1;
        var hours = String(Math.floor(fracDay * 24)).padStart(2, '0');
        var minutes = String(Math.floor((fracDay * 24 * 60) % 60)).padStart(2, '0');
        var seconds = String(Math.floor((fracDay * 24 * 60 * 60) % 60)).padStart(2, '0');
        
        var dateStr = year + "'" + month + ' ' + day + ' ' + hours + ':' + minutes + ':' + seconds;
        
        // Clear and redraw with larger font
        cometDateContext.clearRect(0, 0, 2048, 256);
        cometDateContext.font = 'bold 128px Consolas, Monaco, monospace';
        cometDateContext.fillStyle = '#aaddff';
        cometDateContext.textAlign = 'center';
        cometDateContext.textBaseline = 'middle';
        cometDateContext.fillText(dateStr, 1024, 128);
        
        cometDateTexture.needsUpdate = true;
    }
    
    scene.add(cometGroup);

    // --- COMET DUST TAIL ---
    var tailParticleCount = 400;
    var tailGeometry = new THREE.BufferGeometry();
    var tailPositions = new Float32Array(tailParticleCount * 3);
    var tailColors = new Float32Array(tailParticleCount * 3);
    
    // Pre-calculate static offsets for particles
    var tailOffsets = new Float32Array(tailParticleCount * 3);
    for (var ti = 0; ti < tailParticleCount; ti++) {
        tailOffsets[ti * 3] = (Math.random() - 0.5) * 2;
        tailOffsets[ti * 3 + 1] = (Math.random() - 0.5) * 2;
        tailOffsets[ti * 3 + 2] = (Math.random() - 0.5) * 2;
        // Initialize colors (cyan gradient)
        var fade = 1 - (ti / tailParticleCount);
        tailColors[ti * 3] = 0.5 + fade * 0.5;
        tailColors[ti * 3 + 1] = 0.7 + fade * 0.3;
        tailColors[ti * 3 + 2] = 1.0;
    }
    
    tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeometry.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
    
    // Simple PointsMaterial - reliable and performant
    var tailMaterial = new THREE.PointsMaterial({
        size: 4,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    var tailParticles = new THREE.Points(tailGeometry, tailMaterial);
    tailParticles.frustumCulled = false;
    tailParticles.renderOrder = 100;
    scene.add(tailParticles);
    
    // --- ION TAIL ---
    var ionSegments = 30;
    var ionTailGeometry = new THREE.BufferGeometry();
    var ionPositions = new Float32Array((ionSegments + 1) * 3);
    ionTailGeometry.setAttribute('position', new THREE.BufferAttribute(ionPositions, 3));
    
    var ionTailMaterial = new THREE.LineBasicMaterial({
        color: 0x6699ff,
        transparent: true,
        opacity: 0.6,
        linewidth: 2,
        depthWrite: false
    });
    var ionTail = new THREE.Line(ionTailGeometry, ionTailMaterial);
    ionTail.frustumCulled = false;
    ionTail.renderOrder = 99;
    scene.add(ionTail);
    
    // --- SIMPLE COMA GLOW (no shader) ---
    var comaHaloGeometry = new THREE.SphereGeometry(18, 16, 16);  // Reduced segments
    var comaHaloMaterial = new THREE.MeshBasicMaterial({
        color: 0x6699bb,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        depthWrite: false
    });
    var comaHalo = new THREE.Mesh(comaHaloGeometry, comaHaloMaterial);
    cometGroup.add(comaHalo);

    // --- TRAJECTORY PATH ---
    var trajectoryGroup = new THREE.Group();
    
    var perihelionPos = new THREE.Vector3(cometData.perihelionDistance * AU_TO_PIXELS, 0, 0);
    var jupiterPos = jupiterGroup.position.clone();
    
    // --- INTERSTELLAR APPROACH (before perihelion) ---
    // The comet comes from interstellar space, approaching the Sun
    var interstellarStart = new THREE.Vector3(-800, 100, -600);  // Far away, coming from deep space
    var interstellarMid1 = new THREE.Vector3(-500, 70, -350);
    var interstellarMid2 = new THREE.Vector3(-250, 40, -150);
    var interstellarApproach = new THREE.Vector3(-80, 15, -40);  // Approaching perihelion
    
    // Calculate smooth flyby trajectory through Hill sphere
    // Entry point - approaching from the inner solar system (after perihelion)
    var hillEntryPos = jupiterPos.clone().add(new THREE.Vector3(-jupiterHillRadiusPixels * 0.9, -5, -jupiterHillRadiusPixels * 0.6));
    
    // Closest approach - grazes through the Hill sphere (smooth curve, no sharp turn)
    var closestApproach = jupiterPos.clone().add(new THREE.Vector3(-jupiterHillRadiusPixels * 0.2, 0, jupiterHillRadiusPixels * 0.3));
    
    // Exit point - heading out to deep space
    var hillExitPos = jupiterPos.clone().add(new THREE.Vector3(jupiterHillRadiusPixels * 0.8, 10, jupiterHillRadiusPixels * 0.9));
    
    // Gentle escape trajectory - stays visible on screen
    var escapePos1 = jupiterPos.clone().add(new THREE.Vector3(jupiterHillRadiusPixels * 1.4, 20, jupiterHillRadiusPixels * 1.3));
    var escapePos2 = jupiterPos.clone().add(new THREE.Vector3(jupiterHillRadiusPixels * 2.0, 30, jupiterHillRadiusPixels * 1.6));
    var escapeEnd = jupiterPos.clone().add(new THREE.Vector3(jupiterHillRadiusPixels * 2.5, 40, jupiterHillRadiusPixels * 1.9));
    
    // Smooth approach curve from perihelion to Jupiter
    var midPoint = new THREE.Vector3(
        (perihelionPos.x + hillEntryPos.x) / 2,
        20,
        (perihelionPos.z + hillEntryPos.z) / 2 + 50
    );
    
    // Full trajectory including interstellar approach
    var trajectoryCurve = new THREE.CatmullRomCurve3([
        interstellarStart,
        interstellarMid1,
        interstellarMid2,
        interstellarApproach,
        perihelionPos,
        midPoint,
        hillEntryPos,
        closestApproach,
        hillExitPos,
        escapePos1,
        escapePos2,
        escapeEnd
    ], false, 'catmullrom', 0.5);  // Higher tension for smoother curve
    
    // Full journey path - yellowish hyperbolic trajectory line (matching reference image)
    var fullPathPoints = trajectoryCurve.getPoints(500);
    var fullPathPositions = new Float32Array(fullPathPoints.length * 3);
    for (var fp = 0; fp < fullPathPoints.length; fp++) {
        fullPathPositions[fp * 3] = fullPathPoints[fp].x;
        fullPathPositions[fp * 3 + 1] = fullPathPoints[fp].y;
        fullPathPositions[fp * 3 + 2] = fullPathPoints[fp].z;
    }
    var fullPathGeometry = new THREE.BufferGeometry();
    fullPathGeometry.setAttribute('position', new THREE.BufferAttribute(fullPathPositions, 3));
    var fullPathMaterial = new THREE.PointsMaterial({
        color: 0xddaa66,
        size: 2.0,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    // Store as module-level for API update
    var fullPathDots = new THREE.Points(fullPathGeometry, fullPathMaterial);
    trajectoryGroup.add(fullPathDots);
    
    // Add solid trajectory line for better visibility (like reference image)
    var trajectoryLineGeometry = new THREE.BufferGeometry().setFromPoints(fullPathPoints);
    var trajectoryLineMaterial = new THREE.LineBasicMaterial({
        color: 0xddaa66,
        transparent: true,
        opacity: 0.4,
        linewidth: 2
    });
    var trajectoryLine = new THREE.Line(trajectoryLineGeometry, trajectoryLineMaterial);
    trajectoryGroup.add(trajectoryLine);
    
    // --- ORIGINAL TRAJECTORY (ghost of uncorrected path after perihelion) ---
    // Course correction happened AT perihelion
    // This ghost shows where the comet WOULD have gone - crashing into Jupiter
    // Only shows the divergent path AFTER perihelion (not the shared approach)
    var unalteredPoints = [];
    
    // Get Jupiter position for reference
    var jupiterPosForUnaltered = jupiterGroup.position.clone();
    var hillRadiusForUnaltered = jupiterHillRadiusPixels;
    
    // The original trajectory headed more directly toward Jupiter (collision course)
    // Calculate direction from perihelion toward Jupiter's center
    var toJupiterDirect = new THREE.Vector3().subVectors(jupiterPosForUnaltered, perihelionPos).normalize();
    
    // Ghost path starts at perihelion and heads DIRECTLY toward Jupiter
    // This is the path that was avoided by the course correction
    
    // Waypoints for collision course - starts from perihelion
    var ghostStart = perihelionPos.clone(); // Starts exactly at perihelion
    
    var ghostApproach1 = perihelionPos.clone().add(toJupiterDirect.clone().multiplyScalar(hillRadiusForUnaltered * 0.6));
    ghostApproach1.y += 3;
    
    var ghostApproach2 = perihelionPos.clone().add(toJupiterDirect.clone().multiplyScalar(hillRadiusForUnaltered * 1.2));
    ghostApproach2.y += 5;
    
    var ghostApproach3 = perihelionPos.clone().add(toJupiterDirect.clone().multiplyScalar(hillRadiusForUnaltered * 1.8));
    ghostApproach3.y += 6;
    
    // Enters Hill sphere heading toward Jupiter center
    var ghostEntry = jupiterPosForUnaltered.clone().add(new THREE.Vector3(-hillRadiusForUnaltered * 0.6, 4, -hillRadiusForUnaltered * 0.2));
    
    // Goes DEEP into Hill sphere - on collision course
    var ghostDeep1 = jupiterPosForUnaltered.clone().add(new THREE.Vector3(-hillRadiusForUnaltered * 0.25, 2, hillRadiusForUnaltered * 0.05));
    var ghostDeep2 = jupiterPosForUnaltered.clone().add(new THREE.Vector3(-hillRadiusForUnaltered * 0.08, 0, hillRadiusForUnaltered * 0.08));
    
    // Impact point - crashes into Jupiter!
    var ghostImpact = jupiterPosForUnaltered.clone().add(new THREE.Vector3(0, -2, 0));
    
    // Create smooth curve for ghost collision course (starts at perihelion only)
    var ghostCurve = new THREE.CatmullRomCurve3([
        ghostStart,         // Starts at perihelion (where correction happened)
        ghostApproach1,
        ghostApproach2,
        ghostApproach3,
        ghostEntry,
        ghostDeep1,
        ghostDeep2,
        ghostImpact         // Crashes into Jupiter
    ], false, 'catmullrom', 0.4);
    
    // Get points along the curve
    unalteredPoints = ghostCurve.getPoints(200);
    
    // Create dashed line for original collision course (reddish to indicate danger)
    var unalteredPositions = new Float32Array(unalteredPoints.length * 3);
    for (var upj = 0; upj < unalteredPoints.length; upj++) {
        unalteredPositions[upj * 3] = unalteredPoints[upj].x;
        unalteredPositions[upj * 3 + 1] = unalteredPoints[upj].y;
        unalteredPositions[upj * 3 + 2] = unalteredPoints[upj].z;
    }
    var unalteredGeometry = new THREE.BufferGeometry();
    unalteredGeometry.setAttribute('position', new THREE.BufferAttribute(unalteredPositions, 3));
    var unalteredMaterial = new THREE.PointsMaterial({
        color: 0xaa6666,  // Reddish color to indicate collision course
        size: 1.5,
        transparent: true,
        opacity: 0.35,
        sizeAttenuation: true,
        depthWrite: false
    });
    var unalteredPath = new THREE.Points(unalteredGeometry, unalteredMaterial);
    trajectoryGroup.add(unalteredPath);
    
    // Add a line for the original collision course - reddish dashed
    var unalteredLineGeometry = new THREE.BufferGeometry().setFromPoints(unalteredPoints);
    var unalteredLineMaterial = new THREE.LineDashedMaterial({
        color: 0xaa6666,  // Reddish to indicate danger
        transparent: true,
        opacity: 0.25,
        dashSize: 8,
        gapSize: 6
    });
    var unalteredLine = new THREE.Line(unalteredLineGeometry, unalteredLineMaterial);
    unalteredLine.computeLineDistances();
    trajectoryGroup.add(unalteredLine);
    
    // Add label for ghost collision course
    var unalteredLabel = createTextSprite('UNCORRECTED PATH', '#aa6666');
    var labelPos = unalteredPoints[Math.floor(unalteredPoints.length * 0.4)] || new THREE.Vector3(200, 30, 150);
    unalteredLabel.position.set(labelPos.x - 25, labelPos.y + 18, labelPos.z);
    unalteredLabel.scale.set(50, 13, 1);
    trajectoryGroup.add(unalteredLabel);
    
    // Add "IMPACT" label near Jupiter where ghost path ends
    var impactLabel = createTextSprite('IMPACT', '#ff4444');
    impactLabel.position.set(jupiterPosForUnaltered.x - 15, jupiterPosForUnaltered.y + 30, jupiterPosForUnaltered.z);
    impactLabel.scale.set(35, 10, 1);
    trajectoryGroup.add(impactLabel);
    
    // Add "COURSE CORRECTED" marker near perihelion
    var correctionLabel = createTextSprite('COURSE CORRECTED', '#66dd66');
    correctionLabel.position.set(perihelionPos.x + 30, perihelionPos.y + 25, perihelionPos.z);
    correctionLabel.scale.set(55, 14, 1);
    trajectoryGroup.add(correctionLabel);
    // --- /ORIGINAL TRAJECTORY ---
    
    // Make fullPathDots accessible for real orbit update
    window._orbitFullPathDots = fullPathDots;
    
    // Lit portion - bright animated trail following comet progress
    var litTrailCount = 40; // number of dots in the lit trail
    var litTrailGeometry = new THREE.BufferGeometry();
    var litTrailPositions = new Float32Array(litTrailCount * 3);
    var litTrailColors = new Float32Array(litTrailCount * 3);
    var litTrailSizes = new Float32Array(litTrailCount);
    var litTrailAlphas = new Float32Array(litTrailCount); // Per-point alpha for fade
    litTrailGeometry.setAttribute('position', new THREE.BufferAttribute(litTrailPositions, 3));
    litTrailGeometry.setAttribute('color', new THREE.BufferAttribute(litTrailColors, 3));
    litTrailGeometry.setAttribute('size', new THREE.BufferAttribute(litTrailSizes, 1));
    litTrailGeometry.setAttribute('alpha', new THREE.BufferAttribute(litTrailAlphas, 1));
    
    // Custom shader for per-point fade-out
    var litTrailMaterial = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: `
            attribute float size;
            attribute float alpha;
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                vColor = color;
                vAlpha = alpha;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float softEdge = 1.0 - smoothstep(0.3, 0.5, dist);
                gl_FragColor = vec4(vColor, vAlpha * softEdge);
            }
        `,
        transparent: true,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    var litTrailDots = new THREE.Points(litTrailGeometry, litTrailMaterial);
    trajectoryGroup.add(litTrailDots);
    
    // Store trajectoryData and trajectoryCurve globally for API update
    var trajectoryData = {
        curve: trajectoryCurve,
        fullPathPoints: fullPathPoints,
        litTrailGeometry: litTrailGeometry,
        litTrailCount: litTrailCount
    };
    window._orbitTrajectoryData = trajectoryData;
    
    // Keep old reference for compatibility
    dottedTrajectoryMaterial = fullPathMaterial;
    
    // --- PERIHELION MARKER (enhanced) ---
    var perihelionMarkerGroup = new THREE.Group();
    
    // Core sphere - bright golden
    var perihelionMarkerGeometry = new THREE.SphereGeometry(2.5, 16, 16);
    var perihelionMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    var perihelionMarker = new THREE.Mesh(perihelionMarkerGeometry, perihelionMarkerMaterial);
    perihelionMarkerGroup.add(perihelionMarker);
    
    // Glow sphere - golden
    var perihelionGlowGeometry = new THREE.SphereGeometry(4, 16, 16);
    var perihelionGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
    });
    perihelionMarkerGroup.add(new THREE.Mesh(perihelionGlowGeometry, perihelionGlowMaterial));
    
    // Outer glow - warm golden
    var perihelionOuterGlowGeometry = new THREE.SphereGeometry(8, 16, 16);
    var perihelionOuterGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    perihelionMarkerGroup.add(new THREE.Mesh(perihelionOuterGlowGeometry, perihelionOuterGlowMaterial));
    
    // Third outer glow layer for more dramatic effect
    var perihelionOuterGlow2Geometry = new THREE.SphereGeometry(12, 16, 16);
    var perihelionOuterGlow2Material = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide
    });
    perihelionMarkerGroup.add(new THREE.Mesh(perihelionOuterGlow2Geometry, perihelionOuterGlow2Material));
    
    // Ring around perihelion - golden
    var perihelionRingGeometry = new THREE.TorusGeometry(5, 0.3, 8, 32);
    var perihelionRingMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.6
    });
    var perihelionRing = new THREE.Mesh(perihelionRingGeometry, perihelionRingMaterial);
    perihelionRing.rotation.x = Math.PI / 2;
    perihelionMarkerGroup.add(perihelionRing);
    
    // Perihelion label - golden
    var perihelionLabel = createTextSprite('PERIHELION', '#ffd700');
    perihelionLabel.position.set(0, -20, 0);
    perihelionLabel.scale.set(70, 17, 1);
    perihelionMarkerGroup.add(perihelionLabel);
    
    perihelionMarkerGroup.position.copy(perihelionPos);
    trajectoryGroup.add(perihelionMarkerGroup);
    
    // --- FIND CLOSEST APPROACH TO JUPITER ---
    // Sample the trajectory to find the point closest to Jupiter
    var closestApproachT = 0;
    var closestApproachDist = Infinity;
    var sampleCount = 500;
    
    for (var si = 0; si < sampleCount; si++) {
        var t = si / sampleCount;
        var samplePoint = trajectoryCurve.getPoint(t);
        var distToJupiter = samplePoint.distanceTo(jupiterPos);
        if (distToJupiter < closestApproachDist) {
            closestApproachDist = distToJupiter;
            closestApproachT = t;
        }
    }
    
    var closestApproachPos = trajectoryCurve.getPoint(closestApproachT);
    
    // --- CLOSEST APPROACH MARKER ---
    var closestApproachGroup = new THREE.Group();
    
    // Core sphere
    var closestApproachGeometry = new THREE.SphereGeometry(2.5, 16, 16);
    var closestApproachMaterial = new THREE.MeshBasicMaterial({ color: 0x66ffcc });
    closestApproachGroup.add(new THREE.Mesh(closestApproachGeometry, closestApproachMaterial));
    
    // Glow sphere
    var closestApproachGlowGeometry = new THREE.SphereGeometry(4, 16, 16);
    var closestApproachGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x66ffcc,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    closestApproachGroup.add(new THREE.Mesh(closestApproachGlowGeometry, closestApproachGlowMaterial));
    
    // Outer glow
    var closestApproachOuterGlowGeometry = new THREE.SphereGeometry(6, 16, 16);
    var closestApproachOuterGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x66ffcc,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    closestApproachGroup.add(new THREE.Mesh(closestApproachOuterGlowGeometry, closestApproachOuterGlowMaterial));
    
    // Ring around closest approach
    var closestApproachRingGeometry = new THREE.TorusGeometry(5, 0.3, 8, 32);
    var closestApproachRingMaterial = new THREE.MeshBasicMaterial({
        color: 0x66ffcc,
        transparent: true,
        opacity: 0.5
    });
    var closestApproachRing = new THREE.Mesh(closestApproachRingGeometry, closestApproachRingMaterial);
    closestApproachRing.rotation.x = Math.PI / 2;
    closestApproachGroup.add(closestApproachRing);
    
    // Closest approach label
    var closestApproachLabel = createTextSprite('CLOSEST APPROACH', '#66ffcc');
    closestApproachLabel.position.set(0, -20, 0);
    closestApproachLabel.scale.set(90, 22, 1);
    closestApproachGroup.add(closestApproachLabel);
    
    closestApproachGroup.position.copy(closestApproachPos);
    trajectoryGroup.add(closestApproachGroup);
    
    // --- Line connecting closest approach to Jupiter ---
    var approachLineGeometry = new THREE.BufferGeometry().setFromPoints([
        closestApproachPos,
        jupiterPos
    ]);
    var approachLineMaterial = new THREE.LineDashedMaterial({
        color: 0x66ffcc,
        transparent: true,
        opacity: 0.4,
        dashSize: 3,
        gapSize: 2
    });
    var approachLine = new THREE.Line(approachLineGeometry, approachLineMaterial);
    approachLine.computeLineDistances();
    trajectoryGroup.add(approachLine);
    
    var targetMarkerGeometry = new THREE.TorusGeometry(3.5, 0.3, 8, 32);
    var targetMarkerMaterial = new THREE.MeshBasicMaterial({
        color: 0x887799,
        transparent: true,
        opacity: 0.35
    });
    var targetMarker = new THREE.Mesh(targetMarkerGeometry, targetMarkerMaterial);
    targetMarker.position.copy(escapePos1);
    targetMarker.lookAt(jupiterGroup.position);
    trajectoryGroup.add(targetMarker);
    
    scene.add(trajectoryGroup);

    // --- INFO HUD ---
    var infoDiv = document.createElement('div');
    infoDiv.id = 'orbit-info';
    infoDiv.style.cssText = 'position:fixed;top:16px;left:16px;color:#aabbcc;font-family:Consolas,Monaco,monospace;font-size:10px;pointer-events:auto;line-height:1.4;z-index:100;max-width:280px;background:rgba(10,14,22,0.92);padding:28px 14px 14px 14px;border-radius:5px;border:1px solid rgba(110,130,150,0.4);box-shadow:0 6px 16px rgba(0,0,0,0.45);backdrop-filter:blur(6px);cursor:pointer;transition:all 0.2s ease;';
    infoDiv.setAttribute('role', 'button');
    infoDiv.setAttribute('aria-pressed', 'false');
    infoDiv.tabIndex = 0;
    document.body.appendChild(infoDiv);
    
    // Add hover effects to make it feel like a button
    infoDiv.addEventListener('mouseenter', function() {
        infoDiv.style.background = 'rgba(15,20,30,0.95)';
        infoDiv.style.borderColor = 'rgba(130,150,180,0.5)';
        infoDiv.style.boxShadow = '0 8px 20px rgba(0,0,0,0.5)';
    });
    infoDiv.addEventListener('mouseleave', function() {
        if (!focusLocked) {
            infoDiv.style.background = 'rgba(10,14,22,0.92)';
            infoDiv.style.borderColor = 'rgba(110,130,150,0.4)';
            infoDiv.style.boxShadow = '0 6px 16px rgba(0,0,0,0.45)';
        }
    });
    
    // Create text container for info content
    var infoText = document.createElement('div');
    infoText.id = 'orbit-info-text';
    infoDiv.appendChild(infoText);
    
    // --- FOCUS MODE WITH LOCK ---
    var focusLocked = false;
    
    // Camera transition state for smooth switching between modes
    var cameraTransitioning = false;
    var cameraTransitionProgress = 0;
    var cameraTransitionDuration = 1.5; // seconds
    var cameraTransitionStart = { x: 0, y: 0, z: 0 };
    var cameraTransitionTarget = { x: 0, y: 0, z: 0 };
    var cameraTransitionLookStart = { x: 0, y: 0, z: 0 };
    var cameraTransitionLookTarget = { x: 0, y: 0, z: 0 };
    var transitionStartTime = 0;
    var resumeAmbientTweenAfterTransition = false;
    
    // Two-phase unlock transition: first zoom out, then move to bird's eye
    var unlockTransitionPhase = 0; // 0 = not unlocking, 1 = zooming out, 2 = moving to bird's eye
    var cameraTransitionMidpoint = { x: 0, y: 0, z: 0 };
    var cameraTransitionLookMid = { x: 0, y: 0, z: 0 };
    
    // Lock icon (using ti-unlock/ti-lock icons)
    var lockIcon = document.createElement('span');
    lockIcon.id = 'focus-lock-icon';
    lockIcon.className = 'ti-unlock';
    lockIcon.title = 'Click to lock focus';
    lockIcon.style.cssText = 'position:absolute;top:8px;right:8px;font-size:10px;cursor:pointer;transition:all 0.2s ease;opacity:0;color:#666;';
    infoDiv.appendChild(lockIcon);
    
    function updateFocusButtonState(isActive) {
        infoDiv.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    function activateFocusMode() {
        if (!focusLocked && !document.body.classList.contains('bg-focus-mode')) {
            document.body.classList.add('bg-focus-mode');
            focusModeActive = true;
            targetCameraZ = focusCameraZ;
            // Show lock icon (gray/unlocked)
            lockIcon.style.opacity = '1';
            lockIcon.style.color = '#888';
            lockIcon.className = 'ti-unlock';
            updateFocusButtonState(true);
        }
    }
    
    function deactivateFocusMode() {
        if (!focusLocked && document.body.classList.contains('bg-focus-mode')) {
            document.body.classList.remove('bg-focus-mode');
            focusModeActive = false;
            targetCameraZ = baseCameraZ;
            // Hide lock icon
            lockIcon.style.opacity = '0';
            updateFocusButtonState(false);
        }
    }
    
    function toggleFocusMode() {
        if (focusLocked) {
            unlockFocus();
            return;
        }

        if (!document.body.classList.contains('bg-focus-mode')) {
            activateFocusMode();
        }

        lockFocus();
    }
    
    function lockFocus() {
        if (focusLocked) return;

        if (!document.body.classList.contains('bg-focus-mode')) {
            activateFocusMode();
        }

        // Start camera transition to follow comet
        var currentCurve = (window._orbitTrajectoryData && window._orbitTrajectoryData.curve) || trajectoryCurve;
        var cometPos = currentCurve.getPoint(animationProgress);
        
        cameraTransitionStart.x = camera.position.x;
        cameraTransitionStart.y = camera.position.y;
        cameraTransitionStart.z = camera.position.z;
        
        // Target: position camera behind/above comet
        var defaultDir = new THREE.Vector3(0, 0.3, 1).normalize();
        cameraTransitionTarget.x = cometPos.x + defaultDir.x * 500;
        cameraTransitionTarget.y = cometPos.y + defaultDir.y * 500;
        cameraTransitionTarget.z = cometPos.z + defaultDir.z * 500;
        
        // Look at transition
        cameraTransitionLookStart.x = 0;
        cameraTransitionLookStart.y = 0;
        cameraTransitionLookStart.z = 0;
        cameraTransitionLookTarget.x = cometPos.x;
        cameraTransitionLookTarget.y = cometPos.y;
        cameraTransitionLookTarget.z = cometPos.z;
        
        cameraTransitioning = true;
        cameraTransitionProgress = 0;
        transitionStartTime = performance.now();

        focusLocked = true;
        
        // Reset zoom distance to starting value when locking
        focusZoomDistance = 500;

        if (cameraAmbientTween) {
            cameraAmbientTween.pause();
        }
        
        lockIcon.className = 'ti-lock';
        lockIcon.style.color = '#fff';
        lockIcon.title = 'Focus locked (click outside or press ESC to exit)';
        document.body.classList.add('focus-locked');
        updateFocusButtonState(true);
        
        var audio = document.getElementById('glowmaster-audio');
        if (audio) {
            // Clear any existing fade (use global variable from scripts.js)
            if (typeof globalAudioFadeInterval !== 'undefined' && globalAudioFadeInterval) {
                clearInterval(globalAudioFadeInterval);
                globalAudioFadeInterval = null;
            }
            
            if (audio.paused) {
                // Start music from beginning with fade in to full volume
                audio.currentTime = 0;
                audio.volume = 0;
                audio.play().then(function() {
                    // Fade in to 1.0 over 3 seconds
                    globalAudioFadeInterval = setInterval(function() {
                        if (audio.volume < 1.0) {
                            audio.volume = Math.min(1.0, audio.volume + 1.0 / 60);
                        } else {
                            clearInterval(globalAudioFadeInterval);
                            globalAudioFadeInterval = null;
                        }
                    }, 50);
                    
                    // Update audio control UI
                    var audioBubble = document.getElementById('audio-control-bubble');
                    if (audioBubble) {
                        audioBubble.classList.add('playing');
                        var icon = audioBubble.querySelector('.audio-icon');
                        if (icon) {
                            icon.classList.remove('ti-control-play');
                            icon.classList.add('ti-control-pause');
                        }
                    }
                }).catch(function(e) {
                    console.warn('Audio playback failed:', e);
                });
            } else {
                // Already playing, fade up to full volume
                globalAudioFadeInterval = setInterval(function() {
                    if (audio.volume < 1.0) {
                        audio.volume = Math.min(1.0, audio.volume + 0.5 / 40); // Fade up over ~2s
                    } else {
                        clearInterval(globalAudioFadeInterval);
                        globalAudioFadeInterval = null;
                    }
                }, 50);
            }
        }
    }
    
    function unlockFocus() {
        // Two-phase transition: first zoom out from comet, then rotate to bird's eye
        var currentCurve = (window._orbitTrajectoryData && window._orbitTrajectoryData.curve) || trajectoryCurve;
        var cometPos = currentCurve.getPoint(animationProgress);
        
        // Phase 1 start: current camera position (close to comet)
        cameraTransitionStart.x = camera.position.x;
        cameraTransitionStart.y = camera.position.y;
        cameraTransitionStart.z = camera.position.z;
        
        // Phase 1 target (midpoint): zoom out from comet to a distant view
        // Position camera at a distance looking at comet, but pulled back
        var dirFromComet = new THREE.Vector3(
            camera.position.x - cometPos.x,
            camera.position.y - cometPos.y,
            camera.position.z - cometPos.z
        ).normalize();
        
        // Midpoint: far from comet (500 units) in same direction
        cameraTransitionMidpoint.x = cometPos.x + dirFromComet.x * 400;
        cameraTransitionMidpoint.y = cometPos.y + dirFromComet.y * 400 + 100; // Rise up a bit
        cameraTransitionMidpoint.z = cometPos.z + dirFromComet.z * 400;
        
        // Phase 2 target: bird's eye view position
        cameraTransitionTarget.x = -80;
        cameraTransitionTarget.y = 180;
        cameraTransitionTarget.z = 220;
        
        // Look at transitions
        // Phase 1: keep looking at comet
        cameraTransitionLookStart.x = cometPos.x;
        cameraTransitionLookStart.y = cometPos.y;
        cameraTransitionLookStart.z = cometPos.z;
        cameraTransitionLookMid.x = cometPos.x;
        cameraTransitionLookMid.y = cometPos.y;
        cameraTransitionLookMid.z = cometPos.z;
        // Phase 2: transition to scene center
        cameraTransitionLookTarget.x = 0;
        cameraTransitionLookTarget.y = 0;
        cameraTransitionLookTarget.z = 0;
        
        cameraTransitioning = true;
        cameraTransitionProgress = 0;
        transitionStartTime = performance.now();
        resumeAmbientTweenAfterTransition = true;
        unlockTransitionPhase = 1; // Start with phase 1 (zoom out)
        
        focusLocked = false;
        lockIcon.className = 'ti-unlock';
        lockIcon.style.color = '#888';
        lockIcon.title = 'Click to lock focus';
        document.body.classList.remove('focus-locked');
        deactivateFocusMode();
        
        // Don't resume ambient tween yet - wait for transition to complete
        
        // Fade volume down to 50%
        var audio = document.getElementById('glowmaster-audio');
        if (audio && !audio.paused) {
            if (typeof globalAudioFadeInterval !== 'undefined' && globalAudioFadeInterval) {
                clearInterval(globalAudioFadeInterval);
            }
            globalAudioFadeInterval = setInterval(function() {
                if (audio.volume > 0.5) {
                    audio.volume = Math.max(0.5, audio.volume - 0.5 / 40); // Fade down over ~2s
                } else {
                    clearInterval(globalAudioFadeInterval);
                    globalAudioFadeInterval = null;
                }
            }, 50);
        }
    }
    
    function requestFocusToggle() {
        toggleFocusMode();
    }

    function shouldIgnoreFocusToggleTarget(target) {
        return lockIcon.contains(target);
    }

    function handleInfoPanelPointerUp(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (shouldIgnoreFocusToggleTarget(e.target)) return;
        requestFocusToggle();
    }

    // Info panel acts as a large toggle target; pointer-based to remain stable while text updates
    infoDiv.addEventListener('pointerup', handleInfoPanelPointerUp);

    infoDiv.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            requestFocusToggle();
        }
    });
    
    lockIcon.addEventListener('pointerup', function(e) {
        e.stopPropagation();
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        requestFocusToggle();
    });

    lockIcon.addEventListener('click', function(e) {
        // Prevent synthetic click double-trigger after pointerup
        if (e.detail !== 0) return;
        e.stopPropagation();
        requestFocusToggle();
    });
    
    lockIcon.addEventListener('mouseenter', function() {
        lockIcon.style.transform = 'scale(1.2)';
    });
    lockIcon.addEventListener('mouseleave', function() {
        lockIcon.style.transform = 'scale(1)';
    });
    
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.body.classList.contains('bg-focus-mode')) {
            unlockFocus();
        }
    });
    
    // Any click outside info panel unlocks
    document.addEventListener('click', function(e) {
        if (focusLocked && !infoDiv.contains(e.target)) {
            unlockFocus();
        }
    });
    
    // Mouse wheel zoom when focus is locked - zoom distance from comet
    var focusZoomDistance = 500;  // Current distance from comet when locked (start far)
    var minFocusDistance = 2;     // Super close (comet fills screen)
    var maxFocusDistance = 500;   // Never smaller than initial size
    
    document.addEventListener('wheel', function(e) {
        if (focusLocked) {
            // Don't capture wheel events on volume control or other UI elements
            var volumeContainer = document.getElementById('volume-slider-container');
            var audioControl = document.getElementById('audio-control-bubble');
            if (volumeContainer && volumeContainer.contains(e.target)) {
                return; // Let volume control handle it
            }
            if (audioControl && audioControl.contains(e.target)) {
                return; // Let audio control handle it
            }
            
            e.preventDefault();
            e.stopPropagation();
            // Scroll down = zoom out (increase distance), scroll up = zoom in (decrease distance)
            // ~166 per scroll = 3 scrolls to go full range (500 / 3)
            var zoomDelta = e.deltaY > 0 ? 166 : -166;
            focusZoomDistance = Math.max(minFocusDistance, Math.min(maxFocusDistance, focusZoomDistance + zoomDelta));
        }
    }, { passive: false, capture: true });
    // --- /FOCUS MODE WITH LOCK ---

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

    // --- GSAP CINEMATIC INTRO & CONTINUOUS MOTION (added) ---
    var cameraAmbientTween = null;

    if (typeof gsap !== 'undefined') {
        // Collect emissive parts for opacity handling (materials only)
        var sunEmitters = sunGroup.children.filter(function(c){return c.material && c !== sunMesh;});
        var jupiterElements = jupiterGroup.children.filter(function(c){return c.material;});
        var cometAtmos = cometGroup.children.filter(function(c){return c.material && c !== cometGroup.children[0];});

        // Initial states (use scale vector components; opacity on materials)
        gsap.set(sunGroup.scale, { x:0.6, y:0.6, z:0.6 });
        sunEmitters.forEach(function(m){ if(m.material.opacity) m.material.opacity *= 0.01; });
        gsap.set(jupiterGroup.scale, { x:0.4, y:0.4, z:0.4 });
        jupiterElements.forEach(function(b){ if(b.material.opacity) b.material.opacity *= 0.01; });
        gsap.set(cometGroup.scale, { x:0.01, y:0.01, z:0.01 });
        cometAtmos.forEach(function(a){ if(a.material.opacity) a.material.opacity *= 0.2; });
        hillGroup.children.forEach(function(h){ if(h.material && h.material.opacity !== undefined) h.material.opacity = 0; });
        gsap.set(infoDiv, { autoAlpha: 0, y: -20 });
        gsap.set(camera.position, { z: 550, y: 400, x: -200 });

        var introTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        introTl
            .to(sunGroup.scale, { duration: 2.2, x:1, y:1, z:1 })
            .to(camera.position, { duration: 3.5, z: 220, y: 180, x: -80, onUpdate: function(){ camera.lookAt(0,0,0); }}, 0)
            .to(jupiterGroup.scale, { duration: 2.5, x:1, y:1, z:1}, 0.6)
            .to(cometGroup.scale, { duration: 1.8, x:1, y:1, z:1}, 1.2)
            .to(hillGroup.children.filter(function(h){return h.material;}).map(function(h){return h.material;}), { duration: 2, opacity: function(i){ return i===0?0.5:i===1?0.4:0.7; }}, 1.5)
            .to(sunEmitters.filter(function(m){return m.material;}).map(function(m){return m.material;}), { duration:1.8, opacity:function(){return 0.05 + Math.random()*0.07;} }, 1.0)
            .to(jupiterElements.filter(function(b){return b.material;}).map(function(b){return b.material;}), { duration:2, opacity: function(){return 0.8;} }, 1.2)
            .to(infoDiv, { duration: 1.2, autoAlpha: 1, y: 0}, 2.0)
            .addLabel('postIntro')
            .to(sunGroup.rotation, { duration: 6, y: '+=0.6', ease: 'power1.inOut' }, 'postIntro');

        if (dottedTrajectoryMaterial) {
            introTl.from(dottedTrajectoryMaterial, { duration: 2, opacity: 0 }, 'postIntro');
        }

        // Continuous ambient motions
        sunEmitters.forEach(function(m,i){
            if(m.material) gsap.to(m.material, { duration: 6+ i, opacity: '+=0.03', repeat:-1, yoyo:true, ease:'sine.inOut', delay: 2 + i*0.3 });
        });
        gsap.to(jupiterGroup.rotation, { duration: 40, y: '+=6.283', repeat: -1, ease: 'none' });
        cameraAmbientTween = gsap.to(camera.position, { duration: 12, y: '+=20', x: '-=15', repeat: -1, yoyo: true, ease: 'sine.inOut', onUpdate: function(){ if (!cameraTransitioning && !focusLocked) camera.lookAt(0,0,0); } });
        gsap.to(infoDiv, { duration: 3, boxShadow: '0 0 40px rgba(0,255,255,0.35), inset 0 0 25px rgba(0,255,255,0.08)', repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 4});
    }

    var frameCount = 0;
    
    function animate() {
        requestAnimationFrame(animate);
        frameCount++;
        
        var time = clock.getElapsedTime();
        
        // Get comet position first (needed for focus camera)
        var currentCurve = (window._orbitTrajectoryData && window._orbitTrajectoryData.curve) || trajectoryCurve;
        var cometPos = currentCurve.getPoint(animationProgress);
        cometGroup.position.copy(cometPos);
        
        // Smooth easing function for camera transitions
        function easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }
        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }
        
        // Camera control based on focus state and transition
        if (cameraTransitioning) {
            var elapsed = (performance.now() - transitionStartTime) / 1000;
            
            // Two-phase unlock transition running in parallel
            if (unlockTransitionPhase === 1) {
                // Both animations run simultaneously but at different rates
                // Zoom out: faster (1.2s), Rotation: slower (2s)
                var zoomDuration = 1.2;
                var rotateDuration = 2.0;
                
                var zoomProgress = Math.min(elapsed / zoomDuration, 1);
                var rotateProgress = Math.min(elapsed / rotateDuration, 1);
                
                var zoomEased = easeOutCubic(zoomProgress);  // Fast start, slow end for zoom
                var rotateEased = easeInOutCubic(rotateProgress);  // Smooth for rotation
                
                // Blend position: zoom out fast, rotate to bird's eye slower
                // Start -> Midpoint (zoom) blended with Start -> Target (rotation)
                var zoomX = cameraTransitionStart.x + (cameraTransitionMidpoint.x - cameraTransitionStart.x) * zoomEased;
                var zoomY = cameraTransitionStart.y + (cameraTransitionMidpoint.y - cameraTransitionStart.y) * zoomEased;
                var zoomZ = cameraTransitionStart.z + (cameraTransitionMidpoint.z - cameraTransitionStart.z) * zoomEased;
                
                // Blend zoom position toward final target based on rotation progress
                camera.position.x = zoomX + (cameraTransitionTarget.x - zoomX) * rotateEased;
                camera.position.y = zoomY + (cameraTransitionTarget.y - zoomY) * rotateEased;
                camera.position.z = zoomZ + (cameraTransitionTarget.z - zoomZ) * rotateEased;
                
                // Look-at: start looking at comet, transition to scene center
                var lookX = cameraTransitionLookStart.x + (cameraTransitionLookTarget.x - cameraTransitionLookStart.x) * rotateEased;
                var lookY = cameraTransitionLookStart.y + (cameraTransitionLookTarget.y - cameraTransitionLookStart.y) * rotateEased;
                var lookZ = cameraTransitionLookStart.z + (cameraTransitionLookTarget.z - cameraTransitionLookStart.z) * rotateEased;
                camera.lookAt(lookX, lookY, lookZ);
                
                // End transition when both complete
                if (zoomProgress >= 1 && rotateProgress >= 1) {
                    cameraTransitioning = false;
                    unlockTransitionPhase = 0;
                    
                    // Resume ambient tween
                    if (resumeAmbientTweenAfterTransition && cameraAmbientTween) {
                        cameraAmbientTween.kill();
                        cameraAmbientTween = gsap.to(camera.position, { 
                            duration: 12, 
                            y: '+=20', 
                            x: '-=15', 
                            repeat: -1, 
                            yoyo: true, 
                            ease: 'sine.inOut', 
                            onUpdate: function(){ 
                                if (!cameraTransitioning && !focusLocked) {
                                    camera.lookAt(0,0,0); 
                                }
                            } 
                        });
                        resumeAmbientTweenAfterTransition = false;
                    }
                }
            } else {
                // Single-phase transition (for locking focus)
                cameraTransitionProgress = Math.min(elapsed / cameraTransitionDuration, 1);
                var eased = easeInOutCubic(cameraTransitionProgress);
                
                // Interpolate camera position
                camera.position.x = cameraTransitionStart.x + (cameraTransitionTarget.x - cameraTransitionStart.x) * eased;
                camera.position.y = cameraTransitionStart.y + (cameraTransitionTarget.y - cameraTransitionStart.y) * eased;
                camera.position.z = cameraTransitionStart.z + (cameraTransitionTarget.z - cameraTransitionStart.z) * eased;
                
                // Interpolate look-at target
                var lookX = cameraTransitionLookStart.x + (cameraTransitionLookTarget.x - cameraTransitionLookStart.x) * eased;
                var lookY = cameraTransitionLookStart.y + (cameraTransitionLookTarget.y - cameraTransitionLookStart.y) * eased;
                var lookZ = cameraTransitionLookStart.z + (cameraTransitionLookTarget.z - cameraTransitionLookStart.z) * eased;
                camera.lookAt(lookX, lookY, lookZ);
                
                // Update transition target for focus mode (comet moves during transition)
                if (focusLocked) {
                    var defaultDir = new THREE.Vector3(0, 0.3, 1).normalize();
                    cameraTransitionTarget.x = cometPos.x + defaultDir.x * focusZoomDistance;
                    cameraTransitionTarget.y = cometPos.y + defaultDir.y * focusZoomDistance;
                    cameraTransitionTarget.z = cometPos.z + defaultDir.z * focusZoomDistance;
                    cameraTransitionLookTarget.x = cometPos.x;
                    cameraTransitionLookTarget.y = cometPos.y;
                    cameraTransitionLookTarget.z = cometPos.z;
                }
                
                // End transition
                if (cameraTransitionProgress >= 1) {
                    cameraTransitioning = false;
                    
                    // Resume ambient tween after unlocking transition completes
                    if (resumeAmbientTweenAfterTransition && cameraAmbientTween) {
                        cameraAmbientTween.kill();
                        cameraAmbientTween = gsap.to(camera.position, { 
                            duration: 12, 
                            y: '+=20', 
                            x: '-=15', 
                            repeat: -1, 
                            yoyo: true, 
                            ease: 'sine.inOut', 
                            onUpdate: function(){ 
                                if (!cameraTransitioning && !focusLocked) {
                                    camera.lookAt(0,0,0); 
                                }
                            } 
                        });
                        resumeAmbientTweenAfterTransition = false;
                    }
                }
            }
        } else if (focusLocked) {
            // When focus locked, position camera at focusZoomDistance from comet
            // Calculate direction from comet to current camera position
            var dirX = camera.position.x - cometPos.x;
            var dirY = camera.position.y - cometPos.y;
            var dirZ = camera.position.z - cometPos.z;
            var dist = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
            
            // Normalize direction
            if (dist > 0.1) {
                dirX /= dist;
                dirY /= dist;
                dirZ /= dist;
            } else {
                // Default direction if too close
                dirX = 0;
                dirY = 0.3;
                dirZ = 1;
            }
            
            // Target position at focusZoomDistance along this direction
            var targetX = cometPos.x + dirX * focusZoomDistance;
            var targetY = cometPos.y + dirY * focusZoomDistance;
            var targetZ = cometPos.z + dirZ * focusZoomDistance;
            
            // Smooth interpolation to target position
            camera.position.x += (targetX - camera.position.x) * 0.05;
            camera.position.y += (targetY - camera.position.y) * 0.05;
            camera.position.z += (targetZ - camera.position.z) * 0.05;
            // Always look at comet
            camera.lookAt(cometPos);
        } else {
            // Normal zoom interpolation
            var zoomDiff = targetCameraZ - camera.position.z;
            if (Math.abs(zoomDiff) > 0.05) {
                camera.position.z += zoomDiff * 0.008;
            }
        }

        parallaxStarLayers.forEach(function(layer, index) {
            layer.mesh.rotation.y += 0.00008 * (index + 1);
            layer.mesh.position.x = Math.sin(time * 0.05 * (layer.depth + 0.3)) * (60 + layer.depth * 150);
            layer.mesh.position.z = Math.cos(time * 0.04 * (layer.depth + 0.5)) * (50 + layer.depth * 120);
            layer.mesh.position.y = Math.sin(time * 0.03 * (layer.depth + 0.2)) * (30 + layer.depth * 80);
        });

        animationProgress += animationSpeed;
        if (animationProgress > 1) animationProgress = 0;
        
        // Update comet date/time label
        updateCometDateLabel(animationProgress);
        
        // Update lit trail - shows comet's traveled path with gradient fade
        if (trajectoryData && trajectoryData.litTrailGeometry) {
            var litPositions = trajectoryData.litTrailGeometry.attributes.position.array;
            var litColors = trajectoryData.litTrailGeometry.attributes.color.array;
            var litSizes = trajectoryData.litTrailGeometry.attributes.size.array;
            var litAlphas = trajectoryData.litTrailGeometry.attributes.alpha.array;
            var trailCount = trajectoryData.litTrailCount;
            
            for (var lt = 0; lt < trailCount; lt++) {
                // Trail spans from (progress - trailLength) to progress
                var trailLength = 0.08; // 8% of journey behind comet (shorter for longer journey)
                var trailT = animationProgress - trailLength + (lt / trailCount) * trailLength;
                if (trailT < 0) trailT = 0;
                if (trailT > 1) trailT = 1;
                
                var trailPos = currentCurve.getPoint(trailT);
                litPositions[lt * 3] = trailPos.x;
                litPositions[lt * 3 + 1] = trailPos.y;
                litPositions[lt * 3 + 2] = trailPos.z;
                
                // Fade from invisible at tail to bright at head
                var fade = lt / trailCount;
                var pulse = 0.7 + Math.sin(time * 4 + lt * 0.2) * 0.3;
                litColors[lt * 3] = 0.6 + fade * 0.4 * pulse;
                litColors[lt * 3 + 1] = 0.7 + fade * 0.3 * pulse;
                litColors[lt * 3 + 2] = 0.9 + fade * 0.1;
                
                litSizes[lt] = (0.8 + fade * 2.5) * pulse;
                
                // Alpha fades from 0 at tail to 1 at head (cubic easing for smoother fade)
                litAlphas[lt] = Math.pow(fade, 2.0) * 0.95;
            }
            trajectoryData.litTrailGeometry.attributes.position.needsUpdate = true;
            trajectoryData.litTrailGeometry.attributes.color.needsUpdate = true;
            trajectoryData.litTrailGeometry.attributes.size.needsUpdate = true;
            trajectoryData.litTrailGeometry.attributes.alpha.needsUpdate = true;
        }
        
        var distFromSun = cometPos.length() / AU_TO_PIXELS;
        var distToJupiter = cometPos.distanceTo(jupiterGroup.position) / AU_TO_PIXELS;
        var distToHillEdge = Math.max(0, distToJupiter - jupiterHillRadius);
        
        var sunDir = cometPos.clone().normalize();
        var tailLength = Math.max(80, 250 / Math.max(0.5, distFromSun));
        
        var positions = tailParticles.geometry.attributes.position.array;
        var colors = tailParticles.geometry.attributes.color.array;
        
        // Tail points AWAY from sun
        var tailDirX = sunDir.x;
        var tailDirY = sunDir.y;
        var tailDirZ = sunDir.z;
        
        // Create orthonormal basis for 3D volumetric spread
        // Find a vector not parallel to tailDir for cross product
        var upX = 0, upY = 1, upZ = 0;
        if (Math.abs(tailDirY) > 0.9) { upX = 1; upY = 0; upZ = 0; }
        
        // First perpendicular (cross product: up × tailDir)
        var perp1X = upY * tailDirZ - upZ * tailDirY;
        var perp1Y = upZ * tailDirX - upX * tailDirZ;
        var perp1Z = upX * tailDirY - upY * tailDirX;
        var perp1Len = Math.sqrt(perp1X * perp1X + perp1Y * perp1Y + perp1Z * perp1Z);
        perp1X /= perp1Len; perp1Y /= perp1Len; perp1Z /= perp1Len;
        
        // Second perpendicular (cross product: tailDir × perp1)
        var perp2X = tailDirY * perp1Z - tailDirZ * perp1Y;
        var perp2Y = tailDirZ * perp1X - tailDirX * perp1Z;
        var perp2Z = tailDirX * perp1Y - tailDirY * perp1X;
        
        for (var i = 0; i < tailParticleCount; i++) {
            var t = i / tailParticleCount;
            
            // Animated flow - particles drift outward over time
            var flowOffset = (time * 0.5 + i * 0.01) % 1.0;
            var animT = (t + flowOffset) % 1.0;
            
            var length = animT * tailLength;
            var spread = animT * 30; // Increased spread for more volume
            var curveAmount = animT * animT * 10;
            
            // Get pre-computed random offsets (range -1 to 1)
            var offX = tailOffsets[i * 3];
            var offY = tailOffsets[i * 3 + 1];
            var offZ = tailOffsets[i * 3 + 2];
            
            // Convert to cylindrical-ish 3D distribution around tail axis
            var angle = offX * Math.PI + time * 0.3 + i * 0.05; // Rotating spiral
            var radius = (0.3 + offY * 0.7) * spread; // Radial distance from tail axis
            var axialJitter = offZ * spread * 0.3; // Jitter along tail direction
            
            // Subtle wave motion in 3D
            var wave = Math.sin(time * 2 + i * 0.1) * animT * 2;
            var wave2 = Math.cos(time * 1.5 + i * 0.15) * animT * 2;
            
            // Position = comet + along tail + radial spread in perp1/perp2 plane + curve
            var radialX = Math.cos(angle) * radius;
            var radialY = Math.sin(angle) * radius;
            
            positions[i * 3] = cometPos.x + tailDirX * (length + axialJitter) 
                + perp1X * (radialX + wave) + perp2X * (radialY + wave2) + tailDirX * curveAmount * 0.5;
            positions[i * 3 + 1] = cometPos.y + tailDirY * (length + axialJitter) 
                + perp1Y * (radialX + wave) + perp2Y * (radialY + wave2);
            positions[i * 3 + 2] = cometPos.z + tailDirZ * (length + axialJitter) 
                + perp1Z * (radialX + wave) + perp2Z * (radialY + wave2) + tailDirZ * curveAmount * 0.5;
            
            // Animated color - particles fade as they flow outward
            var fade = 1 - animT;
            var shimmer = 0.8 + Math.sin(time * 4 + i * 0.2) * 0.2;
            colors[i * 3] = (0.5 + fade * 0.5) * shimmer;
            colors[i * 3 + 1] = (0.7 + fade * 0.3) * shimmer;
            colors[i * 3 + 2] = shimmer;
        }
        tailParticles.geometry.attributes.position.needsUpdate = true;
        tailParticles.geometry.attributes.color.needsUpdate = true;

        // Ion tail with 3D wave animation - uses same perp basis
        var ionLength = tailLength * 1.5;
        var ionPosAttr = ionTailGeometry.attributes.position.array;
        
        for (var ion = 0; ion <= ionSegments; ion++) {
            var ionT = ion / ionSegments;
            // 3D spiral wave effect
            var ionAngle = time * 2 + ionT * 8;
            var ionWaveRadius = ionT * ionT * 6;
            var ionWaveX = Math.cos(ionAngle) * ionWaveRadius;
            var ionWaveY = Math.sin(ionAngle) * ionWaveRadius;
            
            ionPosAttr[ion * 3] = cometPos.x + tailDirX * ionT * ionLength 
                + perp1X * ionWaveX + perp2X * ionWaveY;
            ionPosAttr[ion * 3 + 1] = cometPos.y + tailDirY * ionT * ionLength 
                + perp1Y * ionWaveX + perp2Y * ionWaveY;
            ionPosAttr[ion * 3 + 2] = cometPos.z + tailDirZ * ionT * ionLength 
                + perp1Z * ionWaveX + perp2Z * ionWaveY;
        }
        ionTailGeometry.attributes.position.needsUpdate = true;
        
        // Animate ion tail opacity
        ionTailMaterial.opacity = 0.4 + Math.sin(time * 2) * 0.2;

        comaMesh.scale.setScalar(1 + Math.sin(time * 3) * 0.1);
        
        sunGroup.children.forEach(function(child, i) {
            if (i > 5) {
                child.rotation.z += 0.001;
                child.material.opacity = 0.08 + Math.sin(time * 2 + i) * 0.04;
            }
        });

        jupiterGroup.rotation.y += 0.0008;
        
        // --- HILL RADIUS RING --- //
        // Gentle rotation animation for the Hill radius ring
        if (hillRingDots) {
            hillRingDots.rotation.y += 0.001;
        }
        // --- /HILL RADIUS RING --- //

        targetMarker.rotation.z = time * 2;
        targetMarker.material.opacity = 0.5 + Math.sin(time * 4) * 0.3;
        
        // Animate perihelion marker
        perihelionRing.rotation.z = time * 1.5;
        perihelionRingMaterial.opacity = 0.4 + Math.sin(time * 3) * 0.2;
        
        // Animate closest approach marker
        closestApproachRing.rotation.z = -time * 1.5;
        closestApproachRingMaterial.opacity = 0.4 + Math.sin(time * 3 + 1) * 0.2;
        
        // Animate Hill sphere entry marker
        hillEntryRing.rotation.z = time * 2;
        hillEntryGlowMaterial.opacity = 0.3 + Math.sin(time * 4) * 0.2;
        hillEntryOuterGlowMaterial.opacity = 0.1 + Math.sin(time * 3 + 0.5) * 0.08;
        hillEntryRingMaterial.opacity = 0.4 + Math.sin(time * 4 + 1) * 0.25;
        
        // Animate Hill sphere exit marker
        hillExitRing.rotation.z = -time * 2;
        hillExitGlowMaterial.opacity = 0.3 + Math.sin(time * 4 + 2) * 0.2;
        hillExitOuterGlowMaterial.opacity = 0.1 + Math.sin(time * 3 + 2.5) * 0.08;
        hillExitRingMaterial.opacity = 0.4 + Math.sin(time * 4 + 3) * 0.25;

        targetRotation.x = mouse.y * 0.15;
        targetRotation.y = mouse.x * 0.25;
        
        scene.rotation.x += (targetRotation.x - scene.rotation.x) * 0.02;
        scene.rotation.y += (targetRotation.y - scene.rotation.y) * 0.02;
        scene.rotation.y += 0.0003;

        if (dottedTrajectoryMaterial) {
            // Subtle pulse on the faint full path
            dottedTrajectoryMaterial.opacity = 0.35 + Math.sin(time * 1.5) * 0.1;
        }

        var now = new Date();
        var daysSincePerihelion = Math.round((now - cometData.perihelionDate) / (1000 * 60 * 60 * 24));
        var simulatedDay = Math.round(animationProgress * totalJourneyDays);
        
        var inHillSphere = distToJupiter < jupiterHillRadius;
        var approachingHill = distToHillEdge < 0.3 && distToHillEdge > 0;
        var beyondHill = animationProgress > 0.75;
        
        // Check if near perihelion (closest approach to sun)
        var distToPerihelion = cometPos.distanceTo(perihelionPos);
        var nearPerihelion = distToPerihelion < 50; // Within 50 pixels of perihelion point
        
        // Animated glow effect on info panel based on current phase
        var glowColor, glowIntensity;
        var pulseSpeed = time * 2;
        var pulse = 0.4 + Math.sin(pulseSpeed) * 0.3;
        
        if (nearPerihelion) {
            // Near perihelion - bright golden glow
            var perihelionPulse = 0.5 + Math.sin(pulseSpeed * 1.5) * 0.4;
            glowColor = 'rgba(255, 215, 0, ' + perihelionPulse + ')';
            glowIntensity = 15 + Math.sin(pulseSpeed * 1.5) * 5;
            infoDiv.style.borderColor = 'rgba(255, 215, 0, 0.7)';
        } else if (inHillSphere) {
            // Inside Hill sphere - bright cyan/teal glow like perihelion
            var hillPulse = 0.5 + Math.sin(pulseSpeed * 1.5) * 0.4;
            glowColor = 'rgba(100, 220, 255, ' + hillPulse + ')';
            glowIntensity = 15 + Math.sin(pulseSpeed * 1.5) * 5;
            infoDiv.style.borderColor = 'rgba(100, 220, 255, 0.7)';
        } else if (approachingHill) {
            // Approaching - soft amber glow
            glowColor = 'rgba(170, 150, 100, ' + (pulse * 0.7) + ')';
            glowIntensity = 8 + Math.sin(pulseSpeed) * 3;
            infoDiv.style.borderColor = 'rgba(170, 150, 100, 0.5)';
        } else if (beyondHill) {
            // Exited - cool blue glow (mission complete feel)
            glowColor = 'rgba(100, 150, 180, ' + (pulse * 0.6) + ')';
            glowIntensity = 8 + Math.sin(pulseSpeed) * 3;
            infoDiv.style.borderColor = 'rgba(100, 150, 180, 0.5)';
        } else if (animationProgress < 0.15) {
            // Early journey - cyan/comet color
            glowColor = 'rgba(68, 200, 220, ' + (pulse * 0.5) + ')';
            glowIntensity = 6 + Math.sin(pulseSpeed) * 2;
            infoDiv.style.borderColor = 'rgba(68, 200, 220, 0.4)';
        } else {
            // Default - subtle neutral glow
            glowColor = 'rgba(110, 130, 150, ' + (pulse * 0.3) + ')';
            glowIntensity = 4 + Math.sin(pulseSpeed) * 2;
            infoDiv.style.borderColor = 'rgba(110, 130, 150, 0.4)';
        }
        
        infoDiv.style.boxShadow = '0 6px 16px rgba(0,0,0,0.45), 0 0 ' + glowIntensity + 'px ' + glowColor + ', inset 0 0 ' + (glowIntensity * 0.3) + 'px ' + glowColor;

        // Only update info div every 10 frames to reduce DOM manipulation
        if (frameCount % 10 === 0) infoText.innerHTML = 
            '<div style="font-size:11px;font-weight:600;margin-bottom:6px;color:#bbc;letter-spacing:0.5px;">3I/ATLAS</div>' +
            '<div style="font-size:8px;color:#778;margin-bottom:8px;line-height:1.2;">Interstellar visitor • Hyperbolic trajectory<br>Post-perihelion phase</div>' +
            '<div style="border-top:1px solid rgba(100,120,140,0.2);padding-top:6px;margin-bottom:6px;">' +
            '<span style="color:#999;">r☉</span> <span style="color:#dde;">' + distFromSun.toFixed(3) + '</span> <span style="color:#778;font-size:8px;">AU</span> ' +
            '<span style="color:#999;">│ t</span> <span style="color:#dde;">+' + daysSincePerihelion + '</span> <span style="color:#778;font-size:8px;">d</span><br>' +
            '<span style="color:#999;">v∞</span> <span style="color:#dde;">' + cometData.vInfinity + '</span> <span style="color:#778;font-size:8px;">km/s</span> ' +
            '<span style="color:#999;">│ q</span> <span style="color:#dde;">' + cometData.perihelionDistance.toFixed(2) + '</span> <span style="color:#778;font-size:8px;">AU</span></div>' +
            '<div style="border-top:1px solid rgba(100,120,140,0.2);padding-top:6px;">' +
            '<span style="color:#999;">r♃</span> <span style="color:#dde;">' + distToJupiter.toFixed(3) + '</span> <span style="color:#778;font-size:8px;">AU</span> ' +
            '<span style="color:#999;">│ r<sub style="font-size:7px;">H</sub></span> <span style="color:#dde;">' + jupiterHillRadius.toFixed(4) + '</span> <span style="color:#778;font-size:8px;">AU</span><br>' +
            '<span style="color:#999;">Δr<sub style="font-size:7px;">H</sub></span> <span style="color:#dde;">' + distToHillEdge.toFixed(4) + '</span> <span style="color:#778;font-size:8px;">AU</span> ' +
            '<span style="color:#999;">│ Tsim</span> <span style="color:#dde;">+' + simulatedDay + '</span> <span style="color:#778;font-size:8px;">d</span></div>' +
            (inHillSphere ? '<div style="color:#cc9;font-size:9px;margin-top:6px;border-top:1px solid rgba(200,200,100,0.3);padding-top:4px;">⚠ INSIDE HILL SPHERE</div>' : '') +
            (approachingHill && !inHillSphere ? '<div style="color:#aa9;font-size:9px;margin-top:6px;">▸ Approaching capture zone</div>' : '') +
            (beyondHill && !inHillSphere ? '<div style="color:#9aa;font-size:9px;margin-top:6px;">◂ Exited Hill sphere</div>' : '');

        renderer.render(scene, camera);
    }

    var style = document.createElement('style');
    style.textContent = '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }';
    document.head.appendChild(style);

    animate();

    $('#canvas-orbit').css('opacity', 1);
    $('body').append('<div class="bg-color" style="background-color:#000000"></div>');
}
