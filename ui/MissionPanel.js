export default class MissionPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this._el = null;
        this._sessionKills = 0;
        this._sessionGoldEarned = 0;
        this._sessionUpgrades = 0;
        this._sessionDamage = 0;
        this._claimedMissions = new Set();
        this._build();
        this._bindEvents();
    }

    trackKill() { this._sessionKills++; this._maybeRefresh(); }
    trackGold(amount) { this._sessionGoldEarned += (amount || 0); this._maybeRefresh(); }
    trackUpgrade() { this._sessionUpgrades++; this._maybeRefresh(); }
    trackDamage(amount) { this._sessionDamage += (amount || 0); this._maybeRefresh(); }

    _maybeRefresh() { if (this.visible) this._renderMissions(); }

    _missions() {
        return [
            {
                id: 'kill5',
                icon: '💀',
                title: 'Piraten versenken',
                desc: 'Versenke 5 feindliche Schiffe',
                goal: 5,
                progress: Math.min(this._sessionKills, 5),
                reward: { gold: 300, mats: 8 },
                accent: '#ff7070',
            },
            {
                id: 'kill15',
                icon: '⚔️',
                title: 'Seeschlachten-Veteran',
                desc: 'Versenke 15 feindliche Schiffe',
                goal: 15,
                progress: Math.min(this._sessionKills, 15),
                reward: { gold: 800, mats: 20 },
                accent: '#ff4040',
            },
            {
                id: 'gold500',
                icon: '💰',
                title: 'Gold-Sammler',
                desc: 'Sammle 500 Gold ein',
                goal: 500,
                progress: Math.min(this._sessionGoldEarned, 500),
                reward: { gold: 200, mats: 5 },
                accent: '#ffd36a',
            },
            {
                id: 'gold2000',
                icon: '🏴‍☠️',
                title: 'Schatzjäger',
                desc: 'Sammle 2000 Gold ein',
                goal: 2000,
                progress: Math.min(this._sessionGoldEarned, 2000),
                reward: { gold: 500, mats: 15 },
                accent: '#ffb347',
            },
            {
                id: 'upgrade3',
                icon: '⚙️',
                title: 'Schiffsbauer',
                desc: 'Führe 3 Upgrades durch',
                goal: 3,
                progress: Math.min(this._sessionUpgrades, 3),
                reward: { gold: 250, mats: 10 },
                accent: '#63d6ff',
            },
            {
                id: 'damage5000',
                icon: '💥',
                title: 'Kanonen-Meister',
                desc: 'Verursache 5000 Schaden',
                goal: 5000,
                progress: Math.min(this._sessionDamage, 5000),
                reward: { gold: 400, mats: 12 },
                accent: '#c79fff',
            },
        ];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'mission-panel-overlay';
        el.style.cssText = `
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(2, 10, 20, 0.82);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            touch-action: none;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            position: relative;
            background: linear-gradient(160deg, #0e1a10 0%, #162410 100%);
            border: 2px solid #5dde70;
            border-radius: 18px;
            box-shadow: 0 0 40px rgba(93,222,112,0.2), 0 8px 40px rgba(0,0,0,0.8);
            width: min(440px, 95vw);
            max-height: 90vh;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0 0 16px 0;
            scrollbar-width: thin;
            scrollbar-color: #2a6030 #0e1a10;
        `;

        panel.innerHTML = `
            <div style="
                display:flex; align-items:center; justify-content:space-between;
                padding:16px 20px 12px;
                border-bottom:1px solid rgba(93,222,112,0.25);
                position:sticky; top:0; z-index:2;
                background:linear-gradient(160deg,#0e1a10 0%,#162410 100%);
            ">
                <div>
                    <div style="font-size:18px;font-weight:bold;color:#d0ffd8;letter-spacing:1px;">⚔ Missionen</div>
                    <div id="mission-session-info" style="font-size:12px;color:#8bffba;margin-top:3px;"></div>
                </div>
                <button id="mission-close-btn" style="
                    background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2);
                    border-radius:50%; color:#fff; font-size:20px;
                    width:36px; height:36px; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    flex-shrink:0;
                ">×</button>
            </div>
            <div style="padding:10px 16px 4px;">
                <div style="font-size:11px;color:#7ab870;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">
                    Tägliche Aufgaben • Fortschritt dieser Session
                </div>
            </div>
            <div id="mission-cards" style="padding:4px 14px 0;"></div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
    }

    _bindEvents() {
        document.getElementById('mission-close-btn').addEventListener('click', () => this.hide());
        this._el.addEventListener('click', (e) => { if (e.target === this._el) this.hide(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });
    }

    _renderMissions() {
        const p = this.scene.player;
        const container = document.getElementById('mission-cards');
        if (!container) return;
        container.innerHTML = '';

        const sessionInfo = document.getElementById('mission-session-info');
        if (sessionInfo) {
            sessionInfo.textContent = `💀 ${this._sessionKills} Kills • 💰 ${this._sessionGoldEarned} Gold • ⚙ ${this._sessionUpgrades} Upgrades`;
        }

        this._missions().forEach(m => {
            const pct = Math.min(100, Math.round((m.progress / m.goal) * 100));
            const done = m.progress >= m.goal;
            const claimed = this._claimedMissions.has(m.id);

            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255,255,255,0.04);
                border: 1px solid ${m.accent}44;
                border-left: 3px solid ${done ? m.accent : '#444'};
                border-radius: 10px;
                padding: 11px 14px;
                margin-bottom: 8px;
                opacity: ${claimed ? 0.5 : 1};
            `;

            card.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                    <div style="font-size:22px;flex-shrink:0;">${m.icon}</div>
                    <div style="flex:1;">
                        <div style="font-size:13px;font-weight:bold;color:${m.accent};">${m.title}</div>
                        <div style="font-size:11px;color:#9fdcff;">${m.desc}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                        ${claimed
                            ? `<div style="font-size:11px;color:#5dde70;font-weight:bold;">✓ Erhalten</div>`
                            : done
                            ? `<button data-claim="${m.id}" style="
                                background:${m.accent}; color:#07192e;
                                border:none; border-radius:8px;
                                font-size:11px; font-weight:bold;
                                padding:6px 12px; cursor:pointer;
                              ">Einlösen</button>`
                            : `<div style="font-size:11px;color:#777;">${m.progress}/${m.goal}</div>`
                        }
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.08);border-radius:4px;height:6px;overflow:hidden;">
                    <div style="width:${pct}%;height:100%;background:${m.accent};border-radius:4px;transition:width 0.3s;"></div>
                </div>
                ${done && !claimed ? `<div style="font-size:10px;color:#ffd36a;margin-top:4px;">Belohnung: 💰 ${m.reward.gold} Gold • 🔩 ${m.reward.mats} Mats</div>` : ''}
            `;

            if (done && !claimed) {
                const btn = card.querySelector('[data-claim]');
                if (btn) {
                    btn.addEventListener('click', () => {
                        this._claimedMissions.add(m.id);
                        if (p) { p.gold += m.reward.gold; p.materials += m.reward.mats; }
                        this.scene.showStatusMsg(`Mission erfüllt! +${m.reward.gold} Gold +${m.reward.mats} Mats`, 0x5dde70);
                        this.scene.updateUIBars?.();
                        this._renderMissions();
                    });
                }
            }

            container.appendChild(card);
        });
    }

    show() {
        this._renderMissions();
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
