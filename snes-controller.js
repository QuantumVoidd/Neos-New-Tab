// Emulators/snes/snes-controller.js

window.openSnesEmulator = async function() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    
    if (!modal || !output) return;
    modal.classList.remove('hidden');

    // Initialize Terminal Rain Background (Preserved logic)
    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }

    let messageListener = null;

    // 1. Setup Interface
    output.innerHTML = `
        <style>
            #snes-display-wrapper:fullscreen {
                width: 100vw !important;
                height: 100vh !important;
                max-width: none !important;
                max-height: none !important;
                border: none !important;
                background: black !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            #snes-display-wrapper:fullscreen iframe {
                width: 100% !important;
                height: 100% !important;
                border: none !important;
            }
        </style>
        <div class="nes-terminal-wrapper">
            <p style="color:#0f0; font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;">[ SNES_MAINFRAME ]</p>
            
            <div style="display:flex; justify-content:center; margin-bottom:10px;">
                <select id="snes-rom-select" class="nes-model-selector" style="flex-grow:1; max-width:400px;">
                    <option value="" disabled selected>> INSERT CARTRIDGE...</option>
                </select>
            </div>

            <div id="snes-display-wrapper" class="nes-screen-container" style="
                position: relative; 
                border: 1px solid #0f0; 
                height: 480px;
                background: black url('${chrome.runtime.getURL("Emulators/snes/cover.jpg")}') no-repeat center center; 
                background-size: cover;
            ">
                <button id="snes-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #0f0; color:#0f0; cursor:pointer;">&#9974;</button>
                <button id="snes-mute-btn" data-muted="false" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; bottom:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #0f0; color:#0f0; cursor:pointer;">&#128266;</button>
            </div>
            
            <div id="snes-debug-log" style="color:red; font-family:'Courier New'; font-size:12px; margin-top:5px; height:20px;"></div>

            <div style="display: block; width: 100%; box-sizing: border-box; margin: 5px auto 0 auto; font-size:0.65rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.5;"><span style="color:#fff;">CONTROLS:</span> WASD = MOVE | START = <span style="color:#fff;">ENTER</span> | SELECT = <span style="color:#fff;">R-SHIFT</span><br>A=<span style="color:#fff;">Z</span> B=<span style="color:#fff;">X</span> X=<span style="color:#fff;">C</span> Y=<span style="color:#fff;">V</span> | L=<span style="color:#fff;">L-SHIFT</span> R=<span style="color:#fff;">PG-DN</span><br><span style="color:#aaa;">[P] FAST FWD</span></div>
        </div>`;

    const dropdown = document.getElementById('snes-rom-select');
    const displayWrapper = document.getElementById('snes-display-wrapper');
    const fullBtn = document.getElementById('snes-fullscreen-btn');
    const muteBtn = document.getElementById('snes-mute-btn');
    const debugLog = document.getElementById('snes-debug-log');
    
    // Prevent Bubbling
    ['mousedown', 'click', 'mouseup', 'focus'].forEach(event => {
        dropdown.addEventListener(event, (e) => e.stopPropagation());
        if(fullBtn) fullBtn.addEventListener(event, (e) => e.stopPropagation());
        if(muteBtn) muteBtn.addEventListener(event, (e) => e.stopPropagation());
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

    // --- FULL 131 ROM LIST PRESERVED ---
    const ROMS = [
        "Alien 3 (USA).sfc",
        "Alien vs Predator (USA).sfc",
        "Batman (USA) (Proto) [b].sfc",
        "Batman - Revenge of the Joker (USA) (Proto).sfc",
        "Batman Forever (USA).sfc",
        "Batman Returns (USA).sfc",
        "Blues Brothers, The (USA).sfc",
        "Bugs Bunny - Rabbit Rampage (USA).sfc",
        "Captain America and the Avengers (USA).sfc",
        "Casper (USA).sfc",
        "Castlevania - Dracula X (USA).sfc",
        "Daffy Duck - The Marvin Missions (USA).sfc",
        "Dennis the Menace (USA).sfc",
        "DinoCity (USA).sfc",
        "Donkey Kong Country (USA) (Rev 2).sfc",
        "Donkey Kong Country - Competition Cartridge (USA).sfc",
        "Donkey Kong Country 2 - Diddy's Kong Quest (USA) (En,Fr) (Rev 1).sfc",
        "Donkey Kong Country 3 - Dixie Kong's Double Trouble! (USA) (En,Fr).sfc",
        "Doom (USA).sfc",
        "F-Zero (USA).sfc",
        "Final Fantasy - Mystic Quest (USA) (Rev 1).sfc",
        "Final Fantasy II (USA) (Rev 1).sfc",
        "Final Fantasy III (USA) (Rev 1).sfc",
        "Flintstones, The - The Treasure of Sierra Madrock (USA).sfc",
        "Harvest Moon (USA).sfc",
        "Home Alone (USA).sfc",
        "Home Alone 2 - Lost in New York (USA).sfc",
        "Hook (USA).sfc",
        "Incredible Hulk, The (USA).sfc",
        "Indiana Jones' Greatest Adventures (USA).sfc",
        "Inspector Gadget (USA).sfc",
        "Itchy & Scratchy Game, The (USA).sfc",
        "J.R.R. Tolkien's The Lord of the Rings - Volume 1 (USA).sfc",
        "James Bond Jr (USA).sfc",
        "Jetsons, The - Invasion of the Planet Pirates (USA).sfc",
        "Judge Dredd (USA).sfc",
        "Jungle Book, The (USA).sfc",
        "Jurassic Park (USA) (Rev 1).sfc",
        "Jurassic Park Part 2 - The Chaos Continues (USA) (En,Fr,De,It).sfc",
        "Justice League Task Force (USA).sfc",
        "Killer Instinct (USA) (Rev 1).sfc",
        "Kirby Super Star (USA).sfc",
        "Kirby's Avalanche (USA).sfc",
        "Kirby's Dream Course (USA).sfc",
        "Kirby's Dream Land 3 (USA).sfc",
        "Krusty's Super Fun House (USA) (Rev 1).sfc",
        "Legend of Zelda, The - A Link to the Past (USA).sfc",
        "Lion King, The (USA).sfc",
        "Looney Tunes B-Ball (USA).sfc",
        "Mario Is Missing! (USA).sfc",
        "Mario's Early Years - Fun with Letters (USA).sfc",
        "Mario's Early Years - Fun with Numbers (USA).sfc",
        "Mario's Early Years - Preschool Fun (USA).sfc",
        "Mario's Time Machine (USA).sfc",
        "Marvel Super Heroes in War of the Gems (USA).sfc",
        "Mask, The (USA).sfc",
        "Mega Man 7 (USA).sfc",
        "Mega Man X (USA) (Rev 1).sfc",
        "Mega Man X2 (USA).sfc",
        "Mega Man X3 (USA).sfc",
        "Might and Magic II (USA) (Proto).sfc",
        "Might and Magic III - Isles of Terra (USA).sfc",
        "Mighty Morphin Power Rangers (USA).sfc",
        "Mighty Morphin Power Rangers - The Fighting Edition (USA).sfc",
        "Mighty Morphin Power Rangers - The Movie (USA).sfc",
        "Mortal Kombat (USA) (Rev 1).sfc",
        "Mortal Kombat 3 (USA).sfc",
        "Mortal Kombat II (USA) (Rev 1).sfc",
        "Ms. Pac-Man (USA).sfc",
        "Pac-Attack (USA).sfc",
        "Pac-In-Time (USA).sfc",
        "Pac-Man 2 - The New Adventures (USA).sfc",
        "Paperboy 2 (USA).sfc",
        "Power Rangers Zeo - Battle Racers (USA).sfc",
        "Prince of Persia (USA).sfc",
        "Prince of Persia 2 (USA).sfc",
        "Rayman (USA) (Proto).sfc",
        "Scooby-Doo Mystery (USA).sfc",
        "SimCity (USA).sfc",
        "SimCity 2000 - The Ultimate City Simulator (USA).sfc",
        "Simpsons, The - Bart's Nightmare (USA).sfc",
        "Sonic Blast Man (USA).sfc",
        "Sonic Blast Man II (USA).sfc",
        "Space Invaders (USA).sfc",
        "Spider-Man (USA).sfc",
        "Spider-Man - Venom - Maximum Carnage (USA).sfc",
        "Spider-Man - X-Men - Arcade's Revenge (USA).sfc",
        "Star Fox (USA) (Rev 2).sfc",
        "Star Fox 2 (USA).sfc",
        "Star Trek - Deep Space Nine - Crossroads of Time (USA).sfc",
        "Star Trek - Starfleet Academy - Starship Bridge Simulator (USA).sfc",
        "Star Trek - The Next Generation - Future's Past (USA).sfc",
        "Stargate (USA).sfc",
        "Street Fighter Alpha 2 (USA).sfc",
        "Street Fighter II (USA).sfc",
        "Street Fighter II Turbo (USA) (Rev 1).sfc",
        "Super Bomberman (USA).sfc",
        "Super Bomberman 2 (USA).sfc",
        "Super Buster Bros. (USA) (Rev 1).sfc",
        "Super Godzilla (USA).sfc",
        "Super Mario All-Stars (USA).sfc",
        "Super Mario All-Stars + Super Mario World (USA).sfc",
        "Super Mario Kart (USA).sfc",
        "Super Mario RPG - Legend of the Seven Stars (USA).sfc",
        "Super Mario World (USA).sfc",
        "Super Mario World 2 - Yoshi's Island (USA).sfc",
        "Super Star Wars (USA) (Rev 1).sfc",
        "Super Star Wars - Return of the Jedi (USA) (Rev 1).sfc",
        "Super Star Wars - The Empire Strikes Back (USA) (Rev 1).sfc",
        "Super Street Fighter II (USA).sfc",
        "Taz-Mania (USA) (Rev 1).sfc",
        "Teenage Mutant Ninja Turtles - Tournament Fighters (USA).sfc",
        "Teenage Mutant Ninja Turtles IV - Turtles in Time (USA).sfc",
        "Teenage Mutant Ninja Turtles IV - Turtles in Time (USA).sfc",
        "Terminator 2 - Judgment Day (USA).sfc",
        "Terminator, The (USA).sfc",
        "Tetris & Dr. Mario (USA).sfc",
        "Tetris 2 (USA) (Rev 1).sfc",
        "Tetris Attack (USA) (En,Ja).sfc",
        "Tom and Jerry (USA).sfc",
        "Top Gear (USA).sfc",
        "Top Gear 2 (USA).sfc",
        "Top Gear 3000 (USA).sfc",
        "Toy Story (USA).sfc",
        "Ultimate Fighter (USA).sfc",
        "Ultimate Mortal Kombat 3 (USA).sfc",
        "Venom - Spider-Man - Separation Anxiety (USA).sfc",
        "Wario's Woods (USA).sfc",
        "Wayne's World (USA).sfc",
        "We're Back! - A Dinosaur's Story (USA).sfc",
        "Wizard of Oz, The (USA).sfc",
        "Wolverine - Adamantium Rage (USA).sfc"
    ];

    ROMS.forEach(rom => {
        const opt = document.createElement('option');
        opt.value = rom;
        opt.textContent = rom.replace(/\.(sfc|smc)$/i, '').replace(/_/g, ' ').toUpperCase();
        dropdown.appendChild(opt);
    });

    async function findRomUrl(baseName) {
        const root = 'Emulators/snes/roms/';
        const variations = [baseName, baseName.toLowerCase(), baseName.toUpperCase(), baseName.replace(/\.[^/.]+$/, "") + ".sfc", baseName.replace(/\.[^/.]+$/, "") + ".smc"];
        for (const filename of [...new Set(variations)]) {
            const testUrl = chrome.runtime.getURL(root + filename);
            try { const r = await fetch(testUrl, { method: 'HEAD' }); if (r.ok) return testUrl; } catch (e) {}
        }
        throw new Error(`ROM not found: ${baseName}`);
    }

    async function findCorePaths() {
        const jsUrl = chrome.runtime.getURL("Emulators/snes/cores/snes9x_libretro.js");
        const wasmUrl = chrome.runtime.getURL("Emulators/snes/cores/snes9x_libretro.wasm");
        return { js: jsUrl, wasm: wasmUrl };
    }

    dropdown.onchange = async () => {
        const romName = dropdown.value;
        dropdown.blur();
        
        debugLog.innerHTML = `<span style="color:yellow">Initializing SNES Construct...</span>`;
        
        const oldIframe = displayWrapper.querySelector('iframe');
        if(oldIframe) oldIframe.remove();

        try {
            const romUrl = await findRomUrl(romName);
            const corePaths = await findCorePaths();
            const romResponse = await fetch(romUrl);
            const romBlob = await romResponse.blob();
            
            const romFile = new File([romBlob], romName, { type: "application/octet-stream" });

            const iframe = document.createElement('iframe');
            iframe.src = chrome.runtime.getURL("snes_sandbox.html");
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
                    romBlob: romFile,
                    coreConfig: {
                        name: 'snes9x',
                        js: corePaths.js,
                        wasm: corePaths.wasm
                    },
                    retroarchConfig: {
                        notification_show_save_state: "false",
                        notification_show_load_state: "false",
                        video_font_enable: "false",
                        input_player1_up: "w",
                        input_player1_down: "s",
                        input_player1_left: "a",
                        input_player1_right: "d",
                        input_player1_start: "enter",
                        input_player1_select: "rshift",
                        input_player1_b: "x",
                        input_player1_a: "z",
                        input_player1_y: "v",
                        input_player1_x: "c",
                        input_player1_l: "lshift",
                        input_player1_r: "pagedown",
                        input_toggle_fast_forward: "p"
                    }
                }, '*');
                iframe.contentWindow.focus();
            };

            if (messageListener) window.removeEventListener('message', messageListener);

            messageListener = function(e) {
                 if (e.data.status === 'running') {
                    debugLog.innerHTML = "";
                } 
                else if (e.data.status === 'error') {
                    if (e.data.message && e.data.message.includes("GamepadEvent")) return;
                    debugLog.innerHTML = `[ERROR] ${e.data.message}`;
                } 
                else if (e.data.status === 'gamepad_connected') {
                    debugLog.innerHTML = `<span style="color:#0f0;">GAMEPAD READY: ${e.data.id.substring(0, 15)}...</span>`;
                    setTimeout(() => debugLog.innerHTML = "", 3000);
                }
            };

            window.addEventListener('message', messageListener);

        } catch (e) {
            console.error(e);
            debugLog.innerHTML = `[SYSTEM ERROR] ${e.message}`;
        }
    };
};