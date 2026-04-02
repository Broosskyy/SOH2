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
        const smallShips  = ['ship-small-1','ship-small-2','ship-small-3','ship-small-4','ship-small-5','npc-ship-tier1'];
        const mediumShips = ['ship-medium-1','ship-medium-2','ship-medium-3','npc-ship-tier2'];
        const largeShips  = ['ship-large-1','ship-large-2','npc-ship-tier3'];
        /* AI-generated sprites have natural color — no tint applied */
        const AI_SPRITES  = new Set(['npc-ship-tier1','npc-ship-tier2','npc-ship-tier3']);

        const rand = Math.random();
        let type, scale, maxHP, speed, xpValue, colliderRadius, tier, factionPool, healthBarW, healthBarOffY;

        /* Higher charts shift the tier distribution toward harder ships */
        const tierShift = Math.min(chartLevel - 1, 6) * 0.03; /* max +0.18 shift */
        const smallThreshold  = Math.max(0.20, 0.60 - tierShift * 2.5);
        const mediumThreshold = Math.min(0.94, 0.90 + tierShift * 0.5);

        if (rand < smallThreshold) {
            type = Phaser.Utils.Array.GetRandom(smallShips);
            scale = 0.075; maxHP = 260; speed = 7; xpValue = 55; colliderRadius = 18;
            tier = 1; factionPool = FACTIONS.small; healthBarW = 50; healthBarOffY = -52;
        } else if (rand < mediumThreshold) {
            type = Phaser.Utils.Array.GetRandom(mediumShips);
            scale = 0.112; maxHP = 560; speed = 5; xpValue = 150; colliderRadius = 28;
            tier = 2; factionPool = FACTIONS.medium; healthBarW = 68; healthBarOffY = -76;
        } else {
            type = Phaser.Utils.Array.GetRandom(largeShips);
            scale = 0.160; maxHP = 1040; speed = 4; xpValue = 320; colliderRadius = 40;
            tier = 3; factionPool = FACTIONS.large; healthBarW = 86; healthBarOffY = -100;
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

        /* ── Rotations-Modus ──────────────────────────────────────
           AI-Sprites (npc-ship-tier*) sind Overhead-Ansicht → rotieren mit dem Kurs.
           Alle anderen Sprites sind Seitenansicht → nur links/rechts spiegeln (Seafight-Stil). */
        this.useSpriteRotation = AI_SPRITES.has(type);

        /* Tier-Farben: klare visuelle Abgrenzung zwischen Kleinen, Mittleren und Großen.
           AI-Sprites (npc-ship-tier*) behalten ihre natürlichen Farben — kein Tint.
           Chart-Level überlagert die Tier-Farbe mit einem rötlichen Ton bei Chart ≥ 5/8. */
        if (!AI_SPRITES.has(type)) {
            const tierTints = { 1: 0xffdd88, 2: 0x88ccff, 3: 0xff4444 };
            this.sprite?.setTint(tierTints[tier] ?? 0xffffff);
            if      (chartLevel >= 8) this.sprite?.setTint(Phaser.Display.Color.IntegerToColor(tierTints[tier] ?? 0xffffff).darken(30).color);
            else if (chartLevel >= 5) this.sprite?.setTint(Phaser.Display.Color.IntegerToColor(tierTints[tier] ?? 0xffffff).darken(12).color);
        }

        this._buildNameLabel();

        /* Trefferzone = Kreis direkt um das sichtbare Sprite.
           colliderRadius passt bereits zur Sprite-Größe; +10px Extra für Mobile-Touch. */
        const hitR = colliderRadius + 10;
        this.setSize(hitR * 2, hitR * 2);
        this.setInteractive(
            new Phaser.Geom.Circle(0, 0, hitR),
            Phaser.Geom.Circle.Contains
        );
        this.selectionRadius = hitR;

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
                { type: 'gold-bag',      weight: 38, gold: g(80, 200),   mats: [2, 6],   xp: [30, 80] },
                { type: 'gift-chest',    weight: 38, gold: g(40, 100),   mats: [4, 10],  xp: [50, 120] },
                { type: 'xp-orb',        weight: 18, gold: [0, 10],      mats: [0, 2],   xp: [100, 200] },
                { type: 'treasure-map',  weight: 6,  gold: [0, 0],       mats: [0, 0],   xp: [0, 0] }
            ],
            3: [
                { type: 'gold-bag',      weight: 27, gold: g(200, 500),  mats: [5, 15],  xp: [80, 200] },
                { type: 'gift-chest',    weight: 45, gold: g(100, 300),  mats: [10, 25], xp: [150, 350] },
                { type: 'xp-orb',        weight: 18, gold: g(0, 50),     mats: [2, 8],   xp: [250, 500] },
                { type: 'treasure-map',  weight: 10, gold: [0, 0],       mats: [0, 0],   xp: [0, 0] }
            ]
        };
        return tables[t] ?? tables[1];
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        if (!this.scene || !this.scene.time) return;
        this.isUnderAttack = true;
        this.lastHitTime   = this.scene.time.now;
        /* ── Patrol improvement: don't freeze — pick an evasive wander point ── */
        this._chooseEvasiveTarget();
    }

    _chooseEvasiveTarget() {
        if (!this.scene) return;
        /* Pick a point away from the player if possible, otherwise random */
        const player = this.scene.player;
        let awayAngle;
        if (player?.active) {
            awayAngle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y)
                        + Phaser.Math.FloatBetween(-0.6, 0.6);
        } else {
            awayAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        }
        const dist    = Phaser.Math.Between(120, 260);
        const padding = 180;
        const tx = Phaser.Math.Clamp(this.x + Math.cos(awayAngle) * dist, padding, (this.scene.mapWidth  ?? 4000) - padding);
        const ty = Phaser.Math.Clamp(this.y + Math.sin(awayAngle) * dist, padding, (this.scene.mapHeight ?? 4000) - padding);
        this.moveTarget     = new Phaser.Math.Vector2(tx, ty);
        this.nextWanderTime = (this.scene.time?.now ?? 0) + Phaser.Math.Between(2500, 5000);
    }

    chooseWanderTarget() {
        if (!this.scene) return;
        const angle    = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(120, this.wanderRadius);
        const padding  = 180;
        const targetX  = Phaser.Math.Clamp(this.homeX + Math.cos(angle) * distance, padding, (this.scene.mapWidth  ?? 4000) - padding);
        const targetY  = Phaser.Math.Clamp(this.homeY + Math.sin(angle) * distance, padding, (this.scene.mapHeight ?? 4000) - padding);
        this.moveTarget     = new Phaser.Math.Vector2(targetX, targetY);
        this.targetAngle    = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        this.nextWanderTime = (this.scene.time?.now ?? 0) + Phaser.Math.Between(3500, 7000);
    }

    stopCompletely() {
        this.moveTarget = null;
        if (this.body) this.body.setVelocity(0, 0);
        this.setWakeVisible(false);
    }

    onDeath() {
        if (this._sinking) return;
        this._sinking = true;
        this.isUnderAttack = false;

        /* XP + Loot sofort vergeben (Seafight-Stil: Belohnung bei Zerstörung) */
        this.scene.events.emit('npc-died', this);

        /* Physik und Interaktion deaktivieren */
        if (this.body) { this.body.setVelocity(0, 0); this.body.setEnable(false); }
        this.sprite?.disableInteractive?.();
        if (this.healthBar) { this.healthBar.destroy(); this.healthBar = null; }
        if (this.barFill)   { this.barFill.destroy();   this.barFill   = null; }
        if (this.nameText)  { this.nameText.destroy();  this.nameText  = null; }

        const sc  = this.scene;
        const sx  = this.x, sy = this.y;
        const rot = this.sprite?.rotation ?? 0;
        const dir = Math.random() > 0.5 ? 1 : -1;

        /* Ölpfütze / Wracküberreste erscheinen sofort */
        const slick = sc.add.circle(sx, sy, 38, 0x1a1a2e, 0.55).setDepth(700);
        sc.tweens.add({ targets: slick, scaleX: 2.2, scaleY: 0.35, alpha: 0, duration: 5000,
            onComplete: () => slick.destroy() });

        /* Schiff kippt und sinkt */
        if (this.sprite) {
            sc.tweens.add({
                targets : this.sprite,
                rotation: rot + dir * (Math.PI / 2.4),
                scaleX  : 0,
                scaleY  : 0,
                alpha   : 0,
                duration: 1700,
                ease    : 'Quad.In',
                onComplete: () => { if (this.scene) this.destroy(); }
            });
        } else {
            sc.time.delayedCall(1700, () => this.destroy());
        }

        /* Rauchsalven während des Sinkens */
        for (let i = 0; i < 6; i++) {
            sc.time.delayedCall(i * 230, () => {
                if (!sc?.sys?.isActive?.() && !sc?.add) return;
                const ox = sx + Phaser.Math.Between(-22, 22);
                const oy = sy + Phaser.Math.Between(-22, 22);
                const puff = sc.add.circle(ox, oy, Phaser.Math.Between(8, 18), 0x333333, 0.72)
                    .setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(1250);
                sc.tweens.add({ targets: puff, scaleX: 3, scaleY: 3, alpha: 0, y: oy - 40,
                    duration: 900, ease: 'Quad.Out', onComplete: () => puff.destroy() });
            });
        }

        /* Wasser-Fontäne zum Einschlag */
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const dist = Phaser.Math.Between(15, 45);
            const wx = sx + Math.cos(ang) * dist;
            const wy = sy + Math.sin(ang) * dist;
            const drop = sc.add.circle(wx, wy, Phaser.Math.Between(3, 7), 0x88ccff, 0.8)
                .setBlendMode(Phaser.BlendModes.ADD).setDepth(1200);
            sc.tweens.add({ targets: drop, x: wx + Math.cos(ang) * 25, y: wy - 28 + Math.sin(ang) * 12,
                alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 700 + i * 40,
                ease: 'Quad.Out', onComplete: () => drop.destroy() });
        }
    }

    update() {
        super.update();
        if (!this.scene || !this.scene.time || !this.body) return;

        const now = this.scene.time.now;
        const vx  = this.body.velocity.x;
        const vy  = this.body.velocity.y;

        /* Cool down from "under attack" state after 4 s of no hits */
        if (this.isUnderAttack && now > this.lastHitTime + 4000) {
            this.isUnderAttack  = false;
            this.nextWanderTime = now + Phaser.Math.Between(800, 2000);
        }

        /* ── Patrol logic: NPCs ALWAYS keep moving ── */
        const tether = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY);
        if (tether > this.wanderRadius + 120) {
            /* Too far from home — return */
            this.moveTarget = new Phaser.Math.Vector2(this.homeX, this.homeY);
        } else if (!this.moveTarget && now >= this.nextWanderTime) {
            this.chooseWanderTarget();
        }

        /* Use slightly higher speed when under attack (evasive) */
        const spd = this.isUnderAttack ? this.speed * 1.3 : this.speed;

        if (this.moveTarget) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.moveTarget.x, this.moveTarget.y);
            if (dist <= this.arrivalThreshold) {
                this.moveTarget = null;
                this.body.setVelocityX(Phaser.Math.Linear(vx, 0, 0.06));
                this.body.setVelocityY(Phaser.Math.Linear(vy, 0, 0.06));
                if (this.body.velocity.length() < 2) { this.body.setVelocity(0, 0); this.setWakeVisible(false); }
                else this.setWakeVisible(true);
            } else {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.moveTarget.x, this.moveTarget.y);
                this.body.setVelocityX(Phaser.Math.Linear(vx, Math.cos(angle) * spd, this.steeringLerp));
                this.body.setVelocityY(Phaser.Math.Linear(vy, Math.sin(angle) * spd, this.steeringLerp));
                this.setWakeVisible(this.body.velocity.length() > 6);
            }
        } else {
            /* Gentle coast-to-stop then wander timer fires */
            this.body.setVelocityX(Phaser.Math.Linear(vx, 0, this.idleDrag));
            this.body.setVelocityY(Phaser.Math.Linear(vy, 0, this.idleDrag));
            if (this.body.velocity.length() < 2) { this.body.setVelocity(0, 0); this.setWakeVisible(false); }
        }

        if (this.body.velocity.length() > 3) {
            this.targetAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
        }
    }
}
