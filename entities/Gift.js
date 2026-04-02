import Phaser from 'phaser';

/* Easter-egg variants per gift type */
const EGG_MAP = {
    'gift-chest': { emoji: '🥚', ringColor: 0xffd700, coreColor: 0xffaa00, label: 'Goldenes Ei' },
    'gold-bag':   { emoji: '🥚', ringColor: 0xff88cc, coreColor: 0xff4499, label: 'Rosa Ei'     },
    'xp-orb':     { emoji: '🥚', ringColor: 0x66ff88, coreColor: 0x00cc44, label: 'Grünes Ei'   },
};

export default class Gift extends Phaser.GameObjects.Container {
    constructor(scene, x, y, options = null) {
        super(scene, x, y);

        const defaultType = Phaser.Utils.Array.GetRandom(['gift-chest', 'gold-bag', 'xp-orb']);
        const type = options?.type ?? defaultType;

        this.giftType        = type;
        this.dropCategory    = options?.dropCategory   ?? 'ambient';
        this.goldValue       = options?.goldValue      ?? 0;
        this.materialValue   = options?.materialValue  ?? 0;
        this.hpValue         = 0;
        this.xpValue         = 0;

        if (type === 'gift-chest') {
            this.hpValue       = options?.hpValue      ?? 50;
            this.xpValue       = options?.xpValue      ?? 20;
            this.goldValue     = options?.goldValue     ?? this.goldValue;
            this.materialValue = options?.materialValue ?? Math.max(this.materialValue, 2);
        } else if (type === 'gold-bag') {
            this.hpValue       = options?.hpValue      ?? 10;
            this.xpValue       = options?.xpValue      ?? 50;
            this.goldValue     = options?.goldValue     ?? Math.max(this.goldValue, 25);
        } else {
            this.hpValue       = options?.hpValue      ?? 0;
            this.xpValue       = options?.xpValue      ?? 100;
        }

        if (options?.materialValue != null) this.materialValue = options.materialValue;
        if (options?.goldValue     != null) this.goldValue     = options.goldValue;

        const def = EGG_MAP[type] ?? EGG_MAP['gift-chest'];

        /* Outer glow ring */
        this._ring = scene.add.circle(0, 0, 17, def.ringColor, 0.22);
        /* Inner core ring */
        this._core = scene.add.circle(0, 0, 10, def.coreColor, 0.40);
        /* Emoji text */
        this._txt  = scene.add.text(0, 1, def.emoji, {
            fontSize: '20px',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5, 0.5);

        this.add([this._ring, this._core, this._txt]);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        /* Center a small circle body on the container position */
        if (this.body) {
            this.body.setCircle(18, -18, -18);
            this.body.setImmovable(true);
        }

        /* Float animation */
        this.spawnY = y;
        scene.tweens.add({
            targets: this, y: y - 9,
            duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        /* Pulse glow ring */
        scene.tweens.add({
            targets: this._ring,
            scaleX: 1.35, scaleY: 1.35, alpha: 0.08,
            duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    }
}
