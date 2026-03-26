export default class RangPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this._el = null;
        this._build();
        this._bindEvents();
    }

    _rankTitle(level) {
        if (level >= 50) return { title: 'Admiralsflagge', icon: '👑', color: '#ffd700' };
        if (level >= 40) return { title: 'Vizeadmiral',   icon: '⭐', color: '#ffd36a' };
        if (level >= 30) return { title: 'Kommodore',     icon: '🏅', color: '#63d6ff' };
        if (level >= 20) return { title: 'Kapitän',       icon: '⚓', color: '#8bffba' };
        if (level >= 15) return { title: 'Leutnant',      icon: '🔱', color: '#c79fff' };
        if (level >= 10) return { title: 'Steuermann',    icon: '🧭', color: '#ff9a5a' };
        if (level >= 5)  return { title: 'Matrose',       icon: '⛵', color: '#9fdcff' };
        return              { title: 'Schiffsjunge',   icon: '🚢', color: '#aaa' };
    }

    _xpForNextLevel(level) {
        return Math.floor(100 * Math.pow(1.4, level));
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'rang-panel-overlay';
        el.style.cssText = `
            display:none; position:fixed; inset:0; z-index:9999;
            background:rgba(2,10,20,0.82);
            backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);
            align-items:center; justify-content:center;
            font-family:Arial,sans-serif; touch-action:none;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            position:relative;
            background:linear-gradient(160deg,#100c1a 0%,#1a1228 100%);
            border:2px solid #ffd36a;
            border-radius:18px;
            box-shadow:0 0 40px rgba(255,211,106,0.25),0 8px 40px rgba(0,0,0,0.8);
            width:min(440px,95vw);
            max-height:90vh;
            overflow-y:auto; overflow-x:hidden;
            padding:0 0 16px 0;
            scrollbar-width:thin; scrollbar-color:#806020 #100c1a;
        `;

        panel.innerHTML = `
            <div style="
                display:flex;align-items:center;justify-content:space-between;
                padding:16px 20px 12px;
                border-bottom:1px solid rgba(255,211,106,0.25);
                position:sticky;top:0;z-index:2;
                background:linear-gradient(160deg,#100c1a 0%,#1a1228 100%);
            ">
                <div>
                    <div style="font-size:18px;font-weight:bold;color:#fff8d0;letter-spacing:1px;">♛ Kapitänsrang</div>
                    <div id="rang-subtitle" style="font-size:12px;color:#ffd36a;margin-top:3px;"></div>
                </div>
                <button id="rang-close-btn" style="
                    background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);
                    border-radius:50%;color:#fff;font-size:20px;
                    width:36px;height:36px;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;
                ">×</button>
            </div>
            <div id="rang-content" style="padding:14px 16px 0;"></div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
    }

    _bindEvents() {
        document.getElementById('rang-close-btn').addEventListener('click', () => this.hide());
        this._el.addEventListener('click', (e) => { if (e.target === this._el) this.hide(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });
    }

    _renderAll() {
        const p = this.scene.player;
        if (!p) return;

        const rank = this._rankTitle(p.level);
        const xpNext = this._xpForNextLevel(p.level);
        const xpCurr = p.xp ?? 0;
        const xpPct = Math.min(100, Math.round((xpCurr / xpNext) * 100));

        const subtitle = document.getElementById('rang-subtitle');
        if (subtitle) subtitle.textContent = `${rank.icon} ${rank.title} • Level ${p.level}`;

        const content = document.getElementById('rang-content');
        if (!content) return;

        const stats = [
            { label: '💀 Schiffe versenkt',   value: p.totalKills ?? 0,                   color: '#ff7070' },
            { label: '💰 Gold verdient',       value: `${p.totalGoldEarned ?? p.gold}`,    color: '#ffd36a' },
            { label: '💥 Schaden gesamt',      value: Math.floor(p.totalDamageDone ?? 0),  color: '#ff9a5a' },
            { label: '⚙ Upgrades gekauft',    value: p.totalUpgrades ?? 0,                color: '#63d6ff' },
            { label: '🛡 Rumpf-Level',         value: `Lv.${p.hullLevel ?? 1}`,            color: '#8bffba' },
            { label: '⛵ Segel-Level',         value: `Lv.${p.sailLevel ?? 1}`,            color: '#8bffba' },
            { label: '💥 Kanonen-Level',       value: `Lv.${p.cannonLevel ?? 1}`,          color: '#ffb347' },
            { label: '🚢 Deck-Level',          value: `Lv.${p.deckLevel ?? 1}`,            color: '#6ae0d8' },
            { label: '⚡ Munitions-Level',     value: `Lv.${p.ammoTechLevel ?? 1}`,        color: '#c79fff' },
            { label: '❤️ Max HP',              value: p.maxHP ?? 0,                         color: '#7fff9a' },
            { label: '🎯 Kanonenreichweite',   value: `${p.cannonRange ?? 0}`,             color: '#9fdcff' },
            { label: '⚓ Kanonen gesamt',      value: `${p.cannonCount ?? 0}`,             color: '#ffb347' },
        ];

        const nextRank = this._rankTitle(p.level + 1);
        const levelsToNext = nextRank.title !== rank.title
            ? [5, 10, 15, 20, 30, 40, 50].find(l => l > p.level) - p.level
            : null;

        content.innerHTML = `
            <div style="
                background:rgba(255,255,255,0.05);
                border:1px solid ${rank.color}44;
                border-radius:14px;
                padding:16px;
                margin-bottom:14px;
                text-align:center;
            ">
                <div style="font-size:48px;margin-bottom:4px;">${rank.icon}</div>
                <div style="font-size:20px;font-weight:bold;color:${rank.color};">${rank.title}</div>
                <div style="font-size:13px;color:#aaa;margin-top:2px;">Level ${p.level} Kapitän</div>
                ${levelsToNext ? `<div style="font-size:11px;color:#777;margin-top:4px;">Nächster Rang in ${levelsToNext} Levels: ${nextRank.icon} ${nextRank.title}</div>` : ''}
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:#9fdcff;margin-bottom:6px;">
                    <span>EXP-Fortschritt</span>
                    <span>${xpCurr} / ${xpNext} XP</span>
                </div>
                <div style="background:rgba(255,255,255,0.08);border-radius:8px;height:12px;overflow:hidden;position:relative;">
                    <div style="width:${xpPct}%;height:100%;background:linear-gradient(90deg,${rank.color},#fff8a0);border-radius:8px;transition:width 0.4s;"></div>
                    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:rgba(255,255,255,0.7);font-weight:bold;">${xpPct}%</div>
                </div>
            </div>

            <div style="font-size:11px;color:#806020;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
                Kaptäns-Statistiken
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
                ${stats.map(s => `
                    <div style="
                        background:rgba(255,255,255,0.04);
                        border:1px solid rgba(255,255,255,0.08);
                        border-radius:8px;padding:8px 10px;
                    ">
                        <div style="font-size:10px;color:#777;margin-bottom:2px;">${s.label}</div>
                        <div style="font-size:14px;font-weight:bold;color:${s.color};">${s.value}</div>
                    </div>
                `).join('')}
            </div>

            <div style="
                background:rgba(255,211,106,0.06);
                border:1px solid rgba(255,211,106,0.2);
                border-radius:10px;padding:12px 14px;
            ">
                <div style="font-size:12px;font-weight:bold;color:#ffd36a;margin-bottom:8px;">🏆 Bestenliste (Platzhalter)</div>
                ${[
                    { name: 'Kpt. Blackwater', level: 42, kills: 387 },
                    { name: 'Rosie Corsair',   level: p.level, kills: p.totalKills ?? 0 },
                    { name: 'Iron Skull',      level: 28, kills: 211 },
                    { name: 'Sea Dragon',      level: 19, kills: 145 },
                    { name: 'Stormy Pete',     level: 14, kills: 98 },
                ].sort((a, b) => b.level - a.level).map((e, i) => `
                    <div style="
                        display:flex;align-items:center;gap:8px;padding:4px 0;
                        border-bottom:${i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none'};
                        font-weight:${e.name === 'Rosie Corsair' ? 'bold' : 'normal'};
                        color:${e.name === 'Rosie Corsair' ? '#ffd36a' : '#ccc'};
                    ">
                        <span style="font-size:14px;width:20px;text-align:center;">${['🥇','🥈','🥉','4.','5.'][i]}</span>
                        <span style="flex:1;font-size:12px;">${e.name}</span>
                        <span style="font-size:11px;color:#888;">Lv.${e.level} • ${e.kills} Kills</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    show() {
        this._renderAll();
        this._el.style.display = 'flex';
        this.visible = true;
    }

    hide() {
        this._el.style.display = 'none';
        this.visible = false;
    }

    toggle() {
        if (this.visible) this.hide(); else this.show();
    }

    destroy() {
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
    }
}
