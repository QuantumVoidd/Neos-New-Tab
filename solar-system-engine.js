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
        
        this.currentFlySpeed = 12.0 * this.scaleFactor; // Adjusted for new base speed
        this.zoomLevel = 5.0; 

        // Manual Flight Controls State
        this.keys = { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, shift: false, q: false, e: false, space: false };
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.yaw = 0;
        this.pitch = 0;
        
        // Hyperspeed State
        this.isBoosting = false;
        this.boostCharge = 0;
        this.joltMultiplier = 0;
        this.hyperState = 'idle'; // Tracks audio states: idle, charging, jumping, exiting
        this.tardisMatProgress = 0.0; // Tracks the rematerialization animation
        
        // FPS Limiting and Tracking
        this.targetFPS = 60; // Default locked to 60
        this.lastRenderTime = performance.now();
        this.fpsCalcTime = performance.now();
        this.framesThisSecond = 0;

        this.getTexUrl = (path) => (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL(path) : path;

        // Standard Hyperspeed Audio Elements
        this.audioBuildup = new Audio(this.getTexUrl('solarsystem-audio/hyperspeed_buildup.mp3'));
        this.audioFlight = new Audio(this.getTexUrl('solarsystem-audio/hyperspeed_flight.mp3'));
        this.audioFlight.loop = true;
        this.audioExit = new Audio(this.getTexUrl('solarsystem-audio/hyperspeed_exit.mp3'));

        // TARDIS Custom Hyperspeed Audio Elements
        this.tardisAudioBuildup = new Audio(this.getTexUrl('solarsystem-audio/tardis_buildup.mp3'));
        this.tardisAudioFlight = new Audio(this.getTexUrl('solarsystem-audio/tardis_flight.mp3'));
        this.tardisAudioFlight.loop = true;
        this.tardisAudioExit = new Audio(this.getTexUrl('solarsystem-audio/tardis_exit.mp3'));
        
        // Dedicated Cockpit Look State (1st Person)
        this.cockpitYaw = 0;
        this.cockpitPitch = 0;
        this.lastLookTime = 0; 

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
        this.xwingModel = null;
        this.xwingCockpitModel = null;
        this.tardisModel = null;
        this.enterpriseModel = null;

        // Realistic Relative Timing Multipliers
        this.baseOrb = 0.001; 
        this.baseRot = 0.01;  

        this.planetStats = {
            sun: "Type: Yellow Dwarf\nMass: 330,000 Earths",
            mercury: "Type: Terrestrial\nDay: 58d",
            venus: "Type: Terrestrial\nDay: 243d",
            earth: "Type: Terrestrial\nDay: 24h",
            moon: "Type: Satellite\nDay: 27d",
            mars: "Type: Terrestrial\nDay: 24.6h",
            ceres: "Type: Dwarf Planet\nDay: 9h",
            jupiter: "Type: Gas Giant\nDay: 10h",
            saturn: "Type: Gas Giant\nDay: 10.7h",
            neptune: "Type: Ice Giant\nDay: 16h",
            pluto: "Type: Dwarf Planet\nDay: 6.4d",
            charon: "Type: Satellite\nDay: 6.4d",
            haumea: "Type: Dwarf Planet\nDay: 3.9h",
            makemake: "Type: Dwarf Planet\nDay: 22.5h",
            eris: "Type: Dwarf Planet\nDay: 25.9d",
            blackhole: "Type: Supermassive Black Hole\nMass: Unknown",
            milkyway: "Type: Barred Spiral Galaxy\nDiameter: 100,000 ly\nStars: ~400 Billion",
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
            background: black; z-index: 10020; display: flex; align-items: center;
            justify-content: center; flex-direction: column; color: #00ff41;
            font-family: 'Orbitron', 'Courier New', sans-serif; transition: opacity 3s;
        `;
        
        const text = document.createElement('h1');
        text.textContent = "INITIALIZING SOLAR SYSTEM...";
        text.style.cssText = "z-index: 10021; text-shadow: 0 0 10px #00ff41; letter-spacing: 3px;";
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

        // --- HUD OVERLAY (FPS & Coordinates) ---
        this.hudContainer = document.createElement('div');
        this.hudContainer.style.cssText = `
            position: absolute; top: 20px; left: 50px; 
            color: #00ff41; font-family: 'Orbitron', 'Courier New', sans-serif;
            font-size: 0.85rem; text-shadow: 0 0 5px #00ff41; z-index: 10003; pointer-events: none;
            background: rgba(0, 0, 0, 0.4); padding: 12px 15px; border-radius: 4px; 
            border: 1px solid rgba(0,255,65,0.2); backdrop-filter: blur(5px);
        `;
        
        this.fpsDisplay = document.createElement('div');
        this.fpsDisplay.textContent = "FPS: --";
        this.fpsDisplay.style.marginBottom = "8px";
        this.fpsDisplay.style.fontWeight = "bold";
        
        this.coordDisplay = document.createElement('div');
        this.coordDisplay.textContent = "X: 0 | Y: 0 | Z: 0";
        this.coordDisplay.style.fontSize = "0.75rem";
        this.coordDisplay.style.opacity = "0.8";
        
        this.hudContainer.appendChild(this.fpsDisplay);
        this.hudContainer.appendChild(this.coordDisplay);
        this.container.appendChild(this.hudContainer);
        // --------------------------------------------

        const trigger = document.createElement('div');
        trigger.style.cssText = `
            position: absolute; right: 0; top: 0; width: 30px; height: 100%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            background: transparent; z-index: 10011;
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
            z-index: 10010; display: flex; flex-direction: column; padding: 25px;
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

        this.destinations = ['Sun', 'Mercury', 'Venus', 'Earth', 'Moon', 'Mars', 'Ceres', 'Jupiter', 'Saturn', 'Neptune', 'Pluto', 'Charon', 'Haumea', 'Makemake', 'Eris', 'BlackHole', 'MilkyWay', 'Gateway', 'ISS', 'Apollo'];
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

        // --- FULLSCREEN BUTTON ---
        const fsBtn = document.createElement('button');
        fsBtn.textContent = 'TOGGLE FULLSCREEN';
        fsBtn.style.cssText = `
            background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 12px; margin-bottom: 15px;
            cursor: pointer; font-family: inherit; font-weight: bold; border-radius: 4px;
            text-transform: uppercase; letter-spacing: 1px; transition: 0.2s;
        `;
        fsBtn.addEventListener('mouseover', () => fsBtn.style.background = 'rgba(255,255,255,0.1)');
        fsBtn.addEventListener('mouseout', () => fsBtn.style.background = 'transparent');
        fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
        this.sidebar.appendChild(fsBtn);

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
            z-index: 10010; display: flex; flex-direction: row;
            box-sizing: border-box; color: #00ff41;
            transition: left 0.3s ease;
        `;

        const trigger = document.createElement('div');
        trigger.style.cssText = `
            position: absolute; left: 0; top: 0; width: 30px; height: 100%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            background: transparent; z-index: 10011;
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
        const systemBtn = createTabBtn('engine-tab-system', 'System', false);
        
        navCol.appendChild(planetsBtn);
        navCol.appendChild(envBtn);
        navCol.appendChild(shipsBtn);
        navCol.appendChild(systemBtn);

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
                    if (value === 'falcon' || value === 'planetexpress' || value === 'benatar' || value === 'tardis' || value === 'enterprise') {
                        this.shipView = '3rd'; 
                    }
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
        shipsTab.appendChild(createRadio('ship-select', 'xwing', 'X-Wing', false));
        shipsTab.appendChild(createRadio('ship-select', 'falcon', 'Millennium Falcon', false));
        shipsTab.appendChild(createRadio('ship-select', 'planetexpress', 'Planet Express', false));
        shipsTab.appendChild(createRadio('ship-select', 'rickmorty', 'Rick & Morty Cruiser', false));
        shipsTab.appendChild(createRadio('ship-select', 'benatar', 'Benatar', false));
        shipsTab.appendChild(createRadio('ship-select', 'tardis', 'TARDIS', false));
        shipsTab.appendChild(createRadio('ship-select', 'enterprise', 'USS Enterprise', false));

        const shipHelpText = document.createElement('div');
        shipHelpText.innerHTML = "<i>Press 'Y' on Gamepad or Keyboard to toggle 1st/3rd person view on supported ships.</i>";
        shipHelpText.style.cssText = "margin-top: 15px; font-size: 0.7rem; opacity: 0.6; line-height: 1.5; color: #aaa;";
        shipsTab.appendChild(shipHelpText);

        // --- SYSTEM TAB ---
        const systemTab = document.createElement('div');
        systemTab.id = 'engine-tab-system';
        systemTab.className = 'engine-tab-panel';
        systemTab.style.cssText = "display: none; flex-direction: column;";

        // HUD Toggle
        const hudToggleBox = document.createElement('div');
        hudToggleBox.style.cssText = "margin-bottom: 25px; display: flex; align-items: center; border-bottom: 1px solid rgba(0,255,65,0.2); padding-bottom: 15px;";
        const hudCb = document.createElement('input'); 
        hudCb.type = 'checkbox'; hudCb.checked = true; hudCb.style.accentColor = "#00ff41"; hudCb.style.marginRight = "10px";
        hudCb.onchange = (e) => {
            if (this.hudContainer) this.hudContainer.style.display = e.target.checked ? 'block' : 'none';
        };
        const hudCbLbl = document.createElement('span'); hudCbLbl.textContent = "Enable HUD (FPS & Coords)"; hudCbLbl.style.fontSize = "0.85rem";
        hudToggleBox.appendChild(hudCb); hudToggleBox.appendChild(hudCbLbl);
        systemTab.appendChild(hudToggleBox);

        // FPS Limit Radios
        const fpsLabel = document.createElement('div');
        fpsLabel.textContent = "FRAME RATE LIMIT:";
        fpsLabel.style.fontSize = "0.8rem"; fpsLabel.style.marginBottom = "10px"; fpsLabel.style.opacity = "0.7";
        systemTab.appendChild(fpsLabel);

        const createFpsRadio = (name, value, label, checked) => {
            const container = document.createElement('div');
            container.style.cssText = "margin-bottom: 15px; display: flex; align-items: center;";
            const rb = document.createElement('input'); 
            rb.type = 'radio'; rb.name = name; rb.value = value; rb.checked = checked;
            rb.style.accentColor = "#00ff41"; rb.style.marginRight = "10px";
            rb.onchange = (e) => {
                if(e.target.checked) this.targetFPS = parseInt(value);
            };
            const rbLbl = document.createElement('span'); rbLbl.textContent = label; rbLbl.style.fontSize = "0.85rem";
            container.appendChild(rb); container.appendChild(rbLbl);
            return container;
        };

        systemTab.appendChild(createFpsRadio('fps-target', '60', '60 FPS (Locked / Default)', true));
        systemTab.appendChild(createFpsRadio('fps-target', '120', '120 FPS (High Refresh)', false));

        contentCol.appendChild(planetsTab);
        contentCol.appendChild(envTab);
        contentCol.appendChild(shipsTab);
        contentCol.appendChild(systemTab); 

        this.engineSidebar.appendChild(navCol);
        this.engineSidebar.appendChild(contentCol);

        this.container.appendChild(trigger);
        this.container.appendChild(this.engineSidebar);
    }

    createStatsOverlay() {
        this.statsContainer = document.createElement('div');
        this.statsContainer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 10002; overflow: hidden;
        `;
        this.container.appendChild(this.statsContainer);
        this.statLabels = {};
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 50000000 * this.scaleFactor);
        
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

        this.sunLight = new THREE.PointLight(0xffffff, 3.0, 50000 * this.scaleFactor);
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
        
        // NEW SHIPS
        if (this.xwingModel) this.xwingModel.visible = (this.activeShip === 'xwing' && this.shipView === '3rd');
        if (this.xwingCockpitModel) this.xwingCockpitModel.visible = (this.activeShip === 'xwing' && this.shipView === '1st');
        if (this.tardisModel) this.tardisModel.visible = (this.activeShip === 'tardis');
        if (this.enterpriseModel) this.enterpriseModel.visible = (this.activeShip === 'enterprise');
    }

    setTardisOpacity(alpha) {
        if (!this.tardisModel) return;
        this.tardisModel.traverse((child) => {
            if (child.isMesh && child.material) {
                if (child.userData.isSetupForAlpha === undefined) {
                    child.material = child.material.clone();
                    child.userData.isSetupForAlpha = true;
                }
                
                alpha = Math.max(0, Math.min(1, alpha));
                
                child.material.opacity = alpha;
                if (alpha < 0.99) {
                    child.material.transparent = true;
                    child.material.depthWrite = false; 
                } else {
                    child.material.transparent = false;
                    child.material.depthWrite = true;
                }
            }
        });
    }

    createMilkyWay() {
        const particleCount = 150000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const color = new THREE.Color();
        
        const S = this.scaleFactor;
        const galaxyRadius = 2000000 * S; 
        
        const numArms = 4;
        const armSpin = 3; 
        const armSpread = 0.2; 
        
        const sunOffsetR = galaxyRadius * 0.55; 
        const sunOffsetTheta = 1.0; 
        
        const galX = -Math.cos(sunOffsetTheta) * sunOffsetR;
        const galZ = -Math.sin(sunOffsetTheta) * sunOffsetR;
        
        const safeZoneSq = (6000 * S) * (6000 * S);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            let valid = false;
            let localX, localY, localZ;
            let r, theta, yOffset;
            
            while (!valid) {
                const rand = Math.random();
                
                const randY = (Math.random() + Math.random() + Math.random() - 1.5) * 0.66;
                
                if (rand < 0.25) {
                    const bulgeRadius = galaxyRadius * 0.12;
                    r = Math.pow(Math.random(), 1.5) * bulgeRadius;
                    theta = Math.random() * Math.PI * 2;
                    
                    const coreThickness = bulgeRadius * 0.6 * Math.sqrt(1 - Math.pow(r / bulgeRadius, 2));
                    yOffset = randY * coreThickness;
                    
                    color.setHSL(0.1 + Math.random() * 0.05, 0.9, 0.8 + Math.random() * 0.2); 
                } else if (rand < 0.45) {
                    r = Math.pow(Math.random(), 1.2) * galaxyRadius;
                    theta = Math.random() * Math.PI * 2;
                    
                    const diskThickness = galaxyRadius * 0.015 * (1 + r / galaxyRadius);
                    yOffset = randY * diskThickness;
                    
                    color.setHSL(0.6, 0.3, 0.4 + Math.random() * 0.2); 
                } else {
                    const coreRadius = galaxyRadius * 0.1;
                    r = coreRadius + Math.pow(Math.random(), 1.5) * (galaxyRadius - coreRadius);
                    
                    const armIndex = Math.floor(Math.random() * numArms);
                    const armOffset = armIndex * ((Math.PI * 2) / numArms);
                    
                    const spiralAngle = Math.pow(r / galaxyRadius, 0.8) * armSpin * Math.PI + armOffset;
                    
                    const scatter = (Math.random() - 0.5) * armSpread * Math.PI * (0.5 + r / galaxyRadius);
                    theta = spiralAngle + scatter;
                    
                    const diskThickness = galaxyRadius * 0.015 * (1 + r / galaxyRadius);
                    yOffset = randY * diskThickness;
                    
                    if (Math.abs(scatter) < armSpread * 0.3) {
                        color.setHSL(0.6 + Math.random() * 0.1, 0.9, 0.7 + Math.random() * 0.3); 
                    } else {
                        color.setHSL(0.1 + Math.random() * 0.1, 0.6, 0.5 + Math.random() * 0.3); 
                    }
                }

                localX = Math.cos(theta) * r;
                localY = yOffset;
                localZ = Math.sin(theta) * r;

                const worldX = localX + galX;
                const worldY = localY;
                const worldZ = localZ + galZ;
                
                if ((worldX*worldX + worldY*worldY + worldZ*worldZ) > safeZoneSq) {
                    valid = true;
                }
            }

            positions[i3] = localX;
            positions[i3 + 1] = localY;
            positions[i3 + 2] = localZ;
            
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        const starTexture = new THREE.CanvasTexture(canvas);

        const particleMat = new THREE.PointsMaterial({
            size: 600 * S, 
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 1.0, 
            depthWrite: false,
            map: starTexture
        });
        
        this.milkyWayMat = particleMat;

        this.milkyWayGroup = new THREE.Points(geometry, particleMat);
        
        this.galacticPivot = new THREE.Group();
        this.scene.add(this.galacticPivot);
        
        this.milkyWayGroup.position.set(galX, 0, galZ); 
        this.galacticPivot.add(this.milkyWayGroup);

        this.galacticPivot.rotation.x = Math.PI / 3; 
        this.galacticPivot.rotation.z = Math.PI / 6;   

        const milkyWayCenter = new THREE.Group();
        milkyWayCenter.position.set(galX, 0, galZ);
        this.galacticPivot.add(milkyWayCenter);

        this.planets['milkyway'] = { 
            mesh: milkyWayCenter, 
            orbitPivot: null, 
            rotationSpeed: 0, 
            orbitSpeed: 0, 
            size: 2000000 * S,
            visibilityRange: 30000000 * S, 
            collisionSize: 200000 * S 
        };
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
        
        if (name === 'sun') {
            mat = new THREE.MeshBasicMaterial({ map: loader.load(this.getTexUrl(texturePath)) });
            mat.userData = { time: { value: 0.0 } };
            
            mat.onBeforeCompile = (shader) => {
                shader.uniforms.time = mat.userData.time;
                
                shader.vertexShader = `
                    varying vec3 vWorldPosition;
                    ${shader.vertexShader}
                `.replace(
                    '#include <worldpos_vertex>',
                    `#include <worldpos_vertex>
                     vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`
                );

                shader.fragmentShader = `
                    uniform float time;
                    varying vec3 vWorldPosition;
                    
                    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                    float snoise(vec3 v) {
                        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                        vec3 i  = floor(v + dot(v, C.yyy) );
                        vec3 x0 = v - i + dot(i, C.xxx) ;
                        vec3 g = step(x0.yzx, x0.xyz);
                        vec3 l = 1.0 - g;
                        vec3 i1 = min( g.xyz, l.zxy );
                        vec3 i2 = max( g.xyz, l.zxy );
                        vec3 x1 = x0 - i1 + C.xxx;
                        vec3 x2 = x0 - i2 + C.yyy;
                        vec3 x3 = x0 - D.yyy;
                        i = mod289(i);
                        vec4 p = permute( permute( permute(
                                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                        float n_ = 0.142857142857;
                        vec3  ns = n_ * D.wyz - D.xzx;
                        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                        vec4 x_ = floor(j * ns.z);
                        vec4 y_ = floor(j - 7.0 * x_ );
                        vec4 x = x_ *ns.x + ns.yyyy;
                        vec4 y = y_ *ns.x + ns.yyyy;
                        vec4 h = 1.0 - abs(x) - abs(y);
                        vec4 b0 = vec4( x.xy, y.xy );
                        vec4 b1 = vec4( x.zw, y.zw );
                        vec4 s0 = floor(b0)*2.0 + 1.0;
                        vec4 s1 = floor(b1)*2.0 + 1.0;
                        vec4 sh = -step(h, vec4(0.0));
                        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                        vec3 p0 = vec3(a0.xy,h.x);
                        vec3 p1 = vec3(a0.zw,h.y);
                        vec3 p2 = vec3(a1.xy,h.z);
                        vec3 p3 = vec3(a1.zw,h.w);
                        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                        p0 *= norm.x;
                        p1 *= norm.y;
                        p2 *= norm.z;
                        p3 *= norm.w;
                        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                        m = m * m;
                        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                    }
                    
                    ${shader.fragmentShader}
                `.replace(
                    '#include <map_fragment>',
                    `
                    #ifdef USE_MAP
                        vec4 texColor = texture2D( map, vUv );
                        diffuseColor *= texColor;
                    #endif
                     
                     vec3 normPos = normalize(vWorldPosition);
                     float n1 = snoise(normPos * 5.0 - time * 0.05);
                     float n2 = snoise(normPos * 15.0 + time * 0.08) * 0.5;
                     float n3 = snoise(normPos * 30.0 - time * 0.1) * 0.25;
                     float totalNoise = n1 + n2 + n3; 
                     
                     float n = clamp((totalNoise + 1.0) / 2.0, 0.0, 1.0);
                     
                     vec3 valleyColor = vec3(0.6, 0.1, 0.0);
                     vec3 peakColor = vec3(1.2, 0.9, 0.4); 
                     
                     diffuseColor.rgb *= mix(0.7, 1.3, n); 
                     diffuseColor.rgb = mix(diffuseColor.rgb, peakColor, smoothstep(0.7, 1.0, n) * 0.8);
                     diffuseColor.rgb = mix(diffuseColor.rgb, valleyColor, smoothstep(0.3, 0.0, n) * 0.8);
                    `
                );
            };
            this.sunMaterial = mat;

            const coronaGeo = new THREE.SphereGeometry(size * 1.03, 128, 128); 
            this.sunCoronaMat = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 }
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
                    varying vec3 vNormal;
                    varying vec3 vPosition;

                    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                    float snoise(vec3 v) {
                        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                        vec3 i  = floor(v + dot(v, C.yyy) );
                        vec3 x0 = v - i + dot(i, C.xxx) ;
                        vec3 g = step(x0.yzx, x0.xyz);
                        vec3 l = 1.0 - g;
                        vec3 i1 = min( g.xyz, l.zxy );
                        vec3 i2 = max( g.xyz, l.zxy );
                        vec3 x1 = x0 - i1 + C.xxx;
                        vec3 x2 = x0 - i2 + C.yyy;
                        vec3 x3 = x0 - D.yyy;
                        i = mod289(i);
                        vec4 p = permute( permute( permute(
                                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                        float n_ = 0.142857142857;
                        vec3  ns = n_ * D.wyz - D.xzx;
                        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                        vec4 x_ = floor(j * ns.z);
                        vec4 y_ = floor(j - 7.0 * x_ );
                        vec4 x = x_ *ns.x + ns.yyyy;
                        vec4 y = y_ *ns.x + ns.yyyy;
                        vec4 h = 1.0 - abs(x) - abs(y);
                        vec4 b0 = vec4( x.xy, y.xy );
                        vec4 b1 = vec4( x.zw, y.zw );
                        vec4 s0 = floor(b0)*2.0 + 1.0;
                        vec4 s1 = floor(b1)*2.0 + 1.0;
                        vec4 sh = -step(h, vec4(0.0));
                        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                        vec3 p0 = vec3(a0.xy,h.x);
                        vec3 p1 = vec3(a0.zw,h.y);
                        vec3 p2 = vec3(a1.xy,h.z);
                        vec3 p3 = vec3(a1.zw,h.w);
                        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                        p0 *= norm.x;
                        p1 *= norm.y;
                        p2 *= norm.z;
                        p3 *= norm.w;
                        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                        m = m * m;
                        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                    }

                    void main() {
                        float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
                        fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
                        
                        float edgeMask = pow(fresnel, 5.0);
                        
                        vec3 normPos = normalize(vPosition);
                        
                        float n1 = snoise(normPos * 8.0 - time * 0.1);
                        float n2 = snoise(normPos * 20.0 + time * 0.2) * 0.5;
                        float n3 = snoise(normPos * 40.0 - time * 0.3) * 0.25;
                        
                        float plasma = abs(n1 + n2 + n3);
                        
                        plasma = clamp(1.0 - plasma, 0.0, 1.0); 
                        plasma = pow(plasma, 3.0); 
                        
                        float intensity = plasma * edgeMask * 3.0;
                        
                        vec3 color = mix(vec3(0.8, 0.1, 0.0), vec3(1.0, 0.6, 0.1), intensity);
                        color = mix(color, vec3(1.0, 0.9, 0.4), smoothstep(0.5, 1.0, intensity));
                        
                        gl_FragColor = vec4(color, intensity);
                    }
                `,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false
            });
            const coronaMesh = new THREE.Mesh(coronaGeo, this.sunCoronaMat);
            systemGroup.add(coronaMesh);

        } else if (isEmissive) {
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

    createHyperspaceEffect() {
        this.hyperspaceGroup = new THREE.Group();
        this.scene.add(this.hyperspaceGroup);

        const streakCount = 3000;
        
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        geometry.rotateX(Math.PI / 2); 
        
        const material = new THREE.MeshBasicMaterial({
            color: 0x88ccff, 
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.hyperspaceLines = new THREE.InstancedMesh(geometry, material, streakCount);
        this.hyperspaceLines.frustumCulled = false;
        
        this.hyperspaceGroup.add(this.hyperspaceLines);
        this.hyperspaceGroup.visible = false;
        
        this.warpAmount = 0;
        this.streakData = [];
        
        for (let i = 0; i < streakCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 80 + Math.random() * 800; 
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (Math.random() - 0.5) * 2000;
            const v = 1.0 + Math.random() * 2.0;

            this.streakData.push({ x, y, z, v });
        }
        
        this.dummyObj = new THREE.Object3D();
    }

    createTimeVortexEffect() {
        this.tardisVortexMat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                warpOpacity: { value: 0.0 }
            },
            vertexShader: `
                #include <common>
                #include <logdepthbuf_pars_vertex>
                
                uniform float time;
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    vec3 transformed = position;
                    
                    float dist = abs(position.z) / 4000.0;
                    float bend = pow(dist, 1.8) * 2200.0; 
                    float angle = position.z * 0.0006 - time * 2.0;
                    
                    transformed.x += cos(angle) * bend;
                    transformed.y += sin(angle) * bend;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    #include <logdepthbuf_vertex>
                }
            `,
            fragmentShader: `
                #include <common>
                #include <logdepthbuf_pars_fragment>
                
                uniform float time;
                uniform float warpOpacity;
                varying vec2 vUv;

                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                
                float snoise(vec3 v) {
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy) );
                    vec3 x0 = v - i + dot(i, C.xxx) ;
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy );
                    vec3 i2 = max( g.xyz, l.zxy );
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod289(i);
                    vec4 p = permute( permute( permute(
                               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                    float n_ = 0.142857142857;
                    vec3  ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_ );
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4( x.xy, y.xy );
                    vec4 b1 = vec4( x.zw, y.zw );
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }

                float fbm(vec3 x) {
                    float v = 0.0;
                    float a = 0.5;
                    for (int i = 0; i < 4; ++i) {
                        v += a * snoise(x);
                        x = x * 2.0;
                        a *= 0.5;
                    }
                    return v;
                }

                void main() {
                    vec2 uv = vUv;
                    
                    float angle = uv.x * 3.14159265359 * 2.0;
                    float twist = (uv.y * 3.0) + (time * 0.8);
                    angle += twist;
                    
                    float moveY = uv.y * 8.0 + time * 6.0; 
                    vec3 pos1 = vec3(cos(angle) * 1.5, sin(angle) * 1.5, moveY);
                    vec3 pos2 = vec3(cos(angle) * 3.0, sin(angle) * 3.0, moveY * 1.5 - time); 

                    float n1 = fbm(pos1);
                    float n2 = fbm(pos2 - vec3(0.0, 0.0, time * 2.0));
                    
                    float plasma = (n1 + n2);
                    plasma = clamp((plasma + 1.0) * 0.5, 0.0, 1.0);
                    plasma = smoothstep(0.4, 0.8, plasma); 
                    
                    vec3 darkBlue = vec3(0.0, 0.1, 0.3); 
                    vec3 brightCyan = vec3(0.1, 0.9, 1.0);
                    vec3 white = vec3(1.0, 1.0, 1.0);
                    
                    vec3 color = mix(darkBlue, brightCyan, plasma);
                    color = mix(color, white, pow(plasma, 3.0));
                    
                    float edgeFade = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);

                    gl_FragColor = vec4(color, warpOpacity * edgeFade);

                    #include <logdepthbuf_fragment>
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: true 
        });

        const vortexGeo = new THREE.CylinderGeometry(300, 300, 8000, 32, 80, true);
        vortexGeo.rotateX(Math.PI / 2); 
        
        const vortexMesh = new THREE.Mesh(vortexGeo, this.tardisVortexMat);
        vortexMesh.frustumCulled = false;
        
        this.tardisVortexGroup = new THREE.Group();
        this.tardisVortexGroup.add(vortexMesh);
        this.tardisVortexGroup.visible = false;
        
        this.scene.add(this.tardisVortexGroup);
    }

    buildSolarSystem() {
        const gltfLoader = new THREE.GLTFLoader();
        
        gltfLoader.register(function(parser) {
            return {
                name: 'uv-patch',
                loadMaterial: function(materialIndex) {
                    const materialDef = parser.json.materials[materialIndex];
                    if (materialDef) {
                        if (materialDef.normalTexture && materialDef.normalTexture.texCoord !== undefined) {
                            materialDef.normalTexture.texCoord = 0;
                        }
                        if (materialDef.emissiveTexture && materialDef.emissiveTexture.texCoord !== undefined) {
                            materialDef.emissiveTexture.texCoord = 0;
                        }
                        if (materialDef.pbrMetallicRoughness) {
                            if (materialDef.pbrMetallicRoughness.baseColorTexture && materialDef.pbrMetallicRoughness.baseColorTexture.texCoord !== undefined) {
                                materialDef.pbrMetallicRoughness.baseColorTexture.texCoord = 0;
                            }
                            if (materialDef.pbrMetallicRoughness.metallicRoughnessTexture && materialDef.pbrMetallicRoughness.metallicRoughnessTexture.texCoord !== undefined) {
                                materialDef.pbrMetallicRoughness.metallicRoughnessTexture.texCoord = 0;
                            }
                        }
                    }
                    return null; 
                }
            };
        });

        const fixModelUVs = (model) => {
            model.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    if (child.geometry.attributes.uv && !child.geometry.attributes.uv2) {
                        child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
                    }
                }
            });
        };

        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        gltfLoader.setDRACOLoader(dracoLoader);
        const loader = new THREE.TextureLoader();
        const S = this.scaleFactor; 

        const spaceSkyGeo = new THREE.SphereGeometry(25000000 * S, 64, 64);
        const spaceSkyMat = new THREE.MeshBasicMaterial({
            map: loader.load(this.getTexUrl('three-textures/8k_stars.jpg')),
            side: THREE.BackSide
        });
        this.scene.add(new THREE.Mesh(spaceSkyGeo, spaceSkyMat));

        this.createMilkyWay();
        this.createHyperspaceEffect();
        this.createTimeVortexEffect();

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
            fixModelUVs(tie); 
            tie.scale.set(0.015, 0.015, 0.015);
            const box = new THREE.Box3().setFromObject(tie);
            const center = box.getCenter(new THREE.Vector3());
            tie.position.sub(center); 
            this.tieModel = new THREE.Group();
            this.tieModel.add(tie);
            this.shipGroup.add(this.tieModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/millennium falcon.glb'), (gltf) => {
            const falcon = gltf.scene;
            fixModelUVs(falcon); 
            falcon.scale.set(0.4, 0.4, 0.4); 
            const box = new THREE.Box3().setFromObject(falcon);
            const center = box.getCenter(new THREE.Vector3());
            falcon.position.sub(center);
            falcon.rotation.y = 0; 

            this.falconModel = new THREE.Group();
            this.falconModel.add(falcon);
            this.shipGroup.add(this.falconModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/planet_express_spaceship.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
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
            fixModelUVs(ship); 
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
            fixModelUVs(ship); 
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

        gltfLoader.load(this.getTexUrl('three-models/x-wing.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
            ship.scale.set(0.2, 0.2, 0.2); 
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            ship.rotation.y = 0; 
            
            this.xwingModel = new THREE.Group();
            this.xwingModel.add(ship);
            this.shipGroup.add(this.xwingModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/x-wing_cockpit_version_2.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
            ship.scale.set(1.0, 1.0, 1.0);
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            
            this.xwingCockpitModel = new THREE.Group();
            this.xwingCockpitModel.add(ship);
            this.shipGroup.add(this.xwingCockpitModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/tardis.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
            ship.scale.set(0.5, 0.5, 0.5); 
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            
            this.tardisModel = new THREE.Group();
            this.tardisModel.add(ship);
            this.shipGroup.add(this.tardisModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/u.s.s._enterprise_ncc-1701-a.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
            ship.scale.set(0.03, 0.03, 0.03); 
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            
            this.enterpriseModel = new THREE.Group();
            this.enterpriseModel.add(ship);
            this.shipGroup.add(this.enterpriseModel);
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
            fixModelUVs(model); 
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
            fixModelUVs(model); 
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
            fixModelUVs(model); 
            model.scale.set(0.008 * S, 0.008 * S, 0.008 * S);
            model.rotation.set(0, 0, Math.PI / 2);
            apolloGroup.add(model);
        });

        this.createPlanet('mars', 'three-textures/8k_mars.jpg', 1.06 * S, 700 * S, this.baseOrb * 0.53, this.baseRot / 1.02);
        this.createPlanet('ceres', 'three-textures/4k_ceres_fictional.jpg', 0.15 * S, 950 * S, this.baseOrb * 0.2, this.baseRot * 2.6);

        this.mainAsteroidBelt = this.createAsteroidBelt(850 * S, 1050 * S, 1500, 80 * S);
        this.createPlanet('jupiter', 'three-textures/8k_jupiter.jpg', 22.4 * S, 1200 * S, this.baseOrb * 0.08, this.baseRot * 2.4);

        const saturn = this.createPlanet('saturn', 'three-textures/8k_saturn.jpg', 18.9 * S, 1800 * S, this.baseOrb * 0.034, this.baseRot * 2.2);
        const ringGeo = new THREE.RingGeometry(25 * S, 45 * S, 64);
        
        const pos = ringGeo.attributes.position;
        const uvs = ringGeo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const radius = Math.sqrt(x * x + y * y);
            const u = (radius - 25 * S) / (45 * S - 25 * S);
            const v = (Math.atan2(y, x) + Math.PI) / (Math.PI * 2);
            uvs.setXY(i, u, v);
        }

        this.saturnRingMat = new THREE.MeshStandardMaterial({
            map: loader.load(this.getTexUrl('three-textures/8k_saturn_ring_alpha.png')),
            side: THREE.DoubleSide, transparent: true, opacity: 0.9
        });
        const ringMesh = new THREE.Mesh(ringGeo, this.saturnRingMat);
        ringMesh.rotation.x = Math.PI / 2 + 0.3;
        saturn.mesh.add(ringMesh);

        this.createPlanet('neptune', 'three-textures/2k_neptune.jpg', 7.76 * S, 2600 * S, this.baseOrb * 0.006, this.baseRot * 1.5);
        this.kuiperBelt = this.createAsteroidBelt(3000 * S, 3600 * S, 2500, 150 * S);

        const pluto = this.createPlanet('pluto', 'three-textures/pluto_semi_fictional.png', 0.5 * S, 3100 * S, this.baseOrb * 0.004, 0);
        pluto.visibilityRange = 200 * S;
        
        const barycenterPivot = new THREE.Group();
        pluto.systemGroup.add(barycenterPivot);
        
        barycenterPivot.add(pluto.mesh);
        pluto.mesh.position.set(-0.9 * S, 0, 0);
        
        const charonGeo = new THREE.SphereGeometry(0.25 * S, 64, 64);
        const charonMat = new THREE.MeshStandardMaterial({ 
            map: loader.load(this.getTexUrl('three-textures/8k_charon.png')), 
            roughness: 0.8,
            metalness: 0.1
        });
        const charonMesh = new THREE.Mesh(charonGeo, charonMat);
        charonMesh.position.set(7.35 * S, 0, 0); 
        barycenterPivot.add(charonMesh);

        this.planets['charon'] = { 
            mesh: charonMesh, 
            orbitPivot: barycenterPivot, 
            rotationSpeed: 0, 
            orbitSpeed: this.baseRot * 0.15, 
            size: 0.25 * S, 
            visibilityRange: 150 * S 
        };

        this.createPlanet('haumea', 'three-textures/4k_haumea_fictional.jpg', 0.25 * S, 3200 * S, this.baseOrb * 0.0035, this.baseRot * 6.0);
        this.createPlanet('makemake', 'three-textures/4K_makemake_fictional.jpg', 0.22 * S, 3400 * S, this.baseOrb * 0.003, this.baseRot * 1.0);
        this.createPlanet('eris', 'three-textures/4k_eris_fictional.jpg', 0.36 * S, 3800 * S, this.baseOrb * 0.002, this.baseRot * 0.04);

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
            fixModelUVs(model); 
            model.scale.set(0.5 * S, 0.5 * S, 0.5 * S); 
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            blackHoleGroup.add(model);
        });

        this.camera.position.set(500 * S, 800 * S, 1200 * S);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
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
            
            if (key === 'y' && (this.activeShip === 'tie' || this.activeShip === 'rickmorty' || this.activeShip === 'xwing')) {
                this.shipView = this.shipView === '1st' ? '3rd' : '1st';
                this.updateShipVisibility();
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

            if (this.activeShip !== 'none' && this.shipView === '1st') {
                this.cockpitYaw -= deltaX * 0.005;
                this.cockpitPitch -= deltaY * 0.005;
                
                this.cockpitYaw = Math.max(-Math.PI * 0.7, Math.min(Math.PI * 0.7, this.cockpitYaw));
                this.cockpitPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cockpitPitch));
                
                this.lastLookTime = performance.now();
            } else {
                this.yaw -= deltaX * 0.005;
                this.pitch -= deltaY * 0.005;
                this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
            }

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
                let boostThrust = 0;
                
                if (gp.buttons[6] && gp.buttons[6].pressed) {
                    moveSpeed += (gp.buttons[6].value * this.currentFlySpeed * 2.0 * this.joltMultiplier);
                    boostThrust = gp.buttons[6].value * this.joltMultiplier; 
                }
                
                if (Math.abs(gp.axes[1]) > 0.1) { 
                    this.camera.position.add(direction.multiplyScalar(-gp.axes[1] * moveSpeed));
                } else if (boostThrust > 0) {
                    this.camera.position.add(direction.multiplyScalar(boostThrust * moveSpeed));
                }

                if (Math.abs(gp.axes[0]) > 0.1) { 
                    this.camera.position.add(right.multiplyScalar(-gp.axes[0] * moveSpeed));
                }
            }

            if (this.activeShip !== 'none' && this.shipView === '1st') {
                if (Math.abs(gp.axes[2]) > 0.1 || Math.abs(gp.axes[3]) > 0.1) {
                    if (Math.abs(gp.axes[2]) > 0.1) this.cockpitYaw -= gp.axes[2] * 0.05;
                    if (Math.abs(gp.axes[3]) > 0.1) this.cockpitPitch -= gp.axes[3] * 0.05;
                    this.cockpitYaw = Math.max(-Math.PI * 0.7, Math.min(Math.PI * 0.7, this.cockpitYaw));
                    this.cockpitPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cockpitPitch));
                    this.lastLookTime = performance.now();
                }
            } else {
                if (Math.abs(gp.axes[2]) > 0.1) this.yaw -= gp.axes[2] * 0.05;
                if (Math.abs(gp.axes[3]) > 0.1) this.pitch -= gp.axes[3] * 0.05;
                this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
            }

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
                    if (this.activeShip === 'tie' || this.activeShip === 'rickmorty' || this.activeShip === 'xwing') {
                        this.shipView = this.shipView === '1st' ? '3rd' : '1st';
                        this.updateShipVisibility();
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
        let autoForward = false;
        
        if (this.keys['shift']) {
            moveSpeed += (this.currentFlySpeed * 2.0 * this.joltMultiplier);
            if (this.joltMultiplier > 0.01) autoForward = true;
        }
        
        const forward = direction.clone();
        const right = new THREE.Vector3().crossVectors(this.camera.up, forward).normalize();

        let wPressed = false;
        if (this.keys['w']) { targetObj.position.add(forward.multiplyScalar(moveSpeed)); wPressed = true; }
        if (this.keys['s']) targetObj.position.add(forward.multiplyScalar(-moveSpeed));
        if (this.keys['a']) targetObj.position.add(right.multiplyScalar(-moveSpeed)); 
        if (this.keys['d']) targetObj.position.add(right.multiplyScalar(moveSpeed));  

        if (autoForward && !wPressed) {
            targetObj.position.add(forward.multiplyScalar(moveSpeed));
        }
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
    
    close() {
        this.isActive = false;
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 500); 
    }

    animate() {
        if (!this.isActive) return;
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        if (this.targetFPS > 0) {
            const fpsInterval = 1000 / this.targetFPS;
            const elapsed = now - this.lastRenderTime;
            if (elapsed < fpsInterval) return; 
            this.lastRenderTime = now - (elapsed % fpsInterval);
        } else {
            this.lastRenderTime = now;
        }

        this.framesThisSecond++;
        if (now - this.fpsCalcTime >= 1000) {
            if (this.fpsDisplay) this.fpsDisplay.textContent = `FPS: ${this.framesThisSecond}`;
            this.framesThisSecond = 0;
            this.fpsCalcTime = now;
        }

        this.isBoosting = false;

        let wantsToBoost = this.keys['shift'];
        const gamepadsArray = navigator.getGamepads();
        for (let i = 0; i < gamepadsArray.length; i++) {
            const gp = gamepadsArray[i];
            if (gp && gp.buttons[6] && gp.buttons[6].value > 0.1) {
                wantsToBoost = true;
            }
        }

        const currentAudioBuildup = this.activeShip === 'tardis' ? this.tardisAudioBuildup : this.audioBuildup;
        const currentAudioFlight = this.activeShip === 'tardis' ? this.tardisAudioFlight : this.audioFlight;
        const currentAudioExit = this.activeShip === 'tardis' ? this.tardisAudioExit : this.audioExit;
        
        const otherAudioBuildup = this.activeShip === 'tardis' ? this.audioBuildup : this.tardisAudioBuildup;
        const otherAudioFlight = this.activeShip === 'tardis' ? this.audioFlight : this.tardisAudioFlight;
        const otherAudioExit = this.activeShip === 'tardis' ? this.audioExit : this.tardisAudioExit;

        otherAudioBuildup.pause();
        otherAudioFlight.pause();

        if (wantsToBoost && !this.focusedPlanet) {
            let chargeRate = (this.activeShip === 'tardis') ? 0.0035 : 0.012;
            
            this.boostCharge = Math.min(1.0, this.boostCharge + chargeRate); 
            this.isBoosting = true;
            
            if (this.boostCharge < 0.8 && this.hyperState !== 'charging' && this.hyperState !== 'jumping') {
                this.hyperState = 'charging';
                currentAudioBuildup.currentTime = 0;
                currentAudioBuildup.play().catch(() => {});
            } else if (this.boostCharge >= 0.8 && this.hyperState !== 'jumping') {
                this.hyperState = 'jumping';
                currentAudioBuildup.pause();
                currentAudioFlight.currentTime = 0;
                currentAudioFlight.play().catch(() => {});
            }
        } else {
            if (this.hyperState === 'jumping') {
                this.hyperState = 'exiting';
                this.tardisMatProgress = 0.0; 
                currentAudioFlight.pause();
                currentAudioExit.currentTime = 0;
                currentAudioExit.play().catch(() => {});
            } else if (this.hyperState === 'charging') {
                this.hyperState = 'idle';
                currentAudioBuildup.pause();
            } 
            
            if (this.activeShip === 'tardis') {
                if (this.hyperState === 'exiting' && this.tardisMatProgress >= 1.0) {
                    this.hyperState = 'idle';
                }
            } else {
                if (this.boostCharge === 0) {
                    this.hyperState = 'idle';
                }
            }

            let cooldownRate = (this.activeShip === 'tardis') ? 0.015 : 0.05;
            this.boostCharge = Math.max(0.0, this.boostCharge - cooldownRate);
        }

        this.joltMultiplier = 0;
        if (this.boostCharge > 0.8) {
            this.joltMultiplier = Math.pow((this.boostCharge - 0.8) / 0.2, 3);
        }

        let minCameraDist = Infinity;
        const targetObj = (this.activeShip !== 'none') ? this.shipGroup : this.camera;

        if (this.coordDisplay && this.hudContainer && this.hudContainer.style.display !== 'none') {
            const sf = this.scaleFactor;
            const niceX = Math.round(targetObj.position.x / sf).toLocaleString();
            const niceY = Math.round(targetObj.position.y / sf).toLocaleString();
            const niceZ = Math.round(targetObj.position.z / sf).toLocaleString();
            this.coordDisplay.textContent = `X: ${niceX} | Y: ${niceY} | Z: ${niceZ}`;
        }

        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);
            const surfaceDist = targetObj.position.distanceTo(wPos) - (p.collisionSize !== undefined ? p.collisionSize : p.size);
            if (surfaceDist < minCameraDist) minCameraDist = surfaceDist;
        }

        this.currentFlySpeed = 12.0 * (this.scaleFactor / 5); 
        const proximityThreshold = 100 * this.scaleFactor;
        
        if (minCameraDist < proximityThreshold) {
            let t = Math.max(0, minCameraDist / proximityThreshold);
            this.currentFlySpeed = (0.05 * this.scaleFactor) + (11.95 * (this.scaleFactor / 5)) * (t * t); 
        } 
        
        const interstellarThreshold = 40000 * this.scaleFactor; 
        if (minCameraDist > interstellarThreshold) {
            let t = Math.min(1.0, (minCameraDist - interstellarThreshold) / (1000000 * this.scaleFactor));
            this.currentFlySpeed += (this.currentFlySpeed * 10000.0) * (t * t);
        }

        if (this.sunMaterial && this.sunMaterial.userData.time) {
            this.sunMaterial.userData.time.value += 0.01; 
        }
        if (this.sunCoronaMat) {
            this.sunCoronaMat.uniforms.time.value += 0.01; 
        }

        if (this.milkyWayMat && this.planets['milkyway']) {
            const mwPos = new THREE.Vector3();
            this.planets['milkyway'].mesh.getWorldPosition(mwPos);
            const distToMw = this.camera.position.distanceTo(mwPos);
            
            const minSize = 600 * this.scaleFactor;
            const maxSize = 60000 * this.scaleFactor; 
            
            let t = Math.max(0, (distToMw - (500000 * this.scaleFactor)) / (9500000 * this.scaleFactor));
            t = Math.min(1, t);
            t = t * t * (3 - 2 * t); 
            
            this.milkyWayMat.size = minSize + (maxSize - minSize) * t;
        }

        this.pollGamepad();

        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);
            const distToCam = targetObj.position.distanceTo(wPos);
            
            p.currentSpeedMult = 1.0;
            const slowZone = p.slowZone || p.visibilityRange || (p.size * 40); 
            const minZone = p.size * 3;   
            
            if (distToCam < slowZone) {
                let t = (distToCam - minZone) / (slowZone - minZone);
                t = Math.max(0, Math.min(1, t));
                t = Math.pow(t, 3);
                p.currentSpeedMult = 0.0001 + 0.9999 * t;
            }
        }

        if (this.planets['moon'] && this.planets['earth']) {
            if (this.planets['moon'].currentSpeedMult < this.planets['earth'].currentSpeedMult) {
                this.planets['earth'].currentSpeedMult = this.planets['moon'].currentSpeedMult;
            }
        }

        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            
            if (p.orbitPivot) p.orbitPivot.rotation.y += p.orbitSpeed * p.currentSpeedMult;
            if (p.mesh) p.mesh.rotation.y += p.rotationSpeed * p.currentSpeedMult;
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
            if (this.focusedPlanet.size > (20 * this.scaleFactor) && this.focusedPlanet.size < (100000 * this.scaleFactor)) {
                viewDist = this.focusedPlanet.size * (this.zoomLevel * 0.5);
            }

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
            
            let roll = 0;
            let pitchInput = 0;
            let yawInput = 0;
            let accel = 0;
            let boostThrust = 0; 

            if (this.keys['a']) yawInput -= 1; 
            if (this.keys['d']) yawInput += 1; 
            if (this.keys['w']) pitchInput -= 1; 
            if (this.keys['s']) pitchInput += 1; 
            if (this.keys['q']) roll -= 1; 
            if (this.keys['e']) roll += 1; 
            
            if (this.keys['arrowup']) pitchInput -= 1; 
            if (this.keys['arrowdown']) pitchInput += 1; 
            
            if (this.keys['shift']) { 
                boostThrust += 4.0 * this.joltMultiplier; 
            } 
            if (this.keys['space']) accel += 1; 

            const gamepads = navigator.getGamepads();
            for (let i = 0; i < gamepads.length; i++) {
                const gp = gamepads[i];
                if (!gp) continue;
                
                if (Math.abs(gp.axes[0]) > 0.1) yawInput += gp.axes[0]; 
                if (Math.abs(gp.axes[1]) > 0.1) pitchInput += gp.axes[1]; 

                if (gp.buttons[4] && gp.buttons[4].pressed) roll -= 1; 
                if (gp.buttons[5] && gp.buttons[5].pressed) roll += 1; 

                if (gp.buttons[7] && gp.buttons[7].pressed) {
                    accel += gp.buttons[7].value;
                }

                if (gp.buttons[6] && gp.buttons[6].pressed) {
                    boostThrust += gp.buttons[6].value * 4.0 * this.joltMultiplier; 
                }
            }

            roll = Math.max(-1, Math.min(1, roll));
            pitchInput = Math.max(-1, Math.min(1, pitchInput));
            yawInput = Math.max(-1, Math.min(1, yawInput));
            accel = Math.max(0, Math.min(1, accel));

            this.shipGroup.rotateZ(-roll * 0.04);       
            this.shipGroup.rotateX(-pitchInput * 0.03); 
            this.shipGroup.rotateY(-yawInput * 0.02);   

            const shipDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shipGroup.quaternion).normalize();

            const totalThrust = accel + boostThrust;
            if (totalThrust > 0) {
                this.shipGroup.position.add(shipDir.multiplyScalar(totalThrust * this.currentFlySpeed));
            }

            this.shipGroup.updateMatrixWorld(true);

            let camDist = 110.0;
            let heightOffset = 35.0;
            let firstPersonOffset = new THREE.Vector3(0, 0, 0);

            if (this.activeShip === 'tie') { 
                camDist = 190.0; heightOffset = 30.0; 
                if (this.shipView === '1st') { 
                    if (this.tieModel) this.tieModel.scale.set(1.0, 1.0, 1.0); 
                    firstPersonOffset.set(0, 0.2, 1.4); 
                } else { 
                    if (this.tieModel) this.tieModel.scale.set(10.0, 10.0, 10.0); 
                }
            }
            else if (this.activeShip === 'falcon') { 
                camDist = 110.0; heightOffset = 35.0; 
                if (this.falconModel) this.falconModel.scale.set(10.0, 10.0, 10.0);
            }
            else if (this.activeShip === 'planetexpress') { 
                camDist = 110.0; heightOffset = 20.0; 
                if (this.planetExpressModel) this.planetExpressModel.scale.set(10.0, 10.0, 10.0);
            }
            else if (this.activeShip === 'rickmorty') { 
                camDist = 110.0; heightOffset = 35.0; 
                if (this.shipView === '1st') { 
                    if (this.rickMortyModel) this.rickMortyModel.scale.set(1.0, 1.0, 1.0); 
                    firstPersonOffset.set(0.5, 0.3, 0.2); 
                } else { 
                    if (this.rickMortyModel) this.rickMortyModel.scale.set(10.0, 10.0, 10.0); 
                }
            }
            else if (this.activeShip === 'benatar') { 
                camDist = 110.0; heightOffset = 20.0; 
                if (this.benatarModel) this.benatarModel.scale.set(1.0, 1.0, 1.0);
            }
            else if (this.activeShip === 'xwing') {
                camDist = 120.0; heightOffset = 30.0;
                if (this.shipView === '1st') {
                    if (this.xwingCockpitModel) this.xwingCockpitModel.scale.set(5.0, 5.0, 5.0);
                    firstPersonOffset.set(0, 3.9, -8.0);
                } else {
                    if (this.xwingModel) this.xwingModel.scale.set(2.0, 2.0, 2.0); 
                }
            }
            else if (this.activeShip === 'tardis') {
                camDist = 40.0; heightOffset = 10.0;
                if (this.tardisModel) this.tardisModel.scale.set(15.0, 15.0, 15.0);
            }
            else if (this.activeShip === 'enterprise') {
                camDist = 150.0; heightOffset = 40.0;
                if (this.enterpriseModel) this.enterpriseModel.scale.set(20.0, 20.0, 20.0);
            }

            if (this.shipView === '1st') {
                let isGamepadLooking = false;
                const gamepads = navigator.getGamepads();
                for (let i = 0; i < gamepads.length; i++) {
                    const gp = gamepads[i];
                    if (gp && (Math.abs(gp.axes[2]) > 0.1 || Math.abs(gp.axes[3]) > 0.1)) {
                        isGamepadLooking = true;
                        this.lastLookTime = performance.now(); 
                        break;
                    }
                }
                
                if (!this.isDragging && !isGamepadLooking && (performance.now() - this.lastLookTime > 1500)) {
                    this.cockpitYaw *= 0.96;   
                    this.cockpitPitch *= 0.96; 
                }

                const idealPos = this.shipGroup.localToWorld(firstPersonOffset.clone());
                this.camera.position.copy(idealPos);
                
                const localLook = new THREE.Vector3(
                    Math.sin(this.cockpitYaw) * Math.cos(this.cockpitPitch),
                    Math.sin(this.cockpitPitch),
                    Math.cos(this.cockpitYaw) * Math.cos(this.cockpitPitch)
                ).normalize();
                
                const worldCamDir = localLook.applyQuaternion(this.shipGroup.quaternion).normalize();
                
                this.camera.up.copy(new THREE.Vector3(0, 1, 0).applyQuaternion(this.shipGroup.quaternion));
                this.camera.lookAt(idealPos.clone().add(worldCamDir));

                const shipForward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shipGroup.quaternion).normalize();
                this.yaw = Math.atan2(shipForward.x, shipForward.z);
                this.pitch = Math.asin(Math.max(-1, Math.min(1, shipForward.y)));

            } else {
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
            this.camera.up.set(0, 1, 0); 
            this.camera.lookAt(this.camera.position.clone().add(direction));
            this.updateFlyControls(this.camera, direction);
        }

        if (this.activeShip === 'tardis') {
            let targetAlpha = 1.0;
            
            if (this.hyperState === 'charging') {
                let progress = 1.0 - (this.boostCharge / 0.8);
                let throb = 0.5 + 0.5 * Math.cos(progress * Math.PI * 12);
                targetAlpha = Math.max(0, Math.min(1, progress * throb));
            } else if (this.hyperState === 'jumping') {
                targetAlpha = 1.0;
            } else if (this.hyperState === 'exiting') {
                this.tardisMatProgress += 0.0035; 
                if (this.tardisMatProgress > 1.0) this.tardisMatProgress = 1.0;
                
                let throb = 0.5 + 0.5 * Math.cos(this.tardisMatProgress * Math.PI * 12);
                targetAlpha = Math.max(0, Math.min(1, this.tardisMatProgress * throb));
            } else {
                targetAlpha = 1.0;
            }
            
            this.setTardisOpacity(targetAlpha);
        }

        if (this.hyperspaceGroup || this.tardisVortexGroup) {
            
            if (this.activeShip === 'tardis') {
                if (this.hyperState === 'jumping') {
                    this.warpAmount = this.joltMultiplier; 
                } else {
                    this.warpAmount = 0.0;
                }
            } else {
                this.warpAmount = (this.boostCharge * 0.1) + (this.joltMultiplier * 0.9);
            }

            if (this.warpAmount > 0.01) {
                const targetObj = (this.activeShip !== 'none') ? this.shipGroup : this.camera;
                const activeForward = (this.activeShip !== 'none') 
                    ? new THREE.Vector3(0, 0, 1).applyQuaternion(this.shipGroup.quaternion).normalize()
                    : direction.clone().normalize();

                if (this.activeShip === 'tardis') {
                    if (this.hyperspaceGroup) this.hyperspaceGroup.visible = false;
                    
                    if (this.tardisVortexGroup) {
                        this.tardisVortexGroup.visible = true;
                        
                        if (this.tardisVortexMat && this.tardisVortexMat.uniforms) {
                            this.tardisVortexMat.uniforms.warpOpacity.value = this.warpAmount;
                            this.tardisVortexMat.uniforms.time.value += 0.02;
                        }
                        
                        this.tardisVortexGroup.rotateZ(0.05);

                        this.tardisVortexGroup.position.copy(targetObj.position);
                        this.tardisVortexGroup.lookAt(targetObj.position.clone().add(activeForward));
                    }
                } else {
                    if (this.tardisVortexGroup) this.tardisVortexGroup.visible = false;

                    if (this.hyperspaceGroup) {
                        this.hyperspaceGroup.visible = true;
                        this.hyperspaceLines.material.opacity = this.warpAmount * 0.8;

                        this.hyperspaceGroup.position.copy(targetObj.position);
                        this.hyperspaceGroup.lookAt(targetObj.position.clone().add(activeForward));

                        const baseSpeed = 200.0 * this.warpAmount;
                        const stretchAmount = 600.0 * this.warpAmount; 
                        
                        const thickness = 2.0 + (this.warpAmount * 4.0);

                        for (let i = 0; i < 3000; i++) {
                            let data = this.streakData[i];
                            data.z += data.v * baseSpeed;
                            
                            if (data.z > 500) data.z -= 3500;
                            
                            const length = stretchAmount + (data.v * 50);
                            
                            this.dummyObj.position.set(data.x, data.y, data.z - (length * 0.5));
                            this.dummyObj.scale.set(thickness, thickness, length);
                            this.dummyObj.updateMatrix();
                            
                            this.hyperspaceLines.setMatrixAt(i, this.dummyObj.matrix);
                        }
                        
                        this.hyperspaceLines.instanceMatrix.needsUpdate = true;
                    }
                }

                if (this.camera) {
                    this.camera.fov = 50 + (25 * Math.pow(this.warpAmount, 2));
                    this.camera.updateProjectionMatrix();
                }
            } else {
                if (this.hyperspaceGroup) this.hyperspaceGroup.visible = false;
                if (this.tardisVortexGroup) this.tardisVortexGroup.visible = false;

                if (this.camera && this.camera.fov !== 50) {
                    this.camera.fov = 50;
                    this.camera.updateProjectionMatrix();
                }
            }
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