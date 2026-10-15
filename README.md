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

- One `index.html` file, no build step
- [three.js r128](https://threejs.org/) for the 3D scene, loaded from cdnjs
- Low-resolution rendering, vertex snapping and an ordered-dither post-processing shader for the retro look
- Pixel textures, signs and sounds (meows, rain, thunder) are all generated in code with Canvas and the Web Audio API
- Settings and Kanlungan progress are saved in the browser with `localStorage`

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Credits

Made by [@justinellarioza-specto](https://github.com/justinellarioza-specto).
