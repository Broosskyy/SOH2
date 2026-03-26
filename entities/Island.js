import Phaser from 'phaser';

const ISLAND_CONFIG = {
    'island-atoll':    { scale: 1.42, minimapRadius: 16, collisionRadius: 100 },
    'island-reef':     { scale: 1.28, minimapRadius: 14, collisionRadius: 85  },
    'island-tropical': { scale: 1.35, minimapRadius: 15, collisionRadius: 90  },
    'island-volcanic': { scale: 1.20, minimapRadius: 13, collisionRadius: 78  },
    'island-frozen':   { scale: 1.30, minimapRadius: 14, collisionRadius: 84  },
    'island-ruins':    { scale: 1.25, minimapRadius: 12, collisionRadius: 72  },
    'island-guild':    { scale: 1.60, minimapRadius: 22, collisionRadius: 130 }
};

export default class Island extends Phaser.GameObjects.Image {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        const cfg = ISLAND_CONFIG[texture] ?? { scale: 1.12, minimapRadius: 12, collisionRadius: 80 };
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
                body.world.staticTree.add(body);
            }
        }
    }
}
