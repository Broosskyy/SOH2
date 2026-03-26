/* Mobile-first: horizontale Item-Leiste, rechts unten über ChartNav */

const ITEM_DEFS = {
    heiltrunk:  { name: 'Heiltrank',  icon: '🧪', desc: 'Heilt 30% HP sofort',        color: '#ff6b6b', key: '1' },
    grog:       { name: 'Grog',       icon: '🍺', desc: '+50% Speed 30 Sek.',          color: '#ffa040', key: '2' },
    blitzpulver:{ name: 'Blitz',      icon: '⚡', desc: 'Nächster Schuss: 3× Schaden', color: '#ffe84a', key: '3' },
    rum:        { name: 'Rum',        icon: '🛢', desc: '+100% XP 60 Sek.',           color: '#c88040', key: '4' },
    fernrohr:   { name: 'Fernrohr',   icon: '🔭', desc: 'Nächste Schatztruhe',         color: '#9370db', key: '5' },
};

const ITEM_ORDER = ['heiltrunk', 'grog', 'blitzpulver', 'rum', 'fernrohr'];

export default class ItemBar {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._slots = [];
        this._tooltip = null;
        this._build();
        this._buildTooltip();
        this._bindHotkeys();
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'item-bar';
        el.style.cssText = `
            position: fixed;
            bottom: calc(76px + env(safe-area-inset-bottom, 0px));
            right: 8px;
            z-index: 8600;
            display: flex;
            flex-direction: row;
            gap: 4px;
            padding: 5px 6px;
            background: linear-gradient(180deg, rgba(3,10,24,0.95) 0%, rgba(5,16,40,0.92) 100%);
            border: 1px solid rgba(212,175,55,0.28);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.7);
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
        `;

        ITEM_ORDER.forEach((type) => {
            const def = ITEM_DEFS[type];
            const slot = document.createElement('div');
            slot.dataset.type = type;
            slot.style.cssText = `
                width: 48px;
                height: 52px;
                border: 1px solid rgba(74,200,255,0.18);
                border-radius: 10px;
                background: rgba(4,14,30,0.75);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                position: relative;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                transition: all 0.15s ease;
                gap: 1px;
                overflow: hidden;
            `;

            const icon = document.createElement('div');
            icon.style.cssText = 'font-size:22px;line-height:1;transition:transform 0.12s;';
            icon.textContent = def.icon;

            const nameEl = document.createElement('div');
            nameEl.style.cssText = `
                font-size:7px;color:#6aafcf;text-align:center;
                line-height:1;white-space:nowrap;font-family:Arial;font-weight:bold;
            `;
            nameEl.textContent = def.name;

            const countEl = document.createElement('div');
            countEl.id = `item-count-${type}`;
            countEl.style.cssText = `
                position:absolute;top:1px;right:3px;
                font-size:9px;font-weight:bold;color:#ffd36a;font-family:Arial;
                text-shadow:0 1px 3px rgba(0,0,0,0.8);
            `;

            const keyBadge = document.createElement('div');
            keyBadge.style.cssText = `
                position:absolute;top:1px;left:3px;
                font-size:7px;color:rgba(255,255,255,0.25);font-family:Arial;font-weight:bold;
            `;
            keyBadge.textContent = def.key;

            const activeBar = document.createElement('div');
            activeBar.id = `item-active-${type}`;
            activeBar.style.cssText = `
                position:absolute;bottom:0;left:0;right:0;height:3px;
                background:linear-gradient(90deg,${def.color},rgba(255,255,255,0.9));
                border-radius:0 0 9px 9px;display:none;
                box-shadow:0 0 8px ${def.color};
            `;

            slot.appendChild(keyBadge);
            slot.appendChild(icon);
            slot.appendChild(nameEl);
            slot.appendChild(countEl);
            slot.appendChild(activeBar);

            /* Große Touch-Zone */
            const handleUse = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const count = parseInt(countEl.textContent) || 0;
                if (count <= 0) {
                    slot.style.animation = 'shake 0.22s ease';
                    setTimeout(() => { slot.style.animation = ''; }, 250);
                    return;
                }
                icon.style.transform = 'scale(1.35)';
                setTimeout(() => { icon.style.transform = ''; }, 160);
                this.scene.useItem?.(type);
            };

            slot.addEventListener('touchend', handleUse, { passive: false });
            slot.addEventListener('click', handleUse);
            slot.addEventListener('mouseenter', () => this._showTooltip(slot, def));
            slot.addEventListener('mouseleave', () => this._hideTooltip());

            el.appendChild(slot);
            this._slots.push({ type, el: slot, countEl, activeBar, icon });
        });

        document.body.appendChild(el);
        this._el = el;
    }

    _buildTooltip() {
        const tip = document.createElement('div');
        tip.id = 'item-tooltip';
        tip.style.cssText = `
            position:fixed;z-index:20000;display:none;
            padding:8px 12px;
            background:rgba(3,10,24,0.97);
            border:1px solid rgba(212,175,55,0.5);
            border-radius:8px;font-family:Arial;font-size:11px;
            color:#dff8ff;max-width:180px;
            box-shadow:0 4px 20px rgba(0,0,0,0.8);
            pointer-events:none;line-height:1.6;
        `;
        document.body.appendChild(tip);
        this._tooltip = tip;
    }

    _showTooltip(anchor, def) {
        const tip = this._tooltip;
        if (!tip) return;
        tip.innerHTML = `<b style="color:${def.color}">${def.icon} ${def.name}</b><br><span style="color:#9fdcff">${def.desc}</span>`;
        tip.style.display = 'block';
        const rect = anchor.getBoundingClientRect();
        tip.style.left = `${Math.max(4, rect.left - 184)}px`;
        tip.style.top  = `${rect.top - 2}px`;
    }

    _hideTooltip() {
        if (this._tooltip) this._tooltip.style.display = 'none';
    }

    _bindHotkeys() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            const idx = parseInt(e.key) - 1;
            if (idx >= 0 && idx < ITEM_ORDER.length && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                this.scene.useItem?.(ITEM_ORDER[idx]);
            }
        });
    }

    update(inventory, activeEffects = {}) {
        this._slots.forEach(({ type, el, countEl, activeBar }) => {
            const def   = ITEM_DEFS[type];
            const count = inventory?.[type] ?? 0;
            const isActive = !!activeEffects[type];
            const isEmpty  = count <= 0;

            countEl.textContent = count > 0 ? `×${count}` : '';
            el.style.opacity = isEmpty ? '0.3' : '1';

            if (isActive) {
                el.style.borderColor = def.color;
                el.style.background  = `linear-gradient(160deg,${def.color}25,rgba(4,14,30,0.88))`;
                el.style.boxShadow   = `0 0 12px ${def.color}55`;
                activeBar.style.display = 'block';
            } else {
                el.style.borderColor = isEmpty ? 'rgba(74,200,255,0.08)' : 'rgba(74,200,255,0.25)';
                el.style.background  = isEmpty ? 'rgba(4,14,30,0.4)' : 'rgba(4,14,30,0.78)';
                el.style.boxShadow   = '';
                activeBar.style.display = 'none';
            }
        });
    }

    showPickupFlash(type) {
        const slot = this._slots.find(s => s.type === type);
        if (!slot) return;
        const def = ITEM_DEFS[type];
        slot.el.style.boxShadow   = `0 0 24px ${def.color}cc`;
        slot.el.style.borderColor = def.color;
        slot.el.style.transform   = 'scale(1.12)';
        setTimeout(() => {
            slot.el.style.transform = '';
            slot.el.style.boxShadow = '';
        }, 500);
    }

    show()    { if (this._el) this._el.style.display = 'flex'; }
    hide()    { if (this._el) this._el.style.display = 'none'; }
    destroy() { this._el?.remove(); this._tooltip?.remove(); }
}
