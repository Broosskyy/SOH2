import Phaser from 'phaser';

export default class Minimap extends Phaser.GameObjects.Container {
    constructor(scene, x, y, size, worldWidth, worldHeight) {
        super(scene, x, y);

        this.scene = scene;
        this.fullSize = size;
        this.minimizedScale = 0.32;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.isMinimized = false;

        this.configureMetrics(this.fullSize);

        this.bg = scene.add.graphics();
        this.grid = scene.add.graphics();
        this.islandLayer = scene.add.graphics();
        this.entityLayer = scene.add.graphics();
        this.overlayLayer = scene.add.graphics();

        this.titleText = scene.add.text(10, 8, 'X: A1  Y: 1', {
            fontSize: '11px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffe89a',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0);

        this.badgeText = scene.add.text(this.panelWidth - 9, 8, '2D', {
            fontSize: '10px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#0a1824',
            backgroundColor: '#d4aa40',
            padding: { x: 4, y: 1 }
        }).setOrigin(1, 0);

        this.levelText = scene.add.text(10, this.footerY + 2, 'Lvl 1', {
            fontSize: '11px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.xpText = scene.add.text(this.panelWidth - 10, this.footerY + 2, 'XP', {
            fontSize: '11px',
            fontFamily: 'Arial',
            fill: '#91eeff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0);

        this.playerSectorText = scene.add.text(this.panelWidth / 2, this.footerY + 2, 'Chart 1', {
            fontSize: '11px',
            fontFamily: 'Arial',
            fill: '#ffe89a',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0);

        this.columnLabels = ['A', 'B', 'C', 'D'].map((label) => scene.add.text(0, 0, label, {
            fontSize: '11px',
            fontFamily: 'Arial',
            fill: '#8fd8ff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5));

        this.rowLabels = ['1', '2', '3', '4'].map((label) => scene.add.text(0, 0, label, {
            fontSize: '11px',
            fontFamily: 'Arial',
            fill: '#8fd8ff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5));

        this.xpBarBg = scene.add.graphics();
        this.xpBarFill = scene.add.graphics();

        this.add([
            this.bg,
            this.grid,
            this.islandLayer,
            this.entityLayer,
            this.overlayLayer,
            this.titleText,
            this.badgeText,
            ...this.columnLabels,
            ...this.rowLabels,
            this.levelText,
            this.playerSectorText,
            this.xpText,
            this.xpBarBg,
            this.xpBarFill
        ]);

        scene.add.existing(this);
        this.setScrollFactor(0);
        this.setDepth(2050);
        this.setScale(1);
        this.setSize(this.panelWidth, this.panelHeight);

        this.redrawFrame();
    }

    configureMetrics(size) {
        this.size = size;
        this.panelWidth = size;
        this.mapInset = 14;
        this.mapTop = 30;
        this.mapSize = size - (this.mapInset * 2);
        this.footerY = this.mapTop + this.mapSize + 8;
        this.panelHeight = this.footerY + 28;
        this.minimizedPanelHeight = this.mapSize + 16;
        this.xpBarWidth = this.panelWidth - 20;
    }

    getVisibleWidth() {
        return this.panelWidth;
    }

    getVisibleHeight() {
        return this.isMinimized ? this.minimizedPanelHeight : this.panelHeight;
    }

    getRenderWidth() {
        return this.getVisibleWidth() * this.scaleX;
    }

    getRenderHeight() {
        return this.getVisibleHeight() * this.scaleY;
    }

    setWorldMetrics(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
    }

    setChartInfo(chartIndex, chartName = null) {
        this.chartIndex = chartIndex;
        this.chartName = chartName ?? `Sea Chart ${chartIndex}`;
        this.titleText.setText(this.chartName);
    }

    setMinimized(minimized) {
        this.isMinimized = minimized;
        const scale = minimized ? this.minimizedScale : 1;
        this.setScale(scale);
        this.setSize(this.getVisibleWidth(), this.getVisibleHeight());
        this.redrawFrame();
    }

    _drawCornerDiamond(g, cx, cy, r) {
        g.fillStyle(0xd4aa40, 1);
        g.beginPath();
        g.moveTo(cx, cy - r);
        g.lineTo(cx + r, cy);
        g.lineTo(cx, cy + r);
        g.lineTo(cx - r, cy);
        g.closePath();
        g.fillPath();
        g.fillStyle(0xfff0a0, 0.8);
        g.fillCircle(cx, cy, r * 0.38);
    }

    redrawFrame() {
        this.bg.clear();
        this.grid.clear();
        this.xpBarBg.clear();

        const topOffset = this.isMinimized ? 8 : this.mapTop;
        const W = this.panelWidth;

        if (this.isMinimized) {
            const H = this.mapSize + 16;
            this.bg.fillStyle(0x1b0e04, 0.97);
            this.bg.fillRoundedRect(0, 0, W, H, 10);
            this.bg.lineStyle(4, 0xc8902a, 1);
            this.bg.strokeRoundedRect(0, 0, W, H, 10);
            this.bg.lineStyle(1.5, 0xffd070, 0.7);
            this.bg.strokeRoundedRect(3, 3, W - 6, H - 6, 8);
            this.bg.fillStyle(0x0d2030, 0.95);
            this.bg.fillRoundedRect(this.mapInset, topOffset, this.mapSize, this.mapSize, 6);
            this.bg.lineStyle(1.5, 0xb8902a, 0.9);
            this.bg.strokeRoundedRect(this.mapInset, topOffset, this.mapSize, this.mapSize, 6);
        } else {
            const H = this.panelHeight;
            this.bg.fillStyle(0x1b0e04, 0.97);
            this.bg.fillRoundedRect(0, 0, W, H, 10);

            this.bg.lineStyle(5, 0xa07020, 1);
            this.bg.strokeRoundedRect(0, 0, W, H, 10);
            this.bg.lineStyle(2, 0xffd060, 0.9);
            this.bg.strokeRoundedRect(2.5, 2.5, W - 5, H - 5, 8);
            this.bg.lineStyle(1, 0x7a5010, 0.7);
            this.bg.strokeRoundedRect(5, 5, W - 10, H - 10, 6);

            const r = 6;
            this._drawCornerDiamond(this.bg, r + 1, r + 1, r);
            this._drawCornerDiamond(this.bg, W - r - 1, r + 1, r);
            this._drawCornerDiamond(this.bg, r + 1, H - r - 1, r);
            this._drawCornerDiamond(this.bg, W - r - 1, H - r - 1, r);

            this.bg.fillStyle(0x0a1d2e, 0.97);
            this.bg.fillRoundedRect(this.mapInset, this.mapTop, this.mapSize, this.mapSize, 5);
            this.bg.lineStyle(2, 0xd4aa40, 0.85);
            this.bg.strokeRoundedRect(this.mapInset, this.mapTop, this.mapSize, this.mapSize, 5);
            this.bg.lineStyle(1, 0xfff0a0, 0.35);
            this.bg.strokeRoundedRect(this.mapInset + 2, this.mapTop + 2, this.mapSize - 4, this.mapSize - 4, 4);
        }

        this.grid.lineStyle(1, 0xd8c286, this.isMinimized ? 0.1 : 0.18);
        for (let i = 0; i <= 4; i++) {
            const offset = this.mapInset + ((this.mapSize / 4) * i);
            this.grid.beginPath();
            this.grid.moveTo(offset, topOffset);
            this.grid.lineTo(offset, topOffset + this.mapSize);
            this.grid.moveTo(this.mapInset, topOffset + ((this.mapSize / 4) * i));
            this.grid.lineTo(this.mapInset + this.mapSize, topOffset + ((this.mapSize / 4) * i));
            this.grid.strokePath();
        }

        this.columnLabels.forEach((label, index) => {
            label.setVisible(!this.isMinimized);
            if (!this.isMinimized) {
                label.setPosition(this.mapInset + ((this.mapSize / 4) * index) + (this.mapSize / 8), this.mapTop - 11);
            }
        });

        this.rowLabels.forEach((label, index) => {
            label.setVisible(!this.isMinimized);
            if (!this.isMinimized) {
                label.setPosition(this.mapInset - 9, this.mapTop + ((this.mapSize / 4) * index) + (this.mapSize / 8));
            }
        });

        this.titleText.setVisible(!this.isMinimized);
        this.badgeText.setVisible(!this.isMinimized);
        this.levelText.setVisible(!this.isMinimized);
        this.playerSectorText.setVisible(!this.isMinimized);
        this.xpText.setVisible(!this.isMinimized);
        this.xpBarBg.setVisible(!this.isMinimized);
        this.xpBarFill.setVisible(!this.isMinimized);

        if (!this.isMinimized) {
            this.xpBarBg.fillStyle(0x000000, 0.65);
            this.xpBarBg.fillRoundedRect(10, this.footerY + 14, this.xpBarWidth, 6, 3);
        }
    }

    worldToMap(x, y) {
        const topOffset = this.isMinimized ? 8 : this.mapTop;
        return {
            x: this.mapInset + ((x / this.worldWidth) * this.mapSize),
            y: topOffset + ((y / this.worldHeight) * this.mapSize)
        };
    }

    drawShipMarker(graphics, x, y, angle, color, size = 5) {
        const heading = angle ?? 0;
        const frontX = x + Math.cos(heading) * size;
        const frontY = y + Math.sin(heading) * size;
        const leftX = x + Math.cos(heading + 2.45) * (size * 0.8);
        const leftY = y + Math.sin(heading + 2.45) * (size * 0.8);
        const rightX = x + Math.cos(heading - 2.45) * (size * 0.8);
        const rightY = y + Math.sin(heading - 2.45) * (size * 0.8);
        const tailX = x - Math.cos(heading) * (size * 0.95);
        const tailY = y - Math.sin(heading) * (size * 0.95);

        graphics.lineStyle(Math.max(1, size * 0.22), color, 0.95);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(frontX, frontY);
        graphics.strokePath();

        graphics.fillStyle(color, 1);
        graphics.fillTriangle(frontX, frontY, leftX, leftY, rightX, rightY);
        graphics.fillStyle(0x0a1824, 0.7);
        graphics.fillCircle(tailX, tailY, Math.max(1, size * 0.28));
    }

    update(player, npcs, monsters, gifts, islands, camera, selectedTarget = null) {
        if (!player) return;

        this.islandLayer.clear();
        this.entityLayer.clear();
        this.overlayLayer.clear();

        if (islands) {
            this.islandLayer.fillStyle(0xb69a62, 0.95);
            this.islandLayer.lineStyle(1, 0xe6d19a, 0.85);

            islands.getChildren().forEach(island => {
                const mapPos = this.worldToMap(island.x, island.y);
                const radiusScale = island.getData && island.getData('minimapRadiusScale') ? island.getData('minimapRadiusScale') : 0.5;
                const radiusX = Phaser.Math.Clamp(((island.displayWidth || island.width) / this.worldWidth) * this.mapSize * radiusScale, 6, 18);
                const radiusY = Phaser.Math.Clamp(((island.displayHeight || island.height) / this.worldHeight) * this.mapSize * radiusScale, 6, 18);
                this.islandLayer.fillEllipse(mapPos.x, mapPos.y, radiusX * 2, radiusY * 2);
                this.islandLayer.strokeEllipse(mapPos.x, mapPos.y, radiusX * 2, radiusY * 2);
            });
        }

        if (camera) {
            const viewWidth = camera.width / camera.zoom;
            const viewHeight = camera.height / camera.zoom;
            const topLeft = this.worldToMap(camera.scrollX, camera.scrollY);
            const viewportWidth = (viewWidth / this.worldWidth) * this.mapSize;
            const viewportHeight = (viewHeight / this.worldHeight) * this.mapSize;

            this.overlayLayer.lineStyle(this.isMinimized ? 1 : 1.5, 0x7fd3ff, 0.9);
            this.overlayLayer.strokeRect(topLeft.x, topLeft.y, viewportWidth, viewportHeight);
        }

        if (gifts) {
            this.entityLayer.fillStyle(0xffd86b, 0.85);
            gifts.getChildren().forEach(gift => {
                if (gift.active) {
                    const mapPos = this.worldToMap(gift.x, gift.y);
                    this.entityLayer.fillCircle(mapPos.x, mapPos.y, 1.6);
                }
            });
        }

        if (npcs) {
            npcs.getChildren().forEach(npc => {
                if (!npc.active) return;
                const mapPos = this.worldToMap(npc.x, npc.y);
                this.drawShipMarker(this.entityLayer, mapPos.x, mapPos.y, npc.targetAngle, 0xff5a5a, this.isMinimized ? 4 : 4.8);
            });
        }

        if (monsters) {
            this.entityLayer.fillStyle(0xbf7bff, 0.95);
            monsters.getChildren().forEach(monster => {
                if (!monster.active) return;
                const mapPos = this.worldToMap(monster.x, monster.y);
                this.entityLayer.fillCircle(mapPos.x, mapPos.y, 3);
            });
        }

        if (selectedTarget && selectedTarget.active) {
            const targetPos = this.worldToMap(selectedTarget.x, selectedTarget.y);
            this.overlayLayer.lineStyle(this.isMinimized ? 1.2 : 2, 0xffef88, 1);
            this.overlayLayer.strokeCircle(targetPos.x, targetPos.y, this.isMinimized ? 4 : 6);
        }

        const playerPos = this.worldToMap(player.x, player.y);
        this.overlayLayer.lineStyle(this.isMinimized ? 1 : 1.5, 0xcdf6ff, 0.95);
        this.overlayLayer.strokeCircle(playerPos.x, playerPos.y, this.isMinimized ? 4 : 6);
        this.drawShipMarker(this.overlayLayer, playerPos.x, playerPos.y, player.targetAngle, 0xffffff, this.isMinimized ? 4.2 : 5.4);

        if (!this.isMinimized) {
            const columnIndex = Phaser.Math.Clamp(Math.floor((player.x / this.worldWidth) * 4), 0, 3);
            const rowIndex = Phaser.Math.Clamp(Math.floor((player.y / this.worldHeight) * 4), 0, 3);
            const colLabel = String.fromCharCode(65 + columnIndex);
            const sectorLabel = `${colLabel}${rowIndex + 1}`;
            const chartIndex = this.chartIndex ?? this.scene.currentChartIndex ?? 1;
            const gx = Math.floor((player.x / this.worldWidth) * 48);
            const gy = Math.floor((player.y / this.worldHeight) * 48);
            this.titleText.setText(`(${chartIndex}) X: ${gx}  Y: ${gy}`);
            this.levelText.setText(`Lvl ${player.level}`);
            this.playerSectorText.setText(`Sektor ${sectorLabel}`);
            this.xpText.setText(`${Math.floor(player.xp)}/${100 * player.level} XP`);
        }

        this.xpBarFill.clear();
        if (!this.isMinimized) {
            const xpPercent = Phaser.Math.Clamp(player.xp / (100 * player.level), 0, 1);
            this.xpBarFill.fillStyle(0x58dcff, 1);
            this.xpBarFill.fillRoundedRect(10, this.footerY + 14, this.xpBarWidth * xpPercent, 6, 3);
        }
    }
}
