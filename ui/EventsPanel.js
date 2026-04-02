export default class EventsPanel {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this._el = null;
        this._startTime = Date.now();
        this._joinedEvents = new Set(JSON.parse(localStorage.getItem('az_joined_events') || '[]'));
        this._timer = null;
        this._build();
        this._bindEvents();
    }

    _events() {
        const elapsed = Math.floor((Date.now() - this._startTime) / 1000);
        return [
            {
                id: 'easter_event',
                icon: '🥚', title: '🌸 Oster-Event',
                desc: 'Besiege Oster-Hasen, Wächter & den Oster-König. Sammle Eier, erhalte Gold, XP und den Oster-Galeone Schiffsplan!',
                status: 'Aktiv', timeLeft: 72 * 3600,
                accent: '#ff88cc',
                reward: 'Ostereier • Schiffsplan • Gold & XP',
                bonusDesc: 'Start über Events → Jetzt teilnehmen (Schiffs-Events Panel)',
                type: 'easter', active: true,
            },
            {
                id: 'monster_hunt',
                icon: '🦑', title: 'Kraken-Jagd',
                desc: 'Versenke See-Monster für doppelte XP-Belohnungen',
                status: elapsed < 3600 ? 'Aktiv' : 'Beendet',
                timeLeft: Math.max(0, 3600 - elapsed),
                accent: '#ff7070',
                reward: '+100% Monster-XP',
                bonusDesc: '+2× XP auf alle NPC-Kills für diese Session',
                type: 'xp', active: elapsed < 3600,
            },
            {
                id: 'treasure_hunt',
                icon: '🗺️', title: 'Schatz-Flut',
                desc: 'Mehr Loot-Kisten spawnen auf der Karte',
                status: elapsed < 1800 ? 'Aktiv' : 'Beendet',
                timeLeft: Math.max(0, 1800 - elapsed),
                accent: '#ffd36a',
                reward: '+50% Loot-Drops',
                bonusDesc: 'Nächste 3 Loot-Drops sofort geliefert',
                type: 'loot', active: elapsed < 1800,
            },
            {
                id: 'convoy_raid',
                icon: '⚓', title: 'Konvoi-Angriff',
                desc: 'Feindliche Handelskonvois erscheinen – reiche Beute!',
                status: elapsed < 900 ? 'Aktiv' : 'Beendet',
                timeLeft: Math.max(0, 900 - elapsed),
                accent: '#63d6ff',
                reward: '+200% Gold von NPCs',
                bonusDesc: '+200 Gold Sofort-Bonus beim Beitreten',
                type: 'gold', active: elapsed < 900,
            },
            {
                id: 'storm_season',
                icon: '⛈️', title: 'Sturm-Season',
                desc: 'Stärkere Wellen – besiegst du sie alle?',
                status: 'Startet in',
                timeLeft: 14400,
                accent: '#c79fff',
                reward: 'Seltene Schiff-Skins',
                bonusDesc: 'Frühbuch-Bonus: +50 Mats beim Start',
                type: 'special', active: false, upcoming: true,
            },
            {
                id: 'xp_weekend',
                icon: '⭐', title: 'XP-Wochenende',
                desc: 'Doppelte Erfahrungspunkte für alle Aktivitäten',
                status: 'Startet in',
                timeLeft: 86400,
                accent: '#8bffba',
                reward: '+100% XP überall',
                bonusDesc: 'Gilt automatisch für alle Spieler',
                type: 'xp', active: false, upcoming: true,
            },
        ];
    }

    _formatTime(s) {
        if (s <= 0) return 'Beendet';
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${sec}s`;
        return `${sec}s`;
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'events-panel-overlay';
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
            background: linear-gradient(160deg, #0a1220 0%, #0c1830 100%);
            border: 2px solid #ffd36a; border-radius: 18px;
            box-shadow: 0 0 40px rgba(255,211,106,0.2), 0 8px 40px rgba(0,0,0,0.8);
            width: min(460px, 96vw);
            max-height: calc(100dvh - 80px);
            overflow-y: auto; overflow-x: hidden;
            padding: 0 0 20px 0;
            scrollbar-width: thin; scrollbar-color: #806020 #0a1220;
            margin-bottom: 10px;
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
                    <div style="font-size:19px;font-weight:bold;color:#fff8d0;letter-spacing:1px;">★ See-Events</div>
                    <div id="events-active-count" style="font-size:12px;color:#ffd36a;margin-top:3px;"></div>
                </div>
                <button id="events-close-btn" style="
                    background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);
                    border-radius:50%;color:#fff;font-size:22px;
                    width:40px;height:40px;cursor:pointer;
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;
                    touch-action:manipulation;-webkit-tap-highlight-color:transparent;
                ">×</button>
            </div>
            <div style="padding:10px 16px 4px;">
                <div style="font-size:10px;color:#806020;letter-spacing:1px;text-transform:uppercase;font-weight:bold;">
                    Aktive & Kommende Ereignisse
                </div>
            </div>
            <div id="events-cards" style="padding:4px 14px 0;"></div>

            <div style="margin:10px 14px 0;padding:14px 16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,211,106,0.15);">
                <div style="font-size:11px;font-weight:bold;color:#ffd36a;margin-bottom:10px;letter-spacing:0.5px;">📅 EVENT-KALENDER</div>
                <div id="events-calendar"></div>
            </div>
        `;

        el.appendChild(panel);
        document.body.appendChild(el);
        this._el = el;
    }

    _bindEvents() {
        const closeBtn = document.getElementById('events-close-btn');
        const doClose = (e) => { e.preventDefault(); this.hide(); };
        closeBtn.addEventListener('click', doClose);
        closeBtn.addEventListener('touchend', doClose, { passive: false });

        this._el.addEventListener('click', (e) => { if (e.target === this._el) this.hide(); });
        this._el.addEventListener('touchend', (e) => { if (e.target === this._el) this.hide(); }, { passive: false });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });
    }

    _renderEvents() {
        const events = this._events();
        const activeCount = events.filter(e => e.active).length;

        const countEl = document.getElementById('events-active-count');
        if (countEl) countEl.textContent = `${activeCount} aktiv • ${events.filter(e=>e.upcoming).length} kommend`;

        const container = document.getElementById('events-cards');
        if (!container) return;
        container.innerHTML = '';

        events.forEach(ev => {
            const joined = this._joinedEvents.has(ev.id);
            const statusColor = ev.active ? '#5dde70' : ev.upcoming ? '#ffd36a' : '#ff7070';

            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255,255,255,0.04);
                border: 1px solid ${ev.accent}44;
                border-left: 3px solid ${ev.active ? ev.accent : '#333'};
                border-radius: 10px;
                padding: 12px 14px; margin-bottom: 8px;
                opacity: ${ev.upcoming ? 0.7 : 1};
            `;
            card.innerHTML = `
                <div style="display:flex;align-items:flex-start;gap:10px;">
                    <div style="font-size:28px;flex-shrink:0;line-height:1.1;">${ev.icon}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;gap:6px;">
                            <div style="font-size:14px;font-weight:bold;color:${ev.accent};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ev.title}</div>
                            <div style="
                                font-size:9px;font-weight:bold;color:${statusColor};
                                background:${statusColor}22;border:1px solid ${statusColor}44;
                                border-radius:5px;padding:2px 7px;flex-shrink:0;white-space:nowrap;
                            ">${ev.status}</div>
                        </div>
                        <div style="font-size:11px;color:#9fdcff;margin-bottom:6px;">${ev.desc}</div>
                        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:${ev.active ? 8 : 0}px;">
                            <div style="font-size:11px;color:#ffd36a;background:rgba(255,211,106,0.1);border-radius:4px;padding:2px 8px;">🎁 ${ev.reward}</div>
                            <div style="font-size:11px;color:#7ab8d4;">⏱ ${ev.active ? this._formatTime(ev.timeLeft) : ev.upcoming ? 'in ' + this._formatTime(ev.timeLeft) : 'Beendet'}</div>
                        </div>
                        ${ev.active ? `
                            <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
                                <div style="font-size:10px;color:#7a8a9a;flex:1;">${ev.bonusDesc}</div>
                                <button data-event-id="${ev.id}" style="
                                    background:${joined ? 'rgba(93,222,112,0.15)' : `${ev.accent}`};
                                    color:${joined ? '#5dde70' : '#000'};
                                    border:${joined ? '1px solid #5dde7066' : 'none'};
                                    border-radius:7px;font-size:10px;font-weight:bold;
                                    padding:6px 12px;cursor:${joined ? 'default' : 'pointer'};
                                    flex-shrink:0;white-space:nowrap;
                                    touch-action:manipulation;
                                ">${joined ? '✓ Beigetreten' : 'Beitreten'}</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            if (ev.active && !joined) {
                const btn = card.querySelector('[data-event-id]');
                if (btn) {
                    const doJoin = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this._joinEvent(ev);
                    };
                    btn.addEventListener('click', doJoin);
                    btn.addEventListener('touchend', doJoin, { passive: false });
                }
            }

            container.appendChild(card);
        });

        const cal = document.getElementById('events-calendar');
        if (cal) {
            const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
            const today = new Date().getDay();
            cal.innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
                    ${days.map((d, i) => {
                        const isToday = (i + 1) % 7 === today % 7;
                        const hasEvent = [1, 4, 6].includes(i);
                        return `
                            <div style="
                                text-align:center;padding:6px 2px;
                                background:${isToday ? 'rgba(255,211,106,0.15)' : 'rgba(255,255,255,0.03)'};
                                border:1px solid ${isToday ? '#ffd36a55' : '#ffffff11'};
                                border-radius:7px;
                            ">
                                <div style="font-size:9px;color:#888;">${d}</div>
                                <div style="font-size:14px;">${hasEvent ? (isToday ? '🌟' : '📅') : '–'}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="font-size:10px;color:#666;margin-top:8px;text-align:center;">Events laufen täglich Mo, Do, Sa</div>
            `;
        }
    }

    _joinEvent(ev) {
        const p = this.scene.player;
        this._joinedEvents.add(ev.id);
        localStorage.setItem('az_joined_events', JSON.stringify([...this._joinedEvents]));

        if (ev.type === 'easter') {
            this.hide();
            this.scene?.startEasterEvent?.();
            return;
        } else if (ev.type === 'gold' && p) {
            p.gold += 200;
            this.scene.showStatusMsg(`⚓ Konvoi-Angriff beigetreten! +200 Gold Sofort-Bonus`, 0x63d6ff);
        } else if (ev.type === 'xp') {
            this.scene.showStatusMsg(`🦑 Kraken-Jagd aktiv! XP-Boost läuft`, 0xff7070);
        } else if (ev.type === 'loot') {
            this.scene.showStatusMsg(`🗺️ Schatz-Flut aktiv! Mehr Loot spawnt`, 0xffd36a);
        } else {
            this.scene.showStatusMsg(`★ Event beigetreten: ${ev.title}`, 0xffd36a);
        }
        this.scene.updateUIBars?.();
        this._renderEvents();
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

    toggle() { if (this.visible) this.hide(); else this.show(); }

    destroy() {
        this.hide();
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
    }
}
