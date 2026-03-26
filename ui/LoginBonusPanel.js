const DAILY_REWARDS = [
    { day: 1,  icon: '🪙', label: '100 Gold',          goldR: 100 },
    { day: 2,  icon: '🧪', label: '2× Heiltrunk',      itemR: { heiltrunk: 2 } },
    { day: 3,  icon: '🍺', label: '200 Gold + Grog',   goldR: 200, itemR: { grog: 1 } },
    { day: 4,  icon: '💎', label: '5 Perlen',           gemR: 5 },
    { day: 5,  icon: '⚡', label: '300 Gold + Blitzpulver', goldR: 300, itemR: { blitzpulver: 2 } },
    { day: 6,  icon: '🛢', label: '400 Gold + Rum-Fass', goldR: 400, itemR: { rum: 1 } },
    { day: 7,  icon: '🏆', label: '500 Gold + 💎 10 Perlen', goldR: 500, gemR: 10 },
];

export default class LoginBonusPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._checkAndShow();
    }

    _storageKey() { return `ahc_login_streak_${window._loginUsername ?? 'player'}`; }

    _loadStreak() {
        try {
            const raw = localStorage.getItem(this._storageKey());
            if (!raw) return { streak: 0, lastDate: null };
            return JSON.parse(raw);
        } catch { return { streak: 0, lastDate: null }; }
    }

    _saveStreak(streak, date) {
        localStorage.setItem(this._storageKey(), JSON.stringify({ streak, lastDate: date }));
    }

    _todayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    _checkAndShow() {
        const today = this._todayStr();
        const data = this._loadStreak();
        if (data.lastDate === today) return;

        const yesterday = (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        })();

        const newStreak = (data.lastDate === yesterday) ? (data.streak % 7) + 1 : 1;
        this._saveStreak(newStreak, today);

        const reward = DAILY_REWARDS[(newStreak - 1) % DAILY_REWARDS.length];

        this.scene.time.delayedCall(2200, () => {
            this._build(newStreak, reward);
            this._grantReward(reward);
        });
    }

    _grantReward(reward) {
        const p = this.scene.player;
        if (!p) return;
        if (reward.goldR) p.gold += reward.goldR;
        if (reward.gemR)  p.gems = (p.gems ?? 0) + reward.gemR;
        if (reward.itemR) {
            Object.entries(reward.itemR).forEach(([type, cnt]) => {
                this.scene.addItem?.(type, cnt);
            });
        }
        this.scene.updateUIBars?.();
    }

    _build(streak, reward) {
        if (this._el) { this._el.remove(); }

        const el = document.createElement('div');
        el.style.cssText = `
            position:fixed;inset:0;z-index:30000;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);
            animation:fadeIn 0.4s ease;
        `;

        const days = DAILY_REWARDS.map((r, i) => {
            const dayNum = i + 1;
            const isToday = dayNum === streak;
            const isDone  = dayNum < streak;
            return `
                <div style="
                    display:flex;flex-direction:column;align-items:center;gap:4px;
                    padding:8px 6px;border-radius:10px;min-width:54px;
                    background:${isToday ? 'rgba(212,175,55,0.22)' : isDone ? 'rgba(0,180,80,0.12)' : 'rgba(255,255,255,0.04)'};
                    border:2px solid ${isToday ? '#d4af37' : isDone ? '#33cc66' : 'rgba(255,255,255,0.1)'};
                    box-shadow:${isToday ? '0 0 14px rgba(212,175,55,0.5)' : 'none'};
                ">
                    <div style="font-size:22px;filter:${isDone ? 'grayscale(0)' : !isToday ? 'grayscale(0.8) opacity(0.5)' : 'none'};">${isDone ? '✅' : r.icon}</div>
                    <div style="font-size:9px;color:${isToday ? '#ffd700' : isDone ? '#33cc66' : '#8fa8cc'};font-weight:bold;">Tag ${dayNum}</div>
                </div>
            `;
        }).join('');

        el.innerHTML = `
            <div style="
                background:linear-gradient(160deg,rgba(8,20,50,0.98),rgba(4,12,32,0.98));
                border:2px solid rgba(212,175,55,0.7);border-radius:20px;
                box-shadow:0 0 60px rgba(0,0,0,0.9),0 0 40px rgba(212,175,55,0.15);
                padding:28px 32px;max-width:520px;width:92vw;
                font-family:Arial,sans-serif;text-align:center;position:relative;
                animation:slideUp 0.4s ease;
            ">
                <div style="font-size:11px;letter-spacing:3px;color:#d4af37;text-transform:uppercase;margin-bottom:6px;">⚓ Täglich-Bonus</div>
                <div style="font-size:22px;font-weight:bold;color:#ffffff;margin-bottom:4px;">Tag ${streak} — Willkommen zurück!</div>
                <div style="font-size:13px;color:#9fdcff;margin-bottom:20px;">Deine Einlog-Serie: <span style="color:#ffd700;font-weight:bold;">${streak} Tag${streak!==1?'e':''}</span> in Folge</div>

                <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;">${days}</div>

                <div style="
                    background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.4);
                    border-radius:12px;padding:14px;margin-bottom:18px;
                ">
                    <div style="font-size:28px;margin-bottom:6px;">${reward.icon}</div>
                    <div style="font-size:14px;color:#ffd700;font-weight:bold;">Heutige Belohnung</div>
                    <div style="font-size:16px;color:#fff;margin-top:4px;">${reward.label}</div>
                </div>

                <button id="login-bonus-claim" style="
                    background:linear-gradient(180deg,#d4af37,#a07820);
                    color:#000;font-size:15px;font-weight:bold;
                    border:none;border-radius:10px;padding:12px 36px;
                    cursor:pointer;letter-spacing:1px;
                    box-shadow:0 4px 16px rgba(212,175,55,0.4);
                    transition:transform 0.1s;
                ">BELOHNUNG ABHOLEN</button>
            </div>
        `;

        document.body.appendChild(el);
        this._el = el;

        document.getElementById('login-bonus-claim').addEventListener('click', () => this.hide());

        this.scene.time.delayedCall(9000, () => { if (this._el) this.hide(); });
    }

    hide() {
        if (!this._el) return;
        this._el.style.opacity = '0';
        this._el.style.transition = 'opacity 0.4s';
        setTimeout(() => { this._el?.remove(); this._el = null; }, 420);
    }

    destroy() { this._el?.remove(); this._el = null; }
}
