// Games/citizensofzion/citizensofzion_launcher.js

window.RufflePlayer = window.RufflePlayer || {};
window.RufflePlayer.config = { 
    "publicPath": "../../Ruffle/",
    "autoplay": "on",
    "unmuteOverlay": "hidden",
    "backgroundColor": "#000000", 
    "letterbox": "on",
    "scale": "showAll" 
};

let rufflePlayer;

function showNotification(text) {
    const el = document.getElementById('notification');
    if (!el) return;
    el.innerText = text;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 2000);
}

// --- UPDATED KEY MAPPING ---
// Mapped to Arrows, Z, and X
const keys = {
    up:    { code: 'ArrowUp',    key: 'ArrowUp',    keyCode: 38, pressed: false },
    down:  { code: 'ArrowDown',  key: 'ArrowDown',  keyCode: 40, pressed: false },
    left:  { code: 'ArrowLeft',  key: 'ArrowLeft',  keyCode: 37, pressed: false },
    right: { code: 'ArrowRight', key: 'ArrowRight', keyCode: 39, pressed: false },
    attack:{ code: 'KeyZ',       key: 'z',          keyCode: 90, pressed: false },
    jump:  { code: 'KeyX',       key: 'x',          keyCode: 88, pressed: false }
};

function triggerKeyEvent(type, keyObj) {
    const eventParams = {
        key: keyObj.key,
        code: keyObj.code,
        keyCode: keyObj.keyCode,
        which: keyObj.keyCode,
        charCode: type === 'keypress' ? keyObj.keyCode : 0,
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        location: 0
    };

    const event = new KeyboardEvent(type, eventParams);
    if (rufflePlayer) {
        rufflePlayer.dispatchEvent(event);
    }
    document.dispatchEvent(event);
}

function updateGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0]; 
    if (gp) {
        // 1. ANALOG/D-PAD MOVEMENT -> ARROWS
        const isUp    = gp.axes[1] < -0.5 || gp.buttons[12]?.pressed;
        const isDown  = gp.axes[1] > 0.5  || gp.buttons[13]?.pressed;
        const isLeft  = gp.axes[0] < -0.5 || gp.buttons[14]?.pressed; 
        const isRight = gp.axes[0] > 0.5  || gp.buttons[15]?.pressed; 
        
        // 2. ACTION BUTTONS
        const isJumpInput   = gp.buttons[0]?.pressed; // A button -> X (Jump)
        const isAttackInput = gp.buttons[2]?.pressed || gp.buttons[1]?.pressed; // X or B button -> Z (Attack)

        // Apply Arrows
        if (isUp && !keys.up.pressed) { keys.up.pressed = true; triggerKeyEvent('keydown', keys.up); }
        else if (!isUp && keys.up.pressed) { keys.up.pressed = false; triggerKeyEvent('keyup', keys.up); }

        if (isDown && !keys.down.pressed) { keys.down.pressed = true; triggerKeyEvent('keydown', keys.down); }
        else if (!isDown && keys.down.pressed) { keys.down.pressed = false; triggerKeyEvent('keyup', keys.down); }

        if (isLeft && !keys.left.pressed) { keys.left.pressed = true; triggerKeyEvent('keydown', keys.left); }
        else if (!isLeft && keys.left.pressed) { keys.left.pressed = false; triggerKeyEvent('keyup', keys.left); }

        if (isRight && !keys.right.pressed) { keys.right.pressed = true; triggerKeyEvent('keydown', keys.right); }
        else if (!isRight && keys.right.pressed) { keys.right.pressed = false; triggerKeyEvent('keyup', keys.right); }

        // Apply Z/X
        if (isJumpInput && !keys.jump.pressed) { keys.jump.pressed = true; triggerKeyEvent('keydown', keys.jump); }
        else if (!isJumpInput && keys.jump.pressed) { keys.jump.pressed = false; triggerKeyEvent('keyup', keys.jump); }

        if (isAttackInput && !keys.attack.pressed) { keys.attack.pressed = true; triggerKeyEvent('keydown', keys.attack); }
        else if (!isAttackInput && keys.attack.pressed) { keys.attack.pressed = false; triggerKeyEvent('keyup', keys.attack); }
    }
    requestAnimationFrame(updateGamepad);
}

async function initFlashGame() {
    const audioCtx = window.AudioContext || window.webkitAudioContext;
    if(audioCtx) { 
        let ctx = new audioCtx(); 
        if (ctx.state === 'suspended') await ctx.resume(); 
    }

    const ruffle = window.RufflePlayer.newest();
    rufflePlayer = ruffle.createPlayer();
    document.getElementById("ruffle-container").appendChild(rufflePlayer);

    try {
        await rufflePlayer.load({
            url: "preloader.swf",
            allowScriptAccess: true,
            backgroundColor: "#000000"
        });
        
        setTimeout(() => {
            rufflePlayer.focus();
            window.parent.postMessage({ status: 'running' }, '*');
        }, 500);

    } catch (err) {
        window.parent.postMessage({ status: 'error' }, '*');
    }
}

window.addEventListener('message', (event) => {
    if (event.data.command === 'mute' && rufflePlayer) {
        rufflePlayer.volume = (rufflePlayer.volume > 0) ? 0 : 1;
        showNotification(rufflePlayer.volume === 0 ? "MUTED" : "UNMUTED");
    }
});

document.getElementById('start-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('start-overlay').style.display = 'none';
    initFlashGame();
});

window.addEventListener('mousedown', () => { if (rufflePlayer) rufflePlayer.focus(); });
window.addEventListener("gamepadconnected", () => showNotification("GAMEPAD CONNECTED"));

requestAnimationFrame(updateGamepad);