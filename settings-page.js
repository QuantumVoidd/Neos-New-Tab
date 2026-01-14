/**
 * SETTINGS PAGE LOGIC
 * Handles the configuration menu, toggles, and saving preferences.
 * Depends on global variables (rainSpeed, etc.) defined in script.js.
 */

// Helper to select elements
const get = (id) => document.getElementById(id);

// --- DOM ELEMENTS ---
const modal = get('settings-modal'), sizeS = get('size-slider'), textScaleS = get('text-scale-slider'), speedS = get('speed-slider');
const colorP = get('color-picker'); 
const themeColorP = get('theme-color-picker'); 

const minT = get('show-minutes'), secT = get('show-seconds'), hour24T = get('use-24hour'), greenT = get('matrix-green'), binaryT = get('binary-mode'), hexT = get('hex-mode'), asciiT = get('ascii-mode'), bamumT = get('bamum-mode'), mathT = get('math-mode'), emojiT = get('emoji-mode'), snowT = get('snow-toggle'), fontT = get('font-toggle'), rainbowT = get('rainbow-toggle'), glowT = get('glow-toggle'), glitchT = get('glitch-toggle'), glitchS = get('glitch-slider'), scanlineT = get('scanline-toggle'), bgFilterT = get('bg-filter-toggle'), bgT = get('bg-toggle'), quoteI = get('quote-input'), saveB = get('save-settings'), scaleS = get('scale-mode'), cycleT = get('cycle-quotes'), resetB = get('restore-defaults');
const imgI = get('image-input'), vidI = get('video-input'), upImgB = get('upload-image-btn'), upVidB = get('upload-video-btn'), clearB = get('clear-backdrop');
const phoneT = get('phone-toggle'), phoneFreqS = get('phone-freq-slider'), phoneFreqVal = get('phone-freq-value'), chatT = get('chat-toggle');
const audI = get('audio-input'), upAudB = get('upload-audio-btn'), clearAudB = get('clear-audios');
const rssT = get('rss-toggle'), rssI = get('rss-input'), newsI = get('news-input'), statsT = get('stats-toggle');
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
const sysMonT = get('system-monitor-toggle');

// --- HELPER FUNCTIONS ---

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

// --- SMART RSS CONVERTER ---
const RSS_MAPPINGS = {
    // --- UK News ---
    "bbc.com": "http://feeds.bbci.co.uk/news/rss.xml",
    "bbc.co.uk": "http://feeds.bbci.co.uk/news/rss.xml",
    "news.sky.com": "https://feeds.skynews.com/feeds/rss/home.xml", 
    "sky.news.com": "https://feeds.skynews.com/feeds/rss/home.xml", // Handles your typo
    "skynews.com": "https://feeds.skynews.com/feeds/rss/home.xml",
    "sky.com": "https://feeds.skynews.com/feeds/rss/home.xml",      
    "guardian.com": "https://www.theguardian.com/world/rss",
    "theguardian.com": "https://www.theguardian.com/world/rss",
    
    // --- US/World News ---
    "cnn.com": "http://rss.cnn.com/rss/cnn_topstories.rss",
    "nytimes.com": "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "reuters.com": "https://www.reutersagency.com/feed/?best-topics=politics&post_type=best",
    "aljazeera.com": "https://www.aljazeera.com/xml/rss/all.xml",
    "wsj.com": "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
    "forbes.com": "https://www.forbes.com/most-popular/feed/",
    "vice.com": "https://www.vice.com/en/rss",
    "vox.com": "https://www.vox.com/rss/index.xml",

    // --- Tech ---
    "theverge.com": "https://www.theverge.com/rss/index.xml",
    "wired.com": "https://www.wired.com/feed/rss",
    "techcrunch.com": "https://techcrunch.com/feed/",
    "arstechnica.com": "https://feeds.arstechnica.com/arstechnica/index",
    "engadget.com": "https://www.engadget.com/rss.xml",
    "gizmodo.com": "https://gizmodo.com/rss",
    "lifehacker.com": "https://lifehacker.com/rss",
    "mashable.com": "https://mashable.com/feed/",
    
    // --- Gaming ---
    "ign.com": "https://feeds.ign.com/ign/news",
    "gamespot.com": "https://www.gamespot.com/feeds/news/",
    "kotaku.com": "https://kotaku.com/rss",
    "polygon.com": "https://www.polygon.com/rss/index.xml",
    "pcgamer.com": "https://www.pcgamer.com/rss/",
    "eurogamer.net": "https://www.eurogamer.net/?format=rss"
};

function smartConvertRss(input) {
    if (!input) return "";
    
    // Split by + (also handles commas as separators)
    let parts = input.split(/[+,]/).map(s => s.trim()).filter(s => s);
    
    let converted = parts.map(url => {
        let clean = url.toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');
            
        // 1. Check Known Map
        for (let [domain, rss] of Object.entries(RSS_MAPPINGS)) {
            // Match exact domain, domain/rss, or domain/feed
            if (clean === domain || clean === domain + "/rss" || clean === domain + "/feed") {
                return rss;
            }
        }
        
        // 2. Reddit Shortcuts (r/cyberpunk)
        if (clean.includes("reddit.com/r/") || clean.startsWith("r/")) {
            let sub = clean.includes("/r/") ? clean.split("/r/")[1].split("/")[0] : clean.split("r/")[1];
            return `https://www.reddit.com/r/${sub}/top.rss?t=day`;
        }
        
        // 3. Google News Shortcut
        if (clean.includes("news.google.com") || clean === "google news") {
             return `https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en`;
        }

        // 4. Heuristic: If it looks like a domain but missing protocol, try adding https + /rss
        // Only if it doesn't already have .xml or .rss extension
        if (!url.startsWith("http") && !url.endsWith(".xml") && !url.endsWith(".rss") && clean.includes(".")) {
             return `https://${clean}/rss`; 
        }
        
        return url;
    });
    
    return converted.join('+');
}

// --- EVENT LISTENERS ---

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

if (sysMonT) {
    sysMonT.onchange = (e) => {
        const isEnabled = e.target.checked;
        const monitor = get('system-log-monitor');
        if(monitor) monitor.style.display = isEnabled ? 'block' : 'none';
        chrome.storage.sync.set({ isSystemMonitorEnabled: isEnabled });
    };
}

upSfxB.onclick = () => sfxI.click();
sfxI.onchange = async (e) => { const f = e.target.files[0]; if(!f) return; await saveSfxToDB(f); const a = get('custom-background-sfx'); a.src = URL.createObjectURL(f); a.play().catch(() => {}); };
clearSfxB.onclick = () => { if(confirm("Purge custom SFX?")) { clearSfxFromDB(); get('custom-background-sfx').pause(); get('custom-background-sfx').src = ""; } };

saveB.onclick = () => {
    // Process News Input with Smart Converter
    const rawNews = newsI ? newsI.value : "";
    const processedNews = smartConvertRss(rawNews);
    
    // Update input box immediately so user sees the change
    if (newsI) newsI.value = processedNews;

    const s = { 
        rainColor: colorP.value, themeColor: themeColorP.value, rainSpeed, uiScale: sizeS.value, textScale: textScaleS.value, 
        showMinutes, showSeconds, use24Hour, isMatrixGreen, isBinary, isHex, isAscii, isMathSymbols, videoBackground,
        isSnowing, isCyberpunkFont: fontT.checked, isFlashing, isGlow: glowT.checked, isGlitch: glitchT.checked, 
        glitchIntensity: glitchS.value, isScanline: scanlineT.checked, isBgFilter: bgFilterT.checked, 
        isTransparent: bgT.checked, scaleMode: scaleS.value, isCycling: cycleT.checked, customQuote: quoteI.value, 
        isPhoneEnabled, phoneFrequency, isChatEnabled, isRssEnabled: rssT.checked, rssSubs: rssI.value, 
        newsSources: processedNews, // Save converted URLs
        isStatsEnabled: statsT.checked, isRainAmbience: rainAmbT.checked, isHumEnabled: humT.checked, 
        isMatrixSfxEnabled: matrixSfxT.checked, envVolume: envVolS.value,
        isOracleEnabled: oracleT ? oracleT.checked : false,
        isSystemMonitorEnabled: sysMonT ? sysMonT.checked : true
    };
    chrome.storage.sync.set(s, () => {
        modal.classList.add('hidden');
        if (settingsRainInterval) clearInterval(settingsRainInterval);
        
        // --- FORCE FEED REFRESH ON SAVE ---
        if (typeof window.updateZionFeed === 'function') {
            window.updateZionFeed();
        }
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

// --- INITIALIZATION FUNCTION ---
// This is called by script.js when data is loaded
window.initSettingsUI = function(data) {
    speedS.value = data.rainSpeed; 
    greenT.checked = data.isMatrixGreen; 
    colorP.value = data.rainColor; 
    themeColorP.value = data.themeColor || "#00f2ff";
    syncThemeColor(); 
    
    binaryT.checked = data.isBinary;
    hexT.checked = data.isHex;
    asciiT.checked = data.isAscii;
    mathT.checked = data.isMathSymbols;
    
    if (data.videoBackground) {
        const toggle = document.getElementById(`${data.videoBackground}-toggle`);
        if (toggle) toggle.checked = true;
    }

    snowT.checked = data.isSnowing; 
    rainbowT.checked = data.isFlashing;
    minT.checked = data.showMinutes; 
    secT.checked = data.showSeconds; 
    hour24T.checked = data.use24Hour;
    
    phoneT.checked = data.isPhoneEnabled; 
    phoneFreqS.value = data.phoneFrequency; 
    phoneFreqVal.textContent = data.phoneFrequency;
    
    chatT.checked = data.isChatEnabled; 
    
    fontT.checked = data.isCyberpunkFont;
    glowT.checked = data.isGlow;
    glitchT.checked = data.isGlitch;
    bgFilterT.checked = data.isBgFilter;
    bgT.checked = data.isTransparent;
    scanlineT.checked = data.isScanline;
    
    textScaleS.value = data.textScale;
    scaleS.value = data.scaleMode;
    sizeS.value = data.uiScale;
    
    if (data.customQuote) { quoteI.value = data.customQuote; } 
    else if (data.isCycling) { cycleT.checked = true; }
    
    rssT.checked = data.isRssEnabled; 
    rssI.value = data.rssSubs;
    if (newsI) newsI.value = data.newsSources || "";

    if(oracleT) oracleT.checked = data.isOracleEnabled;
    
    const isSysMon = (data.isSystemMonitorEnabled !== undefined) ? data.isSystemMonitorEnabled : true;
    if (sysMonT) sysMonT.checked = isSysMon;
    
    rainAmbT.checked = data.isRainAmbience; 
    humT.checked = data.isHumEnabled; 
    matrixSfxT.checked = data.isMatrixSfxEnabled;
    envVolS.value = data.envVolume; 
    
    statsT.checked = data.isStatsEnabled;
};