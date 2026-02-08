// --- SMS_MAINFRAME CONTROLLER ---

window.SMS_SYSTEM = {
    video: { ctx: null, imageData: null, ready: false },
};

/**
 * UI ADAPTER
 */
class MatrixSmsUI {
    constructor(smsInstance) {
        this.sms = smsInstance;
        this.canvasImageData = window.SMS_SYSTEM.video.imageData;
    }

    reset() {
        if (window.SMS_SYSTEM.video.ready) {
            window.SMS_SYSTEM.video.ctx.fillStyle = '#000';
            window.SMS_SYSTEM.video.ctx.fillRect(0, 0, 256, 192);
        }
    }

    requestAnimationFrame(callback) {
        window.requestAnimationFrame(() => {
            if (window.activeSmsInstance) {
                window.activeSmsInstance.pollGamepads();
            }
            callback();
        });
    }

    writeFrame(buffer) {
        if (!window.SMS_SYSTEM.video.ready || !window.SMS_SYSTEM.video.ctx) return;
        window.SMS_SYSTEM.video.ctx.putImageData(window.SMS_SYSTEM.video.imageData, 0, 0);
    }

    writeAudio(arg1, arg2) {
        if (!window.activeSmsInstance) return;

        let left = arg1;
        let right = arg2;

        if (left && left.getChannelData) {
            left = left.getChannelData(0);
            right = left; 
        }
        else if (left && !left.length && left.left) {
            right = left.right;
            left = left.left;
        }

        if (!left || !left.length) return;
        window.activeSmsInstance.processAudioChunk(left, right);
    }

    getFrame() { return null; }
    updateStatus(msg) {}
}

/**
 * MAIN CONTROLLER
 */
class MatrixSMS {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        // Audio
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioCtor({ latencyHint: 'interactive', sampleRate: 44100 });
        this.audioBuffer = []; 
        this.isMuted = false;
        
        this.sms = null;

        // Inputs
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);
        this.gamepadState = {};

        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', this.boundKeyDown);
        document.addEventListener('keyup', this.boundKeyUp);
        window.addEventListener("gamepadconnected", (e) => {
            console.log("[SMS] Gamepad connected:", e.gamepad.id);
        });
    }

    stop() {
        document.removeEventListener('keydown', this.boundKeyDown);
        document.removeEventListener('keyup', this.boundKeyUp);
        
        if (this.sms) this.sms.stop();
        if (this.audioCtx) this.audioCtx.close();
        console.log("SMS CORE SHUTDOWN.");
    }

    translateKey(keyCode) {
        switch(keyCode) {
            case 87: return 38; // W -> Up
            case 83: return 40; // S -> Down
            case 65: return 37; // A -> Left
            case 68: return 39; // D -> Right
            case 32: return 13; // Space -> Enter (Start)
            case 13: return 13; // Enter -> Enter
            case 90: return 90; // Z -> Btn 1
            case 88: return 88; // X -> Btn 2
            case 16: return null; 
            default: return null;
        }
    }

    handleKeyDown(e) {
        if (document.activeElement && 
           (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(e => {});
        }

        if (this.sms && this.sms.keyboard) {
             const targetKey = this.translateKey(e.keyCode);
             if (targetKey) {
                 e.preventDefault(); 
                 this.sms.keyboard.keydown({ keyCode: targetKey, preventDefault: () => {} });
             }
        }
    }

    handleKeyUp(e) {
        if (document.activeElement && 
           (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

        if (this.sms && this.sms.keyboard) {
             const targetKey = this.translateKey(e.keyCode);
             if (targetKey) {
                 e.preventDefault();
                 this.sms.keyboard.keyup({ keyCode: targetKey, preventDefault: () => {} });
             }
        }
    }

    pollGamepads() {
        if (!navigator.getGamepads || !this.sms || !this.sms.keyboard) return;

        const gamepads = navigator.getGamepads();
        const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3]; 

        if (!gp) return;

        if (this.audioCtx.state === 'suspended') {
            if (gp.buttons.some(b => b.pressed)) this.audioCtx.resume().catch(e => {});
        }

        const newState = {
            38: gp.buttons[12]?.pressed || gp.axes[1] < -0.5, 
            40: gp.buttons[13]?.pressed || gp.axes[1] > 0.5,  
            37: gp.buttons[14]?.pressed || gp.axes[0] < -0.5, 
            39: gp.buttons[15]?.pressed || gp.axes[0] > 0.5,  
            90: gp.buttons[0]?.pressed || gp.buttons[2]?.pressed, 
            88: gp.buttons[1]?.pressed || gp.buttons[3]?.pressed, 
            13: gp.buttons[9]?.pressed || gp.buttons[8]?.pressed  
        };

        Object.keys(newState).forEach(key => {
            const code = parseInt(key);
            if (newState[code] && !this.gamepadState[code]) {
                this.sms.keyboard.keydown({ keyCode: code, preventDefault: () => {} });
            } else if (!newState[code] && this.gamepadState[code]) {
                this.sms.keyboard.keyup({ keyCode: code, preventDefault: () => {} });
            }
        });

        this.gamepadState = newState;
    }

    processAudioChunk(left, right) {
        if (this.isMuted) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume().catch(e => {});

        const len = left.length;
        let needsNorm = false;
        if (len > 0 && Math.abs(left[0]) > 2.0) needsNorm = true;

        for (let i = 0; i < len; i++) {
            let l = left[i];
            let r = (right && right[i] !== undefined) ? right[i] : l; 

            if (needsNorm) {
                l /= 32768.0; 
                r /= 32768.0;
            }
            this.audioBuffer.push(l, r);
        }

        if (this.audioBuffer.length >= 4096) {
            this.playAudio();
        }
    }

    playAudio() {
        if (this.audioCtx.state === 'closed') return;
        try {
            const frameCount = this.audioBuffer.length / 2;
            const audioBuf = this.audioCtx.createBuffer(2, frameCount, 44100);
            
            const channelL = audioBuf.getChannelData(0);
            const channelR = audioBuf.getChannelData(1);

            for (let i = 0; i < frameCount; i++) {
                channelL[i] = this.audioBuffer[i * 2];
                channelR[i] = this.audioBuffer[i * 2 + 1];
            }

            const source = this.audioCtx.createBufferSource();
            source.buffer = audioBuf;
            const gainNode = this.audioCtx.createGain();
            gainNode.gain.value = 1.0; 
            source.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            source.start();

        } catch (e) {}
        this.audioBuffer = [];
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audioBuffer = [];
        if (!this.isMuted && this.audioCtx.state === 'suspended') this.audioCtx.resume();
        return this.isMuted;
    }

    async loadRom(arrayBuffer) {
        try {
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            if (!arrayBuffer || arrayBuffer.byteLength < 1024) throw new Error("INVALID_ROM");
            
            if (this.sms) {
                this.sms.stop();
                this.sms = null;
            }

            const ctx = this.canvas.getContext('2d', { alpha: false, willReadFrequently: true });
            const imageData = ctx.createImageData(256, 192);
            window.SMS_SYSTEM.video.ctx = ctx;
            window.SMS_SYSTEM.video.imageData = imageData;
            window.SMS_SYSTEM.video.ready = true;
            
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 256, 192);

            let romBinaryString = "";
            const chunkSize = 0x8000;
            const rawBytes = new Uint8Array(arrayBuffer);
            for (let i = 0; i < rawBytes.length; i += chunkSize) {
                romBinaryString += String.fromCharCode.apply(null, rawBytes.subarray(i, i + chunkSize));
            }

            this.sms = new JSSMS({ ui: MatrixSmsUI, ENABLE_COMPILER: false });
            if (!this.sms.readRomDirectly(romBinaryString, "game.sms")) throw new Error("Core Failed");
            
            this.sms.reset(); 
            this.sms.start();
            console.log("[SMS] System Started.");

        } catch (error) {
            console.error("[SMS] BOOT ERROR:", error);
        }
    }
}

// --- LAUNCHER ---
window.openSmsEmulator = async function() {
    if (window.activeSmsInstance) {
        window.activeSmsInstance.stop();
        window.activeSmsInstance = null;
    }

    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const cmdInput = document.getElementById('terminal-cmd-input');

    if (!modal || !output) return;
    modal.classList.remove('hidden');
    output.innerHTML = "";
    
    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }
    
    if (cmdInput) cmdInput.blur();

    if (typeof JSSMS === 'undefined') {
        output.innerHTML = "<p>Initializing Core...</p>";
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL("Emulators/sms/jssms.min.js");
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    if (JSSMS && JSSMS.Z80 && JSSMS.Z80.prototype && !JSSMS.Z80.prototype._patched) {
        JSSMS.Z80.prototype.getUint16 = function(address) {
            return this.getUint8(address) | (this.getUint8(address + 1) << 8);
        };
        JSSMS.Z80.prototype.setUint16 = function(address, value) {
            this.setUint8(address, value & 0xFF);
            this.setUint8(address + 1, (value >> 8) & 0xFF);
        };
        JSSMS.Z80.prototype._patched = true; 
    }

    output.innerHTML = `
        <div class="nes-terminal-wrapper">
            <p style="color:var(--theme-color); font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px; text-align: center;">[ SMS_MAINFRAME ]</p>
            <select id="sms-rom-dropdown" class="nes-model-selector">
                <option value="" disabled selected>> UPLOAD CARTRIDGE...</option>
            </select>
            <div id="sms-container" class="nes-screen-container" style="display: flex; justify-content: center; align-items: center; background: #000;">
                <button id="sms-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius: 50%;">&#9974;</button>
                <canvas id="sms-screen" width="256" height="192" style="height:100%; width:auto; aspect-ratio:4/3; image-rendering: pixelated; display:block; max-width: 100%;"></canvas>
                <button id="sms-mute-btn" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius: 50%;">&#128266;</button>
                
                <div id="sms-audio-overlay" style="display:flex; position:absolute; top:0; left:0; width:100%; height:100%; z-index:90; cursor:pointer; background:black;">
                    <img src="${chrome.runtime.getURL('Emulators/sms/cover.jpg')}" style="width:100%; height:100%; object-fit:cover;" alt="Click to Start" onerror="this.style.display='none'; this.parentElement.innerHTML='<p style=\'color:#0f0; margin:auto;\'>CLICK TO START</p>'">
                </div>
            </div>
            <div style="display: block; width: 100%; box-sizing: border-box; margin: 5px auto 0 auto; font-size:0.65rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.5;"><span style="color:#fff;">CONTROLS:</span> WASD = MOVE<br>BTN-1 = <span style="color:#fff;">Z</span> | BTN-2 = <span style="color:#fff;">X</span> | START = <span style="color:#fff;">SPACE/ENTER</span><br><span style="color:#0f0;">[SYSTEM READY]</span></div>
        </div>
    `;

    window.activeSmsInstance = new MatrixSMS('sms-screen');

    const dropdown = document.getElementById('sms-rom-dropdown');
    const container = document.getElementById('sms-container');
    const muteBtn = document.getElementById('sms-mute-btn');
    const fullBtn = document.getElementById('sms-fullscreen-btn');

    container.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (cmdInput) cmdInput.blur();
        if (window.activeSmsInstance && window.activeSmsInstance.audioCtx.state === 'suspended') {
            await window.activeSmsInstance.audioCtx.resume();
        }
        document.getElementById('sms-audio-overlay').style.display = 'none';
    });

    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.activeSmsInstance) {
            const isMuted = window.activeSmsInstance.toggleMute();
            muteBtn.innerHTML = isMuted ? '&#128263;' : '&#128266;';
        }
        muteBtn.blur();
    });

    fullBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) container.requestFullscreen().catch(err => {});
        else document.exitFullscreen();
        fullBtn.blur();
    });

    const stopBubbling = (e) => { e.stopPropagation(); };
    dropdown.addEventListener('mousedown', stopBubbling);
    dropdown.addEventListener('click', stopBubbling);
    dropdown.addEventListener('keydown', stopBubbling);

    const SMS_ROMS = [
        "Razing Core (Alpha Demo V0.1.3.4).sms",
    ];

    SMS_ROMS.forEach(rom => {
        const opt = document.createElement('option');
        opt.value = rom;
        let displayName = rom.replace(/\.sms$/i, "").split('(')[0].trim().toUpperCase();
        opt.textContent = `> ${displayName}`;
        dropdown.appendChild(opt);
    });

    dropdown.onchange = async (e) => {
        e.stopPropagation();
        dropdown.blur(); 
        if (cmdInput) cmdInput.blur();

        if (window.activeSmsInstance && window.activeSmsInstance.audioCtx.state === 'suspended') {
            await window.activeSmsInstance.audioCtx.resume();
        }
        document.getElementById('sms-audio-overlay').style.display = 'none';

        const romPath = `Emulators/sms/roms/${dropdown.value}`;
        try {
            console.log(`[SMS] Fetching ${romPath}...`);
            const res = await fetch(chrome.runtime.getURL(romPath));
            if (!res.ok) throw new Error("File not found");
            const buffer = await res.arrayBuffer();
            await window.activeSmsInstance.loadRom(buffer);
            setTimeout(() => { if (cmdInput) cmdInput.blur(); window.focus(); }, 100);
        } catch (e) {
            console.error("[SMS] Load Error:", e);
        }
    };
};