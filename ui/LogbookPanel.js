export default class LogbookPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._feedMessages = [];
        this._build();
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'logbook-panel';
        el.style.cssText = `
            position:fixed;top:52px;right:10px;
            width:min(360px,96vw);z-index:12000;
            display:none;flex-direction:column;
            background:linear-gradient(180deg,rgba(6,16,38,0.97),rgba(3,10,24,0.97));
            border:2px solid rgba(74,200,255,0.4);border-radius:14px;
            box-shadow:0 6px 40px rgba(0,0,0,0.7),0 0 30px rgba(74,200,255,0.06);
            font-family:Arial,sans-serif;overflow:hidden;max-height:82vh;
        `;
        el.innerHTML = `
            <div style="background:linear-gradient(180deg,rgba(0,25,55,0.9),rgba(0,10,28,0.9));padding:12px 16px;border-bottom:1px solid rgba(74,200,255,0.3);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                <div>
                    <div style="font-size:10px;letter-spacing:2.5px;color:#4ac8ff;text-transform:uppercase;">📜 Schiffslogbuch</div>
                    <div id="lb-session" style="font-size:10px;color:#8fd8ff;margin-top:2px;">Aktuelle Sitzung</div>
                </div>
                <button id="lb-close" style="background:none;border:none;color:#9fdcff;font-size:20px;cursor:pointer;padding:4px 6px;line-height:1;">✕</button>
            </div>

            <!-- Tab bar -->
            <div style="display:flex;border-bottom:1px solid rgba(74,200,255,0.2);flex-shrink:0;">
                <button id="lb-tab-feed"  class="lb-tab lb-tab-active" style="flex:1;padding:8px 4px;font-size:11px;font-weight:bold;letter-spacing:1px;cursor:pointer;border:none;background:rgba(74,200,255,0.12);color:#4ac8ff;border-bottom:2px solid #4ac8ff;">📋 AKTIVITÄT</button>
                <button id="lb-tab-stats" class="lb-tab"               style="flex:1;padding:8px 4px;font-size:11px;font-weight:bold;letter-spacing:1px;cursor:pointer;border:none;background:none;color:#5a7a9a;border-bottom:2px solid transparent;">📊 STATISTIK</button>
            </div>

            <div id="lb-body" style="padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;"></div>
        `;
        document.body.appendChild(el);
        this._el = el;
        this._bodyEl = document.getElementById('lb-body');
        document.getElementById('lb-close').addEventListener('click', () => this.hide());

        this._activeTab = 'feed';
        document.getElementById('lb-tab-feed').addEventListener('click',  () => this._switchTab('feed'));
        document.getElementById('lb-tab-stats').addEventListener('click', () => this._switchTab('stats'));
    }

    _switchTab(tab) {
        this._activeTab = tab;
        const feedBtn  = document.getElementById('lb-tab-feed');
        const statsBtn = document.getElementById('lb-tab-stats');
        if (!feedBtn || !statsBtn) return;
        if (tab === 'feed') {
            feedBtn.style.cssText  = 'flex:1;padding:8px 4px;font-size:11px;font-weight:bold;letter-spacing:1px;cursor:pointer;border:none;background:rgba(74,200,255,0.12);color:#4ac8ff;border-bottom:2px solid #4ac8ff;';
            statsBtn.style.cssText = 'flex:1;padding:8px 4px;font-size:11px;font-weight:bold;letter-spacing:1px;cursor:pointer;border:none;background:none;color:#5a7a9a;border-bottom:2px solid transparent;';
        } else {
            statsBtn.style.cssText = 'flex:1;padding:8px 4px;font-size:11px;font-weight:bold;letter-spacing:1px;cursor:pointer;border:none;background:rgba(74,200,255,0.12);color:#4ac8ff;border-bottom:2px solid #4ac8ff;';
            feedBtn.style.cssText  = 'flex:1;padding:8px 4px;font-size:11px;font-weight:bold;letter-spacing:1px;cursor:pointer;border:none;background:none;color:#5a7a9a;border-bottom:2px solid transparent;';
        }
        this._render();
    }

    refresh() {
        if (!this._el || this._el.style.display === 'none') return;
        this._render();
    }

    refreshFeed(msgs) {
        this._feedMessages = msgs ?? [];
        if (this._el?.style.display !== 'none' && this._activeTab === 'feed') {
            this._render();
        }
    }

    _render() {
        if (!this._bodyEl) return;
        if (this._activeTab === 'feed') {
            this._renderFeed();
        } else {
            this._renderStats();
        }
    }

    _renderFeed() {
        if (!this._bodyEl) return;
        const msgs = this._feedMessages.length > 0
            ? this._feedMessages
            : (this.scene._feedMessages ?? []);

        this._bodyEl.innerHTML = '';

        if (!msgs.length) {
            const empty = document.createElement('div');
            empty.style.cssText = 'text-align:center;color:#3a5a7a;font-size:12px;padding:24px 0;';
            empty.textContent = 'Noch keine Aktivität in dieser Sitzung.';
            this._bodyEl.appendChild(empty);
            return;
        }

        msgs.forEach(({ ts, msg }) => {
            const row = document.createElement('div');
            row.style.cssText = `
                display:flex;align-items:flex-start;gap:8px;
                padding:7px 10px;border-radius:7px;
                background:rgba(255,255,255,0.03);
                border-left:2px solid rgba(74,200,255,0.2);
            `;
            row.innerHTML = `
                <span style="font-size:10px;color:#3a6a8a;flex-shrink:0;padding-top:1px;">${ts}</span>
                <span style="font-size:11px;color:#c0dff0;line-height:1.4;">${msg}</span>
            `;
            this._bodyEl.appendChild(row);
        });
    }

    _renderStats() {
        if (!this._bodyEl) return;
        const lb = this.scene._logbook ?? {};
        const p  = this.scene.player;

        const stats = [
            { icon: '⚔',  label: 'Schiffe versenkt',       val: (lb.npc_kills ?? 0).toLocaleString() },
            { icon: '🐙',  label: 'Monster besiegt',        val: (lb.monster_kills ?? 0).toLocaleString() },
            { icon: '💀',  label: 'Gesamtabschüsse',        val: ((lb.npc_kills ?? 0) + (lb.monster_kills ?? 0)).toLocaleString() },
            null,
            { icon: '💣',  label: 'Schüsse abgefeuert',     val: (lb.shots_fired ?? 0).toLocaleString() },
            { icon: '💥',  label: 'Schaden verursacht',     val: (lb.damage_dealt ?? 0).toLocaleString() },
            null,
            { icon: '🪙',  label: 'Gold gesammelt',         val: (lb.gold_total ?? 0).toLocaleString() },
            { icon: '🪨',  label: 'Materialien gesammelt',  val: (lb.mats_total ?? 0).toLocaleString() },
            { icon: '🗝',  label: 'Schatztruhen geöffnet',  val: (lb.treasures_opened ?? 0).toLocaleString() },
            null,
            { icon: '🧪',  label: 'HP geheilt (gesamt)',    val: (lb.hp_healed ?? 0).toLocaleString() },
            { icon: '🎒',  label: 'Items benutzt',          val: (lb.items_used ?? 0).toLocaleString() },
            null,
            { icon: '🗺',  label: 'Seekarten erkundet',     val: (lb.charts_explored?.size ?? 0).toLocaleString() },
            { icon: '⚓',  label: 'Aktueller Level',        val: (p?.level ?? 1).toLocaleString() },
            { icon: '⭐',  label: 'Gesamterfahrung (XP)',   val: (p?.xp ?? 0).toLocaleString() },
        ];

        this._bodyEl.innerHTML = '';
        const section = document.createElement('div');
        section.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
        stats.forEach(s => {
            if (!s) {
                const sep = document.createElement('div');
                sep.style.cssText = 'height:1px;background:rgba(74,200,255,0.12);margin:4px 0;';
                section.appendChild(sep);
                return;
            }
            const row = document.createElement('div');
            row.style.cssText = `
                display:flex;align-items:center;justify-content:space-between;
                padding:6px 10px;border-radius:7px;
                background:rgba(255,255,255,0.03);
            `;
            row.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:16px;width:20px;text-align:center;">${s.icon}</span>
                    <span style="font-size:12px;color:#8fd8ff;">${s.label}</span>
                </div>
                <span style="font-size:13px;font-weight:bold;color:#fff;">${s.val}</span>
            `;
            section.appendChild(row);
        });

        const footer = document.createElement('div');
        footer.style.cssText = 'font-size:9px;color:#3a5a7a;text-align:center;padding-top:4px;';
        footer.textContent = 'Statistiken werden mit dem Spielstand gespeichert';
        this._bodyEl.appendChild(section);
        this._bodyEl.appendChild(footer);
    }

    toggle() { this._el.style.display === 'none' ? this.show() : this.hide(); }
    show()   { this._feedMessages = this.scene._feedMessages ?? []; this._render(); this._el.style.display = 'flex'; }
    hide()   { this._el.style.display = 'none'; }
    destroy(){ this._el?.remove(); }
}
