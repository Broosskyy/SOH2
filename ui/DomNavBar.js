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
        this._buildStatsPanel();
        this._buildLevelUpPopup();
    }

    _buttons() {
        /* Ordered by usage frequency — most-used come first so they're
           reachable without scrolling on small screens */
        return [
            { label: 'Werft',   icon: '⚓', action: () => this.scene.handleMenuAction('shipyard') },
            { label: 'Hafen',   icon: '🏴', action: () => this.scene.handleMenuAction('hafen') },
            { label: 'Events',  icon: '⚔', action: () => this.scene.handleMenuAction('shipevents') },
            { label: 'Ostern',  icon: '🥚', action: () => this.scene.handleMenuAction('easter') },
            { label: 'Quests',  icon: '📋', action: () => this.scene.handleMenuAction('quests') },
            { label: 'Shop',    icon: '🛒', action: () => this.scene.handleMenuAction('shop') },
            { label: 'Gilde',   icon: '⚑',  action: () => this.scene.handleMenuAction('guild') },
            { label: 'Chat',    icon: '💬', action: () => this.scene.handleMenuAction('chat') },
            { label: 'Erfolge', icon: '🏆', action: () => this.scene.handleMenuAction('achievements') },
            { label: 'Logbuch', icon: '📜', action: () => this.scene.handleMenuAction('logbook') },
            { label: 'Rang',    icon: '♛',  action: () => this.scene.handleMenuAction('rank') },
            { label: 'Bonus',   icon: '◎',  action: () => this.scene.handleMenuAction('bonus') },
            { label: 'Mission', icon: '⇪',  action: () => this.scene.handleMenuAction('missions') },
            { label: 'Multi',   icon: '🌐', action: () => this.scene.handleMenuAction('multiplayer') },
            { label: 'Kanone',  icon: '💣', action: () => this.scene.handleMenuAction('cannon') },
            { label: 'Admin',   icon: '🛡', action: () => this.scene.handleMenuAction('admin'), adminBtn: true },
        ];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'dom-nav-bar';
        el.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 9000;
            display: flex;
            flex-direction: row;
            align-items: stretch;
            background: linear-gradient(180deg, rgba(3,10,24,0.97) 0%, rgba(5,16,40,0.95) 100%);
            border-bottom: 2px solid rgba(74,200,255,0.45);
            box-shadow: 0 3px 20px rgba(0,0,0,0.8);
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            font-family: Arial, sans-serif;
            user-select: none;
            -webkit-user-select: none;
            touch-action: pan-x;
            height: 46px;
            flex-shrink: 0;
            padding-top: env(safe-area-inset-top, 0px);
        `;
        el.style.setProperty('scrollbar-width', 'none');

        /* Linker Abstand — reserviert Platz für das Player-Info-Panel */
        const lSpacer = document.createElement('div');
        lSpacer.id = 'nav-left-spacer';
        lSpacer.style.cssText = 'min-width:140px;flex-shrink:0;pointer-events:none;';
        el.appendChild(lSpacer);

        this._buttons().forEach(btn => {
            const isAdmin = btn.adminBtn === true;
            const b = document.createElement('button');
            b.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-width: 48px;
                padding: 3px 4px;
                background: ${isAdmin ? 'rgba(170,68,255,0.2)' : 'transparent'};
                border: none;
                border-right: 1px solid ${isAdmin ? 'rgba(170,68,255,0.4)' : 'rgba(74,200,255,0.10)'};
                color: ${isAdmin ? '#cc88ff' : '#dff8ff'};
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                flex-shrink: 0;
                transition: background 0.12s;
                gap: 1px;
                outline: none;
                min-height: 46px;
                ${isAdmin ? 'box-shadow: inset 0 0 10px rgba(170,68,255,0.15);' : ''}
            `;
            b.innerHTML = `
                <span style="font-size:16px;line-height:1.1;">${btn.icon}</span>
                <span style="font-size:8px;color:${isAdmin ? '#cc88ff' : '#9fdcff'};letter-spacing:0.2px;">${btn.label}</span>
            `;
            const activate = (e) => {
                e.preventDefault(); e.stopPropagation();
                b.style.background = 'rgba(74,200,255,0.25)';
                setTimeout(() => { b.style.background = isAdmin ? 'rgba(170,68,255,0.2)' : 'transparent'; }, 200);
                btn.action();
            };
            b.addEventListener('touchend', activate, { passive: false });
            b.addEventListener('click', activate);
            b.addEventListener('touchstart', () => { b.style.background = 'rgba(74,200,255,0.12)'; }, { passive: true });
            el.appendChild(b);
        });

        /* Kein rechter Spacer mehr — Buttons gehen bis zum Rand */

        document.body.appendChild(el);
        this._el = el;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'F9' || (e.key === 'a' && e.ctrlKey && e.shiftKey)) {
                e.preventDefault();
                this.scene.handleMenuAction?.('admin');
            }
        });
    }

    _buildPlayerInfo() {
        const el = document.createElement('div');
        el.id = 'nav-player-info';
        el.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 138px;
            height: 46px;
            z-index: 9002;
            display: flex;
            align-items: center;
            padding: 0 6px;
            gap: 5px;
            background: linear-gradient(135deg, rgba(3,10,24,0.99) 0%, rgba(5,16,36,0.97) 100%);
            border-bottom: 2px solid rgba(212,175,55,0.6);
            border-right: 1px solid rgba(212,175,55,0.22);
            box-sizing: border-box;
            pointer-events: none;
            font-family: Arial, sans-serif;
            padding-top: env(safe-area-inset-top, 0px);
            flex-shrink: 0;
        `;
        el.innerHTML = `
            <div id="nav-avatar" style="
                width:28px;height:28px;border-radius:50%;flex-shrink:0;
                background:linear-gradient(135deg,#1a3a6a,#0d2040);
                border:2px solid rgba(212,175,55,0.75);
                display:flex;align-items:center;justify-content:center;
                font-size:14px;box-shadow:0 0 8px rgba(212,175,55,0.3);
            ">⚓</div>
            <div style="flex:1;min-width:0;overflow:hidden;">
                <div style="display:flex;align-items:center;gap:3px;flex-wrap:nowrap;">
                    <span id="nav-player-name" style="
                        font-size:10px;font-weight:bold;color:#ffd36a;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px;
                    ">Kapitän</span>
                    <span id="nav-level-badge" style="
                        font-size:8px;font-weight:bold;color:#fff;
                        background:linear-gradient(135deg,#1a5a9a,#0d3a6a);
                        border:1px solid rgba(74,200,255,0.5);
                        border-radius:3px;padding:1px 3px;flex-shrink:0;
                    ">Lv.1</span>
                </div>
                <div style="margin-top:1px;">
                    <span id="nav-guild-tag" style="
                        font-size:8px;color:#c8a060;white-space:nowrap;overflow:hidden;
                        text-overflow:ellipsis;display:block;max-width:90px;
                    ">Kein Gildenverband</span>
                </div>
            </div>
        `;
        document.body.appendChild(el);
        this._playerInfoEl = el;
    }

    /* Stats-Panel jetzt LINKS — direkt unter dem Player-Info-Panel */
    _buildStatsPanel() {
        const stats = document.createElement('div');
        stats.id = 'nav-stats';
        stats.style.cssText = `
            position: fixed;
            top: 46px;
            left: 0;
            width: 166px;
            z-index: 9001;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
            padding: 5px 10px 6px 10px;
            background: linear-gradient(180deg, rgba(4,12,30,0.97) 0%, rgba(5,18,40,0.94) 100%);
            border-bottom: 1px solid rgba(74,200,255,0.25);
            border-right: 1px solid rgba(74,200,255,0.15);
            box-sizing: border-box;
            pointer-events: none;
            font-family: Arial, sans-serif;
        `;
        stats.innerHTML = `
            <!-- EXP -->
            <div style="display:flex;align-items:center;gap:3px;">
                <span style="font-size:8px;font-weight:bold;color:#4ac8ff;width:16px;flex-shrink:0;">EXP</span>
                <div style="flex:1;height:6px;background:rgba(0,0,0,0.6);border-radius:3px;overflow:hidden;border:1px solid rgba(74,200,255,0.18);">
                    <div id="nav-exp-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#1a6fdd,#4ac8ff);border-radius:3px;transition:width 0.5s;box-shadow:0 0 5px #4ac8ff55;"></div>
                </div>
                <span id="nav-exp-text" style="font-size:8px;color:#7fd8ff;min-width:38px;text-align:right;font-weight:bold;white-space:nowrap;">0/100</span>
            </div>
            <!-- HP -->
            <div style="display:flex;align-items:center;gap:3px;">
                <span style="font-size:8px;font-weight:bold;color:#45ff85;width:16px;flex-shrink:0;">HP</span>
                <div style="flex:1;height:6px;background:rgba(0,0,0,0.6);border-radius:3px;overflow:hidden;border:1px solid rgba(69,255,133,0.18);">
                    <div id="nav-hp-bar" style="height:100%;width:100%;background:linear-gradient(90deg,#0da044,#45ff85);border-radius:3px;transition:width 0.3s;box-shadow:0 0 5px #45ff8555;"></div>
                </div>
                <span id="nav-hp-text" style="font-size:8px;color:#7fffb0;min-width:38px;text-align:right;font-weight:bold;white-space:nowrap;">0/0</span>
            </div>
            <!-- Gold + Mats -->
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:nowrap;">
                <span style="font-size:11px;flex-shrink:0;">🪙</span>
                <span id="nav-gold-val" style="font-size:10px;font-weight:bold;color:#ffd36a;min-width:28px;">0</span>
                <span style="color:#334;font-size:9px;">│</span>
                <span style="font-size:11px;flex-shrink:0;">🔧</span>
                <span id="nav-mats-val" style="font-size:10px;color:#b8f0ff;min-width:22px;">0</span>
                <span id="nav-gold-deck" style="font-size:8px;color:#ffd36a;margin-left:2px;">🟠🟠🟠</span>
            </div>
        `;
        document.body.appendChild(stats);
        this._statsEl = stats;
    }

    _buildLevelUpPopup() {
        const el = document.createElement('div');
        el.id = 'level-up-popup';
        el.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%,-50%) scale(0.5);
            z-index: 18000;
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            padding: 24px 32px 20px;
            background: radial-gradient(ellipse at 50% 0%, rgba(20,50,100,0.98) 0%, rgba(4,12,28,0.99) 70%);
            border: 2px solid rgba(212,175,55,0.85);
            border-radius: 20px;
            box-shadow: 0 0 80px rgba(212,175,55,0.4), 0 0 180px rgba(74,200,255,0.15), inset 0 0 50px rgba(0,0,0,0.5);
            pointer-events: auto;
            font-family: Arial, sans-serif;
            text-align: center;
            opacity: 0;
            transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
            min-width: 260px;
            max-width: min(340px, 90vw);
        `;
        el.innerHTML = `
            <div id="lu-star" style="font-size:52px;line-height:1;">⭐</div>
            <div style="font-size:11px;color:#9fdcff;text-transform:uppercase;letter-spacing:3px;font-weight:bold;">Aufgestiegen!</div>
            <div id="lu-level" style="font-size:40px;font-weight:900;color:#ffd36a;text-shadow:0 0 24px rgba(255,211,106,0.7);line-height:1;">Level 2</div>
            <div id="lu-rewards" style="font-size:12px;color:#b8f0ff;line-height:1.8;"></div>
            <div id="lu-trial-notice" style="display:none;font-size:11px;color:#ffa040;padding:6px 16px;background:rgba(255,160,64,0.12);border:1px solid rgba(255,160,64,0.45);border-radius:10px;"></div>
            <button id="lu-close" style="
                margin-top:6px;padding:10px 36px;
                background:linear-gradient(135deg,#1a5a9a,#0d3a6a);
                border:1px solid rgba(74,200,255,0.5);border-radius:10px;
                color:#9fdcff;font-size:14px;font-weight:bold;
                cursor:pointer;letter-spacing:0.5px;touch-action:manipulation;
                -webkit-tap-highlight-color:transparent;
            ">Weiter ▶</button>
        `;
        document.body.appendChild(el);
        el.querySelector('#lu-close').addEventListener('click', () => this.hideLevelUp());
        el.querySelector('#lu-close').addEventListener('touchend', (e) => { e.preventDefault(); this.hideLevelUp(); }, { passive: false });
        this._levelUpEl = el;
    }

    showLevelUp(level, rewards = [], trialNotice = '') {
        const el = this._levelUpEl;
        if (!el) return;
        el.querySelector('#lu-level').textContent = `Level ${level}`;
        el.querySelector('#lu-rewards').innerHTML = ['+1 Skillpunkt', ...rewards].map(r => `• ${r}`).join('<br>');
        const trialEl = el.querySelector('#lu-trial-notice');
        if (trialNotice) { trialEl.textContent = `⚔ ${trialNotice}`; trialEl.style.display = 'block'; }
        else { trialEl.style.display = 'none'; }
        el.style.display = 'flex';
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translate(-50%,-50%) scale(1)';
        });
        setTimeout(() => this.hideLevelUp(), 7000);
    }

    hideLevelUp() {
        const el = this._levelUpEl;
        if (!el) return;
        el.style.opacity = '0';
        el.style.transform = 'translate(-50%,-50%) scale(0.75)';
        setTimeout(() => { el.style.display = 'none'; }, 350);
    }

    setPlayerInfo(name, level, guildTag, guildName) {
        const nameEl = document.getElementById('nav-player-name');
        const lvlEl  = document.getElementById('nav-level-badge');
        const tagEl  = document.getElementById('nav-guild-tag');
        if (nameEl) nameEl.textContent = name ?? 'Kapitän';
        if (lvlEl)  lvlEl.textContent  = `Lv.${level ?? 1}`;
        if (tagEl) {
            tagEl.innerHTML = guildTag
                ? `<span style="color:#e6cb79">[${guildTag}]</span> <span style="color:#888">${guildName ?? ''}</span>`
                : 'Kein Gildenverband';
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
            hpBar.style.background = hpPct > 50
                ? 'linear-gradient(90deg,#0da044,#45ff85)'
                : hpPct > 25
                    ? 'linear-gradient(90deg,#c8a020,#ffdc59)'
                    : 'linear-gradient(90deg,#c83030,#ff5f5f)';
            hpBar.style.boxShadow = hpPct < 20 && (Math.floor(Date.now() / 600) % 2 === 0)
                ? '0 0 12px #ff0000cc'
                : `0 0 5px ${hpPct > 50 ? '#45ff8566' : hpPct > 25 ? '#ffdc5966' : '#ff5f5f66'}`;
        }
        if (hpText) hpText.textContent = `${Math.ceil(hp)}/${maxHp}`;

        const gEl = document.getElementById('nav-gold-deck');
        if (gEl && goldSlots !== undefined)
            gEl.textContent = '🟠'.repeat(Math.max(0, Math.min(5, goldSlots ?? 3))) || '–';
        const gvEl = document.getElementById('nav-gold-val');
        if (gvEl && gold !== undefined) gvEl.textContent = gold >= 1000 ? `${(gold/1000).toFixed(1)}K` : `${Math.floor(gold)}`;
        const mvEl = document.getElementById('nav-mats-val');
        if (mvEl && mats !== undefined) mvEl.textContent = `${Math.floor(mats ?? 0)}`;
    }

    show() {
        if (this._el)           { this._el.style.display = 'flex'; this.visible = true; }
        if (this._statsEl)      this._statsEl.style.display = 'flex';
        if (this._playerInfoEl) this._playerInfoEl.style.display = 'flex';
    }

    hide() {
        if (this._el)           { this._el.style.display = 'none'; this.visible = false; }
        if (this._statsEl)      this._statsEl.style.display = 'none';
        if (this._playerInfoEl) this._playerInfoEl.style.display = 'none';
    }

    toggle() { if (this.visible) this.hide(); else this.show(); }

    destroy() {
        this._el?.remove();
        this._statsEl?.remove();
        this._playerInfoEl?.remove();
        this._levelUpEl?.remove();
    }
}
