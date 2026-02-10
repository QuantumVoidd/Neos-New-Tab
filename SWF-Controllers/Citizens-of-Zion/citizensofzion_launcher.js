window.RufflePlayer = window.RufflePlayer || {};
window.RufflePlayer.config = { 
    "publicPath": "../Ruffle/",
    "autoplay": "on",
    "unmuteOverlay": "hidden",
    "backgroundColor": "#000000", 
    "letterbox": "off",
    "scale": "exactFit" // Ensures the whole menu is visible
};

window.addEventListener("load", (event) => {
    const ruffle = window.RufflePlayer.newest();
    const player = ruffle.createPlayer();
    
    player.style.width = "100%";
    player.style.height = "100%";
    player.style.display = "block";
    
    const container = document.getElementById("ruffle-container");
    container.appendChild(player);
    
    // Reverted to game.swf since preloader didn't fix the language
    player.load({ url: "game.swf" });
});