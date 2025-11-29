function orbitBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = 'canvas-orbit';
    document.getElementById('main').appendChild(renderer.domElement);

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.z = 400;
    camera.position.y = 150;
    camera.lookAt(0, 0, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    // --- SCALE PARAMETERS ---
    var AU_TO_PIXELS = 40; // 1 AU = 40 pixels for visualization
    var SUN_MASS = 1.989e30; // kg
    var JUPITER_MASS = 1.898e27; // kg
    
    // --- C/2024 G3 ATLAS Comet Data ---
    // Orbital elements from JPL Horizons (approximate current values)
    var cometData = {
        name: 'C/2024 G3 (ATLAS)',
        eccentricity: 0.9997, // Near-parabolic orbit
        perihelionDistance: 0.091, // AU - very close to Sun
        inclination: 45.0, // degrees (approximate)
        longitudeAscendingNode: 150.0, // degrees (approximate)
        argumentPerihelion: 130.0, // degrees (approximate)
        perihelionDate: new Date('2025-01-13'), // Perihelion passage
        color: 0x00ffff,
        tailColor: 0x66ffff
    };
    
    // Jupiter orbital data for Hill radius reference
    var jupiterData = {
        semiMajorAxis: 5.2, // AU
        eccentricity: 0.0489,
        mass: JUPITER_MASS,
        color: 0xffa500
    };

    // Calculate Jupiter's Hill Radius
    // Hill radius = a * (m / 3M)^(1/3)
    var jupiterHillRadius = jupiterData.semiMajorAxis * Math.pow(JUPITER_MASS / (3 * SUN_MASS), 1/3);
    var jupiterHillRadiusPixels = jupiterHillRadius * AU_TO_PIXELS;

    // --- TRAJECTORY DATA FROM NASA JPL HORIZONS ---
    var trajectoryPoints = [];
    var currentCometPosition = new THREE.Vector3();
    var cometVelocity = new THREE.Vector3();
    var dataLoaded = false;
    var apiError = false;
    var lastFetchTime = 0;
    var fetchInterval = 60000; // Refresh every 60 seconds

    // --- INFO TEXT HUD ---
    var infoDiv = document.createElement('div');
    infoDiv.id = 'orbit-info';
    infoDiv.style.position = 'absolute';
    infoDiv.style.top = '20px';
    infoDiv.style.left = '20px';
    infoDiv.style.color = '#00ffff';
    infoDiv.style.fontFamily = 'monospace';
    infoDiv.style.fontSize = '11px';
    infoDiv.style.pointerEvents = 'none';
    infoDiv.style.textShadow = '0 0 10px rgba(0, 255, 255, 0.8)';
    infoDiv.style.lineHeight = '1.5';
    infoDiv.style.zIndex = '100';
    infoDiv.style.maxWidth = '320px';
    infoDiv.style.background = 'rgba(0,0,20,0.7)';
    infoDiv.style.padding = '12px';
    infoDiv.style.borderRadius = '8px';
    infoDiv.style.border = '1px solid rgba(0,255,255,0.3)';
    infoDiv.innerHTML = '<strong>C/2024 G3 (ATLAS)</strong><br>Loading trajectory data from NASA JPL...';
    document.body.appendChild(infoDiv);

    // --- CREATE SUN ---
    var sunGeometry = new THREE.SphereGeometry(8, 32, 32);
    var sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    var sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);

    // Sun glow effect
    var sunGlowGeometry = new THREE.SphereGeometry(12, 32, 32);
    var sunGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.3
    });
    var sunGlowMesh = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sunMesh.add(sunGlowMesh);

    // --- CREATE PLANETARY ORBITS (Reference) ---
    function createOrbitRing(radius, color, opacity) {
        var segments = 128;
        var points = [];
        for (var i = 0; i <= segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        }
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
        var material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: opacity
        });
        return new THREE.Line(geometry, material);
    }

    // Earth orbit (1 AU)
    var earthOrbit = createOrbitRing(1 * AU_TO_PIXELS, 0x3366ff, 0.3);
    scene.add(earthOrbit);

    // Mars orbit (~1.5 AU)
    var marsOrbit = createOrbitRing(1.52 * AU_TO_PIXELS, 0xff6633, 0.2);
    scene.add(marsOrbit);

    // Jupiter orbit (~5.2 AU)
    var jupiterOrbit = createOrbitRing(5.2 * AU_TO_PIXELS, 0xffa500, 0.3);
    scene.add(jupiterOrbit);

    // --- CREATE JUPITER ---
    var jupiterAngle = 0;
    var jupiterGeometry = new THREE.SphereGeometry(5, 16, 16);
    var jupiterMaterial = new THREE.MeshBasicMaterial({ color: jupiterData.color });
    var jupiterMesh = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
    jupiterMesh.position.set(5.2 * AU_TO_PIXELS, 0, 0);
    scene.add(jupiterMesh);

    // --- CREATE JUPITER'S HILL RADIUS SPHERE ---
    var hillRadiusSphereGeometry = new THREE.SphereGeometry(jupiterHillRadiusPixels, 32, 16);
    var hillRadiusSphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.08,
        wireframe: true
    });
    var hillRadiusSphere = new THREE.Mesh(hillRadiusSphereGeometry, hillRadiusSphereMaterial);
    jupiterMesh.add(hillRadiusSphere);

    // Hill radius ring (equatorial)
    var hillRadiusRing = createOrbitRing(jupiterHillRadiusPixels, 0xff00ff, 0.5);
    jupiterMesh.add(hillRadiusRing);

    // --- CREATE COMET ---
    var cometGeometry = new THREE.SphereGeometry(2, 16, 16);
    var cometMaterial = new THREE.MeshBasicMaterial({ color: cometData.color });
    var cometMesh = new THREE.Mesh(cometGeometry, cometMaterial);
    scene.add(cometMesh);

    // Comet coma (fuzzy atmosphere)
    var comaGeometry = new THREE.SphereGeometry(4, 16, 16);
    var comaMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ffff,
        transparent: true,
        opacity: 0.3
    });
    var comaMesh = new THREE.Mesh(comaGeometry, comaMaterial);
    cometMesh.add(comaMesh);

    // --- CREATE COMET TRAJECTORY LINE ---
    var trajectoryGeometry = new THREE.BufferGeometry();
    var trajectoryMaterial = new THREE.LineBasicMaterial({
        color: cometData.tailColor,
        transparent: true,
        opacity: 0.7
    });
    var trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
    scene.add(trajectoryLine);

    // --- CREATE COMET TAIL ---
    var tailGeometry = new THREE.BufferGeometry();
    var tailMaterial = new THREE.LineBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.4
    });
    var tailLine = new THREE.Line(tailGeometry, tailMaterial);
    scene.add(tailLine);

    // --- STARS BACKGROUND ---
    var starGeometry = new THREE.BufferGeometry();
    var starCount = 4000;
    var starPositions = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 6000;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 6000;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 6000;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    var starMaterial = new THREE.PointsMaterial({
        size: 0.5,
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
    });
    var stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // --- FETCH TRAJECTORY FROM NASA JPL HORIZONS API ---
    function fetchCometData() {
        var now = new Date();
        var startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 60); // 60 days before
        var endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 120); // 120 days after

        var formatDate = function(d) {
            return d.toISOString().split('T')[0];
        };

        // Build NASA JPL Horizons API URL for C/2024 G3 ATLAS
        // Using VECTORS type to get heliocentric coordinates
        var apiUrl = 'https://ssd.jpl.nasa.gov/api/horizons.api?' +
            'format=json' +
            '&COMMAND=%27DES%3D2024%20G3%3BCAP%3B%27' + // Comet C/2024 G3
            '&OBJ_DATA=YES' +
            '&MAKE_EPHEM=YES' +
            '&EPHEM_TYPE=VECTORS' +
            '&CENTER=%27500%4010%27' + // Sun-centered
            '&START_TIME=%27' + formatDate(startDate) + '%27' +
            '&STOP_TIME=%27' + formatDate(endDate) + '%27' +
            '&STEP_SIZE=%271%20d%27' + // Daily steps
            '&VEC_TABLE=%272%27' + // Position and velocity
            '&REF_PLANE=ECLIPTIC' +
            '&REF_SYSTEM=ICRF' +
            '&OUT_UNITS=%27AU-D%27' + // AU and days
            '&CSV_FORMAT=YES';

        fetch(apiUrl)
            .then(function(response) {
                if (!response.ok) throw new Error('API response not OK');
                return response.json();
            })
            .then(function(data) {
                if (data.result) {
                    parseHorizonsData(data.result);
                    dataLoaded = true;
                    apiError = false;
                } else {
                    throw new Error('No result in response');
                }
            })
            .catch(function(error) {
                console.warn('NASA JPL Horizons API error, using fallback orbital elements:', error);
                apiError = true;
                generateFallbackTrajectory();
            });
    }

    function parseHorizonsData(result) {
        trajectoryPoints = [];
        var lines = result.split('\n');
        var inData = false;
        var currentDate = new Date();

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            
            if (line.includes('$$SOE')) {
                inData = true;
                continue;
            }
            if (line.includes('$$EOE')) {
                inData = false;
                continue;
            }

            if (inData && line.length > 0) {
                // Parse CSV format: date, X, Y, Z, VX, VY, VZ
                var parts = line.split(',');
                if (parts.length >= 7) {
                    var x = parseFloat(parts[2]); // X in AU
                    var y = parseFloat(parts[3]); // Y in AU  
                    var z = parseFloat(parts[4]); // Z in AU
                    var vx = parseFloat(parts[5]); // VX in AU/day
                    var vy = parseFloat(parts[6]); // VY in AU/day
                    var vz = parseFloat(parts[7]); // VZ in AU/day

                    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                        trajectoryPoints.push({
                            x: x * AU_TO_PIXELS,
                            y: z * AU_TO_PIXELS, // Swap Y and Z for visualization
                            z: y * AU_TO_PIXELS,
                            vx: vx,
                            vy: vz,
                            vz: vy,
                            date: parts[0]
                        });
                    }
                }
            }
        }

        // Update trajectory line
        if (trajectoryPoints.length > 0) {
            updateTrajectoryVisualization();
        }
    }

    function generateFallbackTrajectory() {
        // Generate trajectory using Keplerian orbital mechanics
        trajectoryPoints = [];
        
        var e = cometData.eccentricity;
        var q = cometData.perihelionDistance; // Perihelion in AU
        var a = q / (1 - e); // Semi-major axis
        var i = cometData.inclination * Math.PI / 180;
        var omega = cometData.longitudeAscendingNode * Math.PI / 180;
        var w = cometData.argumentPerihelion * Math.PI / 180;

        // Generate points along the orbit
        for (var theta = -Math.PI * 0.9; theta <= Math.PI * 0.9; theta += 0.02) {
            // Distance from focus (Sun)
            var r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
            
            if (r > 0 && r < 10) { // Limit to reasonable distance
                // Position in orbital plane
                var xOrbit = r * Math.cos(theta);
                var yOrbit = r * Math.sin(theta);

                // Rotate to ecliptic coordinates
                var x = (Math.cos(omega) * Math.cos(w) - Math.sin(omega) * Math.sin(w) * Math.cos(i)) * xOrbit +
                        (-Math.cos(omega) * Math.sin(w) - Math.sin(omega) * Math.cos(w) * Math.cos(i)) * yOrbit;
                var y = (Math.sin(omega) * Math.cos(w) + Math.cos(omega) * Math.sin(w) * Math.cos(i)) * xOrbit +
                        (-Math.sin(omega) * Math.sin(w) + Math.cos(omega) * Math.cos(w) * Math.cos(i)) * yOrbit;
                var z = Math.sin(w) * Math.sin(i) * xOrbit + Math.cos(w) * Math.sin(i) * yOrbit;

                trajectoryPoints.push({
                    x: x * AU_TO_PIXELS,
                    y: z * AU_TO_PIXELS,
                    z: y * AU_TO_PIXELS,
                    theta: theta
                });
            }
        }

        dataLoaded = true;
        updateTrajectoryVisualization();
    }

    function updateTrajectoryVisualization() {
        if (trajectoryPoints.length < 2) return;

        var positions = [];
        for (var i = 0; i < trajectoryPoints.length; i++) {
            positions.push(
                trajectoryPoints[i].x,
                trajectoryPoints[i].y,
                trajectoryPoints[i].z
            );
        }
        trajectoryGeometry.setAttribute('position', 
            new THREE.BufferAttribute(new Float32Array(positions), 3));
    }

    function getCurrentCometPosition(time) {
        // Calculate current position based on time since perihelion
        var now = new Date();
        var perihelionDate = cometData.perihelionDate;
        var daysSincePerihelion = (now - perihelionDate) / (1000 * 60 * 60 * 24);
        
        // For highly eccentric orbits, use Kepler's equation
        var e = cometData.eccentricity;
        var q = cometData.perihelionDistance;
        var a = Math.abs(q / (1 - e));
        
        // Mean motion (approximate for near-parabolic orbit)
        var n = 0.01720209895 / Math.pow(a, 1.5); // Radians per day
        var M = n * daysSincePerihelion;
        
        // Solve Kepler's equation for eccentric anomaly
        var E = M;
        for (var i = 0; i < 10; i++) {
            E = M + e * Math.sin(E);
        }
        
        // True anomaly
        var theta = 2 * Math.atan2(
            Math.sqrt(1 + e) * Math.sin(E / 2),
            Math.sqrt(1 - e) * Math.cos(E / 2)
        );
        
        // Distance from Sun
        var r = a * (1 - e * Math.cos(E));
        
        // Position in orbital plane
        var xOrbit = r * Math.cos(theta);
        var yOrbit = r * Math.sin(theta);
        
        // Rotation angles
        var i_rad = cometData.inclination * Math.PI / 180;
        var omega = cometData.longitudeAscendingNode * Math.PI / 180;
        var w = cometData.argumentPerihelion * Math.PI / 180;
        
        // Transform to ecliptic
        var x = (Math.cos(omega) * Math.cos(w) - Math.sin(omega) * Math.sin(w) * Math.cos(i_rad)) * xOrbit +
                (-Math.cos(omega) * Math.sin(w) - Math.sin(omega) * Math.cos(w) * Math.cos(i_rad)) * yOrbit;
        var y = (Math.sin(omega) * Math.cos(w) + Math.cos(omega) * Math.sin(w) * Math.cos(i_rad)) * xOrbit +
                (-Math.sin(omega) * Math.sin(w) + Math.cos(omega) * Math.cos(w) * Math.cos(i_rad)) * yOrbit;
        var z = Math.sin(w) * Math.sin(i_rad) * xOrbit + Math.cos(w) * Math.sin(i_rad) * yOrbit;
        
        return {
            position: new THREE.Vector3(x * AU_TO_PIXELS, z * AU_TO_PIXELS, y * AU_TO_PIXELS),
            distanceAU: r,
            theta: theta,
            daysSincePerihelion: daysSincePerihelion
        };
    }

    function updateCometTail(cometPos) {
        // Tail always points away from the Sun
        var tailLength = Math.max(20, 100 / Math.max(0.1, cometPos.distanceAU));
        var tailDir = cometPos.position.clone().normalize();
        
        var tailPoints = [];
        tailPoints.push(cometPos.position.x, cometPos.position.y, cometPos.position.z);
        tailPoints.push(
            cometPos.position.x + tailDir.x * tailLength,
            cometPos.position.y + tailDir.y * tailLength,
            cometPos.position.z + tailDir.z * tailLength
        );
        
        tailGeometry.setAttribute('position', 
            new THREE.BufferAttribute(new Float32Array(tailPoints), 3));
    }

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

    // --- INITIAL DATA FETCH ---
    fetchCometData();

    // --- ANIMATION ---
    var clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        var elapsedTime = clock.getElapsedTime();

        // Refresh data periodically
        if (Date.now() - lastFetchTime > fetchInterval) {
            lastFetchTime = Date.now();
            fetchCometData();
        }

        // Update Jupiter position (slow orbit)
        jupiterAngle += 0.0001;
        jupiterMesh.position.x = Math.cos(jupiterAngle) * 5.2 * AU_TO_PIXELS;
        jupiterMesh.position.z = Math.sin(jupiterAngle) * 5.2 * AU_TO_PIXELS;

        // Update comet position
        var cometPos = getCurrentCometPosition(elapsedTime);
        cometMesh.position.copy(cometPos.position);
        
        // Update comet tail
        updateCometTail(cometPos);

        // Animate coma
        comaMesh.scale.setScalar(1 + Math.sin(elapsedTime * 2) * 0.1);

        // Mouse interaction
        targetRotation.x = mouse.y * 0.2;
        targetRotation.y = mouse.x * 0.3;

        scene.rotation.x += (targetRotation.x - scene.rotation.x) * 0.03;
        scene.rotation.y += (targetRotation.y - scene.rotation.y) * 0.03;

        // Slow scene rotation
        scene.rotation.y += 0.0002;

        // Calculate distance to Jupiter for Hill radius check
        var distToJupiter = cometMesh.position.distanceTo(jupiterMesh.position) / AU_TO_PIXELS;
        var inHillSphere = distToJupiter < jupiterHillRadius;

        // Update HUD
        var now = new Date();
        var daysToFrom = Math.round((now - cometData.perihelionDate) / (1000 * 60 * 60 * 24));
        var perihelionStatus = daysToFrom < 0 ? 
            Math.abs(daysToFrom) + ' days to perihelion' : 
            daysToFrom + ' days since perihelion';

        infoDiv.innerHTML = 
            '<strong style="color:#00ffff;font-size:13px;">☄ C/2024 G3 (ATLAS)</strong><br>' +
            '<span style="color:#888;">Real-time trajectory from NASA JPL Horizons</span><br><br>' +
            '<span style="color:#ffff00;">Distance from Sun:</span> ' + cometPos.distanceAU.toFixed(3) + ' AU<br>' +
            '<span style="color:#ffff00;">Perihelion:</span> ' + perihelionStatus + '<br>' +
            '<span style="color:#ffff00;">Perihelion distance:</span> ' + cometData.perihelionDistance + ' AU<br>' +
            '<span style="color:#ffff00;">Eccentricity:</span> ' + cometData.eccentricity + '<br><br>' +
            '<span style="color:#ffa500;">Jupiter Hill Radius:</span> ' + jupiterHillRadius.toFixed(4) + ' AU<br>' +
            '<span style="color:#ffa500;">Comet to Jupiter:</span> ' + distToJupiter.toFixed(3) + ' AU<br>' +
            (inHillSphere ? '<span style="color:#ff00ff;">⚠ Inside Jupiter Hill Sphere!</span><br>' : '') +
            '<br><span style="font-size:10px;">' +
            '<span style="color:#3366ff;">━━</span> Earth orbit (1 AU)<br>' +
            '<span style="color:#ff6633;">━━</span> Mars orbit (1.5 AU)<br>' +
            '<span style="color:#ffa500;">━━</span> Jupiter orbit (5.2 AU)<br>' +
            '<span style="color:#ff00ff;">━━</span> Jupiter Hill radius<br>' +
            '<span style="color:#66ffff;">━━</span> Comet trajectory</span>' +
            (apiError ? '<br><br><span style="color:#ff6666;font-size:9px;">Using orbital elements (API unavailable)</span>' : '') +
            (dataLoaded && !apiError ? '<br><br><span style="color:#66ff66;font-size:9px;">✓ Live data from NASA JPL</span>' : '');

        renderer.render(scene, camera);
    }

    animate();

    $('#canvas-orbit').css('opacity', 1);
    $('body').append('<div class="bg-color" style="background-color:#000008"></div>');
}
