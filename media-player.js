/**
 * ZION MEDIA PLAYER 
 */

class ZionMediaPlayer {
    constructor() {
        this.container = document.getElementById('media-player-root');
        this.library = { music: [], video: [], playlists: [] };
        this.currentView = 'video'; 
        this.sidebarOpen = true;
        
        // Media & Audio
        this.mediaElement = null;
        this.audioCtx = null;
        this.analyser = null;
        this.source = null;
        
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

                    <div class="mp-controls-bar">
                        <button id="mp-play" class="mp-ctrl-btn">▶</button>
                        <div class="mp-progress-container">
                            <span id="mp-time-current">00:00</span>
                            <input type="range" id="mp-seek-bar" value="0" min="0" max="100">
                            <span id="mp-time-total">00:00</span>
                        </div>

                        <div id="mp-track-info" class="mp-track-info"></div>

                        <div class="mp-vol-wrap">
                            <span>🔊</span>
                            <input type="range" id="mp-volume" min="0" max="1" step="0.1" value="0.8">
                        </div>
                        <button id="mp-fullscreen" class="mp-ctrl-btn">⛶</button>
                    </div>

                    <div class="mp-library-view" id="mp-library-view"></div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .mp-select { width: 100%; background: rgba(0,20,0,0.8); color: var(--theme-color); border: 1px solid var(--theme-color); padding: 5px; font-family: 'Courier New'; outline: none; text-transform: uppercase; font-size: 0.8rem; margin-bottom: 5px; cursor: pointer; }
            .mp-select option { background: #000; }
            
            .mp-sidebar-content-wrapper {
                flex-grow: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                scrollbar-width: thin;
                scrollbar-color: var(--theme-color) #000;
            }
            .mp-sidebar-content-wrapper::-webkit-scrollbar { width: 4px; }
            .mp-sidebar-content-wrapper::-webkit-scrollbar-thumb { background: var(--theme-color); }
            
            .mp-import-section { margin-top: auto; padding-bottom: 20px; }
            
            /* --- CONTROLS LAYOUT FIX --- */
            .mp-controls-bar {
                display: flex;
                align-items: center;
                padding: 10px;
                padding-right: 20px;
                gap: 15px;
                background: rgba(0,0,0,0.9);
                border-top: 1px solid var(--theme-color);
                box-sizing: border-box;
                width: 100%;
                overflow: hidden;
            }

            .mp-ctrl-btn { flex-shrink: 0; }

            .mp-progress-container {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-grow: 1;
                min-width: 150px;
            }
            
            .mp-seek-bar { width: 100%; }

            .mp-track-info {
                flex: 1;
                margin: 0 10px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: var(--theme-color);
                font-family: 'Orbitron', sans-serif;
                font-size: 0.8rem;
                text-align: center;
                letter-spacing: 1px;
                text-shadow: 0 0 5px var(--theme-color);
                opacity: 0.9;
                max-width: 300px;
                min-width: 0;
            }

            .mp-vol-wrap {
                display: flex;
                align-items: center;
                gap: 5px;
                flex-shrink: 0;
            }
            
            #mp-fullscreen { margin-left: 5px; flex-shrink: 0; }

            /* --- LIBRARY & FILE CARD STYLES (ADDED) --- */
            .mp-library-view {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                grid-auto-rows: min-content;
                gap: 10px;
                background: rgba(0, 0, 0, 0.5);
            }

            .mp-empty-state {
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px;
                color: var(--theme-color);
                opacity: 0.7;
                font-family: 'Courier New', monospace;
            }

            .mp-media-card {
                background: rgba(0, 20, 0, 0.4);
                border: 1px solid rgba(0, 255, 65, 0.3);
                padding: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100px;
            }

            .mp-media-card:hover {
                background: rgba(0, 255, 65, 0.1);
                border-color: var(--theme-color);
                transform: translateY(-2px);
                box-shadow: 0 0 10px rgba(0, 255, 65, 0.2);
            }

            .mp-card-icon {
                font-size: 2rem;
                margin-bottom: 8px;
            }

            .mp-card-title {
                color: #fff;
                font-family: 'Courier New', monospace;
                font-size: 0.75rem;
                text-align: center;
                width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2; /* Limit to 2 lines */
                -webkit-box-orient: vertical;
                word-break: break-word;
                line-height: 1.2;
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

        const videoBtn = document.getElementById('mp-import-video');
        const musicBtn = document.getElementById('mp-import-music');
        
        if (videoBtn) videoBtn.addEventListener('click', () => this.handleFolderImport('video'));
        if (musicBtn) musicBtn.addEventListener('click', () => this.handleFolderImport('music'));

        document.getElementById('mp-viz-select').addEventListener('change', (e) => this.setVisualizerMode(e.target.value));
        document.getElementById('mp-color-select').addEventListener('change', (e) => this.currentColorMode = e.target.value);

        this.playBtn.addEventListener('click', () => this.togglePlay());
        document.getElementById('mp-volume').addEventListener('input', (e) => { if(this.mediaElement) this.mediaElement.volume = e.target.value; });
        
        // --- FULLSCREEN LOGIC ---
        document.getElementById('mp-fullscreen').addEventListener('click', () => {
            const mainPanel = this.container.querySelector('.mp-main');
            if (!document.fullscreenElement) {
                if (mainPanel.requestFullscreen) mainPanel.requestFullscreen();
                else if (mainPanel.webkitRequestFullscreen) mainPanel.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        });

        this.seekBar.addEventListener('input', (e) => {
            if(this.mediaElement && this.mediaElement.duration) {
                const time = (e.target.value / 100) * this.mediaElement.duration;
                this.mediaElement.currentTime = time;
            }
        });
    }

    // --- SMART RESIZE OBSERVER (NO FLASH) ---
    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const width = Math.floor(entry.contentRect.width);
                const height = Math.floor(entry.contentRect.height);
                
                // IGNORE small micro-adjustments to stop flickering/flashing
                if (Math.abs(width - this.lastW) < 20 && Math.abs(height - this.lastH) < 20) return;

                this.lastW = width;
                this.lastH = height;

                // Update 2D Canvas
                if (this.canvas2d) {
                    this.canvas2d.width = width;
                    this.canvas2d.height = height;
                    
                    // SMART RAIN UPDATE: Only re-init if width expanded significantly
                    if (this.currentVizMode === 'matrix_rain') {
                        const requiredStreams = Math.floor(width / 14) * 2;
                        if (this.rainStreams.length < requiredStreams * 0.8) {
                            this.initMatrixRainStreams(width, height);
                        }
                    }
                }

                // Update WebGL Canvas
                if (this.canvasGl) {
                    this.canvasGl.width = width;
                    this.canvasGl.height = height;
                    if (this.gl) this.gl.viewport(0, 0, width, height);
                }
            }
        });
        
        this.resizeObserver.observe(this.playerStage);
    }

    // --- IMPORT LOGIC ---
    async handleFolderImport(type) {
        if (window.showDirectoryPicker) {
            try {
                const handle = await window.showDirectoryPicker();
                this.statusEl.textContent = "SCANNING...";
                const files = [];
                for await (const entry of this.scanDir(handle)) {
                    if (this.isMediaType(entry.name, type)) {
                        files.push({ name: entry.name, handle: entry, type: type, method: 'modern' });
                    }
                }
                this.updateLibrary(type, files);
                return; 
            } catch (e) {
                if (e.name !== 'AbortError') this.triggerInputFallback(type);
            }
        } else {
            this.triggerInputFallback(type);
        }
    }

    triggerInputFallback(type) {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        input.style.position = 'fixed';
        input.style.top = '-1000px';
        input.style.opacity = '0';
        
        input.onchange = (e) => {
            const files = [];
            Array.from(e.target.files).forEach(file => {
                if (this.isMediaType(file.name, type)) {
                    files.push({ name: file.name, file: file, type: type, method: 'legacy' });
                }
            });
            this.updateLibrary(type, files);
            document.body.removeChild(input);
        };
        document.body.appendChild(input);
        setTimeout(() => input.click(), 10);
    }

    updateLibrary(type, newFiles) {
        this.library[type] = [...this.library[type], ...newFiles];
        this.library[type] = this.library[type].filter((v,i,a) => a.findIndex(t => (t.name === v.name)) === i);
        this.statusEl.textContent = "SYNCED";
        document.getElementById('mp-total-items').textContent = this.library.music.length + this.library.video.length;
        this.renderLibrary();
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.mp-nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`nav-${view}`).classList.add('active');
        this.renderLibrary();
    }

    async *scanDir(dirHandle) {
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') yield entry;
            else if (entry.kind === 'directory') yield* this.scanDir(entry);
        }
    }

    isMediaType(name, type) {
        const ext = name.split('.').pop().toLowerCase();
        if (type === 'video') return ['mp4', 'mkv', 'webm', 'avi', 'mov'].includes(ext);
        if (type === 'music') return ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext);
        return false;
    }

    renderLibrary() {
        this.libraryView.innerHTML = "";
        const items = this.library[this.currentView];
        if (!items || items.length === 0) {
            this.libraryView.innerHTML = `<div class="mp-empty-state">NO DATA FOUND IN ${this.currentView.toUpperCase()} SECTOR.<br>PLEASE LINK A LOCAL FOLDER.</div>`;
            return;
        }
        items.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'mp-media-card';
            card.innerHTML = `<div class="mp-card-icon">${this.currentView === 'video' ? '🎬' : '🎵'}</div><div class="mp-card-title">${item.name}</div>`;
            card.addEventListener('click', () => this.loadMedia(item));
            this.libraryView.appendChild(card);
        });
    }

    // --- VISUALS & COLOR ---
    setVisualizerMode(mode) {
        this.currentVizMode = mode;
        cancelAnimationFrame(this.vizId);
        
        this.canvas2d.style.opacity = '0';
        this.canvasGl.style.opacity = '0';

        if (mode === 'off') return;

        const isWebGL = ['cyber_grid', 'neon_vortex', 'quantum_orb'].includes(mode);
        
        if (isWebGL) {
            this.canvasGl.style.opacity = '1';
            if (!this.gl) this.initWebGL(); 
            if (this.mediaElement && !this.mediaElement.paused && this.mediaElement.tagName === 'AUDIO') {
                this.startWebGLVisualizer();
            }
        } else {
            this.canvas2d.style.opacity = '1';
            if (this.mediaElement && !this.mediaElement.paused && this.mediaElement.tagName === 'AUDIO') {
                if (mode === 'matrix_rain') this.startMatrixRain();
                else this.start2DVisualizer();
            }
        }
    }

    getHexColor() {
        if (this.currentColorMode === 'theme') return getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
        if (this.currentColorMode === 'green') return '#00ff41';
        if (this.currentColorMode === 'blue') return '#00f2ff';
        if (this.currentColorMode === 'pink') return '#ff0088';
        if (this.currentColorMode === 'gold') return '#ffaa00';
        if (this.currentColorMode === 'fire') return '#ff4400';
        if (this.currentColorMode === 'rainbow') return `hsl(${Date.now() * 0.1 % 360}, 100%, 50%)`;
        return '#00ff41';
    }

    getRGBColor() {
        const hex = this.getHexColor();
        const div = document.createElement('div');
        div.style.color = hex;
        document.body.appendChild(div);
        const computed = getComputedStyle(div).color;
        document.body.removeChild(div);
        const match = computed.match(/\d+/g);
        if(match) return { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
        return { r: 0, g: 255, b: 65 };
    }

    // --- 2D CANVAS MATRIX RAIN ---
    initMatrixRainStreams(w, h) {
        this.rainStreams = [];
        const baseStreamCount = Math.floor(w / 14); 
        const streamCount = baseStreamCount * 2; 
        
        for (let i = 0; i < streamCount; i++) {
            const depth = 0.2 + Math.random() * 0.8;
            const sizeMultiplier = 1.5 - (depth * 0.8);
            const fontSize = Math.floor(10 + (sizeMultiplier * 20));
            const speed = 0.2 + (depth * 1.0); 
            
            this.rainStreams.push({
                x: Math.random() * w,
                y: Math.random() * -h, 
                depth: depth,
                fontSize: fontSize,
                baseSpeed: speed,
                chars: []
            });
        }
    }

    startMatrixRain() {
        const canvas = this.canvas2d;
        const ctx = this.ctx2d;
        const analyser = this.analyser;
        const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);

        if (this.rainStreams.length === 0) {
            this.initMatrixRainStreams(canvas.width, canvas.height);
        }

        const render = () => {
            this.vizId = requestAnimationFrame(render);
            
            let bass = 0, mid = 0;
            if (analyser) {
                analyser.getByteFrequencyData(dataArray);
                bass = dataArray[5] / 255; 
                mid = dataArray[100] / 255;
            }

            // --- FIX FOR FLASHING BUG ---
            // Reset shadow before drawing the fade-out rectangle. 
            // If shadow persists, the fillRect draws a shadow around the clearing box, creating a solid flash.
            ctx.shadowBlur = 0; 
            
            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.textBaseline = 'top';
            ctx.textAlign = 'center';

            const hexColor = this.getHexColor();

            for (let i = 0; i < this.rainStreams.length; i++) {
                const s = this.rainStreams[i];
                s.y += s.baseSpeed * (1 + bass * 0.8);

                if (s.y > canvas.height + 50) {
                    s.y = -50;
                    s.x = Math.random() * canvas.width;
                }

                ctx.font = `${s.fontSize}px 'Courier New', monospace`;
                
                const trailLen = Math.floor(5 + s.depth * 5);
                
                for (let j = 0; j < trailLen; j++) {
                    const charY = s.y - (j * s.fontSize * 0.8);
                    if (charY < -20 || charY > canvas.height) continue;

                    if (!s.chars[j] || Math.random() > 0.95) {
                        s.chars[j] = this.matrixAlphabet.charAt(Math.floor(Math.random() * this.matrixAlphabet.length));
                    }
                    
                    const alpha = (1 - (j / trailLen)) * (0.3 + s.depth * 0.7);
                    const brightness = (j === 0) ? 1 : alpha + (mid * 0.5);

                    ctx.globalAlpha = Math.min(brightness, 1);
                    
                    if (j === 0) ctx.fillStyle = "#ffffff";
                    else ctx.fillStyle = hexColor;

                    ctx.shadowBlur = (j === 0) ? 10 * s.depth : 0;
                    ctx.shadowColor = hexColor;

                    ctx.fillText(s.chars[j], s.x, charY);
                }
            }
            ctx.globalAlpha = 1;
        };
        render();
    }

    createHighResMatrixTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        const glyphs = this.matrixAlphabet;
        const rows = 40;
        for (let i = 0; i < rows; i++) {
            const char = glyphs.charAt(Math.floor(Math.random() * glyphs.length));
            const y = i * (canvas.height / rows);
            const alpha = Math.pow(i / rows, 2); 
            ctx.globalAlpha = alpha;
            ctx.fillText(char, canvas.width / 2, y + 12);
        }
        return null; 
    }

    start2DVisualizer() {
        if (!this.analyser) return;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const ctx = this.ctx2d;
        const canvas = this.canvas2d;
        
        const render = () => {
            this.vizId = requestAnimationFrame(render);
            
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            this.analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, w, h);
            
            const color = this.getHexColor();
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;

            if (this.currentVizMode === 'bars') {
                const bars = 64; 
                const barWidth = (w / 2) / bars;
                const step = Math.floor(bufferLength / bars);
                for (let i = 0; i < bars; i++) {
                    const value = dataArray[i * step];
                    const barHeight = (value / 255) * h * 0.6;
                    ctx.globalAlpha = 0.8;
                    ctx.fillRect(cx - (i * barWidth) - barWidth, cy - barHeight/2, barWidth - 2, barHeight);
                    ctx.fillRect(cx + (i * barWidth), cy - barHeight/2, barWidth - 2, barHeight);
                }
            } 
            else if (this.currentVizMode === 'wave') {
                this.analyser.getByteTimeDomainData(dataArray);
                ctx.lineWidth = 3;
                ctx.beginPath();
                const sliceWidth = w * 1.0 / bufferLength;
                let x = 0;
                for(let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * (h / 2);
                    if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    x += sliceWidth;
                }
                ctx.stroke();
            }
            else if (this.currentVizMode === 'reactor') {
                const radius = Math.min(w, h) / 4;
                const bars = 90;
                const step = Math.floor(bufferLength / bars);
                const bass = dataArray[5] / 255;
                const scale = 1 + bass * 0.3;
                ctx.translate(cx, cy);
                ctx.scale(scale, scale);
                for(let i = 0; i < bars; i++) {
                    const value = dataArray[i * step];
                    const barHeight = (value / 255) * (radius * 0.8);
                    ctx.rotate((2 * Math.PI) / bars);
                    ctx.fillRect(radius, -2, barHeight, 4);
                }
                ctx.setTransform(1, 0, 0, 1, 0, 0); 
            }
        };
        render();
    }

    initWebGL() {
        this.gl = this.canvasGl.getContext('webgl');
        if (!this.gl) return;

        this.audioTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.audioTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        const vsSource = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
        const fsSource = `
            precision mediump float;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform sampler2D u_audio;
            uniform int u_mode; 
            uniform vec3 u_color;

            float getFreq(float f) { return texture2D(u_audio, vec2(f, 0.0)).r; }

            // RETRO HORIZON
            vec3 renderGrid(vec2 uv, float time) {
                vec3 ro = vec3(0.0, 1.0, time * 2.0);
                vec3 rd = normalize(vec3(uv.x, uv.y - 0.2, 1.0));
                float t = 0.0; float dist = 0.0; vec3 p = vec3(0.0);
                float bass = getFreq(0.05);
                for(int i=0; i<40; i++) {
                    p = ro + rd * t;
                    float wave = sin(p.z * 0.5 + time) * cos(p.x * 0.5) * bass * 0.5;
                    dist = p.y + 1.0 + wave;
                    if(dist < 0.01 || t > 30.0) break;
                    t += dist * 0.5;
                }
                vec3 col = vec3(0.0);
                if(t < 30.0) {
                    float gx = step(0.95, fract(p.x));
                    float gz = step(0.95, fract(p.z));
                    float grid = max(gx, gz);
                    float fog = 1.0 / (1.0 + t * t * 0.05);
                    col = u_color * grid * fog * 2.0;
                }
                float sun = length(uv - vec2(0.0, 0.3));
                if(sun < 0.2) col += vec3(1.0, 0.5, 0.0) * (1.0 - sun*5.0) + (bass * 0.5);
                return col;
            }

            // NEON VORTEX
            vec3 renderVortex(vec2 uv, float time) {
                float r = length(uv);
                float a = atan(uv.y, uv.x);
                float bass = getFreq(0.1);
                float hex = abs(cos(a * 3.0 + time * 0.5));
                r = r * (1.0 + hex * 0.2);
                float z = 1.0 / r + time * (1.0 + bass);
                float val = sin(z * 10.0) * sin(a * 6.0 + z);
                val += getFreq(smoothstep(0.0, 1.0, r)) * 2.0;
                vec3 col = u_color * abs(val) * r;
                col *= smoothstep(0.0, 0.4, length(uv));
                return col;
            }

            // QUANTUM ORB
            vec3 renderOrb(vec2 uv, float time) {
                vec3 ro = vec3(0.0, 0.0, -2.5);
                vec3 rd = normalize(vec3(uv, 1.0));
                float t = 0.0; vec3 p = vec3(0.0); float d = 0.0; float glow = 0.0;
                for(int i=0; i<30; i++) {
                    p = ro + rd * t;
                    float sphere = length(p) - 0.8;
                    float spikes = sin(p.x*10.0+time)*sin(p.y*10.0+time)*sin(p.z*10.0+time);
                    float audio = getFreq(0.2);
                    d = sphere + spikes * 0.1 * audio;
                    if(d < 0.01) break;
                    glow += 0.02 / (0.01 + abs(d));
                    t += d * 0.5;
                }
                vec3 col = u_color * glow * 0.1;
                col += u_color * getFreq(0.5) * 0.5; 
                return col;
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
                vec3 col = vec3(0.0);
                if (u_mode == 1) col = renderGrid(uv, u_time);
                else if (u_mode == 2) col = renderVortex(uv, u_time);
                else if (u_mode == 3) col = renderOrb(uv, u_time);
                gl_FragColor = vec4(col, 1.0);
            }
        `;

        const vs = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
        this.program = this.createProgram(vs, fs);

        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), this.gl.STATIC_DRAW);
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) return null;
        return shader;
    }

    createProgram(vs, fs) {
        const prog = this.gl.createProgram();
        this.gl.attachShader(prog, vs);
        this.gl.attachShader(prog, fs);
        this.gl.linkProgram(prog);
        return prog;
    }

    startWebGLVisualizer() {
        if (!this.program) return;
        const gl = this.gl;
        const analyser = this.analyser;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const uTime = gl.getUniformLocation(this.program, "u_time");
        const uRes = gl.getUniformLocation(this.program, "u_resolution");
        const uMode = gl.getUniformLocation(this.program, "u_mode");
        const uColor = gl.getUniformLocation(this.program, "u_color");
        const posLoc = gl.getAttribLocation(this.program, "position");

        const modes = { 'cyber_grid': 1, 'neon_vortex': 2, 'quantum_orb': 3 };

        const render = () => {
            this.vizId = requestAnimationFrame(render);
            // Size handled by Observer
            analyser.getByteFrequencyData(dataArray);
            gl.bindTexture(gl.TEXTURE_2D, this.audioTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, dataArray.length, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, dataArray);

            gl.useProgram(this.program);
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            gl.uniform1f(uTime, (Date.now() - this.startTime) / 1000);
            gl.uniform2f(uRes, this.canvasGl.width, this.canvasGl.height);
            gl.uniform1i(uMode, modes[this.currentVizMode] || 1);
            
            const rgb = this.getRGBColor();
            gl.uniform3f(uColor, rgb.r/255, rgb.g/255, rgb.b/255);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        };
        render();
    }

    // --- AUDIO & PLAYBACK ---
    initAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 2048; 
            this.analyser.smoothingTimeConstant = 0.8;
        }
    }

    connectAudioSource() {
        if (!this.mediaElement || !this.audioCtx) return;
        if (this.mediaElement._isConnected) return;
        if (this.source) { try { this.source.disconnect(); } catch(e) {} }
        try {
            this.source = this.audioCtx.createMediaElementSource(this.mediaElement);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);
            this.mediaElement._isConnected = true;
        } catch (e) { console.warn("Audio Context setup:", e); }
    }

    async loadMedia(item) {
        try {
            let fileBlob;
            if (item.method === 'modern' && item.handle) {
                if (await item.handle.queryPermission({ mode: 'read' }) !== 'granted') {
                    if (await item.handle.requestPermission({ mode: 'read' }) !== 'granted') throw new Error("Permission denied");
                }
                fileBlob = await item.handle.getFile();
            } else fileBlob = item.file;

            const url = URL.createObjectURL(fileBlob);
            if (this.mediaElement) { this.mediaElement.pause(); this.mediaElement.src = ""; }
            cancelAnimationFrame(this.vizId);
            
            // Clean Stage
            this.playerStage.innerHTML = "";
            this.playerStage.appendChild(this.canvas2d);
            this.playerStage.appendChild(this.canvasGl);
            
            if (item.type === 'video') {
                this.mediaElement = document.createElement('video');
                this.canvas2d.style.opacity = '0';
                this.canvasGl.style.opacity = '0';
            } else {
                this.mediaElement = document.createElement('audio');
                const info = document.createElement('div');
                this.setVisualizerMode(this.currentVizMode);
            }
            
            this.mediaElement.src = url;
            this.mediaElement.className = "mp-active-element";
            this.mediaElement.autoplay = true;
            this.mediaElement.controls = false;
            this.mediaElement._isConnected = false;
            
            this.mediaElement.addEventListener('timeupdate', () => this.updateProgress());
            this.mediaElement.addEventListener('ended', () => {
                this.playBtn.textContent = "▶";
                this.statusEl.textContent = "ENDED";
                cancelAnimationFrame(this.vizId);
            });
            this.mediaElement.addEventListener('play', () => {
                this.playBtn.textContent = "⏸";
                this.statusEl.textContent = "PLAYING";
                if (item.type === 'music') {
                    this.initAudioContext();
                    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
                    this.connectAudioSource();
                    this.setVisualizerMode(this.currentVizMode);
                }
            });
            this.mediaElement.addEventListener('pause', () => {
                this.playBtn.textContent = "▶";
                this.statusEl.textContent = "PAUSED";
                cancelAnimationFrame(this.vizId);
            });

            this.playerStage.appendChild(this.mediaElement);
            this.statusEl.textContent = "STREAMING";
            
            // Update Track Info in Bar
            if (this.trackInfoEl) this.trackInfoEl.textContent = `🎵 ${item.name}`;

        } catch (e) { console.error("Playback Error", e); }
    }

    togglePlay() {
        if (!this.mediaElement) return;
        if (this.mediaElement.paused) this.mediaElement.play();
        else this.mediaElement.pause();
    }

    updateProgress() {
        if (!this.mediaElement) return;
        const current = this.mediaElement.currentTime;
        const duration = this.mediaElement.duration || 1;
        this.seekBar.value = (current / duration) * 100;
        document.getElementById('mp-time-current').textContent = this.formatTime(current);
        document.getElementById('mp-time-total').textContent = this.formatTime(duration);
    }

    formatTime(s) {
        if (isNaN(s)) return "00:00";
        const min = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }
}

window.ZionMediaPlayer = ZionMediaPlayer;