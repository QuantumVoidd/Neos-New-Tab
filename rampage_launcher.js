window.RufflePlayer = window.RufflePlayer || {};
window.RufflePlayer.config = { 
    "publicPath": "../Ruffle/",
    "autoplay": "on",
    "unmuteOverlay": "hidden",
    "backgroundColor": "#000000", 
    "letterbox": "off", // Removes black bars
    "scale": "exactFit" // Forces stretching to fill screen
};

window.addEventListener("load", (event) => {
    const ruffle = window.RufflePlayer.newest();
    const player = ruffle.createPlayer();
    
    // FORCE FULL SIZE ON THE PLAYER ELEMENT
    player.style.width = "100%";
    player.style.height = "100%";
    player.style.display = "block";
    
    const container = document.getElementById("ruffle-container");
    container.appendChild(player);
    
    // Load the game
    player.load({ url: "1810 - Matrix Rampage.swf" });
});