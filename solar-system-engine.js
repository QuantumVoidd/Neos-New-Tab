class SolarSystemEngine extends SolarSystemAssets {
    constructor() {
        super(); // Initialize parent class
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
        
        this.currentFlySpeed = 12.0 * this.scaleFactor; 
        this.zoomLevel = 5.0; 

        // Manual Flight Controls State
        this.keys = { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, shift: false, q: false, e: false, space: false, digit1: false, digit2: false };
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.yaw = 0;
        this.pitch = 0;
        
        // Hyperspeed State
        this.isBoosting = false;
        this.boostCharge = 0;
        this.joltMultiplier = 0;
        this.hyperState = 'idle'; 
        this.tardisMatProgress = 0.0; 
        
        // FPS Limiting and Tracking
        // Load saved FPS or default to 60
        this.targetFPS = parseInt(localStorage.getItem('solarSystemTargetFPS')) || 60; 
        this.lastRenderTime = performance.now();
        this.fpsCalcTime = performance.now();
        this.framesThisSecond = 0;

        // --- REAL TIME SIMULATION STATE ---
        this.simDate = new Date();
        this.j2000Epoch = new Date('2000-01-01T12:00:00Z').getTime(); // Added Base Epoch
        this.timeScale = 1.0; 
        
        // True Real-Time Radians per Millisecond
        // 1 Earth Year = 31,556,952,000 ms
        this.baseOrb = (2 * Math.PI) / 31556952000; 
        // 1 Earth Day = 86,400,000 ms
        this.baseRot = (2 * Math.PI) / 86400000;    

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
        this.gpXDown = false; 
        this.gpSelectDown = false; // Map toggle state

        // Ship & Rover State
        this.activeShip = 'none';
        this.shipView = '3rd';
        this.isDrivingRover = false;
        this.activeSurfaceVehicle = 'none'; // 'none', 'rover', 'sev'
        this.showRoverPrompt = false;
        this.promptType = 'none'; // 'mars' or 'generic'
        this.roverHeading = 0;
        
        // Rover specific camera orbit angles
        this.roverCamYaw = 0;
        this.roverCamPitch = -0.2; // Initialize looking slightly down at the rover
        this.lastRoverLookTime = 0; // Tracks delay for auto-centering

        // Map & Route Planning State
        this.isMapOpen = false;
        this.activeWaypoint = null;
        this.mapEntities = []; 
        this.mapZoom = 1.0;
        this.mapAngle = 0;
        this.isMapDragging = false;
        this.mapDragStart = { x: 0, y: 0 };
        this.mapDragStartAngle = 0;

        // Models
        this.tieModel = null;
        this.falconModel = null;
        this.planetExpressModel = null;
        this.rickMortyModel = null;
        this.benatarModel = null;
        this.xwingModel = null;
        this.xwingCockpitModel = null;
        this.tardisModel = null;
        this.enterpriseModel = null;
        this.globalHawkModel = null;
        this.saturnVModel = null;
        this.jupiterCModel = null;
        
        // Surface Vehicles
        this.roverModel = null; // Perseverance (Mars only)
        this.sevModel = null;   // SEV (Global)
        this.sevGroup = null;   // Container for SEV
        this.currentPlanetSurface = null; // The planet object we are currently driving on

        this.planetStats = {
            sun: "Type: Yellow Dwarf\nMass: 330,000 Earths",
            mercury: "Type: Terrestrial\nDay: 58d",
            venus: "Type: Terrestrial\nDay: 243d",
            earth: "Type: Terrestrial\nDay: 24h",
            moon: "Type: Satellite\nDay: 27d",
            mars: "Type: Terrestrial\nDay: 24.6h",
            phobos: "Type: Satellite\nDay: 0.3d",
            deimos: "Type: Satellite\nDay: 1.26d",
            ceres: "Type: Dwarf Planet\nDay: 9h",
            jupiter: "Type: Gas Giant\nDay: 10h",
            io: "Type: Satellite\nDay: 1.77d",
            europa: "Type: Satellite\nDay: 3.55d",
            ganymede: "Type: Satellite\nDay: 7.15d",
            callisto: "Type: Satellite\nDay: 16.7d",
            saturn: "Type: Gas Giant\nDay: 10.7h",
            mimas: "Type: Satellite\nDay: 0.94d",
            enceladus: "Type: Satellite\nDay: 1.37d",
            tethys: "Type: Satellite\nDay: 1.88d",
            dione: "Type: Satellite\nDay: 2.73d",
            rhea: "Type: Satellite\nDay: 4.51d",
            titan: "Type: Satellite\nDay: 15.9d",
            iapetus: "Type: Satellite\nDay: 79.3d",
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
            apollo: "Type: Lunar Lander\nLocation: Moon Surface",
            rover: "Type: Surface Rover\nMission: Perseverance 2020\nLocation: Jezero Crater, Mars"
        };

        this.initialized = false;
        this.hudVisible = true;
        this.uiColor = localStorage.getItem('solarSystemUIColor') || '#00ff41';

        this.createUI();
        this.createEngineMenu(); // Pulled from the parent class (SolarSystemAssets)
        this.createStatsOverlay();
        this.setUIColor(this.uiColor); 
        
        this.initThree();
        this.buildSolarSystem();
        this.addEventListeners();
    }

    setUIColor(hex) {
        this.uiColor = hex;
        localStorage.setItem('solarSystemUIColor', hex);
        
        // Extract RGB components for rgba() capability in CSS variables
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        if (this.container) {
            this.container.style.setProperty('--ui-color', hex);
            this.container.style.setProperty('--ui-rgb', `${r}, ${g}, ${b}`);
        }
    }

    // --- ABSOLUTE TIME POSITIONING ALGORITHM ---
    syncPositionsToDate(targetDate) {
        const timeDiff = targetDate.getTime() - this.j2000Epoch;
        
        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            
            // Calculate absolute orbital position
            if (p.orbitPivot) {
                p.orbitPivot.rotation.y = (p.basePhase || 0) + (p.orbitSpeed * timeDiff);
            }
            
            // Calculate absolute axial rotation (excluding sun, blackhole, milkyway which use shaders/specials)
            if (p.mesh && key !== 'sun' && key !== 'blackhole' && key !== 'milkyway') {
                p.mesh.rotation.y = (p.rotationSpeed * timeDiff);
            }
        }
        
        // Sync Asteroid Fields
        if (this.mainAsteroidBelt) this.mainAsteroidBelt.rotation.y = -this.baseOrb * 0.1 * timeDiff;
        if (this.kuiperBelt) this.kuiperBelt.rotation.y = -this.baseOrb * 0.05 * timeDiff;
    }

    createLoadingScreen() {
        this.loadingContainer = document.createElement('div');
        this.loadingContainer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
            background: black; z-index: 10020; display: flex; align-items: center;
            justify-content: center; flex-direction: column; color: var(--ui-color);
            font-family: 'Orbitron', 'Courier New', sans-serif; transition: opacity 3s;
        `;
        
        const text = document.createElement('h1');
        text.textContent = "INITIALIZING SOLAR SYSTEM...";
        text.style.cssText = "z-index: 10021; text-shadow: 0 0 10px var(--ui-color); letter-spacing: 3px;";
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
            position: absolute; top: 25px; left: 50%; transform: translateX(-50%);
            color: var(--ui-color); font-family: 'Orbitron', 'Courier New', sans-serif;
            font-size: 0.8rem; text-shadow: 0 0 5px var(--ui-color); z-index: 10003; pointer-events: none;
            background: rgba(0, 0, 0, 0.7); padding: 10px 30px; border-radius: 50px; 
            border: 1px solid rgba(var(--ui-rgb), 0.4); backdrop-filter: blur(5px);
            box-shadow: 0 0 15px rgba(var(--ui-rgb), 0.2);
            text-align: center; transition: opacity 0.3s ease; display: flex; gap: 20px;
        `;
        
        this.fpsDisplay = document.createElement('div');
        this.fpsDisplay.textContent = "FPS: --";
        this.fpsDisplay.style.fontWeight = "bold";
        
        this.coordDisplay = document.createElement('div');
        this.coordDisplay.textContent = "X: 0 | Y: 0 | Z: 0";
        this.coordDisplay.style.opacity = "0.9";
        
        this.hudContainer.appendChild(this.fpsDisplay);
        this.hudContainer.appendChild(this.coordDisplay);
        this.container.appendChild(this.hudContainer);
        // --------------------------------------------

        // --- TIME CONTROL UI (Bottom Center) ---
        this.timeContainer = document.createElement('div');
        this.timeContainer.style.cssText = `
            position: absolute; bottom: 25px; left: 50%; transform: translateX(-50%);
            color: var(--ui-color); font-family: 'Orbitron', 'Courier New', sans-serif;
            font-size: 0.8rem; text-shadow: 0 0 5px var(--ui-color); z-index: 10003; 
            background: rgba(0, 0, 0, 0.7); padding: 10px 30px; border-radius: 50px; 
            border: 1px solid rgba(var(--ui-rgb), 0.4); backdrop-filter: blur(5px);
            box-shadow: 0 0 15px rgba(var(--ui-rgb), 0.2);
            text-align: center; transition: opacity 0.3s ease; display: flex; align-items: center; gap: 15px;
        `;

        const createBtn = (html, title, onClick) => {
            const btn = document.createElement('button');
            btn.innerHTML = html;
            btn.title = title;
            btn.style.cssText = `
                background: transparent; border: 1px solid rgba(var(--ui-rgb), 0.5); color: var(--ui-color);
                border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;
                cursor: pointer; font-size: 0.9rem; transition: 0.2s; padding: 0; text-shadow: 0 0 5px var(--ui-color);
            `;
            btn.onmouseover = () => { btn.style.background = 'rgba(var(--ui-rgb), 0.3)'; btn.style.boxShadow = '0 0 8px var(--ui-color)'; };
            btn.onmouseout = () => { btn.style.background = 'transparent'; btn.style.boxShadow = 'none'; };
            btn.onclick = onClick;
            return btn;
        };

        const btnRev = createBtn('⏪', 'Rewind (10 Days/sec)', () => { this.timeScale = -864000; }); 
        const btnStop = createBtn('⏹️', 'Stop Time', () => { this.timeScale = 0; });
        const btnPlay = createBtn('▶️', 'Play (1 Day/sec)', () => { this.timeScale = 86400; });
        const btnFwd = createBtn('⏩', 'Fast Forward (10 Days/sec)', () => { this.timeScale = 864000; });
        const btnReset = createBtn('🔄', 'Reset to Real Time', () => { 
            this.timeScale = 1; 
            this.simDate = new Date(); 
            // FIRE ABSOLUTE POSITION SYNC HERE
            if(this.syncPositionsToDate) {
                this.syncPositionsToDate(this.simDate);
            }
        });

        this.dateDisplay = document.createElement('div');
        this.dateDisplay.style.fontWeight = "bold";
        this.dateDisplay.style.minWidth = "230px";
        this.dateDisplay.style.textAlign = "right";
        this.dateDisplay.style.pointerEvents = "none";

        this.timeContainer.appendChild(btnRev);
        this.timeContainer.appendChild(btnStop);
        this.timeContainer.appendChild(btnPlay);
        this.timeContainer.appendChild(btnFwd);
        this.timeContainer.appendChild(btnReset);
        this.timeContainer.appendChild(this.dateDisplay);

        this.container.appendChild(this.timeContainer);
        // --------------------------------------------

        // --- ROVER DEPLOYMENT HUD PROMPT ---
        this.roverPrompt = document.createElement('div');
        this.roverPrompt.style.cssText = `
            position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%);
            color: var(--ui-color); font-family: 'Orbitron', 'Courier New', sans-serif;
            font-size: 1.1rem; text-shadow: 0 0 10px var(--ui-color); z-index: 10005;
            background: rgba(0, 0, 0, 0.8); padding: 15px 30px; border-radius: 50px;
            border: 2px solid rgba(var(--ui-rgb), 0.6); display: none; font-weight: bold;
            letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 0 20px rgba(var(--ui-rgb), 0.3);
            pointer-events: none; transition: opacity 0.3s ease; text-align: center;
        `;
        this.container.appendChild(this.roverPrompt);
        // --------------------------------------------

        // --- HUD TOGGLE ICON (Top Right) ---
        this.hudToggleIcon = document.createElement('div');
        this.hudToggleIcon.innerHTML = `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                <circle cx="50" cy="50" r="48" fill="rgba(0, 0, 0, 0.8)" stroke="var(--ui-color)" stroke-width="2"/>
                <path d="M 20 50 Q 50 20 80 50 Q 50 80 20 50 Z" fill="none" stroke="#ffffff" stroke-width="6"/>
                <circle cx="50" cy="50" r="14" fill="none" stroke="#ffffff" stroke-width="6"/>
                <circle cx="50" cy="50" r="6" fill="#ffffff"/>
            </svg>
        `;
        this.hudToggleIcon.style.cssText = `
            position: absolute; top: 25px; right: 30px; width: 40px; height: 40px;
            cursor: pointer; z-index: 10020; transition: transform 0.2s, filter 0.2s;
            filter: drop-shadow(0 0 5px rgba(var(--ui-rgb), 0.5)); opacity: 0.9;
        `;
        this.hudToggleIcon.addEventListener('mouseover', () => {
            this.hudToggleIcon.style.transform = 'scale(1.1)';
            this.hudToggleIcon.style.filter = 'drop-shadow(0 0 10px var(--ui-color))';
            this.hudToggleIcon.style.opacity = '1';
        });
        this.hudToggleIcon.addEventListener('mouseout', () => {
            this.hudToggleIcon.style.transform = 'scale(1.0)';
            this.hudToggleIcon.style.filter = 'drop-shadow(0 0 5px rgba(var(--ui-rgb), 0.5))';
            this.hudToggleIcon.style.opacity = '0.9';
        });
        this.hudToggleIcon.addEventListener('click', () => {
            this.hudVisible = !this.hudVisible;
            const op = this.hudVisible ? '1' : '0';
            const ev = this.hudVisible ? 'auto' : 'none';
            this.sidebarWrapper.style.opacity = op;
            this.sidebarWrapper.style.pointerEvents = ev;
            this.engineSidebarWrapper.style.opacity = op;
            this.engineSidebarWrapper.style.pointerEvents = ev;
            if (this.hudContainer && document.getElementById('hud-checkbox') && document.getElementById('hud-checkbox').checked) {
                this.hudContainer.style.opacity = op;
                this.timeContainer.style.opacity = op;
                this.timeContainer.style.pointerEvents = ev;
            }
        });
        this.container.appendChild(this.hudToggleIcon);


        // --- RIGHT SIDEBAR (3D Trapezoid with Rounded Corners & Black Backdrop) ---
        this.sidebarWrapper = document.createElement('div');
        this.sidebarWrapper.style.cssText = `
            position: absolute; right: 30px; top: 12%; width: 280px; height: 76%;
            perspective: 600px; 
            z-index: 10010; transition: opacity 0.3s ease; pointer-events: none;
        `;

        this.sidebar = document.createElement('div');
        this.sidebar.style.cssText = `
            width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); 
            backdrop-filter: blur(10px);
            border: 2px solid rgba(var(--ui-rgb), 0.4); 
            border-radius: 25px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.9); 
            transform: rotateY(-25deg); 
            transform-origin: right center;
            display: flex; flex-direction: column; 
            padding: 30px 25px;
            box-sizing: border-box; color: #fff; overflow-y: auto; overflow-x: hidden;
            pointer-events: auto;
        `;
        
        const header = document.createElement('h2');
        header.textContent = "NAVIGATION";
        header.style.cssText = "margin-top: 0; text-align: center; margin-bottom: 25px; font-size: 1.1rem; letter-spacing: 3px; color: var(--ui-color); text-shadow: 0 0 5px var(--ui-color);";
        this.sidebar.appendChild(header);

        // --- MAP TOGGLE BUTTON (Added right under Navigation header) ---
        const mapBtn = document.createElement('button');
        mapBtn.innerHTML = "🗺️ ASTROMETRICS MAP";
        mapBtn.style.cssText = `
            background: rgba(0, 0, 0, 0.6); border: 2px solid var(--ui-color); color: var(--ui-color);
            padding: 12px 10px; margin-bottom: 20px; cursor: pointer; transition: all 0.25s ease;
            text-align: center; font-family: inherit; font-size: 0.85rem; font-weight: bold; letter-spacing: 2px;
            border-radius: 50px; width: 100%; display: block; box-shadow: 0 0 15px rgba(var(--ui-rgb), 0.2);
            text-shadow: 0 0 5px var(--ui-color);
        `;
        mapBtn.addEventListener('mouseover', () => {
            mapBtn.style.background = 'rgba(var(--ui-rgb), 0.3)';
            mapBtn.style.transform = 'scale(1.05)';
        });
        mapBtn.addEventListener('mouseout', () => {
            mapBtn.style.background = 'rgba(0, 0, 0, 0.6)';
            mapBtn.style.transform = 'scale(1.0)';
        });
        mapBtn.addEventListener('click', () => this.toggleMap());
        this.sidebar.appendChild(mapBtn);

        this.destinations = [];
        this.navButtons = [];

        const destinationGroups = [
            { label: 'STARS & GALAXIES', items: ['Sun', 'BlackHole', 'MilkyWay'] },
            { label: 'PLANETS', items: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Neptune'] },
            { label: 'DWARF PLANETS', items: ['Ceres', 'Pluto', 'Haumea', 'Makemake', 'Eris'] },
            { label: 'MOONS', items: ['Moon', 'Phobos', 'Deimos', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Mimas', 'Enceladus', 'Tethys', 'Dione', 'Rhea', 'Titan', 'Iapetus', 'Charon'] },
            { label: 'STATIONS & CRAFT', items: ['Gateway', 'ISS', 'Apollo', 'Rover'] }
        ];

        let indexCounter = 0;
        destinationGroups.forEach(group => {
            const grpHeader = document.createElement('div');
            grpHeader.textContent = group.label;
            grpHeader.style.cssText = "font-size: 0.75rem; color: #888; margin-top: 20px; margin-bottom: 5px; letter-spacing: 2px; text-transform: uppercase;";
            this.sidebar.appendChild(grpHeader);

            const hr = document.createElement('hr');
            hr.style.cssText = "border: 0; border-top: 1px solid rgba(var(--ui-rgb), 0.3); margin-bottom: 12px; width: 100%;";
            this.sidebar.appendChild(hr);

            group.items.forEach(dest => {
                this.destinations.push(dest);
                const btn = document.createElement('button');
                btn.textContent = dest.toUpperCase();
                btn.dataset.index = indexCounter;
                btn.style.cssText = `
                    background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(var(--ui-rgb), 0.5); color: var(--ui-color);
                    padding: 10px 20px; margin-bottom: 10px; cursor: pointer; transition: all 0.25s ease;
                    text-align: center; font-family: inherit; font-size: 0.85rem; letter-spacing: 2px;
                    border-radius: 50px; width: 100%; display: block;
                `;
                btn.addEventListener('mouseover', () => {
                    btn.style.background = 'rgba(var(--ui-rgb), 0.2)';
                    btn.style.boxShadow = '0 0 10px rgba(var(--ui-rgb), 0.3)';
                    btn.style.transform = 'scale(1.03)';
                });
                btn.addEventListener('mouseout', () => {
                    btn.style.transform = 'scale(1.0)';
                    if(btn.dataset.active !== 'true') {
                        btn.style.background = 'rgba(0, 0, 0, 0.6)';
                        btn.style.boxShadow = 'none';
                    }
                });
                const currentIndex = indexCounter;
                btn.addEventListener('click', () => {
                    this.triggerDestination(currentIndex);
                });
                this.navButtons.push(btn);
                this.sidebar.appendChild(btn);
                indexCounter++;
            });
        });

        this.sidebarWrapper.appendChild(this.sidebar);
        this.container.appendChild(this.sidebarWrapper);

        // --- HOLOGRAPHIC NAV-MAP OVERLAY ---
        this.mapContainer = document.createElement('div');
        this.mapContainer.style.cssText = `
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 70vw; height: 80vh; 
            background: rgba(0, 20, 20, 0.85);
            background-image: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(var(--ui-rgb), 0.03) 2px, rgba(var(--ui-rgb), 0.03) 3px);
            border: 2px solid var(--ui-color); border-radius: 20px;
            box-shadow: 0 0 50px rgba(var(--ui-rgb), 0.4), inset 0 0 50px rgba(var(--ui-rgb), 0.1);
            backdrop-filter: blur(15px); display: none; z-index: 10015;
            flex-direction: column; align-items: center; padding: 0; box-sizing: border-box;
            pointer-events: auto; overflow: hidden;
        `;
        
        const mapHeader = document.createElement('div');
        mapHeader.style.cssText = "width: 100%; padding: 20px 0; background: rgba(var(--ui-rgb), 0.1); border-bottom: 1px solid rgba(var(--ui-rgb), 0.4); text-align: center;";
        
        const mapTitle = document.createElement('h2');
        mapTitle.textContent = "HOLOGRAPHIC ASTROMETRICS";
        mapTitle.style.cssText = "color: var(--ui-color); margin: 0; letter-spacing: 6px; font-size: 1.4rem; text-shadow: 0 0 10px var(--ui-color); text-transform: uppercase;";
        mapHeader.appendChild(mapTitle);
        this.mapContainer.appendChild(mapHeader);

        this.mapCanvas = document.createElement('canvas');
        // Set internal resolution higher for sharpness
        this.mapCanvas.width = 1600; 
        this.mapCanvas.height = 1000;
        this.mapCanvas.style.cssText = "flex-grow: 1; min-height: 0; width: 100%; cursor: crosshair; display: block;";
        this.mapContainer.appendChild(this.mapCanvas);
        
        const mapFooter = document.createElement('div');
        mapFooter.style.cssText = "width: 100%; padding: 15px 0; background: rgba(0, 0, 0, 0.5); border-top: 1px solid rgba(var(--ui-rgb), 0.4); text-align: center;";
        mapFooter.innerHTML = "LEFT CLICK: SET NAV POINT &nbsp;|&nbsp; SCROLL: ZOOM &nbsp;|&nbsp; DRAG: ROTATE &nbsp;|&nbsp; OBJECTS SCALE LOGARITHMICALLY";
        mapFooter.style.color = "var(--ui-color)";
        mapFooter.style.fontSize = "0.8rem";
        mapFooter.style.letterSpacing = "2px";
        mapFooter.style.textShadow = "0 0 5px var(--ui-color)";
        this.mapContainer.appendChild(mapFooter);

        this.container.appendChild(this.mapContainer);

        // Map Canvas Interaction
        this.mapCanvas.addEventListener('click', (e) => this.handleMapClick(e));
        
        // Map Zoom and Drag Handlers
        this.mapCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.05;
            if (e.deltaY < 0) {
                this.mapZoom = Math.min(this.mapZoom + zoomSpeed, 5.0);
            } else {
                this.mapZoom = Math.max(this.mapZoom - zoomSpeed, 0.5);
            }
        });

        this.mapCanvas.addEventListener('mousedown', (e) => {
            this.isMapDragging = true;
            this.mapDragStart = { x: e.clientX, y: e.clientY };
            this.mapDragStartAngle = this.mapAngle;
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isMapDragging && this.isMapOpen) {
                const deltaX = e.clientX - this.mapDragStart.x;
                this.mapAngle = this.mapDragStartAngle + (deltaX * 0.005);
            }
        });

        window.addEventListener('mouseup', () => {
            this.isMapDragging = false;
        });
    }

    // --- MAP DRAWING AND LOGIC METHODS ---
    toggleMap() {
        this.isMapOpen = !this.isMapOpen;
        if (this.isMapOpen) {
            this.mapContainer.style.display = 'flex';
        } else {
            this.mapContainer.style.display = 'none';
        }
    }

    drawMap() {
        if (!this.isMapOpen || !this.mapCanvas) return;
        const ctx = this.mapCanvas.getContext('2d');
        const cw = this.mapCanvas.width;
        const ch = this.mapCanvas.height;
        
        // --- 1. SETUP CANVAS ---
        ctx.clearRect(0, 0, cw, ch);
        ctx.fillStyle = "rgba(0, 10, 10, 0.2)";
        ctx.fillRect(0, 0, cw, ch);

        const cx = cw / 2;
        const cy = ch / 2;
        
        // Holographic Tilt Factors
        const tiltX = 1.0;
        const tiltY = 0.55; // Compresses Z-depth to look like a tilted disk
        const mapScale = (Math.min(cw, ch) / 2) * 0.95 * this.mapZoom; 

        // --- 2. DRAW HOLOGRAPHIC GRID ---
        ctx.strokeStyle = `rgba(var(--ui-rgb), 0.15)`;
        ctx.lineWidth = 1;
        
        // Helper for rotation
        const rotatePoint = (x, y) => {
            const rx = x * Math.cos(this.mapAngle) - y * Math.sin(this.mapAngle);
            const ry = x * Math.sin(this.mapAngle) + y * Math.cos(this.mapAngle);
            return { x: rx, y: ry };
        };
        
        // Concentric ellipses
        for(let i=1; i<=6; i++) {
            ctx.beginPath();
            // Since we are rotating, simple ellipses won't work perfectly if tilted *after* rotation
            // We draw them as polygons or just 2D circles transformed
            // Simplified: Draw projected circles
            for (let a = 0; a <= Math.PI * 2; a += 0.05) {
                const rBase = (cw/2 * 0.9) * (i/6); // Base radius relative to canvas size, not zoom (fixed grid)
                // Actually grid should scale with zoom? Usually yes.
                const r = rBase * this.mapZoom; 
                
                const gx = Math.cos(a) * r;
                const gz = Math.sin(a) * r;
                
                // Rotate
                const rot = rotatePoint(gx, gz);
                
                // Tilt projection
                const px = cx + rot.x * tiltX;
                const py = cy + rot.y * tiltY;
                
                if (a === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        // Radial lines
        for(let i=0; i<12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const r = cw * this.mapZoom; 
            
            const gx = Math.cos(angle) * r;
            const gz = Math.sin(angle) * r;
            
            const rot = rotatePoint(gx, gz);
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + rot.x * tiltX, cy + rot.y * tiltY);
            ctx.stroke();
        }
        
        // --- 3. CALCULATE POSITIONS & ENTITIES ---
        this.mapEntities = []; // Reset current frame entities
        const parentMapPositions = {}; // Store parent positions to offset moons
        
        const sortedPlanets = Object.keys(this.planets).sort((a, b) => {
            // Draw order: Sun first, then others by distance so closer things overlap further things if needed
            if (a === 'sun') return -1; 
            if (b === 'sun') return 1;
            return 0; 
        });

        // First pass: Calculate Sun and Planets (Parents)
        sortedPlanets.forEach(key => {
            const p = this.planets[key];
            if (!p.mesh) return;

            // Determine if it's a moon (has a parent planet in our list)
            const isMoon = (key !== 'sun' && key !== 'mercury' && key !== 'venus' && key !== 'earth' && key !== 'mars' && key !== 'jupiter' && key !== 'saturn' && key !== 'neptune' && key !== 'uranus' && key !== 'pluto' && key !== 'blackhole' && key !== 'milkyway' && key !== 'ceres' && key !== 'haumea' && key !== 'makemake' && key !== 'eris');
            
            if (isMoon) return; // Skip moons in first pass

            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);

            const dist = wPos.length();
            if (dist > 4000 * this.scaleFactor * 1.5) return; // Clip distant objects

            // Logarithmic Compression
            const compression = 0.45; 
            const scaledDist = Math.pow(dist, compression);
            const maxScaledDist = Math.pow(3800 * this.scaleFactor, compression);
            const normalizedDist = scaledDist / maxScaledDist;
            
            const r = normalizedDist * mapScale * (1/this.mapZoom * 1000); // Remove zoom from normalization to apply it later properly? 
            // Actually reusing logic:
            // mapScale includes this.mapZoom.
            
            const rawR = normalizedDist * (Math.min(cw, ch) / 2) * 0.95 * this.mapZoom;

            // Project 3D pos to flat plane
            const angle = Math.atan2(wPos.z, wPos.x); 
            
            // Apply map rotation
            const rx = Math.cos(angle) * rawR;
            const rz = Math.sin(angle) * rawR;
            
            const rot = rotatePoint(rx, rz);
            
            const mx = cx + rot.x * tiltX;
            const my = cy + rot.y * tiltY;

            parentMapPositions[key] = { x: mx, y: my, realPos: wPos };
            
            this.mapEntities.push({
                key: key,
                x: mx,
                y: my,
                isMoon: false,
                realPos: wPos
            });
        });

        // Second pass: Calculate Moons (relative to parents)
        sortedPlanets.forEach(key => {
            if (parentMapPositions[key]) return; // Already processed
            if (key === 'blackhole' || key === 'milkyway') return;

            const p = this.planets[key];
            if (!p.mesh) return;

            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);

            // Find parent
            let parentKey = 'sun';
            let minDist = Infinity;
            // Simple heuristic to find parent based on proximity in the 3D scene
            for(const pKey in parentMapPositions) {
                const d = wPos.distanceTo(parentMapPositions[pKey].realPos);
                if (d < minDist) {
                    minDist = d;
                    parentKey = pKey;
                }
            }

            if (parentKey && parentMapPositions[parentKey]) {
                const parent = parentMapPositions[parentKey];
                
                // Vector from parent to moon
                const relX = wPos.x - parent.realPos.x;
                const relZ = wPos.z - parent.realPos.z;
                let relAngle = Math.atan2(relZ, relX);
                
                // Artificial visual offset: Minimum 30px away, scaled slightly by distance
                const moonOffset = 35 + (minDist / (50 * this.scaleFactor)) * 10; 
                
                // Rotate offset based on map angle? 
                // We want the moon cluster to rotate with the map, so yes.
                const rotOffsetX = Math.cos(relAngle) * moonOffset;
                const rotOffsetZ = Math.sin(relAngle) * moonOffset;
                
                // Apply rotation to the offset vector
                const rot = rotatePoint(rotOffsetX, rotOffsetZ);

                const mx = parent.x + rot.x; // * tiltX is implicitly handled if we consider the moon projection flat relative to parent
                const my = parent.y + rot.y * tiltY;

                this.mapEntities.push({
                    key: key,
                    x: mx,
                    y: my,
                    isMoon: true,
                    parentX: parent.x,
                    parentY: parent.y
                });
            }
        });

        // --- 4. RENDER ENTITIES ---
        this.mapEntities.forEach(ent => {
            const isTarget = (this.activeWaypoint === ent.key);
            let color = this.uiColor;
            let size = 4;
            let label = ent.key.toUpperCase();
            
            if (ent.key === 'sun') { color = '#ffff00'; size = 8; }
            else if (['earth', 'mars', 'jupiter', 'saturn'].includes(ent.key)) { size = 6; }
            else if (ent.isMoon) { size = 3; color = '#aaaaaa'; }

            // Special Color Override for Nav Target
            if (isTarget) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffff00';
                ctx.fillStyle = '#ffff00';
            } else {
                ctx.shadowBlur = 5;
                ctx.shadowColor = color;
                ctx.fillStyle = color;
            }

            if (ent.isMoon) {
                ctx.beginPath();
                ctx.moveTo(ent.parentX, ent.parentY);
                ctx.lineTo(ent.x, ent.y);
                ctx.strokeStyle = `rgba(var(--ui-rgb), 0.3)`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Draw Blip
            ctx.beginPath();
            ctx.arc(ent.x, ent.y, size, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw Label
            if (!ent.isMoon || isTarget) {
                ctx.fillStyle = isTarget ? '#ffff00' : `rgba(var(--ui-rgb), 0.9)`;
                ctx.font = isTarget ? 'bold 13px Orbitron' : '11px Orbitron';
                ctx.fillText(label, ent.x + 10, ent.y + 4);
            }
        });

        // --- 5. DRAW SHIP POS ---
        const shipTarget = (this.activeShip !== 'none') ? this.shipGroup : this.camera;
        const sPos = new THREE.Vector3();
        shipTarget.getWorldPosition(sPos);
        
        // Calculate ship map pos using same logic as planets
        const sDist = sPos.length();
        const sComp = 0.45;
        const sScaled = Math.pow(sDist, sComp);
        const sMax = Math.pow(3800 * this.scaleFactor, sComp);
        const sNorm = sScaled / sMax;
        const sR = sNorm * (Math.min(cw, ch) / 2) * 0.95 * this.mapZoom;
        const sAng = Math.atan2(sPos.z, sPos.x);
        
        const sRX = Math.cos(sAng) * sR;
        const sRZ = Math.sin(sAng) * sR;
        const sRot = rotatePoint(sRX, sRZ);
        
        const sx = cx + sRot.x * tiltX;
        const sy = cy + sRot.y * tiltY;

        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        // Triangle ship icon
        ctx.moveTo(sx, sy - 8);
        ctx.lineTo(sx - 6, sy + 7);
        ctx.lineTo(sx + 6, sy + 7);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 12px Orbitron';
        ctx.fillText("YOU", sx + 10, sy + 4);
    }

    handleMapClick(e) {
        if(this.isMapDragging) return; // Prevent click on drag end
        const rect = this.mapCanvas.getBoundingClientRect();
        const scaleX = this.mapCanvas.width / rect.width;
        const scaleY = this.mapCanvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        let closest = null;
        let minDist = Infinity;

        // Check against the calculated entities from drawMap
        this.mapEntities.forEach(ent => {
            const dist = Math.hypot(ent.x - clickX, ent.y - clickY);
            // Click radius
            if (dist < 30 && dist < minDist) {
                minDist = dist;
                closest = ent.key;
            }
        });

        if (closest) {
            this.activeWaypoint = closest;
        } else {
            this.activeWaypoint = null; // Clear waypoint if clicking empty space
        }
    }
    // --------------------------------------

    createStatsOverlay() {
        this.statsContainer = document.createElement('div');
        this.statsContainer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 10002; overflow: hidden;
        `;
        this.container.appendChild(this.statsContainer);
        this.statLabels = {};

        // --- WAYPOINT GUIDANCE HUD ELEMENTS ---
        this.waypointMarker = document.createElement('div');
        this.waypointMarker.style.cssText = `
            position: absolute; width: 40px; height: 40px; border: 2px solid #ffeb3b; 
            border-radius: 50%; display: none; z-index: 10004; pointer-events: none; 
            transform: translate(-50%, -50%); box-shadow: 0 0 15px #ffeb3b inset, 0 0 15px #ffeb3b;
            transition: opacity 0.2s;
        `;
        this.waypointMarker.innerHTML = `<div style="position:absolute;top:50%;left:50%;width:6px;height:6px;background:#ffeb3b;transform:translate(-50%,-50%);border-radius:50%; box-shadow: 0 0 8px #ffeb3b;"></div>`;
        this.container.appendChild(this.waypointMarker);

        this.waypointHud = document.createElement('div');
        this.waypointHud.style.cssText = `
            position: absolute; top: 15%; left: 50%; transform: translateX(-50%); 
            color: #ffeb3b; font-family: 'Orbitron', 'Courier New', sans-serif; font-size: 1.2rem; 
            text-shadow: 0 0 10px #ffeb3b; font-weight: bold; display: none; 
            z-index: 10005; pointer-events: none; text-align: center; letter-spacing: 2px;
            background: rgba(0, 0, 0, 0.5); padding: 10px 20px; border-radius: 10px; border: 1px solid rgba(255, 235, 59, 0.3);
        `;
        this.container.appendChild(this.waypointHud);
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
        if (this.xwingModel) this.xwingModel.visible = (this.activeShip === 'xwing' && this.shipView === '3rd');
        if (this.xwingCockpitModel) this.xwingCockpitModel.visible = (this.activeShip === 'xwing' && this.shipView === '1st');
        if (this.tardisModel) this.tardisModel.visible = (this.activeShip === 'tardis');
        if (this.enterpriseModel) this.enterpriseModel.visible = (this.activeShip === 'enterprise');
        if (this.globalHawkModel) this.globalHawkModel.visible = (this.activeShip === 'globalhawk');
        if (this.shuttleModel) this.shuttleModel.visible = (this.activeShip === 'shuttle');
        
        // ROCKETS
        if (this.saturnVModel) this.saturnVModel.visible = (this.activeShip === 'saturnv');
        if (this.jupiterCModel) this.jupiterCModel.visible = (this.activeShip === 'jupiterc');
        if (this.atlasVModel) this.atlasVModel.visible = (this.activeShip === 'atlasv');
        if (this.nexusModel) this.nexusModel.visible = (this.activeShip === 'nexus');
        if (this.classicRocketModel) this.classicRocketModel.visible = (this.activeShip === 'classicrocket');
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

        this.planets[name] = { mesh, orbitPivot, systemGroup, orbitSpeed, rotationSpeed, size, basePhase: 0 };
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

        this.createPlanet('sun', 'three-textures/8k_sun.jpg', 218 * S, 0, 0, this.baseRot / 27, true);
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
            visibilityRange: 40 * S, slowZone: 150 * S, basePhase: 0
        };

        this.shipGroup = new THREE.Group();
        this.scene.add(this.shipGroup);

        const gatewayOrbit = new THREE.Group();
        moonOrbitPivot.add(gatewayOrbit);
        gatewayOrbit.position.set(60 * S, 0, 0); 

        const gatewayGroup = new THREE.Group();
        gatewayGroup.position.set(1.5 * S, 0, 0);
        gatewayOrbit.add(gatewayGroup);

        this.planets['gateway'] = { 
            mesh: gatewayGroup, orbitPivot: gatewayOrbit, 
            rotationSpeed: this.baseRot * 2, orbitSpeed: this.baseOrb * 40, size: 0.05 * S, visibilityRange: 15 * S, basePhase: 0
        };

        const gatewayEnvMap = loader.load(this.getTexUrl('three-models/Low Lunar Orbit.jpg'));
        gatewayEnvMap.mapping = THREE.EquirectangularReflectionMapping;
        this.gatewayEnvMap = gatewayEnvMap; 

        const issOrbit = new THREE.Group();
        earth.systemGroup.add(issOrbit);
        
        const issGroup = new THREE.Group();
        issGroup.position.set(4.0 * S, 0, 0); 
        issOrbit.add(issGroup);

        this.planets['iss'] = { 
            mesh: issGroup, orbitPivot: issOrbit, 
            rotationSpeed: this.baseRot * 3, orbitSpeed: this.baseOrb * 30, size: 0.1 * S, visibilityRange: 20 * S, basePhase: 0
        };

        const apolloGroup = new THREE.Group();
        apolloGroup.position.set(-0.545 * S, 0, 0); 
        moonMesh.add(apolloGroup);
        const apolloLight = new THREE.PointLight(0xffdd88, 0.02, 2 * S);
        apolloLight.position.set(-0.1 * S, 0, 0);
        apolloGroup.add(apolloLight);

        this.planets['apollo'] = { 
            mesh: apolloGroup, orbitPivot: null, 
            rotationSpeed: 0, orbitSpeed: 0, size: 0.02 * S, visibilityRange: 8 * S, collisionSize: 0.02 * S, basePhase: 0
        };

        this.createPlanet('mars', 'three-textures/8k_mars.jpg', 1.06 * S, 700 * S, this.baseOrb * 0.53, this.baseRot / 1.02);

        // --- MARS MOONS ---
        const createMarsMoon = (name, texture, sizeS, distS, speed) => {
            const orbitPivot = new THREE.Group();
            this.planets['mars'].systemGroup.add(orbitPivot);
            
            const geo = new THREE.SphereGeometry(sizeS, 32, 32);
            const mat = new THREE.MeshStandardMaterial({ 
                map: loader.load(this.getTexUrl(texture)), roughness: 0.8, metalness: 0.1 
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(distS, 0, 0);
            orbitPivot.add(mesh);
            
            this.planets[name] = { 
                mesh: mesh, orbitPivot: orbitPivot, rotationSpeed: speed, orbitSpeed: speed, 
                size: sizeS, visibilityRange: Math.max(sizeS * 150, 15 * S), slowZone: Math.max(sizeS * 200, 30 * S), basePhase: 0
            };
        };

        createMarsMoon('phobos', 'three-textures/mars-moons/Mars - Phobos.jpg', 0.02 * S, 3 * S, this.baseRot * 3.1);
        createMarsMoon('deimos', 'three-textures/mars-moons/Mars - Deimos.jpg', 0.01 * S, 8 * S, this.baseRot * 0.79);

        // --- PERSEVERANCE ROVER (MARS SURFACE) ---
        this.roverGroup = new THREE.Group();
        this.roverPos = new THREE.Vector3(0, 0, 1.06 * S); 
        this.roverGroup.position.copy(this.roverPos);
        this.planets['mars'].mesh.add(this.roverGroup);

        this.planets['rover'] = { 
            mesh: this.roverGroup, orbitPivot: null, rotationSpeed: 0, orbitSpeed: 0, 
            size: 0.005 * S, visibilityRange: 8 * S, collisionSize: 0.005 * S, basePhase: 0
        };

        const roverLight = new THREE.PointLight(0xffdd88, 0.05, 5 * S);
        roverLight.position.set(0, 0.02 * S, 0);
        this.roverGroup.add(roverLight);

        this.createPlanet('ceres', 'three-textures/4k_ceres_fictional.jpg', 0.15 * S, 950 * S, this.baseOrb * 0.2, this.baseRot * 2.6);

        this.mainAsteroidBelt = this.createAsteroidBelt(850 * S, 1050 * S, 1500, 80 * S);
        this.createPlanet('jupiter', 'three-textures/8k_jupiter.jpg', 22.4 * S, 1200 * S, this.baseOrb * 0.08, this.baseRot * 2.4);

        // --- JUPITER MOONS ---
        const createJupiterMoon = (name, texture, sizeS, distS, speed) => {
            const orbitPivot = new THREE.Group();
            this.planets['jupiter'].systemGroup.add(orbitPivot);
            
            const geo = new THREE.SphereGeometry(sizeS, 32, 32);
            const mat = new THREE.MeshStandardMaterial({ 
                map: loader.load(this.getTexUrl(texture)), roughness: 0.8, metalness: 0.1 
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(distS, 0, 0);
            orbitPivot.add(mesh);
            
            this.planets[name] = { 
                mesh: mesh, orbitPivot: orbitPivot, rotationSpeed: speed, orbitSpeed: speed, 
                size: sizeS, visibilityRange: Math.max(sizeS * 150, 40 * S), slowZone: Math.max(sizeS * 200, 80 * S), basePhase: 0
            };
        };

        createJupiterMoon('io', 'three-textures/jupiters-moons/Jupiter - Io (B).jpg', 0.29 * S, 40 * S, this.baseRot * 0.56);
        createJupiterMoon('europa', 'three-textures/jupiters-moons/Jupiter - Europa.jpg', 0.25 * S, 60 * S, this.baseRot * 0.28);
        createJupiterMoon('ganymede', 'three-textures/jupiters-moons/Jupiter - Ganymede.jpg', 0.41 * S, 95 * S, this.baseRot * 0.14);
        createJupiterMoon('callisto', 'three-textures/jupiters-moons/Jupiter - Callisto.jpg', 0.38 * S, 160 * S, this.baseRot * 0.06);


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

        // --- SATURN MOONS ---
        const createSaturnMoon = (name, texture, sizeS, distS, speed, inclination) => {
            const orbitPivot = new THREE.Group();
            if (inclination) orbitPivot.rotation.z = inclination;
            saturn.systemGroup.add(orbitPivot);
            
            const geo = new THREE.SphereGeometry(sizeS, 32, 32);
            const mat = new THREE.MeshStandardMaterial({ 
                map: loader.load(this.getTexUrl(texture)), 
                roughness: 0.8, 
                metalness: 0.1 
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(distS, 0, 0);
            orbitPivot.add(mesh);
            
            this.planets[name] = { 
                mesh: mesh, 
                orbitPivot: orbitPivot, 
                rotationSpeed: speed, 
                orbitSpeed: speed, 
                size: sizeS, 
                visibilityRange: Math.max(sizeS * 150, 40 * S), 
                slowZone: Math.max(sizeS * 200, 80 * S), 
                basePhase: 0
            };
        };

        createSaturnMoon('mimas', 'three-textures/saturns-moons/Saturn - Mimas.jpg', 0.06 * S, 61 * S, this.baseRot * 1.06, 0.027);
        createSaturnMoon('enceladus', 'three-textures/saturns-moons/Saturn - Enceladus.jpg', 0.08 * S, 78 * S, this.baseRot * 0.73, 0.0001);
        createSaturnMoon('tethys', 'three-textures/saturns-moons/Saturn - Tethys.jpg', 0.17 * S, 97 * S, this.baseRot * 0.53, 0.019);
        createSaturnMoon('dione', 'three-textures/saturns-moons/Saturn - Dione.jpg', 0.18 * S, 124 * S, this.baseRot * 0.36, 0.0003);
        createSaturnMoon('rhea', 'three-textures/saturns-moons/Saturn - Rhea.jpg', 0.24 * S, 173 * S, this.baseRot * 0.22, 0.006);
        createSaturnMoon('titan', 'three-textures/saturns-moons/Saturn - Titan.jpg', 0.81 * S, 280 * S, this.baseRot * 0.062, 0.005);
        createSaturnMoon('iapetus', 'three-textures/saturns-moons/Saturn - Iapetus.jpg', 0.23 * S, 450 * S, this.baseRot * 0.012, 0.27);

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
            visibilityRange: 150 * S,
            basePhase: 0
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
            size: 50 * S, visibilityRange: 30000 * S, collisionSize: 100 * S, basePhase: 0 
        };

        // --- ASSIGN INITIAL EPOCH OFFSETS ---
        const j2000Phases = {
            mercury: 4.40, venus: 3.18, earth: 1.75, moon: 2.18, mars: 6.20, ceres: 3.96,
            phobos: 1.20, deimos: 0.80,
            jupiter: 0.60, saturn: 0.87, 
            io: 2.30, europa: 0.10, ganymede: 1.50, callisto: 4.80,
            mimas: 4.64, enceladus: 3.07, tethys: 0.15, dione: 2.92, rhea: 4.08, titan: 5.52, iapetus: 6.17,
            neptune: 5.32, pluto: 4.17, charon: 3.14,
            haumea: 3.49, makemake: 2.79, eris: 0.60, iss: 1.5, gateway: 2.5, rover: 0.0
        };
        
        for (const key in this.planets) {
            this.planets[key].basePhase = j2000Phases[key] || (Math.random() * Math.PI * 2);
        }
        
        // Load external models from the secondary assets class
        if (typeof this.loadExtraModels === 'function') {
            this.loadExtraModels(gltfLoader, fixModelUVs, S);
        }
        
        this.syncPositionsToDate(this.simDate);

        this.camera.position.set(500 * S, 800 * S, 1200 * S);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    triggerDestination(index) {
        if (index < 0) index = this.destinations.length - 1;
        if (index >= this.destinations.length) index = 0;
        
        this.navButtons.forEach(b => { 
            b.style.background = 'rgba(0, 0, 0, 0.6)'; 
            b.style.boxShadow = 'none';
            b.dataset.active = 'false'; 
        });
        const activeBtn = this.navButtons[index];
        activeBtn.style.background = 'rgba(var(--ui-rgb), 0.2)';
        activeBtn.style.boxShadow = '0 0 10px rgba(var(--ui-rgb), 0.3)';
        activeBtn.dataset.active = 'true';
        
        const destName = this.destinations[index].toLowerCase();
        this.focusedPlanet = this.planets[destName];
        
        this.isFlyingToDest = true;
        this.flyProgress = 0;
        
        // Dynamic Destination Zoom Fixes
        if (destName === 'blackhole') {
            this.zoomLevel = 150.0;
        } else if (destName === 'milkyway') {
            this.zoomLevel = 1.5; 
        } else if (destName === 'rover') {
            this.zoomLevel = 3.0;
        } else {
            this.zoomLevel = 5.0; 
        }

        this.startCamPos.copy(this.camera.position);
        
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        this.startLookAt.copy(this.camera.position).add(dir.multiplyScalar(100));
    }

    clearFocus() {
        this.focusedPlanet = null;
        this.isFlyingToDest = false;
        this.navButtons.forEach(b => { 
            b.style.background = 'rgba(0, 0, 0, 0.6)'; 
            b.style.boxShadow = 'none';
            b.dataset.active = 'false'; 
        });
    }

    // --- SEV DEPLOYMENT LOGIC ---
    deployVehicle(type) {
        const targetObj = (this.activeShip !== 'none') ? this.shipGroup : this.camera;
        
        // Find closest planet
        let closest = null;
        let minDist = Infinity;
        
        for (const key in this.planets) {
            // EXCLUDE non-landable objects AND Earth/Jupiter/Saturn for SEV deployment
            if (['sun', 'milkyway', 'blackhole', 'iss', 'gateway', 'rover', 'apollo', 'earth', 'jupiter', 'saturn'].includes(key)) continue; 
            const p = this.planets[key];
            if (!p.mesh) continue;
            
            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);
            
            const dist = targetObj.position.distanceTo(wPos) - p.size;
            if (dist < minDist) {
                minDist = dist;
                closest = key;
            }
        }
        
        // Threshold check: Must be close to surface
        if (closest && this.planets[closest]) {
            const p = this.planets[closest];
            if (minDist < p.size * 6.0 || minDist < 100 * this.scaleFactor) {
                
                if (type === 'rover' && closest === 'mars') {
                    this.activeSurfaceVehicle = 'rover';
                    this.isDrivingRover = true;
                    this.currentPlanetSurface = p;
                    if(this.focusedPlanet) this.clearFocus();
                    return;
                }
                
                if (type === 'sev' && this.sevModel) {
                    // Deploy SEV
                    this.activeSurfaceVehicle = 'sev';
                    this.currentPlanetSurface = p;
                    this.isDrivingRover = true;
                    
                    this.sevModel.visible = true;
                    p.mesh.add(this.sevModel);
                    
                    // Position at current location projected to surface
                    const wPos = new THREE.Vector3();
                    p.mesh.getWorldPosition(wPos);
                    
                    const pInv = p.mesh.quaternion.clone().invert();
                    
                    // Vector from planet center to ship
                    const relativePos = targetObj.position.clone().sub(wPos);
                    // Rotate into planet local space
                    relativePos.applyQuaternion(pInv);
                    
                    // Normalize and scale to surface radius
                    relativePos.normalize().multiplyScalar(p.size);
                    
                    this.sevModel.position.copy(relativePos);
                    
                    // Orient UP away from center
                    const up = relativePos.clone().normalize();
                    const dummyObj = new THREE.Object3D();
                    dummyObj.position.copy(relativePos);
                    dummyObj.lookAt(new THREE.Vector3(0,0,0)); // Look at center (down)
                    this.sevModel.quaternion.copy(dummyObj.quaternion);
                    this.sevModel.rotateX(-Math.PI/2); // Adjust so wheels are down

                    this.roverPos = this.sevModel.position.clone(); // Reuse rover pos logic variable for SEV

                    if(this.focusedPlanet) this.clearFocus();
                    return;
                }
            }
        }
    }

    returnToShip() {
        this.isDrivingRover = false;
        this.camera.up.set(0, 1, 0); 
        
        if (this.activeSurfaceVehicle === 'sev' && this.sevModel && this.currentPlanetSurface) {
            this.sevModel.visible = false;
            this.currentPlanetSurface.mesh.remove(this.sevModel);
        }
        
        this.activeSurfaceVehicle = 'none';
        this.currentPlanetSurface = null;
    }

    addEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            let key = e.key.toLowerCase();
            
            if (e.key === ' ') {
                key = 'space';
                e.preventDefault();
            }
            if (e.key === '1') key = 'digit1';
            if (e.key === '2') key = 'digit2';
            
            if (key === 'y' && (this.activeShip === 'tie' || this.activeShip === 'rickmorty' || this.activeShip === 'xwing' || this.activeShip === 'globalhawk')) {
                this.shipView = this.shipView === '1st' ? '3rd' : '1st';
                this.updateShipVisibility();
            }

            // Surface Vehicle Logic
            if (key === 'x') {
                if (this.isDrivingRover) {
                    this.returnToShip();
                } else if (this.promptType === 'generic') {
                    this.deployVehicle('sev');
                }
            }

            // Mars Specific Options
            if (key === 'digit1' && this.promptType === 'mars' && !this.isDrivingRover) {
                this.deployVehicle('rover');
            }
            if (key === 'digit2' && this.promptType === 'mars' && !this.isDrivingRover) {
                this.deployVehicle('sev');
            }

            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
                if(this.focusedPlanet && !this.isDrivingRover) this.clearFocus(); 
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!this.isActive) return;
            let key = e.key.toLowerCase();
            if (e.key === ' ') key = 'space';
            if (e.key === '1') key = 'digit1';
            if (e.key === '2') key = 'digit2';
            
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

            if (this.isDrivingRover) {
                // Free Look Mouse Controls for Rover Orbiting
                this.roverCamYaw -= deltaX * 0.005;
                this.roverCamPitch -= deltaY * 0.005;
                
                this.roverCamPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(0.2, this.roverCamPitch));
                this.lastRoverLookTime = performance.now();
                
            } else if (this.activeShip !== 'none' && this.shipView === '1st') {
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
            if (!this.isActive || !this.focusedPlanet || this.isDrivingRover) return;
            if (this.isMapOpen) return; // Let map handle its own zoom
            
            let zoomSpeed = 0.002 * this.zoomLevel; 
            if (zoomSpeed < 0.002) zoomSpeed = 0.002;
            
            this.zoomLevel += e.deltaY * zoomSpeed;
            this.zoomLevel = Math.max(1.2, Math.min(this.zoomLevel, 2000.0));
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    pollGamepad() {
        if (!this.isActive || this.isDrivingRover) return;
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
                    if (this.activeShip === 'tie' || this.activeShip === 'rickmorty' || this.activeShip === 'xwing' || this.activeShip === 'globalhawk') {
                        this.shipView = this.shipView === '1st' ? '3rd' : '1st';
                        this.updateShipVisibility();
                    }
                }
            } else { this.gpYDown = false; }

            // Xbox 'X' button mapping for Rover Deployment
            if (gp.buttons[2] && gp.buttons[2].pressed) {
                if (!this.gpXDown) {
                    this.gpXDown = true;
                    if(this.isDrivingRover) this.returnToShip();
                    else if(this.promptType === 'generic') this.deployVehicle('sev');
                }
            } else { this.gpXDown = false; }
            
            // Xbox 'Select' button mapping for Astrometrics Map
            if (gp.buttons[8] && gp.buttons[8].pressed) {
                if (!this.gpSelectDown) {
                    this.gpSelectDown = true;
                    this.toggleMap();
                }
            } else { this.gpSelectDown = false; }

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
        if (this.isDrivingRover) return; // Skip collision resolution when glued to surface

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
            this.lastRenderTime = performance.now(); // Prevents massive time skip on initial start
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
        let actualDeltaMs = 0;

        if (this.targetFPS > 0) {
            const fpsInterval = 1000 / this.targetFPS;
            const elapsed = now - this.lastRenderTime;
            if (elapsed < fpsInterval) return; 
            
            actualDeltaMs = elapsed;
            this.lastRenderTime = now - (elapsed % fpsInterval);
        } else {
            actualDeltaMs = now - this.lastRenderTime;
            this.lastRenderTime = now;
        }

        // --- REAL TIME SIMULATION LOGIC ---
        let simDeltaMs = actualDeltaMs * this.timeScale;
        this.simDate = new Date(this.simDate.getTime() + simDeltaMs);

        if (this.dateDisplay) {
            const options = { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
            if (this.timeScale !== 1) {
                let speedText = this.timeScale === 0 ? "PAUSED" : (this.timeScale > 0 ? `+${this.timeScale.toLocaleString()}x` : `${this.timeScale.toLocaleString()}x`);
                this.dateDisplay.innerHTML = `${this.simDate.toLocaleString('en-US', options)} <span style="color: ${this.timeScale === 0 ? '#ff4444' : '#ffff00'}">[${speedText}]</span>`;
            } else {
                this.dateDisplay.innerHTML = `${this.simDate.toLocaleString('en-US', options)} <span style="color: var(--ui-color)">[REAL TIME]</span>`;
            }
        }

        this.framesThisSecond++;
        if (now - this.fpsCalcTime >= 1000) {
            if (this.fpsDisplay) this.fpsDisplay.textContent = `FPS: ${this.framesThisSecond}`;
            this.framesThisSecond = 0;
            this.fpsCalcTime = now;
        }

        this.isBoosting = false;

        let wantsToBoost = this.keys['shift'] && !this.isDrivingRover;
        const gamepadsArray = navigator.getGamepads();
        for (let i = 0; i < gamepadsArray.length; i++) {
            const gp = gamepadsArray[i];
            if (gp && gp.buttons[6] && gp.buttons[6].value > 0.1 && !this.isDrivingRover) {
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

        const targetObj = (this.activeShip !== 'none') ? this.shipGroup : this.camera;

        let absoluteMinDist = Infinity;
        let maxSpeed = 12.0 * (this.scaleFactor / 5); 
        let targetSpeed = maxSpeed;

        if (this.coordDisplay && this.hudContainer && this.hudContainer.style.display !== 'none') {
            const trackingObj = this.isDrivingRover ? this.camera : targetObj;
            const sf = this.scaleFactor;
            const niceX = Math.round(trackingObj.position.x / sf).toLocaleString();
            const niceY = Math.round(trackingObj.position.y / sf).toLocaleString();
            const niceZ = Math.round(trackingObj.position.z / sf).toLocaleString();
            this.coordDisplay.textContent = `X: ${niceX} | Y: ${niceY} | Z: ${niceZ}`;
        }

        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            
            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);
            
            const baseSize = p.collisionSize !== undefined ? p.collisionSize : p.size;
            const surfaceDist = targetObj.position.distanceTo(wPos) - baseSize;
            
            if (surfaceDist < absoluteMinDist) {
                absoluteMinDist = surfaceDist;
            }

            const proximityThreshold = Math.max(baseSize * 50, 5 * this.scaleFactor);
            
            if (surfaceDist < proximityThreshold) {
                let t = Math.max(0, surfaceDist / proximityThreshold);
                
                let minSpeed = baseSize * 0.015; 
                minSpeed = Math.max(5.0, minSpeed); 
                
                let speedLimit = minSpeed + (maxSpeed - minSpeed) * (t * t); 
                
                if (speedLimit < targetSpeed) {
                    targetSpeed = speedLimit;
                }
            }
        }

        this.currentFlySpeed = targetSpeed;
        
        const interstellarThreshold = 40000 * this.scaleFactor; 
        if (absoluteMinDist > interstellarThreshold) {
            let t = Math.min(1.0, (absoluteMinDist - interstellarThreshold) / (1000000 * this.scaleFactor));
            this.currentFlySpeed += (this.currentFlySpeed * 10000.0) * (t * t);
        }

        // --- ROVER DEPLOYMENT PROMPT LOGIC ---
        let showPrompt = false;
        let pType = 'none';

        if (!this.isDrivingRover) {
            // Check closeness to Mars
            if (this.planets['mars'] && this.planets['mars'].mesh) {
                const marsPos = new THREE.Vector3();
                this.planets['mars'].mesh.getWorldPosition(marsPos);
                const distToMars = targetObj.position.distanceTo(marsPos);
                if (distToMars < 1.06 * this.scaleFactor * 6.0) { 
                    showPrompt = true;
                    pType = 'mars';
                }
            }

            // Check closeness to other surfaces for SEV
            if (!showPrompt) {
                for (const key in this.planets) {
                    // EXCLUDE EARTH/JUPITER/SATURN from SEV deployment
                    if (['sun', 'milkyway', 'blackhole', 'iss', 'gateway', 'rover', 'apollo', 'mars', 'earth', 'jupiter', 'saturn'].includes(key)) continue;
                    const p = this.planets[key];
                    if (!p.mesh) continue;
                    
                    const wPos = new THREE.Vector3();
                    p.mesh.getWorldPosition(wPos);
                    const dist = targetObj.position.distanceTo(wPos) - p.size;
                    
                    if (dist < p.size * 6.0 || dist < 100 * this.scaleFactor) {
                        showPrompt = true;
                        pType = 'generic';
                        break;
                    }
                }
            }
        } else {
            showPrompt = true; // Always show return prompt when driving
        }
        
        this.showRoverPrompt = showPrompt;
        this.promptType = pType;

        if (this.showRoverPrompt) {
            this.roverPrompt.style.display = 'block';
            if (this.isDrivingRover) {
                this.roverPrompt.textContent = "[X] RETURN TO SHIP";
            } else if (this.promptType === 'mars') {
                this.roverPrompt.textContent = "[1] DEPLOY PERSEVERANCE ROVER | [2] DEPLOY SEV";
            } else {
                this.roverPrompt.textContent = "[X] DEPLOY SEV";
            }
        } else {
            this.roverPrompt.style.display = 'none';
        }
        // -------------------------------------

        if (this.sunMaterial && this.sunMaterial.userData.time) {
            this.sunMaterial.userData.time.value += actualDeltaMs * 0.0006; 
        }
        if (this.sunCoronaMat) {
            this.sunCoronaMat.uniforms.time.value += actualDeltaMs * 0.0006; 
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

        // Extra gamepad block for checking Rover return when driving 
        // Handles "X" Button deployment checking properly per-frame
        if (this.isDrivingRover) {
            const gamepadsArray = navigator.getGamepads();
            for (let i = 0; i < gamepadsArray.length; i++) {
                const gp = gamepadsArray[i];
                if (gp && gp.buttons[2] && gp.buttons[2].pressed) {
                    if (!this.gpXDown) {
                        this.gpXDown = true;
                        this.returnToShip();
                    }
                } else if (gp && (!gp.buttons[2] || !gp.buttons[2].pressed)) {
                    this.gpXDown = false;
                }
            }
        }

        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);
            const trackingObjDist = this.isDrivingRover ? this.camera : targetObj;
            const distToCam = trackingObjDist.position.distanceTo(wPos);
            
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

        // --- ORBIT & ROTATION UPDATED USING REAL TIME DELTAS ---
        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            
            if (p.orbitPivot) p.orbitPivot.rotation.y += p.orbitSpeed * p.currentSpeedMult * simDeltaMs;
            if (p.mesh && key !== 'rover') p.mesh.rotation.y += p.rotationSpeed * p.currentSpeedMult * simDeltaMs;
        }

        if (this.mainAsteroidBelt) this.mainAsteroidBelt.rotation.y -= this.baseOrb * 0.1 * simDeltaMs;
        if (this.kuiperBelt) this.kuiperBelt.rotation.y -= this.baseOrb * 0.05 * simDeltaMs;

        const direction = new THREE.Vector3(
            Math.cos(this.pitch) * Math.sin(this.yaw),
            Math.sin(this.pitch),
            Math.cos(this.pitch) * Math.cos(this.yaw)
        );

        if (this.isDrivingRover) {
            // --- SURFACE DRIVING LOGIC ---
            // Determine active group (Mars Rover or SEV)
            const drivingGroup = (this.activeSurfaceVehicle === 'sev') ? this.sevModel : this.roverGroup;
            const currentPosRef = (this.activeSurfaceVehicle === 'sev') ? this.sevModel.position : this.roverPos;
            const radius = (this.activeSurfaceVehicle === 'sev') ? this.currentPlanetSurface.size : (1.06 * this.scaleFactor);

            // Scale movement speed based on planet size so vehicles don't feel "stuck" on massive planets
            // Base scaling factor relative to Earth size (2.0 * S)
            let speedScaler = 1.0;
            if (this.activeSurfaceVehicle === 'sev' && this.currentPlanetSurface) {
                speedScaler = Math.max(1.0, this.currentPlanetSurface.size / (2.0 * this.scaleFactor));
            }

            let yawInput = 0;
            let accel = 0;
            let isGamepadLooking = false;

            if (this.keys['a']) yawInput -= 1;
            if (this.keys['d']) yawInput += 1;
            if (this.keys['w']) accel += 1;
            if (this.keys['s']) accel -= 0.5; // Reverse is slower

            // Apply gamepad inputs for driving
            const gamepads = navigator.getGamepads();
            for (let i = 0; i < gamepads.length; i++) {
                const gp = gamepads[i];
                if (!gp) continue;
                
                if (Math.abs(gp.axes[0]) > 0.1) yawInput += gp.axes[0]; // Left stick X
                if (Math.abs(gp.axes[1]) > 0.1) accel -= gp.axes[1];    // Left stick Y
                
                // Triggers
                if (gp.buttons[7] && gp.buttons[7].pressed) accel += gp.buttons[7].value;
                if (gp.buttons[6] && gp.buttons[6].pressed) accel -= gp.buttons[6].value * 0.5;

                // Right Stick: Free Look Input
                if (Math.abs(gp.axes[2]) > 0.1) {
                    this.roverCamYaw -= gp.axes[2] * 0.05;
                    isGamepadLooking = true;
                }
                if (Math.abs(gp.axes[3]) > 0.1) {
                    this.roverCamPitch -= gp.axes[3] * 0.05;
                    isGamepadLooking = true;
                }
            }
            
            if (isGamepadLooking) {
                this.lastRoverLookTime = performance.now(); // Register look action to delay auto-center
            }
            
            // Constrain camera pitch
            this.roverCamPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(0.2, this.roverCamPitch));

            // Auto-center the camera behind the rover ONLY if no user look input is detected for 3 full seconds
            if (!this.isDragging && !isGamepadLooking && (performance.now() - this.lastRoverLookTime > 3000)) {
                // Smoothly interpolate back to behind the rover and slightly angled down
                this.roverCamYaw += (0 - this.roverCamYaw) * 0.05; 
                this.roverCamPitch += (-0.2 - this.roverCamPitch) * 0.05;
            }

            yawInput = Math.max(-1, Math.min(1, yawInput));
            accel = Math.max(-1, Math.min(1, accel));

            // Local Yaw Rotation
            drivingGroup.rotateY(-yawInput * actualDeltaMs * 0.002);

            // Forward Translation
            let speed = accel * actualDeltaMs * 0.01 * (this.scaleFactor / 100) * speedScaler;
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(drivingGroup.quaternion).normalize();
            
            currentPosRef.add(forward.multiplyScalar(speed));
            currentPosRef.setLength(radius); // Stick exactly to surface radius
            drivingGroup.position.copy(currentPosRef);

            // Align to Surface Normal
            const normal = currentPosRef.clone().normalize();
            const currentUp = new THREE.Vector3(0, 1, 0).applyQuaternion(drivingGroup.quaternion).normalize();
            const alignQuat = new THREE.Quaternion().setFromUnitVectors(currentUp, normal);
            drivingGroup.quaternion.premultiply(alignQuat);

            // Dynamic 3rd Person Free-Look Camera Follow
            const worldPos = new THREE.Vector3();
            drivingGroup.getWorldPosition(worldPos);

            const wNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(drivingGroup.quaternion).normalize();

            // Desired offset base sizes (scale with planet size to keep camera relative?)
            // Actually, keep camera relative to vehicle size usually, but for giants, maybe pull back slightly?
            // For now, keep fixed relative to vehicle to maintain sense of scale.
            const orbitDist = 0.05 * this.scaleFactor; 
            const heightOffset = 0.015 * this.scaleFactor;

            // Compute Local Look Direction based on user's pitch/yaw
            const lookDirLocal = new THREE.Vector3(
                Math.sin(this.roverCamYaw) * Math.cos(this.roverCamPitch),
                Math.sin(this.roverCamPitch),
                Math.cos(this.roverCamYaw) * Math.cos(this.roverCamPitch)
            );
            
            // Transform local look direction into World Space based on the vehicle's 6DOF quaternion
            const lookDirWorld = lookDirLocal.applyQuaternion(drivingGroup.quaternion).normalize();
            
            // Define focus/pivot point slightly above the rover
            const focusPoint = worldPos.clone().add(wNormal.clone().multiplyScalar(heightOffset));
            
            // Project camera backward from the focus point based on the free-look direction
            const camTargetPos = focusPoint.clone().sub(lookDirWorld.multiplyScalar(orbitDist));

            // Smoothly move the camera
            this.camera.position.lerp(camTargetPos, 0.2);
            this.camera.up.lerp(wNormal, 0.2);
            this.camera.lookAt(focusPoint);

            // Keeps underlying free-flight pitch/yaw matching so returning to ship is seamless
            const finalLookDir = new THREE.Vector3().subVectors(focusPoint, this.camera.position).normalize();
            this.yaw = Math.atan2(finalLookDir.x, finalLookDir.z);
            this.pitch = Math.asin(Math.max(-1, Math.min(1, finalLookDir.y)));

        } else if (this.focusedPlanet) {
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
                } else if (this.focusedPlanet === this.planets['rover']) {
                    const marsPos = new THREE.Vector3();
                    this.planets['mars'].mesh.getWorldPosition(marsPos);
                    dirFromCenter = new THREE.Vector3().subVectors(worldPos, marsPos).normalize();
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
            else if (this.activeShip === 'globalhawk') {
                camDist = 120.0; heightOffset = 25.0;
                if (this.globalHawkModel) this.globalHawkModel.scale.set(15.0, 15.0, 15.0);
            }
            else if (this.activeShip === 'saturnv') {
                camDist = 80.0; heightOffset = 0.0; 
                if (this.saturnVModel) this.saturnVModel.scale.set(0.9, 0.9, 0.9); 
            }
            else if (this.activeShip === 'jupiterc') {
                camDist = 60.0; heightOffset = 0.0; 
                if (this.jupiterCModel) this.jupiterCModel.scale.set(1.1, 1.1, 1.1); 
            }

            if (this.shipView === '1st' && this.activeShip !== 'saturnv' && this.activeShip !== 'jupiterc' && this.activeShip !== 'globalhawk') { // Limit FPS view on some models
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
                            this.tardisVortexMat.uniforms.time.value += actualDeltaMs * 0.0012;
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

        // --- RENDER MAP IF OPEN ---
        if (this.isMapOpen) {
            this.drawMap();
        }

        // --- WAYPOINT GUIDANCE HUD LOGIC ---
        if (this.activeWaypoint && this.planets[this.activeWaypoint] && this.planets[this.activeWaypoint].mesh) {
            const p = this.planets[this.activeWaypoint];
            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);

            const activeTargetObj = (this.activeShip !== 'none') ? this.shipGroup : this.camera;
            const dist = activeTargetObj.position.distanceTo(wPos);
            const niceDist = Math.round(dist / this.scaleFactor).toLocaleString();

            this.waypointHud.style.display = 'block';

            const vector = wPos.clone();
            vector.project(this.camera);

            if (vector.z < 1) { 
                // Target is in front of camera
                const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
                
                this.waypointMarker.style.display = 'block';
                this.waypointMarker.style.left = `${x}px`;
                this.waypointMarker.style.top = `${y}px`;
                
                this.waypointHud.innerHTML = `NAV TARGET: ${this.activeWaypoint.toUpperCase()} <br> DISTANCE: ${niceDist} SU`;
            } else {
                // Target is behind camera
                this.waypointMarker.style.display = 'none'; 
                this.waypointHud.innerHTML = `NAV TARGET: ${this.activeWaypoint.toUpperCase()} | DIST: ${niceDist} SU <br><span style="color:#ff4444;font-size:0.9rem;">[ BEHIND YOU ]</span>`;
            }
        } else {
            this.waypointHud.style.display = 'none';
            this.waypointMarker.style.display = 'none';
        }

        for (const key in this.planets) {
            const p = this.planets[key];
            if (!p.mesh) continue;
            const wPos = new THREE.Vector3();
            p.mesh.updateMatrixWorld(true);
            p.mesh.getWorldPosition(wPos);
            if (!this.statLabels[key]) {
                const lbl = document.createElement('div');
                lbl.style.cssText = `
                    position: absolute; color: var(--ui-color); display: none;
                    font-size: 0.75rem; pointer-events: none; text-shadow: 0 0 5px var(--ui-color);
                    background: rgba(0,0,0,0.5); padding: 5px 10px; border: 1px solid rgba(var(--ui-rgb), 0.3);
                    box-shadow: 0 0 10px var(--ui-color); border-radius: 4px; line-height: 1.5; text-align: center;
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
                // Initialize using the newly named Engine class which extends Assets
                solarSystemInstance = new SolarSystemEngine(); 
            }
            solarSystemInstance.open();
        });
    }
});