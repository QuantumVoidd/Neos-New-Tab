// Emulators/gba/gba-controller.js

window.openGBAEmulator = async function() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    
    if (!modal || !output) return;
    modal.classList.remove('hidden');

    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }

    if (window._gbaListener) {
        window.removeEventListener('message', window._gbaListener);
        window._gbaListener = null;
    }

    output.innerHTML = `
        <div class="nes-terminal-wrapper">
            <p style="color:#00ff41; font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;">[ GBA_MAINFRAME ]</p>
            <div style="display:flex; justify-content:center; margin-bottom:10px;">
                <select id="gba-rom-select" class="nes-model-selector" style="flex-grow:1; max-width:300px;">
                    <option value="" disabled selected>> INSERT CARTRIDGE...</option>
                </select>
            </div>
            <div id="gba-display-wrapper" class="nes-screen-container" style="position: relative; border: 1px solid #00ff41; width: 100%; aspect-ratio: 3 / 2; background: black url('${chrome.runtime.getURL("Emulators/gba/cover.jpg")}') no-repeat center center; background-size: cover;">
                <button id="gba-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #00ff41; color:#00ff41; cursor:pointer;">&#9974;</button>
                <button id="gba-mute-btn" data-muted="false" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; bottom:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #00ff41; color:#00ff41; cursor:pointer;">&#128266;</button>
            </div>
            <div id="debug-log" style="color:#00ff41; font-family:'Courier New'; font-size:12px; margin-top:5px; height:20px; text-align:center;"></div>
            <div style="display: block; width: 100%; box-sizing: border-box; margin: 5px auto 0 auto; font-size:0.65rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.5;"><span style="color:#fff;">CONTROLS:</span> WASD = D-PAD | ENTER = <span style="color:#fff;">START</span> | SHIFT = <span style="color:#fff;">SELECT</span><br>BACKSPACE = <span style="color:#fff;">B</span> | SPACE = <span style="color:#fff;">A</span> | Q = <span style="color:#fff;">L</span> | E = <span style="color:#fff;">R</span></div>
        </div>`;

    const dropdown = document.getElementById('gba-rom-select');
    const displayWrapper = document.getElementById('gba-display-wrapper');
    const fullBtn = document.getElementById('gba-fullscreen-btn');
    const muteBtn = document.getElementById('gba-mute-btn');
    const debugLog = document.getElementById('debug-log');

    const gbaRetroarchConfig = {
        input_player1_up: 'w',
        input_player1_down: 's',
        input_player1_left: 'a',
        input_player1_right: 'd',
        input_player1_a: 'backspace', 
        input_player1_b: 'space',     
        input_player1_l: 'q',
        input_player1_r: 'e',
        input_player1_start: 'enter',
        input_player1_select: 'shift'
    };

    dropdown.addEventListener('mousedown', (e) => e.stopPropagation());
    dropdown.addEventListener('click', (e) => e.stopPropagation());

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

    const ROMS = [
        "anguna - demo.gba",   
    ];

    ROMS.forEach(rom => {
        const opt = document.createElement('option');
        opt.value = rom;
        opt.textContent = rom.replace(/\.(gba|bin|gb|gbc)$/i, '').replace(/_/g, ' ');
        dropdown.appendChild(opt);
    });

    dropdown.onchange = async () => {
        const romName = dropdown.value;
        const oldIframe = displayWrapper.querySelector('iframe');
        if(oldIframe) oldIframe.remove();
        try {
            const romUrl = chrome.runtime.getURL('Emulators/gba/roms/' + romName);
            const romResponse = await fetch(romUrl);
            const romBlob = await romResponse.blob();

            const iframe = document.createElement('iframe');
            iframe.src = chrome.runtime.getURL("gba_sandbox.html");
            iframe.style.width = "100%"; iframe.style.height = "100%"; iframe.style.border = "none";
            displayWrapper.insertBefore(iframe, fullBtn);
            
            iframe.onload = () => {
                iframe.contentWindow.postMessage({ 
                    command: 'start', 
                    romBlob: romBlob,
                    romName: romName,
                    retroarchConfig: gbaRetroarchConfig 
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
    };
    window.addEventListener('message', window._gbaListener);
};