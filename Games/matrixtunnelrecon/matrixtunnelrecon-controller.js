// Games/matrixtunnelrecon/matrixtunnelrecon-controller.js

window.openMatrixTunnelReconGame = async function() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    
    if (!modal || !output) return;
    modal.classList.remove('hidden');

    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }

    if (window._tunnelReconListener) {
        window.removeEventListener('message', window._tunnelReconListener);
        window._tunnelReconListener = null;
    }

    // --- UI STRUCTURE ---
    output.innerHTML = `
        <div class="nes-terminal-wrapper">
            <p style="color:#00ff41; font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px; text-align: center;">[ MATRIX_TUNNEL_RECON ]</p>
            
            <div id="mtr-display-wrapper" class="nes-screen-container" style="position: relative; border: 1px solid #00ff41; width: 100%; aspect-ratio: 4 / 3; background: black;">
                <button id="mtr-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #00ff41; color:#00ff41; cursor:pointer;">&#9974;</button>
                <button id="mtr-mute-btn" data-muted="false" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; bottom:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #00ff41; color:#00ff41; cursor:pointer;">&#128266;</button>
            </div>
            
            <div id="mtr-debug-log" style="color:#00ff41; font-family:'Courier New'; font-size:12px; margin-top:5px; height:20px; text-align:center;">SYNCHRONIZING WITH SATELLITE...</div>
            
            <div style="width: 100%; text-align: center; margin-top: 5px; font-size: 0.65rem; opacity: 0.7; font-family: 'Courier New', monospace;"><span style="color:#fff;">CONTROLS:</span> ARROWS TO FLY | A FRONT FIRE | B REAR FIRE | Y EMP | <span style="color:#fff;">SYSTEM:</span> GAMEPAD SUPPORT AUTO-DETECTED </div>
        </div>`;

    const displayWrapper = document.getElementById('mtr-display-wrapper');
    const fullBtn = document.getElementById('mtr-fullscreen-btn');
    const muteBtn = document.getElementById('mtr-mute-btn');
    const debugLog = document.getElementById('mtr-debug-log');

    const launchSwf = async () => {
        const oldIframe = displayWrapper.querySelector('iframe');
        if(oldIframe) oldIframe.remove();

        const iframe = document.createElement('iframe');
        iframe.src = chrome.runtime.getURL("Games/matrixtunnelrecon/matrixtunnelrecon.html");
        iframe.style.width = "100%"; 
        iframe.style.height = "100%"; 
        iframe.style.border = "none";
        
        displayWrapper.insertBefore(iframe, fullBtn);
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

    window._tunnelReconListener = function(e) {
        if (e.data.status === 'running') debugLog.innerHTML = "SYSTEM ONLINE";
        if (e.data.status === 'error') debugLog.innerHTML = `<span style="color:red;">CONNECTION FAILED</span>`;
    };
    window.addEventListener('message', window._tunnelReconListener);

    launchSwf();
};