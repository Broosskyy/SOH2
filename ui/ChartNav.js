export default class ChartNav {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._shipBtn = null;
        this._attackBtn = null;
        this._build();
    }

    _build() {
        const nav = document.createElement('div');
        nav.id = 'chart-nav';
        nav.style.cssText = `
            position: fixed;
            bottom: calc(14px + env(safe-area-inset-bottom, 0px));
            left: 50%;
            transform: translateX(-50%);
            z-index: 8000;
            display: flex;
            align-items: center;
            gap: 8px;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            font-family: Arial, sans-serif;
        `;

        const s = this.scene;

        const shipBtn = document.createElement('button');
        shipBtn.id = 'chart-ship-btn';
        shipBtn.style.cssText = `
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0a1a2e, #1a3060);
            border: 2px solid rgba(255,200,80,0.55);
            color: #ffd080;
            font-size: 20px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.7);
            transition: background 0.15s;
            flex-shrink: 0;
        `;
        shipBtn.textContent = '⚓';
        const doShip = (e) => {
            e.preventDefault();
            s.handleReturnToShipPressed?.();
        };
        shipBtn.addEventListener('click', doShip);
        shipBtn.addEventListener('touchend', doShip, { passive: false });
        this._shipBtn = shipBtn;

        const westBtn = document.createElement('button');
        westBtn.id = 'chart-nav-west';
        westBtn.style.cssText = `
            width: 44px; height: 44px;
            border-radius: 50% 0 0 50%;
            background: linear-gradient(135deg, #0a1a2e, #0d2040);
            border: 2px solid rgba(99,214,255,0.4);
            border-right: none;
            color: #9fdcff;
            font-size: 18px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.15s;
            padding: 0;
        `;
        westBtn.textContent = '◄';

        const center = document.createElement('div');
        center.style.cssText = `
            min-width: 80px;
            height: 44px;
            background: linear-gradient(135deg, #0d2040, #0a1a2e);
            border-top: 2px solid rgba(99,214,255,0.4);
            border-bottom: 2px solid rgba(99,214,255,0.4);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1px;
            padding: 0 10px;
        `;
        const numEl = document.createElement('div');
        numEl.id = 'chart-nav-num';
        numEl.style.cssText = `font-size:15px;font-weight:bold;color:#dff8ff;letter-spacing:1px;line-height:1;`;
        const nameEl = document.createElement('div');
        nameEl.id = 'chart-nav-name';
        nameEl.style.cssText = `font-size:9px;color:#63d6ff;line-height:1;`;
        center.appendChild(numEl);
        center.appendChild(nameEl);

        const eastBtn = document.createElement('button');
        eastBtn.id = 'chart-nav-east';
        eastBtn.style.cssText = `
            width: 44px; height: 44px;
            border-radius: 0 50% 50% 0;
            background: linear-gradient(135deg, #0d2040, #0a1a2e);
            border: 2px solid rgba(99,214,255,0.4);
            border-left: none;
            color: #9fdcff;
            font-size: 18px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.15s;
            padding: 0;
        `;
        eastBtn.textContent = '►';

        const attackBtn = document.createElement('button');
        attackBtn.id = 'chart-attack-btn';
        attackBtn.style.cssText = `
            height: 44px;
            padding: 0 14px;
            border-radius: 22px;
            background: linear-gradient(135deg, #6a0c0c, #c01010);
            border: 2px solid rgba(255,100,80,0.7);
            color: #fff;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 1px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            display: none;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 12px rgba(200,30,30,0.5);
            transition: background 0.15s;
            flex-shrink: 0;
            white-space: nowrap;
        `;
        attackBtn.textContent = '⚔ FEUER';
        const doAttack = (e) => {
            e.preventDefault();
            s.handleAttackButtonPressed?.();
            attackBtn.style.background = 'linear-gradient(135deg, #9a1818, #e01818)';
            setTimeout(() => { attackBtn.style.background = 'linear-gradient(135deg, #6a0c0c, #c01010)'; }, 200);
        };
        attackBtn.addEventListener('click', doAttack);
        attackBtn.addEventListener('touchend', doAttack, { passive: false });
        this._attackBtn = attackBtn;

        const repairBtn = document.createElement('button');
        repairBtn.id = 'chart-repair-btn';
        repairBtn.style.cssText = `
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0d280d, #1a4a1a);
            border: 2px solid rgba(80,220,100,0.65);
            color: #7fffb0;
            font-size: 19px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.6), 0 0 8px rgba(60,200,80,0.25);
            transition: background 0.15s, box-shadow 0.15s;
            flex-shrink: 0;
        `;
        repairBtn.title = 'Schiff reparieren';
        repairBtn.textContent = '🔧';
        const doRepair = (e) => {
            e.preventDefault();
            repairBtn.style.background = 'linear-gradient(135deg, #1a5a1a, #2a7a2a)';
            repairBtn.style.boxShadow  = '0 0 18px rgba(60,200,80,0.6)';
            setTimeout(() => {
                repairBtn.style.background = 'linear-gradient(135deg, #0d280d, #1a4a1a)';
                repairBtn.style.boxShadow  = '0 2px 10px rgba(0,0,0,0.6), 0 0 8px rgba(60,200,80,0.25)';
            }, 200);
            s._tryNearestIslandRepair?.();
        };
        repairBtn.addEventListener('click', doRepair);
        repairBtn.addEventListener('touchend', doRepair, { passive: false });
        this._repairBtn = repairBtn;

        const doWest = (e) => {
            e.preventDefault();
            const idx = s.currentChartIndex ?? 1;
            if (idx <= 1) return;
            westBtn.style.background = 'linear-gradient(135deg, #0d2040, #1a3060)';
            setTimeout(() => { westBtn.style.background = 'linear-gradient(135deg, #0a1a2e, #0d2040)'; }, 180);
            s.transitionToChart?.(idx - 1, 'west');
        };
        const doEast = (e) => {
            e.preventDefault();
            const idx = s.currentChartIndex ?? 1;
            const max = s.maxChartIndex ?? 10;
            if (idx >= max) return;
            eastBtn.style.background = 'linear-gradient(135deg, #1a3060, #0d2040)';
            setTimeout(() => { eastBtn.style.background = 'linear-gradient(135deg, #0d2040, #0a1a2e)'; }, 180);
            s.transitionToChart?.(idx + 1, 'east');
        };

        westBtn.addEventListener('click', doWest);
        westBtn.addEventListener('touchend', doWest, { passive: false });
        eastBtn.addEventListener('click', doEast);
        eastBtn.addEventListener('touchend', doEast, { passive: false });

        nav.appendChild(shipBtn);
        nav.appendChild(westBtn);
        nav.appendChild(center);
        nav.appendChild(eastBtn);
        nav.appendChild(attackBtn);
        nav.appendChild(repairBtn);
        document.body.appendChild(nav);
        this._el = nav;

        this.refresh();
    }

    refresh() {
        const s = this.scene;
        const idx = s.currentChartIndex ?? 1;
        const max = s.maxChartIndex ?? 10;
        const cfg = s.getChartConfig?.(idx);

        const numEl   = document.getElementById('chart-nav-num');
        const nameEl  = document.getElementById('chart-nav-name');
        const westBtn = document.getElementById('chart-nav-west');
        const eastBtn = document.getElementById('chart-nav-east');

        if (numEl)  numEl.textContent  = String(idx);
        if (nameEl) nameEl.textContent = cfg?.name ?? `Seekarte ${idx}`;

        const canWest = idx > 1;
        const canEast = idx < max;
        if (westBtn) { westBtn.style.opacity = canWest ? '1' : '0.35'; westBtn.style.cursor = canWest ? 'pointer' : 'default'; }
        if (eastBtn) { eastBtn.style.opacity = canEast ? '1' : '0.35'; eastBtn.style.cursor = canEast ? 'pointer' : 'default'; }
    }

    setShipVisible(v) {
        if (this._shipBtn) this._shipBtn.style.display = v ? 'flex' : 'none';
    }

    setAttackVisible(v) {
        if (this._attackBtn) this._attackBtn.style.display = v ? 'flex' : 'none';
    }

    setVisible(v) { if (this._el) this._el.style.display = v ? 'flex' : 'none'; }

    destroy() {
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
    }
}
