# VS Code Mario

A Mario-style platformer game that lives inside the VS Code sidebar. Take a quick break without leaving your editor.

## Features

- Playable directly in the VS Code Explorer sidebar
- Two levels of increasing difficulty
- Procedural 8-bit sound effects (Web Audio API — no audio files)
- All graphics drawn on canvas — no image assets
- Score carries across levels; press **R** to restart a level, **Space** to advance after winning

## Controls

| Key | Action |
|-----|--------|
| Arrow Left / Right | Move |
| Space / Arrow Up | Jump |
| Space | Advance to next level (after winning) |
| R | Restart current level (after game over or win) |

## Installation

### From source

```bash
git clone https://github.com/pabasara-mahindapala/vscode-mario.git
cd vscode-mario
npm install
npm run compile
```

Then press **F5** in VS Code to launch an Extension Development Host with the extension loaded.

### Package as VSIX

```bash
npm install -g @vscode/vsce
vsce package
code --install-extension vscode-mario-*.vsix
```

## How to open the game

Open the **Explorer** sidebar (`Ctrl+Shift+E`) and look for the **VS Code Mario** panel at the bottom. Click the panel to start.

## Adding levels

All level data lives in `media/level.js` as a `window.LEVELS` array. Each entry is a self-contained object:

```js
{
  name: 'Level N',
  playerSpawn: [tileX, tileY],   // starting position in tile coordinates
  map: [
    // 14 rows × N columns of tile IDs
    // 0 = air, 1 = ground, 2 = brick, 3 = coin,
    // 4 = flag, 6 = cloud, 7 = pipe top, 8 = pipe body
  ],
  enemySpawns: [[tileX, tileY], ...],
}
```

Add a new object to the array and the multi-level system picks it up automatically.

## Project structure

```
media/
  level.js   — level data (LEVELS array)
  game.js    — game logic (physics, collision, entities)
  sounds.js  — procedural sound effects via Web Audio API
  main.js    — canvas rendering, game loop, input handling
  style.css  — overlay and canvas styles
src/
  extension.ts — VS Code extension entry point, webview setup
```

## Requirements

- VS Code 1.85.0 or later

## License

[MIT](LICENSE)
