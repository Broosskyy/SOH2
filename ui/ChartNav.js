export default class ChartNav {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
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
            gap: 0;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            font-family: Arial, sans-serif;
        `;

        const s = this.scene;

        const westBtn = document.createElement('button');
        westBtn.id = 'chart-nav-west';
        westBtn.style.cssText = `
            width: 48px; height: 48px;
            border-radius: 50% 0 0 50%;
            background: linear-gradient(135deg, #0a1a2e, #0d2040);
            border: 2px solid rgba(99,214,255,0.4);
            border-right: none;
            color: #9fdcff;
            font-size: 20px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.15s, border-color 0.15s;
            padding: 0;
        `;
        westBtn.textContent = '◄';

        const center = document.createElement('div');
        center.style.cssText = `
            min-width: 90px;
            height: 48px;
            background: linear-gradient(135deg, #0d2040, #0a1a2e);
            border-top: 2px solid rgba(99,214,255,0.4);
            border-bottom: 2px solid rgba(99,214,255,0.4);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1px;
            padding: 0 12px;
        `;
        const numEl = document.createElement('div');
        numEl.id = 'chart-nav-num';
        numEl.style.cssText = `font-size:17px;font-weight:bold;color:#dff8ff;letter-spacing:1px;line-height:1;`;
        const nameEl = document.createElement('div');
        nameEl.id = 'chart-nav-name';
        nameEl.style.cssText = `font-size:10px;color:#63d6ff;line-height:1;`;
        center.appendChild(numEl);
        center.appendChild(nameEl);

        const eastBtn = document.createElement('button');
        eastBtn.id = 'chart-nav-east';
        eastBtn.style.cssText = `
            width: 48px; height: 48px;
            border-radius: 0 50% 50% 0;
            background: linear-gradient(135deg, #0d2040, #0a1a2e);
            border: 2px solid rgba(99,214,255,0.4);
            border-left: none;
            color: #9fdcff;
            font-size: 20px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.15s, border-color 0.15s;
            padding: 0;
        `;
        eastBtn.textContent = '►';

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

        nav.appendChild(westBtn);
        nav.appendChild(center);
        nav.appendChild(eastBtn);
        document.body.appendChild(nav);
        this._el = nav;

        this.refresh();
    }

    refresh() {
        const s = this.scene;
        const idx = s.currentChartIndex ?? 1;
        const max = s.maxChartIndex ?? 10;
        const cfg = s.getChartConfig?.(idx);

        const numEl = document.getElementById('chart-nav-num');
        const nameEl = document.getElementById('chart-nav-name');
        const westBtn = document.getElementById('chart-nav-west');
        const eastBtn = document.getElementById('chart-nav-east');

        if (numEl) numEl.textContent = String(idx);
        if (nameEl) nameEl.textContent = cfg?.name ?? `Seekarte ${idx}`;

        const canWest = idx > 1;
        const canEast = idx < max;
        if (westBtn) {
            westBtn.style.opacity = canWest ? '1' : '0.3';
            westBtn.style.cursor = canWest ? 'pointer' : 'default';
        }
        if (eastBtn) {
            eastBtn.style.opacity = canEast ? '1' : '0.3';
            eastBtn.style.cursor = canEast ? 'pointer' : 'default';
        }
    }

    setVisible(v) { if (this._el) this._el.style.display = v ? 'flex' : 'none'; }

    destroy() {
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
    }
}
