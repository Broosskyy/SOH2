const QUEST_POOL = [
    { id: 'kill5',     name: 'Seejäger',           desc: 'Vernichte 5 feindliche Schiffe',   type: 'npc_kills',     target: 5,   reward: '🪙 200 Gold + 2× Heiltrunk 🧪',  goldR: 200, itemR: { heiltrunk: 2 } },
    { id: 'kill12',    name: 'Piratenfluch',        desc: 'Vernichte 12 feindliche Schiffe',  type: 'npc_kills',     target: 12,  reward: '🪙 400 Gold + 1× Grog 🍺',        goldR: 400, itemR: { grog: 1 } },
    { id: 'gold500',   name: 'Goldgier',            desc: 'Sammle 500 Gold ein',               type: 'gold_collected',target: 500, reward: '🪙 150 Gold + 2× Blitzpulver ⚡', goldR: 150, itemR: { blitzpulver: 2 } },
    { id: 'gold1000',  name: 'Schatzjäger',         desc: 'Sammle 1000 Gold ein',              type: 'gold_collected',target: 1000,reward: '🪙 300 Gold + 1× Rum-Fass 🛢',    goldR: 300, itemR: { rum: 1 } },
    { id: 'mats50',    name: 'Materialmeister',     desc: 'Sammle 50 Materialien',             type: 'mats_collected',target: 50,  reward: '🪙 150 Gold + 1× Grog 🍺',        goldR: 150, itemR: { grog: 1 } },
    { id: 'monsters2', name: 'Monsterbekämpfer',    desc: 'Vernichte 2 Seemonster',            type: 'monsters',      target: 2,   reward: '🪙 300 Gold + 💎 5 Perlen',        goldR: 300, gemR: 5 },
    { id: 'monsters5', name: 'Schrecken der Meere', desc: 'Vernichte 5 Seemonster',            type: 'monsters',      target: 5,   reward: '🪙 600 Gold + 💎 10 Perlen',       goldR: 600, gemR: 10 },
    { id: 'treasure2', name: 'Schatzsucher',        desc: 'Öffne 2 Schatztruhen',             type: 'treasures',     target: 2,   reward: '🪙 250 Gold + 💎 5 Perlen',        goldR: 250, gemR: 5 },
    { id: 'items3',    name: 'Versorgungsexperte',  desc: 'Benutze 3 Items',                   type: 'items_used',    target: 3,   reward: '🪙 100 Gold + 1× Fernrohr 🔭',    goldR: 100, itemR: { fernrohr: 1 } },
    { id: 'xp300',     name: 'Erfahrungssammler',   desc: 'Sammle 300 XP ein',                 type: 'xp_gained',     target: 300, reward: '🪙 120 Gold + 💎 3 Perlen',        goldR: 120, gemR: 3 },
    { id: 'heal500',   name: 'Überlebenskünstler',  desc: 'Regeneriere 500 HP',                type: 'hp_healed',     target: 500, reward: '🪙 150 Gold + 2× Heiltrunk 🧪',  goldR: 150, itemR: { heiltrunk: 2 } },
    { id: 'npc15',     name: 'Kaperfahrt',          desc: 'Vernichte 15 Schiffe auf Seekarte 1',type:'npc_kills',    target: 15,  reward: '🪙 350 Gold + 💎 8 Perlen',        goldR: 350, gemR: 8 },
];

export { QUEST_POOL };

export default class DailyQuestPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._quests = [];
        this._progress = {};
        this._claimed = {};
        this._build();
        this._loadQuests();
    }

    _todayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }

    _loadQuests() {
        const key = `ahc_quests_${this._todayKey()}`;
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                this._quests   = data.quests   ?? [];
                this._progress = data.progress ?? {};
                this._claimed  = data.claimed  ?? {};
                return;
            } catch {}
        }
        const pool = [...QUEST_POOL].sort(() => Math.random() - 0.5);
        this._quests   = pool.slice(0, 3);
        this._progress = {};
        this._claimed  = {};
        this._save();
    }

    _save() {
        const key = `ahc_quests_${this._todayKey()}`;
        localStorage.setItem(key, JSON.stringify({
            quests: this._quests, progress: this._progress, claimed: this._claimed
        }));
    }

    addProgress(type, amount = 1) {
        let changed = false;
        this._quests.forEach(q => {
            if (q.type !== type) return;
            if (this._claimed[q.id]) return;
            const prev = this._progress[q.id] ?? 0;
            if (prev >= q.target) return;
            this._progress[q.id] = Math.min(q.target, prev + amount);
            changed = true;
            if (this._progress[q.id] >= q.target) {
                this._claimReward(q);
            }
        });
        if (changed) { this._save(); this._render(); }
    }

    _claimReward(q) {
        if (this._claimed[q.id]) return;
        this._claimed[q.id] = true;
        const p = this.scene.player;
        if (p && q.goldR) p.gold += q.goldR;
        if (p && q.gemR)  p.gems = (p.gems ?? 0) + q.gemR;
        if (p && q.itemR) {
            Object.entries(q.itemR).forEach(([type, cnt]) => {
                this.scene.addItem?.(type, cnt);
            });
        }
        this.scene.updateUIBars?.();
        this.scene.showStatusMsg?.(
            `✅ Quest: "${q.name}" abgeschlossen! ${q.reward}`,
            0xd4af37
        );
        this._save();
    }

    getActiveQuests() { return this._quests; }
    getProgress(id)   { return this._progress[id] ?? 0; }
    isClaimed(id)     { return !!this._claimed[id]; }

    _build() {
        const el = document.createElement('div');
        el.id = 'daily-quest-panel';
        el.style.cssText = `
            position:fixed;top:64px;right:10px;
            width:min(340px,96vw);z-index:12000;
            display:none;flex-direction:column;
            background:linear-gradient(180deg,rgba(8,20,44,0.97) 0%,rgba(4,12,28,0.97) 100%);
            border:2px solid rgba(212,175,55,0.5);border-radius:14px;
            box-shadow:0 6px 40px rgba(0,0,0,0.7),0 0 30px rgba(212,175,55,0.08);
            font-family:Arial,sans-serif;overflow:hidden;
        `;
        el.innerHTML = `
            <div style="background:linear-gradient(180deg,rgba(40,14,0,0.9),rgba(8,20,8,0.9));padding:12px 16px;border-bottom:1px solid rgba(212,175,55,0.4);display:flex;align-items:center;justify-content:space-between;">
                <div>
                    <div style="font-size:10px;letter-spacing:2.5px;color:#d4af37;text-transform:uppercase;">📋 Tägliche Quests</div>
                    <div id="dq-reset-label" style="font-size:10px;color:#8fd8ff;margin-top:2px;">Setzt sich täglich um Mitternacht zurück</div>
                </div>
                <button id="dq-close" style="background:none;border:none;color:#9fdcff;font-size:20px;cursor:pointer;padding:4px 6px;line-height:1;">✕</button>
            </div>
            <div id="dq-list" style="padding:10px;display:flex;flex-direction:column;gap:8px;"></div>
            <div style="padding:0 10px 10px;font-size:10px;color:#5a7a9a;text-align:center;">Neue Quests täglich verfügbar</div>
        `;
        document.body.appendChild(el);
        this._el = el;
        this._listEl = document.getElementById('dq-list');
        document.getElementById('dq-close').addEventListener('click', () => this.hide());
        this._render();
    }

    _render() {
        if (!this._listEl) return;
        this._listEl.innerHTML = '';
        this._quests.forEach(q => {
            const prog  = this._progress[q.id] ?? 0;
            const done  = prog >= q.target;
            const claimed = !!this._claimed[q.id];
            const pct   = Math.min(100, (prog / q.target) * 100);

            const card = document.createElement('div');
            card.style.cssText = `
                background:${claimed ? 'rgba(50,180,80,0.07)' : done ? 'rgba(100,200,100,0.05)' : 'rgba(255,255,255,0.03)'};
                border:1px solid ${claimed ? 'rgba(80,220,100,0.45)' : done ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.18)'};
                border-radius:9px;padding:10px 12px;
            `;
            card.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">
                    <span style="font-size:13px;font-weight:bold;color:${claimed ? '#60ff90' : done ? '#ffe066' : '#ffd36a'};">${claimed ? '✓ ' : done ? '⭐ ' : ''}${q.name}</span>
                    <span style="font-size:10px;color:#9fdcff;">${prog}/${q.target}</span>
                </div>
                <div style="font-size:11px;color:#8fd8ff;margin-bottom:7px;">${q.desc}</div>
                <div style="height:6px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden;margin-bottom:6px;">
                    <div style="height:100%;width:${pct}%;background:${claimed ? 'linear-gradient(90deg,#25d15e,#45ff85)' : 'linear-gradient(90deg,#b8860b,#ffd700)'};border-radius:3px;transition:width 0.4s;"></div>
                </div>
                <div style="font-size:10px;color:#d4af37;">🎁 ${q.reward}</div>
            `;
            this._listEl.appendChild(card);
        });
    }

    toggle() { this._el.style.display === 'none' ? this.show() : this.hide(); }
    show()   { this._render(); this._el.style.display = 'flex'; }
    hide()   { this._el.style.display = 'none'; }
    destroy(){ this._el?.remove(); }
}
