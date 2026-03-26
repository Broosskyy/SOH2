export default class AmmoBar {
    constructor(scene) {
        this.scene = scene;
        this._activeAmmo = 'cannonball';
        this._el = null;
        this._ammoEls = {};
        this._skillEls = {};
        this._build();
    }

    _ammoDefs() {
        return [
            { type: 'cannonball', short: 'IB', label: 'Iron Ball',   color: '#9fdcff', glow: 'rgba(159,220,255,0.5)', bg: 'rgba(20,50,80,0.92)' },
            { type: 'flare',      short: 'LG', label: 'Leuchtkugel', color: '#ffd36a', glow: 'rgba(255,211,106,0.5)', bg: 'rgba(60,40,5,0.92)'  },
            { type: 'fire',       short: 'FG', label: 'Feuerkugel',  color: '#ff6060', glow: 'rgba(255,96,96,0.5)',   bg: 'rgba(60,10,10,0.92)' },
            { type: 'storm',      short: 'SK', label: 'Sturmkugel',  color: '#63d6ff', glow: 'rgba(99,214,255,0.5)',  bg: 'rgba(10,40,70,0.92)' },
            { type: 'chainshot',  short: 'CS', label: 'Chain Shot',  color: '#7fffb0', glow: 'rgba(127,255,176,0.5)', bg: 'rgba(10,50,25,0.92)' },
            { type: 'grapeshot',  short: 'GS', label: 'Grape Shot',  color: '#ffb347', glow: 'rgba(255,179,71,0.5)',  bg: 'rgba(60,30,5,0.92)'  },
        ];
    }

    _skillDefs() {
        return this.scene.combatSkillDefs ?? [
            { key: 'burst',  shortLabel: 'BST', color: '#ffb347', bg: 'rgba(60,30,0,0.92)',  glow: 'rgba(255,179,71,0.5)' },
            { key: 'break',  shortLabel: 'BRK', color: '#63d6ff', bg: 'rgba(10,40,70,0.92)', glow: 'rgba(99,214,255,0.5)' },
            { key: 'repair', shortLabel: 'RPR', color: '#7fffb0', bg: 'rgba(10,50,25,0.92)', glow: 'rgba(127,255,176,0.5)' },
        ];
    }

    _build() {
        const bar = document.createElement('div');
        bar.id = 'ammo-bar';
        bar.style.cssText = `
            position: fixed;
            right: env(safe-area-inset-right, 8px);
            bottom: 72px;
            z-index: 8000;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
            padding-right: 8px;
            padding-bottom: env(safe-area-inset-bottom, 0px);
        `;

        const skillRow = document.createElement('div');
        skillRow.style.cssText = `display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;`;
        this._skillDefs().forEach(skill => {
            const btn = this._makeCircle({
                shortLabel: skill.shortLabel,
                color: skill.color,
                bg: skill.bg,
                glow: skill.glow,
                size: 62,
                countText: '⚡',
                isSkill: true,
                isActive: true,
            });
            btn.dataset.skill = skill.key;
            const doSkill = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.scene.activateSkill?.(skill.key);
            };
            btn.addEventListener('click', doSkill);
            btn.addEventListener('touchend', doSkill, { passive: false });
            this._skillEls[skill.key] = btn;
            skillRow.appendChild(btn);
        });
        bar.appendChild(skillRow);

        const ammoGrid = document.createElement('div');
        ammoGrid.style.cssText = `display:grid;grid-template-columns:1fr 1fr;gap:6px;`;
        this._ammoDefs().forEach(ammo => {
            const btn = this._makeCircle({
                shortLabel: ammo.short,
                color: ammo.color,
                bg: ammo.bg,
                glow: ammo.glow,
                size: 62,
                countText: '∞',
                isActive: ammo.type === this._activeAmmo,
            });
            btn.dataset.ammo = ammo.type;
            const doAmmo = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._setActive(ammo.type);
                this.scene.setAmmoType?.(ammo.type);
            };
            btn.addEventListener('click', doAmmo);
            btn.addEventListener('touchend', doAmmo, { passive: false });
            this._ammoEls[ammo.type] = btn;
            ammoGrid.appendChild(btn);
        });
        bar.appendChild(ammoGrid);

        document.body.appendChild(bar);
        this._el = bar;
    }

    _makeCircle({ shortLabel, color, bg, glow, size, countText, isActive = false, isSkill = false }) {
        const wrap = document.createElement('div');
        wrap.style.cssText = `
            position: relative;
            width: ${size}px;
            height: ${size}px;
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            flex-shrink: 0;
        `;

        const circle = document.createElement('div');
        circle.className = 'ammo-circle';
        circle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: radial-gradient(circle at 38% 32%, rgba(255,255,255,0.10) 0%, ${bg} 60%);
            border: 2.5px solid ${isActive ? color : color + '66'};
            box-shadow: ${isActive ? `0 0 16px ${glow}, inset 0 0 12px ${glow}` : `0 2px 8px rgba(0,0,0,0.7), inset 0 0 4px rgba(255,255,255,0.04)`};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            transition: border-color 0.15s, box-shadow 0.15s;
            box-sizing: border-box;
            pointer-events: none;
        `;

        const lbl = document.createElement('div');
        lbl.className = 'ammo-label';
        lbl.style.cssText = `
            font-size: ${isSkill ? 14 : 15}px;
            font-weight: bold;
            color: ${color};
            font-family: Arial, sans-serif;
            text-shadow: 0 0 6px ${color};
            line-height: 1;
            pointer-events: none;
        `;
        lbl.textContent = shortLabel;

        const cnt = document.createElement('div');
        cnt.className = 'ammo-count';
        cnt.style.cssText = `
            font-size: 11px;
            color: rgba(255,255,255,0.7);
            font-family: Arial, sans-serif;
            line-height: 1;
            pointer-events: none;
        `;
        cnt.textContent = countText;

        if (isActive) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                position: absolute;
                top: -3px; right: -3px;
                width: 10px; height: 10px;
                border-radius: 50%;
                background: ${color};
                box-shadow: 0 0 6px ${glow};
            `;
            wrap.appendChild(dot);
        }

        circle.appendChild(lbl);
        if (countText) circle.appendChild(cnt);
        wrap.appendChild(circle);
        return wrap;
    }

    _setActive(type) {
        this._activeAmmo = type;
        this._ammoDefs().forEach(ammo => {
            const btn = this._ammoEls[ammo.type];
            if (!btn) return;
            const circle = btn.querySelector('.ammo-circle');
            const isActive = ammo.type === type;
            if (circle) {
                circle.style.borderColor = isActive ? ammo.color : ammo.color + '66';
                circle.style.boxShadow = isActive
                    ? `0 0 16px ${ammo.glow}, inset 0 0 12px ${ammo.glow}`
                    : `0 2px 8px rgba(0,0,0,0.7), inset 0 0 4px rgba(255,255,255,0.04)`;
            }
            const existingDot = btn.querySelector('div:not(.ammo-circle)');
            if (existingDot) existingDot.remove();
            if (isActive) {
                const dot = document.createElement('div');
                dot.style.cssText = `
                    position:absolute;top:-3px;right:-3px;
                    width:10px;height:10px;border-radius:50%;
                    background:${ammo.color};box-shadow:0 0 6px ${ammo.glow};
                `;
                btn.appendChild(dot);
            }
        });
    }

    updateAmmoCount(type, count) {
        const btn = this._ammoEls[type];
        if (!btn) return;
        const cnt = btn.querySelector('.ammo-count');
        if (cnt) cnt.textContent = count === Infinity || count == null ? '∞' : String(count);
    }

    updateSkillCooldown(key, remainingMs) {
        const btn = this._skillEls[key];
        if (!btn) return;
        const lbl = btn.querySelector('.ammo-label');
        const circle = btn.querySelector('.ammo-circle');
        const skill = this._skillDefs().find(s => s.key === key);
        if (!skill) return;
        const onCooldown = remainingMs > 0;
        if (lbl) lbl.textContent = onCooldown ? `${Math.ceil(remainingMs / 1000)}` : skill.shortLabel;
        if (circle) {
            circle.style.borderColor = onCooldown ? '#333' : (skill.color + '55');
            circle.style.opacity = onCooldown ? '0.45' : '1';
        }
    }

    setVisible(v) { if (this._el) this._el.style.display = v ? 'flex' : 'none'; }

    destroy() {
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
    }
}
