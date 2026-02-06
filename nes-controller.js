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

        // Controller State
        this.gamepadState = {}; 
        this.hasGamepad = false;

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
        // Clear the placeholder background when ROM loads so it doesn't show through
        this.canvas.style.background = 'black';
        
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        this.nes.loadROM(data);
        this.startInterval();
    }
    
    startInterval() {
        if(this.interval) clearInterval(this.interval);
        const rate = this.isFastForward ? this.fastFrameRate : this.baseFrameRate;
        // Updated loop to poll gamepads before processing the frame
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

    // New method to poll Gamepad API
    pollGamepads() {
        if (!navigator.getGamepads) return;
        
        const gamepads = navigator.getGamepads();
        const gp = gamepads[0]; // Player 1

        if (!gp) return;

        // Threshold for analog sticks
        const AXIS_THRESHOLD = 0.5;

        // Map Gamepad buttons to NES buttons
        // Logic: Checks physical buttons and Axis directions
        const currentState = {
            [jsnes.Controller.BUTTON_A]: gp.buttons[0].pressed || gp.buttons[1].pressed,     // A/Cross or B/Circle
            [jsnes.Controller.BUTTON_B]: gp.buttons[2].pressed || gp.buttons[3].pressed,     // X/Square or Y/Triangle
            [jsnes.Controller.BUTTON_SELECT]: gp.buttons[8].pressed,                         // Share/Back
            [jsnes.Controller.BUTTON_START]: gp.buttons[9].pressed,                          // Options/Start
            [jsnes.Controller.BUTTON_UP]: gp.buttons[12].pressed || gp.axes[1] < -AXIS_THRESHOLD,
            [jsnes.Controller.BUTTON_DOWN]: gp.buttons[13].pressed || gp.axes[1] > AXIS_THRESHOLD,
            [jsnes.Controller.BUTTON_LEFT]: gp.buttons[14].pressed || gp.axes[0] < -AXIS_THRESHOLD,
            [jsnes.Controller.BUTTON_RIGHT]: gp.buttons[15].pressed || gp.axes[0] > AXIS_THRESHOLD
        };

        // Hotkey: Fast Forward on R1 (Button 5) or Right Trigger (Button 7)
        const isFastFwdPressed = gp.buttons[5]?.pressed || gp.buttons[7]?.pressed;
        if (isFastFwdPressed && !this.isFastForward) {
            this.toggleFastForward(true);
        } else if (!isFastFwdPressed && this.isFastForward && !this.keyboardFastForward) {
            // Only release fast forward if keyboard isn't holding it
            this.toggleFastForward(false);
        }

        // Apply Input State to Emulator
        Object.keys(currentState).forEach(key => {
            const btnId = parseInt(key);
            const isPressed = currentState[key];
            const wasPressed = this.gamepadState[key];

            if (isPressed && !wasPressed) {
                this.nes.buttonDown(1, btnId);
            } else if (!isPressed && wasPressed) {
                this.nes.buttonUp(1, btnId);
            }
        });

        this.gamepadState = currentState;
    }

    getButtonMapping(code) {
        switch(code) {
            case 'KeyW': return jsnes.Controller.BUTTON_UP;
            case 'KeyS': return jsnes.Controller.BUTTON_DOWN;
            case 'KeyA': return jsnes.Controller.BUTTON_LEFT;
            case 'KeyD': return jsnes.Controller.BUTTON_RIGHT;
            
            case 'ArrowUp': return jsnes.Controller.BUTTON_UP;
            case 'ArrowDown': return jsnes.Controller.BUTTON_DOWN;
            case 'ArrowLeft': return jsnes.Controller.BUTTON_LEFT;
            case 'ArrowRight': return jsnes.Controller.BUTTON_RIGHT;

            case 'Space': return jsnes.Controller.BUTTON_A;
            case 'KeyX': return jsnes.Controller.BUTTON_A;

            case 'ShiftLeft': return jsnes.Controller.BUTTON_B;
            case 'KeyZ': return jsnes.Controller.BUTTON_B;

            case 'Backquote': return jsnes.Controller.BUTTON_START;
            case 'Enter': return jsnes.Controller.BUTTON_START;

            case 'Tab': return jsnes.Controller.BUTTON_SELECT;
            case 'ShiftRight': return jsnes.Controller.BUTTON_SELECT;

            default: return undefined;
        }
    }

    handleKeyDown(e) {
        if (document.activeElement && 
           (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

        if (e.code === 'Digit1') { 
            this.quickSave(); 
            return; 
        }
        if (e.code === 'Digit4') { 
            this.quickLoad(); 
            return; 
        }
        if (e.code === 'KeyP') { 
            this.keyboardFastForward = true; // Flag to prevent controller from canceling keyboard FF
            this.toggleFastForward(true); 
        }

        const button = this.getButtonMapping(e.code);
        if (button !== undefined) {
            e.preventDefault(); 
            this.nes.buttonDown(1, button);
        }
    }

    handleKeyUp(e) {
        if (document.activeElement && 
           (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

        if (e.code === 'KeyP') {
            this.keyboardFastForward = false;
            this.toggleFastForward(false); 
        }

        const button = this.getButtonMapping(e.code);
        if (button !== undefined) {
            this.nes.buttonUp(1, button);
        }
    }
    
    toggleFastForward(active) {
        if (this.isFastForward === active) return;
        this.isFastForward = active;
        this.startInterval(); 
    }

    quickSave() {
        try {
            const state = this.nes.toJSON();
            localStorage.setItem('nes_quick_save', JSON.stringify(state));
            if (window.showZionMessage) window.showZionMessage("STATE SAVED TO MEMORY [SLOT 1]");
        } catch(err) {
            console.error(err);
        }
    }

    quickLoad() {
        try {
            const json = localStorage.getItem('nes_quick_save');
            if (json) {
                this.nes.fromJSON(JSON.parse(json));
                if (window.showZionMessage) window.showZionMessage("STATE LOADED FROM MEMORY [SLOT 1]");
            } else {
                if (window.showZionMessage) window.showZionMessage("NO SAVE DATA FOUND");
            }
        } catch(err) {
            console.error(err);
        }
    }
}

// FIX: Check if function exists before declaring to prevent "Identifier already declared" error
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

    // --- FULL LIBRARY INJECTED ---
    const ROM_FILES = [
        "10-Yard Fight (U).nes",
        "1943 (U).nes",
        "3-D Battles of World Runner, The (U).nes",
        "720 (U).nes",
        "8 Eyes (U).nes",
        "Abadox (U).nes",
        "Action 52 (U) [!].nes",
        "AD&D Dragon Strike (U) [a1].nes",
        "AD&D Dragon Strike (U).nes",
        "AD&D Heroes of the Lance (U).nes",
        "AD&D Hillsfar (U) [!].nes",
        "AD&D Pool of Radiance (U).nes",
        "Addams Family - Pugsley's Scavenger Hunt, The (U).nes",
        "Addams Family, The (U).nes",
        "Adventures in the Magic Kingdom (U) [a1].nes",
        "Adventures in the Magic Kingdom (U).nes",
        "Adventures of Bayou Billy, The (U).nes",
        "Adventures of Captain Comic, The (U).nes",
        "Adventures of Dino Riki (U).nes",
        "Adventures of Lolo (U) [!].nes",
        "Adventures of Lolo 2 (U).nes",
        "Adventures of Lolo 3 (U).nes",
        "Adventures of Rad Gravity, The (U).nes",
        "Adventures of Rocky and Bullwinkle and Friends, The (U).nes",
        "Adventures of Tom Sawyer (U).nes",
        "After Burner (U).nes",
        "Air Fortress (U).nes",
        "Airwolf (U).nes",
        "Al Unser Jr Turbo Racing (U) [a1].nes",
        "Al Unser Jr Turbo Racing (U) [a2].nes",
        "Al Unser Jr Turbo Racing (U).nes",
        "Alfred Chicken (U).nes",
        "Alien 3 (U).nes",
        "Alien Syndrome (U).nes",
        "All-Pro Basketball (U).nes",
        "Alpha Mission (U).nes",
        "Amagon (U) [a1].nes",
        "Amagon (U) [a2].nes",
        "Amagon (U).nes",
        "American Gladiators (U).nes",
        "Anticipation (U).nes",
        "Arch Rivals (U).nes",
        "Archon (U).nes",
        "Arkanoid (U).nes",
        "Arkista's Ring (U) [!].nes",
        "Astyanax (U) (Prototype).nes",
        "Astyanax (U).nes",
        "Athena (U) [a1].nes",
        "Athena (U).nes",
        "Athletic World (U).nes",
        "Attack of the Killer Tomatoes (U).nes",
        "Baby Boomer (U).nes",
        "Back to the Future (U).nes",
        "Back to the Future 2 & 3 (U).nes",
        "Bad Dudes (U).nes",
        "Bad News Baseball (U).nes",
        "Bad Street Brawler (U).nes",
        "Bandai Golf - Challenge Pebble Beach (U).nes",
        "Bandit Kings of Ancient China (U) [a1].nes",
        "Bandit Kings of Ancient China (U).nes",
        "Barbie (U) (Rev 3).nes",
        "Barbie (U) (Rev X).nes",
        "Bard's Tale - Tales of the Unknown, The (U) [!].nes",
        "Barker Bill's Trick Shooting (U).nes",
        "Base Wars (U) [a1].nes",
        "Base Wars (U).nes",
        "Baseball Simulator 1.000 (U).nes",
        "Baseball Stars (U).nes",
        "Baseball Stars 2 (U).nes",
        "Bases Loaded (U).nes",
        "Bases Loaded 2 (U).nes",
        "Bases Loaded 3 (U).nes",
        "Bases Loaded 4 (U).nes",
        "Batman (U) (Prototype).nes",
        "Batman (U).nes",
        "Batman - Return of the Joker (U).nes",
        "Batman Returns (U).nes",
        "Battle Chess (U).nes",
        "Battle of Olympus, The (U).nes",
        "Battle Tank (U).nes",
        "Battleship (U).nes",
        "Battletoads (U).nes",
        "Battletoads Double Dragon (U).nes",
        "Bee 52 (U).nes",
        "Beetlejuice (U) [!].nes",
        "Best of the Best Championship Karate (U).nes",
        "Bible Adventures (U) (V1.2).nes",
        "Bible Adventures (U) (V1.3).nes",
        "Bible Buffet (U) (Ver 6.0).nes",
        "Big Bird's Hide and Speak (U).nes",
        "Big Nose Freaks Out (Aladdin) (U).nes",
        "Big Nose Freaks Out (U).nes",
        "Big Nose the Caveman (U).nes",
        "Bigfoot (U).nes",
        "Bill & Ted's Excellent Video Game Adventure (U).nes",
        "Bill Elliott's NASCAR Challenge (U).nes",
        "Bionic Commando (U).nes",
        "Black Bass USA, The (U).nes",
        "Blackjack (U).nes",
        "Blades of Steel (U).nes",
        "Blaster Master (U) (Prototype).nes",
        "Blaster Master (U).nes",
        "Blue Marlin, The (U).nes",
        "Blues Brothers, The (U).nes",
        "Bo Jackson Baseball (U).nes",
        "Bomberman (U).nes",
        "Bomberman 2 (U).nes",
        "Bonk's Adventure (U).nes",
        "Boulder Dash (U).nes",
        "Boy and His Blob - Trouble on Blobolonia, A (U).nes",
        "Bram Stoker's Dracula (U).nes",
        "Break Time (U).nes",
        "Breakthru (U).nes",
        "Bubble Bobble (U).nes",
        "Bubble Bobble Part 2 (U).nes",
        "Bucky O'Hare (U) [!].nes",
        "Bugs Bunny Birthday Bash (Prototype) (U).nes",
        "Bugs Bunny Birthday Blowout, The (U).nes",
        "Bugs Bunny Crazy Castle, The (U).nes",
        "Bugs Bunny Fun House (Prototype) (U).nes",
        "Bump'n'Jump (U).nes",
        "Burai Fighter (U).nes",
        "Burger Time (U) [!].nes",
        "Cabal (U) [a1].nes",
        "Cabal (U).nes",
        "Caesar's Palace (U).nes",
        "California Games (U) [a1].nes",
        "California Games (U).nes",
        "Caltron 6-in-1 (U).nes",
        "Captain America and the Avengers (U).nes",
        "Captain Planet and the Planeteers (U).nes",
        "Captain SkyHawk (U).nes",
        "Casino Kid (U).nes",
        "Casino Kid 2 (U).nes",
        "Castelian (U).nes",
        "Castle of Deceit (U).nes",
        "Castle of Dragon (U).nes",
        "Castlequest (U).nes",
        "Castlevania (U) (PRG 0).nes",
        "Castlevania (U) (PRG 1).nes",
        "Castlevania 2 - Simon's Quest (U).nes",
        "Castlevania 3 - Dracula's Curse (U).nes",
        "Caveman Games (U).nes",
        "Challenge of the Dragon (U).nes",
        "Championship Bowling (U) [!].nes",
        "Championship Pool (U).nes",
        "Cheetahmen 2 (U).nes",
        "Chessmaster, The (U).nes",
        "Chiller (U) [!].nes",
        "Chip 'n Dale Rescue Rangers (U) [!].nes",
        "Chip 'n Dale Rescue Rangers 2 (U).nes",
        "Chubby Cherub (U).nes",
        "Circus Caper (U).nes",
        "Circus Charlie.nes",
        "CIRCUS.NES",
        "City Connection (U).nes",
        "Clash At Demonhead (U) [a1].nes",
        "Clash At Demonhead (U).nes",
        "Classic Concentration (U).nes",
        "Cliffhanger (U).nes",
        "Cobra Command (U).nes",
        "Cobra Triangle (U).nes",
        "Code Name Viper (U).nes",
        "Color A Dinosaur (U).nes",
        "Commando (U).nes",
        "Conan (U).nes",
        "Conflict (U) [!].nes",
        "Conquest of the Crystal Palace (U).nes",
        "Contra (U).nes",
        "Contra Force (U).nes",
        "Cool World (U).nes",
        "Cowboy Kid (U).nes",
        "Crash'n The Boys Street Challenge (U).nes",
        "Crystal Mines (U).nes",
        "Crystalis (Prototype) (U) [a1].nes",
        "Crystalis (Prototype) (U).nes",
        "Crystalis (U) [a1].nes",
        "Crystalis (U) [a2].nes",
        "Crystalis (U).nes",
        "Cyberball (U).nes",
        "Cybernoid - The Fighting Machine (U).nes",
        "Dance Aerobics (U).nes",
        "Danny Sullivan's Indy Heat (U).nes",
        "Darkman (U).nes",
        "Darkwing Duck (U) (Prototype).nes",
        "Darkwing Duck (U).nes",
        "Dash Galaxy in the Alien Asylum (U).nes",
        "Day Dreamin' Davey (U).nes",
        "Days of Thunder (U).nes",
        "Deadly Towers (U).nes",
        "Death Race (U).nes",
        "Deathbots (U) [a1].nes",
        "Deathbots (U).nes",
        "Defender 2 (U).nes",
        "Defender of the Crown (U).nes",
        "Defenders of Dynatron City (U).nes",
        "Deja Vu (U).nes",
        "Demon Sword (U).nes",
        "Desert Commander (U).nes",
        "Destination Earthstar (U).nes",
        "Destiny of an Emperor (U).nes",
        "Dick Tracy (U).nes",
        "Die Hard (U).nes",
        "Dig Dug II (U) [!].nes",
        "Digger - The Legend of the Lost City (U).nes",
        "Dirty Harry (U).nes",
        "Dizzy The Adventurer (Aladdin) (U).nes",
        "Donkey Kong Classics (U).nes",
        "Donkey Kong Jr. Math (U).nes",
        "Double Dare (U).nes",
        "Double Dragon (U).nes",
        "Double Dragon 2 - The Revenge (U).nes",
        "Double Dragon 3 - The Sacred Stones (U).nes",
        "Double Dribble (U) (PRG 0).nes",
        "Double Dribble (U) (PRG 1) [!].nes",
        "Double Strike (U) (V1.0).nes",
        "Double Strike (U) (V1.1).nes",
        "Dr Chaos (U).nes",
        "Dr Jekyll and Mr Hyde (U).nes",
        "Drac's Night Out (Prototype) (U) [!].nes",
        "Dragon Fighter (U).nes",
        "Dragon Power (U).nes",
        "Dragon Spirit - The New Legend (U).nes",
        "Dragon Warrior (U) (PRG 0).nes",
        "Dragon Warrior (U) (PRG 1).nes",
        "Dragon Warrior 2 (U).nes",
        "Dragon Warrior 3 (U).nes",
        "Dragon Warrior 4 (U).nes",
        "Dragon's Lair (U).nes",
        "Duck Tales (U) (Prototype).nes",
        "Duck Tales (U).nes",
        "Duck Tales 2 (U).nes",
        "Dudes With Attitude (U).nes",
        "Dungeon Magic - Sword of the Elements (U).nes",
        "Dusty Diamond's All-Star Softball (U).nes",
        "Dynowarz - Destruction of Spondylus (U).nes",
        "Earth Bound (Prototype) (U).nes",
        "Earth Bound Zero (Neo Demiforce v1.01 Hack-1) (U).nes",
        "Earth Bound Zero (Neo Demiforce v1.01 Hack-2) (U).nes",
        "Elevator Action (U).nes",
        "Eliminator Boat Duel (U).nes",
        "Evert & Lendl Top Player's Tennis (U).nes",
        "Exodus (U) (V4.0) [!].nes",
        "F-117a Stealth Fighter (U) [!].nes",
        "F-15 City War (U) [a1].nes",
        "F-15 City War (U).nes",
        "F-15 Strike Eagle (U).nes",
        "Family Feud (U).nes",
        "Fantastic Adventures of Dizzy, The (1993 Version) (U).nes",
        "Fantastic Adventures of Dizzy, The (U).nes",
        "Fantasy Zone (U).nes",
        "Faria (U).nes",
        "Faxanadu (U).nes",
        "Felix the Cat (U).nes",
        "Ferrari - Grand Prix Challenge (U) [!].nes",
        "Fester's Quest (U) (Prototype).nes",
        "Fester's Quest (U).nes",
        "Final Fantasy (U) [a1].nes",
        "Final Fantasy (U).nes",
        "Fire 'n Ice (U).nes",
        "Fire Hawk (U) [a1].nes",
        "Fire Hawk (U).nes",
        "Firehouse Rescue (U).nes",
        "Fist of the North Star (U).nes",
        "Flight of the Intruder (U).nes",
        "Flintstones - The Rescue of Dino & Hoppy, The (U).nes",
        "Flintstones 2 - The Surprise at Dinosaur Peak!, The (U).nes",
        "Flying Dragon - The Secret Scroll (U).nes",
        "Flying Warriors (U).nes",
        "Formula One Built To Win (U) [!].nes",
        "Frankenstein - The Monster Returns (U).nes",
        "Free Fall (U) (Prototype) [!].nes",
        "Freedom Force (U) [!].nes",
        "Friday the 13th (U).nes",
        "Fun House (U).nes",
        "Galactic Crusader (Sachen) (U).nes",
        "Galaga (U).nes",
        "Galaxy 5000 (U).nes",
        "Gargoyle's Quest 2 - The Demon Darkness (U).nes",
        "Gauntlet (U).nes",
        "Gauntlet 2 (U).nes",
        "Gemfire (U).nes",
        "Genghis Khan (U).nes",
        "George Foreman's KO Boxing (U).nes",
        "Ghostbusters (U).nes",
        "Ghostbusters 2 (U).nes",
        "Ghosts'n Goblins (U).nes",
        "Ghoul School (U).nes",
        "GI Joe (U).nes",
        "GI Joe - The Atlantis Factor (U).nes",
        "Gilligan's Island (U).nes",
        "Goal! (U).nes",
        "Goal! Two (U).nes",
        "Godzilla - Monster of Monsters! (U).nes",
        "Godzilla 2 - War of the Monsters (U).nes",
        "Gold Medal Challenge '92 (U).nes",
        "Golf Grand Slam (U).nes",
        "Golgo 13 - Top Secret Episode (U).nes",
        "Goonies 2, The (U) [a1].nes",
        "Goonies 2, The (U).nes",
        "Gotcha! (U).nes",
        "Gradius (U).nes",
        "Great Waldo Search, The (U).nes",
        "Greg Norman's Golf Power (U).nes",
        "Gremlins 2 - The New Batch (U).nes",
        "Guardian Legend, The (U).nes",
        "Guerrilla War (U).nes",
        "Gun Nac (U).nes",
        "Gun Smoke (U).nes",
        "Gyruss (U).nes",
        "Harlem Globetrotters (U).nes",
        "Hatris (U).nes",
        "Heavy Barrel (U).nes",
        "Heavy Shreddin' (U).nes",
        "Hero Quest (U) (Prototype) [!].nes",
        "High Speed (U).nes",
        "Hollywood Squares (U).nes",
        "Home Alone (U) [!].nes",
        "Home Alone 2 - Lost in New York (U).nes",
        "Hook (U).nes",
        "Hoops (U).nes",
        "Hudson Hawk (U).nes",
        "Hudson's Adventure Island (U).nes",
        "Hudson's Adventure Island 2 (U).nes",
        "Hudson's Adventure Island 3 (U).nes",
        "Hunt for Red October, The (U).nes",
        "Hydlide (U).nes",
        "I Can Remember (U).nes",
        "Ice Climber (U).nes",
        "Ice Hockey (U).nes",
        "Ikari 3 - The Rescue (U).nes",
        "Ikari Warriors (U) (PRG 0).nes",
        "Ikari Warriors (U) (PRG 1) [!].nes",
        "Ikari Warriors 2 - Victory Road (U).nes",
        "Image Fight (U).nes",
        "Immortal, The (U).nes",
        "Impossible Mission 2 (U).nes",
        "Incredible Crash Dummies, The (U).nes",
        "Indiana Jones and the Last Crusade (Taito) (U).nes",
        "Indiana Jones and the Last Crusade (UBI Soft) (U).nes",
        "Indiana Jones and the Temple of Doom (Tengen) (U).nes",
        "Indiana Jones and the Temple of Doom (U).nes",
        "Infiltrator (U).nes",
        "Iron Tank (U).nes",
        "Ironsword - Wizards & Warriors 2 (U).nes",
        "Isolated Warrior (U).nes",
        "Ivan Ironman Stewart's Super Offroad (U).nes",
        "Jack Nicklaus' Greatest 18 Holes of Champ. Golf (U).nes",
        "Jackal (U) [a1].nes",
        "Jackal (U).nes",
        "Jackie Chan's Action Kung Fu (U).nes",
        "James Bond Jr (U).nes",
        "Jaws (U) [!].nes",
        "Jaws (U) [a1].nes",
        "Jaws (U) [a2].nes",
        "Jeopardy! (U).nes",
        "Jeopardy! 25th Anniversary Edition (U).nes",
        "Jeopardy! Junior Edition (U).nes",
        "Jetsons - Cogswell's Caper!, The (U).nes",
        "Jimmy Connor's Tennis (U).nes",
        "Joe & Mac (U).nes",
        "John Elway's Quarterback (U).nes",
        "Jordan Vs Bird - One On One (U).nes",
        "Joshua (U) (Ver 5.0 CHR 6.0).nes",
        "Joshua (U) (Ver 6.0) [!].nes",
        "Journey to Silius (U).nes",
        "Joust (U).nes",
        "Joypad Test Cartridge (U).nes",
        "Jungle Book, The (U).nes",
        "Jurassic Park (U).nes",
        "Kabuki - Quantum Fighter (U).nes",
        "Karate Champ (U).nes",
        "Karate Kid, The (U).nes",
        "Karnov (U).nes",
        "Kick Master (U).nes",
        "Kickle Cubicle (U).nes",
        "Kid Klown (U).nes",
        "Kid Kool (U).nes",
        "Kid Niki - Radical Ninja (U) (PRG 0).nes",
        "Kid Niki - Radical Ninja (U) (PRG 1) [!].nes",
        "King Neptune's Adventure (U).nes",
        "King of Kings, The (U) (V1.1).nes",
        "King of Kings, The (U) (V1.2) [!].nes",
        "King of Kings, The (U) (V1.3).nes",
        "King of Kings, The (U) (V5.0 CHR 1.3).nes",
        "King's Knight (U).nes",
        "King's Quest V (U).nes",
        "Kings of the Beach (U).nes",
        "Kirby's Adventure (U) (PRG 0).nes",
        "Kirby's Adventure (U) (PRG 1) [!].nes",
        "Kiwi Kraze (U).nes",
        "Klash Ball (U).nes",
        "Klax (U).nes",
        "Knight Rider (U).nes",
        "Krazy Kreatures (U) [a1].nes",
        "Krazy Kreatures (U).nes",
        "Krion Conquest, The (U) [a1].nes",
        "Krion Conquest, The (U).nes",
        "Krusty's Fun House (U).nes",
        "Kung Fu (U) [a1].nes",
        "Kung Fu (U).nes",
        "Kung-Fu Heroes (U).nes",
        "L'Empereur (U) [a1].nes",
        "L'Empereur (U).nes",
        "Laser Invasion (U).nes",
        "Last Action Hero (U) [!].nes",
        "Last Ninja, The (U).nes",
        "Last Starfighter, The (U).nes",
        "Lee Trevino's Fighting Golf (U).nes",
        "Legacy of the Wizard (U).nes",
        "Legend of Kage, The (U).nes",
        "Legend of the Ghost Lion (U).nes",
        "Legend of Zelda, The (U) (PRG 0).nes",
        "Legend of Zelda, The (U) (PRG 1).nes",
        "Legendary Wings (U).nes",
        "Legends of the Diamond (U).nes",
        "Lemmings (U).nes",
        "Lethal Weapon (U).nes",
        "Lifeforce (U).nes",
        "Linus Spacehead's Cosmic Crusade (Aladdin) (U).nes",
        "Little League Baseball - Championship Series (U).nes",
        "Little Mermaid, The (U).nes",
        "Little Nemo - The Dream Master (U).nes",
        "Little Ninja Brothers (U).nes",
        "Little Samson (U).nes",
        "Lode Runner (U).nes",
        "Lone Ranger, The (U).nes",
        "Loopz (U).nes",
        "Low G Man (U).nes",
        "Lunar Pool (U).nes",
        "M.U.L.E. (U).nes",
        "M.U.S.C.L.E. (U).nes",
        "Mad Max (U) [!].nes",
        "Mafat Conspiracy - Golgo 13 (U).nes",
        "Magic Darts (U).nes",
        "Magic Johnson's Fast Break (U).nes",
        "Magic of Scheherazade, The (U).nes",
        "Magician (U) (Prototype).nes",
        "Magician (U).nes",
        "Magmax (U) (Prototype).nes",
        "Magmax (U).nes",
        "Major League Baseball (U) [a1].nes",
        "Major League Baseball (U).nes",
        "Maniac Mansion (U).nes",
        "Mappy-Land (U).nes",
        "Marble Madness (U).nes",
        "Mario is Missing! (U).nes",
        "Mario's Time Machine! (U) [a1].nes",
        "Mario's Time Machine! (U).nes",
        "Marvel's X-Men (U) [a1].nes",
        "Marvel's X-Men (U).nes",
        "Master Chu & The Drunkard Hu (U).nes",
        "Maxi 15 (U) [a1].nes",
        "Maxi 15 (U).nes",
        "MC Kids (U).nes",
        "Mechanized Attack (U).nes",
        "Mega Man (U).nes",
        "Mega Man 2 (U).nes",
        "Mega Man 3 (Prototype) (U) [!].nes",
        "Mega Man 3 (U) [!].nes",
        "Mega Man 4 (U).nes",
        "Mega Man 5 (U).nes",
        "Mega Man 6 (U).nes",
        "Menace Beach (U).nes",
        "Mendel Palace (U).nes",
        "Mermaids of Atlantis (U).nes",
        "Metal Fighter (U) [a1].nes",
        "Metal Fighter (U).nes",
        "Metal Gear (U).nes",
        "Metal Mech (U).nes",
        "Metal Storm (U).nes",
        "Metroid (U).nes",
        "Michael Andretti's World Grand Prix (U).nes",
        "Mickey Mousecapade (U).nes",
        "Mickey's Adventures in Numberland (U).nes",
        "Mickey's Safari in Letterland (U).nes",
        "Micro Machines (U).nes",
        "Mig-29 Soviet Fighter (U).nes",
        "Might and Magic (U).nes",
        "Mighty Bomb Jack (U).nes",
        "Mighty Final Fight (U).nes",
        "Mike Tyson's Punch-Out!! (U) (PRG 0).nes",
        "Mike Tyson's Punch-Out!! (U) (PRG 1).nes",
        "Millipede (U).nes",
        "Milon's Secret Castle (U).nes",
        "Miracle Piano Teaching System, The (U).nes",
        "Mission Cobra (U).nes",
        "Mission Impossible (U).nes",
        "Monopoly (U).nes",
        "Monster in My Pocket (U).nes",
        "Monster Party (U).nes",
        "Monster Truck Rally (U).nes",
        "Moon Ranger (U).nes",
        "Motor City Patrol (U).nes",
        "Ms Pac-Man (Namco) (U).nes",
        "Ms Pac-Man (U).nes",
        "Muppet Adventure - Chaos at the Carnival (U).nes",
        "Mutant Virus, The (U).nes",
        "Mystery Quest (U).nes",
        "NARC (U).nes",
        "NES Open Tournament Golf (U) [a1].nes",
        "NES Open Tournament Golf (U).nes",
        "NES Play Action Football (U).nes",
        "NES PowerPad Test Cart (U) [!].nes",
        "NES Test Cart (Official Nintendo) (U) [!].nes",
        "NFL Football (U).nes",
        "Nigel Mansell's World Championship Challenge (U).nes",
        "Nightmare On Elm Street, A (U).nes",
        "Nightshade (U) [a1].nes",
        "Nightshade (U).nes",
        "Ninja Crusaders (U).nes",
        "Ninja Gaiden (U) [a1].nes",
        "Ninja Gaiden (U) [a2].nes",
        "Ninja Gaiden (U).nes",
        "Ninja Gaiden 2 - The Dark Sword of Chaos (U) (Prototype).nes",
        "Ninja Gaiden 2 - The Dark Sword of Chaos (U).nes",
        "Ninja Gaiden 3 - The Ancient Ship of Doom (U).nes",
        "Ninja Kid (U).nes",
        "Nintendo World Championships 1990 (U) [!].nes",
        "Nintendo World Cup (U).nes",
        "Nobunaga's Ambition (U).nes",
        "Nobunaga's Ambition 2 (U).nes",
        "North & South (U).nes",
        "Operation Secret Storm (U).nes",
        "Operation Wolf (U).nes",
        "Orb 3D (U).nes",
        "Othello (U).nes",
        "Overlord (U).nes",
        "P'radikus Conflict (U).nes",
        "Pac-Man (Tengen) (U) [!].nes",
        "Pac-Man (U) (Namco).nes",
        "Pac-Man (U) [!].nes",
        "Pacmania (U).nes",
        "Palamedes (U).nes",
        "Panic Restaurant (U).nes",
        "Paperboy (U).nes",
        "Paperboy 2 (U).nes",
        "Perfect Fit (U).nes",
        "Pesterminator (U).nes",
        "Peter Pan & The Pirates (U).nes",
        "Phantom Fighter (U).nes",
        "Pictionary (U).nes",
        "Pinball Quest (U) [a1].nes",
        "Pinball Quest (U).nes",
        "Pinbot (U).nes",
        "Pipe Dream (U).nes",
        "Pirates! (U).nes",
        "Platoon (U) (PRG 0).nes",
        "Platoon (U) (PRG 1) [!].nes",
        "Port Test Cartridge (U).nes",
        "POW - Prisoners of War (U).nes",
        "Power Blade (U) [!].nes",
        "Power Blade 2 (U).nes",
        "Power Punch 2 (U).nes",
        "Predator (U).nes",
        "Prince of Persia (U) [a1].nes",
        "Prince of Persia (U) [a2].nes",
        "Prince of Persia (U).nes",
        "Princess Tomato in Salad Kingdom (U).nes",
        "Pro Action Replay (No Cart Present) (U) [!].nes",
        "Pro Action Replay (Rev B) (U) [!].nes",
        "Pro Sport Hockey (U).nes",
        "Pro Wrestling (U).nes",
        "Punch-Out!! (U).nes",
        "Punisher, The (U).nes",
        "Puss 'n Boots - Pero's Great Adventure (U).nes",
        "Puzzle (U) [a1].nes",
        "Puzzle (U) [a2].nes",
        "Puzzle (U) [a3].nes",
        "Puzzle (U).nes",
        "Puzznic (U).nes",
        "Pyramid (U) (Sachen).nes",
        "Pyramid (U) (Sachen-Hacker).nes",
        "Q-bert (U).nes",
        "Qix (U).nes",
        "Quattro Adventure (Aladdin) (U).nes",
        "Quattro Adventure (U).nes",
        "Quattro Arcade (U).nes",
        "Quattro Sports (Aladdin) (U).nes",
        "Quattro Sports (U).nes",
        "Quattro Sports (V3 Plug-Thru Cart) (U).nes",
        "Race America (U).nes",
        "Racket Attack (U).nes",
        "Rad Racer (U).nes",
        "Rad Racer 2 (U) [!].nes",
        "Rad Racket - Deluxe Tennis 2 (U) [!].nes",
        "Rad Racket - Deluxe Tennis 2 (U) [a1].nes",
        "Raid 2020 (U) [!].nes",
        "Raid on Bungeling Bay (U) [a2].nes",
        "Raid on Bungeling Bay (U).nes",
        "Rainbow Islands - The Story of Bubble Bobble 2 (U).nes",
        "Rally Bike (U).nes",
        "Rambo (U).nes",
        "Rampage (U).nes",
        "Rampart (U).nes",
        "RBI Baseball (U).nes",
        "RBI Baseball 2 (U).nes",
        "RBI Baseball 3 (U).nes",
        "RC Pro-Am (U) (PRG 1).nes",
        "RC Pro-Am 2 (U).nes",
        "Remote Control (U).nes",
        "Ren & Stimpy Show, The (U).nes",
        "Renegade (U).nes",
        "Rescue - The Embassy Mission (U).nes",
        "Ring King (U).nes",
        "River City Ransom (U).nes",
        "Road Runner (U).nes",
        "RoadBlasters (U).nes",
        "Robin Hood - Prince of Thieves (U).nes",
        "Robo Warrior (U).nes",
        "Robocop (U).nes",
        "Robocop 2 (U).nes",
        "Robocop 3 (U).nes",
        "Robocop Vs The Terminator (Prototype) (U) [a1].nes",
        "Robocop Vs The Terminator (Prototype) (U).nes",
        "Robodemons (U).nes",
        "Rock 'n' Ball (U).nes",
        "Rocket Ranger (U) [!].nes",
        "Rocketeer, The (U).nes",
        "Rockin' Kats (U) [!].nes",
        "Roger Clemens MVP Baseball (U).nes",
        "Rollerball (U).nes",
        "Rollerblade Racer (U).nes",
        "Rollergames (U) [!].nes",
        "Rolling Thunder (U).nes",
        "Romance of the Three Kingdoms (U).nes",
        "Romance of the Three Kingdoms 2 (U) [!].nes",
        "Roundball - 2-on-2 Challenge (U).nes",
        "Rush'n Attack (U).nes",
        "Rygar (U).nes",
        "SCAT - Special Cybernetic Attack Team (U).nes",
        "Secret Scout (U).nes",
        "Section Z (U).nes",
        "Seicross (U).nes",
        "Sesame Street 123 (U).nes",
        "Sesame Street ABC (U) [a1].nes",
        "Sesame Street ABC (U) [a2].nes",
        "Sesame Street ABC (U).nes",
        "Sesame Street ABC - 123 (U).nes",
        "Sesame Street Countdown (U).nes",
        "Shadow of the Ninja (U).nes",
        "Shadowgate (U).nes",
        "Shatterhand (U).nes",
        "Shingen The Ruler (U) [a1].nes",
        "Shingen The Ruler (U).nes",
        "Shinobi (U).nes",
        "Shockwave (U).nes",
        "Shooting Range (U).nes",
        "Short Order - Eggsplode (U).nes",
        "Side Pocket (U).nes",
        "Silent Assault (U).nes",
        "Silent Service (U) [a1].nes",
        "Silent Service (U).nes",
        "Silk Worm (U).nes",
        "Silver Surfer (U).nes",
        "Simpsons - Bart Vs the Space Mutants, The (U).nes",
        "Simpsons - Bart Vs the World, The (U).nes",
        "Simpsons - Bartman Meets Radioactive Man, The (U).nes",
        "Skate or Die 2 - The Search for Double Trouble (U).nes",
        "Skate or Die! (U) [a1].nes",
        "Skate or Die! (U).nes",
        "Ski or Die (U).nes",
        "Skull & Crossbones (U).nes",
        "Sky Kid (U).nes",
        "Sky Shark (U).nes",
        "Slalom (U).nes",
        "Smash TV (U) [!].nes",
        "Snake Rattle'n Roll (U).nes",
        "Snake's Revenge (U).nes",
        "Snoopy's Silly Sports Spectacular (U).nes",
        "Snow Bros (U).nes",
        "Solar Jetman - Hunt for the Golden Warpship (U).nes",
        "Solitaire (U).nes",
        "Solomon's Key (U) [!].nes",
        "Solstice (U) [a1].nes",
        "Solstice (U).nes",
        "Space Shuttle Project (U).nes",
        "Spelunker (U) [!].nes",
        "Spider-Man - Return of the Sinister Six (U) [!].nes",
        "Spiritual Warfare (U) (Ver 6.0).nes",
        "Spiritual Warfare (U) (Ver 6.1).nes",
        "Spot (U).nes",
        "Spy Hunter (U).nes",
        "Spy Vs Spy (U).nes",
        "Sqoon (U).nes",
        "Stadium Events (U).nes",
        "Stanley - The Search for Dr Livingston (U).nes",
        "Star Force (U).nes",
        "Star Soldier (U).nes",
        "Star Trek - 25th Anniversary (U).nes",
        "Star Trek - The Next Generation (U).nes",
        "Star Voyager (U).nes",
        "Star Wars (U).nes",
        "Star Wars - The Empire Strikes Back (U).nes",
        "Starship Hector (U).nes",
        "Startropics (U).nes",
        "Startropics 2 - Zoda's Revenge (U) [a1].nes",
        "Startropics 2 - Zoda's Revenge (U).nes",
        "Stealth ATF (U).nes",
        "Stinger (U).nes",
        "Street Cop (U).nes",
        "Street Fighter 2010 (U).nes",
        "Strider (U).nes",
        "Stunt Kids (U).nes",
        "Sunday Funday (U).nes",
        "Super C (U).nes",
        "Super Cars (U).nes",
        "Super Dodge Ball (U).nes",
        "Super Glove Ball (U).nes",
        "Super Jeopardy! (U).nes",
        "Super Mario Bros - Duck Hunt (U).nes",
        "Super Mario Bros - Duck Hunt - Track Meet (U).nes",
        "Super Mario Bros 2 (U) (PRG 0).nes",
        "Super Mario Bros 2 (U) (PRG 1).nes",
        "Super Mario Bros 3 (U) (PRG 0).nes",
        "Super Mario Bros 3 (U) (PRG 1) [a1].nes",
        "Super Mario Bros 3 (U) (PRG 1) [a2].nes",
        "Super Mario Bros 3 (U) (PRG 1) [a3].nes",
        "Super Mario Bros 3 (U) (PRG 1).nes",
        "Super Pitfall (U).nes",
        "Super Spike V'Ball (U).nes",
        "Super Spike V'Ball - Nintendo World Cup (U) [!].nes",
        "Super Sprint (U).nes",
        "Super Spy Hunter (U).nes",
        "Super Team Games (U).nes",
        "Superman (U).nes",
        "Swamp Thing (U) [!].nes",
        "Sword Master (U).nes",
        "Swords and Serpents (U) [a1].nes",
        "Swords and Serpents (U).nes",
        "T&C 2 - Thrilla's Surfari (U).nes",
        "T&C Surf Design (U).nes",
        "Taboo - The Sixth Sense (U).nes",
        "Tag Team Wrestling (U).nes",
        "Tagin' Dragon (U).nes",
        "TaleSpin (U).nes",
        "Target Renegade (U).nes",
        "Tecmo Baseball (U).nes",
        "Tecmo Bowl (U) (PRG 0).nes",
        "Tecmo Bowl (U) (PRG 1).nes",
        "Tecmo Bowl (U) (Prototype).nes",
        "Tecmo Cup - Soccer Game (U) [a1].nes",
        "Tecmo Cup - Soccer Game (U).nes",
        "Tecmo NBA Basketball (U).nes",
        "Tecmo Super Bowl (U).nes",
        "Tecmo World Wrestling (U).nes",
        "Teenage Mutant Ninja Turtles (U).nes",
        "Teenage Mutant Ninja Turtles 2 (U).nes",
        "Teenage Mutant Ninja Turtles 3 (U).nes",
        "Teenage Mutant Ninja Turtles Tournament Fighters (U).nes",
        "Terminator 2 - Judgement Day (U) (Prototype).nes",
        "Terminator 2 - Judgement Day (U).nes",
        "Terminator, The (U).nes",
        "Terra Cresta (U).nes",
        "Tetris (U) [!].nes",
        "Tetris 2 (U) [!].nes",
        "Three Stooges (U) (Prototype).nes",
        "Three Stooges (U).nes",
        "Thunder & Lightning (U).nes",
        "Thunderbirds (U).nes",
        "Thundercade (U).nes",
        "Tiger-Heli (U).nes",
        "Tiles of Fate (U).nes",
        "Time Lord (U).nes",
        "Times of Lore (U).nes",
        "Tiny Toon Adventures (U).nes",
        "Tiny Toon Adventures 2 - Trouble in Wackyland (U).nes",
        "Tiny Toon Adventures Cartoon Workshop (U).nes",
        "To The Earth (U).nes",
        "Toki (U).nes",
        "Tom & Jerry (and Tuffy) (U).nes",
        "Tombs and Treasure (U).nes",
        "Toobin (U) [a1].nes",
        "Toobin (U).nes",
        "Top Gun (U).nes",
        "Top Gun - The Second Mission (U).nes",
        "Total Recall (U).nes",
        "Totally Rad (U).nes",
        "Touch Down Fever (U).nes",
        "Toxic Crusaders (U).nes",
        "Track & Field (U).nes",
        "Track & Field 2 (U).nes",
        "Treasure Master (U).nes",
        "Trog (U).nes",
        "Trojan (U) [a1].nes",
        "Trojan (U).nes",
        "Trolls on Treasure Island (U) [a1].nes",
        "Trolls on Treasure Island (U).nes",
        "Twin Cobra (U).nes",
        "Twin Eagle (U).nes",
        "U-Force Test Cartridge (U).nes",
        "Ultima - Exodus (U).nes",
        "Ultima - Quest of the Avatar (U).nes",
        "Ultima - Warriors of Destiny (U).nes",
        "Ultimate Air Combat (U).nes",
        "Ultimate Basketball (U).nes",
        "Ultimate League Soccer (U).nes",
        "Ultimate Stuntman (U).nes",
        "Uncharted Waters (U).nes",
        "Uninvited (U).nes",
        "Untouchables, The (U).nes",
        "Vegas Dream (U).nes",
        "Venice Beach Volleyball (U).nes",
        "Vice - Project Doom (U).nes",
        "Videomation (U).nes",
        "Vindicators (U).nes",
        "Volleyball (U).nes",
        "Wacky Races (U).nes",
        "Wall Street Kid (U) [a1].nes",
        "Wall Street Kid (U) [a2].nes",
        "Wall Street Kid (U).nes",
        "Wally Bear and the No Gang (U).nes",
        "Wario's Woods (U).nes",
        "Wayne Gretzky Hockey (U).nes",
        "Wayne's World (U).nes",
        "WCW World Championship Wrestling (U).nes",
        "Werewolf - The Last Warrior (U).nes",
        "Wheel of Fortune (U).nes",
        "Wheel of Fortune - Starring Vanna White (U).nes",
        "Wheel of Fortune Family Edition (U).nes",
        "Wheel of Fortune Junior Edition (U).nes",
        "Where in Time is Carmen Sandiego (U).nes",
        "Where's Waldo (U).nes",
        "Who Framed Roger Rabbit (U) [a1].nes",
        "Who Framed Roger Rabbit (U).nes",
        "Whomp'Em (U).nes",
        "Widget (U).nes",
        "Wild Gunman (U) [!].nes",
        "Wild Gunman (U).nes",
        "Willow (U).nes",
        "Win, Lose or Draw (U).nes",
        "Winter Games (U).nes",
        "Wizardry - Proving Grounds of the Mad Overlord (U).nes",
        "Wizardry - The Knight of Diamonds (U).nes",
        "Wizards & Warriors (U).nes",
        "Wizards & Warriors 3 (U).nes",
        "Wolverine (U).nes",
        "World Champ (U) [!].nes",
        "World Class Track Meet (U).nes",
        "World Games (U).nes",
        "Wrath of the Black Manta (U).nes",
        "Wurm (U).nes",
        "WWF King of the Ring (U).nes",
        "WWF Steel Cage Challenge (U).nes",
        "WWF Wrestlemania (U).nes",
        "WWF Wrestlemania Challenge (U).nes",
        "Xenophobe (U).nes",
        "Xevious (U).nes",
        "Xexyz (U).nes",
        "Yo! Noid (U).nes",
        "Yoshi (U).nes",
        "Yoshi's Cookie (U).nes",
        "Young Indiana Jones Chronicles, The (U).nes",
        "Zanac (U).nes",
        "Zelda 2 - The Adventure of Link (U).nes",
        "Zen Intergalactic Ninja (U).nes",
        "Zombie Nation (U).nes"
    ];
    
    // --- UPDATED HTML INJECTION ---
    output.innerHTML = `
        <div class="nes-terminal-wrapper">
            <p style="color:var(--theme-color); font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;">[ NES_MAINFRAME ]</p>
            
            <select id="rom-dropdown" class="nes-model-selector">
                <option value="" disabled selected>> SELECT CARTRIDGE...</option>
            </select>
            
            <div id="nes-container" class="nes-screen-container">
                <button id="nes-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center;">&#9974;</button>
                <canvas id="nes-screen" width="256" height="240" style="background: black url('Emulators/nes/cover.jpg') no-repeat center center; background-size: cover;"></canvas>
                <button id="nes-mute-btn" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center;">&#128266;</button>
            </div>

            <div style="display: block; width: 100%; box-sizing: border-box; margin: 5px auto 0 auto; font-size:0.65rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.5;"><span style="color:#fff;">CONTROLS:</span> WASD = MOVE<br>A-BTN = <span style="color:#fff;">SPACE/X</span> | B-BTN = <span style="color:#fff;">L-SHIFT/Z</span> | SELECT = <span style="color:#fff;">TAB/R-SHIFT</span> | START = <span style="color:#fff;">ENTER/\`</span><br><span style="color:#aaa;">[1] QUICK SAVE | [4] QUICK LOAD | [HOLD P] FAST FWD</span><br><span style="color:#0f0;">[GAMEPAD DETECTED ON PRESS]</span></div>
        </div>`;

    await loadScript("Emulators/nes/jsnes.min.js");
    
    window.activeNesInstance = new window.MatrixNES('nes-screen');
    const dropdown = document.getElementById('rom-dropdown');
    const muteBtn = document.getElementById('nes-mute-btn');
    const fullBtn = document.getElementById('nes-fullscreen-btn');
    const container = document.getElementById('nes-container');

    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.activeNesInstance && window.activeNesInstance.toggleMute) {
            const isMuted = window.activeNesInstance.toggleMute();
            // Swapping standard Speaker High Volume / Speaker Muted icons
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

    ['mousedown', 'click', 'focus'].forEach(event => {
        dropdown.addEventListener(event, (e) => e.stopPropagation());
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