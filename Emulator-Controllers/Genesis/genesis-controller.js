// Emulators/genesis/genesis-controller.js

window.openGenesisEmulator = async function() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    
    if (!modal || !output) return;
    modal.classList.remove('hidden');

    // Initialize Terminal Rain Background (Added to match NES/GBA/SNES logic)
    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }

    // FIX 1: Cleanup any "Ghost" listeners from previous sessions immediately
    if (window._genesisListener) {
        window.removeEventListener('message', window._genesisListener);
        window._gbaListener = null;
    }

    let currentSlot = 1;

    // 1. Setup Interface
    output.innerHTML = `
        <div class="nes-terminal-wrapper">
            <p style="color:#0f0; font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;">[ GENESIS_MAINFRAME ]</p>
            
            <div style="display:flex; justify-content:center; margin-bottom:10px;">
                <select id="genesis-rom-select" class="nes-model-selector" style="flex-grow:1; max-width:300px; margin-right: 10px;">
                    <option value="" disabled selected>> INSERT CARTRIDGE...</option>
                </select>

                <select id="gen-slot-select" class="nes-model-selector" style="width: auto; min-width: 100px;">
                    <option value="1" selected>SLOT 1</option>
                    <option value="2">SLOT 2</option>
                    <option value="3">SLOT 3</option>
                    <option value="4">SLOT 4</option>
                    <option value="5">SLOT 5</option>
                </select>
            </div>

            <div id="genesis-display-wrapper" class="nes-screen-container" style="
                position: relative; 
                border: 1px solid #0f0; 
                height: 480px;
                background: black url('${chrome.runtime.getURL("Emulators/genesis/cover.jpg")}') no-repeat center center; 
                background-size: cover;
            ">
                <button id="gen-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #0f0; color:#0f0; cursor:pointer;">&#9974;</button>
                
                <button id="gen-mute-btn" data-muted="false" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; bottom:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #0f0; color:#0f0; cursor:pointer;">&#128266;</button>
            </div>
            
            <div id="debug-log" style="color:red; font-family:'Courier New'; font-size:12px; margin-top:5px; height:20px;"></div>

            <div style="display: block; width: 100%; box-sizing: border-box; margin: 5px auto 0 auto; font-size:0.65rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.5;"><span style="color:#fff;">CONTROLS:</span> WASD = MOVE | START = <span style="color:#fff;">SHIFT</span> | MODE = <span style="color:#fff;">CAPS</span><br>A=<span style="color:#fff;">SPACE</span> B=<span style="color:#fff;">L-SHIFT</span> C=<span style="color:#fff;">I</span> | X=<span style="color:#fff;">K</span> Y=<span style="color:#fff;">J</span> Z=<span style="color:#fff;">L</span><br><span style="color:#aaa;">[1] SAVE | [4] LOAD | [P] FAST FWD</span><br><span style="color:#0f0;">[GAMEPAD: R1+A = SAVE | R1+X = LOAD]</span></div>
        </div>`;

    const dropdown = document.getElementById('genesis-rom-select');
    const slotSelect = document.getElementById('gen-slot-select');
    const displayWrapper = document.getElementById('genesis-display-wrapper');
    const fullBtn = document.getElementById('gen-fullscreen-btn');
    const muteBtn = document.getElementById('gen-mute-btn');
    const debugLog = document.getElementById('debug-log');
    const termInput = document.getElementById('terminal-cmd-input');

    // Prevent Bubbling
    ['mousedown', 'click', 'mouseup', 'focus'].forEach(event => {
        dropdown.addEventListener(event, (e) => e.stopPropagation());
        slotSelect.addEventListener(event, (e) => e.stopPropagation());
        if(fullBtn) fullBtn.addEventListener(event, (e) => e.stopPropagation());
        if(muteBtn) muteBtn.addEventListener(event, (e) => e.stopPropagation());
    });

    slotSelect.addEventListener('change', (e) => {
        currentSlot = e.target.value;
        slotSelect.blur();
        const romName = dropdown.value;
        const storageKey = romName ? `gen_save_slot_${currentSlot}_${romName}` : `gen_save_slot_${currentSlot}`;
        const exists = localStorage.getItem(storageKey) ? "DATA FOUND" : "EMPTY";
        debugLog.innerHTML = `<span style="color:#0f0;">SLOT ${currentSlot} SELECTED [${exists}]</span>`;
        setTimeout(() => debugLog.innerHTML = "", 2000);
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

    window.addEventListener("gamepadconnected", (e) => {
        debugLog.innerHTML = `<span style="color:#0f0;">GAMEPAD DETECTED: ${e.gamepad.id.substring(0, 20).toUpperCase()}...</span>`;
        setTimeout(() => debugLog.innerHTML = "", 3000);
    });

    // --- FULL ROM LIST PRESERVED ---
    const ROMS = [
        "RE MD DEMO 2.bin",    
    ];

    ROMS.forEach(rom => {
        const opt = document.createElement('option');
        opt.value = rom;
        // Clean display name
        opt.textContent = rom.replace(/\.(md|bin|smd)$/i, '').replace(/_/g, ' ');
        dropdown.appendChild(opt);
    });

    async function findRomUrl(baseName) {
        const root = 'Emulators/genesis/roms/';
        // Smart filename guessing
        const variations = [
            baseName, 
            baseName.toLowerCase(), 
            baseName.toUpperCase(), 
            baseName.replace(/\.[^/.]+$/, "") + ".md", 
            baseName.replace(/\.[^/.]+$/, "") + ".bin"
        ];
        for (const filename of [...new Set(variations)]) {
            const testUrl = chrome.runtime.getURL(root + filename);
            try { const r = await fetch(testUrl, { method: 'HEAD' }); if (r.ok) return testUrl; } catch (e) {}
        }
        throw new Error(`ROM not found: ${baseName}`);
    }

    async function findCorePaths() {
        const possibleFolders = ["Emulators/genesis/cores/", "Emulators/genesis/data/", "Emulators/genesis/"];
        for (const folder of possibleFolders) {
            const jsUrl = chrome.runtime.getURL(folder + "genesis_plus_gx_libretro.js");
            try { const r = await fetch(jsUrl, { method: 'HEAD' }); if (r.ok) return { js: jsUrl, wasm: chrome.runtime.getURL(folder + "genesis_plus_gx_libretro.wasm") }; } catch (e) {}
        }
        throw new Error("Core engine files not found.");
    }

    dropdown.onchange = async () => {
        const romName = dropdown.value;
        dropdown.blur();
        if (termInput) termInput.blur(); 

        debugLog.innerHTML = `<span style="color:yellow">Initializing System...</span>`;
        
        const oldIframe = displayWrapper.querySelector('iframe');
        if(oldIframe) oldIframe.remove();

        try {
            const romUrl = await findRomUrl(romName);
            const corePaths = await findCorePaths();
            const romResponse = await fetch(romUrl);
            const romBlob = await romResponse.blob();

            const iframe = document.createElement('iframe');
            iframe.src = chrome.runtime.getURL("emulator_sandbox.html");
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
                    romBlob: romBlob,
                    coreConfig: {
                        name: 'genesis_plus_gx',
                        js: corePaths.js,
                        wasm: corePaths.wasm
                    }
                }, '*');
                iframe.contentWindow.focus();
            };

            // FIX 2: Clear old listener again before adding new one
            if (window._genesisListener) {
                window.removeEventListener('message', window._genesisListener);
            }

            // FIX 3: Assign to GLOBAL variable so it persists/updates correctly
            window._genesisListener = function(e) {
                const currentRomName = dropdown.value;
                if (e.data.status === 'save_success') {
                    localStorage.setItem(`gen_save_slot_${currentSlot}_${currentRomName}`, e.data.data);
                    debugLog.innerHTML = `<span style="color:#0f0;">STATE SAVED [SLOT ${currentSlot}]</span>`;
                    setTimeout(() => debugLog.innerHTML = "", 2000);
                }
                else if (e.data.status === 'request_load') {
                    const savedData = localStorage.getItem(`gen_save_slot_${currentSlot}_${currentRomName}`);
                    if (savedData) {
                        iframe.contentWindow.postMessage({ command: 'load_state', stateData: savedData }, '*');
                        debugLog.innerHTML = `<span style="color:yellow;">LOADING SLOT ${currentSlot}...</span>`;
                    } else {
                        debugLog.innerHTML = `<span style="color:red;">SLOT ${currentSlot} EMPTY</span>`;
                        setTimeout(() => debugLog.innerHTML = "", 2000);
                    }
                }
                else if (e.data.status === 'load_complete') {
                    debugLog.innerHTML = `<span style="color:#0f0;">LOAD COMPLETE</span>`;
                    setTimeout(() => debugLog.innerHTML = "", 2000);
                }
                else if (e.data.status === 'running') {
                    debugLog.innerHTML = "";
                } 
                else if (e.data.status === 'error') {
                    debugLog.innerHTML = `[ERROR] ${e.data.message}`;
                } 
                else if (e.data.status === 'gamepad_connected') {
                    debugLog.innerHTML = `<span style="color:#0f0;">GAMEPAD READY: ${e.data.id.substring(0, 15)}...</span>`;
                    setTimeout(() => debugLog.innerHTML = "", 3000);
                }
            };

            window.addEventListener('message', window._genesisListener);

        } catch (e) {
            console.error(e);
            debugLog.innerHTML = `[SYSTEM ERROR] ${e.message}`;
        }
    };
};