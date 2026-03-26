import Phaser from 'phaser';

export default class Ship extends Phaser.GameObjects.Container {
    constructor(scene, x, y, texture) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.waterHaloGfx = scene.add.graphics();
        this.waterHaloGfx.fillStyle(0x55ccff, 0.07);
        this.waterHaloGfx.fillEllipse(0, 8, 100, 44);
        this.add(this.waterHaloGfx);

        this.sprite = scene.add.sprite(0, 0, texture);
        this.sprite.setScale(0.12); 
        this.add(this.sprite);

        // Ship Wake
        this.wake = scene.add.image(0, 30, 'ship-wake');
        this.wake.setScale(0.1);
        this.wake.setAlpha(0.4);
        this.wake.setAngle(180);
        this.add(this.wake);
        this.wake.setVisible(false);

        // Health bar
        this.maxHP = 100;
        this.hp = 100;
        this.healthBarWidth = 40;
        this.healthBarHeight = 4;
        this.healthBarOffsetY = -40;
        this.createHealthBar();

        this.targetAngle = 0;
        this.rotationSpeed = 0.05;
        this.speed = 150;
        this.useSpriteRotation = true; // New flag to toggle sprite rotation
        
        // Neon Particles Trail
        if (texture.includes('neon') || texture === 'player-ship') {
            this.particles = scene.add.particles(0, 0, 'xp-orb', {
                scale: { start: 0.05, end: 0 },
                alpha: { start: 0.5, end: 0 },
                lifespan: 600,
                blendMode: 'ADD',
                frequency: 100,
                follow: this
            });
        }
    }

    setWakeVisible(visible) {
        if (this.wake) this.wake.setVisible(visible);
    }

    createHealthBar() {
        this.barBg = this.scene.add.graphics();
        this.barFill = this.scene.add.graphics();
        this.add(this.barBg);
        this.add(this.barFill);
        this.updateHealthBar();
    }

    updateHealthBar() {
        const barWidth = this.healthBarWidth ?? 40;
        const barHeight = this.healthBarHeight ?? 4;
        const offsetY = this.healthBarOffsetY ?? -40;
        const startX = -barWidth / 2;

        this.barBg.clear();
        this.barBg.fillStyle(0x000000, 0.5);
        this.barBg.fillRect(startX, offsetY, barWidth, barHeight);

        this.barFill.clear();
        const percent = Math.max(0, this.hp / this.maxHP);
        const color = percent > 0.5 ? 0x00ff00 : percent > 0.25 ? 0xffff00 : 0xff0000;
        this.barFill.fillStyle(color, 1);
        this.barFill.fillRect(startX, offsetY, barWidth * percent, barHeight);
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.updateHealthBar();
        
        // Damage number popup
        this.scene.events.emit('damage-popup', this.x, this.y - 20, amount);

        if (this.hp <= 0) {
            this.onDeath();
        }
    }

    onDeath() {
        if (this.particles) this.particles.destroy();
    }

    update() {
        // Update rotation towards targetAngle
        const diff = Phaser.Math.Angle.Wrap(this.targetAngle - this.sprite.rotation);
        
        if (this.useSpriteRotation) {
            if (Math.abs(diff) < this.rotationSpeed) {
                this.sprite.rotation = this.targetAngle;
            } else {
                this.sprite.rotation += Math.sign(diff) * this.rotationSpeed;
            }
        } else {
            // Limited rotation: just flip sprite based on movement direction
            const isRight = Math.abs(this.targetAngle) < Math.PI / 2;
            this.sprite.setScale(isRight ? Math.abs(this.sprite.scaleX) : -Math.abs(this.sprite.scaleX), this.sprite.scaleY);
        }
        
        // Sync wake rotation (always follows targetAngle)
        if (this.wake) {
            this.wake.rotation = this.targetAngle + Math.PI;
        }
    }
}
