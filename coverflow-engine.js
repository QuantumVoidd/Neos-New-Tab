class MatrixCoverflow {
    constructor() {
        // --- 💾 LOAD SETTINGS ---
        this.currentStyle = localStorage.getItem('matrix-coverflow-style') || 'aurora';
        this.currentBg = localStorage.getItem('matrix-coverflow-bg') || 'default';
        
        // Independent Rain Color (Defaults to Matrix Green if not set)
        this.customRainColor = localStorage.getItem('matrix-coverflow-rain-color') || '#00ff41';
        
        // Rain Speed (Lower is faster, stored in ms delay)
        this.rainSpeed = parseInt(localStorage.getItem('matrix-coverflow-rain-speed')) || 50;

        // Rounding Engine Settings
        this.enableRounding = localStorage.getItem('matrix-coverflow-rounding') === 'true';
        this.coverRadius = parseFloat(localStorage.getItem('matrix-coverflow-radius')) || 0.3;

        // Reflection Settings (Default to true)
        this.enableReflections = localStorage.getItem('matrix-coverflow-reflections') !== 'false';

        this.uiColor = new THREE.Color();
        this.bgGradient = 'none';

        // Generate the soft neon glow texture
        this.glowTexture = this.generateGlowTexture();

        this.createContainer();
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.meshes = [];
        this.currentIndex = 0;
        
        // Camera Targets
        this.targetCameraX = 0;
        this.targetCameraY = 1;
        this.targetCameraZ = 14;

        this.isActive = false;

        // Rain animation timing
        this.lastRainDraw = Date.now();
        
        // Gamepad State
        this.gamepadIndex = null;
        this.gpButtonDown = false;
        this.gpStickMoved = 0;

        // --- ⚙️ CONFIGURATION MAP ---
        this.systemMap = [
            { id: 'psx', arrayName: 'PSX_ROMS', coverPath: 'Emulators/psx/covers/', btnId: 'btn-psx' },
            { id: 'snes', arrayName: 'SNES_ROMS', coverPath: 'Emulators/snes/covers/', btnId: 'btn-snes' },
            { id: 'nes', arrayName: 'NES_ROMS', coverPath: 'Emulators/nes/covers/', btnId: 'btn-nes' },
            { id: 'genesis', arrayName: 'GEN_ROMS', coverPath: 'Emulators/genesis/covers/', btnId: 'btn-genesis' },
            { id: 'gba', arrayName: 'GBA_ROMS', coverPath: 'Emulators/gba/covers/', btnId: 'btn-gba' },
            { id: 'sms', arrayName: 'SMS_ROMS', coverPath: 'Emulators/sms/covers/', btnId: 'btn-sms' },
            { id: 'gbc', arrayName: 'GBC_ROMS', coverPath: 'Emulators/gbc/covers/', btnId: 'btn-gbc' }
        ];

        this.init();
        this.updateThemeColors(); // Apply colors on initial boot
    }

    // Safely retrieves your global UI Color from Settings/Storage/CSS
    getThemeColorString() {
        let colorStr = localStorage.getItem('themeColor') || localStorage.getItem('matrixColor');
        if (!colorStr && typeof window.themeColor !== 'undefined') colorStr = window.themeColor;
        
        if (!colorStr) {
            const rootStyles = getComputedStyle(document.documentElement);
            colorStr = rootStyles.getPropertyValue('--theme-color').trim() || 
                       rootStyles.getPropertyValue('--matrix-color').trim();
        }
        return colorStr || '#00f2ff'; // Fallback cyan
    }

    updateThemeColors() {
        this.uiColorStr = this.getThemeColorString();
        this.uiColor.set(this.uiColorStr);
        
        // Pass the color into CSS so the sidebar instantly syncs
        if (this.container) {
            this.container.style.setProperty('--cf-theme', this.uiColorStr);
        }

        // Generate dynamic background gradient synced to UI theme (20% opacity tint)
        try {
            const r = Math.round(this.uiColor.r * 255);
            const g = Math.round(this.uiColor.g * 255);
            const b = Math.round(this.uiColor.b * 255);
            this.bgGradient = `radial-gradient(circle, rgba(${r}, ${g}, ${b}, 0.2) 0%, rgba(0,0,0,1) 100%)`;
            if (this.currentBg === 'default' && this.container) {
                this.container.style.backgroundImage = this.bgGradient;
            }
        } catch(e) {
            this.bgGradient = 'none';
        }

        // Live-update the 3D Glows and Borders
        this.meshes.forEach(mesh => {
            mesh.children.forEach(child => {
                if (child.userData.isGlow || child.userData.isBorder) {
                    child.material.color.set(this.uiColor);
                }
            });
        });
    }

    generateGlowTexture() {
        // Creates a highly diffused shadow map to replace the "block frame" look
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 45; // Soft blur radius
        ctx.fillStyle = '#ffffff';
        
        // Draw the rectangle multiple times to make the core opaque and the glow intense
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(151, 106, 210, 300);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createContainer() {
        // Inject the full-screen overlay dynamically
        this.container = document.createElement('div');
        this.container.id = 'matrix-coverflow-container';
        this.container.style.cssText = `
            display: none; position: fixed; top: 0; left: 0; 
            width: 100vw; height: 100vh; z-index: 9999; 
            background-color: #000000;
            opacity: 0; transition: opacity 0.4s ease-in-out;
            overflow: hidden;
        `;

        // 2D Matrix Rain Canvas (z-index 10000, sits under ThreeJS)
        this.rainCanvas = document.createElement('canvas');
        this.rainCanvas.id = 'zion-rain-canvas';
        this.rainCanvas.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000;
        `;
        this.rainCtx = this.rainCanvas.getContext('2d');
        this.MATRIX_ALPHABET = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
        this.fontSize = 16;
        this.zionDrops = [];
        this.container.appendChild(this.rainCanvas);

        document.body.appendChild(this.container);
        this.resizeRain();
        
        this.createSidebar(); 
        this.applyBackgroundStyle(); 
    }

    createSidebar() {
        this.sidebar = document.createElement('div');
        this.sidebar.id = 'coverflow-sidebar';
        
        // We use var(--cf-theme) so the entire DOM updates the second the root variable changes!
        const themeCol = 'var(--cf-theme)';
        
        this.sidebar.style.cssText = `
            position: absolute; left: -450px; top: 0; width: 450px; height: 100%;
            background: rgba(0, 0, 0, 0.9);
            border-right: 1px solid ${themeCol};
            box-shadow: 0 0 10px ${themeCol};
            z-index: 10002;
            transition: left 0.3s ease;
            display: flex; flex-direction: row;
            box-sizing: border-box; color: ${themeCol};
            font-family: 'Orbitron', 'Courier New', sans-serif;
        `;

        const trigger = document.createElement('div');
        trigger.style.cssText = `
            position: absolute; right: -30px; top: 0; width: 30px; height: 100%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            background: transparent; z-index: 10003;
        `;
        
        const indicator = document.createElement('div');
        indicator.textContent = '▶'; // Replaced innerHTML unicode with direct character for textContent
        indicator.style.cssText = `color: ${themeCol}; text-shadow: 0 0 5px ${themeCol}; opacity: 0.5; transition: 0.3s; font-size: 1.5rem;`;
        trigger.appendChild(indicator);

        this.sidebar.addEventListener('mouseenter', () => {
            this.sidebar.style.left = '0';
            indicator.style.opacity = '0';
        });
        this.sidebar.addEventListener('mouseleave', () => {
            this.sidebar.style.left = '-450px';
            indicator.style.opacity = '0.5';
        });

        const navCol = document.createElement('div');
        navCol.style.cssText = `
            width: 150px; border-right: 1px solid rgba(255,255,255,0.1); 
            display: flex; flex-direction: column; padding-top: 20px;
        `;
        
        // --- TAB CREATION HELPERS ---
        const createTabBtn = (id, text, active = false) => {
            const btn = document.createElement('div');
            btn.className = 'cf-tab-btn';
            btn.setAttribute('data-target', id);
            btn.textContent = text;
            btn.style.cssText = `
                padding: 15px 10px; cursor: pointer; text-transform: uppercase; font-size: 0.85rem;
                font-weight: bold; transition: 0.2s; background: ${active ? 'rgba(255,255,255,0.1)' : 'transparent'};
                border-left: 3px solid ${active ? themeCol : 'transparent'};
            `;
            return btn;
        };

        const tabCoverBtn = createTabBtn('cf-tab-coverflow', 'Coverflow', true);
        const tabBgBtn = createTabBtn('cf-tab-backgrounds', 'Backgrounds', false);
        const tabCoversBtn = createTabBtn('cf-tab-covers', 'Covers', false);

        // --- SPLIT BUTTONS: SAVE & EXIT ---
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = `
            margin-top: auto; padding: 0 10px 25px 10px; display: flex; gap: 10px;
        `;

        const baseBtnStyle = `
            flex: 1; background: rgba(0, 0, 0, 0.8); border: 1px solid ${themeCol}; 
            color: ${themeCol}; padding: 12px 0; cursor: pointer; 
            text-transform: uppercase; font-family: inherit; font-weight: bold; 
            font-size: 0.8rem; letter-spacing: 1px; box-shadow: 0 0 5px ${themeCol}; 
            transition: all 0.2s ease; text-align: center;
        `;

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.style.cssText = baseBtnStyle;
        
        const exitBtn = document.createElement('button');
        exitBtn.textContent = 'Exit';
        exitBtn.style.cssText = baseBtnStyle;

        // Hover effects
        [saveBtn, exitBtn].forEach(btn => {
            btn.addEventListener('mouseover', () => { btn.style.background = themeCol; btn.style.color = 'black'; });
            btn.addEventListener('mouseout', () => { btn.style.background = 'rgba(0, 0, 0, 0.8)'; btn.style.color = themeCol; });
        });

        btnContainer.appendChild(saveBtn);
        btnContainer.appendChild(exitBtn);

        navCol.appendChild(tabCoverBtn);
        navCol.appendChild(tabBgBtn);
        navCol.appendChild(tabCoversBtn);
        navCol.appendChild(btnContainer);

        const contentCol = document.createElement('div');
        contentCol.style.cssText = `
            flex: 1; display: flex; flex-direction: column; padding: 25px; position: relative; overflow-y: auto;
        `;
        
        // --- DOM CONSTRUCTION FOR PANELS (REPLACES INNERHTML) ---
        
        // Helper: Create Header
        const createPanelHeader = (text) => {
            const h2 = document.createElement('h2');
            h2.textContent = text;
            h2.style.cssText = `font-size: 1.1rem; margin-top: 0; border-bottom: 1px solid ${themeCol}; padding-bottom: 10px; text-transform: uppercase; text-shadow: 0 0 5px ${themeCol}; letter-spacing: 2px;`;
            return h2;
        };

        // Helper: Create Radio Option
        const createRadioOption = (name, value, labelText, checked) => {
            const label = document.createElement('label');
            label.style.cssText = "display: flex; align-items: center; margin-bottom: 15px; cursor: pointer; font-size: 0.85rem;";
            
            const input = document.createElement('input');
            input.type = "radio";
            input.name = name;
            input.value = value;
            if(checked) input.checked = true;
            input.style.cssText = `accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);`;
            
            label.appendChild(input);
            label.appendChild(document.createTextNode(labelText));
            return label;
        };

        // 1. STYLE TAB
        const panelStyle = document.createElement('div');
        panelStyle.id = "cf-tab-coverflow";
        panelStyle.className = "cf-tab-panel";
        panelStyle.style.cssText = "display: flex; flex-direction: column; height: 100%;";
        panelStyle.appendChild(createPanelHeader("Coverflow Style"));

        const styleContainer = document.createElement('div');
        styleContainer.style.marginTop = "25px";
        const styles = [
            {v: 'aurora', l: 'Aurora (Curved)'},
            {v: 'linear', l: 'Linear (Flat)'},
            {v: 'grid', l: 'Grid View (6 Columns)'},
            {v: 'carousel', l: 'Carousel (Circular)'},
            {v: 'wheel', l: 'Ferris Wheel'},
            {v: 'rolodex', l: 'Rolodex'},
            {v: 'pyramid', l: 'Pyramid'},
            {v: 'flock', l: 'Flock (Organic)'},
            {v: 'spiral', l: 'Spiral (Helix)'}
        ];
        styles.forEach(s => {
            styleContainer.appendChild(createRadioOption('cf-style', s.v, s.l, this.currentStyle === s.v));
        });
        panelStyle.appendChild(styleContainer);
        contentCol.appendChild(panelStyle);

        // 2. BACKGROUNDS TAB
        const panelBg = document.createElement('div');
        panelBg.id = "cf-tab-backgrounds";
        panelBg.className = "cf-tab-panel";
        panelBg.style.cssText = "display: none; flex-direction: column; height: 100%;";
        panelBg.appendChild(createPanelHeader("Environment"));

        const bgContainer = document.createElement('div');
        bgContainer.style.marginTop = "25px";

        // Default Background Radio
        bgContainer.appendChild(createRadioOption('cf-bg', 'default', 'Default (Theme Gradient)', this.currentBg === 'default'));
        
        // Rain Background Radio Row (with color picker)
        const rainRow = document.createElement('div');
        rainRow.style.cssText = "display: flex; align-items: center; margin-bottom: 5px;";
        
        const rainLabel = document.createElement('label');
        rainLabel.style.cssText = "display: flex; align-items: center; cursor: pointer; font-size: 0.85rem; margin-right: 10px;";
        const rainInput = document.createElement('input');
        rainInput.type = "radio";
        rainInput.name = "cf-bg";
        rainInput.value = "rain";
        if(this.currentBg === 'rain') rainInput.checked = true;
        rainInput.style.cssText = `accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);`;
        rainLabel.appendChild(rainInput);
        rainLabel.appendChild(document.createTextNode("Zion Matrix Rain"));
        rainRow.appendChild(rainLabel);

        // Rain Color Picker
        const colorPicker = document.createElement('input');
        colorPicker.type = "color";
        colorPicker.id = "cf-rain-color-picker";
        colorPicker.value = this.customRainColor;
        colorPicker.style.cssText = `background: transparent; border: 1px solid ${themeCol}; height: 25px; width: 40px; cursor: pointer; padding: 0;`;
        rainRow.appendChild(colorPicker);
        bgContainer.appendChild(rainRow);

        // Rain Speed Slider
        const speedContainer = document.createElement('div');
        speedContainer.id = "cf-rain-speed-container";
        speedContainer.style.cssText = "margin-left: 28px; margin-bottom: 20px; opacity: 0.5; transition: opacity 0.3s;";

        const speedLabelRow = document.createElement('div');
        speedLabelRow.style.cssText = "display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 5px;";
        const spLabel = document.createElement('span');
        spLabel.textContent = "SPEED";
        const spVal = document.createElement('span');
        spVal.id = "cf-rain-speed-val";
        spVal.textContent = this.rainSpeed + "ms";
        speedLabelRow.appendChild(spLabel);
        speedLabelRow.appendChild(spVal);

        const speedSlider = document.createElement('input');
        speedSlider.type = "range";
        speedSlider.id = "cf-rain-speed-slider";
        speedSlider.min = "10";
        speedSlider.max = "200";
        speedSlider.step = "5";
        speedSlider.value = this.rainSpeed;
        speedSlider.style.cssText = `width: 100%; accent-color: ${themeCol}; cursor: pointer;`;

        speedContainer.appendChild(speedLabelRow);
        speedContainer.appendChild(speedSlider);
        bgContainer.appendChild(speedContainer);
        
        panelBg.appendChild(bgContainer);
        contentCol.appendChild(panelBg);

        // 3. COVERS TAB (Rounding & Reflections)
        const panelCovers = document.createElement('div');
        panelCovers.id = "cf-tab-covers";
        panelCovers.className = "cf-tab-panel";
        panelCovers.style.cssText = "display: none; flex-direction: column; height: 100%;";
        panelCovers.appendChild(createPanelHeader("Cover Geometry"));

        const coverContainer = document.createElement('div');
        coverContainer.style.marginTop = "25px";

        // Rounding Toggle
        const roundLabel = document.createElement('label');
        roundLabel.style.cssText = "display: flex; align-items: center; margin-bottom: 20px; cursor: pointer; font-size: 0.85rem;";
        const roundInput = document.createElement('input');
        roundInput.type = "checkbox";
        roundInput.id = "cf-rounding-toggle";
        if(this.enableRounding) roundInput.checked = true;
        roundInput.style.cssText = `accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);`;
        roundLabel.appendChild(roundInput);
        roundLabel.appendChild(document.createTextNode("Enable Rounded Corners"));
        coverContainer.appendChild(roundLabel);

        // Reflection Toggle
        const reflectLabel = document.createElement('label');
        reflectLabel.style.cssText = "display: flex; align-items: center; margin-bottom: 20px; cursor: pointer; font-size: 0.85rem;";
        const reflectInput = document.createElement('input');
        reflectInput.type = "checkbox";
        reflectInput.id = "cf-reflection-toggle";
        if(this.enableReflections) reflectInput.checked = true;
        reflectInput.style.cssText = `accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);`;
        reflectLabel.appendChild(reflectInput);
        reflectLabel.appendChild(document.createTextNode("Reflections"));
        coverContainer.appendChild(reflectLabel);

        // Radius Slider
        const radiusLabel = document.createElement('label');
        radiusLabel.style.cssText = "font-size: 0.8rem; text-transform: uppercase; margin-bottom: 8px; display: block;";
        radiusLabel.textContent = "Corner Radius";
        coverContainer.appendChild(radiusLabel);

        const radiusSlider = document.createElement('input');
        radiusSlider.type = "range";
        radiusSlider.id = "cf-radius-slider";
        radiusSlider.min = "0";
        radiusSlider.max = "0.5";
        radiusSlider.step = "0.05";
        radiusSlider.value = this.coverRadius;
        radiusSlider.style.cssText = `width: 100%; accent-color: ${themeCol}; margin-bottom: 10px;`;
        coverContainer.appendChild(radiusSlider);

        panelCovers.appendChild(coverContainer);
        contentCol.appendChild(panelCovers);

        this.sidebar.appendChild(navCol);
        this.sidebar.appendChild(contentCol);
        this.sidebar.appendChild(trigger);
        this.container.appendChild(this.sidebar);

        // --- TAB LOGIC ---
        const allTabs = this.sidebar.querySelectorAll('.cf-tab-btn');
        const allPanels = this.sidebar.querySelectorAll('.cf-tab-panel');
        allTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                allTabs.forEach(t => {
                    t.style.background = 'transparent';
                    t.style.borderLeftColor = 'transparent';
                });
                allPanels.forEach(p => p.style.display = 'none');
                
                tab.style.background = 'rgba(255,255,255,0.1)';
                tab.style.borderLeftColor = themeCol;
                document.getElementById(tab.getAttribute('data-target')).style.display = 'flex';
            });
        });

        // --- INPUT LISTENERS ---
        // Style Radios
        const styleRadios = this.sidebar.querySelectorAll('input[name="cf-style"]');
        styleRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.currentStyle = e.target.value);
            if(radio.value === this.currentStyle) radio.checked = true;
        });

        // Bg Radios
        const bgRadios = this.sidebar.querySelectorAll('input[name="cf-bg"]');
        const rainSpeedContainer = document.getElementById('cf-rain-speed-container');
        
        const updateRainUI = (val) => {
             if (val === 'rain') {
                 rainSpeedContainer.style.opacity = '1';
                 rainSpeedContainer.style.pointerEvents = 'auto';
             } else {
                 rainSpeedContainer.style.opacity = '0.3';
                 rainSpeedContainer.style.pointerEvents = 'none';
             }
        };

        bgRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentBg = e.target.value;
                this.applyBackgroundStyle();
                updateRainUI(this.currentBg);
            });
            if(radio.value === this.currentBg) radio.checked = true;
        });
        
        // Init Rain UI state
        updateRainUI(this.currentBg);

        // Rain Color
        const rainPicker = document.getElementById('cf-rain-color-picker');
        rainPicker.addEventListener('input', (e) => {
            this.customRainColor = e.target.value;
        });

        // Rain Speed Slider
        const rainSpeedSlider = document.getElementById('cf-rain-speed-slider');
        const rainSpeedVal = document.getElementById('cf-rain-speed-val');
        rainSpeedSlider.addEventListener('input', (e) => {
            this.rainSpeed = parseInt(e.target.value);
            rainSpeedVal.textContent = this.rainSpeed + 'ms';
        });

        // Rounding & Reflection (Live Update)
        const roundToggle = document.getElementById('cf-rounding-toggle');
        const reflectToggle = document.getElementById('cf-reflection-toggle');
        // const radiusSlider already defined above, but we get by ID to be safe if moved
        const radiusSliderEl = document.getElementById('cf-radius-slider');
        
        const updateGeometry = () => {
            this.enableRounding = roundToggle.checked;
            this.enableReflections = reflectToggle.checked;
            this.coverRadius = parseFloat(radiusSliderEl.value);
            this.buildGallery(); // Re-generate meshes on the fly
        };

        roundToggle.addEventListener('change', updateGeometry);
        reflectToggle.addEventListener('change', updateGeometry);
        radiusSliderEl.addEventListener('input', updateGeometry);

        // --- BUTTON ACTIONS ---
        saveBtn.addEventListener('click', () => {
            localStorage.setItem('matrix-coverflow-style', this.currentStyle);
            localStorage.setItem('matrix-coverflow-bg', this.currentBg);
            localStorage.setItem('matrix-coverflow-rain-color', this.customRainColor);
            localStorage.setItem('matrix-coverflow-rain-speed', this.rainSpeed);
            localStorage.setItem('matrix-coverflow-rounding', this.enableRounding);
            localStorage.setItem('matrix-coverflow-radius', this.coverRadius);
            localStorage.setItem('matrix-coverflow-reflections', this.enableReflections);
            
            // Visual feedback
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'SAVED';
            setTimeout(() => saveBtn.textContent = originalText, 1000);
        });

        exitBtn.addEventListener('click', () => {
            this.close();
        });
    }

    applyBackgroundStyle() {
        if (this.currentBg === 'default') {
            this.rainCanvas.style.display = 'none';
            this.container.style.backgroundColor = '#000000';
            this.container.style.backgroundImage = this.bgGradient;
        } else {
            this.rainCanvas.style.display = 'block';
            this.container.style.backgroundColor = '#000000';
            this.container.style.backgroundImage = 'none';
        }
    }

    resizeRain() {
        if (!this.rainCanvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        this.rainCanvas.width = window.innerWidth * dpr;
        this.rainCanvas.height = window.innerHeight * dpr;
        
        this.rainCanvas.style.width = window.innerWidth + 'px';
        this.rainCanvas.style.height = window.innerHeight + 'px';
        
        this.rainCtx.scale(dpr, dpr);

        const columns = window.innerWidth / (this.fontSize * 0.6);
        this.zionDrops = [];
        // Initialize drops at random Y positions so rain is already filling the screen
        for (let x = 0; x < columns; x++) {
            this.zionDrops[x] = Math.floor(Math.random() * (window.innerHeight / this.fontSize));
        }
    }

    drawZionRain() {
        if (this.currentBg !== 'rain' || !this.isActive) return;
        const ctx = this.rainCtx;
        
        // Fix: Adjusted opacity to 0.25 to extend trail length while preventing ghosting grid
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        
        // USE INDEPENDENT RAIN COLOR HERE
        ctx.fillStyle = this.customRainColor; 
        
        ctx.font = `normal ${this.fontSize}px 'Courier New', monospace`; 
        const columnSpacing = this.fontSize * 0.6;

        for (let i = 0; i < this.zionDrops.length; i++) {
            const text = this.MATRIX_ALPHABET.charAt(Math.floor(Math.random() * this.MATRIX_ALPHABET.length));
            ctx.globalAlpha = 0.3 + (Math.random() * 0.7);
            ctx.fillText(text, i * columnSpacing, this.zionDrops[i] * this.fontSize);
            
            if (this.zionDrops[i] * this.fontSize > window.innerHeight && Math.random() > 0.975) {
                this.zionDrops[i] = 0;
            }
            this.zionDrops[i]++;
        }
        ctx.globalAlpha = 1.0;
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        this.renderer.domElement.style.position = 'relative';
        this.renderer.domElement.style.zIndex = '10001'; 
        
        this.container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        const spotLight = new THREE.SpotLight(0xffffff, 1.2);
        spotLight.position.set(0, 15, 10);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.5;
        this.scene.add(spotLight);

        this.camera.position.set(0, 1, 14);

        this.addEventListeners();
    }

    buildGallery() {
        // Clear existing meshes to allow live geometry updates
        this.meshes.forEach(m => this.scene.remove(m));
        this.meshes = [];
        let xOffset = 0;

        this.systemMap.forEach(system => {
            const romArray = window[system.arrayName];
            
            if (romArray && Array.isArray(romArray)) {
                romArray.forEach(romFileName => {
                    this.createCoverMesh(romFileName, system, xOffset);
                    xOffset += 5.5; 
                });
            }
        });

        if (this.meshes.length > 0) this.currentIndex = 0;
    }

    // --- NEW GEOMETRY GENERATOR ---
    getCoverGeometry(width, height) {
        if (!this.enableRounding || this.coverRadius <= 0) {
            return new THREE.PlaneGeometry(width, height);
        }

        const shape = new THREE.Shape();
        const x = -width / 2;
        const y = -height / 2;
        const radius = this.coverRadius;

        shape.moveTo(x, y + radius);
        shape.lineTo(x, y + height - radius);
        shape.quadraticCurveTo(x, y + height, x + radius, y + height);
        shape.lineTo(x + width - radius, y + height);
        shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
        shape.lineTo(x + width, y + radius);
        shape.quadraticCurveTo(x + width, y, x + width - radius, y);
        shape.lineTo(x + radius, y);
        shape.quadraticCurveTo(x, y, x, y + radius);

        const geometry = new THREE.ShapeGeometry(shape);

        // Fix UV Mapping for Shapes to allow texture to cover perfectly
        const posAttribute = geometry.attributes.position;
        const uvAttribute = geometry.attributes.uv;
        
        for (let i = 0; i < posAttribute.count; i++) {
            const px = posAttribute.getX(i);
            const py = posAttribute.getY(i);
            const u = (px + width / 2) / width;
            const v = (py + height / 2) / height;
            uvAttribute.setXY(i, u, v);
        }
        
        return geometry;
    }

    createCoverMesh(romFileName, system, xPos) {
        const cleanName = romFileName.replace(/\.(chd|bin|iso|img|smc|sfc|nes|md|smd|gen|gba|gb|gbc|sms)$/i, '').toLowerCase();
        const coverUrl = chrome.runtime.getURL(`${system.coverPath}${cleanName}.jpg`);

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(coverUrl);

        // Use the dynamic geometry generator
        const geometry = this.getCoverGeometry(3.5, 5);
        const material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { system: system.id, romValue: romFileName, btnId: system.btnId, baseX: xPos };

        // --- CSS MATCH: 1px Solid Border ---
        const borderGeo = new THREE.EdgesGeometry(geometry); // Edges follow the shape perfectly
        const borderMat = new THREE.LineBasicMaterial({ 
            color: this.uiColor, 
            transparent: true, 
            opacity: 0.0 
        });
        const borderMesh = new THREE.LineSegments(borderGeo, borderMat);
        borderMesh.userData = { isBorder: true };
        mesh.add(borderMesh);

        // --- CSS MATCH: Diffused Texture Glow ---
        // Glow is kept rectangular for performance, behind the mesh.
        const glowGeo = new THREE.PlaneGeometry(8.5, 8.5); 
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: this.uiColor, 
            transparent: true, 
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: this.glowTexture
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.set(0, 0, -0.05); // Just behind the cover
        glowMesh.userData = { isGlow: true };
        mesh.add(glowMesh);

        // --- AURORA REFLECTION FLOOR ---
        if (this.enableReflections) {
            const reflectionMat = new THREE.MeshStandardMaterial({ 
                map: texture, opacity: 0.15, transparent: true, side: THREE.DoubleSide 
            });
            const reflection = new THREE.Mesh(geometry, reflectionMat);
            reflection.position.set(0, -5.1, 0); 
            reflection.rotation.x = Math.PI;
            // Invert scale Y for reflection if it's a shape, though rotation handles it mostly.
            mesh.add(reflection);
        }

        this.scene.add(mesh);
        this.meshes.push(mesh);
    }

    close() {
        this.container.style.opacity = '0';
        setTimeout(() => { 
            this.container.style.display = 'none'; 
            this.isActive = false;
        }, 400);
    }

    launchGame(data) {
        this.close();

        const emulatorBtn = document.getElementById(data.btnId);
        if (emulatorBtn) {
            emulatorBtn.click();

            let attempts = 0;
            const checkExist = setInterval(() => {
                attempts++;
                const dropdown = document.getElementById(`${data.system}-rom-select`);
                
                if (dropdown) {
                    dropdown.value = data.romValue;
                    if (typeof dropdown.onchange === 'function') {
                        dropdown.onchange();
                    } else {
                        dropdown.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    
                    clearInterval(checkExist);
                } else if (attempts > 20) {
                    clearInterval(checkExist); 
                }
            }, 100);
        }
    }

    addEventListeners() {
        window.addEventListener('click', (e) => {
            if (!this.isActive) return;
            
            // Ignore clicks inside sidebar
            if (this.sidebar && this.sidebar.contains(e.target)) return;

            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);

            const intersects = this.raycaster.intersectObjects(this.meshes, true);
            if (intersects.length > 0) {
                let clickedMesh = intersects[0].object;
                if (clickedMesh.userData.isGlow || clickedMesh.userData.isBorder) clickedMesh = clickedMesh.parent;
                if (!clickedMesh.userData.baseX && clickedMesh.parent) clickedMesh = clickedMesh.parent;

                // In GRID mode, verify Y distance too to prevent accidental clicks on other rows
                const isGrid = this.currentStyle === 'grid';
                let validClick = false;
                
                if (isGrid) {
                    // For grid, we just rely on raycaster logic as objects are physically moved
                    validClick = true; 
                } else {
                     if (Math.abs(clickedMesh.userData.baseX - this.camera.position.x) < 1) validClick = true;
                }

                if (validClick) {
                     // Check if it's the current selected one to launch
                    if (this.meshes.indexOf(clickedMesh) === this.currentIndex) {
                         this.launchGame(clickedMesh.userData);
                    } else {
                         this.currentIndex = this.meshes.indexOf(clickedMesh);
                    }
                }
            }
        });

        window.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            if (e.key === "ArrowRight") this.navigate(1);
            if (e.key === "ArrowLeft") this.navigate(-1);
            
            // Grid Navigation Support
            if (this.currentStyle === 'grid') {
                if (e.key === "ArrowUp") this.navigate(-6);
                if (e.key === "ArrowDown") this.navigate(6);
            }

            if (e.key === "Enter" && this.meshes.length > 0) {
                this.launchGame(this.meshes[this.currentIndex].userData);
            }
            if (e.key === "Escape") this.close();
        });

        window.addEventListener('wheel', (e) => {
            if (!this.isActive) return;
            if (e.deltaY > 0) this.navigate(1);
            else this.navigate(-1);
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.resizeRain();
        });

        // --- GAMEPAD LISTENERS ---
        window.addEventListener("gamepadconnected", (e) => {
            this.gamepadIndex = e.gamepad.index;
            console.log(`Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}.`);
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    }

    pollGamepad() {
        if (!this.isActive || this.gamepadIndex === null) return;
        
        const gp = navigator.getGamepads()[this.gamepadIndex];
        if (!gp) return;

        const now = Date.now();
        // Throttle movement to prevent super-fast scrolling
        if (now - this.gpStickMoved > 150) { 
            // Axis 0: Horizontal (Standard)
            if (gp.axes[0] > 0.5) {
                this.navigate(1);
                this.gpStickMoved = now;
            } else if (gp.axes[0] < -0.5) {
                this.navigate(-1);
                this.gpStickMoved = now;
            }
            
            // Axis 1: Vertical (Grid Mode Only)
            if (this.currentStyle === 'grid') {
                 if (gp.axes[1] > 0.5) {
                    this.navigate(6);
                    this.gpStickMoved = now;
                 } else if (gp.axes[1] < -0.5) {
                    this.navigate(-6);
                    this.gpStickMoved = now;
                 }
            }
        }

        // --- BUTTONS ---
        // Button 0 (A/Cross) to Select
        if (gp.buttons[0].pressed) {
            if (!this.gpButtonDown) {
                this.gpButtonDown = true;
                if (this.meshes.length > 0) {
                    this.launchGame(this.meshes[this.currentIndex].userData);
                }
            }
        } 
        // Button 1 (B/Circle) to Close
        else if (gp.buttons[1].pressed) {
            if (!this.gpButtonDown) {
                this.gpButtonDown = true;
                this.close();
            }
        } 
        else {
            this.gpButtonDown = false;
        }
    }

    navigate(dir) {
        if (this.meshes.length === 0) return;
        this.currentIndex = Math.max(0, Math.min(this.currentIndex + dir, this.meshes.length - 1));
    }

    open() {
        // ALWAYS update the theme colors before showing so settings take instant effect!
        this.updateThemeColors(); 

        this.buildGallery(); 
        this.container.style.display = 'block';
        
        // Re-randomize rain drops on open so it looks active
        if (this.currentBg === 'rain') this.resizeRain();

        setTimeout(() => { 
            this.container.style.opacity = '1'; 
            this.isActive = true;
            this.animate(); 
        }, 50);
    }

    animate() {
        if (!this.isActive) return;
        requestAnimationFrame(() => this.animate());

        // Gamepad Input Check
        this.pollGamepad();

        // Process Rain Animation Framerate using INDEPENDENT Local Slider (this.rainSpeed)
        const now = Date.now();
        if (this.currentBg === 'rain' && now - this.lastRainDraw > this.rainSpeed) {
            this.drawZionRain();
            this.lastRainDraw = now;
        }

        if (this.meshes.length > 0) {
            
            // --- CAMERA LOGIC ---
            if (this.currentStyle === 'grid') {
                // Grid View: Camera X fixed at 0. Camera Y moves down rows. Camera Z pulled back.
                const row = Math.floor(this.currentIndex / 6);
                const spacingY = 5.5; 
                this.targetCameraX = 0;
                this.targetCameraY = -(row * spacingY); 
                this.targetCameraZ = 32; // Pull back to see grid width
            } else {
                // Standard Views: Camera follows mesh X. Y/Z fixed standard.
                this.targetCameraX = this.meshes[this.currentIndex].userData.baseX;
                this.targetCameraY = 1;
                this.targetCameraZ = 14;
            }

            // Smooth Camera Movement (Lerping all axes)
            this.camera.position.x += (this.targetCameraX - this.camera.position.x) * 0.1;
            this.camera.position.y += (this.targetCameraY - this.camera.position.y) * 0.1;
            this.camera.position.z += (this.targetCameraZ - this.camera.position.z) * 0.1;

            // --- MESH LOGIC ---
            this.meshes.forEach((mesh, i) => {
                const dist = mesh.userData.baseX - (this.currentStyle === 'grid' ? 0 : this.camera.position.x);
                
                // RESET defaults
                mesh.visible = true; // IMPORTANT: Reset visibility every frame to prevent stuck invisible items
                let targetY = 0;
                let targetZ = 0;
                let targetRotX = 0;
                let targetRotY = 0;
                let targetRotZ = 0;

                // Base separation factor used for normalizations
                const spacing = 5.5; 

                if (this.currentStyle === 'aurora') {
                    mesh.position.x = mesh.userData.baseX;
                    targetZ = -Math.abs(dist) * 0.8;
                    targetRotY = -dist * 0.15;
                } 
                else if (this.currentStyle === 'linear') {
                    mesh.position.x = mesh.userData.baseX;
                    targetZ = (i === this.currentIndex) ? 0.5 : 0;
                } 
                else if (this.currentStyle === 'grid') {
                    // 6 Column Grid Logic
                    const col = i % 6;
                    const row = Math.floor(i / 6);
                    
                    const spacingX = 4.2;
                    const spacingY = 5.5;

                    // Calculate X: Center 6 columns around 0
                    // Columns 0-5. Center is between 2 and 3. (col - 2.5)
                    mesh.position.x = (col - 2.5) * spacingX;
                    
                    // Calculate Y: Rows stack downwards
                    targetY = -(row * spacingY);
                    
                    // Flat Z, no rotation
                    targetZ = 0;
                    targetRotX = 0;
                    targetRotY = 0;
                    targetRotZ = 0;
                }
                else if (this.currentStyle === 'carousel') {
                    // Fixed Carousel: Uses strictly index-based spacing to prevent clumping.
                    const normalized = dist / spacing; 
                    const angle = normalized * 0.5; // Spread factor
                    
                    mesh.position.x = this.camera.position.x + Math.sin(angle) * 12;
                    targetZ = Math.cos(angle) * 12 - 12; 
                    targetRotY = angle;
                }
                else if (this.currentStyle === 'wheel') {
                    // Vertical Ferris Wheel (Fixed Ghosting)
                    const normalized = dist / spacing;
                    const angle = normalized * 0.4;
                    const radius = 13;

                    mesh.position.x = this.camera.position.x; // Lock X to center
                    targetY = -Math.sin(angle) * radius;
                    
                    // Main circle geometry
                    targetZ = Math.cos(angle) * radius - radius;
                    
                    // FIX: Strong Z-decay based on distance from center (Spiral effect)
                    // This physically pushes non-active/wrapped items deep into the background
                    targetZ -= Math.abs(normalized) * 1.5; 

                    targetRotX = angle;

                    // FIX: Visibility Culling
                    // If items wrap around the back (approx > 270 deg), hide them completely
                    // to prevent them from rendering through the active front items.
                    if (Math.abs(normalized) > 9) {
                        mesh.visible = false;
                    }
                }
                else if (this.currentStyle === 'rolodex') {
                    // Deep Rolodex / Star Wars Scroll Style
                    const normalized = dist / spacing;
                    mesh.position.x = this.camera.position.x + (normalized * 2.5); // Tighter X
                    targetY = -Math.abs(normalized) * 1.5; // Arch downwards
                    targetZ = -Math.abs(normalized) * 3; // Recede deep
                    targetRotY = 0;
                }
                else if (this.currentStyle === 'pyramid') {
                     const normalized = dist / spacing;
                     mesh.position.x = mesh.userData.baseX;
                     targetY = -Math.abs(normalized) * 2; // Stack upwards/downwards
                     targetZ = -Math.abs(normalized) * 2; // Recede
                }
                else if (this.currentStyle === 'flock') {
                    // Organic "bird flock" wave pattern
                    mesh.position.x = mesh.userData.baseX;
                    targetY = Math.sin(dist * 0.3) * 2.5; 
                    targetZ = Math.cos(dist * 0.3) * 4 - 6; 
                    targetRotX = Math.sin(dist * 0.3) * 0.3; // Tilt with wave
                    targetRotZ = Math.cos(dist * 0.3) * 0.1; // Slight bank
                    // Add slight random offset based on index to feel organic
                    if (i !== this.currentIndex) targetY += (i % 2 === 0 ? 0.5 : -0.5);
                }
                else if (this.currentStyle === 'spiral') {
                    // DNA Helix / Spiral Tube
                    const spiralAngle = dist * 0.2;
                    mesh.position.x = this.camera.position.x + dist; // Move linearly with cam
                    targetY = Math.sin(spiralAngle) * 5;
                    targetZ = Math.cos(spiralAngle) * 5 - 8;
                    targetRotX = spiralAngle; 
                }

                if (mesh.visible) {
                    // Apply calculated transforms with smoothing
                    mesh.position.y += (targetY - mesh.position.y) * 0.1;
                    mesh.position.z += (targetZ - mesh.position.z) * 0.1;
                    
                    // Smooth Rotations
                    mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.1;
                    mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.1;
                    mesh.rotation.z += (targetRotZ - mesh.rotation.z) * 0.1;
                    
                    const targetScale = (i === this.currentIndex) ? 1.05 : 1.0;
                    mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

                    // Smoothly fade the Canvas-Generated Glow and Line Border
                    mesh.children.forEach(child => {
                        if (child.userData.isGlow) {
                            // In GRID mode, glow is always off or subtle, otherwise it looks messy
                            const isGrid = this.currentStyle === 'grid';
                            const targetOpacity = (i === this.currentIndex) ? (isGrid ? 0.4 : 0.7) : 0.0;
                            child.material.opacity += (targetOpacity - child.material.opacity) * 0.15;
                        }
                        if (child.userData.isBorder) {
                            const targetOpacity = (i === this.currentIndex) ? 1.0 : 0.0;
                            child.material.opacity += (targetOpacity - child.material.opacity) * 0.15;
                        }
                    });
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// --- DOCK INTEGRATION ---
document.addEventListener('DOMContentLoaded', () => {
    const dockGamesBtn = document.getElementById('dock-games');
    let coverflowInstance = null;

    if (dockGamesBtn) {
        dockGamesBtn.addEventListener('click', () => {
            if (!coverflowInstance) coverflowInstance = new MatrixCoverflow();
            coverflowInstance.open();
        });
    }
});