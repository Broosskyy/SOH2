const ITEM_DEFS = {
    heiltrunk:  { name: 'Heiltrank',  icon: '🧪', desc: 'Heilt 30% HP sofort',           color: '#ff6b6b', key: '1' },
    grog:       { name: 'Grog',       icon: '🍺', desc: '+50% Speed 30 Sek.',             color: '#ffa040', key: '2' },
    blitzpulver:{ name: 'Blitzpulv.', icon: '⚡', desc: 'Nächster Schuss: 3× Schaden',    color: '#ffe84a', key: '3' },
    rum:        { name: 'Rum-Fass',   icon: '🛢', desc: '+100% XP 60 Sek.',              color: '#c88040', key: '4' },
    fernrohr:   { name: 'Fernrohr',   icon: '🔭', desc: 'Zeigt nächste Schatztruhe',      color: '#9370db', key: '5' },
};

const ITEM_ORDER = ['heiltrunk', 'grog', 'blitzpulver', 'rum', 'fernrohr'];

export default class ItemBar {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._slots = [];
        this._activeEffects = {};
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
            left: 8px;
            bottom: 180px;
            z-index: 8500;
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 6px 5px;
            background: linear-gradient(180deg,rgba(3,10,24,0.95) 0%,rgba(5,16,40,0.92) 100%);
            border: 1px solid rgba(212,175,55,0.35);
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.7), inset 0 0 12px rgba(0,0,0,0.4);
            pointer-events: auto;
            user-select: none;
        `;

        const title = document.createElement('div');
        title.style.cssText = 'font-size:8px;color:rgba(212,175,55,0.7);text-align:center;letter-spacing:1px;font-family:Arial;font-weight:bold;padding-bottom:2px;border-bottom:1px solid rgba(212,175,55,0.2);margin-bottom:2px;';
        title.textContent = 'ITEMS';
        el.appendChild(title);

        ITEM_ORDER.forEach((type, i) => {
            const def = ITEM_DEFS[type];
            const slot = document.createElement('div');
            slot.dataset.type = type;
            slot.style.cssText = `
                width: 48px; height: 50px;
                border: 1px solid rgba(74,200,255,0.2);
                border-radius: 8px;
                background: rgba(4,14,30,0.7);
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                cursor: pointer; position: relative;
                touch-action: manipulation;
                transition: all 0.15s ease;
                gap: 1px;
                overflow: hidden;
            `;

            const keyBadge = document.createElement('div');
            keyBadge.style.cssText = `
                position:absolute;top:2px;left:3px;
                font-size:8px;font-weight:bold;color:rgba(255,255,255,0.5);
                font-family:Arial;line-height:1;
            `;
            keyBadge.textContent = def.key;

            const icon = document.createElement('div');
            icon.style.cssText = 'font-size:20px;line-height:1;transition:transform 0.1s;';
            icon.textContent = def.icon;

            const nameEl = document.createElement('div');
            nameEl.style.cssText = 'font-size:7px;color:#7fbfdf;text-align:center;line-height:1.1;white-space:nowrap;font-family:Arial;font-weight:bold;';
            nameEl.textContent = def.name;

            const countEl = document.createElement('div');
            countEl.id = `item-count-${type}`;
            countEl.style.cssText = `
                position:absolute;top:2px;right:3px;
                font-size:9px;font-weight:bold;color:#ffd36a;
                font-family:Arial;line-height:1;
            `;

            const activeBar = document.createElement('div');
            activeBar.id = `item-active-${type}`;
            activeBar.style.cssText = `
                position:absolute;bottom:0;left:0;right:0;height:3px;
                background:linear-gradient(90deg,${def.color},rgba(255,255,255,0.8));
                border-radius:0 0 7px 7px;display:none;
                box-shadow:0 0 6px ${def.color};
            `;

            const overlay = document.createElement('div');
            overlay.id = `item-overlay-${type}`;
            overlay.style.cssText = `
                position:absolute;inset:0;border-radius:7px;
                background:rgba(0,0,0,0.0);
                display:flex;align-items:center;justify-content:center;
                font-size:16px;font-weight:bold;color:#fff;display:none;
                font-family:Arial;text-shadow:0 0 6px rgba(0,0,0,0.8);
            `;

            slot.appendChild(keyBadge);
            slot.appendChild(icon);
            slot.appendChild(nameEl);
            slot.appendChild(countEl);
            slot.appendChild(activeBar);
            slot.appendChild(overlay);

            slot.addEventListener('click', (e) => { e.stopPropagation(); this._use(type); });
            slot.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); this._use(type); }, { passive: false });

            slot.addEventListener('mouseenter', () => {
                const count = parseInt(countEl.textContent) || 0;
                if (count > 0) {
                    slot.style.boxShadow = `0 0 14px ${def.color}88, inset 0 0 8px ${def.color}22`;
                    slot.style.borderColor = `${def.color}88`;
                }
                this._showTooltip(slot, def);
            });
            slot.addEventListener('mouseleave', () => {
                slot.style.boxShadow = '';
                slot.style.borderColor = '';
                this._hideTooltip();
            });

            el.appendChild(slot);
            this._slots.push({ type, el: slot, countEl, activeBar, overlay, icon });
        });

        document.body.appendChild(el);
        this._el = el;
    }

    _buildTooltip() {
        const tip = document.createElement('div');
        tip.id = 'item-tooltip';
        tip.style.cssText = `
            position:fixed;
            z-index:20000;
            display:none;
            padding:8px 12px;
            background:rgba(3,10,24,0.97);
            border:1px solid rgba(212,175,55,0.6);
            border-radius:8px;
            font-family:Arial;
            font-size:11px;
            color:#dff8ff;
            max-width:180px;
            box-shadow:0 4px 20px rgba(0,0,0,0.8);
            pointer-events:none;
            line-height:1.5;
        `;
        document.body.appendChild(tip);
        this._tooltip = tip;
    }

    _showTooltip(anchor, def) {
        const tip = this._tooltip;
        if (!tip) return;
        tip.innerHTML = `<b style="color:${def.color}">${def.icon} ${def.name}</b><br><span style="color:#9fdcff">${def.desc}</span><br><span style="color:rgba(255,255,255,0.4);font-size:9px">Taste: [${def.key}]</span>`;
        tip.style.display = 'block';
        const rect = anchor.getBoundingClientRect();
        tip.style.left = `${rect.right + 8}px`;
        tip.style.top  = `${rect.top - 4}px`;
    }

    _hideTooltip() {
        if (this._tooltip) this._tooltip.style.display = 'none';
    }

    _bindHotkeys() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            const idx = parseInt(e.key) - 1;
            if (idx >= 0 && idx < ITEM_ORDER.length && !e.ctrlKey && !e.altKey) {
                this._use(ITEM_ORDER[idx]);
            }
        });
    }

    _use(type) {
        const slot = this._slots.find(s => s.type === type);
        if (!slot) return;
        const count = parseInt(slot.countEl.textContent) || 0;
        if (count <= 0) {
            slot.el.style.animation = 'shake 0.2s ease';
            setTimeout(() => { slot.el.style.animation = ''; }, 250);
            return;
        }
        slot.icon.style.transform = 'scale(1.3)';
        setTimeout(() => { slot.icon.style.transform = ''; }, 150);
        this.scene.useItem?.(type);
    }

    update(inventory, activeEffects = {}) {
        this._activeEffects = activeEffects;
        this._slots.forEach(({ type, el, countEl, activeBar, overlay }) => {
            const def = ITEM_DEFS[type];
            const count = inventory?.[type] ?? 0;
            const isActive = !!activeEffects[type];
            const isEmpty = count <= 0;

            countEl.textContent = count > 0 ? `×${count}` : '';
            el.style.opacity = isEmpty ? '0.35' : '1';

            if (isActive) {
                el.style.borderColor = def.color;
                el.style.background = `linear-gradient(160deg, ${def.color}22, rgba(4,14,30,0.85))`;
                el.style.boxShadow = `0 0 10px ${def.color}66`;
                activeBar.style.display = 'block';
            } else {
                el.style.borderColor = isEmpty ? 'rgba(74,200,255,0.1)' : 'rgba(74,200,255,0.3)';
                el.style.background = isEmpty ? 'rgba(4,14,30,0.4)' : 'rgba(4,14,30,0.75)';
                el.style.boxShadow = '';
                activeBar.style.display = 'none';
            }
        });
    }

    showPickupFlash(type) {
        const slot = this._slots.find(s => s.type === type);
        if (!slot) return;
        const def = ITEM_DEFS[type];
        const el = slot.el;
        el.style.boxShadow = `0 0 22px ${def.color}cc`;
        el.style.borderColor = def.color;
        el.style.transform = 'scale(1.12)';
        setTimeout(() => {
            el.style.transform = '';
            el.style.boxShadow = '';
        }, 500);
    }

    show() { if (this._el) this._el.style.display = 'flex'; }
    hide() { if (this._el) this._el.style.display = 'none'; }
    destroy() { this._el?.remove(); this._tooltip?.remove(); }
}
