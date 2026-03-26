/* ════════════════════════════════════════════════════════
   HafenPanel — 4 Tabs: Taverne | Reparatur | Verträge | Navigation
   ════════════════════════════════════════════════════════ */
export default class HafenPanel {
    constructor(scene) {
        this.scene    = scene;
        this._el      = null;
        this._visible = false;
        this._tab     = 'taverne';
        this._bodies  = {};
        this._vertraegeData = null; /* cached daily contracts */
    }

    /* ── Public API ───────────────────────────────────── */
    show()   { if (!this._el) this._build(); this._el.style.display = 'flex'; this._visible = true; this._refreshActiveBody(); }
    hide()   { if (this._el) this._el.style.display = 'none'; this._visible = false; }
    toggle() { this._visible ? this.hide() : this.show(); }
    isOpen() { return this._visible; }
    destroy(){ this._el?.parentNode?.removeChild(this._el); this._el = null; }

    /* ── Build shell ──────────────────────────────────── */
    _build() {
        const el = document.createElement('div');
        el.id = 'hafen-panel';
        el.style.cssText = `
            position:fixed; inset:0; z-index:20000;
            display:flex; align-items:center; justify-content:center;
            background:rgba(0,0,0,0.75); font-family:Arial,sans-serif; padding:8px;
        `;
        const panel = document.createElement('div');
        panel.style.cssText = `
            width:100%; max-width:560px; max-height:92vh;
            background:linear-gradient(170deg,#0c1a2e 0%,#091526 100%);
            border:2px solid #4a9cc8; border-radius:8px;
            display:flex; flex-direction:column; overflow:hidden;
            box-shadow:0 0 40px rgba(74,156,200,0.25);
        `;

        /* Header */
        const header = document.createElement('div');
        header.style.cssText = `
            display:flex; align-items:center; justify-content:space-between;
            padding:12px 16px 0; flex-shrink:0;
        `;
        header.innerHTML = `
            <div style="font-size:15px;font-weight:bold;color:#9fdcff;letter-spacing:2px;">⚓ HAFEN</div>
            <button id="hafen-close" style="
                background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);
                color:#fff;font-size:18px;width:32px;height:32px;border-radius:50%;
                cursor:pointer;touch-action:manipulation;display:flex;align-items:center;
                justify-content:center;padding:0;
            ">✕</button>
        `;

        /* Tab bar */
        const tabBar = document.createElement('div');
        tabBar.style.cssText = `
            display:flex; flex-direction:row;
            border-bottom:2px solid rgba(74,156,200,0.35);
            padding:0 12px; margin-top:10px; flex-shrink:0; gap:0;
        `;
        const TABS = [
            { id: 'taverne',   label: '🍺 Taverne'   },
            { id: 'reparatur', label: '🔧 Reparatur'  },
            { id: 'vertraege', label: '📜 Verträge'   },
            { id: 'navigation',label: '🗺️ Navigation' },
        ];
        this._tabs = {};
        TABS.forEach(t => {
            const btn = this._makeTab(t.label, t.id);
            tabBar.appendChild(btn);
            this._tabs[t.id] = btn;
        });

        /* Scroll wrapper */
        const scrollWrap = document.createElement('div');
        scrollWrap.style.cssText = `flex:1; overflow:hidden; display:flex; flex-direction:column;`;

        TABS.forEach(t => {
            const body = document.createElement('div');
            body.style.cssText = `
                flex:1; overflow-y:auto; padding:14px;
                -webkit-overflow-scrolling:touch; display:none; flex-direction:column; gap:10px;
            `;
            scrollWrap.appendChild(body);
            this._bodies[t.id] = body;
        });

        panel.appendChild(header);
        panel.appendChild(tabBar);
        panel.appendChild(scrollWrap);
        el.appendChild(panel);
        el.addEventListener('click', e => { if (e.target === el) this.hide(); });
        header.querySelector('#hafen-close').addEventListener('click', () => this.hide());
        document.body.appendChild(el);
        this._el = el;

        this._switchTab(this._tab);
    }

    _makeTab(label, id) {
        const btn = document.createElement('button');
        btn.dataset.tab = id;
        btn.style.cssText = `
            padding:7px 14px; background:transparent; border:none;
            border-bottom:2px solid transparent; margin-bottom:-2px;
            font-size:11px; font-weight:bold; cursor:pointer;
            letter-spacing:0.5px; touch-action:manipulation;
            -webkit-tap-highlight-color:transparent; flex-shrink:0;
            transition:color 0.15s, border-color 0.15s;
        `;
        btn.textContent = label;
        const go = e => { e.preventDefault(); this._switchTab(id); };
        btn.addEventListener('click', go);
        btn.addEventListener('touchend', go, { passive: false });
        return btn;
    }

    _switchTab(id) {
        this._tab = id;
        Object.entries(this._tabs).forEach(([tid, btn]) => {
            const active = tid === id;
            btn.style.color       = active ? '#9fdcff' : '#5a7a8a';
            btn.style.borderColor = active ? '#9fdcff' : 'transparent';
        });
        Object.entries(this._bodies).forEach(([tid, body]) => {
            body.style.display = tid === id ? 'flex' : 'none';
        });
        this._refreshActiveBody();
    }

    _refreshActiveBody() {
        const body = this._bodies[this._tab];
        if (!body) return;
        body.innerHTML = '';
        switch (this._tab) {
            case 'taverne':    this._buildTaverne(body);    break;
            case 'reparatur':  this._buildReparatur(body);  break;
            case 'vertraege':  this._buildVertraege(body);  break;
            case 'navigation': this._buildNavigation(body); break;
        }
    }

    /* ═══ TAB: TAVERNE ═══════════════════════════════════ */
    _buildTaverne(body) {
        body.appendChild(this._sectionTitle('🍺 Taverne — Verbrauchsgüter'));
        body.appendChild(this._infoRow(`Gold: ${this.scene.player?.gold ?? 0} 🪙`));

        const WARES = [
            { key:'heiltrunk',   label:'Heiltrunk',         icon:'💊', cost:120, desc:'Stellt 80 HP sofort wieder her.' },
            { key:'grog',        label:'Grog',              icon:'🫙', cost:90,  desc:'+50% Geschwindigkeit für 20 Sek.' },
            { key:'rum',         label:'Rum-Fass',           icon:'🍾', cost:75,  desc:'+5% XP-Gewinn für 30 Sek.' },
            { key:'blitzpulver', label:'Blitzpulver',        icon:'⚡', cost:200, desc:'Nächster Schuss macht 3× Schaden.' },
            { key:'fernrohr',    label:'Fernrohr',           icon:'🔭', cost:180, desc:'+40% Sichtweite für 60 Sek.' },
            { key:'lucky_charm', label:'Glücks-Amulett',    icon:'🍀', cost:250, desc:'+15% Krit-Chance für 45 Sek.' },
            { key:'sea_chart',   label:'Seekarte (Schatz)', icon:'🗺️', cost:320, desc:'Enthüllt einen nahen Schatz.' },
            { key:'repair_kit',  label:'Notfall-Reparatur', icon:'🔧', cost:160, desc:'Stellt 120 HP wieder her.' },
        ];

        const grid = document.createElement('div');
        grid.style.cssText = `display:grid; grid-template-columns:1fr 1fr; gap:8px;`;
        WARES.forEach(w => {
            const card = this._makeWareCard(w);
            grid.appendChild(card);
        });
        body.appendChild(grid);
    }

    _makeWareCard(w) {
        const card = document.createElement('div');
        card.style.cssText = `
            background:rgba(255,255,255,0.05); border:1px solid rgba(74,156,200,0.25);
            border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:5px;
        `;
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:22px;">${w.icon}</span>
                <div>
                    <div style="font-size:11px;font-weight:bold;color:#ddd;">${w.label}</div>
                    <div style="font-size:9px;color:#778899;line-height:1.3;">${w.desc}</div>
                </div>
            </div>
        `;
        const btn = document.createElement('button');
        btn.style.cssText = `
            margin-top:2px; padding:5px 0; background:rgba(74,156,200,0.2);
            border:1px solid rgba(74,156,200,0.5); border-radius:5px;
            color:#9fdcff; font-size:11px; font-weight:bold; cursor:pointer;
            touch-action:manipulation; width:100%;
        `;
        btn.textContent = `${w.cost} 🪙 kaufen`;
        const buy = e => {
            e.preventDefault();
            const s = this.scene;
            if ((s.player?.gold ?? 0) < w.cost) {
                s.showStatusMsg?.(`Nicht genug Gold! (${w.cost} 🪙 benötigt)`, 0xff6644);
                return;
            }
            s.player.gold -= w.cost;
            /* apply via existing merchant ware system */
            this._applyWare(w.key);
            s.showStatusMsg?.(`🛒 ${w.label} gekauft!`, 0x7fffb0);
            this._refreshActiveBody();
        };
        btn.addEventListener('click', buy);
        btn.addEventListener('touchend', buy, { passive: false });
        card.appendChild(btn);
        return card;
    }

    _applyWare(key) {
        const s = this.scene;
        const p = s.player;
        if (!p) return;
        switch (key) {
            case 'heiltrunk':   p.heal(80);  s.events?.emit('heal-popup', p.x, p.y - 30, 80); break;
            case 'repair_kit':  p.heal(120); s.events?.emit('heal-popup', p.x, p.y - 30, 120); break;
            case 'grog':
                s._grogActive = true;
                p.activeEffects = p.activeEffects ?? {};
                p.activeEffects.grog = { endTime: Date.now() + 20000 };
                s._recalcPlayerSpeed?.();
                s.time.delayedCall(20000, () => { s._grogActive = false; s._recalcPlayerSpeed?.(); });
                break;
            case 'rum':
                s._rumActive = true;
                s.time.delayedCall(30000, () => { s._rumActive = false; });
                break;
            case 'blitzpulver':
                s._blitzpulverActive = true;
                p.activeEffects = p.activeEffects ?? {};
                p.activeEffects.blitzpulver = { endTime: Date.now() + 60000 };
                break;
            case 'fernrohr':
                s._fernrohrActive = true;
                s.time.delayedCall(60000, () => { s._fernrohrActive = false; });
                break;
            case 'lucky_charm':
                p.activeEffects = p.activeEffects ?? {};
                p.activeEffects.luckyCharm = { endTime: Date.now() + 45000, critBonus: 0.15 };
                break;
            case 'sea_chart':
                s._revealNearestTreasure?.() ?? s.showStatusMsg?.('Kein Schatz in der Nähe!', 0xffaa44);
                break;
        }
        s.itemBar?.update(p.inventory, p.activeEffects ?? {});
    }

    /* ═══ TAB: REPARATUR ════════════════════════════════ */
    _buildReparatur(body) {
        body.appendChild(this._sectionTitle('🔧 Schiffsreparatur'));
        const p = this.scene.player;
        if (!p) return;

        const hpCurrent = Math.ceil(p.hp ?? 0);
        const hpMax     = p.maxHP ?? 300;
        const missing   = hpMax - hpCurrent;
        const pct       = Math.round((hpCurrent / hpMax) * 100);
        const hpColor   = pct > 60 ? '#38f287' : pct > 30 ? '#ffd45c' : '#ff4444';

        /* HP bar */
        const barWrap = document.createElement('div');
        barWrap.style.cssText = `background:rgba(0,0,0,0.4);border-radius:6px;padding:12px;border:1px solid rgba(74,156,200,0.2);`;
        barWrap.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:11px;color:#9fdcff;">
                <span>Rumpf-Integrität</span>
                <span style="color:${hpColor};font-weight:bold;">${hpCurrent} / ${hpMax} HP (${pct}%)</span>
            </div>
            <div style="background:rgba(0,0,0,0.5);border-radius:4px;height:12px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:${hpColor};border-radius:4px;transition:width 0.3s;"></div>
            </div>
        `;
        body.appendChild(barWrap);

        /* Repair options */
        const REPAIRS = [
            { label: 'Notfall-Reparatur',  hp: 100,  cost: 80,  icon: '🩹' },
            { label: 'Standard-Reparatur', hp: 300,  cost: 200, icon: '🔧' },
            { label: 'Komplettüberholung', hp: missing, cost: Math.max(50, Math.round(missing * 0.8)), icon: '⚓', fullRepair: true },
        ];
        REPAIRS.forEach(r => {
            if (r.fullRepair && missing <= 0) return;
            const row = document.createElement('div');
            row.style.cssText = `
                display:flex; align-items:center; justify-content:space-between;
                background:rgba(255,255,255,0.04); border-radius:6px;
                padding:10px 12px; border:1px solid rgba(255,255,255,0.08);
            `;
            row.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:20px;">${r.icon}</span>
                    <div>
                        <div style="font-size:11px;color:#ddd;font-weight:bold;">${r.label}</div>
                        <div style="font-size:9px;color:#778899;">+${Math.min(r.hp, missing)} HP wiederhergestellt</div>
                    </div>
                </div>
            `;
            const btn = document.createElement('button');
            btn.style.cssText = `
                padding:6px 12px; background:rgba(56,242,135,0.15);
                border:1px solid rgba(56,242,135,0.4); border-radius:5px;
                color:#7fffb0; font-size:11px; font-weight:bold;
                cursor:pointer; touch-action:manipulation; white-space:nowrap;
            `;
            btn.textContent = `${r.cost} 🪙`;
            const repair = e => {
                e.preventDefault();
                const s = this.scene;
                if ((s.player?.gold ?? 0) < r.cost) { s.showStatusMsg?.('Nicht genug Gold!', 0xff6644); return; }
                s.player.gold -= r.cost;
                s.player.heal(r.hp);
                s.showStatusMsg?.(`${r.icon} ${r.label} abgeschlossen!`, 0x38f287);
                this._refreshActiveBody();
            };
            btn.addEventListener('click', repair);
            btn.addEventListener('touchend', repair, { passive: false });
            row.appendChild(btn);
            body.appendChild(row);
        });

        /* Armor plating */
        body.appendChild(this._sectionTitle('🛡️ Panzerplatten'));
        const armorLvl = this.scene.playerUpgrades?.hull ?? 0;
        const armorCosts = [300, 700, 1400, 2800, 5000];
        if (armorLvl < 5) {
            const nextCost = armorCosts[armorLvl];
            const row = this._makeUpgradeRow({
                icon: '🛡️',
                label: `Rumpfpanzerung Stufe ${armorLvl + 1}`,
                desc: `+25 max. HP dauerhaft (aktuell: Stufe ${armorLvl}/5)`,
                cost: nextCost,
                onBuy: () => this.scene._buyShipUpgrade?.('hull')
            });
            body.appendChild(row);
        } else {
            body.appendChild(this._infoRow('✅ Rumpfpanzerung voll aufgerüstet (5/5)'));
        }
    }

    /* ═══ TAB: VERTRÄGE ══════════════════════════════════ */
    _buildVertraege(body) {
        body.appendChild(this._sectionTitle('📜 Sonderverträge'));
        body.appendChild(this._infoRow('Täglich 3 neue Verträge. Große Belohnungen!'));

        if (!this._vertraegeData) this._generateVertraege();
        this._vertraegeData.forEach((v, i) => {
            body.appendChild(this._buildVertrag(v, i));
        });
    }

    _generateVertraege() {
        const today = new Date().toDateString();
        try {
            const saved = JSON.parse(localStorage.getItem('ahc_vertraege') || 'null');
            if (saved?.date === today) { this._vertraegeData = saved.contracts; return; }
        } catch {}

        const pool = [
            { type:'npc_kills',   goal: 8,  label:'Versenke 8 feindliche Schiffe',  reward:{ gold:800, xp:300  }, icon:'⚔️' },
            { type:'npc_kills',   goal: 15, label:'Versenke 15 feindliche Schiffe', reward:{ gold:1500,xp:600  }, icon:'💀' },
            { type:'gold_collected', goal:500,  label:'Sammle 500 Gold',             reward:{ gold:300, xp:200  }, icon:'🪙' },
            { type:'gold_collected', goal:2000, label:'Sammle 2000 Gold',            reward:{ gold:1000,xp:500  }, icon:'💎' },
            { type:'monsters',    goal: 3,  label:'Besiege 3 Seeungeheuer',         reward:{ gold:900, xp:450  }, icon:'🐙' },
            { type:'monsters',    goal: 6,  label:'Besiege 6 Seeungeheuer',         reward:{ gold:2000,xp:900  }, icon:'🦑' },
            { type:'charts',      goal: 2,  label:'Bereise 2 verschiedene Karten',  reward:{ gold:600, xp:350  }, icon:'🗺️' },
            { type:'shots_fired', goal: 50, label:'Feuere 50 Kanonenkugeln',        reward:{ gold:400, xp:200  }, icon:'💣' },
            { type:'shots_fired', goal:150, label:'Feuere 150 Kanonenkugeln',       reward:{ gold:1200,xp:500  }, icon:'🔥' },
        ];
        const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
        this._vertraegeData = shuffled.map(v => ({ ...v, progress: 0, done: false }));
        try { localStorage.setItem('ahc_vertraege', JSON.stringify({ date: today, contracts: this._vertraegeData })); } catch {}
    }

    _buildVertrag(v, i) {
        const pct = Math.min(100, Math.round((v.progress / v.goal) * 100));
        const done = v.done || v.progress >= v.goal;
        const card = document.createElement('div');
        card.style.cssText = `
            background:rgba(255,255,255,0.04); border-radius:8px;
            border:1px solid ${done ? 'rgba(56,242,135,0.5)' : 'rgba(74,156,200,0.2)'};
            padding:12px;
        `;
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="font-size:22px;">${v.icon}</span>
                <div style="flex:1;">
                    <div style="font-size:11px;font-weight:bold;color:${done?'#38f287':'#ccc'};">${v.label}</div>
                    <div style="font-size:9px;color:#778899;margin-top:2px;">
                        Belohnung: ${v.reward.gold} 🪙 + ${v.reward.xp} XP
                    </div>
                </div>
                ${done ? '<span style="font-size:18px;">✅</span>' : ''}
            </div>
            <div style="background:rgba(0,0,0,0.4);border-radius:3px;height:8px;overflow:hidden;margin-bottom:6px;">
                <div style="width:${pct}%;height:100%;background:${done?'#38f287':'#4a9cc8'};transition:width 0.3s;"></div>
            </div>
            <div style="font-size:9px;color:#778899;display:flex;justify-content:space-between;">
                <span>${v.progress} / ${v.goal}</span>
                <span>${pct}%</span>
            </div>
        `;
        if (done && !v.claimed) {
            const claimBtn = document.createElement('button');
            claimBtn.style.cssText = `
                margin-top:8px; width:100%; padding:7px; background:rgba(56,242,135,0.2);
                border:1px solid rgba(56,242,135,0.5); border-radius:5px;
                color:#38f287; font-size:12px; font-weight:bold; cursor:pointer; touch-action:manipulation;
            `;
            claimBtn.textContent = '🎁 Belohnung abholen';
            const claim = e => {
                e.preventDefault();
                if (v.claimed) return;
                v.claimed = true;
                const s = this.scene;
                if (s.player) {
                    s.player.gold = (s.player.gold ?? 0) + v.reward.gold;
                    s.player.addXP?.(v.reward.xp);
                }
                s.showStatusMsg?.(`📜 Vertrag erfüllt! +${v.reward.gold} 🪙 +${v.reward.xp} XP`, 0x38f287);
                try { localStorage.setItem('ahc_vertraege', JSON.stringify({ date: new Date().toDateString(), contracts: this._vertraegeData })); } catch {}
                this._refreshActiveBody();
            };
            claimBtn.addEventListener('click', claim);
            claimBtn.addEventListener('touchend', claim, { passive: false });
            card.appendChild(claimBtn);
        }
        return card;
    }

    /* External: call this to track vertrag progress */
    trackVertrag(type, amount = 1) {
        if (!this._vertraegeData) return;
        let changed = false;
        this._vertraegeData.forEach(v => {
            if (v.done || v.claimed) return;
            if (v.type === type) {
                v.progress = Math.min(v.goal, (v.progress ?? 0) + amount);
                if (v.progress >= v.goal) { v.done = true; changed = true; }
            }
        });
        if (changed) {
            try { localStorage.setItem('ahc_vertraege', JSON.stringify({ date: new Date().toDateString(), contracts: this._vertraegeData })); } catch {}
            this.scene.showStatusMsg?.('📜 Vertrag erfüllt! Hafen besuchen für Belohnung.', 0xffd36a);
        }
    }

    /* ═══ TAB: NAVIGATION ════════════════════════════════ */
    _buildNavigation(body) {
        body.appendChild(this._sectionTitle('🗺️ Seekarten-Navigation'));
        const s = this.scene;
        const cur = s.currentChartIndex ?? 1;

        const info = document.createElement('div');
        info.style.cssText = `
            background:rgba(74,156,200,0.08); border:1px solid rgba(74,156,200,0.25);
            border-radius:8px; padding:12px; margin-bottom:8px;
            font-size:11px; color:#9fdcff; line-height:1.7;
        `;
        const cfg = s.currentChartConfig;
        const stars = '★'.repeat(cfg?.stars ?? cur) + '☆'.repeat(Math.max(0,10 - (cfg?.stars ?? cur)));
        info.innerHTML = `
            <div style="font-size:13px;font-weight:bold;color:#d4aa40;margin-bottom:6px;">
                📍 Aktuell: Karte ${cur} — ${cfg?.name ?? ''}
            </div>
            <div>Schwierigkeit: <span style="color:#ffb36b;">${stars}</span></div>
            <div>Kartengröße: ${Math.round((cfg?.worldWidth??4200)/100)} × ${Math.round((cfg?.worldHeight??4200)/100)} Seeblöcke</div>
            <div>NPCs: ${cfg?.npcCount ?? '?'} · Monster: ${cfg?.monsterCount ?? '?'}</div>
        `;
        body.appendChild(info);

        body.appendChild(this._sectionTitle('Verfügbare Seekarten'));
        const charts = s.availableCharts ?? [];
        charts.forEach(chart => {
            const unlocked = s.canAccessChart?.(chart.index) ?? (chart.index <= (s.player?.level ?? 1));
            const isCurrent = chart.index === cur;
            const row = document.createElement('div');
            row.style.cssText = `
                display:flex; align-items:center; justify-content:space-between;
                padding:8px 12px; border-radius:6px; margin-bottom:4px;
                background:${isCurrent ? 'rgba(212,170,64,0.12)' : unlocked ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.2)'};
                border:1px solid ${isCurrent ? 'rgba(212,170,64,0.5)' : unlocked ? 'rgba(74,156,200,0.15)' : 'rgba(255,255,255,0.05)'};
            `;
            const starStr = '★'.repeat(chart.stars ?? chart.index) + '☆'.repeat(Math.max(0,10 - (chart.stars ?? chart.index)));
            row.innerHTML = `
                <div>
                    <span style="font-size:11px;font-weight:bold;color:${isCurrent?'#d4aa40':unlocked?'#ccc':'#555'};">
                        ${isCurrent?'📍 ':unlocked?'':'🔒 '}Karte ${chart.index}: ${chart.name}
                    </span>
                    <div style="font-size:9px;color:#778899;margin-top:1px;">${starStr}</div>
                </div>
                <div style="font-size:9px;color:#556677;">Ab Lvl ${chart.requiredLevel}</div>
            `;
            if (unlocked && !isCurrent) {
                const btn = document.createElement('button');
                btn.style.cssText = `
                    padding:4px 10px; background:rgba(74,156,200,0.15);
                    border:1px solid rgba(74,156,200,0.4); border-radius:5px;
                    color:#9fdcff; font-size:10px; font-weight:bold; cursor:pointer; touch-action:manipulation;
                `;
                btn.textContent = 'Reisen';
                const travel = e => {
                    e.preventDefault();
                    this.hide();
                    s.transitionToChart?.(chart.index, 'east');
                };
                btn.addEventListener('click', travel);
                btn.addEventListener('touchend', travel, { passive: false });
                row.appendChild(btn);
            }
            body.appendChild(row);
        });
    }

    /* ── Helpers ──────────────────────────────────────── */
    _sectionTitle(text) {
        const el = document.createElement('div');
        el.style.cssText = `
            font-size:11px; letter-spacing:2px; color:#9fdcff;
            text-transform:uppercase; padding-bottom:6px;
            border-bottom:1px solid rgba(74,156,200,0.25); margin-bottom:4px; flex-shrink:0;
        `;
        el.textContent = text;
        return el;
    }

    _infoRow(text) {
        const el = document.createElement('div');
        el.style.cssText = `font-size:10px;color:#778899;padding:4px 0;`;
        el.textContent = text;
        return el;
    }

    _makeUpgradeRow({ icon, label, desc, cost, onBuy }) {
        const row = document.createElement('div');
        row.style.cssText = `
            display:flex; align-items:center; justify-content:space-between;
            background:rgba(255,255,255,0.04); border-radius:6px;
            padding:10px 12px; border:1px solid rgba(255,255,255,0.08);
        `;
        row.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:20px;">${icon}</span>
                <div>
                    <div style="font-size:11px;color:#ddd;font-weight:bold;">${label}</div>
                    <div style="font-size:9px;color:#778899;">${desc}</div>
                </div>
            </div>
        `;
        const btn = document.createElement('button');
        btn.style.cssText = `
            padding:6px 12px; background:rgba(74,156,200,0.15);
            border:1px solid rgba(74,156,200,0.4); border-radius:5px;
            color:#9fdcff; font-size:11px; font-weight:bold;
            cursor:pointer; touch-action:manipulation; white-space:nowrap;
        `;
        btn.textContent = `${cost} 🪙`;
        const buy = e => {
            e.preventDefault();
            if ((this.scene.player?.gold ?? 0) < cost) {
                this.scene.showStatusMsg?.('Nicht genug Gold!', 0xff6644);
                return;
            }
            this.scene.player.gold -= cost;
            onBuy?.();
            this._refreshActiveBody();
        };
        btn.addEventListener('click', buy);
        btn.addEventListener('touchend', buy, { passive: false });
        row.appendChild(btn);
        return row;
    }
}
