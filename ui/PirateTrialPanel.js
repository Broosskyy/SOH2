export const PIRATE_TRIALS = [
    { level: 5,  name: 'Prüfung des Anfängers',  type: 'npc_kills',      target: 3,  desc: 'Vernichte 3 feindliche Schiffe',        rewardText: '🪙 300 Gold • 🛢 1× Rum-Fass • +1 Skill-Punkt',  goldReward: 300, gemReward: 0, skillReward: 1, itemReward: { rum: 1 } },
    { level: 10, name: 'Prüfung des Seemanns',   type: 'gold_collected',  target: 500,desc: 'Sammle 500 Gold ein',                    rewardText: '🪙 500 Gold • 🍺 2× Grog • +1 Skill-Punkt',       goldReward: 500, gemReward: 0, skillReward: 1, itemReward: { grog: 2 } },
    { level: 15, name: 'Prüfung des Korsaren',   type: 'npc_kills',      target: 8,  desc: 'Vernichte 8 feindliche Schiffe',        rewardText: '🪙 800 Gold • ⚡ 3× Blitzpulver • +2 Skill-Punkte', goldReward: 800, gemReward: 0, skillReward: 2, itemReward: { blitzpulver: 3 } },
    { level: 20, name: 'Prüfung des Piraten',    type: 'mats_collected',  target: 100,desc: 'Sammle 100 Materialien',                 rewardText: '🪙 1000 Gold • 🔭 2× Fernrohr • +2 Skill-Punkte', goldReward: 1000,gemReward: 5, skillReward: 2, itemReward: { fernrohr: 2 } },
    { level: 25, name: 'Prüfung des Freibeuters',type: 'monsters',        target: 5,  desc: 'Vernichte 5 Seemonster',               rewardText: '🪙 1500 Gold • 💎 10 Perlen • +3 Skill-Punkte',   goldReward: 1500,gemReward: 10,skillReward: 3, itemReward: { rum: 2 } },
    { level: 30, name: 'Prüfung des Kapitäns',   type: 'npc_kills',      target: 20, desc: 'Vernichte 20 feindliche Schiffe',       rewardText: '🪙 2500 Gold • 💎 20 Perlen • +5 Skill-Punkte',   goldReward: 2500,gemReward: 20,skillReward: 5, itemReward: { blitzpulver: 5, rum: 2 } },
    { level: 40, name: 'Prüfung des Admirals',   type: 'monsters',        target: 15, desc: 'Vernichte 15 mächtige Seemonster',     rewardText: '🪙 5000 Gold • 💎 50 Perlen • +10 Skill-Punkte',  goldReward: 5000,gemReward: 50,skillReward: 10,itemReward: { heiltrunk: 5, fernrohr: 3 } },
];

export default class PirateTrialPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._activeTrial = null;
        this._build();
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'pirate-trial-overlay';
        el.style.cssText = `
            position:fixed;inset:0;z-index:30000;
            display:none;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.78);backdrop-filter:blur(3px);
            font-family:Arial,sans-serif;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            width:min(480px,94vw);
            background:linear-gradient(180deg,#0c1f3d 0%,#06121f 100%);
            border:3px solid #d4af37;border-radius:18px;
            box-shadow:0 0 60px rgba(212,175,55,0.35),0 0 120px rgba(0,0,0,0.9);
            overflow:hidden;position:relative;
        `;

        box.innerHTML = `
            <div style="background:linear-gradient(180deg,rgba(40,12,0,0.95),rgba(10,24,0,0.95));padding:22px 28px 16px;border-bottom:2px solid #d4af37;text-align:center;position:relative;">
                <div style="font-size:42px;margin-bottom:2px;filter:drop-shadow(0 0 12px #d4af37);">⚔️</div>
                <div style="font-size:10px;letter-spacing:4px;color:#d4af37;text-transform:uppercase;margin-bottom:4px;">Piratenprüfung</div>
                <div id="pt-level-badge" style="font-size:24px;font-weight:bold;color:#fff;text-shadow:0 0 16px #d4af3766;"></div>
                <div id="pt-subtitle" style="font-size:11px;color:#9fdcff;margin-top:4px;letter-spacing:1px;"></div>
            </div>
            <div style="padding:20px 24px 8px;">
                <div id="pt-name" style="font-size:20px;font-weight:bold;color:#ffd36a;text-align:center;margin-bottom:10px;"></div>
                <div id="pt-desc" style="font-size:14px;color:#c8e8ff;text-align:center;margin-bottom:18px;line-height:1.6;padding:0 8px;"></div>

                <div style="margin-bottom:14px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:#9fdcff;margin-bottom:5px;">
                        <span>Fortschritt</span>
                        <span id="pt-prog-text">0 / —</span>
                    </div>
                    <div style="height:12px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden;border:1px solid rgba(212,175,55,0.25);">
                        <div id="pt-prog-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#b8860b,#ffd700,#fffacd);border-radius:6px;transition:width 0.5s;box-shadow:0 0 8px #d4af3780;"></div>
                    </div>
                </div>

                <div style="background:rgba(212,175,55,0.07);border:1px solid rgba(212,175,55,0.28);border-radius:10px;padding:10px 14px;margin-bottom:16px;text-align:center;">
                    <div style="font-size:10px;color:#d4af37;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">Belohnung bei Erfolg</div>
                    <div id="pt-reward" style="font-size:13px;color:#ffe8a0;line-height:1.5;"></div>
                </div>

                <div style="display:flex;gap:10px;justify-content:center;padding-bottom:4px;">
                    <button id="pt-accept" style="flex:1;max-width:180px;padding:13px;background:linear-gradient(180deg,#c8901a,#8c5a08);border:2px solid #d4af37;border-radius:9px;color:#fff;font-size:15px;font-weight:bold;cursor:pointer;touch-action:manipulation;transition:opacity 0.15s;">
                        ⚔ Prüfung annehmen
                    </button>
                    <button id="pt-later" style="flex:1;max-width:120px;padding:13px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.18);border-radius:9px;color:#9fdcff;font-size:13px;cursor:pointer;touch-action:manipulation;">
                        Später
                    </button>
                </div>
            </div>
        `;

        el.appendChild(box);
        document.body.appendChild(el);
        this._el = el;

        document.getElementById('pt-accept').addEventListener('click', () => this._accept());
        document.getElementById('pt-later').addEventListener('click', () => this.hide());
        el.addEventListener('click', (e) => { if (e.target === el) this.hide(); });

        document.getElementById('pt-accept').addEventListener('mouseenter', (e) => { e.target.style.opacity = '0.85'; });
        document.getElementById('pt-accept').addEventListener('mouseleave', (e) => { e.target.style.opacity = '1'; });
    }

    show(trial) {
        this._activeTrial = trial;
        document.getElementById('pt-level-badge').textContent = `Level ${trial.level} Prüfung`;
        const subtitle = ['Starter','Seemann','Korsar','Pirat','Freibeuter','Kapitän','Admiral'][PIRATE_TRIALS.indexOf(trial)] ?? '';
        document.getElementById('pt-subtitle').textContent = subtitle ? `Rang des ${subtitle}` : '';
        document.getElementById('pt-name').textContent = trial.name;
        document.getElementById('pt-desc').textContent = `${trial.desc}`;
        document.getElementById('pt-reward').textContent = trial.rewardText;
        this._updateProgress(trial.progress ?? 0, trial.target);
        this._el.style.display = 'flex';
        this._el.style.animation = 'none';
        requestAnimationFrame(() => { this._el.style.animation = ''; });
    }

    updateProgress(progress, target) {
        this._updateProgress(progress, target);
    }

    _updateProgress(progress, target) {
        const pct = Math.min(100, (progress / target) * 100);
        const bar = document.getElementById('pt-prog-bar');
        const txt = document.getElementById('pt-prog-text');
        if (bar) bar.style.width = `${pct.toFixed(1)}%`;
        if (txt) txt.textContent = `${progress} / ${target}`;
        if (progress >= target && bar) {
            bar.style.background = 'linear-gradient(90deg,#25d15e,#45ff85)';
        }
    }

    _accept() {
        this.scene.startPirateTrial?.(this._activeTrial);
        this.hide();
    }

    hide() { if (this._el) this._el.style.display = 'none'; }
    destroy() { this._el?.remove(); }
}
