export default class ShipDesignPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._visible = false;
        this._activeTab = 'designs';
        this._currentKey = scene.player?.sprite?.texture?.key ?? 'player-ship';
        this._designsBody = null;
        this._talentsBody = null;
    }

    _designs() {
        return [
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
        const tabDesigns  = this._makeTab('⛵ Designs',  'designs');
        const tabTalents  = this._makeTab('🌟 Talente',  'talent');
        tabBar.appendChild(tabDesigns);
        tabBar.appendChild(tabTalents);
        this._tabDesigns = tabDesigns;
        this._tabTalents = tabTalents;

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

        scrollWrap.appendChild(designsBody);
        scrollWrap.appendChild(talentsBody);

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
        [this._tabDesigns, this._tabTalents].forEach(btn => {
            if (!btn) return;
            const active = btn.dataset.tab === this._activeTab;
            btn.style.color        = active ? '#d4aa40' : '#6a7a8a';
            btn.style.borderColor  = active ? '#d4aa40' : 'transparent';
        });
    }

    _switchTab(name) {
        this._activeTab = name;
        this._applyTabStyle();
        if (!this._designsBody || !this._talentsBody) return;
        if (name === 'designs') {
            this._designsBody.style.display = 'flex';
            this._talentsBody.style.display = 'none';
        } else {
            this._designsBody.style.display = 'none';
            this._talentsBody.style.display = 'flex';
            this.scene.talentPanel?.buildContentInto(this._talentsBody);
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
        const designs = this._designs();
        const classes  = [...new Set(designs.map(d => d.class))];
        classes.forEach(cls => {
            body.appendChild(this._buildSection(cls, designs.filter(d => d.class === cls)));
        });

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
        const scale = this._scaleForClass(design.class ?? 'Fregatte');
        const apply = () => {
            s.player.sprite.setTexture(design.key);
            s.player.sprite.setScale(scale);
            s.playerShipDesign  = design.key;
            s.playerShipClass   = design.class ?? 'Fregatte';
            s.playerShipScale   = scale;
            s.showStatusMsg?.(`⛵ ${design.name} ausgerüstet`, 0xd4aa40);
            try { localStorage.setItem(`ahc_ship_${window._loginUsername ?? 'player'}`, JSON.stringify({ key: design.key, scale, cls: design.class })); } catch {}
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
