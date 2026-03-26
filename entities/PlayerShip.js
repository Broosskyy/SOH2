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
        this.captainTag = '[SEA]';
        this.captainName = 'Rosie Corsair';
        this.playerId = '784211';
        this.shipInfoStateKey = '';
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

        this.nameText = this.scene.add.text(0, 0, '', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5, 0.5);

        this.clanTagText = this.scene.add.text(-40, 0, '', {
            fontSize: '11px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#f7e349',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5, 0.5);

        this.rankIconGfx = this.scene.add.graphics();

        this.hpBar = this.scene.add.graphics();
        this.xpBar = this.scene.add.graphics();

        this.shipInfoPanel.add([this.nameText, this.clanTagText, this.rankIconGfx, this.hpBar, this.xpBar]);

        this.statDisplayRows = [
            { key: 'decks', label: 'DECK', color: 0x6ce6dd, textColor: '#d7fffc', valueGetter: () => `${this.deckCount}` },
            { key: 'cannons', label: 'CAN', color: 0xffc56a, textColor: '#fff2d4', valueGetter: () => `${this.cannonCount}` },
            { key: 'broadside', label: 'DMG', color: 0xff7d6b, textColor: '#ffe1dc', valueGetter: () => `${this.getTotalDamagePerShot(this.ammoMultiplier ?? 1)}` },
            { key: 'ammo', label: 'AMMO', color: 0x9f8cff, textColor: '#efe7ff', valueGetter: () => this.getAmmoDisplayCount(this.scene.currentAmmoType ?? 'cannonball') }
        ];

        this.statDisplayRows.forEach((row, index) => {
            const slotX = -90 + (index * 60);
            const slot = this.scene.add.container(slotX, 40);
            const icon = this.scene.add.graphics();
            const valueText = this.scene.add.text(0, 12, '', {
                fontSize: '11px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: row.textColor,
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            }).setOrigin(0.5, 0.5);
            const labelText = this.scene.add.text(0, 24, row.label, {
                fontSize: '9px',
                fontFamily: 'Arial',
                color: '#9fb8c8',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            }).setOrigin(0.5, 0.5);

            slot.add([icon, valueText, labelText]);
            this.shipInfoPanel.add(slot);
            row.slot = slot;
            row.icon = icon;
            row.valueText = valueText;
            row.labelText = labelText;
        });
    }

    drawShipInfoIcon(type, graphic, color) {
        graphic.clear();
        graphic.fillStyle(color, 0.16);
        graphic.lineStyle(1.5, color, 0.95);
        graphic.fillRoundedRect(-18, -10, 36, 20, 8);
        graphic.strokeRoundedRect(-18, -10, 36, 20, 8);

        if (type === 'decks') {
            graphic.lineStyle(2, color, 1);
            graphic.strokeRoundedRect(-10, -5, 20, 4, 2);
            graphic.strokeRoundedRect(-8, -1, 16, 4, 2);
            graphic.strokeRoundedRect(-6, 3, 12, 4, 2);
        } else if (type === 'cannons') {
            graphic.lineStyle(2, color, 1);
            graphic.strokeCircle(-5, 0, 3);
            graphic.strokeCircle(5, 0, 3);
            graphic.beginPath();
            graphic.moveTo(-2, -2);
            graphic.lineTo(10, -6);
            graphic.moveTo(-2, 2);
            graphic.lineTo(10, 6);
            graphic.strokePath();
        } else if (type === 'broadside') {
            graphic.lineStyle(2, color, 1);
            graphic.beginPath();
            graphic.moveTo(-10, 6);
            graphic.lineTo(-4, -6);
            graphic.lineTo(0, 3);
            graphic.lineTo(5, -8);
            graphic.lineTo(10, 5);
            graphic.strokePath();
        } else if (type === 'ammo') {
            graphic.lineStyle(2, color, 1);
            graphic.strokeCircle(0, 0, 5);
            graphic.beginPath();
            graphic.moveTo(-7, 7);
            graphic.lineTo(7, -7);
            graphic.moveTo(-7, -7);
            graphic.lineTo(7, 7);
            graphic.strokePath();
        }
    }

    refreshShipInfoPanel(force = false) {
        if (!this.shipInfoPanel) return;

        const hpText = `${Math.ceil(this.hp)}/${this.maxHP}`;
        const stateKey = [
            this.captainTag,
            this.captainName,
            this.playerId,
            hpText,
            this.deckCount,
            this.cannonCount,
            this.getTotalDamagePerShot(this.ammoMultiplier ?? 1),
            this.scene.currentAmmoType ?? 'cannonball',
            this.getAmmoDisplayCount(this.scene.currentAmmoType ?? 'cannonball'),
            this.level ?? 1,
            this.xp ?? 0
        ].join('|');

        if (!force && this.shipInfoStateKey === stateKey) return;
        this.shipInfoStateKey = stateKey;

        this.clanTagText.setText(this.captainTag ?? '');
        const nameWidth = this.clanTagText.width;
        this.clanTagText.setX(-(nameWidth / 2 + 4));
        this.nameText.setText(this.captainName ?? '');
        this.nameText.setX((nameWidth / 2 + 4));

        const barWidth = 120;
        const hpPercent = Phaser.Math.Clamp(this.hp / this.maxHP, 0, 1);
        const hpColor = hpPercent > 0.5 ? 0x38f287 : hpPercent > 0.25 ? 0xffd45c : 0xff6f6f;
        this.hpBar.clear();
        this.hpBar.fillStyle(0x000000, 0.45);
        this.hpBar.fillRoundedRect(-(barWidth / 2), 12, barWidth, 6, 3);
        this.hpBar.fillStyle(hpColor, 1);
        this.hpBar.fillRoundedRect(-(barWidth / 2), 12, barWidth * hpPercent, 6, 3);

        const xpMax = 100 * (this.level ?? 1);
        const xpPercent = Phaser.Math.Clamp((this.xp ?? 0) / xpMax, 0, 1);
        this.xpBar.clear();
        this.xpBar.fillStyle(0x000000, 0.45);
        this.xpBar.fillRoundedRect(-(barWidth / 2), 20, barWidth, 4, 2);
        this.xpBar.fillStyle(0xa855f7, 1);
        this.xpBar.fillRoundedRect(-(barWidth / 2), 20, barWidth * xpPercent, 4, 2);

        const level = this.level ?? 1;
        this.rankIconGfx.clear();
        const rankColor = level >= 20 ? 0xffd700 : level >= 10 ? 0xc0c0c0 : level >= 5 ? 0xcd7f32 : 0x8899aa;
        const iconX = 68;
        const iconY = 0;
        this.rankIconGfx.fillStyle(rankColor, 0.9);
        this.rankIconGfx.lineStyle(1, rankColor, 1);
        if (level >= 20) {
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
                const px = iconX + Math.cos(a) * 7;
                const py = iconY + Math.sin(a) * 7;
                this.rankIconGfx.fillCircle(px, py, 2);
            }
        } else if (level >= 10) {
            this.rankIconGfx.strokeTriangle(iconX - 6, iconY + 4, iconX + 6, iconY + 4, iconX, iconY - 6);
            this.rankIconGfx.fillTriangle(iconX - 5, iconY + 3, iconX + 5, iconY + 3, iconX, iconY - 5);
        } else if (level >= 5) {
            this.rankIconGfx.fillRect(iconX - 5, iconY - 5, 10, 10);
        } else {
            this.rankIconGfx.fillCircle(iconX, iconY, 5);
        }

        this.statDisplayRows.forEach((row) => {
            row.valueText.setText(row.valueGetter());
            this.drawShipInfoIcon(row.key, row.icon, row.color);
        });
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