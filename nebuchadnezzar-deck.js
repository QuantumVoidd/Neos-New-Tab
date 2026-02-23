/**
 * NEBUCHADNEZZAR DECK CONTROLLER
 * Handles Operator Console Stats (CPU, RAM, PWR, NET, I/O)
 */

// Global state for stats
let lastCpuInfo = null;
window.networkData = { sent: 0, received: 0, lastUpdate: Date.now() }; 
let networkHistory = [];
const MAX_NETWORK_HISTORY = 60;

// Track music state to handle transitions
let wasMusicActive = true; 

/**
 * Main update function called by the global loop
 */
function updateNebuchadnezzarDeck() {
    // Safely run hardware stats without crashing the loop
    try {
        updateCpuStat();
        updateMemStat();
        updateBatteryStat();
    } catch (e) {
        // Ignore hardware stat errors (common in non-extension environments)
    }
    
    // 1. Check Music State
    let isMusicActive = false;
    if (window.globalMediaPlayer && window.globalMediaPlayer.mediaElement && !window.globalMediaPlayer.mediaElement.paused) {
        isMusicActive = true;
    }

    // 2. Visualizer Logic
    if (isMusicActive) {
         updateDeckVisualizer();
         wasMusicActive = true;
    } else {
        // 3. Reset Logic (Self-Healing)
        // Check if the lights are "naked" (missing background color)
        const firstLed = document.querySelector('#operator-console .led');
        const isLedInvisible = firstLed && (!firstLed.style.background || firstLed.style.background === '');

        // Force reset if music just stopped OR if lights are invisible
        if (wasMusicActive || isLedInvisible) {
            resetDeckLeds();
            wasMusicActive = false;
        }
        
        // 4. Run Network Stats (Throttled)
        if (Date.now() - window.networkData.lastUpdate > 2000) {
            updateNetworkStats();
        }
    }
}

function updateCpuStat() {
    const cpuFill = document.getElementById('cpu-fill');
    // Safety check for Chrome API
    if (window.chrome && window.chrome.system && window.chrome.system.cpu && cpuFill) {
        chrome.system.cpu.getInfo((info) => {
            if (lastCpuInfo) {
                let totalDiff = 0, idleDiff = 0;
                for (let i = 0; i < info.processors.length; i++) {
                    const usage = info.processors[i].usage, lastUsage = lastCpuInfo.processors[i].usage;
                    totalDiff += (usage.user - lastUsage.user) + (usage.kernel - lastUsage.kernel) + (usage.idle - lastUsage.idle);
                    idleDiff += (usage.idle - lastUsage.idle);
                }
                const cpuPercent = Math.max(Math.round((1 - (idleDiff / totalDiff)) * 100), 5);
                cpuFill.style.height = `${cpuPercent}%`;
            }
            lastCpuInfo = info;
        });
    }
}

function updateMemStat() {
    const memFill = document.getElementById('mem-fill');
    if (window.chrome && window.chrome.system && window.chrome.system.memory && memFill) {
        chrome.system.memory.getInfo((info) => {
            const memPercent = Math.round(((info.capacity - info.availableCapacity) / info.capacity) * 100);
            memFill.style.height = `${memPercent}%`;
        });
    }
}

function updateBatteryStat() {
    const pwrFill = document.getElementById('pwr-fill');
    if (navigator.getBattery && pwrFill) {
        navigator.getBattery().then(battery => {
            const pwrPercent = Math.round(battery.level * 100);
            pwrFill.style.height = `${pwrPercent}%`;
        });
    }
}

// --- VISUALIZER: SYNC ALL LEDS TO MUSIC ---
function updateDeckVisualizer() {
    const leds = document.querySelectorAll('#operator-console .led');
    const ioFill = document.getElementById('io-fill');
    
    if (leds.length === 0) return;

    const time = Date.now() / 100; 
    
    leds.forEach((led, i) => {
        // Generate wave pattern
        const intensity = Math.sin(time + (i * 1.5)) * Math.random(); 
        
        // Force transition for smooth effect
        led.style.transition = 'background 0.1s, box-shadow 0.1s, opacity 0.1s'; 

        if (intensity > 0.2) {
            // Active Beat: Flash Cyan or Purple
            const color = i % 2 === 0 ? '#00f2ff' : '#ae00ff';
            led.style.background = color;
            led.style.boxShadow = `0 0 10px ${color}`;
            led.style.opacity = '1';
        } else {
            // Off Beat: Dim Red (Keeps structure visible)
            led.style.background = '#330000';
            led.style.boxShadow = 'none';
            led.style.opacity = '0.6';
        }
    });
    
    // Animate I/O bar
    if (ioFill) {
        const vuLevel = Math.max(10, Math.random() * 100); 
        ioFill.style.height = `${vuLevel}%`;
        ioFill.style.background = `linear-gradient(to top, var(--theme-color) 0%, ${vuLevel > 80 ? '#fff' : 'var(--theme-color)'} 100%)`;
    }
}

// --- RESET FUNCTION: FORCE SYSTEM READY STATE ---
function resetDeckLeds() {
    const leds = document.querySelectorAll('#operator-console .led');
    if (!leds.length) return;

    leds.forEach(led => {
        // FORCE INLINE STYLES (Bypasses CSS Class issues)
        led.style.transition = 'background 0.3s ease';
        led.style.background = '#00FF41'; // Matrix Green
        led.style.boxShadow = '0 0 5px #00FF41';
        led.style.opacity = '1';
    });
    
    // Reset I/O Bar
    const ioFill = document.getElementById('io-fill');
    if (ioFill) {
        ioFill.style.background = 'var(--theme-color)';
        ioFill.style.height = '5%';
    }
}

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
    window.networkData.sent += bytesPerUpdate * 0.4 / 1024;
    window.networkData.received += bytesPerUpdate * 0.6 / 1024;
    window.networkData.lastUpdate = now;
    
    networkHistory.push(netActivity);
    if (networkHistory.length > MAX_NETWORK_HISTORY) networkHistory.shift();
    
    const netFill = document.getElementById('net-fill');
    // Select the specific Network LED (3rd group)
    const netLed = document.querySelector('#operator-console .deck-group:nth-child(3) .led');
    
    if (netFill) {
        const avgActivity = networkHistory.length > 0 ? networkHistory.reduce((a, b) => a + b) / networkHistory.length : 0;
        let netPercent = Math.min(avgActivity, 100);
        if (navigator.onLine && netPercent < 5) netPercent = 5;
        netFill.style.height = `${netPercent}%`;
        
        if (netLed) {
            // Apply traffic colors using INLINE styles to match Reset logic
            if (netPercent > 70) {
                netLed.style.background = '#ffff00'; // Yellow
                netLed.style.boxShadow = '0 0 5px #ffff00';
            } else if (netPercent > 30) {
                netLed.style.background = '#00FF41'; // Green
                netLed.style.boxShadow = '0 0 5px #00FF41';
            } else {
                netLed.style.background = '#0055ff'; // Blue (Idle)
                netLed.style.boxShadow = '0 0 5px #0055ff';
            }
            netLed.style.opacity = '1';
        }
    }
    const ioFill = document.getElementById('io-fill');
    if (ioFill) {
        const ioPercent = Math.min(netActivity * 0.7 + Math.random() * 15, 100);
        ioFill.style.height = `${ioPercent}%`;
        ioFill.style.background = 'var(--theme-color)';
    }
}

// Ensure the function is exposed globally
window.updateNebuchadnezzarDeck = updateNebuchadnezzarDeck;

/**
 * MINI MP3 PLAYER LOGIC
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initial Force Reset
    setTimeout(resetDeckLeds, 500);
    // Secondary check in case load is slow
    setTimeout(resetDeckLeds, 2000);

    const playBtn = document.getElementById('deck-play');
    const prevBtn = document.getElementById('deck-prev');
    const nextBtn = document.getElementById('deck-next');
    const trackName = document.getElementById('deck-track-name');

    if(playBtn) playBtn.addEventListener('click', () => {
        if (window.globalMediaPlayer) window.globalMediaPlayer.togglePlay();
    });

    if(nextBtn) nextBtn.addEventListener('click', () => {
        if (window.globalMediaPlayer) window.globalMediaPlayer.playNext();
    });

    if(prevBtn) prevBtn.addEventListener('click', () => {
        if (window.globalMediaPlayer && window.globalMediaPlayer.library.music.length > 0) {
            window.globalMediaPlayer.playPrev();
        }
    });

    setInterval(() => {
        if (window.globalMediaPlayer && window.globalMediaPlayer.mediaElement) {
            const player = window.globalMediaPlayer;
            const name = player.currentTrackName || "SYSTEM IDLE";
            if (trackName && trackName.textContent !== name) trackName.textContent = name;
            if (playBtn) playBtn.textContent = player.mediaElement.paused ? "▶" : "⏸";
        }
    }, 200);
});