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
            background: rgba(2, 10, 20, 0.86);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            align-items: flex-start;
            justify-content: center;
            padding-top: 70px;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
            touch-action: none;
            overflow-y: auto;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            position: relative;
            background: linear-gradient(160deg, #07192e 0%, #0b2040 100%);
            border: 2px solid #4ac8ff;
            border-radius: 18px;
            box-shadow: 0 0 40px rgba(74,200,255,0.25), 0 8px 40px rgba(0,0,0,0.8);
            width: min(440px, 96vw);
            max-height: calc(100dvh - 80px);
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0 0 20px 0;
            scrollbar-width: thin;
            scrollbar-color: #2a6080 #07192e;
            margin-bottom: 10px;
        `;

        panel.innerHTML = `
            <div id="shop-header" style="
                display: flex; align-items: center; justify-content: space-between;
                padding: 16px 20px 12px;
                border-bottom: 1px solid rgba(74,200,255,0.25);
                position: sticky; top: 0; z-index: 2;
                background: linear-gradient(160deg, #07192e 0%, #0b2040 100%);
            ">
                <div>
                    <div style="font-size:19px;font-weight:bold;color:#dff8ff;letter-spacing:1px;">⚓ Dockyard</div>
                    <div id="shop-resources" style="font-size:12px;color:#ffd36a;margin-top:3px;"></div>
                </div>
                <button id="shop-close-btn" style="
                    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25);
                    border-radius: 50%; color: #fff; font-size: 22px;
                    width: 40px; height: 40px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                ">×</button>
            </div>
            <div id="shop-stat-bar" style="display:flex;gap:6px;flex-wrap:wrap;padding:10px 14px 4px;"></div>
            <div style="padding:6px 14px 2px;">
                <div style="font-size:10px;color:#4a8cb0;letter-spacing:1px;text-transform:uppercase;font-weight:bold;">⚙ Schiff-Upgrades</div>
            </div>
            <div id="shop-cards" style="padding:4px 14px 0;"></div>
            <div style="padding:10px 14px 2px;margin-top:6px;">
                <div style="font-size:10px;color:#4a8cb0;letter-spacing:1px;text-transform:uppercase;font-weight:bold;">🛠 Sofort-Dienste</div>
            </div>
            <div id="shop-services" style="padding:4px 14px 0;"></div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
        this._panel = panel;
    }

    _bindEvents() {
        const closeBtn = document.getElementById('shop-close-btn');
        const doClose = (e) => { e.preventDefault(); this.hide(); };
        closeBtn.addEventListener('click', doClose);
        closeBtn.addEventListener('touchend', doClose, { passive: false });

        this._el.addEventListener('click', (e) => { if (e.target === this._el) this.hide(); });
        this._el.addEventListener('touchend', (e) => { if (e.target === this._el) this.hide(); }, { passive: false });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });
    }

    _cardDefs() {
        return [
            { type: 'hull',        label: 'Rumpf-Panzerung',  icon: '🛡', accent: '#63d6ff', levelKey: 'hullLevel' },
            { type: 'sails',       label: 'Segel-Antrieb',    icon: '⛵', accent: '#8bffba', levelKey: 'sailLevel' },
            { type: 'cannons',     label: 'Kanonen-Batterie', icon: '💥', accent: '#ffb347', levelKey: 'cannonLevel' },
            { type: 'cannonSlots', label: 'Kanonen-Schlitze', icon: '🔫', accent: '#ffd36a', levelKey: 'cannonSlotLevel' },
            { type: 'decks',       label: 'Deck-Kapazität',   icon: '🚢', accent: '#6ae0d8', levelKey: 'deckLevel' },
            { type: 'ammo',        label: 'Munitions-Labor',  icon: '⚡', accent: '#c79fff', levelKey: 'ammoTechLevel' },
        ];
    }

    _statDesc(type, p) {
        switch (type) {
            case 'hull':        return `Lv.${p.hullLevel} • +${p.hullHpPerLevel} HP/Upgrade • HP ${Math.ceil(p.hp)}/${p.maxHP}`;
            case 'sails':       return `Lv.${p.sailLevel} • +${p.sailSpeedPerLevel} Geschw. • aktuell ${p.speed}`;
            case 'cannons':     return `Lv.${p.cannonLevel} • +${p.cannonDamagePerLevel} Dmg • Reload ${p.reloadTime}ms`;
            case 'cannonSlots': return `Lv.${p.cannonSlotLevel} • +2 Kanonen • aktuell ${p.cannonCount}`;
            case 'decks':       return `Lv.${p.deckLevel} • +1 Deck • Bonus ×${p.deckDamageMultiplier?.toFixed(2)}`;
            case 'ammo':        return `Lv.${p.ammoTechLevel} • +${p.ammoDamagePerLevel} Kraft • Reichweite ${p.cannonRange}`;
            default:            return '';
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
                display: flex; align-items: center; gap: 12px;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
            `;
            card.innerHTML = `
                <div style="font-size:26px;flex-shrink:0;line-height:1;">${icon}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;font-weight:bold;color:${accent};margin-bottom:2px;">${label}</div>
                    <div style="font-size:11px;color:#9fdcff;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${desc}</div>
                    <div style="font-size:11px;color:${canAfford ? '#ffd36a' : '#ff7070'};">
                        💰 ${cost.gold} &nbsp;•&nbsp; 🔩 ${cost.materials} mats
                    </div>
                </div>
                <button data-upgrade-type="${type}" style="
                    background: ${canAfford ? accent : 'rgba(255,255,255,0.08)'};
                    color: ${canAfford ? '#07192e' : '#666'};
                    border: none; border-radius: 8px;
                    font-size: 12px; font-weight: bold;
                    padding: 9px 14px; cursor: ${canAfford ? 'pointer' : 'default'};
                    flex-shrink: 0; white-space: nowrap;
                    touch-action: manipulation;
                ">KAUFEN</button>
            `;
            const btn = card.querySelector('button');
            const doUpgrade = (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!canAfford) return;
                this.scene.buyUpgrade(type);
                this._renderAll();
            };
            btn.addEventListener('click', doUpgrade);
            btn.addEventListener('touchend', doUpgrade, { passive: false });
            container.appendChild(card);
        });
    }

    _renderServices() {
        const p = this.scene.player;
        if (!p) return;
        const el = document.getElementById('shop-services');
        if (!el) return;
        el.innerHTML = '';

        const hpMissing = Math.max(0, p.maxHP - Math.ceil(p.hp));
        const repairCost = Math.max(50, Math.floor(hpMissing * 0.5));
        const canRepair = hpMissing > 0 && p.gold >= repairCost;
        const fullyHealed = hpMissing <= 0;

        const services = [
            {
                icon: '❤️‍🩹',
                label: 'Sofort-Reparatur',
                desc: fullyHealed ? 'Rumpf ist vollständig intakt' : `Heilt ${hpMissing} HP auf Maximum`,
                cost: fullyHealed ? '–' : `💰 ${repairCost} Gold`,
                canDo: canRepair,
                disabled: fullyHealed,
                accent: '#7fff9a',
                action: () => {
                    if (!canRepair) return;
                    p.gold -= repairCost;
                    p.hp = p.maxHP;
                    this.scene.showStatusMsg(`Reparatur abgeschlossen! +${hpMissing} HP`, 0x7fff9a);
                    this.scene.updateUIBars?.();
                    this._renderAll();
                },
            },
            {
                icon: '⚡',
                label: 'Munitions-Nachschub',
                desc: 'Füllt Sturm-Schüsse auf Maximum auf',
                cost: `💰 ${Math.floor(p.level * 30 + 80)} Gold`,
                canDo: p.gold >= Math.floor(p.level * 30 + 80),
                disabled: false,
                accent: '#c79fff',
                action: () => {
                    const cost = Math.floor(p.level * 30 + 80);
                    if (p.gold < cost) return;
                    p.gold -= cost;
                    p.stormShots = (p.maxStormShots ?? 5);
                    this.scene.showStatusMsg('Munition aufgefüllt! Sturmschüsse bereit', 0xc79fff);
                    this.scene.updateUIBars?.();
                    this._renderAll();
                },
            },
            {
                icon: '🗺️',
                label: 'Schatz-Karte',
                desc: 'Zeigt den nächsten Loot-Spawn auf der Karte',
                cost: `💰 150 Gold`,
                canDo: p.gold >= 150,
                disabled: false,
                accent: '#ffd36a',
                action: () => {
                    if (p.gold < 150) return;
                    p.gold -= 150;
                    this.scene.showStatusMsg('Schatz-Karte aktiviert! Suche nach goldenem Schimmer', 0xffd36a);
                    this.scene.events?.emit('treasure-map-activated');
                    this.scene.updateUIBars?.();
                    this._renderAll();
                },
            },
        ];

        services.forEach(svc => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255,255,255,0.04);
                border: 1px solid ${svc.accent}33;
                border-left: 3px solid ${svc.disabled ? '#333' : svc.accent};
                border-radius: 10px;
                padding: 11px 14px;
                margin-bottom: 8px;
                display: flex; align-items: center; gap: 12px;
                opacity: ${svc.disabled ? 0.5 : 1};
            `;
            card.innerHTML = `
                <div style="font-size:26px;flex-shrink:0;">${svc.icon}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;font-weight:bold;color:${svc.accent};margin-bottom:2px;">${svc.label}</div>
                    <div style="font-size:11px;color:#9fdcff;margin-bottom:4px;">${svc.desc}</div>
                    <div style="font-size:11px;color:${svc.canDo ? '#ffd36a' : svc.disabled ? '#555' : '#ff7070'};">${svc.cost}</div>
                </div>
                <button style="
                    background: ${(svc.canDo && !svc.disabled) ? svc.accent : 'rgba(255,255,255,0.06)'};
                    color: ${(svc.canDo && !svc.disabled) ? '#07192e' : '#555'};
                    border: none; border-radius: 8px;
                    font-size: 12px; font-weight: bold;
                    padding: 9px 12px; cursor: ${(svc.canDo && !svc.disabled) ? 'pointer' : 'default'};
                    flex-shrink: 0; white-space: nowrap;
                    touch-action: manipulation;
                ">${svc.disabled ? '✓ OK' : 'NUTZEN'}</button>
            `;
            const btn = card.querySelector('button');
            const doIt = (e) => { e.stopPropagation(); e.preventDefault(); svc.action(); };
            btn.addEventListener('click', doIt);
            btn.addEventListener('touchend', doIt, { passive: false });
            el.appendChild(card);
        });
    }

    _renderResources() {
        const p = this.scene.player;
        if (!p) return;
        const el = document.getElementById('shop-resources');
        if (el) el.textContent = `💰 ${p.gold} Gold  •  🔩 ${p.materials} Mats`;
    }

    _renderStatBar() {
        const p = this.scene.player;
        if (!p) return;
        const el = document.getElementById('shop-stat-bar');
        if (!el) return;
        const stats = [
            { label: 'HP',    value: `${Math.ceil(p.hp)}/${p.maxHP}`, color: '#7fff9a' },
            { label: 'SPD',   value: `${p.speed}`,                    color: '#8bffba' },
            { label: 'CAN',   value: `${p.cannonCount}`,              color: '#ffb347' },
            { label: 'DMG',   value: `${p.getTotalDamagePerShot?.(p.ammoMultiplier ?? 1) ?? '?'}`, color: '#ff8c69' },
            { label: 'DECK',  value: `${p.deckCount}`,                color: '#6ae0d8' },
            { label: 'RANGE', value: `${p.cannonRange}`,              color: '#c79fff' },
        ];
        el.innerHTML = stats.map(s => `
            <div style="
                background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
                border-radius:6px;padding:5px 8px;text-align:center;min-width:48px;
            ">
                <div style="font-size:9px;color:#7ab8d4;text-transform:uppercase;">${s.label}</div>
                <div style="font-size:13px;font-weight:bold;color:${s.color};">${s.value}</div>
            </div>
        `).join('');
    }

    _renderAll() {
        this._renderResources();
        this._renderStatBar();
        this._renderCards();
        this._renderServices();
    }

    show() { this._renderAll(); this._el.style.display = 'flex'; this.visible = true; }
    hide() { this._el.style.display = 'none'; this.visible = false; }
    toggle() { if (this.visible) this.hide(); else this.show(); }
    destroy() { if (this._el?.parentNode) this._el.parentNode.removeChild(this._el); }
}
