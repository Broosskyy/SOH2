export default class CombatPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this._el = null;
        this._activeAmmo = 'cannonball';
        this._build();
        this._bindEvents();
    }

    _ammoTypes() {
        return [
            { type: 'cannonball', label: 'Iron Ball',   short: 'IB', icon: '⚫', color: '#9fdcff', desc: 'Standard Kanonenkugel • Hoher Schaden',         dmgMod: '100%', special: 'Kein' },
            { type: 'flare',      label: 'Leuchtkugel', short: 'LG', icon: '🟡', color: '#ffd36a', desc: 'Brennende Kugel • Sicht + DoT Schaden',         dmgMod: '80%',  special: 'Brennt' },
            { type: 'fire',       label: 'Feuerkugel',  short: 'FG', icon: '🔴', color: '#ff7070', desc: 'Feuerkugel • Flächenschaden auf Einschlag',      dmgMod: '90%',  special: 'Flächenschaden' },
            { type: 'storm',      label: 'Sturmkugel',  short: 'SK', icon: '🔵', color: '#63d6ff', desc: 'Elektrisch geladen • Kettenblitz-Effekt',        dmgMod: '75%',  special: 'Kettenblitz' },
            { type: 'chainshot',  label: 'Chain Shot',  short: 'CS', icon: '🔗', color: '#8bffba', desc: 'Kettengeschoss • Verlangsamt Segel des Gegners',  dmgMod: '60%',  special: 'Verlangsamt' },
            { type: 'grapeshot',  label: 'Grape Shot',  short: 'GS', icon: '🟤', color: '#ffb347', desc: 'Schrotladung • Trifft mehrere Feinde gleichzeitig', dmgMod: '50%', special: 'Mehrfach-Treffer' },
        ];
    }

    _skills() {
        return this.scene.combatSkillDefs ?? [
            { key: 'burst',  name: 'Burst',  shortLabel: 'BST', cooldown: 8000,  description: 'Schwere Breitseite', accent: 0xffb347, targetRequired: true },
            { key: 'break',  name: 'Break',  shortLabel: 'BRK', cooldown: 12000, description: 'Verwundbarkeit',    accent: 0x65dfff, targetRequired: true },
            { key: 'repair', name: 'Repair', shortLabel: 'RPR', cooldown: 18000, description: 'Rumpf reparieren',  accent: 0x7fffb0, targetRequired: false },
        ];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'combat-panel-overlay';
        el.style.cssText = `
            display: none; position: fixed; inset: 0; z-index: 9999;
            background: rgba(2,10,20,0.86); backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            align-items: flex-start; justify-content: center;
            padding-top: 70px; box-sizing: border-box;
            font-family: Arial, sans-serif; touch-action: none; overflow-y: auto;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            position: relative;
            background: linear-gradient(160deg, #1a0a0a 0%, #2a1010 100%);
            border: 2px solid #ff7070; border-radius: 18px;
            box-shadow: 0 0 40px rgba(255,112,112,0.2), 0 8px 40px rgba(0,0,0,0.8);
            width: min(460px, 96vw);
            max-height: calc(100dvh - 80px);
            overflow-y: auto; overflow-x: hidden;
            padding: 0 0 20px 0;
            scrollbar-width: thin; scrollbar-color: #802020 #1a0a0a;
            margin-bottom: 10px;
        `;

        panel.innerHTML = `
            <div style="
                display:flex;align-items:center;justify-content:space-between;
                padding:16px 20px 12px;
                border-bottom:1px solid rgba(255,112,112,0.25);
                position:sticky;top:0;z-index:2;
                background:linear-gradient(160deg,#1a0a0a 0%,#2a1010 100%);
            ">
                <div>
                    <div style="font-size:19px;font-weight:bold;color:#ffd8d8;letter-spacing:1px;">⚔ Kampf-Ausrüstung</div>
                    <div id="combat-subtitle" style="font-size:12px;color:#ff9090;margin-top:3px;"></div>
                </div>
                <button id="combat-close-btn" style="
                    background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);
                    border-radius:50%;color:#fff;font-size:22px;
                    width:40px;height:40px;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;
                    touch-action:manipulation;-webkit-tap-highlight-color:transparent;
                ">×</button>
            </div>

            <div style="padding:14px 16px 6px;">
                <div style="font-size:10px;color:#802020;letter-spacing:1px;text-transform:uppercase;font-weight:bold;margin-bottom:10px;">💥 MUNITIONS-AUSWAHL</div>
                <div id="combat-ammo-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px;"></div>
                <div id="combat-ammo-detail" style="
                    margin-top:10px;padding:10px 14px;
                    background:rgba(255,255,255,0.04);border-radius:10px;
                    border:1px solid rgba(255,112,112,0.15);
                    font-size:11px;color:#9fdcff;
                ">Wähle eine Munitionsart oben aus.</div>
            </div>

            <div style="padding:10px 16px 6px;border-top:1px solid rgba(255,112,112,0.1);margin-top:6px;">
                <div style="font-size:10px;color:#802020;letter-spacing:1px;text-transform:uppercase;font-weight:bold;margin-bottom:10px;">⚡ KAMPF-FÄHIGKEITEN</div>
                <div id="combat-skills" style="display:flex;flex-direction:column;gap:8px;"></div>
            </div>

            <div style="padding:10px 16px 6px;border-top:1px solid rgba(255,112,112,0.1);margin-top:6px;">
                <div style="font-size:10px;color:#802020;letter-spacing:1px;text-transform:uppercase;font-weight:bold;margin-bottom:10px;">🎯 SCHNELL-AKTIONEN</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;" id="combat-quick-actions"></div>
            </div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
    }

    _bindEvents() {
        const closeBtn = document.getElementById('combat-close-btn');
        const doClose = (e) => { e.preventDefault(); this.hide(); };
        closeBtn.addEventListener('click', doClose);
        closeBtn.addEventListener('touchend', doClose, { passive: false });

        this._el.addEventListener('click', (e) => { if (e.target === this._el) this.hide(); });
        this._el.addEventListener('touchend', (e) => { if (e.target === this._el) this.hide(); }, { passive: false });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });
    }

    setActiveAmmo(type) {
        this._activeAmmo = type;
        if (this.visible) this._renderAll();
    }

    _renderAll() {
        const s = this.scene;
        const p = s.player;

        const subtitle = document.getElementById('combat-subtitle');
        if (subtitle) {
            const active = this._ammoTypes().find(a => a.type === this._activeAmmo);
            subtitle.textContent = `Aktive Munition: ${active?.icon ?? ''} ${active?.label ?? '–'}`;
        }

        const grid = document.getElementById('combat-ammo-grid');
        if (grid) {
            grid.innerHTML = '';
            this._ammoTypes().forEach(ammo => {
                const isActive = ammo.type === this._activeAmmo;
                const card = document.createElement('div');
                card.style.cssText = `
                    background: ${isActive ? `${ammo.color}22` : 'rgba(255,255,255,0.04)'};
                    border: 2px solid ${isActive ? ammo.color : 'rgba(255,255,255,0.08)'};
                    border-radius: 12px; padding: 12px;
                    cursor: pointer; touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                    transition: border-color 0.15s, background 0.15s;
                    text-align: center;
                `;
                card.innerHTML = `
                    <div style="font-size:22px;margin-bottom:4px;">${ammo.icon}</div>
                    <div style="font-size:12px;font-weight:bold;color:${isActive ? ammo.color : '#ddd'};">${ammo.label}</div>
                    <div style="font-size:10px;color:#555;margin-top:2px;">${ammo.short} • ${ammo.dmgMod} DMG</div>
                    ${isActive ? `<div style="font-size:9px;color:${ammo.color};margin-top:3px;font-weight:bold;">✓ AKTIV</div>` : ''}
                `;
                const doSelect = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._activeAmmo = ammo.type;
                    s.setAmmoType?.(ammo.type);

                    const detail = document.getElementById('combat-ammo-detail');
                    if (detail) detail.innerHTML = `<strong style="color:${ammo.color};">${ammo.icon} ${ammo.label}</strong> — ${ammo.desc}<br><span style="color:#ffd36a;">Spezial: ${ammo.special}</span>`;
                    this._renderAll();
                };
                card.addEventListener('click', doSelect);
                card.addEventListener('touchend', doSelect, { passive: false });
                grid.appendChild(card);
            });
        }

        const detail = document.getElementById('combat-ammo-detail');
        if (detail && this._activeAmmo) {
            const active = this._ammoTypes().find(a => a.type === this._activeAmmo);
            if (active) detail.innerHTML = `<strong style="color:${active.color};">${active.icon} ${active.label}</strong> — ${active.desc}<br><span style="color:#ffd36a;">Spezial: ${active.special}</span>`;
        }

        const skillsEl = document.getElementById('combat-skills');
        if (skillsEl) {
            skillsEl.innerHTML = '';
            this._skills().forEach(skill => {
                const cooldownMs = s.skillCooldowns?.[skill.key] ?? 0;
                const now = s.time?.now ?? Date.now();
                const remaining = Math.max(0, cooldownMs - now);
                const onCooldown = remaining > 0;
                const accent = typeof skill.accent === 'number' ? '#' + skill.accent.toString(16).padStart(6, '0') : (skill.accent ?? '#63d6ff');

                const card = document.createElement('div');
                card.style.cssText = `
                    background: rgba(255,255,255,0.04);
                    border: 1px solid ${accent}44;
                    border-left: 3px solid ${onCooldown ? '#333' : accent};
                    border-radius: 10px; padding: 11px 14px;
                    display: flex; align-items: center; gap: 12px;
                    opacity: ${onCooldown ? 0.55 : 1};
                `;
                card.innerHTML = `
                    <div style="flex:1;">
                        <div style="font-size:14px;font-weight:bold;color:${accent};">${skill.name} <span style="font-size:10px;color:#555;">[${skill.shortLabel}]</span></div>
                        <div style="font-size:11px;color:#9fdcff;margin-top:2px;">${skill.description ?? skill.desc ?? '–'}</div>
                        <div style="font-size:10px;color:#666;margin-top:2px;">Cooldown: ${(skill.cooldown / 1000).toFixed(0)}s ${skill.targetRequired ? '• Ziel erforderlich' : '• Kein Ziel nötig'}</div>
                    </div>
                    <button data-skill="${skill.key}" style="
                        background: ${onCooldown ? 'rgba(255,255,255,0.06)' : accent};
                        color: ${onCooldown ? '#555' : '#07192e'};
                        border: none; border-radius: 8px;
                        font-size: 11px; font-weight: bold;
                        padding: 9px 14px; cursor: ${onCooldown ? 'default' : 'pointer'};
                        flex-shrink: 0; white-space: nowrap;
                        touch-action: manipulation;
                    ">${onCooldown ? `${Math.ceil(remaining / 1000)}s` : 'Einsetzen'}</button>
                `;
                const btn = card.querySelector('[data-skill]');
                if (btn && !onCooldown) {
                    const doSkill = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        s.activateSkill?.(skill.key);
                        this.hide();
                    };
                    btn.addEventListener('click', doSkill);
                    btn.addEventListener('touchend', doSkill, { passive: false });
                }
                skillsEl.appendChild(card);
            });
        }

        const quickEl = document.getElementById('combat-quick-actions');
        if (quickEl) {
            const actions = [
                { icon: '🛡', label: 'Defensiv',   desc: 'Minimiert Schaden',    action: () => { s.showStatusMsg?.('Defensiv-Modus aktiviert', 0x7fff9a); this.hide(); } },
                { icon: '⚡', label: 'Angriff',    desc: 'Maximale Feuerkraft',   action: () => { s.showStatusMsg?.('Angriffs-Modus aktiviert', 0xff7070); this.hide(); } },
                { icon: '🌊', label: 'Ausweichen', desc: 'Erhöhte Beweglichkeit', action: () => { s.showStatusMsg?.('Ausweich-Modus aktiviert', 0x63d6ff); this.hide(); } },
                { icon: '🔁', label: 'Auto-Feuer', desc: 'Dauerfeuer auf Ziel',   action: () => { s.showStatusMsg?.('Auto-Feuer: auf Ziel getappt aktivieren', 0xffb347); this.hide(); } },
            ];
            quickEl.innerHTML = '';
            actions.forEach(a => {
                const btn = document.createElement('button');
                btn.style.cssText = `
                    background:rgba(255,255,255,0.05);border:1px solid rgba(255,112,112,0.2);
                    border-radius:10px;color:#ffd8d8;font-size:11px;font-weight:bold;
                    padding:11px 8px;cursor:pointer;touch-action:manipulation;
                    -webkit-tap-highlight-color:transparent;
                    display:flex;flex-direction:column;align-items:center;gap:4px;
                `;
                btn.innerHTML = `<span style="font-size:20px;">${a.icon}</span><span>${a.label}</span><span style="font-size:9px;color:#666;font-weight:normal;">${a.desc}</span>`;
                const doAction = (e) => { e.preventDefault(); a.action(); };
                btn.addEventListener('click', doAction);
                btn.addEventListener('touchend', doAction, { passive: false });
                quickEl.appendChild(btn);
            });
        }
    }

    show() { this._renderAll(); this._el.style.display = 'flex'; this.visible = true; }
    hide() { this._el.style.display = 'none'; this.visible = false; }
    toggle() { if (this.visible) this.hide(); else this.show(); }
    destroy() { if (this._el?.parentNode) this._el.parentNode.removeChild(this._el); }
}
