export default class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#0a0a0a');

        this._gear1Angle = 0;
        this._gear2Angle = 0;
        this._percent = 0;

        this._draw(width, height);

        this.scale.on('resize', (gameSize) => {
            this._redraw(gameSize.width, gameSize.height);
        });

        this._startLoading();
    }

    _draw(w, h) {
        this._g = this.add.graphics();

        const cx = w / 2;
        const cy = h * 0.28;

        this._gear1X = cx - 28;
        this._gear1Y = cy;
        this._gear2X = cx + 20;
        this._gear2Y = cy - 18;

        this._titleText = this.add.text(cx, h * 0.48, 'Laden Karte', {
            fontSize: Math.max(18, Math.round(w * 0.04)) + 'px',
            fontFamily: 'Arial, sans-serif',
            color: '#e84040',
            stroke: '#000',
            strokeThickness: 2,
        }).setOrigin(0.5);

        this._percentText = this.add.text(cx, h * 0.58, '0%', {
            fontSize: Math.max(16, Math.round(w * 0.035)) + 'px',
            fontFamily: 'Arial, sans-serif',
            color: '#e84040',
        }).setOrigin(0.5);

        const tipW = Math.min(w * 0.82, 720);
        const tipText = 'Tipp: Wenn Sie das Spiel ohne die Schaltfläche zum Abmelden schließen, bleibt Ihr Schiff im Spiel und Sie können es bei Ihrer Rückkehr als versunken sehen. Vergiss nicht, dich abzumelden, bevor du das Spiel schließt!';
        this._tipText = this.add.text(cx, h * 0.88, tipText, {
            fontSize: Math.max(10, Math.round(w * 0.018)) + 'px',
            fontFamily: 'Arial, sans-serif',
            color: '#aaaaaa',
            wordWrap: { width: tipW },
            align: 'center',
        }).setOrigin(0.5);

        this._drawGears();
    }

    _drawGears() {
        if (!this._g) return;
        this._g.clear();

        const drawGear = (g, cx, cy, outerR, innerR, teeth, angle, color) => {
            const toothArc = (Math.PI * 2) / teeth;
            g.lineStyle(2.5, color, 1);
            g.fillStyle(color, 1);

            g.beginPath();
            for (let i = 0; i < teeth; i++) {
                const a0 = angle + i * toothArc;
                const a1 = a0 + toothArc * 0.3;
                const a2 = a0 + toothArc * 0.5;
                const a3 = a0 + toothArc * 0.8;

                if (i === 0) {
                    g.moveTo(cx + Math.cos(a0) * innerR, cy + Math.sin(a0) * innerR);
                } else {
                    g.lineTo(cx + Math.cos(a0) * innerR, cy + Math.sin(a0) * innerR);
                }
                g.lineTo(cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR);
                g.lineTo(cx + Math.cos(a2) * outerR, cy + Math.sin(a2) * outerR);
                g.lineTo(cx + Math.cos(a3) * innerR, cy + Math.sin(a3) * innerR);
            }
            g.closePath();
            g.fillPath();
            g.strokePath();

            g.fillStyle(0x0a0a0a, 1);
            g.fillCircle(cx, cy, outerR * 0.38);
            g.lineStyle(2, color, 0.8);
            g.strokeCircle(cx, cy, outerR * 0.38);
        };

        const baseSize = Math.max(24, Math.min(this.scale.width * 0.055, 44));
        drawGear(this._g, this._gear1X, this._gear1Y, baseSize, baseSize * 0.72, 10, this._gear1Angle, 0xdddddd);
        drawGear(this._g, this._gear2X, this._gear2Y, baseSize * 0.72, baseSize * 0.5, 8, this._gear2Angle, 0xbbbbbb);
    }

    _redraw(w, h) {
        if (this._g)        { this._g.destroy();        this._g        = null; }
        if (this._titleText){ this._titleText.destroy(); this._titleText= null; }
        if (this._percentText){ this._percentText.destroy(); this._percentText = null; }
        if (this._tipText)  { this._tipText.destroy();  this._tipText  = null; }
        this._draw(w, h);
        this._percentText?.setText(Math.floor(this._percent) + '%');
    }

    _startLoading() {
        const totalMs = 2600;
        const steps = 60;
        const interval = totalMs / steps;
        let step = 0;

        const tips = [
            'Melde dich immer ab, bevor du das Spiel schließt!',
            'Sammle Ressourcen, um dein Schiff aufzurüsten.',
            'Wähle die richtige Munition für jeden Feindtyp.',
            'Erkunde alle 10 Seekarten für seltene Beute.',
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        this._tipText?.setText('Tipp: ' + randomTip);

        this._loadTimer = this.time.addEvent({
            delay: interval,
            repeat: steps - 1,
            callback: () => {
                step++;
                const eased = Math.pow(step / steps, 0.7);
                this._percent = eased * 100;
                if (this._percentText) {
                    this._percentText.setText(Math.floor(this._percent) + '%');
                }
                if (step >= steps) {
                    this._percent = 100;
                    this._percentText?.setText('100%');
                    this.time.delayedCall(320, () => {
                        this.scene.start('GameScene');
                    });
                }
            }
        });
    }

    update(time, delta) {
        const speed = 0.025;
        this._gear1Angle += speed;
        this._gear2Angle -= speed * 1.25;
        this._drawGears();
    }

    shutdown() {
        if (this._loadTimer) { this._loadTimer.destroy(); this._loadTimer = null; }
    }
}
