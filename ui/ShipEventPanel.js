export default class ShipEventPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._visible = false;
        this._currentEvent = null;
    }

    setEvent(ev) {
        this._currentEvent = ev;
        if (this._visible) this._refresh();
    }

    _getEvents() {
        const now = Date.now();
        const base = [
            {
                id: 'easter',
                icon: '🥚',
                name: '🌸 Oster-Event',
                desc: 'Oster-Hasen, Wächter und der mächtige Oster-König durchstreifen die Meere. Besiege sie für Ostereier und exklusive Belohnungen – sammle die Eier durch genaues Anfahren!',
                ships: 9,
                reward: 'Ostereier • XP & Gold • Oster-Galeone Schiffsplan (Boss)',
                accent: '#ff88cc',
                active: true,
                endsAt: now + 72 * 60 * 60 * 1000,
            },
            {
                id: 'konvoi',
                icon: '⚓',
                name: 'Schiffsdesign-Konvoi',
                desc: 'Ein legendärer Konvoi mit wertvollen Schiffsplänen durchquert die See. Vernichte alle Konvoi-Schiffe und erhalte exklusive Schiffsdesigns!',
                ships: 3, reward: 'Schiffsplan + 1000 Gold', accent: '#d4aa40',
                active: true, endsAt: now + 8 * 60 * 1000
            },
            {
                id: 'geisterschiff',
                icon: '👻',
                name: 'Das Geisterschiff',
                desc: 'Ein Geisterschiff aus einer anderen Zeit erscheint auf der See. Bezwinge es und erhalte außergewöhnliche Beute!',
                ships: 1, reward: 'Seltener Schiffsplan + 2000 Gold', accent: '#88aaff',
                active: true, endsAt: now + 15 * 60 * 1000
            },
            {
                id: 'admiralsjagd',
                icon: '👑',
                name: 'Admiralsjagd',
                desc: 'Der berüchtigte Admiral ist mit seinem Flaggschiff auf See! Bring ihn zur Strecke und erhalte fürstliche Belohnungen.',
                ships: 1, reward: 'Flaggschiff-Schiffsplan + 3500 Gold', accent: '#ff8844',
                active: false, endsAt: now + 25 * 60 * 1000
            }
        ];
        return base;
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'ship-event-panel';
        el.style.cssText = `
            position:fixed; inset:0; z-index:21000;
            display:flex; align-items:center; justify-content:center;
            background:rgba(0,0,0,0.8); font-family:Arial,sans-serif; padding:8px;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            width:100%; max-width:560px; max-height:88vh;
            background:linear-gradient(170deg,#0e1f34 0%,#070f1a 100%);
            border:2px solid #c79a52; border-radius:8px;
            display:flex; flex-direction:column; overflow:hidden;
            box-shadow:0 0 60px rgba(199,154,82,0.2);
        `;

        panel.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid rgba(199,154,82,0.3);">
                <div style="font-size:16px;font-weight:bold;color:#d4aa40;letter-spacing:2px;">⚔ SCHIFFS-EVENTS</div>
                <button id="event-close" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:18px;width:32px;height:32px;border-radius:50%;cursor:pointer;padding:0;touch-action:manipulation;">✕</button>
            </div>
            <div id="event-body" style="flex:1;overflow-y:auto;padding:12px;-webkit-overflow-scrolling:touch;"></div>
        `;

        el.appendChild(panel);
        el.addEventListener('click', (e) => { if (e.target === el) this.hide(); });
        document.body.appendChild(el);
        this._el = el;

        setTimeout(() => {
            document.getElementById('event-close')?.addEventListener('click', () => this.hide());
            this._refresh();
        }, 0);
    }

    _refresh() {
        const body = document.getElementById('event-body');
        if (!body) return;
        body.innerHTML = '';
        const events = this._getEvents();
        const p = this.scene?.player;

        const activeSection = document.createElement('div');
        activeSection.innerHTML = '<div style="font-size:12px;font-weight:bold;color:#ff6060;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">🔴 Aktive Events</div>';
        const inactiveSection = document.createElement('div');
        inactiveSection.innerHTML = '<div style="font-size:12px;font-weight:bold;color:#666;letter-spacing:1px;margin-bottom:8px;margin-top:16px;text-transform:uppercase;">⏳ Kommende Events</div>';

        events.forEach(ev => {
            const card = document.createElement('div');
            const remaining = Math.max(0, Math.floor((ev.endsAt - Date.now()) / 1000));
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;

            card.style.cssText = `
                background:rgba(255,255,255,0.04); border:1px solid ${ev.active ? ev.accent + '66' : 'rgba(255,255,255,0.1)'};
                border-radius:8px; padding:14px; margin-bottom:10px;
                ${ev.active ? `box-shadow: 0 0 20px ${ev.accent}22;` : ''}
            `;

            card.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                    <div style="font-size:28px;flex-shrink:0;">${ev.icon}</div>
                    <div style="flex:1;">
                        <div style="font-size:14px;font-weight:bold;color:${ev.active ? ev.accent : '#888'};">${ev.name}</div>
                        <div style="font-size:11px;color:#666;margin-top:2px;">${ev.ships} ${ev.ships === 1 ? 'Schiff' : 'Schiffe'} • ${ev.active ? `Endet in ${mins}:${String(secs).padStart(2,'0')}` : 'Startet bald'}</div>
                    </div>
                    ${ev.active ? `<div style="width:10px;height:10px;border-radius:50%;background:#ff4444;animation:pulse 1.5s infinite;flex-shrink:0;"></div>` : ''}
                </div>
                <div style="font-size:12px;color:#aaa;line-height:1.5;margin-bottom:10px;">${ev.desc}</div>
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                    <div style="font-size:12px;color:${ev.accent};"><strong>Belohnung:</strong> ${ev.reward}</div>
                    ${ev.active ? `<button data-evid="${ev.id}" style="padding:8px 16px;background:${ev.accent}22;border:1px solid ${ev.accent};color:${ev.accent};border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;touch-action:manipulation;">Jetzt teilnehmen!</button>` : ''}
                </div>
            `;

            const btn = card.querySelector(`[data-evid="${ev.id}"]`);
            if (btn) {
                btn.addEventListener('click', () => this._joinEvent(ev));
            }
            (ev.active ? activeSection : inactiveSection).appendChild(card);
        });

        body.appendChild(activeSection);
        body.appendChild(inactiveSection);

        const style = document.createElement('style');
        style.textContent = '@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }';
        body.appendChild(style);

        this._scheduleRefresh();
    }

    _joinEvent(ev) {
        this.hide();
        if (ev.id === 'easter') {
            this.scene?.startEasterEvent?.();
        } else {
            this.scene?.startShipEvent?.(ev.id);
        }
    }

    _scheduleRefresh() {
        clearTimeout(this._refreshTimer);
        this._refreshTimer = setTimeout(() => { if (this._visible) this._refresh(); }, 1000);
    }

    show() {
        if (this._el) { this._el.style.display = 'flex'; this._visible = true; this._refresh(); return; }
        this._build();
        this._visible = true;
    }
    hide() {
        clearTimeout(this._refreshTimer);
        if (this._el) this._el.style.display = 'none';
        this._visible = false;
    }
    toggle() { if (this._visible) this.hide(); else this.show(); }
    isOpen() { return this._visible; }
    destroy() {
        clearTimeout(this._refreshTimer);
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
        this._el = null;
    }
}
