<div align="center">

# Neo's New Tab 🐇

<br>

<a href="https://github.com/QuantumVoidd/Neos-New-Tab/releases/latest">
  <img src="https://img.shields.io/badge/Download--Unpacked-brightgreen" alt="Download Extension">
</a>

<br>

<img src="https://api.visitorbadge.io/api/VisitorHit?user=QuantumVoidd&repo=Neos-New-Tab&countColor=%2337B1E7A" alt="Visitors">

<br>

<img src="https://img.shields.io/github/stars/QuantumVoidd/Neos-New-Tab?style=social" alt="GitHub stars">

</div>

---

# 🟢 ZION // The Matrix New Tab Experience

> *"Have you ever had a dream, Neo, that you were so sure was real? What if you were unable to wake from that dream? How would you know the difference between the dream world and the real world?"*

**Neo's New Tab** is a fully immersive **Construct** that replaces your mundane "New Tab" page with a high-functioning Matrix operating system. It features reactive digital rain, a CLI-driven terminal, a drag-and-drop Virtual file system, and integrated legacy simulation engines.

---

## 🛠️ Installation (Developer Mode) 💊

1. **Download/Clone** this repository to a local folder.
2. Open **Google Chrome** (or Brave/Edge) and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the project folder.
5. Open a new tab and **Enter the Matrix**.

---

## 📸 Interface Preview

![New Tab Interface](https://github.com/user-attachments/assets/027f7b9f-9457-45a4-ad87-2610b0f41c96)

![Solar System Engine](https://github.com/user-attachments/assets/27c31544-a320-457f-9408-71d34c1a9bf2)

![Emulator Interface](https://github.com/user-attachments/assets/865c91b5-cf6a-4350-986b-c89193b3b916)

![System Apps](https://github.com/user-attachments/assets/6438235b-34dc-4fbc-8fb3-501501bc415c)

---

## 🌌 Solar System Engine: Feature Showcase

A high-performance, 6DOF space flight simulator and celestial engine built with Three.js. This engine balances realistic astronomical scales with stylized, cinematic visual effects.

### 🚀 Advanced TARDIS Flight Systems
The TARDIS features a completely unique flight logic and visual suite that separates it from standard spacecraft:
* **Procedural Time Vortex**: Unlike standard ships that use particle streaks, the TARDIS generates a mathematically bending wormhole tunnel using custom WebGL Vertex and Fragment shaders.
* **Seamless 3D FBM Noise**: The vortex uses 3D Fractional Brownian Motion noise mapped to a perfect circle to eliminate visible seams and provide sharp, fractal detail.
* **Forward-Rushing Plasma**: Shader math is calibrated to ensure plasma clouds aggressively rush past the camera, providing a true sense of forward momentum.
* **Cinematic Dematerialization**: A unique "throbbing" transparency effect that pulses the model's alpha values during the 4.5-second build-up and rematerialization phases.
* **Enclosed Navigation**: The wormhole is a fully enclosed, opaque environment that completely obscures the background starfield during transit.

### 🪐 Celestial Engine Features
* **Logarithmic Depth Rendering**: Utilizes a logarithmic depth buffer to render objects across extreme scales (from small space stations to 25 million unit skyboxes) without flickering or Z-fighting.
* **NASA-Inspired Sun Shader**: A procedural thermal cell shader simulating boiling solar plasma and a dynamic chromosphere corona.
* **Dynamic LOD Milky Way**: A galaxy system consisting of 150,000 particles with dynamic Level of Detail (LOD) that adjusts particle size based on the observer's distance from the galactic core.
* **Orbital Proximity Logic**: Planets and moons calculate local speed multipliers based on your distance, ensuring smooth movement when up close and cinematic orbits when far away.

### 🛠 Technical HUD & System Tools
* **Live Telemetry HUD**: A real-time overlay in the top-left corner displaying current FPS and live spatial coordinates (X, Y, Z) normalized for readability.
* **Engine Control Sidebar**: A multi-tab interface allows users to:
    * **SYSTEM**: Toggle the HUD display and switch between locked **60 FPS** and high-refresh **120 FPS** modes.
    * **SHIPS**: Hot-swap between various ships (Enterprise, Millennium Falcon, X-Wing, etc.) and toggle 1st/3rd person views.
    * **PLANETS**: Adjust environmental settings like Saturn's ring opacity and Earth's cloud layers.
* **Full Screen Support**: Integrated toggle for native browser fullscreen mode for an immersive piloting experience.

### 🎮 Control Scheme
* **Gamepad Optimized**: Full support for Analog Sticks (Pitch/Yaw), Triggers (Accelerate/Hyperspeed), and D-Pad (Planet Cycling).
* **6DOF Manual Flight**: True six-degrees-of-freedom flight allows for rolling, pitching, and yawing simultaneously without gimbal lock.

---

## 🕹️ [ARCADE_SUBLEVELS]: Legacy Simulations

I have bypassed the simulation’s limitations to bring legacy hardware directly into the terminal. No external software is required; the browser is now the console.

### 🎮 Emulator Integrations
The terminal features a dedicated **Sub-Processor for Retro Hardware** supporting various signal types:

| System | Signal | Integration Type |
| :--- | :--- | :--- |
| **Nintendo (NES)** | `[SIGNAL: FCEUMM]` | 8-bit cycle-accurate emulation. |
| **Super Nintendo** | `[SIGNAL: SNES9X]` | 16-bit legacy support with DSP handling. |
| **Game Boy (GBA)** | `[SIGNAL: VBA NEXT]` | Handheld uplink for GBA ROMs. |
| **Game Boy (GB/GBC)** | `[SIGNAL: Gambatte]` | Handheld uplink for GB and GBC. |
| **Sega Genesis** | `[GearSystem]` | For 8-bit Sega titles. |
| **Sega Genesis** | `[SIGNAL: G_PLUS]` | Blast Processing enabled for 16-bit Sega titles. |
| **PlayStation 1** | `[SIGNAL: PSX REARMED]` | 32-bit disc-based simulation support. |

---

### ⚡ SWF Support (Powered by Ruffle)
Flash was a glitch in the Matrix they tried to patch out. I brought it back using the **Ruffle WASM engine**.
* **Native Emulation:** Run `.swf` files directly in the browser without plugins.
* **The Archive:** Access curated Matrix-themed Flash games and arcade classics.

---

## 🚀 System Capabilities

### 🖥️ The Construct (Visuals)
* **Dynamic Matrix Rain:** Rendering in both 2D and 3D (Vertical) modes.
* **Character Sets:** Matrix Katakana, Binary, Hex, ASCII, and Math symbols.
* **3D Environments:** Video backdrops including the Matrix Tunnel, Dojo, and Nebuchadnezzar Deck.
* **Visual FX:** CRT Scanlines, Digital Glitch, and Glow Effects.

### ⌨️ Terminal & Command Line
* **/root**: Opens the **Root Explorer** (GUI File Manager).
* **/weather [city]**: Real-time satellite weather uplink.
* **/whoami**: Advanced browser and hardware identity trace.
* **/arcade**: Open the game and emulator selection interface.
* **/ruffle [config]**: Adjust Flash scaling and performance settings.

### 📂 Root Explorer (Virtual File System)
* **Drag & Drop:** Move files into folders using intuitive mechanics.
* **Secure Vault:** Upload images, videos, and audio clips to local Chrome storage.
* **Media Preview:** Native previewing for images, video, and audio files.

---

## 📟 Updated Command List (CLI)

| Command | Action |
| :--- | :--- |
| `/root` | Open File Explorer |
| `/help` | List all available commands |
| `/weather [city]` | Check weather conditions |
| `/speed [10-100]` | Adjust rain velocity |
| `/space` | Launch NASA Solar System Viewer |
| `/earth` | Launch NASA Eyes of Earth Viewer |
| `/Asteroid` | Launch NASA Asteroid Watcher Viewer |
| `/reset` | Factory reset all settings |

---

## ⚠️ Disclaimer
This is a non-commercial fan project created for aesthetic purposes. It is not affiliated with Warner Bros. or the creators of The Matrix franchise.

"There is no spoon."

**Operator:** *Link established. The simulation is under your control.*
