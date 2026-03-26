import Phaser from 'phaser';

export default class Gift extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, options = null) {
        const defaultType = Phaser.Utils.Array.GetRandom(['gift-chest', 'gold-bag', 'xp-orb']);
        const type = options?.type ?? defaultType;
        super(scene, x, y, type);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.giftType = type;
        this.dropCategory = options?.dropCategory ?? 'ambient';
        this.goldValue = options?.goldValue ?? 0;
        this.materialValue = options?.materialValue ?? 0;
        this.hpValue = 0;
        this.xpValue = 0;

        if (type === 'gift-chest') {
            this.setScale(options?.scale ?? 0.08);
            this.hpValue = options?.hpValue ?? 50;
            this.xpValue = options?.xpValue ?? 20;
            this.goldValue = options?.goldValue ?? this.goldValue;
            this.materialValue = options?.materialValue ?? Math.max(this.materialValue, 2);
        } else if (type === 'gold-bag') {
            this.setScale(options?.scale ?? 0.08);
            this.hpValue = options?.hpValue ?? 10;
            this.xpValue = options?.xpValue ?? 50;
            this.goldValue = options?.goldValue ?? Math.max(this.goldValue, 25);
        } else {
            this.setScale(options?.scale ?? 0.12);
            this.hpValue = options?.hpValue ?? 0;
            this.xpValue = options?.xpValue ?? 100;
        }

        if (options?.materialValue != null) {
            this.materialValue = options.materialValue;
        }
        if (options?.goldValue != null) {
            this.goldValue = options.goldValue;
        }

        this.spawnY = y;
        this.floatTween = scene.tweens.add({
            targets: this,
            y: y - 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.pulseTween = scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.06,
            scaleY: this.scaleY * 1.06,
            alpha: 0.92,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}

