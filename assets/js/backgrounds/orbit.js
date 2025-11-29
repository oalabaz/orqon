function orbitBackground() {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.id = 'canvas-orbit';
    document.getElementById('main').appendChild(renderer.domElement);

    var camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.z = 220;
    camera.position.y = 180;
    camera.position.x = -80;
    camera.lookAt(0, 0, 0);

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
    var jupiterHillRadius = jupiterData.semiMajorAxis * Math.pow(JUPITER_MASS / (3 * SUN_MASS), 1/3);
    var jupiterHillRadiusPixels = jupiterHillRadius * AU_TO_PIXELS;

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
        // Query for comet C/2024 G3 (ATLAS) - using 10 years of data
        var startDate = '2025-10-01';
        var stopDate = '2035-12-31';
        var stepSize = '10d'; // Every 10 days
        
        var apiUrl = 'https://ssd.jpl.nasa.gov/api/horizons.api?' +
            'format=json' +
            '&COMMAND=\'C/2024 G3\'' +
            '&OBJ_DATA=NO' +
            '&MAKE_EPHEM=YES' +
            '&EPHEM_TYPE=VECTORS' +
            '&CENTER=\'500@10\'' +  // Sun-centered
            '&START_TIME=\'' + startDate + '\'' +
            '&STOP_TIME=\'' + stopDate + '\'' +
            '&STEP_SIZE=\'' + stepSize + '\'' +
            '&VEC_TABLE=\'2\'' +
            '&CSV_FORMAT=YES';
        
        console.log('Fetching real orbit from NASA JPL Horizons...');
        
        fetch(apiUrl)
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.result) {
                    parseHorizonsData(data.result);
                } else {
                    console.warn('No orbit data returned, using fallback');
                    generateFallbackOrbit();
                }
            })
            .catch(function(error) {
                console.warn('Failed to fetch orbit data:', error);
                generateFallbackOrbit();
            });
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
        // Generate hyperbolic trajectory based on orbital elements
        // C/2024 G3 ATLAS: e=1.0 (hyperbolic), q=1.3564 AU, i~45°
        var e = 1.00001; // Slightly hyperbolic
        var q = cometData.perihelionDistance;
        var a = q / (1 - e); // Semi-major axis (negative for hyperbola)
        var inclination = Math.PI * 0.25; // 45 degrees
        
        var points = [];
        var numPoints = 400;
        
        for (var i = 0; i < numPoints; i++) {
            // True anomaly from -160° to +160° (hyperbolic arc)
            var nuDeg = -160 + (i / numPoints) * 320;
            var nu = nuDeg * Math.PI / 180;
            
            // Radius from focus
            var r = q * (1 + e) / (1 + e * Math.cos(nu));
            
            // Skip if radius is too large (beyond reasonable display)
            if (r > 50) continue;
            
            // Position in orbital plane
            var xOrbit = r * Math.cos(nu);
            var yOrbit = r * Math.sin(nu);
            
            // Apply inclination rotation
            var x = xOrbit;
            var y = yOrbit * Math.sin(inclination);
            var z = yOrbit * Math.cos(inclination);
            
            points.push(new THREE.Vector3(
                x * AU_TO_PIXELS,
                y * AU_TO_PIXELS * 0.3,
                z * AU_TO_PIXELS
            ));
        }
        
        console.log('Generated fallback orbit with ' + points.length + ' points');
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
        var starCount = 3000;
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
    [0.2, 0.45, 0.75].forEach(function(depth, idx) {
        var layer = createParallaxStars(depth, 800 + idx * 400);
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

    // --- PLANETARY ORBITS with gradient effect ---
    function createGlowingOrbit(radius, color) {
        var group = new THREE.Group();
        var segments = 128;
        
        var points = [];
        for (var i = 0; i <= segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
        var curve = new THREE.CatmullRomCurve3(points, true);
        var geometry = new THREE.TubeGeometry(curve, segments, 0.15, 8, true);
        var material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15
        });
        group.add(new THREE.Mesh(geometry, material));
        
        return group;
    }

    scene.add(createGlowingOrbit(1 * AU_TO_PIXELS, 0x556688));
    scene.add(createGlowingOrbit(1.52 * AU_TO_PIXELS, 0x664433));
    scene.add(createGlowingOrbit(5.2 * AU_TO_PIXELS, 0x776644));

    // --- EARTH ---
    var earthGeometry = new THREE.SphereGeometry(3, 32, 32);
    var earthMaterial = new THREE.MeshBasicMaterial({ color: 0x556688 });
    var earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    var earthAngle = Math.PI * 1.2;
    earthMesh.position.set(Math.cos(earthAngle) * AU_TO_PIXELS, 0, Math.sin(earthAngle) * AU_TO_PIXELS);
    scene.add(earthMesh);
    
    // Earth label
    var earthLabel = createTextSprite('EARTH', '#88aacc');
    earthLabel.position.set(0, -18, 0);
    earthMesh.add(earthLabel);

    // --- MARS ---
    var marsGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    var marsMaterial = new THREE.MeshBasicMaterial({ color: 0x664433 });
    var marsMesh = new THREE.Mesh(marsGeometry, marsMaterial);
    var marsAngle = Math.PI * 0.8;
    marsMesh.position.set(Math.cos(marsAngle) * 1.52 * AU_TO_PIXELS, 0, Math.sin(marsAngle) * 1.52 * AU_TO_PIXELS);
    scene.add(marsMesh);
    
    // Mars label
    var marsLabel = createTextSprite('MARS', '#cc8866');
    marsLabel.position.set(0, -16, 0);
    marsMesh.add(marsLabel);

    // --- JUPITER with advanced shaders ---
    var jupiterGroup = new THREE.Group();
    
    // Main Jupiter body with custom shader
    var jupiterGeometry = new THREE.SphereGeometry(60, 128, 128);
    
    // Custom Jupiter shader with atmospheric scattering
    var jupiterShader = {
        uniforms: {
            time: { value: 0 },
            lightPos: { value: new THREE.Vector3(0, 0, 0) },
            baseColor: { value: new THREE.Color(0xa89968) },
            bandColor1: { value: new THREE.Color(0x9a8860) },
            bandColor2: { value: new THREE.Color(0xb8a978) },
            spotColor: { value: new THREE.Color(0x885544) }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 lightPos;
            uniform vec3 baseColor;
            uniform vec3 bandColor1;
            uniform vec3 bandColor2;
            uniform vec3 spotColor;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                for(int i = 0; i < 4; i++) {
                    value += amplitude * noise(p);
                    p *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(lightPos - vPosition);
                
                // Procedural bands
                float bandPattern = sin(vUv.y * 25.0 + time * 0.1 + fbm(vUv * 8.0) * 0.5) * 0.5 + 0.5;
                float turbulence = fbm(vUv * 12.0 + vec2(time * 0.05, 0.0)) * 0.3;
                
                // Mix colors for bands
                vec3 bandMix = mix(bandColor1, bandColor2, bandPattern + turbulence);
                vec3 color = mix(baseColor, bandMix, 0.7);
                
                // Great Red Spot
                vec2 spotCenter = vec2(0.65, 0.35);
                float spotDist = length(vUv - spotCenter);
                float spot = smoothstep(0.08, 0.02, spotDist) * 0.8;
                color = mix(color, spotColor, spot);
                
                // Atmospheric scattering
                float fresnel = pow(1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0))), 3.0);
                vec3 atmColor = vec3(0.6, 0.5, 0.4) * fresnel * 0.4;
                
                // Lighting
                float diff = max(dot(normal, lightDir), 0.0);
                float wrap = 0.5;
                float wrapDiff = max((diff + wrap) / (1.0 + wrap), 0.0);
                
                // Terminator softening
                float terminator = smoothstep(0.0, 0.3, wrapDiff);
                
                // Subsurface scattering approximation
                vec3 subsurface = baseColor * 0.3 * (1.0 - diff) * terminator;
                
                color = color * (wrapDiff * 0.8 + 0.2) + subsurface + atmColor;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `
    };
    
    var jupiterMaterial = new THREE.ShaderMaterial({
        uniforms: jupiterShader.uniforms,
        vertexShader: jupiterShader.vertexShader,
        fragmentShader: jupiterShader.fragmentShader,
        side: THREE.FrontSide
    });
    
    var jupiterMesh = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
    jupiterGroup.add(jupiterMesh);
    
    // Volumetric atmosphere layers
    for (var i = 1; i <= 3; i++) {
        var atmGeometry = new THREE.SphereGeometry(60 + i * 3, 64, 64);
        var atmShader = {
            uniforms: {
                c: { value: 0.15 / i },
                p: { value: 4.5 - i * 0.5 }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float c;
                uniform float p;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(c - dot(vNormal, vec3(0, 0, 1.0)), p);
                    gl_FragColor = vec4(0.8, 0.7, 0.5, 1.0) * intensity;
                }
            `
        };
        var atmMaterial = new THREE.ShaderMaterial({
            uniforms: atmShader.uniforms,
            vertexShader: atmShader.vertexShader,
            fragmentShader: atmShader.fragmentShader,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        jupiterGroup.add(new THREE.Mesh(atmGeometry, atmMaterial));
    }
    
    // Rim light enhancement
    var rimGeometry = new THREE.SphereGeometry(60.5, 64, 64);
    var rimMaterial = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(0xffddaa) },
            viewVector: { value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(0.7 - dot(vNormal, vNormel), 4.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, intensity * 0.3);
            }
        `,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    jupiterGroup.add(new THREE.Mesh(rimGeometry, rimMaterial));
    
    // Jupiter label
    var jupiterLabel = createTextSprite('JUPITER', '#eebb77');
    jupiterLabel.position.set(0, -110, 0);
    jupiterLabel.scale.set(80, 20, 1);
    jupiterGroup.add(jupiterLabel);
    
    // --- GALILEAN MOONS ---
    // Real orbital data (scaled for visibility)
    // Distances in Jupiter radii (1 Rj ≈ 71,492 km), periods in Earth days
    var galileanMoons = [
        { name: 'Io', distance: 5.9, period: 1.77, radius: 1.8, color: 0xffdd66, angle: 0 },
        { name: 'Europa', distance: 9.4, period: 3.55, radius: 1.5, color: 0xccddee, angle: Math.PI * 0.5 },
        { name: 'Ganymede', distance: 15.0, period: 7.15, radius: 2.6, color: 0xaabbcc, angle: Math.PI },
        { name: 'Callisto', distance: 26.3, period: 16.69, radius: 2.4, color: 0x887766, angle: Math.PI * 1.5 }
    ];
    
    // Scale factor: Jupiter radius in our scene is 60, real Jupiter radius is ~71,492 km
    // Moon distances need to be scaled relative to Jupiter's size
    var moonDistanceScale = 1.8; // Compress orbits a bit for visibility
    var moonObjects = [];
    
    galileanMoons.forEach(function(moonData) {
        var moonGroup = new THREE.Group();
        
        // Moon body with subtle glow
        var moonGeometry = new THREE.SphereGeometry(moonData.radius, 24, 24);
        var moonMaterial = new THREE.MeshBasicMaterial({ color: moonData.color });
        var moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        moonGroup.add(moonMesh);
        
        // Subtle glow around moon
        var moonGlowGeometry = new THREE.SphereGeometry(moonData.radius * 1.4, 16, 16);
        var moonGlowMaterial = new THREE.MeshBasicMaterial({
            color: moonData.color,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        moonGroup.add(new THREE.Mesh(moonGlowGeometry, moonGlowMaterial));
        
        // Moon label
        var colorHex = '#' + moonData.color.toString(16).padStart(6, '0');
        var moonLabel = createTextSprite(moonData.name.toUpperCase(), colorHex);
        moonLabel.position.set(0, -moonData.radius - 8, 0);
        moonLabel.scale.set(18, 4.5, 1);
        moonGroup.add(moonLabel);
        
        // Store orbital data
        moonGroup.userData = {
            name: moonData.name,
            orbitRadius: moonData.distance * moonDistanceScale,
            period: moonData.period,
            angle: moonData.angle
        };
        
        // Initial position
        var orbitRadius = moonData.distance * moonDistanceScale;
        moonGroup.position.set(
            Math.cos(moonData.angle) * orbitRadius,
            0,
            Math.sin(moonData.angle) * orbitRadius
        );
        
        jupiterGroup.add(moonGroup);
        moonObjects.push(moonGroup);
        
        // Moon orbit ring (faint)
        var moonOrbitGeometry = new THREE.TorusGeometry(orbitRadius, 0.15, 8, 64);
        var moonOrbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x556677,
            transparent: true,
            opacity: 0.12
        });
        var moonOrbitRing = new THREE.Mesh(moonOrbitGeometry, moonOrbitMaterial);
        moonOrbitRing.rotation.x = Math.PI / 2;
        jupiterGroup.add(moonOrbitRing);
    });
    
    jupiterGroup.position.set(
        Math.cos(jupiterData.currentAngle) * 5.2 * AU_TO_PIXELS,
        0,
        Math.sin(jupiterData.currentAngle) * 5.2 * AU_TO_PIXELS
    );
    scene.add(jupiterGroup);

    // --- JUPITER'S HILL RADIUS SPHERE ---
    var hillGroup = new THREE.Group();
    
    // Transparent outlined globe shader for Hill radius
    var hillGlobeGeometry = new THREE.SphereGeometry(jupiterHillRadiusPixels, 64, 32);
    var hillGlobeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            baseColor: { value: new THREE.Color(0x88aadd) },
            edgeColor: { value: new THREE.Color(0xaaddff) }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            varying vec3 vViewPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                vUv = uv;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 baseColor;
            uniform vec3 edgeColor;
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            varying vec3 vViewPosition;
            
            void main() {
                vec3 viewDir = normalize(vViewPosition);
                
                // Strong fresnel for visible edge outline
                float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
                
                // Latitude/longitude grid lines - more visible
                float lat = vUv.y * 3.14159;
                float lon = vUv.x * 3.14159 * 2.0;
                float latLines = abs(sin(lat * 6.0));
                float lonLines = abs(sin(lon * 12.0));
                float grid = smoothstep(0.85, 0.95, max(latLines, lonLines));
                
                // Animated pulse on grid
                float pulse = sin(time * 2.0 + vUv.y * 8.0) * 0.5 + 0.5;
                
                // Edge outline - very visible
                float edgeAlpha = fresnel * 0.7;
                
                // Grid lines
                float gridAlpha = grid * 0.4 * (0.6 + pulse * 0.4);
                
                // Combine
                vec3 color = mix(baseColor, edgeColor, fresnel);
                float alpha = max(edgeAlpha, gridAlpha);
                
                // Minimum visibility
                alpha = max(alpha, 0.08);
                
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    var hillGlobeMesh = new THREE.Mesh(hillGlobeGeometry, hillGlobeMaterial);
    hillGroup.add(hillGlobeMesh);
    
    // Keep the wireframe as visible backup
    var hillWireGeometry = new THREE.SphereGeometry(jupiterHillRadiusPixels, 32, 16);
    var hillWireMaterial = new THREE.MeshBasicMaterial({
        color: 0x99bbdd,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });
    var hillWireMesh = new THREE.Mesh(hillWireGeometry, hillWireMaterial);
    hillGroup.add(hillWireMesh);
    
    var hillRingGeometry = new THREE.TorusGeometry(jupiterHillRadiusPixels, 0.8, 8, 96);
    var hillRingMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaccee,
        transparent: true,
        opacity: 0.5
    });
    var hillRing = new THREE.Mesh(hillRingGeometry, hillRingMaterial);
    hillRing.rotation.x = Math.PI / 2;
    hillGroup.add(hillRing);
    
    // Second ring at different angle for 3D effect
    var hillRing2 = new THREE.Mesh(
        new THREE.TorusGeometry(jupiterHillRadiusPixels, 0.5, 8, 96),
        new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.35 })
    );
    hillRing2.rotation.x = Math.PI / 2;
    hillRing2.rotation.z = Math.PI / 4;
    hillGroup.add(hillRing2);
    
    // Third ring vertical
    var hillRing3 = new THREE.Mesh(
        new THREE.TorusGeometry(jupiterHillRadiusPixels, 0.4, 8, 96),
        new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.25 })
    );
    hillGroup.add(hillRing3);
    
    // Hill sphere boundary glow layer (activates on crossing)
    var hillGlowGeometry = new THREE.SphereGeometry(jupiterHillRadiusPixels * 1.02, 48, 24);
    var hillGlowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            activation: { value: 0 },
            color: { value: new THREE.Color(0x66aaff) }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float activation;
            uniform vec3 color;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
                float wave = sin(vPosition.y * 0.15 + time * 3.0) * 0.5 + 0.5;
                float pulse = sin(time * 8.0) * 0.3 + 0.7;
                float alpha = fresnel * activation * wave * pulse * 0.6;
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    var hillGlowMesh = new THREE.Mesh(hillGlowGeometry, hillGlowMaterial);
    hillGroup.add(hillGlowMesh);
    
    // Ripple rings for crossing effect
    var rippleRings = [];
    for (var ri = 0; ri < 3; ri++) {
        var rippleGeometry = new THREE.RingGeometry(jupiterHillRadiusPixels - 2, jupiterHillRadiusPixels + 2, 64);
        var rippleMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        var rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
        rippleMesh.userData = { active: false, progress: 0, delay: ri * 0.15 };
        hillGroup.add(rippleMesh);
        rippleRings.push(rippleMesh);
    }
    
    // Impact burst particles
    var burstParticleCount = 200;
    var burstGeometry = new THREE.BufferGeometry();
    var burstPositions = new Float32Array(burstParticleCount * 3);
    var burstColors = new Float32Array(burstParticleCount * 3);
    var burstSizes = new Float32Array(burstParticleCount);
    var burstVelocities = [];
    
    for (var bi = 0; bi < burstParticleCount; bi++) {
        burstPositions[bi * 3] = 0;
        burstPositions[bi * 3 + 1] = 0;
        burstPositions[bi * 3 + 2] = 0;
        burstColors[bi * 3] = 0.5 + Math.random() * 0.5;
        burstColors[bi * 3 + 1] = 0.7 + Math.random() * 0.3;
        burstColors[bi * 3 + 2] = 1.0;
        burstSizes[bi] = 1 + Math.random() * 2;
        burstVelocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(0.5 + Math.random() * 1.5));
    }
    burstGeometry.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
    burstGeometry.setAttribute('color', new THREE.BufferAttribute(burstColors, 3));
    burstGeometry.setAttribute('size', new THREE.BufferAttribute(burstSizes, 1));
    
    var burstMaterial = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    var burstParticles = new THREE.Points(burstGeometry, burstMaterial);
    hillGroup.add(burstParticles);
    
    // Hill crossing state
    var hillCrossingState = {
        wasInside: false,
        crossingTime: 0,
        burstActive: false,
        burstProgress: 0,
        crossingPoint: new THREE.Vector3()
    };
    
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
    var tailParticleCount = 2000;
    var tailGeometry = new THREE.BufferGeometry();
    var tailPositions = new Float32Array(tailParticleCount * 3);
    var tailColors = new Float32Array(tailParticleCount * 3);
    var tailSizes = new Float32Array(tailParticleCount);
    
    tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeometry.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
    tailGeometry.setAttribute('size', new THREE.BufferAttribute(tailSizes, 1));
    
    var tailMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true
    });
    var tailParticles = new THREE.Points(tailGeometry, tailMaterial);
    scene.add(tailParticles);

    // --- ION TAIL ---
    var ionTailGeometry = new THREE.BufferGeometry();
    var ionTailMaterial = new THREE.LineBasicMaterial({
        color: 0x667788,
        transparent: true,
        opacity: 0.3
    });
    var ionTail = new THREE.Line(ionTailGeometry, ionTailMaterial);
    scene.add(ionTail);

    // --- TRAJECTORY PATH ---
    var trajectoryGroup = new THREE.Group();
    
    var perihelionPos = new THREE.Vector3(cometData.perihelionDistance * AU_TO_PIXELS, 0, 0);
    var jupiterPos = jupiterGroup.position.clone();
    
    // Calculate trajectory points that pass through Hill sphere
    var hillApproachPos = jupiterPos.clone().add(new THREE.Vector3(-jupiterHillRadiusPixels * 0.7, 0, -jupiterHillRadiusPixels * 0.5));
    var hillEnterPos = jupiterPos.clone().add(new THREE.Vector3(-jupiterHillRadiusPixels * 0.4, 0, -jupiterHillRadiusPixels * 0.3));
    var hillCenterPass = jupiterPos.clone().add(new THREE.Vector3(0, 0, jupiterHillRadiusPixels * 0.2));
    var hillExitPos = jupiterPos.clone().add(new THREE.Vector3(jupiterHillRadiusPixels * 0.5, 0, jupiterHillRadiusPixels * 0.6));
    var beyondHillPos = jupiterPos.clone().add(new THREE.Vector3(jupiterHillRadiusPixels * 1.3, 0, jupiterHillRadiusPixels * 1.4));
    
    // Extended trajectory - comet continues into deep space forever
    var deepSpace1 = jupiterPos.clone().add(new THREE.Vector3(jupiterHillRadiusPixels * 2.5, 15, jupiterHillRadiusPixels * 3));
    var deepSpace2 = jupiterPos.clone().add(new THREE.Vector3(jupiterHillRadiusPixels * 4, 30, jupiterHillRadiusPixels * 5));
    var deepSpace3 = jupiterPos.clone().add(new THREE.Vector3(jupiterHillRadiusPixels * 6, 40, jupiterHillRadiusPixels * 8));
    var cosmosEnd = jupiterPos.clone().add(new THREE.Vector3(jupiterHillRadiusPixels * 10, 50, jupiterHillRadiusPixels * 14));
    
    var controlPoint1 = new THREE.Vector3(
        perihelionPos.x + 60,
        35,
        perihelionPos.z + 100
    );
    var controlPoint2 = new THREE.Vector3(
        (perihelionPos.x + hillApproachPos.x) / 2 + 30,
        25,
        (perihelionPos.z + hillApproachPos.z) / 2 + 40
    );
    
    var trajectoryCurve = new THREE.CatmullRomCurve3([
        perihelionPos,
        controlPoint1,
        controlPoint2,
        hillApproachPos,
        hillEnterPos,
        hillCenterPass,
        hillExitPos,
        beyondHillPos,
        deepSpace1,
        deepSpace2,
        deepSpace3,
        cosmosEnd
    ], false, 'catmullrom', 0.3);
    
    // Full journey path - faint grayish dotted line (will be updated with real API data)
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
        color: 0x99aabb,
        size: 2.5,
        transparent: true,
        opacity: 0.45,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    // Store as module-level for API update
    var fullPathDots = new THREE.Points(fullPathGeometry, fullPathMaterial);
    trajectoryGroup.add(fullPathDots);
    
    // Make fullPathDots accessible for real orbit update
    window._orbitFullPathDots = fullPathDots;
    
    // Lit portion - bright animated trail following comet progress
    var litTrailCount = 80; // number of dots in the lit trail
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
    
    var perihelionMarkerGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    var perihelionMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xaa9977 });
    var perihelionMarker = new THREE.Mesh(perihelionMarkerGeometry, perihelionMarkerMaterial);
    perihelionMarker.position.copy(perihelionPos);
    trajectoryGroup.add(perihelionMarker);
    
    var targetMarkerGeometry = new THREE.TorusGeometry(3.5, 0.3, 8, 32);
    var targetMarkerMaterial = new THREE.MeshBasicMaterial({
        color: 0x887799,
        transparent: true,
        opacity: 0.35
    });
    var targetMarker = new THREE.Mesh(targetMarkerGeometry, targetMarkerMaterial);
    targetMarker.position.copy(beyondHillPos);
    targetMarker.lookAt(jupiterGroup.position);
    trajectoryGroup.add(targetMarker);
    
    scene.add(trajectoryGroup);

    // --- INFO HUD ---
    var infoDiv = document.createElement('div');
    infoDiv.id = 'orbit-info';
    infoDiv.style.cssText = 'position:fixed;top:16px;left:16px;color:#aabbcc;font-family:Consolas,Monaco,monospace;font-size:10px;pointer-events:none;text-shadow:0 0 8px rgba(100,120,140,0.4);line-height:1.4;z-index:100;max-width:280px;background:rgba(8,12,18,0.75);padding:10px 12px;border-radius:3px;border:1px solid rgba(100,120,140,0.2);box-shadow:0 2px 12px rgba(0,0,0,0.5);backdrop-filter:blur(4px);';
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

    // --- GSAP CINEMATIC INTRO & CONTINUOUS MOTION (added) ---
    if (typeof gsap !== 'undefined') {
        // Collect emissive parts for opacity handling (materials only)
        var sunEmitters = sunGroup.children.filter(function(c){return c.material && c !== sunMesh;});
        var jupiterBands = jupiterGroup.children.filter(function(c){return c.material && c !== jupiterMesh;});
        var cometAtmos = cometGroup.children.filter(function(c){return c.material && c !== cometGroup.children[0];});

        // Initial states (use scale vector components; opacity on materials)
        gsap.set(sunGroup.scale, { x:0.6, y:0.6, z:0.6 });
        sunEmitters.forEach(function(m){ m.material.opacity *= 0.01; });
        gsap.set(jupiterGroup.scale, { x:0.4, y:0.4, z:0.4 });
        jupiterBands.forEach(function(b){ b.material.opacity *= 0.01; });
        gsap.set(cometGroup.scale, { x:0.01, y:0.01, z:0.01 });
        cometAtmos.forEach(function(a){ a.material.opacity *= 0.2; });
        hillGroup.children.forEach(function(h){ if(h.material) h.material.opacity = 0; });
        gsap.set(infoDiv, { autoAlpha: 0, y: -20 });
        gsap.set(camera.position, { z: 550, y: 400, x: -200 });

        var introTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        introTl
            .to(sunGroup.scale, { duration: 2.2, x:1, y:1, z:1 })
            .to(camera.position, { duration: 3.5, z: 220, y: 180, x: -80, onUpdate: function(){ camera.lookAt(0,0,0); }}, 0)
            .to(jupiterGroup.scale, { duration: 2.5, x:1, y:1, z:1}, 0.6)
            .to(cometGroup.scale, { duration: 1.8, x:1, y:1, z:1}, 1.2)
            .to(hillGroup.children.map(function(h){return h.material;}), { duration: 2, opacity: function(i){ return i===0?0.03:i===1?0.15:0.7; }}, 1.5)
            .to(sunEmitters.map(function(m){return m.material;}), { duration:1.8, opacity:function(){return 0.05 + Math.random()*0.07;} }, 1.0)
            .to(jupiterBands.map(function(b){return b.material;}), { duration:2, opacity: function(){return 0.5;} }, 1.2)
            .to(infoDiv, { duration: 1.2, autoAlpha: 1, y: 0}, 2.0)
            .addLabel('postIntro')
            .to(sunGroup.rotation, { duration: 6, y: '+=0.6', ease: 'power1.inOut' }, 'postIntro');

        if (dottedTrajectoryMaterial) {
            introTl.from(dottedTrajectoryMaterial, { duration: 2, opacity: 0 }, 'postIntro');
        }

        // Continuous ambient motions
        sunEmitters.forEach(function(m,i){
            gsap.to(m.material, { duration: 6+ i, opacity: '+=0.03', repeat:-1, yoyo:true, ease:'sine.inOut', delay: 2 + i*0.3 });
        });
        gsap.to(jupiterGroup.rotation, { duration: 40, y: '+=6.283', repeat: -1, ease: 'none' });
        gsap.to(camera.position, { duration: 12, y: '+=20', x: '-=15', repeat: -1, yoyo: true, ease: 'sine.inOut', onUpdate: function(){ camera.lookAt(0,0,0); } });
        gsap.to(infoDiv, { duration: 3, boxShadow: '0 0 40px rgba(0,255,255,0.35), inset 0 0 25px rgba(0,255,255,0.08)', repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 4});
    }

    function animate() {
        requestAnimationFrame(animate);
        var time = clock.getElapsedTime();

        parallaxStarLayers.forEach(function(layer, index) {
            layer.mesh.rotation.y += 0.00002 * (index + 1);
            layer.mesh.position.x = Math.sin(time * 0.02 * (layer.depth + 0.3)) * (20 + layer.depth * 60);
            layer.mesh.position.z = Math.cos(time * 0.015 * (layer.depth + 0.5)) * (15 + layer.depth * 40);
        });

        animationProgress += animationSpeed;
        if (animationProgress > 1) animationProgress = 0;
        
        // Use dynamic trajectory curve (updated by API)
        var currentCurve = (window._orbitTrajectoryData && window._orbitTrajectoryData.curve) || trajectoryCurve;
        var cometPos = currentCurve.getPoint(animationProgress);
        cometGroup.position.copy(cometPos);
        
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
            var brightness = 0.5 + fade * 0.4;
            colors[i * 3] = brightness * 0.85;
            colors[i * 3 + 1] = brightness * 0.9;
            colors[i * 3 + 2] = brightness;
            
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

        jupiterGroup.rotation.y += 0.0008;
        
        // --- ANIMATE GALILEAN MOONS ---
        moonObjects.forEach(function(moon) {
            var data = moon.userData;
            // Angular velocity based on orbital period (faster for closer moons)
            var angularSpeed = (2 * Math.PI) / (data.period * 60); // Speed up for visibility
            data.angle += angularSpeed;
            
            // Update position
            moon.position.set(
                Math.cos(data.angle) * data.orbitRadius,
                0,
                Math.sin(data.angle) * data.orbitRadius
            );
            
            // Counter-rotate to keep same face toward Jupiter (tidal locking)
            moon.rotation.y = -data.angle;
        });
        
        // Update shader uniforms
        if (jupiterMaterial.uniforms) {
            jupiterMaterial.uniforms.time.value = time;
            jupiterMaterial.uniforms.lightPos.value.copy(sunGroup.position);
        }
        
        hillGroup.children[0].material.uniforms.time.value = time; // Hill globe shader
        hillGroup.children[1].material.opacity = 0.02 + Math.sin(time * 1.5) * 0.01; // Wireframe
        hillGroup.children[2].material.opacity = 0.25 + Math.sin(time * 2) * 0.1; // Main ring
        hillRing.material.opacity = 0.25 + Math.sin(time * 2.5) * 0.1;
        
        // --- HILL SPHERE CROSSING EFFECT ---
        var inHillSphere = distToJupiter < jupiterHillRadius;
        var nearBoundary = Math.abs(distToJupiter - jupiterHillRadius) < 0.05; // Within 0.05 AU of boundary
        
        // Detect crossing moment
        if (inHillSphere !== hillCrossingState.wasInside) {
            // Crossing occurred!
            hillCrossingState.crossingTime = time;
            hillCrossingState.burstActive = true;
            hillCrossingState.burstProgress = 0;
            
            // Get crossing point in Hill sphere local coordinates
            var cometLocalPos = cometPos.clone().sub(jupiterGroup.position);
            hillCrossingState.crossingPoint.copy(cometLocalPos.normalize().multiplyScalar(jupiterHillRadiusPixels));
            
            // Trigger ripples
            rippleRings.forEach(function(ring, idx) {
                ring.userData.active = true;
                ring.userData.progress = -ring.userData.delay;
                ring.lookAt(cometLocalPos);
                ring.position.copy(hillCrossingState.crossingPoint);
            });
            
            // Initialize burst particles at crossing point
            var burstPos = burstParticles.geometry.attributes.position.array;
            for (var bp = 0; bp < burstParticleCount; bp++) {
                burstPos[bp * 3] = hillCrossingState.crossingPoint.x;
                burstPos[bp * 3 + 1] = hillCrossingState.crossingPoint.y;
                burstPos[bp * 3 + 2] = hillCrossingState.crossingPoint.z;
            }
            burstParticles.geometry.attributes.position.needsUpdate = true;
            
            // GSAP flash animation
            if (typeof gsap !== 'undefined') {
                gsap.to(hillGlowMaterial.uniforms.activation, { value: 1, duration: 0.3, ease: 'power2.out' });
                gsap.to(hillGlowMaterial.uniforms.activation, { value: 0, duration: 1.5, delay: 0.5, ease: 'power2.in' });
            }
        }
        hillCrossingState.wasInside = inHillSphere;
        
        // Update Hill glow shader
        hillGlowMaterial.uniforms.time.value = time;
        
        // Proximity glow when near boundary
        if (nearBoundary && !hillCrossingState.burstActive) {
            var proximityGlow = 1 - Math.abs(distToJupiter - jupiterHillRadius) / 0.05;
            hillGlowMaterial.uniforms.activation.value = Math.max(hillGlowMaterial.uniforms.activation.value, proximityGlow * 0.4);
        }
        
        // Animate ripple rings
        rippleRings.forEach(function(ring) {
            if (ring.userData.active) {
                ring.userData.progress += 0.02;
                var p = ring.userData.progress;
                
                if (p > 0 && p < 1) {
                    ring.scale.setScalar(1 + p * 0.8);
                    ring.material.opacity = Math.sin(p * Math.PI) * 0.6;
                } else if (p >= 1) {
                    ring.material.opacity = 0;
                    ring.userData.active = false;
                    ring.scale.setScalar(1);
                } else {
                    ring.material.opacity = 0;
                }
            }
        });
        
        // Animate burst particles
        if (hillCrossingState.burstActive) {
            hillCrossingState.burstProgress += 0.015;
            var bp = hillCrossingState.burstProgress;
            
            if (bp < 1) {
                burstMaterial.opacity = Math.sin(bp * Math.PI) * 0.8;
                
                var burstPos = burstParticles.geometry.attributes.position.array;
                for (var bi = 0; bi < burstParticleCount; bi++) {
                    burstPos[bi * 3] += burstVelocities[bi].x * (1 - bp * 0.5);
                    burstPos[bi * 3 + 1] += burstVelocities[bi].y * (1 - bp * 0.5);
                    burstPos[bi * 3 + 2] += burstVelocities[bi].z * (1 - bp * 0.5);
                }
                burstParticles.geometry.attributes.position.needsUpdate = true;
            } else {
                burstMaterial.opacity = 0;
                hillCrossingState.burstActive = false;
            }
        }

        targetMarker.rotation.z = time * 2;
        targetMarker.material.opacity = 0.5 + Math.sin(time * 4) * 0.3;

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
        
        var approachingHill = distToHillEdge < 0.3 && distToHillEdge > 0;
        var beyondHill = animationProgress > 0.75;

        infoDiv.innerHTML = 
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
