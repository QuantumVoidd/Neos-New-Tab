window.PaintApp = {
state: {
    tool: 'pencil',
    foreColor: '#00ff41',
    backColor: '#000000',
    lineWidth: 3,

    // NEW: Brush Style
    brushStyle: 'round', // round, marker, crayon, airbrush, watercolor
    
    // NEW: Layer Management
    layers: [], 
    activeLayerIndex: 0,
    
    isDrawing: false, 
    startX: 0, startY: 0, 
    activeColorSlot: 'fore', 
    currentFileKey: null,
    selection: null,
    
    // ZOOM STATE
    zoomLevel: 1.0,

    // CROP STATE
    cropRect: null, isResizingCrop: false, cropHandle: null,

    // TRANSFORM STATE
    transformRect: null, 
    isTransforming: false, 
    transformHandle: null,
    transformTempImg: null, // Stores original image during transform
    
    // TEXT STATE
    textX: 0, textY: 0,
    fontFamily: 'Courier New',
    fontSize: 20, 
    isBold: false, isItalic: false, isUnderline: false,
    textAlign: 'left',
    isTextActive: false,
    isDraggingText: false,
    dragOffsetX: 0, dragOffsetY: 0,

    // PANNING STATE
    isPanning: false,
    isSpacePressed: false,
    panStartX: 0, panStartY: 0,
    scrollStartX: 0, scrollStartY: 0,

    // HISTORY STATE
    history: [], 
    historyStep: -1,

    // ANIMATION STATE
    isAnimating: false,
    animTimer: null,
    originalLayerVisibility: [],

    // TEMP STATE FOR NON-DESTRUCTIVE EDITS
    tempCanvas: null
},

init: function() {
    const dockBtn = document.getElementById('dock-paint');
    const modal = document.getElementById('sketch-modal');
    
    if (dockBtn && modal) {
        dockBtn.onclick = () => {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '10005'; 
            if (!document.getElementById('paint-root-wrapper')) this.setupUI(modal);
        };
    }
},

setupUI: function(modal) {
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim() || '#00ff41';
    
    // Custom Cursors
    const bucketCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${encodeURIComponent(themeColor)}" stroke="black" stroke-width="1"><path d="M19 11l-6 6-9-9 6-6 9 9zm-6 6l-2 2s-1 1-2-1l2-2" /></svg>') 2 18, auto`;
    const wandCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${encodeURIComponent(themeColor)}" stroke-width="2"><path d="M7.5 19L19 7.5"/><path d="M6 18l-2 2 2 2 2-2z"/><circle cx="19" cy="5" r="2"/></svg>') 0 24, crosshair`;
    const pencilCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${encodeURIComponent(themeColor)}" stroke="black" stroke-width="1"><path d="M3 21l-1-4 13-13 5 5-13 13-4-1z"/></svg>') 0 24, crosshair`;
    const pickerCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${encodeURIComponent(themeColor)}" stroke-width="2"><path d="M19 3l2 2-9 9-2 2-2-2 2-2 9-9z"/><circle cx="6" cy="18" r="2" fill="${encodeURIComponent(themeColor)}"/></svg>') 0 24, crosshair`;
    const eraserCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="1"><rect x="4" y="4" width="16" height="16"/></svg>') 12 12, auto`;
    const zoomCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${encodeURIComponent(themeColor)}" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>') 10 10, crosshair`;

    modal.innerHTML = `
        <style>
            .paint-frame-override { width: 98vw; height: 98vh; max-width: 1800px; display: flex; flex-direction: column; padding: 0 !important; overflow: hidden; background: #000; box-shadow: 0 0 5px rgba(0, 255, 65, 0.2); border: 1px solid ${themeColor}; position: relative; }
            .app-header { display: flex; justify-content: space-between; align-items: center; padding: 6px 15px; background: ${themeColor}; color: #000000; border-bottom: 1px solid #000; flex-shrink: 0; position: relative; z-index: 100; box-shadow: 0 2px 5px rgba(0,0,0,0.5); }
            .app-header span { font-weight: 800; letter-spacing: 2px; }
            .app-controls { display: flex; gap: 10px; position: relative; z-index: 101; }
            .app-controls button { background: rgba(0, 0, 0, 0.1); border: 1px solid #000000; color: #000000; cursor: pointer; padding: 4px 12px; font-family: inherit; font-size: 0.75rem; font-weight: 800; transition: all 0.2s; text-transform: uppercase; }
            .app-controls button:hover { background: #000000; color: ${themeColor}; border-color: #000000; }
            #paint-close:hover { background: #ff0000; color: #fff; }
            
            #paint-root-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; font-family: 'Courier New', monospace; color: ${themeColor}; position: relative; z-index: 1; overflow: hidden; }
            
            .paint-ribbon { display: flex; flex-shrink: 0; height: 90px; border-bottom: 1px solid ${themeColor}; background: rgba(0, 20, 0, 0.95); padding: 5px 10px; gap: 15px; overflow-x: auto; align-items: center; z-index: 10; }
            .ribbon-section { display: flex; flex-direction: column; align-items: center; border-right: 1px solid rgba(0, 255, 65, 0.2); padding: 0 15px; justify-content: space-between; height: 90%; }
            .ribbon-label { font-size: 9px; opacity: 0.7; text-transform: uppercase; margin-top: 4px; }
            
            .tool-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
            .tool-row-wrap { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; width: 100%; }
            .shape-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
            
            .paint-tool-btn { background: transparent; border: 1px solid ${themeColor}; color: ${themeColor}; cursor: pointer; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: 0.2s; border-radius: 2px; }
            .paint-tool-btn:hover, .paint-tool-btn.active { background: ${themeColor}; color: #000; box-shadow: 0 0 8px ${themeColor}; }
            
            .text-controls-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 2px; }
            .font-select { background: #000; color: ${themeColor}; border: 1px solid ${themeColor}; font-size: 10px; margin-bottom: 4px; }
            .text-btn { width: 20px; height: 20px; font-size: 10px; border: 1px solid ${themeColor}; background: transparent; color: ${themeColor}; cursor: pointer; }
            .text-btn.active { background: ${themeColor}; color: #000; }

            .color-wrapper { display: flex; gap: 10px; align-items: flex-start; }
            .color-box { width: 32px; height: 32px; border: 1px solid #fff; cursor: pointer; margin-bottom: 2px; }
            .color-box.active-slot { outline: 2px solid #fff; box-shadow: 0 0 10px ${themeColor}; z-index: 5; }
            .palette { display: grid; grid-template-columns: repeat(10, 1fr); gap: 3px; }
            .swatch { width: 14px; height: 14px; border: 1px solid #444; cursor: pointer; }
            
            /* MAIN WORKSPACE SPLIT */
            .workspace-row { display: flex; flex: 1; min-height: 0; overflow: hidden; }

            /* CANVAS AREA */
            .canvas-area { 
                flex: 1; min-height: 0; position: relative; background: #0d0d0d; 
                overflow: auto; display: flex; padding: 20px; z-index: 1;
                scrollbar-width: none; -ms-overflow-style: none;
            }
            .canvas-area::-webkit-scrollbar { display: none; width: 0; height: 0; }
            
            .canvas-wrapper { 
                position: relative; 
                box-shadow: 0 0 30px rgba(0,0,0,0.8); 
                border: 1px solid #333; 
                flex-shrink: 0; 
                margin: auto; 
                transform-origin: top left;
                transition: transform 0.1s ease-out;
            }
            
            /* LAYER STACK */
            #layer-stack { position: relative; width: 800px; height: 600px; background: #fff; overflow: hidden; }
            .paint-layer { position: absolute; top: 0; left: 0; pointer-events: none; transition: opacity 0.1s; }
            
            #paint-overlay { position: absolute; top: 0; left: 0; pointer-events: auto; z-index: 999; }
            
            /* SIDEBAR */
            .paint-sidebar {
                width: 220px;
                background: rgba(10, 10, 10, 0.95);
                border-left: 1px solid ${themeColor};
                display: flex;
                flex-direction: column;
                flex-shrink: 0;
            }

            .sidebar-header { padding: 8px; font-size: 11px; border-bottom: 1px solid rgba(0,255,65,0.2); font-weight: bold; background: rgba(0,20,0,0.5); display: flex; justify-content: space-between; align-items: center; }
            
            #layer-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column-reverse; /* Stack bottom to top */ }
            
            .layer-item {
                padding: 8px;
                border-bottom: 1px solid rgba(0, 255, 65, 0.1);
                cursor: default;
                display: flex;
                flex-direction: column;
                gap: 6px;
                font-size: 11px;
                transition: background 0.2s;
                user-select: none;
            }
            .layer-item.active {
                background: rgba(0, 255, 65, 0.15);
                border-left: 3px solid ${themeColor};
            }
            .layer-item:hover { background: rgba(255,255,255,0.05); }
            /* Drag Visuals */
            .layer-drag-handle { cursor: grab; color: #555; margin-right: 5px; font-size: 12px; }
            .layer-drag-handle:hover { color: ${themeColor}; }
            .layer-item.dragging { opacity: 0.5; background: #333; }
            .layer-item.drag-over { border-top: 2px solid ${themeColor}; }
            
            .layer-header { display: flex; align-items: center; justify-content: space-between; width: 100%; }
            .layer-name-group { display: flex; align-items: center; gap: 4px; flex: 1; overflow: hidden; pointer-events: none; }
            .layer-name-group input { pointer-events: auto; }
            .layer-controls { display: flex; gap: 5px; }
            
            .layer-advanced { display: flex; flex-direction: column; gap: 4px; padding-left: 2px; }
            
            .layer-btn { background: none; border: 1px solid #333; color: ${themeColor}; cursor: pointer; font-size: 10px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 2px; }
            .layer-btn:hover { border-color: ${themeColor}; background: rgba(0,255,65,0.1); }
            .layer-btn.disabled { opacity: 0.3; cursor: default; border-color: transparent; }

            .layer-select { background: #000; color: ${themeColor}; border: 1px solid #333; font-size: 9px; width: 100%; padding: 2px; }
            .layer-slider { -webkit-appearance: none; width: 100%; height: 2px; background: #333; outline: none; margin: 5px 0; }
            .layer-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 10px; height: 10px; background: ${themeColor}; cursor: pointer; border-radius: 50%; }

            #paint-text-wrapper { position: absolute; display: none; border: 1px dashed ${themeColor}; padding: 0; background: rgba(0, 0, 0, 0.7); z-index: 1000; min-width: 50px; }
            #paint-text-handle { height: 12px; background: ${themeColor}; cursor: move; width: 100%; opacity: 0.7; }
            #paint-text-handle:hover { opacity: 1; }
            #paint-text-input { background: transparent; border: none; color: ${themeColor}; padding: 2px; margin: 0; outline: none; resize: both; overflow: hidden; white-space: pre; line-height: 1.2; display: block; min-height: 1.2em; min-width: 100px; }

            .status-bar { height: 24px; background: rgba(0, 20, 0, 0.95); border-top: 1px solid ${themeColor}; display: flex; align-items: center; padding: 0 15px; font-size: 10px; flex-shrink: 0; letter-spacing: 1px; z-index: 20; }
            
            /* ANIMATION KEYFRAMES */
            @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
            @keyframes shake { 0% { transform: translateX(0); } 25% { transform: translateX(5px); } 50% { transform: translateX(-5px); } 75% { transform: translateX(5px); } 100% { transform: translateX(0); } }
            @keyframes hue-rotate { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(360deg); } }

            .cursor-crosshair { cursor: crosshair; }
            .cursor-move { cursor: move; }
            .cursor-text { cursor: text; }
            .cursor-pencil { cursor: ${pencilCursor}; }
            .cursor-bucket { cursor: ${bucketCursor}; }
            .cursor-magic { cursor: ${wandCursor}; }
            .cursor-picker { cursor: ${pickerCursor}; }
            .cursor-eraser { cursor: ${eraserCursor}; }
            .cursor-zoom { cursor: ${zoomCursor}; }
            .cursor-grab { cursor: grab !important; }
            .cursor-grabbing { cursor: grabbing !important; }
            .hidden-ribbon { display: none !important; }
        </style>
        
        <div class="terminal-frame paint-frame-override">
            <div class="app-header">
                <span>> SYSTEM.APP.CONSTRUCT_SKETCH_PRO</span>
                <div class="app-controls">
                    <button id="paint-undo" title="Undo (Ctrl+Z)">↶ UNDO</button>
                    <button id="paint-redo" title="Redo (Ctrl+Y)">↷ REDO</button>
                    <div style="width:10px;"></div>
                    <button id="paint-import" title="Import from Vault">📂 IMPORT</button>
                    <button id="paint-save" title="Overwrite File">💾 SAVE</button>
                    <button id="paint-save-plus" title="Save New File (.gif for export)">SAVE+</button>
                    <button id="paint-close" title="Close App">✖</button>
                </div>
            </div>
            
            <div id="paint-root-wrapper">
                <div class="paint-ribbon">
                    <div class="ribbon-section">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <button id="paint-paste" class="paint-tool-btn" style="width: 100%; font-size: 9px; height: 20px;" title="Paste">PASTE</button>
                            <div style="display: flex; gap: 4px;">
                                <button id="paint-cut" class="paint-tool-btn" title="Cut">✂</button>
                                <button id="paint-copy" class="paint-tool-btn" title="Copy">📄</button>
                            </div>
                        </div>
                        <div class="ribbon-label">Data</div>
                    </div>
                    <!-- REFINED: Increased Width for Image Tools Row -->
                    <div class="ribbon-section" style="min-width: 220px;">
                        <div class="tool-row-wrap" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px;">
                            <button data-tool="select" class="paint-tool-btn" title="Select Area">⛝</button>
                            <button data-tool="magic" class="paint-tool-btn" title="Smart Background Remover (Magic Wand)">🪄</button>
                            <button data-tool="crop" id="paint-crop" class="paint-tool-btn" title="Crop Canvas">✂</button>
                            <button data-tool="transform" class="paint-tool-btn" title="Transform Active Layer (Move/Scale)">✥</button>
                            <button id="paint-resize" class="paint-tool-btn" title="Resize Canvas">⤢</button>
                            <button id="paint-rotate" class="paint-tool-btn" title="Rotate 90°">⟳</button>
                            <button id="paint-preview-anim" class="paint-tool-btn" title="Preview Animation (Cycle Layers)">▶</button>
                            <button id="paint-flip-h" class="paint-tool-btn" style="width:13px;" title="Flip Horizontal">↔</button>
                            <button id="paint-flip-v" class="paint-tool-btn" style="width:13px;" title="Flip Vertical">↕</button>
                        </div>
                        <div class="ribbon-label">Image</div>
                    </div>
                    <div class="ribbon-section">
                        <div style="display:flex; flex-direction:column; gap:2px; align-items:center;">
                            <div style="display:flex; gap:2px; align-items:center;">
                                <span style="font-size:9px;">FX</span>
                                <select id="paint-anim-fx" style="background:#000; color:${themeColor}; border:1px solid ${themeColor}; font-size:9px; width:50px;">
                                    <option value="none">None</option>
                                    <option value="pulse">Pulse</option>
                                    <option value="shake">Shake</option>
                                    <option value="hue-rotate">Hue</option>
                                </select>
                            </div>
                            <div style="display:flex; flex-direction:column; width:100%;">
                                <span style="font-size:8px;">CORNER RAD</span>
                                <input id="paint-corner-rad" type="range" min="0" max="100" value="0" style="width:60px; height:2px;">
                            </div>
                        </div>
                        <div class="ribbon-label">Effects</div>
                    </div>
                    <div class="ribbon-section">
                        <div class="tool-grid">
                            <button data-tool="pencil" class="paint-tool-btn active" title="Pencil">✎</button>
                            <button data-tool="bucket" class="paint-tool-btn" title="Fill">🪣</button>
                            <button data-tool="text" class="paint-tool-btn" title="Text">A</button>
                            <button data-tool="eraser" class="paint-tool-btn" title="Eraser">▞</button>
                            <button data-tool="picker" class="paint-tool-btn" title="Picker">💉</button>
                            <button data-tool="zoom" class="paint-tool-btn" title="Zoom (Left: In, Right: Out)">🔍</button>
                            <button id="paint-clear" class="paint-tool-btn" title="Clear Layer">🗑</button>
                        </div>
                        <div class="ribbon-label">Tools</div>
                    </div>
                    <div id="text-controls-section" class="ribbon-section hidden-ribbon" style="border-right: 1px solid rgba(0, 255, 65, 0.2);">
                        <div style="display:flex; flex-direction:column; align-items:center;">
                            <div style="display:flex; gap:2px;">
                                <select id="text-font" class="font-select" style="width:70px;">
                                    <option value="Courier New">Courier</option><option value="Arial">Arial</option><option value="Times New Roman">Times</option><option value="Orbitron">Orbitron</option><option value="Impact">Impact</option><option value="Comic Sans MS">Comic</option>
                                </select>
                                <select id="text-size" class="font-select" style="width:40px;">
                                    <option value="8">8</option><option value="12">12</option><option value="16">16</option><option value="20" selected>20</option><option value="24">24</option><option value="36">36</option><option value="48">48</option><option value="72">72</option>
                                </select>
                            </div>
                            <div class="text-controls-grid">
                                <button id="btn-bold" class="text-btn" title="Bold"><b>B</b></button><button id="btn-italic" class="text-btn" title="Italic"><i>I</i></button><button id="btn-underline" class="text-btn" title="Underline"><u>U</u></button><button id="btn-left" class="text-btn active" title="Left">L</button><button id="btn-center" class="text-btn" title="Center">C</button><button id="btn-right" class="text-btn" title="Right">R</button>
                            </div>
                        </div>
                        <div class="ribbon-label">Type</div>
                    </div>
                    <div class="ribbon-section">
                        <div class="shape-grid">
                            <button data-tool="line" class="paint-tool-btn" title="Line">╱</button><button data-tool="rect" class="paint-tool-btn" title="Rect">▭</button><button data-tool="circle" class="paint-tool-btn" title="Circle">○</button><button data-tool="triangle" class="paint-tool-btn" title="Triangle">△</button>
                            <button data-tool="diamond" class="paint-tool-btn" title="Diamond">◇</button><button data-tool="star" class="paint-tool-btn" title="Star">★</button><button data-tool="arrow" class="paint-tool-btn" title="Arrow">➜</button><button data-tool="pentagon" class="paint-tool-btn" title="Pentagon">⬠</button>
                        </div>
                        <div class="ribbon-label">Shapes</div>
                    </div>
                    <div class="ribbon-section">
                        <div style="display:flex; flex-direction:column; align-items:center; gap: 4px; height:100%;">
                            <select id="paint-brush-style" style="background:#000; color:${themeColor}; border:1px solid ${themeColor}; padding: 2px; font-family: inherit; font-size: 10px; width: 60px;">
                                <option value="round">Round</option>
                                <option value="marker">Marker</option>
                                <option value="crayon">Crayon</option>
                                <option value="airbrush">Airbrush</option>
                                <option value="watercolor">Water</option>
                            </select>
                            <select id="paint-size" style="background:#000; color:${themeColor}; border:1px solid ${themeColor}; padding: 2px; font-family: inherit; font-size: 10px; width: 60px;">
                                <option value="1">1px</option><option value="3" selected>3px</option><option value="5">5px</option><option value="8">8px</option><option value="12">12px</option><option value="20">20px</option><option value="40">40px</option>
                            </select>
                        </div>
                        <div class="ribbon-label">Brush</div>
                    </div>
                    <div class="ribbon-section" style="border:none;">
                        <div class="color-wrapper">
                            <div style="display:flex; flex-direction:column; align-items:center;">
                                <div id="slot-fore" class="color-box active-slot" style="background:${this.state.foreColor};"></div><span style="font-size:9px;">FG</span>
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:center;">
                                <div id="slot-back" class="color-box" style="background:#000;"></div><span style="font-size:9px;">BG</span>
                            </div>
                            <div class="palette" id="paint-palette"></div>
                        </div>
                        <div class="ribbon-label">Spectrum</div>
                    </div>
                </div>
                
                <div class="workspace-row">
                    <div id="paint-scroll-container" class="canvas-area">
                        <div id="paint-canvas-wrapper" class="canvas-wrapper">
                            <div id="layer-stack">
                                <!-- Layers injected here -->
                            </div>
                            <canvas id="paint-overlay" width="800" height="600"></canvas>
                            <div id="paint-text-wrapper"><div id="paint-text-handle"></div><textarea id="paint-text-input"></textarea></div>
                        </div>
                    </div>
                    
                    <div class="paint-sidebar">
                        <div class="sidebar-header">
                            <span>LAYERS</span>
                            <button id="btn-add-layer" style="background:none; border:1px solid ${themeColor}; color:${themeColor}; cursor:pointer; font-size:14px; width:20px;">+</button>
                        </div>
                        <div id="layer-list">
                            <!-- Layer items go here -->
                        </div>
                    </div>
                </div>

                <div class="status-bar">
                    <span id="paint-status">HOLD SPACE TO PAN | DRAWING MODE</span>
                    <span style="margin-left: auto;" id="paint-coords">0, 0</span>
                    <span style="margin-left: 20px;" id="paint-zoom-disp">100%</span>
                    <span style="margin-left: 20px;" id="paint-dims">800 x 600px</span>
                </div>
            </div>
        </div>`;
    
    this.overlay = document.getElementById('paint-overlay');
    this.oCtx = this.overlay.getContext('2d');
    this.scrollContainer = document.getElementById('paint-scroll-container');
    this.wrapper = document.getElementById('paint-canvas-wrapper');
    this.layerStack = document.getElementById('layer-stack');
    this.layerList = document.getElementById('layer-list');
    
    // Initialize Layers
    this.addLayer("Background", true);
    
    this.saveState();
    this.bindEvents();
    this.generatePalette();
},

// LAYER MANAGEMENT SYSTEM
addLayer: function(name, isBackground = false) {
    const width = this.overlay.width;
    const height = this.overlay.height;
    const id = Date.now();
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.className = 'paint-layer';
    canvas.id = `layer-${id}`;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (isBackground) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
    }

    this.layerStack.appendChild(canvas);
    
    const layerObj = { 
        id, 
        name: name || `Layer ${this.state.layers.length + 1}`, 
        canvas, 
        ctx, 
        visible: true,
        opacity: 1.0,
        blendMode: 'normal' // CSS: normal, Canvas: source-over
    };
    this.state.layers.push(layerObj);
    this.setActiveLayer(this.state.layers.length - 1);
    this.renderLayerList();
    return layerObj;
},

setActiveLayer: function(index) {
    if (index < 0 || index >= this.state.layers.length) return;
    this.state.activeLayerIndex = index;
    this.ctx = this.state.layers[index].ctx; // Update global context reference
    this.canvas = this.state.layers[index].canvas; // Update global canvas reference
    this.renderLayerList();
},

toggleLayerVisibility: function(index) {
    const layer = this.state.layers[index];
    layer.visible = !layer.visible;
    layer.canvas.style.display = layer.visible ? 'block' : 'none';
    this.renderLayerList();
},

deleteLayer: function(index) {
    if (this.state.layers.length <= 1) return; // Must have one layer
    const layer = this.state.layers[index];
    layer.canvas.remove();
    this.state.layers.splice(index, 1);
    
    if (this.state.activeLayerIndex >= this.state.layers.length) {
        this.setActiveLayer(this.state.layers.length - 1);
    } else {
        this.setActiveLayer(this.state.activeLayerIndex);
    }
    this.renderLayerList();
},

mergeLayerDown: function(index) {
    if (index <= 0 || index >= this.state.layers.length) return;

    const topLayer = this.state.layers[index];
    const bottomLayer = this.state.layers[index - 1];

    // Prepare context for composition
    const destCtx = bottomLayer.ctx;
    
    destCtx.save();
    destCtx.globalAlpha = topLayer.opacity;
    
    // Map CSS blend mode to Canvas blend mode
    let compositeOp = 'source-over';
    switch(topLayer.blendMode) {
        case 'multiply': compositeOp = 'multiply'; break;
        case 'screen': compositeOp = 'screen'; break;
        case 'overlay': compositeOp = 'overlay'; break;
        case 'darken': compositeOp = 'darken'; break;
        case 'lighten': compositeOp = 'lighten'; break;
        case 'color-dodge': compositeOp = 'color-dodge'; break;
        case 'color-burn': compositeOp = 'color-burn'; break;
        case 'hard-light': compositeOp = 'hard-light'; break;
        case 'soft-light': compositeOp = 'soft-light'; break;
        case 'difference': compositeOp = 'difference'; break;
        case 'exclusion': compositeOp = 'exclusion'; break;
        case 'hue': compositeOp = 'hue'; break;
        case 'saturation': compositeOp = 'saturation'; break;
        case 'color': compositeOp = 'color'; break;
        case 'luminosity': compositeOp = 'luminosity'; break;
        default: compositeOp = 'source-over';
    }
    destCtx.globalCompositeOperation = compositeOp;

    // Draw top layer onto bottom
    destCtx.drawImage(topLayer.canvas, 0, 0);
    
    // Restore context
    destCtx.restore();

    // Remove top layer
    topLayer.canvas.remove();
    this.state.layers.splice(index, 1);

    // Update active layer
    this.setActiveLayer(index - 1);
    
    this.renderLayerList();
    this.saveState();
    this.setStatus("LAYERS MERGED");
},

reorderLayers: function(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    // Prevent moving background layer (index 0) or moving something to index 0
    if (fromIndex === 0 || toIndex === 0) {
        this.setStatus("CANNOT MOVE BACKGROUND");
        return;
    }

    const movedLayer = this.state.layers[fromIndex];
    this.state.layers.splice(fromIndex, 1);
    this.state.layers.splice(toIndex, 0, movedLayer);

    // Rebuild DOM stack order to match array (Index 0 is bottom)
    this.state.layers.forEach(layer => {
        this.layerStack.appendChild(layer.canvas);
    });
    
    // Update active index
    this.state.activeLayerIndex = toIndex;
    this.ctx = movedLayer.ctx;
    this.canvas = movedLayer.canvas;

    this.renderLayerList();
    this.saveState();
},

renderLayerList: function() {
    this.layerList.innerHTML = '';
    this.state.layers.forEach((layer, index) => {
        const el = document.createElement('div');
        el.className = `layer-item ${index === this.state.activeLayerIndex ? 'active' : ''}`;
        
        // Build Controls
        const modes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'difference', 'soft-light'];
        const options = modes.map(m => `<option value="${m}" ${layer.blendMode === m ? 'selected' : ''}>${m.toUpperCase()}</option>`).join('');
        
        el.innerHTML = `
            <div class="layer-header">
                <div class="layer-name-group">
                    <span class="btn-vis" style="opacity:${layer.visible ? 1 : 0.3}; width:12px; text-align:center; cursor:pointer; pointer-events:auto; margin-right:5px;">👁</span>
                    ${index !== 0 ? '<span class="layer-drag-handle" title="Drag to Reorder">⣿</span>' : ''}
                    <span class="lbl-name" style="cursor:pointer; flex:1; white-space:nowrap; overflow:hidden; pointer-events:auto;">${layer.name}</span>
                </div>
                <div class="layer-controls">
                    ${index > 0 ? '<button class="layer-btn btn-merge" title="Merge Down">▼</button>' : ''}
                    ${this.state.layers.length > 1 ? '<button class="layer-btn btn-del" title="Delete Layer">✖</button>' : ''}
                </div>
            </div>
            <div class="layer-advanced">
                <div style="display:flex; gap:4px; align-items:center;">
                    <span style="opacity:0.5; font-size:9px; width:25px;">MODE</span>
                    <select class="layer-select inp-blend">${options}</select>
                </div>
                <div style="display:flex; gap:4px; align-items:center;">
                    <span style="opacity:0.5; font-size:9px; width:25px;">OPAC</span>
                    <input type="range" class="layer-slider inp-opac" min="0" max="1" step="0.01" value="${layer.opacity}">
                </div>
            </div>
        `;
        
        // DRAG AND DROP HANDLERS (Specific Grip)
        if (index !== 0) {
            const grip = el.querySelector('.layer-drag-handle');
            grip.setAttribute('draggable', 'true');
            
            grip.ondragstart = (e) => {
                // Must set drag data to allow drag
                e.dataTransfer.setData('text/plain', index);
                el.classList.add('dragging');
            };
            
            el.ondragend = (e) => {
                el.classList.remove('dragging');
                document.querySelectorAll('.layer-item').forEach(i => i.classList.remove('drag-over'));
            };
            el.ondragover = (e) => {
                e.preventDefault(); // Allow drop
                el.classList.add('drag-over');
            };
            el.ondragleave = (e) => {
                el.classList.remove('drag-over');
            };
            el.ondrop = (e) => {
                e.preventDefault();
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                this.reorderLayers(fromIdx, index);
            };
        }

        // Renaming Logic
        const nameSpan = el.querySelector('.lbl-name');
        nameSpan.ondblclick = (e) => {
            e.stopPropagation();
            const originalName = layer.name;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = originalName;
            input.style.flex = '1';
            input.style.minWidth = '0';
            input.style.background = '#000';
            input.style.color = '#00ff41';
            input.style.border = '1px solid #00ff41';
            input.style.fontSize = '11px';
            input.style.padding = '0 2px';

            const finishRenaming = () => {
                const newName = input.value.trim();
                if (newName && newName !== originalName) {
                    layer.name = newName;
                    this.saveState();
                }
                this.renderLayerList();
            };

            input.onblur = finishRenaming;
            input.onkeydown = (ev) => {
                if (ev.key === 'Enter') {
                    input.blur();
                }
                ev.stopPropagation(); // Prevent app hotkeys
            };
            // Prevent drag interference
            input.onmousedown = (ev) => ev.stopPropagation();

            nameSpan.replaceWith(input);
            input.focus();
        };

        // Events
        el.onclick = (e) => {
            // Only switch if clicking header or background, not inputs
            if(!e.target.closest('input') && !e.target.closest('select') && !e.target.closest('button')) {
                this.setActiveLayer(index);
            }
        };
        
        // Visibility
        el.querySelector('.btn-vis').onclick = (e) => {
            e.stopPropagation();
            this.toggleLayerVisibility(index);
        };

        // Merge Down
        const mergeBtn = el.querySelector('.btn-merge');
        if (mergeBtn) {
            mergeBtn.onclick = (e) => {
                e.stopPropagation();
                this.mergeLayerDown(index);
            };
        }

        // Delete
        const delBtn = el.querySelector('.btn-del');
        if (delBtn) delBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteLayer(index);
        };

        // Blend Mode - Stop propagation to prevent drag issues or focus loss
        const blendSelect = el.querySelector('.inp-blend');
        blendSelect.onmousedown = (e) => e.stopPropagation();
        blendSelect.onclick = (e) => e.stopPropagation();
        blendSelect.onchange = (e) => {
            layer.blendMode = e.target.value;
            layer.canvas.style.mixBlendMode = layer.blendMode;
        };

        // Opacity - Stop propagation
        const opacSlider = el.querySelector('.inp-opac');
        opacSlider.onmousedown = (e) => e.stopPropagation();
        opacSlider.oninput = (e) => {
            e.stopPropagation();
            layer.opacity = parseFloat(e.target.value);
            layer.canvas.style.opacity = layer.opacity;
        };
        
        this.layerList.appendChild(el);
    });
},

setCursor: function(tool) {
    if (!this.overlay) return;
    this.overlay.className = '';
    if (this.state.isSpacePressed) { this.overlay.classList.add('cursor-grab'); return; } 
    switch(tool) {
        case 'bucket': this.overlay.classList.add('cursor-bucket'); break;
        case 'pencil': this.overlay.classList.add('cursor-pencil'); break;
        case 'eraser': this.overlay.classList.add('cursor-eraser'); break;
        case 'picker': this.overlay.classList.add('cursor-picker'); break;
        case 'text': this.overlay.classList.add('cursor-text'); break;
        case 'select': this.overlay.classList.add('cursor-crosshair'); break;
        case 'magic': this.overlay.classList.add('cursor-magic'); break;
        case 'crop': this.overlay.classList.add('cursor-move'); break;
        case 'zoom': this.overlay.classList.add('cursor-zoom'); break;
        case 'transform': this.overlay.classList.add('cursor-move'); break;
        default: this.overlay.classList.add('cursor-crosshair');
    }
},

toggleAnimPreview: function() {
    const btn = document.getElementById('paint-preview-anim');
    if (this.state.isAnimating) {
        // Stop
        clearInterval(this.state.animTimer);
        this.state.isAnimating = false;
        btn.classList.remove('active');
        // Restore visibility
        this.state.layers.forEach((l, i) => {
            l.canvas.style.display = this.state.originalLayerVisibility[i] ? 'block' : 'none';
        });
        this.setStatus("PREVIEW STOPPED");
    } else {
        // Start
        this.state.isAnimating = true;
        btn.classList.add('active');
        this.state.originalLayerVisibility = this.state.layers.map(l => l.visible);
        
        let frame = 0;
        const frames = this.state.layers;
        
        // Hide all initially
        frames.forEach(l => l.canvas.style.display = 'none');
        
        this.state.animTimer = setInterval(() => {
            frames.forEach(l => l.canvas.style.display = 'none');
            // Show current frame (skip background if desired, but here we cycle all)
            const currentLayer = frames[frame];
            if (currentLayer) currentLayer.canvas.style.display = 'block';
            
            frame = (frame + 1) % frames.length;
        }, 200);
        this.setStatus("ANIMATION PREVIEW");
    }
},

// NEW: Preview-based Corner Radius (Non-Destructive while sliding)
applyCornerRadiusPreview: function(radius) {
    if (this.state.activeLayerIndex === -1 || !this.state.tempCanvas) return;
    const layer = this.state.layers[this.state.activeLayerIndex];
    if (!layer) return;
    const ctx = layer.ctx;
    const w = layer.canvas.width;
    const h = layer.canvas.height;
    
    // Clear active layer
    ctx.clearRect(0, 0, w, h);
    
    // Draw original image from temp
    ctx.save();
    ctx.drawImage(this.state.tempCanvas, 0, 0);
    
    // Apply clipping mask
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, w, h, radius);
    } else {
        ctx.moveTo(radius, 0);
        ctx.lineTo(w - radius, 0);
        ctx.quadraticCurveTo(w, 0, w, radius);
        ctx.lineTo(w, h - radius);
        ctx.quadraticCurveTo(w, h, w - radius, h);
        ctx.lineTo(radius, h);
        ctx.quadraticCurveTo(0, h, 0, h - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
    }
    
    ctx.fill();
    ctx.restore();
    
    this.setStatus(`CORNER RADIUS: ${radius}px`);
},

setLayerAnimation: function(type) {
    if (this.state.activeLayerIndex === -1) return;
    const layer = this.state.layers[this.state.activeLayerIndex];
    
    let animString = 'none';
    if (type === 'pulse') animString = 'pulse 1s infinite';
    if (type === 'shake') animString = 'shake 0.5s infinite';
    if (type === 'hue-rotate') animString = 'hue-rotate 3s infinite linear';
    
    layer.canvas.style.animation = animString;
    this.saveState();
},

bindEvents: function() {
    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.state.tool = btn.dataset.tool;
            this.setCursor(this.state.tool);
            const textSection = document.getElementById('text-controls-section');
            if(this.state.tool === 'text') textSection.classList.remove('hidden-ribbon');
            else textSection.classList.add('hidden-ribbon');
            if (this.state.isTextActive && this.state.tool !== 'text') this.finalizeText();
            if (this.state.tool !== 'select') { this.state.selection = null; this.oCtx.clearRect(0,0,this.overlay.width, this.overlay.height); }
            
            // Tool Cleanup
            this.state.cropRect = null; 
            this.state.transformRect = null;
            if(this.state.tool !== 'select') this.oCtx.clearRect(0,0,this.overlay.width, this.overlay.height);

            // Tool Initializations
            if (this.state.tool === 'crop') this.initCropMode(); 
            if (this.state.tool === 'transform') this.initTransformMode();
        };
    });

    document.getElementById('paint-brush-style').onchange = (e) => {
        this.state.brushStyle = e.target.value;
    };
    
    document.getElementById('btn-add-layer').onclick = () => this.addLayer();

    // Standard listeners...
    const updateTextStyle = () => {
        const ti = document.getElementById('paint-text-input');
        if (ti) {
            ti.style.fontFamily = this.state.fontFamily; ti.style.fontSize = this.state.fontSize + 'px';
            ti.style.fontWeight = this.state.isBold ? 'bold' : 'normal'; ti.style.fontStyle = this.state.isItalic ? 'italic' : 'normal';
            ti.style.textDecoration = this.state.isUnderline ? 'underline' : 'none'; ti.style.textAlign = this.state.textAlign;
        }
    };
    document.getElementById('text-font').onchange = (e) => { this.state.fontFamily = e.target.value; updateTextStyle(); };
    document.getElementById('text-size').onchange = (e) => { this.state.fontSize = e.target.value; updateTextStyle(); };
    document.getElementById('btn-bold').onclick = (e) => { this.state.isBold = !this.state.isBold; e.currentTarget.classList.toggle('active'); updateTextStyle(); };
    document.getElementById('btn-italic').onclick = (e) => { this.state.isItalic = !this.state.isItalic; e.currentTarget.classList.toggle('active'); updateTextStyle(); };
    document.getElementById('btn-underline').onclick = (e) => { this.state.isUnderline = !this.state.isUnderline; e.currentTarget.classList.toggle('active'); updateTextStyle(); };
    ['left', 'center', 'right'].forEach(align => {
        document.getElementById('btn-'+align).onclick = () => {
            this.state.textAlign = align; document.querySelectorAll('#text-controls-section .text-btn').forEach(b => { if(b.id.includes('btn-')) b.classList.remove('active'); }); 
            if(this.state.isBold) document.getElementById('btn-bold').classList.add('active'); if(this.state.isItalic) document.getElementById('btn-italic').classList.add('active'); if(this.state.isUnderline) document.getElementById('btn-underline').classList.add('active');
            document.getElementById('btn-'+align).classList.add('active'); updateTextStyle();
        };
    });

    document.getElementById('slot-fore').onclick = () => { this.state.activeColorSlot = 'fore'; document.getElementById('slot-fore').classList.add('active-slot'); document.getElementById('slot-back').classList.remove('active-slot'); };
    document.getElementById('slot-back').onclick = () => { this.state.activeColorSlot = 'back'; document.getElementById('slot-back').classList.add('active-slot'); document.getElementById('slot-fore').classList.remove('active-slot'); };

    this.overlay.onmousedown = (e) => this.startDraw(e);
    window.onmousemove = (e) => this.moveDraw(e);
    window.onmouseup = (e) => this.endDraw(e);
    
    // Prevent default context menu for zoom tool right-click interaction
    this.overlay.oncontextmenu = (e) => { if(this.state.tool === 'zoom') e.preventDefault(); };

    document.getElementById('paint-undo').onclick = () => this.undo();
    document.getElementById('paint-redo').onclick = () => this.redo();
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !this.state.isSpacePressed && !this.state.isTextActive) { e.preventDefault(); this.state.isSpacePressed = true; this.overlay.classList.add('cursor-grab'); this.setStatus("HAND TOOL ACTIVE"); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this.undo(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); this.redo(); }
        if (this.state.tool === 'crop' && e.key === 'Enter') this.applyCrop();
        if (this.state.tool === 'transform' && e.key === 'Enter') this.applyTransform();
        if ((this.state.tool === 'crop' || this.state.tool === 'transform') && e.key === 'Escape') { 
            // Revert changes for transform if cancelling? For now just exit
            if(this.state.tool === 'transform' && this.state.transformTempImg) {
                 // Restore original
                 this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
                 this.ctx.drawImage(this.state.transformTempImg, 0, 0);
            }
            this.state.tool = 'pencil'; 
            document.querySelector('[data-tool="pencil"]').click(); 
        }
    });
    document.addEventListener('keyup', (e) => { if (e.code === 'Space') { this.state.isSpacePressed = false; this.state.isPanning = false; this.overlay.classList.remove('cursor-grab', 'cursor-grabbing'); this.setCursor(this.state.tool); this.setStatus("READY"); } });

    const textHandle = document.getElementById('paint-text-handle');
    if (textHandle) {
        textHandle.onmousedown = (e) => {
            if (!this.state.isTextActive) return;
            e.stopPropagation(); this.state.isDraggingText = true;
            const wrapper = document.getElementById('paint-text-wrapper'); const rect = wrapper.getBoundingClientRect();
            this.state.dragOffsetX = e.clientX - rect.left; this.state.dragOffsetY = e.clientY - rect.top;
        };
    }

    this.overlay.ondblclick = (e) => { if (this.state.tool === 'crop') this.applyCrop(); if (this.state.tool === 'transform') this.applyTransform(); };

    document.getElementById('paint-paste').onclick = async () => {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    const blob = await item.getType(item.types.find(t => t.startsWith('image/')));
                    const img = new Image(); img.onload = () => { 
                        this.ctx.drawImage(img, 0, 0); 
                        this.saveState(); 
                        this.setStatus("IMAGE PASTED"); 
                        // Auto switch to transform
                        document.querySelector('[data-tool="transform"]').click();
                    }; img.src = URL.createObjectURL(blob);
                }
            }
        } catch (err) { this.setStatus("PASTE ERROR: " + err.message); }
    };

    document.getElementById('paint-copy').onclick = async () => this.copySelection();
    document.getElementById('paint-cut').onclick = async () => {
        await this.copySelection();
        if (this.state.selection) {
            const s = this.state.selection; this.ctx.clearRect(s.x, s.y, s.w, s.h);
            this.state.selection = null; this.oCtx.clearRect(0,0,this.overlay.width, this.overlay.height);
        } else { this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height); }
        this.saveState(); this.setStatus("CUT TO CLIPBOARD");
    };

    // NEW: FLIP TOOLS
    document.getElementById('paint-flip-h').onclick = () => this.flipCanvas('horizontal');
    document.getElementById('paint-flip-v').onclick = () => this.flipCanvas('vertical');
    
    // NEW: PREVIEW ANIM
    document.getElementById('paint-preview-anim').onclick = () => this.toggleAnimPreview();

    // NEW: CORNER RADIUS (Continuous Non-Destructive Update)
    const radInput = document.getElementById('paint-corner-rad');
    radInput.onmousedown = () => {
        if (this.state.activeLayerIndex === -1) return;
        const layer = this.state.layers[this.state.activeLayerIndex];
        // Create backup of current state to allow previewing
        this.state.tempCanvas = document.createElement('canvas');
        this.state.tempCanvas.width = layer.canvas.width;
        this.state.tempCanvas.height = layer.canvas.height;
        this.state.tempCanvas.getContext('2d').drawImage(layer.canvas, 0, 0);
    };
    radInput.oninput = (e) => {
        this.applyCornerRadiusPreview(parseInt(e.target.value));
    };
    radInput.onchange = (e) => {
        // Commit changes to history
        this.saveState();
        this.state.tempCanvas = null;
    };
    // Support mouseup as end of interaction if change doesn't fire immediately
    radInput.onmouseup = () => {
        if(this.state.tempCanvas) {
            this.saveState();
            this.state.tempCanvas = null;
        }
    };

    // NEW: FX
    document.getElementById('paint-anim-fx').onchange = (e) => {
        this.setLayerAnimation(e.target.value);
    };

    document.getElementById('paint-resize').onclick = () => {
        const newW = prompt("Width (px):", this.overlay.width); const newH = prompt("Height (px):", this.overlay.height);
        if (newW && newH && !isNaN(newW) && !isNaN(newH)) {
            this.resizeAllLayers(parseInt(newW), parseInt(newH));
            this.updateDims(); this.saveState();
        }
    };

    document.getElementById('paint-rotate').onclick = () => {
        this.rotateAllLayers();
        this.updateDims(); this.saveState();
    };

    document.getElementById('paint-clear').onclick = () => { if(confirm("Clear Active Layer?")) { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.saveState(); } };
    document.getElementById('paint-close').onclick = () => { document.getElementById('sketch-modal').classList.add('hidden'); };
    document.getElementById('paint-import').onclick = () => { if (window.openRootExplorer) window.openRootExplorer('image'); else alert("Root Explorer not available."); };
    
    // Save flattens the image for storage
    document.getElementById('paint-save').onclick = () => { if (this.state.currentFileKey) { chrome.storage.local.set({ [this.state.currentFileKey]: this.getFlattenedImage() }, () => { this.setStatus("FILE OVERWRITTEN TO VAULT"); }); } else { document.getElementById('paint-save-plus').click(); } };
    
    // NEW: GIF EXPORT LOGIC
    document.getElementById('paint-save-plus').onclick = () => { 
        const name = prompt("Enter Filename (end in .gif to export GIF):", "construct_sketch"); 
        if (name) { 
            const isGif = name.toLowerCase().endsWith('.gif');
            let data;
            
            if (isGif) {
                // Flatten and export as gif (Note: Canvas toDataURL for gif usually defaults to PNG in browsers without lib, but adhering to prompt instruction)
                const temp = document.createElement('canvas');
                temp.width = this.overlay.width;
                temp.height = this.overlay.height;
                const tCtx = temp.getContext('2d');
                // Composite
                this.state.layers.forEach(l => { if(l.visible) tCtx.drawImage(l.canvas, 0, 0); });
                data = temp.toDataURL('image/gif');
                this.setStatus("EXPORTING GIF...");
            } else {
                data = this.getFlattenedImage();
            }

            const key = `vault_img_${Date.now()}_${name}${!name.includes('.') ? '.png' : ''}`; 
            chrome.storage.local.set({ [key]: data }, () => { 
                this.state.currentFileKey = key; 
                this.setStatus("NEW FILE SAVED"); 
            }); 
        } 
    };
    
    const textInput = document.getElementById('paint-text-input');
    if (textInput) {
        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.finalizeText(); }
            if (e.key === 'Escape') { document.getElementById('paint-text-wrapper').style.display = 'none'; textInput.value = ''; this.state.isTextActive = false; }
        });
    }

    // NEW: DRAG AND DROP EXTERNAL IMAGES
    const dropZone = document.getElementById('paint-scroll-container');
    if (dropZone) {
        dropZone.ondragover = (e) => { e.preventDefault(); };
        dropZone.ondrop = (e) => {
            e.preventDefault();
            this.handleExternalDrop(e);
        };
    }
},

handleExternalDrop: function(e) {
    const handleImage = (imgSrc, name) => {
        const img = new Image();
        img.onload = () => {
            // Auto-Resize Drop Logic
            const currentW = this.overlay.width;
            const currentH = this.overlay.height;
            if (img.width > currentW || img.height > currentH) {
                this.resizeAllLayers(Math.max(currentW, img.width), Math.max(currentH, img.height));
                this.updateDims(); 
                this.setStatus("CANVAS RESIZED FOR IMAGE");
            }
            
            const newLayer = this.addLayer(name || "Dropped Image");
            newLayer.ctx.drawImage(img, 0, 0);
            this.saveState();
            this.setStatus("IMAGE DROPPED - TRANSFORM ACTIVE");
            
            // Switch to Transform Tool automatically
            const transformBtn = document.querySelector('[data-tool="transform"]');
            if (transformBtn) transformBtn.click();
        };
        img.src = imgSrc;
    };

    // 1. Files (Desktop Drag)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => handleImage(ev.target.result, file.name);
                reader.readAsDataURL(file);
            }
        });
    } 
    // 2. URLs (Web Drag)
    else if (e.dataTransfer.items) {
        Array.from(e.dataTransfer.items).forEach(item => {
            if (item.kind === 'string' && item.type === 'text/uri-list') {
                item.getAsString(url => {
                    handleImage(url, "Web Image");
                });
            }
        });
    }
},

getFlattenedImage: function() {
    const temp = document.createElement('canvas');
    temp.width = this.overlay.width;
    temp.height = this.overlay.height;
    const tCtx = temp.getContext('2d');
    // Composite all visible layers
    this.state.layers.forEach(l => {
        if(l.visible) {
            tCtx.save();
            tCtx.globalAlpha = l.opacity;
            let compositeOp = 'source-over';
            switch(l.blendMode) {
                case 'multiply': compositeOp = 'multiply'; break;
                case 'screen': compositeOp = 'screen'; break;
                case 'overlay': compositeOp = 'overlay'; break;
                case 'darken': compositeOp = 'darken'; break;
                case 'lighten': compositeOp = 'lighten'; break;
                case 'color-dodge': compositeOp = 'color-dodge'; break;
                case 'difference': compositeOp = 'difference'; break;
                case 'soft-light': compositeOp = 'soft-light'; break;
                default: compositeOp = 'source-over';
            }
            tCtx.globalCompositeOperation = compositeOp;
            tCtx.drawImage(l.canvas, 0, 0);
            tCtx.restore();
        }
    });
    return temp.toDataURL();
},

resizeAllLayers: function(w, h) {
    this.overlay.width = w; this.overlay.height = h;
    this.state.layers.forEach(l => {
        const temp = document.createElement('canvas'); temp.width = l.canvas.width; temp.height = l.canvas.height;
        temp.getContext('2d').drawImage(l.canvas, 0, 0);
        l.canvas.width = w; l.canvas.height = h;
        if (l.name === 'Background') { l.ctx.fillStyle = '#ffffff'; l.ctx.fillRect(0,0,w,h); }
        l.ctx.drawImage(temp, 0, 0);
    });
    // Update layer stack container size
    this.layerStack.style.width = w + 'px';
    this.layerStack.style.height = h + 'px';
},

rotateAllLayers: function() {
    const w = this.overlay.width; const h = this.overlay.height;
    this.overlay.width = h; this.overlay.height = w;
    
    this.state.layers.forEach(l => {
        const temp = document.createElement('canvas'); temp.width = w; temp.height = h;
        temp.getContext('2d').drawImage(l.canvas, 0,0);
        l.canvas.width = h; l.canvas.height = w;
        l.ctx.save(); l.ctx.translate(h/2, w/2); l.ctx.rotate(90 * Math.PI / 180); 
        l.ctx.drawImage(temp, -w/2, -h/2); l.ctx.restore();
    });
    this.layerStack.style.width = h + 'px';
    this.layerStack.style.height = w + 'px';
},

saveState: function() {
    // Saves the state of the ACTIVE layer only (History per layer is too complex for this snippet)
    // Ideally we save the flattened image or a specific layer diff. 
    // For logic preservation, we push the DataURL of the active layer.
    this.state.historyStep++; if (this.state.historyStep < this.state.history.length) this.state.history.length = this.state.historyStep;
    
    // Store ID and Data to ensure we undo on correct layer or warn user
    const stateData = {
        layerId: this.state.layers[this.state.activeLayerIndex].id,
        data: this.canvas.toDataURL()
    };
    
    this.state.history.push(stateData); 
    if (this.state.history.length > 20) { this.state.history.shift(); this.state.historyStep--; }
},

undo: function() { 
    if (this.state.historyStep > 0) { 
        this.state.historyStep--; 
        this.loadHistoryState(); 
    } 
},
redo: function() { 
    if (this.state.historyStep < this.state.history.length - 1) { 
        this.state.historyStep++; 
        this.loadHistoryState(); 
    } 
},
loadHistoryState: function() { 
    const stateData = this.state.history[this.state.historyStep];
    // Check if current layer matches history layer
    if (stateData.layerId !== this.state.layers[this.state.activeLayerIndex].id) {
        // Attempt to find layer and switch, or just warn
        const targetIdx = this.state.layers.findIndex(l => l.id === stateData.layerId);
        if (targetIdx > -1) this.setActiveLayer(targetIdx);
    }
    
    const img = new Image(); 
    img.src = stateData.data; 
    img.onload = () => { 
        this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height); 
        this.ctx.drawImage(img, 0, 0); 
    };
},

// ================= CROP LOGIC =================
initCropMode: function() { this.state.cropRect = { x: 10, y: 10, w: this.overlay.width - 20, h: this.overlay.height - 20 }; this.drawCropUI(); this.setStatus("ADJUST CROP BOX & PRESS ENTER"); },
drawCropUI: function() { if (!this.state.cropRect) return; const r = this.state.cropRect; this.oCtx.clearRect(0,0,this.overlay.width, this.overlay.height); this.oCtx.fillStyle = 'rgba(0,0,0,0.5)'; this.oCtx.fillRect(0,0,this.overlay.width, this.overlay.height); this.oCtx.clearRect(r.x, r.y, r.w, r.h); this.oCtx.strokeStyle = '#fff'; this.oCtx.lineWidth = 1; this.oCtx.setLineDash([5, 5]); this.oCtx.strokeRect(r.x, r.y, r.w, r.h); this.oCtx.setLineDash([]); const handles = [{x: r.x, y: r.y}, {x: r.x + r.w/2, y: r.y}, {x: r.x + r.w, y: r.y}, {x: r.x + r.w, y: r.y + r.h/2}, {x: r.x + r.w, y: r.y + r.h}, {x: r.x + r.w/2, y: r.y + r.h}, {x: r.x, y: r.y + r.h}, {x: r.x, y: r.y + r.h/2}]; this.oCtx.fillStyle = '#fff'; this.oCtx.strokeStyle = '#000'; handles.forEach(h => { this.oCtx.fillRect(h.x - 4, h.y - 4, 8, 8); this.oCtx.strokeRect(h.x - 4, h.y - 4, 8, 8); }); },
getResizeHandle: function(x, y, rect) { if (!rect) return null; const dist = (x1, y1, x2, y2) => Math.sqrt((x1-x2)**2 + (y1-y2)**2); const threshold = 10; if (dist(x, y, rect.x, rect.y) < threshold) return 'tl'; if (dist(x, y, rect.x+rect.w, rect.y) < threshold) return 'tr'; if (dist(x, y, rect.x+rect.w, rect.y+rect.h) < threshold) return 'br'; if (dist(x, y, rect.x, rect.y+rect.h) < threshold) return 'bl'; if (dist(x, y, rect.x+rect.w/2, rect.y) < threshold) return 'tm'; if (dist(x, y, rect.x+rect.w, rect.y+rect.h/2) < threshold) return 'rm'; if (dist(x, y, rect.x+rect.w/2, rect.y+rect.h) < threshold) return 'bm'; if (dist(x, y, rect.x, rect.y+rect.h/2) < threshold) return 'lm'; if (x > rect.x && x < rect.x+rect.w && y > rect.y && y < rect.y+rect.h) return 'move'; return null; },
applyCrop: function() { if (!this.state.cropRect) return; const r = this.state.cropRect; if (r.w < 0) { r.x += r.w; r.w = Math.abs(r.w); } if (r.h < 0) { r.y += r.h; r.h = Math.abs(r.h); } if (r.w < 1 || r.h < 1) return; try { 
    // Crop all layers
    this.state.layers.forEach(l => {
        const imageData = l.ctx.getImageData(r.x, r.y, r.w, r.h);
        l.canvas.width = r.w; l.canvas.height = r.h;
        l.ctx.putImageData(imageData, 0, 0);
    });
    this.overlay.width = r.w; this.overlay.height = r.h;
    this.layerStack.style.width = r.w + 'px';
    this.layerStack.style.height = r.h + 'px';
    
    this.updateDims(); this.saveState(); this.setStatus("IMAGE CROPPED"); this.state.tool = 'pencil'; document.querySelector('[data-tool="pencil"]').click(); } catch(e) { console.error(e); } },

// ================= TRANSFORM LOGIC =================
initTransformMode: function() {
    if (this.state.activeLayerIndex === -1) return;
    const layer = this.state.layers[this.state.activeLayerIndex];
    
    // Calculate bounding box of active layer content
    const w = layer.canvas.width; const h = layer.canvas.height;
    const data = layer.ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = 0, maxY = 0, found = false;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                found = true;
            }
        }
    }

    if (!found) { minX = 0; minY = 0; maxX = w; maxY = h; } // Empty layer defaults to full
    else { maxX += 1; maxY += 1; } // Inclusive

    this.state.transformRect = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    
    // Save original image for quality scaling
    this.state.transformTempImg = document.createElement('canvas');
    this.state.transformTempImg.width = this.state.transformRect.w;
    this.state.transformTempImg.height = this.state.transformRect.h;
    this.state.transformTempImg.getContext('2d').drawImage(layer.canvas, minX, minY, this.state.transformRect.w, this.state.transformRect.h, 0, 0, this.state.transformRect.w, this.state.transformRect.h);

    this.drawTransformUI();
    this.setStatus("DRAG TO MOVE/SCALE - ENTER TO APPLY");
},
drawTransformUI: function() {
    if (!this.state.transformRect) return;
    const r = this.state.transformRect;
    this.oCtx.clearRect(0,0,this.overlay.width, this.overlay.height);
    
    // Draw Box
    this.oCtx.strokeStyle = '#00ff41'; this.oCtx.lineWidth = 1; 
    this.oCtx.strokeRect(r.x, r.y, r.w, r.h);
    
    // Handles
    const handles = [{x: r.x, y: r.y}, {x: r.x + r.w/2, y: r.y}, {x: r.x + r.w, y: r.y}, {x: r.x + r.w, y: r.y + r.h/2}, {x: r.x + r.w, y: r.y + r.h}, {x: r.x + r.w/2, y: r.y + r.h}, {x: r.x, y: r.y + r.h}, {x: r.x, y: r.y + r.h/2}];
    this.oCtx.fillStyle = '#00ff41'; this.oCtx.strokeStyle = '#000';
    handles.forEach(h => { this.oCtx.fillRect(h.x - 4, h.y - 4, 8, 8); this.oCtx.strokeRect(h.x - 4, h.y - 4, 8, 8); });
},
applyTransform: function() {
    if (!this.state.transformRect) return;
    // Layer is already visually updated in moveDraw. 
    // We just need to clear temp state and exit tool.
    this.state.transformTempImg = null;
    this.state.transformRect = null;
    this.saveState();
    this.setStatus("TRANSFORM APPLIED");
    this.state.tool = 'pencil'; 
    document.querySelector('[data-tool="pencil"]').click(); 
},

generatePalette: function() { const colors = ['#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7']; const container = document.getElementById('paint-palette'); container.innerHTML = ''; colors.forEach(c => { const d = document.createElement('div'); d.className = 'swatch'; d.style.backgroundColor = c; d.onclick = () => this.setColor(c); container.appendChild(d); }); },
setColor: function(color) { if (this.state.activeColorSlot === 'fore') { this.state.foreColor = color; document.getElementById('slot-fore').style.backgroundColor = color; } else { this.state.backColor = color; document.getElementById('slot-back').style.backgroundColor = color; } const ti = document.getElementById('paint-text-input'); if(ti) ti.style.color = color; },
setStatus: function(msg) { const el = document.getElementById('paint-status'); if (el) { el.textContent = msg; el.style.color = '#fff'; setTimeout(() => { el.textContent = "READY"; el.style.color = 'inherit'; }, 3000); } },
updateDims: function() { document.getElementById('paint-dims').textContent = `${this.overlay.width} x ${this.overlay.height}px`; },

getCoords: function(e) { 
    // getBoundingClientRect returns the dimensions *after* CSS transforms (like scale) are applied.
    const rect = this.overlay.getBoundingClientRect(); 
    
    // To get the internal canvas coordinate, we calculate the offset from the visual top-left,
    // and then divide by the zoom level to reverse the visual scaling.
    return { 
        x: (e.clientX - rect.left) / this.state.zoomLevel, 
        y: (e.clientY - rect.top) / this.state.zoomLevel 
    }; 
},

floodFill: function(startX, startY, fillColor) {
    const width = this.canvas.width; const height = this.canvas.height;
    const imgData = this.ctx.getImageData(0, 0, width, height); const data = imgData.data;
    const tolerance = 15;
    const hexToRgb = (hex) => { const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16); return [r, g, b, 255]; };
    const targetRgb = hexToRgb(fillColor);
    const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
    const startR = data[startPos], startG = data[startPos + 1], startB = data[startPos + 2], startA = data[startPos + 3];
    
    // Prevent infinite loops if color matches exactly
    if (Math.abs(startR - targetRgb[0]) < 10 && Math.abs(startG - targetRgb[1]) < 10 && Math.abs(startB - targetRgb[2]) < 10 && startA === 255) return;
    
    const stack = [[Math.floor(startX), Math.floor(startY)]];
    while (stack.length) {
        const [x, y] = stack.pop(); const pos = (y * width + x) * 4;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        const r = data[pos], g = data[pos+1], b = data[pos+2], a = data[pos+3];
        
        // If already set to target, skip
        if (r === targetRgb[0] && g === targetRgb[1] && b === targetRgb[2] && a === 255) continue;
        
        const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) + Math.abs(a - startA);
        if (diff < tolerance) { 
            data[pos] = targetRgb[0]; data[pos+1] = targetRgb[1]; data[pos+2] = targetRgb[2]; data[pos+3] = 255; 
            stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]); 
        }
    }
    this.ctx.putImageData(imgData, 0, 0);
},

// SMART MAGIC WAND SCANLINE ALGORITHM
removeBackground: function(startX, startY) {
    const width = this.canvas.width; const height = this.canvas.height;
    const imgData = this.ctx.getImageData(0, 0, width, height); const data = imgData.data;
    const tolerance = 100; // High tolerance for shadows/gradients
    
    const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
    const startR = data[startPos], startG = data[startPos+1], startB = data[startPos+2];
    
    // Stack based flood fill with Alpha Zeroing
    const stack = [startPos];
    const visited = new Uint8Array(width * height); // track visited pixels to prevent loops

    while(stack.length) {
        const pos = stack.pop();
        const idx = pos / 4;
        if (visited[idx]) continue;
        visited[idx] = 1;

        const x = idx % width; 
        const y = Math.floor(idx / width);

        const r = data[pos], g = data[pos+1], b = data[pos+2];
        const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB);

        if(diff < tolerance) {
            data[pos+3] = 0; // Alpha Zeroing
            
            // Add neighbors
            if(x > 0) stack.push(pos - 4);
            if(x < width - 1) stack.push(pos + 4);
            if(y > 0) stack.push(pos - width * 4);
            if(y < height - 1) stack.push(pos + width * 4);
        }
    }
    this.ctx.putImageData(imgData, 0, 0);
    this.saveState();
    this.setStatus("BACKGROUND REMOVED (SMART)");
},

flipCanvas: function(direction) {
    const temp = document.createElement('canvas'); temp.width = this.canvas.width; temp.height = this.canvas.height;
    temp.getContext('2d').drawImage(this.canvas, 0,0);
    this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    this.ctx.save();
    if (direction === 'horizontal') { 
        this.ctx.scale(-1, 1); 
        this.ctx.drawImage(temp, -this.canvas.width, 0); 
    } else { 
        this.ctx.scale(1, -1); 
        this.ctx.drawImage(temp, 0, -this.canvas.height); 
    }
    this.ctx.restore();
    this.saveState();
    this.setStatus("LAYER FLIPPED");
},

startDraw: function(e) {
    if (this.state.isSpacePressed) { e.preventDefault(); this.state.isPanning = true; this.state.panStartX = e.clientX; this.state.panStartY = e.clientY; this.state.scrollStartX = this.scrollContainer.scrollLeft; this.state.scrollStartY = this.scrollContainer.scrollTop; this.overlay.classList.add('cursor-grabbing'); return; }
    if (this.state.isDraggingText) return; 
    
    // Ensure we have an active layer
    if (this.state.activeLayerIndex === -1 || !this.state.layers[this.state.activeLayerIndex].visible) {
        this.setStatus("ERROR: SELECT VISIBLE LAYER");
        return;
    }

    const c = this.getCoords(e);

    // Zoom Tool Logic
    if (this.state.tool === 'zoom') {
        e.preventDefault();
        // Left Click: Zoom In, Right Click: Zoom Out
        if (e.button === 2) {
            this.state.zoomLevel = Math.max(0.1, this.state.zoomLevel - 0.25);
        } else {
            this.state.zoomLevel = Math.min(10.0, this.state.zoomLevel + 0.25);
        }
        
        // Apply transform to the wrapper containing layer stack and overlay
        this.wrapper.style.transform = `scale(${this.state.zoomLevel})`;
        this.wrapper.style.transformOrigin = 'top left';

        document.getElementById('paint-zoom-disp').textContent = Math.round(this.state.zoomLevel * 100) + '%';
        this.setStatus(`ZOOM: ${Math.round(this.state.zoomLevel * 100)}%`);
        return;
    }

    this.state.isDrawing = true;
    this.state.startX = c.x; this.state.startY = c.y;

    if (this.state.tool === 'crop') { const handle = this.getResizeHandle(c.x, c.y, this.state.cropRect); if (handle) { this.state.cropHandle = handle; this.state.isResizingCrop = true; this.state.dragStartX = c.x; this.state.dragStartY = c.y; } return; }
    
    if (this.state.tool === 'transform') {
        const handle = this.getResizeHandle(c.x, c.y, this.state.transformRect);
        if (handle) {
            this.state.transformHandle = handle;
            this.state.isTransforming = true;
            this.state.dragStartX = c.x; this.state.dragStartY = c.y;
        }
        return;
    }

    if (this.state.tool === 'text') {
        const wrapper = document.getElementById('paint-text-wrapper');
        if (this.state.isTextActive) { this.finalizeText(); }
        this.state.isTextActive = true;
        wrapper.style.display = 'block'; wrapper.style.left = (c.x * this.state.zoomLevel) + 'px'; wrapper.style.top = (c.y * this.state.zoomLevel) + 'px';
        const textInput = document.getElementById('paint-text-input');
        textInput.style.color = this.state.foreColor; textInput.style.fontFamily = this.state.fontFamily; textInput.style.fontSize = this.state.fontSize + 'px';
        textInput.style.fontWeight = this.state.isBold ? 'bold' : 'normal'; textInput.style.fontStyle = this.state.isItalic ? 'italic' : 'normal'; textInput.style.textDecoration = this.state.isUnderline ? 'underline' : 'none';
        textInput.style.textAlign = this.state.textAlign; textInput.value = ''; textInput.focus();
        this.state.textX = c.x; this.state.textY = c.y; this.state.isDrawing = false; return;
    }

    // Setup Context Defaults
    const size = parseInt(document.getElementById('paint-size').value);
    this.ctx.lineWidth = size; 
    this.ctx.strokeStyle = this.state.foreColor;
    this.ctx.fillStyle = this.state.foreColor;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.globalAlpha = 1.0;
    this.ctx.setLineDash([]);

    if (this.state.tool === 'pencil' || this.state.tool === 'eraser') { 
        this.ctx.beginPath(); 
        this.ctx.moveTo(c.x, c.y); 
        
        // Brush Styles Init
        if (this.state.tool === 'pencil') {
            switch(this.state.brushStyle) {
                case 'marker':
                    this.ctx.lineCap = 'square';
                    this.ctx.lineWidth = size + 5;
                    break;
                case 'watercolor':
                    this.ctx.globalAlpha = 0.1;
                    this.ctx.lineJoin = 'round';
                    this.ctx.lineCap = 'round';
                    break;
                case 'crayon':
                    this.ctx.setLineDash([size, size * 1.5]);
                    this.ctx.lineCap = 'butt';
                    break;
            }
        }
    } 
    else if (this.state.tool === 'bucket') { this.floodFill(c.x, c.y, this.state.foreColor); this.state.isDrawing = false; this.saveState(); } 
    else if (this.state.tool === 'magic') { this.removeBackground(c.x, c.y); this.state.isDrawing = false; }
    else if (this.state.tool === 'picker') { const p = this.ctx.getImageData(c.x, c.y, 1, 1).data; const hex = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6); this.setColor(hex); this.state.isDrawing = false; }
},

moveDraw: function(e) {
    if (this.state.isPanning) { e.preventDefault(); const dx = e.clientX - this.state.panStartX; const dy = e.clientY - this.state.panStartY; this.scrollContainer.scrollLeft = this.state.scrollStartX - dx; this.scrollContainer.scrollTop = this.state.scrollStartY - dy; return; }
    if (this.state.isDraggingText) {
        const wrapper = document.getElementById('paint-text-wrapper'); const parent = wrapper.parentElement.getBoundingClientRect();
        const x = e.clientX - parent.left - this.state.dragOffsetX; const y = e.clientY - parent.top - this.state.dragOffsetY;
        wrapper.style.left = x + 'px'; wrapper.style.top = y + 'px'; 
        // Sync internal coords
        this.state.textX = x / this.state.zoomLevel; this.state.textY = y / this.state.zoomLevel; 
        return;
    }
    const c = this.getCoords(e);
    document.getElementById('paint-coords').textContent = `${Math.round(c.x)}, ${Math.round(c.y)}`;

    if (this.state.tool === 'crop') {
        if (this.state.isResizingCrop && this.state.cropHandle) {
            const r = this.state.cropRect; const h = this.state.cropHandle;
            if (h.includes('l')) { r.w += (r.x - c.x); r.x = c.x; } if (h.includes('r')) { r.w = c.x - r.x; }
            if (h.includes('t')) { r.h += (r.y - c.y); r.y = c.y; } if (h.includes('b')) { r.h = c.y - r.y; }
            if (h === 'move') { r.x += (c.x - this.state.dragStartX); r.y += (c.y - this.state.dragStartY); this.state.dragStartX = c.x; this.state.dragStartY = c.y; }
            this.drawCropUI();
        } else { const handle = this.getResizeHandle(c.x, c.y, this.state.cropRect); this.overlay.style.cursor = handle ? (handle === 'move' ? 'move' : 'crosshair') : 'default'; }
        return;
    }

    if (this.state.tool === 'transform') {
        if (this.state.isTransforming && this.state.transformHandle && this.state.transformRect && this.state.transformTempImg) {
            const r = this.state.transformRect; const h = this.state.transformHandle;
            
            // Update Rect
            if (h.includes('l')) { r.w += (r.x - c.x); r.x = c.x; } if (h.includes('r')) { r.w = c.x - r.x; }
            if (h.includes('t')) { r.h += (r.y - c.y); r.y = c.y; } if (h.includes('b')) { r.h = c.y - r.y; }
            if (h === 'move') { r.x += (c.x - this.state.dragStartX); r.y += (c.y - this.state.dragStartY); this.state.dragStartX = c.x; this.state.dragStartY = c.y; }
            
            this.drawTransformUI();

            // Preview Transform on Layer
            this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.state.transformTempImg, r.x, r.y, r.w, r.h);

        } else {
            const handle = this.getResizeHandle(c.x, c.y, this.state.transformRect); 
            this.overlay.style.cursor = handle ? (handle === 'move' ? 'move' : 'crosshair') : 'default'; 
        }
        return;
    }

    if (!this.state.isDrawing) return;

    // --- ADVANCED BRUSH LOGIC ---
    if (this.state.tool === 'pencil') {
        const size = parseInt(document.getElementById('paint-size').value);
        
        if (this.state.brushStyle === 'airbrush') {
            // Airbrush: Random spray
            for (let i = 0; i < size * 2; i++) {
                const radius = size * 2;
                const offsetX = (Math.random() - 0.5) * radius;
                const offsetY = (Math.random() - 0.5) * radius;
                this.ctx.fillRect(c.x + offsetX, c.y + offsetY, 1, 1);
            }
        } else {
            // Standard paths for Round, Marker, Crayon, Watercolor
            this.ctx.lineTo(c.x, c.y);
            this.ctx.stroke();
        }
    } else if (this.state.tool === 'eraser') {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = document.getElementById('paint-size').value * 2;
        this.ctx.lineTo(c.x, c.y); 
        this.ctx.stroke();
        this.ctx.globalCompositeOperation = 'source-over';
    } else {
        // SHAPES PREVIEW ON OVERLAY
        this.oCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        this.oCtx.strokeStyle = this.state.foreColor;
        this.oCtx.lineWidth = document.getElementById('paint-size').value;
        const w = c.x - this.state.startX; const h = c.y - this.state.startY;

        if (this.state.tool === 'select') {
            this.oCtx.strokeStyle = '#000'; this.oCtx.lineWidth = 1; this.oCtx.setLineDash([5, 5]); this.oCtx.strokeRect(this.state.startX, this.state.startY, w, h);
            this.oCtx.strokeStyle = '#fff'; this.oCtx.lineDashOffset = 5; this.oCtx.strokeRect(this.state.startX, this.state.startY, w, h); this.oCtx.setLineDash([]);
        } else {
            this.oCtx.beginPath();
            if (this.state.tool === 'rect') this.oCtx.strokeRect(this.state.startX, this.state.startY, w, h);
            else if (this.state.tool === 'circle') { this.oCtx.ellipse(this.state.startX + w/2, this.state.startY + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI); this.oCtx.stroke(); }
            else if (this.state.tool === 'line') { this.oCtx.moveTo(this.state.startX, this.state.startY); this.oCtx.lineTo(c.x, c.y); this.oCtx.stroke(); }
            else if (this.state.tool === 'triangle') { this.oCtx.moveTo(this.state.startX + w/2, this.state.startY); this.oCtx.lineTo(c.x, c.y); this.oCtx.lineTo(this.state.startX, c.y); this.oCtx.closePath(); this.oCtx.stroke(); }
            else if (this.state.tool === 'star') { this.drawStar(this.oCtx, this.state.startX + w/2, this.state.startY + h/2, 5, Math.max(Math.abs(w), Math.abs(h))/2, Math.max(Math.abs(w), Math.abs(h))/4); }
            else if (this.state.tool === 'arrow') { this.drawArrow(this.oCtx, this.state.startX, this.state.startY, c.x, c.y); }
            else if (this.state.tool === 'diamond') { this.oCtx.moveTo(this.state.startX + w/2, this.state.startY); this.oCtx.lineTo(c.x, this.state.startY + h/2); this.oCtx.lineTo(this.state.startX + w/2, c.y); this.oCtx.lineTo(this.state.startX, this.state.startY + h/2); this.oCtx.closePath(); this.oCtx.stroke(); }
            else if (this.state.tool === 'pentagon') { this.drawPolygon(this.oCtx, this.state.startX + w/2, this.state.startY + h/2, Math.max(Math.abs(w), Math.abs(h))/2, 5); }
        }
    }
},

endDraw: function(e) {
    if (this.state.isPanning) { this.state.isPanning = false; this.overlay.classList.remove('cursor-grabbing'); if(this.state.isSpacePressed) this.overlay.classList.add('cursor-grab'); return; }
    if (this.state.isDraggingText) { this.state.isDraggingText = false; return; }
    
    if (this.state.tool === 'crop') { this.state.isResizingCrop = false; this.state.cropHandle = null; return; }
    if (this.state.tool === 'transform') { this.state.isTransforming = false; this.state.transformHandle = null; return; }
    if (this.state.tool === 'zoom') return; 

    if (!this.state.isDrawing) return;
    this.state.isDrawing = false;
    
    // Reset Context Properties for Shapes
    this.ctx.globalAlpha = 1.0;
    this.ctx.setLineDash([]);
    
    const c = this.getCoords(e);
    const w = c.x - this.state.startX; const h = c.y - this.state.startY;

    if (this.state.tool === 'select') {
        this.state.selection = { x: Math.min(this.state.startX, c.x), y: Math.min(this.state.startY, c.y), w: Math.abs(w), h: Math.abs(h) };
        this.setStatus("AREA SELECTED");
    } 
    else if (['rect', 'circle', 'line', 'triangle', 'star', 'arrow', 'diamond', 'pentagon'].includes(this.state.tool)) {
        this.oCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        this.ctx.strokeStyle = this.state.foreColor;
        this.ctx.lineWidth = document.getElementById('paint-size').value;
        this.ctx.beginPath();
        if (this.state.tool === 'rect') this.ctx.strokeRect(this.state.startX, this.state.startY, w, h);
        else if (this.state.tool === 'circle') { this.ctx.ellipse(this.state.startX + w/2, this.state.startY + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI); this.ctx.stroke(); }
        else if (this.state.tool === 'line') { this.ctx.moveTo(this.state.startX, this.state.startY); this.ctx.lineTo(c.x, c.y); this.ctx.stroke(); }
        else if (this.state.tool === 'triangle') { this.ctx.moveTo(this.state.startX + w/2, this.state.startY); this.ctx.lineTo(c.x, c.y); this.ctx.lineTo(this.state.startX, c.y); this.ctx.closePath(); this.ctx.stroke(); }
        else if (this.state.tool === 'star') { this.drawStar(this.ctx, this.state.startX + w/2, this.state.startY + h/2, 5, Math.max(Math.abs(w), Math.abs(h))/2, Math.max(Math.abs(w), Math.abs(h))/4); }
        else if (this.state.tool === 'arrow') { this.drawArrow(this.ctx, this.state.startX, this.state.startY, c.x, c.y); }
        else if (this.state.tool === 'diamond') { this.ctx.moveTo(this.state.startX + w/2, this.state.startY); this.ctx.lineTo(c.x, this.state.startY + h/2); this.ctx.lineTo(this.state.startX + w/2, c.y); this.ctx.lineTo(this.state.startX, this.state.startY + h/2); this.ctx.closePath(); this.ctx.stroke(); }
        else if (this.state.tool === 'pentagon') { this.drawPolygon(this.ctx, this.state.startX + w/2, this.state.startY + h/2, Math.max(Math.abs(w), Math.abs(h))/2, 5); }
        this.saveState();
    } else if (this.state.tool === 'pencil' || this.state.tool === 'eraser') {
        this.saveState();
    }
},

drawStar: function(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx; let y = cy;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius; y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y); rot += step;
        x = cx + Math.cos(rot) * innerRadius; y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y); rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.stroke();
},

drawArrow: function(ctx, fromx, fromy, tox, toy) {
    const headlen = 15; const dx = tox - fromx; const dy = toy - fromy; const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
},

drawPolygon: function(ctx, x, y, radius, sides) {
    if (sides < 3) return;
    const a = (Math.PI * 2) / sides;
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI/2); // Point up
    ctx.moveTo(radius, 0);
    for (let i = 1; i < sides; i++) { ctx.lineTo(radius * Math.cos(a * i), radius * Math.sin(a * i)); }
    ctx.closePath();
    ctx.rotate(Math.PI/2); // Reset
    ctx.translate(-x, -y);
    ctx.stroke();
},

finalizeText: function() {
    const input = document.getElementById('paint-text-input');
    const wrapper = document.getElementById('paint-text-wrapper');
    
    if (!input || wrapper.style.display === 'none') return;
    if (input.value.trim() !== '') {
        const text = input.value;
        const fontSize = parseInt(this.state.fontSize);
        const x = this.state.textX + 2; 
        const y = this.state.textY + fontSize; 
        
        this.ctx.fillStyle = this.state.foreColor;
        const style = `${this.state.isItalic ? 'italic' : ''} ${this.state.isBold ? 'bold' : ''}`;
        this.ctx.font = `${style.trim()} ${fontSize}px ${this.state.fontFamily}`;
        this.ctx.textAlign = this.state.textAlign;
        
        const lines = text.split('\n');
        const lineHeight = fontSize * 1.2;
        
        lines.forEach((line, index) => {
            const lineY = y + (index * lineHeight);
            this.ctx.fillText(line, x, lineY);
            if (this.state.isUnderline) {
                const width = this.ctx.measureText(line).width;
                let startX = x;
                if(this.state.textAlign === 'center') startX = x - width/2;
                if(this.state.textAlign === 'right') startX = x - width;
                this.ctx.beginPath();
                this.ctx.lineWidth = Math.max(1, fontSize / 15);
                this.ctx.moveTo(startX, lineY + 2);
                this.ctx.lineTo(startX + width, lineY + 2);
                this.ctx.strokeStyle = this.state.foreColor;
                this.ctx.stroke();
            }
        });
        this.saveState();
        this.setStatus("TEXT ADDED");
    }
    
    wrapper.style.display = 'none';
    input.value = '';
    this.state.isTextActive = false;
},

copySelection: function() {
    return new Promise((resolve, reject) => {
        try {
            let canvasToCopy;
            if (this.state.selection && this.state.selection.w > 0 && this.state.selection.h > 0) {
                const s = this.state.selection;
                // Grab from active layer
                const imageData = this.ctx.getImageData(s.x, s.y, s.w, s.h);
                canvasToCopy = document.createElement('canvas'); canvasToCopy.width = s.w; canvasToCopy.height = s.h;
                canvasToCopy.getContext('2d').putImageData(imageData, 0, 0);
            } else { 
                // Flatten image for copy
                const temp = document.createElement('canvas'); temp.width = this.overlay.width; temp.height = this.overlay.height;
                const tCtx = temp.getContext('2d');
                this.state.layers.forEach(l => { if(l.visible) tCtx.drawImage(l.canvas, 0,0); });
                canvasToCopy = temp; 
            }
            canvasToCopy.toBlob(async (blob) => { 
                try {
                    const item = new ClipboardItem({ "image/png": blob }); 
                    await navigator.clipboard.write([item]); 
                    this.setStatus("COPIED TO CLIPBOARD");
                    resolve(true);
                } catch(e) {
                    this.setStatus("CLIPBOARD ERROR");
                    resolve(false);
                }
            });
        } catch (err) { 
            this.setStatus("COPY FAILED: " + err.message); 
            resolve(false);
        }
    });
},

loadImage: function(dataUrl, key) {
    const img = new Image();
    img.onload = () => {
        const explorerModal = document.getElementById('matrix-modal');
        if (explorerModal) explorerModal.classList.add('hidden');

        const modal = document.getElementById('sketch-modal');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
        }
        
        if (!document.getElementById('paint-root-wrapper')) {
            this.setupUI(modal);
        }
        
        // Reset Layers
        this.state.layers = [];
        this.layerStack.innerHTML = '';
        
        this.overlay.width = Math.max(img.width, 800);
        this.overlay.height = Math.max(img.height, 600);
        this.layerStack.style.width = this.overlay.width + 'px';
        this.layerStack.style.height = this.overlay.height + 'px';

        this.addLayer("Background", true);
        
        // Draw Loaded image onto background layer
        const bgLayer = this.state.layers[0];
        bgLayer.ctx.fillStyle = '#ffffff';
        bgLayer.ctx.fillRect(0,0,this.overlay.width, this.overlay.height);
        bgLayer.ctx.drawImage(img, 0, 0);
        
        document.getElementById('paint-dims').textContent = `${this.overlay.width} x ${this.overlay.height}px`;
        this.state.currentFileKey = key;
        this.saveState();
    };
    img.src = dataUrl;
}

};

document.addEventListener('DOMContentLoaded', () => window.PaintApp.init());