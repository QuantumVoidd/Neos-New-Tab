// nes-emulator.js
class MatrixNES {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.imageData = this.ctx.createImageData(256, 240);
        
        // Initialize JSNES
        this.nes = new jsnes.NES({
            onFrame: (buffer) => {
                for (var i = 0; i < 256 * 240; i++) {
                    this.imageData.data[i*4+0] = (buffer[i] >> 16) & 0xFF;
                    this.imageData.data[i*4+1] = (buffer[i] >> 8) & 0xFF;
                    this.imageData.data[i*4+2] = buffer[i] & 0xFF;
                    this.imageData.data[i*4+3] = 0xFF;
                }
                this.ctx.putImageData(this.imageData, 0, 0);
            },
            onStatusUpdate: console.log,
            onAudioSample: null // Audio disabled for maximum stability
        });

        this.setupControls();
    }

    loadRom(data) {
        this.nes.loadROM(data);
        this.start();
    }

    start() {
        setInterval(() => { this.nes.frame(); }, 1000 / 60);
    }

    setupControls() {
        const keys = {
            38: jsnes.Controller.BUTTON_UP, 40: jsnes.Controller.BUTTON_DOWN,
            37: jsnes.Controller.BUTTON_LEFT, 39: jsnes.Controller.BUTTON_RIGHT,
            90: jsnes.Controller.BUTTON_A, 88: jsnes.Controller.BUTTON_B,
            13: jsnes.Controller.BUTTON_START, 16: jsnes.Controller.BUTTON_SELECT
        };
        document.addEventListener('keydown', (e) => { 
            if (keys[e.keyCode] !== undefined) this.nes.buttonDown(1, keys[e.keyCode]); 
        });
        document.addEventListener('keyup', (e) => { 
            if (keys[e.keyCode] !== undefined) this.nes.buttonUp(1, keys[e.keyCode]); 
        });
    }
}