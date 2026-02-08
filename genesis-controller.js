// Emulators/genesis/genesis-controller.js

window.openGenesisEmulator = async function() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    
    if (!modal || !output) return;
    modal.classList.remove('hidden');

    // Initialize Terminal Rain Background (Added to match NES/GBA/SNES logic)
    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }

    // FIX 1: Cleanup any "Ghost" listeners from previous sessions immediately
    if (window._genesisListener) {
        window.removeEventListener('message', window._genesisListener);
        window._genesisListener = null;
    }

    let currentSlot = 1;

    // 1. Setup Interface
    output.innerHTML = `
        <div class="nes-terminal-wrapper">
            <p style="color:#0f0; font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;">[ GENESIS_MAINFRAME ]</p>
            
            <div style="display:flex; justify-content:center; margin-bottom:10px;">
                <select id="genesis-rom-select" class="nes-model-selector" style="flex-grow:1; max-width:300px; margin-right: 10px;">
                    <option value="" disabled selected>> INSERT CARTRIDGE...</option>
                </select>

                <select id="gen-slot-select" class="nes-model-selector" style="width: auto; min-width: 100px;">
                    <option value="1" selected>SLOT 1</option>
                    <option value="2">SLOT 2</option>
                    <option value="3">SLOT 3</option>
                    <option value="4">SLOT 4</option>
                    <option value="5">SLOT 5</option>
                </select>
            </div>

            <div id="genesis-display-wrapper" class="nes-screen-container" style="
                position: relative; 
                border: 1px solid #0f0; 
                height: 480px;
                background: black url('${chrome.runtime.getURL("Emulators/genesis/cover.jpg")}') no-repeat center center; 
                background-size: cover;
            ">
                <button id="gen-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #0f0; color:#0f0; cursor:pointer;">&#9974;</button>
                
                <button id="gen-mute-btn" data-muted="false" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; bottom:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #0f0; color:#0f0; cursor:pointer;">&#128266;</button>
            </div>
            
            <div id="debug-log" style="color:red; font-family:'Courier New'; font-size:12px; margin-top:5px; height:20px;"></div>

            <div style="display: block; width: 100%; box-sizing: border-box; margin: 5px auto 0 auto; font-size:0.65rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.5;"><span style="color:#fff;">CONTROLS:</span> WASD = MOVE | START = <span style="color:#fff;">SHIFT</span> | MODE = <span style="color:#fff;">CAPS</span><br>A=<span style="color:#fff;">SPACE</span> B=<span style="color:#fff;">L-SHIFT</span> C=<span style="color:#fff;">I</span> | X=<span style="color:#fff;">K</span> Y=<span style="color:#fff;">J</span> Z=<span style="color:#fff;">L</span><br><span style="color:#aaa;">[1] SAVE | [4] LOAD | [P] FAST FWD</span><br><span style="color:#0f0;">[GAMEPAD: R1+A = SAVE | R1+X = LOAD]</span></div>
        </div>`;

    const dropdown = document.getElementById('genesis-rom-select');
    const slotSelect = document.getElementById('gen-slot-select');
    const displayWrapper = document.getElementById('genesis-display-wrapper');
    const fullBtn = document.getElementById('gen-fullscreen-btn');
    const muteBtn = document.getElementById('gen-mute-btn');
    const debugLog = document.getElementById('debug-log');
    const termInput = document.getElementById('terminal-cmd-input');

    // Prevent Bubbling
    ['mousedown', 'click', 'mouseup', 'focus'].forEach(event => {
        dropdown.addEventListener(event, (e) => e.stopPropagation());
        slotSelect.addEventListener(event, (e) => e.stopPropagation());
        if(fullBtn) fullBtn.addEventListener(event, (e) => e.stopPropagation());
        if(muteBtn) muteBtn.addEventListener(event, (e) => e.stopPropagation());
    });

    slotSelect.addEventListener('change', (e) => {
        currentSlot = e.target.value;
        slotSelect.blur();
        const exists = localStorage.getItem(`gen_save_slot_${currentSlot}`) ? "DATA FOUND" : "EMPTY";
        debugLog.innerHTML = `<span style="color:#0f0;">SLOT ${currentSlot} SELECTED [${exists}]</span>`;
        setTimeout(() => debugLog.innerHTML = "", 2000);
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

    window.addEventListener("gamepadconnected", (e) => {
        debugLog.innerHTML = `<span style="color:#0f0;">GAMEPAD DETECTED: ${e.gamepad.id.substring(0, 20).toUpperCase()}...</span>`;
        setTimeout(() => debugLog.innerHTML = "", 3000);
    });

    // --- FULL ROM LIST PRESERVED ---
    const ROMS = [
        "Adventures of Batman & Robin, The (USA).md",
        "After Burner II (USA).md",
        "Alex Kidd in the Enchanted Castle (USA).md",
        "Alien 3 (USA) (Rev-A).md",
        "Alien Soldier (USA) (Virtual Console).md",
        "Alien Storm (USA).md",
        "Altered Beast (USA).md",
        "Asterix and the Great Rescue (USA).md",
        "Asterix and the Power of the Gods (Europe).md",
        "Atomic Runner (USA).md",
        "Ballz 3D (USA).md",
        "Batman - The Video Game (USA).md",
        "Batman Returns (USA).md",
        "Battle Master (USA).md",
        "Battletech - A Game of Armored Combat (USA).md",
        "Battletoads & Double Dragon - The Ultimate Team (USA).md",
        "Battletoads (USA).md",
        "Beavis and Butt-Head (USA).md",
        "Boxing Legends of the Ring (USA).md",
        "Bram Stoker's Dracula (USA).md",
        "Brutal - Paws of Fury (USA).md",
        "Buck Rogers - Countdown to Doomsday (USA).md",
        "Bugs Bunny in Double Trouble (USA).md",
        "Burning Force (USA).md",
        "Cannon Fodder (Europe).md",
        "Captain America and the Avengers (USA).md",
        "Castle of Illusion Starring Mickey Mouse (USA).md",
        "Castlevania - Bloodlines (USA).md",
        "Centurion - Defender of Rome (USA).md",
        "Chakan - The Forever Man (USA).md",
        "Chase H.Q. II (USA).md",
        "Cheese Cat-Astrophe Starring Speedy Gonzales (Europe).md",
        "Cosmic Spacehead (USA).md",
        "Crack Down (USA).md",
        "Dick Tracy (USA).md",
        "Disney's Aladdin (USA).md",
        "Disney's Aladdin - Final Cut (USA).md",
        "Disney's Ariel the Little Mermaid (USA).md",
        "Disney's Pinocchio (USA).md",
        "Disney's Pocahontas (USA).md",
        "Disney's TaleSpin (USA).md",
        "Disney's The Jungle Book (USA).md",
        "Disney's Toy Story (USA).md",
        "Donald in Maui Mallard (Europe) (Rev-A).md",
        "Doom Troopers (USA).md",
        "F-117 Night Storm (USA).md",
        "F-15 Strike Eagle II (USA).md",
        "F-22 Interceptor (USA) (1992).md",
        "Faery Tale Adventure, The (USA).md",
        "Family Feud (USA).md",
        "FIFA 98 - Road to World Cup (Europe).md",
        "FIFA International Soccer (USA).md",
        "FIFA Soccer 95 (USA).md",
        "FIFA Soccer 96 (USA).md",
        "FIFA Soccer 97 (USA).md",
        "Flintstones, The (USA).md",
        "Forgotten Worlds (USA) (Rev-A).md",
        "Frogger (USA).md",
        "G-LOC - Air Battle (USA).md",
        "Gadget Twins (USA).md",
        "Galaxy Force II (USA) (Rev-A).md",
        "Garfield - Caught in the Act (USA).md",
        "Genghis Khan II - Clan of the Gray Wolf (USA).md",
        "Ghostbusters (USA) (Rev-A).md",
        "Ghouls 'n Ghosts (USA) (Rev-B).md",
        "Gods (USA).md",
        "Golden Axe (USA) (Rev-A).md",
        "Golden Axe II (USA).md",
        "Granada (USA) (Rev-A).md",
        "Great Circus Mystery Starring Mickey & Minnie, The (USA).md",
        "Greatest Heavyweights (USA).md",
        "Home Alone (USA).md",
        "Hook (USA).md",
        "Hurricanes (Europe).md",
        "Immortal, The (USA).md",
        "Incredible Hulk, The (USA).md",
        "Insector X (USA).md",
        "Jack Nicklaus' Power Challenge Golf (USA).md",
        "James Pond - Underwater Agent (USA).md",
        "James Pond 3 - Operation Starfish (USA).md",
        "James Pond II - Codename RoboCod (USA).md",
        "Jewel Master (USA).md",
        "Judge Dredd (USA).md",
        "Jungle Strike - The Sequel to Desert Strike (USA).md",
        "Jurassic Park (USA).md",
        "Jurassic Park - Rampage Edition (USA).md",
        "Kid Chameleon (USA).md",
        "King of the Monsters (USA).md",
        "King of the Monsters 2 (USA).md",
        "King's Bounty - The Conqueror's Quest (USA).md",
        "Klax (USA).md",
        "Krusty's Super Fun House (USA) (Rev-A).md",
        "Landstalker - The Treasures of King Nole (USA).md",
        "Lion King, The (USA).md",
        "Lost Vikings, The (USA) (1995).md",
        "Lost World, The - Jurassic Park (USA).md",
        "M.U.S.H.A. - Metallic Uniframe Super Hybrid Armor (USA).md",
        "Marble Madness (USA).md",
        "Marvel Land (USA).md",
        "Master of Monsters (USA).md",
        "Mazin Saga - Mutant Fighter (USA).md",
        "McDonald's Treasure Land Adventure (USA).md",
        "Mega Bomberman (USA).md",
        "Mega Man - The Wily Wars (USA) (Sega Genesis Mini).md",
        "Mega SWIV (Europe).md",
        "Mega Turrican (USA).md",
        "Mercs (USA).md",
        "Michael Jackson's Moonwalker (USA).md",
        "Mick & Mack as the Global Gladiators (USA).md",
        "Mickey Mania - The Timeless Adventures of Mickey Mouse (USA).md",
        "Mickey's Ultimate Challenge (USA).md",
        "Might and Magic II - Gates to Another World (USA).md",
        "Mighty Morphin Power Rangers (USA).md",
        "Mighty Morphin Power Rangers - The Movie (USA).md",
        "Monopoly (USA).md",
        "Monster World IV (USA) (Virtual Console).md",
        "Mortal Kombat (USA).md",
        "Mortal Kombat 3 (USA).md",
        "Mortal Kombat II (USA).md",
        "Mr. Nutz (Europe).md",
        "Ms. Pac-Man (USA).md",
        "Pac-Attack (USA).md",
        "Pac-Man 2 - The New Adventures (USA).md",
        "Pac-Mania (USA).md",
        "Paperboy (USA).md",
        "Paperboy 2 (USA).md",
        "Phantasy Star II (USA) (Rev-A).md",
        "Phantasy Star III - Generations of Doom (USA).md",
        "Phantasy Star IV - The End of the Millennium (USA).md",
        "Phantom 2040 (USA).md",
        "Phelios (USA).md",
        "Pirates of Dark Water, The (USA).md",
        "Pirates! Gold (USA).md",
        "Predator 2 (USA).md",
        "Primal Rage (USA).md",
        "Prince of Persia (Europe).md",
        "Prince of Persia (USA).md",
        "Puggsy (USA).md",
        "Punisher, The (USA).md",
        "QuackShot Starring Donald Duck (USA) (Rev-A).md",
        "Radical Rex (USA).md",
        "Raiden Trad (USA).md",
        "Rambo III (USA) (Rev-A).md",
        "Revenge of Shinobi, The (USA).md",
        "Rings of Power (USA).md",
        "Road Rash (USA).md",
        "Road Rash 3 - Tour de Force (USA).md",
        "Road Rash II (USA) (Rev-B).md",
        "RoadBlasters (USA).md",
        "RoboCop versus The Terminator (USA).md",
        "Rock n' Roll Racing (USA).md",
        "Rocket Knight Adventures (USA).md",
        "Rolling Thunder 2 (USA).md",
        "Rolling Thunder 3 (USA).md",
        "Rolo to the Rescue (USA).md",
        "Romance of the Three Kingdoms II (USA).md",
        "Romance of the Three Kingdoms III - Dragon of Destiny (USA).md",
        "S.S. Lucifer - Man Overboard! (Europe).md",
        "Scholastic's The Magic School Bus - Space Exploration Game (USA).md",
        "Scooby-Doo Mystery (USA).md",
        "Shining Force (USA).md",
        "Shining Force II (USA).md",
        "Shining in the Darkness (USA).md",
        "Shinobi III - Return of the Ninja Master (USA).md",
        "Shove It! ...The Warehouse Game (USA).md",
        "Side Pocket (USA).md",
        "Simpsons, The - Bart's Nightmare (USA).md",
        "Skeleton Krew (USA).md",
        "Skitchin' (USA).md",
        "Snake Rattle 'n' Roll (Europe).md",
        "Socket (USA).md",
        "Sol-Deace (USA).md",
        "Soldiers of Fortune (USA).md",
        "Sonic & Knuckles (Blue Sphere) (USA) (Lock-on).md",
        "Sonic & Knuckles (Knuckles the Echidna in Sonic the Hedgehog 2) (USA) (Lock-on).md",
        "Sonic & Knuckles (Sonic the Hedgehog 3 & Knuckles) (USA) (Lock-on).md",
        "Sonic & Knuckles (USA).md",
        "Sonic 3D Blast (USA).md",
        "Sonic Spinball (USA).md",
        "Sonic the Hedgehog (USA).md",
        "Sonic the Hedgehog 2 (USA) (Rev-B).md",
        "Sonic the Hedgehog 3 (USA).md",
        "Sorcerer's Kingdom (USA) (Rev-A).md",
        "Space Harrier II (USA).md",
        "Space Invaders '91 (USA).md",
        "Sparkster (USA).md",
        "Speedball 2 - Brutal Deluxe (USA).md",
        "Spider-Man - The Animated Series (USA).md",
        "Spider-Man and the X-Men in Arcade's Revenge (USA).md",
        "Spider-Man and Venom - Maximum Carnage (USA).md",
        "Spider-Man and Venom - Separation Anxiety (USA).md",
        "Spider-Man vs. The Kingpin (USA).md",
        "Splatterhouse 2 (USA).md",
        "Splatterhouse 3 (USA).md",
        "Spot Goes to Hollywood (USA).md",
        "Star Trek - Deep Space Nine - Crossroads of Time (USA).md",
        "Star Trek - The Next Generation - Echoes from the Past (USA) (Rev-A).md",
        "Starflight (USA) (Rev-A).md",
        "Stargate (USA).md",
        "Steel Empire (USA).md",
        "Street Fighter II' - Special Champion Edition (USA).md",
        "Street Racer (Europe).md",
        "Streets of Rage (USA) (Rev-A).md",
        "Streets of Rage 2 (USA).md",
        "Streets of Rage 3 (USA).md",
        "Strider (USA).md",
        "Strider Returns - Journey from Darkness (USA).md",
        "Striker (Europe).md",
        "Sub-Terrania (USA).md",
        "Sunset Riders (USA).md",
        "Super Fantasy Zone (Europe).md",
        "Super Hang-On (USA) (Rev-A).md",
        "Super Hydlide (USA).md",
        "Super Skidmarks (Europe) (J-Cart).md",
        "Super Smash T.V. (USA).md",
        "Super Street Fighter II (USA).md",
        "Superman (USA).md",
        "Sword of Vermilion (USA).md",
        "Syd of Valis (USA).md",
        "Sylvester and Tweety in Cagey Capers (USA).md",
        "Syndicate (USA).md",
        "T2 - The Arcade Game (USA).md",
        "Target Earth (USA).md",
        "Taz in Escape from Mars (USA).md",
        "Taz-Mania (USA).md",
        "Technoclash (USA).md",
        "Teenage Mutant Ninja Turtles - The Hyperstone Heist (USA).md",
        "Teenage Mutant Ninja Turtles - Tournament Fighters (USA).md",
        "Terminator 2 - Judgment Day (USA).md",
        "Terminator, The (USA).md",
        "Tetris (USA) (Sega Genesis Mini).md",
        "Tiny Toon Adventures - ACME All-Stars (USA).md",
        "Tiny Toon Adventures - Buster's Hidden Treasure (USA).md",
        "Tom and Jerry - Frantic Antics! (USA).md",
        "Top Gear 2 (USA).md",
        "Ultimate Mortal Kombat 3 (USA).md",
        "Virtua Fighter 2 (USA).md",
        "Virtua Racing (USA).md",
        "Virtual Bart (USA).md",
        "Where in the World Is Carmen Sandiego (USA).md",
        "Whip Rush (USA).md",
        "Williams Arcade's Greatest Hits (USA).md",
        "Wings of Wor (USA).md",
        "Wolfchild (USA).md",
        "Wolverine - Adamantium Rage (USA).md",
        "Wonder Boy III - Monster Lair (Europe).md",
        "Wonder Boy in Monster World (USA).md",
        "World of Illusion Starring Mickey Mouse and Donald Duck (USA).md",
        "Worms (Europe).md",
        "Wrestle War (Europe).md",
        "WWF Raw (USA).md",
        "WWF Royal Rumble (USA).md",
        "WWF Super WrestleMania (USA).md",
        "WWF WrestleMania - The Arcade Game (USA).md",
        "X-Men (USA).md",
        "X-Men 2 - Clone Wars (USA).md",
        "Xenon 2 - Megablast (Europe).md",
        "Ys III (USA).md",
        "Zero the Kamikaze Squirrel (USA).md",
        "Zero Tolerance (USA).md",
        "Zero Wing (Europe).md",
        "Zombies Ate My Neighbors (USA).md",
        "Zool - Ninja of the ''Nth'' Dimension (USA).md",
        "Zoom! (USA).md",
        "Zoop (USA).md"
    ];

    ROMS.forEach(rom => {
        const opt = document.createElement('option');
        opt.value = rom;
        // Clean display name
        opt.textContent = rom.replace(/\.(md|bin|smd)$/i, '').replace(/_/g, ' ');
        dropdown.appendChild(opt);
    });

    async function findRomUrl(baseName) {
        const root = 'Emulators/genesis/roms/';
        // Smart filename guessing
        const variations = [
            baseName, 
            baseName.toLowerCase(), 
            baseName.toUpperCase(), 
            baseName.replace(/\.[^/.]+$/, "") + ".md", 
            baseName.replace(/\.[^/.]+$/, "") + ".bin"
        ];
        for (const filename of [...new Set(variations)]) {
            const testUrl = chrome.runtime.getURL(root + filename);
            try { const r = await fetch(testUrl, { method: 'HEAD' }); if (r.ok) return testUrl; } catch (e) {}
        }
        throw new Error(`ROM not found: ${baseName}`);
    }

    async function findCorePaths() {
        const possibleFolders = ["Emulators/genesis/cores/", "Emulators/genesis/data/", "Emulators/genesis/"];
        for (const folder of possibleFolders) {
            const jsUrl = chrome.runtime.getURL(folder + "genesis_plus_gx_libretro.js");
            try { const r = await fetch(jsUrl, { method: 'HEAD' }); if (r.ok) return { js: jsUrl, wasm: chrome.runtime.getURL(folder + "genesis_plus_gx_libretro.wasm") }; } catch (e) {}
        }
        throw new Error("Core engine files not found.");
    }

    dropdown.onchange = async () => {
        const romName = dropdown.value;
        dropdown.blur();
        if (termInput) termInput.blur(); 

        debugLog.innerHTML = `<span style="color:yellow">Initializing System...</span>`;
        
        const oldIframe = displayWrapper.querySelector('iframe');
        if(oldIframe) oldIframe.remove();

        try {
            const romUrl = await findRomUrl(romName);
            const corePaths = await findCorePaths();
            const romResponse = await fetch(romUrl);
            const romBlob = await romResponse.blob();

            const iframe = document.createElement('iframe');
            iframe.src = chrome.runtime.getURL("emulator_sandbox.html");
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
                    romBlob: romBlob,
                    coreConfig: {
                        name: 'genesis_plus_gx',
                        js: corePaths.js,
                        wasm: corePaths.wasm
                    }
                }, '*');
                iframe.contentWindow.focus();
            };

            // FIX 2: Clear old listener again before adding new one
            if (window._genesisListener) {
                window.removeEventListener('message', window._genesisListener);
            }

            // FIX 3: Assign to GLOBAL variable so it persists/updates correctly
            window._genesisListener = function(e) {
                if (e.data.status === 'save_success') {
                    localStorage.setItem(`gen_save_slot_${currentSlot}`, e.data.data);
                    debugLog.innerHTML = `<span style="color:#0f0;">STATE SAVED [SLOT ${currentSlot}]</span>`;
                    setTimeout(() => debugLog.innerHTML = "", 2000);
                }
                else if (e.data.status === 'request_load') {
                    const savedData = localStorage.getItem(`gen_save_slot_${currentSlot}`);
                    if (savedData) {
                        iframe.contentWindow.postMessage({ command: 'load_state', stateData: savedData }, '*');
                        debugLog.innerHTML = `<span style="color:yellow;">LOADING SLOT ${currentSlot}...</span>`;
                    } else {
                        debugLog.innerHTML = `<span style="color:red;">SLOT ${currentSlot} EMPTY</span>`;
                        setTimeout(() => debugLog.innerHTML = "", 2000);
                    }
                }
                else if (e.data.status === 'load_complete') {
                    debugLog.innerHTML = `<span style="color:#0f0;">LOAD COMPLETE</span>`;
                    setTimeout(() => debugLog.innerHTML = "", 2000);
                }
                else if (e.data.status === 'running') {
                    debugLog.innerHTML = "";
                } 
                else if (e.data.status === 'error') {
                    debugLog.innerHTML = `[ERROR] ${e.data.message}`;
                } 
                else if (e.data.status === 'gamepad_connected') {
                    debugLog.innerHTML = `<span style="color:#0f0;">GAMEPAD READY: ${e.data.id.substring(0, 15)}...</span>`;
                    setTimeout(() => debugLog.innerHTML = "", 3000);
                }
            };

            window.addEventListener('message', window._genesisListener);

        } catch (e) {
            console.error(e);
            debugLog.innerHTML = `[SYSTEM ERROR] ${e.message}`;
        }
    };
};