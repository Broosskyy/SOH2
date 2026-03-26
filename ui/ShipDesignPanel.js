export default class ShipDesignPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._visible = false;
        this._currentKey = scene.player?.sprite?.texture?.key ?? 'player-ship';
    }

    _designs() {
        return [
            { key: 'player-ship',         src: 'assets/player_ship_royal_crimson_v1.webp', name: 'Royal Crimson',   class: 'Fregatte',    cost: 0 },
            { key: 'player-ship-neon',    src: 'assets/player_ship_neon_pro.webp',          name: 'Neon Phantom',    class: 'Fregatte',    cost: 1200 },
            { key: 'player-ship-pro',     src: 'assets/player_ship_pro.webp',               name: 'Sea Hawk Pro',    class: 'Fregatte',    cost: 800 },
            { key: 'player-ship-frigate1',src: 'assets/player_ship_frigate_1.png',          name: 'Dark Fregatte I', class: 'Fregatte',    cost: 1600 },
            { key: 'player-ship-frigate2',src: 'assets/player_ship_frigate_2.png',          name: 'Dark Fregatte II',class: 'Fregatte',    cost: 2000 },
            { key: 'player-ship-frigate3',src: 'assets/player_ship_frigate_3.png',          name: 'Schwarzer Geist', class: 'Fregatte',    cost: 2800 },
            { key: 'ship-small-1',        src: 'assets/ship_cutter_1.png',                  name: 'Kutter I',        class: 'Kutter',      cost: 200 },
            { key: 'ship-small-2',        src: 'assets/ship_cutter_2.png',                  name: 'Kutter II',       class: 'Kutter',      cost: 300 },
            { key: 'ship-small-3',        src: 'assets/ship_cutter_3.png',                  name: 'Kutter III',      class: 'Kutter',      cost: 400 },
            { key: 'ship-small-4',        src: 'assets/ship_cutter_4.png',                  name: 'Kutter IV',       class: 'Kutter',      cost: 500 },
            { key: 'ship-small-5',        src: 'assets/ship_cutter_5.png',                  name: 'Kutter V',        class: 'Kutter',      cost: 600 },
            { key: 'ship-medium-1',       src: 'assets/ship_brig_1.png',                    name: 'Brigantine I',    class: 'Brigantine',  cost: 1500 },
            { key: 'ship-medium-2',       src: 'assets/ship_brig_2.png',                    name: 'Brigantine II',   class: 'Brigantine',  cost: 1800 },
            { key: 'ship-medium-3',       src: 'assets/ship_brig_3.png',                    name: 'Brigantine III',  class: 'Brigantine',  cost: 2200 },
            { key: 'ship-large-1',        src: 'assets/ship_manwar_1.png',                  name: 'Man-o-War I',     class: 'Linienschiff',cost: 4000 },
            { key: 'ship-large-2',        src: 'assets/ship_manwar_2.png',                  name: 'Man-o-War II',    class: 'Linienschiff',cost: 5500 },
        ];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'ship-design-panel';
        el.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.75);
            font-family: Arial, sans-serif;
            padding: 8px;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            width: 100%;
            max-width: 560px;
            max-height: 90vh;
            background: linear-gradient(170deg, #0c1a2e 0%, #091526 100%);
            border: 2px solid #b8952a;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 0 40px rgba(184,149,42,0.25);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px 10px;
            border-bottom: 1px solid rgba(184,149,42,0.35);
            flex-shrink: 0;
        `;
        header.innerHTML = `
            <div style="font-size:16px;font-weight:bold;color:#d4aa40;letter-spacing:2px;">⛵ SCHIFFSWERFT</div>
            <button id="sdp-close" style="
                background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);
                color:#fff;font-size:18px;width:32px;height:32px;border-radius:50%;
                cursor:pointer;touch-action:manipulation;display:flex;align-items:center;
                justify-content:center;padding:0;
            ">✕</button>
        `;

        const body = document.createElement('div');
        body.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            -webkit-overflow-scrolling: touch;
        `;

        const designs = this._designs();
        const classes = [...new Set(designs.map(d => d.class))];

        classes.forEach(cls => {
            const clsDesigns = designs.filter(d => d.class === cls);
            const section = document.createElement('div');
            section.style.marginBottom = '14px';

            const title = document.createElement('div');
            title.style.cssText = `
                font-size: 11px;
                letter-spacing: 2px;
                color: #9fdcff;
                text-transform: uppercase;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(99,214,255,0.2);
                padding-bottom: 4px;
            `;
            title.textContent = cls;
            section.appendChild(title);

            const grid = document.createElement('div');
            grid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 8px;
            `;

            clsDesigns.forEach(design => {
                const card = document.createElement('div');
                card.dataset.key = design.key;
                const isActive = design.key === this._currentKey;
                card.style.cssText = `
                    border: 2px solid ${isActive ? '#d4aa40' : 'rgba(255,255,255,0.12)'};
                    border-radius: 6px;
                    background: ${isActive ? 'rgba(212,170,64,0.1)' : 'rgba(255,255,255,0.04)'};
                    padding: 8px 6px 6px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    touch-action: manipulation;
                    transition: border-color 0.15s, background 0.15s;
                    position: relative;
                `;
                if (isActive) {
                    const badge = document.createElement('div');
                    badge.style.cssText = `
                        position:absolute;top:4px;right:4px;
                        background:#d4aa40;color:#000;
                        font-size:8px;font-weight:bold;
                        padding:1px 4px;border-radius:3px;letter-spacing:0.5px;
                    `;
                    badge.textContent = 'AKTIV';
                    card.appendChild(badge);
                }
                const img = document.createElement('img');
                img.src = design.src;
                img.alt = design.name;
                img.style.cssText = `
                    width: 64px;
                    height: 64px;
                    object-fit: contain;
                    image-rendering: auto;
                `;
                img.onerror = () => { img.style.display = 'none'; };

                const name = document.createElement('div');
                name.style.cssText = `
                    font-size: 10px;
                    color: #ddd;
                    text-align: center;
                    line-height: 1.2;
                    word-break: break-word;
                `;
                name.textContent = design.name;

                const costEl = document.createElement('div');
                costEl.style.cssText = `
                    font-size: 10px;
                    color: ${design.cost === 0 ? '#7fffb0' : '#ffd36a'};
                    font-weight: bold;
                `;
                costEl.textContent = design.cost === 0 ? 'Standard' : `${design.cost} 🪙`;

                card.appendChild(img);
                card.appendChild(name);
                card.appendChild(costEl);

                const activate = (e) => {
                    e.preventDefault();
                    this._equipShip(design);
                    this._updateCards(design.key);
                };
                card.addEventListener('click', activate);
                card.addEventListener('touchend', activate, { passive: false });
                card.addEventListener('touchstart', () => {
                    card.style.background = 'rgba(212,170,64,0.15)';
                }, { passive: true });

                grid.appendChild(card);
            });

            section.appendChild(grid);
            body.appendChild(section);
        });

        panel.appendChild(header);
        panel.appendChild(body);
        el.appendChild(panel);

        el.addEventListener('click', (e) => { if (e.target === el) this.hide(); });
        document.getElementById('sdp-close')?.addEventListener('click', () => this.hide());
        panel.querySelector('#sdp-close')?.addEventListener('click', () => this.hide());

        document.body.appendChild(el);
        this._el = el;

        setTimeout(() => {
            el.querySelector('#sdp-close')?.addEventListener('click', () => this.hide());
        }, 0);
    }

    _updateCards(activeKey) {
        if (!this._el) return;
        this._currentKey = activeKey;
        this._el.querySelectorAll('[data-key]').forEach(card => {
            const isActive = card.dataset.key === activeKey;
            card.style.border = `2px solid ${isActive ? '#d4aa40' : 'rgba(255,255,255,0.12)'}`;
            card.style.background = isActive ? 'rgba(212,170,64,0.1)' : 'rgba(255,255,255,0.04)';

            const existing = card.querySelector('.aktiv-badge');
            if (existing) existing.remove();
            if (isActive) {
                const badge = document.createElement('div');
                badge.className = 'aktiv-badge';
                badge.style.cssText = `
                    position:absolute;top:4px;right:4px;
                    background:#d4aa40;color:#000;
                    font-size:8px;font-weight:bold;
                    padding:1px 4px;border-radius:3px;letter-spacing:0.5px;
                `;
                badge.textContent = 'AKTIV';
                card.appendChild(badge);
            }
        });
    }

    _equipShip(design) {
        const s = this.scene;
        if (!s.player) return;

        if (!s.textures.exists(design.key)) {
            s.load.image(design.key, design.src);
            s.load.once('complete', () => {
                s.player.sprite.setTexture(design.key);
                s.player.sprite.setScale(0.11);
                s.playerShipDesign = design.key;
                s.showStatusMsg?.(`Schiff geändert: ${design.name}`, 0xd4aa40);
            });
            s.load.start();
        } else {
            s.player.sprite.setTexture(design.key);
            s.player.sprite.setScale(0.11);
            s.playerShipDesign = design.key;
            s.showStatusMsg?.(`Schiff geändert: ${design.name}`, 0xd4aa40);
        }
    }

    show() {
        if (this._el) {
            this._el.style.display = 'flex';
            this._visible = true;
            return;
        }
        this._build();
        this._visible = true;
        setTimeout(() => {
            this._el?.querySelector('#sdp-close')?.addEventListener('click', () => this.hide());
        }, 10);
    }

    hide() {
        if (this._el) this._el.style.display = 'none';
        this._visible = false;
    }

    toggle() {
        if (this._visible) this.hide(); else this.show();
    }

    isOpen() { return this._visible; }

    destroy() {
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
        this._el = null;
    }
}
