const ITEM_DEFS = {
    heiltrunk:  { name: 'Heiltrunk',   icon: '🧪', desc: 'Heilt 30% HP sofort',             color: '#ff6b6b' },
    grog:       { name: 'Grog',        icon: '🍺', desc: '+50% Speed für 30 Sekunden',        color: '#ffa040' },
    blitzpulver:{ name: 'Blitzpulver', icon: '⚡', desc: 'Nächster Schuss: 3× Schaden',       color: '#ffe84a' },
    rum:        { name: 'Rum-Fass',    icon: '🛢', desc: '+100% XP für 60 Sekunden',          color: '#c88040' },
    fernrohr:   { name: 'Fernrohr',    icon: '🔭', desc: 'Zeigt nächste Schatztruhe',         color: '#9370db' },
};

const ITEM_ORDER = ['heiltrunk', 'grog', 'blitzpulver', 'rum', 'fernrohr'];

export default class ItemBar {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._slots = [];
        this._activeEffects = {};
        this._build();
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'item-bar';
        el.style.cssText = `
            position: fixed;
            bottom: 72px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 8500;
            display: flex;
            gap: 5px;
            padding: 5px 8px;
            background: linear-gradient(180deg,rgba(4,14,30,0.92) 0%,rgba(6,20,44,0.88) 100%);
            border: 1px solid rgba(212,175,55,0.35);
            border-radius: 12px;
            box-shadow: 0 2px 16px rgba(0,0,0,0.6);
            font-family: Arial, sans-serif;
            pointer-events: auto;
            user-select: none;
        `;

        ITEM_ORDER.forEach((type, i) => {
            const def = ITEM_DEFS[type];
            const slot = document.createElement('div');
            slot.dataset.type = type;
            slot.title = `${def.name}: ${def.desc}`;
            slot.style.cssText = `
                width: 52px; height: 56px;
                border: 2px solid rgba(74,200,255,0.25);
                border-radius: 9px;
                background: rgba(4,14,30,0.75);
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                cursor: pointer; position: relative;
                touch-action: manipulation;
                transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
                gap: 1px;
            `;

            const num = document.createElement('span');
            num.style.cssText = 'font-size:15px;line-height:1;';
            num.textContent = `${i + 1}`;
            num.style.display = 'none';

            const icon = document.createElement('span');
            icon.style.cssText = 'font-size:22px;line-height:1;';
            icon.textContent = def.icon;

            const nameEl = document.createElement('span');
            nameEl.style.cssText = 'font-size:8px;color:#9fdcff;text-align:center;line-height:1.1;white-space:nowrap;';
            nameEl.textContent = def.name;

            const countEl = document.createElement('span');
            countEl.id = `item-count-${type}`;
            countEl.style.cssText = `
                position:absolute;top:2px;right:5px;
                font-size:11px;font-weight:bold;color:#ffd36a;
            `;
            countEl.textContent = '';

            const activeEl = document.createElement('div');
            activeEl.id = `item-active-${type}`;
            activeEl.style.cssText = `
                position:absolute;bottom:0;left:0;right:0;height:3px;
                background:linear-gradient(90deg,${def.color},#fff);
                border-radius:0 0 7px 7px;display:none;
            `;

            slot.appendChild(icon);
            slot.appendChild(nameEl);
            slot.appendChild(countEl);
            slot.appendChild(activeEl);
            slot.appendChild(num);

            slot.addEventListener('click', (e) => { e.stopPropagation(); this.scene.useItem?.(type); });
            slot.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); this.scene.useItem?.(type); }, { passive: false });
            slot.addEventListener('mouseenter', () => { if ((this.scene.player?.inventory?.[type] ?? 0) > 0) slot.style.boxShadow = `0 0 10px ${def.color}66`; });
            slot.addEventListener('mouseleave', () => { slot.style.boxShadow = ''; });

            el.appendChild(slot);
            this._slots.push({ type, el: slot, countEl, activeEl });
        });

        document.body.appendChild(el);
        this._el = el;
    }

    update(inventory, activeEffects = {}) {
        this._slots.forEach(({ type, el, countEl, activeEl }) => {
            const def = ITEM_DEFS[type];
            const count = inventory?.[type] ?? 0;
            const isActive = !!activeEffects[type];
            countEl.textContent = count > 0 ? `×${count}` : '';
            el.style.opacity = count > 0 ? '1' : '0.35';
            el.style.borderColor = isActive
                ? def.color
                : count > 0
                    ? 'rgba(212,175,55,0.5)'
                    : 'rgba(74,200,255,0.15)';
            el.style.background = isActive
                ? `${def.color}22`
                : count > 0 ? 'rgba(4,14,30,0.85)' : 'rgba(4,14,30,0.45)';
            activeEl.style.display = isActive ? 'block' : 'none';
        });
    }

    showPickupFlash(type) {
        const slot = this._slots.find(s => s.type === type);
        if (!slot) return;
        const el = slot.el;
        const orig = el.style.boxShadow;
        el.style.boxShadow = `0 0 18px ${ITEM_DEFS[type]?.color ?? '#fff'}`;
        el.style.borderColor = ITEM_DEFS[type]?.color ?? '#fff';
        setTimeout(() => { el.style.boxShadow = orig; }, 600);
    }

    show() { if (this._el) this._el.style.display = 'flex'; }
    hide() { if (this._el) this._el.style.display = 'none'; }
    destroy() { this._el?.remove(); }
}
