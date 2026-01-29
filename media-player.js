/**
ZION MEDIA PLAYER 
*/

class ZionMediaPlayer {
    constructor() {
        this.container = document.getElementById('media-player-root');
        
        // Data Structure
        this.library = { music: [], video: [], playlists: [] };
        this.albums = {}; 
        
        // Navigation State
        this.currentView = 'video'; 
        this.musicNavState = { view: 'root', currentAlbum: null }; 
        this.sidebarOpen = true;

        // Media & Audio
        this.mediaElement = null;
        this.audioCtx = null;
        this.analyser = null;
        this.source = null;
        
        // Playback State
        this.currentTrackItem = null; 
        this.currentPlaylist = []; 
        
        // Visualizer State
        this.vizId = null;
        this.currentVizMode = 'matrix_rain'; 
        this.currentColorMode = 'theme';
        
        // WebGL State
        this.gl = null;
        this.program = null;
        this.audioTexture = null;
        this.startTime = Date.now();
        
        // Matrix Rain State
        this.rainStreams = [];
        this.matrixAlphabet = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";
        
        // Canvas Refs & Resize State
        this.canvas2d = null;
        this.canvasGl = null;
        this.ctx2d = null;
        this.resizeObserver = null;
        this.lastW = 0;
        this.lastH = 0;
        
        // UI State
        this.quickNavOpen = false;
        this.settingsOpen = false;
        this.quickNav = null;
        this.settingsPanel = null;
    
        this.init();
    }
    
    init() {
        this.renderLayout();
        this.attachGlobalListeners();
        this.matrixTexture = this.createHighResMatrixTexture();
        this.setupResizeObserver();
    }
    
    renderLayout() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="mp-layout">
                <div class="mp-sidebar" id="mp-sidebar">
                    <div class="mp-sidebar-content-wrapper">
                        <div class="mp-sidebar-header"><span class="mp-logo">MEDIA://DECK</span></div>
                        
                        <div class="mp-nav">
                            <button class="mp-nav-item active" id="nav-video">🎬 VIDEO_LIB</button>
                            <button class="mp-nav-item" id="nav-music">🎵 AUDIO_LIB</button>
                        </div>
    
                        <div class="mp-viz-section" style="padding: 10px; border-top: 1px solid rgba(0,255,65,0.2); margin-top: 10px;">
                            <div class="mp-section-title">HOLO_ENGINE</div>
                            <select id="mp-viz-select" class="mp-select">
                                <optgroup label="ZION NATIVE">
                                    <option value="matrix_rain">MATRIX_RAIN_3D</option>
                                </optgroup>
                                <optgroup label="WEBGL SHADERS">
                                    <option value="cyber_grid">RETRO_HORIZON</option>
                                    <option value="neon_vortex">WARP_TUNNEL</option>
                                    <option value="quantum_orb">QUANTUM_CORE</option>
                                </optgroup>
                                <optgroup label="STANDARD">
                                    <option value="bars">EQ_BARS</option>
                                    <option value="wave">WAVEFORM</option>
                                    <option value="reactor">REACTOR_RING</option>
                                </optgroup>
                                <option value="off">SYSTEM_OFF</option>
                            </select>
    
                            <div class="mp-section-title" style="margin-top:10px;">COLOR_MOD</div>
                            <select id="mp-color-select" class="mp-select">
                                <option value="theme">THEME_SYNC</option>
                                <option value="green">NEO_GREEN</option>
                                <option value="blue">CYBER_BLUE</option>
                                <option value="pink">HOT_PINK</option>
                                <option value="gold">GOLDEN_DATA</option>
                                <option value="rainbow">RAINBOW_MELT</option>
                                <option value="fire">FIRE_STORM</option>
                            </select>
                        </div>
    
                        <div class="mp-import-section">
                            <div class="mp-section-title">DATA_SOURCES</div>
                            <button id="mp-import-video" class="mp-action-btn">+ LINK VIDEO FOLDER</button>
                            <button id="mp-import-music" class="mp-action-btn">+ LINK MUSIC FOLDER</button>
                        </div>
                    </div>
                    
                    <div class="mp-status-panel">
                        <div>ITEMS: <span id="mp-total-items">0</span></div>
                        <div>STATUS: <span id="mp-status">IDLE</span></div>
                    </div>
                </div>
    
                <div class="mp-main">
                    <button id="mp-toggle-sidebar" class="mp-sidebar-toggle" title="Toggle Sidebar">«</button>
    
                    <div class="mp-player-stage" id="mp-player-stage">
                        <canvas id="mp-viz-2d" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; opacity: 0;"></canvas>
                        <canvas id="mp-viz-gl" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; opacity: 0;"></canvas>
                        
                        <div class="mp-placeholder">
                            <div class="mp-placeholder-icon">▶</div>
                            <div>SELECT MEDIA TO INITIALIZE STREAM</div>
                        </div>
                    </div>
                    
                    <div id="mp-quick-nav" class="hidden">
                        <div class="mp-quick-toolbar">
                            <button id="mp-quick-back" class="mp-back-btn" style="display:none;">« BACK</button>
                            <span id="mp-quick-title" class="mp-lib-title">LIBRARY</span>
                            <button id="mp-quick-close" class="mp-ctrl-btn" style="margin-left:auto;">✖</button>
                        </div>
                        <div id="mp-quick-content" class="mp-quick-content"></div>
                    </div>

                    <div id="mp-settings-panel" class="hidden">
                        <div class="mp-quick-toolbar">
                            <span class="mp-lib-title">SYSTEM CONFIG</span>
                            <button id="mp-settings-close" class="mp-ctrl-btn" style="margin-left:auto;">✖</button>
                        </div>
                        <div class="mp-settings-content">
                             <div class="mp-section-title">HOLO_ENGINE</div>
                             <select id="mp-viz-select-fs" class="mp-select">
                                <optgroup label="ZION NATIVE">
                                    <option value="matrix_rain">MATRIX_RAIN_3D</option>
                                </optgroup>
                                <optgroup label="WEBGL SHADERS">
                                    <option value="cyber_grid">RETRO_HORIZON</option>
                                    <option value="neon_vortex">WARP_TUNNEL</option>
                                    <option value="quantum_orb">QUANTUM_CORE</option>
                                </optgroup>
                                <optgroup label="STANDARD">
                                    <option value="bars">EQ_BARS</option>
                                    <option value="wave">WAVEFORM</option>
                                    <option value="reactor">REACTOR_RING</option>
                                </optgroup>
                                <option value="off">SYSTEM_OFF</option>
                             </select>

                             <div class="mp-section-title" style="margin-top:15px;">COLOR_MOD</div>
                             <select id="mp-color-select-fs" class="mp-select">
                                <option value="theme">THEME_SYNC</option>
                                <option value="green">NEO_GREEN</option>
                                <option value="blue">CYBER_BLUE</option>
                                <option value="pink">HOT_PINK</option>
                                <option value="gold">GOLDEN_DATA</option>
                                <option value="rainbow">RAINBOW_MELT</option>
                                <option value="fire">FIRE_STORM</option>
                             </select>
                        </div>
                    </div>
    
                    <div class="mp-controls-bar">
                        <button id="mp-play" class="mp-ctrl-btn">▶</button>
                        <div class="mp-progress-container">
                            <span id="mp-time-current">00:00</span>
                            <input type="range" id="mp-seek-bar" value="0" min="0" max="100">
                            <span id="mp-time-total">00:00</span>
                        </div>
    
                        <div id="mp-track-info" class="mp-track-info" title="Click to browse library"></div>
    
                        <div class="mp-vol-wrap">
                            <span>🔊</span>
                            <input type="range" id="mp-volume" min="0" max="1" step="0.1" value="0.8">
                        </div>
                        <button id="mp-settings-btn" class="mp-ctrl-btn" title="Settings">⚙️</button>
                        <button id="mp-fullscreen" class="mp-ctrl-btn" title="Fullscreen">⛶</button>
                    </div>
    
                    <div class="mp-library-toolbar" id="mp-library-toolbar" style="display:none;">
                        <button id="mp-lib-back" class="mp-back-btn">
                            <span style="font-size:1.2em; margin-right:5px;">«</span> BACK TO ALBUMS
                        </button>
                        <span id="mp-lib-title" class="mp-lib-title"></span>
                    </div>

                    <div class="mp-library-view" id="mp-library-view"></div>
                </div>
            </div>
        `;
    
        const style = document.createElement('style');
        style.textContent = `
            /* --- LAYOUT SIZING (COMPACT) --- */
            .mp-frame {
                box-shadow: 0 0 10px var(--theme-color) !important;
                border: 1px solid var(--theme-color) !important;
                width: 95vw !important; 
                height: 90vh !important; 
            }

            .mp-player-stage {
                flex: 0 0 35%; 
                min-height: 200px;
                border-bottom: 1px solid var(--theme-color);
                background: #000;
                position: relative;
            }
            
            /* --- FULLSCREEN FIXES --- */
            .mp-main:fullscreen .mp-library-toolbar,
            .mp-main:-webkit-full-screen .mp-library-toolbar {
                display: none !important;
            }

            .mp-main:fullscreen .mp-controls-bar,
            .mp-main:-webkit-full-screen .mp-controls-bar {
                background: rgba(0, 0, 0, 0.85) !important; 
                border-top: 1px solid var(--theme-color) !important;
                bottom: 0 !important;
                position: absolute !important;
                width: 100% !important;
                height: 65px !important;
                padding: 0 20px !important; 
                display: flex !important;
                align-items: center !important;
                box-sizing: border-box !important;
            }

            /* --- SLIDING MENUS (Quick Nav & Settings) --- */
            #mp-quick-nav, #mp-settings-panel {
                position: absolute;
                bottom: 65px; 
                left: 0;
                width: 100%;
                /* EXACT SAME COLOR AS CONTROL BAR */
                background: rgba(0, 0, 0, 0.85) !important; 
                border-top: 1px solid var(--theme-color);
                z-index: 150;
                display: flex;
                flex-direction: column;
                transition: transform 0.3s ease;
            }
            
            #mp-quick-nav { height: 60%; }
            #mp-settings-panel { height: 40%; } /* Shorter for settings */

            #mp-quick-nav.hidden, #mp-settings-panel.hidden {
                display: none !important;
            }

            .mp-quick-toolbar {
                padding: 10px 15px;
                border-bottom: 1px solid rgba(0,255,65,0.3);
                display: flex;
                align-items: center;
                background: rgba(0,20,0,0.8);
                flex-shrink: 0;
                height: 40px;
            }
            .mp-quick-content, .mp-settings-content {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
            }
            
            /* Specific to Quick Nav Grid */
            .mp-quick-content {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
                grid-auto-rows: min-content;
                gap: 15px;
                align-items: start;
            }

            /* --- CONTROLS & SIDEBAR --- */
            input[type=range] {
                -webkit-appearance: none;
                background: transparent;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
                margin: 0;
                padding: 0;
            }
            input[type=range]:focus {
                outline: none !important;
                border: none !important;
            }
            
            /* THUMB STYLING - Original Shape, Refined Glow */
            input[type=range]::-webkit-slider-thumb {
                -webkit-appearance: none;
                background: var(--theme-color) !important; 
                box-shadow: 0 0 5px var(--theme-color) !important; 
                height: 12px !important;
                width: 12px !important; 
                margin-top: -5px !important;
                border-radius: 50%;
                border: none !important;
                cursor: pointer;
                transform: scale(1);
                transition: all 0.1s ease;
            }

            input[type=range]::-webkit-slider-thumb:hover {
                box-shadow: 0 0 10px var(--theme-color) !important; 
                transform: scale(1.2) !important;
            }

            input[type=range]::-webkit-slider-runnable-track {
                width: 100%;
                height: 2px;
                background: rgba(0, 255, 65, 0.3);
                border: none;
            }
            
            #mp-volume { width: 80px; }
            #mp-seek-bar { flex-grow: 1; margin: 0 10px; }
    
            .mp-select { 
                width: 100%; background: rgba(0,20,0,0.8); 
                color: var(--theme-color); border: 1px solid var(--theme-color); 
                padding: 5px; font-family: 'Courier New'; outline: none; 
                text-transform: uppercase; font-size: 0.8rem; 
                margin-bottom: 5px; cursor: pointer; 
                border-radius: 6px; /* Rounded */
            }
            .mp-select option { background: #000; }
            
            .mp-sidebar-content-wrapper {
                flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column;
                scrollbar-width: thin; scrollbar-color: var(--theme-color) #000;
            }
            .mp-sidebar-content-wrapper::-webkit-scrollbar { width: 4px; }
            .mp-sidebar-content-wrapper::-webkit-scrollbar-thumb { background: var(--theme-color); }
            
            .mp-import-section { margin-top: auto; padding-bottom: 20px; }
            
            /* --- BUTTONS & TOGGLES (ROUNDED) --- */
            
            /* Sidebar Toggle */
            .mp-sidebar-toggle {
                border-radius: 50% !important; /* Made circular */
            }

            /* Nav Items */
            .mp-nav-item {
                border-radius: 6px;
            }

            /* Action Buttons */
            .mp-action-btn {
                border-radius: 6px;
            }

            /* Control Buttons (already circular, ensure consistent) */
            .mp-ctrl-btn {
                border-radius: 50%;
            }

            /* Back Buttons (Pill Shape) */
            .mp-back-btn {
                border-radius: 20px !important;
            }

            .mp-controls-bar {
                display: flex; align-items: center; 
                padding: 0 20px; 
                gap: 15px; 
                /* DEFAULT STATE */
                background: rgba(0, 0, 0, 0.85) !important; 
                border-top: 1px solid var(--theme-color);
                box-sizing: border-box; 
                width: 100%; 
                overflow: visible; 
                height: 65px; 
            }
    
            .mp-track-info {
                flex: 1; margin: 0 10px; white-space: nowrap; overflow: hidden;
                text-overflow: ellipsis; color: var(--theme-color); font-family: 'Orbitron', sans-serif;
                font-size: 0.75rem; text-align: center; letter-spacing: 1px;
                text-shadow: 0 0 5px var(--theme-color); opacity: 0.9; max-width: 300px; min-width: 0;
                cursor: pointer; 
                transition: text-shadow 0.2s;
            }
            .mp-track-info:hover {
                text-shadow: 0 0 10px var(--theme-color);
            }
    
            /* --- LIBRARY GRID (COMPACT) --- */
            .mp-library-view {
                flex: 1; overflow-y: auto; padding: 15px; display: grid;
                grid-template-columns: repeat(auto-fill, minmax(115px, 1fr)); 
                grid-auto-rows: min-content; gap: 15px; background: rgba(0, 0, 0, 0.5);
                align-items: start;
            }

            /* --- ALBUM CARD STYLES --- */
            .mp-album-card {
                background: rgba(0, 20, 0, 0.4); 
                border: 1px solid rgba(0, 255, 65, 0.3);
                cursor: pointer; 
                transition: all 0.2s ease;
                display: flex; 
                flex-direction: column; 
                position: relative;
                overflow: hidden; 
                height: auto; 
            }
    
            .mp-album-card:hover {
                background: rgba(0, 255, 65, 0.1); border-color: var(--theme-color);
                transform: translateY(-3px); 
                box-shadow: 0 0 12px rgba(0, 255, 65, 0.3);
            }

            .mp-card-thumb {
                width: 100%; 
                aspect-ratio: 1 / 1; 
                background: #000;
                border-bottom: 1px solid rgba(0,255,65,0.2);
                display: flex; align-items: center; justify-content: center;
                font-size: 1.5rem; 
                color: #333;
                overflow: hidden;
                flex-shrink: 0; 
            }

            .mp-card-thumb img { 
                width: 100%; 
                height: 100%; 
                object-fit: cover; 
                display: block; 
            }
            
            .mp-card-body {
                padding: 6px 4px; 
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                background: rgba(0,0,0,0.6);
                width: 100%;
                box-sizing: border-box;
            }
    
            .mp-card-title {
                color: #fff; font-family: 'Courier New', monospace; font-size: 0.7rem; 
                text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis;
                display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
                word-break: break-word; line-height: 1.2; 
                margin-bottom: 3px;
                font-weight: bold;
            }

            .mp-card-sub {
                font-size: 0.6rem; color: var(--theme-color); opacity: 0.8; 
                font-family: 'Orbitron', sans-serif; letter-spacing: 1px;
            }

            /* --- TRACK LIST STYLES --- */
            .mp-track-card {
                background: rgba(0, 20, 0, 0.2);
                border: 1px solid rgba(0, 255, 65, 0.1);
                padding: 5px 10px; 
                cursor: pointer;
                display: flex;
                align-items: center;
                transition: all 0.2s ease;
                min-height: 32px; 
            }
            
            .mp-track-card:hover {
                background: rgba(0, 255, 65, 0.1);
                border-color: var(--theme-color);
                padding-left: 15px;
            }

            /* --- MULTI-DISC LAYOUT --- */
            .mp-disc-header {
                font-family: 'Orbitron', sans-serif;
                color: var(--theme-color);
                font-size: 0.9rem;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid rgba(0,255,65,0.3);
                font-weight: bold;
            }

            /* --- TOOLBAR --- */
            .mp-library-toolbar {
                display: flex; align-items: center; padding: 8px;
                background: rgba(0,20,0,0.8); border-bottom: 1px solid var(--theme-color);
                width: 100%; box-sizing: border-box;
                height: 40px;
            }

            .mp-back-btn {
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid var(--theme-color);
                color: var(--theme-color);
                padding: 5px 15px;
                font-family: 'Orbitron', sans-serif;
                font-size: 0.7rem;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                white-space: nowrap; 
                text-transform: uppercase;
                transition: all 0.2s ease;
                justify-content: center;
            }

            .mp-back-btn:hover {
                background: var(--theme-color);
                color: #000;
                box-shadow: 0 0 10px var(--theme-color);
            }

            .mp-lib-title {
                margin-left: 15px;
                color: var(--theme-color);
                font-family: 'Orbitron', sans-serif;
                font-weight: bold;
                font-size: 0.9rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `;
        this.container.appendChild(style);
    
        this.sidebar = document.getElementById('mp-sidebar');
        this.libraryView = document.getElementById('mp-library-view');
        this.playerStage = document.getElementById('mp-player-stage');
        this.playBtn = document.getElementById('mp-play');
        this.seekBar = document.getElementById('mp-seek-bar');
        this.statusEl = document.getElementById('mp-status');
        this.trackInfoEl = document.getElementById('mp-track-info');
        this.toolbar = document.getElementById('mp-library-toolbar');
        this.toolbarBack = document.getElementById('mp-lib-back');
        this.toolbarTitle = document.getElementById('mp-lib-title');
        
        // Quick Nav Elements
        this.quickNav = document.getElementById('mp-quick-nav');
        this.quickNavContent = document.getElementById('mp-quick-content');
        this.quickNavTitle = document.getElementById('mp-quick-title');
        this.quickNavBack = document.getElementById('mp-quick-back');
        
        // Settings Elements
        this.settingsPanel = document.getElementById('mp-settings-panel');
        this.settingsBtn = document.getElementById('mp-settings-btn');
        this.vizSelectFS = document.getElementById('mp-viz-select-fs');
        this.colorSelectFS = document.getElementById('mp-color-select-fs');
        
        this.canvas2d = document.getElementById('mp-viz-2d');
        this.ctx2d = this.canvas2d.getContext('2d');
        this.canvasGl = document.getElementById('mp-viz-gl');
    }
    
    attachGlobalListeners() {
        document.getElementById('nav-video').addEventListener('click', () => this.switchView('video'));
        document.getElementById('nav-music').addEventListener('click', () => this.switchView('music'));
    
        document.getElementById('mp-toggle-sidebar').addEventListener('click', () => {
            this.sidebarOpen = !this.sidebarOpen;
            this.sidebar.classList.toggle('collapsed', !this.sidebarOpen);
            document.getElementById('mp-toggle-sidebar').textContent = this.sidebarOpen ? "«" : "»";
        });
    
        document.getElementById('mp-import-video').addEventListener('click', () => this.handleFolderImport('video'));
        document.getElementById('mp-import-music').addEventListener('click', () => this.handleFolderImport('music'));
        
        // Sidebar Selects
        const sidebarVizSelect = document.getElementById('mp-viz-select');
        const sidebarColorSelect = document.getElementById('mp-color-select');

        sidebarVizSelect.addEventListener('change', (e) => {
            this.setVisualizerMode(e.target.value);
            // Sync Fullscreen Select
            if(this.vizSelectFS) this.vizSelectFS.value = e.target.value;
        });
        sidebarColorSelect.addEventListener('change', (e) => {
            this.currentColorMode = e.target.value;
            // Sync Fullscreen Select
            if(this.colorSelectFS) this.colorSelectFS.value = e.target.value;
        });
    
        this.playBtn.addEventListener('click', () => this.togglePlay());
        document.getElementById('mp-volume').addEventListener('input', (e) => { if(this.mediaElement) this.mediaElement.volume = e.target.value; });
        
        document.getElementById('mp-fullscreen').addEventListener('click', () => {
            const mainPanel = this.container.querySelector('.mp-main');
            if (!document.fullscreenElement) {
                if (mainPanel.requestFullscreen) mainPanel.requestFullscreen();
                else if (mainPanel.webkitRequestFullscreen) mainPanel.webkitRequestFullscreen();
            } else if (document.exitFullscreen) document.exitFullscreen();
        });
    
        this.seekBar.addEventListener('input', (e) => {
            if(this.mediaElement && this.mediaElement.duration) {
                const time = (e.target.value / 100) * this.mediaElement.duration;
                this.mediaElement.currentTime = time;
            }
        });

        this.toolbarBack.addEventListener('click', () => {
            if (this.currentView === 'music') {
                this.musicNavState.view = 'root';
                this.musicNavState.currentAlbum = null;
                this.renderLibrary();
                if(this.quickNavOpen) this.renderQuickNav(); // Sync
            }
        });
        
        // Quick Nav Listeners
        this.trackInfoEl.addEventListener('click', () => {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                this.toggleQuickNav();
            }
        });
        
        document.getElementById('mp-quick-close').addEventListener('click', () => {
            this.quickNav.classList.add('hidden');
            this.quickNavOpen = false;
        });
        
        this.quickNavBack.addEventListener('click', () => {
            if (this.currentView === 'music') {
                this.musicNavState.view = 'root';
                this.musicNavState.currentAlbum = null;
                this.renderQuickNav();
                this.renderLibrary(); // Sync main view
            }
        });

        // Settings Listeners
        this.settingsBtn.addEventListener('click', () => {
             this.settingsOpen = !this.settingsOpen;
             if(this.settingsOpen) {
                 this.settingsPanel.classList.remove('hidden');
                 // Ensure Close Quick Nav if open
                 if(this.quickNavOpen) {
                     this.quickNav.classList.add('hidden');
                     this.quickNavOpen = false;
                 }
             } else {
                 this.settingsPanel.classList.add('hidden');
             }
        });

        document.getElementById('mp-settings-close').addEventListener('click', () => {
            this.settingsPanel.classList.add('hidden');
            this.settingsOpen = false;
        });

        // Fullscreen Settings Inputs (Sync back to sidebar)
        this.vizSelectFS.addEventListener('change', (e) => {
            this.setVisualizerMode(e.target.value);
            sidebarVizSelect.value = e.target.value;
        });
        this.colorSelectFS.addEventListener('change', (e) => {
            this.currentColorMode = e.target.value;
            sidebarColorSelect.value = e.target.value;
        });
        
        // Listen for fullscreen exit to close menus
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                if(this.quickNavOpen) {
                    this.quickNav.classList.add('hidden');
                    this.quickNavOpen = false;
                }
                if(this.settingsOpen) {
                    this.settingsPanel.classList.add('hidden');
                    this.settingsOpen = false;
                }
            }
        });
        document.addEventListener('webkitfullscreenchange', () => {
             if (!document.webkitFullscreenElement) {
                if(this.quickNavOpen) {
                    this.quickNav.classList.add('hidden');
                    this.quickNavOpen = false;
                }
                if(this.settingsOpen) {
                    this.settingsPanel.classList.add('hidden');
                    this.settingsOpen = false;
                }
             }
        });
    }
    
    toggleQuickNav() {
        this.quickNavOpen = !this.quickNavOpen;
        if (this.quickNavOpen) {
            this.quickNav.classList.remove('hidden');
            // Close settings if open
            if(this.settingsOpen) {
                this.settingsPanel.classList.add('hidden');
                this.settingsOpen = false;
            }
            this.renderQuickNav();
        } else {
            this.quickNav.classList.add('hidden');
        }
    }
    
    renderQuickNav() {
        if (!this.quickNavOpen) return;
        
        this.quickNavContent.innerHTML = "";
        
        // Video View
        if (this.currentView === 'video') {
            this.quickNavBack.style.display = 'none';
            this.quickNavTitle.textContent = "VIDEO LIBRARY";
            this.quickNavContent.style.gridTemplateColumns = "repeat(auto-fill, minmax(150px, 1fr))";
            this.quickNavContent.style.display = "grid";
            this.renderFlatList(this.library.video, 'video', null, this.quickNavContent);
            return;
        }
        
        // Music View
        if (this.musicNavState.view === 'root') {
            this.quickNavBack.style.display = 'none';
            this.quickNavTitle.textContent = "ALBUM LIBRARY";
            
            // FIX: Explicitly set grid display when returning to root
            this.quickNavContent.style.display = "grid";
            this.quickNavContent.style.gridTemplateColumns = "repeat(auto-fill, minmax(115px, 1fr))"; 
            this.quickNavContent.style.gap = "15px";
            this.quickNavContent.style.alignItems = "start";
            
            this.renderAlbumGrid(this.quickNavContent);
        } else {
            this.quickNavBack.style.display = 'inline-flex';
            this.quickNavTitle.textContent = this.musicNavState.currentAlbum || "Unknown Album";
            
            // Force list mode for tracks
            this.quickNavContent.style.display = "flex";
            this.quickNavContent.style.flexDirection = "column";
            this.quickNavContent.style.gap = "5px";
            
            const albumData = this.albums[this.musicNavState.currentAlbum];
            if (albumData) {
                // Re-use sorting logic
                const discGroups = {};
                albumData.tracks.forEach(track => {
                    const discName = track.subPath || "Tracks";
                    if (!discGroups[discName]) discGroups[discName] = [];
                    discGroups[discName].push(track);
                });
                const discNames = Object.keys(discGroups).sort();

                if (discNames.length > 1) {
                     this.quickNavContent.style.display = "grid";
                     this.quickNavContent.style.gridTemplateColumns = "repeat(auto-fit, minmax(200px, 1fr))"; 
                     this.quickNavContent.style.gap = "20px";
                     this.quickNavContent.style.alignItems = "start";

                     discNames.forEach(discName => {
                         const tracks = discGroups[discName];
                         tracks.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
                         const discContainer = document.createElement('div');
                         discContainer.innerHTML = `<div class="mp-disc-header">${discName}</div>`;
                         this.renderFlatList(tracks, 'music', albumData.tracks, discContainer);
                         this.quickNavContent.appendChild(discContainer);
                     });
                } else {
                    const sortedTracks = [...albumData.tracks].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
                    this.renderFlatList(sortedTracks, 'music', sortedTracks, this.quickNavContent); 
                }
            }
        }
    }
    
    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const width = Math.floor(entry.contentRect.width);
                const height = Math.floor(entry.contentRect.height);
                if (Math.abs(width - this.lastW) < 20 && Math.abs(height - this.lastH) < 20) return;
                this.lastW = width; this.lastH = height;
    
                if (this.canvas2d) {
                    this.canvas2d.width = width; this.canvas2d.height = height;
                    if (this.currentVizMode === 'matrix_rain') {
                        const req = Math.floor(width / 14) * 2;
                        if (this.rainStreams.length < req * 0.8) this.initMatrixRainStreams(width, height);
                    }
                }
                if (this.canvasGl) {
                    this.canvasGl.width = width; this.canvasGl.height = height;
                    if (this.gl) this.gl.viewport(0, 0, width, height);
                }
            }
        });
        this.resizeObserver.observe(this.playerStage);
    }
    
    async handleFolderImport(type) {
        if (window.showDirectoryPicker) {
            try {
                const handle = await window.showDirectoryPicker();
                this.statusEl.textContent = "SCANNING...";
                
                if (type === 'music') {
                    // Reset albums when importing new music folder
                    this.albums = {}; 
                    this.library.music = [];
                    // Start scanning. We treat the top-level folders as the "Albums" context.
                    await this.scanMusicRoot(handle);
                } else {
                    const files = [];
                    for await (const entry of this.scanDir(handle)) {
                        if (this.isMediaType(entry.name, type)) {
                            files.push({ name: entry.name, handle: entry, type: type, method: 'modern' });
                        }
                    }
                    this.library[type] = [...this.library[type], ...files];
                }
                this.finishImport(type);
            } catch (e) {
                console.log(e);
                if (e.name !== 'AbortError') this.triggerInputFallback(type);
            }
        } else this.triggerInputFallback(type);
    }

    async scanMusicRoot(rootHandle) {
        for await (const entry of rootHandle.values()) {
            if (entry.kind === 'file') {
                // Files in the root folder (misc tracks)
                if (this.isMediaType(entry.name, 'music')) {
                    this.addTrackToAlbum('Unsorted/Misc', entry, 'modern');
                }
            } else if (entry.kind === 'directory') {
                await this.scanAlbumRecursively(entry, entry.name);
            }
        }
    }

    async scanAlbumRecursively(dirHandle, albumName, subPath = "") {
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
                if (this.isMediaType(entry.name, 'music')) {
                    this.addTrackToAlbum(albumName, entry, 'modern', subPath);
                } else if (this.isImageFile(entry.name)) {
                    this.setAlbumCover(albumName, entry);
                }
            } else if (entry.kind === 'directory') {
                const newSub = subPath ? `${subPath}/${entry.name}` : entry.name;
                await this.scanAlbumRecursively(entry, albumName, newSub);
            }
        }
    }

    addTrackToAlbum(albumName, handle, method, subPath = "") {
        // Init album if missing
        if (!this.albums[albumName]) {
            this.albums[albumName] = { cover: null, tracks: [] };
        }
        
        const trackObj = { 
            name: handle.name, 
            handle: method === 'modern' ? handle : null, 
            file: method === 'legacy' ? handle : null,
            type: 'music', 
            method: method, 
            album: albumName,
            subPath: subPath // Store "CD1" etc.
        };

        this.albums[albumName].tracks.push(trackObj);
        this.library.music.push(trackObj); // Keep in global flat list too
    }

    async setAlbumCover(albumName, handle) {
        // Fix: Initialize album if it doesn't exist yet so cover isn't skipped
        if (!this.albums[albumName]) {
            this.albums[albumName] = { cover: null, tracks: [] };
        }

        if (!this.albums[albumName].cover) {
            try {
                // If we already have a file object (legacy) or handle (modern)
                const file = handle.getFile ? await handle.getFile() : handle;
                this.albums[albumName].cover = URL.createObjectURL(file);
            } catch(e) {}
        }
    }
    
    triggerInputFallback(type) {
        const input = document.createElement('input');
        input.type = 'file'; input.webkitdirectory = true; input.multiple = true;
        input.style.position = 'fixed'; input.style.top = '-1000px'; input.style.opacity = '0';
        input.onchange = (e) => {
            const files = [];
            this.statusEl.textContent = "PARSING...";
            
            if (type === 'music') {
                this.albums = {}; 
                this.library.music = [];
                Array.from(e.target.files).forEach(file => {
                    if (this.isMediaType(file.name, type)) {
                        // Extract folder name from relative path
                        const pathParts = file.webkitRelativePath.split('/');
                        let albumName = "Unknown Album";
                        let subPath = "";
                        
                        if (pathParts.length > 2) {
                            albumName = pathParts[1]; // Use the top-level folder inside the selection
                            if (pathParts.length > 3) {
                                subPath = pathParts[pathParts.length - 2];
                                if(subPath === albumName) subPath = "";
                            }
                        } else if (pathParts.length === 2) {
                             albumName = "Unsorted"; // Files at root
                        }

                        this.addTrackToAlbum(albumName, file, 'legacy', subPath);
                    } else if (this.isImageFile(file.name)) {
                        const pathParts = file.webkitRelativePath.split('/');
                        let albumName = "Unknown Album";
                        if (pathParts.length > 2) albumName = pathParts[1];
                        this.setAlbumCover(albumName, file);
                    }
                });
            } else {
                Array.from(e.target.files).forEach(file => {
                    if (this.isMediaType(file.name, type)) {
                        files.push({ name: file.name, file: file, type: type, method: 'legacy' });
                    }
                });
                this.library[type] = [...this.library[type], ...files];
            }
            this.finishImport(type);
            document.body.removeChild(input);
        };
        document.body.appendChild(input);
        setTimeout(() => input.click(), 10);
    }
    
    finishImport(type) {
        this.statusEl.textContent = "SYNCED";
        document.getElementById('mp-total-items').textContent = this.library.music.length + this.library.video.length;
        
        // Return to root if refreshing
        if (type === 'music') {
            this.musicNavState.view = 'root';
            this.musicNavState.currentAlbum = null;
        }
        this.renderLibrary();
    }
    
    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.mp-nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`nav-${view}`).classList.add('active');
        
        // Reset nav state on switch
        if (view === 'music') {
            this.musicNavState.view = 'root';
            this.musicNavState.currentAlbum = null;
        }
        
        this.renderLibrary();
    }
    
    async *scanDir(dirHandle) {
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
                if(entry.name !== '.DS_Store' && entry.name.substr(0, 2) !== '._') yield entry;
            }
            else if (entry.kind === 'directory') yield* this.scanDir(entry);
        }
    }
    
    isMediaType(name, type) {
        const ext = name.split('.').pop().toLowerCase();
        if (type === 'video') return ['mp4', 'mkv', 'webm', 'avi', 'mov'].includes(ext);
        if (type === 'music') return ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext);
        return false;
    }

    isImageFile(name) {
        const ext = name.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
    }
    
    renderLibrary() {
        this.libraryView.innerHTML = "";
        
        if (this.currentView === 'video') {
            this.toolbar.style.display = 'none';
            this.libraryView.style.gridTemplateColumns = "repeat(auto-fill, minmax(180px, 1fr))";
            this.libraryView.style.display = "grid";
            this.renderFlatList(this.library.video, 'video');
            return;
        }
        
        // Music Logic
        if (this.musicNavState.view === 'root') {
            this.toolbar.style.display = 'none';
            this.libraryView.style.gridTemplateColumns = ""; 
            this.renderAlbumGrid();
        } 
        else if (this.musicNavState.view === 'album') {
            this.toolbar.style.display = 'flex';
            this.toolbarTitle.textContent = this.musicNavState.currentAlbum || "Unknown Album";
            const albumData = this.albums[this.musicNavState.currentAlbum];
            
            // Switch to List View for tracks
            
            if (albumData) {
                // Group tracks by Disc (subPath)
                const discGroups = {};
                albumData.tracks.forEach(track => {
                    const discName = track.subPath || "Tracks";
                    if (!discGroups[discName]) discGroups[discName] = [];
                    discGroups[discName].push(track);
                });

                const discNames = Object.keys(discGroups).sort();

                if (discNames.length > 1) {
                     // MULTI-DISC LAYOUT (Side-by-Side Grid)
                     this.libraryView.style.display = "grid";
                     this.libraryView.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, 1fr))"; 
                     this.libraryView.style.gap = "20px";
                     this.libraryView.style.alignItems = "start";

                     discNames.forEach(discName => {
                         const tracks = discGroups[discName];
                         // Sort within disc
                         tracks.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

                         const discContainer = document.createElement('div');
                         discContainer.innerHTML = `<div class="mp-disc-header">${discName}</div>`;
                         
                         // Render tracks into this disc container, but pass FULL album context for playback
                         this.renderFlatList(tracks, 'music', albumData.tracks, discContainer);
                         this.libraryView.appendChild(discContainer);
                     });

                } else {
                    // SINGLE DISC LAYOUT (Standard List)
                    this.libraryView.style.display = "flex";
                    this.libraryView.style.flexDirection = "column";
                    this.libraryView.style.gap = "5px";
                    
                    const sortedTracks = [...albumData.tracks].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
                    this.renderFlatList(sortedTracks, 'music', sortedTracks); 
                }
            }
        }
    }

    renderAlbumGrid(targetContainer = null) {
        const container = targetContainer || this.libraryView;
        if(!targetContainer) {
            this.libraryView.style.display = "grid";
            this.libraryView.style.gap = "15px"; 
        }

        const albumNames = Object.keys(this.albums);
        if (albumNames.length === 0) {
            container.innerHTML = `<div class="mp-empty-state">NO AUDIO DATA FOUND.<br>PLEASE LINK A LOCAL FOLDER CONTAINING MUSIC.</div>`;
            return;
        }

        albumNames.forEach(name => {
            const album = this.albums[name];
            // Skip empty albums if they somehow exist
            if (album.tracks.length === 0) return;

            const card = document.createElement('div');
            card.className = 'mp-album-card'; 
            
            // Cover Art Logic
            let thumbContent = `<div style="font-size:2rem;">🎵</div>`;
            if (album.cover) {
                thumbContent = `<img src="${album.cover}" alt="Cover">`;
            }

            card.innerHTML = `
                <div class="mp-card-thumb">${thumbContent}</div>
                <div class="mp-card-body">
                    <div class="mp-card-title">${name}</div>
                    <div class="mp-card-sub">${album.tracks.length} TRACKS</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.musicNavState.view = 'album';
                this.musicNavState.currentAlbum = name;
                this.renderLibrary();
                if(this.quickNavOpen) this.renderQuickNav(); // Sync
            });
            container.appendChild(card);
        });
    }

    renderFlatList(items, type, contextList = null, targetContainer = null) {
        const container = targetContainer || this.libraryView;
        
        if (!items || items.length === 0) {
            container.innerHTML = `<div class="mp-empty-state">NO DATA FOUND.</div>`;
            return;
        }
        
        items.forEach((item) => {
            const card = document.createElement('div');
            // Use track card style for music tracks, regular for videos
            if (type === 'music') {
                card.className = 'mp-track-card';
                card.innerHTML = `
                    <div class="mp-card-icon" style="margin-right:15px; color: var(--theme-color); font-size: 1rem;">🎵</div>
                    <div class="mp-card-title" style="text-align:left; font-size: 0.8rem;">${item.name}</div>
                `;
            } else {
                // Video fallback to cards
                card.className = 'mp-album-card';
                card.innerHTML = `
                    <div class="mp-card-thumb" style="background:#111;"><div style="font-size:2rem;">🎬</div></div>
                    <div class="mp-card-body">
                        <div class="mp-card-title">${item.name}</div>
                    </div>
                `;
            }
            
            // If playing from a specific album, pass that album as the playlist context
            card.addEventListener('click', () => this.loadMedia(item, contextList || items));
            container.appendChild(card);
        });
    }
    
    setVisualizerMode(mode) {
        this.currentVizMode = mode;
        cancelAnimationFrame(this.vizId);
        this.canvas2d.style.opacity = '0';
        this.canvasGl.style.opacity = '0';
        if (mode === 'off') return;
    
        // Detection to stop visuals if app is hidden
        const modal = document.getElementById('media-player-modal');
        if (modal && modal.classList.contains('hidden')) return;
    
        const isWebGL = ['cyber_grid', 'neon_vortex', 'quantum_orb'].includes(mode);
        if (isWebGL) {
            this.canvasGl.style.opacity = '1';
            if (!this.gl) this.initWebGL(); 
            if (this.mediaElement && !this.mediaElement.paused) this.startWebGLVisualizer();
        } else {
            this.canvas2d.style.opacity = '1';
            if (this.mediaElement && !this.mediaElement.paused) {
                if (mode === 'matrix_rain') this.startMatrixRain();
                else this.start2DVisualizer();
            }
        }
    }
    
    getHexColor() {
        if (this.currentColorMode === 'theme') return getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
        const colors = {green:'#00ff41', blue:'#00f2ff', pink:'#ff0088', gold:'#ffaa00', fire:'#ff4400'};
        if (this.currentColorMode === 'rainbow') return `hsl(${Date.now() * 0.1 % 360}, 100%, 50%)`;
        return colors[this.currentColorMode] || '#00ff41';
    }
    
    getRGBColor() {
        const hex = this.getHexColor();
        const div = document.createElement('div'); div.style.color = hex; document.body.appendChild(div);
        const computed = getComputedStyle(div).color; document.body.removeChild(div);
        const match = computed.match(/\d+/g);
        return match ? { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) } : { r: 0, g: 255, b: 65 };
    }
    
    initMatrixRainStreams(w, h) {
        this.rainStreams = [];
        const count = Math.floor(w / 14) * 2;
        for (let i = 0; i < count; i++) {
            const depth = 0.2 + Math.random() * 0.8;
            this.rainStreams.push({
                x: Math.random() * w, y: Math.random() * -h, depth: depth,
                fontSize: Math.floor(10 + (1.5 - depth * 0.8) * 20),
                baseSpeed: 0.2 + (depth * 1.0), chars: []
            });
        }
    }
    
    startMatrixRain() {
        const canvas = this.canvas2d; const ctx = this.ctx2d;
        if (this.rainStreams.length === 0) this.initMatrixRainStreams(canvas.width, canvas.height);
        const render = () => {
            const modal = document.getElementById('media-player-modal');
            if (modal && modal.classList.contains('hidden')) { cancelAnimationFrame(this.vizId); return; }
            this.vizId = requestAnimationFrame(render);
            let bass = 0, mid = 0;
            if (this.analyser) {
                const data = new Uint8Array(this.analyser.frequencyBinCount);
                this.analyser.getByteFrequencyData(data);
                bass = data[5] / 255; mid = data[100] / 255;
            }
            ctx.shadowBlur = 0; ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.textBaseline = 'top'; ctx.textAlign = 'center';
            const hexColor = this.getHexColor();
            for (let s of this.rainStreams) {
                s.y += s.baseSpeed * (1 + bass * 0.8);
                if (s.y > canvas.height + 50) { s.y = -50; s.x = Math.random() * canvas.width; }
                ctx.font = `${s.fontSize}px 'Courier New', monospace`;
                const trailLen = Math.floor(5 + s.depth * 5);
                for (let j = 0; j < trailLen; j++) {
                    const charY = s.y - (j * s.fontSize * 0.8);
                    if (charY < -20 || charY > canvas.height) continue;
                    if (!s.chars[j] || Math.random() > 0.95) s.chars[j] = this.matrixAlphabet.charAt(Math.floor(Math.random() * this.matrixAlphabet.length));
                    const alpha = (1 - (j / trailLen)) * (0.3 + s.depth * 0.7);
                    ctx.globalAlpha = Math.min(alpha + (mid * 0.5), 1);
                    ctx.fillStyle = j === 0 ? "#ffffff" : hexColor;
                    ctx.shadowBlur = j === 0 ? 10 * s.depth : 0; ctx.shadowColor = hexColor;
                    ctx.fillText(s.chars[j], s.x, charY);
                }
            }
            ctx.globalAlpha = 1;
        };
        render();
    }
    
    createHighResMatrixTexture() {
        const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 1024;
        const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, 128, 1024);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center';
        for (let i = 0; i < 40; i++) {
            const char = this.matrixAlphabet.charAt(Math.floor(Math.random() * this.matrixAlphabet.length));
            ctx.globalAlpha = Math.pow(i / 40, 2); ctx.fillText(char, 64, i * 25.6 + 12);
        }
        return null; 
    }
    
    start2DVisualizer() {
        const ctx = this.ctx2d; const canvas = this.canvas2d;
        const render = () => {
            const modal = document.getElementById('media-player-modal');
            if (modal && modal.classList.contains('hidden')) { cancelAnimationFrame(this.vizId); return; }
            this.vizId = requestAnimationFrame(render);
            const data = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(data);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const color = this.getHexColor(); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.shadowBlur = 10; ctx.shadowColor = color;
            const cx = canvas.width / 2; const cy = canvas.height / 2;
            if (this.currentVizMode === 'bars') {
                const barWidth = (canvas.width / 2) / 64;
                for (let i = 0; i < 64; i++) {
                    const h = (data[i*4] / 255) * canvas.height * 0.6;
                    ctx.globalAlpha = 0.8;
                    ctx.fillRect(cx - (i * barWidth) - barWidth, cy - h/2, barWidth - 2, h);
                    ctx.fillRect(cx + (i * barWidth), cy - h/2, barWidth - 2, h);
                }
            } else if (this.currentVizMode === 'wave') {
                this.analyser.getByteTimeDomainData(data); ctx.lineWidth = 3; ctx.beginPath();
                const sw = canvas.width / data.length;
                for(let i = 0; i < data.length; i++) {
                    const y = (data[i] / 128.0) * (canvas.height / 2);
                    if(i === 0) ctx.moveTo(i*sw, y); else ctx.lineTo(i*sw, y);
                }
                ctx.stroke();
            } else if (this.currentVizMode === 'reactor') {
                const radius = Math.min(canvas.width, canvas.height) / 4;
                const scale = 1 + (data[5] / 255) * 0.3;
                ctx.translate(cx, cy); ctx.scale(scale, scale);
                for(let i = 0; i < 90; i++) {
                    const h = (data[i*2] / 255) * (radius * 0.8);
                    ctx.rotate((2 * Math.PI) / 90); ctx.fillRect(radius, -2, h, 4);
                }
                ctx.setTransform(1, 0, 0, 1, 0, 0); 
            }
        };
        render();
    }
    
    initWebGL() {
        this.gl = this.canvasGl.getContext('webgl'); if (!this.gl) return;
        this.audioTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.audioTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        const vs = this.createShader(this.gl.VERTEX_SHADER, `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`);
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, `precision mediump float; uniform float u_time; uniform vec2 u_resolution; uniform sampler2D u_audio; uniform int u_mode; uniform vec3 u_color; float getFreq(float f) { return texture2D(u_audio, vec2(f, 0.0)).r; } vec3 renderGrid(vec2 uv, float time) { vec3 ro = vec3(0.0, 1.0, time * 2.0); vec3 rd = normalize(vec3(uv.x, uv.y - 0.2, 1.0)); float t = 0.0; float dist = 0.0; vec3 p = vec3(0.0); float bass = getFreq(0.05); for(int i=0; i<40; i++) { p = ro + rd * t; float wave = sin(p.z * 0.5 + time) * cos(p.x * 0.5) * bass * 0.5; dist = p.y + 1.0 + wave; if(dist < 0.01 || t > 30.0) break; t += dist * 0.5; } vec3 col = vec3(0.0); if(t < 30.0) { float gx = step(0.95, fract(p.x)); float gz = step(0.95, fract(p.z)); float grid = max(gx, gz); float fog = 1.0 / (1.0 + t * t * 0.05); col = u_color * grid * fog * 2.0; } float sun = length(uv - vec2(0.0, 0.3)); if(sun < 0.2) col += vec3(1.0, 0.5, 0.0) * (1.0 - sun*5.0) + (bass * 0.5); return col; } vec3 renderVortex(vec2 uv, float time) { float r = length(uv); float a = atan(uv.y, uv.x); float bass = getFreq(0.1); float hex = abs(cos(a * 3.0 + time * 0.5)); r = r * (1.0 + hex * 0.2); float z = 1.0 / r + time * (1.0 + bass); float val = sin(z * 10.0) * sin(a * 6.0 + z); val += getFreq(smoothstep(0.0, 1.0, r)) * 2.0; vec3 col = u_color * abs(val) * r; col *= smoothstep(0.0, 0.4, length(uv)); return col; } vec3 renderOrb(vec2 uv, float time) { vec3 ro = vec3(0.0, 0.0, -2.5); vec3 rd = normalize(vec3(uv, 1.0)); float t = 0.0; vec3 p = vec3(0.0); float d = 0.0; float glow = 0.0; for(int i=0; i<30; i++) { p = ro + rd * t; float sphere = length(p) - 0.8; float spikes = sin(p.x*10.0+time)*sin(p.y*10.0+time)*sin(p.z*10.0+time); float audio = getFreq(0.2); d = sphere + spikes * 0.1 * audio; if(d < 0.01) break; glow += 0.02 / (0.01 + abs(d)); t += d * 0.5; } vec3 col = u_color * glow * 0.1; col += u_color * getFreq(0.5) * 0.5; return col; } void main() { vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y; vec3 col = vec3(0.0); if (u_mode == 1) col = renderGrid(uv, u_time); else if (u_mode == 2) col = renderVortex(uv, u_time); else if (u_mode == 3) col = renderOrb(uv, u_time); gl_FragColor = vec4(col, 1.0); }`);
        this.program = this.createProgram(vs, fs);
        const buf = this.gl.createBuffer(); this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), this.gl.STATIC_DRAW);
    }
    
    createShader(type, source) {
        const s = this.gl.createShader(type); this.gl.shaderSource(s, source); this.gl.compileShader(s);
        return this.gl.getShaderParameter(s, this.gl.COMPILE_STATUS) ? s : null;
    }
    
    createProgram(vs, fs) {
        const p = this.gl.createProgram(); this.gl.attachShader(p, vs); this.gl.attachShader(p, fs); this.gl.linkProgram(p);
        return p;
    }
    
    startWebGLVisualizer() {
        if (!this.program) return;
        const render = () => {
            const modal = document.getElementById('media-player-modal');
            if (modal && modal.classList.contains('hidden')) { cancelAnimationFrame(this.vizId); return; }
            this.vizId = requestAnimationFrame(render);
            const data = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(data);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.audioTexture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.LUMINANCE, data.length, 1, 0, this.gl.LUMINANCE, this.gl.UNSIGNED_BYTE, data);
            this.gl.useProgram(this.program);
            const pos = this.gl.getAttribLocation(this.program, "position");
            this.gl.enableVertexAttribArray(pos); this.gl.vertexAttribPointer(pos, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.uniform1f(this.gl.getUniformLocation(this.program, "u_time"), (Date.now() - this.startTime) / 1000);
            this.gl.uniform2f(this.gl.getUniformLocation(this.program, "u_resolution"), this.canvasGl.width, this.canvasGl.height);
            const modes = {'cyber_grid':1, 'neon_vortex':2, 'quantum_orb':3};
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, "u_mode"), modes[this.currentVizMode] || 1);
            const rgb = this.getRGBColor();
            this.gl.uniform3f(this.gl.getUniformLocation(this.program, "u_color"), rgb.r/255, rgb.g/255, rgb.b/255);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        };
        render();
    }
    
    initAudioContext() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 2048;
        }
    }
    
    connectAudioSource() {
        if (!this.mediaElement || !this.audioCtx || this.mediaElement._isConnected) return;
        if (this.source) this.source.disconnect();
        try {
            this.source = this.audioCtx.createMediaElementSource(this.mediaElement);
            this.source.connect(this.analyser); this.analyser.connect(this.audioCtx.destination);
            this.mediaElement._isConnected = true;
        } catch (e) { console.warn(e); }
    }
    
    async loadMedia(item, contextList) {
        this.currentTrackName = item.name;
        this.currentTrackItem = item; 
        
        if (contextList) this.currentPlaylist = contextList;
        else this.currentPlaylist = this.library[item.type === 'video' ? 'video' : 'music'];

        try {
            let blob;
            if (item.method === 'modern' && item.handle) {
                if (await item.handle.queryPermission({mode:'read'}) !== 'granted') await item.handle.requestPermission({mode:'read'});
                blob = await item.handle.getFile();
            } else blob = item.file;
            const url = URL.createObjectURL(blob);
            if (this.mediaElement) { this.mediaElement.pause(); this.mediaElement.src = ""; }
            cancelAnimationFrame(this.vizId);
            this.playerStage.innerHTML = ""; this.playerStage.appendChild(this.canvas2d); this.playerStage.appendChild(this.canvasGl);
            if (item.type === 'video') { this.mediaElement = document.createElement('video'); this.canvas2d.style.opacity = '0'; this.canvasGl.style.opacity = '0'; }
            else { this.mediaElement = document.createElement('audio'); this.setVisualizerMode(this.currentVizMode); }
            this.mediaElement.src = url; this.mediaElement.className = "mp-active-element"; this.mediaElement.autoplay = true; this.mediaElement.controls = false;
            this.mediaElement.addEventListener('timeupdate', () => this.updateProgress());
            
            this.mediaElement.addEventListener('ended', () => { 
                this.playBtn.textContent = "▶"; 
                this.statusEl.textContent = "ENDED"; 
                this.playNext();
            });
            
            this.mediaElement.addEventListener('play', () => {
                this.playBtn.textContent = "⏸"; this.statusEl.textContent = "PLAYING";
                if (item.type === 'music') { this.initAudioContext(); if (this.audioCtx.state === 'suspended') this.audioCtx.resume(); this.connectAudioSource(); this.setVisualizerMode(this.currentVizMode); }
            });
            this.mediaElement.addEventListener('pause', () => { this.playBtn.textContent = "▶"; this.statusEl.textContent = "PAUSED"; cancelAnimationFrame(this.vizId); });
            this.playerStage.appendChild(this.mediaElement); this.statusEl.textContent = "STREAMING";
            if (this.trackInfoEl) this.trackInfoEl.textContent = `🎵 ${item.name}`;
        } catch (e) { console.error(e); }
    }
    
    playNext() {
        if (!this.currentPlaylist || this.currentPlaylist.length === 0) return;
        
        const index = this.currentPlaylist.indexOf(this.currentTrackItem);
        
        if (index !== -1) {
            const nextItem = this.currentPlaylist[(index + 1) % this.currentPlaylist.length];
            if (nextItem) this.loadMedia(nextItem, this.currentPlaylist);
        }
    }
    
    togglePlay() { if (this.mediaElement) this.mediaElement.paused ? this.mediaElement.play() : this.mediaElement.pause(); }
    updateProgress() { if (this.mediaElement) { const c = this.mediaElement.currentTime, d = this.mediaElement.duration || 1; this.seekBar.value = (c/d)*100; document.getElementById('mp-time-current').textContent = this.formatTime(c); document.getElementById('mp-time-total').textContent = this.formatTime(d); } }
    formatTime(s) { if (isNaN(s)) return "00:00"; const m = Math.floor(s/60), sec = Math.floor(s%60); return `${m}:${sec.toString().padStart(2,'0')}`; }
    
}
    
window.ZionMediaPlayer = ZionMediaPlayer;