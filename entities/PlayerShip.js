import Ship from './Ship.js';
import Phaser from 'phaser';
import PlayerStats from './PlayerStats.js';

export default class PlayerShip extends Ship {
    constructor(scene, x, y) {
        super(scene, x, y, 'player-ship');
        this.sprite.setScale(0.11);

        this.stats = new PlayerStats();
        this.syncStatsFromModel();
        this.ammoInventory = {
            cannonball: Number.POSITIVE_INFINITY,
            flare: 36,
            fire: 28,
            storm: 20,
            chainshot: 0,
            grapeshot: 0
        };
        this.specialAmmoUnlocks = {
            chainshot: false,
            grapeshot: false
        };
        this.healthBarWidth = 64;
        this.healthBarHeight = 5;
        this.healthBarOffsetY = -52;
        const savedGuild = (() => { try { return JSON.parse(localStorage.getItem('ahc_my_guild') || 'null'); } catch { return null; } })();
        this.captainName = window._loginUsername ?? 'Kapitän';
        this.captainTag  = savedGuild?.tag ? `[${savedGuild.tag}]` : '[SEA]';
        this.playerId    = '784211';
        this.shipInfoStateKey = '';

        this.voodooPoints = 140;
        this.voodooMax    = 200;
        this.goldDeckSlots  = 3;
        this.pearlDeckSlots = 3;
        this.mojoDeck       = false;
        this.pvpMode        = true;
        this.cannonSlotCount = 8;
        this.updateDerivedStats();
        this.updateHealthBar();
        this.createUnderShipInfoPanel();
        this.refreshShipInfoPanel(true);

        if (this.wake) {
            this.wake.setScale(0.055);
            this.wake.y = 15;
        }

        this.moveTarget = null;
        this.useSpriteRotation = true;
        this.navigationRotationSpeed = 0.05;
        this.combatRotationSpeed = 0.24;
        this.rotationSpeed = this.navigationRotationSpeed;
        this.combatFacingTarget = null;

        this.body.setCollideWorldBounds(true);
        this.body.setCircle(22);
        this.body.setOffset(-22, -22);
    }

    syncStatsFromModel() {
        const derived = this.stats.derived;

        this.baseMaxHP = this.stats.base.maxHP;
        this.baseSpeed = this.stats.base.speed;
        this.baseCannonCount = this.stats.base.cannonCount;
        this.baseDeckCount = this.stats.base.deckCount;
        this.baseDamagePerCannon = derived.baseDamagePerCannon;
        this.baseCannonDamage = this.baseCannonCount * this.baseDamagePerCannon;
        this.baseHarpoonDamage = this.stats.base.harpoonDamage;
        this.baseCannonRange = this.stats.base.cannonRange;
        this.baseHarpoonRange = this.stats.base.harpoonRange;
        this.baseReloadTime = this.stats.base.reloadTime;
        this.levelBonusHP = this.stats.bonuses.levelBonusHP;

        this.hullHpPerLevel = this.stats.tuning.hullHpPerLevel;
        this.deckHpPerLevel = this.stats.tuning.deckHpPerLevel;
        this.sailSpeedPerLevel = this.stats.tuning.sailSpeedPerLevel;
        this.cannonDamagePerLevel = this.stats.tuning.cannonDamagePerLevel;
        this.ammoDamagePerLevel = this.stats.tuning.ammoDamagePerLevel;
        this.cannonRangePerLevel = this.stats.tuning.cannonRangePerLevel;
        this.ammoRangePerLevel = this.stats.tuning.ammoRangePerLevel;
        this.cannonReloadReductionPerLevel = this.stats.tuning.cannonReloadReductionPerLevel;
        this.ammoReloadReductionPerLevel = this.stats.tuning.ammoReloadReductionPerLevel;
        this.deckDamageBonusPerLevel = this.stats.tuning.deckDamageBonusPerLevel;
        this.levelHpPerLevel = this.stats.tuning.levelHpPerLevel;

        this.gold = this.stats.resources.gold;
        this.gems = this.stats.resources.gems ?? 5;
        this.materials = this.stats.resources.materials;
        this.xp = this.stats.resources.xp;
        this.level = this.stats.resources.level;

        this.hullLevel = this.stats.upgrades.maxHPLevel;
        this.sailLevel = this.stats.upgrades.sailsLevel;
        this.cannonLevel = this.stats.upgrades.baseDamagePerCannonLevel;
        this.cannonSlotLevel = this.stats.upgrades.cannonsLevel;
        this.deckLevel = this.stats.upgrades.decksLevel;
        this.ammoTechLevel = this.stats.upgrades.ammoTechLevel;

        this.maxHP = derived.maxHP;
        this.hp = derived.currentHP;
        this.speed = derived.speed;
        this.deckCount = derived.deckCount;
        this.cannonCount = derived.cannonCount;
        this.baseDamagePerCannon = derived.baseDamagePerCannon;
        this.damagePerCannon = derived.baseDamagePerCannon;
        this.ammoMultiplier = derived.ammoMultiplier;
        this.deckDamageMultiplier = derived.deckDamageMultiplier;
        this.totalDamagePerShot = derived.totalDamagePerShot;
        this.cannonDamage = derived.cannonDamage;
        this.harpoonDamage = derived.harpoonDamage;
        this.cannonRange = derived.cannonRange;
        this.harpoonRange = derived.harpoonRange;
        this.reloadTime = derived.reloadTime;
        this.broadsidePower = derived.broadsidePower;
        this.shipRating = derived.shipRating;
    }

    syncRuntimeStateToModel() {
        this.stats.resources.gold = this.gold;
        this.stats.resources.materials = this.materials;
        this.stats.resources.xp = this.xp;
        this.stats.resources.level = this.level;
        this.stats.bonuses.levelBonusHP = this.levelBonusHP;
        this.stats.upgrades.maxHPLevel = this.hullLevel;
        this.stats.upgrades.sailsLevel = this.sailLevel;
        this.stats.upgrades.baseDamagePerCannonLevel = this.cannonLevel;
        this.stats.upgrades.cannonsLevel = this.cannonSlotLevel;
        this.stats.upgrades.decksLevel = this.deckLevel;
        this.stats.upgrades.ammoTechLevel = this.ammoTechLevel;
    }

    updateDerivedStats(ammoMultiplier = this.ammoMultiplier ?? this.stats.derived.ammoMultiplier ?? 1) {
        this.syncRuntimeStateToModel();
        this.stats.recalculate(this.hp, ammoMultiplier);
        this.syncStatsFromModel();
        this.refreshShipInfoPanel(true);
    }

    getUpgradeCost(type) {
        return this.stats.getUpgradeCost(type);
    }

    getUpgradeStatsSnapshot() {
        return {
            hp: this.hp,
            maxHP: this.maxHP,
            cannonCount: this.cannonCount,
            deckCount: this.deckCount,
            baseDamagePerCannon: this.baseDamagePerCannon,
            damagePerCannon: this.damagePerCannon,
            totalDamagePerShot: this.getTotalDamagePerShot(this.ammoMultiplier ?? 1)
        };
    }

    purchaseUpgrade(type) {
        if (type === 'ammo-unlock-chainshot') {
            return this.purchaseSpecialAmmoUnlock('chainshot');
        }
        if (type === 'ammo-unlock-grapeshot') {
            return this.purchaseSpecialAmmoUnlock('grapeshot');
        }

        const coreUpgradeTypes = ['hull', 'cannons', 'cannonSlots', 'decks'];
        if (coreUpgradeTypes.includes(type)) {
            return this.purchaseCoreStatUpgrade(type);
        }

        this.syncRuntimeStateToModel();
        const cost = this.getUpgradeCost(type);
        if (this.gold < cost.gold || this.materials < cost.materials) {
            return {
                success: false,
                cost,
                message: 'Not enough gold or materials'
            };
        }

        this.gold -= cost.gold;
        this.materials -= cost.materials;
        this.stats.resources.gold = this.gold;
        this.stats.resources.materials = this.materials;

        let message = `${type.toUpperCase()} upgraded`;

        if (type === 'sails') {
            this.sailLevel += 1;
            this.updateDerivedStats(this.ammoMultiplier ?? 1);
            message = `Sails upgraded • Speed now ${this.speed}`;
        } else if (type === 'ammo') {
            this.ammoTechLevel += 1;
            this.addAmmoCharges('flare', 18);
            this.addAmmoCharges('fire', 14);
            this.addAmmoCharges('storm', 12);
            if (this.isAmmoUnlocked('chainshot')) {
                this.addAmmoCharges('chainshot', 8 + (this.ammoTechLevel * 2));
            }
            if (this.isAmmoUnlocked('grapeshot')) {
                this.addAmmoCharges('grapeshot', 8 + (this.ammoTechLevel * 2));
            }
            this.updateDerivedStats(this.ammoMultiplier ?? 1);
            message = `Ammo tech upgraded • Range now ${this.cannonRange} • Special stocks replenished`;
        }

        this.totalDamagePerShot = this.getTotalDamagePerShot(this.ammoMultiplier ?? 1);
        this.cannonDamage = this.totalDamagePerShot;
        this.broadsidePower = this.totalDamagePerShot;
        this.updateHealthBar();
        this.refreshShipInfoPanel(true);
        this.scene.events.emit('player-upgraded', type);

        return {
            success: true,
            cost,
            message,
            stats: this.getUpgradeStatsSnapshot()
        };
    }

    purchaseCoreStatUpgrade(type) {
        this.syncRuntimeStateToModel();
        const result = this.stats.purchaseCoreUpgrade(type, this.hp);
        if (!result.success) {
            return result;
        }

        this.syncStatsFromModel();
        this.hp = this.stats.derived.currentHP;
        this.totalDamagePerShot = this.getTotalDamagePerShot(this.ammoMultiplier ?? 1);
        this.cannonDamage = this.totalDamagePerShot;
        this.broadsidePower = this.totalDamagePerShot;

        this.updateHealthBar();
        this.refreshShipInfoPanel(true);
        this.scene.events.emit('player-upgraded', type);

        return {
            success: true,
            cost: result.cost,
            message: result.message,
            totalDamagePerShot: this.totalDamagePerShot,
            stats: this.getUpgradeStatsSnapshot()
        };
    }

    getAttackRange(isHarpoon = false) {
        return isHarpoon ? this.harpoonRange : this.cannonRange;
    }

    getAmmoMultiplier(type = 'cannonball') {
        return this.getAmmoConfig(type).damageMultiplier ?? 1;
    }

    getTotalDamagePerShot(ammoMultiplier = this.ammoMultiplier ?? 1) {
        return Math.round(
            this.cannonCount
            * this.baseDamagePerCannon
            * (1 + ((this.deckCount - 1) * 0.10))
            * ammoMultiplier
        );
    }

    getDamageProfile(isHarpoon = false, ammoMultiplier = this.ammoMultiplier ?? 1) {
        const baseDamage = isHarpoon ? this.harpoonDamage : this.getTotalDamagePerShot(ammoMultiplier);
        return {
            baseDamage,
            minDamage: baseDamage,
            maxDamage: baseDamage
        };
    }

    getAmmoConfig(type = 'cannonball') {
        const techBonus = this.ammoTechLevel - 1;
        const ammoProfiles = {
            cannonball: {
                key: 'cannonball',
                label: 'Iron Ball',
                shortLabel: 'IB',
                tint: 0xe9f1ff,
                trailColor: 0xcfe1ff,
                glowColor: 0xe9f6ff,
                uiColor: 0x9fb4c9,
                damageMultiplier: 1,
                rangeBonus: 0,
                reloadMultiplier: 1,
                burnRatio: 0,
                shockRatio: 0,
                armorBreakRatio: 0,
                antiSailRatio: 0,
                antiCrewRatio: 0,
                splashScale: 0.2,
                ammoCost: 0,
                requiresUnlock: false,
                unlockKey: null,
                summary: 'Balanced iron broadside'
            },
            flare: {
                key: 'flare',
                label: 'Leuchtkugel',
                shortLabel: 'LG',
                tint: 0x7ef0ff,
                trailColor: 0x8af6ff,
                glowColor: 0xd9ffff,
                uiColor: 0x57dfff,
                damageMultiplier: 0.92 + (techBonus * 0.02),
                rangeBonus: 68 + (techBonus * 8),
                reloadMultiplier: 0.92,
                burnRatio: 0,
                shockRatio: 0,
                armorBreakRatio: 0,
                antiSailRatio: 0,
                antiCrewRatio: 0,
                splashScale: 0.24,
                ammoCost: 1,
                requiresUnlock: false,
                unlockKey: null,
                summary: 'Long-range spotting shot'
            },
            fire: {
                key: 'fire',
                label: 'Feuerkugel',
                shortLabel: 'FG',
                tint: 0xff8f43,
                trailColor: 0xffd16f,
                glowColor: 0xffcf8e,
                uiColor: 0xff7c3f,
                damageMultiplier: 1.18 + (techBonus * 0.04),
                rangeBonus: 20 + (techBonus * 4),
                reloadMultiplier: 1.06,
                burnRatio: 0.18 + (techBonus * 0.03),
                shockRatio: 0,
                armorBreakRatio: 0,
                antiSailRatio: 0,
                antiCrewRatio: 0,
                splashScale: 0.28,
                ammoCost: 1,
                requiresUnlock: false,
                unlockKey: null,
                summary: 'Heavy burn damage'
            },
            storm: {
                key: 'storm',
                label: 'Sturmkugel',
                shortLabel: 'SK',
                tint: 0xb78cff,
                trailColor: 0xd8c0ff,
                glowColor: 0xe8d9ff,
                uiColor: 0x9e88ff,
                damageMultiplier: 1.06 + (techBonus * 0.03),
                rangeBonus: 44 + (techBonus * 6),
                reloadMultiplier: 0.96,
                burnRatio: 0,
                shockRatio: 0.14 + (techBonus * 0.02),
                armorBreakRatio: 0,
                antiSailRatio: 0,
                antiCrewRatio: 0,
                splashScale: 0.26,
                ammoCost: 1,
                requiresUnlock: false,
                unlockKey: null,
                summary: 'Crackling shock salvo'
            },
            chainshot: {
                key: 'chainshot',
                label: 'Chain Shot',
                shortLabel: 'CS',
                tint: 0xa8ecff,
                trailColor: 0xc9f6ff,
                glowColor: 0xe3fbff,
                uiColor: 0x65dfff,
                damageMultiplier: 0.82 + (techBonus * 0.02),
                rangeBonus: -14,
                reloadMultiplier: 1.02,
                burnRatio: 0,
                shockRatio: 0,
                armorBreakRatio: 0,
                antiSailRatio: 0.28 + (techBonus * 0.04),
                antiCrewRatio: 0,
                splashScale: 0.23,
                ammoCost: 1,
                requiresUnlock: true,
                unlockKey: 'chainshot',
                summary: 'Cuts rigging and slows enemy ships'
            },
            grapeshot: {
                key: 'grapeshot',
                label: 'Grape Shot',
                shortLabel: 'GS',
                tint: 0xffd899,
                trailColor: 0xffebb8,
                glowColor: 0xfff3d6,
                uiColor: 0xffc56f,
                damageMultiplier: 0.9 + (techBonus * 0.03),
                rangeBonus: -34,
                reloadMultiplier: 0.94,
                burnRatio: 0,
                shockRatio: 0,
                armorBreakRatio: 0,
                antiSailRatio: 0,
                antiCrewRatio: 0.24 + (techBonus * 0.04),
                splashScale: 0.31,
                ammoCost: 1,
                requiresUnlock: true,
                unlockKey: 'grapeshot',
                summary: 'Short-range anti-crew volley'
            }
        };

        return ammoProfiles[type] ?? ammoProfiles.cannonball;
    }

    addAmmoCharges(type, amount) {
        if (!Number.isFinite(this.ammoInventory[type])) return;
        this.ammoInventory[type] = Math.max(0, (this.ammoInventory[type] ?? 0) + amount);
    }

    isAmmoUnlocked(type) {
        const ammo = this.getAmmoConfig(type);
        if (!ammo.requiresUnlock) return true;
        return !!this.specialAmmoUnlocks[ammo.unlockKey];
    }

    unlockAmmoType(type) {
        const ammo = this.getAmmoConfig(type);
        if (!ammo.requiresUnlock || !ammo.unlockKey) {
            return false;
        }
        if (this.specialAmmoUnlocks[ammo.unlockKey]) {
            return false;
        }
        this.specialAmmoUnlocks[ammo.unlockKey] = true;
        return true;
    }

    getAmmoDisplayCount(type) {
        if (!this.isAmmoUnlocked(type)) return 'LOCK';
        const count = this.getAmmoCount(type);
        return Number.isFinite(count) ? `${count}` : '∞';
    }

    consumeAmmo(type) {
        if (type === 'cannonball') return true;
        if (!Number.isFinite(this.ammoInventory[type])) return true;
        if ((this.ammoInventory[type] ?? 0) <= 0) {
            return false;
        }
        this.ammoInventory[type] -= 1;
        return true;
    }

    getAmmoCount(type) {
        if (!this.isAmmoUnlocked(type)) return 0;
        return this.ammoInventory[type] ?? 0;
    }

    getSpecialAmmoUnlockCost(type) {
        if (type === 'chainshot') {
            return { gold: 320, materials: 10 };
        }
        if (type === 'grapeshot') {
            return { gold: 360, materials: 12 };
        }
        return { gold: 9999, materials: 999 };
    }

    purchaseSpecialAmmoUnlock(type) {
        const ammo = this.getAmmoConfig(type);
        if (!ammo.requiresUnlock) {
            return {
                success: false,
                type,
                message: 'This ammunition is already standard issue'
            };
        }
        if (this.isAmmoUnlocked(type)) {
            return {
                success: false,
                type,
                message: `${ammo.label} already unlocked`
            };
        }

        const cost = this.getSpecialAmmoUnlockCost(type);
        if (this.gold < cost.gold || this.materials < cost.materials) {
            return {
                success: false,
                type,
                cost,
                message: 'Not enough gold or materials'
            };
        }

        this.gold -= cost.gold;
        this.materials -= cost.materials;
        this.stats.resources.gold = this.gold;
        this.stats.resources.materials = this.materials;
        this.unlockAmmoType(type);
        this.addAmmoCharges(type, type === 'chainshot' ? 18 : 20);
        this.totalDamagePerShot = this.getTotalDamagePerShot(this.ammoMultiplier ?? 1);
        this.cannonDamage = this.totalDamagePerShot;
        this.broadsidePower = this.totalDamagePerShot;
        this.refreshShipInfoPanel(true);
        this.scene.events.emit('player-upgraded', 'ammo');

        return {
            success: true,
            type,
            cost,
            message: `${ammo.label} unlocked • ${ammo.summary}`,
            stats: this.getUpgradeStatsSnapshot()
        };
    }

    getUpgradeVisualStrength() {
        return {
            hull: this.hullLevel,
            sails: this.sailLevel,
            cannons: this.cannonLevel,
            cannonSlots: this.cannonSlotLevel,
            decks: this.deckLevel,
            ammo: this.ammoTechLevel,
            total: this.hullLevel + this.sailLevel + this.cannonLevel + this.cannonSlotLevel + this.deckLevel + this.ammoTechLevel
        };
    }

    createUnderShipInfoPanel() {
        this.shipInfoPanel = this.scene.add.container(0, 68).setDepth(23);
        this.add(this.shipInfoPanel);

        this.waterHalo = this.scene.add.graphics();
        this.waterHalo.fillStyle(0x55ccff, 0.07);
        this.waterHalo.fillEllipse(0, -68, 90, 40);
        this.shipInfoPanel.add(this.waterHalo);

        this.infoBg = this.scene.add.graphics();
        this.shipInfoPanel.add(this.infoBg);

        this.leftBadgeGfx  = this.scene.add.graphics();
        this.rightBadgeGfx = this.scene.add.graphics();
        this.shipInfoPanel.add([this.leftBadgeGfx, this.rightBadgeGfx]);

        this.tagText = this.scene.add.text(0, -2, '', {
            fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#ffd36a', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0, 0.5);
        this.nameText = this.scene.add.text(0, -2, '', {
            fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0, 0.5);
        this.shipInfoPanel.add([this.tagText, this.nameText]);

        this.hpBar      = this.scene.add.graphics();
        this.voodooBar  = this.scene.add.graphics();
        this.xpBar      = this.scene.add.graphics();
        this.hpNumText  = this.scene.add.text(0, 14, '', {
            fontSize: '9px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#ffffff', stroke: '#000000', strokeThickness: 2, align: 'center'
        }).setOrigin(0.5, 0.5);
        this.shipInfoPanel.add([this.hpBar, this.hpNumText, this.voodooBar, this.xpBar]);

        this.deckGfx = this.scene.add.graphics();
        this.cannonNumText = this.scene.add.text(0, 40, '', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#ffd36a', stroke: '#000000', strokeThickness: 3, align: 'center'
        }).setOrigin(0.5, 0.5);
        this.shipInfoPanel.add([this.deckGfx, this.cannonNumText]);

        this.rankIconGfx  = this.scene.add.graphics();
        this.clanTagText  = this.scene.add.text(0, 0, '', { fontSize: '1px' });
        this.shipInfoPanel.add(this.rankIconGfx);
    }

    _drawLeftBadge(gfx, level) {
        gfx.clear();
        const cx = -82, cy = 2;
        const rankColor = level >= 20 ? 0xffd700 : level >= 10 ? 0xd4d4d4 : level >= 5 ? 0xcd7f32 : 0x9fbccc;
        gfx.fillStyle(0x222233, 0.7);
        gfx.fillCircle(cx, cy, 12);
        gfx.lineStyle(1.5, rankColor, 0.9);
        gfx.strokeCircle(cx, cy, 12);
        gfx.lineStyle(1, rankColor, 0.5);
        gfx.strokeCircle(cx, cy, 10);
        gfx.fillStyle(rankColor, 0.9);
        gfx.fillCircle(cx, cy - 3, 4);
        gfx.fillStyle(rankColor, 0.7);
        gfx.beginPath();
        gfx.moveTo(cx - 5, cy + 1);
        gfx.lineTo(cx + 5, cy + 1);
        gfx.lineTo(cx + 5, cy + 5);
        gfx.lineTo(cx - 5, cy + 5);
        gfx.closePath();
        gfx.fillPath();
        gfx.lineStyle(2, rankColor, 0.9);
        gfx.beginPath();
        gfx.moveTo(cx - 5, cy + 3);
        gfx.lineTo(cx + 5, cy + 3);
        gfx.strokePath();
    }

    _drawRightBadge(gfx, pvpMode) {
        gfx.clear();
        const cx = 82, cy = 2;
        if (!pvpMode) return;
        gfx.fillStyle(0x440000, 0.8);
        gfx.fillCircle(cx, cy, 11);
        gfx.lineStyle(1.5, 0xff4444, 0.9);
        gfx.strokeCircle(cx, cy, 11);
        gfx.lineStyle(2, 0xff8888, 0.9);
        gfx.beginPath();
        gfx.moveTo(cx - 5, cy - 6);
        gfx.lineTo(cx + 5, cy + 6);
        gfx.moveTo(cx + 5, cy - 6);
        gfx.lineTo(cx - 5, cy + 6);
        gfx.strokePath();
        gfx.fillStyle(0xff4444, 0.9);
        gfx.fillCircle(cx - 5, cy - 6, 2);
        gfx.fillCircle(cx + 5, cy - 6, 2);
        gfx.fillCircle(cx, cy + 7, 2);
    }

    _drawGoldDeckIcon(gfx, x, y) {
        gfx.fillStyle(0xff8800, 0.9);
        gfx.fillCircle(x, y, 5);
        gfx.lineStyle(1, 0xffaa00, 1);
        gfx.strokeCircle(x, y, 5);
        gfx.fillStyle(0x000000, 0.6);
        gfx.fillCircle(x - 1.5, y - 1, 1.5);
        gfx.fillCircle(x + 1.5, y - 1, 1.5);
        gfx.fillStyle(0x000000, 0.5);
        gfx.beginPath();
        gfx.arc(x, y + 1, 2.5, 0, Math.PI, false);
        gfx.fillPath();
        gfx.fillStyle(0xff8800, 0.8);
        gfx.fillCircle(x - 3, y + 8, 2);
        gfx.fillCircle(x, y + 8, 2);
        gfx.fillCircle(x + 3, y + 8, 2);
    }

    _drawPearlDeckIcon(gfx, x, y) {
        gfx.fillStyle(0x2288ff, 0.9);
        gfx.fillTriangle(x - 5, y + 3, x, y - 6, x + 5, y + 3);
        gfx.fillTriangle(x - 7, y + 3, x - 3, y + 3, x - 5, y + 7);
        gfx.fillTriangle(x + 3, y + 3, x + 7, y + 3, x + 5, y + 7);
        gfx.lineStyle(1, 0x66bbff, 0.9);
        gfx.strokeTriangle(x - 5, y + 3, x, y - 6, x + 5, y + 3);
        gfx.fillStyle(0x2288ff, 0.8);
        gfx.fillCircle(x - 3, y + 10, 2);
        gfx.fillCircle(x, y + 10, 2);
        gfx.fillCircle(x + 3, y + 10, 2);
    }

    _drawMojoDeckIcon(gfx, x, y) {
        gfx.fillStyle(0xaa44ff, 0.9);
        const pts = [0,-7, 2,-2, 7,-2, 3,1, 4,7, 0,3, -4,7, -3,1, -7,-2, -2,-2];
        gfx.beginPath();
        gfx.moveTo(x + pts[0], y + pts[1]);
        for (let i = 2; i < pts.length; i += 2) gfx.lineTo(x + pts[i], y + pts[i+1]);
        gfx.closePath();
        gfx.fillPath();
        gfx.lineStyle(1, 0xcc88ff, 0.9);
        gfx.beginPath();
        gfx.moveTo(x + pts[0], y + pts[1]);
        for (let i = 2; i < pts.length; i += 2) gfx.lineTo(x + pts[i], y + pts[i+1]);
        gfx.closePath();
        gfx.strokePath();
    }

    _drawCannonSlotIcons(gfx, x, y, count, color) {
        gfx.fillStyle(color, 0.85);
        gfx.lineStyle(1, color, 0.9);
        for (let i = 0; i < Math.min(count, 5); i++) {
            const cx = x + i * 11;
            gfx.fillCircle(cx, y, 3.5);
            gfx.strokeCircle(cx, y, 3.5);
        }
    }

    refreshShipInfoPanel(force = false) {
        if (!this.shipInfoPanel) return;

        const hpText = `${Math.ceil(this.hp)}/${this.maxHP}`;
        const vdPct  = Math.round((this.voodooPoints ?? 0) / (this.voodooMax ?? 1) * 100);
        const stateKey = [
            this.captainTag, this.captainName, hpText, vdPct,
            this.goldDeckSlots, this.pearlDeckSlots, this.mojoDeck,
            this.pvpMode, this.cannonSlotCount, this.cannonCount,
            this.level ?? 1, this.xp ?? 0
        ].join('|');

        if (!force && this.shipInfoStateKey === stateKey) return;
        this.shipInfoStateKey = stateKey;

        const level = this.level ?? 1;

        const BW = 130;
        const BX = -(BW / 2);

        this.infoBg.clear();
        this.infoBg.fillStyle(0x000000, 0.35);
        this.infoBg.fillRoundedRect(-96, -14, 192, 62, 6);

        this._drawLeftBadge(this.leftBadgeGfx, level);
        this._drawRightBadge(this.rightBadgeGfx, this.pvpMode);

        const tagStr  = this.captainTag ?? '';
        const pvpIcon = this.pvpMode ? ' ⚔' : '';
        const nameStr = `${this.captainName ?? 'Kapitän'}${pvpIcon}`;
        this.tagText.setText(tagStr);
        this.nameText.setText(nameStr);
        if (tagStr) {
            const gap = 4;
            const totalW = this.tagText.displayWidth + gap + this.nameText.displayWidth;
            this.tagText.setX(-totalW / 2).setY(-2);
            this.nameText.setX(-totalW / 2 + this.tagText.displayWidth + gap).setY(-2);
        } else {
            this.tagText.setX(-9999);
            this.nameText.setOrigin(0.5, 0.5).setX(0).setY(-2);
        }

        const hpPercent = Phaser.Math.Clamp((this.hp ?? 0) / (this.maxHP ?? 1), 0, 1);
        const hpColor   = hpPercent > 0.5 ? 0x38f287 : hpPercent > 0.25 ? 0xffd45c : 0xff4444;
        this.hpBar.clear();
        this.hpBar.fillStyle(0x000000, 0.55);
        this.hpBar.fillRoundedRect(BX, 8, BW, 9, 4);
        this.hpBar.fillStyle(0x003311, 0.5);
        this.hpBar.fillRoundedRect(BX + 1, 9, BW - 2, 7, 3);
        this.hpBar.fillStyle(hpColor, 1);
        this.hpBar.fillRoundedRect(BX + 1, 9, Math.max(2, (BW - 2) * hpPercent), 7, 3);
        this.hpBar.lineStyle(1, hpColor, 0.5);
        this.hpBar.strokeRoundedRect(BX, 8, BW, 9, 4);

        this.hpNumText.setText(`${Math.ceil(this.hp ?? 0)} / ${this.maxHP ?? 0}`);
        this.hpNumText.setY(14);

        const vdPercent = Phaser.Math.Clamp((this.voodooPoints ?? 0) / (this.voodooMax ?? 1), 0, 1);
        this.voodooBar.clear();
        this.voodooBar.fillStyle(0x000000, 0.45);
        this.voodooBar.fillRoundedRect(BX, 19, BW, 5, 2);
        this.voodooBar.fillStyle(0x8822dd, 0.4);
        this.voodooBar.fillRoundedRect(BX + 1, 20, BW - 2, 3, 1);
        this.voodooBar.fillStyle(0xaa44ff, 1);
        this.voodooBar.fillRoundedRect(BX + 1, 20, Math.max(2, (BW - 2) * vdPercent), 3, 1);
        this.voodooBar.lineStyle(1, 0xaa44ff, 0.4);
        this.voodooBar.strokeRoundedRect(BX, 19, BW, 5, 2);

        const xpMax = 100 * level;
        const xpPct = Phaser.Math.Clamp((this.xp ?? 0) / xpMax, 0, 1);
        this.xpBar.clear();
        this.xpBar.fillStyle(0xffd700, 0.22);
        this.xpBar.fillRoundedRect(BX, 26, BW * xpPct, 2, 1);

        this.deckGfx.clear();
        const gold  = Math.max(0, Math.min(5, this.goldDeckSlots  ?? 3));
        const pearl = Math.max(0, Math.min(5, this.pearlDeckSlots ?? 3));
        const gStartX = -65;
        const pStartX = 20;

        for (let i = 0; i < gold; i++) {
            this._drawGoldDeckIcon(this.deckGfx, gStartX + i * 14, 35);
        }
        for (let i = 0; i < pearl; i++) {
            this._drawPearlDeckIcon(this.deckGfx, pStartX + i * 14, 33);
        }
        if (this.mojoDeck) {
            this._drawMojoDeckIcon(this.deckGfx, pStartX + pearl * 14 + 4, 34);
        }

        const cannonStr = `${this.cannonSlotCount ?? this.cannonCount ?? 8}`;
        this.cannonNumText.setText(cannonStr);
        this.cannonNumText.setX(-3);
        this.cannonNumText.setY(40);

        this.rankIconGfx.clear();
    }

    moveTo(targetX, targetY) {
        this.moveTarget = new Phaser.Math.Vector2(targetX, targetY);
        this.setWakeVisible(true);
    }

    setCombatFacingTarget(target = null) {
        this.combatFacingTarget = target && target.active ? target : null;
        this.rotationSpeed = this.combatFacingTarget ? this.combatRotationSpeed : this.navigationRotationSpeed;
    }

    stopMovement() {
        this.moveTarget = null;
        if (this.body) {
            this.body.setVelocity(0, 0);
        }
        this.setWakeVisible(false);
    }

    takeDamage(amount) {
        if (this._godMode || this._invincible) {
            this.scene?.events?.emit('damage-popup', this.x, this.y - 20, 0);
            return;
        }
        if (this._talentDodge && Math.random() < this._talentDodge) {
            this.scene?.events?.emit('damage-popup', this.x, this.y - 20, 'DODGE');
            return;
        }
        super.takeDamage(amount);
    }

    applyCritBonus(baseDamage) {
        if (this._talentCritChance && Math.random() < this._talentCritChance) {
            return Math.round(baseDamage * 2);
        }
        return baseDamage;
    }

    onDeath() {
        this.scene.events.emit('player-died');
    }

    addXP(amount) {
        this.xp += amount;
        this.stats.resources.xp = this.xp;
        if (this.xp >= 100 * this.level) {
            this.levelUp();
        }
        this.scene.events.emit('xp-gain', amount);
    }

    heal(amount) {
        this.hp = Math.min(this.maxHP, this.hp + amount);
        this.updateHealthBar();
        this.refreshShipInfoPanel();
        this.scene.events.emit('heal-popup', this.x, this.y - 20, amount);
    }

    levelUp() {
        this.xp -= 100 * this.level;
        this.level++;
        this.levelBonusHP += this.levelHpPerLevel;
        this.stats.resources.xp = this.xp;
        this.stats.resources.level = this.level;
        this.stats.bonuses.levelBonusHP = this.levelBonusHP;
        this.updateDerivedStats();
        this.hp = this.maxHP;
        this.stats.derived.currentHP = this.hp;
        this.updateHealthBar();
        this.refreshShipInfoPanel(true);
        this.scene.events.emit('level-up', this.level);
    }

    update() {
        if (this.combatFacingTarget && this.combatFacingTarget.active) {
            this.rotationSpeed = this.combatRotationSpeed;
            this.targetAngle = Phaser.Math.Angle.Between(this.x, this.y, this.combatFacingTarget.x, this.combatFacingTarget.y);
        } else {
            this.rotationSpeed = this.navigationRotationSpeed;
        }

        super.update();
        this.refreshShipInfoPanel();

        const vx = this.body.velocity.x;
        const vy = this.body.velocity.y;

        if (this.moveTarget) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, this.moveTarget.x, this.moveTarget.y);

            if (distance > 20) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.moveTarget.x, this.moveTarget.y);
                const targetVx = Math.cos(angle) * this.speed;
                const targetVy = Math.sin(angle) * this.speed;
                const responseLerp = this.combatFacingTarget && this.combatFacingTarget.active ? 0.16 : 0.08;

                this.body.setVelocityX(Phaser.Math.Linear(vx, targetVx, responseLerp));
                this.body.setVelocityY(Phaser.Math.Linear(vy, targetVy, responseLerp));
                this.setWakeVisible(true);
            } else {
                this.body.setVelocityX(Phaser.Math.Linear(vx, 0, 0.1));
                this.body.setVelocityY(Phaser.Math.Linear(vy, 0, 0.1));

                if (this.body.velocity.length() < 5) {
                    this.body.setVelocity(0, 0);
                    this.moveTarget = null;
                    this.setWakeVisible(false);
                }
            }
        } else {
            this.body.setVelocityX(Phaser.Math.Linear(vx, 0, 0.05));
            this.body.setVelocityY(Phaser.Math.Linear(vy, 0, 0.05));

            if (this.body.velocity.length() < 1) {
                this.body.setVelocity(0, 0);
                this.setWakeVisible(false);
            }
        }

        if (this.combatFacingTarget && this.combatFacingTarget.active) {
            this.targetAngle = Phaser.Math.Angle.Between(this.x, this.y, this.combatFacingTarget.x, this.combatFacingTarget.y);
        } else if (this.body.velocity.length() > 5) {
            this.targetAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
        }
    }
}