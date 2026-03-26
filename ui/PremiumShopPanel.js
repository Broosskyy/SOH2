export default class PremiumShopPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._visible = false;
        this._activeTab = 'upgrades';
    }

    _tabs() {
        return [
            { key: 'upgrades', label: '⚓ Upgrades',  color: '#6dd4ff' },
            { key: 'ammo',     label: '💣 Munition',   color: '#ffaa44' },
            { key: 'crew',     label: '👥 Besatzung',  color: '#aaffaa' },
            { key: 'premium',  label: '💎 Premium',    color: '#dd88ff' },
        ];
    }

    _items(tab) {
        const p = this.scene.player;
        const gold = p?.gold ?? 0;
        const gems = p?.gems ?? 0;

        const all = {
            upgrades: [
                { id: 'hull_repair',   icon: '🔧', name: 'Rumpf reparieren',       desc: 'Stellt sofort 500 HP wieder her',                     cost: 150,   currency: 'gold',  action: () => { if(p){ p.heal(500); return true; } } },
                { id: 'cannon_up',     icon: '💥', name: 'Kanonenstärke +10%',     desc: 'Erhöht Kanonenschaden um 10% für diese Sitzung',      cost: 300,   currency: 'gold',  action: () => { if(p){ p.ammoMultiplier = (p.ammoMultiplier ?? 1) * 1.1; p.refreshShipInfoPanel(true); return true; } } },
                { id: 'speed_boost',   icon: '💨', name: 'Geschwindigkeitsschub',  desc: '+15% Schiffsgeschwindigkeit für 3 Minuten',           cost: 200,   currency: 'gold',  action: () => { if(p){ p.baseSpeed *= 1.15; setTimeout(() => { p.baseSpeed /= 1.15; }, 180000); return true; } } },
                { id: 'reload_boost',  icon: '⚡', name: 'Schnellladung',          desc: 'Halbiert Nachladezeit für 2 Minuten',                 cost: 250,   currency: 'gold',  action: () => { if(p){ p.attackCooldownMs = (p.attackCooldownMs ?? 2000) * 0.5; setTimeout(() => { p.attackCooldownMs = (p.attackCooldownMs ?? 1000) * 2; }, 120000); return true; } } },
                { id: 'hull_armor',    icon: '🛡️', name: 'Panzerplatte',           desc: '+200 Max-HP dauerhaft (Sitzung)',                     cost: 500,   currency: 'gold',  action: () => { if(p){ p.maxHP += 200; p.hp = Math.min(p.hp + 200, p.maxHP); return true; } } },
                { id: 'deck_upgrade',  icon: '🏴‍☠️', name: 'Neues Deck',          desc: '+1 Deck (mehr Kanonenpositionen)',                    cost: 800,   currency: 'gold',  action: () => { if(p){ p.deckCount = Math.min((p.deckCount ?? 1) + 1, 6); p.refreshShipInfoPanel(true); return true; } } },
            ],
            ammo: [
                { id: 'ammo_flare',    icon: '🔥', name: 'Leuchtfackel x20',       desc: '20 Leuchtfackel-Kugeln (LG)',                         cost: 100,   currency: 'gold',  action: () => { if(p){ p.ammoInventory.flare = (p.ammoInventory.flare ?? 0) + 20; return true; } } },
                { id: 'ammo_fire',     icon: '💥', name: 'Brandkugeln x15',        desc: '15 Feuerkugeln — erzeugen Flächenschaden (FG)',        cost: 150,   currency: 'gold',  action: () => { if(p){ p.ammoInventory.fire = (p.ammoInventory.fire ?? 0) + 15; return true; } } },
                { id: 'ammo_storm',    icon: '🌪️', name: 'Sturmkugeln x10',       desc: '10 Sturmkugeln — verlangsamt Feinde (SK)',             cost: 200,   currency: 'gold',  action: () => { if(p){ p.ammoInventory.storm = (p.ammoInventory.storm ?? 0) + 10; return true; } } },
                { id: 'ammo_chain',    icon: '⛓️', name: 'Kettenschuss x10',       desc: '10 Kettenschüsse — zerstört Segel (CS)',              cost: 300,   currency: 'gold',  action: () => { if(p){ p.ammoInventory.chainshot = (p.ammoInventory.chainshot ?? 0) + 10; p.specialAmmoUnlocks.chainshot = true; return true; } } },
                { id: 'ammo_grape',    icon: '💀', name: 'Kartätsche x10',         desc: '10 Kartätsche — tötet Besatzung (GS)',                cost: 300,   currency: 'gold',  action: () => { if(p){ p.ammoInventory.grapeshot = (p.ammoInventory.grapeshot ?? 0) + 10; p.specialAmmoUnlocks.grapeshot = true; return true; } } },
                { id: 'ammo_pack',     icon: '📦', name: 'Munitionspaket (Alle)',  desc: 'Füllt alle Munitionstypen auf',                       cost: 700,   currency: 'gold',  action: () => { if(p){ p.ammoInventory.flare += 30; p.ammoInventory.fire += 20; p.ammoInventory.storm += 15; p.ammoInventory.chainshot += 15; p.ammoInventory.grapeshot += 15; p.specialAmmoUnlocks.chainshot = true; p.specialAmmoUnlocks.grapeshot = true; return true; } } },
            ],
            crew: [
                { id: 'crew_gunner',   icon: '🎯', name: 'Kanonier anheuern',      desc: '+5% Kanonenreichweite (Sitzung)',                     cost: 400,   currency: 'gold',  action: () => { if(p){ p.attackRange = (p.attackRange ?? 320) * 1.05; return true; } } },
                { id: 'crew_surgeon',  icon: '⚕️', name: 'Schiffsarzt anheuern',   desc: 'Auto-Heilung: +5 HP alle 10 Sek.',                    cost: 600,   currency: 'gold',  action: () => { if(p){ const id = setInterval(() => { if(p?.active) p.heal(5); else clearInterval(id); }, 10000); return true; } } },
                { id: 'crew_navigator',icon: '🧭', name: 'Navigator anheuern',     desc: '+20% Schiffsgeschwindigkeit dauerhaft',               cost: 500,   currency: 'gold',  action: () => { if(p){ p.baseSpeed *= 1.20; return true; } } },
                { id: 'crew_spy',      icon: '🕵️', name: 'Spion anheuern',        desc: 'Zeigt Loot-Positionen auf der Minimap',               cost: 350,   currency: 'gold',  action: () => { if(p){ this.scene.showLootOnMinimap = true; return true; } } },
            ],
            premium: [
                { id: 'gem_rep',       icon: '🔮', name: 'Sofort-Reparatur',       desc: 'Repariert Schiff auf 100% HP sofort',                 cost: 5,     currency: 'gems',  action: () => { if(p){ p.hp = p.maxHP; return true; } } },
                { id: 'gem_xp',        icon: '✨', name: 'XP-Boost x2 (10 Min)', desc: 'Doppelte Erfahrung für 10 Minuten',                   cost: 10,    currency: 'gems',  action: () => { if(p){ p._xpMultiplier = (p._xpMultiplier ?? 1) * 2; setTimeout(() => { p._xpMultiplier = (p._xpMultiplier ?? 2) / 2; }, 600000); return true; } } },
                { id: 'gem_gold',      icon: '💰', name: 'Gold-Pack (5000)',        desc: '5000 Gold direkt aufs Konto',                         cost: 15,    currency: 'gems',  action: () => { if(p){ p.gold = (p.gold ?? 0) + 5000; return true; } } },
                { id: 'gem_slot',      icon: '🎰', name: 'Schatzkammer-Slot',      desc: 'Erweitert Inventar um 5 Slots',                       cost: 8,     currency: 'gems',  action: () => { if(p){ p.inventorySlots = (p.inventorySlots ?? 10) + 5; return true; } } },
                { id: 'gem_flag',      icon: '🏴', name: 'Piratenflagge (selten)', desc: 'Exklusives Schiffsbanner (kosmetisch)',               cost: 20,    currency: 'gems',  action: () => { this.scene.showStatusMsg?.('Flagge gesetzt! Arrr! 🏴', 0xaa44ff); return true; } },
                { id: 'gem_cannon',    icon: '⚙️', name: 'Titan-Kanone',           desc: '+25% Dauerschaden — Dauerhaft für diesen Charakter',  cost: 50,    currency: 'gems',  action: () => { if(p){ p.ammoMultiplier = (p.ammoMultiplier ?? 1) * 1.25; p.refreshShipInfoPanel(true); return true; } } },
            ]
        };
        return all[tab] ?? [];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'premium-shop-panel';
        el.style.cssText = `
            position:fixed; inset:0; z-index:20000;
            display:flex; align-items:center; justify-content:center;
            background:rgba(0,0,0,0.78); font-family:Arial,sans-serif; padding:8px;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            width:100%; max-width:580px; max-height:92vh;
            background:linear-gradient(170deg,#0c1a2e 0%,#070f1a 100%);
            border:2px solid #c79a52; border-radius:8px;
            display:flex; flex-direction:column; overflow:hidden;
            box-shadow:0 0 50px rgba(199,154,82,0.2);
        `;

        const p = this.scene.player;
        const gold = p?.gold ?? 0;
        const gems = p?.gems ?? 0;

        const header = document.createElement('div');
        header.style.cssText = `
            display:flex; align-items:center; justify-content:space-between;
            padding:14px 16px 10px; border-bottom:1px solid rgba(199,154,82,0.3); flex-shrink:0;
        `;
        header.innerHTML = `
            <div style="font-size:16px;font-weight:bold;color:#d4aa40;letter-spacing:2px;">🛒 SCHIFFSHANDEL</div>
            <div style="display:flex;gap:14px;align-items:center;">
                <span style="font-size:13px;color:#ffd36a;">🪙 ${gold.toLocaleString()}</span>
                <span style="font-size:13px;color:#dd88ff;">💎 ${gems}</span>
                <button id="shop-close" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:18px;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;touch-action:manipulation;">✕</button>
            </div>
        `;

        const tabBar = document.createElement('div');
        tabBar.style.cssText = `display:flex; border-bottom:1px solid rgba(199,154,82,0.2); flex-shrink:0;`;
        this._tabs().forEach(tab => {
            const btn = document.createElement('button');
            btn.dataset.tab = tab.key;
            btn.style.cssText = `
                flex:1; padding:10px 4px; background:transparent;
                border:none; border-bottom:2px solid ${this._activeTab === tab.key ? tab.color : 'transparent'};
                color:${this._activeTab === tab.key ? tab.color : '#888'};
                font-size:11px; cursor:pointer; touch-action:manipulation;
                transition:all 0.15s; white-space:nowrap;
            `;
            btn.textContent = tab.label;
            btn.addEventListener('click', () => this._switchTab(tab.key));
            tabBar.appendChild(btn);
        });

        const body = document.createElement('div');
        body.id = 'shop-body';
        body.style.cssText = `flex:1; overflow-y:auto; padding:12px; -webkit-overflow-scrolling:touch;`;

        panel.appendChild(header);
        panel.appendChild(tabBar);
        panel.appendChild(body);
        el.appendChild(panel);

        el.addEventListener('click', (e) => { if (e.target === el) this.hide(); });
        document.body.appendChild(el);
        this._el = el;
        this._tabBar = tabBar;

        setTimeout(() => {
            document.getElementById('shop-close')?.addEventListener('click', () => this.hide());
        }, 0);

        this._renderTab(this._activeTab);
    }

    _switchTab(key) {
        this._activeTab = key;
        this._tabs().forEach(tab => {
            const btn = this._tabBar?.querySelector(`[data-tab="${tab.key}"]`);
            if (!btn) return;
            const active = tab.key === key;
            btn.style.borderBottomColor = active ? tab.color : 'transparent';
            btn.style.color = active ? tab.color : '#888';
        });
        this._renderTab(key);
    }

    _renderTab(key) {
        const body = document.getElementById('shop-body');
        if (!body) return;
        body.innerHTML = '';
        const items = this._items(key);
        const p = this.scene.player;

        items.forEach(item => {
            const card = document.createElement('div');
            card.style.cssText = `
                display:flex; align-items:center; gap:12px;
                padding:12px 14px; margin-bottom:8px;
                background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
                border-radius:6px; cursor:pointer; touch-action:manipulation;
                transition:background 0.12s;
            `;

            const isGems = item.currency === 'gems';
            const currencyColor = isGems ? '#dd88ff' : '#ffd36a';
            const currencyIcon  = isGems ? '💎' : '🪙';
            const balance = isGems ? (p?.gems ?? 0) : (p?.gold ?? 0);
            const canAfford = balance >= item.cost;

            card.innerHTML = `
                <div style="font-size:26px;flex-shrink:0;">${item.icon}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:bold;color:#ddd;margin-bottom:2px;">${item.name}</div>
                    <div style="font-size:11px;color:#888;line-height:1.3;">${item.desc}</div>
                </div>
                <button data-id="${item.id}" style="
                    flex-shrink:0; padding:8px 12px;
                    background:${canAfford ? 'rgba(212,170,64,0.12)' : 'rgba(100,100,100,0.12)'};
                    border:1px solid ${canAfford ? currencyColor : '#555'};
                    color:${canAfford ? currencyColor : '#666'};
                    border-radius:4px; cursor:${canAfford ? 'pointer' : 'not-allowed'};
                    font-size:12px; font-weight:bold; white-space:nowrap;
                    touch-action:manipulation;
                ">${item.cost} ${currencyIcon}</button>
            `;

            const buyBtn = card.querySelector(`[data-id="${item.id}"]`);
            if (canAfford) {
                const doBuy = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (!p) return;
                    const cur = isGems ? (p.gems ?? 0) : (p.gold ?? 0);
                    if (cur < item.cost) { this.scene.showStatusMsg?.('Nicht genug ' + (isGems ? 'Edelsteine!' : 'Gold!'), 0xff4444); return; }
                    if (isGems) { p.gems = (p.gems ?? 0) - item.cost; }
                    else { p.gold -= item.cost; this.scene.missionPanel?.trackGold?.(-item.cost); }
                    const ok = item.action?.();
                    if (ok !== false) {
                        this.scene.showStatusMsg?.(`✓ ${item.name} gekauft!`, 0x44ff88);
                        this.scene.updateUIBars?.();
                        this._renderTab(key);
                    }
                };
                buyBtn.addEventListener('click', doBuy);
                buyBtn.addEventListener('touchend', doBuy, { passive: false });
            }
            body.appendChild(card);
        });

        if (items.length === 0) {
            body.innerHTML = '<div style="text-align:center;color:#555;padding:40px;">Keine Artikel verfügbar.</div>';
        }
    }

    show() {
        if (this._el) { this._el.style.display = 'flex'; this._visible = true; this._renderTab(this._activeTab); return; }
        this._build();
        this._visible = true;
    }

    hide() {
        if (this._el) this._el.style.display = 'none';
        this._visible = false;
    }

    toggle() { if (this._visible) this.hide(); else this.show(); }
    isOpen()  { return this._visible; }

    destroy() {
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
        this._el = null;
    }
}
