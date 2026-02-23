document.addEventListener('DOMContentLoaded', () => {
    // --- WORDPAD LOGIC ---
    const wordpadModal = document.getElementById('wordpad-modal');
    const wordpadEditor = document.getElementById('wordpad-editor');
    const dockWordpad = document.getElementById('dock-wordpad');
    const closeWordpadBtn = document.getElementById('close-wordpad-btn');

    if (dockWordpad) dockWordpad.onclick = () => wordpadModal.classList.remove('hidden');
    if (closeWordpadBtn) closeWordpadBtn.onclick = () => wordpadModal.classList.add('hidden');

    // --- ADVANCED WORDPAD LOGIC (Neural Link) ---
    const codeToggle = document.getElementById('code-mode-toggle');
    const wordpadFrame = document.querySelector('.wordpad-frame');
    const historyBtn = document.getElementById('neural-history-btn');
    const runBtn = document.getElementById('execute-code-btn');

    if (codeToggle && wordpadFrame && wordpadEditor) {
        codeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                wordpadFrame.classList.add('coding-mode');
                wordpadEditor.placeholder = "// Initialize Zion Coding Environment...\n// Root access granted.\nfunction matrix() {\n  return 'Free your mind';\n}";
                // Ensure showZionMessage exists globally
                if (window.showZionMessage) showZionMessage("NEURAL LINK ESTABLISHED: CODING ENV ACTIVE");
                
                // Show History & Run Buttons
                if (historyBtn) historyBtn.style.display = 'block';
                if (runBtn) {
                    runBtn.style.display = 'block';
                    runBtn.style.background = 'rgba(0, 0, 0, 0.6)';
                    runBtn.style.color = 'var(--theme-color)';
                    runBtn.style.border = '1px solid var(--theme-color)';
                    runBtn.style.padding = '2px 10px';
                    runBtn.style.fontWeight = 'bold';
                }
            } else {
                wordpadFrame.classList.remove('coding-mode');
                wordpadEditor.placeholder = "Initialize data stream...";
                if (window.showZionMessage) showZionMessage("NEURAL LINK SEVERED: WORDPAD ACTIVE");
                
                // Hide History & Run Buttons
                if (historyBtn) historyBtn.style.display = 'none';
                if (runBtn) runBtn.style.display = 'none';
            }
        });

        // Tab Key Support for Coding
        wordpadEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && wordpadFrame.classList.contains('coding-mode')) {
                e.preventDefault();
                const start = wordpadEditor.selectionStart;
                const end = wordpadEditor.selectionEnd;
                wordpadEditor.value = wordpadEditor.value.substring(0, start) + "    " + wordpadEditor.value.substring(end);
                wordpadEditor.selectionStart = wordpadEditor.selectionEnd = start + 4;
            }
        });
    }

    // --- NEURAL HISTORY & SAVE LOGIC ---
    const originalSaveBtn = document.getElementById('save-wordpad-btn');
    
    if (originalSaveBtn) {
        originalSaveBtn.onclick = () => {
            const text = wordpadEditor.value;
            const isCode = codeToggle ? codeToggle.checked : false;
            const prefix = isCode ? "hack_" : "vault_";
            const filename = isCode ? "reality_override.js" : "document.txt";
            
            const blob = new Blob([text], {type: isCode ? 'application/javascript' : 'text/plain'});
            const reader = new FileReader();
            reader.onload = (e) => {
                const key = `${prefix}${Date.now()}_${filename}`;
                chrome.storage.local.set({ [key]: e.target.result }, () => {
                    if (window.showZionMessage) {
                        showZionMessage(isCode ? "HACK SAVED TO NEURAL HISTORY" : "DATA STREAM SAVED TO ROOT");
                    }
                });
            };
            reader.readAsDataURL(blob);
        };
    }

    if (historyBtn) {
        historyBtn.onclick = () => {
            if (window.openRootExplorer) {
                openRootExplorer("hack_");
                if (window.showZionMessage) showZionMessage("ACCESSING NEURAL HISTORY...");
            }
        };
    }

    // --- OPERATOR CODE EXECUTION ENGINE ---
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            const code = wordpadEditor.value;
            if (!code.trim()) return;

            // Log to Chat (if active)
            const chatLog = document.getElementById('chat-log');
            if (chatLog) {
                const d = document.createElement('div');
                d.className = 'chat-msg';
                d.innerHTML = `<b class="morpheus">SYSTEM:</b> Passing signal to Sandbox...`;
                chatLog.appendChild(d);
                chatLog.scrollTop = chatLog.scrollHeight;
            }

            // Transmit to Sandbox
            // note: we fetch the element dynamically to be safe
            const sandbox = document.getElementById('zion-sandbox');
            if (sandbox) {
                sandbox.contentWindow.postMessage({ 
                    code: code, 
                    taskId: 'operator-exec' 
                }, '*');

                if (window.showZionMessage) showZionMessage("SIGNAL TRANSMITTED\nAWAITING SANDBOX VALIDATION...");
            } else {
                console.error("Sandbox frame not found");
            }
        });
    }
});