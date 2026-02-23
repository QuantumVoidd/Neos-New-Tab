// Emulators/nes/nes-controller.js

window.openNesEmulator = async function() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    
    if (!modal || !output) return;
    modal.classList.remove('hidden');

    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }

    if (window._nesListener) {
        window.removeEventListener('message', window._nesListener);
        window._nesListener = null;
    }

    let currentSlot = "1";

    // 1. Setup Interface
    output.innerHTML = `
        <div class="nes-terminal-wrapper">
            <p style="color:var(--theme-color); font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;">[ NES_MAINFRAME ]</p>
            <div style="display:flex; justify-content:center; margin-bottom:10px;">
                <select id="nes-rom-select" class="nes-model-selector" style="flex-grow:1; max-width:300px; margin-right: 10px;">
                    <option value="" disabled selected>> SELECT CARTRIDGE...</option>
                </select>
                <select id="nes-slot-select" class="nes-model-selector" style="width: auto; min-width: 100px;">
                    <option value="1" selected>SLOT 1</option>
                    <option value="2">SLOT 2</option>
                    <option value="3">SLOT 3</option>
                </select>
            </div>
            <div id="nes-display-wrapper" class="nes-screen-container" style="position: relative; border: 1px solid var(--theme-color); width: 100%; aspect-ratio: 4 / 3; background: black url('${chrome.runtime.getURL("Emulators/nes/cover.jpg")}') no-repeat center center; background-size: cover;">
                <button id="nes-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid var(--theme-color); color:var(--theme-color); cursor:pointer;">&#9974;</button>
                <button id="nes-mute-btn" data-muted="false" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; bottom:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid var(--theme-color); color:var(--theme-color); cursor:pointer;">&#128266;</button>
            </div>
            <div id="nes-debug-log" style="color:#00ff41; font-family:'Courier New'; font-size:12px; margin-top:5px; height:20px; text-align:center;"></div>
            <div style="display: block; width: 100%; box-sizing: border-box; margin: 10px 0 0 0; font-size:0.65rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.5;">CONTROLS: XBOX A = JUMP | XBOX B = RUN | 1 = SAVE STATE | 4 = LOAD STATE</div>
        </div>`;

    const dropdown = document.getElementById('nes-rom-select');
    const slotSelect = document.getElementById('nes-slot-select');
    const displayWrapper = document.getElementById('nes-display-wrapper');
    const muteBtn = document.getElementById('nes-mute-btn');
    const fullBtn = document.getElementById('nes-fullscreen-btn');
    const debugLog = document.getElementById('nes-debug-log');

    ['mousedown', 'click', 'mouseup', 'focus'].forEach(event => {
        dropdown.addEventListener(event, (e) => e.stopPropagation());
        slotSelect.addEventListener(event, (e) => e.stopPropagation());
    });

    slotSelect.addEventListener('change', (e) => {
        currentSlot = e.target.value;
        // Fix: Use textContent and style instead of innerHTML
        debugLog.style.color = '#00ff41';
        debugLog.textContent = `SLOT CHANGED TO ${currentSlot}`;
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

    const nesConfig = {
        'fceumm_palette': 'srgb',
        'fceumm_nospritelimit': 'enabled',
        
        // --- XBOX CONTROLLER MAPPING ---
        'input_autodetect_enable': 'true',
        
        // Button 0 (Xbox A) -> NES A (Jump)
        'input_player1_a_btn': '0',
        
        // Button 1 (Xbox B) -> NES B (Run)
        'input_player1_b_btn': '1',

        // Keyboard fallbacks
        'input_player1_a': 'space',
        'input_player1_b': 'shift',
        'input_player1_start': 'enter',
        'input_player1_select': 'c', 
        'input_player1_up': 'w',
        'input_player1_down': 's',
        'input_player1_left': 'a',
        'input_player1_right': 'd',
        
        'input_joypad_driver': 'gamepad',
        'input_enable_hotkey_btn': 'nul',
        'input_enable_hotkey': 'nul',
        'input_menu_toggle_btn': '99'
    };

    const ROMS = window.NES_ROMS;

    ROMS.forEach(rom => {
        const opt = document.createElement('option');
        opt.value = rom;
        opt.textContent = rom.replace('.nes', '').toUpperCase();
        dropdown.appendChild(opt);
    });

    dropdown.onchange = async () => {
        const romName = dropdown.value;
        const oldIframe = displayWrapper.querySelector('iframe');
        if(oldIframe) oldIframe.remove();

        try {
            const romUrl = chrome.runtime.getURL(`Emulators/nes/roms/${romName}`);
            const romResponse = await fetch(romUrl);
            const romBlob = await romResponse.blob();

            const savedSramBase64 = localStorage.getItem(`nes_sram_${currentSlot}_${romName}`);
            const saveBlob = savedSramBase64 ? base64ToBlob(savedSramBase64) : null;

            const savedStateBase64 = localStorage.getItem(`nes_state_${currentSlot}_${romName}`);
            const stateBlob = savedStateBase64 ? base64ToBlob(savedStateBase64) : null;

            // Fix: Construct string cleanly and use textContent
            let loadMessages = [];
            if (saveBlob) loadMessages.push("[SRAM LOADED]");
            if (stateBlob) loadMessages.push("[STATE LOADED]");
            
            if (loadMessages.length > 0) {
                debugLog.style.color = '#00ff41';
                debugLog.textContent = loadMessages.join(' ');
            } else {
                debugLog.textContent = '';
            }

            const iframe = document.createElement('iframe');
            iframe.src = chrome.runtime.getURL("nes_sandbox.html");
            iframe.style.width = "100%"; iframe.style.height = "100%"; iframe.style.border = "none";
            iframe.allow = "screen-wake-lock";
            
            displayWrapper.insertBefore(iframe, fullBtn);
            
            iframe.onload = () => {
                iframe.contentWindow.postMessage({ 
                    command: 'start', 
                    romBlob: romBlob,
                    romName: romName,
                    saveData: saveBlob,
                    initialState: stateBlob,
                    retroarchConfig: nesConfig 
                }, '*');
                
                setTimeout(() => iframe.contentWindow.focus(), 200);
            };
        } catch (e) { 
            // Fix: Catch block sanitization
            debugLog.style.color = 'red';
            debugLog.textContent = `[ERROR] ${e.message}`;
            console.error(e);
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
        }
        muteBtn.blur();
    });

    window._nesListener = function(e) {
        if (e.data.command === 'export_save') {
            const romName = e.data.romName;
            if (romName && e.data.data) {
                const base64Data = bufferToBase64(e.data.data);
                localStorage.setItem(`nes_sram_${currentSlot}_${romName}`, base64Data);
            }
        }
        if (e.data.command === 'export_state') {
            const romName = e.data.romName;
            if (romName && e.data.data) {
                const base64Data = bufferToBase64(e.data.data);
                localStorage.setItem(`nes_state_${currentSlot}_${romName}`, base64Data);
                // Fix: State saving sanitization
                debugLog.style.color = '#00ff41';
                debugLog.textContent = `STATE SAVED TO DISK`;
            }
        }
    };
    window.addEventListener('message', window._nesListener);
};