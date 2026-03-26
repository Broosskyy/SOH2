import Phaser from 'phaser';

const TOWER_MAX_HP = 1200;
const TOWER_SCALE  = 0.10;

export default class IslandTower extends Phaser.GameObjects.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'guild-tower');
        scene.add.existing(this);
        this.setScale(TOWER_SCALE).setDepth(20);
        this.setInteractive({ useHandCursor: true });

        this.isIslandTower  = true;
        this.selectionRadius = 44;
        this.maxHp = TOWER_MAX_HP;
        this.hp    = TOWER_MAX_HP;
        this.parentIsland = null;
        this._nextFireAt  = 0;
        this._buildHpBar(scene);
    }

    _buildHpBar(scene) {
        this._hpBg   = scene.add.rectangle(this.x, this.y - 24, 38, 5, 0x111111, 0.88).setDepth(21);
        this._hpFill = scene.add.rectangle(this.x - 18, this.y - 24, 34, 3, 0x22cc55, 1)
            .setDepth(22).setOrigin(0, 0.5);
        this._hpTxt  = scene.add.text(this.x, this.y - 32,
            `${TOWER_MAX_HP}/${TOWER_MAX_HP}`,
            { fontSize: '7px', fontFamily: 'Arial', fill: '#fff', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(23);
        this._label = scene.add.text(this.x, this.y + 18, '🏰 Turm',
            { fontSize: '8px', fontFamily: 'Arial', fill: '#ffcc66', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(23);
    }

    takeDamage(dmg) {
        if (!this.active) return false;
        this.hp = Math.max(0, this.hp - dmg);
        const pct   = this.hp / this.maxHp;
        const color = pct > 0.6 ? 0x22cc55 : pct > 0.3 ? 0xffaa22 : 0xff3333;
        this._hpFill.setFillStyle(color).setDisplaySize(Math.max(0, 34 * pct), 3);
        this._hpTxt.setText(`${this.hp}/${this.maxHp}`);
        if (this.hp <= 0) {
            this.active = false;
            this.setTint(0x333333).setAlpha(0.45);
            this._hpFill.setAlpha(0.3);
            this._label.setText('💥 Zerstört');
        }
        return this.hp <= 0;
    }

    destroy() {
        this._hpBg?.destroy();
        this._hpFill?.destroy();
        this._hpTxt?.destroy();
        this._label?.destroy();
        super.destroy();
    }
}
