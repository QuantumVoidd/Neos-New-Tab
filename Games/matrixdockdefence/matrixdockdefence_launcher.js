// Games/matrixdockdefence/matrixdockdefence_launcher.js

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
            url: "matrixdockdefence.swf",
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

window.addEventListener('mousedown', () => { 
    if (rufflePlayer) rufflePlayer.focus(); 
});