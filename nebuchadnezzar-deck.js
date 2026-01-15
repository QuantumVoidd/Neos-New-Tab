/**
 * NEBUCHADNEZZAR DECK CONTROLLER
 * Handles Operator Console Stats (CPU, RAM, PWR, NET, I/O)
 */

// Global state for stats
let lastCpuInfo = null;
window.networkData = { sent: 0, received: 0, lastUpdate: Date.now() }; // Exposed globally for /whoami command
let networkHistory = [];
const MAX_NETWORK_HISTORY = 60;

/**
 * Main update function called by the global loop
 */
function updateNebuchadnezzarDeck() {
    updateCpuStat();
    updateMemStat();
    updateBatteryStat();
    
    // Throttle network updates to every 2 seconds
    if (Date.now() - window.networkData.lastUpdate > 2000) {
        updateNetworkStats();
    }
}

function updateCpuStat() {
    const cpuFill = document.getElementById('cpu-fill');
    if (chrome.system && chrome.system.cpu && cpuFill) {
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
    if (chrome.system && chrome.system.memory && memFill) {
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

function updateNetworkStats() {
    const now = Date.now();
    let netActivity = 0;
    
    // Simulate activity based on connection status
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
    const ioFill = document.getElementById('io-fill');
    if (ioFill) {
        const ioPercent = Math.min(netActivity * 0.7 + Math.random() * 15, 100);
        ioFill.style.height = `${ioPercent}%`;
    }
}

// Expose the main updater to the window
window.updateNebuchadnezzarDeck = updateNebuchadnezzarDeck;

/**
 * MINI MP3 PLAYER LOGIC
 * Interfaces with window.globalMediaPlayer
 */

document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('deck-play');
    const prevBtn = document.getElementById('deck-prev');
    const nextBtn = document.getElementById('deck-next');
    const trackName = document.getElementById('deck-track-name');

    // 1. Play/Pause
    playBtn.addEventListener('click', () => {
        if (window.globalMediaPlayer) window.globalMediaPlayer.togglePlay();
    });

    // 2. Next Track
    nextBtn.addEventListener('click', () => {
        if (window.globalMediaPlayer) window.globalMediaPlayer.playNext();
    });

    // 3. Previous Track
    prevBtn.addEventListener('click', () => {
        if (window.globalMediaPlayer && window.globalMediaPlayer.library.music.length > 0) {
            const player = window.globalMediaPlayer;
            const index = player.library.music.findIndex(t => t.name === player.currentTrackName);
            // Handle loop back to end if at start
            const prevIndex = (index - 1 + player.library.music.length) % player.library.music.length;
            const prevItem = player.library.music[prevIndex];
            if (prevItem) player.loadMedia(prevItem);
        }
    });

    // 4. Sync UI with Global Player
    setInterval(() => {
        if (window.globalMediaPlayer && window.globalMediaPlayer.mediaElement) {
            const player = window.globalMediaPlayer;
            
            // Sync Track Name
            const name = player.currentTrackName || "SYSTEM IDLE";
            if (trackName.textContent !== name) trackName.textContent = name;

            // Sync Play Button Icon
            playBtn.textContent = player.mediaElement.paused ? "▶" : "⏸";
        }
    }, 500);
});

// Update the global update function to include media checks
const originalUpdate = window.updateNebuchadnezzarDeck;
window.updateNebuchadnezzarDeck = function() {
    originalUpdate();
    // Potential for future audio visualization logic on the deck leds
};