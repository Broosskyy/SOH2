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
    constructor(scene, x, y) {
        const smallShips  = ['ship-small-1','ship-small-2','ship-small-3','ship-small-4','ship-small-5'];
        const mediumShips = ['ship-medium-1','ship-medium-2','ship-medium-3'];
        const largeShips  = ['ship-large-1','ship-large-2'];

        const rand = Math.random();
        let type, scale, maxHP, speed, xpValue, colliderRadius, tier, factionPool, healthBarW, healthBarOffY;

        if (rand < 0.6) {
            type = Phaser.Utils.Array.GetRandom(smallShips);
            scale = 0.07; maxHP = 260; speed = 7; xpValue = 55; colliderRadius = 18;
            tier = 1; factionPool = FACTIONS.small; healthBarW = 50; healthBarOffY = -55;
        } else if (rand < 0.9) {
            type = Phaser.Utils.Array.GetRandom(mediumShips);
            scale = 0.085; maxHP = 560; speed = 5; xpValue = 150; colliderRadius = 22;
            tier = 2; factionPool = FACTIONS.medium; healthBarW = 62; healthBarOffY = -68;
        } else {
            type = Phaser.Utils.Array.GetRandom(largeShips);
            scale = 0.10; maxHP = 1040; speed = 4; xpValue = 320; colliderRadius = 26;
            tier = 3; factionPool = FACTIONS.large; healthBarW = 74; healthBarOffY = -80;
        }

        super(scene, x, y, type);

        this.npcTier    = tier;
        this.npcFaction = Phaser.Utils.Array.GetRandom(factionPool);
        this.npcName    = `${this.npcFaction.tag} ${Phaser.Utils.Array.GetRandom(this.npcFaction.captains)}`;

        this.maxHP = maxHP;
        this.speed = speed;
        this.xpValue = xpValue;
        this.sprite.setScale(scale);
        this.shipType = type;
        this.hp = this.maxHP;
        this.healthBarWidth  = healthBarW;
        this.healthBarHeight = 5;
        this.healthBarOffsetY = healthBarOffY;
        this.updateHealthBar();

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
        const tables = {
            1: [
                { type: 'gold-bag',    weight: 60, gold: [20, 60],   mats: [0, 2],   xp: [10, 30] },
                { type: 'gift-chest',  weight: 30, gold: [10, 30],   mats: [1, 4],   xp: [20, 50] },
                { type: 'xp-orb',      weight: 10, gold: [0, 0],     mats: [0, 0],   xp: [40, 80] }
            ],
            2: [
                { type: 'gold-bag',    weight: 40, gold: [80, 200],  mats: [2, 6],   xp: [30, 80] },
                { type: 'gift-chest',  weight: 40, gold: [40, 100],  mats: [4, 10],  xp: [50, 120] },
                { type: 'xp-orb',      weight: 20, gold: [0, 10],    mats: [0, 2],   xp: [100, 200] }
            ],
            3: [
                { type: 'gold-bag',    weight: 30, gold: [200, 500], mats: [5, 15],  xp: [80, 200] },
                { type: 'gift-chest',  weight: 50, gold: [100, 300], mats: [10, 25], xp: [150, 350] },
                { type: 'xp-orb',      weight: 20, gold: [0, 50],    mats: [2, 8],   xp: [250, 500] }
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
