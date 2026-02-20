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
        this.targetCameraX = 0;
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
        indicator.innerHTML = '&#9654;';
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
            btn.innerText = text;
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
        saveBtn.innerText = 'Save';
        saveBtn.style.cssText = baseBtnStyle;
        
        const exitBtn = document.createElement('button');
        exitBtn.innerText = 'Exit';
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
        
        // --- HTML CONTENT FOR PANELS ---
        contentCol.innerHTML = `
            <!-- 1. STYLE TAB -->
            <div id="cf-tab-coverflow" class="cf-tab-panel" style="display: flex; flex-direction: column; height: 100%;">
                <h2 style="font-size: 1.1rem; margin-top: 0; border-bottom: 1px solid ${themeCol}; padding-bottom: 10px; text-transform: uppercase; text-shadow: 0 0 5px ${themeCol}; letter-spacing: 2px;">Coverflow Style</h2>
                <div style="margin-top: 25px;">
                    <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer; font-size: 0.85rem;">
                        <input type="radio" name="cf-style" value="aurora" style="accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);"> Aurora (Curved)
                    </label>
                    <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer; font-size: 0.85rem;">
                        <input type="radio" name="cf-style" value="linear" style="accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);"> Linear (Flat)
                    </label>
                    <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer; font-size: 0.85rem;">
                        <input type="radio" name="cf-style" value="carousel" style="accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);"> Carousel (Circular)
                    </label>
                    <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer; font-size: 0.85rem;">
                        <input type="radio" name="cf-style" value="flock" style="accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);"> Flock (Organic)
                    </label>
                    <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer; font-size: 0.85rem;">
                        <input type="radio" name="cf-style" value="spiral" style="accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);"> Spiral (Helix)
                    </label>
                </div>
            </div>

            <!-- 2. BACKGROUNDS TAB -->
            <div id="cf-tab-backgrounds" class="cf-tab-panel" style="display: none; flex-direction: column; height: 100%;">
                <h2 style="font-size: 1.1rem; margin-top: 0; border-bottom: 1px solid ${themeCol}; padding-bottom: 10px; text-transform: uppercase; text-shadow: 0 0 5px ${themeCol}; letter-spacing: 2px;">Environment</h2>
                <div style="margin-top: 25px;">
                    <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer; font-size: 0.85rem;">
                        <input type="radio" name="cf-bg" value="default" style="accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);"> Default (Theme Gradient)
                    </label>
                    
                    <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <label style="display: flex; align-items: center; cursor: pointer; font-size: 0.85rem; margin-right: 10px;">
                            <input type="radio" name="cf-bg" value="rain" style="accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);"> Zion Matrix Rain
                        </label>
                        <!-- INDEPENDENT RAIN COLOR PICKER -->
                        <input type="color" id="cf-rain-color-picker" value="${this.customRainColor}" 
                            style="background: transparent; border: 1px solid ${themeCol}; height: 25px; width: 40px; cursor: pointer; padding: 0;">
                    </div>

                    <!-- RAIN SPEED SLIDER -->
                    <div id="cf-rain-speed-container" style="margin-left: 28px; margin-bottom: 20px; opacity: 0.5; transition: opacity 0.3s;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 5px;">
                            <span>SPEED</span>
                            <span id="cf-rain-speed-val">${this.rainSpeed}ms</span>
                        </div>
                        <input type="range" id="cf-rain-speed-slider" min="10" max="200" step="5" value="${this.rainSpeed}" 
                        style="width: 100%; accent-color: ${themeCol}; cursor: pointer;">
                    </div>
                </div>
            </div>

            <!-- 3. COVERS TAB (ROUNDING ENGINE) -->
            <div id="cf-tab-covers" class="cf-tab-panel" style="display: none; flex-direction: column; height: 100%;">
                <h2 style="font-size: 1.1rem; margin-top: 0; border-bottom: 1px solid ${themeCol}; padding-bottom: 10px; text-transform: uppercase; text-shadow: 0 0 5px ${themeCol}; letter-spacing: 2px;">Cover Geometry</h2>
                <div style="margin-top: 25px;">
                    <label style="display: flex; align-items: center; margin-bottom: 20px; cursor: pointer; font-size: 0.85rem;">
                        <input type="checkbox" id="cf-rounding-toggle" ${this.enableRounding ? 'checked' : ''} style="accent-color: ${themeCol}; margin-right: 12px; transform: scale(1.2);"> Enable Rounded Corners
                    </label>
                    
                    <label style="font-size: 0.8rem; text-transform: uppercase; margin-bottom: 8px; display: block;">Corner Radius</label>
                    <input type="range" id="cf-radius-slider" min="0" max="0.5" step="0.05" value="${this.coverRadius}" 
                        style="width: 100%; accent-color: ${themeCol}; margin-bottom: 10px;">
                </div>
            </div>
        `;

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
            rainSpeedVal.innerText = this.rainSpeed + 'ms';
        });

        // Rounding Engine (Live Update)
        const roundToggle = document.getElementById('cf-rounding-toggle');
        const radiusSlider = document.getElementById('cf-radius-slider');
        
        const updateGeometry = () => {
            this.enableRounding = roundToggle.checked;
            this.coverRadius = parseFloat(radiusSlider.value);
            this.buildGallery(); // Re-generate meshes on the fly
        };

        roundToggle.addEventListener('change', updateGeometry);
        radiusSlider.addEventListener('input', updateGeometry);

        // --- BUTTON ACTIONS ---
        saveBtn.addEventListener('click', () => {
            localStorage.setItem('matrix-coverflow-style', this.currentStyle);
            localStorage.setItem('matrix-coverflow-bg', this.currentBg);
            localStorage.setItem('matrix-coverflow-rain-color', this.customRainColor);
            localStorage.setItem('matrix-coverflow-rain-speed', this.rainSpeed);
            localStorage.setItem('matrix-coverflow-rounding', this.enableRounding);
            localStorage.setItem('matrix-coverflow-radius', this.coverRadius);
            
            // Visual feedback
            const originalText = saveBtn.innerText;
            saveBtn.innerText = 'SAVED';
            setTimeout(() => saveBtn.innerText = originalText, 1000);
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
        const reflectionMat = new THREE.MeshStandardMaterial({ 
            map: texture, opacity: 0.15, transparent: true, side: THREE.DoubleSide 
        });
        const reflection = new THREE.Mesh(geometry, reflectionMat);
        reflection.position.set(0, -5.1, 0); 
        reflection.rotation.x = Math.PI;
        // Invert scale Y for reflection if it's a shape, though rotation handles it mostly.
        mesh.add(reflection);

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
                    
                    if (typeof showZionMessage === 'function') {
                        showZionMessage(`MOUNTING VIRTUAL DRIVE: ${data.romValue}...`);
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

                if (Math.abs(clickedMesh.userData.baseX - this.camera.position.x) < 1) {
                    this.launchGame(clickedMesh.userData);
                } else {
                    this.currentIndex = this.meshes.indexOf(clickedMesh);
                }
            }
        });

        window.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            if (e.key === "ArrowRight") this.navigate(1);
            if (e.key === "ArrowLeft") this.navigate(-1);
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

        // --- ANALOG STICK (Axis 0) ---
        const now = Date.now();
        // Throttle movement to prevent super-fast scrolling
        if (now - this.gpStickMoved > 150) { 
            if (gp.axes[0] > 0.5) {
                this.navigate(1);
                this.gpStickMoved = now;
            } else if (gp.axes[0] < -0.5) {
                this.navigate(-1);
                this.gpStickMoved = now;
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
            this.targetCameraX = this.meshes[this.currentIndex].userData.baseX;
            this.camera.position.x += (this.targetCameraX - this.camera.position.x) * 0.1;

            this.meshes.forEach((mesh, i) => {
                const dist = mesh.userData.baseX - this.camera.position.x;
                
                // RESET defaults
                let targetY = 0;
                let targetZ = 0;
                let targetRotX = 0;
                let targetRotY = 0;
                let targetRotZ = 0;

                if (this.currentStyle === 'aurora') {
                    mesh.position.x = mesh.userData.baseX;
                    targetZ = -Math.abs(dist) * 0.8;
                    targetRotY = -dist * 0.15;
                } 
                else if (this.currentStyle === 'linear') {
                    mesh.position.x = mesh.userData.baseX;
                    targetZ = (i === this.currentIndex) ? 0.5 : 0;
                } 
                else if (this.currentStyle === 'carousel') {
                    const angle = -dist * 0.15; 
                    mesh.position.x = this.camera.position.x + Math.sin(angle) * 12;
                    targetZ = Math.cos(angle) * 12 - 12; 
                    targetRotY = angle;
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
                        const targetOpacity = (i === this.currentIndex) ? 0.7 : 0.0;
                        child.material.opacity += (targetOpacity - child.material.opacity) * 0.15;
                    }
                    if (child.userData.isBorder) {
                        const targetOpacity = (i === this.currentIndex) ? 1.0 : 0.0;
                        child.material.opacity += (targetOpacity - child.material.opacity) * 0.15;
                    }
                });
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