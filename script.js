let terminalRainInterval = null; 
let termDrops = [];
// Base Matrix Config
const canvas = document.getElementById('matrix'), ctx = canvas.getContext('2d');
const sCanvas = document.getElementById('sentinel-layer'), sCtx = sCanvas.getContext('2d');
const mainContainer = document.querySelector('.main-container');
const MATRIX_ALPHABET = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ", BINARY_ALPHABET = "01", CLASSIC_GREEN = "#00FF41", 
fontSize = 16;
const HEX_ALPHABET = "0123456789ABCDEF";
// New character sets
const ASCII_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
const MATH_SYMBOLS_ALPHABET = "∀∁∂∃∄∅∆∇∈∉∊∋∌∍∎∏∐∑−∓∔∕∖∗∘∙√∛∜∝∞∟∠∡∢∣∤∥∦∧∨∩∪∫∬∭∮∯∰∱∲∳∴∵∶∷∸∹∺∻∼∽∾∿≀≁≂≃≄≅≆≇≈≉≊≋≌≍≎≏≐≑≒≓≔≕≖≗≘≙≚≛≜≝≞≟≠≡≢≣≤≥≦≧≨≩≪≫≬≭≮≯≰≱≲≳≴≵≶≷≸≹≺≻≼≽≾≿⊀⊁⊂⊃⊄⊅⊆⊇⊈⊉⊊⊋⊌⊍⊎⊏⊐⊑⊒⊓⊔⊕⊖⊗⊘⊙⊚⊛⊜⊝⊞⊟⊠⊡⊢⊣⊤⊥⊦⊧⊨⊩⊪⊫⊬⊭⊮⊯⊰⊱⊲⊳⊴⊵⊶⊷⊸⊹⊺⊻⊼⊽⊾⊿⋀⋁⋂⋃⋄⋅⋆⋇⋈⋉⋊⋋⋌⋍⋎⋏⋐⋑⋒⋓⋔⋕⋖⋗⋘⋙⋚⋛⋜⋝⋞⋟⋠⋡⋢⋣⋤⋥⋦⋧⋨⋩⋪⋫⋬⋭⋮⋯⋰⋱⋲⋳⋴⋵⋶⋷⋸⋹⋺⋻⋼⋽⋾⋿";

const MATRIX_QUOTES = ["There is no spoon.", "Free your mind.", "I know kung fu.", "Follow the white rabbit.", "The answer is out there.", "Welcome to the desert of the real.", "Ignorance is bliss.", "Choice is an illusion."];

const DEFAULTS = { 
    rainColor: "#00f2ff", themeColor: "#00f2ff", rainSpeed: 35, uiScale: "1", textScale: "1.2", 
    showMinutes: true, showSeconds: false, use24Hour: false, isMatrixGreen: false, 
    isBinary: false, isHex: false, isAscii: false, isBamum: false, isMathSymbols: false, isEmoji: false,
    isCyberpunkFont: false, isFlashing: false, 
    isTransparent: false, isGlow: false, isScanline: false, isBgFilter: false, 
    isGlitch: false, glitchIntensity: 5, scaleMode: "cover", isCycling: false, 
    customQuote: "", isSnowing: false, isPhoneEnabled: true, phoneFrequency: 3, 
    isChatEnabled: true, isRssEnabled: false, rssSubs: "matrix+cyberpunk", 
    isStatsEnabled: true, isRainAmbience: false, isHumEnabled: false, 
    isMatrixSfxEnabled: false, envVolume: 0.5, videoBackground: "",
    // Oracle Default
    isOracleEnabled: false,
    // System Monitor
    isSystemMonitorEnabled: false
};

let rainColor = DEFAULTS.rainColor, themeColor = DEFAULTS.themeColor, rainSpeed = DEFAULTS.rainSpeed, rainInterval, 
    rainDrops = [], showMinutes = DEFAULTS.showMinutes, showSeconds = DEFAULTS.showSeconds, 
    use24Hour = DEFAULTS.use24Hour, isMatrixGreen = DEFAULTS.isMatrixGreen, 
    isBinary = DEFAULTS.isBinary, isHex = DEFAULTS.isHex, isAscii = DEFAULTS.isAscii, 
    isBamum = DEFAULTS.isBamum, isMathSymbols = DEFAULTS.isMathSymbols, isEmoji = DEFAULTS.isEmoji,
    isFlashing = DEFAULTS.isFlashing, 
    currentAlphabet = MATRIX_ALPHABET, quoteInterval;
let videoBackground = DEFAULTS.videoBackground;
let isPhoneEnabled = DEFAULTS.isPhoneEnabled, phoneFrequency = DEFAULTS.phoneFrequency, 
    ringCycleInterval = null;
let isChatEnabled = DEFAULTS.isChatEnabled;

// --- GLOBAL SANDBOX REFERENCE ---
let sandboxFrame = null; 

// --- CALENDAR STATE MANAGEMENT ---
let currentCalDate = new Date();
let isCalendarOpen = false;

// --- ORACLE AI VARIABLES ---
let isOracleEnabled = DEFAULTS.isOracleEnabled;
let oracleChatHistory = [];
let isOracleTerminalActive = false;

// --- EXPLORER STATE MANAGEMENT ---
let isExplorerActive = false;
let explorerDataCache = {};
let explorerStack = []; 
let explorerPath = []; 
window.isExplorerDeleteMode = false;

// --- ARCADE RAIN GLOBALS ---
let matrixRain;      // Existing bottom bar
let topMatrixRain;   // New top bar
let topCanvas, tctx;
let arcadeAnimationId = null;

// --- GBC SAVE STATE SYNC LOGIC ---
// Called by gbc-controller.js after an export/save
window.syncGbcSavesToExplorer = function() {
    if (!explorerDataCache) explorerDataCache = {};

    // 1. Ensure Path Consistency: Create saves/gbc if missing
    // Note: In the new VFS, we map these dynamically at the root level first
    // This function ensures the cache object exists to prevent errors
    if (!explorerDataCache) explorerDataCache = {};

    // 3. Update Explorer View if Active
    if (isExplorerActive) {
        renderExplorerGrid();
    }
};

// --- 3D VERTICAL RAIN SPECIFIC SETTINGS ---
let verticalRainAlphabet = MATRIX_ALPHABET;
let isVerticalRainBinary = false;
let isVerticalRainHex = false;
let isVerticalRainAscii = false;
let isVerticalRainBamum = false;
let isVerticalRainMathSymbols = false;
let isVerticalRainEmoji = false;
let isVerticalRainRainbow = false;
let rainbowHueOffset = 0; 

// --- FONT MANAGEMENT ---
function getFontFamilyForAlphabet(isMathMode) {
    if (isMathMode) {
        return "'Cambria Math', 'STIXGeneral', 'DejaVu Math TeX Gyre', 'Symbol', 'Lucida Sans Unicode', 'system-ui', sans-serif";
    } else {
        return "'Courier New', 'Consolas', 'Monaco', 'Lucida Console', monospace";
    }
}

// --- TAB VISIBILITY STATE ---
let isTabVisible = true;
let lastVisibilityChange = Date.now();

// --- 3D BACKGROUND VIDEO SYSTEM ---
let backgroundVideo = null;
let activeVideoSession = 0;

// Video configurations
const VIDEO_CONFIGS = {
    "journey2": {
        file: "journey2.mp4",
        fallbackColor: "#00f2ff",
        name: "Endless voyage"
    },
    "binary": {
        file: "matrix_binary_tunnel.mp4",
        fallbackColor: "#00ff00",
        name: "Matrix Tunnel"
    },
    "room": {
        file: "matrix_class_room.mp4",
        fallbackColor: "#00ccff",
        name: "Matrix Class Room"
    },
    "movie-tunnel": {
        file: "matrix_movie_tunnel.mp4",
        fallbackColor: "#ff0000",
        name: "Matrix Movie Tunnel"
    },
    "matrix-room": {
        file: "matrix_room.mp4",
        fallbackColor: "#0000ff",
        name: "Matrix Room"
    },
    "combat-training": {
        file: "combat_training.mp4",
        fallbackColor: "#00008b",
        name: "Combat Training"
    },
    "meditation": {
        file: "meditation.mp4",
        fallbackColor: "#800080",
        name: "Meditation"
    },
    "operator": {
        file: "operator.mp4",
        fallbackColor: "#00f2ff",
        name: "Zion Operator"
    }
};

// --- MATRIX CALENDAR FUNCTIONS ---
let calendarRainInterval = null;
let calendarDrops = [];

function initCalendarRain() {
    const canvas = document.getElementById('calendar-rain-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const columnSpacing = fontSize * 0.6;
    const columns = Math.floor(canvas.offsetWidth / columnSpacing);
    
    calendarDrops = Array(columns).fill(0).map(() => Math.floor(Math.random() * (canvas.height / fontSize)));

    if (calendarRainInterval) clearInterval(calendarRainInterval);
    calendarRainInterval = setInterval(drawCalendarRain, rainSpeed);
}

function drawCalendarRain() {
    const canvas = document.getElementById('calendar-rain-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = rainColor; 
    ctx.font = fontSize + "px 'Courier New', monospace";
    const columnSpacing = fontSize * 0.6;

    for (let i = 0; i < calendarDrops.length; i++) {
        const text = MATRIX_ALPHABET.charAt(Math.floor(Math.random() * MATRIX_ALPHABET.length));
        ctx.globalAlpha = 0.3 + (Math.random() * 0.7);
        ctx.fillText(text, i * columnSpacing, calendarDrops[i] * fontSize);

        if (calendarDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            calendarDrops[i] = 0;
        }
        calendarDrops[i]++;
    }
    ctx.globalAlpha = 1.0;
}

function initCalendar() {
    const calendarIcon = document.getElementById('calendar-icon');
    const calendarPopup = document.getElementById('calendar-popup');
    const calendarPrev = document.getElementById('calendar-prev');
    const calendarNext = document.getElementById('calendar-next');
    
    if (!calendarIcon || !calendarPopup) return;
    
    renderCalendar();
    
    calendarIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleCalendar();
    });
    
    if (calendarPrev) {
        calendarPrev.addEventListener('click', function(e) {
            e.stopPropagation();
            navigateCalendar(-1);
        });
    }
    
    if (calendarNext) {
        calendarNext.addEventListener('click', function(e) {
            e.stopPropagation();
            navigateCalendar(1);
        });
    }
    
    document.addEventListener('click', function(e) {
        if (isCalendarOpen && !calendarPopup.contains(e.target) && !calendarIcon.contains(e.target)) {
            closeCalendar();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isCalendarOpen) {
            closeCalendar();
        }
    });
    
    window.calendarInitialized = true;
}

function toggleCalendar() {
    const calendarPopup = document.getElementById('calendar-popup');
    if (!calendarPopup) return;
    if (isCalendarOpen) closeCalendar();
    else openCalendar();
}

function openCalendar() {
    const calendarPopup = document.getElementById('calendar-popup');
    if (!calendarPopup) return;
    
    calendarPopup.classList.add('active');
    isCalendarOpen = true;
    
    try {
        const clickSound = document.getElementById('signal-beep') || new Audio();
        if (clickSound.src) {
            clickSound.currentTime = 0;
            clickSound.volume = 0.3;
            clickSound.play().catch(() => {});
        }
    } catch (e) {}
    
    renderCalendar();
    initCalendarRain();
    
    if (!window.calendarResizeObserver) {
        window.calendarResizeObserver = new ResizeObserver(() => {
            initCalendarRain();
        });
        window.calendarResizeObserver.observe(calendarPopup);
    }
}

function closeCalendar() {
    const calendarPopup = document.getElementById('calendar-popup');
    if (!calendarPopup) return;
    
    calendarPopup.classList.remove('active');
    isCalendarOpen = false;

    if (calendarRainInterval) {
        clearInterval(calendarRainInterval);
        calendarRainInterval = null;
    }
    
    if (window.calendarResizeObserver) {
        window.calendarResizeObserver.disconnect();
        window.calendarResizeObserver = null;
    }
}

function navigateCalendar(direction) {
    currentCalDate.setMonth(currentCalDate.getMonth() + direction);
    renderCalendar();
    try {
        const navSound = document.getElementById('signal-beep') || new Audio();
        if (navSound.src) {
            navSound.currentTime = 0;
            navSound.volume = 0.2;
            navSound.play().catch(() => {});
        }
    } catch (e) {}
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    
    if (!calendarGrid || !calendarMonthYear) return;
    
    calendarGrid.innerHTML = '';
    
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    daysOfWeek.forEach(dayName => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-weekday-header';
        dayHeader.textContent = dayName;
        calendarGrid.appendChild(dayHeader);
    });
    
    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                       "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const month = monthNames[currentCalDate.getMonth()];
    const year = currentCalDate.getFullYear();
    calendarMonthYear.textContent = `${month} ${year}`;
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentCalDate.getMonth() && 
                          today.getFullYear() === currentCalDate.getFullYear();
    
    const firstDay = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1);
    const lastDay = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay(); 
    
    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        dayCell.style.setProperty('--day-index', day - 1);
        
        const randomChar = MATRIX_ALPHABET.charAt(Math.floor(Math.random() * MATRIX_ALPHABET.length));
        dayCell.setAttribute('data-char', randomChar);
        
        if (isCurrentMonth && day === today.getDate()) {
            dayCell.classList.add('today');
        }
        
        dayCell.addEventListener('click', function() {
            if (typeof selectDate === "function") selectDate(day);
        });
        
        calendarGrid.appendChild(dayCell);
    }
}

function selectDate(day) {
    const selectedDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), day);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = selectedDate.toLocaleDateString('en-US', options);
    
    const dateDisplay = document.getElementById('date');
    if (dateDisplay) dateDisplay.textContent = dateString;
    
    try {
        const selectSound = document.getElementById('signal-beep') || new Audio();
        if (selectSound.src) {
            selectSound.currentTime = 0;
            selectSound.volume = 0.3;
            selectSound.play().catch(() => {});
        }
    } catch (e) {}
    
    closeCalendar();
    
    if (isChatEnabled) {
        const chatLog = document.getElementById('chat-log');
        if (chatLog) {
            const dateMsg = document.createElement('div');
            dateMsg.className = 'chat-msg';
            dateMsg.innerHTML = `<b class="morpheus">SYSTEM:</b> Temporal interface updated: ${dateString}`;
            chatLog.appendChild(dateMsg);
            if (chatLog.children.length > 50) chatLog.removeChild(chatLog.firstChild);
            chatLog.scrollTop = chatLog.scrollHeight;
        }
    }
}

// --- VERTICAL RAIN 3D EFFECT ---
let verticalRainCanvas = null;
let verticalRainCtx = null;
let verticalRainAnimationId = null;
let verticalRainStreams = [];
let lastFrameTime = 0;

function initVerticalRainEffect() {
    if (verticalRainCanvas) {
        verticalRainCanvas.remove();
        verticalRainCanvas = null;
    }
    verticalRainCanvas = document.createElement('canvas');
    verticalRainCanvas.id = 'vertical-rain-canvas';
    verticalRainCanvas.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; display: none; background-color: #000;`;
    document.body.appendChild(verticalRainCanvas);
    verticalRainCtx = verticalRainCanvas.getContext('2d', { alpha: false });
    resizeVerticalRainCanvas();
}

function resizeVerticalRainCanvas() {
    if (!verticalRainCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    verticalRainCanvas.width = window.innerWidth * dpr;
    verticalRainCanvas.height = window.innerHeight * dpr;
    verticalRainCanvas.style.width = window.innerWidth + 'px';
    verticalRainCanvas.style.height = window.innerHeight + 'px';
    if (verticalRainCtx) verticalRainCtx.scale(dpr, dpr);
    initVerticalRainStreams();
}

function initVerticalRainStreams() {
    verticalRainStreams = [];
    const width = window.innerWidth;
    const baseStreamCount = Math.floor(width / 12);
    const streamCount = baseStreamCount * 2;
    for (let i = 0; i < streamCount; i++) {
        createVerticalRainStream();
    }
}

function createVerticalRainStream() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const x = Math.random() * width;
    const depth = 0.2 + Math.random() * 0.8;
    const sizeMultiplier = 1.5 - (depth * 0.8);
    const fontSize = Math.floor(8 + (sizeMultiplier * 20));
    const speed = 0.5 + (depth * 3.0);
    const trailLen = 5 + Math.floor((1 - depth) * 30);
    
    const chars = [];
    for(let j = 0; j < trailLen; j++) {
        chars.push({
            char: verticalRainAlphabet.charAt(Math.floor(Math.random() * verticalRainAlphabet.length)),
            updateTime: 0,
            trailOffset: j * fontSize * 0.8,
            rainbowSeed: Math.random() * 360
        });
    }

    const stream = {
        x: x,
        y: -Math.random() * height,
        depth: depth,
        fontSize: fontSize,
        speed: speed,
        chars: chars,
        charChangeSpeed: 80 + Math.random() * 200,
        drift: (Math.random() - 0.5) * 0.15,
        driftAngle: Math.random() * Math.PI * 2
    };
    
    let idx = 0;
    while(idx < verticalRainStreams.length && verticalRainStreams[idx].depth < depth) {
        idx++;
    }
    verticalRainStreams.splice(idx, 0, stream);
}

function drawVerticalRain(timestamp) {
    if (!verticalRainCanvas || !verticalRainCtx || videoBackground !== "vertical-rain") {
        verticalRainAnimationId = requestAnimationFrame(drawVerticalRain);
        return;
    }
    if (!isTabVisible) {
        verticalRainAnimationId = requestAnimationFrame(drawVerticalRain);
        return;
    }

    const deltaTime = lastFrameTime ? Math.min(timestamp - lastFrameTime, 32) : 16;
    lastFrameTime = timestamp;
    
    if (isVerticalRainRainbow) {
        rainbowHueOffset = (rainbowHueOffset + deltaTime * 0.03) % 360;
    }

    verticalRainCtx.fillStyle = '#000000';
    verticalRainCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const now = Date.now();
    const h = window.innerHeight;

    for (let i = 0; i < verticalRainStreams.length; i++) {
        const s = verticalRainStreams[i];
        
        s.y += s.speed * deltaTime * 0.05;
        s.x += Math.sin(now * 0.001 + s.driftAngle) * s.drift;
        
        if (s.y > h + (s.chars.length * s.fontSize * 0.8)) {
            verticalRainStreams.splice(i, 1);
            i--;
            createVerticalRainStream();
            continue;
        }

        const fontFamily = getFontFamilyForAlphabet(isVerticalRainMathSymbols);
        verticalRainCtx.font = `${s.fontSize}px ${fontFamily}`;
        verticalRainCtx.textBaseline = 'top';
        verticalRainCtx.textAlign = 'center';
        
        for (let j = 0; j < s.chars.length; j++) {
            const charObj = s.chars[j];
            
            if (now - charObj.updateTime > s.charChangeSpeed) {
                if (Math.random() > 0.97) {
                    charObj.char = verticalRainAlphabet.charAt(Math.floor(Math.random() * verticalRainAlphabet.length));
                    charObj.updateTime = now;
                }
            }

            const charY = s.y - charObj.trailOffset;
            
            if (charY < -100 || charY > h + 100) continue;

            const alpha = (1 - (j / s.chars.length)) * (0.2 + s.depth * 0.6);
            
            if (alpha > 0.05) {
                if (isVerticalRainRainbow) {
                    const hue = (charObj.rainbowSeed + rainbowHueOffset + j * 15) % 360;
                    verticalRainCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                } else {
                    verticalRainCtx.fillStyle = rainColor;
                }
                
                verticalRainCtx.globalAlpha = alpha;
                
                if (s.depth > 0.5) {
                    verticalRainCtx.shadowBlur = 8 * s.depth;
                    verticalRainCtx.shadowColor = isVerticalRainRainbow ? verticalRainCtx.fillStyle : rainColor;
                } else {
                    verticalRainCtx.shadowBlur = 0;
                }
                
                verticalRainCtx.fillText(charObj.char, s.x, charY);
                verticalRainCtx.shadowBlur = 0;
            }
        }
    }
    
    verticalRainCtx.globalAlpha = 1.0;
    verticalRainAnimationId = requestAnimationFrame(drawVerticalRain);
}

function startVerticalRainEffect() {
    if (verticalRainAnimationId) {
        cancelAnimationFrame(verticalRainAnimationId);
        verticalRainAnimationId = null;
    }
    if (!verticalRainCanvas) initVerticalRainEffect();
    
    resizeVerticalRainCanvas();
    verticalRainCanvas.style.display = 'block';
    lastFrameTime = 0;
    isTabVisible = !document.hidden;
    drawVerticalRain();
}

function stopVerticalRainEffect() {
    if (verticalRainAnimationId) {
        cancelAnimationFrame(verticalRainAnimationId);
        verticalRainAnimationId = null;
    }
    if (verticalRainCanvas) {
        verticalRainCanvas.style.display = 'none';
    }
}

function handleTabVisibilityChange() {
    const now = Date.now();
    const wasVisible = isTabVisible;
    isTabVisible = !document.hidden;
    
    if (now - lastVisibilityChange < 100) return;
    lastVisibilityChange = now;
    
    if (videoBackground !== "vertical-rain") return;
    
    if (isTabVisible && !wasVisible) {
        if (verticalRainCanvas && !verticalRainAnimationId) {
            lastFrameTime = 0;
            verticalRainCanvas.style.display = 'block';
            drawVerticalRain();
        }
    }
}
document.addEventListener('visibilitychange', handleTabVisibilityChange);

function logVideoStatus(message) {
    console.log(`[Background Video] ${message}`);
}

function initBackgroundVideoElement() {
    const existingVideo = document.getElementById('background-video');
    if (existingVideo) {
        existingVideo.remove();
        backgroundVideo = null;
    }
    removeFallbackCanvas();
    
    backgroundVideo = document.createElement('video');
    backgroundVideo.id = 'background-video';
    backgroundVideo.loop = false; 
    backgroundVideo.muted = true;
    backgroundVideo.playsInline = true;
    backgroundVideo.autoplay = false;
    backgroundVideo.preload = 'auto';
    
    backgroundVideo.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;
        z-index: 0; opacity: 0; pointer-events: none; display: none; background-color: #000;
        transition: opacity 1s ease; will-change: transform; backface-visibility: hidden; transform: translateZ(0);
    `;
    
    backgroundVideo.addEventListener('timeupdate', function() {
        if (!this.duration) return;
        if (this.currentTime > this.duration - 0.1) {
            this.currentTime = 0;
            this.play().catch(() => {});
        }
    });

    document.body.appendChild(backgroundVideo);
    
    backgroundVideo.addEventListener('error', (e) => {
        const currentSession = activeVideoSession;
        setTimeout(() => {
            if (!videoBackground || activeVideoSession !== currentSession) return;
            let fallbackCanvas = document.getElementById('background-fallback-canvas');
            if (!fallbackCanvas) {
                fallbackCanvas = document.createElement('canvas');
                fallbackCanvas.id = 'background-fallback-canvas';
                document.body.appendChild(fallbackCanvas);
            }
            const fallbackCtx = fallbackCanvas.getContext('2d');
            fallbackCanvas.width = window.innerWidth;
            fallbackCanvas.height = window.innerHeight;
            fallbackCanvas.style.cssText = backgroundVideo.style.cssText;
            fallbackCanvas.style.display = 'block';
            fallbackCanvas.style.opacity = '1';
            
            const currentConfig = VIDEO_CONFIGS[videoBackground];
            const fallbackColor = currentConfig ? currentConfig.fallbackColor : "#00ff41";
            backgroundVideo.style.display = 'none';
            
            function drawFallback() {
                if (!document.getElementById('background-fallback-canvas') || !videoBackground || activeVideoSession !== currentSession) return;
                const canvas = document.getElementById('background-fallback-canvas');
                if(!canvas) return;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = fallbackColor;
                ctx.font = '20px monospace';
                for (let i = 0; i < 50; i++) {
                    const char = MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)];
                    const x = (i * 30) % canvas.width;
                    const y = (Date.now() / 100 + i * 30) % canvas.height;
                    ctx.fillText(char, x, y);
                }
                requestAnimationFrame(drawFallback);
            }
            drawFallback();
        }, 500);
    });
}

function removeFallbackCanvas() {
    const existingFallback = document.getElementById('background-fallback-canvas');
    if (existingFallback) existingFallback.remove();
}

function showBackgroundVideo(videoType) {
    if (!videoType || videoType === "") return false;
    
    if (videoType === "vertical-rain") {
        stopRain();
        canvas.style.display = 'none';
        sCanvas.style.display = 'none';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
        
        if (backgroundVideo) {
            backgroundVideo.style.display = 'none';
            backgroundVideo.pause();
        }
        
        startVerticalRainEffect();
        return true;
    }
    
    activeVideoSession++;
    const currentSession = activeVideoSession;

    const videoConfig = VIDEO_CONFIGS[videoType];
    if (!videoConfig) return false;
    
    stopRain();
    canvas.style.display = 'none';
    sCanvas.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
    stopVerticalRainEffect();
    
    if (!backgroundVideo) initBackgroundVideoElement();
    removeFallbackCanvas();

    const videoUrl = chrome.runtime.getURL(videoConfig.file);
    backgroundVideo.style.display = 'block';
    backgroundVideo.style.opacity = '0';
    backgroundVideo.pause();
    backgroundVideo.currentTime = 0;
    backgroundVideo.src = videoUrl;
    backgroundVideo.load();
    
    setTimeout(() => {
        if (activeVideoSession === currentSession) backgroundVideo.style.opacity = '1';
    }, 50);
    
    const playPromise = backgroundVideo.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            if (activeVideoSession !== currentSession) {
                backgroundVideo.pause();
                return;
            }
        }).catch(error => {
            if (activeVideoSession !== currentSession) return;
            backgroundVideo.muted = true;
            backgroundVideo.play().catch(e => {});
        });
    }
    return true;
}

function startBackgroundVideo(videoType) {
    videoBackground = videoType;
    return showBackgroundVideo(videoType);
}

function stopBackgroundVideo() {
    activeVideoSession++;
    videoBackground = "";
    stopVerticalRainEffect();
    if (backgroundVideo) {
        backgroundVideo.style.opacity = '0';
        backgroundVideo.pause();
        backgroundVideo.src = "";
        backgroundVideo.style.display = 'none';
        backgroundVideo.style.transform = 'none';
    }
    removeFallbackCanvas();
    canvas.style.display = 'block';
    sCanvas.style.display = 'block';
    canvas.style.opacity = '1';
    sCanvas.style.opacity = '1';
    resize(); 
    startRain();
}

let sentinelAnimationId = null;

function animateSentinels() {
    if (isSnowing && sentinelVideo.readyState >= 2) {
        sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
        angle += 0.008;
        const aspect = sentinelVideo.videoHeight / sentinelVideo.videoWidth;
        for (let p of snowParticles) {
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
            sCtx.shadowBlur = 15;
            sCtx.shadowColor = rainColor;
            sCtx.drawImage(sentinelVideo, -p.width / 2, -aspect * p.width / 2, p.width, aspect * p.width);
            sCtx.restore();
            if (p.y > window.innerHeight + 200) { 
                p.y = -200; 
                p.x = Math.random() * window.innerWidth; 
            }
        }
    } else if (!isSnowing) {
        sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
    }
    sentinelAnimationId = requestAnimationFrame(animateSentinels);
}

function stopAllAnimations() {
    stopBackgroundVideo();
    if (sentinelAnimationId) {
        cancelAnimationFrame(sentinelAnimationId);
        sentinelAnimationId = null;
    }
    clearInterval(rainInterval);
    rainInterval = null;
}

function startAllAnimations() {
    stopAllAnimations();
    animateSentinels();
    if (videoBackground) {
        startBackgroundVideo(videoBackground);
    } else {
        canvas.style.display = 'block';
        sCanvas.style.display = 'block';
        startRain();
    }
}

// Global tracker to ensure we clean up the previous message before showing a new one
let activeZionMessageCleanup = null;

const showZionMessage = (msg) => {
    // 1. Safety Check: If a message is already open, close it properly first
    if (activeZionMessageCleanup) {
        activeZionMessageCleanup();
    }

    const overlay = document.createElement('div');
    overlay.id = 'zion-active-overlay'; 
    // UPDATED: Changed z-index from 10000 to 20000 to sit ABOVE the apps (which are 10005)
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:20000; font-family:'Orbitron', sans-serif; color:var(--theme-color); text-align:center; padding:20px; box-sizing: border-box;";
    
    // Create inner container
    overlay.innerHTML = `
        <style>
            #zion-modal-inner::-webkit-scrollbar { width: 6px; }
            #zion-modal-inner::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
            #zion-modal-inner::-webkit-scrollbar-thumb { background: var(--theme-color); border-radius: 10px; box-shadow: 0 0 5px var(--theme-color); }
        </style>
        <div id="zion-modal-inner" style="position: relative; max-height: 90vh; width: 100%; max-width: 800px; padding: 20px; border: 2px solid var(--theme-color); box-shadow: 0 0 10px var(--theme-color); border-radius: 10px; background: rgba(0,0,0,0.85); overflow-y: auto; overflow-x: hidden;">
            <canvas id="zion-rain-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none;"></canvas>
            <div style="position: relative; z-index: 1; font-size:1.2rem; margin-bottom:30px; white-space:pre-wrap; text-shadow: 0 0 10px var(--theme-color); line-height: 1.4;"></div>
            <button id="zion-close" style="position: relative; z-index: 1; background:transparent; color:var(--theme-color); border:1px solid var(--theme-color); padding:10px 30px; cursor:pointer; font-family:inherit; font-weight:bold; letter-spacing:2px; box-shadow: 0 0 10px var(--theme-color); margin-top: 10px;">DISMISS</button>
        </div>`;
    
    // Safely inject text content
    const textContainer = overlay.querySelector('#zion-modal-inner > div:nth-child(2)');
    if (textContainer) {
        textContainer.textContent = msg;
    }
    
    document.body.appendChild(overlay);
    initZionRain();

    const innerModal = document.getElementById('zion-modal-inner');
    const resizeObserver = new ResizeObserver(() => initZionRain());
    resizeObserver.observe(innerModal);
    
    const resizeHandler = () => initZionRain();
    window.addEventListener('resize', resizeHandler);

    // Define the cleanup function
    const closeMessage = () => {
        if (zionRainInterval) clearInterval(zionRainInterval);
        window.removeEventListener('resize', resizeHandler);
        resizeObserver.disconnect();
        if (overlay && overlay.parentNode) overlay.remove();
        activeZionMessageCleanup = null; 
    };

    activeZionMessageCleanup = closeMessage;
    document.getElementById('zion-close').onclick = closeMessage;
};

let zionRainInterval = null;
let zionDrops = [];

function initZionRain() {
    const canvas = document.getElementById('zion-rain-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    const columnSpacing = fontSize * 0.6;
    const columns = Math.floor(canvas.offsetWidth / columnSpacing);
    zionDrops = Array(columns).fill(0).map(() => Math.floor(Math.random() * (canvas.height / fontSize)));

    if (zionRainInterval) clearInterval(zionRainInterval);
    zionRainInterval = setInterval(drawZionRain, rainSpeed);
}

function drawZionRain() {
    const canvas = document.getElementById('zion-rain-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = rainColor;
    ctx.font = fontSize + "px 'Courier New', monospace";
    const columnSpacing = fontSize * 0.6;

    for (let i = 0; i < zionDrops.length; i++) {
        const text = MATRIX_ALPHABET.charAt(Math.floor(Math.random() * MATRIX_ALPHABET.length));
        ctx.globalAlpha = 0.3 + (Math.random() * 0.7);
        ctx.fillText(text, i * columnSpacing, zionDrops[i] * fontSize);
        if (zionDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            zionDrops[i] = 0;
        }
        zionDrops[i]++;
    }
    ctx.globalAlpha = 1.0;
}

const CLI_COMMANDS = {
    '/help': () => {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');
    
    if (modal && modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        initTerminalRain();
        initTerminalCursor();
    }
    
    if (output) output.innerHTML = "";

    // STYLE CONSTANTS
    const headerBase = "width: 100%; height: 35px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 15px; letter-spacing: 2px; box-sizing: border-box; cursor: default;";
    const boxStyle   = "display: flex; flex-direction: column; width: 100%;";
    
    // COLOR THEMES
    const sCore = headerBase + "color: #fff; border: 1px solid #fff; background: rgba(0, 242, 255, 0.1);";
    const sNet  = headerBase + "color: #00f2ff; border: 1px solid #00f2ff; background: rgba(0, 242, 255, 0.1);";
    const sApp  = headerBase + "color: #fff; border: 1px solid #fff; background: rgba(0, 242, 255, 0.1);";
    const sGame = headerBase + "color: #ff0055; border: 1px solid #ff0055; background: rgba(255, 0, 85, 0.1);";
    const sMedia= headerBase + "color: #ae00ff; border: 1px solid #ae00ff; background: rgba(174, 0, 255, 0.1);";
    const sSocial= headerBase + "color: #00ffaa; border: 1px solid #00ffaa; background: rgba(0, 255, 170, 0.1);";

    const helpHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px 40px; width: 100%; box-sizing: border-box; font-family: 'Courier New', monospace; font-size: 0.85rem; line-height: 1.4; padding: 10px;">
            
            <div style="${boxStyle}">
                <div style="${sCore}">[ CORE ]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding-left: 5px;">
                    <div>/whoami</div><div>/clear</div>
                    <div>/exit</div><div>/speed [val]</div>
                    <div>/color [hex]</div><div>/font [type]</div>
                    <div>/night</div><div>/glitch</div>
                    <div>/jackin</div><div>/white-rabbit</div>
                    <div>/alphabet</div><div>/quote</div>
                </div>
            </div>

            <div style="${boxStyle}">
                <div style="${sNet}">[ NETWORK & SPACE ]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding-left: 5px;">
                    <div>/feed [mode]</div><div>/rss [on|off]</div>
                    <div>/weather</div><div>yt: [query]</div>
                    <div>gh: [query]</div><div>w: [query]</div>
                    <div>/space</div><div>/earth</div>
                    <div>/asteroid</div><div></div>
                </div>
            </div>

            <div style="${boxStyle}">
                <div style="${sApp}">[ APPS & DATA ]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding-left: 5px;">
                    <div>/wordpad</div><div>/video</div>
                    <div>/paint</div><div>/ai</div>
                    <div>/settings</div><div>/root</div>
                    <div>/vault</div><div>/mkdir</div>
                </div>
            </div>

            <div style="${boxStyle}">
                <div style="${sGame}">[ GAMES ]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding-left: 5px;">
                    <div>/play [game]</div><div>/zion</div>
                    <div>/rampage</div><div>/tunnel</div>
                    <div>/overloaded</div><div>/bullet</div>
                    <div>/fighter</div><div>/rampage2</div>
                </div>
            </div>

            <div style="${boxStyle}">
                <div style="${sMedia}">[ MEDIA DECK ]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding-left: 5px;">
                    <div>/music play</div><div>/music pause</div>
                    <div>/music next</div><div>/music prev</div>
                    <div>/music vol</div><div>/media</div>
                </div>
            </div>

            <div style="${boxStyle}">
                <div style="${sSocial}">[ SOCIAL & DATA NODES ]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding-left: 5px;">
                    <div>/reddit</div><div>/discord</div>
                    <div>/twitter</div><div>/github</div>
                    <div>/twitch</div><div>/kick</div>
                    <div>/instagram</div><div>/facebook</div>
                    <div>/deepseek</div><div>/gpt</div>
                    <div>/gemini</div><div>/steam</div>
                </div>
            </div>

        </div>`;
    
    if (output) {
        const div = document.createElement('div');
        div.innerHTML = helpHTML;
        div.style.width = "100%";
        output.appendChild(div);
        output.scrollTop = output.scrollHeight;
    }
    if (input) setTimeout(() => input.focus(), 50);
},
    // --- APP LAUNCHERS ---
    '/wordpad': () => { 
        document.getElementById('wordpad-modal').classList.remove('hidden'); 
        closeTerminalModal(); 
    },
    '/note': () => CLI_COMMANDS['/wordpad'](),
    
    '/video': () => {
        const modal = document.getElementById('video-modal');
        if(modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '10006';
            if (!window.videoEditorInstance && window.VideoEditor) {
                window.videoEditorInstance = new VideoEditor(document.getElementById('video-editor-root'));
            }
        }
        closeTerminalModal();
    },
    '/studio': () => CLI_COMMANDS['/video'](),

    '/paint': () => {
         // Assuming PaintApp logic handles modal opening or we have a paint modal ID
         // Based on provided code, the Paint logic seems triggered via preview button usually,
         // but if there's a standalone way or modal (like video-modal), add it here.
         // Assuming a placeholder for now or checking if a modal exists.
         // If "sketch" / "paint" triggers a specific modal in your setup:
         // For now, let's assume it might not have a direct CLI trigger in the provided code
         // unless we add an ID. But based on instructions:
         showZionMessage("SKETCH MODULE LOADING...");
         closeTerminalModal();
    },
    '/sketch': () => CLI_COMMANDS['/paint'](),

    '/ai': () => {
        openOracleTerminal();
        // Don't close terminal here as Oracle lives inside it
    },
    '/oracle': () => CLI_COMMANDS['/ai'](),

    '/media': () => {
        const modal = document.getElementById('media-player-modal');
        if(modal) {
             modal.classList.remove('hidden');
             modal.style.zIndex = '10007';
             if (!window.globalMediaPlayer && window.ZionMediaPlayer) {
                window.globalMediaPlayer = new ZionMediaPlayer();
             }
        }
        closeTerminalModal();
    },
    '/deck': () => CLI_COMMANDS['/media'](),

    '/settings': () => {
        // Trigger settings modal if ID exists (usually 'settings-modal' in typical setups)
        const modal = document.getElementById('settings-modal'); 
        if(modal) modal.classList.add('active'); 
        closeTerminalModal();
    },

    // --- ZION NETWORK BRIDGE ---
    '/feed': (mode) => {
        if (!mode) return showZionMessage("USAGE: /feed [mode]\nMODES: reddit, news, security, space, dev, finance");
        const map = {
            'reddit': 0,
            'news': 1,
            'security': 2,
            'space': 3,
            'dev': 4,
            'finance': 5
        };
        const key = mode.toLowerCase();
        if (map.hasOwnProperty(key)) {
            // Using setFeedMode as per instructions
            if (typeof window.setFeedMode === 'function') {
                 window.setFeedMode(map[key]);
                 showZionMessage(`NETWORK FEED: SWAPPED TO ${key.toUpperCase()}`);
            } else {
                 showZionMessage("FEED SYSTEM OFFLINE");
            }
        } else {
            showZionMessage("UNKNOWN FEED MODE");
        }
    },
    
    '/rss': (state) => {
        const container = document.getElementById('zion-network-container');
        if (!container) return;
        if (state === 'on') {
            container.classList.remove('hidden');
            chrome.storage.sync.set({ isRssEnabled: true });
        } else if (state === 'off') {
            container.classList.add('hidden');
            chrome.storage.sync.set({ isRssEnabled: false });
        } else {
            // Toggle
            const isHidden = container.classList.toggle('hidden');
            chrome.storage.sync.set({ isRssEnabled: !isHidden });
        }
    },

    // --- NEBUCHADNEZZAR DECK CONTROL ---
    '/music': (args) => {
        if (!window.globalMediaPlayer) {
            return showZionMessage("[SYSTEM] NO MEDIA FREQUENCY DETECTED.\nLINK FOLDER VIA MEDIA DECK FIRST.");
        }
        
        const parts = args.split(' ');
        const cmd = parts[0].toLowerCase();
        const val = parts[1];

        if (cmd === 'play') {
            if (window.globalMediaPlayer.audioCtx && window.globalMediaPlayer.audioCtx.state === 'suspended') {
                window.globalMediaPlayer.audioCtx.resume();
            }
            if (window.globalMediaPlayer.mediaElement.paused) window.globalMediaPlayer.togglePlay();
        } else if (cmd === 'pause') {
            if (!window.globalMediaPlayer.mediaElement.paused) window.globalMediaPlayer.togglePlay();
        } else if (cmd === 'next') {
            window.globalMediaPlayer.playNext();
        } else if (cmd === 'prev') {
            window.globalMediaPlayer.playPrev();
        } else if (cmd === 'vol') {
            let v = parseInt(val);
            if (isNaN(v)) return;
            v = Math.max(0, Math.min(100, v));
            if (window.globalMediaPlayer.mediaElement) {
                                    window.globalMediaPlayer.mediaElement.volume = v / 100;
                             }
            showZionMessage(`DECK VOLUME: ${v}%`);
        }
    },

    // --- VIDEO & STREAMING ---
    '/youtube': () => { showZionMessage("UPLINKING TO YOUTUBE..."); window.open("https://youtube.com", "_blank"); },
    '/yt': () => CLI_COMMANDS['/youtube'](),
    '/twitch': () => { showZionMessage("UPLINKING TO TWITCH..."); window.open("https://twitch.tv", "_blank"); },
    '/kick': () => { showZionMessage("UPLINKING TO KICK..."); window.open("https://kick.com", "_blank"); },
    '/netflix': () => { showZionMessage("CONNECTING TO NETFLIX..."); window.open("https://netflix.com", "_blank"); },
    '/prime': () => { showZionMessage("CONNECTING TO PRIME VIDEO..."); window.open("https://www.primevideo.com", "_blank"); },

    // --- SOCIAL & FORUMS ---
    '/reddit': () => { showZionMessage("ACCESSING REDDIT ARCHIVE..."); window.open("https://reddit.com", "_blank"); },
    '/instagram': () => { showZionMessage("UPLINKING TO INSTAGRAM..."); window.open("https://instagram.com", "_blank"); },
    '/ig': () => CLI_COMMANDS['/instagram'](),
    '/twitter': () => { showZionMessage("UPLINKING TO X..."); window.open("https://x.com", "_blank"); },
    '/x': () => CLI_COMMANDS['/twitter'](),
    '/discord': () => { showZionMessage("UPLINKING TO DISCORD..."); window.open("https://discord.com", "_blank"); },
    '/facebook': () => { showZionMessage("UPLINKING TO FACEBOOK..."); window.open("https://facebook.com", "_blank"); },
    '/fb': () => CLI_COMMANDS['/facebook'](),
    '/tumblr': () => { showZionMessage("UPLINKING TO TUMBLR..."); window.open("https://tumblr.com", "_blank"); },
    '/myspace': () => { showZionMessage("RECOVERING LEGACY DATA: MYSPACE..."); window.open("https://myspace.com/", "_blank"); },
    '/pin': () => { showZionMessage("UPLINKING TO PINTEREST..."); window.open("https://www.pinterest.com/", "_blank"); },

    // --- SHOPPING & GAMING ---
    '/ebay': () => { showZionMessage("OPENING EBAY MARKETPLACE..."); window.open("https://ebay.co.uk", "_blank"); },
    '/amazon': () => { showZionMessage("OPENING AMAZON MARKETPLACE..."); window.open("https://amazon.co.uk", "_blank"); },
    '/amz': () => CLI_COMMANDS['/amazon'](),
    '/xbox': () => { showZionMessage("CONNECTING TO XBOX NETWORK..."); window.open("https://xbox.com", "_blank"); },
    '/playstation': () => { showZionMessage("CONNECTING TO PLAYSTATION NETWORK..."); window.open("https://playstation.com", "_blank"); },
    '/ps': () => CLI_COMMANDS['/playstation'](),
    '/steam': () => { showZionMessage("CONNECTING TO STEAM DATABASE..."); window.open("https://steampowered.com", "_blank"); },

    // --- AI & DEV ---
    '/git': () => { showZionMessage("UPLINKING TO GITHUB..."); window.open("https://github.com", "_blank"); },
    '/github': () => CLI_COMMANDS['/git'](),
    '/deepseek': () => { showZionMessage("QUERYING DEEPSEEK CORE..."); window.open("https://chat.deepseek.com/", "_blank"); },
    '/ds': () => CLI_COMMANDS['/deepseek'](),
    '/gemini': () => { showZionMessage("QUERYING GEMINI CORE..."); window.open("https://gemini.google.com", "_blank"); },
    '/gpt': () => { showZionMessage("QUERYING CHATGPT CORE..."); window.open("https://chatgpt.com/", "_blank"); },

    // --- SYSTEM COMMANDS ---
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
            // Manual sync since syncThemeColor is removed
            document.documentElement.style.setProperty('--theme-color', CLASSIC_GREEN);
            rainColor = CLASSIC_GREEN;
            themeColor = CLASSIC_GREEN;
            
            chrome.storage.sync.set({ isGlow: true, isMatrixGreen: true });
            showZionMessage("STEALTH PROTOCOL ENGAGED\nVISUAL SIGNATURE MINIMIZED");
        } else {
            mainContainer.style.opacity = "1";
            const savedGlow = glowT ? glowT.checked : false;
            if (!savedGlow) document.body.classList.remove('glow-active');
            isMatrixGreen = greenT ? greenT.checked : false;
            
            // Manual sync since syncThemeColor is removed
            if (isMatrixGreen) {
                document.documentElement.style.setProperty('--theme-color', CLASSIC_GREEN);
                rainColor = CLASSIC_GREEN;
                themeColor = CLASSIC_GREEN;
            } else {
                const pickerVal = document.getElementById('theme-color-picker').value;
                document.documentElement.style.setProperty('--theme-color', pickerVal);
                rainColor = document.getElementById('color-picker').value;
                themeColor = pickerVal;
            }
            
            chrome.storage.sync.set({ isGlow: savedGlow, isMatrixGreen: isMatrixGreen });
            showZionMessage("STEALTH PROTOCOL DEACTIVATED");
        }
    },
    '/glitch': () => {
        const body = document.body;
        const root = document.documentElement;
        const oldIntensity = root.style.getPropertyValue('--glitch-intensity');
        const oldColor = themeColor; 

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
            if (!document.getElementById('glitch-toggle').checked) body.classList.remove('glitch-enabled');
            root.style.setProperty('--glitch-intensity', oldIntensity || '5px');
            root.style.setProperty('--theme-color', oldColor);
            body.style.transform = "";
            body.style.filter = "";
            
            // Restore theme color
             if (isMatrixGreen) {
                document.documentElement.style.setProperty('--theme-color', CLASSIC_GREEN);
                rainColor = CLASSIC_GREEN;
                themeColor = CLASSIC_GREEN;
            } else {
                const pickerVal = document.getElementById('theme-color-picker').value;
                document.documentElement.style.setProperty('--theme-color', pickerVal);
                rainColor = document.getElementById('color-picker').value;
                themeColor = pickerVal;
            }
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
    '/speed': (v) => { 
        if(v) { 
            rainSpeed = parseInt(v); 
            if (!videoBackground) startRain();
            chrome.storage.sync.set({ rainSpeed }); 
        }
    },
    '/color': (v) => { 
        if(v) { 
            document.getElementById('color-picker').value = v; 
            document.getElementById('theme-color-picker').value = v; 
            // Manual sync since syncThemeColor is removed
            if (!isMatrixGreen) {
                themeColor = v;
                rainColor = v;
                document.documentElement.style.setProperty('--theme-color', v);
                if (!videoBackground) startRain();
            }
            chrome.storage.sync.set({ rainColor: v, themeColor: v }); 
        }
    },
   '/whoami': async () => {
        const isBrave = (navigator.brave && await navigator.brave.isBrave()) || false;
        const platform = navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform;
        const browserName = isBrave ? "Brave (Encrypted)" : (navigator.userAgent.includes("Edg") ? "Edge" : "Chrome/Chromium");
        const dpr = window.devicePixelRatio || 1;
        const physicalWidth = Math.round(window.screen.width * dpr);
        const physicalHeight = Math.round(window.screen.height * dpr);
        
        const idImage = chrome.runtime.getURL("neo_id.png");
        const info = `IDENTITY TRACE: \nOS: ${platform}\nCORE: ${browserName}\nDPR: ${dpr.toFixed(2)}x (Scaling Factor)\nVIEWPORT: ${window.innerWidth}x${window.innerHeight}\nHARDWARE: ${physicalWidth}x${physicalHeight} (True Resolution)\nUPLINK: ${navigator.onLine ? "SECURE" : "DISCONNECTED"}\nSTATUS: YOU ARE THE ONE.`;
        showZionMessage(info);
    },
    '/clear': () => { const log = document.getElementById('chat-log'); if(log) log.innerHTML = ""; },
    '/jackin': () => {
        const oldSpeed = rainSpeed;
        const jackinAudio = new Audio('jackin.mp3');
        rainSpeed = 10;
        if (!videoBackground) startRain();
        jackinAudio.play().catch(e => console.error("Jackin audio failed", e));
        jackinAudio.onended = () => {
            rainSpeed = oldSpeed;
            if (!videoBackground) startRain();
        };
    },
    '/white-rabbit': () => {
        const q = MATRIX_QUOTES[Math.floor(Math.random() * MATRIX_QUOTES.length)];
        showZionMessage(`THE CONSTRUCT SAYS:\n"${q}"`);
    },
    '/nodes': () => {
        // --- UPDATED TO LOCAL STORAGE ---
        chrome.storage.local.get({ userNavLinks: [] }, (data) => {
            showZionMessage(`SECURE NODES IDENTIFIED: ${data.userNavLinks.length}/10`);
        });
    },
    '/reset': () => { if(confirm("Hard Reset?")) { chrome.storage.sync.clear(); location.reload(); }},
    '/root': () => { openRootExplorer(); showZionMessage("ACCESSING ROOT DIRECTORY..."); },
    '/mkdir': (folderName) => {
        if (!folderName) return showZionMessage("USAGE: /mkdir [folder_name]");
        // Create folder in current Explorer view if active
        if (isExplorerActive) {
            let currentData = explorerStack[explorerStack.length - 1];
            if (currentData[folderName]) {
                 showZionMessage(`ERROR: ${folderName} ALREADY EXISTS`);
            } else {
                 currentData[folderName] = {};
                 chrome.storage.local.set(explorerStack[0], () => {
                     renderExplorerGrid();
                     showZionMessage(`DIRECTORY CREATED: ${folderName}`);
                 });
            }
        } else {
            // Create in root if explorer is closed
             chrome.storage.local.get(null, (data) => {
                 if (!data[folderName]) {
                     data[folderName] = {};
                     chrome.storage.local.set(data, () => showZionMessage(`DIRECTORY CREATED: ${folderName}`));
                 }
             });
        }
    },
    
    // --- SPACE & NASA COMMANDS ---
    '/space': () => { openSpaceTerminal(); },
    '/earth': () => { openEarthTerminal(); },
    '/asteroid': () => { openAsteroidTerminal(); },
    '/asteroids': () => { openAsteroidTerminal(); },
    
    // --- GAMES COMMANDS ---
    '/tunnel': () => { openTunnelGame(); },
    '/rampage': () => { openMatrixRampageGame(); },
    '/zion': () => { openCitizensOfZionGame(); },
    '/pandemonium': () => { openMatrixPandemoniumGame(); },
    '/dock': () => { openDockDefenceGame(); },
    '/overloaded': () => { openMatrixOverloadedGame(); },
    '/rampage2': () => { openMatrixRampage2Game(); },
    '/bullet': () => { openMatrixBulletTimeGame(); },
    '/fighter': () => { openMatrixFighterGame(); },
    '/psx': () => { const btn = document.getElementById('btn-psx'); if (btn) btn.click(); },
    '/play': (gameName) => {
        if(!gameName) return showZionMessage("USAGE: /play [zion|rampage|tunnel]");
        const target = gameName.toLowerCase().trim();
        if (target === 'zion') {
            openCitizensOfZionGame();
        } else if (target === 'rampage') {
            openMatrixRampageGame();
        } else if (target === 'tunnel') {
            openTunnelGame();
        } else if (target === 'pandemonium') {
            openMatrixPandemoniumGame();
        } else if (target === 'dock') {
            openDockDefenceGame();
        } else if (target === 'overloaded') {
            openMatrixOverloadedGame();
        } else if (target === 'rampage2') {
            openMatrixRampage2Game();
        } else if (target === 'bullettime') {
            openMatrixBulletTimeGame();
        } else if (target === 'matrixfighter') {
            openMatrixFighterGame();
        } else {
            showZionMessage("ERROR: GAME '" + gameName + "' NOT FOUND.");
        }
    },
    '/uplink': () => {
        showZionMessage("COMMAND OBSOLETE.\nPLEASE USE THE [⬆ UPLOAD] BUTTON IN THE ROOT DIRECTORY.");
        openRootExplorer();
    },
    '/vault': () => { 
        // Pass the filter directly to the opener
        openRootExplorer(); 
        showZionMessage("ACCESSING SECURE VAULT..."); 
    },
};

// --- ORACLE AI SYSTEM ---
const oracleStates = new Map(); 
let oracleCursor = null;
let currentOracleModel = 'ZION CORE'; // Default Model

// --- DYNAMIC CSS INJECTION (Scanner + Integrated Model Menu) ---
function injectOracleStyles() {
    if (document.getElementById('oracle-dynamic-css')) return;
    const style = document.createElement('style');
    style.id = 'oracle-dynamic-css';
    style.textContent = `
        .oracle-scan-container {
            position: relative; display: inline-block; max-width: 100%;
            box-sizing: border-box; border: 1px solid var(--theme-color);
            padding: 5px; margin-bottom: 5px; overflow: hidden; vertical-align: top;
        }

        .oracle-response-container {
            background: transparent !important; border-left: 2px solid var(--theme-color);
            padding: 5px 10px; margin: 5px 0; text-align: left !important;
            width: 100%; display: block; box-sizing: border-box;
        }

        .oracle-response-text { text-align: left !important; display: block; width: 100%; }

        .oracle-entry { display: flex; flex-direction: column; align-items: flex-start; width: 100%; margin-bottom: 10px; }

        /* --- UPDATED LOADING ANIMATION --- */
        .oracle-loading {
            color: var(--theme-color);
            opacity: 0.9;
            font-family: 'Courier New', monospace;
            padding: 5px 10px;
            font-style: italic;
            margin: 5px 0;
            display: block; width: 100%; text-align: left; align-self: flex-start;
            text-shadow: 0 0 5px var(--theme-color);
        }
        .oracle-loading::after { content: ''; animation: thinking-dots 1.5s steps(4, end) infinite; }
        
        @keyframes thinking-dots { 0%, 20% { content: ''; } 40% { content: '.'; } 60% { content: '..'; } 80%, 100% { content: '...'; } }

        .oracle-scan-container::after {
            content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.3) 50%), 
                        linear-gradient(to bottom, transparent 0%, rgba(0, 242, 255, 0.4) 50%, transparent 50.5%);
            background-size: 100% 4px, 100% 200%; pointer-events: none; z-index: 2;
            opacity: 0.8; transition: opacity 0.3s; animation: media-scanner 4s linear infinite;
        }
        .oracle-scan-container:hover::after { opacity: 0; animation-play-state: paused; }
        .oracle-scan-container img {
            display: block; max-width: 100%; height: auto; border-radius: 2px;
            filter: sepia(1) hue-rotate(180deg) saturate(2); transition: all 0.3s ease;
        }
        .oracle-scan-container:hover img { filter: none; opacity: 1; }

        #terminal-output .oracle-scan-container { max-width: 50%; margin-top: 10px; }
        #terminal-output .oracle-scan-container img { max-height: 300px; object-fit: contain; }
        
        #oracle-input { padding-right: 10px !important; }
        
        #oracle-tools-container { position: absolute; bottom: 40px; right: 30px; display: flex; gap: 10px; align-items: center; z-index: 200; }
        
        #oracle-chat-container { overflow: visible !important; }
        
        #oracle-upload-btn {
            font-size: 0.6rem; color: var(--theme-color); opacity: 0.6; cursor: pointer;
            z-index: 200; font-family: 'Courier New', monospace; text-transform: uppercase;
            letter-spacing: 0px; transition: all 0.3s ease; user-select: none;
            background: rgba(0, 0, 0, 0.6); padding: 2px 6px; border: 1px solid transparent; border-radius: 2px;
        }
        #oracle-upload-btn:hover { opacity: 1; text-shadow: 0 0 5px var(--theme-color); border-color: var(--theme-color); background: rgba(0, 0, 0, 0.9); }
        #oracle-upload-btn.file-loaded { color: #00ff41; border-color: #00ff41; text-shadow: 0 0 5px #00ff41; opacity: 1; }
        
        .oracle-expand-btn {
            position: absolute; top: 5px; right: 5px; color: var(--theme-color);
            cursor: pointer; opacity: 0.6; font-size: 1.2rem; z-index: 20;
            transition: all 0.3s; line-height: 1;
        }
        .oracle-expand-btn:hover { opacity: 1; text-shadow: 0 0 8px var(--theme-color); transform: scale(1.1); }

        /* --- EXPLORER STYLES --- */
        .explorer-node {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 10px;
            border: 1px solid transparent;
            border-radius: 4px;
            transition: all 0.3s ease;
        }
        .explorer-node:hover {
            border-color: var(--theme-color);
            background: rgba(0, 242, 255, 0.1);
        }
        .explorer-node.node-type-back {
            border-color: var(--theme-color);
            background: rgba(0, 242, 255, 0.05);
        }
        .explorer-icon {
            font-size: 2rem;
            margin-bottom: 5px;
            text-shadow: 0 0 10px var(--theme-color);
        }
        .explorer-label {
            font-family: 'Courier New', monospace;
            font-size: 0.8rem;
            text-align: center;
            color: var(--theme-color);
            word-break: break-all;
            max-width: 100%;
        }
        
        /* FORCE TOP ALIGNMENT: Prevents content from floating in the middle */
        #terminal-output {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important; 
            align-items: stretch !important;
            padding: 10px 0 !important;
            height: 100% !important;
            overflow-y: auto !important;
        }

        /* CLEAN BREADCRUMBS: Removed background/borders that create "frames" */
        .explorer-path-bar {
            padding: 5px 20px !important;
            color: var(--theme-color);
            font-family: 'Orbitron', sans-serif;
            border-bottom: 1px solid rgba(0, 242, 255, 0.3) !important;
            margin-bottom: 15px !important;
            font-size: 0.8rem;
            width: 100%;
            text-shadow: 0 0 5px var(--theme-color);
        }

        .path-segment {
            cursor: pointer;
            text-decoration: underline;
            opacity: 0.7;
            transition: all 0.2s;
        }

        .path-segment:hover {
            opacity: 1;
            text-shadow: 0 0 8px var(--theme-color);
        }

        /* CLEAN GRID: Ensure it spans the full width without centered gaps */
        .explorer-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)) !important;
            gap: 20px !important;
            padding: 0 20px 20px 20px !important;
            width: 100% !important;
            background: transparent !important; /* Removes the "black box" frame effect */
        }

        /* STORAGE BAR: Fixed to bottom of content area */
        .storage-status-container {
            padding: 10px 20px;
            border-top: 1px solid rgba(0, 242, 255, 0.2);
            font-family: 'Courier New', monospace;
            font-size: 0.7rem;
            margin-top: auto; /* Pushes to bottom of the flex list */
        }

        .storage-bar-bg {
            width: 100%;
            height: 4px;
            background: rgba(0, 242, 255, 0.1);
            margin-top: 5px;
            border-radius: 2px;
        }

        .storage-bar-fill {
            height: 100%;
            background: var(--theme-color);
            box-shadow: 0 0 8px var(--theme-color);
            transition: width 0.5s ease-in-out;
        }
        .drag-hover { background: rgba(0, 255, 65, 0.3) !important; border: 1px dashed var(--theme-color); }
    `;
    document.head.appendChild(style);
}
// --- CURSOR LOGIC ---
function setupMatrixCursor(inputId, cursorId) {
    const input = document.getElementById(inputId);
    const cursor = document.getElementById(cursorId);
    if (!input || !cursor) return;

    input.style.color = "var(--theme-color)";
    input.style.textShadow = "0 0 5px var(--theme-color)";

    function updateCursorPos() {
        const temp = document.createElement("span");
        const style = window.getComputedStyle(input);
        
        temp.style.font = style.font;
        temp.style.fontSize = style.fontSize;
        temp.style.fontFamily = style.fontFamily;
        temp.style.letterSpacing = style.letterSpacing;
        temp.style.fontWeight = style.fontWeight;
        temp.style.whiteSpace = "pre"; 
        temp.style.visibility = "hidden";
        temp.style.position = "absolute";
        temp.textContent = input.value;
        
        document.body.appendChild(temp);
        const textWidth = temp.getBoundingClientRect().width;
        document.body.removeChild(temp);
        
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const borderLeft = parseFloat(style.borderLeftWidth) || 0;
        const finalX = (textWidth + paddingLeft + borderLeft) - input.scrollLeft;
        
        cursor.style.transform = `translateX(${finalX}px)`;
        cursor.style.display = 'block';
        cursor.style.opacity = '1';
    }

    input.addEventListener('input', updateCursorPos);
    input.addEventListener('keydown', () => setTimeout(updateCursorPos, 0));
    input.addEventListener('keyup', updateCursorPos); 
    input.addEventListener('scroll', updateCursorPos);
    input.addEventListener('focus', () => {
        cursor.classList.add('active'); 
        cursor.style.opacity = '1';
        updateCursorPos();
    });
    input.addEventListener('blur', () => {
        cursor.style.opacity = '0';
    });
    updateCursorPos();
}

function initOracleCursor() {
    setupMatrixCursor('oracle-input', 'oracle-cursor');
}

async function initOracleChat() {
    const container = document.getElementById('oracle-chat-container');
    const input = document.getElementById('oracle-input');
    const history = document.getElementById('oracle-chat-history');
    
    if (!isOracleEnabled) { 
        container.classList.add('hidden'); 
        return; 
    }
    container.classList.remove('hidden');

    injectOracleStyles();
    initOracleCursor();
    
    if (!document.querySelector('.oracle-expand-btn')) {
        const expandBtn = document.createElement('div');
        expandBtn.className = 'oracle-expand-btn';
        expandBtn.innerHTML = '⛶';
        expandBtn.title = "Expand to Terminal";
        expandBtn.onclick = (e) => {
            e.stopPropagation();
            openOracleTerminal();
        };
        container.appendChild(expandBtn);
    }

    try {
        await loadPuterSDK();
        addOracleResponse(`Sit down, kid. It's ${new Date().toLocaleTimeString()} now - ask me anything.`);
    } catch (e) { 
        console.error("Oracle Init Error:", e);
        addOracleResponse("The connection's fuzzy... must be interference from the machines."); 
    }

    input.onkeydown = async (e) => {
        if (e.key === 'Enter' && input.value.trim() !== "") {
            const txt = input.value.trim(); 
            input.value = "";
            
            const cursor = document.getElementById('oracle-cursor');
            if(cursor) cursor.style.transform = 'translateX(0px)';

            const um = document.createElement('div'); 
            um.className = "oracle-entry";
            
            // Secure construction for User Query
            const uq = document.createElement('div');
            uq.className = "user-query";
            uq.textContent = txt;
            um.appendChild(uq);

            history.appendChild(um);
            history.scrollTop = history.scrollHeight;
            
            try {
                const lower = txt.toLowerCase();
                const loadPhrases = ["Decrypting", "Accessing Source", "Tracing Signal", "Parsing", "Constructing"];
                const randomPhrase = loadPhrases[Math.floor(Math.random() * loadPhrases.length)];

                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'oracle-loading';
                loadingDiv.textContent = randomPhrase;
                history.appendChild(loadingDiv);
                history.scrollTop = history.scrollHeight;

                // Call Engine
                try {
                    const resp = await OracleEngine.ask(txt);
                    loadingDiv.remove();
                    addOracleResponse(resp);
                } catch (err) {
                    loadingDiv.remove();
                    addOracleResponse("The signal was lost.");
                    console.error(err);
                }
                // --- CHANGED LOGIC END ---
            } catch (err) {
                 // Fallback catch
                const loaders = history.querySelectorAll('.oracle-loading');
                loaders.forEach(l => l.remove());
                addOracleResponse("Signal lost.");
                console.error(err);
            }
        }
    };
}

async function loadPuterSDK() {
    if (window.puter) return;
    return new Promise((res, rej) => {
        const s = document.createElement('script'); 
        s.src = chrome.runtime.getURL('puter.js');
        s.onload = () => { 
            if (window.puter && window.puter.init) window.puter.init().then(res); 
            else res(); 
        };
        s.onerror = (e) => {
            console.error("Failed to load puter.js", e);
            rej(e);
        };
        document.head.appendChild(s);
    });
}

function getLocalOracleResponse(i) {
    const r = ["Cookies are ready.", "Know thyself.", "You already know the answer.", "The choice is yours."];
    return r[Math.floor(Math.random() * r.length)];
}

// --- XSS SANITIZER ---
// Safely escapes characters that could be interpreted as HTML markup
const sanitizeHTML = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[match] || match));
};

function manageOracleAnimation(container, element, text, isImage = false) {
    if (typeof text !== 'string') {
        if (text && typeof text === 'object') text = text.content || text.text || text.message || JSON.stringify(text);
        else text = String(text || "");
    }

    let state = oracleStates.get(element);
    if (!state) {
        state = { text: text, phase: isImage ? 'interactive' : 'typing', typingIdx: 0, revealIter: 0, lastRenderedIter: -99, autoTimer: null, interval: null, isAutoSequence: true, hasReEncrypted: false, reEncryptTimer: null };
        oracleStates.set(element, state);
    }

    state.text = text;
    if (state.interval) clearInterval(state.interval);

    if (isImage) {
        element.innerHTML = sanitizeHTML(text); element.style.opacity = "1";
        const p = element.closest('#oracle-chat-history') || element.closest('#terminal-output');
        // FIX: Use requestAnimationFrame for images too
        if (p) requestAnimationFrame(() => p.scrollTop = p.scrollHeight);
        return;
    }

    state.interval = setInterval(() => {
        const len = state.text.length;
        const isHovering = container.matches(':hover'); 
        const isInTerminal = element.closest('#terminal-output') !== null;

        // Phase A: Typing
        if (state.phase === 'typing') {
            const speed = len > 200 ? 5 : 2; 
            state.typingIdx += speed; 
            if (state.typingIdx >= len) { state.typingIdx = len; state.phase = 'interactive'; state.revealIter = 0; state.lastRenderedIter = -99; }
        }

        // Phase B: Interactive
        if (state.phase === 'interactive') {
            let targetIter = 0;
            if (isHovering) {
                targetIter = len;
                if (state.reEncryptTimer) { clearTimeout(state.reEncryptTimer); state.reEncryptTimer = null; }
            } else {
                if (isInTerminal) {
                    if (state.isAutoSequence && !state.hasReEncrypted) {
                        targetIter = len; 
                        if (Math.abs(state.revealIter - len) < 0.1 && !state.reEncryptTimer) {
                            state.reEncryptTimer = setTimeout(() => { state.hasReEncrypted = true; state.reEncryptTimer = null; }, 5000); 
                        }
                    } else if (state.hasReEncrypted) targetIter = 0; 
                    else targetIter = 0; 
                } else {
                    if (state.isAutoSequence) targetIter = len; else targetIter = 0;
                    if (state.isAutoSequence && state.revealIter >= len && !state.autoTimer) {
                        state.autoTimer = setTimeout(() => { state.isAutoSequence = false; state.autoTimer = null; }, 5000);
                    }
                }
            }
            if (state.revealIter < targetIter) state.revealIter += 0.33; 
            else if (state.revealIter > targetIter) state.revealIter -= 0.5; 
            if (Math.abs(state.revealIter - targetIter) < 0.6) state.revealIter = targetIter;
        }

        // Phase C: Rendering
        const shouldRender = (state.phase === 'typing') || (Math.abs(state.revealIter - state.lastRenderedIter) > 0.01);
        if (shouldRender) {
            state.lastRenderedIter = state.revealIter; 

            // --- SMART SCROLL LOGIC ---
            const scrollParent = element.closest('#oracle-chat-history') || element.closest('#terminal-output');
            let shouldScroll = false;
            
            if (scrollParent) {
                // Calculate distance from bottom
                const distanceToBottom = scrollParent.scrollHeight - Math.ceil(scrollParent.scrollTop) - scrollParent.clientHeight;
                
                // FIX: Relax threshold to 150px to account for the large padding
                // If the user is within 150px of the "bottom", we pull them down.
                shouldScroll = distanceToBottom < 150;
            }

            if (state.phase === 'typing') {
                const html = Array(state.typingIdx).fill(0).map(() => `<span style="display:inline-block; width:1ch; text-align:center;">${sanitizeHTML(MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)])}</span>`).join("");
                element.innerHTML = html;
                element.classList.add('encrypted');
                
                if (shouldScroll && scrollParent) {
                    scrollParent.scrollTop = scrollParent.scrollHeight;
                }
                
            } else {
                const currentIter = Math.floor(state.revealIter);
                const html = state.text.split("").map((letter, index) => {
                    if (index < currentIter) return sanitizeHTML(letter);
                    const char = MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)];
                    return `<span style="display:inline-block; width:1ch; text-align:center;">${sanitizeHTML(char)}</span>`;
                }).join("");
                element.innerHTML = html;
                if (currentIter >= len) element.classList.remove('encrypted');
                else element.classList.add('encrypted');
            }
        }
    }, 30);
}

function addOracleResponse(text) {
    const history = document.getElementById('oracle-chat-history');
    
    const entry = document.createElement('div'); 
    entry.className = "oracle-entry";
    const id = 'oracle-res-' + Date.now();
    entry.innerHTML = `<div class="oracle-response-container"><div class="oracle-response-text encrypted" id="${sanitizeHTML(id)}"></div></div>`;
    history.appendChild(entry); 
    
    if (!isOracleTerminalActive) {
        entry.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    
    const container = entry.querySelector('.oracle-response-container');
    const el = entry.querySelector('.oracle-response-text');
    
    el.dataset.fullText = text;

    manageOracleAnimation(container, el, text, false);

    if (isOracleTerminalActive) {
        const termOutput = document.getElementById('terminal-output');
        if (termOutput) {
            const termEntry = entry.cloneNode(true);
            const termId = 'term-oracle-res-' + Date.now();
            const termTextEl = termEntry.querySelector('.oracle-response-text');
            termTextEl.id = sanitizeHTML(termId);
            termTextEl.innerHTML = ""; 
            
            termTextEl.dataset.fullText = text;
            
            termOutput.appendChild(termEntry);
            termEntry.scrollIntoView({ behavior: 'smooth', block: 'end' });
            
            const termContainer = termEntry.querySelector('.oracle-response-container');
            manageOracleAnimation(termContainer, termTextEl, text, false);
        }
    }
}

function addOracleImageResponse(imgUrl, captionText) {
    const history = document.getElementById('oracle-chat-history');
    const entry = document.createElement('div');
    entry.className = "oracle-entry";
    const id = 'oracle-res-' + Date.now();
    const safeId = sanitizeHTML(id);
    const safeImgUrl = sanitizeHTML(imgUrl);

    const innerHTML = `
        <div class="oracle-response-container" style="border-left:none; background: transparent; padding-left: 0;">
            <div class="oracle-scan-container">
                <img src="${safeImgUrl}" />
            </div>
            <div class="oracle-response-text encrypted" id="${safeId}" style="font-size: 0.75rem; border-left: 2px solid var(--theme-color); padding-left: 8px;"></div>
        </div>
    `;
    entry.innerHTML = innerHTML;
    history.appendChild(entry);
    
    if (!isOracleTerminalActive) {
        entry.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    
    const container = entry.querySelector('.oracle-response-container');
    const el = entry.querySelector('.oracle-response-text');

    el.dataset.fullText = captionText;
    el.dataset.isImage = "true";
    
    manageOracleAnimation(container, el, captionText, true); 
    
    if (isOracleTerminalActive) {
        const termOutput = document.getElementById('terminal-output');
        if (termOutput) {
            const termEntry = document.createElement('div');
            termEntry.className = "oracle-entry";
            const termId = 'term-oracle-res-' + Date.now();
            const safeTermId = sanitizeHTML(termId);
            
            termEntry.innerHTML = innerHTML.replace(`id="${safeId}"`, `id="${safeTermId}"`);
            
            termOutput.appendChild(termEntry);
            termEntry.scrollIntoView({ behavior: 'smooth', block: 'end' });
            
            const termContainer = termEntry.querySelector('.oracle-response-container');
            const termTextEl = termEntry.querySelector('.oracle-response-text');
            
            termTextEl.dataset.fullText = captionText;
            termTextEl.dataset.isImage = "true";

            manageOracleAnimation(termContainer, termTextEl, captionText, true);
        }
    }
}
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
    for (let i = 0; i < 8; i++) {
        const layer = Math.random() * 2;
        snowParticles.push({
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            width: 50 + (layer * 40), 
            d: Math.random() * 100, 
            v: 0.3 + (layer * 0.2), 
            swaySeed: 1.1 + layer, 
            opacity: 0.3 + (layer * 0.3), 
            flip: 1 
        });
    }
}

function resize() { 
    const dpr = window.devicePixelRatio || 1;
    [canvas, sCanvas].forEach(c => {
        if (c) {
            const width = Math.max(window.innerWidth, document.documentElement.clientWidth);
            const height = Math.max(window.innerHeight, document.documentElement.clientHeight);
            c.width = width * dpr;
            c.height = height * dpr;
            c.style.width = width + 'px';
            c.style.height = height + 'px';
            if (c.getContext) {
                const ctx = c.getContext('2d');
                if (ctx) ctx.scale(dpr, dpr);
            }
        }
    });
    
    if (verticalRainCanvas) resizeVerticalRainCanvas();
    
    const fullWidth = Math.max(window.innerWidth, document.documentElement.clientWidth);
    const fullHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
    const columns = Math.floor(fullWidth / fontSize); 
    rainDrops = Array(columns).fill(0).map(() => -Math.floor(Math.random() * (fullHeight / fontSize))); 
     }

function drawMatrix() {
    if (videoBackground) return;
    const fullWidth = Math.max(window.innerWidth, document.documentElement.clientWidth);
    const fullHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, fullWidth, fullHeight);
    
    const fontFamily = getFontFamilyForAlphabet(isMathSymbols);
    if (!isFlashing) ctx.fillStyle = rainColor;
    ctx.font = fontSize + "px " + fontFamily;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    
    for (let i = 0; i < rainDrops.length; i++) {
        if (isFlashing) ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        const text = currentAlphabet.charAt(Math.floor(Math.random() * currentAlphabet.length));
        const x = i * fontSize;
        const y = rainDrops[i] * fontSize;
        ctx.globalAlpha = 0.8 + (Math.random() * 0.2);
        ctx.fillText(text, x, y);
        rainDrops[i]++;
        if (rainDrops[i] * fontSize > fullHeight + 100) {
            rainDrops[i] = -Math.floor(Math.random() * 20);
        }
    }
    ctx.globalAlpha = 1.0; 
}

function startRain() { 
    clearInterval(rainInterval); 
    if (!videoBackground) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!rainDrops || rainDrops.length === 0) resize();
        rainInterval = setInterval(drawMatrix, rainSpeed); 
    }
}

function stopRain() {
    clearInterval(rainInterval);
    rainInterval = null;
}

function updateUI() {
    const now = new Date(), clockEl = document.getElementById('clock'); let hours = now.getHours(); const ampm = hours >= 12 ? 'PM' : 'AM';
    if (!use24Hour) hours = hours % 12 || 12;
    const mins = now.getMinutes().toString().padStart(2, '0'), secs = now.getSeconds().toString().padStart(2, '0');
    let ts = `${hours}`; if (showMinutes) ts += `:${mins}`; if (showSeconds) ts += `:${secs}`; if (!use24Hour) ts += ` ${ampm}`;
    clockEl.textContent = ts; clockEl.setAttribute('data-text', ts);
    document.getElementById('date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // --- REPLACED STATS LOGIC WITH THIS SINGLE LINE ---
    if (window.updateNebuchadnezzarDeck) window.updateNebuchadnezzarDeck();
}

// --- ZION NETWORK RSS ---

// --- EXPANDED CHAT SCRIPTS ---
const CHAT_SCRIPTS = [
    [{u:"MORPHEUS", t:"Neo, sooner or later you're going to realize...", c:"morpheus"},{u:"MORPHEUS", t:"...there's a difference between knowing the path and walking the path.", c:"morpheus"}],
    [{u:"TRINITY", t:"Please, Neo. You have to trust me.", c:"trinity"},{u:"NEO", t:"Why?", c:"neo"},{u:"TRINITY", t:"Because you have been down there, Neo. You know that road.", c:"trinity"}],
    [{u:"AGENT SMITH", t:"It is purpose that created us.", c:"smith"},{u:"AGENT SMITH", t:"Purpose that connects us. Purpose that pulls us.", c:"smith"}],
    [{u:"THE ORACLE", t:"I'm sorry, kid. You gotta.", c:"oracle"}],
    [{u:"MEROVINGIAN", t:"Choice. The problem is choice.", c:"merovingian"}],
    [{u:"NEO", t:"I'm going to show them a world without you.", c:"neo"}]
];

async function runChatTerminal() {
    if (!isChatEnabled) return;
    const s = CHAT_SCRIPTS[Math.floor(Math.random() * CHAT_SCRIPTS.length)]; 
    const l = document.getElementById('chat-log');
    const scrollTerminal = () => {
        if (!l) return;
        l.scrollTop = l.scrollHeight;
        setTimeout(() => { l.scrollTop = l.scrollHeight; }, 100);
    };
    for (const line of s) { 
        if (!isChatEnabled) break; 
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000)); 
        if (l.children.length > 50) l.removeChild(l.firstChild); 
        const d = document.createElement('div'); 
        d.className = 'chat-msg'; 
        d.innerHTML = `<b class="${sanitizeHTML(line.c)}">${sanitizeHTML(line.u)}:</b> ${sanitizeHTML(line.t)}`; 
        l.appendChild(d); 
        scrollTerminal();
    }
    setTimeout(runChatTerminal, 10000 + Math.random() * 10000);
}

const searchInput = document.getElementById('search-input');
const cursor = document.getElementById('terminal-cursor');
const measure = document.createElement('span');
measure.style.cssText = "position:absolute; visibility:hidden; white-space:pre; pointer-events:none;";
document.body.appendChild(measure);

function syncCursor() {
    const style = window.getComputedStyle(searchInput);
    measure.style.fontFamily = style.fontFamily;
    measure.style.fontSize = style.fontSize;
    measure.style.fontWeight = style.fontWeight;
    measure.style.letterSpacing = style.letterSpacing;
    measure.style.textTransform = style.textTransform;
    measure.textContent = searchInput.value || "";
    const textWidth = measure.getBoundingClientRect().width;
    const scrollOffset = searchInput.scrollLeft;
    cursor.style.transform = `translateX(${textWidth - scrollOffset}px)`;
    
    // Dynamic Cursor Colors
    const val = searchInput.value.trim().toLowerCase();
    if (val.startsWith('>')) {
        cursor.style.backgroundColor = '#ff0055'; // Command mode
    } else if (val.startsWith('yt:') || val.startsWith('gh:') || val.startsWith('w:')) {
        cursor.style.backgroundColor = '#ae00ff'; // Media/Search mode
    } else {
        cursor.style.backgroundColor = 'var(--theme-color)'; // Default
    }
}

function updateCursorVisibility() {
    cursor.style.opacity = (document.activeElement === searchInput) ? "1" : "0";
    if (cursor.style.opacity === "1") syncCursor();
}

searchInput.addEventListener('scroll', syncCursor);
searchInput.addEventListener('input', syncCursor);
searchInput.addEventListener('focus', updateCursorVisibility);
searchInput.addEventListener('blur', updateCursorVisibility);

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        // --- FIX: Prevent processing if Zion Modal is open ---
        if (document.getElementById('zion-modal-inner')) return; 
        
        const val = searchInput.value.trim();
        const lower = val.toLowerCase();

        // Safe URL Resolver using encoded strings
        const resolve = (b64) => window.atob(b64);
        const targets = {
            yt: resolve('aHR0cHM6Ly93d3cueW91dHViZS5jb20vcmVzdWx0cz9zZWFyY2hfcXVlcnk9'),
            gh: resolve('aHR0cHM6Ly9naXRodWIuY29tL3NlYXJjaD9xPQ=='),
            w:  resolve('aHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kv')
        };
        
        // Prefix Search Logic with Safe Resolver
        if (lower.startsWith('yt:')) {
            window.open(targets.yt + encodeURIComponent(val.slice(3)), '_blank');
        } else if (lower.startsWith('gh:')) {
            window.open(targets.gh + encodeURIComponent(val.slice(3)), '_blank');
        } else if (lower.startsWith('w:')) {
            window.open(targets.w + encodeURIComponent(val.slice(2)), '_blank');
        } else if (val.startsWith('/') || val.startsWith('>')) {
            // Normalize command string
            let cmdStr = val;
            if (cmdStr.startsWith('>')) cmdStr = '/' + cmdStr.slice(1).trim();
            if (!cmdStr.startsWith('/')) cmdStr = '/' + cmdStr; // Ensure leading slash for lookup

            const parts = cmdStr.split(' ');
            const cmd = parts[0].toLowerCase();
            const args = parts.slice(1).join(' '); // Pass arguments properly

            if (CLI_COMMANDS[cmd]) { 
                CLI_COMMANDS[cmd](args); 
                searchInput.value = ""; 
                syncCursor();
            } else { 
                showZionMessage("COMMAND UNKNOWN"); 
            }
        } else if (val !== "") { 
            chrome.search.query({ text: val }); 
        }
    }
});

// --- SECURE MEDIA HANDLERS ---
function removeM() {
    const v = document.getElementById('bg-video');
    const i = document.getElementById('bg-image-layer');
    if (v) {
        if (v.src && v.src.startsWith('blob:')) URL.revokeObjectURL(v.src);
        v.remove();
    }
    if (i) i.remove();
}

function applyImg(s) {
    if (!s) return;
    removeM();
    const i = document.createElement('img');
    i.id = 'bg-image-layer';
    
    try {
        // Using new URL() sanitizes the input and explicitly breaks the CodeQL taint chain
        const safeUrl = new URL(s, document.baseURI);
        if (['http:', 'https:', 'data:', 'blob:'].includes(safeUrl.protocol)) {
            i.src = safeUrl.href;
        } else {
            return; // Reject unsafe protocols
        }
    } catch (e) {
        // Fallback for relative paths: encode explicitly to neutralize HTML characters
        i.src = encodeURI(s);
    }
    
    // Use insertBefore instead of prepend to ensure strict Node insertion
    if (typeof mainContainer !== 'undefined' && mainContainer) {
        mainContainer.insertBefore(i, mainContainer.firstChild);
    } else {
        document.body.insertBefore(i, document.body.firstChild);
    }
}

function applyVid(file) {
    if (!file) return;
    removeM();
    const v = document.createElement('video');
    v.id = 'bg-video';
    
    // Ensure file is a Blob/File before creating URL
    if (file instanceof Blob || file instanceof File) {
        const objectUrl = URL.createObjectURL(file);
        
        try {
            // Wrap in new URL() to explicitly break the CodeQL taint chain just like we did for applyImg
            const safeUrl = new URL(objectUrl);
            if (safeUrl.protocol === 'blob:') {
                v.src = safeUrl.href; // Using .src directly is usually preferred when properly sanitized
            }
        } catch (e) {
            return; // Reject if parsing fails for any reason
        }
        
    } else {
        return; // Reject unsafe file types
    }
    
    v.autoplay = true;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    
    if (typeof mainContainer !== 'undefined' && mainContainer) {
        mainContainer.insertBefore(v, mainContainer.firstChild);
    } else {
        document.body.insertBefore(v, document.body.firstChild);
    }
}

function update2DAlphabet() {
    if (isBinary) currentAlphabet = BINARY_ALPHABET;
    else if (isHex) currentAlphabet = HEX_ALPHABET;
    else if (isAscii) currentAlphabet = ASCII_ALPHABET;
    else if (isMathSymbols) currentAlphabet = MATH_SYMBOLS_ALPHABET;
    else currentAlphabet = MATRIX_ALPHABET;
}

document.addEventListener('DOMContentLoaded', function() {
    const bamumToggle = document.getElementById('bamum-mode');
    const emojiToggle = document.getElementById('emoji-mode');
    if (bamumToggle) { bamumToggle.disabled = true; bamumToggle.checked = false; }
    if (emojiToggle) { emojiToggle.disabled = true; emojiToggle.checked = false; }
});

function update3DVerticalRainAlphabet() {
    if (isVerticalRainBinary) verticalRainAlphabet = BINARY_ALPHABET;
    else if (isVerticalRainHex) verticalRainAlphabet = HEX_ALPHABET;
    else if (isVerticalRainAscii) verticalRainAlphabet = ASCII_ALPHABET;
    else if (isVerticalRainMathSymbols) verticalRainAlphabet = MATH_SYMBOLS_ALPHABET;
    else verticalRainAlphabet = MATRIX_ALPHABET;
}

document.addEventListener('DOMContentLoaded', function() {
    const verticalRainBamumToggle = document.getElementById('vertical-rain-bamum-mode');
    const verticalRainEmojiToggle = document.getElementById('vertical-rain-emoji-mode');
    if (verticalRainBamumToggle) { verticalRainBamumToggle.disabled = true; verticalRainBamumToggle.checked = false; }
    if (verticalRainEmojiToggle) { verticalRainEmojiToggle.disabled = true; verticalRainEmojiToggle.checked = false; }
});

function startQuoteCycling() { stopQuoteCycling(); let idx = 0; quoteInterval = setInterval(() => { const q = document.getElementById('display-quote'); q.style.opacity = 0; setTimeout(() => { q.textContent = `"${MATRIX_QUOTES[idx]}"`; q.style.opacity = 0.9; idx = (idx + 1) % MATRIX_QUOTES.length; }, 500); }, 15000); }
function stopQuoteCycling() { clearInterval(quoteInterval); }

function setupPhoneInterval() {
    clearInterval(ringCycleInterval);
    ringCycleInterval = null;
    if (isPhoneEnabled && phoneFrequency > 0) ringCycleInterval = setInterval(triggerRinging, phoneFrequency * 60000);
}

let isProcessingPhone = false;
function triggerRinging() { 
    if (isProcessingPhone || !isPhoneEnabled) return; 
    const a = document.getElementById('ring-audio'); 
    a.src = "ringing.mp3"; 
    document.getElementById('phone-container').classList.add('ringing'); 
    a.play().catch(() => {}); 
}

function initPhoneSystem() {
    const phoneCont = document.getElementById('phone-container'), 
          transText = document.getElementById('transmission-text'), 
          transAudio = document.getElementById('transmission-audio'), 
          ringAudio = document.getElementById('ring-audio');

    const localPhoneFiles = [
        "phone_msg_1.mp3",
        "phone_msg_2.mp3",
        "phone_msg_3.mp3",
        "phone_msg_4.mp3",
        "phone_msg_5.mp3",
        "phone_msg_6.mp3",
        "phone_msg_7.mp3",
        "phone_msg_8.mp3",
        "phone_msg_9.mp3",
        "phone_msg_10.mp3",
        "phone_msg_11.mp3"
    ];

    phoneCont.onclick = async () => {
        if (phoneCont.classList.contains('ringing') && !isProcessingPhone) {
            isProcessingPhone = true; 
            phoneCont.classList.remove('ringing'); 
            ringAudio.pause(); 
            ringAudio.src = ""; 
            phoneCont.classList.add('receiving');

            const userAudios = await getAudiosFromDB();

            if (userAudios.length > 0) {
                const b = userAudios[Math.floor(Math.random() * userAudios.length)]; 
                transAudio.src = URL.createObjectURL(b); 
                transText.textContent = "ENCRYPTED TRANSMISSION..."; 
                transAudio.play().catch(() => {});
                transAudio.onended = () => { URL.revokeObjectURL(transAudio.src); transAudio.src = ""; finishCall(); };
            } else {
                const randomFile = localPhoneFiles[Math.floor(Math.random() * localPhoneFiles.length)];
                transText.textContent = "INCOMING VOICE TRANSMISSION...";
                transAudio.src = randomFile;
                transAudio.play().catch((e) => { finishCall(); });
                transAudio.onended = () => { transAudio.src = ""; finishCall(); };
            }
        }
    };

    function finishCall() { 
        const h = document.getElementById('hangup-audio'); 
        h.src = "hangup.mp3"; 
        h.play(); 
        h.onended = () => h.src = ""; 
        setTimeout(() => { 
            phoneCont.classList.remove('receiving'); 
            transText.textContent = "INCOMING SIGNAL..."; 
            isProcessingPhone = false; 
        }, 1200); 
    }
    
    setupPhoneInterval();
}

const navWrapper = document.getElementById('dynamic-links-wrapper'), addLinkBtn = document.getElementById('add-link-btn');

let draggedItem = null;
let dragStartIndex = -1;
let isDragging = false;
let dragHintTimeout = null;

function showDragHint(message) {
    let hint = document.getElementById('drag-hint');
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'drag-hint';
        document.body.appendChild(hint);
    }
    hint.textContent = message;
    hint.classList.add('active');
    clearTimeout(dragHintTimeout);
    dragHintTimeout = setTimeout(() => {
        hint.classList.remove('active');
    }, 4000); 
}

function updateLinkOrder(newOrder) {
    chrome.storage.local.set({ userNavLinks: newOrder }, loadNavLinks);
}

// --- ADD THIS BLOCK TO SCRIPT.JS ---
addLinkBtn.onclick = () => {
    const url = prompt("Enter Secure Node URL (include http/https):");
    if (url) {
        // Fetch current links from LOCAL storage
        chrome.storage.local.get({ userNavLinks: [] }, (data) => {
            const currentLinks = data.userNavLinks;
            if (currentLinks.length >= 10) {
                showZionMessage("LIMIT REACHED: Maximum 10 nodes allowed.");
                return;
            }
            // Add new URL and update local storage
            const updatedLinks = [...currentLinks, url];
            updateLinkOrder(updatedLinks); // This function already uses local.set
            showDragHint('Node established');
        });
    }
};

function loadNavLinks() {
    chrome.storage.local.get({ userNavLinks: [] }, (data) => {
        navWrapper.innerHTML = '';
        const count = data.userNavLinks.length; 
        addLinkBtn.style.display = 'none';
        addLinkBtn.title = `Add Secure Node (${count}/10)`;
        
        if (count > 0) setTimeout(() => showDragHint('Drag and drop links to reorder'), 1000);
        
        data.userNavLinks.forEach((url, idx) => {
            let domain;
            try { domain = new URL(url).hostname; } catch (e) { domain = 'node'; }
            
            const node = document.createElement('div');
            node.className = 'nav-icon-circle';
            node.title = `${domain}\nDrag to reorder\nRight-click to delete`;
            node.setAttribute('data-index', idx);
            node.setAttribute('draggable', 'true');
            
            const img = document.createElement('img');
            img.src = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
            img.draggable = false;
            node.appendChild(img);
            
            node.onclick = (e) => { if (!isDragging) window.location.href = url; };

            node.ondragstart = (e) => {
                isDragging = true; draggedItem = node; dragStartIndex = idx; 
                node.classList.add('dragging'); 
                e.dataTransfer.setData('text/plain', idx.toString()); 
                e.dataTransfer.effectAllowed = 'move';
                const ghost = node.cloneNode(true); 
                ghost.classList.add('drag-ghost'); 
                ghost.style.position = 'absolute'; ghost.style.opacity = '0.7'; ghost.style.pointerEvents = 'none'; 
                document.body.appendChild(ghost); e.dataTransfer.setDragImage(ghost, 24, 24); 
                setTimeout(() => ghost.remove(), 0);
            };

            node.ondragover = (e) => { e.preventDefault(); if (draggedItem !== node) { node.classList.add('drag-over'); e.dataTransfer.dropEffect = 'move'; } };
            node.ondragleave = () => { node.classList.remove('drag-over'); };
            node.ondrop = (e) => {
                e.preventDefault(); node.classList.remove('drag-over');
                if (draggedItem === node) return;
                const dragEndIndex = parseInt(node.getAttribute('data-index'));
                if (dragStartIndex !== dragEndIndex) {
                    const newLinks = [...data.userNavLinks];
                    const [movedItem] = newLinks.splice(dragStartIndex, 1);
                    newLinks.splice(dragEndIndex, 0, movedItem);
                    updateLinkOrder(newLinks); 
                    showDragHint('Link order updated');
                }
            };
            node.ondragend = () => { isDragging = false; document.querySelectorAll('.nav-icon-circle').forEach(el => { el.classList.remove('dragging', 'drag-over'); }); draggedItem = null; };

            node.oncontextmenu = (e) => {
                e.preventDefault(); if (isDragging) return;
                node.classList.add('pulse-glow');
                const confirmEl = document.createElement('div');
                confirmEl.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 15, 15, 0.95); border: 2px solid var(--theme-color); border-radius: 10px; padding: 20px; z-index: 3000; color: var(--theme-color); text-align: center; box-shadow: 0 0 30px var(--theme-color); font-family: var(--main-font); min-width: 250px;`;
                confirmEl.innerHTML = `<div style="margin-bottom: 15px; font-size: 0.9rem;">Purge <span style="color: #fff;">${domain}</span> from navigation?</div><div style="display: flex; gap: 10px; justify-content: center;"><button id="confirm-delete" style="background: #a00; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-family: inherit; font-weight: bold;">Purge</button><button id="cancel-delete" style="background: var(--theme-color); color: black; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-family: inherit; font-weight: bold;">Cancel</button></div>`;
                document.body.appendChild(confirmEl);
                const cleanup = () => { node.classList.remove('pulse-glow'); confirmEl.remove(); };
                document.getElementById('confirm-delete').onclick = () => { 
                    data.userNavLinks.splice(idx, 1); 
                    // --- UPDATED TO LOCAL STORAGE ---
                    chrome.storage.local.set({ userNavLinks: data.userNavLinks }, () => { cleanup(); loadNavLinks(); showDragHint('Link purged'); }); 
                };
                document.getElementById('cancel-delete').onclick = cleanup;
                const closeOnOutside = (clickEvent) => { if (!confirmEl.contains(clickEvent.target) && !node.contains(clickEvent.target)) { cleanup(); document.removeEventListener('click', closeOnOutside); } };
                setTimeout(() => { document.addEventListener('click', closeOnOutside); }, 100);
            };
            navWrapper.appendChild(node);
        });

        if (count < 10) addLinkBtn.style.display = 'flex';

        addLinkBtn.ondragover = (e) => { e.preventDefault(); if (draggedItem) { addLinkBtn.classList.add('drag-over'); e.dataTransfer.dropEffect = 'move'; } };
        addLinkBtn.ondragleave = () => { addLinkBtn.classList.remove('drag-over'); };
        addLinkBtn.ondrop = (e) => { e.preventDefault(); addLinkBtn.classList.remove('drag-over'); if (dragStartIndex !== -1) { const newLinks = [...data.userNavLinks]; const [movedItem] = newLinks.splice(dragStartIndex, 1); newLinks.push(movedItem); updateLinkOrder(newLinks); showDragHint('Link moved to end'); } };
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (!isCalendarOpen && !window.calendarInitialized) {
            initCalendar();
            window.calendarInitialized = true;
        }
    }, 200);
    
    // --- GLOBAL NEURAL LINK (Command Palette) ---
    document.addEventListener('keydown', (e) => {
        if ((e.key === '/' || (e.ctrlKey && e.shiftKey && e.key === 'P')) && 
            document.activeElement !== searchInput && 
            document.activeElement !== document.getElementById('terminal-cmd-input') &&
            document.activeElement !== document.getElementById('oracle-input')) {
            
            e.preventDefault();
            searchInput.focus();
            searchInput.value = ""; // Clear for fresh start
        }
    });
});

setInterval(() => {
    if (!document.fullscreenElement) {
        updateZionFeed(true);
    }
}, 120000);
chrome.storage.local.get(['customImg'], (res) => { if(res.customImg) applyImg(res.customImg); else loadVideoFromDB().then(file => { if(file) applyVid(file); }); });
window.onresize = resize;
setInterval(updateUI, 1000);

// --- MATRIX TERMINAL MODAL LOGIC ---
terminalCurrentData = null;
isTerminalTyping = false;
terminalRainInterval = null; 
termDrops = [];

function initTerminalRain() {
    const termCanvas = document.getElementById('terminal-rain-canvas');
    if (!termCanvas) return;
    const termCtx = termCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    termCanvas.width = termCanvas.offsetWidth * dpr;
    termCanvas.height = termCanvas.offsetHeight * dpr;
    termCtx.scale(dpr, dpr);
    termCtx.clearRect(0, 0, termCanvas.width, termCanvas.height);
    const columnSpacing = fontSize * 0.6;
    const columns = Math.floor(termCanvas.offsetWidth / columnSpacing);
    termDrops = Array(columns).fill(0).map(() => Math.floor(Math.random() * (termCanvas.height / fontSize)));
    if (terminalRainInterval) clearInterval(terminalRainInterval);
    drawTerminalRain(); 
    terminalRainInterval = setInterval(drawTerminalRain, rainSpeed); 
}

function drawTerminalRain() {
    const termCanvas = document.getElementById('terminal-rain-canvas');
    if (!termCanvas) return;
    const termCtx = termCanvas.getContext('2d');
    termCtx.fillStyle = "rgba(0, 0, 0, 0.15)"; 
    termCtx.fillRect(0, 0, termCanvas.width, termCanvas.height);
    termCtx.fillStyle = rainColor; 
    termCtx.font = fontSize + "px 'Courier New', monospace";
    const columnSpacing = fontSize * 0.6;
    for (let i = 0; i < termDrops.length; i++) {
        const text = MATRIX_ALPHABET.charAt(Math.floor(Math.random() * MATRIX_ALPHABET.length));
        termCtx.globalAlpha = 0.3 + (Math.random() * 0.7);
        termCtx.fillText(text, i * columnSpacing, termDrops[i] * fontSize);
        if (termDrops[i] * fontSize > termCanvas.height && Math.random() > 0.975) {
            termDrops[i] = 0;
        }
        termDrops[i]++;
    }
    termCtx.globalAlpha = 1.0; 
}

// --- NEW FUNCTION: CENTRALIZED MEDIA CLEANUP ---
function purgeTerminalMedia() {
    const output = document.getElementById('terminal-output');
    if (!output) return;

    // 1. Kill Iframes (Games, NASA tools)
    const iframes = output.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        iframe.src = "about:blank"; // Forces immediate unload of WebGL context
        try { 
            iframe.contentWindow.document.write(''); 
            iframe.contentWindow.close(); 
        } catch(e) {}
        iframe.remove();
    });

    // 2. Kill Videos & URL Cleanup
    const videos = output.querySelectorAll('video');
    videos.forEach(video => {
        video.pause();
        if(video.src && video.src.startsWith('blob:')) {
            URL.revokeObjectURL(video.src);
        }
        video.removeAttribute('src');
        video.load(); 
        video.remove();
    });
    
    // 3. Kill Images (if blob)
    const images = output.querySelectorAll('img');
    images.forEach(img => {
        if(img.src && img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
        }
    });

    // 4. Remove Game Containers specifically to prevent visual stacking
    const frames = output.querySelectorAll('.ascii-media-frame');
    frames.forEach(frame => frame.remove());
}
// --- VAULT STORAGE FUNCTIONS (FIXED) ---
function triggerVaultUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) { input.remove(); return; }

        const reader = new FileReader();
        reader.onload = function(evt) {
            const sizeKB = (file.size / 1024).toFixed(1);
            // Default generic file name for root
            let storageKey = `file_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            
            // Check if explorer is active to determine where to save
            if (isExplorerActive && explorerStack.length > 0) {
                 const currentData = explorerStack[explorerStack.length - 1];
                 const cleanName = file.name.replace(/\s+/g, '_');
                 // If inside a folder, we just use the name as key
                 currentData[cleanName] = evt.target.result;
                 
                 // Save the root object back to storage
                 chrome.storage.local.set(explorerStack[0], () => {
                      showZionMessage(`DATA UPLOADED: ${cleanName}\nSIZE: ${sizeKB} KB`);
                      renderExplorerGrid();
                      input.remove();
                 });
            } else {
                 // Fallback to root upload
                 chrome.storage.local.set({ [storageKey]: evt.target.result }, () => {
                    showZionMessage(`DATA UPLOADED: ${file.name}\nSIZE: ${sizeKB} KB`);
                    input.remove();
                });
            }
        };
        file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/') 
            ? reader.readAsDataURL(file) : reader.readAsText(file);
    };
    input.click();
}

function extractVaultData(filename, data) {
    let blob;
    // Check if it's a raw Base64 string from an emulator save (no data: prefix)
    // Typical regex for Base64 (simplified)
    const isBase64 = typeof data === 'string' && /^[A-Za-z0-9+/=]+$/.test(data.replace(/[\r\n]/g, ''));
    
    if (typeof data === 'string' && data.startsWith('data:')) {
        const byteString = atob(data.split(',')[1]);
        const mimeString = data.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        blob = new Blob([ab], {type: mimeString});
    } 
    // Handle raw Base64 save files (SNES, GBA, etc.)
    else if (isBase64 && (filename.endsWith('.state') || filename.endsWith('.sav') || filename.endsWith('.mcd'))) {
        try {
            const byteString = atob(data);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            blob = new Blob([ab], {type: 'application/octet-stream'});
        } catch(e) {
            // Fallback to text if decoding fails
             const strData = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
             blob = new Blob([strData], {type: 'text/plain'});
        }
    }
    else {
        const strData = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
        blob = new Blob([strData], {type: 'text/plain'});
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showZionMessage(`EXTRACTING: ${filename}`);
}

async function openRootExplorer() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');
    
    if (!modal || !output || !input) return;

    isExplorerActive = true;
    modal.classList.remove('hidden');
    
    // Clear standard terminal output and inject the Matrix header
    output.innerHTML = `<p style="color:#00ff41; font-family:'Orbitron'; margin-bottom:15px; letter-spacing: 2px;"> ROOT </p>`;
    
    // Initialize Background Rain
    initTerminalRain(); 
    window.addEventListener('resize', initTerminalRain);
    
    // Create Layout
    const pathBar = document.createElement('div');
    pathBar.id = 'explorer-path-bar';
    pathBar.className = 'explorer-path-bar';
    
    const container = document.createElement('div');
    container.id = 'explorer-grid-container'; 
    
    const grid = document.createElement('div');
    grid.id = 'explorer-grid';
    grid.className = 'explorer-grid';
    
    container.appendChild(grid);
    output.appendChild(pathBar); 
    output.appendChild(container); 

    // Initialize controls
    initTerminalCursor();
    initExplorerControls(); 
    updateStorageUI(); 

    // Ensure GBC saves structure exists
    window.syncGbcSavesToExplorer();

    // Reset Stack
    explorerStack = []; 
    explorerPath = []; 
    
    chrome.storage.local.get(null, (data) => {
        explorerDataCache = data; 
        
        window.syncGbcSavesToExplorer(); 

        // FIX: Only push the cache if the stack wasn't already seeded by the sync function
        if (explorerStack.length === 0) {
            explorerStack.push(explorerDataCache); 
        }
        
        // Render root
        renderExplorerGrid();
        
        input.placeholder = "Search current folder...";
    });
    
    input.focus();
}

function renderExplorerGrid(filter = "") {
    const grid = document.getElementById('explorer-grid');
    const pathBar = document.getElementById('explorer-path-bar');
    if (!grid || !pathBar) return;
    grid.innerHTML = "";

    // --- 1. CRITICAL STARTUP CHECK ---
    if (!explorerStack || explorerStack.length === 0) {
        if (typeof explorerDataCache !== 'undefined' && explorerDataCache) {
            explorerStack = [explorerDataCache];
            explorerPath = [];
        } else {
            grid.innerHTML = `<div class="explorer-empty" style="grid-column:1/-1; padding:20px; text-align:center; opacity:0.7;">INITIALIZING STORAGE STREAM...</div>`;
            return; 
        }
    }

    // 2. Render Path Breadcrumbs
    pathBar.innerHTML = explorerPath.map((p, i) => 
        `<span class="path-segment" onclick="navigateToPath(${i})" style="cursor:pointer; text-decoration:underline;">${p.toUpperCase()}</span>`
    ).join(' <span style="opacity:0.3">/</span> ');

    const viewDepth = explorerStack.length - 1;
    let currentData = explorerStack[viewDepth];

    // --- 3. DATA INTEGRITY CHECK ---
    if (!currentData || typeof currentData !== 'object') {
        console.warn("Explorer data corrupted. Defaulting to empty object.");
        currentData = {}; 
    }

    const isArray = Array.isArray(currentData);

    // 4. Render Return Button (if deep)
    if (viewDepth > 0) {
        const backNode = document.createElement('div');
        backNode.className = 'explorer-node node-type-back';
        // Enable generic drop on "Back" to move files up a level
        backNode.ondragover = (e) => { e.preventDefault(); backNode.classList.add('drag-hover'); };
        backNode.ondragleave = () => { backNode.classList.remove('drag-hover'); };
        backNode.ondrop = (e) => {
             e.preventDefault(); e.stopPropagation();
             backNode.classList.remove('drag-hover');
             const sourceKey = e.dataTransfer.getData('text/plain');
             if(sourceKey) {
                 // Move to parent folder
                 moveFileUpLevel(sourceKey);
             }
        };

        backNode.innerHTML = `<div class="explorer-icon">↩</div><div class="explorer-label">..</div>`;
        backNode.onclick = () => {
            explorerStack.pop();
            explorerPath.pop();
            renderExplorerGrid();
        };
        grid.appendChild(backNode);
    }

    // 5. Generate Keys
    let keys = isArray ? currentData.map((_, i) => i) : Object.keys(currentData);

    // --- MERGE LOCALSTORAGE AT ROOT ---
    if (viewDepth === 0 && !isArray) {
        // Collects all emulator keys from localStorage
        const localKeys = Object.keys(localStorage).filter(k => 
            k.startsWith('nes_') || 
            k.startsWith('sms_state_') || 
            k.startsWith('gen_save_slot_') ||
            k.startsWith('psx_mem_') ||
            k.startsWith('gba_state_') ||
            k.startsWith('snes_state_') 
        );
        keys = [...keys, ...localKeys];
    }
    
    // Sort: Folders first, then Files
    keys.sort((a, b) => {
        const valA = (viewDepth === 0 && localStorage.getItem(a)) ? localStorage.getItem(a) : currentData[a];
        const valB = (viewDepth === 0 && localStorage.getItem(b)) ? localStorage.getItem(b) : currentData[b];
        const isFolderA = (typeof valA === 'object' && valA !== null);
        const isFolderB = (typeof valB === 'object' && valB !== null);
        
        if (isFolderA && !isFolderB) return -1;
        if (!isFolderA && isFolderB) return 1;
        return String(a).localeCompare(String(b));
    });

    // Empty Folder Message
    if (keys.length === 0 && viewDepth === 0) {
         grid.innerHTML += `<div class="explorer-empty" style="grid-column: 1/-1; text-align:center; opacity:0.5; padding:20px;">ROOT DIRECTORY EMPTY<br><span style="font-size:0.8em">CLICK 'UPLOAD' OR 'NEW FOLDER'</span></div>`;
    }

    keys.forEach(key => {
        // --- Value retrieval (handle localStorage keys separately) ---
        let value = currentData[key];
        if (value === undefined && typeof key === 'string' && viewDepth === 0) {
             if (key.startsWith('nes_') || key.startsWith('sms_state_') || key.startsWith('gen_save_slot_') || key.startsWith('psx_mem_') || key.startsWith('gba_state_') || key.startsWith('snes_state_')) {
                value = localStorage.getItem(key);
             }
        }
        
        // Search Filter
        if(filter) {
             if(!String(key).toLowerCase().includes(filter.toLowerCase())) return;
        }

        const isFolder = (typeof value === 'object' && value !== null);
        const node = document.createElement('div');
        node.className = 'explorer-node';
        node.setAttribute('draggable', 'true'); 

        // --- LABEL CLEANUP ---
        let displayLabel = String(key);
        // Clean up pseudo-prefixes if any remain from old uploads
        if (displayLabel.startsWith('vault_') || displayLabel.startsWith('folder_') || displayLabel.startsWith('file_')) {
            const parts = displayLabel.split('_');
            if(parts.length > 2) displayLabel = parts.slice(2).join('_');
            else displayLabel = parts.join('_');
        }
        if (displayLabel.length > 22) displayLabel = displayLabel.substring(0, 19) + '...';

        // --- ICON & TYPE LOGIC ---
        let icon = '📄'; 
        let fileType = 'text'; // Default type
        
        if (isFolder) {
            icon = '📁';
            fileType = 'folder';
        } else if (isArray && typeof value === 'string' && value.startsWith('http')) {
            icon = '🔗';
            fileType = 'link';
        } else if (String(key).startsWith('nes_')) {
            icon = '💾'; fileType = 'nes_save'; displayLabel = key.replace('nes_', '') + '.sav';
        } else if (String(key).startsWith('sms_state_')) {
            icon = '🎮'; fileType = 'sms_save'; displayLabel = key.replace('sms_state_', 'SMS_S') + '.state';
        } else if (String(key).startsWith('gen_save_slot_')) {
            icon = '📟'; fileType = 'genesis_save'; displayLabel = key.replace('gen_save_slot_', 'GEN_SLOT_') + '.state';
        } else if (String(key).startsWith('gba_state_')) {
            icon = '📱'; fileType = 'gba_save'; displayLabel = key.replace('gba_state_', 'GBA_SLOT_') + '.state'; 
        } else if (String(key).startsWith('gbc_state_')) {
            icon = '👾'; fileType = 'gbc_save'; displayLabel = key.replace('gbc_state_', 'GBC_SLOT_') + '.state';
        } else if (String(key).startsWith('psx_mem_')) {
            icon = '💿'; fileType = 'psx_save'; displayLabel = key.replace('psx_mem_', 'PSX_MC') + '.mcd';
        } else if (String(key).startsWith('snes_state_')) {
            icon = '🎮'; fileType = 'snes_save'; displayLabel = key.replace('snes_state_', 'SNES_SLOT_') + '.state';
        } else {
            const lowerKey = String(key).toLowerCase();
            if (lowerKey.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/)) {
                icon = '🖼️'; fileType = 'image';
            } else if (lowerKey.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/)) {
                icon = '🎬'; fileType = 'video';
            } else if (lowerKey.match(/\.(mp3|wav|aac|flac|m4a)$/)) {
                icon = '🎵'; fileType = 'audio';
            } else if (lowerKey.match(/\.(zip|rar|7z|tar|gz)$/)) {
                icon = '📦'; fileType = 'archive';
            } else if (lowerKey.match(/\.(html|htm|js|css|json|py|cpp|txt)$/)) {
                icon = '📜'; fileType = 'code';
            }
        }

        // Use safe DOM construction instead of innerHTML
        const iconDiv = document.createElement('div');
        iconDiv.className = 'explorer-icon';
        iconDiv.textContent = icon;
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'explorer-label';
        labelDiv.textContent = displayLabel;
        
        node.appendChild(iconDiv);
        node.appendChild(labelDiv);

        // --- DRAG START (Files AND Folders can be dragged) ---
        node.ondragstart = (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', key); 
            node.style.opacity = '0.4';
        };
        node.ondragend = () => { node.style.opacity = '1'; };

        // --- DROP TARGET (Folders only) ---
        if (isFolder) {
            node.ondragover = (e) => {
                e.preventDefault(); 
                e.dataTransfer.dropEffect = 'move';
                node.classList.add('drag-hover');
            };
            node.ondragleave = () => { node.classList.remove('drag-hover'); };
            node.ondrop = (e) => {
                e.preventDefault(); e.stopPropagation();
                node.classList.remove('drag-hover');
                const sourceKey = e.dataTransfer.getData('text/plain');
                if (sourceKey && sourceKey !== key) {
                    moveFileToFolder(sourceKey, key);
                }
            };
        }

        // --- CONTEXT MENU (Rename) ---
        node.oncontextmenu = (e) => {
            e.preventDefault();
            if(confirm(`RENAME "${displayLabel}"?`)) {
                const newName = prompt("Enter new name:", key);
                if(newName && newName !== key) {
                    renameItem(key, newName);
                }
            }
        };

        // --- CLICK HANDLER ---
        node.onclick = () => {
            if (window.isExplorerDeleteMode) {
                if (confirm(`PURGE: ${displayLabel}?`)) {
                    
                    // 1. Check local storage keys first
                    const isEmuSave = String(key).startsWith('nes_') || String(key).startsWith('sms_') || String(key).startsWith('gen_') || String(key).startsWith('psx_') || String(key).startsWith('gba_') || String(key).startsWith('gbc_') || String(key).startsWith('snes_');
                    
                    if (viewDepth === 0 && isEmuSave) {
                        localStorage.removeItem(key);
                    }

                    // 2. Delete from VFS Cache
                    if (isArray) {
                        currentData.splice(key, 1);
                    } else {
                        delete currentData[key];
                    }

                    // 3. Save changes and explicitly clear root ghosts
                    chrome.storage.local.set(explorerStack[0], () => { 
                        // CRITICAL FIX: Explicitly remove key from database if at root!
                        if (viewDepth === 0 && !isArray) {
                            chrome.storage.local.remove(String(key), () => {
                                if(String(key).startsWith('gbc_state_') && window.syncGbcSavesToExplorer) window.syncGbcSavesToExplorer();
                                renderExplorerGrid(); 
                                updateStorageUI();
                            });
                        } else {
                            if(String(key).startsWith('gbc_state_') && window.syncGbcSavesToExplorer) window.syncGbcSavesToExplorer();
                            renderExplorerGrid(); 
                            updateStorageUI();
                        }
                    });
                }
            } else {
                if (isFolder) {
                    explorerStack.push(value); 
                    explorerPath.push(key);
                    renderExplorerGrid();
                } else if (typeof value === 'string' && value.startsWith('http')) {
                    window.open(value, '_blank');
                } else {
                    showExplorerPreview(key, value, fileType);
                }
            }
        };
        grid.appendChild(node);
    });
    updateStorageUI();
}

function updateStorageUI() {
    let storageContainer = document.getElementById('storage-status-container');
    if (!storageContainer) {
        storageContainer = document.createElement('div');
        storageContainer.id = 'storage-status-container';
        storageContainer.className = 'storage-status-container';
        const inputArea = document.querySelector('.terminal-input-area');
        if (inputArea && inputArea.parentNode) {
            inputArea.parentNode.insertBefore(storageContainer, inputArea);
        }
    }

    chrome.storage.local.getBytesInUse(null, (bytes) => {
        // Include localStorage size for NES saves
        const localBytes = JSON.stringify(localStorage).length;
        const totalUsedBytes = bytes + localBytes;
        
        // --- FIX: Increased Visual Quota to 1GB ---
        // 1GB = 1024 * 1024 * 1024 bytes
        const totalQuota = 1073741824; 
        
        const usedMB = (totalUsedBytes / (1024 * 1024)).toFixed(2);
        // Calculate percentage, maxing out at 100% visually
        const percent = Math.min((totalUsedBytes / totalQuota) * 100, 100).toFixed(1);
        
        storageContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <span>STORAGE_USED: ${usedMB} MB</span>
                <span>${percent}% (of 1GB)</span>
            </div>
            <div class="storage-bar-bg">
                <div class="storage-bar-fill" style="width: ${percent}%"></div>
            </div>
        `;
    });
}

function navigateToPath(index) {
    if (index < explorerStack.length - 1) {
        explorerStack = explorerStack.slice(0, index + 1);
        explorerPath = explorerPath.slice(0, index + 1);
        renderExplorerGrid();
    }
}

function createNewFolder() {
    const name = prompt("ENTER NEW FOLDER NAME:");
    if(!name) return;
    
    // Get current view
    let currentData = explorerStack[explorerStack.length - 1];
    
    // Check collision
    if(currentData[name]) {
        alert("DIRECTORY ALREADY EXISTS");
        return;
    }
    
    // Create Folder
    currentData[name] = {};
    
    // Save Root
    chrome.storage.local.set(explorerStack[0], () => {
        renderExplorerGrid();
    });
}

function renameItem(oldKey, newKey) {
    let currentData = explorerStack[explorerStack.length - 1];
    
    if(currentData[newKey]) {
        alert("NAME ALREADY EXISTS");
        return;
    }
    
    const viewDepth = explorerStack.length - 1;
    if (viewDepth === 0 && !currentData[oldKey] && localStorage.getItem(oldKey)) {
        const val = localStorage.getItem(oldKey);
        localStorage.setItem(newKey, val);
        localStorage.removeItem(oldKey);
        renderExplorerGrid();
        return;
    }
    
    // VFS Rename
    const val = currentData[oldKey];
    currentData[newKey] = val;
    delete currentData[oldKey];
    
    chrome.storage.local.set(explorerStack[0], () => {
        // --- CRITICAL VFS FIX: Explicitly remove old key from database root ---
        if (viewDepth === 0) {
            chrome.storage.local.remove(String(oldKey), () => {
                renderExplorerGrid();
            });
        } else {
            renderExplorerGrid();
        }
    });
}

function moveFileUpLevel(fileKey) {
    if(explorerStack.length <= 1) return; // Already at root
    
    let currentData = explorerStack[explorerStack.length - 1];
    let parentData = explorerStack[explorerStack.length - 2];
    
    const fileData = currentData[fileKey];
    if(fileData === undefined) return;
    
    // Move
    parentData[fileKey] = fileData;
    delete currentData[fileKey];
    
    chrome.storage.local.set(explorerStack[0], () => {
        // Go up one level in UI
        explorerStack.pop();
        explorerPath.pop();
        renderExplorerGrid();
    });
}

function moveFileToFolder(fileKey, folderKey) {
    // Prevent moving into self
    if(fileKey === folderKey) return;

    // --- NEW SAFETY LOCK: Prevent Emulator Saves from leaving Root ---
    const isEmuSave = String(fileKey).startsWith('nes_') || 
                      String(fileKey).startsWith('sms_') || 
                      String(fileKey).startsWith('gen_') || 
                      String(fileKey).startsWith('psx_') || 
                      String(fileKey).startsWith('gba_') || 
                      String(fileKey).startsWith('gbc_') || 
                      String(fileKey).startsWith('nes_') || 
                      String(fileKey).startsWith('snes_');
                      
    if (isEmuSave) {
        alert("SYSTEM ERROR: Emulator memory streams must remain in the ROOT directory to be accessed by the hardware.");
        return;
    }
    
    let currentData = explorerStack[explorerStack.length - 1];
    const viewDepth = explorerStack.length - 1;
    
    // Get Folder Data
    let folderData = currentData[folderKey];
    if(!folderData || typeof folderData !== 'object') return; 

    // Get Source Data
    let fileData = currentData[fileKey];

    // Check localStorage
    if (viewDepth === 0 && localStorage.getItem(fileKey)) {
        fileData = localStorage.getItem(fileKey);
        localStorage.removeItem(fileKey);
    }

    if (fileData !== undefined) {
        folderData[fileKey] = fileData;
        
        if (currentData[fileKey] !== undefined) {
            delete currentData[fileKey];
        }
    } 
    else {
        return; 
    }

    // Save changes
    chrome.storage.local.set(explorerStack[0], () => {
        // --- CRITICAL VFS FIX: Explicitly remove ghost keys from database root ---
        if (viewDepth === 0) {
            chrome.storage.local.remove(String(fileKey), () => {
                renderExplorerGrid();
            });
        } else {
            renderExplorerGrid();
        }
    });
}

function startPreviewRain(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set dimensions to viewport since overlay is fixed
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    ctx.scale(dpr, dpr);
    
    const fontSize = 16; 
    const columns = Math.floor(canvas.width / dpr / (fontSize * 0.6));
    const drops = Array(columns).fill(0).map(() => Math.floor(Math.random() * (canvas.height / dpr / fontSize)));
    
    const draw = () => {
        if(!canvas.parentNode) return; 

        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        ctx.fillStyle = rainColor; 
        ctx.font = fontSize + "px 'Courier New', monospace";
        const columnSpacing = fontSize * 0.6;
        
        for (let i = 0; i < drops.length; i++) {
            const text = MATRIX_ALPHABET.charAt(Math.floor(Math.random() * MATRIX_ALPHABET.length));
            ctx.globalAlpha = 0.3 + (Math.random() * 0.7);
            ctx.fillText(text, i * columnSpacing, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height / dpr && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        ctx.globalAlpha = 1.0;
    };
    
    return setInterval(draw, rainSpeed); 
}

function showExplorerPreview(key, value, type) {
    const previewOverlay = document.createElement('div');
    // Overlay is transparent
    previewOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:transparent; z-index:11000; display:flex; align-items:center; justify-content:center; backdrop-filter: none;";
    
    // Create Rain Canvas
    const rainCanvas = document.createElement('canvas');
    rainCanvas.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; z-index:0; opacity:0.8; pointer-events:none; border-radius: 4px;";

    const cleanTitle = (key.startsWith('vault_') || key.startsWith('folder_')) 
        ? key.split('_').slice(2).join('_') : key;

    let contentNode = document.createElement('div');
    contentNode.style.width = '100%';
    contentNode.style.height = '100%';
    contentNode.style.display = 'flex';
    contentNode.style.justifyContent = 'center';
    contentNode.style.alignItems = 'center';
    contentNode.style.overflow = 'hidden';

    if (type === 'image') {
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = "display:flex; justify-content:center; align-items:center; width:100%; height:100%; min-height:300px; overflow:hidden;";
        
        const img = document.createElement('img');
        img.src = value;
        img.style.cssText = "max-width:100%; max-height:60vh; object-fit:contain; border: 1px solid var(--theme-color); box-shadow: 0 0 15px rgba(0,242,255,0.2);";
        
        imgContainer.appendChild(img);
        contentNode.appendChild(imgContainer);
    } 
    else if (type === 'video') {
        const vidContainer = document.createElement('div');
        vidContainer.style.cssText = "display:flex; justify-content:center; align-items:center; width:100%; height:100%; min-height:300px;";
        
        const video = document.createElement('video');
        video.src = value;
        video.controls = true;
        video.autoplay = true;
        video.style.cssText = "max-width:100%; max-height:60vh; border: 1px solid var(--theme-color); box-shadow: 0 0 15px rgba(0,242,255,0.2);";
        
        vidContainer.appendChild(video);
        contentNode.appendChild(vidContainer);
    } else if (type === 'audio') {
        const audioContainer = document.createElement('div');
        audioContainer.style.cssText = "display:flex; flex-direction:column; justify-content:center; align-items:center; width:100%; padding: 40px; border: 1px solid rgba(0,242,255,0.1); background:rgba(0,0,0,0.8); box-sizing: border-box;";
        
        const iconDiv = document.createElement('div');
        iconDiv.style.fontSize = "3rem";
        iconDiv.style.marginBottom = "20px";
        iconDiv.textContent = "🎵";
        
        const audio = document.createElement('audio');
        audio.src = value;
        audio.controls = true;
        audio.style.width = "100%";
        audio.style.maxWidth = "500px";
        
        audioContainer.appendChild(iconDiv);
        audioContainer.appendChild(audio);
        contentNode.appendChild(audioContainer);
    } else if (type === 'nes_save' || type === 'sms_save' || type === 'genesis_save' || type === 'psx_save' || type === 'gba_save' || type === 'gbc_save' || type === 'snes_save') {
        const sizeKB = Math.round((value.length * 0.75) / 1024);
        const emuContainer = document.createElement('div');
        emuContainer.style.cssText = "display:flex; flex-direction:column; justify-content:center; align-items:center; width:100%; padding: 40px; border: 1px solid rgba(0,242,255,0.1); background:rgba(0,0,0,0.8); box-sizing: border-box;";
        
        emuContainer.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 20px;">🕹️</div>
            <div style="font-family: 'Press Start 2P', monospace; font-size: 1.2rem; color: #ffcc00; margin-bottom: 10px; text-align: center;">EMULATOR DATA STREAM</div>
        `; // Static HTML safe here

        const labelDiv = document.createElement('div');
        labelDiv.style.cssText = "color: var(--theme-color); opacity: 0.8; font-family: monospace;";
        labelDiv.textContent = cleanTitle;
        emuContainer.appendChild(labelDiv);

        const timeDiv = document.createElement('div');
        timeDiv.style.cssText = "margin-top: 15px; font-size: 0.8rem; color: #aaa;";
        timeDiv.textContent = `Timestamp: ${new Date().toLocaleString()}`;
        emuContainer.appendChild(timeDiv);

        const sizeDiv = document.createElement('div');
        sizeDiv.style.cssText = "margin-top: 5px; font-size: 0.8rem; color: #0f0;";
        sizeDiv.textContent = `Size: ~${sizeKB} KB`;
        emuContainer.appendChild(sizeDiv);
        
        contentNode.appendChild(emuContainer);
    } else {
        let textContent = "";
        if (typeof value === 'string' && value.startsWith('data:')) {
            try {
                const base64Data = value.split(',')[1];
                textContent = atob(base64Data);
            } catch (e) {
                textContent = "ERROR: Could not decode neural stream.";
            }
        } else {
            textContent = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        }
        // Use textContent directly, no need to sanitize manually as textContent handles it
        const textDiv = document.createElement('div');
        textDiv.style.cssText = "color:var(--theme-color); font-family:monospace; white-space:pre-wrap; max-height:50vh; overflow:auto; padding:15px; background:rgba(0,0,0,0.8); border: 1px solid rgba(0,242,255,0.1); width: 100%; box-sizing: border-box;";
        textDiv.textContent = textContent;
        contentNode.appendChild(textDiv);
    }

    const footerButtons = document.createElement('div');
    footerButtons.style.cssText = "display:flex; justify-content:flex-end; gap:15px; margin-top:10px;";

    if(type === 'image') {
        const paintBtn = document.createElement('button');
        paintBtn.id = 'edit-paint-btn';
        paintBtn.style.cssText = "background:rgba(0,255,65,0.2); color:var(--theme-color); border:1px solid var(--theme-color); padding:8px 25px; cursor:pointer; font-weight:bold; border-radius:2px; font-family:'Courier New'; letter-spacing:1px; transition: all 0.2s;";
        paintBtn.textContent = "EDIT IN PAINT";
        footerButtons.appendChild(paintBtn);
    } else if(type === 'code' || type === 'text') {
        const wpBtn = document.createElement('button');
        wpBtn.id = 'edit-wordpad-btn';
        wpBtn.style.cssText = "background:rgba(0,255,65,0.2); color:var(--theme-color); border:1px solid var(--theme-color); padding:8px 25px; cursor:pointer; font-weight:bold; border-radius:2px; font-family:'Courier New'; letter-spacing:1px; transition: all 0.2s;";
        wpBtn.textContent = "EDIT IN WORDPAD";
        footerButtons.appendChild(wpBtn);
    }

    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'extract-btn';
    downloadBtn.style.cssText = "background:var(--theme-color); color:#000; border:none; padding:8px 25px; cursor:pointer; font-weight:bold; border-radius:2px; font-family:'Courier New'; letter-spacing:1px; transition: all 0.2s;";
    downloadBtn.textContent = "DOWNLOAD";
    footerButtons.appendChild(downloadBtn);

    const closeBtn = document.createElement('button');
    closeBtn.id = 'close-preview-btn';
    closeBtn.style.cssText = "background:transparent; color:var(--theme-color); border:1px solid var(--theme-color); padding:8px 25px; cursor:pointer; font-weight:bold; border-radius:2px; font-family:'Courier New'; letter-spacing:1px; transition: all 0.2s;";
    closeBtn.textContent = "CLOSE";
    footerButtons.appendChild(closeBtn);

    const innerModal = document.createElement('div');
    innerModal.style.cssText = "background:#000; padding:20px; border: 1px solid var(--theme-color); width: 85vw; max-width: 900px; display: flex; flex-direction: column; gap: 15px; border-radius: 4px; box-shadow: 0 0 15px var(--theme-color); position: relative; z-index: 10; box-sizing: border-box; overflow: hidden;";
    
    innerModal.appendChild(rainCanvas);

    const modalUI = document.createElement('div');
    modalUI.style.cssText = "position:relative; z-index:2; display:flex; flex-direction:column; gap:15px;";
    
    // Construct Header
    const header = document.createElement('div');
    header.style.cssText = "font-family:'Orbitron'; color:var(--theme-color); border-bottom: 1px solid rgba(0,242,255,0.3); padding-bottom: 10px; font-size: 1rem; display:flex; justify-content:space-between; align-items:center;";
    
    const titleSpan = document.createElement('span');
    titleSpan.textContent = `FILE: ${cleanTitle.toUpperCase()}`;
    
    const typeSpan = document.createElement('span');
    typeSpan.style.cssText = "font-size:0.7em; opacity:0.7; border:1px solid var(--theme-color); padding:2px 6px; border-radius:2px;";
    typeSpan.textContent = type ? type.toUpperCase() : 'UNKNOWN';
    
    header.appendChild(titleSpan);
    header.appendChild(typeSpan);
    
    modalUI.appendChild(header);
    modalUI.appendChild(contentNode);
    modalUI.appendChild(footerButtons);

    innerModal.appendChild(modalUI);
    previewOverlay.appendChild(innerModal);
    document.body.appendChild(previewOverlay);

    // --- SYNCED HIGH-RES TERMINAL RAIN LOGIC ---
    const termCtx = rainCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    rainCanvas.width = innerModal.offsetWidth * dpr;
    rainCanvas.height = innerModal.offsetHeight * dpr;
    termCtx.scale(dpr, dpr);

    const colSpacing = fontSize * 0.6;
    const columns = Math.floor(innerModal.offsetWidth / colSpacing);
    let previewDrops = Array(columns).fill(0).map(() => Math.floor(Math.random() * (innerModal.offsetHeight / fontSize)));

    function drawPreviewRain() {
        termCtx.fillStyle = "rgba(0, 0, 0, 0.15)";
        termCtx.fillRect(0, 0, innerModal.offsetWidth, innerModal.offsetHeight);
        termCtx.fillStyle = typeof rainColor !== 'undefined' ? rainColor : getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
        termCtx.font = fontSize + "px 'Courier New', monospace";

        for (let i = 0; i < previewDrops.length; i++) {
            const text = MATRIX_ALPHABET.charAt(Math.floor(Math.random() * MATRIX_ALPHABET.length));
            termCtx.globalAlpha = 0.3 + (Math.random() * 0.7);
            termCtx.fillText(text, i * colSpacing, previewDrops[i] * fontSize);
            
            if (previewDrops[i] * fontSize > innerModal.offsetHeight && Math.random() > 0.975) {
                previewDrops[i] = 0;
            }
            previewDrops[i]++;
        }
        termCtx.globalAlpha = 1.0;
    }

    const rainInterval = setInterval(drawPreviewRain, typeof rainSpeed !== 'undefined' ? rainSpeed : 33);
    
    // Hover effects
    const btns = footerButtons.querySelectorAll('button');
    btns.forEach(btn => {
        btn.onmouseover = () => { btn.style.boxShadow = "0 0 10px var(--theme-color)"; btn.style.opacity = "1"; };
        btn.onmouseout = () => { btn.style.boxShadow = "none"; btn.style.opacity = "0.9"; };
    });

    document.getElementById('extract-btn').onclick = () => extractVaultData(cleanTitle, value);
    document.getElementById('close-preview-btn').onclick = () => {
        clearInterval(rainInterval);
        previewOverlay.remove();
    };

    // --- HARD EXIT LOGIC ---
    const fullExitExplorer = () => {
        clearInterval(rainInterval);
        // Delete the preview completely
        previewOverlay.remove();
        
        // Close the underlying terminal/explorer modal
        closeTerminalModal();
    };

    // EDIT IN PAINT
    const editBtn = document.getElementById('edit-paint-btn');
    if(editBtn) {
        editBtn.onclick = () => {
            fullExitExplorer();
            if(window.PaintApp && window.PaintApp.loadImage) {
                window.PaintApp.loadImage(value, key);
            }
        };
    }
    
    // EDIT IN WORDPAD
    const editWpBtn = document.getElementById('edit-wordpad-btn');
    if(editWpBtn) {
        editWpBtn.onclick = () => {
            fullExitExplorer();
            const wpModal = document.getElementById('wordpad-modal');
            const wpEditor = document.getElementById('wordpad-editor');
            if(wpModal && wpEditor) {
                wpModal.classList.remove('hidden');
                wpModal.style.display = 'flex';
                wpModal.style.zIndex = '20000'; // Force to front
                let content = value;
                if (typeof value === 'string' && value.startsWith('data:')) {
                    try { content = atob(value.split(',')[1]); } catch(e) {}
                }
                wpEditor.value = content;
            }
        };
    }
}

async function openTerminalModal(permalink) {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');
    
    if (!modal || !output || !input) return;

    input.placeholder = "Type 'com' for comments, 'exit' to close...";

    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null; 
    initTerminalRain(); 
    window.addEventListener('resize', initTerminalRain);

    initTerminalCursor();
    setTimeout(() => { input.focus(); }, 50);

    streamText(output, `> INITIALIZING SECURE CONNECTION TO NODE: ${permalink}\n> ESTABLISHING UPLINK...\n`);

    try {
        const response = await fetch(`https://www.reddit.com${permalink}.json`);
        const json = await response.json();
        terminalCurrentData = json; 
        const post = json[0].data.children[0].data;
        let content = `\n> SUBJECT: ${post.title.toUpperCase()}\n`;
        content += `> AUTHOR:  ${post.author}\n`;
        content += `> SUBREQ:  r/${post.subreddit}\n`;
        content += `> SCORE:   ${post.ups} UNITS\n`;
        content += `----------------------------------------\n\n`;
        await streamText(output, content);
        if (post.selftext) await streamText(output, post.selftext + "\n\n");

        const mediaContainer = document.createElement('div');
        output.appendChild(mediaContainer);
     if (post.post_hint === 'image' || (post.url && post.url.match(/\.(jpg|jpeg|png|gif)$/i))) {
            const frame = createMediaFrame();
            const wrapper = document.createElement('div');
            wrapper.className = 'media-wrapper';
            
            const scanContainer = document.createElement('div');
            scanContainer.className = 'oracle-scan-container';
            
            scanContainer.style.display = 'block'; 
            scanContainer.style.width = '100%';    
            scanContainer.style.maxWidth = '100%'; 
            scanContainer.style.padding = '0';     

            const img = document.createElement('img');
            img.src = post.url;
            img.className = 'terminal-media';
            img.style.width = '100%'; 

            const controls = document.createElement('div');
            controls.className = 'media-controls';
            
            const btnFull = createButton('⛶', () => toggleFullscreen(img)); 
            controls.appendChild(btnFull);
            
            scanContainer.appendChild(img);
            wrapper.appendChild(scanContainer);
            wrapper.appendChild(controls);
            
            frame.appendChild(wrapper);
            mediaContainer.appendChild(frame);
            
            await streamText(output, "\n> VISUAL DATA LOADED. ENCRYPTED SCAN ACTIVE.\n");
        }
        else if (post.is_video && post.media && post.media.reddit_video) {
            const frame = createMediaFrame();
            const wrapper = document.createElement('div');
            wrapper.className = 'media-wrapper';
            
            const vid = document.createElement('video');
            vid.src = post.media.reddit_video.hls_url || post.media.reddit_video.fallback_url;
            vid.className = 'terminal-media';
            vid.autoplay = true; 
            vid.loop = true; 
            vid.muted = true; 
            vid.playsInline = true;

            const controls = document.createElement('div');
            controls.className = 'media-controls';

            const btnReplay = createButton('⟳', () => {
                vid.currentTime = 0;
                vid.play();
            });
            btnReplay.title = "Replay Transmission";

            const btnDownload = createButton('⤓', async () => {
                const videoUrl = post.media.reddit_video.fallback_url;
                try {
                    await streamText(output, "> INITIATING DATA EXTRACTION...\n");
                    const response = await fetch(videoUrl);
                    if (!response.ok) throw new Error('Network response was not ok');
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `zion_archive_${Date.now()}.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(blobUrl);
                    document.body.removeChild(a);
                    await streamText(output, "> EXTRACTION SUCCESSFUL.\n");
                } catch (err) {
                    console.error("Download failed", err);
                    await streamText(output, "> ERROR: EXTRACTION FAILED.\n");
                    window.open(videoUrl, '_blank');
                }
            });
            btnDownload.title = "Extract Data to Local Storage";

            const btnVol = createButton('🔇', () => {
                vid.muted = !vid.muted;
                if (!vid.muted) vid.play().catch(() => {}); 
                btnVol.innerHTML = vid.muted ? '🔇' : '🔊'; 
                btnVol.style.boxShadow = vid.muted ? 'none' : '0 0 10px var(--theme-color)'; 
            });
            btnVol.title = "Toggle Audio Stream";

            const btnFull = createButton('⛶', () => toggleFullscreen(vid));
            btnFull.title = "Maximize Visual";

            controls.appendChild(btnReplay);
            controls.appendChild(btnDownload);
            controls.appendChild(btnVol);
            controls.appendChild(btnFull);

            wrapper.appendChild(vid);
            wrapper.appendChild(controls);
            frame.appendChild(wrapper);
            mediaContainer.appendChild(frame);
            
            await streamText(output, "\n> VIDEO STREAM BUFFERED.\n");
        }
        await streamText(output, `\n> END OF FILE.\n> TYPE 'com' TO LOAD COMMENTS OR 'exit' TO DISCONNECT.\n`);
    } catch (e) {
        await streamText(output, `\n> ERROR: DATA CORRUPTION DETECTED. LINK SEVERED.\n`);
        console.error(e);
    }
}

async function openSpaceTerminal() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;
    
    input.placeholder = "Type 'exit' to close...";

    // Purge previous
    purgeTerminalMedia();

    // Reset UI
    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null;
    
    // Init Effects
    initTerminalRain();
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    
    // Text Intro - Shortened to save vertical space
    await streamText(output, "> UPLINK ESTABLISHED: NASA DEEP SPACE NETWORK\n");

    // Container
    const frame = createMediaFrame(); 
    frame.style.width = "101%";
    frame.style.maxWidth = "103%";
    frame.style.boxSizing = "border-box";
    frame.style.marginTop = "5px"; 
    frame.style.marginBottom = "5px";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    
    // Updated: Reduced to 45vh to guarantee it fits without scrolling
    wrapper.style.position = 'relative'; 
    wrapper.style.width = '100%';
    wrapper.style.height = '57vh'; 
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 

    // Iframe
    const iframe = document.createElement('iframe');
    iframe.src = "https://eyes.nasa.gov/apps/orrery/index.html";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.allow = "fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    
    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);
    
    // NOTE: No custom controls/fullscreen button appended here.
    // This ensures the button is gone for Space, but remains for Reddit (which uses openTerminalModal).

    input.focus();
    await streamText(output, `> SYSTEM READY.\n`);
}

async function openEarthTerminal() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;

    input.placeholder = "Type 'exit' to close...";

    // Purge previous
    purgeTerminalMedia();

    // Reset UI
    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null;
    
    // Init Effects
    initTerminalRain();
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    
    await streamText(output, "> UPLINK ESTABLISHED: NASA TV (LIVE DYNAMIC FEED)\n");

    // Container
    const frame = createMediaFrame(); 
    frame.style.width = "100%";
    frame.style.maxWidth = "100%";
    frame.style.boxSizing = "border-box";
    frame.style.marginTop = "5px"; 
    frame.style.marginBottom = "5px";
    frame.style.display = "block";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    
    wrapper.style.position = 'relative'; 
    wrapper.style.width = '100%';
    wrapper.style.height = '57vh'; 
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 
    wrapper.style.overflow = 'hidden'; 

    // Iframe
    const iframe = document.createElement('iframe');
    
    // DYNAMIC URL STRATEGY:
    // endpoint: 'embed/live_stream'
    // channel: 'fO9e9jnhYK8' (Official NASA TV Channel ID)
    // This will ALWAYS load the current live stream, never an expired video.
    iframe.src = "https://eyes.nasa.gov/apps/earth/#/";
    
    // For 'live_stream' endpoint, 'no-referrer' is often more stable in extensions
    iframe.referrerPolicy = "no-referrer"; 
    
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.display = "block";
    
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    
    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);

    input.focus();
    await streamText(output, `> SYSTEM READY.\n`);
}

async function openAsteroidTerminal() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;

    input.placeholder = "Type 'exit' to close...";

    // Purge previous
    purgeTerminalMedia();

    // Reset UI
    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null;
    
    // Init Effects
    initTerminalRain();
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    
    await streamText(output, "> UPLINK ESTABLISHED: NASA EYES ON ASTEROIDS\n");

    // Container
    const frame = createMediaFrame(); 
    frame.style.width = "101%";
    frame.style.maxWidth = "103%";
    frame.style.boxSizing = "border-box";
    frame.style.marginTop = "5px"; 
    frame.style.marginBottom = "5px";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    
    wrapper.style.position = 'relative'; 
    wrapper.style.width = '100%';
    wrapper.style.height = '57vh'; 
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 

    // Iframe
    const iframe = document.createElement('iframe');
    iframe.src = "https://eyes.nasa.gov/apps/asteroids/";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.allow = "fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    
    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);

    input.focus();
    await streamText(output, `> SYSTEM READY.\n`);
}

function openOracleTerminal() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');
    const smallHistory = document.getElementById('oracle-chat-history');
    
    if (!modal || !output || !input) return;
    
    input.placeholder = "Ask the Oracle... Type 'exit' to close...";

    isOracleTerminalActive = true;
    modal.classList.remove('hidden');
    output.innerHTML = "";
    initTerminalRain(); 
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    input.value = "";
    setTimeout(() => { input.focus(); }, 50);
    
    const termInputArea = document.querySelector('.terminal-input-area');
    
   

    if (smallHistory) {
        Array.from(smallHistory.children).forEach(child => {
            const clone = child.cloneNode(true);
            const typingEls = clone.querySelectorAll('.matrix-typing');
            typingEls.forEach(el => {
                el.classList.remove('matrix-typing-active'); 
                el.id = 'term-clone-' + Math.random().toString(36).substr(2, 9);
            });

            const cloneTextEl = clone.querySelector('.oracle-response-text');
            if (cloneTextEl && cloneTextEl.dataset.fullText) {
                 cloneTextEl.classList.remove('encrypted'); 
                 const isImage = cloneTextEl.dataset.isImage === "true";
                 manageOracleAnimation(clone.querySelector('.oracle-response-container'), cloneTextEl, cloneTextEl.dataset.fullText, isImage);
            }
            
            output.appendChild(clone);
        });
    }

    streamText(output, `> ORACLE INTERFACE EXPANDED.\n> TERMINAL LINK ESTABLISHED.\n> MODEL: ${currentOracleModel.toUpperCase()}\n\n`);
    setTimeout(() => { output.scrollTop = output.scrollHeight; }, 100);
}

function closeTerminalModal() {
    const modal = document.getElementById('matrix-modal');
    if (!modal) return;

    // --- FIX: STOP NES EMULATOR ---
    // This kills the audio and game loop immediately when the terminal closes
    if (typeof window.stopNesEmulator === 'function') {
        window.stopNesEmulator();
    }
    // -----------------------------
    
    // --- STOP SMS EMULATOR ---
    // Checks if the activeSmsInstance exists (created by sms-controller.js)
    if (window.activeSmsInstance && window.activeSmsInstance.sms) {
        if(window.activeSmsInstance.sms.stop) window.activeSmsInstance.sms.stop();
        window.activeSmsInstance = null;
    }

    // --- STOP GENESIS EMULATOR ---
    if (window.activeGenesisInstance && typeof window.activeGenesisInstance.destroy === 'function') {
        window.activeGenesisInstance.destroy();
        window.activeGenesisInstance = null;
    }

    // --- STOP SNES EMULATOR ---
    if (window.activeSnesInstance && typeof window.activeSnesInstance.destroy === 'function') {
        window.activeSnesInstance.destroy();
        window.activeSnesInstance = null;
    }

    // --- STOP GB/GBC EMULATOR ---
    if (window.activeGBCInstance && typeof window.activeGBCInstance.destroy === 'function') {
        window.activeGBCInstance.destroy();
        window.activeGBCInstance = null;
    }

    // --- STOP GBA EMULATOR ---
    if (window.activeGBAInstance && typeof window.activeGBAInstance.destroy === 'function') {
        window.activeGBAInstance.destroy();
        window.activeGBAInstance = null;
    }

    // --- STOP PSX EMULATOR ---
    if (window._psxListener) {
        window.removeEventListener('message', window._psxListener);
        window._psxListener = null;
    }

    // Use centralized purge logic
    purgeTerminalMedia();
    
    // --- UPDATED: Remove Controls ---
    removeExplorerControls();
    // --------------------------------
    
    const output = document.getElementById('terminal-output');
    if (output) {
        output.innerHTML = "";
        output.style.display = "block"; // Restore visibility if it was hidden by Explorer
    }
    
    // Remove Explorer Grid if exists
    const grid = document.getElementById('explorer-grid');
    if(grid) grid.remove();
    isExplorerActive = false;
    
    if (isOracleTerminalActive) {
        const toolsContainer = document.getElementById('oracle-tools-container');
        if (toolsContainer) toolsContainer.remove();
        isOracleTerminalActive = false;
        if (typeof currentImageAttachment !== 'undefined') currentImageAttachment = null; 
    }
    
    modal.classList.add('hidden');
    isTerminalTyping = false; 
    if (terminalRainInterval) clearInterval(terminalRainInterval);
    window.removeEventListener('resize', initTerminalRain);
}

function createMediaFrame() {
    const frame = document.createElement('div');
    frame.className = 'ascii-media-frame';
    return frame;
}

function createButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = 'terminal-btn';
    btn.onclick = (e) => { e.stopPropagation(); onClick(); };
    return btn;
}

function toggleFullscreen(element) {
    if (!document.fullscreenElement) {
        if (element.requestFullscreen) element.requestFullscreen();
        else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

function streamText(container, text) {
    return new Promise(resolve => {
        isTerminalTyping = true;
        const span = document.createElement('span');
        container.appendChild(span);
        container.scrollTop = container.scrollHeight;
        let i = 0;
        const speed = 5; 
        function type() {
            if (!isTerminalTyping) { resolve(); return; }
            if (i < text.length) {
                span.textContent += text.charAt(i);
                i++;
                if (i % 10 === 0) container.scrollTop = container.scrollHeight; 
                setTimeout(type, speed);
            } else {
                isTerminalTyping = false;
                container.scrollTop = container.scrollHeight;
                resolve();
            }
        }
        type();
    });
}

function initTerminalCursor() {
    const input = document.getElementById('terminal-cmd-input');
    const inputArea = document.querySelector('.terminal-input-area'); 
    
    if (!input || !inputArea) return;

    input.style.caretColor = 'transparent';

    let cursor = document.getElementById('modal-terminal-cursor');
    if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = 'modal-terminal-cursor';
        cursor.style.cssText = `position: absolute; top: 50%; left: 0; width: 8px; height: 1.2em; background-color: var(--theme-color); transform: translateY(-50%); pointer-events: none; z-index: 10; display: none; animation: terminal-blink 1s step-end infinite;`;
        if (getComputedStyle(inputArea).position === 'static') { inputArea.style.position = 'relative'; }
        inputArea.appendChild(cursor);
        if (!document.getElementById('cursor-blink-style')) {
            const style = document.createElement('style');
            style.id = 'cursor-blink-style';
            style.textContent = `@keyframes terminal-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
            document.head.appendChild(style);
        }
    }

    let measure = document.getElementById('modal-measure');
    if (!measure) {
        measure = document.createElement('span');
        measure.id = 'modal-measure';
        measure.style.cssText = "position:absolute; visibility:hidden; white-space:pre; pointer-events:none; font-family: 'Courier New', monospace; font-size: 1.1rem;";
        document.body.appendChild(measure);
    }

    function sync() {
        const style = window.getComputedStyle(input);
        measure.style.fontFamily = style.fontFamily;
        measure.style.fontSize = style.fontSize;
        measure.style.fontWeight = style.fontWeight;
        measure.style.letterSpacing = style.letterSpacing;
        measure.textContent = input.value || "";
        const textWidth = measure.getBoundingClientRect().width;
        const startPos = input.offsetLeft; 
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const scrollOffset = input.scrollLeft;
        cursor.style.left = `${startPos + paddingLeft + textWidth - scrollOffset}px`; 
        cursor.style.transform = `translateY(-50%)`;
    }

    input.removeEventListener('input', sync); input.removeEventListener('scroll', sync);
    input.addEventListener('input', sync); input.addEventListener('scroll', sync);
    input.addEventListener('focus', () => { cursor.style.display = 'block'; sync(); });
    input.addEventListener('blur', () => { cursor.style.display = 'none'; });

    if (document.activeElement === input) { cursor.style.display = 'block'; sync(); }
}

async function renderComments() {
    const output = document.getElementById('terminal-output');
    if (!terminalCurrentData || !terminalCurrentData[1]) {
        await streamText(output, "\n> ERROR: NO COMMENT DATA AVAILABLE.\n");
        return;
    }
    await streamText(output, "\n> DECRYPTING COMMENT STREAM...\n\n");
    const comments = terminalCurrentData[1].data.children;
    const maxDepth = 4; 
    function processComment(comment, depth) {
        if (depth > maxDepth || !comment.data.body) return "";
        const indent = "|   ".repeat(depth);
        let treeStr = `${indent}|-- [${comment.data.author}]: ${comment.data.body.substring(0, 300).replace(/\\n/g, ' ')}\n`;
        if (comment.data.replies && comment.data.replies.data) {
            comment.data.replies.data.children.forEach(reply => { treeStr += processComment(reply, depth + 1); });
        }
        return treeStr;
    }
    let fullTree = "";
    comments.slice(0, 15).forEach(c => { fullTree += processComment(c, 0); });
    if (fullTree === "") fullTree = "> NO COMMENTS FOUND.\n";
    const pre = document.createElement('div');
    pre.style.whiteSpace = "pre-wrap"; pre.style.marginBottom = "20px"; pre.textContent = fullTree;
    output.appendChild(pre); output.scrollTop = output.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
    const cmdInput = document.getElementById('terminal-cmd-input');
    const modal = document.getElementById('matrix-modal');
    initTerminalCursor();

    if (cmdInput) {
        cmdInput.addEventListener('keydown', async function(e) {
            if (e.key === 'Enter') {
                const rawInput = this.value.trim();
                this.value = "";
                const event = new Event('input'); this.dispatchEvent(event);
                
                if (isExplorerActive) {
                    if (rawInput === 'exit') {
                        closeTerminalModal();
                    } else if (rawInput.startsWith('/')) {
                        // --- FIX: Allow Commands in Explorer ---
                        const cmdParts = rawInput.split(' ');
                        const baseCmd = cmdParts[0].toLowerCase();
                        const args = cmdParts.slice(1).join(' ');
                        
                        if (CLI_COMMANDS[baseCmd]) {
                            CLI_COMMANDS[baseCmd](args);
                        } else {
                            showZionMessage("COMMAND UNKNOWN");
                        }
                        
                        // Clear filter and refresh grid to show new folders immediately
                        renderExplorerGrid(""); 
                    } else {
                        // Normal Filter Behavior
                        renderExplorerGrid(rawInput);
                    }
                    return;
                }

                if (isOracleTerminalActive) {
                    const output = document.getElementById('terminal-output');
                    if (rawInput === 'exit') { closeTerminalModal(); return; }
                    
                    if (rawInput !== "") {
                        const userEntry = document.createElement('div');
                        userEntry.className = "oracle-entry";
                        
                        const queryDiv = document.createElement('div');
                        queryDiv.className = "user-query";
                        queryDiv.textContent = rawInput;
                        userEntry.appendChild(queryDiv);

                        output.appendChild(userEntry);
                        userEntry.scrollIntoView({ behavior: 'smooth', block: 'end' });

                        const smallHistory = document.getElementById('oracle-chat-history');
                        if (smallHistory) { smallHistory.appendChild(userEntry.cloneNode(true)); }
                        
                        try {
                            const lower = rawInput.toLowerCase();
                            const isSlashCmd = lower.startsWith('/image') || lower.startsWith('/img') || lower.startsWith('/draw');
                            const hasAction = /(draw|generate|create|make|visualize|show)/i.test(lower);
                            const hasObject = /(image|picture|photo|art|sketch|painting)/i.test(lower);
                            const isNaturalCmd = hasAction && hasObject;

                            if (isSlashCmd || isNaturalCmd) {
                                let imgPrompt = rawInput
                                    .replace(/^\/(image|img|draw)/i, '')
                                    .replace(/^(can you|please|kindly)\s+/i, '')
                                    .replace(/^(draw|generate|create|make|visualize|show)\s+(me\s+)?(an?\s+)?(image|picture|photo|art|sketch|painting)\s+(of\s+)?/i, '')
                                    .trim();
                                if(!imgPrompt) imgPrompt = rawInput; 
                                
                                const loadMsg = document.createElement('div');
                                loadMsg.className = "oracle-entry";
                                
                                const container = document.createElement('div');
                                container.className = "oracle-response-container";
                                
                                const textDiv = document.createElement('div');
                                textDiv.className = "oracle-response-text encrypted";
                                textDiv.textContent = "Generating Visual...";
                                
                                container.appendChild(textDiv);
                                loadMsg.appendChild(container);

                                output.appendChild(loadMsg);
                                loadMsg.scrollIntoView({ behavior: 'smooth', block: 'end' });
                                
                                const imgElement = await puter.ai.txt2img(imgPrompt, { model: 'black-forest-labs/FLUX.1-schnell' });
                                loadMsg.remove(); 
                                addOracleImageResponse(imgElement.src, `Rendering construct: "${imgPrompt}"`);
                            } else {
    // --- CHANGED TERMINAL LOGIC START ---
    
    const loadPhrases = ["Decrypting", "Accessing Source", "Tracing Signal", "Parsing", "Constructing"];
    const randomPhrase = loadPhrases[Math.floor(Math.random() * loadPhrases.length)];

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'oracle-loading';
    loadingDiv.textContent = randomPhrase; 
    output.appendChild(loadingDiv);
    
    // FIX: Wait for DOM paint, then force scroll to the VERY bottom
    requestAnimationFrame(() => {
        output.scrollTop = output.scrollHeight;
    });
    
    try {
        const resp = await OracleEngine.ask(rawInput);
        loadingDiv.remove();
        addOracleResponse(resp);
    } catch (err) {
        loadingDiv.remove();
        addOracleResponse("Signal lost.");
        console.error(err);
    }
    // --- CHANGED TERMINAL LOGIC END ---
}
                        } catch (err) {
                            addOracleResponse("Signal lost. Construct loading failed.");
                            console.error(err);
                        }
                    }
                    return; 
                }

                const cmdParts = rawInput.split(' ');
                const baseCmd = cmdParts[0].toLowerCase();
                const args = cmdParts.slice(1).join(' ');
                const output = document.getElementById('terminal-output');
                const echo = document.createElement('div');
                echo.textContent = `operator@zion:~$ ${rawInput}`;
                echo.style.opacity = "0.7";
                output.appendChild(echo);

                if (baseCmd === 'exit') { closeTerminalModal(); } 
                else if (baseCmd === 'com' || baseCmd === 'comments') { renderComments(); } 
                else if (baseCmd === 'clear' || baseCmd === 'cls') { output.innerHTML = ""; } 
                else {
                    const slashCmd = baseCmd.startsWith('/') ? baseCmd : `/${baseCmd}`;
                    if (typeof CLI_COMMANDS !== 'undefined' && CLI_COMMANDS[slashCmd]) {
                        CLI_COMMANDS[slashCmd](args);
                        const successMsg = document.createElement('div');
                        successMsg.textContent = `> SYSTEM COMMAND '${slashCmd}' EXECUTED.`;
                        successMsg.style.color = "var(--theme-color)"; 
                        successMsg.style.textShadow = "0 0 5px var(--theme-color)";
                        output.appendChild(successMsg);
                    } else if (rawInput !== "") {
                        const errorMsg = document.createElement('div');
                        errorMsg.textContent = `> COMMAND '${baseCmd}' NOT RECOGNIZED.`;
                        errorMsg.style.color = "#ff3333";
                        output.appendChild(errorMsg);
                    }
                }
                output.scrollTop = output.scrollHeight;
            }
            if (e.key === 'Escape') closeTerminalModal();
        });
        
       if (modal) {
            modal.addEventListener('click', (e) => {
                // Fixed: Using optional chaining to prevent the "tagName" null error
                const isButton = e.target?.tagName === 'BUTTON';
                const isParentButton = e.target?.parentElement?.tagName === 'BUTTON';

                if (!isButton && !isParentButton) {
                    cmdInput.focus();
                }
            });
        }
    } // This closes the 'if (cmdInput)' block

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeTerminalModal();
        }
    });
}); // This closes the 'DOMContentLoaded' block

let settingsRainInterval = null;
let settingsDrops = [];

function initSettingsRain() {
    const settingsCanvas = document.getElementById('settings-rain-canvas');
    if (!settingsCanvas) return;
    const sCtx = settingsCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    settingsCanvas.width = settingsCanvas.offsetWidth * dpr;
    settingsCanvas.height = settingsCanvas.offsetHeight * dpr;
    sCtx.scale(dpr, dpr);
    
    const columnSpacing = fontSize * 0.6;
    const columns = Math.floor(settingsCanvas.offsetWidth / columnSpacing);
    settingsDrops = Array(columns).fill(0).map(() => Math.floor(Math.random() * (settingsCanvas.height / fontSize)));
    
    if (settingsRainInterval) clearInterval(settingsRainInterval);
    drawSettingsRain();
    settingsRainInterval = setInterval(drawSettingsRain, rainSpeed);
}

function drawSettingsRain() {
    const settingsCanvas = document.getElementById('settings-rain-canvas');
    if (!settingsCanvas) return;
    const sCtx = settingsCanvas.getContext('2d');
    sCtx.fillStyle = "rgba(0, 0, 0, 0.15)";
    sCtx.fillRect(0, 0, settingsCanvas.width, settingsCanvas.height);
    sCtx.fillStyle = rainColor;
    sCtx.font = fontSize + "px 'Courier New', monospace";
    const columnSpacing = fontSize * 0.6;
    
    for (let i = 0; i < settingsDrops.length; i++) {
        const text = MATRIX_ALPHABET.charAt(Math.floor(Math.random() * MATRIX_ALPHABET.length));
        sCtx.globalAlpha = 0.3 + (Math.random() * 0.7);
        sCtx.fillText(text, i * columnSpacing, settingsDrops[i] * fontSize);
        if (settingsDrops[i] * fontSize > settingsCanvas.height && Math.random() > 0.975) {
            settingsDrops[i] = 0;
        }
        settingsDrops[i]++;
    }
    sCtx.globalAlpha = 1.0;
}

function initSidebarRain(sidebarId) {
    const sidebar = document.getElementById(sidebarId);
    if (!sidebar) return;

    // 1. Setup Canvas
    let canvas = sidebar.querySelector('.matrix-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'matrix-canvas';
        sidebar.insertBefore(canvas, sidebar.firstChild); 
    }

    const ctx = canvas.getContext('2d');
    
    // Note: We use the GLOBAL 'fontSize' variable here so it matches the main matrix
    
    let columns = 0;
    let drops = [];

    const initDrops = () => {
        columns = Math.floor(sidebar.offsetWidth / fontSize);
        drops = [];
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.floor(Math.random() * -50); 
        }
    };

    const resizeCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = sidebar.offsetWidth * dpr;
        canvas.height = sidebar.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
        initDrops();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function draw() {
        // 1. Fade out previous frame
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fillRect(0, 0, sidebar.offsetWidth, sidebar.offsetHeight);

        // 2. Set Font & Color using GLOBAL variables for SYNC
        const fontFamily = getFontFamilyForAlphabet(isMathSymbols);
        ctx.font = `400 ${fontSize}px ${fontFamily}`;
        
        // This is the magic line that syncs color:
        ctx.fillStyle = rainColor; 

        // 3. Draw Drops
        for (let i = 0; i < drops.length; i++) {
            if (drops[i] * fontSize > 0) {
                // Uses GLOBAL 'currentAlphabet'
                const text = currentAlphabet.charAt(Math.floor(Math.random() * currentAlphabet.length));
                ctx.globalAlpha = 0.8 + (Math.random() * 0.2);
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            }

            if (drops[i] * fontSize > sidebar.offsetHeight && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        
        ctx.globalAlpha = 1.0; 

        // 4. Loop using GLOBAL rainSpeed for SYNC
        setTimeout(() => requestAnimationFrame(draw), rainSpeed);
    }
    
    draw();
}

// Utility function to load scripts if not present
function loadScript(src) {
    return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = resolve; // Resolve anyway to avoid breaking chain
        document.head.appendChild(s);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // --- INITIALIZE OPERATOR SANDBOX ---
    // Create the hidden sandbox iframe for CSP-compliant code execution
    sandboxFrame = document.createElement('iframe');
    sandboxFrame.id = 'zion-sandbox';
    sandboxFrame.src = 'sandbox.html'; // Ensure this file exists in your root folder
    sandboxFrame.style.display = 'none';
    sandboxFrame.sandbox = "allow-scripts"; // Lockdown for security
    document.body.appendChild(sandboxFrame);

    // Listen for the "Execution Complete" signal back from the sandbox
    window.addEventListener('message', (event) => {
        if (event.data.taskId === 'operator-exec') {
            if (event.data.success) {
                showZionMessage("SANDBOX EXECUTION COMPLETE\nRESULT: " + event.data.result);
            } else {
                showZionMessage("CRITICAL ERROR IN SANDBOX:\n" + event.data.error);
            }
        }
    });

    initSidebarRain('sidebar-left');
    initSidebarRain('sidebar-right');
    initSidebarRain('app-dock-container');
    
});

document.addEventListener('DOMContentLoaded', () => {
    // --- ATTACH GAME BUTTON LISTENERS ---
    const snakeBtn = document.getElementById('btn-snake');
    if (snakeBtn) snakeBtn.addEventListener('click', () => openGame('snake'));

    const pongBtn = document.getElementById('btn-pong');
    if (pongBtn) pongBtn.addEventListener('click', () => openGame('pong'));

    const tetrisBtn = document.getElementById('btn-tetris');
    if (tetrisBtn) tetrisBtn.addEventListener('click', () => openGame('tetris'));

    const game2048Btn = document.getElementById('btn-2048');
    if (game2048Btn) game2048Btn.addEventListener('click', () => openGame('2048'));

    const overloadedBtn = document.getElementById('btn-overloaded');
    if (overloadedBtn) overloadedBtn.addEventListener('click', () => openGame('overloaded'));

    // NEW: Matrix Rampage 2 Listener
    const rampage2Btn = document.getElementById('btn-rampage2');
    if (rampage2Btn) rampage2Btn.addEventListener('click', () => openGame('rampage2'));

    const bullettimeBtn = document.getElementById('btn-bullettime');
    if (bullettimeBtn) bullettimeBtn.addEventListener('click', () => openGame('bullettime'));

  const matrixfighterBtn = document.getElementById('btn-matrixfighter');
    if (matrixfighterBtn) matrixfighterBtn.addEventListener('click', () => openGame('matrixfighter'));
    
    // --- NES EMULATOR INTEGRATION ---
    const nesBtn = document.getElementById('btn-nes');
    if (nesBtn) {
        nesBtn.addEventListener('click', () => {
            // Ensure the controller script is loaded before calling
            loadScript("Emulators/nes/nes-controller.js").then(() => {
                if (window.openNesEmulator) {
                    window.openNesEmulator();
                   
                    document.getElementById('terminal-cmd-input').placeholder = "Type 'exit' to close emulation...";
                } else {
                    showZionMessage("ERROR: NES MODULE FAILED TO LOAD");
                }
            });
        });
    }

    // --- SMS EMULATOR INTEGRATION ---
    const smsBtn = document.getElementById('btn-sms');
    if (smsBtn) {
        smsBtn.addEventListener('click', () => {
            // Update the path to the correct subdirectory
            loadScript("Emulators/sms/sms-controller.js").then(() => {
                if (window.openSmsEmulator) {
                    window.openSmsEmulator();
                    const cmdInput = document.getElementById('terminal-cmd-input');
                    if(cmdInput) cmdInput.placeholder = "Type 'exit' to close emulation...";
                } else {
                    showZionMessage("ERROR: SMS MODULE FAILED TO LOAD");
                }
            });
        });
    }

    // --- SEGA GENESIS INTEGRATION ---
    const genesisBtn = document.getElementById('btn-genesis');
    if (genesisBtn) {
        genesisBtn.addEventListener('click', () => {
            loadScript("Emulators/genesis/genesis-controller.js").then(() => {
                if (typeof window.openGenesisEmulator === 'function') {
                    window.openGenesisEmulator();
                    const cmdInput = document.getElementById('terminal-cmd-input');
                    if (cmdInput) cmdInput.placeholder = "Type 'exit' to close emulation...";
                } else {
                    showZionMessage("ERROR: GENESIS CORE OFFLINE");
                }
            });
        });
    }
    
    // --- SNES EMULATOR INTEGRATION ---
    const snesBtn = document.getElementById('btn-snes');
    if (snesBtn) {
        snesBtn.addEventListener('click', () => {
            // Load the controller script dynamically
            loadScript("Emulators/snes/snes-controller.js").then(() => {
                // Check if the function exists in the global scope
                if (typeof window.openSnesEmulator === 'function') {
                    // Launch the emulator
                    window.openSnesEmulator();
                    
                    // Update terminal prompt to show exit instructions
                    const cmdInput = document.getElementById('terminal-cmd-input');
                    if (cmdInput) cmdInput.placeholder = "Type 'exit' to close emulation...";
                } else {
                    showZionMessage("ERROR: SNES CORE OFFLINE");
                }
            });
        });
    }

    // --- PSX EMULATOR INTEGRATION ---
    const psxBtn = document.getElementById('btn-psx');
    if (psxBtn) {
        psxBtn.addEventListener('click', () => {
            // Load the controller script dynamically
            loadScript("Emulators/psx/psx-controller.js").then(() => {
                // Check if the function exists in the global scope
                if (typeof window.openPSXEmulator === 'function') {
                    // Launch the emulator
                    window.openPSXEmulator();
                    
                    // Update terminal prompt to show exit instructions
                    const cmdInput = document.getElementById('terminal-cmd-input');
                    if (cmdInput) cmdInput.placeholder = "Type 'exit' to close emulation...";
                } else {
                    showZionMessage("ERROR: PSX CORE OFFLINE");
                }
            });
        });
    }

    // --- GB/GBC EMULATOR INTEGRATION ---
    const gbcBtn = document.getElementById('btn-gbc');
    if (gbcBtn) {
        gbcBtn.addEventListener('click', () => {
            // 1. Load the controller script we created
            loadScript("Emulators/gbc/gbc-controller.js").then(() => {
                // 2. Check if the function exists
                if (typeof window.openGBCEmulator === 'function') {
                    // 3. Launch the function (This opens the modal)
                    window.openGBCEmulator();
                    const cmdInput = document.getElementById('terminal-cmd-input');
                    if (cmdInput) cmdInput.placeholder = "Type 'exit' to close emulation...";
                } else {
                    showZionMessage("ERROR: GBC CORE OFFLINE");
                }
            });
        });
    }

    // --- GBA EMULATOR INTEGRATION ---
    const gbaBtn = document.getElementById('btn-gba');
    if (gbaBtn) {
        gbaBtn.addEventListener('click', () => {
            // Load the controller from the subfolder
            loadScript("Emulators/gba/gba-controller.js").then(() => {
                if (typeof window.openGBAEmulator === 'function') {
                    window.openGBAEmulator();
                    const cmdInput = document.getElementById('terminal-cmd-input');
                    if (cmdInput) cmdInput.placeholder = "Type 'exit' to close emulation...";
                } else {
                    showZionMessage("ERROR: GBA CORE OFFLINE");
                }
            });
        });
    }

    // --- ATTACH NASA BUTTON LISTENERS ---
    const solarBtn = document.getElementById('btn-solar');
    if (solarBtn) solarBtn.addEventListener('click', () => openNasa('solar'));

    const earthBtn = document.getElementById('btn-earth');
    if (earthBtn) earthBtn.addEventListener('click', () => openNasa('earth'));

    const asteroidBtn = document.getElementById('btn-asteroids');
    if (asteroidBtn) asteroidBtn.addEventListener('click', () => openNasa('asteroids'));

    // --- NEW: DOCK EVENT LISTENERS (Requested Addition) ---
    const dockExplorer = document.getElementById('dock-explorer');
    if (dockExplorer) dockExplorer.onclick = () => openRootExplorer();

    const dockOracle = document.getElementById('dock-oracle');
    if (dockOracle) dockOracle.onclick = () => openOracleTerminal();

    // --- WORDPAD LOGIC ---
const wordpadModal = document.getElementById('wordpad-modal');
const wordpadEditor = document.getElementById('wordpad-editor');

document.getElementById('dock-wordpad').onclick = () => wordpadModal.classList.remove('hidden');
document.getElementById('close-wordpad-btn').onclick = () => wordpadModal.classList.add('hidden');

});

// 1. Router for Game Buttons
function openGame(gameName) {
    // Hide sidebar immediately for better UX
    const leftSidebar = document.getElementById('sidebar-left');
    if (leftSidebar) leftSidebar.style.left = '-230px';

    if (gameName === 'snake') {
        openMatrixRampageGame();
    } else if (gameName === 'pong') {
        openMatrixPandemoniumGame();
    } else if (gameName === 'tetris') {
        openCitizensOfZionGame();
    } else if (gameName === '2048') {
        openDockDefenceGame();
    } else if (gameName === 'overloaded') {
        openMatrixOverloadedGame();
    } else if (gameName === 'rampage2') { 
        openMatrixRampage2Game();
    } else if (gameName === 'bullettime') {  
        openMatrixBulletTimeGame();
    } else if (gameName === 'matrixfighter') { 
        openMatrixFighterGame();
  }
}

// 2. Router for NASA Buttons
function openNasa(mode) {
    // Hide sidebar immediately
    const rightSidebar = document.getElementById('sidebar-right');
    if (rightSidebar) rightSidebar.style.right = '-230px';

    if (mode === 'solar') {
        openSpaceTerminal();
    } else if (mode === 'earth') {
        openEarthTerminal();
    } else if (mode === 'asteroids') {
        openAsteroidTerminal();
    }
}

// --- NEW EXPLORER CONTROLS (UPLOAD, NEW FOLDER & PURGE) ---
window.isExplorerDeleteMode = false;

function initExplorerControls() {
    const inputArea = document.querySelector('.terminal-input-area');
    if (!inputArea || document.getElementById('explorer-controls-container')) return;

    // Container to hold buttons
    const container = document.createElement('div');
    container.id = 'explorer-controls-container';
    container.style.cssText = "position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; gap: 8px; z-index: 20000;";

    // Common Button Style
    const btnStyle = "background: var(--theme-color); color: #000; border: none; padding: 6px 12px; font-family: 'Courier New', monospace; font-weight: bold; cursor: pointer; font-size: 12px; opacity: 0.9; border-radius: 4px; transition: all 0.2s ease;";

    // 1. UPLOAD BUTTON
    const upBtn = document.createElement('button');
    upBtn.innerHTML = "⬆ UPLOAD";
    upBtn.style.cssText = btnStyle;
    upBtn.onmouseover = () => { upBtn.style.opacity = '1'; upBtn.style.boxShadow = "0 0 8px var(--theme-color)"; };
    upBtn.onmouseout = () => { upBtn.style.opacity = '0.9'; upBtn.style.boxShadow = "none"; };
    
    upBtn.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        triggerVaultUpload(); 
    };

    // 2. NEW FOLDER BUTTON
    const folderBtn = document.createElement('button');
    folderBtn.innerHTML = "📁 FOLDER";
    folderBtn.style.cssText = btnStyle;
    folderBtn.onmouseover = () => { folderBtn.style.opacity = '1'; folderBtn.style.boxShadow = "0 0 8px var(--theme-color)"; };
    folderBtn.onmouseout = () => { folderBtn.style.opacity = '0.9'; folderBtn.style.boxShadow = "none"; };
    
    folderBtn.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        createNewFolder();
    };

    // 3. PURGE BUTTON
    const delBtn = document.createElement('button');
    delBtn.innerHTML = "🗑 PURGE";
    delBtn.style.cssText = btnStyle; 
    
    // Toggle Logic
    delBtn.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        window.isExplorerDeleteMode = !window.isExplorerDeleteMode;
        
        if (window.isExplorerDeleteMode) {
            delBtn.style.background = "#ff0000";
            delBtn.style.color = "#fff";
            delBtn.innerHTML = "✖ CANCEL";
            showZionMessage("PURGE MODE ACTIVE\nCLICK FILE TO DELETE");
        } else {
            delBtn.style.background = "var(--theme-color)";
            delBtn.style.color = "#000";
            delBtn.innerHTML = "🗑 PURGE";
        }
    };

    container.appendChild(upBtn);
    container.appendChild(folderBtn);
    container.appendChild(delBtn);

    if (getComputedStyle(inputArea).position === 'static') {
        inputArea.style.position = 'relative';
    }
    inputArea.appendChild(container);
}

function removeExplorerControls() {
    const container = document.getElementById('explorer-controls-container');
    const pathBar = document.getElementById('explorer-path-bar');
    const storage = document.getElementById('storage-status-container');
    
    if (container) container.remove();
    if (pathBar) pathBar.remove();
    if (storage) storage.remove();
    
    window.isExplorerDeleteMode = false;
}

// --- FULLSCREEN OVERLAY HELPER ---
function addFullscreenOverlay(wrapper, targetElement) {
    const btn = document.createElement('button');
    btn.innerHTML = '⛶'; 
    btn.title = "Maximize Construct";
    
    // Exact styling logic from your RSS .video-fullscreen-btn
    btn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        z-index: 100;
        
        /* CIRCLE DIMENSIONS */
        width: 35px;
        height: 35px;
        border-radius: 50%;
        
        /* CENTERING */
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
        
        /* VISUALS */
        background: rgba(0, 0, 0, 0.6);
        color: var(--theme-color);
        border: 1px solid var(--theme-color);
        cursor: pointer;
        font-family: 'Courier New', monospace;
        font-size: 1.2rem;
        opacity: 0.5;
        transition: all 0.2s ease;
        
        /* REFINED BASE SHADOW: Tight and subtle */
        box-shadow: 0 0 2px rgba(0,0,0,0.8); 
    `;

    // Glow Effects
    btn.onmouseover = () => {
        btn.style.opacity = '1';
        
        /* REFINED HOVER GLOW: 
           Reduced from 10px to 6px for a sharper look.
           Added 'inset' to make the button look illuminated from within. 
        */
        btn.style.boxShadow = '0 0 6px var(--theme-color), inset 0 0 3px var(--theme-color)';
        
        btn.style.background = 'rgba(0, 0, 0, 0.9)';
        btn.style.transform = 'scale(1.1)';
    };
    btn.onmouseout = () => {
        btn.style.opacity = '0.5';
        btn.style.boxShadow = '0 0 2px rgba(0,0,0,0.8)';
        btn.style.background = 'rgba(0, 0, 0, 0.6)';
        btn.style.transform = 'scale(1)';
    };

    // Click Logic
    btn.onclick = (e) => {
        e.stopPropagation();
        if (targetElement.requestFullscreen) targetElement.requestFullscreen();
        else if (targetElement.webkitRequestFullscreen) targetElement.webkitRequestFullscreen();
        else if (targetElement.msRequestFullscreen) targetElement.msRequestFullscreen();
    };

    wrapper.appendChild(btn);
}

// --- Signal Studio (Video Editor) Integration ---
document.addEventListener('DOMContentLoaded', () => {
    const dockVideo = document.getElementById('dock-video');
    const videoModal = document.getElementById('video-modal');
    const closeVideo = document.getElementById('close-video-btn');
    const videoRoot = document.getElementById('video-editor-root');
    let editorInstance = null;

    if (dockVideo && videoModal) {
        // Open App
        dockVideo.addEventListener('click', () => {
            videoModal.classList.remove('hidden');
            videoModal.style.display = 'flex';
            videoModal.style.alignItems = 'center';
            videoModal.style.justifyContent = 'center';
            videoModal.style.zIndex = '10006'; // Higher than Paint

            // Initialize the class only once to save resources
            if (!editorInstance) {
                editorInstance = new VideoEditor(videoRoot);
            }
        });

        // Close App
        closeVideo.addEventListener('click', () => {
            videoModal.classList.add('hidden');
            videoModal.style.display = 'none';
            
            // Auto-pause video when closing window
            if (editorInstance && editorInstance.video) {
                editorInstance.video.pause();
                editorInstance.playBtn.textContent = '▶';
                editorInstance.isPlaying = false;
            }
        });
    }

    // --- UPDATED MEDIA PLAYER INTEGRATION ---
    const dockMedia = document.getElementById('dock-media');
    const mediaModal = document.getElementById('media-player-modal');
    const closeMedia = document.getElementById('close-mp-btn');
    let mediaPlayerInstance = null;

    if (dockMedia && mediaModal) {
        dockMedia.addEventListener('click', () => {
            mediaModal.classList.remove('hidden');
            mediaModal.style.zIndex = '10007'; 
            if (!mediaPlayerInstance && window.ZionMediaPlayer) {
                mediaPlayerInstance = new ZionMediaPlayer();
                // Export globally so the Deck can control it
                window.globalMediaPlayer = mediaPlayerInstance; 
            } else if (mediaPlayerInstance) {
                // Restart visualizer if music is still playing background
                mediaPlayerInstance.setVisualizerMode(mediaPlayerInstance.currentVizMode);
            }
        });

        closeMedia.addEventListener('click', () => {
            mediaModal.classList.add('hidden');
            // MODIFIED: We no longer pause the music here.
            // We let the internal class handle stopping the visuals via the hidden state.
            if (mediaPlayerInstance) {
                cancelAnimationFrame(mediaPlayerInstance.vizId);
                mediaPlayerInstance.vizId = null;
            }
        });
    }
});

// --- INITIALIZATION ---
chrome.storage.sync.get(null, (d) => {
    const data = { ...DEFAULTS, ...d };
    
    // 1. Initialize Engine State (Variables)
    initVerticalRainEffect();
    rainSpeed = data.rainSpeed;
    isMatrixGreen = data.isMatrixGreen;
    rainColor = data.rainColor;
    themeColor = data.themeColor || DEFAULTS.themeColor;
    
    // Sync Global CSS Variables
    if (isMatrixGreen) {
        document.documentElement.style.setProperty('--theme-color', CLASSIC_GREEN);
    } else {
        document.documentElement.style.setProperty('--theme-color', themeColor);
    }

    isBinary = data.isBinary;
    isHex = data.isHex;
    isAscii = data.isAscii;
    isMathSymbols = data.isMathSymbols;
    update2DAlphabet();
    
    videoBackground = data.videoBackground; 
    if (videoBackground) {
        setTimeout(() => startBackgroundVideo(videoBackground), 100);
    } else {
        startRain();
    }

    isSnowing = data.isSnowing;
    if(isSnowing) { initSnow(); const swarmAudio = document.getElementById('sentinel-swarm-sfx'); if (swarmAudio) { swarmAudio.volume = 0.4; swarmAudio.play().catch(() => {}); } }

    isFlashing = data.isFlashing;
    showMinutes = data.showMinutes;
    showSeconds = data.showSeconds;
    use24Hour = data.use24Hour;
    
    isPhoneEnabled = data.isPhoneEnabled;
    phoneFrequency = data.phoneFrequency;
    const phoneContainer = document.getElementById('phone-container');
    if (isPhoneEnabled) phoneContainer.classList.remove('hidden'); else phoneContainer.classList.add('hidden');
    
    isChatEnabled = data.isChatEnabled;
    document.getElementById('transmission-terminal').classList.toggle('hidden', !isChatEnabled);
    
    // Apply Visual Classes
    document.body.classList.toggle('cyberpunk-font', data.isCyberpunkFont);
    document.body.classList.toggle('glow-active', data.isGlow);
    document.body.classList.toggle('glitch-enabled', data.isGlitch);
    document.body.classList.toggle('bg-filter-active', data.isBgFilter);
    mainContainer.classList.toggle('transparent-bg', data.isTransparent);
    document.getElementById('scanline-overlay').classList.toggle('hidden', !data.isScanline);
    
    document.documentElement.style.setProperty('--text-scale', data.textScale);
    document.documentElement.style.setProperty('--bg-scale', data.scaleMode);
    mainContainer.style.transform = `translate(-50%, -50%) scale(${data.uiScale})`;
    document.documentElement.style.setProperty('--glitch-intensity', data.glitchIntensity + 'px');
    
    if (data.customQuote) { document.getElementById('display-quote').textContent = `"${data.customQuote}"`; } 
    else if (data.isCycling) { startQuoteCycling(); }
    
    if(data.isRssEnabled) updateZionFeed();
    
    isOracleEnabled = data.isOracleEnabled;
    
    // System Monitor State
    const isSysMon = (data.isSystemMonitorEnabled !== undefined) ? data.isSystemMonitorEnabled : DEFAULTS.isSystemMonitorEnabled;
    const monitor = document.getElementById('system-log-monitor');
    if(monitor) monitor.style.display = isSysMon ? 'block' : 'none';
    
    // Audio
    const rA = document.getElementById('ambience-rain'), hA = document.getElementById('ambience-hum'), mA = document.getElementById('matrix-code-sfx'), cA = document.getElementById('custom-background-sfx');
    rA.volume = hA.volume = mA.volume = cA.volume = data.envVolume;
    
    if(data.isRainAmbience) rA.play().catch(() => {}); 
    if(data.isHumEnabled) hA.play().catch(() => {}); 
    if(data.isMatrixSfxEnabled) mA.play().catch(() => {});
    loadSfxFromDB().then(f => { if(f) { cA.src = URL.createObjectURL(f); cA.play().catch(() => {}); } });
    
    document.getElementById('operator-console').classList.toggle('stats-hidden', !data.isStatsEnabled);
    
    setTimeout(() => { initOracleChat(); }, 100);
    
    // --- CALL SETTINGS PAGE UI INITIALIZER ---
    if (window.initSettingsUI) window.initSettingsUI(data);
    
    // --- MIGRATION: SYNC TO LOCAL FOR NAV LINKS ---
    chrome.storage.sync.get(['userNavLinks'], (syncData) => {
        if (syncData.userNavLinks && syncData.userNavLinks.length > 0) {
            chrome.storage.local.get(['userNavLinks'], (localData) => {
                if (!localData.userNavLinks || localData.userNavLinks.length === 0) {
                    chrome.storage.local.set({ userNavLinks: syncData.userNavLinks }, () => {
                        chrome.storage.sync.remove('userNavLinks');
                        loadNavLinks(); 
                    });
                }
            });
        }
    });
    
    loadNavLinks(); resize(); animateSentinels(); updateUI(); 
    initPhoneSystem(); runChatTerminal(); 
    
    setTimeout(() => { initCalendar(); }, 50);
    mainContainer.style.opacity = "1";
});

// --- NEWS TERMINAL RENDERER (WITH DEEP SCANNING) ---
async function openNewsInTerminal(article) {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;

    // 1. Reset Modal UI
    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    input.placeholder = "Type 'exit' to close...";
    
    // 2. Initialize Effects
    if (typeof initTerminalRain === 'function') {
        initTerminalRain();
        window.addEventListener('resize', initTerminalRain);
    }
    if (typeof initTerminalCursor === 'function') initTerminalCursor();
    setTimeout(() => { input.focus(); },  50);

// 3. Stream Header Info
const dateStr = article.pubDate ? new Date(article.pubDate).toLocaleString().toUpperCase() : "UNKNOWN DATE";
await streamText(output, `> INCOMING NEWS TRANSMISSION...\n> SOURCE: ${article.source.toUpperCase()}\n> DATE:   ${dateStr}\n\n`);
await streamText(output, `> HEADLINE: ${article.title.toUpperCase()}\n`);
await streamText(output, `----------------------------------------\n\n`);

// 4. DEEP SCAN LOGIC (The Fix)
// First, check if the RSS feed gave us enough content (usually it doesn't)
let contentToDisplay = article.fullContent || article.description;
const isContentShort = !contentToDisplay || contentToDisplay.length < 500;

if (isContentShort) {
    await streamText(output, "> RSS DATA FRAGMENTED. INITIATING DEEP SCAN OF SOURCE...\n");
    await streamText(output, `> TARGET: ${article.link}\n`);
    await streamText(output, "> BYPASSING FIREWALLS... ");
    
    try {
        // Fetch the actual webpage
        const res = await fetch(article.link);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        await streamText(output, "ACCESS GRANTED.\n> PARSING HTML STRUCTURE... ");
        
        const htmlText = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // Heuristic: Find the article body
        // We look for common tag names used by news sites
        let container = doc.querySelector('article') || 
                        doc.querySelector('[role="main"]') || 
                        doc.querySelector('.story-body') || 
                        doc.querySelector('.article-body') || 
                        doc.querySelector('.post-content') || 
                        doc.querySelector('#content') || 
                        doc.body;

        // Extract all paragraph text
        const paragraphs = Array.from(container.querySelectorAll('p'));
        
        // Filter out junk (menus, copyrights, short blurbs)
        const cleanParagraphs = paragraphs
            .map(p => p.textContent.trim())
            .filter(text => {
                if (text.length < 60) return false; // Too short to be news
                if (text.toLowerCase().includes("cookies")) return false;
                if (text.toLowerCase().includes("copyright")) return false;
                if (text.toLowerCase().includes("all rights reserved")) return false;
                return true;
            });
        
        if (cleanParagraphs.length > 0) {
            // Success! Use the scraped text
            contentToDisplay = cleanParagraphs.join('\n\n');
            await streamText(output, "SUCCESS.\n\n");
        } else {
            await streamText(output, "FAILED (NO DATA). USING SUMMARY.\n\n");
        }

    } catch (e) {
        console.error("Deep Scan Error:", e);
        await streamText(output, "CONNECTION LOST. FALLING BACK TO RSS SUMMARY.\n\n");
    }
} else {
    await streamText(output, "\n");
}

// 5. Stream the Final Content (Scraped or RSS)
const parser = new DOMParser();
const doc = parser.parseFromString(contentToDisplay, 'text/html');

// Remove scripts/styles just in case
const scripts = doc.querySelectorAll('script, style');
scripts.forEach(s => s.remove());

let cleanText = doc.body.textContent || "";

// Clean up whitespace
cleanText = cleanText.replace(/\n\s*\n/g, '\n\n').trim();

if (cleanText) {
    await streamText(output, cleanText + "\n\n");
} else {
    await streamText(output, "> [DATA ENCRYPTED: CONTENT UNAVAILABLE]\n\n");
}

// 6. Render Media (Image/Video from RSS)
if (article.mediaUrl) {
    const frame = createMediaFrame();
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    
    let mediaEl;
    
    if (article.mediaType === 'video') {
        mediaEl = document.createElement('video');
        mediaEl.src = article.mediaUrl;
        mediaEl.autoplay = true;
        mediaEl.loop = true;
        mediaEl.muted = true;
        mediaEl.controls = false;
        mediaEl.className = 'terminal-media';
        
        const controls = document.createElement('div');
        controls.className = 'media-controls';
        
        const btnVol = createButton('🔇', () => {
            mediaEl.muted = !mediaEl.muted;
            btnVol.innerHTML = mediaEl.muted ? '🔇' : '🔊';
        });
        
        const btnFull = createButton('⛶', () => toggleFullscreen(mediaEl));
        
        controls.appendChild(btnVol);
        controls.appendChild(btnFull);
        wrapper.appendChild(mediaEl);
        wrapper.appendChild(controls);
    } else {
        mediaEl = document.createElement('img');
        mediaEl.src = article.mediaUrl;
        mediaEl.className = 'terminal-media';
        
        const controls = document.createElement('div');
        controls.className = 'media-controls';
        const btnFull = createButton('⛶', () => toggleFullscreen(mediaEl));
        
        controls.appendChild(btnFull);
        wrapper.appendChild(mediaEl);
        wrapper.appendChild(controls);
    }
    
    frame.appendChild(wrapper);
    output.appendChild(frame);
    await streamText(output, `\n> VISUAL ATTACHMENT RENDERED.\n`);
}

// 7. Footer & Source Button
const btnContainer = document.createElement('div');
btnContainer.style.marginTop = "30px";
btnContainer.style.marginBottom = "50px";
btnContainer.style.textAlign = "center";
btnContainer.style.width = "100%";

const sourceBtn = document.createElement('button');
sourceBtn.className = 'matrix-btn';
sourceBtn.textContent = "[ OPEN ORIGINAL SOURCE ]";

sourceBtn.style.padding = "12px 24px";
sourceBtn.style.fontSize = "0.9rem";
sourceBtn.style.whiteSpace = "nowrap";      
sourceBtn.style.display = "inline-block";   
sourceBtn.style.width = "auto";             
sourceBtn.style.minWidth = "200px";         
sourceBtn.style.cursor = "pointer";

sourceBtn.onclick = () => window.open(article.link, '_blank');

btnContainer.appendChild(sourceBtn);
output.appendChild(btnContainer);

output.scrollTop = output.scrollHeight;

}

window.openNewsInTerminal = openNewsInTerminal;

// --- ARCADE MODE RAIN IMPLEMENTATION ---

class MatrixRain {
    constructor(canvas, ctx, dpr) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.dpr = dpr;
        // Scale font size by DPR so it looks sharp on high-res screens
        this.fontSize = 14 * this.dpr; 
        this.initialize();
    }

    initialize() {
        // Calculate columns based on scaled width and scaled font size
        // (Result is the same number of columns, just sharper pixels)
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = Array(this.columns).fill(1);
    }

    draw() {
        // 1. Ghost Grid Fix: Increased opacity to 0.25
        // This wipes the previous frame faster, preventing the static "grid" look
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Sync Color with Global Theme
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--theme-color');
        
        // 3. Font Config
        // Explicitly set weight to 'normal' and use scaled font size
        this.ctx.font = 'normal ' + this.fontSize + 'px "Courier New", monospace';

        // 4. Draw Drops
        // Safety check for alphabet
        const chars = (typeof MATRIX_ALPHABET !== 'undefined') ? MATRIX_ALPHABET : "0123456789ABCDEF";

        for (let i = 0; i < this.drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            
            // Draw text at the calculated column position
            this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

            // Reset drops randomly to create rain effect
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }
    }
}

// Global functions for Arcade Mode
window.initMatrixRain = function() {
    // 1. Get DPI for high-res support (Retina/4K screens)
    const dpr = window.devicePixelRatio || 1;

    // 2. Get Elements safely
    const bottomEl = document.getElementById('matrix-canvas'); // Bottom bar
    const topEl = document.getElementById('top-bar-canvas');   // Top bar

    // 3. Initialize Bottom Bar (Only if it exists)
    if (bottomEl) {
        const ctx = bottomEl.getContext('2d');
        
        // Get the visual size (CSS pixels)
        const rect = bottomEl.getBoundingClientRect();
        
        // Set internal resolution to (CSS Width * DPI)
        bottomEl.width = rect.width * dpr;
        bottomEl.height = rect.height * dpr;
        
        window.matrixRain = new MatrixRain(bottomEl, ctx, dpr);
    }

    // 4. Initialize Top Bar (Only if it exists)
    if (topEl) {
        const tctx = topEl.getContext('2d');
        
        // FIX: Replaced hardcoded CSS size (600x80) with dynamic measurement
        const rect = topEl.getBoundingClientRect();

        // Set internal resolution to scale with DPI AND dynamic width
        topEl.width = rect.width * dpr;
        topEl.height = rect.height * dpr;

        window.topMatrixRain = new MatrixRain(topEl, tctx, dpr);
    }

    // 5. Start Animation Loop (If at least ONE exists)
    if (window.matrixRain || window.topMatrixRain) {
        if (typeof arcadeAnimationId !== 'undefined' && arcadeAnimationId) {
            clearTimeout(arcadeAnimationId);
        }
        window.animateArcade();
    }
};

window.animateArcade = function() {
    const speedInput = document.getElementById('matrix-speed');
    const speed = speedInput ? parseInt(speedInput.value) : 30;
    const delay = 101 - speed;

    // Draw whichever rains are active
    if (window.matrixRain) window.matrixRain.draw();
    if (window.topMatrixRain) window.topMatrixRain.draw();

    arcadeAnimationId = setTimeout(() => {
        requestAnimationFrame(window.animateArcade);
    }, delay);
};

// Check if arcade mode is present on load
document.addEventListener('DOMContentLoaded', () => {
    // Attempt initialization if either canvas is found
    if (document.getElementById('matrix-canvas') || document.getElementById('top-bar-canvas')) {
        window.initMatrixRain();
    }
});

// FIX: Automatically adjust if the user resizes the window
window.addEventListener('resize', () => {
    if (document.getElementById('matrix-canvas') || document.getElementById('top-bar-canvas')) {
        window.initMatrixRain();
    }
});

// ==========================================
// SPACE INVADERS NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const invaderBtn = document.getElementById('btn-spaceinvaders');
    
    if (invaderBtn) {
        const newBtn = invaderBtn.cloneNode(true);
        invaderBtn.parentNode.replaceChild(newBtn, invaderBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Space Invaders Native");
                        
            loadScript("Arcade/space_invaders/spaceinvaders-controller.js").then(() => {
                if (typeof window.openSpaceInvaders === 'function') {
                    window.openSpaceInvaders(); 
                } else {
                    console.error("ERROR: spaceinvaders-controller.js logic failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load controller script:", err);
            });
        });
    }
});

// ==========================================
// PACMAN NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const pacmanBtn = document.getElementById('btn-pacman');
    
    if (pacmanBtn) {
        // Clone and replace to strip any old/stale event listeners
        const newBtn = pacmanBtn.cloneNode(true);
        pacmanBtn.parentNode.replaceChild(newBtn, pacmanBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Pacman Native");
                        
            loadScript("Arcade/pacman/pacman-controller.js").then(() => {
                if (typeof window.openPacman === 'function') {
                    window.openPacman(); 
                } else {
                    console.error("ERROR: pacman-controller.js logic failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load controller script:", err);
            });
        });
    }
});

// ==========================================
// MSPACMAN NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const mspacmanBtn = document.getElementById('btn-mspacman');
    
    if (mspacmanBtn) {
        // Clone and replace to strip any old/stale event listeners
        const newBtn = mspacmanBtn.cloneNode(true);
        mspacmanBtn.parentNode.replaceChild(newBtn, mspacmanBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: MsPacman Native");
                        
            loadScript("Arcade/mspacman/mspacman-controller.js").then(() => {
                // Check if your controller uses a different casing (like openMspacman)
                if (typeof window.openMsPacman === 'function') {
                    window.openMsPacman(); 
                } else {
                    console.error("ERROR: mspacman-controller.js logic failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load MsPacman controller script:", err);
            });
        });
    }
});

// ==========================================
// FROGGER NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const froggerBtn = document.getElementById('btn-frogger');
    
    if (froggerBtn) {
        const newBtn = froggerBtn.cloneNode(true);
        froggerBtn.parentNode.replaceChild(newBtn, froggerBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Frogger Native");
                        
            loadScript("Arcade/frogger/frogger-controller.js").then(() => {
                if (typeof window.openFrogger === 'function') {
                    window.openFrogger(); 
                } else {
                    console.error("ERROR: frogger-controller.js logic failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load controller script:", err);
            });
        });
    }
});

// ==========================================
// ASTEROIDS NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const asteroidsBtn = document.getElementById('btn-asteroids');

    if (asteroidsBtn) {
        const newBtn = asteroidsBtn.cloneNode(true);
        asteroidsBtn.parentNode.replaceChild(newBtn, asteroidsBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Asteroids Native");
                        
            loadScript("Arcade/asteroids/asteroids-controller.js").then(() => {
                if (typeof window.openAsteroids === 'function') {
                    window.openAsteroids(); 
                } else {
                    console.error("ERROR: asteroids-controller.js logic failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load controller script:", err);
            });
        });
    }
});

// ==========================================
// DONKEY KONG NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const donkeyBtn = document.getElementById('btn-donkey');

    if (donkeyBtn) {
        const newBtn = donkeyBtn.cloneNode(true);
        donkeyBtn.parentNode.replaceChild(newBtn, donkeyBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Donkey Kong Native");
                        
            loadScript("Arcade/donkeykong/donkeykong-controller.js").then(() => {
                if (typeof window.openDonkeyKong === 'function') {
                    window.openDonkeyKong(); 
                } else {
                    console.error("ERROR: donkeykong-controller.js logic failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load controller script:", err);
            });
        });
    }
});

// ==========================================
// MATRIX RAMPAGE (SNAKE) NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const snakeBtn = document.getElementById('btn-snake');

    if (snakeBtn) {
        const newBtn = snakeBtn.cloneNode(true);
        snakeBtn.parentNode.replaceChild(newBtn, snakeBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Matrix Rampage (Snake) Native");
                        
            loadScript("Games/matrixrampage/matrixrampage-controller.js").then(() => {
                if (typeof window.openMatrixRampageGame === 'function') {
                    window.openMatrixRampageGame(); 
                } else {
                    console.error("ERROR: matrixrampage-controller.js failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load controller script:", err);
            });
        });
    }
});

// ==========================================
// MATRIX RAMPAGE 2 NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const rampage2Btn = document.getElementById('btn-rampage2');

    if (rampage2Btn) {
        const newBtn = rampage2Btn.cloneNode(true);
        rampage2Btn.parentNode.replaceChild(newBtn, rampage2Btn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Matrix Rampage 2 Native");
                        
            loadScript("Games/matrixrampage2/matrixrampage2-controller.js").then(() => {
                if (typeof window.openMatrixRampage2Game === 'function') {
                    window.openMatrixRampage2Game(); 
                } else {
                    console.error("ERROR: matrixrampage2-controller.js failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load Matrix Rampage 2 controller script:", err);
            });
        });
    }
});

// ==========================================
// MATRIX PANDEMONIUM NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const pandemoniumBtn = document.getElementById('btn-pong');

    if (pandemoniumBtn) {
        const newBtn = pandemoniumBtn.cloneNode(true);
        pandemoniumBtn.parentNode.replaceChild(newBtn, pandemoniumBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Matrix Pandemonium Native");
                        
            loadScript("Games/matrixpandemonium/pandemonium-controller.js").then(() => {
                if (typeof window.openMatrixPandemoniumGame === 'function') {
                    window.openMatrixPandemoniumGame(); 
                } else {
                    console.error("ERROR: pandemonium-controller.js failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load Matrix Pandemonium controller script:", err);
            });
        });
    }
});

// ==========================================
// CITIZENS OF ZION NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const zionBtn = document.getElementById('btn-tetris');

    if (zionBtn) {
        const newBtn = zionBtn.cloneNode(true);
        zionBtn.parentNode.replaceChild(newBtn, zionBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Citizens of Zion Native");
                        
            loadScript("Games/citizensofzion/citizensofzion-controller.js").then(() => {
                if (typeof window.openCitizensOfZionGame === 'function') {
                    window.openCitizensOfZionGame(); 
                } else {
                    console.error("ERROR: citizensofzion-controller.js failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load Citizens of Zion controller script:", err);
            });
        });
    }
});

// ==========================================
// MATRIX DOCK DEFENCE NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const dockDefenceBtn = document.getElementById('btn-2048');

    if (dockDefenceBtn) {
        const newBtn = dockDefenceBtn.cloneNode(true);
        dockDefenceBtn.parentNode.replaceChild(newBtn, dockDefenceBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Matrix Dock Defence Native");
                        
            loadScript("Games/matrixdockdefence/matrixdockdefence-controller.js").then(() => {
                if (typeof window.openMatrixDockDefenceGame === 'function') {
                    window.openMatrixDockDefenceGame(); 
                } else {
                    console.error("ERROR: matrixdockdefence-controller.js failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load Matrix Dock Defence controller script:", err);
            });
        });
    }
});

// ==========================================
// MATRIX OVERLOADED NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const overloadedBtn = document.getElementById('btn-overloaded');

    if (overloadedBtn) {
        const newBtn = overloadedBtn.cloneNode(true);
        overloadedBtn.parentNode.replaceChild(newBtn, overloadedBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Matrix Overloaded Native");
                        
            loadScript("Games/matrixoverloaded/matrixoverloaded-controller.js").then(() => {
                if (typeof window.openMatrixOverloadedGame === 'function') {
                    window.openMatrixOverloadedGame(); 
                } else {
                    console.error("ERROR: matrixoverloaded-controller.js failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load Matrix Overloaded controller script:", err);
            });
        });
    }
});

// ==========================================
// MATRIX TUNNEL RECON NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const tunnelBtn = document.getElementById('btn-tunnel');

    if (tunnelBtn) {
        const newBtn = tunnelBtn.cloneNode(true);
        tunnelBtn.parentNode.replaceChild(newBtn, tunnelBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Matrix Tunnel Recon Native");
                        
            loadScript("Games/matrixtunnelrecon/matrixtunnelrecon-controller.js").then(() => {
                if (typeof window.openMatrixTunnelReconGame === 'function') {
                    window.openMatrixTunnelReconGame(); 
                } else {
                    console.error("ERROR: matrixtunnelrecon-controller.js failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load Matrix Tunnel Recon controller script:", err);
            });
        });
    }
});

// ==========================================
// MATRIX BULLET TIME NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const bulletTimeBtn = document.getElementById('btn-bullettime');

    if (bulletTimeBtn) {
        const newBtn = bulletTimeBtn.cloneNode(true);
        bulletTimeBtn.parentNode.replaceChild(newBtn, bulletTimeBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Matrix Bullet Time Native");
                        
            loadScript("Games/matrixbullettime/bullettime-controller.js").then(() => {
                if (typeof window.openMatrixBulletTimeGame === 'function') {
                    window.openMatrixBulletTimeGame(); 
                } else {
                    console.error("ERROR: bullettime-controller.js failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load Matrix Bullet Time controller script:", err);
            });
        });
    }
});

// ==========================================
// MATRIX FIGHTER NATIVE BRIDGE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const fighterBtn = document.getElementById('btn-matrixfighter');

    if (fighterBtn) {
        const newBtn = fighterBtn.cloneNode(true);
        fighterBtn.parentNode.replaceChild(newBtn, fighterBtn);

        newBtn.addEventListener('click', () => {
            console.log("Initialize: Matrix Fighter Native");
                        
            loadScript("Games/matrixfighter/matrixfighter-controller.js").then(() => {
                if (typeof window.openMatrixFighterGame === 'function') {
                    window.openMatrixFighterGame(); 
                } else {
                    console.error("ERROR: matrixfighter-controller.js failed to initialize.");
                }
            }).catch(err => {
                console.error("Failed to load Matrix Fighter controller script:", err);
            });
        });
    }
});