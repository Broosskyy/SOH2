import Phaser from 'phaser';
import LoginScene from './scenes/LoginScene.js';
import LoadingScene from './scenes/LoadingScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    dom: {
        createContainer: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [LoginScene, LoadingScene, GameScene]
};

const game = new Phaser.Game(config);
