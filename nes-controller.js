// Emulators/nes/nes-controller.js

class MatrixNES {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.imageData = this.ctx.createImageData(256, 240);
        this.buf32 = new Uint32Array(this.imageData.data.buffer);
        
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.audioSamples = new Float32Array(4096);
        this.audioBuffer = [];
        this.isMuted = false;
        
        // Emulation State
        this.isFastForward = false;
        this.baseFrameRate = 1000 / 60; // Normal speed (60 FPS)
        this.fastFrameRate = 1000 / 180; // 3x speed
        this.romLoaded = false;
        
        // Save State Management
        this.currentSlot = 1;

        // Controller State
        this.gamepadState = {}; 
        this.hasGamepad = false;
        this.gamepadSaveLock = false;
        this.gamepadLoadLock = false;

        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);
        this.boundGamepadConnect = this.handleGamepadConnect.bind(this);
        this.boundGamepadDisconnect = this.handleGamepadDisconnect.bind(this);

        this.nes = new jsnes.NES({
            onFrame: (buffer) => {
                for (let i = 0; i < 256 * 240; i++) {
                    this.buf32[i] = 0xFF000000 | buffer[i];
                }
                this.ctx.putImageData(this.imageData, 0, 0);
            },
            onAudioSample: (left, right) => {
                if (this.isMuted) return;
                this.audioBuffer.push(left, right);
                if (this.audioBuffer.length >= 4096) this.playAudio();
            }
        });

        this.setupControls();
    }

    playAudio() {
        if (this.audioCtx.state === 'suspended') return;
        const buffer = this.audioCtx.createBuffer(2, 2048, 44100);
        const left = buffer.getChannelData(0);
        const right = buffer.getChannelData(1);
        for (let i = 0; i < 2048; i++) {
            left[i] = this.audioBuffer[i * 2];
            right[i] = this.audioBuffer[i * 2 + 1];
        }
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start();
        this.audioBuffer = [];
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audioBuffer = [];
        return this.isMuted;
    }

    loadRom(data) {
        this.canvas.style.background = 'black';
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        try {
            this.nes.loadROM(data);
            this.romLoaded = true;
            this.startInterval();
        } catch (e) {
            console.error("Core Load Error:", e);
        }
    }
    
    startInterval() {
        if(this.interval) clearInterval(this.interval);
        const rate = this.isFastForward ? this.fastFrameRate : this.baseFrameRate;
        this.interval = setInterval(() => {
            this.pollGamepads();
            this.nes.frame();
        }, rate);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        if (this.audioCtx) this.audioCtx.close();
        document.removeEventListener('keydown', this.boundKeyDown);
        document.removeEventListener('keyup', this.boundKeyUp);
        window.removeEventListener('gamepadconnected', this.boundGamepadConnect);
        window.removeEventListener('gamepaddisconnected', this.boundGamepadDisconnect);
        this.nes = null; 
    }
    
    setupControls() {
        document.addEventListener('keydown', this.boundKeyDown);
        document.addEventListener('keyup', this.boundKeyUp);
        window.addEventListener('gamepadconnected', this.boundGamepadConnect);
        window.addEventListener('gamepaddisconnected', this.boundGamepadDisconnect);
    }

    handleGamepadConnect(e) {
        this.hasGamepad = true;
        if (window.showZionMessage) window.showZionMessage(`DEVICE CONNECTED: ${e.gamepad.id.substring(0, 20).toUpperCase()}...`);
    }

    handleGamepadDisconnect(e) {
        if (window.showZionMessage) window.showZionMessage("DEVICE DISCONNECTED");
    }

    pollGamepads() {
        if (!navigator.getGamepads || !this.nes) return;
        const gamepads = navigator.getGamepads();
        const gp = gamepads[0];
        if (!gp) return;

        const AXIS_THRESHOLD = 0.5;
        
        // --- CONTROLLER HOTKEYS ---
        // R1 (Right Bumper) is usually Button 5
        const bumperR1 = gp.buttons[5]?.pressed;
        
        // Xbox A / PS Cross is usually Button 0
        const btnA = gp.buttons[0]?.pressed; 
        
        // Xbox X / PS Square is usually Button 2
        const btnX = gp.buttons[2]?.pressed; 

        // SAVE: Hold R1 + Press A
        if (bumperR1 && btnA) {
            if (!this.gamepadSaveLock) {
                this.gamepadSaveLock = true;
                this.quickSave();
            }
        } else {
            this.gamepadSaveLock = false;
        }

        // LOAD: Hold R1 + Press X
        if (bumperR1 && btnX) {
            if (!this.gamepadLoadLock) {
                this.gamepadLoadLock = true;
                this.quickLoad();
            }
        } else {
            this.gamepadLoadLock = false;
        }

        // --- STANDARD CONTROLS ---
        const currentState = {
            [jsnes.Controller.BUTTON_A]: btnA || gp.buttons[1]?.pressed, // Allow A or B
            [jsnes.Controller.BUTTON_B]: btnX || gp.buttons[3]?.pressed, // Allow X or Y
            [jsnes.Controller.BUTTON_SELECT]: gp.buttons[8]?.pressed,
            [jsnes.Controller.BUTTON_START]: gp.buttons[9]?.pressed,
            [jsnes.Controller.BUTTON_UP]: gp.buttons[12]?.pressed || gp.axes[1] < -AXIS_THRESHOLD,
            [jsnes.Controller.BUTTON_DOWN]: gp.buttons[13]?.pressed || gp.axes[1] > AXIS_THRESHOLD,
            [jsnes.Controller.BUTTON_LEFT]: gp.buttons[14]?.pressed || gp.axes[0] < -AXIS_THRESHOLD,
            [jsnes.Controller.BUTTON_RIGHT]: gp.buttons[15]?.pressed || gp.axes[0] > AXIS_THRESHOLD
        };

        // Fast Forward on Right Trigger (Button 7)
        const isFastFwdPressed = gp.buttons[7]?.pressed; 
        if (isFastFwdPressed && !this.isFastForward) {
            this.toggleFastForward(true);
        } else if (!isFastFwdPressed && this.isFastForward && !this.keyboardFastForward) {
            this.toggleFastForward(false);
        }

        Object.keys(currentState).forEach(key => {
            const btnId = parseInt(key);
            const isPressed = currentState[key];
            const wasPressed = this.gamepadState[key];
            if (isPressed && !wasPressed) this.nes.buttonDown(1, btnId);
            else if (!isPressed && wasPressed) this.nes.buttonUp(1, btnId);
        });
        this.gamepadState = currentState;
    }

    getButtonMapping(code) {
        switch(code) {
            case 'KeyW': case 'ArrowUp': return jsnes.Controller.BUTTON_UP;
            case 'KeyS': case 'ArrowDown': return jsnes.Controller.BUTTON_DOWN;
            case 'KeyA': case 'ArrowLeft': return jsnes.Controller.BUTTON_LEFT;
            case 'KeyD': case 'ArrowRight': return jsnes.Controller.BUTTON_RIGHT;
            case 'Space': case 'KeyX': return jsnes.Controller.BUTTON_A;
            case 'ShiftLeft': case 'KeyZ': return jsnes.Controller.BUTTON_B;
            case 'Backquote': case 'Enter': return jsnes.Controller.BUTTON_START;
            case 'Tab': case 'ShiftRight': return jsnes.Controller.BUTTON_SELECT;
            default: return undefined;
        }
    }

    handleKeyDown(e) {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        
        // Support Keyboard Quick Save/Load
        if (e.code === 'Digit1' || e.code === 'Numpad1') { this.quickSave(); return; }
        if (e.code === 'Digit4' || e.code === 'Numpad4') { this.quickLoad(); return; }
        
        if (e.code === 'KeyP') { 
            this.keyboardFastForward = true;
            this.toggleFastForward(true); 
        }

        const button = this.getButtonMapping(e.code);
        if (button !== undefined && this.nes) {
            e.preventDefault(); 
            this.nes.buttonDown(1, button);
        }
    }

    handleKeyUp(e) {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        if (e.code === 'KeyP') {
            this.keyboardFastForward = false;
            this.toggleFastForward(false); 
        }
        const button = this.getButtonMapping(e.code);
        if (button !== undefined && this.nes) this.nes.buttonUp(1, button);
    }
    
    toggleFastForward(active) {
        if (this.isFastForward === active) return;
        this.isFastForward = active;
        this.startInterval(); 
    }

    // --- SAVE / LOAD LOGIC ---

    setSlot(slotId) {
        this.currentSlot = parseInt(slotId) || 1;
        const key = `nes_save_slot_${this.currentSlot}`;
        const data = localStorage.getItem(key);
        
        // Special check for legacy data if slot is 1
        let status = data ? "DATA FOUND" : "EMPTY";
        if (!data && this.currentSlot === 1 && localStorage.getItem('nes_quick_save')) {
            status = "LEGACY DATA";
        }

        if (window.showZionMessage) window.showZionMessage(`SLOT ${this.currentSlot} [${status}]`);
    }

    quickSave() {
        if (!this.nes || !this.romLoaded) return;
        try {
            const state = this.nes.toJSON();
            const key = `nes_save_slot_${this.currentSlot}`;
            localStorage.setItem(key, JSON.stringify(state));
            if (window.showZionMessage) window.showZionMessage(`STATE SAVED [SLOT ${this.currentSlot}]`);
        } catch(err) {
            console.error("Save Error:", err);
            if (window.showZionMessage) window.showZionMessage("SAVE FAILED: ERROR");
        }
    }

    quickLoad() {
        if (!this.nes || !this.romLoaded) {
            if (window.showZionMessage) window.showZionMessage("ERROR: NO GAME LOADED");
            return;
        }
        try {
            const key = `nes_save_slot_${this.currentSlot}`;
            let json = localStorage.getItem(key);
            
            // LEGACY MIGRATION: If Slot 1 is missing, check for the old save file
            if (!json && this.currentSlot === 1) {
                json = localStorage.getItem('nes_quick_save');
                if (json && window.showZionMessage) window.showZionMessage("LOADING LEGACY SAVE...");
            }
            
            if (json) {
                this.nes.fromJSON(JSON.parse(json));
                if (window.showZionMessage) window.showZionMessage(`STATE RESTORED [SLOT ${this.currentSlot}]`);
            } else {
                if (window.showZionMessage) window.showZionMessage(`SLOT ${this.currentSlot} IS EMPTY`);
            }
        } catch(err) {
            console.error("Load Error:", err);
            if (window.showZionMessage) window.showZionMessage("LOAD FAILED: CORRUPT DATA");
        }
    }
}

// Global Message Utility
if (typeof window.showZionMessage !== 'function') {
    window.showZionMessage = function(msg) {
        const termInput = document.getElementById('terminal-cmd-input');
        if (termInput) {
            const originalPlaceholder = termInput.placeholder;
            termInput.placeholder = `>> ${msg}`;
            setTimeout(() => termInput.placeholder = originalPlaceholder, 3000);
        } else {
            console.log(`[SYSTEM]: ${msg}`);
        }
    };
}

window.activeNesInstance = null;

window.stopNesEmulator = function() {
    if (window.activeNesInstance) {
        window.activeNesInstance.stop();
        window.activeNesInstance = null;
        console.log("NES CORE SHUTDOWN.");
    }
};

window.MatrixNES = MatrixNES;

async function openNesEmulator() {
    const leftSidebar = document.getElementById('sidebar-left');
    if (leftSidebar) leftSidebar.style.left = '-230px';

    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const cmdInput = document.getElementById('terminal-cmd-input');
    
    if (cmdInput) cmdInput.blur();
    if (!modal || !output) return;
    
    modal.classList.remove('hidden');
    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }

    // --- LIBRARY ---
    const ROM_FILES = [
        "AlwasAwakening_demo.nes", 
    ];
    
    // --- UPDATED HTML INJECTION ---
    output.innerHTML = `
        <div class="nes-terminal-wrapper">
            <p style="color:var(--theme-color); font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;">[ NES_MAINFRAME ]</p>
            
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <select id="rom-dropdown" class="nes-model-selector" style="flex-grow:1; margin-right:10px;">
                    <option value="" disabled selected>> SELECT CARTRIDGE...</option>
                </select>
                <select id="nes-slot-select" class="nes-model-selector" style="width: auto; min-width: 100px;">
                    <option value="1" selected>SLOT 1</option>
                    <option value="2">SLOT 2</option>
                    <option value="3">SLOT 3</option>
                    <option value="4">SLOT 4</option>
                    <option value="5">SLOT 5</option>
                </select>
            </div>
            
            <div id="nes-container" class="nes-screen-container">
                <button id="nes-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center;">&#9974;</button>
                <canvas id="nes-screen" width="256" height="240" style="background: black url('Emulators/nes/cover.jpg') no-repeat center center; background-size: cover;"></canvas>
                <button id="nes-mute-btn" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center;">&#128266;</button>
            </div>

            <div style="display: block; width: 100%; box-sizing: border-box; margin: 5px auto 0 auto; font-size:0.65rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.5;"><span style="color:#fff;">CONTROLS:</span> WASD = MOVE<br>A-BTN = <span style="color:#fff;">SPACE/X</span> | B-BTN = <span style="color:#fff;">L-SHIFT/Z</span> | SELECT = <span style="color:#fff;">TAB/R-SHIFT</span> | START = <span style="color:#fff;">ENTER/\`</span><br><span style="color:#aaa;">[1] QUICK SAVE | [4] QUICK LOAD | [HOLD P] FAST FWD</span><br><span style="color:#0f0;">[GAMEPAD: HOLD R1 + A (SAVE) | HOLD R1 + X (LOAD)]</span></div>
        </div>`;

    await loadScript("Emulators/nes/jsnes.min.js");
    
    window.activeNesInstance = new window.MatrixNES('nes-screen');
    const dropdown = document.getElementById('rom-dropdown');
    const slotSelect = document.getElementById('nes-slot-select');
    const muteBtn = document.getElementById('nes-mute-btn');
    const fullBtn = document.getElementById('nes-fullscreen-btn');
    const container = document.getElementById('nes-container');

    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.activeNesInstance && window.activeNesInstance.toggleMute) {
            const isMuted = window.activeNesInstance.toggleMute();
            muteBtn.innerHTML = isMuted ? '&#128263;' : '&#128266;';
        }
        muteBtn.blur();
    });

    fullBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
        fullBtn.blur();
    });

    slotSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        if (window.activeNesInstance) {
            window.activeNesInstance.setSlot(e.target.value);
        }
        slotSelect.blur();
        if (cmdInput) cmdInput.blur();
    });

    ['mousedown', 'click', 'focus'].forEach(event => {
        dropdown.addEventListener(event, (e) => e.stopPropagation());
        slotSelect.addEventListener(event, (e) => e.stopPropagation());
    });

    document.getElementById('nes-screen').addEventListener('click', (e) => {
        e.stopPropagation();
        if (cmdInput) cmdInput.blur();
    });

    ROM_FILES.forEach(romName => {
        const opt = document.createElement('option');
        opt.value = romName;
        opt.textContent = romName.replace('.nes', '').replace(/_/g, ' ').toUpperCase();
        dropdown.appendChild(opt);
    });

    dropdown.onchange = async () => {
        const romName = dropdown.value;
        dropdown.blur(); 
        if (cmdInput) cmdInput.blur(); 

        try {
            const res = await fetch(chrome.runtime.getURL(`Emulators/nes/roms/${romName}`));
            const blob = await res.blob();
            const reader = new FileReader();
            reader.onload = (e) => window.activeNesInstance.loadRom(e.target.result);
            reader.readAsBinaryString(blob);
            
            container.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => window.focus(), 100);
        } catch(e) {
            console.error("ROM Load Error:", e);
            if (window.showZionMessage) window.showZionMessage("CARTRIDGE LOAD ERROR: " + romName);
        }
    };
}

window.openNesEmulator = openNesEmulator;