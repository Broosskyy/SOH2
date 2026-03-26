import Phaser from 'phaser';

const TOWER_MAX_HP = 1200;

export default class IslandTower extends Phaser.GameObjects.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'guild-tower');
        scene.add.existing(this);
        this.setScale(0.11).setDepth(22);
        this.setInteractive({ useHandCursor: true });

        this.isIslandTower   = true;
        this.isDead          = false;
        this.selectionRadius = 46;
        this.maxHp = TOWER_MAX_HP;
        this.hp    = TOWER_MAX_HP;
        this.parentIsland    = null;

        this._buildHpBar(scene);
    }

    _buildHpBar(scene) {
        this._hpBg   = scene.add.rectangle(this.x, this.y - 26, 40, 6, 0x111111, 0.9).setDepth(23);
        this._hpFill = scene.add.rectangle(this.x - 19, this.y - 26, 36, 4, 0x22cc55, 1)
            .setDepth(24).setOrigin(0, 0.5);
        this._hpTxt  = scene.add.text(this.x, this.y - 34,
            `${TOWER_MAX_HP}`, { fontSize: '8px', fontFamily: 'Arial', fill: '#fff', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(25);
        this._label  = scene.add.text(this.x, this.y + 20, '🏰',
            { fontSize: '10px', fontFamily: 'Arial' }
        ).setOrigin(0.5).setDepth(25);
    }

    takeDamage(dmg) {
        if (this.isDead) return false;
        this.hp = Math.max(0, this.hp - dmg);
        const pct   = this.hp / this.maxHp;
        const color = pct > 0.6 ? 0x22cc55 : pct > 0.3 ? 0xffaa22 : 0xff3333;
        if (this._hpFill) {
            this._hpFill.setFillStyle(color).setDisplaySize(Math.max(0, 36 * pct), 4);
        }
        if (this._hpTxt) this._hpTxt.setText(`${this.hp}`);

        if (this.hp <= 0) {
            this.isDead = true;
            this.setActive(false);
            this.setTint(0x333333).setAlpha(0.4);
            if (this._hpFill) this._hpFill.setAlpha(0.3);
            if (this._label)  this._label.setText('💥');
        }
        return this.isDead;
    }

    destroy(fromScene) {
        try { this._hpBg?.destroy();   } catch {}
        try { this._hpFill?.destroy(); } catch {}
        try { this._hpTxt?.destroy();  } catch {}
        try { this._label?.destroy();  } catch {}
        this._hpBg = this._hpFill = this._hpTxt = this._label = null;
        super.destroy(fromScene);
    }
}
