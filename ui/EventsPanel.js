export default class EventsPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this._el = null;
        this._activeEvents = new Set();
        this._startTime = Date.now();
        this._build();
        this._bindEvents();
    }

    _events() {
        const elapsed = Math.floor((Date.now() - this._startTime) / 1000);
        return [
            {
                id: 'monster_hunt',
                icon: '🦑',
                title: 'Kraken-Jagd',
                desc: 'Versenke See-Monster für doppelte XP-Belohnungen',
                status: 'Aktiv',
                timeLeft: Math.max(0, 3600 - elapsed),
                accent: '#ff7070',
                reward: '+100% Monster-XP',
                type: 'xp',
                active: true,
            },
            {
                id: 'treasure_hunt',
                icon: '🗺️',
                title: 'Schatz-Flut',
                desc: 'Mehr Loot-Kisten spawnen auf der Karte',
                status: 'Aktiv',
                timeLeft: Math.max(0, 1800 - elapsed),
                accent: '#ffd36a',
                reward: '+50% Loot-Drops',
                type: 'loot',
                active: elapsed < 1800,
            },
            {
                id: 'convoy_raid',
                icon: '⚓',
                title: 'Konvoi-Angriff',
                desc: 'Feindliche Handelskonvois erscheinen – reiche Beute!',
                status: elapsed < 900 ? 'Aktiv' : 'Beendet',
                timeLeft: Math.max(0, 900 - elapsed),
                accent: '#63d6ff',
                reward: '+200% Gold von NPC',
                type: 'gold',
                active: elapsed < 900,
            },
            {
                id: 'xp_weekend',
                icon: '⭐',
                title: 'XP-Wochenende',
                desc: 'Doppelte Erfahrungspunkte für alle Aktivitäten',
                status: 'Kommend',
                timeLeft: 86400,
                accent: '#8bffba',
                reward: '+100% XP überall',
                type: 'xp',
                active: false,
                upcoming: true,
            },
            {
                id: 'sea_storm',
                icon: '🌊',
                title: 'Sturm-Season',
                desc: 'Stärkere Wellen erscheinen – besiegst du sie?',
                status: 'Kommend',
                timeLeft: 172800,
                accent: '#c79fff',
                reward: 'Seltene Schiff-Skins',
                type: 'special',
                active: false,
                upcoming: true,
            },
        ];
    }

    _formatTime(seconds) {
        if (seconds <= 0) return 'Beendet';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'events-panel-overlay';
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
            background:linear-gradient(160deg,#0a1220 0%,#0c1830 100%);
            border:2px solid #ffd36a;
            border-radius:18px;
            box-shadow:0 0 40px rgba(255,211,106,0.2),0 8px 40px rgba(0,0,0,0.8);
            width:min(440px,95vw);
            max-height:90vh;
            overflow-y:auto; overflow-x:hidden;
            padding:0 0 16px 0;
            scrollbar-width:thin; scrollbar-color:#806020 #0a1220;
        `;

        panel.innerHTML = `
            <div style="
                display:flex;align-items:center;justify-content:space-between;
                padding:16px 20px 12px;
                border-bottom:1px solid rgba(255,211,106,0.25);
                position:sticky;top:0;z-index:2;
                background:linear-gradient(160deg,#0a1220 0%,#0c1830 100%);
            ">
                <div>
                    <div style="font-size:18px;font-weight:bold;color:#fff8d0;letter-spacing:1px;">★ See-Events</div>
                    <div style="font-size:12px;color:#ffd36a;margin-top:3px;" id="events-active-count"></div>
                </div>
                <button id="events-close-btn" style="
                    background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);
                    border-radius:50%;color:#fff;font-size:20px;
                    width:36px;height:36px;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;
                ">×</button>
            </div>
            <div style="padding:10px 16px 4px;">
                <div style="font-size:11px;color:#a08030;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">
                    Aktive & Kommende Ereignisse
                </div>
            </div>
            <div id="events-cards" style="padding:4px 14px 0;"></div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
    }

    _bindEvents() {
        document.getElementById('events-close-btn').addEventListener('click', () => this.hide());
        this._el.addEventListener('click', (e) => { if (e.target === this._el) this.hide(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });
    }

    _renderEvents() {
        const events = this._events();
        const activeCount = events.filter(e => e.active).length;

        const countEl = document.getElementById('events-active-count');
        if (countEl) countEl.textContent = `${activeCount} aktive Events • ${events.length - activeCount} kommend`;

        const container = document.getElementById('events-cards');
        if (!container) return;
        container.innerHTML = '';

        events.forEach(ev => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255,255,255,0.04);
                border: 1px solid ${ev.accent}44;
                border-left: 3px solid ${ev.active ? ev.accent : '#444'};
                border-radius: 10px;
                padding: 12px 14px;
                margin-bottom: 8px;
                opacity: ${ev.upcoming ? 0.65 : 1};
            `;

            const statusColor = ev.active ? '#5dde70' : ev.upcoming ? '#ffd36a' : '#ff7070';

            card.innerHTML = `
                <div style="display:flex;align-items:flex-start;gap:10px;">
                    <div style="font-size:26px;flex-shrink:0;line-height:1.2;">${ev.icon}</div>
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                            <div style="font-size:14px;font-weight:bold;color:${ev.accent};">${ev.title}</div>
                            <div style="
                                font-size:10px;font-weight:bold;
                                color:${statusColor};
                                background:${statusColor}22;
                                border:1px solid ${statusColor}44;
                                border-radius:6px;padding:2px 8px;
                                flex-shrink:0;
                            ">${ev.status}</div>
                        </div>
                        <div style="font-size:11px;color:#9fdcff;margin-bottom:6px;">${ev.desc}</div>
                        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
                            <div style="font-size:11px;color:#ffd36a;background:rgba(255,211,106,0.1);border-radius:4px;padding:2px 8px;">
                                🎁 ${ev.reward}
                            </div>
                            <div style="font-size:11px;color:#7ab8d4;">
                                ⏱ ${ev.active ? this._formatTime(ev.timeLeft) : ev.upcoming ? 'in ' + this._formatTime(ev.timeLeft) : '–'}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
    }

    show() {
        this._renderEvents();
        this._el.style.display = 'flex';
        this.visible = true;
        this._timer = setInterval(() => { if (this.visible) this._renderEvents(); }, 1000);
    }

    hide() {
        this._el.style.display = 'none';
        this.visible = false;
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
    }

    toggle() {
        if (this.visible) this.hide(); else this.show();
    }

    destroy() {
        this.hide();
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
    }
}
