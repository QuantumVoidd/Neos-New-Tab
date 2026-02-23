class SolarSystemApp {
    constructor() {
        this.isActive = false;
        this.planets = {}; 
        
        // --- SCALING FACTOR ---
        this.scaleFactor = 2000.0; 
        
        // Dynamic Camera & Focus State
        this.focusedPlanet = null; 
        this.isFlyingToDest = false;
        this.startCamPos = new THREE.Vector3();
        this.startLookAt = new THREE.Vector3();
        this.flyProgress = 0;
        
        this.targetCamPos = new THREE.Vector3(0, 50 * this.scaleFactor, 400 * this.scaleFactor);
        this.targetLookAt = new THREE.Vector3(0, 0, 0);
        this.currentLookAt = new THREE.Vector3(0, 0, 0);
        
        this.currentFlySpeed = 4.0 * this.scaleFactor; 
        this.zoomLevel = 5.0; 

        // Manual Flight Controls State
        this.keys = { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, shift: false, q: false, e: false, space: false };
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.yaw = 0;
        this.pitch = 0;

        // Gamepad State
        this.gpDPadLeftDown = false;
        this.gpDPadRightDown = false;
        this.gpYDown = false; 

        // Ship State
        this.activeShip = 'none';
        this.shipView = '3rd';
        this.tieModel = null;
        this.falconModel = null;
        this.planetExpressModel = null;
        this.rickMortyModel = null;
        this.benatarModel = null;

        // Realistic Relative Timing Multipliers
        this.baseOrb = 0.001; 
        this.baseRot = 0.01;  

        this.getTexUrl = (path) => (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL(path) : path;

        this.planetStats = {
            sun: "Type: Yellow Dwarf\nMass: 330,000 Earths",
            mercury: "Type: Terrestrial\nDay: 58d",
            venus: "Type: Terrestrial\nDay: 243d",
            earth: "Type: Terrestrial\nDay: 24h",
            moon: "Type: Satellite\nDay: 27d",
            mars: "Type: Terrestrial\nDay: 24.6h",
            jupiter: "Type: Gas Giant\nDay: 10h",
            saturn: "Type: Gas Giant\nDay: 10.7h",
            neptune: "Type: Ice Giant\nDay: 16h",
            pluto: "Type: Dwarf Planet\nDay: 6.4d",
            blackhole: "Type: Supermassive Black Hole\nMass: Unknown",
            gateway: "Type: Space Station\nOrbit: NRHO (Moon)",
            iss: "Type: Space Station\nOrbit: LEO (Earth)",
            apollo: "Type: Lunar Lander\nLocation: Moon Surface"
        };

        this.initialized = false;

        this.createUI();
        this.createEngineMenu();
        this.createStatsOverlay();
        this.initThree();
        this.buildSolarSystem();
        this.addEventListeners();
    }

    createLoadingScreen() {
        this.loadingContainer = document.createElement('div');
        this.loadingContainer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
            background: black; z-index: 10005; display: flex; align-items: center;
            justify-content: center; flex-direction: column; color: #00ff41;
            font-family: 'Orbitron', 'Courier New', sans-serif; transition: opacity 3s;
        `;
        
        const text = document.createElement('h1');
        text.textContent = "INITIALIZING SOLAR SYSTEM...";
        text.style.cssText = "z-index: 10006; text-shadow: 0 0 10px #00ff41; letter-spacing: 3px;";
        this.loadingContainer.appendChild(text);

        this.container.appendChild(this.loadingContainer);
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'solar-system-container';
        this.container.style.cssText = `
            display: none; position: fixed; top: 0; left: 0; 
            width: 100vw; height: 100vh; z-index: 9999; 
            background-color: #000000;
            opacity: 0; transition: opacity 0.5s ease-in-out;
            overflow: hidden; font-family: 'Orbitron', 'Courier New', sans-serif;
        `;
        document.body.appendChild(this.container);

        const trigger = document.createElement('div');
        trigger.style.cssText = `
            position: absolute; right: 0; top: 0; width: 30px; height: 100%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            background: transparent; z-index: 10003;
        `;
        
        const indicator = document.createElement('div');
        indicator.textContent = '◀';
        indicator.style.cssText = `color: #fff; text-shadow: 0 0 5px #fff; opacity: 0.5; transition: 0.3s; font-size: 1.5rem; pointer-events: none;`;
        trigger.appendChild(indicator);

        this.sidebar = document.createElement('div');
        this.sidebar.style.cssText = `
            position: absolute; right: -280px; top: 0; width: 280px; height: 100%;
            background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(10px);
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 10002; display: flex; flex-direction: column; padding: 25px;
            box-sizing: border-box; color: #fff; overflow-y: auto;
            transition: right 0.3s ease;
        `;

        trigger.addEventListener('mouseenter', () => {
            this.sidebar.style.right = '0';
            indicator.style.opacity = '0';
        });
        this.sidebar.addEventListener('mouseenter', () => {
            this.sidebar.style.right = '0';
            indicator.style.opacity = '0';
        });
        this.sidebar.addEventListener('mouseleave', () => {
            this.sidebar.style.right = '-280px';
            indicator.style.opacity = '0.5';
        });
        
        const header = document.createElement('h2');
        header.textContent = "SOLAR SYSTEM";
        header.style.cssText = "margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 15px; font-size: 1.2rem; letter-spacing: 2px;";
        this.sidebar.appendChild(header);

        const destLabel = document.createElement('p');
        destLabel.textContent = "SELECT DESTINATION:";
        destLabel.style.cssText = "font-size: 0.8rem; opacity: 0.6; margin-bottom: 20px;";
        this.sidebar.appendChild(destLabel);

        this.destinations = ['Sun', 'Mercury', 'Venus', 'Earth', 'Moon', 'Mars', 'Jupiter', 'Saturn', 'Neptune', 'Pluto', 'BlackHole', 'Gateway', 'ISS', 'Apollo'];
        this.navButtons = [];

        this.destinations.forEach((dest, index) => {
            const btn = document.createElement('button');
            btn.textContent = dest.toUpperCase();
            btn.dataset.index = index;
            btn.style.cssText = `
                background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #fff;
                padding: 12px; margin-bottom: 10px; cursor: pointer; transition: 0.3s;
                text-align: left; font-family: inherit; font-size: 0.9rem; letter-spacing: 1px;
                border-radius: 4px;
            `;
            btn.addEventListener('mouseover', () => btn.style.background = 'rgba(255,255,255,0.1)');
            btn.addEventListener('mouseout', () => {
                if(btn.dataset.active !== 'true') btn.style.background = 'transparent';
            });
            btn.addEventListener('click', () => {
                this.triggerDestination(index);
            });
            this.navButtons.push(btn);
            this.sidebar.appendChild(btn);
        });

        const helpText = document.createElement('div');
        helpText.innerHTML = "<b>W S / L-Stick Y</b> : Pitch<br><b>A D / L-Stick X</b> : Steer (Yaw)<br><b>Q E / LB RB</b> : Roll<br><b>Space / RT</b> : Accelerate<br><b>Shift / LT</b> : Boost<br><b>Mouse / R-Stick</b> : Look Around<br><b>D-Pad L/R</b> : Cycle Planets<br><b>Y Button</b> : Switch Ship View";
        helpText.style.cssText = "margin-top: auto; font-size: 0.75rem; opacity: 0.5; line-height: 1.8; margin-bottom: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;";
        this.sidebar.appendChild(helpText);

        const exitBtn = document.createElement('button');
        exitBtn.textContent = 'EXIT TO OS';
        exitBtn.style.cssText = `
            background: #ff3333; border: none; color: white; padding: 15px;
            cursor: pointer; font-family: inherit; font-weight: bold; border-radius: 4px;
            text-transform: uppercase; letter-spacing: 1px; transition: 0.2s;
        `;
        exitBtn.addEventListener('mouseover', () => exitBtn.style.background = '#ff6666');
        exitBtn.addEventListener('mouseout', () => exitBtn.style.background = '#ff3333');
        exitBtn.addEventListener('click', () => this.close());
        this.sidebar.appendChild(exitBtn);

        this.container.appendChild(trigger);
        this.container.appendChild(this.sidebar);
    }

    createEngineMenu() {
        this.engineSidebar = document.createElement('div');
        this.engineSidebar.style.cssText = `
            position: absolute; left: -350px; top: 0; width: 350px; height: 100%;
            background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px);
            border-right: 1px solid rgba(0, 255, 65, 0.3);
            z-index: 10002; display: flex; flex-direction: row;
            box-sizing: border-box; color: #00ff41;
            transition: left 0.3s ease;
        `;

        const trigger = document.createElement('div');
        trigger.style.cssText = `
            position: absolute; left: 0; top: 0; width: 30px; height: 100%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            background: transparent; z-index: 10003;
        `;
        
        const indicator = document.createElement('div');
        indicator.textContent = '▶';
        indicator.style.cssText = `color: #00ff41; text-shadow: 0 0 5px #00ff41; opacity: 0.5; transition: 0.3s; font-size: 1.5rem; pointer-events: none;`;
        trigger.appendChild(indicator);

        trigger.addEventListener('mouseenter', () => { this.engineSidebar.style.left = '0'; indicator.style.opacity = '0'; });
        this.engineSidebar.addEventListener('mouseenter', () => { this.engineSidebar.style.left = '0'; indicator.style.opacity = '0'; });
        this.engineSidebar.addEventListener('mouseleave', () => { this.engineSidebar.style.left = '-350px'; indicator.style.opacity = '0.5'; });

        const navCol = document.createElement('div');
        navCol.style.cssText = `width: 120px; border-right: 1px solid rgba(0, 255, 65, 0.2); display: flex; flex-direction: column; padding-top: 20px;`;
        
        const createTabBtn = (id, text, active) => {
            const btn = document.createElement('div');
            btn.textContent = text;
            btn.style.cssText = `
                padding: 15px 10px; cursor: pointer; text-transform: uppercase; font-size: 0.85rem;
                font-weight: bold; transition: 0.2s; background: ${active ? 'rgba(0, 255, 65, 0.1)' : 'transparent'};
                border-left: 3px solid ${active ? '#00ff41' : 'transparent'};
            `;
            btn.onclick = () => {
                document.querySelectorAll('.engine-tab-btn').forEach(b => {
                    b.style.background = 'transparent'; b.style.borderLeft = '3px solid transparent';
                });
                btn.style.background = 'rgba(0, 255, 65, 0.1)'; btn.style.borderLeft = '3px solid #00ff41';
                document.querySelectorAll('.engine-tab-panel').forEach(p => p.style.display = 'none');
                document.getElementById(id).style.display = 'flex';
            };
            btn.className = 'engine-tab-btn';
            return btn;
        };

        const planetsBtn = createTabBtn('engine-tab-planets', 'Planets', true);
        const envBtn = createTabBtn('engine-tab-env', 'ENV', false);
        const shipsBtn = createTabBtn('engine-tab-ships', 'Ships', false); 
        
        navCol.appendChild(planetsBtn);
        navCol.appendChild(envBtn);
        navCol.appendChild(shipsBtn);

        const contentCol = document.createElement('div');
        contentCol.style.cssText = `flex-grow: 1; padding: 20px; display: flex; flex-direction: column; overflow-y: auto;`;
        
        const header = document.createElement('h2');
        header.textContent = "BETA";
        header.style.cssText = "margin-top: 0; border-bottom: 1px solid rgba(0,255,65,0.2); padding-bottom: 15px; font-size: 1.2rem; letter-spacing: 2px;";
        contentCol.appendChild(header);

        // --- PLANETS TAB ---
        const planetsTab = document.createElement('div');
        planetsTab.id = 'engine-tab-planets';
        planetsTab.className = 'engine-tab-panel';
        planetsTab.style.cssText = "display: flex; flex-direction: column;";
        
        const createSlider = (label, val, onChange) => {
            const container = document.createElement('div');
            container.style.cssText = "margin-bottom: 20px;";
            const lbl = document.createElement('div'); lbl.textContent = label; lbl.style.fontSize = "0.8rem"; lbl.style.marginBottom = "5px";
            const slider = document.createElement('input'); slider.type = "range"; slider.min = "0"; slider.max = "1"; slider.step = "0.01"; slider.value = val;
            slider.style.width = "100%"; slider.style.accentColor = "#00ff41";
            slider.oninput = (e) => onChange(parseFloat(e.target.value));
            container.appendChild(lbl); container.appendChild(slider);
            return container;
        };
        
        planetsTab.appendChild(createSlider("Saturn Ring Opacity", 0.9, (v) => {
            if(this.saturnRingMat) this.saturnRingMat.opacity = v;
        }));
        planetsTab.appendChild(createSlider("Earth Clouds Opacity", 0.8, (v) => {
            if(this.earthCloudMat) this.earthCloudMat.opacity = v;
        }));

        // --- ENVIRONMENT TAB ---
        const envTab = document.createElement('div');
        envTab.id = 'engine-tab-env';
        envTab.className = 'engine-tab-panel';
        envTab.style.cssText = "display: none; flex-direction: column;";
        
        const toggleContainer = document.createElement('div');
        toggleContainer.style.cssText = "margin-bottom: 20px; display: flex; align-items: center;";
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true; cb.style.accentColor = "#00ff41"; cb.style.marginRight = "10px";
        cb.onchange = (e) => {
            const v = e.target.checked;
            if(this.mainAsteroidBelt) this.mainAsteroidBelt.visible = v;
            if(this.kuiperBelt) this.kuiperBelt.visible = v;
        };
        const cbLbl = document.createElement('span'); cbLbl.textContent = "Enable Asteroid Fields"; cbLbl.style.fontSize = "0.85rem";
        toggleContainer.appendChild(cb); toggleContainer.appendChild(cbLbl);
        envTab.appendChild(toggleContainer);

        // --- SHIPS TAB ---
        const shipsTab = document.createElement('div');
        shipsTab.id = 'engine-tab-ships';
        shipsTab.className = 'engine-tab-panel';
        shipsTab.style.cssText = "display: none; flex-direction: column;";

        const createRadio = (name, value, label, checked) => {
            const container = document.createElement('div');
            container.style.cssText = "margin-bottom: 15px; display: flex; align-items: center;";
            const rb = document.createElement('input'); 
            rb.type = 'radio'; rb.name = name; rb.value = value; rb.checked = checked;
            rb.style.accentColor = "#00ff41"; rb.style.marginRight = "10px";
            rb.onchange = (e) => {
                if(e.target.checked) {
                    this.activeShip = value;
                    if (value === 'falcon' || value === 'planetexpress' || value === 'benatar') this.shipView = '3rd'; 
                    if (value !== 'none') {
                        this.shipGroup.position.copy(this.camera.position);
                        
                        // Set the ship's initial rotation to match the camera's looking direction
                        const shipDir = new THREE.Vector3(
                            Math.cos(this.pitch) * Math.sin(this.yaw),
                            Math.sin(this.pitch),
                            Math.cos(this.pitch) * Math.cos(this.yaw)
                        ).normalize();
                        this.shipGroup.lookAt(this.shipGroup.position.clone().add(shipDir));
                    }
                    this.updateShipVisibility();
                }
            };
            const rbLbl = document.createElement('span'); rbLbl.textContent = label; rbLbl.style.fontSize = "0.85rem";
            container.appendChild(rb); container.appendChild(rbLbl);
            return container;
        };

        shipsTab.appendChild(createRadio('ship-select', 'none', 'None (Free Cam)', true));
        shipsTab.appendChild(createRadio('ship-select', 'tie', 'ADV Tie Fighter', false));
        shipsTab.appendChild(createRadio('ship-select', 'falcon', 'Millennium Falcon', false));
        shipsTab.appendChild(createRadio('ship-select', 'planetexpress', 'Planet Express', false));
        shipsTab.appendChild(createRadio('ship-select', 'rickmorty', 'Rick & Morty Cruiser', false));
        shipsTab.appendChild(createRadio('ship-select', 'benatar', 'Benatar', false));

        const shipHelpText = document.createElement('div');
        shipHelpText.innerHTML = "<i>Press 'Y' on Gamepad or Keyboard to toggle 1st/3rd person view on supported ships.</i>";
        shipHelpText.style.cssText = "margin-top: 15px; font-size: 0.7rem; opacity: 0.6; line-height: 1.5; color: #aaa;";
        shipsTab.appendChild(shipHelpText);

        contentCol.appendChild(planetsTab);
        contentCol.appendChild(envTab);
        contentCol.appendChild(shipsTab);

        this.engineSidebar.appendChild(navCol);
        this.engineSidebar.appendChild(contentCol);

        this.container.appendChild(trigger);
        this.container.appendChild(this.engineSidebar);
    }

    createStatsOverlay() {
        this.statsContainer = document.createElement('div');
        this.statsContainer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 10010; overflow: hidden;
        `;
        this.container.appendChild(this.statsContainer);
        this.statLabels = {};
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 100000 * this.scaleFactor);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: false,
            logarithmicDepthBuffer: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = false;
        
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '10001';
        this.container.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.05));

        this.sunLight = new THREE.PointLight(0xffffff, 3.0, 10000 * this.scaleFactor);
        this.sunLight.position.set(0, 0, 0);
        this.sunLight.castShadow = false; 
        
        this.scene.add(this.sunLight);
    }

    updateShipVisibility() {
        if (this.tieModel) this.tieModel.visible = (this.activeShip === 'tie');
        if (this.falconModel) this.falconModel.visible = (this.activeShip === 'falcon');
        if (this.planetExpressModel) this.planetExpressModel.visible = (this.activeShip === 'planetexpress');
        if (this.rickMortyModel) this.rickMortyModel.visible = (this.activeShip === 'rickmorty');
        if (this.benatarModel) this.benatarModel.visible = (this.activeShip === 'benatar');
    }

    createPlanet(name, texturePath, size, distance, orbitSpeed, rotationSpeed, isEmissive = false) {
        const loader = new THREE.TextureLoader();
        
        const orbitPivot = new THREE.Group();
        this.scene.add(orbitPivot);

        const systemGroup = new THREE.Group();
        systemGroup.position.set(distance, 0, 0);
        orbitPivot.add(systemGroup);

        const geo = new THREE.SphereGeometry(size, 64, 64);
        let mat;
        
        if (isEmissive) {
            mat = new THREE.MeshBasicMaterial({ map: loader.load(this.getTexUrl(texturePath)) });
        } else if (name === 'earth') {
            mat = new THREE.MeshStandardMaterial({
                map: loader.load(this.getTexUrl(texturePath)),
                roughness: 0.8,
                metalness: 0.1
            });
            
            const nightMap = loader.load(this.getTexUrl('three-textures/8k_earth_nightmap.jpg'));
            
            mat.onBeforeCompile = (shader) => {
                shader.uniforms.nightMap = { value: nightMap };
                
                shader.vertexShader = `
                    varying vec3 vWPosition;
                    varying vec3 vWNormal;
                    ${shader.vertexShader}
                `.replace(
                    '#include <worldpos_vertex>',
                    `#include <worldpos_vertex>
                     vWPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
                     vWNormal = normalize(mat3(modelMatrix) * normal);`
                );

                shader.fragmentShader = `
                    uniform sampler2D nightMap;
                    varying vec3 vWPosition;
                    varying vec3 vWNormal;
                    ${shader.fragmentShader}
                `.replace(
                    'vec3 totalEmissiveRadiance = emissive;',
                    `vec3 totalEmissiveRadiance = emissive;
                     vec3 lightDir = normalize(-vWPosition); 
                     float intensity = dot(normalize(vWNormal), lightDir);
                     
                     float mixFactor = smoothstep(0.1, -0.2, intensity);
                     
                     vec3 nightColor = texture2D(nightMap, vUv).rgb;
                     totalEmissiveRadiance += nightColor * mixFactor * 1.5; 
                    `
                );
            };
        } else {
            mat = new THREE.MeshStandardMaterial({
                map: loader.load(this.getTexUrl(texturePath)),
                roughness: 0.8,
                metalness: 0.1
            });
        }

        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        systemGroup.add(mesh);

        this.planets[name] = { mesh, orbitPivot, systemGroup, orbitSpeed, rotationSpeed, size };
        return this.planets[name];
    }

    createAsteroidBelt(innerRadius, outerRadius, count, heightSpread) {
        const beltGroup = new THREE.Group();
        this.scene.add(beltGroup);
        const tex = new THREE.TextureLoader().load(this.getTexUrl('three-textures/asteroid.png'));
        
        for (let i = 0; i < count; i++) {
            const mat = new THREE.SpriteMaterial({ map: tex, color: 0xffffff });
            const sprite = new THREE.Sprite(mat);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
            const height = (Math.random() - 0.5) * heightSpread;
            
            sprite.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
            
            const size = (Math.random() * 4 + 1) * (this.scaleFactor * 0.5);
            sprite.scale.set(size, size, 1);
            
            beltGroup.add(sprite);
        }
        
        return beltGroup;
    }

    buildSolarSystem() {
        const gltfLoader = new THREE.GLTFLoader();
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        gltfLoader.setDRACOLoader(dracoLoader);
        const loader = new THREE.TextureLoader();
        const S = this.scaleFactor; 

        const spaceSkyGeo = new THREE.SphereGeometry(60000 * S, 64, 64);
        const spaceSkyMat = new THREE.MeshBasicMaterial({
            map: loader.load(this.getTexUrl('three-textures/8k_stars.jpg')),
            side: THREE.BackSide
        });
        this.scene.add(new THREE.Mesh(spaceSkyGeo, spaceSkyMat));

        this.createPlanet('sun', 'three-textures/8k_sun.jpg', 218 * S, 0, 0, this.baseOrb / 27, true);
        this.createPlanet('mercury', 'three-textures/8k_mercury.jpg', 0.76 * S, 300 * S, this.baseOrb * 4.1, this.baseRot / 58);

        const venus = this.createPlanet('venus', 'three-textures/8k_venus_surface.jpg', 1.9 * S, 400 * S, this.baseOrb * 1.6, -this.baseRot / 243);
        const venusCloudGeo = new THREE.SphereGeometry(1.95 * S, 64, 64);
        const venusCloudMat = new THREE.MeshStandardMaterial({
            map: loader.load(this.getTexUrl('three-textures/4k_venus_atmosphere.jpg')),
            transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
        });
        venus.mesh.add(new THREE.Mesh(venusCloudGeo, venusCloudMat));

        const earth = this.createPlanet('earth', 'three-textures/8k_earth_daymap.jpg', 2.0 * S, 550 * S, this.baseOrb, this.baseRot);
        const earthCloudGeo = new THREE.SphereGeometry(2.05 * S, 64, 64);
        this.earthCloudMat = new THREE.MeshStandardMaterial({
            map: loader.load(this.getTexUrl('three-textures/8k_earth_clouds.jpg')),
            transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
        });
        earth.mesh.add(new THREE.Mesh(earthCloudGeo, this.earthCloudMat)); 

        const moonOrbitPivot = new THREE.Group();
        earth.systemGroup.add(moonOrbitPivot); 
        
        const moonGeo = new THREE.SphereGeometry(0.54 * S, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({ map: loader.load(this.getTexUrl('three-textures/8k_moon.jpg')), roughness: 1.0 });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(60 * S, 0, 0); 
        moonOrbitPivot.add(moonMesh);
        
        this.planets['moon'] = { 
            mesh: moonMesh, orbitPivot: moonOrbitPivot, 
            rotationSpeed: 0, orbitSpeed: this.baseOrb * 13.5, size: 0.54 * S,
            visibilityRange: 40 * S, slowZone: 150 * S
        };

        this.shipGroup = new THREE.Group();
        this.scene.add(this.shipGroup);

        gltfLoader.load(this.getTexUrl('three-models/star_wars_galaxies_-_tie_advanced.glb'), (gltf) => {
            const tie = gltf.scene;
            tie.scale.set(0.015, 0.015, 0.015);
            const box = new THREE.Box3().setFromObject(tie);
            const center = box.getCenter(new THREE.Vector3());
            tie.position.sub(center); 
            this.tieModel = new THREE.Group();
            this.tieModel.add(tie);
            this.shipGroup.add(this.tieModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/star_wars_galaxies_-_yt1300_outside.glb'), (gltf) => {
            const falcon = gltf.scene;
            falcon.scale.set(0.2, 0.2, 0.2); 
            const box = new THREE.Box3().setFromObject(falcon);
            const center = box.getCenter(new THREE.Vector3());
            falcon.position.sub(center);
            falcon.rotation.y = Math.PI;

            this.falconModel = new THREE.Group();
            this.falconModel.add(falcon);
            this.shipGroup.add(this.falconModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/planet_express_spaceship.glb'), (gltf) => {
            const ship = gltf.scene;
            ship.scale.set(0.2, 0.2, 0.2); 
            
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.set(-center.x, -center.y, -center.z);
            
            const wrapper = new THREE.Group();
            wrapper.add(ship);
            wrapper.rotation.y = -Math.PI / 2; 
            
            this.planetExpressModel = new THREE.Group();
            this.planetExpressModel.add(wrapper);
            this.shipGroup.add(this.planetExpressModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/rick_and_morty_space_ship.glb'), (gltf) => {
            const ship = gltf.scene;
            ship.scale.set(1.2, 1.2, 1.5);
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            ship.rotation.y = 0; 
            
            this.rickMortyModel = new THREE.Group();
            this.rickMortyModel.add(ship);
            this.shipGroup.add(this.rickMortyModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/guardians_of_the_galaxy_avengers_benatar_ship.glb'), (gltf) => {
            const ship = gltf.scene;
            ship.scale.set(0.01, 0.01, 0.01);
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            ship.rotation.y = 0; 
            
            this.benatarModel = new THREE.Group();
            this.benatarModel.add(ship);
            this.shipGroup.add(this.benatarModel);
            this.updateShipVisibility();
        });

        const gatewayOrbit = new THREE.Group();
        moonOrbitPivot.add(gatewayOrbit);
        gatewayOrbit.position.set(60 * S, 0, 0); 

        const gatewayGroup = new THREE.Group();
        gatewayGroup.position.set(1.5 * S, 0, 0);
        gatewayOrbit.add(gatewayGroup);

        this.planets['gateway'] = { 
            mesh: gatewayGroup, orbitPivot: gatewayOrbit, 
            rotationSpeed: this.baseRot * 2, orbitSpeed: this.baseOrb * 40, size: 0.05 * S, visibilityRange: 15 * S
        };

        const gatewayEnvMap = loader.load(this.getTexUrl('three-models/Low Lunar Orbit.jpg'));
        gatewayEnvMap.mapping = THREE.EquirectangularReflectionMapping;

        gltfLoader.load(this.getTexUrl('three-models/Gateway Core.glb'), (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.02 * S, 0.02 * S, 0.02 * S);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material.envMap = gatewayEnvMap;
                    child.material.envMapIntensity = 1.5;
                }
            });
            gatewayGroup.add(model);
        });

        const issOrbit = new THREE.Group();
        earth.systemGroup.add(issOrbit);
        
        const issGroup = new THREE.Group();
        issGroup.position.set(4.0 * S, 0, 0); 
        issOrbit.add(issGroup);

        this.planets['iss'] = { 
            mesh: issGroup, orbitPivot: issOrbit, 
            rotationSpeed: this.baseRot * 3, orbitSpeed: this.baseOrb * 30, size: 0.1 * S, visibilityRange: 20 * S
        };

        gltfLoader.load(this.getTexUrl('three-models/ISS_stationary.glb'), (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.0025 * S, 0.0025 * S, 0.0025 * S); 
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.x = -center.x;
            model.position.y = -center.y;
            model.position.z = -center.z;
            const centerContainer = new THREE.Group();
            centerContainer.add(model);
            issGroup.add(centerContainer);
        });

        const apolloGroup = new THREE.Group();
        apolloGroup.position.set(-0.545 * S, 0, 0); 
        moonMesh.add(apolloGroup);
        const apolloLight = new THREE.PointLight(0xffdd88, 0.02, 2 * S);
        apolloLight.position.set(-0.1 * S, 0, 0);
        apolloGroup.add(apolloLight);

        this.planets['apollo'] = { 
            mesh: apolloGroup, orbitPivot: null, 
            rotationSpeed: 0, orbitSpeed: 0, size: 0.02 * S, visibilityRange: 8 * S, collisionSize: 0.02 * S
        };

        gltfLoader.load(this.getTexUrl('three-models/Apollo Lunar Module.glb'), (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.008 * S, 0.008 * S, 0.008 * S);
            model.rotation.set(0, 0, Math.PI / 2);
            apolloGroup.add(model);
        });

        this.createPlanet('mars', 'three-textures/8k_mars.jpg', 1.06 * S, 700 * S, this.baseOrb * 0.53, this.baseRot / 1.02);
        this.mainAsteroidBelt = this.createAsteroidBelt(850 * S, 1050 * S, 1500, 80 * S);
        this.createPlanet('jupiter', 'three-textures/8k_jupiter.jpg', 22.4 * S, 1200 * S, this.baseOrb * 0.08, this.baseRot * 2.4);

        const saturn = this.createPlanet('saturn', 'three-textures/8k_saturn.jpg', 18.9 * S, 1800 * S, this.baseOrb * 0.034, this.baseRot * 2.2);
        const ringGeo = new THREE.RingGeometry(25 * S, 45 * S, 64);
        this.saturnRingMat = new THREE.MeshStandardMaterial({
            map: loader.load(this.getTexUrl('three-textures/8k_saturn_ring_alpha.png')),
            side: THREE.DoubleSide, transparent: true, opacity: 0.9
        });
        const ringMesh = new THREE.Mesh(ringGeo, this.saturnRingMat);
        ringMesh.rotation.x = Math.PI / 2 + 0.3;
        saturn.mesh.add(ringMesh);

        this.createPlanet('neptune', 'three-textures/2k_neptune.jpg', 7.76 * S, 2600 * S, this.baseOrb * 0.006, this.baseRot * 1.5);
        this.kuiperBelt = this.createAsteroidBelt(3000 * S, 3600 * S, 2500, 150 * S);

        const plutoOrbit = new THREE.Group();
        this.scene.add(plutoOrbit);
        const plutoGroup = new THREE.Group();
        plutoGroup.position.set(3100 * S, 0, 0); 
        plutoOrbit.add(plutoGroup);
        this.planets['pluto'] = { mesh: plutoGroup, orbitPivot: plutoOrbit, rotationSpeed: this.baseRot * 0.15, orbitSpeed: this.baseOrb * 0.004, size: 0.5 * S, visibilityRange: 200 * S };
        
        gltfLoader.load(this.getTexUrl('three-models/pluto.glb'), (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.01 * S, 0.01 * S, 0.01 * S);
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            plutoGroup.add(model);
        });

        const blackHoleGroup = new THREE.Group();
        blackHoleGroup.position.set(25000 * S, 5000 * S, -25000 * S);
        this.scene.add(blackHoleGroup);
        this.planets['blackhole'] = { 
            mesh: blackHoleGroup, orbitPivot: null, 
            rotationSpeed: this.baseRot * 2.0, orbitSpeed: 0, 
            size: 50 * S, visibilityRange: 30000 * S, collisionSize: 100 * S 
        };
        
        gltfLoader.load(this.getTexUrl('three-models/black_hole.glb'), (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.5 * S, 0.5 * S, 0.5 * S); 
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            blackHoleGroup.add(model);
        });

        this.camera.position.set(550 * S, 10 * S, 40 * S);
        this.triggerDestination(3); 
    }

    triggerDestination(index) {
        if (index < 0) index = this.destinations.length - 1;
        if (index >= this.destinations.length) index = 0;
        
        this.navButtons.forEach(b => { b.style.background = 'transparent'; b.dataset.active = 'false'; });
        const activeBtn = this.navButtons[index];
        activeBtn.style.background = 'rgba(255,255,255,0.2)';
        activeBtn.dataset.active = 'true';
        
        const destName = this.destinations[index].toLowerCase();
        this.focusedPlanet = this.planets[destName];
        
        this.isFlyingToDest = true;
        this.flyProgress = 0;
        this.zoomLevel = 5.0; 
        this.startCamPos.copy(this.camera.position);
        
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        this.startLookAt.copy(this.camera.position).add(dir.multiplyScalar(100));
    }

    clearFocus() {
        this.focusedPlanet = null;
        this.isFlyingToDest = false;
        this.navButtons.forEach(b => { 
            b.style.background = 'transparent'; 
            b.dataset.active = 'false'; 
        });
    }

    addEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            let key = e.key.toLowerCase();
            
            if (e.key === ' ') {
                key = 'space';
                e.preventDefault();
            }
            
            if (key === 'y' && (this.activeShip === 'tie' || this.activeShip === 'rickmorty')) {
                this.shipView = this.shipView === '1st' ? '3rd' : '1st';
            }

            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
                if(this.focusedPlanet) this.clearFocus(); 
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!this.isActive) return;
            let key = e.key.toLowerCase();
            
            if (e.key === ' ') {
                key = 'space';
            }
            
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
            }
        });

        this.container.addEventListener('mousedown', (e) => {
            if (!this.isActive || e.target !== this.renderer.domElement) return;
            this.isDragging = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isActive || !this.isDragging) return;
            
            const deltaX = e.clientX - this.mouse.x;
            const deltaY = e.clientY - this.mouse.y;

            this.yaw -= deltaX * 0.005;
            this.pitch -= deltaY * 0.005;
            
            this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('wheel', (e) => {
            if (!this.isActive || !this.focusedPlanet) return;
            this.zoomLevel += e.deltaY * 0.002;
            this.zoomLevel = Math.max(1.2, Math.min(this.zoomLevel, 20.0));
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    pollGamepad() {
        if (!this.isActive) return;
        const gamepads = navigator.getGamepads();
        
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (!gp) continue;

            if (Math.abs(gp.axes[0]) > 0.1 || Math.abs(gp.axes[1]) > 0.1) {
                if (this.focusedPlanet) this.clearFocus();
            }

            const direction = new THREE.Vector3(
                Math.cos(this.pitch) * Math.sin(this.yaw),
                Math.sin(this.pitch),
                Math.cos(this.pitch) * Math.cos(this.yaw)
            );
            const right = new THREE.Vector3().crossVectors(this.camera.up, direction).normalize();
            
            if (this.activeShip === 'none') {
                let moveSpeed = this.currentFlySpeed;
                
                if (gp.buttons[6] && gp.buttons[6].pressed) moveSpeed += (gp.buttons[6].value * this.currentFlySpeed * 2.0);
                
                if (Math.abs(gp.axes[1]) > 0.1) { 
                    this.camera.position.add(direction.multiplyScalar(-gp.axes[1] * moveSpeed));
                }
                if (Math.abs(gp.axes[0]) > 0.1) { 
                    this.camera.position.add(right.multiplyScalar(-gp.axes[0] * moveSpeed));
                }
            }

            if (Math.abs(gp.axes[2]) > 0.1) this.yaw -= gp.axes[2] * 0.05;
            if (Math.abs(gp.axes[3]) > 0.1) this.pitch -= gp.axes[3] * 0.05;
            
            this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

            if (gp.buttons[14] && gp.buttons[14].pressed) {
                if (!this.gpDPadLeftDown) {
                    this.gpDPadLeftDown = true;
                    let currentIndex = this.navButtons.findIndex(b => b.dataset.active === 'true');
                    this.triggerDestination(currentIndex - 1);
                }
            } else { this.gpDPadLeftDown = false; }

            if (gp.buttons[15] && gp.buttons[15].pressed) {
                if (!this.gpDPadRightDown) {
                    this.gpDPadRightDown = true;
                    let currentIndex = this.navButtons.findIndex(b => b.dataset.active === 'true');
                    this.triggerDestination(currentIndex + 1);
                }
            } else { this.gpDPadRightDown = false; }

            if (gp.buttons[3] && gp.buttons[3].pressed) {
                if (!this.gpYDown) {
                    this.gpYDown = true;
                    if (this.activeShip === 'tie' || this.activeShip === 'rickmorty') {
                        this.shipView = this.shipView === '1st' ? '3rd' : '1st';
                    }
                }
            } else { this.gpYDown = false; }
            
            if (!this.focusedPlanet && this.activeShip === 'none') {
                this.camera.up.set(0, 1, 0);
                this.camera.lookAt(this.camera.position.clone().add(direction));
            }
        }
    }

    updateFlyControls(targetObj, direction) {
        let moveSpeed = this.currentFlySpeed; 
        
        if (this.keys['shift']) moveSpeed *= 3.0;
        
        const forward = direction.clone();
        const right = new THREE.Vector3().crossVectors(this.camera.up, forward).normalize();

        if (this.keys['w']) targetObj.position.add(forward.multiplyScalar(moveSpeed));
        if (this.keys['s']) targetObj.position.add(forward.multiplyScalar(-moveSpeed));
        if (this.keys['a']) targetObj.position.add(right.multiplyScalar(-moveSpeed)); 
        if (this.keys['d']) targetObj.position.add(right.multiplyScalar(moveSpeed));  
    }

    resolveCollisions() {
        const targetObj = (this.activeShip !== 'none') ? this.shipGroup : this.camera;

        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            
            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);

            const baseSize = p.collisionSize !== undefined ? p.collisionSize : p.size;
            const minAllowedDistance = baseSize + 0.15; 
            const currentDist = targetObj.position.distanceTo(wPos);

            if (currentDist < minAllowedDistance) {
                let pushDir = new THREE.Vector3().subVectors(targetObj.position, wPos);
                if (pushDir.lengthSq() < 0.000001) {
                    pushDir.set(0, 1, 0); 
                }
                pushDir.normalize();
                targetObj.position.copy(wPos).add(pushDir.multiplyScalar(minAllowedDistance));
            }
        }
    }

    open() {
        this.container.style.display = 'block';
        if (!this.initialized) {
            this.createLoadingScreen();
            this.initialized = true;
            setTimeout(() => {
                this.loadingContainer.style.opacity = '0';
                setTimeout(() => {
                    this.loadingContainer.style.display = 'none';
                }, 1000);
            }, 5000); 
        }

        setTimeout(() => {
            this.container.style.opacity = '1';
            this.isActive = true;
            const dir = new THREE.Vector3();
            this.camera.getWorldDirection(dir);
            this.yaw = Math.atan2(dir.x, dir.z);
            this.pitch = Math.asin(dir.y);
            this.animate();
        }, 50);
    }

    animate() {
        if (!this.isActive) return;
        requestAnimationFrame(() => this.animate());

        let minCameraDist = Infinity;
        const targetObj = (this.activeShip !== 'none') ? this.shipGroup : this.camera;

        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);
            const surfaceDist = targetObj.position.distanceTo(wPos) - (p.collisionSize !== undefined ? p.collisionSize : p.size);
            if (surfaceDist < minCameraDist) minCameraDist = surfaceDist;
        }

        this.currentFlySpeed = 4.0 * (this.scaleFactor / 5); 
        const proximityThreshold = 100 * this.scaleFactor;
        
        if (minCameraDist < proximityThreshold) {
            let t = Math.max(0, minCameraDist / proximityThreshold);
            this.currentFlySpeed = (0.02 * this.scaleFactor) + (3.98 * (this.scaleFactor / 5)) * (t * t); 
        }

        this.pollGamepad();

        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);
            const distToCam = targetObj.position.distanceTo(wPos);
            let speedMult = 1.0;
            const slowZone = p.slowZone || p.visibilityRange || (p.size * 40); 
            const minZone = p.size * 3;   
            if (distToCam < slowZone) {
                let t = (distToCam - minZone) / (slowZone - minZone);
                t = Math.max(0, Math.min(1, t));
                t = Math.pow(t, 3);
                speedMult = 0.0001 + 0.9999 * t;
            }
            if (p.orbitPivot) p.orbitPivot.rotation.y += p.orbitSpeed * speedMult;
            if (p.mesh) p.mesh.rotation.y += p.rotationSpeed * speedMult;
        }

        if (this.mainAsteroidBelt) this.mainAsteroidBelt.rotation.y -= this.baseOrb * 0.1;
        if (this.kuiperBelt) this.kuiperBelt.rotation.y -= this.baseOrb * 0.05;

        const direction = new THREE.Vector3(
            Math.cos(this.pitch) * Math.sin(this.yaw),
            Math.sin(this.pitch),
            Math.cos(this.pitch) * Math.cos(this.yaw)
        );

        if (this.focusedPlanet) {
            const worldPos = new THREE.Vector3();
            this.focusedPlanet.mesh.updateMatrixWorld(true);
            this.focusedPlanet.mesh.getWorldPosition(worldPos);

            let viewDist = this.focusedPlanet.size * this.zoomLevel;
            if (this.focusedPlanet.size > (20 * this.scaleFactor)) viewDist = this.focusedPlanet.size * (this.zoomLevel * 0.5);

            const minViewDist = (this.focusedPlanet.collisionSize !== undefined ? this.focusedPlanet.collisionSize : this.focusedPlanet.size) + 0.2;
            if (viewDist < minViewDist) viewDist = minViewDist;

            if (this.isFlyingToDest) {
                this.flyProgress += 0.015; 
                if (this.flyProgress >= 1.0) this.flyProgress = 1.0;
                const t = this.flyProgress * this.flyProgress * (3 - 2 * this.flyProgress);
                let dirFromCenter = worldPos.clone().normalize();
                if (this.focusedPlanet === this.planets['apollo']) {
                    const moonPos = new THREE.Vector3();
                    this.planets['moon'].mesh.getWorldPosition(moonPos);
                    dirFromCenter = new THREE.Vector3().subVectors(worldPos, moonPos).normalize();
                }
                if (dirFromCenter.lengthSq() === 0) dirFromCenter.set(0, 0, 1); 
                this.targetCamPos.copy(worldPos).add(dirFromCenter.multiplyScalar(viewDist));
                this.camera.position.lerpVectors(this.startCamPos, this.targetCamPos, t);
                this.currentLookAt.lerpVectors(this.startLookAt, worldPos, t);
                this.camera.lookAt(this.currentLookAt);
                
                if (this.flyProgress === 1.0) {
                    this.isFlyingToDest = false;
                    const dir = new THREE.Vector3().subVectors(this.camera.position, worldPos).normalize();
                    this.yaw = Math.atan2(dir.x, dir.z);
                    this.pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
                    
                    if (this.activeShip !== 'none') {
                        this.shipGroup.lookAt(this.shipGroup.position.clone().add(dir));
                    }
                }
            } else {
                const offset = new THREE.Vector3(
                    Math.cos(this.pitch) * Math.sin(this.yaw),
                    Math.sin(this.pitch),
                    Math.cos(this.pitch) * Math.cos(this.yaw)
                ).multiplyScalar(viewDist);
                this.camera.position.copy(worldPos).add(offset);
                this.camera.lookAt(worldPos);
                this.currentLookAt.copy(worldPos);
            }
            if (this.activeShip !== 'none') {
                this.shipGroup.position.copy(this.camera.position);
            }

        } else if (this.activeShip !== 'none') {
            
            // ==========================================
            // TRUE 6DOF FLIGHT LOGIC (GTA 5 JET STYLE)
            // ==========================================
            
            let roll = 0;
            let pitchInput = 0;
            let yawInput = 0;
            let accel = 0;
            let boostMult = 1.0;

            // Keyboard Ship Inputs
            if (this.keys['a']) yawInput -= 1; // Steer Left (Yaw)
            if (this.keys['d']) yawInput += 1; // Steer Right (Yaw)
            if (this.keys['w']) pitchInput -= 1; // Pitch Nose Down
            if (this.keys['s']) pitchInput += 1; // Pitch Nose Up
            if (this.keys['q']) roll -= 1; // Roll Left
            if (this.keys['e']) roll += 1; // Roll Right
            
            // Optional Arrow keys for pitch
            if (this.keys['arrowup']) pitchInput -= 1; 
            if (this.keys['arrowdown']) pitchInput += 1; 
            
            if (this.keys['shift']) boostMult = 4.0; // Boost
            if (this.keys['space']) accel += 1; // Accelerate

            // Gamepad Ship Inputs
            const gamepads = navigator.getGamepads();
            for (let i = 0; i < gamepads.length; i++) {
                const gp = gamepads[i];
                if (!gp) continue;
                
                // Left Stick X -> Yaw (Steer Left/Right)
                if (Math.abs(gp.axes[0]) > 0.1) yawInput += gp.axes[0]; 
                
                // Left Stick Y -> Pitch
                // (+ Y is pulling stick back = Pitch Nose Up)
                if (Math.abs(gp.axes[1]) > 0.1) pitchInput += gp.axes[1]; 

                // LB / RB -> Roll
                if (gp.buttons[4] && gp.buttons[4].pressed) roll -= 1; // Roll Left
                if (gp.buttons[5] && gp.buttons[5].pressed) roll += 1; // Roll Right

                // Right Trigger -> Accelerate
                if (gp.buttons[7] && gp.buttons[7].pressed) {
                    accel += gp.buttons[7].value;
                }

                // Left Trigger -> Speed Boost
                if (gp.buttons[6] && gp.buttons[6].pressed) {
                    boostMult += gp.buttons[6].value * 3.0; // up to 4x multiplier
                }
            }

            // Clamp inputs
            roll = Math.max(-1, Math.min(1, roll));
            pitchInput = Math.max(-1, Math.min(1, pitchInput));
            yawInput = Math.max(-1, Math.min(1, yawInput));
            accel = Math.max(0, Math.min(1, accel));

            // Apply Rotations Locally (True 6DOF avoiding Gimbal Lock)
            this.shipGroup.rotateZ(-roll * 0.04);       // Roll
            this.shipGroup.rotateX(-pitchInput * 0.03); // Pitch
            this.shipGroup.rotateY(-yawInput * 0.02);   // Yaw

            // Compute local Forward Vector (+Z) converted to World Space
            const shipDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shipGroup.quaternion).normalize();

            // Move Ship
            const moveSpeed = this.currentFlySpeed * boostMult;
            if (accel > 0) {
                this.shipGroup.position.add(shipDir.multiplyScalar(accel * moveSpeed));
            }

            // CRITICAL FIX: Update the ship's world matrix immediately so the 1st person camera
            // doesn't lag a frame behind when moving fast (which caused the interior to disappear)
            this.shipGroup.updateMatrixWorld(true);

            // --- CAMERA FOLLOW LOGIC ---
            let camDist = 110.0;
            let heightOffset = 35.0;
            let firstPersonOffset = new THREE.Vector3(0, 0, 0);

            // Fetch Visual Scales
            if (this.activeShip === 'tie') { 
                camDist = 190.0; heightOffset = 30.0; 
                // Adjusted TIE offset to be seated further forward
                if (this.shipView === '1st') { this.tieModel.scale.set(1.0, 1.0, 1.0); firstPersonOffset.set(0, 0.2, 1.4); }
                else { this.tieModel.scale.set(10.0, 10.0, 10.0); }
            }
            else if (this.activeShip === 'falcon') { 
                camDist = 110.0; heightOffset = 35.0; 
                this.falconModel.scale.set(10.0, 10.0, 10.0);
            }
            else if (this.activeShip === 'planetexpress') { 
                camDist = 110.0; heightOffset = 20.0; 
                this.planetExpressModel.scale.set(10.0, 10.0, 10.0);
            }
            else if (this.activeShip === 'rickmorty') { 
                camDist = 110.0; heightOffset = 35.0; 
                // Adjusted Rick & Morty offset to be seated further forward
                if (this.shipView === '1st') { this.rickMortyModel.scale.set(1.0, 1.0, 1.0); firstPersonOffset.set(0.5, 0.3, 0.2); }
                else { this.rickMortyModel.scale.set(10.0, 10.0, 10.0); }
            }
            else if (this.activeShip === 'benatar') { 
                camDist = 110.0; heightOffset = 20.0; 
                this.benatarModel.scale.set(1.0, 1.0, 1.0);
            }

            if (this.shipView === '1st') {
                // 1st Person: Camera sits inside the rolling cockpit
                const idealPos = this.shipGroup.localToWorld(firstPersonOffset.clone());
                this.camera.position.copy(idealPos);
                
                // Allow free look INSIDE the cockpit. 
                // We construct the absolute world direction directly from yaw and pitch
                const worldCamDir = new THREE.Vector3(
                    Math.cos(this.pitch) * Math.sin(this.yaw),
                    Math.sin(this.pitch),
                    Math.cos(this.pitch) * Math.cos(this.yaw)
                ).normalize();
                
                // Camera horizon rolls perfectly with the ship
                this.camera.up.copy(new THREE.Vector3(0, 1, 0).applyQuaternion(this.shipGroup.quaternion));
                this.camera.lookAt(idealPos.clone().add(worldCamDir));
            } else {
                // 3rd Person Orbit Camera (GTA Style)
                // Camera ignores ship roll and stays level to the horizon 
                this.camera.up.set(0, 1, 0); 

                const targetLookAt = this.shipGroup.position.clone().add(new THREE.Vector3(0, heightOffset * 0.5, 0));
                
                const worldCamDir = new THREE.Vector3(
                    Math.cos(this.pitch) * Math.sin(this.yaw),
                    Math.sin(this.pitch),
                    Math.cos(this.pitch) * Math.cos(this.yaw)
                ).normalize();

                const idealPos = targetLookAt.clone().sub(worldCamDir.multiplyScalar(camDist));
                
                this.camera.position.copy(idealPos);
                this.camera.lookAt(targetLookAt);
            }

        } else {
            // Standard Free Cam 
            this.camera.up.set(0, 1, 0); 
            this.camera.lookAt(this.camera.position.clone().add(direction));
            this.updateFlyControls(this.camera, direction);
        }

        this.resolveCollisions();

        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);
            if (!this.statLabels[key]) {
                const lbl = document.createElement('div');
                lbl.style.cssText = `
                    position: absolute; color: #00ff41; display: none;
                    font-size: 0.75rem; pointer-events: none; text-shadow: 0 0 5px #00ff41;
                    background: rgba(0,0,0,0.5); padding: 5px 10px; border: 1px solid rgba(0,255,65,0.3);
                    box-shadow: 0 0 10px #00ff41; border-radius: 4px; line-height: 1.5; text-align: center;
                    transition: opacity 0.2s;
                `;
                this.statsContainer.appendChild(lbl);
                this.statLabels[key] = lbl;
            }
            const vector = wPos.clone();
            vector.y += p.size * 1.5 + 0.3; 
            vector.project(this.camera);
            const dist = this.camera.position.distanceTo(wPos);
            const maxVisibleDist = p.visibilityRange ? p.visibilityRange * 2 : p.size * 60;
            if (vector.z < 1 && dist < maxVisibleDist) { 
                const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
                const lbl = this.statLabels[key];
                lbl.style.display = 'block';
                lbl.style.left = `${x}px`;
                lbl.style.top = `${y}px`;
                lbl.innerHTML = `<b>${key.toUpperCase()}</b><br>${this.planetStats[key].replace(/\n/g, '<br>')}`;
            } else {
                this.statLabels[key].style.display = 'none';
            }
        }
        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dockSpaceBtn = document.getElementById('dock-space');
    let solarSystemInstance = null;
    if (dockSpaceBtn) {
        dockSpaceBtn.addEventListener('click', () => {
            if (!solarSystemInstance) {
                solarSystemInstance = new SolarSystemApp();
            }
            solarSystemInstance.open();
        });
    }
});