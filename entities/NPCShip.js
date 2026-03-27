import Ship from './Ship.js';
import Phaser from 'phaser';

const FACTIONS = {
    small: [
        { name: 'Piraten', tag: '[PIR]', color: 0xff6060, captains: ['Roter Sam','Einauge Pete','Der Schlange','Blutiger Karl','Kraken-Tom'] },
        { name: 'Schmuggler', tag: '[SMG]', color: 0xffaa40, captains: ['Stiller Wolf','Nebelschatten','Grauer Mond','Silberzahn','Flinker Hein'] }
    ],
    medium: [
        { name: 'Korsaren', tag: '[KOR]', color: 0xdd88ff, captains: ['Don Espada','La Furia','El Diablo','Capitán Rojo','La Tormenta'] },
        { name: 'Flibustier', tag: '[FLI]', color: 0xff9966, captains: ['Schwarze Rose','Sturm-Erik','Goldener Ritter','Der Admiral','Meereswolf'] }
    ],
    large: [
        { name: 'Kriegsmarine', tag: '[KRM]', color: 0x4488ff, captains: ['Admiral Krueger','Kapitän Sturm','Commodore Rex','Flottenadmiral von der See','Vice Admiral Braun'] },
        { name: 'Teufelsgilde', tag: '[TGL]', color: 0xaa44ff, captains: ['Teufelsfürst','Der Verdammte','Schwarzes Herz','Abyssal King','Meister des Chaos'] }
    ]
};

export default class NPCShip extends Ship {
    /* chartLevel: 1 = easy (Karte 1), up to 10 = brutal (Karte 10) */
    constructor(scene, x, y, chartLevel = 1) {
        const smallShips  = ['ship-small-1','ship-small-2','ship-small-3','ship-small-4','ship-small-5'];
        const mediumShips = ['ship-medium-1','ship-medium-2','ship-medium-3'];
        const largeShips  = ['ship-large-1','ship-large-2'];

        const rand = Math.random();
        let type, scale, maxHP, speed, xpValue, colliderRadius, tier, factionPool, healthBarW, healthBarOffY;

        /* Higher charts shift the tier distribution toward harder ships */
        const tierShift = Math.min(chartLevel - 1, 6) * 0.03; /* max +0.18 shift */
        const smallThreshold  = Math.max(0.20, 0.60 - tierShift * 2.5);
        const mediumThreshold = Math.min(0.94, 0.90 + tierShift * 0.5);

        if (rand < smallThreshold) {
            type = Phaser.Utils.Array.GetRandom(smallShips);
            scale = 0.095; maxHP = 260; speed = 7; xpValue = 55; colliderRadius = 22;
            tier = 1; factionPool = FACTIONS.small; healthBarW = 56; healthBarOffY = -62;
        } else if (rand < mediumThreshold) {
            type = Phaser.Utils.Array.GetRandom(mediumShips);
            scale = 0.115; maxHP = 560; speed = 5; xpValue = 150; colliderRadius = 28;
            tier = 2; factionPool = FACTIONS.medium; healthBarW = 68; healthBarOffY = -76;
        } else {
            type = Phaser.Utils.Array.GetRandom(largeShips);
            scale = 0.14; maxHP = 1040; speed = 4; xpValue = 320; colliderRadius = 34;
            tier = 3; factionPool = FACTIONS.large; healthBarW = 80; healthBarOffY = -90;
        }

        super(scene, x, y, type);

        /* ── Chart difficulty scaling ─────────────────────── */
        /* HP & XP: +35% per chart level; speed: +6% per chart, capped at 1.8× */
        const diffMult  = Math.pow(1.35, chartLevel - 1);
        const spdMult   = Math.min(Math.pow(1.06, chartLevel - 1), 1.80);

        this.chartLevel    = chartLevel;
        this.lootGoldMult  = diffMult;        /* used by spawnLootFromDefeat */
        this.npcTier       = tier;
        this.npcFaction    = Phaser.Utils.Array.GetRandom(factionPool);
        const captain      = Phaser.Utils.Array.GetRandom(this.npcFaction.captains);
        this.npcName       = `Lvl${chartLevel} ${this.npcFaction.tag} ${captain}`;

        this.maxHP   = Math.round(maxHP  * diffMult);
        this.speed   = Math.round(speed  * spdMult * 10) / 10;
        this.xpValue = Math.round(xpValue * diffMult);

        this.sprite.setScale(scale);
        this.shipType = type;
        this.hp = this.maxHP;
        this.healthBarWidth   = healthBarW;
        this.healthBarHeight  = 5;
        this.healthBarOffsetY = healthBarOffY;
        this.updateHealthBar();

        /* Tint higher-chart NPCs progressively redder */
        if (chartLevel >= 8)       this.sprite?.setTint(0xff5555);
        else if (chartLevel >= 5)  this.sprite?.setTint(0xffa07a);

        this._buildNameLabel();

        this.setSize(180, 180);
        this.setInteractive(new Phaser.Geom.Rectangle(-90, -90, 180, 180), Phaser.Geom.Rectangle.Contains);
        this.selectionRadius = 76;

        this.on('pointerdown', () => { this.scene.events.emit('npc-selected', this); });

        this.homeX = x;
        this.homeY = y;
        this.wanderRadius = 320;
        this.moveTarget = null;
        this.nextWanderTime = 0;
        this.isUnderAttack = false;
        this.lastHitTime = 0;
        this.arrivalThreshold = 20;
        this.steeringLerp = 0.01;
        this.idleDrag = 0.05;

        this.body.setCollideWorldBounds(true);
        this.body.setCircle(colliderRadius);
        this.body.setOffset(-colliderRadius, -colliderRadius);
    }

    _buildNameLabel() {
        if (!this.scene?.add) return;
        const nameOffY = this.healthBarOffsetY - 14;
        this.nameLabel = this.scene.add.text(0, nameOffY, this.npcName, {
            fontSize: '10px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#' + (this.npcFaction.color >>> 0).toString(16).padStart(6, '0'),
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5, 1).setDepth(25);
        this.add(this.nameLabel);
    }

    getLootTable() {
        const t = this.npcTier;
        const m = this.lootGoldMult ?? 1; /* chart difficulty gold multiplier */
        const g = (lo, hi) => [Math.round(lo * m), Math.round(hi * m)];
        const tables = {
            1: [
                { type: 'gold-bag',    weight: 60, gold: g(20, 60),    mats: [0, 2],   xp: [10, 30] },
                { type: 'gift-chest',  weight: 30, gold: g(10, 30),    mats: [1, 4],   xp: [20, 50] },
                { type: 'xp-orb',      weight: 10, gold: [0, 0],       mats: [0, 0],   xp: [40, 80] }
            ],
            2: [
                { type: 'gold-bag',    weight: 40, gold: g(80, 200),   mats: [2, 6],   xp: [30, 80] },
                { type: 'gift-chest',  weight: 40, gold: g(40, 100),   mats: [4, 10],  xp: [50, 120] },
                { type: 'xp-orb',      weight: 20, gold: [0, 10],      mats: [0, 2],   xp: [100, 200] }
            ],
            3: [
                { type: 'gold-bag',    weight: 30, gold: g(200, 500),  mats: [5, 15],  xp: [80, 200] },
                { type: 'gift-chest',  weight: 50, gold: g(100, 300),  mats: [10, 25], xp: [150, 350] },
                { type: 'xp-orb',      weight: 20, gold: g(0, 50),     mats: [2, 8],   xp: [250, 500] }
            ]
        };
        return tables[t] ?? tables[1];
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        if (!this.scene || !this.scene.time) return;
        this.isUnderAttack = true;
        this.lastHitTime = this.scene.time.now;
        this.moveTarget = null;
        if (this.body) this.body.setVelocity(0, 0);
        this.setWakeVisible(false);
    }

    chooseWanderTarget() {
        if (this.isUnderAttack || !this.scene) return;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(140, this.wanderRadius);
        const padding = 180;
        const targetX = Phaser.Math.Clamp(this.homeX + Math.cos(angle) * distance, padding, this.scene.mapWidth - padding);
        const targetY = Phaser.Math.Clamp(this.homeY + Math.sin(angle) * distance, padding, this.scene.mapHeight - padding);
        this.moveTarget = new Phaser.Math.Vector2(targetX, targetY);
        this.targetAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        this.nextWanderTime = this.scene.time.now + Phaser.Math.Between(7000, 12000);
    }

    stopCompletely() {
        this.moveTarget = null;
        this.body.setVelocity(0, 0);
        this.setWakeVisible(false);
    }

    onDeath() {
        this.isUnderAttack = false;
        this.scene.events.emit('npc-died', this);
        this.destroy();
    }

    update() {
        super.update();
        if (!this.scene || !this.scene.time || !this.body) return;

        const now = this.scene.time.now;
        const vx = this.body.velocity.x;
        const vy = this.body.velocity.y;

        if (this.isUnderAttack && now > this.lastHitTime + 5000) {
            this.isUnderAttack = false;
            this.nextWanderTime = now + Phaser.Math.Between(1000, 2500);
        }

        if (this.isUnderAttack) { this.stopCompletely(); return; }

        const tetherDistance = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY);
        if (tetherDistance > this.wanderRadius + 120) {
            this.moveTarget = new Phaser.Math.Vector2(this.homeX, this.homeY);
        } else if (!this.moveTarget && now >= this.nextWanderTime) {
            this.chooseWanderTarget();
        }

        if (this.moveTarget) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, this.moveTarget.x, this.moveTarget.y);
            if (distance <= this.arrivalThreshold) {
                this.moveTarget = null;
                this.body.setVelocityX(Phaser.Math.Linear(vx, 0, 0.08));
                this.body.setVelocityY(Phaser.Math.Linear(vy, 0, 0.08));
                this.setWakeVisible(this.body.velocity.length() > 4);
                if (this.body.velocity.length() < 2) { this.body.setVelocity(0, 0); this.setWakeVisible(false); }
            } else {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.moveTarget.x, this.moveTarget.y);
                this.body.setVelocityX(Phaser.Math.Linear(vx, Math.cos(angle) * this.speed, this.steeringLerp));
                this.body.setVelocityY(Phaser.Math.Linear(vy, Math.sin(angle) * this.speed, this.steeringLerp));
                this.targetAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
                this.setWakeVisible(this.body.velocity.length() > 6);
            }
        } else {
            this.body.setVelocityX(Phaser.Math.Linear(vx, 0, this.idleDrag));
            this.body.setVelocityY(Phaser.Math.Linear(vy, 0, this.idleDrag));
            if (this.body.velocity.length() < 2) { this.body.setVelocity(0, 0); this.setWakeVisible(false); }
        }

        if (this.body.velocity.length() > 3) {
            this.targetAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
        }
    }
}
