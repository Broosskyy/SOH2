import Ship from './Ship.js';
import Phaser from 'phaser';

export default class Monster extends Ship {
    constructor(scene, x, y) {
        const types = ['monster-kraken', 'monster-leviathan', 'monster-shark', 'monster-demon'];
        const type = Phaser.Utils.Array.GetRandom(types);
        super(scene, x, y, type);
        
        this.monsterType = type;
        if (type === 'monster-kraken') {
            this.sprite.setScale(0.15);
            this.maxHP = 760;
            this.xpValue = 240;
        } else if (type === 'monster-leviathan') {
            this.sprite.setScale(0.18);
            this.maxHP = 1400;
            this.xpValue = 420;
        } else if (type === 'monster-shark') {
            this.sprite.setScale(0.2);
            this.maxHP = 380;
            this.xpValue = 110;
        } else {
            this.sprite.setScale(0.15);
            this.maxHP = 620;
            this.xpValue = 190;
        }
        this.hp = this.maxHP;
        this.updateHealthBar();

        this.setSize(120, 120);
        this.setInteractive(new Phaser.Geom.Rectangle(-60, -60, 120, 120), Phaser.Geom.Rectangle.Contains);

        this.selectionRadius = 82;

        this.on('pointerdown', () => {
            this.scene.events.emit('npc-selected', this);
        });

        this.speed = 60;
        this.nextWanderTime = 0;
        this.isUnderAttack = false;
        this.lastHitTime = 0;
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        if (!this.scene || !this.scene.time) return;

        this.isUnderAttack = true;
        this.lastHitTime = this.scene.time.now;
        
        // Stop movement immediately when attacked
        if (this.moveTween) {
            this.moveTween.stop();
            this.moveTween = null;
        }
        this.moveTarget = null;
        if (this.body) {
            this.body.setVelocity(0, 0);
        }
        this.setWakeVisible(false);
    }

    onDeath() {
        if (this.moveTween) {
            this.moveTween.stop();
            this.moveTween = null;
        }
        this.moveTarget = null;
        this.scene.events.emit('npc-died', this);
        this.destroy();
    }

    update() {
        super.update();
        if (!this.scene || !this.scene.time) return;

        // Handle recovery from attack state
        if (this.isUnderAttack && this.scene.time.now > this.lastHitTime + 5000) {
            this.isUnderAttack = false;
        }

        if (this.isUnderAttack) {
            // Stay in place when attacked
            if (this.moveTween) {
                this.moveTween.stop();
                this.moveTween = null;
                this.moveTarget = null;
            }
            return;
        }

        if (this.scene.time.now > this.nextWanderTime && !this.moveTarget) {
            this.wander();
        }
    }

    wander() {
        if (this.isUnderAttack) return;

        const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
        const distance = Phaser.Math.Between(50, 200);
        const targetX = Phaser.Math.Clamp(this.x + Math.cos(angle) * distance, 0, this.scene.mapWidth);
        const targetY = Phaser.Math.Clamp(this.y + Math.sin(angle) * distance, 0, this.scene.mapHeight);

        this.moveTarget = new Phaser.Math.Vector2(targetX, targetY);
        this.targetAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        
        const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
        const duration = (dist / this.speed) * 1000;

        if (this.moveTween) {
            this.moveTween.stop();
            this.moveTween = null;
        }

        this.moveTween = this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.moveTween = null;
                this.moveTarget = null;

                if (!this.scene || !this.scene.time || !this.active) {
                    return;
                }

                this.nextWanderTime = this.scene.time.now + Phaser.Math.Between(3000, 8000);
            }
        });
    }
}
