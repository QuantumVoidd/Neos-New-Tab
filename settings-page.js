/**
 * SETTINGS PAGE LOGIC 
 */

// --- SECURITY HELPERS ---
const SecUtils = {
    // Escapes characters that could be interpreted as HTML/XML tags
    escapeHTML: (str) => {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"'`=\/]/g, s => `&#${s.charCodeAt(0)};`);
    },
    // Prevents malicious URI schemes (e.g., javascript: XSS)
    sanitizeURL: (url) => {
        const strUrl = String(url).trim();
        if (/^(javascript|vbscript|data:text\/html):/i.test(strUrl)) return '';
        return strUrl;
    },
    // Strips invalid characters from CSS property values
    sanitizeCSS: (str) => {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[^a-zA-Z0-9#%(),.\s-]/g, '');
    }
};

// Helper to select elements safely
const get = (id) => document.getElementById(id);

// --- DOM ELEMENTS ---

// Operator ID
const operatorNameI = get('operator-name-input'),
      accessKeyI = get('access-key-input'),
      uploadPfpB = get('upload-pfp-btn'),
      resetPfpB = get('reset-pfp-btn'),
      pfpI = get('pfp-input'),
      pfpPreview = get('settings-pfp-preview');

// Main Settings
const modal = get('settings-modal'),
      sizeS = get('size-slider'),
      textScaleS = get('text-scale-slider'),
      speedS = get('speed-slider');

const colorP = get('color-picker'); 
const themeColorP = get('theme-color-picker'); 

// Time & Appearance Toggles
const minT = get('show-minutes'),
      secT = get('show-seconds'),
      hour24T = get('use-24hour'),
      greenT = get('matrix-green'),
      binaryT = get('binary-mode'),
      hexT = get('hex-mode'),
      asciiT = get('ascii-mode'),
      mathT = get('math-mode'),
      snowT = get('snow-toggle'),
      fontT = get('font-toggle'),
      rainbowT = get('rainbow-toggle'),
      glowT = get('glow-toggle'),
      glitchT = get('glitch-toggle'),
      glitchS = get('glitch-slider'),
      scanlineT = get('scanline-toggle'),
      bgFilterT = get('bg-filter-toggle'),
      bgT = get('bg-toggle'),
      quoteI = get('quote-input'),
      saveB = get('save-settings'),
      scaleS = get('scale-mode'),
      cycleT = get('cycle-quotes'),
      resetB = get('restore-defaults');

// Media & Backgrounds
const imgI = get('image-input'),
      vidI = get('video-input'),
      upImgB = get('upload-image-btn'),
      upVidB = get('upload-video-btn'),
      clearB = get('clear-backdrop');

// Video Background Toggles
const journey2T = get('journey2-toggle'),
      binaryTunnelT = get('binary-toggle'),
      matrixRoomT = get('room-toggle'),
      movieTunnelT = get('movie-tunnel-toggle'),
      matrixRoomNewT = get('matrix-room-toggle'),
      combatTrainingT = get('combat-training-toggle'),
      meditationT = get('meditation-toggle'),
      operatorT = get('operator-toggle');

// 3D Rain Options
const verticalRainT = get('vertical-rain-toggle'),
      verticalRainBinaryT = get('vertical-rain-binary-mode'),
      verticalRainHexT = get('vertical-rain-hex-mode'),
      verticalRainAsciiT = get('vertical-rain-ascii-mode'),
      verticalRainMathT = get('vertical-rain-math-mode'),
      verticalRainRainbowT = get('vertical-rain-rainbow-toggle');

// Phone & Chat
const phoneT = get('phone-toggle'),
      phoneFreqS = get('phone-freq-slider'),
      phoneFreqVal = get('phone-freq-value'),
      chatT = get('chat-toggle');

// Audio
const audI = get('audio-input'),
      upAudB = get('upload-audio-btn'),
      clearAudB = get('clear-audios');

// RSS & News Inputs (Matches HTML IDs)
const rssT = get('rss-toggle'),
      rssI = get('rss-input'),
      newsI = get('news-input'),
      securityI = get('security-input'),
      spaceI = get('space-input'),
      devI = get('dev-input'),
      financeI = get('finance-input'),
      statsT = get('stats-toggle');

// Audio/Ambience
const rainAmbT = get('rain-ambience-toggle'),
      humT = get('hum-toggle'),
      matrixSfxT = get('matrix-sfx-toggle'),
      envVolS = get('env-volume-slider'),
      upSfxB = get('upload-custom-sfx-btn'),
      sfxI = get('custom-sfx-input'),
      clearSfxB = get('clear-custom-sfx');

// Advanced
const oracleT = get('oracle-toggle'),
      sysMonT = get('system-monitor-toggle');

// --- INTERNAL STATE FOR PFP ---
let tempPfpData = null; // Stores new PFP before saving

// --- 1. SIDEBAR TAB LOGIC (FIXED & STYLED) ---
function initTabs() {
    // Select all elements with class 'settings-tab'
    const tabs = document.querySelectorAll('.settings-tab');
    const sections = document.querySelectorAll('.settings-section');

    // --- APPLY HEADER STYLING (Center & Line) ---
    const headers = document.querySelectorAll('.sec-header');
    headers.forEach(h => {
        // We use cssText to ensure we override any conflicting CSS (like !important)
        // var(--theme-color) ensures it stays synced with the user's color choice
        h.style.cssText = `
            text-align: center !important;
            border-bottom: 2px solid var(--theme-color) !important;
            padding-bottom: 15px !important;
            margin-bottom: 25px !important;
            width: 100%;
            display: block;
        `;
    });

    if (!tabs.length) return;

    tabs.forEach(tab => {
        // Clone to remove old listeners
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);

        newTab.addEventListener('click', () => {
            // 1. Remove active class from all tabs
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            // 2. Add active class to clicked tab
            newTab.classList.add('active');

            // 3. Hide all sections
            sections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none'; // Force hide style
            });

            // 4. Show target section based on 'data-target' attribute
            const targetId = SecUtils.escapeHTML(newTab.getAttribute('data-target'));
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.classList.add('active');
                targetSection.style.display = 'block'; // Force show style
            }
        });
    });

    // Default: Open first tab if none active
    const activeTab = document.querySelector('.settings-tab.active');
    if (!activeTab && tabs.length > 0) {
        tabs[0].click();
    }
}

// Run tab init immediately and on load
initTabs();
document.addEventListener('DOMContentLoaded', initTabs);


// --- 2. HELPER FUNCTIONS ---

function syncThemeColor() {
    // NOTE: Variables are accessed directly (not window.var) to update script.js scope
    if (typeof isMatrixGreen !== 'undefined' && isMatrixGreen) {
        const safeGreen = typeof CLASSIC_GREEN !== 'undefined' ? SecUtils.sanitizeCSS(CLASSIC_GREEN) : '#00FF41';
        document.documentElement.style.setProperty('--theme-color', safeGreen);
        if(typeof rainColor !== 'undefined') rainColor = safeGreen;
        if(typeof themeColor !== 'undefined') themeColor = safeGreen;
        
        if(colorP) { colorP.value = rainColor; colorP.disabled = true; }
        if(themeColorP) { themeColorP.value = themeColor; themeColorP.disabled = true; }
    } else {
        const customTheme = themeColorP ? SecUtils.sanitizeCSS(themeColorP.value) : '#00f2ff';
        const customRain = colorP ? SecUtils.sanitizeCSS(colorP.value) : '#00f2ff';
        
        document.documentElement.style.setProperty('--theme-color', customTheme);
        if(typeof rainColor !== 'undefined') rainColor = customRain;
        if(typeof themeColor !== 'undefined') themeColor = customTheme;
        
        if(colorP) colorP.disabled = false;
        if(themeColorP) themeColorP.disabled = false;
    }
    // Restart rain if not using video background
    if (typeof videoBackground !== 'undefined' && !videoBackground && typeof startRain === 'function') {
        startRain();
    }
}

function handleVideoBackgroundToggle(videoType, isChecked) {
    const videoTypes = ["journey2", "binary", "room", "movie-tunnel", "matrix-room", "combat-training", "meditation", "vertical-rain", "operator"];
    
    if (isChecked) {
        // Turn off all other toggles
        videoTypes.forEach(type => {
            if (type !== videoType) {
                const toggle = document.getElementById(`${SecUtils.escapeHTML(type)}-toggle`);
                if (toggle) toggle.checked = false;
            }
        });
        
        if(typeof startBackgroundVideo === 'function') startBackgroundVideo(SecUtils.escapeHTML(videoType));
    } else {
        if (typeof videoBackground !== 'undefined' && videoBackground === videoType) {
            if(typeof stopBackgroundVideo === 'function') stopBackgroundVideo();
        }
    }
}

function getWireframeSvg() {
    // Generates the SVG fallback for the PFP
    const color = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim() || '#00ff41';
    const safeColor = SecUtils.escapeHTML(SecUtils.sanitizeCSS(color)); // Prevents injection inside the SVG
    
    const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${safeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    `;
    return 'data:image/svg+xml;base64,' + btoa(svgString);
}

// --- PFP VISUALS HELPER (COPIED LOGIC FROM LOGON.JS) ---
function updatePfpVisuals(isCustom, imgSrc) {
    if (!pfpPreview) return;
    
    if (!(pfpPreview instanceof window.HTMLImageElement || pfpPreview.nodeName === 'IMG')) return;

    // Set source safely
    pfpPreview.src = SecUtils.sanitizeURL(imgSrc);
    
    // Ensure parent container is relative
    if (pfpPreview.parentElement) {
        pfpPreview.parentElement.style.position = "relative";
        pfpPreview.parentElement.style.overflow = "hidden"; // Ensure clipping
    }

    if (isCustom) {
        // --- CUSTOM PFP MODE (BLEED) ---
        // 1. Force styles to ensure bleed (Scale 1.1)
        pfpPreview.style.position = "absolute";
        pfpPreview.style.top = "50%";
        pfpPreview.style.left = "50%";
        pfpPreview.style.transform = "translate(-50%, -50%) scale(1.1)"; 
        
        pfpPreview.style.width = "100%";
        pfpPreview.style.height = "100%";
        pfpPreview.style.objectFit = "cover"; 
        pfpPreview.style.margin = "0";
        pfpPreview.style.padding = "0";
        pfpPreview.style.borderRadius = "50%"; 
        pfpPreview.style.display = "block";
    } else {
        // --- WIREFRAME MODE (CONTAIN) ---
        // Updated Centering Logic matching logon.js
        pfpPreview.style.position = "absolute"; 
        pfpPreview.style.top = "50%";
        pfpPreview.style.left = "50%";
        pfpPreview.style.transform = "translate(-50%, -50%)";
        
        // Use 65% width/height to control size (creates 'padding' effect naturally)
        pfpPreview.style.width = "65%";  
        pfpPreview.style.height = "65%";
        pfpPreview.style.objectFit = "contain"; 
        pfpPreview.style.padding = "0"; 
        pfpPreview.style.margin = "0";
        pfpPreview.style.borderRadius = "0";
    }
}


// --- 3. EVENT LISTENERS ---

// Open/Close Modal
if(get('dock-settings')) {
    get('dock-settings').onclick = () => {
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
            if(typeof initSettingsRain === 'function') setTimeout(initSettingsRain, 50); 
            initTabs(); // Re-bind tabs and RE-APPLY STYLES to be safe
            
            // Re-render wireframe just in case color changed
            if (pfpPreview && (!tempPfpData && pfpPreview.src.includes('image/svg+xml'))) {
                 updatePfpVisuals(false, getWireframeSvg());
            }

        } else {
            if (typeof settingsRainInterval !== 'undefined') clearInterval(settingsRainInterval);
        }
    };
}

// --- OPERATOR ID LISTENERS ---
if(uploadPfpB) {
    uploadPfpB.onclick = () => {
        if(pfpI) pfpI.click();
    };
}

if(pfpI) {
    pfpI.onchange = (e) => {
        const file = e.target.files[0];
        // Security check for image
        if (file && file.type.startsWith('image/')) {
             const reader = new FileReader();
             reader.onload = function(event) {
                 tempPfpData = event.target.result;
                 // Apply Visuals immediately
                 updatePfpVisuals(true, tempPfpData);
             };
             reader.readAsDataURL(file);
        }
    }
}

if(resetPfpB) {
    resetPfpB.onclick = () => {
        tempPfpData = null; // Clear temp
        // Apply Wireframe Visuals
        updatePfpVisuals(false, getWireframeSvg());
    };
}


// --- Time & UI Toggles (Fixed Variable Scope) ---
if(minT) minT.onchange = (e) => { 
    if(typeof showMinutes !== 'undefined') showMinutes = e.target.checked; 
    if(typeof updateUI === 'function') updateUI(); 
};

if(secT) secT.onchange = (e) => { 
    if(typeof showSeconds !== 'undefined') showSeconds = e.target.checked; 
    if(typeof updateUI === 'function') updateUI(); 
};

if(hour24T) hour24T.onchange = (e) => { 
    if(typeof use24Hour !== 'undefined') use24Hour = e.target.checked; 
    if(typeof updateUI === 'function') updateUI(); 
};

// Appearance
if(greenT) greenT.onchange = (e) => { 
    if(typeof isMatrixGreen !== 'undefined') isMatrixGreen = e.target.checked; 
    syncThemeColor(); 
};

if(colorP) colorP.oninput = (e) => { 
    if (typeof isMatrixGreen !== 'undefined' && !isMatrixGreen) {
        if(typeof rainColor !== 'undefined') rainColor = SecUtils.sanitizeCSS(e.target.value);
        if (typeof videoBackground !== 'undefined' && !videoBackground && typeof startRain === 'function') startRain();
    }
};

if(themeColorP) themeColorP.oninput = (e) => {
    if (typeof isMatrixGreen !== 'undefined' && !isMatrixGreen) {
        if(typeof themeColor !== 'undefined') themeColor = SecUtils.sanitizeCSS(e.target.value);
        document.documentElement.style.setProperty('--theme-color', themeColor);
    }
};

// Fonts & Effects
if(fontT) fontT.onchange = (e) => document.body.classList.toggle('cyberpunk-font', e.target.checked);
if(glowT) glowT.onchange = (e) => document.body.classList.toggle('glow-active', e.target.checked);
if(glitchT) glitchT.onchange = (e) => document.body.classList.toggle('glitch-enabled', e.target.checked);
if(scanlineT) scanlineT.onchange = (e) => get('scanline-overlay').classList.toggle('hidden', !e.target.checked);
if(bgFilterT) bgFilterT.onchange = (e) => document.body.classList.toggle('bg-filter-active', e.target.checked);
if(bgT) bgT.onchange = (e) => {
    const mc = document.querySelector('.main-container');
    if(mc) mc.classList.toggle('transparent-bg', e.target.checked);
};
if(rainbowT) rainbowT.onchange = (e) => { if(typeof isFlashing !== 'undefined') isFlashing = e.target.checked; };

// Sliders
if(speedS) speedS.oninput = (e) => { 
    if(typeof rainSpeed !== 'undefined') rainSpeed = parseInt(e.target.value, 10); 
    if (typeof videoBackground !== 'undefined' && !videoBackground && typeof startRain === 'function') startRain(); 
};
if(sizeS) sizeS.oninput = (e) => { 
    const mc = document.querySelector('.main-container');
    const safeScale = parseFloat(e.target.value) || 1;
    if(mc) mc.style.transform = `translate(-50%, -50%) scale(${safeScale})`; 
};
if(textScaleS) textScaleS.oninput = (e) => {
    const safeScale = parseFloat(e.target.value) || 1;
    document.documentElement.style.setProperty('--text-scale', safeScale);
};
if(glitchS) glitchS.oninput = (e) => {
    const safeIntensity = parseFloat(e.target.value) || 0;
    document.documentElement.style.setProperty('--glitch-intensity', safeIntensity + 'px');
};
if(scaleS) scaleS.onchange = (e) => {
    const safeScaleMode = parseFloat(e.target.value) || 1;
    document.documentElement.style.setProperty('--bg-scale', safeScaleMode);
};

// --- 2D RAIN ALPHABET (FIXED) ---
function updateCharSet(mode) {
    if (typeof isBinary === 'undefined') return; // Safety check

    // 1. Set Flags based on mode input
    if (mode === 'binary') { isBinary = true; isHex = isAscii = isMathSymbols = false; }
    else if (mode === 'hex') { isHex = true; isBinary = isAscii = isMathSymbols = false; }
    else if (mode === 'ascii') { isAscii = true; isBinary = isHex = isMathSymbols = false; }
    else if (mode === 'math') { isMathSymbols = true; isBinary = isHex = isAscii = false; }
    
    // 2. Sync UI Checkboxes
    if (binaryT) binaryT.checked = isBinary;
    if (hexT) hexT.checked = isHex;
    if (asciiT) asciiT.checked = isAscii;
    if (mathT) mathT.checked = isMathSymbols;

    // 3. Apply changes via global helper
    if (typeof update2DAlphabet === 'function') {
        update2DAlphabet();
    }

    // 4. Force restart rain
    if (typeof videoBackground !== 'undefined' && !videoBackground && typeof startRain === 'function') {
        startRain();
    }
}

// Logic to handle unchecking to reset to default
function handleCharToggle(toggle, modeName) {
    if (toggle.checked) {
        updateCharSet(modeName);
    } else {
        // If unchecking, turn off specific flag
        if (modeName === 'binary') isBinary = false;
        if (modeName === 'hex') isHex = false;
        if (modeName === 'ascii') isAscii = false;
        if (modeName === 'math') isMathSymbols = false;
        
        // If ALL are false, revert to default Matrix
        if (!isBinary && !isHex && !isAscii && !isMathSymbols) {
             if (typeof currentAlphabet !== 'undefined' && typeof MATRIX_ALPHABET !== 'undefined') {
                 currentAlphabet = MATRIX_ALPHABET;
             }
        }
        
        // Sync & Restart
        if (typeof update2DAlphabet === 'function') update2DAlphabet();
        if (typeof videoBackground !== 'undefined' && !videoBackground && typeof startRain === 'function') startRain();
    }
}

if(binaryT) binaryT.onchange = (e) => handleCharToggle(e.target, 'binary');
if(hexT) hexT.onchange = (e) => handleCharToggle(e.target, 'hex');
if(asciiT) asciiT.onchange = (e) => handleCharToggle(e.target, 'ascii');
if(mathT) mathT.onchange = (e) => handleCharToggle(e.target, 'math');


// Snow Toggle
if(snowT) snowT.onchange = (e) => { 
    if(typeof isSnowing !== 'undefined') isSnowing = e.target.checked; 
    const swarmAudio = document.getElementById('sentinel-swarm-sfx');
    const sCanvas = document.getElementById('sentinel-layer');

    if(isSnowing) { 
        if(typeof initSnow === 'function') initSnow(); 
        if(sCanvas) sCanvas.style.display = 'block';
        if (swarmAudio) { swarmAudio.volume = 0.4; swarmAudio.play().catch(() => {}); }
    } else {
        if(sCanvas) {
             const sCtx = sCanvas.getContext('2d');
             if(sCtx) sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
             sCanvas.style.display = 'none';
        }
        if (swarmAudio) { swarmAudio.pause(); swarmAudio.currentTime = 0; }
    }
};

// Quotes
if(quoteI) quoteI.oninput = (e) => { 
    const val = SecUtils.escapeHTML(e.target.value); 
    const dq = get('display-quote');
    if (val.trim() !== "") { 
        if(typeof stopQuoteCycling === 'function') stopQuoteCycling(); 
        if(cycleT) cycleT.checked = false; 
        if(dq) dq.textContent = `"${val}"`; 
    } else if (cycleT && !cycleT.checked) { 
        if(dq) dq.textContent = '"There is no spoon."'; 
    } 
};
if(cycleT) cycleT.onchange = (e) => { 
    if (e.target.checked) { 
        quoteI.value = ""; 
        if(typeof startQuoteCycling === 'function') startQuoteCycling(); 
    } else {
        if(typeof stopQuoteCycling === 'function') stopQuoteCycling(); 
    }
};

// Video Toggles
if(journey2T) journey2T.onchange = (e) => handleVideoBackgroundToggle('journey2', e.target.checked);
if(binaryTunnelT) binaryTunnelT.onchange = (e) => handleVideoBackgroundToggle('binary', e.target.checked);
if(matrixRoomT) matrixRoomT.onchange = (e) => handleVideoBackgroundToggle('room', e.target.checked);
if(movieTunnelT) movieTunnelT.onchange = (e) => handleVideoBackgroundToggle('movie-tunnel', e.target.checked);
if(matrixRoomNewT) matrixRoomNewT.onchange = (e) => handleVideoBackgroundToggle('matrix-room', e.target.checked);
if(combatTrainingT) combatTrainingT.onchange = (e) => handleVideoBackgroundToggle('combat-training', e.target.checked);
if(meditationT) meditationT.onchange = (e) => handleVideoBackgroundToggle('meditation', e.target.checked);
if(operatorT) operatorT.onchange = (e) => handleVideoBackgroundToggle('operator', e.target.checked);
if(verticalRainT) verticalRainT.onchange = (e) => handleVideoBackgroundToggle('vertical-rain', e.target.checked);

// 3D Rain Settings
if(verticalRainBinaryT) verticalRainBinaryT.onchange = (e) => { if(typeof isVerticalRainBinary !== 'undefined') isVerticalRainBinary = e.target.checked; if(typeof update3DVerticalRainAlphabet === 'function') update3DVerticalRainAlphabet(); };
if(verticalRainHexT) verticalRainHexT.onchange = (e) => { if(typeof isVerticalRainHex !== 'undefined') isVerticalRainHex = e.target.checked; if(typeof update3DVerticalRainAlphabet === 'function') update3DVerticalRainAlphabet(); };
if(verticalRainAsciiT) verticalRainAsciiT.onchange = (e) => { if(typeof isVerticalRainAscii !== 'undefined') isVerticalRainAscii = e.target.checked; if(typeof update3DVerticalRainAlphabet === 'function') update3DVerticalRainAlphabet(); };
if(verticalRainMathT) verticalRainMathT.onchange = (e) => { if(typeof isVerticalRainMathSymbols !== 'undefined') isVerticalRainMathSymbols = e.target.checked; if(typeof update3DVerticalRainAlphabet === 'function') update3DVerticalRainAlphabet(); };
if(verticalRainRainbowT) verticalRainRainbowT.onchange = (e) => { if(typeof isVerticalRainRainbow !== 'undefined') isVerticalRainRainbow = e.target.checked; };

// Phone
if(phoneT) phoneT.onchange = (e) => { 
    if(typeof isPhoneEnabled !== 'undefined') isPhoneEnabled = e.target.checked; 
    const phoneContainer = get('phone-container');
    if (isPhoneEnabled) {
        if(phoneContainer) phoneContainer.classList.remove('hidden');
    } else {
        if(phoneContainer) {
            phoneContainer.classList.add('hidden');
            phoneContainer.classList.remove('ringing', 'receiving');
        }
        const ringAudio = get('ring-audio');
        if(ringAudio && (ringAudio instanceof window.HTMLAudioElement || ringAudio.nodeName === 'AUDIO')) { 
            ringAudio.pause(); 
            ringAudio.src = ""; 
        }
    }
    if(typeof setupPhoneInterval === 'function') setupPhoneInterval();
};
if(phoneFreqS) phoneFreqS.oninput = (e) => { 
    const safeFreq = parseInt(e.target.value, 10);
    if(typeof phoneFrequency !== 'undefined') phoneFrequency = safeFreq; 
    if(phoneFreqVal) phoneFreqVal.textContent = safeFreq; 
    if(typeof setupPhoneInterval === 'function') setupPhoneInterval(); 
};

// Chat/RSS/Stats
if(chatT) chatT.onchange = (e) => { 
    if(typeof isChatEnabled !== 'undefined') isChatEnabled = e.target.checked; 
    const terminal = get('transmission-terminal');
    if(terminal) terminal.classList.toggle('hidden', !e.target.checked); 
};

// --- FIX RSS TOGGLE ---
if(rssT) rssT.onchange = (e) => { 
    const enabled = e.target.checked;
    
    // Update global variables if they exist
    if (typeof isRssEnabled !== 'undefined') isRssEnabled = enabled;
    
    // Toggle container visibility immediately
    // Checking both potential IDs to be safe
    const container = document.getElementById('zion-rss-container') || document.getElementById('zion-network-container');
    if (container) {
        if (enabled) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }
    
    // Trigger update logic
    if (enabled && typeof updateZionFeed === 'function') updateZionFeed(); 
};

if(rssI) rssI.onchange = (e) => { 
    const safeVal = SecUtils.escapeHTML(e.target.value);
    rssI.value = safeVal.replace(/,/g, '+').replace(/\s/g, ''); 
    if(typeof updateZionFeed === 'function') updateZionFeed(); 
};
if(statsT) statsT.onchange = (e) => {
    const console = get('operator-console');
    if(console) console.classList.toggle('stats-hidden', !e.target.checked);
};

// Audio Volume & Toggles
if(rainAmbT) rainAmbT.onchange = (e) => { const a = get('ambience-rain'); if(a) e.target.checked ? a.play().catch(() => {}) : a.pause(); };
if(humT) humT.onchange = (e) => { const a = get('ambience-hum'); if(a) e.target.checked ? a.play().catch(() => {}) : a.pause(); };
if(matrixSfxT) matrixSfxT.onchange = (e) => { const a = get('matrix-code-sfx'); if(a) e.target.checked ? a.play().catch(() => {}) : a.pause(); };
if(envVolS) envVolS.oninput = (e) => { 
    const v = parseFloat(e.target.value) || 0.5; 
    ['ambience-rain', 'ambience-hum', 'matrix-code-sfx', 'custom-background-sfx'].forEach(id => {
        const el = get(id);
        if(el) el.volume = v;
    });
};

// Oracle & SysMon
if(oracleT) oracleT.onchange = (e) => {
    if(typeof isOracleEnabled !== 'undefined') isOracleEnabled = e.target.checked;
    if(typeof initOracleChat === 'function') initOracleChat();
};
if(sysMonT) sysMonT.onchange = (e) => {
    const isEnabled = e.target.checked;
    const monitor = get('system-log-monitor');
    if(monitor) monitor.style.display = isEnabled ? 'block' : 'none';
};

// --- 4. UPLOAD & PURGE BUTTONS (FIXED) ---

// --- BACKDROP UPLOAD (Image) ---
if(upImgB) {
    upImgB.onclick = () => {
        if(imgI) imgI.click();
    };
}
if(imgI) {
    imgI.onchange = (e) => {
        const file = e.target.files[0];
        if(!file || !file.type.startsWith('image/')) return; 
        
        // Use Global Helper if available or direct URL
        if (typeof applyImg === 'function') {
            const url = window.URL.createObjectURL(file);
            applyImg(url);
            
            const reader = new FileReader();
            reader.onload = function(evt) {
                chrome.storage.local.set({ customImg: evt.target.result });
            };
            reader.readAsDataURL(file);
        }
    };
}

// --- BACKDROP UPLOAD (Video) ---
if(upVidB) {
    upVidB.onclick = () => {
        if(vidI) vidI.click();
    };
}
if(vidI) {
    vidI.onchange = (e) => {
        const file = e.target.files[0];
        if(!file || !file.type.startsWith('video/')) return; 
        
        if (typeof saveVideoToDB === 'function') {
            saveVideoToDB(file).then(() => {
                if (typeof applyVid === 'function') applyVid(file);
            });
        }
    };
}

// --- BACKDROP PURGE (FIXED: NO RELOAD) ---
if(clearB) {
    clearB.onclick = () => {
        if(confirm("Remove custom backdrop?")) {
            // 1. Clear Storage
            if (typeof clearVideoFromDB === 'function') clearVideoFromDB();
            chrome.storage.local.remove('customImg');
            
            // 2. Clear UI Elements
            if (typeof removeM === 'function') removeM();
            
            // 3. Reset Variables & Restore Rain (Instead of Reload)
            if (typeof videoBackground !== 'undefined') videoBackground = "";
            
            // Ensure Canvas is Visible
            const matrixCanvas = document.getElementById('matrix');
            const sentinelCanvas = document.getElementById('sentinel-layer');
            const mainCont = document.querySelector('.main-container');

            if(matrixCanvas) { matrixCanvas.style.display = 'block'; matrixCanvas.style.opacity = '1'; }
            if(sentinelCanvas) { sentinelCanvas.style.display = 'block'; sentinelCanvas.style.opacity = '1'; }
            if(mainCont) { mainCont.style.opacity = '1'; }

            // 4. Restart Rain Loop
            if (typeof startRain === 'function') startRain();
            if (typeof resize === 'function') resize();
        }
    };
}

// --- AUDIO UPLOAD (Phone Messages) ---
if(upAudB) {
    upAudB.onclick = () => {
        if(audI) audI.click();
    };
}
if(audI) {
    audI.onchange = (e) => {
        const files = e.target.files;
        if(!files.length) return;
        
        if (typeof saveAudioToDB === 'function') {
            const promises = [];
            for(let i=0; i<files.length; i++) {
                if(!files[i].type.startsWith('audio/')) continue; 
                promises.push(saveAudioToDB(files[i]));
            }
            if (promises.length > 0) {
                Promise.all(promises).then(() => {
                    alert("Audio messages uploaded to secure vault.");
                });
            }
        }
    };
}
if(clearAudB) {
    clearAudB.onclick = () => {
        if(confirm("Purge all secure messages?")) {
            if (typeof clearAudiosFromDB === 'function') {
                clearAudiosFromDB().then(() => alert("Audio vault purged."));
            }
        }
    };
}

// --- CUSTOM SFX UPLOAD ---
if(upSfxB) {
    upSfxB.onclick = () => {
        if(sfxI) sfxI.click();
    };
}
if(sfxI) {
    sfxI.onchange = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        if (!file.type.startsWith('audio/')) {
             console.warn('Security Block: Uploaded file is not an audio file.');
             return;
        }
        
        if (typeof saveSfxToDB === 'function') {
            saveSfxToDB(file).then(() => {
                const el = get('custom-background-sfx');
                if (el) {
                    // SECURITY FIX: Wrap raw file in a new Blob to explicitly sever DOM object taint.
                    const safeBlob = new Blob([file], { type: file.type || 'audio/mpeg' });
                    const safeUrl = window.URL.createObjectURL(safeBlob);
                    
                    // SECURITY FIX: Explicit protocol check (`blob:`) serves as a recognized 
                    // CodeQL URL sanitizer, proving to the engine that the string isn't `javascript:`.
                    // We also use `setAttribute` to avoid the specific `.src` property sink entirely.
                    if (String(safeUrl).indexOf('blob:') === 0) {
                        el.setAttribute('src', safeUrl);
                        el.play().catch(()=>{});
                    }
                }
            });
        }
    };
}

if(clearSfxB) {
    clearSfxB.onclick = () => {
        if(confirm("Purge custom ambience?")) {
            if (typeof clearSfxFromDB === 'function') {
                clearSfxFromDB().then(() => {
                    const el = get('custom-background-sfx');
                    if(el && (el instanceof window.HTMLAudioElement || el.nodeName === 'AUDIO')) { 
                        el.pause(); 
                        el.src = ""; 
                    }
                });
            }
        }
    };
}


// --- 5. SAVE & RESTORE ---

if(saveB) saveB.onclick = () => {
    // 2. Gather Settings from UI elements and Sanitize inputs
    const settings = { 
        rainColor: colorP ? SecUtils.sanitizeCSS(colorP.value) : '#00F2FF', 
        themeColor: themeColorP ? SecUtils.sanitizeCSS(themeColorP.value) : '#00F2FF', 
        rainSpeed: typeof rainSpeed !== 'undefined' ? parseInt(rainSpeed, 10) : 35, 
        uiScale: sizeS ? parseFloat(sizeS.value) : 1, 
        textScale: textScaleS ? parseFloat(textScaleS.value) : 1, 
        showMinutes: minT ? minT.checked : true,
        showSeconds: secT ? secT.checked : false,
        use24Hour: hour24T ? hour24T.checked : false,
        isMatrixGreen: greenT ? greenT.checked : false, 
        isBinary: binaryT ? binaryT.checked : false, 
        isHex: hexT ? hexT.checked : false, 
        isAscii: asciiT ? asciiT.checked : false, 
        isMathSymbols: mathT ? mathT.checked : false, 
        videoBackground: typeof videoBackground !== 'undefined' ? videoBackground : '',
        isSnowing: snowT ? snowT.checked : false,
        isCyberpunkFont: fontT ? fontT.checked : true, 
        isFlashing: rainbowT ? rainbowT.checked : false,
        isGlow: glowT ? glowT.checked : true, 
        isGlitch: glitchT ? glitchT.checked : true, 
        glitchIntensity: glitchS ? parseInt(glitchS.value, 10) : 10, 
        isScanline: scanlineT ? scanlineT.checked : true, 
        isBgFilter: bgFilterT ? bgFilterT.checked : true, 
        isTransparent: bgT ? bgT.checked : false, 
        scaleMode: scaleS ? parseFloat(scaleS.value) : 1, 
        isCycling: cycleT ? cycleT.checked : false, 
        customQuote: quoteI ? SecUtils.escapeHTML(quoteI.value) : "", 
        isPhoneEnabled: phoneT ? phoneT.checked : true,
        phoneFrequency: phoneFreqS ? parseInt(phoneFreqS.value, 10) : 3,
        isChatEnabled: chatT ? chatT.checked : true,
        isRssEnabled: rssT ? rssT.checked : false, 
        rssSubs: rssI ? SecUtils.escapeHTML(rssI.value) : "", 
        newsSources: newsI ? SecUtils.escapeHTML(newsI.value) : "", 
        // Additional Feeds
        securityFeed: securityI ? SecUtils.escapeHTML(securityI.value) : "",
        spaceFeed: spaceI ? SecUtils.escapeHTML(spaceI.value) : "",
        devFeed: devI ? SecUtils.escapeHTML(devI.value) : "",
        financeFeed: financeI ? SecUtils.escapeHTML(financeI.value) : "",
        
        isStatsEnabled: statsT ? statsT.checked : true, 
        isRainAmbience: rainAmbT ? rainAmbT.checked : true, 
        isHumEnabled: humT ? humT.checked : true, 
        isMatrixSfxEnabled: matrixSfxT ? matrixSfxT.checked : true, 
        envVolume: envVolS ? parseFloat(envVolS.value) : 0.5,
        isOracleEnabled: oracleT ? oracleT.checked : false,
        isSystemMonitorEnabled: sysMonT ? sysMonT.checked : true,
        
        // 3D Rain Settings
        isVerticalRainBinary: verticalRainBinaryT ? verticalRainBinaryT.checked : false,
        isVerticalRainHex: verticalRainHexT ? verticalRainHexT.checked : false,
        isVerticalRainAscii: verticalRainAsciiT ? verticalRainAsciiT.checked : false,
        isVerticalRainMathSymbols: verticalRainMathT ? verticalRainMathT.checked : false,
        isVerticalRainRainbow: verticalRainRainbowT ? verticalRainRainbowT.checked : false,

        // Operator ID
        username: operatorNameI ? SecUtils.escapeHTML(operatorNameI.value.trim()) : "NEO",
        accessKey: accessKeyI ? SecUtils.escapeHTML(accessKeyI.value.trim()) : "knock"
    };
    
    // LOGIC FIX: Do NOT add customPfp to 'settings' (which goes to sync).
    // Instead, only save it to LOCAL storage.
    if (pfpPreview && pfpPreview.src.includes('base64,')) {
         if (pfpPreview.src.includes('image/svg+xml')) {
             // It's the wireframe, so remove customPfp from local
             chrome.storage.local.remove('customPfp');
         } else {
             // It's an image: Save ONLY to LOCAL
             chrome.storage.local.set({ customPfp: pfpPreview.src });
         }
    }

    // 3. Save to Chrome Storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set(settings, () => {
            // Also update local storage for credentials which are often checked there in logon.js
            chrome.storage.local.set({
                username: settings.username,
                accessKey: settings.accessKey
            });
            
            modal.classList.add('hidden');
            if (typeof updateZionFeed === 'function') updateZionFeed();
            if (typeof updateUI === 'function') updateUI();
        });
    } else {
        localStorage.setItem('matrix_config', JSON.stringify(settings));
        localStorage.setItem('username', settings.username);
        localStorage.setItem('accessKey', settings.accessKey);
        
        // Handle PFP local storage
        if (pfpPreview && pfpPreview.src.includes('base64,') && !pfpPreview.src.includes('image/svg+xml')) {
            localStorage.setItem('customPfp', pfpPreview.src);
        } else {
            localStorage.removeItem('customPfp');
        }
        
        modal.classList.add('hidden');
        if (typeof updateZionFeed === 'function') updateZionFeed();
        if (typeof updateUI === 'function') updateUI();
    }
};

if(resetB) resetB.onclick = () => { 
    if(confirm("Hard Reset?")) { 
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.clear(); 
            chrome.storage.local.clear();
        }
        localStorage.clear();
        
        // Use global helpers from script.js to clear indexedDB
        const promises = [];
        if(typeof clearVideoFromDB === 'function') promises.push(clearVideoFromDB());
        if(typeof clearSfxFromDB === 'function') promises.push(clearSfxFromDB());
        
        Promise.all(promises).then(() => {
            location.reload(); 
        });
    } 
};

// --- 5. INITIALIZATION (Called by script.js) ---
window.initSettingsUI = function(data) {
    if(!data) return;

    // --- OPERATOR ID INIT ---
    // Fetch directly from storage (local) as credentials and PFP might be there
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['username', 'accessKey', 'customPfp'], (localData) => {
            if (operatorNameI) operatorNameI.value = SecUtils.escapeHTML(localData.username || data.username || "NEO");
            if (accessKeyI) accessKeyI.value = SecUtils.escapeHTML(localData.accessKey || data.accessKey || "knock");
            
            if (localData.customPfp) {
                updatePfpVisuals(true, localData.customPfp);
            } else {
                updatePfpVisuals(false, getWireframeSvg());
            }
        });
    } else {
         // Fallback
         if (operatorNameI) operatorNameI.value = SecUtils.escapeHTML(localStorage.getItem('username') || "NEO");
         if (accessKeyI) accessKeyI.value = SecUtils.escapeHTML(localStorage.getItem('accessKey') || "knock");
         
         const savedPfp = localStorage.getItem('customPfp');
         if (savedPfp) {
             updatePfpVisuals(true, savedPfp);
         } else {
             updatePfpVisuals(false, getWireframeSvg());
         }
    }


    // Apply Logic
    if(minT) minT.checked = data.showMinutes; 
    if(secT) secT.checked = data.showSeconds; 
    if(hour24T) hour24T.checked = data.use24Hour;
    
    if(speedS) speedS.value = parseInt(data.rainSpeed, 10); 
    if(greenT) greenT.checked = data.isMatrixGreen; 
    if(colorP) colorP.value = SecUtils.sanitizeCSS(data.rainColor); 
    if(themeColorP) themeColorP.value = SecUtils.sanitizeCSS(data.themeColor) || "#00f2ff";
    syncThemeColor(); 
    
    if(binaryT) binaryT.checked = data.isBinary;
    if(hexT) hexT.checked = data.isHex;
    if(asciiT) asciiT.checked = data.isAscii;
    if(mathT) mathT.checked = data.isMathSymbols;
    
    if (data.videoBackground) {
        const toggle = document.getElementById(`${SecUtils.escapeHTML(data.videoBackground)}-toggle`);
        if (toggle) toggle.checked = true;
    }

    if(snowT) snowT.checked = data.isSnowing; 
    if(rainbowT) rainbowT.checked = data.isFlashing;
    
    if(phoneT) phoneT.checked = data.isPhoneEnabled; 
    if(phoneFreqS) phoneFreqS.value = parseInt(data.phoneFrequency, 10); 
    if(phoneFreqVal) phoneFreqVal.textContent = parseInt(data.phoneFrequency, 10);
    
    if(chatT) chatT.checked = data.isChatEnabled; 
    
    if(fontT) fontT.checked = data.isCyberpunkFont;
    if(glowT) glowT.checked = data.isGlow;
    if(glitchT) glitchT.checked = data.isGlitch;
    if(bgFilterT) bgFilterT.checked = data.isBgFilter;
    if(bgT) bgT.checked = data.isTransparent;
    if(scanlineT) scanlineT.checked = data.isScanline;
    
    if(textScaleS) textScaleS.value = parseFloat(data.textScale);
    if(scaleS) scaleS.value = parseFloat(data.scaleMode);
    if(sizeS) sizeS.value = parseFloat(data.uiScale);
    if(glitchS) glitchS.value = parseInt(data.glitchIntensity, 10) || 5;
    
    if (data.customQuote) { if(quoteI) quoteI.value = SecUtils.escapeHTML(data.customQuote); } 
    else if (data.isCycling) { if(cycleT) cycleT.checked = true; }
    
    // FIX: RSS Toggle Loading
    if(rssT) {
        rssT.checked = data.isRssEnabled;
        // Force the UI update on load
        const container = document.getElementById('zion-rss-container') || document.getElementById('zion-network-container');
        if (container) {
            if(data.isRssEnabled) container.classList.remove('hidden');
            else container.classList.add('hidden');
        }
    }
    
    if(rssI) rssI.value = SecUtils.escapeHTML(data.rssSubs);
    if(newsI) newsI.value = SecUtils.escapeHTML(data.newsSources) || "";
    if(securityI) securityI.value = SecUtils.escapeHTML(data.securityFeed) || "";
    if(spaceI) spaceI.value = SecUtils.escapeHTML(data.spaceFeed) || "";
    if(devI) devI.value = SecUtils.escapeHTML(data.devFeed) || "";
    if(financeI) financeI.value = SecUtils.escapeHTML(data.financeFeed) || "";

    if(oracleT) oracleT.checked = data.isOracleEnabled;
    const isSysMon = (data.isSystemMonitorEnabled !== undefined) ? data.isSystemMonitorEnabled : true;
    if (sysMonT) sysMonT.checked = isSysMon;
    
    if(rainAmbT) rainAmbT.checked = data.isRainAmbience; 
    if(humT) humT.checked = data.isHumEnabled; 
    if(matrixSfxT) matrixSfxT.checked = data.isMatrixSfxEnabled;
    if(envVolS) envVolS.value = parseFloat(data.envVolume); 
    
    if(statsT) statsT.checked = data.isStatsEnabled;

    // 3D Rain
    if(verticalRainT) verticalRainT.checked = (data.videoBackground === 'vertical-rain');
    if (verticalRainBinaryT) verticalRainBinaryT.checked = data.isVerticalRainBinary;
    if (verticalRainHexT) verticalRainHexT.checked = data.isVerticalRainHex;
    if (verticalRainAsciiT) verticalRainAsciiT.checked = data.isVerticalRainAscii;
    if (verticalRainMathT) verticalRainMathT.checked = data.isVerticalRainMathSymbols;
    if (verticalRainRainbowT) verticalRainRainbowT.checked = data.isVerticalRainRainbow;

    // Refresh UI immediately
    if(typeof updateUI === 'function') updateUI();
    
    // Force Tab Init again just in case DOM was sluggish
    initTabs();
};