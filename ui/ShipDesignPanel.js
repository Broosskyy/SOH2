export default class ShipDesignPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._visible = false;
        this._activeTab = 'designs';
        this._currentKey  = scene.player?.sprite?.texture?.key ?? 'player-ship';
        this._currentName = '';  /* tracks legendary ship by name since keys can overlap */
        this._designsBody = null;
        this._talentsBody = null;
    }

    _designs() {
        return [
            /* ── Standard ships ─────────────────────────────── */
            { key: 'player-ship',          src: 'assets/player_ship_royal_crimson_v1.webp', name: 'Royal Crimson',    class: 'Fregatte',     cost: 0    },
            { key: 'player-ship-neon',     src: 'assets/player_ship_neon_pro.webp',          name: 'Neon Phantom',     class: 'Fregatte',     cost: 1200 },
            { key: 'player-ship-pro',      src: 'assets/player_ship_pro.webp',               name: 'Sea Hawk Pro',     class: 'Fregatte',     cost: 800  },
            { key: 'player-ship-frigate1', src: 'assets/player_ship_frigate_1.png',           name: 'Dark Fregatte I',  class: 'Fregatte',     cost: 1600 },
            { key: 'player-ship-frigate2', src: 'assets/player_ship_frigate_2.png',           name: 'Dark Fregatte II', class: 'Fregatte',     cost: 2000 },
            { key: 'player-ship-frigate3', src: 'assets/player_ship_frigate_3.png',           name: 'Schwarzer Geist',  class: 'Fregatte',     cost: 2800 },
            { key: 'ship-small-1',         src: 'assets/ship_cutter_1.png',                   name: 'Kutter I',         class: 'Kutter',       cost: 200  },
            { key: 'ship-small-2',         src: 'assets/ship_cutter_2.png',                   name: 'Kutter II',        class: 'Kutter',       cost: 300  },
            { key: 'ship-small-3',         src: 'assets/ship_cutter_3.png',                   name: 'Kutter III',       class: 'Kutter',       cost: 400  },
            { key: 'ship-small-4',         src: 'assets/ship_cutter_4.png',                   name: 'Kutter IV',        class: 'Kutter',       cost: 500  },
            { key: 'ship-small-5',         src: 'assets/ship_cutter_5.png',                   name: 'Kutter V',         class: 'Kutter',       cost: 600  },
            { key: 'ship-medium-1',        src: 'assets/ship_brig_1.png',                     name: 'Brigantine I',     class: 'Brigantine',   cost: 1500 },
            { key: 'ship-medium-2',        src: 'assets/ship_brig_2.png',                     name: 'Brigantine II',    class: 'Brigantine',   cost: 1800 },
            { key: 'ship-medium-3',        src: 'assets/ship_brig_3.png',                     name: 'Brigantine III',   class: 'Brigantine',   cost: 2200 },
            { key: 'ship-large-1',         src: 'assets/ship_manwar_1.png',                   name: 'Man-o-War I',      class: 'Linienschiff', cost: 4000 },
            { key: 'ship-large-2',         src: 'assets/ship_manwar_2.png',                   name: 'Man-o-War II',     class: 'Linienschiff', cost: 5500 },

            /* ── Legendary ships — unique passive bonuses ────── */
            {
                key: 'ship-small-5', src: 'assets/ship_cutter_5.png',
                name: 'Sturmvogel',   class: 'Legendär — Kutter',
                cost: 1400, unlockLevel: 5,
                bonus: { speedMult: 1.20 },
                bonusLabel: '⚡ +20% Geschwindigkeit',
                bonusColor: '#7fffb0'
            },
            {
                key: 'ship-medium-3', src: 'assets/ship_brig_3.png',
                name: 'Goldene Brigg',  class: 'Legendär — Brigantine',
                cost: 4200, unlockLevel: 8,
                bonus: { goldMult: 1.35 },
                bonusLabel: '🪙 +35% Gold aus Beute',
                bonusColor: '#ffd36a'
            },
            {
                key: 'player-ship-frigate3', src: 'assets/player_ship_frigate_3.png',
                name: 'Schatten des Todes',  class: 'Legendär — Fregatte',
                cost: 5500, unlockLevel: 10,
                bonus: { damageMult: 1.25 },
                bonusLabel: '💀 +25% Kanonenschaden',
                bonusColor: '#ff8888'
            },
            {
                key: 'ship-medium-2', src: 'assets/ship_brig_2.png',
                name: 'Sturmreiter',    class: 'Legendär — Brigantine',
                cost: 3800, unlockLevel: 6,
                bonus: { stormImmune: true, speedMult: 1.05 },
                bonusLabel: '🌊 Sturm-Immunität',
                bonusColor: '#9fdcff'
            },
            {
                key: 'player-ship-frigate2', src: 'assets/player_ship_frigate_2.png',
                name: 'Drachenzahn',    class: 'Legendär — Fregatte',
                cost: 6800, unlockLevel: 12,
                bonus: { damageMult: 1.40, speedMult: 0.90 },
                bonusLabel: '🐉 +40% Schaden, -10% Speed',
                bonusColor: '#ff9944'
            },
            {
                key: 'ship-large-2', src: 'assets/ship_manwar_2.png',
                name: 'Eiserner Koloss', class: 'Legendär — Linienschiff',
                cost: 11000, unlockLevel: 15,
                bonus: { hpMult: 1.60, speedMult: 0.85 },
                bonusLabel: '⚓ +60% HP-Maximum',
                bonusColor: '#aaaaff'
            },
        ];
    }

    _eventDesigns() {
        const all = [
            { key: 'ship-event-galleon',   src: 'assets/ship_event_galleon.png',   name: 'Konvoi-Galeone',        class: 'Beutedesigns', eventId: 'konvoi',        badge: '⚓', color: '#d4aa40' },
            { key: 'ship-event-ghost',     src: 'assets/ship_event_ghost.png',     name: 'Phantom-Geisterschiff', class: 'Beutedesigns', eventId: 'geisterschiff', badge: '👻', color: '#88aaff' },
            { key: 'ship-event-flagship',  src: 'assets/ship_event_flagship.png',  name: 'Admirals-Flaggschiff',  class: 'Beutedesigns', eventId: 'admiralsjagd',  badge: '👑', color: '#ff8844' },
        ];
        try {
            const unlocked = JSON.parse(localStorage.getItem('ahc_ship_blueprints') || '[]');
            return all.map(d => ({ ...d, unlocked: unlocked.includes(d.eventId) }));
        } catch { return all.map(d => ({ ...d, unlocked: false })); }
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'ship-design-panel';
        el.style.cssText = `
            position: fixed; inset: 0; z-index: 20000;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.75); font-family: Arial, sans-serif; padding: 8px;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            width: 100%; max-width: 580px; max-height: 92vh;
            background: linear-gradient(170deg, #0c1a2e 0%, #091526 100%);
            border: 2px solid #b8952a; border-radius: 8px;
            display: flex; flex-direction: column; overflow: hidden;
            box-shadow: 0 0 40px rgba(184,149,42,0.25);
        `;

        /* ── Header ─────────────────────────────────────── */
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 16px 0; flex-shrink: 0;
        `;
        header.innerHTML = `
            <div style="font-size:15px;font-weight:bold;color:#d4aa40;letter-spacing:2px;">⛵ SCHIFFSWERFT</div>
            <button id="sdp-close" style="
                background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);
                color:#fff;font-size:18px;width:32px;height:32px;border-radius:50%;
                cursor:pointer;touch-action:manipulation;display:flex;align-items:center;
                justify-content:center;padding:0;flex-shrink:0;
            ">✕</button>
        `;

        /* ── Tab bar ────────────────────────────────────── */
        const tabBar = document.createElement('div');
        tabBar.style.cssText = `
            display: flex; flex-direction: row; gap: 0;
            border-bottom: 2px solid rgba(184,149,42,0.35);
            padding: 0 16px; margin-top: 10px; flex-shrink: 0;
        `;
        const tabDesigns  = this._makeTab('⛵ Designs',   'designs');
        const tabTalents  = this._makeTab('🌟 Talente',   'talent');
        const tabUpgrades = this._makeTab('🔧 Upgrades',  'upgrades');
        const tabStatus   = this._makeTab('📊 Status',    'status');
        tabBar.appendChild(tabDesigns);
        tabBar.appendChild(tabTalents);
        tabBar.appendChild(tabUpgrades);
        tabBar.appendChild(tabStatus);
        this._tabDesigns  = tabDesigns;
        this._tabTalents  = tabTalents;
        this._tabUpgrades = tabUpgrades;
        this._tabStatus   = tabStatus;

        /* ── Scroll wrapper ─────────────────────────────── */
        const scrollWrap = document.createElement('div');
        scrollWrap.style.cssText = `
            flex: 1; overflow: hidden; display: flex; flex-direction: column;
        `;

        /* ── Designs body ───────────────────────────────── */
        const designsBody = document.createElement('div');
        designsBody.style.cssText = `
            flex: 1; overflow-y: auto; padding: 12px;
            -webkit-overflow-scrolling: touch; display: flex; flex-direction: column;
        `;
        this._buildDesignsContent(designsBody);
        this._designsBody = designsBody;

        /* ── Talents body ───────────────────────────────── */
        const talentsBody = document.createElement('div');
        talentsBody.style.cssText = `
            flex: 1; overflow-y: auto; padding: 12px;
            -webkit-overflow-scrolling: touch; display: none; flex-direction: column;
        `;
        this._talentsBody = talentsBody;

        /* ── Upgrades body ──────────────────────────────── */
        const upgradesBody = document.createElement('div');
        upgradesBody.style.cssText = `
            flex: 1; overflow-y: auto; padding: 12px;
            -webkit-overflow-scrolling: touch; display: none; flex-direction: column; gap: 8px;
        `;
        this._upgradesBody = upgradesBody;

        /* ── Status body ────────────────────────────────── */
        const statusBody = document.createElement('div');
        statusBody.style.cssText = `
            flex: 1; overflow-y: auto; padding: 12px;
            -webkit-overflow-scrolling: touch; display: none; flex-direction: column; gap: 8px;
        `;
        this._statusBody = statusBody;

        scrollWrap.appendChild(designsBody);
        scrollWrap.appendChild(talentsBody);
        scrollWrap.appendChild(upgradesBody);
        scrollWrap.appendChild(statusBody);

        panel.appendChild(header);
        panel.appendChild(tabBar);
        panel.appendChild(scrollWrap);
        el.appendChild(panel);

        el.addEventListener('click', (e) => { if (e.target === el) this.hide(); });
        header.querySelector('#sdp-close').addEventListener('click', () => this.hide());

        document.body.appendChild(el);
        this._el = el;

        this._applyTabStyle();
    }

    _makeTab(label, name) {
        const btn = document.createElement('button');
        btn.dataset.tab = name;
        btn.style.cssText = `
            padding: 8px 16px; background: transparent; border: none;
            border-bottom: 2px solid transparent; margin-bottom: -2px;
            font-size: 12px; font-weight: bold; cursor: pointer;
            letter-spacing: 0.5px; touch-action: manipulation;
            -webkit-tap-highlight-color: transparent; flex-shrink: 0;
            transition: color 0.15s, border-color 0.15s;
        `;
        btn.textContent = label;
        const activate = (e) => { e.preventDefault(); this._switchTab(name); };
        btn.addEventListener('click', activate);
        btn.addEventListener('touchend', activate, { passive: false });
        return btn;
    }

    _applyTabStyle() {
        [this._tabDesigns, this._tabTalents, this._tabUpgrades, this._tabStatus].forEach(btn => {
            if (!btn) return;
            const active = btn.dataset.tab === this._activeTab;
            btn.style.color       = active ? '#d4aa40' : '#6a7a8a';
            btn.style.borderColor = active ? '#d4aa40' : 'transparent';
        });
    }

    _switchTab(name) {
        this._activeTab = name;
        this._applyTabStyle();
        const bodies = {
            designs:  this._designsBody,
            talent:   this._talentsBody,
            upgrades: this._upgradesBody,
            status:   this._statusBody,
        };
        Object.entries(bodies).forEach(([tab, el]) => {
            if (!el) return;
            el.style.display = tab === name ? 'flex' : 'none';
        });
        if (name === 'talent') {
            this.scene.talentPanel?.buildContentInto(this._talentsBody);
        } else if (name === 'upgrades') {
            this._buildUpgradesContent(this._upgradesBody);
        } else if (name === 'status') {
            this._buildStatusContent(this._statusBody);
        }
    }

    _buildUpgradesContent(body) {
        body.innerHTML = '';
        const s    = this.scene;
        const up   = s.playerUpgrades ?? { hull: 0, cannon: 0, reload: 0, speed: 0, luck: 0, crew: 0 };
        const COSTS  = [300, 700, 1400, 2800, 5500];
        const UPGRADES = [
            { key: 'hull',   icon: '🛡️', label: 'Rumpfpanzerung',      desc: '+25 max. HP pro Stufe',        unit: '+25 HP' },
            { key: 'cannon', icon: '💣', label: 'Kaliber-Aufrüstung',   desc: '+8% Kanonenschaden pro Stufe', unit: '+8% Dmg' },
            { key: 'reload', icon: '⚡', label: 'Ladebeschleuniger',    desc: '-8% Ladezeit pro Stufe',       unit: '-8% Reload' },
            { key: 'speed',  icon: '🌊', label: 'Antriebsverstärker',   desc: '+5% Geschwindigkeit pro Stufe', unit: '+5% Spd' },
            { key: 'luck',   icon: '🍀', label: 'Glücksbringer',        desc: '+5% Krit-Chance pro Stufe',    unit: '+5% Crit' },
            { key: 'crew',   icon: '👥', label: 'Mannschaftsstärke',    desc: '+10% XP-Gewinn pro Stufe',     unit: '+10% XP' },
        ];
        const title = document.createElement('div');
        title.style.cssText = `font-size:10px;color:#8a9aaa;margin-bottom:4px;padding-bottom:6px;border-bottom:1px solid rgba(184,149,42,0.2);`;
        title.textContent = `Gold: ${s.player?.gold ?? 0} 🪙   —  Permanente Aufrüstungen (bleiben bei Schiffen erhalten)`;
        body.appendChild(title);
        UPGRADES.forEach(u => {
            const cur      = up[u.key] ?? 0;
            const maxed    = cur >= 5;
            const nextCost = maxed ? null : COSTS[cur];
            const card = document.createElement('div');
            card.style.cssText = `
                background:rgba(255,255,255,0.04);border:1px solid rgba(184,149,42,0.18);
                border-radius:8px;padding:10px 12px;
            `;
            /* Stars */
            const stars = '★'.repeat(cur) + '☆'.repeat(5 - cur);
            card.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:20px;">${u.icon}</span>
                        <div>
                            <div style="font-size:11px;font-weight:bold;color:#d4aa40;">${u.label}</div>
                            <div style="font-size:9px;color:#7a8a9a;">${u.desc}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:12px;color:#ffd36a;letter-spacing:1px;">${stars}</div>
                        <div style="font-size:9px;color:#5a7a6a;">${cur}/5 — ${u.unit}</div>
                    </div>
                </div>
            `;
            if (!maxed) {
                const btn = document.createElement('button');
                btn.style.cssText = `
                    width:100%;padding:6px;background:rgba(184,149,42,0.15);
                    border:1px solid rgba(184,149,42,0.4);border-radius:5px;
                    color:#d4aa40;font-size:11px;font-weight:bold;
                    cursor:pointer;touch-action:manipulation;
                `;
                btn.textContent = `${nextCost} 🪙 kaufen → Stufe ${cur + 1}`;
                const buy = e => {
                    e.preventDefault();
                    s._buyShipUpgrade?.(u.key);
                    this._buildUpgradesContent(body);
                };
                btn.addEventListener('click', buy);
                btn.addEventListener('touchend', buy, { passive: false });
                card.appendChild(btn);
            } else {
                const maxTag = document.createElement('div');
                maxTag.style.cssText = `text-align:center;font-size:10px;color:#38f287;padding:4px;`;
                maxTag.textContent = '✅ MAXIMALE STUFE ERREICHT';
                card.appendChild(maxTag);
            }
            body.appendChild(card);
        });
    }

    _buildStatusContent(body) {
        body.innerHTML = '';
        const s  = this.scene;
        const p  = s.player;
        const up = s.playerUpgrades ?? {};
        const sb = s.playerShipBonus ?? {};

        const sec = (title, color = '#d4aa40') => {
            const el = document.createElement('div');
            el.style.cssText = `font-size:10px;letter-spacing:2px;color:${color};text-transform:uppercase;
                padding-bottom:5px;border-bottom:1px solid rgba(184,149,42,0.2);margin-top:4px;`;
            el.textContent = title;
            return el;
        };
        const row = (icon, label, val, color = '#fff') => {
            const el = document.createElement('div');
            el.style.cssText = `display:flex;align-items:center;justify-content:space-between;
                padding:5px 8px;border-radius:5px;background:rgba(255,255,255,0.03);`;
            el.innerHTML = `
                <span style="font-size:14px;width:22px;text-align:center;">${icon}</span>
                <span style="flex:1;font-size:11px;color:#8a9aaa;padding:0 8px;">${label}</span>
                <span style="font-size:12px;font-weight:bold;color:${color};">${val}</span>
            `;
            return el;
        };
        const hpPct = p ? Math.round((p.hp / (p.maxHP || 1)) * 100) : 0;
        const hpColor = hpPct > 60 ? '#38f287' : hpPct > 30 ? '#ffd45c' : '#ff4444';

        body.appendChild(sec('⚓ Schiff & Besatzung'));
        if (p) {
            body.appendChild(row('⚓', 'Schiffsklasse',         p._shipClass ?? 'Standard'));
            body.appendChild(row('🎖', 'Level',                `${p.level ?? 1}`));
            body.appendChild(row('⭐', 'Erfahrung (XP)',        `${(p.xp ?? 0).toLocaleString()}`));
            body.appendChild(row('💛', 'HP',                   `${Math.ceil(p.hp ?? 0)} / ${p.maxHP ?? 300}`, hpColor));
            body.appendChild(row('🪙', 'Gold',                 `${(p.gold ?? 0).toLocaleString()}`));
        }

        body.appendChild(sec('⚙️ Kampfwerte'));
        if (p) {
            const dmgBonus = (sb.damageMult ?? 1) * (1 + (up.cannon ?? 0) * 0.08);
            const spdBonus = (sb.speedMult ?? 1) * (1 + (up.speed ?? 0) * 0.05);
            body.appendChild(row('💣', 'Kanonenschaden',       `×${dmgBonus.toFixed(2)}`));
            body.appendChild(row('🌊', 'Geschwindigkeit',      `×${spdBonus.toFixed(2)}`));
            body.appendChild(row('🍀', 'Krit-Chance',          `${((up.luck ?? 0) * 5)}%`));
            body.appendChild(row('👥', 'XP-Bonus',             `+${((up.crew ?? 0) * 10)}%`));
            body.appendChild(row('💛', 'Max HP Bonus',         `+${(up.hull ?? 0) * 25} HP`));
        }

        body.appendChild(sec('✨ Legendär-Boni'));
        const bonusLines = [
            sb.speedMult && sb.speedMult !== 1  ? `⚡ +${Math.round((sb.speedMult-1)*100)}% Geschwindigkeit` : null,
            sb.goldMult  && sb.goldMult  !== 1  ? `🪙 +${Math.round((sb.goldMult-1)*100)}% Gold` : null,
            sb.damageMult && sb.damageMult !== 1 ? `💥 +${Math.round((sb.damageMult-1)*100)}% Schaden` : null,
            sb.stormImmune                       ? `🌊 Sturm-Immunität` : null,
            sb.hpMult  && sb.hpMult  !== 1      ? `💛 +${Math.round((sb.hpMult-1)*100)}% HP` : null,
        ].filter(Boolean);
        if (bonusLines.length === 0) {
            body.appendChild(row('—', 'Kein legendäres Schiff aktiv', '—', '#556677'));
        } else {
            bonusLines.forEach(l => {
                const el = document.createElement('div');
                el.style.cssText = `font-size:10px;color:#ffd36a;padding:3px 8px;`;
                el.textContent = l;
                body.appendChild(el);
            });
        }
    }

    _classStats(cls) {
        const map = {
            'Kutter':       { speed: '★★★★★', armor: '★☆☆☆☆', firepower: '★★☆☆☆', desc: 'Schnellster Schiffstyp, kaum Panzerung.' },
            'Brigantine':   { speed: '★★★★☆', armor: '★★★☆☆', firepower: '★★★☆☆', desc: 'Ausgewogenes Allround-Schiff.' },
            'Fregatte':     { speed: '★★★☆☆', armor: '★★★★☆', firepower: '★★★★☆', desc: 'Schwere Bewaffnung, hohe Resistenz.' },
            'Linienschiff': { speed: '★★☆☆☆', armor: '★★★★★', firepower: '★★★★★', desc: 'Maximale Feuerkraft, sehr langsam.' },
            'Beutedesigns': { speed: '★★★☆☆', armor: '★★★★☆', firepower: '★★★★☆', desc: 'Seltene Event-Beute — einzigartig.' },
        };
        return map[cls] ?? map['Fregatte'];
    }

    _buildActiveShipBanner(body) {
        const allDesigns  = [...this._designs(), ...this._eventDesigns()];
        const currentKey  = this._currentKey;
        const active      = allDesigns.find(d => d.key === currentKey) ?? allDesigns[0];
        const stats       = this._classStats(active.class ?? 'Fregatte');

        const banner = document.createElement('div');
        banner.id = 'sdp-active-banner';
        banner.style.cssText = `
            display:flex; gap:12px; align-items:center;
            background:linear-gradient(135deg,rgba(212,170,64,0.12),rgba(10,30,60,0.6));
            border:1px solid rgba(212,170,64,0.4); border-radius:8px;
            padding:10px 12px; margin-bottom:14px; flex-shrink:0;
        `;
        banner.innerHTML = `
            <img src="${active.src}" alt="${active.name}"
                 style="width:58px;height:58px;object-fit:contain;border-radius:6px;flex-shrink:0;"
                 onerror="this.style.display='none'">
            <div style="flex:1;min-width:0;">
                <div style="font-size:12px;font-weight:bold;color:#d4aa40;letter-spacing:1px;margin-bottom:3px;">${active.name}</div>
                <div style="font-size:10px;color:#9fdcff;margin-bottom:6px;">${active.class}</div>
                <div style="font-size:9px;color:#aaa;line-height:1.5;">
                    <span style="display:inline-block;width:72px;color:#888;">Geschw.</span><span style="color:#ffe17a;">${stats.speed}</span><br>
                    <span style="display:inline-block;width:72px;color:#888;">Panzer.</span><span style="color:#ffe17a;">${stats.armor}</span><br>
                    <span style="display:inline-block;width:72px;color:#888;">Kanonen</span><span style="color:#ffe17a;">${stats.firepower}</span>
                </div>
            </div>
            <div style="font-size:9px;color:#8899aa;max-width:90px;line-height:1.4;text-align:right;">${stats.desc}</div>
        `;
        body.appendChild(banner);
    }

    _buildDesignsContent(body) {
        this._buildActiveShipBanner(body);
        const designs    = this._designs();
        const standard   = designs.filter(d => !d.class?.startsWith('Legendär'));
        const legendary  = designs.filter(d => d.class?.startsWith('Legendär'));
        const classes    = [...new Set(standard.map(d => d.class))];
        classes.forEach(cls => {
            body.appendChild(this._buildSection(cls, standard.filter(d => d.class === cls)));
        });

        /* Legendary section */
        if (legendary.length > 0) {
            const playerLevel = this.scene?.player?.level ?? 0;
            body.appendChild(this._buildLegendarySection(legendary, playerLevel));
        }

        /* Event designs */
        const evDesigns = this._eventDesigns();
        const evSection = document.createElement('div');
        evSection.style.marginBottom = '14px';
        const evTitle = document.createElement('div');
        evTitle.style.cssText = `
            font-size:11px; letter-spacing:2px; color:#ffd36a;
            text-transform:uppercase; margin-bottom:8px;
            border-bottom:1px solid rgba(255,211,106,0.3); padding-bottom:4px;
        `;
        evTitle.innerHTML = `📜 Beutedesigns (Event)`;
        evSection.appendChild(evTitle);
        const evGrid = document.createElement('div');
        evGrid.style.cssText = `display:grid; grid-template-columns:repeat(auto-fill,minmax(100px,1fr)); gap:8px;`;
        evDesigns.forEach(design => {
            const card = document.createElement('div');
            card.dataset.key = design.key;
            const isActive = design.key === this._currentKey;
            card.style.cssText = `
                border:2px solid ${isActive ? '#d4aa40' : design.unlocked ? `${design.color}55` : 'rgba(255,255,255,0.08)'};
                border-radius:6px; position:relative;
                background:${isActive ? 'rgba(212,170,64,0.1)' : design.unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.35)'};
                padding:8px 6px 6px; display:flex; flex-direction:column; align-items:center; gap:6px;
                cursor:${design.unlocked ? 'pointer' : 'default'}; touch-action:manipulation;
                transition:border-color 0.15s,background 0.15s; overflow:hidden;
            `;
            if (isActive) {
                const b = document.createElement('div');
                b.className = 'aktiv-badge';
                b.style.cssText = `position:absolute;top:4px;right:4px;background:#d4aa40;color:#000;font-size:8px;font-weight:bold;padding:1px 4px;border-radius:3px;`;
                b.textContent = 'AKTIV'; card.appendChild(b);
            }
            const img = document.createElement('img');
            img.src = design.src; img.alt = design.name;
            img.style.cssText = `width:64px;height:64px;object-fit:contain;${design.unlocked?'':'filter:grayscale(1) opacity(0.3);'}`;
            img.onerror = () => { img.style.display='none'; };
            const name = document.createElement('div');
            name.style.cssText = `font-size:10px;color:${design.unlocked?'#ddd':'#555'};text-align:center;line-height:1.2;word-break:break-word;`;
            name.textContent = design.name;
            const costEl = document.createElement('div');
            costEl.style.cssText = `font-size:10px;font-weight:bold;`;
            if (design.unlocked) { costEl.style.color='#7fffb0'; costEl.textContent=`${design.badge} Gewonnen`; }
            else { costEl.style.color='#555'; costEl.textContent='🔒 Event'; }
            card.appendChild(img); card.appendChild(name); card.appendChild(costEl);
            if (design.unlocked) {
                const activate = (e) => { e.preventDefault(); this._equipShip(design); this._updateCards(design.key); };
                card.addEventListener('click', activate);
                card.addEventListener('touchend', activate, { passive: false });
                card.addEventListener('touchstart', () => { card.style.background='rgba(212,170,64,0.12)'; }, { passive:true });
            }
            evGrid.appendChild(card);
        });
        evSection.appendChild(evGrid);
        body.appendChild(evSection);
    }

    _buildLegendarySection(designs, playerLevel) {
        const section = document.createElement('div');
        section.style.marginBottom = '14px';
        const title = document.createElement('div');
        title.style.cssText = `
            font-size:11px; letter-spacing:2px; color:#d4aa40;
            text-transform:uppercase; margin-bottom:8px;
            border-bottom:1px solid rgba(212,170,64,0.4); padding-bottom:4px;
        `;
        title.innerHTML = `✨ LEGENDÄRE KLASSEN`;
        section.appendChild(title);

        const grid = document.createElement('div');
        grid.style.cssText = `display:grid; grid-template-columns:repeat(auto-fill,minmax(106px,1fr)); gap:8px;`;

        designs.forEach(design => {
            const isActive  = design.key === this._currentKey && design.name === this._currentName;
            const unlocked  = playerLevel >= (design.unlockLevel ?? 0);
            const card = document.createElement('div');
            card.dataset.key = design.key;
            card.style.cssText = `
                border:2px solid ${isActive ? '#d4aa40' : unlocked ? 'rgba(212,170,64,0.30)' : 'rgba(255,255,255,0.08)'};
                border-radius:6px; position:relative;
                background:${isActive ? 'rgba(212,170,64,0.12)' : unlocked ? 'rgba(212,170,64,0.05)' : 'rgba(0,0,0,0.3)'};
                padding:8px 6px 7px; display:flex; flex-direction:column; align-items:center; gap:5px;
                cursor:${unlocked ? 'pointer' : 'default'}; touch-action:manipulation;
                transition:border-color 0.15s,background 0.15s; overflow:hidden;
            `;
            if (isActive) {
                const b = document.createElement('div');
                b.className = 'aktiv-badge';
                b.style.cssText = `position:absolute;top:4px;right:4px;background:#d4aa40;color:#000;font-size:8px;font-weight:bold;padding:1px 4px;border-radius:3px;`;
                b.textContent = 'AKTIV'; card.appendChild(b);
            }
            const img = document.createElement('img');
            img.src = design.src; img.alt = design.name;
            img.style.cssText = `width:60px;height:60px;object-fit:contain;${unlocked?'':'filter:grayscale(1) opacity(0.3);'}`;
            img.onerror = () => { img.style.display='none'; };

            const name = document.createElement('div');
            name.style.cssText = `font-size:10px;color:${unlocked?'#e8d080':'#555'};text-align:center;line-height:1.2;word-break:break-word;font-weight:bold;`;
            name.textContent = design.name;

            const bonusBadge = document.createElement('div');
            bonusBadge.style.cssText = `font-size:9px;color:${unlocked?design.bonusColor:'#444'};text-align:center;line-height:1.3;`;
            bonusBadge.textContent = design.bonusLabel ?? '';

            const costEl = document.createElement('div');
            costEl.style.cssText = `font-size:10px;font-weight:bold;`;
            if (!unlocked) {
                costEl.style.color = '#555';
                costEl.textContent = `🔒 Ab Level ${design.unlockLevel}`;
            } else {
                costEl.style.color = '#ffd36a';
                costEl.textContent = `${design.cost} 🪙`;
            }

            card.appendChild(img);
            card.appendChild(name);
            card.appendChild(bonusBadge);
            card.appendChild(costEl);

            if (unlocked) {
                const activate = (e) => {
                    e.preventDefault();
                    this._equipShip(design);
                    this._currentName = design.name;
                    this._updateCards(design.key);
                };
                card.addEventListener('click', activate);
                card.addEventListener('touchend', activate, { passive: false });
                card.addEventListener('touchstart', () => { card.style.background = 'rgba(212,170,64,0.15)'; }, { passive: true });
            }
            grid.appendChild(card);
        });
        section.appendChild(grid);
        return section;
    }

    _buildSection(cls, clsDesigns) {
        const section = document.createElement('div');
        section.style.marginBottom = '14px';
        const title = document.createElement('div');
        title.style.cssText = `
            font-size:11px; letter-spacing:2px; color:#9fdcff;
            text-transform:uppercase; margin-bottom:8px;
            border-bottom:1px solid rgba(99,214,255,0.2); padding-bottom:4px;
        `;
        title.textContent = cls;
        section.appendChild(title);
        const grid = document.createElement('div');
        grid.style.cssText = `display:grid; grid-template-columns:repeat(auto-fill,minmax(100px,1fr)); gap:8px;`;
        clsDesigns.forEach(design => {
            const card = document.createElement('div');
            card.dataset.key = design.key;
            const isActive = design.key === this._currentKey;
            card.style.cssText = `
                border:2px solid ${isActive ? '#d4aa40' : 'rgba(255,255,255,0.12)'};
                border-radius:6px; background:${isActive ? 'rgba(212,170,64,0.1)' : 'rgba(255,255,255,0.04)'};
                padding:8px 6px 6px; display:flex; flex-direction:column; align-items:center; gap:6px;
                cursor:pointer; touch-action:manipulation;
                transition:border-color 0.15s,background 0.15s; position:relative;
            `;
            if (isActive) {
                const badge = document.createElement('div');
                badge.className = 'aktiv-badge';
                badge.style.cssText = `position:absolute;top:4px;right:4px;background:#d4aa40;color:#000;font-size:8px;font-weight:bold;padding:1px 4px;border-radius:3px;letter-spacing:0.5px;`;
                badge.textContent = 'AKTIV'; card.appendChild(badge);
            }
            const img = document.createElement('img');
            img.src = design.src; img.alt = design.name;
            img.style.cssText = `width:64px;height:64px;object-fit:contain;image-rendering:auto;`;
            img.onerror = () => { img.style.display = 'none'; };
            const name = document.createElement('div');
            name.style.cssText = `font-size:10px;color:#ddd;text-align:center;line-height:1.2;word-break:break-word;`;
            name.textContent = design.name;
            const costEl = document.createElement('div');
            costEl.style.cssText = `font-size:10px;color:${design.cost === 0 ? '#7fffb0' : '#ffd36a'};font-weight:bold;`;
            costEl.textContent = design.cost === 0 ? 'Standard' : `${design.cost} 🪙`;
            card.appendChild(img); card.appendChild(name); card.appendChild(costEl);
            const activate = (e) => { e.preventDefault(); this._equipShip(design); this._updateCards(design.key); };
            card.addEventListener('click', activate);
            card.addEventListener('touchend', activate, { passive: false });
            card.addEventListener('touchstart', () => { card.style.background = 'rgba(212,170,64,0.15)'; }, { passive: true });
            grid.appendChild(card);
        });
        section.appendChild(grid);
        return section;
    }

    _updateCards(activeKey) {
        if (!this._el) return;
        this._currentKey = activeKey;
        /* Refresh active-ship banner */
        const oldBanner = this._el.querySelector('#sdp-active-banner');
        if (oldBanner && this._designsBody) {
            const tmp = document.createElement('div');
            this._buildActiveShipBanner(tmp);
            this._designsBody.replaceChild(tmp.firstChild, oldBanner);
        }
        this._el.querySelectorAll('[data-key]').forEach(card => {
            const isActive = card.dataset.key === activeKey;
            card.style.border     = `2px solid ${isActive ? '#d4aa40' : 'rgba(255,255,255,0.12)'}`;
            card.style.background = isActive ? 'rgba(212,170,64,0.1)' : 'rgba(255,255,255,0.04)';
            const existing = card.querySelector('.aktiv-badge');
            if (existing) existing.remove();
            if (isActive) {
                const badge = document.createElement('div');
                badge.className = 'aktiv-badge';
                badge.style.cssText = `position:absolute;top:4px;right:4px;background:#d4aa40;color:#000;font-size:8px;font-weight:bold;padding:1px 4px;border-radius:3px;letter-spacing:0.5px;`;
                badge.textContent = 'AKTIV';
                card.appendChild(badge);
            }
        });
    }

    _scaleForClass(cls) {
        switch (cls) {
            case 'Kutter':       return 0.082;
            case 'Brigantine':   return 0.095;
            case 'Linienschiff': return 0.13;
            case 'Beutedesigns': return 0.11;
            default:             return 0.10;
        }
    }

    _equipShip(design) {
        const s = this.scene;
        if (!s.player) return;

        /* Cost check (skip if cost is 0 or already equipped) */
        if ((design.cost ?? 0) > 0 && design.key !== this._currentKey) {
            if ((s.player.gold ?? 0) < design.cost) {
                s.showStatusMsg?.(`Nicht genug Gold! Benötigt: ${design.cost} 🪙`, 0xff6644);
                return;
            }
            s.player.gold -= design.cost;
            s.events?.emit('gold-collected', 0); /* refresh HUD */
        }

        const rawClass = design.class?.replace('Legendär — ', '') ?? 'Fregatte';
        const scale    = this._scaleForClass(rawClass);
        const bonus    = design.bonus ?? {};

        const apply = () => {
            s.player.sprite.setTexture(design.key);
            s.player.sprite.setScale(scale);
            s.playerShipDesign  = design.key;
            s.playerShipClass   = rawClass;
            s.playerShipScale   = scale;
            s.playerShipBonus   = bonus;
            this._currentName   = design.name;

            /* Apply HP multiplier instantly */
            if (bonus.hpMult && bonus.hpMult !== 1) {
                const base = 200 + (s.player.level - 1) * 28;
                s.player.maxHP = Math.round(base * bonus.hpMult);
                s.player.hp    = Math.min(s.player.hp ?? s.player.maxHP, s.player.maxHP);
                s.player.refreshShipInfoPanel?.(true);
            }
            /* Apply speed bonus */
            s._recalcPlayerSpeed?.();

            const bonusStr = design.bonusLabel ? `  ${design.bonusLabel}` : '';
            s.showStatusMsg?.(`⛵ ${design.name} ausgerüstet${bonusStr}`, design.bonusColor ? parseInt(design.bonusColor.replace('#', ''), 16) : 0xd4aa40);

            try {
                localStorage.setItem(
                    `ahc_ship_${window._loginUsername ?? 'player'}`,
                    JSON.stringify({ key: design.key, scale, cls: design.class, bonus, shipName: design.name })
                );
            } catch {}
        };

        if (!s.textures.exists(design.key)) {
            s.load.image(design.key, design.src);
            s.load.once('complete', apply);
            s.load.start();
        } else {
            apply();
        }
    }

    /* ── Public API ──────────────────────────────────────── */

    show() {
        if (!this._el) {
            this._build();
        } else {
            this._el.style.display = 'flex';
            /* Refresh talents content if that tab is active */
            if (this._activeTab === 'talent' && this._talentsBody) {
                this.scene.talentPanel?.buildContentInto(this._talentsBody);
            }
        }
        this._visible = true;
    }

    openOnTab(tab) {
        this.show();
        this._switchTab(tab);
    }

    hide() {
        if (this._el) this._el.style.display = 'none';
        this._visible = false;
    }

    toggle() { if (this._visible) this.hide(); else this.show(); }
    isOpen() { return this._visible; }

    destroy() {
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
        this._el = null;
    }
}
