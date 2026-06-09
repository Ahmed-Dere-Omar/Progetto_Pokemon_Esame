// src/main.js
import { InputConfig } from './tasti_input.js';

// Scenes
import BootScene from './scenes/BootScene.js';
import LoginScene from './scenes/LoginScene.js';
import StarterScene from './scenes/StarterScene.js';
import WorldScene from './scenes/WorldScene.js';
import PVEScene from './scenes/PVEScene.js';
import CPKScene from './scenes/CPKScene.js';
import PvPScene from './scenes/PvPScene.js';
import BattleScene from './scenes/BattleScene.js';

const config = {
    type: Phaser.AUTO,
    scale: { 
        mode: Phaser.Scale.FIT, 
        autoCenter: Phaser.Scale.CENTER_BOTH, 
        width: 1000, 
        height: 800 
    },
    parent: 'game-container',
    pixelArt: true,
    roundPixels: true,
    dom: { createContainer: true },
    physics: { 
        default: 'arcade', 
        arcade: { gravity: { y: 0 } } 
    },
    scene: [
        BootScene, 
        LoginScene, 
        StarterScene, 
        WorldScene, 
        PVEScene, 
        CPKScene, 
        PvPScene, 
        BattleScene
    ]
};

const game = new Phaser.Game(config);

// Mobile Controls handling
document.addEventListener('DOMContentLoaded', () => {
    const simulateKey = (keyName) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: keyName, code: keyName, bubbles: true, cancelable: true }));
        window.dispatchEvent(new CustomEvent('dpad-input', { detail: { key: keyName } }));
        setTimeout(() => {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: keyName, code: keyName, bubbles: true, cancelable: true }));
        }, 50);
    };

    const bindMobileButton = (id, keyName) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                simulateKey(keyName);
            }, { passive: false });
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                simulateKey(keyName);
            });
        }
    };

    bindMobileButton('btn-up', 'ArrowUp');
    bindMobileButton('btn-down', 'ArrowDown');
    bindMobileButton('btn-left', 'ArrowLeft');
    bindMobileButton('btn-right', 'ArrowRight');
    bindMobileButton('btn-enter', 'Enter');
    bindMobileButton('btn-esc', 'Escape');
    bindMobileButton('btn-menu', 'Escape');
    bindMobileButton('btn-shift', 'Shift');
});

export default game;
