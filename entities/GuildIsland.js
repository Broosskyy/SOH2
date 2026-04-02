import Phaser from 'phaser';

const TOWER_COUNT   = 6;
const TOWER_MAX_HP  = 3000;
const TOWER_RADIUS  = 148;
const GATE_ANGLE    = Math.PI / 2; // south (bottom) — harbor entrance

/* 6 towers evenly placed, with the gate gap at the south (π/2) */
const TOWER_ANGLES = [
    -Math.PI / 3,      // 1-2 o'clock (NE)
     0,                // 3 o'clock (E)
     Math.PI / 3,      // 4-5 o'clock (SE — left of gate)
     2 * Math.PI / 3,  // 7-8 o'clock (SW — right of gate)
     Math.PI,          // 9 o'clock (W)
    -2 * Math.PI / 3   // 10-11 o'clock (NW)
];

export default class GuildIsland extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        scene.add.existing(this);

        this.capturedBy = null;
        this.captureColor = 0xdddddd;

        /* New fortress graphic — bigger, with harbor entrance */
        this._islandImg = scene.add.image(0, 0, 'island-guild-fortress')
            .setScale(0.45).setDepth(10)
            .setInteractive({ useHandCursor: true,
                hitArea: new Phaser.Geom.Circle(0, 0, 90),
                hitAreaCallback: Phaser.Geom.Circle.Contains });
        this._islandImg.on('pointerdown', () => {
            scene.events.emit('guild-island-attack-tap', { island: this });
        });
        this.add(this._islandImg);

        this.towers = [];
        this._towerImgs   = [];
        this._towerHpBars = [];
        this._buildTowers(scene);

        this._buildCaptureFlag(scene);
        this._buildConquestUI(scene);
        this.setDepth(11);

        /* Physics body — circular, radius = wall ring edge */
        scene.physics.add.existing(this, true);
        const body = this.body;
        if (body) {
            const r = 168;
            body.isCircle  = true; body.radius = r;
            body.width     = r * 2; body.height = r * 2;
            body.halfWidth = r; body.halfHeight = r;
            body.offset.set(0, 0);
            body.position.set(x - r, y - r);
            body.center.set(x, y);
            body.moves = false; body.immovable = true;
            if (body.world) {
                body.world.staticTree.remove(body);
                body.world.staticTree.insert(body);
            }
        }
    }

    _buildTowers(scene) {
        for (let i = 0; i < TOWER_COUNT; i++) {
            const angle = TOWER_ANGLES[i];
            const tx = Math.cos(angle) * TOWER_RADIUS;
            const ty = Math.sin(angle) * TOWER_RADIUS;
            const wx = this.x + tx;
            const wy = this.y + ty;

            const towerImg = scene.add.image(wx, wy, 'guild-tower')
                .setScale(0.13).setDepth(22)
                .setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Circle(0, 0, 72), hitAreaCallback: Phaser.Geom.Circle.Contains });

            this._towerImgs.push(towerImg);

            const hpBg   = scene.add.rectangle(wx, wy - 24, 40, 6, 0x111111, 0.9).setDepth(23);
            const hpFill = scene.add.rectangle(wx - 19, wy - 24, 36, 4, 0x22cc55, 1).setDepth(24).setOrigin(0, 0.5);
            const hpText = scene.add.text(wx, wy - 33, `${TOWER_MAX_HP}/${TOWER_MAX_HP}`, {
                fontSize: '8px', fontFamily: 'Arial', fill: '#fff', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setDepth(25);

            this._towerHpBars.push({ bg: hpBg, fill: hpFill, text: hpText });
            this.towers.push({
                hp: TOWER_MAX_HP, maxHp: TOWER_MAX_HP,
                active: true, angle, tx, ty, wx, wy
            });

            const _island = this;
            const _i = i;
            towerImg.on('pointerdown', () => {
                scene.events.emit('guild-tower-clicked', { island: _island, index: _i });
            });
        }
    }

    _buildCaptureFlag(scene) {
        this._flagPole   = scene.add.rectangle(this.x, this.y - 14, 2, 30, 0x888888, 1).setDepth(26);
        this._flagBanner = scene.add.rectangle(this.x + 10, this.y - 26, 20, 12, 0xdddddd, 1).setDepth(26);
        this._flagText   = scene.add.text(this.x + 10, this.y - 26, '?', {
            fontSize: '7px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(27);
    }

    _buildConquestUI(scene) {
        this._conquestBar   = scene.add.graphics().setDepth(28);
        this._conquestLabel = scene.add.text(this.x, this.y + 185, 'Gildeninsel — Nicht beansprucht', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffd36a', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(28);
    }

    attackTower(index, damage, attackerGuild) {
        const tower = this.towers[index];
        if (!tower || !tower.active) return;
        tower.hp = Math.max(0, tower.hp - damage);
        this._refreshTowerHP(index);
        if (tower.hp <= 0) {
            tower.active = false;
            this._towerImgs[index].setTint(0x333333).setAlpha(0.45);
            this._towerHpBars[index].fill.setFillStyle(0xff2222);
        }
        this._checkCapture(attackerGuild);
    }

    _refreshTowerHP(i) {
        const tower = this.towers[i];
        const bar   = this._towerHpBars[i];
        if (!bar) return;
        const pct   = tower.hp / tower.maxHp;
        const color = pct > 0.6 ? 0x22cc55 : pct > 0.3 ? 0xffaa22 : 0xff3333;
        bar.fill.setFillStyle(color).setDisplaySize(Math.max(0, 36 * pct), 4);
        bar.text.setText(`${tower.hp}/${tower.maxHp}`);
    }

    _checkCapture(attackerGuild) {
        const allDestroyed = this.towers.every(t => !t.active);
        if (!allDestroyed) return;
        this.capturedBy   = attackerGuild ?? 'Spieler';
        this.captureColor = 0xd4aa40;
        this._flagBanner.setFillStyle(this.captureColor);
        this._flagText.setText((attackerGuild ?? '★').substring(0, 3).toUpperCase());
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

    /* Return nearest active tower (world coords) */
    getNearestActiveTower(fromX, fromY) {
        let nearest = null, nearestDist = Infinity, nearestIdx = -1;
        this.towers.forEach((t, i) => {
            if (!t.active) return;
            const d = Phaser.Math.Distance.Between(fromX, fromY, this.x + t.tx, this.y + t.ty);
            if (d < nearestDist) { nearestDist = d; nearest = t; nearestIdx = i; }
        });
        return { tower: nearest, index: nearestIdx, dist: nearestDist };
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
