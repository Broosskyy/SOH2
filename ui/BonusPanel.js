export default class BonusPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this._el = null;
        this._claimedToday = false;
        this._streak = parseInt(localStorage.getItem('az_bonus_streak') || '0');
        this._lastClaim = localStorage.getItem('az_bonus_lastclaim') || null;
        this._checkStreak();
        this._build();
        this._bindEvents();
    }

    _checkStreak() {
        const today = new Date().toDateString();
        if (this._lastClaim === today) {
            this._claimedToday = true;
        } else if (this._lastClaim) {
            const last = new Date(this._lastClaim);
            const now = new Date();
            const diffDays = Math.floor((now - last) / 86400000);
            if (diffDays > 1) {
                this._streak = 0;
                localStorage.setItem('az_bonus_streak', '0');
            }
        }
    }

    _dailyRewards() {
        return [
            { day: 1, icon: '💰', label: 'Gold',    reward: { gold: 200, mats: 0 } },
            { day: 2, icon: '🔩', label: 'Mats',    reward: { gold: 0, mats: 10 } },
            { day: 3, icon: '💎', label: 'Bonus',   reward: { gold: 300, mats: 5 } },
            { day: 4, icon: '⚓', label: 'Schatz',  reward: { gold: 150, mats: 15 } },
            { day: 5, icon: '🏴‍☠️', label: 'Piraten', reward: { gold: 500, mats: 10 } },
            { day: 6, icon: '🌊', label: 'Meer',    reward: { gold: 400, mats: 20 } },
            { day: 7, icon: '👑', label: 'Krone',   reward: { gold: 1000, mats: 30 } },
        ];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'bonus-panel-overlay';
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
            background:linear-gradient(160deg,#1a0e20 0%,#241030 100%);
            border:2px solid #c79fff;
            border-radius:18px;
            box-shadow:0 0 40px rgba(199,159,255,0.2),0 8px 40px rgba(0,0,0,0.8);
            width:min(440px,95vw);
            max-height:90vh;
            overflow-y:auto; overflow-x:hidden;
            padding:0 0 16px 0;
            scrollbar-width:thin; scrollbar-color:#5a3080 #1a0e20;
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
                    <div style="font-size:18px;font-weight:bold;color:#f0e0ff;letter-spacing:1px;">◎ Tages-Bonus</div>
                    <div id="bonus-streak-info" style="font-size:12px;color:#c79fff;margin-top:3px;"></div>
                </div>
                <button id="bonus-close-btn" style="
                    background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);
                    border-radius:50%;color:#fff;font-size:20px;
                    width:36px;height:36px;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;
                ">×</button>
            </div>
            <div style="padding:14px 16px 8px;">
                <div style="font-size:11px;color:#9a7abf;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">
                    Login-Streak Belohnungen
                </div>
                <div id="bonus-reward-grid" style="
                    display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:16px;
                "></div>
                <div id="bonus-claim-area" style="text-align:center;"></div>
            </div>
            <div style="margin:0 16px;padding:14px 16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(199,159,255,0.15);">
                <div style="font-size:12px;font-weight:bold;color:#c79fff;margin-bottom:10px;">⭐ Sonder-Boni</div>
                <div id="bonus-extras"></div>
            </div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
    }

    _bindEvents() {
        document.getElementById('bonus-close-btn').addEventListener('click', () => this.hide());
        this._el.addEventListener('click', (e) => { if (e.target === this._el) this.hide(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });
    }

    _renderAll() {
        const p = this.scene.player;
        const streakEl = document.getElementById('bonus-streak-info');
        if (streakEl) {
            streakEl.textContent = `🔥 Streak: ${this._streak} Tage${this._claimedToday ? ' • Heute eingeloggt ✓' : ''}`;
        }

        const grid = document.getElementById('bonus-reward-grid');
        if (grid) {
            grid.innerHTML = '';
            const currentDay = (this._streak % 7) || 7;
            this._dailyRewards().forEach(r => {
                const isToday = r.day === currentDay;
                const isClaimed = r.day < currentDay || (r.day === currentDay && this._claimedToday);
                const isFuture = r.day > currentDay;

                const cell = document.createElement('div');
                cell.style.cssText = `
                    background: ${isClaimed ? 'rgba(93,222,112,0.15)' : isToday ? 'rgba(199,159,255,0.2)' : 'rgba(255,255,255,0.04)'};
                    border: 2px solid ${isClaimed ? '#5dde70' : isToday ? '#c79fff' : '#333'};
                    border-radius:10px; padding:8px 4px;
                    text-align:center; position:relative;
                    opacity: ${isFuture ? 0.5 : 1};
                `;
                cell.innerHTML = `
                    <div style="font-size:18px;">${r.icon}</div>
                    <div style="font-size:9px;color:#aaa;margin-top:2px;">Tag ${r.day}</div>
                    ${isClaimed ? `<div style="position:absolute;top:2px;right:4px;font-size:10px;color:#5dde70;">✓</div>` : ''}
                    ${isToday && !isClaimed ? `<div style="position:absolute;top:2px;right:4px;font-size:8px;color:#c79fff;font-weight:bold;">●</div>` : ''}
                `;
                grid.appendChild(cell);
            });
        }

        const claimArea = document.getElementById('bonus-claim-area');
        if (claimArea) {
            if (this._claimedToday) {
                claimArea.innerHTML = `
                    <div style="font-size:13px;color:#5dde70;font-weight:bold;margin-bottom:6px;">✓ Heutiger Bonus bereits eingeloggt!</div>
                    <div style="font-size:11px;color:#7ab870;">Komm morgen wieder für Tag ${Math.min((this._streak % 7) + 1, 7)}</div>
                `;
            } else {
                const currentDay = Math.max(1, (this._streak % 7) + 1);
                const reward = this._dailyRewards()[currentDay - 1];
                claimArea.innerHTML = `
                    <div style="font-size:12px;color:#c79fff;margin-bottom:8px;">
                        Heutiger Bonus: ${reward.icon} ${reward.reward.gold > 0 ? `💰 ${reward.reward.gold} Gold` : ''} ${reward.reward.mats > 0 ? `🔩 ${reward.reward.mats} Mats` : ''}
                    </div>
                    <button id="bonus-claim-btn" style="
                        background:linear-gradient(135deg,#c79fff,#a060e0);
                        color:#fff; border:none; border-radius:12px;
                        font-size:14px; font-weight:bold;
                        padding:12px 32px; cursor:pointer;
                        box-shadow:0 4px 16px rgba(199,159,255,0.4);
                    ">🎁 Tages-Bonus einlösen</button>
                `;
                const btn = document.getElementById('bonus-claim-btn');
                if (btn) {
                    btn.addEventListener('click', () => this._claimBonus());
                }
            }
        }

        const extras = document.getElementById('bonus-extras');
        if (extras) {
            const xpBonus = p?.level >= 5;
            extras.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <div style="font-size:16px;">⚡</div>
                    <div style="flex:1;">
                        <div style="font-size:12px;color:#ddd;">XP-Boost (Level 5+)</div>
                        <div style="font-size:11px;color:#999;">+25% XP für 30 Minuten</div>
                    </div>
                    <div style="font-size:11px;color:${xpBonus ? '#5dde70' : '#555'};">${xpBonus ? 'Verfügbar ✓' : `Level ${(p?.level || 0)}/5`}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <div style="font-size:16px;">🌊</div>
                    <div style="flex:1;">
                        <div style="font-size:12px;color:#ddd;">Freund werben</div>
                        <div style="font-size:11px;color:#999;">Lade einen Freund ein • +500 Gold</div>
                    </div>
                    <button style="
                        background:rgba(199,159,255,0.2);border:1px solid #c79fff;
                        color:#c79fff;border-radius:6px;font-size:10px;
                        padding:4px 10px;cursor:pointer;
                    ">Teilen</button>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="font-size:16px;">🏆</div>
                    <div style="flex:1;">
                        <div style="font-size:12px;color:#ddd;">Wochenbonus</div>
                        <div style="font-size:11px;color:#999;">7-Tage-Streak • 1000 Gold + 30 Mats</div>
                    </div>
                    <div style="font-size:11px;color:${this._streak >= 7 ? '#ffd36a' : '#555'};">${this._streak >= 7 ? '🎉 Verdient!' : `${this._streak}/7 Tage`}</div>
                </div>
            `;
        }
    }

    _claimBonus() {
        const p = this.scene.player;
        const today = new Date().toDateString();
        const currentDay = Math.max(1, (this._streak % 7) + 1);
        const reward = this._dailyRewards()[currentDay - 1];

        if (p) {
            p.gold += reward.reward.gold;
            p.materials += reward.reward.mats;
        }

        this._streak++;
        this._claimedToday = true;
        this._lastClaim = today;
        localStorage.setItem('az_bonus_streak', String(this._streak));
        localStorage.setItem('az_bonus_lastclaim', today);

        this.scene.showStatusMsg(`🎁 Tages-Bonus! +${reward.reward.gold} Gold +${reward.reward.mats} Mats`, 0xc79fff);
        this.scene.updateUIBars?.();
        this._renderAll();
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
