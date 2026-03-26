export default class BoardPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this._el = null;
        this._build();
        this._bindEvents();
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'board-panel-overlay';
        el.style.cssText = `
            display: none; position: fixed; inset: 0; z-index: 9999;
            background: rgba(2,10,20,0.86); backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            align-items: flex-start; justify-content: center;
            padding-top: 70px; box-sizing: border-box;
            font-family: Arial, sans-serif; touch-action: none; overflow-y: auto;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            position: relative;
            background: linear-gradient(160deg, #0a1525 0%, #0d1e35 100%);
            border: 2px solid #63d6ff; border-radius: 18px;
            box-shadow: 0 0 40px rgba(99,214,255,0.2), 0 8px 40px rgba(0,0,0,0.8);
            width: min(460px, 96vw);
            max-height: calc(100dvh - 80px);
            overflow-y: auto; overflow-x: hidden;
            padding: 0 0 20px 0;
            scrollbar-width: thin; scrollbar-color: #2060a0 #0a1525;
            margin-bottom: 10px;
        `;

        panel.innerHTML = `
            <div style="
                display:flex;align-items:center;justify-content:space-between;
                padding:16px 20px 12px;
                border-bottom:1px solid rgba(99,214,255,0.25);
                position:sticky;top:0;z-index:2;
                background:linear-gradient(160deg,#0a1525 0%,#0d1e35 100%);
            ">
                <div>
                    <div style="font-size:19px;font-weight:bold;color:#dff8ff;letter-spacing:1px;">🗺️ Seekarte & HUD</div>
                    <div id="board-subtitle" style="font-size:12px;color:#63d6ff;margin-top:3px;"></div>
                </div>
                <button id="board-close-btn" style="
                    background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);
                    border-radius:50%;color:#fff;font-size:22px;
                    width:40px;height:40px;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;
                    touch-action:manipulation;-webkit-tap-highlight-color:transparent;
                ">×</button>
            </div>

            <div style="padding:14px 16px 6px;">
                <div style="font-size:10px;color:#2a7aaa;letter-spacing:1px;text-transform:uppercase;font-weight:bold;margin-bottom:10px;">⚓ KARTEN-NAVIGATION</div>
                <div id="board-chart-info" style="
                    background:rgba(99,214,255,0.08);border:1px solid rgba(99,214,255,0.2);
                    border-radius:12px;padding:12px 16px;margin-bottom:12px;
                "></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px;">
                    <button id="board-west-btn" style="
                        background:rgba(99,214,255,0.12);border:2px solid rgba(99,214,255,0.35);
                        border-radius:12px;color:#dff8ff;font-size:15px;font-weight:bold;
                        padding:14px 10px;cursor:pointer;touch-action:manipulation;
                        -webkit-tap-highlight-color:transparent;
                        display:flex;align-items:center;justify-content:center;gap:8px;
                    ">◀ <span id="board-west-label">Vorherige</span></button>
                    <button id="board-east-btn" style="
                        background:rgba(99,214,255,0.12);border:2px solid rgba(99,214,255,0.35);
                        border-radius:12px;color:#dff8ff;font-size:15px;font-weight:bold;
                        padding:14px 10px;cursor:pointer;touch-action:manipulation;
                        -webkit-tap-highlight-color:transparent;
                        display:flex;align-items:center;justify-content:center;gap:8px;
                    "><span id="board-east-label">Nächste</span> ▶</button>
                </div>
            </div>

            <div style="padding:4px 16px 6px;">
                <div style="font-size:10px;color:#2a7aaa;letter-spacing:1px;text-transform:uppercase;font-weight:bold;margin-bottom:10px;">📋 ALLE KARTEN</div>
                <div id="board-chart-list" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"></div>
            </div>

            <div style="padding:14px 16px 6px;border-top:1px solid rgba(99,214,255,0.1);margin-top:8px;">
                <div style="font-size:10px;color:#2a7aaa;letter-spacing:1px;text-transform:uppercase;font-weight:bold;margin-bottom:10px;">🎛 HUD-STEUERUNG</div>
                <div id="board-hud-controls" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"></div>
            </div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
    }

    _bindEvents() {
        const closeBtn = document.getElementById('board-close-btn');
        const doClose = (e) => { e.preventDefault(); this.hide(); };
        closeBtn.addEventListener('click', doClose);
        closeBtn.addEventListener('touchend', doClose, { passive: false });

        const westBtn = document.getElementById('board-west-btn');
        const doWest = (e) => {
            e.preventDefault();
            const s = this.scene;
            s.transitionToChart?.(s.currentChartIndex - 1, 'west');
            setTimeout(() => { this.hide(); }, 150);
        };
        westBtn.addEventListener('click', doWest);
        westBtn.addEventListener('touchend', doWest, { passive: false });

        const eastBtn = document.getElementById('board-east-btn');
        const doEast = (e) => {
            e.preventDefault();
            const s = this.scene;
            s.transitionToChart?.(s.currentChartIndex + 1, 'east');
            setTimeout(() => { this.hide(); }, 150);
        };
        eastBtn.addEventListener('click', doEast);
        eastBtn.addEventListener('touchend', doEast, { passive: false });

        this._el.addEventListener('click', (e) => { if (e.target === this._el) this.hide(); });
        this._el.addEventListener('touchend', (e) => { if (e.target === this._el) this.hide(); }, { passive: false });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });
    }

    _renderAll() {
        const s = this.scene;
        const cur = s.currentChartIndex ?? 1;
        const max = s.maxChartIndex ?? 10;
        const unlocked = s.getUnlockedChartIndex?.() ?? cur;
        const cfg = s.getChartConfig?.(cur) ?? { name: `Seekarte ${cur}`, requiredLevel: cur };

        const subtitle = document.getElementById('board-subtitle');
        if (subtitle) subtitle.textContent = `Aktiv: ${cfg.name} • ${unlocked}/${max} freigeschaltet`;

        const info = document.getElementById('board-chart-info');
        if (info) {
            info.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="font-size:36px;">🗺️</div>
                    <div>
                        <div style="font-size:16px;font-weight:bold;color:#dff8ff;">${cfg.name}</div>
                        <div style="font-size:12px;color:#63d6ff;margin-top:2px;">Karte ${cur} von ${max} • Level ${cfg.requiredLevel}+ empfohlen</div>
                        <div style="font-size:11px;color:#7ab8d4;margin-top:4px;">${unlocked} Karten freigeschaltet</div>
                    </div>
                </div>
            `;
        }

        const westLabel = document.getElementById('board-west-label');
        const eastLabel = document.getElementById('board-east-label');
        const westBtn = document.getElementById('board-west-btn');
        const eastBtn = document.getElementById('board-east-btn');

        const canWest = cur > 1;
        const canEast = cur < max;
        const westCfg = canWest ? s.getChartConfig?.(cur - 1) : null;
        const eastCfg = canEast ? s.getChartConfig?.(cur + 1) : null;
        const eastUnlocked = canEast && s.canAccessChart?.(cur + 1);

        if (westLabel) westLabel.textContent = canWest ? (westCfg?.name ?? `Karte ${cur - 1}`) : 'Erste Karte';
        if (eastLabel) eastLabel.textContent = canEast ? (eastCfg?.name ?? `Karte ${cur + 1}`) + (!eastUnlocked ? ` 🔒` : '') : 'Letzte Karte';
        if (westBtn) westBtn.style.opacity = canWest ? '1' : '0.35';
        if (eastBtn) { eastBtn.style.opacity = canEast ? '1' : '0.35'; eastBtn.style.borderColor = (!eastUnlocked && canEast) ? 'rgba(255,100,100,0.35)' : 'rgba(99,214,255,0.35)'; }

        const chartList = document.getElementById('board-chart-list');
        if (chartList) {
            chartList.innerHTML = '';
            for (let i = 1; i <= max; i++) {
                const chartCfg = s.getChartConfig?.(i) ?? { name: `Seekarte ${i}`, requiredLevel: i };
                const isActive = i === cur;
                const isUnlocked = i <= unlocked;
                const card = document.createElement('div');
                card.style.cssText = `
                    background: ${isActive ? 'rgba(99,214,255,0.18)' : 'rgba(255,255,255,0.04)'};
                    border: 1px solid ${isActive ? '#63d6ff' : isUnlocked ? 'rgba(99,214,255,0.2)' : 'rgba(255,255,255,0.06)'};
                    border-radius: 10px; padding: 10px 12px;
                    cursor: ${isUnlocked && !isActive ? 'pointer' : 'default'};
                    opacity: ${isUnlocked ? 1 : 0.4};
                    touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                `;
                card.innerHTML = `
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                        <span style="font-size:13px;">${isActive ? '📍' : isUnlocked ? '🗺️' : '🔒'}</span>
                        <span style="font-size:12px;font-weight:bold;color:${isActive ? '#63d6ff' : isUnlocked ? '#dff8ff' : '#555'};">${chartCfg.name}</span>
                    </div>
                    <div style="font-size:10px;color:#555;">Lvl ${chartCfg.requiredLevel}+ ${isActive ? '• Aktiv' : ''}</div>
                `;
                if (isUnlocked && !isActive) {
                    const dir = i > cur ? 'east' : 'west';
                    const doNav = (e) => {
                        e.preventDefault();
                        s.transitionToChart?.(i, dir);
                        setTimeout(() => this.hide(), 150);
                    };
                    card.addEventListener('click', doNav);
                    card.addEventListener('touchend', doNav, { passive: false });
                }
                chartList.appendChild(card);
            }
        }

        const hudControls = document.getElementById('board-hud-controls');
        if (hudControls) {
            const controls = [
                { label: 'Status-Feed',  icon: '📋', action: () => { s.toggleStatusFeedSize?.(); this.hide(); } },
                { label: 'Chat',         icon: '💬', action: () => { s.toggleChatSize?.(); this.hide(); } },
                { label: 'Minimap',      icon: '🗺',  action: () => { s.toggleMinimapSize?.(); this.hide(); } },
                { label: 'Schiff-Knopf', icon: '⛵', action: () => { s.toggleReturnToShipVisibility?.(); this.hide(); } },
                { label: 'Hafen',        icon: '🏰', action: () => { s.handleMenuAction?.('shipyard'); this.hide(); } },
                { label: 'Kampf-HUD',    icon: '⚔',  action: () => { s.handleMenuAction?.('combat'); this.hide(); } },
            ];
            hudControls.innerHTML = '';
            controls.forEach(c => {
                const btn = document.createElement('button');
                btn.style.cssText = `
                    background:rgba(255,255,255,0.05);border:1px solid rgba(99,214,255,0.2);
                    border-radius:10px;color:#dff8ff;font-size:12px;font-weight:bold;
                    padding:12px 8px;cursor:pointer;touch-action:manipulation;
                    -webkit-tap-highlight-color:transparent;
                    display:flex;align-items:center;justify-content:center;gap:6px;
                `;
                btn.innerHTML = `<span style="font-size:18px;">${c.icon}</span> ${c.label}`;
                btn.addEventListener('click', (e) => { e.preventDefault(); c.action(); });
                btn.addEventListener('touchend', (e) => { e.preventDefault(); c.action(); }, { passive: false });
                hudControls.appendChild(btn);
            });
        }
    }

    show() { this._renderAll(); this._el.style.display = 'flex'; this.visible = true; }
    hide() { this._el.style.display = 'none'; this.visible = false; }
    toggle() { if (this.visible) this.hide(); else this.show(); }
    destroy() { if (this._el?.parentNode) this._el.parentNode.removeChild(this._el); }
}
