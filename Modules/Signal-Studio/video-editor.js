class VideoEditor {
    constructor(container) {
        this.container = container;

        // Force container structure
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.height = '100%';
        this.container.style.width = '100%';
        this.container.style.overflow = 'hidden';

        // Internal Resolution
        this.width = window.innerWidth * 0.98; 
        this.height = window.innerHeight * 0.98;
        this.canvasResX = 854;
        this.canvasResY = 480;

        // State
        this.currentTime = 0;
        this.duration = 60;
        this.isPlaying = false;
        this.zoom = 10; // 10px per second
        this.playbackRate = 1.0; // Playback speed support
        this.initialVolume = 0; // Force mute by default on initialization
        
        this.activeEffect = null; // Current visual effect
        this.activeAnimation = null; // Current animation (Zoom Pulse, Slide, etc)

        // Data
        this.assets = [];
        this.tracks = [[], [], []];
        this.selectedClip = null;

        // Audio Engine (Web Audio API)
        this.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new this.AudioContext();

        // Grading State
        this.grading = {
            lift: { r: 0, g: 0, b: 0 },
            gamma: { r: 1, g: 1, b: 1 },
            gain: { r: 1, g: 1, b: 1 },
        };

        this.init();
    }

    init() {
        this.createStyles();
        this.createDOM();
        this.initWebGL();
        this.attachEvents();
        this.initCurveEditor();
        this.startRenderLoop();
    }

    // --- 1. UI ARCHITECTURE ---

    createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* RESOLVE RESET & BASE */
            .ve-wrapper { 
                all: initial; 
                display: flex; 
                flex-direction: column; 
                width: 100%; 
                height: 100%; 
                background: #121212; 
                font-family: 'Segoe UI', 'Roboto', system-ui, sans-serif; 
                color: #dcdcdc; 
                box-sizing: border-box; 
                position: relative; 
                overflow: hidden; 
                font-size: 11px; 
                user-select: none; 
            }
            .ve-wrapper * { box-sizing: border-box; }
            
            .ve-layout { 
                height: 100%; 
                display: flex; 
                flex-direction: column; 
                overflow: hidden; 
                width: 100%; 
            }
    
            .ve-top-row { 
                flex: 1 1 auto; 
                min-height: 0; 
                display: flex; 
                flex-direction: row; 
                border-bottom: 4px solid #000; 
                background: #1a1a1a; 
                overflow: hidden; 
            }
            
            /* ADJUSTED HEIGHT: 240px (Was 230px) */
            .ve-bottom-row {
                height: 240px;
                flex: 0 0 240px; 
                display: grid;
                grid-template-columns: 380px 1fr 320px; 
                background: #151515;
                border-top: 1px solid #333;
                overflow: hidden; 
                flex-shrink: 0;
            }
    
            .ve-module-container {
                border-right: 1px solid #333;
                display: flex;
                flex-direction: column;
                padding: 10px;
                position: relative;
                overflow: hidden; 
            }
            .ve-module-header { font-weight:700; color:#777; margin-bottom:10px; text-transform:uppercase; letter-spacing:1px; font-size:10px; display:flex; justify-content:space-between; }
    
            /* Curve UI */
            #ve-curves-canvas {
                width: 100%;
                height: 100%;
                background: #0a0a0a;
                border: 1px solid #444;
                cursor: crosshair;
            }
    
            /* Keyframe Track UI */
            .ve-kf-list { 
                overflow-y: auto; 
                flex: 1; 
            }
            .ve-kf-row { display: flex; align-items: center; height: 28px; border-bottom: 1px solid #222; }
            .ve-kf-label { width: 80px; color: #999; padding-left: 5px; }
            .ve-kf-track {
                flex: 1;
                height: 24px;
                background: #1e1e1e;
                position: relative;
                margin: 0 5px;
                border-radius: 2px;
            }
            .kf-diamond {
                position: absolute;
                width: 10px;
                height: 10px;
                background: #ffcc00;
                transform: rotate(45deg);
                top: 7px;
                cursor: pointer;
                border: 1px solid #000;
                z-index: 10;
            }
            .kf-diamond:hover { background: #fff; }
            
            /* Refined Rim Lighting */
            .ve-panel { 
                border: 1px solid #333; 
                box-shadow: inset 0 0 5px rgba(0,0,0,0.5); 
                background: #1e1e1e; 
                display: flex; 
                flex-direction: column; 
                position: relative; 
                overflow: hidden; 
                height: 100%; 
            }
            .ve-panel:last-child { border-right: none; }
            .ve-panel-header { background: #2a2a2a; color: #999; padding: 0 10px; font-size: 11px; font-weight: 600; border-bottom: 1px solid #000; display: flex; justify-content: space-between; align-items: center; height: 28px; flex-shrink: 0; letter-spacing: 0.5px; }
            
            /* MEDIA POOL */
            .ve-media-pool { width: 260px; flex-shrink: 0; }
            .ve-media-grid { 
                padding: 8px; 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); 
                gap: 8px; 
                overflow-y: auto; 
                background: #1b1b1b; 
                flex: 1; 
            }
            .ve-asset-thumb { background: #111; border: 1px solid #333; height: 60px; position: relative; cursor: pointer; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; text-align: center; color: #aaa; font-size: 10px; }
            .ve-asset-thumb:hover { border-color: #f75c5c; color: #fff; }
            .ve-asset-thumb img { width: 100%; height: 100%; object-fit: cover; }
            .ve-asset-name { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: #fff; font-size: 9px; padding: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
            /* Tabs */
            .ve-tab { background: #1a1a1a; color: #777; border-bottom: 2px solid transparent; transition: all 0.2s; font-weight: 600; text-transform: uppercase; font-size: 10px; }
            .ve-tab.active { background: #222; color: #ccc; border-bottom: 2px solid #f75c5c; }
            .ve-tab:hover { color: #fff; }
            .hidden { display: none !important; }
    
            /* VIEWER */
            .ve-viewer { flex: 1; background: #111; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 2px solid #000; min-width: 0; }
            .ve-canvas-container { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; overflow: hidden; background: #050505; }
            canvas.main { max-width: 95%; max-height: 95%; box-shadow: 0 0 20px rgba(0,0,0,0.5); background: #000; }
            .ve-transport { width: 100%; height: 40px; background: #222; border-top: 1px solid #333; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; flex-shrink: 0; }
            .ve-tc { font-family: 'Consolas', monospace; color: #ccc; font-size: 14px; font-weight: 500; letter-spacing: 1px; width: 100px; }
            .ve-trans-controls { display: flex; gap: 4px; align-items: center; }
            .ve-volume-ctrl { display: flex; align-items: center; gap: 5px; margin-left: 10px; }
    
            /* INSPECTOR */
            .ve-inspector-panel { width: 280px; flex-shrink: 0; }
            .ve-node-graph { 
                background: #181818; 
                flex: 1; 
                display: flex; 
                flex-direction: column; 
                padding: 10px; 
                position: relative; 
                background-image: radial-gradient(#2a2a2a 1px, transparent 1px); 
                background-size: 20px 20px; 
                overflow-y: auto; 
            }
            .ve-node { 
                background: #262626; 
                border: 1px solid #444; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.5); 
                padding: 8px; border-radius: 6px; width: 100%; z-index: 1; margin-bottom: 10px; position: relative; 
            }
            .ve-node-title { color: #f75c5c; font-weight: bold; margin-bottom: 6px; font-size: 10px; display:flex; justify-content:space-between; }
            .ve-input-row { display: flex; justify-content: space-between; margin-top: 4px; gap: 6px; align-items: center; }
            .ve-num-input { background: #000; border: 1px solid #444; color: #fff; width: 100%; font-size: 10px; padding: 3px; text-align: right; border-radius: 3px; font-family: 'Consolas', monospace; }
    
            /* ADJUSTED HEIGHT: 80px (Was 50px) */
            .ve-timeline-panel { background: #1e1e1e; display: flex; flex-direction: column; border-bottom: 2px solid #000; position: relative; height: 80px; flex-shrink: 0; }
            
            .ve-ruler { 
                height: 25px; /* Slightly taller ruler */
                background: #111; 
                position: relative; 
                cursor: ew-resize; 
                border-bottom: 1px solid #333;
                width: 100%;
                overflow: hidden;
                font-size: 9px;
                color: #888;
            }
    
            .ve-track-strip { 
                flex: 1;
                position: relative; 
                overflow: hidden; 
                transition: background 0.2s; 
                background: #1e1e1e;
                border-top: 1px solid #000; 
            }
            .ve-track-strip.ve-track-active { box-shadow: inset 0 0 10px rgba(76, 175, 80, 0.2); background: #282828; }
            
            /* ADJUSTED CLIP: Taller and more substantial */
            .ve-clip-mini { 
                position: absolute; top: 5px; height: 40px; 
                background: #5d5d7a; border: 1px solid rgba(255,255,255,0.1); 
                border-radius: 2px; overflow: hidden; 
            }
            .ve-clip-mini.selected { 
                background: #dba056; 
                border-color: #ffcc80;
                box-shadow: 0 0 8px rgba(219, 160, 86, 0.4);
            }
            .ve-clip-handle { position: absolute; top: 0; bottom: 0; width: 5px; cursor: col-resize; z-index: 10; background: rgba(255,255,255,0.2); }
            .ve-clip-handle.left { left: 0; }
            .ve-clip-handle.right { right: 0; }
            
            .ve-playhead { position: absolute; top: 0; bottom: 0; width: 1px; background: #f75c5c; z-index: 20; pointer-events: none; }
            
            /* Sharp Downward Triangle Knob */
            .ve-playhead-knob { 
                position: absolute; top: 0; width: 0; height: 0; 
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 10px solid #f75c5c;
                transform: translateX(-6px); 
                pointer-events: none; 
                z-index: 25;
            }
            
            .ve-time-label { position: absolute; top: 8px; font-family: monospace; font-size: 9px; color: #666; pointer-events: none; border-left: 1px solid #444; padding-left: 4px; }
    
            /* COLOR WHEELS */
            .ve-wheels-container { display: flex; justify-content: space-around; align-items: center; padding: 10px; height: 100%; }
            .ve-wheel-group { display: flex; flex-direction: column; align-items: center; gap: 8px; }
            .ve-wheel-header { display: flex; justify-content: space-between; width: 100%; padding: 0 5px; color: #999; font-weight: 700; font-size: 11px; }
            .ve-color-wheel { width: 70px; height: 70px; border-radius: 50%; background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red), radial-gradient(circle, white 0%, transparent 70%); background-blend-mode: screen; position: relative; border: 4px solid #111; box-shadow: 0 0 0 1px #333, inset 0 0 10px #000; cursor: crosshair; }
            .ve-puck { width: 8px; height: 8px; border: 2px solid #fff; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; box-shadow: 0 0 4px #000; background: transparent; }
            .ve-ring-container { width: 90px; display: flex; align-items: center; background: #111; border-radius: 10px; padding: 2px; border: 1px solid #333; }
            .ve-slider { -webkit-appearance: none; width: 100%; height: 4px; background: transparent; outline: none; margin: 0; }
            .ve-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: #888; border-radius: 50%; cursor: pointer; border: 2px solid #111; }
            
            /* CONTROLS */
            .ve-btn-icon { background: transparent; border: none; color: #999; cursor: pointer; font-size: 16px; padding: 4px; margin: 0 2px; transition: color 0.2s; }
            .ve-btn-icon:hover { color: #fff; }
            .ve-btn-text { background: #333; border: 1px solid #444; color: #ccc; font-size: 10px; padding: 4px 12px; border-radius: 3px; cursor: pointer; font-weight: 600; text-transform: uppercase; }
            .ve-btn-text:hover { background: #444; color: #fff; border-color: #666; }
        `;
        document.head.appendChild(style);

        // FIX: Layout Enforcement (Updated to 240px height for bottom)
        const layoutStyles = `
            .ve-bottom-row {
                height: 240px !important;
                max-height: 240px !important;
                flex: 0 0 240px !important;
                min-height: 240px !important;
                overflow: hidden !important;
            }
            .ve-top-row {
                flex: 1 1 auto !important;
                min-height: 0 !important;
            }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.innerText = layoutStyles;
        document.head.appendChild(styleSheet);
    }

    createDOM() {
        const wrapper = document.createElement('div');
        wrapper.className = 've-wrapper';

        wrapper.innerHTML = `
            <div class="ve-layout">
                <div class="ve-top-row">
                    <div class="ve-panel ve-media-pool">
                        <div class="ve-panel-header" style="padding:0; display:flex;">
                            <div id="tab-footage" class="ve-tab active" style="flex:1; text-align:center; padding:6px 0; cursor:pointer;">Footage</div>
                            <div id="tab-effects" class="ve-tab" style="flex:1; text-align:center; padding:6px 0; cursor:pointer;">Effects</div>
                            <div id="tab-anims" class="ve-tab" style="flex:1; text-align:center; padding:6px 0; cursor:pointer;">Anim</div>
                        </div>
                        
                        <div class="ve-media-grid" id="ve-asset-list">
                            <div style="grid-column:1/-1; display:flex; justify-content:center; padding-bottom:10px;">
                                <button class="ve-btn-icon" id="ve-import" title="Import Media" style="border:1px solid #333; border-radius:4px; width:100%;">📂 Import Media</button>
                            </div>
                            <div style="grid-column:1/-1; text-align:center; color:#444; font-size:10px; margin-top:20px;">DRAG MEDIA HERE</div>
                        </div>
    
                        <div class="ve-media-grid hidden" id="ve-effects-list">
                            <div class="ve-asset-thumb" data-effect="glitch">⚡ Glitch</div>
                            <div class="ve-asset-thumb" data-effect="noise">📺 Film Grain</div>
                            <div class="ve-asset-thumb" data-effect="chromatic">🌈 RGB Shift</div>
                            <div class="ve-asset-thumb" data-effect="bloom">✨ Bloom</div>
                            <div class="ve-asset-thumb" data-effect="invert">🌓 Invert</div>
                            <div class="ve-asset-thumb" data-effect="sepia">📜 Vintage</div>
                            <div class="ve-asset-thumb" data-effect="none" style="color:#777;">🚫 None</div>
                        </div>

                        <div class="ve-media-grid hidden" id="ve-animations-list">
                            <div class="ve-asset-thumb" data-anim="zoom-pulse">🔊 Zoom Pulse</div>
                            <div class="ve-asset-thumb" data-anim="slide">➡ Slide</div>
                            <div class="ve-asset-thumb" data-anim="shake">📳 Shake</div>
                            <div class="ve-asset-thumb" data-anim="slow-zoom">🔍 Slow Zoom</div>
                            <div class="ve-asset-thumb" data-anim="fade-in">☀ Fade In</div>
                            <div class="ve-asset-thumb" data-anim="none" style="color:#777;">🚫 None</div>
                        </div>
                    </div>
    
                    <div class="ve-panel ve-viewer">
                        <div class="ve-canvas-container" style="position:relative;">
                            <canvas class="main" width="${this.canvasResX}" height="${this.canvasResY}"></canvas>
                            <button id="ve-fullscreen" class="ve-btn-icon" title="Fullscreen" style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.5); z-index:100; border-radius:4px; padding: 4px;">⛶</button>
                        </div>
                        <div class="ve-transport">
                            <span class="ve-tc" id="ve-tc">00:00:00:00</span>
                            <div class="ve-trans-controls">
                                <button class="ve-btn-icon" id="ve-rewind" title="Rewind 5s">⏪</button>
                                <button class="ve-btn-icon" id="ve-prev">⏮</button>
                                <button class="ve-btn-icon" id="ve-play" style="color:#fff;">▶</button>
                                <button class="ve-btn-icon" id="ve-next">⏭</button>
                                <button class="ve-btn-icon" id="ve-fastfwd" title="Forward 5s">⏩</button>
                                <button class="ve-btn-icon" id="ve-replay" title="Replay">⟳</button>
                                
                                <div class="ve-volume-ctrl">
                                    <span style="font-size:12px; color:#999; cursor:pointer;" id="ve-vol-icon">🔇</span>
                                    <input type="range" id="ve-volume" min="0" max="1" step="0.1" value="0" style="width:60px; height:4px; -webkit-appearance:none; background:#444; border-radius:2px;">
                                </div>
                            </div>
                            <button class="ve-btn-text" id="ve-render" style="color:#f75c5c; border-color:#662222;">Export</button>
                        </div>
                    </div>
    
                    <div class="ve-panel ve-inspector-panel">
                        <div class="ve-panel-header"><span>Transform & Comp</span></div>
                        <div class="ve-node-graph" id="ve-inspector">
                            <div class="ve-node-lines"></div>
                            <div class="ve-node">
                                <div class="ve-node-title"><span>TRANSFORM</span> <span style="color:#4caf50;">●</span></div>
                                <div class="ve-input-row"><span style="color:#aaa;">Pos X</span><input type="number" id="inp-x" class="ve-num-input"></div>
                                <div class="ve-input-row"><span style="color:#aaa;">Pos Y</span><input type="number" id="inp-y" class="ve-num-input"></div>
                                <div class="ve-input-row"><span style="color:#aaa;">Zoom</span><input type="number" id="inp-s" class="ve-num-input" step="0.1"></div>
                                <div class="ve-input-row"><span style="color:#aaa;">Angle</span><input type="number" id="inp-r" class="ve-num-input"></div>
                                <div class="ve-input-row"><span style="color:#aaa;">Alpha</span><input type="number" id="inp-o" class="ve-num-input" step="0.1" max="1" min="0"></div>
                            </div>
                            <div style="margin-top:auto; border-top:1px solid #333; padding-top:5px;">
                                <button class="ve-btn-text" id="ve-del-clip" style="width:100%;">Delete Clip</button>
                            </div>
                        </div>
                    </div>
                </div>
    
                <div class="ve-timeline-panel">
                    <div class="ve-ruler" id="ve-ruler">
                        <div class="ve-playhead-knob" id="ve-ph-knob"></div>
                    </div>
                    <div class="ve-track-strip" id="ve-tracks">
                        <div class="ve-playhead" id="ve-ph-line"></div>
                    </div>
                </div>
    
                <div class="ve-bottom-row">
                    <div class="ve-module-container">
                        <div class="ve-module-header"><span>Primaries</span></div>
                        <div class="ve-wheels-container">
                            <div class="ve-wheel-group">
                                <div class="ve-wheel-header"><span>LIFT</span></div>
                                <div class="ve-color-wheel" id="wheel-lift"><div class="ve-puck"></div></div>
                                <div class="ve-ring-container"><input type="range" class="ve-slider" min="-100" max="100" value="0" data-type="lift"></div>
                            </div>
                            <div class="ve-wheel-group">
                                <div class="ve-wheel-header"><span>GAMMA</span></div>
                                <div class="ve-color-wheel" id="wheel-gamma"><div class="ve-puck"></div></div>
                                <div class="ve-ring-container"><input type="range" class="ve-slider" min="0" max="200" value="100" data-type="gamma"></div>
                            </div>
                            <div class="ve-wheel-group">
                                <div class="ve-wheel-header"><span>GAIN</span></div>
                                <div class="ve-color-wheel" id="wheel-gain"><div class="ve-puck"></div></div>
                                <div class="ve-ring-container"><input type="range" class="ve-slider" min="0" max="200" value="100" data-type="gain"></div>
                            </div>
                        </div>
                    </div>
    
                    <div class="ve-module-container">
                        <div class="ve-module-header">
                            <span>Curves</span> 
                            <button class="ve-btn-text" id="btn-reset-curve" style="font-size:9px; padding:2px 6px;">Reset</button>
                        </div>
                        <div style="flex:1; min-height:180px; position:relative; background:#0a0a0a; border:1px solid #333;">
                            <canvas id="ve-curves-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%;"></canvas>
                        </div>
                    </div>
    
                    <div class="ve-module-container">
                        <div class="ve-module-header"><span>Keyframes</span> <button class="ve-btn-text" id="btn-add-kf" style="font-size:9px; padding:2px 6px;">+ Key</button></div>
                        <div class="ve-kf-list" id="ve-kf-list">
                            <div style="text-align:center; color:#444; margin-top:20px;">No Clip Selected</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = '';
        this.container.appendChild(wrapper);

        this.bindElements();
        this.renderTimeline();
    }

    bindElements() {
        // Main WebGL Canvas
        this.canvas = this.container.querySelector('canvas.main');
        
        // Offscreen 2D Canvas for Compositing Layers
        this.compCanvas = document.createElement('canvas');
        this.compCanvas.width = this.canvasResX;
        this.compCanvas.height = this.canvasResY;
        this.compCtx = this.compCanvas.getContext('2d', { alpha: false });
        
        this.assetList = document.getElementById('ve-asset-list');
        this.effectsList = document.getElementById('ve-effects-list');
        this.animationsList = document.getElementById('ve-animations-list');
        
        this.tracksContainer = document.getElementById('ve-tracks');
        this.playheadLine = document.getElementById('ve-ph-line');
        this.playheadKnob = document.getElementById('ve-ph-knob');
        this.tcDisplay = document.getElementById('ve-tc');
        this.kfList = document.getElementById('ve-kf-list');
        this.curvesCanvas = document.getElementById('ve-curves-canvas');
        this.ruler = document.getElementById('ve-ruler');
        
        this.inspectorInputs = {
            x: document.getElementById('inp-x'),
            y: document.getElementById('inp-y'),
            s: document.getElementById('inp-s'),
            r: document.getElementById('inp-r'),
            o: document.getElementById('inp-o')
        };
    }

    // --- 2. WEBGL SETUP (Color Grading Engine) ---

    initWebGL() {
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) { console.error("WebGL not supported"); return; }

        // Compile Shaders
        const vertCode = `
            attribute vec2 position;
            attribute vec2 texCoord;
            varying vec2 vTextureCoord;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
                vTextureCoord = texCoord;
            }
        `;
        
        // DA VINCI MATH SHADER with LUT
        const fragCode = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform sampler2D uCurveLUT; // 1D LUT generated from UI curves

            // Grading Uniforms
            uniform vec3 uLift;   // Shadows (Offset)
            uniform vec3 uGamma;  // Midtones (Power)
            uniform vec3 uGain;   // Highlights (Slope)

            void main() {
                vec4 texel = texture2D(uSampler, vTextureCoord);
                
                // 1. Primaries (Lift/Gamma/Gain)
                vec3 lifted = texel.rgb + uLift * (1.0 - texel.rgb);
                vec3 gained = lifted * uGain;
                vec3 balanced = pow(max(gained, 0.0), 1.0 / uGamma);

                // 2. Curves (LUT Lookup)
                // Use the balanced color channel as the X coordinate for the LUT
                float newR = texture2D(uCurveLUT, vec2(balanced.r, 0.5)).r;
                float newG = texture2D(uCurveLUT, vec2(balanced.g, 0.5)).g;
                float newB = texture2D(uCurveLUT, vec2(balanced.b, 0.5)).b;
                
                gl_FragColor = vec4(newR, newG, newB, texel.a);
            }
        `;

        const createShader = (type, source) => {
            const s = this.gl.createShader(type);
            this.gl.shaderSource(s, source);
            this.gl.compileShader(s);
            if(!this.gl.getShaderParameter(s, this.gl.COMPILE_STATUS)) {
                console.error(this.gl.getShaderInfoLog(s));
                return null;
            }
            return s;
        };

        const vertShader = createShader(this.gl.VERTEX_SHADER, vertCode);
        const fragShader = createShader(this.gl.FRAGMENT_SHADER, fragCode);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertShader);
        this.gl.attachShader(this.program, fragShader);
        this.gl.linkProgram(this.program);
        this.gl.useProgram(this.program);

        // Buffer Setup
        const vertices = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const posLoc = this.gl.getAttribLocation(this.program, "position");
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);

        const texCoords = new Float32Array([0,1, 1,1, 0,0, 1,0]);
        const texBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
        
        const texLoc = this.gl.getAttribLocation(this.program, "texCoord");
        this.gl.enableVertexAttribArray(texLoc);
        this.gl.vertexAttribPointer(texLoc, 2, this.gl.FLOAT, false, 0, 0);

        // Texture 0: Video Frame
        this.texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        // Texture 1: Curve LUT
        this.lutTexture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.lutTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR); // Linear for smooth gradients
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        // Get Uniform Locations
        this.uLoc = {
            sampler: this.gl.getUniformLocation(this.program, "uSampler"),
            curveLUT: this.gl.getUniformLocation(this.program, "uCurveLUT"),
            lift: this.gl.getUniformLocation(this.program, "uLift"),
            gamma: this.gl.getUniformLocation(this.program, "uGamma"),
            gain: this.gl.getUniformLocation(this.program, "uGain")
        };

        // Initialize default LUT (Linear 0->1)
        const defaultLUT = new Uint8Array(256 * 4);
        for(let i=0; i<256; i++) {
            defaultLUT[i*4] = i;     // R
            defaultLUT[i*4+1] = i;   // G
            defaultLUT[i*4+2] = i;   // B
            defaultLUT[i*4+3] = 255; // A
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 256, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, defaultLUT);
    }

    // --- 3. CORE LOGIC & DATA ---

    // Helper to generate the thumbnail
    async generateThumbnail(videoElement) {
        return new Promise((resolve) => {
            const originalTime = videoElement.currentTime;
            // Seek a bit so it's not a black frame, but ensure we don't seek past duration
            const seekTime = Math.min(0.5, videoElement.duration / 2);
            videoElement.currentTime = seekTime;
            
            const onSeeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 160;
                canvas.height = 90;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                
                // Reset video
                videoElement.currentTime = originalTime;
                resolve(canvas.toDataURL('image/jpeg'));
            };
            
            videoElement.addEventListener('seeked', onSeeked, { once: true });
        });
    }

    importFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*,image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if(!file) return;

            // Prevent importing the exact same file twice into the Media Pool
            if (this.assets.some(a => a.name === file.name)) {
                alert("This file is already in your Media Pool.");
                return;
            }
            
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('image') ? 'image' : 'video';
            
            const vid = document.createElement('video');
            vid.src = url;
            vid.muted = true;
            vid.crossOrigin = "anonymous";
            
            if(type === 'video') {
                // 1. Force the element to be ready for sound
                vid.muted = false; 
                vid.defaultMuted = false;
                
                // 2. Sync volume immediately with the UI slider
                const currentVol = parseFloat(document.getElementById('ve-volume').value);
                vid.volume = currentVol;
                
                }

            vid.onloadedmetadata = async () => {
                let thumb = null;
                if(type === 'video') {
                    thumb = await this.generateThumbnail(vid);
                }

                const asset = {
                    id: Date.now(),
                    name: file.name,
                    type,
                    src: url,
                    duration: type==='image' ? 5 : vid.duration,
                    element: vid,
                    thumbnail: thumb
                };
                this.assets.push(asset);
                this.renderAssets();
            };
            if(type === 'image') {
                const img = new Image(); img.src=url;
                img.onload = () => {
                    const asset = { id: Date.now(), name: file.name, type:'image', src:url, duration:5, imgObj: img, thumbnail: url };
                    this.assets.push(asset); this.renderAssets();
                }
            }
        };
        input.click();
    }

    renderAssets() {
        this.assetList.innerHTML = `
            <div style="grid-column:1/-1; display:flex; justify-content:center; padding-bottom:10px;">
                <button class="ve-btn-icon" id="ve-reimport" title="Import Media" style="border:1px solid #333; border-radius:4px; width:100%;">📂 Import Media</button>
            </div>
        `;
        document.getElementById('ve-reimport').onclick = () => this.importFile();

        if (this.assets.length === 0) {
            this.assetList.innerHTML += `<div style="grid-column:1/-1; text-align:center; color:#444; font-size:10px; margin-top:20px;">DRAG MEDIA HERE</div>`;
        }

        this.assets.forEach(asset => {
            const el = document.createElement('div');
            el.className = 've-asset-thumb';
            
            // XSS Security Fix: Use document.createElement & textContent for untrusted variables
            if (asset.thumbnail) {
                const img = document.createElement('img');
                img.src = asset.thumbnail;
                img.draggable = false;
                
                const nameDiv = document.createElement('div');
                nameDiv.className = 've-asset-name';
                nameDiv.textContent = asset.name; // Safely handles malicious filenames
                
                el.appendChild(img);
                el.appendChild(nameDiv);
            } else {
                const iconWrap = document.createElement('div');
                iconWrap.style.flex = '1';
                iconWrap.style.display = 'flex';
                iconWrap.style.alignItems = 'center';
                iconWrap.style.justifyContent = 'center';
                iconWrap.style.color = '#555';
                iconWrap.style.fontSize = '24px';
                iconWrap.textContent = asset.type === 'video' ? '🎬' : '🖼️';
                
                const nameDiv = document.createElement('div');
                nameDiv.className = 've-asset-name';
                nameDiv.textContent = asset.name; // Safely handles malicious filenames
                
                el.appendChild(iconWrap);
                el.appendChild(nameDiv);
            }
            
            el.onclick = () => this.addClip(asset, 0, this.currentTime);
            
            // Right-click to delete
            el.oncontextmenu = (e) => {
                e.preventDefault();
                if (confirm(`Remove ${asset.name} from project?`)) {
                    this.deleteAsset(asset.id);
                }
            };
            
            this.assetList.appendChild(el);
        });
    }

    deleteAsset(assetId) {
        // 1. Remove from asset array (and revoke URL to free memory)
        const assetToRemove = this.assets.find(a => a.id === assetId);
        if (assetToRemove && assetToRemove.src) {
            URL.revokeObjectURL(assetToRemove.src);
        }

        this.assets = this.assets.filter(a => a.id !== assetId);
        
        // 2. Remove any clips on the timeline using this asset
        this.tracks = this.tracks.map(track => 
            track.filter(clip => clip.assetId !== assetId)
        );
        
        // 3. Clear selected clip if it was deleted
        if (this.selectedClip && this.selectedClip.assetId === assetId) {
            this.selectedClip = null;
        }
        
        // 4. Update UI
        this.renderAssets();
        this.renderTimeline();
        this.updateInspector();
    }

    // Updated Clip Structure for Keyframes & Curves
    addClip(asset, trackIdx, start) {
        const clip = {
            id: 'c'+Date.now(),
            assetId: asset.id,
            start,
            duration: asset.duration,
            offset: 0,
            
            // Curves State (Master Curve)
            curves: [
                {x: 0, y: 0}, 
                {x: 0.5, y: 0.5},
                {x: 1, y: 1}
            ],

            // Keyframes State
            keyframes: {
                // Transform
                x: [{t:0, v:0}], 
                y: [{t:0, v:0}], 
                scale: [{t:0, v:1}], 
                rot: [{t:0, v:0}], 
                opacity: [{t:0, v:1}],
                // Grading
                liftR: [{t:0, v:0}], liftG: [{t:0, v:0}], liftB: [{t:0, v:0}],
                gammaR: [{t:0, v:1}], gammaG: [{t:0, v:1}], gammaB: [{t:0, v:1}],
                gainR: [{t:0, v:1}], gainG: [{t:0, v:1}], gainB: [{t:0, v:1}]
            }
        };
        
        if (this.tracks[trackIdx].length > 0) {
            const last = this.tracks[trackIdx][this.tracks[trackIdx].length-1];
            clip.start = last.start + last.duration;
        }
        
        this.tracks[trackIdx].push(clip);
        this.selectedClip = clip;
        this.renderTimeline();
        this.updateInspector();
        this.drawCurveEditor();
        this.renderKeyframeList();
    }

    // Keyframe Interpolation Engine
    getInterpolatedValue(keyframes, clipLocalTime) {
        if (!keyframes || keyframes.length === 0) return 0;
        if (keyframes.length === 1) return keyframes[0].v;

        // Ensure sorted (can be optimized by sorting on insert)
        const ks = [...keyframes].sort((a, b) => a.t - b.t);

        // Boundary checks
        if (clipLocalTime <= ks[0].t) return ks[0].v;
        if (clipLocalTime >= ks[ks.length - 1].t) return ks[ks.length - 1].v;

        // Find surrounding keyframes
        for (let i = 0; i < ks.length - 1; i++) {
            const start = ks[i];
            const end = ks[i + 1];

            if (clipLocalTime >= start.t && clipLocalTime < end.t) {
                // Linear Interpolation: V = V0 + (V1 - V0) * ((T - T0) / (T1 - T0))
                const progress = (clipLocalTime - start.t) / (end.t - start.t);
                return start.v + (end.v - start.v) * progress;
            }
        }
        return ks[0].v;
    }

    applyEffect(name) {
        this.activeEffect = (name === 'none') ? null : name;
        console.log("Applied Effect:", this.activeEffect);
    }

    applyAnimation(name) {
        this.activeAnimation = (name === 'none') ? null : name;
        console.log("Applied Animation:", this.activeAnimation);
    }

    renderTimeline() {
        // 1. Clear and Prepare Ruler (Time Stamps)
        this.ruler.innerHTML = '<div class="ve-playhead-knob" id="ve-ph-knob"></div>';
        const step = 5; // seconds
        for(let t = 0; t < 300; t += step) {
            const label = document.createElement('div');
            label.className = 've-time-label';
            // Professional format: HH:MM:SS
            const s = t % 60;
            const m = Math.floor(t / 60);
            label.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            label.style.left = (t * this.zoom) + 'px';
            this.ruler.appendChild(label);
        }

        // 2. Render Clips with Filmstrip Effect
        this.tracksContainer.innerHTML = '<div class="ve-playhead" id="ve-ph-line"></div>';
        this.playheadLine = document.getElementById('ve-ph-line'); // Re-bind dynamic element
        
        this.tracks.forEach((track) => {
            track.forEach(clip => {
                const el = document.createElement('div');
                el.className = `ve-clip-mini ${this.selectedClip === clip ? 'selected' : ''}`;
                el.style.left = (clip.start * this.zoom) + 'px';
                el.style.width = (clip.duration * this.zoom) + 'px';
                
                const asset = this.assets.find(a => a.id === clip.assetId);
                if (asset && asset.thumbnail) {
                    el.style.backgroundImage = `url(${asset.thumbnail})`;
                    el.style.backgroundRepeat = 'repeat-x'; // Repeating filmstrip look
                    el.style.backgroundSize = 'contain';
                }

                const leftHandle = document.createElement('div'); leftHandle.className = 've-clip-handle left';
                const rightHandle = document.createElement('div'); rightHandle.className = 've-clip-handle right';
                el.appendChild(leftHandle);
                el.appendChild(rightHandle);
                
                el.onmousedown = (e) => this.handleTimelineMouse(e, clip, el);
                this.tracksContainer.appendChild(el);
            });
        });
        this.updatePlayhead();
    }

    handleTimelineMouse(e, clip, el) {
        e.stopPropagation();
        this.selectedClip = clip;
        this.renderTimeline();
        this.updateInspector();
        this.drawCurveEditor(); // Update curves for selected clip
        this.renderKeyframeList(); // Update keyframes for selected clip

        this.tracksContainer.classList.add('ve-track-active');
        const startX = e.clientX;
        const initialStart = clip.start;
        const initialDur = clip.duration;
        const isLeft = e.target.classList.contains('left');
        const isRight = e.target.classList.contains('right');
        const isMove = !isLeft && !isRight;

        const move = (ev) => {
            const diff = (ev.clientX - startX) / this.zoom;
            const asset = this.assets.find(a => a.id === clip.assetId);
            const maxAssetDuration = asset ? asset.duration : Infinity;

            if(isMove) {
                clip.start = Math.max(0, initialStart + diff);
                if(Math.abs(clip.start - this.currentTime) < 0.2) clip.start = this.currentTime;
            } else if(isRight) {
                // LOCK: New duration cannot exceed the remaining media available
                const maxPossibleDuration = maxAssetDuration - clip.offset;
                clip.duration = Math.max(0.1, Math.min(initialDur + diff, maxPossibleDuration));
            } else if(isLeft) {
                const newStart = Math.max(0, initialStart + diff); 
                const endPoint = initialStart + initialDur;
                // LOCK: Offset cannot go negative (start of video)
                const newOffset = Math.max(0, clip.offset + diff);
                
                if(newStart < endPoint && newOffset >= 0) {
                    clip.start = newStart;
                    clip.duration = endPoint - newStart;
                    clip.offset = newOffset;
                }
            }
            this.renderTimeline();
        };
        const stop = () => { 
            window.removeEventListener('mousemove', move); 
            window.removeEventListener('mouseup', stop);
            this.tracksContainer.classList.remove('ve-track-active');
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', stop);
    }

    updatePlayhead() {
        const pos = (this.currentTime * this.zoom);
        if(this.playheadLine) this.playheadLine.style.left = pos + 'px';
        if(this.playheadKnob) this.playheadKnob.style.left = pos + 'px';
        
        const tot = Math.floor(this.currentTime);
        const fr = Math.floor((this.currentTime % 1) * 24);
        const s = tot % 60; const m = Math.floor(tot/60);
        this.tcDisplay.innerText = `00:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}:${fr.toString().padStart(2,'0')}`;
        
        // Update UI visuals based on keyframes if clip is selected
        if(this.selectedClip && this.currentTime >= this.selectedClip.start && this.currentTime <= this.selectedClip.start + this.selectedClip.duration) {
            const localT = this.currentTime - this.selectedClip.start + this.selectedClip.offset;
            const kf = this.selectedClip.keyframes;
            this.inspectorInputs.x.value = this.getInterpolatedValue(kf.x, localT).toFixed(0);
            this.inspectorInputs.y.value = this.getInterpolatedValue(kf.y, localT).toFixed(0);
            this.inspectorInputs.s.value = this.getInterpolatedValue(kf.scale, localT).toFixed(1);
            this.inspectorInputs.r.value = this.getInterpolatedValue(kf.rot, localT).toFixed(0);
            this.inspectorInputs.o.value = this.getInterpolatedValue(kf.opacity, localT).toFixed(1);
        }
    }

    // --- 4. RENDER LOOP ---

    startRenderLoop() {
        let lastTime = performance.now();
        
        const loop = (now) => {
            const dt = (now - lastTime) / 1000; // Time passed in seconds
            lastTime = now;

            if(this.isPlaying) {
                this.currentTime += dt * this.playbackRate; // Increment by actual time passed adjusted by rate

                const lastClipEnd = Math.max(...this.tracks.flat().map(c => c.start + c.duration), 0);
                if(this.currentTime >= lastClipEnd && lastClipEnd > 0) { 
                    this.isPlaying = false;
                    this.currentTime = lastClipEnd; 
                    document.getElementById('ve-play').innerText = '▶';
                }
                if (this.tracks.flat().length === 0 && this.currentTime >= this.duration) {
                     this.isPlaying = false;
                     this.currentTime = 0;
                     document.getElementById('ve-play').innerText = '▶';
                }
                this.updatePlayhead();
            }
            this.renderFrame();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    renderFrame() {
        // 1. COMPOSITING PHASE (Offscreen 2D Canvas)
        this.compCtx.fillStyle = '#000';
        this.compCtx.fillRect(0, 0, this.canvasResX, this.canvasResY);

        // Audio Sync Pass
        const audibleAssetIds = new Set();
        this.tracks.flat().forEach(clip => {
            if (this.currentTime >= clip.start && this.currentTime < clip.start + clip.duration) {
                audibleAssetIds.add(clip.assetId);
            }
        });

        this.assets.forEach(asset => {
            if (asset.element && asset.type === 'video') {
                if (!audibleAssetIds.has(asset.id) || !this.isPlaying) {
                    asset.element.pause();
                    asset.element.volume = 0; 
                } else {
                    asset.element.volume = parseFloat(document.getElementById('ve-volume').value);
                }
            }
        });

        let activeClip = null;
        let lift = {r:0,g:0,b:0}, gamma = {r:1,g:1,b:1}, gain = {r:1,g:1,b:1};

        // EFFECT ENGINE PRE-PASS
        this.compCtx.save(); 
        
        if (this.activeEffect === 'invert') {
            this.compCtx.filter = 'invert(100%)';
        } else if (this.activeEffect === 'sepia') {
            this.compCtx.filter = 'sepia(100%)';
        } else if (this.activeEffect === 'bloom') {
            this.compCtx.filter = 'brightness(1.4) contrast(1.1) blur(1px)';
        } else {
            this.compCtx.filter = 'none';
        }

        // Render tracks bottom to top
        for (let i = this.tracks.length - 1; i >= 0; i--) {
            this.tracks[i].forEach(clip => {
                if(this.currentTime >= clip.start && this.currentTime < clip.start + clip.duration) {
                    const asset = this.assets.find(a => a.id === clip.assetId);
                    if(!asset) return;

                    activeClip = clip;
                    const localT = this.currentTime - clip.start + clip.offset;
                    
                    // Interpolate Values
                    const kf = clip.keyframes;
                    const x = this.getInterpolatedValue(kf.x, localT);
                    const y = this.getInterpolatedValue(kf.y, localT);
                    const s = this.getInterpolatedValue(kf.scale, localT);
                    const r = this.getInterpolatedValue(kf.rot, localT);
                    const o = this.getInterpolatedValue(kf.opacity, localT);

                    lift = { r: this.getInterpolatedValue(kf.liftR, localT), g: this.getInterpolatedValue(kf.liftG, localT), b: this.getInterpolatedValue(kf.liftB, localT) };
                    gamma = { r: this.getInterpolatedValue(kf.gammaR, localT), g: this.getInterpolatedValue(kf.gammaG, localT), b: this.getInterpolatedValue(kf.gammaB, localT) };
                    gain = { r: this.getInterpolatedValue(kf.gainR, localT), g: this.getInterpolatedValue(kf.gainG, localT), b: this.getInterpolatedValue(kf.gainB, localT) };

                    this.compCtx.save();
                    let cx = this.canvasResX/2 + x;
                    let cy = this.canvasResY/2 + y;
                    
                    // --- EFFECTS LOGIC ---
                    if (this.activeEffect === 'glitch') {
                        // Simple random shake offset
                        if (Math.random() > 0.5) {
                            cx += (Math.random() - 0.5) * 10;
                            cy += (Math.random() - 0.5) * 10;
                        }
                    }

                    // --- ANIMATIONS LOGIC ---
                    if (this.activeAnimation === 'zoom-pulse') {
                        const pulse = 1 + Math.sin(localT * 5) * 0.1;
                        this.compCtx.translate(cx, cy);
                        this.compCtx.scale(s * pulse, s * pulse);
                        this.compCtx.translate(-cx, -cy);
                    }
                    
                    if (this.activeAnimation === 'slide') {
                         // Slide in from left over 1 second
                         if(localT < 1.0) {
                             cx -= (1.0 - localT) * this.canvasResX;
                         }
                    }

                    if (this.activeAnimation === 'shake') {
                        cx += (Math.random() - 0.5) * 5;
                        cy += (Math.random() - 0.5) * 5;
                    }

                    if (this.activeAnimation === 'slow-zoom') {
                        const zoomProgress = 1 + (localT * 0.05); // Grows 5% every second
                        this.compCtx.scale(s * zoomProgress, s * zoomProgress);
                    }
                    
                    // Global Alpha change should happen before transforms applied if using context
                    if (this.activeAnimation === 'fade-in') {
                        const fade = Math.min(localT / 2, 1); // 2-second fade in
                        this.compCtx.globalAlpha = o * fade;
                    } else {
                        this.compCtx.globalAlpha = o;
                    }

                    // Standard Transform Application
                    this.compCtx.translate(cx, cy);
                    this.compCtx.rotate(r * Math.PI/180);
                    this.compCtx.scale(s, s);
                    
                    // Media Control
                    let drawTarget = null;
                    if(asset.type === 'video' && asset.element) {
                        const drift = Math.abs(asset.element.currentTime - localT);
                        if (this.isPlaying) {
                            if (drift > 0.15) asset.element.currentTime = localT;
                            if (asset.element.paused) asset.element.play();
                            asset.element.playbackRate = this.playbackRate; 
                        } else {
                            if (drift > 0.01) asset.element.currentTime = localT;
                            if (!asset.element.paused) asset.element.pause();
                        }
                        drawTarget = asset.element;
                    } else if(asset.type === 'image' && asset.imgObj) {
                        drawTarget = asset.imgObj;
                    }

                    if (drawTarget) {
                        if (this.activeEffect === 'chromatic') {
                            // RGB Shift Implementation
                            this.compCtx.globalCompositeOperation = 'screen';
                            // Red Channel Offset
                            this.compCtx.save();
                            this.compCtx.fillStyle = 'red'; // Tinting (simplified for 2D canvas)
                            this.compCtx.globalAlpha = (this.activeAnimation === 'fade-in' ? o * Math.min(localT / 2, 1) : o) * 0.8;
                            this.compCtx.translate(4, 0); // Offset X
                            this.compCtx.drawImage(drawTarget, -this.canvasResX/2, -this.canvasResY/2, this.canvasResX, this.canvasResY);
                            this.compCtx.restore();
                            
                            // Blue Channel Offset
                            this.compCtx.save();
                            this.compCtx.globalAlpha = (this.activeAnimation === 'fade-in' ? o * Math.min(localT / 2, 1) : o) * 0.8;
                            this.compCtx.translate(-4, 0); // Offset X
                            this.compCtx.drawImage(drawTarget, -this.canvasResX/2, -this.canvasResY/2, this.canvasResX, this.canvasResY);
                            this.compCtx.restore();
                            
                            this.compCtx.globalCompositeOperation = 'source-over';
                            // Draw Main (Green/Center anchor) slightly fainter to mix
                            this.compCtx.globalAlpha = (this.activeAnimation === 'fade-in' ? o * Math.min(localT / 2, 1) : o) * 0.5; 
                            this.compCtx.drawImage(drawTarget, -this.canvasResX/2, -this.canvasResY/2, this.canvasResX, this.canvasResY);
                        } else {
                            this.compCtx.drawImage(drawTarget, -this.canvasResX/2, -this.canvasResY/2, this.canvasResX, this.canvasResY);
                        }
                    }

                    // Noise Overlay (Grain)
                    if (this.activeEffect === 'noise') {
                        this.compCtx.restore(); // Pop out of transform for full screen noise
                        this.compCtx.save(); // Save again for noise
                        const idata = this.compCtx.createImageData(this.canvasResX, this.canvasResY);
                        // Light optimization: draw noise occasionally or use small pattern, 
                        // but for this task we do a procedural fill (expensive but correct logic)
                        // Simulating using random fill rects for performance
                        for(let i=0; i<500; i++) {
                            this.compCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
                            this.compCtx.fillRect(Math.random()*this.canvasResX, Math.random()*this.canvasResY, 2, 2);
                        }
                    }

                    this.compCtx.restore();
                }
            });
        }
        
        this.compCtx.restore(); // Restore context (remove filters)

        // 2. LUT GENERATION (From Curve Points)
        if (activeClip) {
            this.updateCurveLUT(activeClip.curves);
        }

        // 3. GRADING PHASE (WebGL)
        this.gl.useProgram(this.program);
        
        // Bind Video Texture
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.compCanvas);
        this.gl.uniform1i(this.uLoc.sampler, 0);

        // Bind LUT Texture
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.lutTexture);
        this.gl.uniform1i(this.uLoc.curveLUT, 1);

        // Update Uniforms
        this.gl.uniform3f(this.uLoc.lift, lift.r, lift.g, lift.b);
        this.gl.uniform3f(this.uLoc.gamma, gamma.r, gamma.g, gamma.b);
        this.gl.uniform3f(this.uLoc.gain, gain.r, gain.g, gain.b);

        // Draw
        this.gl.viewport(0, 0, this.canvasResX, this.canvasResY);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        if (this.drawCurveEditor) this.drawCurveEditor();
    }

    updateCurveLUT(points) {
        // Generate a 1D texture (256x1) based on control points
        const lutData = new Uint8Array(256 * 4);
        
        // Sort points by X
        points.sort((a,b) => a.x - b.x);

        for (let i = 0; i < 256; i++) {
            const t = i / 255;
            let val = t; // Default linear

            if (points.length >= 2) {
                // Find segment
                let p0 = points[0];
                let p1 = points[points.length-1];
                
                for(let k=0; k<points.length-1; k++) {
                    if(t >= points[k].x && t <= points[k+1].x) {
                        p0 = points[k];
                        p1 = points[k+1];
                        break;
                    }
                }

                // Linear interpolate between points
                if (p1.x - p0.x > 0) {
                    const ratio = (t - p0.x) / (p1.x - p0.x);
                    val = p0.y + (p1.y - p0.y) * ratio;
                } else {
                    val = p0.y;
                }
            }
            
            // Clamp
            val = Math.max(0, Math.min(1, val));
            const cVal = Math.round(val * 255);
            
            lutData[i*4] = cVal;     // R
            lutData[i*4+1] = cVal;   // G
            lutData[i*4+2] = cVal;   // B
            lutData[i*4+3] = 255;    // A
        }
        
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 256, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, lutData);
    }

    // --- 5. EXPORT ENGINE (FIXED: High Fidelity & Audio) ---

    async exportVideo() {
        const res = prompt("Export Resolution:\n1: 1080p\n2: 1440p\n3: 4K", "1");
        let targetW = 1920, targetH = 1080;
        if (res === "2") { targetW = 2560; targetH = 1440; }
        if (res === "3") { targetW = 3840; targetH = 2160; }

        const oldW = this.canvasResX, oldH = this.canvasResY;
        
        this.canvasResX = targetW; this.canvasResY = targetH;
        this.canvas.width = targetW; this.canvas.height = targetH;
        this.compCanvas.width = targetW; this.compCanvas.height = targetH;
        this.gl.viewport(0, 0, targetW, targetH);

        const dest = this.audioCtx.createMediaStreamDestination();
        
        this.assets.forEach(a => { 
            if(a.element && a.type === 'video') {
                if (!a.audioSource) {
                    try { a.audioSource = this.audioCtx.createMediaElementSource(a.element); } 
                    catch (e) {}
                }
                if (a.audioSource) a.audioSource.connect(dest);
                a.element.muted = false;
            }
        });
        
        const stream = this.canvas.captureStream(30); 
        dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));

        const recorder = new MediaRecorder(stream, { 
            mimeType: 'video/webm; codecs=vp9',
            videoBitsPerSecond: res === "3" ? 50000000 : 15000000 
        });
        
        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `Export_${Date.now()}.webm`;
            a.click();
            
            this.canvasResX = oldW; this.canvasResY = oldH;
            this.canvas.width = oldW; this.canvas.height = oldH;
            this.compCanvas.width = oldW; this.compCanvas.height = oldH;
            this.gl.viewport(0, 0, oldW, oldH);
            
            this.isPlaying = false;
            this.currentTime = 0;
            this.updatePlayhead();
            document.getElementById('ve-render').innerText = "Export";
        };

        this.currentTime = 0;
        this.isPlaying = true; 
        document.getElementById('ve-play').innerText = '❚❚';
        
        recorder.start();

        const totalDuration = Math.max(...this.tracks.flat().map(c => c.start + c.duration), 0);
        
        const monitor = setInterval(() => {
            const pct = Math.min(100, Math.round((this.currentTime / totalDuration) * 100));
            document.getElementById('ve-render').innerText = `Rec ${pct}%`;

            if (this.currentTime >= totalDuration || !this.isPlaying) {
                clearInterval(monitor);
                if (recorder.state === "recording") recorder.stop();
                this.isPlaying = false;
            }
        }, 100);
    }

    // --- 6. EVENTS & MODULES ---

    initCurveEditor() {
        const ctx = this.curvesCanvas.getContext('2d', { willReadFrequently: true });
        let isDragging = false;
        let activePointIdx = -1;

        // Optimization: Reusable buffer for histogram analysis
        const anaCanvas = document.createElement('canvas');
        anaCanvas.width = 160; anaCanvas.height = 90;
        const anaCtx = anaCanvas.getContext('2d', { willReadFrequently: true });

        const draw = () => {
            if (this.curvesCanvas.width !== this.curvesCanvas.clientWidth || 
                this.curvesCanvas.height !== this.curvesCanvas.clientHeight) {
                this.curvesCanvas.width = this.curvesCanvas.clientWidth;
                this.curvesCanvas.height = this.curvesCanvas.clientHeight;
            }
            
            const w = this.curvesCanvas.width;
            const h = this.curvesCanvas.height;
            
            ctx.clearRect(0,0,w,h);

            // --- HISTOGRAM GENERATION ---
            if (this.compCanvas && this.compCanvas.width > 0) {
                // Downscale current frame for fast reading
                anaCtx.drawImage(this.compCanvas, 0, 0, 160, 90);
                const imgData = anaCtx.getImageData(0, 0, 160, 90).data;
                const rBins = new Array(256).fill(0);
                const gBins = new Array(256).fill(0);
                const bBins = new Array(256).fill(0);
                
                for (let i = 0; i < imgData.length; i += 4) {
                    rBins[imgData[i]]++;
                    gBins[imgData[i+1]]++;
                    bBins[imgData[i+2]]++;
                }

                const max = Math.max(...rBins, ...gBins, ...bBins) || 1;
                const normalize = (val) => h - ((val / max) * h * 0.8); 

                ctx.save();
                ctx.globalCompositeOperation = 'screen'; 
                ctx.globalAlpha = 0.4;
                ctx.lineWidth = 1;

                const drawChannel = (bins, color) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(0, h);
                    for (let i = 0; i < 256; i++) {
                        const val = bins[i]; 
                        const x = (i / 255) * w;
                        const y = normalize(val);
                        ctx.lineTo(x, y);
                    }
                    ctx.lineTo(w, h);
                    ctx.fill();
                };

                drawChannel(rBins, '#d62828'); 
                drawChannel(gBins, '#2a9d8f'); 
                drawChannel(bBins, '#0077b6'); 
                ctx.restore();
            }

            // --- STANDARD UI ---
            ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(w*0.25,0); ctx.lineTo(w*0.25,h);
            ctx.moveTo(w*0.5,0); ctx.lineTo(w*0.5,h);
            ctx.moveTo(w*0.75,0); ctx.lineTo(w*0.75,h);
            ctx.moveTo(0,h*0.25); ctx.lineTo(w,h*0.25);
            ctx.moveTo(0,h*0.5); ctx.lineTo(w,h*0.5);
            ctx.moveTo(0,h*0.75); ctx.lineTo(w,h*0.75);
            ctx.stroke();

            if(!this.selectedClip) return;

            const points = this.selectedClip.curves;
            points.sort((a,b) => a.x - b.x);

            ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2;
            ctx.beginPath();
            points.forEach((p, i) => {
                const px = p.x * w;
                const py = h - (p.y * h);
                if(i===0) ctx.moveTo(px,py);
                else ctx.lineTo(px,py);
            });
            ctx.stroke();

            points.forEach(p => {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(p.x * w, h - (p.y * h), 4, 0, Math.PI*2);
                ctx.fill();
            });
        };

        this.drawCurveEditor = draw;
        
        this.curvesCanvas.onmousedown = (e) => {
            if(!this.selectedClip) return;
            const rect = this.curvesCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1.0 - ((e.clientY - rect.top) / rect.height);
            
            const points = this.selectedClip.curves;
            activePointIdx = points.findIndex(p => {
                const dx = p.x - x; const dy = p.y - y;
                return Math.sqrt(dx*dx + dy*dy) < 0.05;
            });

            if(activePointIdx === -1) {
                points.push({x, y});
                activePointIdx = points.length - 1;
            }
            isDragging = true;
            draw();
        };

        const move = (e) => {
            if(isDragging && this.selectedClip && activePointIdx !== -1) {
                const rect = this.curvesCanvas.getBoundingClientRect();
                let x = (e.clientX - rect.left) / rect.width;
                let y = 1.0 - ((e.clientY - rect.top) / rect.height);
                x = Math.max(0, Math.min(1, x));
                y = Math.max(0, Math.min(1, y));
                
                this.selectedClip.curves[activePointIdx] = {x, y};
                draw();
            }
        };
        const up = () => { isDragging = false; activePointIdx = -1; };

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        
        document.getElementById('btn-reset-curve').onclick = () => {
            if(this.selectedClip) {
                this.selectedClip.curves = [{x:0,y:0}, {x:0.5,y:0.5}, {x:1,y:1}];
                draw();
            }
        };

        draw(); 
    }

    renderKeyframeList() {
        this.kfList.innerHTML = '';
        if(!this.selectedClip) {
            this.kfList.innerHTML = '<div style="text-align:center;color:#444;margin-top:20px;">No Clip</div>';
            return;
        }

        const keys = Object.keys(this.selectedClip.keyframes);
        keys.forEach(k => {
            const row = document.createElement('div');
            row.className = 've-kf-row';
            
            const label = document.createElement('div');
            label.className = 've-kf-label';
            label.innerText = k;
            
            const track = document.createElement('div');
            track.className = 've-kf-track';
            
            // Render diamonds
            const kfArr = this.selectedClip.keyframes[k];
            const clipDur = this.selectedClip.duration;
            
            kfArr.forEach((kf, idx) => {
                const d = document.createElement('div');
                d.className = 'kf-diamond';
                // Position relative to clip duration in the mini view
                const pct = (kf.t / clipDur) * 100;
                d.style.left = `${pct}%`;
                d.title = `Val: ${kf.v.toFixed(2)}`;
                d.onclick = (e) => {
                    e.stopPropagation();
                    // Jump playhead to keyframe
                    this.currentTime = this.selectedClip.start + kf.t;
                    this.updatePlayhead();
                };
                track.appendChild(d);
            });
            
            row.appendChild(label);
            row.appendChild(track);
            this.kfList.appendChild(row);
        });
    }

    updateInspector() {
        if(!this.selectedClip) return;
        const localT = Math.max(0, this.currentTime - this.selectedClip.start + this.selectedClip.offset);
        const kf = this.selectedClip.keyframes;
        
        // Update UI with current interpolated values
        this.inspectorInputs.x.value = this.getInterpolatedValue(kf.x, localT).toFixed(0);
        this.inspectorInputs.y.value = this.getInterpolatedValue(kf.y, localT).toFixed(0);
        this.inspectorInputs.s.value = this.getInterpolatedValue(kf.scale, localT).toFixed(1);
        this.inspectorInputs.r.value = this.getInterpolatedValue(kf.rot, localT).toFixed(0);
        this.inspectorInputs.o.value = this.getInterpolatedValue(kf.opacity, localT).toFixed(1);
    }

    attachEvents() {
        // Fullscreen Toggle
        const fsBtn = document.getElementById('ve-fullscreen');
        if(fsBtn) {
            fsBtn.onclick = () => {
                if (!document.fullscreenElement) {
                    this.canvas.requestFullscreen().catch(err => {
                        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
                    });
                } else {
                    if (document.exitFullscreen) document.exitFullscreen();
                }
            };
        }
        // Tab Switching Logic
        const tabFootage = document.getElementById('tab-footage');
        const tabEffects = document.getElementById('tab-effects');
        const tabAnims = document.getElementById('tab-anims');
        
        const hideAllTabs = () => {
            tabFootage.classList.remove('active');
            tabEffects.classList.remove('active');
            tabAnims.classList.remove('active');
            this.assetList.classList.add('hidden');
            this.effectsList.classList.add('hidden');
            this.animationsList.classList.add('hidden');
        }

        tabFootage.onclick = () => {
            hideAllTabs();
            tabFootage.classList.add('active');
            this.assetList.classList.remove('hidden');
        };

        tabEffects.onclick = () => {
            hideAllTabs();
            tabEffects.classList.add('active');
            this.effectsList.classList.remove('hidden');
        };

        tabAnims.onclick = () => {
            hideAllTabs();
            tabAnims.classList.add('active');
            this.animationsList.classList.remove('hidden');
        };

        // Effects Clicks
        const effectBtns = this.effectsList.querySelectorAll('.ve-asset-thumb');
        effectBtns.forEach(btn => {
            btn.onclick = () => {
                const effect = btn.getAttribute('data-effect');
                this.applyEffect(effect);
                // Highlight active effect visual
                effectBtns.forEach(b => b.style.borderColor = '#333');
                btn.style.borderColor = '#f75c5c';
            };
        });

        // Animations Clicks
        const animBtns = this.animationsList.querySelectorAll('.ve-asset-thumb');
        animBtns.forEach(btn => {
            btn.onclick = () => {
                const anim = btn.getAttribute('data-anim');
                this.applyAnimation(anim);
                animBtns.forEach(b => b.style.borderColor = '#333');
                btn.style.borderColor = '#f75c5c';
            };
        });

        // Import Button (inside footage list)
        const impBtn = document.getElementById('ve-import');
        if(impBtn) impBtn.onclick = () => this.importFile();

        document.getElementById('ve-render').onclick = () => this.exportVideo();
        
        // Advanced Playback Controls
        document.getElementById('ve-rewind').onclick = () => {
            this.currentTime = Math.max(0, this.currentTime - 5);
            this.updatePlayhead();
        };
        document.getElementById('ve-fastfwd').onclick = () => {
            this.currentTime = this.currentTime + 5;
            this.updatePlayhead();
        };

        // Jump to Start (Rewind to beginning)
        document.getElementById('ve-prev').onclick = () => {
            this.currentTime = 0;
            this.updatePlayhead();
        };

        // Jump to End (Forward to the very last clip)
        document.getElementById('ve-next').onclick = () => {
            const lastClipEnd = Math.max(...this.tracks.flat().map(c => c.start + c.duration), 0);
            this.currentTime = lastClipEnd;
            this.updatePlayhead();
        };

        // Replay Button
        document.getElementById('ve-replay').onclick = () => {
            this.currentTime = 0;
            this.updatePlayhead();
            if (!this.isPlaying) {
                document.getElementById('ve-play').click();
            }
        };

        // Volume Slider Logic
        document.getElementById('ve-volume').oninput = (e) => {
            const vol = parseFloat(e.target.value);
            const icon = document.getElementById('ve-vol-icon');
            icon.innerText = vol === 0 ? '🔇' : '🔊';
            
            // Apply volume to the active session elements
            this.assets.forEach(asset => {
                if (asset.element) {
                    asset.element.volume = vol;
                    asset.element.muted = (vol === 0);
                }
            });
        };

        // Volume Icon Toggle
        const volumeIcon = document.getElementById('ve-vol-icon');
        const volumeSlider = document.getElementById('ve-volume');

        if (volumeIcon && volumeSlider) {
            volumeIcon.onclick = () => {
                const currentVal = parseFloat(volumeSlider.value);
                const isAudible = currentVal > 0;
                const newVal = isAudible ? 0 : 1;
                
                volumeSlider.value = newVal;
                volumeIcon.innerText = isAudible ? '🔇' : '🔊';
                
                // Update all active assets immediately
                this.assets.forEach(asset => {
                    if (asset.element) {
                        asset.element.muted = (newVal === 0);
                        asset.element.volume = newVal;
                    }
                });
            };
        }

        // Play Button Logic (Master Unlock)
        const playBtn = document.getElementById('ve-play');
        playBtn.onclick = async () => { 
            this.isPlaying = !this.isPlaying; 
            playBtn.innerText = this.isPlaying ? '❚❚' : '▶';

            const currentVol = parseFloat(document.getElementById('ve-volume').value);
            
            this.assets.forEach(asset => {
                if (asset.element && asset.type === 'video') {
                    // FORCE SEEK: If we are at the start of the editor, force video to start
                    if (this.currentTime === 0) {
                        asset.element.currentTime = 0;
                    }

                    asset.element.muted = (currentVol === 0); 
                    asset.element.volume = currentVol;
                    
                    if (this.isPlaying) {
                        asset.element.play().catch(e => console.warn("Hardware block:", e));
                    } else {
                        asset.element.pause();
                    }
                }
            });
        };
        
        // Helper to add keyframe at current time
        const addKeyframe = (prop, val) => {
            if(!this.selectedClip) return;
            const localT = this.currentTime - this.selectedClip.start + this.selectedClip.offset;
            if(localT < 0) return;
            
            // Remove existing keyframe at same time (tolerance 0.05s)
            const arr = this.selectedClip.keyframes[prop];
            const idx = arr.findIndex(k => Math.abs(k.t - localT) < 0.05);
            if(idx > -1) arr.splice(idx, 1);
            
            arr.push({t: localT, v: val});
            arr.sort((a,b) => a.t - b.t);
            this.renderKeyframeList();
        };

        // Inspector Binding (Auto-add keyframe on change)
        const bindInp = (key, el) => {
            el.oninput = (e) => {
                addKeyframe(key, parseFloat(e.target.value));
            }
        };
        bindInp('x', this.inspectorInputs.x);
        bindInp('y', this.inspectorInputs.y);
        bindInp('scale', this.inspectorInputs.s);
        bindInp('rot', this.inspectorInputs.r);
        bindInp('opacity', this.inspectorInputs.o);

        document.getElementById('ve-del-clip').onclick = () => {
            if(!this.selectedClip) return;
            
            // Find the asset and pause it immediately
            const asset = this.assets.find(a => a.id === this.selectedClip.assetId);
            if (asset && asset.element) asset.element.pause();

            this.tracks.forEach(t => {
                const i = t.indexOf(this.selectedClip);
                if(i > -1) t.splice(i, 1);
            });
            this.selectedClip = null;
            this.renderTimeline();
            this.renderKeyframeList();
        };

        document.getElementById('btn-add-kf').onclick = () => {
            if(this.selectedClip) addKeyframe('opacity', 1); // Default action
        };

        // Color Wheels Logic (Now Updates Keyframes)
        const setupWheel = (id, rKey, gKey, bKey) => {
            const w = document.getElementById(id);
            const p = w.querySelector('.ve-puck');
            let drag = false;
            
            const handleMove = (clientX, clientY) => {
                if(!this.selectedClip) return;
                const rect = w.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // 1. Calculate raw offset from center
                let x = clientX - rect.left - centerX;
                let y = clientY - rect.top - centerY;
                
                // 2. Strict Radial Clamp
                const dist = Math.sqrt(x*x + y*y);
                const maxRad = (rect.width / 2) - 8; // Subtract half puck size for perfect fit
                
                if(dist > maxRad) { 
                    // Force the puck to sit exactly on the edge if the mouse is outside
                    x = (x / dist) * maxRad; 
                    y = (y / dist) * maxRad; 
                }
                
                // 3. Update Visual Puck Position
                p.style.left = (x + centerX) + 'px'; 
                p.style.top = (y + centerY) + 'px';
                
                // 4. Map normalized coordinates (-1.0 to 1.0) to grading engine
                const normX = x / maxRad; 
                const normY = -y / maxRad; // Invert Y for standard color math
                
                if(rKey.includes('lift')) {
                        addKeyframe(rKey, normX * 0.2);
                        addKeyframe(bKey, normY * 0.2);
                } else {
                        addKeyframe(rKey, 1.0 + normX);
                        addKeyframe(bKey, 1.0 + normY);
                }
            };
            w.onmousedown = (e) => { drag=true; handleMove(e.clientX, e.clientY); };
            window.addEventListener('mouseup', () => drag=false);
            window.addEventListener('mousemove', (e) => { if(drag) handleMove(e.clientX, e.clientY); });
        };
        
        setupWheel('wheel-lift', 'liftR', 'liftG', 'liftB');
        setupWheel('wheel-gamma', 'gammaR', 'gammaG', 'gammaB');
        setupWheel('wheel-gain', 'gainR', 'gainG', 'gainB');

        const ruler = document.getElementById('ve-ruler');
        // Ruler seeking logic
        if(ruler) {
            ruler.onmousedown = (e) => {
                const updateTime = (ev) => {
                    const rect = ruler.getBoundingClientRect();
                    const x = ev.clientX - rect.left;
                    this.currentTime = Math.max(0, x / this.zoom);
                    this.updatePlayhead();
                };
                updateTime(e);
                const move = (ev) => updateTime(ev);
                const stop = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', stop); };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', stop);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dockVideo = document.getElementById('dock-video');
    const videoModal = document.getElementById('video-modal');
    const closeVideo = document.getElementById('close-video-btn');
    const videoRoot = document.getElementById('video-editor-root');
    let editorInstance = null;


    if (dockVideo && videoModal) {
        dockVideo.onclick = () => {
            videoModal.classList.remove('hidden');
            
            // REFINED CENTER LAYOUT WITH PADDING CONSTRAINT
            videoModal.style.display = 'flex';
            videoModal.style.alignItems = 'center';
            videoModal.style.justifyContent = 'center';
            videoModal.style.zIndex = '10006'; 
            // REMOVED PADDING TO PREVENT OVERFLOW
            
            const frame = videoModal.querySelector('.terminal-frame');
            if(frame) {
                // SIZING LOGIC MATCHING PAINT APP EXACTLY
                frame.style.width = '98vw'; 
                frame.style.height = '98vh';
                frame.style.maxWidth = '1800px';
                frame.style.maxHeight = 'none'; // Uncap height to fill screen
                frame.style.background = '#000';
                
                // IMPORTANT FIX:
                frame.style.margin = 'auto'; // Ensures centering if flex is slightly off
                frame.style.boxSizing = 'border-box'; // Ensures border is INSIDE 98vh
                
                // ADDED NEON BORDER GLOW
                frame.style.border = '1px solid var(--theme-color)';
                frame.style.boxShadow = '0 0 10px var(--theme-color)';
                frame.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
            }

            if (!editorInstance && window.VideoEditor) editorInstance = new VideoEditor(videoRoot);
        };
        closeVideo.onclick = () => {
            videoModal.classList.add('hidden');
            videoModal.style.display = 'none';
            if (editorInstance) editorInstance.isPlaying = false;
        };
    }
});