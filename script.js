let terminalRainInterval = null; 
let termDrops = [];
// Base Matrix Config
const canvas = document.getElementById('matrix'), ctx = canvas.getContext('2d');
const sCanvas = document.getElementById('sentinel-layer'), sCtx = sCanvas.getContext('2d');
const mainContainer = document.querySelector('.main-container');
const MATRIX_ALPHABET = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789", BINARY_ALPHABET = "01", CLASSIC_GREEN = "#00FF41", 
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
    isOracleEnabled: false
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
let explorerStack = []; // Added for navigation depth tracking
let explorerPath = ["root"]; // Tracks folder names for breadcrumbs
window.isExplorerDeleteMode = false;

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

function handleVideoBackgroundToggle(videoType, isChecked) {
    const videoTypes = ["journey2", "binary", "room", "movie-tunnel", "matrix-room", "combat-training", "meditation", "vertical-rain", "operator"];
    if (isChecked) {
        videoTypes.forEach(type => {
            if (type !== videoType) {
                const toggle = document.getElementById(`${type}-toggle`);
                if (toggle) toggle.checked = false;
            }
        });
        startBackgroundVideo(videoType);
    } else {
        if (videoBackground === videoType) stopBackgroundVideo();
    }
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

let lastCpuInfo = null;
let networkData = { sent: 0, received: 0, lastUpdate: Date.now() };

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
    
    overlay.innerHTML = `
        <style>
            #zion-modal-inner::-webkit-scrollbar { width: 6px; }
            #zion-modal-inner::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
            #zion-modal-inner::-webkit-scrollbar-thumb { background: var(--theme-color); border-radius: 10px; box-shadow: 0 0 5px var(--theme-color); }
        </style>
        <div id="zion-modal-inner" style="position: relative; max-height: 90vh; width: 100%; max-width: 800px; padding: 20px; border: 2px solid var(--theme-color); box-shadow: 0 0 10px var(--theme-color); border-radius: 10px; background: rgba(0,0,0,0.85); overflow-y: auto; overflow-x: hidden;">
            <canvas id="zion-rain-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none;"></canvas>
            <div style="position: relative; z-index: 1; font-size:1.2rem; margin-bottom:30px; white-space:pre-wrap; text-shadow: 0 0 10px var(--theme-color); line-height: 1.4;">${msg}</div>
            <button id="zion-close" style="position: relative; z-index: 1; background:transparent; color:var(--theme-color); border:1px solid var(--theme-color); padding:10px 30px; cursor:pointer; font-family:inherit; font-weight:bold; letter-spacing:2px; box-shadow: 0 0 10px var(--theme-color); margin-top: 10px;">DISMISS</button>
        </div>`;
    
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
    '/help': () => showZionMessage("SYSTEM COMMANDS:\n/weather [city] - Satellite Uplink\n/ghost [0-1] - UI Transparency\n/speed [10-100] - Rain Velocity\n/color [hex] - System/Rain Color Update\n/alphabet [matrix|binary|hex] - Character Swap\n/font [cyber|classic] - Change Typography\n/glitch - Trigger System Distortion\n/night - Toggle Stealth Mode\n/quote [text] - Broadcast Custom Mantra\n/whoami - Advanced Identity Trace\n/jackin - Overclock Stream\n/clear - Flush Terminal\n/white-rabbit - Random Mantra\n/nodes - Link Count\n/reset - Factory Reset\n/root - System Root Explorer\n/mkdir [name] - Create Directory\n/space - Open NASA Solar System Viewer\n/earth - Open NASA Eyes on the Earth\n/asteroid - Open NASA Eyes on Asteroids\n/tunnel - Play Tunnel Recon\n/rampage - Play Matrix: Rampage\n/play zion - Play Citizens of Zion\n/play pandemonium - Play Matrix: Pandemonium\n/play dock - Play Dock Defence\n/uplink - Initiate Data Upload\n/vault - Access Secure Vault\n\nWEB UPLINKS:\n/yt, /twitch, /kick, /ig, /x, /reddit, /ebay, /amz, /ps, /xbox, /git, /ds, /gemini, /gpt"),    
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
            syncThemeColor(); 
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
        const info = `IDENTITY TRACE: \nOS: ${platform}\nCORE: ${browserName}\nDPR: ${dpr.toFixed(2)}x (Scaling Factor)\nVIEWPORT: ${window.innerWidth}x${window.innerHeight}\nHARDWARE: ${physicalWidth}x${physicalHeight} (True Resolution)\nUPLINK: ${navigator.onLine ? "SECURE" : "DISCONNECTED"}\nNETWORK ACTIVITY: ${networkData.sent.toFixed(1)}KB sent, ${networkData.received.toFixed(1)}KB received<div style="margin: 5px 0; text-align: center;"><img src="${idImage}" style="max-width: 300px; width: 100%; background: transparent; display: inline-block;"></div>STATUS: YOU ARE THE ONE.`;
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
        const cleanName = folderName.replace(/\s+/g, '_');
        const storageKey = `folder_${Date.now()}_${cleanName}`;
        
        chrome.storage.local.set({ [storageKey]: {} }, () => {
            showZionMessage(`DIRECTORY CREATED: ${cleanName}`);
            if (isExplorerActive) {
                chrome.storage.local.get(null, (updatedData) => {
                    explorerDataCache = updatedData;
                    explorerStack[0] = updatedData;
                    renderExplorerGrid();
                });
            }
        });
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
        openRootExplorer("vault_"); 
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
            um.innerHTML = `<div class="user-query">${txt}</div>`; 
            history.appendChild(um);
            history.scrollTop = history.scrollHeight;
            
            try {
                const lower = txt.toLowerCase();
                const isSlashCmd = lower.startsWith('/image') || lower.startsWith('/img') || lower.startsWith('/draw');
                const hasAction = /(draw|generate|create|make|visualize|show)/i.test(lower);
                const hasObject = /(image|picture|photo|art|sketch|painting)/i.test(lower);
                const isNaturalCmd = hasAction && hasObject;

                if (isSlashCmd || isNaturalCmd) {
                    let imgPrompt = txt
                        .replace(/^\/(image|img|draw)/i, '')
                        .replace(/^(can you|please|kindly)\s+/i, '')
                        .replace(/^(draw|generate|create|make|visualize|show)\s+(me\s+)?(an?\s+)?(image|picture|photo|art|sketch|painting)\s+(of\s+)?/i, '')
                        .trim();
                        
                    if(!imgPrompt) imgPrompt = txt; 

                    // Show temporary loading for image specifically
                    const loadingDiv = document.createElement('div');
                    loadingDiv.className = 'oracle-loading';
                    loadingDiv.textContent = 'Constructing visual representation...';
                    history.appendChild(loadingDiv);
                    history.scrollTop = history.scrollHeight;

                    const imgElement = await puter.ai.txt2img(imgPrompt, { model: 'black-forest-labs/FLUX.1-schnell' });
                    const imgUrl = imgElement.src; 
                    
                    loadingDiv.remove();
                    
                    addOracleImageResponse(imgUrl, `Rendering construct: "${imgPrompt}"`);
                } else {
                    // --- CHANGED LOGIC START ---
                    // Add Loading UI
                    // [NEW CODE]
// Note: These strings have NO dots at the end. The CSS adds them.
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
                }
            } catch (err) {
                 // Fallback catch for image gen errors
                const loaders = history.querySelectorAll('.oracle-loading');
                loaders.forEach(l => l.remove());
                addOracleResponse("Signal lost. Construct loading failed.");
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
        element.innerHTML = text; element.style.opacity = "1";
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
                const html = Array(state.typingIdx).fill(0).map(() => `<span style="display:inline-block; width:1ch; text-align:center;">${MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)]}</span>`).join("");
                element.innerHTML = html;
                element.classList.add('encrypted');
                
                if (shouldScroll && scrollParent) {
                    scrollParent.scrollTop = scrollParent.scrollHeight;
                }
                
            } else {
                const currentIter = Math.floor(state.revealIter);
                const html = state.text.split("").map((letter, index) => {
                    if (index < currentIter) return letter === '<' ? '&lt;' : letter;
                    const char = MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)];
                    return `<span style="display:inline-block; width:1ch; text-align:center;">${char}</span>`;
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
    entry.innerHTML = `<div class="oracle-response-container"><div class="oracle-response-text encrypted" id="${id}"></div></div>`;
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
            termTextEl.id = termId;
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

    const innerHTML = `
        <div class="oracle-response-container" style="border-left:none; background: transparent; padding-left: 0;">
            <div class="oracle-scan-container">
                <img src="${imgUrl}" />
            </div>
            <div class="oracle-response-text encrypted" id="${id}" style="font-size: 0.75rem; border-left: 2px solid var(--theme-color); padding-left: 8px;"></div>
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
            
            termEntry.innerHTML = innerHTML.replace(`id="${id}"`, `id="${termId}"`);
            
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

// --- NETWORK MONITORING ---
let networkHistory = [];
const MAX_NETWORK_HISTORY = 60;

function updateNetworkStats() {
    const now = Date.now();
    let netActivity = 0;
    if (navigator.onLine) {
        const randomPattern = Math.random();
        if (randomPattern < 0.1) netActivity = 30 + Math.random() * 40;
        else if (randomPattern < 0.3) netActivity = 10 + Math.random() * 20;
        else netActivity = 2 + Math.random() * 8;
    }
    const bytesPerUpdate = netActivity * 1024;
    networkData.sent += bytesPerUpdate * 0.4 / 1024;
    networkData.received += bytesPerUpdate * 0.6 / 1024;
    networkData.lastUpdate = now;
    
    networkHistory.push(netActivity);
    if (networkHistory.length > MAX_NETWORK_HISTORY) networkHistory.shift();
    
    const netFill = get('net-fill');
    const netLed = document.querySelector('#operator-console .deck-group:nth-child(3) .led');
    
    if (netFill) {
        const avgActivity = networkHistory.length > 0 ? networkHistory.reduce((a, b) => a + b) / networkHistory.length : 0;
        let netPercent = Math.min(avgActivity, 100);
        if (navigator.onLine && netPercent < 5) netPercent = 5;
        netFill.style.height = `${netPercent}%`;
        
        if (netLed) {
            netLed.classList.remove('blink-fast', 'blink-slow', 'solid');
            if (netPercent > 70) {
                netLed.classList.add('blink-fast');
                netLed.style.background = '#ff0';
                netLed.style.boxShadow = '0 0 5px #ff0';
            } else if (netPercent > 30) {
                netLed.classList.add('blink-slow');
                netLed.style.background = '#0f0';
                netLed.style.boxShadow = '0 0 5px #0f0';
            } else {
                netLed.classList.add('solid');
                netLed.style.background = '#00f';
                netLed.style.boxShadow = '0 0 5px #00f';
            }
        }
    }
    const ioFill = get('io-fill');
    if (ioFill) {
        const ioPercent = Math.min(netActivity * 0.7 + Math.random() * 15, 100);
        ioFill.style.height = `${ioPercent}%`;
    }
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
                if (cpuFill) cpuFill.style.height = `${cpuPercent}%`;
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
            if (pwrFill) pwrFill.style.height = `${pwrPercent}%`;
        });
    }
    if (Date.now() - networkData.lastUpdate > 2000) updateNetworkStats();
}

// --- ZION NETWORK RSS ---
const matrixTextIntervals = new Map(), matrixTextIterations = new Map();

function decryptRssText(element, targetText, isHovering) {
    if (matrixTextIntervals.has(element)) clearInterval(matrixTextIntervals.get(element));
    let iteration = matrixTextIterations.get(element) || 0;
    const interval = setInterval(() => {
        element.innerText = targetText.split("").map((letter, index) => {
            if (index < iteration) return targetText[index];
            return MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)];
        }).join("");
        if (isHovering) {
            iteration += 1/3;
            if (iteration >= targetText.length) { iteration = targetText.length; element.innerText = targetText; clearInterval(interval); matrixTextIntervals.delete(element); }
        } else {
            iteration -= 1/2;
            if (iteration <= 0) { iteration = 0; element.innerText = targetText.replace(/./g, () => MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)]); clearInterval(interval); matrixTextIntervals.delete(element); }
        }
        matrixTextIterations.set(element, iteration);
    }, 30);
    matrixTextIntervals.set(element, interval);
}

async function updateZionFeed(isSilent = false) {
    const data = await chrome.storage.sync.get(['isRssEnabled', 'rssSubs']);
    const container = document.getElementById('zion-rss-container');
    const list = document.getElementById('rss-feed-list');
    const barCont = document.getElementById('rss-loading-bar-container');
    const bar = document.getElementById('rss-loading-bar');
    
    if (!data.isRssEnabled) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');
    
    if (!isSilent) {
        list.innerHTML = '<div class="rss-meta">Establishing Uplink...</div>';
        if (barCont && bar) {
            barCont.style.display = 'block';
            bar.style.width = '30%'; 
        }
    }
    
    try {
        const subs = data.rssSubs || "matrix+cyberpunk";
        const response = await fetch(`https://www.reddit.com/r/${subs}/hot.json?limit=50&raw_json=1`);
        
        if (!isSilent && bar) bar.style.width = '70%'; 
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || contentType.indexOf("application/json") === -1) {
            throw new Error("Reddit Uplink Failed: Received HTML/Error instead of JSON");
        }
        const json = await response.json();
        if (!isSilent && bar) bar.style.width = '100%'; 
        list.innerHTML = "";

        json.data.children.forEach(post => {
            const item = post.data;
            const link = document.createElement('a');
            link.className = 'rss-item'; 
            link.href = `https://reddit.com${item.permalink}`; 
            
            link.onclick = (e) => {
                if (e.target.tagName !== 'BUTTON' && e.target.parentElement.tagName !== 'BUTTON') {
                    e.preventDefault();
                    if (typeof openTerminalModal === "function") {
                        openTerminalModal(item.permalink);
                    } else {
                        window.open(link.href, '_blank');
                    }
                }
            };

            const title = document.createElement('div');
            title.className = 'rss-title';
            title.style.color = 'var(--theme-color)';
            const originalTitle = item.title;
            title.innerText = originalTitle.replace(/./g, () => MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)]);
            
            const meta = document.createElement('div');
            meta.className = 'rss-meta';
            meta.style.color = 'var(--theme-color)';
            meta.style.opacity = '0.7';
            const subText = `r/${item.subreddit}`;
            const authText = `u/${item.author}`;
            const combinedMeta = `${subText} • ${authText}`;
            meta.innerText = combinedMeta.replace(/./g, () => MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)]);

            link.appendChild(title);
            link.appendChild(meta);

            if (item.post_hint === 'image' || (item.url && item.url.match(/\.(jpg|jpeg|png|gif)$/))) {
                const wrap = document.createElement('div');
                wrap.className = 'rss-media-wrapper';
                const img = document.createElement('img');
                img.src = item.url;
                img.className = 'rss-media-content';
                const imgFsBtn = document.createElement('button');
                imgFsBtn.className = 'video-fullscreen-btn'; 
                imgFsBtn.innerHTML = '⛶';
                imgFsBtn.title = "Maximize Visual";
                imgFsBtn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation(); 
                    if (img.requestFullscreen) img.requestFullscreen();
                    else if (img.webkitRequestFullscreen) img.webkitRequestFullscreen();
                    else if (img.msRequestFullscreen) img.msRequestFullscreen();
                };
                wrap.appendChild(img);
                wrap.appendChild(imgFsBtn);
                link.appendChild(wrap);
            } else if (item.is_video && item.media && item.media.reddit_video) {
                const wrap = document.createElement('div');
                wrap.className = 'rss-media-wrapper';
                const video = document.createElement('video');
                video.src = item.media.reddit_video.hls_url || item.media.reddit_video.fallback_url;
                video.className = 'rss-media-content';
                video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true;
                const fsBtn = document.createElement('button');
                fsBtn.className = 'video-fullscreen-btn';
                fsBtn.innerHTML = '⛶';
                fsBtn.title = "Maximize Transmission";
                fsBtn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (video.requestFullscreen) video.requestFullscreen();
                    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
                };
                const volBtn = document.createElement('button');
                volBtn.className = 'video-vol-btn';
                volBtn.innerHTML = '🔇';
                volBtn.title = "Toggle Audio";
                volBtn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    video.muted = !video.muted;
                    if (!video.muted) video.play().catch(() => {});
                    volBtn.innerHTML = video.muted ? '🔇' : '🔊';
                    volBtn.style.boxShadow = video.muted ? 'none' : '0 0 10px var(--theme-color)';
                };
                wrap.appendChild(video); wrap.appendChild(fsBtn); wrap.appendChild(volBtn);
                link.appendChild(wrap);
            }

            const statsRow = document.createElement('div');
            statsRow.className = 'rss-stats-row';
            const format = (n) => (n > 999 ? (n/1000).toFixed(1) + 'k' : Math.floor(n) || 0);

            const upDiv = document.createElement('div');
            upDiv.className = 'rss-stat-item upvote-item';
            upDiv.innerHTML = `<span class="rss-stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4L3 15H9V20H15V15H21L12 4Z" /></svg></span> ${format(item.ups)}`;
            statsRow.appendChild(upDiv);

            const ratio = item.upvote_ratio || 1;
            const estimatedDowns = ratio < 1 ? Math.round((item.ups / ratio) - item.ups) : 0;
            if (estimatedDowns > 0) {
                const downDiv = document.createElement('div');
                downDiv.className = 'rss-stat-item downvote-item';
                downDiv.innerHTML = `<span class="rss-stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(180deg);"><path d="M12 4L3 15H9V20H15V15H21L12 4Z" /></svg></span> ${format(estimatedDowns)}`;
                statsRow.appendChild(downDiv);
            }

            const commDiv = document.createElement('div');
            commDiv.className = 'rss-stat-item';
            commDiv.innerHTML = `<span class="rss-stat-icon">💬</span> ${format(item.num_comments)}`;
            statsRow.appendChild(commDiv);
            link.appendChild(statsRow);

            link.onmouseenter = () => {
                decryptRssText(title, originalTitle, true);
                decryptRssText(meta, combinedMeta, true);
                const vid = link.querySelector('video');
                if (vid) vid.play().catch(() => {});
            };

            link.onmouseleave = () => {
                decryptRssText(title, originalTitle, false);
                decryptRssText(meta, combinedMeta, false);
                const vid = link.querySelector('video');
                if (vid) vid.pause();
            };

            list.appendChild(link);
        });

        if (!isSilent && barCont) {
            setTimeout(() => {
                barCont.style.display = 'none';
                if (bar) bar.style.width = '0%';
            }, 800);
        }
    } catch (e) { console.error("Zion Feed Error:", e); }
}

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
    const l = get('chat-log');
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
        d.innerHTML = `<b class="${line.c}">${line.u}:</b> ${line.t}`; 
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
        if (val.startsWith('/')) {
            const parts = val.split(' ');
            const cmd = parts[0].toLowerCase();
            if (CLI_COMMANDS[cmd]) { 
                CLI_COMMANDS[cmd](parts.slice(1).join(' ')); 
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

// --- SETTINGS CONTROLS ---
const get = (id) => document.getElementById(id);
const modal = get('settings-modal'), sizeS = get('size-slider'), textScaleS = get('text-scale-slider'), speedS = get('speed-slider');
const colorP = get('color-picker'); 
const themeColorP = get('theme-color-picker'); 

const minT = get('show-minutes'), secT = get('show-seconds'), hour24T = get('use-24hour'), greenT = get('matrix-green'), binaryT = get('binary-mode'), hexT = get('hex-mode'), asciiT = get('ascii-mode'), bamumT = get('bamum-mode'), mathT = get('math-mode'), emojiT = get('emoji-mode'), snowT = get('snow-toggle'), fontT = get('font-toggle'), rainbowT = get('rainbow-toggle'), glowT = get('glow-toggle'), glitchT = get('glitch-toggle'), glitchS = get('glitch-slider'), scanlineT = get('scanline-toggle'), bgFilterT = get('bg-filter-toggle'), bgT = get('bg-toggle'), quoteI = get('quote-input'), saveB = get('save-settings'), scaleS = get('scale-mode'), cycleT = get('cycle-quotes'), resetB = get('restore-defaults');
const imgI = get('image-input'), vidI = get('video-input'), upImgB = get('upload-image-btn'), upVidB = get('upload-video-btn'), clearB = get('clear-backdrop');
const phoneT = get('phone-toggle'), phoneFreqS = get('phone-freq-slider'), phoneFreqVal = get('phone-freq-value'), chatT = get('chat-toggle');
const audI = get('audio-input'), upAudB = get('upload-audio-btn'), clearAudB = get('clear-audios');
const rssT = get('rss-toggle'), rssI = get('rss-input'), statsT = get('stats-toggle');
const rainAmbT = get('rain-ambience-toggle'), humT = get('hum-toggle'), matrixSfxT = get('matrix-sfx-toggle'), envVolS = get('env-volume-slider');
const upSfxB = get('upload-custom-sfx-btn'), sfxI = get('custom-sfx-input'), clearSfxB = get('clear-custom-sfx');
const journey2T = get('journey2-toggle'), binaryTunnelT = get('binary-toggle'), matrixRoomT = get('room-toggle');
const movieTunnelT = get('movie-tunnel-toggle'), matrixRoomNewT = get('matrix-room-toggle'), combatTrainingT = get('combat-training-toggle'), meditationT = get('meditation-toggle'), operatorT = get('operator-toggle');
const verticalRainT = get('vertical-rain-toggle');

const verticalRainBinaryT = get('vertical-rain-binary-mode');
const verticalRainHexT = get('vertical-rain-hex-mode');
const verticalRainAsciiT = get('vertical-rain-ascii-mode');
const verticalRainMathT = get('vertical-rain-math-mode');
const verticalRainRainbowT = get('vertical-rain-rainbow-toggle');
const oracleT = get('oracle-toggle');

function applyImg(s) { removeM(); const i = document.createElement('img'); i.id = 'bg-image-layer'; i.src = s; mainContainer.prepend(i); }
function applyVid(file) { removeM(); const v = document.createElement('video'); v.id = 'bg-video'; v.src = URL.createObjectURL(file); v.autoplay = v.loop = v.muted = v.playsInline = true; mainContainer.prepend(v); }
function removeM() { const v = get('bg-video'), i = get('bg-image-layer'); if(v) { URL.revokeObjectURL(v.src); v.remove(); } if(i) i.remove(); }

function syncThemeColor() {
    if (isMatrixGreen) {
        document.documentElement.style.setProperty('--theme-color', CLASSIC_GREEN);
        rainColor = CLASSIC_GREEN;
        themeColor = CLASSIC_GREEN;
        colorP.value = CLASSIC_GREEN;
        themeColorP.value = CLASSIC_GREEN;
        colorP.disabled = true;
        themeColorP.disabled = true;
    } else {
        document.documentElement.style.setProperty('--theme-color', themeColorP.value);
        rainColor = colorP.value;
        themeColor = themeColorP.value;
        colorP.disabled = false;
        themeColorP.disabled = false;
    }
    if (!videoBackground) startRain();
}

get('settings-icon-container').onclick = () => {
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        setTimeout(initSettingsRain, 50); 
    } else {
        if (settingsRainInterval) clearInterval(settingsRainInterval);
    }
};

greenT.onchange = (e) => { isMatrixGreen = e.target.checked; syncThemeColor(); };

colorP.oninput = (e) => { 
    if (!isMatrixGreen) {
        rainColor = e.target.value;
        if (!videoBackground) startRain();
    }
};

themeColorP.oninput = (e) => {
    if (!isMatrixGreen) {
        themeColor = e.target.value;
        document.documentElement.style.setProperty('--theme-color', themeColor);
    }
};

quoteI.oninput = (e) => { const val = e.target.value; if (val.trim() !== "") { stopQuoteCycling(); cycleT.checked = false; get('display-quote').textContent = `"${val}"`; } else if (!cycleT.checked) { get('display-quote').textContent = '"There is no spoon."'; } };
minT.onchange = (e) => { showMinutes = e.target.checked; updateUI(); };
secT.onchange = (e) => { showSeconds = e.target.checked; updateUI(); };
hour24T.onchange = (e) => { use24Hour = e.target.checked; updateUI(); };

function update2DAlphabet() {
    if (isBinary) currentAlphabet = BINARY_ALPHABET;
    else if (isHex) currentAlphabet = HEX_ALPHABET;
    else if (isAscii) currentAlphabet = ASCII_ALPHABET;
    else if (isMathSymbols) currentAlphabet = MATH_SYMBOLS_ALPHABET;
    else currentAlphabet = MATRIX_ALPHABET;
}

binaryT.onchange = (e) => { 
    isBinary = e.target.checked; 
    if(isBinary) { isHex = isAscii = isMathSymbols = false; hexT.checked = asciiT.checked = mathT.checked = false; }
    update2DAlphabet();
    if (!videoBackground) startRain();
};
hexT.onchange = (e) => { 
    isHex = e.target.checked; 
    if(isHex) { isBinary = isAscii = isMathSymbols = false; binaryT.checked = asciiT.checked = mathT.checked = false; }
    update2DAlphabet();
    if (!videoBackground) startRain();
};
asciiT.onchange = (e) => { 
    isAscii = e.target.checked; 
    if(isAscii) { isBinary = isHex = isMathSymbols = false; binaryT.checked = hexT.checked = mathT.checked = false; }
    update2DAlphabet();
    if (!videoBackground) startRain();
};
mathT.onchange = (e) => { 
    isMathSymbols = e.target.checked; 
    if(isMathSymbols) { isBinary = isHex = isAscii = false; binaryT.checked = hexT.checked = asciiT.checked = false; }
    update2DAlphabet();
    if (!videoBackground) startRain();
};

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

verticalRainBinaryT.onchange = (e) => { isVerticalRainBinary = e.target.checked; if(isVerticalRainBinary) { isVerticalRainHex = isVerticalRainAscii = isVerticalRainMathSymbols = false; verticalRainHexT.checked = verticalRainAsciiT.checked = verticalRainMathT.checked = false; } update3DVerticalRainAlphabet(); if (videoBackground === "vertical-rain") startVerticalRainEffect(); };
verticalRainHexT.onchange = (e) => { isVerticalRainHex = e.target.checked; if(isVerticalRainHex) { isVerticalRainBinary = isVerticalRainAscii = isVerticalRainMathSymbols = false; verticalRainBinaryT.checked = verticalRainAsciiT.checked = verticalRainMathT.checked = false; } update3DVerticalRainAlphabet(); if (videoBackground === "vertical-rain") startVerticalRainEffect(); };
verticalRainAsciiT.onchange = (e) => { isVerticalRainAscii = e.target.checked; if(isVerticalRainAscii) { isVerticalRainBinary = isVerticalRainHex = isVerticalRainMathSymbols = false; verticalRainBinaryT.checked = verticalRainHexT.checked = verticalRainMathT.checked = false; } update3DVerticalRainAlphabet(); if (videoBackground === "vertical-rain") startVerticalRainEffect(); };
verticalRainMathT.onchange = (e) => { isVerticalRainMathSymbols = e.target.checked; if(isVerticalRainMathSymbols) { isVerticalRainBinary = isVerticalRainHex = isVerticalRainAscii = false; verticalRainBinaryT.checked = verticalRainHexT.checked = verticalRainAsciiT.checked = false; } update3DVerticalRainAlphabet(); if (videoBackground === "vertical-rain") startVerticalRainEffect(); };
verticalRainRainbowT.onchange = (e) => { isVerticalRainRainbow = e.target.checked; if (videoBackground === "vertical-rain") startVerticalRainEffect(); };

document.addEventListener('DOMContentLoaded', function() {
    const verticalRainBamumToggle = document.getElementById('vertical-rain-bamum-mode');
    const verticalRainEmojiToggle = document.getElementById('vertical-rain-emoji-mode');
    if (verticalRainBamumToggle) { verticalRainBamumToggle.disabled = true; verticalRainBamumToggle.checked = false; }
    if (verticalRainEmojiToggle) { verticalRainEmojiToggle.disabled = true; verticalRainEmojiToggle.checked = false; }
});

snowT.onchange = (e) => { 
    isSnowing = e.target.checked; 
    chrome.storage.sync.set({ isSnowing }); 
    const swarmAudio = document.getElementById('sentinel-swarm-sfx');
    if(isSnowing) { 
        initSnow(); 
        sCanvas.style.display = 'block';
        if (swarmAudio) {
            swarmAudio.volume = 0.4;
            swarmAudio.play().catch(err => { console.log("Audio waiting for user interaction"); });
        }
    } else {
        sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
        sCanvas.style.display = 'none';
        if (swarmAudio) { swarmAudio.pause(); swarmAudio.currentTime = 0; }
    }
};

rainbowT.onchange = (e) => isFlashing = e.target.checked;
fontT.onchange = (e) => document.body.classList.toggle('cyberpunk-font', e.target.checked);
glowT.onchange = (e) => document.body.classList.toggle('glow-active', e.target.checked);
glitchT.onchange = (e) => document.body.classList.toggle('glitch-enabled', e.target.checked);
scanlineT.onchange = (e) => get('scanline-overlay').classList.toggle('hidden', !e.target.checked);
bgFilterT.onchange = (e) => document.body.classList.toggle('bg-filter-active', e.target.checked);
bgT.onchange = (e) => mainContainer.classList.toggle('transparent-bg', e.target.checked);
cycleT.onchange = (e) => { if (e.target.checked) { quoteI.value = ""; startQuoteCycling(); } else stopQuoteCycling(); };
speedS.oninput = (e) => { rainSpeed = parseInt(e.target.value); if (!videoBackground) startRain(); };
sizeS.oninput = (e) => { mainContainer.style.transform = `translate(-50%, -50%) scale(${e.target.value})`; };
textScaleS.oninput = (e) => document.documentElement.style.setProperty('--text-scale', e.target.value);
glitchS.oninput = (e) => document.documentElement.style.setProperty('--glitch-intensity', e.target.value + 'px');
scaleS.onchange = (e) => document.documentElement.style.setProperty('--bg-scale', e.target.value);

journey2T.onchange = (e) => handleVideoBackgroundToggle('journey2', e.target.checked);
binaryTunnelT.onchange = (e) => handleVideoBackgroundToggle('binary', e.target.checked);
matrixRoomT.onchange = (e) => handleVideoBackgroundToggle('room', e.target.checked);
movieTunnelT.onchange = (e) => handleVideoBackgroundToggle('movie-tunnel', e.target.checked);
matrixRoomNewT.onchange = (e) => handleVideoBackgroundToggle('matrix-room', e.target.checked);
combatTrainingT.onchange = (e) => handleVideoBackgroundToggle('combat-training', e.target.checked);
meditationT.onchange = (e) => handleVideoBackgroundToggle('meditation', e.target.checked);
verticalRainT.onchange = (e) => handleVideoBackgroundToggle('vertical-rain', e.target.checked);
operatorT.onchange = (e) => handleVideoBackgroundToggle('operator', e.target.checked);

phoneT.onchange = (e) => { 
    isPhoneEnabled = e.target.checked; 
    const phoneContainer = get('phone-container');
    if (isPhoneEnabled) phoneContainer.classList.remove('hidden');
    else {
        phoneContainer.classList.add('hidden');
        phoneContainer.classList.remove('ringing', 'receiving');
        const ringAudio = get('ring-audio');
        ringAudio.pause(); ringAudio.src = "";
    }
    setupPhoneInterval();
    chrome.storage.sync.set({ isPhoneEnabled });
};
phoneFreqS.oninput = (e) => { phoneFrequency = parseInt(e.target.value); phoneFreqVal.textContent = phoneFrequency; setupPhoneInterval(); };
chatT.onchange = (e) => { isChatEnabled = e.target.checked; get('transmission-terminal').classList.toggle('hidden', !isChatEnabled); };
rssT.onchange = (e) => { chrome.storage.sync.set({ isRssEnabled: e.target.checked }); updateZionFeed(); };
rssI.onchange = (e) => { const val = e.target.value.replace(/,/g, '+').replace(/\s/g, ''); rssI.value = val; chrome.storage.sync.set({ rssSubs: val }); updateZionFeed(); };
statsT.onchange = (e) => get('operator-console').classList.toggle('stats-hidden', !e.target.checked);
rainAmbT.onchange = (e) => { const a = get('ambience-rain'); e.target.checked ? a.play().catch(() => {}) : a.pause(); };
humT.onchange = (e) => { const a = get('ambience-hum'); e.target.checked ? a.play().catch(() => {}) : a.pause(); };
matrixSfxT.onchange = (e) => { const a = get('matrix-code-sfx'); e.target.checked ? a.play().catch(() => {}) : a.pause(); };
envVolS.oninput = (e) => { const v = parseFloat(e.target.value); get('ambience-rain').volume = get('ambience-hum').volume = get('matrix-code-sfx').volume = get('custom-background-sfx').volume = v; };

if (oracleT) {
    oracleT.onchange = (e) => {
        isOracleEnabled = e.target.checked;
        chrome.storage.sync.set({ isOracleEnabled });
        initOracleChat();
    }
}

upSfxB.onclick = () => sfxI.click();
sfxI.onchange = async (e) => { const f = e.target.files[0]; if(!f) return; await saveSfxToDB(f); const a = get('custom-background-sfx'); a.src = URL.createObjectURL(f); a.play().catch(() => {}); };
clearSfxB.onclick = () => { if(confirm("Purge custom SFX?")) { clearSfxFromDB(); get('custom-background-sfx').pause(); get('custom-background-sfx').src = ""; } };

saveB.onclick = () => {
    const s = { 
        rainColor: colorP.value, themeColor: themeColorP.value, rainSpeed, uiScale: sizeS.value, textScale: textScaleS.value, 
        showMinutes, showSeconds, use24Hour, isMatrixGreen, isBinary, isHex, isAscii, isMathSymbols, videoBackground,
        isSnowing, isCyberpunkFont: fontT.checked, isFlashing, isGlow: glowT.checked, isGlitch: glitchT.checked, 
        glitchIntensity: glitchS.value, isScanline: scanlineT.checked, isBgFilter: bgFilterT.checked, 
        isTransparent: bgT.checked, scaleMode: scaleS.value, isCycling: cycleT.checked, customQuote: quoteI.value, 
        isPhoneEnabled, phoneFrequency, isChatEnabled, isRssEnabled: rssT.checked, rssSubs: rssI.value, 
        isStatsEnabled: statsT.checked, isRainAmbience: rainAmbT.checked, isHumEnabled: humT.checked, 
        isMatrixSfxEnabled: matrixSfxT.checked, envVolume: envVolS.value,
        isOracleEnabled: oracleT ? oracleT.checked : false
    };
    chrome.storage.sync.set(s, () => {
        modal.classList.add('hidden');
        if (settingsRainInterval) clearInterval(settingsRainInterval);
    });
};

resetB.onclick = () => { 
    if(confirm("Hard Reset?")) { 
        chrome.storage.sync.clear(); 
        clearVideoFromDB().then(() => clearSfxFromDB()).then(() => {
            stopAllAnimations();
            location.reload(); 
        }); 
    } 
};
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

function setupPhoneInterval() {
    clearInterval(ringCycleInterval);
    ringCycleInterval = null;
    if (isPhoneEnabled && phoneFrequency > 0) ringCycleInterval = setInterval(triggerRinging, phoneFrequency * 60000);
}

let isProcessingPhone = false;
function triggerRinging() { 
    if (isProcessingPhone || !isPhoneEnabled) return; 
    const a = get('ring-audio'); 
    a.src = "ringing.mp3"; 
    get('phone-container').classList.add('ringing'); 
    a.play().catch(() => {}); 
}

function initPhoneSystem() {
    const phoneCont = get('phone-container'), 
          transText = get('transmission-text'), 
          transAudio = get('transmission-audio'), 
          ringAudio = get('ring-audio');

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
        const h = get('hangup-audio'); 
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

const navWrapper = get('dynamic-links-wrapper'), addLinkBtn = get('add-link-btn');

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

chrome.storage.sync.get(null, (d) => {
    const data = { ...DEFAULTS, ...d };
    initVerticalRainEffect();
    rainSpeed = data.rainSpeed; speedS.value = rainSpeed; 
    isMatrixGreen = data.isMatrixGreen; greenT.checked = isMatrixGreen; 
    colorP.value = data.rainColor; themeColorP.value = data.themeColor || DEFAULTS.themeColor;
    syncThemeColor(); 
    
    isBinary = data.isBinary; binaryT.checked = isBinary;
    isHex = data.isHex; hexT.checked = isHex;
    isAscii = data.isAscii; asciiT.checked = isAscii;
    isMathSymbols = data.isMathSymbols; mathT.checked = isMathSymbols;
    update2DAlphabet();
    
    videoBackground = data.videoBackground; 
    if (videoBackground) {
        const toggle = document.getElementById(`${videoBackground}-toggle`);
        if (toggle) toggle.checked = true;
        setTimeout(() => startBackgroundVideo(videoBackground), 100);
    } else {
        startRain();
    }

    isSnowing = data.isSnowing; snowT.checked = isSnowing; 
    if(isSnowing) { initSnow(); const swarmAudio = document.getElementById('sentinel-swarm-sfx'); if (swarmAudio) { swarmAudio.volume = 0.4; swarmAudio.play().catch(() => {}); } }

    isFlashing = data.isFlashing; rainbowT.checked = isFlashing;
    showMinutes = data.showMinutes; minT.checked = showMinutes; 
    showSeconds = data.showSeconds; secT.checked = showSeconds; 
    use24Hour = data.use24Hour; hour24T.checked = use24Hour;
    
    isPhoneEnabled = data.isPhoneEnabled; phoneT.checked = isPhoneEnabled; phoneFrequency = data.phoneFrequency; phoneFreqS.value = phoneFrequency; phoneFreqVal.textContent = phoneFrequency;
    const phoneContainer = get('phone-container');
    if (isPhoneEnabled) phoneContainer.classList.remove('hidden'); else phoneContainer.classList.add('hidden');
    
    isChatEnabled = data.isChatEnabled; chatT.checked = isChatEnabled; 
    get('transmission-terminal').classList.toggle('hidden', !isChatEnabled);
    
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
    
    isOracleEnabled = data.isOracleEnabled;
    if(oracleT) oracleT.checked = isOracleEnabled;
    
    const rA = get('ambience-rain'), hA = get('ambience-hum'), mA = get('matrix-code-sfx'), cA = get('custom-background-sfx');
    rainAmbT.checked = data.isRainAmbience; humT.checked = data.isHumEnabled; matrixSfxT.checked = data.isMatrixSfxEnabled;
    envVolS.value = data.envVolume; rA.volume = hA.volume = mA.volume = cA.volume = data.envVolume;
    
    if(data.isRainAmbience) rA.play().catch(() => {}); 
    if(data.isHumEnabled) hA.play().catch(() => {}); 
    if(data.isMatrixSfxEnabled) mA.play().catch(() => {});
    loadSfxFromDB().then(f => { if(f) { cA.src = URL.createObjectURL(f); cA.play().catch(() => {}); } });
    
    statsT.checked = data.isStatsEnabled; get('operator-console').classList.toggle('stats-hidden', !data.isStatsEnabled);
    
    setTimeout(() => { initOracleChat(); }, 100);
    
    // --- MIGRATION: SYNC TO LOCAL FOR NAV LINKS ---
    chrome.storage.sync.get(['userNavLinks'], (syncData) => {
        if (syncData.userNavLinks && syncData.userNavLinks.length > 0) {
            chrome.storage.local.get(['userNavLinks'], (localData) => {
                // If local is empty but sync has data, migrate it
                if (!localData.userNavLinks || localData.userNavLinks.length === 0) {
                    chrome.storage.local.set({ userNavLinks: syncData.userNavLinks }, () => {
                        console.log("Migrated Nav Links from Sync to Local Storage");
                        // Remove from sync to prevent future conflicts (optional, but cleaner)
                        chrome.storage.sync.remove('userNavLinks');
                        loadNavLinks(); // Refresh UI
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

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (!isCalendarOpen && !window.calendarInitialized) {
            initCalendar();
            window.calendarInitialized = true;
        }
    }, 200);
});

setInterval(() => updateZionFeed(true), 120000);
chrome.storage.local.get(['customImg'], (res) => { if(res.customImg) applyImg(res.customImg); else loadVideoFromDB().then(file => { if(file) applyVid(file); }); });
window.onresize = resize;
setInterval(updateUI, 1000);
setInterval(updateNetworkStats, 2000);

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
            const storageKey = `vault_${Date.now()}_(${sizeKB}KB)_${file.name.replace(/\s+/g, '_')}`;
            
            chrome.storage.local.set({ [storageKey]: evt.target.result }, () => {
                showZionMessage(`DATA UPLOADED: ${file.name}\nSIZE: ${sizeKB} KB`);
                if (isExplorerActive) {
                    chrome.storage.local.get(null, (updatedData) => {
                        explorerDataCache = updatedData;
                        explorerStack[0] = updatedData; 
                        renderExplorerGrid();
                    });
                }
                input.remove();
            });
        };
        file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/') 
            ? reader.readAsDataURL(file) : reader.readAsText(file);
    };
    input.click();
}

function extractVaultData(filename, data) {
    let blob;
    if (typeof data === 'string' && data.startsWith('data:')) {
        const byteString = atob(data.split(',')[1]);
        const mimeString = data.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        blob = new Blob([ab], {type: mimeString});
    } else {
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

async function openRootExplorer(startFilter = "") {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');
    
    if (!modal || !output || !input) return;

    isExplorerActive = true;
    modal.classList.remove('hidden');
    
    // Clear standard terminal output
    output.innerHTML = "";
    
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

    // --- FIX: LOAD DATA THEN APPLY FILTER ---
    explorerStack = []; 
    explorerPath = ["root"]; 
    
    chrome.storage.local.get(null, (data) => {
        explorerDataCache = data; 
        explorerStack.push(data); 
        
        // Render immediately with the requested filter (No timeouts needed)
        renderExplorerGrid(startFilter);
        
        // Update input to match context
        if (startFilter === "vault_") {
            input.placeholder = "Filtering Secure Vault...";
        } else {
            input.placeholder = "Type filename to filter...";
        }
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
            explorerPath = ["root"];
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
        backNode.innerHTML = `<div class="explorer-icon">↩</div><div class="explorer-label">RETURN</div>`;
        backNode.onclick = () => {
            explorerStack.pop();
            explorerPath.pop();
            renderExplorerGrid(filter);
        };
        grid.appendChild(backNode);
    }

    // 5. Generate Keys
    let keys = isArray ? currentData.map((_, i) => i) : Object.keys(currentData);
    
    // Empty Folder Message
    if (keys.length === 0 && viewDepth === 0) {
         grid.innerHTML += `<div class="explorer-empty" style="grid-column: 1/-1; text-align:center; opacity:0.5; padding:20px;">NO FILES FOUND<br><span style="font-size:0.8em">CLICK 'UPLOAD' TO BEGIN</span></div>`;
    }

    keys.forEach(key => {
        const value = currentData[key];
     

        // --- NEW SMART FILTER LOGIC ---
        if (filter) {
            const f = filter.toLowerCase();
            const lowerKey = String(key).toLowerCase();
            let isMatch = false;

            // 1. Check File Types
            if (f === 'image') isMatch = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(lowerKey);
            else if (f === 'video') isMatch = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(lowerKey);
            else if (f === 'audio') isMatch = /\.(mp3|wav|aac|flac|m4a)$/i.test(lowerKey);
            else if (f === 'code') isMatch = /\.(html|htm|js|css|json|py|cpp|txt)$/i.test(lowerKey);
            // 2. Check Prefixes (Vault/Hack)
            else if (f === 'vault_') isMatch = lowerKey.startsWith('vault_');
            else if (f === 'hack_') isMatch = lowerKey.startsWith('hack_');
            // 3. Default to Name Search
            else isMatch = lowerKey.includes(f);

            // Always show folders so you can browse, otherwise respect the match
            const isDir = (typeof value === 'object' && value !== null);
            if (!isMatch && !isDir) return; 
        }
        // -----------------------------

        // ... (Keep the rest of the code: const isFolder = ..., const node = ...)

        const isFolder = (typeof value === 'object' && value !== null);
        const node = document.createElement('div');
        node.className = 'explorer-node';
        node.setAttribute('draggable', !isFolder); 

        // --- LABEL CLEANUP ---
        let displayLabel = String(key);
        if (isArray && typeof value === 'string' && value.startsWith('http')) {
            try { displayLabel = new URL(value).hostname.replace('www.', ''); } catch(e) { displayLabel = "LINK"; }
        } else if (displayLabel.startsWith('vault_') || displayLabel.startsWith('folder_')) {
            displayLabel = displayLabel.split('_').slice(2).join('_');
        }
        if (displayLabel.length > 22) displayLabel = displayLabel.substring(0, 19) + '...';

        // --- ICON & TYPE LOGIC (UPDATED) ---
        let icon = '📄'; 
        let fileType = 'text'; // Default type
        
        if (isFolder) {
            icon = '📁';
            fileType = 'folder';
        } else if (isArray && typeof value === 'string' && value.startsWith('http')) {
            icon = '🔗';
            fileType = 'link';
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

        node.innerHTML = `
            <div class="explorer-icon">${icon}</div>
            <div class="explorer-label">${displayLabel}</div>
        `;

        // --- DRAG START ---
        if (!isFolder) {
            node.ondragstart = (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', key); 
                node.style.opacity = '0.4';
            };
            node.ondragend = () => { node.style.opacity = '1'; };
        }

        // --- DROP TARGET ---
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

        // --- CLICK HANDLER (Updated to use fileType) ---
        node.onclick = () => {
            if (window.isExplorerDeleteMode) {
                if (confirm(`PURGE: ${displayLabel}?`)) {
                    if (isArray) currentData.splice(key, 1);
                    else delete currentData[key];

                    if (viewDepth === 0) {
                        chrome.storage.local.remove(key, () => { renderExplorerGrid(); updateStorageUI(); });
                    } else {
                        const parentData = explorerStack[viewDepth - 1];
                        let folderKey = null;
                        for (const k in parentData) { if (parentData[k] === currentData) { folderKey = k; break; } }
                        
                        if (folderKey) chrome.storage.local.set({ [folderKey]: currentData }, () => { renderExplorerGrid(); updateStorageUI(); });
                        else if (explorerPath[viewDepth] === 'userNavLinks') chrome.storage.local.set({ userNavLinks: currentData }, () => { renderExplorerGrid(); updateStorageUI(); });
                        else chrome.storage.local.get(null, (updated) => { explorerDataCache = updated; explorerStack[0] = updated; renderExplorerGrid(); });
                    }
                }
            } else {
                if (isFolder) {
                    explorerStack.push(value); 
                    explorerPath.push(displayLabel);
                    renderExplorerGrid();
                } else if (typeof value === 'string' && value.startsWith('http')) {
                    window.open(value, '_blank');
                } else {
                    // Send the detected fileType (video, audio, etc) to the previewer
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
        // --- FIX: Increased Visual Quota to 1GB ---
        // 1GB = 1024 * 1024 * 1024 bytes
        const totalQuota = 1073741824; 
        
        const usedMB = (bytes / (1024 * 1024)).toFixed(2);
        // Calculate percentage, maxing out at 100% visually
        const percent = Math.min((bytes / totalQuota) * 100, 100).toFixed(1);
        
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

function moveFileToFolder(fileKey, folderKey) {
    if (folderKey === 'userNavLinks') {
        showZionMessage("ACCESS DENIED: SYSTEM DIRECTORY.\nTHIS FOLDER ACCEPTS LINKS ONLY.");
        return;
    }

    // Fetch all data
    chrome.storage.local.get(null, (allData) => {
        const fileData = allData[fileKey];
        
        // --- FIX: Check for undefined specifically (allows empty files) ---
        if (fileData === undefined) {
            showZionMessage("SYSTEM OUT OF SYNC.\nREFRESHING DATA...");
            // Force refresh to clear real ghost files
            chrome.storage.local.get(null, (updated) => {
                explorerDataCache = updated;
                explorerStack[0] = updated; 
                renderExplorerGrid();
            });
            return;
        }

        let folderData = allData[folderKey];
        
        // Ensure folder is valid
        if (!folderData || typeof folderData !== 'object' || Array.isArray(folderData)) {
            folderData = {};
        }

        // Add file to folder
        folderData[fileKey] = fileData;

        // 1. Update Folder
        chrome.storage.local.set({ [folderKey]: folderData }, () => {
            // 2. Delete Original File
            chrome.storage.local.remove(fileKey, () => {
                showZionMessage("RELOCATION COMPLETE");
                
                // 3. Refresh Root
                chrome.storage.local.get(null, (updated) => {
                    explorerDataCache = updated;
                    explorerStack[0] = updated; 
                    renderExplorerGrid();
                });
            });
        });
    });
}

function showExplorerPreview(key, value, type) {
    const previewOverlay = document.createElement('div');
    previewOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:11000; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(5px);";
    
    const cleanTitle = (key.startsWith('vault_') || key.startsWith('folder_')) 
        ? key.split('_').slice(2).join('_') : key;

    let contentHtml = '';
    
    // --- UPDATED IMAGE PREVIEW WITH EDIT BUTTON LOGIC ---
    if (type === 'image') {
        contentHtml = `
            <div style="display:flex; justify-content:center; align-items:center; width:100%; height:100%; min-height:300px; overflow:hidden;">
                <img src="${value}" style="max-width:100%; max-height:60vh; object-fit:contain; border: 1px solid var(--theme-color); box-shadow: 0 0 15px rgba(0,242,255,0.2);">
            </div>`;
    } 
    // ---------------------------------------------------
    else if (type === 'video') {
        contentHtml = `
            <div style="display:flex; justify-content:center; align-items:center; width:100%; height:100%; min-height:300px;">
                <video src="${value}" controls autoplay style="max-width:100%; max-height:60vh; border: 1px solid var(--theme-color); box-shadow: 0 0 15px rgba(0,242,255,0.2);"></video>
            </div>`;
    } else if (type === 'audio') {
        contentHtml = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; width:100%; padding: 40px; border: 1px solid rgba(0,242,255,0.1); background:rgba(0,0,0,0.5);">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎵</div>
                <audio src="${value}" controls style="width:100%; max-width:500px;"></audio>
            </div>`;
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
        const sanitizedText = textContent.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        contentHtml = `
            <div style="color:var(--theme-color); font-family:monospace; white-space:pre-wrap; max-height:50vh; overflow:auto; padding:15px; background:rgba(0,0,0,0.5); border: 1px solid rgba(0,242,255,0.1); width: 100%;">
                ${sanitizedText}
            </div>`;
    }

    previewOverlay.innerHTML = `
        <div style="background:#000; padding:20px; border: 1px solid var(--theme-color); width: 85vw; max-width: 900px; display: flex; flex-direction: column; gap: 15px; border-radius: 4px; box-shadow: 0 0 30px rgba(0,242,255,0.15);">
            <div style="font-family:'Orbitron'; color:var(--theme-color); border-bottom: 1px solid rgba(0,242,255,0.3); padding-bottom: 10px; font-size: 1rem; display:flex; justify-content:space-between; align-items:center;">
                <span>FILE: ${cleanTitle.toUpperCase()}</span>
                <span style="font-size:0.7em; opacity:0.7; border:1px solid var(--theme-color); padding:2px 6px; border-radius:2px;">${type ? type.toUpperCase() : 'UNKNOWN'}</span>
            </div>
            
            ${contentHtml}
            
            <div style="display:flex; justify-content:flex-end; gap:15px; margin-top:10px;">
                ${type === 'image' ? `<button id="edit-paint-btn" style="background:rgba(0,255,65,0.2); color:var(--theme-color); border:1px solid var(--theme-color); padding:8px 25px; cursor:pointer; font-weight:bold; border-radius:2px; font-family:'Courier New'; letter-spacing:1px; transition: all 0.2s;">EDIT IN PAINT</button>` : ''}
                <button id="extract-btn" style="background:var(--theme-color); color:#000; border:none; padding:8px 25px; cursor:pointer; font-weight:bold; border-radius:2px; font-family:'Courier New'; letter-spacing:1px; transition: all 0.2s;">DOWNLOAD</button>
                <button id="close-preview-btn" style="background:transparent; color:var(--theme-color); border:1px solid var(--theme-color); padding:8px 25px; cursor:pointer; font-weight:bold; border-radius:2px; font-family:'Courier New'; letter-spacing:1px; transition: all 0.2s;">CLOSE</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(previewOverlay);
    
    // Add hover effects for buttons
    const btns = previewOverlay.querySelectorAll('button');
    btns.forEach(btn => {
        btn.onmouseover = () => { btn.style.boxShadow = "0 0 10px var(--theme-color)"; btn.style.opacity = "1"; };
        btn.onmouseout = () => { btn.style.boxShadow = "none"; btn.style.opacity = "0.9"; };
    });

    document.getElementById('extract-btn').onclick = () => extractVaultData(cleanTitle, value);
    document.getElementById('close-preview-btn').onclick = () => previewOverlay.remove();

    // LINK TO STANDALONE PAINT.JS APP
    const editBtn = document.getElementById('edit-paint-btn');
    if(editBtn) {
        editBtn.onclick = () => {
            previewOverlay.remove();
            // This calls the function in your new paint.js file
            if(window.PaintApp && window.PaintApp.loadImage) {
                window.PaintApp.loadImage(value, key);
            } else {
                showZionMessage("ERROR: PAINT MODULE NOT LOADED");
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
            
            // --- ADD THESE OVERRIDES ---
            scanContainer.style.display = 'block'; // Change from inline-block to block
            scanContainer.style.width = '100%';    // Force full width of the terminal frame
            scanContainer.style.maxWidth = '100%'; // Ensure it doesn't overflow
            scanContainer.style.padding = '0';     // Optional: remove padding if it looks too bulky
            // ---------------------------

            const img = document.createElement('img');
            img.src = post.url;
            img.className = 'terminal-media';
            img.style.width = '100%'; // Ensure the image fills the container

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

            // 1. REPLAY BUTTON
            const btnReplay = createButton('⟳', () => {
                vid.currentTime = 0;
                vid.play();
            });
            btnReplay.title = "Replay Transmission";

            // 2. DOWNLOAD BUTTON (Using the working Blob method)
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

            // 3. EXACT AUDIO LOGIC (From script.js lines 1018-1025)
            const btnVol = createButton('🔇', () => {
                vid.muted = !vid.muted;
                if (!vid.muted) vid.play().catch(() => {}); // Exact logic from line 1022
                btnVol.innerHTML = vid.muted ? '🔇' : '🔊'; // Exact logic from line 1023
                btnVol.style.boxShadow = vid.muted ? 'none' : '0 0 10px var(--theme-color)'; // Exact logic from line 1024
            });
            btnVol.title = "Toggle Audio Stream";

            // 4. FULLSCREEN BUTTON
            const btnFull = createButton('⛶', () => toggleFullscreen(vid));
            btnFull.title = "Maximize Visual";

            // Order: Replay, Download, Mute, Fullscreen
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

async function openTunnelGame() {
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
    
    await streamText(output, "> INITIALIZING TUNNEL RECONNAISSANCE SIMULATION...\n> ESTABLISHING SECURE CONNECTION...\n");

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
    wrapper.style.height = '61vh'; 
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 

    // Iframe
    const iframe = document.createElement('iframe');
    
    // --- THIS IS THE FIX ---
    // We point to the local file using chrome.runtime.getURL
    iframe.src = chrome.runtime.getURL("Games/game.html");
    
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.allow = "autoplay; gamepad; fullscreen; accelerometer; encrypted-media; gyroscope; picture-in-picture";
    
    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);

    input.focus();
    await streamText(output, `> SIMULATION LOADED. PREPARE FOR ENTRY.\n`);
}
async function openMatrixRampageGame() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;
    
    input.placeholder = "Type 'exit' to close...";

    // Purge previous
    purgeTerminalMedia();

    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null;
    
    initTerminalRain();
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    
    await streamText(output, "> LOADING COMBAT TRAINING PROGRAM: RELOADED...\n> ACCESSING MAINFRAME...\n");

    const frame = createMediaFrame(); 
    frame.style.width = "100%";
    frame.style.maxWidth = "100%";
    frame.style.boxSizing = "border-box";
    frame.style.marginTop = "5px"; 
    frame.style.marginBottom = "5px";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    wrapper.style.position = 'relative'; 
    wrapper.style.width = '100%';
    wrapper.style.height = '61vh'; // Matching our perfected height
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 
    wrapper.style.overflow = 'hidden'; // Prevents bottom leaking
    wrapper.style.borderRadius = '2px';

    const iframe = document.createElement('iframe');
    
    // --- LOCAL LINK FIX ---
    iframe.src = chrome.runtime.getURL("Games/rampage.html");
    
    iframe.style.width = "100%";
    iframe.style.height = "109%";
    iframe.style.border = "none";
    iframe.style.display = "block";
    iframe.allow = "autoplay; gamepad; fullscreen; accelerometer; encrypted-media; gyroscope; picture-in-picture";
    
    addFullscreenOverlay(wrapper, iframe);

    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);

    input.focus();
    await streamText(output, `> PROGRAM READY. FREE YOUR MIND.\n`);
}

async function openMatrixPandemoniumGame() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;
    
    input.placeholder = "Type 'exit' to close...";

    // Purge previous
    purgeTerminalMedia();

    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null;
    
    initTerminalRain();
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    
    await streamText(output, "> LOADING COMBAT TRAINING PROGRAM: RELOADED...\n> ACCESSING MAINFRAME...\n");

    const frame = createMediaFrame(); 
    frame.style.width = "100%";
    frame.style.maxWidth = "100%";
    frame.style.boxSizing = "border-box";
    frame.style.marginTop = "5px"; 
    frame.style.marginBottom = "5px";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    wrapper.style.position = 'relative'; 
    wrapper.style.width = '100%';
    wrapper.style.height = '61vh'; // Matching our perfected height
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 
    wrapper.style.overflow = 'hidden'; // Prevents bottom leaking
    wrapper.style.borderRadius = '2px';

    const iframe = document.createElement('iframe');
    
    // --- LOCAL LINK FIX ---
    iframe.src = chrome.runtime.getURL("Games/pandemonium.html");
    
    iframe.style.width = "100%";
    iframe.style.height = "109%";
    iframe.style.border = "none";
    iframe.style.display = "block";
    iframe.allow = "autoplay; gamepad; fullscreen; accelerometer; encrypted-media; gyroscope; picture-in-picture";

    addFullscreenOverlay(wrapper, iframe);

    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);

    input.focus();
    await streamText(output, `> PROGRAM READY. FREE YOUR MIND.\n`);
}
    async function openCitizensOfZionGame() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;
    
    input.placeholder = "Type 'exit' to close...";

    // Purge previous
    purgeTerminalMedia();

    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null;
    
    initTerminalRain();
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    
    await streamText(output, "> LOADING COMBAT TRAINING PROGRAM: RELOADED...\n> ACCESSING MAINFRAME...\n");

    const frame = createMediaFrame(); 
    frame.style.width = "100%";
    frame.style.maxWidth = "100%";
    frame.style.boxSizing = "border-box";
    frame.style.marginTop = "5px"; 
    frame.style.marginBottom = "5px";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    wrapper.style.position = 'relative'; 
    wrapper.style.width = '100%';
    wrapper.style.height = '61vh'; // Matching our perfected height
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 
    wrapper.style.overflow = 'hidden'; // Prevents bottom leaking
    wrapper.style.borderRadius = '2px';

    const iframe = document.createElement('iframe');
    
    // --- LOCAL LINK FIX ---
    iframe.src = chrome.runtime.getURL("Games/citizensofzion.html");
    
    iframe.style.width = "100%";
    iframe.style.height = "103%";
    iframe.style.border = "none";
    iframe.style.display = "block";
    iframe.allow = "autoplay; gamepad; fullscreen; accelerometer; encrypted-media; gyroscope; picture-in-picture";

    addFullscreenOverlay(wrapper, iframe);


    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);

    input.focus();
    await streamText(output, `> PROGRAM READY. FREE YOUR MIND.\n`);
}

async function openDockDefenceGame() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;
    
    input.placeholder = "Type 'exit' to close...";

    // Purge previous
    purgeTerminalMedia();

    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null;
    
    initTerminalRain();
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    
    await streamText(output, "> LOADING COMBAT TRAINING PROGRAM: RELOADED...\n> ACCESSING MAINFRAME...\n");

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
    wrapper.style.height = '61vh'; // Matching our perfected height
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 
    wrapper.style.overflow = 'hidden'; // Prevents bottom leaking
    wrapper.style.borderRadius = '2px';

    const iframe = document.createElement('iframe');
    
    // --- LOCAL LINK FIX ---
    iframe.src = chrome.runtime.getURL("Games/dockdefence.html");
    
    iframe.style.width = "100%";
    iframe.style.height = "103%";
    iframe.style.border = "none";
    iframe.style.display = "block";
    iframe.allow = "autoplay; gamepad; fullscreen; accelerometer; encrypted-media; gyroscope; picture-in-picture";

    addFullscreenOverlay(wrapper, iframe);

    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);

    input.focus();
    await streamText(output, `> PROGRAM READY. FREE YOUR MIND.\n`);
}

async function openMatrixOverloadedGame() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;
    
    input.placeholder = "Type 'exit' to close...";

    // Purge previous
    purgeTerminalMedia();

    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null;
    
    initTerminalRain();
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    
    await streamText(output, "> LOADING COMBAT TRAINING PROGRAM: RELOADED...\n> ACCESSING MAINFRAME...\n");

    const frame = createMediaFrame(); 
    frame.style.width = "100%";
    frame.style.maxWidth = "100%";
    frame.style.boxSizing = "border-box";
    frame.style.marginTop = "5px"; 
    frame.style.marginBottom = "5px";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    wrapper.style.position = 'relative'; 
    wrapper.style.width = '100%';
    wrapper.style.height = '61vh'; // Matching our perfected height
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 
    wrapper.style.overflow = 'hidden'; // Prevents bottom leaking
    wrapper.style.borderRadius = '2px';

    const iframe = document.createElement('iframe');
    
    // --- LOCAL LINK FIX ---
    iframe.src = chrome.runtime.getURL("Games/overloaded.html");
    
    iframe.style.width = "100%";
    iframe.style.height = "103%";
    iframe.style.border = "none";
    iframe.style.display = "block";
    iframe.allow = "autoplay; gamepad; fullscreen; accelerometer; encrypted-media; gyroscope; picture-in-picture";

    addFullscreenOverlay(wrapper, iframe);

    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);

    input.focus();
    await streamText(output, `> PROGRAM READY. FREE YOUR MIND.\n`);
}

async function openMatrixRampage2Game() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;
    
    input.placeholder = "Type 'exit' to close...";
    purgeTerminalMedia();

    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null;
    
    initTerminalRain();
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    
    await streamText(output, "> LOADING COMBAT TRAINING PROGRAM: RAMPAGE V2...\n> ACCESSING MAINFRAME...\n");

    // --- CROP CONFIGURATION ---
    // This controls how much is cut off from the BOTTOM.
    // Increase if you still see the ad (e.g., "80px").
    const cutAmount = "35px"; 
    // --------------------------

    const frame = createMediaFrame(); 
    frame.style.width = "100%";
    frame.style.maxWidth = "100%";
    frame.style.boxSizing = "border-box";
    frame.style.marginTop = "5px"; 
    frame.style.marginBottom = "5px";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    wrapper.style.position = 'relative'; 
    wrapper.style.width = '100%';
    wrapper.style.height = '61vh'; 
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 
    wrapper.style.overflow = 'hidden'; 
    wrapper.style.borderRadius = '2px';

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL("Games/rampage2.html");
    
    // --- THE BOTTOM CROP LOGIC ---
    iframe.style.width = "100%";
    
    // 1. Make the iframe taller (Game + Ad area)
    iframe.style.height = `calc(100% + ${cutAmount})`; 
    
    // 2. Ensure the top stays aligned (The extra height spills off the bottom)
    iframe.style.marginTop = "0px";
    iframe.style.border = "none";
    iframe.style.display = "block";
    iframe.allow = "autoplay; gamepad; fullscreen; accelerometer; encrypted-media; gyroscope; picture-in-picture";

    addFullscreenOverlay(wrapper, iframe);

    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);

    input.focus();
    await streamText(output, `> PROGRAM READY. FREE YOUR MIND.\n`);
}

async function openMatrixBulletTimeGame() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;
    
    input.placeholder = "Type 'exit' to close...";
    purgeTerminalMedia();

    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null;
    
    initTerminalRain();
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    
    await streamText(output, "> LOADING COMBAT TRAINING PROGRAM: RAMPAGE V2...\n> ACCESSING MAINFRAME...\n");

    // --- CROP CONFIGURATION ---
    // This controls how much is cut off from the BOTTOM.
    // Increase if you still see the ad (e.g., "80px").
    const cutAmount = "35px"; 
    // --------------------------

    const frame = createMediaFrame(); 
    frame.style.width = "100%";
    frame.style.maxWidth = "100%";
    frame.style.boxSizing = "border-box";
    frame.style.marginTop = "5px"; 
    frame.style.marginBottom = "5px";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    wrapper.style.position = 'relative'; 
    wrapper.style.width = '100%';
    wrapper.style.height = '61vh'; 
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 
    wrapper.style.overflow = 'hidden'; 
    wrapper.style.borderRadius = '2px';

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL("Games/bullettime.html");
    
    // --- THE BOTTOM CROP LOGIC ---
    iframe.style.width = "100%";
    
    // 1. Make the iframe taller (Game + Ad area)
    iframe.style.height = `calc(100% + ${cutAmount})`; 
    
    // 2. Ensure the top stays aligned (The extra height spills off the bottom)
    iframe.style.marginTop = "0px";
    iframe.style.border = "none";
    iframe.style.display = "block";
    iframe.allow = "autoplay; gamepad; fullscreen; accelerometer; encrypted-media; gyroscope; picture-in-picture";

    addFullscreenOverlay(wrapper, iframe);

    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);

    input.focus();
    await streamText(output, `> PROGRAM READY. FREE YOUR MIND.\n`);
}

async function openMatrixFighterGame() {
    const modal = document.getElementById('matrix-modal');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-cmd-input');

    if (!modal || !output || !input) return;
    
    input.placeholder = "Type 'exit' to close...";
    purgeTerminalMedia();

    modal.classList.remove('hidden');
    output.innerHTML = "";
    input.value = "";
    terminalCurrentData = null;
    
    initTerminalRain();
    window.addEventListener('resize', initTerminalRain);
    initTerminalCursor();
    
    await streamText(output, "> LOADING COMBAT TRAINING PROGRAM: RAMPAGE V2...\n> ACCESSING MAINFRAME...\n");

    // --- CROP CONFIGURATION ---
    // This controls how much is cut off from the BOTTOM.
    // Increase if you still see the ad (e.g., "80px").
    const cutAmount = "0px"; 
    // --------------------------

    const frame = createMediaFrame(); 
    frame.style.width = "100%";
    frame.style.maxWidth = "100%";
    frame.style.boxSizing = "border-box";
    frame.style.marginTop = "5px"; 
    frame.style.marginBottom = "5px";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    wrapper.style.position = 'relative'; 
    wrapper.style.width = '100%';
    wrapper.style.height = '61vh'; 
    wrapper.style.minHeight = '300px'; 
    wrapper.style.backgroundColor = '#000'; 
    wrapper.style.overflow = 'hidden'; 
    wrapper.style.borderRadius = '2px';

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL("Games/matrixfighter.html");
    
    // --- THE BOTTOM CROP LOGIC ---
    iframe.style.width = "100%";
    
    // 1. Make the iframe taller (Game + Ad area)
    iframe.style.height = `calc(100% + ${cutAmount})`; 
    
    // 2. Ensure the top stays aligned (The extra height spills off the bottom)
    iframe.style.marginTop = "0px";
    iframe.style.border = "none";
    iframe.style.display = "block";
    iframe.allow = "autoplay; gamepad; fullscreen; accelerometer; encrypted-media; gyroscope; picture-in-picture";

    addFullscreenOverlay(wrapper, iframe);

    wrapper.appendChild(iframe);
    frame.appendChild(wrapper);
    output.appendChild(frame);

    input.focus();
    await streamText(output, `> PROGRAM READY. FREE YOUR MIND.\n`);
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
        currentImageAttachment = null; 
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
                        userEntry.innerHTML = `<div class="user-query">${rawInput}</div>`;
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
                                loadMsg.innerHTML = `<div class="oracle-response-container"><div class="oracle-response-text encrypted">Generating Visual...</div></div>`;
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

// --- ADVANCED WORDPAD LOGIC ---
const codeToggle = document.getElementById('code-mode-toggle');
const wordpadFrame = document.querySelector('.wordpad-frame');
const editor = document.getElementById('wordpad-editor');

codeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        wordpadFrame.classList.add('coding-mode');
        editor.placeholder = "// Initialize Zion Coding Environment...\n// Root access granted.\nfunction matrix() {\n  return 'Free your mind';\n}";
        showZionMessage("NEURAL LINK ESTABLISHED: CODING ENV ACTIVE");
    } else {
        wordpadFrame.classList.remove('coding-mode');
        editor.placeholder = "Initialize data stream...";
        showZionMessage("NEURAL LINK SEVERED: WORDPAD ACTIVE");
    }
});

// --- NEURAL HISTORY LOGIC ---
const historyBtn = document.getElementById('neural-history-btn');

// Show/Hide History button based on Neural Link
codeToggle.addEventListener('change', (e) => {
    historyBtn.style.display = e.target.checked ? 'block' : 'none';
});

// Save Logic: Save with 'hack_' prefix for easy filtering
const originalSaveBtn = document.getElementById('save-wordpad-btn');
originalSaveBtn.onclick = () => {
    const text = wordpadEditor.value;
    const isCode = codeToggle.checked;
    const prefix = isCode ? "hack_" : "vault_";
    const filename = isCode ? "reality_override.js" : "document.txt";
    
    // Convert to data URL for storage
    const blob = new Blob([text], {type: isCode ? 'application/javascript' : 'text/plain'});
    const reader = new FileReader();
    reader.onload = (e) => {
        const key = `${prefix}${Date.now()}_${filename}`;
        chrome.storage.local.set({ [key]: e.target.result }, () => {
            showZionMessage(isCode ? "HACK SAVED TO NEURAL HISTORY" : "DATA STREAM SAVED TO ROOT");
        });
    };
    reader.readAsDataURL(blob);
};

// History Button: Opens Explorer pre-filtered for hacks
historyBtn.onclick = () => {
    openRootExplorer("hack_");
    showZionMessage("ACCESSING NEURAL HISTORY...");
};

// Added Tab Key support for coding
editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && wordpadFrame.classList.contains('coding-mode')) {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
    }
});

// --- OPERATOR CODE EXECUTION ENGINE ---
const runBtn = document.getElementById('execute-code-btn');

// 1. Show/Hide Run button based on Neural Link toggle
document.getElementById('code-mode-toggle').addEventListener('change', (e) => {
    if (e.target.checked) {
        // Force visual visibility when active
        runBtn.style.display = 'block';
        runBtn.style.background = 'rgba(0, 0, 0, 0.6)'; // Dark visible background
        runBtn.style.color = 'var(--theme-color)';     // Glowing text
        runBtn.style.border = '1px solid var(--theme-color)'; // Clear border
        runBtn.style.padding = '2px 10px';
        runBtn.style.fontWeight = 'bold';
    } else {
        runBtn.style.display = 'none';
    }
});

// --- OPERATOR RUN LOGIC (SANDBOXED) ---
runBtn.addEventListener('click', () => {
    const code = wordpadEditor.value;
    if (!code.trim()) return;

    if (isChatEnabled) {
        const log = document.getElementById('chat-log');
        const d = document.createElement('div');
        d.className = 'chat-msg';
        d.innerHTML = `<b class="morpheus">SYSTEM:</b> Passing signal to Sandbox...`;
        log.appendChild(d);
        log.scrollTop = log.scrollHeight;
    }

    // Transmit code string to sandbox
    sandboxFrame.contentWindow.postMessage({ 
        code: code, 
        taskId: 'operator-exec' 
    }, '*');

    showZionMessage("SIGNAL TRANSMITTED\nAWAITING SANDBOX VALIDATION...");
});
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
    } else if (gameName === 'rampage2') { // <--- THIS WAS MISSING
        openMatrixRampage2Game();
    } else if (gameName === 'bullettime') { // <--- THIS WAS MISSING
        openMatrixBulletTimeGame();
    } else if (gameName === 'matrixfighter') { // <--- THIS WAS MISSING
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

// --- NEW EXPLORER CONTROLS (UPLOAD & PURGE) ---
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

    // 2. PURGE BUTTON
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