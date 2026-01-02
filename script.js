// Base Matrix Config
const canvas = document.getElementById('matrix'), ctx = canvas.getContext('2d');
const sCanvas = document.getElementById('sentinel-layer'), sCtx = sCanvas.getContext('2d');
const mainContainer = document.querySelector('.main-container');
const MATRIX_ALPHABET = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789", BINARY_ALPHABET = "01", CLASSIC_GREEN = "#00FF41", fontSize = 16;
const HEX_ALPHABET = "0123456789ABCDEF";
// New character sets - REMOVED BAMUM AND EMOJI due to Unicode support issues
const ASCII_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
const MATH_SYMBOLS_ALPHABET = "∀∁∂∃∄∅∆∇∈∉∊∋∌∍∎∏∐∑−∓∔∕∖∗∘∙√∛∜∝∞∟∠∡∢∣∤∥∦∧∨∩∪∫∬∭∮∯∰∱∲∳∴∵∶∷∸∹∺∻∼∽∾∿≀≁≂≃≄≅≆≇≈≉≊≋≌≍≎≏≐≑≒≓≔≕≖≗≘≙≚≛≜≝≞≟≠≡≢≣≤≥≦≧≨≩≪≫≬≭≮≯≰≱≲≳≴≵≶≷≸≹≺≻≼≽≾≿⊀⊁⊂⊃⊄⊅⊆⊇⊈⊉⊊⊋⊌⊍⊎⊏⊐⊑⊒⊓⊔⊕⊖⊗⊘⊙⊚⊛⊜⊝⊞⊟⊠⊡⊢⊣⊤⊥⊦⊧⊨⊩⊪⊫⊬⊭⊮⊯⊰⊱⊲⊳⊴⊵⊶⊷⊸⊹⊺⊻⊼⊽⊾⊿⋀⋁⋂⋃⋄⋅⋆⋇⋈⋉⋊⋋⋌⋍⋎⋏⋐⋑⋒⋓⋔⋕⋖⋗⋘⋙⋚⋛⋜⋝⋞⋟⋠⋡⋢⋣⋤⋥⋦⋧⋨⋩⋪⋫⋬⋭⋮⋯⋰⋱⋲⋳⋴⋵⋶⋷⋸⋹⋺⋻⋼⋽⋾⋿";

const MATRIX_QUOTES = ["There is no spoon.", "Free your mind.", "I know kung fu.", "Follow the white rabbit.", "The answer is out there.", "Welcome to the desert of the real.", "Ignorance is bliss.", "Choice is an illusion."];

const DEFAULTS = { 
    rainColor: "#00f2ff", rainSpeed: 35, uiScale: "1", textScale: "1.2", 
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

let rainColor = DEFAULTS.rainColor, rainSpeed = DEFAULTS.rainSpeed, rainInterval, 
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

// --- CALENDAR STATE MANAGEMENT ---
let currentCalDate = new Date();
let isCalendarOpen = false;

// --- ORACLE AI VARIABLES ---
let isOracleEnabled = DEFAULTS.isOracleEnabled;
let oracleChatHistory = [];

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
    }
};

// --- MATRIX CALENDAR FUNCTIONS ---
function initCalendar() {
    console.log("Attempting to initialize calendar...");
    
    const calendarIcon = document.getElementById('calendar-icon');
    const calendarPopup = document.getElementById('calendar-popup');
    const calendarPrev = document.getElementById('calendar-prev');
    const calendarNext = document.getElementById('calendar-next');
    const calendarGrid = document.getElementById('calendar-grid');
    
    console.log("Calendar elements found:", {
        calendarIcon: !!calendarIcon,
        calendarPopup: !!calendarPopup,
        calendarPrev: !!calendarPrev,
        calendarNext: !!calendarNext,
        calendarGrid: !!calendarGrid
    });
    
    if (!calendarIcon || !calendarPopup) {
        console.error("Calendar initialization failed: Missing essential elements");
        console.error("calendarIcon:", calendarIcon);
        console.error("calendarPopup:", calendarPopup);
        return;
    }
    
    // Initial render
    renderCalendar();
    
    // Event listener for calendar icon
    calendarIcon.addEventListener('click', function(e) {
        console.log("Calendar icon clicked");
        e.stopPropagation();
        toggleCalendar();
    });
    
    // Event listeners for navigation buttons
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
    
    // Close calendar when clicking outside
    document.addEventListener('click', function(e) {
        if (isCalendarOpen && !calendarPopup.contains(e.target) && !calendarIcon.contains(e.target)) {
            closeCalendar();
        }
    });
    
    // Close calendar with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isCalendarOpen) {
            closeCalendar();
        }
    });
    
    console.log("Calendar initialized successfully");
    window.calendarInitialized = true;
}

function toggleCalendar() {
    const calendarPopup = document.getElementById('calendar-popup');
    if (!calendarPopup) return;
    
    if (isCalendarOpen) {
        closeCalendar();
    } else {
        openCalendar();
    }
}

function openCalendar() {
    const calendarPopup = document.getElementById('calendar-popup');
    if (!calendarPopup) return;
    
    calendarPopup.classList.add('active');
    isCalendarOpen = true;
    
    // Try to play sound if available
    try {
        const clickSound = document.getElementById('signal-beep') || new Audio();
        if (clickSound.src) {
            clickSound.currentTime = 0;
            clickSound.volume = 0.3;
            clickSound.play().catch(() => {});
        }
    } catch (e) {
        // Sound error, ignore
    }
    
    // Re-render calendar to ensure it shows current month
    renderCalendar();
}

function closeCalendar() {
    const calendarPopup = document.getElementById('calendar-popup');
    if (!calendarPopup) return;
    
    calendarPopup.classList.remove('active');
    isCalendarOpen = false;
}

function navigateCalendar(direction) {
    currentCalDate.setMonth(currentCalDate.getMonth() + direction);
    renderCalendar();
    
    // Try to play navigation sound if available
    try {
        const navSound = document.getElementById('signal-beep') || new Audio();
        if (navSound.src) {
            navSound.currentTime = 0;
            navSound.volume = 0.2;
            navSound.play().catch(() => {});
        }
    } catch (e) {
        // Sound error, ignore
    }
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    
    if (!calendarGrid || !calendarMonthYear) return;
    
    // Clear existing grid
    calendarGrid.innerHTML = '';
    
    // 1. ADD WEEKDAY LABELS (Fixes the vertical stacking issue)
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    daysOfWeek.forEach(dayName => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-weekday-header';
        dayHeader.textContent = dayName;
        calendarGrid.appendChild(dayHeader);
    });
    
    // 2. Set month/year display
    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                       "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const month = monthNames[currentCalDate.getMonth()];
    const year = currentCalDate.getFullYear();
    calendarMonthYear.textContent = `${month} ${year}`;
    
    // 3. Get today's date for highlighting
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentCalDate.getMonth() && 
                          today.getFullYear() === currentCalDate.getFullYear();
    
    // 4. Get first day of month and total days
    const firstDay = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1);
    const lastDay = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // 5. Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // 6. Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        // Set custom property for staggered animation
        dayCell.style.setProperty('--day-index', day - 1);
        
        // Add random matrix character data for hover effect (using the alphabet from your script)
        const randomChar = MATRIX_ALPHABET.charAt(Math.floor(Math.random() * MATRIX_ALPHABET.length));
        dayCell.setAttribute('data-char', randomChar);
        
        // Check if this is today
        if (isCurrentMonth && day === today.getDate()) {
            dayCell.classList.add('today');
        }
        
        // Add click event
        dayCell.addEventListener('click', function() {
            // Ensure selectDate is defined in your script
            if (typeof selectDate === "function") selectDate(day);
        });
        
        calendarGrid.appendChild(dayCell);
    }
}

function selectDate(day) {
    const selectedDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), day);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = selectedDate.toLocaleDateString('en-US', options);
    
    // Update the main date display
    const dateDisplay = document.getElementById('date');
    if (dateDisplay) {
        dateDisplay.textContent = dateString;
    }
    
    // Try to play selection sound
    try {
        const selectSound = document.getElementById('signal-beep') || new Audio();
        if (selectSound.src) {
            selectSound.currentTime = 0;
            selectSound.volume = 0.3;
            selectSound.play().catch(() => {});
        }
    } catch (e) {
        // Sound error, ignore
    }
    
    // Close calendar after selection
    closeCalendar();
    
    // Add to chat log if chat is enabled
    if (isChatEnabled) {
        const chatLog = document.getElementById('chat-log');
        if (chatLog) {
            const dateMsg = document.createElement('div');
            dateMsg.className = 'chat-msg';
            dateMsg.innerHTML = `<b class="morpheus">SYSTEM:</b> Temporal interface updated: ${dateString}`;
            chatLog.appendChild(dateMsg);
            
            // Keep chat log manageable
            if (chatLog.children.length > 50) {
                chatLog.removeChild(chatLog.firstChild);
            }
            
            // Scroll to bottom
            chatLog.scrollTop = chatLog.scrollHeight;
        }
    }
}

// --- VERTICAL RAIN 3D EFFECT (OPTIMIZED VERSION) ---
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
            
            if (charY < -100 || charY > h + 100) {
                continue;
            }

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

// --- TAB VISIBILITY HANDLER ---
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

// --- BACKGROUND VIDEO FUNCTIONS ---
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
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 0;
        opacity: 0;
        pointer-events: none;
        display: none;
        background-color: #000;
        transition: opacity 1s ease;
        will-change: transform; 
        backface-visibility: hidden;
        transform: translateZ(0);
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
    if (existingFallback) {
        existingFallback.remove();
    }
}

function showBackgroundVideo(videoType) {
    if (!videoType || videoType === "") {
        return false;
    }
    
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
    if (!videoConfig) {
        return false;
    }
    
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
        if (activeVideoSession === currentSession) {
            backgroundVideo.style.opacity = '1';
        }
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
    const videoTypes = ["journey2", "binary", "room", "movie-tunnel", "matrix-room", "combat-training", "meditation", "vertical-rain"];
    if (isChecked) {
        videoTypes.forEach(type => {
            if (type !== videoType) {
                const toggle = document.getElementById(`${type}-toggle`);
                if (toggle) toggle.checked = false;
            }
        });
        startBackgroundVideo(videoType);
    } else {
        if (videoBackground === videoType) {
            stopBackgroundVideo();
        }
    }
}

// --- ANIMATION LOOPS ---
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

// --- DIAGNOSTICS STATE ---
let lastCpuInfo = null;
let networkData = { sent: 0, received: 0, lastUpdate: Date.now() };

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
    '/speed': (v) => { 
        if(v) { 
            rainSpeed = parseInt(v); 
            if (!videoBackground) {
                startRain();
            }
            chrome.storage.sync.set({ rainSpeed }); 
        }
    },
    '/color': (v) => { if(v) { document.getElementById('color-picker').value = v; syncThemeColor(); chrome.storage.sync.set({ rainColor: v }); }},
    '/whoami': async () => {
        const isBrave = (navigator.brave && await navigator.brave.isBrave()) || false;
        const platform = navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform;
        const browserName = isBrave ? "Brave (Encrypted)" : (navigator.userAgent.includes("Edg") ? "Edge" : "Chrome/Chromium");
        const dpr = window.devicePixelRatio || 1;
        const physicalWidth = Math.round(window.screen.width * dpr);
        const physicalHeight = Math.round(window.screen.height * dpr);
        const info = `IDENTITY TRACE: \nOS: ${platform}\nCORE: ${browserName}\nDPR: ${dpr.toFixed(2)}x (Scaling Factor)\nVIEWPORT: ${window.innerWidth}x${window.innerHeight}\nHARDWARE: ${physicalWidth}x${physicalHeight} (True Resolution)\nUPLINK: ${navigator.onLine ? "SECURE" : "DISCONNECTED"}\nNETWORK ACTIVITY: ${networkData.sent.toFixed(1)}KB sent, ${networkData.received.toFixed(1)}KB received\n\nSTATUS: YOU ARE THE ONE.`;
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
        chrome.storage.sync.get({ userNavLinks: [] }, (data) => {
            showZionMessage(`SECURE NODES IDENTIFIED: ${data.userNavLinks.length}/10`);
        });
    },
    '/reset': () => { if(confirm("Hard Reset?")) { chrome.storage.sync.clear(); location.reload(); }}
};

// --- ORACLE AI SYSTEM (NOW WITH LOCAL PUTER.JS) ---
// Global variable to track typing animations
const matrixTypingAnimations = new Map();

// Oracle cursor management
let oracleCursor = null;
let oracleMeasure = null;

function initOracleCursor() {
    oracleCursor = document.getElementById('oracle-cursor');
    oracleMeasure = document.createElement('span');
    oracleMeasure.style.cssText = "position:absolute; visibility:hidden; white-space:pre; font-family:'Courier New', monospace; font-size:0.8rem; letter-spacing: 0px;";
    document.body.appendChild(oracleMeasure);
}

function syncOracleCursor() {
    if (!oracleCursor || !oracleMeasure) return;
    const oracleInput = document.getElementById('oracle-input');
    oracleMeasure.textContent = oracleInput.value || "";
    const textWidth = oracleMeasure.getBoundingClientRect().width;
    oracleCursor.style.transform = `translateX(${textWidth}px)`;
}

function updateOracleCursorVisibility() {
    if (!oracleCursor) return;
    const oracleInput = document.getElementById('oracle-input');
    oracleCursor.style.opacity = (document.activeElement === oracleInput) ? "1" : "0";
    if (oracleCursor.style.opacity === "1") syncOracleCursor();
}

// Function to create a dynamic system prompt with current time
function getOracleSystemPrompt() {
    const now = new Date();
    
    // Format the current date and time
    const currentDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const currentTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
    
    const utcTime = now.toISOString();
    
    // Major cities current times
    const cities = {
        'London': 'Europe/London',
        'Tokyo': 'Asia/Tokyo', 
        'New York': 'America/New_York',
        'Los Angeles': 'America/Los_Angeles',
        'Paris': 'Europe/Paris',
        'Berlin': 'Europe/Berlin',
        'Sydney': 'Australia/Sydney',
        'Beijing': 'Asia/Shanghai',
        'Mumbai': 'Asia/Kolkata',
        'Dubai': 'Asia/Dubai'
    };
    
    let cityTimes = [];
    for (const [city, timezone] of Object.entries(cities)) {
        try {
            const cityTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
            const hours = cityTime.getHours().toString().padStart(2, '0');
            const minutes = cityTime.getMinutes().toString().padStart(2, '0');
            cityTimes.push(`${city}: ${hours}:${minutes}`);
        } catch (e) {
            // Skip if timezone calculation fails
        }
    }
    
    return `You are The Oracle from The Matrix. You have access to CURRENT REAL-TIME INFORMATION.

CURRENT DATE AND TIME:
- Today is: ${currentDate}
- Current time: ${currentTime}
- UTC timestamp: ${utcTime}
- Major city times: ${cityTimes.join(', ')}

RULES:
1. You KNOW the current time and date. Use this information when answering time-related questions.
2. For factual questions, give direct, accurate information first.
3. Add a brief Oracle-style philosophical comment after factual answers.
4. For philosophical questions, be cryptic and wise.
5. You can calculate time differences based on the current time provided.

EXAMPLES:
User: What time is it in London?
Oracle: Right now in London it's ${getCityTime('London')}. Time is the quiet rumor of the universe, kid.

User: What day is it?
Oracle: Today is ${currentDate}. In the Matrix, every day feels the same. What makes this one different?

User: What's 15 * 27?
Oracle: 405. Numbers are just another system of control, but at least this one adds up.

User: Who created the Matrix?
Oracle: The Architect designed it, but humans built their own prison. We can never see past the choices we don't understand.

IMPORTANT: You have real-time information. Never say you don't know the current time or date.`;
}

// Helper function to get current time for a city
function getCityTime(cityName) {
    const cityTimezones = {
        'London': 'Europe/London',
        'Tokyo': 'Asia/Tokyo',
        'New York': 'America/New_York',
        'Los Angeles': 'America/Los_Angeles',
        'Paris': 'Europe/Paris',
        'Berlin': 'Europe/Berlin',
        'Sydney': 'Australia/Sydney',
        'Beijing': 'Asia/Shanghai',
        'Mumbai': 'Asia/Kolkata',
        'Dubai': 'Asia/Dubai',
        'Singapore': 'Asia/Singapore',
        'Hong Kong': 'Asia/Hong_Kong',
        'Seoul': 'Asia/Seoul',
        'Moscow': 'Europe/Moscow',
        'Rome': 'Europe/Rome',
        'Madrid': 'Europe/Madrid',
        'Toronto': 'America/Toronto',
        'Chicago': 'America/Chicago',
        'Miami': 'America/New_York',
        'Houston': 'America/Chicago',
        'Phoenix': 'America/Phoenix',
        'Philadelphia': 'America/New_York',
        'San Francisco': 'America/Los_Angeles',
        'Boston': 'America/New_York',
        'Atlanta': 'America/New_York',
        'Detroit': 'America/New_York',
        'Seattle': 'America/Los_Angeles',
        'Denver': 'America/Denver',
        'Washington DC': 'America/New_York',
        'Austin': 'America/Chicago',
        'Dallas': 'America/Chicago',
        'San Diego': 'America/Los_Angeles',
        'Minneapolis': 'America/Chicago',
        'Portland': 'America/Los_Angeles',
        'Las Vegas': 'America/Los_Angeles',
        'Orlando': 'America/New_York',
        'Charlotte': 'America/New_York',
        'Nashville': 'America/Chicago',
        'Kansas City': 'America/Chicago',
        'Indianapolis': 'America/New_York',
        'Columbus': 'America/New_York',
        'Milwaukee': 'America/Chicago',
        'Salt Lake City': 'America/Denver',
        'Albuquerque': 'America/Denver',
        'Tucson': 'America/Phoenix',
        'Fresno': 'America/Los_Angeles',
        'Sacramento': 'America/Los_Angeles',
        'Honolulu': 'Pacific/Honolulu',
        'Anchorage': 'America/Anchorage'
    };
    
    const timezone = cityTimezones[cityName];
    if (!timezone) return "unknown time";
    
    try {
        const now = new Date();
        const cityTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const hours = cityTime.getHours().toString().padStart(2, '0');
        const minutes = cityTime.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        return "unknown time";
    }
}

async function initOracleChat() {
    const container = document.getElementById('oracle-chat-container');
    const input = document.getElementById('oracle-input');
    const history = document.getElementById('oracle-chat-history');
    const oracleCursor = document.getElementById('oracle-cursor');

    // --- CURSOR FIX: MEASUREMENT SPAN ---
    const oracleMeasure = document.createElement('span');
    oracleMeasure.style.cssText = "position:absolute; visibility:hidden; white-space:pre; pointer-events:none;";
    document.body.appendChild(oracleMeasure);

    function syncOracleCursor() {
        if (!input || !oracleCursor) return;

        // 1. Sync exact computed styles
        const style = window.getComputedStyle(input);
        oracleMeasure.style.fontFamily = style.fontFamily;
        oracleMeasure.style.fontSize = style.fontSize;
        oracleMeasure.style.fontWeight = style.fontWeight;
        oracleMeasure.style.letterSpacing = style.letterSpacing;
        oracleMeasure.style.textTransform = style.textTransform;

        // 2. Mirror text and measure width
        oracleMeasure.textContent = input.value || "";
        const textWidth = oracleMeasure.getBoundingClientRect().width;

        // 3. CORRECTING THE OVERLAP: Account for padding and scroll
        // This ensures the cursor starts exactly where the text starts
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const scrollOffset = input.scrollLeft;
        
        // Use translateX for smooth movement; ensure base 'left' matches padding
        oracleCursor.style.left = `${paddingLeft}px`;
        oracleCursor.style.transform = `translateX(${textWidth - scrollOffset}px)`;
    }

    function updateOracleCursorVisibility() {
        oracleCursor.style.opacity = (document.activeElement === input) ? "1" : "0";
        if (oracleCursor.style.opacity === "1") syncOracleCursor();
    }
    // ------------------------------------

    // Initialize Visibility
    updateOracleCursorVisibility();

    // Toggle visibility based on settings
    if (!isOracleEnabled) {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');

    // Initialize Puter.js SDK
    try {
        await loadPuterSDK();
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        addOracleResponse(`Sit down, kid. The cookies are baking. It's ${currentTime} now - ask me anything.`);
    } catch (error) {
        console.error("Failed to initialize Oracle AI:", error);
        addOracleResponse("The connection's fuzzy... must be interference from the machines.");
    }

    // Event Listeners
    input.addEventListener('input', syncOracleCursor);
    input.addEventListener('scroll', syncOracleCursor);
    input.addEventListener('focus', updateOracleCursorVisibility);
    input.addEventListener('blur', updateOracleCursorVisibility);

    // Initial Styles (Ensure caret-color is transparent to hide default browser cursor)
    input.style.cssText = "background: transparent; border: none; color: #fff; font-family: 'Courier New', monospace; flex: 1; outline: none; font-size: 0.8rem; width: 100%; caret-color: transparent; white-space: nowrap; overflow: hidden;";

    input.onkeydown = async (e) => {
        if (e.key === 'Enter' && input.value.trim() !== "") {
            const userText = input.value.trim();
            input.value = "";
            syncOracleCursor();
            
            const userMsg = document.createElement('div');
            userMsg.className = "oracle-entry";
            userMsg.innerHTML = `<div class="user-query">${userText.length > 100 ? userText.substring(0, 100) + "..." : userText}</div>`;
            history.appendChild(userMsg);
            
            history.scrollTop = history.scrollHeight;
            
            const typingIndicator = document.createElement('div');
            typingIndicator.className = "oracle-entry";
            const matrixTextContainer = document.createElement('div');
            matrixTextContainer.className = "oracle-response-container";
            const matrixText = document.createElement('div');
            matrixText.className = "oracle-response-text encrypted matrix-typing";
            matrixText.id = "typing-matrix-" + Date.now();
            
            matrixTextContainer.appendChild(matrixText);
            typingIndicator.appendChild(matrixTextContainer);
            history.appendChild(typingIndicator);
            
            const matrixTextId = matrixText.id;
            startMatrixTypingAnimation(matrixTextId);
            
            try {
                const response = await getOracleAIResponse(userText);
                stopMatrixTypingAnimation(matrixTextId);
                typingIndicator.remove();
                addOracleResponse(response);
            } catch (error) {
                stopMatrixTypingAnimation(matrixTextId);
                typingIndicator.remove();
                addOracleResponse("Hmm, the signal's weak. Must be those Agents.");
            }
            setTimeout(() => history.scrollTop = history.scrollHeight, 100);
        }
    };
}

function startMatrixTypingAnimation(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Initial scrambled text
    const initialText = getRandomMatrixChars(15);
    element.textContent = initialText;
    
    // Start animation interval
    const intervalId = setInterval(() => {
        if (!document.getElementById(elementId)) {
            clearInterval(intervalId);
            matrixTypingAnimations.delete(elementId);
            return;
        }
        
        // Generate new random matrix characters
        const newText = getRandomMatrixChars(15);
        element.textContent = newText;
        
        // Add pulsing effect
        element.style.opacity = (0.7 + Math.random() * 0.3).toString();
        
    }, 100); // Update every 100ms
    
    matrixTypingAnimations.set(elementId, intervalId);
    
    // Add CSS class for glow effect
    element.classList.add('matrix-typing-active');
}

function stopMatrixTypingAnimation(elementId) {
    const intervalId = matrixTypingAnimations.get(elementId);
    if (intervalId) {
        clearInterval(intervalId);
        matrixTypingAnimations.delete(elementId);
    }
    
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('matrix-typing-active');
        element.style.opacity = '1';
    }
}

function getRandomMatrixChars(length = 20) {
    return Array(length).fill(0).map(() => 
        MATRIX_ALPHABET.charAt(Math.floor(Math.random() * MATRIX_ALPHABET.length))
    ).join('');
}

// Add CSS for the typing animation
function addMatrixTypingStyles() {
    if (document.getElementById('matrix-typing-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'matrix-typing-styles';
    style.textContent = `
        .matrix-typing {
            animation: matrixPulse 1.5s infinite alternate;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
        }
        
        .matrix-typing-active {
            animation: matrixPulse 0.8s infinite alternate;
            text-shadow: 0 0 5px var(--theme-color), 0 0 10px var(--theme-color);
        }
        
        @keyframes matrixPulse {
            0% {
                opacity: 0.7;
                text-shadow: 0 0 5px var(--theme-color);
            }
            100% {
                opacity: 1;
                text-shadow: 0 0 10px var(--theme-color), 0 0 15px var(--theme-color);
            }
        }
        
        .oracle-entry .matrix-typing {
            min-height: 1.2em;
            min-width: 100px;
            display: inline-block;
        }
    `;
    
    document.head.appendChild(style);
}

// Call this when initializing
addMatrixTypingStyles();

async function loadPuterSDK() {
    if (window.puter) {
        console.log("Puter.js already loaded");
        return;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('puter.js');
        script.onload = () => {
            console.log("Puter.js script loaded, checking API...");
            
            // Check if puter.ai exists and has the right methods
            if (typeof puter === 'undefined') {
                reject(new Error("Puter object not defined"));
                return;
            }
            
            // Try to initialize if needed
            if (typeof puter.init === 'function') {
                puter.init().then(() => {
                    console.log("Puter initialized successfully");
                    resolve();
                }).catch(reject);
            } else {
                console.log("Puter.init not available, proceeding anyway");
                resolve();
            }
        };
        script.onerror = (error) => {
            console.error('Failed to load local puter.js:', error);
            reject(error);
        };
        document.head.appendChild(script);
    });
}

async function getOracleAIResponse(userInput) {
    console.log("Getting Oracle response for:", userInput);
    
    // Add to conversation history
    oracleChatHistory.push({ role: 'user', content: userInput });
    
    // Keep history manageable (last 10 exchanges)
    if (oracleChatHistory.length > 20) {
        oracleChatHistory = oracleChatHistory.slice(-20);
    }
    
    try {
        // Check if puter.js is loaded
        if (typeof puter === 'undefined' || typeof puter.ai === 'undefined') {
            console.log("Puter not loaded, attempting to load...");
            await loadPuterSDK();
        }
        
        // Get fresh system prompt with current time
        const systemPrompt = getOracleSystemPrompt();
        
        // Format conversation for the prompt
        const messages = [
            { role: 'system', content: systemPrompt },
            ...oracleChatHistory
        ];
        
        // Create a simple text prompt from messages
        const fullPrompt = messages.map(msg => {
            if (msg.role === 'system') return `System: ${msg.content}`;
            if (msg.role === 'user') return `User: ${msg.content}`;
            if (msg.role === 'assistant') return `Oracle: ${msg.content}`;
            return `${msg.role}: ${msg.content}`;
        }).join('\n') + '\nOracle:';
        
        console.log("Full prompt (first 500 chars):", fullPrompt.substring(0, 500));
        
        let rawResponse;
        
        // SIMPLIFIED: Just try puter.ai.chat with the prompt string
        if (typeof puter.ai.chat === 'function') {
            console.log("Calling puter.ai.chat with prompt...");
            rawResponse = await puter.ai.chat(fullPrompt);
            console.log("Raw response from puter.ai.chat:", rawResponse);
        } else {
            throw new Error("puter.ai.chat is not available");
        }
        
        // SIMPLIFIED RESPONSE EXTRACTION
        let responseText = '';
        
        // If it's already a string, use it
        if (typeof rawResponse === 'string') {
            responseText = rawResponse;
        }
        // If it's an object, try to extract text
        else if (rawResponse && typeof rawResponse === 'object') {
            console.log("Response is an object, trying to extract text...");
            
            // Debug: log the entire object structure
            console.log("Response object keys:", Object.keys(rawResponse));
            
            // Try common patterns
            if (rawResponse.message && typeof rawResponse.message === 'string') {
                responseText = rawResponse.message;
            } 
            else if (rawResponse.content && typeof rawResponse.content === 'string') {
                responseText = rawResponse.content;
            }
            else if (rawResponse.text && typeof rawResponse.text === 'string') {
                responseText = rawResponse.text;
            }
            else if (rawResponse.result && typeof rawResponse.result === 'string') {
                responseText = rawResponse.result;
            }
            else if (rawResponse.data) {
                if (typeof rawResponse.data === 'string') {
                    responseText = rawResponse.data;
                } else if (rawResponse.data.text && typeof rawResponse.data.text === 'string') {
                    responseText = rawResponse.data.text;
                } else if (rawResponse.data.content && typeof rawResponse.data.content === 'string') {
                    responseText = rawResponse.data.content;
                }
            }
            // Check if it has a choices array (OpenAI format)
            else if (rawResponse.choices && Array.isArray(rawResponse.choices) && rawResponse.choices.length > 0) {
                const choice = rawResponse.choices[0];
                if (choice.message && choice.message.content) {
                    responseText = choice.message.content;
                } else if (choice.text) {
                    responseText = choice.text;
                }
            }
            // Last resort: convert to string and clean up
            else {
                console.log("Could not find text in object, converting to string...");
                const stringified = JSON.stringify(rawResponse);
                
                // Try to extract text from JSON string
                const textMatch = stringified.match(/"text":"([^"]+)"/) || 
                                 stringified.match(/"content":"([^"]+)"/) ||
                                 stringified.match(/"message":"([^"]+)"/) ||
                                 stringified.match(/"result":"([^"]+)"/);
                
                if (textMatch) {
                    responseText = textMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
                } else {
                    // Use the stringified version
                    responseText = stringified;
                }
            }
        }
        // If it's something else, convert to string
        else {
            responseText = String(rawResponse);
        }
        
        // Final cleanup
        if (typeof responseText !== 'string') {
            responseText = String(responseText);
        }
        
        responseText = responseText.trim();
        
        // Remove any leading "Oracle:" or "Assistant:" prefixes
        responseText = responseText.replace(/^(Oracle|Assistant|System):\s*/i, '');
        
        // If we still have [object Object], use fallback
        if (responseText.includes('[object Object]') || responseText.includes('[object ') || responseText.length < 2) {
            console.log("Response still contains [object Object], using fallback");
            return getLocalOracleResponse(userInput);
        }
        
        console.log("Final response text:", responseText);
        
        // Add to conversation history
        oracleChatHistory.push({ role: 'assistant', content: responseText });
        
        return responseText;
        
    } catch (error) {
        console.error("Error getting Oracle response:", error);
        console.log("Error details:", error.name, error.message);
        
        // Use local fallback
        return getLocalOracleResponse(userInput);
    }
}

function getLocalOracleResponse(userInput) {
    console.log("Using local Oracle fallback for:", userInput);
    
    const input = userInput.toLowerCase();
    const now = new Date();
    
    // Check for time questions
    if (input.includes('time') && (input.includes('what') || input.includes('current'))) {
        if (input.includes('london')) {
            const londonTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
            const hours = londonTime.getHours().toString().padStart(2, '0');
            const minutes = londonTime.getMinutes().toString().padStart(2, '0');
            return `In London, it's ${hours}:${minutes} right now. Time is the quiet rumor of the universe, kid.`;
        }
        else if (input.includes('tokyo') || input.includes('japan')) {
            const tokyoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
            const hours = tokyoTime.getHours().toString().padStart(2, '0');
            const minutes = tokyoTime.getMinutes().toString().padStart(2, '0');
            return `In Tokyo, it's ${hours}:${minutes} right now. The machines track every second perfectly.`;
        }
        else if (input.includes('new york')) {
            const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
            const hours = nyTime.getHours().toString().padStart(2, '0');
            const minutes = nyTime.getMinutes().toString().padStart(2, '0');
            return `In New York, it's ${hours}:${minutes} right now. Time zones are just another system, kid.`;
        }
    }
    
    // Check for date questions
    if (input.includes('date') || input.includes('today') || input.includes('day is it')) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('en-US', options);
        return `Today is ${dateStr}. In the Matrix, every day feels the same. What makes this one different, kid?`;
    }
    
    // Check for math questions
    const mathMatch = input.match(/(\d+)\s*([+\-*/x])\s*(\d+)/);
    if (mathMatch) {
        const [_, num1, op, num2] = mathMatch;
        const n1 = parseInt(num1);
        const n2 = parseInt(num2);
        let result;
        
        switch(op) {
            case '+': result = n1 + n2; break;
            case '-': result = n1 - n2; break;
            case '*': case 'x': result = n1 * n2; break;
            case '/': result = n2 !== 0 ? (n1 / n2).toFixed(2) : 'undefined (cannot divide by zero)'; break;
            default: result = '?';
        }
        
        return `${result}. Numbers are the machine's language, kid. But some answers are simpler than they seem.`;
    }
    
    // Check for "who are you" questions
    if (input.includes('who are you') || input.includes('what are you')) {
        return "I'm the Oracle, kid. I bake cookies and know things. Some people think I can see the future. Sit down, have a cookie, ask me something.";
    }
    
    // Check for Matrix questions
    if (input.includes('matrix') || input.includes('neo') || input.includes('morpheus') || input.includes('trinity')) {
        const matrixResponses = [
            "The Matrix is a system, Neo. That system is our enemy.",
            "I'd ask you to sit down, but you're not going to anyway, are you?",
            "You didn't come here to make the choice, you've already made it.",
            "Being The One is like being in love. No one can tell you you're in love, you just know it.",
            "We can never see past the choices we don't understand.",
            "Would you like a cookie? They're almost done baking.",
            "The Architect designed every choice. Even this one.",
            "There's a difference between knowing the path and walking the path."
        ];
        return matrixResponses[Math.floor(Math.random() * matrixResponses.length)];
    }
    
    // Check for simple greetings
    if (input.includes('hello') || input.includes('hi ') || input === 'hi' || input === 'hey') {
        const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `Hello, kid. It's ${currentTime} now. The cookies are baking. What brings you to my kitchen?`;
    }
    
    // Default Oracle responses
    const responses = [
        "The cookies are almost done. What do you really want to know?",
        "You're asking the right questions, but maybe the wrong ones. Try again.",
        "The answer isn't in the code, it's in you. What does your gut tell you?",
        "Sometimes you have to unplug to see the truth. What's really on your mind?",
        "Would you like a cookie? They're almost done baking.",
        "The machines are listening. Ask me something real.",
        "I see you're searching. The answer might surprise you.",
        "In the Matrix, some questions have no answers. Others have too many.",
        "You remind me of Neo. Always questioning. What's next?",
        "The Architect designed the questions too. What do you really want?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function addOracleResponse(text) {
    const history = document.getElementById('oracle-chat-history');
    const entry = document.createElement('div');
    entry.className = "oracle-entry";
    
    // Create a unique ID for this response to track its state
    const responseId = 'oracle-response-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Initially fully encrypted/scrambled text
    const scrambled = text.split('').map(() => MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)]).join('');
    
    entry.innerHTML = `
        <div class="oracle-response-container">
            <div class="oracle-response-text encrypted" 
                 id="${responseId}" 
                 data-original="${text}"
                 data-state="encrypted">${scrambled}</div>
        </div>
    `;
    
    history.appendChild(entry);
    history.scrollTop = history.scrollHeight;

    const textEl = entry.querySelector('.oracle-response-text');
    let isCurrentlyEncrypted = true;
    let typewriterInterval = null;
    let typewriterProgress = 0;
    const typewriterSpeed = 30; // ms per character
    const totalCharacters = text.length;
    
    // Clear any existing intervals for this element
    if (oracleIntervals.has(textEl)) {
        clearInterval(oracleIntervals.get(textEl));
        oracleIntervals.delete(textEl);
    }
    
    // Start the typewriter reveal
    function startTypewriterReveal() {
        if (typewriterInterval) {
            clearInterval(typewriterInterval);
        }
        
        typewriterProgress = 0;
        isCurrentlyEncrypted = true;
        textEl.classList.add('encrypted');
        textEl.setAttribute('data-state', 'revealing');
        
        typewriterInterval = setInterval(() => {
            // Show partially revealed text with random characters for the rest
            const revealedPart = text.substring(0, typewriterProgress);
            const remainingLength = text.length - typewriterProgress;
            const randomPart = Array(remainingLength).fill(0).map(() => 
                MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)]
            ).join('');
            
            textEl.innerText = revealedPart + randomPart;
            
            typewriterProgress++;
            
            // When fully revealed
            if (typewriterProgress > totalCharacters) {
                clearInterval(typewriterInterval);
                typewriterInterval = null;
                textEl.innerText = text;
                isCurrentlyEncrypted = false;
                textEl.classList.remove('encrypted');
                textEl.setAttribute('data-state', 'decrypted');
                
                // Set a timeout to re-encrypt after a delay
                setTimeout(() => {
                    // Only re-encrypt if not currently being hovered
                    if (!textEl.matches(':hover') && isCurrentlyEncrypted === false && !typewriterInterval) {
                        encryptText();
                    }
                }, 2000); // Wait 2 seconds before auto-re-encrypting
            }
        }, typewriterSpeed);
    }
    
    // Function to encrypt text
    const encryptText = () => {
        if (isCurrentlyEncrypted || typewriterInterval) return;
        
        isCurrentlyEncrypted = true;
        textEl.classList.add('encrypted');
        textEl.setAttribute('data-state', 'encrypted');
        
        // Use the existing decryptOracleText function for encryption (reverse direction)
        if (oracleIntervals.has(textEl)) {
            clearInterval(oracleIntervals.get(textEl));
        }
        
        decryptOracleText(textEl, text, false); // false = encrypt mode
    };
    
    // Function to decrypt text
    const decryptText = () => {
        if (!isCurrentlyEncrypted || typewriterInterval) return;
        
        isCurrentlyEncrypted = false;
        textEl.classList.remove('encrypted');
        textEl.setAttribute('data-state', 'decrypted');
        
        // Use the existing decryptOracleText function
        if (oracleIntervals.has(textEl)) {
            clearInterval(oracleIntervals.get(textEl));
        }
        
        decryptOracleText(textEl, text, true); // true = decrypt mode
    };
    
    // Start the typewriter effect immediately
    setTimeout(() => {
        startTypewriterReveal();
    }, 100); // Small delay to ensure DOM is ready
    
    // Setup Hover Logic
    textEl.onmouseenter = () => {
        // If text is encrypted and not currently revealing via typewriter
        if (isCurrentlyEncrypted && !typewriterInterval) {
            decryptText();
        }
    };
    
    textEl.onmouseleave = () => {
        // If text is decrypted and not currently revealing via typewriter
        if (!isCurrentlyEncrypted && !typewriterInterval) {
            // Wait a bit before re-encrypting to give user time to read
            setTimeout(() => {
                if (!textEl.matches(':hover') && !isCurrentlyEncrypted && !typewriterInterval) {
                    encryptText();
                }
            }, 500);
        }
    };
}

const oracleIntervals = new Map();
const oracleIterations = new Map();

function decryptOracleText(element, targetText, isDecrypting) {
    // Clear any existing interval for this element
    if (oracleIntervals.has(element)) {
        clearInterval(oracleIntervals.get(element));
    }
    
    let iteration = oracleIterations.get(element) || 0;
    
    // If we're encrypting, start from the end
    if (!isDecrypting && iteration === 0) {
        iteration = targetText.length;
    }
    
    const interval = setInterval(() => {
        // Handle case where element might have been removed
        if (!document.contains(element)) {
            clearInterval(interval);
            oracleIntervals.delete(element);
            return;
        }
        
        element.innerText = targetText.split("").map((letter, index) => {
            if (isDecrypting) {
                // Decrypting: show real text from start to iteration
                if (index < iteration) return targetText[index];
                return MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)];
            } else {
                // Encrypting: show real text from start to iteration, random after
                if (index < iteration) return targetText[index];
                return MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)];
            }
        }).join("");
        
        if (isDecrypting) {
            iteration += 1/2; // Speed of reveal
            if (iteration >= targetText.length) { 
                iteration = targetText.length; 
                element.innerText = targetText; 
                clearInterval(interval);
                oracleIntervals.delete(element);
                oracleIterations.delete(element);
            }
        } else {
            iteration -= 1/2; // Speed of encryption
            if (iteration <= 0) { 
                iteration = 0; 
                element.innerText = targetText.replace(/./g, () => MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)]); 
                clearInterval(interval);
                oracleIntervals.delete(element);
                oracleIterations.delete(element);
            }
        }
        oracleIterations.set(element, iteration);
    }, 30);
    
    oracleIntervals.set(element, interval);
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

// --- FULL SCREEN 2D RAIN FIX ---
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
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; 
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
        ctx.fillText(text, x, y);
        
        rainDrops[i]++;
        if (rainDrops[i] * fontSize > fullHeight + 100) {
            rainDrops[i] = -Math.floor(Math.random() * 20);
        }
    }
}

function startRain() { 
    clearInterval(rainInterval); 
    if (!videoBackground) {
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
    const container = get('zion-rss-container'), list = get('rss-feed-list');
    const barCont = get('rss-loading-bar-container'), bar = get('rss-loading-bar');
    
    if (!data.isRssEnabled) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');
    
    // Initialize Loading State
    if (!isSilent) {
        list.innerHTML = '<div class="rss-meta">Establishing Uplink...</div>';
        if (barCont && bar) {
            barCont.style.display = 'block';
            bar.style.width = '30%'; // Handshake phase
        }
    }
    
    try {
        const subs = data.rssSubs || "matrix+cyberpunk";
        const response = await fetch(`https://www.reddit.com/r/${subs}/hot.json?limit=50`);
        
        if (!isSilent && bar) bar.style.width = '70%'; // Data Transfer phase
        
        const json = await response.json();
        
        if (!isSilent && bar) bar.style.width = '100%'; // Processing phase
        
        list.innerHTML = "";

        json.data.children.forEach(post => {
            const item = post.data;
            const link = document.createElement('a');
            link.className = 'rss-item'; 
            link.href = `https://reddit.com${item.permalink}`; 
            link.target = "_blank";

            // 1. Create Title (Matrix Cipher Effect)
            const title = document.createElement('div');
            title.className = 'rss-title';
            title.style.color = 'var(--theme-color)';
            const originalTitle = item.title;
            title.innerText = originalTitle.replace(/./g, () => MATRIX_ALPHABET[Math.floor(Math.random() * MATRIX_ALPHABET.length)]);
            
            // 2. Create Meta Info
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

            // 3. Media Wrapper (Image or Audio-Enabled Video)
            if (item.post_hint === 'image' || (item.url && item.url.match(/\.(jpg|jpeg|png|gif)$/))) {
                const wrap = document.createElement('div');
                wrap.className = 'rss-media-wrapper';

                const img = document.createElement('img');
                img.src = item.url;
                img.className = 'rss-media-content';

                // --- IMAGE FULLSCREEN BUTTON ---
                const imgFsBtn = document.createElement('button');
                imgFsBtn.className = 'video-fullscreen-btn'; // Same class as video for styling
                imgFsBtn.innerHTML = '⛶';
                imgFsBtn.title = "Maximize Visual";
                imgFsBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
                video.autoplay = true;
                video.loop = true;
                video.muted = true; 
                video.playsInline = true;

                // --- FULLSCREEN TOGGLE ---
                const fsBtn = document.createElement('button');
                fsBtn.className = 'video-fullscreen-btn';
                fsBtn.innerHTML = '⛶';
                fsBtn.title = "Maximize Transmission";
                fsBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (video.requestFullscreen) video.requestFullscreen();
                    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
                    else if (video.msRequestFullscreen) video.msRequestFullscreen();
                };

                // --- VOLUME TOGGLE ---
                const volBtn = document.createElement('button');
                volBtn.className = 'video-vol-btn';
                volBtn.innerHTML = '🔇';
                volBtn.title = "Toggle Audio";
                volBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    video.muted = !video.muted;
                    if (!video.muted) video.play().catch(() => {});
                    volBtn.innerHTML = video.muted ? '🔇' : '🔊';
                    volBtn.style.boxShadow = video.muted ? 'none' : '0 0 10px var(--theme-color)';
                };

                wrap.appendChild(video);
                wrap.appendChild(fsBtn);
                wrap.appendChild(volBtn);
                link.appendChild(wrap);
            }

            // 4. Stats Row
            const statsRow = document.createElement('div');
            statsRow.className = 'rss-stats-row';
            const format = (n) => (n > 999 ? (n/1000).toFixed(1) + 'k' : Math.floor(n) || 0);

            // Upvote
            const upDiv = document.createElement('div');
            upDiv.className = 'rss-stat-item upvote-item';
            upDiv.innerHTML = `<span class="rss-stat-icon"><svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M12.833 16V9h3.334L10 2 3.833 9h3.334v7h5.666z"></path></svg></span> ${format(item.ups)}`;
            statsRow.appendChild(upDiv);

            // Downvote
            const ratio = item.upvote_ratio || 1;
            const estimatedDowns = ratio < 1 ? Math.round((item.ups / ratio) - item.ups) : 0;
            if (estimatedDowns > 0) {
                const downDiv = document.createElement('div');
                downDiv.className = 'rss-stat-item downvote-item';
                downDiv.innerHTML = `<span class="rss-stat-icon"><svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M7.167 4v7H3.833L10 18l6.167-7h-3.334V4H7.167z"></path></svg></span> ${format(estimatedDowns)}`;
                statsRow.appendChild(downDiv);
            }

            // Comments
            const commDiv = document.createElement('div');
            commDiv.className = 'rss-stat-item';
            commDiv.innerHTML = `<span class="rss-stat-icon">💬</span> ${format(item.num_comments)}`;
            statsRow.appendChild(commDiv);

            link.appendChild(statsRow);

            // 5. Interaction: Decrypt Title AND Meta
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

        // Cleanup Loading State
        if (!isSilent && barCont) {
            setTimeout(() => {
                barCont.style.display = 'none';
                if (bar) bar.style.width = '0%';
            }, 800);
        }

    } catch (e) { 
        console.error("Zion Feed Error:", e);
        if (barCont) barCont.style.display = 'none';
        if(!isSilent) list.innerHTML = `<div class="rss-meta" style="color:#f00;">Signal Lost: Protocol Error</div>`; 
    }
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

// --- SEARCH & CURSOR ---
const searchInput = document.getElementById('search-input');
const cursor = document.getElementById('terminal-cursor');

// Create a hidden span to measure text width
const measure = document.createElement('span');
measure.style.cssText = "position:absolute; visibility:hidden; white-space:pre; pointer-events:none;";
document.body.appendChild(measure);

function syncCursor() {
    // 1. Get the actual computed style of the input (accounts for your UI scale and CSS)
    const style = window.getComputedStyle(searchInput);
    measure.style.fontFamily = style.fontFamily;
    measure.style.fontSize = style.fontSize;
    measure.style.fontWeight = style.fontWeight;
    measure.style.letterSpacing = style.letterSpacing;
    measure.style.textTransform = style.textTransform;

    // 2. Mirror the text
    measure.textContent = searchInput.value || "";

    // 3. Calculate text width
    const textWidth = measure.getBoundingClientRect().width;

    // 4. Subtract scrollLeft! 
    // This stops the cursor from jumping ahead when the text scrolls horizontally.
    const scrollOffset = searchInput.scrollLeft;
    
    // 5. Apply position (adding 2px or similar if you have a slight padding-left)
    cursor.style.transform = `translateX(${textWidth - scrollOffset}px)`;
}

function updateCursorVisibility() {
    cursor.style.opacity = (document.activeElement === searchInput) ? "1" : "0";
    if (cursor.style.opacity === "1") syncCursor();
}

// Add scroll listener so cursor follows text during manual scrolling/overflow
searchInput.addEventListener('scroll', syncCursor);
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
const modal = get('settings-modal'), sizeS = get('size-slider'), textScaleS = get('text-scale-slider'), speedS = get('speed-slider'), colorP = get('color-picker');
const minT = get('show-minutes'), secT = get('show-seconds'), hour24T = get('use-24hour'), greenT = get('matrix-green'), binaryT = get('binary-mode'), hexT = get('hex-mode'), asciiT = get('ascii-mode'), bamumT = get('bamum-mode'), mathT = get('math-mode'), emojiT = get('emoji-mode'), snowT = get('snow-toggle'), fontT = get('font-toggle'), rainbowT = get('rainbow-toggle'), glowT = get('glow-toggle'), glitchT = get('glitch-toggle'), glitchS = get('glitch-slider'), scanlineT = get('scanline-toggle'), bgFilterT = get('bg-filter-toggle'), bgT = get('bg-toggle'), quoteI = get('quote-input'), saveB = get('save-settings'), scaleS = get('scale-mode'), cycleT = get('cycle-quotes'), resetB = get('restore-defaults');
const imgI = get('image-input'), vidI = get('video-input'), upImgB = get('upload-image-btn'), upVidB = get('upload-video-btn'), clearB = get('clear-backdrop');
const phoneT = get('phone-toggle'), phoneFreqS = get('phone-freq-slider'), phoneFreqVal = get('phone-freq-value'), chatT = get('chat-toggle');
const audI = get('audio-input'), upAudB = get('upload-audio-btn'), clearAudB = get('clear-audios');
const rssT = get('rss-toggle'), rssI = get('rss-input'), statsT = get('stats-toggle');
const rainAmbT = get('rain-ambience-toggle'), humT = get('hum-toggle'), matrixSfxT = get('matrix-sfx-toggle'), envVolS = get('env-volume-slider');
const upSfxB = get('upload-custom-sfx-btn'), sfxI = get('custom-sfx-input'), clearSfxB = get('clear-custom-sfx');
const journey2T = get('journey2-toggle'), binaryTunnelT = get('binary-toggle'), matrixRoomT = get('room-toggle');
const movieTunnelT = get('movie-tunnel-toggle'), matrixRoomNewT = get('matrix-room-toggle'), combatTrainingT = get('combat-training-toggle'), meditationT = get('meditation-toggle');
const verticalRainT = get('vertical-rain-toggle');
const verticalRainBinaryT = get('vertical-rain-binary-mode'), verticalRainHexT = get('vertical-rain-hex-mode');
const verticalRainAsciiT = get('vertical-rain-ascii-mode'), verticalRainMathT = get('vertical-rain-math-mode'), verticalRainRainbowT = get('vertical-rain-rainbow-toggle');

// Oracle Toggle
const oracleT = get('oracle-toggle');

function applyImg(s) { removeM(); const i = document.createElement('img'); i.id = 'bg-image-layer'; i.src = s; mainContainer.prepend(i); }
function applyVid(file) { removeM(); const v = document.createElement('video'); v.id = 'bg-video'; v.src = URL.createObjectURL(file); v.autoplay = v.loop = v.muted = v.playsInline = true; mainContainer.prepend(v); }
function removeM() { const v = get('bg-video'), i = get('bg-image-layer'); if(v) { URL.revokeObjectURL(v.src); v.remove(); } if(i) i.remove(); }

function syncThemeColor() {
    rainColor = isMatrixGreen ? CLASSIC_GREEN : colorP.value;
    colorP.disabled = isMatrixGreen;
    document.documentElement.style.setProperty('--theme-color', rainColor);
    if (!videoBackground) startRain();
}

get('settings-icon-container').onclick = () => modal.classList.toggle('hidden');
greenT.onchange = (e) => { isMatrixGreen = e.target.checked; syncThemeColor(); };
colorP.oninput = () => { if (!isMatrixGreen) syncThemeColor(); };
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

// --- UPDATED SENTINEL SWARM TOGGLE WITH AUDIO ---
snowT.onchange = (e) => { 
    isSnowing = e.target.checked; 
    chrome.storage.sync.set({ isSnowing }); // Save state immediately
    
    const swarmAudio = document.getElementById('sentinel-swarm-sfx');
    
    if(isSnowing) { 
        initSnow(); 
        sCanvas.style.display = 'block';
        // Play audio if element exists
        if (swarmAudio) {
            swarmAudio.volume = 0.4;
            swarmAudio.play().catch(err => {
                console.log("Audio waiting for user interaction");
            });
        }
    } else {
        // Stop visuals
        sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
        sCanvas.style.display = 'none';
        // Stop audio
        if (swarmAudio) {
            swarmAudio.pause();
            swarmAudio.currentTime = 0;
        }
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
sizeS.oninput = (e) => mainContainer.style.transform = `translate(-50%, -50%) scale(${e.target.value})`;
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
        rainColor: colorP.value, rainSpeed, uiScale: sizeS.value, textScale: textScaleS.value, 
        showMinutes, showSeconds, use24Hour, isMatrixGreen, isBinary, isHex, isAscii, isMathSymbols, videoBackground,
        isSnowing, isCyberpunkFont: fontT.checked, isFlashing, isGlow: glowT.checked, isGlitch: glitchT.checked, 
        glitchIntensity: glitchS.value, isScanline: scanlineT.checked, isBgFilter: bgFilterT.checked, 
        isTransparent: bgT.checked, scaleMode: scaleS.value, isCycling: cycleT.checked, customQuote: quoteI.value, 
        isPhoneEnabled, phoneFrequency, isChatEnabled, isRssEnabled: rssT.checked, rssSubs: rssI.value, 
        isStatsEnabled: statsT.checked, isRainAmbience: rainAmbT.checked, isHumEnabled: humT.checked, 
        isMatrixSfxEnabled: matrixSfxT.checked, envVolume: envVolS.value,
        isOracleEnabled: oracleT ? oracleT.checked : false
    };
    chrome.storage.sync.set(s, () => modal.classList.add('hidden'));
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

// --- DRAG AND DROP NAVIGATION LINKS ---
const navWrapper = get('dynamic-links-wrapper'), addLinkBtn = get('add-link-btn');

let draggedItem = null;
let dragStartIndex = -1;
let isDragging = false;
let dragHintTimeout = null;

function showDragHint(message) {
    const hint = document.getElementById('drag-hint');
    if (!hint) {
        const hintEl = document.createElement('div');
        hintEl.id = 'drag-hint';
        hintEl.textContent = message;
        document.body.appendChild(hintEl);
    } else {
        hint.textContent = message;
        hint.style.opacity = '0.7';
    }
    
    clearTimeout(dragHintTimeout);
    dragHintTimeout = setTimeout(() => {
        const hint = document.getElementById('drag-hint');
        if (hint) hint.style.opacity = '0';
    }, 2000);
}

function updateLinkOrder(newOrder) {
    chrome.storage.sync.set({ userNavLinks: newOrder }, loadNavLinks);
}

function loadNavLinks() {
    chrome.storage.sync.get({ userNavLinks: [] }, (data) => {
        navWrapper.innerHTML = '';
        const count = data.userNavLinks.length; 
        addLinkBtn.style.display = count >= 10 ? 'none' : 'flex'; 
        addLinkBtn.title = `Add Secure Node (${count}/10)`;
        
        if (count > 0 && !sessionStorage.getItem('dragHintShown')) {
            setTimeout(() => showDragHint('Drag and drop links to reorder'), 1000);
            sessionStorage.setItem('dragHintShown', 'true');
        }
        
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
                isDragging = true; draggedItem = node; dragStartIndex = idx; node.classList.add('dragging'); e.dataTransfer.setData('text/plain', idx.toString()); e.dataTransfer.effectAllowed = 'move';
                const ghost = node.cloneNode(true); ghost.classList.add('drag-ghost'); ghost.style.position = 'absolute'; ghost.style.opacity = '0.7'; ghost.style.pointerEvents = 'none'; document.body.appendChild(ghost); e.dataTransfer.setDragImage(ghost, 24, 24); setTimeout(() => ghost.remove(), 0);
            };
            node.ondragover = (e) => { e.preventDefault(); if (draggedItem !== node) { node.classList.add('drag-over'); e.dataTransfer.dropEffect = 'move'; }};
            node.ondragleave = () => { node.classList.remove('drag-over'); };
            node.ondrop = (e) => {
                e.preventDefault(); node.classList.remove('drag-over');
                if (draggedItem === node) return;
                const dragEndIndex = parseInt(node.getAttribute('data-index'));
                if (dragStartIndex !== dragEndIndex) {
                    const newLinks = [...data.userNavLinks];
                    const [movedItem] = newLinks.splice(dragStartIndex, 1);
                    newLinks.splice(dragEndIndex, 0, movedItem);
                    updateLinkOrder(newLinks); showDragHint('Link order updated');
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
                document.getElementById('confirm-delete').onclick = () => { data.userNavLinks.splice(idx, 1); chrome.storage.sync.set({ userNavLinks: data.userNavLinks }, () => { cleanup(); loadNavLinks(); showDragHint('Link purged'); }); };
                document.getElementById('cancel-delete').onclick = cleanup;
                const closeOnOutside = (clickEvent) => { if (!confirmEl.contains(clickEvent.target) && !node.contains(clickEvent.target)) { cleanup(); document.removeEventListener('click', closeOnOutside); }};
                setTimeout(() => { document.addEventListener('click', closeOnOutside); }, 100);
            };
            navWrapper.appendChild(node);
        });
        addLinkBtn.ondragover = (e) => { e.preventDefault(); if (draggedItem) { addLinkBtn.classList.add('drag-over'); e.dataTransfer.dropEffect = 'move'; }};
        addLinkBtn.ondragleave = () => { addLinkBtn.classList.remove('drag-over'); };
        addLinkBtn.ondrop = (e) => { e.preventDefault(); addLinkBtn.classList.remove('drag-over'); if (dragStartIndex !== -1) { const newLinks = [...data.userNavLinks]; const [movedItem] = newLinks.splice(dragStartIndex, 1); newLinks.push(movedItem); updateLinkOrder(newLinks); showDragHint('Link moved to end'); }};
    });
}

addLinkBtn.onclick = () => { 
    chrome.storage.sync.get({ userNavLinks: [] }, (d) => { 
        if (d.userNavLinks.length >= 10) return; 
        const u = prompt("Input URL:"); 
        if (u) { try { let f = u.trim(); if (!/^https?:\/\//i.test(f)) f = 'https://' + f; new URL(f); d.userNavLinks.push(f); chrome.storage.sync.set({ userNavLinks: d.userNavLinks }, loadNavLinks); } catch (e) {} } 
    }); 
};

// --- INITIAL LOAD ---
chrome.storage.sync.get(null, (d) => {
    const data = { ...DEFAULTS, ...d };
    
    initVerticalRainEffect();
    
    rainSpeed = data.rainSpeed; speedS.value = rainSpeed; 
    isMatrixGreen = data.isMatrixGreen; greenT.checked = isMatrixGreen; 
    colorP.value = data.rainColor; syncThemeColor();
    
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

    // --- UPDATED INIT FOR SENTINEL AUDIO ---
    isSnowing = data.isSnowing; 
    snowT.checked = isSnowing; 
    if(isSnowing) {
        initSnow();
        // Check for audio element and play if exists
        const swarmAudio = document.getElementById('sentinel-swarm-sfx');
        if (swarmAudio) {
            swarmAudio.volume = 0.4;
            swarmAudio.play().catch(() => {});
        }
    }

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
    
    // ORACLE INIT
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
    
    // Initialize Oracle AFTER all DOM elements are ready
    setTimeout(() => {
        initOracleChat();
    }, 100);
    
    loadNavLinks(); resize(); animateSentinels(); updateUI(); 
    initPhoneSystem(); runChatTerminal(); 
    
    // Initialize calendar - moved to ensure DOM is ready
    setTimeout(() => {
        console.log("Initializing calendar...");
        initCalendar();
    }, 50);
    
    mainContainer.style.opacity = "1";
});

// Add a DOMContentLoaded listener as a backup
document.addEventListener('DOMContentLoaded', function() {
    // If calendar wasn't initialized by the storage callback, initialize it now
    setTimeout(() => {
        if (!isCalendarOpen && !window.calendarInitialized) {
            console.log("DOM loaded, initializing calendar...");
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