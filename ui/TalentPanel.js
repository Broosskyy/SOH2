const TALENT_TREES = {
    navigation: {
        label: '⚓ Seefahrer', color: '#63d6ff',
        talents: [
            { id:'nav1', name:'Rückenwind',      icon:'💨', desc:'Schiff ist um 15% schneller.',           maxRank:3, costPerRank:2, effect:(p,r)=>{ p._talentSpeedBonus=(p._talentSpeedBonus??0)+0.15; } },
            { id:'nav2', name:'Flinkheit',        icon:'🔄', desc:'+10% Ausweichswahrscheinlichkeit.',     maxRank:3, costPerRank:2, effect:(p,r)=>{ p._talentDodge=(p._talentDodge??0)+0.10; } },
            { id:'nav3', name:'Navigationskarte', icon:'🗺', desc:'Sichtweite +20% erweitert.',            maxRank:2, costPerRank:3, effect:(p,r)=>{ } },
            { id:'nav4', name:'Sturmreiter',      icon:'⛈', desc:'Kein Geschwindigkeitsverlust im Sturm.',maxRank:1, costPerRank:5, requires:'nav2', effect:(p,r)=>{ p._talentStormImmune=true; } },
            { id:'nav5', name:'Traumschiff',      icon:'🚢', desc:'Max-HP +200 pro Rang.',                maxRank:3, costPerRank:3, effect:(p,r)=>{ p.maxHP=(p.maxHP??1000)+200; p.hp=Math.min(p.hp,p.maxHP); } },
        ]
    },
    combat: {
        label: '⚔ Kriegsherr', color: '#ff7070',
        talents: [
            { id:'cmb1', name:'Scharfschütze',    icon:'🎯', desc:'Kanonenreichweite +10% pro Rang.',     maxRank:4, costPerRank:2, effect:(p,r)=>{ p.cannonRange=(p.cannonRange??800)*1.10; } },
            { id:'cmb2', name:'Schwergeschütz',   icon:'💣', desc:'Kanonenschaden +15% pro Rang.',        maxRank:4, costPerRank:2, effect:(p,r)=>{ p.damagePerCannon=(p.damagePerCannon??80)*1.15; } },
            { id:'cmb3', name:'Schnellfeuer',     icon:'⚡', desc:'Nachladezeit -10% pro Rang.',           maxRank:3, costPerRank:3, effect:(p,r)=>{ p.reloadTime=(p.reloadTime??2000)*0.90; } },
            { id:'cmb4', name:'Kritischer Treffer',icon:'💥',desc:'10% Chance für doppelten Schaden.',     maxRank:3, costPerRank:4, requires:'cmb2', effect:(p,r)=>{ p._talentCritChance=(p._talentCritChance??0)+0.10; } },
            { id:'cmb5', name:'Breitseite',       icon:'⚓', desc:'Alle Kanonen feuern gleichzeitig.',    maxRank:1, costPerRank:8, requires:'cmb4', effect:(p,r)=>{ p._talentBroadside=true; } },
        ]
    },
    trade: {
        label: '🪙 Händler', color: '#ffd36a',
        talents: [
            { id:'trd1', name:'Goldnase',         icon:'💰', desc:'+20% Gold aus Beute pro Rang.',        maxRank:4, costPerRank:2, effect:(p,r)=>{ p._talentGoldBonus=(p._talentGoldBonus??1)+0.20; } },
            { id:'trd2', name:'Erfahrener Segler',icon:'⭐', desc:'+20% XP aus Kämpfen pro Rang.',        maxRank:4, costPerRank:2, effect:(p,r)=>{ p._talentXpBonus=(p._talentXpBonus??1)+0.20; } },
            { id:'trd3', name:'Materialist',      icon:'🔩', desc:'+15% Materialien aus Beute pro Rang.', maxRank:3, costPerRank:2, effect:(p,r)=>{ p._talentMatBonus=(p._talentMatBonus??1)+0.15; } },
            { id:'trd4', name:'Schatzjäger',      icon:'📦', desc:'Seltenere Schatztruhen finden.',       maxRank:2, costPerRank:4, requires:'trd1', effect:(p,r)=>{ p._talentTreasure=true; } },
            { id:'trd5', name:'Edelstein-Sammler',icon:'💎', desc:'+1 Gem pro Event-Sieg.',               maxRank:3, costPerRank:5, requires:'trd4', effect:(p,r)=>{ p._talentGemBonus=(p._talentGemBonus??0)+1; } },
        ]
    }
};

export default class TalentPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._visible = false;
        this._talents = this._loadTalents();
        this._skillPoints = this._loadSP();
    }

    _loadTalents() {
        try { return JSON.parse(localStorage.getItem('ahc_talents') || '{}'); } catch { return {}; }
    }
    _saveTalents() {
        try { localStorage.setItem('ahc_talents', JSON.stringify(this._talents)); } catch {}
    }
    _loadSP() {
        try { return parseInt(localStorage.getItem('ahc_skill_points') || '5'); } catch { return 5; }
    }
    _saveSP() {
        try { localStorage.setItem('ahc_skill_points', String(this._skillPoints)); } catch {}
    }

    _getRank(talentId) { return this._talents[talentId] ?? 0; }

    _canUnlock(talent) {
        if (talent.requires && !this._getRank(talent.requires)) return false;
        return this._skillPoints >= talent.costPerRank && this._getRank(talent.id) < talent.maxRank;
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'talent-panel';
        el.style.cssText = `
            position:fixed; inset:0; z-index:22000;
            display:flex; align-items:center; justify-content:center;
            background:rgba(0,0,0,0.82); font-family:Arial,sans-serif; padding:8px;
        `;
        const panel = document.createElement('div');
        panel.style.cssText = `
            width:100%; max-width:580px; max-height:92vh;
            background:linear-gradient(170deg,#06101a 0%,#030c14 100%);
            border:2px solid #d4aa40; border-radius:8px;
            display:flex; flex-direction:column; overflow:hidden;
            box-shadow:0 0 60px rgba(212,170,64,0.25);
        `;

        panel.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(212,170,64,0.3);flex-shrink:0;">
                <div>
                    <div style="font-size:15px;font-weight:bold;color:#d4aa40;letter-spacing:2px;">🌟 TALENTE & FÄHIGKEITEN</div>
                    <div id="tp-sp" style="font-size:11px;color:#888;margin-top:2px;">Verfügbare Skillpunkte: <span style="color:#d4aa40;font-weight:bold;">${this._skillPoints}</span></div>
                </div>
                <button id="tp-close" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:18px;width:32px;height:32px;border-radius:50%;cursor:pointer;padding:0;touch-action:manipulation;">✕</button>
            </div>
            <div style="flex:1;overflow-y:auto;padding:12px;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:12px;">
                <div style="font-size:11px;color:#666;text-align:center;margin-bottom:4px;">Skillpunkte erhältst du durch Level-Ups (+1 pro Level). Aktivierte Talente wirken dauerhaft.</div>
                ${Object.entries(TALENT_TREES).map(([key, tree]) => this._renderTree(key, tree)).join('')}
                <div style="display:flex;gap:8px;justify-content:center;margin-top:4px;">
                    <button id="tp-add-sp" style="padding:7px 16px;background:rgba(212,170,64,0.1);border:1px solid #d4aa40;color:#d4aa40;border-radius:6px;cursor:pointer;font-size:12px;touch-action:manipulation;">+5 SP (Test)</button>
                    <button id="tp-reset" style="padding:7px 16px;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.5);color:#ff8888;border-radius:6px;cursor:pointer;font-size:12px;touch-action:manipulation;">↺ Alle zurücksetzen</button>
                </div>
            </div>
        `;

        el.appendChild(panel);
        el.addEventListener('click', (e) => { if (e.target === el) this.hide(); });
        document.body.appendChild(el);
        this._el = el;

        setTimeout(() => {
            el.querySelector('#tp-close')?.addEventListener('click', () => this.hide());
            el.querySelector('#tp-add-sp')?.addEventListener('click', () => {
                this._skillPoints += 5; this._saveSP();
                this.hide(); this.show();
            });
            el.querySelector('#tp-reset')?.addEventListener('click', () => {
                if (!confirm('Alle Talente zurücksetzen?')) return;
                const total = Object.entries(this._talents).reduce((s,[id,r])=>s+r*this._getCost(id),0);
                this._skillPoints += total;
                this._talents = {};
                this._saveTalents(); this._saveSP();
                this.hide(); this.show();
            });
            el.querySelectorAll('[data-talent]').forEach(btn => {
                const activate = (e) => { e.preventDefault(); this._buyTalent(btn.dataset.talent); };
                btn.addEventListener('click', activate);
                btn.addEventListener('touchend', activate, { passive: false });
            });
        }, 0);
    }

    _getCost(talentId) {
        for (const tree of Object.values(TALENT_TREES)) {
            const t = tree.talents.find(t => t.id === talentId);
            if (t) return t.costPerRank;
        }
        return 2;
    }

    _renderTree(key, tree) {
        return `
        <div style="background:rgba(255,255,255,0.03);border:1px solid ${tree.color}33;border-radius:8px;padding:12px;">
            <div style="font-size:12px;font-weight:bold;color:${tree.color};letter-spacing:1px;margin-bottom:10px;">${tree.label}</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${tree.talents.map(t => this._renderTalent(t, tree.color)).join('')}
            </div>
        </div>`;
    }

    _renderTalent(t, treeColor) {
        const rank = this._getRank(t.id);
        const canBuy = this._canUnlock(t);
        const locked = t.requires && !this._getRank(t.requires);
        const maxed = rank >= t.maxRank;
        const dots = Array.from({length: t.maxRank}, (_,i) => `
            <div style="width:10px;height:10px;border-radius:50%;background:${i<rank?treeColor:'rgba(255,255,255,0.15)'};border:1px solid ${treeColor}66;"></div>
        `).join('');
        return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:6px;background:${rank>0?'rgba(255,255,255,0.04)':'transparent'};">
            <div style="font-size:22px;min-width:28px;text-align:center;opacity:${locked?0.3:1};">${t.icon}</div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:12px;color:${locked?'#444':rank>0?treeColor:'#ddd'};font-weight:${rank>0?'bold':'normal'};">${t.name} ${t.requires?`<span style="font-size:9px;color:#555;">(req: ${t.requires})</span>`:''}</div>
                <div style="font-size:10px;color:#666;margin-top:1px;">${t.desc}</div>
                <div style="display:flex;gap:3px;margin-top:4px;">${dots}</div>
            </div>
            <div style="text-align:center;min-width:56px;">
                <button data-talent="${t.id}" style="
                    padding:5px 10px; border-radius:5px; cursor:${canBuy?'pointer':'default'};
                    background:${maxed?'rgba(0,200,80,0.12)':canBuy?`rgba(${this._hex2rgb(treeColor)},0.1)`:'rgba(255,255,255,0.04)'};
                    border:1px solid ${maxed?'#00c850':canBuy?treeColor:'rgba(255,255,255,0.1)'};
                    color:${maxed?'#44ff88':canBuy?treeColor:'#444'};
                    font-size:10px; font-family:Arial; touch-action:manipulation;
                    pointer-events:${canBuy?'auto':'none'};
                ">${maxed?'✓ MAX':locked?'🔒':canBuy?`-${t.costPerRank} SP`:`${t.costPerRank} SP`}</button>
            </div>
        </div>`;
    }

    _hex2rgb(hex) {
        const h = hex.replace('#','');
        return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
    }

    _buyTalent(talentId) {
        let talent = null;
        for (const tree of Object.values(TALENT_TREES)) {
            talent = tree.talents.find(t => t.id === talentId);
            if (talent) break;
        }
        if (!talent || !this._canUnlock(talent)) return;
        this._skillPoints -= talent.costPerRank;
        this._talents[talentId] = (this._talents[talentId] ?? 0) + 1;
        this._saveTalents(); this._saveSP();

        const p = this.scene?.player;
        if (p) try { talent.effect(p, this._talents[talentId]); } catch {}
        this.scene?.showStatusMsg?.(`✨ ${talent.name} Rang ${this._talents[talentId]}`, 0xd4aa40);
        this.hide(); this.show();
    }

    /* Renders talent UI into any container element (used by ShipDesignPanel tab) */
    buildContentInto(container) {
        if (!container) return;
        container.innerHTML = '';
        container.style.gap = '10px';

        /* SP header */
        const spRow = document.createElement('div');
        spRow.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:6px 4px 2px;border-bottom:1px solid rgba(212,170,64,0.2);margin-bottom:4px;`;
        spRow.innerHTML = `
            <span style="font-size:11px;color:#888;">Verfügbare Skillpunkte:
                <span id="sdp-sp-val" style="color:#d4aa40;font-weight:bold;">${this._skillPoints}</span>
            </span>
            <span style="font-size:10px;color:#555;">+1 pro Level-Up</span>
        `;
        container.appendChild(spRow);

        /* Trees */
        Object.entries(TALENT_TREES).forEach(([key, tree]) => {
            const treeEl = document.createElement('div');
            treeEl.style.cssText = `background:rgba(255,255,255,0.03);border:1px solid ${tree.color}33;border-radius:8px;padding:10px;`;
            treeEl.innerHTML = `
                <div style="font-size:12px;font-weight:bold;color:${tree.color};letter-spacing:1px;margin-bottom:8px;">${tree.label}</div>
            `;
            tree.talents.forEach(t => {
                const rank    = this._getRank(t.id);
                const canBuy  = this._canUnlock(t);
                const locked  = t.requires && !this._getRank(t.requires);
                const maxed   = rank >= t.maxRank;
                const row = document.createElement('div');
                row.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px;border-radius:6px;background:${rank>0?'rgba(255,255,255,0.04)':'transparent'};margin-bottom:4px;`;
                const dots = Array.from({length: t.maxRank}, (_,i) =>
                    `<div style="width:9px;height:9px;border-radius:50%;background:${i<rank?tree.color:'rgba(255,255,255,0.15)'};border:1px solid ${tree.color}55;"></div>`
                ).join('');
                row.innerHTML = `
                    <div style="font-size:20px;min-width:26px;text-align:center;opacity:${locked?0.3:1};">${t.icon}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:11px;color:${locked?'#444':rank>0?tree.color:'#ddd'};font-weight:${rank>0?'bold':'normal'};">${t.name}</div>
                        <div style="font-size:9px;color:#666;margin-top:1px;">${t.desc}</div>
                        <div style="display:flex;gap:2px;margin-top:3px;">${dots}</div>
                    </div>
                    <button data-talent="${t.id}" style="
                        padding:5px 9px;border-radius:5px;min-width:52px;
                        cursor:${canBuy?'pointer':'default'};
                        background:${maxed?'rgba(0,200,80,0.12)':canBuy?`rgba(99,214,255,0.1)`:'rgba(255,255,255,0.04)'};
                        border:1px solid ${maxed?'#00c850':canBuy?tree.color:'rgba(255,255,255,0.1)'};
                        color:${maxed?'#44ff88':canBuy?tree.color:'#444'};
                        font-size:10px;font-family:Arial;touch-action:manipulation;
                        pointer-events:${canBuy?'auto':'none'};
                    ">${maxed?'✓ MAX':locked?'🔒':canBuy?`-${t.costPerRank} SP`:`${t.costPerRank} SP`}</button>
                `;
                treeEl.appendChild(row);
            });
            container.appendChild(treeEl);
        });

        /* Buttons row */
        const btnRow = document.createElement('div');
        btnRow.style.cssText = `display:flex;gap:8px;justify-content:center;margin-top:4px;flex-wrap:wrap;`;
        btnRow.innerHTML = `
            <button id="sdp-tp-add" style="padding:6px 14px;background:rgba(212,170,64,0.1);border:1px solid #d4aa40;color:#d4aa40;border-radius:6px;cursor:pointer;font-size:11px;touch-action:manipulation;">+5 SP (Test)</button>
            <button id="sdp-tp-reset" style="padding:6px 14px;background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.5);color:#ff8888;border-radius:6px;cursor:pointer;font-size:11px;touch-action:manipulation;">↺ Zurücksetzen</button>
        `;
        container.appendChild(btnRow);

        /* Bind events */
        container.querySelectorAll('[data-talent]').forEach(btn => {
            const activate = (e) => { e.preventDefault(); this._buyTalentAndRefresh(btn.dataset.talent, container); };
            btn.addEventListener('click', activate);
            btn.addEventListener('touchend', activate, { passive: false });
        });
        container.querySelector('#sdp-tp-add')?.addEventListener('click', () => {
            this._skillPoints += 5; this._saveSP();
            this.buildContentInto(container);
        });
        container.querySelector('#sdp-tp-reset')?.addEventListener('click', () => {
            if (!confirm('Alle Talente zurücksetzen?')) return;
            const total = Object.entries(this._talents).reduce((s,[id,r])=>s+r*this._getCost(id),0);
            this._skillPoints += total; this._talents = {};
            this._saveTalents(); this._saveSP();
            this.buildContentInto(container);
        });
    }

    _buyTalentAndRefresh(talentId, container) {
        let talent = null;
        for (const tree of Object.values(TALENT_TREES)) {
            talent = tree.talents.find(t => t.id === talentId);
            if (talent) break;
        }
        if (!talent || !this._canUnlock(talent)) return;
        this._skillPoints -= talent.costPerRank;
        this._talents[talentId] = (this._talents[talentId] ?? 0) + 1;
        this._saveTalents(); this._saveSP();
        const p = this.scene?.player;
        if (p) try { talent.effect(p, this._talents[talentId]); } catch {}
        this.scene?.showStatusMsg?.(`✨ ${talent.name} Rang ${this._talents[talentId]}`, 0xd4aa40);
        this.buildContentInto(container);
    }

    applyAllToPlayer() {
        const p = this.scene?.player;
        if (!p) return;
        Object.entries(this._talents).forEach(([talentId, rank]) => {
            for (let r = 0; r < rank; r++) {
                for (const tree of Object.values(TALENT_TREES)) {
                    const t = tree.talents.find(t => t.id === talentId);
                    if (t) try { t.effect(p, r + 1); } catch {}
                }
            }
        });
    }

    addSkillPoint(n = 1) {
        this._skillPoints += n;
        this._saveSP();
    }

    show() {
        if (this._el) { this._el.remove(); this._el = null; }
        this._build();
        this._visible = true;
    }
    hide() {
        if (this._el) this._el.style.display = 'none';
        this._visible = false;
    }
    toggle() { if (this._visible) this.hide(); else this.show(); }
    isOpen() { return this._visible; }
    destroy() { this._el?.parentNode?.removeChild(this._el); this._el = null; }
}
