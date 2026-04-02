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

        this.wake = scene.add.image(0, 30, 'ship-wake');
        this.wake.setScale(0.1);
        this.wake.setAlpha(0.4);
        this.wake.setAngle(180);
        this.add(this.wake);
        this.wake.setVisible(false);

        this.maxHP = 100;
        this.hp = 100;
        this.healthBarWidth = 40;
        this.healthBarHeight = 4;
        this.healthBarOffsetY = -40;
        this.createHealthBar();

        this.targetAngle = 0;
        this.rotationSpeed = 0.05;
        this.speed = 150;
        this.useSpriteRotation = true;

        /* Wake foam trail timing */
        this._lastFoamTime = 0;

        /* Damage smoke timing */
        this._lastSmokeTime = 0;
        
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

    /* ── Kielwasser-Schaum: foam blob trails behind moving ship ── */
    _emitWakeFoam(speed) {
        const now = this.scene?.time?.now ?? 0;
        const interval = speed > 80 ? 110 : 170;
        if (now - this._lastFoamTime < interval) return;
        this._lastFoamTime = now;

        const behind = this.targetAngle + Math.PI;
        const dist   = 18 + Math.random() * 10;
        const bx     = this.x + Math.cos(behind) * dist + (Math.random() - 0.5) * 12;
        const by     = this.y + Math.sin(behind) * dist + (Math.random() - 0.5) * 8;
        const r      = 5 + Math.random() * 6;

        const blob = this.scene.add.circle(bx, by, r, 0xd0f0ff, 0.55).setDepth(50);
        this.scene.tweens.add({
            targets: blob,
            alpha:   0,
            scaleX:  2.2,
            scaleY:  1.1,
            x:       bx + Math.cos(behind) * 18,
            y:       by + Math.sin(behind) * 10,
            duration: 780,
            ease:    'Sine.Out',
            onComplete: () => blob.destroy()
        });
    }

    /* ── Rauch bei wenig HP: smoke + fire particles ── */
    _emitDamageSmoke() {
        const ratio = this.hp / this.maxHP;
        if (ratio >= 0.30) return;

        const now = this.scene?.time?.now ?? 0;
        const interval = ratio < 0.15 ? 220 : 380;
        if (now - this._lastSmokeTime < interval) return;
        this._lastSmokeTime = now;

        /* Smoke puff — dark grey, drifts upward */
        const ox = (Math.random() - 0.5) * 20;
        const oy = -10 + (Math.random() - 0.5) * 10;
        const smoke = this.scene.add.circle(this.x + ox, this.y + oy, 8 + Math.random() * 7, 0x444444, 0.55).setDepth(1600);
        this.scene.tweens.add({
            targets:  smoke,
            y:        smoke.y - 50 - Math.random() * 30,
            alpha:    0,
            scaleX:   3.5,
            scaleY:   3.5,
            duration: 900 + Math.random() * 400,
            ease:     'Sine.Out',
            onComplete: () => smoke.destroy()
        });

        /* Fire spark when critically low */
        if (ratio < 0.15) {
            const ox2 = (Math.random() - 0.5) * 16;
            const spark = this.scene.add.circle(this.x + ox2, this.y - 6, 3 + Math.random() * 3, 0xff6600, 1)
                .setBlendMode(Phaser.BlendModes.ADD).setDepth(1601);
            this.scene.tweens.add({
                targets:  spark,
                y:        spark.y - 28 - Math.random() * 18,
                x:        spark.x + (Math.random() - 0.5) * 18,
                alpha:    0,
                duration: 420 + Math.random() * 200,
                onComplete: () => spark.destroy()
            });
        }
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

        if (this.scene?.player === this) {
            this.scene.events.emit('damage-popup', this.x, this.y - 20, amount);
        }

        /* Seafight-Treffer-Blitz: Sprite kurz weiß aufleuchten lassen */
        if (this.sprite && !this._flashActive && this.scene?.time) {
            this._flashActive = true;
            const prevTint = this.sprite.tintTopLeft ?? 0xffffff;
            this.sprite.setTint(0xffffff);
            this.scene.time.delayedCall(85, () => {
                if (this.sprite?.active) this.sprite.setTint(prevTint);
                this._flashActive = false;
            });
        }

        if (this.hp <= 0) {
            this.onDeath();
        }
    }

    onDeath() {
        if (this.particles) this.particles.destroy();
    }

    update() {
        /* Sprites in PNG zeigen Bug nach OBEN (North) — Phaser targetAngle 0 = RECHTS (East).
           Versatz: +π/2 so dass das Schiff immer in die tatsächliche Bewegungsrichtung zeigt. */
        const SPRITE_OFFSET = Math.PI / 2;
        const visualTarget  = this.targetAngle + SPRITE_OFFSET;

        if (this.useSpriteRotation) {
            /* ── 8-Richtungs-System (Seafight-Style) ──────────────────────────────
               Wie in Seafight/BOS: das Schiff snappt zu einer von 8 Richtungen
               (N, NO, O, SO, S, SW, W, NW) statt sich frei zu drehen.
               Wir schnappen den visualTarget auf das nächste Vielfache von 45° (π/4).
               Dann drehen wir das Sprite schnell (aber nicht instant) zur neuen
               Snap-Richtung — flüssiger Übergang ohne endlose Zwischenpositionen. */
            const TWO_PI   = Math.PI * 2;
            const STEP     = Math.PI / 4; /* 45° pro Schritt = 8 Richtungen */

            /* Wrap visualTarget → 0 … 2π, dann nächsten 45°-Schritt wählen */
            const wrapped  = ((visualTarget % TWO_PI) + TWO_PI) % TWO_PI;
            const snapped  = Math.round(wrapped / STEP) * STEP;

            /* Glätte den Übergang: dreht sich mit 3× Geschwindigkeit zum Snap-Punkt */
            const snapSpeed = this.rotationSpeed * 3.5;
            const diff      = Phaser.Math.Angle.Wrap(snapped - this.sprite.rotation);
            if (Math.abs(diff) < snapSpeed) {
                this.sprite.rotation = snapped;
            } else {
                this.sprite.rotation += Math.sign(diff) * snapSpeed;
            }
        } else {
            const isRight = Math.abs(this.targetAngle) < Math.PI / 2;
            this.sprite.setScale(isRight ? Math.abs(this.sprite.scaleX) : -Math.abs(this.sprite.scaleX), this.sprite.scaleY);
        }
        
        if (this.wake) {
            /* Wake-Position dynamisch hinter dem Schiff (relativ zum Container) */
            const behindDist = 22;
            this.wake.setPosition(
                Math.cos(this.targetAngle + Math.PI) * behindDist,
                Math.sin(this.targetAngle + Math.PI) * behindDist
            );
            this.wake.rotation = this.targetAngle + Math.PI + SPRITE_OFFSET;
        }

        /* Foam trail — nur für Spielerschiff (this._isPlayer); NPCs erzeugen keinen Schaum
           → verhindert hunderte gleichzeitige Partikel auf Mobilgeräten */
        if (this._isPlayer && this.wake?.visible && this.body) {
            const spd = this.body.velocity.length();
            if (spd > 15) this._emitWakeFoam(spd);
        }

        /* Low-HP damage smoke — Spielerschiff immer, NPCs budgetiert */
        if (this.hp < this.maxHP * 0.30 && this.scene) {
            if (this._isPlayer) {
                this._emitDamageSmoke();
            } else {
                /* NPCs: max. 3 rauchende Schiffe gleichzeitig im Bild */
                if ((this.scene._globalSmokeCount ?? 0) < 3) this._emitDamageSmoke();
            }
        }
    }
}
