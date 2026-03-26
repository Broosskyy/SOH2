export default class BonusPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this._el = null;
        this._streak = parseInt(localStorage.getItem('az_bonus_streak') || '0');
        this._lastClaim = localStorage.getItem('az_bonus_lastclaim') || null;
        this._claimedToday = false;
        this._checkStreak();
        this._build();
        this._bindEvents();
    }

    _checkStreak() {
        const today = new Date().toDateString();
        if (this._lastClaim === today) {
            this._claimedToday = true;
        } else if (this._lastClaim) {
            const diffDays = Math.floor((new Date() - new Date(this._lastClaim)) / 86400000);
            if (diffDays > 1) {
                this._streak = 0;
                localStorage.setItem('az_bonus_streak', '0');
            }
        }
    }

    _dailyRewards() {
        return [
            { day: 1, icon: '💰', label: 'Gold',      reward: { gold: 200,  mats: 0  } },
            { day: 2, icon: '🔩', label: 'Mats',      reward: { gold: 0,    mats: 15 } },
            { day: 3, icon: '💎', label: 'Bonus',      reward: { gold: 350,  mats: 8  } },
            { day: 4, icon: '⚓', label: 'Schatz',     reward: { gold: 200,  mats: 20 } },
            { day: 5, icon: '🏴‍☠️', label: 'Piraten', reward: { gold: 600,  mats: 15 } },
            { day: 6, icon: '🌊', label: 'Meer',       reward: { gold: 500,  mats: 25 } },
            { day: 7, icon: '👑', label: 'Krone',      reward: { gold: 1200, mats: 40 } },
        ];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'bonus-panel-overlay';
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
            background: linear-gradient(160deg, #1a0e20 0%, #241030 100%);
            border: 2px solid #c79fff; border-radius: 18px;
            box-shadow: 0 0 40px rgba(199,159,255,0.2), 0 8px 40px rgba(0,0,0,0.8);
            width: min(460px, 96vw);
            max-height: calc(100dvh - 80px);
            overflow-y: auto; overflow-x: hidden;
            padding: 0 0 20px 0;
            scrollbar-width: thin; scrollbar-color: #5a3080 #1a0e20;
            margin-bottom: 10px;
        `;

        panel.innerHTML = `
            <div style="
                display:flex;align-items:center;justify-content:space-between;
                padding:16px 20px 12px;
                border-bottom:1px solid rgba(199,159,255,0.25);
                position:sticky;top:0;z-index:2;
                background:linear-gradient(160deg,#1a0e20 0%,#241030 100%);
            ">
                <div>
                    <div style="font-size:19px;font-weight:bold;color:#f0e0ff;letter-spacing:1px;">◎ Tages-Bonus</div>
                    <div id="bonus-streak-info" style="font-size:12px;color:#c79fff;margin-top:3px;"></div>
                </div>
                <button id="bonus-close-btn" style="
                    background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);
                    border-radius:50%;color:#fff;font-size:22px;
                    width:40px;height:40px;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;
                    touch-action:manipulation;-webkit-tap-highlight-color:transparent;
                ">×</button>
            </div>

            <div style="padding:14px 16px 8px;">
                <div style="font-size:10px;color:#7a5a9f;letter-spacing:1px;text-transform:uppercase;font-weight:bold;margin-bottom:12px;">
                    Login-Streak Belohnungen
                </div>
                <div id="bonus-reward-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:14px;"></div>
                <div id="bonus-claim-area" style="text-align:center;margin-bottom:4px;"></div>
            </div>

            <div style="margin:0 16px 12px;padding:14px 16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(199,159,255,0.15);">
                <div style="font-size:11px;font-weight:bold;color:#c79fff;margin-bottom:10px;letter-spacing:0.5px;">⭐ SONDER-BONI</div>
                <div id="bonus-extras"></div>
            </div>

            <div style="margin:0 16px;padding:14px 16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(199,159,255,0.15);">
                <div style="font-size:11px;font-weight:bold;color:#c79fff;margin-bottom:10px;letter-spacing:0.5px;">🎯 AKTIVE BOOSTS</div>
                <div id="bonus-boosts"></div>
            </div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
    }

    _bindEvents() {
        const closeBtn = document.getElementById('bonus-close-btn');
        const doClose = (e) => { e.preventDefault(); this.hide(); };
        closeBtn.addEventListener('click', doClose);
        closeBtn.addEventListener('touchend', doClose, { passive: false });

        this._el.addEventListener('click', (e) => { if (e.target === this._el) this.hide(); });
        this._el.addEventListener('touchend', (e) => { if (e.target === this._el) this.hide(); }, { passive: false });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });
    }

    _renderAll() {
        const p = this.scene.player;

        const streakEl = document.getElementById('bonus-streak-info');
        if (streakEl) streakEl.textContent = `🔥 Streak: ${this._streak} Tage${this._claimedToday ? ' • Heute ✓' : ' • Heute noch nicht eingeloggt'}`;

        const grid = document.getElementById('bonus-reward-grid');
        if (grid) {
            grid.innerHTML = '';
            const currentDay = (this._streak % 7) || 7;
            this._dailyRewards().forEach(r => {
                const isClaimed = r.day < currentDay || (r.day === currentDay && this._claimedToday);
                const isToday   = r.day === currentDay && !this._claimedToday;
                const isFuture  = r.day > currentDay && !this._claimedToday;

                const cell = document.createElement('div');
                cell.style.cssText = `
                    background: ${isClaimed ? 'rgba(93,222,112,0.18)' : isToday ? 'rgba(199,159,255,0.22)' : 'rgba(255,255,255,0.04)'};
                    border: 2px solid ${isClaimed ? '#5dde70' : isToday ? '#c79fff' : '#2a2040'};
                    border-radius: 10px; padding: 7px 2px;
                    text-align: center; position: relative;
                    opacity: ${isFuture ? 0.45 : 1};
                    transition: transform 0.1s;
                `;
                cell.innerHTML = `
                    <div style="font-size:16px;line-height:1.2;">${r.icon}</div>
                    <div style="font-size:8px;color:#9a80bf;margin-top:3px;">Tag ${r.day}</div>
                    ${isClaimed ? `<div style="position:absolute;top:1px;right:3px;font-size:9px;color:#5dde70;">✓</div>` : ''}
                    ${isToday ? `<div style="position:absolute;top:1px;right:3px;font-size:8px;color:#c79fff;font-weight:bold;">●</div>` : ''}
                `;
                grid.appendChild(cell);
            });
        }

        const claimArea = document.getElementById('bonus-claim-area');
        if (claimArea) {
            if (this._claimedToday) {
                const nextDay = Math.min((this._streak % 7) + 1, 7);
                const nextReward = this._dailyRewards()[nextDay - 1];
                claimArea.innerHTML = `
                    <div style="background:rgba(93,222,112,0.1);border:1px solid #5dde7033;border-radius:12px;padding:12px 16px;">
                        <div style="font-size:13px;color:#5dde70;font-weight:bold;margin-bottom:4px;">✓ Heutiger Bonus eingelöst!</div>
                        <div style="font-size:11px;color:#7ab870;">Morgen: Tag ${nextDay} • ${nextReward.icon} ${nextReward.reward.gold > 0 ? nextReward.reward.gold + ' Gold' : ''} ${nextReward.reward.mats > 0 ? nextReward.reward.mats + ' Mats' : ''}</div>
                    </div>
                `;
            } else {
                const currentDay = Math.max(1, (this._streak % 7) + 1);
                const reward = this._dailyRewards()[currentDay - 1];
                claimArea.innerHTML = `
                    <div style="background:rgba(199,159,255,0.08);border:1px solid rgba(199,159,255,0.25);border-radius:12px;padding:12px 16px;margin-bottom:12px;">
                        <div style="font-size:11px;color:#c79fff;margin-bottom:10px;">
                            Tag ${currentDay} Bonus: ${reward.icon}
                            ${reward.reward.gold > 0 ? `<strong>💰 ${reward.reward.gold} Gold</strong>` : ''}
                            ${reward.reward.mats > 0 ? `<strong>🔩 ${reward.reward.mats} Mats</strong>` : ''}
                        </div>
                        <button id="bonus-claim-btn" style="
                            background: linear-gradient(135deg, #c79fff, #9040d0);
                            color: #fff; border: none; border-radius: 12px;
                            font-size: 15px; font-weight: bold;
                            padding: 13px 36px; cursor: pointer;
                            box-shadow: 0 4px 20px rgba(199,159,255,0.4);
                            touch-action: manipulation; -webkit-tap-highlight-color: transparent;
                            width: 100%;
                        ">🎁 Tages-Bonus einlösen</button>
                    </div>
                `;
                const btn = document.getElementById('bonus-claim-btn');
                if (btn) {
                    const doClaim = (e) => { e.preventDefault(); this._claimBonus(); };
                    btn.addEventListener('click', doClaim);
                    btn.addEventListener('touchend', doClaim, { passive: false });
                }
            }
        }

        const extras = document.getElementById('bonus-extras');
        if (extras) {
            const xpBonus = (p?.level ?? 0) >= 5;
            extras.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <span style="font-size:18px;">⚡</span>
                    <div style="flex:1;">
                        <div style="font-size:12px;color:#ddd;">XP-Boost (Level 5+)</div>
                        <div style="font-size:10px;color:#888;">+25% XP für diese Session</div>
                    </div>
                    <span style="font-size:11px;color:${xpBonus ? '#5dde70' : '#555'};">${xpBonus ? '✓ Aktiv' : `Lv.${p?.level||0}/5`}</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <span style="font-size:18px;">🔥</span>
                    <div style="flex:1;">
                        <div style="font-size:12px;color:#ddd;">7-Tage-Wochenbonus</div>
                        <div style="font-size:10px;color:#888;">Kompletter Streak • 1200 Gold + 40 Mats</div>
                    </div>
                    <span style="font-size:11px;color:${this._streak >= 7 ? '#ffd36a' : '#555'};">${this._streak >= 7 ? '🎉 Verdient!' : `${this._streak}/7`}</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:18px;">🌊</span>
                    <div style="flex:1;">
                        <div style="font-size:12px;color:#ddd;">Freund einladen</div>
                        <div style="font-size:10px;color:#888;">Link teilen • +500 Gold Bonus</div>
                    </div>
                    <button id="bonus-share-btn" style="
                        background:rgba(199,159,255,0.18);border:1px solid #c79fff55;
                        color:#c79fff;border-radius:7px;font-size:10px;font-weight:bold;
                        padding:5px 12px;cursor:pointer;touch-action:manipulation;
                    ">Teilen</button>
                </div>
            `;
            const shareBtn = document.getElementById('bonus-share-btn');
            if (shareBtn) {
                const doShare = (e) => {
                    e.preventDefault();
                    if (navigator.share) {
                        navigator.share({ title: 'Azure Horizon Captain', text: 'Spiel mit mir das beste Seeschlacht-Spiel!', url: location.href });
                    } else {
                        navigator.clipboard?.writeText(location.href).then(() => {
                            this.scene.showStatusMsg('Link in Zwischenablage kopiert!', 0xc79fff);
                        });
                    }
                };
                shareBtn.addEventListener('click', doShare);
                shareBtn.addEventListener('touchend', doShare, { passive: false });
            }
        }

        const boosts = document.getElementById('bonus-boosts');
        if (boosts) {
            const activeBoosts = [
                { icon: '💀', label: 'Piraten-Alarm', desc: 'Erhöhte NPC-Spawn-Rate', expires: '45 min', active: true },
                { icon: '💰', label: 'Gold-Rush',     desc: '+15% Gold von Loots',    expires: 'Inaktiv', active: false },
                { icon: '⭐', label: 'XP-Segen',      desc: '+10% EXP für Kills',     expires: 'Inaktiv', active: false },
            ];
            boosts.innerHTML = activeBoosts.map(b => `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                    <span style="font-size:16px;opacity:${b.active ? 1 : 0.4};">${b.icon}</span>
                    <div style="flex:1;opacity:${b.active ? 1 : 0.5};">
                        <div style="font-size:12px;color:#ddd;">${b.label}</div>
                        <div style="font-size:10px;color:#888;">${b.desc}</div>
                    </div>
                    <span style="font-size:10px;color:${b.active ? '#5dde70' : '#444'};font-weight:bold;">${b.expires}</span>
                </div>
            `).join('');
        }
    }

    _claimBonus() {
        const p = this.scene.player;
        const currentDay = Math.max(1, (this._streak % 7) + 1);
        const reward = this._dailyRewards()[currentDay - 1];

        if (p) { p.gold += reward.reward.gold; p.materials += reward.reward.mats; }

        this._streak++;
        this._claimedToday = true;
        this._lastClaim = new Date().toDateString();
        localStorage.setItem('az_bonus_streak', String(this._streak));
        localStorage.setItem('az_bonus_lastclaim', this._lastClaim);

        this.scene.showStatusMsg(`🎁 Tag ${currentDay} Bonus! +${reward.reward.gold} Gold +${reward.reward.mats} Mats`, 0xc79fff);
        this.scene.updateUIBars?.();
        this._renderAll();
    }

    show() { this._renderAll(); this._el.style.display = 'flex'; this.visible = true; }
    hide() { this._el.style.display = 'none'; this.visible = false; }
    toggle() { if (this.visible) this.hide(); else this.show(); }
    destroy() { if (this._el?.parentNode) this._el.parentNode.removeChild(this._el); }
}
