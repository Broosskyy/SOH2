import Phaser from 'phaser';

const TOWER_COUNT   = 6;
const TOWER_MAX_HP  = 3000;
const TOWER_RADIUS  = 110;

export default class GuildIsland extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        scene.add.existing(this);

        this.capturedBy = null;
        this.captureColor = 0xdddddd;

        this._islandImg = scene.add.image(0, 0, 'island-guild').setScale(1.6).setDepth(10);
        this.add(this._islandImg);

        this.towers = [];
        this._towerImgs  = [];
        this._towerHpBars = [];
        this._buildTowers(scene);

        this._captureFlag = null;
        this._buildCaptureFlag(scene);

        this._buildConquestUI(scene);
        this.setDepth(11);

        scene.physics.add.existing(this, true);
        const body = this.body;
        if (body) {
            const r = 130;
            body.isCircle = true; body.radius = r;
            body.width = r * 2;   body.height = r * 2;
            body.halfWidth = r;   body.halfHeight = r;
            body.offset.set(0, 0);
            body.position.set(x - r, y - r);
            body.center.set(x, y);
            body.moves = false; body.immovable = true;
            if (body.world) { body.world.staticTree.remove(body); body.world.staticTree.insert(body); }
        }
    }

    _buildTowers(scene) {
        for (let i = 0; i < TOWER_COUNT; i++) {
            const angle  = (i / TOWER_COUNT) * Math.PI * 2 - Math.PI / 2;
            const tx = Math.cos(angle) * TOWER_RADIUS;
            const ty = Math.sin(angle) * TOWER_RADIUS;

            const towerImg = scene.add.image(tx + this.x, ty + this.y, 'guild-tower')
                .setScale(0.14).setDepth(20).setInteractive({ useHandCursor: true });

            this._towerImgs.push(towerImg);

            const hpBg = scene.add.rectangle(tx + this.x, ty + this.y - 28, 48, 6, 0x222222, 0.85).setDepth(21);
            const hpFill = scene.add.rectangle(tx + this.x - 23, ty + this.y - 28, 44, 4, 0x22cc55, 1).setDepth(22).setOrigin(0, 0.5);
            const hpText = scene.add.text(tx + this.x, ty + this.y - 38, `${TOWER_MAX_HP}/${TOWER_MAX_HP}`, {
                fontSize: '8px', fontFamily: 'Arial', fill: '#fff', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(23);

            this._towerHpBars.push({ bg: hpBg, fill: hpFill, text: hpText });
            this.towers.push({ hp: TOWER_MAX_HP, maxHp: TOWER_MAX_HP, active: true, angle, tx, ty });

            towerImg.on('pointerdown', () => {
                scene.events.emit('guild-tower-clicked', { island: this, index: i });
            });
        }
    }

    _buildCaptureFlag(scene) {
        this._flagPole = scene.add.rectangle(this.x, this.y - 20, 3, 42, 0x888888, 1).setDepth(24);
        this._flagBanner = scene.add.rectangle(this.x + 12, this.y - 36, 24, 14, 0xdddddd, 1).setDepth(24);
        this._flagText = scene.add.text(this.x + 12, this.y - 36, '?', {
            fontSize: '8px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(25);
    }

    _buildConquestUI(scene) {
        this._conquestBar = scene.add.graphics().setDepth(26);
        this._conquestLabel = scene.add.text(this.x, this.y + 155, 'Gildeninsel — Nicht beansprucht', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffd36a', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(26);
    }

    attackTower(index, damage, attackerGuild) {
        if (!this.towers[index] || !this.towers[index].active) return;
        const tower = this.towers[index];
        tower.hp = Math.max(0, tower.hp - damage);
        this._refreshTowerHP(index);
        if (tower.hp <= 0) {
            tower.active = false;
            this._towerImgs[index].setTint(0x444444).setAlpha(0.5);
        }
        this._checkCapture(attackerGuild);
    }

    _refreshTowerHP(i) {
        const tower  = this.towers[i];
        const bar    = this._towerHpBars[i];
        const pct    = tower.hp / tower.maxHp;
        const color  = pct > 0.6 ? 0x22cc55 : pct > 0.3 ? 0xffaa22 : 0xff3333;
        bar.fill.setFillStyle(color).setDisplaySize(Math.max(0, 44 * pct), 4);
        bar.text.setText(`${tower.hp}/${tower.maxHp}`);
    }

    _checkCapture(attackerGuild) {
        const allDestroyed = this.towers.every(t => !t.active);
        if (!allDestroyed) return;
        this.capturedBy   = attackerGuild ?? 'Spieler';
        this.captureColor = 0xd4aa40;
        this._flagBanner.setFillStyle(this.captureColor);
        this._flagText.setText(attackerGuild?.substring(0, 3) ?? '★');
        this._conquestLabel.setText(`⚑ ${this.capturedBy} besitzt diese Insel`);
        if (this.scene) {
            this.scene.showStatusMsg?.(`⚑ Gildeninsel eingenommen von ${this.capturedBy}!`, 0xd4aa40);
            this.scene.events.emit('guild-island-captured', { island: this, guild: attackerGuild });
            try { localStorage.setItem('ahc_guild_island', JSON.stringify({ guild: attackerGuild, time: Date.now() })); } catch {}
        }
        this._startGoldBonus();
    }

    _startGoldBonus() {
        if (!this.scene) return;
        this._goldBonusTimer = this.scene.time.addEvent({
            delay: 30000,
            callback: () => {
                if (!this.capturedBy || !this.scene?.player) return;
                this.scene.player.gold += 120;
                this.scene.showStatusMsg?.('⚑ Gildeninsel: +120 Gold', 0xd4aa40);
            },
            loop: true
        });
    }

    resetTowers() {
        this.towers.forEach((t, i) => {
            t.hp = t.maxHp; t.active = true;
            this._towerImgs[i].clearTint().setAlpha(1);
            this._refreshTowerHP(i);
        });
        this.capturedBy = null;
        this._flagBanner.setFillStyle(0xdddddd);
        this._flagText.setText('?');
        this._conquestLabel.setText('Gildeninsel — Nicht beansprucht');
        this._goldBonusTimer?.remove();
    }

    destroy() {
        this._goldBonusTimer?.remove();
        this._towerImgs.forEach(t => t?.destroy());
        this._towerHpBars.forEach(b => { b.bg?.destroy(); b.fill?.destroy(); b.text?.destroy(); });
        this._flagPole?.destroy(); this._flagBanner?.destroy(); this._flagText?.destroy();
        this._conquestBar?.destroy(); this._conquestLabel?.destroy();
        super.destroy();
    }
}
