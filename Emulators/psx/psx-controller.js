// Emulators/psx/psx-controller.js

window.openPSXEmulator = async function() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    
    if (!modal || !output) return;
    modal.classList.remove('hidden');

    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }

    if (window._psxListener) {
        window.removeEventListener('message', window._psxListener);
        window._psxListener = null;
    }

    // Default to Slot 1
    let currentSlot = "1";

    output.innerHTML = `
        <div class="nes-terminal-wrapper">
            <p style="color:#00ff41; font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;">[ PSX_MAINFRAME ]</p>
            <div style="display:flex; justify-content:center; margin-bottom:10px;">
                <select id="psx-rom-select" class="nes-model-selector" style="flex-grow:1; max-width:300px; margin-right: 10px;">
                    <option value="" disabled selected>> INSERT DISC...</option>
                </select>
                <select id="psx-slot-select" class="nes-model-selector" style="width: auto; min-width: 100px;">
                    <option value="1" selected>MEM CARD 1</option>
                    <option value="2">MEM CARD 2</option>
                </select>
            </div>
            <div id="psx-display-wrapper" class="nes-screen-container" style="position: relative; border: 1px solid #00ff41; width: 100%; aspect-ratio: 4 / 3; background: black url('${chrome.runtime.getURL("Emulators/psx/cover.jpg")}') no-repeat center center; background-size: cover;">
                <button id="psx-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #00ff41; color:#00ff41; cursor:pointer;">&#9974;</button>
                <button id="psx-mute-btn" data-muted="false" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; bottom:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #00ff41; color:#00ff41; cursor:pointer;">&#128266;</button>
            </div>
            <div id="debug-log" style="color:red; font-family:'Courier New'; font-size:12px; margin-top:5px; height:20px;"></div>
            <div style="display: block; width: 100%; box-sizing: border-box; margin: 5px auto 0 auto; font-size:0.6rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.4;"><span style="color:#fff;">CONTROLS:</span> WASD = D-PAD | SPACE = <span style="color:#fff;">X</span> | BACKSPACE = <span style="color:#fff;">O</span> | Q/E = <span style="color:#fff;">L1/R1</span><br>1/3 = <span style="color:#fff;">SQUARE/TRIANGLE</span> | ENTER = <span style="color:#fff;">START</span> | SHIFT = <span style="color:#fff;">SELECT</span><br></div>
        </div>`;

    const dropdown = document.getElementById('psx-rom-select');
    const slotSelect = document.getElementById('psx-slot-select');
    const displayWrapper = document.getElementById('psx-display-wrapper');
    const muteBtn = document.getElementById('psx-mute-btn');
    const fullBtn = document.getElementById('psx-fullscreen-btn');
    const debugLog = document.getElementById('debug-log');

    ['mousedown', 'click', 'mouseup', 'focus'].forEach(event => {
        dropdown.addEventListener(event, (e) => e.stopPropagation());
        slotSelect.addEventListener(event, (e) => e.stopPropagation());
    });

    slotSelect.addEventListener('change', (e) => {
        currentSlot = e.target.value;
        // Fix: Use textContent and style instead of innerHTML
        debugLog.style.color = '#00ff41';
        debugLog.textContent = `SLOT CHANGED TO MEM CARD ${currentSlot}`;
    });

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

    const psxRetroarchConfig = {
        'pcsx_rearmed_bios': 'HLE', 
        'pcsx_rearmed_dithering': 'enabled',
        
        // --- HIGH RESOLUTION SETTINGS ---
        'pcsx_rearmed_neon_enhancement_res': 'enabled',
        'pcsx_rearmed_neon_enhancement_no_main_render': 'enabled',
        
        // KEYBOARD MAPPING
        input_player1_up: 'w',
        input_player1_down: 's',
        input_player1_left: 'a',
        input_player1_right: 'd',
        input_player1_b: 'space',     // Cross (X)
        input_player1_a: 'backspace', // Circle (O)
        input_player1_y: '1',         // Square
        input_player1_x: '3',         // Triangle
        input_player1_l: 'q',         // L1
        input_player1_r: 'e',         // R1
        input_player1_start: 'enter',
        input_player1_select: 'shift',

        // GAMEPAD AUTO-CONFIG ENABLED
        input_autodetect_enable: 'true',
        input_joypad_driver: 'gamepad',

        // KEYBOARD HOTKEYS
        input_enable_hotkey: 'shift', 
        input_save_state: 'f1',       
        input_load_state: 'f4',       

        // CONTROLLER HOTKEYS
        input_enable_hotkey_btn: '8', 
        input_menu_toggle_btn: '9',   
        input_save_state_btn: '5',    
        input_load_state_btn: '4'     
    };

    const ROMS = window.PSX_ROMS;

    ROMS.forEach(rom => {
        const opt = document.createElement('option');
        opt.value = rom;
        opt.textContent = rom.replace(/\.(chd|bin|iso|img)$/i, '').replace(/_/g, ' ');
        dropdown.appendChild(opt);
    });

    dropdown.onchange = async () => {
        const romName = dropdown.value;
        const oldIframe = displayWrapper.querySelector('iframe');
        if(oldIframe) oldIframe.remove();
        try {
            const romUrl = chrome.runtime.getURL('Emulators/psx/roms/' + romName);
            const romResponse = await fetch(romUrl);
            const romBlob = await romResponse.blob();

            // MIGRATED: Fetch from chrome.storage.local instead of localStorage
            const saveKey = `psx_mem_${currentSlot}_${romName}`;
            const storageData = await chrome.storage.local.get([saveKey]);
            const savedBase64 = storageData[saveKey];
            const saveBlob = savedBase64 ? base64ToBlob(savedBase64) : null;

            if (saveBlob) {
                // Fix: Use textContent and style instead of innerHTML
                debugLog.style.color = '#00ff41';
                debugLog.textContent = `MEM CARD ${currentSlot} LOADED`;
            }

            const iframe = document.createElement('iframe');
            iframe.src = chrome.runtime.getURL("psx_sandbox.html");
            iframe.style.width = "100%"; iframe.style.height = "100%"; iframe.style.border = "none";
            
            iframe.allow = "screen-wake-lock";

            displayWrapper.insertBefore(iframe, document.getElementById('psx-fullscreen-btn'));
            iframe.onload = () => {
                iframe.contentWindow.postMessage({ 
                    command: 'start', 
                    romBlob: romBlob,
                    saveData: saveBlob, 
                    retroarchConfig: psxRetroarchConfig 
                }, '*');
                iframe.contentWindow.focus();
            };
        } catch (e) { 
            // Fix: Catch block sanitization
            const dl = document.getElementById('debug-log');
            dl.style.color = 'red';
            dl.textContent = `[ERROR] ${e.message}`; 
        }
    };

    fullBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) displayWrapper.requestFullscreen();
        else document.exitFullscreen();
        fullBtn.blur(); 
    });

    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const iframe = displayWrapper.querySelector('iframe');
        if (iframe) {
            iframe.contentWindow.postMessage({ command: 'mute' }, '*');
            const isMuted = muteBtn.getAttribute('data-muted') === 'true';
            muteBtn.setAttribute('data-muted', !isMuted);
            // Safe innerHTML mapping, using standard predefined entities
            muteBtn.innerHTML = isMuted ? '&#128266;' : '&#128263;';
            muteBtn.style.color = isMuted ? '#00ff41' : 'red';
        }
        muteBtn.blur();
    });

    window._psxListener = async function(e) {
        if (e.data.command === 'export_save') {
            const romName = dropdown.value;
            if (romName && e.data.data) {
                const base64Data = bufferToBase64(e.data.data);
                const saveKey = `psx_mem_${currentSlot}_${romName}`;
                // MIGRATED: Save to chrome.storage.local instead of localStorage
                await chrome.storage.local.set({ [saveKey]: base64Data });
            }
        }
    };
    window.addEventListener('message', window._psxListener);
};