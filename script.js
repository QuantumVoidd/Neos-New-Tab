// Base Matrix Config
const canvas = document.getElementById('matrix'), ctx = canvas.getContext('2d');
const sCanvas = document.getElementById('sentinel-layer'), sCtx = sCanvas.getContext('2d');
const mainContainer = document.querySelector('.main-container');
const MATRIX_ALPHABET = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789", BINARY_ALPHABET = "01", CLASSIC_GREEN = "#00FF41", fontSize = 16;
const MATRIX_QUOTES = ["There is no spoon.", "Free your mind.", "I know kung fu.", "Follow the white rabbit.", "The answer is out there.", "Welcome to the desert of the real.", "Ignorance is bliss.", "Choice is an illusion."];

const DEFAULTS = { rainColor: "#00f2ff", rainSpeed: 35, uiScale: "1", textScale: "1.2", showMinutes: true, showSeconds: false, use24Hour: false, isMatrixGreen: false, isBinary: false, isCyberpunkFont: false, isFlashing: false, isTransparent: false, isGlow: false, isScanline: false, isBgFilter: false, isGlitch: false, glitchIntensity: 5, scaleMode: "cover", isCycling: false, customQuote: "", isSnowing: false, isPhoneEnabled: true, phoneFrequency: 3, isChatEnabled: true, isRssEnabled: false, rssSubs: "matrix+cyberpunk" };

let rainColor = DEFAULTS.rainColor, rainSpeed = DEFAULTS.rainSpeed, rainInterval, rainDrops = [], showMinutes = DEFAULTS.showMinutes, showSeconds = DEFAULTS.showSeconds, use24Hour = DEFAULTS.use24Hour, isMatrixGreen = DEFAULTS.isMatrixGreen, isBinary = DEFAULTS.isBinary, isFlashing = DEFAULTS.isFlashing, currentAlphabet = MATRIX_ALPHABET, quoteInterval;

let isPhoneEnabled = DEFAULTS.isPhoneEnabled, phoneFrequency = DEFAULTS.phoneFrequency, ringCycleInterval;
let isChatEnabled = DEFAULTS.isChatEnabled;

// --- INDEXEDDB FOR STORAGE ---
const dbName = "MatrixBackdropDB";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 2); 
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("videos")) db.createObjectStore("videos");
            if (!db.objectStoreNames.contains("audios")) db.createObjectStore("audios", { autoIncrement: true });
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
}

// --- ZION NETWORK RSS LOGIC ---
const rssIntervals = new Map();
const rssIterations = new Map();

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
searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && searchInput.value.trim() !== "") chrome.search.query({ text: searchInput.value }); });

// --- SETTINGS ---
const get = (id) => document.getElementById(id);
const modal = get('settings-modal'), sizeS = get('size-slider'), textScaleS = get('text-scale-slider'), speedS = get('speed-slider'), colorP = get('color-picker');
const minT = get('show-minutes'), secT = get('show-seconds'), hour24T = get('use-24hour'), greenT = get('matrix-green'), binaryT = get('binary-mode'), snowT = get('snow-toggle'), fontT = get('font-toggle'), rainbowT = get('rainbow-toggle'), glowT = get('glow-toggle'), glitchT = get('glitch-toggle'), glitchS = get('glitch-slider'), scanlineT = get('scanline-toggle'), bgFilterT = get('bg-filter-toggle'), bgT = get('bg-toggle'), quoteI = get('quote-input'), saveB = get('save-settings'), scaleS = get('scale-mode'), cycleT = get('cycle-quotes'), resetB = get('restore-defaults');
const imgI = get('image-input'), vidI = get('video-input'), upImgB = get('upload-image-btn'), upVidB = get('upload-video-btn'), clearB = get('clear-backdrop');
const phoneT = get('phone-toggle'), phoneFreqS = get('phone-freq-slider'), phoneFreqVal = get('phone-freq-value'), chatT = get('chat-toggle');
const audI = get('audio-input'), upAudB = get('upload-audio-btn'), clearAudB = get('clear-audios');
const rssT = get('rss-toggle'), rssI = get('rss-input');

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
colorP.oninput = (e) => { if (!isMatrixGreen) syncThemeColor(); };
quoteI.oninput = (e) => { const val = e.target.value; if (val.trim() !== "") { stopQuoteCycling(); cycleT.checked = false; get('display-quote').textContent = `"${val}"`; } else if (!cycleT.checked) { get('display-quote').textContent = '"There is no spoon."'; } };
minT.onchange = (e) => { showMinutes = e.target.checked; updateUI(); };
secT.onchange = (e) => { showSeconds = e.target.checked; updateUI(); };
hour24T.onchange = (e) => { use24Hour = e.target.checked; updateUI(); };
binaryT.onchange = (e) => { isBinary = e.target.checked; currentAlphabet = isBinary ? BINARY_ALPHABET : MATRIX_ALPHABET; };
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
rssI.onchange = (e) => {
    const val = e.target.value.replace(/,/g, '+').replace(/\s/g, '');
    rssI.value = val;
    chrome.storage.sync.set({ rssSubs: val });
    updateZionFeed();
};

saveB.onclick = () => {
    const settings = { rainColor: colorP.value, rainSpeed, uiScale: sizeS.value, textScale: textScaleS.value, showMinutes, showSeconds, use24Hour, isMatrixGreen, isBinary, isSnowing, isCyberpunkFont: fontT.checked, isFlashing, isGlow: glowT.checked, isGlitch: glitchT.checked, glitchIntensity: glitchS.value, isScanline: scanlineT.checked, isBgFilter: bgFilterT.checked, isTransparent: bgT.checked, scaleMode: scaleS.value, isCycling: cycleT.checked, customQuote: quoteI.value, isPhoneEnabled, phoneFrequency, isChatEnabled, isRssEnabled: rssT.checked, rssSubs: rssI.value };
    chrome.storage.sync.set(settings, () => modal.classList.add('hidden'));
};

resetB.onclick = () => { if(confirm("Hard Reset?")) { chrome.storage.sync.clear(); clearVideoFromDB().then(() => location.reload()); } };
upImgB.onclick = () => imgI.click();
imgI.onchange = (e) => { if(!e.target.files[0]) return; const r = new FileReader(); r.onload = (ev) => { applyImg(ev.target.result); chrome.storage.local.set({ customImg: ev.target.result }); clearVideoFromDB(); }; r.readAsDataURL(e.target.files[0]); };
upVidB.onclick = () => vidI.click();
vidI.onchange = (e) => { const file = e.target.files[0]; if(!file) return; applyVid(file); saveVideoToDB(file); chrome.storage.local.remove('customImg'); };
clearB.onclick = () => { removeM(); chrome.storage.local.remove('customImg'); clearVideoFromDB(); };
upAudB.onclick = () => audI.click();
audI.onchange = async (e) => { for(let file of e.target.files) await saveAudioToDB(file); alert("Messages stored."); };
clearAudB.onclick = () => { if(confirm("Purge all messages?")) clearAudiosFromDB(); };

function startQuoteCycling() { stopQuoteCycling(); let idx = 0; quoteInterval = setInterval(() => { const qEl = get('display-quote'); qEl.style.opacity = 0; setTimeout(() => { qEl.textContent = `"${MATRIX_QUOTES[idx]}"`; qEl.style.opacity = 0.9; idx = (idx + 1) % MATRIX_QUOTES.length; }, 500); }, 15000); }
function stopQuoteCycling() { clearInterval(quoteInterval); }

function setupPhoneInterval() { clearInterval(ringCycleInterval); if (isPhoneEnabled) ringCycleInterval = setInterval(triggerRinging, phoneFrequency * 60000); }

let isProcessingPhone = false;

function triggerRinging() { 
    if (isProcessingPhone || !isPhoneEnabled) return; 
    const ringAudio = get('ring-audio');
    ringAudio.src = "ringing.mp3"; 
    get('phone-container').classList.add('ringing'); 
    ringAudio.play().catch(() => {}); 
}

function initPhoneSystem() {
    const phoneCont = get('phone-container'), transText = get('transmission-text'), transAudio = get('transmission-audio'), ringAudio = get('ring-audio');
    const pool = [["ESTABLISHING LINK...", "CONNECTION SECURED.", "THEY'RE WATCHING YOU, NEO.", "GOODBYE."], ["SYSTEM BREACH...", "KNOCK, KNOCK, NEO.", "FOLLOW THE WHITE RABBIT.", "RUN."]];
    const speakText = (text) => { const utterance = new SpeechSynthesisUtterance(text.toLowerCase().replace(/[^a-zA-Z ,.?!]/g, "")); utterance.rate = 0.8; utterance.pitch = 0.1; window.speechSynthesis.speak(utterance); };
    phoneCont.onclick = async () => {
        if (phoneCont.classList.contains('ringing') && !isProcessingPhone) {
            isProcessingPhone = true; phoneCont.classList.remove('ringing'); 
            ringAudio.pause(); ringAudio.src = ""; // Kill Ring Icon
            phoneCont.classList.add('receiving');
            const userAudios = await getAudiosFromDB();
            if (userAudios.length > 0) {
                const blob = userAudios[Math.floor(Math.random() * userAudios.length)]; transAudio.src = URL.createObjectURL(blob); transText.textContent = "ENCRYPTED TRANSMISSION..."; transAudio.play().catch(() => {});
                transAudio.onended = () => { URL.revokeObjectURL(transAudio.src); transAudio.src = ""; finishCall(); };
            } else {
                const seq = pool[Math.floor(Math.random() * pool.length)]; let step = 0;
                const timer = setInterval(() => { if (step >= seq.length) { clearInterval(timer); setTimeout(finishCall, 2500); return; } const currentLine = seq[step++]; transText.textContent = currentLine; speakText(currentLine); }, 1800);
            }
        }
    };
    function finishCall() { 
        const hangup = get('hangup-audio'); hangup.src = "hangup.mp3"; hangup.play(); 
        hangup.onended = () => { hangup.src = ""; }; // Kill Hangup Icon
        setTimeout(() => { phoneCont.classList.remove('receiving'); transText.textContent = "INCOMING SIGNAL..."; isProcessingPhone = false; }, 1200); 
    }
    setupPhoneInterval();
}

const CHAT_SCRIPTS = [
    [
        {u:"MORPHEUS", t:"Neo, sooner or later you're going to realize...", c:"morpheus"},
        {u:"MORPHEUS", t:"...there's a difference between knowing the path and walking the path.", c:"morpheus"}
    ],
    [
        {u:"TRINITY", t:"Please, Neo. You have to trust me.", c:"trinity"},
        {u:"NEO", t:"Why?", c:"neo"},
        {u:"TRINITY", t:"Because you have been down there, Neo. You know that road.", c:"trinity"}
    ],
    [
        {u:"AGENT SMITH", t:"It is purpose that created us.", c:"smith"},
        {u:"AGENT SMITH", t:"Purpose that connects us. Purpose that pulls us.", c:"smith"},
        {u:"AGENT SMITH", t:"It is purpose that defines us.", c:"smith"}
    ],
    [
        {u:"ORACLE", t:"I'd ask you to sit down, but you're not going to anyway.", c:"oracle"},
        {u:"ORACLE", t:"And don't worry about the vase.", c:"oracle"},
        {u:"NEO", t:"What vase?", c:"neo"}
    ],
    [
        {u:"MORPHEUS", t:"This is your last chance. After this, there is no turning back.", c:"morpheus"},
        {u:"MORPHEUS", t:"You take the blue pill—the story ends.", c:"morpheus"},
        {u:"MORPHEUS", t:"You take the red pill—you stay in Wonderland.", c:"morpheus"}
    ],
    [
        {u:"TRINITY", t:"The answer is out there, Neo.", c:"trinity"},
        {u:"TRINITY", t:"It's looking for you, and it will find you if you want it to.", c:"trinity"}
    ]
];

async function runChatTerminal() {
    if (!isChatEnabled) return;
    const script = CHAT_SCRIPTS[Math.floor(Math.random() * CHAT_SCRIPTS.length)]; const log = get('chat-log'), beep = get('signal-beep');
    for (const line of script) {
        if (!isChatEnabled) break; await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
        const div = document.createElement('div'); div.className = 'chat-msg'; div.innerHTML = `<b class="${line.c}">${line.u}:</b> ${line.t}`; log.appendChild(div); 
        
        // Exact pin to the bottom scroll limit
        log.scrollTo({
            top: log.scrollHeight,
            behavior: 'auto'
        });
        
        beep.src = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTtvT18AAAAA";
        beep.play().catch(()=>{}); beep.onended = () => beep.src = "";
    }
    setTimeout(runChatTerminal, 10000 + Math.random() * 10000);
}

chrome.storage.sync.get(null, (d) => {
    const data = { ...DEFAULTS, ...d };
    rainSpeed = data.rainSpeed; speedS.value = rainSpeed; isMatrixGreen = data.isMatrixGreen; greenT.checked = isMatrixGreen; colorP.value = data.rainColor; syncThemeColor();
    isBinary = data.isBinary; binaryT.checked = isBinary; currentAlphabet = isBinary ? BINARY_ALPHABET : MATRIX_ALPHABET;
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
    resize(); startRain(); animateSentinels(); updateUI(); initPhoneSystem(); runChatTerminal(); mainContainer.style.opacity = "1";
});

setInterval(() => updateZionFeed(true), 120000); // Real-time RSS refresh every 2 mins

chrome.storage.local.get(['customImg'], (res) => { if(res.customImg) applyImg(res.customImg); else loadVideoFromDB().then(file => { if(file) applyVid(file); }); });
window.onresize = resize;
setInterval(updateUI, 1000);