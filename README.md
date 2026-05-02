# VS Code Mario

[![Version](https://img.shields.io/visual-studio-marketplace/v/pabasara-mahindapala.vscode-mario?label=marketplace&color=blue)](https://marketplace.visualstudio.com/items?itemName=pabasara-mahindapala.vscode-mario)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/pabasara-mahindapala.vscode-mario)](https://marketplace.visualstudio.com/items?itemName=pabasara-mahindapala.vscode-mario)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Build](https://img.shields.io/github/actions/workflow/status/pabasara-mahindapala/vscode-mario/build.yml?branch=main)](https://github.com/pabasara-mahindapala/vscode-mario/actions)

A Mario-style game for VS Code.

## Features

- Play in the VS Code sidebar
- 8-bit sound effects
- Stompable Goombas!
- Collectible coins!
- Press **R** to restart a level, **Space** to go to the next level

## Controls

| Key | Action |
|-----|--------|
| Arrow Left / Right | Move |
| Space / Arrow Up | Jump |
| Space | Advance to next level (after winning the current one) |
| R | Restart current level|

## Installation

### From source (for development)

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

In the **Explorer** sidebar (`Ctrl+Shift+E`) look for the **VS Code Mario** panel at the bottom.

## Level design

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

## License

[MIT](LICENSE)
