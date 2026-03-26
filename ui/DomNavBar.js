export default class DomNavBar {
    constructor(scene) {
        this.scene = scene;
        this.visible = true;
        this._el = null;
        this._statsEl = null;
        this._playerInfoEl = null;
        this._levelUpEl = null;
        this._build();
        this._buildPlayerInfo();
        this._buildLevelUpPopup();
    }

    _buttons() {
        return [
            { label: 'Admin',    icon: '🛡', action: () => this.scene.handleMenuAction('admin'), adminBtn: true },
            { label: 'Werft',    icon: '⚓', action: () => this.scene.handleMenuAction('shipyard') },
            { label: 'Gilde',    icon: '⚑',  action: () => this.scene.handleMenuAction('guild') },
            { label: 'Chat',     icon: '💬', action: () => this.scene.handleMenuAction('chat') },
            { label: 'Events',   icon: '⚔',  action: () => this.scene.handleMenuAction('shipevents') },
            { label: 'Mission',  icon: '⇪',  action: () => this.scene.handleMenuAction('missions') },
            { label: 'Bonus',    icon: '◎',  action: () => this.scene.handleMenuAction('bonus') },
            { label: 'Quests',   icon: '📋', action: () => this.scene.handleMenuAction('quests') },
            { label: 'Geschäft', icon: '🛒', action: () => this.scene.handleMenuAction('shop') },
            { label: 'Rang',     icon: '♛',  action: () => this.scene.handleMenuAction('rank') },
            { label: 'Kampf',    icon: '⚔',  action: () => this.scene.handleMenuAction('combat') },
            { label: 'Board',    icon: '🗺️', action: () => this.scene.handleMenuAction('board') },
            { label: 'Ausfahrt', icon: '⛵', action: () => this.scene.handleMenuAction('sail') },
            { label: 'Feed',     icon: '📣', action: () => this.scene.handleMenuAction('feed') },
            { label: 'Talente',  icon: '🌟', action: () => this.scene.handleMenuAction('talent') },
            { label: 'Multi',    icon: '🌐', action: () => this.scene.handleMenuAction('multiplayer') },
        ];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'dom-nav-bar';
        el.style.cssText = `
            position: fixed;
            top: 0;
            left: 220px;
            right: 260px;
            z-index: 9000;
            display: flex;
            flex-direction: row;
            align-items: stretch;
            background: linear-gradient(180deg, rgba(4,14,30,0.97) 0%, rgba(6,20,44,0.93) 100%);
            border-bottom: 2px solid rgba(74,200,255,0.4);
            box-shadow: 0 2px 16px rgba(0,0,0,0.7);
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            font-family: Arial, sans-serif;
            user-select: none;
            -webkit-user-select: none;
            touch-action: pan-x;
            height: 52px;
            flex-shrink: 0;
            padding-top: env(safe-area-inset-top, 0px);
        `;
        el.style.setProperty('scrollbar-width', 'none');

        this._buttons().forEach(btn => {
            const b = document.createElement('button');
            const isAdmin = btn.adminBtn === true;
            b.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-width: ${isAdmin ? '60px' : '66px'};
                padding: 4px 8px;
                background: ${isAdmin ? 'rgba(170,68,255,0.18)' : 'transparent'};
                border: none;
                border-right: 1px solid ${isAdmin ? 'rgba(170,68,255,0.4)' : 'rgba(74,200,255,0.15)'};
                color: ${isAdmin ? '#cc88ff' : '#dff8ff'};
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                flex-shrink: 0;
                transition: background 0.12s;
                gap: 2px;
                outline: none;
                ${isAdmin ? 'box-shadow: inset 0 0 8px rgba(170,68,255,0.2);' : ''}
            `;
            b.innerHTML = `
                <span style="font-size:18px;line-height:1.1;">${btn.icon}</span>
                <span style="font-size:9px;color:${isAdmin ? '#cc88ff' : '#9fdcff'};letter-spacing:0.4px;">${btn.label}</span>
            `;
            const activate = (e) => {
                e.preventDefault();
                e.stopPropagation();
                b.style.background = 'rgba(74,200,255,0.22)';
                setTimeout(() => { b.style.background = isAdmin ? 'rgba(170,68,255,0.18)' : 'transparent'; }, 180);
                btn.action();
            };
            b.addEventListener('touchend', activate, { passive: false });
            b.addEventListener('click', activate);
            b.addEventListener('touchstart', () => { b.style.background = 'rgba(74,200,255,0.12)'; }, { passive: true });
            el.appendChild(b);
        });

        document.body.appendChild(el);
        this._el = el;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'F9' || (e.key === 'a' && e.ctrlKey && e.shiftKey)) {
                e.preventDefault();
                this.scene.handleMenuAction?.('admin');
            }
        });

        this._buildStatsPanel();
    }

    _buildStatsPanel() {
        const stats = document.createElement('div');
        stats.id = 'nav-stats';
        stats.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 256px;
            height: 52px;
            z-index: 9002;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 3px;
            padding: 4px 10px 4px 12px;
            background: linear-gradient(135deg, rgba(3,10,24,0.98) 0%, rgba(5,18,40,0.95) 100%);
            border-bottom: 2px solid rgba(74,200,255,0.5);
            border-left: 1px solid rgba(74,200,255,0.3);
            box-sizing: border-box;
            pointer-events: none;
            font-family: Arial, sans-serif;
            padding-top: calc(4px + env(safe-area-inset-top, 0px));
        `;
        stats.innerHTML = `
            <div style="display:flex;align-items:center;gap:4px;height:13px;">
                <span style="font-size:9px;font-weight:bold;color:#4ac8ff;width:20px;flex-shrink:0;letter-spacing:0.5px;">EXP</span>
                <div style="flex:1;height:6px;background:rgba(0,0,0,0.5);border-radius:3px;overflow:hidden;border:1px solid rgba(74,200,255,0.2);">
                    <div id="nav-exp-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#1a6fdd,#4ac8ff,#7fdeff);border-radius:3px;transition:width 0.5s ease;box-shadow:0 0 4px #4ac8ff88;"></div>
                </div>
                <span id="nav-exp-text" style="font-size:9px;color:#7fd8ff;min-width:46px;text-align:right;font-weight:bold;">0/100</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;height:13px;">
                <span style="font-size:9px;font-weight:bold;color:#45ff85;width:20px;flex-shrink:0;letter-spacing:0.5px;">HP</span>
                <div style="flex:1;height:6px;background:rgba(0,0,0,0.5);border-radius:3px;overflow:hidden;border:1px solid rgba(69,255,133,0.2);">
                    <div id="nav-hp-bar" style="height:100%;width:100%;background:linear-gradient(90deg,#0da044,#25d15e,#45ff85);border-radius:3px;transition:width 0.4s ease;box-shadow:0 0 4px #45ff8588;"></div>
                </div>
                <span id="nav-hp-text" style="font-size:9px;color:#7fffb0;min-width:46px;text-align:right;font-weight:bold;">0/0</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;height:13px;">
                <span style="font-size:10px;">🪙</span>
                <span id="nav-gold-val" style="font-size:10px;font-weight:bold;color:#ffd36a;min-width:36px;">0</span>
                <span style="font-size:9px;color:#444;">│</span>
                <span style="font-size:10px;">🔧</span>
                <span id="nav-mats-val" style="font-size:10px;color:#b8f0ff;min-width:26px;">0</span>
                <span style="font-size:9px;color:#ffd36a;margin-left:2px;flex-shrink:0;" id="nav-gold-deck">🟠🟠🟠</span>
            </div>
        `;
        document.body.appendChild(stats);
        this._statsEl = stats;
    }

    _buildPlayerInfo() {
        const el = document.createElement('div');
        el.id = 'nav-player-info';
        el.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 218px;
            height: 52px;
            z-index: 9002;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 0 10px 0 10px;
            background: linear-gradient(135deg, rgba(3,10,24,0.98) 0%, rgba(5,16,36,0.95) 100%);
            border-bottom: 2px solid rgba(212,175,55,0.5);
            border-right: 1px solid rgba(212,175,55,0.25);
            box-sizing: border-box;
            pointer-events: none;
            font-family: Arial, sans-serif;
            gap: 2px;
            padding-top: calc(2px + env(safe-area-inset-top, 0px));
        `;
        el.innerHTML = `
            <div style="display:flex;align-items:center;gap:5px;">
                <div id="nav-avatar" style="
                    width:28px;height:28px;border-radius:50%;
                    background:linear-gradient(135deg,#1a3a6a,#0d2040);
                    border:2px solid rgba(212,175,55,0.7);
                    display:flex;align-items:center;justify-content:center;
                    font-size:14px;flex-shrink:0;box-shadow:0 0 8px rgba(212,175,55,0.3);
                ">⚓</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:3px;">
                        <span id="nav-player-name" style="font-size:11px;font-weight:bold;color:#ffd36a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;letter-spacing:0.3px;">Kapitän</span>
                        <span id="nav-level-badge" style="
                            font-size:8px;font-weight:bold;color:#fff;
                            background:linear-gradient(135deg,#1a5a9a,#0d3a6a);
                            border:1px solid rgba(74,200,255,0.5);
                            border-radius:4px;padding:1px 4px;flex-shrink:0;white-space:nowrap;
                        ">Lv.1</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:1px;">
                        <span id="nav-guild-tag" style="font-size:8px;color:#e6cb79;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;opacity:0.85;">Kein Gildenverband</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(el);
        this._playerInfoEl = el;
    }

    _buildLevelUpPopup() {
        const el = document.createElement('div');
        el.id = 'level-up-popup';
        el.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%,-50%) scale(0.6);
            z-index: 15000;
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 28px 44px 24px;
            background: linear-gradient(160deg,rgba(4,12,28,0.98) 0%,rgba(8,24,52,0.97) 100%);
            border: 2px solid rgba(212,175,55,0.8);
            border-radius: 18px;
            box-shadow: 0 0 60px rgba(212,175,55,0.5), 0 0 120px rgba(74,200,255,0.2), inset 0 0 40px rgba(0,0,0,0.6);
            pointer-events: auto;
            font-family: Arial, sans-serif;
            text-align: center;
            opacity: 0;
            transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
            min-width: 280px;
        `;
        el.innerHTML = `
            <div style="font-size:44px;line-height:1;">⭐</div>
            <div style="font-size:13px;color:#9fdcff;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">Aufgestiegen!</div>
            <div id="lu-level" style="font-size:36px;font-weight:900;color:#ffd36a;text-shadow:0 0 20px rgba(255,211,106,0.8);letter-spacing:1px;">Level 2</div>
            <div id="lu-rewards" style="font-size:11px;color:#b8f0ff;line-height:1.6;max-width:220px;"></div>
            <div id="lu-trial-notice" style="font-size:11px;color:#ffa040;display:none;margin-top:4px;padding:6px 14px;background:rgba(255,160,64,0.1);border:1px solid rgba(255,160,64,0.4);border-radius:8px;"></div>
            <button id="lu-close" style="
                margin-top:8px;padding:8px 28px;
                background:linear-gradient(135deg,#1a5a9a,#0d3a6a);
                border:1px solid rgba(74,200,255,0.5);border-radius:8px;
                color:#9fdcff;font-size:12px;font-weight:bold;
                cursor:pointer;letter-spacing:0.5px;
                transition:background 0.15s;
            ">Weiter ▶</button>
        `;
        document.body.appendChild(el);
        el.querySelector('#lu-close').addEventListener('click', () => this.hideLevelUp());
        this._levelUpEl = el;
    }

    showLevelUp(level, rewards = [], trialNotice = '') {
        const el = this._levelUpEl;
        if (!el) return;
        el.querySelector('#lu-level').textContent = `Level ${level}`;
        const rewardLines = [
            `+1 Skillpunkt`,
            ...rewards
        ].map(r => `• ${r}`).join('<br>');
        el.querySelector('#lu-rewards').innerHTML = rewardLines;
        const trialEl = el.querySelector('#lu-trial-notice');
        if (trialNotice) {
            trialEl.textContent = `⚔ ${trialNotice}`;
            trialEl.style.display = 'block';
        } else {
            trialEl.style.display = 'none';
        }
        el.style.display = 'flex';
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translate(-50%,-50%) scale(1)';
        });
        setTimeout(() => this.hideLevelUp(), 6000);
    }

    hideLevelUp() {
        const el = this._levelUpEl;
        if (!el) return;
        el.style.opacity = '0';
        el.style.transform = 'translate(-50%,-50%) scale(0.7)';
        setTimeout(() => { el.style.display = 'none'; }, 350);
    }

    setPlayerInfo(name, level, guildTag, guildName) {
        const nameEl = document.getElementById('nav-player-name');
        const lvlEl  = document.getElementById('nav-level-badge');
        const tagEl  = document.getElementById('nav-guild-tag');
        if (nameEl) nameEl.textContent = name ?? 'Kapitän';
        if (lvlEl)  lvlEl.textContent  = `Lv.${level ?? 1}`;
        if (tagEl) {
            if (guildTag) {
                tagEl.innerHTML = `<span style="color:#e6cb79;">[${guildTag}]</span> <span style="color:#aaa;">${guildName ?? ''}</span>`;
            } else {
                tagEl.textContent = 'Kein Gildenverband';
            }
        }
    }

    updateStats(xp, maxXp, hp, maxHp, goldSlots, pearlSlots, gold, mats) {
        const xpBar  = document.getElementById('nav-exp-bar');
        const xpText = document.getElementById('nav-exp-text');
        const hpBar  = document.getElementById('nav-hp-bar');
        const hpText = document.getElementById('nav-hp-text');
        if (!xpBar) return;

        const xpPct = Math.max(0, Math.min(1, xp / (maxXp || 1))) * 100;
        const hpPct = Math.max(0, Math.min(1, hp / (maxHp || 1))) * 100;

        xpBar.style.width = `${xpPct.toFixed(1)}%`;
        if (xpText) xpText.textContent = `${Math.floor(xp)}/${maxXp}`;

        if (hpBar) {
            hpBar.style.width = `${hpPct.toFixed(1)}%`;
            if (hpPct > 50) {
                hpBar.style.background = 'linear-gradient(90deg,#0da044,#25d15e,#45ff85)';
                hpBar.style.boxShadow = '0 0 4px #45ff8588';
            } else if (hpPct > 25) {
                hpBar.style.background = 'linear-gradient(90deg,#a07010,#c8a020,#ffdc59)';
                hpBar.style.boxShadow = '0 0 4px #ffdc5988';
            } else {
                hpBar.style.background = 'linear-gradient(90deg,#a01818,#c83030,#ff5f5f)';
                hpBar.style.boxShadow = '0 0 4px #ff5f5f88';
                if (hpPct < 20 && Math.floor(Date.now() / 500) % 2 === 0) {
                    hpBar.style.boxShadow = '0 0 10px #ff0000cc';
                }
            }
        }
        if (hpText) hpText.textContent = `${Math.ceil(hp)}/${maxHp}`;

        const gEl = document.getElementById('nav-gold-deck');
        if (gEl && goldSlots !== undefined) {
            gEl.textContent = '🟠'.repeat(Math.max(0, Math.min(5, goldSlots ?? 3))) || '—';
        }
        const gvEl = document.getElementById('nav-gold-val');
        if (gvEl && gold !== undefined) gvEl.textContent = `${Math.floor(gold ?? 0).toLocaleString()}`;
        const mvEl = document.getElementById('nav-mats-val');
        if (mvEl && mats !== undefined) mvEl.textContent = `${Math.floor(mats ?? 0)}`;
    }

    show() {
        if (this._el)         { this._el.style.display = 'flex'; this.visible = true; }
        if (this._statsEl)    this._statsEl.style.display = 'flex';
        if (this._playerInfoEl) this._playerInfoEl.style.display = 'flex';
    }

    hide() {
        if (this._el)         { this._el.style.display = 'none'; this.visible = false; }
        if (this._statsEl)    this._statsEl.style.display = 'none';
        if (this._playerInfoEl) this._playerInfoEl.style.display = 'none';
    }

    toggle() {
        if (this.visible) this.hide(); else this.show();
    }

    destroy() {
        this._el?.remove();
        this._statsEl?.remove();
        this._playerInfoEl?.remove();
        this._levelUpEl?.remove();
    }
}
