const ACHIEVEMENTS = [
    { id: 'first_blood',   icon: '⚔',  name: 'Erster Treffer',     desc: 'Versenke dein erstes Schiff',           check: lb => (lb.npc_kills ?? 0) >= 1 },
    { id: 'killer10',      icon: '💀',  name: 'Piraten-Krieger',     desc: 'Versenke 10 feindliche Schiffe',        check: lb => (lb.npc_kills ?? 0) >= 10 },
    { id: 'killer50',      icon: '🏴‍☠️', name: 'Piraten-Legende',    desc: 'Versenke 50 feindliche Schiffe',        check: lb => (lb.npc_kills ?? 0) >= 50 },
    { id: 'killer100',     icon: '☠',  name: 'Herr der Meere',      desc: 'Versenke 100 feindliche Schiffe',       check: lb => (lb.npc_kills ?? 0) >= 100 },
    { id: 'monster1',      icon: '🐙', name: 'Monsterjäger',        desc: 'Besiege dein erstes Seemonster',        check: lb => (lb.monster_kills ?? 0) >= 1 },
    { id: 'monster10',     icon: '🦈', name: 'Tiefen-Bezwinger',    desc: 'Besiege 10 Seemonster',                 check: lb => (lb.monster_kills ?? 0) >= 10 },
    { id: 'gold1000',      icon: '🪙', name: 'Goldgier',            desc: 'Sammle insgesamt 1.000 Gold',           check: lb => (lb.gold_total ?? 0) >= 1000 },
    { id: 'gold10000',     icon: '💰', name: 'Schatzmeister',       desc: 'Sammle insgesamt 10.000 Gold',          check: lb => (lb.gold_total ?? 0) >= 10000 },
    { id: 'treasure5',     icon: '🗝', name: 'Schatztaucher',       desc: 'Öffne 5 Schatztruhen',                 check: lb => (lb.treasures_opened ?? 0) >= 5 },
    { id: 'shot100',       icon: '💣', name: 'Kanonnier',           desc: 'Feuere 100 Kanonenschüsse',             check: lb => (lb.shots_fired ?? 0) >= 100 },
    { id: 'shot500',       icon: '🔥', name: 'Artillerist',         desc: 'Feuere 500 Kanonenschüsse',             check: lb => (lb.shots_fired ?? 0) >= 500 },
    { id: 'damage10000',   icon: '💥', name: 'Flottenzerstörer',    desc: 'Verursache 10.000 Schadenspunkte',      check: lb => (lb.damage_dealt ?? 0) >= 10000 },
    { id: 'healed1000',    icon: '🧪', name: 'Überlebenskünstler',  desc: 'Regeneriere 1.000 HP insgesamt',        check: lb => (lb.hp_healed ?? 0) >= 1000 },
    { id: 'items10',       icon: '🎒', name: 'Versorger',           desc: 'Benutze 10 Items',                      check: lb => (lb.items_used ?? 0) >= 10 },
    { id: 'explorer3',     icon: '🗺', name: 'Kartograph',          desc: 'Erkunde 3 verschiedene Seekarten',      check: lb => (lb.charts_explored?.size ?? 0) >= 3 },
];

function _storageKey() { return `ahc_achievements_${window._loginUsername ?? 'player'}`; }

function _loadDone() {
    try { return new Set(JSON.parse(localStorage.getItem(_storageKey()) ?? '[]')); }
    catch { return new Set(); }
}

function _saveDone(set) {
    localStorage.setItem(_storageKey(), JSON.stringify([...set]));
}

export default class AchievementPanel {
    constructor(scene) {
        this.scene = scene;
        this._done = _loadDone();
        this._el = null;
        this._build();
    }

    check(logbook) {
        if (!logbook) return;
        let newlyUnlocked = [];
        ACHIEVEMENTS.forEach(a => {
            if (this._done.has(a.id)) return;
            if (a.check(logbook)) {
                this._done.add(a.id);
                newlyUnlocked.push(a);
            }
        });
        if (newlyUnlocked.length) {
            _saveDone(this._done);
            newlyUnlocked.forEach(a => this._showUnlockToast(a));
            if (this._el && this._el.style.display !== 'none') this._render();
        }
    }

    _showUnlockToast(a) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
            z-index:25000;background:linear-gradient(135deg,rgba(20,10,0,0.97),rgba(40,25,0,0.97));
            border:2px solid #d4af37;border-radius:14px;
            padding:12px 22px;font-family:Arial,sans-serif;
            box-shadow:0 0 40px rgba(212,175,55,0.5);
            display:flex;align-items:center;gap:12px;
            animation:slideUp 0.4s ease;
            pointer-events:none;max-width:340px;
        `;
        toast.innerHTML = `
            <div style="font-size:28px;">${a.icon}</div>
            <div>
                <div style="font-size:9px;color:#d4af37;letter-spacing:2px;text-transform:uppercase;">🏆 Erfolg freigeschaltet!</div>
                <div style="font-size:15px;font-weight:bold;color:#fff;">${a.name}</div>
                <div style="font-size:11px;color:#9fdcff;">${a.desc}</div>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.5s,transform 0.5s';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => toast.remove(), 520);
        }, 3500);
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'achievement-panel';
        el.style.cssText = `
            position:fixed;top:52px;right:10px;
            width:min(380px,96vw);z-index:12000;
            display:none;flex-direction:column;
            background:linear-gradient(180deg,rgba(8,20,44,0.97),rgba(4,12,28,0.97));
            border:2px solid rgba(212,175,55,0.5);border-radius:14px;
            box-shadow:0 6px 40px rgba(0,0,0,0.7);
            font-family:Arial,sans-serif;overflow:hidden;max-height:80vh;
        `;
        el.innerHTML = `
            <div style="background:linear-gradient(180deg,rgba(50,25,0,0.9),rgba(12,6,0,0.9));padding:12px 16px;border-bottom:1px solid rgba(212,175,55,0.4);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                <div>
                    <div style="font-size:10px;letter-spacing:2.5px;color:#d4af37;text-transform:uppercase;">🏆 Erfolge</div>
                    <div id="ach-summary" style="font-size:10px;color:#8fd8ff;margin-top:2px;"></div>
                </div>
                <button id="ach-close" style="background:none;border:none;color:#9fdcff;font-size:20px;cursor:pointer;padding:4px 6px;line-height:1;">✕</button>
            </div>
            <div id="ach-list" style="padding:10px;display:flex;flex-direction:column;gap:6px;overflow-y:auto;"></div>
        `;
        document.body.appendChild(el);
        this._el = el;
        this._listEl = document.getElementById('ach-list');
        this._summaryEl = document.getElementById('ach-summary');
        document.getElementById('ach-close').addEventListener('click', () => this.hide());
    }

    _render() {
        if (!this._listEl) return;
        const done = this._done.size;
        const total = ACHIEVEMENTS.length;
        if (this._summaryEl) this._summaryEl.textContent = `${done} / ${total} freigeschaltet`;

        this._listEl.innerHTML = '';
        ACHIEVEMENTS.forEach(a => {
            const unlocked = this._done.has(a.id);
            const row = document.createElement('div');
            row.style.cssText = `
                display:flex;align-items:center;gap:10px;
                padding:9px 12px;border-radius:9px;
                background:${unlocked ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)'};
                border:1px solid ${unlocked ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'};
                opacity:${unlocked ? '1' : '0.55'};
            `;
            row.innerHTML = `
                <div style="font-size:22px;filter:${unlocked ? 'none' : 'grayscale(1)'};flex-shrink:0;">${a.icon}</div>
                <div style="flex:1;">
                    <div style="font-size:13px;font-weight:bold;color:${unlocked ? '#ffd700' : '#8fa8cc'};">${unlocked ? '✓ ' : ''}${a.name}</div>
                    <div style="font-size:10px;color:#7ba8cc;">${a.desc}</div>
                </div>
                ${unlocked ? '<div style="font-size:18px;">🏅</div>' : '<div style="font-size:16px;color:#334;">🔒</div>'}
            `;
            this._listEl.appendChild(row);
        });
    }

    toggle() { this._el.style.display === 'none' ? this.show() : this.hide(); }
    show()   { this._render(); this._el.style.display = 'flex'; }
    hide()   { this._el.style.display = 'none'; }
    destroy(){ this._el?.remove(); }
}

export { ACHIEVEMENTS };
