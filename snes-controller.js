// Emulators/snes/snes-controller.js

window.openSnesEmulator = async function() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    
    if (!modal || !output) return;
    modal.classList.remove('hidden');

    // Initialize Terminal Rain Background (Preserved logic)
    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }

    let messageListener = null;
    let currentSlot = "1";

    // 1. Setup Interface
    output.innerHTML = `
        <style>
            #snes-display-wrapper:fullscreen {
                width: 100vw !important;
                height: 100vh !important;
                max-width: none !important;
                max-height: none !important;
                border: none !important;
                background: black !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            #snes-display-wrapper:fullscreen iframe {
                width: 100% !important;
                height: 100% !important;
                border: none !important;
            }
        </style>
        <div class="nes-terminal-wrapper">
            <p style="color:#0f0; font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;">[ SNES_MAINFRAME ]</p>
            
            <div style="display:flex; justify-content:center; margin-bottom:10px;">
                <select id="snes-rom-select" class="nes-model-selector" style="flex-grow:1; max-width:400px; margin-right: 10px;">
                    <option value="" disabled selected>> INSERT CARTRIDGE...</option>
                </select>
                <select id="snes-slot-select" class="nes-model-selector" style="width: auto; min-width: 100px;">
                    <option value="1" selected>SLOT 1</option>
                    <option value="2">SLOT 2</option>
                    <option value="3">SLOT 3</option>
                </select>
            </div>

            <div id="snes-display-wrapper" class="nes-screen-container" style="
                position: relative; 
                border: 1px solid #0f0; 
                height: 480px;
                background: black url('${chrome.runtime.getURL("Emulators/snes/cover.jpg")}') no-repeat center center; 
                background-size: cover;
            ">
                <button id="snes-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #0f0; color:#0f0; cursor:pointer;">&#9974;</button>
                <button id="snes-mute-btn" data-muted="false" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; bottom:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #0f0; color:#0f0; cursor:pointer;">&#128266;</button>
            </div>
            
            <div id="snes-debug-log" style="color:red; font-family:'Courier New'; font-size:12px; margin-top:5px; height:20px;"></div>

            <div style="display: block; width: 100%; box-sizing: border-box; margin: 5px auto 0 auto; font-size:0.65rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.5;"><span style="color:#fff;">CONTROLS:</span> WASD = MOVE | START = <span style="color:#fff;">ENTER</span> | SELECT = <span style="color:#fff;">R-SHIFT</span><br>A=<span style="color:#fff;">Z</span> B=<span style="color:#fff;">X</span> X=<span style="color:#fff;">C</span> Y=<span style="color:#fff;">V</span> | L=<span style="color:#fff;">L-SHIFT</span> R=<span style="color:#fff;">PG-DN</span><br>1 = SAVE STATE | 4 = LOAD STATE | <span style="color:#aaa;">[P] FAST FWD</span></div>
        </div>`;

    const dropdown = document.getElementById('snes-rom-select');
    const slotSelect = document.getElementById('snes-slot-select');
    const displayWrapper = document.getElementById('snes-display-wrapper');
    const fullBtn = document.getElementById('snes-fullscreen-btn');
    const muteBtn = document.getElementById('snes-mute-btn');
    const debugLog = document.getElementById('snes-debug-log');
    
    // Prevent Bubbling
    ['mousedown', 'click', 'mouseup', 'focus'].forEach(event => {
        dropdown.addEventListener(event, (e) => e.stopPropagation());
        slotSelect.addEventListener(event, (e) => e.stopPropagation());
        if(fullBtn) fullBtn.addEventListener(event, (e) => e.stopPropagation());
        if(muteBtn) muteBtn.addEventListener(event, (e) => e.stopPropagation());
    });

    // --- State Management Helpers ---
    const bufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const base64ToBlob = (base64) => {
        try {
            const binary = window.atob(base64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return new Blob([bytes]);
        } catch (e) {
            console.error("Save file corrupted", e);
            return null;
        }
    };

    // --- SLOT CHANGE HANDLER ---
    slotSelect.addEventListener('change', (e) => {
        currentSlot = e.target.value;
        debugLog.innerHTML = `<span style="color:#0f0;">SLOT CHANGED TO ${currentSlot}</span>`;
        
        const romName = dropdown.value;
        if (!romName) return; 

        // Fetch data for the new slot
        const savedStateBase64 = localStorage.getItem(`snes_state_${currentSlot}_${romName}`);
        let blobData = null;
        
        if (savedStateBase64) {
            blobData = base64ToBlob(savedStateBase64);
        }

        // Send to emulator
        const iframe = displayWrapper.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                command: 'import_slot',
                slot: currentSlot,
                blob: blobData // Null clears the slot in emulator memory
            }, '*');
            
            // --- FOCUS FIX: Force focus back to emulator ---
            setTimeout(() => {
                iframe.contentWindow.focus();
            }, 50);
        }
    });

    fullBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            displayWrapper.requestFullscreen().catch(err => console.log(err));
        } else {
            document.exitFullscreen();
        }
        fullBtn.blur();
    });

    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const iframe = displayWrapper.querySelector('iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({ command: 'mute' }, '*');
            const isCurrentlyMuted = muteBtn.getAttribute('data-muted') === 'true';
            if (isCurrentlyMuted) {
                muteBtn.setAttribute('data-muted', 'false');
                muteBtn.innerHTML = '&#128266;'; 
                muteBtn.style.color = '#0f0';
            } else {
                muteBtn.setAttribute('data-muted', 'true');
                muteBtn.innerHTML = '&#128263;'; 
                muteBtn.style.color = 'red';
            }
        }
        muteBtn.blur();
    });

    const ROMS = [
        "Super Mario World.sfc",
    ];

    ROMS.forEach(rom => {
        const opt = document.createElement('option');
        opt.value = rom;
        opt.textContent = rom.replace(/\.(sfc|smc)$/i, '').replace(/_/g, ' ').toUpperCase();
        dropdown.appendChild(opt);
    });

    async function findRomUrl(baseName) {
        const root = 'Emulators/snes/roms/';
        const variations = [baseName, baseName.toLowerCase(), baseName.toUpperCase(), baseName.replace(/\.[^/.]+$/, "") + ".sfc", baseName.replace(/\.[^/.]+$/, "") + ".smc"];
        for (const filename of [...new Set(variations)]) {
            const testUrl = chrome.runtime.getURL(root + filename);
            try { const r = await fetch(testUrl, { method: 'HEAD' }); if (r.ok) return testUrl; } catch (e) {}
        }
        throw new Error(`ROM not found: ${baseName}`);
    }

    async function findCorePaths() {
        const jsUrl = chrome.runtime.getURL("Emulators/snes/cores/snes9x_libretro.js");
        const wasmUrl = chrome.runtime.getURL("Emulators/snes/cores/snes9x_libretro.wasm");
        return { js: jsUrl, wasm: wasmUrl };
    }

    dropdown.onchange = async () => {
        const romName = dropdown.value;
        dropdown.blur();
        
        debugLog.innerHTML = `<span style="color:yellow">Initializing SNES Construct...</span>`;
        
        const oldIframe = displayWrapper.querySelector('iframe');
        if(oldIframe) oldIframe.remove();

        try {
            const romUrl = await findRomUrl(romName);
            const corePaths = await findCorePaths();
            const romResponse = await fetch(romUrl);
            const romBlob = await romResponse.blob();
            
            const safeInternalName = "game.sfc";
            const romFile = new File([romBlob], safeInternalName, { type: "application/octet-stream" });

            // Load State from LocalStorage for the CURRENT slot
            const savedStateBase64 = localStorage.getItem(`snes_state_${currentSlot}_${romName}`);
            const stateBlob = savedStateBase64 ? base64ToBlob(savedStateBase64) : null;

            const iframe = document.createElement('iframe');
            iframe.src = chrome.runtime.getURL("snes_sandbox.html");
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.border = "none";
            iframe.style.display = "block";
            iframe.style.position = "relative"; 
            iframe.style.zIndex = "5";
            
            displayWrapper.insertBefore(iframe, fullBtn);

            iframe.onload = () => {
                iframe.contentWindow.postMessage({
                    command: 'start',
                    romBlob: romFile,
                    romName: romName,
                    initialState: stateBlob,
                    initialSlot: parseInt(currentSlot),
                    coreConfig: {
                        name: 'snes9x',
                        js: corePaths.js,
                        wasm: corePaths.wasm
                    },
                    retroarchConfig: {
                        notification_show_save_state: "false",
                        notification_show_load_state: "false",
                        video_font_enable: "false",
                        input_player1_up: "w",
                        input_player1_down: "s",
                        input_player1_left: "a",
                        input_player1_right: "d",
                        input_player1_start: "enter",
                        input_player1_select: "rshift",
                        input_player1_b: "x",
                        input_player1_a: "z",
                        input_player1_y: "v",
                        input_player1_x: "c",
                        input_player1_l: "lshift",
                        input_player1_r: "pagedown",
                        input_toggle_fast_forward: "p"
                    }
                }, '*');
                iframe.contentWindow.focus();
            };

            if (messageListener) window.removeEventListener('message', messageListener);

            messageListener = function(e) {
                 if (e.data.status === 'running') {
                    debugLog.innerHTML = "";
                } 
                else if (e.data.status === 'error') {
                    if (e.data.message && e.data.message.includes("GamepadEvent")) return;
                    debugLog.innerHTML = `[ERROR] ${e.data.message}`;
                } 
                else if (e.data.status === 'gamepad_connected') {
                    debugLog.innerHTML = `<span style="color:#0f0;">GAMEPAD READY: ${e.data.id.substring(0, 15)}...</span>`;
                    setTimeout(() => debugLog.innerHTML = "", 3000);
                }
                
                if (e.data.command === 'export_state') {
                    const base64Data = bufferToBase64(e.data.data);
                    
                    // Use the slot sent from emulator, or fallback to currentSlot
                    const targetSlot = e.data.slot || currentSlot;
                    const targetRom = e.data.romName || dropdown.value;

                    localStorage.setItem(`snes_state_${targetSlot}_${targetRom}`, base64Data);
                    
                    debugLog.innerHTML = `<span style="color:#0f0;">STATE SAVED TO SLOT ${targetSlot}</span>`;
                    setTimeout(() => { debugLog.innerHTML = ""; }, 2000);
                }
            };

            window.addEventListener('message', messageListener);

        } catch (e) {
            console.error(e);
            debugLog.innerHTML = `[SYSTEM ERROR] ${e.message}`;
        }
    };
};