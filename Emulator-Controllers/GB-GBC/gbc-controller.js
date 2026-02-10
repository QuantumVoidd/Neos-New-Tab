// Emulators/gbc/gbc-controller.js

window.openGBCEmulator = async function() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    
    if (!modal || !output) return;
    modal.classList.remove('hidden');

    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }

    // Clean up old listener
    if (window._gbaListener) {
        window.removeEventListener('message', window._gbaListener);
        window._gbaListener = null;
    }

    let currentSlot = "1";

    // --- UI STRUCTURE (MIRRORING GBA) ---
    output.innerHTML = `
        <div class="nes-terminal-wrapper">
            <p style="color:#00ff41; font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;">[ GBC_MAINFRAME ]</p>
            <div style="display:flex; justify-content:center; margin-bottom:10px;">
                <select id="gbc-rom-select" class="nes-model-selector" style="flex-grow:1; max-width:300px; margin-right: 10px;">
                    <option value="" disabled selected>> INSERT CARTRIDGE...</option>
                </select>
                <select id="gbc-slot-select" class="nes-model-selector" style="width: auto; min-width: 100px;">
                    <option value="1" selected>SLOT 1</option>
                    <option value="2">SLOT 2</option>
                    <option value="3">SLOT 3</option>
                </select>
            </div>
            <div id="gbc-display-wrapper" class="nes-screen-container" style="position: relative; border: 1px solid #00ff41; width: 100%; aspect-ratio: 3 / 2; background: black url('${chrome.runtime.getURL("Emulators/gbc/cover.jpg")}') no-repeat center center; background-size: cover;">
                <button id="gbc-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #00ff41; color:#00ff41; cursor:pointer;">&#9974;</button>
                <button id="gbc-mute-btn" data-muted="false" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; bottom:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #00ff41; color:#00ff41; cursor:pointer;">&#128266;</button>
            </div>
            <div id="debug-log" style="color:#00ff41; font-family:'Courier New'; font-size:12px; margin-top:5px; height:20px; text-align:center;"></div>
            <div style="display: block; width: 100%; box-sizing: border-box; margin: 5px auto 0 auto; font-size:0.65rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.5;"><span style="color:#fff;">CONTROLS:</span> WASD = D-PAD | ENTER = <span style="color:#fff;">START</span> | SHIFT = <span style="color:#fff;">SELECT</span><br>BACKSPACE = <span style="color:#fff;">B</span> | SPACE = <span style="color:#fff;">A</span> | Q = <span style="color:#fff;">L</span> | E = <span style="color:#fff;">R</span><br>1 = SAVE STATE | 4 = LOAD STATE</div>
        </div>`;

    const dropdown = document.getElementById('gbc-rom-select');
    const slotSelect = document.getElementById('gbc-slot-select');
    const displayWrapper = document.getElementById('gbc-display-wrapper');
    const fullBtn = document.getElementById('gbc-fullscreen-btn');
    const muteBtn = document.getElementById('gbc-mute-btn');
    const debugLog = document.getElementById('debug-log');

    // Prevent input bubbling
    ['mousedown', 'click', 'mouseup', 'focus'].forEach(event => {
        dropdown.addEventListener(event, (e) => e.stopPropagation());
        slotSelect.addEventListener(event, (e) => e.stopPropagation());
        fullBtn.addEventListener(event, (e) => e.stopPropagation());
        muteBtn.addEventListener(event, (e) => e.stopPropagation());
    });

    // --- HELPER FUNCTIONS ---
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
        debugLog.innerHTML = `<span style="color:#00ff41;">SLOT CHANGED TO ${currentSlot}</span>`;
        
        const romName = dropdown.value;
        if (!romName) return; 

        // Fetch data for the new slot
        const savedStateBase64 = localStorage.getItem(`gbc_state_${currentSlot}_${romName}`);
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
                blob: blobData
            }, '*');
            
            // Force focus
            setTimeout(() => { iframe.contentWindow.focus(); }, 50);
        }
    });

    const gbcRetroarchConfig = {
        input_player1_up: 'w',
        input_player1_down: 's',
        input_player1_left: 'a',
        input_player1_right: 'd',
        input_player1_a: 'space', 
        input_player1_b: 'backspace',     
        input_player1_l: 'q',
        input_player1_r: 'e',
        input_player1_start: 'enter',
        input_player1_select: 'shift'
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
            muteBtn.innerHTML = isMuted ? '&#128266;' : '&#128263;';
            muteBtn.style.color = isMuted ? '#00ff41' : 'red';
        }
        muteBtn.blur();
    });

    // --- ROM LIST (EXTRACTED GB/GBC ONLY) ---
    const ROMS = [
        "tobudx.gb",     
    ];

    ROMS.forEach(rom => {
        const opt = document.createElement('option');
        opt.value = rom;
        // Clean display name
        opt.textContent = rom.replace(/\.(gba|bin|gb|gbc)$/i, '').replace(/_/g, ' ');
        dropdown.appendChild(opt);
    });

    dropdown.onchange = async () => {
        const romName = dropdown.value;
        const oldIframe = displayWrapper.querySelector('iframe');
        if(oldIframe) oldIframe.remove();
        
        try {
            // Note: pointing to Emulators/gbc/roms/
            const romUrl = chrome.runtime.getURL('Emulators/gbc/roms/' + romName);
            const romResponse = await fetch(romUrl);
            const romBlob = await romResponse.blob();

            // Load State from LocalStorage for the CURRENT slot
            // Note: Using 'gbc_state_' prefix
            const savedStateBase64 = localStorage.getItem(`gbc_state_${currentSlot}_${romName}`);
            const stateBlob = savedStateBase64 ? base64ToBlob(savedStateBase64) : null;

            const iframe = document.createElement('iframe');
            
            // Pointing to gbc_sandbox.html in the same folder (or root relative)
            // If this file is in Emulators/gbc/, then gbc_sandbox.html is in the same dir.
            iframe.src = chrome.runtime.getURL("Emulators/gbc/gbc_sandbox.html");
            
            iframe.style.width = "100%"; iframe.style.height = "100%"; iframe.style.border = "none";
            displayWrapper.insertBefore(iframe, fullBtn);
            
            iframe.onload = () => {
                iframe.contentWindow.postMessage({ 
                    command: 'start', 
                    romBlob: romBlob,
                    romName: romName,
                    initialState: stateBlob,
                    initialSlot: parseInt(currentSlot),
                    retroarchConfig: gbcRetroarchConfig 
                }, '*');
                iframe.contentWindow.focus();
            };
        } catch (e) { 
            debugLog.innerHTML = `[ERROR] ${e.message}`; 
            console.error(e);
        }
    };

    window._gbaListener = async function(e) {
        if (e.data.status === 'running') {
            debugLog.innerHTML = `<span style="color:#00ff41;">SYSTEM ONLINE</span>`;
        }
        if (e.data.status === 'error') {
            debugLog.innerHTML = `<span style="color:red;">[ERROR] ${e.data.message}</span>`;
        }
        
        if (e.data.command === 'export_state') {
            const base64Data = bufferToBase64(e.data.data);
            
            const targetSlot = e.data.slot || currentSlot;
            const targetRom = e.data.romName || dropdown.value;

            // Using 'gbc_state_' prefix
            localStorage.setItem(`gbc_state_${targetSlot}_${targetRom}`, base64Data);
            
            debugLog.innerHTML = `<span style="color:#00ff41;">STATE SAVED TO SLOT ${targetSlot}</span>`;
            setTimeout(() => { debugLog.innerHTML = `<span style="color:#00ff41;">SYSTEM ONLINE</span>`; }, 2000);
        }
    };
    window.addEventListener('message', window._gbaListener);
};