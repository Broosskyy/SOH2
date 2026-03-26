import Phaser from 'phaser';

const ISLAND_CONFIG = {
    'island-atoll':    { scale: 0.55, minimapRadius: 9,  collisionRadius: 105 },
    'island-reef':     { scale: 0.48, minimapRadius: 9,  collisionRadius: 105 },
    'island-tropical': { scale: 0.32, minimapRadius: 10, collisionRadius: 108 },
    'island-volcanic': { scale: 0.28, minimapRadius: 8,  collisionRadius:  95 },
    'island-frozen':   { scale: 0.30, minimapRadius: 9,  collisionRadius: 102 },
    'island-ruins':    { scale: 0.24, minimapRadius: 7,  collisionRadius:  80 },
    'island-guild':    { scale: 0.42, minimapRadius: 13, collisionRadius: 145 }
};

export default class Island extends Phaser.GameObjects.Image {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        const cfg = ISLAND_CONFIG[texture] ?? { scale: 0.30, minimapRadius: 8, collisionRadius: 90 };
        this.islandConfig = cfg;
        this.setScale(cfg.scale);
        this.setOrigin(0.5);
        this.setDepth(12);
        this.setData('isIsland', true);
        this.setData('minimapRadius', cfg.minimapRadius);

        const body = this.body;
        if (body) {
            const r = cfg.collisionRadius;
            body.isCircle  = true;
            body.radius    = r;
            body.width     = r * 2;
            body.height    = r * 2;
            body.halfWidth = r;
            body.halfHeight= r;
            body.offset.set(0, 0);
            body.position.set(x - r, y - r);
            body.center.set(x, y);
            body.moves     = false;
            body.immovable = true;
            if (body.world) {
                body.world.staticTree.remove(body);
                body.world.staticTree.insert(body);
            }
        }
    }
}
