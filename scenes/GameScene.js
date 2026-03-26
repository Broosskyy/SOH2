import PlayerShip from '../entities/PlayerShip.js';
import NPCShip from '../entities/NPCShip.js';
import Gift from '../entities/Gift.js';
import Monster from '../entities/Monster.js';
import Island from '../entities/Island.js';
import Minimap from '../ui/Minimap.js';
import ShopPanel from '../ui/ShopPanel.js';
import MissionPanel from '../ui/MissionPanel.js';
import BonusPanel from '../ui/BonusPanel.js';
import EventsPanel from '../ui/EventsPanel.js';
import RangPanel from '../ui/RangPanel.js';
import Phaser from 'phaser';
import * as Tone from 'tone';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.mapWidth = 4200;
        this.mapHeight = 4200;
        this.playerSpawnX = this.mapWidth / 2;
        this.playerSpawnY = this.mapHeight / 2;
        this.selectedTarget = null;
        this.TargetEnemy = null;
        this.soundInitialized = false;
        this.lastAttackTime = 0;
        this.attackInterval = 1000;
        this.autoAttackEnabled = false;
        this.autoAttackMode = 'cannon';
        this.autoApproachActive = false;
        this.targetIndicatorBaseRadius = 44;
        this.upgradePanelOpen = false;
        this.cameraTargetX = 0;
        this.cameraTargetY = 0;
        this.cameraDragState = null;
        this.panelDragState = null;
        this.uiPanelPositions = {};
        this.cameraReturnTween = null;
        this.cameraDefaultZoom = 1;
        this.isMinimapMinimized = true;
        this.isNavBarVisible = true;
        this.isSeaGateVisible = false;
        this.isReturnToShipVisible = false;
        this.isStatusFeedVisible = false;
        this.isStatusFeedMinimized = true;
        this.isChatVisible = false;
        this.isChatMinimized = true;
        this.cameraDragThreshold = 12;
        this.npcSpawnIndex = 0;
        this.monsterSpawnIndex = 0;
        this.npcSpawnClusters = [];
        this.islandSpawnPoints = [];
        this.currentAmmoType = 'cannonball';
        this.topMenuButtons = [];
        this.statusFeedMessages = [];
        this.chatMessages = [];
        this.chatInputValue = '';
        this.chatInputPlaceholder = 'Nachricht oder Befehl eingeben…';
        this.activeChatTab = 'Global';
        this.chatScrollOffset = 0;
        this.chatMaxVisibleLines = 7;
        this.maxChartIndex = 10;
        this.currentChartIndex = 1;
        this.currentChartConfig = null;
        this.chartEntryDirection = 'center';
        this.chartTravelRatioY = 0.5;
        this.chartTravelGraceUntil = 0;
        this.pendingMapTransition = false;
        this.availableCharts = this.createChartConfigs();
        this.skillCooldowns = {};
        this.combatSkillDefs = [
            {
                key: 'burst',
                shortLabel: 'BST',
                name: 'Burst',
                accent: 0xffb347,
                cooldown: 8000,
                targetRequired: true,
                description: 'Heavy salvo'
            },
            {
                key: 'break',
                shortLabel: 'BRK',
                name: 'Break',
                accent: 0x65dfff,
                cooldown: 12000,
                targetRequired: true,
                description: 'Vulnerability'
            },
            {
                key: 'repair',
                shortLabel: 'RPR',
                name: 'Repair',
                accent: 0x7fffb0,
                cooldown: 18000,
                targetRequired: false,
                description: 'Hull restore'
            }
        ];
    }

    init(data = {}) {
        this.currentChartIndex = Phaser.Math.Clamp(data.chartIndex ?? this.currentChartIndex ?? 1, 1, this.maxChartIndex);
        this.chartEntryDirection = data.entryDirection ?? 'center';
        this.chartTravelRatioY = Phaser.Math.Clamp(data.travelRatioY ?? 0.5, 0.08, 0.92);
    }

    preload() {
        this.load.image('player-ship', 'assets/player_ship_royal_crimson_v1.webp');

        this.load.image('ship-small-1', 'assets/ship_small_neon_1.webp');
        this.load.image('ship-small-2', 'assets/ship_small_neon_2.webp');
        this.load.image('ship-small-3', 'assets/ship_small_neon_3.webp');
        this.load.image('ship-small-4', 'assets/ship_small_neon_4.webp');
        this.load.image('ship-small-5', 'assets/ship_small_neon_5.webp');

        this.load.image('ship-medium-1', 'assets/ship_medium_neon_1.webp');
        this.load.image('ship-medium-2', 'assets/ship_medium_neon_2.webp');
        this.load.image('ship-medium-3', 'assets/ship_medium_neon_3.webp');

        this.load.image('ship-large-1', 'assets/ship_large_neon_1.webp');
        this.load.image('ship-large-2', 'assets/ship_large_neon_2.webp');

        this.load.image('monster-kraken', 'assets/monster_kraken_tentacle.webp');
        this.load.image('monster-leviathan', 'assets/monster_leviathan.webp');
        this.load.image('monster-shark', 'assets/monster_giant_shark_pro.webp');
        this.load.image('monster-demon', 'assets/monster_sea_demon_pro.webp');

        this.load.image('ocean-bg', 'assets/gekachelterhintergrund-1.png');
        this.load.image('island-atoll', 'assets/island_atoll_pro.webp');
        this.load.image('island-reef', 'assets/island_reef_pro.webp');
        this.load.image('gift-chest', 'assets/loot_treasure_chest_gold.webp');
        this.load.image('gold-bag', 'assets/loot_gold_bag_pro.webp');
        this.load.image('xp-orb', 'assets/loot_xp_orb_pro.webp');

        this.load.image('attack-btn', 'assets/ui_button_attack_pro_v2.webp');
        this.load.image('harpoon-btn', 'assets/ui_button_harpoon_pro_v2.webp');
        this.load.image('inventory-btn', 'assets/ui_icon_inventory_pro.webp');
        this.load.image('shop-btn', 'assets/ui_icon_shop_pro.webp');
        this.load.image('map-btn', 'assets/ui_icon_map_pro_v2.webp');

        this.load.image('cannonball', 'assets/projectile_cannonball.webp');
        this.load.image('harpoon', 'assets/projectile_harpoon.webp');
        this.load.image('explosion', 'assets/effect_explosion_stylized.webp');
        this.load.image('water-splash', 'assets/effect_water_splash_stylized.webp');
        this.load.image('ship-wake', 'assets/effect_ship_wake_pro.webp');
    }

    create() {
        this.screenWidth = this.scale.width;
        this.screenHeight = this.scale.height;
        const { width, height } = this.scale;
        this.currentChartConfig = this.getChartConfig(this.currentChartIndex);
        const worldWidth = this.currentChartConfig.worldWidth;
        const worldHeight = this.currentChartConfig.worldHeight;

        this.mapWidth = worldWidth;
        this.mapHeight = worldHeight;
        this.setChartSpawnPointFromEntry();
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        this.background = this.add.tileSprite(0, 0, width, height, 'ocean-bg');
        this.background.setOrigin(0, 0);
        this.background.setScrollFactor(0);
        this.syncOceanBackground();

        this.islands = this.add.group({ runChildUpdate: false });
        this.buildIslandSpawnPoints(this.currentChartConfig.islandCount, worldWidth, worldHeight);
        this.spawnIslands();

        this.player = new PlayerShip(this, this.playerSpawnX, this.playerSpawnY);
        this.createPlayerVisualEffects();

        this.playerReturnHighlight = this.add.circle(this.player.x, this.player.y, 54, 0x7fd3ff, 0.12)
            .setStrokeStyle(4, 0xcdf6ff, 0.95)
            .setDepth(25)
            .setAlpha(0)
            .setScale(0.55)
            .setVisible(false);
        this.playerReturnHighlightBlend = this.add.circle(this.player.x, this.player.y, 34, 0xffffff, 0.16)
            .setDepth(24)
            .setAlpha(0)
            .setScale(0.7)
            .setVisible(false);
        this.playerReturnHighlightTween = null;

        this.physics.add.collider(this.player, this.islands);

        this.npcGroup = this.add.group({ runChildUpdate: true });
        for (let i = 0; i < this.currentChartConfig.npcCount; i++) {
            this.spawnNPC();
        }

        this.monsterGroup = this.add.group({ runChildUpdate: true });
        for (let i = 0; i < this.currentChartConfig.monsterCount; i++) {
            this.spawnMonster();
        }

        this.gifts = this.physics.add.group();
        for (let i = 0; i < this.currentChartConfig.giftCount; i++) {
            this.spawnGift();
        }

        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.cameras.main.setZoom(this.cameraDefaultZoom);
        this.cameras.main.stopFollow();
        this.cameras.main.centerOn(this.player.x, this.player.y);
        this.cameraTargetX = this.cameras.main.scrollX;
        this.cameraTargetY = this.cameras.main.scrollY;

        this.input.setTopOnly(true);

        this.input.on('pointerdown', (pointer, gameObjects) => {
            const panelDragObject = gameObjects.find(obj => obj.getData && obj.getData('panelDragHandle'));
            if (panelDragObject) {
                const panelKey = panelDragObject.getData('panelKey');
                const panelContainer = this.getPanelContainerByKey(panelKey);
                if (panelKey && panelContainer) {
                    this.beginPanelDrag(pointer, panelKey, panelContainer);
                    this.cameraDragState = null;
                    return;
                }
            }

            const clickedUI = gameObjects.some(obj => obj.getData && obj.getData('uiControl'));

            if (clickedUI) {
                this.cameraDragState = null;
                return;
            }

            this.cameraDragState = {
                startX: pointer.x,
                startY: pointer.y,
                lastX: pointer.x,
                lastY: pointer.y,
                startScrollX: this.cameraTargetX,
                startScrollY: this.cameraTargetY,
                dragged: false,
                clickedUI: false
            };
        });

        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && this.panelDragState) {
                this.updatePanelDrag(pointer);
                return;
            }

            if (!pointer.isDown || !this.cameraDragState) return;

            if (this.cameraReturnTween) {
                this.cameraReturnTween.stop();
                this.cameraReturnTween = null;
            }

            const dragX = pointer.x - this.cameraDragState.startX;
            const dragY = pointer.y - this.cameraDragState.startY;
            const dragDistance = Math.hypot(dragX, dragY);

            if (dragDistance > this.cameraDragThreshold) {
                this.cameraDragState.dragged = true;
            }

            if (!this.cameraDragState.dragged) return;

            this.cameraTargetX = this.cameraDragState.startScrollX - dragX;
            this.cameraTargetY = this.cameraDragState.startScrollY - dragY;
            this.clampCameraTarget();
            this.cameraDragState.lastX = pointer.x;
            this.cameraDragState.lastY = pointer.y;
        });

        this.input.on('pointerup', (pointer) => {
            if (this.panelDragState) {
                this.endPanelDrag();
                return;
            }

            if (!this.cameraDragState) return;

            const dragState = this.cameraDragState;
            this.cameraDragState = null;

            if (dragState.dragged) {
                this.clampCameraTarget();
                return;
            }

            const worldPoint = pointer.positionToCamera(this.cameras.main);
            const clickedTarget = this.getTargetAtWorldPoint(worldPoint.x, worldPoint.y);

            if (clickedTarget) {
                this.selectTarget(clickedTarget);
                return;
            }

            this.clearTargetAndAttackState();
            this.player.moveTo(worldPoint.x, worldPoint.y);
        });

        this.physics.add.overlap(this.player, this.gifts, this.collectGift, null, this);

        this.createUI();
        this.minimap = new Minimap(this, width - 188, 92, 160, worldWidth, worldHeight);
        this.minimap.setWorldMetrics(worldWidth, worldHeight);
        this.minimap.setChartInfo(this.currentChartIndex, this.currentChartConfig.name);
        this.minimap.setMinimized(this.isMinimapMinimized);

        this.input.once('pointerdown', async () => {
            if (!this.soundInitialized) {
                await Tone.start();
                this.soundInitialized = true;
                this.setupSounds();
            }
        });

        this.shopPanel    = new ShopPanel(this);
        this.missionPanel = new MissionPanel(this);
        this.bonusPanel   = new BonusPanel(this);
        this.eventsPanel  = new EventsPanel(this);
        this.rangPanel    = new RangPanel(this);

        this.scale.on('resize', this.handleResize, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.handleResize, this);
            [this.shopPanel, this.missionPanel, this.bonusPanel, this.eventsPanel, this.rangPanel]
                .forEach(p => p?.destroy());
        });

        this.events.on('damage-popup', this.showDamagePopup, this);
        this.events.on('heal-popup', this.showHealPopup, this);
        this.events.on('npc-selected', this.selectTarget, this);
        this.events.on('npc-died', (npc) => {
            if (this.TargetEnemy === npc || this.selectedTarget === npc) {
                this.clearTargetAndAttackState();
            }
            this.player.addXP(npc.xpValue);
            this.player.heal(npc.xpValue / 2);
            this.spawnLootFromDefeat(npc);
            this.missionPanel?.trackKill();
            if (npc instanceof NPCShip) {
                this.time.delayedCall(10000, () => this.spawnNPC());
            } else if (npc instanceof Monster) {
                this.time.delayedCall(12000, () => this.spawnMonster());
            }
        });
        this.events.on('player-died', () => {
            this.showStatusMsg('Ship Sunk!', 0xff0000);
            this.time.delayedCall(2000, () => this.scene.restart({ chartIndex: this.currentChartIndex, entryDirection: 'center', travelRatioY: 0.5 }));
        });
        this.events.on('xp-gain', () => this.updateUIBars(), this);
        this.events.on('level-up', (level) => {
            this.updateUIBars();
            this.showStatusMsg(`Level Up! Current Level: ${level}`, 0xffff00);
            this.refreshSeaGateUI();
        });
        this.events.on('player-upgraded', (type) => {
            this.attackInterval = this.player.reloadTime;
            this.player.refreshShipInfoPanel(true);
            this.updateUIBars();
            this.refreshUpgradeTexts();
            this.playUpgradeBurst(type);
            if (this.shopPanel?.visible) this.shopPanel.show();
            this.missionPanel?.trackUpgrade();
        });
        this.events.on('gold-collected', (amount) => {
            this.missionPanel?.trackGold(amount);
        });
        this.events.on('damage-dealt', (amount) => {
            this.missionPanel?.trackDamage(amount);
        });

        this.finalizeChartEntryPosition();
    }

    createChartConfigs() {
        return Array.from({ length: this.maxChartIndex }, (_, index) => {
            const chart = index + 1;
            const size = 4200 + (index * 220);
            return {
                index: chart,
                name: `Seekarte ${chart}`,
                worldWidth: size,
                worldHeight: size,
                spawnX: size / 2,
                spawnY: size / 2,
                islandCount: 18 + Math.min(10, index),
                npcCount: 24 + (index * 3),
                monsterCount: 12 + (index * 2),
                giftCount: 20 + index,
                requiredLevel: chart
            };
        });
    }

    getChartConfig(chartIndex = this.currentChartIndex) {
        return this.availableCharts[Phaser.Math.Clamp(chartIndex - 1, 0, this.maxChartIndex - 1)];
    }

    getUnlockedChartIndex() {
        return Phaser.Math.Clamp(this.player?.level ?? 1, 1, this.maxChartIndex);
    }

    canAccessChart(chartIndex) {
        return chartIndex <= this.getUnlockedChartIndex();
    }

    getChartGateLabel(direction) {
        const targetIndex = this.currentChartIndex + (direction > 0 ? 1 : -1);
        if (targetIndex < 1 || targetIndex > this.maxChartIndex) return null;
        const cfg = this.getChartConfig(targetIndex);
        return `Karte ${targetIndex}${cfg.requiredLevel > 1 ? ` • Lvl ${cfg.requiredLevel}` : ''}`;
    }

    setChartSpawnPointFromEntry() {
        const cfg = this.currentChartConfig;
        if (!cfg) return;

        const edgePadding = 180;
        this.playerSpawnX = cfg.spawnX;
        this.playerSpawnY = cfg.spawnY;

        if (this.chartEntryDirection === 'east') {
            this.playerSpawnX = edgePadding;
            this.playerSpawnY = Phaser.Math.Clamp(cfg.worldHeight * this.chartTravelRatioY, edgePadding, cfg.worldHeight - edgePadding);
            return;
        }

        if (this.chartEntryDirection === 'west') {
            this.playerSpawnX = cfg.worldWidth - edgePadding;
            this.playerSpawnY = Phaser.Math.Clamp(cfg.worldHeight * this.chartTravelRatioY, edgePadding, cfg.worldHeight - edgePadding);
            return;
        }

        if (this.chartEntryDirection === 'north') {
            this.playerSpawnY = cfg.worldHeight - edgePadding;
            this.playerSpawnX = Phaser.Math.Clamp(cfg.worldWidth * this.chartTravelRatioY, edgePadding, cfg.worldWidth - edgePadding);
            return;
        }

        if (this.chartEntryDirection === 'south') {
            this.playerSpawnY = edgePadding;
            this.playerSpawnX = Phaser.Math.Clamp(cfg.worldWidth * this.chartTravelRatioY, edgePadding, cfg.worldWidth - edgePadding);
        }
    }

    getOppositeEntryDirection(direction) {
        const entryMap = {
            east: 'east',
            west: 'west',
            north: 'north',
            south: 'south'
        };
        return entryMap[direction] ?? 'center';
    }

    syncOceanBackground() {
        if (!this.background) return;
        const width = this.scale.width;
        const height = this.scale.height;
        const tileScale = Math.max(0.72, Math.min(1.18, Math.max(width / 1600, height / 900)));

        this.background.setPosition(0, 0);
        if (this.background.setSize) {
            this.background.setSize(width, height);
        }
        this.background.width = width;
        this.background.height = height;
        this.background.setScale(1);
        this.background.setTileScale(tileScale, tileScale);
    }

handleResize(gameSize) {
    if (!gameSize) return;
    
    this.syncOceanBackground();
    this.clampCameraTarget();
    
    // Panel-Positionen bei Orientierungswechsel neu setzen
    this.uiPanelPositions.minimap = undefined;
    this.uiPanelPositions.chat = undefined;
    this.uiPanelPositions.statusFeed = undefined;
    this.uiPanelPositions.upgrade = undefined;
    
    this.updateUIBars();
}

    transitionToChart(targetChartIndex, travelDirection = 'east') {
        if (this.pendingMapTransition) return;
        const clampedTarget = Phaser.Math.Clamp(targetChartIndex, 1, this.maxChartIndex);
        if (clampedTarget === this.currentChartIndex) return;
        if (!this.canAccessChart(clampedTarget)) {
            this.showStatusMsg(`Karte ${clampedTarget} wird ab Level ${clampedTarget} freigeschaltet`, 0xffb36b);
            return;
        }

        const travelRatioY = Phaser.Math.Clamp(this.player ? (this.player.y / this.mapHeight) : 0.5, 0.08, 0.92);
        this.pendingMapTransition = true;
        const sideLabel = travelDirection === 'east' ? 'Osttor' : travelDirection === 'west' ? 'Westtor' : travelDirection;
        this.showStatusMsg(`Wechsel zu Seekarte ${clampedTarget} • ${sideLabel}`, 0x8be7ff);
        this.time.delayedCall(180, () => {
            this.scene.restart({
                chartIndex: clampedTarget,
                entryDirection: this.getOppositeEntryDirection(travelDirection),
                travelRatioY
            });
        });
    }

    handleSeaBorderTravel() {
        if (!this.player || !this.player.active || this.pendingMapTransition) return;
        if (this.time.now < this.chartTravelGraceUntil) return;

        const edgePadding = 26;
        if (this.player.x >= this.mapWidth - edgePadding) {
            this.transitionToChart(this.currentChartIndex + 1, 'east');
            return;
        }
        if (this.player.x <= edgePadding) {
            this.transitionToChart(this.currentChartIndex - 1, 'west');
        }
    }

    createPlayerVisualEffects() {
        this.playerGlowOuter = this.add.circle(this.player.x, this.player.y, 42, 0x4bc8ff, 0.08)
            .setDepth(18)
            .setBlendMode(Phaser.BlendModes.ADD);
        this.playerGlowInner = this.add.circle(this.player.x, this.player.y, 28, 0x94f2ff, 0.14)
            .setDepth(19)
            .setBlendMode(Phaser.BlendModes.ADD);
        this.playerUpgradeRing = this.add.graphics().setDepth(20);
    }

    playUpgradeBurst(type) {
        if (!this.player || !this.player.active) return;
        const accentMap = {
            hull: 0x63d6ff,
            sails: 0x8bffba,
            cannons: 0xffb347,
            cannonSlots: 0xffd36a,
            decks: 0x6ae0d8,
            ammo: 0xc79fff
        };
        const color = accentMap[type] ?? 0xffffff;
        const burst = this.add.circle(this.player.x, this.player.y, 18, color, 0.26)
            .setDepth(30)
            .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
            targets: burst,
            radius: 92,
            alpha: 0,
            duration: 650,
            ease: 'Sine.Out',
            onComplete: () => burst.destroy()
        });
    }

    clampCameraTarget() {
        const cam = this.cameras.main;
        const viewWidth = cam.width / cam.zoom;
        const viewHeight = cam.height / cam.zoom;
        const maxScrollX = Math.max(0, this.mapWidth - viewWidth);
        const maxScrollY = Math.max(0, this.mapHeight - viewHeight);
        this.cameraTargetX = Phaser.Math.Clamp(this.cameraTargetX, 0, maxScrollX);
        this.cameraTargetY = Phaser.Math.Clamp(this.cameraTargetY, 0, maxScrollY);
    }

    getTargetAtWorldPoint(worldX, worldY) {
        const candidates = [
            ...(this.npcGroup ? this.npcGroup.getChildren() : []),
            ...(this.monsterGroup ? this.monsterGroup.getChildren() : [])
        ].filter(entity => entity && entity.active);

        let closestTarget = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        candidates.forEach((entity) => {
            const hitRadius = entity.selectionRadius ?? 64;
            const distance = Phaser.Math.Distance.Between(worldX, worldY, entity.x, entity.y);

            if (distance <= hitRadius && distance < closestDistance) {
                closestTarget = entity;
                closestDistance = distance;
            }
        });

        return closestTarget;
    }

    smoothCenterCameraOnPlayer() {
        if (!this.player || !this.player.active) return;

        if (this.cameraReturnTween) {
            this.cameraReturnTween.stop();
            this.cameraReturnTween = null;
        }

        const cam = this.cameras.main;
        const desiredScroll = {
            x: this.player.x - (cam.width / (2 * cam.zoom)),
            y: this.player.y - (cam.height / (2 * cam.zoom))
        };

        const viewWidth = cam.width / cam.zoom;
        const viewHeight = cam.height / cam.zoom;
        const maxScrollX = Math.max(0, this.mapWidth - viewWidth);
        const maxScrollY = Math.max(0, this.mapHeight - viewHeight);

        desiredScroll.x = Phaser.Math.Clamp(desiredScroll.x, 0, maxScrollX);
        desiredScroll.y = Phaser.Math.Clamp(desiredScroll.y, 0, maxScrollY);

        this.cameraReturnTween = this.tweens.add({
            targets: this,
            cameraTargetX: desiredScroll.x,
            cameraTargetY: desiredScroll.y,
            duration: 450,
            ease: 'Cubic.Out',
            onUpdate: () => {
                this.clampCameraTarget();
            },
            onComplete: () => {
                this.cameraTargetX = desiredScroll.x;
                this.cameraTargetY = desiredScroll.y;
                this.cameraReturnTween = null;
                this.playPlayerReturnHighlight();
            }
        });
    }

    handleReturnToShipPressed() {
        if (!this.player || !this.player.active) return;

        this.isReturnToShipVisible = true;
        this.cameraDragState = null;
        if (this.cameraReturnTween) {
            this.cameraReturnTween.stop();
            this.cameraReturnTween = null;
        }

        const cam = this.cameras.main;
        this.cameraTargetX = this.player.x - (cam.width / (2 * cam.zoom));
        this.cameraTargetY = this.player.y - (cam.height / (2 * cam.zoom));
        this.clampCameraTarget();
        cam.scrollX = this.cameraTargetX;
        cam.scrollY = this.cameraTargetY;
        this.playPlayerReturnHighlight();
        this.showStatusMsg('Camera centered on your ship', 0x8be7ff);
    }

    playPlayerReturnHighlight() {
        if (!this.player || !this.player.active || !this.playerReturnHighlight || !this.playerReturnHighlightBlend) return;

        if (this.playerReturnHighlightTween) {
            this.playerReturnHighlightTween.remove();
            this.playerReturnHighlightTween = null;
        }

        this.playerReturnHighlight.setPosition(this.player.x, this.player.y);
        this.playerReturnHighlight.setAlpha(0.7);
        this.playerReturnHighlight.setScale(0.55);
        this.playerReturnHighlight.setVisible(true);

        this.playerReturnHighlightBlend.setPosition(this.player.x, this.player.y);
        this.playerReturnHighlightBlend.setAlpha(0.45);
        this.playerReturnHighlightBlend.setScale(0.72);
        this.playerReturnHighlightBlend.setVisible(true);

        this.playerReturnHighlightTween = this.tweens.add({
            targets: [this.playerReturnHighlight, this.playerReturnHighlightBlend],
            alpha: 0,
            scale: '+=0.7',
            duration: 650,
            ease: 'Sine.Out',
            onComplete: () => {
                this.playerReturnHighlight.setVisible(false);
                this.playerReturnHighlightBlend.setVisible(false);
                this.playerReturnHighlightTween = null;
            }
        });
    }

    setCameraZoom(zoomValue = this.cameraDefaultZoom) {
        const cam = this.cameras.main;
        cam.setZoom(zoomValue);
        this.cameraDefaultZoom = zoomValue;
        this.cameraTargetX = this.player.x - (cam.width / (2 * cam.zoom));
        this.cameraTargetY = this.player.y - (cam.height / (2 * cam.zoom));
        this.clampCameraTarget();
        cam.scrollX = this.cameraTargetX;
        cam.scrollY = this.cameraTargetY;
    }

    toggleMinimapSize() {
        this.isMinimapMinimized = !this.isMinimapMinimized;
        if (this.minimap) {
            this.minimap.setMinimized(this.isMinimapMinimized);
        }
        if (this.minimapToggleIcon) {
            this.minimapToggleIcon.setText(this.isMinimapMinimized ? '+' : '–');
        }
        this.showStatusMsg(this.isMinimapMinimized ? 'Minimap minimized' : 'Minimap expanded', 0x8be7ff);
        this.updateUIBars();
    }

    toggleStatusFeedSize() {
        if (!this.isStatusFeedVisible) {
            this.isStatusFeedVisible = true;
            this.isStatusFeedMinimized = false;
        } else {
            this.isStatusFeedMinimized = !this.isStatusFeedMinimized;
        }
        if (this.statusFeedToggleIcon) {
            this.statusFeedToggleIcon.setText(this.isStatusFeedVisible && !this.isStatusFeedMinimized ? '–' : '+');
        }
        this.showStatusMsg(this.isStatusFeedVisible && !this.isStatusFeedMinimized ? 'Combat feed expanded' : 'Combat feed minimized', 0x8be7ff);
        this.refreshStatusFeed();
        this.updateUIBars();
    }

    toggleChatSize() {
        if (!this.isChatVisible) {
            this.isChatVisible = true;
            this.isChatMinimized = false;
        } else {
            this.isChatMinimized = !this.isChatMinimized;
        }
        if (this.chatToggleIcon) {
            this.chatToggleIcon.setText(this.isChatVisible && !this.isChatMinimized ? '–' : '+');
        }
        if (!this.isChatVisible || this.isChatMinimized) {
            this.blurChatInput();
        }
        this.refreshChatPanel();
        this.updateUIBars();
        if (this.isChatVisible && !this.isChatMinimized) {
            this.time.delayedCall(40, () => this.focusChatInput());
        }
    }

    toggleSeaGateVisibility() {
        this.isSeaGateVisible = !this.isSeaGateVisible;
        this.showStatusMsg(this.isSeaGateVisible ? 'Sea gate panel expanded' : 'Sea gate panel minimized', 0x8be7ff);
        this.updateUIBars();
    }

    toggleReturnToShipVisibility() {
        this.isReturnToShipVisible = !this.isReturnToShipVisible;
        this.showStatusMsg(this.isReturnToShipVisible ? 'Return-to-ship panel expanded' : 'Return-to-ship panel minimized', 0x8be7ff);
        this.updateUIBars();
    }

    focusChatInput() {
        if (this.chatInputElement && !this.isChatMinimized) {
            this.chatInputElement.focus();
        }
    }

    blurChatInput() {
        if (this.chatInputElement) {
            this.chatInputElement.blur();
        }
    }

    clearChatInput() {
        this.chatInputValue = '';
        if (this.chatInputElement) {
            this.chatInputElement.value = '';
        }
    }

    submitChatCommand() {
        const rawValue = this.chatInputElement ? this.chatInputElement.value : this.chatInputValue;
        this.chatInputValue = rawValue ?? '';
        const commandText = this.chatInputValue.trim();
        if (!commandText) return;
        this.pushChatMessage(`> ${commandText}`, '#dff8ff');
        this.executeAdminCommand(commandText);
        this.clearChatInput();
        this.refreshChatPanel();
        this.updateUIBars();
        this.focusChatInput();
    }

    getSpawnPointAroundPlayer(index, total, minRadius, maxRadius) {
        const angleStep = (Math.PI * 2) / total;

        for (let attempt = 0; attempt < 24; attempt++) {
            const angle = (index % total) * angleStep + Phaser.Math.FloatBetween(-0.12, 0.12);
            const radius = Phaser.Math.Between(minRadius, maxRadius);

            const x = Phaser.Math.Clamp(
                this.playerSpawnX + Math.cos(angle) * radius,
                160,
                this.mapWidth - 160
            );
            const y = Phaser.Math.Clamp(
                this.playerSpawnY + Math.sin(angle) * radius,
                160,
                this.mapHeight - 160
            );

            const overlapsIslandSpawn = this.islandSpawnPoints.some(point => (
                Phaser.Math.Distance.Between(x, y, point.x, point.y) < 240
            ));

            if (!overlapsIslandSpawn) {
                return { x, y };
            }
        }

        return {
            x: Phaser.Math.Clamp(this.playerSpawnX + minRadius, 160, this.mapWidth - 160),
            y: Phaser.Math.Clamp(this.playerSpawnY, 160, this.mapHeight - 160)
        };
    }

    buildIslandSpawnPoints(count, worldWidth, worldHeight) {
        const islandMargin = 380;
        const minPlayerDistance = 520;
        const minIslandDistance = 320;
        this.islandSpawnPoints = [];

        let attempts = 0;
        while (this.islandSpawnPoints.length < count && attempts < count * 40) {
            attempts += 1;

            const x = Phaser.Math.Between(islandMargin, worldWidth - islandMargin);
            const y = Phaser.Math.Between(islandMargin, worldHeight - islandMargin);

            const nearPlayer = Phaser.Math.Distance.Between(x, y, this.playerSpawnX, this.playerSpawnY) < minPlayerDistance;
            const overlapsIslandSpawn = this.islandSpawnPoints.some(point => (
                Phaser.Math.Distance.Between(x, y, point.x, point.y) < minIslandDistance
            ));

            if (nearPlayer || overlapsIslandSpawn) {
                continue;
            }

            this.islandSpawnPoints.push({
                x,
                y,
                texture: this.islandSpawnPoints.length % 2 === 0 ? 'island-atoll' : 'island-reef'
            });
        }
    }

    spawnIslands() {
        if (!this.islands) return;

        this.islands.clear(true, true);

        this.islandSpawnPoints.forEach((point) => {
            const island = new Island(this, point.x, point.y, point.texture);
            this.islands.add(island);
        });
    }

    getNPCClusterCenter(index) {
        const clusterCount = 8;
        const padding = 240;
        const safeDistance = 1100;
        const baseAngle = (index % clusterCount) * ((Math.PI * 2) / clusterCount);
        const angle = baseAngle + Phaser.Math.FloatBetween(-0.22, 0.22);
        const radius = Phaser.Math.Between(safeDistance, 1550);

        return {
            x: Phaser.Math.Clamp(
                this.playerSpawnX + Math.cos(angle) * radius,
                padding,
                this.mapWidth - padding
            ),
            y: Phaser.Math.Clamp(
                this.playerSpawnY + Math.sin(angle) * radius,
                padding,
                this.mapHeight - padding
            )
        };
    }

    getNPCSpawnPoint() {
        const clusterSize = 3;
        const clusterIndex = Math.floor(this.npcSpawnIndex / clusterSize);
        let clusterCenter = this.npcSpawnClusters[clusterIndex];

        if (!clusterCenter) {
            clusterCenter = this.getNPCClusterCenter(clusterIndex);
            this.npcSpawnClusters[clusterIndex] = clusterCenter;
        }

        let spawnPoint = null;
        let attempts = 0;

        while (!spawnPoint && attempts < 30) {
            attempts += 1;
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(80, 240);
            const x = Phaser.Math.Clamp(
                clusterCenter.x + Math.cos(angle) * distance,
                180,
                this.mapWidth - 180
            );
            const y = Phaser.Math.Clamp(
                clusterCenter.y + Math.sin(angle) * distance,
                180,
                this.mapHeight - 180
            );

            const overlapsIslandSpawn = this.islandSpawnPoints.some(point => (
                Phaser.Math.Distance.Between(x, y, point.x, point.y) < 260
            ));

            if (!overlapsIslandSpawn) {
                spawnPoint = { x, y };
            }
        }

        this.npcSpawnIndex += 1;
        return spawnPoint ?? { x: clusterCenter.x, y: clusterCenter.y };
    }

    spawnNPC() {
        const point = this.getNPCSpawnPoint();
        const npc = new NPCShip(this, point.x, point.y);
        this.npcGroup.add(npc);
    }

    spawnMonster() {
        const point = this.getSpawnPointAroundPlayer(this.monsterSpawnIndex++, 10, 600, 1300);
        const monster = new Monster(this, point.x, point.y);
        this.monsterGroup.add(monster);
    }

    spawnGift() {
        const point = this.getSpawnPointAroundPlayer(Phaser.Math.Between(0, 19), 20, 260, 1200);
        const gift = new Gift(this, point.x, point.y);
        this.gifts.add(gift);
    }

    createLootDrop(x, y, options = {}) {
        const scatterDistance = options.scatterDistance ?? 46;
        const dropX = x + Phaser.Math.Between(-scatterDistance, scatterDistance);
        const dropY = y + Phaser.Math.Between(-scatterDistance, scatterDistance);
        const gift = new Gift(this, dropX, dropY, {
            type: options.type,
            goldValue: options.goldValue,
            materialValue: options.materialValue,
            xpValue: options.xpValue,
            hpValue: options.hpValue,
            scale: options.scale,
            dropCategory: 'defeat-loot'
        });
        this.gifts.add(gift);
        return gift;
    }

    spawnLootFromDefeat(defeatedEntity) {
        if (!defeatedEntity) return;

        const isMonster = defeatedEntity instanceof Monster;
        const baseGold = isMonster
            ? Phaser.Math.Between(50, 110)
            : Phaser.Math.Between(30, 80);
        const baseMaterials = isMonster
            ? Phaser.Math.Between(4, 9)
            : Phaser.Math.Between(2, 5);
        const bonusXP = Math.max(10, Math.round(defeatedEntity.xpValue * 0.35));

        this.createLootDrop(defeatedEntity.x, defeatedEntity.y, {
            type: 'gold-bag',
            goldValue: baseGold,
            materialValue: 0,
            xpValue: Math.round(bonusXP * 0.35),
            hpValue: 0,
            scale: 0.082
        });

        this.createLootDrop(defeatedEntity.x, defeatedEntity.y, {
            type: 'gift-chest',
            goldValue: Math.round(baseGold * 0.45),
            materialValue: baseMaterials,
            xpValue: Math.round(bonusXP * 0.65),
            hpValue: Phaser.Math.Between(8, 20),
            scale: 0.082
        });

        if (isMonster || Phaser.Math.Between(0, 100) < 40) {
            this.createLootDrop(defeatedEntity.x, defeatedEntity.y, {
                type: 'xp-orb',
                goldValue: 0,
                materialValue: isMonster ? Phaser.Math.Between(1, 3) : 0,
                xpValue: bonusXP,
                hpValue: 0,
                scale: 0.12
            });
        }
    }

    collectGift(player, gift) {
        player.heal(gift.hpValue);
        player.addXP(gift.xpValue);
        const goldGained = gift.goldValue ?? (gift.xpValue * 2);
        player.gold += goldGained;
        player.materials += gift.materialValue ?? 0;
        this.events.emit('gold-collected', goldGained);

        if (gift.giftType === 'gift-chest') {
            player.addAmmoCharges('flare', Phaser.Math.Between(1, 3));
            player.addAmmoCharges('fire', Phaser.Math.Between(1, 2));
        } else if (gift.giftType === 'xp-orb') {
            player.addAmmoCharges('storm', Phaser.Math.Between(1, 2));
        }

        const rewards = [];
        if ((gift.goldValue ?? 0) > 0) rewards.push(`+${gift.goldValue} gold`);
        if ((gift.materialValue ?? 0) > 0) rewards.push(`+${gift.materialValue} materials`);
        if ((gift.xpValue ?? 0) > 0) rewards.push(`+${gift.xpValue} XP`);
        if ((gift.hpValue ?? 0) > 0) rewards.push(`+${gift.hpValue} HP`);
        if (gift.giftType === 'gift-chest') rewards.push('+ammo');
        if (gift.giftType === 'xp-orb') rewards.push('+storm shot');

        const label = rewards.length > 0
            ? rewards.join(' • ')
            : `${gift.giftType.replace('-', ' ').toUpperCase()} collected`;

        this.showStatusMsg(label, 0x00ff99);
        this.playSound('collect');
        gift.destroy();

        if (gift.dropCategory !== 'defeat-loot') {
            this.time.delayedCall(5000, () => this.spawnGift());
        }
    }

    createUI() {
        this.uiContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(2000);
        this.topUiContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(4000);
        this.uiControls = [];
        this.topMenuButtons = [];
        this.ammoButtons = [];
        this.statusFeedMessages = [];

        const { width, height } = this.scale;

        this.targetIndicatorGlow = this.add.graphics().setVisible(false).setScrollFactor(1).setDepth(1490);
        this.targetIndicator = this.add.graphics().setVisible(false).setScrollFactor(1).setDepth(1500);
        this.targetIndicatorReticle = this.add.graphics().setVisible(false).setScrollFactor(1).setDepth(1510);

        this.goldContainer = this.add.container(16, 8);
        this.goldBg = this.add.graphics();
        this.goldText = this.add.text(48, 12, '0', {
            fontSize: '22px',
            fontFamily: 'Arial',
            fill: '#ffe08d',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.materialText = this.add.text(48, 42, '0 materials', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#b8f0ff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.goldIcon = this.add.image(24, 22, 'gold-bag').setScale(0.038);
        this.materialIcon = this.add.image(24, 50, 'gift-chest').setScale(0.04);
        this.goldContainer.add([this.goldBg, this.goldIcon, this.goldText, this.materialIcon, this.materialText]);
        this.topUiContainer.add(this.goldContainer);

        this.navBar = this.add.container(width / 2, 8);
        this.topUiContainer.add(this.navBar);
        const menuItems = [
            { label: 'Menü', action: 'menu' },
            { label: 'Werft', action: 'shipyard' },
            { label: 'Mission', action: 'missions' },
            { label: 'Bonus', action: 'bonus' },
            { label: 'Geschäft', action: 'shop' },
            { label: 'Events', action: 'events' },
            { label: 'Rang', action: 'rank' },
            { label: 'Board', action: 'board' },
            { label: 'Ausfahrt', action: 'sail' }
        ];

        menuItems.forEach((item) => {
            const button = this.add.container(0, 0);
            const bg = this.add.graphics();
            const glow = this.add.graphics();
            const label = this.add.text(0, 38, item.label, {
                fontSize: '15px',
                fontFamily: 'Arial',
                fill: '#fef5d3',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            const icon = this.add.text(0, 18, item.action === 'shipyard' ? '⚓' : item.action === 'shop' ? '🛒' : item.action === 'board' ? '☷' : item.action === 'sail' ? '⛵' : item.action === 'missions' ? '⇪' : item.action === 'events' ? '★' : item.action === 'rank' ? '♛' : item.action === 'bonus' ? '◎' : '☰', {
                fontSize: '20px',
                fontFamily: 'Arial',
                fill: '#ffd872',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            const hit = this.add.zone(0, 0, 110, 64)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .setData('uiControl', true);
            hit.on('pointerdown', (pointer) => {
                pointer?.event?.stopPropagation?.();
                this.handleMenuAction(item.action);
            });
            button.add([glow, bg, icon, label, hit]);
            this.navBar.add(button);
            this.topMenuButtons.push({ button, bg, glow, label, icon, hit, action: item.action, labelText: item.label });
        });

        this.progressContainer = this.add.container(width - 250, 8);
        this.progressBg = this.add.graphics();
        this.expBarBg = this.add.graphics();
        this.expBarFill = this.add.graphics();
        this.topHpBarBg = this.add.graphics();
        this.topHpBarFill = this.add.graphics();
        this.chartBadgeBg = this.add.graphics();
        this.expLabel = this.add.text(16, 8, 'EXP', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fill: '#8fd8ff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.expValueText = this.add.text(200, 8, '0/0', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0);
        this.hpLabel = this.add.text(16, 36, 'HP', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fill: '#8bffb6',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.hpTopValueText = this.add.text(200, 36, '0/0', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0);
        this.combatStatsText = this.add.text(114, 56, 'DMG 0 • CAN 0 • DECK 0', {
            fontSize: '10px',
            fontFamily: 'Arial',
            fill: '#d9f5ff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0);
        this.chartBadgeText = this.add.text(114, 70, 'CHART 1 • OPEN', {
            fontSize: '10px',
            fontFamily: 'Arial',
            fill: '#fff1bd',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0);
        this.progressContainer.add([
            this.progressBg,
            this.expBarBg,
            this.expBarFill,
            this.topHpBarBg,
            this.topHpBarFill,
            this.chartBadgeBg,
            this.expLabel,
            this.expValueText,
            this.hpLabel,
            this.hpTopValueText,
            this.combatStatsText,
            this.chartBadgeText
        ]);
        this.topUiContainer.add(this.progressContainer);

        this.targetHUD = this.add.container(width / 2, 108).setVisible(false);
        this.targetHUDBack = this.add.graphics();
        this.targetHUDName = this.add.text(0, 8, 'Target', {
            fontSize: '18px',
            fontStyle: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0);
        this.targetHUDDistance = this.add.text(0, 30, '', {
            fontSize: '13px',
            fill: '#8fd8ff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0);
        this.targetHUDHP = this.add.graphics();
        this.leftTargetPanel = this.add.container(18, 118).setVisible(false);
        this.leftTargetPanelBg = this.add.graphics();
        this.leftTargetPanelPulse = this.add.graphics();
        this.leftTargetPanelLabel = this.add.text(14, 10, 'TARGET LOCK', {
            fontSize: '11px',
            fontFamily: 'Arial',
            fill: '#8fd8ff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.leftTargetPanelName = this.add.text(14, 30, 'Enemy Ship', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#fff7dd',
            stroke: '#000000',
            strokeThickness: 4,
            wordWrap: { width: 204 }
        });
        this.leftTargetPanelHPValue = this.add.text(14, 58, '0 / 0', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fill: '#dff8ff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.leftTargetPanelRangeValue = this.add.text(14, 76, 'Range 0 • Locked', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#ffd98e',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.leftTargetPanelHP = this.add.graphics();
        this.leftTargetPanel.add([
            this.leftTargetPanelPulse,
            this.leftTargetPanelBg,
            this.leftTargetPanelLabel,
            this.leftTargetPanelName,
            this.leftTargetPanelHPValue,
            this.leftTargetPanelRangeValue,
            this.leftTargetPanelHP
        ]);
        this.targetWorldInfo = this.add.container(0, 0).setDepth(1700).setVisible(false);
        this.targetWorldInfoBg = this.add.graphics();
        this.targetWorldInfoName = this.add.text(0, -2, 'Enemy Ship', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#fff1bd',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 1);
        this.targetWorldInfoHP = this.add.graphics();
        this.targetWorldInfo.add([this.targetWorldInfoBg, this.targetWorldInfoName, this.targetWorldInfoHP]);
        this.targetHUD.add([this.targetHUDBack, this.targetHUDName, this.targetHUDDistance, this.targetHUDHP]);
        this.add.existing(this.targetWorldInfo);
        this.topUiContainer.add(this.targetHUD);
        this.topUiContainer.add(this.leftTargetPanel);

        this.minimapToggleBtn = this.add.container(width - 56, 86).setScrollFactor(0).setDepth(4305);
        this.minimapDragHandle = this.createPanelDragHandle('minimap', 62, 20, 'MOVE');
        this.minimapToggleBg = this.add.graphics();
        this.minimapToggleIcon = this.add.text(16, 16, '–', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.minimapToggleHit = this.add.zone(-6, -6, 44, 44)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true)
            .setDepth(4306)
            .setScrollFactor(0);
        this.minimapToggleHit.on('pointerdown', (pointer) => {
            pointer?.event?.stopPropagation?.();
            this.toggleMinimapSize();
        });
        this.minimapToggleBtn.add([this.minimapDragHandle.container, this.minimapToggleBg, this.minimapToggleIcon, this.minimapToggleHit]);
        this.topUiContainer.add(this.minimapToggleBtn);

        this.returnToShipBtn = this.add.container(22, height - 146).setScrollFactor(0).setDepth(4250);
        this.returnToShipBg = this.add.graphics();
        this.returnToShipLabel = this.add.text(92, 22, 'RETURN TO', {
            fontSize: '15px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.returnToShipSub = this.add.text(92, 44, 'MY SHIP', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fill: '#ccecff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.returnToShipHit = this.add.zone(-6, -6, 196, 76)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true)
            .setDepth(4251)
            .setScrollFactor(0);
        this.returnToShipHit.on('pointerdown', (pointer) => {
            pointer?.event?.stopPropagation?.();
            this.handleReturnToShipPressed();
        });
        this.returnToShipBtn.add([this.returnToShipBg, this.returnToShipLabel, this.returnToShipSub, this.returnToShipHit]);
        this.topUiContainer.add(this.returnToShipBtn);

        this.seaGateContainer = this.add.container(22, height - 242).setScrollFactor(0).setDepth(4252);
        this.seaGateBg = this.add.graphics();
        this.seaGateTitle = this.add.text(98, 18, 'SEA GATE', {
            fontSize: '15px',
            fontFamily: 'Arial',
            fill: '#fff3c4',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.seaGateLeftBtn = this.add.container(10, 38);
        this.seaGateLeftBg = this.add.graphics();
        this.seaGateLeftLabel = this.add.text(42, 14, '◀ WEST', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#dff8ff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.seaGateLeftBtn.add([this.seaGateLeftBg, this.seaGateLeftLabel]);
        this.seaGateRightBtn = this.add.container(104, 38);
        this.seaGateRightBg = this.add.graphics();
        this.seaGateRightLabel = this.add.text(42, 14, 'EAST ▶', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#dff8ff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.seaGateRightBtn.add([this.seaGateRightBg, this.seaGateRightLabel]);
        this.seaGateHint = this.add.text(98, 72, '', {
            fontSize: '11px',
            fontFamily: 'Arial',
            fill: '#9fdfff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        this.seaGateLeftHit = this.add.zone(10, 38, 84, 28)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true)
            .setDepth(4253)
            .setScrollFactor(0);
        this.seaGateRightHit = this.add.zone(104, 38, 84, 28)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true)
            .setDepth(4253)
            .setScrollFactor(0);
        this.seaGateLeftHit.on('pointerdown', (pointer) => {
            pointer?.event?.stopPropagation?.();
            this.transitionToChart(this.currentChartIndex - 1, 'west');
        });
        this.seaGateRightHit.on('pointerdown', (pointer) => {
            pointer?.event?.stopPropagation?.();
            this.transitionToChart(this.currentChartIndex + 1, 'east');
        });
        this.seaGateContainer.add([
            this.seaGateBg,
            this.seaGateTitle,
            this.seaGateLeftBtn,
            this.seaGateRightBtn,
            this.seaGateHint,
            this.seaGateLeftHit,
            this.seaGateRightHit
        ]);
        this.topUiContainer.add(this.seaGateContainer);

        this.chatPanel = this.add.container(22, height - 500).setScrollFactor(0).setDepth(4210);
        this.chatDragHandle = this.createPanelDragHandle('chat', 70, 20, 'MOVE');
        this.chatBg = this.add.graphics();
        this.chatTitle = this.add.text(12, 8, 'Captain Chat', {
            fontSize: '15px',
            fontFamily: 'Arial',
            fill: '#9fe7ff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.chatToggleBg = this.add.graphics();
        this.chatToggleIcon = this.add.text(224, 16, '+', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.chatToggleHit = this.add.zone(202, -4, 44, 40)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true)
            .setDepth(4211)
            .setScrollFactor(0);
        this.chatToggleHit.on('pointerdown', (pointer) => {
            pointer?.event?.stopPropagation?.();
            this.toggleChatSize();
        });
        this.chatLines = [];
        for (let i = 0; i < 3; i++) {
            const line = this.add.text(12, 34 + (i * 20), '—', {
                fontSize: '12px',
                fontFamily: 'Arial',
                fill: '#dff8ff',
                stroke: '#000000',
                strokeThickness: 3,
                wordWrap: { width: 222 }
            });
            this.chatLines.push(line);
        }
        this.chatInputBg = this.add.graphics();
        this.chatInputHint = this.add.text(12, 144, 'Commands: /gold 500, /mats 20, /xp 100, /heal, /tp, /ammo', {
            fontSize: '11px',
            fontFamily: 'Arial',
            fill: '#b7d8e8',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: 224 }
        });
        this.chatInputDom = this.add.dom(124, 116).createFromHTML(`
            <input
                class="captain-chat-input"
                type="text"
                maxlength="64"
                placeholder="${this.chatInputPlaceholder}"
                autocomplete="off"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                enterkeyhint="send"
                style="width: 208px; height: 32px; border-radius: 8px; border: 1px solid rgba(127, 211, 255, 0.65); background: rgba(7, 19, 28, 0.96); color: #dff8ff; outline: none; padding: 0 10px; font-size: 14px; font-family: Arial, sans-serif; box-sizing: border-box; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);"
            />
        `).setScrollFactor(0).setDepth(4212);
        this.chatInputElement = this.chatInputDom.node.querySelector('input');
        if (this.chatInputElement) {
            this.chatInputElement.addEventListener('input', (event) => {
                this.chatInputValue = event.target.value;
            });
            this.chatInputElement.addEventListener('keydown', (event) => {
                event.stopPropagation();
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.submitChatCommand();
                }
            });
            this.chatInputElement.addEventListener('pointerdown', (event) => {
                event.stopPropagation();
            });
            this.chatInputElement.addEventListener('mousedown', (event) => {
                event.stopPropagation();
            });
            this.chatInputElement.addEventListener('touchstart', (event) => {
                event.stopPropagation();
            }, { passive: true });
            this.chatInputElement.addEventListener('focus', () => {
                this.chatInputDom.setDepth(4605);
            });
            this.chatInputElement.addEventListener('blur', () => {
                this.chatInputDom.setDepth(4212);
            });
        }
        this.chatSendBtn = this.add.container(212, 96);
        this.chatSendBg = this.add.graphics();
        this.chatSendLabel = this.add.text(16, 16, '↵', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.chatSendHit = this.add.zone(0, 0, 32, 32)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true)
            .setDepth(4213)
            .setScrollFactor(0);
        this.chatSendHit.on('pointerdown', (pointer) => {
            pointer?.event?.stopPropagation?.();
            this.submitChatCommand();
        });
        this.chatSendBtn.add([this.chatSendBg, this.chatSendLabel, this.chatSendHit]);
        this.chatPanel.add([
            this.chatBg,
            this.chatDragHandle.container,
            this.chatTitle,
            this.chatToggleBg,
            this.chatToggleIcon,
            this.chatToggleHit,
            ...this.chatLines,
            this.chatInputBg,
            this.chatInputHint,
            this.chatSendBtn
        ]);
        this.topUiContainer.add(this.chatPanel);

        this.statusFeedPanel = this.add.container(22, height - 346).setScrollFactor(0).setDepth(4200);
        this.statusFeedDragHandle = this.createPanelDragHandle('statusFeed', 70, 20, 'MOVE');
        this.statusFeedBg = this.add.graphics();
        this.statusFeedTitle = this.add.text(12, 8, 'Combat Feed', {
            fontSize: '15px',
            fontFamily: 'Arial',
            fill: '#ffe888',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.statusFeedToggleBg = this.add.graphics();
        this.statusFeedToggleIcon = this.add.text(224, 16, '–', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.statusFeedToggleHit = this.add.zone(202, -4, 44, 40)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true)
            .setDepth(4201)
            .setScrollFactor(0);
        this.statusFeedToggleHit.on('pointerdown', (pointer) => {
            pointer?.event?.stopPropagation?.();
            this.toggleStatusFeedSize();
        });
        this.statusFeedLines = [];
        for (let i = 0; i < 4; i++) {
            const line = this.add.text(12, 34 + (i * 20), '—', {
                fontSize: '13px',
                fontFamily: 'Arial',
                fill: '#dff8ff',
                stroke: '#000000',
                strokeThickness: 3
            });
            this.statusFeedLines.push(line);
        }
        this.statusFeedPanel.add([
            this.statusFeedBg,
            this.statusFeedDragHandle.container,
            this.statusFeedTitle,
            this.statusFeedToggleBg,
            this.statusFeedToggleIcon,
            this.statusFeedToggleHit,
            ...this.statusFeedLines
        ]);
        this.topUiContainer.add(this.statusFeedPanel);

        this.panelQuickDock = this.add.container(22, height - 186).setScrollFactor(0).setDepth(4240);
        this.panelQuickDockButtons = [];
        [
            { key: 'nav', label: 'HUD', handler: () => this.handleMenuAction('menu') },
            { key: 'gate', label: 'GATE', handler: () => this.toggleSeaGateVisibility() },
            { key: 'feed', label: 'FEED', handler: () => this.toggleStatusFeedSize() },
            { key: 'chat', label: 'CHAT', handler: () => this.toggleChatSize() },
            { key: 'ship', label: 'SHIP', handler: () => this.toggleReturnToShipVisibility() }
        ].forEach((def, index) => {
            const button = this.add.container(index * 60, 0);
            const bg = this.add.graphics();
            const label = this.add.text(26, 14, def.label, {
                fontSize: '11px',
                fontFamily: 'Arial',
                fill: '#dff8ff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            const hit = this.add.zone(0, 0, 52, 28)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true })
                .setData('uiControl', true)
                .setDepth(4241)
                .setScrollFactor(0);
            hit.on('pointerdown', (pointer) => {
                pointer?.event?.stopPropagation?.();
                def.handler();
            });
            button.add([bg, label, hit]);
            this.panelQuickDock.add(button);
            this.panelQuickDockButtons.push({ ...def, button, bg, label, hit });
        });
        this.topUiContainer.add(this.panelQuickDock);

        this.actionsContainer = this.add.container(width - 210, height - 212).setDepth(5000);
        this.attackBtn = this.add.image(0, 0, 'attack-btn')
            .setScale(0.225)
            .setVisible(false)
            .setDepth(5001);
        this.attackBtnRing = this.add.graphics().setDepth(5000).setVisible(false);
        this.attackBtnHit = this.add.zone(0, 0, 152, 152)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true)
            .setDepth(5200)
            .setVisible(false);
        this.attackBtnHit.disableInteractive();
        this.attackBtnHit.on('pointerdown', (pointer) => {
            pointer?.event?.stopPropagation?.();
            this.handleAttackButtonPressed();
        });
        this.attackLabel = this.add.text(0, 116, 'ATTACK', {
            fontSize: '22px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setVisible(false).setDepth(5001);

        this.harpoonBtn = this.add.image(-164, 10, 'harpoon-btn')
            .setScale(0.225)
            .setVisible(false)
            .setDepth(4200);
        this.harpoonBtnHit = this.add.zone(-164, 10, 144, 144)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true)
            .setDepth(4200)
            .setVisible(false);
        this.harpoonBtnHit.disableInteractive();
        this.harpoonBtn.on('pointerdown', () => {});
        this.harpoonLabel = this.add.text(-164, 112, 'HARPOON', {
            fontSize: '17px',
            fontFamily: 'Arial',
            fill: '#dff7ff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setVisible(false);

        this.cancelAttackText = this.add.text(0, 152, 'Auto attack active on target lock', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fill: '#cfeeff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 340 }
        }).setOrigin(0.5).setVisible(false);

        this.skillBar = this.add.container(-214, 122);
        this.skillButtons = [];
        this.combatSkillDefs.forEach((skillDef, index) => {
            const btn = this.add.container(index * 86, 0);
            const glow = this.add.graphics();
            const bg = this.add.graphics();
            const fill = this.add.graphics();
            const label = this.add.text(34, 18, skillDef.shortLabel, {
                fontSize: '16px',
                fontFamily: 'Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            const name = this.add.text(34, 48, skillDef.name, {
                fontSize: '11px',
                fontFamily: 'Arial',
                fill: '#dff8ff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            const cooldownText = this.add.text(34, 33, '', {
                fontSize: '13px',
                fontFamily: 'Arial',
                fill: '#fff1bd',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            const hit = this.add.zone(0, 0, 68, 68)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true })
                .setData('uiControl', true)
                .setDepth(4200);
            hit.on('pointerdown', (pointer) => {
                pointer?.event?.stopPropagation?.();
                this.activateSkill(skillDef.key);
            });
            btn.add([glow, bg, fill, label, cooldownText, name, hit]);
            this.skillBar.add(btn);
            this.skillButtons.push({ ...skillDef, btn, glow, bg, fill, label, name, cooldownText, hit });
        });

        this.ammoRack = this.add.container(156, -6);
        const ammoDefs = [
            { type: 'cannonball', label: 'IB', fullLabel: 'Iron Ball' },
            { type: 'flare', label: 'LG', fullLabel: 'Leuchtkugel' },
            { type: 'fire', label: 'FG', fullLabel: 'Feuerkugel' },
            { type: 'storm', label: 'SK', fullLabel: 'Sturmkugel' },
            { type: 'chainshot', label: 'CS', fullLabel: 'Chain Shot' },
            { type: 'grapeshot', label: 'GS', fullLabel: 'Grape Shot' }
        ];
        ammoDefs.forEach((ammoDef, index) => {
            const btn = this.add.container(0, index * 82);
            const bg = this.add.graphics();
            const ring = this.add.graphics();
            const label = this.add.text(31, 22, ammoDef.label, {
                fontSize: '17px',
                fontFamily: 'Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            const count = this.add.text(31, 50, '', {
                fontSize: '13px',
                fontFamily: 'Arial',
                fill: '#d7f6ff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            const hit = this.add.zone(0, 0, 62, 70)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true })
                .setData('uiControl', true)
                .setDepth(4200);
            hit.on('pointerdown', (pointer) => {
                pointer?.event?.stopPropagation?.();
                this.setAmmoType(ammoDef.type);
            });
            btn.add([ring, bg, label, count, hit]);
            this.ammoRack.add(btn);
            this.ammoButtons.push({ ...ammoDef, btn, bg, ring, label, count, hit });
        });

        this.actionsContainer.add([
            this.attackBtnRing,
            this.attackBtn,
            this.attackBtnHit,
            this.attackLabel,
            this.cancelAttackText,
            this.skillBar,
            this.ammoRack
        ]);
        this.topUiContainer.add(this.actionsContainer);


        this.upgradePanel = this.add.container(width - 404, 96).setScrollFactor(0).setDepth(4300).setVisible(false);
        this.upgradePanelDragHandle = this.createPanelDragHandle('upgrade', 80, 22, 'MOVE');
        this.upgradePanelBg = this.add.graphics();
        this.upgradePanelTitle = this.add.text(18, 12, 'Dockyard Upgrades', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fill: '#dff8ff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.upgradePanelHint = this.add.text(18, 42, 'Upgrade hull, speed, cannons, slots, decks and ammo.', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fill: '#9fdcff',
            stroke: '#000000',
            strokeThickness: 3,
            wordWrap: { width: 336 }
        });

        this.hullUpgradeBtn = this.createUpgradeCard(18, 82, 'Hull Reinforcement', 'hull', 0x63d6ff);
        this.sailsUpgradeBtn = this.createUpgradeCard(18, 162, 'Sail Engine', 'sails', 0x8bffba);
        this.cannonUpgradeBtn = this.createUpgradeCard(18, 242, 'Cannon Battery', 'cannons', 0xffb347);
        this.cannonSlotsUpgradeBtn = this.createUpgradeCard(18, 322, 'Cannon Slots', 'cannonSlots', 0xffd36a);
        this.deckUpgradeBtn = this.createUpgradeCard(18, 402, 'Deck Capacity', 'decks', 0x6ae0d8);
        this.ammoUpgradeBtn = this.createUpgradeCard(18, 482, 'Ammunition Lab', 'ammo', 0xc79fff);

        this.specialAmmoSection = this.add.container(18, 562);
        this.specialAmmoTitle = this.add.text(0, 0, 'Special Munitions', {
            fontSize: '15px',
            fontFamily: 'Arial',
            fill: '#fef6d2',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.specialAmmoHint = this.add.text(0, 22, 'Unlock tactical salvos for rigging breaks and anti-crew pressure.', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#9fdcff',
            stroke: '#000000',
            strokeThickness: 3,
            wordWrap: { width: 332 }
        });
        this.chainshotUnlockBtn = this.createUpgradeCard(0, 56, 'Chain Shot License', 'ammo-unlock-chainshot', 0x65dfff, 58);
        this.grapeshotUnlockBtn = this.createUpgradeCard(0, 124, 'Grape Shot License', 'ammo-unlock-grapeshot', 0xffc56f, 58);
        this.specialAmmoSection.add([
            this.specialAmmoTitle,
            this.specialAmmoHint,
            this.chainshotUnlockBtn.container,
            this.grapeshotUnlockBtn.container
        ]);

        this.upgradeCloseText = this.add.text(346, 18, '×', {
            fontSize: '26px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.upgradeCloseHit = this.add.zone(330, 4, 36, 32)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true);
        this.upgradeCloseHit.on('pointerdown', (pointer) => {
            pointer?.event?.stopPropagation?.();
            this.toggleUpgradePanel();
        });

        this.upgradePanel.add([
            this.upgradePanelBg,
            this.upgradePanelDragHandle.container,
            this.upgradePanelTitle,
            this.upgradePanelHint,
            this.hullUpgradeBtn.container,
            this.sailsUpgradeBtn.container,
            this.cannonUpgradeBtn.container,
            this.cannonSlotsUpgradeBtn.container,
            this.deckUpgradeBtn.container,
            this.ammoUpgradeBtn.container,
            this.specialAmmoSection,
            this.upgradeCloseText,
            this.upgradeCloseHit
        ]);
        this.topUiContainer.add(this.upgradePanel);

        [
            this.hullUpgradeBtn?.hit, this.sailsUpgradeBtn?.hit,
            this.cannonUpgradeBtn?.hit, this.cannonSlotsUpgradeBtn?.hit,
            this.deckUpgradeBtn?.hit, this.ammoUpgradeBtn?.hit,
            this.chainshotUnlockBtn?.hit, this.grapeshotUnlockBtn?.hit,
            this.upgradeCloseHit
        ].filter(Boolean).forEach(z => z.disableInteractive());

        this.uiControls.push(
            this.minimapToggleHit,
            this.returnToShipHit,
            this.chatToggleHit,
            this.chatSendHit,
            this.statusFeedToggleHit,
            this.attackBtnHit,
            this.hullUpgradeBtn.hit,
            this.sailsUpgradeBtn.hit,
            this.cannonUpgradeBtn.hit,
            this.cannonSlotsUpgradeBtn.hit,
            this.deckUpgradeBtn.hit,
            this.ammoUpgradeBtn.hit,
            this.chainshotUnlockBtn.hit,
            this.grapeshotUnlockBtn.hit,
            this.upgradeCloseHit,
            ...this.topMenuButtons.map(item => item.hit),
            ...this.ammoButtons.map(item => item.hit),
            ...(this.skillButtons?.map(item => item.hit) ?? []),
            ...(this.panelQuickDockButtons?.map(item => item.hit) ?? [])
        );

        this.updateUIBars();
        this.setCameraZoom(this.cameraDefaultZoom);
        this.refreshStatusFeed();
        this.refreshChatPanel();
        this.pushChatMessage('Admin chat ready', '#9fe7ff');
        this.pushChatMessage('/gold 500 • /mats 20 • /xp 100', '#b7d8e8');
        this.pushChatMessage('/heal • /tp • /ammo', '#b7d8e8');
        this.refreshAmmoButtons();
    }

    createUpgradeCard(x, y, title, type, accentColor, cardHeight = 70) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        const glow = this.add.graphics();
        const text = this.add.text(16, 28, '', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            lineSpacing: 4
        });
        const titleText = this.add.text(16, 8, title, {
            fontSize: '15px',
            fontFamily: 'Arial',
            fill: '#fef6d2',
            stroke: '#000000',
            strokeThickness: 3
        });
        const badge = this.add.text(306, 10, 'UP', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#07141f',
            backgroundColor: '#f7cf6c',
            padding: { left: 6, right: 6, top: 2, bottom: 2 }
        }).setOrigin(1, 0);
        const hit = this.add.rectangle(166, cardHeight / 2, 332, cardHeight, 0xffffff, 0.001)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true)
            .setData('upgradeType', type);
        hit.on('pointerdown', (pointer) => {
            pointer?.event?.stopPropagation?.();
            this.buyUpgrade(type);
        });
        container.add([glow, bg, titleText, text, badge, hit]);
        return { container, bg, glow, text, titleText, badge, hit, type, accentColor, cardHeight };
    }

    drawPanel(graphic, width, height, options = {}) {
        const fill = options.fill ?? 0x07141f;
        const fillAlpha = options.fillAlpha ?? 0.92;
        const line = options.line ?? 0x7fd3ff;
        const lineAlpha = options.lineAlpha ?? 0.85;
        const radius = options.radius ?? 12;
        graphic.clear();
        graphic.fillStyle(fill, fillAlpha);
        graphic.lineStyle(options.lineWidth ?? 2, line, lineAlpha);
        graphic.fillRoundedRect(0, 0, width, height, radius);
        graphic.strokeRoundedRect(0, 0, width, height, radius);
    }

    getDefaultPanelPosition(panelKey) {
    const { width, height } = this.scale;
    const isLandscape = width > height;

    const defaults = isLandscape
        ? {
            minimap: { x: width - (this.minimap?.getRenderWidth?.() ?? 220) - 16, y: 110 },
            chat: { x: 24, y: height - (this.isChatMinimized ? 74 : 190) },
            statusFeed: { x: 24, y: 90 },
            upgrade: { x: width - 404, y: 80 }
        }
        : {
            minimap: { x: width - (this.minimap?.getRenderWidth?.() ?? 220) - 20, y: 92 },
            chat: { x: 24, y: this.isChatMinimized ? height - 286 : height - 430 },
            statusFeed: { x: 24, y: this.isStatusFeedMinimized ? height - 238 : height - 346 },
            upgrade: { x: Math.max(8, Math.floor((width - 372) / 2)), y: 8 }
        };

    return defaults[panelKey] ?? { x: 24, y: 24 };
}

    getPanelBounds(panelKey) {
        const { width, height } = this.scale;
        const boundsMap = {
            minimap: {
                width: this.minimap?.getRenderWidth?.() ?? 220,
                height: this.minimap?.getRenderHeight?.() ?? 220
            },
            chat: { width: 248, height: this.isChatMinimized ? 40 : 168 },
            statusFeed: { width: 248, height: this.isStatusFeedMinimized ? 40 : 136 },
            upgrade: { width: Math.min(372, width - 16), height: 760 }
        };
        const panelSize = boundsMap[panelKey] ?? { width: 200, height: 120 };
        return {
            minX: 8,
            minY: 8,
            maxX: Math.max(8, width - panelSize.width - 8),
            maxY: Math.max(8, height - panelSize.height - 8)
        };
    }

    getPanelPosition(panelKey) {
        const saved = this.uiPanelPositions[panelKey];
        const fallback = this.getDefaultPanelPosition(panelKey);
        const bounds = this.getPanelBounds(panelKey);
        return {
            x: Phaser.Math.Clamp(saved?.x ?? fallback.x, bounds.minX, bounds.maxX),
            y: Phaser.Math.Clamp(saved?.y ?? fallback.y, bounds.minY, bounds.maxY)
        };
    }

    setPanelPosition(panelKey, x, y) {
        const bounds = this.getPanelBounds(panelKey);
        this.uiPanelPositions[panelKey] = {
            x: Phaser.Math.Clamp(x, bounds.minX, bounds.maxX),
            y: Phaser.Math.Clamp(y, bounds.minY, bounds.maxY)
        };
    }

    getPanelContainerByKey(panelKey) {
        const map = {
            minimap: this.minimap,
            chat: this.chatPanel,
            statusFeed: this.statusFeedPanel,
            upgrade: this.upgradePanel
        };
        return map[panelKey] ?? null;
    }

    beginPanelDrag(pointer, panelKey, panelContainer) {
        this.panelDragState = {
            panelKey,
            panelContainer,
            startPointerX: pointer.x,
            startPointerY: pointer.y,
            startPanelX: panelContainer.x,
            startPanelY: panelContainer.y
        };
    }

    updatePanelDrag(pointer) {
        if (!this.panelDragState) return;
        const dragX = pointer.x - this.panelDragState.startPointerX;
        const dragY = pointer.y - this.panelDragState.startPointerY;
        this.setPanelPosition(
            this.panelDragState.panelKey,
            this.panelDragState.startPanelX + dragX,
            this.panelDragState.startPanelY + dragY
        );
        this.updateUIBars();
    }

    endPanelDrag() {
        this.panelDragState = null;
    }

    createPanelDragHandle(panelKey, width, height, label = 'DRAG') {
        const container = this.add.container(0, 0);
        const bg = this.add.graphics();
        const text = this.add.text(width / 2, height / 2, label, {
            fontSize: '10px',
            fontFamily: 'Arial',
            fill: '#9fdcff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        const hit = this.add.zone(0, 0, width, height)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
            .setData('uiControl', true)
            .setData('panelDragHandle', true)
            .setData('panelKey', panelKey);
        container.add([bg, text, hit]);
        return { container, bg, text, hit, width, height, panelKey };
    }

    drawPanelDragHandle(handle, active = false) {
        if (!handle?.bg) return;
        handle.bg.clear();
        handle.bg.fillStyle(active ? 0x14354e : 0x0b1a28, 0.92);
        handle.bg.lineStyle(1.5, active ? 0x9fe7ff : 0x4a95bc, 0.95);
        handle.bg.fillRoundedRect(0, 0, handle.width, handle.height, 8);
        handle.bg.strokeRoundedRect(0, 0, handle.width, handle.height, 8);
    }

    handleMenuAction(action) {
        if (action === 'menu') {
            this.isNavBarVisible = !this.isNavBarVisible;
            this.showStatusMsg(this.isNavBarVisible ? 'Navigation menu expanded' : 'Navigation menu minimized', 0xbfe8ff);
            this.updateUIBars();
            return;
        }
        if (action === 'shipyard') {
            if (!this.upgradePanelOpen) this.toggleUpgradePanel();
            else this.showStatusMsg('Dockyard ready for another upgrade pass', 0x8be7ff);
            return;
        }
        if (action === 'shop') {
            if (this.shopPanel) this.shopPanel.toggle();
            return;
        }
        if (action === 'board') {
            this.toggleMinimapSize();
            return;
        }
        if (action === 'sail') {
            this.handleReturnToShipPressed();
            return;
        }
        if (action === 'missions') {
            this.missionPanel?.toggle();
            return;
        }
        if (action === 'bonus') {
            this.bonusPanel?.toggle();
            return;
        }
        if (action === 'events') {
            this.eventsPanel?.toggle();
            return;
        }
        if (action === 'rank') {
            this.rangPanel?.toggle();
            return;
        }
        this.showStatusMsg('Navigation menu ready', 0xbfe8ff);
    }

    updateUIBars() {
        const { width, height } = this.scale;
        const hasCombatTarget = !!(this.selectedTarget && this.selectedTarget.active);
        const shouldShowStatusFeed = this.isStatusFeedVisible || this.autoAttackEnabled || hasCombatTarget;
        const shouldShowChat = this.isChatVisible;
        const shouldShowNavBar = this.isNavBarVisible;
        const shouldShowSeaGate = this.isSeaGateVisible;
        const shouldShowReturnToShip = this.isReturnToShipVisible;

        if (this.minimap) {
            const minimapMargin = 20;
            const toggleGap = 8;
            const toggleSize = 32;
            const minimapDefaultX = width - this.minimap.getRenderWidth() - minimapMargin;
            const minimapPos = this.getPanelPosition('minimap');
            if (!this.uiPanelPositions.minimap) {
                this.setPanelPosition('minimap', minimapDefaultX, 92);
            }
            this.minimap.setPosition(minimapPos.x, minimapPos.y);
            this.minimapToggleBtn.setPosition(minimapPos.x - toggleGap - toggleSize, minimapPos.y);
            this.minimapToggleBtn.setVisible(true);
            this.minimapDragHandle.container.setPosition(-56, 0);
            this.minimapDragHandle.container.setVisible(!this.isMinimapMinimized);
            this.minimapToggleHit.setPosition(-6, -6);
            this.minimapToggleHit.setSize(44, 44);
        }

        const chatPos = this.getPanelPosition('chat');
const statusFeedPos = this.getPanelPosition('statusFeed');
const upgradePos = this.getPanelPosition('upgrade');
const isLandscape = width > height;

this.goldContainer.setPosition(12, 8);

if (isLandscape) {
    this.progressContainer.setPosition(width - 248, 10);

    this.targetHUD.x = 150;
    this.targetHUD.y = 82;

    this.returnToShipBtn.setPosition(24, height - 156);
    this.returnToShipBtn.setVisible(true);
    this.returnToShipHit.setPosition(-6, -6);
    this.returnToShipHit.setSize(196, 76);

    this.chatPanel.setPosition(24, height - (this.isChatMinimized ? 210 : 330));
    this.chatPanel.setPosition(24, height - (this.isChatMinimized ? 210 : 330));
    this.chatPanel.setPosition(24, height - (this.isChatMinimized ? 210 : 330));
    this.chatPanel.setVisible(true);
    this.chatDragHandle.container.setPosition(166, 8);
    this.chatToggleHit.setPosition(202, -4);
    this.chatToggleHit.setSize(44, 40);

    this.statusFeedPanel.setPosition(24, 88);
    this.statusFeedDragHandle.container.setPosition(130, 8);

    this.actionsContainer.setPosition(width - 178, height - 138);

    this.upgradePanel.setPosition(width - 404, 96);
    this.upgradePanelDragHandle.container.setPosition(248, 10);

    this.navBar.setPosition(width / 2, 10);
} else {
    this.progressContainer.setPosition(width - 248, 10);

    this.targetHUD.x = width / 2;
    this.targetHUD.y = 102;

    this.returnToShipBtn.setPosition(24, height - 156);
    this.returnToShipBtn.setVisible(true);
    this.returnToShipHit.setPosition(-6, -6);
    this.returnToShipHit.setSize(196, 76);

    this.chatPanel.setPosition(24, height - 200);
    this.chatPanel.setVisible(true);
    this.chatDragHandle.container.setPosition(166, 8);
    this.chatToggleHit.setPosition(202, -4);
    this.chatToggleHit.setSize(44, 40);

    this.statusFeedPanel.setPosition(statusFeedPos.x, statusFeedPos.y);
    this.statusFeedDragHandle.container.setPosition(130, 8);

    this.actionsContainer.setPosition(width - 192, height - 164);

    this.upgradePanel.setPosition(upgradePos.x, upgradePos.y);
    this.upgradePanelDragHandle.container.setPosition(248, 10);

    this.navBar.setPosition(width / 2, 10);
}
        this.navBar.setVisible(shouldShowNavBar);

        this.goldText.setText(`${this.player.gold}`);
        this.materialText.setText(`${this.player.materials} mats`);

        this.drawPanel(this.goldBg, 196, 78, { fill: 0x2a1b0a, fillAlpha: 0.92, line: 0xd6ad57, lineAlpha: 0.85 });
        this.drawPanel(this.progressBg, 228, 100, { fill: 0x103256, fillAlpha: 0.95, line: 0x69cfff, lineAlpha: 0.95 });
        this.drawPanel(this.returnToShipBg, 192, 68, { fill: 0x0c1b2b, fillAlpha: 0.95, line: 0x7fd3ff, lineAlpha: 0.95, radius: 14 });
        this.drawPanel(this.statusFeedBg, 248, this.isStatusFeedMinimized ? 40 : 136, { fill: 0x06121a, fillAlpha: 0.84, line: 0x4a95bc, lineAlpha: 0.75, radius: 12 });
        this.drawPanel(this.statusFeedToggleBg, 32, 32, { fill: 0x0c1b2b, fillAlpha: 0.92, line: 0x7fd3ff, lineAlpha: 0.95, radius: 8 });
        this.drawPanel(this.minimapToggleBg, 32, 32, { fill: 0x0c1b2b, fillAlpha: 0.92, line: 0x7fd3ff, lineAlpha: 0.95, radius: 8 });
        this.drawPanel(this.targetHUDBack, 360, 74, { fill: 0x000000, fillAlpha: 0.8, line: 0xe0c887, lineAlpha: 0.75, radius: 12 });
        this.drawPanel(this.leftTargetPanelBg, 232, 110, { fill: 0x07131c, fillAlpha: 0.9, line: 0xffd166, lineAlpha: 0.9, radius: 12 });
        this.drawPanel(this.upgradePanelBg, 372, 760, { fill: 0x07141f, fillAlpha: 0.97, line: 0x7fd3ff, lineAlpha: 0.95, radius: 16 });
        this.drawPanel(this.seaGateBg, 196, 90, { fill: 0x0b1723, fillAlpha: 0.94, line: 0x7fd3ff, lineAlpha: 0.9, radius: 14 });

        this.expBarBg.clear();
        this.expBarBg.fillStyle(0x000000, 0.62);
        this.expBarBg.fillRoundedRect(48, 14, 160, 10, 5);
        this.topHpBarBg.clear();
        this.topHpBarBg.fillStyle(0x000000, 0.62);
        this.topHpBarBg.fillRoundedRect(48, 44, 160, 10, 5);

        const xpPercent = Phaser.Math.Clamp(this.player.xp / (100 * this.player.level), 0, 1);
        const hpPercent = Math.max(0, this.player.hp / this.player.maxHP);

        this.expBarFill.clear();
        this.expBarFill.fillStyle(0x4cc7ff, 1);
        this.expBarFill.fillRoundedRect(48, 14, 160 * xpPercent, 10, 5);
        this.topHpBarFill.clear();
        this.topHpBarFill.fillStyle(hpPercent > 0.5 ? 0x45ff85 : hpPercent > 0.25 ? 0xffdc59 : 0xff5f5f, 1);
        this.topHpBarFill.fillRoundedRect(48, 44, 160 * hpPercent, 10, 5);
        this.expValueText.setText(`${Math.floor(this.player.xp)}/${100 * this.player.level}`);
        this.hpTopValueText.setText(`${Math.ceil(this.player.hp)}/${this.player.maxHP}`);
        this.chartBadgeBg.clear();
        this.chartBadgeBg.fillStyle(0x0a1a2a, 0.78);
        this.chartBadgeBg.lineStyle(1, 0xe6cb79, 0.9);
        this.chartBadgeBg.fillRoundedRect(36, 72, 156, 16, 7);
        this.chartBadgeBg.strokeRoundedRect(36, 72, 156, 16, 7);
        if (this.combatStatsText) {
            this.combatStatsText.setText(`DMG ${this.player.getTotalDamagePerShot(this.player.ammoMultiplier ?? 1)} • CAN ${this.player.cannonCount} • DECK ${this.player.deckCount}`);
        }
        if (this.chartBadgeText) {
            const maxOpen = this.getUnlockedChartIndex();
            this.chartBadgeText.setText(`CHART ${this.currentChartIndex} • OPEN ${maxOpen}/${this.maxChartIndex}`);
        }

        this.chatTitle.setText('Captain Chat');
        this.drawPanel(this.chatBg, 248, this.isChatMinimized ? 40 : 168, { fill: 0x07131c, fillAlpha: 0.86, line: 0x4a95bc, lineAlpha: 0.78, radius: 12 });
        this.drawPanelDragHandle(this.chatDragHandle, this.panelDragState?.panelKey === 'chat');
        this.drawPanel(this.chatToggleBg, 32, 32, { fill: 0x0c1b2b, fillAlpha: 0.92, line: 0x7fd3ff, lineAlpha: 0.95, radius: 8 });
        this.chatInputBg.clear();
        this.drawPanel(this.chatSendBg, 32, 32, { fill: 0x0c1b2b, fillAlpha: 0.92, line: 0x7fd3ff, lineAlpha: 0.95, radius: 8 });
        if (shouldShowChat && !this.isChatMinimized) {
            this.chatInputBg.fillStyle(0x091723, 0.9);
            this.chatInputBg.lineStyle(1, 0x37586d, 0.9);
            this.chatInputBg.fillRoundedRect(10, 94, 228, 42, 8);
            this.chatInputBg.strokeRoundedRect(10, 94, 228, 42, 8);
        }
        this.chatTitle.setPosition(12, 8);
        this.chatToggleBg.setPosition(208, 4);
        this.chatToggleIcon.setPosition(224, 20);
        this.chatDragHandle.container.setVisible(shouldShowChat && !this.isChatMinimized);
        if (this.chatInputDom) {
            this.chatInputDom.setPosition(this.chatPanel.x + 124, this.chatPanel.y + 116);
            this.chatInputDom.setVisible(shouldShowChat && !this.isChatMinimized);
        }
        if (this.chatInputElement) {
            this.chatInputElement.value = this.chatInputValue;
            this.chatInputElement.placeholder = this.chatInputPlaceholder;
            this.chatInputElement.disabled = !shouldShowChat || this.isChatMinimized;
        }
        this.chatInputHint.setVisible(shouldShowChat && !this.isChatMinimized);
        this.chatInputHint.setPosition(12, 142);
        this.chatToggleIcon.setText(shouldShowChat && !this.isChatMinimized ? '–' : '+');
        this.chatSendBtn.setVisible(shouldShowChat && !this.isChatMinimized);
        this.chatSendBtn.setPosition(206, 99);
        this.chatSendHit.setPosition(0, 0);
        this.chatSendHit.setSize(32, 32);
        this.chatLines.forEach((line, index) => {
            line.setVisible(shouldShowChat && !this.isChatMinimized);
            line.setPosition(12, 34 + (index * 20));
        });

        this.drawPanelDragHandle(this.statusFeedDragHandle, this.panelDragState?.panelKey === 'statusFeed');
        this.statusFeedTitle.setPosition(12, 8);
        this.statusFeedToggleBg.setPosition(208, 0);
        this.statusFeedToggleIcon.setPosition(224, 16);
        this.statusFeedToggleHit.setPosition(202, -4);
        this.statusFeedToggleHit.setSize(44, 40);
        this.statusFeedPanel.setVisible(shouldShowStatusFeed);
        this.statusFeedDragHandle.container.setVisible(shouldShowStatusFeed && !this.isStatusFeedMinimized);
        this.statusFeedToggleIcon.setText(shouldShowStatusFeed && !this.isStatusFeedMinimized ? '–' : '+');
        this.statusFeedLines.forEach((line, index) => {
            line.setVisible(shouldShowStatusFeed && (!this.isStatusFeedMinimized || index === 0));
            line.setPosition(12, 34 + (index * 20));
        });

        const navPadding = 10;
        const reservedSideSpace = 500;
        const navWidth = Math.max(560, width - reservedSideSpace);
        const buttonWidth = Phaser.Math.Clamp((navWidth / Math.max(1, this.topMenuButtons.length)) - navPadding, 92, 136);
        const totalWidth = (buttonWidth * this.topMenuButtons.length) + (navPadding * (this.topMenuButtons.length - 1));
        let currentX = -totalWidth / 2 + (buttonWidth / 2);

        this.topMenuButtons.forEach((item) => {
            item.button.setPosition(currentX, 0);
            item.hit.setSize(buttonWidth, 70);
            item.bg.clear();
            item.glow.clear();
            const isPrimary = item.action === 'shipyard' || item.action === 'shop';
            const isMenuToggle = item.action === 'menu';
            item.glow.fillStyle(isPrimary ? 0xf6d166 : isMenuToggle ? 0x7fd3ff : 0x4b2f12, isPrimary ? 0.16 : 0.1);
            item.glow.fillRoundedRect(-(buttonWidth / 2) - 1, -1, buttonWidth + 2, 72, 12);
            item.bg.fillStyle(0x1a1411, 0.94);
            item.bg.lineStyle(2, isPrimary ? 0xf0c866 : isMenuToggle ? 0x7fd3ff : 0x8f7853, 0.9);
            item.bg.fillRoundedRect(-(buttonWidth / 2), 0, buttonWidth, 70, 12);
            item.bg.strokeRoundedRect(-(buttonWidth / 2), 0, buttonWidth, 70, 12);
            item.label.setPosition(0, 44);
            item.label.setText(isMenuToggle ? (shouldShowNavBar ? 'HUD –' : 'HUD +') : item.labelText);
            item.icon.setPosition(0, 19);
            item.icon.setText(isMenuToggle ? (shouldShowNavBar ? '▣' : '☰') : item.action === 'shipyard' ? '⚓' : item.action === 'shop' ? '🛒' : item.action === 'board' ? '☷' : item.action === 'sail' ? '⛵' : item.action === 'missions' ? '⇪' : item.action === 'events' ? '★' : item.action === 'rank' ? '♛' : item.action === 'bonus' ? '◎' : '☰');
            currentX += buttonWidth + navPadding;
        });

        this.seaGateContainer.setVisible(shouldShowSeaGate);
        this.panelQuickDock.setPosition(22, height - 164);
        this.panelQuickDockButtons?.forEach((dockButton) => {
            const isActive = dockButton.key === 'nav'
                ? shouldShowNavBar
                : dockButton.key === 'gate'
                    ? shouldShowSeaGate
                    : dockButton.key === 'feed'
                        ? shouldShowStatusFeed && !this.isStatusFeedMinimized
                        : dockButton.key === 'chat'
                            ? shouldShowChat && !this.isChatMinimized
                            : false;
            dockButton.bg.clear();
            dockButton.bg.fillStyle(isActive ? 0x103047 : 0x0b1723, 0.94);
            dockButton.bg.lineStyle(1.5, isActive ? 0x7fd3ff : 0x4a95bc, 0.92);
            dockButton.bg.fillRoundedRect(0, 0, 52, 28, 10);
            dockButton.bg.strokeRoundedRect(0, 0, 52, 28, 10);
            dockButton.label.setColor(isActive ? '#ffffff' : '#dff8ff');
        });

        this.drawPanelDragHandle(this.upgradePanelDragHandle, this.panelDragState?.panelKey === 'upgrade');

        const upgradeCards = [
            this.hullUpgradeBtn,
            this.sailsUpgradeBtn,
            this.cannonUpgradeBtn,
            this.cannonSlotsUpgradeBtn,
            this.deckUpgradeBtn,
            this.ammoUpgradeBtn,
            this.chainshotUnlockBtn,
            this.grapeshotUnlockBtn
        ];
        upgradeCards.forEach((card) => {
            const cardHeight = card.cardHeight ?? 70;
            card.glow.clear();
            card.bg.clear();
            card.glow.fillStyle(card.accentColor, 0.08);
            card.glow.fillRoundedRect(-1, -1, 334, cardHeight + 2, 12);
            card.bg.fillStyle(0x103047, 0.95);
            card.bg.lineStyle(1, card.accentColor, 0.85);
            card.bg.fillRoundedRect(0, 0, 332, cardHeight, 12);
            card.bg.strokeRoundedRect(0, 0, 332, cardHeight, 12);
        });

        this.refreshUpgradeTexts();
        this.refreshActionButtonStates();
        this.refreshAmmoButtons();
        this.refreshSeaGateUI();

        if (this.selectedTarget && this.selectedTarget.active) {
            this.targetHUD.setVisible(true);
            this.leftTargetPanel.setVisible(true);
            const targetLabel = this.selectedTarget instanceof Monster ? 'Sea Monster' : 'Enemy Ship';
            const enemyName = this.selectedTarget.captainName
                || this.selectedTarget.displayName
                || (this.selectedTarget.monsterType ? this.selectedTarget.monsterType.replace('monster-', '').replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : null)
                || targetLabel;
            this.targetHUDName.setText(targetLabel);
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.selectedTarget.x, this.selectedTarget.y);
            this.targetHUDDistance.setText(`HP ${Math.ceil(this.selectedTarget.hp)}/${this.selectedTarget.maxHP} • Range ${Math.round(distance)} • ${this.autoApproachActive ? 'Approaching' : 'Locked'}`);

            this.targetHUDHP.clear();
            this.targetHUDHP.fillStyle(0x000000, 0.84);
            this.targetHUDHP.fillRoundedRect(-156, 52, 312, 12, 6);
            const targetPercent = Math.max(0, this.selectedTarget.hp / this.selectedTarget.maxHP);
            this.targetHUDHP.fillStyle(0xff6c5d, 1);
            this.targetHUDHP.fillRoundedRect(-156, 52, 312 * targetPercent, 12, 6);

            this.leftTargetPanelName.setText(enemyName);
            this.leftTargetPanelHPValue.setText(`HP ${Math.ceil(this.selectedTarget.hp)} / ${this.selectedTarget.maxHP}`);
            this.leftTargetPanelRangeValue.setText(`Range ${Math.round(distance)} • ${this.autoApproachActive ? 'Approaching' : 'Locked'}`);
            this.leftTargetPanelPulse.clear();
            this.leftTargetPanelPulse.lineStyle(2, 0xffd166, 0.34);
            this.leftTargetPanelPulse.strokeRoundedRect(-4, -4, 240, 118, 14);
            this.leftTargetPanelPulse.lineStyle(1, 0xfff4bf, 0.18);
            this.leftTargetPanelPulse.strokeRoundedRect(-8, -8, 248, 126, 16);
            this.leftTargetPanelHP.clear();
            this.leftTargetPanelHP.fillStyle(0x000000, 0.84);
            this.leftTargetPanelHP.fillRoundedRect(14, 92, 204, 10, 5);
            this.leftTargetPanelHP.fillStyle(targetPercent > 0.45 ? 0xff7d6b : 0xff4040, 1);
            this.leftTargetPanelHP.fillRoundedRect(14, 92, 204 * targetPercent, 10, 5);
            this.leftTargetPanelHP.lineStyle(1, 0xfff0bf, 0.4);
            this.leftTargetPanelHP.strokeRoundedRect(14, 92, 204, 10, 5);

            this.targetWorldInfo.setVisible(true);
            this.targetWorldInfo.setPosition(this.selectedTarget.x, this.selectedTarget.y - 72);
            this.targetWorldInfoName.setText(enemyName);
            this.targetWorldInfoBg.clear();
            this.targetWorldInfoBg.fillStyle(0x000000, 0.76);
            this.targetWorldInfoBg.lineStyle(2, 0xffcf52, 0.95);
            this.targetWorldInfoBg.fillRoundedRect(-104, -32, 208, 32, 10);
            this.targetWorldInfoBg.strokeRoundedRect(-104, -32, 208, 32, 10);
            this.targetWorldInfoBg.fillStyle(0xffcf52, 0.18);
            this.targetWorldInfoBg.fillRoundedRect(-100, -28, 200, 6, 3);
            this.targetWorldInfoHP.clear();
            this.targetWorldInfoHP.fillStyle(0x000000, 0.84);
            this.targetWorldInfoHP.fillRoundedRect(-88, 10, 176, 12, 6);
            this.targetWorldInfoHP.fillStyle(targetPercent > 0.45 ? 0xff7d6b : 0xff4040, 1);
            this.targetWorldInfoHP.fillRoundedRect(-88, 10, 176 * targetPercent, 12, 6);
            this.targetWorldInfoHP.lineStyle(1, 0xfff0bf, 0.42);
            this.targetWorldInfoHP.strokeRoundedRect(-88, 10, 176, 12, 6);
        } else {
            this.targetHUD.setVisible(false);
            this.leftTargetPanel?.setVisible(false);
            this.leftTargetPanelPulse?.clear();
            this.targetWorldInfo?.setVisible(false);
        }
    }

    finalizeChartEntryPosition() {
        if (!this.player || !this.player.active) return;
        this.chartTravelGraceUntil = this.time.now + 900;
        this.player.stopMovement();
        this.cameraTargetX = this.player.x - (this.cameras.main.width / (2 * this.cameras.main.zoom));
        this.cameraTargetY = this.player.y - (this.cameras.main.height / (2 * this.cameras.main.zoom));
        this.clampCameraTarget();
        this.cameras.main.scrollX = this.cameraTargetX;
        this.cameras.main.scrollY = this.cameraTargetY;
    }

    selectTarget(npc) {
        if (!npc || !npc.active) return;

        this.selectedTarget = npc;
        this.TargetEnemy = npc;
        this.player?.setCombatFacingTarget(npc);
        this.autoApproachActive = false;
        this.autoAttackMode = 'cannon';
        this.targetIndicator.setVisible(true);
        this.attackBtn?.setVisible(true);
        this.attackLabel?.setVisible(true);
        this.cancelAttackText?.setVisible(true);
        this.activateCannonAttack(true);
    }

    showHealPopup(x, y, amount) {
        const text = this.add.text(x, y, `+${Math.round(amount)}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            fill: '#7fffb0',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 42,
            alpha: 0,
            duration: 900,
            onComplete: () => text.destroy()
        });
    }

    getSelectedAmmoConfig() {
        return this.player.getAmmoConfig(this.currentAmmoType);
    }

    getCannonCombatStats() {
        const ammo = this.getSelectedAmmoConfig();
        const ammoMultiplier = this.player.getAmmoMultiplier(this.currentAmmoType);
        const totalDamagePerShot = this.player.getTotalDamagePerShot(ammoMultiplier);
        return {
            ammo,
            ammoMultiplier,
            totalDamagePerShot,
            range: this.player.cannonRange + ammo.rangeBonus,
            reloadTime: Math.max(520, Math.round(this.player.reloadTime * ammo.reloadMultiplier)),
            damageProfile: {
                minDamage: totalDamagePerShot,
                maxDamage: totalDamagePerShot
            }
        };
    }

    setAmmoType(type, silent = false) {
        if (!this.player) return;

        if (!this.player.isAmmoUnlocked(type)) {
            this.showStatusMsg('This ammunition must be unlocked first', 0xff8c69);
            return;
        }

        if (type !== 'cannonball' && this.player.getAmmoCount(type) <= 0) {
            this.showStatusMsg('That ammunition is empty', 0xff8c69);
            return;
        }

        this.currentAmmoType = type;
        if (this.autoAttackEnabled) {
            this.autoAttackMode = 'cannon';
            this.lastAttackTime = -Number.MAX_SAFE_INTEGER;
        }
        this.player.refreshShipInfoPanel(true);
        this.refreshAmmoButtons();
        this.refreshActionButtonStates();
        if (!silent) {
            const ammoConfig = this.player.getAmmoConfig(type);
            this.showStatusMsg(`Ammo selected: ${ammoConfig.label} • ${ammoConfig.summary}`, 0x8be7ff);
        }
    }

    handleAttackButtonPressed() {
        const target = this.getActiveCombatTarget();
        if (!target || !this.player || !this.player.active) {
            this.showStatusMsg('No target selected', 0xff8c69);
            return;
        }

        this.selectedTarget = target;
        this.TargetEnemy = target;

        if (this.autoAttackEnabled && this.autoAttackMode === 'cannon') {
            this.stopAutoAttack();
            this.showStatusMsg('Cannon attack aborted', 0xbfe8ff);
            return;
        }

        this.activateCannonAttack();
    }

    getActiveCombatTarget() {
        if (this.TargetEnemy && this.TargetEnemy.active) return this.TargetEnemy;
        if (this.selectedTarget && this.selectedTarget.active) return this.selectedTarget;
        return null;
    }

    activateCannonAttack(silent = false) {
        const target = this.getActiveCombatTarget();
        if (!target || !this.player || !this.player.active) {
            if (!silent) {
                this.showStatusMsg('No target selected', 0xff8c69);
            }
            return false;
        }

        this.selectedTarget = target;
        this.TargetEnemy = target;
        this.player.setCombatFacingTarget(target);
        this.autoAttackMode = 'cannon';
        this.autoAttackEnabled = true;
        this.lastAttackTime = -Number.MAX_SAFE_INTEGER;

        const needsApproach = this.beginAutoApproachToCurrentTarget();
        if (!needsApproach) {
            this.attackTarget(false);
        }

        this.refreshActionButtonStates();
        if (!silent) {
            const ammoLabel = this.player.getAmmoConfig(this.currentAmmoType).label;
            this.showStatusMsg(`Cannons engaged • ${ammoLabel}`, 0x7fffd4);
        }
        return true;
    }

    beginAutoApproachToCurrentTarget() {
        const target = this.getActiveCombatTarget();
        if (!target || !this.player || !this.player.active) {
            this.setAutoApproachActive(false);
            return false;
        }

        this.selectedTarget = target;
        this.TargetEnemy = target;

        const range = this.getCannonCombatStats().range;
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);
        const desiredDistance = Math.max(96, range - 16);
        const engageLeeway = 24;

        if (distance > range + engageLeeway) {
            const approachAngle = Phaser.Math.Angle.Between(target.x, target.y, this.player.x, this.player.y);
            const approachX = target.x + Math.cos(approachAngle) * desiredDistance;
            const approachY = target.y + Math.sin(approachAngle) * desiredDistance;
            this.setAutoApproachActive(true);
            this.player.moveTo(approachX, approachY);
            return true;
        }

        this.setAutoApproachActive(false);
        if (this.player.moveTarget) {
            this.player.stopMovement();
        }
        return false;
    }

    stopAutoAttack() {
        this.autoAttackEnabled = false;
        if (this.player?.active) {
            this.player.stopMovement();
            this.player.setCombatFacingTarget(this.TargetEnemy && this.TargetEnemy.active ? this.TargetEnemy : null);
        }
        this.setAutoApproachActive(false);
        this.refreshActionButtonStates();
    }

    setAutoApproachActive(isActive) {
        if (this.autoApproachActive === isActive) return;
        this.autoApproachActive = isActive;
        this.refreshActionButtonStates();
    }

    clearTargetAndAttackState() {
        const shouldStopMovement = this.autoApproachActive;
        this.stopAutoAttack();
        this.player?.setCombatFacingTarget(null);
        this.selectedTarget = null;
        this.TargetEnemy = null;
        if (shouldStopMovement && this.player?.active) {
            this.player.stopMovement();
        }
        this.attackBtn.setVisible(false);
        this.attackLabel.setVisible(false);
        this.cancelAttackText.setVisible(true);
        this.targetIndicatorGlow?.clear();
        this.targetIndicatorGlow?.setVisible(false);
        this.targetIndicator.clear();
        this.targetIndicator.setVisible(false);
        this.targetIndicatorReticle?.clear();
        this.targetIndicatorReticle?.setVisible(false);
        this.refreshActionButtonStates();
    }

    deselectTarget() {
        this.clearTargetAndAttackState();
    }

    refreshSeaGateUI() {
        if (!this.seaGateContainer || !this.player) return;

        const leftTarget = this.currentChartIndex - 1;
        const rightTarget = this.currentChartIndex + 1;
        const leftAvailable = leftTarget >= 1;
        const rightAvailable = rightTarget <= this.maxChartIndex;
        const leftUnlocked = leftAvailable && this.canAccessChart(leftTarget);
        const rightUnlocked = rightAvailable && this.canAccessChart(rightTarget);
        const unlockedCharts = this.getUnlockedChartIndex();

        this.drawPanel(this.seaGateBg, 196, 90, { fill: 0x0b1723, fillAlpha: 0.94, line: 0x7fd3ff, lineAlpha: 0.9, radius: 14 });

        this.seaGateLeftBg.clear();
        this.seaGateLeftBg.fillStyle(leftUnlocked ? 0x103047 : 0x1f2429, 0.95);
        this.seaGateLeftBg.lineStyle(1.5, leftUnlocked ? 0x7fd3ff : 0x6d7278, 0.9);
        this.seaGateLeftBg.fillRoundedRect(0, 0, 84, 28, 10);
        this.seaGateLeftBg.strokeRoundedRect(0, 0, 84, 28, 10);

        this.seaGateRightBg.clear();
        this.seaGateRightBg.fillStyle(rightUnlocked ? 0x103047 : 0x1f2429, 0.95);
        this.seaGateRightBg.lineStyle(1.5, rightUnlocked ? 0x7fd3ff : 0x6d7278, 0.9);
        this.seaGateRightBg.fillRoundedRect(0, 0, 84, 28, 10);
        this.seaGateRightBg.strokeRoundedRect(0, 0, 84, 28, 10);

        const leftLabel = leftAvailable
            ? (leftUnlocked ? `◀ ${leftTarget}` : `◀ ${leftTarget} 🔒`)
            : '◀ —';
        const rightLabel = rightAvailable
            ? (rightUnlocked ? `${rightTarget} ▶` : `🔒 ${rightTarget} ▶`)
            : '— ▶';

        this.seaGateLeftLabel.setText(leftLabel);
        this.seaGateLeftLabel.setColor(leftUnlocked ? '#dff8ff' : '#8e979f');
        this.seaGateRightLabel.setText(rightLabel);
        this.seaGateRightLabel.setColor(rightUnlocked ? '#dff8ff' : '#8e979f');

        const nextLockedLevel = rightAvailable && !rightUnlocked ? this.getChartConfig(rightTarget).requiredLevel : null;
        this.seaGateHint.setText(
            nextLockedLevel
                ? `Aktiv: Karte ${this.currentChartIndex} • Offen bis ${unlockedCharts} • Nächste ab Lvl ${nextLockedLevel}`
                : `Aktiv: Karte ${this.currentChartIndex} • Offen bis ${unlockedCharts}`
        );

        if (this.seaGateLeftHit?.input) this.seaGateLeftHit.input.enabled = leftUnlocked;
        if (this.seaGateRightHit?.input) this.seaGateRightHit.input.enabled = rightUnlocked;
    }

    refreshActionButtonStates() {
        if (!this.cancelAttackText) return;

        const hasTarget = !!(this.TargetEnemy && this.TargetEnemy.active);
        const cannonActive = hasTarget && this.autoAttackEnabled && this.autoAttackMode === 'cannon';
        const ammo = this.player ? this.player.getAmmoConfig(this.currentAmmoType) : null;

        if (this.attackBtn) this.attackBtn.setVisible(hasTarget);
        if (this.attackLabel) {
            this.attackLabel.setVisible(hasTarget);
            this.attackLabel.setText('ATTACK');
        }

        if (this.attackBtnHit) {
            this.attackBtnHit.setVisible(hasTarget);
            if (hasTarget) this.attackBtnHit.setInteractive({ useHandCursor: true });
            else this.attackBtnHit.disableInteractive();
        }

        if (this.harpoonBtn) this.harpoonBtn.setVisible(false);
        if (this.harpoonLabel) this.harpoonLabel.setVisible(false);
        if (this.harpoonBtnHit) {
            this.harpoonBtnHit.setVisible(false);
            this.harpoonBtnHit.disableInteractive();
        }

        if (this.attackBtnRing) {
            this.attackBtnRing.clear();
            if (hasTarget) {
                this.attackBtnRing.setVisible(true);
                this.attackBtnRing.lineStyle(4, cannonActive ? 0x7fffd4 : 0xffffff, cannonActive ? 0.95 : 0.28);
                this.attackBtnRing.strokeCircle(0, 0, 66);
            } else {
                this.attackBtnRing.setVisible(false);
            }
        }

        if (this.attackBtn) {
            this.attackBtn.setAlpha(cannonActive ? 1 : 0.9);
            this.attackBtn.setTint(cannonActive ? 0xbfffe6 : 0xffffff);
        }

        this.cancelAttackText.setVisible(true);
        this.cancelAttackText.setText(
            !hasTarget
                ? 'Tap an enemy to lock target'
                : cannonActive
                    ? (this.autoApproachActive ? `Closing distance • ${ammo?.label ?? 'Ammo'}` : `Cannons firing automatically • ${ammo?.label ?? 'Ammo'}`)
                    : 'Target locked • auto attack ready'
        );
    }

    refreshAmmoButtons() {
        if (!this.ammoButtons || !this.player) return;
        this.ammoButtons.forEach((button) => {
            const config = this.player.getAmmoConfig(button.type);
            const isUnlocked = this.player.isAmmoUnlocked(button.type);
            const isActive = this.currentAmmoType === button.type;
            const ammoCount = this.player.getAmmoDisplayCount(button.type);
            const isEmpty = isUnlocked && button.type !== 'cannonball' && this.player.getAmmoCount(button.type) <= 0;
            button.bg.clear();
            button.ring.clear();
            button.bg.fillStyle(!isUnlocked ? 0x14181d : isEmpty ? 0x18222b : 0x0f2535, isActive ? 0.98 : 0.88);
            button.bg.lineStyle(2, !isUnlocked ? 0x5a6470 : config.uiColor, isActive ? 1 : 0.55);
            button.bg.fillRoundedRect(0, 0, 50, 58, 13);
            button.bg.strokeRoundedRect(0, 0, 50, 58, 13);
            if (isActive) {
                button.ring.fillStyle(config.glowColor, 0.12);
                button.ring.fillRoundedRect(-3, -3, 56, 64, 15);
            }
            button.label.setColor(!isUnlocked ? '#88919c' : isEmpty ? '#9aa8b4' : '#ffffff');
            button.count.setColor(!isUnlocked ? '#6f7782' : isEmpty ? '#768490' : '#d7f6ff');
            button.count.setText(ammoCount);
            button.btn.setAlpha(!isUnlocked ? 0.48 : isEmpty ? 0.62 : 1);
        });
    }

    toggleAutoAttack(mode = 'cannon') {
        if (!this.TargetEnemy || !this.TargetEnemy.active) {
            this.showStatusMsg('No target selected', 0xff8c69);
            return;
        }

        if (this.autoAttackEnabled && this.autoAttackMode === mode) {
            this.stopAutoAttack();
            this.showStatusMsg('Auto fire stopped', 0xbfe8ff);
            return;
        }

        this.player?.setCombatFacingTarget(this.TargetEnemy);
        this.autoAttackMode = mode;
        this.autoAttackEnabled = true;
        this.lastAttackTime = -Number.MAX_SAFE_INTEGER;
        this.refreshActionButtonStates();
        this.showStatusMsg(mode === 'harpoon' ? 'Harpoon auto fire engaged' : 'Cannons engaged until target is sunk', 0x7fffd4);
    }

    getDamageProfile(isHarpoon = false) {
        return this.player.getDamageProfile(isHarpoon);
    }

    toggleUpgradePanel() {
        this.upgradePanelOpen = !this.upgradePanelOpen;
        if (this.upgradePanel) {
            this.upgradePanel.setVisible(this.upgradePanelOpen);
            const panelZones = [
                this.hullUpgradeBtn?.hit, this.sailsUpgradeBtn?.hit,
                this.cannonUpgradeBtn?.hit, this.cannonSlotsUpgradeBtn?.hit,
                this.deckUpgradeBtn?.hit, this.ammoUpgradeBtn?.hit,
                this.chainshotUnlockBtn?.hit, this.grapeshotUnlockBtn?.hit,
                this.upgradeCloseHit
            ].filter(Boolean);
            if (this.upgradePanelOpen) {
                panelZones.forEach(z => z.setInteractive({ useHandCursor: true }));
            } else {
                panelZones.forEach(z => z.disableInteractive());
            }
        }
        this.refreshUpgradeTexts();
    }

    refreshUpgradeTexts() {
        if (!this.player || !this.upgradePanel) return;

        const hullCost = this.player.getUpgradeCost('hull');
        const sailsCost = this.player.getUpgradeCost('sails');
        const cannonCost = this.player.getUpgradeCost('cannons');
        const cannonSlotsCost = this.player.getUpgradeCost('cannonSlots');
        const deckCost = this.player.getUpgradeCost('decks');
        const ammoCost = this.player.getUpgradeCost('ammo');

        if (this.upgradePanelTitle) {
            this.upgradePanelTitle.setText(`Dockyard • Gold ${this.player.gold} • Mats ${this.player.materials} • Rating ${Math.round(this.player.shipRating)}`);
        }
        if (this.upgradePanelHint) {
            this.upgradePanelHint.setText(`Ship HP ${Math.ceil(this.player.hp)}/${this.player.maxHP} • Speed ${this.player.speed} • Cannons ${this.player.cannonCount} • Broadside ${this.player.getTotalDamagePerShot(this.player.ammoMultiplier ?? 1)}`);
        }
        if (this.hullUpgradeBtn?.text) {
            this.hullUpgradeBtn.text.setText(`Lv.${this.player.hullLevel}  +${this.player.hullHpPerLevel} HP per upgrade • HP ${Math.ceil(this.player.hp)}/${this.player.maxHP}\nCost: ${hullCost.gold} gold • ${hullCost.materials} mats`);
        }
        if (this.sailsUpgradeBtn?.text) {
            this.sailsUpgradeBtn.text.setText(`Lv.${this.player.sailLevel}  +${this.player.sailSpeedPerLevel} speed • current speed ${this.player.speed}\nCost: ${sailsCost.gold} gold • ${sailsCost.materials} mats`);
        }
        if (this.cannonUpgradeBtn?.text) {
            this.cannonUpgradeBtn.text.setText(`Lv.${this.player.cannonLevel}  +${this.player.cannonDamagePerLevel} dmg per cannon • reload ${this.player.reloadTime} ms\nCurrent: ${this.player.damagePerCannon} per cannon\nCost: ${cannonCost.gold} gold • ${cannonCost.materials} mats`);
        }
        if (this.cannonSlotsUpgradeBtn?.text) {
            this.cannonSlotsUpgradeBtn.text.setText(`Lv.${this.player.cannonSlotLevel}  +2 cannons per upgrade • current ${this.player.cannonCount}\nBroadside ${this.player.getTotalDamagePerShot(this.player.ammoMultiplier ?? 1)}\nCost: ${cannonSlotsCost.gold} gold • ${cannonSlotsCost.materials} mats`);
        }
        if (this.deckUpgradeBtn?.text) {
            this.deckUpgradeBtn.text.setText(`Lv.${this.player.deckLevel}  +1 deck • bonus x${this.player.deckDamageMultiplier.toFixed(2)}\nBroadside ${this.player.getTotalDamagePerShot(this.player.ammoMultiplier ?? 1)}\nCost: ${deckCost.gold} gold • ${deckCost.materials} mats`);
        }
        if (this.ammoUpgradeBtn?.text) {
            this.ammoUpgradeBtn.text.setText(`Lv.${this.player.ammoTechLevel}  +${this.player.ammoDamagePerLevel} ammo power • +${this.player.ammoRangePerLevel} range\nCurrent range ${this.player.cannonRange}\nCost: ${ammoCost.gold} gold • ${ammoCost.materials} mats`);
        }

        if (this.chainshotUnlockBtn?.text) {
            const chainshotCost = this.player.getSpecialAmmoUnlockCost('chainshot');
            this.chainshotUnlockBtn.text.setText(
                this.player.isAmmoUnlocked('chainshot')
                    ? `Unlocked • ${this.player.getAmmoConfig('chainshot').summary}\nStock: ${this.player.getAmmoCount('chainshot')}`
                    : `${this.player.getAmmoConfig('chainshot').summary}\nUnlock: ${chainshotCost.gold} gold • ${chainshotCost.materials} mats`
            );
        }

        if (this.grapeshotUnlockBtn?.text) {
            const grapeshotCost = this.player.getSpecialAmmoUnlockCost('grapeshot');
            this.grapeshotUnlockBtn.text.setText(
                this.player.isAmmoUnlocked('grapeshot')
                    ? `Unlocked • ${this.player.getAmmoConfig('grapeshot').summary}\nStock: ${this.player.getAmmoCount('grapeshot')}`
                    : `${this.player.getAmmoConfig('grapeshot').summary}\nUnlock: ${grapeshotCost.gold} gold • ${grapeshotCost.materials} mats`
            );
        }
    }

    buyUpgrade(type) {
        const isSpecialAmmoUnlock = type === 'ammo-unlock-chainshot' || type === 'ammo-unlock-grapeshot';
        const unlockType = type === 'ammo-unlock-chainshot'
            ? 'chainshot'
            : type === 'ammo-unlock-grapeshot'
                ? 'grapeshot'
                : null;

        const result = isSpecialAmmoUnlock
            ? this.player.purchaseSpecialAmmoUnlock(unlockType)
            : this.player.purchaseUpgrade(type);

        if (result.success && unlockType && this.currentAmmoType === 'cannonball') {
            this.currentAmmoType = unlockType;
        }

        this.refreshUpgradeTexts();
        this.refreshAmmoButtons();
        this.refreshActionButtonStates();
        this.updateUIBars();

        if (result.success) {
            this.playSound('collect');
            const resultColor = unlockType ? 0x7fffd4 : 0x9bffb0;
            this.showStatusMsg(result.message, resultColor);
            if (result.stats) {
                this.pushStatusFeedMessage(
                    `HP ${Math.ceil(result.stats.hp)}/${result.stats.maxHP} • DMG ${result.stats.totalDamagePerShot} • CAN ${result.stats.cannonCount} • DECK ${result.stats.deckCount}`,
                    '#9bffb0'
                );
            }
        } else {
            this.showStatusMsg(result.message === 'Not enough gold or materials' ? 'Not enough gold' : result.message, 0xff8c69);
        }
    }

    attackTarget(isHarpoon = false) {
        const target = this.getActiveCombatTarget();
        if (!target || !target.active) {
            this.clearTargetAndAttackState();
            return false;
        }

        this.selectedTarget = target;
        this.TargetEnemy = target;

        this.player?.setCombatFacingTarget(target);

        const now = this.time.now;
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);
        let range;
        let reloadTime;
        let damageProfile;
        let ammoConfig = null;
        let resolvedDamage = 0;

        if (isHarpoon) {
            range = this.player.getAttackRange(true);
            reloadTime = this.player.reloadTime;
            damageProfile = this.getDamageProfile(true);
            resolvedDamage = damageProfile.baseDamage;
        } else {
            const cannonStats = this.getCannonCombatStats();
            range = cannonStats.range;
            reloadTime = cannonStats.reloadTime;
            damageProfile = cannonStats.damageProfile;
            ammoConfig = cannonStats.ammo;
            resolvedDamage = cannonStats.totalDamagePerShot;
            this.player.updateDerivedStats(cannonStats.ammoMultiplier);
        }

        const responsiveRangeLeeway = isHarpoon ? 10 : 24;
        if (distance > range + responsiveRangeLeeway) {
            return false;
        }

        if (now < this.lastAttackTime + reloadTime) {
            return false;
        }

        if (!isHarpoon && ammoConfig && !this.player.consumeAmmo(ammoConfig.key)) {
            this.showStatusMsg(`${ammoConfig.label} depleted • switching to Iron Ball`, 0xff8c69);
            this.setAmmoType('cannonball', true);
            this.lastAttackTime = -Number.MAX_SAFE_INTEGER;
            return false;
        }

        this.lastAttackTime = now;
        this.playSound('shoot');
        this.spawnProjectile(target, isHarpoon, ammoConfig);

        const appliedDamage = isHarpoon
            ? Phaser.Math.Between(damageProfile.minDamage, damageProfile.maxDamage)
            : resolvedDamage;
        target.takeDamage(appliedDamage);
        this.events.emit('damage-dealt', appliedDamage);

        if (!target.active || target.hp <= 0) {
            this.clearTargetAndAttackState();
            return true;
        }

        this.time.delayedCall(300, () => {
            if (target && target.active && this.player && this.player.active) {
                const counterDamage = Math.max(12, Math.round((target.maxHP ?? 200) * 0.035));
                this.player.takeDamage(counterDamage);
                this.playSound('hit');
            }
        });
        return true;
    }

    spawnProjectile(target, isHarpoon, ammoConfig = null) {
        if (!target || !target.active) return;

        const facingAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
        const muzzleDistance = isHarpoon ? 20 : 18;
        const spawnX = this.player.x + Math.cos(facingAngle) * muzzleDistance;
        const spawnY = this.player.y + Math.sin(facingAngle) * muzzleDistance;
        const projectile = this.add.image(spawnX, spawnY, isHarpoon ? 'harpoon' : 'cannonball');
        const tint = isHarpoon ? 0xdff9ff : (ammoConfig?.tint ?? 0xffffff);
        const trailColor = isHarpoon ? 0x9beeff : (ammoConfig?.trailColor ?? 0xe9f1ff);
        const impactScale = ammoConfig?.splashScale ?? 0.2;
        projectile.setScale(isHarpoon ? 0.05 : 0.055);
        projectile.setTint(tint);
        projectile.setRotation(facingAngle);
        projectile.setDepth(1200);

        const flare = this.add.circle(spawnX, spawnY, isHarpoon ? 12 : 14, trailColor, 0.22)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(1199);

        this.tweens.add({
            targets: [projectile, flare],
            x: target.x,
            y: target.y,
            duration: isHarpoon ? 180 : 220,
            ease: 'Sine.Out',
            onUpdate: () => {
                flare.alpha = projectile.alpha * 0.7;
            },
            onComplete: () => {
                const effect = this.add.image(projectile.x, projectile.y, isHarpoon ? 'water-splash' : 'explosion');
                effect.setScale(isHarpoon ? 0.22 : impactScale);
                effect.setTint(isHarpoon ? 0xdff9ff : (ammoConfig?.glowColor ?? 0xffffff));
                effect.setBlendMode(isHarpoon ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD);

                if (!isHarpoon && ammoConfig && ammoConfig.key !== 'cannonball') {
                    const aura = this.add.circle(projectile.x, projectile.y, 12, ammoConfig.uiColor, 0.26)
                        .setBlendMode(Phaser.BlendModes.ADD)
                        .setDepth(1201);
                    this.tweens.add({
                        targets: aura,
                        radius: 34,
                        alpha: 0,
                        duration: 280,
                        onComplete: () => aura.destroy()
                    });
                }

                this.time.delayedCall(220, () => effect.destroy());
                flare.destroy();
                projectile.destroy();
            }
        });
    }

    showDamagePopup(x, y, damage) {
        const critLike = damage >= 25;
        const text = this.add.text(x, y, `-${damage}`, {
            fontSize: critLike ? '36px' : '32px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: critLike ? '#ff5b5b' : '#ffd95c',
            stroke: '#000000',
            strokeThickness: 5,
            shadow: {
                offsetX: 0,
                offsetY: 2,
                color: '#000000',
                blur: 8,
                fill: true
            }
        }).setOrigin(0.5).setDepth(1650);

        this.tweens.add({
            targets: text,
            y: y - 62,
            scale: { from: 0.9, to: 1.08 },
            alpha: 0,
            duration: 1100,
            ease: 'Cubic.Out',
            onComplete: () => text.destroy()
        });
    }

    pushStatusFeedMessage(msg, color = '#dff8ff') {
        this.statusFeedMessages.unshift({ msg, color });
        this.statusFeedMessages = this.statusFeedMessages.slice(0, 4);
        this.refreshStatusFeed();
    }

    refreshStatusFeed() {
        if (!this.statusFeedLines) return;
        if (this.statusFeedTitle) {
            this.statusFeedTitle.setText(this.isStatusFeedMinimized ? 'Combat Feed (min)' : 'Combat Feed');
        }
        this.statusFeedLines.forEach((line, index) => {
            const entry = this.statusFeedMessages[index];
            if (!entry) {
                line.setText(this.isStatusFeedMinimized && index === 0 ? 'Use FEED to expand' : '—');
                line.setColor('#7f98a8');
                return;
            }
            line.setText(entry.msg);
            line.setColor(entry.color);
        });
    }

    pushChatMessage(msg, color = '#dff8ff') {
        this.chatMessages.unshift({ msg, color });
        this.chatMessages = this.chatMessages.slice(0, 3);
        this.refreshChatPanel();
    }

    refreshChatPanel() {
        if (!this.chatLines) return;
        if (this.chatInputDom) {
            this.chatInputDom.setVisible(this.isChatVisible && !this.isChatMinimized);
        }
        if (this.chatInputElement) {
            this.chatInputElement.disabled = !this.isChatVisible || this.isChatMinimized;
            this.chatInputElement.value = this.chatInputValue;
            this.chatInputElement.placeholder = this.chatInputPlaceholder;
        }
        this.chatLines.forEach((line, index) => {
            const entry = this.chatMessages[index];
            if (!entry) {
                line.setText(index === 0
                    ? (this.isChatMinimized ? 'Use CHAT to expand' : 'Enter an admin command below')
                    : '—');
                line.setColor('#7f98a8');
                return;
            }
            line.setText(entry.msg);
            line.setColor(entry.color);
        });
    }

    executeAdminCommand(commandText) {
        if (!commandText) return false;
        const [command, rawValue] = commandText.trim().split(/\s+/);
        const value = Number(rawValue);

        if (command === '/gold') {
            const amount = Number.isFinite(value) ? value : 500;
            this.player.gold += amount;
            this.pushChatMessage(`ADMIN: +${amount} gold`, '#9bffb0');
            this.updateUIBars();
            return true;
        }
        if (command === '/mats') {
            const amount = Number.isFinite(value) ? value : 20;
            this.player.materials += amount;
            this.pushChatMessage(`ADMIN: +${amount} mats`, '#9bffb0');
            this.updateUIBars();
            return true;
        }
        if (command === '/xp') {
            const amount = Number.isFinite(value) ? value : 100;
            this.player.addXP(amount);
            this.pushChatMessage(`ADMIN: +${amount} XP`, '#9bffb0');
            this.updateUIBars();
            return true;
        }
        if (command === '/heal') {
            this.player.heal(this.player.maxHP);
            this.pushChatMessage('ADMIN: Ship fully repaired', '#9bffb0');
            this.updateUIBars();
            return true;
        }
        if (command === '/tp') {
            this.handleReturnToShipPressed();
            this.pushChatMessage('ADMIN: Camera returned to ship', '#9bffb0');
            return true;
        }
        if (command === '/ammo') {
            this.player.addAmmoCharges('flare', 20);
            this.player.addAmmoCharges('fire', 20);
            this.player.addAmmoCharges('storm', 20);
            if (this.player.isAmmoUnlocked('chainshot')) this.player.addAmmoCharges('chainshot', 20);
            if (this.player.isAmmoUnlocked('grapeshot')) this.player.addAmmoCharges('grapeshot', 20);
            this.refreshAmmoButtons();
            this.pushChatMessage('ADMIN: Ammo restocked', '#9bffb0');
            return true;
        }

        this.pushChatMessage(`Unknown command: ${commandText}`, '#ff9f9f');
        return false;
    }

    showStatusMsg(msg, color) {
        const { width } = this.scale;
        const text = this.add.text(width / 2, 112, msg, {
            fontSize: '26px',
            fontFamily: 'Arial',
            fill: Phaser.Display.Color.IntegerToColor(color).rgba,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(4600);

        this.pushStatusFeedMessage(msg, Phaser.Display.Color.IntegerToColor(color).rgba);

        this.tweens.add({
            targets: text,
            y: 88,
            alpha: 0,
            duration: 1800,
            onComplete: () => text.destroy()
        });
    }

    setupSounds() {
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.noiseSynth = new Tone.NoiseSynth().toDestination();
    }

    playSound(type) {
        if (!this.soundInitialized) return;
        if (type === 'shoot') {
            this.synth.triggerAttackRelease('C2', '8n');
            this.noiseSynth.triggerAttackRelease('8n');
        } else if (type === 'collect') {
            this.synth.triggerAttackRelease('G4', '16n');
            this.synth.triggerAttackRelease('C5', '16n', '+16n');
        } else if (type === 'hit') {
            this.noiseSynth.triggerAttackRelease('16n');
        }
    }

    updatePlayerVisualEffects(time) {
        if (!this.player || !this.player.active || !this.playerGlowOuter || !this.playerGlowInner || !this.playerUpgradeRing) return;
        const strength = this.player.getUpgradeVisualStrength();
        const pulse = 0.5 + (Math.sin(time * 0.004) * 0.5);
        const auraRadius = 36 + (strength.total * 1.5) + (pulse * 8);
        const ammo = this.player.getAmmoConfig(this.currentAmmoType);

        this.playerGlowOuter.setPosition(this.player.x, this.player.y);
        this.playerGlowInner.setPosition(this.player.x, this.player.y);
        this.playerGlowOuter.setRadius(auraRadius + 6);
        this.playerGlowInner.setRadius(20 + (strength.cannons * 2.2) + (pulse * 4));
        this.playerGlowOuter.setFillStyle(ammo.uiColor, 0.06 + (strength.ammo * 0.01));
        this.playerGlowInner.setFillStyle(0x9bf6ff, 0.1 + (strength.hull * 0.01));

        this.playerUpgradeRing.clear();
        this.playerUpgradeRing.lineStyle(2, ammo.uiColor, 0.65);
        this.playerUpgradeRing.strokeCircle(this.player.x, this.player.y, auraRadius);
        this.playerUpgradeRing.lineStyle(3, 0xcdf6ff, 0.28 + (strength.sails * 0.03));
        this.playerUpgradeRing.strokeCircle(this.player.x, this.player.y, auraRadius - 10);
    }

    update(time, delta) {
        this.player.update();

        if (this.inventoryHit?.input) this.inventoryHit.input.enabled = true;
        if (this.shopHit?.input) this.shopHit.input.enabled = true;
        if (this.mapHit?.input) this.mapHit.input.enabled = true;
        if (this.returnToShipHit?.input) this.returnToShipHit.input.enabled = true;
        if (this.chatToggleHit?.input) this.chatToggleHit.input.enabled = true;
        if (this.chatSendHit?.input) this.chatSendHit.input.enabled = !this.isChatMinimized;
        if (this.statusFeedToggleHit?.input) this.statusFeedToggleHit.input.enabled = true;

        this.updatePlayerVisualEffects(time);

        const activeCombatTarget = this.getActiveCombatTarget();
        if (activeCombatTarget && activeCombatTarget.active) {
            this.selectedTarget = activeCombatTarget;
            this.TargetEnemy = activeCombatTarget;
            this.player?.setCombatFacingTarget(activeCombatTarget);
            const indicatorPulse = 0.5 + (Math.sin(time * 0.008) * 0.5);
            const indicatorRadius = this.targetIndicatorBaseRadius + (indicatorPulse * 8);
            const reticlePulse = 0.5 + (Math.sin(time * 0.012) * 0.5);
            const glowRadius = indicatorRadius + 22 + (reticlePulse * 8);
            const cornerGap = 12;
            const cornerLength = 16 + (reticlePulse * 4);
            const worldLabelWidth = Math.max(120, Math.min(208, activeCombatTarget.displayWidth ?? 120));
            const worldLabelHeight = Math.max(84, Math.min(160, activeCombatTarget.displayHeight ?? 120));

            this.targetIndicatorGlow?.setVisible(true);
            this.targetIndicatorGlow?.clear();
            this.targetIndicatorGlow?.fillStyle(0xffc84d, 0.08);
            this.targetIndicatorGlow?.fillCircle(activeCombatTarget.x, activeCombatTarget.y, glowRadius);
            this.targetIndicatorGlow?.fillStyle(0xff4d4d, 0.05);
            this.targetIndicatorGlow?.fillCircle(activeCombatTarget.x, activeCombatTarget.y, glowRadius + 10);

            this.targetIndicator.setVisible(true);
            this.targetIndicator.clear();
            this.targetIndicator.lineStyle(4, 0xffcf52, 0.95);
            this.targetIndicator.strokeCircle(activeCombatTarget.x, activeCombatTarget.y, indicatorRadius);
            this.targetIndicator.lineStyle(2, 0xff4d4d, 0.9);
            this.targetIndicator.strokeCircle(activeCombatTarget.x, activeCombatTarget.y, indicatorRadius + 10);
            this.targetIndicator.lineStyle(1, 0xffffff, 0.55);
            this.targetIndicator.strokeCircle(activeCombatTarget.x, activeCombatTarget.y, indicatorRadius - 10);

            this.targetIndicatorReticle?.setVisible(true);
            this.targetIndicatorReticle?.clear();
            this.targetIndicatorReticle?.lineStyle(3, 0xffe49a, 0.95);
            this.targetIndicatorReticle?.strokeRoundedRect(
                activeCombatTarget.x - (worldLabelWidth / 2),
                activeCombatTarget.y - (worldLabelHeight / 2),
                worldLabelWidth,
                worldLabelHeight,
                12
            );
            this.targetIndicatorReticle?.lineStyle(2, 0xffd166, 0.95);
            this.targetIndicatorReticle?.beginPath();
            this.targetIndicatorReticle?.moveTo(activeCombatTarget.x - (indicatorRadius + cornerGap + cornerLength), activeCombatTarget.y - (indicatorRadius + cornerGap));
            this.targetIndicatorReticle?.lineTo(activeCombatTarget.x - (indicatorRadius + cornerGap), activeCombatTarget.y - (indicatorRadius + cornerGap));
            this.targetIndicatorReticle?.lineTo(activeCombatTarget.x - (indicatorRadius + cornerGap), activeCombatTarget.y - (indicatorRadius + cornerGap + cornerLength));
            this.targetIndicatorReticle?.moveTo(activeCombatTarget.x + (indicatorRadius + cornerGap + cornerLength), activeCombatTarget.y - (indicatorRadius + cornerGap));
            this.targetIndicatorReticle?.lineTo(activeCombatTarget.x + (indicatorRadius + cornerGap), activeCombatTarget.y - (indicatorRadius + cornerGap));
            this.targetIndicatorReticle?.lineTo(activeCombatTarget.x + (indicatorRadius + cornerGap), activeCombatTarget.y - (indicatorRadius + cornerGap + cornerLength));
            this.targetIndicatorReticle?.moveTo(activeCombatTarget.x - (indicatorRadius + cornerGap + cornerLength), activeCombatTarget.y + (indicatorRadius + cornerGap));
            this.targetIndicatorReticle?.lineTo(activeCombatTarget.x - (indicatorRadius + cornerGap), activeCombatTarget.y + (indicatorRadius + cornerGap));
            this.targetIndicatorReticle?.lineTo(activeCombatTarget.x - (indicatorRadius + cornerGap), activeCombatTarget.y + (indicatorRadius + cornerGap + cornerLength));
            this.targetIndicatorReticle?.moveTo(activeCombatTarget.x + (indicatorRadius + cornerGap + cornerLength), activeCombatTarget.y + (indicatorRadius + cornerGap));
            this.targetIndicatorReticle?.lineTo(activeCombatTarget.x + (indicatorRadius + cornerGap), activeCombatTarget.y + (indicatorRadius + cornerGap));
            this.targetIndicatorReticle?.lineTo(activeCombatTarget.x + (indicatorRadius + cornerGap), activeCombatTarget.y + (indicatorRadius + cornerGap + cornerLength));
            this.targetIndicatorReticle?.strokePath();

            if (this.autoAttackEnabled) {
                const needsApproach = this.beginAutoApproachToCurrentTarget();
                if (!needsApproach) {
                    this.attackTarget(false);
                }
            }
        } else {
            this.targetIndicatorGlow?.clear();
            this.targetIndicatorGlow?.setVisible(false);
            this.targetIndicator.clear();
            this.targetIndicator.setVisible(false);
            this.targetIndicatorReticle?.clear();
            this.targetIndicatorReticle?.setVisible(false);

            if (this.TargetEnemy && !this.TargetEnemy.active) {
                this.clearTargetAndAttackState();
            }
        }

        this.handleSeaBorderTravel();

        const cam = this.cameras.main;
        this.clampCameraTarget();
        cam.scrollX = Phaser.Math.Linear(cam.scrollX, this.cameraTargetX, 0.22);
        cam.scrollY = Phaser.Math.Linear(cam.scrollY, this.cameraTargetY, 0.22);

        if (this.minimap) {
            this.minimap.setDepth(2050);
            this.minimap.setChartInfo(this.currentChartIndex, this.currentChartConfig?.name);
            this.minimap.update(this.player, this.npcGroup, this.monsterGroup, this.gifts, this.islands, this.cameras.main, this.selectedTarget);
        }

        if (this.playerReturnHighlight && this.playerReturnHighlightBlend && this.player && this.player.active) {
            this.playerReturnHighlight.setPosition(this.player.x, this.player.y);
            this.playerReturnHighlightBlend.setPosition(this.player.x, this.player.y);
        }

        this.background.tilePositionX = this.cameras.main.scrollX;
        this.background.tilePositionY = this.cameras.main.scrollY;
        this.syncOceanBackground();

        this.updateUIBars();
    }
}
