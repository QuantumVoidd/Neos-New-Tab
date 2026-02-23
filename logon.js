/**
 * LOGON CONSTRUCT V4.5 
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONSTANTS ---
    const DEFAULT_KEY = "knock"; 
    const BACKDOOR_KEY = "101";  
    const SESSION_KEY = "matrix_active_session";

    // --- DOM ELEMENTS ---
    const overlay = document.getElementById('logon-construct');
    const input = document.getElementById('cipher-key');
    const proxy = document.getElementById('cipher-proxy'); 
    const cursor = document.getElementById('logon-cursor');
    const status = document.getElementById('logon-status');
    const pfp = document.getElementById('user-pfp');
    const nameDisplay = document.getElementById('operator-name');
    const canvas = document.getElementById('logon-rain-canvas');
    const pfpContainer = document.querySelector('.pfp-container');
    const content = document.querySelector('.logon-content'); // Main UI Wrapper

    // --- UI SCALING (New) ---
    if (content) {
        // Increases the size of the login box by 15%
        content.style.transform = "scale(1.15)";
        content.style.transformOrigin = "center center";
    }

    // --- STATE MANAGEMENT ---
    let rainInterval;
    let ctx;
    let drops = [];
    const fontSize = 16; 
    const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
    
    // Setup Mode State
    let isSetupMode = false;
    let setupStep = 0; // 0: Name, 1: Password, 2: PFP
    let tempProfile = { username: "", key: "" };

    if (!overlay) return;

    // --- STORAGE HELPER (Handles Extension vs Local File) ---
    const storage = {
        get: (keys, callback) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(keys, callback);
            } else {
                // Fallback for file:// or non-extension testing
                const result = {};
                keys.forEach(k => result[k] = localStorage.getItem(k));
                callback(result);
            }
        },
        set: (data, callback) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set(data, callback);
            } else {
                Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
                if (callback) callback();
            }
        }
    };

    // --- 1. INITIALIZATION & PROFILE CHECK ---
    storage.get([
        'username', 'customPfp', 'themeColor', 'matrixGreen', 'rainSpeed', 'accessKey'
    ], (data) => {
        
        // Apply Aesthetics immediately
        applyTheme(data);

        // Check if Profile Exists (Username + Access Key)
        if (!data.username || !data.accessKey) {
            initSetupMode();
        } else {
            initLoginMode(data);
        }

        // Initialize Rain
        let activeColor = data.matrixGreen === 'true' || data.matrixGreen === true ? '#00ff41' : (data.themeColor || '#00ff41');
        if (canvas) initRain(activeColor, data.rainSpeed || 35);
    });

    // --- 2. MODE HANDLING ---

    function applyTheme(data) {
        let activeColor = '#00ff41'; 
        // Handle boolean or string storage differences
        if (data.matrixGreen === true || data.matrixGreen === 'true') activeColor = '#00ff41';
        else if (data.themeColor) activeColor = data.themeColor;

        document.documentElement.style.setProperty('--theme-color', activeColor);
        if (status) status.style.color = activeColor;
        if (proxy) proxy.style.color = activeColor;
        if (cursor) cursor.style.backgroundColor = activeColor;
        if (nameDisplay) nameDisplay.style.color = activeColor;
        
        // PFP Logic
        if (data.customPfp) {
            // --- CUSTOM PFP MODE ---
            pfp.src = data.customPfp;
            
            // 1. Force Container to be a clean clipping mask
            if (pfpContainer) {
                pfpContainer.style.padding = "0";
                pfpContainer.style.border = "none"; 
                pfpContainer.style.overflow = "hidden";
                pfpContainer.style.borderRadius = "50%"; // Force circular container
                pfpContainer.style.position = "relative";
            }

            // 2. Aggressive Image Scaling & Positioning
            pfp.style.position = "absolute";
            pfp.style.top = "50%";
            pfp.style.left = "50%";
            // Scale 1.1 = 110% size. This guarantees bleed over any sub-pixel gap.
            pfp.style.transform = "translate(-50%, -50%) scale(1.1)"; 
            
            pfp.style.width = "100%";
            pfp.style.height = "100%";
            pfp.style.objectFit = "cover"; 
            pfp.style.margin = "0";
            pfp.style.borderRadius = "50%"; 
            pfp.style.display = "block";
            
        } else {
            // --- WIREFRAME MODE ---
            renderWireframePfp(activeColor);
        }
        pfp.style.backgroundColor = "transparent";
    }

    function renderWireframePfp(color) {
        const svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
        pfp.src = 'data:image/svg+xml;base64,' + btoa(svgString);
        
        // Reset styles for Wireframe Mode
        if (pfpContainer) {
            pfpContainer.style.padding = ""; // Reset to CSS default
            pfpContainer.style.border = "";
            pfpContainer.style.overflow = "";
            pfpContainer.style.borderRadius = "";
            // Ensure container is relative so absolute child centers correctly
            pfpContainer.style.position = "relative";
        }

        // Updated Centering Logic: Use Absolute positioning + Transform
        pfp.style.position = "absolute"; 
        pfp.style.top = "50%";
        pfp.style.left = "50%";
        pfp.style.transform = "translate(-50%, -50%)";
        
        // Use width/height to control size (creates 'padding' effect naturally)
        pfp.style.width = "65%";  
        pfp.style.height = "65%";
        
        pfp.style.objectFit = "contain"; 
        pfp.style.padding = "0"; 
        pfp.style.margin = "0";
        pfp.style.borderRadius = "0";
    }

    function initLoginMode(data) {
        isSetupMode = false;
        if (nameDisplay) {
            nameDisplay.textContent = data.username.toUpperCase();
            nameDisplay.style.letterSpacing = "2px";
        }
        input.setAttribute('type', 'password');
        input.setAttribute('placeholder', 'ENTER_CIPHER');
        status.textContent = "AWAITING DECRYPTION KEY...";
        input.value = "";
        syncLogonCursor();
        input.focus();
    }

    function initSetupMode() {
        isSetupMode = true;
        setupStep = 0;
        
        // Reset Visuals
        renderWireframePfp(document.documentElement.style.getPropertyValue('--theme-color') || '#00ff41');
        nameDisplay.textContent = "UNIDENTIFIED SIGNAL";
        
        // Step 0: Request Name
        status.textContent = "INITIALIZING: ENTER OPERATOR NAME";
        status.classList.add('blink-text');
        
        input.setAttribute('type', 'text');
        input.setAttribute('placeholder', 'CODENAME');
        input.value = "";
        syncLogonCursor();
        input.focus();
    }

    // --- 3. INPUT HANDLERS & SETUP LOGIC ---

    function handleInputSubmit(val) {
        if (isSetupMode) {
            advanceSetup(val);
        } else {
            verifyCipher(val);
        }
    }

    function advanceSetup(val) {
        if (setupStep === 0) {
            // Validate Name
            if (!val || val.length < 2) {
                blinkError("NAME TOO SHORT");
                return;
            }
            tempProfile.username = val;
            
            // Move to Step 1: Password
            setupStep = 1;
            nameDisplay.textContent = tempProfile.username.toUpperCase();
            status.textContent = "SECURE YOUR TERMINAL: SET PASSWORD";
            input.value = "";
            input.setAttribute('type', 'password');
            input.setAttribute('placeholder', 'NEW_CIPHER');
            syncLogonCursor();

        } else if (setupStep === 1) {
            // Validate Password
            if (!val || val.length < 1) {
                blinkError("PASSWORD REQUIRED");
                return;
            }
            tempProfile.key = val;

            // Move to Step 2: PFP
            setupStep = 2;
            status.textContent = "OPTIONAL: UPLOAD AVATAR OR TYPE 'SKIP'";
            input.value = "";
            input.setAttribute('type', 'text');
            input.setAttribute('placeholder', 'CLICK_IMG_OR_SKIP');
            syncLogonCursor();

            // Enable Click-to-upload on the PFP image/container
            pfpContainer.style.cursor = "pointer";
            pfpContainer.onclick = triggerPfpUpload;
        } else if (setupStep === 2) {
            // Handle Skip/Finalize via Text
            finalizeSetup(null); // Null image means keep default
        }
    }

    function triggerPfpUpload() {
        if (!isSetupMode || setupStep !== 2) return;

        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // Simple size check (optional: warn if > 3MB)
                if (file.size > 3 * 1024 * 1024) {
                    blinkError("FILE TOO LARGE (MAX 3MB)");
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    const base64String = event.target.result;
                    
                    // Instant Preview logic with Gap Fix
                    pfp.src = base64String;
                    pfp.style.position = "absolute";
                    pfp.style.top = "50%";
                    pfp.style.left = "50%";
                    pfp.style.transform = "translate(-50%, -50%) scale(1.1)"; // 110% bleed
                    
                    pfp.style.width = "100%";
                    pfp.style.height = "100%";
                    pfp.style.objectFit = "cover";
                    pfp.style.padding = "0";
                    pfp.style.borderRadius = "50%";
                    
                    // Also strip container padding for preview
                    if (pfpContainer) {
                        pfpContainer.style.padding = "0";
                        pfpContainer.style.overflow = "hidden";
                        pfpContainer.style.borderRadius = "50%";
                    }

                    finalizeSetup(base64String);
                };
                reader.readAsDataURL(file);
            }
        };
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    function finalizeSetup(imgData) {
        status.textContent = "WRITING TO MAINFRAME...";
        status.classList.remove('blink-text');
        
        const storageData = {
            username: tempProfile.username,
            accessKey: tempProfile.key
        };
        if (imgData) storageData.customPfp = imgData;

        // Using helper storage.set (which uses chrome.storage.local)
        storage.set(storageData, () => {
            
            // NEW FIX: Also attempt to save credentials to sync storage so settings-page grabs them reliably
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                chrome.storage.sync.set({
                    username: storageData.username,
                    accessKey: storageData.accessKey
                });
            }

            // Verify and Auto-Login
            setTimeout(() => {
                storage.get(['username', 'accessKey', 'customPfp', 'themeColor', 'matrixGreen'], (newData) => {
                    if (newData.username) {
                        applyTheme(newData);
                        pfpContainer.style.cursor = "default";
                        pfpContainer.onclick = null;
                        grantAccess();
                    } else {
                        blinkError("WRITE FAILED - CHECK STORAGE PERMISSIONS");
                        initSetupMode(); // Retry if failed
                    }
                });
            }, 500);
        });
    }

    function blinkError(msg) {
        const originalText = status.textContent;
        const originalColor = status.style.color;
        
        status.textContent = msg;
        status.style.color = "#ff0055";
        
        try { new Audio('accessdenied.mp3').play().catch(()=>{}); } catch(e){}

        setTimeout(() => {
            status.textContent = originalText;
            status.style.color = originalColor;
        }, 1500);
    }


    // --- 4. CURSOR & PROXY SYNC ---
    function syncLogonCursor() {
        if (!input || !cursor || !proxy) return;
        
        const rawValue = input.value || "";
        
        // Handle Placeholder State
        if (rawValue.length === 0) {
            cursor.style.display = 'none';
            proxy.textContent = "";
            return;
        } else {
            cursor.style.display = 'block';
        }
        
        // Update Proxy Text 
        let displayValue;
        if (input.getAttribute('type') === 'password') {
            displayValue = rawValue.replace(/./g, '•');
        } else {
            displayValue = rawValue;
        }

        proxy.textContent = displayValue;

        // Calculate Position
        const textWidth = proxy.offsetWidth;
        const paddingLeft = 15; // Matches CSS #cipher-proxy left
        
        cursor.style.left = `${paddingLeft + textWidth}px`;
    }

    if (input && cursor) {
        input.addEventListener('input', syncLogonCursor);
        input.addEventListener('keydown', () => setTimeout(syncLogonCursor, 0));
        input.addEventListener('keyup', syncLogonCursor);
        input.addEventListener('click', syncLogonCursor);
        input.addEventListener('focus', syncLogonCursor);
        input.addEventListener('blur', () => { cursor.style.display = 'none'; });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleInputSubmit(input.value.trim());
        });
    }

    overlay.addEventListener('click', (e) => {
        // If clicking PFP during setup step 2, don't focus input immediately
        if (isSetupMode && setupStep === 2 && (e.target === pfp || pfpContainer.contains(e.target))) {
            return;
        }
        if (input && e.target !== input) input.focus();
    });

    // --- 5. CORE ACCESS LOGIC ---
    function verifyCipher(key) {
        storage.get(['accessKey'], (result) => {
            const validKey = result.accessKey || DEFAULT_KEY;
            if (key === validKey || key === BACKDOOR_KEY) grantAccess();
            else denyAccess();
        });
    }

    function grantAccess() {
        status.textContent = "IDENTITY CONFIRMED.";
        status.style.color = document.documentElement.style.getPropertyValue('--theme-color');
        status.classList.remove('blink-text');
        input.disabled = true;
        cursor.style.display = 'none';
        
        // --- CUSTOM LOGIN AUDIO ---
        try { new Audio('loggedin.mp3').play().catch(()=>{}); } catch(e){}
        
        if (window.SystemLogger) window.SystemLogger.log("CIPHER_ACCEPTED", "AUTH");
        overlay.classList.add('shatter-exit');
        setTimeout(() => {
            stopRain();
            overlay.remove();
            sessionStorage.setItem(SESSION_KEY, 'true');
            if (typeof window.startAllAnimations === 'function') window.startAllAnimations();
            const term = document.getElementById('terminal-output');
            if (term && window.streamText) setTimeout(() => window.streamText(term, "> WELCOME BACK, OPERATOR.\n"), 500);
        }, 800);
    }

    function denyAccess() {
        const wrapper = document.querySelector('.cipher-wrapper');
        status.textContent = "ACCESS DENIED";
        status.style.color = "#ff0055"; 
        if (wrapper) wrapper.classList.add('access-denied');
        
        // --- CUSTOM ACCESS DENIED AUDIO ---
        try { new Audio('accessdenied.mp3').play().catch(()=>{}); } catch(e){}
        
        input.value = "";
        syncLogonCursor();
        setTimeout(() => {
            if (wrapper) wrapper.classList.remove('access-denied');
            status.textContent = "AWAITING DECRYPTION KEY...";
            status.style.color = document.documentElement.style.getPropertyValue('--theme-color');
            input.focus();
        }, 1000);
    }

    // --- 6. LOGON RAIN ENGINE ---
    function initRain(color, speedSetting) {
        ctx = canvas.getContext('2d');
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
            const columns = Math.ceil(window.innerWidth / fontSize);
            drops = [];
            for (let i = 0; i < columns; i++) { drops[i] = Math.random() * -100; }
        };
        window.addEventListener('resize', resize);
        resize(); 
        let intervalDelay = 30;
        if (speedSetting) intervalDelay = 130 - speedSetting; 
        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
            ctx.fillStyle = color;
            ctx.font = 'normal ' + fontSize + 'px monospace';
            for (let i = 0; i < drops.length; i++) {
                if (Math.random() > 0.98) continue; 
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > window.innerHeight && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        };
        rainInterval = setInterval(draw, intervalDelay);
    }
    function stopRain() { if (rainInterval) clearInterval(rainInterval); }
});