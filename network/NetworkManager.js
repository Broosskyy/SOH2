/**
 * NetworkManager.js — Azure Horizon Captain MMO Echtzeit-System
 * Verwaltet Socket.IO Verbindung, Online-Spieler, PvP/PvE Events und Welt-Chat.
 */
export default class NetworkManager {
    constructor(scene) {
        this.scene    = scene;
        this.socket   = null;
        this.online   = new Map(); /* username → { sprite, nameTag, hpBar, data } */
        this.connected = false;
        this._posInterval = null;
        this._chatLog = [];
        this._onPvpHitCbs  = [];
        this._onChatCbs    = [];
        this._onPlayerJoinCbs = [];
        this._onPlayerLeftCbs = [];
    }

    /* ═══════════════════════════════════════════════════════
       VERBINDEN (nach erfolgreichem Login)
    ═══════════════════════════════════════════════════════ */
    connect(token) {
        if (this.socket) return;
        if (typeof io === 'undefined') {
            console.warn('[Network] socket.io nicht geladen');
            return;
        }

        this.socket = io({ auth: { token }, transports: ['websocket', 'polling'] });

        this.socket.on('connect', () => {
            this.connected = true;
            console.log('[Network] Verbunden als', window._loginUsername);
            this._startPositionBroadcast();
            this._showSystemMsg('🌐 MMO-Welt verbunden!', 0x7ff0b8);
        });

        this.socket.on('connect_error', (err) => {
            console.warn('[Network] Verbindungsfehler:', err.message);
            this._showSystemMsg('⚠️ Netzwerkfehler: ' + err.message, 0xff6666);
        });

        this.socket.on('disconnect', () => {
            this.connected = false;
            console.log('[Network] Getrennt');
            this._stopPositionBroadcast();
            this._showSystemMsg('🔴 Verbindung getrennt — versuche neu...', 0xff8844);
        });

        /* Welt-Snapshot beim ersten Verbinden */
        this.socket.on('world:snapshot', ({ players }) => {
            for (const p of players) {
                this._addOrUpdatePlayer(p);
            }
            this._showSystemMsg(`👥 ${players.length} Spieler online`, 0xaaddff);
        });

        /* Neuer Spieler betritt die Welt */
        this.socket.on('player:joined', (data) => {
            this._addOrUpdatePlayer(data);
            this._showSystemMsg(`⚓ ${data.username} ist beigetreten`, 0xffdd88);
            for (const cb of this._onPlayerJoinCbs) cb(data);
        });

        /* Spieler hat die Welt verlassen */
        this.socket.on('player:left', ({ username }) => {
            this._removePlayer(username);
            this._showSystemMsg(`⛵ ${username} hat die Welt verlassen`, 0xaaaaaa);
            for (const cb of this._onPlayerLeftCbs) cb(username);
        });

        /* Positions-/Status-Update eines anderen Spielers */
        this.socket.on('player:updated', (data) => {
            this._addOrUpdatePlayer(data);
        });

        /* Modus-Wechsel (PvP/PvE) */
        this.socket.on('player:modeChanged', ({ username, pvpMode }) => {
            const entry = this.online.get(username);
            if (entry) {
                entry.data.pvpMode = pvpMode;
                this._updateNameTag(username);
            }
        });

        /* PvP: Wir wurden getroffen */
        this.socket.on('pvp:hit', (data) => {
            for (const cb of this._onPvpHitCbs) cb(data);
            this._handlePvpHitReceived(data);
        });

        /* PvP: Unser Kill wurde bestätigt */
        this.socket.on('pvp:kill_confirmed', (data) => {
            const scene = this.scene;
            scene.showStatusMsg(
                `☠️ ${data.targetUsername} versenkt! +${data.xpGained} XP, +${data.goldGained} Gold`,
                0xffdd44
            );
            if (scene.player) {
                scene.player.xp   = (scene.player.xp   ?? 0) + (data.xpGained  ?? 0);
                scene.player.gold = (scene.player.gold ?? 0) + (data.goldGained ?? 0);
                scene.updateUIBars?.();
            }
        });

        /* PvP: Wir wurden versenkt */
        this.socket.on('pvp:killed', ({ killerUsername }) => {
            const scene = this.scene;
            scene.showStatusMsg(`💀 Von ${killerUsername} versenkt! Respawn...`, 0xff4444);
            if (scene.player) {
                scene.player.hp = scene.player.maxHP ?? 200;
                scene.updateUIBars?.();
                scene._saveProgress?.();
            }
        });

        /* Chat-Nachrichten */
        this.socket.on('chat:message', (data) => {
            this._chatLog.push(data);
            if (this._chatLog.length > 100) this._chatLog.shift();
            for (const cb of this._onChatCbs) cb(data);
            this._showChatBubble(data);
        });

        /* Von Admin gebannt */
        this.socket.on('banned', ({ reason }) => {
            alert(`Du wurdest gebannt: ${reason}`);
            window.location.reload();
        });
    }

    /* ═══════════════════════════════════════════════════════
       POSITION REGELMÄSSIG SENDEN (10x/s max)
    ═══════════════════════════════════════════════════════ */
    _startPositionBroadcast() {
        this._stopPositionBroadcast();
        this._posInterval = setInterval(() => {
            if (!this.connected || !this.socket) return;
            const scene = this.scene;
            const p = scene?.player;
            if (!p?.active) return;

            const worldW = scene.mapWidth  || 6000;
            const worldH = scene.mapHeight || 6000;

            this.socket.emit('player:move', {
                posX:    p.x / worldW,
                posY:    p.y / worldH,
                chartId: scene.currentChartIndex ?? 1,
                pvpMode: p.pvpMode ?? false,
                hp:      Math.round((p.hp ?? 100) / (p.maxHP || 200) * 100),
            });
        }, 100); /* 10x pro Sekunde */
    }

    _stopPositionBroadcast() {
        if (this._posInterval) {
            clearInterval(this._posInterval);
            this._posInterval = null;
        }
    }

    /* ═══════════════════════════════════════════════════════
       PvE KILL MELDEN
    ═══════════════════════════════════════════════════════ */
    reportPveKill({ npcTier = 1, xpGained = 0, goldGained = 0 } = {}) {
        this.socket?.emit('pve:kill', { npcTier, xpGained, goldGained });
    }

    /* ═══════════════════════════════════════════════════════
       PvP TREFFER SENDEN
    ═══════════════════════════════════════════════════════ */
    sendPvpHit(targetUsername, damage) {
        if (!this.connected) return;
        this.socket.emit('pvp:hit', { targetUsername, damage: Math.round(damage) });
    }

    /* ═══════════════════════════════════════════════════════
       PvP MODUS WECHSELN
    ═══════════════════════════════════════════════════════ */
    setPvpMode(enabled) {
        this.socket?.emit('player:setMode', { pvpMode: !!enabled });
    }

    /* ═══════════════════════════════════════════════════════
       CHAT SENDEN
    ═══════════════════════════════════════════════════════ */
    sendChat(message) {
        if (!this.connected || !message?.trim()) return;
        this.socket.emit('chat:send', { message: message.trim().slice(0, 200) });
    }

    /* ═══════════════════════════════════════════════════════
       CALLBACKS REGISTRIEREN
    ═══════════════════════════════════════════════════════ */
    onPvpHit(cb)      { this._onPvpHitCbs.push(cb); }
    onChat(cb)        { this._onChatCbs.push(cb); }
    onPlayerJoin(cb)  { this._onPlayerJoinCbs.push(cb); }
    onPlayerLeft(cb)  { this._onPlayerLeftCbs.push(cb); }

    /* ═══════════════════════════════════════════════════════
       SPIELER SPRITE IM SPIEL ANLEGEN / AKTUALISIEREN
    ═══════════════════════════════════════════════════════ */
    _addOrUpdatePlayer(data) {
        const scene = this.scene;
        if (!scene || !scene.sys.isActive()) return;
        const { username, posX = 0.5, posY = 0.5, chartId = 1, pvpMode = false, hp = 100, level = 1 } = data;
        if (!username || username === window._loginUsername) return;

        /* Nur Spieler auf der gleichen Karte anzeigen */
        if (chartId !== (scene.currentChartIndex ?? 1)) {
            this._removePlayer(username);
            return;
        }

        const worldX = posX * (scene.mapWidth  || 6000);
        const worldY = posY * (scene.mapHeight || 6000);

        let entry = this.online.get(username);
        if (!entry) {
            entry = this._createPlayerSprite(username, worldX, worldY, level, pvpMode);
            this.online.set(username, entry);
        }

        /* Position aktualisieren */
        if (entry.sprite?.active) {
            entry.sprite.x = worldX;
            entry.sprite.y = worldY;
        }
        entry.data = { ...entry.data, ...data };

        /* Name-Tag / HP Bar aktualisieren */
        this._updateNameTag(username);
        this._updateHpBar(username, hp);
    }

    _createPlayerSprite(username, x, y, level, pvpMode) {
        const scene = this.scene;

        /* Schiff-Sprite */
        const texKey = scene.textures.exists('npc-ship-tier2') ? 'npc-ship-tier2'
                     : scene.textures.exists('ship_top_tier2') ? 'ship_top_tier2'
                     : 'player';
        const sprite = scene.add.image(x, y, texKey)
            .setDisplaySize(48, 48)
            .setDepth(30)
            .setTint(0x88ccff);  /* Blauer Tint für andere Spieler */

        /* Name-Tag */
        const pvpBadge = pvpMode ? ' ⚔️' : ' 🛡️';
        const nameTag = scene.add.text(x, y - 36, `[${level}] ${username}${pvpBadge}`, {
            fontFamily: 'Georgia, serif',
            fontSize:   '11px',
            color:      pvpMode ? '#ff8888' : '#aaddff',
            stroke:     '#000000',
            strokeThickness: 3,
            shadow: { blur: 4, color: '#000', fill: true },
        }).setOrigin(0.5, 1).setDepth(31);

        /* HP-Balken Hintergrund */
        const hpBg = scene.add.rectangle(x, y - 40, 40, 4, 0x222222, 0.8)
            .setDepth(31).setOrigin(0.5, 0.5);

        /* HP-Balken Füllung */
        const hpFill = scene.add.rectangle(x - 20, y - 40, 40, 4, pvpMode ? 0xff4444 : 0x44ff88, 1)
            .setDepth(32).setOrigin(0, 0.5);

        return {
            sprite, nameTag, hpBg, hpFill,
            data: { username, level, pvpMode, hp: 100 },
        };
    }

    _updateNameTag(username) {
        const entry = this.online.get(username);
        if (!entry?.nameTag?.active) return;
        const { level, pvpMode } = entry.data;
        const pvpBadge = pvpMode ? ' ⚔️' : ' 🛡️';
        entry.nameTag.setText(`[${level}] ${username}${pvpBadge}`);
        entry.nameTag.setColor(pvpMode ? '#ff8888' : '#aaddff');
        entry.nameTag.x = entry.sprite.x;
        entry.nameTag.y = entry.sprite.y - 36;
        entry.hpBg.x  = entry.sprite.x;
        entry.hpBg.y  = entry.sprite.y - 44;
        entry.hpFill.x = entry.sprite.x - 20;
        entry.hpFill.y = entry.sprite.y - 44;
    }

    _updateHpBar(username, hpPercent) {
        const entry = this.online.get(username);
        if (!entry?.hpFill?.active) return;
        const pct = Math.max(0, Math.min(100, hpPercent ?? 100));
        entry.hpFill.setSize(pct * 0.4, 4);
        entry.data.hp = pct;
    }

    _removePlayer(username) {
        const entry = this.online.get(username);
        if (!entry) return;
        entry.sprite?.destroy();
        entry.nameTag?.destroy();
        entry.hpBg?.destroy();
        entry.hpFill?.destroy();
        this.online.delete(username);
    }

    /* ═══════════════════════════════════════════════════════
       PvP TREFFER EMPFANGEN
    ═══════════════════════════════════════════════════════ */
    _handlePvpHitReceived({ attackerUsername, damage, hpRemaining }) {
        const scene = this.scene;
        if (!scene?.player?.active) return;

        scene.player.hp = Math.max(0, (scene.player.hp ?? 200) - damage);
        scene.updateUIBars?.();

        /* Visuelles Hit-Feedback */
        scene.cameras.main.shake(120, 0.008);
        scene.showStatusMsg(`⚔️ ${attackerUsername} trifft: -${damage} HP`, 0xff6666);
    }

    /* ═══════════════════════════════════════════════════════
       CHAT BUBBLE ÜBER SCHIFF
    ═══════════════════════════════════════════════════════ */
    _showChatBubble({ username, message }) {
        const scene = this.scene;
        if (!scene?.sys.isActive()) return;

        const entry = this.online.get(username);
        const isMe  = username === window._loginUsername;

        let worldX, worldY;
        if (isMe && scene.player?.active) {
            worldX = scene.player.x;
            worldY = scene.player.y;
        } else if (entry?.sprite?.active) {
            worldX = entry.sprite.x;
            worldY = entry.sprite.y;
        } else return;

        /* Bubble als DOM-Element über Phaser */
        const cam = scene.cameras.main;
        const screenX = (worldX - cam.scrollX) * cam.zoom + scene.scale.width  * 0.5 * (1 - cam.zoom);
        const screenY = (worldY - cam.scrollY) * cam.zoom + scene.scale.height * 0.5 * (1 - cam.zoom);

        const el = document.createElement('div');
        el.style.cssText = `
            position:fixed;
            left:${screenX}px; top:${screenY - 70}px;
            transform:translateX(-50%);
            background:rgba(10,20,40,0.92);
            border:1px solid rgba(100,180,255,0.6);
            border-radius:10px;
            color:#e8f4ff;
            font:bold 11px Georgia,serif;
            padding:5px 10px;
            max-width:160px;
            word-break:break-word;
            text-align:center;
            pointer-events:none;
            z-index:8000;
            white-space:pre-wrap;
        `;
        el.textContent = `💬 ${username}: ${message}`;
        document.body.appendChild(el);

        /* Nach 4s ausblenden */
        setTimeout(() => {
            el.style.transition = 'opacity 0.6s';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 700);
        }, 4000);
    }

    /* ═══════════════════════════════════════════════════════
       SYSTEM-NACHRICHT IN SPIELWELT
    ═══════════════════════════════════════════════════════ */
    _showSystemMsg(text, color = 0xffffff) {
        try {
            this.scene?.showStatusMsg?.(text, color);
        } catch (_) {}
    }

    /* ═══════════════════════════════════════════════════════
       UPDATE (aus GameScene.update() aufrufen)
    ═══════════════════════════════════════════════════════ */
    update() {
        /* Position aller Online-Spieler auf ihre aktuellen Koordinaten setzen */
        for (const [username, entry] of this.online) {
            if (!entry.sprite?.active) {
                this.online.delete(username);
                continue;
            }
            this._updateNameTag(username);
        }
    }

    /* ═══════════════════════════════════════════════════════
       PvP ANGRIFF AUF SPIELER PRÜFEN (wird von GameScene aufgerufen)
    ═══════════════════════════════════════════════════════ */
    checkPvpTarget(attackerX, attackerY, range = 400) {
        if (!this.connected) return null;
        const scene = this.scene;
        if (!(scene?.player?.pvpMode)) return null;

        let closest    = null;
        let closestDist = Infinity;

        for (const [username, entry] of this.online) {
            if (!entry.data?.pvpMode) continue;  /* Nur PvP-Spieler angreifen */
            if (!entry.sprite?.active) continue;

            const dx = entry.sprite.x - attackerX;
            const dy = entry.sprite.y - attackerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < range && dist < closestDist) {
                closestDist = dist;
                closest = { username, dist, x: entry.sprite.x, y: entry.sprite.y };
            }
        }
        return closest;
    }

    /* ═══════════════════════════════════════════════════════
       AUFRÄUMEN
    ═══════════════════════════════════════════════════════ */
    destroy() {
        this._stopPositionBroadcast();
        for (const [username] of this.online) this._removePlayer(username);
        this.socket?.disconnect();
        this.socket = null;
        this.online.clear();
    }

    /* ═══════════════════════════════════════════════════════
       GETTER
    ═══════════════════════════════════════════════════════ */
    get playerCount() { return this.online.size; }

    getOnlinePlayers() {
        const list = [];
        for (const [username, entry] of this.online) {
            list.push({ username, ...entry.data });
        }
        return list;
    }
}
