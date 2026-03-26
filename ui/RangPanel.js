export default class RangPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this._el = null;
        this._tab = 'stats';
        this._build();
        this._bindEvents();
    }

    _rankTitle(level) {
        if (level >= 50) return { title: 'Admiralsflagge',  icon: '👑', color: '#ffd700', bg: 'rgba(255,215,0,0.12)' };
        if (level >= 40) return { title: 'Vizeadmiral',    icon: '⭐', color: '#ffd36a', bg: 'rgba(255,211,106,0.1)' };
        if (level >= 30) return { title: 'Kommodore',      icon: '🏅', color: '#63d6ff', bg: 'rgba(99,214,255,0.1)'  };
        if (level >= 20) return { title: 'Kapitän',        icon: '⚓', color: '#8bffba', bg: 'rgba(139,255,186,0.1)' };
        if (level >= 15) return { title: 'Leutnant',       icon: '🔱', color: '#c79fff', bg: 'rgba(199,159,255,0.1)' };
        if (level >= 10) return { title: 'Steuermann',     icon: '🧭', color: '#ff9a5a', bg: 'rgba(255,154,90,0.1)'  };
        if (level >= 5)  return { title: 'Matrose',        icon: '⛵', color: '#9fdcff', bg: 'rgba(159,220,255,0.1)' };
        return              { title: 'Schiffsjunge',    icon: '🚢', color: '#aaa',    bg: 'rgba(255,255,255,0.05)' };
    }

    _nextRankLevel(level) {
        return [5, 10, 15, 20, 30, 40, 50, 999].find(l => l > level) ?? 999;
    }

    _xpForLevel(level) { return Math.floor(100 * Math.pow(1.4, level)); }

    _achievements(p) {
        const kills = p.totalKills ?? 0;
        const gold = p.totalGoldEarned ?? p.gold ?? 0;
        const damage = p.totalDamageDone ?? 0;
        const upgrades = p.totalUpgrades ?? 0;
        return [
            { icon: '⚔️', label: 'Erster Abschuss',        done: kills >= 1,    desc: '1 Schiff versenkt' },
            { icon: '💀', label: 'Piraten-Schreck',         done: kills >= 10,   desc: '10 Schiffe versenkt' },
            { icon: '☠️', label: 'Meister der See',          done: kills >= 50,   desc: '50 Schiffe versenkt' },
            { icon: '💰', label: 'Erstes Vermögen',          done: gold >= 1000,  desc: '1.000 Gold gesammelt' },
            { icon: '👑', label: 'Goldener Kapitän',         done: gold >= 10000, desc: '10.000 Gold gesammelt' },
            { icon: '💥', label: 'Kanonen-Donner',           done: damage >= 1000,  desc: '1.000 Schaden verursacht' },
            { icon: '🔥', label: 'Zerstörer',               done: damage >= 20000, desc: '20.000 Schaden verursacht' },
            { icon: '⚙️', label: 'Handwerker',             done: upgrades >= 5,  desc: '5 Upgrades durchgeführt' },
            { icon: '🛡', label: 'Panzer-Kapitän',          done: (p.maxHP ?? 0) >= 3000, desc: '3000 max HP erreicht' },
            { icon: '🎯', label: 'Scharfschütze',           done: (p.cannonRange ?? 0) >= 500, desc: 'Reichweite 500 erreicht' },
            { icon: '🚢', label: 'Flottenkapitän',          done: (p.deckCount ?? 0) >= 3, desc: '3 Decks besessen' },
            { icon: '⭐', label: 'Aufsteiger',              done: (p.level ?? 0) >= 10, desc: 'Level 10 erreicht' },
        ];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'rang-panel-overlay';
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
            background: linear-gradient(160deg, #100c1a 0%, #1a1228 100%);
            border: 2px solid #ffd36a; border-radius: 18px;
            box-shadow: 0 0 40px rgba(255,211,106,0.25), 0 8px 40px rgba(0,0,0,0.8);
            width: min(460px, 96vw);
            max-height: calc(100dvh - 80px);
            overflow-y: auto; overflow-x: hidden;
            padding: 0 0 20px 0;
            scrollbar-width: thin; scrollbar-color: #806020 #100c1a;
            margin-bottom: 10px;
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
                    <div style="font-size:19px;font-weight:bold;color:#fff8d0;letter-spacing:1px;">♛ Kapitänsrang</div>
                    <div id="rang-subtitle" style="font-size:12px;color:#ffd36a;margin-top:3px;"></div>
                </div>
                <button id="rang-close-btn" style="
                    background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);
                    border-radius:50%;color:#fff;font-size:22px;
                    width:40px;height:40px;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;
                    touch-action:manipulation;-webkit-tap-highlight-color:transparent;
                ">×</button>
            </div>

            <div style="display:flex;gap:0;padding:10px 14px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
                <button data-tab="stats" style="
                    flex:1;padding:8px 4px;border:none;border-radius:8px 8px 0 0;
                    font-size:11px;font-weight:bold;cursor:pointer;touch-action:manipulation;
                    background:rgba(255,211,106,0.18);color:#ffd36a;border-bottom:2px solid #ffd36a;
                ">📊 Statistiken</button>
                <button data-tab="leaderboard" style="
                    flex:1;padding:8px 4px;border:none;border-radius:8px 8px 0 0;
                    font-size:11px;font-weight:bold;cursor:pointer;touch-action:manipulation;
                    background:transparent;color:#666;border-bottom:2px solid transparent;
                ">🏆 Rangliste</button>
                <button data-tab="achievements" style="
                    flex:1;padding:8px 4px;border:none;border-radius:8px 8px 0 0;
                    font-size:11px;font-weight:bold;cursor:pointer;touch-action:manipulation;
                    background:transparent;color:#666;border-bottom:2px solid transparent;
                ">🎖 Errungenschaften</button>
            </div>

            <div id="rang-content" style="padding:14px 16px 0;"></div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
        this._panel = panel;
    }

    _bindEvents() {
        const closeBtn = document.getElementById('rang-close-btn');
        const doClose = (e) => { e.preventDefault(); this.hide(); };
        closeBtn.addEventListener('click', doClose);
        closeBtn.addEventListener('touchend', doClose, { passive: false });

        this._el.addEventListener('click', (e) => { if (e.target === this._el) this.hide(); });
        this._el.addEventListener('touchend', (e) => { if (e.target === this._el) this.hide(); }, { passive: false });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });

        this._panel.querySelectorAll('[data-tab]').forEach(btn => {
            const switchTab = (e) => {
                e.preventDefault();
                this._tab = btn.dataset.tab;
                this._panel.querySelectorAll('[data-tab]').forEach(b => {
                    const active = b.dataset.tab === this._tab;
                    b.style.background = active ? 'rgba(255,211,106,0.18)' : 'transparent';
                    b.style.color = active ? '#ffd36a' : '#666';
                    b.style.borderBottom = active ? '2px solid #ffd36a' : '2px solid transparent';
                });
                this._renderContent();
            };
            btn.addEventListener('click', switchTab);
            btn.addEventListener('touchend', switchTab, { passive: false });
        });
    }

    _renderAll() {
        const p = this.scene.player;
        if (!p) return;
        const rank = this._rankTitle(p.level);
        const xpNext = this._xpForLevel(p.level);
        const xpCurr = p.xp ?? 0;
        const xpPct = Math.min(100, Math.round((xpCurr / xpNext) * 100));
        const nextRankLvl = this._nextRankLevel(p.level);
        const nextRank = this._rankTitle(nextRankLvl);

        const subtitle = document.getElementById('rang-subtitle');
        if (subtitle) subtitle.textContent = `${rank.icon} ${rank.title} • Level ${p.level}`;

        const content = document.getElementById('rang-content');
        if (!content) return;

        const header = `
            <div style="
                background:${rank.bg};border:1px solid ${rank.color}44;
                border-radius:14px;padding:16px;margin-bottom:14px;text-align:center;
            ">
                <div style="font-size:52px;margin-bottom:4px;">${rank.icon}</div>
                <div style="font-size:22px;font-weight:bold;color:${rank.color};">${rank.title}</div>
                <div style="font-size:12px;color:#aaa;margin-top:2px;">Level ${p.level} Kapitän</div>
                ${nextRankLvl < 999 ? `<div style="font-size:10px;color:#666;margin-top:4px;">Nächster Rang in ${nextRankLvl - p.level} Level: ${nextRank.icon} ${nextRank.title}</div>` : ''}
            </div>

            <div style="margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#9fdcff;margin-bottom:6px;">
                    <span>EXP-Fortschritt</span>
                    <span>${xpCurr.toLocaleString()} / ${xpNext.toLocaleString()} XP</span>
                </div>
                <div style="background:rgba(255,255,255,0.08);border-radius:8px;height:14px;overflow:hidden;position:relative;">
                    <div style="width:${xpPct}%;height:100%;background:linear-gradient(90deg,${rank.color},#fff8a0);border-radius:8px;transition:width 0.4s;"></div>
                    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:rgba(255,255,255,0.8);font-weight:bold;">${xpPct}%</div>
                </div>
            </div>
        `;

        content.innerHTML = header;
        this._renderContent();
    }

    _renderContent() {
        const p = this.scene.player;
        if (!p) return;
        const content = document.getElementById('rang-content');
        if (!content) return;

        const existing = content.querySelector('#rang-tab-content');
        if (existing) existing.remove();

        const tabEl = document.createElement('div');
        tabEl.id = 'rang-tab-content';

        if (this._tab === 'stats') {
            /* Ruf tier display */
            const rufTier = this.scene.getRufTier?.() ?? { ruf: 0, title: 'Unbekannt', color: '#aaaaaa', icon: '⚓' };
            const rufNextTiers = (this.scene.constructor?.RUF_TIERS ?? []).filter(t => t.min > rufTier.ruf);
            const rufNext = rufNextTiers[0] ?? null;
            const rufPct = rufNext ? Math.min(100, Math.round(((rufTier.ruf - rufTier.min) / (rufNext.min - rufTier.min)) * 100)) : 100;

            const rufBlock = `
                <div style="
                    background:rgba(212,175,55,0.07);border:1px solid rgba(212,175,55,0.25);
                    border-radius:12px;padding:12px 14px;margin-bottom:12px;
                ">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                        <div style="font-size:13px;font-weight:bold;color:${rufTier.color};">${rufTier.icon} ${rufTier.title}</div>
                        <div style="font-size:11px;color:#ffd36a;">${rufTier.ruf.toLocaleString('de-DE')} Ruf</div>
                    </div>
                    ${rufNext ? `
                    <div style="background:rgba(255,255,255,0.06);border-radius:6px;height:8px;overflow:hidden;">
                        <div style="width:${rufPct}%;height:100%;background:linear-gradient(90deg,${rufTier.color},#fff8a0);border-radius:6px;transition:width 0.4s;"></div>
                    </div>
                    <div style="font-size:9px;color:#888;margin-top:4px;">Nächster Rang: ${rufNext.icon} ${rufNext.title} bei ${rufNext.min.toLocaleString('de-DE')} Ruf</div>
                    ` : `<div style="font-size:9px;color:#ffd700;">Höchster Rang erreicht!</div>`}
                </div>
            `;

            const stats = [
                { label: '💀 Schiffe versenkt',  value: (p.totalKills ?? 0).toLocaleString(),              color: '#ff7070' },
                { label: '💰 Gold verdient',      value: (p.totalGoldEarned ?? p.gold ?? 0).toLocaleString(), color: '#ffd36a' },
                { label: '💥 Schaden gesamt',     value: Math.floor(p.totalDamageDone ?? 0).toLocaleString(), color: '#ff9a5a' },
                { label: '⚙ Upgrades',           value: (p.totalUpgrades ?? 0).toString(),                color: '#63d6ff' },
                { label: '🛡 Rumpf-Lv.',         value: `Lv.${p.hullLevel ?? 1}`,                         color: '#8bffba' },
                { label: '⛵ Segel-Lv.',          value: `Lv.${p.sailLevel ?? 1}`,                         color: '#8bffba' },
                { label: '💥 Kanonen-Lv.',        value: `Lv.${p.cannonLevel ?? 1}`,                       color: '#ffb347' },
                { label: '🚢 Deck-Lv.',           value: `Lv.${p.deckLevel ?? 1}`,                         color: '#6ae0d8' },
                { label: '⚡ Munitions-Lv.',      value: `Lv.${p.ammoTechLevel ?? 1}`,                     color: '#c79fff' },
                { label: '❤️ Max HP',             value: (p.maxHP ?? 0).toString(),                        color: '#7fff9a' },
                { label: '🎯 Reichweite',         value: `${p.cannonRange ?? 0}`,                          color: '#9fdcff' },
                { label: '⚓ Kanonen',            value: `${p.cannonCount ?? 0}`,                          color: '#ffb347' },
            ];
            tabEl.innerHTML = rufBlock + `
                <div style="font-size:10px;color:#806020;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;font-weight:bold;">Kaptäns-Statistiken</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    ${stats.map(s => `
                        <div style="
                            background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
                            border-radius:8px;padding:8px 10px;
                        ">
                            <div style="font-size:10px;color:#666;margin-bottom:2px;">${s.label}</div>
                            <div style="font-size:15px;font-weight:bold;color:${s.color};">${s.value}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (this._tab === 'leaderboard') {
            const board = [
                { name: 'Kpt. Blackwater', level: 42, kills: 387, icon: '🥇' },
                { name: 'Rosie Corsair',   level: p.level, kills: p.totalKills ?? 0, icon: '🥈', isPlayer: true },
                { name: 'Iron Skull',      level: 28, kills: 211, icon: '🥉' },
                { name: 'Sea Dragon',      level: 19, kills: 145, icon: '4.' },
                { name: 'Stormy Pete',     level: 14, kills: 98,  icon: '5.' },
                { name: 'Mad Mary',        level: 11, kills: 77,  icon: '6.' },
                { name: 'Blue Beard Jr.',  level: 8,  kills: 52,  icon: '7.' },
            ].sort((a, b) => b.level - a.level).map((e, i) => ({ ...e, pos: i + 1 }));

            tabEl.innerHTML = `
                <div style="font-size:10px;color:#806020;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;font-weight:bold;">Beste Kapitäne</div>
                <div style="border:1px solid rgba(255,211,106,0.15);border-radius:12px;overflow:hidden;">
                    <div style="display:grid;grid-template-columns:28px 1fr auto;gap:0;font-size:10px;color:#666;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);">
                        <span>#</span><span>Kapitän</span><span>Lv. / Kills</span>
                    </div>
                    ${board.map((e, i) => `
                        <div style="
                            display:grid;grid-template-columns:28px 1fr auto;gap:0;
                            padding:10px 12px;
                            border-bottom:${i < board.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'};
                            background:${e.isPlayer ? 'rgba(255,211,106,0.08)' : 'transparent'};
                            font-weight:${e.isPlayer ? 'bold' : 'normal'};
                        ">
                            <span style="font-size:14px;">${['🥇','🥈','🥉'][i] ?? `${i+1}.`}</span>
                            <span style="font-size:12px;color:${e.isPlayer ? '#ffd36a' : '#ccc'};">${e.name}${e.isPlayer ? ' ← Du' : ''}</span>
                            <span style="font-size:11px;color:#888;text-align:right;">Lv.${e.level} • ${e.kills}K</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (this._tab === 'achievements') {
            const achievements = this._achievements(p);
            const earned = achievements.filter(a => a.done).length;
            tabEl.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                    <div style="font-size:10px;color:#806020;letter-spacing:1px;text-transform:uppercase;font-weight:bold;">Errungenschaften</div>
                    <div style="font-size:11px;color:#ffd36a;">${earned}/${achievements.length} erzielt</div>
                </div>
                <div style="
                    background:rgba(255,211,106,0.06);border:1px solid rgba(255,211,106,0.15);
                    border-radius:8px;height:8px;overflow:hidden;margin-bottom:14px;
                ">
                    <div style="width:${Math.round(earned/achievements.length*100)}%;height:100%;background:linear-gradient(90deg,#ffd36a,#fff8a0);border-radius:8px;"></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    ${achievements.map(a => `
                        <div style="
                            background:${a.done ? 'rgba(255,211,106,0.1)' : 'rgba(255,255,255,0.03)'};
                            border:1px solid ${a.done ? 'rgba(255,211,106,0.35)' : 'rgba(255,255,255,0.07)'};
                            border-radius:10px;padding:10px;
                            opacity:${a.done ? 1 : 0.45};
                            transition:opacity 0.2s;
                        ">
                            <div style="font-size:22px;margin-bottom:4px;">${a.icon}</div>
                            <div style="font-size:11px;font-weight:bold;color:${a.done ? '#ffd36a' : '#888'};">${a.label}</div>
                            <div style="font-size:10px;color:#555;margin-top:2px;">${a.desc}</div>
                            ${a.done ? `<div style="font-size:10px;color:#5dde70;margin-top:4px;font-weight:bold;">✓ Erzielt</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        content.appendChild(tabEl);
    }

    show() { this._renderAll(); this._el.style.display = 'flex'; this.visible = true; }
    hide() { this._el.style.display = 'none'; this.visible = false; }
    toggle() { if (this.visible) this.hide(); else this.show(); }
    destroy() { if (this._el?.parentNode) this._el.parentNode.removeChild(this._el); }
}
