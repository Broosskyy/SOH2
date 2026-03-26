import Phaser from 'phaser';

const ISLAND_CONFIG = {
    'island-atoll': {
        scale: 1.42,
        minimapRadiusScale: 0.62,
        collisionScaleX: 0.56,
        collisionScaleY: 0.48
    },
    'island-reef': {
        scale: 1.28,
        minimapRadiusScale: 0.58,
        collisionScaleX: 0.64,
        collisionScaleY: 0.54
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
            collisionScaleX: 0.6,
            collisionScaleY: 0.5
        };

        this.islandConfig = config;
        this.setScale(config.scale);
        this.setOrigin(0.5);
        this.setDepth(12);
        this.setData('isIsland', true);
        this.setData('minimapRadiusScale', config.minimapRadiusScale);

        const body = this.body;
        if (body) {
            const collisionWidth = Math.max(80, this.displayWidth * config.collisionScaleX);
            const collisionHeight = Math.max(80, this.displayHeight * config.collisionScaleY);
            body.setSize(collisionWidth, collisionHeight);
            body.updateFromGameObject();
            body.moves = false;
            body.immovable = true;
        }
    }
}
