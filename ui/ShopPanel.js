export default class ShopPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this._el = null;
        this._build();
        this._bindEvents();
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'shop-panel-overlay';
        el.style.cssText = `
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(2, 10, 20, 0.82);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            touch-action: none;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            position: relative;
            background: linear-gradient(160deg, #07192e 0%, #0b2040 100%);
            border: 2px solid #4ac8ff;
            border-radius: 18px;
            box-shadow: 0 0 40px rgba(74,200,255,0.25), 0 8px 40px rgba(0,0,0,0.8);
            width: min(420px, 95vw);
            max-height: 90vh;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0 0 16px 0;
            scrollbar-width: thin;
            scrollbar-color: #2a6080 #07192e;
        `;

        panel.innerHTML = `
            <div id="shop-header" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px 12px;
                border-bottom: 1px solid rgba(74,200,255,0.25);
                position: sticky; top: 0; z-index: 2;
                background: linear-gradient(160deg, #07192e 0%, #0b2040 100%);
            ">
                <div>
                    <div style="font-size:18px;font-weight:bold;color:#dff8ff;letter-spacing:1px;">⚙ Dockyards</div>
                    <div id="shop-resources" style="font-size:12px;color:#ffd36a;margin-top:3px;"></div>
                </div>
                <button id="shop-close-btn" style="
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 50%;
                    color: #fff;
                    font-size: 20px;
                    width: 36px; height: 36px;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.15s;
                    flex-shrink: 0;
                ">×</button>
            </div>
            <div id="shop-stat-bar" style="
                display: flex; gap: 8px; flex-wrap: wrap;
                padding: 10px 16px 4px;
            "></div>
            <div id="shop-cards" style="padding: 8px 14px 0;"></div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
        this._panel = panel;
    }

    _bindEvents() {
        const closeBtn = document.getElementById('shop-close-btn');
        closeBtn.addEventListener('click', () => this.hide());
        closeBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.hide(); });

        this._el.addEventListener('click', (e) => {
            if (e.target === this._el) this.hide();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.visible) this.hide();
        });
    }

    _cardDefs() {
        return [
            { type: 'hull',       label: 'Hull Reinforcement', icon: '🛡',  accent: '#63d6ff', levelKey: 'hullLevel' },
            { type: 'sails',      label: 'Sail Engine',        icon: '⛵',  accent: '#8bffba', levelKey: 'sailLevel' },
            { type: 'cannons',    label: 'Cannon Battery',     icon: '💥',  accent: '#ffb347', levelKey: 'cannonLevel' },
            { type: 'cannonSlots',label: 'Cannon Slots',       icon: '🔫',  accent: '#ffd36a', levelKey: 'cannonSlotLevel' },
            { type: 'decks',      label: 'Deck Capacity',      icon: '🚢',  accent: '#6ae0d8', levelKey: 'deckLevel' },
            { type: 'ammo',       label: 'Ammunition Lab',     icon: '⚡',  accent: '#c79fff', levelKey: 'ammoTechLevel' },
        ];
    }

    _statDesc(type, p) {
        switch (type) {
            case 'hull':
                return `Lv.${p.hullLevel} • +${p.hullHpPerLevel} HP/upgrade • HP ${Math.ceil(p.hp)}/${p.maxHP}`;
            case 'sails':
                return `Lv.${p.sailLevel} • +${p.sailSpeedPerLevel} speed • current ${p.speed}`;
            case 'cannons':
                return `Lv.${p.cannonLevel} • +${p.cannonDamagePerLevel} dmg/cannon • reload ${p.reloadTime}ms`;
            case 'cannonSlots':
                return `Lv.${p.cannonSlotLevel} • +2 cannons/upgrade • current ${p.cannonCount}`;
            case 'decks':
                return `Lv.${p.deckLevel} • +1 deck • bonus x${p.deckDamageMultiplier.toFixed(2)}`;
            case 'ammo':
                return `Lv.${p.ammoTechLevel} • +${p.ammoDamagePerLevel} power • range ${p.cannonRange}`;
            default:
                return '';
        }
    }

    _renderCards() {
        const p = this.scene.player;
        if (!p) return;

        const container = document.getElementById('shop-cards');
        if (!container) return;
        container.innerHTML = '';

        this._cardDefs().forEach(({ type, label, icon, accent }) => {
            const cost = p.getUpgradeCost(type);
            const canAfford = p.gold >= cost.gold && p.materials >= cost.materials;
            const desc = this._statDesc(type, p);

            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255,255,255,0.04);
                border: 1px solid ${accent}44;
                border-left: 3px solid ${accent};
                border-radius: 10px;
                padding: 11px 14px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                transition: background 0.15s, border-color 0.15s;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
            `;

            card.innerHTML = `
                <div style="font-size:24px;flex-shrink:0;line-height:1;">${icon}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;font-weight:bold;color:${accent};margin-bottom:2px;">${label}</div>
                    <div style="font-size:11px;color:#9fdcff;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${desc}</div>
                    <div style="font-size:11px;color:${canAfford ? '#ffd36a' : '#ff7070'};">
                        💰 ${cost.gold} gold &nbsp;•&nbsp; 🔩 ${cost.materials} mats
                    </div>
                </div>
                <button data-upgrade-type="${type}" style="
                    background: ${canAfford ? accent : 'rgba(255,255,255,0.08)'};
                    color: ${canAfford ? '#07192e' : '#888'};
                    border: none; border-radius: 8px;
                    font-size: 12px; font-weight: bold;
                    padding: 8px 14px; cursor: ${canAfford ? 'pointer' : 'default'};
                    flex-shrink: 0; white-space: nowrap;
                    transition: opacity 0.15s;
                ">BUY</button>
            `;

            const btn = card.querySelector('button');
            const doUpgrade = (e) => {
                e.stopPropagation();
                if (!canAfford) return;
                this.scene.buyUpgrade(type);
                this._renderAll();
            };
            btn.addEventListener('click', doUpgrade);
            btn.addEventListener('touchend', (e) => { e.preventDefault(); doUpgrade(e); });
            card.addEventListener('click', doUpgrade);

            card.addEventListener('mouseenter', () => {
                if (canAfford) card.style.background = 'rgba(255,255,255,0.08)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.background = 'rgba(255,255,255,0.04)';
            });

            container.appendChild(card);
        });
    }

    _renderResources() {
        const p = this.scene.player;
        if (!p) return;
        const el = document.getElementById('shop-resources');
        if (el) el.textContent = `💰 ${p.gold} gold  •  🔩 ${p.materials} mats`;
    }

    _renderStatBar() {
        const p = this.scene.player;
        if (!p) return;
        const el = document.getElementById('shop-stat-bar');
        if (!el) return;

        const stats = [
            { label: 'HP',     value: `${Math.ceil(p.hp)}/${p.maxHP}`,        color: '#7fff9a' },
            { label: 'SPD',    value: `${p.speed}`,                            color: '#8bffba' },
            { label: 'CAN',    value: `${p.cannonCount}`,                      color: '#ffb347' },
            { label: 'DMG',    value: `${p.getTotalDamagePerShot(p.ammoMultiplier ?? 1)}`, color: '#ff8c69' },
            { label: 'DECK',   value: `${p.deckCount}`,                        color: '#6ae0d8' },
            { label: 'RANGE',  value: `${p.cannonRange}`,                      color: '#c79fff' },
        ];

        el.innerHTML = stats.map(s => `
            <div style="
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 6px;
                padding: 4px 8px;
                text-align:center;
                min-width:48px;
            ">
                <div style="font-size:10px;color:#7ab8d4;">${s.label}</div>
                <div style="font-size:13px;font-weight:bold;color:${s.color};">${s.value}</div>
            </div>
        `).join('');
    }

    _renderAll() {
        this._renderResources();
        this._renderStatBar();
        this._renderCards();
    }

    show() {
        this._renderAll();
        this._el.style.display = 'flex';
        this.visible = true;
    }

    hide() {
        this._el.style.display = 'none';
        this.visible = false;
    }

    toggle() {
        if (this.visible) this.hide();
        else this.show();
    }

    destroy() {
        if (this._el && this._el.parentNode) {
            this._el.parentNode.removeChild(this._el);
        }
    }
}
