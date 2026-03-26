const STORAGE_KEY = 'az_mission_progress';

export default class MissionPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this._el = null;
        this._claimedMissions = new Set(JSON.parse(localStorage.getItem('az_mission_claimed') || '[]'));
        this._progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        this._session = { kills: 0, gold: 0, upgrades: 0, damage: 0, distance: 0 };
        this._build();
        this._bindEvents();
    }

    _save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._progress));
        localStorage.setItem('az_mission_claimed', JSON.stringify([...this._claimedMissions]));
    }

    trackKill()          { this._session.kills++;        this._progress.kills = (this._progress.kills || 0) + 1;            this._save(); this._maybeRefresh(); }
    trackGold(amount)    { this._session.gold += (amount||0); this._progress.gold = (this._progress.gold||0) + (amount||0); this._save(); this._maybeRefresh(); }
    trackUpgrade()       { this._session.upgrades++;     this._progress.upgrades = (this._progress.upgrades||0) + 1;        this._save(); this._maybeRefresh(); }
    trackDamage(amount)  { this._session.damage += (amount||0); this._progress.damage = (this._progress.damage||0) + (amount||0); this._save(); this._maybeRefresh(); }
    _maybeRefresh()      { if (this.visible) this._renderMissions(); }

    _missions() {
        const p = this._progress;
        return [
            { id: 'kill5',      icon: '💀', title: 'Piraten versenken',       desc: 'Versenke 5 feindliche Schiffe',     goal: 5,    curr: p.kills||0,    reward: { gold: 300, mats: 8  }, accent: '#ff7070' },
            { id: 'kill15',     icon: '⚔️', title: 'Seeschlachten-Veteran',   desc: 'Versenke 15 feindliche Schiffe',    goal: 15,   curr: p.kills||0,    reward: { gold: 800, mats: 20 }, accent: '#ff4040' },
            { id: 'kill50',     icon: '☠️', title: 'Piraten-Schreck',         desc: 'Versenke 50 feindliche Schiffe',    goal: 50,   curr: p.kills||0,    reward: { gold: 2500, mats: 60 }, accent: '#cc2020' },
            { id: 'gold500',    icon: '💰', title: 'Gold-Sammler',            desc: 'Sammle 500 Gold ein',               goal: 500,  curr: p.gold||0,     reward: { gold: 200, mats: 5  }, accent: '#ffd36a' },
            { id: 'gold2000',   icon: '🏴‍☠️', title: 'Schatzjäger',           desc: 'Sammle 2000 Gold ein',              goal: 2000, curr: p.gold||0,     reward: { gold: 500, mats: 15 }, accent: '#ffb347' },
            { id: 'gold10000',  icon: '👑', title: 'Admiral des Reichtums',   desc: 'Sammle 10.000 Gold ein',            goal: 10000,curr: p.gold||0,     reward: { gold: 2000, mats: 50 }, accent: '#ffd700' },
            { id: 'upgrade3',   icon: '⚙️', title: 'Schiffsbauer',           desc: 'Führe 3 Upgrades durch',            goal: 3,    curr: p.upgrades||0, reward: { gold: 250, mats: 10 }, accent: '#63d6ff' },
            { id: 'upgrade10',  icon: '🔧', title: 'Meister-Ingenieur',      desc: 'Führe 10 Upgrades durch',           goal: 10,   curr: p.upgrades||0, reward: { gold: 700, mats: 25 }, accent: '#4ab8e8' },
            { id: 'damage5000', icon: '💥', title: 'Kanonen-Meister',        desc: 'Verursache 5.000 Schaden',          goal: 5000, curr: p.damage||0,   reward: { gold: 400, mats: 12 }, accent: '#c79fff' },
            { id: 'damage25000',icon: '🔥', title: 'Zerstörer der Meere',    desc: 'Verursache 25.000 Schaden',         goal: 25000,curr: p.damage||0,   reward: { gold: 1200, mats: 35 }, accent: '#ff6030' },
        ];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'mission-panel-overlay';
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
            background: linear-gradient(160deg, #0e1a10 0%, #162410 100%);
            border: 2px solid #5dde70; border-radius: 18px;
            box-shadow: 0 0 40px rgba(93,222,112,0.2), 0 8px 40px rgba(0,0,0,0.8);
            width: min(460px, 96vw);
            max-height: calc(100dvh - 80px);
            overflow-y: auto; overflow-x: hidden;
            padding: 0 0 20px 0;
            scrollbar-width: thin; scrollbar-color: #2a6030 #0e1a10;
            margin-bottom: 10px;
        `;

        panel.innerHTML = `
            <div style="
                display:flex;align-items:center;justify-content:space-between;
                padding:16px 20px 12px;
                border-bottom:1px solid rgba(93,222,112,0.25);
                position:sticky;top:0;z-index:2;
                background:linear-gradient(160deg,#0e1a10 0%,#162410 100%);
            ">
                <div>
                    <div style="font-size:19px;font-weight:bold;color:#d0ffd8;letter-spacing:1px;">⚔ Missionen</div>
                    <div id="mission-session-info" style="font-size:12px;color:#8bffba;margin-top:3px;"></div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <button id="mission-reset-btn" style="
                        background:rgba(255,100,100,0.12);border:1px solid rgba(255,100,100,0.3);
                        border-radius:8px;color:#ff9090;font-size:10px;font-weight:bold;
                        padding:5px 10px;cursor:pointer;touch-action:manipulation;
                    ">↺ Reset</button>
                    <button id="mission-close-btn" style="
                        background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);
                        border-radius:50%;color:#fff;font-size:22px;
                        width:40px;height:40px;cursor:pointer;
                        display:flex;align-items:center;justify-content:center;flex-shrink:0;
                        touch-action:manipulation;-webkit-tap-highlight-color:transparent;
                    ">×</button>
                </div>
            </div>
            <div style="padding:10px 16px 4px;">
                <div style="font-size:10px;color:#4a7a50;letter-spacing:1px;text-transform:uppercase;font-weight:bold;">
                    Tägliche Aufgaben • Fortschritt wird gespeichert
                </div>
            </div>
            <div id="mission-cards" style="padding:4px 14px 0;"></div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
    }

    _bindEvents() {
        const closeBtn = document.getElementById('mission-close-btn');
        const doClose = (e) => { e.preventDefault(); this.hide(); };
        closeBtn.addEventListener('click', doClose);
        closeBtn.addEventListener('touchend', doClose, { passive: false });

        const resetBtn = document.getElementById('mission-reset-btn');
        const doReset = (e) => {
            e.preventDefault();
            if (!confirm('Missionsfortschritt zurücksetzen?')) return;
            this._progress = {};
            this._claimedMissions.clear();
            this._session = { kills: 0, gold: 0, upgrades: 0, damage: 0 };
            this._save();
            this._renderMissions();
            this.scene.showStatusMsg('Missionsfortschritt zurückgesetzt', 0x8bffba);
        };
        resetBtn.addEventListener('click', doReset);
        resetBtn.addEventListener('touchend', doReset, { passive: false });

        this._el.addEventListener('click', (e) => { if (e.target === this._el) this.hide(); });
        this._el.addEventListener('touchend', (e) => { if (e.target === this._el) this.hide(); }, { passive: false });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });
    }

    _renderMissions() {
        const p = this.scene.player;
        const container = document.getElementById('mission-cards');
        if (!container) return;
        container.innerHTML = '';

        const sessionInfo = document.getElementById('mission-session-info');
        if (sessionInfo) {
            sessionInfo.textContent = `💀 ${this._progress.kills||0} Kills • 💰 ${this._progress.gold||0} Gold • ⚙ ${this._progress.upgrades||0} Upgrades`;
        }

        const completedCount = this._missions().filter(m => m.curr >= m.goal).length;
        const claimedCount   = this._claimedMissions.size;

        const summary = document.createElement('div');
        summary.style.cssText = `
            display:flex;gap:8px;padding:4px 0 10px;flex-wrap:wrap;
        `;
        summary.innerHTML = `
            <div style="background:rgba(93,222,112,0.1);border:1px solid #5dde7044;border-radius:8px;padding:5px 12px;font-size:11px;color:#8bffba;">
                ✓ Abgeschlossen: ${completedCount}/${this._missions().length}
            </div>
            <div style="background:rgba(255,211,106,0.1);border:1px solid #ffd36a44;border-radius:8px;padding:5px 12px;font-size:11px;color:#ffd36a;">
                🎁 Eingelöst: ${claimedCount}
            </div>
        `;
        container.appendChild(summary);

        this._missions().forEach(m => {
            const pct = Math.min(100, Math.round((Math.min(m.curr, m.goal) / m.goal) * 100));
            const done = m.curr >= m.goal;
            const claimed = this._claimedMissions.has(m.id);

            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255,255,255,0.04);
                border: 1px solid ${m.accent}44;
                border-left: 3px solid ${done ? m.accent : '#333'};
                border-radius: 10px;
                padding: 11px 14px; margin-bottom: 8px;
                opacity: ${claimed ? 0.45 : 1};
                transition: opacity 0.2s;
            `;
            card.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                    <div style="font-size:22px;flex-shrink:0;">${m.icon}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:13px;font-weight:bold;color:${m.accent};">${m.title}</div>
                        <div style="font-size:11px;color:#9fdcff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.desc}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                        ${claimed
                            ? `<div style="font-size:13px;color:#5dde70;font-weight:bold;">✓</div>`
                            : done
                            ? `<button data-claim="${m.id}" style="
                                background:${m.accent};color:#07192e;
                                border:none;border-radius:8px;
                                font-size:11px;font-weight:bold;
                                padding:7px 13px;cursor:pointer;
                                touch-action:manipulation;
                              ">Einlösen</button>`
                            : `<div style="font-size:11px;color:#777;">${Math.min(m.curr,m.goal).toLocaleString()}/${m.goal.toLocaleString()}</div>`
                        }
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.08);border-radius:4px;height:6px;overflow:hidden;">
                    <div style="width:${pct}%;height:100%;background:${m.accent};border-radius:4px;transition:width 0.4s;"></div>
                </div>
                ${done && !claimed ? `<div style="font-size:10px;color:#ffd36a;margin-top:5px;">🎁 Belohnung: 💰 ${m.reward.gold} Gold • 🔩 ${m.reward.mats} Mats</div>` : ''}
            `;

            if (done && !claimed) {
                const btn = card.querySelector('[data-claim]');
                if (btn) {
                    const doClaim = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this._claimedMissions.add(m.id);
                        if (p) { p.gold += m.reward.gold; p.materials += m.reward.mats; }
                        this._save();
                        this.scene.showStatusMsg(`Mission erfüllt! +${m.reward.gold} Gold +${m.reward.mats} Mats`, 0x5dde70);
                        this.scene.updateUIBars?.();
                        this._renderMissions();
                    };
                    btn.addEventListener('click', doClaim);
                    btn.addEventListener('touchend', doClaim, { passive: false });
                }
            }

            container.appendChild(card);
        });
    }

    show() { this._renderMissions(); this._el.style.display = 'flex'; this.visible = true; }
    hide() { this._el.style.display = 'none'; this.visible = false; }
    toggle() { if (this.visible) this.hide(); else this.show(); }
    destroy() { if (this._el?.parentNode) this._el.parentNode.removeChild(this._el); }
}
