export default class DomNavBar {
    constructor(scene) {
        this.scene = scene;
        this.visible = true;
        this._el = null;
        this._statsEl = null;
        this._build();
    }

    _buttons() {
        return [
            { label: 'HUD',      icon: '☰',  action: () => this.toggle() },
            { label: 'Werft',    icon: '⚓', action: () => this.scene.handleMenuAction('shipyard') },
            { label: 'Mission',  icon: '⇪',  action: () => this.scene.handleMenuAction('missions') },
            { label: 'Bonus',    icon: '◎',  action: () => this.scene.handleMenuAction('bonus') },
            { label: 'Geschäft', icon: '🛒', action: () => this.scene.handleMenuAction('shop') },
            { label: 'Events',   icon: '★',  action: () => this.scene.handleMenuAction('events') },
            { label: 'Rang',     icon: '♛',  action: () => this.scene.handleMenuAction('rank') },
            { label: 'Kampf',    icon: '⚔',  action: () => this.scene.handleMenuAction('combat') },
            { label: 'Board',    icon: '🗺️', action: () => this.scene.handleMenuAction('board') },
            { label: 'Ausfahrt', icon: '⛵', action: () => this.scene.handleMenuAction('sail') },
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
            b.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-width: 68px;
                padding: 4px 10px;
                background: transparent;
                border: none;
                border-right: 1px solid rgba(74,200,255,0.15);
                color: #dff8ff;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                flex-shrink: 0;
                transition: background 0.12s;
                gap: 2px;
                outline: none;
            `;
            b.innerHTML = `
                <span style="font-size:18px;line-height:1.1;">${btn.icon}</span>
                <span style="font-size:10px;color:#9fdcff;letter-spacing:0.5px;">${btn.label}</span>
            `;
            const activate = (e) => {
                e.preventDefault();
                e.stopPropagation();
                b.style.background = 'rgba(74,200,255,0.18)';
                setTimeout(() => { b.style.background = 'transparent'; }, 180);
                btn.action();
            };
            b.addEventListener('touchend', activate, { passive: false });
            b.addEventListener('click', activate);
            b.addEventListener('touchstart', (e) => {
                b.style.background = 'rgba(74,200,255,0.12)';
            }, { passive: true });
            el.appendChild(b);
        });

        document.body.appendChild(el);
        this._el = el;

        const stats = document.createElement('div');
        stats.id = 'nav-stats';
        stats.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            height: 52px;
            z-index: 9001;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
            padding: 0 12px 0 18px;
            background: linear-gradient(270deg, rgba(4,14,30,0.98) 0%, rgba(4,14,30,0.90) 70%, transparent 100%);
            border-bottom: 2px solid rgba(74,200,255,0.4);
            border-left: 1px solid rgba(74,200,255,0.18);
            min-width: 210px;
            pointer-events: none;
            font-family: Arial, sans-serif;
            padding-top: env(safe-area-inset-top, 0px);
            box-sizing: border-box;
        `;
        stats.innerHTML = `
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:10px;font-weight:bold;color:#8fd8ff;width:28px;letter-spacing:0.5px;flex-shrink:0;">EXP</span>
                <div style="flex:1;height:7px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">
                    <div id="nav-exp-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#3a9ff5,#63d6ff);border-radius:4px;transition:width 0.4s;"></div>
                </div>
                <span id="nav-exp-text" style="font-size:9px;color:#9fdcff;min-width:60px;text-align:right;white-space:nowrap;">0/100</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:10px;font-weight:bold;color:#60ff90;width:28px;letter-spacing:0.5px;flex-shrink:0;">HP</span>
                <div style="flex:1;height:7px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">
                    <div id="nav-hp-bar" style="height:100%;width:100%;background:linear-gradient(90deg,#25d15e,#45ff85);border-radius:4px;transition:width 0.4s;"></div>
                </div>
                <span id="nav-hp-text" style="font-size:9px;color:#9fdcff;min-width:60px;text-align:right;white-space:nowrap;">0/0</span>
            </div>
        `;
        document.body.appendChild(stats);
        this._statsEl = stats;
    }

    updateStats(xp, maxXp, hp, maxHp) {
        const xpBar  = document.getElementById('nav-exp-bar');
        const xpText = document.getElementById('nav-exp-text');
        const hpBar  = document.getElementById('nav-hp-bar');
        const hpText = document.getElementById('nav-hp-text');
        if (!xpBar) return;

        const xpPct = Math.max(0, Math.min(1, xp / maxXp)) * 100;
        const hpPct = Math.max(0, Math.min(1, hp / maxHp)) * 100;

        xpBar.style.width = `${xpPct.toFixed(1)}%`;
        if (xpText) xpText.textContent = `${Math.floor(xp)}/${maxXp}`;

        if (hpBar) {
            hpBar.style.width = `${hpPct.toFixed(1)}%`;
            hpBar.style.background = hpPct > 50
                ? 'linear-gradient(90deg,#25d15e,#45ff85)'
                : hpPct > 25
                    ? 'linear-gradient(90deg,#c8a020,#ffdc59)'
                    : 'linear-gradient(90deg,#c83030,#ff5f5f)';
        }
        if (hpText) hpText.textContent = `${Math.ceil(hp)}/${maxHp}`;
    }

    show() {
        if (this._el)    { this._el.style.display = 'flex'; this.visible = true; }
        if (this._statsEl) this._statsEl.style.display = 'flex';
    }

    hide() {
        if (this._el)    { this._el.style.display = 'none'; this.visible = false; }
        if (this._statsEl) this._statsEl.style.display = 'none';
    }

    toggle() {
        if (this.visible) this.hide(); else this.show();
    }

    destroy() {
        if (this._el?.parentNode)     this._el.parentNode.removeChild(this._el);
        if (this._statsEl?.parentNode) this._statsEl.parentNode.removeChild(this._statsEl);
    }
}
