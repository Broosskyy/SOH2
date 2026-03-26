export default class PlayerStats {
    constructor() {
        this.resources = {
            gold: 1400,
            materials: 32,
            gems: 5,
            xp: 0,
            level: 1
        };

        this.base = {
            maxHP: 2200,
            speed: 280,
            cannonCount: 6,
            deckCount: 1,
            damagePerCannon: 18,
            harpoonDamage: 110,
            cannonRange: 320,
            harpoonRange: 390,
            reloadTime: 1350
        };

        this.bonuses = {
            levelBonusHP: 0
        };

        this.upgrades = {
            maxHPLevel: 1,
            sailsLevel: 1,
            baseDamagePerCannonLevel: 1,
            cannonsLevel: 1,
            decksLevel: 1,
            ammoTechLevel: 1
        };

        this.tuning = {
            hullHpPerLevel: 180,
            deckHpPerLevel: 120,
            sailSpeedPerLevel: 18,
            cannonDamagePerLevel: 4,
            ammoDamagePerLevel: 3,
            cannonRangePerLevel: 16,
            ammoRangePerLevel: 10,
            cannonReloadReductionPerLevel: 45,
            ammoReloadReductionPerLevel: 20,
            deckDamageBonusPerLevel: 0.1,
            levelHpPerLevel: 55
        };

        this.derived = {};
        this.recalculate(this.base.maxHP);
    }

    normalizeUpgradeType(type) {
        const aliasMap = {
            hull: 'maxHP',
            MaxHP: 'maxHP',
            maxHP: 'maxHP',
            sails: 'sails',
            cannons: 'baseDamagePerCannon',
            BaseDamagePerCannon: 'baseDamagePerCannon',
            baseDamagePerCannon: 'baseDamagePerCannon',
            cannonSlots: 'cannons',
            Cannons: 'cannons',
            cannonCount: 'cannons',
            decks: 'decks',
            Decks: 'decks',
            ammo: 'ammo'
        };

        return aliasMap[type] ?? type;
    }

    getUpgradeLevel(type) {
        const normalizedType = this.normalizeUpgradeType(type);
        if (normalizedType === 'maxHP') return this.upgrades.maxHPLevel;
        if (normalizedType === 'sails') return this.upgrades.sailsLevel;
        if (normalizedType === 'baseDamagePerCannon') return this.upgrades.baseDamagePerCannonLevel;
        if (normalizedType === 'cannons') return this.upgrades.cannonsLevel;
        if (normalizedType === 'decks') return this.upgrades.decksLevel;
        if (normalizedType === 'ammo') return this.upgrades.ammoTechLevel;
        return 1;
    }

    getUpgradeCost(type) {
        const normalizedType = this.normalizeUpgradeType(type);
        const level = this.getUpgradeLevel(normalizedType);

        if (normalizedType === 'maxHP') {
            return { gold: 140 + ((level - 1) * 110), materials: 0 };
        }
        if (normalizedType === 'sails') {
            return { gold: 130 + ((level - 1) * 105), materials: 4 + ((level - 1) * 2) };
        }
        if (normalizedType === 'baseDamagePerCannon') {
            return { gold: 180 + ((level - 1) * 140), materials: 0 };
        }
        if (normalizedType === 'cannons') {
            return { gold: 240 + ((level - 1) * 185), materials: 0 };
        }
        if (normalizedType === 'decks') {
            return { gold: 240 + ((level - 1) * 175), materials: 0 };
        }
        if (normalizedType === 'ammo') {
            return { gold: 165 + ((level - 1) * 125), materials: 5 + ((level - 1) * 3) };
        }

        return { gold: 9999, materials: 999 };
    }

    recalculate(currentHP = this.derived.maxHP ?? this.base.maxHP, ammoMultiplier = this.derived.ammoMultiplier ?? 1) {
        const maxHP = this.base.maxHP
            + this.bonuses.levelBonusHP
            + ((this.upgrades.maxHPLevel - 1) * this.tuning.hullHpPerLevel)
            + ((this.upgrades.decksLevel - 1) * this.tuning.deckHpPerLevel);
        const speed = this.base.speed + ((this.upgrades.sailsLevel - 1) * this.tuning.sailSpeedPerLevel);
        const deckCount = this.base.deckCount + (this.upgrades.decksLevel - 1);
        const cannonCount = this.base.cannonCount + ((this.upgrades.cannonsLevel - 1) * 2);
        const baseDamagePerCannon = this.base.damagePerCannon
            + ((this.upgrades.baseDamagePerCannonLevel - 1) * this.tuning.cannonDamagePerLevel)
            + ((this.upgrades.ammoTechLevel - 1) * this.tuning.ammoDamagePerLevel);
        const deckDamageMultiplier = 1 + (Math.max(0, deckCount - 1) * 0.10);
        const totalDamagePerShot = Math.round(cannonCount * baseDamagePerCannon * deckDamageMultiplier * ammoMultiplier);
        const cannonRange = this.base.cannonRange
            + ((this.upgrades.baseDamagePerCannonLevel - 1) * this.tuning.cannonRangePerLevel)
            + ((this.upgrades.ammoTechLevel - 1) * this.tuning.ammoRangePerLevel);
        const harpoonDamage = this.base.harpoonDamage + ((this.upgrades.baseDamagePerCannonLevel - 1) * 28);
        const harpoonRange = this.base.harpoonRange + ((this.upgrades.baseDamagePerCannonLevel - 1) * 24);
        const reloadTime = Math.max(
            520,
            this.base.reloadTime
                - ((this.upgrades.baseDamagePerCannonLevel - 1) * this.tuning.cannonReloadReductionPerLevel)
                - ((this.upgrades.ammoTechLevel - 1) * this.tuning.ammoReloadReductionPerLevel)
        );

        this.derived = {
            maxHP,
            speed,
            deckCount,
            cannonCount,
            baseDamagePerCannon,
            damagePerCannon: baseDamagePerCannon,
            ammoMultiplier,
            deckDamageMultiplier,
            totalDamagePerShot,
            cannonDamage: totalDamagePerShot,
            harpoonDamage,
            cannonRange,
            harpoonRange,
            reloadTime,
            broadsidePower: totalDamagePerShot,
            shipRating: maxHP + (speed * 7) + (cannonCount * 150) + (baseDamagePerCannon * 18) + (deckCount * 320),
            currentHP: Math.min(currentHP, maxHP)
        };

        return this.derived;
    }

    purchaseCoreUpgrade(type, currentHP) {
        const normalizedType = this.normalizeUpgradeType(type);
        const supportedCoreUpgrade = ['maxHP', 'baseDamagePerCannon', 'cannons', 'decks'].includes(normalizedType);
        if (!supportedCoreUpgrade) {
            return {
                success: false,
                cost: this.getUpgradeCost(normalizedType),
                message: 'Unsupported upgrade'
            };
        }

        const cost = this.getUpgradeCost(normalizedType);
        if (this.resources.gold < cost.gold) {
            return {
                success: false,
                cost,
                message: 'Not enough gold'
            };
        }

        this.resources.gold -= cost.gold;

        if (normalizedType === 'maxHP') {
            this.upgrades.maxHPLevel += 1;
        } else if (normalizedType === 'baseDamagePerCannon') {
            this.upgrades.baseDamagePerCannonLevel += 1;
        } else if (normalizedType === 'cannons') {
            this.upgrades.cannonsLevel += 1;
        } else if (normalizedType === 'decks') {
            this.upgrades.decksLevel += 1;
        }

        const derived = this.recalculate(currentHP);
        return {
            success: true,
            cost,
            normalizedType,
            derived,
            message: normalizedType === 'maxHP'
                ? `MaxHP upgraded • HP now ${derived.maxHP}`
                : normalizedType === 'baseDamagePerCannon'
                    ? `BaseDamagePerCannon upgraded • ${derived.damagePerCannon} damage per cannon`
                    : normalizedType === 'cannons'
                        ? `Cannons upgraded • ${derived.cannonCount} cannons ready`
                        : `Decks upgraded • ${derived.deckCount} decks • broadside ${derived.totalDamagePerShot}`
        };
    }
}
