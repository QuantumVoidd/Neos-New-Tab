// Games/matrixbullettime/bullettime_launcher.js

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

// --- UPDATED KEY MAPPING FOR BULLET TIME ---
const keys = {
    up:    { code: 'ArrowUp',    key: 'ArrowUp',    keyCode: 38, pressed: false },
    down:  { code: 'ArrowDown',  key: 'ArrowDown',  keyCode: 40, pressed: false },
    left:  { code: 'ArrowLeft',  key: 'ArrowLeft',  keyCode: 37, pressed: false },
    right: { code: 'ArrowRight', key: 'ArrowRight', keyCode: 39, pressed: false },
    slow:  { code: 'KeyM',       key: 'm',          keyCode: 77, pressed: false },
    ultra: { code: 'Space',      key: ' ',          keyCode: 32, pressed: false },
    shoot: { code: 'ControlLeft',key: 'Control',    keyCode: 17, pressed: false },
    toggle:{ code: 'ShiftLeft',  key: 'Shift',      keyCode: 16, pressed: false }
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
        ctrlKey: keyObj.key === 'Control',
        shiftKey: keyObj.key === 'Shift',
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
        // 1. ANALOG & D-PAD MOVEMENT
        const isUp    = gp.axes[1] < -0.5 || gp.buttons[12]?.pressed;
        const isDown  = gp.axes[1] > 0.5  || gp.buttons[13]?.pressed;
        const isLeft  = gp.axes[0] < -0.5 || gp.buttons[14]?.pressed; 
        const isRight = gp.axes[0] > 0.5  || gp.buttons[15]?.pressed; 
        
        // 2. ACTION BUTTONS
        const isJumpInput  = gp.buttons[0]?.pressed; // A -> Jump (Up)
        const isPunchInput = gp.buttons[1]?.pressed; // B -> Punch (Down)
        const isShootInput = gp.buttons[2]?.pressed || gp.buttons[7]?.pressed; // X or RT -> Shoot (Ctrl)
        const isToggleGun  = gp.buttons[3]?.pressed; // Y -> Toggle Gun (Shift)
        const isSlowMo     = gp.buttons[4]?.pressed; // LB -> Slow Mo (M)
        const isUltraSlow  = gp.buttons[5]?.pressed; // RB -> Ultra Slow (Space)

        // Apply Horizontal Movement
        if (isLeft && !keys.left.pressed) { keys.left.pressed = true; triggerKeyEvent('keydown', keys.left); }
        else if (!isLeft && keys.left.pressed) { keys.left.pressed = false; triggerKeyEvent('keyup', keys.left); }

        if (isRight && !keys.right.pressed) { keys.right.pressed = true; triggerKeyEvent('keydown', keys.right); }
        else if (!isRight && keys.right.pressed) { keys.right.pressed = false; triggerKeyEvent('keyup', keys.right); }

        // Apply Vertical Movement (Jump/Punch)
        const finalUp = isUp || isJumpInput;
        if (finalUp && !keys.up.pressed) { keys.up.pressed = true; triggerKeyEvent('keydown', keys.up); }
        else if (!finalUp && keys.up.pressed) { keys.up.pressed = false; triggerKeyEvent('keyup', keys.up); }

        const finalDown = isDown || isPunchInput;
        if (finalDown && !keys.down.pressed) { keys.down.pressed = true; triggerKeyEvent('keydown', keys.down); }
        else if (!finalDown && keys.down.pressed) { keys.down.pressed = false; triggerKeyEvent('keyup', keys.down); }

        // Apply Combat Actions
        if (isShootInput && !keys.shoot.pressed) { keys.shoot.pressed = true; triggerKeyEvent('keydown', keys.shoot); }
        else if (!isShootInput && keys.shoot.pressed) { keys.shoot.pressed = false; triggerKeyEvent('keyup', keys.shoot); }

        if (isToggleGun && !keys.toggle.pressed) { keys.toggle.pressed = true; triggerKeyEvent('keydown', keys.toggle); }
        else if (!isToggleGun && keys.toggle.pressed) { keys.toggle.pressed = false; triggerKeyEvent('keyup', keys.toggle); }

        if (isSlowMo && !keys.slow.pressed) { keys.slow.pressed = true; triggerKeyEvent('keydown', keys.slow); }
        else if (!isSlowMo && keys.slow.pressed) { keys.slow.pressed = false; triggerKeyEvent('keyup', keys.slow); }

        if (isUltraSlow && !keys.ultra.pressed) { keys.ultra.pressed = true; triggerKeyEvent('keydown', keys.ultra); }
        else if (!isUltraSlow && keys.ultra.pressed) { keys.ultra.pressed = false; triggerKeyEvent('keyup', keys.ultra); }
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
            url: "bullettime.swf",
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