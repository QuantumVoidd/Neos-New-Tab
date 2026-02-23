class MatrixCoverflow {
    constructor() {
        // --- 💾 LOAD SETTINGS ---
        this.currentStyle = localStorage.getItem('matrix-coverflow-style') || 'aurora';
        this.currentBg = localStorage.getItem('matrix-coverflow-bg') || 'rain';
        
        // Independent Rain Color (Defaults to Matrix Green if not set)
        this.customRainColor = localStorage.getItem('matrix-coverflow-rain-color') || '#00ff41';
        
        // Rain Speed (Lower is faster, stored in ms delay)
        this.rainSpeed = parseInt(localStorage.getItem('matrix-coverflow-rain-speed')) || 50;

        // Environment Opacity Settings
        this.earthDayCloudOpacity = parseFloat(localStorage.getItem('matrix-coverflow-earth-day-cloud-opacity'));
        if (isNaN(this.earthDayCloudOpacity)) this.earthDayCloudOpacity = 0.8;

        this.earthNightCloudOpacity = parseFloat(localStorage.getItem('matrix-coverflow-earth-night-cloud-opacity'));
        if (isNaN(this.earthNightCloudOpacity)) this.earthNightCloudOpacity = 0.8;

        this.saturnRingOpacity = parseFloat(localStorage.getItem('matrix-coverflow-saturn-ring-opacity'));
        if (isNaN(this.saturnRingOpacity)) this.saturnRingOpacity = 0.9;

        // Rounding Engine Settings
        this.enableRounding = localStorage.getItem('matrix-coverflow-rounding') === 'true';
        this.coverRadius = parseFloat(localStorage.getItem('matrix-coverflow-radius')) || 0.3;

        // Reflection Settings (Default to true)
        this.enableReflections = localStorage.getItem('matrix-coverflow-reflections') !== 'false';

        // Grid Settings
        this.gridColumns = parseInt(localStorage.getItem('matrix-coverflow-grid-cols')) || 6;
        this.gridScale = parseFloat(localStorage.getItem('matrix-coverflow-grid-scale')) || 1.0;

        this.uiColor = new THREE.Color();

        // Generate the soft neon glow texture
        this.glowTexture = this.generateGlowTexture();

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

        // Filter Setup
        this.filters = ['all', ...this.systemMap.map(s => s.id)];
        this.currentFilterIndex = 0;

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

        // Background animation states
        this.lastRainDraw = Date.now();
        this.gridOffset = 0;
        
        // --- 🌍 3D BACKGROUND PROPERTIES ---
        this.starsSkyGroup = null; // Shared stars skybox for planets
        this.starsSkyMesh = null;

        this.earthGroup = null;
        this.earthMesh = null;
        this.earthCloudMesh = null;

        this.earthNightGroup = null;
        this.earthNightMesh = null;
        this.earthNightCloudMesh = null;

        this.sunGroup = null;
        this.sunMesh = null;

        this.moonGroup = null;
        this.moonMesh = null;

        this.marsGroup = null;
        this.marsMesh = null;

        this.jupiterGroup = null;
        this.jupiterMesh = null;

        this.saturnGroup = null;
        this.saturnMesh = null;
        this.saturnRingMesh = null;

        this.neptuneGroup = null;
        this.neptuneMesh = null;

        this.venusGroup = null;
        this.venusMesh = null;

        this.mercuryGroup = null;
        this.mercuryMesh = null;
        
        this.spaceGroup = null;
        this.spaceSkyMesh = null;
        
        // Gamepad State
        this.gamepadIndex = null;
        this.gpButtonDown = false;
        this.gpLBDown = false;
        this.gpRBDown = false;
        this.gpStickMoved = 0;

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
        
        // Pass the color into CSS so the sidebars instantly sync
        if (this.container) {
            this.container.style.setProperty('--cf-theme', this.uiColorStr);
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
        ctx.shadowBlur = 35; 
        ctx.fillStyle = '#ffffff';
        
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

        // Universal Background Canvas (z-index 10000, sits under ThreeJS)
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.id = 'matrix-bg-canvas';
        this.bgCanvas.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; pointer-events: none;
        `;
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.MATRIX_ALPHABET = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
        this.fontSize = 16;
        this.zionDrops = [];
        this.container.appendChild(this.bgCanvas);

        document.body.appendChild(this.container);
        this.resizeBgCanvas();
        
        this.createSidebar(); 
        this.createRightSidebar();
        this.applyBackgroundStyle(); 
    }

    createRightSidebar() {
        this.rightSidebar = document.createElement('div');
        this.rightSidebar.id = 'coverflow-right-sidebar';
        
        const themeCol = 'var(--cf-theme)';
        
        this.rightSidebar.style.cssText = `
            position: absolute; right: -250px; top: 0; width: 250px; height: 100%;
            background: rgba(0, 0, 0, 0.9);
            border-left: 1px solid ${themeCol};
            box-shadow: 0 0 10px ${themeCol};
            z-index: 10002;
            transition: right 0.3s ease;
            display: flex; flex-direction: column; padding: 25px 15px;
            box-sizing: border-box; color: ${themeCol};
            font-family: 'Orbitron', 'Courier New', sans-serif;
            overflow-y: auto;
        `;

        // Independent Trigger anchored to the right screen edge
        const trigger = document.createElement('div');
        trigger.style.cssText = `
            position: absolute; right: 0; top: 0; width: 30px; height: 100%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            background: transparent; z-index: 10003;
        `;
        
        const indicator = document.createElement('div');
        indicator.textContent = '◀';
        indicator.style.cssText = `color: ${themeCol}; text-shadow: 0 0 5px ${themeCol}; opacity: 0.5; transition: 0.3s; font-size: 1.5rem; pointer-events: none;`;
        trigger.appendChild(indicator);

        trigger.addEventListener('mouseenter', () => {
            this.rightSidebar.style.right = '0';
            indicator.style.opacity = '0';
        });
        this.rightSidebar.addEventListener('mouseenter', () => {
            this.rightSidebar.style.right = '0';
            indicator.style.opacity = '0';
        });
        this.rightSidebar.addEventListener('mouseleave', () => {
            this.rightSidebar.style.right = '-250px';
            indicator.style.opacity = '0.5';
        });

        const header = document.createElement('h2');
        header.textContent = "FILTERS";
        header.style.cssText = `font-size: 1.1rem; margin-top: 0; border-bottom: 1px solid ${themeCol}; padding-bottom: 10px; text-transform: uppercase; text-shadow: 0 0 5px ${themeCol}; letter-spacing: 2px; text-align: center;`;
        this.rightSidebar.appendChild(header);

        this.filterContainer = document.createElement('div');
        this.filterContainer.style.cssText = "display: flex; flex-direction: column; gap: 10px; margin-top: 15px;";
        
        this.renderFilterList();

        this.rightSidebar.appendChild(this.filterContainer);

        this.container.appendChild(this.rightSidebar);
        this.container.appendChild(trigger);
    }

    renderFilterList() {
        if (!this.filterContainer) return;
        this.filterContainer.innerHTML = '';
        const themeCol = 'var(--cf-theme)';
        
        this.filters.forEach((filter, index) => {
            const btn = document.createElement('div');
            btn.textContent = filter.toUpperCase();
            const isActive = index === this.currentFilterIndex;
            btn.style.cssText = `
                padding: 10px; cursor: pointer; text-align: center; font-weight: bold;
                border: 1px solid ${isActive ? themeCol : 'transparent'};
                background: ${isActive ? 'rgba(255,255,255,0.1)' : 'transparent'};
                color: ${themeCol}; transition: 0.2s; text-transform: uppercase;
            `;
            btn.addEventListener('click', () => {
                this.setFilter(index);
            });
            this.filterContainer.appendChild(btn);
        });
    }

    setFilter(index) {
        if (index < 0) index = this.filters.length - 1;
        if (index >= this.filters.length) index = 0;
        this.currentFilterIndex = index;
        this.renderFilterList();
        this.buildGallery();
        
        if (this.meshes.length > 0) {
            this.currentIndex = Math.floor(this.meshes.length / 2);
        }
    }

    cycleFilter(dir) {
        this.setFilter(this.currentFilterIndex + dir);
    }

    createSidebar() {
        this.sidebar = document.createElement('div');
        this.sidebar.id = 'coverflow-sidebar';
        
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
            overflow-y: auto;
        `;

        // Independent Trigger anchored to the left screen edge
        const trigger = document.createElement('div');
        trigger.style.cssText = `
            position: absolute; left: 0; top: 0; width: 30px; height: 100%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            background: transparent; z-index: 10003;
        `;
        
        const indicator = document.createElement('div');
        indicator.textContent = '▶'; 
        indicator.style.cssText = `color: ${themeCol}; text-shadow: 0 0 5px ${themeCol}; opacity: 0.5; transition: 0.3s; font-size: 1.5rem; pointer-events: none;`;
        trigger.appendChild(indicator);

        // Sidebar Hover Events mapped to both trigger and sidebar elements
        trigger.addEventListener('mouseenter', () => {
            this.sidebar.style.left = '0';
            indicator.style.opacity = '0';
        });

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
        const tabGridBtn = createTabBtn('cf-tab-grid', 'Grid View', false);
        const tabBgBtn = createTabBtn('cf-tab-backgrounds', 'Backgrounds', false);
        const tabCoversBtn = createTabBtn('cf-tab-covers', 'Covers', false);

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = `
            margin-top: auto; padding: 0 10px 25px 10px; display: flex; gap: 10px;
        `;

        const baseBtnStyle = `
            flex: 1; background: rgba(0, 0, 0, 0.8); border: 1px solid ${themeCol}; 
            color: ${themeCol}; padding: 12px 0; cursor: pointer; 
            text-transform: uppercase; font-family: inherit; font-weight: bold; 
            font-size: 0.8rem; letter-spacing: 1px; box-shadow: 0 0 5px ${themeCol}; 
            transition: all 0.2s ease; text-align: center; border-radius: 25px;
        `;

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.style.cssText = baseBtnStyle;
        
        const exitBtn = document.createElement('button');
        exitBtn.textContent = 'Exit';
        exitBtn.style.cssText = baseBtnStyle;

        [saveBtn, exitBtn].forEach(btn => {
            btn.addEventListener('mouseover', () => { btn.style.background = themeCol; btn.style.color = 'black'; });
            btn.addEventListener('mouseout', () => { btn.style.background = 'rgba(0, 0, 0, 0.8)'; btn.style.color = themeCol; });
        });

        btnContainer.appendChild(saveBtn);
        btnContainer.appendChild(exitBtn);

        navCol.appendChild(tabCoverBtn);
        navCol.appendChild(tabGridBtn);
        navCol.appendChild(tabBgBtn);
        navCol.appendChild(tabCoversBtn);
        navCol.appendChild(btnContainer);

        const contentCol = document.createElement('div');
        contentCol.style.cssText = `
            flex: 1; display: flex; flex-direction: column; padding: 25px; position: relative; overflow-y: auto;
        `;
        
        const createPanelHeader = (text) => {
            const h2 = document.createElement('h2');
            h2.textContent = text;
            h2.style.cssText = `font-size: 1.1rem; margin-top: 0; border-bottom: 1px solid ${themeCol}; padding-bottom: 10px; text-transform: uppercase; text-shadow: 0 0 5px ${themeCol}; letter-spacing: 2px;`;
            return h2;
        };

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

        const createSubSlider = (id, label, value, min, max, step, onChange) => {
            const container = document.createElement('div');
            container.id = id + "-container";
            container.style.cssText = "margin-left: 28px; margin-bottom: 20px; opacity: 0.3; transition: opacity 0.3s; pointer-events: none;";

            const labelRow = document.createElement('div');
            labelRow.style.cssText = "display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 5px;";
            const spLabel = document.createElement('span');
            spLabel.textContent = label;
            const spVal = document.createElement('span');
            spVal.id = id + "-val";
            spVal.textContent = value;
            labelRow.appendChild(spLabel);
            labelRow.appendChild(spVal);

            const slider = document.createElement('input');
            slider.type = "range";
            slider.id = id;
            slider.min = min;
            slider.max = max;
            slider.step = step;
            slider.value = value;
            slider.style.cssText = `width: 100%; accent-color: ${themeCol}; cursor: pointer;`;

            slider.addEventListener('input', (e) => {
                spVal.textContent = e.target.value;
                onChange(parseFloat(e.target.value));
            });

            container.appendChild(labelRow);
            container.appendChild(slider);
            return container;
        };

        // 1. STYLE TAB
        const panelStyle = document.createElement('div');
        panelStyle.id = "cf-tab-coverflow";
        panelStyle.className = "cf-tab-panel";
        panelStyle.style.cssText = "display: flex; flex-direction: column; height: 100%;";
        panelStyle.appendChild(createPanelHeader("Flow Style"));

        const styleContainer = document.createElement('div');
        styleContainer.style.marginTop = "25px";
        const styles = [
            {v: 'aurora', l: 'Aurora (Curved)'},
            {v: 'aurora-inward', l: 'Aurora (Inward)'},
            {v: 'linear', l: 'Linear (Flat)'},
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

        // 2. GRID VIEW TAB
        const panelGrid = document.createElement('div');
        panelGrid.id = "cf-tab-grid";
        panelGrid.className = "cf-tab-panel";
        panelGrid.style.cssText = "display: none; flex-direction: column; height: 100%;";
        panelGrid.appendChild(createPanelHeader("Grid View Config"));

        const gridContainer = document.createElement('div');
        gridContainer.style.marginTop = "25px";

        const gridRadio = createRadioOption('cf-style', 'grid', 'Enable Grid View', this.currentStyle === 'grid');
        gridContainer.appendChild(gridRadio);

        const colLabel = document.createElement('label');
        colLabel.style.cssText = "font-size: 0.8rem; text-transform: uppercase; margin-bottom: 8px; margin-top: 20px; display: block;";
        colLabel.textContent = "Columns: " + this.gridColumns;
        gridContainer.appendChild(colLabel);

        const colSlider = document.createElement('input');
        colSlider.type = "range";
        colSlider.min = "2";
        colSlider.max = "15";
        colSlider.step = "1";
        colSlider.value = this.gridColumns;
        colSlider.style.cssText = `width: 100%; accent-color: ${themeCol}; margin-bottom: 20px;`;
        colSlider.addEventListener('input', (e) => {
            this.gridColumns = parseInt(e.target.value);
            colLabel.textContent = "Columns: " + this.gridColumns;
        });
        gridContainer.appendChild(colSlider);

        const scaleLabel = document.createElement('label');
        scaleLabel.style.cssText = "font-size: 0.8rem; text-transform: uppercase; margin-bottom: 8px; display: block;";
        scaleLabel.textContent = "Grid Scale: " + this.gridScale.toFixed(1);
        gridContainer.appendChild(scaleLabel);

        const scaleSlider = document.createElement('input');
        scaleSlider.type = "range";
        scaleSlider.min = "0.5";
        scaleSlider.max = "3.0";
        scaleSlider.step = "0.1";
        scaleSlider.value = this.gridScale;
        scaleSlider.style.cssText = `width: 100%; accent-color: ${themeCol}; margin-bottom: 20px;`;
        scaleSlider.addEventListener('input', (e) => {
            this.gridScale = parseFloat(e.target.value);
            scaleLabel.textContent = "Grid Scale: " + this.gridScale.toFixed(1);
        });
        gridContainer.appendChild(scaleSlider);

        panelGrid.appendChild(gridContainer);
        contentCol.appendChild(panelGrid);

        // 3. BACKGROUNDS TAB
        const panelBg = document.createElement('div');
        panelBg.id = "cf-tab-backgrounds";
        panelBg.className = "cf-tab-panel";
        panelBg.style.cssText = "display: none; flex-direction: column; height: 100%;";
        panelBg.appendChild(createPanelHeader("Environment"));

        const bgContainer = document.createElement('div');
        bgContainer.style.marginTop = "25px";

        // Rain Config (Moved to Top & Set as Default)
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

        const colorPicker = document.createElement('input');
        colorPicker.type = "color";
        colorPicker.id = "cf-rain-color-picker";
        colorPicker.value = this.customRainColor;
        colorPicker.style.cssText = `background: transparent; border: 1px solid ${themeCol}; height: 25px; width: 40px; cursor: pointer; padding: 0;`;
        rainRow.appendChild(colorPicker);
        bgContainer.appendChild(rainRow);

        const speedContainer = document.createElement('div');
        speedContainer.id = "cf-rain-speed-container";
        speedContainer.style.cssText = "margin-left: 28px; margin-bottom: 20px; opacity: 0.3; transition: opacity 0.3s; pointer-events: none;";

        const speedLabelRow = document.createElement('div');
        speedLabelRow.style.cssText = "display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 5px;";
        const spLabel = document.createElement('span');
        spLabel.textContent = "RAIN SPEED";
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

        // Celestial Environments with dedicated Opacity Sliders!
        bgContainer.appendChild(createRadioOption('cf-bg', 'space', 'Deep Space (Asteroids)', this.currentBg === 'space'));
        
        bgContainer.appendChild(createRadioOption('cf-bg', 'earth', 'Orbiting Earth (Day)', this.currentBg === 'earth'));
        bgContainer.appendChild(createSubSlider('cf-earth-day-slider', 'CLOUD OPACITY', this.earthDayCloudOpacity, 0, 1, 0.05, (val) => {
            this.earthDayCloudOpacity = val;
            if (this.earthCloudMesh) this.earthCloudMesh.material.opacity = val;
        }));

        bgContainer.appendChild(createRadioOption('cf-bg', 'earth-night', 'Orbiting Earth (Night)', this.currentBg === 'earth-night'));
        bgContainer.appendChild(createSubSlider('cf-earth-night-slider', 'CLOUD OPACITY', this.earthNightCloudOpacity, 0, 1, 0.05, (val) => {
            this.earthNightCloudOpacity = val;
            if (this.earthNightCloudMesh) this.earthNightCloudMesh.material.opacity = val;
        }));

        bgContainer.appendChild(createRadioOption('cf-bg', 'moon', 'The Moon', this.currentBg === 'moon'));
        bgContainer.appendChild(createRadioOption('cf-bg', 'sun', 'The Sun', this.currentBg === 'sun'));
        bgContainer.appendChild(createRadioOption('cf-bg', 'mercury', 'Mercury', this.currentBg === 'mercury'));
        bgContainer.appendChild(createRadioOption('cf-bg', 'venus', 'Venus', this.currentBg === 'venus'));
        bgContainer.appendChild(createRadioOption('cf-bg', 'mars', 'Mars', this.currentBg === 'mars'));
        bgContainer.appendChild(createRadioOption('cf-bg', 'jupiter', 'Jupiter', this.currentBg === 'jupiter'));
        
        bgContainer.appendChild(createRadioOption('cf-bg', 'saturn', 'Saturn', this.currentBg === 'saturn'));
        bgContainer.appendChild(createSubSlider('cf-saturn-ring-slider', 'RING OPACITY', this.saturnRingOpacity, 0, 1, 0.05, (val) => {
            this.saturnRingOpacity = val;
            if (this.saturnRingMesh) this.saturnRingMesh.material.opacity = val;
        }));

        bgContainer.appendChild(createRadioOption('cf-bg', 'neptune', 'Neptune', this.currentBg === 'neptune'));
        bgContainer.appendChild(createRadioOption('cf-bg', 'synthwave', 'Synthwave Grid', this.currentBg === 'synthwave'));
        
        panelBg.appendChild(bgContainer);
        contentCol.appendChild(panelBg);

        // 4. COVERS TAB (Rounding & Reflections)
        const panelCovers = document.createElement('div');
        panelCovers.id = "cf-tab-covers";
        panelCovers.className = "cf-tab-panel";
        panelCovers.style.cssText = "display: none; flex-direction: column; height: 100%;";
        panelCovers.appendChild(createPanelHeader("Cover Geometry"));

        const coverContainer = document.createElement('div');
        coverContainer.style.marginTop = "25px";

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
        
        // Append elements to container independently to fix hover bugs
        this.container.appendChild(this.sidebar);
        this.container.appendChild(trigger);

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

        const styleRadios = this.sidebar.querySelectorAll('input[name="cf-style"]');
        styleRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentStyle = e.target.value;
                if (this.meshes.length > 0) {
                    this.currentIndex = Math.floor(this.meshes.length / 2);
                }
                if(this.currentStyle === 'carousel') this.buildGallery();
            });
            if(radio.value === this.currentStyle) radio.checked = true;
        });

        const bgRadios = this.sidebar.querySelectorAll('input[name="cf-bg"]');
        
        const updateEnvironmentUI = (val) => {
            const setUI = (id, isActive) => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.opacity = isActive ? '1' : '0.3';
                    el.style.pointerEvents = isActive ? 'auto' : 'none';
                }
            };
            setUI('cf-rain-speed-container', val === 'rain');
            setUI('cf-earth-day-slider-container', val === 'earth');
            setUI('cf-earth-night-slider-container', val === 'earth-night');
            setUI('cf-saturn-ring-slider-container', val === 'saturn');
        };

        bgRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentBg = e.target.value;
                this.applyBackgroundStyle();
                updateEnvironmentUI(this.currentBg);
            });
            if(radio.value === this.currentBg) radio.checked = true;
        });
        
        updateEnvironmentUI(this.currentBg);

        const rainPicker = document.getElementById('cf-rain-color-picker');
        rainPicker.addEventListener('input', (e) => {
            this.customRainColor = e.target.value;
        });

        const rainSpeedSlider = document.getElementById('cf-rain-speed-slider');
        const rainSpeedVal = document.getElementById('cf-rain-speed-val');
        rainSpeedSlider.addEventListener('input', (e) => {
            this.rainSpeed = parseInt(e.target.value);
            rainSpeedVal.textContent = this.rainSpeed + 'ms';
        });

        const roundToggle = document.getElementById('cf-rounding-toggle');
        const reflectToggle = document.getElementById('cf-reflection-toggle');
        const radiusSliderEl = document.getElementById('cf-radius-slider');
        
        const updateGeometry = () => {
            this.enableRounding = roundToggle.checked;
            this.enableReflections = reflectToggle.checked;
            this.coverRadius = parseFloat(radiusSliderEl.value);
            this.buildGallery(); 
        };

        roundToggle.addEventListener('change', updateGeometry);
        reflectToggle.addEventListener('change', updateGeometry);
        radiusSliderEl.addEventListener('input', updateGeometry);

        saveBtn.addEventListener('click', () => {
            localStorage.setItem('matrix-coverflow-style', this.currentStyle);
            localStorage.setItem('matrix-coverflow-bg', this.currentBg);
            localStorage.setItem('matrix-coverflow-rain-color', this.customRainColor);
            localStorage.setItem('matrix-coverflow-rain-speed', this.rainSpeed);
            
            // Save Opacity States
            localStorage.setItem('matrix-coverflow-earth-day-cloud-opacity', this.earthDayCloudOpacity);
            localStorage.setItem('matrix-coverflow-earth-night-cloud-opacity', this.earthNightCloudOpacity);
            localStorage.setItem('matrix-coverflow-saturn-ring-opacity', this.saturnRingOpacity);

            localStorage.setItem('matrix-coverflow-rounding', this.enableRounding);
            localStorage.setItem('matrix-coverflow-radius', this.coverRadius);
            localStorage.setItem('matrix-coverflow-reflections', this.enableReflections);
            localStorage.setItem('matrix-coverflow-grid-cols', this.gridColumns);
            localStorage.setItem('matrix-coverflow-grid-scale', this.gridScale);
            
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'SAVED';
            setTimeout(() => saveBtn.textContent = originalText, 1000);
        });

        exitBtn.addEventListener('click', () => {
            this.close();
        });
    }

    applyBackgroundStyle() {
        // Hide all 3D groups initially
        if (this.starsSkyGroup) this.starsSkyGroup.visible = false;
        if (this.earthGroup) this.earthGroup.visible = false;
        if (this.earthNightGroup) this.earthNightGroup.visible = false;
        if (this.sunGroup) this.sunGroup.visible = false;
        if (this.moonGroup) this.moonGroup.visible = false;
        if (this.marsGroup) this.marsGroup.visible = false;
        if (this.jupiterGroup) this.jupiterGroup.visible = false;
        if (this.saturnGroup) this.saturnGroup.visible = false;
        if (this.neptuneGroup) this.neptuneGroup.visible = false;
        if (this.venusGroup) this.venusGroup.visible = false;
        if (this.mercuryGroup) this.mercuryGroup.visible = false;
        if (this.spaceGroup) this.spaceGroup.visible = false;

        if (this.currentBg === 'space') {
            this.bgCanvas.style.display = 'none';
            this.container.style.backgroundColor = '#000000'; 
            this.container.style.backgroundImage = 'none';
            if (this.spaceGroup) this.spaceGroup.visible = true; 
        } else if (['earth', 'earth-night', 'sun', 'moon', 'mars', 'jupiter', 'saturn', 'neptune', 'venus', 'mercury'].includes(this.currentBg)) {
            this.bgCanvas.style.display = 'none'; 
            this.container.style.backgroundColor = '#000000'; 
            this.container.style.backgroundImage = 'none';
            if (this.starsSkyGroup) this.starsSkyGroup.visible = true;
            
            if (this.currentBg === 'earth' && this.earthGroup) this.earthGroup.visible = true;
            if (this.currentBg === 'earth-night' && this.earthNightGroup) this.earthNightGroup.visible = true;
            if (this.currentBg === 'sun' && this.sunGroup) this.sunGroup.visible = true;
            if (this.currentBg === 'moon' && this.moonGroup) this.moonGroup.visible = true;
            if (this.currentBg === 'mars' && this.marsGroup) this.marsGroup.visible = true;
            if (this.currentBg === 'jupiter' && this.jupiterGroup) this.jupiterGroup.visible = true;
            if (this.currentBg === 'saturn' && this.saturnGroup) this.saturnGroup.visible = true;
            if (this.currentBg === 'neptune' && this.neptuneGroup) this.neptuneGroup.visible = true;
            if (this.currentBg === 'venus' && this.venusGroup) this.venusGroup.visible = true;
            if (this.currentBg === 'mercury' && this.mercuryGroup) this.mercuryGroup.visible = true;
        } else {
            // Rain & Synthwave rely purely on Canvas and black background
            this.bgCanvas.style.display = 'block';
            this.container.style.backgroundColor = '#000000';
            this.container.style.backgroundImage = 'none';
        }
        this.resizeBgCanvas();
    }

    resizeBgCanvas() {
        if (!this.bgCanvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        this.bgCanvas.width = window.innerWidth * dpr;
        this.bgCanvas.height = window.innerHeight * dpr;
        
        this.bgCanvas.style.width = window.innerWidth + 'px';
        this.bgCanvas.style.height = window.innerHeight + 'px';
        
        this.bgCtx.scale(dpr, dpr);

        // Init Rain Matrix Array
        const columns = window.innerWidth / (this.fontSize * 0.6);
        this.zionDrops = [];
        for (let x = 0; x < columns; x++) {
            this.zionDrops[x] = Math.floor(Math.random() * (window.innerHeight / this.fontSize));
        }

        // Init Grid Offset
        this.gridOffset = 0;
    }

    drawZionRain() {
        if (!this.isActive) return;
        const ctx = this.bgCtx;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        
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

    drawSynthwave() {
        if (!this.isActive) return;
        const ctx = this.bgCtx;
        
        // Trail effect to soften the moving lines
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; 
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        
        ctx.strokeStyle = this.uiColorStr;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.uiColorStr;
        ctx.globalAlpha = 0.8;

        const cy = window.innerHeight * 0.55; 
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Draw static perspective vertical lines
        ctx.beginPath();
        for(let i = -w*2; i <= w*3; i+= 150) {
            ctx.moveTo(w/2, cy);
            ctx.lineTo(i, h);
        }
        ctx.stroke();

        // Draw advancing horizontal lines
        this.gridOffset += 0.008;
        if (this.gridOffset > 1) this.gridOffset -= 1;
        
        ctx.beginPath();
        const lines = 20;
        for(let i=0; i<=lines; i++) {
            let progress = (i + this.gridOffset) / lines; 
            if (progress > 0) {
                let yPos = cy + Math.pow(progress, 3) * (h - cy);
                ctx.moveTo(0, yPos);
                ctx.lineTo(w, yPos);
            }
        }
        ctx.stroke();
        
        // Add a bright horizon line
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        this.renderer.domElement.style.position = 'relative';
        this.renderer.domElement.style.zIndex = '10001'; 
        
        this.container.appendChild(this.renderer.domElement);

        // --- FIX: BALANCED GLOBAL LIGHTING ---
        // Boosted ambient slightly to keep the baseline bright and crisp.
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        // Boosted Directional Light and shifted slightly to catch the beautiful 3D bevels!
        const cameraLight = new THREE.DirectionalLight(0xffffff, 0.7);
        cameraLight.position.set(0.5, 0.5, 2); 
        
        // CRITICAL FIX: The target must also be added to the camera! 
        cameraLight.target.position.set(0, 0, 0); 
        this.camera.add(cameraLight);
        this.camera.add(cameraLight.target); // Lock the target relative to the camera!
        
        this.scene.add(this.camera);

        this.camera.position.set(0, 1, 14);

        this.build3DPlanets();
        this.build3DSpace();

        this.addEventListeners();
    }

    build3DPlanets() {
        const textureLoader = new THREE.TextureLoader();
        const getTexUrl = (path) => (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL(path) : path;
        
        // --- 1. Shared Stars Skybox ---
        this.starsSkyGroup = new THREE.Group();
        const starsSkyGeo = new THREE.SphereGeometry(500, 64, 64);
        const starsSkyMat = new THREE.MeshBasicMaterial({
            map: textureLoader.load(getTexUrl('three-textures/8k_stars.jpg')),
            side: THREE.BackSide
        });
        this.starsSkyMesh = new THREE.Mesh(starsSkyGeo, starsSkyMat);
        this.starsSkyGroup.add(this.starsSkyMesh);
        this.starsSkyGroup.visible = false;
        this.scene.add(this.starsSkyGroup);

        const buildStandardPlanet = (texturePath, roughness = 0.8, metalness = 0.1) => {
            const geo = new THREE.SphereGeometry(22, 64, 64);
            const mat = new THREE.MeshStandardMaterial({
                map: textureLoader.load(getTexUrl(texturePath)),
                roughness: roughness, metalness: metalness
            });
            return new THREE.Mesh(geo, mat);
        };

        const buildSunLight = (intensity = 2.0) => {
            const light = new THREE.PointLight(0xffffff, intensity, 35);
            light.position.set(-20, 10, 20); 
            return light;
        };

        // --- Earth Cloud Materials ---
        const earthCloudGeo = new THREE.SphereGeometry(22.03, 64, 64);
        
        // Day Cloud Material
        const earthDayCloudMat = new THREE.MeshStandardMaterial({
            map: textureLoader.load(getTexUrl('three-textures/8k_earth_clouds.jpg')),
            transparent: true,
            opacity: this.earthDayCloudOpacity, 
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Night Cloud Material
        const earthNightCloudMat = new THREE.MeshStandardMaterial({
            map: textureLoader.load(getTexUrl('three-textures/8k_earth_clouds.jpg')),
            transparent: true,
            opacity: this.earthNightCloudOpacity, 
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // --- Earth (Day) ---
        this.earthGroup = new THREE.Group();
        this.earthMesh = buildStandardPlanet('three-textures/8k_earth_daymap.jpg');
        this.earthGroup.add(this.earthMesh);
        
        // Apply clouds to Day Earth
        this.earthCloudMesh = new THREE.Mesh(earthCloudGeo, earthDayCloudMat);
        this.earthCloudMesh.userData = { isCloud: true };
        this.earthGroup.add(this.earthCloudMesh);
        
        const atmosGeo = new THREE.SphereGeometry(22.6, 64, 64);
        const atmosMat = new THREE.ShaderMaterial({
            vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `varying vec3 vNormal; void main() { float intensity = pow(1.0 - max(dot(vNormal, vec3(0, 0, 1.0)), 0.0), 3.0); gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity; }`,
            blending: THREE.AdditiveBlending, side: THREE.FrontSide, transparent: true, depthWrite: false
        });
        const earthAtmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
        this.earthGroup.add(earthAtmosMesh);
        this.earthGroup.add(buildSunLight());
        this.earthGroup.visible = false;
        this.earthGroup.position.set(0, 0, -60);
        this.scene.add(this.earthGroup);

        // --- Earth (Night) ---
        this.earthNightGroup = new THREE.Group();
        this.earthNightMesh = buildStandardPlanet('three-textures/8k_earth_nightmap.jpg');
        this.earthNightGroup.add(this.earthNightMesh);
        
        // Apply clouds to Night Earth
        this.earthNightCloudMesh = new THREE.Mesh(earthCloudGeo, earthNightCloudMat);
        this.earthNightCloudMesh.userData = { isCloud: true };
        this.earthNightGroup.add(this.earthNightCloudMesh);

        this.earthNightGroup.add(buildSunLight(0.5)); // Night map uses dimmer light for city glow
        this.earthNightGroup.visible = false;
        this.earthNightGroup.position.set(0, 0, -60);
        this.scene.add(this.earthNightGroup);

        // --- Sun ---
        this.sunGroup = new THREE.Group();
        const sunGeo = new THREE.SphereGeometry(22, 64, 64);
        const sunMat = new THREE.MeshBasicMaterial({ // Fully emissive
            map: textureLoader.load(getTexUrl('three-textures/8k_sun.jpg'))
        });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.sunGroup.add(this.sunMesh);
        this.sunGroup.visible = false;
        this.sunGroup.position.set(0, 0, -60);
        this.scene.add(this.sunGroup);

        // --- Moon ---
        this.moonGroup = new THREE.Group();
        this.moonMesh = buildStandardPlanet('three-textures/8k_moon.jpg', 1.0, 0.0);
        this.moonGroup.add(this.moonMesh);
        this.moonGroup.add(buildSunLight());
        this.moonGroup.visible = false;
        this.moonGroup.position.set(0, 0, -60);
        this.scene.add(this.moonGroup);

        // --- Mars ---
        this.marsGroup = new THREE.Group();
        this.marsMesh = buildStandardPlanet('three-textures/8k_mars.jpg', 0.9, 0.1);
        this.marsGroup.add(this.marsMesh);
        
        // Mars thin dusty atmosphere
        const marsAtmosGeo = new THREE.SphereGeometry(22.4, 64, 64);
        const marsAtmosMat = new THREE.ShaderMaterial({
            vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `varying vec3 vNormal; void main() { float intensity = pow(1.0 - max(dot(vNormal, vec3(0, 0, 1.0)), 0.0), 3.0); gl_FragColor = vec4(1.0, 0.4, 0.1, 1.0) * intensity; }`, // Orange glow
            blending: THREE.AdditiveBlending, side: THREE.FrontSide, transparent: true, depthWrite: false
        });
        const marsAtmosMesh = new THREE.Mesh(marsAtmosGeo, marsAtmosMat);
        this.marsGroup.add(marsAtmosMesh);
        this.marsGroup.add(buildSunLight());
        this.marsGroup.visible = false;
        this.marsGroup.position.set(0, 0, -60);
        this.scene.add(this.marsGroup);

        // --- Jupiter ---
        this.jupiterGroup = new THREE.Group();
        this.jupiterMesh = buildStandardPlanet('three-textures/8k_jupiter.jpg');
        this.jupiterGroup.add(this.jupiterMesh);
        this.jupiterGroup.add(buildSunLight());
        this.jupiterGroup.visible = false;
        this.jupiterGroup.position.set(0, 0, -60);
        this.scene.add(this.jupiterGroup);

        // --- Saturn ---
        this.saturnGroup = new THREE.Group();
        this.saturnMesh = buildStandardPlanet('three-textures/8k_saturn.jpg');
        this.saturnGroup.add(this.saturnMesh);

        // Saturn Rings
        const ringGeo = new THREE.RingGeometry(25, 45, 64);
        const ringMat = new THREE.MeshStandardMaterial({
            map: textureLoader.load(getTexUrl('three-textures/8k_saturn_ring_alpha.png')),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this.saturnRingOpacity
        });
        this.saturnRingMesh = new THREE.Mesh(ringGeo, ringMat);
        this.saturnRingMesh.rotation.x = Math.PI / 2 + 0.2; // Tilt the ring
        this.saturnGroup.add(this.saturnRingMesh);
        this.saturnGroup.add(buildSunLight());
        this.saturnGroup.visible = false;
        this.saturnGroup.position.set(0, 0, -60);
        this.scene.add(this.saturnGroup);

        // --- Neptune ---
        this.neptuneGroup = new THREE.Group();
        this.neptuneMesh = buildStandardPlanet('three-textures/2k_neptune.jpg');
        this.neptuneGroup.add(this.neptuneMesh);
        this.neptuneGroup.add(buildSunLight());
        this.neptuneGroup.visible = false;
        this.neptuneGroup.position.set(0, 0, -60);
        this.scene.add(this.neptuneGroup);

        // --- Venus ---
        this.venusGroup = new THREE.Group();
        this.venusMesh = buildStandardPlanet('three-textures/8k_venus_surface.jpg');
        this.venusGroup.add(this.venusMesh);
        
        // Venus Atmosphere (Cloud layer)
        const venusCloudGeo = new THREE.SphereGeometry(22.2, 64, 64);
        const venusCloudMat = new THREE.MeshStandardMaterial({
            map: textureLoader.load(getTexUrl('three-textures/4k_venus_atmosphere.jpg')),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const venusCloudMesh = new THREE.Mesh(venusCloudGeo, venusCloudMat);
        this.venusGroup.add(venusCloudMesh);
        this.venusGroup.add(buildSunLight());
        this.venusGroup.visible = false;
        this.venusGroup.position.set(0, 0, -60);
        this.scene.add(this.venusGroup);

        // --- Mercury ---
        this.mercuryGroup = new THREE.Group();
        this.mercuryMesh = buildStandardPlanet('three-textures/8k_mercury.jpg', 1.0, 0.0);
        this.mercuryGroup.add(this.mercuryMesh);
        this.mercuryGroup.add(buildSunLight());
        this.mercuryGroup.visible = false;
        this.mercuryGroup.position.set(0, 0, -60);
        this.scene.add(this.mercuryGroup);
    }

    build3DSpace() {
        this.spaceGroup = new THREE.Group();
        const textureLoader = new THREE.TextureLoader();
        const getTexUrl = (path) => (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL(path) : path;

        // 1. Milky Way Skybox
        const spaceSkyGeo = new THREE.SphereGeometry(500, 64, 64);
        const spaceSkyMat = new THREE.MeshBasicMaterial({
            map: textureLoader.load(getTexUrl('three-textures/8k_stars_milky_way.jpg')),
            side: THREE.BackSide
        });
        this.spaceSkyMesh = new THREE.Mesh(spaceSkyGeo, spaceSkyMat);
        this.spaceGroup.add(this.spaceSkyMesh);

        // Load the Asteroid Texture
        const asteroidTexture = textureLoader.load(getTexUrl('three-textures/asteroid.png'));

        for(let i = 0; i < 35; i++) {
            const uniqueAstMat = new THREE.SpriteMaterial({ 
                map: asteroidTexture,
                color: 0xffffff
            });

            const ast = new THREE.Sprite(uniqueAstMat);
            
            const size = Math.random() * 3 + 1.5;
            ast.scale.set(size, size, 1);
            
            ast.material.rotation = Math.random() * Math.PI * 2;
            
            // Asteroids are initialized relative to 0,0,0 (which will strictly track the camera)
            ast.position.set(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 70,
                -80 + (Math.random() * 100) 
            );
            
            ast.userData = {
                rotZ: (Math.random() - 0.5) * 0.005, 
                speedX: (Math.random() - 0.5) * 0.05,
                speedY: (Math.random() - 0.5) * 0.05,
                speedZ: (Math.random() - 0.5) * 0.05,
                isAsteroid: true
            };
            this.spaceGroup.add(ast);
        }

        this.spaceGroup.visible = false;
        this.scene.add(this.spaceGroup);
    }

    buildGallery() {
        this.meshes.forEach(m => this.scene.remove(m));
        this.meshes = [];
        let xOffset = 0;

        const currentFilterId = this.filters[this.currentFilterIndex];

        this.systemMap.forEach(system => {
            if (currentFilterId !== 'all' && system.id !== currentFilterId) return;

            const romArray = window[system.arrayName];
            
            if (romArray && Array.isArray(romArray)) {
                romArray.forEach(romFileName => {
                    this.createCoverMesh(romFileName, system, xOffset);
                    xOffset += 5.5; 
                });
            }
        });

        if (this.meshes.length > 0) {
            this.currentIndex = Math.min(this.currentIndex, this.meshes.length - 1);
            if(this.currentIndex < 0) this.currentIndex = 0;
        } else {
            this.currentIndex = 0;
        }
    }

    // --- UPGRADED: 3D Box & Extruded Geometries ---
    getCoverGeometry(width, height, depth = 0.3) {
        if (!this.enableRounding || this.coverRadius <= 0) {
            // Return a genuine 3D Box instead of a flat plane
            return new THREE.BoxGeometry(width, height, depth);
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

        // Extrude the rounded shape into a thick 3D solid
        const extrudeSettings = { 
            depth: depth, 
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.02,
            bevelThickness: 0.02
        };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        
        // Center the new 3D geometry perfectly on its origin
        geometry.center();

        const posAttribute = geometry.attributes.position;
        const uvAttribute = geometry.attributes.uv;
        
        // Map texture UVs correctly across the front face
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

        const depth = 0.3; // The thickness of the physical game cases
        const geometry = this.getCoverGeometry(3.5, 5, depth);
        
        // Material 1: The Front/Back Cover
        const frontMaterial = new THREE.MeshStandardMaterial({ 
            map: texture, 
            roughness: 0.7,
            metalness: 0.1
        });

        // Material 2: The dark "plastic" rim/spine of the physical case
        const sideMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9,
            metalness: 0.2
        });

        let materialArray;
        if (geometry.type === 'BoxGeometry') {
            // Box faces: [Right, Left, Top, Bottom, Front, Back]
            materialArray = [sideMaterial, sideMaterial, sideMaterial, sideMaterial, frontMaterial, frontMaterial];
        } else {
            // Extrude faces: [0: Front/Back, 1: Extruded Sides]
            materialArray = [frontMaterial, sideMaterial];
        }
        
        const mesh = new THREE.Mesh(geometry, materialArray);
        mesh.userData = { system: system.id, romValue: romFileName, btnId: system.btnId, baseX: xPos };

        // Wrap the new 3D box in the neon wireframe
        const borderGeo = new THREE.EdgesGeometry(geometry); 
        const borderMat = new THREE.LineBasicMaterial({ 
            color: this.uiColor, 
            transparent: true, 
            opacity: 0.0 
        });
        const borderMesh = new THREE.LineSegments(borderGeo, borderMat);
        borderMesh.userData = { isBorder: true };
        mesh.add(borderMesh);

        const glowGeo = new THREE.PlaneGeometry(8.2, 8.2); 
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: this.uiColor, 
            transparent: true, 
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: this.glowTexture
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.set(0, 0, -(depth / 2) - 0.05); // Push glow slightly behind the thick 3D box
        glowMesh.userData = { isGlow: true };
        mesh.add(glowMesh);

        if (this.enableReflections) {
            const reflectFront = new THREE.MeshStandardMaterial({ 
                map: texture, opacity: 0.15, transparent: true, side: THREE.DoubleSide
            });
            const reflectSide = new THREE.MeshStandardMaterial({ 
                color: 0x111111, opacity: 0.15, transparent: true, side: THREE.DoubleSide
            });
            
            let reflectMaterial;
            if (geometry.type === 'BoxGeometry') {
                reflectMaterial = [reflectSide, reflectSide, reflectSide, reflectSide, reflectFront, reflectFront];
            } else {
                reflectMaterial = [reflectFront, reflectSide];
            }
            
            const reflection = new THREE.Mesh(geometry, reflectMaterial);
            reflection.position.set(0, -5.2, 0); 
            reflection.scale.y = -1; // Flip the 3D reflection on the Y axis flawlessly without exposing back-face culling
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
            
            if (this.sidebar && this.sidebar.contains(e.target)) return;
            if (this.rightSidebar && this.rightSidebar.contains(e.target)) return;

            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);

            const intersects = this.raycaster.intersectObjects(this.meshes, true);
            if (intersects.length > 0) {
                let clickedMesh = intersects[0].object;
                if (clickedMesh.userData.isGlow || clickedMesh.userData.isBorder) clickedMesh = clickedMesh.parent;
                if (!clickedMesh.userData.baseX && clickedMesh.parent) clickedMesh = clickedMesh.parent;

                const isGrid = this.currentStyle === 'grid';
                let validClick = false;
                
                if (isGrid) {
                    validClick = true; 
                } else {
                     if (Math.abs(clickedMesh.userData.baseX - this.camera.position.x) < 1) validClick = true;
                }

                if (validClick) {
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
            const key = e.key.toLowerCase();
            
            if (key === "arrowright" || key === "d") this.navigate(1);
            if (key === "arrowleft" || key === "a") this.navigate(-1);
            
            if (this.currentStyle === 'grid') {
                if (key === "arrowup" || key === "w") this.navigate(-this.gridColumns);
                if (key === "arrowdown" || key === "s") this.navigate(this.gridColumns);
            }

            if (key === "enter" && this.meshes.length > 0) {
                this.launchGame(this.meshes[this.currentIndex].userData);
            }
            if (key === "escape") this.close();
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
            this.resizeBgCanvas();
        });

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
        if (now - this.gpStickMoved > 150) { 
            if (gp.axes[0] > 0.5) {
                this.navigate(1);
                this.gpStickMoved = now;
            } else if (gp.axes[0] < -0.5) {
                this.navigate(-1);
                this.gpStickMoved = now;
            }
            
            if (this.currentStyle === 'grid') {
                 if (gp.axes[1] > 0.5) {
                    this.navigate(this.gridColumns);
                    this.gpStickMoved = now;
                 } else if (gp.axes[1] < -0.5) {
                    this.navigate(-this.gridColumns);
                    this.gpStickMoved = now;
                 }
            }
        }

        if (gp.buttons[0].pressed) {
            if (!this.gpButtonDown) {
                this.gpButtonDown = true;
                if (this.meshes.length > 0) {
                    this.launchGame(this.meshes[this.currentIndex].userData);
                }
            }
        } 
        else if (gp.buttons[1].pressed) {
            if (!this.gpButtonDown) {
                this.gpButtonDown = true;
                this.close();
            }
        } 
        else {
            this.gpButtonDown = false;
        }

        if (gp.buttons[4] && gp.buttons[4].pressed) {
            if (!this.gpLBDown) {
                this.gpLBDown = true;
                this.cycleFilter(-1);
            }
        } else {
            this.gpLBDown = false;
        }

        if (gp.buttons[5] && gp.buttons[5].pressed) {
            if (!this.gpRBDown) {
                this.gpRBDown = true;
                this.cycleFilter(1);
            }
        } else {
            this.gpRBDown = false;
        }
    }

    navigate(dir) {
        if (this.meshes.length === 0) return;
        this.currentIndex = Math.max(0, Math.min(this.currentIndex + dir, this.meshes.length - 1));
    }

    open() {
        this.updateThemeColors(); 
        this.buildGallery(); 
        
        if (this.meshes.length > 0) {
            this.currentIndex = Math.floor(this.meshes.length / 2);
            
            if (this.currentStyle === 'grid') {
                const row = Math.floor(this.currentIndex / this.gridColumns);
                this.camera.position.x = 0;
                this.camera.position.y = -(row * 5.5 * this.gridScale);
                this.camera.position.z = (this.gridColumns * 4) + (this.gridScale * 10);
            } else {
                this.camera.position.x = this.meshes[this.currentIndex].userData.baseX;
                this.camera.position.y = 1;
                this.camera.position.z = 14;
            }
        }

        this.container.style.display = 'block';
        
        this.resizeBgCanvas();

        setTimeout(() => { 
            this.container.style.opacity = '1'; 
            this.isActive = true;
            this.animate(); 
        }, 50);
    }

    animate() {
        if (!this.isActive) return;
        requestAnimationFrame(() => this.animate());

        this.pollGamepad();

        // ---------------------------------------------------------
        // 1. UPDATE CAMERA POSITION FIRST
        // ---------------------------------------------------------
        if (this.meshes.length > 0) {
            if (this.currentStyle === 'grid') {
                const row = Math.floor(this.currentIndex / this.gridColumns);
                const spacingY = 5.5 * this.gridScale; 
                this.targetCameraX = 0;
                this.targetCameraY = -(row * spacingY); 
                this.targetCameraZ = (this.gridColumns * 4) + (this.gridScale * 10); 
            } else {
                this.targetCameraX = this.meshes[this.currentIndex].userData.baseX;
                this.targetCameraY = 1;
                this.targetCameraZ = 14;
            }

            this.camera.position.x += (this.targetCameraX - this.camera.position.x) * 0.1;
            this.camera.position.y += (this.targetCameraY - this.camera.position.y) * 0.1;
            this.camera.position.z += (this.targetCameraZ - this.camera.position.z) * 0.1;
        }

        // ---------------------------------------------------------
        // 2. Environment Background Animations (Perfectly Synced)
        // ---------------------------------------------------------
        if (this.currentBg === 'rain') {
            const now = Date.now();
            if (now - this.lastRainDraw > this.rainSpeed) {
                this.drawZionRain();
                this.lastRainDraw = now;
            }
        } else if (this.currentBg === 'synthwave') {
            this.drawSynthwave();
        } else if (this.currentBg === 'space') {
            if (this.spaceGroup) {
                // Pin the entire space group to the camera directly.
                // This ensures asteroids act as an ambient overlay, entirely separate from coverflow panning!
                this.spaceGroup.position.copy(this.camera.position);

                // Pin skybox relative to spaceGroup center
                this.spaceSkyMesh.position.set(0, 0, 0);
                this.spaceSkyMesh.rotation.y += 0.0003;

                // Animate 3D Asteroids locally
                this.spaceGroup.children.forEach(ast => {
                    if (ast.userData && ast.userData.isAsteroid) {
                        ast.material.rotation += ast.userData.rotZ; 
                        ast.position.x += ast.userData.speedX;
                        ast.position.y += ast.userData.speedY;
                        ast.position.z += ast.userData.speedZ;

                        // Local wrap logic (since group is locked to camera)
                        if (ast.position.x < -50) ast.position.x = 50;
                        if (ast.position.x > 50) ast.position.x = -50;
                        if (ast.position.y < -35) ast.position.y = 35;
                        if (ast.position.y > 35) ast.position.y = -35;
                        
                        // Asteroids can cleanly pass camera (Z=0 relative to group) out to +20 before looping
                        if (ast.position.z < -80) ast.position.z = 20;
                        if (ast.position.z > 20) ast.position.z = -80;
                    }
                });
            }
        } else if (['earth', 'earth-night', 'sun', 'moon', 'mars', 'jupiter', 'saturn', 'neptune', 'venus', 'mercury'].includes(this.currentBg)) {
            if (this.starsSkyGroup) {
                this.starsSkyMesh.position.copy(this.camera.position);
                this.starsSkyMesh.rotation.y += 0.0002;
            }
            
            let activeGroup, activeMesh;
            if (this.currentBg === 'earth') { activeGroup = this.earthGroup; activeMesh = this.earthMesh; }
            else if (this.currentBg === 'earth-night') { activeGroup = this.earthNightGroup; activeMesh = this.earthNightMesh; }
            else if (this.currentBg === 'sun') { activeGroup = this.sunGroup; activeMesh = this.sunMesh; }
            else if (this.currentBg === 'moon') { activeGroup = this.moonGroup; activeMesh = this.moonMesh; }
            else if (this.currentBg === 'mars') { activeGroup = this.marsGroup; activeMesh = this.marsMesh; }
            else if (this.currentBg === 'jupiter') { activeGroup = this.jupiterGroup; activeMesh = this.jupiterMesh; }
            else if (this.currentBg === 'saturn') { activeGroup = this.saturnGroup; activeMesh = this.saturnMesh; }
            else if (this.currentBg === 'neptune') { activeGroup = this.neptuneGroup; activeMesh = this.neptuneMesh; }
            else if (this.currentBg === 'venus') { activeGroup = this.venusGroup; activeMesh = this.venusMesh; }
            else if (this.currentBg === 'mercury') { activeGroup = this.mercuryGroup; activeMesh = this.mercuryMesh; }

            if (activeGroup && activeMesh) {
                activeMesh.rotation.y += 0.0015;

                // --- NEW: Rotate Clouds Slightly Faster to Create Parallax ---
                activeGroup.children.forEach(child => {
                    if (child.userData && child.userData.isCloud) {
                        child.rotation.y += 0.0018; 
                    }
                });

                // Pin Planet into deep background relative to current view
                activeGroup.position.x = this.camera.position.x;
                activeGroup.position.y = this.camera.position.y;
                
                // Prevent Grid View from slicing through planets!
                // As the camera zooms out (+Z), we push the planet back by the same amount 
                // to strictly maintain an absolute safe distance.
                let depthOffset = 65;
                if (this.currentStyle === 'grid') {
                    depthOffset = 65 + Math.max(0, this.camera.position.z - 14);
                }
                activeGroup.position.z = this.camera.position.z - depthOffset; 
            }
        }

        // ---------------------------------------------------------
        // 3. Update Cover Meshes
        // ---------------------------------------------------------
        if (this.meshes.length > 0) {
            this.meshes.forEach((mesh, i) => {
                const dist = mesh.userData.baseX - (this.currentStyle === 'grid' ? 0 : this.camera.position.x);
                
                mesh.visible = true; 
                let targetY = 0;
                let targetZ = 0;
                let targetRotX = 0;
                let targetRotY = 0;
                let targetRotZ = 0;

                const spacing = 5.5; 

                if (this.currentStyle === 'aurora') {
                    mesh.position.x = mesh.userData.baseX;
                    targetZ = -Math.abs(dist) * 0.8;
                    targetRotY = -dist * 0.15;
                }
                else if (this.currentStyle === 'aurora-inward') {
                    if (i === this.currentIndex) {
                        mesh.position.x = mesh.userData.baseX;
                        targetZ = 0;
                        targetRotY = 0;
                    } else {
                        targetZ = -Math.abs(dist) * 0.8;
                        targetRotY = dist > 0 ? -1.2 : 1.2;
                        mesh.position.x = mesh.userData.baseX - (Math.sign(dist) * 1.5);
                    }
                }
                else if (this.currentStyle === 'linear') {
                    mesh.position.x = mesh.userData.baseX;
                    targetZ = (i === this.currentIndex) ? 0.5 : 0;
                } 
                else if (this.currentStyle === 'grid') {
                    const col = i % this.gridColumns;
                    const row = Math.floor(i / this.gridColumns);
                    
                    const spacingX = 4.2 * this.gridScale;
                    const spacingY = 5.5 * this.gridScale;

                    mesh.position.x = (col - (this.gridColumns - 1) / 2) * spacingX;
                    targetY = -(row * spacingY);
                    targetZ = 0;
                    targetRotX = 0;
                    targetRotY = 0;
                    targetRotZ = 0;
                }
                else if (this.currentStyle === 'carousel') {
                    const totalItems = Math.max(12, this.meshes.length);
                    const circumference = totalItems * spacing; 
                    const radius = circumference / (2 * Math.PI);
                    const anglePerItem = (2 * Math.PI) / totalItems;
                    
                    const normalized = dist / spacing; 
                    const angle = normalized * anglePerItem;
                    
                    mesh.position.x = this.camera.position.x + Math.sin(angle) * radius;
                    targetZ = Math.cos(angle) * radius - radius; 
                    targetRotY = angle;
                }
                else if (this.currentStyle === 'wheel') {
                    const normalized = dist / spacing;
                    const angle = normalized * 0.4;
                    const radius = 13;

                    mesh.position.x = this.camera.position.x; 
                    targetY = -Math.sin(angle) * radius;
                    targetZ = Math.cos(angle) * radius - radius;
                    targetZ -= Math.abs(normalized) * 1.5; 

                    targetRotX = angle;

                    if (Math.abs(normalized) > 9) {
                        mesh.visible = false;
                    }
                }
                else if (this.currentStyle === 'rolodex') {
                    const normalized = dist / spacing;
                    mesh.position.x = this.camera.position.x + (normalized * 2.5); 
                    targetY = -Math.abs(normalized) * 1.5; 
                    targetZ = -Math.abs(normalized) * 3; 
                    targetRotY = 0;
                }
                else if (this.currentStyle === 'pyramid') {
                     const normalized = dist / spacing;
                     mesh.position.x = mesh.userData.baseX;
                     targetY = -Math.abs(normalized) * 2; 
                     targetZ = -Math.abs(normalized) * 2; 
                }
                else if (this.currentStyle === 'flock') {
                    mesh.position.x = mesh.userData.baseX;
                    targetY = Math.sin(dist * 0.3) * 2.5; 
                    targetZ = Math.cos(dist * 0.3) * 4 - 6; 
                    targetRotX = Math.sin(dist * 0.3) * 0.3; 
                    targetRotZ = Math.cos(dist * 0.3) * 0.1; 
                    if (i !== this.currentIndex) targetY += (i % 2 === 0 ? 0.5 : -0.5);
                }
                else if (this.currentStyle === 'spiral') {
                    const spiralAngle = dist * 0.2;
                    mesh.position.x = this.camera.position.x + dist; 
                    targetY = Math.sin(spiralAngle) * 5;
                    targetZ = Math.cos(spiralAngle) * 5 - 8;
                    targetRotX = spiralAngle; 
                }

                if (mesh.visible) {
                    mesh.position.y += (targetY - mesh.position.y) * 0.1;
                    mesh.position.z += (targetZ - mesh.position.z) * 0.1;
                    
                    mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.1;
                    mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.1;
                    mesh.rotation.z += (targetRotZ - mesh.rotation.z) * 0.1;
                    
                    let scaleMult = (this.currentStyle === 'grid') ? this.gridScale : 1.0;
                    const targetScale = (i === this.currentIndex) ? 1.05 * scaleMult : 1.0 * scaleMult;
                    mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

                    mesh.children.forEach(child => {
                        if (child.userData.isGlow) {
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