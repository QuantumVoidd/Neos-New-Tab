/**
 * SYSTEM LOGS MONITOR v9.3
 */

const SystemLogger = {
    container: null,
    maxLogs: 50,
    matrixChars: "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789",
    
    init: function() {
        this.container = document.getElementById('system-log-content');
        if (!this.container) return;

        // Boot Sequence
        this.log("KERNEL_INIT...", "CONFIG");
        setTimeout(() => this.log("ENCRYPTION_ENGINE // SYNCED", "PENDING"), 200);
        setTimeout(() => this.log("USER_DAEMON // ONLINE", "SUCCESS"), 600);
        
        this.attachGlobalListeners();
    },

    sanitize: function(str) {
        if (!str) return null;
        const clean = str.replace(/[^\x20-\x7E]/g, '').trim();
        return clean.length > 0 ? clean : null;
    },

    /**
     * CORE ANIMATION ENGINE
     */
    animateEntry: function(element, fullText) {
        const state = {
            text: fullText,
            len: fullText.length,
            revealIter: 0,
            lastRenderedIter: -99,
            isHovering: false,
            isAutoSequence: true,
            hasReEncrypted: false,
            reEncryptTimer: null,
            interval: null
        };

        // Hover Listeners
        element.addEventListener('mouseenter', () => { 
            state.isHovering = true;
            if (state.reEncryptTimer) {
                clearTimeout(state.reEncryptTimer);
                state.reEncryptTimer = null;
            }
        });
        element.addEventListener('mouseleave', () => { 
            state.isHovering = false; 
        });

        state.interval = setInterval(() => {
            let targetIter = 0;

            if (state.isHovering) {
                targetIter = state.len;
            } else {
                if (state.isAutoSequence && !state.hasReEncrypted) {
                    targetIter = state.len;
                    // Start 5s timer when fully decrypted
                    if (Math.abs(state.revealIter - state.len) < 0.1 && !state.reEncryptTimer) {
                        state.reEncryptTimer = setTimeout(() => {
                            state.hasReEncrypted = true; 
                            state.reEncryptTimer = null;
                        }, 5000); 
                    }
                } else {
                    targetIter = 0;
                }
            }

            // Move Iterator
            if (state.revealIter < targetIter) {
                state.revealIter += 0.33; 
            } else if (state.revealIter > targetIter) {
                state.revealIter -= 0.50; 
            }

            if (Math.abs(state.revealIter - targetIter) < 0.1) {
                state.revealIter = targetIter;
            }

            // Render Check
            if (Math.abs(state.revealIter - state.lastRenderedIter) > 0.05) {
                state.lastRenderedIter = state.revealIter;
                
                const currentIter = Math.floor(state.revealIter);
                
                const html = state.text.split("").map((letter, index) => {
                    if (index < currentIter) {
                        return letter;
                    }
                    // Encrypted Char
                    const char = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];
                    return `<span style="display:inline-block; width:1ch; text-align:center; color:var(--theme-color);">${char}</span>`;
                }).join("");

                element.innerHTML = html;

                // Toggle Encrypted Class
                if (currentIter >= state.len) {
                    element.classList.remove('encrypted');
                } else {
                    element.classList.add('encrypted');
                }

                // --- FIX: Force Scroll Update on EVERY Frame ---
                // This ensures that if text expands from 2 to 3 lines during decryption,
                // the container immediately scrolls to keep it visible.
                if (this.container) {
                    this.container.scrollTop = this.container.scrollHeight;
                }
            }

        }, 30);
        
        element.dataset.intervalId = state.interval;
    },

    log: function(message, type = "INFO") {
        if (!this.container) return;

        const entry = document.createElement('div');
        const now = new Date();
        const timestamp = `[${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}]`;
        
        let colorStyle = "color: var(--theme-color); opacity: 1;"; 
        let prefix = "SYS";

        switch(type) {
            case 'USER':
                colorStyle = "color: var(--theme-color);";
                prefix = "ACT";
                break;
            case 'INPUT':
                colorStyle = "color: var(--theme-color);";
                prefix = "INP";
                break;
            case 'WARN':
                colorStyle = "color: var(--theme-color); border-bottom: 1px dashed var(--theme-color);";
                prefix = "WRN";
                break;
            case 'ERROR':
                colorStyle = "color: var(--theme-color); text-decoration: underline;";
                prefix = "ERR";
                break;
            case 'SUCCESS':
                colorStyle = "color: var(--theme-color);";
                prefix = "OK";
                break;
            case 'CONFIG':
                colorStyle = "color: var(--theme-color);";
                prefix = "CFG";
                break;
            case 'PENDING':
                colorStyle = "color: var(--theme-color);"; 
                prefix = "...";
                break;
        }

        entry.style.cssText = `
            font-family: 'Courier New', monospace; 
            font-size: 0.7rem; 
            line-height: 1.4; 
            white-space: pre-wrap; 
            word-break: break-word;
            margin-bottom: 4px; 
            border-bottom: 1px solid rgba(0,0,0,0.2);
            padding-bottom: 2px;
            cursor: default;
            ${colorStyle}
        `;
        
        const fullLogLine = `${timestamp} [${prefix}] ${message}`;
        this.container.appendChild(entry);
        this.animateEntry(entry, fullLogLine);

        // Initial scroll kick (backup for non-animated start)
        this.container.scrollTop = this.container.scrollHeight;

        // Cleanup
        if (this.container.children.length > this.maxLogs) {
            const old = this.container.firstChild;
            if(old.dataset.intervalId) {
                clearInterval(old.dataset.intervalId);
            }
            this.container.removeChild(old);
        }
    },

    attachGlobalListeners: function() {
        document.addEventListener('click', (e) => {
            let target = e.target;
            if(target.closest('#system-log-monitor')) return; 

            let rawLabel = target.id || target.getAttribute('title') || target.innerText || target.className || target.tagName;
            let label = this.sanitize(rawLabel);
            if (!label) label = target.tagName;
            if (label.length > 40) label = label.substring(0, 40) + "..";

            this.log(`CLICK >> ${label}`, "USER");
        });

        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.addEventListener('change', (e) => {
                let val = this.sanitize(e.target.value) || "DATA";
                let id = this.sanitize(e.target.id) || "INPUT_FIELD";
                if(e.target.type === 'password') val = '********';
                if(val.length > 25) val = val.substring(0, 25) + "...";

                this.log(`UPDATE >> ${id} = "${val}"`, "INPUT");
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') this.log(`KEY_PRESS >> [ENTER]`, "USER");
            if(e.key === 'Escape') this.log(`KEY_PRESS >> [ESC]`, "WARN");
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SystemLogger.init());
} else {
    SystemLogger.init();
}

window.logSystemEvent = (msg, type) => SystemLogger.log(msg, type);