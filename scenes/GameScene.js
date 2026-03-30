import PlayerShip from '../entities/PlayerShip.js';
import NPCShip from '../entities/NPCShip.js';
import Gift from '../entities/Gift.js';
import Monster from '../entities/Monster.js';
import Island from '../entities/Island.js';
import Minimap from '../ui/Minimap.js';
import PremiumShopPanel from '../ui/PremiumShopPanel.js';
import GuildPanel from '../ui/GuildPanel.js';
import ShipEventPanel from '../ui/ShipEventPanel.js';
import GuildIsland from '../entities/GuildIsland.js';
import IslandTower from '../entities/IslandTower.js';
import MissionPanel from '../ui/MissionPanel.js';
import BonusPanel from '../ui/BonusPanel.js';
import EventsPanel from '../ui/EventsPanel.js';
import RangPanel from '../ui/RangPanel.js';
import BoardPanel from '../ui/BoardPanel.js';
import CombatPanel from '../ui/CombatPanel.js';
import AmmoBar from '../ui/AmmoBar.js';
import ChartNav from '../ui/ChartNav.js';
import DomNavBar from '../ui/DomNavBar.js';
import ShipDesignPanel from '../ui/ShipDesignPanel.js';
import ChatPanel from '../ui/ChatPanel.js';
import AdminPanel from '../ui/AdminPanel.js';
import TalentPanel from '../ui/TalentPanel.js';
import MultiplayerPanel from '../ui/MultiplayerPanel.js';
import ItemBar from '../ui/ItemBar.js';
import PirateTrialPanel, { PIRATE_TRIALS } from '../ui/PirateTrialPanel.js';
import DailyQuestPanel from '../ui/DailyQuestPanel.js';
import ReputationHUD from '../ui/ReputationHUD.js';
import { apiSave, isLoggedIn } from '../api.js';
import LoginBonusPanel from '../ui/LoginBonusPanel.js';
import AchievementPanel from '../ui/AchievementPanel.js';
import LogbookPanel from '../ui/LogbookPanel.js';
import HafenPanel         from '../ui/HafenPanel.js';
import CannonUpgradePanel from '../ui/CannonUpgradePanel.js';
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
        this.cameraDefaultZoom = 1.0;
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
        this._killStreak = 0;
        this._lastKillTime = 0;
        this._rageModeActive = false;
        this._streakHudEl = null;
        this._merchantActive = false;
        this._wantedLevel = 0;
        this._wantedHudEl = null;
        this._bountyHunterTimer = null;
        this.playerShipBonus = {};
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
        this.load.image('player-ship',         'assets/player_ship_royal_crimson_v1.webp');
        this.load.image('player-ship-neon',    'assets/player_ship_neon_pro.webp');
        this.load.image('player-ship-pro',     'assets/player_ship_pro.webp');
        this.load.image('player-ship-frigate1','assets/player_ship_frigate_1.png');
        this.load.image('player-ship-frigate2','assets/player_ship_frigate_2.png');
        this.load.image('player-ship-frigate3','assets/player_ship_frigate_3.png');
        this.load.image('player-ship-dark-galleon', 'assets/ship_dark_galleon.png');
        this.load.image('player-ship-neon-galleon',  'assets/ship_neon_galleon.png');

        this.load.image('ship-small-1', 'assets/ship_cutter_1.png');
        this.load.image('ship-small-2', 'assets/ship_cutter_2.png');
        this.load.image('ship-small-3', 'assets/ship_cutter_3.png');
        this.load.image('ship-small-4', 'assets/ship_cutter_4.png');
        this.load.image('ship-small-5', 'assets/ship_cutter_5.png');

        this.load.image('ship-medium-1', 'assets/ship_brig_1.png');
        this.load.image('ship-medium-2', 'assets/ship_brig_2.png');
        this.load.image('ship-medium-3', 'assets/ship_brig_3.png');

        this.load.image('ship-large-1', 'assets/ship_manwar_1.png');
        this.load.image('ship-large-2', 'assets/ship_manwar_2.png');

        /* Neon-Klasse Schiffe */
        this.load.image('ship-neon-small-1', 'assets/ship_small_neon_1.webp');
        this.load.image('ship-neon-small-2', 'assets/ship_small_neon_2.webp');
        this.load.image('ship-neon-small-3', 'assets/ship_small_neon_3.webp');
        this.load.image('ship-neon-small-4', 'assets/ship_small_neon_4.webp');
        this.load.image('ship-neon-medium-1', 'assets/ship_medium_neon_1.webp');
        this.load.image('ship-neon-medium-2', 'assets/ship_medium_neon_2.webp');
        this.load.image('ship-neon-medium-3', 'assets/ship_medium_neon_3.webp');
        this.load.image('ship-neon-large-1', 'assets/ship_large_neon_1.webp');
        this.load.image('ship-neon-large-2', 'assets/ship_large_neon_2.webp');

        /* Legendäre KI-generierte Schiffe */
        this.load.image('ship-legend-black-galleon', 'assets/ship_legendary_black_galleon.png');
        this.load.image('ship-legend-golden-manwar',  'assets/ship_legendary_golden_manwar.png');
        this.load.image('ship-legend-ghost-galleon',  'assets/ship_legendary_ghost_galleon.png');

        /* Neue Insel */
        this.load.image('island-temple', 'assets/island_temple_ruins.png');

        /* Goldene Kanonenkugel (Tier 4-5 Bonus) */
        this.load.image('cannonball-golden', 'assets/projectile_golden_cannonball.png');

        this.load.image('monster-kraken', 'assets/monster_kraken_tentacle.webp');
        this.load.image('monster-leviathan', 'assets/monster_leviathan.webp');
        this.load.image('monster-shark', 'assets/monster_giant_shark_pro.webp');
        this.load.image('monster-demon', 'assets/monster_sea_demon_pro.webp');

        this.load.image('ocean-bg',      'assets/gekachelterhintergrund-1.png');
        this.load.image('ocean-deep-bg', 'assets/ocean_deep_tile.png');
        this.load.image('island-atoll',    'assets/island_atoll_pro.webp');
        this.load.image('island-reef',     'assets/island_reef_pro.webp');
        this.load.image('island-tropical', 'assets/island_tropical.png');
        this.load.image('island-volcanic', 'assets/island_volcanic.png');
        this.load.image('island-frozen',   'assets/island_frozen.png');
        this.load.image('island-ruins',    'assets/island_ruins.png');
        this.load.image('island-guild',          'assets/island_guild.png');
        this.load.image('island-guild-fortress', 'assets/island_guild_fortress.png');
        this.load.image('guild-tower',           'assets/guild_tower.png');
        this.load.image('ship-event-ghost',    'assets/ship_event_ghost.png');
        this.load.image('ship-event-flagship', 'assets/ship_event_flagship.png');
        this.load.image('ship-event-galleon',  'assets/ship_event_galleon.png');
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

        /* Seamless ocean: generate via Canvas 2D (each blob drawn at 9 positions → zero visible seams) */
        this.cameras.main.setBackgroundColor(0x0e2d4a);
        this._generateOceanTexture();
        const _bgKey = this.textures.exists('ocean-seamless') ? 'ocean-seamless'
                     : this.textures.exists('ocean-deep-bg')  ? 'ocean-deep-bg' : 'ocean-bg';
        this.background = this.add.tileSprite(0, 0, width + 64, height + 64, _bgKey)
            .setOrigin(0, 0)
            .setDepth(-100)
            .setScrollFactor(0);
        this.syncOceanBackground();

        this.islands = this.add.group({ runChildUpdate: false });
        this.islandTowerGroup = this.add.group({ runChildUpdate: false });
        this.buildIslandSpawnPoints(this.currentChartConfig.islandCount, worldWidth, worldHeight);
        this.spawnIslands();
        this._spawnGuildIsland(worldWidth, worldHeight);

        this.player = new PlayerShip(this, this.playerSpawnX, this.playerSpawnY);
        this._initItemSystem();
        this._initTrialSystem();
        this.createPlayerVisualEffects();
        this._loadProgress();
        this._initPlayerUpgrades();

        /* ── Chart minimum level enforcement ─────────────────
           Entering a new chart immediately levels the player up
           to match the chart index (1 new chart = 1 new level). */
        const chartMinLevel = this.currentChartIndex;
        if (this.player && this.player.level < chartMinLevel) {
            const levelsGained = chartMinLevel - this.player.level;
            this.player.level  = chartMinLevel;
            this.player.maxHP  = 200 + (chartMinLevel - 1) * 28;
            this.player.hp     = this.player.maxHP;
            this.player.gold   = (this.player.gold ?? 0) + levelsGained * 150;
            this.time.delayedCall(600, () => {
                this.showStatusMsg(
                    `🗺️ ${this.currentChartConfig?.name ?? 'Neue Karte'} — ${levelsGained} Level gewonnen → Lvl ${chartMinLevel}!`,
                    0x7fffb0
                );
            });
            this._saveProgress();
        }

        this._initWantedSystem();
        this._logbookAdd('charts_explored', this.currentChartIndex);
        this.time.delayedCall(200, () => {
            this.talentPanel?.applyAllToPlayer();
            this._refreshPlayerInfoHUD();
            this.achievementPanel?.check(this._logbook);
        });

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
            if (this._anyPanelOpen()) {
                this.cameraDragState = null;
                return;
            }

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
        this.minimap = new Minimap(this, width - 238, 92, 220, worldWidth, worldHeight);
        this.minimap.setWorldMetrics(worldWidth, worldHeight);
        this.minimap.setChartInfo(this.currentChartIndex, this.currentChartConfig.displayName ?? this.currentChartConfig.name);
        this.minimap.setMinimized(this.isMinimapMinimized);

        this.input.once('pointerdown', async () => {
            if (!this.soundInitialized) {
                await Tone.start();
                this.soundInitialized = true;
                this.setupSounds();
            }
        });

        this.premiumShopPanel  = new PremiumShopPanel(this);
        this.guildPanel        = new GuildPanel(this);
        this.shipEventPanel    = new ShipEventPanel(this);
        this.missionPanel    = new MissionPanel(this);
        this.bonusPanel      = new BonusPanel(this);
        this.eventsPanel     = new EventsPanel(this);
        this.rangPanel       = new RangPanel(this);
        this.boardPanel      = new BoardPanel(this);
        this.combatPanel     = new CombatPanel(this);
        this.ammoBar         = new AmmoBar(this);
        this.chartNav        = new ChartNav(this);
        this.domNavBar       = new DomNavBar(this);
        this.shipDesignPanel  = new ShipDesignPanel(this);
        this.domChatPanel     = new ChatPanel(this);
        this.adminPanel       = new AdminPanel(this);
        this.talentPanel      = new TalentPanel(this);
        this.multiplayerPanel = new MultiplayerPanel(this);
        this.itemBar          = new ItemBar(this);
        this._updateItemBar();
        this.pirateTrialPanel = new PirateTrialPanel(this);
        this.dailyQuestPanel  = new DailyQuestPanel(this);
        this.reputationHUD    = new ReputationHUD(this);
        this.loginBonusPanel  = new LoginBonusPanel(this);
        this.achievementPanel = new AchievementPanel(this);
        this.logbookPanel     = new LogbookPanel(this);
        this.hafenPanel           = new HafenPanel(this);
        this.cannonUpgradePanel   = new CannonUpgradePanel(this);

        this.navBar.setVisible(false);

        this.scale.on('resize', this.handleResize, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.handleResize, this);
            [this.premiumShopPanel, this.guildPanel, this.shipEventPanel, this.missionPanel, this.bonusPanel,
             this.eventsPanel, this.rangPanel, this.boardPanel, this.combatPanel, this.ammoBar,
             this.chartNav, this.domNavBar, this.shipDesignPanel, this.domChatPanel,
             this.adminPanel, this.talentPanel, this.multiplayerPanel,
             this.itemBar, this.pirateTrialPanel, this.dailyQuestPanel, this.reputationHUD,
             this.loginBonusPanel, this.achievementPanel, this.logbookPanel, this.hafenPanel,
             this.cannonUpgradePanel]
                .forEach(p => p?.destroy());
            this._removeEventDirectionHUD?.();
            this._streakHudEl?.remove();    this._streakHudEl = null;
            this._rageOverlay?.remove();    this._rageOverlay = null;
            this._merchantShopEl?.remove(); this._merchantShopEl = null;
            this._saveIndicatorEl?.remove(); this._saveIndicatorEl = null;
            this._wantedHudEl?.remove();    this._wantedHudEl = null;
            this._bountyHunterTimer?.remove(false); this._bountyHunterTimer = null;
            this._wantedDecayTimer?.remove(false);  this._wantedDecayTimer = null;
            this._merchantCleanup?.();
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
            this._onEnemyKilled(npc);
            if (npc instanceof NPCShip) {
                this._addWanted(npc.npcTier === 3 ? 0.6 : npc.npcTier === 2 ? 0.5 : 0.4);
                this.dailyQuestPanel?.addProgress('npc_kills', 1);
                this._updateTrialProgress('npc_kills', 1);
                this._logbookAdd('npc_kills');
                this.hafenPanel?.trackVertrag?.('npc_kills', 1);
                this._dropRandomItem(npc.x, npc.y, 0.12);
                const repGain = 15 + (npc.chartLevel ?? 1) * 5;
                this.reputationHUD?.addReputation(repGain, 'NPC besiegt');
                this.reputationHUD?.addBounty(Math.round(repGain * 2.5));
                this._addRuf(5 + (npc.npcTier ?? 1) * 3, 'Schiff versenkt');
                this.time.delayedCall(10000, () => this.spawnNPC());
            } else if (npc instanceof Monster) {
                this.dailyQuestPanel?.addProgress('monsters', 1);
                this._updateTrialProgress('monsters', 1);
                this._logbookAdd('monster_kills');
                this.hafenPanel?.trackVertrag?.('monsters', 1);
                this._dropRandomItem(npc.x, npc.y, 0.30);
                const repGain = 40 + (npc.level ?? 1) * 12;
                this.reputationHUD?.addReputation(repGain, 'Monster besiegt');
                this.reputationHUD?.addBounty(Math.round(repGain * 4));
                this._addRuf(20 + (npc.level ?? 1) * 5, 'Monster besiegt');
                this.time.delayedCall(12000, () => this.spawnMonster());
            }
        });
        /* ── Guild tower click (old tiny-button) OR fortress-image tap → start attack ── */
        const _startAttackIfInRange = (island) => {
            if (!this.player?.active) return;
            if (island.capturedBy) {
                this.showStatusMsg('⚑ Insel bereits eingenommen!', 0x88ddff); return;
            }
            const activeTowers = island.towers.filter(t => t.active).length;
            if (activeTowers === 0) {
                this.showStatusMsg('💥 Alle Türme bereits zerstört!', 0x888888); return;
            }
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, island.x, island.y);
            if (dist > 700) {
                this.showStatusMsg('⚓ Näher heranfahren! (Max. 700)', 0xff8844); return;
            }
            this._startGuildTowerCombat(island);
            this.showStatusMsg(`🏰 Gildeninsel angreifen! Türme: ${activeTowers}/6`, 0xffaa44);
        };
        this.events.on('guild-tower-clicked',    ({ island }) => _startAttackIfInRange(island));
        this.events.on('guild-island-attack-tap', ({ island }) => _startAttackIfInRange(island));

        /* ── After conquest: save guild data + auto-reset towers after 90 s ── */
        this.events.on('guild-island-captured', ({ island, guild }) => {
            this._stopGuildTowerCombat();
            try {
                const gData = JSON.parse(localStorage.getItem('ahc_my_guild') || 'null');
                if (gData && gData.name === guild) {
                    gData.ownedIslands = ['current'];
                    gData.battles = (gData.battles ?? 0) + 1;
                    localStorage.setItem('ahc_my_guild', JSON.stringify(gData));
                }
            } catch {}
            this._addRuf?.(120, 'Gildeninsel erobert');
            this.dailyQuestPanel?.addProgress?.('kills', 1);
            this.time.delayedCall(90000, () => {
                if (!island?.scene) return;
                island.resetTowers();
                this.showStatusMsg('🔄 Gildeninsel Türme wiederhergestellt — Insel angreifbar!', 0x88ddff);
            });
        });
        this.events.on('player-died', () => {
            this.showStatusMsg('Ship Sunk!', 0xff0000);
            this.time.delayedCall(2000, () => this.scene.restart({ chartIndex: this.currentChartIndex, entryDirection: 'center', travelRatioY: 0.5 }));
        });
        this.events.on('xp-gain', (amount) => {
            this.updateUIBars();
            if (amount > 0) {
                const xpGain = this._rumActive ? amount * 2 : amount;
                this.dailyQuestPanel?.addProgress('xp_gained', xpGain);
            }
        }, this);
        this.events.on('level-up', (level) => {
            this.updateUIBars();
            this.refreshSeaGateUI();
            this.talentPanel?.addSkillPoint(1);
            const trialMsg = this._checkPirateTrial(level);
            const rewards = this._getLevelUpRewards(level);
            this.domNavBar?.showLevelUp(level, rewards.labels, trialMsg ?? '');
            this._refreshPlayerInfoHUD();
            this._applyLevelUpRewards(level, rewards);
            this._achievementCheck?.();
        });
        this.events.on('player-upgraded', (type) => {
            this.attackInterval = this.player.reloadTime;
            this.player.refreshShipInfoPanel(true);
            this.updateUIBars();
            this.refreshUpgradeTexts();
            this.playUpgradeBurst(type);
            if (this.premiumShopPanel?.isOpen()) this.premiumShopPanel.show();
            this.missionPanel?.trackUpgrade();
        });
        this.events.on('gold-collected', (amount) => {
            this.missionPanel?.trackGold(amount);
            this._logbookAdd('gold_total', amount);
            this.hafenPanel?.trackVertrag?.('gold_collected', amount);
        });
        this.events.on('damage-dealt', (amount) => {
            this.missionPanel?.trackDamage(amount);
            this._logbookAdd('damage_dealt', amount);
        });

        /* ── Combat Button Area — BOS-style: 2×2 grid left, large attack right ── */
        /*   [S1][S2]                  */
        /*   [S3][✕]   [⚔ FEUER]     */
        const _ax = this.scale.width  - 70;   /* large attack: far bottom-right */
        const _ay = this.scale.height - 115;
        const _ar = 52; // radius

        const attackBg = this.add.graphics().setScrollFactor(0).setDepth(1000);
        /* Outer gold ring */
        attackBg.lineStyle(4, 0xd4aa40, 1);
        attackBg.fillStyle(0x5a0808, 1);
        attackBg.fillCircle(_ax, _ay, _ar);
        attackBg.strokeCircle(_ax, _ay, _ar);
        /* Inner highlight rim */
        attackBg.lineStyle(2, 0xffdd66, 0.45);
        attackBg.strokeCircle(_ax, _ay, _ar - 6);

        const attackBtn = this.add.text(_ax, _ay, '⚔\nFEUER',
            { fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#ffdd88',
              stroke: '#5a0000', strokeThickness: 3, align: 'center' }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1001)
         .setInteractive({ useHandCursor: true,
             hitArea: new Phaser.Geom.Circle(0, 0, _ar),
             hitAreaCallback: Phaser.Geom.Circle.Contains });
        attackBtn.on('pointerdown', () => { console.log('attack'); });
        attackBtn.on('pointerover',  () => { attackBg.clear();
            attackBg.lineStyle(4, 0xffdd66, 1); attackBg.fillStyle(0x8b1010, 1);
            attackBg.fillCircle(_ax, _ay, _ar); attackBg.strokeCircle(_ax, _ay, _ar);
            attackBg.lineStyle(2, 0xffdd66, 0.6); attackBg.strokeCircle(_ax, _ay, _ar - 6); });
        attackBtn.on('pointerout',   () => { attackBg.clear();
            attackBg.lineStyle(4, 0xd4aa40, 1); attackBg.fillStyle(0x5a0808, 1);
            attackBg.fillCircle(_ax, _ay, _ar); attackBg.strokeCircle(_ax, _ay, _ar);
            attackBg.lineStyle(2, 0xffdd66, 0.45); attackBg.strokeCircle(_ax, _ay, _ar - 6); });

        /* 2×2 grid — left of Attack button
           Col A: _ax - 165   Col B: _ax - 95
           Row 1: _ay - 80    Row 2: _ay - 10      */
        const _ga = _ax - 165;  /* grid col A */
        const _gb = _ax - 95;   /* grid col B */
        const _gr1 = _ay - 80;  /* grid row 1 */
        const _gr2 = _ay - 10;  /* grid row 2 */

        /* Skill Buttons — row 1 (S1, S2) + S3 bottom-left */
        const _skillDefs = [
            { lbl: '💡 S1', x: _ga, y: _gr1 },
            { lbl: '🌀 S2', x: _gb, y: _gr1 },
            { lbl: '🔥 S3', x: _ga, y: _gr2 },
        ];
        _skillDefs.forEach(({ lbl, x, y }) => {
            const sb = this.add.text(x, y, lbl,
                { fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#ffffff',
                  backgroundColor: '#1a3a6a', padding: { x: 12, y: 8 } }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setInteractive({ useHandCursor: true });
            sb.on('pointerdown', () => { console.log('skill'); });
        });

        /* Cancel Button — bottom-right slot of the 2×2 grid */
        const cancelBtn = this.add.text(_gb, _gr2, '✕ Cancel',
            { fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#ffffff',
              backgroundColor: '#333333', padding: { x: 14, y: 7 } }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setInteractive({ useHandCursor: true });
        cancelBtn.on('pointerdown', () => { console.log('cancel'); });

        this.finalizeChartEntryPosition();

        this.events.on('shutdown', () => {
            this._saveProgress();
            this._guildAttackBtnEl?.remove(); this._guildAttackBtnEl = null;
            this._stopGuildTowerCombat?.();
        });
        const _saveFn = () => this._saveProgress();
        window.addEventListener('beforeunload', _saveFn);
        window.addEventListener('pagehide', _saveFn);
        window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this._saveProgress(); });
        this.events.once('destroy', () => {
            window.removeEventListener('beforeunload', _saveFn);
            window.removeEventListener('pagehide', _saveFn);
        });
    }

    _saveProgress() {
        if (!this.player?.active) return;
        const p = this.player;
        const key = `ahc_save_${window._loginUsername ?? 'player'}`;
        this._showSaveIndicator();
        try {
            const data = {
                gold:          p.gold          ?? 0,
                gems:          p.gems          ?? 0,
                materials:     p.materials     ?? 0,
                level:         p.stats?.level  ?? p.level ?? 1,
                xp:            p.xp            ?? 0,
                hpFraction:    Phaser.Math.Clamp((p.hp ?? p.maxHP) / (p.maxHP || 1), 0, 1),
                ammo:          { ...(p.ammo ?? {}) },
                inventory:     { ...(p.inventory ?? {}) },
                goldDeckSlots: p.goldDeckSlots  ?? 3,
                pearlDeckSlots:p.pearlDeckSlots ?? 3,
                mojoDeck:      p.mojoDeck       ?? false,
                cannonSlotCount: p.cannonSlotCount ?? 8,
                voodooPoints:  p.voodooPoints   ?? 0,
                pvpMode:       p.pvpMode        ?? false,
                selectedShip:  p._selectedShipKey ?? null,
                chartIndex:    this.currentChartIndex ?? 1,
                logbook:       this._logbook ? { ...this._logbook, charts_explored: [...(this._logbook.charts_explored ?? [])] } : {},
                ruf:           this._ruf ?? 0,
                savedAt:       Date.now()
            };
            localStorage.setItem(key, JSON.stringify(data));

            if (isLoggedIn()) {
                const u = window._loginUsername ?? 'player';
                const shipData   = (() => { try { return JSON.parse(localStorage.getItem(`ahc_ship_${u}`)        || '{}'); } catch { return {}; } })();
                const upgrades   = (() => { try { return JSON.parse(localStorage.getItem(`ahc_upgrades_${u}`)    || '{}'); } catch { return {}; } })();
                const trialData  = (() => { try { return JSON.parse(localStorage.getItem(`ahc_trials_${u}`)      || '{}'); } catch { return {}; } })();
                const achievements = (() => { try { return JSON.parse(localStorage.getItem(`ahc_achievements_${u}`) || '{}'); } catch { return {}; } })();
                const loginStreak  = (() => { try { return JSON.parse(localStorage.getItem(`ahc_login_streak_${u}`)  || '{}'); } catch { return {}; } })();
                const guildData    = (() => { try { return JSON.parse(localStorage.getItem('ahc_my_guild')            || '{}'); } catch { return {}; } })();
                const cannonTier   = parseInt(localStorage.getItem(`ahc_cannon_tier_${u}`) || '0', 10);
                apiSave({ gameData: data, shipData, upgrades, trialData, achievements, loginStreak, guildData, cannonTier });
            }
        } catch (e) {}
    }

    _loadProgress() {
        if (!this.player) return;
        const p = this.player;
        const u = window._loginUsername ?? 'player';
        const key = `ahc_save_${u}`;
        try {
            let d = null;
            const localRaw = localStorage.getItem(key);
            const localData = localRaw ? JSON.parse(localRaw) : null;
            const srvData = window._serverSaveData;

            if (srvData?.game_data && Object.keys(srvData.game_data).length > 0) {
                const srvSavedAt   = srvData.game_data.savedAt ?? 0;
                const localSavedAt = localData?.savedAt ?? 0;
                if (srvSavedAt >= localSavedAt) {
                    d = srvData.game_data;
                    localStorage.setItem(key, JSON.stringify(d));
                    if (srvData.ship_data && srvData.ship_data.key) {
                        localStorage.setItem(`ahc_ship_${u}`, JSON.stringify(srvData.ship_data));
                    }
                    if (srvData.upgrades && Object.keys(srvData.upgrades).length > 0) {
                        localStorage.setItem(`ahc_upgrades_${u}`, JSON.stringify(srvData.upgrades));
                    }
                    if (srvData.trial_data && Object.keys(srvData.trial_data).length > 0) {
                        localStorage.setItem(`ahc_trials_${u}`, JSON.stringify(srvData.trial_data));
                    }
                    if (srvData.achievements && Object.keys(srvData.achievements).length > 0) {
                        localStorage.setItem(`ahc_achievements_${u}`, JSON.stringify(srvData.achievements));
                    }
                    if (srvData.login_streak && Object.keys(srvData.login_streak).length > 0) {
                        localStorage.setItem(`ahc_login_streak_${u}`, JSON.stringify(srvData.login_streak));
                    }
                    if (srvData.guild_data && Object.keys(srvData.guild_data).length > 0) {
                        localStorage.setItem('ahc_my_guild', JSON.stringify(srvData.guild_data));
                    }
                    if (srvData.cannon_tier > 0) {
                        localStorage.setItem(`ahc_cannon_tier_${u}`, String(srvData.cannon_tier));
                    }
                } else {
                    d = localData;
                }
            } else {
                d = localData;
            }
            window._serverSaveData = null;
            if (!d) return;
            if (d.gold          !== undefined) p.gold           = d.gold;
            if (d.gems          !== undefined) p.gems           = d.gems;
            if (d.materials     !== undefined) p.materials      = d.materials;
            if (d.level         !== undefined) { p.level = d.level; if (p.stats) p.stats.level = d.level; }
            if (d.xp            !== undefined) p.xp             = d.xp;
            if (d.hpFraction    !== undefined) p.hp             = Math.round((p.maxHP ?? 200) * d.hpFraction);
            if (d.ammo          !== undefined) p.ammo           = { ...p.ammo, ...d.ammo };
            if (d.goldDeckSlots !== undefined) p.goldDeckSlots  = d.goldDeckSlots;
            if (d.pearlDeckSlots!== undefined) p.pearlDeckSlots = d.pearlDeckSlots;
            if (d.mojoDeck      !== undefined) p.mojoDeck       = d.mojoDeck;
            if (d.cannonSlotCount!==undefined) p.cannonSlotCount= d.cannonSlotCount;
            if (d.voodooPoints  !== undefined) p.voodooPoints   = d.voodooPoints;
            if (d.pvpMode       !== undefined) p.pvpMode        = d.pvpMode;
            if (d.selectedShip  !== undefined) p._selectedShipKey = d.selectedShip;
            if (d.inventory     !== undefined) p.inventory      = { ...p.inventory, ...d.inventory };
            if (d.logbook       !== undefined) {
                this._logbook = { ...this._logbook, ...d.logbook };
                if (Array.isArray(d.logbook.charts_explored)) {
                    this._logbook.charts_explored = new Set(d.logbook.charts_explored);
                }
            }
            if (d.ruf           !== undefined) this._ruf = d.ruf;
            p.updateHealthBar?.();
            p.refreshShipInfoPanel?.(true);
            this._updateItemBar?.();
            /* Restore selected ship design */
            try {
                const shipSave = JSON.parse(localStorage.getItem(`ahc_ship_${window._loginUsername ?? 'player'}`) || 'null');
                if (shipSave?.key && this.textures.exists(shipSave.key)) {
                    /* Clamp old inflated scales (>0.105) to new balanced class defaults */
                    const CLASS_SCALE = { Kutter:0.068, Brigantine:0.080, Fregatte:0.082, Linienschiff:0.100, Galeone:0.092 };
                    const rawSc = shipSave.scale ?? 0.082;
                    const scale = rawSc > 0.105 ? (CLASS_SCALE[shipSave.cls] ?? 0.082) : rawSc;
                    p.sprite?.setTexture(shipSave.key);
                    p.sprite?.setScale(scale);
                    this.playerShipDesign = shipSave.key;
                    this.playerShipClass  = shipSave.cls ?? 'Fregatte';
                    this.playerShipScale  = scale;
                    this.playerShipBonus  = shipSave.bonus ?? {};
                }
            } catch {}
            this.showStatusMsg(`⚓ Spielstand geladen (Lvl ${d.level ?? 1})`, 0x63d6ff);
        } catch (e) {}
    }

    _showSaveIndicator() {
        if (this._saveIndicatorEl) return;
        const el = document.createElement('div');
        el.style.cssText = `
            position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
            z-index:20000;background:rgba(10,30,60,0.88);
            border:1px solid rgba(74,200,255,0.5);border-radius:8px;
            padding:5px 14px;font-size:11px;color:#9fdcff;
            font-family:Arial,sans-serif;letter-spacing:1.5px;
            pointer-events:none;display:flex;align-items:center;gap:6px;
            animation:fadeIn 0.3s ease;
        `;
        el.textContent = '💾 Gespeichert';
        document.body.appendChild(el);
        this._saveIndicatorEl = el;
        setTimeout(() => {
            el.style.transition = 'opacity 0.5s';
            el.style.opacity = '0';
            setTimeout(() => { el?.remove(); this._saveIndicatorEl = null; }, 520);
        }, 1800);
    }

    /* ═══════════════════ LEVEL-UP REWARDS ═══════════════════ */

    _getLevelUpRewards(level) {
        const hpBonus = 22 + Math.floor(level / 4) * 6;
        const labels = [`Max HP +${hpBonus}`, '+1 Skillpunkt'];
        const items  = {};
        let gold = 50 + level * 12;
        let gems = 0;

        /* Every 5 levels — Meilenstein */
        if (level % 5 === 0) {
            const bonusGold = 120 + level * 8;
            gold += bonusGold;
            labels.push(`🎖 Meilenstein Lv.${level}: +${bonusGold} Gold`);
            const milestoneItems = {
                5:  [{ id: 'grog',        qty: 3 }, { id: 'heiltrunk', qty: 2 }],
                10: [{ id: 'blitzpulver', qty: 3 }, { id: 'grog',      qty: 2 }],
                15: [{ id: 'heiltrunk',   qty: 4 }, { id: 'rum',       qty: 2 }],
                20: [{ id: 'fernrohr',    qty: 3 }, { id: 'blitzpulver',qty:2 }],
                25: [{ id: 'rum',         qty: 3 }, { id: 'heiltrunk', qty: 3 }],
                30: [{ id: 'grog',        qty: 4 }, { id: 'fernrohr',  qty: 2 }],
            };
            const mList = milestoneItems[level] ?? [{ id: 'heiltrunk', qty: 3 }];
            mList.forEach(mi => {
                items[mi.id] = (items[mi.id] ?? 0) + mi.qty;
                labels.push(`🎁 ${this._itemLabel(mi.id)} ×${mi.qty}`);
            });
        }

        /* Every 10 levels — Perlen-Bonus */
        if (level % 10 === 0) {
            gems = Math.floor(level / 5);
            labels.push(`💎 ${gems} Perlen`);
        }

        /* Every 3 levels — bonus item */
        if (level % 3 === 0 && level % 5 !== 0) {
            const opts  = ['heiltrunk','grog','blitzpulver','rum','fernrohr','heiltrunk'];
            const roll  = opts[Math.floor(level / 3) % opts.length];
            const qty   = level >= 15 ? 2 : 1;
            items[roll] = (items[roll] ?? 0) + qty;
            labels.push(`+${qty} ${this._itemLabel(roll)}`);
        }

        /* Every 2 levels — kleine Gold-Prämie */
        if (level % 2 === 0) {
            gold += level * 4;
        }

        labels.push(`+${gold} Gold`);
        return { labels, gold, items, gems, hpBonus };
    }

    _itemLabel(id) {
        return {
            heiltrunk: '🧪 Heiltrunk', grog: '🍺 Grog', blitzpulver: '⚡ Blitzpulver',
            rum: '🛢 Rum', fernrohr: '🔭 Fernrohr',
            repair_kit: '🔧 Reparaturset', thunder_powder: '⚡ Donnerpulver', lucky_charm: '🍀 Glücksbringer'
        }[id] ?? id;
    }

    _applyLevelUpRewards(level, rewards) {
        const p = this.player;
        if (!p) return;
        p.gold = (p.gold ?? 0) + (rewards.gold ?? 0);
        if (rewards.gems) p.gems = (p.gems ?? 0) + rewards.gems;
        /* Apply max HP bonus */
        const hpBonus = rewards.hpBonus ?? 22;
        p.maxHP = (p.maxHP ?? 200) + hpBonus;
        p.hp    = Math.min((p.hp ?? p.maxHP), p.maxHP);
        p.updateHealthBar?.();
        /* Grant items */
        Object.entries(rewards.items ?? {}).forEach(([id, qty]) => {
            this.addItem(id, qty);
        });
        this._updateItemBar?.();
        this.updateUIBars?.();
    }

    /* ═══════════════════ KILL STREAK ═══════════════════ */

    _onEnemyKilled(npc) {
        const now = Date.now();
        const STREAK_WINDOW = 12000;
        if (now - this._lastKillTime < STREAK_WINDOW) {
            this._killStreak++;
        } else {
            this._killStreak = 1;
        }
        this._lastKillTime = now;
        this._updateStreakHUD();

        /* Milestone bonuses */
        if (this._killStreak === 3) {
            this.player.gold += 8; this.player.addXP(15);
            this._showStreakToast('🔥 3er-Combo! +8 Gold +15 XP');
        } else if (this._killStreak === 5) {
            this.player.gold += 20; this.player.addXP(30);
            this._showStreakToast('💀 5er-Combo! +20 Gold — RAGE MODUS!');
            this._activateRageMode();
        } else if (this._killStreak === 10) {
            this.player.gold += 60; this.player.addXP(80);
            this._showStreakToast('⚡ 10er-COMBO! +60 Gold +80 XP — LEGENDÄR!');
        } else if (this._killStreak > 10 && this._killStreak % 5 === 0) {
            this.player.gold += 30; this.player.addXP(40);
            this._showStreakToast(`🌟 ${this._killStreak}er-Combo! +30 Gold +40 XP`);
        }

        /* Auto-reset streak if no kill in window */
        this.time.delayedCall(STREAK_WINDOW + 200, () => {
            if (Date.now() - this._lastKillTime >= STREAK_WINDOW) {
                this._killStreak = 0;
                this._updateStreakHUD();
            }
        });
    }

    _updateStreakHUD() {
        if (!this._streakHudEl) {
            const el = document.createElement('div');
            el.id = 'streak-hud';
            el.style.cssText = `
                position:fixed;top:14px;left:50%;transform:translateX(-50%);
                z-index:19000;pointer-events:none;
                display:flex;align-items:center;gap:6px;
                font-family:Arial,sans-serif;transition:opacity 0.4s;
            `;
            document.body.appendChild(el);
            this._streakHudEl = el;
        }
        const el = this._streakHudEl;
        if (this._killStreak < 2) {
            el.style.opacity = '0';
            return;
        }
        const color = this._killStreak >= 10 ? '#ff3300' : this._killStreak >= 5 ? '#ff7700' : '#ffdd33';
        const size  = this._killStreak >= 10 ? '18px' : this._killStreak >= 5 ? '16px' : '14px';
        el.style.opacity = '1';
        el.innerHTML = `
            <div style="
                background:rgba(10,10,20,0.82);border:2px solid ${color};
                border-radius:20px;padding:4px 14px;
                font-size:${size};font-weight:bold;color:${color};
                letter-spacing:2px;text-shadow:0 0 8px ${color}88;
            ">${'🔥'.repeat(Math.min(this._killStreak, 5))} ${this._killStreak}× COMBO</div>
        `;
    }

    _showStreakToast(msg) {
        const el = document.createElement('div');
        el.style.cssText = `
            position:fixed;top:52px;left:50%;transform:translateX(-50%) scale(0.8);
            z-index:19001;pointer-events:none;
            background:rgba(10,10,20,0.9);border:2px solid rgba(255,150,0,0.7);
            border-radius:12px;padding:8px 18px;
            font-size:13px;font-weight:bold;color:#ffd060;
            font-family:Arial,sans-serif;letter-spacing:1px;text-align:center;
            white-space:nowrap;transition:transform 0.15s ease,opacity 0.4s;
        `;
        el.textContent = msg;
        document.body.appendChild(el);
        requestAnimationFrame(() => { el.style.transform = 'translateX(-50%) scale(1)'; });
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 420); }, 2200);
    }

    _activateRageMode() {
        if (this._rageModeActive) return;
        this._rageModeActive = true;
        const RAGE_DURATION = 8000;

        /* Speed + damage boost */
        const oldBase = this._playerBaseSpeed ?? this.player.speed;
        this._playerBaseSpeed = oldBase;
        this._rageSpeedBonus = Math.round(oldBase * 0.25);
        this.player.speed = oldBase + this._rageSpeedBonus;
        this.player.rageDamageBonus = 0.20;

        /* Red overlay */
        const overlay = document.createElement('div');
        overlay.id = 'rage-overlay';
        overlay.style.cssText = `
            position:fixed;inset:0;z-index:18000;pointer-events:none;
            background:rgba(220,20,20,0.10);border:4px solid rgba(220,30,0,0.4);
            animation:repPulse 0.6s infinite alternate;
        `;
        document.body.appendChild(overlay);
        this._rageOverlay = overlay;

        this.showStatusMsg('🔥 RAGE MODUS! +25% Speed +20% Schaden für 8s!', 0xff4400);

        this.time.delayedCall(RAGE_DURATION, () => {
            this._rageModeActive = false;
            this.player.speed = oldBase;
            delete this.player.rageDamageBonus;
            overlay.remove();
            this._rageOverlay = null;
            this.showStatusMsg('Rage Modus beendet', 0xff8844);
        });
    }

    /* ═══════════════════ ENEMY DAMAGE FLOAT ═══════════════════ */

    showEnemyDamageFloat(x, y, damage, isCrit) {
        const wx = x; const wy = y - 30;
        const cam = this.cameras.main;
        const sx = (wx - cam.scrollX) * cam.zoom;
        const sy = (wy - cam.scrollY) * cam.zoom;
        const color = isCrit ? '#ff4444' : '#ffffff';
        const size  = isCrit ? '30px' : '24px';
        const text = this.add.text(wx, wy, `${damage}`, {
            fontSize: size, fontFamily: 'Arial', fontStyle: 'bold',
            fill: color, stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(1700);
        if (isCrit) {
            const badge = this.add.text(wx + 36, wy - 8, 'KRIT!', {
                fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
                fill: '#ff2200', stroke: '#000', strokeThickness: 3,
            }).setOrigin(0.5).setDepth(1700);
            this.tweens.add({ targets: badge, y: wy - 50, alpha: 0, duration: 900, ease: 'Cubic.Out', onComplete: () => badge.destroy() });
        }
        this.tweens.add({
            targets: text,
            y: wy - 55,
            scaleX: isCrit ? 1.3 : 1,
            scaleY: isCrit ? 1.3 : 1,
            alpha: 0,
            duration: 950,
            ease: 'Cubic.Out',
            onComplete: () => text.destroy()
        });
    }

    /* ═══════════════════ MERCHANT NPC ═══════════════════ */

    _scheduleMerchant() {
        const delay = Phaser.Math.Between(180000, 300000); /* 3-5 min */
        this.time.delayedCall(delay, () => {
            if (!this.player?.active || this._merchantActive) {
                this._scheduleMerchant(); return;
            }
            this._spawnMerchant();
        });
    }

    _spawnMerchant() {
        if (this._merchantActive) return;
        this._merchantActive = true;
        const p = this.player;
        const spawnEdge = Phaser.Math.Between(0, 3);
        let mx, my;
        if (spawnEdge === 0) { mx = p.x - 900; my = p.y + Phaser.Math.Between(-400, 400); }
        else if (spawnEdge === 1) { mx = p.x + 900; my = p.y + Phaser.Math.Between(-400, 400); }
        else if (spawnEdge === 2) { mx = p.x + Phaser.Math.Between(-400, 400); my = p.y - 900; }
        else { mx = p.x + Phaser.Math.Between(-400, 400); my = p.y + 900; }
        mx = Phaser.Math.Clamp(mx, 200, this.mapWidth - 200);
        my = Phaser.Math.Clamp(my, 200, this.mapHeight - 200);

        const ship = this.physics.add.image(mx, my, 'enemy-ship')
            .setScale(0.10).setDepth(500).setTint(0x88ffcc);
        ship.setVelocity(
            (p.x - mx) * 0.06,
            (p.y - my) * 0.06
        );
        ship._isMerchant = true;

        /* Merchant label */
        const label = this.add.text(mx, my - 60, '🛒 Händler', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#88ffcc', stroke: '#000', strokeThickness: 3, align: 'center'
        }).setOrigin(0.5).setDepth(501);

        /* Ping direction arrow on minimap / show direction message */
        this.showStatusMsg('🛒 Händlerschiff nähert sich! (60s)', 0x88ffcc);

        let alreadyTraded = false;
        const CHECK_INTERVAL = 500;
        const DESPAWN_TIME = 60000;
        let elapsed = 0;

        const checkTimer = this.time.addEvent({
            delay: CHECK_INTERVAL,
            loop: true,
            callback: () => {
                elapsed += CHECK_INTERVAL;
                if (!ship.active || !p.active) { cleanupMerchant(); return; }
                ship.x += (p.x - ship.x) * 0.012;
                ship.y += (p.y - ship.y) * 0.012;
                label.setPosition(ship.x, ship.y - 60);

                const dist = Phaser.Math.Distance.Between(p.x, p.y, ship.x, ship.y);
                if (dist < 260 && !alreadyTraded) {
                    alreadyTraded = true;
                    this._openMerchantShop(ship, label, cleanupMerchant);
                    return;
                }
                if (elapsed >= DESPAWN_TIME) {
                    this.showStatusMsg('Der Händler ist abgefahren.', 0x888888);
                    cleanupMerchant();
                }
            }
        });

        const cleanupMerchant = () => {
            checkTimer.remove(false);
            ship.destroy();
            label.destroy();
            this._merchantActive = false;
            this._scheduleMerchant();
        };
        this._merchantCleanup = cleanupMerchant;
    }

    _openMerchantShop(ship, label, onClose) {
        if (this._merchantShopEl) return;
        const WARES = [
            { id: 'rum',        name: '🍺 Rum',           price: 30,  desc: '+50% Geschw. 20s' },
            { id: 'repair_kit', name: '🔧 Reparaturset',  price: 50,  desc: '+80 HP sofort' },
            { id: 'thunder_powder', name: '⚡ Donnerpulver', price: 80, desc: 'Nächster Schuss 3× Schaden' },
            { id: 'grog',       name: '🧉 Grog',           price: 25,  desc: 'Schussrate +40% für 15s' },
            { id: 'sea_chart',  name: '🗺️ Seekarte',       price: 120, desc: '+200 Gold sofort' },
            { id: 'lucky_charm',name: '🍀 Glücksbringer',  price: 60,  desc: 'Crit-Chance +15% für 30s' },
        ];
        /* Pick 3 random wares */
        const shuffled = [...WARES].sort(() => Math.random() - 0.5).slice(0, 3);

        const el = document.createElement('div');
        el.style.cssText = `
            position:fixed;inset:0;z-index:22000;display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.65);font-family:Arial,sans-serif;
        `;
        const box = document.createElement('div');
        box.style.cssText = `
            background:linear-gradient(160deg,#0b1e10,#071510);
            border:2px solid #44cc88;border-radius:12px;padding:18px 20px;
            max-width:340px;width:90%;box-shadow:0 0 40px rgba(68,204,136,0.2);
        `;
        box.innerHTML = `
            <div style="font-size:15px;font-weight:bold;color:#44cc88;letter-spacing:2px;margin-bottom:4px;">🛒 HÄNDLER-SCHIFF</div>
            <div style="font-size:10px;color:#668877;margin-bottom:14px;">Guten Wind, Kapitän! Was darf es sein?</div>
        `;
        shuffled.forEach(ware => {
            const row = document.createElement('div');
            row.style.cssText = `
                display:flex;align-items:center;justify-content:space-between;
                background:rgba(68,204,136,0.07);border:1px solid rgba(68,204,136,0.2);
                border-radius:8px;padding:10px 12px;margin-bottom:8px;gap:10px;
            `;
            row.innerHTML = `
                <div style="flex:1;">
                    <div style="font-size:12px;font-weight:bold;color:#88ffcc;">${ware.name}</div>
                    <div style="font-size:10px;color:#668877;margin-top:2px;">${ware.desc}</div>
                </div>
                <button data-ware="${ware.id}" data-price="${ware.price}" style="
                    background:#0d3322;border:1px solid #44cc88;border-radius:6px;
                    color:#44cc88;font-size:11px;font-weight:bold;padding:6px 10px;
                    cursor:pointer;white-space:nowrap;touch-action:manipulation;
                ">${ware.price} 🪙</button>
            `;
            box.appendChild(row);
        });
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Schließen';
        closeBtn.style.cssText = `
            width:100%;margin-top:10px;padding:8px;background:rgba(255,255,255,0.06);
            border:1px solid rgba(255,255,255,0.15);border-radius:8px;
            color:#aaa;font-size:12px;cursor:pointer;touch-action:manipulation;
        `;
        closeBtn.addEventListener('click', () => { el.remove(); this._merchantShopEl = null; onClose(); });
        box.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-ware]');
            if (!btn) return;
            const wareId = btn.dataset.ware;
            const price  = parseInt(btn.dataset.price);
            if ((this.player.gold ?? 0) < price) {
                this.showStatusMsg('Nicht genug Gold!', 0xff5544); return;
            }
            this.player.gold -= price;
            this._applyMerchantWare(wareId);
            btn.textContent = '✓ Gekauft';
            btn.style.background = '#0a4428';
            btn.disabled = true;
        });
        box.appendChild(closeBtn);
        el.appendChild(box);
        document.body.appendChild(el);
        this._merchantShopEl = el;
    }

    _applyMerchantWare(wareId) {
        const p = this.player;
        switch (wareId) {
            case 'rum':
                this._rumActive = true;
                this._recalcPlayerSpeed?.();
                this.showStatusMsg('🍺 Rum getrunken! +50% Geschwindigkeit für 20s', 0xffcc44);
                this.time.delayedCall(20000, () => { this._rumActive = false; this._recalcPlayerSpeed?.(); });
                break;
            case 'repair_kit':
                p.hp = Math.min(p.maxHP, (p.hp ?? 0) + 80);
                p.updateHealthBar?.();
                this.showStatusMsg('🔧 Repariert! +80 HP', 0x7fffb0);
                break;
            case 'thunder_powder':
                this._blitzpulverActive = true;
                if (!p.activeEffects) p.activeEffects = {};
                p.activeEffects.blitzpulver = { label: '⚡ Blitz', endTime: Date.now() + 60000 };
                this.showStatusMsg('⚡ Donnerpulver! Nächster Schuss: 3× Schaden', 0xffe84a);
                break;
            case 'grog': {
                if (!this._playerBaseSpeed) this._playerBaseSpeed = this.player?.speed ?? 160;
                const now15 = this.time.now;
                const remaining = (this._grogExpiry ?? 0) > now15 ? (this._grogExpiry - now15) : 0;
                this._grogExpiry = now15 + remaining + 15000;
                this._grogActive = true;
                if (this.player) { this.player.activeEffects = this.player.activeEffects ?? {}; this.player.activeEffects.grog = true; }
                this._recalcPlayerSpeed?.();
                this.showStatusMsg('🧉 Grog! +50% Geschwindigkeit für 15s', 0x88aaff);
                /* clear after total remaining duration */
                this.time.delayedCall(remaining + 15000, () => {
                    if (this._grogActive && (this._grogExpiry ?? 0) <= this.time.now + 50) {
                        this._grogActive = false;
                        delete this.player?.activeEffects?.grog;
                        this._recalcPlayerSpeed?.();
                        this.showStatusMsg('🧉 Grog-Effekt abgelaufen.', 0x888888);
                    }
                });
                break;
            }
            case 'sea_chart':
                p.gold = (p.gold ?? 0) + 200;
                this.showStatusMsg('🗺️ Seekarte verkauft! +200 Gold', 0xffd36a);
                break;
            case 'lucky_charm':
                if (!p.activeEffects) p.activeEffects = {};
                p.activeEffects.luckyCharm = { label: '🍀 Glück', endTime: Date.now() + 30000, critBonus: 0.15 };
                this.showStatusMsg('🍀 Glücksbringer! +15% Crit-Chance für 30s', 0x88ff88);
                break;
        }
    }

    createChartConfigs() {
        const CHART_THEMES = [
            { name: 'Karibisches Becken',   color: 0x4bc8ff, stars: 1 },
            { name: 'Stürmische Passage',   color: 0x78d8f5, stars: 2 },
            { name: 'Teufelsmeer',          color: 0xf5a85a, stars: 3 },
            { name: 'Schwarzes Riff',       color: 0xe07080, stars: 4 },
            { name: 'Totenkopf-See',        color: 0xd44060, stars: 5 },
            { name: 'Fluch der Meere',      color: 0xcc3355, stars: 6 },
            { name: 'Geistersee',           color: 0xaa44dd, stars: 7 },
            { name: 'Admiralsbann',         color: 0xff6633, stars: 8 },
            { name: 'Kronensturm',          color: 0xff4422, stars: 9 },
            { name: 'Endloser Ozean',       color: 0xff2200, stars: 10 },
        ];
        return Array.from({ length: this.maxChartIndex }, (_, index) => {
            const chart = index + 1;
            const size  = 4200 + (index * 220);
            const theme = CHART_THEMES[index] ?? CHART_THEMES[CHART_THEMES.length - 1];
            return {
                index: chart,
                name:         theme.name,
                displayName:  `Karte ${chart}: ${theme.name}`,
                themeColor:   theme.color,
                stars:        theme.stars,
                worldWidth:   size,
                worldHeight:  size,
                spawnX:       size / 2,
                spawnY:       size / 2,
                islandCount:  18 + Math.min(10, index),
                npcCount:     24 + (index * 3),
                monsterCount: 12 + (index * 2),
                giftCount:    20 + index,
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

    _generateOceanTexture() {
        if (this.textures.exists('ocean-seamless')) return;
        try {
            const SIZE = 512;
            const canvas = document.createElement('canvas');
            canvas.width = SIZE; canvas.height = SIZE;
            const ctx = canvas.getContext('2d');

            /* Deep BOS-style navy base */
            ctx.fillStyle = '#0e2d4a';
            ctx.fillRect(0, 0, SIZE, SIZE);

            /* Seamless radial light patches — each blob is drawn at 9 positions
               (original + 8 tiled neighbours) so left/right/top/bottom edges match perfectly */
            const blobs = [];
            for (let i = 0; i < 28; i++) {
                blobs.push({
                    cx: Math.random() * SIZE,
                    cy: Math.random() * SIZE,
                    r:  55 + Math.random() * 90,
                    a:  0.06 + Math.random() * 0.10,
                    hue: Math.random() < 0.5 ? '#1e5a8a' : '#163c60'
                });
            }
            blobs.forEach(({ cx, cy, r, a, hue }) => {
                for (const ox of [-SIZE, 0, SIZE]) {
                    for (const oy of [-SIZE, 0, SIZE]) {
                        ctx.save();
                        ctx.globalAlpha = a;
                        const gr = ctx.createRadialGradient(cx+ox, cy+oy, 0, cx+ox, cy+oy, r);
                        gr.addColorStop(0, hue);
                        gr.addColorStop(1, 'transparent');
                        ctx.fillStyle = gr;
                        ctx.beginPath();
                        ctx.arc(cx+ox, cy+oy, r, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                }
            });

            /* Subtle dark veins — very soft horizontal bands for depth */
            for (let b = 0; b < 8; b++) {
                const by = (b / 8) * SIZE;
                const bh = 18 + Math.random() * 30;
                const bg = ctx.createLinearGradient(0, by, 0, by + bh);
                bg.addColorStop(0,   'rgba(5,18,34,0)');
                bg.addColorStop(0.5, `rgba(5,18,34,${(0.04 + Math.random() * 0.05).toFixed(2)})`);
                bg.addColorStop(1,   'rgba(5,18,34,0)');
                ctx.fillStyle = bg;
                ctx.fillRect(0, by, SIZE, bh);
                /* also wrap — draw at by - SIZE so top band matches bottom */
                ctx.fillRect(0, by - SIZE, SIZE, bh);
            }

            this.textures.addCanvas('ocean-seamless', canvas);
        } catch (e) {
            console.warn('[Ocean] Canvas-Textur fehlgeschlagen:', e);
        }
    }

    syncOceanBackground() {
        if (!this.background) return;
        const chart = this.currentChartIndex ?? 1;
        /* Tint the ocean tile darker per chart depth */
        const tints = [0xffffff, 0xe0eeff, 0xc8dcf0, 0xacc8e0, 0x90b0cc, 0x7098b4];
        const idx   = Math.min(tints.length - 1, Math.floor((chart - 1) / 2));
        this.background.setTint(tints[idx]);
        /* Natürliche Tile-Größe — kein Strecken */
        this.background.setTileScale(1.0, 1.0);
    }

handleResize(gameSize) {
    if (!gameSize) return;
    const w = gameSize.width || this.scale.width;
    const h = gameSize.height || this.scale.height;
    /* Resize screen-fixed TileSprite so it always covers the viewport */
    if (this.background?.setSize) {
        this.background.setSize(w + 64, h + 64);
    }
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

        /* Reset Wanted level on chart change */
        this._wantedLevel = 0;
        this._bountyHunterTimer?.remove(false);
        this._updateWantedHUD?.();

        const targetConfig = this.getChartConfig(clampedTarget);
        const starStr = '★'.repeat(targetConfig?.stars ?? clampedTarget) + '☆'.repeat(Math.max(0, 10 - (targetConfig?.stars ?? clampedTarget)));
        const dirLabel = travelDirection === 'east' ? '→ Osttor' : travelDirection === 'west' ? '← Westtor' : travelDirection;
        this.showStatusMsg(
            `⚓ ${targetConfig?.name ?? 'Seekarte ' + clampedTarget} ${dirLabel}  ${starStr}`,
            targetConfig?.themeColor ?? 0x8be7ff
        );
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
            ...(this.monsterGroup ? this.monsterGroup.getChildren() : []),
            ...(this.islandTowerGroup ? this.islandTowerGroup.getChildren().filter(t => !t.isDead) : [])
        ].filter(entity => entity && entity.active && !entity.isDead);

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
        this.chartNav?.setShipVisible(this.isReturnToShipVisible);
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
                texture: ['island-atoll','island-reef','island-tropical','island-volcanic','island-frozen','island-ruins','island-temple'][this.islandSpawnPoints.length % 7]
            });
        }
    }

    spawnIslands() {
        if (!this.islands) return;
        this.islands.clear(true, true);
        /* clear old towers from previous chart */
        this.islandTowerGroup?.clear(true, true);

        const ISLAND_RADII = {
            'island-atoll':    105, 'island-reef':     105, 'island-tropical': 108,
            'island-volcanic':  95, 'island-frozen':   102, 'island-ruins':     80, 'island-temple': 98
        };

        this.islandSpawnPoints.forEach((point) => {
            /* Opaque ocean-coloured background for transparent-PNG islands (e.g. temple) */
            if (point.texture === 'island-temple') {
                this.add.circle(point.x, point.y, 105, 0x1a4a3a, 1).setDepth(11);
            }

            const island = new Island(this, point.x, point.y, point.texture);
            this.islands.add(island);
            island.setInteractive({ useHandCursor: true });
            island.attachedTowers = [];
            island.capturedBy = null;
            island._conquestObjects = [];
            /* Normale Inseln haben KEINE Türme – nur Gildeninseln (GuildIsland) */

            island.on('pointerdown', (ptr) => {
                this._islandDownPtr = { x: ptr.x, y: ptr.y };
            });
            island.on('pointerup', (ptr) => {
                const d = this._islandDownPtr ? Math.hypot(ptr.x - this._islandDownPtr.x, ptr.y - this._islandDownPtr.y) : 99;
                if (d < 10) this._tryIslandRepair(island);
                this._islandDownPtr = null;
            });
        });
    }

    /* ── Dedicated guild tower combat — independent timer, no proxy ── */
    _startGuildTowerCombat(island) {
        this._stopGuildTowerCombat();
        this._guildCombatIsland = island;
        const reloadMs = Math.max(800, this.player?.reloadTime ?? 1500);
        this._showGuildCombatHUD();

        this._guildCombatTimer = this.time.addEvent({
            delay: reloadMs,
            loop: true,
            callback: () => {
                if (!this.player?.active || !island?.scene || !this._guildCombatIsland) {
                    this._stopGuildTowerCombat(); return;
                }
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, island.x, island.y);
                if (dist > 700) {
                    this.showStatusMsg('⚓ Zu weit von der Gildeninsel!', 0xff8844); return;
                }
                /* Find nearest active tower */
                const { tower, index } = island.getNearestActiveTower(this.player.x, this.player.y);
                if (!tower) { this._stopGuildTowerCombat(); return; }

                const guild = this.player.guildName ?? window._loginUsername ?? 'Spieler';
                const cannonStats = this.getCannonCombatStats?.() ?? {};
                const dmg = Math.round((cannonStats.totalDamagePerShot ?? this.player?.damagePerCannon ?? 80) * 1.0);
                const wx = island.x + tower.tx;
                const wy = island.y + tower.ty;

                island.attackTower(index, dmg, guild);
                this.playSound('shoot');
                this._logbookAdd?.('shots_fired');
                try { this.spawnProjectile({ x: wx, y: wy, active: true }, false, cannonStats.ammo ?? null); } catch {}
                this.showEnemyDamageFloat?.(wx, wy, dmg, false);

                /* Tower counter-attack */
                if (tower.active) {
                    this.time.delayedCall(320, () => {
                        if (!this.player?.active) return;
                        const counter = Phaser.Math.Between(30, 55);
                        this.player.takeDamage(counter);
                        this.showEnemyDamageFloat?.(this.player.x, this.player.y - 18, counter, false);
                    });
                }

                const remaining = island.towers.filter(t => t.active).length;
                const hudStatus = document.getElementById('guild-combat-status');
                if (remaining > 0) {
                    if (hudStatus) hudStatus.textContent = `Turm ${index + 1}: -${dmg} HP  •  ${remaining}/6 aktiv`;
                    this.showStatusMsg(`🏰 Turm ${index + 1} getroffen! -${dmg} HP  •  ${remaining}/6 aktiv`, 0xffaa44);
                } else {
                    if (hudStatus) hudStatus.textContent = '⚑ Alle Türme zerstört!';
                    this.showStatusMsg(`💥 Alle Türme zerstört! Gildeninsel eingenommen!`, 0xd4aa40);
                    this._stopGuildTowerCombat();
                }
            }
        });
        /* Immediately fire first shot after short delay */
        this.time.delayedCall(200, () => { this._guildCombatTimer && this._guildCombatTimer.elapsed > 0 ? null : null; });
    }

    _showGuildCombatHUD() {
        if (this._guildCombatHudEl) return;
        const el = document.createElement('div');
        el.id = 'guild-combat-hud';
        el.style.cssText = `
            position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
            z-index:14500;background:rgba(8,14,28,0.94);
            border:2px solid rgba(255,100,50,0.8);border-radius:12px;
            padding:8px 20px;font-family:Arial,sans-serif;
            display:flex;align-items:center;gap:12px;
            box-shadow:0 0 24px rgba(255,80,30,0.4);pointer-events:auto;
        `;
        el.innerHTML = `
            <span style="font-size:18px;animation:pulse 0.8s infinite alternate;">🏰</span>
            <div>
                <div style="font-size:10px;color:#ffaa55;letter-spacing:1.5px;font-weight:bold;">GILDENINSEL — ANGRIFF LÄUFT</div>
                <div id="guild-combat-status" style="font-size:11px;color:#fff;">Türme werden beschossen...</div>
            </div>
            <button id="guild-stop-btn" style="
                background:linear-gradient(180deg,#8b2010,#5a1008);
                border:1px solid rgba(255,80,30,0.6);border-radius:8px;
                color:#fff;font-size:11px;font-weight:bold;padding:6px 12px;
                cursor:pointer;touch-action:manipulation;white-space:nowrap;
            ">✕ Stop</button>
        `;
        document.body.appendChild(el);
        this._guildCombatHudEl = el;
        document.getElementById('guild-stop-btn').addEventListener('click', () => {
            this._stopGuildTowerCombat();
            this.showStatusMsg('⚓ Gilden-Angriff abgebrochen.', 0x888888);
        });
    }

    _hideGuildCombatHUD() {
        if (!this._guildCombatHudEl) return;
        this._guildCombatHudEl.remove();
        this._guildCombatHudEl = null;
    }

    _stopGuildTowerCombat() {
        this._guildCombatTimer?.remove();
        this._guildCombatTimer   = null;
        this._guildCombatIsland  = null;
        this._hideGuildCombatHUD();
    }

    /* ── DOM button: appears when near guild island, hides when out of range ── */
    _updateGuildAttackBtn(distToGuild) {
        const gi = this.guildIsland;
        const inRange     = distToGuild < 680;
        const alreadyFighting = !!this._guildCombatTimer;
        const conquered   = gi?.capturedBy != null;
        const noTowers    = gi && gi.towers.every(t => !t.active);
        const shouldShow  = inRange && !alreadyFighting && !conquered && !noTowers;

        if (shouldShow && !this._guildAttackBtnEl) {
            const btn = document.createElement('button');
            btn.id = 'guild-attack-btn';
            btn.textContent = '🏰 Gildeninsel ANGREIFEN';
            btn.style.cssText = `
                position:fixed;bottom:96px;left:50%;transform:translateX(-50%);
                z-index:14600;
                background:linear-gradient(180deg,#8b2010 0%,#5a1008 100%);
                border:2px solid rgba(255,120,50,0.85);border-radius:14px;
                color:#fff;font-size:13px;font-weight:bold;
                padding:10px 28px;letter-spacing:1px;
                box-shadow:0 0 20px rgba(255,80,30,0.55);
                cursor:pointer;touch-action:manipulation;
                font-family:Arial,sans-serif;
                animation:pulse 1s infinite alternate;
            `;
            btn.addEventListener('click', () => {
                if (gi) { this.events.emit('guild-island-attack-tap', { island: gi }); }
            });
            document.body.appendChild(btn);
            this._guildAttackBtnEl = btn;
        } else if (!shouldShow && this._guildAttackBtnEl) {
            this._guildAttackBtnEl.remove();
            this._guildAttackBtnEl = null;
        }
        /* Update label when actively fighting */
        if (alreadyFighting && this._guildAttackBtnEl) {
            this._guildAttackBtnEl.remove();
            this._guildAttackBtnEl = null;
        }
    }

    _checkIslandConquest(island) {
        if (!island || island.capturedBy) return;
        if (!island.attachedTowers?.every(t => !t.active)) return;

        const guild = this.player?.guildName ?? window._loginUsername ?? 'Spieler';
        island.capturedBy = guild;

        /* Visual: conquest flag + label */
        const fp = this.add.rectangle(island.x, island.y - 38, 2, 32, 0x998855, 1).setDepth(28);
        const fb = this.add.rectangle(island.x + 10, island.y - 50, 22, 12, 0xd4aa40, 1).setDepth(28);
        const ft = this.add.text(island.x + 10, island.y - 50,
            guild.substring(0, 3).toUpperCase(),
            { fontSize: '7px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#fff', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5).setDepth(29);
        const lbl = this.add.text(island.x, island.y + 90,
            `⚑ ${guild}`,
            { fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#ffd36a', stroke: '#000', strokeThickness: 3 }
        ).setOrigin(0.5).setDepth(29);
        island._conquestObjects = [fp, fb, ft, lbl];

        this.showStatusMsg(`⚑ Insel für ${guild} erobert! +80 Gold alle 30s`, 0xd4aa40);
        this._addRuf(80, 'Insel erobert');
        this.events.emit('island-conquered', { island, guild });

        /* Gold bonus every 30s */
        this.time.addEvent({
            delay: 30000,
            callback: () => {
                if (!this.player?.active || island.capturedBy !== guild) return;
                this.player.gold += 80;
                this.updateUIBars?.();
                this.showStatusMsg('⚑ Insel-Gold: +80', 0xd4aa40);
            },
            loop: true
        });
    }

    _fireTowerProjectile(tower) {
        if (!this.player?.active) return;
        const proj  = this.add.circle(tower.x, tower.y, 7, 0xff5500, 1)
            .setBlendMode(Phaser.BlendModes.ADD).setDepth(1200);
        const trail = this.add.circle(tower.x, tower.y, 5, 0xff2200, 0.5)
            .setBlendMode(Phaser.BlendModes.ADD).setDepth(1199);
        const px = this.player.x, py = this.player.y;
        this.tweens.add({
            targets: [proj, trail], x: px, y: py, duration: 320, ease: 'Linear',
            onUpdate: () => trail.setPosition(proj.x, proj.y),
            onComplete: () => {
                proj.destroy(); trail.destroy();
                if (!this.player?.active) return;
                const dmg = 12 + Phaser.Math.Between(0, 18);
                this.player.takeDamage(dmg);
                this.updateUIBars?.();
                this._spawnImpact(px, py, { impactColor: 0xff6600, impactR: 22, impactParticles: 4, particleColor: 0xff9900 }, false);
                this.showStatusMsg(`🏰 Turm: -${dmg} HP`, 0xff6644);
            }
        });
    }

    _tryNearestIslandRepair() {
        if (!this.player?.active) return;
        /* Find nearest island within range */
        let nearest = null;
        let nearestDist = Infinity;
        this.islands?.getChildren().forEach(isl => {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, isl.x, isl.y);
            if (d < nearestDist) { nearest = isl; nearestDist = d; }
        });
        /* If the guild island is closer, consider that too */
        if (this.guildIsland) {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.guildIsland.x, this.guildIsland.y);
            if (d < nearestDist) { nearest = this.guildIsland; nearestDist = d; }
        }
        if (nearest && nearestDist <= 650) {
            this._tryIslandRepair(nearest);
        } else {
            /* Emergency repair at sea — costs more */
            const missingHP = (this.player.maxHP ?? 300) - (this.player.hp ?? 300);
            if (missingHP <= 0) { this.showStatusMsg('⚓ Rumpf bereits vollständig repariert!', 0x7fffb0); return; }
            const cost = Math.ceil(missingHP * 1.8);
            if ((this.player.gold ?? 0) < cost) {
                this.showStatusMsg(`🔧 Notfall-Reparatur kostet ${cost} Gold. Nicht genug!`, 0xff6644);
                return;
            }
            this.player.gold -= cost;
            this.player.heal(missingHP);
            this.updateUIBars();
            this.showStatusMsg(`🔧 Notfall-Reparatur: -${cost} Gold, +${missingHP} HP`, 0x7fffb0);
        }
    }

    _tryIslandRepair(island) {
        if (!this.player?.active) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, island.x, island.y);
        if (dist > 650) {
            this.showStatusMsg('⚓ Zu weit entfernt! Fahre näher an die Insel heran.', 0xff8844);
            return;
        }
        const missingHP = (this.player.maxHP ?? 300) - (this.player.hp ?? 300);
        if (missingHP <= 0) {
            this.showStatusMsg('⚓ Rumpf ist bereits vollständig repariert!', 0x7fffb0);
            return;
        }
        const cost = Math.ceil(missingHP * 0.8);
        if ((this.player.gold ?? 0) < cost) {
            this.showStatusMsg(`⚓ Nicht genug Gold! Reparatur kostet ${cost} Gold.`, 0xff6644);
            return;
        }
        this.player.gold -= cost;
        this.player.heal(missingHP);
        this.dailyQuestPanel?.addProgress('hp_healed', missingHP);
        this._logbookAdd('hp_healed', missingHP);
        this.updateUIBars();
        this.showStatusMsg(`⚓ Schiff repariert! -${cost} Gold, +${missingHP} HP`, 0x7fffb0);
        this.pushStatusFeedMessage('⚓ Schiff repariert!', '#7fffb0');
        const sparkle = this.add.text(island.x, island.y - 60, '🔧 REPARIERT!', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#7fffb0', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(3000);
        this.tweens.add({ targets: sparkle, y: island.y - 110, alpha: 0, duration: 2000, onComplete: () => sparkle.destroy() });
    }

    _spawnGuildIsland(worldWidth, worldHeight) {
        if (this.guildIsland) { try { this.guildIsland.destroy(); } catch {} this.guildIsland = null; }
        try {
            const gx = Math.round(worldWidth * 0.5 + (Math.random() - 0.5) * worldWidth * 0.3);
            const gy = Math.round(worldHeight * 0.5 + (Math.random() - 0.5) * worldHeight * 0.3);
            this.guildIsland = new GuildIsland(this, gx, gy);

            /* Collider so the player ship can't sail through the guild island */
            if (this.player && this.guildIsland.body) {
                this.physics.add.collider(this.player, this.guildIsland);
            }

            const proxy = this.add.image(gx, gy, 'island-guild').setAlpha(0);
            proxy.setData('isGuildIsland', true);
            proxy.setData('minimapRadius', 22);
            this.islands.add(proxy);
        } catch(e) { console.warn('[AHC] GuildIsland spawn error:', e?.message || e); }
    }

    startShipEvent(eventId) {
        if (this._activeEventShips?.length) return;
        this._activeEventShips = [];
        const eventMap = {
            'konvoi':       ['ship-event-galleon','ship-event-galleon','ship-event-flagship'],
            'geisterschiff':['ship-event-ghost'],
            'admiralsjagd': ['ship-event-flagship']
        };
        const textures = eventMap[eventId] ?? eventMap['konvoi'];
        const dx = Phaser.Math.Between(600, 1000) * (Math.random() < 0.5 ? 1 : -1);
        const dy = Phaser.Math.Between(300, 600) * (Math.random() < 0.5 ? 1 : -1);
        const cx = this.player.x + dx;
        const cy = this.player.y + dy;

        const angleRad = Math.atan2(dy, dx);
        const angleDeg = ((angleRad * 180 / Math.PI) + 360) % 360;
        const dirs = ['→ Osten','↗ Nordost','↑ Norden','↖ Nordwest','← Westen','↙ Südwest','↓ Süden','↘ Südost'];
        const dirStr = dirs[Math.round(angleDeg / 45) % 8];

        const eventName = eventId === 'geisterschiff' ? 'Das Geisterschiff' : eventId === 'admiralsjagd' ? 'Admiralsjagd' : 'Schiffsdesign-Konvoi';
        this.showStatusMsg(`⚔ EVENT: ${eventName} erscheint — ${dirStr}!`, 0xd4aa40);
        this._showEventDirectionHUD(eventId, eventName, dirStr);

        const eventHpMap    = { konvoi: 4800, geisterschiff: 9600, admiralsjagd: 7200 };
        const eventSpeedMap = { konvoi: 3.5,  geisterschiff: 5.0,  admiralsjagd: 4.5  };
        const eventHP    = eventHpMap[eventId]    ?? 4800;
        const eventSpeed = eventSpeedMap[eventId] ?? 4;

        textures.forEach((tex, i) => {
            const ex = Phaser.Math.Clamp(cx + i * 240 - textures.length * 120, 300, this.mapWidth - 300);
            const ey = Phaser.Math.Clamp(cy, 300, this.mapHeight - 300);
            try {
                const npc = new NPCShip(this, ex, ey);
                if (this.textures.exists(tex)) { npc.sprite?.setTexture(tex); npc.sprite?.setScale(0.13); }
                npc.npcTier = 4;
                npc.maxHP   = eventHP;
                npc.hp      = eventHP;
                npc.speed   = eventSpeed;
                npc.xpValue = eventId === 'admiralsjagd' ? 2000 : eventId === 'geisterschiff' ? 1500 : 1000;
                npc.healthBarWidth = 90;
                npc.updateHealthBar?.();
                npc.npcName = eventId === 'geisterschiff' ? '[GEIST] Phantom-Kapitän' : eventId === 'admiralsjagd' ? '[ADM] Hochadmiral Krueger' : `[KONVOI] Händler-Escort`;
                npc._isEventShip = true;
                npc._eventId = eventId;
                this.npcGroup.add(npc);
                this._activeEventShips.push(npc);
            } catch(e) { console.warn('Event ship spawn error:', e); }
        });

        const checkDone = () => {
            const allDead = this._activeEventShips.every(s => !s?.active);
            if (allDead && this._activeEventShips.length > 0) {
                this._activeEventShips = [];
                const baseRewards = { konvoi: 2500, geisterschiff: 5000, admiralsjagd: 8000 };
                const gemRewards  = { konvoi: 8,    geisterschiff: 15,   admiralsjagd: 25   };
                const mult = this.player?.rewardMultiplier ?? 1;
                const goldReward = Math.round((baseRewards[eventId] ?? 2500) * mult);
                const gemReward  = Math.round((gemRewards[eventId]  ?? 8)    * mult);
                if (this.player) {
                    this.player.gold = (this.player.gold ?? 0) + goldReward;
                    this.player.gems = (this.player.gems ?? 0) + gemReward;
                    try {
                        const designs = JSON.parse(localStorage.getItem('ahc_ship_blueprints') || '[]');
                        if (!designs.includes(eventId)) {
                            designs.push(eventId);
                            localStorage.setItem('ahc_ship_blueprints', JSON.stringify(designs));
                        }
                    } catch {}
                }
                const multStr = mult > 1 ? ` (×${mult})` : '';
                this.showStatusMsg(`🏆 EVENT gewonnen! +${goldReward}🪙 +${gemReward}💎 +Schiffsplan!${multStr}`, 0xd4aa40);
                this._showEventRewardBanner(eventId, goldReward, gemReward, mult);
                this.updateUIBars?.();
                this._removeEventDirectionHUD();
                clearInterval(doneCheck);
            }
        };
        const doneCheck = setInterval(checkDone, 2000);
        this.time.delayedCall(60000, () => clearInterval(doneCheck));
    }

    _showEventDirectionHUD(eventId, eventName, dirStr) {
        this._removeEventDirectionHUD();
        const icons = { konvoi: '⚓', geisterschiff: '👻', admiralsjagd: '👑' };
        const colors = { konvoi: '#d4aa40', geisterschiff: '#88aaff', admiralsjagd: '#ff8844' };
        const icon  = icons[eventId]  ?? '⚔';
        const color = colors[eventId] ?? '#d4aa40';

        const hud = document.createElement('div');
        hud.id = 'event-direction-hud';
        hud.style.cssText = `
            position:fixed; bottom:90px; left:50%; transform:translateX(-50%);
            z-index:19000; display:flex; align-items:center; gap:10px;
            background:rgba(4,14,30,0.92); border:2px solid ${color};
            border-radius:40px; padding:8px 18px 8px 12px;
            box-shadow:0 0 20px ${color}55; cursor:pointer;
            font-family:Arial,sans-serif; animation:eventPulse 1.8s ease-in-out infinite;
            touch-action:manipulation;
        `;
        hud.innerHTML = `
            <span style="font-size:22px;">${icon}</span>
            <div style="display:flex;flex-direction:column;gap:1px;">
                <div style="font-size:11px;font-weight:bold;color:${color};letter-spacing:1px;">⚔ EVENT AKTIV</div>
                <div style="font-size:13px;color:#fff;font-weight:bold;">${eventName}</div>
                <div style="font-size:11px;color:#aaa;">Richtung: <strong style="color:${color};">${dirStr}</strong></div>
            </div>
            <div style="font-size:20px;margin-left:4px;color:${color};">›</div>
        `;
        const style = document.createElement('style');
        style.id = 'event-hud-style';
        style.textContent = '@keyframes eventPulse{0%,100%{box-shadow:0 0 20px ' + color + '55}50%{box-shadow:0 0 35px ' + color + 'aa}}';
        document.head.appendChild(style);
        document.body.appendChild(hud);
        this._eventHudEl = hud;
    }

    _removeEventDirectionHUD() {
        document.getElementById('event-direction-hud')?.remove();
        document.getElementById('event-hud-style')?.remove();
        this._eventHudEl = null;
    }

    _showEventRewardBanner(eventId, gold, gems, mult) {
        document.getElementById('event-reward-banner')?.remove();
        const icons = { konvoi:'⚓', geisterschiff:'👻', admiralsjagd:'👑' };
        const names = { konvoi:'Schiffsdesign-Konvoi', geisterschiff:'Das Geisterschiff', admiralsjagd:'Admiralsjagd' };
        const banner = document.createElement('div');
        banner.id = 'event-reward-banner';
        banner.style.cssText = `
            position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
            z-index:25000; background:linear-gradient(160deg,#0a1e10,#040e06);
            border:2px solid #d4aa40; border-radius:12px;
            padding:20px 28px; text-align:center; font-family:Arial,sans-serif;
            box-shadow:0 0 60px rgba(212,170,64,0.5);
            animation:rewardFadeIn 0.4s ease-out;
            min-width:260px;
        `;
        if (!document.getElementById('reward-anim-style')) {
            const s = document.createElement('style');
            s.id = 'reward-anim-style';
            s.textContent = '@keyframes rewardFadeIn{from{opacity:0;transform:translate(-50%,-44%) scale(0.88)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}';
            document.head.appendChild(s);
        }
        const multBadge = mult > 1 ? `<div style="background:#ff8800;color:#fff;border-radius:12px;padding:2px 10px;font-size:11px;font-weight:bold;display:inline-block;margin-bottom:8px;">⚡ ×${mult} MULTIPLIKATOR</div><br>` : '';
        banner.innerHTML = `
            ${multBadge}
            <div style="font-size:36px;margin-bottom:4px;">${icons[eventId]??'⚔'}</div>
            <div style="font-size:14px;font-weight:bold;color:#d4aa40;letter-spacing:2px;margin-bottom:12px;">🏆 EVENT GEWONNEN</div>
            <div style="font-size:12px;color:#aaa;margin-bottom:12px;">${names[eventId]??eventId}</div>
            <div style="display:flex;justify-content:center;gap:20px;margin-bottom:14px;">
                <div><div style="font-size:22px;font-weight:bold;color:#ffd36a;">+${gold.toLocaleString()}</div><div style="font-size:10px;color:#888;">🪙 Gold</div></div>
                <div><div style="font-size:22px;font-weight:bold;color:#88ffdd;">+${gems}</div><div style="font-size:10px;color:#888;">💎 Gems</div></div>
                <div><div style="font-size:22px;font-weight:bold;color:#aaffaa;">+1</div><div style="font-size:10px;color:#888;">📜 Schiffsplan</div></div>
            </div>
            <div style="font-size:11px;color:#6a8;margin-bottom:14px;">Neues Design verfügbar in der Werft!</div>
            <button id="evt-reward-close" style="padding:8px 24px;background:rgba(212,170,64,0.12);border:1px solid #d4aa40;color:#d4aa40;border-radius:20px;cursor:pointer;font-size:13px;touch-action:manipulation;">✕ Schließen</button>
        `;
        document.body.appendChild(banner);
        setTimeout(() => { document.getElementById('evt-reward-close')?.addEventListener('click', () => banner.remove()); }, 0);
        setTimeout(() => banner.remove(), 8000);
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

    spawnNPC(options = {}) {
        const point = this.getNPCSpawnPoint();
        const chartLevel = options.chartLevel ?? this.currentChartIndex;
        const npc = new NPCShip(this, point.x, point.y, chartLevel);
        if (options.isBountyHunter) {
            npc.npcName = `⭐ KOPFGELDJÄGER [KGJ] (Karte ${chartLevel})`;
            npc.maxHP   = Math.round(npc.maxHP * 1.6);
            npc.hp      = npc.maxHP;
            npc.speed   = Math.min(npc.speed * 1.3, 14);
            npc.sprite?.setTint(0xff2244);
            npc.nameLabel?.setText(npc.npcName);
            npc.nameLabel?.setColor('#ff6666');
            npc.updateHealthBar();
        }
        this.npcGroup.add(npc);
        return npc;
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
        const tier = defeatedEntity.npcTier ?? (isMonster ? 3 : 1);

        const lootTable = defeatedEntity.getLootTable?.() ?? null;

        if (lootTable) {
            const totalW = lootTable.reduce((s, e) => s + e.weight, 0);
            const dropCount = tier === 3 ? 3 : tier === 2 ? 2 : 1;
            for (let i = 0; i < dropCount; i++) {
                let roll = Phaser.Math.Between(0, totalW - 1);
                let chosen = lootTable[lootTable.length - 1];
                for (const entry of lootTable) {
                    roll -= entry.weight;
                    if (roll < 0) { chosen = entry; break; }
                }
                this.createLootDrop(defeatedEntity.x, defeatedEntity.y, {
                    type: chosen.type,
                    goldValue:    Phaser.Math.Between(chosen.gold[0], chosen.gold[1]),
                    materialValue: Phaser.Math.Between(0, tier),
                    xpValue:      Phaser.Math.Between(chosen.xp[0], chosen.xp[1]),
                    hpValue:      chosen.type === 'gift-chest' ? Phaser.Math.Between(10, 30 * tier) : 0,
                    scale:        chosen.type === 'xp-orb' ? 0.12 : 0.082
                });
            }
            if (tier >= 2 && Phaser.Math.Between(0, 100) < 35) {
                this.createLootDrop(defeatedEntity.x, defeatedEntity.y, {
                    type: 'xp-orb', goldValue: 0, materialValue: tier - 1,
                    xpValue: Phaser.Math.Between(50 * tier, 120 * tier), hpValue: 0, scale: 0.12
                });
            }
        } else {
            const baseGold = isMonster ? Phaser.Math.Between(50, 110) : Phaser.Math.Between(30, 80);
            const baseMats = isMonster ? Phaser.Math.Between(4, 9) : Phaser.Math.Between(2, 5);
            const bonusXP  = Math.max(10, Math.round(defeatedEntity.xpValue * 0.35));
            this.createLootDrop(defeatedEntity.x, defeatedEntity.y, { type: 'gold-bag',   goldValue: baseGold, materialValue: 0, xpValue: Math.round(bonusXP * 0.35), hpValue: 0, scale: 0.082 });
            this.createLootDrop(defeatedEntity.x, defeatedEntity.y, { type: 'gift-chest', goldValue: Math.round(baseGold * 0.45), materialValue: baseMats, xpValue: Math.round(bonusXP * 0.65), hpValue: Phaser.Math.Between(8, 20), scale: 0.082 });
            if (isMonster || Phaser.Math.Between(0, 100) < 40) {
                this.createLootDrop(defeatedEntity.x, defeatedEntity.y, { type: 'xp-orb', goldValue: 0, materialValue: isMonster ? Phaser.Math.Between(1, 3) : 0, xpValue: bonusXP, hpValue: 0, scale: 0.12 });
            }
        }
    }

    collectGift(player, gift) {
        player.heal(gift.hpValue);
        const xpBonus = this.playerShipBonus?.xpMult ? Math.round((gift.xpValue ?? 0) * this.playerShipBonus.xpMult) : (gift.xpValue ?? 0);
        player.addXP(xpBonus);
        const rawGold   = gift.goldValue ?? (gift.xpValue * 2);
        const goldMult  = this.playerShipBonus?.goldMult ?? 1;
        const goldGained = Math.round(rawGold * goldMult);
        player.gold += goldGained;
        player.materials += gift.materialValue ?? 0;
        this.events.emit('gold-collected', goldGained);
        if (goldGained > 0) {
            this.dailyQuestPanel?.addProgress('gold_collected', goldGained);
            this._updateTrialProgress('gold_collected', goldGained);
        }
        if ((gift.materialValue ?? 0) > 0) {
            this.dailyQuestPanel?.addProgress('mats_collected', gift.materialValue);
            this._updateTrialProgress('mats_collected', gift.materialValue);
            this._logbookAdd('mats_total', gift.materialValue);
        }
        if (gift.dropCategory === 'treasure') {
            this.dailyQuestPanel?.addProgress('treasures', 1);
            this._logbookAdd('treasures_opened');
        }

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
        this.goldContainer.setVisible(false);

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
        this.seaGateContainer.setVisible(false);

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
        this.chatPanel.setVisible(false);

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
        this.panelQuickDock.setVisible(false);

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
        this.ammoRack.setVisible(false);
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

    _anyPanelOpen() {
        return !!(
            this.premiumShopPanel?.isOpen() ||
            this.missionPanel?.visible ||
            this.bonusPanel?.visible ||
            this.eventsPanel?.visible ||
            this.rangPanel?.visible ||
            this.boardPanel?.visible ||
            this.combatPanel?.visible
        );
    }

    handleMenuAction(action) {
        if (action === 'menu') {
            this.domNavBar?.toggle();
            return;
        }
        if (action === 'shipyard') {
            this.shipDesignPanel?.toggle();
            return;
        }
        if (action === 'shop') {
            this.premiumShopPanel?.toggle();
            return;
        }
        if (action === 'guild') {
            this.guildPanel?.toggle();
            return;
        }
        if (action === 'shipevents') {
            this.shipEventPanel?.toggle();
            return;
        }
        if (action === 'chat') {
            this.domChatPanel?.toggle();
            return;
        }
        if (action === 'admin') {
            this.adminPanel?.toggle();
            return;
        }
        if (action === 'talent') {
            this.shipDesignPanel?.openOnTab('talent');
            return;
        }
        if (action === 'multiplayer') {
            this.multiplayerPanel?.toggle();
            return;
        }
        if (action === 'cannon') {
            this.cannonUpgradePanel?.toggle();
            return;
        }
        if (action === 'board') {
            this.boardPanel?.toggle();
            return;
        }
        if (action === 'combat') {
            this.combatPanel?.toggle();
            return;
        }
        if (action === 'feed') {
            this.toggleStatusFeedSize();
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
        if (action === 'quests') {
            this.dailyQuestPanel?.toggle();
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
        if (action === 'achievements') {
            this.achievementPanel?.toggle();
            return;
        }
        if (action === 'logbook') {
            this.logbookPanel?.toggle();
            return;
        }
        if (action === 'hafen') {
            this.hafenPanel?.toggle();
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

        const isLandscape = width > height;
        const navBarH = isLandscape ? 52 : 62;
        const navH = (this.domNavBar?.visible !== false) ? (navBarH + 4) : 4;

        if (this.minimap) {
            const minimapMargin = 12;
            const toggleGap = 8;
            const toggleSize = 32;
            const minimapDefaultX = width - this.minimap.getRenderWidth() - minimapMargin;
            const minimapDefaultY = navH + 6;
            const minimapPos = this.getPanelPosition('minimap');
            if (!this.uiPanelPositions.minimap) {
                this.setPanelPosition('minimap', minimapDefaultX, minimapDefaultY);
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

        this.goldContainer.setPosition(12, navH);

        this.progressContainer.setVisible(false);

        if (isLandscape) {
            this.progressContainer.setPosition(width - 248, navH);

            this.targetHUD.x = width / 2;
            this.targetHUD.y = navH + 18;
            this.returnToShipBtn.setVisible(false);
            this.actionsContainer.setVisible(false);
            this.minimapToggleBtn.setVisible(false);
            this.targetHUD.setVisible(false);

            this.chartNav?.setShipVisible(true);
            this.chartNav?.setAttackVisible(!!(this.TargetEnemy && this.TargetEnemy.active));

            if (this.leftTargetPanel) {
                this.leftTargetPanel.setPosition(18, navH + 84);
            }

            const chatH = this.isChatMinimized ? 44 : 168;
            const feedH = this.isStatusFeedMinimized ? 44 : 120;

            this.chatPanel.setPosition(16, height - chatH - 6);
            this.chatPanel.setVisible(false);
            this.chatDragHandle.container.setPosition(166, 8);
            this.chatToggleHit.setPosition(202, -4);
            this.chatToggleHit.setSize(44, 40);

            this.statusFeedPanel.setPosition(16, height - chatH - feedH - 12);
            this.statusFeedDragHandle.container.setPosition(130, 8);

            this.actionsContainer.setPosition(width - 178, height - 138);

            this.upgradePanel.setPosition(width - 404, navH + 44);
            this.upgradePanelDragHandle.container.setPosition(248, 10);

            this.navBar.setPosition(width / 2, 10);
        } else {
            this.progressContainer.setPosition(width - 248, navH);

            this.targetHUD.x = width / 2;
            this.targetHUD.y = navH + 40;

            this.returnToShipBtn.setPosition(24, height - 156);
            this.returnToShipBtn.setVisible(true);
            this.returnToShipHit.setPosition(-6, -6);
            this.returnToShipHit.setSize(196, 76);

            this.chatPanel.setPosition(24, height - 200);
            this.chatPanel.setVisible(false);
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
        this.navBar.setVisible(false);

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
        this.domNavBar?.updateStats(this.player.xp, 100 * this.player.level, this.player.hp, this.player.maxHP, this.player.goldDeckSlots, this.player.pearlDeckSlots, this.player.gold, this.player.materials);
        this._updateItemBar();
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
            const { width: _tw, height: _th } = this.scale;
            this.targetHUD.setVisible(_tw <= _th);
            this.leftTargetPanel.setVisible(true);
            const targetLabel = this.selectedTarget.isGuildTowerProxy ? 'Gildeninsel'
                : this.selectedTarget instanceof Monster ? 'Sea Monster' : 'Enemy Ship';
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
        const healed = Math.round(amount);
        const text = this.add.text(x, y, `+${healed}`, {
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

        if (healed > 0) {
            this.dailyQuestPanel?.addProgress('hp_healed', healed);
            this._logbookAdd('hp_healed', healed);
        }
    }

    getSelectedAmmoConfig() {
        return this.player.getAmmoConfig(this.currentAmmoType);
    }

    getCannonCombatStats() {
        const ammo = this.getSelectedAmmoConfig();
        const ammoMultiplier = this.player.getAmmoMultiplier(this.currentAmmoType);
        const totalDamagePerShot = this.player.getTotalDamagePerShot(ammoMultiplier);
        const stats = {
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
        /* Apply cannon tier bonus (Einfach → Gut → Stark → Episch → Legendär) */
        const tier = this.playerCannonTier ?? 0;
        if (tier > 0) CannonUpgradePanel.applyTierBonus(stats, tier);
        return stats;
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
        this.ammoBar?._setActive(type);
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

        const { width: w2, height: h2 } = this.scale;
        const isLand = w2 > h2;
        this.chartNav?.setAttackVisible(hasTarget);

        if (this.attackBtn) this.attackBtn.setVisible(hasTarget && !isLand);
        if (this.attackLabel) {
            this.attackLabel.setVisible(hasTarget && !isLand);
            this.attackLabel.setText('ATTACK');
        }

        if (this.attackBtnHit) {
            this.attackBtnHit.setVisible(hasTarget && !isLand);
            if (hasTarget && !isLand) this.attackBtnHit.setInteractive({ useHandCursor: true });
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
            if (hasTarget && !isLand) {
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
        this._logbookAdd('shots_fired');
        this.hafenPanel?.trackVertrag?.('shots_fired', 1);

        let appliedDamage = isHarpoon
            ? Phaser.Math.Between(damageProfile.minDamage, damageProfile.maxDamage)
            : resolvedDamage;
        appliedDamage = this.player.applyCritBonus?.(appliedDamage) ?? appliedDamage;
        if (this._blitzpulverActive && !isHarpoon) {
            appliedDamage = Math.round(appliedDamage * 3);
            this._blitzpulverActive = false;
            delete this.player.activeEffects?.blitzpulver;
            this.showStatusMsg('⚡ BLITZSCHUSS! 3× Schaden!', 0xffe84a);
        }
        if (this._rumActive) {
            const xpBonus = Math.round(appliedDamage * 0.05);
            if (xpBonus > 0) this.dailyQuestPanel?.addProgress('xp_gained', xpBonus);
        }
        /* Apply rage damage bonus */
        if (this._rageModeActive && this.player.rageDamageBonus) {
            appliedDamage = Math.round(appliedDamage * (1 + this.player.rageDamageBonus));
        }
        /* Apply ship class damage bonus */
        if (this.playerShipBonus?.damageMult && this.playerShipBonus.damageMult !== 1) {
            appliedDamage = Math.round(appliedDamage * this.playerShipBonus.damageMult);
        }
        /* Apply lucky charm crit bonus */
        const charm = this.player.activeEffects?.luckyCharm;
        if (charm && Date.now() < charm.endTime && Math.random() < (charm.critBonus ?? 0)) {
            appliedDamage = Math.round(appliedDamage * 2);
            this.showEnemyDamageFloat(target.x, target.y, appliedDamage, true);
        } else {
            this.showEnemyDamageFloat(target.x, target.y, appliedDamage, false);
        }

        target.takeDamage(appliedDamage);
        this.events.emit('damage-dealt', appliedDamage);

        /* --- Island tower destroyed → check conquest --- */
        if (target.isIslandTower && !target.active) {
            this._checkIslandConquest(target.parentIsland);
        }

        try { this.spawnProjectile(target, isHarpoon, ammoConfig); } catch (e) {}

        if (!target.active || target.hp <= 0) {
            /* Guild tower: try to auto-select next active tower instead of aborting */
            if (target.isGuildTowerProxy) {
                this._trySelectNextGuildTower(target.guildIsland, target.towerIndex);
            } else {
                this.clearTargetAndAttackState();
            }
            return true;
        }

        this.time.delayedCall(300, () => {
            if (target && target.active && this.player && this.player.active) {
                /* Guild towers fire a fixed cannon volley instead of % of maxHP */
                const counterDamage = target.isGuildTowerProxy
                    ? Phaser.Math.Between(35, 65)
                    : Math.max(12, Math.round((target.maxHP ?? 200) * 0.035));
                this.player.takeDamage(counterDamage);
                this.playSound('hit');
                if (target.isGuildTowerProxy) {
                    this.showEnemyDamageFloat?.(this.player.x, this.player.y - 20, counterDamage, false);
                }
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
        const ammoKey = isHarpoon ? 'harpoon' : (ammoConfig?.key ?? 'cannonball');

        /* Golden cannonball override for Episch (3) and Legendär (4) tier */
        const _tier = this.playerCannonTier ?? 0;
        const AMMO_VISUALS = {
            cannonball: _tier >= 3
                ? { color:0xffd700, trail:0xff9900, size:9,  trailSize:14, duration:195, impactColor:0xffcc00, impactR:30, impactParticles:8, particleColor:0xffa500, golden:true }
                : { color:0xdddddd, trail:0xaaaaaa, size:7,  trailSize:8,  duration:210, impactColor:0xffffff, impactR:22, impactParticles:4,  particleColor:0xdddddd },
            flare:      { color:0xff7700, trail:0xff4400, size:8,  trailSize:14, duration:200, impactColor:0xff6600, impactR:30, impactParticles:8,  particleColor:0xffaa00 },
            fire:       { color:0xff2200, trail:0xff6600, size:10, trailSize:18, duration:190, impactColor:0xff3300, impactR:40, impactParticles:12, particleColor:0xff6600 },
            storm:      { color:0xaa44ff, trail:0x6600ff, size:8,  trailSize:16, duration:170, impactColor:0xcc88ff, impactR:35, impactParticles:10, particleColor:0x8844ff },
            chainshot:  { color:0x88ccff, trail:0x4488ff, size:7,  trailSize:10, duration:230, impactColor:0x63d6ff, impactR:28, impactParticles:6,  particleColor:0x88ddff },
            grapeshot:  { color:0xffee66, trail:0xffaa00, size:5,  trailSize:8,  duration:200, impactColor:0xffcc44, impactR:20, impactParticles:6,  particleColor:0xffee66 },
            harpoon:    { color:0xdff9ff, trail:0x9beeff, size:6,  trailSize:12, duration:180, impactColor:0xdff9ff, impactR:18, impactParticles:3,  particleColor:0x9beeff },
        };
        const vis = AMMO_VISUALS[ammoKey] ?? AMMO_VISUALS.cannonball;

        if (ammoKey === 'grapeshot') {
            const spreadCount = 5;
            for (let i = 0; i < spreadCount; i++) {
                const spreadAngle = facingAngle + Phaser.Math.FloatBetween(-0.18, 0.18);
                const px = spawnX + Math.cos(spreadAngle) * 5;
                const py = spawnY + Math.sin(spreadAngle) * 5;
                const tx = target.x + Math.cos(spreadAngle) * Phaser.Math.Between(-18, 18);
                const ty = target.y + Math.sin(spreadAngle) * Phaser.Math.Between(-18, 18);
                const pellet = this.add.circle(px, py, vis.size - 1, vis.color, 1).setDepth(1200);
                const delay = i * 18;
                this.time.delayedCall(delay, () => {
                    this.tweens.add({
                        targets: pellet, x: tx, y: ty, duration: vis.duration,
                        ease: 'Linear',
                        onComplete: () => {
                            this._spawnImpact(pellet.x, pellet.y, vis, false);
                            pellet.destroy();
                        }
                    });
                });
            }
            return;
        }

        if (ammoKey === 'chainshot') {
            const ball1 = this.add.circle(spawnX - 6, spawnY - 3, vis.size - 1, vis.color, 1).setDepth(1200);
            const ball2 = this.add.circle(spawnX + 6, spawnY + 3, vis.size - 1, vis.color, 1).setDepth(1200);
            const chain = this.add.graphics().setDepth(1199);
            this.tweens.add({
                targets: [ball1, ball2], x: target.x, y: target.y, duration: vis.duration, ease: 'Sine.Out',
                onUpdate: () => {
                    chain.clear();
                    chain.lineStyle(2, vis.trail, 0.7);
                    chain.beginPath();
                    chain.moveTo(ball1.x, ball1.y);
                    chain.lineTo(ball2.x, ball2.y);
                    chain.strokePath();
                },
                onComplete: () => {
                    chain.destroy(); ball1.destroy(); ball2.destroy();
                    this._spawnImpact(target.x, target.y, vis, true);
                }
            });
            return;
        }

        if (ammoKey === 'storm') {
            const ball = this.add.circle(spawnX, spawnY, vis.size, vis.color, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(1200);
            const aura = this.add.circle(spawnX, spawnY, vis.trailSize, vis.trail, 0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(1199);
            const lightning = this.add.graphics().setDepth(1201);
            this.tweens.add({
                targets: [ball, aura], x: target.x, y: target.y, duration: vis.duration, ease: 'Sine.Out',
                onUpdate: () => {
                    aura.setPosition(ball.x, ball.y);
                    if (Math.random() < 0.4) {
                        lightning.clear();
                        lightning.lineStyle(1.5, vis.trail, 0.8);
                        lightning.beginPath();
                        lightning.moveTo(ball.x, ball.y);
                        const lx = ball.x + Phaser.Math.Between(-18, 18);
                        const ly = ball.y + Phaser.Math.Between(-18, 18);
                        lightning.lineTo(lx, ly);
                        lightning.strokePath();
                        this.time.delayedCall(50, () => lightning.clear());
                    }
                },
                onComplete: () => {
                    lightning.destroy(); ball.destroy(); aura.destroy();
                    this._spawnImpact(target.x, target.y, vis, true);
                    for (let i = 0; i < 4; i++) {
                        const lg = this.add.graphics().setDepth(1202).setBlendMode(Phaser.BlendModes.ADD);
                        lg.lineStyle(1.5, vis.particleColor, 0.9);
                        lg.beginPath();
                        const angle = (i / 4) * Math.PI * 2;
                        lg.moveTo(target.x, target.y);
                        lg.lineTo(target.x + Math.cos(angle) * 28, target.y + Math.sin(angle) * 28);
                        lg.strokePath();
                        this.tweens.add({ targets: lg, alpha: 0, duration: 300, onComplete: () => lg.destroy() });
                    }
                }
            });
            return;
        }

        const projectile = this.add.circle(spawnX, spawnY, vis.size, vis.color, 1)
            .setBlendMode(ammoKey !== 'cannonball' ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL)
            .setDepth(1200);
        const trail = this.add.circle(spawnX, spawnY, vis.trailSize, vis.trail, 0.4)
            .setBlendMode(Phaser.BlendModes.ADD).setDepth(1199);

        if (ammoKey === 'fire') {
            for (let i = 0; i < 3; i++) {
                this.time.delayedCall(i * 30, () => {
                    const spark = this.add.circle(spawnX, spawnY, 3, 0xff6600, 0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(1198);
                    this.tweens.add({
                        targets: spark, x: spawnX + Phaser.Math.Between(-12, 12), y: spawnY + Phaser.Math.Between(-12, 12),
                        alpha: 0, scale: 0.2, duration: 200, onComplete: () => spark.destroy()
                    });
                });
            }
        }

        this.tweens.add({
            targets: [projectile, trail], x: target.x, y: target.y, duration: vis.duration, ease: 'Sine.Out',
            onUpdate: () => { trail.setPosition(projectile.x, projectile.y); trail.alpha = projectile.alpha * 0.5; },
            onComplete: () => {
                trail.destroy(); projectile.destroy();
                this._spawnImpact(target.x, target.y, vis, ammoKey !== 'cannonball');
            }
        });
    }

    _spawnImpact(x, y, vis, large = false) {
        const r = large ? vis.impactR : vis.impactR * 0.6;
        const ring = this.add.circle(x, y, 4, vis.impactColor, 0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(1202);
        this.tweens.add({
            targets: ring, scaleX: r / 4, scaleY: r / 4, alpha: 0, duration: large ? 320 : 220,
            onComplete: () => ring.destroy()
        });
        const flash = this.add.circle(x, y, large ? 16 : 10, vis.impactColor, 0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(1201);
        this.tweens.add({ targets: flash, alpha: 0, scale: 0.1, duration: 180, onComplete: () => flash.destroy() });

        const count = vis.impactParticles ?? 4;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3);
            const dist = Phaser.Math.Between(large ? 16 : 8, large ? 32 : 18);
            const spark = this.add.circle(x, y, Phaser.Math.Between(2, 4), vis.particleColor, 1)
                .setBlendMode(Phaser.BlendModes.ADD).setDepth(1203);
            this.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
                alpha: 0, scale: 0.2, duration: Phaser.Math.Between(180, 320),
                onComplete: () => spark.destroy()
            });
        }

        try {
            const exp = this.add.image(x, y, 'explosion')
                .setScale(large ? 0.22 : 0.12)
                .setTint(vis.impactColor)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setDepth(1200);
            this.time.delayedCall(180, () => exp.destroy());
        } catch {}
    }

    showDamagePopup(x, y, damage) {
        if (damage === 0 || damage === '0') return;
        const isDodge = damage === 'DODGE';
        const critLike = !isDodge && damage >= 25;
        const label = isDodge ? 'DODGE!' : `-${damage}`;
        const text = this.add.text(x, y, label, {
            fontSize: isDodge ? '28px' : critLike ? '36px' : '32px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: isDodge ? '#63d6ff' : critLike ? '#ff5b5b' : '#ffd95c',
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
        const text = this.add.text(width / 2, 92, msg, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: Phaser.Display.Color.IntegerToColor(color).rgba,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(4600);

        this.pushStatusFeedMessage(msg, Phaser.Display.Color.IntegerToColor(color).rgba);

        this.tweens.add({
            targets: text,
            y: 72,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    setupSounds() {
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.noiseSynth = new Tone.NoiseSynth().toDestination();
    }

    playSound(type) {
        if (!this.soundInitialized) return;
        try {
            const now = Tone.now();
            if (type === 'shoot') {
                this.synth.triggerAttackRelease('C2', '8n', now);
                this.noiseSynth.triggerAttackRelease('8n', now + 0.001);
            } else if (type === 'collect') {
                this.synth.triggerAttackRelease('G4', '16n', now);
                this.synth.triggerAttackRelease('C5', '16n', now + 0.1);
            } else if (type === 'hit') {
                this.noiseSynth.triggerAttackRelease('16n', now);
            }
        } catch (_e) {}
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
        if (!this._lastAutoSave) this._lastAutoSave = time;
        if (time - this._lastAutoSave > 60000) {
            this._lastAutoSave = time;
            this._saveProgress();
        }

        this.player.update();

        /* --- Island towers shoot at the player --- */
        this._towerShootAccum = (this._towerShootAccum ?? 0) + delta;
        if (this._towerShootAccum > 2600 && this.player?.active) {
            this._towerShootAccum = 0;
            this.islandTowerGroup?.getChildren().forEach(tower => {
                if (tower.isDead || !tower.active) return;
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, tower.x, tower.y);
                if (dist < 420) this._fireTowerProjectile(tower);
            });
        }

        if (this.inventoryHit?.input) this.inventoryHit.input.enabled = true;
        if (this.shopHit?.input) this.shopHit.input.enabled = true;
        if (this.mapHit?.input) this.mapHit.input.enabled = true;
        if (this.returnToShipHit?.input) this.returnToShipHit.input.enabled = true;
        if (this.chatToggleHit?.input) this.chatToggleHit.input.enabled = true;
        if (this.chatSendHit?.input) this.chatSendHit.input.enabled = !this.isChatMinimized;
        if (this.statusFeedToggleHit?.input) this.statusFeedToggleHit.input.enabled = true;

        /* ── Guild island push-back: prevent ship from sailing inside fortress ── */
        if (this.guildIsland && this.player?.active) {
            const gi = this.guildIsland;
            const EXCLUSION_RADIUS = 185;
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, gi.x, gi.y);
            if (d < EXCLUSION_RADIUS) {
                const angle = Phaser.Math.Angle.Between(gi.x, gi.y, this.player.x, this.player.y);
                this.player.x = gi.x + Math.cos(angle) * EXCLUSION_RADIUS;
                this.player.y = gi.y + Math.sin(angle) * EXCLUSION_RADIUS;
                if (this.player.body) {
                    this.player.body.velocity.x = Math.cos(angle) * 200;
                    this.player.body.velocity.y = Math.sin(angle) * 200;
                }
            }
            this._updateGuildAttackBtn(d);
        } else {
            this._updateGuildAttackBtn(Infinity);
        }

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
            /* Small circle reticle only — no large box */
            this.targetIndicatorReticle?.lineStyle(2, 0xffe49a, 0.88);
            this.targetIndicatorReticle?.strokeCircle(activeCombatTarget.x, activeCombatTarget.y, indicatorRadius + cornerGap + 4);
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

        /* TilePosition 1:1 mit Kamera → Wasser scrollt mit Welt, UI bleibt fixiert */
        if (this.background) {
            this.background.tilePositionX = this.cameras.main.scrollX;
            this.background.tilePositionY = this.cameras.main.scrollY;
        }

        this.updateUIBars();
    }

    /* ═══════════════════ ITEM SYSTEM ═══════════════════ */

    _initItemSystem() {
        if (!this.player.inventory) this.player.inventory = {};
        if (!this.player.activeEffects) this.player.activeEffects = {};
        this._blitzpulverActive = false;
        this._rumActive = false;
        this._rumExpiry = 0;
        this._grogActive = false;
        this._grogExpiry = 0;
        this._playerBaseSpeed = this.player.speed;
        this._initLogbook();
        this._initStormSystem();
        this._startTreasureChestTimer();
        this.time.delayedCall(60000, () => this._scheduleMerchant()); /* Merchant: first spawn after 1 min */
    }

    _recalcPlayerSpeed() {
        if (!this.player) return;
        const base  = this._playerBaseSpeed ?? this.player.speed;
        const bonus = this.playerShipBonus ?? {};
        let s = base;
        /* Storm applied FIRST to base — grog cannot negate storm penalty */
        if (this._stormActive && !bonus.stormImmune)       s = Math.round(Math.max(base * 0.68, s * 0.65));
        /* Grog: +40% speed, capped at base during storm, or base×1.5 normally */
        if (this._grogActive)                              s = Math.round(Math.min(s * 1.40, this._stormActive ? base * 1.0 : base * 1.50));
        if (bonus.speedMult && bonus.speedMult !== 1)      s = Math.round(s * bonus.speedMult);
        this.player.speed = s;
    }

    /* ═══════════════════ WANTED SYSTEM ════════════════════ */

    _initWantedSystem() {
        this._wantedLevel = 0;

        /* Build HUD element */
        if (this._wantedHudEl) this._wantedHudEl.remove();
        const el = document.createElement('div');
        el.id = 'wanted-hud';
        el.style.cssText = `
            position:fixed; top:72px; right:8px; z-index:10500;
            background:rgba(8,14,28,0.88);
            border:1px solid rgba(255,60,60,0.45);
            border-radius:6px; padding:5px 10px;
            font-family:Arial,sans-serif; color:#ff4444;
            font-size:11px; font-weight:bold;
            display:none; flex-direction:column; align-items:center; gap:2px;
            pointer-events:none; min-width:90px; text-align:center;
            box-shadow:0 0 12px rgba(255,40,40,0.3);
        `;
        el.innerHTML = `
            <div style="letter-spacing:1px;font-size:9px;color:#ff8888;margin-bottom:1px;">FAHNDUNG</div>
            <div id="wanted-stars" style="font-size:14px;letter-spacing:2px;"></div>
            <div id="wanted-status" style="font-size:8px;color:#ff9999;margin-top:1px;"></div>
        `;
        document.body.appendChild(el);
        this._wantedHudEl = el;
    }

    _addWanted(amount = 0.4) {
        if (!this.player) return;
        this._wantedLevel = Math.min(5, (this._wantedLevel ?? 0) + amount);
        this._updateWantedHUD();

        /* Spawn bounty hunters at threshold crossings */
        const lvl = Math.floor(this._wantedLevel);
        if (lvl >= 1 && !this._bountyHunterActive) {
            this._bountyHunterActive = true;
            this._scheduleBountyHunters(lvl);
        }
    }

    _scheduleBountyHunters(wantedFloor) {
        if (!this.player) return;
        const interval = wantedFloor >= 4 ? 30000 : wantedFloor >= 3 ? 40000 : 55000;
        const count    = wantedFloor >= 4 ? 2 : 1;
        this._bountyHunterTimer = this.time.addEvent({
            delay: interval,
            callback: () => {
                if (!this.player?.active || (this._wantedLevel ?? 0) < 1) {
                    this._bountyHunterActive = false;
                    return;
                }
                for (let i = 0; i < count; i++) {
                    this.spawnNPC({ isBountyHunter: true, chartLevel: this.currentChartIndex });
                }
                const wlvl = Math.floor(this._wantedLevel ?? 0);
                if (wlvl >= 5) {
                    this.showStatusMsg('🔴 ADMIRAL AUF DER JAGD! Höchste Fahndungsstufe!', 0xff2200);
                    this._addWanted(0); /* refresh HUD */
                }
                /* Reschedule with updated level */
                this._scheduleBountyHunters(wlvl);
            },
            callbackScope: this,
            loop: false
        });
    }

    _updateWantedHUD() {
        const el = this._wantedHudEl;
        if (!el) return;
        const lvl = this._wantedLevel ?? 0;
        if (lvl < 0.5) {
            el.style.display = 'none';
            this._bountyHunterActive = false;
            return;
        }
        el.style.display = 'flex';
        const filled  = Math.min(5, Math.ceil(lvl));
        const starEl  = el.querySelector('#wanted-stars');
        const statEl  = el.querySelector('#wanted-status');
        if (starEl) starEl.textContent = '⭐'.repeat(filled) + '☆'.repeat(5 - filled);
        if (statEl) {
            const msgs = ['', 'Kopfgeldjäger erscheinen', 'Elitejäger spawnen', 'Admiral in der Nähe!', '⚠ HÖCHSTE FAHNDUNG'];
            statEl.textContent = msgs[Math.min(4, filled - 1)] ?? '';
        }
        /* Decay wanted level slowly over time (passive cooldown) */
        if (!this._wantedDecayTimer) {
            this._wantedDecayTimer = this.time.addEvent({
                delay: 15000,
                callback: () => {
                    if ((this._wantedLevel ?? 0) > 0) {
                        this._wantedLevel = Math.max(0, this._wantedLevel - 0.15);
                        this._updateWantedHUD();
                        if ((this._wantedLevel ?? 0) < 0.5) {
                            this._wantedDecayTimer?.remove(false);
                            this._wantedDecayTimer = null;
                        }
                    }
                },
                callbackScope: this,
                loop: true
            });
        }
    }

    /* ═══════════════════ SHIP UPGRADES ═══════════════════ */

    _initPlayerUpgrades() {
        const uKey = `ahc_upgrades_${window._loginUsername ?? 'player'}`;
        try {
            const saved = JSON.parse(localStorage.getItem(uKey) || 'null');
            this.playerUpgrades = saved ?? { hull: 0, cannon: 0, reload: 0, speed: 0, luck: 0, crew: 0 };
        } catch { this.playerUpgrades = { hull: 0, cannon: 0, reload: 0, speed: 0, luck: 0, crew: 0 }; }
        this._applyPlayerUpgrades();
    }

    _applyPlayerUpgrades() {
        const up = this.playerUpgrades ?? {};
        const p  = this.player;
        if (!p) return;
        /* Hull: +25 max HP per level */
        const baseHP = p._baseMaxHP ?? 300;
        p._baseMaxHP  = baseHP;
        p.maxHP       = baseHP + (up.hull ?? 0) * 25;
        /* Speed: modify base speed (+5% per level) */
        const rawBase = p._baseSpeedRaw ?? p.speed;
        p._baseSpeedRaw     = rawBase;
        this._playerBaseSpeed = Math.round(rawBase * (1 + (up.speed ?? 0) * 0.05));
        this._recalcPlayerSpeed();
    }

    _buyShipUpgrade(type) {
        const COSTS = [300, 700, 1400, 2800, 5500];
        if (!this.playerUpgrades) this._initPlayerUpgrades();
        const cur  = this.playerUpgrades[type] ?? 0;
        if (cur >= 5) { this.showStatusMsg?.('Bereits auf Maximal-Stufe!', 0xffaa44); return; }
        const cost = COSTS[cur];
        if ((this.player?.gold ?? 0) < cost) { this.showStatusMsg?.('Nicht genug Gold!', 0xff6644); return; }
        this.player.gold -= cost;
        this.playerUpgrades[type] = cur + 1;
        try {
            localStorage.setItem(`ahc_upgrades_${window._loginUsername ?? 'player'}`, JSON.stringify(this.playerUpgrades));
        } catch {}
        this._applyPlayerUpgrades();
        this.showStatusMsg?.(`🔧 ${type} auf Stufe ${cur + 1} aufgerüstet!`, 0x38f287);
    }

    /* ═══════════════════ LOGBOOK SYSTEM ═══════════════════ */

    _initLogbook() {
        this._logbook = {
            npc_kills: 0, monster_kills: 0, gold_total: 0, mats_total: 0,
            hp_healed: 0, items_used: 0, treasures_opened: 0,
            charts_explored: new Set(), damage_dealt: 0, shots_fired: 0
        };
        if (this._ruf === undefined) this._ruf = 0;
    }

    /* ═══════════════════ RUF (REPUTATION) ════════════════════ */
    static RUF_TIERS = [
        { min: 0,    title: 'Unbekannt',            color: '#aaaaaa', icon: '⚓' },
        { min: 100,  title: 'Bekannter Seemann',    color: '#63d6ff', icon: '🌊' },
        { min: 500,  title: 'Gefürchteter Freibeuter', color: '#8bffba', icon: '⚔️' },
        { min: 1500, title: 'Berühmter Pirat',      color: '#ff9a5a', icon: '💀' },
        { min: 4000, title: 'Legendärer Kapitän',   color: '#ffd700', icon: '👑' },
        { min: 8000, title: 'Teufel der Meere',     color: '#ff4444', icon: '🔱' },
    ];

    getRufTier() {
        const ruf = this._ruf ?? 0;
        const tiers = GameScene.RUF_TIERS;
        let tier = tiers[0];
        for (const t of tiers) { if (ruf >= t.min) tier = t; else break; }
        return { ...tier, ruf };
    }

    _addRuf(amount, reason = '') {
        this._ruf = (this._ruf ?? 0) + amount;
        const tier = this.getRufTier();
        if (reason) this.pushStatusFeedMessage?.(`${tier.icon} +${amount} Ruf${reason ? ' · ' + reason : ''}`, '#d4aa40');
        this.rangPanel?._renderAll?.();
    }

    _logbookAdd(key, amount = 1) {
        if (!this._logbook) this._initLogbook();
        if (key === 'charts_explored') {
            this._logbook.charts_explored.add(amount);
        } else {
            this._logbook[key] = (this._logbook[key] ?? 0) + amount;
        }
        this.logbookPanel?.refresh?.();
        this.achievementPanel?.check?.(this._logbook);
    }

    addItem(type, count = 1) {
        if (!this.player?.inventory) return;
        this.player.inventory[type] = Math.min(99, (this.player.inventory[type] ?? 0) + count);
        this.itemBar?.update(this.player.inventory, this.player.activeEffects ?? {});
        this.itemBar?.showPickupFlash(type);
        const names = { heiltrunk:'Heiltrunk', grog:'Grog', blitzpulver:'Blitzpulver', rum:'Rum-Fass', fernrohr:'Fernrohr' };
        this.showStatusMsg(`📦 +${count}× ${names[type] ?? type} erhalten!`, 0xd4af37);
    }

    useItem(type) {
        if (!this.player?.inventory) return;
        const count = this.player.inventory[type] ?? 0;
        if (count <= 0) { this.showStatusMsg('Keine Items dieser Art!', 0xff6644); return; }

        this.player.inventory[type] = count - 1;
        this.dailyQuestPanel?.addProgress('items_used', 1);
        this._logbookAdd('items_used');

        if (type === 'heiltrunk') {
            const heal = Math.ceil(this.player.maxHP * 0.30);
            this.player.heal(heal);
            this.dailyQuestPanel?.addProgress('hp_healed', heal);
            this._logbookAdd('hp_healed', heal);
            this.showStatusMsg(`🧪 Heiltrunk getrunken! +${heal} HP`, 0xff6b6b);

        } else if (type === 'grog') {
            if (!this._playerBaseSpeed) this._playerBaseSpeed = this.player.speed;
            this._grogActive = true;
            this._grogExpiry = this.time.now + 30000;
            this.player.activeEffects = this.player.activeEffects ?? {};
            this.player.activeEffects.grog = true;
            this._recalcPlayerSpeed();
            this.showStatusMsg('🍺 Grog wirkt! +50% Geschwindigkeit für 30s', 0xffa040);
            this.time.delayedCall(30000, () => {
                if (this._grogActive) {
                    this._grogActive = false;
                    delete this.player.activeEffects?.grog;
                    this._recalcPlayerSpeed();
                    this.showStatusMsg('🍺 Grog-Effekt abgelaufen.', 0x888888);
                }
            });

        } else if (type === 'blitzpulver') {
            this._blitzpulverActive = true;
            this.player.activeEffects = this.player.activeEffects ?? {};
            this.player.activeEffects.blitzpulver = true;
            this.showStatusMsg('⚡ Blitzpulver bereit! Nächster Schuss: 3× Schaden', 0xffe84a);

        } else if (type === 'rum') {
            this._rumActive = true;
            this._rumExpiry = this.time.now + 60000;
            this.player.activeEffects = this.player.activeEffects ?? {};
            this.player.activeEffects.rum = true;
            this.showStatusMsg('🛢 Rum-Fass geöffnet! +100% XP für 60s', 0xc88040);
            this.time.delayedCall(60000, () => {
                this._rumActive = false;
                delete this.player.activeEffects?.rum;
                this.showStatusMsg('🛢 Rum-Effekt abgelaufen.', 0x888888);
            });

        } else if (type === 'fernrohr') {
            this._locateNearestTreasure();
        }

        this.itemBar?.update(this.player.inventory, this.player.activeEffects ?? {});
    }

    _locateNearestTreasure() {
        const chests = this.gifts?.getChildren().filter(g => g.dropCategory === 'treasure');
        if (!chests || chests.length === 0) {
            this.showStatusMsg('🔭 Fernrohr: Keine Schatztruhen in Sichtweite gefunden.', 0x9370db);
            return;
        }
        const nearest = chests.reduce((best, c) => {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
            return (!best || d < best.d) ? { c, d } : best;
        }, null);
        if (nearest) {
            const dx = nearest.c.x - this.player.x;
            const dy = nearest.c.y - this.player.y;
            const angle = Math.atan2(dy, dx);
            const dir = angle < -Math.PI*0.75 ? 'W' : angle < -Math.PI*0.25 ? 'N' : angle < Math.PI*0.25 ? 'O' : angle < Math.PI*0.75 ? 'S' : 'W';
            this.showStatusMsg(`🔭 Fernrohr: Schatztruhe ~${Math.round(nearest.d)}px Richtung ${dir}!`, 0x9370db);
            const marker = this.add.text(nearest.c.x, nearest.c.y - 36, '★ SCHATZ', {
                fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
                color: '#d4af37', stroke: '#000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(3000);
            this.tweens.add({ targets: marker, y: nearest.c.y - 60, alpha: 0, duration: 3500, onComplete: () => marker.destroy() });
        }
    }

    /* ═══════════════════ PIRATE TRIAL SYSTEM ═══════════════════ */

    _initTrialSystem() {
        this._activeTrial = null;
        this._trialProgress = {};
        const saved = localStorage.getItem(`ahc_trials_${window._loginUsername ?? 'player'}`);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this._trialProgress = data.progress ?? {};
                this._completedTrials = new Set(data.completed ?? []);
            } catch {}
        }
        this._completedTrials = this._completedTrials ?? new Set();
    }

    _saveTrialData() {
        localStorage.setItem(`ahc_trials_${window._loginUsername ?? 'player'}`, JSON.stringify({
            progress: this._trialProgress,
            completed: [...(this._completedTrials ?? [])]
        }));
    }

    _checkPirateTrial(level) {
        const trial = PIRATE_TRIALS.find(t => t.level === level && !this._completedTrials?.has(t.level));
        if (!trial) return null;
        this._activeTrial = { ...trial, progress: this._trialProgress[trial.level] ?? 0 };
        this.time.delayedCall(1200, () => {
            this.pirateTrialPanel?.show(this._activeTrial);
        });
        return `Piratenprüfung verfügbar: ${trial.name}`;
    }

    startPirateTrial(trial) {
        this._activeTrial = trial;
        this.showStatusMsg(`⚔ Piratenprüfung gestartet: ${trial.name}! ${trial.desc}`, 0xd4af37);
        this.pushStatusFeedMessage(`PRÜFUNG: ${trial.name}`, '#d4af37');
    }

    _updateTrialProgress(type, amount) {
        if (!this._activeTrial || this._activeTrial.type !== type) return;
        const trial = this._activeTrial;
        const prev = this._trialProgress[trial.level] ?? 0;
        if (prev >= trial.target) return;
        this._trialProgress[trial.level] = prev + amount;
        trial.progress = this._trialProgress[trial.level];
        this.pirateTrialPanel?.updateProgress(trial.progress, trial.target);
        this._saveTrialData();
        if (trial.progress >= trial.target) {
            this._completePirateTrial(trial);
        }
    }

    _completePirateTrial(trial) {
        if (this._completedTrials?.has(trial.level)) return;
        this._completedTrials?.add(trial.level);
        this._activeTrial = null;
        if (this.player) {
            this.player.gold += trial.goldReward ?? 0;
            this.player.gems = (this.player.gems ?? 0) + (trial.gemReward ?? 0);
            if (trial.itemReward) {
                Object.entries(trial.itemReward).forEach(([t, c]) => this.addItem(t, c));
            }
        }
        if (trial.skillReward) this.talentPanel?.addSkillPoint(trial.skillReward);
        this.updateUIBars();
        this._saveTrialData();
        this.showStatusMsg(`🏆 PRÜFUNG BESTANDEN: ${trial.name}! ${trial.rewardText}`, 0xffd700);
        this.pushStatusFeedMessage(`✓ ${trial.name} bestanden!`, '#ffd700');
        const banner = this.add.text(this.cameras.main.scrollX + this.scale.width / 2, this.cameras.main.scrollY + this.scale.height / 2, `🏆 PRÜFUNG BESTANDEN!\n${trial.name}`, {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#ffd700', stroke: '#000000', strokeThickness: 6, align: 'center'
        }).setOrigin(0.5).setDepth(9000).setScrollFactor(0);
        this.tweens.add({
            targets: banner, y: '-=80', alpha: 0, duration: 3500,
            delay: 1200, onComplete: () => banner.destroy()
        });
    }

    /* ═══════════════════ DROP ITEMS FROM ENEMIES ═══════════════════ */

    _dropRandomItem(x, y, chance = 0.15) {
        if (Math.random() > chance) return;
        /* Weighted drop pool — common items appear more often */
        const pool = [
            'heiltrunk', 'heiltrunk', 'heiltrunk', 'heiltrunk',  // 4× — häufigste Heilung
            'grog', 'grog', 'grog',                              // 3× — Speed
            'blitzpulver', 'blitzpulver',                        // 2× — Schaden
            'rum', 'rum',                                        // 2× — XP-Boost
            'fernrohr',                                          // 1× — Truhen-Radar
        ];
        const type = pool[Math.floor(Math.random() * pool.length)];
        const qty  = (type === 'heiltrunk' && Math.random() < 0.15) ? 2 : 1;
        const delay = Phaser.Math.Between(100, 400);
        this.time.delayedCall(delay, () => {
            if (!this.player?.active) return;
            this.addItem(type, qty);
            if (qty > 1) this.showStatusMsg(`🎁 Doppelter Drop: ${qty}× Item!`, 0xffcc44);
        });
    }

    /* ═══════════════════ TREASURE CHEST TIMER ═══════════════════ */

    _startTreasureChestTimer() {
        const spawnChest = () => {
            this._spawnTreasureChest();
            const next = Phaser.Math.Between(90000, 150000);
            this._treasureTimer = this.time.delayedCall(next, spawnChest);
        };
        this._treasureTimer = this.time.delayedCall(Phaser.Math.Between(30000, 60000), spawnChest);
    }

    _spawnTreasureChest(x, y) {
        const { worldWidth, worldHeight } = this.currentChartConfig ?? { worldWidth: 4000, worldHeight: 4000 };
        const cx = x ?? Phaser.Math.Between(200, worldWidth - 200);
        const cy = y ?? Phaser.Math.Between(200, worldHeight - 200);

        const chest = new Gift(this, cx, cy, {
            type: 'gift-chest',
            scale: 0.13,
            goldValue: Phaser.Math.Between(80, 220),
            materialValue: Phaser.Math.Between(15, 40),
            hpValue: 30,
            xpValue: 60,
            dropCategory: 'treasure'
        });
        if (this.gifts) this.gifts.add(chest);
        this.showStatusMsg('💰 Eine Schatztruhe ist erschienen!', 0xd4af37);
        this.pushStatusFeedMessage('💰 Schatztruhe erschienen!', '#d4af37');

        const glow = this.add.circle(cx, cy, 28, 0xd4af37, 0.18).setDepth(900);
        this.tweens.add({ targets: glow, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 1200, yoyo: true, repeat: -1 });
        chest.glowCircle = glow;

        this.time.delayedCall(120000, () => {
            if (chest?.active) { chest.destroy(); }
            if (glow?.active) { glow.destroy(); }
        });
    }

    /* ═══════════════════ STORM EVENT SYSTEM ═══════════════════ */

    _initStormSystem() {
        this._stormActive = false;
        this._stormOverlay = null;
        this._scheduleNextStorm();
    }

    _scheduleNextStorm() {
        const nextStorm = Phaser.Math.Between(180000, 360000);
        const WARN_SECS = 15;
        const warnAt    = Math.max(0, nextStorm - WARN_SECS * 1000);
        this._stormWarnTimer = this.time.delayedCall(warnAt, () => {
            if (this._stormActive) return;
            this.showStatusMsg(`⚠ STURMWARNUNG — Sturm in ${WARN_SECS} Sekunden!`, 0xffaa22);
            this.pushStatusFeedMessage('⚠ Sturmwarnung!', '#ffaa22');
            const flash = this.add.rectangle(0, 0, 20000, 20000, 0xff8800, 0.08)
                .setScrollFactor(0).setDepth(9).setOrigin(0);
            this.tweens.add({ targets: flash, alpha: 0, duration: 1200, yoyo: true, repeat: 2, onComplete: () => flash.destroy() });
            /* Visual countdown bar */
            this._showStormCountdown(WARN_SECS);
        });
        this._stormTimer = this.time.delayedCall(nextStorm, () => this._triggerStorm());
    }

    _showStormCountdown(seconds) {
        if (this._stormCdEl) { this._stormCdEl.remove(); this._stormCdEl = null; }
        const el = document.createElement('div');
        el.style.cssText = `
            position:fixed;top:52px;left:50%;transform:translateX(-50%);
            z-index:14000;background:rgba(8,14,28,0.92);
            border:2px solid rgba(255,140,0,0.8);border-radius:10px;
            padding:7px 18px;font-family:Arial,sans-serif;text-align:center;
            box-shadow:0 0 20px rgba(255,140,0,0.4);pointer-events:none;
            display:flex;align-items:center;gap:10px;min-width:200px;
        `;
        el.innerHTML = `
            <span style="font-size:18px;">⛈</span>
            <div style="flex:1;">
                <div style="font-size:10px;color:#ffaa22;font-weight:bold;letter-spacing:1px;">STURMWARNUNG</div>
                <div style="background:rgba(255,255,255,0.1);border-radius:4px;height:5px;margin-top:3px;overflow:hidden;">
                    <div id="storm-cd-bar" style="height:100%;width:100%;background:linear-gradient(90deg,#ff4400,#ffaa22);border-radius:4px;transition:width 1s linear;"></div>
                </div>
                <div id="storm-cd-text" style="font-size:11px;color:#fff;font-weight:bold;margin-top:2px;">${seconds}s</div>
            </div>
        `;
        document.body.appendChild(el);
        this._stormCdEl = el;
        let remaining = seconds;
        this._stormCdInterval = setInterval(() => {
            remaining--;
            const bar  = document.getElementById('storm-cd-bar');
            const text = document.getElementById('storm-cd-text');
            if (bar)  bar.style.width  = `${(remaining / seconds) * 100}%`;
            if (text) text.textContent  = remaining <= 0 ? '⚡ JETZT!' : `${remaining}s`;
            if (remaining <= 0) {
                clearInterval(this._stormCdInterval);
                setTimeout(() => { el.remove(); if (this._stormCdEl === el) this._stormCdEl = null; }, 1500);
            }
        }, 1000);
    }

    _triggerStorm() {
        if (this._stormActive) return;
        this._stormActive = true;
        /* Clear countdown bar if still showing */
        if (this._stormCdInterval) { clearInterval(this._stormCdInterval); this._stormCdInterval = null; }
        if (this._stormCdEl) { this._stormCdEl.remove(); this._stormCdEl = null; }
        this.showStatusMsg('🌩 STURM aufgezogen! Bewegung verlangsamt — bleibt wachsam!', 0x6688ff);
        this.pushStatusFeedMessage('🌩 Sturm aufgezogen!', '#6688ff');

        this._stormOverlay = this.add.rectangle(0, 0, 20000, 20000, 0x000044, 0.28)
            .setScrollFactor(0).setDepth(10).setOrigin(0);
        this._stormRain = [];
        const rainCount = Math.round(this.scale.width / 10);
        for (let i = 0; i < rainCount; i++) {
            const w = Phaser.Math.Between(1, 3);
            const h = Phaser.Math.Between(18, 42);
            const alpha = 0.35 + Math.random() * 0.45;
            const rain = this.add.rectangle(
                Phaser.Math.Between(0, this.scale.width),
                Phaser.Math.Between(-this.scale.height, this.scale.height),
                w, h, 0x99ccff, alpha
            ).setScrollFactor(0).setDepth(11).setRotation(0.18);
            this._stormRain.push(rain);
            this.tweens.add({
                targets: rain,
                y: this.scale.height + 60,
                x: `-=${Phaser.Math.Between(30, 70)}`,
                duration: Phaser.Math.Between(380, 780),
                repeat: -1,
                delay: Math.random() * 600,
                onRepeat: () => { rain.y = Phaser.Math.Between(-60, -10); rain.x = Phaser.Math.Between(0, this.scale.width); }
            });
        }
        if (this.player) {
            if (!this._playerBaseSpeed) this._playerBaseSpeed = this.player.speed;
            this._recalcPlayerSpeed();
        }
        const duration = Phaser.Math.Between(35000, 60000);
        this.time.delayedCall(duration, () => this._clearStorm());
    }

    _clearStorm() {
        if (!this._stormActive) return;
        this._stormActive = false;
        this._stormOverlay?.destroy();
        this._stormRain?.forEach(r => r.destroy());
        this._stormRain = [];
        if (this.player) {
            this._recalcPlayerSpeed();
        }
        this.showStatusMsg('☀ Der Sturm zieht ab. Belohnung im Wasser!', 0x88ccff);
        if (this.player?.active) {
            this._dropRandomItem(this.player.x + Phaser.Math.Between(-200, 200), this.player.y + Phaser.Math.Between(-200, 200), 1.0);
        }
        this.spawnGift();
        this._scheduleNextStorm();
    }

    /* ═══════════════════ ITEM BAR UPDATE ═══════════════════ */

    _updateItemBar() {
        if (!this.player || !this.itemBar) return;
        this.itemBar.update(this.player.inventory ?? {}, this.player.activeEffects ?? {});
    }

    /* ═══════════════════ PLAYER INFO HUD ═══════════════════ */

    _refreshPlayerInfoHUD() {
        if (!this.player || !this.domNavBar) return;
        const name  = window._loginUsername ?? 'Kapitän';
        const level = this.player.level ?? 1;
        let guildTag = null, guildName = null;
        try {
            const gData = JSON.parse(localStorage.getItem('ahc_my_guild') || 'null');
            if (gData) { guildTag = gData.tag ?? gData.name?.substring(0, 4).toUpperCase(); guildName = gData.name; }
        } catch (e) {}
        this.domNavBar.setPlayerInfo(name, level, guildTag, guildName);
    }
}

