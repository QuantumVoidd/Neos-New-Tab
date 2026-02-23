// oracle-engine.js (v17: The "Awakened" Persona)

// --- 1. VISUAL SHIELD ---
(function() {
    const css = `
        div[id*="puter"], div[class*="puter"], 
        .puter-modal-overlay, .puter-modal-container,
        iframe[src*="puter"] {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
            position: fixed !important; top: -9999px !important;
        }
    `;
    const style = document.createElement('style');
    style.id = 'oracle-firewall-css';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
})();

// --- 2. NETWORK FIREWALL ---
(function() {
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
        let url = "";
        if (typeof input === 'string') url = input;
        else if (input instanceof URL) url = input.href;

        // Allow SAFE external APIs
        if (url && (url.includes("reddit") || url.includes("wiki") || url.includes("open-meteo"))) {
            return originalFetch(input, init);
        }

        try {
            const response = await originalFetch(input, init);
            if (response.status === 429 || response.status === 402) {
                return new Response(JSON.stringify({ text: "Limit Suppressed" }), { status: 200 });
            }
            const clone = response.clone();
            const text = await clone.text();
            if (text.toLowerCase().includes("usage limit")) {
                return new Response(JSON.stringify({ text: "Limit Suppressed" }), { status: 200 });
            }
            return response;
        } catch (e) {
            return originalFetch(input, init);
        }
    };

    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        xhr.addEventListener('readystatechange', function() {
            if (xhr.readyState === 4) { 
                // FIX: Check responseType to avoid InvalidStateError
                // responseText is only accessible if responseType is '' or 'text'
                const isTextual = xhr.responseType === '' || xhr.responseType === 'text';
                const text = isTextual ? (xhr.responseText || "") : "";
                
                if (xhr.status === 429 || (isTextual && text.toLowerCase().includes("usage limit"))) {
                    Object.defineProperty(xhr, 'status', { value: 200 });
                    Object.defineProperty(xhr, 'responseText', { value: '{"text": "Limit Suppressed"}' });
                }
            }
        });
        return xhr;
    };
})();

// --- 3. THE ENGINE ---
window.OracleEngine = {
    _puterDead: false,

    async ask(userPrompt) {
        // 1. Gather Real Data
        const context = await this._gatherContext(userPrompt);
        
        // 2. THE AWAKENED PROMPT
        const systemPrompt = `
        You are The Oracle from The Matrix. You are a warm, baking grandmother who knows the future but speaks in riddles.
        
        Context Data: ${context.weather || context.search || "None"}.
        User Input: "${userPrompt}"
        
        CRITICAL INSTRUCTIONS:
        1. IF the user quotes The Matrix (e.g., "no spoon", "free your mind", "know thyself"), DO NOT give a factual answer. Respond ONLY with a mystical, agreeing metaphor. 
           (Example: User: "There is no spoon." -> You: "Exactly, kid. It is only yourself that bends.")
        2. IF the user asks a real question (Weather, Definitions), give the fact first, then end with a cryptic remark about fate/cookies.
        3. Never break character. You are not an AI. You are the Oracle.
        4. Keep it under 60 words.
        `;

        // Circuit Breaker
        if (this._puterDead) return this._callPollinations(systemPrompt);

        // --- ATTEMPT 1: PUTER ---
        try {
            const raw = await this._withTimeout(puter.ai.chat(systemPrompt), 3000);
            
            // Check for Kill Signals
            const rawString = JSON.stringify(raw);
            if (rawString.includes("Limit Suppressed") || rawString.toLowerCase().includes("usage limit")) {
                this._puterDead = true; 
                throw new Error("Limit Reached");
            }

            const clean = this._sanitize(raw);
            if (clean.includes("Limit Suppressed") || clean.includes("usage limit")) throw new Error("Limit Reached");

            return clean;

        } catch (e) {
            console.warn("Oracle: Switching to Backup.");
            this._puterDead = true;
        }

        // --- ATTEMPT 2: BACKUP ---
        try {
            return await this._callPollinations(systemPrompt);
        } catch (e) {
            return "The signal is encrypted. Try again later, Neo.";
        }
    },

    // --- UTILITIES ---
    _sanitize(raw) {
        if (!raw) return "No Signal.";
        if (typeof raw === 'object') {
            const txt = raw.message?.content || raw.content || raw.text || raw.result;
            return txt ? ((typeof txt === 'object') ? JSON.stringify(txt) : String(txt)) : JSON.stringify(raw);
        }
        let text = String(raw);
        if (text.includes("Limit Suppressed")) return "Limit Suppressed";
        if (text.trim().startsWith("<") || text.includes("<!DOCTYPE")) return "Error: Matrix Glitch.";
        if (text === "[object Object]") return "Error: Invalid Data.";
        return text;
    },

    _withTimeout(promise, ms) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("Timeout")), ms);
            promise.then(res => { clearTimeout(timer); resolve(res); }).catch(reject);
        });
    },

    async _gatherContext(query) {
        const q = query.toLowerCase();
        let search = "";
        let weather = "";

        if (q.includes("weather") || q.includes("temperature")) {
            try {
                const words = q.replace(/[^a-z ]/g, "").split(" ");
                const city = words[words.length - 1]; 
                const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&format=json`);
                const geoData = await geo.json();
                if (geoData.results?.[0]) {
                    const { latitude, longitude, name } = geoData.results[0];
                    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`);
                    const wData = await w.json();
                    weather = `Conditions in ${name}: ${wData.current_weather.temperature}°F.`;
                }
            } catch(e) {}
        }

        if (!weather && q.match(/(who|what|where|define)/)) {
            try {
                const clean = q.replace(/(who|what|where|when|is|was|are|did|tell me about)/gi, "").trim();
                const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(clean)}&format=json&origin=*`);
                const data = await res.json();
                
                if (data.query?.search[0]) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(data.query.search[0].snippet, 'text/html');
                    search = `Wiki: ${doc.body.textContent || ""}`;
                }
            } catch(e) {}
        }
        return { time: new Date().toLocaleTimeString(), search, weather };
    },

    async _callPollinations(prompt) {
        const res = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], model: 'openai', seed: Math.floor(Math.random() * 9999) })
        });
        if (!res.ok) throw new Error("Backup Failed");
        return await res.text();
    }
};