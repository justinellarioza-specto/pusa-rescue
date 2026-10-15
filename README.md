# Pusa Rescue

A first-person, PS1-style night game set in a rainy Filipino barangay. A storm is coming, and Lola needs you to find the stray cats hiding around the street and bring them home to her shelter box before midnight.

**▶ Play it here: https://justinellarioza-specto.github.io/pusa-rescue/**

![Main menu](screenshots/menu.jpg)

## Modes

| Mode | What it is |
|---|---|
| **Klasik** | Find 8 stray cats in 5 minutes. Your fastest time is saved. |
| **Lagim** | Horror. Darker streets, a draining flashlight battery, and something that follows you. It only moves when your light is not on it. Contains a jumpscare. |
| **Kanlungan** | Build-up. Every night brings more cats. Each cat you rescue gets a name and lives at the shelter. Earn pesos to buy upgrades and build the shelter up. |

![Mode select](screenshots/modes.jpg)

## Controls

| | Computer | Phone |
|---|---|---|
| Walk | `W A S D` (`Shift` to run) | Left joystick |
| Look | Mouse (click the game to lock it) | Drag the right side of the screen |
| Pick up a cat | `E` or click | **KUNIN** button |
| Pause | `Esc` or `P` | **II** button |

Tips: cats' eyes shine when your flashlight hits them, and their meows come from the left or right, so headphones help.

## Screenshots

| | |
|---|---|
| ![Sari-sari store](screenshots/sari-sari.jpg) | ![Lagim mode](screenshots/lagim.jpg) |
| ![Kanlungan shelter](screenshots/kanlungan.jpg) | ![Phone controls](screenshots/phone.jpg) |

## How it's built

- Plain HTML, CSS and JavaScript ES modules, no build step
- [three.js r128](https://threejs.org/) for the 3D scene, loaded from jsDelivr through an import map
- Low-resolution rendering, PS1-style vertex snapping and an ordered-dither post-processing shader (GLSL) for the retro look
- Pixel textures, signs and sounds (meows, rain, thunder) are all generated in code with Canvas and the Web Audio API
- Settings and Kanlungan progress are saved in the browser with `localStorage`

## Project structure

```
pusa-rescue/
├── index.html              Page markup: menus, HUD, overlays
├── css/
│   ├── base.css            Colors, fonts, layout, buttons
│   ├── menus.css           Main menu, mode select, settings, pause, results, shop
│   └── hud.css             In-game HUD, touch controls, jumpscare
├── shaders/
│   ├── post.vert.glsl      Fullscreen pass vertex shader
│   ├── post.frag.glsl      Retro filter: color grade, grain, vignette, dither
│   └── ps1-snap.glsl       Vertex snapping injected into every material
└── js/
    ├── main.js             Entry point and frame loop
    ├── config.js           Tuning numbers (speed, reach, graphics presets)
    ├── game.js             Modes, round logic, stalker AI, results, night cycle
    ├── input.js            Keyboard, mouse and touch controls
    ├── audio.js            Synthesized sound effects and ambience
    ├── core/
    │   ├── storage.js      Settings, save data and best times
    │   └── util.js         Random helpers
    ├── data/
    │   ├── cats.js         Hiding spots and cat names
    │   └── shop.js         Kanlungan upgrades and prices
    ├── engine/
    │   ├── renderer.js     Renderer, camera, lights, flashlight, post-processing
    │   ├── materials.js    PS1-style material
    │   ├── textures.js     Pixel-art textures drawn with Canvas
    │   ├── quality.js      Applies the Graphics setting
    │   └── load.js         Loads shader files
    ├── world/
    │   ├── street.js       The barangay map and props
    │   ├── cats.js         Cat model, hiding cats, shelter roster
    │   ├── shelter.js      Kanlungan upgrade visuals
    │   ├── lagim.js        Stalker figure and batteries
    │   ├── atmosphere.js   Rain, lightning, lamps, wind
    │   └── helpers.js      Mesh helpers and collision boxes
    └── ui/
        ├── screens.js      Screen switching, subtitles, toasts, fullscreen
        ├── menus.js        Menu buttons and settings
        └── shop.js         Kanlungan shop and roster
```

## Run it locally

The game uses ES modules and loads shader files, so it needs a local web server (opening `index.html` directly won't work). From the project folder:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the address it prints (for example `http://localhost:8000`).

## Credits

Made by [@justinellarioza-specto](https://github.com/justinellarioza-specto).
