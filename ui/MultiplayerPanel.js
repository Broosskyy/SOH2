const CHANNEL = 'ahc-multiplayer';
const BROADCAST_INTERVAL = 120;
const PLAYER_TIMEOUT = 4000;

const COLORS = ['#63d6ff','#ff6060','#44ff88','#ffd36a','#cc88ff','#ff8844','#88ffdd','#ff88cc'];

export default class MultiplayerPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._visible = false;
        this._peers = new Map();
        this._myId = this._genId();
        this._myColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        this._myName = window._loginUsername ?? 'Kapitän';
        this._channel = null;
        this._broadcastTimer = null;
        this._markers = new Map();
        this._connected = false;
        this._connect();
    }

    _genId() {
        return 'ahc_' + Math.random().toString(36).slice(2, 10);
    }

    _connect() {
        try {
            this._channel = new BroadcastChannel(CHANNEL);
            this._channel.onmessage = (ev) => this._onMessage(ev.data);
            this._connected = true;
            this._broadcastTimer = setInterval(() => this._broadcast(), BROADCAST_INTERVAL);
            this._cleanupTimer = setInterval(() => this._cleanupPeers(), 2000);
        } catch (e) {
            console.warn('[AHC Multi] BroadcastChannel not available:', e);
            this._connected = false;
        }
    }

    _broadcast() {
        if (!this._connected || !this.scene?.player?.active) return;
        const p = this.scene.player;
        try {
            this._channel.postMessage({
                type: 'player-update',
                id: this._myId,
                name: this._myName,
                color: this._myColor,
                x: Math.round(p.x),
                y: Math.round(p.y),
                angle: p.targetAngle ?? 0,
                hp: Math.round(p.hp ?? 0),
                maxHp: Math.round(p.maxHP ?? 1),
                level: p.level ?? 1,
                ts: Date.now()
            });
        } catch {}
    }

    _onMessage(data) {
        if (!data || data.id === this._myId) return;
        if (data.type === 'player-update') {
            this._peers.set(data.id, { ...data, lastSeen: Date.now() });
            this._updateMarker(data);
        } else if (data.type === 'gm-broadcast') {
            this.scene?.showStatusMsg?.(`📢 GM: ${data.msg}`, 0xcc88ff);
        } else if (data.type === 'chat') {
            this.scene?.domChatPanel?._addMsg?.(`💬 ${data.name}`, data.msg, '#dff8ff');
        }
    }

    _cleanupPeers() {
        const now = Date.now();
        this._peers.forEach((peer, id) => {
            if (now - peer.lastSeen > PLAYER_TIMEOUT) {
                this._peers.delete(id);
                this._removeMarker(id);
            }
        });
        this._updatePanel();
    }

    _updateMarker(peer) {
        if (!this.scene || !this.scene.sys?.isActive?.()) return;
        let marker = this._markers.get(peer.id);
        if (!marker || !marker.active) {
            try {
                const colorHex = parseInt(peer.color.replace('#',''), 16);
                const container = this.scene.add.container(peer.x, peer.y);
                container.setDepth(1600);
                container.setScrollFactor(1);
                const circle = this.scene.add.circle(0, 0, 10, colorHex, 0.85);
                const outline = this.scene.add.circle(0, 0, 12, colorHex, 0.35);
                const nameText = this.scene.add.text(0, -20, `${peer.name} Lv${peer.level}`, {
                    fontSize: '9px', fontFamily: 'Arial', fontStyle: 'bold',
                    color: peer.color, stroke: '#000', strokeThickness: 3
                }).setOrigin(0.5, 1);
                container.add([outline, circle, nameText]);
                this._markers.set(peer.id, container);
                marker = container;
            } catch {}
        }
        if (marker?.setPosition) {
            try { marker.setPosition(peer.x, peer.y); } catch {}
        }
    }

    _removeMarker(id) {
        const m = this._markers.get(id);
        if (m) { try { m.destroy(); } catch {} this._markers.delete(id); }
    }

    _updatePanel() {
        const list = document.getElementById('mp-player-list');
        if (!list) return;
        const count = this._peers.size;
        const countEl = document.getElementById('mp-count');
        if (countEl) countEl.textContent = count + 1;
        list.innerHTML = [
            `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                <div style="width:12px;height:12px;border-radius:50%;background:${this._myColor};"></div>
                <div style="flex:1;"><div style="font-size:12px;color:${this._myColor};">${this._myName} (Du)</div><div style="font-size:10px;color:#555;">Lv${this.scene?.player?.level??1}</div></div>
                <div style="font-size:10px;color:#44ff88;">● Online</div>
            </div>`,
            ...[...this._peers.values()].map(peer => `
                <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <div style="width:12px;height:12px;border-radius:50%;background:${peer.color};"></div>
                    <div style="flex:1;"><div style="font-size:12px;color:${peer.color};">${peer.name}</div><div style="font-size:10px;color:#555;">Lv${peer.level} • ${Math.round(peer.hp)}/${peer.maxHp} HP</div></div>
                    <div style="font-size:10px;color:#44ff88;">● Online</div>
                </div>
            `)
        ].join('');
    }

    getPeers() { return [...this._peers.values()]; }

    sendChat(name, msg) {
        if (!this._connected) return;
        try {
            this._channel.postMessage({ type: 'chat', id: this._myId, name, msg });
        } catch {}
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'multiplayer-panel';
        el.style.cssText = `
            position:fixed; inset:0; z-index:22000;
            display:flex; align-items:center; justify-content:center;
            background:rgba(0,0,0,0.82); font-family:Arial,sans-serif; padding:8px;
        `;
        const panel = document.createElement('div');
        panel.style.cssText = `
            width:100%; max-width:480px; max-height:80vh;
            background:linear-gradient(170deg,#06101a 0%,#030c14 100%);
            border:2px solid #63d6ff; border-radius:8px;
            display:flex; flex-direction:column; overflow:hidden;
            box-shadow:0 0 40px rgba(99,214,255,0.25);
        `;
        panel.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(99,214,255,0.3);flex-shrink:0;">
                <div>
                    <div style="font-size:14px;font-weight:bold;color:#63d6ff;letter-spacing:2px;">🌐 MULTIPLAYER</div>
                    <div style="font-size:11px;color:#555;margin-top:2px;">${this._connected?'● Verbunden (BroadcastChannel)':'✕ Nicht verfügbar'} • <span id="mp-count">${this._peers.size+1}</span> Spieler online</div>
                </div>
                <button id="mp-close" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:18px;width:32px;height:32px;border-radius:50%;cursor:pointer;padding:0;touch-action:manipulation;">✕</button>
            </div>
            <div style="flex:1;overflow-y:auto;padding:12px;-webkit-overflow-scrolling:touch;">
                ${this._connected ? `
                <div style="background:rgba(99,214,255,0.05);border:1px solid rgba(99,214,255,0.15);border-radius:8px;padding:12px;margin-bottom:12px;">
                    <div style="font-size:11px;color:#63d6ff;font-weight:bold;margin-bottom:8px;letter-spacing:1px;">SPIELER IN DIESER WELT</div>
                    <div id="mp-player-list"></div>
                </div>
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px;">
                    <div style="font-size:11px;color:#888;margin-bottom:8px;">ℹ Multiplayer funktioniert zwischen mehreren Browser-Tabs derselben Seite. Andere Tabs erscheinen als farbige Schiffe auf der Karte.</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <div style="width:12px;height:12px;border-radius:50%;background:${this._myColor};flex-shrink:0;"></div>
                        <div style="font-size:12px;color:#ddd;">Du bist sichtbar als: <strong style="color:${this._myColor};">${this._myName}</strong></div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${COLORS.map(c=>`<div data-mpcolor="${c}" style="width:20px;height:20px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${c===this._myColor?'#fff':'transparent'};touch-action:manipulation;"></div>`).join('')}
                    </div>
                </div>
                ` : `
                <div style="text-align:center;padding:30px;color:#555;">
                    <div style="font-size:32px;margin-bottom:12px;">📡</div>
                    <div>BroadcastChannel nicht verfügbar in diesem Browser.</div>
                </div>
                `}
            </div>
        `;
        el.appendChild(panel);
        el.addEventListener('click', (e) => { if (e.target === el) this.hide(); });
        document.body.appendChild(el);
        this._el = el;
        this._updatePanel();
        setTimeout(() => {
            el.querySelector('#mp-close')?.addEventListener('click', () => this.hide());
            el.querySelectorAll('[data-mpcolor]').forEach(dot => {
                const act = () => {
                    this._myColor = dot.dataset.mpcolor;
                    el.querySelectorAll('[data-mpcolor]').forEach(d => d.style.borderColor = 'transparent');
                    dot.style.borderColor = '#fff';
                };
                dot.addEventListener('click', act);
                dot.addEventListener('touchend', (e) => { e.preventDefault(); act(); }, { passive: false });
            });
        }, 0);
    }

    show() {
        if (this._el) { this._el.remove(); this._el = null; }
        this._build();
        this._visible = true;
    }
    hide() {
        if (this._el) this._el.style.display = 'none';
        this._visible = false;
    }
    toggle() { if (this._visible) this.hide(); else this.show(); }
    isOpen() { return this._visible; }
    destroy() {
        this._channel?.close?.();
        clearInterval(this._broadcastTimer);
        clearInterval(this._cleanupTimer);
        this._markers.forEach(m => { try { m.destroy(); } catch {} });
        this._markers.clear();
        this._el?.parentNode?.removeChild(this._el);
        this._el = null;
    }
}
