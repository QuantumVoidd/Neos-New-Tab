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

    let currentSlot = 1;

    output.innerHTML = `
        <div class="nes-terminal-wrapper">
            <p style="color:#00ff41; font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;">[ GBA_MAINFRAME ]</p>
            <div style="display:flex; justify-content:center; margin-bottom:10px;">
                <select id="gba-rom-select" class="nes-model-selector" style="flex-grow:1; max-width:300px; margin-right: 10px;">
                    <option value="" disabled selected>> INSERT CARTRIDGE...</option>
                </select>
                <select id="gba-slot-select" class="nes-model-selector" style="width: auto; min-width: 100px;">
                    <option value="1" selected>SLOT 1</option>
                    <option value="2">SLOT 2</option>
                    <option value="3">SLOT 3</option>
                    <option value="4">SLOT 4</option>
                    <option value="5">SLOT 5</option>
                </select>
            </div>
            <div id="gba-display-wrapper" class="nes-screen-container" style="position: relative; border: 1px solid #00ff41; width: 100%; aspect-ratio: 3 / 2; background: black url('${chrome.runtime.getURL("Emulators/gba/cover.jpg")}') no-repeat center center; background-size: cover;">
                <button id="gba-fullscreen-btn" class="nes-overlay-btn btn-top-right" title="Fullscreen" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #00ff41; color:#00ff41; cursor:pointer;">&#9974;</button>
                <button id="gba-mute-btn" data-muted="false" class="nes-overlay-btn btn-bottom-right" title="Mute Audio" style="border-radius:50%; width:30px; height:30px; display:flex; justify-content:center; align-items:center; position:absolute; bottom:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border:1px solid #00ff41; color:#00ff41; cursor:pointer;">&#128266;</button>
            </div>
            <div id="debug-log" style="color:red; font-family:'Courier New'; font-size:12px; margin-top:5px; height:20px;"></div>
            <div style="display: block; width: 100%; box-sizing: border-box; margin: 5px auto 0 auto; font-size:0.65rem; opacity:0.7; font-family: 'Courier New', monospace; text-align:center; line-height:1.5;"><span style="color:#fff;">CONTROLS:</span> WASD = D-PAD | ENTER = <span style="color:#fff;">START</span> | SHIFT = <span style="color:#fff;">SELECT</span><br>BACKSPACE = <span style="color:#fff;">B</span> | SPACE = <span style="color:#fff;">A</span> | Q = <span style="color:#fff;">L</span> | E = <span style="color:#fff;">R</span><br><span style="color:#aaa;">[1] SAVE | [4] LOAD | [P] FAST FWD</span></div>
        </div>`;

    const dropdown = document.getElementById('gba-rom-select');
    const slotSelect = document.getElementById('gba-slot-select');
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

    const handleHotkeys = (e) => {
        const iframe = displayWrapper.querySelector('iframe');
        if (!iframe) return;
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
        if (e.key === '1') {
            e.stopImmediatePropagation();
            iframe.contentWindow.postMessage({ command: 'save_state', slot: currentSlot }, '*');
        }
        if (e.key === '4') {
            e.stopImmediatePropagation();
            window._gbaListener({ data: { status: 'request_load' } });
        }
    };
    window.addEventListener('keydown', handleHotkeys, true);

    ['mousedown', 'click', 'mouseup', 'focus'].forEach(event => {
        dropdown.addEventListener(event, (e) => e.stopPropagation());
        slotSelect.addEventListener(event, (e) => e.stopPropagation());
    });

    slotSelect.addEventListener('change', (e) => {
        currentSlot = parseInt(e.target.value);
        const exists = localStorage.getItem(`gba_save_slot_${currentSlot}`) ? "DATA FOUND" : "EMPTY";
        debugLog.innerHTML = `<span style="color:#00ff41;">SLOT ${currentSlot} SELECTED [${exists}]</span>`;
    });

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
        "Austin Powers - Oh, Behave! (USA).gbc",
        "Austin Powers - Welcome to my Underground Lair! (USA).gbc",
        "Batman Beyond - Return of the Joker (USA).gbc",
        "Blade (USA, Europe).gbc",
        "Buffy the Vampire Slayer (USA, Europe).gbc",
        "Bugs Bunny - Crazy Castle 3 (USA, Europe) (GB Compatible).gbc",
        "Bugs Bunny in Crazy Castle 4 (USA).gbc",
        "Buzz Lightyear of Star Command (USA, Europe).gbc",
        "Carmageddon - Carpocalypse Now (USA, Europe) (En,Fr,Es,It).gbc",
        "Catwoman (USA).gbc",
        "Chicken Run (USA, Europe) (En,Fr,De,Es,It).gbc",
        "Crash Bandicoot - Purple Riptos Rampage.gba",
        "Crash Bandicoot - the Huge Adventure.gba",
        "Crash Bandicoot 2 - N-Tranced.gba",
        "Dexter's Laboratory - Robot Rampage (USA, Europe).gbc",
        "Dinosaur (USA).gbc",
        "Dragon Ball Z - Legendary Super Warriors (USA).gbc",
        "Flintstones, The - Burgertime in Bedrock (USA).gbc",
        "Godzilla - The Series (USA) (En,Fr,De) (GB Compatible).gbc",
        "Godzilla - The Series - Monster Wars (USA) (En,Fr,De).gbc",
        "Grand Theft Auto (USA) (GB Compatible).gbc",
        "Grand Theft Auto 2 (USA).gbc",
        "Grand Theft Auto Advance.gba",
        "Harry Potter and the Chamber of Secrets (USA, Europe) (En,Fr,De,Es,It,Nl,Pt,Sv,Da).gbc",
        "Harry Potter and the Sorcerer's Stone (USA, Europe) (En,Fr,De,Es,It,Nl,Pt,Sv,No,Da,Fi).gbc",
        "Hot Wheels - Stunt Track Driver (USA, Europe) (SGB Enhanced) (GB Compatible).gbc",
        "Inspector Gadget - Operation Madkactus (USA).gbc",
        "Land Before Time, The (USA).gbc",
        "Legend of Zelda, The - Link's Awakening DX (USA, Europe) (SGB Enhanced) (GB Compatible).gbc",
        "Legend of Zelda, The - Oracle of Ages (USA).gbc",
        "Legend of Zelda, The - Oracle of Seasons (USA).gbc",
        "LEGO Alpha Team (USA).gbc",
        "LEGO Island 2 - The Brickster's Revenge (USA) (En,Fr,Es).gbc",
        "LEGO Racers (USA) (En,Fr,Es).gbc",
        "LEGO Stunt Rally (USA).gbc",
        "Lion King, The - Simba's Mighty Adventure (USA, Europe).gbc",
        "Looney Tunes (USA) (GB Compatible).gbc",
        "Looney Tunes - Carrot Crazy (USA) (En,Fr,Es) (GB Compatible).gbc",
        "Looney Tunes - Twouble! (USA) (En,Fr,Es) (GB Compatible).gbc",
        "Looney Tunes Collector - Alert! (USA) (En,Fr,Es).gbc",
        "Looney Tunes Racing (USA) (En,Fr,De,Es,It,Nl).gbc",
        "M&M's Minis Madness (USA).gbc",
        "Men in Black - The Series (USA, Europe) (SGB Enhanced) (GB Compatible).gbc",
        "Men in Black 2 - The Series (USA) (En,Fr,De).gbc",
        "Metal Gear Solid (USA).gbc",
        "Missile Command (USA) (Rumble Version).gbc",
        "Monsters, Inc. (USA, Europe).gbc",
        "Mortal Kombat 4 (USA, Europe) (SGB Enhanced) (GB Compatible).gbc",
        "Ms. Pac-Man - Special Color Edition (USA) (SGB Enhanced) (GB Compatible).gbc",
        "New Batman Adventures, The - Chaos in Gotham (USA).gbc",
        "Nicktoons Racing (USA).gbc",
        "Pac-Man - Special Color Edition (USA) (SGB Enhanced) (GB Compatible).gbc",
        "Pac-Man Redux.gb",
        "Paperboy (USA, Europe).gbc",
        "Pokemon - Blue Version (USA, Europe) (SGB Enhanced).gb",
        "Pokemon - Crystal Version (USA, Europe).gbc",
        "Pokemon - Emerald Version (USA, Europe).gba",
        "Pokemon - Fire Red.gba",
        "Pokemon - Gold Version (USA, Europe) (SGB Enhanced) (GB Compatible).gbc",
        "Pokemon - Leaf Green Version (USA).gba",
        "Pokemon - Red Version (USA, Europe) (SGB Enhanced).gb",
        "Pokemon - Ruby Version (USA).gba",
        "Pokemon - Sapphire Version (USA).gba",
        "Pokemon - Silver Version (USA, Europe) (SGB Enhanced) (GB Compatible).gbc",
        "Pokemon - Yellow Version - Special Pikachu Edition (USA, Europe) (GBC,SGB Enhanced).gb",
        "Pokemon Battle Factory.gb",
        "Pokemon Blue Kaizo.gb",
        "Pokemon Blue Version (Colorization).gb",
        "Pokemon Brown Version.gb",
        "Pokemon Crystal Kaizo.gbc",
        "Pokemon Crystal Version (Emu Edition).gbc",
        "Pokemon Gold Version (Emu Edition).gbc",
        "Pokemon Pinball (USA) (Rumble Version) (SGB Enhanced) (GB Compatible).gbc",
        "Pokemon Prism Version.gbc",
        "Pokemon Puzzle Challenge (USA).gbc",
        "Pokemon Pyrite Version.gbc",
        "Pokemon Red Version (Colorization).gb",
        "Pokemon Red Version++.gb",
        "Pokemon Trading Card Game (USA) (SGB Enhanced) (GB Compatible).gbc",
        "Pokemon TRE - Team Rocket Edition.gb",
        "Pokemon Yellow Version - Special Pikachu Edition (Enhanced).gb",
        "Power Rangers - Lightspeed Rescue (USA, Europe).gbc",
        "Power Rangers - Time Force (USA, Europe).gbc",
        "Rayman (USA) (En,Fr,De,Es,It,Nl).gbc",
        "Rayman 2 - The Great Escape (USA) (En,Fr,De,Es,It).gbc",
        "Resident Evil Gaiden (USA).gbc",
        "Rugrats - Time Travelers (USA, Europe) (GB Compatible).gbc",
        "Rugrats - Totally Angelica (USA, Europe).gbc",
        "Rugrats in Paris - The Movie (USA, Europe).gbc",
        "Rugrats Movie, The (USA) (SGB Enhanced) (GB Compatible).gbc",
        "Sabrina - The Animated Series - Spooked! (USA, Europe).gbc",
        "Sabrina - The Animated Series - Zapped! (USA, Europe).gbc",
        "Scooby-Doo! - Classic Creep Capers (USA, Europe).gbc",
        "Simpsons Itchy & Scratchy, The - Miniature Golf Madness (USA, Europe).gb",
        "Simpsons, The - Bart & the Beanstalk (USA, Europe).gb",
        "Simpsons, The - Bart vs. the Juggernauts (USA, Europe).gb",
        "Snow Bros. Jr. (USA).gb",
        "Space Invaders (USA, Europe) (GB Compatible).gbc",
        "Spider-Man (USA, Europe).gb",
        "Spider-Man - X-Men (USA, Europe).gb",
        "Spider-Man 2 (USA, Europe).gb",
        "Spider-Man 2 - The Sinister Six (USA, Europe).gbc",
        "Spider-Man 3 - Invasion of the Spider-Slayers (USA, Europe).gb",
        "SpongeBob SquarePants - Legend of the Lost Spatula (USA, Europe).gbc",
        "Star Trek - 25th Anniversary (USA, Europe).gb",
        "Star Trek - The Next Generation (USA, Europe).gb",
        "Star Trek Generations - Beyond the Nexus (USA) (SGB Enhanced).gb",
        "Star Wars (USA).gb",
        "Star Wars - The Empire Strikes Back (USA).gb",
        "Star Wars Episode I - Obi-Wan's Adventures (USA).gbc",
        "Star Wars Episode I - Racer (USA, Europe) (Rumble Version).gbc",
        "Stargate (USA, Europe).gb",
        "Stuart Little - The Journey Home (USA, Europe).gbc",
        "Super Mario Bros. Deluxe (USA, Europe).gbc",
        "Super Mario Land (World).gb",
        "Super Mario Land 2 - 6 Golden Coins (USA, Europe).gb",
        "Super Mario Land 2 DX.gb",
        "Super Mario Land X.gb",
        "Super Star Wars - Return of the Jedi (USA, Europe) (SGB Enhanced).gb",
        "Tarzan (USA, Europe).gbc",
        "Taz-Mania (USA, Europe).gb",
        "Taz-Mania 2 (USA).gb",
        "Tazmanian Devil - Munching Madness (USA) (En,Fr,De,Es,It) (GB Compatible).gbc",
        "Tetris DX (World) (SGB Enhanced) (GB Compatible).gbc",
        "Tom & Jerry (USA, Europe).gbc",
        "Tom and Jerry - Mousehunt (USA) (En,Fr,Es).gbc",
        "Tom and Jerry in Mouse Attacks! (USA).gbc",
        "Tom Clancy's Rainbow Six (USA, Europe) (En,Fr,De).gbc",
        "Tom Clancy's Rainbow Six (USA, Europe) (En,Fr,De).gbc",
        "Tomb Raider (USA, Europe) (En,Fr,De,Es,It).gbc",
        "Tomb Raider - Curse of the Sword (USA, Europe).gbc",
        "Top Gun - Fire Storm (USA, Europe) (En,Fr,De,Es,It,Nl).gbc",
        "Toy Story 2 (USA, Europe) (SGB Enhanced) (GB Compatible).gbc",
        "Toy Story Racer (USA, Europe).gbc",
        "Turok - Rage Wars (USA, Europe) (En,Fr,De,Es).gbc",
        "Turok 2 - Seeds of Evil (USA, Europe) (En,Fr,De,Es) (GB Compatible).gbc",
        "Turok 3 - Shadow of Oblivion (USA, Europe) (En,Fr,De,Es).gbc",
        "Ultimate Fighting Championship (USA).gbc",
        "Who Framed Roger Rabbit (USA).gb",
        "Who Wants to Be a Millionaire - 2nd Edition (USA).gbc",
        "Wild Thornberrys, The - Rambler (USA).gbc",
        "Yu-Gi-Oh! - Dark Duel Stories (USA).gbc"
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
                    retroarchConfig: gbaRetroarchConfig 
                }, '*');
                iframe.contentWindow.focus();
            };
        } catch (e) { debugLog.innerHTML = `[ERROR] ${e.message}`; }
    };

    window._gbaListener = function(e) {
        const iframe = displayWrapper.querySelector('iframe');
        if (e.data.status === 'save_success') {
            localStorage.setItem(`gba_save_slot_${currentSlot}`, e.data.data);
            debugLog.innerHTML = `<span style="color:#00ff41;">STATE SAVED [SLOT ${currentSlot}]</span>`;
        }
        else if (e.data.status === 'request_load') {
            const savedData = localStorage.getItem(`gba_save_slot_${currentSlot}`);
            if (savedData && iframe) {
                iframe.contentWindow.postMessage({ command: 'load_state', stateData: savedData }, '*');
                debugLog.innerHTML = `<span style="color:yellow;">LOADING SLOT ${currentSlot}...</span>`;
            } else {
                debugLog.innerHTML = `<span style="color:red;">SLOT ${currentSlot} EMPTY</span>`;
            }
        }
        else if (e.data.status === 'load_complete') {
            debugLog.innerHTML = `<span style="color:#00ff41;">LOAD COMPLETE</span>`;
        }
        else if (e.data.status === 'gamepad_save') {
             iframe.contentWindow.postMessage({ command: 'save_state', slot: currentSlot }, '*');
        }
        else if (e.data.status === 'gamepad_load') {
             window._gbaListener({ data: { status: 'request_load' } });
        }
    };
    window.addEventListener('message', window._gbaListener);
};