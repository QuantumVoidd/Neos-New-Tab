// Base Matrix Config
const canvas = document.getElementById('matrix'), ctx = canvas.getContext('2d');
const sCanvas = document.getElementById('sentinel-layer'), sCtx = sCanvas.getContext('2d');
const mainContainer = document.querySelector('.main-container');
const MATRIX_ALPHABET = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789", BINARY_ALPHABET = "01", CLASSIC_GREEN = "#00FF41", fontSize = 16;
const HEX_ALPHABET = "0123456789ABCDEF";
const MATRIX_QUOTES = ["There is no spoon.", "Free your mind.", "I know kung fu.", "Follow the white rabbit.", "The answer is out there.", "Welcome to the desert of the real.", "Ignorance is bliss.", "Choice is an illusion."];

const DEFAULTS = { rainColor: "#00f2ff", rainSpeed: 35, uiScale: "1", textScale: "1.2", showMinutes: true, showSeconds: false, use24Hour: false, isMatrixGreen: false, isBinary: false, isHex: false, isCyberpunkFont: false, isFlashing: false, isTransparent: false, isGlow: false, isScanline: false, isBgFilter: false, isGlitch: false, glitchIntensity: 5, scaleMode: "cover", isCycling: false, customQuote: "", isSnowing: false, isPhoneEnabled: true, phoneFrequency: 3, isChatEnabled: true, isRssEnabled: false, rssSubs: "matrix+cyberpunk", isStatsEnabled: true, isRainAmbience: false, isHumEnabled: false, isMatrixSfxEnabled: false, envVolume: 0.5 };

let rainColor = DEFAULTS.rainColor, rainSpeed = DEFAULTS.rainSpeed, rainInterval, rainDrops = [], showMinutes = DEFAULTS.showMinutes, showSeconds = DEFAULTS.showSeconds, use24Hour = DEFAULTS.use24Hour, isMatrixGreen = DEFAULTS.isMatrixGreen, isBinary = DEFAULTS.isBinary, isHex = DEFAULTS.isHex, isFlashing = DEFAULTS.isFlashing, currentAlphabet = MATRIX_ALPHABET, quoteInterval;

let isPhoneEnabled = DEFAULTS.isPhoneEnabled, phoneFrequency = DEFAULTS.phoneFrequency, ringCycleInterval;
let isChatEnabled = DEFAULTS.isChatEnabled;

// --- DIAGNOSTICS STATE ---
let lastCpuInfo = null;

// --- CLI OVERLAY & COMMANDS ---
const showZionMessage = (msg) => {
    const overlay = document.createElement('div');
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; z-index:10000; font-family:'Orbitron', sans-serif; color:var(--theme-color); text-align:center; padding:40px; border: 2px solid var(--theme-color); box-shadow: inset 0 0 20px var(--theme-color), 0 0 20px var(--theme-color); box-sizing: border-box;";
    overlay.innerHTML = `<div><div style="font-size:1.5rem; margin-bottom:30px; white-space:pre-wrap; text-shadow: 0 0 10px var(--theme-color);">${msg}</div><button id="zion-close" style="background:transparent; color:var(--theme-color); border:1px solid var(--theme-color); padding:10px 30px; cursor:pointer; font-family:inherit; font-weight:bold; letter-spacing:2px; box-shadow: 0 0 10px var(--theme-color);">DISMISS</button></div>`;
    document.body.appendChild(overlay);
    document.getElementById('zion-close').onclick = () => overlay.remove();
};

const CLI_COMMANDS = {
    '/help': () => showZionMessage("SYSTEM COMMANDS:\n/weather [city] - Satellite Uplink\n/ghost [0-1] - UI Transparency\n/speed [10-100] - Rain Velocity\n/color [hex] - Theme Update\n/alphabet [matrix|binary|hex] - Character Swap\n/font [cyber|classic] - Change Typography\n/glitch - Trigger System Distortion\n/night - Toggle Stealth Mode\n/quote [text] - Broadcast Custom Mantra\n/whoami - Advanced Identity Trace\n/jackin - Overclock Stream\n/clear - Flush Terminal\n/white-rabbit - Random Mantra\n/nodes - Link Count\n/reset - Factory Reset"),
    '/font': (type) => {
        const mode = type.toLowerCase().trim();
        const fontT = document.getElementById('font-toggle');
        if (mode === 'cyber') {
            document.body.classList.add('cyberpunk-font');
            if(fontT) fontT.checked = true;
            chrome.storage.sync.set({ isCyberpunkFont: true });
            showZionMessage("TYPOGRAPHY: CYBER DATA-STREAM ACTIVE");
        } else if (mode === 'classic') {
            document.body.classList.remove('cyberpunk-font');
            if(fontT) fontT.checked = false;
            chrome.storage.sync.set({ isCyberpunkFont: false });
            showZionMessage("TYPOGRAPHY: CLASSIC TERMINAL ACTIVE");
        } else { return showZionMessage("Usage: /font [cyber|classic]"); }
    },
    '/night': () => {
        const isNight = document.body.classList.toggle('night-mode-active');
        const glowT = document.getElementById('glow-toggle');
        const greenT = document.getElementById('matrix-green');
        if (isNight) {
            mainContainer.style.opacity = "0.4";
            document.body.classList.add('glow-active');
            isMatrixGreen = true;
            if(glowT) glowT.checked = true;
            if(greenT) greenT.checked = true;
            syncThemeColor();
            chrome.storage.sync.set({ isGlow: true, isMatrixGreen: true });
            showZionMessage("STEALTH PROTOCOL ENGAGED\nVISUAL SIGNATURE MINIMIZED");
        } else {
            mainContainer.style.opacity = "1";
            const savedGlow = glowT ? glowT.checked : false;
            if (!savedGlow) document.body.classList.remove('glow-active');
            isMatrixGreen = greenT ? greenT.checked : false;
            syncThemeColor();
            chrome.storage.sync.set({ isGlow: savedGlow, isMatrixGreen: isMatrixGreen });
            showZionMessage("STEALTH PROTOCOL DEACTIVATED");
        }
    },
    '/glitch': () => {
        const body = document.body;
        const root = document.documentElement;
        const oldIntensity = root.style.getPropertyValue('--glitch-intensity');
        const oldColor = rainColor;

        const glitchAudio = new Audio('glitch.mp3');
        
        body.classList.add('glitch-enabled');
        root.style.setProperty('--glitch-intensity', '60px');
        
        const tearInterval = setInterval(() => {
            const randomColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            root.style.setProperty('--theme-color', randomColor);
            body.style.transform = `translateX(${(Math.random() - 0.5) * 50}px) skew(${(Math.random() - 0.5) * 20}deg)`;
            body.style.filter = `hue-rotate(${Math.random() * 360}deg) contrast(200%)`;
        }, 100);

        glitchAudio.play().catch(e => console.error("Glitch audio failed", e));
        showZionMessage("WARNING: SIGNAL INTERFERENCE DETECTED\nLOCAL REALITY COMPROMISED");

        glitchAudio.onended = () => {
            clearInterval(tearInterval);
            if (!get('glitch-toggle').checked) body.classList.remove('glitch-enabled');
            root.style.setProperty('--glitch-intensity', oldIntensity || '5px');
            root.style.setProperty('--theme-color', oldColor);
            body.style.transform = "";
            body.style.filter = "";
            syncThemeColor();
        };
    },
    '/quote': (text) => {
        if (!text) return showZionMessage("Usage: /quote [your message]");
        stopQuoteCycling();
        document.getElementById('cycle-quotes').checked = false;
        document.getElementById('quote-input').value = text;
        const q = document.getElementById('display-quote');
        q.textContent = `"${text}"`;
        chrome.storage.sync.set({ customQuote: text, isCycling: false });
        showZionMessage(`MANTRA BROADCASTING: "${text}"`);
    },
    '/alphabet': (type) => {
        const mode = type.toLowerCase().trim();
        const binaryT = document.getElementById('binary-mode');
        const hexT = document.getElementById('hex-mode');
        
        isBinary = false;
        isHex = false;
        if(binaryT) binaryT.checked = false;
        if(hexT) hexT.checked = false;

        if (mode === 'matrix') { currentAlphabet = MATRIX_ALPHABET; }
        else if (mode === 'binary') { currentAlphabet = BINARY_ALPHABET; isBinary = true; if(binaryT) binaryT.checked = true; }
        else if (mode === 'hex') { currentAlphabet = HEX_ALPHABET; isHex = true; if(hexT) hexT.checked = true; }
        else { return showZionMessage("Usage: /alphabet [matrix|binary|hex]"); }
        
        chrome.storage.sync.set({ isBinary, isHex });
        showZionMessage(`CORE ALPHABET RECONFIGURED: ${mode.toUpperCase()}`);
    },
    '/weather': async (city) => {
        if(!city) return showZionMessage("Usage: /weather [city]");
        try {
            const gR = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
            const gD = await gR.json();
            const { latitude: lat, longitude: lon, name } = gD.results[0];
            const wR = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const wD = await wR.json();
            showZionMessage(`UPLINK SUCCESSFUL\nLOCATION: ${name.toUpperCase()}\nTEMP: ${wD.current_weather.temperature}°C\nWIND: ${wD.current_weather.windspeed}km/h`);
        } catch (e) { showZionMessage("UPLINK FAILED: Location Not Found"); }
    },
    '/ghost': (v) => { mainContainer.style.opacity = parseFloat(v) || 0.2; },
    '/speed': (v) => { if(v) { rainSpeed = parseInt(v); startRain(); chrome.storage.sync.set({ rainSpeed }); }},
    '/color': (v) => { if(v) { document.getElementById('color-picker').value = v; syncThemeColor(); chrome.storage.sync.set({ rainColor: v }); }},
    '/whoami': async () => {
        const isBrave = (navigator.brave && await navigator.brave.isBrave()) || false;
        const platform = navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform;
        const browserName = isBrave ? "Brave (Encrypted)" : (navigator.userAgent.includes("Edg") ? "Edge" : "Chrome/Chromium");
        const dpr = window.devicePixelRatio || 1;
        const physicalWidth = Math.round(window.screen.width * dpr);
        const physicalHeight = Math.round(window.screen.height * dpr);
        const info = `IDENTITY TRACE: \nOS: ${platform}\nCORE: ${browserName}\nDPR: ${dpr.toFixed(2)}x (Scaling Factor)\nVIEWPORT: ${window.innerWidth}x${window.innerHeight}\nHARDWARE: ${physicalWidth}x${physicalHeight} (True Resolution)\nUPLINK: ${navigator.onLine ? "SECURE" : "DISCONNECTED"}\n\nSTATUS: YOU ARE THE ONE.`;
        showZionMessage(info);
    },
    '/clear': () => { const log = document.getElementById('chat-log'); if(log) log.innerHTML = ""; },
    '/jackin': () => {
        const oldSpeed = rainSpeed;
        const jackinAudio = new Audio('jackin.mp3');
        
        rainSpeed = 5; 
        startRain();
        
        jackinAudio.play().catch(e => console.error("Jackin audio failed", e));
        
        jackinAudio.onended = () => {
            rainSpeed = oldSpeed;
            startRain();
        };
    },
    '/white-rabbit': () => {
        const q = MATRIX_QUOTES[Math.floor(Math.random() * MATRIX_QUOTES.length)];
        showZionMessage(`THE CONSTRUCT SAYS:\n"${q}"`);
    },
    '/nodes': () => {
        chrome.storage.sync.get({ userNavLinks: [] }, (data) => {
            showZionMessage(`SECURE NODES IDENTIFIED: ${data.userNavLinks.length}/10`);
        });
    },
    '/reset': () => { if(confirm("Hard Reset?")) { chrome.storage.sync.clear(); location.reload(); }}
};

// --- INDEXEDDB FOR STORAGE ---
const dbName = "MatrixBackdropDB";
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 3);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("videos")) db.createObjectStore("videos");
            if (!db.objectStoreNames.contains("audios")) db.createObjectStore("audios", { autoIncrement: true });
            if (!db.objectStoreNames.contains("sfx")) db.createObjectStore("sfx");
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveVideoToDB(file) {
    const db = await openDB();
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").put(file, "customVideo");
}

async function loadVideoFromDB() {
    const db = await openDB();
    return new Promise((resolve) => {
        const request = db.transaction("videos").objectStore("videos").get("customVideo");
        request.onsuccess = () => resolve(request.result);
    });
}

async function clearVideoFromDB() {
    const db = await openDB();
    db.transaction("videos", "readwrite").objectStore("videos").delete("customVideo");
}

async function saveAudioToDB(file) {
    const db = await openDB();
    const tx = db.transaction("audios", "readwrite");
    tx.objectStore("audios").add(file);
}

async function getAudiosFromDB() {
    const db = await openDB();
    return new Promise((resolve) => {
        const request = db.transaction("audios").objectStore("audios").getAll();
        request.onsuccess = () => resolve(request.result || []);
    });
}

async function clearAudiosFromDB() {
    const db = await openDB();
    db.transaction("audios", "readwrite").objectStore("audios").clear();
}

async function saveSfxToDB(file) {
    const db = await openDB();
    const tx = db.transaction("sfx", "readwrite");
    tx.objectStore("sfx").put(file, "customSfx");
}

async function loadSfxFromDB() {
    const db = await openDB();
    return new Promise((resolve) => {
        const request = db.transaction("sfx").objectStore("sfx").get("customSfx");
        request.onsuccess = () => resolve(request.result);
    });
}

async function clearSfxFromDB() {
    const db = await openDB();
    db.transaction("sfx", "readwrite").objectStore("sfx").clear();
}

// --- VISUALS & ANIMATION ---
const sentinelVideo = document.createElement('video');
sentinelVideo.src = 'sentinel.webm';
sentinelVideo.loop = true;
sentinelVideo.muted = true;
sentinelVideo.play().catch(() => {});

let isSnowing = false, snowParticles = [], angle = 0;

function initSnow() {
    snowParticles = [];
    for (let i = 0; i < 12; i++) {
        const layer = Math.random() * 2;
        snowParticles.push({
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            width: 70 + (layer * 60), 
            d: Math.random() * 100, 
            v: 0.5 + (layer * 0.3),
            swaySeed: 1.1 + layer, 
            opacity: 0.4 + (layer * 0.4), 
            flip: 1 
        });
    }
}

function animateSentinels() {
    if (isSnowing && sentinelVideo.readyState >= 2) {
        sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
        angle += 0.008;
        const aspect = sentinelVideo.videoHeight / sentinelVideo.videoWidth;
        for (let p of snowParticles) {
            const h = p.width * aspect;
            p.y += p.v; 
            const drift = Math.sin(angle + p.d) * (p.swaySeed * 1.2);
            p.x += drift; 
            if (drift > 0.1) p.flip = -1; else if (drift < -0.1) p.flip = 1;
            const tilt = drift * 0.05;
            sCtx.save();
            sCtx.translate(Math.floor(p.x), Math.floor(p.y));
            sCtx.rotate(tilt);
            sCtx.scale(p.flip, 1); 
            sCtx.globalAlpha = p.opacity;
            sCtx.shadowBlur = 20;
            sCtx.shadowColor = rainColor;
            sCtx.drawImage(sentinelVideo, -p.width / 2, -h / 2, p.width, h);
            sCtx.restore();
            if (p.y > window.innerHeight + 200) { p.y = -200; p.x = Math.random() * window.innerWidth; }
        }
    } else if (!isSnowing) {
        sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
    }
    requestAnimationFrame(animateSentinels);
}

function resize() { 
    const dpr = window.devicePixelRatio || 1;
    [canvas, sCanvas].forEach(c => {
        c.width = window.innerWidth * dpr;
        c.height = window.innerHeight * dpr;
        c.style.width = window.innerWidth + 'px';
        c.style.height = window.innerHeight + 'px';
    });
    ctx.scale(dpr, dpr);
    sCtx.scale(dpr, dpr);
    const columns = Math.floor(window.innerWidth / fontSize); 
    rainDrops = Array(columns).fill(0).map(() => Math.floor(Math.random() * (window.innerHeight / fontSize))); 
}

function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)"; 
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    if (!isFlashing) ctx.fillStyle = rainColor; 
    ctx.font = fontSize + "px monospace";
    for (let i = 0; i < rainDrops.length; i++) {
        if (isFlashing) ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        const text = currentAlphabet.charAt(Math.floor(Math.random() * currentAlphabet.length));
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
        if (rainDrops[i] * fontSize > window.innerHeight && Math.random() > 0.975) rainDrops[i] = 0; 
        rainDrops[i]++;
    }
}

function startRain() { clearInterval(rainInterval); rainInterval = setInterval(drawMatrix, rainSpeed); }

function updateUI() {
    const now = new Date(), clockEl = document.getElementById('clock'); let hours = now.getHours(); const ampm = hours >= 12 ? 'PM' : 'AM';
    if (!use24Hour) hours = hours % 12 || 12;
    const mins = now.getMinutes().toString().padStart(2, '0'), secs = now.getSeconds().toString().padStart(2, '0');
    let ts = `${hours}`; if (showMinutes) ts += `:${mins}`; if (showSeconds) ts += `:${secs}`; if (!use24Hour) ts += ` ${ampm}`;
    clockEl.textContent = ts; clockEl.setAttribute('data-text', ts);
    document.getElementById('date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const cpuFill = get('cpu-fill'), memFill = get('mem-fill'), pwrFill = get('pwr-fill');

    if (chrome.system && chrome.system.cpu) {
        chrome.system.cpu.getInfo((info) => {
            if (lastCpuInfo) {
                let totalDiff = 0, idleDiff = 0;
                for (let i = 0; i < info.processors.length; i++) {
                    const usage = info.processors[i].usage, lastUsage = lastCpuInfo.processors[i].usage;
                    totalDiff += (usage.user - lastUsage.user) + (usage.kernel - lastUsage.kernel) + (usage.idle - lastUsage.idle);
                    idleDiff += (usage.idle - lastUsage.idle);
                }
                const cpuPercent = Math.max(Math.round((1 - (idleDiff / totalDiff)) * 100), 5);
                if (cpuFill) {
                    cpuFill.style.height = `${cpuPercent}%`;
                    cpuFill.classList.toggle('warning-flash', cpuPercent > 85);
                }
            }
            lastCpuInfo = info;
        });
    }

    if (chrome.system && chrome.system.memory) {
        chrome.system.memory.getInfo((info) => {
            const memPercent = Math.round(((info.capacity - info.availableCapacity) / info.capacity) * 100);
            if (memFill) memFill.style.height = `${memPercent}%`;
        });
    }

    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            const pwrPercent = Math.round(battery.level * 100);
            if (pwrFill) {
                pwrFill.style.height = `${pwrPercent}%`;
                pwrFill.classList.toggle('warning-flash', pwrPercent < 15);
            }
        });
    }
}

// --- ZION NETWORK RSS ---
const rssIntervals = new Map(), rssIterations = new Map();
function decryptRssText(element, targetText, isHovering) {
    if (rssIntervals.has(element)) clearInterval(rssIntervals.get(element));
    let iteration = rssIterations.get(element) || 0;
    const interval = setInterval(() => {
        element.innerText = targetText.split("").map((letter, index) => {
            if (index < iteration) return targetText[index];
            return MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)];
        }).join("");
        if (isHovering) {
            iteration += 1/3;
            if (iteration >= targetText.length) { iteration = targetText.length; element.innerText = targetText; clearInterval(interval); }
        } else {
            iteration -= 1/2;
            if (iteration <= 0) { iteration = 0; element.innerText = targetText.replace(/./g, () => MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)]); clearInterval(interval); }
        }
        rssIterations.set(element, iteration);
    }, 30);
    rssIntervals.set(element, interval);
}

async function updateZionFeed(isSilent = false) {
    const data = await chrome.storage.sync.get(['isRssEnabled', 'rssSubs']);
    const container = get('zion-rss-container'), list = get('rss-feed-list');
    if (!data.isRssEnabled) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');
    if (!isSilent) list.innerHTML = '<div class="rss-meta">Establishing Uplink...</div>';
    try {
        const subs = data.rssSubs || "matrix+cyberpunk";
        const response = await fetch(`https://www.reddit.com/r/${subs}/new.json?limit=10`);
        const json = await response.json();
        list.innerHTML = "";
        json.data.children.forEach(post => {
            const item = post.data;
            const link = document.createElement('a');
            link.className = 'rss-item'; link.href = `https://reddit.com${item.permalink}`; link.target = "_blank";
            const title = document.createElement('div');
            title.className = 'rss-title';
            title.innerText = item.title.replace(/./g, () => MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)]);
            link.innerHTML = `<div class="rss-meta">r/${item.subreddit} • u/${item.author}</div>`;
            link.prepend(title);
            link.onmouseenter = () => decryptRssText(title, item.title, true);
            link.onmouseleave = () => decryptRssText(title, item.title, false);
            list.appendChild(link);
        });
    } catch (e) { if(!isSilent) list.innerHTML = '<div class="rss-meta" style="color:#f00;">Signal Lost: Protocol Error</div>'; }
}

// --- SEARCH & CURSOR ---
const searchInput = document.getElementById('search-input'), cursor = document.getElementById('terminal-cursor');
const measure = document.createElement('span');
measure.style.cssText = "position:absolute; visibility:hidden; white-space:pre; font-family:'Courier New', monospace; font-size:2rem; letter-spacing: 0px;";
document.body.appendChild(measure);

function syncCursor() { 
    measure.textContent = searchInput.value || ""; 
    const textWidth = measure.getBoundingClientRect().width;
    cursor.style.transform = `translateX(${textWidth}px)`; 
}

function updateCursorVisibility() { 
    cursor.style.opacity = (document.activeElement === searchInput) ? "1" : "0"; 
    if (cursor.style.opacity === "1") syncCursor(); 
}

searchInput.addEventListener('input', syncCursor);
searchInput.addEventListener('focus', updateCursorVisibility);
searchInput.addEventListener('blur', updateCursorVisibility);

searchInput.addEventListener('keydown', (e) => { 
    if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        if (val.startsWith('/')) {
            const parts = val.split(' ');
            const cmd = parts[0].toLowerCase();
            if (CLI_COMMANDS[cmd]) { 
                CLI_COMMANDS[cmd](parts.slice(1).join(' ')); 
                searchInput.value = ""; 
            }
            else { showZionMessage("COMMAND UNKNOWN"); }
        } else if (val !== "") {
            chrome.search.query({ text: val });
        }
    }
});

// --- SETTINGS CONTROLS ---
const get = (id) => document.getElementById(id);
const modal = get('settings-modal'), sizeS = get('size-slider'), textScaleS = get('text-scale-slider'), speedS = get('speed-slider'), colorP = get('color-picker');
const minT = get('show-minutes'), secT = get('show-seconds'), hour24T = get('use-24hour'), greenT = get('matrix-green'), binaryT = get('binary-mode'), hexT = get('hex-mode'), snowT = get('snow-toggle'), fontT = get('font-toggle'), rainbowT = get('rainbow-toggle'), glowT = get('glow-toggle'), glitchT = get('glitch-toggle'), glitchS = get('glitch-slider'), scanlineT = get('scanline-toggle'), bgFilterT = get('bg-filter-toggle'), bgT = get('bg-toggle'), quoteI = get('quote-input'), saveB = get('save-settings'), scaleS = get('scale-mode'), cycleT = get('cycle-quotes'), resetB = get('restore-defaults');
const imgI = get('image-input'), vidI = get('video-input'), upImgB = get('upload-image-btn'), upVidB = get('upload-video-btn'), clearB = get('clear-backdrop');
const phoneT = get('phone-toggle'), phoneFreqS = get('phone-freq-slider'), phoneFreqVal = get('phone-freq-value'), chatT = get('chat-toggle');
const audI = get('audio-input'), upAudB = get('upload-audio-btn'), clearAudB = get('clear-audios');
const rssT = get('rss-toggle'), rssI = get('rss-input'), statsT = get('stats-toggle');
const rainAmbT = get('rain-ambience-toggle'), humT = get('hum-toggle'), matrixSfxT = get('matrix-sfx-toggle'), envVolS = get('env-volume-slider');
const upSfxB = get('upload-custom-sfx-btn'), sfxI = get('custom-sfx-input'), clearSfxB = get('clear-custom-sfx');

function applyImg(s) { removeM(); const i = document.createElement('img'); i.id = 'bg-image-layer'; i.src = s; mainContainer.prepend(i); }
function applyVid(file) { removeM(); const v = document.createElement('video'); v.id = 'bg-video'; v.src = URL.createObjectURL(file); v.autoplay = v.loop = v.muted = v.playsInline = true; mainContainer.prepend(v); }
function removeM() { const v = get('bg-video'), i = get('bg-image-layer'); if(v) { URL.revokeObjectURL(v.src); v.remove(); } if(i) i.remove(); }

function syncThemeColor() {
    rainColor = isMatrixGreen ? CLASSIC_GREEN : colorP.value;
    colorP.disabled = isMatrixGreen;
    document.documentElement.style.setProperty('--theme-color', rainColor);
    startRain();
}

get('settings-icon-container').onclick = () => modal.classList.toggle('hidden');
greenT.onchange = (e) => { isMatrixGreen = e.target.checked; syncThemeColor(); };
colorP.oninput = () => { if (!isMatrixGreen) syncThemeColor(); };
quoteI.oninput = (e) => { const val = e.target.value; if (val.trim() !== "") { stopQuoteCycling(); cycleT.checked = false; get('display-quote').textContent = `"${val}"`; } else if (!cycleT.checked) { get('display-quote').textContent = '"There is no spoon."'; } };
minT.onchange = (e) => { showMinutes = e.target.checked; updateUI(); };
secT.onchange = (e) => { showSeconds = e.target.checked; updateUI(); };
hour24T.onchange = (e) => { use24Hour = e.target.checked; updateUI(); };

binaryT.onchange = (e) => { 
    isBinary = e.target.checked; 
    if(isBinary) { isHex = false; hexT.checked = false; }
    currentAlphabet = isBinary ? BINARY_ALPHABET : (isHex ? HEX_ALPHABET : MATRIX_ALPHABET); 
};
hexT.onchange = (e) => { 
    isHex = e.target.checked; 
    if(isHex) { isBinary = false; binaryT.checked = false; }
    currentAlphabet = isHex ? HEX_ALPHABET : (isBinary ? BINARY_ALPHABET : MATRIX_ALPHABET);
};

snowT.onchange = (e) => { isSnowing = e.target.checked; if(isSnowing) initSnow(); };
rainbowT.onchange = (e) => isFlashing = e.target.checked;
fontT.onchange = (e) => document.body.classList.toggle('cyberpunk-font', e.target.checked);
glowT.onchange = (e) => document.body.classList.toggle('glow-active', e.target.checked);
glitchT.onchange = (e) => document.body.classList.toggle('glitch-enabled', e.target.checked);
scanlineT.onchange = (e) => get('scanline-overlay').classList.toggle('hidden', !e.target.checked);
bgFilterT.onchange = (e) => document.body.classList.toggle('bg-filter-active', e.target.checked);
bgT.onchange = (e) => mainContainer.classList.toggle('transparent-bg', e.target.checked);
cycleT.onchange = (e) => { if (e.target.checked) { quoteI.value = ""; startQuoteCycling(); } else stopQuoteCycling(); };
speedS.oninput = (e) => { rainSpeed = parseInt(e.target.value); startRain(); };
sizeS.oninput = (e) => mainContainer.style.transform = `translate(-50%, -50%) scale(${e.target.value})`;
textScaleS.oninput = (e) => document.documentElement.style.setProperty('--text-scale', e.target.value);
glitchS.oninput = (e) => document.documentElement.style.setProperty('--glitch-intensity', e.target.value + 'px');
scaleS.onchange = (e) => document.documentElement.style.setProperty('--bg-scale', e.target.value);

phoneT.onchange = (e) => { isPhoneEnabled = e.target.checked; get('phone-container').classList.toggle('hidden', !isPhoneEnabled); setupPhoneInterval(); };
phoneFreqS.oninput = (e) => { phoneFrequency = parseInt(e.target.value); phoneFreqVal.textContent = phoneFrequency; setupPhoneInterval(); };
chatT.onchange = (e) => { isChatEnabled = e.target.checked; get('transmission-terminal').classList.toggle('hidden', !isChatEnabled); };
rssT.onchange = (e) => { chrome.storage.sync.set({ isRssEnabled: e.target.checked }); updateZionFeed(); };
rssI.onchange = (e) => { const val = e.target.value.replace(/,/g, '+').replace(/\s/g, ''); rssI.value = val; chrome.storage.sync.set({ rssSubs: val }); updateZionFeed(); };
statsT.onchange = (e) => get('operator-console').classList.toggle('stats-hidden', !e.target.checked);
rainAmbT.onchange = (e) => { const a = get('ambience-rain'); e.target.checked ? a.play().catch(() => {}) : a.pause(); };
humT.onchange = (e) => { const a = get('ambience-hum'); e.target.checked ? a.play().catch(() => {}) : a.pause(); };
matrixSfxT.onchange = (e) => { const a = get('matrix-code-sfx'); e.target.checked ? a.play().catch(() => {}) : a.pause(); };
envVolS.oninput = (e) => { const v = parseFloat(e.target.value); get('ambience-rain').volume = get('ambience-hum').volume = get('matrix-code-sfx').volume = get('custom-background-sfx').volume = v; };

upSfxB.onclick = () => sfxI.click();
sfxI.onchange = async (e) => { const f = e.target.files[0]; if(!f) return; await saveSfxToDB(f); const a = get('custom-background-sfx'); a.src = URL.createObjectURL(f); a.play().catch(() => {}); };
clearSfxB.onclick = () => { if(confirm("Purge custom SFX?")) { clearSfxFromDB(); get('custom-background-sfx').pause(); get('custom-background-sfx').src = ""; } };

saveB.onclick = () => {
    const s = { rainColor: colorP.value, rainSpeed, uiScale: sizeS.value, textScale: textScaleS.value, showMinutes, showSeconds, use24Hour, isMatrixGreen, isBinary, isHex, isSnowing, isCyberpunkFont: fontT.checked, isFlashing, isGlow: glowT.checked, isGlitch: glitchT.checked, glitchIntensity: glitchS.value, isScanline: scanlineT.checked, isBgFilter: bgFilterT.checked, isTransparent: bgT.checked, scaleMode: scaleS.value, isCycling: checked = cycleT.checked, customQuote: quoteI.value, isPhoneEnabled, phoneFrequency, isChatEnabled, isRssEnabled: rssT.checked, rssSubs: rssI.value, isStatsEnabled: statsT.checked, isRainAmbience: rainAmbT.checked, isHumEnabled: humT.checked, isMatrixSfxEnabled: matrixSfxT.checked, envVolume: envVolS.value };
    chrome.storage.sync.set(s, () => modal.classList.add('hidden'));
};

resetB.onclick = () => { if(confirm("Hard Reset?")) { chrome.storage.sync.clear(); clearVideoFromDB().then(() => clearSfxFromDB()).then(() => location.reload()); } };
upImgB.onclick = () => imgI.click();
imgI.onchange = (e) => { if(!e.target.files[0]) return; const r = new FileReader(); r.onload = (ev) => { applyImg(ev.target.result); chrome.storage.local.set({ customImg: ev.target.result }); clearVideoFromDB(); }; r.readAsDataURL(e.target.files[0]); };
upVidB.onclick = () => vidI.click();
vidI.onchange = (e) => { const f = e.target.files[0]; if(!f) return; applyVid(f); saveVideoToDB(f); chrome.storage.local.remove('customImg'); };
clearB.onclick = () => { removeM(); chrome.storage.local.remove('customImg'); clearVideoFromDB(); };
upAudB.onclick = () => audI.click();
audI.onchange = async (e) => { for(let f of e.target.files) await saveAudioToDB(f); alert("Messages stored."); };
clearAudB.onclick = () => { if(confirm("Purge all messages?")) clearAudiosFromDB(); };

function startQuoteCycling() { stopQuoteCycling(); let idx = 0; quoteInterval = setInterval(() => { const q = get('display-quote'); q.style.opacity = 0; setTimeout(() => { q.textContent = `"${MATRIX_QUOTES[idx]}"`; q.style.opacity = 0.9; idx = (idx + 1) % MATRIX_QUOTES.length; }, 500); }, 15000); }
function stopQuoteCycling() { clearInterval(quoteInterval); }

function setupPhoneInterval() { clearInterval(ringCycleInterval); if (isPhoneEnabled) ringCycleInterval = setInterval(triggerRinging, phoneFrequency * 60000); }
let isProcessingPhone = false;
function triggerRinging() { if (isProcessingPhone || !isPhoneEnabled) return; const a = get('ring-audio'); a.src = "ringing.mp3"; get('phone-container').classList.add('ringing'); a.play().catch(() => {}); }

function initPhoneSystem() {
    const phoneCont = get('phone-container'), transText = get('transmission-text'), transAudio = get('transmission-audio'), ringAudio = get('ring-audio');
    const pool = [["ESTABLISHING LINK...", "CONNECTION SECURED.", "THEY'RE WATCHING YOU, NEO.", "GOODBYE."], ["SYSTEM BREACH...", "KNOCK, KNOCK, NEO.", "FOLLOW THE WHITE RABBIT.", "RUN."]];
    const speak = (t) => { const u = new SpeechSynthesisUtterance(t.toLowerCase().replace(/[^a-zA-Z ,.?!]/g, "")); u.rate = 0.8; u.pitch = 0.1; window.speechSynthesis.speak(u); };
    phoneCont.onclick = async () => {
        if (phoneCont.classList.contains('ringing') && !isProcessingPhone) {
            isProcessingPhone = true; phoneCont.classList.remove('ringing'); ringAudio.pause(); ringAudio.src = ""; phoneCont.classList.add('receiving');
            const userAudios = await getAudiosFromDB();
            if (userAudios.length > 0) {
                const b = userAudios[Math.floor(Math.random() * userAudios.length)]; transAudio.src = URL.createObjectURL(b); transText.textContent = "ENCRYPTED TRANSMISSION..."; transAudio.play().catch(() => {});
                transAudio.onended = () => { URL.revokeObjectURL(transAudio.src); transAudio.src = ""; finishCall(); };
            } else {
                const seq = pool[Math.floor(Math.random() * pool.length)]; let step = 0;
                const timer = setInterval(() => { if (step >= seq.length) { clearInterval(timer); setTimeout(finishCall, 2500); return; } const line = seq[step++]; transText.textContent = line; speak(line); }, 1800);
            }
        }
    };
    function finishCall() { const h = get('hangup-audio'); h.src = "hangup.mp3"; h.play(); h.onended = () => h.src = ""; setTimeout(() => { phoneCont.classList.remove('receiving'); transText.textContent = "INCOMING SIGNAL..."; isProcessingPhone = false; }, 1200); }
    setupPhoneInterval();
}

const CHAT_SCRIPTS = [[{u:"MORPHEUS", t:"Neo, sooner or later you're going to realize...", c:"morpheus"},{u:"MORPHEUS", t:"...there's a difference between knowing the path and walking the path.", c:"morpheus"}],[{u:"TRINITY", t:"Please, Neo. You have to trust me.", c:"trinity"},{u:"NEO", t:"Why?", c:"neo"},{u:"TRINITY", t:"Because you have been down there, Neo. You know that road.", c:"trinity"}],[{u:"AGENT SMITH", t:"It is purpose that created us.", c:"smith"},{u:"AGENT SMITH", t:"Purpose that connects us. Purpose that pulls us.", c:"smith"},{u:"AGENT SMITH", t:"It is purpose that defines us.", c:"smith"}]];
async function runChatTerminal() {
    if (!isChatEnabled) return;
    const s = CHAT_SCRIPTS[Math.floor(Math.random() * CHAT_SCRIPTS.length)]; const l = get('chat-log');
    for (const line of s) { if (!isChatEnabled) break; await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000)); if (l.children.length > 4) l.removeChild(l.firstChild); const d = document.createElement('div'); d.className = 'chat-msg'; d.innerHTML = `<b class="${line.c}">${line.u}:</b> ${line.t}`; l.appendChild(d); }
    setTimeout(runChatTerminal, 10000 + Math.random() * 10000);
}

const navWrapper = get('dynamic-links-wrapper'), addLinkBtn = get('add-link-btn');
function loadNavLinks() {
    chrome.storage.sync.get({ userNavLinks: [] }, (data) => {
        navWrapper.innerHTML = '';
        const count = data.userNavLinks.length; addLinkBtn.style.display = count >= 10 ? 'none' : 'flex'; addLinkBtn.title = `Add Secure Node (${count}/10)`;
        data.userNavLinks.forEach((url, idx) => {
            let domain; try { domain = new URL(url).hostname; } catch (e) { domain = 'node'; }
            const node = document.createElement('div'); node.className = 'nav-icon-circle'; node.title = domain;
            const img = document.createElement('img'); img.src = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
            node.appendChild(img); node.onclick = () => window.location.href = url;
            node.oncontextmenu = (e) => { e.preventDefault(); if(confirm(`Purge node?`)) { data.userNavLinks.splice(idx, 1); chrome.storage.sync.set({ userNavLinks: data.userNavLinks }, loadNavLinks); } };
            navWrapper.appendChild(node);
        });
    });
}
addLinkBtn.onclick = () => { chrome.storage.sync.get({ userNavLinks: [] }, (d) => { if (d.userNavLinks.length >= 10) return; const u = prompt("Input URL:"); if (u) { try { let f = u.trim(); if (!/^https?:\/\//i.test(f)) f = 'https://' + f; new URL(f); d.userNavLinks.push(f); chrome.storage.sync.set({ userNavLinks: d.userNavLinks }, loadNavLinks); } catch (e) {} } }); };

// --- INITIAL LOAD ---
chrome.storage.sync.get(null, (d) => {
    const data = { ...DEFAULTS, ...d };
    rainSpeed = data.rainSpeed; speedS.value = rainSpeed; isMatrixGreen = data.isMatrixGreen; greenT.checked = isMatrixGreen; colorP.value = data.rainColor; syncThemeColor();
    
    isBinary = data.isBinary; binaryT.checked = isBinary;
    isHex = data.isHex; hexT.checked = isHex;
    currentAlphabet = isHex ? HEX_ALPHABET : (isBinary ? BINARY_ALPHABET : MATRIX_ALPHABET);

    isSnowing = data.isSnowing; snowT.checked = isSnowing; if(isSnowing) initSnow();
    isFlashing = data.isFlashing; rainbowT.checked = isFlashing;
    showMinutes = data.showMinutes; minT.checked = showMinutes; showSeconds = data.showSeconds; secT.checked = showSeconds; use24Hour = data.use24Hour; hour24T.checked = use24Hour;
    isPhoneEnabled = data.isPhoneEnabled; phoneT.checked = isPhoneEnabled; phoneFrequency = data.phoneFrequency; phoneFreqS.value = phoneFrequency; phoneFreqVal.textContent = phoneFrequency;
    isChatEnabled = data.isChatEnabled; chatT.checked = isChatEnabled; get('transmission-terminal').classList.toggle('hidden', !isChatEnabled);
    document.body.classList.toggle('cyberpunk-font', data.isCyberpunkFont); fontT.checked = data.isCyberpunkFont;
    document.body.classList.toggle('glow-active', data.isGlow); glowT.checked = data.isGlow;
    document.body.classList.toggle('glitch-enabled', data.isGlitch); glitchT.checked = data.isGlitch;
    document.body.classList.toggle('bg-filter-active', data.isBgFilter); bgFilterT.checked = data.isBgFilter;
    mainContainer.classList.toggle('transparent-bg', data.isTransparent); bgT.checked = data.isTransparent;
    get('scanline-overlay').classList.toggle('hidden', !data.isScanline); scanlineT.checked = data.isScanline;
    document.documentElement.style.setProperty('--text-scale', data.textScale); textScaleS.value = data.textScale;
    document.documentElement.style.setProperty('--bg-scale', data.scaleMode); scaleS.value = data.scaleMode;
    mainContainer.style.transform = `translate(-50%, -50%) scale(${data.uiScale})`; sizeS.value = data.uiScale;
    if (data.customQuote) { quoteI.value = data.customQuote; get('display-quote').textContent = `"${data.customQuote}"`; } else if (data.isCycling) { cycleT.checked = true; startQuoteCycling(); }
    rssT.checked = data.isRssEnabled; rssI.value = data.rssSubs; updateZionFeed();
    const rA = get('ambience-rain'), hA = get('ambience-hum'), mA = get('matrix-code-sfx'), cA = get('custom-background-sfx');
    rainAmbT.checked = data.isRainAmbience; humT.checked = data.isHumEnabled; matrixSfxT.checked = data.isMatrixSfxEnabled;
    envVolS.value = data.envVolume; rA.volume = hA.volume = mA.volume = cA.volume = data.envVolume;
    if(data.isRainAmbience) rA.play().catch(() => {}); if(data.isHumEnabled) hA.play().catch(() => {}); if(data.isMatrixSfxEnabled) mA.play().catch(() => {});
    loadSfxFromDB().then(f => { if(f) { cA.src = URL.createObjectURL(f); cA.play().catch(() => {}); } });
    statsT.checked = data.isStatsEnabled; get('operator-console').classList.toggle('stats-hidden', !data.isStatsEnabled);
    loadNavLinks(); resize(); startRain(); animateSentinels(); updateUI(); initPhoneSystem(); runChatTerminal(); mainContainer.style.opacity = "1";
});

setInterval(() => updateZionFeed(true), 120000);
chrome.storage.local.get(['customImg'], (res) => { if(res.customImg) applyImg(res.customImg); else loadVideoFromDB().then(file => { if(file) applyVid(file); }); });
window.onresize = resize;
setInterval(updateUI, 1000);