export default class ChartNav {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._attackBtn = null;
        this._build();
    }

    _build() {
        const nav = document.createElement('div');
        nav.id = 'chart-nav';
        nav.style.cssText = `
            position: fixed;
            top: 318px;
            right: 12px;
            left: auto;
            transform: none;
            z-index: 8500;
            display: flex;
            align-items: stretch;
            gap: 0;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            font-family: Georgia, serif;
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid rgba(180,140,50,0.55);
            box-shadow: 0 2px 8px rgba(0,0,0,0.5), inset 0 0 6px rgba(180,140,50,0.04);
        `;

        const s = this.scene;

        const westBtn = document.createElement('button');
        westBtn.id = 'chart-nav-west';
        westBtn.style.cssText = `
            width: 28px; height: 32px;
            border-radius: 0;
            background: linear-gradient(135deg, #0d1e30, #0a1826);
            border: none;
            border-right: 1px solid rgba(180,140,50,0.3);
            color: #c8a84a;
            font-size: 12px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.15s;
            padding: 0;
            flex-shrink: 0;
        `;
        westBtn.textContent = '◄';

        const center = document.createElement('div');
        center.style.cssText = `
            flex: 1;
            height: 32px;
            background: linear-gradient(160deg, #0a1826, #081420);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1px;
            padding: 0 6px;
            min-width: 0;
        `;
        const numEl = document.createElement('div');
        numEl.id = 'chart-nav-num';
        numEl.style.cssText = `font-size:11px;font-weight:bold;color:#d4aa40;letter-spacing:1px;line-height:1;font-family:Georgia,serif;text-shadow:0 0 6px rgba(212,170,64,0.3);`;
        const nameEl = document.createElement('div');
        nameEl.id = 'chart-nav-name';
        nameEl.style.cssText = `font-size:8px;color:#a08030;line-height:1;font-family:Georgia,serif;`;
        center.appendChild(numEl);
        center.appendChild(nameEl);

        const eastBtn = document.createElement('button');
        eastBtn.id = 'chart-nav-east';
        eastBtn.style.cssText = `
            width: 28px; height: 32px;
            border-radius: 0;
            background: linear-gradient(135deg, #0a1826, #0d1e30);
            border: none;
            border-left: 1px solid rgba(180,140,50,0.3);
            color: #c8a84a;
            font-size: 12px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.15s;
            padding: 0;
            flex-shrink: 0;
        `;
        eastBtn.textContent = '►';

        this._attackBtn = null; /* FEUER button removed from ChartNav — use main FEUER button */

        const doWest = (e) => {
            e.preventDefault();
            const idx = s.currentChartIndex ?? 1;
            if (idx <= 1) return;
            westBtn.style.background = 'linear-gradient(135deg, #1a2e18, #152818)';
            setTimeout(() => { westBtn.style.background = 'linear-gradient(135deg, #0d1e30, #0a1826)'; }, 180);
            s.transitionToChart?.(idx - 1, 'west');
        };
        const doEast = (e) => {
            e.preventDefault();
            const idx = s.currentChartIndex ?? 1;
            const max = s.maxChartIndex ?? 10;
            if (idx >= max) return;
            eastBtn.style.background = 'linear-gradient(135deg, #1a2e18, #152818)';
            setTimeout(() => { eastBtn.style.background = 'linear-gradient(135deg, #0a1826, #0d1e30)'; }, 180);
            s.transitionToChart?.(idx + 1, 'east');
        };

        westBtn.addEventListener('click', doWest);
        westBtn.addEventListener('touchend', doWest, { passive: false });
        eastBtn.addEventListener('click', doEast);
        eastBtn.addEventListener('touchend', doEast, { passive: false });

        nav.appendChild(westBtn);
        nav.appendChild(center);
        nav.appendChild(eastBtn);
        document.body.appendChild(nav);
        this._el = nav;

        this.refresh();
    }

    refresh() {
        const s   = this.scene;
        const idx = s.currentChartIndex ?? 1;
        const cfg = s.getChartConfig?.(idx);

        const numEl   = document.getElementById('chart-nav-num');
        const nameEl  = document.getElementById('chart-nav-name');
        const westBtn = document.getElementById('chart-nav-west');
        const eastBtn = document.getElementById('chart-nav-east');

        /* Gitter-Position anzeigen: Zeile/Spalte wie Seafight */
        const col = cfg?.col ?? 0;
        const row = cfg?.row ?? 0;
        const gridPos = `[${col + 1}-${row + 1}]`;

        if (numEl)  numEl.textContent  = `K${idx} ${gridPos}`;
        if (nameEl) nameEl.textContent = cfg?.name ?? `Seekarte ${idx}`;

        /* Buttons zeigen ob ein Nachbar in diese Richtung existiert */
        const nb = cfg?.neighbors ?? {};
        const canWest = !!nb.west;
        const canEast = !!nb.east;
        if (westBtn) { westBtn.style.opacity = canWest ? '1' : '0.25'; westBtn.style.cursor = canWest ? 'pointer' : 'default'; }
        if (eastBtn) { eastBtn.style.opacity = canEast ? '1' : '0.25'; eastBtn.style.cursor = canEast ? 'pointer' : 'default'; }
    }

    setShipVisible(_v) { /* ship button now lives as #ahc-ship-btn (bottom-left) */ }

    setAttackVisible(v) {
        if (this._attackBtn) this._attackBtn.style.display = v ? 'flex' : 'none';
    }

    repositionUnderMinimap(mmLeft, mmTop, mmHeight, mmWidth) {
        if (!this._el) return;
        this._el.style.top    = `${Math.round(mmTop + mmHeight)}px`;
        this._el.style.right  = '12px';
        this._el.style.left   = 'auto';
        this._el.style.bottom = 'auto';
        this._el.style.transform = 'none';
        this._el.style.width  = `${Math.round(mmWidth)}px`;
        this._el.style.boxSizing = 'border-box';
    }

    setVisible(v) { if (this._el) this._el.style.display = v ? 'flex' : 'none'; }

    destroy() {
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
    }
}
