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
        "Action Fighter (USA) (Rev-A).sms",
        "Addams Family, The (Europe).sms",
        "Aerial Assault (USA).sms",
        "After Burner (USA).sms",
        "Air Rescue (Europe).sms",
        "Alex Kidd - High-Tech World (USA).sms",
        "Alex Kidd - The Lost Stars (USA).sms",
        "Alex Kidd in Miracle World (USA) (Rev-A).sms",
        "Alex Kidd in Miracle World 2 (Alex Kidd in Miracle World modification) (2.0).sms",
        "Alex Kidd in Shinobi World (USA).sms",
        "Alien 3 (Europe).sms",
        "Alien Storm (Europe).sms",
        "Alien Syndrome (USA).sms",
        "Altered Beast (USA).sms",
        "Arcade Smash Hits (Europe).sms",
        "Assault City (USA).sms",
        "Asterix (Europe) (Rev-A).sms",
        "Asterix and the Great Rescue (Europe).sms",
        "Asterix and the Secret Mission (Europe).sms",
        "Astro Warrior (USA).sms",
        "Ayrton Senna's Super Monaco GP II (Europe).sms",
        "Aztec Adventure (USA).sms",
        "Baku Baku Animal (Brazil).sms",
        "Bank Panic (Europe).sms",
        "Batman Returns (Europe).sms",
        "Battle OutRun (Europe).sms",
        "Battletoads in Battlemaniacs (Brazil).sms",
        "Black Belt (USA).sms",
        "Blade Eagle 3-D (USA).sms",
        "Bomber Raid (USA).sms",
        "Bonanza Bros. (Europe).sms",
        "Bruce Lee (USA) (Unl).sms",
        "Bubble Bobble (Europe).sms",
        "Buggy Run (Europe).sms",
        "California Games (USA).sms",
        "California Games II (Europe).sms",
        "Captain Silver (USA).sms",
        "Castle of Illusion Starring Mickey Mouse (USA) (Rev-A).sms",
        "Chase H.Q. (Europe).sms",
        "Cheese Cat-Astrophe Starring Speedy Gonzales (Europe).sms",
        "Choplifter (USA).sms",
        "Chuck Rock (Europe).sms",
        "Chuck Rock II - Son of Chuck (Europe).sms",
        "Cloud Master (USA).sms",
        "Columns (USA).sms",
        "Cool Spot (Europe).sms",
        "Cosmic Spacehead (Europe).sms",
        "Cyber Shinobi, The (Europe).sms",
        "Cyborg Hunter (USA).sms",
        "Daffy Duck in Hollywood (Europe).sms",
        "Danan - The Jungle Fighter (Europe).sms",
        "DARC (USA) (Unl).sms",
        "Deep Duck Trouble Starring Donald Duck (Europe).sms",
        "Desert Speedtrap Starring Road Runner and Wile E. Coyote (Europe).sms",
        "Desert Strike - Return to the Gulf (Europe).sms",
        "Disney's Aladdin (Europe).sms",
        "Disney's Ariel the Little Mermaid (Brazil).sms",
        "Disney's Bonkers Wax Up! (Brazil).sms",
        "Disney's The Jungle Book (Europe).sms",
        "Double Dragon (USA).sms",
        "Double Hawk (Europe).sms",
        "Dr. Robotnik's Mean Bean Machine (Europe).sms",
        "Dragon Crystal (Europe).sms",
        "Dynamite Duke (Europe).sms",
        "Dynamite Dux (Europe).sms",
        "Dynamite Headdy (Brazil).sms",
        "Earthworm Jim (Brazil).sms",
        "Ecco - The Tides of Time (Brazil).sms",
        "Ecco the Dolphin (Europe).sms",
        "Enduro Racer (USA).sms",
        "ESWAT (USA) (Rev-A).sms",
        "Excellent Dizzy Collection, The (Europe) (Beta).sms",
        "F1 (Europe).sms",
        "Fantastic Dizzy (Europe).sms",
        "Fantasy Zone (USA) (Rev-A).sms",
        "Fantasy Zone - The Maze (USA).sms",
        "Fantasy Zone II - The Tears of Opa-Opa (USA).sms",
        "Fire & Forget II (Europe).sms",
        "Flash, The (Europe).sms",
        "Flight of Pigarus (USA) (Unl) (1.11).sms",
        "Forgotten Worlds (Europe).sms",
        "G-LOC - Air Battle (Europe).sms",
        "Gain Ground (Europe).sms",
        "Galactic Protector (Japan).sms",
        "Galactic Revenge (USA) (Unl) (3.0).sms",
        "Galaxy Force (USA).sms",
        "Gangster Town (USA).sms",
        "Gauntlet (Europe).sms",
        "Ghost House (USA).sms",
        "Ghostbusters (USA).sms",
        "Ghouls 'n Ghosts (USA).sms",
        "Global Defense (USA).sms",
        "Golden Axe (USA).sms",
        "Golden Axe Warrior (USA).sms",
        "Golfamania (Europe).sms",
        "Golvellius - Valley of Doom (USA).sms",
        "GP Rider (Europe).sms",
        "Great Baseball (USA).sms",
        "Great Soccer (USA).sms",
        "Hang-On (USA) (BIOS 3.4).sms",
        "Hook (Europe) (Beta).sms",
        "Incredible Hulk, The (Europe).sms",
        "Indiana Jones and the Last Crusade - The Action Game (Europe).sms",
        "James ''Buster'' Douglas Knockout Boxing (USA).sms",
        "James Bond 007 - The Duel (Europe).sms",
        "James Pond II - Codename RoboCod (Europe).sms",
        "Joe Montana Football (USA).sms",
        "Jurassic Park (Europe).sms",
        "Kenseiden (USA).sms",
        "King's Quest - Quest for the Crown (USA).sms",
        "Klax (Europe).sms",
        "Kung Fu Kid (USA).sms",
        "Land of Illusion Starring Mickey Mouse (Europe).sms",
        "Legend of Illusion Starring Mickey Mouse (Brazil).sms",
        "Lemmings (Europe).sms",
        "Lemmings 2 - The Tribes (Europe) (Beta).sms",
        "Line of Fire (Europe).sms",
        "Lion King, The (Europe).sms",
        "Lord of the Sword (USA).sms",
        "Lucky Dime Caper Starring Donald Duck, The (Europe).sms",
        "Marble Madness (Europe).sms",
        "Master of Darkness (Europe).sms",
        "Masters of Combat (Europe).sms",
        "Maze Hunter 3-D (USA).sms",
        "Megumi Rescue (Japan).sms",
        "Mercs (Europe).sms",
        "Michael Jackson's Moonwalker (USA).sms",
        "Mickey's Ultimate Challenge (Brazil).sms",
        "Micro Machines (Europe).sms",
        "Miracle Warriors - Seal of the Dark Lord (USA).sms",
        "Missile Defense 3-D (USA).sms",
        "Monopoly (USA).sms",
        "Montezuma's Revenge Featuring Panama Joe (USA).sms",
        "Mortal Kombat (Europe).sms",
        "Mortal Kombat 3 (Brazil).sms",
        "Mortal Kombat II (Europe).sms",
        "Ms. Pac-Man (Europe).sms",
        "My Hero (USA).sms",
        "NBA Jam (Europe) (Beta).sms",
        "New Zealand Story, The (Europe).sms",
        "Ninja Gaiden (Europe).sms",
        "Ninja, The (USA).sms",
        "Olympic Gold - Barcelona '92 (Europe).sms",
        "Operation Wolf (Europe).sms",
        "OutRun (USA).sms",
        "OutRun 3-D (Europe).sms",
        "OutRun Europa (Europe).sms",
        "Pac-Mania (Europe).sms",
        "Paperboy (USA).sms",
        "Penguin Land (USA).sms",
        "Phantasy Star (USA) (Rev-A).sms",
        "Phantasy Star - Retranslation (Phantasy Star modification) (1.02).sms",
        "Pit Pot (Japan).sms",
        "Platform Explorer (USA) (Unl) (3.0).sms",
        "Populous (Europe).sms",
        "Poseidon Wars 3-D (USA).sms",
        "Positorb (USA) (Unl).sms",
        "Power Strike (USA).sms",
        "Power Strike II (Europe).sms",
        "Predator 2 (Europe).sms",
        "Prince of Persia (Europe).sms",
        "Prisonnier II (USA) (Unl).sms",
        "Pro Wrestling (USA).sms",
        "Psychic World (Europe).sms",
        "Psycho Fox (USA).sms",
        "Putt & Putter (Europe).sms",
        "Quartet (USA).sms",
        "Quest for the Shaven Yak Starring Ren & Stimpy (Brazil).sms",
        "R-Type (USA).sms",
        "R.C. Grand Prix (USA).sms",
        "Rainbow Islands (Europe).sms",
        "Rambo - First Blood Part II (USA).sms",
        "Rambo III (USA).sms",
        "Rampage (USA).sms",
        "Rampart (Europe).sms",
        "Rastan (USA).sms",
        "Renegade (Europe).sms",
        "Rescue Mission (USA).sms",
        "Road Rash (Europe).sms",
        "RoboCop versus The Terminator (Europe).sms",
        "Sagaia (Europe).sms",
        "Satellite 7 (Japan).sms",
        "Scramble Spirits (Europe).sms",
        "Sega Chess (Europe).sms",
        "Sensible Soccer - European Champions (Europe).sms",
        "Shadow Dancer - The Secret of Shinobi (Europe).sms",
        "Shadow of the Beast (Europe).sms",
        "Shanghai (USA).sms",
        "Shinobi (USA) (Rev-A).sms",
        "Shooting Gallery (USA).sms",
        "Silver Valley (USA) (Unl).sms",
        "Slap Shot (USA).sms",
        "Smurfs, The (Europe).sms",
        "Snail Maze (USA).sms",
        "Sonic Blast (Brazil).sms",
        "Sonic Chaos (Europe).sms",
        "Sonic Spinball (Europe).sms",
        "Sonic the Hedgehog (USA).sms",
        "Sonic the Hedgehog 2 (Europe) (Rev-A).sms",
        "Sonic the Hedgehog Frenzy (Sonic the Hedgehog 2 modification) (10-17-20).sms",
        "Space Gun (Europe).sms",
        "Space Harrier (USA).sms",
        "Space Harrier 3-D (USA).sms",
        "Special Criminal Investigation (Europe).sms",
        "SpellCaster (USA).sms",
        "Spider-Man vs. The Kingpin (USA).sms",
        "Spy vs. Spy (USA).sms",
        "Star Wars (Europe).sms",
        "Street Fighter II' (Brazil).sms",
        "Streets of Rage (Europe).sms",
        "Streets of Rage 2 (Europe).sms",
        "Strider (USA).sms",
        "Strider II (Europe).sms",
        "Submarine Attack (Europe).sms",
        "Super Monaco GP (USA).sms",
        "Super Off Road (Europe).sms",
        "Super Space Invaders (Europe).sms",
        "Super Tennis (USA).sms",
        "T2 - The Arcade Game (Europe).sms",
        "Taz-Mania (Europe).sms",
        "Tecmo World Cup '93 (Europe).sms",
        "Teddy Boy (USA).sms",
        "Terminator 2 - Judgment Day (Europe).sms",
        "Terminator, The (Europe).sms",
        "Thunder Blade (USA).sms",
        "Time Soldiers (USA).sms",
        "Tom and Jerry - The Movie (Europe).sms",
        "TransBot (USA).sms",
        "Ultima IV - Quest of the Avatar (Europe).sms",
        "Ultimate Soccer (Europe).sms",
        "Vigilante (USA).sms",
        "Virtua Fighter Animation (Brazil).sms",
        "Voyage - A Sorceress' Vacation (Alex Kidd in Miracle World modification) (1.02 Build 693).sms",
        "Waimanu - Scary Monsters Saga (USA) (Unl).sms",
        "Wanted (USA).sms",
        "Weka Invaders (USA) (Unl).sms",
        "Where in the World Is Carmen Sandiego (USA).sms",
        "Wimbledon (Europe).sms",
        "Wimbledon II (Europe).sms",
        "Wing Warriors (USA) (Unl).sms",
        "Winter Olympic Games - Lillehammer '94 (Europe).sms",
        "Wonder Boy (USA) (Rev-A).sms",
        "Wonder Boy III - The Dragon's Trap (USA).sms",
        "Wonder Boy in Monster Land (USA).sms",
        "Wonder Boy in Monster World (Europe).sms",
        "Woody Pop (Japan).sms",
        "World Class Leaderboard Golf (Europe).sms",
        "World Cup USA 94 (Europe).sms",
        "World Grand Prix (USA).sms",
        "WWF WrestleMania Steel Cage Challenge (Europe).sms",
        "X-Men - Mojo World (Brazil).sms",
        "Xenon 2 - Megablast (Europe) (Rev-A).sms",
        "Ys - The Vanished Omens (USA).sms",
        "Zaxxon 3-D (USA).sms",
        "Zillion (USA) (Rev-A).sms",
        "Zillion II - The Tri Formation (USA).sms",
        "Zool - Ninja of the ''Nth'' Dimension (Europe).sms"
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