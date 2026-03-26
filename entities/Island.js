import Phaser from 'phaser';

const ISLAND_CONFIG = {
    'island-atoll': {
        scale: 1.42,
        minimapRadiusScale: 0.62,
        collisionRadiusFactor: 0.28
    },
    'island-reef': {
        scale: 1.28,
        minimapRadiusScale: 0.58,
        collisionRadiusFactor: 0.26
    },
    'island-tropical': {
        scale: 1.35,
        minimapRadiusScale: 0.60,
        collisionRadiusFactor: 0.27
    },
    'island-volcanic': {
        scale: 1.20,
        minimapRadiusScale: 0.52,
        collisionRadiusFactor: 0.25
    },
    'island-frozen': {
        scale: 1.30,
        minimapRadiusScale: 0.55,
        collisionRadiusFactor: 0.26
    },
    'island-ruins': {
        scale: 1.25,
        minimapRadiusScale: 0.50,
        collisionRadiusFactor: 0.24
    }
};

export default class Island extends Phaser.GameObjects.Image {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        const config = ISLAND_CONFIG[texture] ?? {
            scale: 1.12,
            minimapRadiusScale: 0.48,
            collisionRadiusFactor: 0.26
        };

        this.islandConfig = config;
        this.setScale(config.scale);
        this.setOrigin(0.5);
        this.setDepth(12);
        this.setData('isIsland', true);
        this.setData('minimapRadiusScale', config.minimapRadiusScale);

        const body = this.body;
        if (body) {
            const r = Math.floor(Math.min(this.displayWidth, this.displayHeight) * config.collisionRadiusFactor);
            const offsetX = Math.floor(this.displayWidth / 2 - r);
            const offsetY = Math.floor(this.displayHeight / 2 - r);
            body.setCircle(r, offsetX, offsetY);
            body.updateFromGameObject();
            body.moves = false;
            body.immovable = true;
        }
    }
}
