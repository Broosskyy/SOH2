export default class EdgeMapButtons {
    constructor(scene) {
        this.scene   = scene;
        this._btns   = {};
        this._shown  = {};
        this._target = {};
        this._build();
    }

    _build() {
        ['east', 'west', 'north', 'south'].forEach(dir => {
            const el = document.createElement('div');
            el.style.cssText = this._baseStyle(dir);
            el.style.display = 'none';
            el.setAttribute('data-edge-dir', dir);
            el.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const idx = this._target[dir];
                if (idx != null) this.scene.transitionToChart(idx, dir);
            });
            document.body.appendChild(el);
            this._btns[dir] = el;
        });
    }

    _baseStyle(dir) {
        const pos = {
            east:  'right:10px; top:50%; transform:translateY(-50%); flex-direction:column; border-radius:10px 0 0 10px; border-right:none;',
            west:  'left:10px; top:50%; transform:translateY(-50%); flex-direction:column; border-radius:0 10px 10px 0; border-left:none;',
            north: 'top:10px; left:50%; transform:translateX(-50%); flex-direction:row; border-radius:0 0 10px 10px; border-top:none;',
            south: 'bottom:72px; left:50%; transform:translateX(-50%); flex-direction:row; border-radius:10px 10px 0 0; border-bottom:none;',
        }[dir] ?? '';
        return `
            position:fixed;
            z-index:7300;
            display:none;
            align-items:center;
            justify-content:center;
            gap:5px;
            cursor:pointer;
            touch-action:manipulation;
            -webkit-tap-highlight-color:transparent;
            user-select:none;
            -webkit-user-select:none;
            font-family:Arial,sans-serif;
            font-size:12px;
            font-weight:bold;
            letter-spacing:0.5px;
            background:linear-gradient(160deg,rgba(8,22,42,0.95),rgba(12,34,60,0.97));
            border:1.5px solid rgba(99,214,255,0.6);
            color:#dff8ff;
            padding:8px 14px;
            box-shadow:0 0 20px rgba(60,190,255,0.25);
            transition:opacity 0.18s;
            ${pos}
        `;
    }

    _buildHTML(dir, chartIndex, chartName, locked) {
        const arrow  = { east:'▶', west:'◀', north:'▲', south:'▼' }[dir] ?? '▶';
        const nameStr = chartName ? `<span style="font-size:10px;color:${locked?'#ff7a7a':'#63d6ff'};display:block;text-align:center;line-height:1.4">${locked ? '🔒 ' : ''}Seekarte ${chartIndex}</span>` : '';
        const label   = `<span style="font-size:13px;line-height:1">${arrow} ${chartName ?? `Karte ${chartIndex}`}</span>`;
        return nameStr + label;
    }

    update(edgeNearby) {
        const s = this.scene;
        ['east', 'west', 'north', 'south'].forEach(dir => {
            const idx = edgeNearby?.[dir];
            const btn = this._btns[dir];
            if (!btn) return;

            if (idx != null) {
                this._target[dir] = idx;
                const cfg    = s.getChartConfig?.(idx);
                const locked = !s.canAccessChart?.(idx);

                if (!this._shown[dir]) {
                    btn.innerHTML = this._buildHTML(dir, idx, cfg?.name, locked);
                    btn.style.border = `1.5px solid rgba(${locked ? '255,120,80' : '99,214,255'},0.6)`;
                    btn.style.display = 'flex';
                    this._shown[dir] = true;
                }
            } else if (this._shown[dir]) {
                btn.style.display = 'none';
                this._shown[dir]  = false;
            }
        });
    }

    destroy() {
        Object.values(this._btns).forEach(el => el?.parentNode?.removeChild(el));
    }
}
